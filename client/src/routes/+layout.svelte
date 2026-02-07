<script>
  import '../app.css';
  import Notification from '$lib/components/Notification.svelte';
  import HowToPlay from '$lib/components/HowToPlay.svelte';
</script>

<div class="min-h-screen">
  <slot />
</div>

<Notification />
<HowToPlay />
