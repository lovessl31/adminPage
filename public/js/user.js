let users = []; // 전역 변수로 users 선언
let currentPage = 1; // 현재 페이지
let itemsPerPage = 10; // 페이지 당 항목 수 (초기값)
let totalPage = 1; // 총 페이지 수
let optionType = "all";
let optionValue = "";

document.addEventListener('DOMContentLoaded', () => {
    
    // 사용자 수정, 추가 함수 실행
    document.querySelectorAll('#modifySaveBtn, #addSaveBtn').forEach(button => {
        button.addEventListener('click', function() {
            if (this.id === 'modifySaveBtn') {
                updateUserData();
            } else if (this.id === 'addSaveBtn') {
                addUserData();
            }
        });
    });

    // 체크박스 전체 선택
    document.querySelector('thead input[type="checkbox"]').addEventListener('change', function() {
        const isChecked = this.checked;
        const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    });
    
    // 체크박스 사용한 다중삭제 기능
    document.getElementById('deleteBtn').addEventListener('click', () => {
        const selectedUsers = Array.from(document.querySelectorAll('tbody input[type="checkbox"]:checked'))
        .map(checkbox => ({
            userIdx: checkbox.getAttribute('data-u-idx'),
            userId: checkbox.getAttribute('data-u-id')
        }));
        if (selectedUsers.length > 0) {
            deleteUsers(selectedUsers);
        } else {
            alert('삭제할 사용자를 선택해주세요.');
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

    // 데이터 로드 함수 호출
    loadUserData(currentPage);
    
    // 검색 버튼 클릭 시와 검색 필드에서 엔터 키 입력 시 검색
    document.getElementById('searchButton').addEventListener('click', () => {
        executeSearch();
    });

    document.getElementById('searchInput').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            executeSearch();
        }
    });

    // 페이지 당 항목 수 변경
    document.getElementById('itemCountSelect').addEventListener('change', (event) => {
        itemsPerPage = parseInt(event.target.value, 10);
        loadUserData(1);
    });

    // 사용자 추가 버튼 클릭 시
    document.getElementById('addUserBtn').onclick = function() {
        clearFormFields();
        loadCompanyList(); // 회사 리스트 로드
        document.getElementById('addPopupLayer').style.display = 'flex';
    };

    // 팝업 내 닫기 버튼 클릭 시 팝업 닫기
    document.querySelectorAll('.popup .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeBtn.closest('.popup').style.display = 'none';
        });
    });

    // 팝업 내 취소 버튼 클릭 시 팝업 닫기
    document.querySelectorAll('.cancleBtn').forEach(cancelBtn => {
        cancelBtn.addEventListener('click', () => {
            cancelBtn.closest('.popup').style.display = 'none';
        });
    });

    // 회사 리스트 로드 함수
    function loadCompanyList() {
        makeRequest('get', 'http://192.168.0.18:28888/with/com_list')
            .then(response => {
                const companies = response.data.data;
                const selectElement = document.getElementById('addCompanySelect');
                selectElement.innerHTML = 
                '<option value="" disabled selected hidden>회사를 선택해주세요.</option>'; // 초기화
                companies.forEach(company => {
                    const option = document.createElement('option');
                    option.value = company.com_idx;
                    option.textContent = company.c_name;
                    selectElement.appendChild(option);
                });
            })
            .catch(error => handleError(error, '회사 목록을 불러오는 데 실패했습니다.'));
        }
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
            document.querySelector('thead input[type="checkbox"]').checked = false;
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
        let approveButton = '';
        if (user.status === 'N') {
            approveButton = `<button class="approveBtn" data-u-idx="${user.user_idx}" data-u-id="${user.user_id}">승인</button>`;
        } else if (user.status === 'Y') {
            approveButton = `<button class="approveCBtn" disabled>완료</button>`;
        }
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center justify-content-center">
                    <input type="checkbox" data-u-idx="${user.user_idx}" data-u-id="${user.user_id}">
                </div>
            </td>
            <td>${user.user_name}</td>
            <td>${user.user_id}</td>
            <td>${user.phone_number}</td>
            <td>${user.user_id}</td>
            <td>${user.c_name}</td>
            <td>${user.department}</td>
            <td>${user.user_rank}</td>
            <td>${user.user_position}</td>
            <td class="buttons">${approveButton}</td>
            <td class="buttons center-align">
                <button class="modifyBtn"  data-u-id="${user.user_id}" data-u-idx="${user.user_idx}">수정</button>
                <button class="deleteBtn" data-u-id="${user.user_id}" data-u-idx="${user.user_idx}">삭제</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    addEventListeners();
}

// 이벤트 리스너 등록
function addEventListeners() {
    // 동적으로 생성된 승인 버튼에 대한 이벤트 리스너 추가
    document.querySelectorAll('.approveBtn').forEach(button => {
        button.addEventListener('click', approveUser);
    });

    // 동적으로 생성된 삭제 버튼에 대한 이벤트 리스너 추가
    document.querySelectorAll('.deleteBtn').forEach(button => {
        button.addEventListener('click', function() {
            const userIdx = this.getAttribute('data-u-idx');
            const userId = this.getAttribute('data-u-id');
            deleteUser([{ user_idx: userIdx, user_id: userId }]);
        });
    });

    // 동적으로 생성된 수정 버튼에 대한 이벤트 리스너 추가
    document.querySelectorAll('.modifyBtn').forEach(button => {
        button.addEventListener('click', modifyUser);
    });
}

// 승인 함수
function approveUser() {
    const userIdx = this.getAttribute('data-u-idx');
    const userId = this.getAttribute('data-u-id');

    // 서버에 post 요청
    makeRequest('post', `http://192.168.0.18:28888/with/user/${userIdx}/${userId}`)
        .then(response => {
            console.log(response.data);
            alert('승인되었습니다.');
            localStorage.setItem('currentPage', currentPage);
            location.reload();
        })
        .catch(error => handleError(error, '승인에 실패했습니다.'));
}

// 삭제 요청 함수
function deleteUsers(users) {
    makeRequest('delete', 'http://192.168.0.18:28888/with/del_user', users)
        .then(response => {
            console.log('삭제 응답:', response.data);
            alert('삭제되었습니다.');
            location.reload();
        })
        .catch(error => handleError(error, '삭제에 실패했습니다.'));
}

// 개별 삭제 요청 함수
function deleteUser(user) {
    makeRequest('delete', 'http://192.168.0.18:28888/with/user_del', user)
        .then(response => {
            console.log('사용자 삭제 응답:', response.data);
            alert('삭제되었습니다.');
            loadUserData(currentPage); // 데이터를 다시 불러와서 갱신
        })
        .catch(error => {
            if (error.response && error.response.status === 401) {
                // 401에러 발생 시 로그아웃 함수 호출
                window.logout();
            } else {
                handleError(error, '삭제에 실패했습니다.');
            }
        });
}

// 수정 함수
function modifyUser() {
    const userIdx = this.getAttribute('data-u-idx');
    const user = users.find(u => u.user_idx == userIdx);
    
    if (user) {
        editingUserId = userIdx; // 수정할 사용자 ID 설정
        document.getElementById('modifyUserId').value = user.user_id;
        document.getElementById('modifyUserName').value = user.user_name;
        document.getElementById('modifyUserPhone').value = user.phone_number;
        document.getElementById('modifyRank').value = user.user_rank;
        document.getElementById('modifyPosition').value = user.user_position;
        document.querySelector(`input[name="modifyStatus"][value="${user.status}"]`).checked = true;

        document.getElementById('modifyPopupLayer').style.display = 'flex';
    } else {
        console.error('User not found with idx:', userIdx);
    }
}

// 폼 필드 초기화
function clearFormFields() {
    document.getElementById('addUserName').value = '';
    document.getElementById('addUserPassword').value = '';
    document.getElementById('addUserId').value = '';
    document.getElementById('addUserPhone').value = '';
    document.getElementById('addPosition').value = '';
    document.getElementById('addRank').value = '';
    document.getElementById('addCompanySelect').value = ''; // 회사 선택 초기화
}

// 사용자 추가 함수
function addUserData() {
    const userName = document.getElementById('addUserName').value;
    const userId = document.getElementById('addUserId').value;
    const userPassword = document.getElementById('addUserPassword').value;
    const userPhone = document.getElementById('addUserPhone').value;
    const position = document.getElementById('addPosition').value;
    const rank = document.getElementById('addRank').value;
    const statusYes = document.querySelector('input[name="addStatus"]:checked').value;
    const com_idx = document.getElementById('addCompanySelect').value; // 선택된 회사 com_idx 가져오기

    const newUser = {
        id: Date.now().toString(), // 임시 ID 생성
        name: userName,
        userId: userId,
        userPassword: userPassword,
        contact: userPhone,
        position: position,
        rank: rank,
        status: statusYes
    };

    users.push(newUser);
    console.log('추가데이터:', newUser);

    const token = localStorage.getItem('accessToken');

    // FormData 안의 모든 key-value 쌍을 출력하는 함수
    function logFormData(formData) {
        for (let pair of formData.entries()) {
            console.log(`${pair[0]}: ${pair[1]}`);
        }
    }

    // 요청할 폼 데이터
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('user_pw', userPassword);
    formData.append('user_name', userName);
    formData.append('status', statusYes);
    formData.append('com_idx', com_idx );
    formData.append('phone_number', userPhone);
    formData.append('user_rank', rank);
    formData.append('user_position', position);

    logFormData(formData); // FormData 내용 로그 출력

    axios.post('http://192.168.0.18:28888/with/signup', formData, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    })
    .then(response => {
        console.log(response.data);
        alert('추가되었습니다.');
        clearFormFields();
        location.reload();
    })
    .catch(error => {
        console.error('사용자 등록 오류:', error.response ? error.response.data : error.message);
        alert('사용자 등록에 실패했습니다.');
    });
}

// 사용자 수정 함수
function updateUserData() {
    const userIdx = editingUserId;
    const user = users.find(u => u.user_idx == userIdx);

    if (!user) {
        console.error('User not found with idx:', userIdx);
        return;
    }

    const userName = document.getElementById('modifyUserName').value.trim();
    const userId = document.getElementById('modifyUserId').value.trim();
    const userPhone = document.getElementById('modifyUserPhone').value.trim();
    const rank = document.getElementById('modifyRank').value.trim();
    const position = document.getElementById('modifyPosition').value.trim();
    const status = document.querySelector('input[name="modifyStatus"]:checked').value;
    const user_idx = userIdx; 

    // 수정된 사용자 정보 업데이트
    user.user_name = userName;
    user.userId = userId;
    user.contact = userPhone;
    user.rank = rank;
    user.position = position;
    user.status = status;
    user.user_idx = user_idx; // 회사 ID 업데이트

    const token = localStorage.getItem('accessToken');

    // JSON 객체 생성
    const userData = {
        user_idx: userIdx,
        user_id: userId,
        user_name: userName,
        status: status,
        phone_number: userPhone,
        user_rank: rank,
        user_position: position,
    };

     // 서버에 수정된 사용자 데이터 전송
     axios.put(`http://192.168.0.18:28888/with/user/${userIdx}/${userId}`, userData, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('사용자 수정 응답:', response.data);
        alert('사용자 정보가 수정되었습니다.');
        location.reload(); // 페이지 새로 고침
    })
    .catch(error => {
        console.error('사용자 수정 오류:', error.response ? error.response.data : error.message);
        alert('사용자 정보 수정에 실패했습니다.');
    });
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
