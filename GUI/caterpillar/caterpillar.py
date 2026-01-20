import tkinter as tk
import random
import os
import wave
import math
import struct

# Try to import pygame for sound
try:
    import pygame
    PYGAME_AVAILABLE = True
except ImportError:
    PYGAME_AVAILABLE = False
    print("For sound, please run: pip install pygame")

# --- SOUND GENERATOR (Creates .wav files so you don't have to download them) ---
class SoundGenerator:
    @staticmethod
    def create_wav(filename, duration, type="noise"):
        if os.path.exists(filename): return
        
        sample_rate = 44100
        n_frames = int(sample_rate * duration)
        
        with wave.open(filename, 'w') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            
            data = []
            for i in range(n_frames):
                if type == "noise":
                    # White noise for crunching
                    value = random.uniform(-1, 1) * 0.5
                elif type == "magic":
                    # Rising sine waves for magic
                    t = i / sample_rate
                    freq = 440 + (i / n_frames) * 800 # Rising pitch
                    value = math.sin(2 * math.pi * freq * t) * 0.3
                    
                    # Add a shimmer effect
                    value += math.sin(2 * math.pi * (freq * 1.5) * t) * 0.1
                
                # Apply fade out
                if i > n_frames - 5000:
                    value *= (n_frames - i) / 5000
                    
                packed_value = struct.pack('h', int(value * 32767.0))
                data.append(packed_value)
                
            wav_file.writeframes(b''.join(data))

# --- LOGIC SECTION ---
class CaterpillarLogic:
    def __init__(self):
        self.total_leaves = 10
        self.leaves_left = 10

    def eat(self, count):
        self.leaves_left -= count
        if self.leaves_left < 0:
            self.leaves_left = 0
            
    def is_full(self):
        return self.leaves_left == 0

# --- GUI SECTION ---
class KidsForestGame:
    def __init__(self, root):
        self.root = root
        self.root.title("The Hungry Caterpillar 🐛")
        self.root.geometry("800x650")
        self.root.configure(bg="#81C784")

        # --- AUDIO SETUP ---
        self.sounds = {}
        if PYGAME_AVAILABLE:
            pygame.mixer.init()
            # Generate assets automatically
            SoundGenerator.create_wav("crunch.wav", 0.3, "noise")
            SoundGenerator.create_wav("magic.wav", 2.0, "magic")
            
            # Load assets
            try:
                self.sounds["crunch"] = pygame.mixer.Sound("crunch.wav")
                self.sounds["magic"] = pygame.mixer.Sound("magic.wav")
                self.sounds["crunch"].set_volume(0.5)
                self.sounds["magic"].set_volume(0.6)
            except Exception as e:
                print(f"Sound loading error: {e}")

        # --- SCORE ---
        self.score_file = "butterfly_count.txt"
        self.butterflies_freed = self.load_score()
        self.logic = CaterpillarLogic()

        # --- HEADER ---
        self.header_frame = tk.Frame(root, bg="#558B2F", bd=5, relief="ridge")
        self.header_frame.pack(fill="x", padx=10, pady=10)
        
        self.score_label = tk.Label(self.header_frame, text=f"🦋 Butterflies Helped: {self.butterflies_freed}", 
                                    font=("Comic Sans MS", 20, "bold"), bg="#558B2F", fg="#FFF176")
        self.score_label.pack(pady=5)

        # --- CANVAS ---
        self.canvas = tk.Canvas(root, width=700, height=400, bg="#C8E6C9", 
                                highlightthickness=5, highlightbackground="#388E3C")
        self.canvas.pack(pady=10)

        # --- INSTRUCTION TEXT ---
        self.info_label = tk.Label(root, text="Help the caterpillar eat breakfast!", 
                                   font=("Verdana", 18, "bold"), bg="#81C784", fg="white")
        self.info_label.pack(pady=10)

        # --- BUTTONS ---
        self.btn_frame = tk.Frame(root, bg="#81C784")
        self.btn_frame.pack(pady=10)
        
        btn_style = {
            "font": ("Comic Sans MS", 16, "bold"), 
            "width": 12, "height": 2, 
            "relief": "raised", "bd": 5, "fg": "white"
        }
        
        self.btn1 = tk.Button(self.btn_frame, text="Crunch (1) 🍃", bg="#7CB342", 
                              command=lambda: self.feed_caterpillar(1), **btn_style)
        self.btn1.grid(row=0, column=0, padx=20)

        self.btn2 = tk.Button(self.btn_frame, text="Munch (2) 🍃", bg="#33691E", 
                              command=lambda: self.feed_caterpillar(2), **btn_style)
        self.btn2.grid(row=0, column=1, padx=20)

        self.draw_scene()

    # --- AUDIO HELPER ---
    def play_sound(self, name):
        if PYGAME_AVAILABLE and name in self.sounds:
            # Play creates a new channel, so sounds can overlap (crunch crunch!)
            self.sounds[name].play()

    # --- SAVE/LOAD ---
    def load_score(self):
        if os.path.exists(self.score_file):
            try:
                with open(self.score_file, "r") as f:
                    return int(f.read())
            except:
                return 0
        return 0

    def save_score(self):
        with open(self.score_file, "w") as f:
            f.write(str(self.butterflies_freed))

    # --- DRAWING ---
    def draw_scene(self):
        self.canvas.delete("all")
        
        # 1. The Branch
        self.canvas.create_line(50, 300, 650, 300, width=20, fill="#5D4037", capstyle="round")
        
        # 2. Draw Leaves
        start_x = 600
        for i in range(self.logic.leaves_left):
            x = start_x - (i * 50)
            y = 300
            self.canvas.create_oval(x, y, x+40, y-30, fill="#43A047", outline="#1B5E20", width=2)
            self.canvas.create_line(x+5, y, x+35, y, fill="#1B5E20", width=1)

        # 3. Draw Caterpillar
        eaten_count = self.logic.total_leaves - self.logic.leaves_left
        segments = 3 + eaten_count 
        
        head_x = 100 + (segments * 35)
        
        # Draw Body
        for i in range(segments):
            seg_x = head_x - (i * 35)
            wiggle = 5 if i % 2 == 0 else -5
            color = "#AED581" if i % 2 == 0 else "#7CB342"
            self.canvas.create_oval(seg_x-15, 280+wiggle, seg_x+15, 310+wiggle, 
                                    fill=color, outline="#33691E", width=2)

        # Draw Head
        self.canvas.create_oval(head_x-5, 275, head_x+40, 320, fill="#F44336", outline="#B71C1C", width=2)
        # Eyes
        self.canvas.create_oval(head_x+25, 285, head_x+30, 290, fill="black")
        self.canvas.create_oval(head_x+25, 305, head_x+30, 310, fill="black")
        # Smile
        self.canvas.create_arc(head_x+25, 295, head_x+35, 305, start=270, extent=180, style="arc", width=2)

    def draw_cocoon(self):
        self.canvas.delete("all")
        # Branch
        self.canvas.create_line(50, 100, 650, 100, width=20, fill="#5D4037", capstyle="round")
        # String
        self.canvas.create_line(350, 110, 350, 150, width=2, fill="white")
        
        # Cocoon
        self.canvas.create_oval(320, 150, 380, 280, fill="#8BC34A", outline="#33691E", width=3)
        # Texture
        self.canvas.create_line(320, 180, 380, 180, fill="#33691E", width=1)
        self.canvas.create_line(320, 210, 380, 210, fill="#33691E", width=1)
        self.canvas.create_line(325, 240, 375, 240, fill="#33691E", width=1)

    # --- INTERACTION ---
    def feed_caterpillar(self, amount):
        if amount > self.logic.leaves_left:
            amount = self.logic.leaves_left
            
        self.logic.eat(amount)
        self.draw_scene()
        
        # --- PLAY MUNCH SOUND ---
        self.play_sound("crunch")
        
        phrases = ["Yummy!", "Crunch!", "Gulp!", "So tasty!", "Growing big!"]
        self.info_label.config(text=random.choice(phrases))

        if self.logic.is_full():
            self.start_transformation()

    def start_transformation(self):
        self.btn1.config(state="disabled")
        self.btn2.config(state="disabled")
        self.info_label.config(text="I'm full! Time to sleep...", fg="#FFF176")
        self.root.after(1500, self.show_cocoon_stage)

    def show_cocoon_stage(self):
        self.draw_cocoon()
        self.info_label.config(text="Shhh... it's a Chrysalis now.")
        self.root.after(2500, self.show_butterfly_stage)

    def show_butterfly_stage(self):
        self.canvas.delete("all")
        self.info_label.config(text="✨ WOW! A Butterfly! ✨")
        
        # --- PLAY MAGIC SOUND ---
        self.play_sound("magic")
        
        self.butterflies_freed += 1
        self.save_score()
        self.score_label.config(text=f"🦋 Butterflies Helped: {self.butterflies_freed}")
        
        self.bf_x, self.bf_y = 350, 300
        self.wing_state = 0
        self.fly_count = 0
        self.animate_butterfly()

    def animate_butterfly(self):
        self.canvas.delete("butterfly")
        
        wing_w = 70 if self.wing_state % 2 == 0 else 20
        
        # Wings
        self.canvas.create_polygon(self.bf_x, self.bf_y, self.bf_x-wing_w, self.bf_y-60, self.bf_x-wing_w, self.bf_y+60, 
                                   fill="#E040FB", outline="white", width=3, tags="butterfly")
        self.canvas.create_polygon(self.bf_x, self.bf_y, self.bf_x+wing_w, self.bf_y-60, self.bf_x+wing_w, self.bf_y+60, 
                                   fill="#E040FB", outline="white", width=3, tags="butterfly")
        
        if self.wing_state % 2 == 0:
            self.canvas.create_oval(self.bf_x-wing_w+10, self.bf_y-40, self.bf_x-wing_w+30, self.bf_y-20, fill="#FFEB3B", tags="butterfly")
            self.canvas.create_oval(self.bf_x+wing_w-30, self.bf_y-40, self.bf_x+wing_w-10, self.bf_y-20, fill="#FFEB3B", tags="butterfly")

        # Body
        self.canvas.create_oval(self.bf_x-8, self.bf_y-40, self.bf_x+8, self.bf_y+40, fill="#4A148C", tags="butterfly")

        self.bf_y -= 4
        self.bf_x += random.randint(-4, 4)
        self.wing_state += 1
        self.fly_count += 1

        if self.fly_count < 80:
            self.root.after(50, self.animate_butterfly)
        else:
            self.reset_game()

    def reset_game(self):
        self.logic = CaterpillarLogic()
        self.draw_scene()
        self.info_label.config(text="Here comes a new egg! Hungry again!", fg="white")
        self.btn1.config(state="normal")
        self.btn2.config(state="normal")

if __name__ == "__main__":
    root = tk.Tk()
    app = KidsForestGame(root)
    root.mainloop()