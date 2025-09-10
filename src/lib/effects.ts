import * as Tone from 'tone';

export class AudioEffect {
	reverb: Tone.Reverb;
	bitCrusher: Tone.BitCrusher;
	gain: Tone.Gain;
	feedbackDelay: Tone.FeedbackDelay;
	freqShifter: Tone.FrequencyShifter;

	effectChain: Tone.ToneAudioNode | null;
	effectsList: Tone.ToneAudioNode[];

	constructor() {
		this.reverb = new Tone.Reverb({ decay: 5, wet: 0.5 });
		this.bitCrusher = new Tone.BitCrusher({ bits: 8 });
		this.gain = new Tone.Gain(1);
		this.feedbackDelay = new Tone.FeedbackDelay({ delayTime: 0.3, feedback: 0.5, wet: 0.5 });
		this.freqShifter = new Tone.FrequencyShifter({ frequency: 240, wet: 1});
		
		/*
		this.effectChain = this.bitCrusher.chain(
			this.feedbackDelay,
			this.reverb,
			this.gain,
			Tone.getDestination()
		);
		*/

		this.effectChain = null;

		this.effectsList = [
			this.freqShifter,
			this.bitCrusher,
			this.feedbackDelay,
			this.reverb,
			this.gain,
		]

		this.buildEffectChain();
	}

	buildEffectChain() {
		this.effectsList.forEach(effect => effect.disconnect());

        this.effectChain = this.effectsList[0];

		for (let i = 0; i < this.effectsList.length - 1; i++) {
			this.effectsList[i].connect(this.effectsList[i + 1]);
		}

		this.effectsList[this.effectsList.length - 1].connect(Tone.getDestination());
	}

	reorderEffects(newEffectsList: Tone.ToneAudioNode[]) {
		try {
			// Validate newEffectsList
            if (!newEffectsList.every(effect => effect instanceof Tone.ToneAudioNode)) {
                throw new Error('Invalid effects in newEffectsList');
            }

			this.effectsList = [...newEffectsList]; // Create a copy to avoid reference issues
			this.buildEffectChain();
		} catch (err) {
			console.error("Failed to reorder effects:", err);
		}
	}

	connect(source: Tone.ToneAudioNode | AudioBufferSourceNode): void {
		if (!this.effectChain) {
			console.error('NO effect chain available');
			return;
		}
		if (source instanceof AudioBufferSourceNode) {
			Tone.connect(source, this.effectChain);
		} else {
			source.connect(this.effectChain);
		}
	}

	getEffectChainInput(): Tone.ToneAudioNode | null {
		return this.effectChain; 
	}

	getEffectParameters() {
		return {
			//reverb
			reverbWet: 		 this.reverb.wet.value,
			reverbDecay: 	 this.reverb.decay as number,

			//delay
			fbDelayTime: 	 this.feedbackDelay.delayTime.value,
			fbDelayFeedback: this.feedbackDelay.feedback.value,
			fbDelayWet: 	 this.feedbackDelay.wet.value,
			
			//bitcrusher
			bitCrusherBits:  this.bitCrusher.bits.value,

			//frequency shifter
			freqShifterFrequency: this.freqShifter.frequency.value,
			freqShifterWet: this.freqShifter.wet.value,

			//gain
			gainAmount: 	 this.gain.gain.value
		};
	}
}
