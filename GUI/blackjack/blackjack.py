import tkinter as tk
from tkinter import messagebox, Menu, scrolledtext
from easyAI import TwoPlayersGame, AI_Player, Negamax
import random
import json
import os

class HighScoreManager:
    def __init__(self, filename="race21_highscore.json"):
        self.filename = filename

    def load_score(self):
        if os.path.exists(self.filename):
            try:
                with open(self.filename, "r") as f:
                    data = json.load(f)
                    return data.get("highscore", 500)
            except:
                return 500
        return 500

    def save_score(self, score):
        try:
            with open(self.filename, "w") as f:
                json.dump({"highscore": score}, f)
        except Exception as e:
            print(f"Error saving score: {e}")

class RaceTo21(TwoPlayersGame):
    def __init__(self, players, difficulty="Hard"):
        self.players = players
        self.current_total = 0
        self.target = 21
        self.current_player = 1  
        self.difficulty = difficulty

    def possible_moves(self):
        remaining = self.target - self.current_total
        return [str(i) for i in range(1, min(3, remaining) + 1)]

    def make_move(self, move):
        self.current_total += int(move)

    def unmake_move(self, move):
        self.current_total -= int(move)

    def switch_player(self):
        self.current_player = 3 - self.current_player

    def is_over(self):
        return self.current_total == self.target

    def scoring(self):
        return -100 if self.is_over() else 0

class CasinoBlackjackGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Black Jack")
        self.root.geometry("600x800")
        self.root.resizable(False, False)
        
        self.hs_manager = HighScoreManager()
        self.high_score = self.hs_manager.load_score()
        
        self.wallet = 500
        self.current_bet = 0
        self.streak = 0
        self.ai_difficulty = "Hard" 
        
        self.colors = {
            "felt": "#35654d",      
            "felt_dark": "#2a503d", 
            "text_gold": "#ffd700", 
            "text_white": "#ffffff",
            "wood": "#5c3a21",      
            "chip_red": "#d32f2f",
            "chip_blue": "#1976d2",
            "chip_black": "#212121",
            "action_log": "#1e3b2e"
        }
        
        self.root.configure(bg=self.colors["felt"])

        self.setup_menu()

        self.init_game_logic()
        
        self.setup_ui()
        self.update_stats_display()
        self.set_state_betting() 

    def setup_menu(self):
        menubar = Menu(self.root)
        self.root.config(menu=menubar)
        
        game_menu = Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Options", menu=game_menu)
        game_menu.add_command(label="Difficulty: Rookie", command=lambda: self.set_difficulty("Easy"))
        game_menu.add_command(label="Difficulty: Pro", command=lambda: self.set_difficulty("Hard"))
        game_menu.add_separator()
        game_menu.add_command(label="Reset High Score", command=self.reset_high_score)
        game_menu.add_command(label="Take Bank Loan ($500)", command=self.take_loan)

    def init_game_logic(self):
        depth = 12 if self.ai_difficulty == "Hard" else 1
        self.ai_algo = Negamax(depth)
        self.game = RaceTo21([None, AI_Player(self.ai_algo)], self.ai_difficulty)

    def set_difficulty(self, level):
        self.ai_difficulty = level
        self.log_action(f"System: Difficulty set to {level}")

    def reset_high_score(self):
        self.high_score = 500
        self.hs_manager.save_score(500)
        self.update_stats_display()
        messagebox.showinfo("Reset", "High score reset to $500.")

    def take_loan(self):
        if self.wallet < 100:
            self.wallet += 500
            self.update_stats_display()
            self.log_action("System: Bank Loan approved (+$500)")
        else:
            messagebox.showwarning("Loan Denied", "You have enough funds!")

    def setup_ui(self):
        stats_frame = tk.Frame(self.root, bg=self.colors["wood"], pady=5, relief="ridge", bd=3)
        stats_frame.pack(fill="x")
        
        self.lbl_wallet = tk.Label(stats_frame, text=f"BANK: ${self.wallet}", font=("Courier", 14, "bold"), bg=self.colors["wood"], fg="#2ecc71")
        self.lbl_wallet.pack(side="left", padx=15)

        self.lbl_highscore = tk.Label(stats_frame, text=f"BEST: ${self.high_score}", font=("Courier", 14, "bold"), bg=self.colors["wood"], fg=self.colors["text_gold"])
        self.lbl_highscore.pack(side="right", padx=15)

        tk.Label(self.root, text="BLACK JACK", font=("Times New Roman", 32, "bold"), bg=self.colors["felt"], fg=self.colors["text_gold"]).pack(pady=(15, 5))
        
        self.log_box = scrolledtext.ScrolledText(self.root, height=4, width=50, font=("Consolas", 9), bg=self.colors["action_log"], fg="#cfcfcf", bd=0)
        self.log_box.pack(pady=5)
        self.log_box.insert(tk.END, "Welcome to the High Stakes Table...\n")
        self.log_box.configure(state='disabled')

        self.table_frame = tk.Frame(self.root, bg=self.colors["felt_dark"], bd=5, relief="sunken")
        self.table_frame.pack(pady=10, padx=40, fill="x")

        tk.Label(self.table_frame, text="CURRENT COUNT", font=("Arial", 10, "bold"), bg=self.colors["felt_dark"], fg="#aaaaaa").pack(pady=(10,0))
        
        self.lbl_count = tk.Label(self.table_frame, text="0", font=("Arial", 70, "bold"), bg=self.colors["felt_dark"], fg="white")
        self.lbl_count.pack(pady=5)

        self.lbl_bet_display = tk.Label(self.table_frame, text="BET: $0", font=("Arial", 14, "bold"), bg=self.colors["felt_dark"], fg=self.colors["text_gold"])
        self.lbl_bet_display.pack(pady=(0, 15))

        self.lbl_status = tk.Label(self.root, text="Place your bet!", font=("Arial", 14, "italic"), bg=self.colors["felt"], fg="white")
        self.lbl_status.pack(pady=10)

        self.controls_frame = tk.Frame(self.root, bg=self.colors["felt"])
        self.controls_frame.pack(side="bottom", fill="x", pady=20)

        self.betting_frame = tk.Frame(self.controls_frame, bg=self.colors["felt"])
        
        tk.Label(self.betting_frame, text="PLACE YOUR WAGER", font=("Arial", 10, "bold"), bg=self.colors["felt"], fg="#ddd").pack(pady=5)
        
        btn_row = tk.Frame(self.betting_frame, bg=self.colors["felt"])
        btn_row.pack()
        
        self.create_chip_btn(btn_row, 10, self.colors["chip_blue"])
        self.create_chip_btn(btn_row, 50, self.colors["chip_red"])
        self.create_chip_btn(btn_row, 100, self.colors["chip_black"])
        
        tk.Button(btn_row, text="ALL IN!", font=("Arial", 10, "bold"), bg="#d4ac0d", fg="black", width=10, command=self.go_all_in).pack(side="left", padx=10)

        self.playing_frame = tk.Frame(self.controls_frame, bg=self.colors["felt"])
        
        tk.Label(self.playing_frame, text="ADD TO COUNT:", font=("Arial", 10, "bold"), bg=self.colors["felt"], fg="#ddd").pack(pady=5)
        
        card_row = tk.Frame(self.playing_frame, bg=self.colors["felt"])
        card_row.pack()
        
        self.create_card_btn(card_row, 1, "A")
        self.create_card_btn(card_row, 2, "2")
        self.create_card_btn(card_row, 3, "3")

    def create_chip_btn(self, parent, value, color):
        btn = tk.Button(parent, text=f"${value}", font=("Arial", 11, "bold"),
                        bg=color, fg="white", activebackground=color,
                        width=6, height=2, bd=2, relief="raised",
                        command=lambda v=value: self.place_bet(v))
        btn.pack(side="left", padx=5)

    def create_card_btn(self, parent, value, symbol):
        frame = tk.Frame(parent, bg="white", bd=1, relief="solid")
        frame.pack(side="left", padx=15)
        btn = tk.Button(frame, text=f"{symbol}\n♠", font=("Times New Roman", 20, "bold"),
                        bg="white", fg="black", width=4, height=3, relief="flat",
                        command=lambda v=value: self.human_move(v))
        btn.pack()

    def log_action(self, message):
        self.log_box.configure(state='normal')
        self.log_box.insert(tk.END, f"> {message}\n")
        self.log_box.see(tk.END)
        self.log_box.configure(state='disabled')

    def update_stats_display(self):
        self.lbl_wallet.config(text=f"BANK: ${self.wallet}")
        self.lbl_highscore.config(text=f"BEST: ${self.high_score}")
        self.lbl_bet_display.config(text=f"BET: ${self.current_bet}")

    def set_state_betting(self):
        self.playing_frame.pack_forget()
        self.betting_frame.pack()
        self.lbl_status.config(text=f"Streak: {self.streak} 🔥 | Place bet to deal.")
        self.lbl_count.config(text="0", fg="white")
        self.current_bet = 0
        self.update_stats_display()

        if self.wallet <= 0:
            response = messagebox.askyesno("Bankrupt!", "You have run out of money!\nTake a loan of $500 to continue?")
            if response:
                self.take_loan()
            else:
                self.root.quit()

    def set_state_playing(self):
        self.betting_frame.pack_forget()
        self.playing_frame.pack()
        self.init_game_logic()
        self.log_action("--- NEW HAND ---")
        self.log_action(f"Bet placed: ${self.current_bet}")
        self.lbl_status.config(text="Your turn!")

    def place_bet(self, amount):
        if self.wallet < amount:
            messagebox.showwarning("Funds", "Insufficient funds!")
            return
        self.wallet -= amount
        self.current_bet = amount
        self.update_stats_display()
        self.set_state_playing()

    def go_all_in(self):
        if self.wallet <= 0:
            return
        self.current_bet = self.wallet
        self.wallet = 0
        self.update_stats_display()
        self.log_action("PLAYER GOES ALL IN!")
        self.set_state_playing()

    def human_move(self, value):
        if str(value) in self.game.possible_moves():
            self.game.make_move(value)
            self.log_action(f"You played {value}. Count is {self.game.current_total}.")
            self.update_game_display()
            
            if self.check_winner("Human"): return

            self.game.switch_player()
            self.lbl_status.config(text="Dealer is thinking...", fg="#ffd700")
            self.root.update()
            self.root.after(1000, self.ai_move)

    def ai_move(self):
        if self.ai_difficulty == "Easy" and random.random() < 0.4:
            move = random.choice(self.game.possible_moves())
            self.log_action("Dealer looks distracted...")
        else:
            move = self.game.players[1].ask_move(self.game)

        self.game.make_move(move)
        self.log_action(f"Dealer played {move}.")
        self.update_game_display()

        if self.check_winner("Dealer"): return

        self.game.switch_player()
        self.lbl_status.config(text="Your turn.", fg="white")

    def check_winner(self, winner_name):
        if self.game.is_over():
            self.lbl_count.config(fg="#00ff00" if winner_name == "Human" else "#ff0000")
            
            if winner_name == "Human":
                multiplier = 2
                if self.streak >= 2: multiplier = 2.5 
                
                winnings = int(self.current_bet * multiplier)
                self.wallet += winnings
                self.streak += 1
                
                if self.wallet > self.high_score:
                    self.high_score = self.wallet
                    self.hs_manager.save_score(self.high_score)
                    self.log_action("NEW HIGH SCORE!")
                
                msg = f"BLACKJACK! You reached 21.\nPayout: ${winnings}"
                if self.streak > 1: msg += f"\n(Streak Bonus x{multiplier}!)"
                
                self.lbl_status.config(text=f"YOU WIN ${winnings}!", fg="#00ff00")
                messagebox.showinfo("Winner", msg)
                self.log_action(f"You won ${winnings}. Streak: {self.streak}")
            
            else:
                self.streak = 0
                self.lbl_status.config(text="HOUSE WINS.", fg="#ff4444")
                messagebox.showinfo("Bust", "Dealer reached 21. You lose.")
                self.log_action("Dealer won. Streak reset.")
            
            self.update_stats_display()
            self.set_state_betting()
            return True
        return False

    def update_game_display(self):
        self.lbl_count.config(text=str(self.game.current_total))

if __name__ == "__main__":
    root = tk.Tk()
    app = CasinoBlackjackGUI(root)
    root.mainloop()