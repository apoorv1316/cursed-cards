<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { me, gameState, myHand, showHowToPlay } from '../stores/gameStore';
  import { getSocket } from '../stores/socketStore';
  import { AVATAR_ICONS, AVATAR_COLORS, AVATAR_NAMES } from '../game/constants';

  let menuOpen = false;

  $: player = $me;
  $: avatar = player?.avatar ?? 0;
  $: cardCount = $myHand.length;
  $: roomCode = $gameState?.roomCode ?? '';

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  function closeMenu() {
    menuOpen = false;
  }

  function leaveGame() {
    const socket = getSocket();
    socket?.disconnect();
    goto('/');
  }
</script>

<!-- Profile button — fixed top-right -->
<div class="fixed top-3 right-3 z-30">
  <button
    class="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full
      bg-cursed-surface/90 backdrop-blur-sm border border-cursed-border
      hover:border-cursed-accent/50 transition-all active:scale-95"
    on:click={toggleMenu}
  >
    <span class="text-xs font-medium truncate max-w-[80px]"
      style="color: {AVATAR_COLORS[avatar]};">
      {player?.name ?? 'Player'}
    </span>
    <div class="w-8 h-8 rounded-full flex items-center justify-center text-base
      border-2 relative"
      style="border-color: {AVATAR_COLORS[avatar]}; background: {AVATAR_COLORS[avatar]}18;">
      {AVATAR_ICONS[avatar]}

      {#if player?.isAlive}
        <div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-cursed-surface"></div>
      {:else}
        <div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-cursed-surface"></div>
      {/if}
    </div>
  </button>

  <!-- Dropdown menu -->
  {#if menuOpen}
    <button class="fixed inset-0 z-30" on:click={closeMenu}></button>

    <div class="absolute top-full right-0 mt-2 z-40 w-56
      bg-cursed-surface border border-cursed-border rounded-xl shadow-2xl overflow-hidden"
      transition:fly={{ y: -10, duration: 200 }}
    >
      <!-- Player info header -->
      <div class="px-4 py-3 border-b border-cursed-border">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-full flex items-center justify-center text-xl
            border-2"
            style="border-color: {AVATAR_COLORS[avatar]}; background: {AVATAR_COLORS[avatar]}18;">
            {AVATAR_ICONS[avatar]}
          </div>
          <div>
            <p class="font-gothic font-bold text-sm" style="color: {AVATAR_COLORS[avatar]};">
              {player?.name}
            </p>
            <p class="text-[11px] text-cursed-muted">{AVATAR_NAMES[avatar]}</p>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="px-4 py-2.5 border-b border-cursed-border flex gap-4">
        <div class="text-center">
          <p class="text-sm font-bold text-cursed-text">{cardCount}</p>
          <p class="text-[10px] text-cursed-muted">Cards</p>
        </div>
        <div class="text-center">
          <p class="text-sm font-bold {player?.isAlive ? 'text-green-400' : 'text-red-400'}">
            {player?.isAlive ? 'Alive' : 'Dead'}
          </p>
          <p class="text-[10px] text-cursed-muted">Status</p>
        </div>
        <div class="text-center">
          <p class="text-sm font-bold text-cursed-accent font-mono">{roomCode}</p>
          <p class="text-[10px] text-cursed-muted">Room</p>
        </div>
      </div>

      <!-- Menu items -->
      <div class="py-1">
        <button
          class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-cursed-text
            hover:bg-cursed-card transition-colors text-left"
          on:click={() => { closeMenu(); showHowToPlay.set(true); }}
        >
          <span class="text-base w-5 text-center">📖</span>
          How to Play
        </button>

        <button
          class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-cursed-text
            hover:bg-cursed-card transition-colors text-left"
          on:click={() => {
            navigator.clipboard?.writeText(roomCode);
            closeMenu();
          }}
        >
          <span class="text-base w-5 text-center">📋</span>
          Copy Room Code
        </button>

        <div class="border-t border-cursed-border my-1"></div>

        <button
          class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400
            hover:bg-red-500/10 transition-colors text-left"
          on:click={leaveGame}
        >
          <span class="text-base w-5 text-center">🚪</span>
          Leave Game
        </button>
      </div>
    </div>
  {/if}
</div>
