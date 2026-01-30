import pygame
import random
import sys
import math
import os
import struct

pygame.mixer.pre_init(44100, -16, 1, 512) 
pygame.init()
pygame.font.init()

WIDTH = 900
HEIGHT = 700
TITLE = "Beautiful Balloon"
FPS = 60
HIGHSCORE_FILE = "highscore.txt"

WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 80, 80)
GREEN = (80, 255, 80)
BLUE = (80, 180, 255)
GOLD = (255, 215, 0)
DARK_BG = (20, 20, 40)
UI_BG = (50, 50, 70)

BALLOON_COLORS = [
    (255, 100, 100), (100, 255, 100), (100, 100, 255),
    (255, 255, 100), (255, 100, 255), (100, 255, 255)
]

screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption(TITLE)
clock = pygame.time.Clock()

def generate_pop_sound():
    duration = 0.1  
    sample_rate = 44100
    num_samples = int(duration * sample_rate)
    
    audio_buffer = bytearray()
    
    for i in range(num_samples):
        envelope = 1.0 - (i / num_samples) 
        noise = random.uniform(-1, 1)
        value = int(noise * envelope * 32767 * 0.5) 
        audio_buffer += struct.pack('<h', value)
        
    return pygame.mixer.Sound(buffer=audio_buffer)

pop_sound = generate_pop_sound()

try:
    font_xl = pygame.font.SysFont("comicsansms", 80, bold=True)
    font_lg = pygame.font.SysFont("comicsansms", 50, bold=True)
    font_md = pygame.font.SysFont("comicsansms", 30, bold=True)
    font_sm = pygame.font.SysFont("comicsansms", 20, bold=True)
except:
    font_xl = pygame.font.SysFont("Arial", 80, bold=True)
    font_lg = pygame.font.SysFont("Arial", 50, bold=True)
    font_md = pygame.font.SysFont("Arial", 30, bold=True)
    font_sm = pygame.font.SysFont("Arial", 20, bold=True)


class Particle:
    def __init__(self, x, y, color):
        self.x = x
        self.y = y
        self.color = color
        self.radius = random.randint(3, 7)
        self.life = random.randint(20, 40)
        self.vx = random.uniform(-3, 3)
        self.vy = random.uniform(-3, 3)

    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.life -= 1
        self.radius -= 0.1

    def draw(self, surface):
        if self.life > 0 and self.radius > 0:
            pygame.draw.circle(surface, self.color, (int(self.x), int(self.y)), int(self.radius))

class Balloon:
    def __init__(self, x, y, number, speed_multiplier):
        self.start_x = x
        self.x = x
        self.y = y
        self.radius = 45
        self.number = number
        self.base_speed = random.uniform(1.0, 2.0) * speed_multiplier
        self.color = random.choice(BALLOON_COLORS)
        self.wobble_speed = random.uniform(0.02, 0.05)
        self.wobble_amp = random.randint(10, 30)
        self.frame_offset = random.randint(0, 100)
        
    def move(self):
        self.y -= self.base_speed
        self.x = self.start_x + math.sin(pygame.time.get_ticks() * 0.005 + self.frame_offset) * self.wobble_amp

    def draw(self, surface):
        start_pos = (self.x, self.y + self.radius)
        end_pos = (self.x, self.y + self.radius + 40)
        pygame.draw.line(surface, (200, 200, 200), start_pos, end_pos, 2)

        pygame.draw.circle(surface, self.color, (int(self.x), int(self.y)), self.radius)
        pygame.draw.circle(surface, (255, 255, 255, 100), (int(self.x - 15), int(self.y - 15)), 10)
        
        text_shadow = font_md.render(str(self.number), True, (50, 50, 50))
        text_surf = font_md.render(str(self.number), True, WHITE)
        
        rect_shadow = text_shadow.get_rect(center=(int(self.x)+2, int(self.y)+2))
        rect_surf = text_surf.get_rect(center=(int(self.x), int(self.y)))
        
        surface.blit(text_shadow, rect_shadow)
        surface.blit(text_surf, rect_surf)

    def is_clicked(self, pos):
        return math.hypot(self.x - pos[0], self.y - pos[1]) < self.radius

class Button:
    def __init__(self, x, y, w, h, text, color, hover_color, callback):
        self.rect = pygame.Rect(x, y, w, h)
        self.text = text
        self.color = color
        self.hover_color = hover_color
        self.callback = callback
        self.is_hovered = False

    def draw(self, surface):
        color = self.hover_color if self.is_hovered else self.color
        pygame.draw.rect(surface, color, self.rect, border_radius=12)
        pygame.draw.rect(surface, WHITE, self.rect, 2, border_radius=12)
        text_surf = font_md.render(self.text, True, WHITE)
        text_rect = text_surf.get_rect(center=self.rect.center)
        surface.blit(text_surf, text_rect)

    def check_input(self, event):
        if event.type == pygame.MOUSEMOTION:
            self.is_hovered = self.rect.collidepoint(event.pos)
        if event.type == pygame.MOUSEBUTTONDOWN:
            if self.is_hovered:
                self.callback()

class GameManager:
    def __init__(self):
        self.state = "MENU"
        self.score = 0
        self.high_score = self.load_high_score()
        self.lives = 3
        self.question = ""
        self.correct_answer = 0
        self.balloons = []
        self.particles = []
        
        self.btn_start = Button(WIDTH//2 - 100, HEIGHT//2 + 50, 200, 60, "Start Game", BLUE, GREEN, self.start_game)
        self.btn_restart = Button(WIDTH//2 - 100, HEIGHT//2 + 80, 200, 60, "Play Again", BLUE, GREEN, self.start_game)

    def load_high_score(self):
        if not os.path.exists(HIGHSCORE_FILE):
            return 0
        try:
            with open(HIGHSCORE_FILE, "r") as f:
                return int(f.read().strip())
        except:
            return 0

    def save_high_score(self):
        if self.score > self.high_score:
            self.high_score = self.score
            try:
                with open(HIGHSCORE_FILE, "w") as f:
                    f.write(str(self.high_score))
            except IOError:
                print("Could not save high score.")

    def generate_question(self):
        op_types = ['+']
        range_max = 10 + (self.score // 2)
        if self.score > 5: op_types.append('-')
        if self.score > 15: op_types.append('*')
        if self.score > 25: op_types.append('/')

        op = random.choice(op_types)
        num1 = random.randint(1, range_max)
        num2 = random.randint(1, range_max)

        if op == '+':
            self.correct_answer = num1 + num2
            self.question = f"{num1} + {num2} = ?"
        elif op == '-':
            if num1 < num2: num1, num2 = num2, num1
            self.correct_answer = num1 - num2
            self.question = f"{num1} - {num2} = ?"
        elif op == '*':
            n1 = random.randint(1, 6 + int(self.score/5))
            n2 = random.randint(1, 6 + int(self.score/5))
            self.correct_answer = n1 * n2
            self.question = f"{n1} x {n2} = ?"
        elif op == '/':
            num2 = random.randint(2, 8)
            ans = random.randint(2, 10)
            num1 = num2 * ans
            self.correct_answer = ans
            self.question = f"{num1} / {num2} = ?"

        self.spawn_balloons()

    def spawn_balloons(self):
        self.balloons = []
        answers = [self.correct_answer]
        while len(answers) < 3:
            offset = random.randint(-5, 5)
            fake = self.correct_answer + offset
            if fake != self.correct_answer and fake >= 0 and fake not in answers:
                answers.append(fake)
        
        random.shuffle(answers)
        spacing = WIDTH // 4
        positions = [spacing, spacing * 2, spacing * 3]
        speed_mult = 1.0 + (self.score * 0.05)
        
        for i in range(3):
            y_pos = HEIGHT + 50 + random.randint(0, 100)
            self.balloons.append(Balloon(positions[i], y_pos, answers[i], speed_mult))

    def create_explosion(self, x, y, color):
        for _ in range(15):
            self.particles.append(Particle(x, y, color))

    def start_game(self):
        self.score = 0
        self.lives = 3
        self.particles = []
        self.generate_question()
        self.state = "PLAYING"

    def handle_click(self, pos):
        if self.state != "PLAYING": return

        clicked_balloon = None
        for b in self.balloons:
            if b.is_clicked(pos):
                clicked_balloon = b
                break
        
        if clicked_balloon:
            pop_sound.play() 
            self.create_explosion(clicked_balloon.x, clicked_balloon.y, clicked_balloon.color)
            
            if clicked_balloon.number == self.correct_answer:
                self.score += 1
                self.generate_question()
            else:
                self.lives -= 1
                if self.lives <= 0:
                    self.save_high_score()
                    self.state = "GAMEOVER"
                else:
                    self.generate_question()

    def update(self):
        if self.state == "PLAYING":
            for b in self.balloons[:]: 
                b.move()
                if b.y < -50:
                    if b.number == self.correct_answer:
                        self.lives -= 1
                        if self.lives <= 0:
                            self.save_high_score()
                            self.state = "GAMEOVER"
                        else:
                            self.generate_question()
                    else:
                        self.balloons.remove(b)

            for p in self.particles:
                p.update()
            self.particles = [p for p in self.particles if p.life > 0]
            
    def draw_gradient_background(self):
        for y in range(HEIGHT):
            r = int(DARK_BG[0] * (1 - y/HEIGHT))
            g = int(DARK_BG[1] * (1 - y/HEIGHT))
            b = int(DARK_BG[2] * (1 - y/HEIGHT) + 50 * (y/HEIGHT))
            pygame.draw.line(screen, (r,g,b), (0, y), (WIDTH, y))

    def draw(self):
        self.draw_gradient_background()

        for p in self.particles:
            p.draw(screen)

        if self.state == "MENU":
            title = font_xl.render("Beautiful Balloon", True, WHITE)
            sub = font_md.render("Pop the correct balloon!", True, (200, 200, 200))
            
            hs_text = font_md.render(f"High Score: {self.high_score}", True, GOLD)
            
            t_rect = title.get_rect(center=(WIDTH//2, HEIGHT//2 - 100))
            s_rect = sub.get_rect(center=(WIDTH//2, HEIGHT//2 - 20))
            h_rect = hs_text.get_rect(center=(WIDTH//2, HEIGHT//2 + 130))
            
            screen.blit(title, t_rect)
            screen.blit(sub, s_rect)
            screen.blit(hs_text, h_rect)
            self.btn_start.draw(screen)

        elif self.state == "PLAYING":
            pygame.draw.rect(screen, UI_BG, (0, 0, WIDTH, 80))
            pygame.draw.line(screen, WHITE, (0, 80), (WIDTH, 80), 2)
            
            score_txt = font_md.render(f"Score: {self.score}", True, (255, 255, 100))
            lives_txt = font_md.render(f"Lives: {self.lives}", True, (255, 100, 100))
            q_txt = font_lg.render(self.question, True, (100, 255, 255))
            
            screen.blit(score_txt, (20, 20))
            screen.blit(lives_txt, (WIDTH - 150, 20))
            screen.blit(q_txt, (WIDTH//2 - q_txt.get_width()//2, 10))
            
            for b in self.balloons:
                b.draw(screen)

        elif self.state == "GAMEOVER":
            title = font_xl.render("GAME OVER", True, RED)
            score_final = font_lg.render(f"Score: {self.score}", True, WHITE)
            hs_final = font_md.render(f"High Score: {self.high_score}", True, GOLD)

            t_rect = title.get_rect(center=(WIDTH//2, HEIGHT//2 - 120))
            s_rect = score_final.get_rect(center=(WIDTH//2, HEIGHT//2 - 40))
            h_rect = hs_final.get_rect(center=(WIDTH//2, HEIGHT//2 + 10))
            
            screen.blit(title, t_rect)
            screen.blit(score_final, s_rect)
            screen.blit(hs_final, h_rect)
            self.btn_restart.draw(screen)

game = GameManager()
running = True

while running:
    game.update()

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

        if game.state == "MENU":
            game.btn_start.check_input(event)

        elif game.state == "PLAYING":
            if event.type == pygame.MOUSEBUTTONDOWN:
                game.handle_click(event.pos)

        elif game.state == "GAMEOVER":
            game.btn_restart.check_input(event)

    game.draw()
    pygame.display.flip()
    clock.tick(FPS)

pygame.quit()
sys.exit()