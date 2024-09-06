let posts = [];
let currentPage = 1;
let itemsPerPage = 10;
let totalPage = 1;
let keyword = "";
const urlParams = new URLSearchParams(window.location.search);
const boardId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', () => {
    console.log(
        `boardId: ${boardId}` // id URL 파라미터 출력
    );

    // Axios를 사용하여 해당 게시판의 글 목록을 가져옵니다
    // axios.get(`/api/posts?boardId=${boardId}`)
    //     .then(response => {
    //         // 글 목록 표시 로직
    //     });


    // 데이터 로드 함수 호출
    loadPostData(currentPage);
})



function loadPostData(page = 1) {
    currentPage = page;
    const token = localStorage.getItem('accessToken');
    // const url = `http://safe.withfirst.com:28888/with/postList?option_type=${optionType}&option_value=${optionValue}&per_page=${itemsPerPage}&page=${currentPage}`;
    const url = `http://safe.withfirst.com:28888/with/postList/${boardId}?keyword=${keyword}&per_page=${itemsPerPage}&page=${currentPage}`;
    axios.get(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            console.log('성공');
            const data = response.data.data;
            console.log('데이터값 확인 :', data);

            posts = data;
            console.log(posts);
            console.log(response.data);

            totalPage = response.data.total_page || 1;
            totalCount = `모든 게시판(${response.data.total_count || 0})`
            console.log(totalPage);
            console.log(111111);
            renderTable();
            console.log(222222);

            document.querySelector('thead input[type="checkbox"]').checked = false;
            document.getElementById('post_count').textContent = totalCount;
        })
        .catch(error => {
            console.error('Error loading post data:', error.response ? error.response.data : error.message);
        });
}