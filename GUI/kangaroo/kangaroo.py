import tkinter as tk
from tkinter import messagebox
import csv
import math
import time
import random
import os
import platform

def fix_rtl(text):
    if not text: return ""
    # Adds the RTL mark to every line to force punctuation to the left (the end)
    return "\n".join([str(line) + "\u200f" for line in text.split("\n")])

# ==========================================
# CONFIGURATION
# ==========================================
WIDTH = 800
HEIGHT = 600
GRAVITY = 0.8       # Increased from 0.6 for faster falling
JUMP_STRENGTH = -16 # Increased from -14 for snappier jumps
SPEED = 8           # Increased from 5 for faster running
FRAME_RATE = 16     # ~60 FPS

# ==========================================
# SOUND MANAGER (Cross-Platform Fallback)
# ==========================================
system_platform = platform.system()

def play_sound(sound_type):
    """
    Uses winsound on Windows for beeps.
    On Mac/Linux, this is a placeholder to prevent crashes.
    """
    try:
        if system_platform == "Windows":
            import winsound
            if sound_type == 'jump':
                winsound.Beep(400, 100) # Simple beep
            elif sound_type == 'splash':
                winsound.Beep(150, 300)
            elif sound_type == 'wrong':
                winsound.Beep(100, 400)
            elif sound_type == 'win':
                winsound.Beep(600, 100)
                time.sleep(0.1)
                winsound.Beep(800, 200)
        else:
            # Placeholder for Linux/Mac (requires external libs like playsound usually)
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
            next(reader) # Skip header
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
        # Main container
        self.main_frame = tk.Frame(root, bg="#2c3e50")
        self.main_frame.pack(fill=tk.BOTH, expand=True)

        # Sideboard (Right side for Hebrew layout)
        self.sideboard = tk.Frame(self.main_frame, width=250, bg="#333", bd=4, relief="solid")
        self.sideboard.pack(side=tk.RIGHT, fill=tk.Y)
        self.sideboard.pack_propagate(False) # Stop frame shrinking to fit content

        # Sideboard Elements
        tk.Label(self.sideboard, text="קנגורו - מאת גולן גלנט", font=("Arial", 16, "bold"), 
                 bg="#333", fg="#ffd700", wraplength=230).pack(pady=20)
        
        self.score_label = tk.Label(self.sideboard, text="שאלה: 0/10", font=("Arial", 14), 
                                    bg="#333", fg="white")
        self.score_label.pack(pady=10)

        # Question Box
        self.q_box = tk.Label(self.sideboard, text="טוען...", font=("Arial", 12), 
                              bg="#444", fg="white", width=25, height=8, wraplength=200, relief="sunken")
        self.q_box.pack(pady=20, padx=10)

        # Instructions
        instr_text = "קפצו על אדום או כחול!\n\nמקשים:\nחצים לתזוזה\nרווח לקפיצה"
        instructions = tk.Label(self.sideboard, text=fix_rtl(instr_text), 
                        font=("Arial", 12), bg="#333", fg="white", 
                        justify=tk.RIGHT) # Ensures the block aligns correctly
        instructions.pack(side=tk.BOTTOM, pady=20)

        # Canvas (Left side)
        self.canvas = tk.Canvas(self.main_frame, width=WIDTH, height=HEIGHT, bg="#87CEEB")
        self.canvas.pack(side=tk.LEFT)

        # --- Assets ---
        self.kangaroo_img = None
        if os.path.exists("kangaroo.png"):
            try:
                # Load and optionally resize if your PNG is huge
                img = tk.PhotoImage(file="kangaroo.png")
                self.kangaroo_img = img
            except Exception as e:
                print(f"Error loading image: {e}")

        # --- Game State ---
        self.questions = load_questions()
        self.platforms = []
        self.particles = []
        
        # Player Dictionary (mimicking JS object)
        self.player = {
            "x": 50, "y": 470, "w": 60, "h": 60, 
            "dx": 0, "dy": 0, 
            "grounded": False, "facing_right": True, 
            "sinking": False, "can_move": True
        }
        
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

    def init_level(self):
        self.platforms = []
        cx = 0
        
        # Start Platform
        self.platforms.append(Platform(cx, 530, 300, 'start', -1))
        cx += 400

        for i, q in enumerate(self.questions):
            # Question Trigger Platform (Green)
            self.platforms.append(Platform(cx, 400, 120, 'green', i))
            cx += 180
            
            # Answer Platforms
            self.platforms.append(Platform(cx, 280, 150, 'Blue', i, q['blue'])) # Top Answer
            self.platforms.append(Platform(cx, 480, 150, 'Red', i, q['red']))  # Bottom Answer
            cx += 280

        # End Platform (Gold)
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

        # Horizontal Movement
        if p['can_move']:
            if self.keys['right']:
                p['dx'] = SPEED
                p['facing_right'] = True
            elif self.keys['left']:
                p['dx'] = -SPEED
                p['facing_right'] = False
            else:
                p['dx'] = 0
        else:
            p['dx'] = 0

        # Jumping
        if p['can_move'] and self.keys['up'] and p['grounded']:
            p['dy'] = JUMP_STRENGTH
            p['grounded'] = False
            play_sound('jump')

        # Gravity application
        p['dy'] += GRAVITY
        p['x'] += p['dx']
        p['y'] += p['dy']

        # Camera scroll logic
        if p['x'] > 250:
            self.camera_x = p['x'] - 250

        # Water/Death Check
        if p['y'] > 580 and not p['sinking']:
            p['sinking'] = True
            play_sound('splash')
            self.create_splash(p['x'] + p['w']/2, 590)
            # Delay game over message slightly
            self.root.after(1000, lambda: self.trigger_game_over("צנחת לאגם! נסה שנית, רק הפעם תביא שנורקל!"))

    def check_collisions(self):
        p = self.player
        if p['sinking']: return
        
        p['grounded'] = False
        
        # Check every visible platform
        for plat in self.platforms:
            if not plat.visible: continue
            
            # AABB Collision Detection
            if (p['x'] < plat.x + plat.width and
                p['x'] + p['w'] > plat.x and
                p['y'] + p['h'] >= plat.y and
                p['y'] + p['h'] <= plat.y + plat.height + 15 and # tolerance for falling speed
                p['dy'] >= 0): # Only collide if falling downwards

                if self.is_trap(plat):
                    # --- FAILURE LOGIC ---
                    # 1. Hide sibling platforms to prevent saving oneself
                    for other in self.platforms:
                        if other.q_index == plat.q_index:
                            other.visible = False
                    
                    # 2. Lock controls
                    p['can_move'] = False
                    play_sound('wrong')
                    # Note: We do NOT set grounded=True, so gravity pulls them down
                else:
                    # --- SAFE LANDING ---
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

        # If landed on correct answer, hide the WRONG answer so they can't jump back
        for other in self.platforms:
            if (other.q_index == plat.q_index and 
                other != plat and 
                (other.type == 'Red' or other.type == 'Blue')):
                other.visible = False

    def update_ui(self):
        if not self.game_started:
            # Wrap the starting message
            msg = "התחל ללכת וקפוץ לפלטפורמה הירוקה הראשונה כדי להתחיל בחידון!"
            self.q_box.config(text=fix_rtl(msg))
            self.score_label.config(text=fix_rtl("שאלה: 0/10"))
        elif self.current_q_index < len(self.questions):
            txt = self.questions[self.current_q_index]['text']
            self.q_box.config(text=fix_rtl(txt))
            self.score_label.config(text=fix_rtl(f"שאלה: {self.current_q_index + 1}/10"))

    def create_splash(self, x, y):
        for _ in range(25):
            self.particles.append(Particle(x, y))

    def trigger_game_over(self, msg):
        if self.game_over: return
        self.game_over = True
        
        # Apply fix to title and message
        title = fix_rtl("הפסדת!")
        body = fix_rtl(f"{msg}\nרוצה לנסות שוב?")
        
        response = messagebox.askretrycancel(title, body)
        if response:
            self.reset_game()
        else:
            self.root.destroy()

    def trigger_win(self):
        if self.won: return
        self.won = True
        play_sound('win')
        
        # Apply fix to title and multi-line body
        title = fix_rtl("ניצחון!")
        body = fix_rtl("הגעת לאוסטרליה!\nכל הכבוד!\nרוצה לשחק שוב?")
        
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
        self.camera_x = 0
        self.game_started = False
        self.current_q_index = 0
        self.game_over = False
        self.won = False
        self.particles = []
        self.init_level()
        self.update_ui()

    def animate(self):
        # Stop animation loop if game over dialog is showing (game_over is True but before reset)
        if self.game_over and not self.player['sinking']: return

        self.update_physics()
        self.check_collisions()
        self.draw()
        
        # Schedule next frame (~60 FPS)
        self.root.after(16, self.animate)

    def draw(self):
        self.canvas.delete("all")
        
        # Draw Water
        # Canvas coordinates: (x1, y1, x2, y2)
        self.canvas.create_rectangle(0, 580, WIDTH, 600, fill="#0000CD", outline="")

        # Draw Platforms
        for p in self.platforms:
            if not p.visible: continue
            
            # Convert world X to screen X based on camera
            screen_x = p.x - self.camera_x
            
            # Culling: Don't draw if off screen
            if screen_x + p.width < 0 or screen_x > WIDTH: continue

            # Determine Color
            color = "#2ecc71" # Default green
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
                    text=fix_rtl(p.label), # <--- Fix applied here
                    fill="white", 
                    font=("Arial", 10, "bold")
                )
            
            # Draw Gold block extension for end platform
            if p.type == 'end':
                self.canvas.create_rectangle(screen_x, p.y + p.height, screen_x + p.width, HEIGHT, 
                                             fill="#DAA520", outline="")

        # Draw Player
        p = self.player
        if not p['sinking']:
            screen_px = p['x'] - self.camera_x
            
            if self.kangaroo_img:
                # Basic sprite drawing (no flipping logic implemented for simplicity, just position)
                self.canvas.create_image(screen_px, p['y'], anchor=tk.NW, image=self.kangaroo_img)
            else:
                # Fallback rectangle
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
    
    # Center the window
    ws = root.winfo_screenwidth()
    hs = root.winfo_screenheight()
    # Width includes 800 (canvas) + 250 (sideboard)
    w_total = WIDTH + 250
    x = (ws/2) - (w_total/2)
    y = (hs/2) - (HEIGHT/2)
    root.geometry('%dx%d+%d+%d' % (w_total, HEIGHT, x, y))
    
    game = KangarooGame(root)
    root.mainloop()