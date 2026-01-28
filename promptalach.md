kangaroo.py

import tkinter as tk
from tkinter import messagebox
import csv
import math
import time
import random
import os
import platform

# ==========================================
# IMAGE LIBRARY IMPORT (SAFE MODE)
# ==========================================
# We try to import PIL (Pillow) to handle image flipping.
# If the user doesn't have it installed, we fall back to standard Tkinter (no flip).
HAS_PIL = False
try:
    from PIL import Image, ImageTk, ImageOps
    HAS_PIL = True
except ImportError:
    print("NOTE: Install 'pillow' library to enable image flipping! (pip install pillow)")

def fix_rtl(text):
    if not text: return ""
    # Adds the RTL mark to every line to force punctuation to the left (the end)
    return "\n".join([str(line) + "\u200f" for line in text.split("\n")])

# ==========================================
# CONFIGURATION
# ==========================================
WIDTH = 800
HEIGHT = 600
GRAVITY = 0.8
JUMP_STRENGTH = -16
SPEED = 8
FRAME_RATE = 16
HIGH_SCORE_FILE = "highscore.txt"

# ==========================================
# SOUND MANAGER
# ==========================================
system_platform = platform.system()

def play_sound(sound_type):
    try:
        if system_platform == "Windows":
            import winsound
            if sound_type == 'jump':
                winsound.Beep(400, 100)
            elif sound_type == 'splash':
                winsound.Beep(150, 300)
            elif sound_type == 'wrong':
                winsound.Beep(100, 400)
            elif sound_type == 'win':
                winsound.Beep(600, 100)
                time.sleep(0.1)
                winsound.Beep(800, 200)
            elif sound_type == 'point':
                winsound.Beep(1000, 100)
        else:
            pass 
    except Exception:
        pass

# ==========================================
# CSV PARSER
# ==========================================
def load_questions():
    questions = []
    try:
        with open('questions.csv', 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader) 
            for row in reader:
                if len(row) >= 5:
                    questions.append({
                        "text": row[1],
                        "blue": row[2],
                        "red": row[3],
                        "correct": row[4].strip()
                    })
    except FileNotFoundError:
        print("CSV not found, using default backup questions.")
        questions = [
            {"text": "מהו צבע השמש?", "blue": "צהוב", "red": "סגול", "correct": "Blue"},
            {"text": "חצי מ-30?", "blue": "15", "red": "20", "correct": "Blue"},
            {"text": "מה צפוני יותר?", "blue": "צפת", "red": "אילת", "correct": "Blue"},
        ]
    return questions

# ==========================================
# GAME CLASSES
# ==========================================

class Particle:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.dx = (random.random() - 0.5) * 8
        self.dy = random.random() * -10 - 5
        self.radius = random.random() * 4 + 2
        self.life = 1.0
        self.decay = random.random() * 0.02 + 0.01

    def update(self):
        self.x += self.dx
        self.dy += 0.4
        self.y += self.dy
        self.life -= self.decay

class Platform:
    def __init__(self, x, y, width, p_type, q_index, label=""):
        self.x = x
        self.y = y
        self.width = width
        self.height = 30
        self.type = p_type
        self.q_index = q_index
        self.label = label
        self.visible = True

class KangarooGame:
    def __init__(self, root):
        self.root = root
        self.root.title("קנגורו - מאת גולן גלנט")
        self.root.resizable(False, False)
        
        # --- Layout Setup ---
        self.main_frame = tk.Frame(root, bg="#2c3e50")
        self.main_frame.pack(fill=tk.BOTH, expand=True)

        # Sideboard
        self.sideboard = tk.Frame(self.main_frame, width=250, bg="#333", bd=4, relief="solid")
        self.sideboard.pack(side=tk.RIGHT, fill=tk.Y)
        self.sideboard.pack_propagate(False)

        # Sideboard Elements
        tk.Label(self.sideboard, text="קנגורו - מאת גולן גלנט", font=("Arial", 16, "bold"), 
                 bg="#333", fg="#ffd700", wraplength=230).pack(pady=20)
        
        self.high_score_label = tk.Label(self.sideboard, text="שיא: 0", font=("Arial", 14, "bold"), 
                                         bg="#333", fg="#00FF00")
        self.high_score_label.pack(pady=5)

        self.score_label = tk.Label(self.sideboard, text="ניקוד: 0", font=("Arial", 14), 
                                    bg="#333", fg="white")
        self.score_label.pack(pady=10)

        self.q_box = tk.Label(self.sideboard, text="טוען...", font=("Arial", 12), 
                              bg="#444", fg="white", width=25, height=8, wraplength=200, relief="sunken")
        self.q_box.pack(pady=20, padx=10)

        instr_text = "קפצו על אדום או כחול!\n\nמקשים:\nחצים לתזוזה\nרווח לקפיצה"
        instructions = tk.Label(self.sideboard, text=fix_rtl(instr_text), 
                                font=("Arial", 12), bg="#333", fg="white", 
                                justify=tk.RIGHT)
        instructions.pack(side=tk.BOTTOM, pady=20)

        # Canvas
        self.canvas = tk.Canvas(self.main_frame, width=WIDTH, height=HEIGHT, bg="#87CEEB")
        self.canvas.pack(side=tk.LEFT)

        # --- Assets Loading (With Flip Logic) ---
        self.kangaroo_right = None
        self.kangaroo_left = None

        if os.path.exists("kangaroo.png"):
            if HAS_PIL:
                # 1. Use Pillow to load and flip programmatically
                try:
                    pil_image = Image.open("kangaroo.png")
                    # Create Right Facing
                    self.kangaroo_right = ImageTk.PhotoImage(pil_image)
                    # Create Left Facing (Mirror)
                    self.kangaroo_left = ImageTk.PhotoImage(pil_image.transpose(Image.FLIP_LEFT_RIGHT))
                except Exception as e:
                    print(f"Error processing image with PIL: {e}")
            else:
                # 2. Fallback to standard Tkinter (No Flip)
                try:
                    img = tk.PhotoImage(file="kangaroo.png")
                    self.kangaroo_right = img
                    self.kangaroo_left = img # Both point to the same image
                except Exception as e:
                    print(f"Error loading image: {e}")

        # --- Game State ---
        self.questions = load_questions()
        self.platforms = []
        self.particles = []
        
        self.player = {
            "x": 50, "y": 470, "w": 60, "h": 60, 
            "dx": 0, "dy": 0, 
            "grounded": False, "facing_right": True, 
            "sinking": False, "can_move": True
        }
        
        self.score = 0
        self.answered_questions = set()
        self.high_score = self.load_high_score()

        self.camera_x = 0
        self.game_started = False
        self.current_q_index = 0
        self.game_over = False
        self.won = False
        
        # --- Input Handling ---
        self.keys = {"left": False, "right": False, "up": False}
        self.root.bind("<KeyPress>", self.key_down)
        self.root.bind("<KeyRelease>", self.key_up)

        # --- Start ---
        self.init_level()
        self.update_ui()
        self.animate()

    def load_high_score(self):
        if os.path.exists(HIGH_SCORE_FILE):
            try:
                with open(HIGH_SCORE_FILE, "r") as f:
                    return int(f.read().strip())
            except:
                return 0
        return 0

    def save_high_score(self):
        if self.score > self.high_score:
            self.high_score = self.score
            try:
                with open(HIGH_SCORE_FILE, "w") as f:
                    f.write(str(self.high_score))
            except Exception as e:
                print(f"Could not save score: {e}")

    def init_level(self):
        self.platforms = []
        cx = 0
        
        self.platforms.append(Platform(cx, 530, 300, 'start', -1))
        cx += 400

        for i, q in enumerate(self.questions):
            self.platforms.append(Platform(cx, 400, 120, 'green', i))
            cx += 180
            self.platforms.append(Platform(cx, 280, 150, 'Blue', i, q['blue']))
            self.platforms.append(Platform(cx, 480, 150, 'Red', i, q['red']))
            cx += 280

        self.platforms.append(Platform(cx, 500, 800, 'end', 99))

    def key_down(self, e):
        if e.keysym == 'Right': self.keys['right'] = True
        elif e.keysym == 'Left': self.keys['left'] = True
        elif e.keysym == 'space' or e.keysym == 'Up': self.keys['up'] = True

    def key_up(self, e):
        if e.keysym == 'Right': self.keys['right'] = False
        elif e.keysym == 'Left': self.keys['left'] = False
        elif e.keysym == 'space' or e.keysym == 'Up': self.keys['up'] = False

    def update_physics(self):
        p = self.player
        if p['sinking']: return

        if p['can_move']:
            if self.keys['right']:
                p['dx'] = SPEED
                p['facing_right'] = True # Update facing direction
            elif self.keys['left']:
                p['dx'] = -SPEED
                p['facing_right'] = False # Update facing direction
            else:
                p['dx'] = 0
        else:
            p['dx'] = 0

        if p['can_move'] and self.keys['up'] and p['grounded']:
            p['dy'] = JUMP_STRENGTH
            p['grounded'] = False
            play_sound('jump')

        p['dy'] += GRAVITY
        p['x'] += p['dx']
        p['y'] += p['dy']

        if p['x'] > 250:
            self.camera_x = p['x'] - 250

        if p['y'] > 580 and not p['sinking']:
            p['sinking'] = True
            play_sound('splash')
            self.create_splash(p['x'] + p['w']/2, 590)
            self.root.after(1000, lambda: self.trigger_game_over("צנחת לאגם! נסה שנית, רק הפעם תביא שנורקל!"))

    def check_collisions(self):
        p = self.player
        if p['sinking']: return
        
        p['grounded'] = False
        
        for plat in self.platforms:
            if not plat.visible: continue
            
            if (p['x'] < plat.x + plat.width and
                p['x'] + p['w'] > plat.x and
                p['y'] + p['h'] >= plat.y and
                p['y'] + p['h'] <= plat.y + plat.height + 15 and
                p['dy'] >= 0):

                if self.is_trap(plat):
                    for other in self.platforms:
                        if other.q_index == plat.q_index:
                            other.visible = False
                    
                    p['can_move'] = False
                    play_sound('wrong')
                else:
                    p['grounded'] = True
                    p['dy'] = 0
                    p['y'] = plat.y - p['h']
                    self.handle_safe_landing(plat)

    def is_trap(self, plat):
        if plat.type in ['start', 'end', 'green']: return False
        current_q = self.questions[plat.q_index]
        return plat.type != current_q['correct']

    def handle_safe_landing(self, plat):
        if plat.type == 'end':
            self.trigger_win()
            return
        
        if plat.type == 'green':
            self.game_started = True
            self.current_q_index = plat.q_index
            self.update_ui()
            return

        if plat.type in ['Blue', 'Red']:
            if plat.q_index not in self.answered_questions:
                self.score += 1
                self.answered_questions.add(plat.q_index)
                play_sound('point')
                self.update_ui()

        for other in self.platforms:
            if (other.q_index == plat.q_index and 
                other != plat and 
                (other.type == 'Red' or other.type == 'Blue')):
                other.visible = False

    def update_ui(self):
        self.high_score_label.config(text=fix_rtl(f"שיא: {self.high_score}"))
        self.score_label.config(text=fix_rtl(f"ניקוד: {self.score}"))

        if not self.game_started:
            msg = "התחל ללכת וקפוץ לפלטפורמה הירוקה הראשונה כדי להתחיל בחידון!"
            self.q_box.config(text=fix_rtl(msg))
        elif self.current_q_index < len(self.questions):
            txt = self.questions[self.current_q_index]['text']
            self.q_box.config(text=fix_rtl(txt))

    def create_splash(self, x, y):
        for _ in range(25):
            self.particles.append(Particle(x, y))

    def trigger_game_over(self, msg):
        if self.game_over: return
        self.game_over = True
        self.save_high_score()
        
        title = fix_rtl("הפסדת!")
        body = fix_rtl(f"{msg}\nניקוד סופי: {self.score}\nרוצה לנסות שוב?")
        
        response = messagebox.askretrycancel(title, body)
        if response:
            self.reset_game()
        else:
            self.root.destroy()

    def trigger_win(self):
        if self.won: return
        self.won = True
        play_sound('win')
        self.save_high_score()
        
        title = fix_rtl("ניצחון!")
        body = fix_rtl(f"הגעת לאוסטרליה!\nניקוד סופי: {self.score}\nרוצה לשחק שוב?")
        
        response = messagebox.askyesno(title, body)
        if response:
            self.reset_game()
        else:
            self.root.destroy()

    def reset_game(self):
        self.player = {
            "x": 50, "y": 470, "w": 60, "h": 60, 
            "dx": 0, "dy": 0, 
            "grounded": False, "facing_right": True, 
            "sinking": False, "can_move": True
        }
        self.score = 0
        self.answered_questions = set()
        self.high_score = self.load_high_score()
        
        self.camera_x = 0
        self.game_started = False
        self.current_q_index = 0
        self.game_over = False
        self.won = False
        self.particles = []
        self.init_level()
        self.update_ui()

    def animate(self):
        if self.game_over and not self.player['sinking']: return

        self.update_physics()
        self.check_collisions()
        self.draw()
        
        self.root.after(16, self.animate)

    def draw(self):
        self.canvas.delete("all")
        
        # Draw Water
        self.canvas.create_rectangle(0, 580, WIDTH, 600, fill="#0000CD", outline="")

        # Draw Platforms
        for p in self.platforms:
            if not p.visible: continue
            
            screen_x = p.x - self.camera_x
            if screen_x + p.width < 0 or screen_x > WIDTH: continue

            color = "#2ecc71"
            if p.type == 'Red': color = "#e74c3c"
            elif p.type == 'Blue': color = "#3498db"
            elif p.type == 'start': color = "#27ae60"
            elif p.type == 'end': color = "#ffd700"
            
            self.canvas.create_rectangle(screen_x, p.y, screen_x + p.width, p.y + p.height, 
                                         fill=color, outline="")
            
            if p.label:
                self.canvas.create_text(
                    screen_x + p.width/2, 
                    p.y + 15, 
                    text=fix_rtl(p.label), 
                    fill="white", 
                    font=("Arial", 10, "bold")
                )
            
            if p.type == 'end':
                self.canvas.create_rectangle(screen_x, p.y + p.height, screen_x + p.width, HEIGHT, 
                                             fill="#DAA520", outline="")

        # Draw Player (With Flip Logic)
        p = self.player
        if not p['sinking']:
            screen_px = p['x'] - self.camera_x
            
            # Select correct image based on direction
            current_img = self.kangaroo_right if p['facing_right'] else self.kangaroo_left

            if current_img:
                self.canvas.create_image(screen_px, p['y'], anchor=tk.NW, image=current_img)
            else:
                self.canvas.create_rectangle(screen_px, p['y'], screen_px + p['w'], p['y'] + p['h'], 
                                             fill="#8B4513", outline="")

        # Draw Particles
        for i in range(len(self.particles) - 1, -1, -1):
            part = self.particles[i]
            part.update()
            if part.life <= 0:
                self.particles.pop(i)
                continue
                
            sx = part.x - self.camera_x
            self.canvas.create_oval(sx - part.radius, part.y - part.radius,
                                    sx + part.radius, part.y + part.radius,
                                    fill="#4FC3F7", outline="")

# ==========================================
# BOOTSTRAP
# ==========================================
if __name__ == "__main__":
    root = tk.Tk()
    
    ws = root.winfo_screenwidth()
    hs = root.winfo_screenheight()
    w_total = WIDTH + 250
    x = (ws/2) - (w_total/2)
    y = (hs/2) - (HEIGHT/2)
    root.geometry('%dx%d+%d+%d' % (w_total, HEIGHT, x, y))
    
    game = KangarooGame(root)
    root.mainloop()

GamesHub.tsx 

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

I have this kangaroo.py file of a game. I want to implement it in my React frontend Game Hub as pasted here. Please convert this kangaroo.py as identical as possible to a tsx file to fit in the React game Hub (don't forget its connection to the server as appears in the examples of other games in the hub).