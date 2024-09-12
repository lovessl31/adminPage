document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    

    if (postId) {
        // 수정 모드        
        console.log("수정 페이지");
        
        loadPostData(postId);
    } else {
        
        
    }
});

function loadPostData(postId) {

}