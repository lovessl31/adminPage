
// url 
const defaultUrl = "http://safe.withfirst.com:28888"
const params = new URL(document.location.href).searchParams;

// 토큰
const rtoken = getCookieValue('refreshToken');
const atoken = localStorage.getItem('accessToken');

let currentPage = 1;
let itemsPerPage = 10;
let totalPage = 1;
let optionType = "all";
let optionValue = "";
let board_name = "";
const bidx = localStorage.getItem('board_idx');
const urlParams = new URLSearchParams(window.location.search);
const pidx = urlParams.get('id');

// 전역 변수
let postDetail = [];
let optionData = [];


function fetchDetailData() {

    $.ajax({
        url : defaultUrl + `/with/post_detail?bidx=${bidx}&pidx=${pidx}`,
        method : 'GET',
        headers : {
            'Authorization' : `Bearer ${atoken}`
        },
        success : function(response) {
            console.log('상세데이터를 로드하는데 성공하였습니다.');
            console.log('상세데이터 : ' , response.data);
            postDetail = response.data;
            optionData = response.data.options;
            renderDetail();
            renderOptions();
        },
        error : function(e) {
            console.log('error :: 상세페이지 데이터 로드 에러', e);
        }
    });

}

function renderDetail() {

    // 타이틀 렌더링
    const writeHeader = $('.write-info');
    writeHeader.empty();

    writeHeader.html(`
        <span>${postDetail.user_name}</span>
        <span>${postDetail.created_date}</span>
        <span>${postDetail.p_view}</span>
        `);

    // 로컬 스토리지에서 좋아요 상태 불러오기
    const storedLikeStatus = localStorage.getItem(`post_like_${postDetail.post_idx}`);
    postDetail.isLiked = storedLikeStatus === 'true'; // 문자열로 저장되므로 'true'인지 체크
    
    // 사이드 컨텐츠 렌더링
    const likeSet = $('.likesWrap');
    const cmtSet = $('.cmtWrap');
    const postSideIcon = $('.post_side_icon'); // post_side_icon 요소 선택
    
    if (postDetail.LikeSet === 'Y') { // 좋아요 기능 사용 여부 체크
        likeSet.empty();
        const likeImage = postDetail.isLiked ? 'fillheart.png' : 'heart.png'; // 좋아요 여부에 따른 이미지
        likeSet.html(`
            <button class="likeBtn"><img src="/images/${likeImage}"></button>
            <span>${postDetail.LikeCount}</span>            
        `);
    } else {
        likeSet.hide(); // 좋아요 기능 사용 안 할 경우 숨기기
    }

    if (postDetail.CommentSet === 'Y') {

        cmtSet.empty();
        cmtSet.html(`
            <button><img src="/images/Comments.png"></button>
            <span>${postDetail.cmt_count}</span>
            `);
    } else {
        cmtSet.hide();
    }
        // 좋아요와 코멘트 모두 사용하지 않을 경우 post_side_icon 숨기기
        if (postDetail.LikeSet === 'N' && postDetail.CommentSet === 'N') {
            postSideIcon.hide(); // 숨기기
        } else {
            postSideIcon.show(); // 표시하기
        }

     // 좋아요 버튼 클릭 이벤트 설정
     $('.likeBtn').on('click', toggleLike);
}

function toggleLike() {

    $.ajax({
        url: defaultUrl + `/with/post_like/${pidx}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${atoken}`
        },
        success: function() {
     
           postDetail.isLiked = !postDetail.isLiked; // 좋아요 상태 반전
           postDetail.LikeCount += postDetail.isLiked ? 1 : -1; // 상태에 따라 개수 조정
           
           // 좋아요 상태와 개수 업데이트
           const likeBtn = $('.likeBtn img');
           likeBtn.attr('src', postDetail.isLiked ? '/images/fillheart.png' : '/images/heart.png');
           $('.likesWrap span').text(postDetail.LikeCount);
           
           // 로컬 스토리지에 좋아요 상태 저장
           localStorage.setItem(`post_like_${pidx}`, postDetail.isLiked);
        },
        error: function(error) {
            console.error("좋아요 요청 실패:", error);
            alert("좋아요를 처리하는 중 오류가 발생했습니다.");
        }
    });
}

function generateHTMLForOption(option) {

    switch(option.ol_type) {

        case 'dropdown':
            return `
                <div class="module-container">
                    <div class="module-content" id="module-dropdown">
                        <h4>${option.ol_name}</h4>
                        <div class="selectedOption">
                        <p>${option.selected_value ? option.selected_value.value : '데이터 없음'}</p>
                        </div>
                    </div>
                </div>
            `;

        case 'dataInput':
            return `
                <div class="module-container">
                  <div class="module-content" id="module-datainput">
                    <h4>${option.ol_name}</h4>
                    <div class="module-value">
                        <p>${option.selected_value ? option.selected_value.value : '데이터 없음'}</p>
                    </div>
                  </div>
                </div>                
            `;

        case 'file':
        case 'file_img':
        case 'file_viedo':
            return `
                <div class="module-container">
                    <div class="module-content" id="module-file">
                        <h4>${option.ol_name}</h4>
                        <div class="file-contentWrap">
                            ${option.selected_value && option.selected_value.length > 0 ? option.selected_value.map(file => `
                                 <div class="fileInfo">
                                    <span><img src="/images/folder.png"></span>
                                    <span>${file.o_f_name}</span>
                                    <span>(${file.f_size || '크기 정보 없음'})</span>
                                </div>
                                <button class="file-down-btn" data-f-path="${file.f_path}" data-f-name="${file.o_f_name}">
                                    <img src="/images/download.svg">
                                </button>
                                `).join('') : '파일 없음'}
                        </div>
                    </div>
                </div>            
            `;

        case 'files':
            const files = option.selected_value || []; // 파일 목록 배열
            const totalFileCount = files.length;
            // 파일 크기 합산
            const totalSizeKB = files.reduce((sum, file) => sum + convertToKB(file.f_size), 0);
            const totalSizeFormatted = totalSizeKB >= 1024
            ? (totalSizeKB / 1024).toFixed(2) + " MB"
            : totalSizeKB.toFixed(2) + " KB";

            // 파일 리스트 HTML 생성
            const fileListHTML = files.map(file => `
                <div class="files-list">
                    <div>
                        <span><img src="/images/folder.svg"></span>
                        <span>${file.o_f_name}</span>
                         <span>(${file.f_size})</span> <!-- 원본 단위 유지 -->
                    </div>
                    <button class="file-down-btn" data-f-path="${file.f_path}" data-f-name="${file.o_f_name}">
                        <img src="/images/download.svg">
                    </button>
                </div>
            `).join('');
            
            return `
                <div class="module-container">
                    <div class="module-content" id="module-multiFile">
                        <h4>${option.ol_name}</h4>
                        <div class="attach-content-wrap">
                            <div class="attach-content">
                                <div class="d-flex align-items-center">
                                    <button class="toggle-file-wrap">
                                        <img id="toggle-icon" src="/images/attach-dropright.png">
                                    </button>
                                    <p><span class="toggle-text">목록 열기</span> <span class="fileCount">${totalFileCount}</span>개<span class="total-c">(${totalSizeFormatted})</span></p>
                                </div>
                                <div>
                                    <button class="file-down-btn"><img src="/images/download.svg">전체 다운로드</button>
                                </div>
                            </div>
                            <div class="file-list-wrap" style="display: none">
                                ${fileListHTML}
                            </div>
                        </div>
                    </div>
                </div>
            `;
                
        case 'editor':
            const editorContainerId = `editor-${option.ol_idx}`;
            return `
                <div class="module-container">
                    <div class="module-content" id="module-editor">
                        <h4>${option.ol_name}</h4>
                            <div class="editor-wrap" id="${editorContainerId}"></div>
                    </div>
                </div>
            `;

        case 'textArea':
            return `
                 <div class="module-container">
                  <div class="module-content" id="module-textArea">
                    <h4>${option.ol_name}</h4>
                    <div class="textArea-wrap">
                       <p>${option.selected_value ? option.selected_value.value : '데이터 없음'}</p>
                    </div>
                  </div>
                </div>           
            `;
    }
}

function renderOptions() {
    const container = $('#optionsContainer'); // 실제 모듈을 담을 컨테이너 선택기
    container.empty(); // 기존 내용을 비움

    // options 배열의 각 항목을 HTML로 변환하여 컨테이너에 추가
    postDetail.options.forEach(option => {
        const optionHTML = generateHTMLForOption(option);
        container.append(optionHTML);

        // `editor` 타입일 경우 Viewer 초기화
        if (option.ol_type === 'editor') {
            const editorContainerId = `editor-${option.ol_idx}`;
            const viewer = new toastui.Editor.factory({
                el: document.getElementById(editorContainerId),
                initialValue: option.selected_value ? option.selected_value.value : '내용 없음',
                viewer: true,
                customHTMLRenderer: {
                    listItem(node) {
                        const { attributes } = node;
                        return {
                            type: 'openTag',
                            tagName: 'li',
                            outerNewLine: true,
                            attributes: {
                                class: attributes.class || '',
                                'data-task': attributes['data-task'] || ''
                            }
                        };
                    }
                }
            });
        }
    });
}

// 파일 단위 변환 함수
function convertToKB(sizeStr) {
    const [size, unit] = sizeStr.split(" ");
    const numericSize = parseFloat(size);

    switch (unit) {
        case "MB":
            return numericSize * 1024; // MB to KB
        case "KB":
            return numericSize;
        case "B":
            return numericSize / 1024; // B to KB
        default:
            return 0;
    }
}

// 파일 다운로드 함수

function downloadFile(event) {

    event.preventDefault();

    const fPath = $(this).data('f-path'); 
    const ofName = $(this).data('f-name'); 

    console.log(fPath);
    console.log(ofName);

    const url = `http://safe.withfirst.com:28888/with${fPath}&o_filename=${ofName}`;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${atoken}`);
    xhr.responseType = 'blob'; // 바이너리 데이터를 처리하기 위해 blob으로 설정

    xhr.onload = function () {
        if (xhr.status === 200) {
            // Blob 데이터를 사용하여 파일 다운로드
            const blob = xhr.response;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = ofName; // HTML에서 전달된 파일명으로 다운로드
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
    
    fetchDetailData();

    $('.confirmDeleteBtn').on('click', function() {
        $('.drop_content').toggle();
    });

    // 파일 다운로드
    $(document).on('click', '.file-down-btn', downloadFile);

    // 파일 목록 열기 토글
    $(document).on('click', '.toggle-file-wrap', function() {
        const fileWrap = $(this).closest('.attach-content-wrap').find('.file-list-wrap');
        const toggleIcon = $(this).find('#toggle-icon');
        const toggleText = $(this).closest('.attach-content').find('.toggle-text');
    
        // file-list-wrap 토글
        fileWrap.toggle();
    
        // 이미지 경로 토글
        const isExpanded = fileWrap.is(':visible');
        toggleIcon.attr('src', isExpanded ? '/images/attach-dropdown.png' : '/images/attach-dropright.png');
        toggleText.html(isExpanded ? '목록 닫기' : '목록 열기');
    });


});












// const urlParams = new URLSearchParams(window.location.search);
// const postId = urlParams.get('id');
// const postIdx = postId;  // postId 값을 postIdx로 설정

// const defaultUrl = "http://safe.withfirst.com:28888"
// let detail_post = []
// let detail_comments = []
// let fileInput;
// let isReply = false; // 대댓글 여부를 추적하는 변수
// let parentComment = null; // 대댓글의 부모 댓글 정보를 저장하는 변수
// let selectedCommentId = null; // 선택된 댓글의 ID
// let selectedGroupId = null;  // 선택된 댓글의 그룹 ID
// let selectedDepth = null;  // 선택된 댓글의 깊이
// let selectedUserId = null;

// let fileDeleted = false; // 파일이 삭제되었는지 여부를 관리

// let boardId, boardName; 


// localStorage.setItem('postIdx', postId); // postIdx 값을 로컬 스토리지에 저장


// document.addEventListener('DOMContentLoaded', (event) => {

//     const accessToken = localStorage.getItem('accessToken'); // 로컬 스토리지에서 accessToken 가져오기

//     const urlParams = new URLSearchParams(window.location.search);
//     const postId = urlParams.get('id');

//     console.log(
//         `postId: ${postId}` // id URL 파라미터 출력
//     );

//     // 데이터 로드 함수 호출
//     loadPostData();
//     loadComments();

//     const axiosConfig = {
//         headers: {
//             Authorization: `Bearer ${accessToken}` // Authorization 헤더에 Bearer 토큰 추가
//         }
//     };

//     axios.get(`http://192.168.0.18:28888/with/post/${postId}/commentList`, axiosConfig)
//     .then(response => {
//           const commentsData = response.data.data;
//           console.log('댓글 데이터:', commentsData);

//           renderComments(commentsData);  // 댓글 렌더링 함수 호출
//           renderReplyComments(commentsData);
//       })
//       .catch(error => {
//           console.error('댓글 데이터 가져오기 에러:', error);
//       });

//       const backBtns = document.querySelectorAll('.postListBtn');

//       // 각 버튼에 대해 클릭 이벤트 리스너 추가
//       backBtns.forEach(button => {
//         button.addEventListener('click', ()=> {
//             window.location.href = `/postList.html?id=${boardId}&name=${boardName}`;
//         });
//       });

//       const top = document.querySelector('#goTop');
//       const content = document.querySelector('.postContentInner');

//       top.addEventListener('click', ()=> {
//         content.scrollTo({
//             top: 0,
//             behavior: 'smooth'
//         });
//     });

//     // 게시글 수정 삭제 메뉴 토글
//     const toggletBtn = document.querySelector('.confirmDeleteBtn');
//     const dropContent = document.querySelector('.drop_content');

//     toggletBtn.addEventListener('click',()=> {
//         dropContent.classList.toggle('show');
//     });

// });

// function loadPostData() {
//     const token = localStorage.getItem('accessToken');    
//     const url = `${defaultUrl}/with/postDetail/${postId}`;
//     axios.get(url, {
//         headers: {
//             'Authorization': `Bearer ${token}`
//         }
//     })
//         .then(response => {
//             const data = response.data.data;
//             detail_post = data;
//             console.log('게시글 데이터:', detail_post);

//             // boardId와 boardName에 데이터 저장
//             boardId = detail_post.board_idx;
//             boardName = detail_post.board_name;

//             renderPosts(detail_post);
//         })
//         .catch(error => {
//             console.error('Error loading post data:', error.response ? error.response.data : error.message);
//         });
// }

// function loadComments(postIdx) {

//     const postIdx2 = localStorage.getItem('postIdx');
//     console.log('왜안나오는데', postIdx2);
//     const token = localStorage.getItem('accessToken');
    
//     return axios.get(`http://192.168.0.18:28888/with/post/${postIdx2}/commentList`, {
//         headers: {
//             Authorization: `Bearer ${token}`,
//         },
//     })
//     .then(response => {
//         const commentsData = response.data.data;
//         renderComments(commentsData);  // 상위 댓글 렌더
  
//     })
//     .catch(error => {
//         console.error('댓글 목록 불러오기 오류:', error);
//     });
// }


// function renderPosts(postData) {

//     // 댓글 총 개수
//     const cmtCount = document.querySelector('.cmt_title span');
//     cmtCount.textContent = postData.comment_count;

    
//     const boardTtitle = document.querySelector('.post-header p');
//     boardTtitle.textContent = postData.board_name;

//     const postTitle = document.querySelector('.post-title h2');
//     postTitle.textContent = postData.p_title;

//     const writeInfo = document.querySelector('.write-info');
//     writeInfo.innerHTML = `
//         <span>${postData.user_name}</span>
//         <span>${postData.update_date}</span>
//         <span>조회 ${postData.p_view}</span>
//         <span>댓글 ${postData.comment_count}</span>
//     `

//     // 옵션 뿌리기
//     const module_content = document.querySelector('.module-container');
//     const module = document.querySelector('.module-content');

//     module.innerHTML = '';

//     if (postData.options && postData.options.length >0) {
//         postData.options.forEach(option => {
//             const row = document.createElement('div');
//             row.classList.add('row', 'mb-2');
//             row.innerHTML = `
//                 <div class="col-2 font-weight">${option.df_name}:</div>
//                 <div class="col-9">${option.option_value}</div>
//             `;
//             module.appendChild(row);
//         });

//         // 옵션이 있으면 섹션 보여줌
//         module_content.style.display = 'block';
//     } else {
//         // 옵션이 없으면 섹션 숨김
//         module_content.style.display = 'none';
//     }

//     // 파일 첨부 뿌리기
//     const fieAttachElement = document.querySelector('.attach-content');
//     const fileWrap = document.querySelector('.file-wrap');
//     const toggleButton = document.querySelector('.toggle-file-wrap');

//     fileWrap.innerHTML = '';

//     if(postData.files && postData.files.length >0 ) {
//         let totalFiles = 0;
//         let totalFileSize = 0;

//         postData.files.forEach(file => {
//             totalFiles += 1;
//             totalFileSize += parseFloat(file.f_size) || 0;

//             const fileItem = document.createElement('div');
//             fileItem.classList.add('file-item');
//             fileItem.innerHTML = `
//                 <p>${file.o_f_name}<span>${file.f_size}</span></p>
//                 <button><img src="/images/download.svg"></button>
//             `;

//             fileWrap.appendChild(fileItem);
//         });

//         // 파일 개수와 총 용량 표시
//         const fileCount = document.querySelector('.fileCount');
//         const fileSize = document.querySelector('.total-c');
     

//         if (fileCount) {
//             fileCount.textContent = `${totalFiles}`
//         }

//         if (fileSize) {
//             fileSize.textContent = `${totalFileSize.toFixed(1)}MB`;
//         }
//     } else {
//         // 파일이 없으면 file섹션 숨김
//         fieAttachElement.style.display = 'none';
//     }

//     toggleButton.addEventListener('click', () => {
//         const toggleIcon = document.getElementById('toggle-icon');

//         fileWrap.classList.toggle('show');

//         // 파일 목록 보이면 "열림" 이미지, 숨겨지면 "닫힘" 이미지로 변경
//         if (fileWrap.classList.contains('show')) {
//             toggleIcon.src = '/images/attach-dropdown.png'; // 열림 상태의 이미지
//         } else {
//             toggleIcon.src = '/images/attach-dropright.png'; // 닫힘 상태의 이미지
//         }
//     });

//     // 게시글 내용 렌더링
//     const post_content = document.querySelector('.post_content');
//     post_content.textContent = postData.p_content;


//     // 좋아요 개수 랜더링
//     const likesWrap = document.querySelector('.likesWrap');
//     const likeCount  = document.querySelector('.likes_count');
//     const likeButton = likesWrap.querySelector('button img');

//     if (postData.LikeSet == 'Y') {
        
//         // 좋아요 개수와 상태 초기화
//         likeCount .textContent = postData.likes_count;

//         if (postData.likeCheck === 'Y') {
//             likeButton.src = '/images/fillheart.png'; // 좋아요 누른 상태
//         } else if (postData.likeCheck === 'N') {
//             likeButton.src = '/images/heart.png'; // 좋아요 안 누른 상태
//         }

//         const token = localStorage.getItem('accessToken');

//         likesWrap.querySelector('button').addEventListener('click', function() {
//             // 서버에 GET 요청 보내기
//             axios.get(`http://192.168.0.18:28888/with/postDetail/${postData.post_idx}/like`, {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                 },
//             })
//             .then(response => {
//                 const data = response.data;
//                 console.log('성공응답', response.data);
//                 // 서버 응답에 따라 좋아요 상태 업데이트
//                 if(data.result === 'success') {
//                     if (data.data.status === 'add') {
//                         // 좋아요 추가된 상태
//                         likeButton.src = '/images/fillheart.png';
//                         likeCount.textContent = parseInt(likeCount.textContent) + 1;
//                     } else if (data.data.status === 'delete') {
//                         // 좋아요 취소된 상태
//                         likeButton.src = '/images/heart.png';
//                         likeCount.textContent = parseInt(likeCount.textContent) - 1;
//                     }
//                 } else {
//                     alert('좋아요 처리에 실패했습니다.');
//                 }
//             })
//             .catch(error=> {
//                 console.error('좋아요 요청 중 오류 발생:', error);
//                 alert('좋아요 요청 중 오류가 발생했습니다.');
//             });
//         });
//     } else {
//         likesWrap.style.display = 'none';
//     }
// }


// // 댓글 관련 함수
// function renderComments(comments) {

//     const commentsWrap = document.querySelector('.cmt_wrap');
//     commentsWrap.innerHTML = ''; // 기존 댓글 초기화

//     comments.forEach(comment => {
//         const userName = comment.user_name || 'Unknown'; // 기본값 설정
//         const userImage = comment.user_img || '/images/userImg.svg'; // 이미지가 없을 때 빈 문자열


//         const commentElement = document.createElement('div');
//         commentElement.classList.add('cmt_item');
//         commentElement.setAttribute('data-comment-id', comment.cm_idx); // 댓글 ID를 data-comment-id 속성으로 설정
//         if(comment.del_yn === 'N') {
//             commentElement.innerHTML = `
//             <div class="cmt_user_img">
//                     <img src="${userImage}" alt="${userName}" />
//              </div>
//              <div>
//                  <div class="cmt_tit_info">
//                      <h5>${userName}</h5>
//                      <span>${comment.created_date}</span>
//                  </div>
//                  <div class="cmt_tit_content">
//                      <p>${comment.cm_content}</p>
//                  </div>
//                  <div class="cmt_imgbox" style="display: none;">
//                      <a class="cmt_img_link"><img class="image"></a>
//                  </div>
//                  <div class="cmt_filebox" style="display: none;">
//                      <div class="file_namebox">
//                          <i class="file_name"></i>
//                          <span class="file_size"></span>
//                      </div>
//                      <button id="file_down"><img src="/images/download.svg"></button>
//                  </div>
//              </div>
//              <div class="more_btn_wrap">
//                  <button class="more_btn" data-user-name="${userName}"></button>
//              </div>
//          `;
//         } else {
//                 // 삭제된 댓글의 경우
//             commentElement.innerHTML = `
//                 <div class="deleted_comment">
//                     <p>삭제된 댓글입니다.</p>
//                 </div>

//             `;
//         }

//         commentsWrap.appendChild(commentElement);

//          // 첨부파일이 있는 경우 처리
//          if (comment.첨부파일 && comment.첨부파일.length > 0) {
//             comment.첨부파일.forEach(file => {

//                 // 이미지 확장자 체크
//                 const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(file.f_ext.toLowerCase());

//                 if (isImage) {
//                     // 이미지인 경우 이미지 박스에 표시
//                     const imgBox = commentElement.querySelector('.cmt_imgbox');

//                     if (imgBox) {  // imgBox가 존재할 때만 실행
//                         const imgLink = imgBox.querySelector('.cmt_img_link');
//                         const imgTag = imgBox.querySelector('.image');
        
//                         if (imgLink && imgTag) {  // imgLink와 imgTag가 존재할 때만 실행
//                             imgLink.target = "_blank";  // 새 창에서 이미지 열기
        
//                             const accessId = localStorage.getItem('accessId');
//                             const fileViewUrl = `http://safe.withfirst.com:28888/file/imageView/${file.f_idx}?accessId=${accessId}`;
        
//                             imgTag.src = fileViewUrl; // 이미지 경로 설정
//                             imgBox.style.display = 'block'; // 이미지 박스를 보이게 함
//                             imgLink.href = fileViewUrl; // 이미지 클릭 시 원본 이미지로 이동
//                         }
//                     }
        
//                 } else {
//                     // 그 외 파일(첨부파일) 처리
//                     const fileBox = commentElement.querySelector('.cmt_filebox');
                    
//                     if (fileBox) {  // fileBox가 존재할 때만 실행
//                         const fileNameElement = fileBox.querySelector('.file_name');
//                         const fileSizeElement = fileBox.querySelector('.file_size');
//                         const fileDownloadButton = fileBox.querySelector('#file_down');
        
//                         if (fileNameElement && fileSizeElement && fileDownloadButton) {  // 각각의 요소가 존재할 때만 실행
//                             fileNameElement.textContent = file.o_f_name; // 파일명
//                             fileSizeElement.textContent = `(${file.f_size})`; // 파일 사이즈
//                             fileBox.style.display = 'flex'; // 파일 박스를 보이게 함
        
//                             // 다운로드 버튼 클릭 시 파일 다운로드 처리
//                             fileDownloadButton.addEventListener('click', () => {


//                         // 로그로 확인
//                         console.log(`Downloading file: ${file.o_f_name}, ID: ${file.f_idx}`);

//                                 const token = localStorage.getItem('accessToken');

//                                 axios.get(`http://safe.withfirst.com:28888/file/download/${file.f_idx}`, {
//                                     headers: {
//                                         'Authorization': `Bearer ${token}`  // Authorization 헤더에 accessToken 추가
//                                     },
//                                     responseType: 'blob'  // 서버로부터의 응답을 blob 형식으로 처리 (파일 다운로드)
//                                 })
//                                 .then(response => {
//                                    // 파일 다운로드 처리
//                                     const url = window.URL.createObjectURL(new Blob([response.data]));
//                                     const link = document.createElement('a');
//                                     link.href = url;
//                                     link.setAttribute('download', file.o_f_name);
//                                     document.body.appendChild(link);
//                                     link.click();
//                                     document.body.removeChild(link);
//                                 })
//                                 .catch(error => {
//                                     console.error('파일 다운로드 중 오류 발생:', error);
//                                 });
//                             });
//                         }
//                     }
//                 }
//             });
//         }

    
//          // 하위 댓글이 있을 경우 하위 댓글을 렌더링
//         if (comment.하위댓글 && comment.하위댓글.length > 0) {
//             renderReplyComments(comment.하위댓글, commentElement); // 하위 댓글을 부모 댓글 밑에 렌더링
//         }

//           // 파일 정보가 있는지 확인 (가정: comment.첨부파일에 파일 정보가 있음)
//           const existingFile = comment.첨부파일 && comment.첨부파일.length > 0 ? comment.첨부파일[0] : undefined;

    


// // 더보기 메뉴 추가 로직은 여기서 삭제되지 않은 댓글에만 동작
// if(comment.del_yn === 'N') {
//     const moreBtn = commentElement.querySelector('.more_btn');
//     moreBtn.addEventListener('click', () => {
//         selectedCommentId = comment.cm_idx;  // 댓글 ID
//         selectedGroupId = comment.rp_g_idx || comment.cm_idx;  // 그룹 ID (최상위 댓글 ID)
//         selectedDepth = comment.depth || 0;  // 댓글의 depth
//         selectedUserId = comment.user_idx; // 댓글 작성자의 user_idx

//         // 더보기 메뉴 표시
//         showCommentMenu(userName, comment.cm_content, existingFile);

//         console.log('선택된 댓글 정보:', { selectedCommentId, selectedGroupId, selectedDepth, selectedUserId  });
//     });
// }


//     });

//     // 더보기 버튼에 이미지 추가
//     addMoreButtonIcons();
// }


// function renderReplyComments(replyComments) {
//     const commentsWrap = document.querySelector('.cmt_wrap');

//     replyComments.forEach(reply => {
//         // 하위 댓글의 내용이 없으면 건너뛰기
//         if (!reply.rp_content) return;

//         const replyElement = document.createElement('div');
//         replyElement.classList.add('cmt_item');
//         replyElement.setAttribute('data-comment-id', reply.rp_idx); // 대댓글 ID를 data-comment-id 속성으로 설정

//         // 하위 댓글에 depth에 따라 들여쓰기 적용
//         const depthIndent = reply.depth * 20; // depth에 따라 20px씩 들여쓰기
//         replyElement.style.paddingLeft = `${depthIndent}px`;

//         const userImage = reply.user_img || '/images/userImg.svg'; // 서버에서 이미지가 없을 때 기본 이미지 사용

//         if(reply.del_yn === 'Y') {
//             replyElement.innerHTML = `
//             <div class="deleted_reply">
//                 <p>삭제된 댓글입니다.</p>
//             </div>
//         `;
//         } else {
//             replyElement.innerHTML = `
//             <div class="reply_img_wrap"></div>
//             <div class="cmt_user_img">
//                 <img src="${userImage}" alt="${reply.user_name || 'Unknown User'}" />
//             </div>
//             <div>
//                 <div class="cmt_tit_info">
//                     <h5>${reply.user_name || 'Unknown User'}</h5>
//                     <span>${reply.created_date || ''}</span>
//                 </div>
//                 <div class="cmt_tit_content">
//                     <p>${reply.rp_content || ''}</p>
//                 </div>
//                 <div class="cmt_imgbox" style="display: none;">
//                     <a class="cmt_img_link"><img class="image"></a>
//                 </div>
//                 <div class="cmt_filebox" style="display: none;">
//                     <div class="file_namebox">
//                         <i class="file_name"></i>
//                         <span class="file_size"></span>
//                     </div>
//                     <button id="file_down">다운</button>
//                 </div>
//             </div>
//             <div class="more_btn_wrap">
//                 <button class="more_btn" data-user-name="${reply.user_name || 'Unknown User'}"></button>
//             </div>
//         `;
//         }
       

//         // 독립적으로 댓글을 .cmt_wrap에 추가
//         commentsWrap.appendChild(replyElement);

//         const replyImgWrap = replyElement.querySelector('.reply_img_wrap');
//         if (replyImgWrap) {  // reply_img_wrap가 존재하는지 확인
//             const replyImg = document.createElement('img');
//             replyImg.src = '/images/cmt.svg';  // import된 ㄴ 아이콘 이미지
//             replyImg.alt = 'Reply Icon';
//             replyImgWrap.appendChild(replyImg);
//         } else {
//             console.error('reply_img_wrap 요소를 찾을 수 없습니다.');
//         }

//         // 첨부파일 처리
//         if (reply.첨부파일 && reply.첨부파일.length > 0) {
//             reply.첨부파일.forEach(file => {
//                 const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(file.f_ext.toLowerCase());

//                 if (isImage) {
//                     const imgBox = replyElement.querySelector('.cmt_imgbox');
//                     const imgLink = imgBox.querySelector('.cmt_img_link');
//                     const imgTag = imgBox.querySelector('.image');

//                     const accessId = localStorage.getItem('accessId');
//                     const fileViewUrl = `http://safe.withfirst.com:28888/file/imageView/${file.f_idx}?accessId=${accessId}`;

//                     imgTag.src = fileViewUrl;
//                     imgBox.style.display = 'block';
//                     imgLink.href = fileViewUrl;

//                 } else {
//                     const fileBox = replyElement.querySelector('.cmt_filebox');
//                     const fileNameElement = fileBox.querySelector('.file_name');
//                     const fileSizeElement = fileBox.querySelector('.file_size');
//                     const fileDownloadButton = fileBox.querySelector('#file_down');

//                     fileNameElement.textContent = file.o_f_name;
//                     fileSizeElement.textContent = `(${file.f_size})`;
//                     fileBox.style.display = 'block';

//                     fileDownloadButton.addEventListener('click', () => {
//                         window.open(`${file.domain}/${file.s_f_name}.${file.f_ext}`, '_blank');
//                     });
//                 }
//             });
//         }


//         if(reply.del_yn === 'N') {
//             const moreBtn = replyElement.querySelector('.more_btn');
//             moreBtn.addEventListener('click', () => {
//                 // 대댓글 요소에서 필요한 데이터 추출
//                 selectedCommentId = reply.rp_idx;  // 대댓글 ID
//                 selectedGroupId = reply.rp_g_idx || reply.rp_idx;  // 그룹 ID (최상위 댓글 ID)
//                 selectedDepth = reply.depth || 0;  // 대댓글의 depth
//                 selectedUserId = reply.user_idx; // 댓글 작성자의 user_idx
        
//               // 더보기 메뉴 표시
//               showCommentMenu(reply.user_name || 'Unknown User', reply.rp_content || '');
        
//               console.log('선택된 대댓글 정보:', { selectedCommentId, selectedGroupId, selectedDepth });
//             });
//         }

//        // 재귀적으로 하위 댓글 렌더링
//        if (reply.하위댓글 && reply.하위댓글.length > 0) {
//         renderReplyComments(reply.하위댓글); // 하위 댓글 재귀적으로 처리
//         }
//     });
// }

// // 더보기 메뉴 표시 함수
// function showCommentMenu(userName, commentContent, existingFile) {
//     const overlay = document.querySelector('.overlay');
//     const cmtMenu = document.querySelector('.cmt_menu');
    
//     cmtMenu.innerHTML = `
//         <div class="cmt_menu_wrap">
//             <ul>
//                 <li class="reply_menu" data-user-name="${userName}">답댓글</li>
//                 <li class="edit_menu">수정</li>
//                 <li class="copy_menu">복사</li>
//                 <li class="delete_menu">삭제</li>
//                 <li class="cancel_menu">취소</li>
//             </ul>
//         </div>
//     `;

//     overlay.style.display = 'block';
//     cmtMenu.style.display = 'block';

//     document.querySelector('.edit_menu').addEventListener('click', () => {
//         hideOverlayAndMenu();
//         showEditForm(commentContent, selectedCommentId, selectedUserId, existingFile); // 댓글 ID와 유저 ID를 전달
//     });


//     document.querySelector('.copy_menu').addEventListener('click', () => {
//         navigator.clipboard.writeText(commentContent).then(() => alert('복사되었습니다.'));
//         hideOverlayAndMenu();
//     });

//     document.querySelector('.cancel_menu').addEventListener('click', hideOverlayAndMenu);

//     document.querySelector('.reply_menu').addEventListener('click', () => {
//         isReply = true;
//         parentComment = { cm_idx: selectedCommentId, rp_g_idx: selectedGroupId, depth: selectedDepth }; // 대댓글의 부모 댓글 정보 저장
//         hideOverlayAndMenu();
//         showReplyWrite(userName);

//     });

//        // 삭제 기능
//        document.querySelector('.delete_menu').addEventListener('click', () => {
//         removeComment(selectedCommentId, selectedUserId); // 선택된 댓글 ID를 넘겨서 삭제 처리
//         console.log('dd', selectedCommentId, selectedUserId);
//         hideOverlayAndMenu(); // 메뉴 닫기
//     });
// }

// // 답글 작성창 표시 함수
// function showReplyWrite(userName) {
//     const commentWrite = document.getElementById('comment_write');
//     const replyMention = document.querySelector('.reply_mention');
//     const mentionText = document.getElementById('mentionText');

//     replyMention.style.display = 'flex';
//     mentionText.textContent = `@${userName}`;

//     // 댓글 입력창에 포커스
//     const commentTextArea = document.getElementById('commentTextArea'); // 댓글 입력창
//     commentTextArea.focus();

//     // 댓글 입력창으로 화면 스크롤
//     commentTextArea.scrollIntoView({ behavior: 'smooth', block: 'center' });


//     const closeBtn = document.querySelector('.re_btn_wrap');
//     closeBtn.addEventListener('click', hideReplyWrite);
// }

// // 답글 작성창 숨기기 함수
// function hideReplyWrite() {
//     const replyMention = document.querySelector('.reply_mention');
//     replyMention.style.display = 'none'; // 답댓글 창 숨기기
//     document.getElementById('commentTextArea').value = ''; // 텍스트 초기화
//     isReply = false; // 일반 댓글 상태로 변경
//     parentComment = null; // 부모 댓글 정보 초기화
// }

// // 메뉴 및 오버레이 숨기기
// function hideOverlayAndMenu() {
//     document.querySelector('.overlay').style.display = 'none';
//     document.querySelector('.cmt_menu').style.display = 'none';
// }

// // 더보기 버튼에 이미지 추가 함수
// function addMoreButtonIcons() {
//     const moreBtns = document.querySelectorAll('.more_btn_wrap button');
//     moreBtns.forEach(button => {
//         const moreImg = document.createElement('img');
//         moreImg.src = '/images/more.svg';
//         button.appendChild(moreImg);
//     });
// }

// // 수정 폼 표시 함수
// function showEditForm(commentContent, commentIdx, userId, existingFile) {
//     const targetComment = document.querySelector(`.cmt_item[data-comment-id="${commentIdx}"]`);

//     if (!targetComment) {
//         console.error(`댓글 ID ${commentIdx}에 해당하는 댓글을 찾을 수 없습니다.`);
//         return;
//     }

//     // 기존 파일 정보를 제대로 가져왔는지 확인
//     const file = Array.isArray(existingFile) ? existingFile[0] : existingFile;



//       // 파일이 없거나 f_idx가 없는 경우 처리
//       let fileViewUrl = '';
//       if (file && file.f_idx) {
//           const accessId = localStorage.getItem('accessId');
//           fileViewUrl = `http://safe.withfirst.com:28888/file/imageView/${file.f_idx}?accessId=${accessId}`;
//       }


    
//     // 기존 파일이 있으면 파일 UI를 표시
//     let fileUI = '';
//     if (file && file.f_idx) {
//         const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(file.f_ext.toLowerCase());
//         if (isImage) {
//             fileUI = `
//                 <div class="thumb_box">
//                     <div class="img_cover">
//                         <span class="thumbnail"><img src="${fileViewUrl}" alt="첨부 이미지" class="thumbnail-img"/></span>
//                         <button id="removeFileBtn" class="remove_img" data-file-idx="${file.f_idx}">삭제</button>
//                     </div>
//                 </div>
//             `;
//         } else {
//             fileUI = `
//                 <div class="file_cover">
//                     <div class="file_box">
//                         <span class="fine_name">
//                             <i class="file_name_img"></i>
//                             <button type="button" class="file_name_text">${file.o_f_name}</button>
//                         </span>
//                         <span class="file_size">(${file.f_size})</span>
//                         <button id="removeFileBtn" class="remove_img" data-file-idx="${file.f_idx}">삭제</button>
//                     </div>
//                 </div>
//             `;
//         }
//     }

//     // 수정 UI의 HTML 구조를 업데이트
//     const editFormHTML = `
//         <div class="modify_write">
//             <div class="modify_textarea">
//                 <textarea id="modifyCmtTextArea">${commentContent}</textarea>
//             </div>
//             ${fileUI}
//             <div class="attach_area"></div> <!-- 파일 미리보기 영역 -->
//             <div class="modify_cmt_bottom">
//                 <input type="file" id="modify_cmt_input" multiple style="display:none">
//                 <button class="mcmt_pic_wrap" id="m_fileButton"><img src="/images/pic.svg"></button>
//                 <div class="cmt_reg">
//                     <span>0/600</span>
//                     <button id="submitModify">수정</button>
//                     <button id="submitCancel">취소</button>
//                 </div>
//             </div>
//         </div>
//     `;

//     targetComment.innerHTML = editFormHTML;

//     // 파일 선택창 열기
//     document.getElementById('m_fileButton').addEventListener('click', () => {
//         document.getElementById('modify_cmt_input').click();
//     });

//     // 파일 선택 시 처리
//     document.getElementById('modify_cmt_input').addEventListener('change', (event) => {
//         handleModifyFileChange(event, file);
//     });

//     // 수정 버튼 클릭 시 수정된 댓글을 서버에 전송
//     document.getElementById('submitModify').addEventListener('click', () => {
//         const editedContent = document.getElementById('modifyCmtTextArea').value;
//         const newFile = document.getElementById('modify_cmt_input').files[0];
//         // 파일 삭제 상태와 함께 서버로 전송
//         saveEditedComment(commentIdx, userId, editedContent, newFile, fileDeleted);
//     });

//     // 취소 버튼 클릭 시 수정 취소
//     document.getElementById('submitCancel').addEventListener('click', () => cancelEdit(postIdx));

//     // 파일 삭제 버튼 클릭 시 처리
//     const removeFileBtn = document.querySelector('#removeFileBtn');
//     if (removeFileBtn) {
//         removeFileBtn.addEventListener('click', () => {
//             const fileIdx = removeFileBtn.getAttribute('data-file-idx'); // 파일 ID 가져오기
//             deleteFile(fileIdx).then(success => {
//                 if (success) {
//                     removeFileBtn.closest('.thumb_box, .file_cover').remove(); // 파일 UI 삭제
//                 }
//             });
//         });
//     }
// }

// // 수정 창 전용 파일 선택 시 처리 함수
// function handleModifyFileChange(event, existingFile) {
//     const file = event.target.files[0];
//     if (!file) return;


//     const fileType = file.type;
//     const fileSize = (file.size / 1024).toFixed(2) + 'KB';
//     const attachArea = document.querySelector('.modify_write .attach_area'); // 수정 창의 attach_area

//     // 기존 파일 UI 삭제
//     const existingFileUI = document.querySelector('.thumb_box, .file_cover'); // 기존 파일 UI를 선택
//     if (existingFileUI) {
//         existingFileUI.remove(); // 기존 파일 UI 삭제
//     }
    

      
//     // 기존 파일이 있으면 서버에 삭제 요청 보내기
//     if (existingFile && existingFile.f_idx) {
//         deleteFile(existingFile.f_idx).then(success => {
//             if (success) {
//                 console.log('서버에서 기존 파일 삭제 완료');
//                 fileDeleted = true; // 기존 파일이 삭제되었음을 표시
//             } else {
//                 console.error('기존 파일 삭제 실패');
//             }
//         });
//     }


//     // 파일이 이미지인지 확인
//     if (fileType.startsWith('image/')) {
//         const reader = new FileReader();
//         reader.onload = (e) => {
//             const imgElement = document.createElement('div');
//             imgElement.classList.add('thumb_box');
//             imgElement.innerHTML = `
//                 <div class="img_cover">
//                     <span class="thumbnail"><img src="${e.target.result}" alt="첨부 이미지" class="thumbnail-img"/></span>
//                     <button id="removeFileBtn" class="remove_img">삭제</button>
//                 </div>
//             `;
//             attachArea.innerHTML = ''; // 기존의 미리보기 영역 초기화
//             attachArea.appendChild(imgElement);


//                // 기존 서버 파일 삭제 (서버에 기존 파일이 있으면 삭제 처리)
//                if (existingFile && existingFile.file_idx) {
//                 deleteFile(existingFile.file_idx).then(success => {
//                     if (success) {
//                         console.log('서버에서 기존 파일 삭제 완료');
//                         fileDeleted = true; // 기존 파일이 삭제되었음을 표시
//                     }
//                 });
//             }

//             // 삭제 버튼 이벤트 리스너 추가 (UI에서만 삭제)
//             const removeFileBtn = imgElement.querySelector('#removeFileBtn');
//             removeFileBtn.addEventListener('click', () => {
//                 imgElement.remove(); // UI에서 파일 삭제
//             });
//         };
//         reader.readAsDataURL(file);
//     } else {
//         // 이미지가 아닐 경우 file_cover에 파일 이름 및 사이즈 표시
//         const fileBox = document.createElement('div');
//         fileBox.classList.add('file_cover');
//         fileBox.innerHTML = `
//             <div class="file_box">
//                 <span class="fine_name">
//                     <i class="file_name_img"></i>
//                     <button type="button" class="file_name_text">${file.name}</button>
//                 </span>
//                 <span class="file_size">(${fileSize})</span>
//                 <button id="removeFileBtn" class="remove_img">삭제</button>
//             </div>
//         `;
//         attachArea.innerHTML = ''; // 기존의 미리보기 영역 초기화
//         attachArea.appendChild(fileBox);

//         // 삭제 버튼 이벤트 리스너 추가 (UI에서만 삭제)
//         const removeFileBtn = fileBox.querySelector('#removeFileBtn');
//         removeFileBtn.addEventListener('click', () => {
//             fileBox.remove(); // UI에서 파일 삭제
//             fileDeleted = true; // 새 파일 삭제
//         });
//     }
// }


// // 수정된 댓글을 서버로 전송하는 함수
// function saveEditedComment(commentIdx, userId, newContent, postIdx) {

//     const postidx = localStorage.getItem('postIdx');
//     const token = localStorage.getItem('accessToken'); // 토큰 가져오기


//     const file = document.querySelector('#modify_cmt_input').files[0];
//     const isComment = selectedDepth === 1 ? 'top' : 'sub'; 
    
//     // 폼데이터 생성
//     const formData = new FormData();
    
//     formData.append('content', newContent);
//     formData.append('idx', commentIdx);
//     formData.append('userIdx', userId);

//     // 파일이 있는 경우에만 formData에 파일을 추가
//     if (file) {
//         formData.append('file', file);
//     }

//     // 폼데이터 내용을 확인하는 방법
//     console.log('폼데이터 내용:');
//     formData.forEach((value, key) => {
//     console.log(key + ':', value);
//     });

//     axios.put(`http://192.168.0.18:28888/with/edit_comment/${isComment}`, formData, {
//     headers: {
//         'Content-Type': 'multipart/form-data',
//         'Authorization': `Bearer ${token}`
//     }
//     })
//     .then(response => {
//         if (response.status === 200) {
//             console.log('댓글 수정 성공:', response.data);
//             loadComments(postidx); // 댓글 다시 불러오기
//         }
//     })
//     .catch(error => {
//     console.error('댓글 생성 오류:', error);
//     });
// }

// // 수정 취소 함수
// function cancelEdit(postIdx) {
//     // 기존 댓글 뷰로 복원
//     loadComments(postIdx);
// }

// // 수정 폼에서 파일 삭제 함수 
// function deleteFile(fileIdx) {
//     const token = localStorage.getItem('accessToken');
    
//     console.log('파일 삭제 요청 보냄:', fileIdx); // 삭제 요청 전 로그 추가


//     return axios.delete(`http://192.168.0.18:28888/file/delete/${fileIdx}`, {
//         headers: {
//             Authorization: `Bearer ${token}`
//         }
//     })
//     .then(response => {
//         if (response.status === 200) {
//             console.log('파일 삭제 성공:', response.data);
//             return true; // 파일 삭제 성공
//         }
//     })
//     .catch(error => {
//         console.error('파일 삭제 오류:', error);
//         return false; // 파일 삭제 실패
//     });
// }

// // 댓글 삭ㅈ ㅔ함수 
// function removeComment(comment_idx, commentUserIdx) {
//     const token = localStorage.getItem('accessToken');

//     console.log('삭제 요청됨:', comment_idx, commentUserIdx);

//     // 댓글인지 대댓글인지 구분하는 로직
//     const isComment = selectedDepth === 1 ? 'top' : 'sub'; 

//     // JSON 형태의 데이터 준비
//     const data = [{
//         comment_idx: comment_idx,
//         userIdx: Number(commentUserIdx)  // userIdx를 숫자로 변환
//     }];

//     // 전송할 데이터를 콘솔에 출력
//     console.log('전송할 데이터:', JSON.stringify(data));

//     // axios.request로 DELETE 요청과 함께 데이터 전송
//     axios.request({
//         url: `http://192.168.0.18:28888/with/del_comment/${isComment}`,
//         method: 'delete',
//         headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//         },
//         data: data  // delete 메서드로 본문에 데이터를 보내려면 request를 사용
//     })
//     .then(response => {
//         if (response.status === 200) {
//             console.log('삭제성공!');
//             loadComments(postIdx); // 댓글 다시 불러오기
//         }
//     })
//     .catch(error => {
//         console.error('댓글 삭제 오류:', error);
//     });
// }

// document.addEventListener('DOMContentLoaded', () => {


//     // 파일 첨부 버튼과 파일 인풋
//     const fileButton = document.querySelector('#fileButton');
//     const fileInputComment = document.querySelector('#fileInputComment');
//     const attachArea = document.querySelector('.attach_area');
//     const thumbBox = document.querySelector('.thumb_box');
//     const fileCover = document.querySelector('.file_cover');
//     const fileNameText = document.querySelector('.file_name_text');
//     const fileSizeText = document.querySelector('.file_size');
//     const thumbnailImg = document.querySelector('.thumbnail-img');
//     const removeImgButton = document.querySelector('.remove_img');
//     const btnFineDel = document.querySelector('.btn_fine_del');

//     const replyMention = document.querySelector('.reply_mention');


//    // 댓글 등록
//     const submitCommentButton= document.getElementById('submitComment');
//     const cmtTextarea = document.querySelector('#commentTextArea');


//     submitCommentButton.addEventListener('click', ()=> {
//         if (isReply) {
//             addSubComment(parentComment); // 대댓글 작성
//         } else {
//             addComment(); // 일반 댓글 작성
//         }
//         resetReplyState(); // 상태 초기화
//         cmtTextarea.value = ''; // 댓글 입력창 초기화

//     });

//       // 댓글/대댓글 상태 초기화
//       function resetReplyState() {
//         isReply = false;
//         parentComment = null;

//         cmtTextarea.value = ''; // 댓글 입력창 초기화
//         fileInputComment.value = ''; // 파일 입력창 초기화
//         document.querySelector('.attach_area').style.display = 'none'; // 파일 첨부 창 숨기기
//         hideReplyWrite(); // 답댓글 창 숨기기

//         // 글자 수 카운트 초기화 (각 댓글 입력창과 대응하는 글자 수 카운트 초기화)
//         charCountSpanList.forEach(span => {
//             span.textContent = `0/${maxChars}`; // 글자 수 초기화
//         });

//     }
    
//     // 상위 댓글 등록 함수
//     function addComment() {
//         const isComment = 'top';
//         const token = localStorage.getItem('accessToken');
//         const cm_content = cmtTextarea.value.trim();
//         const file = document.querySelector('#fileInputComment').files[0];
        
//         // 폼데이터 생성
//         const formData = new FormData();
        
//         formData.append('cm_content', cm_content);

//            // 파일이 있는 경우에만 formData에 파일을 추가
//            if(file) {
//             formData.append('file', file);
//         }
        
//    // 폼데이터 내용을 확인하는 방법
//    console.log('폼데이터 내용:');
//    formData.forEach((value, key) => {
//        console.log(key + ':', value);
//    });

//    axios.post(`http://192.168.0.18:28888/with/post/${isComment}/${postIdx}/add_comment`, formData, {
//        headers: {
//            'Content-Type': 'multipart/form-data',
//            'Authorization': `Bearer ${token}`
//        }
//    })
//    .then(response => {
//         if (response.status === 200) {
//             loadComments(postIdx); // 댓글 다시 불러오기
//         }
//    })
//    .catch(error => {
//        console.error('댓글 생성 오류:', error);
//    });
// }

// function addSubComment(parentComment) {

//     const isComment = 'sub';
//     const token = localStorage.getItem('accessToken');
//     const rp_content = cmtTextarea.value.trim();
//     const file = document.querySelector('#fileInputComment').files[0];

//     const rp_p_idx = parentComment.cm_idx;  // 부모 댓글 ID
//     const rp_g_idx = parentComment.rp_g_idx || parentComment.cm_idx;  // 그룹 ID (최상위 댓글 ID)
//     const rp_depth = parentComment.depth + 1;  // 부모 댓글의 depth + 1

//    // 폼데이터 생성
//    const formData = new FormData();

//    // 파일이 있는 경우에만 formData에 파일을 추가
//    if(file) {
//        formData.append('file', file);
//    }
   
//    formData.append('rp_content', rp_content);
//    formData.append('rp_depth', rp_depth);
//    formData.append('rp_p_idx', rp_p_idx);
//    formData.append('rp_g_idx', rp_g_idx);

//       // 폼데이터 내용을 확인하는 방법
//       console.log('대댓글 폼데이터 내용:');
//       formData.forEach((value, key) => {
//           console.log(key + ':', value);
//       });


//       axios.post(`http://192.168.0.18:28888/with/post/${isComment}/${postIdx}/add_comment`, formData, {
//         headers: {
//             'Content-Type': 'multipart/form-data',
//             'Authorization': `Bearer ${token}`
//         }
//     })
//     .then(response => {
//         if (response.status === 200) {
//             console.log(response);
//             console.log('생성됫어');
//             loadComments(postIdx); // 댓글 다시 불러오기
//             resetReplyState(); // 상태 초기화 후 답댓글 창 숨기기
//         }
//     })
//     .catch(error => {
//         console.error('대댓글 등록 오류:', error);
//     });

// }

//    // 파일 선택 창 열기 함수
//     function openFileDialog() {
//         fileInputComment.click();  // 파일 첨부 창 열기
//     }
    
//         // 파일 선택 시 처리 함수
//         function handleFileChange(event) {
//             const file = event.target.files[0];
//             if (!file) return;
    
//             const fileType = file.type;
//             const fileSize = (file.size / 1024).toFixed(2) + 'KB';
    
//             // 파일이 이미지인지 확인
//             if (fileType.startsWith('image/')) {
//                 const reader = new FileReader();
//                 reader.onload = (e) => {
//                     thumbnailImg.src = e.target.result;  // img 태그에 이미지 설정
//                     attachArea.style.display = 'block';
//                     thumbBox.style.display = 'block';
//                     fileCover.style.display = 'none';
//                 };
//                 reader.readAsDataURL(file);
//             } else {
//                 // 이미지가 아닐 경우 file_cover에 파일 이름 및 사이즈 표시
//                 fileNameText.textContent = file.name;
//                 fileSizeText.textContent = `(${fileSize})`;
//                 attachArea.style.display = 'block';
//                 thumbBox.style.display = 'none';
//                 fileCover.style.display = 'block';
//             }
//         }
    
//         // 파일 첨부 버튼 클릭 시 파일 선택 창 열기
//         fileButton.addEventListener('click', openFileDialog);
    
//         // 파일 선택 시 파일 처리
//         fileInputComment.addEventListener('change', handleFileChange);
    
//         // 첨부된 이미지나 파일 삭제 버튼 처리
//         removeImgButton.addEventListener('click', () => {
//             thumbnailImg.src = ''; // img 태그의 이미지 제거
//             attachArea.style.display = 'none';
//             fileInputComment.value = ''; // 파일 선택 초기화
//         });
    
//         btnFineDel.addEventListener('click', () => {
//             fileNameText.textContent = '';
//             fileSizeText.textContent = '';
//             attachArea.style.display = 'none';
//             fileInputComment.value = ''; // 파일 선택 초기화
//         });

//     // 댓글 textarea와 답글 textarea 가져오기
//     const replyTextareaList = document.querySelectorAll('.cmt_textarea textarea');
//     const charCountSpanList = document.querySelectorAll('.cmt_reg span');

//      // 글자 수 제한
//      const maxChars = 600;

//      // 글자 수 업데이트 함수
//      function updateCharCount(textarea, span) {
//          let currentLength = textarea.value.length;
 
//          // 글자 수가 최대를 초과하면 경고 및 글자 수 제한
//          if (currentLength > maxChars) {
//              textarea.value = textarea.value.substring(0, maxChars);
//              currentLength = maxChars; // 최대 글자 수로 업데이트
//          }
 
//          // 현재 글자 수 업데이트
//          span.textContent = `${currentLength}/${maxChars}`;
//      }
 
//      // 각 textarea에 이벤트 리스너 추가
//      replyTextareaList.forEach((textarea, index) => {
//          const span = charCountSpanList[index];
//          const charCountSpan = charCountSpanList[index];
 
//          // 입력 이벤트 처리
//          textarea.addEventListener('input', () => {
//              updateCharCount(textarea, charCountSpan);
//          });
 
//          // 붙여넣기 이벤트 처리
//          textarea.addEventListener('paste', () => {
//              setTimeout(() => {
//                  updateCharCount(textarea, charCountSpan);
//              }, 0); // 붙여넣기가 완료된 후 글자 수 업데이트
//          });
 
//            // 포커스가 해제될 때 textarea 초기화
//         //    textarea.addEventListener('blur', () => {
//         //      textarea.value = ''; // 텍스트 초기화
//         //      span.textContent = `0/${maxChars}`; // 글자 수 초기화
//         //  });
//      });

//      // 텍스트 높이 자동 조절
//      autoAdjustTextareaHeight('.cmt_textarea textarea');

// });

// function autoAdjustTextareaHeight(textareaSelector) {
//     const textarea = document.querySelector(textareaSelector);
//     textarea.addEventListener('input', function () {
//         this.style.height = 'auto'; // 높이를 자동으로 설정하여 초기화
//         this.style.height = `${this.scrollHeight}px`; // scrollHeight를 기준으로 높이 설정
//     });
// }

// //  // 파일 삭제 버튼 클릭 시 파일 UI에서 삭제하고 fileDeleted를 true로 설정
// // document.getElementById('removeFileBtn').addEventListener('click', () => {
// //     document.querySelector('.thumb_box').remove(); // 파일 UI 삭제
// //     fileDeleted = true; // 파일이 삭제되었음을 표시
// // });

