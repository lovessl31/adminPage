function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name) {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
}

async function sendCredentials() {
    const user_id = document.getElementById('username').value;
    const user_pw = document.getElementById('password').value;

    const formData = new FormData();
    formData.append('user_id', user_id);
    formData.append('user_pw', user_pw);

    try {
        const response = await axios({
            method: 'post',
            url: 'http://safe.withfirst.com:28888/with/login',
            data: formData,
            withCredentials: true // 서버가 설정한 쿠키를 자동으로 포함합니다.
        });

        // 전체 응답을 콘솔에 출력
        console.log('Login response:', response);
        console.log('로그인데이터:', response.data);

        // 토큰 추출
        const accessToken = response.data.data.accessToken;
        const refreshToken = response.data.data.refreshToken;


        console.log('토큰데이터', accessToken);
        console.log('토큰데이터', refreshToken);

        if (accessToken && refreshToken) {
            // 쿠키에 토큰 저장
            setCookie('accessToken', accessToken, 1); // 1일 후 만료
            setCookie('refreshToken', refreshToken, 3); // 3일 후 만료
            console.log('Tokens are stored in cookies.');

            // 로그인 성공 시 UI 업데이트
            document.getElementById('loginButtons').style.display = 'none';
            document.getElementById('logoutButton').style.display = 'block';
            document.getElementById('userInfo').style.display = 'block';

 
            // 로그인 성공 시 index.html로 리디렉션
            window.location.href = 'company.html';
        } else {
            throw new Error('Token not provided by server');
        }
    } catch (error) {
        console.error('Login error:', error);

        if (error.response && error.response.status === 401) {
            // 401 에러 시 로그아웃 처리
            logout();
        } else {
            console.error('An unexpected error occurred:', error);
        }
    }
}

// 로그아웃 함수
function logout() {
    // 쿠키 삭제
    deleteCookie('accessToken');
    deleteCookie('refreshToken');

    // UI 업데이트
    document.getElementById('loginButtons').style.display = 'block';
    document.getElementById('logoutButton').style.display = 'none';
    document.getElementById('userInfo').style.display = 'none';

    // 페이지 리디렉션
    window.location.href = 'login.html';
}

// 로그아웃 함수를 전역에서 접근할 수 있도록 설정
window.logout = logout;

// 페이지 로드 시 데이터 로드
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-button').addEventListener('click', sendCredentials);
    document.getElementById('logoutButton').addEventListener('click', logout);
});