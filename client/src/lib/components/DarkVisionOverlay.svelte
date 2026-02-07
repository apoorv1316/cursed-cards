<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { gameState } from '../stores/gameStore';
  import { getSocket } from '../stores/socketStore';
  import Card from './Card.svelte';

  $: isDarkVision = $gameState?.phase === 'dark_vision';
  $: isMe = $gameState?.pendingAction?.sourcePlayerId === $gameState?.myId;
  $: peekedCards = $gameState?.pendingAction?.peekedCards ?? [];

  function done() {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('dark_vision_done');
  }
</script>

{#if isDarkVision && isMe}
  <div class="fixed inset-0 z-50 flex items-center justify-center"
    transition:fade={{ duration: 200 }}>
    <div class="absolute inset-0 bg-black/70"></div>

    <div class="relative text-center px-6" in:fly={{ y: 30, duration: 300 }}>
      <h3 class="font-gothic text-xl text-blue-400 font-bold mb-1">
        👁 Dark Vision
      </h3>
      <p class="text-sm text-cursed-muted mb-4">Top 3 cards of the deck:</p>

      <div class="flex gap-3 justify-center mb-6">
        {#each peekedCards as card, i}
          <div class="relative">
            <Card {card} />
            <div class="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-blue-600
              flex items-center justify-center text-[10px] font-bold text-white">
              {i + 1}
            </div>
          </div>
        {/each}
      </div>

      <button
        class="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold
          hover:bg-blue-500 active:scale-95 transition-all"
        on:click={done}
      >
        Got it
      </button>
    </div>
  </div>
{/if}
