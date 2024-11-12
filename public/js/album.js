let posts = [];
let options = [];

let currentPage = 1;
let itemsPerPage = 10;
let totalPage = 1;
let optionType = "all";
let optionValue = "";
let total_count;

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
            console.log('게시글 목록 조회 성공 응답', response);

            // 로컬스토리지에 현재 페이지 저장
            localStorage.setItem('currentPage', currentPage);


            posts = response.data; // 게시글 배열에 데이터 저장
            // options 배열 초기화 후 각 게시글의 post_opt 값 추가
            options = response.data.map( post => post.post_opt);

            console.log('옵션담겼을까요?', options);
            
            totalPage = response.total_pages || 1;
            total_count = response.total_count;

            renderlistTable();
            renderPagination();
        },
        error: function(error) {
            console.error('Error retrieving post data:', error);
        }
    });
}


function renderlistTable() {
    const tableBody = $('.container-w .row').empty(); // 기존 내용을 초기화

    if (posts.length === 0) {
        // 게시글이 없을 경우 "사진이 포함된 게시글이 없습니다." 메시지 표시
        $('.noPic').show();
    } else {
        $('.noPic').hide(); // 게시글이 있을 경우 숨기기

        posts.forEach(post => {
            // post_files에서 view_sts가 "3"인 파일을 찾기
            const fileImg = post.post_opt.post_files.find(file => file.view_sts === "3");

            const imgSrc = fileImg ? `http://${fileImg.domain}/with/${fileImg.f_path}` : 'images/profile.jpg'; // view_sts가 "3"인 파일이 있으면 그 파일 URL을 사용하고, 없으면 기본 이미지 사용

            // 카드 요소 생성
            const card = $(`
                <div class="col custom-card mb-4">
                    <div class="card" data-p-idx=${post.post_idx}>
                        
                            <div class="image-container">
                                <img src="${imgSrc}" class="card-img-top" alt="Post image">
                            </div>
                   
                        <div class="card-body">
                            <div class="module_value">
                                ${post.post_opt.opt_text.map(opt => `<p>${opt.select_text}</p>`).join('')}
                            </div>
                            <p class="card-text">${post.user_name || '작성자'}</p>
                            <span class="card-text">${post.created_date.substring(0, 10) || '생성일'}</span>
                            <span class="card-text">조회수 ${post.p_view || 0}</span>
                        </div>
                    </div>
                </div>
            `);

            // 카드 클릭 시 상세 페이지로 이동
            card.find('.card').on('click', function() {
                const post_idx = $(this).data('p-idx');
                window.location.href = `/newPost.html?id=${post_idx}`; // 상세 페이지 URL로 이동
            });

            tableBody.append(card);
        });
    }
}

// 페이지네이션 렌더링 함수
function renderPagination() {

    // 페이지네이션 ui가 들어갈 요소 선택
    const pagination = $('#pagination').empty();

    // << 버튼 (첫 페이지로 이동)
    const first = $('<li class="page-item"><a class="page-link" href="#"><<</a></li>');
    first.on('click', function (event) {
        event.preventDefault();
        fetchPostData(1);
    });
    pagination.append(first);

    const maxPagesToShow = 5; //한 번에 보여줄 페이지 번호의 개수(최대 5개로 설정)
    // let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    // let endPage = Math.min(totalPage, startPage + maxPagesToShow - 1);

    // if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
    //     startPage = Math.max(1, endPage - maxPagesToShow + 1);
    // }
    let startPage = Math.max(1, Math.min(currentPage - Math.floor(maxPagesToShow / 2), totalPage - maxPagesToShow + 1));
    let endPage = Math.min(totalPage, startPage + maxPagesToShow - 1);


    // startPage 부터 endPage 까지의 페이지 번호 생성
    for (let i = startPage; i <= endPage; i++) {
        const pageItem = $(`<li class="page-item${i === currentPage ? ' active' : ''}"><a class="page-link" href="#">${i}</a></li>`);
        pageItem.on('click', function (event) {
            event.preventDefault();
            fetchPostData(i);
        });
        pagination.append(pageItem);
    }

    // >> 버튼 (마지막 페이지로 이동)
    const last = $('<li class="page-item"><a class="page-link" href="#">>></a></li>');
    last.on('click', function (event) {
        event.preventDefault();
        fetchPostData(totalPage);
    });
    pagination.append(last);

}

// 검색 실행 함수
function executeSearch() {
    const searchSelect = $('#searchSelect');
    const searchInput = $('#searchInput');
    
    if (searchSelect.length) {
        optionType = searchSelect.val();
    }
    
    if (searchInput.length) {
        optionValue = searchInput.val().trim();
    }

    // 검색 조건이 변경 될 때마다 페이지를 1로 설정하고 데이터를 가져옴
    fetchPostData(1);
}

$(function() {


    // localStorage에서 현재 페이지 번호 가져오기
    const savedPage = localStorage.getItem('currentPage');
    currentPage = savedPage ? parseInt(savedPage, 10) : 1;

    fetchPostData(currentPage);

    
    // 검색 버튼 클릭 시와 검색 필드에서 엔터 키 입력 시 검색
    $('#searchButton').on('click', function() {
        executeSearch();
    });
    
    $('#searchInput').on('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            executeSearch();
        }
    });
    
    // 페이지 당 항목 수 변경 시 해당 항목 수에 맞춰 데이터 로드
    $('#itemCountSelect').on('change', function() {
        itemsPerPage = parseInt($(this).val(), 10);
        fetchPostData(1);
    });

    // 글쓰기 버튼 클릭 시 이동
    $('.writeBtn').on('click', function() {
        window.location.href = 'write.html';
    });


});