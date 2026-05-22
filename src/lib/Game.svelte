<script lang="ts">
     import { onMount, settled } from "svelte";
     import Resume from "./Resume.svelte";
     import type { Resume as ResumeType } from './resume_utils';
     import GameBg from "./GameBg.svelte";

     let { resume, on_game_over }: { resume: ResumeType | null; on_game_over: (totalDestroyed: number, score: number) => void } = $props();

     // --- Upgrade constants ---
     const SKILL_COSTS = [2500, 7000, 20000, 65000, 200000, 500000, 1_000_000];
     const SKILL_BONUS = 200;
     const AI_SKILL_COST = 100_000_000_000;
     const EXP_COSTS = [150_000, 600_000, 2_000_000];
     const EXP_BONUSES = [500, 1500, 4000];
     const MULT_UPGRADES = [
          { name: 'Rewrite in Rust',           cost: 150_000,       mult: 1.5, effect: 'rust' },
          { name: 'Laminate Resume',            cost: 1_000_000,     mult: 2,   effect: 'laminate' },
          { name: 'Print on Gold Foil',         cost: 6_000_000,     mult: 3,   effect: 'gold' },
          { name: 'Have Dad Email the CEO',     cost: 50_000_000,    mult: 5,   effect: 'dad' },
          { name: 'Ship an LLM Wrapper',           cost: 300_000_000,   mult: 10, effect: 'pope' },
          { name: 'Make Vision Board',             cost: 2_000_000_000, mult: 20, effect: 'helicopter' },
     ];
     const MANUAL_DELAY_TIERS = [
          { cost: 500, delay: 300 },
          { cost: 2000, delay: 100 },
          { cost: 6000, delay: 30 },
          { cost: 15000, delay: 0 },
     ];
     const MANUAL_DELAY_LABELS = ['500ms', '300ms', '100ms', '30ms', '0ms'];
     const AUTO_PRINT_UNLOCK_COST = 3000;
     const AUTO_PRINT_TIERS = [
          { cost: 5000,    interval: 750 },
          { cost: 15000,   interval: 500 },
          { cost: 40000,   interval: 250 },
          { cost: 100000,  interval: 100 },
          { cost: 300000,  interval: 50 },
          { cost: 800000,  interval: 25 },
          { cost: 2000000, interval: 15 },
          { cost: 5000000, interval: 10 },
     ];
     const AUTO_PRINT_LABELS = ['1s', '0.75s', '0.5s', '0.25s', '0.1s', '0.05s', '0.025s', '0.015s', '0.01s'];

     // --- Core game state ---
     let score = $state(0);
     let time = $state(300);
     let blockPrint = $state(false);
     let totalDestroyed = $state(0);

     // --- Upgrade state ---
     let unlockedSkillCount = $state(3);
     let expUpgraded = $state([false, false, false]);
     let manualDelayLevel = $state(0);
     let autoPrintUnlocked = $state(false);
     let autoPrintLevel = $state(0);
     let multLevel = $state(0);
     let aiUnlocked = $state(false);

     // --- Derived values ---
     let maxSkills = $derived(Math.min(10, resume?.skills.length ?? 0));
     let nextExpIdx = $derived(expUpgraded.findIndex((u: boolean) => !u));
     let copeMult = $derived(MULT_UPGRADES.slice(0, multLevel).reduce((acc, t) => acc * t.mult, 1) * (aiUnlocked ? 1000 : 1));
     let activeEffects = $derived([...MULT_UPGRADES.slice(0, multLevel).map(u => u.effect), ...(aiUnlocked ? ['ai'] : [])]);

     // --- Resume display sizing ---
     // Border width changes per effect: rust/gold → 7px (14px total), pope box-shadow → 10px overhang per side.
     const RESUME_ASPECT = 102 / 132;
     let resumeBorder = $derived(
          (activeEffects.includes('rust') || activeEffects.includes('gold') ? 7 : 5) * 2 +
          (activeEffects.includes('pope') ? 20 : 0)
     );
     let displayWidth = $state(0);
     let displayHeight = $state(0);
     let _avW = $derived(Math.max(0, displayWidth - resumeBorder));
     let _avH = $derived(Math.max(0, displayHeight - resumeBorder));
     let resumeDisplayW = $derived(
          _avH * RESUME_ASPECT <= _avW ? Math.floor(_avH * RESUME_ASPECT) : _avW
     );
     let resumeDisplayH = $derived(
          _avH * RESUME_ASPECT <= _avW ? _avH : Math.floor(_avW / RESUME_ASPECT)
     );
     let manualPrintDelay = $derived(
          manualDelayLevel === 0 ? 500 : MANUAL_DELAY_TIERS[manualDelayLevel - 1].delay
     );
     let autoPrintIntervalMs = $derived(
          autoPrintLevel === 0 ? 1000 : AUTO_PRINT_TIERS[autoPrintLevel - 1].interval
     );
     let print_speed = $derived(3 + Math.floor(totalDestroyed / 100));
     let allMaxed = $derived(
          unlockedSkillCount >= maxSkills &&
          expUpgraded.every((u: boolean) => u) &&
          multLevel >= MULT_UPGRADES.length &&
          aiUnlocked
     );

     let resumeWorth = $derived(
          Math.round(
               (50 +
               Math.max(0, unlockedSkillCount - 3) * SKILL_BONUS +
               expUpgraded.reduce((acc, upgraded, i) => acc + (upgraded ? EXP_BONUSES[i] : 0), 0))
          )
     );

     let effectiveResume = $derived(resume ? {
          name: resume.name,
          skills: resume.skills.slice(0, unlockedSkillCount),
          experience: resume.experience.map((exp, i) => ({
               ...exp,
               description: expUpgraded[i] ? exp.description : exp.basic_description,
          })),
     } : { name: 'Jobby McJobFace', skills: [], experience: [] });

     // --- Buy functions ---
     function buy_skill() {
          const idx = unlockedSkillCount - 3;
          if (unlockedSkillCount >= maxSkills || idx >= SKILL_COSTS.length) return;
          if (score < SKILL_COSTS[idx]) return;
          score -= SKILL_COSTS[idx];
          unlockedSkillCount++;
     }

     function buy_exp(i: number) {
          if (expUpgraded[i] || score < EXP_COSTS[i]) return;
          score -= EXP_COSTS[i];
          expUpgraded[i] = true;
     }

     function buy_manual_delay() {
          if (manualDelayLevel >= MANUAL_DELAY_TIERS.length) return;
          const cost = MANUAL_DELAY_TIERS[manualDelayLevel].cost;
          if (score < cost) return;
          score -= cost;
          manualDelayLevel++;
     }

     function buy_auto_print() {
          if (autoPrintUnlocked || score < AUTO_PRINT_UNLOCK_COST) return;
          score -= AUTO_PRINT_UNLOCK_COST;
          autoPrintUnlocked = true;
     }

     function buy_mult() {
          if (multLevel >= MULT_UPGRADES.length) return;
          const cost = MULT_UPGRADES[multLevel].cost;
          if (score < cost) return;
          score -= cost;
          multLevel++;
     }

     function buy_ai_skill() {
          if (aiUnlocked || score < AI_SKILL_COST) return;
          score -= AI_SKILL_COST;
          aiUnlocked = true;
     }

     function buy_auto_print_speed() {
          if (!autoPrintUnlocked || autoPrintLevel >= AUTO_PRINT_TIERS.length) return;
          const cost = AUTO_PRINT_TIERS[autoPrintLevel].cost;
          if (score < cost) return;
          score -= cost;
          autoPrintLevel++;
     }

     // --- Auto-print effect: restarts interval when unlocked or speed changes ---
     $effect(() => {
          if (!autoPrintUnlocked) return;
          const interval_ms = autoPrintIntervalMs;
          const id = setInterval(spawn_resume, interval_ms);
          return () => clearInterval(id);
     });

     // --- Formatting & animation bookkeeping ---
     function shortFormat(n: number): string {
          if (n >= 1e12) return parseFloat((n / 1e12).toPrecision(3)) + 'T';
          if (n >= 1e9)  return parseFloat((n / 1e9).toPrecision(3)) + 'B';
          if (n >= 1e6)  return parseFloat((n / 1e6).toPrecision(3)) + 'M';
          if (n >= 1e3)  return parseFloat((n / 1e3).toPrecision(3)) + 'k';
          return String(n);
     }
     let id = 0;
     let active_resumes: Array<{id: number, worth: number, resume: any, effects: string[]}> = $state([]);

     type VaporizeState = { el: HTMLElement; start: number; hr: number; hb: number; dy: number; resolve: (val: [number, number]) => void };
     let active_vaporizations: VaporizeState[] = [];
     let vaporize_raf: number | null = null;

     let showToast = $state(true);

     onMount(() => {
          setTimeout(() => { showToast = false; }, 8000);
          active_resumes = [];
          const timer = setInterval(() => {
               time -= 1;
               if (time <= 0) {
                    clearInterval(timer);
                    setTimeout(() => on_game_over(totalDestroyed, score), 800);
               }
          }, 1000);
     });

     // Gun rotation tracking (plain vars — updated in RAF, applied directly to DOM)
     let gunAngle = 30;
     let gunPlan: { from: number; to: number; startTime: number; duration: number } | null = null;
     let gunTargetId = -1;
     let gunJsActive = false;

     function getComputedRotation(el: HTMLElement): number {
          const matrix = getComputedStyle(el).transform;
          if (!matrix || matrix === 'none') return gunAngle;
          const m = matrix.match(/matrix\(([^)]+)\)/);
          if (!m) return gunAngle;
          const [a, b] = m[1].split(',').map(Number);
          return Math.atan2(b, a) * 180 / Math.PI;
     }

     function angleToTarget(v: VaporizeState): number {
          const gw = document.getElementById('gwindow')!;
          const finalX = gw.clientWidth  - 241 + para(0, 0.75, v.hr);
          const finalY = gw.clientHeight - 111 + para(0, 0.75, v.hb);
          return Math.atan2(finalY, finalX) * 180 / Math.PI;
     }

     function updateGun(now: number) {
          const el = document.getElementById('railgun') as HTMLElement | null;
          if (!el) return;
          if (active_vaporizations.length === 0) {
               gunTargetId = -1;
               gunPlan = null;
               return;
          }
          const next = active_vaporizations[0];
          if (next.start !== gunTargetId) {
               gunTargetId = next.start;
               const timeRemaining = next.start + 1500 - now;
               if (timeRemaining > 500) {
                    gunTargetId = -1;
                    gunPlan = null;
                    return;
               }
               if (!gunJsActive) {
                    gunAngle = getComputedRotation(el);
                    el.style.animation = 'none';
                    gunJsActive = true;
               }
               const rawTarget = angleToTarget(next);
               const delta = ((rawTarget - gunAngle) % 360 + 540) % 360 - 180;
               gunPlan = { from: gunAngle, to: gunAngle + delta, startTime: now, duration: timeRemaining };
          }
          if (gunPlan) {
               if (gunPlan.duration < 15) {
                    gunAngle = gunPlan.to;
                    el.style.transform = `rotate(${gunAngle}deg)`;
               } else {
                    const t = Math.min((now - gunPlan.startTime) / gunPlan.duration, 1);
                    gunAngle = lerp(gunPlan.from, gunPlan.to, t);
                    el.style.transform = `rotate(${gunAngle}deg)`;
               }
          }
     }

     const GUN_ORIGIN_X = -15;
     const GUN_ORIGIN_Y = 0;
     const GUN_BARREL_LENGTH = 250;

     function fireLaser(v: VaporizeState) {
          const svg = document.getElementById('laser-canvas');
          if (!svg) return;
          const gw = document.getElementById('gwindow')!;
          const endX = gw.clientWidth  - 241 + para(0, 0.75, v.hr);
          const endY = gw.clientHeight - 111 + para(0, 0.75, v.hb);
          const dx = endX - GUN_ORIGIN_X;
          const dy = endY - GUN_ORIGIN_Y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const tipX = GUN_ORIGIN_X + (dx / dist) * GUN_BARREL_LENGTH;
          const tipY = GUN_ORIGIN_Y + (dy / dist) * GUN_BARREL_LENGTH;
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', String(tipX));
          line.setAttribute('y1', String(tipY));
          line.setAttribute('x2', String(endX));
          line.setAttribute('y2', String(endY));
          line.classList.add('laser-line');
          svg.appendChild(line);

          const start = performance.now();
          (function animateLaser(now: number) {
               const t = Math.min((now - start) / 200, 1);
               line.setAttribute('x1', String(tipX + (endX - tipX) * t));
               line.setAttribute('y1', String(tipY + (endY - tipY) * t));
               line.style.opacity = String(1 - t);
               if (t < 1) requestAnimationFrame(animateLaser);
               else line.remove();
          })(performance.now());
     }

     function vaporize_loop(now: number) {
          for (let i = active_vaporizations.length - 1; i >= 0; i--) {
               const v = active_vaporizations[i];
               const t = Math.min((now - v.start) / 2000, 0.75);
               v.el.style.transform = `translate(${para(0, t, v.hr)}px, ${para(0, t, v.hb)}px) rotateX(68deg) rotateY(${lerp(0, v.dy, t)}deg) rotateZ(${lerp(39, 2500, t)}deg) scale(${lerp(1, -.2, t)})`;
               if (t >= 0.75) {
                    fireLaser(v);
                    v.resolve([para(0, 0.75, v.hr), para(0, 0.75, v.hb)]);
                    active_vaporizations.splice(i, 1);
               }
          }
          updateGun(now);
          if (active_vaporizations.length > 0) {
               vaporize_raf = requestAnimationFrame(vaporize_loop);
          } else {
               vaporize_raf = null;
          }
     }

     function lerp(a: number, b: number, p: number): number {
          return a + ((b - a) * p);
     }

     function para(a: number, p: number, h: number): number {
          return a + (-h * p * (p - 1))
     }

     async function print(r: HTMLElement): Promise<void> {
          const duration = Math.max(300, 5000 / print_speed);
          r.style.transform = `translateX(155px) translateY(-100px) rotateX(68deg) rotateZ(39deg)`;
          return new Promise((resolve) => {
               const start = performance.now();
               function frame(now: number) {
                    const t = Math.min((now - start) / duration, 1);
                    r.style.transform = `translateX(${lerp(155, 0, t)}px) translateY(${lerp(-100, -30, t)}px) rotateX(68deg) rotateZ(39deg)`;
                    if (t < 1) requestAnimationFrame(frame);
                    else resolve();
               }
               requestAnimationFrame(frame);
          });
     }

     async function fall(r: HTMLElement): Promise<void> {
          return new Promise((resolve) => {
               const start = performance.now();
               function frame(now: number) {
                    const t = Math.min((now - start) / 100, 1);
                    r.style.transform = `translateX(0px) translateY(${lerp(-30, 0, t)}px) rotateX(68deg) rotateZ(39deg)`;
                    if (t < 1) requestAnimationFrame(frame);
                    else resolve();
               }
               requestAnimationFrame(frame);
          });
     }

     async function vaporize(r: HTMLElement): Promise<[number, number]> {
          const gwindow = document.getElementById('gwindow');
          const hr = Math.random() * -gwindow!.clientWidth * 2 - 750;
          const hb = Math.random() * -gwindow!.clientHeight * 2 - 750;
          const dy = Math.random() * 20 + 35;
          return new Promise((resolve) => {
               active_vaporizations.push({ el: r, start: performance.now(), hr, hb, dy, resolve });
               if (vaporize_raf === null) {
                    vaporize_raf = requestAnimationFrame(vaporize_loop);
               }
          });
     }

     async function finish(r: HTMLElement, tx: number, ty: number): Promise<void> {
          (r.firstElementChild! as HTMLElement).style.display = 'none';
          (r.firstElementChild!.nextElementSibling! as HTMLElement).style.display = 'inline';
          r.style.transform = `translate(${tx - 60}px, ${ty - 70}px)`;
          return new Promise((resolve) => {
               const start = performance.now();
               function frame(now: number) {
                    const i = Math.min((now - start) / 1000, 1);
                    r.style.transform = `translate(${tx - 60}px, ${ty - i * 15 - 70}px)`;
                    r.style.opacity = `${1 - i}`;
                    if (i < 1) requestAnimationFrame(frame);
                    else resolve();
               }
               requestAnimationFrame(frame);
          });
     }

     function spawn_manual(): any {
          if (blockPrint) { return; }
          spawn_resume();
          if (manualPrintDelay > 0) {
               blockPrint = true;
               setTimeout(() => { blockPrint = false; }, manualPrintDelay);
          }
     }

     async function spawn_resume() {
          var new_id = id++;
          var worth = resumeWorth * copeMult;
          var resume_snapshot = effectiveResume;
          var effects_snapshot = [...activeEffects];
          active_resumes.push({id: new_id, worth, resume: resume_snapshot, effects: effects_snapshot});
          await settled();
          var r = document.getElementById(`resume${new_id}`);
          if (!r) return;
          await print(r);
          await fall(r);
          const [tx, ty] = await vaporize(r);
          score += worth;
          totalDestroyed++;
          await finish(r, tx, ty);
          r.remove();
          active_resumes = active_resumes.filter(res => res.id != new_id);
     }
</script>

{#if showToast}
<div id="toast" role="status">
     Cope as much as you can in 5 minutes. Upgrade your resume/printer to Cope harder. Good luck!
</div>
{/if}

<div id="game-container">
     <div id="gwindow">
          <div id="game-viewport">
               <GameBg />
               <svg id="laser-canvas"></svg>
               {@render table()}
               {@render printer_tray()}
               <div id="resumes-container">
                    {#each active_resumes as res (res.id)}
                    <div id="resume{res.id}" class="resume-cont">
                         <Resume resume={res.resume} height={132} width={102} effects={res.effects} />
                         <p style="display: none">+{shortFormat(res.worth)} Cope</p>
                    </div>
                    {/each}
               </div>
               {@render printer_top()}
               <div id="print-btn">
                    <button disabled={blockPrint} onclick={spawn_manual}>Print</button>
               </div>
               {@render railgun()}
          </div>
          <div id="hud">
               <span>Cope: {shortFormat(score)}</span>
               <span>Application Window: {time}s</span>
          </div>
          <div id="upgrades">
               <p id="cope-per-resume" class:rainbow={allMaxed}>
                    +<span>{shortFormat(resumeWorth * copeMult)}</span> / resume
                    <small>({shortFormat(resumeWorth)} × {shortFormat(copeMult)})</small>
               </p>
               <div id="panes">
                    <div class="upgrades-pane">
                         <p class="pane-title">{manualDelayLevel >= MANUAL_DELAY_TIERS.length ? 'Resume Buffs' : 'Manual Print'}</p>
                         {#if manualDelayLevel < MANUAL_DELAY_TIERS.length}
                              <div class="upgrade">
                                   <p>Print Delay</p>
                                   <p class="upgrade-status">{MANUAL_DELAY_LABELS[manualDelayLevel]} → {MANUAL_DELAY_LABELS[manualDelayLevel + 1]}</p>
                                   <button
                                        onclick={buy_manual_delay}
                                        disabled={score < MANUAL_DELAY_TIERS[manualDelayLevel].cost}>
                                        {shortFormat(MANUAL_DELAY_TIERS[manualDelayLevel].cost)} Cope
                                   </button>
                              </div>
                         {:else if multLevel < MULT_UPGRADES.length}
                              {@const upg = MULT_UPGRADES[multLevel]}
                              <div class="upgrade">
                                   <p>{upg.name}</p>
                                   <p class="upgrade-status">×{upg.mult} Cope/resume</p>
                                   <button onclick={buy_mult} disabled={score < upg.cost}>
                                        {shortFormat(upg.cost)} Cope
                                   </button>
                              </div>
                         {:else}
                              <div class="upgrade">
                                   <p>Resume Buffs</p>
                                   <p class="upgrade-status">×{copeMult} total — Maxed!</p>
                              </div>
                         {/if}
                    </div>
                    <div class="upgrades-pane">
                         <p class="pane-title">Auto-Print</p>
                         {#if !autoPrintUnlocked}
                         <div class="upgrade">
                              <p>Unlock Auto-Print</p>
                              <p class="upgrade-status">prints every 1s</p>
                              <button onclick={buy_auto_print} disabled={score < AUTO_PRINT_UNLOCK_COST}>
                                   {shortFormat(AUTO_PRINT_UNLOCK_COST)} Cope
                              </button>
                         </div>
                         {:else if autoPrintLevel >= AUTO_PRINT_TIERS.length}
                         <div class="upgrade">
                              <p>Auto-Print Speed</p>
                              <p class="upgrade-status">0.01s — Maxed!</p>
                         </div>
                         {:else}
                         <div class="upgrade">
                              <p>Auto-Print Speed</p>
                              <p class="upgrade-status">{AUTO_PRINT_LABELS[autoPrintLevel]} → {AUTO_PRINT_LABELS[autoPrintLevel + 1]}</p>
                              <button onclick={buy_auto_print_speed} disabled={score < AUTO_PRINT_TIERS[autoPrintLevel].cost}>
                                   {shortFormat(AUTO_PRINT_TIERS[autoPrintLevel].cost)} Cope
                              </button>
                         </div>
                         {/if}
                    </div>
               </div>
               <div id="skill-exp-panes">
                    <div class="upgrades-pane">
                         <p class="pane-title">Skills ({unlockedSkillCount}/{maxSkills})</p>
                         {#if resume && unlockedSkillCount < maxSkills}
                              {@const nextIdx = unlockedSkillCount - 3}
                              <div class="upgrade small">
                                   <p>+ {resume.skills[unlockedSkillCount]}</p>
                                   <p class="upgrade-status">+{SKILL_BONUS} Cope/resume</p>
                                   <button onclick={buy_skill} disabled={score < SKILL_COSTS[nextIdx]}>
                                        {shortFormat(SKILL_COSTS[nextIdx])} Cope
                                   </button>
                              </div>
                         {:else if !aiUnlocked}
                              <div class="upgrade small">
                                   <p style="font-size: 2rem; color: cyan">+ AI</p>
                                   <p class="upgrade-status">×1000 Cope/resume</p>
                                   <button onclick={buy_ai_skill} disabled={score < AI_SKILL_COST}>
                                        {shortFormat(AI_SKILL_COST)} Cope
                                   </button>
                              </div>
                         {:else}
                              <p class="maxed">All skills unlocked!</p>
                         {/if}
                    </div>
                    <div class="upgrades-pane">
                         <p class="pane-title">Experience</p>
                         {#if resume && nextExpIdx >= 0}
                              {@const i = nextExpIdx}
                              <div class="upgrade small">
                                   <p>{resume.experience[i].company}</p>
                                   <p class="upgrade-status">+{EXP_BONUSES[i]} Cope/resume</p>
                                   <button onclick={() => buy_exp(i)} disabled={score < EXP_COSTS[i]}>
                                        {shortFormat(EXP_COSTS[i])} Cope
                                   </button>
                              </div>
                         {:else if resume}
                              <p class="maxed">All experience upgraded!</p>
                         {/if}
                    </div>
               </div>
               <div id="resume-display" bind:clientWidth={displayWidth} bind:clientHeight={displayHeight}>
                    {#if resumeDisplayW > 0 && resumeDisplayH > 0}
                         <Resume resume={effectiveResume} width={resumeDisplayW} height={resumeDisplayH} effects={activeEffects} />
                    {/if}
               </div>
          </div>
     </div>
</div>

<style>
     #resumes-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
     }
     .resume-cont {
          will-change: transform;
          position: absolute;
          bottom: 40px;
          right: 185px;
          transform: rotateX(68deg) rotateZ(39deg);
     }
     .resume-cont > p {
          position: absolute;
          text-align: center;
          width: 200px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
     }
     #game-container {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
     }
     #gwindow {
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
     #game-viewport {
          position: absolute;
          inset: 0;
          overflow: hidden;
     }
     #laser-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: visible;
     }
     :global(.laser-line) {
          stroke: #ff2200;
          stroke-width: 2px;
          stroke-linecap: round;
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
     #cope-per-resume {
          margin: 0;
          padding: 4px 8px;
          font-size: 2rem;
          font-weight: bold;
          color: #eee;
          border-bottom: 1px solid #444;
          padding-bottom: 8px;
          margin-bottom: 4px;
          text-align: center;
     }
     #cope-per-resume small {
          font-size: 0.75em;
          color: #aaa;
          font-weight: normal;
     }
     @keyframes rainbow-text {
          0%   { color: #ff4444; }
          16%  { color: #ffaa00; }
          33%  { color: #ffff00; }
          50%  { color: #44ff44; }
          67%  { color: #44aaff; }
          83%  { color: #cc44ff; }
          100% { color: #ff4444; }
     }
     #cope-per-resume.rainbow span {
          animation: rainbow-text 1s linear infinite;
     }

     #print-btn {
          position: absolute;
          bottom: 240px;
          right: 60px;
          transform: rotateX(65deg) rotateY(-2deg) rotateZ(30deg);
     }
     #print-btn button {
          font-size: 55px;
     }
     #printer-top, #printer-tray {
          position: absolute;
          bottom: 100px;
          right: 0;
          height: 250px;
     }
     #table {
          position: absolute;
          bottom: 0px;
          right: 0;
          height: 250px;
     }
     #railgun {
          position: absolute;
          width: 400px;
          top: -130px;
          left: -120px;
          transform-origin: 25% 50%;
          transform: rotate(20deg);
          animation-name: idle;
          animation-duration: 5s;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
     }
     @keyframes idle {
          0% {
               transform: rotate(20deg);
          }
          40% {
               transform: rotate(40deg);
          }
          50% {
               transform: rotate(40deg);
          }
          90% {
               transform: rotate(20deg);
          }
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
          gap: 10px;
          padding: 12px;
          box-sizing: border-box;
          overflow: hidden;
     }
     #panes {
          display: flex;
          flex-direction: row;
          gap: 10px;
          flex-shrink: 0;
     }
     .upgrades-pane {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
     }
     #skill-exp-panes {
          display: flex;
          flex-direction: row;
          gap: 10px;
          flex-shrink: 0;
     }
     #resume-display {
          flex: 1;
          min-height: 0;
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
     }
     .upgrade {
          border-radius: 5px;
          background: #222;
          padding: 10px;
          text-align: center;
          font-size: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 8px;
     }
     .upgrade.small {
          font-size: 1.3rem;
          padding: 7px;
          gap: 5px;
     }

     .pane-title {
          font-size: 1.2rem;
          font-weight: bold;
          text-align: center;
          color: #aaa;
          margin: 0;
          padding: 0;
     }
     .upgrade-status {
          font-size: 0.85em;
          color: #aaa;
          margin: 0;
          padding: 0;
     }
     .maxed {
          font-size: 1rem;
          color: #777;
          text-align: center;
          margin: 0;
          padding: 4px;
     }
     button {
          background-color: #8c00dc;
          font-family: inherit;
          font-size: 1.5rem;
          color: #DDD;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          padding: 4px 8px;
     }
     button:disabled {
          background-color: #444;
          color: #666;
          cursor: not-allowed;
     }
     p {
          margin: 0;
          padding: 0;
     }
     #toast {
          position: fixed;
          max-width: 80%;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #333;
          color: #eee;
          font-size: 2rem;
          padding: 14px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5);
          z-index: 1000;
          pointer-events: none;
          animation: toast-in-out 8s ease forwards;
          white-space: nowrap;
     }
     @keyframes toast-in-out {
          0%   { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          10%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          75%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
     }
</style>

{#snippet printer_top()}
<svg id="printer-top" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 400">
  <defs>
    <style>
      .uuid-9eb5c275-65c0-4ae7-b0b0-455e48485c2a {
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .uuid-9eb5c275-65c0-4ae7-b0b0-455e48485c2a, .uuid-9ce589be-06d9-410f-bb4c-afb3f14b4a40, .uuid-655ad109-8485-410d-8984-4860e5002089 {
        stroke: #231f20;
      }

      .uuid-9eb5c275-65c0-4ae7-b0b0-455e48485c2a, .uuid-655ad109-8485-410d-8984-4860e5002089 {
        fill: none;
      }

      .uuid-9ce589be-06d9-410f-bb4c-afb3f14b4a40, .uuid-655ad109-8485-410d-8984-4860e5002089 {
        stroke-miterlimit: 10;
      }

      .uuid-9ce589be-06d9-410f-bb4c-afb3f14b4a40, .uuid-16c2e486-cc56-44b9-b2a4-d7a64ad7964e {
        fill: #808285;
      }

      .uuid-16c2e486-cc56-44b9-b2a4-d7a64ad7964e, .uuid-72663f1b-a1d4-478b-a66b-dee8b387d30f {
        stroke-width: 0px;
      }

      .uuid-72663f1b-a1d4-478b-a66b-dee8b387d30f {
        fill: #231f20;
      }
    </style>
  </defs>
  <path class="uuid-16c2e486-cc56-44b9-b2a4-d7a64ad7964e" d="m176.36,76.1l-91.37,37.31s-11.57,5.53,3.11,9.15,243.62,51.43,243.62,51.43c0,0,27.1,6.9,40.14-3.58s65.96-45.76,65.96-45.76c0,0,8.44-7.41-13.55-11.5s-221.65-37.58-221.65-37.58c0,0-15.43-2.76-26.25.54Z"/>
  <path class="uuid-16c2e486-cc56-44b9-b2a4-d7a64ad7964e" d="m439.3,120.68l2.94,13.09s.7,3.22,4.27,3.29l-2.27,104.29-83.52,78.31s-4.59,5.51-18.36,2.75-65.76-19.52-65.76-19.52c0,0-4.02-.27-4.02-4.15s.67-55.72.67-55.72l-147.98-37.06,1.02,43.73-16,6.54-28.45-8.2s-3.71.15-4.02-4.79-3.37-62.83-3.37-62.83c0,0,0-12.89,2.21-17.92s1.01-24.97,1.01-24.97c0,0,.4-4.63,3.22-5.03l-.3-14.41"/>
  <path class="uuid-9eb5c275-65c0-4ae7-b0b0-455e48485c2a" d="m176.36,76.1s14.9-3.29,26.25-.54,221.65,37.58,221.65,37.58c0,0,19.99,3.68,14.54,10.62s-65.75,46.06-65.75,46.06c0,0-11.89,11.14-39.99,4.58s-244.09-51.7-244.09-51.7c0,0-16.83-4.22-4.59-9.29s91.98-37.31,91.98-37.31Z"/>
  <path class="uuid-9eb5c275-65c0-4ae7-b0b0-455e48485c2a" d="m77.67,137.52s1,20.75-1.01,24.97-2.21,17.92-2.21,17.92c0,0,3.11,57.68,3.37,62.83s4.02,4.79,4.02,4.79l28.45,8.2,16-6.54-1.02-43.73,147.98,37.06s-.61,50.22-.67,55.72,4.02,4.15,4.02,4.15c0,0,48.66,16.35,65.76,19.52s18.36-2.75,18.36-2.75l83.52-78.31,2.27-104.29s-54.2,40.97-71.99,55-41.52,4.94-41.52,4.94c0,0-236.06-51.94-248.09-55.17s-3.88-8.64-3.88-8.64l-.44-15.11"/>
  <path class="uuid-655ad109-8485-410d-8984-4860e5002089" d="m439.41,122.51l2.77,10.7s.42,3.57,4.33,3.84"/>
  <path class="uuid-655ad109-8485-410d-8984-4860e5002089" d="m371.86,170.41l.29,16.4s-.24,3.74,2.37,5.24l-1.68,45.02s.23,5.69-3.95,8.12-6.96,4.53-6.96,4.53c0,0-6.85,3.95-16.83,1.28s-71.49-18.45-71.49-18.45l-.36,10.47-147.98-37.06-.41-9.86s-44.28-11.15-46.97-11.74-3.35-1.76-3.35-1.76"/>
  <line class="uuid-655ad109-8485-410d-8984-4860e5002089" x1="445.47" y1="177.62" x2="372.84" y2="237.07"/>
  <path class="uuid-655ad109-8485-410d-8984-4860e5002089" d="m374.08,204.26s-15.32,12.57-48.49,4.55c-33.16-8.02-238.6-54.35-238.6-54.35,0,0-8.02-2.75-9.34-5.03"/>
  <path class="uuid-655ad109-8485-410d-8984-4860e5002089" d="m120.26,129.48l1.02,14.72s.64,3.58-2.43,5.63l.38,12.03"/>
  <line class="uuid-655ad109-8485-410d-8984-4860e5002089" x1="361.93" y1="249.72" x2="360.72" y2="319.66"/>
  <path class="uuid-655ad109-8485-410d-8984-4860e5002089" d="m312.34,169.87l.84,17.1s.64,3.58-2.43,5.63l.33,12.97"/>
  <g>
    <path class="uuid-72663f1b-a1d4-478b-a66b-dee8b387d30f" d="m174.61,199.48c1.04.22,1.57.33,2.64.56-.03.99-.05,1.48-.08,2.44-.53-.11-.8-.16-1.32-.27-.01.49-.02.73-.03,1.21-2.62-.51-3.89-.74-6.32-1.17,0-.51,0-.76,0-1.27-.49-.09-.73-.14-1.21-.23v-10.28c.51.11.76.17,1.27.29,0-.51,0-.77,0-1.28,2.57.59,3.9.89,6.6,1.49-.01.5-.02.75-.03,1.26.54.12.81.18,1.35.3-.03,1-.05,1.51-.08,2.52-1.08-.24-1.62-.36-2.68-.59.01-.51.02-.76.03-1.26-1.06-.24-1.59-.35-2.63-.58,0,.51-.01.76-.02,1.27-.52-.11-.78-.17-1.29-.28-.02,2.04-.04,3.06-.06,5.09.5.1.75.15,1.26.26,0,.5-.01.76-.02,1.26,1.01.2,1.53.31,2.57.52.01-.49.02-.74.03-1.24Z"/>
    <path class="uuid-72663f1b-a1d4-478b-a66b-dee8b387d30f" d="m178.78,195.34c.55.12.82.18,1.37.3.02-.5.03-.75.05-1.26.55.12.83.18,1.39.31.02-.5.03-.75.05-1.25.56.12.84.19,1.4.31.02-.5.03-.75.05-1.25.56.12.84.19,1.41.31-.02.5-.03.74-.05,1.24.57.12.85.19,1.42.31-.02.5-.03.75-.06,1.25.57.13.85.19,1.42.32-.02.5-.04.75-.06,1.26.57.13.86.19,1.43.32-.18,3.52-.28,5.34-.43,8.43-1.14-.24-1.71-.36-2.83-.6.04-.9.06-1.36.11-2.31-1.69-.37-2.53-.55-4.17-.91-.04.96-.06,1.43-.1,2.36-1.09-.22-1.64-.33-2.71-.54.11-3.29.19-5.08.31-8.6Zm2.6,4.35c1.66.36,2.49.55,4.19.93.05-.98.07-1.48.12-2.48-.57-.13-.85-.19-1.41-.31.02-.5.03-.75.06-1.25-.56-.12-.84-.19-1.4-.31-.02.5-.03.75-.06,1.25-.56-.12-.84-.19-1.39-.31-.04,1-.06,1.5-.11,2.49Z"/>
    <path class="uuid-72663f1b-a1d4-478b-a66b-dee8b387d30f" d="m195.59,204.1c-.59-.13-.88-.2-1.46-.33.05-.96.08-1.45.14-2.45-.58-.13-.88-.2-1.46-.33-.14,2.49-.21,3.72-.32,5.88-1.16-.25-1.74-.38-2.89-.62.22-4.37.4-7.22.62-12.17,1.74.38,2.61.57,4.37.96-.05.99-.07,1.5-.12,2.51.59.13.88.19,1.47.32-.05,1.01-.08,1.52-.14,2.53.59.13.88.2,1.47.33-.06,1.01-.08,1.51-.14,2.5.59.13.88.2,1.47.34.17-2.95.27-4.58.41-7.56,1.18.26,1.78.39,2.96.65-.24,4.98-.45,8.04-.68,12.16-1.78-.4-2.66-.59-4.43-.98.02-.42.03-.64.06-1.08-.59-.13-.88-.2-1.47-.33.05-.89.08-1.36.13-2.31Z"/>
    <path class="uuid-72663f1b-a1d4-478b-a66b-dee8b387d30f" d="m208.91,207.16c-.59-.14-.89-.21-1.49-.34.06-.95.09-1.45.15-2.46-.6-.14-.89-.2-1.49-.34-.15,2.52-.23,3.77-.34,5.79-1.19-.27-1.78-.4-2.97-.66.23-4.09.45-7.18.68-12.17,1.79.39,2.68.58,4.47.97-.05,1-.08,1.52-.13,2.55.6.13.9.2,1.49.33-.06,1.04-.09,1.56-.15,2.59.6.14.89.2,1.49.34-.06,1.03-.09,1.55-.16,2.54.59.14.89.21,1.48.34.19-2.97.3-4.69.45-7.71,1.19.26,1.79.39,2.98.65-.26,5.05-.52,8.36-.76,12.23-1.77-.4-2.65-.6-4.43-1,.02-.4.04-.6.06-1.03-.59-.14-.89-.2-1.48-.34.05-.86.08-1.32.14-2.27Z"/>
    <path class="uuid-72663f1b-a1d4-478b-a66b-dee8b387d30f" d="m216.81,201.18c.59.13.89.2,1.48.33.03-.52.04-.78.07-1.28,2.97.65,4.45.98,7.38,1.62-.03.51-.05.77-.09,1.29.58.13.88.19,1.46.32-.31,4.19-.54,6.73-.84,9.98-.57-.13-.85-.19-1.42-.32-.04.41-.05.6-.08.97-2.84-.63-4.29-.96-7.21-1.62.03-.38.04-.58.07-1-.59-.13-.88-.2-1.47-.34.23-3.36.41-5.8.65-9.95Zm5.35,9.05c.58.13.87.2,1.45.33.15-1.9.24-2.99.4-5.11-.58-.13-.88-.2-1.46-.33.04-.53.06-.8.09-1.32-.59-.13-.88-.2-1.47-.33-.03.53-.05.79-.09,1.32-.59-.13-.88-.2-1.47-.33-.14,2.11-.22,3.19-.36,5.09.58.14.88.2,1.46.34-.04.48-.05.71-.09,1.16.58.13.87.2,1.45.33.04-.45.05-.68.09-1.15Z"/>
    <path class="uuid-72663f1b-a1d4-478b-a66b-dee8b387d30f" d="m233.47,212.83c-.55-.13-.82-.19-1.38-.31.1-.94.16-1.44.26-2.48-.56-.13-.84-.19-1.4-.32-.25,2.58-.39,3.85-.59,5.6-1.1-.24-1.66-.36-2.78-.61.35-3.59.7-7.13,1.07-12.22,1.74.39,2.61.58,4.33.96-.09,1.02-.14,1.55-.24,2.62.57.13.85.19,1.41.32-.11,1.07-.16,1.61-.27,2.67.56.13.83.19,1.39.32-.12,1.06-.18,1.58-.3,2.57.55.12.82.19,1.36.31.38-2.96.59-4.8.91-7.85,1.12.25,1.68.38,2.79.63-.6,5.05-1.1,8.76-1.68,12.02-1.54-.33-2.33-.49-3.92-.84.05-.34.07-.52.12-.91-.54-.12-.81-.18-1.35-.3.1-.78.15-1.23.26-2.16Z"/>
  </g>
  <polygon class="uuid-9ce589be-06d9-410f-bb4c-afb3f14b4a40" points="125.33 217.08 273.23 254.1 273.26 243.02 125.27 205.96 125.33 217.08"/>
</svg>
{/snippet}

{#snippet printer_tray()}
<svg id="printer-tray" data-name="Layer 3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 400">
  <defs>
    <style>
      .uuid-7f808056-e243-4045-b565-8e940d1b2d66 {
        fill: #808285;
        stroke: #231f20;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    </style>
  </defs>
  <path class="uuid-7f808056-e243-4045-b565-8e940d1b2d66" d="m257.31,297.43s8.42,4.48,15.27,1.31l-.07-8.85s-10.01,1.24-15.08-1.85l-.12,9.4Z"/>
  <path class="uuid-7f808056-e243-4045-b565-8e940d1b2d66" d="m257.43,288.03l-46.98,27.76-125.9-40.47,44.42-19.47s-6.21-1.29-3.25-5.85l51.08-20.19,95.82,24.35-.12,35.72s-11.87.33-15.08-1.85Z"/>
  <line class="uuid-7f808056-e243-4045-b565-8e940d1b2d66" x1="125.73" y1="250.01" x2="110.43" y2="256.31"/>
  <polygon class="uuid-7f808056-e243-4045-b565-8e940d1b2d66" points="257.31 297.43 247.31 294.11 257.43 288.03 257.31 297.43"/>
  <path class="uuid-7f808056-e243-4045-b565-8e940d1b2d66" d="m122.93,258.41s-.64-4.83,2.81-8.39c0,0-.74,4.84,3.25,5.85l-6.05,2.55Z"/>
  <polygon class="uuid-7f808056-e243-4045-b565-8e940d1b2d66" points="125.57 217.06 176.03 229.98 126.34 249.71 125.57 217.06"/>
  <polygon class="uuid-7f808056-e243-4045-b565-8e940d1b2d66" points="257.18 291.53 210.88 320.65 210.46 315.8 257.43 288.03 257.18 291.53"/>
  <polygon class="uuid-7f808056-e243-4045-b565-8e940d1b2d66" points="84.56 275.33 84.7 280.51 210.88 320.65 210.46 315.8 84.56 275.33"/>
</svg>
{/snippet}

{#snippet table()}
<svg id="table" data-name="Layer 4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 400">
  <defs>
    <style>
      .uuid-6cc2cf78-513d-4bef-827c-a06ba636df0b {
        fill: #603913;
        stroke: #231f20;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    </style>
  </defs>
  <polygon class="uuid-6cc2cf78-513d-4bef-827c-a06ba636df0b" points="433.67 467.23 433.67 87.93 454.72 94.5 454.72 479.61 433.67 467.23"/>
  <polygon class="uuid-6cc2cf78-513d-4bef-827c-a06ba636df0b" points="454.72 479.61 470.96 463.7 470.96 99.16 454.72 94.5 454.72 479.61"/>
  <polygon class="uuid-6cc2cf78-513d-4bef-827c-a06ba636df0b" points="32.98 87.07 364.85 188.07 474.37 72.64 163.5 .5 32.98 87.07"/>
  <polygon class="uuid-6cc2cf78-513d-4bef-827c-a06ba636df0b" points="364.85 188.07 474.37 72.64 474.37 95.82 364.81 221.17 32.98 118.41 32.98 87.07 364.85 188.07"/>
  <polygon class="uuid-6cc2cf78-513d-4bef-827c-a06ba636df0b" points="337.56 212.45 359.57 219.37 359.57 483.1 339.74 476.22 337.56 212.45"/>
  <polyline class="uuid-6cc2cf78-513d-4bef-827c-a06ba636df0b" points="364.85 188.07 364.81 221.17 359.57 219.37 359.39 473.81 373.06 466.67 373.06 211.74 364.74 221.05"/>
  <polygon class="uuid-6cc2cf78-513d-4bef-827c-a06ba636df0b" points="39.58 465.08 39.58 120.79 60.63 127.36 60.63 477.47 39.58 465.08"/>
  <polygon class="uuid-6cc2cf78-513d-4bef-827c-a06ba636df0b" points="60.63 477.47 76.86 461.56 76.86 132.02 60.63 127.36 60.63 477.47"/>
  <polygon class="uuid-6cc2cf78-513d-4bef-827c-a06ba636df0b" points="145.17 483.06 145.17 154.12 165.28 160.4 165.28 494.89 145.17 483.06"/>
  <polygon class="uuid-6cc2cf78-513d-4bef-827c-a06ba636df0b" points="165.28 494.89 180.79 479.69 180.79 164.85 165.28 160.4 165.28 494.89"/>
</svg>
{/snippet}

{#snippet railgun()}
<svg id="railgun" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 550.37 396.99">
  <defs>
    <style>
      .cls-1 {
        fill: #ed1c24;
      }

      .cls-1, .cls-2, .cls-3 {
        stroke: #231f20;
        stroke-miterlimit: 10;
      }

      .cls-2 {
        fill: #808285;
      }

      .cls-4 {
        fill: #231f20;
        stroke-width: 0px;
      }

      .cls-3 {
        fill: url(#linear-gradient);
      }
    </style>
    <linearGradient id="linear-gradient" x1="265.33" y1="175.76" x2="486.59" y2="175.76" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff33b"/>
      <stop offset="0" stop-color="#fee62d"/>
      <stop offset=".01" stop-color="#fdd51b"/>
      <stop offset=".02" stop-color="#fdca0f"/>
      <stop offset=".03" stop-color="#fdc70c"/>
      <stop offset=".08" stop-color="#f3903f"/>
      <stop offset=".09" stop-color="#f28d3e"/>
      <stop offset=".18" stop-color="#f07c3d"/>
      <stop offset=".29" stop-color="#ee703c"/>
      <stop offset=".45" stop-color="#ed693c"/>
      <stop offset=".89" stop-color="#ed683c"/>
      <stop offset="1" stop-color="#ee3432"/>
    </linearGradient>
  </defs>
  <path class="cls-2" d="m29.9,183.45s14.33,20.51,14.55,47.85l56.22,15.43s6.61,1.1,7.06,7.72c0,0,16.1,3.97,21.83,3.31l2.87-6.84-4.19-3.53,10.36-33.29s1.98-4.41,7.28-4.41,26.02-.22,26.02-.22l1.76-2.2,23.37-.66.44-7.28s.44-11.24-12.35-11.69-125.68,0-125.68,0l-1.76-4.63-27.78.44Z"/>
  <path class="cls-2" d="m53.05,182.79l2.87-4.19,50.49.22,30.87-17.2s7.5-2.65,12.13-2.43l1.76-3.09,1.54-.22,5.51-4.63,20.06.44,3.09,8.82h10.14l-.44-7.06,10.58-.88,63.72-1.1,3.31,23.59-3.75,3.97-211.89,3.75Z"/>
  <path class="cls-2" d="m264.94,178.16l-207.26,4.85,1.76,4.63s112.67-.66,125.68,0,12.35,11.69,12.35,11.69l-.44,7.28,76.29-1.32,2.43-13.01-10.8-13.23"/>
  <polygon class="cls-2" points="265.38 151.48 265.83 155.56 268.03 155.01 268.8 153.13 442.11 153.02 433.84 159.64 435.82 164.27 267.48 166.17 265.38 151.48"/>
  <polygon class="cls-2" points="435.82 164.27 433.84 172.65 302.65 172.87 292.89 165.81 435.82 164.27"/>
  <polygon class="cls-2" points="275.47 193.59 462.5 192.27 444.42 188.3 445.96 181.91 268.42 183.39 275.36 192.1 275.47 193.59"/>
  <polygon class="cls-2" points="274.53 199.55 463.44 197.51 462.5 192.27 275.47 193.59 274.53 199.55"/>
  <polygon class="cls-2" points="445.58 183.95 453.93 186.26 471.87 181.8 484.44 183.78 486.34 180.06 495.77 179.81 491.47 191.14 485.02 198 463.44 197.51 462.5 192.27 444.42 188.3 445.58 183.95"/>
  <polygon class="cls-2" points="433.84 172.65 499.21 171.21 496.35 164.38 497.23 161.62 489.07 152.69 441.66 152.91 433.84 159.64 435.82 164.27 433.84 172.65"/>
  <polygon class="cls-1" points="486.59 171.46 486.34 180.06 495.77 179.81 495.77 171.21 486.59 171.46"/>
  <polygon class="cls-3" points="267.48 166.17 293.11 165.26 302.65 172.87 486.59 171.46 486.34 180.06 484.44 183.78 471.87 181.8 453.93 186.26 445.58 183.95 445.96 181.91 268.42 183.39 265.33 179.03 268.69 175.07 267.48 166.17"/>
  <path class="cls-2" d="m135.43,223.63l14.06,3.56,14.97-1.9,7.44-15.82-6.45.03-5.21,11.99-10.42,1.65-2.32-5.79,2.4-7.85-4.02.19s-5.84.17-7.28,4.41-3.17,9.54-3.17,9.54Z"/>
  <polygon class="cls-2" points="230.11 151.7 229.94 141.28 227.13 141.61 227.46 151.86 230.11 151.7"/>
  <polygon class="cls-2" points="155.64 209.8 153.54 219.06 151.5 218.4 153.38 209.69 155.64 209.8"/>
  <g>
    <path class="cls-4" d="m155.37,173.72l-1.15.05-.27-5.73,1.15-.05-.05-1.15,5.73-.27.05,1.15,1.15-.05.05,1.15-2.29.11-.05-1.15-3.44.16.27,5.73,3.44-.16-.05-1.15,2.29-.11.05,1.15-1.15.05.05,1.15-5.73.27-.05-1.15Z"/>
    <path class="cls-4" d="m164.53,173.29l-1.15.05-.27-5.73,1.15-.05-.05-1.15,5.73-.27.05,1.15,1.15-.05.27,5.73-1.15.05.05,1.15-5.73.27-.05-1.15Zm1.15-.05l3.44-.16-.27-5.73-3.44.16.27,5.73Z"/>
    <path class="cls-4" d="m172.61,174.06l-.38-8.02,2.29-.11.05,1.15,1.15-.05.05,1.15,1.15-.05-.05-1.15,1.15-.05-.05-1.15,2.29-.11.38,8.02-2.29.11-.22-4.58-1.15.05.05,1.15-1.15.05-.05-1.15-1.15.05.22,4.58-2.29.11Z"/>
    <path class="cls-4" d="m188.33,166.42l1.15-.05.11,2.29-1.15.05.05,1.15-4.58.22.16,3.44-2.29.11-.38-8.02,6.88-.33.05,1.15Zm-1.04,2.35l-.11-2.29-3.44.16.11,2.29,3.44-.16Z"/>
    <path class="cls-4" d="m190.94,173.19l-.27-5.73,1.15-.05-.05-1.15,1.15-.05-.05-1.15,3.44-.16.05,1.15,1.15-.05.05,1.15,1.15-.05.27,5.73-2.29.11-.11-2.29-3.44.16.11,2.29-2.29.11Zm5.57-3.71l-.11-2.29-1.15.05-.05-1.15-1.15.05.05,1.15-1.15.05.11,2.29,3.44-.16Z"/>
    <path class="cls-4" d="m200.11,172.75l-.38-8.02,2.29-.11.05,1.15,1.15-.05.05,1.15,1.15-.05.05,1.15,1.15-.05-.16-3.44,2.29-.11.38,8.02-2.29.11-.11-2.29-1.15.05-.05-1.15-1.15.05-.05-1.15-1.15.05.22,4.58-2.29.11Z"/>
    <path class="cls-4" d="m211.35,167.63l-1.15.05-.16-3.44,2.29-.11.16,3.44,2.29-.11-.16-3.44,2.29-.11.16,3.44-1.15.05.05,1.15-1.15.05.16,3.44-2.29.11-.16-3.44-1.15.05-.05-1.15Z"/>
    <path class="cls-4" d="m228.76,171.4l-.05-1.15,2.29-.11-.27-5.73-2.29.11-.05-1.15,6.88-.33.05,1.15-2.29.11.27,5.73,2.29-.11.05,1.15-6.88.33Z"/>
    <path class="cls-4" d="m236.78,171.02l-.38-8.02,2.29-.11.05,1.15,1.15-.05.05,1.15,1.15-.05.05,1.15,1.15-.05-.16-3.44,2.29-.11.38,8.02-2.29.11-.11-2.29-1.15.05-.05-1.15-1.15.05-.05-1.15-1.15.05.22,4.58-2.29.11Z"/>
    <path class="cls-4" d="m247.04,169.38l-1.15.05-.27-5.73,1.15-.05-.05-1.15,5.73-.27.05,1.15,1.15-.05.05,1.15-2.29.11-.05-1.15-3.44.16.27,5.73,3.44-.16-.05-1.15,2.29-.11.05,1.15-1.15.05.05,1.15-5.73.27-.05-1.15Z"/>
    <path class="cls-4" d="m257.41,170.04l-.11-2.29,2.29-.11.11,2.29-2.29.11Z"/>
  </g>
</svg>
{/snippet}
