// 경로
const defaultUrl = "http://safe.withfirst.com:28888";

// 토큰
const rtoken = getCookieValue('refreshToken');
const atoken = localStorage.getItem('accessToken');
const bidx = localStorage.getItem('board_idx');

let singleFile = []; // 단일 파일 담을 배열
let multiFilesInput = {}; // ol_idx를 키로 하는 객체
let filesArray = []; // 파일 배열
let editor;

// 전역 변수를 객체로 묶어 관리
const state = {
    options: [],
    uploadedFileIds: [],
    filesArray: [],
    group_idx: null
};

// 게시판 디테일 정보 서버에서 받아오기
function fetchBoardDetailData() {
    $.ajax({
        url: defaultUrl + `/with/board_detail?bidx=${bidx}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${atoken}`,
        },
        success: function (response) {
            console.log('옵션 데이터 조회 성공', response);
            const boardDeatail = response.data;
            // options와 group_idx를 추출해 state에 할당
            state.options = boardDeatail.options;
            state.group_idx = boardDeatail.group_idx;
            renderModules(state.options); // options 기반으로 모듈 렌더링		
        },
        error: function (e) {
            console.log('error :: 옵션 조회 에러', e);
        }
    });
}

// options 데이터를 기반으로 동적으로 모듈을 렌더링하는 함수
function renderModules(options) {

    const moduleWrap = $('.module_wrap');   // 모듈들이 들어갈 컨테이너
    moduleWrap.empty(); // 기존의 모든 모듈을 비우기

    // 게시글 비공개 설정 모듈 (조건 없이 항상 렌더링)
    const visibilityModule = `
        <div class="modlue_item typeHide">
            <input type="checkbox" id="visibleCheckbox" class="module_visible">
            <label for="visibleCheckbox">게시글 비공개</label>
        </div>
    `;
    moduleWrap.append(visibilityModule);

    // 옵션별 모듈 생성
    options.forEach((option, index) => {
        let moduleElement;

        const requiredClass = option.required === 'Y' ? 'required' : ''; // required 값에 따라 클래스 결정

        // ol_type에 따라 필요한 모듈을 생성
        switch (option.ol_type) {

            // 드롭다운 모듈
            case 'dropdown':
                moduleElement = `
                    <div class="modlue_item typeDropdown">
                    <h5 class="module_name ${requiredClass}">${option.ol_name}</h5>
                        <select id="dropdown_${index}">
                            ${option.ol_value.map(value => `<option value="${value.ol_value}">${value.ol_value}</option>`).join('')}
                        </select>
                    </div>
                    `;
                break;

            // 데이터 입력 필드 모듈
            case 'dataInput':
                moduleElement = `
                    <div class="modlue_item typeInput">
                        <h5 class="module_name ${requiredClass}">${option.ol_name}</h5>
                        <input type="text" id="dataInput_${index}" class="module_input">
                    </div>
                    `;
                break;

            // 날짜 입력 필드 모듈
            case 'dateInput':
                moduleElement = `
                    <div class="modlue_item typeDate">
                        <h5 class="module_name ${requiredClass}">${option.ol_name}</h5>
                        <input type="date" id="dateInput_${index}" class="module_date">
                    </div>
                    `;
                break;

            // 멀티 파일 모듈
            case 'files':
                moduleElement = `
                    <div class="modlue_item typeMultiFiles">
                        <h5 class="module_name ${requiredClass}">${option.ol_name}</h5>
                        <div class="file_attach_wrap">
                            <div class="file_attach_btn">
                                <div>
                                    <input type="file" id="multiFileInput_${index}" class="module_mutifiles" multiple style="display: none;" data-ol_idx="${option.ol_idx}">
                                    <button id="multiFileBtn_${index}">파일첨부</button>
                                    <button id="deleteAllBtn_${index}" style="display: none;">전체삭제</button>
                                </div>
                                <p class="total_volume">첨부파일 <em>0</em>개 (0.0KB)</p>
                            </div>
                            <div class="file_wrap">
                                <table>
                                    <thead>
                                        <th class="col-1"></th>
                                        <th>파일명</th>
                                        <th class="text-right">용량</th>
                                        <th></th>
                                    </thead>
                                    <tbody id="fileList_${index}"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    `;
                break;

            // 전체 파일 모듈
            case 'file':
                moduleElement = `
                    <div class="modlue_item typeFile">
                        <h5 class="module_name ${requiredClass}">${option.ol_name}</h5>
                        <div class="file_attach_wrap">
                            <div class="file_attach_btn">
                              <div>
                                    <input type="file" id="fileInput_${index}" class="module_file" style="display: none;">
                                    <button id="fileBtn_${index}" class="fileUploadBtn">파일첨부</button>
                                </div>
                            </div>
                            <div id="fileInfoWrap_${index}" class="fileInfoWrap" style="display: none;">
                                <div class="fileInfoContent">
                                    <div class="d-flex align-items-center">
                                        <span class="folder_img"><img src="/images/folder.svg"></span>
                                        <p class="file_name"></p>
                                    </div>
                                    <span class="file_size"></span>
                                </div>
                                <button class="file_delete_Btn"><img src="/images/trash.svg"></button>
                            </div>
                        </div>
                    </div>
                    `;
                break;

            // 이미지 전용 파일 모듈
            case 'file_img':
                moduleElement = `
                    <div class="modlue_item typeFile">
                        <h5 class="module_name ${requiredClass}">${option.ol_name}</h5>
                        <div class="file_attach_wrap">
                            <div class="file_attach_btn">
                                <div>
                                    <input type="file" id="fileImgInput_${index}" class="module_file" accept="image/*" style="display: none;">
                                    <button id="fileImgBtn_${index}" class="fileUploadBtn">파일 첨부</button>
                                </div>
                            </div>
                            <div id="fileInfoWrap_${index}" class="fileInfoWrap" style="display: none;">
                                <div class="fileInfoContent">
                                    <div class="d-flex align-items-center">
                                        <span class="folder_img"><img src="/images/folder.svg"></span>
                                        <p class="file_name"></p>
                                    </div>
                                    <span class="file_size"></span>
                                </div>
                                <button class="file_delete_Btn"><img src="/images/trash.svg"></button>
                            </div>
                        </div>
                    </div>
                    `;
                break;

            // 비디오 전용 파일 모듈
            case 'file_video':
                moduleElement = `
                    <div class="modlue_item typeFile">
                        <h5 class="module_name ${requiredClass}">${option.ol_name}</h5>
                        <div class="file_attach_wrap">
                            <div class="file_attach_btn">
                                <div>
                                    <input type="file" id="fileVideoInput_${index}" class="module_file" accept="video/*" style="display: none;">
                                    <button id="fileVideoBtn_${index}" class="fileUploadBtn">파일 첨부</button>
                                </div>
                            </div>
                            <div id="fileInfoWrap_${index}" class="fileInfoWrap" style="display: none;">
                                <div class="fileInfoContent">
                                    <div class="d-flex align-items-center">
                                        <span class="folder_img"><img src="/images/folder.svg"></span>
                                        <p class="file_name"></p>
                                    </div>
                                    <span class="file_size"></span>
                                </div>
                                <button class="file_delete_Btn"><img src="/images/trash.svg"></button>
                            </div>
                        </div>
                    </div>
                    `;
                break;

            // 텍스트 영역 모듈
            case 'textArea': // 텍스트 영역 모듈
                moduleElement = `
                    <div class="modlue_item typeTextArea">
                        <h5 class="module_name ${requiredClass}">${option.ol_name}</h5>
                        <textarea id="textArea_${index}" class="module_textArea"></textarea>
                    </div>
                    `;
                break;

            // 에디터 영역 모듈
            case 'editor':
                moduleElement = `
                    <div class="modlue_item typeEditor">
                        <h5 class="module_name ${requiredClass}">${option.ol_name}</h5>
                        <div id="editor_${index}"></div>
                    </div>
                    `;
                break;

            // 그 외
            default:
                moduleElement = `<div><p>알 수 없는 모듈 유형: ${option.ol_type}</p></div>`;
        }

        // 생성된 모듈을 컨테이너에 추가
        moduleWrap.append(moduleElement);

    });

    // 에디터 모듈 초기화 (모듈이 렌더링된 후 실행)
    options.forEach((option, index) => {
        if (option.ol_type === 'editor') {
            setTimeout(() => {
                initializeEditor(`#editor_${index}`);
            }, 0); // DOM이 완전히 렌더링된 후에 초기화
        }
    });


    // type_img 일 경우 허용 가능한 이미지 확장자
    const allowedImageTypes = [
        'image/jpeg', 'image/png', 'image/gif',
        'image/bmp', 'image/webp', 'image/svg+xml',
        'image/tiff', 'image/x-icon'
    ];

    // 각 파일 모듈 설정 (필요한 기능 세팅)
    options.forEach((option, index) => {

        if (option.ol_type === 'files') {
            initializeMultiFileUpload(`#multiFileInput_${index}`, `#multiFileBtn_${index}`, `#deleteAllBtn_${index}`, `#fileList_${index}`);
        }

        if (option.ol_type === 'file') {
            initializeSingleFileUpload(`#fileInput_${index}`, `#fileBtn_${index}`, `#fileInfoWrap_${index}`);
        }

        if (option.ol_type === 'file_img') {
            initializeSingleFileUpload(`#fileImgInput_${index}`, `#fileImgBtn_${index}`, `#fileInfoWrap_${index}`, allowedImageTypes);
        }

        if (option.ol_type === 'file_video') {
            initializeSingleFileUpload(`#fileVideoInput_${index}`, `#fileVideoBtn_${index}`, `#fileInfoWrap_${index}`, ['video/mp4', 'video/avi']);
        }
    });
}

// 에디터 설정 함수
function initializeEditor(editorSelector) {
    const editorElement = document.querySelector(editorSelector);

    if (editorElement) {
        editor = new toastui.Editor({
            el: editorElement,
            height: '600px',
            initialEditType: 'wysiwyg',
            hideModeSwitch: true,
            hooks: {
                addImageBlobHook: (blob, callback) => {
                    const formData = new FormData();
                    formData.append('file', blob);            
                    $.ajax({
                        url: `${defaultUrl}/with/temp_editor_add`,
                        headers: {
                            'Authorization': `Bearer ${atoken}`
                        },
                        method : 'POST',
                        data: formData,                                                
                        contentType: false,
                        processData: false,                                        
                        success: function(res) {
                            console.log("에디터 데이터 확인:", res);
                            
                            // 이미지 URL에 서버 도메인 추가 (필요한 경우)
                            const imageUrl = 'http://' + res.path                                                        
                            callback(imageUrl, '이미지');
                        },
                        error: function(xhr, status, error) {
                            console.error('이미지 업로드 중 오류 발생:', error);
                            console.error('상태 코드:', xhr.status);
                            alert('이미지 업로드에 실패했습니다.');
                        }
                    });
                }
            }
        });
    } else {
        console.error(`에디터 요소를 찾을 수 없습니다: ${editorSelector}`);
    }
}

// 파일 모듈 설정 함수
function initializeMultiFileUpload(fileInputId, fileBtnId, deleteAllBtnId, fileListId) {
    const fileInput = $(fileInputId);
    const fileBtn = $(fileBtnId);
    const deleteAllBtn = $(deleteAllBtnId);
    const fileList = $(fileListId);
    const totalVolumeElement = $(fileBtnId).closest('.file_attach_wrap').find('.total_volume em');
    const totalVolumeText = $(fileBtnId).closest('.file_attach_wrap').find('.total_volume');
    const olIdx = $(fileInput).data('ol_idx'); // 파일 모듈의 고유 ID로 사용

    // 파일 저장 공간 초기화
    if (!multiFilesInput[olIdx]) {
        multiFilesInput[olIdx] = [];
    }

    // 파일 선택 창 오픈
    fileBtn.on('click', function () {
        fileInput.trigger('click');
    });

    // 파일 선택 후 배열에 저장
    fileInput.on('change', function (event) {
        const newFiles = Array.from(event.target.files);

        // 기존의 filesArray와 새로 선택된 newFiles 배열을 합쳐서 할당
        filesArray = [...filesArray, ...newFiles];

        newFiles.forEach((file) => {

            // 각 파일을 객체로 구성하여 배열에 추가
            multiFilesInput[olIdx].push({
                file: file,
                action: 'add',
                ol_idx: olIdx,
                attribute: '4'
            });
        });

        renderFileList(olIdx, fileList, deleteAllBtn);
        updateTotalVolume(olIdx, totalVolumeElement, totalVolumeText);
        fileInput.val('');
    });

    // 전체 삭제 버튼 클릭 시 실행
    deleteAllBtn.on('click', function () {
        multiFilesInput[olIdx] = [];
        renderFileList(olIdx, fileList, deleteAllBtn);
        updateTotalVolume(olIdx, totalVolumeElement, totalVolumeText);
    });
}

// 다중 파일 목록을 렌더링하는 함수
function renderFileList(olIdx, fileList, deleteAllBtn) {

    fileList.empty(); // 기존 목록 초기화

    multiFilesInput[olIdx].forEach((fileObj, index) => {

        console.log('파일오브제머야?', fileObj);
        const fileRow = $(`
            <tr>
                <td class="col-1">
                    <button class="remove-btn" data-index="${index}"><img src="/images/delete.svg"></button>
                </td>
                <td class="file-cell">${fileObj.file.name}</td>
                <td class="text-right">${(fileObj.file.size / 1024).toFixed(2)}KB</td>
                <td></td>
            </tr>
        `);

        fileRow.find('.remove-btn').on('click', function () {
            removeFile(olIdx, index, fileList, deleteAllBtn);
        });

        fileList.append(fileRow);

    });

    // 파일 목록이 존재할 때만 전체삭제 버튼 보이도록 설정
    deleteAllBtn.toggle(multiFilesInput[olIdx].length > 0);
}

// 파일 삭제 하는 함수
function removeFile(olIdx, index, fileList, deleteAllBtn) {
    multiFilesInput[olIdx].splice(index, 1);
    renderFileList(olIdx, fileList, deleteAllBtn);
    updateTotalVolume(olIdx);
}

// 파일 용량을 업데이트하는 함수
function updateTotalVolume(olIdx, totalVolumeElement, totalVolumeText) {
    const totalSize = multiFilesInput[olIdx].reduce((sum, fileObj) => sum + fileObj.file.size, 0);
    const totalCount = multiFilesInput[olIdx].length;

    totalVolumeElement.text(totalCount);
    totalVolumeText.html(`첨부파일 <em>${totalCount}</em>개 (${(totalSize / 1024).toFixed(2)}KB)`);
}

// 개별 파일 업로드
function initializeSingleFileUpload(fileInputId, fileBtnId, fileInfoWrapId, allowedTypes = []) {
    const fileInput = $(fileInputId);
    const fileBtn = $(fileBtnId);
    const fileInfoWrap = $(fileInfoWrapId); // 선택된 파일 정보가 표시 되는 영역
    const fileNameElement = fileInfoWrap.find('.file_name');
    const fileSizeElement = fileInfoWrap.find('.file_size');
    const deleteBtn = fileInfoWrap.find('.file_delete_Btn');

    // 파일 첨부 버튼 클릭 시 파일 선택 창 열기
    fileBtn.on('click', function () {
        fileInput.trigger('click'); // 숨겨진 파일 input 요소에 클릭 이벤트 발생
    });

    // 파일 선택 시 파일 정보 업데이트
    fileInput.on('change', function (event) {
        const selectedFile = event.target.files[0]; // 첫 번째 선택한 파일

        // 파일 타입 체크
        if (selectedFile && allowedTypes.length > 0 && !allowedTypes.includes(selectedFile.type)) {

            Swal.fire({
                title: '경고',
                html: '허용되지 않는 파일 형식입니다. <br> 다시 선택해주세요.',
                icon: 'warning',
                confirmButtonText: '확인'
            });
            fileInput.val(''); // 잘못된 파일 선택시 input 초기화
            return;
        }

        if (selectedFile) {

            // 파일 정보 영역 나타나기
            fileInfoWrap.show();

            // 파일 이름 및 크기 업데이트
            fileNameElement.text(selectedFile.name);
            const fileSizeInKB = (selectedFile.size / 1024).toFixed(2) + 'KB';
            fileSizeElement.text(fileSizeInKB);

            // 파일 삭제 버튼 활성화 및 파일 제거 이벤트 추가
            deleteBtn.show().on('click', function () {
                // 영역 없애기
                fileInfoWrap.hide();
                fileInput.val(''); // 파일 input 초기화
                fileNameElement.text(''); // 파일 이름 초기화
                fileSizeElement.text(''); // 파일 크기 초기화
                $(this).hide(); // 삭제 버튼 숨기기
            });
        }
    });
}

// 입력된 모듈 데이터 값 수집하는 함수
function collectModuleData() {

    const collectedData = [];

    state.options.forEach((option, index) => {
        let value;
        let eachVal = false; // 파일일 경우 옵션 데이터 보내지 않기 위한 변수

        let file;

        switch (option.ol_type) {
            case 'dropdown':
                const selectedValue = $(`#dropdown_${index}`).val(); // 선택된 ol_value 값
                const selectedOption = option.ol_value.find(v => v.ol_value === selectedValue); // 선택된 값에 해당하는 옵션 객체 찾기

                if (selectedOption) {
                    value = selectedOption.ov_idx;
                } else {
                    value = null;
                }
                eachVal = true;
                break;

            case 'dataInput': // 여러 개의 텍스트 입력 필드
                value = $(`#dataInput_${index}`).val();
                eachVal = true;
                break;

            case 'dateInput': // 여러 개의 날짜 입력 필드
                value = $(`#dateInput_${index}`).val();
                eachVal = true;
                break;
            
            case 'editor': // 여러 개의 에디터 필드                
                value = editor.getHTML().replace(/&amp;/g, '&');
                console.log(value);                
                eachVal = true;
                break;

            // case 'files': // 다중 파일 입력 모듈
            // const specificFilesArray  = []; // 각 파일 모듈에 대한 파일 배열 생성
            // const specificFiles = $(`#multiFileInput_${index}`).get(0).files;

            // for (let i = 0; i < specificFiles.length; i++) {
            //     const file = specificFiles[i];
            //     const fileObj = {
            //         file: file,
            //         name: file.name,
            //         size: file.size,
            //         action: 'add',
            //         ol_idx: option.ol_idx,
            //         attribute: '4'
            //     };
            //     specificFilesArray.push(fileObj);
            // }

            // if (specificFilesArray.length > 0) {
            //     // ol_idx별로 파일 그룹화
            //     multiFilesInput[option.ol_idx] = specificFilesArray;
            // }
            // // // 모듈마다의 파일 리스트로 multiFilesInput에 추가
            // // multiFilesInput.push(...specificFileArray);
            // value = specificFilesArray.map(file => ({ name: file.name, size: file.size }));
            // break;

            case 'file': // 단일 파일 입력 모듈

                const singleFileInput = $(`#fileInput_${index}`).get(0);
                if (singleFileInput && singleFileInput.files.length > 0) {
                    file = singleFileInput.files[0];
                    singleFile.push({ file: file, action: 'add', ol_idx: option.ol_idx, attribute: '1' });
                    value = {
                        name: file.name,
                        size: file.size
                    }; // 단일 파일 수집
                } else {
                    value = null; // 파일이 없을 경우 null
                }
                break;

            case 'file_img': // 이미지 파일만 허용
                const imgFileInput = $(`#fileImgInput_${index}`).get(0);
                if (imgFileInput && imgFileInput.files.length > 0) {
                    file = imgFileInput.files[0];
                    singleFile.push({ file, action: 'add', ol_idx: option.ol_idx, attribute: '2' });
                    value = {
                        name: file.name,
                        size: file.size
                    };
                } else {
                    value = null;
                }
                break;

            case 'file_video': // 비디오 파일만 허용
                const videoFileInput = $(`#fileVideoInput_${index}`).get(0);
                if (videoFileInput && videoFileInput.files.length > 0) {
                    file = videoFileInput.files[0];
                    singleFile.push({ file, action: 'add', ol_idx: option.ol_idx, attribute: '3' });
                    value = {
                        name: file.name,
                        size: file.size
                    };
                } else {
                    value = null;
                }
                break;

            case 'textArea': // 텍스트 영역
                value = $(`#textArea_${index}`).val();
                break;

            case 'checkbox':
                value = $('#visibleCheckbox').is(':checked');
                break;

            default:
                value = null; // 알 수 없는 유형 처리
        }

        if (eachVal === true) {
            collectedData.push({
                ol_idx: option.ol_idx, // 옵션의 고유 식별자
                ol_type: option.ol_type, // 옵션 유형
                ol_value: value           // 수집된 값
            });
        }

        eachVal = false;
    });

    return collectedData; // 수집된 데이터 반환
}


$(function () {

    fetchBoardDetailData();

    $('#saveButton').on('click', function () {

        const moduleData = collectModuleData(); // 동적으로 생성된 모듈에서 값을 수집

        console.log('수집된 데이터:', moduleData);
        console.log('수집된 단일 파일 배열:', singleFile);
        console.log('수집된 멀티 파일 배열:', multiFilesInput);

        const p_seq = $('#visibleCheckbox').is(':checked') ? "N" : "Y";
        const p_notice = "N";

        const formData = new FormData();

        if (singleFile.length > 0) {
            singleFile.forEach((item, index) => {
                formData.append(`files[${index}][file]`, item.file);
                formData.append(`files[${index}][action]`, item.action);
                formData.append(`files[${index}][ol_idx]`, item.ol_idx);
                formData.append(`files[${index}][attribute]`, item.attribute);
            });
        }

        // 다중 파일 배열 추가
        if (multiFilesInput && Object.keys(multiFilesInput).length > 0) {
            let startIndex = singleFile.length;

            for (const [ol_idx, fileArray] of Object.entries(multiFilesInput)) {
                fileArray.forEach((item, index) => {
                    const formDataIndex = startIndex++;
                    formData.append(`files[${formDataIndex}][file]`, item.file);
                    formData.append(`files[${formDataIndex}][action]`, item.action);
                    formData.append(`files[${formDataIndex}][ol_idx]`, item.ol_idx);
                    formData.append(`files[${formDataIndex}][attribute]`, item.attribute);
                });
            }
        }

        formData.append('p_seq', p_seq);
        formData.append('p_notice', p_notice);
        formData.append('group_idx', state.group_idx);
        formData.append('board_idx', bidx);
        formData.append('option', JSON.stringify(moduleData));

        // FormData 내용 콘솔에 출력
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        $.ajax({
            url: defaultUrl + '/with/post_add',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                'Authorization': `Bearer ${atoken}`
            },
            success: function (response) {
                console.log('게시글 등록 응답:', response.data);
                Swal.fire({
                    title: '게시글 등록',
                    text: '게시글이 등록되었습니다.',
                    icon: 'success',
                    confirmButtonText: '확인'
                }).then(() => {
                    window.location.href = `/postList.html?board_idx=${bidx}`;  // 이전 board.html 페이지로 이동
                });
            },
            error: function (error) {
                console.error('게시글 등록 오류:', error.response ? error.response.data : error.message);
            }
        });
    });
});
