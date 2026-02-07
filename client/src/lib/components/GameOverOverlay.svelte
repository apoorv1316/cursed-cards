<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { gameState } from '../stores/gameStore';
  import { AVATAR_ICONS, AVATAR_COLORS } from '../game/constants';
  import { goto } from '$app/navigation';

  $: isGameOver = $gameState?.phase === 'game_over';
  $: winner = $gameState?.players.find(p => p.id === $gameState?.winner);
  $: iWon = $gameState?.winner === $gameState?.myId;
</script>

{#if isGameOver && winner}
  <div class="fixed inset-0 z-50 flex items-center justify-center"
    transition:fade={{ duration: 300 }}>
    <div class="absolute inset-0 {iWon ? 'bg-purple-950/80' : 'bg-black/80'}"></div>

    <div class="relative text-center px-6" in:scale={{ duration: 500, start: 0.5, delay: 200 }}>
      {#if iWon}
        <div class="text-6xl mb-4">🏆</div>
        <h2 class="font-gothic text-4xl font-bold text-yellow-400 mb-2">
          Victory!
        </h2>
        <p class="text-purple-300 text-lg mb-6">You are the last sorcerer standing!</p>
      {:else}
        <div class="text-5xl mb-4">{AVATAR_ICONS[winner.avatar]}</div>
        <h2 class="font-gothic text-3xl font-bold mb-2"
          style="color: {AVATAR_COLORS[winner.avatar]};">
          {winner.name} Wins!
        </h2>
        <p class="text-cursed-muted text-lg mb-6">The last sorcerer standing.</p>
      {/if}

      <button
        class="px-8 py-3 bg-cursed-accent text-white rounded-lg font-bold text-lg
          hover:bg-purple-500 active:scale-95 transition-all"
        on:click={() => goto('/')}
      >
        Back to Menu
      </button>
    </div>
  </div>
{/if}
