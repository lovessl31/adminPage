// 게시판 생성 기능 JS

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

                    console.log("option", option)
                    selectElement.appendChild(option);
                });
            })
            .catch(error => handleError(error, '생성 가능한 카테고리 목록을 불러오는 데 실패했습니다.'));
    }

    selectCagegory();




    // 페이지내 취소 버튼 클릭 시 이전 페이지로 이동하기
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
        // const companyName = document.getElementById('c_name').value.trim();
        // const representativeName = document.getElementById('owner_name').value.trim();
        // const businessNumber = document.getElementById('c_id').value.trim();
        // const status = document.querySelector('input[name="status"]:checked').value;
        // const fileInput = document.getElementById('registerRealFileInput').files[0];
    
        const categoryIdx = document.getElementById('').value
        const boardName = document.getElementById
        const boardDescription = document.getElementById
        const boardType = document.getElementById
        const likeSet = document.getElementById
        const options = document.getElementById

        // 요청할 폼 데이터
        const formData = new FormData();
        formData.append('board_name', boardName); // 게시판 이름
        formData.append('board_desc', boardDescription); // 게시판 설명
        formData.append('board_type', boardType); // 게시판 유형 (L 또는 P)
        formData.append('LikeSet', likeSet); // 승인여부 (Y 또는 N)
        formData.append('option', options); // 옵션 값

        const token = getCookieValue('accessToken'); // 쿠키에서 토큰 가져오기

        // 서버에 POST 요청 보내기
        axios.post('http://192.168.0.18:28888/with/addBoard', formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(response => {
                console.log('게시판 등록 응답:', response.data);
                alert('게시판이 성공적으로 등록 되었습니다.');
                document.getElementById('registerPopup').style.display = 'none';
                // 추가적인 UI 업데이트 작업 수행 가능
                fetchCompanyData(currentPage); // 데이터를 다시 불러와서 갱신
            })
            .catch(error => {
                console.error('게시판 등록 오류:', error.response ? error.response.data : error.message);
                alert('게시판 등록에 실패했습니다.');
            });
    });


})