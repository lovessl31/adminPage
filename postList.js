// 게시글 로드

// 로컬 스토리지에서 board_idx 가져오기
const board_idx = localStorage.getItem('board_idx');
// 로컬 스토리지에서 토큰 가져오기
const accessToken = localStorage.getItem('accessToken');

// 헤더 변수에 정의
const axiosConfig = {
    headers: {
        Authorization: `Bearer ${accessToken}` // Authorization 헤더에 Bearer 토큰 추가
    }
};

let currentViewMode = 'list'; // 기본 뷰 모드: 리스트
let filteredData = []; // 전역으로 선언하여 데이터 유지

document.addEventListener('DOMContentLoaded', () => {
    loadPostListData();

    // 렌더링 방식 전환 버튼
    const listButton = document.querySelector('.sort_form button:nth-child(2)');
    const albumButton = document.querySelector('.sort_form button:nth-child(1)');
    const albumIcon = albumButton.querySelector('img'); // 앨범 아이콘 이미지
    const listIcon = listButton.querySelector('img'); // 리스트 아이콘 이미지

    albumButton.addEventListener('click', () => {
        currentViewMode = 'album';
        albumButton.classList.add('active'); // 버튼 활성화 시 스타일 적용
        listButton.classList.remove('active');
        toggleView();
        updateIcons(); // 아이콘 업데이트
        renderAlbumView(filteredData); // 전역으로 선언된 filteredData를 사용
    });

    listButton.addEventListener('click', () => {
        currentViewMode = 'list';
        listButton.classList.add('active');
        albumButton.classList.remove('active');
        toggleView();
        updateIcons(); // 아이콘 업데이트
        renderPostList(filteredData); // 전역으로 선언된 filteredData를 사용
    });

        // 아이콘을 업데이트하는 함수
        function updateIcons() {
            if (currentViewMode === 'album') {
                // 앨범 형식이 선택되면 앨범 아이콘을 선택된 상태로 변경
                albumIcon.src = '/images/album_selected.svg';
                listIcon.src = '/images/list.svg'; // 리스트는 비활성화된 상태로 변경
            } else {
                // 리스트 형식이 선택되면 리스트 아이콘을 선택된 상태로 변경
                albumIcon.src = '/images/album.svg'; // 앨범은 비활성화된 상태로 변경
                listIcon.src = '/images/list_selected.svg'; // 리스트는 선택된 상태로 변경
            }
        }

});



// 리스트와 앨범 뷰 전환을 위한 함수
function toggleView() {
    const tableView = document.querySelector('table');
    const albumView = document.querySelector('.container-fluid');

    if (currentViewMode === 'album') {
        tableView.style.display = 'none';  // 리스트 테이블 숨김
        albumView.style.display = 'block'; // 앨범 뷰 표시
    } else {
        tableView.style.display = 'table'; // 리스트 테이블 표시
        albumView.style.display = 'none';  // 앨범 뷰 숨김
    }
}

// 서버에 게시글 목록 조회 요청 보내기
function loadPostListData() {
    axios.get(`http://192.168.0.18:28888/with/postList`, axiosConfig)
    .then(response => {
        const postListData = response.data.data;
        console.log('게시글 목록', postListData);

        // board_idx에 따라 게시글 필터링
        filteredData = postListData.filter(post => post.board_idx == board_idx); // 전역 filteredData에 저장
        console.log('필터링된 게시글 목록', filteredData);

        // 데이터를 최신 글이 먼저 나오도록 reverse() 한번만 호출
        filteredData.reverse();


        // 게시판명 동적으로 추가 (board_idx와 일치하는 게시글에서 가져옴)
        if (filteredData.length > 0) {
            const boardName = filteredData.find(post => post.board_idx == board_idx)?.board_name;

            if (boardName) {
                const boardTitle = document.querySelector('#content h4');
                boardTitle.textContent = boardName;
            }
        }

        // 초기 화면에서는 리스트 형식으로 렌더링
        toggleView();
        if (currentViewMode === 'album') {
            renderAlbumView(filteredData);
        } else {
            renderPostList(filteredData);
        }
    })
    .catch(error => {
        console.error('게시글 가져오기 에러:', error);
    });
}

// 리스트 형식으로 데이터 렌더링
function renderPostList(data) {
    const postLists = data;
    const tableBody = document.getElementById('postListBody');

    tableBody.innerHTML = ''; // 테이블 초기화

    postLists.forEach((postList, index) => {
        const rowNumber = index + 1; // 인덱스는 0부터 시작하므로 1을 더해줌
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center justify-content-center">
                    <input type="checkbox">
                </div>
            </td>
            <td>${rowNumber}</td>
            <td style="text-align: left;">
                <a href="post.html?post_id=${postList['post_idx']}">${postList['p_title']}</a>
                ${postList['thumbnail'].length > 0 ? `<span class="pic"><img src="/images/pic.png"></span>` : ''}
                ${postList['comment_count'] > 0 ? `<span class="cmt_bold"><a link>[${postList['comment_count']}]</a></span>` : ''}
            </td>
            <td>${postList['user_name']}</td>
            <td>${postList['update_date']}</td>
            <td>${postList['p_view']}</td>
            <td>${postList['like_count']}</td>
            <td class="buttons center-align">
                <button class="modifyBtn" id="boardModify" data-post-id="${postList['post_idx']}">수정</button>
                <button class="deleteBtn" data-post-id="${postList['post_idx']}">삭제</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// 앨범 형식으로 데이터 렌더링
function renderAlbumView(data) {
    const postLists = data;
    const containerFluid = document.querySelector('.container-fluid'); // 앨범 리스트 전체 컨테이너
    const container = document.querySelector('.container-w .row');
    const noPicElement = document.querySelector('.noPic'); // .noPic 요소 선택
    container.innerHTML = ''; // 앨범 뷰 초기화

    // 게시글에 데이터가 있을 때만 카드 생성
    postLists.forEach((postList) => {
        const card = document.createElement('div');
        card.className = 'col-md-3 mb-4';
        card.innerHTML = `
            <div class="card">
                <a href="post.html?post_id=${postList['post_idx']}">
                    <div class="image-container">
                        <img src="${postList['thumbnail'].length > 0 ? postList['thumbnail'][0] : 'images/default.jpg'}" class="card-img-top" alt="Post image">
                    </div>
                </a>
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <a href="post.html?post_id=${postList['post_idx']}"><h5 class="card-title">${postList['p_title']}</h5></a>
                        ${postList['comment_count'] > 0 ? `<span class="cmt_bold"><a href="">[${postList['comment_count']}]</a></span>` : ''}
                    </div>
                    <p class="card-text">${postList['user_name']}</p>
                    <span class="card-text">${postList['update_date'].split(' ')[0]}</span>
                    <span class="card-text">조회수 ${postList['p_view']}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    // 사진이 포함된 게시글이 없을 때, 앨범 리스트 숨기고 noPic만 표시
    if (postLists.every(post => post['thumbnail'].length === 0)) {
        containerFluid.style.display = 'none';  // 앨범 리스트 전체 숨김
        noPicElement.style.display = 'block';   // noPic 메시지 표시
    } else {
        containerFluid.style.display = 'block'; // 앨범 리스트 표시
        noPicElement.style.display = 'none';    // noPic 메시지 숨김
    }
}
