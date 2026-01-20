/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from "react";

// --- Types ---
interface BalloonGameProps {
  gameName: string;
  currentHighScore: number;
  onClose: () => void;
  onUpdateHighScore: (score: number) => void;
}

interface Point {
  x: number;
  y: number;
}

// --- Configuration ---
const WIDTH = 900;
const HEIGHT = 700;

// --- Colors ---
const WHITE = "rgb(255, 255, 255)";
const RED = "rgb(255, 80, 80)";
const GOLD = "rgb(255, 215, 0)";
const BLUE = "rgb(80, 180, 255)";
const GREEN = "rgb(80, 255, 80)";
const UI_BG = "rgb(50, 50, 70)";
const DARK_BG_START = { r: 20, g: 20, b: 40 };

const BALLOON_COLORS = [
  "rgb(255, 100, 100)",
  "rgb(100, 255, 100)",
  "rgb(100, 100, 255)",
  "rgb(255, 255, 100)",
  "rgb(255, 100, 255)",
  "rgb(100, 255, 255)",
];

// --- Audio Generator ---
// We lazily initialize audio context to handle browser autoplay policies
const audioCtxRef = { current: null as AudioContext | null };

const playPopSound = () => {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
  }
  const ctx = audioCtxRef.current;
  if (ctx.state === "suspended") ctx.resume();

  const duration = 0.1;
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    // Linear decay envelope
    const envelope = 1.0 - i / bufferSize;
    // Random noise * envelope * volume
    const noise = Math.random() * 2 - 1;
    data[i] = noise * envelope * 0.5;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
};

// --- Game Classes (Converted to TS Classes) ---

class Particle {
  x: number;
  y: number;
  color: string;
  radius: number;
  life: number;
  vx: number;
  vy: number;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.floor(Math.random() * 5) + 3; // 3-7
    this.life = Math.floor(Math.random() * 21) + 20; // 20-40
    this.vx = Math.random() * 6 - 3; // -3 to 3
    this.vy = Math.random() * 6 - 3;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 1;
    this.radius -= 0.1;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.life > 0 && this.radius > 0) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }
}

class Balloon {
  startX: number;
  x: number;
  y: number;
  radius: number;
  number: number;
  baseSpeed: number;
  color: string;
  wobbleSpeed: number;
  wobbleAmp: number;
  frameOffset: number;
  startTime: number;

  constructor(x: number, y: number, number: number, speedMultiplier: number) {
    this.startX = x;
    this.x = x;
    this.y = y;
    this.radius = 45;
    this.number = number;
    this.baseSpeed = (Math.random() + 1.0) * speedMultiplier;
    this.color =
      BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    this.wobbleSpeed = Math.random() * 0.03 + 0.02;
    this.wobbleAmp = Math.floor(Math.random() * 21) + 10;
    this.frameOffset = Math.random() * 100;
    this.startTime = Date.now();
  }

  move() {
    this.y -= this.baseSpeed;
    const timeTick = Date.now();
    // Simulate pygame.time.get_ticks() roughly
    this.x =
      this.startX +
      Math.sin(timeTick * 0.005 + this.frameOffset) * this.wobbleAmp;
  }

  draw(ctx: CanvasRenderingContext2D) {
    // String
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.radius);
    ctx.lineTo(this.x, this.y + this.radius + 40);
    ctx.strokeStyle = "rgb(200, 200, 200)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Balloon Body
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Shine
    ctx.beginPath();
    ctx.arc(this.x - 15, this.y - 15, 10, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fill();

    // Text Shadow
    ctx.font = "bold 30px 'Comic Sans MS', 'Arial', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgb(50, 50, 50)";
    ctx.fillText(this.number.toString(), this.x + 2, this.y + 2);

    // Text Main
    ctx.fillStyle = WHITE;
    ctx.fillText(this.number.toString(), this.x, this.y);
  }

  isClicked(pos: Point) {
    const dist = Math.hypot(this.x - pos.x, this.y - pos.y);
    return dist < this.radius;
  }
}

class Button {
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  color: string;
  hoverColor: string;
  callback: () => void;
  isHovered: boolean;

  constructor(
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    color: string,
    hoverColor: string,
    callback: () => void
  ) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.text = text;
    this.color = color;
    this.hoverColor = hoverColor;
    this.callback = callback;
    this.isHovered = false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    // Helper for rounded rect
    const r = 12;
    ctx.moveTo(this.x + r, this.y);
    ctx.arcTo(this.x + this.w, this.y, this.x + this.w, this.y + this.h, r);
    ctx.arcTo(this.x + this.w, this.y + this.h, this.x, this.y + this.h, r);
    ctx.arcTo(this.x, this.y + this.h, this.x, this.y, r);
    ctx.arcTo(this.x, this.y, this.x + this.w, this.y, r);
    ctx.closePath();

    ctx.fillStyle = this.isHovered ? this.hoverColor : this.color;
    ctx.fill();
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = WHITE;
    ctx.font = "bold 30px 'Comic Sans MS', 'Arial'";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.text, this.x + this.w / 2, this.y + this.h / 2);
  }

  checkHover(pos: Point) {
    this.isHovered =
      pos.x >= this.x &&
      pos.x <= this.x + this.w &&
      pos.y >= this.y &&
      pos.y <= this.y + this.h;
  }

  checkClick() {
    if (this.isHovered) {
      this.callback();
    }
  }
}

// --- Main Game Component ---

export default function BalloonGame({
  currentHighScore,
  onClose,
  onUpdateHighScore,
}: BalloonGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // We use a ref to hold the game state to modify it inside the requestAnimationFrame loop
  // without triggering React renders.
  const gameState = useRef({
    state: "MENU" as "MENU" | "PLAYING" | "GAMEOVER",
    score: 0,
    highScore: currentHighScore,
    lives: 3,
    question: "",
    correctAnswer: 0,
    balloons: [] as Balloon[],
    particles: [] as Particle[],
    buttons: [] as Button[],
  });

  // Setup Buttons (initialized once)
  useEffect(() => {
    const startBtn = new Button(
      WIDTH / 2 - 100,
      HEIGHT / 2 + 50,
      200,
      60,
      "Start Game",
      BLUE,
      GREEN,
      () => startGame()
    );

    const restartBtn = new Button(
      WIDTH / 2 - 100,
      HEIGHT / 2 + 80,
      200,
      60,
      "Play Again",
      BLUE,
      GREEN,
      () => startGame()
    );

    gameState.current.buttons = [startBtn, restartBtn];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateQuestion = () => {
    const state = gameState.current;
    const opTypes = ["+"];
    const rangeMax = 10 + Math.floor(state.score / 2);

    if (state.score > 5) opTypes.push("-");
    if (state.score > 15) opTypes.push("*");
    if (state.score > 25) opTypes.push("/");

    const op = opTypes[Math.floor(Math.random() * opTypes.length)];
    let num1 = Math.floor(Math.random() * rangeMax) + 1;
    let num2 = Math.floor(Math.random() * rangeMax) + 1;

    if (op === "+") {
      state.correctAnswer = num1 + num2;
      state.question = `${num1} + ${num2} = ?`;
    } else if (op === "-") {
      if (num1 < num2) [num1, num2] = [num2, num1];
      state.correctAnswer = num1 - num2;
      state.question = `${num1} - ${num2} = ?`;
    } else if (op === "*") {
      const n1 =
        Math.floor(Math.random() * (6 + Math.floor(state.score / 5))) + 1;
      const n2 =
        Math.floor(Math.random() * (6 + Math.floor(state.score / 5))) + 1;
      state.correctAnswer = n1 * n2;
      state.question = `${n1} x ${n2} = ?`;
    } else if (op === "/") {
      num2 = Math.floor(Math.random() * 7) + 2; // 2-8
      const ans = Math.floor(Math.random() * 9) + 2; // 2-10
      num1 = num2 * ans;
      state.correctAnswer = ans;
      state.question = `${num1} / ${num2} = ?`;
    }

    spawnBalloons();
  };

  const spawnBalloons = () => {
    const state = gameState.current;
    state.balloons = [];
    const answers = [state.correctAnswer];

    while (answers.length < 3) {
      const offset = Math.floor(Math.random() * 11) - 5;
      const fake = state.correctAnswer + offset;
      if (
        fake !== state.correctAnswer &&
        fake >= 0 &&
        !answers.includes(fake)
      ) {
        answers.push(fake);
      }
    }

    // Shuffle
    for (let i = answers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [answers[i], answers[j]] = [answers[j], answers[i]];
    }

    const spacing = WIDTH / 4;
    const positions = [spacing, spacing * 2, spacing * 3];
    const speedMult = 1.0 + state.score * 0.05;

    for (let i = 0; i < 3; i++) {
      const yPos = HEIGHT + 50 + Math.floor(Math.random() * 100);
      state.balloons.push(
        new Balloon(positions[i], yPos, answers[i], speedMult)
      );
    }
  };

  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 15; i++) {
      gameState.current.particles.push(new Particle(x, y, color));
    }
  };

  const startGame = () => {
    const state = gameState.current;
    state.score = 0;
    state.lives = 3;
    state.particles = [];
    state.balloons = [];
    generateQuestion();
    state.state = "PLAYING";
  };

  const saveHighScore = () => {
    const state = gameState.current;
    // We send the score if it matches the current session best
    // The Backend will decide if it beats the Global World Record
    if (state.score > state.highScore) {
      state.highScore = state.score;
      // This triggers the API call in GamesHub
      onUpdateHighScore(state.highScore);
    } else {
      // OPTIONAL: If you want to submit the score even if it's not
      // a session high score (to check against global), uncomment this:
      // onUpdateHighScore(state.score);
    }
  };

  // --- Input Handling ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    const state = gameState.current;

    // Initialize Audio context on first interaction if needed
    if (!audioCtxRef.current) playPopSound();

    if (state.state === "MENU") {
      state.buttons[0].checkClick(); // Start button
    } else if (state.state === "GAMEOVER") {
      state.buttons[1].checkClick(); // Restart button
    } else if (state.state === "PLAYING") {
      let clickedBalloon: Balloon | null = null;
      for (const b of state.balloons) {
        if (b.isClicked(pos)) {
          clickedBalloon = b;
          break;
        }
      }

      if (clickedBalloon) {
        playPopSound();
        createExplosion(
          clickedBalloon.x,
          clickedBalloon.y,
          clickedBalloon.color
        );

        if (clickedBalloon.number === state.correctAnswer) {
          state.score += 1;
          generateQuestion();
        } else {
          state.lives -= 1;
          if (state.lives <= 0) {
            // 1. This calculates if we beat the current session high score
            saveHighScore();
            state.state = "GAMEOVER";
          } else {
            generateQuestion();
          }
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const state = gameState.current;
    if (state.state === "MENU") {
      state.buttons[0].checkHover(pos);
    } else if (state.state === "GAMEOVER") {
      state.buttons[1].checkHover(pos);
    }
  };

  // --- Game Loop (Draw & Update) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let animationFrameId: number;

    const drawGradientBackground = () => {
      // Draw vertical lines to simulate gradient as per python script
      for (let y = 0; y < HEIGHT; y++) {
        const ratio = 1 - y / HEIGHT;
        const ratioInv = y / HEIGHT;

        const r = Math.floor(DARK_BG_START.r * ratio);
        const g = Math.floor(DARK_BG_START.g * ratio);
        const b = Math.floor(DARK_BG_START.b * ratio + 50 * ratioInv);

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, y, WIDTH, 1);
      }
    };

    const render = () => {
      const state = gameState.current;

      // 1. Draw Background
      drawGradientBackground();

      // 2. Draw Particles (Persist across states)
      for (const p of state.particles) {
        p.draw(ctx);
      }

      // 3. Logic & Drawing based on State
      if (state.state === "MENU") {
        // Title
        ctx.fillStyle = WHITE;
        ctx.font = "bold 80px 'Comic Sans MS', 'Arial'";
        ctx.textAlign = "center";
        ctx.fillText("Beautiful Balloon", WIDTH / 2, HEIGHT / 2 - 100);

        // Subtitle
        ctx.fillStyle = "rgb(200, 200, 200)";
        ctx.font = "bold 30px 'Comic Sans MS', 'Arial'";
        ctx.fillText("Pop the correct balloon!", WIDTH / 2, HEIGHT / 2 - 20);

        // High Score
        ctx.fillStyle = GOLD;
        ctx.fillText(
          `High Score: ${state.highScore}`,
          WIDTH / 2,
          HEIGHT / 2 + 130
        );

        // Start Button
        state.buttons[0].draw(ctx);
      } else if (state.state === "PLAYING") {
        // UI Header
        ctx.fillStyle = UI_BG;
        ctx.fillRect(0, 0, WIDTH, 80);
        ctx.beginPath();
        ctx.moveTo(0, 80);
        ctx.lineTo(WIDTH, 80);
        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Stats
        ctx.font = "bold 30px 'Comic Sans MS', 'Arial'";
        ctx.textAlign = "left";
        ctx.fillStyle = "rgb(255, 255, 100)";
        ctx.fillText(`Score: ${state.score}`, 20, 50);

        ctx.textAlign = "right";
        ctx.fillStyle = "rgb(255, 100, 100)";
        ctx.fillText(`Lives: ${state.lives}`, WIDTH - 20, 50);

        // Question
        ctx.textAlign = "center";
        ctx.font = "bold 50px 'Comic Sans MS', 'Arial'";
        ctx.fillStyle = "rgb(100, 255, 255)";
        ctx.fillText(state.question, WIDTH / 2, 55);

        // Update & Draw Balloons
        // Loop backwards to allow removal
        for (let i = state.balloons.length - 1; i >= 0; i--) {
          const b = state.balloons[i];
          b.move();
          b.draw(ctx);

          if (b.y < -50) {
            if (b.number === state.correctAnswer) {
              state.lives -= 1;
              if (state.lives <= 0) {
                saveHighScore();
                state.state = "GAMEOVER";
              } else {
                generateQuestion();
              }
            } else {
              state.balloons.splice(i, 1);
            }
          }
        }
      } else if (state.state === "GAMEOVER") {
        // Title
        ctx.fillStyle = RED;
        ctx.font = "bold 80px 'Comic Sans MS', 'Arial'";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", WIDTH / 2, HEIGHT / 2 - 120);

        // Final Score
        ctx.fillStyle = WHITE;
        ctx.font = "bold 50px 'Comic Sans MS', 'Arial'";
        ctx.fillText(`Score: ${state.score}`, WIDTH / 2, HEIGHT / 2 - 40);

        // High Score
        ctx.fillStyle = GOLD;
        ctx.font = "bold 30px 'Comic Sans MS', 'Arial'";
        ctx.fillText(
          `High Score: ${state.highScore}`,
          WIDTH / 2,
          HEIGHT / 2 + 10
        );

        // Restart Button
        state.buttons[1].draw(ctx);
      }

      // Update Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.update();
        if (p.life <= 0) {
          state.particles.splice(i, 1);
        }
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array creates the loop once

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{
          border: "2px solid #333",
          borderRadius: "4px",
          boxShadow: "0 0 20px rgba(0,0,0,0.5)",
          cursor: "pointer",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      />
      <div style={{ marginTop: "10px" }}>
        <button
          onClick={onClose}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Exit Game
        </button>
      </div>
    </div>
  );
}
