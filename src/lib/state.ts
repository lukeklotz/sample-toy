import { EnvelopeParams } from '$lib/envelope';
import { Granulator, type AudioChunk } from '$lib/granulator';
import { AudioEffect } from '$lib/effects';
import { writable} from 'svelte/store';
import { get } from 'svelte/store';
import type { ToneAudioNode } from 'tone';
import * as Tone from 'tone';
import type { FrequencyShifter, FeedbackDelay, BitCrusher, Reverb, Gain } from 'tone';

export class State {
    private envelope: EnvelopeParams;
    private granulator: Granulator | null = null;
    private chunks: AudioChunk[];
    private error: string | null;
    private effectParams: AudioEffect;
    private effects = writable<AudioEffect | null>(null);
    private effectOrder = writable<ToneAudioNode[]>([]);
    private initialized: boolean = false;
    

    constructor() {
        this.envelope = new EnvelopeParams();
        this.chunks = [];
        this.error = null;
        this.effectParams = new AudioEffect();

        this.handleFileChange = this.handleFileChange.bind(this);
        this.handleSliderChange = this.handleSliderChange.bind(this);
        this.updateEffectOrder = this.updateEffectOrder.bind(this);
        this.handleAttackChange = this.handleAttackChange.bind(this);
        this.handleDecayChange = this.handleDecayChange.bind(this);
        this.handleSustainChange = this.handleSustainChange.bind(this);
        this.handleReleaseChange = this.handleReleaseChange.bind(this);
        this.updateChunks = this.updateChunks.bind(this);
        this.handleGainChange = this.handleGainChange.bind(this);
        this.playChunk = this.playChunk.bind(this);

        this.initializeGranulator();
    }

    private async initializeGranulator() {
        try {
            await Tone.start();
            this.granulator = new Granulator();
            this.effects.set(new AudioEffect());
            this.initialized = true;
            console.log("State initialized successfully");
        } catch (error) {
            console.error("Failed to initialize State:", error);
            this.error = `Failed to initialize audio engine: ${error}`;
        }
    }

    private checkInitialized(): boolean {
        if (!this.initialized || !this.granulator) {
            console.error('State is not properly initialized');
            this.error = 'Audio engine not initialized';
            return false;
        }
        return true;
    }

    async handleFileChange(event: Event) {
        console.log('handleFileChange called');
        
        if (!this.checkInitialized()) {
            return;
        }

        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            try {
                console.log('Loading audio file:', input.files[0].name);
                await this.granulator!.loadAudio(input.files[0]);
                this.chunks = this.granulator!.getChunks();
                this.error = null;
                console.log('Audio loaded successfully, chunks:', this.chunks.length);
            } catch (err) {
                console.error('Error loading audio:', err);
                this.error = 'Failed to load or process audio file.';
            }
        }
    }

    getNodeByType(type: string) {
		const fx = get(this.effects);
		if (!fx) return null;
		return type === "feedbackDelay" ? fx.feedbackDelay
			: type === "bitCrusher" ? fx.bitCrusher
			: type === "reverb" ? fx.reverb
            : type === "freqShifter" ? fx.freqShifter
            : type === "gain" ? fx.gain
			: null;
	}

    /*
    async handleRecord(event: KeyboardEvent) {
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

      */

    handleSliderChange(effectType: string, param: string, value: number) {
        switch (effectType) {
            case "reverb":
                if (param === "wet") this.granulator!.setReverbWet(value);
                if (param === "decay") this.granulator!.setReverbDecay(value);
                break;
    
            case "bitCrusher":
                if (param === "bits") this.granulator!.setBitCrusherBits(value);
                break;
    
            case "feedbackDelay":
                if (param === "delayTime") this.granulator!.setFBDelayTime(value);
                if (param === "feedback") this.granulator!.setFBDelayFeedback(value);
                if (param === "wet") this.granulator!.setFBDelayWet(value);
                break;
    
            case "freqShifter":
                if (param === "frequency") this.granulator!.setFreqShifterFrequency(value)
                if (param === "wet") this.granulator!.setFreqShifterWet(value)
                break;

            case "gain":
                if (param === "gain") this.granulator!.setGainValue(value);
                break;
    
            default:
                console.warn(`Unknown effectType: ${effectType}`);
        }
    }

    updateEffectOrder(effectTypes: string[]) {
        this.granulator!.updateEffectOrder(effectTypes);
        
        const nodes = effectTypes
            .map(type => this.getNodeByType(type))
            .filter((node): node is FrequencyShifter | FeedbackDelay | BitCrusher | Reverb | Gain => node !== null);
        
        //append gain to the end of the chain
        nodes.push(this.granulator!.getGainEffect());

        console.log("nodes: ", nodes);
        
        this.effectOrder.set(nodes);
    }

    //event is 
    private handleEnvelopeChange(setter: (value: number) => void): (event: Event) => void {
        return (event: Event) => {
            const input = event.target as HTMLInputElement;
            const value = parseFloat(input.value);
            if (this.envelope) {
                setter(value);
                this.granulator?.updateGainEnvelopeChange();
            }
        };
    }

    readonly handleAttackChange = this.handleEnvelopeChange((val) => this.envelope!.setAttack(val));
    readonly handleDecayChange = this.handleEnvelopeChange((val) => this.envelope!.setDecay(val));
    readonly handleSustainChange = this.handleEnvelopeChange((val) => this.envelope!.setSustain(val));
    readonly handleReleaseChange = this.handleEnvelopeChange((val) => this.envelope!.setRelease(val));

    /*
    //Envelope control
    async handleAttackChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const atk = parseFloat(input.value);
        console.log(atk);
        if (this.envelope) {
        this.envelope.setAttack(atk);
        }
    }

    async handleDecayChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const dec = parseFloat(input.value);
        if (this.envelope) {
        this.envelope.setDecay(dec);
        }
    }

    async handleSustainChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const sus = parseFloat(input.value);
        if (this.envelope) {
        this.envelope.setSustain(sus);
        }
    }

    async handleReleaseChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const rel = parseFloat(input.value);
        if (this.envelope) {
        this.envelope.setRelease(rel);
        }
    }
    */
	//update number of audio slices ("chunks")
	async updateChunks(event: Event) {
		const input = event.target as HTMLInputElement;
		const numChunks = parseFloat(input.value);
		if (this.granulator) {
			this.granulator.sliceIntoChunks(numChunks);
			this.chunks = this.granulator.getChunks();
		}
	}

	handleGainChange(event: Event) {
		const input = event.target as HTMLInputElement;
		let gain = parseFloat(input.value);
		if (this.granulator) {
			this.granulator.setGainValue(gain);
		}
	}

	playChunk(chunk: AudioChunk, envelope: EnvelopeParams) {
		this.granulator!.playChunk(chunk, envelope);
	}

    getChunks() {
        console.log("chunks length: ", this.chunks.length);
        return this.granulator!.getChunks();
    }

    getEnvelope() {
        return this.envelope;
    }
    
};