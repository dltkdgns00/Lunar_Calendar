fetch('https://raw.githubusercontent.com/dltkdgns00/Lunar_Calendar/main/README.md')
  .then(response => response.text())
  .then(markdown =>
  {
    const htmlContent = marked.parse(markdown);
    document.getElementById('readme-content').innerHTML = htmlContent;
  })
  .catch(err => console.error(err));

document.addEventListener('DOMContentLoaded', function ()
{
  var currentYear = new Date().getFullYear();

  const calendar = new KoreanLunarCalendar();

  var form = document.getElementById('lunarDateForm');

  form.addEventListener('submit', function (event)
  {
    // 폼 제출 시 페이지 새로 고침 방지
    event.preventDefault();

    // 입력된 년도, 월, 일 값을 가져옴
    var month = parseInt(document.getElementById('month').value);
    var day = parseInt(document.getElementById('day').value);
    var nYear = parseInt(document.getElementById('nYear').value);
    var yearStart = currentYear;
    var yearEnd = currentYear + nYear;

    var eventTitle = document.getElementById('eventTitle').value;
    var eventDescription = document.getElementById('eventDescription').value;

    var years = [];
    var solarBirthdays = [];
    var events = [];

    eventTitle = String(eventTitle);
    eventDescription = String(eventDescription);

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
  });

  function addEventsToCalendar(events)
  {
    var icsContent = createMultipleEventsICS(events);
    var icsFileURL = createICSFileURL(icsContent);

    window.open(icsFileURL);
  }
});

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