/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";

interface PixelMathGameProps {
  gameName: string;
  currentHighScore: number;
  onClose: () => void;
  onUpdateHighScore?: (score: number) => void;
}

interface TileData {
  r: number;
  c: number;
  char: string;
  answer: number;
  equation: string;
  visualColor: string;
  isPainted: boolean;
  visualRGB: number[];
}

interface PaletteItem {
  ans: number;
  color: string;
  char: string;
  visualRGB: number[];
}

interface PatternData {
  name: string;
  data: string[];
}


const rgb = (r: number, g: number, b: number) => `rgb(${r}, ${g}, ${b})`;

const COLORS: Record<string, number[]> = {
  ".": [255, 255, 255], 
  R: [230, 50, 50],     
  G: [50, 180, 50],     
  B: [50, 100, 230],    
  Y: [255, 215, 0],     
  O: [255, 140, 0],     
  P: [147, 112, 219],   
  K: [40, 40, 40],      
  S: [135, 206, 250],   
  N: [139, 69, 19],    
  L: [50, 205, 50],    
  A: [128, 128, 128],   
};

const RAW_PATTERNS: PatternData[] = [
  {
    name: "Heart",
    data: [
      "............",
      "..RR....RR..",
      ".RRRR..RRRR.",
      "RRRRRRRRRRRR",
      "RRRRRRRRRRRR",
      ".RRRRRRRRRR.",
      "..RRRRRRRR..",
      "...RRRRRR...",
      "....RRRR....",
      ".....RR.....",
      "............",
      "............",
    ],
  },
  {
    name: "Sailboat",
    data: [
      "......K.....",
      ".....RK.....",
      "....RRK.....",
      "...RRRK..Y..",
      "..RRRRK.....",
      "KKKKKKKKKKKK",
      ".NNNNNNNNNN.",
      "..SSSSSSSS..",
      "..SSSSSSSS..",
      "..SSSSSSSS..",
      "..SSSSSSSS..",
      "............",
    ],
  },
  {
    name: "Space Invader",
    data: [
      "............",
      "...G.....G..",
      "....G...G...",
      "...GGGGGGG..",
      "..GG.GGG.GG.",
      ".GGGGGGGGGGG",
      ".G.GGGGGGG.G",
      ".G.G.....G.G",
      "....GG.GG...",
      "............",
      "............",
      "............",
    ],
  },
  {
    name: "Rubber Duck",
    data: [
      "............",
      ".....YY.....",
      "...YYYYY....",
      "..YYKYYO....",
      "..YYYYOO....",
      "...YYYYY....",
      ".YYYYYYYY...",
      "YYYYYYYYYY..",
      "YYYYYYYYYY..",
      ".SSSSSSSS...",
      "..SSSSSSSS..",
      "............",
    ],
  },
  {
    name: "Mushroom",
    data: [
      "....RRRR....",
      "..RRRRRRRR..",
      ".RR..RR..RR.",
      ".RRRRRRRRRR.",
      "..RRRRRRRR..",
      "....KKKK....",
      "...K....K...",
      "...K....K...",
      "...KKKKKK...",
      "............",
      "............",
      "............",
    ],
  },
  {
    name: "Sword",
    data: [
      "..........A.",
      ".........A..",
      "........A...",
      ".......A....",
      "......A.....",
      ".....A......",
      "....AK......",
      "...B.K......",
      "..B..K......",
      ".B...K......",
      "B....K......",
      "............",
    ],
  },
  {
    name: "Creeper Face",
    data: [
      "LLLLLLLLLLLL",
      "LLLLLLLLLLLL",
      "LLLKKLLKKLLL",
      "LLLKKLLKKLLL",
      "LLLLLLLLLLLL",
      "LLLLLKKLLLLL",
      "LLLLKKKKLLLL",
      "LLLLKKKKLLLL",
      "LLLKKLLKKLLL",
      "LLLLLLLLLLLL",
      "LLLLLLLLLLLL",
      "LLLLLLLLLLLL",
    ],
  },
  {
    name: "Butterfly",
    data: [
      "S..........S",
      "SP...K...PPS",
      "SPP..K..PPPS",
      "SSPP.K.PPPSS",
      "SSPPPKPPPSSS",
      "SSSSPKPSSSSS",
      "SSPPPKPPPSSS",
      "SSPP.K.PPPSS",
      "SPP..K..PPPS",
      "SP...K...PPS",
      "S..........S",
      "S..........S",
    ],
  },
  {
    name: "Watermelon",
    data: [
      "............",
      ".....R......",
      "...RRKRR....",
      "..RRKRKRR...",
      ".RRRRRRRRR..",
      ".RRKRKRRKR..",
      ".RRRRRRRRR..",
      "..LLLLLLL...",
      "...GGGGG....",
      "............",
      "............",
      "............",
    ],
  },
  {
    name: "Sunny House",
    data: [
      "SSSSSSSSSYYY",
      "SSSSSSSSSYYY",
      "SSSSRSSSSSSS",
      "SSSRRRSSSSSS",
      "SSRRRRRSSSSS",
      "SRRRRRRRSSSS",
      "SRRRRRRRSSSS",
      "SOOOOOOOOSSS",
      "SOBBBOBBOSSS",
      "SOBBBOBBOSSS",
      "SOOOONOOOSSS",
      "GGGGNGGGGGGG",
    ],
  },

  {
    name: "Pizza Slice",
    data: [
      "............",
      ".....NN.....",
      "....NYYN....",
      "...NYRYYN...",
      "..NYYRYYYN..",
      ".NYYYYRYYYN.",
      "NYYRYYYYYRYN",
      ".NNNNNNNNNN.",
      "............",
      "............",
      "............",
      "............",
    ],
  },
  {
    name: "Smiley Face",
    data: [
      "....YYYY....",
      "..YYYYYYYY..",
      ".YYYYYYYYYY.",
      ".YYKYYYYKYY.",
      ".YYKYYYYKYY.",
      "YYYYYYYYYYYY",
      "YYYYKYYKYYYY",
      ".YYYKYYKYYY.",
      ".YYYYKKYYYY.",
      "..YYYYYYYY..",
      "....YYYY....",
      "............",
    ],
  },
  {
    name: "Tree",
    data: [
      ".....G......",
      "....GGG.....",
      "...GGGGG....",
      "..GGGGGGG...",
      ".GGGGGGGGG..",
      "GGGGGGGGGGGG",
      "....NNN.....",
      "....NNN.....",
      "....NNN.....",
      "GGGGNNNGGGGG",
      "GGGGGGGGGGGG",
      "GGGGGGGGGGGG",
    ],
  },
  {
    name: "Clown Fish",
    data: [
      "............",
      "............",
      "......OO....",
      "...OOOWOO...",
      "..OOWOOOWO..",
      ".KOWOOOWOOK.",
      ".KOWOOOWOOK.",
      "..OOWOOOWO..",
      "...OOOWOO...",
      "......OO....",
      "............",
      "............",
    ],
  },
  {
    name: "Crewmate",
    data: [
      "............",
      "...RRRR.....",
      "..RRRRRR....",
      ".RRSSSRR....",
      ".RRSSSRR....",
      ".RRRRRRR....",
      ".RRRRRRR....",
      ".RRRRRRR.R..",
      ".RRRRRRRRR..",
      ".RR...RR....",
      ".RR...RR....",
      "............",
    ],
  },
];


const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateMathProblem = (target: number): string => {
  const op = Math.random() > 0.5 ? "+" : "-";
  if (op === "+") {
    const a = target > 1 ? getRandomInt(1, target - 1) : 0;
    const b = target - a;
    return `${a} + ${b}`;
  } else {
    const b = getRandomInt(1, 10);
    const a = target + b;
    return `${a} - ${b}`;
  }
};

const parseGridData = (patternData: string[]) => {
  const grid: string[][] = [];
  const usedColors = new Set<string>();

  patternData.forEach((rowStr) => {
    const rowColors: string[] = [];
    for (const char of rowStr) {
      const colorKey = COLORS[char] ? char : ".";
      rowColors.push(colorKey);
      usedColors.add(colorKey);
    }
    grid.push(rowColors);
  });

  return { grid, usedChars: Array.from(usedColors) };
};

const createPalette = (usedChars: string[]) => {
  const pool = Array.from({ length: 50 }, (_, i) => i + 1).sort(
    () => Math.random() - 0.5
  );

  const charToAnswers: Record<string, number[]> = {};
  const paletteList: PaletteItem[] = [];
  let poolIdx = 0;

  usedChars.forEach((char) => {
    const ans = pool[poolIdx++];
    charToAnswers[char] = [ans];
    const colorRGB = COLORS[char];
    paletteList.push({
      ans,
      char,
      visualRGB: colorRGB,
      color: rgb(colorRGB[0], colorRGB[1], colorRGB[2]),
    });

    if (Math.random() > 0.6) {
      const ans2 = pool[poolIdx++];
      charToAnswers[char].push(ans2);
      paletteList.push({
        ans: ans2,
        char,
        visualRGB: colorRGB,
        color: rgb(colorRGB[0], colorRGB[1], colorRGB[2]),
      });
    }
  });

  paletteList.sort((a, b) => a.ans - b.ans);
  return { paletteList, charToAnswers };
};


export default function PixelMathGame({
  currentHighScore,
  onClose,
  onUpdateHighScore,
}: PixelMathGameProps) {
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [palette, setPalette] = useState<PaletteItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(currentHighScore);
  const [message, setMessage] = useState("Select a number -> Click the math!");
  const [msgColor, setMsgColor] = useState("black");
  const [gameOver, setGameOver] = useState(false);
  const [patternName, setPatternName] = useState("");

  const startNewGame = useCallback(() => {
    setScore(0);
    setGameOver(false);
    setSelectedIdx(null);
    setMessage("Select a number -> Click the math!");
    setMsgColor("black");

    const pattern =
      RAW_PATTERNS[Math.floor(Math.random() * RAW_PATTERNS.length)];
    setPatternName(pattern.name);

    const { grid, usedChars } = parseGridData(pattern.data);
    const { paletteList, charToAnswers } = createPalette(usedChars);

    setPalette(paletteList);

    const newTiles: TileData[] = [];
    const rows = 12;
    const cols = 12;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const char = grid[r][c];
        const validNums = charToAnswers[char];
        const chosenAns =
          validNums[Math.floor(Math.random() * validNums.length)];
        const equation = generateMathProblem(chosenAns);
        const visualRGB = COLORS[char];

        newTiles.push({
          r,
          c,
          char,
          answer: chosenAns,
          equation,
          visualRGB: visualRGB,
          visualColor: rgb(visualRGB[0], visualRGB[1], visualRGB[2]),
          isPainted: false,
        });
      }
    }
    setTiles(newTiles);
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleTileClick = (tileIndex: number) => {
    if (gameOver || selectedIdx === null) return;

    const selectedBtn = palette[selectedIdx];
    const tile = tiles[tileIndex];

    if (tile.isPainted) return;

    if (tile.answer === selectedBtn.ans) {
      const updatedTiles = [...tiles];
      updatedTiles[tileIndex] = { ...tile, isPainted: true };
      setTiles(updatedTiles);

      const newScore = score + 10;
      setScore(newScore);

      if (newScore > highScore) {
        setHighScore(newScore);
        if (onUpdateHighScore) onUpdateHighScore(newScore);
      }

      if (updatedTiles.every((t) => t.isPainted)) {
        setGameOver(true);
        setMessage(`${patternName} Complete!`);
        setMsgColor("rgb(0, 150, 0)");
      } else {
        setMessage("Correct!");
        setMsgColor("rgb(0, 100, 0)");
      }
    } else {
      setScore((prev) => Math.max(0, prev - 5));
      setMessage("Try Again!");
      setMsgColor("rgb(200, 0, 0)");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "rgb(230, 240, 255)",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "30px",
          maxWidth: "1100px",
          width: "100%",
        }}
      >
        { }
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(12, 1fr)`,
              gap: "2px",
              backgroundColor: "rgb(255, 255, 255)",
              padding: "10px",
              border: "2px solid rgb(50, 50, 50)",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              aspectRatio: "1/1",
            }}
          >
            {tiles.map((tile, i) => {
              const darkerBorder = `rgb(${Math.max(
                0,
                tile.visualRGB[0] - 30
              )}, ${Math.max(0, tile.visualRGB[1] - 30)}, ${Math.max(
                0,
                tile.visualRGB[2] - 30
              )})`;

              return (
                <div
                  key={i}
                  onClick={() => handleTileClick(i)}
                  style={{
                    backgroundColor: tile.isPainted
                      ? tile.visualColor
                      : "rgb(250, 250, 245)",
                    border: tile.isPainted
                      ? `1px solid ${darkerBorder}`
                      : "1px solid rgb(180, 180, 180)",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: tile.isPainted ? "default" : "pointer",
                    fontSize: "0.85rem",
                    fontWeight: "bold",
                    color: tile.isPainted ? "transparent" : "rgb(50, 50, 50)",
                    userSelect: "none",
                    transition: "background-color 0.2s",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!tile.isPainted) {
                      e.currentTarget.style.backgroundColor =
                        "rgb(240, 248, 255)";
                      e.currentTarget.style.borderColor = "rgb(100, 149, 237)";
                      e.currentTarget.style.borderWidth = "2px";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!tile.isPainted) {
                      e.currentTarget.style.backgroundColor =
                        "rgb(250, 250, 245)";
                      e.currentTarget.style.borderColor = "rgb(180, 180, 180)";
                      e.currentTarget.style.borderWidth = "1px";
                    }
                  }}
                >
                  {!tile.isPainted && tile.equation}
                </div>
              );
            })}
          </div>
        </div>

        { }
        <div
          style={{
            width: "300px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          { }
          <div>
            <h2 style={{ margin: 0, color: "rgb(50,50,50)" }}>Palette</h2>
            <p style={{ margin: "5px 0", fontSize: "0.9rem", color: "#666" }}>
              1. Click a colored number.
              <br />
              2. Solve grid math to find it.
            </p>
          </div>

          { }
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "15px",
              maxHeight: "500px",
              overflowY: "auto",
              paddingRight: "5px",
            }}
          >
            {palette.map((p, i) => {
              const isSelected = selectedIdx === i;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  style={{
                    backgroundColor: p.color,
                    border: isSelected
                      ? "3px solid rgb(50, 50, 50)"
                      : "1px solid rgb(150, 150, 150)",
                    borderRadius: "8px",
                    height: "50px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    position: "relative",
                    boxShadow: "2px 2px 0px rgb(200, 200, 200)",
                    outline: "none",
                    transform: isSelected ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  { }
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "white",
                      border: "1px solid rgb(50, 50, 50)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      color: "rgb(50, 50, 50)",
                    }}
                  >
                    {p.ans}
                  </div>
                  { }
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-5px",
                        right: "-5px",
                        width: "16px",
                        height: "16px",
                        backgroundColor: "white",
                        border: "1px solid black",
                        borderRadius: "50%",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          { }
          <div
            style={{
              marginTop: "auto",
              backgroundColor: "white",
              padding: "15px",
              borderRadius: "10px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "5px",
              }}
            >
              <span style={{ color: "rgb(218, 165, 32)", fontWeight: "bold" }}>
                High Score:
              </span>
              <span style={{ color: "rgb(218, 165, 32)", fontWeight: "bold" }}>
                {highScore}
              </span>
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "rgb(50, 50, 50)",
              }}
            >
              Score: {score}
            </div>
          </div>

          { }
          <div
            style={{
              fontSize: "1.2rem",
              fontWeight: "bold",
              color: msgColor,
              textAlign: "center",
              minHeight: "30px",
            }}
          >
            {message}
          </div>

          { }
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <button
              onClick={startNewGame}
              style={{
                padding: "12px",
                backgroundColor: gameOver
                  ? "rgb(50, 200, 50)"
                  : "rgb(50, 150, 255)",
                color: "white",
                border: "2px solid rgb(50, 50, 50)",
                borderRadius: "10px",
                fontSize: "1rem",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              New Image
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "10px",
                backgroundColor: "rgb(200, 200, 200)",
                color: "rgb(50, 50, 50)",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Back to Hub
            </button>
          </div>
        </div>
      </div>

      { }
      {gameOver && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ position: "relative" }}>
            <h1
              style={{
                fontSize: "5rem",
                color: "rgb(200, 200, 200)",
                margin: 0,
                position: "absolute",
                top: "4px",
                left: "4px",
              }}
            >
              AWESOME!
            </h1>
            <h1
              style={{
                fontSize: "5rem",
                color: "rgb(50, 50, 50)",
                margin: 0,
                position: "relative",
              }}
            >
              AWESOME!
            </h1>
          </div>
        </div>
      )}
    </div>
  );
}