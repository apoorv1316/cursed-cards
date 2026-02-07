<script lang="ts">
  import { gameState, isMyTurn, currentPlayer } from '../stores/gameStore';
  import { AVATAR_ICONS, AVATAR_COLORS } from '../game/constants';
  import { scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  $: phase = $gameState?.phase;
  $: player = $currentPlayer;

  $: phaseLabel = (() => {
    switch (phase) {
      case 'playing': return $isMyTurn ? 'Your Turn' : `${player?.name}'s Turn`;
      case 'draw_phase': return $isMyTurn ? 'Draw a Card' : `${player?.name} is Drawing`;
      case 'hex_window': return 'Hex Block Window';
      case 'demon_reveal': return "Demon's Bargain!";
      case 'counter_spell_reinsert': return 'Reinserting Demon';
      case 'target_select': return 'Choose a Target';
      case 'dark_vision': return 'Peeking at Deck';
      case 'game_over': return 'Game Over!';
      default: return '';
    }
  })();

  $: subLabel = (() => {
    if (phase === 'playing' && $isMyTurn) return 'Play a card or draw from the deck';
    if (phase === 'draw_phase' && $isMyTurn) return 'Draw to end your turn';
    if (phase === 'playing' && !$isMyTurn) return 'Waiting for their move...';
    return '';
  })();
</script>

<div class="text-center px-4 pt-4 pb-2">
  {#if $isMyTurn}
    <!-- Your turn: large and prominent -->
    <div class="turn-indicator-mine" in:scale={{ duration: 300, easing: cubicOut, start: 0.9 }}>
      {#if player}
        <span class="text-2xl mr-1">{AVATAR_ICONS[player.avatar]}</span>
      {/if}
      <h2 class="font-gothic text-3xl font-black text-cursed-accent tracking-wide
        drop-shadow-[0_0_12px_rgba(139,92,246,0.5)]">
        {phaseLabel}
      </h2>
    </div>
    {#if subLabel}
      <p class="text-xs text-cursed-muted mt-1">{subLabel}</p>
    {/if}
  {:else}
    <!-- Other player's turn: same centered style, just smaller -->
    <div class="flex items-center justify-center gap-1.5">
      {#if player}
        <span class="text-lg">{AVATAR_ICONS[player.avatar]}</span>
      {/if}
      <h2 class="font-gothic text-xl font-bold text-cursed-muted tracking-wide">
        {phaseLabel}
      </h2>
    </div>
    {#if subLabel}
      <p class="text-[11px] text-cursed-muted/50 mt-0.5">{subLabel}</p>
    {/if}
  {/if}
</div>

<style>
  .turn-indicator-mine {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    animation: turn-pulse 2s ease-in-out infinite;
  }

  @keyframes turn-pulse {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.15); }
  }
</style>
