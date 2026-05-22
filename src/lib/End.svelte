<script lang="ts">
  let { totalDestroyed, score, on_play_again }: { totalDestroyed: number; score: number; on_play_again: () => void } = $props();

  function shortFormat(n: number): string {
    if (n >= 1e12) return parseFloat((n / 1e12).toPrecision(3)) + 'T';
    if (n >= 1e9)  return parseFloat((n / 1e9).toPrecision(3)) + 'B';
    if (n >= 1e6)  return parseFloat((n / 1e6).toPrecision(3)) + 'M';
    if (n >= 1e3)  return parseFloat((n / 1e3).toPrecision(3)) + 'k';
    return String(n);
  }

  // svelte-ignore state_referenced_locally
  const shareText = `I just vaporized ${totalDestroyed.toLocaleString()} ${totalDestroyed == 1 ? "copy" : "copies"} of my resume and earned ${score.toLocaleString()} Cope, and all I got was this lousy easily sharable message.\nPlay at https://vaporizemy.cv`;

  let copied = $state(false);
  function copy() {
    navigator.clipboard.writeText(shareText).then(() => {
      copied = true;
      setTimeout(() => { copied = false; }, 2000);
    });
  }
</script>

<div id="end-container" class="full">
  <div id="form">
    <p class="title">Time's up!</p>
    <div id="stats">
      <p class="stat"><span class="label">Resumes vaporized</span><span class="value">{totalDestroyed.toLocaleString()}</span></p>
      <p class="stat"><span class="label">Final Cope</span><span class="value">{score.toLocaleString()}</span></p>
    </div>
    <div id="share-box">
      <p class="share-label">Share with your friends:</p>
      <pre id="share-text">{shareText}</pre>
      <button id="copy-btn" onclick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
    </div>
    <div id="action-row">
      <button id="play-again" onclick={on_play_again}>Play Again</button>
      <button id="home-btn" onclick={() => location.reload()}>Home</button>
    </div>
  </div>
</div>

<style>
  .full {
    width: 100%;
    height: 100%;
  }
  #end-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  #form {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 30px;
    max-width: 500px;
    background-color: #333;
    border-radius: 10px;
    padding: 30px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  }
  .title {
    font-size: 4rem;
    margin: 0;
  }
  #stats {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }
  .stat {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 24px;
    font-size: 2rem;
    margin: 0;
  }
  .label {
    color: #aaa;
    font-size: 1.5rem;
  }
  .value {
    font-weight: bold;
    color: #eee;
  }
  #share-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
  }
  .share-label {
    font-size: 1.4rem;
    margin: 0;
    color: #aaa;
  }
  #share-text {
    background: #222;
    border-radius: 6px;
    padding: 14px 18px;
    font-family: inherit;
    font-size: 1.8rem;
    color: #ddd;
    white-space: pre-wrap;
    word-break: break-word;
    width: 100%;
    box-sizing: border-box;
    margin: 0;
    text-align: left;
  }
  #copy-btn {
    font-family: inherit;
    font-size: 1.4rem;
    color: inherit;
    background: #222;
    border: none;
    border-radius: 6px;
    padding: 10px 28px;
    cursor: pointer;
    transition: background 0.15s;
  }
  #copy-btn:hover {
    background: #444;
  }
  #action-row {
    display: flex;
    gap: 16px;
    width: 100%;
  }
  #play-again, #home-btn {
    font-family: inherit;
    font-size: 2.5rem;
    color: inherit;
    background: #222;
    border: none;
    border-radius: 6px;
    padding: 14px 0;
    cursor: pointer;
    transition: background 0.15s;
    flex: 1;
  }
  #play-again:hover, #home-btn:hover {
    background: #444;
  }
</style>
