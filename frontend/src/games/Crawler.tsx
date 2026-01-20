/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from "react";

// --- Types & Props ---
interface CrawlerGameProps {
  gameName: string;
  currentHighScore: number; // This is the Best Streak recorded so far
  onClose: () => void;
  onUpdateHighScore: (newScore: number) => void;
}

type Turn = "human" | "robot";
type GameStatus = "playing" | "gameover";

const INITIAL_LEAVES = 13; 

const playTone = (freq: number, durationMs: number, type: OscillatorType = "sine") => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (e) {
    console.error("Audio error", e);
  }
};

const playCrunch = () => playTone(200, 150, "square");
const playWin = () => {
  [523, 659, 784, 1046].forEach((freq, i) => setTimeout(() => playTone(freq, 150, "sine"), i * 150));
};

const CrawlerGame: React.FC<CrawlerGameProps> = ({
  currentHighScore,
  onClose,
  onUpdateHighScore,
}) => {
  // --- Game State ---
  const [leaves, setLeaves] = useState<number>(INITIAL_LEAVES);
  const [turn, setTurn] = useState<Turn>("human");
  const [status, setStatus] = useState<GameStatus>("playing");
  
  // FIXED: Start at 0 for every new session
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  
  const [message, setMessage] = useState<string>("Your turn! Click a button.");
  const [msgColor, setMsgColor] = useState<string>("#1B5E20");
  const [winner, setWinner] = useState<"You" | "Robot" | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Drawing ---
  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Branch
    ctx.beginPath();
    ctx.moveTo(50, 200);
    ctx.lineTo(650, 200);
    ctx.lineWidth = 15;
    ctx.strokeStyle = "#795548";
    ctx.lineCap = "round";
    ctx.stroke();

    // 2. Leaves
    const startX = 600;
    for (let i = 0; i < leaves; i++) {
      // Adjusted spacing slightly to fit 13 leaves comfortably
      const x = startX - i * 42; 
      const y = 200;

      ctx.fillStyle = "#76FF03";
      ctx.strokeStyle = "#33691E";
      ctx.lineWidth = 2;
      
      // Leaf body
      ctx.beginPath();
      ctx.ellipse(x + 20, y - 25, 20, 15, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Leaf vein
      ctx.beginPath();
      ctx.moveTo(x + 5, y - 25);
      ctx.lineTo(x + 35, y - 25);
      ctx.strokeStyle = "#1B5E20";
      ctx.stroke();
    }

    // 3. Crawler / Butterfly
    if (status === "gameover" && winner) {
      drawButterfly(ctx, winner);
    } else {
      drawCrawler(ctx);
    }
  }, [leaves, status, winner]);

  const drawCrawler = (ctx: CanvasRenderingContext2D) => {
    // Dynamic calculation based on INITIAL_LEAVES constant
    const leavesEaten = INITIAL_LEAVES - leaves;
    const catX = 50 + leavesEaten * 42; // Match the spacing in loop (42)

    ctx.fillStyle = "#AED581";
    ctx.strokeStyle = "#33691E";
    ctx.lineWidth = 1;

    // Body Segments
    ctx.beginPath();
    ctx.arc(catX - 45, 195, 15, 0, Math.PI * 2); // Rear
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(catX - 15, 195, 15, 0, Math.PI * 2); // Middle
    ctx.fill();
    ctx.stroke();

    // Head
    ctx.fillStyle = "#FF7043";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(catX + 25, 195, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Face
    ctx.fillStyle = "black";
    ctx.beginPath(); ctx.arc(catX + 17, 190, 2.5, 0, Math.PI * 2); ctx.fill(); // Eye L
    ctx.beginPath(); ctx.arc(catX + 37, 190, 2.5, 0, Math.PI * 2); ctx.fill(); // Eye R
    ctx.beginPath(); ctx.arc(catX + 25, 200, 10, 0, Math.PI, false); ctx.strokeStyle = "black"; ctx.stroke(); // Smile
  };

  const drawButterfly = (ctx: CanvasRenderingContext2D, winnerName: string) => {
    const cx = 350;
    const cy = 175;
    const color = winnerName === "You" ? "#D81B60" : "#546E7A";

    ctx.fillStyle = color;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;

    // Wings
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(cx - 80, cy - 80); ctx.lineTo(cx - 80, cy + 80);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(cx + 80, cy - 80); ctx.lineTo(cx + 80, cy + 80);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // Body
    ctx.fillStyle = "#3E2723";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 15, 60, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  // --- Logic ---
  useEffect(() => { drawScene(); }, [drawScene]);

  const handleWin = (lastPlayer: Turn) => {
    const newWinner = lastPlayer === "human" ? "You" : "Robot";
    setWinner(newWinner);
    setStatus("gameover");

    if (newWinner === "You") {
      // 1. Calculate new streak
      const newStreak = currentStreak + 1;
      
      // 2. Update local state
      setCurrentStreak(newStreak);

      // 3. Only update Global High Score if we beat the record
      if (newStreak > currentHighScore) {
         onUpdateHighScore(newStreak);
      }
      
      setMessage("🦋 YOU ARE A BUTTERFLY! 🦋");
      setMsgColor("#D81B60");
      playWin();
    } else {
      // If Robot wins, the streak is broken!
      setCurrentStreak(0);
      
      setMessage("🤖 Robot is the Butterfly!");
      setMsgColor("#546E7A");
    }
  };

  const processMove = (amount: number, player: Turn) => {
    const remaining = leaves - amount;
    setLeaves(remaining);
    playCrunch();

    if (remaining === 0) {
      handleWin(player);
    } else {
      const nextTurn = player === "human" ? "robot" : "human";
      setTurn(nextTurn);
      if (nextTurn === "robot") {
        setMessage("Robot is thinking... 🤔");
        setMsgColor("#1B5E20");
      } else {
        setMessage(`Robot ate ${amount}. Your turn!`);
        setMsgColor("#1B5E20");
      }
    }
  };

  // AI Logic 
  useEffect(() => {
    if (turn === "robot" && status === "playing") {
      const timer = setTimeout(() => {
        // AI Strategy: Try to leave the opponent with a multiple of 3.
        let move = leaves % 3; 
        
        // If move is 0 (e.g., leaves is 12), the AI is in a losing position!
        // It is forced to play sub-optimally. We force it to take 1.
        if (move === 0) move = 1; 
        
        // Safety check
        if (move > leaves) move = leaves;
        
        processMove(move, "robot");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [turn, leaves, status]);

  const resetGame = () => {
    setLeaves(INITIAL_LEAVES);
    setTurn("human");
    setStatus("playing");
    setWinner(null);
    setMessage("New Game! Your turn.");
    setMsgColor("#1B5E20");
  };

  // --- Render ---
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      backgroundColor: "#C5E1A5", minHeight: "100vh", padding: "20px",
      fontFamily: '"Comic Sans MS", cursive, sans-serif'
    }}>
      <div style={{ width: "100%", maxWidth: "800px" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem" }}>🔙</button>
      </div>

      <div style={{
        backgroundColor: "#33691E", width: "100%", maxWidth: "800px",
        padding: "10px", borderRadius: "8px", textAlign: "center", border: "3px solid #2E7D32", marginTop: "10px",
        display: "flex", justifyContent: "space-around", color: "white"
      }}>
        {/* Display Current Streak vs Best Streak */}
        <div>
           <span style={{ fontSize: "0.9rem", color: "#AED581" }}>CURRENT STREAK</span>
           <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{currentStreak}</div>
        </div>
        <div style={{ borderLeft: "1px solid #AED581", opacity: 0.5 }}></div>
        <div>
           <span style={{ fontSize: "0.9rem", color: "#FFD54F" }}>BEST STREAK (High Score)</span>
           <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#FFEB3B" }}>{currentHighScore}</div>
        </div>
      </div>

      <h1 style={{ color: "#33691E" }}>Who will eat the last leaf?</h1>

      <div style={{ border: "3px solid #8BC34A", borderRadius: "4px", backgroundColor: "#F1F8E9", padding: "5px" }}>
        <canvas ref={canvasRef} width={700} height={350} style={{ maxWidth: "100%", height: "auto" }} />
      </div>

      <div style={{ marginTop: "20px", minHeight: "60px" }}>
        {status === "playing" ? (
          <div>
            <button 
              onClick={() => turn === "human" && leaves >= 1 && processMove(1, "human")} 
              disabled={turn !== "human" || leaves < 1}
              style={{ padding: "15px 30px", fontSize: "16px", fontWeight: "bold", backgroundColor: "#66BB6A", color: "white", border: "none", borderRadius: "5px", margin: "10px", cursor: "pointer", opacity: (turn !== "human" || leaves < 1) ? 0.5 : 1 }}
            >Eat 1 🍃</button>
            <button 
              onClick={() => turn === "human" && leaves >= 2 && processMove(2, "human")} 
              disabled={turn !== "human" || leaves < 2}
              style={{ padding: "15px 30px", fontSize: "16px", fontWeight: "bold", backgroundColor: "#388E3C", color: "white", border: "none", borderRadius: "5px", margin: "10px", cursor: "pointer", opacity: (turn !== "human" || leaves < 2) ? 0.5 : 1 }}
            >Eat 2 🌿</button>
          </div>
        ) : (
          <button onClick={resetGame} style={{ padding: "15px 40px", fontSize: "18px", fontWeight: "bold", backgroundColor: "#FFEB3B", border: "none", borderRadius: "5px", cursor: "pointer" }}>Play Again!</button>
        )}
      </div>

      <h2 style={{ color: msgColor }}>{message}</h2>
      
      <button onClick={() => { setCurrentStreak(0); }} style={{ marginTop: "auto", background: "none", border: "none", color: "#33691E", textDecoration: "underline", cursor: "pointer" }}>Reset Streak</button>
    </div>
  );
};

export default CrawlerGame;