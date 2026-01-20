import tkinter as tk
import random
import threading
import platform
import os

# Check OS for sound compatibility
system_platform = platform.system()
if system_platform == "Windows":
    import winsound

WIDTH, HEIGHT = 600, 600 
SIZE = 20
HIGHSCORE_FILE = "snake_highscore.txt"

SNAKE_COLORS = [
    "green", "lime green", "cyan", "magenta", "gold", "orange red", "hot pink", 
    "deep sky blue", "spring green", "purple", "orchid", "turquoise", "coral", 
    "chartreuse", "crimson", "aqua", "white", "yellow", "light sea green", "salmon"
]

BG_COLORS = [
    "black", "gray10", "navy", "dark green", "maroon", "dark slate gray", "indigo", 
    "midnight blue", "dark olive green", "dark violet", "brown4", "dark slate blue",
    "gray20", "deep pink4", "dark goldenrod", "dark cyan", "dark blue", "gray5",
    "dark khaki"
]

FRUIT_SHAPES = [
    "Circle", "Square", "Triangle", "Diamond"
]

class SnakeGame:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Snaky-Snake")
        self.root.geometry(f"{WIDTH}x{HEIGHT + 150}")
        self.root.resizable(False, False)
        
        # Game State
        self.snake = [(300, 300), (280, 300), (260, 300)]
        self.direction = "Right"
        self.next_direction = "Right"
        self.running = False
        self.is_paused = False  
        self.food = None
        self.obstacles = [] 
        self.score = 0
        self.high_score = self.load_high_score()
        
        # --- Customization Variables ---
        self.snake_color = tk.StringVar(value="lime green")
        self.bg_color = tk.StringVar(value="black")
        self.food_shape = tk.StringVar(value="Circle")
        self.difficulty = tk.StringVar(value="Medium")
        
        self.difficulty_settings = {
            "Easy": {"speed": 150, "obstacles": 0},
            "Medium": {"speed": 100, "obstacles": 8},
            "Hard": {"speed": 60, "obstacles": 15},
        }

        self.setup_ui()
        
        self.root.bind("<KeyPress>", self.change_direction)
        self.root.bind("<space>", lambda e: self.toggle_pause())
        self.root.mainloop()

    def load_high_score(self):
        """Reads high score from a local text file."""
        if not os.path.exists(HIGHSCORE_FILE):
            return 0
        try:
            with open(HIGHSCORE_FILE, "r") as f:
                return int(f.read().strip())
        except:
            return 0

    def save_high_score(self):
        """Writes new high score to a local text file."""
        try:
            with open(HIGHSCORE_FILE, "w") as f:
                f.write(str(self.high_score))
        except Exception as e:
            print(f"Error saving high score: {e}")

    def setup_ui(self):
        # Game Area
        self.canvas = tk.Canvas(self.root, width=WIDTH, height=HEIGHT, bg="black", highlightthickness=0)
        self.canvas.pack(pady=10)

        # Control Frame
        self.top_frame = tk.Frame(self.root)
        self.top_frame.pack(fill="x", pady=5)
        
        self.start_btn = tk.Button(self.top_frame, text="Start Game", command=self.start_game, bg="#dddddd")
        self.start_btn.pack(side="left", expand=True, padx=5)
        
        self.pause_btn = tk.Button(self.top_frame, text="Pause", command=self.toggle_pause, state="disabled", bg="#dddddd")
        self.pause_btn.pack(side="left", expand=True, padx=5)
        
        self.restart_btn = tk.Button(self.top_frame, text="Restart", command=self.restart_game, state="disabled", bg="#dddddd")
        self.restart_btn.pack(side="left", expand=True, padx=5)

        # Customization Panel
        self.bottom_frame = tk.Frame(self.root)
        self.bottom_frame.pack(fill="x", pady=5)
        
        # Grid layout for options
        tk.Label(self.bottom_frame, text="Snake Color:").grid(row=0, column=0, padx=5)
        tk.OptionMenu(self.bottom_frame, self.snake_color, *SNAKE_COLORS).grid(row=0, column=1, padx=5)

        tk.Label(self.bottom_frame, text="BG:").grid(row=0, column=2, padx=5)
        tk.OptionMenu(self.bottom_frame, self.bg_color, *BG_COLORS, 
                      command=lambda _: self.canvas.config(bg=self.bg_color.get())).grid(row=0, column=3, padx=5)

        tk.Label(self.bottom_frame, text="Fruit:").grid(row=1, column=0, padx=5)
        tk.OptionMenu(self.bottom_frame, self.food_shape, *FRUIT_SHAPES).grid(row=1, column=1, padx=5)

        tk.Label(self.bottom_frame, text="Difficulty:").grid(row=1, column=2, padx=5)
        tk.OptionMenu(self.bottom_frame, self.difficulty, *self.difficulty_settings.keys()).grid(row=1, column=3, padx=5)

        self.score_label = tk.Label(self.root, font=("Arial", 12, "bold"))
        self.score_label.pack(pady=5)
        self.update_score_display()

    def play_sound(self, freq, duration):
        """Cross-platform sound wrapper"""
        if system_platform == "Windows":
            threading.Thread(target=lambda: winsound.Beep(freq, duration), daemon=True).start()

    def create_food(self):
        self.canvas.delete("food")
        while True:
            x = random.randint(0, (WIDTH-SIZE)//SIZE) * SIZE
            y = random.randint(0, (HEIGHT-SIZE)//SIZE) * SIZE
            
            # Ensure food doesn't spawn on snake or obstacles
            if (x, y) not in self.snake and (x, y) not in self.obstacles:
                break
        
        shape = self.food_shape.get()
        if shape == "Circle":
            self.food = self.canvas.create_oval(x, y, x+SIZE, y+SIZE, fill="red", outline="white", tag="food")
        elif shape == "Square":
            self.food = self.canvas.create_rectangle(x, y, x+SIZE, y+SIZE, fill="red", outline="white", tag="food")
        elif shape == "Triangle":
            self.food = self.canvas.create_polygon(x+SIZE/2, y, x, y+SIZE, x+SIZE, y+SIZE, fill="red", outline="white", tag="food")
        else:
             self.food = self.canvas.create_polygon(x+SIZE/2, y, x+SIZE, y+SIZE/2, x+SIZE/2, y+SIZE, x, y+SIZE/2, fill="red", outline="white", tag="food")
        
        return (x, y)

    def play(self):
        if not self.running:
            return
            
        if self.is_paused:
            self.root.after(100, self.play)
            return

        self.direction = self.next_direction

        x, y = self.snake[0]
        if self.direction == "Up": y -= SIZE
        elif self.direction == "Down": y += SIZE
        elif self.direction == "Left": x -= SIZE
        elif self.direction == "Right": x += SIZE
        
        new_head = (x, y)

        # Collision Check: Walls, Self, Obstacles
        if (x < 0 or x >= WIDTH or y < 0 or y >= HEIGHT or 
            new_head in self.snake or new_head in self.obstacles):
            self.game_over()
            return

        self.snake.insert(0, new_head)
        
        # Check Food Collision using overlap
        overlap = self.canvas.find_overlapping(x+1, y+1, x+SIZE-1, y+SIZE-1)
        is_eating = False
        for item in overlap:
            if "food" in self.canvas.gettags(item):
                is_eating = True
                break

        if is_eating:
            self.score += 10
            if self.score > self.high_score:
                self.high_score = self.score
            self.update_score_display()
            self.create_food()
            self.play_sound(900, 50)
        else:
            self.snake.pop()

        self.draw_snake()
        
        current_speed = self.difficulty_settings[self.difficulty.get()]["speed"]
        self.root.after(current_speed, self.play)

    def start_game(self):
        if not self.running:
            self.canvas.delete("all")
            self.canvas.config(bg=self.bg_color.get())
            
            # Reset State
            self.snake = [(300, 300), (280, 300), (260, 300)]
            self.direction = "Right"
            self.next_direction = "Right"
            self.score = 0
            self.update_score_display()
            
            self.running = True
            self.is_paused = False
            
            self.start_btn.config(state="disabled")
            self.pause_btn.config(state="normal", text="Pause")
            self.restart_btn.config(state="normal")
            
            self.create_obstacles()
            self.create_food()
            self.play()

    def game_over(self):
        self.running = False
        
        # Check for High Score update
        if self.score > self.high_score:
            self.high_score = self.score
        
        self.save_high_score()
        self.update_score_display()
        
        self.canvas.create_text(WIDTH/2, HEIGHT/2, text="GAME OVER", fill="white", font=("Arial", 30, "bold"))
        self.canvas.create_text(WIDTH/2, HEIGHT/2 + 40, text=f"Final Score: {self.score}", fill="white", font=("Arial", 15))
        
        self.start_btn.config(state="normal")
        self.pause_btn.config(state="disabled")
        self.play_sound(200, 400)

    def update_score_display(self):
        self.score_label.config(text=f"High Score: {self.high_score}  |  Current Score: {self.score}")

    def draw_snake(self):
        self.canvas.delete("snake")
        
        for i, seg in enumerate(self.snake):
            if i == 0:  # The Head
                head_color = "white" if self.snake_color.get() != "white" else "yellow"
                self.canvas.create_rectangle(
                    seg[0], seg[1], seg[0]+SIZE, seg[1]+SIZE, 
                    fill=head_color, outline="black", width=2, tag="snake"
                )
                
                # --- Draw the Tongue ---
                t_color = "red"
                x, y = seg[0], seg[1]
                if self.direction == "Up":
                    self.canvas.create_line(x+SIZE/2, y, x+SIZE/2, y-8, fill=t_color, width=2, tag="snake")
                    self.canvas.create_line(x+SIZE/2, y-8, x+SIZE/2-3, y-11, fill=t_color, width=2, tag="snake") 
                    self.canvas.create_line(x+SIZE/2, y-8, x+SIZE/2+3, y-11, fill=t_color, width=2, tag="snake") 
                elif self.direction == "Down":
                    self.canvas.create_line(x+SIZE/2, y+SIZE, x+SIZE/2, y+SIZE+8, fill=t_color, width=2, tag="snake")
                    self.canvas.create_line(x+SIZE/2, y+SIZE+8, x+SIZE/2-3, y+SIZE+11, fill=t_color, width=2, tag="snake")
                    self.canvas.create_line(x+SIZE/2, y+SIZE+8, x+SIZE/2+3, y+SIZE+11, fill=t_color, width=2, tag="snake")
                elif self.direction == "Left":
                    self.canvas.create_line(x, y+SIZE/2, x-8, y+SIZE/2, fill=t_color, width=2, tag="snake")
                    self.canvas.create_line(x-8, y+SIZE/2, x-11, y+SIZE/2-3, fill=t_color, width=2, tag="snake")
                    self.canvas.create_line(x-8, y+SIZE/2, x-11, y+SIZE/2+3, fill=t_color, width=2, tag="snake")
                elif self.direction == "Right":
                    self.canvas.create_line(x+SIZE, y+SIZE/2, x+SIZE+8, y+SIZE/2, fill=t_color, width=2, tag="snake")
                    self.canvas.create_line(x+SIZE+8, y+SIZE/2, x+SIZE+11, y+SIZE/2-3, fill=t_color, width=2, tag="snake")
                    self.canvas.create_line(x+SIZE+8, y+SIZE/2, x+SIZE+11, y+SIZE/2+3, fill=t_color, width=2, tag="snake")

                # --- Draw the Eyes ---
                eye_size = 4
                self.canvas.create_oval(seg[0]+4, seg[1]+4, seg[0]+4+eye_size, seg[1]+4+eye_size, fill="black", tag="snake")
                self.canvas.create_oval(seg[0]+SIZE-8, seg[1]+4, seg[0]+SIZE-8+eye_size, seg[1]+4+eye_size, fill="black", tag="snake")
            
            else:  # The Body
                self.canvas.create_rectangle(
                    seg[0], seg[1], seg[0]+SIZE, seg[1]+SIZE, 
                    fill=self.snake_color.get(), outline="black", tag="snake"
                )

    def toggle_pause(self):
        if not self.running: 
            return
        self.is_paused = not self.is_paused
        self.pause_btn.config(text="Resume" if self.is_paused else "Pause")
        
        if self.is_paused:
            self.canvas.create_text(WIDTH/2, HEIGHT/2, text="PAUSED", fill="white", font=("Arial", 30), tag="paused_text")
        else:
            self.canvas.delete("paused_text")

    def restart_game(self):
        self.running = False
        self.start_game()

    def create_obstacles(self):
        self.obstacles = []
        count = self.difficulty_settings[self.difficulty.get()]["obstacles"]
        for _ in range(count):
            while True:
                x = random.randint(0, (WIDTH-SIZE)//SIZE) * SIZE
                y = random.randint(0, (HEIGHT-SIZE)//SIZE) * SIZE
                if (x,y) not in self.snake and (x,y) not in self.obstacles:
                    self.obstacles.append((x,y))
                    self.canvas.create_rectangle(x, y, x+SIZE, y+SIZE, fill="gray40", outline="gray20", tag="obstacle")
                    break

    def change_direction(self, event):
        new_dir = event.keysym
        all_dirs = {"Up", "Down", "Left", "Right"}
        opposites = {"Up": "Down", "Down": "Up", "Left": "Right", "Right": "Left"}
        
        if new_dir in all_dirs:
            # Prevent reversing direction directly based on current movement
            if new_dir != opposites.get(self.direction):
                self.next_direction = new_dir

if __name__ == "__main__":
    SnakeGame()