<script lang="ts">
  import * as pdfjsLib from 'pdfjs-dist';
  import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
  import mammoth from 'mammoth';
  import { slide } from 'svelte/transition';
  import resume_gif from '../assets/my_career_fair_resumes.gif'

  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

  let { onlogin }: { onlogin: (text: string) => void } = $props();

  function generateGifPositions() {
    const positions: Array<{ left: number; top: number }> = [];
    let attempts = 0;
    while (positions.length < 12 && attempts < 500) {
      attempts++;
      // [8, 92)
      const left = 8 + Math.random() * 84;
      const top  = 8 + Math.random() * 84
      // Exclude center
      // if (left > 30 && left < 70 && top > 30 && top < 70) {continue;}
      // Avoid overlap with already-placed gifs
      if (positions.some(p => Math.abs(p.left - left) < 20 && Math.abs(p.top - top) < 20)) {continue;}
      positions.push({ left, top });
    }
    return positions;
  }

  const gifPositions = generateGifPositions();

  let resume: FileList | null | undefined = $state();
  let resume_text: string | null = $state(null);
  let error: string | null = $state(null);

  async function extractText(file: File): Promise<string> {
    const type = file.type;
    const name = file.name.toLowerCase();

    if (type === 'text/plain' || name.endsWith('.txt')) {
      return await file.text();
    }

    if (type === 'application/pdf' || name.endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        pages.push(content.items.map((item: any) => item.str + (item.hasEOL ? '\n' : ' ')).join(''));
      }
      return pages.join('\n');
    }

    if (
      type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.endsWith('.docx')
    ) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }

    throw new Error(`Unsupported file type: ${file.name}`);
  }

  $effect(() => {
    if (!resume) return;
    error = null;
    resume_text = null;
    extractText(resume[0])
      .then((text) => { resume_text = text; console.log(text) })
      .catch((e) => { console.log(e.message) });
  });
</script>

<div id="login-container" class="full">
  {#each gifPositions as pos}
    <div class="bg-gif"
    style="left: {pos.left}%; top: {pos.top}%; animation-delay: {Math.random() * -2000}ms"
    >
      <img
        src={resume_gif}
        alt='my resume, on fire'
      />
      <div style="animation-delay: {Math.random() * -500}ms"></div>
    </div>
  {/each}
  <div id="form">
    <p>...anyways, here's a copy of my resume to hold on to!</p>
    <div id="input-row">
      <label for="resume">PDF, Word Doc, or text file:
        <input
          name="resume"
          type="file"
          accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,text/plain,.txt"
          bind:files={resume}
          style="margin-left: 10px;"
        />
      </label>
      {#if resume && !resume_text && !error}
      <div class="spinner"></div>
      {/if}
    </div>
    {#if error}
    <p id="error">{error}</p>
    {/if}
    {#if resume_text}
    <button in:slide onclick={() => onlogin(resume_text!)}>Vaporize my CV!</button>
    {/if}
  </div>
</div>

<style>
  #login-container {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
    display: flex;
    justify-content: space-around;
    align-items: center;
    flex-direction: column;
    text-align: center;
  }
  .bg-gif {
    position: absolute;
    width: 130px;
    height: 130px;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 0;
    animation: float 4000ms ease-in-out infinite;
  }
  .bg-gif > img {
    width: 130px;
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
  }
  .bg-gif > div {
    position: absolute;
    width: 10px;
    height: 10px;
    top: 25%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    pointer-events: none;
    background-color: #d79000;
    box-shadow: 0 0px 50px 30px #d79000;
    z-index: -1;
    animation: flicker 1000ms infinite;
  }
  @keyframes flicker {
    0%   { box-shadow: 0 0 50px 30px #d79000; }
    15%  { box-shadow: 0 0 50px 32px #d79000; }
    30%  { box-shadow: 0 0 50px 31px #d79000; }
    50%  { box-shadow: 0 0 50px 29px #d79000; }
    70%  { box-shadow: 0 0 50px 32px #d79000; }
    85%  { box-shadow: 0 0 50px 30px #d79000; }
    100% { box-shadow: 0 0 50px 31px #d79000; }
  }
  @keyframes float {
    0% {transform: translate(-50%, -50%)}
    50% {transform: translate(-50%, calc(-50% + 10px))}
    100% {transform: translate(-50%, -50%)}
  }
  #form {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 30px;
    max-width: 80%;
    background-color: #333;
    border-radius: 10px;
    padding: 30px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  }
  button {
    text-align: center;
    font-size: 40pt;
    margin: 0;
    font-family: inherit;
    color: inherit;
    padding: 20px;
    -webkit-text-stroke: 2px #BBB;
    text-stroke: 2px #BBB;
    background-color: #222;
  }
  p {
    font-size: 30pt;
    margin: 0;
  }
  label {
    font-size: 20pt;
  }
  #input-row {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .spinner {
    width: 36px;
    height: 36px;
    border: 4px solid #555;
    border-top-color: #ccc;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  #error {
    font-size: 16pt;
    color: #F55;
  }
</style>
