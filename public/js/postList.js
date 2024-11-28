let posts = [];
let options = [];


let currentPage = 1;
let itemsPerPage = 10;
let totalPage = 1;
let optionType = "all";
let optionValue = "";
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

            posts = response.data; // 게시글 배열에 데이터 저장

            // options 배열 초기화 후 각 게시글의 post_opt 값 추가
            options = response.data.map( post => post.post_opt);

            console.log('옵션담겼을까요?', options);
            
            totalPage = response.totalPage || 1;
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

    const tableContainer = $('#postTableContainer');
    const noPostsMessageContainer = $('#noPostsMessage');

    $('.contentWrap p').text(`모든 게시글(${total_count})`);

    let tableHtml = `
        <thead>
            <tr>
                <th>
                    <div class="d-flex align-items-center justify-content-center">
                        <input type="checkbox" id="selectAllCheckbox">
                    </div>
                </th>
                <th style="text-align: left;">No</th>
    `;

    // Set을 사용해 중복 없는 헤더 생성, view_sts가 "2"가 아닌 항목들만 추가
    const uniqueHeaders = new Set();

    posts.forEach(post => {
        const { post_opt } = post;

        post_opt.opt_text?.forEach(textOpt => {
            if (textOpt.view_sts !== "2") uniqueHeaders.add(textOpt.ol_name);
        });

        post_opt.opt_sel?.forEach(selOpt => {
            if (selOpt.view_sts !== "2") uniqueHeaders.add(selOpt.ol_name);
        });

        post_opt.post_files?.forEach(fileOpt => {
            if (fileOpt.view_sts !== "2") uniqueHeaders.add(fileOpt.ol_name);
        });
    });

    // 고유한 헤더를 테이블 헤더에 추가
    uniqueHeaders.forEach(header => {
        tableHtml += `<th>${header}</th>`;
    });

    // 고정된 헤더 추가
    tableHtml += `
        <th>작성자</th><th>작성일</th><th>조회</th><th>좋아요</th>
        </tr></thead><tbody>
    `;

    if (posts.length === 0) {
        noPostsMessageContainer.html(`
            <div class="no-posts-message" style="text-align: center; padding: 50px;">
                작성된 게시글이 없습니다.
            </div>
        `);
    } else {
        noPostsMessageContainer.empty();

        // 각 게시글 데이터에 맞게 테이블 행 생성
        posts.forEach(post => {
            tableHtml += `
            <tr class="post_row" data-post-id="${post.post_idx}">
                <td>
                    <div class="d-flex align-items-center justify-content-center">
                        <input type="checkbox" class="postCheckbox" data-post-idx="${post.post_idx}" data-user-idx="${post.user_idx}">
                    </div>
                </td>
                <td style="text-align: left;">${post.post_idx}</td>
            `;

            // 각 uniqueHeaders를 순회하며 행 데이터 추가, 데이터가 없으면 "null" 표시
            uniqueHeaders.forEach(header => {
                let cellContent = 'null'; // 기본값 설정

                // opt_text에서 일치하는 ol_name이 있는지 찾기
                const textOpt = post.post_opt.opt_text?.find(opt => opt.ol_name === header);
                if (textOpt) {
                    if (textOpt.ol_type === 'editor') {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = textOpt.select_text;
                        const textContent = tempDiv.textContent.trim().slice(0, 50) + (tempDiv.textContent.length > 50 ? '...' : '');
                        const image = tempDiv.querySelector('img');
                        const imageContent = image ? `<img src="${image.src}" alt="썸네일" class="editor_thumbnail">` : '';
                        cellContent = `${imageContent} <span class="editor-text">${textContent}</span>`;
                    } else {
                        cellContent = textOpt.select_text;
                    }
                }

                // opt_sel에서 일치하는 ol_name이 있는지 찾기
                const selOpt = post.post_opt.opt_sel?.find(opt => opt.ol_name === header);
                if (selOpt) {
                    cellContent = selOpt.select_opt_value;
                }

                // post_files에서 일치하는 ol_name이 있는지 찾기
                const fileOpt = post.post_opt.post_files?.find(opt => opt.ol_name === header);
                if (fileOpt) {
                    cellContent = `${fileOpt.o_f_name}`;
                }

                tableHtml += `<td class="file-name-cell" title="${cellContent}">${cellContent}</td>`;
            });

            // 고정 정보 추가
            tableHtml += `
                <td>${post.user_name}</td>
                <td>${post.update_date}</td>
                <td>${post.p_view}</td>
                <td>${post.like_count}</td>
                <td class="buttons center-align buttons_width">
                <button class="modifyBtn" id="postModify" data-post-idx="${post.post_idx}">수정</button>
                <button class="deleteBtn" data-post-idx="${post.post_idx}" data-user-idx="${post.user_idx}">삭제</button>
                <button class="moveBtn moveListPage" data-post-idx="${post.post_idx}">이동</button>
                </td>
            </tr>`;
        });
    }

    tableHtml += `</tbody>`;
    tableContainer.html(tableHtml);

    // 각 행에 클릭 이벤트 추가
    $('.moveListPage').on('click', function() {
        const postId = $(this).data('post-idx');
        window.location.href=`newPost.html?id=${postId}`;
    });
    
    // 체크 박스 상태 초기화
    $('thead input[type="checkbox"]').prop('checked', false);


    // 수정 버튼 클릭 시 이벤트 전파 중지 후 수정 페이지로 이동
    $('#postTableContainer').on('click', '.modifyBtn', function(event) {
        const postId = $(this).data('post-idx');
        window.location.href = `postUpdate.html?id=${postId}`; // 수정 페이지로 이동
    });

     // 삭제 버튼 클릭 시 이벤트 전파 중지 후 삭제 함수 실행
     $('#postTableContainer').on('click', '.deleteBtn', function(event) {
        event.stopPropagation(); // 이벤트 전파 중지
        deletePost.call(this); // 삭제 함수 호출
    });

    $(document).on('mouseenter', '.editor_thumbnail', function(e) {
        const originalSrc = $(this).attr('src');
        
        // 확대 이미지 생성
        const $zoomedImage = $('<div class="zoomed-image"></div>').css({
            'background-image': `url(${originalSrc})`,
            'position': 'absolute',
            'top': e.pageY - 100 + 'px', // 마우스 위치 기준으로 조정
            'left': e.pageX + 20 + 'px',
            'width': '400px', // 확대 이미지 크기
            'height': '400px',
            'background-size': 'cover',
            'background-position': 'center', // 이미지 중앙 정렬
            'background-repeat': 'no-repeat',
            'border': '1px solid #ddd',
            'box-shadow': '0px 4px 8px rgba(0, 0, 0, 0.3)',
            'z-index': 1000
        });
    
        $('body').append($zoomedImage);
    
        // 마우스 이동 시 확대 이미지 위치 업데이트
        $(this).on('mousemove', function(e) {
            $zoomedImage.css({
                'top': e.pageY - 100 + 'px',
                'left': e.pageX + 20 + 'px'
            });
        });
    });
    
    $(document).on('mouseleave', '.editor_thumbnail', function() {
        $('.zoomed-image').remove(); // 확대 이미지 제거
    });

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

// 게시글 개별 삭제 함수
function deletePost() {
    const post_idx = $(this).data('post-idx');
    const user_idx = $(this).data('user-idx');
    deletePosts([ { post_idx : post_idx, user_idx: user_idx } ]);
}

// 게시글 개별 및 다중 삭제 요청 함수
function deletePosts(posts) {

    $.ajax({
        url: defaultUrl + '/with/post_del',
        method : 'DELETE',
        headers : {
            'Authorization': `Bearer ${atoken}`,
            'Content-Type': 'application/json'
        },
        data : JSON.stringify(posts),
        success : function(response) {
            console.log('게시글 삭제 응답', response.data);
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


  // 전체 체크박스 선택을 이벤트 위임 방식으로 상위 요소에 연결
    $('#postTableContainer').on('change', '#selectAllCheckbox', function() {
        const isChecked = $(this).is(':checked');
        $('.postCheckbox').prop('checked', isChecked);
        console.log('Select All:', isChecked); // 이벤트 확인용 로그
    });

    
    // 체크박스 사용한 다중 삭제 기능
    $('#deleteBtn').on('click', function() {
        const selectedPosts = $('tbody input[type="checkbox"]:checked').map(function() {
            return {
                post_idx: $(this).data('post-idx'),  // 수정된 부분
                user_idx: $(this).data('user-idx')   // 수정된 부분
            };
        }).get(); // 배열로 변환
        
        if (selectedPosts.length > 0) {
            deletePosts(selectedPosts);
        } else {
            Swal.fire({
                // title: '경고',
                text: '삭제할 사용자를 선택해 주세요.',
                icon: 'warning',
                confirmButtonText: '확인'
            });
        }
    });


    // 글쓰기 버튼 클릭 시 이동
    $('.writeBtn').on('click', function() {
        window.location.href = 'write.html';
    });
    

});



// document.addEventListener('DOMContentLoaded', () => {
    

    // 전체 선택 기능
    // document.querySelector('thead input[type="checkbox"]').addEventListener('change', function () {
    //     const isChecked = this.checked;
    //     const checkboxes = document.querySelectorAll('tbody input[type="checkbox"');
    //     checkboxes.forEach(checkbox => {
    //         checkbox.checked = isChecked;
    //     });
    // });

    // 다중 삭제
//     document.getElementById('deleteBtn').addEventListener('click', () => {
//         const selectedPosts = Array.from(document.querySelectorAll('tbody input[type="checkbox"]:checked'))
//             .map(checkbox => ({
//                 post_idx: checkbox.getAttribute('data-post-idx'),
//                 user_idx: checkbox.getAttribute('data-user-id')
//             }));

//         console.log('selectedPosts :: :', selectedPosts);
//         if (selectedPosts.length > 0) {
//             deleteposts(selectedPosts);            
//         } else {
//             showPopup(2, "게시판 선택", "삭제할 게시판을 선택해주세요.")            
//         }
//     });

//     // localStorage에서 현재 페이지 번호 가져오기
//     const savedPage = localStorage.getItem('currentPage');
//     if (savedPage) {
//         currentPage = parseInt(savedPage, 10);
//         localStorage.removeItem('currentPage'); // 저장된 페이지 번호 삭제
//     } else {
//         currentPage = 1; // 기본 페이지를 1로 설정
//     }

//     // 검색 버튼 클릭 시와 검색 필드에서 엔터 키 입력 시
//     document.getElementById('searchButton').addEventListener('click', () => {
//         executeSearch();
//     });

//     document.getElementById('searchInput').addEventListener('keydown', (event) => {
//         if (event.key === 'Enter') {
//             event.preventDefault();
//             executeSearch();
//         }
//     });

//     function executeSearch() {
//         const searchSelect = document.getElementById('searchSelect');
//         const searchInput = document.getElementById('searchInput');        
                
//         if (searchSelect) {
//             console.log("test:1",searchSelect.value);
            
//             optionType = searchSelect.value.trim();
//         }
//         if (searchInput) {
//             optionValue = searchInput.value.trim();
//         }
//         // 검색 조건이 바뀔 때 마다 페이지를 1로 설정하고 데이터 로드하기
//         loadPostData(1);
//     }

//     // 페이지 당 항목 수를 변경
//     document.getElementById('itemCountSelect').addEventListener('change', (event) => {
//         itemsPerPage = parseInt(event.target.value, 10);
//         loadBoardData(1);
//     });

//     // 글쓰기 이동처리
//     document.querySelector('.writeBtn').addEventListener('click', (event) => {
//         event.preventDefault();
        
//         const board_idx = localStorage.getItem('board_idx');
//         if(board_idx) {
//             $.ajax({
//                 url: `${defaultUrl}/with/temp_clear`,
//                 headers: {
//                     'Authorization': `Bearer ${atoken}`
//                 },
//                 method : 'GET',                                                
//                 contentType: false,
//                 processData: false,                                        
//                 success: function(res) {
//                     console.log("서버로그:", res);                                
//                     document.location.href=`write.html?idx=${board_idx}&mode=create`;          
//                 },
//                 error: function(xhr, status, error) {                                        
//                     document.location.href=`write.html?idx=${board_idx}&mode=create`;                              
//                 }
//             });                                    
//         } else {
//             console.log("ID가 localstorage에 없습니다.");            
//             showPopup(2, '페이지 전환', "페이지 전환에 실패 하였습니다.")
//         }
//     });    
//     loadPostData(currentPage);      
// })



// function loadPostData(page = 1) {
//     currentPage = page;
//     const token = localStorage.getItem('accessToken');    
//     const url = `${defaultUrl}/with/postList/${boardId}?option_type=${optionType}&option_value=${optionValue}&per_page=${itemsPerPage}&page=${currentPage}`;
//     axios.get(url, {
//         headers: {
//             'Authorization': `Bearer ${token}`
//         }
//     })
//         .then(response => {
//             console.log('성공');
//             const data = response.data.data;
//             console.log('데이터값 확인 :', data);

//             posts = data;
//             console.log(posts);
//             console.log(response.data);

//             totalPage = response.data.total_pages || 1;
//             totalCount = `모든 게시글(${response.data.total_count || 0})`
            
//             let board_title = document.querySelector(".contentTitle")                    
//             boardName.length > 0 ? board_title.innerHTML = boardName : "게시판"   

//             console.log(totalPage);
//             console.log("count:", totalCount);                        
//             renderTable();            
//             document.querySelector('thead input[type="checkbox"]').checked = false;
//             document.getElementById('post_counting').innerHTML = totalCount;
//         })
//         .catch(error => {
//             // console.error('Error loading post data:', error.response ? error.response.data : error.message);
//             console.error('Error loading post data:', error);
//         });
// }


// // 테이블 랜더링
// function renderTable() {
//     const tableBody = document.getElementById('postTableBody');
//     tableBody.innerHTML = ''; // 테이블 본문 초기화

//     // 전체 데이터에서 현재 페이지의 시작 인덱스 계산
//     const startIndex = (currentPage - 1) * itemsPerPage;

//     posts.forEach((post, index) => {
//         console.log("테이블 렌더링post :", post);

//         const row = document.createElement('tr');        
//         row.innerHTML = `                             
//             <td>
//                 <div class="d-flex align-items-center justify-content-center">
//                     <input type="checkbox" data-post-idx="${post['post_idx']}" data-user-id="${post["user_idx"]}">
//                 </div>
//             </td>
//             <td>${startIndex + index + 1}</td>
//             <td style="text-align: left;"><a href="post.html?id=${post['post_idx']}">
//                 ${post['p_title']}
//             </a>
//             <!-- 게시글에 그림이 있으면 나타나는 아이콘 -->
//             <span class="pic">
//                 ${post.thumbnail.length ? `<img src="/images/pic.png" />` : ''}                
//             </span>
//             <!-- 게시글에 댓글이 있으면 나타나는 댓글 개수 -->
//             <span class="cmt_bold">
//                 <a link>${post['comment_count'] > 0 ? `[${post['comment_count']}]` : ''}</a>
//             </span>
//             </td>
//             <td>${post['user_name']}</td>
//             <td>
//             <!--오늘 날짜는 시 분으로 표현 , 전날 날짜는 년월일로 표현 -->
//                 ${post['created_date'] ? 
//                     (() => {
//                     const createdDate = new Date(post["created_date"]);
//                     const today = new Date();
//                     today.setHours(0, 0, 0, 0);
                    
//                     if (createdDate >= today) {
//                         // 오늘 날짜인 경우 HH:mm 형식으로 표시
//                         return createdDate.toLocaleTimeString('ko-KR', { 
//                         hour: '2-digit', 
//                         minute: '2-digit',                         
//                         hour12: false 
//                         });
//                     } else {
//                         // 이전 날짜인 경우 년-월-일 표시
//                         return createdDate.toLocaleDateString('ko-KR', { 
//                         year: 'numeric', 
//                         month: '2-digit', 
//                         day: '2-digit' 
//                         });
//                     }
//                     })() 
//                     : ''
//                 }
//             </td>
//             <td>${post['p_view']}</td>
//             <td>${post['like_count']}</td>
//             <td class="buttons center-align">
//                 <button class="moveBtn" data-post-idx="${post["post_idx"]}">이동</button>
//                 <button class="modifyBtn" id="postModify" data-id="${post['post_idx']}">수정</button>
//                 <button class="deleteBtn" data-post-idx="${post["post_idx"]}" data-user-id="${post["user_idx"]}">삭제</button>
//             </td>        
//         `;        
//         tableBody.appendChild(row);        
//         console.log(tableBody);                            
//     });


//     // 게시글 이동 이벤트
//     document.querySelectorAll('.moveBtn').forEach(button => {
//         button.addEventListener('click', function () {
//             const postId = this.getAttribute('data-post-idx');
//             const post = posts.find(v => v["post_idx"] == postId)
//             console.log(postId);
//             console.log(post);
//             window.location.href = `/post.html?id=${postId}`;
//         });
//     });


//     // 게시글 수정 페이지로 이동
//     document.querySelectorAll('.modifyBtn').forEach(button => {
//         button.addEventListener('click', function () {
//             const postId = this.getAttribute('data-id'); // 클릭 시 해당 게시글 idx 저장            
//             const post = posts.find(v => v["post_idx"] == postId); // 해당 idx 일치하는 게시글 객체 저장
//             console.log("수정 post", post);
//             window.location.href = `/write.html?id=${postId}&mode=edit`;            
//         });
//     });
    
//     // 동적으로 생성된 개별 삭제
//     console.log(1);
//     document.querySelectorAll('.deleteBtn').forEach(button => {
//         button.addEventListener('click', function () {
//             const post_idx = this.getAttribute('data-post-idx');
//             const user_idx = this.getAttribute('data-user-id');
//             console.log("게시글 삭제 버튼 동작 이벤트 테스트", post_idx, user_idx);

//             deleteposts([{ post_idx: post_idx, user_idx: user_idx }]);
//         })
//     });
//     // 페이지 네이션
//     postPagination()
//     console.log("pagination--------------------------------");
// }

// function showPopup(seq, title, content, status, istype) {
//     const popup = new TimedPopup({

//         duration: seq * 1000,
//         title: title,
//         content: content,
//         backgroundColor: status,
//         type: istype,
//         onClose: () => console.log('팝업이 닫혔습니다.')
//     });
//     popup.show();
// }


// // 삭제 요청 함수
// function deleteposts(posts) {
//     const token = localStorage.getItem('accessToken');

//     console.log('전송될 데이터:', JSON.stringify(posts));
    
//     axios.delete(`${defaultUrl}/with/del_post`, {
//         data: posts,
//         headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//         }
//     })
//         .then(response => {
//             console.log('게시글 삭제 응답:', response.data);
//             showPopup(3, '게시글 삭제', "삭제 되었습니다.", 'suc')
//             localStorage.setItem('currentPage', currentPage);
//             //페이지 새로 고침
//             location.reload();
//         })
//         .catch(error => {
//             console.error('게시글 삭제 오류:', error.response ? error.response.data : error.message);
//             if (error.response && error.response.status === 401) {
//                 // 401에러 발생 시 로그아웃 함수 호출
//                 window.logout();
//             } else {
//                 showPopup(3, '게시글 삭제', "삭제에 실패 하였습니다.")
//             }
//         });
// }

// // 페이지네이션 렌더링
// function postPagination() {
//     const pagination = document.getElementById('pagination');
//     pagination.innerHTML = '';

//     // 첫 페이지로 이동 (<<)
//     const firstPage = document.createElement('li');
//     firstPage.className = 'page-item';
//     firstPage.innerHTML = `<a class="page-link" href="#"><<</a>`;
//     firstPage.onclick = (event) => {
//         event.preventDefault();
//         loadPostData(1);
//     };
//     pagination.appendChild(firstPage);

//     // 페이지 번호
//     const maxPagesToShow = 5; // 최대 페이지 버튼 수
//     let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
//     let endPage = Math.min(totalPage, startPage + maxPagesToShow - 1);

//     // 페이지 번호가 최소 범위를 초과하면 오른쪽으로 이동
//     if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
//         startPage = Math.max(1, endPage - maxPagesToShow + 1);
//     }

//     for (let i = startPage; i <= endPage; i++) {
//         const pageItem = document.createElement('li');
//         pageItem.className = 'page-item' + (i === currentPage ? ' active' : '');

//         const pageButton = document.createElement('a');
//         pageButton.className = 'page-link';
//         pageButton.href = '#';
//         pageButton.textContent = i;
//         pageButton.onclick = (event) => {
//             event.preventDefault();
//             loadPostData(i);
//         };


//         pageItem.appendChild(pageButton);
//         pagination.appendChild(pageItem);
//     }

//     // 마지막 페이지로 이동 (>>)
//     const lastPage = document.createElement('li');
//     lastPage.className = 'page-item';
//     lastPage.innerHTML = `<a class="page-link" href="#">>></a>`;
//     lastPage.onclick = (event) => {
//         event.preventDefault();
//         loadPostData(totalPage);
//     };
//     pagination.appendChild(lastPage);
// }