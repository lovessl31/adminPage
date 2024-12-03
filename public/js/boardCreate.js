// 게시판 생성 기능 JS
const defaultUrl = "http://safe.withfirst.com:28888";
const params = new URL(document.location.href).searchParams;

// 토큰
const rtoken = getCookieValue("refreshToken");
const atoken = localStorage.getItem("accessToken");
const bidx = localStorage.getItem("board_idx");

// 카테고리 데이터 불러오기 및 JSTREE 렌더링
function fetchCategories(callback) {
  $.ajax({
    url: defaultUrl + "/with/cate_list",
    method: "GET",
    headers: {
      Authorization: `Bearer ${atoken}`,
    },
    success: function (response) {
      console.log("카테고리 데이터를 성공적으로 로드했습니다", response.data);

      // 서버에서 받은 데이터를 jstree에 맞게 변환하는 함수
      function mapToJsTreeFormat(categories) {
        return categories.map((category) => {
          // 'board' 타입인 경우 접두사 설정 없이 고유 id 생성
          let nodeIdPrefix = "";
          if (category.type === "Category") {
            nodeIdPrefix = "cate_";
          } else if (category.type === "Sub_Category") {
            nodeIdPrefix = "sub_";
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
          const flatChildren = category.children
            ? flattenChildren(category.children)
            : [];

          return {
            id: nodeId, // 고유한 id 생성
            text: category.text, // 카테고리 이름
            type: category.type, // 노드 타입
            depth: category.depth, // depth 값 추가
            state: { opened: true },
            children:
              flatChildren.length > 0
                ? mapToJsTreeFormat(flatChildren) // 하위 카테고리도 동일하게 처리
                : [], // 하위 카테고리가 없으면 빈 배열
          };
        });
      }

      // jstree에 맞춘 데이터로 변환
      const treeData = mapToJsTreeFormat(response.data);

      // jstree 초기화 및 데이터 적용
      $("#tree-container").jstree({
        core: {
          check_callback: true,
          data: treeData, // jstree에 맞춘 데이터 설정
        },
        plugins: ["dnd", "types", "state", "contextmenu"],
        dnd: {
          check_while_dragging: true,
          inside_pos: "last",
          touch: false,
          large_drop_target: true,
          large_drag_target: true,
          use_html5: true, // 드래그 앤 드롭을 HTML5 기본 동작으로 설정
        },
        types: {
          Category: {
            icon: false,
            li_attr: {
              class: "team_node", // li 태그에 클래스 추가
            },
            a_attr: {
              class: "team_node_link", // a 태그에 클래스 추가
            },
          },
          Sub_Category: {
            icon: false,
            a_attr: {
              class: "team_node_link", // a 태그에 클래스 추가
            },
          },
          board: {
            icon: "./images/boardIcon.svg", // 멤버 아이콘
            a_attr: {
              class: "member_node_link", // a 태그에 클래스 추가
            },
          },
        },
        state: {
          key: "unique_key", // 트리 상태를 저장할 고유 키
        },
        multiple: true, // 여러 개 노드 동시 선택 허용
        contextmenu: false,
      });

      // 콜백 함수 실행
      if (callback) {
        callback();
      }
    },
    error: function (xhr, status, error) {
      console.log(e);
      console.log(
        "error : 카테고리 데이터를 로드하는데 실패하였습니다",
        status,
        error
      );
    },
  });
}

let dropDownCnt = 0;
let dataInputCnt = 0;
let dateInputCnt = 0;
let fileInputCnt = 0;
let filesInputCnt = 0;
let textAreanCnt = 0;
let editorCnt = 0;

//드랍다운 옵션 추가
function createDropDown() {
  dropDownCnt = dropDownCnt + 1;
  let html = createDropdownContent(dropDownCnt);
  $("#optionsBody").append(html);
}

function createDropdownContent(dropDownCnt, name) {
  if (!name) {
    name = "";
  }
  let html = ""; // 결과 HTML을 저장할 변수
  html += `<div id="dropdown_box_${dropDownCnt}"><h5>드롭다운 메뉴</h5>`;
  html += `<table class="moduleTable">`;
  html += `    <tbody>`;
  html += `        <tr>`;
  html += `            <td>속성명</td>`;
  html += `            <td>`;
  html += `                <div class="d-flex">`;
  html += `                    <input type="text" data-type='dropdown' value="${name}" placeholder="속성명을 입력하세요." class="attributeName">`;
  html += `                    <div class="hiddenCheck">`;
  html += `                        <input type="checkbox" class="hiddenCheckbox" id="hiddenDropdownCheckbox_${dropDownCnt}">`;
  html += `                        <label for="hiddenDropdownCheckbox_${dropDownCnt}">관리자 목록에서 숨김</label>`;
  html += `                        <input type="checkbox" class="userCheckbox" id="userDropdownCheckbox_${dropDownCnt}">`;
  html += `                        <label for="userDropdownCheckbox_${dropDownCnt}">사용자 목록에서 보임</label>`;
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
  html += `    </tbody>`;
  html += `</table>`;
  html += `<div class="option-list" id="select_option_${dropDownCnt}"></div>`;
  html += `<div class="createBtn">`;
  html += `    <button class="createCancle" onclick="javascript:removeOptionBox('dropdown_box_${dropDownCnt}');" data-action="cancel">취소</button>`;
  html += `</div></div>`;

  return html; // 생성된 HTML을 리턴
}

// 입력 필드 모듈 추가
function createDataInput() {
  dataInputCnt = dataInputCnt + 1;
  let html = createDataInputContent(dataInputCnt);
  $("#optionsBody").append(html);
}

function createDataInputContent() {
  const container = document.createElement("div");
  container.id = `data_input_box_${dataInputCnt}`;
  container.innerHTML = `
        <h5>데이터 입력 필드</h5>
        <table class="moduleTable">
            <tbody>
                <tr>
                    <td>
                        <div class="d-flex">
                            <input type="text" data-type='dataInput' value="" placeholder="속성명을 입력하세요." class="attributeName">
                            <div class="hiddenCheck">
                                <input type="checkbox" class="hiddenCheckbox" id="hiddenDataCheckbox_${dataInputCnt}">
                                <label for="hiddenDataCheckbox_${dataInputCnt}">관리자 목록에서 숨김</label>
                                <input type="checkbox" class="userCheckbox" id="userDataCheckbox_${dataInputCnt}">
                                <label for="userDataCheckbox_${dataInputCnt}">사용자 목록에서 보임</label>
                                <input type="checkbox" class="requireCheckbox" id="requireDataCheckbox_${dataInputCnt}">
                                <label for="requireDataCheckbox_${dataInputCnt}">필수값</label>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
        <div class="createBtn">
            <button class="createCancle" onclick="removeOptionBox('data_input_box_${dataInputCnt}');" data-action="cancel">취소</button>
        </div>
    `;

  return container.outerHTML;
}

// 날짜 모듈 추가
function createDateInput() {
  dateInputCnt = dateInputCnt + 1;
  let html = createDateInputContent(dateInputCnt);
  $("#optionsBody").append(html);
}

function createDateInputContent() {
  const container = document.createElement("div");
  container.id = `date_input_box_${dateInputCnt}`;
  container.innerHTML = `
        <h5>날짜 입력 위젯</h5>
        <table class="moduleTable">
            <tbody>
                <tr>
                    <td>속성명</td>
                    <td>
                        <div class="d-flex">
                            <input type="text" data-type='dateInput' placeholder="속성명을 입력하세요." class="attributeName">
                            <div class="hiddenCheck">
                                <input type="checkbox" class="hiddenCheckbox" id="hiddenDateCheckbox_${dateInputCnt}">
                                <label for="hiddenDateCheckbox_${dateInputCnt}">관리자 목록에서 숨김</label>
                                <input type="checkbox" class="userCheckbox" id="userDateCheckbox_${dateInputCnt}">
                                <label for="userDateCheckbox_${dateInputCnt}">사용자 목록에서 보임</label>
                                <input type="checkbox" class="requireCheckbox" id="requireDateCheckbox_${dateInputCnt}">
                                <label for="requireDateCheckbox_${dateInputCnt}">필수값</label>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
        <div class="createBtn">
            <button class="createCancle" onclick="removeOptionBox('date_input_box_${dateInputCnt}');" data-action="cancel">취소</button>
        </div>
    `;

  return container.outerHTML;
}

// 파일 입력 추가
function createFileInput() {
  fileInputCnt = fileInputCnt + 1;
  let html = createFileInputContent(fileInputCnt);
  $("#optionsBody").append(html);
}

// 파일 입력 필드
function createFileInputContent() {
  fileInputCnt = fileInputCnt + 1;
  const container = document.createElement("div");
  container.id = `file_input_box_${fileInputCnt}`;
  container.classList.add("file_input_box"); // 파일 입력 컨테이너에 클래스 추가

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
                            <input type="text" data-type='file' placeholder="속성명을 입력하세요." class="attributeName">
                            <div class="hiddenCheck">
                                <div class="thumbImgWrapper" style="display:none;">  <!-- 처음엔 숨김 -->
                                    <input type="radio" id="thumbImg_${fileInputCnt}" name="thumbImg">
                                    <label for="thumbImg_${fileInputCnt}">대표이미지 설정</label>
                                </div>
                                <input type="checkbox" class="hiddenCheckbox" id="hiddenFileCheckbox_${fileInputCnt}">
                                <label for="hiddenFileCheckbox_${fileInputCnt}">관리자 목록에서 숨김</label>
                                <input type="checkbox" class="userCheckbox" id="userFileCheckbox_${fileInputCnt}">
                                <label for="userFileCheckbox_${fileInputCnt}">사용자 목록에서 보임</label>
                                <input type="checkbox" class="requireCheckbox" id="requireFileCheckbox_${fileInputCnt}">
                                <label for="requireFileCheckbox_${fileInputCnt}">필수값</label>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
        <div class="createBtn">
            <button class="createCancle" onclick="removeOptionBox('file_input_box_${fileInputCnt}');" data-action="cancel">취소</button>
        </div>
    `;
  return container.outerHTML;
}

// 파일 모듈에서 버튼 클릭 시 타입 설정 및 클래스 변경 함수
function setFileType(type, button) {
  const parentBox = $(button).closest(".file_input_box"); // 현재 파일 필드에만 적용
  parentBox.data("fileType", type); // 선택한 파일 타입을 data 속성에 저장

  // 모든 버튼에서 selectedBtn 클래스 제거
  const allButtons = button.parentNode.querySelectorAll(".file-btn");
  allButtons.forEach((btn) => btn.classList.remove("selectedBtn"));

  // 클릭된 버튼에 selectedBtn 클래스 추가
  button.classList.add("selectedBtn");

  // 대표 이미지 라디오 버튼 처리
  if (type === "file_img") {
    parentBox.find('input[name="thumbImg"]').closest(".thumbImgWrapper").show(); // 이미지 타입이면 라디오 버튼 보이기
  } else {
    parentBox.find('input[name="thumbImg"]').closest(".thumbImgWrapper").hide(); // 다른 타입이면 숨기기
  }
}

// 다중 파일 입력 추가
function createFilesInput() {
  filesInputCnt = filesInputCnt + 1;
  let html = createFilesInputContent();
  $("#optionsBody").append(html);
}

function createFilesInputContent() {
  const container = document.createElement("div");
  container.id = `files_input_box_${filesInputCnt}`;
  container.innerHTML = `
        <h5>다중 파일 입력 필드</h5>
        <table class="moduleTable">
            <tbody>
                <tr>
                    <td>속성명</td>
                    <td>
                        <div class="d-flex">
                            <input type="text" data-type='files' placeholder="속성명을 입력하세요." class="attributeName">
                            <div class="hiddenCheck">
                                <input type="checkbox" class="hiddenCheckbox" id="hiddenFilesCheckbox_${filesInputCnt}">
                                <label for="hiddenFilesCheckbox_${filesInputCnt}">관리자 목록에서 숨김</label>
                                <input type="checkbox" class="userCheckbox" id="userFilesCheckbox_${filesInputCnt}">
                                <label for="userFilesCheckbox_${filesInputCnt}">사용자 목록에서 보임</label>
                                <input type="checkbox" class="requireCheckbox" id="requireFilesCheckbox_${filesInputCnt}">
                                <label for="requireFilesCheckbox_${filesInputCnt}">필수값</label>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
        <div class="createBtn">
            <button class="createCancle" onclick="removeOptionBox('files_input_box_${filesInputCnt}');" data-action="cancel">취소</button>
        </div>
    `;
  return container.outerHTML;
}

// 텍스트 영역 추가
function createTextAreaInput() {
  textAreanCnt = textAreanCnt + 1;
  let html = createTextAreaInputContent();
  $("#optionsBody").append(html);
}

function createTextAreaInputContent() {
  const container = document.createElement("div");
  container.id = `textarea_input_box_${textAreanCnt}`;
  container.innerHTML = `
        <h5>텍스트 영역 입력 필드</h5>
        <table class="moduleTable">
            <tbody>
                <tr>
                    <td>속성명</td>
                    <td>
                        <div class="d-flex">
                            <input type="text" data-type='textArea' placeholder="속성명을 입력하세요." class="attributeName">
                            <div class="hiddenCheck">
                                <input type="checkbox" class="hiddenCheckbox" id="hiddenTextAreaCheckbox_${textAreanCnt}">
                                <label for="hiddenTextAreaCheckbox_${textAreanCnt}">관리자 목록에서 숨김</label>
                                <input type="checkbox" class="userCheckbox" id="userTextAreaCheckbox_${textAreanCnt}">
                                <label for="userTextAreaCheckbox_${textAreanCnt}">사용자 목록에서 보임</label>
                                <input type="checkbox" class="requireCheckbox" id="requireTextAreaCheckbox_${textAreanCnt}">
                                <label for="requireTextAreaCheckbox_${textAreanCnt}">필수값</label>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
        <div class="createBtn">
            <button class="createCancle" onclick="removeOptionBox('textarea_input_box_${textAreanCnt}');" data-action="cancel">취소</button>
        </div>
    `;
  return container.outerHTML;
}

// 에디터 추가
function createEditorInput() {
  editorCnt = editorCnt + 1;
  let html = createEditorInputContent();
  $("#optionsBody").append(html);
}

function createEditorInputContent() {
  const container = document.createElement("div");
  container.id = `editor_input_box_${editorCnt}`;
  container.innerHTML = `
        <h5>에디터 입력 필드</h5>
        <table class="moduleTable">
            <tbody>
                <tr>
                    <td>속성명</td>
                    <td>
                        <div class="d-flex">
                            <input type="text" data-type='editor' placeholder="속성명을 입력하세요." class="attributeName">
                            <div class="hiddenCheck">
                                <input type="checkbox" class="hiddenCheckbox" id="hiddenEditorCheckbox_${editorCnt}">
                                <label for="hiddenEditorCheckbox_${editorCnt}">관리자 목록에서 숨김</label>
                                <input type="checkbox" class="userCheckbox" id="userEditorCheckbox_${editorCnt}">
                                <label for="userEditorCheckbox_${editorCnt}">사용자 목록에서 보임</label>
                                <input type="checkbox" class="requireCheckbox" id="requireEditorCheckbox_${editorCnt}">
                                <label for="requireEditorCheckbox_${editorCnt}">필수값</label>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
        <div class="createBtn">
            <button class="createCancle" onclick="removeOptionBox('editor_input_box_${editorCnt}');" data-action="cancel">취소</button>
        </div>
    `;
  return container.outerHTML;
}

// 다이나믹 옵션값 데이터 수집
function collectDynamicOptions() {
  let optionDataList = [];

  $("#optionsBody")
    .children()
    .each(function () {
      let type = $(this).find("input").data("type");
      let view_sts = {
        thumbnail: false, // 기본값은 false
        admin_list_view: true, // 기본값은 true (관리자 목록에서 보임)
        user_list_view: false, // 기본값은 false (사용자 목록에서 숨김)
      };

      // 파일 입력 필드일 경우에만 fileType 값 적용
      if (type === "file") {
        type = $(this).data("fileType") || "file";
      }

      // file_img 타입에서 thumbnail 설정
      if (type === "file_img") {
        const isRadioChecked =
          $(this).find('input[type="radio"]:checked').length > 0;
        if (isRadioChecked) {
          view_sts.thumbnail = true; // 대표 이미지 설정
        }
      }

      // 관리자 목록에서 숨김 설정
      const isAdminHiddenChecked = $(this)
        .find('input[type="checkbox"].hiddenCheckbox')
        .is(":checked");
      view_sts.admin_list_view = !isAdminHiddenChecked;

      // 사용자 목록에서 보임 설정
      const isUserVisibleChecked = $(this)
        .find('input[type="checkbox"].userCheckbox')
        .is(":checked");
      view_sts.user_list_view = isUserVisibleChecked;

      const isRequiredChecked = $(this)
        .find('input[type="checkbox"].requireCheckbox')
        .is(":checked");

      let optionData = {
        type: type,
        attributeName: $(this).find(".attributeName").val(),
        view_sts: view_sts, // 객체 형태로 설정된 view_sts 추가
        sortNum: $(this).find(".sortNum").val(),
        required: isRequiredChecked ? "Y" : "N",
        options: [],
      };

      $(this)
        .find(".option-list .chip")
        .each(function () {
          let optionText = $(this)
            .text()
            .replace("×", "")
            .trim()
            .replace(/\s+/g, "");
          optionData.options.push(optionText);
        });

      optionDataList.push(optionData);
    });

  return optionDataList;
}

// 모듈 제거
function removeOptionBox(box_id) {
  $("#" + box_id).remove();
}

// 드롭다운 추가 함수
function addDropdownOption(idx) {
  let optionValue = $("#select_label_" + idx).val();
  if (!optionValue) return;
  addChip(optionValue, idx);
  $("#select_label_" + idx).val("");
}

// Chip 추가 함수
function addChip(value, idx) {
  const chip = $(`
			<div class="chip">
				<span class="chip-text">${value}</span>
				<span class="close">&times;</span>
			</div>
	`);

  $("#select_option_" + idx).append(chip);

  // Chip의 닫기 버튼 이벤트 핸들러
  chip.find(".close").click(function () {
    $(this).parent().remove(); // 클릭한 chip을 삭제
  });

  // Chip 클릭 시 텍스트 수정
  chip.on("click", ".chip-text", function () {
    const currentText = $(this).text();
    const input = $('<input type="text" class="form-control" />');
    input.val(currentText);

    $(this).replaceWith(input);
    input.focus();

    // Enter 키를 누르면 변경된 텍스트 적용
    input.on("keypress", function (e) {
      if (e.which === 13) {
        // Enter 키
        const newText = $(this).val().trim();
        const newSpan = $('<span class="chip-text"></span>').text(newText);
        $(this).replaceWith(newSpan);
      }
    });

    // 입력 필드에서 포커스가 나가면 기존 텍스트로 되돌림
    input.on("blur", function () {
      const newText = $(this).val().trim();
      const newSpan = $('<span class="chip-text"></span>').text(newText);
      $(this).replaceWith(newSpan);
    });
  });
}

// 팝업
function showPopup(seq, title, content, status, type) {
  const popup = new TimedPopup({
    duration: seq * 1000,
    title: title,
    content: content,
    backgroundColor: status, // 'suc'일 때 성공 메시지
    onSelect: type, // 'select'일 때 추가 작업 수행
    onClose: () => console.log("팝업이 닫혔습니다."),
  });

  popup.show();

  // 'select' 타입인 경우, 예/아니요 선택 처리
  if (type === "select") {
    // 예 버튼 클릭 시 추가 작업
    $("#yesBtn").on("click", function () {
      // 필요한 작업 수행
    });

    // 아니요 버튼 클릭 시 페이지 새로고침
    $("#noBtn").on("click", function () {
      location.reload(); // 페이지 새로고침
    });
  }
}

function checkRepresentativePhoto() {
  // 동적 옵션 데이터를 수집하여 파일 모듈 확인
  const dynamicOptions = collectDynamicOptions();

  // file_img 타입에서 view_sts가 3인 대표사진이 있는지 확인
  const hasRepresentativePhoto = dynamicOptions.some(
    (option) => option.type === "file_img" && option.view_sts === "3"
  );

  return hasRepresentativePhoto;
}

$(function () {
  // 선택된 카테고리
  let selectedCategory = null;

  // 노드 선택 시 선택된 노드의 cate_idx와 isCategory 저장하고 팝업 닫기
  $("#tree-container").on("changed.jstree", function (e, data) {
    if (data && data.node) {
      const rawCateId = data.node.id.replace(/^(sub_|cate_)/, ""); // 'sub_' 또는 'cate_' 접두사 제거

      selectedCategory = {
        cate_idx: rawCateId, // 선택된 노드의 ID가 cate_idx
        isCategory: data.node.original.type === "Category" ? "TOP" : "SUB", // 타입에 따라 isCategory 설정
        cate_name: data.node.text,
      };

      // 선택한 카테고리 이름을 input 필드에 표시
      $("#selectedCate").val(selectedCategory.cate_name);

      // 팝업 닫기
      $("#categoryPopup").hide();
    }
  });

  // 트리 팝업 열기
  $(".openTree").on("click", function () {
    // 카테고리 선택 상태 초기화
    selectedCategory = null;
    $("#selectedCate").val(""); // 이전에 선택된 카테고리 이름 초기화

    $("#categoryPopup").show();

    // jstree가 초기화되었는지 확인한 후, 초기화된 경우에만 실행
    const treeInstance = $("#tree-container").jstree(true);
    if (treeInstance) {
      // 고유 키를 새로 할당해 상태 저장 초기화
      treeInstance.settings.state.key = "unique_key_" + new Date().getTime();
      treeInstance.deselect_all(); // 상태를 초기화
      treeInstance.refresh(); // 트리를 새로고침
    } else {
      // jstree 초기화
      fetchCategories(function () {
        // 초기화 후 상태를 초기화
        $("#tree-container").jstree(true).settings.state.key =
          "unique_key_" + new Date().getTime();
        $("#tree-container").jstree("deselect_all").jstree("refresh");
      });
    }
  });

  // 팝업 닫기 버튼 클릭 시 팝업 닫기
  $(".close").on("click", function () {
    $("#categoryPopup").hide(); // 팝업 숨김
  });

  // 팝업 외부 클릭 시 팝업 닫기
  $(window).on("click", function (event) {
    if (event.target.id === "categoryPopup") {
      $("#categoryPopup").hide(); // 팝업 숨김
    }
  });

  // 취소 버튼 클릭 함수
  $("#boardCancleBtn").on("click", function () {
    history.back(); // 이전 페이지로 돌아감
  });

  // 등록 저장 버튼 클릭 이벤트 핸들러 추가
  $("#boardSaveBtn").on("click", function () {
    // 게시판 디폴트 설정
    const boardName = $(".boardName").val().trim();
    const boardDescription = $(".boardDesc").val().trim();
    const boardType = $("input[name='boardType']:checked").val();
    const likeSet = $("input[name='likeOption']:checked").val();
    const commentSet = $("input[name='cmtOption']:checked").val();
    // 동적 옵션 정보 수집
    const dynamicOptions = collectDynamicOptions();

    const hasRepresentativePhoto = checkRepresentativePhoto(); // file_img 모듈에 view_sts 3 여부 확인

    const userViewCount = dynamicOptions.filter(
      (option) => option.view_sts.user_list_view === true
    ).length;

    console.log("dddd", userViewCount);

    if (userViewCount > 2) {
      Swal.fire({
        title: "제한 초과",
        text: "사용자 목록에는 최대 2개까지 보이게 설정할 수 있습니다.",
        icon: "warning",
        confirmButtonText: "확인",
      });
      return; // 등록을 막음
    }

    if (boardType === "P" && !hasRepresentativePhoto) {
      Swal.fire({
        title: "대표사진 필요",
        text: "앨범형 게시판을 생성하려면 파일 모듈의 대표사진을 설정해야 합니다.",
        icon: "warning",
        confirmButtonText: "확인",
      });
      return; // 대표사진 설정 전까지 저장 진행 안됨
    }

    // 요청할 폼 데이터
    const formData = new FormData();

    // 선택한 카테고리 정보가 없으면 경고
    if (!selectedCategory) {
      Swal.fire({
        title: "경고",
        text: "카테고리를 선택하세요.",
        icon: "warning",
        confirmButtonText: "확인",
      }).then(() => {
        fetchBoardData(currentPage);
      });
      return;
    }

    formData.append("cate_idx", selectedCategory.cate_idx);
    formData.append("isCategory", selectedCategory.isCategory);
    formData.append("board_name", boardName); // 게시판 이름
    formData.append("board_desc", boardDescription); // 게시판 설명
    formData.append("board_type", boardType); // 게시판 유형 (L 또는 P)
    formData.append("LikeSet", likeSet); // 승인여부 (Y 또는 N)
    formData.append("commentSet", commentSet); // 승인여부 (Y 또는 N)
    formData.append("option", JSON.stringify(dynamicOptions)); // 동적 옵션 정보를 JSON 문자열로 변환하여 추가

    // FormData 내용 콘솔에 출력
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    //서버에 POST 요청 보내기
    // $.ajax({
    //     url: defaultUrl + '/with/board_add',
    //     method: 'POST',
    //     data: formData,
    //     processData: false,
    //     contentType: false,
    //     headers: {
    //         'Authorization': `Bearer ${atoken}`
    //     },
    //     success: function(response) {
    //         console.log('게시판 등록 응답:', response.data);
    //         //showPopup(5, '게시판 등록', '<p>게시판 등록에 성공하였습니다. 추가로 작업 하시겠습니까?</p>', 'suc', 'select');
    // 		Swal.fire({
    //             title: '게시판 등록',
    //             text: '게시판 등록에 성공하였습니다. 추가로 작업하시겠습니까?',
    //             icon: 'success',
    // 			showCancelButton: true, // "아니요" 버튼 추가
    // 			confirmButtonText: '네',
    // 			cancelButtonText: '아니요'
    //         }).then((result)=> {
    // 			if(result.isConfirmed) {
    // 				window.location.href = '/boardCreate.html';  // 새 게시판 생성 페이지로 리디렉션`
    // 			} else if (result.dismiss === Swal.DismissReason.cancel) {
    // 				// "아니요"를 클릭한 경우 이전 페이지로 이동
    // 				window.location.href = `/board.html?=${bidx}`;  // 이전 board.html 페이지로 이동
    // 			}
    //         });
    //     },
    //     error: function(error) {
    //         console.error('게시판 등록 오류:', error.response ? error.response.data : error.message);
    //         showPopup(2, '게시판 등록 실패', '<p>게시판 등록에 실패하였습니다.</p>', 'fail');
    //     }
    //     });
  });
});
