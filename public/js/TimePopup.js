class TimedPopup {
    constructor(options = {}) {
        this.id = options.id || 'default-popup';
        this.duration = options.duration || 5000;
        this.title = options.title || 'Notification';
        this.content = options.content || '';
        this.backgroundColor = options.backgroundColor === 'suc' ? 'rgb(18,184,134)' : 'rgb(231,76,60)'
        this.onClose = options.onClose || (() => { });
        this.onSelect = options.onSelect || (() => { });

        this.isSelected = false;
        this.popup = null;
        this.timerBar = null;
        this.timer = null;
        this.startTime = Date.now();
        this.isPaused = false;
        this.remainingTime = this.duration;

        console.log('TimedPopup instance created:', options);
    }

    show() {
        console.log('show method called');
        this.createPopup();
        document.body.appendChild(this.popup);
        console.log('Popup appended to body');

        // 애니메이션 트리거를 위한 지연
        setTimeout(() => {
            this.popup.classList.add('show');
        }, 10);

        this.startTimer();
        this.saveState();
    }

    createPopup() {        
            console.log('Creating select popup');
            this.popup = document.createElement('div');            
            this.popup.style.backgroundColor = this.backgroundColor;      

        if (this.onSelect == 'select') {                              
            this.popup.className = 'timed-popup select-popup';
            this.popup.innerHTML = `
            <div class="timer-bar">
                <div class="timer-progress"></div>
            </div>
            <span class="close">&times;</span>
            <div class="title">${this.title}</div>
            <div class="content">${this.content}</div>
            <div class="button-container">
                <button class="yes-popBtn underline-btn" style="width: 50px; margin-right: 5px; margin-bottom: 5px;">예</button>
                <button class="no-popBtn underline-btn" style="width: 50px; margin-right: 5px; margin-bottom: 5px;">아니오</button>
            </div>
        `;
            const closeBtn = this.popup.querySelector('.close');
            closeBtn.addEventListener('click', () => this.close());

            const yesBtn = this.popup.querySelector('.yes-popBtn');
            yesBtn.addEventListener('click', (e) => {                
                // 세션에서 버블링때문에 잔상이 생겨서 버블링 방지
                e.stopPropagation();
                this.isSelected = true;              
                location.reload()  
            });
            const noBtn = this.popup.querySelector('.no-popBtn');
            noBtn.addEventListener('click', (e) => {                
                // 세션에서 버블링때문에 잔상이 생겨서 버블링 방지                
                e.stopPropagation();
                this.isSelected = true;                
                history.back();
            });

            this.timerBar = this.popup.querySelector('.timer-bar');
            this.timerBar.style.backgroundColor = this.backgroundColor;

            console.log('Select popup element created:', this.popup);

        } else {
            this.popup.className = 'timed-popup';            
            this.popup.innerHTML = `
                <div class="timer-bar">
                    <div class="timer-progress"></div>
                </div>
                <span class="close">&times;</span>
                <div class="title">${this.title}</div>
                <div class="content">${this.content}</div>            
            `;

            const closeBtn = this.popup.querySelector('.close');
            closeBtn.addEventListener('click', () => this.close());

            this.timerBar = this.popup.querySelector('.timer-bar');
            this.timerBar.style.backgroundColor = this.backgroundColor;

            console.log('Popup element created:', this.popup);
        }
        // 마우스 이벤트 리스너 추가
        this.popup.addEventListener('mouseenter', () => this.pauseTimer());
        this.popup.addEventListener('mouseleave', () => this.resumeTimer());
    }

    // startTimer() {
    //     const animate = () => {
    //         const elapsed = Date.now() - this.startTime;
    //         const timeLeft = this.duration - elapsed;
    //         if (timeLeft <= 0) {
    //             this.close();
    //         } else {
    //             const width = (timeLeft / this.duration) * 100;
    //             this.popup.querySelector('.timer-progress').style.width = `${width}%`;
    //             this.timer = requestAnimationFrame(animate);
    //         }
    //     };
    //     this.timer = requestAnimationFrame(animate);
    // }
    startTimer() {
        let lastTime = Date.now();
        const animate = () => {
            const currentTime = Date.now();
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            if (!this.isPaused) {
                this.remainingTime -= deltaTime;
            }

            if (this.remainingTime <= 0) {
                this.close();
            } else {
                const width = (this.remainingTime / this.duration) * 100;
                this.popup.querySelector('.timer-progress').style.width = `${width}%`;
                this.timer = requestAnimationFrame(animate);
            }
        };
        this.timer = requestAnimationFrame(animate);
    }

    pauseTimer() {
        this.isPaused = true;
    }

    resumeTimer() {
        this.isPaused = false;
    }

    close() {
        console.log('close method called');
        if (this.popup && this.popup.parentNode) {            
            this.popup.classList.remove('show');
            // 애니메이션이 끝난 후 요소 제거
            setTimeout(() => {
                this.popup.parentNode.removeChild(this.popup);
                console.log('Popup removed from DOM');
                if (this.onSelect === 'select' && !this.isSelected) {
                    // 선택하지 않았고 시간이 초과된 경우 "아니오" 선택       
                    this.onClose();
                    this.clearState();
                    history.back();
                }
                this.onClose();
                this.clearState();
            }, 500); // CSS 트랜지션 시간과 맞춰야 함
        }
        if (this.timer) {            
            cancelAnimationFrame(this.timer);
        }
    }

    saveState() {
        if (this.onSelect !== 'select') {
        const state = {
            id: this.id,
            duration: this.duration,
            title: this.title,
            content: this.content,
            backgroundColor: this.backgroundColor,
            startTime: this.startTime
        };
        sessionStorage.setItem('timedPopup', JSON.stringify(state));
    }
    }
    clearState() {
        sessionStorage.removeItem('timedPopup');
    }

    static restorePopup() {
        const savedState = sessionStorage.getItem('timedPopup');
        if (savedState) {
            const state = JSON.parse(savedState);
            const remainingTime = state.duration - (Date.now() - state.startTime);
            if (remainingTime > 0) {
                const popup = new TimedPopup({
                    id: state.id,
                    duration: remainingTime,
                    title: state.title,
                    content: state.content,
                    backgroundColor: state.backgroundColor === 'rgb(18,184,134)' ? 'suc' : 'err'
                });
                popup.show();
            } else {
                sessionStorage.removeItem('timedPopup');
            }
        }
    }
}

// 전역 객체에 TimedPopup 추가
window.TimedPopup = TimedPopup;
console.log('TimedPopup added to window object');

// 페이지 로드 시 팝업 복원
window.addEventListener('load', TimedPopup.restorePopup);