kangaroo.tsx
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import KANGAROO_BASE64 from '../assets/pics/kangaroo.png';

// ==========================================
// TYPES
// ==========================================
interface KangarooGameProps {
  gameName: string;
  currentHighScore: number;
  onClose: () => void;
  onUpdateHighScore: (score: number) => void;
}

interface Question {
  text: string;
  blue: string;
  red: string;
  correct: 'Blue' | 'Red';
}

type PlatformType = 'start' | 'end' | 'green' | 'Blue' | 'Red';

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  q_index: number;
  label: string;
  visible: boolean;
}

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  life: number;
  decay: number;
}

interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  dx: number;
  dy: number;
  grounded: boolean;
  facingRight: boolean;
  sinking: boolean;
  canMove: boolean;
}

// CONSTANTS
const WIDTH = 800;
const HEIGHT = 600;
const GRAVITY = 0.8;
const JUMP_STRENGTH = -16;
const SPEED = 8;
const GAP_TO_ANSWER = 250;
const GAP_TO_NEXT = 320;
const PLATFORM_WIDTH = 200;

const DEFAULT_QUESTIONS: Question[] = [
  { text: "מהו צבע השמש?", blue: "צהוב", red: "סגול", correct: "Blue" },
  { text: "חצי מ-30?", blue: "15", red: "20", correct: "Blue" },
  { text: "מה צפוני יותר?", blue: "צפת", red: "אילת", correct: "Blue" },
  { text: "5:3?", blue: "1.333", red: "1.666", correct: "Red" },
  { text: "מה יותר כבד?", blue: "קילו נוצות", red: "חצי קילו נפט", correct: "Blue" },
  { text: "איפה נמצאת ירושלים?", blue: "במערב", red: "במזרח", correct: "Red" },
  { text: "90*3?", blue: "270", red: "300", correct: "Blue" },
  { text: "מי המציא את הנורה?", blue: "גלילאו", red: "אדיסון", correct: "Red" },
  { text: 'השלם: "שלום ___"', blue: "חייזר", red: "חבר", correct: "Red" },
  { text: "מה יותר שמן?", blue: "חזיר", red: "פיל", correct: "Red" },
];

const KangarooGame: React.FC<KangarooGameProps> = ({
  currentHighScore,
  onClose,
  onUpdateHighScore,
}) => {
  // DOM Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const isMountedRef = useRef(true); // SAFETY: Prevents memory leaks on unmount

  // Audio Context Ref (Lazy initialized)
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Game Logic Refs (Mutable state that doesn't trigger re-renders)
  const gameStateRef = useRef<'start' | 'playing' | 'gameover' | 'win'>('start');
  const playerRef = useRef<Player>({
    x: 50, y: 470, w: 60, h: 60,
    dx: 0, dy: 0,
    grounded: false, facingRight: true,
    sinking: false, canMove: true
  });

  const cameraXRef = useRef(0);
  const platformsRef = useRef<Platform[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({ left: false, right: false, up: false });
  const scoreRef = useRef(0);
  const answeredRef = useRef<Set<number>>(new Set());
  
  // Image Ref
  const kangarooImgRef = useRef<HTMLImageElement | null>(null);
  const isImgLoadedRef = useRef(false);

  // React State for UI (Only for visual overlay, NOT game loop)
  const [uiState, setUiState] = useState<'start' | 'playing' | 'gameover' | 'win'>('start');
  const [uiScore, setUiScore] = useState(0);
  const [currentQuestionText, setCurrentQuestionText] = useState("לחץ על המשחק והתחל ללכת (חצים ורווח)!");

  // ==========================================
  // INITIALIZATION
  // ==========================================

  useEffect(() => {
    isMountedRef.current = true;

    // 1. Load Image securely
    const img = new Image();
    img.src = KANGAROO_BASE64;
    img.onload = () => {
      if(isMountedRef.current) {
        kangarooImgRef.current = img;
        isImgLoadedRef.current = true; // Flag that image is ready
      }
    };
    img.onerror = () => {
      console.error("Image failed to load");
      isImgLoadedRef.current = false;
    };

    // 2. Focus container
    if (containerRef.current) {
      containerRef.current.focus();
    }

    // 3. Start Game Loop
    initLevel();
    requestRef.current = requestAnimationFrame(tick);

    // 4. CLEANUP (Crucial for preventing crashes)
    return () => {
      isMountedRef.current = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        audioCtxRef.current = new AudioContext();
      }
    }
    // Resume if suspended (browser policy)
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
  };

  const playSound = (type: 'jump' | 'splash' | 'wrong' | 'win' | 'point') => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'jump') {
      osc.frequency.setValueAtTime(400, now);
      gain.gain.setValueAtTime(0.1, now);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'splash') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'wrong') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(100, now);
      gain.gain.setValueAtTime(0.1, now);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'point') {
      osc.frequency.setValueAtTime(1000, now);
      gain.gain.setValueAtTime(0.1, now);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'win') {
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  };

  const initLevel = () => {
    const plats: Platform[] = [];
    let cx = 0;

    // Start Platform
    plats.push({ x: cx, y: 530, width: 300, height: 30, type: 'start', q_index: -1, label: '', visible: true });
    cx += 380;

    // Questions
    DEFAULT_QUESTIONS.forEach((q, i) => {
      // Green
      plats.push({ x: cx, y: 450, width: 140, height: 30, type: 'green', q_index: i, label: '', visible: true });
      cx += GAP_TO_ANSWER;

      // Answers
      plats.push({ x: cx, y: 300, width: PLATFORM_WIDTH, height: 30, type: 'Blue', q_index: i, label: q.blue, visible: true });
      plats.push({ x: cx, y: 500, width: PLATFORM_WIDTH, height: 30, type: 'Red', q_index: i, label: q.red, visible: true });
      cx += GAP_TO_NEXT;
    });

    // End Platform
    plats.push({ x: cx, y: 500, width: 800, height: 30, type: 'end', q_index: 99, label: '', visible: true });

    platformsRef.current = plats;

    // Reset Player
    playerRef.current = {
      x: 50, y: 470, w: 60, h: 60,
      dx: 0, dy: 0,
      grounded: false, facingRight: true,
      sinking: false, canMove: true
    };

    cameraXRef.current = 0;
    scoreRef.current = 0;
    answeredRef.current = new Set();
    particlesRef.current = [];

    // Reset UI safely
    setUiScore(0);
    gameStateRef.current = 'playing';
    setUiState('playing');
    setCurrentQuestionText("התחל ללכת וקפוץ לפלטפורמה הירוקה הראשונה!");
  };

  // ==========================================
  // GAME LOOP
  // ==========================================

  const createSplash = (x: number, y: number) => {
    for (let i = 0; i < 25; i++) {
      particlesRef.current.push({
        x, y,
        dx: (Math.random() - 0.5) * 8,
        dy: Math.random() * -10 - 5,
        radius: Math.random() * 4 + 2,
        life: 1.0,
        decay: Math.random() * 0.02 + 0.01
      });
    }
  };

  const updatePhysics = () => {
    const p = playerRef.current;
    if (p.sinking) return;

    // Movement
    if (p.canMove) {
      if (keysRef.current.right) {
        p.dx = SPEED;
        p.facingRight = true;
      } else if (keysRef.current.left) {
        p.dx = -SPEED;
        p.facingRight = false;
      } else {
        p.dx = 0;
      }
    } else {
      p.dx = 0;
    }

    // Jump
    if (p.canMove && keysRef.current.up && p.grounded) {
      p.dy = JUMP_STRENGTH;
      p.grounded = false;
      playSound('jump');
    }

    // Apply Physics
    p.dy += GRAVITY;
    p.x += p.dx;
    p.y += p.dy;

    // Move Camera
    if (p.x > 250) {
      cameraXRef.current = p.x - 250;
    }

    // Water Collision
    if (p.y > 580 && !p.sinking) {
      p.sinking = true;
      playSound('splash');
      createSplash(p.x + p.w / 2, 590);
      
      // Delay Game Over to let splash animation play
      setTimeout(() => {
        if (isMountedRef.current) {
          handleGameOver("צנחת לאגם! נסה שנית!");
        }
      }, 1000);
    }
  };

  const checkCollisions = () => {
    const p = playerRef.current;
    if (p.sinking) return;

    p.grounded = false;

    platformsRef.current.forEach(plat => {
      if (!plat.visible) return;

      // Simple AABB Collision
      if (
        p.x < plat.x + plat.width &&
        p.x + p.w > plat.x &&
        p.y + p.h >= plat.y &&
        p.y + p.h <= plat.y + plat.height + 25 &&
        p.dy >= 0
      ) {
        // Logic for landing on platform
        const isTrap = () => {
          if (['start', 'end', 'green'].includes(plat.type)) return false;
          const q = DEFAULT_QUESTIONS[plat.q_index];
          if (!q) return false;
          return plat.type !== q.correct;
        };

        if (isTrap()) {
          plat.visible = false; // Break the platform
          // Also hide the partner platform so they can't jump back
          platformsRef.current.forEach(other => {
            if (other.q_index === plat.q_index) other.visible = false;
          });

          p.canMove = false;
          playSound('wrong');
          p.grounded = false;
        } else {
          // Land Safely
          p.grounded = true;
          p.dy = 0;
          p.y = plat.y - p.h;
          handleSafeLanding(plat);
        }
      }
    });
  };

  const handleSafeLanding = (plat: Platform) => {
    if (plat.type === 'end') {
      if (gameStateRef.current !== 'win') handleWin();
      return;
    }

    // Update Text Question (Throttled)
    if (plat.type === 'green') {
      const q = DEFAULT_QUESTIONS[plat.q_index];
      if (q && q.text !== currentQuestionText) {
          setCurrentQuestionText(q.text);
      }
      return;
    }

    // Score Logic
    if (['Blue', 'Red'].includes(plat.type)) {
      if (!answeredRef.current.has(plat.q_index)) {
        scoreRef.current += 1;
        
        // Throttled UI Update
        if (scoreRef.current !== uiScore) {
             setUiScore(scoreRef.current);
        }
        
        answeredRef.current.add(plat.q_index);
        playSound('point');
      }

      // Hide the other answer option
      platformsRef.current.forEach(other => {
        if (other.q_index === plat.q_index && other !== plat && (other.type === 'Red' || other.type === 'Blue')) {
          other.visible = false;
        }
      });
    }
  };

  const updateParticles = () => {
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.dx;
      p.dy += 0.4;
      p.y += p.dy;
      p.life -= p.decay;

      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
      }
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    // Clear
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Background
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const cx = cameraXRef.current;

    // Platforms
    platformsRef.current.forEach(p => {
      if (!p.visible) return;
      const sx = p.x - cx;
      if (sx + p.width < 0 || sx > WIDTH) return; // Optimization: Don't draw off-screen

      let color = "#2ecc71";
      if (p.type === 'Red') color = "#e74c3c";
      else if (p.type === 'Blue') color = "#3498db";
      else if (p.type === 'start') color = "#27ae60";
      else if (p.type === 'end') color = "#ffd700";

      ctx.fillStyle = color;
      ctx.fillRect(sx, p.y, p.width, p.height);

      if (p.label) {
        ctx.fillStyle = "white";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(p.label, sx + p.width / 2, p.y + 20);
      }

      if (p.type === 'end') {
        ctx.fillStyle = "#DAA520";
        ctx.fillRect(sx, p.y + p.height, p.width, HEIGHT - (p.y + p.height));
      }
    });

    // Water
    ctx.fillStyle = "#0000CD";
    ctx.fillRect(0, 580, WIDTH, 20);

    // Player
    const p = playerRef.current;
    if (!p.sinking) {
      const px = p.x - cx;

      // DRAW LOGIC: Image or Fallback
      if (isImgLoadedRef.current && kangarooImgRef.current) {
        ctx.save();
        if (!p.facingRight) {
          ctx.translate(px + p.w, p.y);
          ctx.scale(-1, 1);
          ctx.drawImage(kangarooImgRef.current, 0, 0, p.w, p.h);
        } else {
          ctx.drawImage(kangarooImgRef.current, px, p.y, p.w, p.h);
        }
        ctx.restore();
      } else {
        // FALLBACK: If image isn't loaded yet, draw an orange square
        // This ensures the player is ALWAYS visible
        ctx.fillStyle = "#ff6b00"; // Bright Orange
        ctx.fillRect(px, p.y, p.w, p.h);
        
        // Draw Eyes (so it looks like a face)
        ctx.fillStyle = "white";
        ctx.fillRect(px + (p.facingRight ? 40 : 10), p.y + 10, 10, 10);
        ctx.fillStyle = "black";
        ctx.fillRect(px + (p.facingRight ? 42 : 12), p.y + 12, 5, 5);
      }
    }

    // Particles
    particlesRef.current.forEach(part => {
      const sx = part.x - cx;
      ctx.fillStyle = "#4FC3F7";
      ctx.beginPath();
      ctx.arc(sx, part.y, part.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const tick = () => {
    // SAFETY: Stop loop if component unmounted
    if (!isMountedRef.current) return;

    if (gameStateRef.current === 'playing') {
      updatePhysics();
      checkCollisions();
      updateParticles();
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) draw(ctx);
    }

    requestRef.current = requestAnimationFrame(tick);
  };

  // ==========================================
  // INPUT HANDLING
  // ==========================================

  const handleKeyDown = (e: React.KeyboardEvent) => {
    initAudio(); // Initialize audio on first user interaction

    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(e.key)) {
      e.preventDefault();
    }

    if (['ArrowLeft', 'Left'].includes(e.key)) keysRef.current.left = true;
    if (['ArrowRight', 'Right'].includes(e.key)) keysRef.current.right = true;
    if (['ArrowUp', 'Up', ' '].includes(e.key)) keysRef.current.up = true;
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (['ArrowLeft', 'Left'].includes(e.key)) keysRef.current.left = false;
    if (['ArrowRight', 'Right'].includes(e.key)) keysRef.current.right = false;
    if (['ArrowUp', 'Up', ' '].includes(e.key)) keysRef.current.up = false;
  };

  // ==========================================
  // STATE TRANSITIONS
  // ==========================================

  const handleGameOver = (msg: string) => {
    if (!isMountedRef.current) return;
    gameStateRef.current = 'gameover';
    setUiState('gameover');
    setCurrentQuestionText(msg);
    onUpdateHighScore(scoreRef.current);
  };

  const handleWin = () => {
    if (!isMountedRef.current) return;
    gameStateRef.current = 'win';
    setUiState('win');
    playSound('win');
    setCurrentQuestionText("! הגעת לאוסטרליה!");
    onUpdateHighScore(scoreRef.current);
  };

  const handleRestart = () => {
    initLevel();
    if (containerRef.current) containerRef.current.focus();
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div
      ref={containerRef}
      className="container"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', outline: 'none' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >

      <div style={{ display: 'flex', width: '100%', maxWidth: '1060px', gap: '10px' }}>

        {/* CANVAS */}
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          style={{ border: '4px solid #333', borderRadius: '8px', background: '#87CEEB', cursor: 'pointer' }}
          onClick={() => {
              containerRef.current?.focus();
              initAudio();
          }}
        />

        {/* SIDEBOARD */}
        <div style={{
          width: '250px',
          background: '#333',
          color: 'white',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '8px',
          border: '4px solid #555'
        }}>
          <h2 style={{ color: '#ffd700', textAlign: 'center' }}>קנגורו</h2>
          <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>מאת גולן גלנט</p>

          <div style={{ margin: '20px 0', textAlign: 'center' }}>
            <h3 style={{ color: '#00FF00' }}>שיא: {Math.max(currentHighScore, uiScore)}</h3>
            <h3>ניקוד: {uiScore}</h3>
          </div>

          <div style={{
            background: '#444',
            padding: '15px',
            borderRadius: '4px',
            minHeight: '100px',
            border: '2px solid #222',
            textAlign: 'right',
            direction: 'rtl'
          }}>
            {currentQuestionText}
          </div>

          <div style={{ marginTop: 'auto', textAlign: 'right', direction: 'rtl' }}>
            <p>קפצו על אדום או כחול!</p>
            <hr style={{ borderColor: '#555' }} />
            <p>מקשים:<br />חצים לתזוזה<br />רווח לקפיצה</p>
          </div>

          <button onClick={onClose} style={{ marginTop: '20px', padding: '10px', background: '#c0392b', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
            יציאה
          </button>
        </div>
      </div>

      {/* MODALS */}
      {uiState === 'gameover' && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2>איזה כשלון! צנחת לאגם! רק לפעם הבאה אל תשכח את השנורקל חביבי!</h2>
            <p>ניקוד סופי: {uiScore}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={handleRestart} style={btnStyle}>נסה שוב</button>
              <button onClick={onClose} style={{ ...btnStyle, background: '#e74c3c' }}>יציאה</button>
            </div>
          </div>
        </div>
      )}

      {uiState === 'win' && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2>בשעה טובה נחתת באוסטרליה!</h2>
            <p>עכשיו אפשר להשתזף בנחת!</p>
            <p>ניקוד סופי: {uiScore}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={handleRestart} style={btnStyle}>שחק שוב</button>
              <button onClick={onClose} style={{ ...btnStyle, background: '#e74c3c' }}>יציאה</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 1000
};

const modalContentStyle: React.CSSProperties = {
  background: 'white', padding: '30px', borderRadius: '12px',
  textAlign: 'center', minWidth: '300px', direction: 'rtl', color: 'black'
};

const btnStyle: React.CSSProperties = {
  padding: '10px 20px', fontSize: '1rem',
  background: '#2ecc71', color: 'white',
  border: 'none', borderRadius: '6px', cursor: 'pointer'
};

export default KangarooGame;


questions.csv

Number,Questions,Blue,Red,Correct
1,מהו צבע השמש?,צהוב,סגול,Blue
2,חצי מ-30?,15,20,Blue
3,מה צפוני יותר?,צפת,אילת,Blue
4,5:3?,1.333,1.6666,Red
5,מה יותר כבד?,קילו נוצות,חצי קילו נפט,Blue
6,איפה נמצאת ירושלים?,במערב,במזרח,Red
7,90*3?,270,300,Blue
8,מי המציא את הנורה?,גלילאו,אדיסון,Red
9,"השלם: ""שלום ___""",חייזר,חבר,Red
10,מה יותר שמן?,חזיר,פיל,Red
11,"לפי ברי סחרוף: ""כולנו ____""",פועלים,עבדים,Red
12,מה רשום על הסביבון?,נ.ג.ה.פ,נ.י.ל.י,Blue
13,מה יותר חזק?,מר עולם,מיס יוניברס,Blue
14,4^4?,256,444,Blue
15,איך קוראים ללהקה של קובי אוז?,מסקינטייפ,טיפקס,Red
16,שם נרדף ליפן?,ארץ השמש העולה,אדמת הירח המיסטי,Blue
17,המתעמלת עושה סלטה עם...,בורג,פלומבה,Blue
18,"אש, רוח, אדמה ומה עוד?",מים,קרח,Blue
19,מה עומד להכחד?,ציפור מיינה,דוב פנדה,Red
20,באיזה קוטב הפינגווין???🐧,הדרומי,הצפוני,Blue


In this Kangaroo.tsx program of React frontend I want two things: Implement the new question.csv in the question array to update to these 20 questions. Also I want that in each game the order of the 20 questions will be randomized, to diversify the playing. Thanks! 