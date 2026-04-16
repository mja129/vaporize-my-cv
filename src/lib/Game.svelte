<script lang="ts">
     import { onMount } from "svelte";
     import Resume from "./Resume.svelte";
     import type { Resume as ResumeType } from './resume_utils';
     import GameBg from "./GameBg.svelte";
     let score = $state(0);
     let time = $state(600);
     let { resume }: { resume: ResumeType | null } = $props();
     onMount(() => {
          setInterval(() => {
               time -= 1;
          }, 1000);
     });
     const formatter = new Intl.NumberFormat('en-US');
</script>

<div id="game-container">
     <div id="window">
          <GameBg />
          <div id="hud">
               <span>Cope: {formatter.format(score)}</span>
               <span>Application Window: {time}s</span>
          </div>
          <div id="upgrades"> 
               <div id="panes">
                    <div id="upgrades-left" class="upgrades-pane">
                         <div class="upgrade">
                              <p>Printer speed</p>
                              <button>Buy</button>
                              <p>45 Cope</p>
                         </div>
                    </div>
                    <div id="upgrades-right" class="upgrades-pane">
                         <div class="upgrade">
                              <p>Printer speed</p>
                              <button>Buy</button>
                              <p>45 Cope</p>
                         </div>
                    </div>
               </div>
               <div id="resume">
                    <Resume {resume} height={330} width={275} />
                    <div id="resume-upgrades">
                         <div class="upgrade">
                              <p>Printer speed</p>
                              <button>Buy</button>
                              <p>45 Cope</p>
                         </div>
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
          border-left-width: 0px;
          border-bottom-width: 0px;
          border-right-width: 500px;
          border-color: #111;
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
          font-size: 4.5rem;
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
          flex-direction: column;
          justify-content: space-around;
          align-items: center;
     }
     #panes, #resume {
          width: 100%;
          display: flex;
          flex-direction: row;
          justify-content: space-around;
          align-items: center;
     }
     .upgrade {
          width: 80%;
          border-radius: 5px;
          background: #222;
          padding: 10px;
          text-align: center;
          font-size: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 10px;
     }
     button {
          background-color: #8c00dc;
          font-family: inherit;
          font-size: 1.5rem;
          color: #DDD;
     }
     .upgrades-pane {
          width: 40%;
     }
     #resume-upgrades {
          width: 20%;
     }
     .upgrades-pane, #resume-upgrades {
          height: 80%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-around;
     }
     p {
          margin: 0;
          padding: 0;
     }
</style>
