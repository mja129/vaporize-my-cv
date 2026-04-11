<script lang="ts">
     import { onMount } from "svelte";

     let lines: Array<{ x: number, y: number }> = [];
     let x, y;
     // populate lines array
     // x, y = +/- [.1, 1.1)
     for (var i = 0; i < 50; i++) {
          x = Math.random() + .1;
          x *= Math.random() > .5 ? 1 : -1;
          y = Math.random() + .1;
          y *= Math.random() > .5 ? 1 : -1;
          lines.push({ x, y });
     }

     // on load, wait 200ms and then take step from 0 : 75
     let step = $state(0);
     onMount(async () => {
          await new Promise((r) => setTimeout(r, 200));
          var int = setInterval(() => {
               if (++step > 75) {clearInterval(int);}
          }, 20);
     });
     const EXP = 1.8;
</script>

<svg
     width='100%'
     height='100%'
     viewBox='0 0 100 100'
     xmlns="http://www.w3.org/2000/svg"
>
{#each lines as { x, y }, i}
     {#if step > i}
     <line
          stroke="#FFF"
          stroke-width=.5
          y1={y * (step - i)**EXP + 50}
          x1={x * (step - i)**EXP + 50}
          x2={x * (step + 2 - i)**EXP + 50}
          y2={y * (step + 2 - i)**EXP + 50}
          opacity={(step - i) / 20 - 0.2}
     />
     {/if}
{/each}
{#each lines as { x, y }, i}
     {#if step > i}
     <line
          stroke="#FFF"
          stroke-width=.5
          x1={-x * (step - i)**EXP + 50}
          y1={-y * (step - i)**EXP + 50}
          x2={-x * (step + 2 - i)**EXP + 50}
          y2={-y * (step + 2 - i)**EXP + 50}
          opacity={(step - i) / 20 - 0.2}
     />
     {/if}
{/each}
</svg>
