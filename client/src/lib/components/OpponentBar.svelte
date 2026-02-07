<script lang="ts">
  import { opponents, gameState } from '../stores/gameStore';
  import { AVATAR_ICONS, AVATAR_COLORS } from '../game/constants';

  export let onSelectTarget: ((playerId: string) => void) | null = null;

  $: targetMode = $gameState?.phase === 'target_select' &&
    $gameState?.pendingAction?.sourcePlayerId === $gameState?.myId;
</script>

<div class="flex flex-col gap-2 py-4 px-2 w-20">
  {#if targetMode}
    <div class="text-yellow-400 text-[9px] font-medium animate-pulse text-center mb-1 leading-tight">
      Pick target
    </div>
  {/if}

  {#each $opponents as player}
    <button
      class="flex flex-col items-center gap-1 transition-all duration-200 rounded-xl py-2 px-1
        {!player.isAlive ? 'opacity-40 grayscale' : ''}
        {$gameState?.currentPlayerId === player.id ? 'bg-cursed-accent/10 scale-105' : ''}
        {targetMode && player.isAlive ? 'cursor-pointer hover:scale-105 ring-2 ring-red-500/70 hover:ring-red-400' : ''}"
      on:click={() => {
        if (targetMode && player.isAlive && onSelectTarget) {
          onSelectTarget(player.id);
        }
      }}
      disabled={!targetMode || !player.isAlive}
    >
      <!-- Avatar -->
      <div class="w-11 h-11 rounded-full flex items-center justify-center text-lg
        border-2 relative shrink-0"
        style="border-color: {AVATAR_COLORS[player.avatar]}; background: {AVATAR_COLORS[player.avatar]}22;">
        {AVATAR_ICONS[player.avatar]}

        {#if $gameState?.currentPlayerId === player.id}
          <div class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse"></div>
        {/if}

        {#if !player.isConnected}
          <div class="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center text-[10px]">
            📡
          </div>
        {/if}
      </div>

      <!-- Name -->
      <span class="text-[10px] font-medium truncate w-full text-center leading-tight"
        style="color: {AVATAR_COLORS[player.avatar]};">
        {player.name}
      </span>

      <!-- Card count / status -->
      <span class="text-[9px] text-cursed-muted leading-tight">
        {player.isAlive ? `${player.handCount}🃏` : '💀'}
      </span>
    </button>
  {/each}
</div>
