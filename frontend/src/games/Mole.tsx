/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from 'react';

const SCREEN_WIDTH = 600;
const SCREEN_HEIGHT = 750;
const CELL_SIZE = 200;

const COLOR_BG = "#7ec850"; 
const COLOR_UI_BAR = "#fff5dc"; 
const COLOR_HOLE = "#3c281e"; 
const COLOR_TEXT = "#503214"; 
const COLOR_HEART = "#ff5050"; 
const COLOR_BUTTON = "#46a03c"; 
const COLOR_MOLE_HIT = "#ff6464"; 

const MOLE_COLORS = [
  "#d2b48c", "#969696", "#ffb4c8", "#64c8ff",
  "#b482ff", "#ffe664", "#ffa050", "#8cd264"
];

let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
    }
  }
  return audioCtx;
};

const resumeAudioContext = () => {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
};

const playSound = (type: 'pop' | 'thud' | 'miss') => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  if (type === 'pop') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.1);
    gain.gain.setValueAtTime(0.5, now); 
    gain.gain.linearRampToValueAtTime(0, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'thud') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.15);
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  } else if (type === 'miss') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  }
};


class Mole {
  number: number;
  rect: { x: number; y: number; w: number; h: number };
  hole_y: number;
  base_y: number;
  draw_y: number;
  target_y: number;
  state: 'hidden' | 'rising' | 'up' | 'hit' | 'sinking';
  timer: number;
  visible_time: number;
  speed: number;

  constructor(number: number, x: number, y: number) {
    this.number = number;
    this.rect = { x: x + 50, y: y + 50, w: 100, h: 100 };
    this.hole_y = y + 100;
    this.base_y = y + 180;
    this.draw_y = this.base_y;
    this.target_y = y + 20;
    this.state = 'hidden';
    this.timer = 0;
    this.visible_time = 0;
    this.speed = 5;
  }

  popup(duration_ms: number) {
    if (this.state === 'hidden') {
      this.state = 'rising';
      this.visible_time = duration_ms;
      this.timer = Date.now();
      playSound('pop');
    }
  }

  whack() {
    if (this.state === 'rising' || this.state === 'up') {
      this.state = 'hit';
      this.timer = Date.now();
      playSound('thud');
      return true;
    }
    return false;
  }

  update() {
    const current_time = Date.now();
    let missed = false;

    if (this.state === 'rising') {
      if (this.draw_y > this.target_y) {
        this.draw_y -= this.speed;
      } else {
        this.state = 'up';
      }
    } else if (this.state === 'up') {
      if (current_time - this.timer > this.visible_time) {
        this.state = 'sinking';
        missed = true;
      }
    } else if (this.state === 'hit') {
      if (current_time - this.timer > 400) {
        this.state = 'sinking';
      }
    } else if (this.state === 'sinking') {
      if (this.draw_y < this.base_y) {
        this.draw_y += this.speed;
      } else {
        this.state = 'hidden';
      }
    }
    return missed;
  }

  draw(ctx: CanvasRenderingContext2D, selectedColorIndex: number) {
    ctx.fillStyle = COLOR_HOLE;
    ctx.beginPath();
    ctx.ellipse(this.rect.x + 50, this.hole_y + 5, 60, 25, 0, 0, 2 * Math.PI);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, SCREEN_WIDTH, this.hole_y + 5);
    ctx.clip();

    if (this.state !== 'hidden') {
      let color = MOLE_COLORS[selectedColorIndex];
      if (this.state === 'hit') color = COLOR_MOLE_HIT;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(this.rect.x + 50, this.draw_y + 60, 50, 60, 0, 0, 2 * Math.PI);
      ctx.fill();

      const eye_y = this.draw_y + 40;
      const nose_y = this.draw_y + 55;  
      const mouth_y = this.draw_y + 65; 

      if (this.state !== 'hit') {
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(this.rect.x + 30, eye_y, 10, 0, Math.PI * 2);
        ctx.arc(this.rect.x + 70, eye_y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(this.rect.x + 28, eye_y - 3, 3, 0, Math.PI * 2);
        ctx.arc(this.rect.x + 68, eye_y - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.rect.x + 50, mouth_y, 10, 0, Math.PI, false); 
        ctx.stroke();
      } else {
        ctx.strokeStyle = "#320000";
        ctx.lineWidth = 3;
        
        const drawX = (cx: number, cy: number) => {
          ctx.beginPath();
          ctx.moveTo(cx - 8, cy - 8);
          ctx.lineTo(cx + 8, cy + 8);
          ctx.moveTo(cx + 8, cy - 8);
          ctx.lineTo(cx - 8, cy + 8);
          ctx.stroke();
        };
        drawX(this.rect.x + 30, eye_y);
        drawX(this.rect.x + 70, eye_y);

        ctx.fillStyle = "#320000";
        ctx.beginPath();
        ctx.arc(this.rect.x + 50, mouth_y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#ff8282";
      ctx.beginPath();
      ctx.arc(this.rect.x + 50, nose_y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); 

    ctx.strokeStyle = "#64b43c"; 
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(this.rect.x + 50, this.hole_y + 5, 60, 25, 0, 0, Math.PI * 2); 
    ctx.stroke(); 

    ctx.fillStyle = "#4646b4"; 
    const boxX = this.rect.x + 35;
    const boxY = this.hole_y + 35;
    
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, 30, 30, 8);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = "bold 20px 'Comic Sans MS', sans-serif";
    ctx.fillText(this.number.toString(), boxX + 9, boxY + 22);
  }
}

interface MoleGameProps {
  gameName: string;
  currentHighScore: number;
  onClose: () => void;
  onUpdateHighScore: (score: number) => void;
}

const MoleGame: React.FC<MoleGameProps> = ({ currentHighScore, onClose, onUpdateHighScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const gameState = useRef<"MENU" | "PLAYING" | "GAMEOVER">("MENU");
  const score = useRef(0);
  const lives = useRef(3);
  const highScore = useRef(currentHighScore);
  const moles = useRef<Mole[]>([]);
  const selectedColorIndex = useRef(0);
  const nextPopup = useRef(0);
  const interval = useRef(2500);
  const duration = useRef(2500);
  
  const btnStartRect = { x: (SCREEN_WIDTH - 200) / 2, y: 300, w: 200, h: 70 };
  
  useEffect(() => {
    const layout = [[7, 8, 9], [4, 5, 6], [1, 2, 3]];
    const newMoles: Mole[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        newMoles.push(new Mole(layout[r][c], c * CELL_SIZE, r * CELL_SIZE + 120));
      }
    }
    newMoles.sort((a, b) => a.number - b.number);
    moles.current = newMoles;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resumeAudioContext();

      if (gameState.current !== "PLAYING") return;

      const keyMap: { [key: string]: number } = {
        'Digit1': 1, 'Digit2': 2, 'Digit3': 3,
        'Digit4': 4, 'Digit5': 5, 'Digit6': 6,
        'Digit7': 7, 'Digit8': 8, 'Digit9': 9,
        'Numpad1': 1, 'Numpad2': 2, 'Numpad3': 3,
        'Numpad4': 4, 'Numpad5': 5, 'Numpad6': 6,
        'Numpad7': 7, 'Numpad8': 8, 'Numpad9': 9
      };

      const num = keyMap[e.code];
      
      if (num) {
        const moleIndex = num - 1;
        const mole = moles.current[moleIndex];
        const hitSuccessful = mole.whack();

        if (hitSuccessful) {
          score.current += 10;
          if (score.current > highScore.current) {
            highScore.current = score.current;
            onUpdateHighScore(score.current);
          }
          interval.current = Math.max(900, interval.current - 20);
          duration.current = Math.max(1000, duration.current - 20);
        } else {
          lives.current -= 1;
          playSound('miss');
          if (lives.current <= 0) gameState.current = "GAMEOVER";
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUpdateHighScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let animationFrameId: number;

    const render = () => {
      const now = Date.now();

      if (gameState.current === "PLAYING") {
        if (now > nextPopup.current) {
          let spawnCount = 1;
          if (score.current >= 200 && score.current < 400) spawnCount = 2;
          else if (score.current >= 400) spawnCount = 3;

          const available = moles.current.filter(m => m.state === 'hidden');
          for (let i = available.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [available[i], available[j]] = [available[j], available[i]];
          }

          for (let i = 0; i < Math.min(available.length, spawnCount); i++) {
            available[i].popup(duration.current);
          }
          nextPopup.current = now + interval.current;
        }

        moles.current.forEach(m => {
          const missed = m.update();
          if (missed) {
            lives.current -= 1;
            playSound('miss');
            if (lives.current <= 0) gameState.current = "GAMEOVER";
          }
        });
      }

      
      ctx.fillStyle = COLOR_BG;
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

      ctx.fillStyle = COLOR_UI_BAR;
      ctx.fillRect(0, 0, SCREEN_WIDTH, 90);
      ctx.strokeStyle = "#c8bece"; 
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 90);
      ctx.lineTo(SCREEN_WIDTH, 90);
      ctx.stroke();

      ctx.fillStyle = "#968c64";
      ctx.font = "bold 20px 'Comic Sans MS', sans-serif";
      ctx.fillText("SCORE", 25, 30);
      ctx.fillStyle = COLOR_TEXT;
      ctx.font = "bold 40px 'Comic Sans MS', sans-serif";
      ctx.fillText(score.current.toString(), 25, 75);

      ctx.fillStyle = "#968c64";
      ctx.font = "bold 20px 'Comic Sans MS', sans-serif";
      ctx.fillText("LIVES", SCREEN_WIDTH - 100, 30);
      
      for (let i = 0; i < 3; i++) {
        const heartColor = i < lives.current ? COLOR_HEART : "#dcdcdc";
        const hx = SCREEN_WIDTH - 80 + (i * 30);
        const hy = 65;
        
        ctx.fillStyle = heartColor;
        ctx.beginPath();
        ctx.arc(hx - 5, hy - 5, 8, 0, Math.PI * 2);
        ctx.arc(hx + 5, hy - 5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(hx - 13, hy - 2);
        ctx.lineTo(hx + 13, hy - 2);
        ctx.lineTo(hx, hy + 12);
        ctx.fill();
      }

      moles.current.forEach(m => m.draw(ctx, selectedColorIndex.current));

      if (gameState.current === "MENU") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        ctx.fillStyle = "white";
        ctx.font = "bold 60px 'Comic Sans MS', sans-serif";
        const titleText = "WHACK-A-MOLE";
        const titleWidth = ctx.measureText(titleText).width;
        ctx.fillText(titleText, (SCREEN_WIDTH - titleWidth) / 2, 180);

        drawButton(ctx, btnStartRect, "PLAY");

        ctx.font = "bold 28px 'Comic Sans MS', sans-serif";
        ctx.fillStyle = "#e6ffe6";
        const pkText = "Pick your mole color:";
        const pkWidth = ctx.measureText(pkText).width;
        ctx.fillText(pkText, (SCREEN_WIDTH - pkWidth) / 2, 410);

        for (let i = 0; i < 8; i++) {
            const cx = (SCREEN_WIDTH - 320) / 2 + i * 40 + 15;
            const cy = 435 + 15;
            
            if (i === selectedColorIndex.current) {
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(cx, cy, 20, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = MOLE_COLORS[i];
            ctx.beginPath();
            ctx.arc(cx, cy, 15, 0, Math.PI * 2);
            ctx.fill();
        }

      } else if (gameState.current === "GAMEOVER") {
        ctx.fillStyle = "rgba(100, 0, 0, 0.8)";
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        ctx.fillStyle = "#ff9696";
        ctx.font = "bold 60px 'Comic Sans MS', sans-serif";
        const goText = "GAME OVER";
        const goWidth = ctx.measureText(goText).width;
        ctx.fillText(goText, (SCREEN_WIDTH - goWidth) / 2, 250);

        ctx.fillStyle = "white";
        ctx.font = "bold 28px 'Comic Sans MS', sans-serif";
        const scText = `Final Score: ${score.current}`;
        const scWidth = ctx.measureText(scText).width;
        ctx.fillText(scText, (SCREEN_WIDTH - scWidth) / 2, 320);

        drawButton(ctx, btnStartRect, "MENU");
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const drawButton = (ctx: CanvasRenderingContext2D, rect: {x:number, y:number, w:number, h:number}, text: string) => {
    ctx.fillStyle = "#326428"; 
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y + 5, rect.w, rect.h, 15);
    ctx.fill();
    
    ctx.fillStyle = COLOR_BUTTON; 
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 15);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = "bold 40px 'Comic Sans MS', sans-serif";
    const txtWidth = ctx.measureText(text).width;
    ctx.fillText(text, rect.x + (rect.w - txtWidth) / 2, rect.y + 48);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    resumeAudioContext();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const isBtnClicked = x >= btnStartRect.x && x <= btnStartRect.x + btnStartRect.w &&
                         y >= btnStartRect.y && y <= btnStartRect.y + btnStartRect.h;

    if (gameState.current === "MENU") {
        if (isBtnClicked) {
            score.current = 0;
            lives.current = 3;
            interval.current = 2500;
            duration.current = 2500;
            moles.current.forEach(m => m.state = 'hidden');
            gameState.current = "PLAYING";
        }
        for (let i = 0; i < 8; i++) {
             const cx = (SCREEN_WIDTH - 320) / 2 + i * 40 + 15;
             const cy = 435 + 15;
             const dist = Math.sqrt((x - cx)**2 + (y - cy)**2);
             if (dist < 20) {
                 selectedColorIndex.current = i;
             }
        }
    } else if (gameState.current === "GAMEOVER") {
        if (isBtnClicked) {
            gameState.current = "MENU";
        }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#333', minHeight: '100vh', padding: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '5px', border: 'none', backgroundColor: '#cc4444', color: 'white', cursor: 'pointer' }}>
                Exit Game
            </button>
        </div>
        <canvas 
            ref={canvasRef} 
            width={SCREEN_WIDTH} 
            height={SCREEN_HEIGHT}
            onClick={handleCanvasClick}
            style={{ 
                borderRadius: '10px', 
                boxShadow: '0 0 20px rgba(0,0,0,0.5)', 
                cursor: gameState.current === "PLAYING" ? 'crosshair' : 'default',
                maxWidth: '100%',
                height: 'auto'
            }}
        />
    </div>
  );
};

export default MoleGame;