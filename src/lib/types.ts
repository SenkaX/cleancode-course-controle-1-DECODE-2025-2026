// Game Constants
export const INITIAL_HEALTH = 10;
export const MINIMUM_HEALTH = 0;
export const MAX_REROLLS = 2;

// Game Status Enum
export enum GameStatus {
    INITIAL = 'initial',
    READY_TO_FIGHT = 'ready_to_fight',
    FOUGHT = 'fought',
    WON = 'won',
    LOST = 'lost'
}

// Weapon Types
export enum WeaponName {
    HATCHET = 'hatchet',
    KNIFE = 'knife',
    SPEAR = 'spear',
    SWORD = 'sword',
    HALBERD = 'halberd',
    BOW = 'bow',
    CROSSBOW = 'crossbow',
    DARTS = 'darts',
    DAGGER = 'dagger'
}

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic';

export interface Weapon {
    name: WeaponName;
    description: string;
    rarity: Rarity;
}

// Game State
export interface GameState {
    playerHealth: number;
    enemyHealth: number;
    playerWeapon: Weapon | null;
    enemyWeapon: Weapon | null;
    status: GameStatus;
    rerollsUsed: number;
    weaponsSeenThisRound: WeaponName[];
}