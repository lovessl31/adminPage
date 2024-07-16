const express = require('express');
const path = require('path'); // path 모듈 추가
const app = express();

// public 디렉토리를 정적 파일로 제공하는 설정 추가
app.use(express.static(path.join(__dirname, 'public')));

// 서버가 응답할 수 있는 기본 경로 설정
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // 실제 파일 전송
});

// 서버가 3000 포트에서 리스닝하도록 설정
app.listen(3000, '0.0.0.0', () => {
    console.log('Server is running on http://localhost:3000');
});
