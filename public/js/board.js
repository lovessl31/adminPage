

if(typeof TimedPopup === 'undefined') {
    console.error('TimedPopup is not defined. Make sure TimedPopup.js is loaded correctly.');
}

let boards = [];
let currentPage = 1;
let itemsPerPage = 10;
let totalPage = 1;
let optionType = "all";
let optionValue = "";

document.addEventListener('DOMContentLoaded', () => {

    // 전체 선택 기능
    document.querySelector('thead input[type="checkbox"]').addEventListener('change', function () {
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
                board_idx: checkbox.getAttribute('data-board-idx'),
                board_name: checkbox.getAttribute('data-board-name')
            }));

        console.log('이건 머라고 나올까', selectedBoards);
        if (selectedBoards.length > 0) {
            deleteBoards(selectedBoards);
        } else {
            alert('삭제할 게시판을 선택해주세요.');
        }
    });

    // localStorage에서 현재 페이지 번호 가져오기
    const savedPage = localStorage.getItem('currentPage');
    if (savedPage) {
        currentPage = parseInt(savedPage, 10);
        localStorage.removeItem('currentPage'); // 저장된 페이지 번호 삭제
    } else {
        currentPage = 1; // 기본 페이지를 1로 설정
    }

    // 검색 버튼 클릭 시와 검색 필드에서 엔터 키 입력 시
    document.getElementById('searchButton').addEventListener('click', () => {
        executeSearch();
    });

    document.getElementById('searchInput').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
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
        loadBoardData(1);
    });

    // 데이터 로드 함수 호출
    loadBoardData(currentPage);
});

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
            console.log(boards);
            console.log(response.data);
            
            totalPage = response.data.total_page || 1;            
            totalCount = `모든 게시판(${response.data.total_count || 0})`
            console.log(totalPage);
            console.log(111111);
            renderTable();
            console.log(222222);

            document.querySelector('thead input[type="checkbox"]').checked = false;
            document.getElementById('board_count').textContent = totalCount;
        })
        .catch(error => {
            console.error('Error loading board data:', error.response ? error.response.data : error.message);
        });
}

// 테이블 랜더링
function renderTable() {
    const tableBody = document.getElementById('boardTableBody');
    tableBody.innerHTML = ''; // 테이블 본문 초기화

    // 전체 데이터에서 현재 페이지의 시작 인덱스 계산
    const startIndex = (currentPage - 1) * itemsPerPage;

    boards.forEach((board, index) => {
        console.log("테이블 렌더링board :", board);

        const row = document.createElement('tr');
        row.innerHTML = `
        <td>
            <div class="d-flex align-items-center justify-content-center">
                <input type="checkbox" data-board-idx="${board['게시판 번호']}" data-board-name="${board['게시판 명']}">
            </div>
        </td>        
        <td>${startIndex + index + 1}</td>
        <td><a href="/postList.html">${board["게시판 명"]}<img src="./images/link.svg"></a></td>        
        <td>${board["게시판 타입"]}</td>
        <td>${board["좋아요 유/무"]}</td>
        <td>${board["카테고리 명"]}</td>
        <td>${board["카테고리 유형"]}</td>
        <td>${board["게시판 생성일"] ? board["게시판 생성일"].split(' ')[0] : ''}</td>
        <td class="buttons center-align">
            <button class="modifyBtn boardModify" data-id="${board['게시판 번호']}">수정</button>
            <button class="deleteBtn" data-board-idx="${board["게시판 번호"]}" data-board-name="${board["게시판 명"]}">삭제</button>
            <button class="moveBtn">이동</button>
        </td>
        `;
        console.log(0);
        // if board[""]
        tableBody.appendChild(row);
        console.log(tableBody);

        console.log(12);
    });

    // 동적으로 생성된 팝업에 기존 데이터 맵핑
    document.querySelectorAll('.boardModify').forEach(button => {
        button.addEventListener('click', function () {
            const boardId = this.getAttribute('data-id'); // 클릭 시 해당 게시판 idx 저장            
            const board = boards.find(v => v["게시판 번호"] == boardId); // 해당 idx 일치하는 게시판 객체 저장
            console.log("수정 board", board);

            // 해당 회사 객체로 팝업에 데이터 채우기
            document.getElementById('regisName').value = board['게시판 명'];         

            // 게시판 타입, 좋아요 라디오 버튼 설정
            const boardTypeRadios = document.getElementsByName('boardType');
            boardTypeRadios.forEach(v => {
                v.checked = v.value === board["게시판 타입"];
            });            
            const likeFeatureRadios = document.getElementsByName('likeFeature');
            likeFeatureRadios.forEach(v => {
                v.checked = v.value === board["좋아요 유/무"];
            });

            document.getElementById('regisDate').textContent = board["게시판 생성일"].split(' ')[0];
            document.getElementById('regisDesc').value = board["게시판 설명"];
            // document.getElementById('regisOption').value = board.options

            // 저장 버튼에 board_idx와 board_name data 속성으로 추가
            document.getElementById('modifySaveBtn').setAttribute('data-board-idx', board['게시판 번호']);
            document.getElementById('modifySaveBtn').setAttribute('data-origin-name', board['게시판 명']);
            document.getElementById('modifyPopup').style.display = 'flex';                        
        });
    });


    // 팝업 내 저장 버튼 클릭시 실행 될 이벤트 핸들러 
    document.getElementById('modifySaveBtn').addEventListener('click', function () {
        // 입력 필드에서 값 가져오기
        const boardName = document.getElementById('regisName').value.trim();        
        const boardType = document.querySelector('input[name="boardType"]:checked').value;
        const boardLike = document.querySelector('input[name="likeFeature"]:checked').value;
        const boardDesc = document.getElementById('regisDesc').value.trim();

        const originBoardName = this.getAttribute('data-origin-name'); // 저장된 게시판 명 가져옴
        const boardIdx = this.getAttribute('data-board-idx'); // 저장된 게시판 번호 가져옴
        // const regisDynamicOption = document.getElementById('regisOption').value.trim(); // 게시판 옵션 가져오기

        // 요청할 폼 데이터
        const formData = new FormData();
        formData.append('board_name', boardName);
        formData.append('board_type', boardType);
        formData.append('LikeSet', boardLike);
        formData.append('board_desc', boardDesc);



        const token = localStorage.getItem('accessToken');

        // 수정 PUT 요청 보내기
        axios.put(`http://192.168.0.18:28888//with/edit_board/${originBoardName}/${boardIdx}`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data' // 폼데이터 전송 시 설정
            }
        })
            .then(response => {
                console.log('게시판 정보 수정 응답:', response.data);                
                let title = "게시판 수정"
                let body = "<p>게시판 정보가 수정되었습니다.</p>"                
                showPopup(2, title, body, 'suc')
                localStorage.setItem('currentPage', currentPage);
                //페이지 새로 고침
                location.reload();
            })
            .catch(error => {
                console.error('게시판 정보 수정 오류:', error.response ? error.response.data : error.message);

                if (error.response && error.response.status === 401) {
                    // 401 에러 발생 시 로그아웃 함수 호출
                    window.logout();
                } else {
                    // 기타 에러 처리
                    alert('게시판 수정에 실패했습니다.');
                }
            });
    });
    // 팝업 내 취소 버튼 클릭 시 실행 될 이벤트 핸들러
    document.querySelectorAll('.cancleBtn').forEach(cancelBtn => {
        cancelBtn.addEventListener('click', () => {
            cancelBtn.closest('.popup').style.display = 'none';
        });
    });
    // 팝업 내 닫기 버튼 클릭 시 팝업 닫기
    document.querySelectorAll('.popup .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeBtn.closest('.popup').style.display = 'none';
        });
    });




    // 동적으로 생성된 이동

    // 동적으로 생성된 개별 삭제
    console.log(1);
    document.querySelectorAll('.deleteBtn').forEach(button => {
        button.addEventListener('click', function () {
            const board_idx = this.getAttribute('data-board-idx');
            const board_name = this.getAttribute('data-board-name');
            console.log("게시판 삭제 버튼 동작 이벤트 테스트", board_idx, board_name);

            deleteBoards([{ board_idx: board_idx, board_name: board_name }]);
        })
    });
    console.log(2);
    // 페이지 네이션
    boardPagination()
    console.log("pagination--------------------------------");
}

function showPopup(seq, title, content, status, istype) { 
    const popup = new TimedPopup({

        duration: seq * 1000,
        title: title,
        content: content,
        backgroundColor: status,
        type : istype,
        onClose: () => console.log('팝업이 닫혔습니다.')
    });
    popup.show();
}


// 삭제 요청 함수
function deleteBoards(boards) {
    const token = localStorage.getItem('accessToken');

    console.log('전송될 데이터:', JSON.stringify(boards));

    axios.delete('http://192.168.0.18:28888/with/del_board', {
        data: boards,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            console.log('게시판 삭제 응답:', response.data);                        
            showPopup(3, '게시판 삭제', "삭제 되었습니다.", 'suc')
            localStorage.setItem('currentPage', currentPage);
            //페이지 새로 고침
            location.reload();
        })
        .catch(error => {
            console.error('게시판 삭제 오류:', error.response ? error.response.data : error.message);
            if (error.response && error.response.status === 401) {
                // 401에러 발생 시 로그아웃 함수 호출
                window.logout();
            } else {
                showPopup(3, '게시판 삭제', "삭제에 실패 하였습니다.")
            }
        });
}

// 페이지네이션 렌더링
function boardPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    // 첫 페이지로 이동 (<<)
    const firstPage = document.createElement('li');
    firstPage.className = 'page-item';
    firstPage.innerHTML = `<a class="page-link" href="#"><<</a>`;
    firstPage.onclick = (event) => {
        event.preventDefault();
        loadBoardData(1);
    };
    pagination.appendChild(firstPage);

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
            loadBoardData(i);
        };


        pageItem.appendChild(pageButton);
        pagination.appendChild(pageItem);
    }

    // 마지막 페이지로 이동 (>>)
    const lastPage = document.createElement('li');
    lastPage.className = 'page-item';
    lastPage.innerHTML = `<a class="page-link" href="#">>></a>`;
    lastPage.onclick = (event) => {
        event.preventDefault();
        loadBoardData(totalPage);
    };
    pagination.appendChild(lastPage);
}




// 게시판 생성 클릭 시 생성 페이지로 이동
document.getElementById('createBoard').addEventListener('click', function () {
    window.location.href = 'boardCreate.html';
});
