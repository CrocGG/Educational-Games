export interface Game {
    id: string;
    name: string;
    image?: string | null;
    high_score?: number | null; 
    high_score_player?: number | null;
    high_score_player_username?: string | null;
}

export interface Player {
    id: string; 
    username: string;
    email: string; 
    is_admin?: boolean; 
}

export interface AuthResponse {
    access: string; 
    refresh: string; 
    user: Player;    
}