let posts = [];
let currentPage = 1;
let itemsPerPage = 10;
let totalPage = 1;
let optionType = "all";
let optionValue = "";
let board_name = "";
const bidx = localStorage.getItem('board_idx');
let options = [];

// url
const defaultUrl = "http://safe.withfirst.com:28888";

// 토큰
const rtoken = getCookieValue('refreshToken');
const atoken = localStorage.getItem('accessToken');

const urlParams = new URLSearchParams(window.location.search);
const boardId = urlParams.get('id');
const boardName = urlParams.get('name');


// 테이블 초기화
function initializeTable() {
    // 옵션 데이터로 테이블 헤더 렌더링
    fetchBoardOtionsData()
    .then( () => {
        // 헤더가 렌더링 된 후 게시글 리스트 데이터 로드
        fetchPostData(1);
    })
    .catch((error) => {
        console.log('테이블 렌더링 중 오류 발생', error);
    });
}

function fetchBoardOtionsData() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: defaultUrl + `/with/board_detail?bidx=${bidx}`, // URL 설정
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${atoken}`,
            },
            success: function(response) {
                console.log('옵션 데이터 조회 성공', response);
                const boardDeatail = response.data;
                tableHeadRender(boardDeatail);
                resolve(); // 성공 시 resolve 호출
            },
            error: function(e) {
                console.log('error :: 옵션 조회 에러', e);
                reject(e); // 실패 시 reject 호출
            }
        });
    })

}

// 게시글 리스트 로드 함수
function fetchPostData(page = 1 ) {

    currentPage = page;

    $.ajax({
        url : defaultUrl + `/with/post_list/${bidx}?option_type=${optionType}&option_value=${optionValue}&per_page=${itemsPerPage}&page=${currentPage}`,
        method : 'GET',
        headers : {
            'Authorization' : `Bearer ${atoken}`
        },
        success : function(response) {
            console.log('게시글 데이터를 조회하는데 성공하였습니다.');
            console.log('게시글 데이터 : ', response.data);

            // 로컬스토리지에 현재 페이지 저장
            localStorage.setItem('currentPage', currentPage);

            posts = response.data;
            totalPage = response.total_page || 1;
            total_count = response.total_count;

            renderlistTable();
            // renderAlbumTable();
            renderPagination();

        },
        error : function(e) {
            console.log(e);
            console.log(" error :: 사용자 접속 에러");
        }
    });


}

function renderlistTable() {

    $('.contentWrap p').text(`모든 게시글(${total_count})`);

    const tableBody = $('#postTableBody').empty(); // 게시글 테이블 본문을 초기화
    const noPostsMessageContainer = $('#noPostsMessage'); // '게시글이 없습니다' 메시지 컨테이너

    if(total_count == 0) {
        
        // 게시글이 없는 경우 테이블을 유지하고 메시지를 테이블 바깥에 표시
          noPostsMessageContainer.html(`
            <div class="no-posts-message" style="text-align: center; padding: 50px;">
                작성된 게시글이 없습니다.
            </div>
        `);
    } else {

         // 게시글이 있을 때 메시지 삭제
         noPostsMessageContainer.empty();

         // 게시글 목록 렌더링
         posts.forEach( function(post, index) {
            const row = $(`
                <tr>
                    <td>
                        <div class="d-flex align-items-center justify-content-center">
                            <input type="checkbox">
                        </div>
                    </td>
                    <td>1</td>
                    <td style="text-align: left;">
                        <span class="pic"><img src="/images/pic.png"></span>                            
                        <span class="cmt_bold">
                        <a link>[2]</a>
                        </span>
                    </td>
                    <td>송수련</td>
                    <td>18:06</td>
                    <td>105</td>
                    <td>3</td>
                    <td class="buttons center-align">
                        <button class="modifyBtn" id="boardModify">수정</button>
                        <button class="deleteBtn">삭제</button>
                    </td>
                </tr>
                `);
         });

         tableBody.append(row);

    }
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
    fetchUserData(1);
}



function tableHeadRender(boardDeatail) {

    options = boardDeatail.options;
    console.log('옵션 배열에 담겼나', options);

    
    // 테이블 헤더 동적으로 렌더링
    const tableHead = $('#postTableHead').empty(); // 게시글 테이블 헤더를 초기화

    // 기본 베이스 HTML
    let headerHtml = `
        <tr>
            <th>
                <div class="d-flex align-items-center justify-content-center">
                    <input type="checkbox">
                </div>
            </th>
            <th>No</th>
            <th>작성자</th>
            <th>작성일</th>
            <th>조회</th>
    `;

    // 옵션 배열에 있는 값들을 순회하면서 th 동적으로 추가
    if (options && options.length > 0 ) {
        options.forEach(option => {
            // view_sts가 1인 경우만 추가
            if(option.view_sts =="1") {
                headerHtml += `<th>${option.ol_name}</th>`;
            }
        });
    }

    // 근데 만약에 options에 view_sts가 "2" 이면 tr 숨겨야해

    // 테이블 헤더 닫기 태그 추가
    headerHtml += '</tr>';

    // 테이블 헤더에 HTML 삽입
    tableHead.html(headerHtml);
}


$(function() {

    initializeTable();

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

});



document.addEventListener('DOMContentLoaded', () => {
    

    // 전체 선택 기능
    // document.querySelector('thead input[type="checkbox"]').addEventListener('change', function () {
    //     const isChecked = this.checked;
    //     const checkboxes = document.querySelectorAll('tbody input[type="checkbox"');
    //     checkboxes.forEach(checkbox => {
    //         checkbox.checked = isChecked;
    //     });
    // });

    // 다중 삭제
    document.getElementById('deleteBtn').addEventListener('click', () => {
        const selectedPosts = Array.from(document.querySelectorAll('tbody input[type="checkbox"]:checked'))
            .map(checkbox => ({
                post_idx: checkbox.getAttribute('data-post-idx'),
                user_idx: checkbox.getAttribute('data-user-id')
            }));

        console.log('selectedPosts :: :', selectedPosts);
        if (selectedPosts.length > 0) {
            deleteposts(selectedPosts);            
        } else {
            showPopup(2, "게시판 선택", "삭제할 게시판을 선택해주세요.")            
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
            console.log("test:1",searchSelect.value);
            
            optionType = searchSelect.value.trim();
        }
        if (searchInput) {
            optionValue = searchInput.value.trim();
        }
        // 검색 조건이 바뀔 때 마다 페이지를 1로 설정하고 데이터 로드하기
        loadPostData(1);
    }

    // 페이지 당 항목 수를 변경
    document.getElementById('itemCountSelect').addEventListener('change', (event) => {
        itemsPerPage = parseInt(event.target.value, 10);
        loadBoardData(1);
    });

    // 글쓰기 이동처리
    document.querySelector('.writeBtn').addEventListener('click', (event) => {
        event.preventDefault();
        
        const board_idx = localStorage.getItem('board_idx');
        if(board_idx) {
            $.ajax({
                url: `${defaultUrl}/with/temp_clear`,
                headers: {
                    'Authorization': `Bearer ${atoken}`
                },
                method : 'GET',                                                
                contentType: false,
                processData: false,                                        
                success: function(res) {
                    console.log("서버로그:", res);                                
                    document.location.href=`write.html?idx=${board_idx}&mode=create`;
                },
                error: function(xhr, status, error) {
                    console.error('임시폴더 삭제 중 오류 발생:', error);
                    console.error('상태 코드:', xhr.status);  
                    showPopup(2, '페이지 전환', "페이지 전환에 실패 하였습니다.")              
                }
            });                        
        } else {
            console.log("ID가 localstorage에 없습니다.");            
            showPopup(2, '페이지 전환', "페이지 전환에 실패 하였습니다.")
        }
    });    
    loadPostData(currentPage);      
})



function loadPostData(page = 1) {
    currentPage = page;
    const token = localStorage.getItem('accessToken');    
    const url = `${defaultUrl}/with/postList/${boardId}?option_type=${optionType}&option_value=${optionValue}&per_page=${itemsPerPage}&page=${currentPage}`;
    axios.get(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            console.log('성공');
            const data = response.data.data;
            console.log('데이터값 확인 :', data);

            posts = data;
            console.log(posts);
            console.log(response.data);

            totalPage = response.data.total_pages || 1;
            totalCount = `모든 게시글(${response.data.total_count || 0})`
            
            let board_title = document.querySelector(".contentTitle")                    
            boardName.length > 0 ? board_title.innerHTML = boardName : "게시판"   

            console.log(totalPage);
            console.log("count:", totalCount);                        
            renderTable();            
            document.querySelector('thead input[type="checkbox"]').checked = false;
            document.getElementById('post_counting').innerHTML = totalCount;
        })
        .catch(error => {
            // console.error('Error loading post data:', error.response ? error.response.data : error.message);
            console.error('Error loading post data:', error);
        });
}





// 테이블 랜더링
function renderTable() {
    const tableBody = document.getElementById('postTableBody');
    tableBody.innerHTML = ''; // 테이블 본문 초기화

    // 전체 데이터에서 현재 페이지의 시작 인덱스 계산
    const startIndex = (currentPage - 1) * itemsPerPage;

    posts.forEach((post, index) => {
        console.log("테이블 렌더링post :", post);

        const row = document.createElement('tr');        
        row.innerHTML = `                             
            <td>
                <div class="d-flex align-items-center justify-content-center">
                    <input type="checkbox" data-post-idx="${post['post_idx']}" data-user-id="${post["user_idx"]}">
                </div>
            </td>
            <td>${startIndex + index + 1}</td>
            <td style="text-align: left;"><a href="post.html?id=${post['post_idx']}">
                ${post['p_title']}
            </a>
            <!-- 게시글에 그림이 있으면 나타나는 아이콘 -->
            <span class="pic">
                ${post.thumbnail.length ? `<img src="/images/pic.png" />` : ''}                
            </span>
            <!-- 게시글에 댓글이 있으면 나타나는 댓글 개수 -->
            <span class="cmt_bold">
                <a link>${post['comment_count'] > 0 ? `[${post['comment_count']}]` : ''}</a>
            </span>
            </td>
            <td>${post['user_name']}</td>
            <td>
            <!--오늘 날짜는 시 분으로 표현 , 전날 날짜는 년월일로 표현 -->
                ${post['created_date'] ? 
                    (() => {
                    const createdDate = new Date(post["created_date"]);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    if (createdDate >= today) {
                        // 오늘 날짜인 경우 HH:mm 형식으로 표시
                        return createdDate.toLocaleTimeString('ko-KR', { 
                        hour: '2-digit', 
                        minute: '2-digit',                         
                        hour12: false 
                        });
                    } else {
                        // 이전 날짜인 경우 년-월-일 표시
                        return createdDate.toLocaleDateString('ko-KR', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit' 
                        });
                    }
                    })() 
                    : ''
                }
            </td>
            <td>${post['p_view']}</td>
            <td>${post['like_count']}</td>
            <td class="buttons center-align">
                <button class="moveBtn" data-post-idx="${post["post_idx"]}">이동</button>
                <button class="modifyBtn" id="postModify" data-id="${post['post_idx']}">수정</button>
                <button class="deleteBtn" data-post-idx="${post["post_idx"]}" data-user-id="${post["user_idx"]}">삭제</button>
            </td>        
        `;        
        tableBody.appendChild(row);        
        console.log(tableBody);                            
    });


    // 게시글 이동 이벤트
    document.querySelectorAll('.moveBtn').forEach(button => {
        button.addEventListener('click', function () {
            const postId = this.getAttribute('data-post-idx');
            const post = posts.find(v => v["post_idx"] == postId)
            console.log(postId);
            console.log(post);
            window.location.href = `/post.html?id=${postId}`;
        });
    });


    // 게시글 수정 페이지로 이동
    document.querySelectorAll('.modifyBtn').forEach(button => {
        button.addEventListener('click', function () {
            const postId = this.getAttribute('data-id'); // 클릭 시 해당 게시글 idx 저장            
            const post = posts.find(v => v["post_idx"] == postId); // 해당 idx 일치하는 게시글 객체 저장
            console.log("수정 post", post);
            window.location.href = `/write.html?id=${postId}&mode=edit`;            
        });
    });
    
    // 동적으로 생성된 개별 삭제
    console.log(1);
    document.querySelectorAll('.deleteBtn').forEach(button => {
        button.addEventListener('click', function () {
            const post_idx = this.getAttribute('data-post-idx');
            const user_idx = this.getAttribute('data-user-id');
            console.log("게시글 삭제 버튼 동작 이벤트 테스트", post_idx, user_idx);

            deleteposts([{ post_idx: post_idx, user_idx: user_idx }]);
        })
    });
    // 페이지 네이션
    postPagination()
    console.log("pagination--------------------------------");
}

function showPopup(seq, title, content, status, istype) {
    const popup = new TimedPopup({

        duration: seq * 1000,
        title: title,
        content: content,
        backgroundColor: status,
        type: istype,
        onClose: () => console.log('팝업이 닫혔습니다.')
    });
    popup.show();
}


// 삭제 요청 함수
function deleteposts(posts) {
    const token = localStorage.getItem('accessToken');

    console.log('전송될 데이터:', JSON.stringify(posts));
    
    axios.delete(`${defaultUrl}/with/del_post`, {
        data: posts,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            console.log('게시글 삭제 응답:', response.data);
            showPopup(3, '게시글 삭제', "삭제 되었습니다.", 'suc')
            localStorage.setItem('currentPage', currentPage);
            //페이지 새로 고침
            location.reload();
        })
        .catch(error => {
            console.error('게시글 삭제 오류:', error.response ? error.response.data : error.message);
            if (error.response && error.response.status === 401) {
                // 401에러 발생 시 로그아웃 함수 호출
                window.logout();
            } else {
                showPopup(3, '게시글 삭제', "삭제에 실패 하였습니다.")
            }
        });
}

// 페이지네이션 렌더링
function postPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    // 첫 페이지로 이동 (<<)
    const firstPage = document.createElement('li');
    firstPage.className = 'page-item';
    firstPage.innerHTML = `<a class="page-link" href="#"><<</a>`;
    firstPage.onclick = (event) => {
        event.preventDefault();
        loadPostData(1);
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
            loadPostData(i);
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
        loadPostData(totalPage);
    };
    pagination.appendChild(lastPage);
}