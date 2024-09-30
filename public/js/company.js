// 공통 변수 선언
let companies = []; // 서버에서 받아온 회사 데이터
let currentPage = 1; // 현재 페이지
let itemsPerPage = 10; // 페이지 당 항목 수 (초기값)
let totalPage = 1; // 총 페이지 수
let optionType = "all"; // 기본 옵션 타입
let optionValue = ""; // 검색어
let total_count;
let selectedCompany = null; // 수정에서 사용될 선택된 회사 정보

// url
const defaultUrl = "http://safe.withfirst.com:28888"
const params = new URL(document.location.href).searchParams;

// 토큰
const rtoken = getCookieValue('refreshToken');
const atoken = getCookieValue('accessToken');

// 쿠키에서 특정 값 가져오는 함수
function getCookieValue(name) {
    let value = `; ${document.cookie}`;
    let parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// 회사 데이터 가져오기
function fetchCompanyData(page = 1) {
    
    // 현재 페이지 기록
    currentPage = page;

    $.ajax({
        url : defaultUrl + `/with/com_list?option_type=${optionType}&option_value=${optionValue}&per_page=${itemsPerPage}&page=${currentPage}`,
        method : 'GET',
        headers : {
            'Authorization' : `Bearer ${rtoken}`
        },
        success : function(response) {
            console.log('회사 목록 데이터를 조회하는데 성공하였습니다.');
            console.log('회사 데이터 : ', response.data);
            console.log('회사 데이터 : ', response);

            // 로컬스토리지에 현재 페이지 저장
            localStorage.setItem('currentPage', currentPage);

            companies = response.data;
            totalPage = response.total_page || 1;
            total_count = response.total_count;

            renderTable();
            renderPagination();
        }
    });
}

// 가져온 데이터로 테이블 렌더링
function renderTable() {
    $('.contentWrap p').text(`전체 회사 (${total_count})`);

    const tableBody = $('#companyTableBody').empty();
    const startIndex = (currentPage - 1) * itemsPerPage;

    companies.forEach(function (company, index) {
        const approveButton = company.chan_yn === 'N' ? 
            `<button class="approveBtn" data-com-idx="${company.com_idx}" data-c-id="${company.c_id}" data-u-id="${company.user_id}">승인</button>` : 
            `<button class="approveCBtn" disabled>완료</button>`;

        // 'attribute'가 'brc'인 파일 찾기 (company.files가 배열인지 확인)
        const brcFile = Array.isArray(company.files) ? company.files.find(file => file.attribute === 'brc') : null;

        const fileName = brcFile ? brcFile.o_f_name : '파일 없음';
        const fileLink = brcFile ?
        `<a href="${brcFile.domain}/${brcFile.f_idx}" class="download-link" data-f-idx="${brcFile.f_idx}">
        <img src="images/download.svg" alt="download">${fileName}
        </a>` 
        : '파일 없음';

        const row = `
        <tr>
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
            <td class="table-cell-ellipsis">${fileLink}</td>
            <td class="buttons"><button class="userBtn moveBtn" data-com-idx="${company.com_idx}" data-c-id="${company.c_id}">이동</button></td>
            <td class="buttons"><button class="categoryBtn moveBtn" data-com-idx="${company.com_idx}" data-c-id="${company.c_id}">이동</button></td>
            <td class="buttons"><button class="boardBtn moveBtn" data-com-idx="${company.com_idx}" data-c-id="${company.c_id}">이동</button></td>
            <td class="buttons"><button class="teamBtn moveBtn" data-com-idx="${company.com_idx}" data-c-id="${company.c_id}" data-c-name="${company.c_name}">이동</button></td>
            <td class="buttons">${approveButton}</td>
            <td class="buttons center-align">
                <button class="modifyBtn comModify" data-id="${company.com_idx}">수정</button>
                <button class="deleteBtn" data-com-idx="${company.com_idx}" data-c-id="${company.c_id}">삭제</button>
            </td>
        </tr>`;
        tableBody.append(row);
    });

    // 동적으로 생성된 요소들에 이벤트 리스너 추가
    $('#companyTableBody').on('click', '.userBtn', moveToPage('user.html'));
    $('#companyTableBody').on('click', '.categoryBtn', moveToPage('category.html'));
    $('#companyTableBody').on('click', '.boardBtn', moveToPage('board.html'));
    $('#companyTableBody').on('click', '.teamBtn', moveToPage('organization.html'));
    $('.comModify').on('click', modifyCompany);
    $('.approveBtn').on('click', approveCompany);
    $('.deleteBtn').on('click', deleteSingleCompany);
    $('.download-link').on('click', downloadFile);
}

// 페이지네이션 렌더링
function renderPagination() {
    const pagination = $('#pagination').empty();
    const first = $('<li class="page-item"><a class="page-link" href="#"><<</a></li>');
    first.on('click', function (event) {
        event.preventDefault();
        fetchCompanyData(1);
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
            fetchCompanyData(i);
        });
        pagination.append(pageItem);
    }

    const last = $('<li class="page-item"><a class="page-link" href="#">>></a></li>');
    last.on('click', function (event) {
        event.preventDefault();
        fetchCompanyData(totalPage);
    });
    pagination.append(last);
}


// 페이지 이동 함수 (다양한 관리 페이지로 이동)
function moveToPage(page) {
     // 외부 함수 moveToPage가 실행됨
     console.log(`moveToPage 실행됨, page: ${page}`);

    return function() {
        // 나중에 클릭 시 반환된 이 함수가 실행됨
        console.log(`페이지 이동: ${page}`);

        const com_id = $(this).data('c-id');
        const comIdx = $(this).data('com-idx');
        
        // 로컬스토리지에 com_idx 저장
        localStorage.setItem('com_idx', comIdx);
       
        const formData = new FormData();

        formData.append('com_id', com_id);


        console.log('사업자번호', com_id);
        console.log('리프레시토큰', rtoken);

        $.ajax({
            url : defaultUrl + '/with/com_connect',
            method : 'POST',
            headers : {
                'Authorization' : `Bearer ${rtoken}`
            },
            contentType: false,
            processData: false,
            data : formData,
            success : function(response) {
                console.log('회사 DB에 접속 성공');
                console.log('응답 데이터 : ', response.data);
                
                localStorage.setItem('accessToken', response.data.accessToken);
                localStorage.setItem('refreshToken', response.data.refreshToken);
                localStorage.setItem('accessId', response.data.accessId);
                window.location.href = `${page}?=${comIdx}`;
            },
            error : function(e) {
                console.log(e);
                console.log(" error :: 회사 접속 에러");
            } 
        })
    }
}

// 회사 승인 요청 함수
function approveCompany() {
    const comIdx = $(this).data('com-idx');
    const comId = $(this).data('c-id');
    const userId =  $(this).data('u-id');

    const formData = new FormData();

    formData.append('com_id', comId);
    formData.append('user_id', userId);

    $.ajax({
        url: defaultUrl + `/with/com_approve`,
        method: 'POST',
        headers : {
            'Authorization' : `Bearer ${rtoken}`
        },
        contentType: false,
        processData: false,
        data : formData,
        success : function(response) {
            alert('승인되었습니다.');
            location.reload();
        },
        error : function(e) {
            console.log(e)
            console.log("error ::");
        }
    })
}

// 폼 필드 초기화 함수
function clearFormFields() {
    $('#c_name').val(''); // 회사명 초기화
    $('#owner_name').val(''); // 대표자명 초기화
    $('#c_id').val(''); // 사업자번호 초기화
    $('#registerFileInput').val(''); // 파일명 초기화
    $('#registerRealFileInput').val(null); // 실제 파일 초기화
}

// 회사 등록 함수
function addCompany() {
    // 입력필드에서 값 가져오기
    const companyName = $('#c_name').val().trim();
    const representativeName = $('#owner_name').val().trim();
    const businessNumber = $('#c_id').val().trim();
    const fileInputs = $('#registerRealFileInput')[0].files; // 파일들을 배열로 가져옴

    console.log('파일 확인',fileInputs);
    
    // 요청할 폼 데이터
    const formData = new FormData();
    formData.append('c_name', companyName);
    formData.append('owner_name', representativeName);
    formData.append('c_id', businessNumber);

    // 파일이 존재할 경우에만 처리 (여러 파일을 처리)
    for (let i = 0; i < fileInputs.length; i++) {
        formData.append(`files[${i}][action]`, 'add'); // 파일 액션 추가
        formData.append(`files[${i}][file]`, fileInputs[i]); // 동적으로 파일 추가
    }

    // FormData 내용 확인 (콘솔 출력)
    for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]); // key: value 형식으로 출력
    }

    $.ajax({
        url : defaultUrl + '/with/com_add',
        method: 'POST',
        headers : {
            'Authorization' : `Bearer ${atoken}`
        },
        contentType: false, // FormData 사용 시 false로 설정
        processData: false, // FormData 사용 시 false로 설정
        data: formData,
        success: function(response) {
            // console.log('회사 등록 응답', response.data);
            alert('회사가 등록되었습니다.');
            $('#registerPopup').css('display', 'none'); // 팝업 닫기
            fetchCompanyData(currentPage); // 데이터를 다시 불러와서 갱신
            clearFormFields();
        },
        error : function(e) {
            console.log(e)
            console.log("error :: ")
        }
    });
}

// 회사 수정 팝업 등록 함수
function modifyComSave() {
    const companyName = $('#companyName').val().trim();
    const representativeName = $('#representativeName').val().trim();
    const comIdx = $(this).data('com-idx'); // 저장된 com_idx 값 가져오기
    const cId = $('#businessNumber').val().trim(); // c_id를 가져오는 부분
    const fileInputs = $('#realFileInput')[0].files; // 파일 입력 필드에서 파일 배열로 가져오기

    // 요청할 폼 데이터
    const formData = new FormData();
    formData.append('owner_name', representativeName);
    formData.append('c_name', companyName);
    formData.append('c_id', cId);
    formData.append('com_idx', comIdx);
    
    // // 파일이 있을 때만 파일 추가
    // if (fileInput) {
    //     formData.append('file', fileInput); // 'file'은 서버에서 기대하는 파일 필드 이름이어야 합니다.
    // }
    
    // 파일이 있을 때만 파일 추가
    if (fileInputs.length > 0 && selectedCompany.files) {
        for (let i = 0; i < fileInputs.length; i++) {
            const existingFile = selectedCompany.files[i];
            if (existingFile) {
                    formData.append(`files[${i}][action]`, 'update'); // 파일 액션 추가
                    formData.append(`files[${i}][f_idx]`, existingFile.f_idx); // f_idx 추가
                }
                formData.append(`files[${i}][file]`, fileInputs[i]); // 파일 추가
            }
        }


    // FormData 내용 로그 출력
    formData.forEach((value, key) => {
        console.log(`${key}: ${value}`);
    });

    // 수정 요청 보내기
    $.ajax({
        url: defaultUrl + `/with/com_edit`,
        type: 'POST',
        data: formData,
        processData: false, // FormData 사용 시 false로 설정
        contentType: false, // FormData 사용 시 false로 설정
        headers: {
            'Authorization': `Bearer ${rtoken}`,
        },
        success: function (response) {
            console.log('회사 정보 수정 응답:', response);
            alert('회사 정보가 수정되었습니다.');
            fetchCompanyData(currentPage); // 현재 페이지 데이터 갱신
            localStorage.setItem('currentPage', currentPage);
            // 페이지 새로 고침
            location.reload();
        },
        error: function (error) {
            console.error('회사 정보 수정 오류:', error.responseJSON ? error.responseJSON : error.statusText);

            if (error.status === 401) {
                // 401 에러 발생 시 로그아웃 함수 호출
                window.logout();
            } else {
                // 기타 에러 처리
                alert('수정에 실패했습니다.');
            }
        }
    });
}

// 회사 수정 함수
function modifyCompany() {
    const companyId = $(this).data('id');
    const company = companies.find(c => c.com_idx == companyId);
    // 선택된 회사의 데이터를 selectedCompany에 저장
    selectedCompany = companies.find(c => c.com_idx == companyId);
    console.log('선택된 회사 정보@@@@@@@@@@@@@', selectedCompany);

    $('#companyName').val(company.c_name);
    $('#representativeName').val(company.owner_name);
    $('#businessNumber').val(company.c_id);
    $('#registrationDate').text(company.created_date.split(' ')[0]);
    $('#modifySaveBtn').data('com-idx', company.com_idx);
    $('#modifyPopup').css('display', 'flex');
    // $('#fileInput').val(company.o_f_name);

    // 파일 목록이 있을 경우 f_idx 저장
    if (Array.isArray(company.files)) {
        company.files.forEach((file, index) => {
            // 파일 f_idx를 data-f-idx 속성에 저장
            $('#fileInput').val(file.o_f_name).data(`f-idx-${index}`, file.f_idx);

            // 저장된 f_idx 값을 콘솔에 출력
            console.log(`file ${index} f_idx:`, $('#fileInput').data(`f-idx-${index}`));
        });
    }
}

// 회사 개별 삭제 함수 
function deleteSingleCompany() {
    const c_id = $(this).data('c-id');
    const comIdx = $(this).data('com-idx');
    deleteCompanies([{ c_id: c_id, com_idx: comIdx }]);
}

// 삭제 요청 함수
function deleteCompanies(companies) {
    console.log('전송될 데이터:', JSON.stringify(companies));

    $.ajax({
        url : defaultUrl + '/with/com_del',
        method: 'DELETE',
        headers : {
            'Authorization': `Bearer ${rtoken}`,
            'Content-Type': 'application/json'
        },
        data : JSON.stringify(companies),
        success : function(response) {
            console.log('회사 삭제 응답', response.data);
            alert('삭제되었습니다.');
            fetchCompanyData(currentPage); // 현재 페이지 데이터 갱신
            localStorage.setItem('currentPage', currentPage);
            location.reload();
        },
        error : function(e) {
            console.log(e);
            console.log("errpr :: delete error");
        }
    })
}

// 파일 다운로드 함수
function downloadFile(event) {
    event.preventDefault();
    const fileIdx = $(this).data('f-idx');
    const token = getCookieValue('accessToken');
    const url = `http://safe.withfirst.com:28888/file/download/${fileIdx}`;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.responseType = 'blob'; // 바이너리 데이터를 처리하기 위해 blob으로 설정

    xhr.onload = function () {
        if (xhr.status === 200) {
            // Content-Disposition 헤더에서 파일 이름 추출
            const disposition = xhr.getResponseHeader('content-disposition');
            let filename = 'downloaded_file';
            if (disposition && disposition.includes('attachment')) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                if (matches && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            // Blob 데이터를 사용하여 파일 다운로드
            const blob = xhr.response;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            alert('파일 다운로드에 실패했습니다.');
        }
    };

    xhr.onerror = function () {
        alert('파일 다운로드 중 오류가 발생했습니다.');
    };

    xhr.send();
}


$(function() {
    
    // // DOM이 준비된 후 실행될 코드
    // fetchCompanyData(1);
    
    // // localStorage에서 현재 페이지 번호 가져오기
    // const savedPage = localStorage.getItem('currentPage');
    // if (savedPage) {
    //     currentPage = parseInt(savedPage, 10);
    //     localStorage.removeItem('currentPage');
    // } else {
    //     currentPage = 1;
    // }
    
    // fetchCompanyData(currentPage);
    
    // localStorage에서 현재 페이지 번호 가져오기
    const savedPage = localStorage.getItem('currentPage');
    currentPage = savedPage ? parseInt(savedPage, 10) : 1;
 
    // 페이지 데이터 로드
    fetchCompanyData(currentPage);

    // 검색 버튼 클릭 시
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
        fetchCompanyData(1);
    }
    
    // 페이지 당 항목 수 변경
    $('#itemCountSelect').on('change', function () {
        itemsPerPage = parseInt($(this).val(), 10);
        fetchCompanyData(1);
    });
    
    // 회사 등록 버튼 클릭 시 팝업 표시
    $('#addCompanyBtn').on('click', function() {
        $('#registerPopup').css('display', 'flex');
    });
    
    // 등록 팝업 첨부 버튼 클릭 시 파일 입력 필드 클릭
    $('#registerAttachBtn').on('click', function () {
        $('#registerRealFileInput').click();
    });
    
    // 등록 팝업 파일 선택 시 파일 이름 표시
    $('#registerRealFileInput').on('change', function () {
        const fileInput = $('#registerFileInput');
        const files = this.files;
        if (files.length > 0) {
            fileInput.val(files[0].name);
        }
    });
    
    // 회사 등록 저장 버튼 클릭 이벤트 핸들러 추가
    $('#registerSaveBtn').on('click', addCompany);

    // 회사 수정 팝업 내 저장 버튼 클릭 이벤트 핸들러 추가
    $('#modifySaveBtn').on('click', modifyComSave);

    // 다중 선택
    $('thead input[type="checkbox"]').on('change', function () {
        const isChecked = $(this).is(':checked');
        $('tbody input[type="checkbox"]').prop('checked', isChecked);
    });
    
    // 다중 삭제
    $('#deleteBtn').on('click', function () {
        const selectedCompanies = $('tbody input[type="checkbox"]:checked').map(function () {
            return {
                c_id: $(this).data('c-id'),
                com_idx: $(this).data('com-idx')
            };
        }).get();

        if (selectedCompanies.length > 0) {
            deleteCompanies(selectedCompanies);
        } else {
            alert('삭제할 회사를 선택해주세요.');
        }
    });

    // 첨부 파일 수정
    $('#attachBtn').on('click', function () {
        // 숨겨진 파일 입력 필드를 클릭하여 파일 선택 창 열기
        $('#realFileInput').click();
    });

    // 파일 선택 시 이벤트
    $('#realFileInput').on('change', function () {
        const files = this.files;
        
        // 선택된 파일이 있으면 파일명을 표시
        if (files.length > 0) {
            $('#fileInput').val(files[0].name);
        }
    });

    // 팝업 닫기 버튼 클릭 시 팝업 닫기
    $(document).on('click', '.popup .close', function() {
        $(this).closest('.popup').css('display', 'none');
    });
    
});

