let companies = []; // 서버에서 받아온 회사 데이터
let currentPage = 1; // 현재 페이지
let itemsPerPage = 10; // 페이지 당 항목 수 (초기값)
let totalPage = 1; // 총 페이지 수
let optionType = "all"; // 기본 옵션 타입
let optionValue = ""; // 검색어

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('thead input[type="checkbox"]').addEventListener('change', function () {
        const isChecked = this.checked;
        const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    });

    // 다중 삭제
    document.getElementById('deleteBtn').addEventListener('click', () => {
        const selectedCompanies = Array.from(document.querySelectorAll('tbody input[type="checkbox"]:checked'))
            .map(checkbox => ({
                c_id: checkbox.getAttribute('data-c-id'),
                com_idx: checkbox.getAttribute('data-com-idx')
            }));

        if (selectedCompanies.length > 0) {
            deleteCompanies(selectedCompanies);
        } else {
            alert('삭제할 회사를 선택해주세요.');
        }
    });

    // 삭제 요청 함수
    function deleteCompanies(companies) {
        const token = getCookieValue('refreshToken');

        console.log('전송될 데이터:', JSON.stringify(companies));

        axios.delete('http://192.168.0.18:28888/with/del_com', {
            data: companies,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                console.log('회사 삭제 응답:', response.data);
                alert('삭제되었습니다.');
                localStorage.setItem('currentPage', currentPage);
                //페이지 새로 고침
                location.reload();
            })
            .catch(error => {
                console.error('회사 삭제 오류:', error.response ? error.response.data : error.message);
                alert('삭제에 실패했습니다.');
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
    fetchCompanyData(currentPage);

    // 페이지 로드 시 데이터 로드
    // fetchCompanyData(1);

    // 검색 버튼 클릭 시와 검색 필드에서 엔터 키 입력 시
    document.getElementById('searchButton').addEventListener('click', () => {
        executeSearch();
    });

    document.getElementById('searchInput').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // 엔터 키 기본 동작 방지
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
        fetchCompanyData(1);
    }

    // 페이지 당 항목 수를 변경
    document.getElementById('itemCountSelect').addEventListener('change', (event) => {
        itemsPerPage = parseInt(event.target.value, 10);
        fetchCompanyData(1);
    });

    // 회사 등록 버튼 클릭 시 팝업 표시
    document.getElementById('addCompanyBtn').addEventListener('click', () => {
        document.getElementById('registerPopup').style.display = 'flex';
    });

    // 등록 팝업: 첨부 버튼 클릭 시 파일 입력 필드 클릭
    document.getElementById('registerAttachBtn').addEventListener('click', () => {
        document.getElementById('registerRealFileInput').click();
    });

    // 등록 팝업: 파일 선택 시 파일 이름을 표시
    document.getElementById('registerRealFileInput').addEventListener('change', () => {
        const fileInput = document.getElementById('registerFileInput');
        const files = document.getElementById('registerRealFileInput').files;

        if (files.length > 0) {
            fileInput.value = files[0].name;
        }
    });

});

// 쿠키에서 특정 값을 가져오는 함수
function getCookieValue(name) {
    let value = `; ${document.cookie}`;
    let parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// 회사 데이터 가져오기
function fetchCompanyData(page = 1) {
    currentPage = page; // 매개 변수로 전달된 page 값 currentPage 변수에 저장
    const token = getCookieValue('refreshToken');
    const url = `http://192.168.0.18:28888/with/com-info?option_type=${optionType}&option_value=${optionValue}&per_page=${itemsPerPage}&page=${currentPage}`;

    axios.get(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            console.log('성공');
            const data = response.data.data;
            console.log('data', data);
            console.log('파일', response.data);


            // 데이터를 created_date 기준으로 내림차순 정렬
            // data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

            companies = data;
            totalPage = response.data.total_page || 1; // 기본값으로 1 사용
            renderTable();

            // 페이지네이션 이동 시 thead 체크박스 초기화
            document.querySelector('thead input[type="checkbox"]').checked = false;
        })
        .catch(error => {
            console.error('Error loading company data:', error.response ? error.response.data : error.message);
        });
}

// 테이블 렌더링 
function renderTable() {
    const tableBody = document.getElementById('companyTableBody');
    tableBody.innerHTML = ''; // 체이블 본문 초기화

    // 전체 데이터에서 현재 페이지의 시작 인덱스 계산
    const startIndex = (currentPage - 1) * itemsPerPage;

    companies.forEach((company, index) => {
        const row = document.createElement('tr');
        let approveButton = '';

        if (company.chan_yn === 'N') {
            approveButton = `<button class="approveBtn" data-com-idx="${company.com_idx}" data-c-id="${company.c_id}">승인</button>`;
        } else if (company.chan_yn === 'Y') {
            approveButton = `<button class="approveCBtn" disabled>완료</button>`;
        }

        row.innerHTML = `
        <td>
            <div class="d-flex align-items-center justify-content-center">
                <input type="checkbox" data-com-idx="${company.com_idx}" data-c-id="${company.c_id}">
            </div>
        </td>
        <td>${startIndex + index + 1}</td>
        <td>${company.c_name}</td>
        <td>${company.owner_name}</td>
        <td>${company.c_id}</td>
        <td>${company.created_date.split(' ')[0]}</td>
        <td><a href="#" class="download-link" data-f-idx="${company.f_idx}"><img src="images/download.svg" alt="download">${company.o_f_name}</a></td>
        <td class="buttons"><button class="userBtn moveBtn" data-com-idx="${company.com_idx}" data-c-id="${company.c_id}">이동</button></td>
        <td class="buttons"><button class="categoryBtn moveBtn" data-com-idx="${company.com_idx}" data-c-id="${company.c_id}">이동</button></td>
        <td class="buttons"><button class="boardBtn moveBtn" data-com-idx="${company.com_idx}" data-c-id="${company.c_id}">이동</button></td>
        <td class="buttons">${approveButton}</td>
        <td class="buttons center-align">
            <button class="modifyBtn comModify" data-id="${company.com_idx}">수정</button>

            <button class="deleteBtn" data-com-idx="${company.com_idx}" data-c-id="${company.c_id}">삭제</button>
        </td>
        `;
        tableBody.appendChild(row);
    });

    // 동적으로 생성된 파일 다운로드 링크에 이벤트 리스너 추가
    document.querySelectorAll('.download-link').forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault(); // 기본 링크 클릭 동작 방지
            const fileIdx = this.getAttribute('data-f-idx'); // f_idx 값 가져오기
            const token = getCookieValue('accessToken');

            const url = `http://192.168.0.18:28888/file/download/${fileIdx}`;

            axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                responseType: 'blob' // 응답을 blob으로 설정
            })
                .then(response => {
                    console.log('response', response);
                    // 원본 파일명 가져오기
                    const disposition = response.headers['content-disposition'];
                    let filename = 'downloaded_file';
                    if (disposition && disposition.indexOf('attachment') !== -1) {
                        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                        const matches = filenameRegex.exec(disposition);
                        if (matches != null && matches[1]) {
                            filename = matches[1].replace(/['"]/g, '');
                        }
                    }

                    //파일 다운로드
                    const blob = new Blob([response.data], { type: response.headers['content-type'] });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                })
                .catch(error => {
                    console.error('파일 다운로드 오류:', error.response ? error.response.data : error.message);
                    if (error.response && error.response.status === 401) {
                        // 401에러 발생 시 로그아웃 함수 호출
                        window.logout();
                    } else {
                        handleError(error, '삭제에 실패했습니다.');
                    }
                });
        });
    });

    // 동적으로 생성된 수정 버튼에 이벤트 리스너 추가
    document.querySelectorAll('.comModify').forEach(button => {
        button.addEventListener('click', function () {
            const companyId = this.getAttribute('data-id'); // 클릭 시 해당 회사 idx 저장
            const company = companies.find(c => c.com_idx == companyId); // 해당 idx 일치하는 회사 객체 저장

            // 해당 회사 객체로 팝업에 데이터 채우기
            document.getElementById('companyName').value = company.c_name;
            document.getElementById('representativeName').value = company.owner_name;
            document.getElementById('businessNumber').value = company.c_id;
            document.getElementById('registrationDate').textContent = company.created_date.split(' ')[0];
            document.getElementById('fileInput').value = company.o_f_name;

            // 저장 버튼에 com_idx를 data 속성으로 추가
            document.getElementById('modifySaveBtn').setAttribute('data-com-idx', company.com_idx);
            document.getElementById('modifyPopup').style.display = 'flex';
        });
    });

    //개별 삭제
    document.querySelectorAll('.deleteBtn').forEach(button => {
        button.addEventListener('click', function () {
            const c_id = this.getAttribute('data-c-id');
            const comIdx = this.getAttribute('data-com-idx');
            deleteCompany([{ c_id: c_id, com_idx: comIdx }]);
        })
    });

    // 삭제 요청 함수
    function deleteCompany(company) {
        const token = getCookieValue('refreshToken');

        console.log('전송될 데이터:', JSON.stringify(company));

        axios.delete('http://192.168.0.18:28888/with/del_com', {
            data: company,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                console.log('회사 삭제 응답:', response.data);
                alert('삭제되었습니다.');
                localStorage.setItem('currentPage', currentPage);
                //페이지 새로 고침
                location.reload();
            })
            .catch(error => {
                console.error('회사 삭제 오류:', error.response ? error.response.data : error.message);
                if (error.response && error.response.status === 401) {
                    // 401에러 발생 시 로그아웃 함수 호출
                    window.logout();
                } else {
                    alert('삭제에 실패했습니다.');
                }
            });
    }


    // 동적으로 생성된 사용자관리 이동 버튼에 이벤트 리스너 추가
    document.querySelectorAll('.userBtn').forEach(button => {
        button.addEventListener('click', function () {
            const com_id = this.getAttribute('data-c-id');
            const comIdx = this.getAttribute('data-com-idx');
            console.log('comIdx:', comIdx); // 추가된 로그
            console.log('com_id:', com_id); // 추가된 로그

            // 로컬 스토리지에 저장
            localStorage.setItem('com_idx', comIdx);
            const token = getCookieValue('refreshToken');

            //서버에 POST 요청
            axios.post(`http://192.168.0.18:28888/with/com-change/${com_id}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                withCredentials: true, // 크레덴셜 포함
            })
                .then(response => {
                    console.log('서버에서 받은 성공 데이터:', response.data);
                    localStorage.setItem('accessToken', response.data.data.accessToken);
                    localStorage.setItem('refreshToken', response.data.data.refreshToken);

                    // 로컬 스토리지에서 accessToken 가져와서 콘솔에 출력
                    const accessToken = localStorage.getItem('accessToken');
                    console.log('Stored accessToken:', accessToken);

                    //해당 회사의 카테고리 관리 페이지로 이동
                    window.location.href = `user.html?=${comIdx}`;
                })
                .catch(error => {
                    console.error('Error during post request:', error);

                    if (error.response && error.response.status === 401) {
                        // 401 에러 발생 시 로그아웃 함수 호출
                        window.logout();
                    } else {
                        // 기타 에러 처리
                        alert('요청 중 오류가 발생했습니다.');
                    }
                });
        });
    });

    // 동적으로 생성된 카테고리 이동 버튼에 이벤트 리스너 추가
    document.querySelectorAll('.categoryBtn').forEach(button => {
        button.addEventListener('click', function () {
            const com_id = this.getAttribute('data-c-id');
            const comIdx = this.getAttribute('data-com-idx');
            console.log('comIdx:', comIdx); // 추가된 로그
            console.log('com_id:', com_id); // 추가된 로그

            // 로컬 스토리지에 저장
            localStorage.setItem('com_idx', comIdx);
            const token = getCookieValue('refreshToken');

            //서버에 POST 요청
            axios.post(`http://192.168.0.18:28888/with/com-change/${com_id}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                withCredentials: true, // 크레덴셜 포함
            })
                .then(response => {
                    console.log('서버에서 받은 성공 데이터:', response.data);
                    localStorage.setItem('accessToken', response.data.data.accessToken);
                    localStorage.setItem('refreshToken', response.data.data.refreshToken);

                    // 로컬 스토리지에서 accessToken 가져와서 콘솔에 출력
                    const accessToken = localStorage.getItem('accessToken');
                    console.log('Stored accessToken:', accessToken);

                    //해당 회사의 카테고리 관리 페이지로 이동
                    window.location.href = `category.html?=${comIdx}`;
                })
                .catch(error => {
                    if (error.response && error.response.status === 401) {
                        // 401 에러 발생 시 로그아웃 함수 호출
                        window.logout();
                    } else {
                        // 기타 에러 처리
                        alert('요청 중 오류가 발생했습니다.');
                    }
                });
        });
    });

    // 동적으로 생성된 게시판관리 이동 버튼에 이벤트 리스너 추가
    document.querySelectorAll('.boardBtn').forEach(button => {
        button.addEventListener('click', function () {
            const com_id = this.getAttribute('data-c-id');
            const comIdx = this.getAttribute('data-com-idx');
            console.log('comIdx:', comIdx); // 추가된 로그
            console.log('com_id:', com_id); // 추가된 로그

            // 로컬 스토리지에 저장
            localStorage.setItem('com_idx', comIdx);
            const token = getCookieValue('refreshToken');

            //서버에 POST 요청
            axios.post(`http://192.168.0.18:28888/with/com-change/${com_id}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                withCredentials: true, // 크레덴셜 포함
            })
                .then(response => {
                    console.log('서버에서 받은 성공 데이터:', response.data);
                    localStorage.setItem('accessToken', response.data.data.accessToken);
                    localStorage.setItem('refreshToken', response.data.data.refreshToken);

                    // 로컬 스토리지에서 accessToken 가져와서 콘솔에 출력
                    const accessToken = localStorage.getItem('accessToken');
                    console.log('Stored accessToken:', accessToken);

                    //해당 회사의 카테고리 관리 페이지로 이동
                    window.location.href = `board.html?=${comIdx}`;
                })
                .catch(error => {
                    if (error.response && error.response.status === 401) {
                        // 401 에러 발생 시 로그아웃 함수 호출
                        window.logout();
                    } else {
                        // 기타 에러 처리
                        alert('요청 중 오류가 발생했습니다.');
                    }
                });
        });
    });

    // 동적으로 생성된 승인 버튼에 이벤트 리스너 추가
    document.querySelectorAll('.approveBtn').forEach(button => {
        button.addEventListener('click', function () {
            const comIdx = this.getAttribute('data-com-idx');
            const comId = this.getAttribute('data-c-id');
            const token = getCookieValue('refreshToken');

            // 서버에 PUT 요청
            axios.put(`http://192.168.0.18:28888/with/com-approved/${comIdx}/${comId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(response => {
                    console.log('Approval response:', response.data);
                    // 승인 후 UI 업데이트 등 추가 작업 가능
                    alert('승인되었습니다.');
                    localStorage.setItem('currentPage', currentPage);
                    //페이지 새로 고침
                    location.reload();
                })
                .catch(error => {
                    console.error('Error approving company:', error.response ? error.response.data : error.message);
                    alert('승인에 실패했습니다.');
                });
        });
    });

    // 페이지네이션 업데이트
    renderPagination();
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
        fetchCompanyData(1);
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
            fetchCompanyData(i);
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
        fetchCompanyData(totalPage);
    };
    pagination.appendChild(last);
}

// 팝업 내 저장 버튼 클릭 이벤트 핸들러 추가
document.getElementById('modifySaveBtn').addEventListener('click', function () {
    // 입력 필드에서 값 가져오기
    const companyName = document.getElementById('companyName').value.trim();
    const representativeName = document.getElementById('representativeName').value.trim();
    // const businessNumber = document.getElementById('businessNumber').value.trim(); 
    const comIdx = this.getAttribute('data-com-idx'); // 저장된 com_idx 값 가져오기
    const cId = document.getElementById('businessNumber').value.trim(); // c_id를 가져오는 부분

    // 요청할 폼 데이터
    const formData = new FormData();
    formData.append('owner_name', representativeName);
    formData.append('c_name', companyName);

    const token = getCookieValue('refreshToken');

    // 수정 PUT 요청 보내기
    axios.put(`http://192.168.0.18:28888//with/com-change/${cId}`, formData, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data' // 폼데이터 전송 시 설정
        }
    })
        .then(response => {
            console.log('회사 정보 수정 응답:', response.data);
            alert('회사 정보가 수정되었습니다.');
            localStorage.setItem('currentPage', currentPage);
            //페이지 새로 고침
            location.reload();
        })
        .catch(error => {
            console.error('회사 정보 수정 오류:', error.response ? error.response.data : error.message);

            if (error.response && error.response.status === 401) {
                // 401 에러 발생 시 로그아웃 함수 호출
                window.logout();
            } else {
                // 기타 에러 처리
                alert('수정에 실패했습니다.');
            }
        });
});

// 등록 저장 버튼 클릭 이벤트 핸들러 추가
document.getElementById('registerSaveBtn').addEventListener('click', () => {

    // 입력필드에서 값 가져오기
    const companyName = document.getElementById('c_name').value.trim();
    const representativeName = document.getElementById('owner_name').value.trim();
    const businessNumber = document.getElementById('c_id').value.trim();
    const status = document.querySelector('input[name="status"]:checked').value;
    const fileInput = document.getElementById('registerRealFileInput').files[0];

    // 요청할 폼 데이터
    const formData = new FormData();
    formData.append('c_name', companyName);
    formData.append('owner_name', representativeName);
    formData.append('c_id', businessNumber);
    formData.append('chan_yn', status); // 승인여부 (Y 또는 N)
    formData.append('file', fileInput); // 첨부 파일

    const token = getCookieValue('accessToken'); // 쿠키에서 토큰 가져오기

    // 서버에 POST 요청 보내기
    axios.post('http://192.168.0.18:28888/with/com-info', formData, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    })
        .then(response => {
            console.log('회사 등록 응답:', response.data);
            alert('회사가 등록되었습니다.');
            document.getElementById('registerPopup').style.display = 'none';
            // 추가적인 UI 업데이트 작업 수행 가능
            fetchCompanyData(currentPage); // 데이터를 다시 불러와서 갱신
        })
        .catch(error => {
            console.error('회사 등록 오류:', error.response ? error.response.data : error.message);
            alert('회사 등록에 실패했습니다.');
        });
});

// 첨부 파일 수정
document.getElementById('attachBtn').addEventListener('click', function () {
    // 숨겨진 파일 입력 필드를 클릭하여 파일 선택 창 열기
    document.getElementById('realFileInput').click();
});

// 파일 선택 시 이벤트
document.getElementById('realFileInput').addEventListener('change', function () {
    const fileInput = document.getElementById('fileInput');
    const files = this.files;

    // 선택된 파일이 있으면 파일명을 표시
    if (files.length > 0) {
        fileInput.value = files[0].name;
    }
});

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

