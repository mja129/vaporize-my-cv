# Vaporize My CV

A clicker game that aims to joke about the absolute state of the SWE (or whatever you're into) job market, and maybe have a morsel of fun doing it.

Upload your resume, print copies, and launch them into the void for their inevitable destruction to get **Cope** — the only currency that matters in the big '26.

[Try it out!](https://vaporizemy.cv)

## Gameplay

- Upload your resume (PDF, Word doc, or plain text)
- Click **Print** to spawn a copy and vaporize it to Cope
- Spend Cope on upgrades to print faster/automatically, unlock more skills, enhance your experience descriptions, and rapidly multiply your Cope-per-resume (potentially via rewriting it in Rust)
- Cope as much as you can in 5 minutes. There is no job, only Cope

## Stack / Assets

Built with **Svelte 5**.

LLM-backed ingest of your own resume to transform and personalize your experience using the wonders of artificial intelligence.

All graphics are my own SVGs/pixel art (evident by the quality).

## Component Reference (if you want to take a look at this mess)

- [App](./src/App.svelte) orchestrates all the other components. Ends up pretty clean using Svelte transitions, with a little setTimeout jank to grease the wheels. Passes functions to children to trigger stuff
- [Login](./src/lib/Login.svelte) houses the landing page, with some fun TS/CSS stuff to do the background, and more Svelte fun to operate the form itself
- [Lines](./src/lib/Lines.svelte) does the fun transition from the login to the game. It's the more janky of the two SVG 3D effects, since it's quicker and the perspective can be less tuned lol
- [GameBg](./src/lib/GameBg.svelte) is more mathematically based - actual (X, Y, Z) projection - and thus MUCH cleaner. Looks very nice IMHO
- [Game](./src/lib/Game.svelte) is the real beast, and houses the whole actual game. The animation optimization here is what makes having a peak ~700 3D-animating Svelte components possible, especially the `vaporize_loop` that hooks into the promise-based async resume flow. It is certainly not perfect, but the animation batching + judicious use of `transform` to take advantage of GPU and not recomposite the whole thing 100 times/second make it run smoothly enough
- [End](./src/lib/End.svelte) is the end screen. Nothing crazy

## Feedback

There are bound to be things left to be desired. If you happen to check it out and have any feedback at all, please let me know!

[Email Me](mailto:mja129@pitt.edu)
