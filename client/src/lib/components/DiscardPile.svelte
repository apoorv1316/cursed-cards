<script lang="ts">
  import { CARD_INFO } from '../game/cardTypes';
  import { gameState } from '../stores/gameStore';
  import { fly } from 'svelte/transition';

  $: discardPile = $gameState?.discardPile ?? [];
  $: discardCount = discardPile.length;
  // Show last 7 cards max for the fan
  $: visibleCards = discardPile.slice(-7);

  // Fan cards in a half-circle arc from left to right
  function getCardStyle(index: number, total: number) {
    const spreadAngle = 120; // total arc degrees
    const startAngle = -spreadAngle / 2;
    const step = total > 1 ? spreadAngle / (total - 1) : 0;
    const angle = total > 1 ? startAngle + step * index : 0;

    // Arc radius for vertical offset (cards at edges are lower)
    const normalizedPos = total > 1 ? (index / (total - 1)) * 2 - 1 : 0; // -1 to 1
    const yOffset = normalizedPos * normalizedPos * 20; // parabolic curve

    return {
      rotate: angle,
      translateY: yOffset,
    };
  }
</script>

<div class="discard-area flex flex-col items-center gap-2">
  <span class="text-[10px] text-cursed-muted uppercase tracking-wider">Discard</span>

  <div class="relative w-48 h-40 flex items-end justify-center">
    {#if visibleCards.length > 0}
      {#each visibleCards as card, i (card.id)}
        {@const info = CARD_INFO[card.type]}
        {@const isTop = i === visibleCards.length - 1}
        {@const style = getCardStyle(i, visibleCards.length)}
        <div
          class="absolute bottom-4"
          style="transform: rotate({style.rotate}deg) translateY({style.translateY}px);
            transform-origin: center bottom;
            z-index: {i};"
          in:fly={{ y: -60, duration: 300 }}
        >
          <div class="w-16 h-24 rounded-lg border-2 overflow-hidden flex flex-col bg-cursed-card
            transition-all duration-200
            {isTop ? 'shadow-lg' : 'shadow-sm'}"
            style="border-color: {info.color}{isTop ? '' : '55'};
              box-shadow: 0 0 {isTop ? '10' : '3'}px {info.color}{isTop ? '44' : '18'};
              opacity: {isTop ? 1 : 0.55 + i * 0.06};">
            <!-- Top: Icon + Name -->
            <div class="flex items-center gap-0.5 px-1 pt-1 text-[7px]">
              <span class="text-[10px]">{info.icon}</span>
              <span class="font-gothic font-bold truncate" style="color: {info.color};">
                {info.name}
              </span>
            </div>
            <!-- Center icon -->
            <div class="flex-1 flex items-center justify-center">
              <span class="text-xl">{info.icon}</span>
            </div>
          </div>
        </div>
      {/each}
    {:else}
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="w-16 h-24 rounded-lg border-2 border-dashed border-cursed-border/30
          flex items-center justify-center">
          <span class="text-[10px] text-cursed-muted/40">Empty</span>
        </div>
      </div>
    {/if}
  </div>

  {#if discardCount > 0}
    <span class="text-[10px] text-cursed-muted">{discardCount} card{discardCount !== 1 ? 's' : ''}</span>
  {/if}
</div>
