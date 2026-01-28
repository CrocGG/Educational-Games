import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { API_URL } from "../services/api";
import type { Game } from "../models/types";
import SnakeGame from "../games/SnakeGame";
import PixelMathGame from "../games/Pencil";
import BalloonGame from "../games/Balloon";
import CaterpillarGame from "../games/Caterpillar";
import CrawlerGame from "../games/Crawler";
import BlackjackGame from "../games/Blackjack";
import MoleGame from "../games/Mole";
import KangarooGame from "../games/Kangaroo";

export default function GamesHub() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Get the gameName from the URL (if it exists)
  const { gameName } = useParams();
  const navigate = useNavigate();

  // 2. Derive the active game from the URL param instead of local state
  // If gameName is undefined, activeGame is null (showing the list)
  const activeGame = games.find(g => g.name === gameName) || null;

  useEffect(() => {
    api
      .get("/games/")
      .then((res) => {
        setGames(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  const getImageUrl = (imagePath?: string | null) => {
    if (!imagePath) return "https://via.placeholder.com/300x200?text=No+Image";
    if (imagePath.startsWith("http")) return imagePath;
    const cleanBase = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${cleanBase}${cleanPath}`;
  };

  const handleSubmitScore = async (gameName: string, score: number) => {
    try {
      await api.post("/submit-score/", {
        game_name: gameName,
        score: score,
      });

      setGames((prevGames) =>
        prevGames.map((g) => {
          if (g.name === gameName && (g.high_score || 0) < score) {
            return { ...g, high_score: score };
          }
          return g;
        })
      );
    } catch (error) {
      console.error("Error submitting score:", error);
    }
  };

  const handleCloseGame = () => {
    navigate('/games');
  };

  const cardStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "12px",
    border: "1px solid #e0e0e0",
    cursor: "pointer",
    width: "100%",
    boxSizing: "border-box",
    textAlign: "center",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    transition: "all 0.2s ease-in-out",
  };

  const imageStyle: React.CSSProperties = {
    width: "100%",
    height: "auto",
    maxHeight: "200px",
    objectFit: "contain",
    borderRadius: "12px",
    marginBottom: "12px",
    backgroundColor: "#f0f0f0",
  };

  const titleStyle: React.CSSProperties = {
    margin: "0 0 10px 0",
    fontSize: "1.25rem",
    fontWeight: "bold",
    color: "#1a1a1a",
  };

  const scoreBadgeStyle: React.CSSProperties = {
    width: "fit-content",
    backgroundColor: "#fdf2f2",
    color: "#c53030",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "700",
    border: "1px solid #feb2b2",
  };

  if (loading)
    return (
      <div className="container">
        <h1>Loading Games...</h1>
      </div>
    );

  // 4. Render the Active Game based on the URL match
  if (activeGame) {
    if (activeGame.name === "Snaky-Snake") {
      return (
        <SnakeGame
          gameName={activeGame.name}
          currentHighScore={activeGame.high_score ?? 0}
          onClose={handleCloseGame}
        />
      );
    }

    if (activeGame.name === "Pencil-Game") {
      return (
        <PixelMathGame
          gameName={activeGame.name}
          currentHighScore={activeGame.high_score ?? 0}
          onClose={handleCloseGame}
          onUpdateHighScore={(newScore) =>
            handleSubmitScore(activeGame.name, newScore)
          }
        />
      );
    }

    if (activeGame.name === "Beautiful-Balloon") {
      return (
        <BalloonGame
          gameName={activeGame.name}
          currentHighScore={activeGame.high_score ?? 0}
          onClose={handleCloseGame}
          onUpdateHighScore={(newScore: number) =>
            handleSubmitScore(activeGame.name, newScore)
          }
        />
      );
    }

    if (activeGame.name === "Caterpillar") {
      return (
        <CaterpillarGame
          gameName={activeGame.name}
          currentHighScore={activeGame.high_score ?? 0}
          onClose={handleCloseGame}
          onUpdateHighScore={(newScore: number) =>
            handleSubmitScore(activeGame.name, newScore)
          }
        />
      );
    }

    if (activeGame.name === "Crawler") {
      return (
        <CrawlerGame
          gameName={activeGame.name}
          currentHighScore={activeGame.high_score ?? 0}
          onClose={handleCloseGame}
          onUpdateHighScore={(newScore: number) =>
            handleSubmitScore(activeGame.name, newScore)
          }
        />
      );
    }

    if (activeGame.name === "Black-Jack") {
      return (
        <BlackjackGame
          gameName={activeGame.name}
          currentHighScore={activeGame.high_score ?? 0}
          onClose={handleCloseGame}
          onUpdateHighScore={(newScore: number) =>
            handleSubmitScore(activeGame.name, newScore)
          }
        />
      );
    }

    if (activeGame.name === "Whack-A-Mole") {
      return (
        <MoleGame
          gameName={activeGame.name}
          currentHighScore={activeGame.high_score ?? 0}
          onClose={handleCloseGame}
          onUpdateHighScore={(newScore: number) =>
            handleSubmitScore(activeGame.name, newScore)
          }
        />
      );
    }

    if (activeGame.name === "Kan-Ga-Roo") { 
      return (
        <KangarooGame
          gameName={activeGame.name}
          currentHighScore={activeGame.high_score ?? 0}
          onClose={handleCloseGame}
          onUpdateHighScore={(newScore: number) =>
            handleSubmitScore(activeGame.name, newScore)
          }
        />
      );
    }

    return (
      <div className="container">
        <h2>Game Component Not Found for {activeGame.name}</h2>
        <button onClick={handleCloseGame}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        Golan's Educational Game Hub
      </h1>
      <div
        className="game-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "25px",
        }}
      >
        {games.length === 0 ? (
          <p>No games available at the moment.</p>
        ) : (
          games.map((game) => (
            <div key={game.id} className="game-card-wrapper">
              <button
                style={cardStyle}
                // 5. Update click to navigate to the game URL
                onClick={() => navigate(`/games/${game.name}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 10px 15px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
                }}
              >
                <img
                  src={getImageUrl(game.image)}
                  alt={game.name}
                  style={imageStyle}
                />

                <h3 style={titleStyle}>{game.name}</h3>

                <div style={{ minHeight: "50px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  {(game.high_score ?? 0) > 0 ? (
                    <div style={scoreBadgeStyle}>
                      🏆 High: {game.high_score}
                      {game.high_score_player_username && (
                        <span style={{ fontSize: "0.7rem", display: "block", fontWeight: "400" }}>
                          by {game.high_score_player_username}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.85rem", color: "#718096" }}>No high score yet</span>
                  )}
                </div>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}