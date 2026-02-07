<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { cubicOut, elasticOut } from 'svelte/easing';
  import { getSocket, connectSocket, disconnectSocket } from '$lib/stores/socketStore';
  import { lobbyState, gameState } from '$lib/stores/gameStore';
  import { AVATAR_ICONS, AVATAR_COLORS, AVATAR_NAMES } from '$lib/game/constants';
  import type { LobbyState, GameStateForPlayer } from '$lib/game/types';

  $: roomCode = $page.params.roomCode;
  $: playerName = $page.url.searchParams.get('name') || 'Player';

  let copied = false;
  let startPressed = false;

  function onLobbyUpdate(data: LobbyState) {
    lobbyState.set(data);
  }

  function onGameState(data: GameStateForPlayer) {
    gameState.set(data);
    goto(`/game/${roomCode}`);
  }

  onMount(() => {
    const socket = connectSocket();

    socket.off('lobby_update', onLobbyUpdate);
    socket.on('lobby_update', onLobbyUpdate);

    socket.off('game_state', onGameState);
    socket.on('game_state', onGameState);
  });

  onDestroy(() => {
    const socket = getSocket();
    if (socket) {
      socket.off('lobby_update', onLobbyUpdate);
      socket.off('game_state', onGameState);
    }
  });

  function startGame() {
    startPressed = true;
    const socket = getSocket();
    socket?.emit('start_game');
    setTimeout(() => startPressed = false, 2000);
  }

  function copyCode() {
    navigator.clipboard?.writeText(roomCode);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }

  function leave() {
    disconnectSocket();
    goto('/');
  }

  $: players = $lobbyState?.players ?? [];
  $: isHost = $lobbyState?.hostId === getSocket()?.id;
  $: canStart = isHost && players.length >= 2;
  $: emptySlots = Array(4 - players.length);
</script>

<div class="lobby-page min-h-screen flex flex-col items-center relative overflow-hidden">
  <!-- Animated background orbs -->
  <div class="absolute inset-0 pointer-events-none overflow-hidden">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
  </div>

  <!-- Top section: Title + Room Code -->
  <div class="relative z-10 text-center pt-10 pb-6" in:fly={{ y: -30, duration: 500, easing: cubicOut }}>
    <div class="flex items-center justify-center gap-2 mb-3">
      <span class="text-2xl">🃏</span>
      <h1 class="font-gothic text-lg font-bold text-cursed-muted tracking-widest uppercase">Cursed Cards</h1>
    </div>

    <!-- Room code badge -->
    <button
      class="room-code-badge group relative inline-block"
      on:click={copyCode}
    >
      <div class="relative px-8 py-3 rounded-2xl border border-cursed-accent/30
        bg-cursed-accent/5 backdrop-blur-sm transition-all
        group-hover:border-cursed-accent/60 group-hover:bg-cursed-accent/10
        group-active:scale-95">
        <p class="text-[10px] text-cursed-accent/70 uppercase tracking-widest mb-1">Share this code</p>
        <p class="font-gothic text-4xl font-black tracking-[0.5em] text-cursed-accent
          group-hover:text-purple-300 transition-colors">
          {roomCode}
        </p>
        <p class="text-[10px] text-cursed-muted mt-1 transition-colors group-hover:text-cursed-accent/70">
          {copied ? '✓ Copied to clipboard!' : 'Tap to copy'}
        </p>
      </div>
      <!-- Glow -->
      <div class="absolute inset-0 rounded-2xl pointer-events-none room-code-glow"></div>
    </button>
  </div>

  <!-- Divider -->
  <div class="w-48 h-px bg-gradient-to-r from-transparent via-cursed-border to-transparent mb-6"
    in:scale={{ duration: 600, delay: 200 }}></div>

  <!-- Arena: Player grid -->
  <div class="relative z-10 flex-1 w-full max-w-lg px-6" in:fade={{ duration: 400, delay: 200 }}>
    <p class="text-xs text-cursed-muted text-center mb-5 tracking-wider uppercase">
      Sorcerers in Arena — <span class="text-cursed-text font-medium">{players.length}</span> / 4
    </p>

    <div class="grid grid-cols-2 gap-4">
      <!-- Joined players -->
      {#each players as player, i (player.id)}
        <div class="player-card relative group"
          in:scale={{ duration: 400, delay: i * 150, easing: elasticOut, start: 0.5 }}>
          <!-- Card glow bg -->
          <div class="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style="background: radial-gradient(circle at center, {AVATAR_COLORS[player.avatar]}15 0%, transparent 70%);"></div>

          <div class="relative p-4 rounded-2xl border-2 bg-cursed-card/80 backdrop-blur-sm
            flex flex-col items-center gap-3 transition-all duration-300
            group-hover:border-opacity-80 group-hover:-translate-y-1"
            style="border-color: {AVATAR_COLORS[player.avatar]}44;">

            <!-- Avatar circle with animated ring -->
            <div class="relative">
              <div class="avatar-ring w-16 h-16 rounded-full flex items-center justify-center text-3xl
                relative z-10"
                style="background: {AVATAR_COLORS[player.avatar]}12;
                  border: 2px solid {AVATAR_COLORS[player.avatar]};
                  --ring-color: {AVATAR_COLORS[player.avatar]};">
                {AVATAR_ICONS[player.avatar]}
              </div>
              <!-- Pulse ring behind avatar -->
              <div class="absolute inset-0 rounded-full animate-ping opacity-20"
                style="border: 2px solid {AVATAR_COLORS[player.avatar]};"></div>

              {#if player.isHost}
                <div class="absolute -top-1 -right-1 z-20 w-6 h-6 rounded-full
                  bg-yellow-500/90 border-2 border-cursed-bg flex items-center justify-center"
                  in:scale={{ duration: 300, delay: 300 }}>
                  <span class="text-[10px]">👑</span>
                </div>
              {/if}
            </div>

            <!-- Name + Class -->
            <div class="text-center">
              <p class="font-gothic font-bold text-sm" style="color: {AVATAR_COLORS[player.avatar]};">
                {player.name}
              </p>
              <p class="text-[10px] text-cursed-muted mt-0.5">{AVATAR_NAMES[player.avatar]}</p>
            </div>

            <!-- Host label or Ready indicator -->
            {#if player.isHost}
              <div class="flex items-center gap-1.5 px-3 py-1 rounded-full
                bg-yellow-500/10 border border-yellow-500/30">
                <span class="text-[10px]">👑</span>
                <span class="text-[10px] text-yellow-400 font-bold tracking-wide uppercase">Host</span>
              </div>
            {:else}
              <div class="flex items-center gap-1.5 px-3 py-1 rounded-full
                bg-green-500/10 border border-green-500/20">
                <div class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                <span class="text-[10px] text-green-400 font-medium">Ready</span>
              </div>
            {/if}
          </div>
        </div>
      {/each}

      <!-- Empty slots -->
      {#each emptySlots as _, i}
        <div class="empty-slot relative"
          in:fade={{ duration: 300, delay: (players.length + i) * 150 }}>
          <div class="p-4 rounded-2xl border-2 border-dashed border-cursed-border/30
            flex flex-col items-center gap-3 min-h-[170px] justify-center">

            <!-- Pulsing question mark -->
            <div class="w-16 h-16 rounded-full border-2 border-cursed-border/40
              flex items-center justify-center empty-avatar">
              <span class="text-2xl text-cursed-border/60">?</span>
            </div>

            <div class="text-center">
              <p class="text-xs text-cursed-muted/60 font-medium">Waiting for</p>
              <p class="text-xs text-cursed-muted/60">sorcerer...</p>
            </div>

            <!-- Animated dots -->
            <div class="flex gap-1">
              <div class="w-1 h-1 rounded-full bg-cursed-muted/30 dot-1"></div>
              <div class="w-1 h-1 rounded-full bg-cursed-muted/30 dot-2"></div>
              <div class="w-1 h-1 rounded-full bg-cursed-muted/30 dot-3"></div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Bottom actions -->
  <div class="relative z-10 w-full max-w-lg px-6 pb-8 pt-6" in:fly={{ y: 40, duration: 400, delay: 400 }}>
    {#if isHost}
      <button
        class="start-btn w-full py-4 rounded-2xl font-gothic font-bold text-lg
          text-white relative overflow-hidden transition-all
          active:scale-[0.97]
          disabled:opacity-40 disabled:cursor-not-allowed
          {canStart ? 'hover:-translate-y-0.5' : ''}"
        disabled={!canStart}
        on:click={startGame}
      >
        <!-- Button bg layers -->
        <div class="absolute inset-0 bg-gradient-to-r from-purple-700 via-purple-600 to-purple-800
          {canStart ? '' : 'grayscale'}"></div>
        {#if canStart}
          <div class="absolute inset-0 start-btn-shimmer"></div>
        {/if}

        <!-- Border glow -->
        {#if canStart}
          <div class="absolute inset-0 rounded-2xl start-btn-glow"></div>
        {/if}

        <span class="relative z-10 flex items-center justify-center gap-2">
          {#if startPressed}
            <span class="inline-block animate-spin text-base">⚡</span>
            Starting...
          {:else if canStart}
            <span class="text-base">⚔️</span>
            Enter the Arena
          {:else}
            Awaiting Sorcerers...
          {/if}
        </span>
      </button>

      {#if !canStart}
        <p class="text-center text-[11px] text-cursed-muted mt-2">
          Need at least 2 players to begin
        </p>
      {/if}
    {:else}
      <div class="text-center py-4">
        <div class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
          bg-cursed-card/50 border border-cursed-border/50">
          <div class="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
          <span class="text-sm text-cursed-muted">Waiting for host to start...</span>
        </div>
      </div>
    {/if}

    <button
      class="w-full mt-3 py-2.5 rounded-xl text-xs text-cursed-muted/60
        hover:text-red-400/80 transition-colors"
      on:click={leave}
    >
      Leave Room
    </button>
  </div>
</div>

<style>
  /* Background orbs */
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.4;
  }
  .orb-1 {
    width: 300px; height: 300px;
    background: #8b5cf620;
    top: -100px; left: -100px;
    animation: orb-drift-1 12s ease-in-out infinite;
  }
  .orb-2 {
    width: 250px; height: 250px;
    background: #dc262615;
    bottom: -50px; right: -80px;
    animation: orb-drift-2 15s ease-in-out infinite;
  }
  .orb-3 {
    width: 200px; height: 200px;
    background: #0ea5e910;
    top: 40%; left: 50%;
    animation: orb-drift-3 10s ease-in-out infinite;
  }

  @keyframes orb-drift-1 {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(60px, 40px); }
  }
  @keyframes orb-drift-2 {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(-50px, -30px); }
  }
  @keyframes orb-drift-3 {
    0%, 100% { transform: translate(-50%, 0); }
    50% { transform: translate(-50%, -30px); }
  }

  /* Room code glow */
  .room-code-glow {
    animation: code-glow 3s ease-in-out infinite;
  }
  @keyframes code-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.08); }
    50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.18), 0 0 80px rgba(139, 92, 246, 0.05); }
  }

  /* Avatar ring glow */
  .avatar-ring {
    animation: ring-glow 2.5s ease-in-out infinite;
  }
  @keyframes ring-glow {
    0%, 100% {
      box-shadow: 0 0 8px color-mix(in srgb, var(--ring-color) 20%, transparent);
    }
    50% {
      box-shadow: 0 0 18px color-mix(in srgb, var(--ring-color) 40%, transparent),
                  0 0 35px color-mix(in srgb, var(--ring-color) 15%, transparent);
    }
  }

  /* Empty slot animation */
  .empty-avatar {
    animation: empty-pulse 3s ease-in-out infinite;
  }
  @keyframes empty-pulse {
    0%, 100% { border-color: rgba(42, 42, 64, 0.3); }
    50% { border-color: rgba(42, 42, 64, 0.6); }
  }

  /* Loading dots */
  .dot-1 { animation: dot-bounce 1.4s ease-in-out infinite; }
  .dot-2 { animation: dot-bounce 1.4s ease-in-out infinite 0.2s; }
  .dot-3 { animation: dot-bounce 1.4s ease-in-out infinite 0.4s; }
  @keyframes dot-bounce {
    0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
    40% { opacity: 1; transform: scale(1.5); }
  }

  /* Start button shimmer */
  .start-btn-shimmer {
    background: linear-gradient(
      105deg,
      transparent 30%,
      rgba(255, 255, 255, 0.08) 45%,
      rgba(255, 255, 255, 0.12) 50%,
      rgba(255, 255, 255, 0.08) 55%,
      transparent 70%
    );
    animation: shimmer 3s ease-in-out infinite;
  }
  @keyframes shimmer {
    0% { transform: translateX(-150%); }
    100% { transform: translateX(150%); }
  }

  /* Start button glow */
  .start-btn-glow {
    animation: start-glow 2s ease-in-out infinite;
  }
  @keyframes start-glow {
    0%, 100% {
      box-shadow: 0 0 15px rgba(139, 92, 246, 0.2),
                  inset 0 0 15px rgba(139, 92, 246, 0.05);
    }
    50% {
      box-shadow: 0 0 30px rgba(139, 92, 246, 0.4),
                  0 0 60px rgba(139, 92, 246, 0.1),
                  inset 0 0 20px rgba(139, 92, 246, 0.08);
    }
  }
</style>
