document.addEventListener('DOMContentLoaded', function ()
{
  const calendar = new KoreanLunarCalendar();

  var form = document.getElementById('lunarDateForm');

  form.addEventListener('submit', function (event)
  {
    // 폼 제출 시 페이지 새로 고침 방지
    event.preventDefault();

    // 입력된 년도, 월, 일 값을 가져옴
    var year = parseInt(document.getElementById('year').value);
    var month = parseInt(document.getElementById('month').value);
    var day = parseInt(document.getElementById('day').value);

    // 입력된 년도, 월, 일 값을 콘솔에 출력
    console.log(year, month, day);

    calendar.setLunarDate(year, month, day);

    resultText = calendar.getSolarCalendar();

    console.log(resultText);
  });
});
