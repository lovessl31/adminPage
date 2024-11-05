let posts = [];
let options = [];

let currentPage = 1;
let itemsPerPage = 10;
let totalPage = 1;
let optionType = "all";
let optionValue = "";
let board_name = "";
const bidx = localStorage.getItem('board_idx');

// url
const defaultUrl = "http://safe.withfirst.com:28888";

// 토큰
const rtoken = getCookieValue('refreshToken');
const atoken = localStorage.getItem('accessToken');

const urlParams = new URLSearchParams(window.location.search);
const boardId = urlParams.get('id');
const boardName = urlParams.get('name');


// 게시글 리스트 로드 함수
function fetchPostData(page = 1 ) {

    currentPage = page;

    $.ajax({
        url: defaultUrl + `/with/post_list?bidx=${bidx}&option_type=${optionType}&option_value=${optionValue}&per_page=${itemsPerPage}&page=${currentPage}`,
        method: 'GET',
        headers : {
            'Authorization' : `Bearer ${atoken}`
        },
        success: function(response) {
            console.log('게시글 목록 조회 성공 응답', response.data);

            posts = response.data; // 게시글 배열에 데이터 저장

            // options 배열 초기화 후 각 게시글의 post_opt 값 추가
            options = response.data.map( post => post.post_opt);

            console.log('옵션담겼을까요?', options);
            
            totalPage = response.totalPage || 1;
            total_count = response.total_count;

            renderlistTable();
            renderPagination();
        },
        error: function(error) {
            console.error('Error retrieving post data:', error);
        }
    });
}


$(function() {
    // localStorage에서 현재 페이지 번호 가져오기
    const savedPage = localStorage.getItem('currentPage');
    currentPage = savedPage ? parseInt(savedPage, 10) : 1;
    fetchPostData(currentPage);

});