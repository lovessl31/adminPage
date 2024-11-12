function getCookieValue(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function deleteCookie(name) {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
}

function updateUI() {
    const accessToken = getCookieValue('accessToken');
    if (accessToken) {
        document.getElementById('loginButtons').style.display = 'none';
        document.getElementById('logoutButton').style.display = 'block';
        document.getElementById('userInfo').style.display = 'block';
    } else {
        document.getElementById('loginButtons').style.display = 'none';
        document.getElementById('logoutButton').style.display = 'none';
        document.getElementById('userInfo').style.display = 'none';
    }
}

// 로그아웃 함수
function logout() {
    // 쿠키 삭제
    deleteCookie('accessToken');
    deleteCookie('refreshToken');

    // UI 업데이트
    updateUI();

    // 페이지 리디렉션
    window.location.href = '/index.html';
}

// 페이지 로드 시 UI 업데이트
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    document.getElementById('logoutButton').addEventListener('click', logout);
});