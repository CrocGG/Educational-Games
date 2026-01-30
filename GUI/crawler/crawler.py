import tkinter as tk
import os
from easyAI import TwoPlayersGame, AI_Player, Negamax

class CrawlerGame(TwoPlayersGame):
    def __init__(self, players):
        self.players = players
        self.leaves = 12 
        self.nplayer = 1 

    def possible_moves(self):
        if self.leaves == 1:
            return ['1']
        return ['1', '2']

    def make_move(self, move):
        self.leaves -= int(move)

    def unmake_move(self, move):
        self.leaves += int(move)

    def is_over(self):
        return self.leaves == 0

    def scoring(self):
        return -100 

class SoundEffects:
    @staticmethod
    def play_crunch():
        try:
            import winsound
            winsound.Beep(200, 150)
        except ImportError:
            pass

    @staticmethod
    def play_win():
        try:
            import winsound
            for freq in [523, 659, 784, 1046]:
                winsound.Beep(freq, 150)
        except ImportError:
            pass

class KidsCrawlerGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Crawler vs Robot 🐛")
        self.root.geometry("800x700") 
        self.root.configure(bg="#C5E1A5")

        self.score_file = "Crawler_highscore.txt"
        self.high_score = self.load_score()

 
        self.ai_algo = Negamax(5) 
        self.ai_player = AI_Player(self.ai_algo)
        self.game = CrawlerGame([self.ai_player, self.ai_player]) 

        self.setup_ui()
        self.draw_scene()

    def load_score(self):
        if os.path.exists(self.score_file):
            with open(self.score_file, "r") as f:
                try:
                    return int(f.read())
                except:
                    return 0
        return 0

    def save_score(self):
        with open(self.score_file, "w") as f:
            f.write(str(self.high_score))

    def setup_ui(self):
        self.score_frame = tk.Frame(self.root, bg="#33691E", bd=3, relief="ridge")
        self.score_frame.pack(fill="x", padx=10, pady=10)
        
        self.score_label = tk.Label(self.score_frame, 
                                    text=f"⭐ Butterflies Helped: {self.high_score} ⭐", 
                                    font=("Comic Sans MS", 18, "bold"), bg="#33691E", fg="#FFF176")
        self.score_label.pack(pady=5)

        self.header = tk.Label(self.root, text="Who will eat the last leaf?", 
                               font=("Comic Sans MS", 22, "bold"), bg="#C5E1A5", fg="#33691E")
        self.header.pack(pady=10)

        self.canvas = tk.Canvas(self.root, width=700, height=350, bg="#F1F8E9", 
                                highlightthickness=3, highlightbackground="#8BC34A")
        self.canvas.pack(pady=10)

        self.btn_frame = tk.Frame(self.root, bg="#C5E1A5")
        self.btn_frame.pack(pady=10)
        btn_font = ("Verdana", 14, "bold")
        
        self.btn1 = tk.Button(self.btn_frame, text="Eat 1 🍃", bg="#66BB6A", fg="white",
                              font=btn_font, width=10, height=2, bd=5, command=lambda: self.human_move(1))
        self.btn1.grid(row=0, column=0, padx=20)

        self.btn2 = tk.Button(self.btn_frame, text="Eat 2 🌿", bg="#388E3C", fg="white",
                              font=btn_font, width=10, height=2, bd=5, command=lambda: self.human_move(2))
        self.btn2.grid(row=0, column=1, padx=20)

        self.status_label = tk.Label(self.root, text="Your turn! Click a button.", 
                                     font=("Arial", 16), bg="#C5E1A5", fg="#1B5E20")
        self.status_label.pack()

        self.reset_btn = tk.Button(self.root, text="Reset Score", font=("Arial", 8), 
                                   command=self.reset_score_action, bg="#C5E1A5", relief="flat")
        self.reset_btn.pack(side="bottom", pady=5)

    def draw_scene(self):
        self.canvas.delete("all")
        self.canvas.create_line(50, 200, 650, 200, width=15, fill="#795548", capstyle="round")

        start_x = 600
        leaves_left = self.game.leaves
        for i in range(leaves_left):
            x = start_x - (i * 45)
            y = 200
            self.canvas.create_oval(x, y-10, x+40, y-40, fill="#76FF03", outline="#33691E", width=2)
            self.canvas.create_line(x+5, y-25, x+35, y-25, fill="#1B5E20")

        eaten_count = 12 - leaves_left
        cat_x = 50 + (eaten_count * 45)
        self.canvas.create_oval(cat_x-30, 180, cat_x, 210, fill="#AED581", outline="#33691E")
        self.canvas.create_oval(cat_x-60, 180, cat_x-30, 210, fill="#AED581", outline="#33691E")
        self.canvas.create_oval(cat_x, 170, cat_x+50, 220, fill="#FF7043", outline="black", width=2)
        
        self.canvas.create_oval(cat_x+15, 185, cat_x+20, 195, fill="black")
        self.canvas.create_oval(cat_x+35, 185, cat_x+40, 195, fill="black")
        self.canvas.create_arc(cat_x+15, 195, cat_x+35, 210, start=0, extent=-180, style="arc", width=2)

    def human_move(self, amount):
        if amount > self.game.leaves:
            return
        
        self.game.make_move(str(amount))
        
        self.game.switch_player() 
        
        SoundEffects.play_crunch()
        self.draw_scene()

        if self.game.is_over():
            self.high_score += 1
            self.save_score()
            self.score_label.config(text=f"⭐ Butterflies Helped: {self.high_score} ⭐")
            self.handle_game_over("You")
            return

        self.disable_buttons()
        self.status_label.config(text="Robot is thinking... 🤔")
        self.root.after(1000, self.run_ai_move)

    def run_ai_move(self):
        move = self.ai_player.ask_move(self.game)
        self.game.make_move(move)
        self.game.switch_player() 
        
        SoundEffects.play_crunch()
        self.draw_scene()

        if self.game.is_over():
            self.handle_game_over("Robot")
        else:
            self.status_label.config(text=f"Robot ate {move}. Your turn!")
            self.enable_buttons()

    def handle_game_over(self, winner):
        self.disable_buttons()
        self.canvas.delete("all")
        
        if winner == "You":
            msg = "🦋 YOU ARE A BUTTERFLY! 🦋"
            color = "#D81B60"
            SoundEffects.play_win()
        else:
            msg = "🤖 Robot is the Butterfly!"
            color = "#546E7A"
            
        self.status_label.config(text=msg, fg=color)
        cx, cy = 350, 175
        
        self.canvas.create_polygon(cx, cy, cx-80, cy-80, cx-80, cy+80, fill=color, outline="black", width=3)
        self.canvas.create_polygon(cx, cy, cx+80, cy-80, cx+80, cy+80, fill=color, outline="black", width=3)
        self.canvas.create_oval(cx-15, cy-60, cx+15, cy+60, fill="#3E2723")

        if hasattr(self, 'restart_btn') and self.restart_btn.winfo_exists():
            self.restart_btn.destroy()

        self.restart_btn = tk.Button(self.root, text="Play Again!", font=("Verdana", 14, "bold"),
                                     bg="#FFEB3B", command=self.restart_game,
                                     height=2, width=15) 
        
        self.restart_btn.pack(pady=20, side="bottom", before=self.reset_btn)

    def restart_game(self):
        self.restart_btn.destroy()
        self.game = CrawlerGame([self.ai_player, self.ai_player])
        self.enable_buttons()
        self.status_label.config(text="New Game! Your turn.", fg="#1B5E20")
        self.draw_scene()

    def reset_score_action(self):
        self.high_score = 0
        self.save_score()
        self.score_label.config(text=f"⭐ Butterflies Helped: {self.high_score} ⭐")

    def disable_buttons(self):
        self.btn1.config(state="disabled")
        self.btn2.config(state="disabled")

    def enable_buttons(self):
        self.btn1.config(state="normal")
        self.btn2.config(state="normal")

if __name__ == "__main__":
    root = tk.Tk()
    app = KidsCrawlerGUI(root)
    root.mainloop()