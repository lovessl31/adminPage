const protocol = "http://"
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
let commentsData = [];

function fetchDetailData(callback) {

    $.ajax({
        url: defaultUrl + `/with/post_detail?bidx=${bidx}&pidx=${pidx}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${atoken}`
        },
        success: function (response) {
            console.log('상세데이터를 로드하는데 성공하였습니다.');
            console.log('상세데이터 : ', response.data);
            postDetail = response.data;
            optionData = response.data.options;
            renderDetail();
            renderOptions();

            // 데이터 로드 완료 후 콜백 실행
            if (callback) callback();

        },
        error: function (e) {
            console.log('error :: 상세페이지 데이터 로드 에러', e);
        }
    });

}

function fetchCommentData() {
    $.ajax({
        url: defaultUrl + `/with/comment_list?post_idx=${pidx}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${atoken}`
        },
        success: function (response) {
            console.log('댓글 데이터 로드하는데 성공하였습니다.');
            console.log('댓글 데이터 : ', response.data);
            commentsData = response.data;

            renderComment();

        },
        error: function (e) {
            console.log('error :: 댓글 데이터 로드 에러', e);
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

    // 드롭다운 렌더링
    const dropContent = $('.drop_content');
    dropContent.empty();

    dropContent.html(`
        <li><button class="modify-btn" data-p-idx="${postDetail.post_idx}" data-user-idx="${postDetail.user_idx}">수정</button></li>
        <li><button class="delete-btn" data-post-idx="${postDetail.post_idx}" data-user-idx="${postDetail.user_idx}">삭제</button></li>
        <li><button>비공개</button></li>
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
            <span>${postDetail.commentCount}</span>
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
        success: function () {

            postDetail.isLiked = !postDetail.isLiked; // 좋아요 상태 반전
            postDetail.LikeCount += postDetail.isLiked ? 1 : -1; // 상태에 따라 개수 조정

            // 좋아요 상태와 개수 업데이트
            const likeBtn = $('.likeBtn img');
            likeBtn.attr('src', postDetail.isLiked ? '/images/fillheart.png' : '/images/heart.png');
            $('.likesWrap span').text(postDetail.LikeCount);

            // 로컬 스토리지에 좋아요 상태 저장
            localStorage.setItem(`post_like_${pidx}`, postDetail.isLiked);
        },
        error: function (error) {
            console.error("좋아요 요청 실패:", error);
            alert("좋아요를 처리하는 중 오류가 발생했습니다.");
        }
    });
}

function generateHTMLForOption(option) {

    switch (option.ol_type) {

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

        case 'dateInput':
            return `
                    <div class="module-container">
                      <div class="module-content" id="module-dateinput">
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

// 상위 댓글 렌더링
function renderComment() {
    const cmtTitle = $('.cmt_title');
    cmtTitle.empty();
    cmtTitle.html(`<p>${postDetail.commentCount}개의 댓글</p>`);

    const cmtContainer = $('.cmt_container');
    cmtContainer.empty();

    const imagePath = protocol 
    commentsData.forEach(comment => {

        let attachmentsHtml = '';

        // 첨부파일이 있을 경우 이미지와 일반 파일을 구분하여 HTML 생성
        if (comment.첨부파일 && comment.첨부파일.length > 0) {

            // 먼저 이미지 파일을 렌더링
            comment.첨부파일.forEach(file => {
                if (file.f_type && file.f_type.startsWith('image/')) {
                    const imagePath = `${protocol}${file.domain}/with/${file.f_path}`;
                    attachmentsHtml += `
                        <div class="cmt_imgbox">
                            <a class="cmt_img_link" href="${imagePath}" target="_blank">
                                <img class="image" src="${imagePath}" alt="첨부 이미지">
                            </a>
                        </div>
                    `;
                }
            });

            // 그 다음, 이미지가 아닌 파일을 렌더링
            comment.첨부파일.forEach(file => {
                if (!file.f_type.startsWith('image/')) {
                    const filePath = `${protocol}${file.domain}/with/${file.f_path}`;
                    attachmentsHtml += `
                        <div class="cmt_filebox">
                            <div class="file_namebox">
                                <i class="fileName">${file.o_f_name}</i> <!-- 파일명 -->
                                <span class="file_size">(${file.f_size})</span> <!-- 파일 사이즈 -->
                            </div>
                            <button class="file_down" data-file-url="${filePath}"><img src="/images/download.svg"></button>
                        </div>
                    `;
                }
            });
        }

        const commentHtml = comment.del_yn === 'Y'
            ? `
                <div class="cmt_item">
                    <div class="cmt_content">
                        <p>댓글이 삭제되었습니다</p>
                    </div>
                </div>
            `
            : `
            <div class="cmt_item" data-attachments='${JSON.stringify(comment.첨부파일)}'>
                <div class="cmt_tit_wrap">
                    <div class="cmt_tit_content">
                        <div class="cmt_user_img">
                            <img src="/images/pro.svg" alt="User Image">
                        </div>
                        <div class="cmt_tit_info">
                            <h5>${comment.user_name}</h5>
                            <span>${comment.created_date}</span>
                        </div>
                    </div>
                    <div class="cmt_more">
                        <button class="cmt_modify_btn">:</button>
                    </div>
                </div>
                <ul class="cmt_drop" style="display:none;">
                    <li><button class="cmt_modify" data-cm-idx="${comment.cm_idx}" data-u-idx="${comment.user_idx}" data-c-content="${comment.cm_content}" data-u-name="${comment.user_name}">수정</button></li>
                    <li><button class="cmt_delete" data-cm-idx="${comment.cm_idx}" data-u-idx="${comment.user_idx}">삭제</button></li>
                </ul>
                <div class="cmt_content">
                    <p>${comment.cm_content}</p>
                    ${attachmentsHtml} <!-- 첨부파일 HTML 삽입 -->
                </div>
                <div class="reply_btn">
                    <button data-g-idx="${comment.cm_idx}" data-user-name="${comment.user_name}" data-depth="${comment.depth}">답글</button>
                </div>
            </div>
        `;


        cmtContainer.append(commentHtml);
           //하위 댓글이 있을 경우 호출
        if (comment.하위댓글 && comment.하위댓글.length > 0) {
            comment.하위댓글.forEach(reply => {
                renderReplyComments(reply, cmtContainer, comment.user_name, reply.depth);
            });
        }
    });
    

    $(document).on('click', '.file_down', function () {
        const fileUrl = $(this).data('file-url');
        const fileName = $(this).closest('.cmt_filebox').find('.file_name').text(); // 파일 이름 가져오기
    
        fetch(fileUrl)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok.');
                return response.blob();
            })
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            })
            .catch(error => {
                console.error('Download failed:', error);
                alert('파일 다운로드에 실패했습니다.');
            });
    });

}

// renderComment 외부에서 이벤트 핸들러 추가
$(document).on('click', '.cmt_delete', deleteCmt);


// 답글 렌더링
function renderReplyComments(reply, container, parentUserName = null, depth) {
    let attachmentsHtml = '';

    // 첨부파일이 있을 경우 이미지와 일반 파일을 구분하여 HTML 생성
    if (reply.첨부파일 && reply.첨부파일.length > 0) {
            reply.첨부파일.forEach(file => {
                if (file.f_type && file.f_type.startsWith('image/')) {
                    const imagePath = `${protocol}${file.domain}/with/${file.f_path}`;
                    attachmentsHtml += `
                        <div class="cmt_imgbox">
                            <a class="cmt_img_link" href="${imagePath}" target="_blank">
                                <img class="image" src="${imagePath}" alt="첨부 이미지">
                            </a>
                        </div>
                    `;
                }
            });

            // 그 다음, 이미지가 아닌 파일을 렌더링
            reply.첨부파일.forEach(file => {
                if (!file.f_type.startsWith('image/')) {
                    const filePath = `http://${file.domain}/with/${file.f_path}`;
                    attachmentsHtml += `
                        <div class="cmt_filebox">
                            <div class="file_namebox">
                                <i class="fileName">${file.o_f_name}</i> <!-- 파일명 -->
                                <span class="file_size">(${file.f_size})</span> <!-- 파일 사이즈 -->
                            </div>
                            <button class="file_down" data-file-url="${filePath}"><img src="/images/download.svg"></button>
                        </div>
                    `;
                }
        });
    }

    const replyHtml = `
    <div class="cmt_item cmt_reply_item">
        <div class="cmt_tit_wrap">
            <div class="cmt_tit_content">
                <div class="cmt_user_img">
                    <img src="/images/pro.svg" alt="User Image">
                </div>
                <div class="cmt_tit_info">
                    <h5>${reply.user_name}</h5>
                    <span>${reply.created_date}</span>
                </div>
            </div>
            <div class="cmt_more">
                <button>:</button>
            </div>
        </div>
        <ul class="cmt_reply_drop" style="display:none;">
            <li>
                <button class="reply_modify" 
                      data-rp-idx="${reply.rp_idx}" 
                      data-u-idx="${reply.user_idx}" 
                      data-u-name="${reply.user_name}"
                      data-rp-p-idx="${reply.rp_p_idx}"
                      data-rp-g-idx="${reply.rp_g_idx}">
                    수정
                </button>
            </li>
            <li><button class="cmt_delete" data-u-idx="${reply.user_idx}" data-rp-idx="${reply.rp_idx}">삭제</button></li>
        </ul>
        <div class="cmt_content">            
            <p>${reply.rp_content}</p>
            ${attachmentsHtml} <!-- 첨부파일 HTML 삽입 -->
        </div>
        <div class="sub_reply_btn">
            <button data-g-idx="${reply.rp_g_idx}" data-p-idx="${reply.rp_idx}" data-user-name="${reply.user_name}" data-depth="${reply.depth}">답글</button>
        </div>
    </div>
    `;

    container.append(replyHtml);
}



function replyOn(buttonElement) {
    const replyButton = $(buttonElement);
    const userName = replyButton.data('user-name'); // 선택된 댓글의 유저 이름 가져오기
    const depth = replyButton.data('depth'); // depth 값을 1 증가
    const commentItem = $(replyButton).closest('.cmt_item');  // 클릭한 댓글 아이템
    const existingReplyBox = commentItem.find('#reply_write'); // 현재 댓글에 열린 답글 작성창 있는지 확인

    // 이미 답글 창이 열려 있으면 닫기
    if (existingReplyBox.length) {
        existingReplyBox.remove();
    } else {
        // 다른 곳에 열린 답글 창 닫기
        $('#reply_write').remove();

        // depth에 따라 placeholder 설정
        const placeholderText = depth === 1
            ? "댓글을 입력해주세요"
            : `${userName}님께 답글쓰기`;


        // 답글 작성창 HTML 생성
        const replyBoxHtml = `
            <div class="cmt_write_wrap" id="reply_write">
              <div class="cmt_write">
                <div class="cmt_textarea">
                  <textarea id="repplyTextArea" placeholder="${placeholderText}"></textarea>
                </div>
                
                <div class="attach_area">
                  <!-- 답글 사진 첨부 -->
                  <div class="thumb_box_wrap_reply" style="display: none;">
                    <div class="thumb_box_reply">
                      <div class="img_cover_reply">
                        <span class="thumbnail_reply"><img src="" alt="첨부 이미지" class="thumbnail-img-reply"/></span>
                        <button class="remove_img_reply">
                          <img src="/images/close.svg">
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- 답글 파일 첨부 -->
                  <div class="file_cover_reply" style="display: none;">
                    <div class="cmt_fileList_reply">
                      <div>
                        <span><img src="/images/folder.svg"></span>
                        <span class="fine_name_reply">
                          <i class="file_name_img_reply"></i>
                          <button type="button" class="file_name_text_reply">관리자페이지.zip</button>
                        </span>
                        <span class="file_size_reply">(552B)</span>
                      </div>
                      <button class="btn_fine_del_reply"><img src="/images/close_black.svg"></button>
                    </div>
                  </div>

                  <div class="cmt_bottom">
                    <input type="file" id="fileInputReply" multiple style="display:none">
                    <button class="cmt_pic_wrap_reply" id="fileButtonReply">
                      <img src="/images/pic.svg">
                    </button>
                    <div class="cmt_reg">
                      <span>0/600</span>
                      <button id="submitReply" data-depth="${depth}">등록</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        `;

        // 답글 작성창을 클릭한 댓글 아이템의 하단에 추가
        commentItem.append(replyBoxHtml);

        // 답글 작성 시 파일 첨부 초기화
        initializeFileUpload(
            '#reply_write',          // 답글 작성창의 컨테이너
            '#fileInputReply',       // 답글 작성창의 파일 입력 필드
            '.thumb_box_wrap_reply', // 답글 작성창의 이미지 미리보기 영역
            '.file_cover_reply'      // 답글 작성창의 일반 파일 첨부 영역
        );

    }
}

// 댓글 삭제
function deleteCmt() {
    const user_idx = $(this).data('u-idx');
    const cm_idx = $(this).data('cm-idx'); // 상위 댓글 ID
    const rp_idx = $(this).data('rp-idx'); // 하위 댓글 ID

    if (cm_idx) {
        // 상위 댓글 삭제
        deleteCmts([{ isComment: 'TOP', cm_idx: cm_idx, user_idx: user_idx }]);
    } else if (rp_idx) {
        // 하위 댓글 삭제
        deleteCmts([{ isComment: 'SUB', cm_idx: rp_idx, user_idx: user_idx }]);
    }
}

// 삭제 요청 함수
function deleteCmts(cmts) {
    console.log('전송될 데이터:', JSON.stringify(cmts));

    $.ajax({
        url: defaultUrl + '/with/comment_del',
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${atoken}`,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(cmts),
        success: function (response) {
            console.log('댓글 삭제 응답', response.data);
            alert('삭제되었습니다.');
            fetchCommentData();
        },
        error: function (e) {
            console.log(e);
            console.log("errpr :: delete error");
        }
    });
}


function submitCommentEdit(cmIdx, updatedContent, userIdx, userName, allFiles, deletedFiles) {

    const formData = new FormData();

    formData.append('post_idx', pidx);
    formData.append('content', updatedContent);
    formData.append('idx', cmIdx);
    formData.append('user_idx', userIdx);
    formData.append('user_name', userName);
    formData.append('depth', '1');

    console.log('idx', updatedContent);
    console.log('idx', cmIdx);
    console.log('idx', userIdx);
    console.log('idx', userName);

      // 첨부 파일 추가 - 새로 추가된 파일은 `add`, 삭제된 파일은 `delete`로 구분
      let fileIndex = 0;

      // 이미지 파일 먼저 추가
    allFiles.filter(fileObj => fileObj.type === 'new' && fileObj.data.type.startsWith('image/'))
    .forEach(fileObj => {
        formData.append(`files[${fileIndex}][file]`, fileObj.data);
        formData.append(`files[${fileIndex}][action]`, 'add');
        formData.append(`files[${fileIndex}][attribute]`, '5'); // 이미지 속성은 5
        fileIndex++;
    });

    // 이미지 외 파일 추가
    allFiles.filter(fileObj => fileObj.type === 'new' && !fileObj.data.type.startsWith('image/'))
        .forEach(fileObj => {
            formData.append(`files[${fileIndex}][file]`, fileObj.data);
            formData.append(`files[${fileIndex}][action]`, 'add');
            formData.append(`files[${fileIndex}][attribute]`, '6'); // 일반 파일 속성은 6
            fileIndex++;
        });

    // 삭제된 기존 파일 처리
    deletedFiles.forEach(file => {
        formData.append(`files[${fileIndex}][f_idx]`, file.f_idx); // f_idx만 추가
        formData.append(`files[${fileIndex}][action]`, 'delete');
        fileIndex++;
    });



    // FormData 내용 콘솔에 출력
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }

    $.ajax({
        url: defaultUrl + '/with/comment_edit',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${atoken}`,
        },
        processData: false, // FormData 사용 시 필요
        contentType: false, // FormData 사용 시 필요
        data: formData,
        success: function (response) {
            console.log('댓글 수정 응답', response.data);
            fetchCommentData();
        },
        error: function (e) {
            console.log(e);
            console.log("errpr :: MODIFY error");
        }
    });
}

function submitReplyEdit(rpIdx, contentToSend, userIdx, userName, rpPIdx, rpGIdx, allFiles, deletedFiles) {
    const formData = new FormData();

    // `rp_p_idx`가 0일 경우, 사용자 태그 제거
    if (rpPIdx === 0) {
        contentToSend = contentToSend.replace(/<p class="user-tag">.*?<\/p>/, '');
    }

    formData.append('post_idx', pidx);
    formData.append('content', contentToSend);
    formData.append('idx', rpIdx);
    formData.append('user_idx', userIdx);
    formData.append('user_name', userName);
    formData.append('depth', '2');
    formData.append('p_idx', rpPIdx);
    formData.append('g_idx', rpGIdx);


    let fileIndex = 0;

    // 이미지 파일 먼저 추가
    allFiles.filter(fileObj => fileObj.type === 'new' && fileObj.data.type.startsWith('image/'))
        .forEach(fileObj => {
            formData.append(`files[${fileIndex}][file]`, fileObj.data);
            formData.append(`files[${fileIndex}][action]`, 'add');
            formData.append(`files[${fileIndex}][attribute]`, '5'); // 이미지 속성은 5
            fileIndex++;
        });

    // 이미지 외 파일 추가
    allFiles.filter(fileObj => fileObj.type === 'new' && !fileObj.data.type.startsWith('image/'))
        .forEach(fileObj => {
            formData.append(`files[${fileIndex}][file]`, fileObj.data);
            formData.append(`files[${fileIndex}][action]`, 'add');
            formData.append(`files[${fileIndex}][attribute]`, '6'); // 일반 파일 속성은 6
            fileIndex++;
        });

    // 삭제된 기존 파일 처리
    deletedFiles.forEach(file => {
        formData.append(`files[${fileIndex}][f_idx]`, file.f_idx);
        formData.append(`files[${fileIndex}][action]`, 'delete');
        fileIndex++;
    });
    
    // FormData 내용 콘솔에 출력
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }

    $.ajax({
        url: defaultUrl + '/with/comment_edit',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${atoken}`,
        },
        processData: false, // FormData 사용 시 필요
        contentType: false, // FormData 사용 시 필요
        data: formData,
        success: function (response) {
            console.log('댓글 수정 응답', response.data);
            fetchCommentData();
        },
        error: function (e) {
            console.log(e);
            console.log("errpr :: MODIFY error");
        }
    });
}

// 댓글 수정 버튼 클릭 시 editComment 함수 실행
$(document).on('click', '.cmt_modify', function () {
    const commentItem = $(this).closest('.cmt_item');
    const cmIdx = $(this).data('cm-idx');

    // 이미 열려 있는 수정창이 있는지 확인
    if (commentItem.find(`#edit_write_${cmIdx}`).length) {
        // 수정창이 열려 있으면 닫기
        commentItem.find(`#edit_write_${cmIdx}`).remove();
        commentItem.find('.cmt_content').show(); // 원래 댓글 내용을 다시 표시
    } else {
        // 수정창이 없으면 열기
        editComment(this);
    }
});

// 답글 수정 버튼 클릭 시 editReplyComment 함수 실행
$(document).on('click', '.reply_modify', function () {
    const replyItem = $(this).closest('.cmt_item');
    const rpIdx = $(this).data('rp-idx');

    // 이미 열려 있는 수정창이 있는지 확인
    if (replyItem.find(`#edit_reply_${rpIdx}`).length) {
        // 수정창이 열려 있으면 닫기
        replyItem.find(`#edit_reply_${rpIdx}`).remove();
        replyItem.find('.cmt_content').show(); // 원래 답글 내용을 다시 표시
    } else {
        // 수정창이 없으면 열기
        const rpContent = replyItem.find('.cmt_content').html(); // HTML 구조 유지하여 가져오기
        editReplyComment(this, rpContent);
    }
});


function editComment(buttonElement) {
    const editButton = $(buttonElement);
    const commentItem = $(editButton).closest('.cmt_item');
    const commentContentDiv = commentItem.find('.cmt_content');
    const commentContent = commentContentDiv.find('p').text();
    const cmIdx = $(buttonElement).data('cm-idx');
    const userIdx = $(buttonElement).data('u-idx');
    const userName = $(buttonElement).data('u-name');
    const attachments = commentItem.data('attachments') || []; // 기존 첨부파일 데이터

    let fileIdCounter = 0;
    const allFiles = attachments.map(file => ({
        id: fileIdCounter++, // 고유 ID 부여
        type: 'existing',
        data: file
    }));
    const deletedFiles = []; // 삭제된 파일 저장

    function renderAttachments() {
        const imagesHtml = allFiles.filter(fileObj => {
            return (fileObj.type === 'existing' && fileObj.data.f_type.startsWith('image/')) ||
                   (fileObj.type === 'new' && fileObj.data.type.startsWith('image/'));
        }).map(fileObj => {
            const file = fileObj.data;
            const imagePath = fileObj.type === 'existing' 
                ? `${protocol}${file.domain}/with/${file.f_path}`
                : URL.createObjectURL(file);

            return `
                <div class="thumb_box" data-file-id="${fileObj.id}">
                    <div class="img_cover">
                        <span class="thumbnail"><img src="${imagePath}" alt="${file.o_f_name || file.name}" class="thumbnail-img"/></span>
                        <button class="remove_img"><img src="/images/close.svg"></button>
                    </div>
                </div>
            `;
        }).join('');

        const filesHtml = allFiles.filter(fileObj => {
            return (fileObj.type === 'existing' && !fileObj.data.f_type.startsWith('image/')) ||
                   (fileObj.type === 'new' && !fileObj.data.type.startsWith('image/'));
        }).map(fileObj => {
            const file = fileObj.data;
            const fileName = file.o_f_name || file.name;
            const fileSize = file.f_size || `${(file.size / 1024).toFixed(1)} KB`;

            return `
                <div class="cmt_fileList" data-file-id="${fileObj.id}">
                    <div>
                        <span><img src="/images/folder.svg"></span>
                        <span class="fine_name">${fileName}</span>
                        <span class="file_size">(${fileSize})</span>
                    </div>
                    <button class="btn_fine_del"><img src="/images/close_black.svg"></button>
                </div>
            `;
        }).join('');

        $(`#thumb_box_wrap_edit_${cmIdx}`).html(imagesHtml);
        $(`#file_cover_edit_${cmIdx}`).html(filesHtml);

            // If there are no images, hide the image container
        if (imagesHtml) {
            $(`#thumb_box_wrap_edit_${cmIdx}`).show();
        } else {
            $(`#thumb_box_wrap_edit_${cmIdx}`).hide();
        }

        // If there are no files, hide the file container
        if (filesHtml) {
            $(`#file_cover_edit_${cmIdx}`).show();
        } else {
            $(`#file_cover_edit_${cmIdx}`).hide();
        }
        

        // 콘솔에 현재 상태 출력
        console.log("Current allFiles array:", allFiles);
        console.log("Current deletedFiles array:", deletedFiles);
    }

    const editBoxHtml = `
        <div class="edit_write_wrap" id="edit_write_${cmIdx}">
            <div class="cmt_write">
                <div class="cmt_textarea">
                    <textarea id="editTextArea_${cmIdx}">${commentContent}</textarea>
                </div>

                <div class="attach_area">
                    <div class="thumb_box_wrap_edit" id="thumb_box_wrap_edit_${cmIdx}">
                        <!-- 이미지 파일들이 렌더링될 영역 -->
                    </div>
                    <div class="file_cover_edit" id="file_cover_edit_${cmIdx}">
                        <!-- 일반 파일들이 렌더링될 영역 -->
                    </div>
                    
                    <div class="cmt_bottom">
                        <input type="file" id="fileInputEdit_${cmIdx}" multiple style="display:none">
                        <button class="cmt_pic_wrap_edit" id="fileButtonEdit_${cmIdx}"><img src="/images/pic.svg"></button>
                        <div class="cmt_reg">
                            <span class="char-count">0/600</span>
                            <button id="submitEdit_${cmIdx}" data-cm-idx="${cmIdx}" data-u-idx="${userIdx}" data-u-name="${userName}">수정</button>
                            <button id="cancelEdit_${cmIdx}">취소</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    commentContentDiv.hide(); // 원래 댓글 내용을 숨김
    commentContentDiv.after(editBoxHtml);
    renderAttachments();

    const editTextarea = $(`#editTextArea_${cmIdx}`);
    const charCountSpan = $(`#edit_write_${cmIdx} .char-count`);

    // 텍스트 영역 초기화 (글자 수 표시와 높이)
    const currentLength = editTextarea.val().length;
    charCountSpan.text(`${Math.min(currentLength, 600)}/600`);
    editTextarea.css('height', 'auto').css('height', `${editTextarea[0].scrollHeight}px`);

    // 글자 수 제한 및 자동 높이 조절
    editTextarea.on('input', function () {
        const length = $(this).val().length;
        charCountSpan.text(`${Math.min(length, 600)}/600`);

        $(this).css('height', 'auto');
        $(this).css('height', `${this.scrollHeight}px`);
    });


    $(document).on("change", `#fileInputEdit_${cmIdx}`, function(event) {
        const files = Array.from(event.target.files);
        const remainingSlots = 5 - allFiles.length;

        if (files.length > remainingSlots) {
            alert("최대 5개의 파일만 첨부할 수 있습니다.");
            return;
        }

        files.forEach(file => {
            allFiles.push({ id: fileIdCounter++, type: 'new', data: file }); 
        });

        console.log("Files added:", files); // 파일 첨부 시 추가된 파일 출력
        renderAttachments(); 
    });

    // 삭제 버튼 클릭 시 처리
    $(document).on("click", ".remove_img, .btn_fine_del", function() {
        const fileId = $(this).closest('[data-file-id]').data('file-id');
        const fileIndex = allFiles.findIndex(fileObj => fileObj.id === fileId);
        
        if (fileIndex !== -1) {
            const fileObj = allFiles[fileIndex];
            if (fileObj.type === 'existing') {
                deletedFiles.push({ ...fileObj.data, action: 'delete' });
            }

            allFiles.splice(fileIndex, 1); 
        }

        console.log("File removed:", fileId); // 파일 제거 시 삭제된 파일 출력
        renderAttachments(); 
    });

    $(`#submitEdit_${cmIdx}`).on('click', function () {
        const updatedContent = $(`#editTextArea_${cmIdx}`).val().trim();

        if (updatedContent) {
            submitCommentEdit(cmIdx, updatedContent, userIdx, userName, allFiles, deletedFiles);
        } else {
            alert('내용을 입력해주세요.');
        }
    });

    $(`#cancelEdit_${cmIdx}`).on('click', function () {
        $(`#edit_write_${cmIdx}`).remove();
        commentContentDiv.show();
    });
}

function editReplyComment(buttonElement, rp_content) {
    const editButton = $(buttonElement);
    const commentItem = $(editButton).closest('.cmt_item');
    const commentContentDiv = commentItem.find('.cmt_content');

    const rpIdx = $(buttonElement).data('rp-idx');
    const userIdx = $(buttonElement).data('u-idx');
    const userName = $(buttonElement).data('u-name');
    const rpPIdx = $(buttonElement).data('rp-p-idx');
    const rpGIdx = $(buttonElement).data('rp-g-idx');

    const tagContent = `<p class="user-tag">@${userName}</p>`;

    // rp_content에는 순수 댓글 내용만 들어가도록 유지
    let replyContent = rp_content.replace(tagContent, '').trim();
    // 첨부파일 관련 HTML 요소 제거
    replyContent = replyContent.replace(/<div class="cmt_imgbox">.*?<\/div>/gs, ''); // 이미지 박스 제거
    replyContent = replyContent.replace(/<div class="cmt_filebox">.*?<\/div>/gs, ''); // 파일 박스 제거

    console.log('d이ㅏ먼이라ㅓㅁ아리멍ㄻㅇ', replyContent);

    // HTML을 안전하게 텍스트로 변환하여 순수한 텍스트만 남기기
    const cleanContent = $('<div>').html(replyContent).text().trim();

    console.log('d이ㅏ먼이라ㅓㅁ아리멍ㄻㅇ', cleanContent);
    // const displayContent = rp_content.replace(tagContent, '');
    // const cleanContent = $('<div>').html(displayContent).text().trim();

    commentContentDiv.hide();

    let fileIdCounter = 0;

    // commentsData에서 하위 댓글 데이터 검색
    function findReply(rpIdx) {
        for (const comment of commentsData) {
            const reply = comment.하위댓글.find(subComment => subComment.rp_idx === rpIdx);
            if (reply) return reply;
        }
        return null;
    }

   // 해당 답글 데이터를 찾고 첨부 파일 설정
   const replyData = findReply(rpIdx);
   const attachments = replyData ? replyData.첨부파일 : [];
   console.log('Loaded attachments:', attachments);

   const allFiles = attachments.map(file => ({
       id: fileIdCounter++,
       type: 'existing',
       data: file
   }));
   const deletedFiles = [];

    function renderAttachments() {
        const imagesHtml = allFiles.filter(fileObj => {
            return (fileObj.type === 'existing' && fileObj.data.f_type.startsWith('image/')) ||
                   (fileObj.type === 'new' && fileObj.data.type.startsWith('image/'));
        }).map(fileObj => {
            const file = fileObj.data;
            const imagePath = fileObj.type === 'existing'
                ? `${protocol}${file.domain}/with/${file.f_path}`
                : URL.createObjectURL(file);

            return `
                <div class="thumb_box" data-file-id="${fileObj.id}">
                    <div class="img_cover">
                        <span class="thumbnail"><img src="${imagePath}" alt="${file.o_f_name || file.name}" class="thumbnail-img"/></span>
                        <button class="remove_img"><img src="/images/close.svg"></button>
                    </div>
                </div>
            `;
        }).join('');

        const filesHtml = allFiles.filter(fileObj => {
            return (fileObj.type === 'existing' && !fileObj.data.f_type.startsWith('image/')) ||
                   (fileObj.type === 'new' && !fileObj.data.type.startsWith('image/'));
        }).map(fileObj => {
            const file = fileObj.data;
            const fileName = file.o_f_name || file.name;
            const fileSize = file.f_size || `${(file.size / 1024).toFixed(1)} KB`;

            return `
                <div class="cmt_fileList" data-file-id="${fileObj.id}">
                    <div>
                        <span><img src="/images/folder.svg"></span>
                        <span class="fine_name">${fileName}</span>
                        <span class="file_size">(${fileSize})</span>
                    </div>
                    <button class="btn_fine_del"><img src="/images/close_black.svg"></button>
                </div>
            `;
        }).join('');

        $(`#thumb_box_wrap_edit_reply_${rpIdx}`).html(imagesHtml);
        $(`#file_cover_edit_reply_${rpIdx}`).html(filesHtml);

         // 파일이 없을 경우 요소 숨기기
        if (imagesHtml) {
            $(`#thumb_box_wrap_edit_reply_${rpIdx}`).show();
        } else {
            $(`#thumb_box_wrap_edit_reply_${rpIdx}`).hide();
        }

        if (filesHtml) {
            $(`#file_cover_edit_reply_${rpIdx}`).show();
        } else {
            $(`#file_cover_edit_reply_${rpIdx}`).hide();
        }

        console.log("Current allFiles array:", allFiles);
        console.log("Current deletedFiles array:", deletedFiles);
    }

    const editBoxHtml = `
        <div class="edit_reply_wrap" id="edit_reply_${rpIdx}">
            <div class="cmt_write">
                <div class="cmt_textarea">
                    <textarea id="editReplyTextArea_${rpIdx}">${cleanContent}</textarea>
                </div>

                <div class="attach_area">
                    <div class="thumb_box_wrap_edit_reply" style="display: none;" id="thumb_box_wrap_edit_reply_${rpIdx}">
                        <!-- 이미지 파일들이 렌더링될 영역 -->
                    </div>
                    <div class="file_cover_edit_reply" style="display: none;" id="file_cover_edit_reply_${rpIdx}">
                        <!-- 일반 파일들이 렌더링될 영역 -->
                    </div>

                    <div class="cmt_bottom">
                        <input type="file" id="fileInputEditReply_${rpIdx}" multiple style="display:none">
                        <button class="cmt_pic_wrap_edit_reply" id="fileButtonEditReply_${rpIdx}"><img src="/images/pic.svg"></button>
                        <div class="cmt_reg">
                            <span class="char-count">0/600</span>
                            <button id="submitEditReply_${rpIdx}" data-rp-idx="${rpIdx}" data-u-idx="${userIdx}" data-u-name="${userName}">수정</button>
                            <button id="cancelEditReply_${rpIdx}">취소</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    commentContentDiv.after(editBoxHtml);
    renderAttachments();

    const editTextarea = $(`#editReplyTextArea_${rpIdx}`);
    const charCountSpan = $(`#edit_reply_${rpIdx} .char-count`);

    // 초기 텍스트 길이에 맞춰 글자 수와 높이 설정
    const currentLength = editTextarea.val().length;
    charCountSpan.text(`${Math.min(currentLength, 600)}/600`);
    editTextarea.css('height', 'auto').css('height', `${editTextarea[0].scrollHeight}px`);

    // 글자 수 제한 및 높이 자동 조절
    editTextarea.on('input', function () {
        const length = $(this).val().length;
        charCountSpan.text(`${Math.min(length, 600)}/600`);
        $(this).css('height', 'auto').css('height', `${this.scrollHeight}px`);
    });

    console.log("editReplyComment 호출됨:", `#edit_reply_${rpIdx}`, `#fileInputEditReply_${rpIdx}`, `#thumb_box_wrap_edit_reply_${rpIdx}`, `#file_cover_edit_reply_${rpIdx}`);

    $(document).on("change", `#fileInputEditReply_${rpIdx}`, function(event) {
        const files = Array.from(event.target.files);
        const remainingSlots = 5 - allFiles.length;

        if (files.length > remainingSlots) {
            alert("최대 5개의 파일만 첨부할 수 있습니다.");
            return;
        }

        files.forEach(file => {
            allFiles.push({ id: fileIdCounter++, type: 'new', data: file });
        });

        renderAttachments();
        
         // `textarea` 내용에 파일명이 포함되지 않도록 정리
    const textareaContent = $(`#editReplyTextArea_${rpIdx}`).val().trim();
    $(`#editReplyTextArea_${rpIdx}`).val(textareaContent);  // 불필요한 텍스트 초기화

    });

    $(document).on("click", ".remove_img, .btn_fine_del", function() {
        const fileId = $(this).closest('[data-file-id]').data('file-id');
        const fileIndex = allFiles.findIndex(fileObj => fileObj.id === fileId);

        if (fileIndex !== -1) {
            const fileObj = allFiles[fileIndex];
            if (fileObj.type === 'existing') {
                deletedFiles.push({ ...fileObj.data, action: 'delete' });
            }
            allFiles.splice(fileIndex, 1);
        }

        renderAttachments();
    });

    $(`#submitEditReply_${rpIdx}`).on('click', function () {
        const textareaContent = $(`#editReplyTextArea_${rpIdx}`).val().trim();
        const updatedContent = rpPIdx === 0 ? textareaContent.replace(tagContent, '') : `${tagContent}${textareaContent}`;
    
        if (textareaContent) {
            submitReplyEdit(rpIdx, updatedContent, userIdx, userName, rpPIdx, rpGIdx, allFiles, deletedFiles);
        } else {
            alert('내용을 입력해주세요.');
        }
    });

    $(`#cancelEditReply_${rpIdx}`).on('click', function () {
        $(`#edit_reply_${rpIdx}`).remove();
        commentContentDiv.show();
    });
}


function initializeFileUpload(containerSelector, fileInputSelector, thumbBoxWrapSelector, fileCoverSelector) {
    const maxFiles = 5;

    // 파일 버튼 클릭 시 파일 선택 창 열기
    // $(containerSelector).on("click", ".cmt_pic_wrap, .cmt_pic_wrap_reply, .cmt_pic_wrap_edit", function () {
    //     $(fileInputSelector).click();
    // });

    // 파일 버튼 클릭 시 파일 선택 창 열기 (이벤트 위임 사용)
    // $(document).on("click", `${containerSelector} .cmt_pic_wrap, ${containerSelector} .cmt_pic_wrap_reply, ${containerSelector} .cmt_pic_wrap_edit`, function () {

    //     console.log("파일 선택 버튼이 클릭되었습니다."); // 선택 여부 확인
    //     console.log("containerSelector:", containerSelector); // containerSelector 확인
    //     console.log("fileInputSelector:", fileInputSelector); // fileInputSelector 확인


    //     $(this).closest(containerSelector).find(fileInputSelector).trigger('click');
    // });

    // 각 파일 첨부 버튼에 클릭 이벤트를 중복 없이 한 번만 등록
    $(document).off("click", ".cmt_pic_wrap, .cmt_pic_wrap_reply, .cmt_pic_wrap_edit, .cmt_pic_wrap_edit_reply");
    $(document).on("click", ".cmt_pic_wrap, .cmt_pic_wrap_reply, .cmt_pic_wrap_edit, .cmt_pic_wrap_edit_reply", function () {
        const containerSelector = $(this).closest('.edit_write_wrap, .edit_reply_wrap, #comment_write, #reply_write');
        const fileInput = containerSelector.find('input[type="file"]');

        // 중복 방지를 위해 클릭 이벤트가 호출될 때마다 확인 로그를 남기기
        console.log(`이벤트 발생 컨테이너: ${containerSelector.attr('id')}`);
        console.log(`파일 선택기: ${fileInput.attr('id')}`);

        // 파일 선택기 클릭 이벤트 트리거
        fileInput.trigger('click');
    });

    // 파일 선택 시 이벤트 처리
    $(fileInputSelector).on("change", function (event) {
        console.log("파일이 선택되었습니다."); // 파일 선택 확인
        const files = Array.from(event.target.files);
        const $thumbBoxWrap = $(thumbBoxWrapSelector).empty(); // 기존 이미지를 초기화
        const $fileCover = $(fileCoverSelector).empty(); // 기존 파일 리스트 초기화

        // 파일 개수 제한 확인
        if (files.length > maxFiles) {
            alert("최대 5개의 파일만 첨부할 수 있습니다.");
            return;
        }

        files.forEach(function (file) {
            if (file.type.startsWith("image/")) {
                // 이미지 파일 처리
                const $thumbBox = $(`
                    <div class="thumb_box">
                        <div class="img_cover">
                            <span class="thumbnail"><img src="" alt="첨부 이미지" class="thumbnail-img"/></span>
                            <button class="remove_img"><img src="/images/close.svg"></button>
                        </div>
                    </div>
                `);

                const reader = new FileReader();
                reader.onload = function (e) {
                    $thumbBox.find(".thumbnail-img").attr("src", e.target.result);
                };
                reader.readAsDataURL(file);

                $thumbBox.find(".remove_img").on("click", function () {
                    $thumbBox.remove();
                    if ($thumbBoxWrap.find(".thumb_box").length === 0) {
                        $thumbBoxWrap.hide();
                    }
                });

                $thumbBoxWrap.append($thumbBox);
                $thumbBoxWrap.show();
            } else {
                // 이미지 외 파일 처리
                const $fileItem = $(`
                    <div class="cmt_fileList">
                        <div>
                            <span><img src="/images/folder.svg"></span>
                            <span class="fine_name">
                                <i class="file_name_img"></i>
                                <button type="button" class="file_name_text">${file.name}</button>
                            </span>
                            <span class="file_size">(${(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button class="btn_fine_del"><img src="/images/close_black.svg"></button>
                    </div>
                `);

                $fileItem.find(".btn_fine_del").on("click", function () {
                    $fileItem.remove();
                    if ($fileCover.find(".cmt_fileList").length === 0) {
                        $fileCover.hide();
                    }
                });

                $fileCover.append($fileItem);
                $fileCover.show();
            }
        });
    });
}


// 댓글 입력창 글자 수 제한 및 자동 높이 조절
$(document).on('input', '.cmt_textarea textarea', function () {
    const maxChars = 600;
    const currentLength = $(this).val().length;

    // 글자 수 제한
    if (currentLength > maxChars) {
        $(this).val($(this).val().substring(0, maxChars));
        alert("최대 600자까지 입력 가능합니다.");
    }

    // 글자 수 표시 업데이트
    const charCountSpan = $(this).closest('.cmt_write').find('.cmt_reg span');
    charCountSpan.text(`${Math.min(currentLength, maxChars)}/${maxChars}`);

    // 자동 높이 조절
    $(this).css('height', 'auto');
    $(this).css('height', `${this.scrollHeight}px`);
});


$(function () {

    fetchDetailData(function () {
        // fetchDetailData 호출 후 데이터가 로드되면 fetchCommentData 실행
        fetchCommentData();
        renderComment(); // 여기서 postDetail 사용 가능
    });

    // 댓글 작성 시 파일 첨부 초기화
    initializeFileUpload(
        '#comment_write',           // 댓글 작성창의 컨테이너
        '#fileInputComment',        // 댓글 작성창의 파일 입력 필드
        '.thumb_box_wrap',          // 댓글 작성창의 이미지 미리보기 영역
        '.file_cover'               // 댓글 작성창의 일반 파일 첨부 영역
    );


    $('.confirmDeleteBtn').on('click', function () {
        $('.drop_content').toggle();
    });

   // 수정 버튼 클릭 시 cmt_drop 메뉴 토글
    $(document).on('click', '.cmt_modify_btn', function () {
        const dropdownMenu = $(this).closest('.cmt_item').find('.cmt_drop');
        
        // 다른 열린 메뉴를 모두 닫고 현재 클릭한 메뉴만 토글
        $('.cmt_drop').not(dropdownMenu).hide();
        dropdownMenu.toggle();
    });

    // 수정 또는 삭제 버튼 클릭 시 메뉴 닫기
    $(document).on('click', '.cmt_modify, .cmt_delete', function () {
        $(this).closest('.cmt_drop').hide(); // 현재 열린 cmt_drop 메뉴 닫기
    });


    // 답글의 cmt_more 버튼 클릭 시 cmt_reply_drop 메뉴 토글
    $(document).on('click', '.cmt_more button', function () {
        const dropdownMenu = $(this).closest('.cmt_reply_item').find('.cmt_reply_drop');
        
        // 다른 열린 메뉴를 모두 닫고 현재 클릭한 메뉴만 토글
        $('.cmt_reply_drop').not(dropdownMenu).hide();
        dropdownMenu.toggle();
    });

    // 답글의 수정 또는 삭제 버튼 클릭 시 메뉴 닫기
    $(document).on('click', '.reply_modify, .cmt_delete', function () {
        $(this).closest('.cmt_reply_drop').hide(); // 현재 열린 cmt_reply_drop 메뉴 닫기
    });


    // 파일 다운로드
    $(document).on('click', '.file-down-btn', downloadFile);

    // 파일 목록 열기 토글
    $(document).on('click', '.toggle-file-wrap', function () {
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

    // 답글 버튼 데이터 저장
    $(document).on('click', '.reply_btn button', function () {
        const g_idx = $(this).data('g-idx'); // 상위 댓글의 post_idx 가져오기
        replyOn(this); // 답글 작성창 열기
        $('#submitReply').data('g-idx', g_idx); // submitReply 버튼에 저장

        // 저장된 데이터 확인
        console.log('Stored g-idx on #submitReply:', $('#submitReply').data('g-idx'));

    });

    // 태그 답글 데이터 저장
    $(document).on('click', '.sub_reply_btn button', function () {
        const p_idx = $(this).data('p-idx'); // 태그 댓글의 parent idx 가져오기
        const g_idx = $(this).data('g-idx'); // 태그 댓글의 group idx 가져오기
        const userName = $(this).data('user-name'); // 태그 댓글의 user_name 가져오기
        console.log('sub___reply_btn!!!!!!', p_idx);

        replyOn(this); // 답글 작성창 열기

        $('#submitReply').data('p-idx', p_idx); // submitReply 버튼에 저장
        $('#submitReply').data('g-idx', g_idx); // submitReply 버튼에 저장
        $('#submitReply').data('userName', userName); // submitReply 버튼에 저장

        // 저장된 데이터 확인
        console.log('Stored g-idx on #submitReply:', $('#submitReply').data('p-idx'));

    });

    // 수정 버튼 클릭 시 게시글 수정 페이지로 이동
    $('.drop_content').on('click', '.modify-btn', function() {
   
        const post_idx = $(this).data('p-idx');

        if(post_idx) {
             window.location.href = `/postUpdate.html?id=${post_idx}`;
        } else {
            console.error('post_idx 찾을 수 없습니다.');
        }
    });

    // 삭제 버튼 클릭 시 게시글 삭제
    $('.drop_content').on('click', '.delete-btn', deletePost);

    // 게시글 개별 삭제 함수
    function deletePost() {
        const post_idx = $(this).data('post-idx');
        const user_idx = $(this).data('user-idx');
        deletePosts([ { post_idx : post_idx, user_idx: user_idx } ]);
    }

    // 게시글 개별 및 다중 삭제 요청 함수
    function deletePosts(posts) {

        const board_idx = localStorage.getItem('board_idx');

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
                    window.location.href = `/postList.html?board_idx=${board_idx}`;
                });
            },
            error : function(e) {
                console.log(e);
                console.log("error :: 삭제 에러");
            }
        });
    }



    // 최상위 댓글 등록
    $(document).on('click', '#submitComment', function (event) {
        event.preventDefault(); // 기본 제출 동작 방지

        // 댓글 내용 가져오기
        const content = $('#commentTextArea').val().trim();

        const formData = new FormData();
        formData.append('post_idx', pidx);
        formData.append('content', content);

        // 파일 추가
        //const commentFiles = $('#fileInputComment')[0].files;

        const commentFiles = Array.from($('#fileInputComment')[0].files);

        // 이미지 파일 먼저 추가
        let fileIndex = 0;
        commentFiles.filter(file => file.type.startsWith('image/')).forEach(file => {
                formData.append(`files[${fileIndex}][attribute]`, '5'); // 이미지 파일에 attribute 5
                formData.append(`files[${fileIndex}][action]`, 'add');
                formData.append(`files[${fileIndex}][file]`, file);
                fileIndex++;
            });

            // 이미지가 아닌 파일 추가
            commentFiles.filter(file => !file.type.startsWith('image/')).forEach(file => {
                formData.append(`files[${fileIndex}][attribute]`, '6'); // 이미지 외 파일에 attribute 6
                formData.append(`files[${fileIndex}][action]`, 'add');
                formData.append(`files[${fileIndex}][file]`, file);
                fileIndex++;
            });

        // FormData 내용 콘솔에 출력
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        //AJAX 요청 설정
        $.ajax({
            url: `${defaultUrl}/with/comment_add`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${atoken}`
            },
            data: formData,
            contentType: false,
            processData: false,
            success: function (response) {
                // 댓글 추가 성공 시 처리 (예: 화면에 댓글 추가, 입력창 비우기)
                alert('댓글이 등록되었습니다.');
                $('#commentTextArea').val(''); // 입력창 초기화
                $('#fileInputComment').val(''); // 파일 입력 필드 초기화
                $('.thumb_box_wrap').empty(); // 이미지 미리보기 영역 초기화
                $('.file_cover').empty(); // 파일 리스트 영역 초기화
                // 댓글 목록 다시 불러오기
                fetchCommentData();
            },
            error: function (error) {
                console.error("댓글 등록 실패:", error);
                alert("댓글 등록에 실패했습니다.");
            }
        });

    });


// 답글 등록
$(document).on('click', '#submitReply', function (e) {
    e.preventDefault();

    let replyContent = $('#repplyTextArea').val().trim();
    const depth = 2;
    const g_idx = $(this).data('g-idx'); // 상위 댓글의 g-idx 가져오기
    let p_idx = $(this).data('p-idx');

    p_idx == null ? p_idx = 0 : p_idx;

    const userName = $(this).data('userName');
    if (userName) {
        replyContent = `<p class="user-tag">@${userName}</p>` + replyContent;
    }

    // 파일명이 포함된 경우 이를 제거하는 정규식을 사용하여 파일명을 제거
    replyContent = replyContent.replace(/<span class="fine_name">.*?<\/span>/g, '').trim();

    const formData = new FormData();

    formData.append('post_idx', pidx);
    formData.append('content', replyContent);
    formData.append('depth', depth);
    formData.append('g_idx', g_idx);
    formData.append('p_idx', p_idx);

    // 파일 추가
    const replyFiles = Array.from($('#fileInputReply')[0].files);

    // 이미지 파일 먼저 추가
    let fileIndex = 0;
    replyFiles.filter(file => file.type.startsWith('image/')).forEach(file => {
        formData.append(`files[${fileIndex}][attribute]`, '5'); // 이미지 파일에 '5' 속성 추가
        formData.append(`files[${fileIndex}][action]`, 'add');
        formData.append(`files[${fileIndex}][file]`, file);
        fileIndex++;
    });

    // 이미지가 아닌 파일 추가
    replyFiles.filter(file => !file.type.startsWith('image/')).forEach(file => {
        formData.append(`files[${fileIndex}][attribute]`, '6'); // 이미지 외 파일에 '6' 속성 추가
        formData.append(`files[${fileIndex}][action]`, 'add');
        formData.append(`files[${fileIndex}][file]`, file);
        fileIndex++;
    });

    // FormData 내용 콘솔에 출력
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }

    // AJAX 요청 설정
    $.ajax({
        url: `${defaultUrl}/with/comment_add`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${atoken}`
        },
        data: formData,
        contentType: false,
        processData: false,
        success: function (response) {
            console.log(response);
            alert('댓글이 등록되었습니다.');

            // 답글 작성창 초기화: reply_write 요소 및 관련 필드 제거
            $('#reply_write').remove();
            $('#fileInputReply').val(''); // 파일 입력 필드 초기화
            $('.thumb_box_wrap_reply').empty(); // 이미지 미리보기 영역 초기화
            $('.file_cover_reply').empty(); // 파일 리스트 영역 초기화

            // 댓글 목록 다시 불러오기
            fetchCommentData();
        },
        error: function (error) {
            console.error("댓글 등록 실패:", error);
            alert("댓글 등록에 실패했습니다.");
        }
    });
});


// 목록 이동
$('.postListBtn').on('click', function() {

    const board_idx = postDetail.board_idx;

    if(postDetail.board_type === 'L') {
        window.location.href = `/postList.html?board_idx=${board_idx}`;
    } else {
        window.location.href = `/albumList.html?board_idx=${board_idx}`;
    }
});

// 최상위로 이동

$('.goTop').on('click', function () {
    console.log(this);
    $('#content').animate({ scrollTop: 0 }, 'slow');
});


    // // 답글 등록
    // $(document).on('click', '#submitReply', function (e) {
    //     e.preventDefault();

    //     let replyContent = $('#repplyTextArea').val().trim();
    //     const depth = 2;
    //     const g_idx = $(this).data('g-idx'); // 상위 댓글의 g-idx 가져오기
    //     let p_idx = $(this).data('p-idx');

    //     p_idx == null ? p_idx = 0 : p_idx;

    //     const userName = $(this).data('userName');
    //     if (userName) {
    //         replyContent = `<p class="user-tag">@${userName}</p>` + replyContent
    //     }

    //     const formData = new FormData();

    //     formData.append('post_idx', pidx);
    //     formData.append('content', replyContent);
    //     formData.append('depth', depth);
    //     formData.append('g_idx', g_idx);
    //     formData.append('p_idx', p_idx);


    //     // FormData 내용 콘솔에 출력
    //     for (let [key, value] of formData.entries()) {
    //         console.log(`${key}: ${value}`);
    //     }

    //     //AJAX 요청 설정
    //     $.ajax({
    //         url: `${defaultUrl}/with/comment_add`,
    //         method: 'POST',
    //         headers: {
    //             'Authorization': `Bearer ${atoken}`
    //         },
    //         data: formData,
    //         contentType: false,
    //         processData: false,
    //         success: function (response) {
    //             console.log(response);
    //             // 댓글 추가 성공 시 처리 (예: 화면에 댓글 추가, 입력창 비우기)
    //             alert('댓글이 등록되었습니다.');


               
    //             // 답글 작성창 초기화: reply_write 요소 및 관련 필드 제거
    //             $('#reply_write').remove();
    //             $('#fileInputReply').val(''); // 파일 입력 필드 초기화
    //             $('.thumb_box_wrap_reply').empty(); // 이미지 미리보기 영역 초기화
    //             $('.file_cover_reply').empty(); // 파일 리스트 영역 초기화

    //             // 댓글 목록 다시 불러오기
    //             fetchCommentData();
    //         },
    //         error: function (error) {
    //             console.error("댓글 등록 실패:", error);
    //             alert("댓글 등록에 실패했습니다.");
    //         }
    //     });

    // });


    //     const maxFiles = 5;

    //     // 파일 버튼 클릭 시 파일 선택 창 열기
    //     $("#fileButton").on("click", function () {
    //         $("#fileInputComment").click();
    //       });

    //       // 파일 선택 시 이벤트 처리
    //   $("#fileInputComment").on("change", function (event) {
    //     const files = Array.from(event.target.files);

    //     console.log("선택된 파일 정보:", files); // 파일 정보 콘솔에 출력

    //     const $thumbBoxWrap = $(".thumb_box_wrap").empty(); // 기존 이미지를 초기화
    //     const $fileCover = $(".file_cover").empty(); // 기존 파일 리스트 초기화

    //     // 현재 첨부된 파일 개수 확인
    //     const currentFileCount = $thumbBoxWrap.find(".thumb_box").length + 
    //                              $fileCover.find(".cmt_fileList").length;

    //     if (currentFileCount + files.length > maxFiles) {
    //       alert("최대 5개의 파일만 첨부할 수 있습니다.");
    //       return;
    //     }

    //     files.forEach(function (file) {
    //       if (file.type.startsWith("image/")) {
    //         // 이미지 파일일 경우 thumb_box_wrap에 추가
    //         const $thumbBox = $(`
    //           <div class="thumb_box">
    //             <div class="img_cover">
    //               <span class="thumbnail"><img src="" alt="첨부 이미지" class="thumbnail-img" /></span>
    //               <button class="remove_img"><img src="/images/close.svg"></button>
    //             </div>
    //           </div>
    //         `);

    //         // 이미지 파일 URL 설정
    //         const reader = new FileReader();
    //         reader.onload = function (e) {
    //           $thumbBox.find(".thumbnail-img").attr("src", e.target.result);
    //         };
    //         reader.readAsDataURL(file);

    //         // 이미지 제거 버튼 클릭 시 삭제
    //         $thumbBox.find(".remove_img").on("click", function () {
    //           $thumbBox.remove();
    //           if ($thumbBoxWrap.find(".thumb_box").length === 0) {
    //             $thumbBoxWrap.hide(); // 이미지가 모두 삭제되면 숨기기
    //         }
    //         });

    //         $thumbBoxWrap.append($thumbBox);
    //         $thumbBoxWrap.show();
    //       } else {
    //         // 이미지 외 파일일 경우 file_cover에 추가
    //         const $fileItem = $(`
    //           <div class="cmt_fileList">
    //             <div>
    //               <span><img src="/images/folder.svg"></span>
    //               <span class="fine_name">
    //                 <i class="file_name_img"></i>
    //                 <button type="button" class="file_name_text">${file.name}</button>
    //               </span>
    //               <span class="file_size">(${(file.size / 1024).toFixed(1)} KB)</span>
    //             </div>
    //             <button class="btn_fine_del"><img src="/images/close_black.svg"></button>
    //           </div>
    //         `);

    //         // 파일 제거 버튼 클릭 시 삭제
    //         $fileItem.find(".btn_fine_del").on("click", function () {
    //           $fileItem.remove();
    //           if ($fileCover.find(".cmt_fileList").length === 0) {
    //             $fileCover.hide(); // 모든 파일이 삭제되면 숨기기
    //         }
    //         });

    //         $fileCover.append($fileItem);
    //         $fileCover.show();
    //       }
    //     });
    //   });

});

