/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState, useCallback } from "react";

// --- SOUND GENERATOR (Web Audio API) ---
const useSoundGenerator = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Audio Context lazily to adhere to browser autoplay policies
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playCrunch = () => {
    const ctx = initAudio();
    if (!ctx) return;

    const duration = 0.2;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Create white noise with a decay for a "crunch" sound
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
      // Fade out
      if (i > bufferSize - 2000) {
        data[i] *= (bufferSize - i) / 2000;
      }
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Lowpass filter to make it sound less like static and more like a crunch
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1000;

    noise.connect(filter);
    filter.connect(ctx.destination);
    noise.start();
  };

  const playMagic = () => {
    const ctx = initAudio();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Slide pitch up
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 1.5);

    // Fade volume out
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);

    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  };

  return { playCrunch, playMagic };
};

// --- TYPES ---
interface CaterpillarGameProps {
  gameName: string;
  currentHighScore: number;
  onClose: () => void;
  onUpdateHighScore: (score: number) => void;
}

type GamePhase = "feeding" | "cocoon" | "butterfly";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export default function CaterpillarGame({
  currentHighScore,
  onClose,
  onUpdateHighScore,
}: CaterpillarGameProps) {
  // --- STATE ---
  const [leavesLeft, setLeavesLeft] = useState(10);
  const [butterfliesFreed, setButterfliesFreed] = useState(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>("feeding");
  const [message, setMessage] = useState("Help the caterpillar eat breakfast!");
  const [isEating, setIsEating] = useState(false); // New lock state to prevent button mashing

  // Refs for animation logic (using refs prevents re-renders on every frame)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIdRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  
  // Game constants
  const TOTAL_LEAVES = 10;
  const CANVAS_WIDTH = 700;
  const CANVAS_HEIGHT = 400;

  const { playCrunch, playMagic } = useSoundGenerator();

  // --- DRAWING HELPERS ---
  
  // Create crumbs when eating
  const spawnCrumbs = (x: number, y: number) => {
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 1) * 4,
        life: 1.0,
        color: Math.random() > 0.5 ? "#43A047" : "#1B5E20"
      });
    }
  };

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Increment time for animations
    timeRef.current += 0.1;

    // Clear Screen
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw Sky Background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, "#E3F2FD");
    gradient.addColorStop(1, "#C8E6C9");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Floor/Branch Area
    ctx.fillStyle = "#AED581";
    ctx.beginPath();
    ctx.ellipse(350, 420, 400, 100, 0, 0, Math.PI * 2);
    ctx.fill();

    if (gamePhase === "feeding") {
      drawFeedingStage(ctx);
    } else if (gamePhase === "cocoon") {
      drawCocoonStage(ctx);
    } else if (gamePhase === "butterfly") {
      drawButterflyStage(ctx);
    }
    
    // Update and Draw Particles (Crumbs)
    drawParticles(ctx);

    // Loop
    frameIdRef.current = requestAnimationFrame(drawScene);
  }, [gamePhase, leavesLeft, isEating]); // Dependencies

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // Gravity
      p.life -= 0.05;

      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
      } else {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }
  };

  const drawFeedingStage = (ctx: CanvasRenderingContext2D) => {
    // Branch
    ctx.beginPath();
    ctx.moveTo(50, 320);
    ctx.bezierCurveTo(200, 325, 400, 315, 650, 320);
    ctx.lineWidth = 15;
    ctx.strokeStyle = "#5D4037";
    ctx.lineCap = "round";
    ctx.stroke();

    // Leaves
    const startX = 600;
    for (let i = 0; i < leavesLeft; i++) {
      const x = startX - i * 50;
      // Slight gentle wave for leaves
      const y = 320 + Math.sin(timeRef.current * 0.5 + i) * 2; 

      ctx.beginPath();
      ctx.ellipse(x + 20, y - 15, 20, 12, 0, 0, 2 * Math.PI);
      ctx.fillStyle = "#43A047";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#1B5E20";
      ctx.stroke();

      // Leaf detail
      ctx.beginPath();
      ctx.moveTo(x + 5, y - 2);
      ctx.lineTo(x + 35, y - 2);
      ctx.strokeStyle = "#81C784";
      ctx.stroke();
    }

    // Caterpillar Logic
    const eatenCount = TOTAL_LEAVES - leavesLeft;
    // Base segments + eaten. Limit growth visual slightly so it fits.
    const segments = 3 + eatenCount; 
    const segmentRadius = 15 + (eatenCount * 0.5); // Gets slightly fatter too
    
    // Position caterpillar based on segments so head is always moving forward slightly
    const tailX = 100;
    const spacing = 30 + (eatenCount * 0.5);

    // Draw Body Segments
    for (let i = 0; i < segments; i++) {
      const segX = tailX + i * spacing;
      
      // Idle Animation: Sine wave wiggle
      // If eating, wiggle faster
      const speed = isEating ? 15 : 5;
      const wiggleY = Math.sin(timeRef.current + i) * 3;
      const segY = 310 - segmentRadius + wiggleY;

      const color = i % 2 === 0 ? "#AED581" : "#7CB342";

      ctx.beginPath();
      ctx.arc(segX, segY, segmentRadius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#33691E";
      ctx.stroke();

      // Legs
      if (i < segments - 1) { // No legs on head
        ctx.beginPath();
        ctx.moveTo(segX - 5, segY + segmentRadius - 2);
        ctx.lineTo(segX - 5, segY + segmentRadius + 8);
        ctx.moveTo(segX + 5, segY + segmentRadius - 2);
        ctx.lineTo(segX + 5, segY + segmentRadius + 8);
        ctx.strokeStyle = "#33691E";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Head
    const headX = tailX + segments * spacing;
    const headY = 310 - segmentRadius + Math.sin(timeRef.current + segments) * 3;

    ctx.beginPath();
    ctx.arc(headX, headY, segmentRadius + 5, 0, 2 * Math.PI); // Bigger head
    ctx.fillStyle = "#ef5350"; // Redder head
    ctx.fill();
    ctx.strokeStyle = "#B71C1C";
    ctx.stroke();

    // Eyes
    ctx.fillStyle = "white";
    ctx.beginPath(); ctx.arc(headX + 5, headY - 5, 6, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(headX + 15, headY - 5, 6, 0, 2 * Math.PI); ctx.fill();
    
    // Pupils (move towards leaves)
    ctx.fillStyle = "black";
    const pupilOffset = isEating ? 2 : 0;
    ctx.beginPath(); ctx.arc(headX + 7 + pupilOffset, headY - 5, 2, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(headX + 17 + pupilOffset, headY - 5, 2, 0, 2 * Math.PI); ctx.fill();

    // Mouth (Animation when eating)
    ctx.beginPath();
    if (isEating && Math.sin(timeRef.current * 2) > 0) {
        // Open Mouth
        ctx.ellipse(headX + 12, headY + 10, 6, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#3E2723";
        ctx.fill();
    } else {
        // Smile
        ctx.arc(headX + 10, headY + 8, 8, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "black";
        ctx.stroke();
    }
    
    // Antennas
    ctx.beginPath();
    ctx.moveTo(headX + 5, headY - 15); ctx.lineTo(headX, headY - 30);
    ctx.moveTo(headX + 15, headY - 15); ctx.lineTo(headX + 20, headY - 30);
    ctx.stroke();
  };

  const drawCocoonStage = (ctx: CanvasRenderingContext2D) => {
    // Branch
    ctx.beginPath();
    ctx.moveTo(50, 100);
    ctx.lineTo(650, 100);
    ctx.lineWidth = 15;
    ctx.strokeStyle = "#5D4037";
    ctx.stroke();

    // Silk thread
    ctx.beginPath();
    ctx.moveTo(350, 105);
    ctx.lineTo(350, 160);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#F5F5F5";
    ctx.stroke();

    // Cocoon Body (Swinging animation)
    const swing = Math.sin(timeRef.current * 0.05) * 10;
    const centerX = 350 + swing;
    
    ctx.save();
    ctx.translate(350, 100);
    ctx.rotate(Math.sin(timeRef.current * 0.05) * 0.1);
    ctx.translate(-350, -100);

    ctx.beginPath();
    ctx.ellipse(centerX, 230, 40, 80, 0, 0, 2 * Math.PI);
    ctx.fillStyle = "#DCEDC8";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#8BC34A";
    ctx.stroke();

    // Silk wraps
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    for(let y=180; y<280; y+=10) {
        ctx.beginPath();
        ctx.moveTo(centerX - 35, y);
        ctx.quadraticCurveTo(centerX, y + 10, centerX + 35, y - 5);
        ctx.stroke();
    }
    ctx.restore();
  };

  const drawButterflyStage = (ctx: CanvasRenderingContext2D) => {
    // Simple logic for the butterfly flying around
    // We use timeRef to create a complex path
    const bfX = 350 + Math.sin(timeRef.current * 0.1) * 200;
    const bfY = 200 + Math.cos(timeRef.current * 0.15) * 100;
    
    const wingFlap = Math.abs(Math.sin(timeRef.current * 0.8)) * 60;

    // Wings
    ctx.fillStyle = "#E040FB";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;

    // Left Wing
    ctx.beginPath();
    ctx.moveTo(bfX, bfY);
    ctx.quadraticCurveTo(bfX - wingFlap - 40, bfY - 80, bfX - 10, bfY - 10);
    ctx.quadraticCurveTo(bfX - wingFlap - 40, bfY + 80, bfX, bfY + 20);
    ctx.fill(); ctx.stroke();

    // Right Wing
    ctx.beginPath();
    ctx.moveTo(bfX, bfY);
    ctx.quadraticCurveTo(bfX + wingFlap + 40, bfY - 80, bfX + 10, bfY - 10);
    ctx.quadraticCurveTo(bfX + wingFlap + 40, bfY + 80, bfX, bfY + 20);
    ctx.fill(); ctx.stroke();

    // Body
    ctx.fillStyle = "#4A148C";
    ctx.beginPath();
    ctx.ellipse(bfX, bfY, 6, 30, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Sparkles
    if (Math.random() > 0.8) {
        spawnCrumbs(bfX, bfY);
    }
  };

  // --- GAME LOGIC ---

  const feedCaterpillar = (amount: number) => {
    // 1. INPUT LOCKING: Prevent clicks if already eating or busy
    if (gamePhase !== "feeding" || isEating) return;

    // 2. LOGIC FIX: Don't eat more leaves than exist
    let eatAmount = Math.min(amount, leavesLeft);
    if (eatAmount <= 0) return;

    // Lock input
    setIsEating(true);
    playCrunch();

    // Visual feedback for eating
    // We update the state after a short delay to simulate chewing time
    spawnCrumbs(600 - ((leavesLeft - 1) * 50), 300);
    
    const phrases = ["Crunch!", "Munch!", "Yummy!", "Gulp!", "More please!"];
    setMessage(phrases[Math.floor(Math.random() * phrases.length)]);

    setTimeout(() => {
        setLeavesLeft(prev => prev - eatAmount);
        setIsEating(false);
        
        // Check win condition immediately after update
        if (leavesLeft - eatAmount <= 0) {
            startTransformation();
        }
    }, 600); // 600ms chewing time
  };

  const startTransformation = () => {
    setMessage("I'm so full! Time to take a nap...");
    setIsEating(true); // Lock input
    setTimeout(() => {
      setGamePhase("cocoon");
      setMessage("Sleeping in the Chrysalis... Zzz...");
      setTimeout(() => {
        showButterflyStage();
      }, 3000);
    }, 2000);
  };

  const showButterflyStage = () => {
    setGamePhase("butterfly");
    setMessage("✨ I turned into a Butterfly! ✨");
    playMagic();

    const newScore = butterfliesFreed + 1;
    setButterfliesFreed(newScore);
    onUpdateHighScore(newScore);

    // Auto reset after 8 seconds of flying
    setTimeout(() => {
        resetGame();
    }, 8000);
  };

  const resetGame = () => {
    setLeavesLeft(TOTAL_LEAVES);
    setGamePhase("feeding");
    setMessage("Here is a new hungry caterpillar!");
    setIsEating(false);
  };

  // Start Animation Loop
  useEffect(() => {
    frameIdRef.current = requestAnimationFrame(drawScene);
    return () => cancelAnimationFrame(frameIdRef.current);
  }, [drawScene]);


  // --- STYLES ---
  const containerStyle: React.CSSProperties = {
    backgroundColor: "#F1F8E9",
    width: "740px",
    padding: "20px",
    margin: "0 auto",
    fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif',
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    border: "8px solid #558B2F",
    borderRadius: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
  };

  const buttonBaseStyle: React.CSSProperties = {
    color: "white",
    fontSize: "20px",
    fontWeight: "bold",
    padding: "15px 30px",
    borderRadius: "15px",
    border: "none",
    boxShadow: "0 5px 0 rgba(0,0,0,0.2)",
    transition: "all 0.1s",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  };

  return (
    <div style={containerStyle}>
      <div style={{
          display: 'flex', 
          justifyContent: 'space-between', 
          width: '100%', 
          marginBottom: '10px',
          color: '#33691E'
      }}>
        <div><strong>Session Score:</strong> {butterfliesFreed}</div>
        <div><strong>Record:</strong> {Math.max(currentHighScore, butterfliesFreed)}</div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          backgroundColor: "#fff",
          borderRadius: "10px",
          border: "4px solid #81C784",
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.05)"
        }}
      />

      <div style={{ 
          fontSize: "24px", 
          fontWeight: "bold", 
          color: "#33691E", 
          marginTop: "20px",
          minHeight: "36px"
      }}>
        {message}
      </div>

      <div style={{ marginTop: "20px", display: "flex", gap: "20px" }}>
        {/* BUTTON 1: Crunch */}
        <button
          onClick={() => feedCaterpillar(1)}
          disabled={gamePhase !== "feeding" || isEating || leavesLeft < 1}
          style={{
            ...buttonBaseStyle,
            backgroundColor: "#7CB342",
            opacity: (gamePhase !== "feeding" || isEating || leavesLeft < 1) ? 0.5 : 1,
            transform: isEating ? "scale(0.95)" : "scale(1)"
          }}
        >
          <span>Crunch (1)</span> 🍃
        </button>

        {/* BUTTON 2: Munch (Disables if only 1 leaf left!) */}
        <button
          onClick={() => feedCaterpillar(2)}
          // FIX: Disable if only 1 leaf left
          disabled={gamePhase !== "feeding" || isEating || leavesLeft < 2}
          style={{
            ...buttonBaseStyle,
            backgroundColor: "#33691E",
            opacity: (gamePhase !== "feeding" || isEating || leavesLeft < 2) ? 0.5 : 1,
            transform: isEating ? "scale(0.95)" : "scale(1)"
          }}
        >
          <span>Munch (2)</span> 🌿
        </button>
      </div>

      <button
        onClick={onClose}
        style={{
          marginTop: "30px",
          cursor: "pointer",
          background: "none",
          border: "none",
          color: "#558B2F",
          fontSize: "16px",
          textDecoration: "underline",
        }}
      >
        Exit Game
      </button>
    </div>
  );
}