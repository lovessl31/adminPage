let posts = [];
let currentPage = 1;
let itemsPerPage = 10;
let totalPage = 1;
let keyword = "";
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', () => {
    console.log(
        `postId: ${postId}` // id URL 파라미터 출력
    );

    // Axios를 사용하여 해당 게시글의 글 목록을 가져옵니다
    // axios.get(`/api/posts?postId=${postId}`)
    //     .then(response => {
    //         // 글 목록 표시 로직
    //     });


    // 데이터 로드 함수 호출
    loadPostData(currentPage);
})



function loadPostData(page = 1) {
    currentPage = page;
    const token = localStorage.getItem('accessToken');
    // const url = `http://safe.withfirst.com:28888/with/postList?option_type=${optionType}&option_value=${optionValue}&per_page=${itemsPerPage}&page=${currentPage}`;
    const url = `http://safe.withfirst.com:28888/with/postList/${postId}?keyword=${keyword}&per_page=${itemsPerPage}&page=${currentPage}`;
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

            totalPage = response.data.total_page || 1;
            totalCount = `모든 게시글(${response.data.total_count || 0})`
            console.log(totalPage);
            console.log(111111);
            renderTable();
            console.log(222222);

            document.querySelector('thead input[type="checkbox"]').checked = false;
            document.getElementById('post_count').textContent = totalCount;
        })
        .catch(error => {
            console.error('Error loading post data:', error.response ? error.response.data : error.message);
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

        test = `<td>
                <div class="d-flex align-items-center justify-content-center">
                    <input type="checkbox" data-post-idx="${post['post_idx']}" data-post-name="${post['p_title']}">
                </div>
            </td>        
            <td>${startIndex + index + 1}</td>
            <td><a href="/postList.html?id=${post['게시글 번호']}">${post["게시글 명"]}<img src="./images/link.svg"></a></td>        
            <td>${post["게시글 타입"]}</td>
            <td>${post["좋아요 유/무"]}</td>
            <td>${post["카테고리 명"]}</td>
            <td>${post["카테고리 유형"]}</td>
            <td>${post["게시글 생성일"] ? post["게시글 생성일"].split(' ')[0] : ''}</td>
            <td class="buttons center-align">
                <button class="modifyBtn postModify" data-id="${post['게시글 번호']}">수정</button>
                <button class="deleteBtn" data-post-idx="${post["게시글 번호"]}" data-post-name="${post["게시글 명"]}">삭제</button>
                <button class="moveBtn" data-id="${post["게시글 번호"]}">이동</button>
            </td>  `


        row.innerHTML = `                             
            <td>
                <div class="d-flex align-items-center justify-content-center">
                    <input type="checkbox" data-post-idx="${post['게시글 번호']}" data-post-name="${post['게시글 명']}">
                </div>
            </td>
            <td>1</td>
            <td style="text-align: left;"><a href="post.html">
                디자인 관련 질문 있습니다. 확인부탁드려요!
            </a>
            <!-- 게시글에 그림이 있으면 나타나는 아이콘 -->
            <span class="pic">
                <img src="/images/pic.png">
            </span>
            <!-- 게시글에 댓글이 있으면 나타나는 댓글 개수 -->
            <span class="cmt_bold">
                <a link>[2]</a>
            </span>
            </td>
            <td>송수련</td>
            <td>18:06</td>
            <td>105</td>
            <td>3</td>
            <td class="buttons center-align">
                <button class="modifyBtn" id="postModify">수정</button>
                <button class="deleteBtn">삭제</button>
            </td>        
        `;
        console.log(0);
        // if post[""]
        tableBody.appendChild(row);
        console.log(tableBody);

        console.log(12);
    });


    // 게시글 이동 이벤트
    document.querySelectorAll('.moveBtn').forEach(button => {
        button.addEventListener('click', function () {
            const postId = this.getAttribute('data-id');
            const post = posts.find(v => v["게시글 번호"] == postId)
            console.log(postId);
            console.log(post);
            window.location.href = `/postList.html?id=${postId}`;
        });
    });


    // 동적으로 생성된 팝업에 기존 데이터 맵핑
    document.querySelectorAll('.postModify').forEach(button => {
        button.addEventListener('click', function () {
            const postId = this.getAttribute('data-id'); // 클릭 시 해당 게시글 idx 저장            
            const post = posts.find(v => v["게시글 번호"] == postId); // 해당 idx 일치하는 게시글 객체 저장
            console.log("수정 post", post);

            // 해당 회사 객체로 팝업에 데이터 채우기
            document.getElementById('regisName').value = post['게시글 명'];

            // 게시글 타입, 좋아요 라디오 버튼 설정
            const postTypeRadios = document.getElementsByName('postType');
            postTypeRadios.forEach(v => {
                v.checked = v.value === post["게시글 타입"];
            });
            const likeFeatureRadios = document.getElementsByName('likeFeature');
            likeFeatureRadios.forEach(v => {
                v.checked = v.value === post["좋아요 유/무"];
            });

            document.getElementById('regisDate').textContent = post["게시글 생성일"].split(' ')[0];
            document.getElementById('regisDesc').value = post["게시글 설명"];
            // document.getElementById('regisOption').value = post.options

            // 저장 버튼에 post_idx와 post_name data 속성으로 추가
            document.getElementById('modifySaveBtn').setAttribute('data-post-idx', post['게시글 번호']);
            document.getElementById('modifySaveBtn').setAttribute('data-origin-name', post['게시글 명']);
            document.getElementById('modifyPopup').style.display = 'flex';
        });
    });


    // 팝업 내 저장 버튼 클릭시 실행 될 이벤트 핸들러 
    document.getElementById('modifySaveBtn').addEventListener('click', function () {
        // 입력 필드에서 값 가져오기
        const postName = document.getElementById('regisName').value.trim();
        const postType = document.querySelector('input[name="postType"]:checked').value;
        const postLike = document.querySelector('input[name="likeFeature"]:checked').value;
        const postDesc = document.getElementById('regisDesc').value.trim();

        const originpostName = this.getAttribute('data-origin-name'); // 저장된 게시글 명 가져옴
        const postIdx = this.getAttribute('data-post-idx'); // 저장된 게시글 번호 가져옴
        // const regisDynamicOption = document.getElementById('regisOption').value.trim(); // 게시글 옵션 가져오기

        // 요청할 폼 데이터
        const formData = new FormData();
        formData.append('post_name', postName);
        formData.append('post_type', postType);
        formData.append('LikeSet', postLike);
        formData.append('post_desc', postDesc);



        const token = localStorage.getItem('accessToken');

        // 수정 PUT 요청 보내기
        axios.put(`http://safe.withfirst.com:28888//with/edit_post/${originpostName}/${postIdx}`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data' // 폼데이터 전송 시 설정
            }
        })
            .then(response => {
                console.log('게시글 정보 수정 응답:', response.data);
                let title = "게시글 수정"
                let body = "<p>게시글 정보가 수정되었습니다.</p>"
                showPopup(2, title, body, 'suc')
                localStorage.setItem('currentPage', currentPage);
                //페이지 새로 고침
                location.reload();
            })
            .catch(error => {
                console.error('게시글 정보 수정 오류:', error.response ? error.response.data : error.message);

                if (error.response && error.response.status === 401) {
                    // 401 에러 발생 시 로그아웃 함수 호출
                    window.logout();
                } else {
                    // 기타 에러 처리
                    alert('게시글 수정에 실패했습니다.');
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
            const post_idx = this.getAttribute('data-post-idx');
            const post_name = this.getAttribute('data-post-name');
            console.log("게시글 삭제 버튼 동작 이벤트 테스트", post_idx, post_name);

            deleteposts([{ post_idx: post_idx, post_name: post_name }]);
        })
    });
    console.log(2);
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

    axios.delete('http://safe.withfirst.com:28888/with/del_post', {
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
        loadpostData(1);
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
            loadpostData(i);
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
        loadpostData(totalPage);
    };
    pagination.appendChild(lastPage);
}




// 게시글 생성 클릭 시 생성 페이지로 이동
document.getElementById('createpost').addEventListener('click', function () {
    window.location.href = 'postCreate.html';
});
