<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { showHowToPlay } from '../stores/gameStore';

  let currentSlide = 0;

  const slides = [
    {
      title: 'The Basics',
      icon: '🃏',
      points: [
        'Each player starts with 7 cards and 1 guaranteed Counter Spell',
        'On your turn: play a card, then draw one from the deck',
        'Use action cards to mess with opponents',
        'Last sorcerer standing wins!',
      ],
    },
    {
      title: 'Card Types',
      icon: '⚔️',
      points: [
        '👣 Shadow Step — skip your draw (play it safe)',
        '👁 Dark Vision — peek at top 3 cards',
        '🌀 Chaos Shuffle — reshuffle the deck',
        '⚡ Doom Draw — force someone to draw 2',
        '👻 Soul Steal — steal a random card',
        '🎁 Cursed Gift — give someone a card',
      ],
    },
    {
      title: 'Defense Cards',
      icon: '🛡',
      points: [
        '🛡 Hex Block — cancel any action card',
        '✨ Counter Spell — survive a Demon\'s Bargain',
        'When someone plays an action, you get 3 seconds to Hex Block!',
        'Matching Pair: discard 2 of the same type to steal a specific card',
      ],
    },
    {
      title: "Demon's Bargain",
      icon: '😈',
      points: [
        "4 Demon's Bargain cards are hidden in the deck",
        'Draw one and you must Counter Spell or be eliminated!',
        'Counter Spell lets you reinsert it anywhere in the deck',
        'Use Dark Vision to see what\'s coming',
        'Use Shadow Step to avoid drawing entirely',
      ],
    },
  ];

  function next() {
    if (currentSlide < slides.length - 1) currentSlide++;
    else close();
  }

  function prev() {
    if (currentSlide > 0) currentSlide--;
  }

  function close() {
    currentSlide = 0;
    showHowToPlay.set(false);
  }
</script>

{#if $showHowToPlay}
  <div class="fixed inset-0 z-50 flex items-center justify-center"
    transition:fade={{ duration: 200 }}>
    <button class="absolute inset-0 bg-black/70" on:click={close}></button>

    <div class="relative bg-cursed-surface border border-cursed-border rounded-xl p-6 mx-4 max-w-md w-full"
      in:fly={{ y: 30, duration: 300 }}>
      <!-- Close button -->
      <button class="absolute top-3 right-3 text-cursed-muted hover:text-white text-xl"
        on:click={close}>
        ✕
      </button>

      <!-- Slide content -->
      {#key currentSlide}
        <div in:fly={{ x: 50, duration: 200 }}>
          <div class="text-center mb-4">
            <span class="text-4xl">{slides[currentSlide].icon}</span>
            <h3 class="font-gothic text-xl font-bold text-cursed-accent mt-2">
              {slides[currentSlide].title}
            </h3>
          </div>

          <ul class="space-y-2">
            {#each slides[currentSlide].points as point}
              <li class="text-sm text-cursed-text flex items-start gap-2">
                <span class="text-cursed-muted mt-0.5">•</span>
                <span>{point}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/key}

      <!-- Navigation -->
      <div class="flex items-center justify-between mt-6">
        <button
          class="px-4 py-2 rounded-lg text-sm
            {currentSlide > 0 ? 'bg-cursed-card text-cursed-text' : 'invisible'}"
          on:click={prev}
        >
          Back
        </button>

        <!-- Dots -->
        <div class="flex gap-1.5">
          {#each slides as _, i}
            <button
              class="w-2 h-2 rounded-full transition-colors
                {i === currentSlide ? 'bg-cursed-accent' : 'bg-cursed-border'}"
              on:click={() => currentSlide = i}
            ></button>
          {/each}
        </div>

        <button
          class="px-4 py-2 rounded-lg text-sm font-medium bg-cursed-accent text-white"
          on:click={next}
        >
          {currentSlide === slides.length - 1 ? 'Done' : 'Next'}
        </button>
      </div>
    </div>
  </div>
{/if}
