<script lang="ts">
    import { fight, init, newRound, rerollWeapon } from "$lib";
    import { GameStatus, type GameState, INITIAL_HEALTH, MAX_REROLLS } from "$lib/types";

    let state: GameState | null = null;

    // --- Reactive status declarations ---

    $: initialized = state !== null;
    $: readyToFight = state?.status === GameStatus.READY_TO_FIGHT;
    $: fought = state?.status === GameStatus.FOUGHT;
    $: won = state?.status === GameStatus.WON;
    $: lost = state?.status === GameStatus.LOST;
    $: canReroll = readyToFight && (state?.rerollsUsed ?? MAX_REROLLS) < MAX_REROLLS;

    // --- Actions ---

    function triggerInit(): void {
        state = { ...init() };
    }

    function triggerFight(): void {
        if (!state) return;
        try {
            state = { ...fight(state) };
        } catch (error) {
            console.error(error);
        }
    }

    function triggerNewRound(): void {
        if (!state) return;
        try {
            state = { ...newRound(state) };
        } catch (error) {
            console.error(error);
        }
    }

    function triggerReroll(): void {
        if (!state) return;
        try {
            state = { ...rerollWeapon(state) };
        } catch (error) {
            console.error(error);
        }
    }
</script>

<section id="player" class="w-1/3">
    {#if initialized && state?.playerWeapon}
        <div class="flex flex-row items-center justify-between flex-wrap w-full">
            <div class="flex flex-col items-center justify-center w-full">
                <h1 class="text-2xl font-bold">Player</h1>
                <p class="text-lg">Health: {state.playerHealth} / {INITIAL_HEALTH}</p>
                <p class="text-lg">Weapon name: {state.playerWeapon.name}</p>
                <p class="text-lg">Weapon description: {state.playerWeapon.description}</p>
            </div>
        </div>
    {/if}
</section>

<section id="action">
    {#if !initialized}
        <button class="btn btn-xl variant-filled-primary" on:click={triggerInit}>Start</button>

    {:else if readyToFight}
        <button class="btn btn-xl variant-filled-error" on:click={triggerFight}>Fight</button>
        {#if canReroll}
            <button class="btn btn-xl variant-filled-warning" on:click={triggerReroll}>
                Reroll weapon ({MAX_REROLLS - (state?.rerollsUsed ?? 0)} left)
            </button>
        {/if}

    {:else if fought}
        <button class="btn btn-xl variant-filled-warning" on:click={triggerNewRound}>Next Round</button>

    {:else if won}
        <p class="p">You won !</p>
        <button class="btn btn-xl variant-filled-primary" on:click={triggerInit}>Play again</button>

    {:else if lost}
        <p class="p">You lost ...</p>
        <button class="btn btn-xl variant-filled-primary" on:click={triggerInit}>Play again</button>
    {/if}
</section>

<section id="enemy" class="w-1/3">
    {#if initialized}
        <div class="flex flex-row items-center justify-between flex-wrap w-full">
            <div class="flex flex-col items-center justify-center w-full">
                <h1 class="text-2xl font-bold">Enemy</h1>
                <p class="text-lg">Health: {state?.enemyHealth} / {INITIAL_HEALTH}</p>
                {#if state?.enemyWeapon}
                    <p class="text-lg">Weapon name: {state.enemyWeapon.name}</p>
                    <p class="text-lg">Weapon description: {state.enemyWeapon.description}</p>
                {/if}
            </div>
        </div>
    {/if}
</section>