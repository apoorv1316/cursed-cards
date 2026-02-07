<script lang="ts">
  import { fade, scale, fly } from 'svelte/transition';
  import { elasticOut, cubicOut } from 'svelte/easing';
  import { gameState } from '../stores/gameStore';
  import { getSocket } from '../stores/socketStore';

  $: isMe = $gameState?.pendingAction?.sourcePlayerId === $gameState?.myId;
  $: hasCounterSpell = $gameState?.myHand.some(c => c.type === 'counter_spell') ?? false;
  $: victimName = $gameState?.players.find(p => p.id === $gameState?.pendingAction?.sourcePlayerId)?.name ?? 'Someone';

  function useCounterSpell() {
    const socket = getSocket();
    if (!socket || !$gameState) return;
    const csCard = $gameState.myHand.find(c => c.type === 'counter_spell');
    if (!csCard) return;
    socket.emit('counter_spell_response', { useCounterSpell: true, cardId: csCard.id });
  }

  function acceptFate() {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('counter_spell_response', { useCounterSpell: false });
  }
</script>

{#if $gameState?.phase === 'demon_reveal'}
  <div class="fixed inset-0 z-50 flex items-center justify-center"
    transition:fade={{ duration: 300 }}>

    <!-- Backdrop with animated red vignette -->
    <div class="absolute inset-0 demon-backdrop"></div>

    <!-- Lightning cracks -->
    <div class="absolute inset-0 pointer-events-none demon-lightning"></div>

    <!-- Floating embers -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      {#each Array(8) as _, i}
        <div class="ember" style="--delay: {i * 0.3}s; --x: {10 + Math.random() * 80}%; --dur: {2 + Math.random() * 2}s;"></div>
      {/each}
    </div>

    <div class="relative text-center px-6 max-w-sm">
      <!-- Demon card flip-in -->
      <div class="mb-6" in:scale={{ duration: 600, easing: elasticOut, start: 0.1 }}>
        <div class="demon-card-reveal mx-auto w-40 h-56 rounded-2xl border-2 border-red-600
          flex flex-col items-center justify-center gap-2 relative overflow-hidden">
          <!-- Hellfire glow inside card -->
          <div class="absolute inset-0 demon-card-fire"></div>

          <div class="relative z-10">
            <div class="text-7xl demon-icon-pulse">😈</div>
          </div>
          <p class="relative z-10 font-gothic text-sm font-bold text-red-400 tracking-widest uppercase">
            Demon's Bargain
          </p>
        </div>
      </div>

      <!-- Title -->
      <h2 class="font-gothic text-4xl font-black text-red-500 mb-2 demon-text-glow"
        in:fly={{ y: 20, duration: 400, delay: 300 }}>
        Demon's Bargain!
      </h2>

      {#if isMe}
        <p class="text-red-300/80 mb-6 text-sm"
          in:fade={{ duration: 300, delay: 500 }}>
          {hasCounterSpell
            ? 'You have a Counter Spell! Use it to survive!'
            : 'You have no Counter Spell... Your fate is sealed.'}
        </p>

        <div class="flex gap-3 justify-center"
          in:fly={{ y: 20, duration: 300, delay: 600 }}>
          {#if hasCounterSpell}
            <button
              class="counter-spell-btn px-6 py-3 rounded-xl font-gothic font-bold text-lg
                text-white relative overflow-hidden active:scale-95 transition-transform"
              on:click={useCounterSpell}
            >
              <div class="absolute inset-0 bg-gradient-to-r from-sky-600 via-cyan-500 to-sky-600"></div>
              <div class="absolute inset-0 counter-btn-shimmer"></div>
              <div class="absolute inset-0 rounded-xl counter-btn-glow"></div>
              <span class="relative z-10 flex items-center gap-2">
                <span class="text-xl">&#10024;</span> Counter Spell!
              </span>
            </button>
          {/if}
          <button
            class="px-6 py-3 rounded-xl font-bold
              bg-red-900/80 border border-red-700/50 text-red-200
              hover:bg-red-800/80 active:scale-95 transition-all
              {hasCounterSpell ? 'text-sm opacity-70' : 'text-lg'}"
            on:click={acceptFate}
          >
            {hasCounterSpell ? 'Accept Fate' : 'Accept Elimination'}
          </button>
        </div>
      {:else}
        <p class="text-red-300/80 text-sm" in:fade={{ duration: 300, delay: 500 }}>
          <strong class="text-red-300">{victimName}</strong> drew a Demon's Bargain!
        </p>
        <div class="flex items-center justify-center gap-2 mt-3"
          in:fade={{ duration: 300, delay: 700 }}>
          <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span class="text-sm text-red-400/80">Waiting for their response...</span>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .demon-backdrop {
    background: radial-gradient(ellipse at center, rgba(127, 29, 29, 0.85) 0%, rgba(10, 0, 0, 0.95) 70%);
    animation: demon-bg-pulse 2s ease-in-out infinite;
  }

  @keyframes demon-bg-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.85; }
  }

  .demon-lightning {
    animation: lightning-flash 3s ease-in-out infinite;
  }
  @keyframes lightning-flash {
    0%, 90%, 100% { background: transparent; }
    92% { background: rgba(255, 100, 100, 0.06); }
    94% { background: transparent; }
    96% { background: rgba(255, 100, 100, 0.1); }
  }

  .ember {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #ff6b35;
    bottom: -10px;
    left: var(--x);
    animation: ember-rise var(--dur) ease-out infinite;
    animation-delay: var(--delay);
    box-shadow: 0 0 6px #ff6b35;
  }

  @keyframes ember-rise {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    100% { transform: translateY(-100vh) scale(0); opacity: 0; }
  }

  .demon-card-reveal {
    background: linear-gradient(145deg, #1a0000, #2d0a0a, #1a0000);
    box-shadow: 0 0 40px rgba(220, 38, 38, 0.4),
                0 0 80px rgba(220, 38, 38, 0.15),
                inset 0 0 30px rgba(220, 38, 38, 0.1);
  }

  .demon-card-fire {
    background: radial-gradient(ellipse at bottom, rgba(220, 38, 38, 0.25) 0%, transparent 60%);
    animation: fire-flicker 1.5s ease-in-out infinite alternate;
  }
  @keyframes fire-flicker {
    0% { opacity: 0.5; transform: scaleY(1); }
    100% { opacity: 1; transform: scaleY(1.1); }
  }

  .demon-icon-pulse {
    animation: demon-icon-beat 1s ease-in-out infinite;
    filter: drop-shadow(0 0 15px rgba(220, 38, 38, 0.6));
  }
  @keyframes demon-icon-beat {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.12); }
  }

  .demon-text-glow {
    text-shadow: 0 0 20px rgba(220, 38, 38, 0.6),
                 0 0 40px rgba(220, 38, 38, 0.3);
  }

  .counter-spell-btn {
    box-shadow: 0 0 20px rgba(14, 165, 233, 0.3);
  }

  .counter-btn-shimmer {
    background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.15) 55%, transparent 70%);
    animation: counter-shimmer 2s ease-in-out infinite;
  }
  @keyframes counter-shimmer {
    0% { transform: translateX(-150%); }
    100% { transform: translateX(150%); }
  }

  .counter-btn-glow {
    animation: counter-glow 1.5s ease-in-out infinite;
  }
  @keyframes counter-glow {
    0%, 100% { box-shadow: 0 0 15px rgba(14, 165, 233, 0.3), inset 0 0 10px rgba(14, 165, 233, 0.05); }
    50% { box-shadow: 0 0 30px rgba(14, 165, 233, 0.5), 0 0 60px rgba(14, 165, 233, 0.15), inset 0 0 15px rgba(14, 165, 233, 0.08); }
  }
</style>
