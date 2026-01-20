/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prefer-const */
import React, { useState, useEffect, useRef } from "react";

// --- Types ---
interface BlackjackProps {
  gameName: string;
  currentHighScore: number;
  onClose: () => void;
  onUpdateHighScore: (score: number) => void;
}

type Difficulty = "Easy" | "Hard";
type GameState = "betting" | "playing" | "gameover";

// --- Constants (Matching Python Colors) ---
const COLORS = {
  felt: "#35654d",
  felt_dark: "#2a503d",
  text_gold: "#ffd700",
  text_white: "#ffffff",
  wood: "#5c3a21",
  chip_red: "#d32f2f",
  chip_blue: "#1976d2",
  chip_black: "#212121",
  action_log: "#1e3b2e",
};

export default function BlackjackGame({
  currentHighScore,
  onClose,
  onUpdateHighScore,
}: BlackjackProps) {
  // --- State ---
  const [wallet, setWallet] = useState(500);
  const [currentBet, setCurrentBet] = useState(0);
  const [streak, setStreak] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("Hard");
  
  const [currentTotal, setCurrentTotal] = useState(0);
  const [gameState, setGameState] = useState<GameState>("betting");
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [logs, setLogs] = useState<string[]>(["Welcome to the High Stakes Table..."]);
  
  const logBoxRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  
  // Auto-scroll logs
  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [logs]);

  // AI Turn Handler
  useEffect(() => {
    if (gameState === "playing" && !isPlayerTurn) {
      const timer = setTimeout(() => {
        handleAiMove();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, gameState]);

  // --- Helpers ---

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `> ${msg}`]);
  };

  const checkWinner = (newTotal: number, player: "Human" | "Dealer") => {
    if (newTotal === 21) {
      if (player === "Human") {
        let multiplier = 2;
        if (streak >= 2) multiplier = 2.5;
        
        const winnings = Math.floor(currentBet * multiplier);
        const newWallet = wallet + winnings;
        
        setWallet(newWallet);
        const newStreak = streak + 1;
        setStreak(newStreak);

        addLog(`BLACKJACK! You reached 21.`);
        addLog(`You won $${winnings}. Streak: ${newStreak}`);
        
        if (newWallet > currentHighScore) {
          onUpdateHighScore(newWallet);
          addLog("NEW HIGH SCORE!");
        }
      } else {
        setStreak(0);
        addLog("Dealer reached 21. You lose.");
        addLog("Dealer won. Streak reset.");
      }
      setGameState("gameover");
      return true;
    }
    return false;
  };

  // --- Game Logic (Race to 21) ---

  const getPossibleMoves = (total: number) => {
    const remaining = 21 - total;
    const limit = Math.min(3, remaining);
    return Array.from({ length: limit }, (_, i) => i + 1);
  };

  const handleHumanMove = (value: number) => {
    if (!isPlayerTurn || gameState !== "playing") return;

    const newTotal = currentTotal + value;
    setCurrentTotal(newTotal);
    addLog(`You played ${value}. Count is ${newTotal}.`);

    if (!checkWinner(newTotal, "Human")) {
      setIsPlayerTurn(false);
    }
  };

  const handleAiMove = () => {
    const possible = getPossibleMoves(currentTotal);
    let move = 1;

    if (difficulty === "Easy" && Math.random() < 0.4) {
      // Random move
      addLog("Dealer looks distracted...");
      move = possible[Math.floor(Math.random() * possible.length)];
    } else {
      // Optimal Strategy for Race to 21 (Nim)
      // Winning positions are 1, 5, 9, 13, 17, 21 (Target 21, mod 4)
      // We want to land on a number X where (X - 1) % 4 == 0
      
      let foundWinningMove = false;
      
      // Try to find a move that lands us on a winning number
      for (let m of possible) {
        if ((currentTotal + m - 1) % 4 === 0) {
          move = m;
          foundWinningMove = true;
          break;
        }
      }

      // If no winning move exists (we are in a losing position), play randomly/conservatively
      if (!foundWinningMove) {
        move = possible[Math.floor(Math.random() * possible.length)];
      }
    }

    const newTotal = currentTotal + move;
    setCurrentTotal(newTotal);
    addLog(`Dealer played ${move}.`);

    if (!checkWinner(newTotal, "Dealer")) {
      setIsPlayerTurn(true);
    }
  };

  // --- Betting System ---

  const placeBet = (amount: number) => {
    if (wallet < amount) {
      alert("Insufficient funds!");
      return;
    }
    setWallet((prev) => prev - amount);
    setCurrentBet(amount);
    startNewHand(amount);
  };

  const goAllIn = () => {
    if (wallet <= 0) return;
    const amount = wallet;
    setWallet(0);
    setCurrentBet(amount);
    addLog("PLAYER GOES ALL IN!");
    startNewHand(amount);
  };

  const startNewHand = (bet: number) => {
    setGameState("playing");
    setCurrentTotal(0);
    setIsPlayerTurn(true);
    addLog("--- NEW HAND ---");
    addLog(`Bet placed: $${bet}`);
  };

  const takeLoan = () => {
    if (wallet < 100) {
      setWallet((prev) => prev + 500);
      addLog("System: Bank Loan approved (+$500)");
    } else {
      alert("Loan Denied: You have enough funds!");
    }
  };

  const resetGame = () => {
    setGameState("betting");
    setCurrentBet(0);
    setCurrentTotal(0);
  };

  // --- Render ---

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.felt,
        color: COLORS.text_white,
        fontFamily: "'Courier New', Courier, monospace",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Top Menu Bar */}
      <div
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "#222",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        <div>
          <button onClick={onClose} style={menuBtnStyle}>
            Exit
          </button>
          <button onClick={() => setDifficulty("Easy")} style={menuBtnStyle}>
            Rookie
          </button>
          <button onClick={() => setDifficulty("Hard")} style={menuBtnStyle}>
            Pro
          </button>
          <button onClick={takeLoan} style={menuBtnStyle}>
            Loan ($500)
          </button>
        </div>
        <div style={{ color: "#aaa", fontSize: "0.8rem" }}>
          Difficulty: <span style={{ color: COLORS.text_gold }}>{difficulty}</span>
        </div>
      </div>

      {/* Stats Bar */}
      <div
        style={{
          width: "100%",
          backgroundColor: COLORS.wood,
          padding: "10px 0",
          display: "flex",
          justifyContent: "space-around",
          borderBottom: "3px ridge #444",
          borderTop: "3px ridge #444",
        }}
      >
        <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#2ecc71" }}>
          BANK: ${wallet}
        </div>
        <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: COLORS.text_gold }}>
          BEST: ${Math.max(wallet, currentHighScore)}
        </div>
      </div>

      {/* Title */}
      <h1
        style={{
          fontFamily: "'Times New Roman', serif",
          fontSize: "2.5rem",
          color: COLORS.text_gold,
          textShadow: "2px 2px 4px #000",
          margin: "15px 0 5px 0",
        }}
      >
        BLACK JACK
      </h1>

      {/* Log Box */}
      <div
        ref={logBoxRef}
        style={{
          width: "90%",
          maxWidth: "500px",
          height: "80px",
          backgroundColor: COLORS.action_log,
          color: "#cfcfcf",
          fontFamily: "Consolas, monospace",
          fontSize: "0.9rem",
          overflowY: "auto",
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #444",
          marginBottom: "10px",
        }}
      >
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>

      {/* The Table */}
      <div
        style={{
          flex: 1,
          width: "90%",
          maxWidth: "500px",
          backgroundColor: COLORS.felt_dark,
          borderRadius: "20px",
          border: "5px solid #222",
          boxShadow: "inset 0 0 20px #000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          marginBottom: "20px",
          position: "relative",
        }}
      >
        <div style={{ color: "#aaa", fontSize: "0.9rem", fontWeight: "bold", marginBottom: "10px" }}>
          CURRENT COUNT
        </div>
        <div
          style={{
            fontSize: "6rem",
            fontWeight: "bold",
            color: gameState === "gameover" ? (isPlayerTurn ? "#ff4444" : "#00ff00") : "white",
            textShadow: "0 4px 6px rgba(0,0,0,0.5)",
          }}
        >
          {currentTotal}
        </div>
        <div style={{ color: COLORS.text_gold, fontSize: "1.2rem", fontWeight: "bold", marginTop: "10px" }}>
          BET: ${currentBet}
        </div>
      </div>

      {/* Status Text */}
      <div style={{ marginBottom: "15px", fontStyle: "italic", fontSize: "1.1rem" }}>
        {gameState === "betting"
          ? `Streak: ${streak} 🔥 | Place bet to deal.`
          : isPlayerTurn
          ? "Your turn!"
          : "Dealer is thinking..."}
      </div>

      {/* Controls */}
      <div
        style={{
          width: "100%",
          backgroundColor: COLORS.felt,
          padding: "20px 0",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {gameState === "betting" || gameState === "gameover" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: "10px", color: "#ddd", fontWeight: "bold" }}>
              {gameState === "gameover" ? "PLAY AGAIN?" : "PLACE YOUR WAGER"}
            </div>
            
            {gameState === "gameover" ? (
               <button onClick={resetGame} style={chipBtnStyle(COLORS.text_gold, 150)}>
                 NEW HAND
               </button>
            ) : (
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                <button onClick={() => placeBet(10)} style={chipBtnStyle(COLORS.chip_blue)}>
                  $10
                </button>
                <button onClick={() => placeBet(50)} style={chipBtnStyle(COLORS.chip_red)}>
                  $50
                </button>
                <button onClick={() => placeBet(100)} style={chipBtnStyle(COLORS.chip_black)}>
                  $100
                </button>
                <button onClick={goAllIn} style={chipBtnStyle("#d4ac0d")}>
                  ALL IN!
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: "10px", color: "#ddd", fontWeight: "bold" }}>ADD TO COUNT:</div>
            <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
              {getPossibleMoves(currentTotal).map((val) => (
                <button
                  key={val}
                  onClick={() => handleHumanMove(val)}
                  disabled={!isPlayerTurn}
                  style={cardBtnStyle}
                >
                  <div style={{ fontSize: "1.2rem" }}>{val === 1 ? "A" : val}</div>
                  <div style={{ fontSize: "1.5rem" }}>♠</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Styles ---

const menuBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #555",
  color: "#ccc",
  padding: "5px 10px",
  marginRight: "5px",
  cursor: "pointer",
  fontSize: "0.8rem",
};

const chipBtnStyle = (color: string, width = 80): React.CSSProperties => ({
  backgroundColor: color,
  color: "white",
  border: "2px solid rgba(255,255,255,0.3)",
  borderRadius: "50%",
  width: `${width}px`,
  height: `${width}px`,
  fontSize: "1rem",
  fontWeight: "bold",
  cursor: "pointer",
  boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const cardBtnStyle: React.CSSProperties = {
  backgroundColor: "white",
  color: "black",
  border: "1px solid #ccc",
  borderRadius: "4px",
  width: "60px",
  height: "80px",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "2px 2px 5px rgba(0,0,0,0.2)",
  fontFamily: "'Times New Roman', serif",
  fontWeight: "bold",
};