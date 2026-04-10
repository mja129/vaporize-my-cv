<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import Login from './lib/Login.svelte';
  import Game from './lib/Game.svelte';
  import Lines from './lib/Lines.svelte';
  import { onMount } from 'svelte';
  import { debug_resume } from './lib/resume_utils'

  let logged_in: boolean = $state(false);
  let resume_text: string | null = $state(null);

  const DEBUG = true;

  function enter(text: string) {
    resume_text = text;
    logged_in = true;
  }
  
  onMount(() => {
    if (DEBUG) {
      resume_text = debug_resume
    }
  })
</script>

{#if !DEBUG}

{#if !logged_in}

<div out:scale={{ start: 2, duration: 300 }}>
  <Login onlogin={enter} />
</div>

{:else}

<!-- Wait for the lines animation to play, then render the game -->
{#await new Promise((r) => setTimeout(r, 1700)) }
<Lines />
{:then value} 
<div in:scale={{ start: 0, duration: 600 }}>
  <Game {resume_text} />
</div>
{/await}

{/if}

{:else}

<div>
  <Game {resume_text} />
</div>

{/if}

<style>
  div {
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
  }
</style>
