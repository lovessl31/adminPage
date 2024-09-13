	// 게시판 생성 기능 JS
	const defaultUrl = "http://safe.withfirst.com:28888"
	
	const params = new URL(document.location.href).searchParams;
	


	document.addEventListener('DOMContentLoaded', () => {
		 
		// 게시판 설명 툴팁 
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
	    
	    // 페이지내 취소 버튼 클릭 시 게시판 페이지로 이동하기
	    document.querySelectorAll('.cancleBtn').forEach(cancelBtn => {
	        cancelBtn.addEventListener('click', () => {
	            // history.back();
	            location.href = 'board.html';
	        });
	    });



   


	    // 등록 저장 버튼 클릭 이벤트 핸들러 추가
	    document.getElementById('boardSaveBtn').addEventListener('click', () => {
	
	        // 입력필드에서 값 가져오기   
			
	        // 패스 배리어블 헤더 식별자에 필요한 셀렉트 옵션 데이터를 가져옴
	        const categoryElement = document.getElementById('selectCategory')
	        const selectedOption = categoryElement.options[categoryElement.selectedIndex];
	        const categoryType = selectedOption.getAttribute('data-category-type');
	        
	        const selectedOptionValue =  $('#asis_cate_idx').val();
	        
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
	
			board_idx=$("#board_idx").val();
			group_idx=$("#group_idx").val();
			
	        // 요청할 폼 데이터
	        const formData = new FormData();
	        formData.append('board_name', boardName); // 게시판 이름
	        formData.append('board_desc', boardDescription); // 게시판 설명
	        formData.append('board_type', boardType); // 게시판 유형 (L 또는 P)
	        formData.append('group_idx', group_idx);
	        formData.append('board_idx', board_idx);
	        formData.append('LikeSet', likeSet); // 승인여부 (Y 또는 N)
	        
	        
	        let cate_idx=$('#selectCategory').val();
	        formData.append('new_cate_idx', cate_idx); 
	        
	        formData.append('option', JSON.stringify(dynamicOptions)); // 동적 옵션 정보를 JSON 문자열로 변환하여 추가
	
	        const token = localStorage.getItem('accessToken');
			
	        // 서버에 POST 요청 보내기
	        axios.post(`${defaultUrl}/with/updateBoard/${categoryType}/${selectedOptionValue}`, formData, {
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
	                //showPopup(5, '게시판 수정', '<p>게시판 수정에 성공하였습니다. 추가로 작업 하시겠습니까?</p>', 'suc', 'select')
	
	            })
	            .catch(error => {
	                console.error('게시판 수정 오류:', error.response ? error.response.data : error.message);
	                //showPopup(2, '게시판 수정 실패', '<p>게시판 수정에 실패하였습니다.</p>', 'fail')
	            });
	    });



		//카테고리 목록 가져오기 및 게시판 정보 가져오기	   
		selectCagegory();
	
	});

	
	let dropDownCnt=0;
	let dataInputCnt=0;
	let dateInputCnt=0;
	
	//드랍다운 옵션 추가
	function createDropDown(){
		dropDownCnt=dropDownCnt+1;
		
		let html=createDropdownContent(dropDownCnt,"create","","");
		$("#optionsBody").append(html);
	}

	//dropDownCnt는 dropDown 갯수, gubun은 수정,삭제 구분, name은 input value 세팅
    function createDropdownContent(dropDownCnt,gubun,name,ol_idx,sort_num) {
	
		
	    let html = '';  // 결과 HTML을 저장할 변수	
	    html += `<div data-type="${gubun}" id="dropdown_box_${dropDownCnt}"><h5>드롭다운 메뉴</h5>`;
	    html += `<table class="moduleTable">`;
	    html += `    <tbody>`;
	    html += `        <tr>`;
	    html += `            <td>속성명</td>`;
	    html += `            <td><input type="text"  data-type='dropdown' data-ol_idx="${ol_idx}" value="${name}" placeholder="속성명을 입력하세요." class="attributeName"></td>`;
	    html += `        </tr>`;
	   	html += `        <tr>`;
	    html += `            <td>출력순번</td>`;
	    html += `            <td><input type="text"  data-type='dropdown' value="${sort_num}" placeholder="순번을 정해주세요." class="sortNum"></td>`;
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
	    if(gubun=="create"){
	    html += `    <button class="createCancle" onclick="javascript:removeOptionBox('dropdown_box_${dropDownCnt}');" data-action="cancel">취소</button>`;
	    }
	    html += `</div></div>`;
	
	    return html;  // 생성된 HTML을 리턴

  
    }



	// data input 추가	
	function createDataInput(){
		dataInputCnt=dataInputCnt+1;
		let html=createDataInputContent(dataInputCnt,"create","","");
		$("#optionsBody").append(html);
	}
	
    function createDataInputContent(dataInputCnt,gubun,name,ol_idx,sort_num) {
    
    	
		let html = '';  // 결과 HTML을 저장할 변수
		html += `<div data-type="${gubun}" id="data_input_box_${dataInputCnt}"><h5>데이터 입력 필드</h5>`;
		html += `<table class="moduleTable">`;
		html += `    <tbody>`;
		html += `        <tr>`;
		html += `            <td>속성명</td>`;
		html += `            <td><input type="text" data-type='dataInput' data-ol_idx="${ol_idx}"  value="${name}" placeholder="속성명을 입력하세요." class="attributeName"></td>`;
		html += `        </tr>`;
		html += `        <tr>`;
	    html += `            <td>출력순번</td>`;
	    html += `            <td><input type="text" data-type='dataInput' value="${sort_num}" placeholder="순번을 정해주세요." class="sortNum"></td>`;
	    html += `        </tr>`;
		html += `    </tbody>`;
		html += `</table>`;
		html += `<div class="createBtn">`;
		if(gubun=="create"){
		html += `    <button class="createCancle" onclick="javascript:removeOptionBox('data_input_box_${dataInputCnt}');" data-action="cancel">취소</button>`;
		}
		html += `</div></div>`;
	
		return html;  // 생성된 HTML을 리턴
    }
    
    
    function createDateInput(gubun,name){
		dateInputCnt=dateInputCnt+1;
		let html=createDateInputContent(dateInputCnt,"create","","");
		$("#optionsBody").append(html);
	}

    function createDateInputContent(dateInputCnt,gubun,name,ol_idx,sort_num) {

		let html = '';  // 결과 HTML을 저장할 변수
	
		html += `<div data-type="${gubun}" id="date_input_box_${dateInputCnt}"><h5>날짜 입력 위젯</h5>`;
		html += `<table class="moduleTable">`;
		html += `    <tbody>`;
		html += `        <tr>`;
		html += `            <td>속성명</td>`;
		html += `            <td><input type="text" data-type='dateInput' data-ol_idx="${ol_idx}" value="${name}" placeholder="속성명을 입력하세요." class="attributeName"></td>`;
		html += `        </tr>`;
		html += `        <tr>`;
	    html += `            <td>출력순번</td>`;
	    html += `            <td><input type="text" data-type='dateInput'  value="${sort_num}" placeholder="순번을 정해주세요."  class="sortNum"></td>`;
	    html += `        </tr>`;
		html += `    </tbody>`;
		html += `</table>`;
		html += `<div class="createBtn">`;
		if(gubun=="create"){
		html += `    <button class="createCancle" onclick="javascript:removeOptionBox('date_input_box_${dateInputCnt}');" data-action="cancel">취소</button>`;	
		}
		html += `</div></div>`;
	
		return html;  // 생성된 HTML을 리턴


    }
    

	// 다이나믹 옵션값 데이터 수집
	function collectDynamicOptions() {
	    let optionDataList = [];
	
	    // 드롭다운, 데이터 입력, 날짜 입력 필드를 모두 선택
	    $("#optionsBody").children().each(function() {
	        let optionData = {
	            type: $(this).find('input').data('type'),                 // input의 data-type 속성 값
	            gubun: $(this).data('type'),
	            ol_idx:$(this).find('input').data('ol_idx'),
	            attributeName: $(this).find('.attributeName').val(),       // 속성명 input의 값
	            sortNum: $(this).find('.sortNum').val(),                  // 순번 input의 값
	            options: []                                                // 옵션 리스트 텍스트 수집
	        };
			console.log(optionData);
			alert(optionData.sortNum);
	        // 옵션 리스트가 있는 경우에만 수집
	        $(this).find('.option-list .chip').each(function() {
	            let optionText = $(this).text().trim().replace('×', '');  // chip 텍스트에서 '×' 제거
	            let ov_idx=$(this).attr("data-ov_idx");
	            
	            if(optionData.gubun=="create"){
	            	optionData.options.push(optionText.trim());
	            } else {
	            	optionData.options.push({"ol_value":optionText.trim(),"ov_idx":ov_idx});
	            }
	            
	        });
	
	        optionDataList.push(optionData);
	    });
	
	    console.log(optionDataList); // 수집된 데이터를 확인하기 위해 출력
	    return optionDataList;        // 수집된 데이터를 리턴
	}


	function removeOptionBox(box_id){
		$("#"+box_id).remove();
	}  

    function addDropdownOption(idx) {
    	
        let optionValue = $("#select_label_"+idx).val();       
        if (!optionValue) return;
  		addChip(optionValue,idx,'')
        $("#select_label_"+idx).val('');
    }

   
     // Chip 추가 함수(텍스트, dropDownIdx, ov_idx)
	function addChip(value,idx,ov_idx) {
		const chip = $(`
                <div class="chip" data-ov_idx="${ov_idx}">
                	<span class="chip-text">${value}</span>
                    <span class="close">&times;</span>
                </div>
        `);
		
		$("#select_option_"+idx).append(chip);
  
        // Chip의 닫기 버튼 이벤트 핸들러
        chip.find('.close').click(function() {
        	$(this).parent().remove();  // 클릭한 chip을 삭제
        });
        
        // Chip 클릭 시 텍스트 수정
  		chip.on('click', '.chip-text', function() {
	        const currentText = $(this).text();
	        const input = $('<input type="text" class="form-control" />');
	        input.val(currentText);
	
	        $(this).replaceWith(input);
	        input.focus();
	
	        // Enter 키를 누르면 변경된 텍스트 적용
	        input.on('keypress', function(e) {
	            if (e.which === 13) {  // Enter 키
	                const newText = $(this).val().trim();
	                const newSpan = $('<span class="chip-text"></span>').text(newText);
	                $(this).replaceWith(newSpan);
	            }
	        });
	
	        // 입력 필드에서 포커스가 나가면 기존 텍스트로 되돌림
	        input.on('blur', function() {
	            const newText = $(this).val().trim();
	            const newSpan = $('<span class="chip-text"></span>').text(newText);
	            $(this).replaceWith(newSpan);
	        });
	    });
	}

    

   

    function modifyOption(optionElement) {
        // 수정 로직 구현
        console.log('수정 기능 구현 필요');
        console.log(1111111111111111111111111111);
        
        console.log("optionElement", optionElement);
        
    }

    function deleteOption(optionElement) {
        if (confirm('정말로 이 옵션을 삭제하시겠습니까?')) {
            
        }
    }
    
    
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
        makeRequest('get', `${defaultUrl}/with/openCategory`)
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
               	
               	
               	//게시판 정보 가져오기
			    let bidx=params.get("bidx");
			    getBoardInfo(bidx);
			    
            
            })
            .catch(error => handleError(error, '생성 가능한 카테고리 목록을 불러오는 데 실패했습니다.'));
    }



    

    



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
    
    
    // 게시판 정보 가져오기
	function getBoardInfo(bidx){
		const atoken = localStorage.getItem('accessToken');
		let sendData={ "bidx" : bidx };
		$.ajax({
			url: defaultUrl + "/with/board/info"
			, type: "get"
			, data: sendData
			, headers: {
				"Authorization": "Bearer " + atoken
			}
			, success: function(item) {
				console.log("board_info");
				console.log(item);
				
				//게시판 정보 세팅
				
				
				$("#selectCategory").val(item.data.category_idx);
				$("#asis_cate_idx").val(item.data.category_idx);
				$(".boardName").val(item.data.board_name);
				$("#boardDesc").val(item.data.board_desc);
				$('input[name="boardType"][value="'+item.data.board_type+'"]').prop('checked', true);
				$('input[name="likeOption"][value="'+item.data.like_set+'"]').prop('checked', true);
				
				$("#board_idx").val(item.data.board_idx);
				$("#group_idx").val(item.data.group_idx);
				
				let createdElement;
				
				for(let i=0; i<item.data.options.length; i++){
					let opt=item.data.options[i];
					let type=opt.ol_type;
					
					switch (type) {
			            case 'dropdown':
			            	option_list=[];
               	  	
							createdElement = createDropdownContent(dropDownCnt, "update", opt.ol_name, opt.ol_idx, opt.sort_num) 
					        $("#optionsBody").append(createdElement)
					        
					        for(let t=0; t<opt.ol_value.length; t ++){
			            		option_list.push(opt.ol_value[t].ol_value);
			            		addChip(opt.ol_value[t].ol_value, dropDownCnt, opt.ol_value[t].ov_idx);
			            	}  
			                break;
			            case 'dataInput':
			                createdElement = createDataInputContent(dataInputCnt, "update", opt.ol_name, opt.ol_idx, opt.sort_num);
			                $("#optionsBody").append(createdElement)
			                break;
			            case 'dateInput':
			            	
			                createdElement = createDateInputContent(dateInputCnt, "update", opt.ol_name, opt.ol_idx, opt.sort_num);
			                $("#optionsBody").append(createdElement)
			                break;
			        }				       
					
				}
	
				
			}
			, error: function(e) {
				console.log(e)
				console.log(" error :: get board_info");
			}
		});
	
		
	}