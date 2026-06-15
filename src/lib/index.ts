import weapons from './weaponList.json';
import type { GameState, Weapon } from './types';
import {
    GameStatus,
    WeaponName,
    INITIAL_HEALTH,
    MINIMUM_HEALTH,
    MAX_REROLLS
} from './types';

// --- Damage tables ---

const WEAPON_DAMAGE: Record<WeaponName, number | ((hits: number) => number)> = {
    [WeaponName.HATCHET]: 1,
    [WeaponName.KNIFE]: 1,
    [WeaponName.SPEAR]: 1,
    [WeaponName.SWORD]: 5,
    [WeaponName.HALBERD]: 5,
    [WeaponName.BOW]: (hits: number) => 1 * hits,
    [WeaponName.CROSSBOW]: (hits: number) => 2 * hits,
    [WeaponName.DARTS]: (hits: number) => 1 * hits,
    [WeaponName.DAGGER]: 3
};

const WEAPON_HIT_RANGE: Record<WeaponName, { min: number; max: number } | null> = {
    [WeaponName.HATCHET]: null,
    [WeaponName.KNIFE]: null,
    [WeaponName.SPEAR]: null,
    [WeaponName.SWORD]: null,
    [WeaponName.HALBERD]: null,
    [WeaponName.BOW]: { min: 1, max: 5 },
    [WeaponName.CROSSBOW]: { min: 1, max: 5 },
    [WeaponName.DARTS]: { min: 1, max: 3 },
    [WeaponName.DAGGER]: null
};

// --- Pure utility functions ---

function getRandomHits(weaponName: WeaponName): number {
    const range = WEAPON_HIT_RANGE[weaponName];
    if (!range) return 1;
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

export function calculateDamage(weapon: Weapon): number {
    const damageCalculator = WEAPON_DAMAGE[weapon.name];
    if (typeof damageCalculator === 'function') {
        const hits = getRandomHits(weapon.name);
        return damageCalculator(hits);
    }
    return damageCalculator;
}

function selectRandomWeapon(availableWeapons: Weapon[]): Weapon {
    return availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
}

function selectWeaponExcluding(excludedNames: WeaponName[]): Weapon {
    const available = (weapons as Weapon[]).filter(
        (w) => !excludedNames.includes(w.name)
    );
    if (available.length === 0) {
        return selectRandomWeapon(weapons as Weapon[]);
    }
    return selectRandomWeapon(available);
}

function clampHealth(health: number): number {
    return Math.max(Math.min(health, INITIAL_HEALTH), MINIMUM_HEALTH);
}

function determineGameStatus(playerHealth: number, enemyHealth: number): GameStatus {
    if (enemyHealth === MINIMUM_HEALTH) return GameStatus.WON;
    if (playerHealth === MINIMUM_HEALTH) return GameStatus.LOST;
    return GameStatus.FOUGHT;
}

function isGameOver(status: GameStatus): boolean {
    return status === GameStatus.WON || status === GameStatus.LOST;
}

// --- Public game functions ---

export function init(): GameState {
    const playerWeapon = selectRandomWeapon(weapons as Weapon[]);

    return {
        playerHealth: INITIAL_HEALTH,
        enemyHealth: INITIAL_HEALTH,
        playerWeapon,
        enemyWeapon: null,
        status: GameStatus.READY_TO_FIGHT,
        rerollsUsed: 0,
        weaponsSeenThisRound: [playerWeapon.name]
    };
}

export function rerollWeapon(state: GameState): GameState {
    if (isGameOver(state.status)) {
        throw new Error('Game is over');
    }

    if (state.status !== GameStatus.READY_TO_FIGHT) {
        throw new Error('Cannot reroll weapon after fighting');
    }

    if (state.rerollsUsed >= MAX_REROLLS) {
        throw new Error('No rerolls remaining');
    }

    const newWeapon = selectWeaponExcluding(state.weaponsSeenThisRound);

    return {
        ...state,
        playerWeapon: newWeapon,
        rerollsUsed: state.rerollsUsed + 1,
        weaponsSeenThisRound: [...state.weaponsSeenThisRound, newWeapon.name]
    };
}

export function fight(state: GameState): GameState {
    if (isGameOver(state.status)) {
        throw new Error('Game is over');
    }

    if (state.status === GameStatus.FOUGHT) {
        throw new Error('Round already played');
    }

    if (state.status === GameStatus.INITIAL) {
        throw new Error('Game not initialized');
    }

    if (!state.playerWeapon) {
        throw new Error('Player weapon not selected');
    }

    const playerDamage = calculateDamage(state.playerWeapon);
    const enemyWeapon = selectRandomWeapon(weapons as Weapon[]);
    const enemyDamage = calculateDamage(enemyWeapon);

    const damageDifference = Math.abs(playerDamage - enemyDamage);

    let newPlayerHealth = state.playerHealth;
    let newEnemyHealth = state.enemyHealth;

    if (playerDamage > enemyDamage) {
        newEnemyHealth -= damageDifference;
    } else if (enemyDamage > playerDamage) {
        newPlayerHealth -= damageDifference;
    }

    newPlayerHealth = clampHealth(newPlayerHealth);
    newEnemyHealth = clampHealth(newEnemyHealth);

    return {
        playerHealth: newPlayerHealth,
        enemyHealth: newEnemyHealth,
        playerWeapon: state.playerWeapon,
        enemyWeapon,
        status: determineGameStatus(newPlayerHealth, newEnemyHealth),
        rerollsUsed: state.rerollsUsed,
        weaponsSeenThisRound: state.weaponsSeenThisRound
    };
}

export function newRound(state: GameState): GameState {
    if (isGameOver(state.status)) {
        throw new Error('Game is over');
    }

    const playerWeapon = selectRandomWeapon(weapons as Weapon[]);

    return {
        ...state,
        playerWeapon,
        enemyWeapon: null,
        status: GameStatus.READY_TO_FIGHT,
        rerollsUsed: 0,
        weaponsSeenThisRound: [playerWeapon.name]
    };
}