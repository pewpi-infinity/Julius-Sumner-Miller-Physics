/* ============================================================
   Julius Sumner Miller Physics — JavaScript
   ============================================================ */

// ── Tokens (localStorage) ──────────────────────────────────
const TOKEN_KEY = 'jsm_tokens';
const QUIZ_DONE_KEY = 'jsm_quiz_done';
const VIDEO_WATCHED_KEY = 'jsm_videos_watched';

function getTokens() {
  try {
    return parseInt(localStorage.getItem(TOKEN_KEY) || '0', 10);
  } catch (_) {
    return 0;
  }
}
function addTokens(n) {
  const t = getTokens() + n;
  try {
    localStorage.setItem(TOKEN_KEY, t);
  } catch (_) {
    // Ignore storage write failures (e.g. private mode / storage disabled)
  }
  updateAllTokenDisplays();
  return t;
}
function updateAllTokenDisplays() {
  const t = getTokens();
  document.querySelectorAll('.js-token-count').forEach(el => { el.textContent = t; });
}

// ── Hamburger Menu ─────────────────────────────────────────
function initHamburger() {
  const btn     = document.getElementById('hamburger-btn');
  const menu    = document.getElementById('nav-menu');
  const overlay = document.getElementById('nav-overlay');
  if (!btn || !menu) return;

  function open() {
    btn.classList.add('open');
    menu.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    btn.classList.remove('open');
    menu.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  btn.addEventListener('click', () => menu.classList.contains('open') ? close() : open());
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  // Mark active link
  const path = location.pathname.split('/').pop() || 'index.html';
  menu.querySelectorAll('a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
}

// ── Video Playlist ─────────────────────────────────────────
const JSM_VIDEOS = [
  {
    id: 'p5oUI7RCyUI',
    title: 'Why Is It So? — Mechanics & Motion',
    topic: 'Mechanics'
  },
  {
    id: 'j-ixGKZlgKo',
    title: 'Why Is It So? — Gravity & Free Fall',
    topic: 'Gravity'
  },
  {
    id: 'hmFQqjMF_f0',
    title: 'Why Is It So? — Pendulums & Oscillation',
    topic: 'Oscillation'
  },
  {
    id: 'pMbWrPYCpDw',
    title: 'Why Is It So? — Pressure & Fluids',
    topic: 'Fluids'
  },
  {
    id: 'KPZ_8pL_a_g',
    title: 'Why Is It So? — Heat & Temperature',
    topic: 'Thermodynamics'
  },
  {
    id: 'RVsi2DM1xbU',
    title: 'Why Is It So? — Electricity & Magnetism',
    topic: 'Electromagnetism'
  },
  {
    id: 'sENgdSF8ppA',
    title: 'Why Is It So? — Light & Optics',
    topic: 'Optics'
  },
  {
    id: 'zQ1sMhFDjNE',
    title: 'Why Is It So? — Sound & Waves',
    topic: 'Waves'
  },
  {
    id: 'BLEiE-TdNNQ',
    title: 'Julius Sumner Miller Demos — Inertia',
    topic: 'Inertia'
  },
  {
    id: 'vFfninh2Zbk',
    title: 'Julius Sumner Miller — Surface Tension',
    topic: 'Surface Tension'
  },
  {
    id: 'D-LQeWREUVs',
    title: 'Why Is It So? — The Gyroscope',
    topic: 'Gyroscope'
  },
  {
    id: 'Wb7eDXbhLco',
    title: 'Why Is It So? — Atmospheric Pressure',
    topic: 'Pressure'
  }
];

let currentVideoIndex = 0;

function initPlaylist() {
  const iframe   = document.getElementById('main-player');
  const grid     = document.getElementById('playlist-grid');
  const titleEl  = document.getElementById('video-title');
  const topicEl  = document.getElementById('video-topic');
  if (!iframe || !grid) return;

  function loadVideo(idx) {
    currentVideoIndex = idx;
    const v = JSM_VIDEOS[idx];
    iframe.src = `https://www.youtube.com/embed/${v.id}?autoplay=1&rel=0&modestbranding=1`;
    if (titleEl) titleEl.textContent = v.title;
    if (topicEl) topicEl.textContent = v.topic;
    grid.querySelectorAll('.playlist-item').forEach((el, i) => {
      el.classList.toggle('active', i === idx);
    });
    // Award token for watching (once per video per session)
    let watched = [];
    try {
      watched = JSON.parse(sessionStorage.getItem(VIDEO_WATCHED_KEY) || '[]');
    } catch (_) {
      watched = [];
    }
    if (!watched.includes(v.id)) {
      watched.push(v.id);
      try {
        sessionStorage.setItem(VIDEO_WATCHED_KEY, JSON.stringify(watched));
      } catch (_) {
        // Ignore storage write failures
      }
      addTokens(2);
      showToast('🏅 +2 tokens for watching a video!');
    }
  }

  JSM_VIDEOS.forEach((v, i) => {
    const item = document.createElement('div');
    item.className = 'playlist-item' + (i === 0 ? ' active' : '');
    item.innerHTML = `
      <div class="playlist-thumb">
        <img src="https://img.youtube.com/vi/${v.id}/mqdefault.jpg"
             alt="${v.title}" loading="lazy"
             onerror="this.src='sddefault.jpg'">
        <div class="play-icon">▶</div>
      </div>
      <div class="playlist-title">${v.title}</div>
    `;
    item.addEventListener('click', () => loadVideo(i));
    grid.appendChild(item);
  });

  // Auto-load first video without autoplay (allow user to click)
  const first = JSM_VIDEOS[0];
  iframe.src = `https://www.youtube.com/embed/${first.id}?rel=0&modestbranding=1`;
  if (titleEl) titleEl.textContent = first.title;
  if (topicEl) topicEl.textContent = first.topic;
}

// ── Lightbox ───────────────────────────────────────────────
let lightboxItems = [];
let lightboxIdx   = 0;

function initGallery() {
  const lb      = document.getElementById('lightbox');
  const lbImg   = document.getElementById('lb-img');
  const lbCap   = document.getElementById('lb-caption');
  const lbClose = document.getElementById('lb-close');
  const lbPrev  = document.getElementById('lb-prev');
  const lbNext  = document.getElementById('lb-next');
  if (!lb) return;

  lightboxItems = Array.from(document.querySelectorAll('.gallery-item'));

  lightboxItems.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
  });

  function openLightbox(i) {
    lightboxIdx = i;
    const img = lightboxItems[i].querySelector('img');
    const cap = lightboxItems[i].querySelector('.gallery-caption');
    if (img) {
      lbImg.src = img.src;
      lbImg.style.display = '';
    } else {
      lbImg.removeAttribute('src');
      lbImg.style.display = 'none';
    }
    lbCap.textContent = cap ? cap.textContent : '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }
  function navigate(dir) {
    lightboxIdx = (lightboxIdx + dir + lightboxItems.length) % lightboxItems.length;
    openLightbox(lightboxIdx);
  }

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', () => navigate(-1));
  lbNext.addEventListener('click', () => navigate(1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'ArrowLeft')  navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
    if (e.key === 'Escape')     closeLightbox();
  });
}

// ── Quiz Engine ────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  {
    q: 'What was the title of Julius Sumner Miller\'s famous TV series aired in Australia?',
    opts: ['Why Is It So?', 'The Physics Show', 'Science Matters', 'Matter & Energy'],
    answer: 0,
    explanation: '"Why Is It So?" was the iconic phrase Miller used throughout his demonstrations and became the title of his Australian television series that aired from 1963.'
  },
  {
    q: 'Newton\'s First Law of Motion states that an object at rest stays at rest unless acted upon by:',
    opts: ['Gravity', 'An unbalanced force', 'Friction only', 'Its own weight'],
    answer: 1,
    explanation: 'Newton\'s First Law (Inertia) states that an object stays in its current state of motion unless an unbalanced external force acts on it.'
  },
  {
    q: 'A ball dropped from a height falls with what type of acceleration (ignoring air resistance)?',
    opts: ['Zero', 'Decreasing', 'Constant (≈9.8 m/s²)', 'Increasing then decreasing'],
    answer: 2,
    explanation: 'Near Earth\'s surface, gravity provides a nearly constant acceleration of 9.8 m/s² downward — one of Miller\'s favourite demonstrations.'
  },
  {
    q: 'What does a pendulum demonstrate most elegantly?',
    opts: ['The speed of light', 'Conservation of momentum', 'Periodic oscillation and conservation of energy', 'Bernoulli\'s principle'],
    answer: 2,
    explanation: 'A pendulum beautifully demonstrates periodic motion and the conversion between potential and kinetic energy — a JSM classroom favourite.'
  },
  {
    q: 'Bernoulli\'s principle explains why aeroplane wings generate lift. What does it state?',
    opts: [
      'Faster-moving fluid has higher pressure',
      'Faster-moving fluid has lower pressure',
      'Pressure is equal regardless of speed',
      'Lift equals weight always'
    ],
    answer: 1,
    explanation: 'Bernoulli\'s principle states that an increase in fluid speed occurs alongside a decrease in pressure — the basis of aerodynamic lift.'
  },
  {
    q: 'When Julius Sumner Miller placed a coin and feather in a vacuum tube and dropped them, what happened?',
    opts: [
      'The coin fell faster',
      'The feather fell faster',
      'They fell at the same rate',
      'Neither fell'
    ],
    answer: 2,
    explanation: 'Without air resistance, all objects fall at the same rate regardless of mass — Galileo\'s famous insight dramatically shown by Miller.'
  },
  {
    q: 'What is the unit of force in the International System (SI)?',
    opts: ['Watt', 'Joule', 'Newton', 'Pascal'],
    answer: 2,
    explanation: 'The Newton (N) is the SI unit of force, named after Sir Isaac Newton. 1 N = 1 kg·m/s².'
  },
  {
    q: 'Atmospheric pressure at sea level is approximately:',
    opts: ['101,325 Pa', '50,000 Pa', '200,000 Pa', '1,000 Pa'],
    answer: 0,
    explanation: 'Standard atmospheric pressure is 101,325 Pa (about 14.7 psi or 1 atm). Miller loved demonstrating its enormous force with vacuum experiments.'
  },
  {
    q: 'A gyroscope resists changes to its orientation due to which property?',
    opts: ['Gravity', 'Angular momentum', 'Friction', 'Surface tension'],
    answer: 1,
    explanation: 'A spinning gyroscope has angular momentum, which resists any torque that would change its axis of rotation — conservation of angular momentum in action.'
  },
  {
    q: 'Which country\'s national broadcaster (ABC) made Julius Sumner Miller famous with "Why Is It So?"?',
    opts: ['United Kingdom', 'United States', 'Australia', 'Canada'],
    answer: 2,
    explanation: 'The Australian Broadcasting Corporation (ABC) aired "Why Is It So?" starting in 1963, making Miller a household name in Australia.'
  },
  {
    q: 'Conservation of energy states that energy can be:',
    opts: [
      'Created from nothing',
      'Destroyed but not created',
      'Neither created nor destroyed, only transformed',
      'Doubled in elastic collisions'
    ],
    answer: 2,
    explanation: 'The Law of Conservation of Energy states that the total energy in a closed system remains constant — it is only transformed from one form to another.'
  },
  {
    q: 'Which principle explains why a ship made of steel can float on water?',
    opts: ['Pascal\'s Principle', 'Archimedes\' Principle', 'Newton\'s Third Law', 'Hooke\'s Law'],
    answer: 1,
    explanation: 'Archimedes\' Principle states that an object submerged in fluid is buoyed up by a force equal to the weight of fluid it displaces. If the displaced water weighs more than the ship, the ship floats.'
  }
];

let quizAnswers = [];
let quizDone = false;

function initQuiz() {
  const container   = document.getElementById('quiz-container');
  const scoreScreen = document.getElementById('score-screen');
  const submitBtn   = document.getElementById('quiz-submit');
  const retryBtn    = document.getElementById('quiz-retry');
  if (!container) return;

  try {
    quizDone = (localStorage.getItem(QUIZ_DONE_KEY) === 'true');
  } catch (_) {
    quizDone = false;
  }
  renderQuiz();

  submitBtn && submitBtn.addEventListener('click', submitQuiz);
  retryBtn  && retryBtn.addEventListener('click', retryQuiz);

  function renderQuiz() {
    container.innerHTML = '';
    quizAnswers = new Array(QUIZ_QUESTIONS.length).fill(-1);

    QUIZ_QUESTIONS.forEach((q, qi) => {
      const block = document.createElement('div');
      block.className = 'quiz-question-block';
      block.innerHTML = `
        <h3>Q${qi + 1}. ${q.q}</h3>
        <div class="quiz-options" id="opts-${qi}">
          ${q.opts.map((opt, oi) => `
            <label class="quiz-option" id="opt-${qi}-${oi}">
              <input type="radio" name="q${qi}" value="${oi}">
              <span>${opt}</span>
            </label>
          `).join('')}
        </div>
        <div class="quiz-feedback" id="fb-${qi}"></div>
      `;
      block.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', () => {
          quizAnswers[qi] = parseInt(radio.value, 10);
          updateProgress();
        });
      });
      container.appendChild(block);
    });
    updateProgress();
  }

  function updateProgress() {
    const answered = quizAnswers.filter(a => a !== -1).length;
    const fill = document.getElementById('quiz-progress');
    if (fill) fill.style.width = `${(answered / QUIZ_QUESTIONS.length) * 100}%`;
  }

  function submitQuiz() {
    if (quizAnswers.includes(-1)) {
      alert('Please answer all questions before submitting!');
      return;
    }
    let score = 0;
    QUIZ_QUESTIONS.forEach((q, qi) => {
      const chosen = quizAnswers[qi];
      const opts = document.querySelectorAll(`#opts-${qi} .quiz-option`);
      opts.forEach(opt => opt.classList.add('disabled'));
      opts[q.answer].classList.add('correct');
      if (chosen !== q.answer) opts[chosen].classList.add('incorrect');
      else score++;

      const fb = document.getElementById(`fb-${qi}`);
      if (fb) {
        fb.textContent = q.explanation;
        fb.className = `quiz-feedback show ${chosen === q.answer ? 'correct' : 'incorrect'}`;
      }
    });

    // Tokens: 5 per correct answer + 10 bonus for full completion
    const earned = score * 5 + 10;
    if (!quizDone) {
      addTokens(earned);
      try {
        localStorage.setItem(QUIZ_DONE_KEY, 'true');
      } catch (_) {
        // Ignore storage write failures
      }
      quizDone = true;
    }

    // Show score screen
    if (submitBtn) submitBtn.classList.add('hidden');
    if (scoreScreen) {
      scoreScreen.classList.add('show');
      document.getElementById('score-num').textContent = score;
      document.getElementById('score-total').textContent = QUIZ_QUESTIONS.length;
      document.getElementById('tokens-earned').textContent = quizDone ? 0 : earned;
      document.getElementById('score-msg').textContent = getScoreMessage(score);
    }
    showToast(`🎉 Quiz complete! Score: ${score}/${QUIZ_QUESTIONS.length}`);
  }

  function retryQuiz() {
    try {
      localStorage.removeItem(QUIZ_DONE_KEY);
    } catch (_) {
      // Ignore storage write failures
    }
    quizDone = false;
    if (scoreScreen) scoreScreen.classList.remove('show');
    if (submitBtn) submitBtn.classList.remove('hidden');
    renderQuiz();
  }

  function getScoreMessage(score) {
    const pct = score / QUIZ_QUESTIONS.length;
    if (pct === 1)   return '🏆 Perfect score! You think like Miller himself!';
    if (pct >= 0.8)  return '⭐ Excellent! Miller would be proud!';
    if (pct >= 0.6)  return '👍 Good effort! Keep exploring physics!';
    if (pct >= 0.4)  return '📚 Not bad — review the experiments and try again!';
    return '🔬 Keep watching the videos and give it another go!';
  }
}

// ── Toast Notifications ────────────────────────────────────
function showToast(msg, duration = 3000) {
  let toast = document.getElementById('toast-container');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-container';
    toast.style.cssText = `
      position:fixed; bottom:1.5rem; right:1.5rem; z-index:3000;
      display:flex; flex-direction:column; gap:.5rem;
    `;
    document.body.appendChild(toast);
  }
  const item = document.createElement('div');
  item.style.cssText = `
    background:#1e2a3a; border:1px solid #e8a020; border-radius:8px;
    padding:.65rem 1rem; font-size:.88rem; color:#e6edf3;
    box-shadow:0 4px 16px rgba(0,0,0,.5); animation:fadeIn .25s ease;
    max-width:300px;
  `;
  item.textContent = msg;
  toast.appendChild(item);
  setTimeout(() => item.remove(), duration);
}

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initHamburger();
  updateAllTokenDisplays();
  initPlaylist();
  initGallery();
  initQuiz();
});
