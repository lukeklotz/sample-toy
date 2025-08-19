<script lang="ts">
	import { State } from '$lib/state';
	import { dndzone } from 'svelte-dnd-action';
	import { writable } from 'svelte/store';
	import { nanoid } from 'nanoid';

	let state: State;
	state = new State();

	export const effectsMeta = writable([
		{ id: nanoid(), name: 'Bit Crusher', type: 'bitCrusher' },
		{ id: nanoid(), name: 'Feedback Delay', type: 'feedbackDelay' },
		{ id: nanoid(), name: 'Reverb', type: 'reverb' }
	]);
</script>

<div class="flex h-screen font-mono">
	<!-- Left Panel -->
	<div class="border-black-700 w-1/4 border-r p-4">
		<h1 class="text-1xl mb-4">[ Sample Toy ]</h1>

		<input
			type="file"
			accept="audio/*"
			on:change={state.handleFileChange}
			class="mb-2 block file:mr-4 file:rounded file:border-black file:py-2 file:text-black hover:file:bg-blue-600"
		/>

		<!-- # of Chunks -->
    <details class="mb-4 rounded-md border bg-gray-50 p-4">
      <summary class="cursor-pointer text-sm font-semibold">[ # of slices ]</summary>
      <div class="mt-3">
        <label for="slices" class="mb-1 block text-xs">Amount</label>
        <input
          type="range"
          id="slices"
          min="50"
          max="400"
          value="200"
          step="1"
          on:input={state.updateChunks}
          class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-300"
        />
      </div>
    </details>

		<!-- Envelope -->
    <details class="mb-4 rounded-md border bg-gray-50 p-4">
      <summary class="cursor-pointer text-sm font-semibold">[ Envelope ]</summary>
      <div class="mt-3 space-y-3">
        <div>
          <label for="envelope-attack" class="mb-1 block text-xs">Attack</label>
          <input
            type="range"
            id="envelope-attack"
            min="0"
            max="2"
            value="0"
            step="0.01"
            on:input={state.handleAttackChange}
            class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-300"
          />
        </div>

        <div>
          <label for="envelope-decay" class="mb-1 block text-xs">Decay</label>
          <input
            type="range"
            id="envelope-decay"
            min="0"
            max="2"
            value="0"
            step="0.01"
            on:input={state.handleDecayChange}
            class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-300"
          />
        </div>

        <div>
          <label for="envelope-sustain" class="mb-1 block text-xs">Sustain</label>
          <input
            type="range"
            id="envelope-sustain"
            min="0"
            max="1"
            value="1"
            step="0.01"
            on:input={state.handleSustainChange}
            class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-300"
          />
        </div>

        <div>
          <label for="envelope-release" class="mb-1 block text-xs">Release</label>
          <input
            type="range"
            id="envelope-release"
            min="0"
            max="5"
            value="0"
            step="0.01"
            on:input={state.handleReleaseChange}
            class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-300"
          />
        </div>
      </div>
    </details>


	<!--TODO: update dndzone compatibility with new state class-->

	<div use:dndzone={{ items: $effectsMeta, flipDurationMs: 200 }}
		on:consider={({ detail }) => effectsMeta.set(detail.items)}
		on:finalize={({ detail }) => {
			effectsMeta.set(detail.items);
			granulator.updateEffectOrder(detail.items.map(e => e.type))
			effectOrder.set(
				detail.items.map(e => state.getNodeByType(e.type)!)
				);
		}}
	>
		{#each $effectsMeta as effect (effect.id)}
			<details class="mb-4 rounded-md border bg-gray-50 p-4">
			<summary class="cursor-pointer text-sm font-semibold">[ {effect.name} ]</summary>

			{#if effect.type === "feedbackDelay"}
				<label>Time</label>
				<input type="range" min="0.01" max="1" step="0.01"
					on:input={(e) => handleSliderChange(granulator, "feedbackDelay", "delayTime", parseFloat(e.target.value))} />

				<label>Feedback</label>
				<input type="range" min="0" max="1" step="0.01"
					on:input={(e) => handleSliderChange(granulator, "feedbackDelay", "feedback", parseFloat(e.target.value))} />

				<label>Wet</label>
				<input type="range" min="0" max="1" step="0.01"
					on:input={(e) => handleSliderChange(granulator, "feedbackDelay", "wet", parseFloat(e.target.value))} />
			{/if}

			{#if effect.type === "bitCrusher"}
				<label>Bits</label>
				<input type="range" min="1" max="16" step="0.5"
					on:input={(e) => handleSliderChange(granulator, "bitCrusher", "bits", parseFloat(e.target.value))} />
			{/if}

			{#if effect.type === "reverb"}
				<label>Decay</label>
				<input type="range" min="0" max="20" step="0.5"
					on:input={(e) => handleSliderChange(granulator, "reverb", "decay", parseFloat(e.target.value))} />

				<label>Wet</label>
				<input type="range" min="0" max="1" step="0.05"
					on:input={(e) => handleSliderChange(granulator, "reverb", "wet", parseFloat(e.target.value))} />
			{/if}
			</details>
		{/each}
	</div>
   
		<!-- Gain -->
    <details class="mb-4 rounded-md border bg-gray-50 p-4">
      <summary class="cursor-pointer text-sm font-semibold">[ Gain ]</summary>
      <div class="mt-3">
        <label for="gain" class="mb-1 block text-xs">Level</label>
        <input
          type="range"
          id="gain"
          min="0"
          max="1"
          value="0.7"
          step="0.01"
          on:input={handleGainChange}
          class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-300"
        />
      </div>
    </details>

		{#if error}
			<p class="text-red-500">{error}</p>
		{/if}
	</div>

	<!-- Right Panel (Granulator / Chunks Grid) -->
	<div class="flex-1 overflow-auto p-4">
		{#if chunks.length > 0}
			<div class="grid w-full max-w-full grid-cols-20 grid-rows-6 gap-2">
				{#each chunks as chunk, i}
					<div
						class="h-10 w-10 transform cursor-pointer rounded-[6px] border-[2px] border-black transition-transform duration-100 hover:scale-110 hover:bg-blue-700"
						on:mouseenter={() => playChunk(chunk, envelope)}
						title="Chunk {i + 1}: {chunk.start.toFixed(2)}s - {chunk.duration.toFixed(2)}s"
					></div>
				{/each}
			</div>
		{/if}
	</div>
</div>
