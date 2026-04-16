<script lang="ts">
     import { onMount } from "svelte";

     type coord = {
          x: number,
          y: number,
          z: number
     }

     let dots: Array<coord> = [];

     let x, y, z;
     for (var i = 0; i < 150; i++) {
          x = Math.random() * 50;
          x *= Math.random() > .5 ? 1 : -1;
          y = Math.random() * 50;
          y *= Math.random() > .5 ? 1 : -1;
          z = Math.random()
          dots.push({ x, y, z });
     }

     let dots_shift: Array<coord> = $derived.by((): Array<coord> => {
          return dots.map(({x, y, z}) => ({x, y, z: 1 - mod_hundreth(z + step)}))
     });

     let step = $state(0);
     onMount(async () => {
          var int = setInterval(() => {
               step+=.002;
          }, 30);
     });

     function mod_hundreth(x: number): number {
          return ((x * 100) % 100) / 100;
     }
</script>

<div>
     <svg
          width='100%'
          height='100%'
          viewBox='0 0 100 100'
          xmlns="http://www.w3.org/2000/svg"
     >
          {#each dots_shift as dot}
          <circle
               data-z={dot.z}
               fill=#DDD
               cx={dot.x / dot.z + 50}
               cy={dot.y / dot.z + 50}
               r=0.2
               opacity={1 - dot.z}
          />
          {/each}
     </svg>
</div>

<style>
     div {
          /* border: solid #555 2px; */
          background: #111;
          height: 100%;
          width: 100%;
          border-bottom-left-radius: 30px;
     }
</style>