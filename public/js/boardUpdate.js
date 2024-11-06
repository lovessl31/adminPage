// url
const defaultUrl = "http://safe.withfirst.com:28888"
const params = new URL(document.location.href).searchParams;

// 토큰
const rtoken = getCookieValue('refreshToken');
const atoken = localStorage.getItem('accessToken');
const bidx = localStorage.getItem('board_idx');

let categories = [];
let options = [];
// 순번 관리 변수
let currentMaxSortNum = 0;

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
            boardInfoRender(boardDeatail);
        },
        error: function (e) {
            console.log('error :: 옵션 조회 에러', e);
        }
    });
}

// 카테고리 데이터 서버에서 받아오기
function fetchCategories(callback) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: defaultUrl + '/with/cate_list',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${atoken}`,
            },
            success: function (response) {

                console.log('카테고리 데이터를 성공적으로 로드했습니다', response.data);

                // 서버에서 받은 데이터를 jstree에 맞게 변환하는 함수
                function mapToJsTreeFormat(categories) {
                    return categories.map((category) => {
                        // 'board' 타입인 경우 접두사 설정 없이 고유 id 생성
                        let nodeIdPrefix = '';
                        if (category.type === 'Category') {
                            nodeIdPrefix = 'cate_';
                        } else if (category.type === 'Sub_Category') {
                            nodeIdPrefix = 'sub_';
                        }

                        const nodeId = nodeIdPrefix + category.id; // 접두사와 id를 결합하여 고유 id 생성

                        // 중첩된 배열을 정리하는 함수
                        function flattenChildren(children) {
                            return children.reduce((acc, child) => {
                                if (Array.isArray(child)) {
                                    acc = acc.concat(flattenChildren(child)); // 배열인 경우 재귀적으로 평탄화
                                } else {
                                    acc.push(child);
                                }
                                return acc;
                            }, []);
                        }

                        // 자식 노드를 평탄화 및 변환 처리
                        const flatChildren = category.children ? flattenChildren(category.children) : [];

                        return {
                            id: nodeId, // 고유한 id 생성
                            text: category.text, // 카테고리 이름
                            type: category.type, // 노드 타입
                            depth: category.depth, // depth 값 추가
                            state: { "opened": true },
                            children: flatChildren.length > 0
                                ? mapToJsTreeFormat(flatChildren) // 하위 카테고리도 동일하게 처리
                                : [] // 하위 카테고리가 없으면 빈 배열
                        };
                    });
                }

                // jstree에 맞춘 데이터로 변환
                const treeData = mapToJsTreeFormat(response.data);
                console.log('트리에 맞게 맵핑한 데이터', treeData);

                // jstree 초기화 및 데이터 적용
                $('#tree-container').jstree({
                    'core': {
                        'check_callback': true,
                        'data': treeData // jstree에 맞춘 데이터 설정
                    },
                    'plugins': ["dnd", "types", "state", "contextmenu"],
                    'dnd': {
                        'check_while_dragging': true,
                        'inside_pos': 'last',
                        'touch': false,
                        'large_drop_target': true,
                        'large_drag_target': true,
                        'use_html5': true // 드래그 앤 드롭을 HTML5 기본 동작으로 설정
                    },
                    'types': {
                        "Category": {
                            "icon": false,
                            'li_attr': {
                                'class': 'team_node' // li 태그에 클래스 추가
                            },
                            'a_attr': {
                                'class': 'team_node_link' // a 태그에 클래스 추가
                            }
                        },
                        "Sub_Category": {
                            "icon": false,
                            'a_attr': {
                                'class': 'team_node_link' // a 태그에 클래스 추가
                            }
                        },
                        "board": {
                            "icon": "./images/boardIcon.svg", // 멤버 아이콘
                            'a_attr': {
                                'class': 'member_node_link' // a 태그에 클래스 추가
                            }
                        }
                    },
                    'state': {
                        'key': 'unique_key' // 트리 상태를 저장할 고유 키
                    },
                    'multiple': true, // 여러 개 노드 동시 선택 허용
                    'contextmenu': false,
                });

                // 콜백 함수 실행
                if (callback) {
                    callback();
                }

                resolve();
            },
            error: function (xhr, status, error) {
                console.log(e);
                console.log('error : 카테고리 데이터를 로드하는데 실패하였습니다', status, error);
                reject(error);
            }
        });
    });
}

// 받은 데이터들로 렌더링하기
function boardInfoRender(boardDetail) {

    console.log('바꾼', boardDetail.category.cate_name);
    console.log('애앵', boardDetail.category.cate_idx);

    // 기존의 cate_idx 저장
    $('#cate_idx').val(boardDetail.category.cate_idx);  // 카테고리 ID 저장


    // 기존 카테고리 이름 설정
    $('#selectedCate').val(boardDetail.category.cate_name);  // 선택된 카테고리 이름을 input 필드에 설정

    // 동적 옵션들 렌더링
    renderOptions(boardDetail.options); // options 데이터를 기반으로 동적 필드를 렌더링

    // 게시판 명과 설명 설정
    $('.boardName').val(boardDetail.board_name);
    $('.boardDesc').val(boardDetail.board_desc);

    // 게시판 유형 설정
    $(`input[name="boardType"][value="${boardDetail.board_type}"]`).prop('checked', true);

    // 좋아요 설정 (like_set) 설정
    $(`input[name="likeOption"][value="${boardDetail.like_set}"]`).prop('checked', true);

    // 댓글 설정 (commentSet) 설정
    $(`input[name="cmtOption"][value="${boardDetail.commentSet}"]`).prop('checked', true);

    // group_idx 저장
    $('#group_idx').val(boardDetail.group_idx);

}

function renderOptions(options) {

    options.forEach(option => {
        let { ol_type, ol_name, ol_value, ov_idx, ol_idx, sort_num, view_sts, required } = option;
        currentMaxSortNum = Math.max(currentMaxSortNum, sort_num);  // 최대 순번을 저장

        switch (ol_type) {
            case 'dropdown':
                createDropDown(sort_num, 'update', ol_idx); // 드롭다운 필드 생성 시 sort_num 전달
                // 속성명과 옵션값 설정
                $(`#dropdown_box_${dropDownCnt} .attributeName`).val(ol_name);
                $(`#dropdown_box_${dropDownCnt} .sortNum`).val(sort_num); // sort_num 값 설정
                $(`#dropdown_box_${dropDownCnt}`).attr('data-gubun', 'update');  // 기존 모듈은 update로 설정

                // view_sts 값이 '2'라면 체크박스를 체크 상태로 설정
                if (view_sts === '2') {
                    $(`#dropdown_box_${dropDownCnt} input[type="checkbox"].hiddenCheckbox`).prop('checked', true);
                }

                // required 값이 'Y'라면 requireCheckbox 체크박스를 체크 상태로 설정
                if (required === 'Y') {
                    $(`#dropdown_box_${dropDownCnt} .requireCheckbox`).prop('checked', true);
                }

                // ol_value 배열을 ov_idx 기준으로 오름차순 정렬 후 렌더링
                ol_value.sort((a, b) => a.ov_idx - b.ov_idx).forEach(value => {
                    addChip(value.ol_value, dropDownCnt, value.ov_idx); // 옵션값과 ov_idx 추가
                });


                break;

            case 'dataInput':
                createDataInput(sort_num, 'update', ol_idx); // 데이터 입력 필드 생성 시 sort_num 전달
                $(`#data_input_box_${dataInputCnt} .attributeName`).val(ol_name); // 속성명 설정
                $(`#data_input_box_${dataInputCnt} .sortNum`).val(sort_num); // sort_num 값 설정
                $(`#data_input_box_${dataInputCnt}`).attr('data-gubun', 'update');  // 기존 모듈은 update로 설정

                // view_sts 값이 '2'라면 체크박스를 체크 상태로 설정
                if (view_sts === '2') {
                    $(`#data_input_box_${dataInputCnt} input[type="checkbox"].hiddenCheckbox`).prop('checked', true);
                }

                if (required == 'Y') {
                    $(`#data_input_box_${dataInputCnt} .requireCheckbox`).prop('checked', true);
                }

                break;

            case 'dateInput':
                createDateInput(sort_num, 'update', ol_idx); // 날짜 입력 필드 생성 시 sort_num 전달
                $(`#date_input_box_${dateInputCnt} .attributeName`).val(ol_name); // 속성명 설정
                $(`#date_input_box_${dateInputCnt} .sortNum`).val(sort_num); // sort_num 값 설정
                $(`#date_input_box_${dateInputCnt}`).attr('data-gubun', 'update');  // 기존 모듈은 update로 설정

                // view_sts 값이 '2'라면 체크박스를 체크 상태로 설정
                if (view_sts === '2') {
                    $(`#date_input_box_${dateInputCnt} input[type="checkbox"].hiddenCheckbox`).prop('checked', true);
                }

                if (required == 'Y') {
                    $(`#date_input_box_${dateInputCnt} .requireCheckbox`).prop('checked', true);
                }

                break;

            case 'file':
            case 'file_img':
            case 'file_video':

                console.log('file 타입 처리:', ol_type); // 파일 타입 처리 로그 추가

                let thumbImgChecked = false; // 대표 이미지 설정된 상태인지 확인

                createFileInput(sort_num, 'update', ol_idx); // 파일 입력 필드 생성 시 sort_num 전달
                $(`#file_input_box_${fileInputCnt} .attributeName`).val(ol_name); // 속성명 설정
                $(`#file_input_box_${fileInputCnt} .sortNum`).val(sort_num); // sort_num 값 설정
                $(`#data_input_box_${fileInputCnt}`).attr('data-gubun', 'update');
                $(`#file_input_box_${fileInputCnt}`).data('fileType', ol_type);  // 파일 타입 설정

                // 파일 타입에 맞는 버튼 선택
                if (ol_type === 'file') {
                    $(`#file_input_box_${fileInputCnt} .file-btn`).removeClass('selectedBtn');
                    $(`#file_input_box_${fileInputCnt} .file-btn:first`).addClass('selectedBtn'); // 전체 버튼 선택
                } else if (ol_type === 'file_img') {
                    $(`#file_input_box_${fileInputCnt} .file-btn`).removeClass('selectedBtn');
                    $(`#file_input_box_${fileInputCnt} .file-btn:eq(1)`).addClass('selectedBtn'); // 이미지 버튼 선택
                    // 대표 이미지 설정 라디오 버튼 처리
                    $(`#file_input_box_${fileInputCnt} .thumbImgWrapper`).show(); // 이미지 타입일 때만 라디오 버튼 표시
                } else if (ol_type === 'file_video') {
                    $(`#file_input_box_${fileInputCnt} .file-btn`).removeClass('selectedBtn');
                    $(`#file_input_box_${fileInputCnt} .file-btn:eq(2)`).addClass('selectedBtn'); // 비디오 버튼 선택
                }

                // view_sts 값에 따라 체크박스와 라디오 버튼 설정
                if (view_sts === '2' || view_sts === '4') {
                    $(`#file_input_box_${fileInputCnt} input[type="checkbox"].hiddenCheckbox`).prop('checked', true); // 숨김 체크박스
                }

                // 대표 이미지 설정 라디오 버튼 처리
                if (view_sts === '3' || view_sts === '4') {  // 대표 이미지로 설정된 경우
                    $(`#file_input_box_${fileInputCnt} input[name="thumbImg"]`).prop('checked', true);
                    thumbImgChecked = true;  // 대표 이미지가 이미 설정되었음을 기록
                } else {
                    // 아직 대표 이미지가 설정되지 않았거나, 다른 파일에 이미 설정된 경우 선택 해제
                    $(`#file_input_box_${fileInputCnt} input[name="thumbImg"]`).prop('checked', false);
                }

                if (required === 'Y') {
                    $(`#file_input_box_${fileInputCnt} .requireCheckbox`).prop('checked', true);
                }

                break;

            case 'files':
                createFilesInput(sort_num, 'update', ol_idx); // 다중 파일 입력 필드 생성 시 sort_num 전달
                $(`#files_input_box_${filesInputCnt} .attributeName`).val(ol_name); // 속성명 설정
                $(`#files_input_box_${filesInputCnt} .sortNum`).val(sort_num); // sort_num 값 설정
                $(`#data_input_box_${filesInputCnt}`).attr('data-gubun', 'update');

                // view_sts 값이 '2'라면 체크박스를 체크 상태로 설정
                if (view_sts === '2') {
                    $(`#data_input_box_${filesInputCnt} input[type="checkbox"].hiddenCheckbox`).prop('checked', true);
                }

                // required 값이 'Y'라면 requireCheckbox 체크박스를 체크 상태로 설정
                if (required === 'Y') {
                    $(`#files_input_box_${filesInputCnt} .requireCheckbox`).prop('checked', true);
                }

                break;

            case 'textArea':
                createTextAreaInput(sort_num, 'update', ol_idx);
                $(`#textarea_input_box_${textAreanCnt} .attributeName`).val(ol_name);
                $(`#textarea_input_box_${textAreanCnt} .sortNum`).val(sort_num);
                $(`#textarea_input_box_${textAreanCnt}`).attr('data-gubun', 'update');

                if (view_sts === '2') {
                    $(`#textarea_input_box_${textAreanCnt} input[type="checkbox"].hiddenCheckbox`).prop('checked', true);
                }
                if (required === 'Y') {
                    $(`#textarea_input_box_${textAreanCnt} .requireCheckbox`).prop('checked', true);
                }
                break;

            case 'editor':
                createEditorInput(sort_num, 'update', ol_idx);
                $(`#editor_input_box_${editorCnt} .attributeName`).val(ol_name);
                $(`#editor_input_box_${editorCnt} .sortNum`).val(sort_num);
                $(`#editor_input_box_${editorCnt}`).attr('data-gubun', 'update');

                if (view_sts === '2') {
                    $(`#editor_input_box_${editorCnt} input[type="checkbox"].hiddenCheckbox`).prop('checked', true);
                }
                if (required === 'Y') {
                    $(`#editor_input_box_${editorCnt} .requireCheckbox`).prop('checked', true);
                }
                break;
            default:
                console.error(`알 수 없는 옵션 유형: ${ol_type}`);
        }
    });

    updateSortNumbers();  // 모든 옵션을 렌더링한 후에 순번을 다시 정렬

}

// 렌더링된 옵션들의 순번을 업데이트하는 함수
function updateSortNumbers() {
    $("#optionsBody").children().each(function (index) {
        $(this).find('.sortNum').val(index + 1);  // 각 모듈의 순번을 1부터 다시 재정렬
    });
    currentMaxSortNum = $("#optionsBody").children().length;  // 현재 모듈의 개수를 저장
}

let dropDownCnt = 0;
let dataInputCnt = 0;
let dateInputCnt = 0;
let fileInputCnt = 0;
let filesInputCnt = 0;
let textAreanCnt = 0;
let editorCnt = 0;

//드랍다운 모듈 렌더링
function createDropDown(sort_num = null, gubun = "create", ol_idx = "") {
    dropDownCnt++;
    let html = createDropdownContent(dropDownCnt, gubun, sort_num || ++currentMaxSortNum, ol_idx, "");  // 동적으로 gubun 값 설정
    $("#optionsBody").append(html);
    updateSortNumbers();  // 추가 후 순번 업데이트
}

function createDropdownContent(dropDownCnt, gubun, sort_num, ol_idx, name) {

    let html = '';  // 결과 HTML을 저장할 변수	
    html += `<div id="dropdown_box_${dropDownCnt}" data-gubun="${gubun}"><h5>드롭다운 메뉴</h5>`;
    html += `<table class="moduleTable">`;
    html += `    <tbody>`;
    html += `        <tr>`;
    html += `            <td>속성명</td>`;
    html += `            <td>`;
    html += `                <div class="d-flex">`;
    html += `                    <input type="text"  data-type='dropdown' data-ol_idx="${ol_idx}" value="${name}" placeholder="속성명을 입력하세요." class="attributeName">`;
    html += `                    <div class="hiddenCheck">`;
    html += `                        <input type="checkbox" class="hiddenCheckbox" id="hiddenDropdownCheckbox_${dropDownCnt}">`;
    html += `                        <label for="hiddenDropdownCheckbox_${dropDownCnt}">목록에서 숨김</label>`;
    html += `                        <input type="checkbox" class="requireCheckbox" id="requireDropdownCheckbox_${dropDownCnt}">`;
    html += `                        <label for="requireDropdownCheckbox_${dropDownCnt}">필수값</label>`;
    html += `                    </div>`;
    html += `                </div>`;
    html += `            </td>`;
    html += `        </tr>`;

    html += `        <tr>`;
    html += `            <td>옵션값</td>`;
    html += `            <td class="d-flex align-items-center">`;
    html += `                <input type="text" id="select_label_${dropDownCnt}" placeholder="옵션값을 입력하세요" class="option-value">`;
    html += `                <button class="addBtn ms-1" onclick="javascript:addDropdownOption(${dropDownCnt});" data-action="addOption">추가</button>`;
    html += `            </td>`;
    html += `        </tr>`;

    html += `        <tr>`;
    html += `            <td>출력순번</td>`;
    html += `            <td><input type="text"  data-type='dropdown' value="${sort_num}" placeholder="순번을 정해주세요." class="sortNum"></td>`;
    html += `        </tr>`;
    html += `        <tr>`;

    html += `    </tbody>`;
    html += `</table>`;
    html += `<div class="option-list" id="select_option_${dropDownCnt}"></div>`;
    html += `<div class="createBtn">`;
    html += `    <button class="createCancle" onclick="javascript:removeOptionBox('dropdown_box_${dropDownCnt}', ${ol_idx ? ol_idx : null}, '${gubun}');" data-action="cancel">취소</button>`;
    html += `</div></div>`;

    return html;  // 생성된 HTML을 리턴
}

// 데이터 입력 필드 모듈 렌더링
function createDataInput(sort_num = null, gubun = "create", ol_idx = "") {
    dataInputCnt++;
    let html = createDataInputContent(dataInputCnt, gubun, sort_num || ++currentMaxSortNum, ol_idx, "");  // 새로운 순번 적용
    $("#optionsBody").append(html);
    updateSortNumbers();  // 추가 후 순번 업데이트
}

function createDataInputContent(dataInputCnt, gubun, sort_num, ol_idx, name) {
    const container = document.createElement('div');
    container.id = `data_input_box_${dataInputCnt}`;
    container.setAttribute('data-gubun', gubun);
    container.innerHTML = `
        <h5>데이터 입력 위젯</h5>
        <table class="moduleTable">
            <tbody>
                <tr>
                    <td>속성명</td>
                    <td>
                        <div class="d-flex">
                            <input type="text" data-type='dataInput' data-ol_idx="${ol_idx}" value="${name}" placeholder="속성명을 입력하세요." class="attributeName">
                            <div class="hiddenCheck">
                                <input type="checkbox" class="hiddenCheckbox" id="hiddenDateCheckbox_${dataInputCnt}">
                                <label for="hiddenDateCheckbox_${dataInputCnt}">목록에서 숨김</label>
                                <input type="checkbox" class="requireCheckbox" id="requireDataCheckbox_${dataInputCnt}">
                                <label for="requireDataCheckbox_${dataInputCnt}">필수값</label>
                            </div>
                        </div>
                    </td>
                </tr>
				<tr>
					<td>출력순번</td>
					<td><input type="text" data-type='dataInput' value="${sort_num}" placeholder="순번을 정해주세요." class="sortNum"></td>
				</tr>
            </tbody>
        </table>
        <div class="createBtn">
            <button class="createCancle" onclick="removeOptionBox('data_input_box_${dataInputCnt}', ${ol_idx ? ol_idx : null}, '${gubun}');" data-action="cancel">취소</button>
        </div>
    `;

    return container.outerHTML;
}

// 날짜 모듈 렌더링
function createDateInput(sort_num = null, gubun = "create", ol_idx = "") {
    dateInputCnt++;
    let html = createDateInputContent(dateInputCnt, gubun, sort_num || ++currentMaxSortNum, ol_idx, "");  // 새로운 순번 적용
    $("#optionsBody").append(html);
    updateSortNumbers();  // 추가 후 순번 업데이트
}

function createDateInputContent(dateInputCnt, gubun, sort_num, ol_idx, name) {
    const container = document.createElement('div');
    container.id = `date_input_box_${dateInputCnt}`;
    container.setAttribute('data-gubun', gubun);
    container.innerHTML = `
        <h5>날짜 입력 위젯</h5>
        <table class="moduleTable">
            <tbody>
                <tr>
                    <td>속성명</td>
                    <td>
                        <div class="d-flex">
                            <input type="text" data-type='dateInput' data-ol_idx="${ol_idx}" value="${name}" placeholder="속성명을 입력하세요." class="attributeName">
                            <div class="hiddenCheck">
                                <input type="checkbox" class="hiddenCheckbox" id="hiddenDateCheckbox_${dateInputCnt}">
                                <label for="hiddenDateCheckbox_${dateInputCnt}">숨김</label>
                                <input type="checkbox" class="requireCheckbox" id="requireDateCheckbox_${dateInputCnt}">
                                <label for="requireDateCheckbox_${dateInputCnt}">필수값</label>
                            </div>
                        </div>
                    </td>
                </tr>
				<tr>
					<td>출력순번</td>
					<td><input type="text" data-type='dateInput' value="${sort_num}" placeholder="순번을 정해주세요." class="sortNum"></td>
				</tr>
            </tbody>
        </table>
        <div class="createBtn">
            <button class="createCancle" onclick="removeOptionBox('date_input_box_${dateInputCnt}', ${ol_idx ? ol_idx : null}, '${gubun}');" data-action="cancel">취소</button>
        </div>
    `;

    return container.outerHTML;
}

// 파일 모듈 렌더링
function createFileInput(sort_num = null, gubun = "create", ol_idx = "") {
    fileInputCnt++;
    let html = createFileInputContent(fileInputCnt, gubun, sort_num || ++currentMaxSortNum, ol_idx, "");  // 동적으로 gubun 값 설정 
    $("#optionsBody").append(html);
    updateSortNumbers();  // 추가 후 순번 업데이트
}

// 파일 입력 필드
function createFileInputContent(fileInputCnt, gubun, sort_num, ol_idx, name) {
    const container = document.createElement('div');
    container.id = `file_input_box_${fileInputCnt}`;
    container.classList.add('file_input_box'); // 파일 입력 컨테이너에 클래스 추가
    container.setAttribute('data-gubun', gubun);

    container.innerHTML = `
        <h5>파일 입력 필드</h5>
		<div class="sortBtn">
     		<button class="file-btn selectedBtn" onclick="setFileType('file', this)">전체</button>
            <button class="file-btn" onclick="setFileType('file_img', this)">이미지</button>
            <button class="file-btn" onclick="setFileType('file_video', this)">비디오</button>
        </div>
        <table class="moduleTable">
            <tbody>
                <tr>
                    <td>속성명</td>
                    <td>
                        <div class="d-flex">
                            <input type="text" data-type='file' data-ol_idx="${ol_idx}" value="${name}" placeholder="속성명을 입력하세요." class="attributeName">
                                <div class="hiddenCheck">
                                <div class="thumbImgWrapper" style="display:none;">  <!-- 처음엔 숨김 -->
                                    <input type="radio" id="thumbImg_${fileInputCnt}" name="thumbImg">
                                    <label for="thumbImg_${fileInputCnt}">대표이미지 설정</label>
                                </div>
                                <input type="checkbox" class="hiddenCheckbox" id="hiddenFileCheckbox_${fileInputCnt}">
                                <label for="hiddenFileCheckbox_${fileInputCnt}">목록에서 숨김</label>
                                <input type="checkbox" class="requireCheckbox" id="requireFileCheckbox_${fileInputCnt}">
                                <label for="requireFileCheckbox_${fileInputCnt}">필수값</label>
                            </div>
                        </div>
                    </td>
                </tr>
				<tr>
					<td>출력순번</td>
					<td><input type="text"  data-type='dataInput' value="${sort_num}" placeholder="순번을 정해주세요." class="sortNum"></td>
				</tr>
            </tbody>
        </table>
        <div class="createBtn">
            <button class="createCancle" onclick="removeOptionBox('file_input_box_${fileInputCnt}', ${ol_idx ? ol_idx : null}, '${gubun}');" data-action="cancel">취소</button>
        </div>
    `;
    return container.outerHTML;
}

// 버튼 클릭 시 타입 설정 및 클래스 변경 함수
function setFileType(type, button) {
    const parentBox = $(button).closest('.file_input_box'); // 현재 파일 필드에만 적용
    parentBox.data('fileType', type);  // 선택한 파일 타입을 data 속성에 저장

    // 모든 버튼에서 selectedBtn 클래스 제거
    const allButtons = button.parentNode.querySelectorAll('.file-btn');
    allButtons.forEach(btn => btn.classList.remove('selectedBtn'));

    // 클릭된 버튼에 selectedBtn 클래스 추가
    button.classList.add('selectedBtn');

    // 대표 이미지 라디오 버튼 처리
    if (type === 'file_img') {
        parentBox.find('input[name="thumbImg"]').closest('.thumbImgWrapper').show(); // 이미지 타입이면 라디오 버튼 보이기
    } else {
        parentBox.find('input[name="thumbImg"]').closest('.thumbImgWrapper').hide(); // 다른 타입이면 숨기기
        parentBox.find('input[name="thumbImg"]').prop('checked', false); // 라디오 버튼 선택 해제
    }

    // 파일 타입이 변경되면 view_sts 값을 '1'로 초기화 (보임 상태)
    if (type !== 'file_img') {
        parentBox.find('input[type="radio"]').prop('checked', false);  // 라디오 버튼 해제
        parentBox.find('input[type="checkbox"].hiddenCheckbox').prop('checked', false);  // 체크박스도 해제
        parentBox.find('input[type="checkbox"].requireCheckbox').prop('checked', false);  // 체크박스도 해제
    }
}

// 다중 파일 모듈 렌더링
function createFilesInput(sort_num = null, gubun = "create", ol_idx = "") {
    filesInputCnt++;
    let html = createFilesInputContent(filesInputCnt, gubun, sort_num || ++currentMaxSortNum, ol_idx, "");  // 동적으로 gubun 값 설정  // 새로운 모듈은 gubun 값으로 'create' 전달
    $("#optionsBody").append(html);
    updateSortNumbers();  // 추가 후 순번 업데이트
}

function createFilesInputContent(filesInputCnt, gubun, sort_num, ol_idx, name) {
    const container = document.createElement('div');
    container.id = `files_input_box_${filesInputCnt}`;
    container.setAttribute('data-gubun', gubun);  // gubun 값을 'create'로 설정
    container.innerHTML = `
        <h5>다중 파일 입력 필드</h5>
        <table class="moduleTable">
            <tbody>
                <tr>
                    <td>속성명</td>
                    <td>
                        <div class="d-flex">
                            <input type="text" data-type='files' data-ol_idx="${ol_idx}" value="${name}"  placeholder="속성명을 입력하세요." class="attributeName">
                            <div class="hiddenCheck">
                                <input type="checkbox" class="hiddenCheckbox" id="hiddenFilesCheckbox_${filesInputCnt}">
                                <label for="hiddenFilesCheckbox_${filesInputCnt}">숨김</label>
                                <input type="checkbox" class="requireCheckbox" id="requireFilesCheckbox_${filesInputCnt}">
                                <label for="requireFilesCheckbox_${filesInputCnt}">필수값</label>
                            </div>
                        </div>
                    </td>
                </tr>
							<tr>
					<td>출력순번</td>
					<td><input type="text"  data-type='dataInput' value="${sort_num}" placeholder="순번을 정해주세요." class="sortNum"></td>
				</tr>
            </tbody>
        </table>
        <div class="createBtn">
            <button class="createCancle" onclick="removeOptionBox('files_input_box_${filesInputCnt}', ${ol_idx ? ol_idx : null}, '${gubun}');" data-action="cancel">취소</button>
        </div>
    `;
    return container.outerHTML;
}

// 텍스트영역 모듈 렌더링
function createTextAreaInput(sort_num = null, gubun = "create", ol_idx = "") {
    textAreanCnt++;
    let html = createTextAreaInputContent(textAreanCnt, gubun, sort_num || ++currentMaxSortNum, ol_idx, "");  // 새로운 모듈은 gubun 값으로 'create' 전달
    $("#optionsBody").append(html);
    updateSortNumbers();  // 추가 후 순번 업데이트
}

function createTextAreaInputContent(textAreanCnt, gubun, sort_num, ol_idx, name) {
    const container = document.createElement('div');
    container.id = `textarea_input_box_${textAreanCnt}`;
    container.setAttribute('data-gubun', gubun);  // gubun 값을 'create'로 설정
    container.innerHTML = `
        <h5>텍스트 영역 입력 필드</h5>
        <table class="moduleTable">
            <tbody>
                <tr>
                    <td>속성명</td>
                    <td>
                        <div class="d-flex">
                            <input type="text" data-type='textArea' data-ol_idx="${ol_idx}" value="${name}"  placeholder="속성명을 입력하세요." class="attributeName">
                            <div class="hiddenCheck">
                                <input type="checkbox" class="hiddenCheckbox" id="hiddenTextAreaCheckbox_${textAreanCnt}">
                                <label for="hiddenTextAreaCheckbox_${textAreanCnt}">숨김</label>
                                <input type="checkbox" class="requireCheckbox" id="requireTextAreaCheckbox_${textAreanCnt}">
                                <label for="requireTextAreaCheckbox_${textAreanCnt}">필수값</label>
                            </div>
                        </div>
                    </td>
                </tr>
							<tr>
					<td>출력순번</td>
					<td><input type="text"  data-type='dataInput' value="${sort_num}" placeholder="순번을 정해주세요." class="sortNum"></td>
				</tr>
            </tbody>
        </table>
        <div class="createBtn">
            <button class="createCancle" onclick="removeOptionBox('textarea_input_box_${textAreanCnt}', ${ol_idx ? ol_idx : null}, '${gubun}');" data-action="cancel">취소</button>
        </div>
    `;
    return container.outerHTML;
}

// 에디터 모듈 렌더링
function createEditorInput(sort_num = null, gubun = "create", ol_idx = "") {
    editorCnt++;
    let html = createEditorInputContent(editorCnt, gubun, sort_num || ++currentMaxSortNum, ol_idx, "");  // 동적으로 gubun 값 설정  // 새로운 모듈은 gubun 값으로 'create' 전달
    $("#optionsBody").append(html);
    updateSortNumbers();  // 추가 후 순번 업데이트
}

function createEditorInputContent(editorCnt, gubun, sort_num, ol_idx, name) {
    const container = document.createElement('div');
    container.id = `editor_input_box_${editorCnt}`;
    container.setAttribute('data-gubun', gubun);  // gubun 값을 'create'로 설정
    container.innerHTML = `
        <h5>에디터 입력 필드</h5>
        <table class="moduleTable">
            <tbody>
                <tr>
                    <td>속성명</td>
                    <td>
                        <div class="d-flex">
                            <input type="text" data-type='editor' data-ol_idx="${ol_idx}" value="${name}"  placeholder="속성명을 입력하세요." class="attributeName">
                            <div class="hiddenCheck">
                                <input type="checkbox" class="hiddenCheckbox" id="hiddenEditorCheckbox_${editorCnt}">
                                <label for="hiddenEditorCheckbox_${editorCnt}">숨김</label>
                                <input type="checkbox" class="requireCheckbox" id="requireEditorCheckbox_${editorCnt}">
                                <label for="requireEditorCheckbox_${editorCnt}">필수값</label>
                            </div>
                        </div>
                    </td>
                </tr>
							<tr>
					<td>출력순번</td>
					<td><input type="text"  data-type='dataInput' value="${sort_num}" placeholder="순번을 정해주세요." class="sortNum"></td>
				</tr>
            </tbody>
        </table>
        <div class="createBtn">
            <button class="createCancle" onclick="removeOptionBox('editor_input_box_${dataInputCnt}', ${ol_idx ? ol_idx : null}, '${gubun}');" data-action="cancel">취소</button>
        </div>
    `;
    return container.outerHTML;
}

// 다이나믹 옵션값 수집
function collectDynamicOptions() {

    let optionDataList = [];

    // 드롭다운, 데이터 입력, 날짜 입력, 파일, 다중 파일, 텍스트 영역, 에디터 필드를 모두 선택
    $("#optionsBody").children().each(function () {
        let $this = $(this);
        let type = $this.find('input').data('type'); // 기본 type은 input의 data-type 값으로 설정
        let action = $this.attr('data-action') || $this.data('gubun');  // 기존 항목은 'update', 새 항목은 'create'
        let view_sts;

        // 파일 입력 필드일 경우에만 fileType 값 적용
        if (type === 'file') {
            type = $(this).data('fileType') || 'file';  // 파일 타입을 가져옴 (없으면 기본 'file')
        }

        if (type === 'file_img') {
            const parentBox = $(this);  // 현재 옵션 박스를 참조
            const isRadioChecked = parentBox.find('input[type="radio"][name="thumbImg"]:checked').length > 0;  // 대표 이미지 체크 확인
            const isHiddenChecked = $(this).find('input[type="checkbox"].hiddenCheckbox').is(':checked');

            // 라디오 버튼과 체크박스가 모두 체크된 경우 view_sts를 4로 설정
            if (isRadioChecked && isHiddenChecked) {
                view_sts = '4'; // 대표사진 숨김
            } else if (isRadioChecked) {
                view_sts = '3'; // 대표사진 보임
            } else if (isHiddenChecked) {
                view_sts = '2'; // 숨김
            } else {
                view_sts = '1'; // 보임
            }
        } else {
            // type이 dropdown 또는 다른 타입인 경우 view_sts 설정
            const isHiddenChecked = $(this).find('input[type="checkbox"].hiddenCheckbox').is(':checked');
            const isRadioChecked = $(this).find('input[type="radio"]:checked').length > 0;
            view_sts = isRadioChecked ? '3' : (isHiddenChecked ? '2' : '1');
        }

        // 삭제된 항목도 수집
        if (action === 'delete') {
            console.log(`Collecting deleted item: ${$this.attr('id')}`);
        }

        const isRequiredChecked = $(this).find('input[type="checkbox"].requireCheckbox').is(':checked');

        let optionData = {
            type: type,                 // input의 data-type 속성 값
            action: action,             // data-action 값 (create, update, delete 등)
            attributeName: $this.find('.attributeName').val(),       // 속성명 input의 값
            view_sts: view_sts,
            sortNum: $this.find('.sortNum').val(),                  // 순번 input의 값
            required: isRequiredChecked ? 'Y' : 'N',
            options: []                                                // 옵션 리스트 텍스트 수집
        };

        // gubun이 'update' 또는 'delete'일 경우에만 ol_idx 추가
        if (action === 'update' || action === 'delete') {
            optionData.ol_idx = $this.find('input').data('ol_idx'); // update나 delete일 때 ol_idx 추가
        }

        // 옵션 리스트가 있는 경우에만 수집
        $this.find('.option-list .chip').each(function () {
            let optionText = $(this).text().trim().replace('×', '');  // chip 텍스트에서 '×' 제거
            let ov_idx = $(this).attr("data-ov_idx");

            if (action === 'create') {
                optionData.options.push(optionText.trim());
            } else {
                optionData.options.push({ "ol_value": optionText.trim(), "ov_idx": ov_idx });
            }
        });
        console.log("Action: ", action);  // action 값이 제대로 수집되는지 확인
        optionDataList.push(optionData);
    });

    console.log(optionDataList); // 수집된 데이터를 확인하기 위해 출력
    return optionDataList;        // 수집된 데이터를 리턴
}

// 옵션 지우기
function removeOptionBox(box_id, ol_idx = null, gubun = 'create') {
    const $box = $(`#${box_id}`);

    if (gubun === 'update') {
        // 기존 항목은 삭제하지 않고, data-action을 delete로 바꾸고 숨깁니다.
        $box.attr('data-action', 'delete');
        $box.hide();

    } else {
        // 새로 생성된 항목은 DOM에서 완전히 삭제
        $box.remove();
    }
    updateSortNumbers();  // 순번 재정렬
}

function addDropdownOption(idx) {

    let optionValue = $("#select_label_" + idx).val();
    if (!optionValue) return;
    addChip(optionValue, idx, '')
    $("#select_label_" + idx).val('');
}

// Chip 추가 함수(텍스트, dropDownIdx, ov_idx)
function addChip(value, idx, ov_idx = '') {
    const chip = $(`
			<div class="chip" data-ov_idx="${ov_idx}">
				<span class="chip-text">${value}</span>
				<span class="close">&times;</span>
			</div>
	`);

    $("#select_option_" + idx).append(chip);

    // Chip의 닫기 버튼 이벤트 핸들러
    chip.find('.close').click(function () {
        $(this).parent().remove();  // 클릭한 chip을 삭제
    });

    // Chip 클릭 시 텍스트 수정
    chip.on('click', '.chip-text', function () {
        const currentText = $(this).text();
        const input = $('<input type="text" class="form-control" />');
        input.val(currentText);

        $(this).replaceWith(input);
        input.focus();

        // Enter 키를 누르면 변경된 텍스트 적용
        input.on('keypress', function (e) {
            if (e.which === 13) {  // Enter 키
                const newText = $(this).val().trim();
                const newSpan = $('<span class="chip-text"></span>').text(newText);
                $(this).replaceWith(newSpan);
            }
        });

        // 입력 필드에서 포커스가 나가면 기존 텍스트로 되돌림
        input.on('blur', function () {
            const newText = $(this).val().trim();
            const newSpan = $('<span class="chip-text"></span>').text(newText);
            $(this).replaceWith(newSpan);
        });
    });
}

$(function () {

    // 카테고리 데이터를 먼저 받아오고, 그 후에 게시판 데이터를 받아 렌더링
    fetchCategories().then(() => {
        fetchBoardDetailData();
    }).catch((error) => {
        console.log('카테고리 또는 게시판 데이터를 불러오는 중 오류 발생', error);
    });

    let selectedCategory = null;

    // 노드 선택 시 선택된 노드의 cate_idx와 isCategory 저장하고 팝업 닫기
    $('#tree-container').on('changed.jstree', function (e, data) {
        if (data && data.node) {
            const rawCateId = data.node.id.replace(/^(sub_|cate_)/, ''); // 'sub_' 또는 'cate_' 접두사 제거

            selectedCategory = {
                cate_idx: rawCateId, // 선택된 노드의 ID가 cate_idx
                isCategory: data.node.original.type === 'Category' ? 'TOP' : 'SUB', // 타입에 따라 isCategory 설정
                cate_name: data.node.text
            };
            console.log('선택된 카테고리:', selectedCategory);

            // 선택한 카테고리 이름을 input 필드에 표시
            $('#selectedCate').val(selectedCategory.cate_name);

            // 팝업 닫기
            $('#categoryPopup').hide();
        }
    });


    $('.openTree').on('click', function () {
        $('#categoryPopup').show();
        // jstree의 선택된 상태를 모두 해제
        $('#tree-container').jstree('deselect_all');
        fetchCategories();
    });

    // 팝업 닫기 버튼 클릭 시 팝업 닫기
    $('.popup-close').on('click', function () {
        $('#categoryPopup').hide(); // 팝업 숨김
    });

    // 팝업 외부 클릭 시 팝업 닫기
    $(window).on('click', function (event) {
        if (event.target.id === 'categoryPopup') {
            $('#categoryPopup').hide(); // 팝업 숨김
        }
    });


    // 등록 저장 버튼 클릭 이벤트 핸들러 추가 
    $('#boardSaveBtn').on('click', function () {

        const cateIdx = $('#cate_idx').val(); // 기존 cate_idx 값 (변경 전 카테고리)

        console.log('변경전 카테고리 idx', cateIdx);

        const groupIdx = $('#group_idx').val(); // 숨겨진 input에서 group_idx 값 가져오기

        // 새로 선택한 카테고리 값과 타입
        let selectedCategoryIdx = '';  // 먼저 변수 선언
        let isCategory = '';  // 먼저 변수 선언

        if (selectedCategory) {  // selectedCategory가 존재할 경우에만 값 설정
            selectedCategoryIdx = selectedCategory.cate_idx; // 선택된 카테고리 ID
            isCategory = selectedCategory.isCategory; // 선택된 카테고리 타입
        }

        // 게시판 디폴트 설정
        const boardName = $('.boardName').val().trim();
        const boardDescription = $('.boardDesc').val().trim();
        const boardType = $("input[name='boardType']:checked").val();
        const likeSet = $("input[name='likeOption']:checked").val();
        const commentSet = $("input[name='cmtOption']:checked").val();

        console.log("게시판 이름: ", boardName);
        console.log("게시판 설명: ", boardDescription);
        console.log("게시판 타입: ", boardType);
        console.log("게시판 좋아요: ", likeSet);
        console.log("게시판 댓글: ", commentSet);

        // 동적 옵션 정보 수집
        const dynamicOptions = collectDynamicOptions();

        console.log("수집된 동적 옵션 정보:", dynamicOptions);

        // 요청할 폼 데이터
        const formData = new FormData();

        if (selectedCategoryIdx) {
            formData.append('new_cate_idx', selectedCategoryIdx); // 새로 선택한 카테고리 ID
            formData.append('isCategory', isCategory); // 새로 선택한 카테고리 타입
        }


        formData.append('cate_idx', cateIdx); // 기존 카테고리 값 (변경 전)
        formData.append('board_idx', bidx); // 기존 카테고리 값 (변경 전)
        formData.append('board_name', boardName); // 게시판 이름
        formData.append('board_desc', boardDescription); // 게시판 설명
        formData.append('board_type', boardType); // 게시판 유형 (L 또는 P)
        formData.append('LikeSet', likeSet); // 승인여부 (Y 또는 N)
        formData.append('commentSet', commentSet); // 승인여부 (Y 또는 N)
        formData.append('group_idx', groupIdx); // group_idx 값 추가
        formData.append('option', JSON.stringify(dynamicOptions)); // 동적 옵션 정보를 JSON 문자열로 변환하여 추가


        // FormData 내용 콘솔에 출력
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        // 서버에 POST 요청 보내기
        $.ajax({
            url: defaultUrl + '/with/board_edit',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                'Authorization': `Bearer ${atoken}`
            },
            success: function (response) {
                console.log('게시판 수정 응답:', response);
                Swal.fire({
                    title: '게시판 수정',
                    text: '게시판 수정에 성공하였습니다. 추가로 작업하시겠습니까?',
                    icon: 'success',
                    showCancelButton: true, // "아니요" 버튼 추가
                    confirmButtonText: '네',
                    cancelButtonText: '아니요'
                }).then((result) => {
                    if (result.isConfirmed) {
                        // 그대로
                    } else if (result.dismiss === Swal.DismissReason.cancel) {
                        // "아니요"를 클릭한 경우 이전 페이지로 이동
                        window.location.href = `/board.html?=${bidx}`;  // 이전 board.html 페이지로 이동
                    }
                });
            },
            error: function (error) {
                console.error('게시판 등록 오류:', error.response ? error.response.data : error.message);
                showPopup(2, '게시판 등록 실패', '<p>게시판 등록에 실패하였습니다.</p>', 'fail');
            }
        });
    });

    $('#boardCancleBtn').on('click', function () {
        history.back();  // 이전 페이지로 돌아감
    });

});

function showPopup(seq, title, content, status, type) {
    const popup = new TimedPopup({
        duration: seq * 1000,
        title: title,
        content: content,
        backgroundColor: status, // suc 만 받음 suc이면 성공메세지 나머진 실패메세지
        onSelect: type, // select 만 받음 select 면 페이지 이동처리 선택으로 변경
        onClose: () => console.log('팝업이 닫혔습니다.')
    });
    popup.show();
}