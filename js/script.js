    /**
     * THỢ LẶN ĐẠI DƯƠNG - DEEP SEA DIVER
     * Game nonstop phong cách hoạt hình (Cartoon) với HTML5 Canvas, CSS & JS thuần
     * Tính năng: Độ sâu tăng theo thời gian thực tế (khoảng 30 giây = 5 mét)
     */

    (function () {
        'use strict';

        // === CÁC THÀNH PHẦN DOM ===
        const gameContainer = document.getElementById('gameContainer');
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const starCountEl = document.getElementById('starCount');
        const depthCountEl = document.getElementById('depthCount');
        const btnSound = document.getElementById('btnSound');
        const btnPause = document.getElementById('btnPause');

        const startScreen = document.getElementById('startScreen');
        const pauseScreen = document.getElementById('pauseScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');

        const btnPlay = document.getElementById('btnPlay');
        const btnResume = document.getElementById('btnResume');
        const btnRestartFromPause = document.getElementById('btnRestartFromPause');
        const btnRestart = document.getElementById('btnRestart');

        const startHighScoreEl = document.getElementById('startHighScore');
        const startMaxDepthEl = document.getElementById('startMaxDepth');
        const finalStarsEl = document.getElementById('finalStars');
        const finalDepthEl = document.getElementById('finalDepth');
        const finalScoreEl = document.getElementById('finalScore');
        const newBestBadge = document.getElementById('newBestBadge');

        const btnLeft = document.getElementById('btnLeft');
        const btnRight = document.getElementById('btnRight');

        // === TỰ ĐỘNG ĐIỀU CHỈNH KÍCH THƯỚC CANVAS THEO MÀN HÌNH TRÀN VIỀN ===
        function resizeCanvas() {
            const rect = gameContainer.getBoundingClientRect();
            canvas.width = Math.floor(rect.width) || 400;
            canvas.height = Math.floor(rect.height) || 600;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // === HỆ THỐNG ÂM THANH HOẠT HÌNH (WEB AUDIO API) ===
        class SoundEngine {
            constructor() {
                this.ctx = null;
                this.enabled = localStorage.getItem('sea_sound_enabled') !== 'false';
                this.updateIcon();
            }

            init() {
                if (!this.ctx) {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    if (AudioContext) {
                        this.ctx = new AudioContext();
                    }
                }
                if (this.ctx && this.ctx.state === 'suspended') {
                    this.ctx.resume();
                }
            }

            toggle() {
                this.enabled = !this.enabled;
                localStorage.setItem('sea_sound_enabled', this.enabled);
                this.updateIcon();
                if (this.enabled) {
                    this.init();
                    this.playStar();
                }
            }

            updateIcon() {
                btnSound.textContent = this.enabled ? '🔊' : '🔇';
            }

            // Âm thanh bọt nước bơi
            playSwim() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;

                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const now = this.ctx.currentTime;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(220 + Math.random() * 80, now);
                osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);

                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + 0.12);
            }

            // Âm thanh nhặt sao vàng "ting!"
            playStar() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;

                const now = this.ctx.currentTime;
                
                const osc1 = this.ctx.createOscillator();
                const gain1 = this.ctx.createGain();
                osc1.type = 'triangle';
                osc1.frequency.setValueAtTime(880, now); // A5
                gain1.gain.setValueAtTime(0.2, now);
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc1.connect(gain1);
                gain1.connect(this.ctx.destination);
                osc1.start(now);
                osc1.stop(now + 0.15);

                const osc2 = this.ctx.createOscillator();
                const gain2 = this.ctx.createGain();
                osc2.type = 'triangle';
                osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6
                gain2.gain.setValueAtTime(0.25, now + 0.08);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc2.connect(gain2);
                gain2.connect(this.ctx.destination);
                osc2.start(now + 0.08);
                osc2.stop(now + 0.3);
            }

            // Âm thanh va chạm vỡ đá
            playCrash() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;

                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + 0.35);
            }

            // Giai điệu bắt đầu game
            playStart() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;

                const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
                notes.forEach((freq, i) => {
                    const now = this.ctx.currentTime + i * 0.08;
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now);
                    gain.gain.setValueAtTime(0.18, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.2);
                });
            }
        }

        const sound = new SoundEngine();

        // === CÁC BIẾN TRẠNG THÁI GAME ===
        const STATE = {
            START: 'START',
            PLAYING: 'PLAYING',
            PAUSED: 'PAUSED',
            GAMEOVER: 'GAMEOVER'
        };

        let currentState = STATE.START;
        let score = 0;
        let starsCollected = 0;
        let depthMeters = 0; // Độ sâu tính bằng mét (30s = 5m)
        let playTimeMs = 0;  // Thời gian chơi thực tế (mili-giây)
        let lastTimestamp = 0;

        let gameSpeed = 2.4; // Tốc độ trôi cảnh vật đi lên
        const baseSpeed = 2.4;
        const maxSpeed = 5.2;
        let frameCount = 0;

        let highScore = parseInt(localStorage.getItem('sea_high_score')) || 0;
        let maxDepth = parseFloat(localStorage.getItem('sea_max_depth')) || 0;

        // Cập nhật điểm kỷ lục lúc mở đầu
        startHighScoreEl.textContent = highScore;
        startMaxDepthEl.textContent = maxDepth.toFixed(1);

        // === HỆ THỐNG ĐIỀU KHIỂN (CONTROLS) ===
        const keys = {
            left: false,
            right: false
        };

        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                keys.left = true;
                btnLeft.classList.add('active');
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                keys.right = true;
                btnRight.classList.add('active');
            }
            if (e.key === ' ' || e.key === 'Spacebar') {
                if (currentState === STATE.START) startGame();
                else if (currentState === STATE.GAMEOVER) restartGame();
                else if (currentState === STATE.PLAYING) pauseGame();
                else if (currentState === STATE.PAUSED) resumeGame();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                keys.left = false;
                btnLeft.classList.remove('active');
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                keys.right = false;
                btnRight.classList.remove('active');
            }
        });

        // Xử lý nút cảm ứng Trái / Phải
        function setupTouchButton(btn, direction) {
            const start = (e) => {
                e.preventDefault();
                sound.init();
                keys[direction] = true;
                btn.classList.add('active');
            };
            const end = (e) => {
                e.preventDefault();
                keys[direction] = false;
                btn.classList.remove('active');
            };

            btn.addEventListener('mousedown', start);
            btn.addEventListener('mouseup', end);
            btn.addEventListener('mouseleave', end);
            btn.addEventListener('touchstart', start, { passive: false });
            btn.addEventListener('touchend', end, { passive: false });
            btn.addEventListener('touchcancel', end, { passive: false });
        }

        setupTouchButton(btnLeft, 'left');
        setupTouchButton(btnRight, 'right');

        // Chạm trực tiếp vào nửa trái/phải màn hình Canvas
        canvas.addEventListener('touchstart', (e) => {
            if (currentState !== STATE.PLAYING) return;
            const rect = canvas.getBoundingClientRect();
            for (let i = 0; i < e.touches.length; i++) {
                const touchX = e.touches[i].clientX - rect.left;
                if (touchX < rect.width / 2) {
                    keys.left = true;
                    btnLeft.classList.add('active');
                } else {
                    keys.right = true;
                    btnRight.classList.add('active');
                }
            }
        }, { passive: true });

        canvas.addEventListener('touchend', () => {
            keys.left = false;
            keys.right = false;
            btnLeft.classList.remove('active');
            btnRight.classList.remove('active');
        }, { passive: true });

        // === LỚP NHÂN VẬT: THỢ LẶN HOẠT HÌNH (DIVER) ===
        class Diver {
            constructor() {
                this.x = canvas.width / 2;
                this.y = Math.min(140, canvas.height * 0.22);
                this.width = 44;
                this.height = 54;
                this.vx = 0;
                this.speed = 5.6;
                this.friction = 0.88;
                this.tilt = 0;
                this.flipperAngle = 0;
                this.bubbleTimer = 0;
                this.radius = 18;
            }

            reset() {
                this.x = canvas.width / 2;
                this.y = Math.min(140, canvas.height * 0.22);
                this.vx = 0;
                this.tilt = 0;
                this.flipperAngle = 0;
                this.bubbleTimer = 0;
            }

            update() {
                if (keys.left) {
                    this.vx -= 0.85;
                    if (Math.random() < 0.1) sound.playSwim();
                }
                if (keys.right) {
                    this.vx += 0.85;
                    if (Math.random() < 0.1) sound.playSwim();
                }

                this.vx = Math.max(-this.speed, Math.min(this.speed, this.vx));
                this.x += this.vx;
                this.vx *= this.friction;

                const targetTilt = (this.vx / this.speed) * 0.45;
                this.tilt += (targetTilt - this.tilt) * 0.18;

                const margin = 24;
                if (this.x < margin) {
                    this.x = margin;
                    this.vx = 0;
                } else if (this.x > canvas.width - margin) {
                    this.x = canvas.width - margin;
                    this.vx = 0;
                }

                this.flipperAngle += 0.18;

                this.bubbleTimer++;
                if (this.bubbleTimer % 7 === 0) {
                    particles.push(new BubbleParticle(
                        this.x - Math.sin(this.tilt) * 15,
                        this.y - 12,
                        (Math.random() - 0.5) * 0.8,
                        -1.5 - Math.random() * 1.5,
                        2 + Math.random() * 3.5,
                        'rgba(255, 255, 255, 0.75)'
                    ));
                }
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.tilt);

                // 1. Chân vịt bơi (Flippers)
                const kick1 = Math.sin(this.flipperAngle) * 8;
                const kick2 = -Math.sin(this.flipperAngle) * 8;

                ctx.fillStyle = '#ff4757';
                ctx.strokeStyle = '#130f40';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.ellipse(-10, -22 + kick1, 6, 12, -0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.ellipse(10, -22 + kick2, 6, 12, 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // 2. Bình dưỡng khí sau lưng (Scuba Tank)
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.roundRect(-8, -14, 16, 26, 6);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#e67e22';
                ctx.fillRect(-8, -4, 16, 4);

                // 3. Thân thợ lặn (Diving Suit)
                ctx.fillStyle = '#ff6b35';
                ctx.beginPath();
                ctx.roundRect(-15, -12, 30, 32, 12);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#2f3542';
                ctx.fillRect(-15, 0, 30, 4);

                // 4. Mũ lặn hình tròn & Kính lặn (Helmet & Visor)
                ctx.fillStyle = '#feca57';
                ctx.beginPath();
                ctx.arc(0, 10, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#48dbfb';
                ctx.beginPath();
                ctx.arc(0, 12, 11, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.ellipse(-4, 9, 3, 5, -0.4, 0, Math.PI * 2);
                ctx.fill();

                const eyeShiftX = (this.vx / this.speed) * 3;
                ctx.fillStyle = '#130f40';
                ctx.beginPath();
                ctx.arc(-3 + eyeShiftX, 13, 2.5, 0, Math.PI * 2);
                ctx.arc(3 + eyeShiftX, 13, 2.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(-3.5 + eyeShiftX, 12, 1, 0, Math.PI * 2);
                ctx.arc(2.5 + eyeShiftX, 12, 1, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }
        }

        const diver = new Diver();

        // === HỆ THỐNG CHƯỚNG NGẠI VẬT: TẢNG ĐÁ NGẦM (ROCKS) ===
        class RockObstacle {
            constructor(y, type = 'gap') {
                this.y = y;
                this.height = 42;
                this.passed = false;
                this.type = type;
                this.rocks = [];
                this.generate();
            }

            generate() {
                const minGap = Math.max(115, canvas.width * 0.28);
                const gapWidth = minGap + Math.random() * 35;

                if (this.type === 'gap') {
                    const gapX = 30 + Math.random() * (canvas.width - gapWidth - 60);
                    
                    this.rocks.push({
                        x: 0,
                        y: 0,
                        width: gapX,
                        height: this.height,
                        color: '#34495e',
                        accent: '#2c3e50',
                        side: 'left',
                        decor: Math.random() > 0.4 ? 'coral' : 'seaweed'
                    });

                    this.rocks.push({
                        x: gapX + gapWidth,
                        y: 0,
                        width: canvas.width - (gapX + gapWidth),
                        height: this.height,
                        color: '#34495e',
                        accent: '#2c3e50',
                        side: 'right',
                        decor: Math.random() > 0.4 ? 'coral' : 'seaweed'
                    });

                    if (Math.random() < 0.75) {
                        stars.push(new Star(gapX + gapWidth / 2, this.y + this.height / 2));
                    }

                } else if (this.type === 'center') {
                    const rockWidth = Math.min(130, canvas.width * 0.32) + Math.random() * 30;
                    const rockX = (canvas.width - rockWidth) / 2 + (Math.random() * 40 - 20);

                    this.rocks.push({
                        x: rockX,
                        y: 0,
                        width: rockWidth,
                        height: this.height * 1.2,
                        color: '#2f3542',
                        accent: '#1e272e',
                        side: 'center',
                        decor: 'coral'
                    });

                    const starX = Math.random() > 0.5 ? rockX / 2 : (rockX + rockWidth + canvas.width) / 2;
                    stars.push(new Star(starX, this.y + this.height / 2));
                }
            }

            update() {
                this.y -= gameSpeed;
            }

            draw() {
                this.rocks.forEach(rock => {
                    const rx = rock.x;
                    const ry = this.y + rock.y;
                    const rw = rock.width;
                    const rh = rock.height;

                    ctx.save();
                    ctx.fillStyle = rock.color;
                    ctx.strokeStyle = '#130f40';
                    ctx.lineWidth = 3.5;

                    ctx.beginPath();
                    ctx.roundRect(rx, ry, rw, rh, [12, 12, 12, 12]);
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                    ctx.beginPath();
                    ctx.roundRect(rx + 4, ry + 4, rw - 8, rh * 0.35, 6);
                    ctx.fill();

                    if (rock.decor === 'coral') {
                        ctx.fillStyle = '#ff4757';
                        ctx.beginPath();
                        const decorX = rx + (rock.side === 'right' ? 14 : (rock.side === 'left' ? rw - 20 : rw / 2));
                        ctx.arc(decorX, ry - 3, 7, 0, Math.PI * 2);
                        ctx.arc(decorX + 6, ry - 7, 5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = '#130f40';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    } else if (rock.decor === 'seaweed') {
                        ctx.fillStyle = '#2ed573';
                        const decorX = rx + (rock.side === 'right' ? 18 : (rock.side === 'left' ? rw - 24 : rw / 2));
                        ctx.beginPath();
                        ctx.ellipse(decorX, ry - 6, 4, 12, 0.2, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    ctx.restore();
                });
            }

            checkCollision(diver) {
                for (let rock of this.rocks) {
                    const rx = rock.x;
                    const ry = this.y + rock.y;
                    const rw = rock.width;
                    const rh = rock.height;

                    const closestX = Math.max(rx, Math.min(diver.x, rx + rw));
                    const closestY = Math.max(ry, Math.min(diver.y, ry + rh));

                    const distX = diver.x - closestX;
                    const distY = diver.y - closestY;
                    const distanceSquared = distX * distX + distY * distY;

                    if (distanceSquared < (diver.radius * 0.85) * (diver.radius * 0.85)) {
                        return true;
                    }
                }
                return false;
            }
        }

        let obstacles = [];

        // === HỆ THỐNG ĐIỂM THƯỞNG: NGÔI SAO VÀNG (STARS) ===
        class Star {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.radius = 15;
                this.collected = false;
                this.angle = Math.random() * Math.PI;
                this.sparklePhase = Math.random() * Math.PI * 2;
            }

            update() {
                this.y -= gameSpeed;
                this.angle += 0.04;
                this.sparklePhase += 0.08;
            }

            draw() {
                if (this.collected) return;

                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(Math.sin(this.angle) * 0.2);

                const glowSize = 18 + Math.sin(this.sparklePhase) * 4;
                const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, glowSize);
                grad.addColorStop(0, 'rgba(255, 221, 89, 0.7)');
                grad.addColorStop(1, 'rgba(255, 221, 89, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffdd59';
                ctx.strokeStyle = '#d35400';
                ctx.lineWidth = 2.5;

                ctx.beginPath();
                const spikes = 5;
                const outerRadius = 14;
                const innerRadius = 7;
                let rot = (Math.PI / 2) * 3;
                let cx = 0;
                let cy = 0;
                const step = Math.PI / spikes;

                ctx.moveTo(cx, cy - outerRadius);
                for (let i = 0; i < spikes; i++) {
                    cx = Math.cos(rot) * outerRadius;
                    cy = Math.sin(rot) * outerRadius;
                    ctx.lineTo(cx, cy);
                    rot += step;

                    cx = Math.cos(rot) * innerRadius;
                    cy = Math.sin(rot) * innerRadius;
                    ctx.lineTo(cx, cy);
                    rot += step;
                }
                ctx.lineTo(0, -outerRadius);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(-2, -3, 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }

            checkCollect(diver) {
                if (this.collected) return false;
                const dx = this.x - diver.x;
                const dy = this.y - diver.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.radius + diver.radius) {
                    this.collected = true;
                    return true;
                }
                return false;
            }
        }

        let stars = [];

        // === HỆ THỐNG HIỆU ỨNG HẠT (PARTICLES) ===
        class BubbleParticle {
            constructor(x, y, vx, vy, size, color) {
                this.x = x;
                this.y = y;
                this.vx = vx;
                this.vy = vy;
                this.size = size;
                this.color = color || 'rgba(255, 255, 255, 0.6)';
                this.life = 1;
                this.decay = 0.015 + Math.random() * 0.02;
                this.wobble = Math.random() * Math.PI * 2;
            }

            update() {
                this.wobble += 0.1;
                this.x += this.vx + Math.sin(this.wobble) * 0.5;
                this.y += this.vy;
                this.life -= this.decay;
            }

            draw() {
                ctx.save();
                ctx.globalAlpha = Math.max(0, this.life);
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(this.x - this.size * 0.3, this.y - this.size * 0.3, this.size * 0.3, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }
        }

        class SparkleParticle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 4;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                this.size = 3 + Math.random() * 3;
                this.color = Math.random() > 0.5 ? '#ffdd59' : '#ffffff';
                this.life = 1;
                this.decay = 0.03 + Math.random() * 0.03;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.vy += 0.1;
                this.life -= this.decay;
            }

            draw() {
                ctx.save();
                ctx.globalAlpha = Math.max(0, this.life);
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        let particles = [];
        const ambientBubbles = [];

        for (let i = 0; i < 28; i++) {
            ambientBubbles.push({
                x: Math.random() * (canvas.width || 400),
                y: Math.random() * (canvas.height || 600),
                size: 2 + Math.random() * 5,
                speed: 0.6 + Math.random() * 1.2,
                wobbleSpeed: 0.02 + Math.random() * 0.04,
                wobble: Math.random() * Math.PI * 2
            });
        }

        // === QUẢN LÝ SINH CHƯỚNG NGẠI VẬT ===
        let obstacleTimer = 0;
        const obstacleInterval = 110;

        function handleObstacles() {
            obstacleTimer++;
            if (obstacleTimer >= obstacleInterval) {
                obstacleTimer = 0;
                const type = Math.random() < 0.25 ? 'center' : 'gap';
                obstacles.push(new RockObstacle(canvas.height + 40, type));
            }

            for (let i = obstacles.length - 1; i >= 0; i--) {
                const obs = obstacles[i];
                obs.update();

                if (obs.checkCollision(diver)) {
                    gameOver();
                    return;
                }

                if (obs.y < -100) {
                    obstacles.splice(i, 1);
                }
            }
        }

        function handleStars() {
            for (let i = stars.length - 1; i >= 0; i--) {
                const star = stars[i];
                star.update();

                if (star.checkCollect(diver)) {
                    starsCollected++;
                    score += 50;
                    starCountEl.textContent = starsCollected;
                    sound.playStar();

                    for (let k = 0; k < 12; k++) {
                        particles.push(new SparkleParticle(star.x, star.y));
                    }

                    stars.splice(i, 1);
                    continue;
                }

                if (star.y < -50 || star.collected) {
                    stars.splice(i, 1);
                }
            }
        }

        function handleParticles() {
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.update();
                if (p.life <= 0) {
                    particles.splice(i, 1);
                }
            }
        }

        // === HÀM VẼ HÌNH NỀN BIỂN ĐẠI DƯƠNG (OCEAN BACKGROUND) ===
        function drawBackground() {
            // Màu nước biển chuyển màu theo độ sâu thực tế (càng sâu càng xanh thẫm)
            const depthRatio = Math.min(depthMeters / 25, 1);
            const topColor = `rgb(${Math.floor(11 - depthRatio * 8)}, ${Math.floor(79 - depthRatio * 45)}, ${Math.floor(138 - depthRatio * 60)})`;
            const bottomColor = `rgb(${Math.floor(9 - depthRatio * 6)}, ${Math.floor(32 - depthRatio * 20)}, ${Math.floor(63 - depthRatio * 35)})`;

            const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            oceanGrad.addColorStop(0, topColor);
            oceanGrad.addColorStop(1, bottomColor);

            ctx.fillStyle = oceanGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Các tia sáng mặt trời xuyên biển (Sun Rays / Caustics)
            ctx.save();
            ctx.globalAlpha = 0.08 - depthRatio * 0.05;
            ctx.fillStyle = '#ffffff';

            for (let i = 0; i < 4; i++) {
                const rayX = (canvas.width / 4) * i + Math.sin(frameCount * 0.02 + i) * 30;
                ctx.beginPath();
                ctx.moveTo(rayX - 20, 0);
                ctx.lineTo(rayX + 40, 0);
                ctx.lineTo(rayX + 110, canvas.height);
                ctx.lineTo(rayX - 60, canvas.height);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();

            // Bọt nước nền trôi lơ lửng
            ctx.save();
            ambientBubbles.forEach(b => {
                b.wobble += b.wobbleSpeed;
                b.y -= (b.speed + (currentState === STATE.PLAYING ? gameSpeed * 0.4 : 0.5));
                if (b.y < -20) {
                    b.y = canvas.height + 20;
                    b.x = Math.random() * canvas.width;
                }

                const bx = b.x + Math.sin(b.wobble) * 8;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.beginPath();
                ctx.arc(bx, b.y, b.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        }

        // === VÒNG LẶP CHÍNH CỦA TRÒ CHƠI (MAIN GAME LOOP) ===
        function gameLoop(timestamp) {
            frameCount++;

            // Tính delta time để đo thời gian chơi chuẩn xác
            if (!lastTimestamp) lastTimestamp = timestamp;
            const deltaMs = Math.min(timestamp - lastTimestamp, 100);
            lastTimestamp = timestamp;

            // 1. Vẽ nền
            drawBackground();

            // 2. Cập nhật & Vẽ các thành phần theo trạng thái
            if (currentState === STATE.PLAYING) {
                playTimeMs += deltaMs;
                const playSeconds = playTimeMs / 1000;

                // Tính toán độ sâu theo thời gian: 30 giây = 5 mét (1 mét mỗi 6 giây)
                depthMeters = (playSeconds / 30) * 5;
                depthCountEl.textContent = depthMeters.toFixed(1);

                // Tăng nhẹ tốc độ theo thời gian lặn
                gameSpeed = Math.min(maxSpeed, baseSpeed + (playSeconds / 90) * 1.2);

                // Cập nhật các đối tượng
                diver.update();
                handleObstacles();
                handleStars();
                handleParticles();
            } else if (currentState === STATE.START || currentState === STATE.PAUSED) {
                diver.y = Math.min(140, canvas.height * 0.22) + Math.sin(frameCount * 0.05) * 8;
                diver.flipperAngle += 0.1;
                handleParticles();
            }

            // 3. Vẽ các đối tượng
            obstacles.forEach(obs => obs.draw());
            stars.forEach(star => star.draw());
            particles.forEach(p => p.draw());
            diver.draw();

            // Lặp lại khung hình
            requestAnimationFrame(gameLoop);
        }

        // === CÁC HÀM ĐIỀU HÀNH TRẠNG THÁI GAME ===
        function startGame() {
            sound.init();
            sound.playStart();
            score = 0;
            starsCollected = 0;
            depthMeters = 0;
            playTimeMs = 0;
            lastTimestamp = performance.now();
            gameSpeed = baseSpeed;
            obstacleTimer = 0;

            starCountEl.textContent = '0';
            depthCountEl.textContent = '0.0';

            obstacles = [];
            stars = [];
            particles = [];

            diver.reset();

            startScreen.classList.remove('active');
            pauseScreen.classList.remove('active');
            gameOverScreen.classList.remove('active');

            currentState = STATE.PLAYING;
        }

        function pauseGame() {
            if (currentState !== STATE.PLAYING) return;
            currentState = STATE.PAUSED;
            pauseScreen.classList.add('active');
        }

        function resumeGame() {
            if (currentState !== STATE.PAUSED) return;
            sound.init();
            lastTimestamp = performance.now();
            pauseScreen.classList.remove('active');
            currentState = STATE.PLAYING;
        }

        function gameOver() {
            currentState = STATE.GAMEOVER;
            sound.playCrash();

            // Tạo hiệu ứng va chạm nổ bọt nước
            for (let i = 0; i < 20; i++) {
                particles.push(new BubbleParticle(
                    diver.x,
                    diver.y,
                    (Math.random() - 0.5) * 6,
                    (Math.random() - 0.5) * 6,
                    4 + Math.random() * 6,
                    'rgba(255, 107, 53, 0.8)'
                ));
            }

            // Tính tổng điểm (Điểm sao + Điểm độ sâu)
            const depthFormatted = depthMeters.toFixed(1);
            const totalScore = starsCollected * 50 + Math.floor(depthMeters * 20);

            finalStarsEl.textContent = starsCollected;
            finalDepthEl.textContent = `${depthFormatted} m`;
            finalScoreEl.textContent = totalScore;

            // Kiểm tra kỷ lục mới
            let isNewBest = false;
            if (starsCollected > highScore) {
                highScore = starsCollected;
                localStorage.setItem('sea_high_score', highScore);
                isNewBest = true;
            }
            if (depthMeters > maxDepth) {
                maxDepth = depthMeters;
                localStorage.setItem('sea_max_depth', maxDepth.toFixed(1));
                isNewBest = true;
            }

            newBestBadge.style.display = isNewBest ? 'flex' : 'none';
            startHighScoreEl.textContent = highScore;
            startMaxDepthEl.textContent = maxDepth.toFixed(1);

            // Hiển thị màn hình Game Over sau hiệu ứng va chạm
            setTimeout(() => {
                gameOverScreen.classList.add('active');
            }, 400);
        }

        function restartGame() {
            startGame();
        }

        // === GẮN SỰ KIỆN NÚT BẤM GIAO DIỆN ===
        btnPlay.addEventListener('click', startGame);
        btnResume.addEventListener('click', resumeGame);
        btnRestartFromPause.addEventListener('click', startGame);
        btnRestart.addEventListener('click', restartGame);

        btnPause.addEventListener('click', () => {
            if (currentState === STATE.PLAYING) pauseGame();
            else if (currentState === STATE.PAUSED) resumeGame();
        });

        btnSound.addEventListener('click', () => {
            sound.toggle();
        });

        // Bắt đầu vòng lặp game
        requestAnimationFrame(gameLoop);

    })();
