<script lang="ts">
  import { fly, scale } from 'svelte/transition';
  import { CARD_INFO } from '../game/cardTypes';
  import type { Card } from '../game/types';

  export let card: Card;
  export let small = false;
  export let faceDown = false;
  export let playable = false;
  export let selected = false;
  export let onClick: (() => void) | null = null;
  export let onHover: ((hovering: boolean) => void) | null = null;

  $: info = CARD_INFO[card.type];
</script>

<button
  class="card-wrapper relative flex-shrink-0 transition-all duration-200 select-none
    {small ? 'w-20 h-28' : 'w-36 h-52'}
    {playable ? 'cursor-pointer hover:-translate-y-3 active:scale-95' : 'cursor-default'}
    {selected ? 'ring-2 ring-cursed-accent -translate-y-4 shadow-lg shadow-purple-500/30' : ''}"
  on:click={() => onClick?.()}
  on:pointerenter={() => onHover?.(true)}
  on:pointerleave={() => onHover?.(false)}
  disabled={!onClick}
  in:scale={{ duration: 300, start: 0.8 }}
>
  {#if faceDown}
    <div class="w-full h-full rounded-xl border-2 overflow-hidden relative
      flex items-center justify-center"
      style="background: linear-gradient(145deg, #0d0d1a 0%, #1a0f2e 40%, #12081f 100%);
        border-color: rgba(139, 92, 246, 0.25);
        box-shadow: inset 0 0 20px rgba(139, 92, 246, 0.06);">
      <!-- Inner border -->
      <div class="absolute inset-[2px] rounded-lg border border-purple-500/20 pointer-events-none"></div>
      <!-- Corner diamonds -->
      <div class="absolute top-1.5 left-1.5 text-[6px] text-amber-400/40">&#9830;</div>
      <div class="absolute top-1.5 right-1.5 text-[6px] text-amber-400/40">&#9830;</div>
      <div class="absolute bottom-1.5 left-1.5 text-[6px] text-amber-400/40">&#9830;</div>
      <div class="absolute bottom-1.5 right-1.5 text-[6px] text-amber-400/40">&#9830;</div>
      <!-- Center symbol -->
      <span class="{small ? 'text-lg' : 'text-2xl'} text-amber-400/25">&#10038;</span>
    </div>
  {:else}
    <div class="card-face w-full h-full rounded-xl overflow-hidden flex flex-col relative"
      style="
        border: 3px solid #ffffff;
        background: {info.color};
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      ">

      <!-- Inner white border accent -->
      <div class="absolute inset-[3px] rounded-lg border-2 border-white/30 pointer-events-none"></div>

      <!-- Top: Icon + Name -->
      <div class="relative flex items-center gap-1.5 px-2.5 pt-2.5 {small ? 'text-[9px]' : 'text-xs'}">
        <span class="{small ? 'text-sm' : 'text-lg'}">{info.icon}</span>
        <span class="font-gothic font-extrabold uppercase tracking-wide truncate text-white"
          style="text-shadow: 0 1px 3px rgba(0,0,0,0.5);">
          {info.name}
        </span>
      </div>

      <!-- Center: Big Icon -->
      <div class="relative flex-1 flex items-center justify-center">
        <span class="{small ? 'text-3xl' : 'text-5xl'}"
          style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">{info.icon}</span>
      </div>

      <!-- Bottom: Description -->
      {#if !small}
        <div class="relative px-2.5 pb-2.5">
          <div class="rounded-md px-2 py-1.5 bg-black/35 border border-white/15">
            <p class="text-[10px] leading-snug font-bold text-white line-clamp-3">
              {info.description}
            </p>
          </div>
        </div>
      {/if}

      <!-- Glow overlay for demon's bargain -->
      {#if card.type === 'demons_bargain'}
        <div class="absolute inset-0 rounded-xl pointer-events-none demons-bargain-glow"
          style="box-shadow: inset 0 0 25px rgba(0, 0, 0, 0.4);"></div>
      {/if}
    </div>
  {/if}
</button>

<style>
  .demons-bargain-glow {
    animation: demons-pulse 1.5s ease-in-out infinite;
  }

  @keyframes demons-pulse {
    0%, 100% {
      box-shadow: inset 0 0 25px rgba(153, 27, 27, 0.4);
    }
    50% {
      box-shadow: inset 0 0 40px rgba(153, 27, 27, 0.7), 0 0 15px rgba(153, 27, 27, 0.3);
    }
  }
</style>
