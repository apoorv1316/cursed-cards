<script lang="ts">
  import { fade, fly, scale } from 'svelte/transition';
  import { elasticOut } from 'svelte/easing';
  import { gameState } from '../stores/gameStore';
  import { getSocket } from '../stores/socketStore';

  $: isMe = $gameState?.pendingAction?.sourcePlayerId === $gameState?.myId;
  $: deckSize = $gameState?.deckCount ?? 0;

  let selectedPosition = 0;

  const positions = [
    { label: 'Top of deck', desc: 'Next card drawn', icon: '&#9650;' },
    { label: 'Near top', desc: '3 cards down', icon: '&#9652;' },
    { label: 'Middle', desc: 'Halfway through', icon: '&#9644;' },
    { label: 'Near bottom', desc: 'Deep in the deck', icon: '&#9662;' },
    { label: 'Bottom', desc: 'Last card', icon: '&#9660;' },
  ];

  function getActualPosition(idx: number): number {
    switch (idx) {
      case 0: return 0;
      case 1: return Math.min(3, deckSize);
      case 2: return Math.floor(deckSize / 2);
      case 3: return Math.max(0, deckSize - 3);
      case 4: return deckSize;
      default: return 0;
    }
  }

  function confirm() {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('reinsert_demon', { position: getActualPosition(selectedPosition) });
  }
</script>

{#if $gameState?.phase === 'counter_spell_reinsert' && isMe}
  <div class="fixed inset-0 z-50 flex items-center justify-center"
    transition:fade={{ duration: 300 }}>

    <!-- Backdrop with cyan/blue magic aura -->
    <div class="absolute inset-0 cs-backdrop"></div>

    <!-- Sparkle particles -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      {#each Array(12) as _, i}
        <div class="sparkle"
          style="--delay: {i * 0.25}s; --x: {5 + Math.random() * 90}%; --y: {5 + Math.random() * 90}%; --dur: {1.5 + Math.random() * 1.5}s;">
        </div>
      {/each}
    </div>

    <div class="relative mx-4 max-w-sm w-full"
      in:scale={{ duration: 500, easing: elasticOut, start: 0.7 }}>

      <!-- Shield icon -->
      <div class="text-center mb-4">
        <div class="inline-block cs-shield-icon text-6xl"
          in:scale={{ duration: 600, delay: 200, easing: elasticOut, start: 0.3 }}>
          &#10024;
        </div>
      </div>

      <!-- Card panel -->
      <div class="cs-panel rounded-2xl p-6 border border-sky-500/30">
        <h3 class="font-gothic text-2xl text-sky-300 font-black text-center mb-1 cs-title-glow">
          Counter Spell!
        </h3>
        <p class="text-sm text-sky-200/60 text-center mb-5">
          You survived! Choose where to hide the Demon's Bargain.
        </p>

        <div class="space-y-2">
          {#each positions as pos, i}
            <button
              class="w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200
                {selectedPosition === i
                  ? 'border-sky-400 bg-sky-500/15 shadow-lg shadow-sky-500/10'
                  : 'border-cursed-border/50 bg-cursed-card/50 hover:border-sky-500/30 hover:bg-sky-500/5'}"
              on:click={() => selectedPosition = i}
              in:fly={{ x: -20, duration: 300, delay: 300 + i * 80 }}
            >
              <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm shrink-0
                {selectedPosition === i ? 'border-sky-400 bg-sky-500/20' : 'border-cursed-border/50'}">
                {#if selectedPosition === i}
                  <div class="w-3 h-3 rounded-full bg-sky-400 cs-radio-glow"></div>
                {:else}
                  <span class="text-cursed-muted/50">{@html pos.icon}</span>
                {/if}
              </div>
              <div class="text-left">
                <span class="text-sm font-bold {selectedPosition === i ? 'text-sky-300' : 'text-cursed-text'}">
                  {pos.label}
                </span>
                <span class="text-xs text-cursed-muted ml-2">{pos.desc}</span>
              </div>
            </button>
          {/each}
        </div>

        <button
          class="w-full mt-5 py-3.5 rounded-xl font-gothic font-bold text-lg text-white
            relative overflow-hidden active:scale-[0.97] transition-transform"
          on:click={confirm}
          in:fly={{ y: 20, duration: 300, delay: 800 }}
        >
          <div class="absolute inset-0 bg-gradient-to-r from-sky-600 via-cyan-500 to-sky-600"></div>
          <div class="absolute inset-0 cs-confirm-shimmer"></div>
          <div class="absolute inset-0 rounded-xl cs-confirm-glow"></div>
          <span class="relative z-10">Seal the Demon</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .cs-backdrop {
    background: radial-gradient(ellipse at center, rgba(7, 89, 133, 0.75) 0%, rgba(3, 7, 18, 0.95) 70%);
  }

  .sparkle {
    position: absolute;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: #7dd3fc;
    left: var(--x);
    top: var(--y);
    animation: sparkle-pop var(--dur) ease-in-out infinite;
    animation-delay: var(--delay);
    box-shadow: 0 0 6px #7dd3fc;
  }

  @keyframes sparkle-pop {
    0%, 100% { opacity: 0; transform: scale(0); }
    50% { opacity: 1; transform: scale(1.5); }
  }

  .cs-shield-icon {
    filter: drop-shadow(0 0 20px rgba(14, 165, 233, 0.6)) drop-shadow(0 0 40px rgba(14, 165, 233, 0.3));
    animation: shield-float 2s ease-in-out infinite;
  }

  @keyframes shield-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }

  .cs-panel {
    background: linear-gradient(145deg, rgba(7, 89, 133, 0.15), rgba(12, 12, 21, 0.9), rgba(7, 89, 133, 0.1));
    backdrop-filter: blur(12px);
    box-shadow: 0 0 40px rgba(14, 165, 233, 0.1),
                inset 0 1px 0 rgba(125, 211, 252, 0.1);
  }

  .cs-title-glow {
    text-shadow: 0 0 15px rgba(14, 165, 233, 0.5),
                 0 0 30px rgba(14, 165, 233, 0.2);
  }

  .cs-radio-glow {
    box-shadow: 0 0 8px rgba(56, 189, 248, 0.6);
  }

  .cs-confirm-shimmer {
    background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.12) 55%, transparent 70%);
    animation: cs-shimmer 2.5s ease-in-out infinite;
  }
  @keyframes cs-shimmer {
    0% { transform: translateX(-150%); }
    100% { transform: translateX(150%); }
  }

  .cs-confirm-glow {
    animation: cs-glow 2s ease-in-out infinite;
  }
  @keyframes cs-glow {
    0%, 100% { box-shadow: 0 0 12px rgba(14, 165, 233, 0.2); }
    50% { box-shadow: 0 0 25px rgba(14, 165, 233, 0.4), 0 0 50px rgba(14, 165, 233, 0.1); }
  }
</style>
