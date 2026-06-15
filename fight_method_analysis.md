# Fight Method Analysis

## Overview
The `fight()` method in `/src/lib/index.ts` violates multiple Clean Code principles.
Below is a detailed analysis of all issues found and how to fix them.

---

## Critical Issues

### 1. **Excessive Nesting (Rule of Three Violation)**

**Problem:**
```typescript
if(hasInit){          // Level 1
    if(hasRound){     // Level 2
        if(!hasFought) { // Level 3
            // Business logic here
        }else{
            throw new Error('Round already played');
        }
    }else{
        throw new Error('Round not initialized');
    }
}else{
    throw new Error('Game not initialized');
}
```

**Why it's bad:**
- 3+ levels of nesting reduce readability dramatically
- Makes unit testing harder
- Violates the "Rule of Three" - max 2 levels of nesting for most functions
- Early returns and guard clauses should be used

**How to fix:**
Replace nested ifs with guard clauses at the beginning:
```typescript
function fight(...) {
    if (!hasInit) throw new Error('Game not initialized');
    if (!hasRound) throw new Error('Round not initialized');
    if (hasFought) throw new Error('Round already played');
    
    // Clean, flat business logic
}
```

---

### 2. **Parameter Bloat (Too Many Parameters)**

**Problem:**
```typescript
function fight(
    playerHealth: number,
    enemyHealth: number,
    playerWeapon: any,
    hasInit: boolean,      // State validation
    hasRound: boolean,     // State validation
    hasFought: boolean     // State validation
): Array<number|boolean>
```

**Why it's bad:**
- 6 parameters is too many (Clean Code recommends max 3)
- Mixes data (health, weapon) with validation booleans
- Violates Primitive Obsession principle
- Impossible to call without remembering exact order
- No way to extend without breaking API
- Hard to test - must set up 6 different scenarios

**How to fix:**
Use a **GameState object** instead:
```typescript
interface GameState {
    playerHealth: number;
    enemyHealth: number;
    playerWeapon: Weapon;
    isInitialized: boolean;
    roundActive: boolean;
    roundFought: boolean;
}

function fight(gameState: GameState): GameState {
    validateGameState(gameState);
    return executeRound(gameState);
}
```

---

### 3. **Massive Code Duplication**

**Problem:**
The weapon damage calculation switch statement appears **twice** - once for player, once for enemy:

```typescript
switch (playerWeapon.name) {
    case 'hatchet':
    case 'knife':
    case 'spear':
        playerDamages += 1;
        break;
    // ... 50+ lines ...
}

// Exact same logic repeated for enemyWeapon
switch (enemyWeapon.name) {
    case 'hatchet':
    case 'knife':
    case 'spear':
        enemyDamages += 1;
        break;
    // ... 50+ lines ...
}
```

**Why it's bad:**
- **DRY Violation** (Don't Repeat Yourself)
- If weapon damage changes, must update in 2 places
- Increases maintenance burden
- Easy to introduce bugs with inconsistencies
- Duplicated code = duplicated bugs

**How to fix:**
Extract into a shared **calculateDamage()** function:
```typescript
function calculateDamage(weapon: Weapon): number {
    switch (weapon.name) {
        case 'hatchet':
        case 'knife':
        case 'spear':
            return 1;
        case 'sword':
        case 'halberd':
            return 5;
        // ...
    }
}

const playerDamages = calculateDamage(playerWeapon);
const enemyDamages = calculateDamage(enemyWeapon);
```

---

### 4. **Unclear Return Type (Type Confusion)**

**Problem:**
```typescript
function fight(...): Array<number|boolean> {
    return [playerHealth, enemyHealth];
    // OR
    return [playerHealth, enemyHealth, enemyWeapon, true, true, false];
    // OR
    return [playerHealth, enemyHealth, enemyWeapon, true, false, true];
}

state.playerCurrentHealth = response[0];
state.enemyCurrentHealth = response[1];
state.enemyWeapon = response[2];
state.hasFought = response[3];
state.playerWon = response[4];
state.playerLost = response[5];
```

**Why it's bad:**
- `Array<number|boolean>` tells you nothing about structure
- Magic indices (0, 1, 2, 3...) are error-prone
- No IDE autocomplete
- Code is unreadable without documentation
- Easy to make mistakes: `response[4]` for what?
- Breaking changes if array length changes

**How to fix:**
Return a **typed object**:
```typescript
interface FightResult {
    playerHealth: number;
    enemyHealth: number;
    enemyWeapon: Weapon;
    hasFought: boolean;
    playerWon: boolean;
    playerLost: boolean;
}

function fight(gameState: GameState): FightResult {
    const playerDamages = calculateDamage(gameState.playerWeapon);
    const enemyDamages = calculateDamage(enemyWeapon);
    const { playerWins, damage } = determineWinner(playerDamages, enemyDamages);
    
    return {
        playerHealth: playerWins ? gameState.playerHealth : gameState.playerHealth - damage,
        enemyHealth: playerWins ? gameState.enemyHealth - damage : gameState.enemyHealth,
        enemyWeapon: enemyWeapon,
        hasFought: true,
        playerWon: playerWins,
        playerLost: !playerWins
    };
}
```

---

### 5. **Type Violation: `any` Type**

**Problem:**
```typescript
export let weaponList: any[] = [];

export function newRound(hasInit: boolean) {
    return {
        playerWeapon: weaponList[Math.floor(Math.random() * weaponList.length)],
        enemyWeapon: null,
        // ...
    }
}

function fight(
    playerHealth: number,
    enemyHealth: number,
    playerWeapon: any,
    // ...
): Array<number|boolean>
```

**Why it's bad:**
- Defeats the purpose of TypeScript
- No IDE autocomplete for weapon properties
- No compile-time error checking
- Weapon could be anything - string, object, null
- Runtime errors guaranteed
- Harder to understand code

**How to fix:**
Define **Weapon interface** with strict types:
```typescript
interface Weapon {
    name: string;
    description: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic';
    minHits?: number;
    maxHits?: number;
    baseDamage: number;
}

export let weaponList: Weapon[] = [];

function fight(gameState: GameState): FightResult {
    const playerWeapon: Weapon = gameState.playerWeapon;
    const enemyWeapon: Weapon = selectRandomWeapon(gameState.availableWeapons);
}
```

---

### 6. **Hard-Coded Magic Strings**

**Problem:**
```typescript
switch (playerWeapon.name) {
    case 'hatchet':
    case 'knife':
    case 'spear':
        playerDamages += 1;
        break;
    case 'sword':
    case 'halberd':
        playerDamages += 5;
        break;
    // ...
    default:
        throw new Error('Invalid weapon');
}
```

**Why it's bad:**
- Weapon names are scattered as strings throughout code
- If weapon name in JSON changes, code breaks silently
- No compile-time checking
- Hard to maintain weapon list
- No single source of truth

**How to fix:**
Use **enums for weapon names**:
```typescript
enum WeaponName {
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

interface Weapon {
    name: WeaponName;
    description: string;
    rarity: Rarity;
    baseDamage: number;
}
```

---

### 7. **Hard-Coded Magic Numbers**

**Problem:**
```typescript
case 'bow':
    playerDamages += 1 * (Math.floor(Math.random() * 5));
    break;
case 'crossbow':
    playerDamages += 2 * (Math.floor(Math.random() * 5));
    break;

if(playerHealth <= 0) {
    playerHealth = 0;
}

let playerMaxHealth = 10;
let enemyMaxHealth = 10;
```

**Why it's bad:**
- Numbers have no context
- Hard to understand business logic
- Impossible to change without searching entire codebase
- No explanation for why these values exist

**How to fix:**
Use **named constants**:
```typescript
const INITIAL_HEALTH = 10;
const MINIMUM_HEALTH = 0;

const WEAPON_STATS = {
    [WeaponName.BOW]: { baseDamage: 1, minHits: 1, maxHits: 5 },
    [WeaponName.CROSSBOW]: { baseDamage: 2, minHits: 1, maxHits: 5 },
    [WeaponName.DAGGER]: { baseDamage: 3, minHits: 0, maxHits: 0 },
};

function calculateDamage(weapon: Weapon): number {
    const stats = WEAPON_STATS[weapon.name];
    if (!stats.minHits) return stats.baseDamage;
    const hits = Math.floor(Math.random() * (stats.maxHits - stats.minHits + 1)) + stats.minHits;
    return stats.baseDamage * hits;
}
```

---

### 8. **Global State Mutation**

**Problem:**
```typescript
export let weaponList: any[] = [];

function fight(...) {
    // ...
    weaponList = weapons;
    let enemyWeapon = weaponList[Math.floor(Math.random() * weaponList.length)];
    // ...
}
```

**Why it's bad:**
- Global mutable state is **extremely hard to test**
- Side effects hidden in functions
- Race conditions possible
- Unpredictable behavior
- Functions are no longer "pure"
- Dependencies on global state are not visible in function signature

**How to fix:**
Pass state explicitly as parameters:
```typescript
function selectRandomWeapon(availableWeapons: Weapon[]): Weapon {
    return availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
}

function fight(gameState: GameState): FightResult {
    const enemyWeapon = selectRandomWeapon(gameState.availableWeapons);
    const result = executeRound(gameState.playerWeapon, enemyWeapon);
    return result;
}

// Easy to test in isolation
const testWeapons: Weapon[] = [{ name: WeaponName.SWORD, ... }];
const weapon = selectRandomWeapon(testWeapons);
```

---

### 9. **Inconsistent Comment Usage**

**Problem:**
```typescript
// reset weapon list so the enemy could play
weaponList = weapons;

// health cannot be negative
if(playerHealth <= 0) {
    playerHealth = 0;
}

// check if the game is over and the player has won
if(enemyHealth === 0) {
    return [playerHealth, enemyHealth, enemyWeapon, true, true, false];
}
```

**Why it's bad:**
- Comments explain **what the code does**, not **why**
- If code is clear, comments are unnecessary
- Comments can lie (become outdated)
- Comments show **code smell** - means code isn't self-explaining
- By Clean Code principle: **Code should be self-documenting**

**How to fix:**
Write **self-explanatory code**:
```typescript
function clampHealth(health: number): number {
    return Math.max(health, MINIMUM_HEALTH);
}

playerHealth = clampHealth(playerHealth);

if (isGameOver(playerHealth, enemyHealth)) {
    endGame();
}
```

---

### 10. **No Separation of Concerns**

**Problem:**
The `fight()` function does **too many things**:
1. Validates game state (hasInit, hasRound, hasFought)
2. Calculates player damage
3. Selects enemy weapon
4. Calculates enemy damage
5. Compares damages
6. Updates health
7. Determines win/loss conditions
8. Returns result in specific format

**Why it's bad:**
- **Single Responsibility Principle violation**
- Hard to test each piece independently
- Hard to reuse individual parts
- Hard to understand the flow
- Hard to modify one part without affecting others
- When one thing changes, entire function must be tested

**How to fix:**
Break into **smaller, focused functions**:
```typescript
function calculateDamage(weapon: Weapon): number { }

function determineWinner(playerDamage: number, enemyDamage: number): CombatResult { }

function applyDamage(health: number, damage: number): number {
    return Math.max(health - damage, MINIMUM_HEALTH);
}

function isGameOver(playerHealth: number, enemyHealth: number): boolean {
    return playerHealth === 0 || enemyHealth === 0;
}

function fight(gameState: GameState): FightResult {
    validateGameState(gameState);
    const enemyWeapon = selectRandomWeapon(gameState.availableWeapons);
    
    const playerDamage = calculateDamage(gameState.playerWeapon);
    const enemyDamage = calculateDamage(enemyWeapon);
    const combat = determineWinner(playerDamage, enemyDamage);
    
    const newPlayerHealth = applyDamage(gameState.playerHealth, combat.playerTakeDamage);
    const newEnemyHealth = applyDamage(gameState.enemyHealth, combat.enemyTakeDamage);
    
    return buildFightResult(newPlayerHealth, newEnemyHealth, enemyWeapon, isGameOver(newPlayerHealth, newEnemyHealth));
}
```

---

## Summary of Issues

| Issue | Severity | Impact |
|-------|----------|--------|
| Excessive Nesting | 🔴 High | Unreadable, hard to test |
| Parameter Bloat (6 params) | 🔴 High | Confusing API, hard to use |
| Massive Duplication | 🔴 High | Maintenance nightmare, bug source |
| Unclear Return Type | 🔴 High | Error-prone, no IDE support |
| `any` Type Usage | 🔴 High | No type safety |
| Magic Strings | 🟡 Medium | Brittle code |
| Magic Numbers | 🟡 Medium | Unclear intent |
| Global State Mutation | 🔴 High | Untestable, unpredictable |
| Over-commenting | 🟡 Medium | Code smell |
| No Separation of Concerns | 🔴 High | Untestable, inflexible |

---

## Proposed Refactoring Strategy

1. **Define proper types** (`Weapon`, `GameState`, `FightResult`)
2. **Extract weapon damage logic** into `Weapon.calculateDamage()` method
3. **Extract validation** into guard clauses at top
4. **Extract smaller functions** from the mega-function
5. **Replace booleans** with proper state object
6. **Use meaningful names** everywhere
7. **Return typed objects** instead of arrays
8. **Remove global state**
9. **Add proper tests** for each piece

This will transform the code from "spaghetti code" to clean, maintainable, testable code following Clean Code principles.