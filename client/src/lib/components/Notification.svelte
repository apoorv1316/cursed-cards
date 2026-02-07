<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { notification } from '../stores/gameStore';
  import { socketError } from '../stores/socketStore';

  $: msg = $socketError || $notification;
  $: isError = !!$socketError;
</script>

{#if msg}
  <div class="fixed top-4 left-4 right-4 z-[60] flex justify-center pointer-events-none"
    in:fly={{ y: -30, duration: 300 }}
    out:fade={{ duration: 200 }}>
    <div class="px-4 py-2 rounded-lg text-sm font-medium shadow-lg pointer-events-auto
      {isError ? 'bg-red-900/90 border border-red-500/50 text-red-200' : 'bg-cursed-card border border-cursed-border text-cursed-text'}">
      {msg}
    </div>
  </div>
{/if}
