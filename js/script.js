/**
 * THỢ LẶN ĐẠI DƯƠNG - DEEP SEA DIVER
 * Game nonstop phong cách hoạt hình (Cartoon) với HTML5 Canvas, CSS & JS thuần
 * Tính năng: Độ sâu tăng theo thời gian thực tế (khoảng 30 giây = 5 mét)
 */

(function () {
  "use strict";

  // === CÁC THÀNH PHẦN DOM ===
  const gameContainer = document.getElementById("gameContainer");
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const levelDisplayEl = document.getElementById("levelDisplay");
  const starCountEl = document.getElementById("starCount");
  const totalLevelStarsEl = document.getElementById("totalLevelStars");
  const btnSound = document.getElementById("btnSound");
  const btnPause = document.getElementById("btnPause");

  const startScreen = document.getElementById("startScreen");
  const startProgressEl = document.getElementById("startProgress");
  const levelSelectScreen = document.getElementById("levelSelectScreen");
  const levelGridEl = document.getElementById("levelGrid");
  const btnBackFromLevelSelect = document.getElementById(
    "btnBackFromLevelSelect",
  );

  const pauseScreen = document.getElementById("pauseScreen");
  const gameOverScreen = document.getElementById("gameOverScreen");
  const victoryScreen = document.getElementById("victoryScreen");

  const btnPlay = document.getElementById("btnPlay");
  const btnResume = document.getElementById("btnResume");
  const btnRestartFromPause = document.getElementById("btnRestartFromPause");
  const btnHomeFromPause = document.getElementById("btnHomeFromPause");

  const btnRestart = document.getElementById("btnRestart");
  const btnSelectFromOver = document.getElementById("btnSelectFromOver");
  const btnHomeFromOver = document.getElementById("btnHomeFromOver");

  const btnNextLevel = document.getElementById("btnNextLevel");
  const btnReplayVictory = document.getElementById("btnReplayVictory");
  const btnSelectFromVictory = document.getElementById("btnSelectFromVictory");
  const btnHomeFromVictory = document.getElementById("btnHomeFromVictory");

  const finalStarsEl = document.getElementById("finalStars");
  const finalLevelNameEl = document.getElementById("finalLevelName");
  const victoryStarsEl = document.getElementById("victoryStars");
  const victoryTimeEl = document.getElementById("victoryTime");

  const btnLeft = document.getElementById("btnLeft");
  const btnRight = document.getElementById("btnRight");
  const btnUp = document.getElementById("btnUp");
  const btnDown = document.getElementById("btnDown");

  // === TỰ ĐỘNG ĐIỀU CHỈNH KÍCH THƯỚC CANVAS THEO MÀN HÌNH TRÀN VIỀN ===
  function resizeCanvas() {
    const rect = gameContainer.getBoundingClientRect();
    canvas.width = Math.floor(rect.width) || 400;
    canvas.height = Math.floor(rect.height) || 600;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // === HỆ THỐNG ÂM THANH HOẠT HÌNH (WEB AUDIO API) ===
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = localStorage.getItem("sea_sound_enabled") !== "false";
      this.updateIcon();
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem("sea_sound_enabled", this.enabled);
      this.updateIcon();
      if (this.enabled) {
        this.init();
        this.playStar();
      }
    }

    updateIcon() {
      btnSound.textContent = this.enabled ? "🔊" : "🔇";
    }

    // Âm thanh bọt nước bơi
    playSwim() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = "sine";
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
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(880, now); // A5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "triangle";
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

      osc.type = "sawtooth";
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

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const now = this.ctx.currentTime + i * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      });
    }

    // Giai điệu chiến thắng vượt level
    playVictory() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
      notes.forEach((freq, i) => {
        const now = this.ctx.currentTime + i * 0.1;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      });
    }
  }

  const sound = new SoundEngine();

  // === HỆ THỐNG GACHA ===
  const SKINS = [
    {
      id: "default",
      name: "Thợ Lặn\nThường",
      emoji: "🤿",
      rarity: "common",
      rarityName: "Thường",
      colors: {
        suit: "#ff6b35",
        helmet: "#feca57",
        visor: "#48dbfb",
        tank: "#f1c40f",
        flipper: "#ff4757",
      },
    },
    {
      id: "pink",
      name: "Valentine",
      emoji: "🩷",
      rarity: "common",
      rarityName: "Thường",
      colors: {
        suit: "#fd79a8",
        helmet: "#ffeaa7",
        visor: "#ff8fc8",
        tank: "#fdcb6e",
        flipper: "#e84393",
      },
    },
    {
      id: "legend",
      name: "Thiên thần",
      emoji: "🌟",
      rarity: "common",
      rarityName: "Hiếm",
      colors: {
        suit: "#e17055",
        helmet: "#fdcb6e",
        visor: "#81ecec",
        tank: "#2d3436",
        flipper: "#d63031",
      },
    },
    {
      id: "king",
      name: "Vua\nBiển Cả",
      emoji: "👑",
      rarity: "rare",
      rarityName: "Hiếm",
      colors: {
        suit: "#0652dd",
        helmet: "#ffd32a",
        visor: "#48dbfb",
        tank: "#12CBC4",
        flipper: "#009432",
      },
    },
    {
      id: "dragon",
      name: "Long thần",
      emoji: "🐉",
      rarity: "epic",
      rarityName: "Sử Thi",
      colors: {
        suit: "#6c5ce7",
        helmet: "#a29bfe",
        visor: "#fd79a8",
        tank: "#2d3436",
        flipper: "#00cec9",
      },
    },
    {
      id: "star",
      name: "Tổ Quốc yêu bạn",
      emoji: "⭐",
      rarity: "legend",
      rarityName: "Thần thoại",
      colors: {
        suit: "#c41e1e",
        helmet: "#c41e1e",
        visor: "#ffc400",
        tank: "#ffa801",
        flipper: "#f92424",
      },
    },
  ];

  // Xác suất gacha (tổng = 100)
  const GACHA_POOL = [
    { id: "default", weight: 40 },
    { id: "pink", weight: 25 },
    { id: "legend", weight: 15 },
    { id: "king", weight: 10 },
    { id: "dragon", weight: 7 },
    { id: "star", weight: 3 },
  ];

  class GachaSystem {
    constructor() {
      // Tổng sao tích lũy (dùng để quay)
      this.totalStars = parseInt(localStorage.getItem("sea_total_stars")) || 0;
      // Skin đã mở
      this.ownedSkins = JSON.parse(
        localStorage.getItem("sea_owned_skins") || '["default"]',
      );
      // Skin đang dùng
      this.equippedSkin =
        localStorage.getItem("sea_equipped_skin") || "default";
      // Pity counters
      this.pityRare = parseInt(localStorage.getItem("sea_pity_rare")) || 0;
      this.pityEpic = parseInt(localStorage.getItem("sea_pity_epic")) || 0;
    }

    save() {
      localStorage.setItem("sea_total_stars", this.totalStars);
      localStorage.setItem("sea_owned_skins", JSON.stringify(this.ownedSkins));
      localStorage.setItem("sea_equipped_skin", this.equippedSkin);
      localStorage.setItem("sea_pity_rare", this.pityRare);
      localStorage.setItem("sea_pity_epic", this.pityEpic);
    }

    addStars(n) {
      this.totalStars += n;
      this.save();
    }

    getSkinById(id) {
      return SKINS.find((s) => s.id === id) || SKINS[0];
    }

    getEquippedSkin() {
      return this.getSkinById(this.equippedSkin);
    }

    // Quay 1 viên
    rollOne() {
      this.pityRare++;
      this.pityEpic++;

      // Pity: 50 lần không Sử Thi → đảm bảo Sử Thi
      if (this.pityEpic >= 50) {
        this.pityEpic = 0;
        this.pityRare = 0;
        const epicPool = GACHA_POOL.filter((g) => {
          const skin = this.getSkinById(g.id);
          return skin.rarity === "epic" || skin.rarity === "legend";
        });
        return this._pickFrom(epicPool);
      }

      // Pity: 20 lần không Hiếm → đảm bảo Hiếm
      if (this.pityRare >= 20) {
        this.pityRare = 0;
        const rarePool = GACHA_POOL.filter((g) => {
          const skin = this.getSkinById(g.id);
          return skin.rarity !== "common";
        });
        return this._pickFrom(rarePool);
      }

      const result = this._pickFrom(GACHA_POOL);
      const skin = this.getSkinById(result.id);

      // Reset pity nếu ra đủ hiếm
      if (skin.rarity !== "common") this.pityRare = 0;
      if (skin.rarity === "epic" || skin.rarity === "legend") this.pityEpic = 0;

      return result;
    }

    _pickFrom(pool) {
      const total = pool.reduce((s, g) => s + g.weight, 0);
      let rand = Math.random() * total;
      for (const g of pool) {
        rand -= g.weight;
        if (rand <= 0) return this.getSkinById(g.id);
      }
      return this.getSkinById(pool[pool.length - 1].id);
    }

    pull(count) {
      const cost = count === 1 ? 10 : 90;
      if (this.totalStars < cost) return null;
      this.totalStars -= cost;

      const results = [];
      for (let i = 0; i < count; i++) {
        const skin = this.rollOne();
        results.push(skin);
        if (!this.ownedSkins.includes(skin.id)) {
          this.ownedSkins.push(skin.id);
        }
      }

      this.save();
      return results;
    }

    equipSkin(id) {
      if (this.ownedSkins.includes(id)) {
        this.equippedSkin = id;
        this.save();
      }
    }
  }

  const gacha = new GachaSystem();

  // === CÁC BIẾN TRẠNG THÁI GAME ===
  const STATE = {
    START: "START",
    LEVEL_SELECT: "LEVEL_SELECT",
    PLAYING: "PLAYING",
    PAUSED: "PAUSED",
    GAMEOVER: "GAMEOVER",
    VICTORY: "VICTORY",
  };

  let currentState = STATE.START;
  let currentLevel = 1;
  let unlockedLevel = parseInt(localStorage.getItem("sea_unlocked_level")) || 1;
  let currentMap = null;
  let mapStars = [];
  let starsCollected = 0;
  let playTimeMs = 0;
  let lastTimestamp = 0;
  let frameCount = 0;
  const camera = { x: 0, y: 0 };
  let particles = [];

  function updateStartScreenInfo() {
    if (startProgressEl) {
      startProgressEl.textContent = `level ${unlockedLevel}/5`;
    }
  }
  updateStartScreenInfo();

  // === HỆ THỐNG ĐIỀU KHIỂN (CONTROLS - WASD & MŨI TÊN & CẢM ỨNG) ===
  const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
  };

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      keys.left = true;
      if (btnLeft) btnLeft.classList.add("active");
    }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      keys.right = true;
      if (btnRight) btnRight.classList.add("active");
    }
    if (
      e.key === "ArrowUp" ||
      e.key === "w" ||
      e.key === "W" ||
      e.key === " " ||
      e.key === "Spacebar"
    ) {
      keys.up = true;
      if (btnUp) btnUp.classList.add("active");
    }
    if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
      keys.down = true;
      if (btnDown) btnDown.classList.add("active");
    }
    if (e.key === "Escape" || e.key === "p" || e.key === "P") {
      if (currentState === STATE.PLAYING) pauseGame();
      else if (currentState === STATE.PAUSED) resumeGame();
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      keys.left = false;
      if (btnLeft) btnLeft.classList.remove("active");
    }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      keys.right = false;
      if (btnRight) btnRight.classList.remove("active");
    }
    if (
      e.key === "ArrowUp" ||
      e.key === "w" ||
      e.key === "W" ||
      e.key === " " ||
      e.key === "Spacebar"
    ) {
      keys.up = false;
      if (btnUp) btnUp.classList.remove("active");
    }
    if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
      keys.down = false;
      if (btnDown) btnDown.classList.remove("active");
    }
  });

  // Xử lý nút cảm ứng 4 hướng (Trái, Phlevel, Lên, Xuống)
  function setupTouchButton(btn, keyName) {
    if (!btn) return;
    const start = (e) => {
      e.preventDefault();
      sound.init();
      keys[keyName] = true;
      btn.classList.add("active");
    };
    const end = (e) => {
      e.preventDefault();
      keys[keyName] = false;
      btn.classList.remove("active");
    };

    btn.addEventListener("mousedown", start);
    btn.addEventListener("mouseup", end);
    btn.addEventListener("mouseleave", end);
    btn.addEventListener("touchstart", start, { passive: false });
    btn.addEventListener("touchend", end, { passive: false });
    btn.addEventListener("touchcancel", end, { passive: false });
  }

  setupTouchButton(btnLeft, "left");
  setupTouchButton(btnRight, "right");
  setupTouchButton(btnUp, "up");
  setupTouchButton(btnDown, "down");

  // === LỚP NHÂN VẬT: THỢ LẶN HOẠT HÌNH (DIVER - PLATFORMER) ===
  class Diver {
    constructor() {
      this.x = 100;
      this.y = 100;
      this.width = 30;
      this.height = 42;
      this.halfW = 14;
      this.halfH = 20;
      this.vx = 0;
      this.vy = 0;
      this.speed = 4.2;
      this.facingLeft = false;
      this.onGround = false;
      this.tilt = 0;
      this.flipperAngle = 0;
      this.bubbleTimer = 0;
      this.radius = 16;
    }

    reset(startX = 100, startY = 100) {
      this.x = startX;
      this.y = startY;
      this.vx = 0;
      this.vy = 0;
      this.facingLeft = false;
      this.onGround = false;
      this.tilt = 0;
      this.flipperAngle = 0;
      this.bubbleTimer = 0;
    }

    checkAABB(x1, y1, w1, h1, x2, y2, w2, h2) {
      return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }

    update(deltaSec, map) {
      if (!map) return;
      const dt = Math.min(deltaSec, 0.05) * 60;
      const accel = 0.75;
      const waterFrictionX = 0.88;
      const waterFrictionY = 0.93;
      const gravity = 0.16;

      let isMoving = false;

      if (keys.left) {
        this.vx -= accel * dt;
        this.facingLeft = true;
        isMoving = true;
        if (Math.random() < 0.08 * dt) sound.playSwim();
      }
      if (keys.right) {
        this.vx += accel * dt;
        this.facingLeft = false;
        isMoving = true;
        if (Math.random() < 0.08 * dt) sound.playSwim();
      }

      if (keys.up) {
        this.vy -= 0.65 * dt;
        this.onGround = false;
        isMoving = true;
        if (Math.random() < 0.12 * dt) {
          sound.playSwim();
          particles.push(
            new BubbleParticle(
              this.x + (this.facingLeft ? 10 : -10),
              this.y + 16,
              (Math.random() - 0.5) * 1.5,
              1 + Math.random() * 2,
              3 + Math.random() * 2.5,
              "rgba(255, 255, 255, 0.7)",
            ),
          );
        }
      }

      if (keys.down) {
        this.vy += 0.5 * dt;
        isMoving = true;
      }

      // Giới hạn vận tốc
      this.vx = Math.max(-this.speed, Math.min(this.speed, this.vx));
      this.vy = Math.max(-6.0, Math.min(6.0, this.vy));

      // Lực cản nước
      this.vx *= Math.pow(waterFrictionX, dt);
      this.vy *= Math.pow(waterFrictionY, dt);

      if (isMoving || !this.onGround) {
        this.flipperAngle += 0.22 * dt;
      }

      // Nghiêng người theo góc bơi
      const targetTilt = Math.max(
        -0.45,
        Math.min(
          0.45,
          (this.vy / 6) * 0.35 + (this.facingLeft ? -this.vx : this.vx) * 0.05,
        ),
      );
      this.tilt += (targetTilt - this.tilt) * 0.15 * dt;

      // Va chạm 2 trục độc lập
      // 1. Trục X
      this.x += this.vx * dt;
      for (const p of map.platforms) {
        if (
          this.checkAABB(
            this.x - this.halfW,
            this.y - this.halfH,
            this.halfW * 2,
            this.halfH * 2,
            p.x,
            p.y,
            p.width,
            p.height,
          )
        ) {
          if (this.vx > 0) {
            this.x = p.x - this.halfW;
            this.vx = 0;
          } else if (this.vx < 0) {
            this.x = p.x + p.width + this.halfW;
            this.vx = 0;
          }
        }
      }

      if (this.x < this.halfW) {
        this.x = this.halfW;
        this.vx = 0;
      } else if (this.x > map.width - this.halfW) {
        this.x = map.width - this.halfW;
        this.vx = 0;
      }

      // 2. Trục Y
      this.onGround = false;
      this.y += this.vy * dt;
      for (const p of map.platforms) {
        if (
          this.checkAABB(
            this.x - this.halfW,
            this.y - this.halfH,
            this.halfW * 2,
            this.halfH * 2,
            p.x,
            p.y,
            p.width,
            p.height,
          )
        ) {
          if (this.vy > 0) {
            this.y = p.y - this.halfH;
            this.vy = 0;
            this.onGround = true;
          } else if (this.vy < 0) {
            this.y = p.y + p.height + this.halfH;
            this.vy = 0;
          }
        }
      }

      if (this.y < this.halfH) {
        this.y = this.halfH;
        this.vy = 0;
      } else if (this.y > map.height - this.halfH) {
        this.y = map.height - this.halfH;
        this.vy = 0;
        this.onGround = true;
      }

      // Bọt nước thỉnh thoảng sủi ra từ ống thở
      this.bubbleTimer += dt;
      if (this.bubbleTimer >= 14) {
        this.bubbleTimer = 0;
        particles.push(
          new BubbleParticle(
            this.x + (this.facingLeft ? -8 : 8),
            this.y - 12,
            (Math.random() - 0.5) * 0.6,
            -1.2 - Math.random() * 1.2,
            2 + Math.random() * 3,
            "rgba(255, 255, 255, 0.75)",
          ),
        );
      }
    }

    draw() {
      const skin = gacha.getEquippedSkin();
      const c = skin.colors;

      ctx.save();
      ctx.translate(this.x, this.y);
      if (this.facingLeft) {
        ctx.scale(-1, 1);
      }
      ctx.rotate(this.tilt);

      // 1. Chân vịt bơi (Flippers)
      const kick1 = Math.sin(this.flipperAngle) * 8;
      const kick2 = -Math.sin(this.flipperAngle) * 8;

      ctx.fillStyle = c.flipper;
      ctx.strokeStyle = "#130f40";
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
      ctx.fillStyle = c.tank;
      ctx.beginPath();
      ctx.roundRect(-8, -14, 16, 26, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#e67e22";
      ctx.fillRect(-8, -4, 16, 4);

      // 3. Thân thợ lặn (Diving Suit)
      ctx.fillStyle = c.suit;
      ctx.beginPath();
      ctx.roundRect(-15, -12, 30, 32, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#2f3542";
      ctx.fillRect(-15, 0, 30, 4);

      // 4. Mũ lặn hình tròn & Kính lặn (Helmet & Visor)
      ctx.fillStyle = c.helmet;
      ctx.beginPath();
      ctx.arc(0, 10, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = c.visor;
      ctx.beginPath();
      ctx.arc(0, 12, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // === PHỤ KIỆN ĐẶC TRƯNG TỪNG SKIN ===

      // --- DRAGON: Sừng + Vây lưng + Đuôi rồng ---
      if (skin.id === "dragon") {
        ctx.strokeStyle = "#130f40";
        ctx.lineWidth = 2;

        // Vây lưng (dorsal fin) — nhô ra từ đỉnh bình khí
        ctx.fillStyle = "#6c5ce7";
        ctx.beginPath();
        ctx.moveTo(-5, -14);
        ctx.quadraticCurveTo(0, -34, 5, -14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sừng trái - tia sét bo cạnh
        ctx.fillStyle = "#a29bfe";
        ctx.beginPath();

        ctx.moveTo(-6, -2);
        ctx.lineTo(-15, -18);

        // Bo góc 1
        ctx.quadraticCurveTo(-15, -19, -14, -18);
        ctx.lineTo(-10, -16);

        // Bo góc 2
        ctx.quadraticCurveTo(-9, -16, -10, -17);
        ctx.lineTo(-13, -26);

        // Đầu tia sét
        ctx.quadraticCurveTo(-13, -27, -12, -26);
        ctx.lineTo(-3, -13);

        // Bo góc 3
        ctx.quadraticCurveTo(-2, -12, -4, -13);
        ctx.lineTo(-8, -14);

        // Bo góc 4
        ctx.quadraticCurveTo(-9, -14, -8, -13);

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sừng phlevel - tia sét bo cạnh
        ctx.beginPath();

        ctx.moveTo(6, -2);
        ctx.lineTo(15, -18);

        ctx.quadraticCurveTo(15, -19, 14, -18);
        ctx.lineTo(10, -16);

        ctx.quadraticCurveTo(9, -16, 10, -17);
        ctx.lineTo(13, -26);

        ctx.quadraticCurveTo(13, -27, 12, -26);
        ctx.lineTo(3, -13);

        ctx.quadraticCurveTo(2, -12, 4, -13);
        ctx.lineTo(8, -14);

        ctx.quadraticCurveTo(9, -14, 8, -13);

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Đuôi rồng (tail) — uốn cong theo flipperAngle
        const tailWag = Math.sin(this.flipperAngle + 1) * 6;
        ctx.fillStyle = "#a29bfe";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(8, -28);
        ctx.quadraticCurveTo(24 + tailWag, -38, 18 + tailWag, -46);
        ctx.quadraticCurveTo(12 + tailWag, -52, 22 + tailWag, -50);
        ctx.quadraticCurveTo(30 + tailWag, -48, 26 + tailWag, -42);
        ctx.quadraticCurveTo(32 + tailWag, -34, 14, -28);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // --- KING: Vương miện + Áo choàng ---
      if (skin.id === "king") {
        ctx.strokeStyle = "#130f40";
        ctx.lineWidth = 2;

        // Áo choàng hoàng gia (cape) hai bên
        ctx.fillStyle = "#0652dd";
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(-15, 8);
        ctx.lineTo(-26, 14);
        ctx.lineTo(-20, 22);
        ctx.lineTo(-15, 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(15, 8);
        ctx.lineTo(26, 14);
        ctx.lineTo(20, 22);
        ctx.lineTo(15, 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Vương miện trên đỉnh mũ
        ctx.fillStyle = "#ffd32a";
        // Đế vương miện
        ctx.beginPath();
        ctx.rect(-12, -8, 24, 7);
        ctx.fill();
        ctx.stroke();
        // 3 đỉnh nhọn - bo cạnh

        // Đỉnh trái
        ctx.beginPath();
        ctx.moveTo(-12, -8);
        ctx.lineTo(-8.5, -19);

        ctx.quadraticCurveTo(-8, -21, -7.5, -19);

        ctx.lineTo(-4, -8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Đỉnh giữa
        ctx.beginPath();
        ctx.moveTo(-2, -8);
        ctx.lineTo(-0.7, -23);

        ctx.quadraticCurveTo(0, -25, 0.7, -23);

        ctx.lineTo(2, -8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Đỉnh phlevel
        ctx.beginPath();
        ctx.moveTo(4, -8);
        ctx.lineTo(7.5, -19);

        ctx.quadraticCurveTo(8, -21, 8.5, -19);

        ctx.lineTo(12, -8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Đá quý trên vương miện
        ctx.fillStyle = "#48dbfb";
        ctx.beginPath();
        ctx.arc(0, -10, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ff4757";
        ctx.beginPath();
        ctx.arc(-8, -9, 2.5, 0, Math.PI * 2);
        ctx.arc(8, -9, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- STAR: Hào quang ngôi sao xoay ---
      if (skin.id === "star") {
        const numRays = 8;
        const outerR = 30;
        const innerR = 18;
        const baseAngle = (frameCount * 0.04) % (Math.PI * 2);
        ctx.lineWidth = 1.5;

        // Vòng sao xoay phía sau nhân vật
        ctx.save();
        ctx.globalAlpha = 0.55 + Math.sin(frameCount * 0.07) * 0.12;
        ctx.fillStyle = "#fff200";
        ctx.strokeStyle = "#ffa801";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < numRays * 2; i++) {
          const angle = baseAngle + (i * Math.PI) / numRays;
          const r = i % 2 === 0 ? outerR : innerR;
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Ngôi sao nhỏ trên đỉnh đầu
        ctx.fillStyle = "#fff200";
        ctx.strokeStyle = "#ffa801";
        ctx.lineWidth = 1.5;
        ctx.save();
        ctx.translate(0, -28);
        ctx.rotate(baseAngle * 2);
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI) / 5 - Math.PI / 2;
          const r2 = i % 2 === 0 ? 8 : 4;
          const px = Math.cos(a) * r2;
          const py = Math.sin(a) * r2;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // --- LEGEND: Cánh thiên thần + Vòng hào quang ---
      if (skin.id === "legend") {
        ctx.strokeStyle = "#130f40";
        ctx.lineWidth = 2;

        // Vòng hào quang (halo) phía trên đầu
        const haloAlpha = 0.7 + Math.sin(frameCount * 0.06) * 0.2;
        ctx.save();
        ctx.globalAlpha = haloAlpha;
        ctx.strokeStyle = "#fdcb6e";
        ctx.lineWidth = 3.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#fdcb6e";
        ctx.beginPath();
        ctx.ellipse(0, -30, 14, 5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Tia sáng xung quanh hào quang
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = "#fdcb6e";
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + frameCount * 0.03;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 16, -30 + Math.sin(a) * 6);
          ctx.lineTo(Math.cos(a) * 22, -30 + Math.sin(a) * 8);
          ctx.stroke();
        }
        ctx.restore();

        // Cánh thiên thần trái
        const wingFlap = Math.sin(this.flipperAngle * 0.5) * 0.15;
        ctx.save();
        ctx.globalAlpha = 0.82;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#fdcb6e";
        ctx.lineWidth = 2;

        ctx.save();
        ctx.translate(-16, 4);
        ctx.rotate(-0.3 + wingFlap);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-22, -8, -28, 4, -18, 14);
        ctx.bezierCurveTo(-12, 18, -4, 14, 0, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Cánh thiên thần phlevel
        ctx.save();
        ctx.translate(16, 4);
        ctx.rotate(0.3 - wingFlap);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(22, -8, 28, 4, 18, 14);
        ctx.bezierCurveTo(12, 18, 4, 14, 0, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
      }

      // --- PINK: Nơ dễ thương trên đỉnh mũ ---
      if (skin.id === "pink") {
        ctx.strokeStyle = "#130f40";
        ctx.lineWidth = 1.8;
        ctx.fillStyle = "#e84393";
        // Cánh nơ trái
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.bezierCurveTo(-6, -18, -18, -16, -14, -8);
        ctx.bezierCurveTo(-10, -2, -2, -4, 0, -6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Cánh nơ phlevel
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.bezierCurveTo(6, -18, 18, -16, 14, -8);
        ctx.bezierCurveTo(10, -2, 2, -4, 0, -6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Nút giữa nơ
        ctx.fillStyle = "#fd79a8";
        ctx.beginPath();
        ctx.arc(0, -6, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Aura cho skin huyền thoại/sử thi
      if (skin.rarity === "legend" || skin.rarity === "epic") {
        const glowColor =
          skin.rarity === "legend"
            ? "rgba(255,221,89,0.25)"
            : "rgba(162,155,254,0.25)";
        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = skin.rarity === "legend" ? "#ffdd59" : "#a29bfe";
        ctx.globalAlpha = 0.5 + Math.sin(frameCount * 0.08) * 0.15;
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();
      ctx.ellipse(-4, 9, 3, 5, -0.4, 0, Math.PI * 2);
      ctx.fill();

      const eyeShiftX = (this.vx / this.speed) * 3;
      ctx.fillStyle = "#130f40";
      ctx.beginPath();
      ctx.arc(-3 + eyeShiftX, 13, 2.5, 0, Math.PI * 2);
      ctx.arc(3 + eyeShiftX, 13, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(-3.5 + eyeShiftX, 12, 1, 0, Math.PI * 2);
      ctx.arc(2.5 + eyeShiftX, 12, 1, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  const diver = new Diver();

  // === 5 BẢN ĐỒ MÀN CHƠI (5 PLATFORMER MAPS) ===
  const MAPS = [
    {
      id: 1,
      width: 800,
      height: 1000,
      theme: {
        topColor: "#0b5299",
        bottomColor: "#052247",
        sunRays: true,
      },
      playerStart: { x: 100, y: 140 },
      goal: { x: 680, y: 880, width: 46, height: 42, title: "Rương San Hô" },
      platforms: [
        { x: 50, y: 200, width: 160, height: 26, type: "coral" },
        { x: 270, y: 270, width: 150, height: 26, type: "coral" },
        { x: 480, y: 340, width: 160, height: 26, type: "coral" },
        { x: 630, y: 440, width: 140, height: 26, type: "coral" },
        { x: 420, y: 540, width: 160, height: 26, type: "coral" },
        { x: 180, y: 620, width: 170, height: 26, type: "coral" },
        { x: 70, y: 740, width: 160, height: 26, type: "coral" },
        { x: 280, y: 820, width: 150, height: 26, type: "coral" },
        { x: 480, y: 900, width: 160, height: 26, type: "coral" },
        { x: 0, y: 960, width: 800, height: 40, type: "coral" },
      ],
      hazards: [
        { type: "urchin", x: 345, y: 252, radius: 14 },
        { type: "urchin", x: 500, y: 522, radius: 14 },
        { type: "urchin", x: 150, y: 722, radius: 14 },
      ],
      stars: [
        { x: 130, y: 150 },
        { x: 345, y: 210 },
        { x: 560, y: 280 },
        { x: 265, y: 560 },
        { x: 560, y: 840 },
      ],
      decorations: [
        { type: "seaweed", x: 70, y: 190 },
        { type: "coral_bush", x: 180, y: 190 },
        { type: "seaweed", x: 580, y: 330 },
        { type: "coral_bush", x: 220, y: 610 },
        { type: "seaweed", x: 520, y: 890 },
      ],
    },
    {
      id: 2,
      width: 950,
      height: 1100,
      theme: {
        topColor: "#1a0e38",
        bottomColor: "#080417",
        sunRays: false,
      },
      playerStart: { x: 100, y: 160 },
      goal: { x: 830, y: 230, width: 46, height: 42, title: "Cổng Ngọc Trai" },
      platforms: [
        { x: 50, y: 220, width: 160, height: 26, type: "crystal" },
        { x: 250, y: 330, width: 150, height: 26, type: "crystal" },
        { x: 70, y: 460, width: 150, height: 26, type: "crystal" },
        { x: 260, y: 580, width: 160, height: 26, type: "crystal" },
        { x: 100, y: 710, width: 160, height: 26, type: "crystal" },
        { x: 300, y: 840, width: 160, height: 26, type: "crystal" },
        { x: 500, y: 740, width: 160, height: 26, type: "crystal" },
        { x: 680, y: 620, width: 160, height: 26, type: "crystal" },
        { x: 500, y: 480, width: 160, height: 26, type: "crystal" },
        { x: 680, y: 360, width: 160, height: 26, type: "crystal" },
        { x: 800, y: 290, width: 140, height: 26, type: "crystal" },
        { x: 0, y: 1050, width: 950, height: 50, type: "crystal" },
      ],
      hazards: [
        { type: "urchin", x: 325, y: 312, radius: 14 },
        { type: "urchin", x: 145, y: 442, radius: 14 },
        { type: "urchin", x: 580, y: 722, radius: 14 },
        { type: "urchin", x: 760, y: 602, radius: 14 },
        { type: "urchin", x: 580, y: 462, radius: 14 },
      ],
      stars: [
        { x: 130, y: 160 },
        { x: 145, y: 400 },
        { x: 340, y: 520 },
        { x: 380, y: 780 },
        { x: 760, y: 560 },
        { x: 760, y: 300 },
      ],
      decorations: [
        { type: "crystal_cluster", x: 180, y: 210 },
        { type: "crystal_cluster", x: 380, y: 320 },
        { type: "crystal_cluster", x: 630, y: 610 },
        { type: "crystal_cluster", x: 820, y: 280 },
      ],
    },
    {
      id: 3,
      width: 900,
      height: 1200,
      theme: {
        topColor: "#0b3336",
        bottomColor: "#031417",
        sunRays: true,
      },
      playerStart: { x: 120, y: 180 },
      goal: {
        x: 740,
        y: 990,
        width: 46,
        height: 42,
        title: "Rương Thuyền Trưởng",
      },
      platforms: [
        { x: 60, y: 240, width: 170, height: 26, type: "wood" },
        { x: 280, y: 340, width: 160, height: 26, type: "wood" },
        { x: 490, y: 440, width: 160, height: 26, type: "wood" },
        { x: 170, y: 560, width: 220, height: 28, type: "wood" },
        { x: 470, y: 660, width: 220, height: 28, type: "wood" },
        { x: 140, y: 780, width: 240, height: 28, type: "wood" },
        { x: 450, y: 890, width: 220, height: 28, type: "wood" },
        { x: 680, y: 1050, width: 200, height: 30, type: "wood" },
        { x: 0, y: 1150, width: 900, height: 50, type: "wood" },
      ],
      hazards: [
        {
          type: "jellyfish",
          x: 250,
          y: 450,
          baseY: 450,
          rangeY: 50,
          speed: 0.04,
          radius: 15,
          seed: 1,
        },
        {
          type: "jellyfish",
          x: 450,
          y: 550,
          baseY: 550,
          rangeY: 60,
          speed: 0.05,
          radius: 15,
          seed: 2,
        },
        {
          type: "jellyfish",
          x: 400,
          y: 730,
          baseY: 730,
          rangeY: 50,
          speed: 0.04,
          radius: 15,
          seed: 3,
        },
        { type: "urchin", x: 280, y: 542, radius: 14 },
        { type: "urchin", x: 580, y: 642, radius: 14 },
      ],
      stars: [
        { x: 140, y: 180 },
        { x: 360, y: 280 },
        { x: 570, y: 380 },
        { x: 220, y: 500 },
        { x: 580, y: 600 },
        { x: 260, y: 720 },
        { x: 560, y: 830 },
      ],
      decorations: [
        { type: "seaweed", x: 190, y: 550 },
        { type: "seaweed", x: 520, y: 650 },
        { type: "seaweed", x: 720, y: 1040 },
      ],
    },
    {
      id: 4,
      width: 850,
      height: 1250,
      theme: {
        topColor: "#2a0808",
        bottomColor: "#100202",
        sunRays: false,
      },
      playerStart: { x: 120, y: 1120 },
      goal: { x: 670, y: 150, width: 46, height: 42, title: "Trái Tim Magma" },
      platforms: [
        { x: 0, y: 1190, width: 850, height: 60, type: "volcano" },
        { x: 240, y: 1080, width: 160, height: 26, type: "volcano" },
        { x: 470, y: 980, width: 160, height: 26, type: "volcano" },
        { x: 650, y: 870, width: 150, height: 26, type: "volcano" },
        { x: 410, y: 770, width: 170, height: 26, type: "volcano" },
        { x: 150, y: 670, width: 160, height: 26, type: "volcano" },
        { x: 370, y: 570, width: 160, height: 26, type: "volcano" },
        { x: 600, y: 470, width: 160, height: 26, type: "volcano" },
        { x: 350, y: 350, width: 170, height: 26, type: "volcano" },
        { x: 110, y: 250, width: 170, height: 26, type: "volcano" },
        { x: 590, y: 210, width: 220, height: 28, type: "volcano" },
      ],
      hazards: [
        { type: "urchin", x: 320, y: 1062, radius: 14 },
        { type: "urchin", x: 550, y: 962, radius: 14 },
        { type: "urchin", x: 495, y: 752, radius: 14 },
        {
          type: "jellyfish",
          x: 520,
          y: 640,
          baseY: 640,
          rangeY: 45,
          speed: 0.05,
          radius: 15,
          seed: 4,
        },
        { type: "urchin", x: 680, y: 452, radius: 14 },
        { type: "urchin", x: 435, y: 332, radius: 14 },
      ],
      stars: [
        { x: 120, y: 1060 },
        { x: 320, y: 1020 },
        { x: 550, y: 920 },
        { x: 725, y: 810 },
        { x: 230, y: 610 },
        { x: 450, y: 510 },
        { x: 680, y: 410 },
        { x: 195, y: 190 },
      ],
      decorations: [],
    },
    {
      id: 5,
      width: 1050,
      height: 1300,
      theme: {
        topColor: "#003b46",
        bottomColor: "#001b22",
        sunRays: true,
      },
      playerStart: { x: 120, y: 180 },
      goal: {
        x: 890,
        y: 1130,
        width: 46,
        height: 42,
        title: "Vương Miện Poseidon",
      },
      platforms: [
        { x: 60, y: 240, width: 180, height: 30, type: "ancient" },
        { x: 290, y: 340, width: 150, height: 26, type: "ancient" },
        { x: 500, y: 440, width: 160, height: 26, type: "ancient" },
        { x: 730, y: 530, width: 160, height: 26, type: "ancient" },
        { x: 480, y: 650, width: 180, height: 28, type: "ancient" },
        { x: 200, y: 760, width: 200, height: 28, type: "ancient" },
        { x: 450, y: 870, width: 180, height: 28, type: "ancient" },
        { x: 720, y: 970, width: 190, height: 28, type: "ancient" },
        { x: 480, y: 1080, width: 190, height: 28, type: "ancient" },
        { x: 800, y: 1190, width: 220, height: 32, type: "ancient" },
        { x: 0, y: 1260, width: 1050, height: 40, type: "ancient" },
      ],
      hazards: [
        { type: "urchin", x: 365, y: 322, radius: 14 },
        { type: "urchin", x: 580, y: 422, radius: 14 },
        {
          type: "jellyfish",
          x: 350,
          y: 580,
          baseY: 580,
          rangeY: 55,
          speed: 0.05,
          radius: 15,
          seed: 5,
        },
        { type: "urchin", x: 570, y: 632, radius: 14 },
        {
          type: "jellyfish",
          x: 650,
          y: 780,
          baseY: 780,
          rangeY: 50,
          speed: 0.04,
          radius: 15,
          seed: 6,
        },
        { type: "urchin", x: 540, y: 852, radius: 14 },
        { type: "urchin", x: 815, y: 952, radius: 14 },
      ],
      stars: [
        { x: 150, y: 180 },
        { x: 365, y: 280 },
        { x: 580, y: 380 },
        { x: 810, y: 470 },
        { x: 570, y: 590 },
        { x: 300, y: 700 },
        { x: 540, y: 810 },
        { x: 815, y: 910 },
        { x: 575, y: 1020 },
        { x: 850, y: 1130 },
      ],
      decorations: [],
    },
  ];

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

    update(deltaSec) {
      const dt = deltaSec * 60;
      this.angle += 0.04 * dt;
      this.sparklePhase += 0.08 * dt;
    }

    draw() {
      if (this.collected) return;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.sin(this.angle) * 0.2);

      const glowSize = 18 + Math.sin(this.sparklePhase) * 4;
      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, glowSize);
      grad.addColorStop(0, "rgba(255, 221, 89, 0.7)");
      grad.addColorStop(1, "rgba(255, 221, 89, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffdd59";
      ctx.strokeStyle = "#d35400";
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

      ctx.fillStyle = "#ffffff";
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

  // === HỆ THỐNG HIỆU ỨNG HẠT (PARTICLES) ===
  class BubbleParticle {
    constructor(x, y, vx, vy, size, color) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.size = size;
      this.color = color || "rgba(255, 255, 255, 0.6)";
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

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(
        this.x - this.size * 0.3,
        this.y - this.size * 0.3,
        this.size * 0.3,
        0,
        Math.PI * 2,
      );
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
      this.color = Math.random() > 0.5 ? "#ffdd59" : "#ffffff";
      this.life = 1;
      this.decay = 0.03 + Math.random() * 0.03;
    }

    update(deltaSec) {
      const dt = deltaSec * 60;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
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

  const ambientBubbles = [];
  for (let i = 0; i < 28; i++) {
    ambientBubbles.push({
      x: Math.random() * 480,
      y: Math.random() * 700,
      size: 2 + Math.random() * 5,
      speed: 0.6 + Math.random() * 1.2,
      wobbleSpeed: 0.02 + Math.random() * 0.04,
      wobble: Math.random() * Math.PI * 2,
    });
  }

  // === HÀM VẼ BỆ ĐỠ (PLATFORMS) ===
  function drawPlatform(p) {
    ctx.save();
    ctx.strokeStyle = "#130f40";
    ctx.lineWidth = 3;

    if (p.type === "coral") {
      const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
      grad.addColorStop(0, "#ff6b81");
      grad.addColorStop(1, "#c0392b");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.width, p.height, [8, 8, 4, 4]);
      ctx.fill();
      ctx.stroke();

      // Mũ san hô trên nóc bệ
      ctx.fillStyle = "#ff4757";
      for (let bx = p.x + 8; bx < p.x + p.width - 6; bx += 14) {
        ctx.beginPath();
        ctx.arc(bx, p.y, 4, Math.PI, 0);
        ctx.fill();
      }
    } else if (p.type === "crystal") {
      const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
      grad.addColorStop(0, "#574b90");
      grad.addColorStop(1, "#303952");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.width, p.height, 6);
      ctx.fill();
      ctx.stroke();

      // Viền tinh thể phát sáng tím cyan
      ctx.strokeStyle = "#00d2d3";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x + 4, p.y + 4);
      ctx.lineTo(p.x + p.width - 4, p.y + 4);
      ctx.stroke();
    } else if (p.type === "wood") {
      const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
      grad.addColorStop(0, "#964b00");
      grad.addColorStop(1, "#542700");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.width, p.height, 5);
      ctx.fill();
      ctx.stroke();

      // Vân gỗ và đinh đồng
      ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x + 6, p.y + p.height / 2);
      ctx.lineTo(p.x + p.width - 6, p.y + p.height / 2);
      ctx.stroke();

      ctx.fillStyle = "#ffd32a";
      ctx.beginPath();
      ctx.arc(p.x + 8, p.y + 6, 2, 0, Math.PI * 2);
      ctx.arc(p.x + p.width - 8, p.y + 6, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === "volcano") {
      const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
      grad.addColorStop(0, "#2f3542");
      grad.addColorStop(1, "#1e272e");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.width, p.height, 6);
      ctx.fill();
      ctx.stroke();

      // Vệt dung nham nóng đỏ
      ctx.strokeStyle = "#ff4757";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p.x + 10, p.y + p.height * 0.4);
      ctx.lineTo(p.x + p.width * 0.4, p.y + p.height * 0.7);
      ctx.lineTo(p.x + p.width * 0.8, p.y + p.height * 0.3);
      ctx.stroke();
    } else if (p.type === "ancient") {
      const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
      grad.addColorStop(0, "#00a8ff");
      grad.addColorStop(1, "#0078a8");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.width, p.height, 8);
      ctx.fill();
      ctx.stroke();

      // Viền chạm khắc vàng cổ Atlantis
      ctx.strokeStyle = "#f1c40f";
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x + 4, p.y + 4, p.width - 8, p.height - 8);
    }
    ctx.restore();
  }

  // === HÀM VẼ VÀ CẬP NHẬT CẠM BẪY (HAZARDS) ===
  function updateHazards(map, dt) {
    if (!map.hazards) return;
    map.hazards.forEach((h) => {
      if (h.type === "jellyfish") {
        h.y =
          h.baseY + Math.sin(frameCount * h.speed + (h.seed || 0)) * h.rangeY;
      }
    });
  }

  function drawHazard(h) {
    ctx.save();
    if (h.type === "urchin") {
      ctx.translate(h.x, h.y);
      const pulse = Math.sin(frameCount * 0.08) * 2;
      ctx.fillStyle = "#2f3640";
      ctx.strokeStyle = "#130f40";
      ctx.lineWidth = 2;

      // 12 gai nhọn xoay tròn
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        const sx = Math.cos(a) * (h.radius + 6 + pulse);
        const sy = Math.sin(a) * (h.radius + 6 + pulse);
        const b1x = Math.cos(a - 0.22) * (h.radius * 0.7);
        const b1y = Math.sin(a - 0.22) * (h.radius * 0.7);
        const b2x = Math.cos(a + 0.22) * (h.radius * 0.7);
        const b2y = Math.sin(a + 0.22) * (h.radius * 0.7);
        ctx.beginPath();
        ctx.moveTo(b1x, b1y);
        ctx.lineTo(sx, sy);
        ctx.lineTo(b2x, b2y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#353b48";
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#ff4757";
      ctx.fill();
    } else if (h.type === "jellyfish") {
      ctx.translate(h.x, h.y);
      const bob = Math.sin(frameCount * 0.06 + (h.seed || 0)) * 3;
      ctx.fillStyle = "rgba(255, 107, 129, 0.75)";
      ctx.strokeStyle = "#ff4757";
      ctx.lineWidth = 2;

      // Chuông sứa
      ctx.beginPath();
      ctx.arc(0, bob, h.radius, Math.PI, 0);
      ctx.quadraticCurveTo(h.radius, bob + 4, 0, bob + 3);
      ctx.quadraticCurveTo(-h.radius, bob + 4, -h.radius, bob);
      ctx.fill();
      ctx.stroke();

      // Xúc tu sứa
      ctx.strokeStyle = "rgba(255, 107, 129, 0.85)";
      ctx.lineWidth = 2;
      for (let t = -h.radius * 0.6; t <= h.radius * 0.6; t += 7) {
        const wave = Math.sin(frameCount * 0.1 + t) * 3;
        ctx.beginPath();
        ctx.moveTo(t, bob + 3);
        ctx.quadraticCurveTo(t + wave, bob + 14, t, bob + 24);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function checkHazardCollision(diver, h) {
    if (h.type === "urchin" || h.type === "jellyfish") {
      const dx = diver.x - h.x;
      const dy = diver.y - h.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < diver.radius + h.radius - 2;
    }
    return false;
  }

  // === HÀM VẼ RƯƠNG KHO BÁU ĐÍCH (GOAL) ===
  function drawGoal(goal) {
    if (!goal) return;
    const pulse = Math.sin(frameCount * 0.08) * 5;
    ctx.save();
    ctx.translate(goal.x + goal.width / 2, goal.y + goal.height / 2);

    // Vòng hào quang phát sáng
    const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, 36 + pulse);
    grad.addColorStop(0, "rgba(255, 221, 89, 0.65)");
    grad.addColorStop(1, "rgba(255, 221, 89, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 36 + pulse, 0, Math.PI * 2);
    ctx.fill();

    const hw = goal.width / 2;
    const hh = goal.height / 2;

    // Thân rương vàng
    ctx.fillStyle = "#f39c12";
    ctx.strokeStyle = "#130f40";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-hw, -hh + 10, goal.width, goal.height - 10, 6);
    ctx.fill();
    ctx.stroke();

    // Nắp rương hơi hé mở
    ctx.fillStyle = "#f1c40f";
    ctx.beginPath();
    ctx.roundRect(-hw - 2, -hh, goal.width + 4, 16, 6);
    ctx.fill();
    ctx.stroke();

    // Dlevel kim loại nạm rương
    ctx.fillStyle = "#e67e22";
    ctx.fillRect(-hw + 8, -hh + 10, 6, goal.height - 10);
    ctx.fillRect(hw - 14, -hh + 10, 6, goal.height - 10);

    // Lỗ khóa rương
    ctx.fillStyle = "#130f40";
    ctx.beginPath();
    ctx.arc(0, 4, 3.5, 0, Math.PI * 2);
    ctx.rect(-1.5, 4, 3, 5);
    ctx.fill();

    // Chữ ĐÍCH trên đầu rương
    ctx.font = "bold 13px Fredoka, sans-serif";
    ctx.fillStyle = "#ffdd59";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#130f40";
    ctx.lineWidth = 3;
    ctx.strokeText("🏆 ĐÍCH", 0, -hh - 8);
    ctx.fillText("🏆 ĐÍCH", 0, -hh - 8);

    ctx.restore();
  }

  // === HÀM VẼ TRANG TRÍ MAP (DECORATIONS) ===
  function drawMapDecorations(map) {
    if (!map.decorations) return;
    ctx.save();
    map.decorations.forEach((d) => {
      if (d.type === "seaweed") {
        ctx.fillStyle = "#2ed573";
        ctx.strokeStyle = "#130f40";
        ctx.lineWidth = 1.5;
        const wave = Math.sin(frameCount * 0.05 + d.x) * 4;
        ctx.beginPath();
        ctx.ellipse(d.x + wave, d.y - 12, 5, 14, wave * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (d.type === "coral_bush") {
        ctx.fillStyle = "#ff4757";
        ctx.beginPath();
        ctx.arc(d.x, d.y - 6, 7, 0, Math.PI * 2);
        ctx.arc(d.x + 7, d.y - 10, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.type === "crystal_cluster") {
        ctx.fillStyle = "#00d2d3";
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + 4, d.y - 14);
        ctx.lineTo(d.x + 8, d.y);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  // === CẬP NHẬT CAMERA THEO DÕI NHÂN VẬT ===
  function updateCamera(map) {
    if (!map) return;
    const targetX = diver.x - canvas.width / 2;
    const targetY = diver.y - canvas.height / 2;

    const maxX = Math.max(0, map.width - canvas.width);
    const maxY = Math.max(0, map.height - canvas.height);

    camera.x += (Math.max(0, Math.min(maxX, targetX)) - camera.x) * 0.15;
    camera.y += (Math.max(0, Math.min(maxY, targetY)) - camera.y) * 0.15;

    camera.x = Math.max(0, Math.min(maxX, camera.x));
    camera.y = Math.max(0, Math.min(maxY, camera.y));
  }

  // === HÀM VẼ NỀN BIỂN THEO MAP (OCEAN BACKGROUND) ===
  function drawBackground(map) {
    const topColor = map ? map.theme.topColor : "#0b5299";
    const bottomColor = map ? map.theme.bottomColor : "#052247";

    const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    oceanGrad.addColorStop(0, topColor);
    oceanGrad.addColorStop(1, bottomColor);

    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Tia sáng mặt trời xuyên biển (nếu map có nắng)
    if (map && map.theme.sunRays) {
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 4; i++) {
        const rayX =
          (canvas.width / 4) * i + Math.sin(frameCount * 0.02 + i) * 30;
        ctx.beginPath();
        ctx.moveTo(rayX - 20, 0);
        ctx.lineTo(rayX + 40, 0);
        ctx.lineTo(rayX + 110, canvas.height);
        ctx.lineTo(rayX - 60, canvas.height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // Bọt nước trôi lơ lửng trên màn hình
    ctx.save();
    ambientBubbles.forEach((b) => {
      b.wobble += b.wobbleSpeed;
      b.y -= b.speed;
      if (b.y < -20) {
        b.y = canvas.height + 20;
        b.x = Math.random() * canvas.width;
      }
      const bx = b.x + Math.sin(b.wobble) * 6;
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.beginPath();
      ctx.arc(bx, b.y, b.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // === XỬ LÝ HẠT HIỆU ỨNG (PARTICLES) ===
  function handleParticles(deltaSec) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update(deltaSec);
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  // === VÒNG LẶP CHÍNH CỦA TRÒ CHƠI (MAIN GAME LOOP) ===
  function gameLoop(timestamp) {
    frameCount++;

    if (!lastTimestamp) lastTimestamp = timestamp;
    const deltaMs = Math.min(timestamp - lastTimestamp, 100);
    const deltaSec = deltaMs / 1000;
    lastTimestamp = timestamp;

    drawBackground(currentMap);

    if (currentState === STATE.PLAYING && currentMap) {
      playTimeMs += deltaMs;

      // Cập nhật nhân vật & cạm bẫy
      diver.update(deltaSec, currentMap);
      updateHazards(currentMap, deltaSec);
      updateCamera(currentMap);

      // Kiểm tra va chạm cạm bẫy
      if (currentMap.hazards) {
        for (const h of currentMap.hazards) {
          if (checkHazardCollision(diver, h)) {
            gameOver();
            break;
          }
        }
      }

      // Kiểm tra nhặt sao
      if (currentState === STATE.PLAYING) {
        for (let i = mapStars.length - 1; i >= 0; i--) {
          const s = mapStars[i];
          s.update(deltaSec);
          if (s.checkCollect(diver)) {
            starsCollected++;
            gacha.addStars(1);
            sound.playStar();
            starCountEl.textContent = starsCollected;
            for (let k = 0; k < 12; k++) {
              particles.push(new SparkleParticle(s.x, s.y));
            }
          }
        }

        // Kiểm tra đến đích (Goal)
        if (
          currentMap.goal &&
          diver.checkAABB(
            diver.x - diver.halfW,
            diver.y - diver.halfH,
            diver.halfW * 2,
            diver.halfH * 2,
            currentMap.goal.x,
            currentMap.goal.y,
            currentMap.goal.width,
            currentMap.goal.height,
          )
        ) {
          levelWon();
        }
      }

      handleParticles(deltaSec);

      // Vẽ toàn bộ thế giới game trong góc nhìn Camera
      ctx.save();
      ctx.translate(-Math.round(camera.x), -Math.round(camera.y));

      drawMapDecorations(currentMap);
      currentMap.platforms.forEach(drawPlatform);
      if (currentMap.hazards) currentMap.hazards.forEach(drawHazard);
      drawGoal(currentMap.goal);
      mapStars.forEach((star) => star.draw());
      particles.forEach((p) => p.draw());
      diver.draw();

      ctx.restore();
    } else {
      // Khi ở màn hình ngoài, vẽ nhân vật bồng bềnh nhẹ
      handleParticles(deltaSec);
      if (currentState === STATE.START || currentState === STATE.LEVEL_SELECT) {
        ctx.save();
        diver.x = canvas.width / 2;
        diver.y = 130 + Math.sin(frameCount * 0.05) * 8;
        diver.flipperAngle += 0.1;
        diver.draw();
        ctx.restore();
      } else if (currentMap) {
        // Tạm dừng: giữ nguyên thế giới tĩnh
        ctx.save();
        ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
        drawMapDecorations(currentMap);
        currentMap.platforms.forEach(drawPlatform);
        if (currentMap.hazards) currentMap.hazards.forEach(drawHazard);
        drawGoal(currentMap.goal);
        mapStars.forEach((star) => star.draw());
        particles.forEach((p) => p.draw());
        diver.draw();
        ctx.restore();
      }
    }

    requestAnimationFrame(gameLoop);
  }

  // === ĐIỀU HÀNH TRẠNG THÁI MÀN CHƠI & MÀN HÌNH ===
  function showLevelSelect() {
    sound.init();
    startScreen.classList.remove("active");
    pauseScreen.classList.remove("active");
    gameOverScreen.classList.remove("active");
    victoryScreen.classList.remove("active");

    renderLevelGrid();
    levelSelectScreen.classList.add("active");
    currentState = STATE.LEVEL_SELECT;
  }

  function renderLevelGrid() {
    levelGridEl.innerHTML = "";
    MAPS.forEach((map) => {
      const isUnlocked = map.id <= unlockedLevel;
      const bestStars =
        parseInt(localStorage.getItem(`sea_level_${map.id}_stars`)) || 0;
      const totalStars = map.stars.length;

      const card = document.createElement("div");
      card.className = `level-card ${isUnlocked ? "" : "locked"}`;

      card.innerHTML = `
        <div class="level-card-left">
          <div class="level-badge">${map.id}</div>
        </div>
      `;

      if (isUnlocked) {
        card.addEventListener("click", () => {
          levelSelectScreen.classList.remove("active");
          startLevel(map.id);
        });
      }

      levelGridEl.appendChild(card);
    });
  }

  function startLevel(levelId) {
    sound.init();
    sound.playStart();

    currentLevel = levelId;
    currentMap = MAPS.find((m) => m.id === levelId) || MAPS[0];

    starsCollected = 0;
    playTimeMs = 0;
    lastTimestamp = performance.now();
    particles = [];

    // Khởi tạo sao trong map
    mapStars = currentMap.stars.map((s) => new Star(s.x, s.y));

    // Cập nhật HUD
    levelDisplayEl.textContent = `Level ${currentMap.id}`;
    starCountEl.textContent = "0";
    totalLevelStarsEl.textContent = currentMap.stars.length;

    // Đặt vị trí ban đầu của thợ lặn
    diver.reset(currentMap.playerStart.x, currentMap.playerStart.y);

    // Căn camera ngay vào nhân vật
    camera.x = Math.max(
      0,
      Math.min(currentMap.width - canvas.width, diver.x - canvas.width / 2),
    );
    camera.y = Math.max(
      0,
      Math.min(currentMap.height - canvas.height, diver.y - canvas.height / 2),
    );

    startScreen.classList.remove("active");
    levelSelectScreen.classList.remove("active");
    pauseScreen.classList.remove("active");
    gameOverScreen.classList.remove("active");
    victoryScreen.classList.remove("active");

    currentState = STATE.PLAYING;
  }

  function pauseGame() {
    if (currentState !== STATE.PLAYING) return;
    currentState = STATE.PAUSED;
    pauseScreen.classList.add("active");
  }

  function resumeGame() {
    if (currentState !== STATE.PAUSED) return;
    sound.init();
    lastTimestamp = performance.now();
    pauseScreen.classList.remove("active");
    currentState = STATE.PLAYING;
  }

  function gameOver() {
    currentState = STATE.GAMEOVER;
    sound.playCrash();

    // Hiệu ứng nổ bọt nước
    for (let i = 0; i < 20; i++) {
      particles.push(
        new BubbleParticle(
          diver.x,
          diver.y,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
          4 + Math.random() * 6,
          "rgba(255, 107, 53, 0.8)",
        ),
      );
    }

    finalStarsEl.textContent = `${starsCollected}/${currentMap.stars.length}`;
    finalLevelNameEl.textContent = `level ${currentMap.id}`;

    setTimeout(() => {
      gameOverScreen.classList.add("active");
    }, 400);
  }

  function levelWon() {
    currentState = STATE.VICTORY;
    sound.playVictory();

    // Nổ pháo hoa hạt lấp lánh ăn mừng
    for (let i = 0; i < 35; i++) {
      particles.push(
        new SparkleParticle(
          currentMap.goal.x + currentMap.goal.width / 2,
          currentMap.goal.y + currentMap.goal.height / 2,
        ),
      );
    }

    // Mở khóa level tiếp theo nếu chưa mở
    if (currentLevel >= unlockedLevel && unlockedLevel < 5) {
      unlockedLevel = currentLevel + 1;
      localStorage.setItem("sea_unlocked_level", unlockedLevel);
      updateStartScreenInfo();
    }

    // Lưu số sao cao nhất
    const prevStars =
      parseInt(localStorage.getItem(`sea_level_${currentLevel}_stars`)) || 0;
    if (starsCollected > prevStars) {
      localStorage.setItem(`sea_level_${currentLevel}_stars`, starsCollected);
    }

    victoryStarsEl.textContent = `${starsCollected}/${currentMap.stars.length}`;
    victoryTimeEl.textContent = `${Math.floor(playTimeMs / 1000)}s`;

    if (currentLevel >= 5) {
      btnNextLevel.style.display = "none";
    } else {
      btnNextLevel.style.display = "flex";
    }

    setTimeout(() => {
      victoryScreen.classList.add("active");
    }, 500);
  }

  function goHome() {
    startScreen.classList.add("active");
    levelSelectScreen.classList.remove("active");
    pauseScreen.classList.remove("active");
    gameOverScreen.classList.remove("active");
    victoryScreen.classList.remove("active");
    currentState = STATE.START;
    updateStartScreenInfo();
  }

  // === GẮN SỰ KIỆN NÚT BẤM GIAO DIỆN ===
  btnPlay.addEventListener("click", showLevelSelect);
  btnBackFromLevelSelect.addEventListener("click", goHome);

  btnResume.addEventListener("click", resumeGame);
  btnRestartFromPause.addEventListener("click", () => startLevel(currentLevel));
  btnHomeFromPause.addEventListener("click", goHome);

  btnRestart.addEventListener("click", () => startLevel(currentLevel));
  btnSelectFromOver.addEventListener("click", showLevelSelect);
  btnHomeFromOver.addEventListener("click", goHome);

  btnNextLevel.addEventListener("click", () => {
    if (currentLevel < 5) {
      startLevel(currentLevel + 1);
    }
  });
  btnReplayVictory.addEventListener("click", () => startLevel(currentLevel));
  btnSelectFromVictory.addEventListener("click", showLevelSelect);
  btnHomeFromVictory.addEventListener("click", goHome);

  btnPause.addEventListener("click", () => {
    if (currentState === STATE.PLAYING) pauseGame();
    else if (currentState === STATE.PAUSED) resumeGame();
  });

  btnSound.addEventListener("click", () => {
    sound.toggle();
  });

  // === GACHA UI ===
  const gachaScreen = document.getElementById("gachaScreen");
  const gachaStarCountEl = document.getElementById("gachaStarCount");
  const gachaResultArea = document.getElementById("gachaResultArea");
  const btnPull1 = document.getElementById("btnPull1");
  const btnPull10 = document.getElementById("btnPull10");
  const btnCloseGacha = document.getElementById("btnCloseGacha");
  const btnGachaFromStart = document.getElementById("btnGachaFromStart");
  const btnGachaFromOver = document.getElementById("btnGachaFromOver");
  const skinGridEl = document.getElementById("skinGrid");
  const pityRareEl = document.getElementById("pityRareCount");
  const pityEpicEl = document.getElementById("pityEpicCount");

  function openGacha() {
    gachaScreen.classList.add("active");
    updateGachaUI();
  }

  function closeGacha() {
    gachaScreen.classList.remove("active");
  }

  function updateGachaUI() {
    gachaStarCountEl.textContent = gacha.totalStars;
    pityRareEl.textContent = gacha.pityRare;
    pityEpicEl.textContent = gacha.pityEpic;
    btnPull1.disabled = gacha.totalStars < 10;
    btnPull10.disabled = gacha.totalStars < 90;
    renderSkinGrid();
  }

  function renderSkinGrid() {
    skinGridEl.innerHTML = "";
    SKINS.forEach((skin) => {
      const owned = gacha.ownedSkins.includes(skin.id);
      const equipped = gacha.equippedSkin === skin.id;

      const slot = document.createElement("div");
      slot.className =
        "skin-slot" + (owned ? "" : " locked") + (equipped ? " equipped" : "");

      const rarityClass =
        {
          common: "rarity-common",
          rare: "rarity-rare",
          epic: "rarity-epic",
          legend: "rarity-legend",
        }[skin.rarity] || "";

      slot.innerHTML = `
                    ${equipped ? '<span class="equipped-badge">✓ CHỌN</span>' : ""}
                    ${!owned ? '<span class="locked-icon">🔒</span>' : ""}
                    <span class="slot-emoji">${skin.emoji}</span>
                    <span class="slot-name ${rarityClass}">${skin.name.replace("\\n", "<br>")}</span>
                    <span class="slot-rarity ${rarityClass}">${skin.rarityName}</span>
                `;

      if (owned && !equipped) {
        slot.addEventListener("click", () => {
          gacha.equipSkin(skin.id);
          renderSkinGrid();
        });
      }

      skinGridEl.appendChild(slot);
    });
  }

  function rarityClass(skin) {
    return (
      {
        common: "rarity-common",
        rare: "rarity-rare",
        epic: "rarity-epic",
        legend: "rarity-legend",
      }[skin.rarity] || ""
    );
  }

  function showSingleResult(skin) {
    gachaResultArea.innerHTML = `
                <div class="gacha-single-result ${rarityClass(skin)}">
                    <span class="result-emoji">${skin.emoji}</span>
                    <span class="result-name">${skin.name.replace("\\n", " ")}</span>
                    <span class="result-badge">${skin.rarityName}</span>
                </div>`;
  }

  function showMultiResult(skins) {
    const grid = document.createElement("div");
    grid.className = "gacha-multi-grid";
    skins.forEach((skin, i) => {
      const card = document.createElement("div");
      card.className = `gacha-mini-card ${rarityClass(skin)}`;
      card.style.animationDelay = `${i * 0.07}s`;
      card.innerHTML = `
                    <span class="mini-emoji">${skin.emoji}</span>
                    <span class="mini-rarity">${skin.rarityName}</span>`;
      grid.appendChild(card);
    });
    gachaResultArea.innerHTML = "";
    gachaResultArea.appendChild(grid);
  }

  function doPull(count) {
    const results = gacha.pull(count);
    if (!results) {
      gachaResultArea.innerHTML = `<div class="gacha-idle-art">😢</div><p class="gacha-idle-text">Không đủ sao!</p>`;
      return;
    }

    // Shake animation
    gachaResultArea.classList.add("gacha-shaking");
    setTimeout(() => gachaResultArea.classList.remove("gacha-shaking"), 600);

    setTimeout(() => {
      if (count === 1) showSingleResult(results[0]);
      else showMultiResult(results);
      updateGachaUI();
    }, 520);
  }

  btnPull1.addEventListener("click", () => doPull(1));
  btnPull10.addEventListener("click", () => doPull(10));
  btnCloseGacha.addEventListener("click", closeGacha);
  btnGachaFromStart.addEventListener("click", () => {
    sound.init();
    openGacha();
  });
  btnGachaFromOver.addEventListener("click", () => {
    sound.init();
    openGacha();
  });

  // Bắt đầu vòng lặp game
  requestAnimationFrame(gameLoop);
})();
