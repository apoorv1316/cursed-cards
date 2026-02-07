<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { selectedCard, showCardDetail, previewHovered, isMyTurn, gameState } from '../stores/gameStore';
  import { CARD_INFO } from '../game/cardTypes';
  import { getSocket } from '../stores/socketStore';

  $: card = $selectedCard;
  $: info = card ? CARD_INFO[card.type] : null;
  $: phase = $gameState?.phase;

  $: canPlayCard = $isMyTurn && card &&
    card.type !== 'demons_bargain' &&
    card.type !== 'counter_spell' &&
    (phase === 'playing');

  $: needsTarget = card && ['doom_draw', 'soul_steal', 'cursed_gift'].includes(card.type);

  function playCard() {
    if (!card || !canPlayCard) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('play_card', { cardId: card.id });
    previewHovered.set(false);
    showCardDetail.set(false);
    selectedCard.set(null);
  }

  function onPreviewEnter() {
    previewHovered.set(true);
  }

  function onPreviewLeave() {
    previewHovered.set(false);
  }
</script>

{#if $showCardDetail && card && info}
  <!-- Full-screen glow spread -->
  <div class="fixed inset-0 z-40 pointer-events-none"
    transition:fade={{ duration: 300 }}
    style="background: radial-gradient(ellipse at center, {info.color}18 0%, {info.color}08 35%, transparent 70%);">
  </div>

  <!-- Centered card preview -->
  <div class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="pointer-events-auto flex flex-col items-center gap-4"
      on:pointerenter={onPreviewEnter}
      on:pointerleave={onPreviewLeave}
      in:fly={{ y: 120, duration: 350, easing: cubicOut }}
      out:fly={{ y: 80, duration: 200 }}>

      <!-- Big card with animated glow -->
      <div class="preview-card w-56 h-80 rounded-2xl overflow-hidden flex flex-col relative"
        style="
          border: 3px solid #ffffff;
          background: {info.color};
          --glow-color: {info.color};
          box-shadow: 0 0 20px {info.color}88, 0 4px 16px rgba(0,0,0,0.5);
        ">

        <!-- Inner white border -->
        <div class="absolute inset-[4px] rounded-xl border-2 border-white/30 pointer-events-none"></div>

        <!-- Top: Icon + Name -->
        <div class="relative flex items-center gap-2 px-4 pt-4 text-base">
          <span class="text-2xl">{info.icon}</span>
          <span class="font-gothic font-extrabold uppercase tracking-wide text-white"
            style="text-shadow: 0 1px 3px rgba(0,0,0,0.5);">
            {info.name}
          </span>
        </div>

        <!-- Category badge -->
        <div class="relative px-4 mt-1">
          <span class="text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-black/30 text-white border border-white/30">
            {info.category}
          </span>
        </div>

        <!-- Center: Big Icon -->
        <div class="relative flex-1 flex items-center justify-center">
          <span class="text-7xl" style="filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));">{info.icon}</span>
        </div>

        <!-- Bottom: Full Description -->
        <div class="relative px-4 pb-4">
          <div class="rounded-lg px-3 py-2 bg-black/35 border border-white/15">
            <p class="text-sm leading-relaxed font-bold text-white">
              {info.description}
            </p>
          </div>
          {#if needsTarget && canPlayCard}
            <p class="text-xs text-yellow-300 mt-2 font-bold" style="text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Requires a target player.</p>
          {/if}
        </div>

        <!-- Glow overlay for demon's bargain -->
        {#if card.type === 'demons_bargain'}
          <div class="absolute inset-0 rounded-2xl pointer-events-none demon-glow"></div>
        {/if}
      </div>

      <!-- Play button (only when playable) -->
      {#if canPlayCard}
        <button
          class="play-btn px-10 py-2.5 rounded-xl text-sm font-bold transition-all
            hover:brightness-125 active:scale-95"
          style="background: {info.color}; color: white;
            --btn-glow: {info.color};"
          in:fly={{ y: 20, duration: 250, delay: 100, easing: cubicOut }}
          on:click={playCard}
        >
          {needsTarget ? 'Play & Choose Target' : 'Play Card'}
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .preview-card {
    animation: card-glow 2.5s ease-in-out infinite;
  }

  @keyframes card-glow {
    0%, 100% {
      box-shadow:
        0 0 15px color-mix(in srgb, var(--glow-color) 30%, transparent),
        0 0 30px color-mix(in srgb, var(--glow-color) 15%, transparent);
      transform: translateY(0px);
    }
    50% {
      box-shadow:
        0 0 25px color-mix(in srgb, var(--glow-color) 50%, transparent),
        0 0 50px color-mix(in srgb, var(--glow-color) 25%, transparent),
        0 0 80px color-mix(in srgb, var(--glow-color) 10%, transparent);
      transform: translateY(-4px);
    }
  }

  .demon-glow {
    animation: demon-pulse 1.5s ease-in-out infinite;
  }

  @keyframes demon-pulse {
    0%, 100% {
      box-shadow: inset 0 0 20px rgba(153, 27, 27, 0.3);
    }
    50% {
      box-shadow: inset 0 0 40px rgba(153, 27, 27, 0.6);
    }
  }

  .play-btn {
    animation: btn-glow 2s ease-in-out infinite;
  }

  @keyframes btn-glow {
    0%, 100% {
      box-shadow:
        0 4px 15px color-mix(in srgb, var(--btn-glow) 40%, transparent);
    }
    50% {
      box-shadow:
        0 4px 25px color-mix(in srgb, var(--btn-glow) 60%, transparent),
        0 0 40px color-mix(in srgb, var(--btn-glow) 20%, transparent);
    }
  }
</style>
