// 공통 변수 선언
let users = []; // 전역 변수로 users 선언
let currentPage = 1; // 현재 페이지
let itemsPerPage = 10; // 페이지 당 항목 수 (초기값)
let totalPage = 1; // 총 페이지 수
let optionType = "all";
let optionValue = "";
let total_count;
let editingUserId;
let originPw = ''; // 원래 비밀번호

// url
const defaultUrl = "http://safe.withfirst.com:28888";

// 토큰
const rtoken = getCookieValue('refreshToken');
const atoken = localStorage.getItem('accessToken');

// 회사 리스트 로드 함수
function fetchUserData(page = 1) {

    // 현재 페이지 기록
    currentPage = page;

    $.ajax({
        url : defaultUrl + `/with/user_list?option_type=${optionType}&option_value=${optionValue}&per_page=${itemsPerPage}&page=${currentPage}`,
        method : 'GET',
        headers : {
            'Authorization' : `Bearer ${atoken}`
        },
        success : function(response) {
            console.log('사용자 목록 데이터를 조회하는데 성공하였습니다.');
            console.log('사용자 데이터 : ', response.data);
            console.log('사용자 데이터 : ', response);

            // 로컬스토리지에 현재 페이지 저장
            localStorage.setItem('currentPage', currentPage);

            users = response.data;
            totalPage = response.total_page || 1;
            total_count = response.total_count;

            renderUserTable();
            renderPagination();

        },
        error : function(e) {
            console.log(e);
            console.log(" error :: 사용자 접속 에러");
        }
    })
}

// 유저 목록 테이블 렌더링
function renderUserTable() {

    $('.contentWrap p').text(`모든 사용자(${total_count})`);

    const tableBody = $('#userTableBody').empty(); // 기존 내용을 비우기

    users.forEach( function(user, index) {
        let approveButton = '';

        // user.status 값에 따라 승인 버튼 다르게 렌더링
        // N일 경우 '승인' 버튼 활성화
        // Y일 경우 '완료' 버튼
        if (user.status === 'N') {
            approveButton = `<button class="approveBtn" data-u-idx="${user.user_idx}" data-u-id="${user.user_id}">승인</button>`;
        } else if (user.status === 'Y') {
            approveButton = `<button class="approveCBtn" disabled>완료</button>`;
        }

        // 유저 테이블 행(row) 생성
        const row = $(`
            <tr>
                <td><div class="d-flex align-items-center justify-content-center">
                    <input type="checkbox" class="form-check-input" data-u-idx="${user.user_idx}" data-u-id="${user.user_id}">
                </div></td>
                <td>${user.user_idx}</td>
                <td class="userName" data-u-idx="${user.user_idx}">${user.user_name}</td>
                <td>${user.user_id}</td>
                <td>${user.c_name}</td>
                <td class="buttons">${approveButton}</td>
                <td class="buttons center-align">
                    <button class="detailBtn" data-u-idx="${user.user_idx}">보기</button>
                    <button class="modifyBtn" data-u-id="${user.user_id}" data-u-idx="${user.user_idx}">수정</button>
                    <button class="deleteBtn" data-u-idx="${user.user_idx}" data-u-id="${user.user_id}">삭제</button>
                </td>
            </tr>
        `);

        // 동적으로 생성된 행(row)을 테이블에 추가
        tableBody.append(row);

        // 이름 클릭 시 팝업 호출
        row.find('.userName').on('click', function() {
            const userIdx = $(this).data('u-idx');
            detailUser(userIdx); // 보기 버튼과 동일한 기능 호출
        });

    });

    // 체크박스 상태 초기화
    $('thead input[type="checkbox"]').prop('checked', false);

    // 동적으로 생성된 요소들에 이벤트 리스너 추가
    $('#userTableBody').on('click', '.approveBtn', approveUser);
    $('#userTableBody').on('click', '.detailBtn', function() {
        const userIdx = $(this).data('u-idx'); // 버튼의 data-u-idx 속성에서 userIdx 추출
        detailUser(userIdx); // 추출한 userIdx를 함수에 전달
    });
 // 수정 버튼 클릭 시 userIdx 확인 후 modifyUser 함수 실행
$('#userTableBody').on('click', '.modifyBtn', function() {
    editingUserId = $(this).data('u-idx'); // data 속성에서 userIdx 가져오기
    console.log('수정 버튼 클릭됨. userIdx:', editingUserId); // userIdx 확인을 위한 콘솔 출력
    
    modifyUser(); // userIdx를 전역 변수로 활용
});
    $('#userTableBody').on('click', '.deleteBtn', deleteUser);
}

// 페이지네이션 렌더링 함수
// function renderPagination() {
//     const pagination = $('#pagination').empty();

//     // << 버튼 (첫 페이지로 이동)
//     const first = $('<li class="page-item"><a class="page-link" href="#"><<</a></li>');
//     first.on('click', function (event) {
//         event.preventDefault();
//         currentPage = 1;
//         renderPagination();
//         fetchBoardData(1);
//     });
//     pagination.append(first);

//     // < 버튼 (이전 그룹 이동)
//     const prevGroup = $('<li class="page-item"><a class="page-link" href="#"><</a></li>');
//     prevGroup.on('click', function (event) {
//         event.preventDefault();
//         const prevStartPage = Math.max(1, startPage - maxPagesToShow);
//         currentPage = prevStartPage;
//         renderPagination();
//         fetchBoardData(currentPage);
//     });
//     pagination.append(prevGroup);

//     // 페이지 번호 렌더링
//     const maxPagesToShow = 5;
//     let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
//     let endPage = Math.min(totalPage, startPage + maxPagesToShow - 1);
//     if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
//         startPage = Math.max(1, endPage - maxPagesToShow + 1);
//     }

//     for (let i = startPage; i <= endPage; i++) {
//         const pageItem = $(`<li class="page-item${i === currentPage ? ' active' : ''}"><a class="page-link" href="#">${i}</a></li>`);
//         pageItem.on('click', function (event) {
//             event.preventDefault();
//             currentPage = i;
//             renderPagination();
//             fetchBoardData(i);
//         });
//         pagination.append(pageItem);
//     }

//     // > 버튼 (다음 그룹 이동)
//     const nextGroup = $('<li class="page-item"><a class="page-link" href="#">></a></li>');
//     nextGroup.on('click', function (event) {
//         event.preventDefault();
//         const nextStartPage = Math.min(totalPage, startPage + maxPagesToShow);
//         currentPage = nextStartPage;
//         renderPagination();
//         fetchBoardData(currentPage);
//     });
//     pagination.append(nextGroup);

//     // >> 버튼 (마지막 페이지로 이동)
//     const last = $('<li class="page-item"><a class="page-link" href="#">>></a></li>');
//     last.on('click', function (event) {
//         event.preventDefault();
//         currentPage = totalPage;
//         renderPagination();
//         fetchBoardData(totalPage);
//     });
//     pagination.append(last);
// }

function renderPagination() {

    // 페이지네이션 ui가 들어갈 요소 선택
    const pagination = $('#pagination').empty();

    // << 버튼 (첫 페이지로 이동)
    const first = $('<li class="page-item"><a class="page-link" href="#"><<</a></li>');
    first.on('click', function (event) {
        event.preventDefault();
        fetchUserData(1);
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
            fetchUserData(i);
        });
        pagination.append(pageItem);
    }

    // >> 버튼 (마지막 페이지로 이동)
    const last = $('<li class="page-item"><a class="page-link" href="#">>></a></li>');
    last.on('click', function (event) {
        event.preventDefault();
        fetchUserData(totalPage);
    });
    pagination.append(last);
}

// 유저 승인 요청 함수
function approveUser() {
    const userIdx = $(this).data('u-idx');
    const userId = $(this).data('u-id');

    const formData = new FormData();

    formData.append('user_idx', userIdx);
    formData.append('user_id', userId);

    $.ajax({
        url : defaultUrl + '/with/user_approve',
        method : 'POST',
        headers : {
            'Authorization' : `Bearer ${atoken}`
        },
        contentType: false,
        processData: false,
        data : formData,
        success : function(response) {
            alert('승인되었습니다.');
            fetchUserData(currentPage);
        }
    })
}

// 사용자 정보 보기 팝업 열기 함수
function detailUser(userIdx) {

    // 서버에서 조회해온 데이터 가져오기
    $.ajax({
        url : defaultUrl + `/with/user_detail/${userIdx}`,
        method : 'GET',
        headers : {
            'Authorization' : `Bearer ${atoken}`
        },
        success : function(response) {
            console.log('사용자 상세 조회 :' , response.data[0]);

            // 가져온 데이터 user에 집어넣고 그걸로 화면 렌더링하기
            const userDetail = response.data[0];
            renderUserDetail(userDetail); // 배열의 첫 번째 요소 전달
        }
    });
    // 팝업 표시
    $('#userDetail').css('display', 'flex');

    // goToChange 버튼에 userIdx를 동적으로 data 속성으로 추가
    $('.goToChange').data('u-idx', userIdx);
}

function renderUserDetail(user) {
    // 사용자 이름 업데이트
    $('.u_name').text(user.user_name);

    // 사용자 정보 업데이트
    $('#userName').text(user.user_name || '없음');
    $('#userId').text(user.user_id || '없음');
    $('#userPhone').text(user.phone_number || '없음');
    $('#companyName').text(user.c_name || '없음');
    $('#userRank').text(user.user_rank || '없음');
    $('#userPosition').text(user.user_position || '없음');
}

function modifyUser(userIdx = null) {
    // userIdx가 전달되지 않은 경우 전역 변수 editingUserId에서 가져오기
    if (userIdx) {
        editingUserId = userIdx;
    } else if (editingUserId) {
        userIdx = editingUserId;
    } else {
        console.error('수정할 사용자 ID가 설정되지 않았습니다.');
        return;
    }


     // 팝업 열 때 비밀번호 입력창 초기화
     $('#newUserPassword').hide();  // 비밀번호 입력창 숨기기
     $('.pwChangeWrap').show();     // 비밀번호 변경 버튼 표시
     
    
    // 서버에서 조회해온 데이터 가져오기
    $.ajax({
        url : defaultUrl + `/with/user_detail/${userIdx}`,
        method : 'GET',
        headers : {
            'Authorization' : `Bearer ${atoken}`
        },
        success : function(response) {
            console.log('사용자 상세 조회 :' , response.data[0]);
            
            // 가져온 데이터 user에 집어넣고 그걸로 화면 렌더링하기
            const userDetail = response.data[0];
            originPw = userDetail.user_pw; // 전역 변수에 저장

            console.log('원래 비번', originPw);

            $('#modifyUserId').val(userDetail.user_id);
            $('#modifyUserName').val(userDetail.user_name);
            $('#modifyUserPhone').val(userDetail.phone_number);
            $('#modifyRank').val(userDetail.user_rank);
            $('#modifyPosition').val(userDetail.user_position);
    
            // 승인/미승인 상태 선택
            $(`input[name="modifyStatus"][value="${userDetail.status}"]`).prop('checked', true);
    
            // 회사 리스트 로드 (수정 팝업)
            // 선택된 회사의 c_name을 loadCompanyList에 전달
            loadCompanyList('modifyCompanySelect', userDetail.c_name);
            
            // 팝업 표시
             $('#modifyPopupLayer').css('display', 'flex');
    
    
        },
        error: function(error) {
            console.error('사용자 조회 오류:', error);
            alert('사용자 정보를 불러오는데 실패했습니다.');
        }
    });
    // const user = users.find(u => u.user_idx == userIdx); // user 배열에서 user_idx에 해당하는 사용자 찾음
}

// 사용자 수정 요청 함수
function updateUserData() {
    const userIdx = editingUserId;
 
    if (!userIdx) {
        console.error('User ID not found.');
        return;
    }

    // 값 가져오기
    const com_idx = $('#modifyCompanySelect').val(); // 수정 팝업에서 선택된 회사 com_idx 가져오기
    const userName = $('#modifyUserName').val().trim();
    const userId = $('#modifyUserId').val().trim();
    const newPassword = $('#newUserPassword').val().trim();
    const userPhone = $('#modifyUserPhone').val().trim();
    const rank = $('#modifyRank').val().trim();
    const position = $('#modifyPosition').val().trim();
    const status = $('input[name="modifyStatus"]:checked').val();
    // const user_idx = userIdx; 

    // 새로운 비밀번호가 있으면 그것을 사용, 없으면 기존 비밀번호 사용
    const userPassword = newPassword ? newPassword : originPw;

    //옵션 데이터를 객체로 생성
    const option_obj = {
        "phone_number": userPhone,
        "user_rank": rank,
        "user_position": position
    };

   // FormData 객체 생성 (서버로 전송할 데이터)
    const formData = new FormData();

    formData.append('user_idx', userIdx);
    formData.append('user_pw', userPassword);
    formData.append('user_name', userName);
    formData.append('status', status);
    formData.append('com_idx', com_idx); // 선택한 회사의 com_idx 추가
    // 객체를 JSON 문자열로 변환하여 추가
    formData.append('option', JSON.stringify(option_obj));


    // FormData 내용 콘솔에 출력
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }
    
    // 서버에 수정된 사용자 데이터 전송
    $.ajax({
        url : defaultUrl + '/with/user_edit',
        method : 'POST',
        headers : {
             'Authorization': `Bearer ${atoken}`,
        },
        processData: false, // FormData 사용 시 필요
        contentType: false, // FormData 사용 시 필요
        data: formData,
        success : function(response) {
            alert('사용자 정보가 수정되었습니다.');
            location.reload(); // 페이지 새로 고침
        },
        error : function(e) {
            console.log('error :: ');
        }
    })
}

// 개별 삭제 함수
function deleteUser() {
    const user_idx = $(this).data('u-idx');
    const user_id = $(this).data('u-id');

    deleteUsers([{ user_idx: user_idx, user_id: user_id }]);
}

// 삭제 요청 함수
function deleteUsers(users) {
    console.log('전송될 데이터:', JSON.stringify(users));

    $.ajax({
        url : defaultUrl + '/with/user_del',
        method: 'DELETE',
        headers : {
            'Authorization': `Bearer ${atoken}`,
            'Content-Type': 'application/json'
        },
        data : JSON.stringify(users),
        success : function(response) {
            console.log('회사 삭제 응답', response.data);
            alert('삭제되었습니다.');
            fetchUserData(currentPage);
        },
        error : function(e) {
            console.log(e);
            console.log("errpr :: delete error");
        }
    })
}

// 사용자 등록 요청 함수
function addUserData() {
    const userName = $('#addUserName').val().trim();
    const userId = $('#addUserId').val().trim();
    const userPassword = $('#addUserPassword').val().trim();
    const userPhone = $('#addUserPhone').val().trim();
    const position = $('#addPosition').val().trim();
    const rank = $('#addRank').val().trim();
    const statusYes = $('input[name="addStatus"]:checked').val();
    const com_idx = $('#addCompanySelect').val(); // 선택된 회사 com_idx 가져오기

  
    // FormData 객체 생성
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('user_pw', userPassword);
    formData.append('user_name', userName);
    formData.append('status', statusYes);
    formData.append('com_idx', com_idx);
    // formData.append('phone_number', userPhone);
    // formData.append('user_rank', rank);
    // formData.append('user_position', position);

    const option_obj  = {
        "phone_number" : userPhone,
        "user_rank" : rank,
        "user_position" : position
    }
    
    // 객체를 JSON 문자열로 변환하여 추가
    formData.append('option', JSON.stringify(option_obj));

    // FormData 내용 로그 출력
    formData.forEach((value, key) => {
        console.log(`${key}: ${value}`);
    });

    // 서버에 POST 요청
    $.ajax({
        url: 'http://safe.withfirst.com:28888/with/user_add',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${atoken}`
        },
        processData: false, // FormData 사용 시 false로 설정
        contentType: false, // FormData 사용 시 false로 설정
        data: formData,
        success: function(response) {
            console.log(response);
            alert('추가되었습니다.');
            clearFormFields();
            location.reload(); // 페이지 새로 고침
        },
        error: function(error) {
            console.error('사용자 등록 오류:', error.responseJSON ? error.responseJSON : error);
            alert('사용자 등록에 실패했습니다.');
        }
    });
}

// 등록/수정 팝업에서 회사 리스트 목록 요청 함수
function loadCompanyList(selectElementId, selectedCompanyName  = null) {

    $.ajax({
        url: defaultUrl + '/with/sub_com_list',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${atoken}`
        },
        success: function(response) {
            console.log('회사 목록 데이터:', response);

            let companies = [];

            // 응답 데이터가 배열인지 확인
            if (Array.isArray(response.data)) {
                companies = response.data; // 배열일 경우
            } else if (response.data) {
                companies = [response.data]; // 단일 객체일 경우 배열로 변환
            }

            // 해당 id를 가진 select 요소 선택
            // 인자로 받은 '#addCompanySelect' 또는 '#modifyCompanySelect'
            const selectElement = $(`#${selectElementId}`);
            selectElement.empty();
            
            // 선택된 회사가 없을 때 , 기본 메시지 초기화
            if (selectedCompanyName === null) {
                selectElement.html('<option value="" disabled selected hidden>회사를 선택해주세요.</option>'); 
            }

            // SELECT 요소에 옵션으로 추가
            companies.forEach(company => {
                const option = $('<option>')
                .val(company.com_idx) // 옵션값으로 회사 IDX 설정
                .text(company.c_name); // 옵션에 표시할 텍스트로 회사 이름 설정
                
              // c_name이 선택된 회사와 일치하면 기본 선택
              if (selectedCompanyName && company.c_name === selectedCompanyName) {
                option.prop('selected', true);
                }
                
                selectElement.append(option); // select 요소에 option 추가
            });

            if (!selectedCompanyName && selectElement.val() === "") {
                selectElement.val("");
            }
        },
        error: function(e) {
            console.log(e);
            console.log('회사 목록 로딩 오류:', e);
        }
    });

}

// 폼 필드 초기화 함수
function clearFormFields() {
    $('#addUserName').val('');
    $('#addUserPassword').val('');
    $('#addUserId').val('');
    $('#addUserPhone').val('');
    $('#addPosition').val('');
    $('#addRank').val('');
    $('#addCompanySelect').val(''); // 회사 선택 초기화
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
    fetchUserData(1);
}

$(function() {
    
     // localStorage에서 현재 페이지 번호 가져오기
     const savedPage = localStorage.getItem('currentPage');
     currentPage = savedPage ? parseInt(savedPage, 10) : 1;
 
     // 페이지 데이터 로드
     fetchUserData(currentPage);

     // 수정 및 추가 팝업에서 저장 버튼 클릭 시, 사용자 수정 또는 추가 함수 실행
     $('#modifySaveBtn, #addSaveBtn').on('click', function() {
        if (this.id === 'modifySaveBtn') {
            updateUserData();
        } else if (this.id === 'addSaveBtn') {
            addUserData();
        }
    });

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
        fetchUserData(1);
    });

    // 사용자 추가 버튼 클릭 시 팝업 열고, 회사 리스트 로드 및 폼 초기화
    $('#addUserBtn').on('click', function() {
        clearFormFields();
        loadCompanyList('addCompanySelect'); // 회사 리스트 로드
        $('#addPopupLayer').css('display', 'flex');
    });

    // 팝업 내 닫기 버튼 클릭 시 팝업 닫기
    $('.popup .close').on('click', function() {
        $(this).closest('.popup').css('display', 'none');
    });

    // 팝업 내 취소 버튼 클릭 시 팝업 닫기
    $('.cancleBtn').on('click', function() {
        $(this).closest('.popup').css('display', 'none');
    });
    
    // 체크박스 전체 선택
    $('thead input[type="checkbox"]').on('change', function() {
        const isChecked = $(this).is(':checked');
        $('tbody input[type="checkbox"]').prop('checked', isChecked);
    });
    
    // 체크박스 사용한 다중 삭제 기능
    $('#deleteBtn').on('click', function() {
        const selectedUsers = $('tbody input[type="checkbox"]:checked').map(function() {
            return {
                user_idx: $(this).data('u-idx'),
                user_id: $(this).data('u-id')
            };
        }).get(); // 배열로 변환
        
        if (selectedUsers.length > 0) {
            deleteUsers(selectedUsers);
        } else {
            alert('삭제할 사용자를 선택해주세요.');
        }
    });

   // 비밀번호 변경 버튼 클릭 시 이벤트 처리
   $(document).on('click', '.pwChangeBtn', function() {

    console.log('비밀번호 변경 버튼 클릭됨');

        // 비밀번호 입력창 표시
        $('#newUserPassword').css('display', 'block'); // display 속성 강제 적용
        // 비밀번호 변경 버튼이 있는 div (pwChangeWrap) 숨기기
        $(this).closest('.pwChangeWrap').css('display', 'none');

    });

    $(document).on('click', '.goToChange', function() {

        $('#userDetail').css('display', 'none');

            // 사용자 ID나 기타 필요한 정보를 가져오기 위해 data-* 속성 활용
            const userIdx = $(this).data('u-idx'); // 필요한 경우 사용자의 고유 ID를 가져옴
            
            if (userIdx) {
                modifyUser.call(this, userIdx); // 수정 함수에 userIdx 전달
            } else {
                console.error('userIdx 값이 설정되지 않았습니다.');
            }
    });

    $('.c_select_btn').on('click', function () {
        const $list = $(this).siblings('.c_list');
        const $img = $(this).find('img');
    
        $list.slideToggle(300, function () {
            // 애니메이션 완료 후 상태 체크
            if ($list.is(':visible')) {
                $img.attr('src', '/images/dropup.png'); // 리스트가 보이는 경우
            } else {
                $img.attr('src', '/images/dropdown.png'); // 리스트가 숨겨진 경우
            }
        });
    });
});

