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
    textarea.addEventListener('input', function () {
        updateExpandIconVisibility();
    });

    // 리사이즈 이벤트에도 아이콘 표시 여부 업데이트
    window.addEventListener('resize', updateExpandIconVisibility);

    function updateExpandIconVisibility() {
        if (textarea.scrollHeight > textarea.clientHeight) {
            expandIcon.style.display = 'block';
        } else {
            expandIcon.style.display = 'none';
        }
    }

    // 확장 아이콘 클릭 시 팝업 열기
    expandIcon.addEventListener('click', function () {
        popupText.value = textarea.value;
        popup.classList.add('active');
        adjustPopupSize();
    });

    // 팝업 닫기 버튼
    popupClose.addEventListener('click', function () {
        popup.classList.remove('active');
    });

    // 팝업 외부 클릭 시 닫기
    window.addEventListener('click', function (event) {
        // console.log(event.target);        
        if (![popup, expandIcon, textarea, popupText].some(el => el.contains(event.target))) {
            popup.classList.remove('active');
        }
    });

    // 팝업 텍스트 변경 시 입력 필드에 반영 및 팝업 크기 조정
    popupText.addEventListener('input', function () {
        textarea.value = popupText.value;
        updateExpandIconVisibility();
        adjustPopupSize();
    });

    // 팝업 크기 조정 함수
    function adjustPopupSize() {
        const maxWidth = window.innerWidth * 0.8;
        const maxHeight = window.innerHeight * 0.8;

        popupText.style.width = 'auto';
        popupText.style.height = 'auto';

        let width = Math.min(popupText.scrollWidth + 200, maxWidth);
        let height = Math.min(popupText.scrollHeight - 100, maxHeight);

        popup.style.width = `${width}px`;
        popup.style.height = `${height}px`;

        popupText.style.width = `${width - 70}px`;
        popupText.style.height = `${height}px`;
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
        const options = document.getElementById
        console.log(111111111111111111);
        console.log("선택된 카테고리: ", selectedOption);
        console.log("선택된 카테고리 구분: ", categoryType);
        console.log(boardName, boardDescription, boardType, likeSet, options);
        console.log(9999999999999999);

        // 요청할 폼 데이터
        const formData = new FormData();
        formData.append('board_name', boardName); // 게시판 이름
        formData.append('board_desc', boardDescription); // 게시판 설명
        formData.append('board_type', boardType); // 게시판 유형 (L 또는 P)
        formData.append('LikeSet', likeSet); // 승인여부 (Y 또는 N)
        formData.append('option', options); // 옵션 값

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
                let userResponse = confirm("게시판이 등록 되었습니다 추가로 작업하시겠습니까?");
                if (userResponse) {
                    console.log("사용자가 '예'를 선택했습니다.");
                    location.reload();
                } else {
                    console.log("사용자가 '아니오'를 선택했습니다.");
                    location.href = 'board.html';
                }

            })
            .catch(error => {
                console.error('게시판 등록 오류:', error.response ? error.response.data : error.message);
                alert('게시판 등록에 실패했습니다.');
            });
    });
})