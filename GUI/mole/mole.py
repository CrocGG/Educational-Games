import pygame
import random
import sys
import os
import math
import array

# --- Configuration ---
SCREEN_WIDTH = 600
SCREEN_HEIGHT = 750 
CELL_SIZE = 200
FPS = 60

# --- Colors ---
COLOR_BG = (126, 200, 80)
COLOR_UI_BAR = (255, 245, 220)
COLOR_HOLE = (60, 40, 30)
COLOR_TEXT = (80, 50, 20)      
COLOR_SCORE = (50, 50, 50)
COLOR_HEART = (255, 80, 80)
COLOR_BUTTON = (70, 160, 60)   
COLOR_BUTTON_HOVER = (90, 190, 80)

MOLE_COLORS = [
    (210, 180, 140), (150, 150, 150), (255, 180, 200), (100, 200, 255),
    (180, 130, 255), (255, 230, 100), (255, 160, 80), (140, 210, 100)
]

selected_color_index = 0
HS_FILE = "highscore.txt"

def generate_sound(sound_type, duration=0.1):
    sample_rate = 44100
    n_samples = int(sample_rate * duration)
    sound_buffer = array.array('h') 
    for i in range(n_samples):
        t = float(i) / sample_rate
        envelope = 1.0 - (i / n_samples) 
        if sound_type == "pop":
            freq = 400 + (i / n_samples) * 400
            value = int(10000 * math.sin(2 * math.pi * freq * t) * envelope)
        elif sound_type == "thud":
            value = int(15000 * random.uniform(-1, 1) * envelope)
        elif sound_type == "miss": # Lower pitch for bad hits
            freq = 150 - (i / n_samples) * 100
            value = int(10000 * math.sin(2 * math.pi * freq * t) * envelope)
        sound_buffer.append(value)
    return pygame.mixer.Sound(buffer=sound_buffer)

class Mole:
    def __init__(self, number, x, y, sounds):
        self.number = number
        self.rect = pygame.Rect(x + 50, y + 50, 100, 100)
        self.hole_y = y + 100
        self.base_y = y + 180      
        self.draw_y = self.base_y 
        self.target_y = y + 20     
        self.sounds = sounds
        self.state = 'hidden' 
        self.timer = 0
        self.visible_time = 0
        self.speed = 5 

    def popup(self, duration_ms):
        if self.state == 'hidden':
            self.state = 'rising'
            self.visible_time = duration_ms
            self.timer = pygame.time.get_ticks()
            self.sounds['rise'].play()

    def whack(self):
        # Returns True if hit successfully, False if missed/empty
        if self.state in ['rising', 'up']:
            self.state = 'hit'
            self.timer = pygame.time.get_ticks()
            self.sounds['hit'].play()
            return True
        return False

    def update(self):
        current_time = pygame.time.get_ticks()
        missed = False

        if self.state == 'rising':
            if self.draw_y > self.target_y:
                self.draw_y -= self.speed
            else:
                self.state = 'up'
        elif self.state == 'up':
            if current_time - self.timer > self.visible_time:
                self.state = 'sinking'
                missed = True # Natural miss (too slow)
        elif self.state == 'hit':
            if current_time - self.timer > 400: 
                self.state = 'sinking'
        elif self.state == 'sinking':
            if self.draw_y < self.base_y:
                self.draw_y += self.speed
            else:
                self.state = 'hidden'
        return missed

    def draw(self, screen, font):
        hole_rect = pygame.Rect(self.rect.x - 10, self.hole_y - 20, 120, 50)
        pygame.draw.ellipse(screen, COLOR_HOLE, hole_rect)

        clip_rect = pygame.Rect(0, 0, SCREEN_WIDTH, self.hole_y + 5)
        screen.set_clip(clip_rect)

        if self.state != 'hidden':
            mole_color = MOLE_COLORS[selected_color_index]
            if self.state == 'hit': mole_color = (255, 100, 100)
            mole_rect = pygame.Rect(self.rect.x, self.draw_y, 100, 120)
            pygame.draw.ellipse(screen, mole_color, mole_rect)
            
            eye_y = mole_rect.y + 40
            
            if self.state != 'hit':
                pygame.draw.circle(screen, (0, 0, 0), (mole_rect.x + 30, eye_y), 10)
                pygame.draw.circle(screen, (0, 0, 0), (mole_rect.x + 70, eye_y), 10)
                pygame.draw.circle(screen, (255, 255, 255), (mole_rect.x + 28, eye_y - 3), 3)
                pygame.draw.circle(screen, (255, 255, 255), (mole_rect.x + 68, eye_y - 3), 3)
                pygame.draw.arc(screen, (0,0,0), (mole_rect.x + 40, mole_rect.y + 70, 20, 10), 3.14, 6.28, 2)
            else:
                # Dead Eyes (XX)
                lx, ly = mole_rect.x + 30, eye_y
                pygame.draw.line(screen, (50,0,0), (lx - 8, ly - 8), (lx + 8, ly + 8), 3)
                pygame.draw.line(screen, (50,0,0), (lx + 8, ly - 8), (lx - 8, ly + 8), 3)
                
                rx, ry = mole_rect.x + 70, eye_y
                pygame.draw.line(screen, (50,0,0), (rx - 8, ry - 8), (rx + 8, ry + 8), 3)
                pygame.draw.line(screen, (50,0,0), (rx + 8, ry - 8), (rx - 8, ry + 8), 3)
                pygame.draw.circle(screen, (50, 0, 0), (mole_rect.x + 50, mole_rect.y + 75), 6)

            pygame.draw.circle(screen, (255, 130, 130), (mole_rect.x + 50, mole_rect.y + 60), 8)

        screen.set_clip(None)
        pygame.draw.arc(screen, (100, 180, 60), hole_rect, 3.14, 6.28, 10)
        
        text_surf = font.render(str(self.number), True, (255,255,255))
        pygame.draw.rect(screen, (70, 70, 180), (self.rect.x + 35, self.hole_y + 35, 30, 30), border_radius=8)
        screen.blit(text_surf, (self.rect.x + 42, self.hole_y + 37))

def load_high_score():
    if os.path.exists(HS_FILE):
        with open(HS_FILE, 'r') as f:
            try: return int(f.read())
            except: return 0
    return 0

def save_high_score(score):
    with open(HS_FILE, 'w') as f:
        f.write(str(score))

def draw_button(screen, rect, text, font, hover=False):
    color = COLOR_BUTTON_HOVER if hover else COLOR_BUTTON
    pygame.draw.rect(screen, (50, 100, 40), (rect.x, rect.y+5, rect.width, rect.height), border_radius=15)
    pygame.draw.rect(screen, color, rect, border_radius=15)
    txt_surf = font.render(text, True, (255, 255, 255))
    text_rect = txt_surf.get_rect(center=rect.center)
    screen.blit(txt_surf, text_rect)

def main():
    global selected_color_index
    pygame.mixer.pre_init(44100, -16, 1, 512)
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    clock = pygame.time.Clock()
    
    font_xl = pygame.font.SysFont('Comic Sans MS', 60, bold=True)
    font_large = pygame.font.SysFont('Comic Sans MS', 40, bold=True)
    font_med = pygame.font.SysFont('Comic Sans MS', 28, bold=True)
    font_small = pygame.font.SysFont('Comic Sans MS', 20, bold=True)

    sounds = {'rise': generate_sound("pop", 0.1), 'hit': generate_sound("thud", 0.15), 'miss': generate_sound("miss", 0.3)}

    moles = []
    layout = [[7, 8, 9],[4, 5, 6],[1, 2, 3]]
    for r in range(3):
        for c in range(3):
            moles.append(Mole(layout[r][c], c * CELL_SIZE, r * CELL_SIZE + 120, sounds))
    moles.sort(key=lambda m: m.number)

    key_map = {pygame.K_1: 1, pygame.K_2: 2, pygame.K_3: 3, pygame.K_4: 4, pygame.K_5: 5, pygame.K_6: 6, pygame.K_7: 7, pygame.K_8: 8, pygame.K_9: 9,
               pygame.K_KP1: 1, pygame.K_KP2: 2, pygame.K_KP3: 3, pygame.K_KP4: 4, pygame.K_KP5: 5, pygame.K_KP6: 6, pygame.K_KP7: 7, pygame.K_KP8: 8, pygame.K_KP9: 9}

    state, score, lives = "MENU", 0, 3
    high_score = load_high_score()
    next_popup = 0
    interval, duration = 2500, 2500 

    btn_start_rect = pygame.Rect((SCREEN_WIDTH - 200)//2, 300, 200, 70)

    while True:
        now = pygame.time.get_ticks()
        mouse_pos = pygame.mouse.get_pos()

        for event in pygame.event.get():
            if event.type == pygame.QUIT: pygame.quit(); sys.exit()
            
            if state == "MENU":
                if event.type == pygame.MOUSEBUTTONDOWN:
                    for i in range(8):
                        if pygame.Rect((SCREEN_WIDTH - 320)//2 + i*40, 420, 30, 30).collidepoint(event.pos):
                            selected_color_index = i
                    if btn_start_rect.collidepoint(event.pos):
                        score, lives = 0, 3
                        interval, duration = 2500, 2500 
                        state = "PLAYING"
                        for m in moles: m.state = 'hidden'

            elif state == "PLAYING":
                if event.type == pygame.KEYDOWN:
                    num = key_map.get(event.key, -1)
                    if 1 <= num <= 9:
                        # Attempt to whack the mole
                        hit_successful = moles[num-1].whack()
                        
                        if hit_successful:
                            # CORRECT HIT
                            score += 10
                            if score > high_score: high_score = score; save_high_score(high_score)
                            interval = max(900, interval - 20) 
                            duration = max(1000, duration - 20)
                        else:
                            # WRONG HIT (Empty hole) - LOSE LIFE
                            lives -= 1
                            sounds['miss'].play()
                            if lives <= 0: state = "GAMEOVER"
            
            elif state == "GAMEOVER":
                if event.type == pygame.MOUSEBUTTONDOWN:
                    if btn_start_rect.collidepoint(event.pos):
                        state = "MENU"

        if state == "PLAYING":
            if now > next_popup:
                spawn_count = 1
                if score >= 200 and score < 400: spawn_count = 2
                elif score >= 400: spawn_count = 3
                available = [m for m in moles if m.state == 'hidden']
                random.shuffle(available)
                for i in range(min(len(available), spawn_count)):
                    available[i].popup(duration)
                next_popup = now + interval

            for m in moles:
                if m.update(): # Returns true if missed naturally (timer ran out)
                    lives -= 1
                    sounds['miss'].play()
                    if lives <= 0: state = "GAMEOVER"

        # --- Drawing ---
        screen.fill(COLOR_BG)
        
        pygame.draw.rect(screen, COLOR_UI_BAR, (0, 0, SCREEN_WIDTH, 90))
        pygame.draw.line(screen, (200, 190, 160), (0, 90), (SCREEN_WIDTH, 90), 3)
        
        screen.blit(font_small.render("SCORE", True, (150, 140, 100)), (25, 15))
        screen.blit(font_large.render(f"{score}", True, COLOR_TEXT), (25, 35))

        lives_label = font_small.render("LIVES", True, (150, 140, 100))
        screen.blit(lives_label, (SCREEN_WIDTH - 130, 15))
        
        for i in range(3):
            heart_color = COLOR_HEART if i < lives else (220, 220, 220)
            hx, hy = SCREEN_WIDTH - 110 + (i*35), 55
            pygame.draw.circle(screen, heart_color, (hx-5, hy-5), 8)
            pygame.draw.circle(screen, heart_color, (hx+5, hy-5), 8)
            pygame.draw.polygon(screen, heart_color, [(hx-11, hy-1), (hx+11, hy-1), (hx, hy+12)])

        for m in moles: m.draw(screen, font_small)

        if state == "MENU":
            s = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA); s.fill((0,0,0,140)); screen.blit(s, (0,0))
            title = font_xl.render("WHACK-A-MOLE", True, (255, 255, 255))
            screen.blit(title, (SCREEN_WIDTH//2 - title.get_width()//2, 120))
            is_hover = btn_start_rect.collidepoint(mouse_pos)
            draw_button(screen, btn_start_rect, "PLAY", font_large, is_hover)
            lbl_color = font_med.render("Pick your mole color:", True, (230, 255, 230))
            screen.blit(lbl_color, (SCREEN_WIDTH//2 - lbl_color.get_width()//2, 385))
            for i in range(8):
                rect = pygame.Rect((SCREEN_WIDTH - 320)//2 + i*40, 420, 30, 30)
                if i == selected_color_index:
                    pygame.draw.circle(screen, (255, 255, 255), rect.center, 20)
                pygame.draw.circle(screen, MOLE_COLORS[i], rect.center, 15)
        
        elif state == "GAMEOVER":
            s = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA); s.fill((100,0,0,200)); screen.blit(s, (0,0))
            txt_over = font_xl.render("GAME OVER", True, (255,150,150))
            screen.blit(txt_over, (SCREEN_WIDTH//2 - txt_over.get_width()//2, 180))
            txt_score = font_med.render(f"Final Score: {score}", True, (255,255,255))
            screen.blit(txt_score, (SCREEN_WIDTH//2 - txt_score.get_width()//2, 250))
            is_hover = btn_start_rect.collidepoint(mouse_pos)
            draw_button(screen, btn_start_rect, "MENU", font_large, is_hover)

        pygame.display.flip()
        clock.tick(FPS)

if __name__ == "__main__":
    main()