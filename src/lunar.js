/**
 * 음력-양력 변환 및 생일 목록 계산 모듈
 * korean-lunar-calendar 라이브러리를 안전하게 래핑하여 윤달 및 소월(29일)을 보정합니다.
 */

/**
 * 특정 음력 연도/월/일에 대한 양력 날짜를 계산합니다.
 * @param {number} lunarYear 음력 년
 * @param {number} lunarMonth 음력 월 (1~12)
 * @param {number} lunarDay 음력 일 (1~30)
 * @param {boolean} isLeapMonth 윤달 여부
 * @param {boolean} fallbackTo29th 30일이 없을 경우 29일로 보정할지 여부
 * @returns {{ year: number, month: number, day: number, isAdjusted: boolean } | null}
 */
export function convertLunarToSolar(lunarYear, lunarMonth, lunarDay, isLeapMonth = false, fallbackTo29th = true) {
  if (typeof window.KoreanLunarCalendar === 'undefined') {
    throw new Error('KoreanLunarCalendar 라이브러리가 로드되지 않았습니다.');
  }

  const calendar = new window.KoreanLunarCalendar();
  let success = false;
  let isAdjusted = false;

  // 1차 시도: 입력받은 날짜 그대로 설정
  if (isLeapMonth) {
    success = calendar.setLunarDate(lunarYear, lunarMonth, lunarDay, true);
  } else {
    success = calendar.setLunarDate(lunarYear, lunarMonth, lunarDay, false);
  }

  // 실패했고, 30일이었으며, 29일 보정 옵션이 켜져 있는 경우 29일로 재시도 (소월 처리)
  if (!success && lunarDay === 30 && fallbackTo29th) {
    if (isLeapMonth) {
      success = calendar.setLunarDate(lunarYear, lunarMonth, 29, true);
    } else {
      success = calendar.setLunarDate(lunarYear, lunarMonth, 29, false);
    }
    if (success) {
      isAdjusted = true;
    }
  }

  // 윤달로 지정했는데 해당 연도에 윤달이 없는 경우, 평달로 폴백 시도
  if (!success && isLeapMonth) {
    success = calendar.setLunarDate(lunarYear, lunarMonth, lunarDay, false);
    if (!success && lunarDay === 30 && fallbackTo29th) {
      success = calendar.setLunarDate(lunarYear, lunarMonth, 29, false);
      if (success) isAdjusted = true;
    }
  }

  if (!success) {
    return null;
  }

  const solar = calendar.getSolarCalendar();
  return {
    year: solar.year,
    month: solar.month,
    day: solar.day,
    isAdjusted,
  };
}

/**
 * 지정된 시작 연도부터 N년간의 음력 생일에 해당하는 양력 일정 목록을 생성합니다.
 * @param {Object} params
 * @param {string} params.name 대상자 이름
 * @param {number} params.birthLunarYear 출생 음력 년도 (나이 계산용, 선택)
 * @param {number} params.lunarMonth 음력 월
 * @param {number} params.lunarDay 음력 일
 * @param {boolean} params.isLeapMonth 윤달 여부
 * @param {number} params.startYear 생성 시작 양력 연도 (예: 2026)
 * @param {number} params.countYears 생성할 연수 (예: 10)
 * @param {boolean} params.fallbackTo29th 30일 부재 시 29일 보정
 * @param {string} params.titleTemplate 제목 템플릿
 * @param {string} params.description 설명
 * @returns {Array<Object>}
 */
export function generateBirthdayEvents({
  name,
  birthLunarYear,
  lunarMonth,
  lunarDay,
  isLeapMonth = false,
  startYear = new Date().getFullYear(),
  countYears = 10,
  fallbackTo29th = true,
  titleTemplate = '{name}님의 음력 생일',
  description = '',
}) {
  const events = [];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  for (let i = 0; i < countYears; i++) {
    const targetLunarYear = startYear + i;
    const solar = convertLunarToSolar(targetLunarYear, lunarMonth, lunarDay, isLeapMonth, fallbackTo29th);

    if (!solar) {
      continue;
    }

    const dateObj = new Date(solar.year, solar.month - 1, solar.day);
    const dayOfWeek = dayNames[dateObj.getDay()];

    // 나이 계산 (출생 연도가 제공된 경우)
    let age = null;
    if (birthLunarYear && birthLunarYear > 0) {
      age = targetLunarYear - birthLunarYear + 1; // 세는나이 (한국식)
    }

    const title = titleTemplate
      .replace('{name}', name)
      .replace('{age}', age ? `${age}번째 ` : '');

    const formattedMonth = String(solar.month).padStart(2, '0');
    const formattedDay = String(solar.day).padStart(2, '0');
    const solarDateString = `${solar.year}-${formattedMonth}-${formattedDay}`;

    events.push({
      lunarYear: targetLunarYear,
      lunarMonth,
      lunarDay,
      isLeapMonth,
      isAdjusted: solar.isAdjusted,
      solarYear: solar.year,
      solarMonth: solar.month,
      solarDay: solar.day,
      solarDateString,
      dayOfWeek,
      age,
      title,
      description: description || `${name}님의 음력 생일입니다. (음력 ${lunarMonth}월 ${lunarDay}일${isLeapMonth ? ' [윤달]' : ''}${solar.isAdjusted ? ' → 29일로 보정' : ''})`,
    });
  }

  return events;
}
