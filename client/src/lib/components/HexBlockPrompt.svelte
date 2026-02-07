<script lang="ts">
  import { fade, fly, scale } from 'svelte/transition';
  import { elasticOut } from 'svelte/easing';
  import { onDestroy } from 'svelte';
  import { gameState } from '../stores/gameStore';
  import { getSocket } from '../stores/socketStore';
  import { CARD_INFO } from '../game/cardTypes';

  $: pa = $gameState?.pendingAction;
  $: isHexWindow = $gameState?.phase === 'hex_window';
  $: amSource = pa?.sourcePlayerId === $gameState?.myId;
  $: alreadyResponded = pa?.respondedPlayers?.includes($gameState?.myId ?? '') ?? false;

  $: hasHexBlock = $gameState?.myHand.some(c => c.type === 'hex_block') ?? false;
  $: canRespond = isHexWindow && !amSource && !alreadyResponded && hasHexBlock;

  $: actionName = pa?.cardType ? CARD_INFO[pa.cardType]?.name ?? pa.cardType : 'action';
  $: actionIcon = pa?.cardType ? CARD_INFO[pa.cardType]?.icon ?? '?' : '?';
  $: sourceName = $gameState?.players.find(p => p.id === pa?.sourcePlayerId)?.name ?? 'Someone';

  $: timeLeft = pa?.hexDeadline ? Math.max(0, Math.ceil((pa.hexDeadline - Date.now()) / 1000)) : 0;

  let interval: ReturnType<typeof setInterval>;
  $: if (isHexWindow && pa?.hexDeadline) {
    clearInterval(interval);
    interval = setInterval(() => {
      timeLeft = Math.max(0, Math.ceil(((pa?.hexDeadline ?? 0) - Date.now()) / 1000));
      if (timeLeft <= 0) clearInterval(interval);
    }, 100);
  }

  onDestroy(() => clearInterval(interval));

  function useHexBlock() {
    const socket = getSocket();
    if (!socket || !$gameState) return;
    const hexCard = $gameState.myHand.find(c => c.type === 'hex_block');
    if (!hexCard) return;
    socket.emit('hex_block_response', { useHexBlock: true, cardId: hexCard.id });
  }

  function pass() {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('hex_block_response', { useHexBlock: false });
  }
</script>

{#if isHexWindow && !amSource && !alreadyResponded}
  <div class="fixed bottom-32 left-4 right-4 z-40 max-w-md mx-auto"
    in:fly={{ y: 80, duration: 400, easing: elasticOut }}
    out:fade={{ duration: 200 }}>
    <div class="hex-panel rounded-2xl p-5 border border-green-500/30 relative overflow-hidden">
      <!-- Animated border glow -->
      <div class="absolute inset-0 rounded-2xl hex-border-glow pointer-events-none"></div>

      <!-- Header -->
      <div class="flex items-center gap-3 mb-3 relative z-10">
        <div class="hex-shield-icon w-12 h-12 rounded-full bg-green-500/15 border border-green-500/40
          flex items-center justify-center text-2xl shrink-0">
          &#128737;
        </div>
        <div class="flex-1">
          <h3 class="font-gothic text-lg text-green-300 font-bold">Hex Block?</h3>
          <p class="text-xs text-cursed-muted">
            {sourceName} played <strong class="text-cursed-text">{actionIcon} {actionName}</strong>
          </p>
        </div>
        <!-- Timer -->
        <div class="hex-timer w-10 h-10 rounded-full flex items-center justify-center
          text-sm font-mono font-bold
          {timeLeft <= 1 ? 'text-red-400 border-red-500/50' : 'text-yellow-300 border-yellow-500/40'}"
          style="border-width: 2px; border-style: solid;">
          {timeLeft}
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex gap-3 relative z-10">
        <button
          class="flex-1 py-3 rounded-xl text-sm font-medium
            bg-cursed-card/80 border border-cursed-border/50 text-cursed-muted
            hover:bg-cursed-card hover:border-cursed-muted active:scale-95 transition-all"
          on:click={pass}
        >
          Let it pass
        </button>
        {#if hasHexBlock}
          <button
            class="flex-1 py-3 rounded-xl font-gothic font-bold text-white
              relative overflow-hidden active:scale-95 transition-transform"
            on:click={useHexBlock}
          >
            <div class="absolute inset-0 bg-gradient-to-r from-green-700 via-emerald-600 to-green-700"></div>
            <div class="absolute inset-0 hex-btn-shimmer"></div>
            <div class="absolute inset-0 rounded-xl hex-btn-glow"></div>
            <span class="relative z-10 flex items-center justify-center gap-1.5">
              &#128737; Block!
            </span>
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .hex-panel {
    background: linear-gradient(145deg, rgba(22, 101, 52, 0.12), rgba(12, 12, 21, 0.95), rgba(22, 101, 52, 0.08));
    backdrop-filter: blur(12px);
    box-shadow: 0 -4px 30px rgba(34, 197, 94, 0.1),
                0 8px 30px rgba(0, 0, 0, 0.4);
  }

  .hex-border-glow {
    animation: hex-border-pulse 2s ease-in-out infinite;
  }
  @keyframes hex-border-pulse {
    0%, 100% { box-shadow: inset 0 0 15px rgba(34, 197, 94, 0.05); }
    50% { box-shadow: inset 0 0 25px rgba(34, 197, 94, 0.12); }
  }

  .hex-shield-icon {
    animation: hex-icon-pulse 1.5s ease-in-out infinite;
  }
  @keyframes hex-icon-pulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 10px rgba(34, 197, 94, 0.15); }
    50% { transform: scale(1.08); box-shadow: 0 0 20px rgba(34, 197, 94, 0.3); }
  }

  .hex-timer {
    animation: timer-tick 1s ease-in-out infinite;
  }
  @keyframes timer-tick {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  .hex-btn-shimmer {
    background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.1) 55%, transparent 70%);
    animation: hex-shimmer 2s ease-in-out infinite;
  }
  @keyframes hex-shimmer {
    0% { transform: translateX(-150%); }
    100% { transform: translateX(150%); }
  }

  .hex-btn-glow {
    animation: hex-glow 1.5s ease-in-out infinite;
  }
  @keyframes hex-glow {
    0%, 100% { box-shadow: 0 0 10px rgba(34, 197, 94, 0.2); }
    50% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.4), 0 0 40px rgba(34, 197, 94, 0.1); }
  }
</style>
