// script.js
class NiuMaCalculator {
    constructor() {
        this.settings = {
            title: '老板',
            style: 'humorous',
            salary: '',
            hours: ''
        };
        
        this.currentAmount = 0;
        this.perSecondRate = 0;
        this.timer = null;
        this.isRunning = false;
        this.startTime = null;
        this.lastUpdateTime = null;
        
        this.initializeElements();
        this.loadSettings();
        this.bindEvents();
    }

    initializeElements() {
        this.salaryInput = document.getElementById('salary');
        this.hoursInput = document.getElementById('hours');
        this.startBtn = document.getElementById('startBtn');
        this.offDutyBtn = document.getElementById('offDutyBtn');
        this.petContainer = document.getElementById('petContainer');
        this.messageBox = document.getElementById('messageBox');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.titleSelect = document.getElementById('titleSelect');
        this.styleSelect = document.getElementById('styleSelect');
        this.saveSettingsBtn = document.getElementById('saveSettings');
        this.perSecondElement = document.getElementById('perSecond');
        this.digitElements = Array.from(document.querySelectorAll('.digit'));
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('niuMaSettings');
        if (savedSettings) {
            this.settings = JSON.parse(savedSettings);
            this.updateSettingsUI();
            this.calculateRate();
        }
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.toggleCounter());
        this.offDutyBtn.addEventListener('click', () => this.stopCounter());
        this.settingsBtn.addEventListener('click', () => this.showSettings());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.salaryInput.addEventListener('input', () => this.calculateRate());
        this.hoursInput.addEventListener('input', () => this.calculateRate());
    }

    calculateRate() {
        const salary = parseFloat(this.salaryInput.value);
        const hours = parseFloat(this.hoursInput.value);

        if (salary && hours) {
            // 计算每秒收入（假设每月22个工作日）
            // 月薪 / (22个工作日 * 每天工作小时数 * 3600秒)
            this.perSecondRate = (salary / (22 * hours * 3600));
            this.perSecondElement.textContent = this.perSecondRate.toFixed(4); // 显示每秒收入
        } else {
            this.perSecondRate = 0;
            this.perSecondElement.textContent = '0.00';
        }
    }

    updateDisplay(amount) {
        const amountStr = amount.toFixed(2);
        const [integerPart, decimalPartRaw] = amountStr.split('.');
        
        // 处理整数部分，固定5位数字
        const integerDigits = integerPart.padStart(5, '0').split('');
        integerDigits.forEach((digit, index) => {
            if (this.digitElements[index].textContent !== digit) {
                this.digitElements[index].classList.remove('updating');
                void this.digitElements[index].offsetWidth; // 触发重绘
                this.digitElements[index].textContent = digit;
                this.digitElements[index].classList.add('updating');
            }
        });

        // 处理小数部分
        const [jiao, fen] = decimalPartRaw.split('');  // 直接解构为角和分

        // 更新角位显示（小数点后第一位）
        if (this.digitElements[5].textContent !== jiao) {
            this.digitElements[5].classList.remove('updating');
            void this.digitElements[5].offsetWidth;
            this.digitElements[5].textContent = jiao;
            this.digitElements[5].classList.add('updating');
        }

        // 更新分位显示（小数点后第二位）
        if (this.digitElements[6].textContent !== fen) {
            this.digitElements[6].classList.remove('updating');
            void this.digitElements[6].offsetWidth;
            this.digitElements[6].textContent = fen;
            this.digitElements[6].classList.add('updating');
        }
    }

    toggleCounter() {
        if (!this.isRunning) {
            this.startCounter();
        } else {
            this.pauseCounter();
        }
    }

    startCounter() {
        if (this.perSecondRate <= 0) {
            this.showError('请先在设置中填写有效的月薪和工作时长！');
            return;
        }

        this.isRunning = true;
        this.startBtn.textContent = '暂停';
        this.startBtn.classList.add('active');
        if (!this.startTime) {
            this.startTime = performance.now();
        }
        this.lastUpdateTime = performance.now();

        // 使用 performance.now() 计算实际经过时间
        this.timer = setInterval(() => {
            const currentTime = performance.now();
            const elapsedSeconds = (currentTime - this.lastUpdateTime) / 1000;
            this.currentAmount += this.perSecondRate * elapsedSeconds;
            this.lastUpdateTime = currentTime;
            this.updateDisplay(this.currentAmount);
        }, 100);
    }

    pauseCounter() {
        this.isRunning = false;
        this.startBtn.textContent = '继续';
        this.startBtn.classList.remove('active');
        clearInterval(this.timer);
        // 保存最后更新时间
        this.lastUpdateTime = performance.now();
    }

    stopCounter() {
        if (!this.startTime) {
            this.showError('请先开始上班！');
            return;
        }

        this.isRunning = false;
        this.startBtn.textContent = '摸鱼';
        this.startBtn.classList.remove('active');
        clearInterval(this.timer);

        // 计算工作时长
        const endTime = performance.now();
        const workTime = Math.floor((endTime - this.startTime) / 1000); // 转换为秒
        const hours = Math.floor(workTime / 3600);
        const minutes = Math.floor((workTime % 3600) / 60);
        const seconds = workTime % 60;
        
        // 显示最终金额和工作时长
        this.showMessage(this.currentAmount.toFixed(2), {
            hours,
            minutes,
            seconds
        });
        
        // 重置计数器
        this.currentAmount = 0;
        this.updateDisplay(0);
        this.startTime = null;
        this.lastUpdateTime = null;
    }

    showMessage(amount, workTime) {
        let timeStr = '';
        if (workTime.hours > 0) {
            timeStr += `${workTime.hours}小时`;
        }
        if (workTime.minutes > 0) {
            timeStr += `${workTime.minutes}分`;
        }
        if (workTime.seconds > 0 || timeStr === '') {
            timeStr += `${workTime.seconds}秒`;
        }

        const messages = {
            humorous: [
                `${this.settings.title}，你太棒了，工作了${timeStr}，赚了 ${amount} 人民币`,
                `${this.settings.title}，今天又是充实的一天，工作了${timeStr}，赚了 ${amount} 人民币`
            ],
            formal: [
                `${this.settings.title}，本次工作${timeStr}，收入 ${amount} 人民币`,
                `${this.settings.title}，今日工作${timeStr}，收入 ${amount} 人民币`
            ],
            cute: [
                `${this.settings.title}，好厉害哦，工作了${timeStr}，赚了 ${amount} 人民币呢`,
                `${this.settings.title}，今天辛苦了，工作了${timeStr}，赚了 ${amount} 人民币`
            ]
        };

        const messageList = messages[this.settings.style];
        const message = messageList[Math.floor(Math.random() * messageList.length)];

        this.messageBox.textContent = message;
        this.petContainer.classList.add('active');
        this.messageBox.classList.add('show');

        setTimeout(() => {
            this.petContainer.classList.remove('active');
            this.messageBox.classList.remove('show');
        }, 5000);
    }

    showError(message) {
        this.messageBox.textContent = message;
        this.messageBox.classList.add('show');
        setTimeout(() => {
            this.messageBox.classList.remove('show');
        }, 3000);
    }

    showSettings() {
        this.settingsModal.style.display = 'block';
    }

    saveSettings() {
        this.settings = {
            title: this.titleSelect.value,
            style: this.styleSelect.value,
            salary: this.salaryInput.value,
            hours: this.hoursInput.value
        };

        localStorage.setItem('niuMaSettings', JSON.stringify(this.settings));
        this.updateSettingsUI();
        this.calculateRate();
        this.settingsModal.style.display = 'none';
    }

    updateSettingsUI() {
        this.titleSelect.value = this.settings.title;
        this.styleSelect.value = this.settings.style;
        this.salaryInput.value = this.settings.salary;
        this.hoursInput.value = this.settings.hours;
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new NiuMaCalculator();
});