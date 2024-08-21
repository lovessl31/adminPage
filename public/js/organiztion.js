$(document).ready(function() {
    // 조직도 데이터 초기화
    $.getJSON('tree.json', function(data) {
        $('#tree-container').jstree({
            'core': {
                'check_callback': true,
                'data': data
            },
            'plugins': ["dnd"],
            'dnd': {
                'check_while_dragging': true,
          
                'inside_pos': 'last',
                'touch': false,
                'large_drop_target': true,
                'large_drag_target': true
            }
        });

        // jsTree 노드에서 드래그 시작
        $('#tree-container').on('dragstart.jstree', function (e, data) {
            e.originalEvent.dataTransfer.setData('text/plain', data.node.id);
        });
    });
});

let users = []; // 전역 변수로 users 선언
let currentPage = 1; // 현재 페이지
let itemsPerPage = 10; // 페이지 당 항목 수 (초기값)
let totalPage = 1; // 총 페이지 수
let optionType = "all";
let optionValue = "";


document.addEventListener('DOMContentLoaded', () => {
    
    // localStorage에서 현재 페이지 번호 가져오기
    const savedPage = localStorage.getItem('currentPage');
    if (savedPage) {
        currentPage = parseInt(savedPage, 10);
        localStorage.removeItem('currentPage'); // 저장된 페이지 번호 삭제
    } else {
        currentPage = 1; // 기본 페이지를 1로 설정
    }

    // 데이터 로드 함수 호출
    loadUserData(currentPage);
    
    // // 검색 버튼 클릭 시와 검색 필드에서 엔터 키 입력 시 검색
    // document.getElementById('searchButton').addEventListener('click', () => {
    //     executeSearch();
    // });

    // document.getElementById('searchInput').addEventListener('keydown', (event) => {
    //     if (event.key === 'Enter') {
    //         event.preventDefault();
    //         executeSearch();
    //     }
    // });

    // // 페이지 당 항목 수 변경
    // document.getElementById('itemCountSelect').addEventListener('change', (event) => {
    //     itemsPerPage = parseInt(event.target.value, 10);
    //     loadUserData(1);
    // });

});

// 공통 요청 함수
function makeRequest(method, url, data = {}) {
    const token = localStorage.getItem('accessToken');
    return axios({
        method: method,
        url: url,
        data: data,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
}

// 에러 처리 함수
function handleError(error, defaultMessage = 'An error occurred') {
    const message = error.response && error.response.data ? error.response.data : defaultMessage;
    console.error(message);
    console.log('에러', error);
    alert(message);
}

// 쿠키에서 특정 값을 가져오는 함수
function getCookieValue(name) {
    let value = `; ${document.cookie}`;
    let parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// 사용자 데이터 불러오기
function loadUserData(page = 1) {
    currentPage = page;
    localStorage.setItem('currentPage', currentPage); // 현재 페이지 저장
    const url = `http://192.168.0.18:28888/with/users?option_type=${optionType}&option_value=${optionValue}&per_page=${itemsPerPage}&page=${currentPage}`;

    makeRequest('get', url)
        .then(response => {
            const data = response.data.data;
            users = data;
            totalPage = response.data.total_page || 1;

            console.log('user',data);

            renderUserTable();
            renderPagination();
        })
        .catch(error => handleError(error, '사용자 데이터를 불러오는 데 실패했습니다.'));
}

// 검색 실행 함수
function executeSearch() {
    const searchSelect = document.getElementById('searchSelect');
    const searchInput = document.getElementById('searchInput');
    if (searchSelect) {
        optionType = searchSelect.value;
    }
    if (searchInput) {
        optionValue = searchInput.value.trim();
    }
    // 검색 조건이 변경 될 때마다 페이지를 1로 설정하고 데이터를 가져옴
    loadUserData(1);
}

// 사용자 테이블 렌더링
function renderUserTable() {
    const tableBody = document.getElementById('userTableBody');
    tableBody.innerHTML = ''; // 기존 내용을 비우기

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.user_name}</td>
            <td>${user.user_id}</td>
            <td>${user.phone_number}</td>
            <td>${user.c_name}</td>
            <td>${user.user_rank}</td>
            <td>${user.user_position}</td>
        `;
        tableBody.appendChild(row);
    });

    // addEventListeners();
}


// 페이지네이션 렌더링
function renderPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    // 첫 페이지로 이동 (<<)
    const first = document.createElement('li');
    first.className = 'page-item';
    first.innerHTML = `<a class="page-link" href="#"><<</a>`;
    first.onclick = (event) => {
        event.preventDefault();
        loadUserData(1);
    };
    pagination.appendChild(first);
    
    // 페이지 번호
    const maxPagesToShow = 5; // 최대 페이지 버튼 수
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPage, startPage + maxPagesToShow - 1);
    
    // 페이지 번호가 최소 범위를 초과하면 오른쪽으로 이동
    if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = 'page-item' + (i === currentPage ? ' active' : '');
        
        const pageButton = document.createElement('a');
        pageButton.className = 'page-link';
        pageButton.href = '#';
        pageButton.textContent = i;
        pageButton.onclick = (event) => {
            event.preventDefault();
            loadUserData(i);
        };
        
        pageItem.appendChild(pageButton);
        pagination.appendChild(pageItem);
    }

    // 마지막 페이지로 이동 (>>)
    const last = document.createElement('li');
    last.className = 'page-item';
    last.innerHTML = `<a class="page-link" href="#">>></a>`;
    last.onclick = (event) => {
        event.preventDefault();
        loadUserData(totalPage);
    };
    pagination.appendChild(last);
}
