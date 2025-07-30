<script lang="ts">
	import { Granulator, type AudioChunk } from '$lib/granulator';
  import { EnvelopeParams } from '$lib/envelope';
  import { onMount } from 'svelte';

  let envelope: EnvelopeParams;
	let granulator: Granulator;
	let chunks: AudioChunk[] = [];
	let error: string | null = null;
	let reverbWet: number = 0.5;
	let reverbDecay: number = 2;
	let fbDelayTime: number = 1;
	let fbDelayFeedback: number = 0.5;
	let fbDelayWet: number = 0.5;
	let bitCrusherBits: number = 8;
	let gain: number = 1;
  let isRecording: boolean = false;

	async function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			try {
				granulator = new Granulator();
        envelope = new EnvelopeParams();
				await granulator.loadAudio(input.files[0]);
				chunks = granulator.getChunks();
				const params = granulator.getParameters();
				reverbWet = params.reverbWet;
				reverbDecay = params.reverbDecay;
				error = null;
			} catch (err) {
				//TODO: FIX BUG err always triggers
				//error = 'Failed to load or process audio file.';
				//console.error(err);
			}
		}
	}

  async function handleRecord(event: KeyboardEvent) {
    //start
    if (event.key === "r" && !isRecording) {
      if (granulator) {
        granulator.record(true);
        isRecording = true;
      }
    }
    //stop
    else if(event.key === "r" && isRecording) {
      if (granulator) {
        granulator.record(false);
        isRecording = false;
      }
    }
  }

  //onMount is a listener that responds to keyboard input
  //onMount enables keyboard input functionality
  onMount(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'r') {
        handleRecord(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  //Envelope control
  async function handleAttackChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const atk = parseFloat(input.value);
    if (envelope) {
      envelope.setAttack(atk);
    }
  }

  async function handleDecayChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const dec = parseFloat(input.value);
    if (envelope) {
      envelope.setDecay(dec);
    }
  }

  async function handleSustainChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const sus = parseFloat(input.value);
    if (envelope) {
      envelope.setSustain(sus);
    }
  }

  async function handleReleaseChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const rel = parseFloat(input.value);
    if (envelope) {
      envelope.setRelease(rel);
    }
  }

	//update number of audio slices ("chunks")
	async function updateChunks(event: Event) {
		const input = event.target as HTMLInputElement;
		const numChunks = parseFloat(input.value);
		if (granulator) {
			granulator.sliceIntoChunks(numChunks);
			chunks = granulator.getChunks();
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

	// Update bitCrusher bit amount
	function handleBitCrusherBitChange(event: Event) {
		const input = event.target as HTMLInputElement;
		bitCrusherBits = parseFloat(input.value);
		if (granulator) {
			granulator.setBitCrusherBits(bitCrusherBits);
		}
	}

	function handleFBDelayTimeChange(event: Event) {
		const input = event.target as HTMLInputElement;
		fbDelayTime = parseFloat(input.value);
		if (granulator) {
			granulator.setFBDelayTime(fbDelayTime);
		}
	}

	function handleFBDelayFeedbackChange(event: Event) {
		const input = event.target as HTMLInputElement;
		fbDelayFeedback = parseFloat(input.value);
		if (granulator) {
			granulator.setFBDelayFeedback(fbDelayFeedback);
		}
	}

	function handleFBDelayWetChange(event: Event) {
		const input = event.target as HTMLInputElement;
		fbDelayWet = parseFloat(input.value);
		if (granulator) {
			granulator.setFBDelayWet(fbDelayWet);
		}
	}

	function handleGainChange(event: Event) {
		const input = event.target as HTMLInputElement;
		gain = parseFloat(input.value);
		if (granulator) {
			granulator.setGainValue(gain);
		}
	}

	function playChunk(chunk: AudioChunk) {
		granulator.playChunk(chunk, envelope);
	}
</script>

<div class="flex h-screen font-mono">
	<!-- Left Panel -->
	<div class="border-black-700 w-1/4 border-r p-4">
		<h1 class="text-1xl mb-4">[ Sample Toy ]</h1>

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
          on:input={updateChunks}
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
            max="5"
            value="0"
            step="0.01"
            on:input={handleAttackChange}
            class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-300"
          />
        </div>

        <div>
          <label for="envelope-decay" class="mb-1 block text-xs">Decay</label>
          <input
            type="range"
            id="envelope-decay"
            min="0"
            max="5"
            value="0"
            step="0.01"
            on:input={handleDecayChange}
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
            on:input={handleSustainChange}
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
            on:input={handleReleaseChange}
            class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-300"
          />
        </div>
      </div>
    </details>

		<!-- Feedback Delay -->
		<details class="mb-4 rounded-md border bg-gray-50 p-4">
			<summary class="cursor-pointer text-sm font-semibold">[ Feedback Delay ]</summary>
			<div class="mt-3 space-y-3">
				<div>
					<label for="fb-delay-time" class="mb-1 block text-xs">Time</label>
					<input
						type="range"
						id="fb-delay-time"
						min="0.01"
						max="1"
						value="0.01"
						step="0.01"
						on:input={handleFBDelayTimeChange}
						class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-300"
					/>
				</div>

				<div>
					<label for="fb-delay-amount" class="mb-1 block text-xs">Amount</label>
					<input
						type="range"
						id="fb-delay-amount"
						min="0.01"
						max="1"
						value="0.5"
						step="0.05"
						on:input={handleFBDelayFeedbackChange}
						class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-300"
					/>
				</div>

				<div>
					<label for="fb-delay-wet" class="mb-1 block text-xs">Wet</label>
					<input
						type="range"
						id="fb-delay-wet"
						min="0.01"
						max="1"
						value="0.5"
						step="0.05"
						on:input={handleFBDelayWetChange}
						class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-300"
					/>
				</div>
			</div>
		</details>

		<!-- Bit Crusher -->
		<details class="mb-4 rounded-md border bg-gray-50 p-4">
			<summary class="cursor-pointer text-sm font-semibold">[ Bit Crusher ]</summary>
			<div class="mt-3">
				<label for="bitcrusher-bits" class="mb-1 block text-xs">Bits</label>
				<input
					type="range"
					id="bitcrusher-bits"
					min="1"
					max="16"
					value="8"
					step="0.5"
					on:input={handleBitCrusherBitChange}
					class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-300"
				/>
			</div>
		</details>

		<!-- Reverb -->
		<details class="mb-4 rounded-md border bg-gray-50 p-4">
			<summary class="cursor-pointer text-sm font-semibold">[ Reverb ]</summary>
			<div class="mt-3 space-y-3">
				<div>
					<label for="reverb-decay" class="mb-1 block text-xs">Decay</label>
					<input
						type="range"
						id="reverb-decay"
						min="0"
						max="20"
						value="10"
						step="0.5"
						on:input={handleReverbDecayChange}
						class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-300"
					/>
				</div>

				<div>
					<label for="reverb-wet" class="mb-1 block text-xs">Wet</label>
					<input
						type="range"
						id="reverb-wet"
						min="0"
						max="1"
						value="0.5"
						step="0.05"
						on:input={handleReverbWetChange}
						class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-300"
					/>
				</div>
			</div>
		</details>

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
						on:mouseenter={() => playChunk(chunk)}
						title="Chunk {i + 1}: {chunk.start.toFixed(2)}s - {chunk.duration.toFixed(2)}s"
					></div>
				{/each}
			</div>
		{/if}
	</div>
</div>
