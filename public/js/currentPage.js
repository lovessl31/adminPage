// 페이지 이동 시 currentPage를 1로 초기화하는 이벤트
$(document).ready(function () {
  $(".resetPage").on("click", function () {
    localStorage.setItem("currentPage", 1);
  });
});
