<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import { getSocket, connectSocket } from '$lib/stores/socketStore';
  import {
    gameState, isMyTurn, amAlive,
    showNotification, selectedCard, showCardDetail,
  } from '$lib/stores/gameStore';
  import type { GameStateForPlayer, Card } from '$lib/game/types';

  import OpponentBar from '$lib/components/OpponentBar.svelte';
  import TurnIndicator from '$lib/components/TurnIndicator.svelte';
  import DrawPile from '$lib/components/DrawPile.svelte';
  import DiscardPile from '$lib/components/DiscardPile.svelte';
  import PlayerHand from '$lib/components/PlayerHand.svelte';
  import CardDetail from '$lib/components/CardDetail.svelte';
  import DemonReveal from '$lib/components/DemonReveal.svelte';
  import CounterSpellReinsert from '$lib/components/CounterSpellReinsert.svelte';
  import HexBlockPrompt from '$lib/components/HexBlockPrompt.svelte';
  import DarkVisionOverlay from '$lib/components/DarkVisionOverlay.svelte';
  import GameOverOverlay from '$lib/components/GameOverOverlay.svelte';
  import PlayerProfile from '$lib/components/PlayerProfile.svelte';

  $: roomCode = $page.params.roomCode;

  function onGameState(data: GameStateForPlayer) {
    gameState.set(data);
  }
  function onCardPlayed({ playerName, card }: { playerName: string; card: Card }) {
    showNotification(`${playerName} played ${card.name}`);
  }
  function onDemonDrawn({ playerName }: { playerName: string }) {
    showNotification(`${playerName} drew a Demon's Bargain!`, 5000);
  }
  function onPlayerEliminated({ playerName }: { playerName: string }) {
    showNotification(`${playerName} has been eliminated!`, 4000);
  }
  function onCounterSpellUsed({ playerName }: { playerName: string }) {
    showNotification(`${playerName} used Counter Spell!`, 3000);
  }
  function onHexBlockUsed({ blockerName }: { blockerName: string; blockedAction: string }) {
    showNotification(`${blockerName} blocked with Hex Block!`, 3000);
  }
  function onPlayerLeft({ playerName }: { playerName: string }) {
    showNotification(`${playerName} disconnected`);
  }

  onMount(() => {
    const socket = connectSocket();

    socket.on('game_state', onGameState);
    socket.on('card_played', onCardPlayed);
    socket.on('demon_drawn', onDemonDrawn);
    socket.on('player_eliminated', onPlayerEliminated);
    socket.on('counter_spell_used', onCounterSpellUsed);
    socket.on('hex_block_used', onHexBlockUsed);
    socket.on('player_left', onPlayerLeft);

    // If no game state, redirect to home
    if (!$gameState) {
      goto('/');
    }
  });

  onDestroy(() => {
    const socket = getSocket();
    if (socket) {
      socket.off('game_state', onGameState);
      socket.off('card_played', onCardPlayed);
      socket.off('demon_drawn', onDemonDrawn);
      socket.off('player_eliminated', onPlayerEliminated);
      socket.off('counter_spell_used', onCounterSpellUsed);
      socket.off('hex_block_used', onHexBlockUsed);
      socket.off('player_left', onPlayerLeft);
    }
  });

  function handleDraw() {
    const socket = getSocket();
    socket?.emit('draw_card');
  }

  function handleSelectTarget(playerId: string) {
    const socket = getSocket();
    if (!socket || !$gameState) return;
    socket.emit('play_card', {
      cardId: '', // server uses pending action's card type
      targetPlayerId: playerId,
    });
  }
</script>

{#if $gameState}
  <div class="min-h-screen flex flex-col relative" in:fade={{ duration: 300 }}>
    <!-- Top-right: Player profile -->
    <PlayerProfile />

    <!-- Top: Turn indicator -->
    <TurnIndicator />

    <!-- Main area: sidebar + board -->
    <div class="flex-1 flex min-h-0">
      <!-- Left sidebar: Opponents -->
      <div class="shrink-0 border-r border-cursed-border/20">
        <OpponentBar onSelectTarget={handleSelectTarget} />
      </div>

      <!-- Center: Board area -->
      <div class="flex-1 flex flex-col">
        <div class="flex-1 flex items-center justify-center gap-8 px-4">
          <DrawPile onDraw={handleDraw} />
          <DiscardPile />
        </div>

        <!-- Eliminated message -->
        {#if !$amAlive && $gameState.phase !== 'game_over'}
          <div class="text-center py-2">
            <span class="text-red-400 text-sm font-medium">You have been eliminated. Spectating...</span>
          </div>
        {/if}
      </div>
    </div>

    <!-- Bottom: Player hand -->
    <PlayerHand />

    <!-- Overlays -->
    <CardDetail />
    <DemonReveal />
    <CounterSpellReinsert />
    <HexBlockPrompt />
    <DarkVisionOverlay />
    <GameOverOverlay />
  </div>
{:else}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="text-4xl mb-4 animate-pulse">🃏</div>
      <p class="text-cursed-muted">Loading game...</p>
    </div>
  </div>
{/if}
