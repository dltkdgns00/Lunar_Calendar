import { generateBirthdayEvents, convertLunarToSolar } from './lunar.js';
import { generateICS, downloadICSFile } from './ics.js';

// DOM 요소 참조
const form = document.getElementById('lunarForm');
const personNameInput = document.getElementById('personName');
const birthYearInput = document.getElementById('birthYear');
const lunarMonthSelect = document.getElementById('lunarMonth');
const lunarDaySelect = document.getElementById('lunarDay');
const isLeapMonthCheckbox = document.getElementById('isLeapMonth');
const fallbackTo29thCheckbox = document.getElementById('fallbackTo29th');
const instantSolarBox = document.getElementById('instantSolarBox');
const startYearInput = document.getElementById('startYear');
const countYearsSelect = document.getElementById('countYears');
const alarmTypeSelect = document.getElementById('alarmType');
const titleTemplateInput = document.getElementById('titleTemplate');
const eventDescriptionInput = document.getElementById('eventDescription');

const downloadBtn = document.getElementById('downloadBtn');
const previewBtn = document.getElementById('previewBtn');
const previewBtnText = document.getElementById('previewBtnText');
const closePreviewBtn = document.getElementById('closePreviewBtn');
const previewSection = document.getElementById('previewSection');
const previewSummaryTitle = document.getElementById('previewSummaryTitle');
const previewCountBadge = document.getElementById('previewCountBadge');
const previewTableBody = document.getElementById('previewTableBody');

const shareBtn = document.getElementById('shareBtn');
const resetBtn = document.getElementById('resetBtn');

// 공유 링크로 접속 시 노출되는 배너 요소
const sharedBanner = document.getElementById('sharedBanner');
const sharedBannerTitle = document.getElementById('sharedBannerTitle');
const sharedBannerSub = document.getElementById('sharedBannerSub');
const bannerNameInput = document.getElementById('bannerNameInput');
const bannerDownloadBtn = document.getElementById('bannerDownloadBtn');

const toastContainer = document.getElementById('toastContainer');

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

// 상태
let isTitleManuallyEdited = false;
let isPreviewOpen = false;

// 초기화
function init() {
  const currentYear = new Date().getFullYear();
  startYearInput.value = currentYear;

  // 1~12월 채우기
  lunarMonthSelect.innerHTML = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return `<option value="${m}">${m}월</option>`;
  }).join('');

  // 1~30일 채우기
  lunarDaySelect.innerHTML = Array.from({ length: 30 }, (_, i) => {
    const d = i + 1;
    return `<option value="${d}">${d}일</option>`;
  }).join('');

  // 기본값 설정
  lunarMonthSelect.value = '1';
  lunarDaySelect.value = '1';

  // 1. URL 파라미터 확인 및 상태 복원
  const { hasParams, isAutoDownload } = loadFromUrlParams();

  // 2. 이벤트 리스너 바인딩
  personNameInput.addEventListener('input', () => {
    syncTitleWithName();
    onFormChange();
  });

  titleTemplateInput.addEventListener('input', () => {
    if (!titleTemplateInput.value.trim()) {
      isTitleManuallyEdited = false;
      syncTitleWithName();
    } else {
      isTitleManuallyEdited = true;
    }
    onFormChange();
  });

  birthYearInput.addEventListener('input', () => {
    updateInstantSolarDisplay();
    onFormChange();
  });

  lunarMonthSelect.addEventListener('change', () => {
    updateInstantSolarDisplay();
    onFormChange();
  });

  lunarDaySelect.addEventListener('change', () => {
    updateInstantSolarDisplay();
    onFormChange();
  });

  isLeapMonthCheckbox.addEventListener('change', () => {
    updateInstantSolarDisplay();
    onFormChange();
  });

  fallbackTo29thCheckbox.addEventListener('change', () => {
    updateInstantSolarDisplay();
    onFormChange();
  });

  startYearInput.addEventListener('input', onFormChange);
  countYearsSelect.addEventListener('change', onFormChange);
  alarmTypeSelect.addEventListener('change', onFormChange);
  eventDescriptionInput.addEventListener('input', onFormChange);

  // 3. 버튼 이벤트
  previewBtn.addEventListener('click', togglePreview);
  if (closePreviewBtn) {
    closePreviewBtn.addEventListener('click', closePreview);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleDownload();
  });

  shareBtn.addEventListener('click', handleShare);
  resetBtn.addEventListener('click', handleReset);

  if (bannerDownloadBtn) {
    bannerDownloadBtn.addEventListener('click', handleDownload);
  }

  // 초기 렌더링
  if (!hasParams) {
    syncTitleWithName();
  }
  updateInstantSolarDisplay();

  // 만약 공유 링크로 접속한 경우: 상단 배너 표시 (이름 확인 및 원클릭 저장 유도)
  if (hasParams) {
    setupSharedBanner();
    showToast(`🎂 ${personNameInput.value.trim() || '가족'}님의 음력 생일이 도착했습니다!\n내 캘린더에 표시할 이름을 확인 후 저장하세요.`, 'info', 4500);
  }
}

/**
 * 폼 값 변경 시 공통 처리
 */
function onFormChange() {
  updateUrlParams();
  if (isPreviewOpen) {
    updateLivePreview();
  }
}

/**
 * 이름 입력에 따른 이벤트 제목 자동 동기화
 */
function syncTitleWithName() {
  const name = personNameInput.value.trim();
  if (!isTitleManuallyEdited) {
    if (name) {
      titleTemplateInput.value = `${name}님의 음력 생일`;
    } else {
      titleTemplateInput.value = '';
    }
  }
  titleTemplateInput.placeholder = name
    ? `${name}님의 음력 생일`
    : '예: 어머니님의 음력 생일';
}

/**
 * 선택된 음력 생일에 대한 실시간 양력 날짜 표시 (폼 바로 아래 카드)
 */
function updateInstantSolarDisplay() {
  if (!instantSolarBox) return;

  const currentYear = new Date().getFullYear();
  const birthYear = birthYearInput.value ? parseInt(birthYearInput.value, 10) : null;
  const lunarMonth = parseInt(lunarMonthSelect.value, 10);
  const lunarDay = parseInt(lunarDaySelect.value, 10);
  const isLeap = isLeapMonthCheckbox.checked;
  const fallback = fallbackTo29thCheckbox.checked;

  const thisYearSolar = convertLunarToSolar(currentYear, lunarMonth, lunarDay, isLeap, fallback);

  let birthYearSolar = null;
  if (birthYear && birthYear >= 1900 && birthYear <= 2100) {
    birthYearSolar = convertLunarToSolar(birthYear, lunarMonth, lunarDay, isLeap, fallback);
  }

  if (!thisYearSolar && !birthYearSolar) {
    instantSolarBox.innerHTML = `
      <div class="instant-solar-error">
        ⚠️ 선택하신 음력 날짜(${lunarMonth}월 ${lunarDay}일${isLeap ? ' 윤달' : ''})는 유효한 양력으로 변환할 수 없습니다. 날짜를 확인해주세요.
      </div>
    `;
    return;
  }

  let html = `<div class="instant-solar-content">`;

  if (birthYearSolar) {
    const bDate = new Date(birthYearSolar.year, birthYearSolar.month - 1, birthYearSolar.day);
    const bDayOfWeek = DAY_NAMES[bDate.getDay()];
    const isWeekend = bDayOfWeek === '토' || bDayOfWeek === '일';
    const adjustedText = birthYearSolar.isAdjusted ? ' <span class="tag tag-warning">29일 보정</span>' : '';

    html += `
      <div class="instant-solar-item main-item">
        <span class="instant-label">🎂 태어난 날(출생일) 양력:</span>
        <strong class="instant-value">${birthYearSolar.year}년 ${birthYearSolar.month}월 ${birthYearSolar.day}일 <span class="${isWeekend ? 'day-weekend' : ''}">(${bDayOfWeek}요일)</span></strong>
        ${adjustedText}
      </div>
    `;
  }

  if (thisYearSolar) {
    const tDate = new Date(thisYearSolar.year, thisYearSolar.month - 1, thisYearSolar.day);
    const tDayOfWeek = DAY_NAMES[tDate.getDay()];
    const isWeekend = tDayOfWeek === '토' || tDayOfWeek === '일';
    const adjustedText = thisYearSolar.isAdjusted ? ' <span class="tag tag-warning">29일 보정</span>' : '';

    html += `
      <div class="instant-solar-item">
        <span class="instant-label">📅 올해(${currentYear}년) 양력 생일:</span>
        <strong class="instant-value">${thisYearSolar.year}년 ${thisYearSolar.month}월 ${thisYearSolar.day}일 <span class="${isWeekend ? 'day-weekend' : ''}">(${tDayOfWeek}요일)</span></strong>
        ${adjustedText}
      </div>
    `;
  }

  if (!birthYear) {
    html += `
      <p class="instant-solar-hint">
        💡 출생 연도를 입력하시면 태어난 해의 실제 양력 생일도 함께 확인하실 수 있습니다.
      </p>
    `;
  }

  html += `</div>`;
  instantSolarBox.innerHTML = html;
}

/**
 * 폼 입력값 수집
 */
function getFormData(isForDownload = false) {
  const name = personNameInput.value.trim();
  if (isForDownload && !name) {
    personNameInput.focus();
    showToast('⚠️ 생일을 저장할 대상의 이름을 입력해주세요.', 'warning');
    return null;
  }

  const birthYear = birthYearInput.value ? parseInt(birthYearInput.value, 10) : null;
  const lunarMonth = parseInt(lunarMonthSelect.value, 10) || 1;
  const lunarDay = parseInt(lunarDaySelect.value, 10) || 1;
  const isLeapMonth = isLeapMonthCheckbox.checked;
  const fallbackTo29th = fallbackTo29thCheckbox.checked;

  const startYear = parseInt(startYearInput.value, 10) || new Date().getFullYear();
  const countYears = parseInt(countYearsSelect.value, 10) || 10;
  const alarmType = alarmTypeSelect.value;

  let rawTitle = titleTemplateInput.value.trim();
  if (!rawTitle) {
    rawTitle = name ? `${name}님의 음력 생일` : '음력 생일';
  }

  const description = eventDescriptionInput.value.trim();

  return {
    name: name || '생일 대상자',
    rawName: name,
    birthLunarYear: birthYear,
    lunarMonth,
    lunarDay,
    isLeapMonth,
    startYear,
    countYears,
    fallbackTo29th,
    titleTemplate: rawTitle,
    description,
    alarmType,
  };
}

/**
 * 실시간 미리보기 갱신
 */
function updateLivePreview() {
  const formData = getFormData(false);
  if (!formData) return;

  const events = generateBirthdayEvents(formData);
  renderPreview(events, formData);
}

/**
 * 미리보기 열기 / 닫기
 */
function togglePreview() {
  if (isPreviewOpen) {
    closePreview();
  } else {
    openPreview();
  }
}

function openPreview() {
  isPreviewOpen = true;
  previewSection.classList.remove('hidden');
  if (previewBtnText) previewBtnText.textContent = '양력 날짜 미리보기 접기';
  updateLivePreview();
  previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closePreview() {
  isPreviewOpen = false;
  previewSection.classList.add('hidden');
  if (previewBtnText) previewBtnText.textContent = '양력 날짜 미리보기';
}

/**
 * 캘린더 파일 다운로드 실행 및 피드백
 */
function handleDownload() {
  const formData = getFormData(true);
  if (!formData) return;

  const events = generateBirthdayEvents(formData);
  if (!events || events.length === 0) {
    showToast('⚠️ 해당 조건에 맞는 음력 날짜를 양력으로 변환할 수 없습니다.', 'warning');
    return;
  }

  const icsContent = generateICS(events, formData.alarmType);
  const safeName = formData.name.replace(/[/\\?%*:|"<>]/g, '');
  const filename = `${safeName}_음력생일_${formData.startYear}~${formData.startYear + formData.countYears - 1}.ics`;

  downloadICSFile(icsContent, filename);

  // 다운로드 완료 피드백 토스트
  showToast(`🎉 ${formData.name}님의 캘린더 파일이 다운로드되었습니다!\n파일을 열어 '캘린더에 모두 추가'를 눌러주세요.`, 'success', 5000);

  // 버튼 인터랙션
  const originalHtml = downloadBtn.innerHTML;
  downloadBtn.innerHTML = `<span class="btn-icon">✓</span> 다운로드 완료!`;
  downloadBtn.style.backgroundColor = '#10b981';
  setTimeout(() => {
    downloadBtn.innerHTML = originalHtml;
    downloadBtn.style.backgroundColor = '';
  }, 2500);
}

/**
 * 미리보기 테이블 렌더링
 */
function renderPreview(events, formData) {
  if (!events || events.length === 0) {
    previewTableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">
          변환할 수 있는 날짜가 없습니다. 날짜 설정을 확인해주세요.
        </td>
      </tr>
    `;
    return;
  }

  const leapText = formData.isLeapMonth ? ' (윤달)' : '';
  const displayName = formData.rawName ? `${formData.rawName}님의 ` : '';
  previewSummaryTitle.textContent = `${displayName}음력 ${formData.lunarMonth}월 ${formData.lunarDay}일${leapText} 생일`;
  previewCountBadge.textContent = `총 ${events.length}개 연도`;

  previewTableBody.innerHTML = events.map((event) => {
    let noteBadge = '';
    if (event.isAdjusted) {
      noteBadge = `<span class="tag tag-warning" title="음력 30일이 없는 소월로 29일로 보정됨">29일 보정</span>`;
    }

    let ageDisplay = '-';
    if (event.age !== null) {
      if (event.age === 61) {
        ageDisplay = `<strong>${event.age}세</strong> <span class="tag tag-special">환갑</span>`;
      } else if (event.age === 70) {
        ageDisplay = `<strong>${event.age}세</strong> <span class="tag tag-special">칠순</span>`;
      } else if (event.age === 80) {
        ageDisplay = `<strong>${event.age}세</strong> <span class="tag tag-special">팔순</span>`;
      } else {
        ageDisplay = `${event.age}세`;
      }
    }

    const isWeekend = event.dayOfWeek === '토' || event.dayOfWeek === '일';
    const dayClass = isWeekend ? 'day-weekend' : '';

    return `
      <tr>
        <td class="cell-year">${event.solarYear}년</td>
        <td class="cell-date"><strong>${event.solarDateString}</strong></td>
        <td class="cell-day ${dayClass}">${event.dayOfWeek}요일</td>
        <td class="cell-age">${ageDisplay}</td>
        <td class="cell-note">${noteBadge}</td>
      </tr>
    `;
  }).join('');
}

/* ==========================================================================
   공유하기 기능 (Web Share API & 클립보드 복사)
   ========================================================================== */

/**
 * 공유하기 버튼 클릭 처리
 */
async function handleShare() {
  const name = personNameInput.value.trim() || '가족';
  const month = lunarMonthSelect.value;
  const day = lunarDaySelect.value;
  const isLeap = isLeapMonthCheckbox.checked;
  const leapText = isLeap ? ' (윤달)' : '';

  const currentYear = new Date().getFullYear();
  const thisYearSolar = convertLunarToSolar(currentYear, parseInt(month, 10), parseInt(day, 10), isLeap, true);

  let solarText = '';
  if (thisYearSolar) {
    const d = new Date(thisYearSolar.year, thisYearSolar.month - 1, thisYearSolar.day);
    solarText = `올해 양력 생일은 ${thisYearSolar.year}년 ${thisYearSolar.month}월 ${thisYearSolar.day}일(${DAY_NAMES[d.getDay()]})입니다.`;
  }

  // 공유용 URL 생성 (auto=1 파라미터를 붙여 링크 클릭 시 즉시 다운로드 유도)
  const shareUrl = buildShareUrl(true);
  const shareTitle = `🌙 ${name}님의 음력 생일 (${month}월 ${day}일${leapText})`;
  const shareBody = `${shareTitle}\n${solarText}\n링크를 누르면 캘린더에 바로 저장할 수 있습니다!\n${shareUrl}`;

  // 모바일 환경 등 navigator.share 지원 시
  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: `${shareTitle}\n${solarText}\n링크를 누르면 캘린더에 바로 저장할 수 있습니다!`,
        url: shareUrl,
      });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return; // 사용자가 공유 취소
    }
  }

  // 미지원 환경 (PC 등): 클립보드 복사
  copyToClipboard(shareBody, '📋 공유 링크가 복사되었습니다! 카카오톡에 붙여넣어 공유하세요.');
}

/**
 * 공유용 전체 URL 생성
 */
function buildShareUrl(autoDownload = true) {
  const name = personNameInput.value.trim();
  const byear = birthYearInput.value.trim();
  const month = lunarMonthSelect.value;
  const day = lunarDaySelect.value;
  const leap = isLeapMonthCheckbox.checked ? '1' : '';

  const params = new URLSearchParams();
  if (name) params.set('name', name);
  if (byear) params.set('byear', byear);
  if (month) params.set('m', month);
  if (day) params.set('d', day);
  if (leap) params.set('leap', '1');
  if (autoDownload) params.set('auto', '1');

  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

async function copyToClipboard(text, successMsg) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMsg, 'success');
  } catch (err) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(successMsg, 'success');
  }
}

/**
 * 공유받은 링크로 접속했을 때 상단 배너 설정 (호칭/이름 확인 및 즉시 저장)
 */
function setupSharedBanner() {
  if (!sharedBanner) return;

  const currentYear = new Date().getFullYear();
  const name = personNameInput.value.trim() || '가족';
  const month = parseInt(lunarMonthSelect.value, 10);
  const day = parseInt(lunarDaySelect.value, 10);
  const isLeap = isLeapMonthCheckbox.checked;
  const leapText = isLeap ? ' (윤달)' : '';

  const thisYearSolar = convertLunarToSolar(currentYear, month, day, isLeap, true);
  let solarText = '';
  if (thisYearSolar) {
    const d = new Date(thisYearSolar.year, thisYearSolar.month - 1, thisYearSolar.day);
    solarText = `올해 양력 생일은 <strong>${thisYearSolar.year}년 ${thisYearSolar.month}월 ${thisYearSolar.day}일(${DAY_NAMES[d.getDay()]})</strong>입니다.`;
  }

  if (sharedBannerTitle) {
    sharedBannerTitle.textContent = `🎂 음력 ${month}월 ${day}일${leapText} 생일이 도착했습니다!`;
  }
  if (sharedBannerSub) {
    sharedBannerSub.innerHTML = `${solarText} 내 캘린더에 저장할 호칭(이름)을 확인하고 저장하세요.`;
  }
  if (bannerNameInput) {
    bannerNameInput.value = name;
    bannerNameInput.addEventListener('input', () => {
      personNameInput.value = bannerNameInput.value;
      syncTitleWithName();
      onFormChange();
    });
  }

  if (bannerDownloadBtn) {
    bannerDownloadBtn.onclick = () => {
      if (bannerNameInput && bannerNameInput.value.trim()) {
        personNameInput.value = bannerNameInput.value.trim();
        syncTitleWithName();
      }
      handleDownload();
    };
  }

  sharedBanner.classList.remove('hidden');
}

/**
 * 폼 초기화 (새로 입력)
 */
function handleReset() {
  if (personNameInput.value && !confirm('입력한 내용을 모두 초기화하고 새로 작성하시겠습니까?')) {
    return;
  }

  form.reset();
  const currentYear = new Date().getFullYear();
  startYearInput.value = currentYear;
  lunarMonthSelect.value = '1';
  lunarDaySelect.value = '1';
  fallbackTo29thCheckbox.checked = true;
  countYearsSelect.value = '10';
  alarmTypeSelect.value = '1_day_before';

  if (sharedBanner) {
    sharedBanner.classList.add('hidden');
  }

  isTitleManuallyEdited = false;
  closePreview();
  syncTitleWithName();
  updateInstantSolarDisplay();

  window.history.replaceState({}, '', window.location.pathname);
  personNameInput.focus();
  showToast('⟲ 입력 내용이 초기화되었습니다.', 'info');
}

/* ==========================================================================
   URL 파라미터 연동
   ========================================================================== */

function updateUrlParams() {
  const name = personNameInput.value.trim();
  const byear = birthYearInput.value.trim();
  const month = lunarMonthSelect.value;
  const day = lunarDaySelect.value;
  const leap = isLeapMonthCheckbox.checked ? '1' : '';
  const count = countYearsSelect.value;

  const params = new URLSearchParams();
  if (name) params.set('name', name);
  if (byear) params.set('byear', byear);
  if (month && month !== '1') params.set('m', month);
  if (day && day !== '1') params.set('d', day);
  if (leap) params.set('leap', '1');
  if (count && count !== '10') params.set('count', count);

  const queryString = params.toString();
  const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
  window.history.replaceState({}, '', newUrl);
}

function loadFromUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const hasParams = params.has('name') || params.has('m') || params.has('byear');
  const isAutoDownload = params.get('auto') === '1' || params.get('download') === '1';

  if (!hasParams) {
    return { hasParams: false, isAutoDownload: false };
  }

  if (params.has('name')) {
    personNameInput.value = params.get('name');
  }
  if (params.has('byear')) {
    birthYearInput.value = params.get('byear');
  }
  if (params.has('m')) {
    lunarMonthSelect.value = params.get('m');
  }
  if (params.has('d')) {
    lunarDaySelect.value = params.get('d');
  }
  if (params.get('leap') === '1') {
    isLeapMonthCheckbox.checked = true;
  }
  if (params.has('count')) {
    countYearsSelect.value = params.get('count');
  }

  syncTitleWithName();
  return { hasParams: true, isAutoDownload };
}

/* ==========================================================================
   토스트 알림 UI
   ========================================================================== */

function showToast(message, type = 'info', duration = 3000) {
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

// 앱 실행
document.addEventListener('DOMContentLoaded', init);
