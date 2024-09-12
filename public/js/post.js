const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');
const defaultUrl = "http://safe.withfirst.com:28888"
let detail_post = []
let detail_conmments = []


document.addEventListener('DOMContentLoaded', () => {
    console.log(
        `postId: ${postId}` // id URL 파라미터 출력
    );

    // 데이터 로드 함수 호출
    loadPostData();
    loadCommentData();
})

function loadPostData() {
    const token = localStorage.getItem('accessToken');    
    const url = `${defaultUrl}/with/postDetail/${postId}`;
    axios.get(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            console.log('성공');
            const data = response.data.data;
                        // 변수에 할당
            detail_post = data;
            console.log("detail_post: ",detail_post);
            
        })
        .catch(error => {
            console.error('Error loading post data:', error.response ? error.response.data : error.message);
        });
}

function loadCommentData() {
    const token = localStorage.getItem('accessToken');    
    const url = `${defaultUrl}/with/post/${postId}/commentList`;
    axios.get(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            console.log('성공');
            const data = response.data.data;
                        // 변수에 할당
            detail_conmments = data;
            console.log("detail_conmments: ", detail_conmments);
            
        })
        .catch(error => {
            console.error('Error loading post data:', error.response ? error.response.data : error.message);
        });
}


