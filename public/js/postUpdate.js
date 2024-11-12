// 경로
const defaultUrl = "http://safe.withfirst.com:28888";

// 토큰
const rtoken = getCookieValue('refreshToken');
const atoken = localStorage.getItem('accessToken');
const bidx = localStorage.getItem('board_idx');
const urlParams = new URLSearchParams(window.location.search);
const pidx = urlParams.get('id');

// 전역 변수
let singleFile = []; // 단일 파일 담을 배열
let multiFilesInput = {}; // ol_idx를 키로 하는 객체
let filesArray = []; // 파일 배열
let editor;
const editorInstances = {};
const state = {
    options: [],
    uploadedFileIds: [],
    filesArray: [],
    group_idx: null
};

let boardDetail = [];

function fetchBoardDetailData() {
    $.ajax({
        url: defaultUrl + `/with/post_detail?bidx=${bidx}&pidx=${pidx}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${atoken}`,
        },
        success: function (response) {
            console.log('옵션 데이터 조회 성공', response);
            boardDetail = response.data;
            state.options = boardDetail.options;
            state.group_idx = boardDetail.group_idx;

            // 서버에 보낼 user_idx 로컬스토리지에 저장
            localStorage.setItem('user_idx', boardDetail.user_idx);

            // renderModules 완료 후 fillValues 실행
            renderModules(state.options);
            setTimeout(() => {
                fillValues(boardDetail.options);
            }, 0);
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
                                    <input type="file" id="fileInput_${index}"data-ol_idx="${option.ol_idx}" class="module_file" style="display: none;">
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
                                    <input type="file" id="fileImgInput_${index}" class="module_file" data-ol_idx="${option.ol_idx}" accept="image/*" style="display: none;">
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
                                    <input type="file" id="fileVideoInput_${index}" data-ol_idx="${option.ol_idx}" class="module_file" accept="video/*" style="display: none;">
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
            initializeMultiFileUpload(`#multiFileInput_${index}`, `#multiFileBtn_${index}`, `#deleteAllBtn_${index}`, `#fileList_${index}`, option.required === 'Y');
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

// 서버에서 받은 데이터로 값 채우는 함수
function fillValues(options) {
    options.forEach(option => {
        let selectedValue = option.selected_value;
        console.log("111111111111111111111111");
        
        console.log(option);
        console.log(option.sort_num);
        const index = option.sort_num-1; // sort_num을 0 기반 인덱스로 변환

        if (selectedValue === null) {
            selectedValue = '';
        }

        switch (option.ol_type) {
            case 'dropdown':
                // 드롭다운 메뉴의 선택된 값을 설정
                console.log(index + 'drop');
                $(`#dropdown_${index}`).val(selectedValue.value);
                break;

            case 'dataInput':
                // 텍스트 입력 필드의 값을 설정
                console.log(index + 'datainput');
                
                $(`#dataInput_${index}`).val(selectedValue.value);
                break;

            case 'dateInput':
                // 날짜 입력 필드의 값을 설정
                console.log(index + 'datee');
                $(`#dateInput_${index}`).val(selectedValue.value);
                break;

            case 'files':
                // 다중 파일 모듈에 파일 목록을 설정
                if (Array.isArray(selectedValue)) {
                    multiFilesInput[option.ol_idx] = selectedValue.map(file => ({
                        file: { name: file.o_f_name, size: parseFloat(file.f_size) * 1024 },
                        action: 'saved',
                        ol_idx: option.ol_idx,
                        attribute: '4',
                        fileInfo: file,
                        pof_idx: file.pof_idx
                    }));
                    // 설정 후 파일 목록 및 용량 업데이트
                    const fileListElement = $(`#fileList_${index}`);
                    const deleteAllBtn = $(`#deleteAllBtn_${index}`);
                    const totalVolumeElement = $(`#multiFileBtn_${index}`).closest('.file_attach_wrap').find('.total_volume em');
                    const totalVolumeText = $(`#multiFileBtn_${index}`).closest('.file_attach_wrap').find('.total_volume');

                    renderFileList(option.ol_idx, fileListElement, deleteAllBtn);
                    updateTotalVolume(option.ol_idx, totalVolumeElement, totalVolumeText);  // 초기 렌더링 시 용량 업데이트
                }
                break;


            case 'file':
                // 단일 파일 모듈에 파일 정보를 설정
                if (selectedValue && selectedValue.length > 0) {
                    const file = selectedValue[0];
                    const fileInfoWrap = $(`#fileInfoWrap_${index}`);
                    fileInfoWrap.show();
                    fileInfoWrap.find('.file_name').text(file.o_f_name);
                    fileInfoWrap.find('.file_size').text(file.f_size);

                    // 단일 파일을 singleFile 배열에 추가
                    singleFile.push({
                        file: { name: file.o_f_name, size: parseFloat(file.f_size) * 1024 },
                        action: 'saved',
                        ol_idx: option.ol_idx,
                        attribute: '1',
                        pof_idx: file.pof_idx // 여기서 pof_idx 포함
                    });
                }
                break;

            case 'file_img':
                // 이미지 전용 파일 모듈에 파일 정보를 설정
                if (selectedValue && selectedValue.length > 0) {
                    const file = selectedValue[0];
                    const fileInfoWrap = $(`#fileInfoWrap_${index}`);
                    fileInfoWrap.show();
                    fileInfoWrap.find('.file_name').text(file.o_f_name);
                    fileInfoWrap.find('.file_size').text(file.f_size);

                    // 이미지 파일을 singleFile 배열에 추가
                    singleFile.push({
                        file: { name: file.o_f_name, size: parseFloat(file.f_size) * 1024 },
                        action: 'saved',
                        ol_idx: option.ol_idx,
                        attribute: '2',
                        pof_idx: file.pof_idx // 여기서 pof_idx 포함
                    });
                }
                break;

            case 'file_video':
                // 비디오 전용 파일 모듈에 파일 정보를 설정
                if (selectedValue && selectedValue.length > 0) {
                    const file = selectedValue[0];
                    const fileInfoWrap = $(`#fileInfoWrap_${index}`);
                    fileInfoWrap.show();
                    fileInfoWrap.find('.file_name').text(file.o_f_name);
                    fileInfoWrap.find('.file_size').text(file.f_size);

                    // 비디오 파일을 singleFile 배열에 추가
                    singleFile.push({
                        file: { name: file.o_f_name, size: parseFloat(file.f_size) * 1024 },
                        action: 'saved',
                        ol_idx: option.ol_idx,
                        attribute: '3',
                        pof_idx: file.pof_idx // 여기서 pof_idx 포함
                    });
                }
                break;

            case 'textArea':
                // 텍스트 영역의 값을 설정
                console.log(index + 'textArea_');
                $(`#textArea_${index}`).val(selectedValue.value);
                break;

            case 'editor':
                // 에디터 인스턴스 저장
                    editorInstances[`editor_${index}`] = editor;
                                                
                try {
                    if (selectedValue.value) {
                        setEditorContent(index, selectedValue.value);
                    }
                } catch (error) {
                    console.error('에디터 내용 설정 중 오류 발생:', error);
                }
                break;

            default:
                console.log(`알 수 없는 모듈 유형: ${option.ol_type}`);
        }
    });
}

// 입력된 모듈 데이터 값 수집하는 함수
function collectModuleData() {

    const collectedData = [];
    let missingRequiredField = false; // 필수 항목 누락 여부

    state.options.forEach((option, index) => {
        const isRequired = option.required === 'Y';

        let value;
        let eachVal = false; // 파일일 경우 옵션 데이터 보내지 않기 위한 변수
        let file;
        let action = null;
        let opt_value = null;
        let opt_idx = option.selected_value
            ? (option.selected_value.pot_idx || option.selected_value.pos_idx || null)
            : null;
        const selectedValue = option.selected_value;

        switch (option.ol_type) {

            case 'dropdown':
                const selectedDropdownValue = $(`#dropdown_${index}`).val();
                const selectedOption = option.ol_value.find(v => v.ol_value === selectedDropdownValue);

                // `opt_value`에 `ov_idx`를 설정
                opt_value = selectedOption ? selectedOption.ov_idx : null;

                // 기존 선택된 값이 있는 경우 selectedValue의 ov_idx와 opt_value 비교
                if (selectedValue) {
                    // 기존 값과 현재 선택된 값이 다르면 'update'로 설정
                    action = opt_value !== selectedValue.ov_idx ? 'update' : null;
                } else if (opt_value) {
                    action = 'add';  // 기존 값이 없고 새로 선택된 경우 'add'
                }
                eachVal = true;
                break;

            case 'dataInput':
                opt_value = $(`#dataInput_${index}`).val();

                if (isRequired && !opt_value) {
                    Swal.fire('경고', `${option.ol_name}을(를) 선택해주세요.`, 'warning');
                    missingRequiredField = true;
                    return;
                }

                if (selectedValue) {
                    action = opt_value !== selectedValue.value ? (opt_value ? 'update' : 'delete') : null;
                } else if (opt_value) {
                    action = 'add';
                }
                eachVal = true;
                break;

            case 'dateInput':
                opt_value = $(`#dateInput_${index}`).val();
                if (isRequired && !opt_value) {
                    Swal.fire('경고', `${option.ol_name}을(를) 선택해주세요.`, 'warning');
                    missingRequiredField = true;
                    return;
                }
                if (selectedValue) {
                    action = opt_value !== selectedValue.value ? (opt_value ? 'update' : 'delete') : null;
                } else if (opt_value) {
                    action = 'add';
                }
                eachVal = true;
                break;

            case 'editor': // 여러 개의 에디터 필드        
                opt_value = editor.getHTML().replace(/&amp;/g, '&');
                // HTML 태그를 제거하고 순수 텍스트만 추출
                const plainText = opt_value.replace(/<[^>]*>/g, '').trim();
                console.log("opt_value", opt_value);
                
                if (isRequired && !plainText) {
                    Swal.fire('경고', `${option.ol_name}을(를) 선택해주세요.`, 'warning');
                    missingRequiredField = true;
                    return;
                }
                if (selectedValue) {
                    action = opt_value !== selectedValue.value ? (opt_value ? 'update' : 'delete') : null;
                } else if (opt_value) {
                    action = 'add';
                }                                                        
                eachVal = true;
                break;

            case 'files':
                // 멀티 파일 모듈의 필수 항목 여부 확인
                const fileList = multiFilesInput[option.ol_idx] || [];
                const nonDeletedFiles = fileList.filter(file => file.action !== 'delete');

                // 필수 항목일 때 파일이 없거나 모두 삭제된 상태면 경고 출력
                if (isRequired && nonDeletedFiles.length === 0) {
                    Swal.fire('경고', `${option.ol_name} 파일을 첨부해주세요.`, 'warning');
                    missingRequiredField = true;
                    return;
                }

                // files는 데이터로 수집하지 않음
                eachVal = true;
                break;

            case 'file': // 단일 파일 입력 모듈

                const singleFileInput = $(`#fileInput_${index}`).get(0);
                // 기존 파일이 있는지 확인
                const existingSingleFile = singleFile.find(f => f.ol_idx === option.ol_idx && f.action === 'saved');

                // 필수 체크: 기존 파일이 없고 새 파일도 선택되지 않은 경우
                if (isRequired && !existingSingleFile && (!singleFileInput || singleFileInput.files.length === 0)) {
                    Swal.fire('경고', `${option.ol_name} 파일을 첨부해주세요.`, 'warning');
                    missingRequiredField = true;
                    return;
                }

                if (singleFileInput && singleFileInput.files.length > 0) {
                    file = singleFileInput.files[0];

                    console.log('singleFileInput', singleFileInput);
                    console.log('singfileleFileInput', file);

                    // 기존 파일이 있는지 확인
                    const existingFileIndex = singleFile.findIndex(f => f.ol_idx === option.ol_idx && f.action === 'saved');

                    if (existingFileIndex !== -1) {
                        // 기존 파일이 있을 때, 새 파일을 `update`로 추가
                        singleFile[existingFileIndex] = {
                            file: file,
                            action: 'update',
                            ol_idx: option.ol_idx,
                            attribute: '1',
                            pof_idx: singleFile[existingFileIndex].pof_idx // 기존의 pof_idx 값을 유지
                        };
                    } else {
                        // 새로 추가된 파일은 `add`로 처리
                        singleFile.push({
                            file: file,
                            action: 'add',
                            ol_idx: option.ol_idx,
                            attribute: '1',
                        });
                    }
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

                // 기존 이미지 파일 확인
                const existingImgFile = singleFile.find(f => f.ol_idx === option.ol_idx && f.action === 'saved');


                if (isRequired && !existingImgFile && (!imgFileInput || imgFileInput.files.length === 0)) {
                    Swal.fire('경고', `${option.ol_name} 이미지를 첨부해주세요.`, 'warning');
                    missingRequiredField = true;
                    return;
                }

                if (imgFileInput && imgFileInput.files.length > 0) {
                    file = imgFileInput.files[0];

                    // 기존 파일이 있는지 확인
                    const existingFileIndex = singleFile.findIndex(f => f.ol_idx === option.ol_idx && f.action === 'saved');

                    if (existingFileIndex !== -1) {
                        singleFile[existingFileIndex] = {
                            file: file,
                            action: 'update',
                            ol_idx: option.ol_idx,
                            attribute: '2',
                            pof_idx: singleFile[existingFileIndex].pof_idx // 기존의 pof_idx 값을 유지
                        };
                    } else {
                        singleFile.push({
                            file: file,
                            action: 'add',
                            ol_idx: option.ol_idx,
                            attribute: '2',
                        });
                    }

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

                // 기존 비디오 파일 확인
                const existingVideoFile = singleFile.find(f => f.ol_idx === option.ol_idx && f.action === 'saved');


                if (isRequired && !existingVideoFile && (!videoFileInput || videoFileInput.files.length === 0)) {
                    Swal.fire('경고', `${option.ol_name} 비디오 파일을 첨부해주세요.`, 'warning');
                    missingRequiredField = true;
                    return;
                }

                if (videoFileInput && videoFileInput.files.length > 0) {
                    file = videoFileInput.files[0];

                    // 기존 파일이 있는지 확인
                    const existingFileIndex = singleFile.findIndex(f => f.ol_idx === option.ol_idx && f.action === 'saved');

                    if (existingFileIndex !== -1) {
                        singleFile[existingFileIndex] = {
                            file: file,
                            action: 'update',
                            ol_idx: option.ol_idx,
                            attribute: '3',
                            pof_idx: singleFile[existingFileIndex].pof_idx // 기존의 pof_idx 값을 유지
                        };
                    } else {
                        singleFile.push({
                            file: file,
                            action: 'add',
                            ol_idx: option.ol_idx,
                            attribute: '3',
                        });
                    }
                    // singleFile.push({ file, action: 'add', ol_idx: option.ol_idx, attribute: '3' });
                    value = {
                        name: file.name,
                        size: file.size
                    };
                } else {
                    value = null;
                }
                break;

            case 'textArea':
                opt_value = $(`#textArea_${index}`).val();

                // 필수 체크: 텍스트 영역이 비어 있는지 확인
                if (isRequired && !opt_value) {
                    Swal.fire('경고', `${option.ol_name}을(를) 입력해주세요.`, 'warning');
                    missingRequiredField = true;
                    return;
                }

                if (selectedValue) {
                    action = opt_value !== selectedValue.value ? (opt_value ? 'update' : 'delete') : null;
                } else if (opt_value) {
                    action = 'add';
                }
                eachVal = true;
                break;

            case 'checkbox':
                opt_value = $('#visibleCheckbox').is(':checked');

                // 필수 체크: 체크박스가 선택되어 있는지 확인
                if (isRequired && !opt_value) {
                    Swal.fire('경고', `${option.ol_name}을(를) 선택해주세요.`, 'warning');
                    missingRequiredField = true;
                    return;
                }


                if (option.selected_value?.value && opt_value !== option.selected_value.value) {
                    action = opt_value ? 'update' : 'delete';
                } else if (!option.selected_value && opt_value) {
                    action = 'add';
                }
                eachVal = true;
                break;
            default:
                value = null; // 알 수 없는 유형 처리
        }
        // `update` 또는 `delete`일 때만 opt_idx와 opt_value를 포함
        if (action === 'update' || action === 'delete') {
            collectedData.push({
                type: option.ol_type,
                ol_idx: option.ol_idx,
                opt_idx: opt_idx,
                opt_value: opt_value,
                action: action
            });

        } else if (action === 'add') {
            // `add`인 경우에는 opt_idx와 opt_value 없이 추가
            collectedData.push({
                type: option.ol_type,
                ol_idx: option.ol_idx,
                action: action
            });
        }
        eachVal = false;
    });

    if (missingRequiredField) {
        return null; // 필수값 누락 시 데이터 수집을 중단
    }

    return collectedData; // 수집된 데이터 반환

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
                        method: 'POST',
                        data: formData,
                        contentType: false,
                        processData: false,
                        success: function (res) {
                            console.log("에디터 데이터 확인:", res);

                            // 이미지 URL에 서버 도메인 추가 (필요한 경우)
                            const imageUrl = 'http://' + res.path
                            callback(imageUrl, '이미지');
                        },
                        error: function (xhr, status, error) {
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
        return null;
    }
}

// 내용 설정을 위한 함수
function setEditorContent(index, content) {
    const editorInstance = editorInstances[`editor_${index}`];
    if (editorInstance) {
        editorInstance.setMarkdown(content);
    } else {
        console.error(`에디터 인스턴스를 찾을 수 없습니다: editor_${index}`);
    }
}


// 멀티 파일 모듈 설정 함수
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

        // 필수 체크: 파일이 없으면 경고 표시
        if (isRequired && multiFilesInput[olIdx].length === 0) {
            Swal.fire('경고', '필수 파일을 첨부해주세요.', 'warning');
        }
    });

    // 전체 삭제 버튼 클릭 시 실행
    deleteAllBtn.on('click', function () {
        multiFilesInput[olIdx].forEach(fileObj => {
            if (fileObj.action === 'saved') {
                // 기존에 저장된 파일은 delete로 설정
                fileObj.action = 'delete';
            }
        });
        // 'add' 상태의 파일은 목록에서 제거
        multiFilesInput[olIdx] = multiFilesInput[olIdx].filter(fileObj => fileObj.action !== 'add');

        renderFileList(olIdx, fileList, deleteAllBtn);
        updateTotalVolume(olIdx, totalVolumeElement, totalVolumeText);
    });
}

// 파일 삭제 함수 - 삭제 시 action을 delete로 변경
function removeFile(olIdx, index, fileList, deleteAllBtn) {
    const fileObj = multiFilesInput[olIdx][index];
    if (fileObj.action === 'saved') {
        // 기존에 저장된 파일을 삭제할 때는 action을 'delete'로 설정
        fileObj.action = 'delete';
        // 삭제 상태에서도 pof_idx 유지
        fileObj.pof_idx = fileObj.pof_idx || fileObj.fileInfo.pof_idx;
    } else {
        // 새로 추가된 파일은 목록에서 완전히 제거
        multiFilesInput[olIdx].splice(index, 1);
    }
    renderFileList(olIdx, fileList, deleteAllBtn);
    updateTotalVolume(olIdx);
}

// 다중 파일 목록을 렌더링하는 함수
function renderFileList(olIdx, fileList, deleteAllBtn) {

    fileList.empty(); // 기존 목록 초기화

    multiFilesInput[olIdx].forEach((fileObj, index) => {
        if (fileObj.action !== 'delete') { // 삭제된 파일은 목록에 표시하지 않음
            const fileRow = $(`<tr>
                <td class="col-1">
                    <button class="remove-btn" data-index="${index}"><img src="/images/delete.svg"></button>
                </td>
                <td class="file-cell">${fileObj.file.name}</td>
                <td class="text-right">${(fileObj.file.size / 1024).toFixed(2)}KB</td>
                <td></td>
            </tr>`);
            fileRow.find('.remove-btn').on('click', function () {
                removeFile(olIdx, index, fileList, deleteAllBtn);
            });
            fileList.append(fileRow);
        }
    });

    // 파일 목록이 존재할 때만 전체삭제 버튼 보이도록 설정
    deleteAllBtn.toggle(multiFilesInput[olIdx].some(fileObj => fileObj.action !== 'delete'));
}

// 파일 용량을 업데이트하는 함수
function updateTotalVolume(olIdx, totalVolumeElement, totalVolumeText) {

    // delete 상태가 아닌 파일의 용량만 합산
    const totalSize = multiFilesInput[olIdx]
        .filter(fileObj => fileObj.action !== 'delete') // delete 상태인 파일 제외
        .reduce((sum, fileObj) => sum + fileObj.file.size, 0);

    // delete 상태가 아닌 파일 개수만 계산
    const totalCount = multiFilesInput[olIdx].filter(fileObj => fileObj.action !== 'delete').length;

    // 파일 개수와 용량 표시 업데이트
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

    deleteBtn.show().off('click').on('click', function () {
        console.log("삭제 버튼 클릭됨");  // 클릭 이벤트 확인

        // 파일 삭제 UI 갱신
        fileInfoWrap.hide();
        fileInput.val('');
        fileNameElement.text('');
        fileSizeElement.text('');
        $(this).hide();

        // `singleFile`에서 해당 파일의 action을 'delete'로 설정
        const olIdx = fileInput.data('ol_idx');
        console.log("삭제하려는 파일의 olIdx:", olIdx);

        // singleFile 배열에 있는 객체들 출력
        console.log("현재 singleFile 배열:", singleFile);

        const fileObjIndex = singleFile.findIndex(f => f.ol_idx === olIdx && (f.action === 'add' || f.action === 'update' || f.action === 'saved'));
        console.log("fileObjIndex:", fileObjIndex);

        if (fileObjIndex !== -1) {
            singleFile[fileObjIndex].action = 'delete';
            singleFile[fileObjIndex].file = {}; // 파일 데이터를 비워줍니다.
            console.log("파일 삭제 처리 완료:", singleFile[fileObjIndex]);  // 삭제 확인 메시지
        } else {
            console.log("삭제할 파일을 찾을 수 없습니다.");
        }
    });
    fileInput.on('change', function (event) {
        const selectedFile = event.target.files[0];
        const olIdx = fileInput.data('ol_idx');

        if (selectedFile && allowedTypes.length > 0 && !allowedTypes.includes(selectedFile.type)) {
            Swal.fire({
                title: '경고',
                html: '허용되지 않는 파일 형식입니다. <br> 다시 선택해주세요.',
                icon: 'warning',
                confirmButtonText: '확인'
            });
            fileInput.val('');
            return;
        }

        if (selectedFile) {
            fileInfoWrap.show();
            fileNameElement.text(selectedFile.name);
            const fileSizeInKB = (selectedFile.size / 1024).toFixed(2) + 'KB';
            fileSizeElement.text(fileSizeInKB);
        }
    });
}

$(function () {
    fetchBoardDetailData();

    $('#saveButton').on('click', function () {

        const moduleData = collectModuleData(); // 동적으로 생성된 모듈에서 값을 수집


        if (!moduleData) {
            return; // 필수값 누락 시 등록을 중단
        }

        console.log('수집된 데이터:', moduleData);
        console.log('수집된 단일 파일 배열:', singleFile);
        console.log('수집된 멀티 파일 배열:', multiFilesInput);

        const p_seq = $('#visibleCheckbox').is(':checked') ? "N" : "Y";
        const p_notice = "N";

        const formData = new FormData();

        let startIndex = 0;

        // 단일 파일 배열 추가
        if (singleFile.length > 0) {
            singleFile.forEach((item, index) => {
                if (item.action !== 'saved') {  // saved 상태는 제외
                    // delete가 아닐 경우에만 파일 데이터 추가
                    if (item.action !== 'delete') {
                        formData.append(`files[${startIndex}][file]`, item.file);
                    }
                    formData.append(`files[${startIndex}][action]`, item.action);
                    formData.append(`files[${startIndex}][ol_idx]`, item.ol_idx);
                    formData.append(`files[${startIndex}][attribute]`, item.attribute);

                    // update나 delete일 때만 pof_idx 추가
                    if (item.action === 'update' || item.action === 'delete') {
                        formData.append(`files[${startIndex}][opt_idx]`, item.pof_idx);
                    }
                    startIndex++;
                }
            });
        }

        // 다중 파일 배열 추가
        if (multiFilesInput && Object.keys(multiFilesInput).length > 0) {

            for (const [ol_idx, fileArray] of Object.entries(multiFilesInput)) {
                fileArray.forEach((item, index) => {

                    if (item.action !== 'saved') {  // saved 상태는 제외

                        // delete가 아닐 경우에만 파일 데이터 추가
                        if (item.action !== 'delete') {
                            formData.append(`files[${startIndex}][file]`, item.file);
                        }
                        formData.append(`files[${startIndex}][action]`, item.action);
                        formData.append(`files[${startIndex}][ol_idx]`, item.ol_idx);
                        formData.append(`files[${startIndex}][attribute]`, item.attribute)

                        // update나 delete일 때만 pof_idx 추가
                        if (item.action === 'update' || item.action === 'delete') {
                            formData.append(`files[${startIndex}][opt_idx]`, item.pof_idx);
                        }
                        startIndex++; // 다음 파일을 위해 인덱스를 증가
                    }
                });
            }
        }

        const user_idx = localStorage.getItem('user_idx');

        formData.append('user_idx', user_idx);
        formData.append('post_idx', pidx);
        formData.append('p_seq', p_seq);
        formData.append('p_notice', p_notice);
        formData.append('option', JSON.stringify(moduleData));

        // FormData 내용 콘솔에 출력
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        $.ajax({
            url: defaultUrl + '/with/post_edit',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                'Authorization': `Bearer ${atoken}`
            },
            success: function (response) {
                console.log('게시글 등록 응답:', response);
                Swal.fire({
                    title: '게시글 등록',
                    text: '게시글이 등록되었습니다.',
                    icon: 'success',
                    confirmButtonText: '확인'
                }).then(() => {
                    if (boardDetail.board_type === 'L') {
                        window.location.href = `/postList.html?board_idx=${bidx}`;  // 이전 board.html 페이지로 이동
                    } else {
                        window.location.href = `/albumList.html?board_idx=${bidx}`;  // 이전 board.html 페이지로 이동
                    }
                });
            },
            error: function (error) {
                console.error('게시글 등록 오류:', error.response ? error.response.data : error.message);
            }
        });
    });
});
