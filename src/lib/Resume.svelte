<script lang="ts">
     let { resume, width, height } = $props();
</script>

<div id="container" style="height: {height}px; width: {width}px; font-size: {width}px;">
     <p class="header" style="font-size: 0.1em; margin-top: 0.5em">{resume.name ? resume.name : 'Jobby McJobFace'}</p>
     <p class="body" style="font-size: 0.09em;">Skills:</p>
     <p class="body clamp-2" style="font-size: 0.05em;">{resume.skills.join(', ')}</p>
     <p class="body" style="font-size: 0.09em">Experience:</p>
     {#each resume.experience as exp}
     <p class="body" style="font-size: 0.055em">{exp.title} @ {exp.company}</p>
     <p class="body clamp-2" style="font-size: 0.05em; margin-left: 1em">{exp.description}</p>
     {/each}
</div>

<style>
     #container {
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
</style>