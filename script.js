window.addEventListener('hashchange', navigate);

var app = document.getElementById('app');

// 상태 관리
let state = {
  name: '',
  lunarDate: '',
  year: 0,
  month: 0,
  day: 0,
  nYear: 0,
  eventTitle: '',
  eventDescription: '',
};

const currentYear = new Date().getFullYear();

function navigate()
{
  const hash = window.location.hash;
  switch (hash)
  {
    case '#lunar':
      renderLunar();
      break;
    case '#event':
      renderEvent();
      break;
    case '#result':
      renderResult();
      break;
    default:
      renderHome();
  }
}

function renderHome()
{
  fetch('https://raw.githubusercontent.com/dltkdgns00/Lunar_Calendar/main/README.md')
    .then(response => response.text())
    .then(markdown =>
    {
      const htmlContent = marked.parse(markdown);
      document.getElementById('readme-content').innerHTML = htmlContent;
    })
    .catch(err => console.error(err));

  app.innerHTML = `
    <div>
      <div id="readme-content"></div>
    </div>
    <div id="home">
      <div class="form-container">
        <form id="nameForm">
          <label for="name">이름</label>
          <input id="name" type="text" placeholder="생일을 저장하고 싶은 분의 이름을 입력해주세요.">
          <br/>
          <button type="submit">다음으로</button>
        </form>
      </div>
    </div>
  `;

  // 폼 제출 이벤트 리스너 추가
  document.getElementById('nameForm').addEventListener('submit', handleNameFormSubmit);
}

// 폼 제출 처리
function handleNameFormSubmit(event)
{
  event.preventDefault();
  state.name = document.getElementById('name').value;
  window.location.hash = '#lunar';
}

function renderLunar()
{
  if (state.name === '')
  {
    alert('이름을 입력해주세요.');
    window.location.hash = '#';
    return;
  }
  app.innerHTML = `
      <div id="lunar">
        <div class="form-container">
          <h2>${state.name}님의 음력 생일을 입력해주세요.</h2>
          <form id="lunarDateForm">
            <label for="lunarDate">음력 생년월일</label>
            <input id="lunarDate" type="date">
            <label for="nYear">몇년간의 생일을 저장하고 싶은가요?</label>
            <input id="nYear" type="number" min="1" max="100" value="${state.nYear}">
            <br/>
            <button type="submit">다음으로</button>
          </form>
        </div>
      </div>
    `;

  // 폼 제출 이벤트 리스너 추가
  document.getElementById('lunarDateForm').addEventListener('submit', handleLunarFormSubmit);

}

// 폼 제출 처리
function handleLunarFormSubmit(event)
{
  event.preventDefault();
  state.lunarDate = document.getElementById('lunarDate').value;
  const lunarDateSplit = state.lunarDate.split('-');
  state.year = parseInt(lunarDateSplit[0]);
  state.month = parseInt(lunarDateSplit[1]);
  state.day = parseInt(lunarDateSplit[2]);
  state.nYear = parseInt(document.getElementById('nYear').value);
  window.location.hash = '#event';
}

function renderEvent()
{
  const tempEventTitle = state.name + '님의 생일';
  const tempEventDescription = state.name + '님의 생일입니다.';

  app.innerHTML = `
    <div id="event">
      <div class="form-container">
        <h2>원하는 이벤트 제목과 설명이 있나요?</h2>
        <form id="eventForm">
          <label for="eventTitle">이벤트 제목</label>
          <input id="eventTitle" type="text" placeholder="이벤트 제목" value="${tempEventTitle}">
          <label for="eventDescription">이벤트 설명</label>
          <input id="eventDescription" type="text" placeholder="이벤트 설명" value="${tempEventDescription}">
          <br/>
          <button type="submit">다음으로</button>
        </form>
      </div>
    </div>
  `;

  // 폼 제출 이벤트 리스너 추가
  document.getElementById('eventForm').addEventListener('submit', handleEventFormSubmit);
}

// 폼 제출 처리
function handleEventFormSubmit(event)
{
  event.preventDefault();
  state.eventTitle = document.getElementById('eventTitle').value;
  state.eventDescription = document.getElementById('eventDescription').value;
  window.location.hash = '#result';
}

function renderResult()
{
  console.log(state);
  app.innerHTML = `
    <div id="result">
      <div class="form-container">
        <h2>${state.name}님의 음력 생일을<br/>캘린더에 저장할게요.</h2>
        <form id="resultForm">
          <table>
            <tr>
              <th>이벤트 제목</th>
              <td>${state.eventTitle}</td>
            </tr>
            <tr>
              <th>이벤트 설명</th>
              <td>${state.eventDescription}</td>
            </tr>
            <tr>
              <th>음력 생일</th>
              <td>${state.lunarDate}</td>
            </tr>
          </table>
          <br/>
          <button type="submit">캘린더에 저장하기</button>
        </form>
      </div>
    </div>
  `;

  // 폼 제출 이벤트 리스너 추가
  document.getElementById('resultForm').addEventListener('submit', handleResultFormSubmit);
}


function handleResultFormSubmit(event)
{
  const calendar = new KoreanLunarCalendar();

  event.preventDefault();

  // 입력된 년도, 월, 일 값을 가져옴
  var month = state.month;
  var day = state.day;
  var nYear = state.nYear;
  var yearStart = currentYear;
  var yearEnd = currentYear + nYear - 1;

  var eventTitle = state.eventTitle;
  var eventDescription = state.eventDescription;

  var years = [];
  var solarBirthdays = [];
  var events = [];

  for (var i = yearStart; i <= yearEnd; i++)
  {
    years.push(i);
  }

  console.log(years);


  years.forEach(year =>
  {
    calendar.setLunarDate(year, month, day);
    solarBirthdays.push(calendar.getSolarCalendar());
  });

  console.log(solarBirthdays);

  for (var i = 0; i < solarBirthdays.length; i++)
  {
    var solarBirthday = solarBirthdays[i];
    var solarYear = solarBirthday.year;
    var solarMonth = solarBirthday.month;
    var solarDay = solarBirthday.day;

    if (solarMonth < 10)
    {
      solarMonth = '0' + solarMonth;
    }
    if (solarDay < 10)
    {
      solarDay = '0' + solarDay;
    }

    console.log(String(solarYear) + String(solarMonth) + String(solarDay));

    events.push({
      title: eventTitle,
      startDate: String(solarYear) + String(solarMonth) + String(solarDay),
      endDate: String(solarYear) + String(solarMonth) + String(solarDay),
      description: eventDescription
    });
  }

  addEventsToCalendar(events);

}

function addEventsToCalendar(events)
{
  var icsContent = createMultipleEventsICS(events);
  var icsFileURL = createICSFileURL(icsContent);

  window.open(icsFileURL);
}

function createMultipleEventsICS(events)
{
  var icsEvents = events.map(function (event)
  {
    return [
      "BEGIN:VEVENT",
      "SUMMARY:" + event.title,
      "DTSTART;VALUE=DATE:" + event.startDate,
      "DTEND;VALUE=DATE:" + event.endDate,
      "DESCRIPTION:" + event.description,
      "END:VEVENT"
    ].join("\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    ...icsEvents,
    "END:VCALENDAR"
  ].join("\n");
}

function createICSFileURL(data)
{
  var encodedData = encodeURIComponent(data);
  return "data:text/calendar;charset=utf8," + encodedData;
}

navigate();