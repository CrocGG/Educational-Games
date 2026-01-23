/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState, useCallback } from "react";

// --- SOUND GENERATOR (Web Audio API) ---
const useSoundGenerator = () => {
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  useEffect(() => {
    const ctx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    setAudioCtx(ctx);
    return () => {
      ctx.close();
    };
  }, []);

  const playCrunch = () => {
    if (!audioCtx) return;
    const duration = 0.3;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
      if (i > bufferSize - 5000) {
        data[i] *= (bufferSize - i) / 5000;
      }
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.connect(audioCtx.destination);
    noise.start();
  };

  const playMagic = () => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(1240, audioCtx.currentTime + 2);

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);

    osc.start();
    osc.stop(audioCtx.currentTime + 2);
  };

  return { playCrunch, playMagic };
};

// --- TYPES ---
interface CaterpillarGameProps {
  gameName: string;
  currentHighScore: number; // This comes from the DB (Global High Score)
  onClose: () => void;
  onUpdateHighScore: (score: number) => void; // Connects to GamesHub submit function
}

type GamePhase = "feeding" | "cocoon" | "butterfly";

export default function CaterpillarGame({
  currentHighScore,
  onClose,
  onUpdateHighScore,
}: CaterpillarGameProps) {
  // --- STATE ---
  const [leavesLeft, setLeavesLeft] = useState(10);
  
  // FIX: Start current session score at 0, not the high score
  const [butterfliesFreed, setButterfliesFreed] = useState(0); 
  
  const [gamePhase, setGamePhase] = useState<GamePhase>("feeding");
  const [message, setMessage] = useState("Help the caterpillar eat breakfast!");

  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // FIX: Initialize useRef with 0 to solve TypeScript error
  const animationRef = useRef<number>(0);

  // Sound
  const { playCrunch, playMagic } = useSoundGenerator();

  // Constants
  const TOTAL_LEAVES = 10;
  const CANVAS_WIDTH = 700;
  const CANVAS_HEIGHT = 400;

  // --- DRAWING LOGIC ---
  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#C8E6C9";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (gamePhase === "feeding") {
      drawFeedingStage(ctx);
    } else if (gamePhase === "cocoon") {
      drawCocoonStage(ctx);
    }
  }, [leavesLeft, gamePhase]);

  const drawFeedingStage = (ctx: CanvasRenderingContext2D) => {
    // Branch
    ctx.beginPath();
    ctx.moveTo(50, 300);
    ctx.lineTo(650, 300);
    ctx.lineWidth = 20;
    ctx.strokeStyle = "#5D4037";
    ctx.lineCap = "round";
    ctx.stroke();

    // Leaves
    const startX = 600;
    for (let i = 0; i < leavesLeft; i++) {
      const x = startX - i * 50;
      const y = 300;

      ctx.beginPath();
      ctx.ellipse(x + 20, y - 15, 20, 15, 0, 0, 2 * Math.PI);
      ctx.fillStyle = "#43A047";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#1B5E20";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + 5, y);
      ctx.lineTo(x + 35, y);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Caterpillar
    const eatenCount = TOTAL_LEAVES - leavesLeft;
    const segments = 3 + eatenCount;
    const headX = 100 + segments * 35;

    for (let i = 0; i < segments; i++) {
      const segX = headX - i * 35;
      const wiggle = i % 2 === 0 ? 5 : -5;
      const color = i % 2 === 0 ? "#AED581" : "#7CB342";

      ctx.beginPath();
      ctx.ellipse(segX, 295 + wiggle, 15, 15, 0, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#33691E";
      ctx.stroke();
    }

    // Head
    ctx.beginPath();
    ctx.ellipse(headX + 17.5, 297.5, 22.5, 22.5, 0, 0, 2 * Math.PI);
    ctx.fillStyle = "#F44336";
    ctx.fill();
    ctx.strokeStyle = "#B71C1C";
    ctx.stroke();

    // Eyes & Smile
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(headX + 27, 287, 2.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headX + 27, 307, 2.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headX + 30, 300, 5, 0.5 * Math.PI, 1.5 * Math.PI, true);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.stroke();
  };

  const drawCocoonStage = (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    ctx.moveTo(50, 100);
    ctx.lineTo(650, 100);
    ctx.lineWidth = 20;
    ctx.strokeStyle = "#5D4037";
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(350, 110);
    ctx.lineTo(350, 150);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "white";
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(350, 215, 30, 65, 0, 0, 2 * Math.PI);
    ctx.fillStyle = "#8BC34A";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#33691E";
    ctx.stroke();

    ctx.lineWidth = 1;
    [180, 210, 240].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(320, y);
      ctx.lineTo(380, y);
      ctx.stroke();
    });
  };

  // --- BUTTERFLY ANIMATION ---
  const animateButterfly = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let bfX = 350;
    let bfY = 300;
    let wingState = 0;
    let flyCount = 0;

    const renderFrame = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = "#C8E6C9";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const wingW = wingState % 2 === 0 ? 70 : 20;

      ctx.lineWidth = 3;
      ctx.strokeStyle = "white";
      ctx.fillStyle = "#E040FB";

      // Wings
      ctx.beginPath();
      ctx.moveTo(bfX, bfY);
      ctx.lineTo(bfX - wingW, bfY - 60);
      ctx.lineTo(bfX - wingW, bfY + 60);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(bfX, bfY);
      ctx.lineTo(bfX + wingW, bfY - 60);
      ctx.lineTo(bfX + wingW, bfY + 60);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Body
      ctx.fillStyle = "#4A148C";
      ctx.beginPath();
      ctx.ellipse(bfX, bfY, 8, 40, 0, 0, 2 * Math.PI);
      ctx.fill();

      bfY -= 4;
      bfX += Math.random() * 8 - 4;
      wingState++;
      flyCount++;

      if (flyCount < 80) {
        animationRef.current = requestAnimationFrame(() =>
          setTimeout(renderFrame, 50)
        );
      } else {
        resetGame();
      }
    };

    renderFrame();
  }, []);

  // --- GAME LOGIC ---
  const feedCaterpillar = (amount: number) => {
    if (gamePhase !== "feeding") return;

    let eatAmount = amount;
    if (eatAmount > leavesLeft) eatAmount = leavesLeft;

    const newLeaves = leavesLeft - eatAmount;
    setLeavesLeft(newLeaves);
    playCrunch();

    const phrases = ["Yummy!", "Crunch!", "Gulp!", "So tasty!", "Growing big!"];
    setMessage(phrases[Math.floor(Math.random() * phrases.length)]);

    if (newLeaves === 0) {
      startTransformation();
    }
  };

  const startTransformation = () => {
    setMessage("I'm full! Time to sleep...");
    setTimeout(() => {
      setGamePhase("cocoon");
      setMessage("Shhh... it's a Chrysalis now.");
      setTimeout(() => {
        showButterflyStage();
      }, 2500);
    }, 1500);
  };

  const showButterflyStage = () => {
    setGamePhase("butterfly");
    setMessage("✨ WOW! A Butterfly! ✨");
    playMagic();

    // 1. Calculate new Score
    const newScore = butterfliesFreed + 1;
    setButterfliesFreed(newScore);

    // 2. Send to Backend (GamesHub will handle the logic of "is this a high score?")
    onUpdateHighScore(newScore);

    animateButterfly();
  };

  const resetGame = () => {
    setLeavesLeft(TOTAL_LEAVES);
    setGamePhase("feeding");
    setMessage("Here comes a new egg! Hungry again!");
  };

  useEffect(() => {
    if (gamePhase !== "butterfly") {
      drawScene();
    }
  }, [leavesLeft, gamePhase, drawScene]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    }
  }, []);

  // --- STYLES ---
  const containerStyle: React.CSSProperties = {
    backgroundColor: "#81C784",
    width: "800px",
    height: "650px",
    margin: "0 auto",
    fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif',
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    border: "5px solid #388E3C",
    borderRadius: "10px",
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: "#558B2F",
    width: "90%",
    padding: "15px",
    marginTop: "20px",
    border: "5px solid #33691E",
    borderRadius: "5px",
    textAlign: "center",
  };

  const scoreTextStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#FFF176",
    margin: 0,
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        {/* Shows Current Session Score */}
        <h2 style={scoreTextStyle}>
          🦋 Butterflies Helped: {butterfliesFreed}
        </h2>
        {/* Shows Database High Score */}
        <small style={{ color: "#DCEDC8", fontSize: "14px" }}>
            World Record: {currentHighScore > butterfliesFreed ? currentHighScore : butterfliesFreed}
        </small>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          backgroundColor: "#C8E6C9",
          border: "5px solid #388E3C",
          marginTop: "20px",
        }}
      />

      <div style={{ fontSize: "20px", fontWeight: "bold", color: "white", marginTop: "15px" }}>
        {message}
      </div>

      <div style={{ marginTop: "20px", display: "flex", gap: "20px" }}>
        <button
          onClick={() => feedCaterpillar(1)}
          disabled={gamePhase !== "feeding"}
          style={{
            backgroundColor: "#7CB342",
            color: "white",
            fontSize: "18px",
            fontWeight: "bold",
            padding: "10px 20px",
            border: "5px solid #558B2F",
            borderRadius: "5px",
            cursor: gamePhase === "feeding" ? "pointer" : "not-allowed",
            opacity: gamePhase === "feeding" ? 1 : 0.6,
          }}
        >
          Crunch (1) 🍃
        </button>
        <button
          onClick={() => feedCaterpillar(2)}
          disabled={gamePhase !== "feeding"}
          style={{
            backgroundColor: "#33691E",
            color: "white",
            fontSize: "18px",
            fontWeight: "bold",
            padding: "10px 20px",
            border: "5px solid #1B5E20",
            borderRadius: "5px",
            cursor: gamePhase === "feeding" ? "pointer" : "not-allowed",
            opacity: gamePhase === "feeding" ? 1 : 0.6,
          }}
        >
          Munch (2) 🍃
        </button>
      </div>

      <button
        onClick={onClose}
        style={{
          marginTop: "20px",
          cursor: "pointer",
          background: "none",
          border: "none",
          color: "#1B5E20",
          textDecoration: "underline",
        }}
      >
        Exit Game
      </button>
    </div>
  );
}