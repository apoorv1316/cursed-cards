<script lang="ts">
  import Card from './Card.svelte';
  import { myHand, selectedCard, showCardDetail, previewHovered, isMyTurn, gameState } from '../stores/gameStore';
  import { get } from 'svelte/store';
  import type { Card as CardType } from '../game/types';

  let hoverTimer: ReturnType<typeof setTimeout> | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;
  let hoveredIndex: number | null = null;

  function onCardClick(card: CardType) {
    clearTimers();
    if ($selectedCard?.id === card.id && $showCardDetail) {
      dismiss();
    } else {
      selectedCard.set(card);
      showCardDetail.set(true);
    }
  }

  function onCardHover(card: CardType, hovering: boolean, index: number) {
    if (hovering) {
      hoveredIndex = index;
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }

      hoverTimer = setTimeout(() => {
        selectedCard.set(card);
        showCardDetail.set(true);
      }, 150);
    } else {
      hoveredIndex = null;
      if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }

      closeTimer = setTimeout(() => {
        if (!get(previewHovered)) {
          dismiss();
        }
      }, 300);
    }
  }

  $: if (!$previewHovered && $showCardDetail) {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (!get(previewHovered)) {
        if (!hoverTimer) {
          dismiss();
        }
      }
    }, 300);
  }

  function dismiss() {
    showCardDetail.set(false);
    selectedCard.set(null);
  }

  function clearTimers() {
    if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
  }

  $: phase = $gameState?.phase;
  $: canPlay = $isMyTurn && (phase === 'playing' || phase === 'draw_phase');
  $: cardCount = $myHand.length;

  // Fan layout calculations
  function getCardTransform(index: number, total: number, isHovered: boolean, isSelected: boolean) {
    if (total === 0) return { rotate: 0, x: 0, y: 0 };

    // Spread angle scales with card count
    const maxSpread = Math.min(total * 8, 50); // wider fan for more cards, cap at 50deg
    const startAngle = -maxSpread / 2;
    const step = total > 1 ? maxSpread / (total - 1) : 0;
    const angle = total > 1 ? startAngle + step * index : 0;

    // Arc: cards at edges dip lower (parabolic)
    const center = (total - 1) / 2;
    const distFromCenter = Math.abs(index - center) / (total > 1 ? center : 1);
    const yOffset = distFromCenter * distFromCenter * 25;

    // Horizontal spread
    const cardWidth = 110; // approximate card width with gaps
    const totalWidth = Math.min(total * cardWidth, 500);
    const x = total > 1 ? ((index / (total - 1)) - 0.5) * totalWidth : 0;

    // Lift on hover/select
    const liftY = isSelected ? -35 : isHovered ? -20 : 0;

    return {
      rotate: isHovered || isSelected ? 0 : angle,
      x,
      y: yOffset + liftY,
    };
  }
</script>

<div class="w-full pb-6 pt-2">
  {#if cardCount === 0}
    <div class="text-center text-cursed-muted text-sm py-4">No cards in hand</div>
  {:else}
    <div class="hand-container relative flex items-end justify-center"
      style="height: 180px;">
      {#each $myHand as card, i (card.id)}
        {@const isHovered = hoveredIndex === i}
        {@const isSelected = $selectedCard?.id === card.id}
        {@const t = getCardTransform(i, cardCount, isHovered, isSelected)}
        <div
          class="hand-card absolute transition-all duration-200 ease-out"
          style="
            transform: translateX({t.x}px) translateY({t.y}px) rotate({t.rotate}deg);
            transform-origin: center bottom;
            z-index: {isHovered || isSelected ? 50 : i};
          "
        >
          <Card
            {card}
            playable={canPlay}
            selected={isSelected}
            onClick={() => onCardClick(card)}
            onHover={(h) => onCardHover(card, h, i)}
          />
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .hand-card {
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
  }

  .hand-card:hover {
    z-index: 50 !important;
    filter: drop-shadow(0 8px 20px rgba(139, 92, 246, 0.25));
  }
</style>
