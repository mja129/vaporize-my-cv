<script lang="ts">
     import { onMount } from "svelte";
     import Resume from "./Resume.svelte";
     import type { Resume as ResumeType } from './resume_utils';
     let score = $state(0);
     let time = $state(600);
     let { resume }: { resume: ResumeType | null } = $props();
     onMount(() => {
          setInterval(() => {
               time -= 1;
          }, 1000);
     });
</script>

<div id="game-container">
     <div id="window">
          <div id="hud">
               <span>Cope: {score}</span>
               <span>Application Window: {time}s</span>
          </div>
          <div id="upgrades"> 
               <div id="upgrades-left" class="upgrades-pane">
                    <div class="upgrade">
                         <p>Printer speed</p>
                         <button>Woop</button>
                    </div>
               </div>
               <div id="upgrades-right" class="upgrades-pane">
                    <div class="upgrade">
                         <p>Printer speed</p>
                         <button>Woop</button>
                    </div>
               </div>
          </div>
     </div>
</div>

<style>
     #game-container {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
     }
     #window {
          position: absolute;
          top: 5%;
          left: 5%;
          margin: 0;
          width: calc(90% - 500px);
          height: calc(90% - 100px);
          border-radius: 30px;
          border-top-width: 100px;
          border-left-width: 5px;
          border-right-width: 500px;
          border-bottom-width: 5px;
          border-color: #0A0A0A;
          border-style: solid;
     }
     #hud {
          width: calc(90% + 450px);
          height: 80px;
          position: absolute;
          top: -90px;
          left: calc(5% + 25px);
          display: flex;
          justify-content: space-between;
          align-items: center;
     }
     #hud > span {
          font-size: 5rem;
     }
     #upgrades {
          width: 450px;
          height: 95%;
          position: absolute;
          top: 2.5%;
          right: -470px;
          background: #333;
          border-radius: 10px;
          box-shadow: 10px 10px #222;
          display: flex;
          flex-direction: row;
          justify-content: space-around;
          align-items: center;
     }
     .upgrade {
          width: 30%;
          height: 100px;
          border-radius: 5px;
          background: #222;
          padding: 10px;
          text-align: center;
     }
     .upgrades-pane {
          width: 40%;
          height: 90%;
     }
</style>
