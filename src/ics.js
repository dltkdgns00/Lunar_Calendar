/**
 * iCalendar (.ics) 파일 생성 및 다운로드 모듈 (RFC 5545 표준 준수)
 */

/**
 * 주어진 날짜(YYYY, MM, DD)의 다음 날짜를 YYYYMMDD 포맷 문자열로 반환합니다.
 * RFC 5545 규격상 종일 일정(VALUE=DATE)의 DTEND는 종료일 익일(Exclusive)이어야 합니다.
 */
function getNextDayString(year, month, day) {
  const nextDate = new Date(year, month - 1, day + 1);
  const nextY = nextDate.getFullYear();
  const nextM = String(nextDate.getMonth() + 1).padStart(2, '0');
  const nextD = String(nextDate.getDate()).padStart(2, '0');
  return `${nextY}${nextM}${nextD}`;
}

/**
 * 텍스트 내 RFC 5545 예약 특수문자(, ; \)를 이스케이프합니다.
 */
function escapeICS(text) {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * 알림 설정(VALARM) 블록을 생성합니다.
 * @param {string} alarmType 'none' | 'day_of' | '1_day_before' | '3_days_before'
 * @param {string} summary 일정 요약
 */
function buildAlarmBlock(alarmType, summary) {
  if (!alarmType || alarmType === 'none') {
    return [];
  }

  let trigger = '-P1D'; // 기본: 1일 전
  let description = '생일 1일 전 알림';

  switch (alarmType) {
    case 'day_of':
      trigger = 'PT9H'; // 당일 오전 9시
      description = '오늘 생일 알림';
      break;
    case '1_day_before':
      trigger = '-P1D'; // 1일 전
      description = '생일 1일 전 알림';
      break;
    case '3_days_before':
      trigger = '-P3D'; // 3일 전
      description = '생일 3일 전 알림';
      break;
    default:
      return [];
  }

  return [
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(summary)} (${description})`,
    `TRIGGER:${trigger}`,
    'END:VALARM',
  ];
}

/**
 * 이벤트 목록을 iCalendar 2.0 포맷 문자열로 변환합니다.
 * @param {Array<Object>} events 이벤트 목록
 * @param {string} alarmType 알림 설정
 * @returns {string} CRLF(\r\n)로 결합된 ICS 내용
 */
export function generateICS(events, alarmType = '1_day_before') {
  const now = new Date();
  const dtstamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//dltkdgns00//Lunar Calendar//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:음력 생일 캘린더',
  ];

  events.forEach((event, index) => {
    const formattedMonth = String(event.solarMonth).padStart(2, '0');
    const formattedDay = String(event.solarDay).padStart(2, '0');
    const startDateStr = `${event.solarYear}${formattedMonth}${formattedDay}`;
    const endDateStr = getNextDayString(event.solarYear, event.solarMonth, event.solarDay);
    const uid = `lunar-${startDateStr}-${Date.now()}-${index}@sldev.kr`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`SUMMARY:${escapeICS(event.title)}`);
    lines.push(`DTSTART;VALUE=DATE:${startDateStr}`);
    lines.push(`DTEND;VALUE=DATE:${endDateStr}`);
    lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
    lines.push('TRANSP:TRANSPARENT'); // 일정 중 '한가함' 표시 (종일 일정 권장)

    // 알림 블록 추가
    const alarmLines = buildAlarmBlock(alarmType, event.title);
    if (alarmLines.length > 0) {
      lines.push(...alarmLines);
    }

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  // RFC 5545 규격: 반드시 CRLF(\r\n) 개행이어야 함
  return lines.join('\r\n') + '\r\n';
}

/**
 * ICS 데이터를 .ics 파일로 브라우저에서 직접 다운로드합니다.
 * (window.open data: URI 방식 대신 Blob + <a> 태그를 사용하여 팝업 차단 없이 안전하게 다운로드)
 * @param {string} icsContent ICS 문자열
 * @param {string} filename 저장할 파일명
 */
export function downloadICSFile(icsContent, filename = '음력생일.ics') {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();

  // 리소스 정리
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
