<script lang="ts">
    import { Granulator, type AudioChunk } from '$lib/granulator';
  
    let granulator: Granulator;
    let chunks: AudioChunk[] = [];
    let error: string | null = null;
    let reverbWet: number = 0.5;
    let reverbDecay: number = 2;

  
    async function handleFileChange(event: Event) {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files[0]) {
        try {
          granulator = new Granulator();
          await granulator.loadAudio(input.files[0]);
          chunks = granulator.getChunks();
          const params = granulator.getParameters();
          reverbWet = params.reverbWet;
          reverbDecay = params.reverbDecay;
          error = null;
        } catch (err) {
          //error = 'Failed to load or process audio file.';
          //console.error(err);
        }
      }
    }

    // Update reverb wet when slider changes
    function handleReverbWetChange(event: Event) {
        const input = event.target as HTMLInputElement;
        reverbWet = parseFloat(input.value);
        if (granulator) {
            granulator.setReverbWet(reverbWet);
        }
    }

    // Update reverb decay when slider changes
    function handleReverbDecayChange(event: Event) {
        const input = event.target as HTMLInputElement;
        reverbDecay = parseFloat(input.value);
        if (granulator) {
            granulator.setReverbDecay(reverbDecay);
        }
    }
  
    function playChunk(chunk: AudioChunk) {
      granulator.playChunk(chunk);
    }
  </script>
  
  <div class="flex h-screen font-mono">
    <!-- Left Panel -->
    <div class="w-1/4 p-4 border-r border-black-700">
      <h1 class="text-1xl mb-4">[ Sample Toy ]</h1>
  
      <input
        type="file"
        accept="audio/*"
        on:change={handleFileChange}
        class="mb-2 block file:mr-4 file:py-2 file:rounded file:border-black file:text-black hover:file:bg-blue-600"
      />

        <h2>[ reverb decay ]</h2>
        <input type="range" id="reverb-decay" class="slider" min="0" max="20" value="10" step="0.5" on:input={handleReverbDecayChange}>
        
        <h2>[ reverb wet ]</h2>
        <input type="range" id="reverb-wet" class="slider" min="0" max="1" value="0.5" step="0.05" on:input={handleReverbWetChange}>
  
      {#if error}
        <p class="text-red-500">{error}</p>
      {/if}
    </div>
  
    <!-- Right Panel (Granulator / Chunks Grid) -->
    <div class="flex-1 p-4 overflow-auto">
      {#if chunks.length > 0}
        <div class="grid grid-rows-6 grid-cols-20 gap-2 w-full max-w-full">
          {#each chunks as chunk, i}
            <div
              class="w-10 h-10 border-[2px] border-black rounded-[6px] cursor-pointer hover:bg-blue-700 transform hover:scale-110 transition-transform duration-100"
              on:mouseenter={() => playChunk(chunk)}
              title="Chunk {i + 1}: {chunk.start.toFixed(2)}s - {chunk.duration.toFixed(2)}s"
            ></div>
          {/each}
        </div>
      {/if}
    </div>
  </div>