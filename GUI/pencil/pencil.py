import pygame
import random
import sys
import os

# --- Constants ---
SCREEN_WIDTH = 1000
SCREEN_HEIGHT = 700
SIDEBAR_WIDTH = 250
GRID_AREA_WIDTH = SCREEN_WIDTH - SIDEBAR_WIDTH

# Grid Dimensions
ROWS = 15
COLS = 15

# Color Definitions
WHITE = (255, 255, 255)
CREAM = (250, 250, 245)  # Softer background for tiles
HOVER_COLOR = (240, 248, 255) # Light AliceBlue for hover
BLACK = (50, 50, 50)     # Softer Black for text
GRAY = (200, 200, 200)
GRID_BORDER = (180, 180, 180)
BG_COLOR = (230, 240, 255)
GOLD = (218, 165, 32)

HIGH_SCORE_FILE = "highscore.txt"

# --- Visual Color Palette ---
COLORS = {
    '.': (255, 255, 255), 
    'R': (230, 50, 50),   
    'G': (50, 180, 50),   
    'B': (50, 100, 230),  
    'Y': (255, 215, 0),   
    'O': (255, 140, 0),   
    'P': (147, 112, 219), 
    'K': (40, 40, 40),    # Softer Key/Black
    'S': (135, 206, 250), 
    'N': (139, 69, 19),   
    'L': (50, 205, 50),   
    'A': (128, 128, 128), 
}

# --- Pattern Library (15x15) ---
RAW_PATTERNS = [
    {
        "name": "Heart",
        "data": [
            "...............",
            "...RR.....RR...",
            ".RRRRR...RRRRR.",
            "RRRRRRR.RRRRRRR",
            "RRRRRRRRRRRRRRR",
            "RRRRRRRRRRRRRRR",
            ".RRRRRRRRRRRRR.",
            "..RRRRRRRRRRR..",
            "...RRRRRRRRR...",
            "....RRRRRRR....",
            ".....RRRRR.....",
            "......RRR......",
            ".......R.......",
            "...............",
            "..............."
        ]
    },
    {
        "name": "Sailboat",
        "data": [
            ".......K.......",
            ".......K.......",
            "......RK.......",
            ".....RRK.......",
            "....RRRK.......",
            "...RRRRK...Y...",
            "..RRRRRK.......",
            ".RRRRRRK.......",
            "KKKKKKKKKKKKKKK",
            ".NNNNNNNNNNNNN.",
            "..NNNNNNNNNNN..",
            "SSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSS"
        ]
    },
    {
        "name": "Space Invader",
        "data": [
            "...............",
            ".....G.....G...",
            "......G...G....",
            ".....GGGGGGG...",
            "....GG.GGG.GG..",
            "...GGGGGGGGGGG.",
            "...G.GGGGGGG.G.",
            "...G.G.....G.G.",
            "......GG.GG....",
            "...............",
            "...............",
            "...P.......P...",
            "....P.....P....",
            "...PPPPPPPPP...",
            "..P.P.....P.P.."
        ]
    },
    {
        "name": "Rubber Duck",
        "data": [
            "...............",
            "......YYY......",
            "....YYYYYY.....",
            "...YYKYYOYY....",
            "...YYYYOOO.....",
            "....YYYYYY.....",
            "..YYYYYYYY.....",
            ".YYYYYYYYYYY...",
            "YYYYYYYYYYYYY..",
            "YYYYYYYYYYYYY..",
            ".YYYYYYYYYYY...",
            "..SSSSSSSSSS...",
            ".SSSSSSSSSSSS..",
            "SSSSSSSSSSSSSS.",
            "SSSSSSSSSSSSSSS"
        ]
    },
    {
        "name": "Mushroom",
        "data": [
            ".....KKKKK.....",
            "...KKRRRRRKK...",
            "..KRRRRRRRRRK..",
            ".KRRRRRRRRRRRK.",
            ".KRR..RRR..RRK.",
            ".KRR..RRR..RRK.",
            ".KRRRRRRRRRRRK.",
            "..KRRRRRRRRRK..",
            "...KKKKKKKKK...",
            "....K.....K....",
            "....K..K..K....",
            "....K..K..K....",
            "....K.....K....",
            "....KKKKKKK....",
            "..............."
        ]
    },
    {
        "name": "Sword",
        "data": [
            "..............A",
            ".............A.",
            "............A..",
            "...........A...",
            "..........A....",
            ".........A.....",
            "........A......",
            ".......A.......",
            "......A........",
            ".....A.........",
            "....AK.........",
            "...B.K.........",
            "..B..K.........",
            ".B...K.........",
            "B....K........."
        ]
    },
    {
        "name": "Creeper Face",
        "data": [
            "LLLLLLLLLLLLLLL",
            "LLLLLLLLLLLLLLL",
            "LLLLLLLLLLLLLLL",
            "LLLLKKKLLKKKLLL",
            "LLLLKKKLLKKKLLL",
            "LLLLKKKLLKKKLLL",
            "LLLLLLLLLLLLLLL",
            "LLLLLLKKKLLLLLL",
            "LLLLLLKKKLLLLLL",
            "LLLLKKKKKKKLLLL",
            "LLLLKKKKKKKLLLL",
            "LLLLKKKLLKKKLLL",
            "LLLLKKKLLKKKLLL",
            "LLLLLLLLLLLLLLL",
            "LLLLLLLLLLLLLLL"
        ]
    },
    {
        "name": "Butterfly",
        "data": [
            "S.............S",
            "SP.....K.....PS",
            "SPP....K....PPS",
            "SPPP...K...PPPS",
            "SSPPPP.K.PPPPSS",
            "SSSPPPPKPPPPSSS",
            "SSSSPPPPPPPSSSS",
            "SSSSSPPKPPSSSSS",
            "SSSSPPPPPPPSSSS",
            "SSSPPPPKPPPPSSS",
            "SSPPPP.K.PPPPSS",
            "SPPP...K...PPPS",
            "SPP....K....PPS",
            "SP.....K.....PS",
            "S.............S"
        ]
    },
    {
        "name": "Watermelon",
        "data": [
            "...............",
            "...............",
            "......RRR......",
            "....RRKRKRR....",
            "...RRRKRKRRR...",
            "..RRRRRRRRRRR..",
            "..RRRRRRRRRRR..",
            ".RRRKRKRRRKRRR.",
            ".RRRRRRRRRRRRR.",
            ".LLLLLLLLLLLLL.",
            "..LLLLLLLLLLL..",
            "...GGGGGGGGG...",
            "...............",
            "...............",
            "..............."
        ]
    },
    {
        "name": "Sunny House",
        "data": [
            "SSSSSSSSSSSSYYY",
            "SSSSSSSSSSSSYYY",
            "SSSSSSRSSSSSSSS",
            "SSSSSSRRRSSSSSS",
            "SSSSSRRRRRSSSSS",
            "SSSSRRRRRRRSSSS",
            "SSSRRRRRRRRRSSS",
            "SSSRRRRRRRRRSSS",
            "SSSOOOOOOOOOSSS",
            "SSSOBBBOBBBOSSS",
            "SSSOBBBOBBBOSSS",
            "SSSOOOOOOOOOSSS",
            "SSSOOOONNOOOSSS",
            "GGGGGGGNNGGGGGG",
            "GGGGGGGNNGGGGGG"
        ]
    }
]

# --- Helper Functions ---

def parse_grid_string(pattern_data):
    """Converts the list of strings into a 2D array and a list of used colors."""
    grid = []
    used_colors = set()
    
    for row_str in pattern_data:
        row_colors = []
        for char in row_str:
            if char not in COLORS:
                char = '.' # Fallback to white
            row_colors.append(char)
            used_colors.add(char)
        grid.append(row_colors)
        
    return grid, list(used_colors)

def generate_math_problem(target_answer):
    """Generates simple math for a target number (1-50). ALWAYS returns an equation."""
    # Choose Operation: 50% Plus, 50% Minus
    op = random.choice(['+', '-'])
    
    if op == '+':
        # a + b = target
        # Ensure 'a' isn't just the target itself to encourage real math
        if target_answer > 1:
            a = random.randint(1, target_answer - 1)
        else:
            a = 0
        b = target_answer - a
        return f"{a} + {b}"
    else:
        # a - b = target
        b = random.randint(1, 10)
        a = target_answer + b
        return f"{a} - {b}"

def create_palette_assignment(used_chars):
    needed_count = len(used_chars)
    pool = random.sample(range(1, 51), k=needed_count + 5)
    char_to_answers = {}
    palette_list = []
    pool_idx = 0
    
    for char in used_chars:
        ans = pool[pool_idx]
        pool_idx += 1
        char_to_answers[char] = [ans]
        palette_list.append({'ans': ans, 'color': COLORS[char], 'char': char})
        
        # Chance to add a SECOND answer for the same color
        if random.random() > 0.6: 
            ans2 = pool[pool_idx]
            pool_idx += 1
            char_to_answers[char].append(ans2)
            palette_list.append({'ans': ans2, 'color': COLORS[char], 'char': char})

    palette_list.sort(key=lambda x: x['ans'])
    return palette_list, char_to_answers

# --- Game Classes ---

class Tile:
    def __init__(self, r, c, x, y, size, char_code, answer_num, equation, visual_color):
        self.rect = pygame.Rect(x, y, size, size)
        self.char_code = char_code
        self.answer_number = answer_num
        self.equation = equation
        self.visual_color = visual_color
        self.is_painted = False
        
        # Pre-render text slightly larger for better visibility
        self.font_size = int(size * 0.35) 

    def draw(self, surface, font, mouse_pos):
        is_hovered = self.rect.collidepoint(mouse_pos) and not self.is_painted

        if self.is_painted:
            # Filled Tile
            pygame.draw.rect(surface, self.visual_color, self.rect, border_radius=4)
            # Subtle dark border for grid definition even when painted
            darker_border = (max(0, self.visual_color[0]-30), max(0, self.visual_color[1]-30), max(0, self.visual_color[2]-30))
            pygame.draw.rect(surface, darker_border, self.rect, 1, border_radius=4)
        else:
            # Unpainted Tile
            bg = HOVER_COLOR if is_hovered else CREAM
            border = (100, 149, 237) if is_hovered else GRID_BORDER
            border_width = 2 if is_hovered else 1

            pygame.draw.rect(surface, bg, self.rect, border_radius=4)
            pygame.draw.rect(surface, border, self.rect, border_width, border_radius=4)
            
            # Draw Text
            # We use a specific font size calc here or passed font
            text_surf = font.render(self.equation, True, BLACK)
            text_rect = text_surf.get_rect(center=self.rect.center)
            surface.blit(text_surf, text_rect)

class PaletteButton:
    def __init__(self, answer, color, x, y, w, h):
        self.answer = answer
        self.color = color
        self.rect = pygame.Rect(x, y, w, h)
    
    def draw(self, surface, font, is_selected):
        # Shadow
        shadow_rect = self.rect.copy()
        shadow_rect.x += 2
        shadow_rect.y += 2
        pygame.draw.rect(surface, (200, 200, 200), shadow_rect, border_radius=8)

        # Button Body
        pygame.draw.rect(surface, self.color, self.rect, border_radius=8)
        
        # Selection Indicator
        if is_selected:
            pygame.draw.rect(surface, BLACK, self.rect, 3, border_radius=8)
            # Little checkmark circle
            pygame.draw.circle(surface, WHITE, (self.rect.right - 10, self.rect.top + 10), 6)
            pygame.draw.circle(surface, BLACK, (self.rect.right - 10, self.rect.top + 10), 6, 1)
        else:
            pygame.draw.rect(surface, (150, 150, 150), self.rect, 1, border_radius=8)

        # Number Badge
        center_x = self.rect.centerx
        center_y = self.rect.centery
        
        pygame.draw.circle(surface, WHITE, (center_x, center_y), 16)
        pygame.draw.circle(surface, BLACK, (center_x, center_y), 16, 1)
        
        txt = font.render(str(self.answer), True, BLACK)
        txt_rect = txt.get_rect(center=(center_x, center_y))
        surface.blit(txt, txt_rect)

class Game:
    def __init__(self):
        pygame.init()
        pygame.display.set_caption("Pixel Math Mystery 15x15")
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        self.clock = pygame.time.Clock()
        
        # Fonts
        self.font_tile = pygame.font.SysFont("arial", 16, bold=True) # Increased size
        self.font_ui = pygame.font.Font(None, 36)
        self.font_big = pygame.font.Font(None, 80)
        self.font_hs = pygame.font.Font(None, 28)

        self.high_score = self.load_high_score()
        self.start_new_game()

    def load_high_score(self):
        if os.path.exists(HIGH_SCORE_FILE):
            try:
                with open(HIGH_SCORE_FILE, "r") as f:
                    return int(f.read())
            except ValueError:
                return 0
        return 0

    def save_high_score(self):
        try:
            with open(HIGH_SCORE_FILE, "w") as f:
                f.write(str(self.high_score))
        except IOError:
            print("Warning: Could not save high score.")

    def start_new_game(self):
        self.score = 0
        self.game_over = False
        self.tiles = []
        self.palette_btns = []
        self.selected_idx = None
        self.message = "Select a number -> Click the math!"
        self.msg_color = BLACK

        pattern_raw = random.choice(RAW_PATTERNS)
        self.current_pattern_name = pattern_raw["name"]
        
        grid_codes, used_chars = parse_grid_string(pattern_raw["data"])
        palette_data, char_to_answers_map = create_palette_assignment(used_chars)
        
        # Build Palette UI
        col_w = 90
        row_h = 50
        gap = 15
        start_x = GRID_AREA_WIDTH + 30
        start_y = 80
        
        for i, p_item in enumerate(palette_data):
            c = i % 2
            r = i // 2
            x = start_x + c * (col_w + gap)
            y = start_y + r * (row_h + gap)
            btn = PaletteButton(p_item['ans'], p_item['color'], x, y, col_w, row_h)
            self.palette_btns.append(btn)

        # Build Grid Tiles
        margin = 30 # Increased margin
        available_w = GRID_AREA_WIDTH - (margin * 2)
        available_h = SCREEN_HEIGHT - (margin * 2)
        
        tile_size = min(available_w // COLS, available_h // ROWS)
        
        off_x = (GRID_AREA_WIDTH - (COLS * tile_size)) // 2
        off_y = (SCREEN_HEIGHT - (ROWS * tile_size)) // 2

        for r in range(ROWS):
            for c in range(COLS):
                char = grid_codes[r][c]
                visual_color = COLORS[char]
                valid_nums = char_to_answers_map[char]
                chosen_ans = random.choice(valid_nums)
                
                eq = generate_math_problem(chosen_ans)
                
                tx = off_x + c * tile_size
                ty = off_y + r * tile_size
                
                # Pass size-2 to leave a tiny gap between tiles strictly
                t = Tile(r, c, tx, ty, tile_size - 2, char, chosen_ans, eq, visual_color)
                self.tiles.append(t)
        
        self.btn_new = pygame.Rect(GRID_AREA_WIDTH + 30, SCREEN_HEIGHT - 80, 190, 50)

    def handle_click(self, pos):
        if self.btn_new.collidepoint(pos):
            self.start_new_game()
            return

        if self.game_over: return

        for i, btn in enumerate(self.palette_btns):
            if btn.rect.collidepoint(pos):
                self.selected_idx = i
                return

        if self.selected_idx is not None:
            sel_btn = self.palette_btns[self.selected_idx]
            
            for t in self.tiles:
                if t.rect.collidepoint(pos) and not t.is_painted:
                    if t.answer_number == sel_btn.answer:
                        t.is_painted = True
                        self.score += 10
                        if self.score > self.high_score:
                            self.high_score = self.score
                            self.save_high_score()

                        if all(tile.is_painted for tile in self.tiles):
                            self.game_over = True
                            self.message = f"{self.current_pattern_name} Complete!"
                            self.msg_color = (0, 150, 0)
                        else:
                            self.message = "Correct!"
                            self.msg_color = (0, 100, 0)
                    else:
                        self.score = max(0, self.score - 5)
                        self.message = "Try Again!"
                        self.msg_color = (200, 0, 0)
                    return

    def draw(self):
        self.screen.fill(BG_COLOR)
        
        # Get Mouse Position for Hovers
        mouse_pos = pygame.mouse.get_pos()

        # Draw White Canvas Area
        pygame.draw.rect(self.screen, WHITE, (0, 0, GRID_AREA_WIDTH, SCREEN_HEIGHT))
        pygame.draw.line(self.screen, BLACK, (GRID_AREA_WIDTH, 0), (GRID_AREA_WIDTH, SCREEN_HEIGHT), 2)

        # Draw Tiles
        for t in self.tiles:
            t.draw(self.screen, self.font_tile, mouse_pos)

        # Draw UI Sidebar
        title = self.font_ui.render("Palette", True, BLACK)
        self.screen.blit(title, (GRID_AREA_WIDTH + 30, 30))

        for i, btn in enumerate(self.palette_btns):
            is_sel = (i == self.selected_idx)
            btn.draw(self.screen, self.font_ui, is_sel)

        # Draw Score
        score_y_start = SCREEN_HEIGHT - 170
        
        hs_label = self.font_hs.render("High Score:", True, GOLD)
        hs_value = self.font_ui.render(str(self.high_score), True, GOLD)
        self.screen.blit(hs_label, (GRID_AREA_WIDTH + 30, score_y_start - 35))
        self.screen.blit(hs_value, (GRID_AREA_WIDTH + 150, score_y_start - 37))

        score_surf = self.font_ui.render(f"Score: {self.score}", True, BLACK)
        self.screen.blit(score_surf, (GRID_AREA_WIDTH + 30, score_y_start))
        
        msg_surf = self.font_ui.render(self.message, True, self.msg_color)
        self.screen.blit(msg_surf, (20, SCREEN_HEIGHT - 40))

        # New Game Button
        btn_color = (50, 150, 255) if not self.game_over else (50, 200, 50)
        pygame.draw.rect(self.screen, btn_color, self.btn_new, border_radius=10)
        pygame.draw.rect(self.screen, BLACK, self.btn_new, 2, border_radius=10)
        
        btn_txt = self.font_ui.render("New Image", True, WHITE)
        txt_rect = btn_txt.get_rect(center=self.btn_new.center)
        self.screen.blit(btn_txt, txt_rect)

        # Victory Text
        if self.game_over:
            s = pygame.Surface((GRID_AREA_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
            s.fill((255, 255, 255, 128))
            self.screen.blit(s, (0,0))
            
            win_txt = self.font_big.render("AWESOME!", True, BLACK)
            win_rect = win_txt.get_rect(center=(GRID_AREA_WIDTH//2, SCREEN_HEIGHT//2))
            
            shadow = self.font_big.render("AWESOME!", True, (200,200,200))
            self.screen.blit(shadow, (win_rect.x+4, win_rect.y+4))
            self.screen.blit(win_txt, win_rect)

        pygame.display.flip()

    def run(self):
        running = True
        while running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    self.handle_click(event.pos)
            
            self.draw()
            self.clock.tick(30)
        
        pygame.quit()
        sys.exit()

if __name__ == "__main__":
    Game().run()