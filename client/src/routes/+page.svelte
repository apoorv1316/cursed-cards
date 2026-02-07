<script lang="ts">
  import { fade, fly, scale } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { connectSocket, getSocket, socketError } from '$lib/stores/socketStore';
  import { showHowToPlay, resetGameState, lobbyState } from '$lib/stores/gameStore';
  import { AVATAR_ICONS, AVATAR_COLORS, AVATAR_NAMES } from '$lib/game/constants';
  import type { LobbyState } from '$lib/game/types';

  let playerName = '';
  let roomCode = '';
  let selectedAvatar = 0;
  let mode: 'menu' | 'create' | 'join' = 'menu';
  let loading = false;
  let joiningRoom = false;

  // Client-side validation
  $: nameTrimmed = playerName.trim();
  $: nameValid = nameTrimmed.length >= 2 && nameTrimmed.length <= 20 && /^[a-zA-Z0-9 _\-]+$/.test(nameTrimmed);
  $: nameHint = (() => {
    if (nameTrimmed.length === 0) return '';
    if (nameTrimmed.length < 2) return 'Name must be at least 2 characters';
    if (!/^[a-zA-Z0-9 _\-]+$/.test(nameTrimmed)) return 'Only letters, numbers, spaces, hyphens allowed';
    return '';
  })();
  $: codeTrimmed = roomCode.toUpperCase().trim();
  $: codeValid = /^[A-Z]{4}$/.test(codeTrimmed);
  $: codeHint = (() => {
    if (codeTrimmed.length === 0) return '';
    if (codeTrimmed.length < 4) return `${4 - codeTrimmed.length} more letter${4 - codeTrimmed.length > 1 ? 's' : ''} needed`;
    if (!codeValid) return 'Code must be 4 letters';
    return '';
  })();

  onMount(() => {
    resetGameState();
    const socket = connectSocket();

    // Leave any previous room (e.g. after game over)
    socket.emit('leave_room');

    // Persistent listener: always update lobbyState store
    socket.off('lobby_update');
    socket.on('lobby_update', (data: LobbyState) => {
      lobbyState.set(data);

      // If we're waiting for a join confirmation, navigate now
      if (joiningRoom) {
        joiningRoom = false;
        loading = false;
        goto(`/lobby/${data.roomCode}?name=${encodeURIComponent(playerName)}`);
      }
    });

    socket.off('room_created');
    socket.on('room_created', ({ roomCode }: { roomCode: string }) => {
      loading = false;
      goto(`/lobby/${roomCode}?name=${encodeURIComponent(playerName)}`);
    });

    socket.off('error');
    socket.on('error', (data: { message: string }) => {
      socketError.set(data.message);
      setTimeout(() => socketError.set(null), 4000);
      loading = false;
      joiningRoom = false;
    });
  });

  function createRoom() {
    if (!nameValid || loading) return;
    loading = true;
    const socket = getSocket();
    socket?.emit('create_room', { playerName: nameTrimmed, avatar: selectedAvatar });
  }

  function joinRoom() {
    if (!nameValid || !codeValid || loading) return;
    loading = true;
    joiningRoom = true;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('join_room', {
      roomCode: codeTrimmed,
      playerName: nameTrimmed,
      avatar: selectedAvatar,
    });
  }
</script>

<div class="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
  <!-- ══════ BACKGROUND GRAPHICS ══════ -->

  <!-- Animated gradient orbs -->
  <div class="splash-orb splash-orb-1"></div>
  <div class="splash-orb splash-orb-2"></div>
  <div class="splash-orb splash-orb-3"></div>

  <!-- Floating particles -->
  {#each Array(20) as _, i}
    <div class="splash-particle"
      style="
        --p-left: {5 + Math.random() * 90}%;
        --p-delay: {Math.random() * -8}s;
        --p-dur: {5 + Math.random() * 7}s;
        --p-size: {2 + Math.random() * 4}px;
        --p-color: {['#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4', '#10b981'][i % 5]};
      "></div>
  {/each}

  <!-- Mystic floating symbols -->
  {#each ['✦', '⚝', '☽', '✧', '⛧', '◈', '❋', '✶'] as sym, i}
    <div class="splash-symbol"
      style="
        --s-left: {8 + i * 12}%;
        --s-delay: {i * -1.5}s;
        --s-dur: {8 + (i % 3) * 3}s;
        --s-size: {14 + (i % 4) * 6}px;
        --s-color: {['rgba(139,92,246,0.15)', 'rgba(220,38,38,0.12)', 'rgba(245,158,11,0.12)', 'rgba(6,182,212,0.12)'][i % 4]};
      ">{sym}</div>
  {/each}

  <!-- Pentagram ring (behind content) -->
  <div class="splash-pentagram"></div>


  <!-- Ghost cards flying across -->
  {#each Array(5) as _, i}
    <div class="ghost-card"
      style="
        --gc-delay: {i * -3.5}s;
        --gc-dur: {10 + i * 2}s;
        --gc-top: {15 + i * 16}%;
        --gc-rot: {-15 + i * 8}deg;
        --gc-size: {50 + i * 8}px;
      ">🃏</div>
  {/each}

  <!-- Lightning flashes -->
  <div class="lightning lightning-1"></div>
  <div class="lightning lightning-2"></div>

  <!-- Bottom fog / mist -->
  <div class="splash-fog"></div>
  <div class="splash-fog splash-fog-2"></div>

  <!-- Vignette overlay -->
  <div class="fixed inset-0 pointer-events-none z-10"
    style="background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%);"></div>

  <!-- ══════ CONTENT ══════ -->

  <!-- Error banner -->
  {#if $socketError}
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl
      bg-red-900/90 border border-red-500/50 text-red-200 text-sm font-medium
      shadow-lg shadow-red-900/30 max-w-sm text-center"
      transition:fly={{ y: -20, duration: 300 }}>
      {$socketError}
    </div>
  {/if}

  {#if mode === 'menu'}
    <!-- Splash / Main Menu -->
    <div class="text-center relative z-20" in:fade={{ duration: 500 }}>
      <div class="mb-6">
        <!-- Small demon card -->
        <div class="inline-flex items-center justify-center mb-2">
          <div class="splash-demon-card w-14 h-20 rounded-lg flex items-center justify-center relative overflow-hidden"
            style="border: 2px solid #ffffff; background: #991B1B;">
            <div class="absolute inset-[2px] rounded-md border border-white/25 pointer-events-none"></div>
            <span class="text-2xl">😈</span>
          </div>
        </div>
        <!-- Title -->
        <div class="relative inline-block">
          <h1 class="font-gothic text-5xl font-black tracking-wider splash-title">CURSED</h1>
          <h1 class="font-gothic text-5xl font-black tracking-wider splash-title-glitch splash-title-glitch-1" aria-hidden="true">CURSED</h1>
          <h1 class="font-gothic text-5xl font-black tracking-wider splash-title-glitch splash-title-glitch-2" aria-hidden="true">CURSED</h1>
        </div>
        <h2 class="font-gothic text-2xl font-bold tracking-[0.3em] -mt-0.5 splash-subtitle">CARDS</h2>
        <p class="text-xs text-purple-400/60 mt-2 tracking-widest uppercase splash-tagline">A multiplayer card game for 2 or more players</p>
      </div>

      <!-- Menu buttons -->
      <div class="space-y-3 w-64 mx-auto">
        <button
          class="w-full py-3.5 rounded-xl font-gothic font-bold text-lg
            splash-btn-primary text-white
            active:scale-95 transition-all"
          on:click={() => mode = 'create'}
        >
          Create Game
        </button>

        <button
          class="w-full py-3.5 rounded-xl font-gothic font-bold text-lg
            splash-btn-secondary text-white
            active:scale-95 transition-all"
          on:click={() => mode = 'join'}
        >
          Join Game
        </button>

        <button
          class="w-full py-3 rounded-xl text-sm
            text-purple-400/50 hover:text-purple-300 transition-colors"
          on:click={() => showHowToPlay.set(true)}
        >
          How to Play
        </button>
      </div>
    </div>

  {:else if mode === 'create'}
    <!-- Create Room -->
    <div class="w-full max-w-sm relative z-20" in:fly={{ x: 100, duration: 300 }}>
      <button class="text-cursed-muted text-sm mb-6 flex items-center gap-1"
        on:click={() => { mode = 'menu'; socketError.set(null); }}>
        ← Back
      </button>

      <h2 class="font-gothic text-2xl font-bold text-cursed-accent mb-6">Create Game</h2>

      <div class="space-y-5">
        <div>
          <label for="create-name" class="text-sm text-cursed-muted block mb-1">Your Name</label>
          <input
            id="create-name"
            type="text"
            bind:value={playerName}
            placeholder="Enter sorcerer name..."
            maxlength="20"
            class="w-full px-4 py-3 rounded-lg bg-cursed-card border text-cursed-text
              placeholder-cursed-muted/50 focus:outline-none transition-colors
              {nameHint ? 'border-red-500/50 focus:border-red-400' : 'border-cursed-border focus:border-cursed-accent'}"
          />
          {#if nameHint}
            <p class="text-[11px] text-red-400 mt-1">{nameHint}</p>
          {/if}
        </div>

        <!-- Avatar picker -->
        <div>
          <label class="text-sm text-cursed-muted block mb-2">Choose Avatar</label>
          <div class="grid grid-cols-4 gap-3">
            {#each AVATAR_ICONS as icon, i}
              <button
                class="flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all active:scale-95
                  {selectedAvatar === i
                    ? 'border-opacity-100 scale-105 shadow-lg'
                    : 'border-cursed-border bg-cursed-card hover:border-opacity-50'}"
                style="{selectedAvatar === i
                  ? `border-color: ${AVATAR_COLORS[i]}; background: ${AVATAR_COLORS[i]}15; box-shadow: 0 0 16px ${AVATAR_COLORS[i]}30;`
                  : ''}"
                on:click={() => selectedAvatar = i}
              >
                <span class="text-3xl">{icon}</span>
                <span class="text-[10px] font-medium {selectedAvatar === i ? '' : 'text-cursed-muted'}"
                  style="{selectedAvatar === i ? `color: ${AVATAR_COLORS[i]};` : ''}">
                  {AVATAR_NAMES[i]}
                </span>
              </button>
            {/each}
          </div>
        </div>

        <button
          class="w-full py-3.5 rounded-xl font-gothic font-bold text-lg
            bg-gradient-to-r from-purple-700 to-purple-900
            border border-purple-500/30 text-white
            hover:from-purple-600 hover:to-purple-800
            active:scale-95 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!nameValid || loading}
          on:click={createRoom}
        >
          {loading ? 'Creating...' : 'Create Room'}
        </button>
      </div>
    </div>

  {:else if mode === 'join'}
    <!-- Join Room -->
    <div class="w-full max-w-sm relative z-20" in:fly={{ x: 100, duration: 300 }}>
      <button class="text-cursed-muted text-sm mb-6 flex items-center gap-1"
        on:click={() => { mode = 'menu'; socketError.set(null); }}>
        ← Back
      </button>

      <h2 class="font-gothic text-2xl font-bold text-cursed-accent mb-6">Join Game</h2>

      <div class="space-y-5">
        <div>
          <label for="join-name" class="text-sm text-cursed-muted block mb-1">Your Name</label>
          <input
            id="join-name"
            type="text"
            bind:value={playerName}
            placeholder="Enter sorcerer name..."
            maxlength="20"
            class="w-full px-4 py-3 rounded-lg bg-cursed-card border text-cursed-text
              placeholder-cursed-muted/50 focus:outline-none transition-colors
              {nameHint ? 'border-red-500/50 focus:border-red-400' : 'border-cursed-border focus:border-cursed-accent'}"
          />
          {#if nameHint}
            <p class="text-[11px] text-red-400 mt-1">{nameHint}</p>
          {/if}
        </div>

        <!-- Avatar picker -->
        <div>
          <label class="text-sm text-cursed-muted block mb-2">Choose Avatar</label>
          <div class="grid grid-cols-4 gap-3">
            {#each AVATAR_ICONS as icon, i}
              <button
                class="flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all active:scale-95
                  {selectedAvatar === i
                    ? 'border-opacity-100 scale-105 shadow-lg'
                    : 'border-cursed-border bg-cursed-card hover:border-opacity-50'}"
                style="{selectedAvatar === i
                  ? `border-color: ${AVATAR_COLORS[i]}; background: ${AVATAR_COLORS[i]}15; box-shadow: 0 0 16px ${AVATAR_COLORS[i]}30;`
                  : ''}"
                on:click={() => selectedAvatar = i}
              >
                <span class="text-3xl">{icon}</span>
                <span class="text-[10px] font-medium {selectedAvatar === i ? '' : 'text-cursed-muted'}"
                  style="{selectedAvatar === i ? `color: ${AVATAR_COLORS[i]};` : ''}">
                  {AVATAR_NAMES[i]}
                </span>
              </button>
            {/each}
          </div>
        </div>

        <div>
          <label for="room-code" class="text-sm text-cursed-muted block mb-1">Room Code</label>
          <input
            id="room-code"
            type="text"
            bind:value={roomCode}
            placeholder="ABCD"
            maxlength="4"
            class="w-full px-4 py-3 rounded-lg bg-cursed-card border text-cursed-text
              placeholder-cursed-muted/50 uppercase text-center text-2xl
              font-gothic tracking-[0.5em] focus:outline-none transition-colors
              {codeHint ? 'border-red-500/50 focus:border-red-400' : 'border-cursed-border focus:border-cursed-accent'}"
          />
          {#if codeHint}
            <p class="text-[11px] text-red-400 mt-1 text-center">{codeHint}</p>
          {/if}
        </div>

        <button
          class="w-full py-3.5 rounded-xl font-gothic font-bold text-lg
            bg-gradient-to-r from-purple-700 to-purple-900
            border border-purple-500/30 text-white
            hover:from-purple-600 hover:to-purple-800
            active:scale-95 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!nameValid || !codeValid || loading}
          on:click={joinRoom}
        >
          {loading ? 'Joining...' : 'Join Room'}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* ── Gradient orbs ── */
  .splash-orb {
    position: fixed;
    border-radius: 50%;
    pointer-events: none;
    filter: blur(80px);
    z-index: 0;
  }
  .splash-orb-1 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.25), transparent 70%);
    top: -10%; left: -10%;
    animation: orb-drift-1 12s ease-in-out infinite;
  }
  .splash-orb-2 {
    width: 350px; height: 350px;
    background: radial-gradient(circle, rgba(220, 38, 38, 0.2), transparent 70%);
    bottom: -10%; right: -10%;
    animation: orb-drift-2 15s ease-in-out infinite;
  }
  .splash-orb-3 {
    width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.12), transparent 70%);
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    animation: orb-drift-3 10s ease-in-out infinite;
  }

  @keyframes orb-drift-1 {
    0%, 100% { transform: translate(0, 0); }
    33% { transform: translate(60px, 40px); }
    66% { transform: translate(-30px, 70px); }
  }
  @keyframes orb-drift-2 {
    0%, 100% { transform: translate(0, 0); }
    33% { transform: translate(-50px, -30px); }
    66% { transform: translate(40px, -60px); }
  }
  @keyframes orb-drift-3 {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
    50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
  }

  /* ── Floating particles ── */
  .splash-particle {
    position: fixed;
    width: var(--p-size);
    height: var(--p-size);
    background: var(--p-color);
    border-radius: 50%;
    left: var(--p-left);
    bottom: -10px;
    pointer-events: none;
    z-index: 1;
    box-shadow: 0 0 6px var(--p-color), 0 0 12px var(--p-color);
    animation: particle-rise var(--p-dur) linear infinite;
    animation-delay: var(--p-delay);
  }

  @keyframes particle-rise {
    0% { transform: translateY(0) translateX(0); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 0.6; }
    100% { transform: translateY(-100vh) translateX(30px); opacity: 0; }
  }

  /* ── Mystic floating symbols ── */
  .splash-symbol {
    position: fixed;
    font-size: var(--s-size);
    color: var(--s-color);
    left: var(--s-left);
    pointer-events: none;
    z-index: 1;
    animation: symbol-float var(--s-dur) ease-in-out infinite;
    animation-delay: var(--s-delay);
  }

  @keyframes symbol-float {
    0%, 100% { top: 85%; transform: rotate(0deg) scale(1); opacity: 0.3; }
    25% { opacity: 0.7; }
    50% { top: 15%; transform: rotate(180deg) scale(1.2); opacity: 0.5; }
    75% { opacity: 0.2; }
  }

  /* ── Pentagram ring ── */
  .splash-pentagram {
    position: fixed;
    width: 500px; height: 500px;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 1px solid rgba(139, 92, 246, 0.08);
    pointer-events: none;
    z-index: 0;
    animation: penta-spin 30s linear infinite;
    box-shadow:
      0 0 40px rgba(139, 92, 246, 0.05),
      inset 0 0 40px rgba(139, 92, 246, 0.03);
  }
  .splash-pentagram::before {
    content: '';
    position: absolute;
    inset: 30px;
    border-radius: 50%;
    border: 1px solid rgba(220, 38, 38, 0.06);
    animation: penta-spin 20s linear infinite reverse;
  }
  .splash-pentagram::after {
    content: '';
    position: absolute;
    inset: 60px;
    border-radius: 50%;
    border: 1px dashed rgba(245, 158, 11, 0.06);
    animation: penta-spin 25s linear infinite;
  }

  @keyframes penta-spin {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }


  /* ── Demon card on splash ── */
  .splash-demon-card {
    animation: demon-card-breathe 3s ease-in-out infinite;
  }

  @keyframes demon-card-breathe {
    0%, 100% { box-shadow: 0 0 12px rgba(153,27,27,0.4), 0 2px 8px rgba(0,0,0,0.4); }
    50% { box-shadow: 0 0 25px rgba(153,27,27,0.7), 0 0 40px rgba(153,27,27,0.2), 0 2px 8px rgba(0,0,0,0.4); }
  }

  /* ── Title styling ── */
  .splash-title {
    background: linear-gradient(180deg, #c084fc 0%, #a855f7 30%, #ef4444 70%, #dc2626 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 30px rgba(139, 92, 246, 0.3));
    animation: title-glow 3s ease-in-out infinite;
  }
  .splash-subtitle {
    background: linear-gradient(180deg, rgba(192, 132, 252, 0.5), rgba(139, 92, 246, 0.3));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  @keyframes title-glow {
    0%, 100% { filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.2)); }
    50% { filter: drop-shadow(0 0 40px rgba(139, 92, 246, 0.5)); }
  }

  /* ── Buttons ── */
  .splash-btn-primary {
    background: linear-gradient(135deg, #7c3aed, #9333ea, #7c3aed);
    background-size: 200% 200%;
    border: 1px solid rgba(139, 92, 246, 0.4);
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.25), 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: btn-shimmer 3s ease-in-out infinite;
  }
  .splash-btn-primary:hover {
    box-shadow: 0 0 30px rgba(139, 92, 246, 0.5), 0 4px 20px rgba(0, 0, 0, 0.3);
    border-color: rgba(139, 92, 246, 0.7);
  }

  .splash-btn-secondary {
    background: rgba(18, 18, 31, 0.9);
    border: 1px solid rgba(139, 92, 246, 0.2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  .splash-btn-secondary:hover {
    border-color: rgba(139, 92, 246, 0.5);
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.15), 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  @keyframes btn-shimmer {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  /* ── Ghost cards flying across ── */
  .ghost-card {
    position: fixed;
    font-size: var(--gc-size);
    top: var(--gc-top);
    left: -80px;
    pointer-events: none;
    z-index: 1;
    opacity: 0;
    filter: blur(1px);
    animation: ghost-fly var(--gc-dur) linear infinite;
    animation-delay: var(--gc-delay);
  }

  @keyframes ghost-fly {
    0% { left: -80px; opacity: 0; transform: rotate(var(--gc-rot)) scale(0.7); }
    5% { opacity: 0.12; }
    50% { opacity: 0.08; transform: rotate(calc(var(--gc-rot) + 15deg)) scale(1); }
    95% { opacity: 0.12; }
    100% { left: calc(100vw + 80px); opacity: 0; transform: rotate(calc(var(--gc-rot) + 30deg)) scale(0.7); }
  }

  /* ── Lightning flashes ── */
  .lightning {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 3;
    opacity: 0;
  }
  .lightning-1 {
    background: radial-gradient(ellipse at 30% 20%, rgba(139, 92, 246, 0.15), transparent 60%);
    animation: lightning-flash 6s ease-out infinite;
  }
  .lightning-2 {
    background: radial-gradient(ellipse at 70% 30%, rgba(220, 38, 38, 0.1), transparent 60%);
    animation: lightning-flash 8s ease-out infinite;
    animation-delay: -3s;
  }

  @keyframes lightning-flash {
    0%, 100% { opacity: 0; }
    1% { opacity: 1; }
    2% { opacity: 0; }
    3% { opacity: 0.7; }
    4% { opacity: 0; }
    30% { opacity: 0; }
  }

  /* ── Fog / mist at bottom ── */
  .splash-fog {
    position: fixed;
    bottom: -20px;
    left: -10%;
    width: 120%;
    height: 150px;
    pointer-events: none;
    z-index: 2;
    background: linear-gradient(to top, rgba(5, 5, 8, 0.9), rgba(5, 5, 8, 0.4), transparent);
    animation: fog-drift 12s ease-in-out infinite;
  }
  .splash-fog-2 {
    height: 100px;
    bottom: -10px;
    animation-delay: -6s;
    animation-duration: 16s;
    opacity: 0.6;
  }

  @keyframes fog-drift {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(30px); }
  }


  /* ── Title glitch effect ── */
  .splash-title-glitch {
    position: absolute;
    top: 0; left: 0;
    background: linear-gradient(180deg, #c084fc 0%, #a855f7 30%, #ef4444 70%, #dc2626 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    pointer-events: none;
  }
  .splash-title-glitch-1 {
    animation: glitch-1 4s ease-in-out infinite;
    clip-path: inset(0 0 65% 0);
  }
  .splash-title-glitch-2 {
    animation: glitch-2 4s ease-in-out infinite;
    clip-path: inset(65% 0 0 0);
  }

  @keyframes glitch-1 {
    0%, 90%, 100% { transform: translate(0); opacity: 0; }
    92% { transform: translate(-3px, -1px); opacity: 0.7; }
    94% { transform: translate(3px, 1px); opacity: 0.5; }
    96% { transform: translate(-2px, 0); opacity: 0; }
  }
  @keyframes glitch-2 {
    0%, 88%, 100% { transform: translate(0); opacity: 0; }
    90% { transform: translate(3px, 1px); opacity: 0.7; }
    92% { transform: translate(-4px, -1px); opacity: 0.5; }
    95% { transform: translate(2px, 0); opacity: 0; }
  }

  /* ── Tagline typewriter shimmer ── */
  .splash-tagline {
    animation: tagline-shimmer 4s ease-in-out infinite;
  }
  @keyframes tagline-shimmer {
    0%, 100% { opacity: 0.5; letter-spacing: 0.15em; }
    50% { opacity: 0.8; letter-spacing: 0.25em; }
  }

</style>
