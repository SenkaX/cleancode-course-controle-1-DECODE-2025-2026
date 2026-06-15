import { describe, it, expect, beforeEach } from 'vitest';
import { init, fight, newRound, rerollWeapon, calculateDamage } from '$lib';
import { GameStatus, type Weapon, WeaponName, INITIAL_HEALTH, MINIMUM_HEALTH, MAX_REROLLS } from '$lib/types';

describe('Game Logic', () => {

	describe('init()', () => {
		it('initializes game with correct state', () => {
			const state = init();

			expect(state.playerHealth).toBe(INITIAL_HEALTH);
			expect(state.enemyHealth).toBe(INITIAL_HEALTH);
			expect(state.status).toBe(GameStatus.READY_TO_FIGHT);
			expect(state.playerWeapon).toBeDefined();
			expect(state.enemyWeapon).toBeNull();
			expect(state.rerollsUsed).toBe(0);
			expect(state.weaponsSeenThisRound).toHaveLength(1);
		});
	});

	describe('calculateDamage()', () => {
		it('calculates fixed damage for sword', () => {
			const sword: Weapon = { name: WeaponName.SWORD, description: 'test', rarity: 'rare' };
			expect(calculateDamage(sword)).toBe(5);
		});

		it('calculates variable damage for bow within range', () => {
			const bow: Weapon = { name: WeaponName.BOW, description: 'test', rarity: 'rare' };
			const damage = calculateDamage(bow);
			expect(damage).toBeGreaterThanOrEqual(1);
			expect(damage).toBeLessThanOrEqual(5);
		});
	});

	describe('fight()', () => {
		let state = init();

		beforeEach(() => {
			state = init();
		});

		it('throws error if game is already won', () => {
			state.status = GameStatus.WON;
			expect(() => fight(state)).toThrow('Game is over');
		});

		it('throws error if game is already lost', () => {
			state.status = GameStatus.LOST;
			expect(() => fight(state)).toThrow('Game is over');
		});

		it('throws error if round already fought', () => {
			state.status = GameStatus.FOUGHT;
			expect(() => fight(state)).toThrow('Round already played');
		});

		it('returns a complete FightResult', () => {
			const result = fight(state);

			expect(result.playerHealth).toBeDefined();
			expect(result.enemyHealth).toBeDefined();
			expect(result.enemyWeapon).toBeDefined();
			expect(result.playerWeapon).toBeDefined();
			expect(result.status).toBeDefined();
		});

		it('clamps health to minimum', () => {
			state.playerHealth = 1;
			state.enemyHealth = 1;
			const result = fight(state);

			expect(result.playerHealth).toBeGreaterThanOrEqual(MINIMUM_HEALTH);
			expect(result.enemyHealth).toBeGreaterThanOrEqual(MINIMUM_HEALTH);
		});

		it('sets status to WON when enemy health reaches zero', () => {
			state.enemyHealth = 1;
			state.playerWeapon = { name: WeaponName.SWORD, description: '', rarity: 'rare' };

			let won = false;
			for (let i = 0; i < 20; i++) {
				const s = { ...state };
				const result = fight(s);
				if (result.enemyHealth === MINIMUM_HEALTH) {
					expect(result.status).toBe(GameStatus.WON);
					won = true;
					break;
				}
			}
			expect(won).toBe(true);
		});

		it('sets status to LOST when player health reaches zero', () => {
			state.playerHealth = 1;
			state.playerWeapon = { name: WeaponName.KNIFE, description: '', rarity: 'common' };

			let lost = false;
			for (let i = 0; i < 20; i++) {
				const s = { ...state };
				const result = fight(s);
				if (result.playerHealth === MINIMUM_HEALTH) {
					expect(result.status).toBe(GameStatus.LOST);
					lost = true;
					break;
				}
			}
			expect(lost).toBe(true);
		});

		it('sets status to FOUGHT when neither player dies', () => {
			// Avec des HP max et armes égales, le statut restera FOUGHT
			const result = fight(state);
			if (result.playerHealth > MINIMUM_HEALTH && result.enemyHealth > MINIMUM_HEALTH) {
				expect(result.status).toBe(GameStatus.FOUGHT);
			}
		});
	});

	describe('newRound()', () => {
		it('resets round state while keeping health', () => {
			let state = init();
			state = { ...state, status: GameStatus.FOUGHT, playerHealth: 7, enemyHealth: 8 };

			const newState = newRound(state);

			expect(newState.status).toBe(GameStatus.READY_TO_FIGHT);
			expect(newState.enemyWeapon).toBeNull();
			expect(newState.playerWeapon).not.toBeNull();
			expect(newState.playerHealth).toBe(7);
			expect(newState.enemyHealth).toBe(8);
			expect(newState.rerollsUsed).toBe(0);
			expect(newState.weaponsSeenThisRound).toHaveLength(1);
		});

		it('throws error if game is over', () => {
			let state = init();
			state.status = GameStatus.WON;
			expect(() => newRound(state)).toThrow('Game is over');
		});
	});

	describe('rerollWeapon()', () => {
		let state = init();

		beforeEach(() => {
			state = init();
		});

		it('changes the player weapon', () => {
			const originalWeapon = state.playerWeapon;
			const newState = rerollWeapon(state);

			expect(newState.rerollsUsed).toBe(1);
			expect(newState.weaponsSeenThisRound).toHaveLength(2);
			// La nouvelle arme ne doit pas être la même que l'originale
			expect(newState.playerWeapon?.name).not.toBe(originalWeapon?.name);
		});

		it('increments rerollsUsed', () => {
			const newState = rerollWeapon(state);
			expect(newState.rerollsUsed).toBe(1);
		});

		it('does not allow rerolling more than MAX_REROLLS times', () => {
			let currentState = state;
			for (let i = 0; i < MAX_REROLLS; i++) {
				currentState = rerollWeapon(currentState);
			}
			expect(() => rerollWeapon(currentState)).toThrow('No rerolls remaining');
		});

		it('excludes already seen weapons from the reroll pool', () => {
			const firstWeapon = state.playerWeapon!.name;
			const afterFirstReroll = rerollWeapon(state);

			expect(afterFirstReroll.weaponsSeenThisRound).toContain(firstWeapon);
			expect(afterFirstReroll.playerWeapon?.name).not.toBe(firstWeapon);
		});

		it('throws error if game is over', () => {
			state.status = GameStatus.WON;
			expect(() => rerollWeapon(state)).toThrow('Game is over');
		});

		it('throws error if round already fought', () => {
			state.status = GameStatus.FOUGHT;
			expect(() => rerollWeapon(state)).toThrow('Cannot reroll weapon after fighting');
		});

		it('resets reroll count on new round', () => {
			let currentState = rerollWeapon(state);
			currentState = { ...currentState, status: GameStatus.FOUGHT };
			const nextRound = newRound(currentState);

			expect(nextRound.rerollsUsed).toBe(0);
		});
	});
});