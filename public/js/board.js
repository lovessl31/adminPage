let boards = [];
let currentPage =  1;
let itemsPerPage = 10;
let totalPage = 1;
let optionType = "all";
let optionValue = "";

document.addEventListener('DOMContentLoaded', ()=> {
        
    // 전체 선택 기능
    document.querySelector('thead input[type="checkbox"]').addEventListener('change', function() {
        const isChecked = this.checked;
        const checkboxes = document.querySelectorAll('tbody input[type="checkbox"');
        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    });

    // 다중 삭제
    document.getElementById('deleteBtn').addEventListener('click', () => {
        const selectedBoards = Array.from(document.querySelectorAll('tbody input[type="checkbox"]:checked'))
        .map(checkbox => ({
            b_id : checkbox.getAttribute('data-b-id'),
            b_idx : checkbox.getAttribute('data-b-idx')
        }));
        
        console.log('이건 머라고 나올까', selectedBoards);
        if(selectedBoards.length>0) {
            deleteBoards(selectedBoards);
        } else {
            alert('삭제할 회사를 선택해주세요.');
        }
    });


// 삭제 요청 함수
function deleteBoards(boards) {
    const token = getCookieValue('refreshToken');

    axios.delete('http://192.168.0.18:28888/with/', {
        data : boards,
        headers : {
            'Authorization': `Bearer ${token}`,
            'Content-Type' : 'application/json'
        }
    })
    .then(response => {
        alert('삭제되었습니다.');
        loadBoardData(currentPage);
    })
    .catch(error => {
        console.log('회사 삭제 오류 : ', error.response ? error.response.data : error.message);
        alert('삭제에 실패했습니다.');
    });
}

    // 로컬스토리지에서 현재 페이지 번호 가져오기
    const savedPage = localStorage.getItem('currentPage');
    if(savedPage) {
        currentPage = parseInt(savedPage, 10);
        localStorage.removeItem('currentPage'); // 저장된 페이지 번호 삭제
    } else {
        currentPage = 1; // 기본 페이지를 1로 설정
    }

    // 데이터 로드 함수 호출
    loadBoardData(currentPage);

    // 검색 버튼 클릭 시와 검색 필드에서 엔터 키 입력 시
    document.getElementById('searchButton').addEventListener('click', ()=> {
        executeSearch();
    });

    document.getElementById('searchInput').addEventListener('keydown', (event) => {
        if(event.key === 'Enter') {
            event.preventDefault();
            executeSearch();
        }
    });

    function executeSearch() {
        const searchSelect = document.getElementById('searchSelect');
        const searchInput = document.getElementById('searchInput');
        if (searchSelect) {
            optionType = searchSelect.ariaValueMax;
        }
        if (searchInput) {
            optionValue = searchInput.value.trim();
        }
        // 검색 조건이 바뀔 때 마다 페이지를 1로 설정하고 데이터 로드하기
        loadBoardData(1);
    }

    // 페이지 당 항목 수를 변경
    document.getElementById('itemCountSelect').addEventListener('change', (event) => {
        itemsPerPage = parseInt(event.target.value, 10);
        fetchCompanyData(1);
    });
});

// 쿠키 가져오기
function getCookieValue(name) {
    let value = `; ${document.cookie}`;
    let parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// 실제 서버에서 데이터 불러오기
function loadBoardData(page = 1) {
    currentPage = page;
    const token = localStorage.getItem('accessToken');
    const url = `http://192.168.0.18:28888/with/boards?option_type=${optionType}&option_value=${optionValue}&per_page=${itemsPerPage}&page=${currentPage}`;

    axios.get(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        console.log('성공');
        const data = response.data.data;
        console.log('데이터값 확인 :', data);

        boards = data;
        totalPage = response.data.total_page || 1;
        renderTable();

        document.querySelector('thead input[type="checkbox"').checked = false;
    })
    .catch(error => {
        console.error('Error loading company data:', error.response ? error.response.data : error.message);
    });
}

// 테이블 랜더링
function renderTable() {
    const tableBody = document.getElementById('boardTableBody');
    tableBody.innerHTML = ''; // 체이블 본문 초기화

    // 전체 데이터에서 현재 페이지의 시작 인덱스 계산
    const startIndex = (currentPage - 1) * itemsPerPage;

    boards.forEach(board => {
        console.log("테이블 렌더링board :", board);
        
        const row = document.createElement('tr');
        row.innerHTML = `
        <td>
            <div class="d-flex align-items-center justify-content-center">
                <input type="checkbox">
            </div>
        </td>
        <td>${board["게시판 번호"]}</td>
        <td><a href="/postList.html">${board["게시판 명"]}<img src="./images/link.svg"></a></td>        
        <td>${board["게시판 타입"]}</td>
        <td>${board["좋아요 유/무"]}</td>
        <td>${board["카테고리 명"]}</td>
        <td>${board["카테고리 유형"]}</td>
        <td>${board["게시판 생성일"].split(' ')[0]}</td>
        <td class="buttons center-align">
            <button class="modifyBtn">수정</button>
            <button class="deleteBtn">삭제</button>
            <button class="moveBtn">이동</button>
        </td>
        `;
        tableBody.appendChild(row);
    });

    // 동적으로 생성된 수정

    // 동적으로 생성된 이동

    // 동적으로 생성된 개별 삭제

}
    
// JSON 파일에서 데이터 불러오기
// function loadBoardData() {
// axios.get('./board.json')
//     .then(response => {
//         const boards = response.data;
//         const tableBody = document.getElementById('boardTableBody');
//         boards.forEach(board => {
//             const row = document.createElement('tr');
//             row.innerHTML = `
//             <td>
//                 <div class="d-flex align-items-center justify-content-center">
//                     <input type="checkbox">
//                 </div>
//             </td>
//             <td>${board.id}</td>
//             <td><a href="/postList.html">${board.name}<img src="./images/link.svg"></a></td>
//             <td>${board.category}</td>
//             <td>${board.type}</td>
//             <td>${board.like}</td>
//             <td class="buttons center-align">
//                 <button class="modifyBtn">수정</button>
//                 <button class="deleteBtn">삭제</button>
//                 <button class="moveBtn">이동</button>
//             </td>
//             `;
//             tableBody.appendChild(row);
//         });
//     })
//     .catch(error => {
//         console.error('Error loading user data:', error);
//     });
// }

// 게시판 생성 클릭 시 생성 페이지로 이동
document.getElementById('createBoard').addEventListener('click', function() {
    window.location.href = 'boardCreate.html';
});
