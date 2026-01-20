/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState, useCallback } from "react";
import api from "../services/api";

// --- Constants & Config ---
const CANVAS_SIZE = 600;
const SCALE = 20;
const POINTS_PER_FOOD = 10;

const SPEED_MAP: Record<string, number> = { Easy: 150, Medium: 100, Hard: 60 };
const OBSTACLE_COUNT: Record<string, number> = { Easy: 0, Medium: 8, Hard: 15 };

const SNAKE_COLORS = [
  "lime",
  "cyan",
  "gold",
  "white",
  "orange",
  "magenta",
  "violet",
  "teal",
  "chartreuse",
  "hotpink",
];
const BG_COLORS = [
  "black",
  "navy",
  "darkgreen",
  "maroon",
  "purple",
  "darkslategrey",
  "#1a1a1a",
  "midnightblue",
  "#2c3e50",
];
const FOOD_SHAPES = [
  "Circle",
  "Square",
  "Triangle",
  "Diamond",
  "Star",
  "Hexagon",
];

type Props = {
  onClose: () => void;
  gameName: string;
  currentHighScore: number;
};

export default function SnakeGame({
  onClose,
  gameName,
  currentHighScore,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- State ---
  const [snake, setSnake] = useState([
    [10, 10],
    [9, 10],
    [8, 10],
  ]);
  const [food, setFood] = useState([15, 15]);
  const [obstacles, setObstacles] = useState<number[][]>([]);
  const [dir, setDir] = useState([1, 0]);
  const [nextDir, setNextDir] = useState([1, 0]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [running, setRunning] = useState(false);

  // New state for the start delay
  const [countdown, setCountdown] = useState(0);

  // --- Customization ---
  const [snakeColor, setSnakeColor] = useState("lime");
  const [bgColor, setBgColor] = useState("black");
  const [difficulty, setDifficulty] = useState("Medium");
  const [fruitShape, setFruitShape] = useState("Circle");

  // Sound Effect
  const playBeep = (freq: number, duration: number) => {
    try {
      const audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = freq;
      oscillator.type = "square";
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration / 1000);
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  const generateItems = useCallback(
    (currentSnake: number[][], count: number) => {
      const newObstacles: number[][] = [];
      for (let i = 0; i < count; i++) {
        let x: number, y: number;
        do {
          x = Math.floor(Math.random() * (CANVAS_SIZE / SCALE));
          y = Math.floor(Math.random() * (CANVAS_SIZE / SCALE));
        } while (
          currentSnake.some((s) => s[0] === x && s[1] === y) ||
          newObstacles.some((o) => o[0] === x && o[1] === y)
        );
        newObstacles.push([x, y]);
      }
      return newObstacles;
    },
    []
  );

  const startGame = () => {
    const initialSnake = [
      [10, 10],
      [9, 10],
      [8, 10],
    ];
    setSnake(initialSnake);
    setDir([1, 0]);
    setNextDir([1, 0]);
    setScore(0);
    setGameOver(false);
    setPaused(false);
    setRunning(true);
    setCountdown(2); // Start the 2 second countdown
    setObstacles(generateItems(initialSnake, OBSTACLE_COUNT[difficulty]));
  };

  const endGame = useCallback(() => {
    setRunning(false);
    setGameOver(true);
    playBeep(200, 400);
    if (score > 0) {
      api
        .post("/submit-score/", { game_name: gameName, score: score })
        .catch(() => {});
    }
  }, [score, gameName]);

  // Countdown Logic
  useEffect(() => {
    if (countdown > 0 && running && !paused && !gameOver) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, running, paused, gameOver]);

  // Game Logic Loop
  useEffect(() => {
    // Prevent movement if countdown is active
    if (!running || paused || gameOver || countdown > 0) return;

    const moveSnake = setInterval(() => {
      setDir(nextDir);
      setSnake((prev) => {
        const head = prev[0];
        const newHead = [head[0] + nextDir[0], head[1] + nextDir[1]];

        if (
          newHead[0] < 0 ||
          newHead[0] >= CANVAS_SIZE / SCALE ||
          newHead[1] < 0 ||
          newHead[1] >= CANVAS_SIZE / SCALE
        ) {
          endGame();
          return prev;
        }
        if (
          prev.some((s) => s[0] === newHead[0] && s[1] === newHead[1]) ||
          obstacles.some((o) => o[0] === newHead[0] && o[1] === newHead[1])
        ) {
          endGame();
          return prev;
        }

        const newSnake = [newHead, ...prev];

        if (newHead[0] === food[0] && newHead[1] === food[1]) {
          setScore((s) => s + POINTS_PER_FOOD);
          let newFood: number[];
          do {
            newFood = [
              Math.floor(Math.random() * (CANVAS_SIZE / SCALE)),
              Math.floor(Math.random() * (CANVAS_SIZE / SCALE)),
            ];
          } while (
            newSnake.some((s) => s[0] === newFood[0] && s[1] === newFood[1]) ||
            obstacles.some((o) => o[0] === newFood[0] && o[1] === newFood[1])
          );
          setFood(newFood);
          playBeep(900, 50);
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    }, SPEED_MAP[difficulty]);

    return () => clearInterval(moveSnake);
  }, [
    running,
    paused,
    gameOver,
    nextDir,
    food,
    obstacles,
    difficulty,
    endGame,
    countdown,
  ]);

  // Drawing Logic
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.fillStyle = "#666";
    ctx.strokeStyle = "#333";
    obstacles.forEach(([x, y]) => {
      ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
      ctx.strokeRect(x * SCALE, y * SCALE, SCALE, SCALE);
    });

    snake.forEach(([x, y], i) => {
      const isHead = i === 0;
      ctx.fillStyle = isHead
        ? snakeColor === "white"
          ? "gold"
          : "white"
        : snakeColor;
      ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
      ctx.strokeStyle = "black";
      ctx.strokeRect(x * SCALE, y * SCALE, SCALE, SCALE);

      if (isHead) {
        ctx.fillStyle = "black";
        ctx.fillRect(x * SCALE + 4, y * SCALE + 4, 4, 4);
        ctx.fillRect(x * SCALE + 12, y * SCALE + 4, 4, 4);
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x * SCALE + 10, y * SCALE + 10);
        ctx.lineTo(x * SCALE + 10 + dir[0] * 15, y * SCALE + 10 + dir[1] * 15);
        ctx.stroke();
      }
    });

    ctx.fillStyle = "red";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    const [fx, fy] = [food[0] * SCALE + SCALE / 2, food[1] * SCALE + SCALE / 2];
    const size = 8;

    ctx.beginPath();
    switch (fruitShape) {
      case "Square":
        ctx.rect(fx - size, fy - size, size * 2, size * 2);
        break;
      case "Triangle":
        ctx.moveTo(fx, fy - size);
        ctx.lineTo(fx + size, fy + size);
        ctx.lineTo(fx - size, fy + size);
        ctx.closePath();
        break;
      case "Diamond":
        ctx.moveTo(fx, fy - size);
        ctx.lineTo(fx + size, fy);
        ctx.lineTo(fx, fy + size);
        ctx.lineTo(fx - size, fy);
        ctx.closePath();
        break;
      case "Hexagon":
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const hx = fx + size * Math.cos(angle);
          const hy = fy + size * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        break;
      case "Star": {
        // <--- FIXED: Added Curly Braces for Block Scope
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size / 2;
        let rot = (Math.PI / 2) * 3;
        const step = Math.PI / spikes;
        ctx.moveTo(fx, fy - outerRadius);
        for (let i = 0; i < spikes; i++) {
          let sx = fx + Math.cos(rot) * outerRadius;
          let sy = fy + Math.sin(rot) * outerRadius;
          ctx.lineTo(sx, sy);
          rot += step;
          sx = fx + Math.cos(rot) * innerRadius;
          sy = fy + Math.sin(rot) * innerRadius;
          ctx.lineTo(sx, sy);
          rot += step;
        }
        ctx.lineTo(fx, fy - outerRadius);
        ctx.closePath();
        break;
      } // <--- Closed Curly Braces
      case "Circle":
      default:
        ctx.arc(fx, fy, size, 0, Math.PI * 2);
        break;
    }
    ctx.fill();
    ctx.stroke();

    // Draw Countdown Overlay if active
    if (countdown > 0) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.fillStyle = "white";
      ctx.font = "bold 80px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(countdown.toString(), CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    }
  }, [snake, food, obstacles, bgColor, snakeColor, fruitShape, dir, countdown]);

  // Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      ) {
        e.preventDefault();
      }
      const keys: any = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      };
      if (e.key === " ") setPaused((p) => !p);

      // Only allow input if countdown is not active
      if (countdown === 0 && keys[e.key]) {
        const newDir = keys[e.key];
        if (newDir[0] !== -dir[0] || newDir[1] !== -dir[1]) {
          setNextDir(newDir);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dir, countdown]);

  return (
    <div style={overlayStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button onClick={startGame} style={btnStyle}>
            Start Game
          </button>
          <button
            onClick={() => setPaused(!paused)}
            disabled={!running || countdown > 0}
            style={btnStyle}
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={onClose}
            style={{ ...btnStyle, background: "#dc3545", color: "white" }}
          >
            Exit
          </button>
        </div>

        <div style={infoStyle}>
          Record: {currentHighScore} | Score: {score}
        </div>

        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={canvasStyle}
        />

        <div style={controlsStyle}>
          {renderSelect("Color", snakeColor, setSnakeColor, SNAKE_COLORS)}
          {renderSelect("BG", bgColor, setBgColor, BG_COLORS)}
          {renderSelect("Fruit", fruitShape, setFruitShape, FOOD_SHAPES)}
          {renderSelect(
            "Diff",
            difficulty,
            setDifficulty,
            Object.keys(SPEED_MAP)
          )}
        </div>

        {gameOver && (
          <div style={modalOverlay}>
            <h1
              style={{
                fontSize: "3rem",
                margin: "0 0 20px 0",
                color: "white",
                textShadow: "2px 2px red",
              }}
            >
              GAME OVER
            </h1>
            <p style={{ fontSize: "1.5rem", color: "#ccc" }}>
              Final Score: {score}
            </p>
            <button onClick={startGame} style={restartBtnStyle}>
              Restart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const renderSelect = (
  label: string,
  val: string,
  setVal: any,
  opts: string[]
) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      fontSize: "12px",
      minWidth: "80px",
    }}
  >
    <label style={{ marginBottom: "4px", color: "#aaa" }}>{label}</label>
    <select
      value={val}
      onChange={(e) => setVal(e.target.value)}
      style={selectStyle}
    >
      {opts.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </div>
);

// --- CSS Objects ---
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.95)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  color: "white",
  fontFamily: "monospace",
};
const containerStyle: React.CSSProperties = {
  background: "#222",
  padding: "15px",
  borderRadius: "12px",
  border: "1px solid #444",
  boxShadow: "0 0 50px rgba(0,0,0,0.8)",
};
const headerStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  marginBottom: "15px",
};
const btnStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px",
  cursor: "pointer",
  border: "none",
  borderRadius: "6px",
  fontWeight: "bold",
  background: "#444",
  color: "#fff",
  transition: "0.2s",
};
const infoStyle: React.CSSProperties = {
  textAlign: "center",
  fontSize: "24px",
  color: "#0f0",
  marginBottom: "15px",
  fontWeight: "bold",
};
const canvasStyle: React.CSSProperties = {
  background: "#000",
  border: "4px solid #555",
  display: "block",
};
const controlsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  marginTop: "15px",
  padding: "15px",
  background: "#333",
  borderRadius: "8px",
};
const selectStyle: React.CSSProperties = {
  padding: "5px",
  background: "#555",
  color: "white",
  border: "1px solid #666",
  borderRadius: "4px",
  cursor: "pointer",
};
const modalOverlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: "12px",
};
const restartBtnStyle: React.CSSProperties = {
  background: "#28a745",
  color: "white",
  padding: "15px 40px",
  fontSize: "20px",
  border: "none",
  borderRadius: "50px",
  cursor: "pointer",
  marginTop: "20px",
  fontWeight: "bold",
  textTransform: "uppercase",
};
