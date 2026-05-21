<script lang="ts">
     let { resume, width, height, effects = [] }: {
          resume: any, width: number, height: number, effects?: string[]
     } = $props();
</script>

<div id="container"
     style="height: {height}px; width: {width}px; font-size: {width}px;"
     class:rust={effects.includes('rust')}
     class:laminate={effects.includes('laminate')}
     class:gold={effects.includes('gold')}
     class:dad={effects.includes('dad')}
     class:pope={effects.includes('pope')}
     class:helicopter={effects.includes('helicopter')}
     class:ai={effects.includes('ai')}>
     <p class="header" style="font-size: 0.1em; margin-top: 0.5em">{resume.name ? resume.name : 'Jobby McJobFace'}</p>
     <p class="body" style="font-size: 0.09em; margin-left: 0.25em">Skills:</p>
     <p class="body clamp-2" style="font-size: 0.05em;">{resume.skills.join(', ')}</p>
     <p class="body" style="font-size: 0.09em; margin-left: 0.25em">Experience:</p>
     {#each resume.experience as exp}
     <p class="body clamp-2" style="font-size: 0.055em">{exp.title} @ {exp.company}</p>
     <p class="body clamp-2" style="font-size: 0.05em; margin-left: 1em">{exp.description}</p>
     {/each}
     {#if effects.includes('rust')}
     <div class="memory-safe">MEMORY SAFE ✓</div>
     {/if}
     {#if effects.includes('dad')}
     <div class="stamp">APPROVED</div>
     {/if}
     {#if effects.includes('ai')}
     <div class="ai-disclaimer">AI ENABLED</div>
     {/if}
</div>

<style>
     #container {
          position: relative;
          background-color: #EEE;
          border: solid #111 5px;
          display: flex;
          flex-direction: column;
          color: #222;
          overflow: hidden;
     }
     p {
          margin: 0;
          padding: 0;
     }
     .header {
          width: calc(100% - 1em);
          margin-left: .5em;
          margin-right: .5em;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          text-wrap: nowrap;
          white-space: nowrap;
     }
     .body {
          margin-left: 0.5em;
          margin-right: 0.5em;
     }
     .clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
     }

     /* Rust: proper Rust brand aesthetic */
     #container.rust {
          background-color: #1a1a1a;
          border-color: #f74c00;
          border-width: 7px;
          color: #d4c5a9;
          box-shadow: 0 0 12px rgba(247, 76, 0, 0.4), inset 3px 0 0 #f74c00;
     }
     .memory-safe {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-20deg);
          font-size: 0.08em;
          font-weight: 900;
          color: rgba(78, 201, 74, 0.55);
          border: 0.018em solid rgba(78, 201, 74, 0.55);
          padding: 0.03em 0.07em;
          white-space: nowrap;
          pointer-events: none;
          z-index: 5;
          letter-spacing: 0.08em;
          font-family: monospace;
     }

     /* Laminate: glossy sheen via ::before overlay */
     #container.laminate::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.55) 0%, transparent 45%, rgba(255,255,255,0.1) 100%);
          pointer-events: none;
          z-index: 10;
     }

     /* Gold foil */
     #container.gold {
          border-color: #DAA520;
          border-width: 7px;
          background-color: #FFFDE7;
          color: #7B5900;
     }
     #container.rust.gold {
          background-color: #2a1f00;
          color: #e8b84b;
     }

     /* Dad: APPROVED stamp rendered as a child div */
     .stamp {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-25deg);
          font-size: 0.18em;
          font-weight: 900;
          color: rgba(190, 0, 0, 0.65);
          border: 0.015em solid rgba(190, 0, 0, 0.65);
          padding: 0.03em 0.08em;
          white-space: nowrap;
          pointer-events: none;
          z-index: 5;
          letter-spacing: 0.06em;
          font-family: serif;
     }

     /* Pope: layered solid rings — no blur, no repaint cost */
     #container.pope {
          outline: 3px double #DAA520;
          outline-offset: -8px;
          box-shadow: 0 0 0 4px #DAA520, 0 0 0 7px #FFFDE7, 0 0 0 10px #DAA520;
     }

     /* AI: chaotic gradient + disclaimer stamp */
     @keyframes ai-gradient {
          0%   { background-position: 0% 0%;     filter: hue-rotate(0deg)   saturate(3); }
          25%  { background-position: 100% 0%;   filter: hue-rotate(90deg)  saturate(4); }
          50%  { background-position: 100% 100%; filter: hue-rotate(180deg) saturate(3); }
          75%  { background-position: 0% 100%;   filter: hue-rotate(270deg) saturate(4); }
          100% { background-position: 0% 0%;     filter: hue-rotate(360deg) saturate(3); }
     }
     #container.ai {
          background: linear-gradient(135deg, #6600ff, #ff00cc, #00ccff, #ff6600, #6600ff);
          background-size: 600% 600%;
          animation: ai-gradient 1.2s linear infinite;
          border-color: #ff00cc;
          color: #fff;
          text-shadow: 0 0 6px rgba(255,255,255,0.6);
     }
     .ai-disclaimer {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(15deg);
          font-size: 0.12em;
          font-weight: 900;
          color: #fff;
          border: 0.018em solid #fff;
          padding: 0.03em 0.07em;
          white-space: nowrap;
          pointer-events: none;
          z-index: 5;
          letter-spacing: 0.06em;
          font-family: sans-serif;
     }

     /* Helicopter: animated prismatic border */
     @keyframes holographic {
          0%   { border-color: #ff6b6b; box-shadow: 0 0 8px #ff6b6b44; }
          20%  { border-color: #ffa94d; box-shadow: 0 0 8px #ffa94d44; }
          40%  { border-color: #ffd43b; box-shadow: 0 0 8px #ffd43b44; }
          60%  { border-color: #69db7c; box-shadow: 0 0 8px #69db7c44; }
          80%  { border-color: #74c0fc; box-shadow: 0 0 8px #74c0fc44; }
          100% { border-color: #da77f2; box-shadow: 0 0 8px #da77f244; }
     }
     #container.helicopter {
          animation: holographic 1.5s linear infinite;
     }
</style>
