let boards = [];
let currentPage = 1; // 현재 페이지
let itemsPerPage = 10; // 페이지 당 항목 수 (초기값)
let totalPage = 1; // 총 페이지 수
let optionType = "all";
let optionValue = "";


// url
const defaultUrl = "http://safe.withfirst.com:28888";

// 토큰
const atoken = localStorage.getItem('accessToken');

function fetchBoardData(page = 1) {

    currentPage = page;

    $.ajax({
        url : defaultUrl + `/with/board_list?option_type=${optionType}&option_value=${optionValue}&per_page=${itemsPerPage}&page=${currentPage}`,
        method : 'GET',
        headers : {
              'Authorization' : `Bearer ${atoken}`
        },
        success : function(response) {
            console.log('게시판 목록 데이터를 조회하는데 성공하였습니다.');
            console.log('게시판 목록 데이터:', response);

            // 로컬 스토리지에 현재 페이지 저장
            localStorage.setItem('currentPage', currentPage);


        }
    })
}

$(function() {
    fetchBoardData();
});