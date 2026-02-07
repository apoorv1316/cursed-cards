<script lang="ts">
  import { scale } from 'svelte/transition';
  import { gameState, isMyTurn } from '../stores/gameStore';

  export let onDraw: () => void;

  $: canDraw = $isMyTurn && ($gameState?.phase === 'draw_phase' || $gameState?.phase === 'playing');
  $: deckCount = $gameState?.deckCount ?? 0;

  // How many stacked cards to show (max 6)
  $: stackCount = Math.min(deckCount, 6);
</script>

<div class="draw-area flex flex-col items-center gap-3">
  <span class="text-[10px] text-cursed-muted uppercase tracking-wider">Deck</span>

  <button
    class="relative transition-all duration-300 deck-wrapper
      {canDraw ? 'cursor-pointer hover:scale-[1.03] active:scale-95 can-draw' : 'cursor-default opacity-70'}"
    on:click={() => { if (canDraw) onDraw(); }}
    disabled={!canDraw}
    in:scale={{ duration: 300 }}
  >
    <!-- Orbiting particles (only when drawable) -->
    {#if canDraw}
      <div class="absolute inset-[-20px] pointer-events-none">
        {#each Array(6) as _, i}
          <div class="orbit-particle"
            style="--orbit-delay: {i * -1.2}s; --orbit-size: {3 + (i % 3)}px;">
          </div>
        {/each}
      </div>

      <!-- Ground glow -->
      <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 w-28 h-6 pointer-events-none
        rounded-full deck-ground-glow"></div>
    {/if}

    <!-- Card stack -->
    <div class="relative" style="width: 88px; height: 124px;">
      <!-- Stacked cards behind -->
      {#each Array(stackCount) as _, i}
        {#if i < stackCount - 1}
          <div class="absolute rounded-xl deck-card-back pointer-events-none"
            style="
              width: 88px; height: 124px;
              top: {-(stackCount - 1 - i) * 3}px;
              left: {(stackCount - 1 - i) * 0.5}px;
              opacity: {0.25 + (i / stackCount) * 0.4};
              transform: rotate({(i - Math.floor(stackCount/2)) * 0.8}deg);
            ">
          </div>
        {/if}
      {/each}

      <!-- Top card (main) -->
      <div class="relative w-full h-full rounded-xl deck-card-back overflow-hidden
        {canDraw ? 'deck-glow' : ''}"
        style="z-index: {stackCount};">

        <!-- Ornate double border -->
        <div class="absolute inset-[3px] rounded-lg border border-purple-500/25 pointer-events-none"></div>
        <div class="absolute inset-[7px] rounded-md border border-amber-500/10 pointer-events-none"></div>

        <!-- Corner flourishes -->
        <div class="absolute top-[5px] left-[6px] pointer-events-none corner-flourish corner-tl">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 13V5C1 2.8 2.8 1 5 1H13" stroke="rgba(196,167,125,0.3)" stroke-width="1"/>
            <circle cx="2" cy="2" r="1.5" fill="rgba(196,167,125,0.25)"/>
          </svg>
        </div>
        <div class="absolute top-[5px] right-[6px] pointer-events-none corner-flourish corner-tr">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M13 13V5C13 2.8 11.2 1 9 1H1" stroke="rgba(196,167,125,0.3)" stroke-width="1"/>
            <circle cx="12" cy="2" r="1.5" fill="rgba(196,167,125,0.25)"/>
          </svg>
        </div>
        <div class="absolute bottom-[5px] left-[6px] pointer-events-none corner-flourish corner-bl">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1V9C1 11.2 2.8 13 5 13H13" stroke="rgba(196,167,125,0.3)" stroke-width="1"/>
            <circle cx="2" cy="12" r="1.5" fill="rgba(196,167,125,0.25)"/>
          </svg>
        </div>
        <div class="absolute bottom-[5px] right-[6px] pointer-events-none corner-flourish corner-br">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M13 1V9C13 11.2 11.2 13 9 13H1" stroke="rgba(196,167,125,0.3)" stroke-width="1"/>
            <circle cx="12" cy="12" r="1.5" fill="rgba(196,167,125,0.25)"/>
          </svg>
        </div>

        <!-- Center mystic design -->
        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <!-- Outer ring -->
          <div class="center-ring w-16 h-16 rounded-full border border-purple-500/20
            flex items-center justify-center">
            <!-- Inner ring -->
            <div class="center-ring-inner w-11 h-11 rounded-full border border-amber-500/15
              flex items-center justify-center">
              <!-- Mystic symbol -->
              <div class="relative">
                <div class="center-symbol text-2xl">&#10038;</div>
              </div>
            </div>
          </div>
          <!-- Label -->
          <span class="text-[7px] font-gothic font-bold uppercase tracking-[0.25em] text-purple-300/40 mt-1.5">
            Cursed Deck
          </span>
        </div>

        <!-- Rotating conic pattern -->
        <div class="absolute inset-0 pointer-events-none deck-pattern"></div>

        <!-- Shimmer sweep -->
        {#if canDraw}
          <div class="absolute inset-0 pointer-events-none deck-shimmer"></div>
        {/if}
      </div>

      <!-- Count badge -->
      <div class="absolute -bottom-2 -right-2 pointer-events-none"
        style="z-index: {stackCount + 1};">
        <div class="w-8 h-8 rounded-full bg-cursed-bg/90 border-2 border-purple-500/40
          flex items-center justify-center backdrop-blur-sm deck-badge">
          <span class="text-[11px] font-bold text-purple-300">{deckCount}</span>
        </div>
      </div>
    </div>
  </button>

  {#if canDraw}
    <span class="text-[10px] text-cursed-accent font-bold uppercase tracking-wider tap-draw-text">
      Tap to Draw
    </span>
  {:else}
    <span class="text-[10px] text-cursed-muted">{deckCount} card{deckCount !== 1 ? 's' : ''}</span>
  {/if}
</div>

<style>
  /* ── Card back ── */
  .deck-card-back {
    background: linear-gradient(145deg, #0d0d1a 0%, #1a0f2e 35%, #150a25 65%, #0d0d1a 100%);
    border: 2px solid rgba(139, 92, 246, 0.2);
    box-shadow: inset 0 0 20px rgba(139, 92, 246, 0.06),
                0 2px 8px rgba(0, 0, 0, 0.4);
  }

  /* ── Glow when drawable ── */
  .deck-glow {
    animation: deck-breathe 2.5s ease-in-out infinite;
    border-color: rgba(139, 92, 246, 0.35) !important;
  }

  @keyframes deck-breathe {
    0%, 100% {
      box-shadow: 0 0 15px rgba(139, 92, 246, 0.2),
                  0 0 30px rgba(139, 92, 246, 0.05),
                  inset 0 0 20px rgba(139, 92, 246, 0.06);
    }
    50% {
      box-shadow: 0 0 25px rgba(139, 92, 246, 0.4),
                  0 0 60px rgba(139, 92, 246, 0.12),
                  inset 0 0 30px rgba(139, 92, 246, 0.1);
    }
  }

  /* ── Center rings ── */
  .center-ring {
    animation: ring-rotate 25s linear infinite;
    box-shadow: 0 0 12px rgba(139, 92, 246, 0.08);
  }
  .center-ring-inner {
    animation: ring-rotate 18s linear infinite reverse;
    box-shadow: 0 0 8px rgba(196, 167, 125, 0.06);
  }

  @keyframes ring-rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* ── Center symbol ── */
  .center-symbol {
    color: rgba(196, 167, 125, 0.35);
    text-shadow: 0 0 12px rgba(196, 167, 125, 0.2);
    animation: symbol-pulse 3s ease-in-out infinite;
  }

  @keyframes symbol-pulse {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.1); }
  }

  /* ── Rotating conic pattern ── */
  .deck-pattern {
    background:
      repeating-conic-gradient(
        from 0deg at 50% 50%,
        rgba(139, 92, 246, 0.025) 0deg 15deg,
        transparent 15deg 30deg
      );
    animation: pattern-rotate 40s linear infinite;
    opacity: 0.8;
  }

  @keyframes pattern-rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* ── Shimmer sweep ── */
  .deck-shimmer {
    background: linear-gradient(
      110deg,
      transparent 25%,
      rgba(196, 167, 125, 0.06) 40%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(196, 167, 125, 0.06) 60%,
      transparent 75%
    );
    animation: shimmer-sweep 3.5s ease-in-out infinite;
  }

  @keyframes shimmer-sweep {
    0% { transform: translateX(-150%); }
    100% { transform: translateX(150%); }
  }

  /* ── Orbiting particles ── */
  .orbit-particle {
    position: absolute;
    width: var(--orbit-size);
    height: var(--orbit-size);
    border-radius: 50%;
    background: #a78bfa;
    top: 50%;
    left: 50%;
    box-shadow: 0 0 6px #a78bfa, 0 0 12px rgba(167, 139, 250, 0.3);
    animation: orbit 7s linear infinite;
    animation-delay: var(--orbit-delay);
  }

  @keyframes orbit {
    0% {
      transform: rotate(0deg) translateX(55px) rotate(0deg);
      opacity: 0.8;
    }
    25% { opacity: 0.4; }
    50% {
      transform: rotate(180deg) translateX(55px) rotate(-180deg);
      opacity: 0.9;
    }
    75% { opacity: 0.3; }
    100% {
      transform: rotate(360deg) translateX(55px) rotate(-360deg);
      opacity: 0.8;
    }
  }

  /* ── Ground glow ── */
  .deck-ground-glow {
    background: radial-gradient(ellipse, rgba(139, 92, 246, 0.25) 0%, transparent 70%);
    animation: ground-pulse 2.5s ease-in-out infinite;
  }

  @keyframes ground-pulse {
    0%, 100% { opacity: 0.5; transform: translateX(-50%) scaleX(1); }
    50% { opacity: 1; transform: translateX(-50%) scaleX(1.15); }
  }

  /* ── Badge pulse ── */
  .can-draw .deck-badge {
    animation: badge-glow 2s ease-in-out infinite;
  }

  @keyframes badge-glow {
    0%, 100% { box-shadow: 0 0 6px rgba(139, 92, 246, 0.2); }
    50% { box-shadow: 0 0 14px rgba(139, 92, 246, 0.5); }
  }

  /* ── Tap to draw text ── */
  .tap-draw-text {
    animation: tap-text-pulse 1.5s ease-in-out infinite;
  }

  @keyframes tap-text-pulse {
    0%, 100% { opacity: 0.7; letter-spacing: 0.1em; }
    50% { opacity: 1; letter-spacing: 0.15em; }
  }

  /* ── Hover float for the whole wrapper ── */
  .can-draw {
    animation: deck-float 3s ease-in-out infinite;
  }

  @keyframes deck-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  .can-draw:hover {
    animation: none;
  }
</style>
