export interface Game {
    id: string;
    name: string;
    image?: string | null;
    high_score?: number | null; 
    high_score_player?: number | null;
    high_score_player_username?: string | null;
}

export interface Player {
    id: string; // Changed to string for UUID
    username: string;
    email: string; // Added email as it's now unique/required
    is_admin?: boolean; // Helpful for conditional rendering in the UI
}

export interface AuthResponse {
    access: string; // JWT Access token
    refresh: string; // JWT Refresh token
    user: Player;    // Better practice to return the whole user object
}