// place files you want to import through the `$lib` alias in this folder.
import { AudioEffect } from './effects';
import { EnvelopeParams } from './envelope';
import * as Tone from 'tone';
import { browser } from '$app/environment';

export interface AudioChunk {
	start: number;
	duration: number;
	buffer: AudioBuffer;
}

/*
note:
	This is actually just a sampler, not a granulator.
	The original goal was to make a granulator, but starting with a sampler
	felt easier. The long term goal is to turn this into a granulator, so 
	I'm just leaving the name as is.
*/

export class Granulator {
	private audioContext: AudioContext;
	private buffer: AudioBuffer | null = null;
	private chunks: AudioChunk[] = [];
	private currentSource: AudioBufferSourceNode | null = null;
	private effect: AudioEffect;
  	private envelope: Tone.AmplitudeEnvelope;

	/*
	constructor() {
		this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
		Tone.setContext(this.audioContext);
		this.effect = new AudioEffect();
    
		this.envelope = new Tone.AmplitudeEnvelope({
			attack: 0.5, 
			decay: 0.1,
			sustain: 1.0,
			release: 0.1
    	}).toDestination();

    	this.envelope.connect(this.effect.getEffectChainInput());

		console.log("granulator object created");
	}
	*/

	constructor() {
		if (!browser) {
			throw new Error('Granulator can only be created in browser environment');
		}

		try {
			this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
			Tone.setContext(this.audioContext);
			
			// Initialize effects
			this.effect = new AudioEffect();
			
			// Create envelope
			this.envelope = new Tone.AmplitudeEnvelope({
				attack: 0.5, 
				decay: 0.1,
				sustain: 1.0,
				release: 0.1
			});

			const effectInput = this.effect.getEffectChainInput();
			if (effectInput) {
				this.envelope.connect(effectInput);
			} else {
				throw new Error('No effect chain input available')
			}
			console.log("Granulator object created successfully");
		} catch (error) {
			console.error('Error creating Granulator:', error);
			throw error;
		}
	}

	async loadAudio(file: File): Promise<void> {
		try {
			// Ensure audio context is running
			if (this.audioContext.state === 'suspended') {
				await this.audioContext.resume();
			}
			
			await Tone.start();
			console.log('Loading audio file:', file.name);
			
			const arrayBuffer = await file.arrayBuffer();
			this.buffer = await this.audioContext.decodeAudioData(arrayBuffer);
			
			console.log('Audio decoded successfully, duration:', this.buffer.duration);
			this.sliceIntoChunks(200);
		} catch (error) {
			console.error('Error loading audio:', error);
			throw error;
		}
	}

	sliceIntoChunks(numChunks: number): void {
		if (!this.buffer) return;

		const duration = this.buffer.duration;
		const chunkDuration = duration / numChunks;
		const sampleRate = this.buffer.sampleRate;
		const numChannels = this.buffer.numberOfChannels;

		this.chunks = [];

		for (let i = 0; i < numChunks; i++) {
			const startTime = i * chunkDuration;
			const startSample = Math.floor(startTime * sampleRate);
			const chunkSamples = Math.floor(chunkDuration * sampleRate);

			// Create a new AudioBuffer for the chunk
			const chunkBuffer = this.audioContext.createBuffer(numChannels, chunkSamples, sampleRate);

			// Copy data from the original buffer to the chunk buffer
			for (let channel = 0; channel < numChannels; channel++) {
				const originalData = this.buffer.getChannelData(channel);
				const chunkData = chunkBuffer.getChannelData(channel);
				for (let j = 0; j < chunkSamples; j++) {
					if (startSample + j < originalData.length) {
						chunkData[j] = originalData[startSample + j];
					}
				}
			}

			this.chunks.push({
				start: startTime,
				duration: chunkDuration,
				buffer: chunkBuffer
			});
		}
	}

	getChunks(): AudioChunk[] {
		return this.chunks;
	}

	async playChunk(chunk: AudioChunk, level: EnvelopeParams): Promise<void> {
		// Stop any currently playing chunk  
    
		if (this.currentSource) {
			this.currentSource.stop();
			this.currentSource.disconnect();
			this.currentSource = null;
		}

		if (this.audioContext.state === 'suspended') {
			await this.audioContext.resume();
		}

			if (!chunk.buffer) {
				console.error('No buffer available for chunk');
				return;
			}
		/*
			const envelope = new Tone.AmplitudeEnvelope({
				attack: level.getAttack(),
				decay: level.getDecay(),
				sustain: level.getSustain(),
				release: level.getRelease()
			}).toDestination();
		*/
		this.envelope.attack = level.getAttack();
		this.envelope.decay = level.getDecay();
		this.envelope.sustain = level.getSustain();
		this.envelope.release = level.getRelease();


		// Create new source node
		this.currentSource = this.audioContext.createBufferSource();
		this.currentSource.buffer = chunk.buffer;

		// connect raw sample slice to envelope
		try {
			Tone.connect(this.currentSource, this.envelope);
      		//Tone.connect(this.currentSource, this.effect.getEffectChainInput());
			//this.envelope.connect(this.effect.getEffectChainInput());
		} catch (error) {
			console.error('Error connecting nodes:', error);
			return;
		}

		// Start playback
		const now = this.audioContext.currentTime;
		try {
			this.currentSource.start(now);
			this.envelope.triggerAttack(now);
		} catch (error) {
			console.error('Error starting playback:', error);
			return;
		}
	}


  // Incomplete function
  record(isRecording: boolean): void {
    if(isRecording) {
      //record
      //save recording
      console.log("recording in progress..");
    }
    else if(!isRecording) {
      console.log("recording stopped");
    }
  }

  updateEffectOrder(effectTypes: string[]): void {
    // Map effect type strings to actual Tone effect instances

    const newOrder: (Tone.ToneAudioNode | null)[] = effectTypes.map(type => {
        switch (type) {
            case "bitCrusher": return this.effect.bitCrusher;
            case "feedbackDelay": return this.effect.feedbackDelay;
            case "reverb": return this.effect.reverb;
            default:
                console.warn(`Unknown effect type: ${type}`);
                return null;
        }
    });

    this.effect.reorderEffects(newOrder.filter((n): n is Tone.ToneAudioNode => n !== null));
}

  stop(): void {
		if (this.currentSource) {
			this.currentSource.stop();
			this.currentSource.disconnect();
			this.currentSource = null;
		}
	}

	//TODO: Add error handling to all setters

	setReverbWet(value: number): void {
		this.effect.reverb.wet.setValueAtTime(value, Tone.now());
	}

	setReverbDecay(value: number): void {
		this.effect.reverb.decay = value;
		this.effect.reverb.generate().catch((err) => console.error('Error updating reverb decay', err));
	}

	setBitCrusherBits(bits: number): void {
		this.effect.bitCrusher.bits.setValueAtTime(bits, Tone.now());
	}

	setFBDelayTime(value: number): void {
		this.effect.feedbackDelay.delayTime.setValueAtTime(value, Tone.now());
	}

	setFBDelayFeedback(value: number): void {
		this.effect.feedbackDelay.feedback.setValueAtTime(value, Tone.now());
	}

	setFBDelayWet(value: number): void {
		this.effect.feedbackDelay.wet.setValueAtTime(value, Tone.now());
	}

	setGainValue(value: number): void {
		this.effect.gain.gain.setValueAtTime(value, Tone.now());
	}

	getParameters() {
		return this.effect.getEffectParameters();
	}
}
