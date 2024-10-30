// 공통 변수 선언
let boards = [];
let currentPage = 1; // 현재 페이지
let itemsPerPage = 10; // 페이지 당 항목 수 (초기값)
let totalPage = 1; // 총 페이지 수
let optionType = "all"; // 기본 옵션 타입
let optionValue = ""; // 검색어
let total_count;

// url 
const defaultUrl = "http://safe.withfirst.com:28888"
const params = new URL(document.location.href).searchParams;

// 토큰
const rtoken = getCookieValue('refreshToken');
const atoken = localStorage.getItem('accessToken');

// 게시판 리스트 로드 함수
function fetchBoardData(page = 1) {
    
    // 현재 페이지 기록
    currentPage = page;
    
    $.ajax({
        url : defaultUrl + `/with/board_list?option_type=${optionType}&option_value=${optionValue}&per_page=${itemsPerPage}&page=${currentPage}`,
        method : 'GET',
        headers : {
            'Authorization' : `Bearer ${atoken}`
        },
        success : function(response) {
            console.log('게시판 목록 데이터를 조회하는데 성공하였습니다.');
            console.log('게시판 데이터: ', response.data);

            // 로컬스토리지에 현재 페이지 저장
            localStorage.setItem('currentPage', currentPage);

            // 서버에서 받은 응답 데이터 전역변수 boards에 저장
            boards = response.data;
            totalPage = response.total_page || 1;
            total_count = response.total_count;

            renderBoardTable();
            renderPagination();
        },
        error : function(e) {
            console.log(e);
            console.log("error :: 게시판 접속 에러");
        }
    });
}

// 게시판 목록 테이블 렌더링
function renderBoardTable() {

    $('.contentWrap p').text(`모든 게시판(${total_count})`);

    const tableBody = $('#boardTableBody').empty();

    boards.forEach(function(board) {

        let boardType = (board.board_type === "P") ? "앨범형" : "리스트형";
        let likeSet = (board.LikeSet === "Y") ? "사용" : "미사용";
        let commentSet = (board.commentSet === "Y") ? "사용" : "미사용";
        const row = $(`
          <tr>
                <td>
                    <div class="d-flex align-items-center justify-content-center">
                        <input type="checkbox" data-b-idx="${board.board_idx}" data-b-name="${board.board_name}">
                    </div>
                </td>
                 <td style="text-align : left;">${board.board_idx}</td>
                <td style="text-align : left;">
                    <p class="moveBoardPage" data-b-idx="${board.board_idx}">${board.board_name}<img src="./images/link.svg"></p>
                </td>
                <td>${boardType}</td>
                <td>${commentSet}</td>
                <td>${likeSet}</td>
                <td>${board.created_date.substring(0,10)}</td>
                <td class="buttons center-align">
                    <button class="modifyBtn" id="boardModify" data-b-idx="${board.board_idx}">수정</button>
                    <button class="deleteBtn" data-b-idx="${board.board_idx}" data-b-name="${board.board_name}">삭제</button>
                    <button class="moveBtn moveBoardPage" data-b-idx="${board.board_idx}">이동</button>
                </td>
            </tr>
        `);

        tableBody.append(row);
    });
    
    // 체크박스 상태 초기화
    $('thead input[type="checkbox"]').prop('checked', false);

    // 동적으로 생성된 요소들에 이벤트 리스너 추가
    $('#boardTableBody').on('click', '.modifyBtn', moveToPage('boardUpdate.html'));
    $('#boardTableBody').on('click', '.deleteBtn', deleteBoard);
    $('#boardTableBody').on('click', '.moveBoardPage', moveToPage('postList.html'));
}

// 페이지네이션 렌더링
function renderPagination() {
    const pagination = $('#pagination').empty();
    const first = $('<li class="page-item"><a class="page-link" href="#"><<</a></li>');
    first.on('click', function (event) {
        event.preventDefault();
        fetchBoardData(1);
    });
    pagination.append(first);

    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPage, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageItem = $(`<li class="page-item${i === currentPage ? ' active' : ''}"><a class="page-link" href="#">${i}</a></li>`);
        pageItem.on('click', function (event) {
            event.preventDefault();
            fetchBoardData(i);
        });
        pagination.append(pageItem);
    }

    const last = $('<li class="page-item"><a class="page-link" href="#">>></a></li>');
    last.on('click', function (event) {
        event.preventDefault();
        fetchBoardData(totalPage);
    });
    pagination.append(last);
}

// 게시판 개별 삭제 함수
function deleteBoard() {
    const board_idx = $(this).data('b-idx');
    const board_name = $(this).data('b-name');
    deleteBoards([ { board_idx : board_idx, board_name: board_name } ]);
}

// 게시판 개별 및 다중 삭제 요청 함수
function deleteBoards(boards) {

    $.ajax({
        url: defaultUrl + '/with/board_del',
        method : 'DELETE',
        headers : {
            'Authorization': `Bearer ${atoken}`,
            'Content-Type': 'application/json'
        },
        data : JSON.stringify(boards),
        success : function(response) {
            console.log('게시판 삭제 응답', response.data);
            Swal.fire({
                title: '삭제 완료',
                text: '삭제되었습니다.',
                icon: 'success',
                confirmButtonText: '확인'
            }).then(()=> {
                fetchBoardData(currentPage);
            });
        },
        error : function(e) {
            console.log(e);
            console.log("error :: 삭제 에러");
        }
    });

}

// 페이지 이동 함수
function moveToPage(page) {
    return function() {
        const board_idx = $(this).data('b-idx');
        localStorage.setItem('board_idx', board_idx);

        if(board_idx) {
            // board_idx를 사용하여 동적으로 해당 페이지로 이동
             window.location.href = `/${page}?board_idx=${board_idx}`;
        } else {
            console.error('board_idx를 찾을 수 없습니다.');
        }
    };
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
    fetchBoardData(1);
}

$(function() {

    // localStorage에서 현재 페이지 번호 가져오기
    const savedPage = localStorage.getItem('currentPage');
    currentPage = savedPage ? parseInt(savedPage, 10) : 1;
    
    // 페이지 데이터 로드
    fetchBoardData(currentPage);

    // 검색 버튼 클릭 및 엔터 입력 시 검색 함수 호출
    $('#searchButton').on('click', executeSearch);
    $('#searchInput').on('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            executeSearch();
        }
    });
    
    // 검색 실행 함수
    function executeSearch() {
        optionType = $('#searchSelect').val();
        optionValue = $('#searchInput').val().trim();
        fetchBoardData(1);
    }
    
    // 페이지 당 항목 수 변경
    $('#itemCountSelect').on('change', function () {
        itemsPerPage = parseInt($(this).val(), 10);
        fetchBoardData(1);
    });

    // 체크박스 전체 선택
    $('thead input[type="checkbox"]').on('change', function () {
        const isChecked = $(this).is(':checked');
        $('tbody input[type="checkbox"]').prop('checked', isChecked);
    });
    
    // 체크박스 사용한 다중 삭제 기능
    $('#deleteBtn').on('click', function() {
        const selectedBoards = $('tbody input[type="checkbox"]:checked').map(function() {
            return {
                board_idx: $(this).data('b-idx'),
                board_name: $(this).data('b-name')
            };
        }).get(); // 배열로 변환
        
        if (selectedBoards.length > 0) {
            deleteBoards(selectedBoards);
        } else {
            Swal.fire({
                // title: '경고',
                text: '삭제할 사용자를 선택해 주세요.',
                icon: 'warning',
                confirmButtonText: '확인'
            });
        }
    });
    
    // 게시판 생성 클릭 시 생성 페이지로 이동
    $('#createBoard').on('click', function() {
        window.location.href = 'boardCreate.html';
    });

});