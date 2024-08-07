let users = []; // 전역 변수로 users 선언
let isEditMode = false; // 현재 편집 모드인지 확인하는 변수
let editingUserId = null; // 편집 중인 사용자의 ID

let currentPage = 1; // 현재 페이지
let itemsPerPage = 10; // 페이지 당 항목 수 (초기값)
let totalPage = 1; // 총 페이지 수
let optionType = "all";
let optionValue = "";


document.addEventListener('DOMContentLoaded', () => {
    // 체크박스 전체 선택
    document.querySelector('thead input[type="checkbox"]').addEventListener('change', function() {
        const isChecked = this.checked;
        const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    });
    
    // 다중삭제
    document.getElementById('deleteBtn').addEventListener('click', () => {
        const selectedUsers = Array.from(document.querySelectorAll('tbody input[type="checkbox"]:checked'))
        .map(checkbox => ({
            userIdx: checkbox.getAttribute('data-u-idx'),
            userId: checkbox.getAttribute('data-u-id')
        }));
        
        console.log(selectedUsers);
        if (selectedUsers.length > 0) {
            deleteUsers(selectedUsers);
        } else {
            alert('삭제할 회사를 선택해주세요.');
        }
    });

    // 삭제 요청 함수
    function deleteUsers(users) {
        const token = getCookieValue('accessToken');

        users.forEach(user => {
            axios.delete(`http://192.168.0.18:3500/with/user/${user.userIdx}/${user.userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => {
                console.log('사용자 삭제 응답:', response.data);
                alert('삭제되었습니다.');
                loadUserData(currentPage); // 데이터를 다시 불러와서 갱신
            })
            .catch(error => {
                console.error('사용자 삭제 오류:', error.response ? error.response.data : error.message);
                alert('삭제에 실패했습니다.');
            });
        });
    }

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


    // 페이지 당 항목 수 변경
    document.getElementById('itemCountSelect').addEventListener('change', (event) => {
        itemsPerPage = parseInt(event.target.value, 10);
        loadUserData(1);
    });

    // 사용자 추가 버튼 클릭 시
    document.getElementById('addUserBtn').onclick = function() {
        isEditMode = false;
        clearFormFields();
        document.querySelector('.popup-title span').textContent = '추가';
        document.getElementById('popupLayer').style.display = 'flex';
    };

    // 팝업 레이어 닫기
    document.querySelector('.close').onclick = function() {
        document.getElementById('popupLayer').style.display = 'none';
    };

    // 저장 버튼 클릭 이벤트 처리
    document.querySelector('.saveBtn').onclick = function() {
        if (isEditMode) {
            // 수정 모드
            updateUserData();
        } else {
            // 추가 모드
            addUserData();
        }
        document.getElementById('popupLayer').style.display = 'none';
    };
});

// 쿠키에서 특정 값을 가져오는 함수
function getCookieValue(name) {
    let value = `; ${document.cookie}`;
    let parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// 사용자 데이터 불러오기
function loadUserData(page = 1) {
    currentPage = page;
    const token = localStorage.getItem('accessToken');
    const url = `http://192.168.0.18:3500/with/users?option_type=${optionType}&option_value=${optionValue}&per_page=${itemsPerPage}&page=${currentPage}`;

    axios.get(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        const data = response.data.data;
        console.log('사용자 data:', data);
        console.log('사용자 data:', response.data);

        users = data;
        totalPage = response.data.total_page || 1; 

        console.log('토탈페이지:', totalPage);

        renderUserTable();
        renderPagination(); // 페이지네이션 렌더링

        // 페이지네이션 이동 시 thead 체크박스 초기화
        document.querySelector('thead input[type="checkbox"]').checked = false;
    })
    .catch(error => {
        console.error('Error loading user data:', error);
    });
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
            <td>${user.position}</td>
            <td class="buttons">${approveButton}</td>
            <td class="buttons center-align">
                <button class="modifyBtn"  data-u-id="${user.user_id}" data-u-idx="${user.user_idx}">수정</button>
                <button class="deleteBtn" data-u-id="${user.user_id}" data-u-idx="${user.user_idx}">삭제</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // 동적으로 생성된 승인 버튼에 대한 이벤트 리스너 추가
    document.querySelectorAll('.approveBtn').forEach(button => {
        button.addEventListener('click', function() {
            const userIdx = this.getAttribute('data-u-idx');
            const userId = this.getAttribute('data-u-id');
            const token = localStorage.getItem('accessToken');

            console.log('유저 정보:', userIdx);
            console.log('유저 정보:', userId);

            // 서버에 post 요청
            axios.post(`http://192.168.0.18:3500/with/user/${userIdx}/${userId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => {
                console.log(response.data);
                alert('승인되었습니다.');
                localStorage.setItem('currentPage', currentPage);
                // 페이지 새로 고침
                location.reload();
            })
            .catch(error => {
                console.error('Error approving company:', error.response ? error.response.data : error.message);
                alert('승인에 실패했습니다.');
            });
        });
    });

    // 개별 삭제
    document.querySelectorAll('.deleteBtn').forEach(button => {
        button.addEventListener('click', function() {
            const userIdx = this.getAttribute('data-u-idx');
            const userId = this.getAttribute('data-u-id');
            deleteUser([{ user_idx: userIdx, user_id: userId }]);
        })
    });

    // 삭제 요청 함수
function deleteUser(users) {
    const token = getCookieValue('accessToken');

    users.forEach(user => {
        axios.delete(`http://192.168.0.18:3500/with/user/${user.user_idx}/${user.user_id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            console.log('사용자 삭제 응답:', response.data);
            alert('삭제되었습니다.');
            loadUserData(currentPage); // 데이터를 다시 불러와서 갱신
        })
        .catch(error => {
            console.error('사용자 삭제 오류:', error.response ? error.response.data : error.message);
            alert('삭제에 실패했습니다.');
        });
    });
}

// 동적으로 생성된 수정 버튼에 대한 이벤트 리스너 추가
document.querySelectorAll('.modifyBtn').forEach(button => {
    button.addEventListener('click', function() {
        const userIdx = this.getAttribute('data-u-idx');
        openModifyPopup(userIdx);
    });
});
}

// 수정 팝업 열기 및 데이터 채우기
function openModifyPopup(userIdx) {
    const user = users.find(u => u.user_idx == userIdx);

    if(user) {
        // 폼 필드에 사용자 정보 채우기
        document.getElementById('userName').value = user.name;
        document.getElementById('userId').value = user.userId;
        document.getElementById('userPhone').value = user.contact;
        document.getElementById('department').value = user.department;
        document.getElementById('position').value = user.position;
        document.querySelector(`input[name="status"][value="${user.status}"]`).checked = true;

        editingUserId = userIdx; // 수정할 사용자 ID 저장
        isEditMode = true;

        // 팝업 타이틀 수정
        document.querySelector('#userModify .popup-title span').textContent = '수정';
        document.getElementById('userModify').style.display = 'flex';
    } else {
        console.error('User not found with idx:', userIdx);
    }
}

// 폼 필드 초기화
function clearFormFields() {
    document.getElementById('userName').value = '';
    document.getElementById('userPassword').value = '';
    document.getElementById('userId').value = '';
    document.getElementById('userPhone').value = '';
    document.getElementById('department').value = '';
    document.getElementById('position').value = '';
}

// 사용자 추가 함수
function addUserData() {
    const userName = document.getElementById('userName').value;
    const userId = document.getElementById('userId').value;
    const userPassword = document.getElementById('userPassword').value;
    const userPhone = document.getElementById('userPhone').value;
    const department = document.getElementById('department').value;
    const position = document.getElementById('position').value;
    const statusYes = document.querySelector('input[name="status"]:checked').value;

    const newUser = {
        id: Date.now().toString(), // 임시 ID 생성
        name: userName,
        userId: userId,
        userPassword: userPassword,
        contact: userPhone,
        department: department, 
        position: position,
        status: statusYes
    };

    users.push(newUser);
    console.log('추가데이터:', newUser);

    const com_idx = localStorage.getItem('com_idx');
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
    formData.append('com_idx',com_idx );
    formData.append('phone_number',userPhone);

    logFormData(formData); // FormData 내용 로그 출력

    axios.post('http://192.168.0.18:3500/with/signup', formData, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    })
    .then(response => {
        console.log(response.data);
        alert('추가되었습니다.');
        loadUserData(currentPage);
    })
    .catch(error => {
        console.error('사용자 등록 오류:', error.response ? error.response.data : error.message);
        alert('회사 등록에 실패했습니다.');
    });
}

// 사용자 수정 함수
function updateUserData() {
    const userIdx = editingUserId;
    const user = users.find(u => u.user_idx === userIdx);
    if (!user) {
        console.error('User not found with idx:', userIdx);
        return;
    }

    const userName = document.getElementById('userName').value.trim();
    const userId = document.getElementById('userId').value.trim();
    const userEmail = document.getElementById('userEmail').value.trim();
    const userPhone = document.getElementById('userPhone').value.trim();
    const companyName = document.getElementById('companyName').value.trim();
    const department = document.getElementById('department').value.trim();
    const position = document.getElementById('position').value.trim();
    const status = document.querySelector('input[name="status"]:checked').value;

    // 수정된 사용자 정보 업데이트
    user.name = userName;
    user.userId = userId;
    user.email = userEmail;
    user.contact = userPhone;
    user.company = companyName;
    user.department = department;
    user.position = position;
    user.status = status;

    const token = getCookieValue('refreshToken');
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('user_name', userName);
    formData.append('status', status);
    formData.append('com_idx', localStorage.getItem('com_idx'));
    formData.append('phone_number', userPhone);

    // 서버에 수정된 사용자 데이터 전송
    axios.put(`http://192.168.0.18:3500/with/user/${userIdx}`, formData, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    })
    .then(response => {
        console.log('사용자 수정 응답:', response.data);
        alert('사용자 정보가 수정되었습니다.');
        loadUserData(); // 테이블 다시 렌더링
        document.getElementById('popupLayer').style.display = 'none'; // 팝업 닫기
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



