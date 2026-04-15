<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import Login from './lib/Login.svelte';
  import Game from './lib/Game.svelte';
  import Lines from './lib/Lines.svelte';
  import { onMount } from 'svelte';
  import { debug_processed, parse_resume, type Resume } from './lib/resume_utils'

  let logged_in: boolean = $state(false);
  let resume: Resume | null = $state(null);
  let parse_error: string | null = $state(null);

  const DEBUG = false;

  async function enter(text: string, fake: boolean) {
    var resume_text;
    parse_error = null;
    if (fake) {
      resume_text = debug_processed;
    } else {
      resume_text = await parse_resume(text);
    }
    console.log('Resume object text:', resume_text);
    try {
      resume = JSON.parse(resume_text);
    } catch (e: any) {
      console.log('Resume parse failed:', e);
      parse_error = 'Error processing your resume, or I\'m out of API tokens :(';
      return
    }
    console.log('Parsed resume:', JSON.stringify(resume, null, 2));
    logged_in = true;
  }

  onMount(async () => {
    if (DEBUG) { enter('', true); }
  });
</script>

{#if !logged_in}

<div out:scale={{ start: 2, duration: 300 }}>
  <Login on_login={enter} {parse_error} />
</div>

{:else}

<!-- Wait for the lines animation to play, then render the game -->
{#await new Promise((r) => setTimeout(r, 1700)) }
<Lines />
{:then}
<div in:scale={{ start: 0, duration: 600 }}>
  <Game {resume} />
</div>
{/await}

{/if}


<style>
  div {
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
  }
</style>
