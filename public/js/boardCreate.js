// 게시판 생성 기능 JS

// 게시판 설명 툴팁
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('boardDesc');
    const expandIcon = document.getElementById('expandIcon');
    const popup = document.getElementById('bpopup');
    const popupClose = document.getElementById('bpopupClose');
    const popupText = document.getElementById('bpopupText');

    // 초기 상태 설정
    updateExpandIconVisibility();

    // 텍스트 영역 내용 변경 시 이벤트
    textarea.addEventListener('input', updateExpandIconVisibility);

    // 리사이즈 이벤트에도 아이콘 표시 여부 업데이트
    window.addEventListener('resize', updateExpandIconVisibility);

    function updateExpandIconVisibility() {
        expandIcon.style.display = textarea.scrollHeight > textarea.clientHeight ? 'block' : 'none';
    }

    // 확장 아이콘 클릭 시 팝업 열기
    expandIcon.addEventListener('click', () => {
        popupText.value = textarea.value;
        popup.classList.add('active');
        adjustPopupSize();
    });

    // 팝업 닫기 버튼
    popupClose.addEventListener('click', () => popup.classList.remove('active'));

    // 팝업 외부 클릭 시 닫기
    window.addEventListener('click', (event) => {
        if (![popup, expandIcon, textarea, popupText].some(el => el.contains(event.target))) {
            popup.classList.remove('active');
        }
    });

    // 팝업 크기 조정 함수
    function adjustPopupSize() {
        const maxWidth = Math.min(600, window.innerWidth * 0.8);
        const maxHeight = Math.min(400, window.innerHeight * 0.8);
        const headerHeight = 30; // 팝업 헤더의 예상 높이

        // 팝업 컨테이너 크기 설정
        popup.style.width = `${maxWidth}px`;
        popup.style.height = `${maxHeight}px`;

        // 팝업 텍스트 영역 크기 및 스타일 설정
        popupText.style.width = '100%';
        popupText.style.height = `${maxHeight - headerHeight}px`;
        popupText.style.boxSizing = 'border-box';
        popupText.style.padding = '10px';
        popupText.style.resize = 'none';
        popupText.style.overflow = 'auto';

        // 팝업 컨텐츠 영역 스타일 설정
        const popupContent = popup.querySelector('.bpopup-content');
        if (popupContent) {
            popupContent.style.height = `${maxHeight - headerHeight}px`;
            popupContent.style.overflow = 'hidden';
        }
    }

    // 초기 로드 및 창 크기 변경 시 팝업 크기 조정
    window.addEventListener('resize', adjustPopupSize);
});


// 동적 옵션 추가 기능을 위한 함수 정의/*
document.addEventListener('DOMContentLoaded', () => {
    const buttonsWrap = document.querySelector('.buttonsWrap');
    const optionsBody = document.getElementById('optionsBody');
    let optionCounter = 0;

    buttonsWrap.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const buttonText = button.textContent.trim();
        switch (buttonText) {
            case '드롭다운 메뉴':
                addOption('dropdown');
                break;
            case '데이터 입력 필드':
                addOption('dataInput');
                break;
            case '날짜 입력 위젯':
                addOption('dateInput');
                break;
            default:
                console.log('알 수 없는 버튼이 클릭되었습니다.');
        }
    });

    optionsBody.addEventListener('click', handleOptionEvents);

    function addOption(type) {
        const id = `option-${++optionCounter}`;
        const optionElement = createOptionElement(type, id);
        optionsBody.appendChild(optionElement);
    }

    function createOptionElement(type, id) {
        const div = document.createElement('div');
        div.className = `${type}Option`;
        div.dataset.id = id;
        div.dataset.type = type;

        let content = '';
        switch (type) {
            case 'dropdown':
                content = createDropdownContent(id);
                break;
            case 'dataInput':
                content = createDataInputContent(id);
                break;
            case 'dateInput':
                content = createDateInputContent(id);
                break;
        }

        div.innerHTML = content;
        return div;
    }

    function createDropdownContent(id) {
        return `
            <h5>드롭다운 메뉴</h5>
            <table class="moduleTable">
                <tbody>
                    <tr>
                        <td>속성명</td>
                        <td><input type="text" placeholder="속성명을 입력하세요." class="attribute-name"></td>
                    </tr>
                    <tr>
                        <td>옵션값</td>
                        <td class="d-flex align-items-center">
                            <input type="text" placeholder="옵션값을 입력하세요" class="option-value">
                            <button class="addBtn ms-1" data-action="addOption">추가</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="option-list"></div>
            <div class="createBtn">
                <button class="createCancle" data-action="cancel">취소</button>
                <button class="created" data-action="create">생성</button>
            </div>
        `;
    }

    function createDataInputContent(id) {
        return `
            <h5>데이터 입력 필드</h5>
            <table class="moduleTable">
                <tbody>
                    <tr>
                        <td>속성명</td>
                        <td><input type="text" placeholder="속성명을 입력하세요." class="attribute-name"></td>
                    </tr>
                </tbody>
            </table>
            <div class="createBtn">
                <button class="createCancle" data-action="cancel">취소</button>
                <button class="created" data-action="create">생성</button>
            </div>
        `;
    }

    function createDateInputContent(id) {
        return `
            <h5>날짜 입력 위젯</h5>
            <table class="moduleTable">
                <tbody>
                    <tr>
                        <td>속성명</td>
                        <td><input type="text" placeholder="속성명을 입력하세요." class="attribute-name"></td>
                    </tr>
                </tbody>
            </table>
            <div class="createBtn">
                <button class="createCancle" data-action="cancel">취소</button>
                <button class="created" data-action="create">생성</button>
            </div>
        `;
    }

    function handleOptionEvents(event) {
        const target = event.target;
        const action = target.dataset.action;
        if (!action) return;

        const optionElement = target.closest('[data-id]');
        const id = optionElement.dataset.id;
        const type = optionElement.dataset.type;

        switch (action) {
            case 'addOption':
                if (type === 'dropdown') addDropdownOption(optionElement);
                break;
            case 'create':
                createOption(optionElement, type);
                break;
            case 'cancel':
                optionElement.remove();
                break;
            case 'modify':
                modifyOption(optionElement);
                break;
            case 'delete':
                deleteOption(optionElement);
                break;
        }
    }

    function addDropdownOption(optionElement) {
        const optionValue = optionElement.querySelector('.option-value').value;
        if (!optionValue) return;

        const optionList = optionElement.querySelector('.option-list');
        const optionItem = document.createElement('div');
        optionItem.textContent = optionValue;
        optionList.appendChild(optionItem);

        optionElement.querySelector('.option-value').value = '';
    }

    function createOption(optionElement, type) {
        const attributeName = optionElement.querySelector('.attribute-name').value;
        if (!attributeName) {
            alert('속성명을 입력해주세요.');
            return;
        }

        let createdElement;
        switch (type) {
            case 'dropdown':
                createdElement = createDropdownElement(attributeName, optionElement);
                break;
            case 'dataInput':
                createdElement = createDataInputElement(attributeName);
                break;
            case 'dateInput':
                createdElement = createDateInputElement(attributeName);
                break;
        }

        optionElement.innerHTML = '';
        optionElement.appendChild(createdElement);
    }

    function createDropdownElement(attributeName, optionElement) {
        const options = Array.from(optionElement.querySelectorAll('.option-list div')).map(div => div.textContent);
        const select = document.createElement('select');
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });

        const div = document.createElement('div');
        div.innerHTML = `
            <table>
                <tbody>
                    <tr>
                        <td>${attributeName}</td>
                        <td class="spaceBetween">
                            ${select.outerHTML}
                            <div class="createBtn">
                                <button class="modifyBtn" data-action="modify">수정</button>
                                <button class="deleteBtn" data-action="delete">삭제</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <br>
        `;
        return div;
    }

    function createDataInputElement(attributeName) {
        const div = document.createElement('div');
        div.innerHTML = `
            <table>
                <tbody>
                    <tr>
                        <td>${attributeName}</td>
                        <td class="spaceBetween">
                            <input type="text">
                            <div class="createBtn">
                                <button class="modifyBtn" data-action="modify">수정</button>
                                <button class="deleteBtn" data-action="delete">삭제</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <br>
        `;
        return div;
    }

    function createDateInputElement(attributeName) {
        const div = document.createElement('div');
        div.innerHTML = `
            <table>
                <tbody>
                    <tr>
                        <td>${attributeName}</td>
                        <td class="spaceBetween">
                            <input type="date">
                            <div class="createBtn">
                                <button class="modifyBtn" data-action="modify">수정</button>
                                <button class="deleteBtn" data-action="delete">삭제</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <br>
        `;
        return div;
    }

    function modifyOption(optionElement) {
        // 수정 로직 구현
        console.log('수정 기능 구현 필요');
        console.log(1111111111111111111111111111);
        
        console.log("optionElement", optionElement);
        
    }

    function deleteOption(optionElement) {
        if (confirm('정말로 이 옵션을 삭제하시겠습니까?')) {
            optionElement.remove();
        }
    }
});





document.addEventListener('DOMContentLoaded', () => {
    // 공통 요청 함수
    function makeRequest(method, url, data = {}) {
        const token = localStorage.getItem('accessToken');
        return axios({
            method: method,
            url: url,
            data: data,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    }
    // 생성 가능 카테고리 출력
    function selectCagegory() {
        makeRequest('get', 'http://192.168.0.18:28888/with/openCategory')
            .then(response => {
                const categorys = response.data.data;
                const selectElement = document.getElementById('selectCategory');
                selectElement.innerHTML =
                    '<option value="" disabled selected hidden>카테고리를 선택해주세요.</option>'; // 초기화
                categorys.forEach(val => {
                    console.log(val);
                    const option = document.createElement('option');
                    option.value = val["카테고리 번호"];
                    // 카테고리가 상위냐 하위냐에 따라 다르게 표현하고 싶은데 적합한걸 찾기 어려움.
                    if (val["카테고리 구분"] === "SUB") {
                        option.textContent = `${val["카테고리 명"]}`;
                    } else {
                        option.textContent = `${val["카테고리 명"]}`;
                    }
                    option.setAttribute('data-category-type', val["카테고리 구분"]); // 히든 데이터 추가

                    console.log("option", option)
                    selectElement.appendChild(option);
                });
            })
            .catch(error => handleError(error, '생성 가능한 카테고리 목록을 불러오는 데 실패했습니다.'));
    }

    selectCagegory();

    // 페이지내 취소 버튼 클릭 시 게시판 페이지로 이동하기
    document.querySelectorAll('.cancleBtn').forEach(cancelBtn => {
        cancelBtn.addEventListener('click', () => {
            // history.back();
            location.href = 'board.html';
        });
    });



    // 동적 옵션 정보 수집 함수
function collectDynamicOptions() {
    const optionsContainer = document.getElementById("optionsBody");
    const optionElements = optionsContainer.querySelectorAll("[data-id]");
    const options = [];

    optionElements.forEach(element => {
        const type = element.dataset.type;
        const attributeName = element.querySelector("td:first-child").textContent.trim();
        let optionData = {
            type: type,
            attributeName: attributeName
        };

        switch (type) {
            case 'dropdown':
                const selectElement = element.querySelector("select");
                console.log(selectElement);
                optionData.options = Array.from(selectElement.options).map(option => option.value);
                break;
            case 'dataInput':                
                const inputdataElement = element.querySelector("input")
                console.log(inputdataElement);
                optionData.value = inputdataElement.value;
                break;
            case 'dateInput':                
                const inputDateElement = element.querySelector("input")
                console.log(inputDateElement);
                optionData.value = inputDateElement.value;
                break;
        }
        options.push(optionData);
    });

    return options;
}


    // 등록 저장 버튼 클릭 이벤트 핸들러 추가
    document.getElementById('boardSaveBtn').addEventListener('click', () => {

        // 입력필드에서 값 가져오기   

        // 패스 배리어블 헤더 식별자에 필요한 셀렉트 옵션 데이터를 가져옴
        const categoryElement = document.getElementById('selectCategory')
        const selectedOption = categoryElement.options[categoryElement.selectedIndex];
        const selectedOptionValue = selectedOption.value;
        const categoryType = selectedOption.getAttribute('data-category-type');
        // 폼 데이터 
        const boardName = document.querySelector(".boardName").value.trim();
        const boardDescription = document.querySelector(".boardDesc").value.trim();
        const boardType = document.querySelector("input[name='boardType']:checked").value;
        const likeSet = document.querySelector("input[name='likeOption']:checked").value;


        // 동적 옵션 정보 수집
        const dynamicOptions = collectDynamicOptions();

        console.log(111111111111111111);
        console.log("선택된 카테고리: ", selectedOption);
        console.log("선택된 카테고리 구분: ", categoryType);
        console.log(boardName, boardDescription, boardType, likeSet, dynamicOptions);
        console.log(9999999999999999);

        // 요청할 폼 데이터
        const formData = new FormData();
        formData.append('board_name', boardName); // 게시판 이름
        formData.append('board_desc', boardDescription); // 게시판 설명
        formData.append('board_type', boardType); // 게시판 유형 (L 또는 P)
        formData.append('LikeSet', likeSet); // 승인여부 (Y 또는 N)
        
        formData.append('option', JSON.stringify(dynamicOptions)); // 동적 옵션 정보를 JSON 문자열로 변환하여 추가

        const token = localStorage.getItem('accessToken');

        // 서버에 POST 요청 보내기
        axios.post(`http://192.168.0.18:28888/with/addBoard/${categoryType}/${selectedOptionValue}`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(response => {
                console.log('게시판 등록 응답:', response.data);
                // let userResponse = confirm("게시판이 등록 되었습니다 추가로 작업하시겠습니까?");
                // if (userResponse) {
                //     console.log("사용자가 '예'를 선택했습니다.");
                //     location.reload();
                // } else {
                //     console.log("사용자가 '아니오'를 선택했습니다.");
                //     location.href = 'board.html';
                // }
                showPopup(5, '게시판 등록', '<p>게시판 등록에 성공하였습니다. 추가로 작업 하시겠습니까?</p>', 'suc', 'select')

            })
            .catch(error => {
                console.error('게시판 등록 오류:', error.response ? error.response.data : error.message);
                showPopup(2, '게시판 등록 실패', '<p>게시판 등록에 실패하였습니다.</p>', 'fail')
            });
    });



    function showPopup(seq, title, content, status, type) { 
        const popup = new TimedPopup({
            duration: seq * 1000,
            title: title,
            content: content,
            backgroundColor: status, // suc 만 받음 suc이면 성공메세지 나머진 실패메세지
            onSelect : type, // select 만 받음 select 면 페이지 이동처리 선택으로 변경
            onClose: () => console.log('팝업이 닫혔습니다.')
        });
        popup.show();
    }
})