// 전역 변수를 객체로 묶어 관리
const state = {
    options: [],
    uploadedFileIds: [],
    filesArray: []
};

const urlParams = new URLSearchParams(window.location.search);
const Id = urlParams.get('id');
const mode = urlParams.get('mode');  // 'edit' or 'create'
const defaultUrl = "http://safe.withfirst.com:28888"

document.addEventListener('DOMContentLoaded', function () {
    initializeSummernote();
    initializeFileUpload();
    initializeForm();

    if (mode === 'edit') {
        document.querySelector(".contentTitle").innerHTML = "게시글 수정";
        loadPostEditData(Id);
    } else if (mode === 'create') {
        document.querySelector(".contentTitle").innerHTML = "게시글 등록";
        loadPostWriteData(Id);
    } else {
        // 로렘입숨으로 대체할 예정
    }
});

function initializeSummernote() {
    $('#summernote').summernote({
        height: 500,
        minHeight: 350,
        maxHeight: 642,
        focus: true,
        lang: "ko-KR",
        toolbar: [
            ['fontname', ['fontname']],
            ['fontsize', ['fontsize']],
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['color', ['forecolor', 'color']],
            ['table', ['table']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['height', ['height']],
            ['insert', ['picture', 'link', 'video']],
            ['view', ['fullscreen', 'help']]
        ],
        fontNames: ['Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', '맑은 고딕', '궁서', '굴림체', '굴림', '돋움체', '바탕체'],
        fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '64', '72', '96', '144'],
        callbacks: {
            onImageUpload: function (files) {
                console.log(files);                
                for (let i = 0; i < files.length; i++) {
                    uploadImage(files[i], this);
                }
            },
            onPaste: function (e) {
                var clipboardData = e.originalEvent.clipboardData;
                if (clipboardData && clipboardData.items && clipboardData.items.length) {
                    var item = clipboardData.items[0];
                    if (item.kind === 'file' && item.type.indexOf('image/') !== -1) {
                        e.preventDefault();
                        var blob = item.getAsFile();
                        uploadImage(blob, this);
                    }
                }
            }
        }
    });
}





function initializeForm() {
    const registerButton = document.querySelector('.regiBtn button');
    registerButton.addEventListener('click', handleFormSubmission);
}

function uploadImage(file, editor) {
    console.log("editoreditoreditoreditoreditoreditoreditoreditoreditoreditoreditoreditoreditor");    
    console.log(editor);
    console.log("editoreditoreditoreditoreditoreditoreditoreditoreditoreditoreditoreditoreditor");
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('accessToken');
    const url = `${defaultUrl}/file/upload`;

    axios.post(url, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (response.data.result === 'success') {
            const imageUrl = response.data.data.url;
            $(editor).summernote('insertImage', imageUrl);
            state.uploadedFileIds.push(response.data.data.file_id);
        } else {
            throw new Error('Upload failed');
        }
    })
    .catch(error => {
        console.error('Error uploading image:', error);
        showPopup(2, "Error uploading", "이미지 업로드에 실패했습니다.");
    });
}



function handleFormSubmission(e) {
    e.preventDefault();

    const titleInput = document.querySelector('.title_box input');
    const privacyRadios = document.querySelectorAll('input[name="privacy"]');
    const noticeRadios = document.querySelectorAll('input[name="notice"]');
    const moduleWrap = document.querySelector('.module-wrap');

    const title = titleInput.value;
    const content = $('#summernote').summernote('code');
    const privacy = document.querySelector('input[name="privacy"]:checked').value;
    const isNotice = document.querySelector('input[name="notice"]:checked').value;

    const dynamicOptions = Array.from(moduleWrap.querySelectorAll('.dynamic-option input')).reduce((acc, input) => {
        acc[input.name] = input.value;
        return acc;
    }, {});

    if (!title || !content) {
        showPopup(2, "Error", "제목과 내용을 모두 입력해주세요.");
        return;
    }

    const postData = {
        title, content, privacy, isNotice, dynamicOptions
    };

    console.log(postData);
    // TODO: 서버로 postData 전송 로직 구현
}



function loadPostWriteData(boardId) {
    const token = localStorage.getItem('accessToken');
    const url = `${defaultUrl}/with/post/add/${boardId}`;
    axios.get(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        console.log('성공');
        const data = response.data.data;
        console.log('데이터값 확인 :', data);

        state.options = data;
        const option_wrap = document.querySelector(".module-wrap");

        if (state.options.length === 0) {
            option_wrap.style.display = "none";
        } else {
            option_wrap.style.display = "block";
            renderDynamicOptions(state.options);
        }
    })
    .catch(error => {
        console.error('Error loading post data:', error);
        showPopup(2, "Error loading post data", error);
    });
}

function renderDynamicOptions(options) {
    const moduleWrap = document.querySelector(".module-wrap");
    moduleWrap.innerHTML = '';

    options.forEach(option => {
        const rowElement = document.createElement('div');
        rowElement.className = 'row module align-items-center mb-3';

        const labelElement = document.createElement('div');
        labelElement.className = 'col-2 font-weight-bold';
        labelElement.textContent = option.df_name;

        const inputWrapElement = document.createElement('div');
        inputWrapElement.className = 'col-10';

        let inputElement;

        switch (option.df_type) {
            case 'dropdown':
                inputElement = document.createElement('select');
                inputElement.className = 'form-control';
                const extraData = JSON.parse(option.extra_data);
                extraData.options.forEach(optionItem => {
                    const optElement = document.createElement('option');
                    optElement.value = optionItem;
                    optElement.textContent = optionItem;
                    inputElement.appendChild(optElement);
                });
                break;
            case 'dataInput':
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.className = 'form-control';
                break;
            default:
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.className = 'form-control';
        }

        inputElement.name = `option_${option.df_idx}`;
        inputElement.id = `option_${option.df_idx}`;
        if (option.required === 'Y') {
            inputElement.required = true;
            labelElement.innerHTML += ' <span class="text-danger">*</span>';
        }

        inputWrapElement.appendChild(inputElement);
        rowElement.appendChild(labelElement);
        rowElement.appendChild(inputWrapElement);
        moduleWrap.appendChild(rowElement);
    });
}

function loadPostEditData(postId) {
    console.log("수정이지");
    // TODO: 수정 모드 로직 구현
}

function renderFileList() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';

    state.filesArray.forEach((file, index) => {
        const fileRow = document.createElement('tr');

        fileRow.innerHTML = `
            <td class="col-1">
                <button class="remove-btn" data-index="${index}">삭제</button>
            </td>
            <td class="file-cell">${file.name}</td>
            <td class="text-right">${(file.size / 1024).toFixed(2)}KB</td>
            <td></td>
        `;

        fileList.appendChild(fileRow);
    });
}

function initializeFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const fileBtn = document.getElementById('fileBtn');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const fileList = document.getElementById('fileList');

    fileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelection);
    deleteAllBtn.addEventListener('click', deleteAllFiles);

    // 파일 리스트에 대한 이벤트 위임
    fileList.addEventListener('click', (event) => {
        if (event.target.closest('.remove-btn')) {
            const index = event.target.closest('.remove-btn').getAttribute('data-index');
            removeFile(index);
        }
    });
}

function handleFileSelection(event) {
    const newFiles = Array.from(event.target.files);
    state.filesArray = [...state.filesArray, ...newFiles];
    renderFileList();
    updateTotalVolume();
    // 파일 선택 후 input 초기화
    event.target.value = '';
}

function deleteAllFiles() {
    state.filesArray = [];
    renderFileList();
    updateTotalVolume();
}


function removeFile(index) {
    state.filesArray.splice(index, 1);
    renderFileList();
    updateTotalVolume();
}

function updateTotalVolume() {
    const totalSize = state.filesArray.reduce((sum, file) => sum + file.size, 0);
    const totalCount = state.filesArray.length;

    const totalVolumeElement = document.querySelector('.total_volume em');
    const totalVolumeText = document.querySelector('.total_volume');

    totalVolumeElement.textContent = totalCount;
    totalVolumeText.innerHTML = `첨부파일 <em>${totalCount}</em>개 (${(totalSize / 1024).toFixed(2)}KB)`;

    const deleteAllBtn = document.getElementById('deleteAllBtn');
    deleteAllBtn.style.display = totalCount > 0 ? 'inline-block' : 'none';
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