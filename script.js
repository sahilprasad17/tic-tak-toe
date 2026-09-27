/**
 * Tanya vs Chiku - Tic-Tac-Toe Game Engine
 * Custom 2-Player Interactive Game
 */

(() => {
  'use strict';

  // --- Image Asset Constants ---
  const ASSETS = {
    tanya: 'tanya.jpg',
    chiku: 'chiku.jpg',
    defaultBg: 'default-bg.jpg'
  };

  // Winning Combinations (3 rows, 3 columns, 2 diagonals)
  const WINNING_COMBINATIONS = [
    [0, 1, 2], // Row 1
    [3, 4, 5], // Row 2
    [6, 7, 8], // Row 3
    [0, 3, 6], // Col 1
    [1, 4, 7], // Col 2
    [2, 5, 8], // Col 3
    [0, 4, 8], // Diagonal top-left to bottom-right
    [2, 4, 6]  // Diagonal top-right to bottom-left
  ];

  // Game State
  let board = Array(9).fill(null);
  let currentPlayer = 'X'; // 'X' is Tanya, 'O' is Chiku
  let isGameOver = false;
  let isAudioEnabled = true;

  // Scores (Persisted in localStorage)
  let scores = {
    X: 0,
    O: 0,
    draws: 0
  };

  // DOM Elements
  const cells = document.querySelectorAll('.cell');
  const boardEl = document.getElementById('game-board');
  const strikeSvg = document.getElementById('strike-svg');
  const strikeLine = document.getElementById('strike-line');

  const bgDefault = document.getElementById('bg-default');
  const bgTanya = document.getElementById('bg-tanya');
  const bgChiku = document.getElementById('bg-chiku');

  const statusBanner = document.getElementById('status-banner');
  const bannerIcon = document.getElementById('banner-icon');
  const bannerText = document.getElementById('banner-text');

  const playerCardX = document.getElementById('player-card-x');
  const playerCardO = document.getElementById('player-card-o');
  const scoreTanyaEl = document.getElementById('score-tanya');
  const scoreChikuEl = document.getElementById('score-chiku');
  const scoreDrawsEl = document.getElementById('score-draws');

  const restartBtn = document.getElementById('restart-btn');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const soundIcon = document.getElementById('sound-icon');
  const resetScoresBtn = document.getElementById('reset-scores-btn');

  // Victory Modal Elements
  const victoryModal = document.getElementById('victory-modal');
  const modalWinnerAvatar = document.getElementById('modal-winner-avatar');
  const modalWinnerSymbol = document.getElementById('modal-winner-symbol');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalPlayAgainBtn = document.getElementById('modal-play-again-btn');

  // Confetti Canvas
  const confettiCanvas = document.getElementById('confetti-canvas');
  let confettiCtx = null;
  let confettiParticles = [];
  let confettiAnimationId = null;

  // ---------------------------------------------------------------------------
  // WEB AUDIO SYNTHESIZER (Rich micro-sounds without external dependencies)
  // ---------------------------------------------------------------------------
  let audioCtx = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type) {
    if (!isAudioEnabled) return;
    try {
      initAudioContext();
      if (!audioCtx) return;

      const now = audioCtx.currentTime;

      if (type === 'move-tanya') {
        // High sparkling bell tone
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'move-chiku') {
        // Warm sweet chime tone
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'win') {
        // Joyful 4-note arpeggio chord
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.22, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.5);
        });
      } else if (type === 'draw') {
        // Playful gentle bounce
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(392, now); // G4
        osc.frequency.setValueAtTime(349.23, now + 0.15); // F4
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'restart') {
        // Soft airy whoosh/click
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch (err) {
      console.warn('Audio playback error:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // LOCAL STORAGE & SCORE MANAGEMENT
  // ---------------------------------------------------------------------------
  function loadScores() {
    try {
      const saved = localStorage.getItem('tanya_chiku_tictactoe_scores');
      if (saved) {
        scores = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load scores from storage:', e);
    }
    updateScoreboardUI();
  }

  function saveScores() {
    try {
      localStorage.setItem('tanya_chiku_tictactoe_scores', JSON.stringify(scores));
    } catch (e) {
      console.warn('Failed to save scores to storage:', e);
    }
  }

  function updateScoreboardUI() {
    scoreTanyaEl.textContent = scores.X;
    scoreChikuEl.textContent = scores.O;
    scoreDrawsEl.textContent = scores.draws;
  }

  function resetScores() {
    if (confirm("Reset Tanya & Chiku's score history back to 0?")) {
      scores = { X: 0, O: 0, draws: 0 };
      saveScores();
      updateScoreboardUI();
      playSound('restart');
    }
  }

  // ---------------------------------------------------------------------------
  // FULLSCREEN BACKGROUND SWITCHER
  // ---------------------------------------------------------------------------
  function setFullscreenBackground(mode) {
    bgDefault.classList.remove('active');
    bgTanya.classList.remove('active');
    bgChiku.classList.remove('active');

    if (mode === 'tanya') {
      bgTanya.classList.add('active');
    } else if (mode === 'chiku') {
      bgChiku.classList.add('active');
    } else {
      bgDefault.classList.add('active');
    }
  }

  // ---------------------------------------------------------------------------
  // TURN & BANNER UPDATES
  // ---------------------------------------------------------------------------
  function updateTurnBanner() {
    statusBanner.className = 'status-banner';

    if (currentPlayer === 'X') {
      statusBanner.classList.add('banner-tanya');
      bannerIcon.textContent = '🌸';
      bannerText.textContent = "Tanya's Turn (X)";
      playerCardX.classList.add('active-player');
      playerCardO.classList.remove('active-player');
    } else {
      statusBanner.classList.add('banner-chiku');
      bannerIcon.textContent = '🌺';
      bannerText.textContent = "Chiku's Turn (O)";
      playerCardO.classList.add('active-player');
      playerCardX.classList.remove('active-player');
    }
  }

  // ---------------------------------------------------------------------------
  // CELL CLICK & MOVE LOGIC
  // ---------------------------------------------------------------------------
  function handleCellClick(e) {
    if (isGameOver) return;

    const cell = e.currentTarget;
    const index = parseInt(cell.getAttribute('data-index'), 10);

    // If cell already marked, ignore
    if (board[index] !== null) return;

    // Place current move
    board[index] = currentPlayer;
    cell.classList.add('taken');

    const contentSpan = cell.querySelector('.cell-content');
    contentSpan.textContent = currentPlayer;

    if (currentPlayer === 'X') {
      // Tanya move
      cell.classList.add('cell-x');
      // Explicit style per requirement
      cell.style.backgroundImage = `url('${ASSETS.tanya}')`;
      cell.style.backgroundSize = 'cover';
      cell.style.backgroundPosition = 'center';
      playSound('move-tanya');
    } else {
      // Chiku move
      cell.classList.add('cell-o');
      // Explicit style per requirement
      cell.style.backgroundImage = `url('${ASSETS.chiku}')`;
      cell.style.backgroundSize = 'cover';
      cell.style.backgroundPosition = 'center';
      playSound('move-chiku');
    }

    // Check Win or Draw condition
    const winningCombo = checkWin(currentPlayer);

    if (winningCombo) {
      handleWin(currentPlayer, winningCombo);
    } else if (isBoardFull()) {
      handleDraw();
    } else {
      // Switch player turn
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      updateTurnBanner();
    }
  }

  function checkWin(player) {
    for (let combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      if (board[a] === player && board[b] === player && board[c] === player) {
        return combo;
      }
    }
    return null;
  }

  function isBoardFull() {
    return board.every(cell => cell !== null);
  }

  let currentWinningCombo = null;

  // ---------------------------------------------------------------------------
  // WIN STATE HANDLER
  // ---------------------------------------------------------------------------
  function handleWin(winner, combo) {
    isGameOver = true;
    currentWinningCombo = combo;
    scores[winner]++;
    saveScores();
    updateScoreboardUI();

    const isTanya = winner === 'X';
    const winnerName = isTanya ? 'Tanya' : 'Chiku';
    const winnerPhoto = isTanya ? ASSETS.tanya : ASSETS.chiku;

    // 1. Highlight the 3 winning tiles
    combo.forEach(idx => {
      cells[idx].classList.add('cell-winner');
    });

    // 2. Draw SVG line over the winning 3 cells
    drawStrikeLine(combo);

    // 3. Fullscreen background transitions to winner's photo
    setFullscreenBackground(isTanya ? 'tanya' : 'chiku');

    // 4. Update banner to celebratory win state
    statusBanner.className = 'status-banner banner-win';
    bannerIcon.textContent = '🎉';
    bannerText.textContent = `🎉 ${winnerName} Wins! 🎉`;

    // 5. Fire celebratory sounds & confetti!
    playSound('win');
    startConfetti();

    // 6. Present victory celebration modal
    setTimeout(() => {
      modalWinnerAvatar.src = winnerPhoto;
      modalWinnerSymbol.textContent = winner;
      modalWinnerSymbol.className = `modal-winner-symbol ${isTanya ? 'badge-x' : 'badge-o'}`;
      modalTitle.textContent = `🎉 ${winnerName} Wins! 🎉`;
      modalDesc.textContent = `Superb victory by ${winnerName}! Claiming sisterhood bragging rights! 👑`;
      victoryModal.classList.add('show');
    }, 600);
  }

  // ---------------------------------------------------------------------------
  // DRAW STATE HANDLER
  // ---------------------------------------------------------------------------
  function handleDraw() {
    isGameOver = true;
    currentWinningCombo = null;
    scores.draws++;
    saveScores();
    updateScoreboardUI();

    // Per requirements: Do NOT change background to either player
    // Keep fullscreen background as default
    setFullscreenBackground('default');

    // Update banner
    statusBanner.className = 'status-banner banner-draw';
    bannerIcon.textContent = '🤝';
    bannerText.textContent = "It's a Draw! Well played!";

    playSound('draw');

    // Present friendly draw modal
    setTimeout(() => {
      modalWinnerAvatar.src = ASSETS.defaultBg;
      modalWinnerSymbol.textContent = '🤝';
      modalWinnerSymbol.className = 'modal-winner-symbol';
      modalTitle.textContent = "🤝 It's a Draw! 🤝";
      modalDesc.textContent = "Both Tanya and Chiku played like true champions! Ready for a rematch?";
      victoryModal.classList.add('show');
    }, 600);
  }

  // ---------------------------------------------------------------------------
  // STRIKE LINE DRAWING
  // ---------------------------------------------------------------------------
  function drawStrikeLine(combo) {
    if (!combo || combo.length < 3) return;

    const firstCell = cells[combo[0]];
    const lastCell = cells[combo[2]];

    const boardRect = boardEl.getBoundingClientRect();
    const firstRect = firstCell.getBoundingClientRect();
    const lastRect = lastCell.getBoundingClientRect();

    let x1 = firstRect.left + firstRect.width / 2 - boardRect.left;
    let y1 = firstRect.top + firstRect.height / 2 - boardRect.top;
    let x2 = lastRect.left + lastRect.width / 2 - boardRect.left;
    let y2 = lastRect.top + lastRect.height / 2 - boardRect.top;

    // Extend line slightly beyond cell centers for sleek look
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
      const pad = 24;
      const ux = dx / dist;
      const uy = dy / dist;
      x1 -= ux * pad;
      y1 -= uy * pad;
      x2 += ux * pad;
      y2 += uy * pad;
    }

    strikeLine.setAttribute('x1', x1);
    strikeLine.setAttribute('y1', y1);
    strikeLine.setAttribute('x2', x2);
    strikeLine.setAttribute('y2', y2);

    strikeLine.classList.add('draw-line');
  }

  function clearStrikeLine() {
    currentWinningCombo = null;
    strikeLine.classList.remove('draw-line');
    strikeLine.setAttribute('x1', 0);
    strikeLine.setAttribute('y1', 0);
    strikeLine.setAttribute('x2', 0);
    strikeLine.setAttribute('y2', 0);
  }

  // ---------------------------------------------------------------------------
  // RESTART / RESET GAME
  // ---------------------------------------------------------------------------
  function restartGame() {
    // Clear state
    board = Array(9).fill(null);
    currentPlayer = 'X'; // Reset turn back to Tanya (X)
    isGameOver = false;

    // Clear board cells
    cells.forEach(cell => {
      cell.classList.remove('taken', 'cell-x', 'cell-o', 'cell-winner');
      cell.style.backgroundImage = '';
      cell.style.backgroundSize = '';
      cell.style.backgroundPosition = '';
      const content = cell.querySelector('.cell-content');
      if (content) content.textContent = '';
    });

    // Reset strike line
    clearStrikeLine();

    // Reset entire screen background back to default
    setFullscreenBackground('default');

    // Close victory modal
    victoryModal.classList.remove('show');

    // Stop confetti
    stopConfetti();

    // Reset turn banner & active indicators
    updateTurnBanner();

    // Sound effect
    playSound('restart');
  }

  // ---------------------------------------------------------------------------
  // CELEBRATION CONFETTI ENGINE (Custom lightweight canvas)
  // ---------------------------------------------------------------------------
  function initConfettiCanvas() {
    if (!confettiCanvas) return;
    confettiCtx = confettiCanvas.getContext('2d');
    resizeConfettiCanvas();
    window.addEventListener('resize', resizeConfettiCanvas);
  }

  function resizeConfettiCanvas() {
    if (!confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    if (currentWinningCombo) {
      drawStrikeLine(currentWinningCombo);
    }
  }

  function startConfetti() {
    if (!confettiCanvas || !confettiCtx) return;
    stopConfetti();
    resizeConfettiCanvas();

    const colors = ['#10b981', '#f43f5e', '#fbbf24', '#3b82f6', '#ec4899', '#ffffff', '#a855f7'];
    confettiParticles = [];

    // Create 120 vibrant particles
    for (let i = 0; i < 120; i++) {
      confettiParticles.push({
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * confettiCanvas.height * 0.4 - confettiCanvas.height * 0.4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        velX: (Math.random() - 0.5) * 4,
        velY: Math.random() * 4 + 3,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 6,
        isHeart: Math.random() > 0.7
      });
    }

    animateConfetti();
  }

  function animateConfetti() {
    if (!confettiCtx) return;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    let activeParticles = 0;

    confettiParticles.forEach(p => {
      p.x += p.velX;
      p.y += p.velY;
      p.rotation += p.rotSpeed;

      if (p.y < confettiCanvas.height + 20) {
        activeParticles++;

        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate((p.rotation * Math.PI) / 180);
        confettiCtx.fillStyle = p.color;

        if (p.isHeart) {
          // Draw mini heart
          const h = p.size;
          confettiCtx.beginPath();
          confettiCtx.moveTo(0, 0);
          confettiCtx.bezierCurveTo(-h / 2, -h / 2, -h, h / 3, 0, h);
          confettiCtx.bezierCurveTo(h, h / 3, h / 2, -h / 2, 0, 0);
          confettiCtx.fill();
        } else {
          // Draw fluttering square
          confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }

        confettiCtx.restore();
      }
    });

    if (activeParticles > 0) {
      confettiAnimationId = requestAnimationFrame(animateConfetti);
    } else {
      stopConfetti();
    }
  }

  function stopConfetti() {
    if (confettiAnimationId) {
      cancelAnimationFrame(confettiAnimationId);
      confettiAnimationId = null;
    }
    if (confettiCtx && confettiCanvas) {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
    confettiParticles = [];
  }

  // ---------------------------------------------------------------------------
  // KEYBOARD ACCESSIBILITY
  // ---------------------------------------------------------------------------
  function handleCellKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCellClick(e);
    }
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------
  function initGame() {
    // Bind Cell Events
    cells.forEach(cell => {
      cell.addEventListener('click', handleCellClick);
      cell.addEventListener('keydown', handleCellKeyDown);
    });

    // Action Buttons
    restartBtn.addEventListener('click', restartGame);
    modalPlayAgainBtn.addEventListener('click', restartGame);
    resetScoresBtn.addEventListener('click', resetScores);

    // Audio Toggle
    soundToggleBtn.addEventListener('click', () => {
      isAudioEnabled = !isAudioEnabled;
      soundIcon.textContent = isAudioEnabled ? '🔊' : '🔇';
      soundToggleBtn.title = isAudioEnabled ? 'Mute Sound' : 'Unmute Sound';
      if (isAudioEnabled) playSound('restart');
    });

    // Close modal by clicking outside card
    victoryModal.addEventListener('click', (e) => {
      if (e.target === victoryModal) {
        victoryModal.classList.remove('show');
      }
    });

    // Handle Image Error fallbacks
    bgTanya.style.backgroundImage = `url('${ASSETS.tanya}')`;
    bgChiku.style.backgroundImage = `url('${ASSETS.chiku}')`;
    bgDefault.style.backgroundImage = `url('${ASSETS.defaultBg}')`;

    // Load initial state
    loadScores();
    setFullscreenBackground('default');
    updateTurnBanner();
    initConfettiCanvas();
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
  } else {
    initGame();
  }
})();
