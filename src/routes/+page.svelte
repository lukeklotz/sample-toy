<script lang="ts">
    import { Granulator, type AudioChunk } from '$lib/granulator';
  
    let granulator: Granulator;
    let chunks: AudioChunk[] = [];
    let error: string | null = null;
  
    async function handleFileChange(event: Event) {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files[0]) {
        try {
          granulator = new Granulator();
          await granulator.loadAudio(input.files[0]);
          chunks = granulator.getChunks();
          error = null;
        } catch (err) {
          error = 'Failed to load or process audio file.';
          console.error(err);
        }
      }
    }
  
    function playChunk(chunk: AudioChunk) {
      granulator.playChunk(chunk);
    }
  </script>
  
  <div class="flex h-screen">
    <!-- Left Panel -->
    <div class="w-1/4 bg-gray-100 p-4 border-r border-gray-300">
      <h1 class="text-2xl font-bold mb-4">Sample Toy</h1>
  
      <input
        type="file"
        accept="audio/*"
        on:change={handleFileChange}
        class="mb-4 block file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600"
      />
  
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