<script lang="ts">
	import { State } from '$lib/state';
	import { dndzone } from 'svelte-dnd-action';
	import { writable } from 'svelte/store';
	import { nanoid } from 'nanoid';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { type AudioChunk } from "$lib/granulator"

	let state: State | null = null;
	let error: string | null = null;
	let chunks: AudioChunk[] = []

	export const effectsMeta = writable([
		{ id: nanoid(), name: 'Bit Crusher', type: 'bitCrusher' },
		{ id: nanoid(), name: 'Feedback Delay', type: 'feedbackDelay' },
		{ id: nanoid(), name: 'Reverb', type: 'reverb' },
		{ id: nanoid(), name: 'Frequency Shifter', type: 'freqShifter' },
	]);

	// sync chunks with state
	function updateChunks() {
		if (state) {
			chunks = state.getChunks();
			if (!chunks) {
			console.error('Failed to get chunks from state');
			return;
		}
			console.log('Chunks updated:', chunks.length);
		}
	}

	// Wrapper for file change that updates chunks
	async function handleFileChange(event: Event) {
		if (!state) return;
		
		try {
			await state.handleFileChange(event);
			updateChunks(); // Update chunks after file is loaded
		} catch (err) {
			console.error('Error handling file change:', err);
		}
	}

	// Wrapper for chunk slider that updates chunks
	function handleChunkSlider(event: Event) {
		if (!state) return;
		
		state.updateChunks(event);
		updateChunks(); // Update chunks after slider change
	}

	onMount(async () => {
		if (browser) {
			try {
				state = new State();
				console.log("State object created");
				
				// Wait a bit for async initialization if needed
				setTimeout(() => {
					updateChunks(); // Initial update
				}, 100);
			} catch (err) {
				console.error("Error creating state:", err);
				error = "Failed to create audio engine";
			}
		} else {
			console.error("browser null");
		}
	});
</script>

<div class="flex h-screen font-mono">
	<!-- Left Panel -->
	<div class="border-black-700 w-1/4 border-r p-4">
		<h1 class="text-1xl mb-4">[ Sample Toy ]</h1>

		{#if state}
		<input
			type="file"
			accept="audio/*"
			on:change={handleFileChange}
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
          on:input={handleChunkSlider}
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
            on:input={state?.handleAttackChange}
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
            on:input={state?.handleDecayChange}
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
            on:input={state?.handleSustainChange}
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
            on:input={state?.handleReleaseChange}
            class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-300"
          />
        </div>
      </div>
    </details>


	<!--TODO: update dndzone compatibility with state class-->

	<div use:dndzone={{ items: $effectsMeta, flipDurationMs: 200 }}
		on:consider={({ detail }) => effectsMeta.set(detail.items)}
		on:finalize={({ detail }) => {
			effectsMeta.set(detail.items);
			const effectTypes = detail.items.map(e => e.type);
        	state?.updateEffectOrder(effectTypes);
		}}
	>
		{#each $effectsMeta as effect (effect.id)}
			<details class="mb-4 rounded-md border bg-gray-50 p-4">
			<summary class="cursor-pointer text-sm font-semibold">[ {effect.name} ]</summary>

			{#if effect.type === "feedbackDelay"}
				<label>Time</label>
				<input type="range" min="0.01" max="1" step="0.01"
					on:input={(e) => state?.handleSliderChange("feedbackDelay", "delayTime", parseFloat(e.target.value))} />

				<label>Feedback</label>
				<input type="range" min="0" max="1" step="0.01"
					on:input={(e) => state?.handleSliderChange("feedbackDelay", "feedback", parseFloat(e.target.value))} />

				<label>Wet</label>
				<input type="range" min="0" max="1" step="0.01"
					on:input={(e) => state?.handleSliderChange("feedbackDelay", "wet", parseFloat(e.target.value))} />
			{/if}

			{#if effect.type === "bitCrusher"}
				<label>Bits</label>
				<input type="range" min="1" max="16" step="0.5"
					on:input={(e) => state?.handleSliderChange("bitCrusher", "bits", parseFloat(e.target.value))} />
			{/if}

			{#if effect.type === "reverb"}
				<label>Decay</label>
				<input type="range" min="0" max="20" step="0.5"
					on:input={(e) => state?.handleSliderChange("reverb", "decay", parseFloat(e.target.value))} />

				<label>Wet</label>
				<input type="range" min="0" max="1" step="0.05"
					on:input={(e) => state?.handleSliderChange("reverb", "wet", parseFloat(e.target.value))} />
			{/if}

			{#if effect.type === "freqShifter"}
				<label>Frequency Shifter</label>
				<input type="range" min="0" max="20000" step="0.5"
					on:input={(e) => state?.handleSliderChange("freqShifter", "frequency", parseFloat(e.target.value))} />

				<label>Wet</label>
				<input type="range" min="0" max="1" step="0.05"
					on:input={(e) => state?.handleSliderChange("freqShifter", "wet", parseFloat(e.target.value))} />
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
          on:input={state?.handleGainChange}
          class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-300"
        />
      </div>
    </details>

		{:else}
			<div class="flex items-center justify-center h-32">
				<p class="text-gray-500">Loading audio engine...</p>
			</div>
		{/if}

		{#if error}
			<p class="text-red-500">{error}</p>
		{/if}
	</div>

	<!-- Right Panel (Granulator / Chunks Grid) -->
	<div class="flex-1 overflow-auto p-4">
		{#if state}
			{#if chunks.length > 0}
				<div class="grid w-full max-w-full grid-cols-20 grid-rows-6 gap-2">
					{#each chunks as chunk, i}
						<div
							class="h-10 w-10 transform cursor-pointer rounded-[6px] border-[2px] border-black transition-transform duration-100 hover:scale-110 hover:bg-blue-700"
							on:mouseenter={() => state?.playChunk(chunk, state.getEnvelope())}
							title="Chunk {i + 1}: {chunk.start.toFixed(2)}s - {chunk.duration.toFixed(2)}s"
						></div>
					{/each}
				</div>
			{:else}
				<div class="flex items-center justify-center h-full">
					<p class="text-gray-500">Load an audio file to see audio slices</p>
				</div>
			{/if}
		{/if}
	</div>
</div>
