import * as Tone from 'tone';

export class AudioEffect {
	reverb: Tone.Reverb;
	bitCrusher: Tone.BitCrusher;
	gain: Tone.Gain;
	feedbackDelay: Tone.FeedbackDelay;
	effectChain: Tone.ToneAudioNode;
	effectsList: Tone.ToneAudioNode[];

	constructor() {
		this.reverb = new Tone.Reverb({ decay: 5, wet: 0.5 });
		this.bitCrusher = new Tone.BitCrusher({ bits: 8 });
		this.gain = new Tone.Gain(1);
		this.feedbackDelay = new Tone.FeedbackDelay({ delayTime: 0.3, feedback: 0.5, wet: 0.5 });
		this.effectChain = this.bitCrusher.chain(
			this.feedbackDelay,
			this.reverb,
			this.gain,
			Tone.getDestination()
		);

		this.effectsList = [
			this.bitCrusher,
			this.feedbackDelay,
			this.reverb,
			this.gain,
		]

		this.buildEffectChain();
	}

	buildEffectChain() {
		this.effectsList.forEach(effect => effect.disconnect());

		this.effectsList.reduce((prev, current) => {
			prev.connect(current);
			return current; 
		}).connect(Tone.getDestination());
	}

	reorderEffects(newEffectsList: any) {
		this.effectsList = newEffectsList;
		this.buildEffectChain();
	}

	connect(source: Tone.ToneAudioNode | AudioBufferSourceNode): void {
		if (source instanceof AudioBufferSourceNode) {
			Tone.connect(source, this.effectChain);
		} else {
			source.connect(this.effectChain);
		}
	}

	getEffectChainInput(): Tone.ToneAudioNode {
		return this.bitCrusher; // The input of the effect chain is the bitCrusher
	}

	getEffectParameters() {
		return {
			reverbWet: this.reverb.wet.value,
			reverbDecay: this.reverb.decay as number,
			fbDelayTime: this.feedbackDelay.delayTime,
			fbDelayFeedback: this.feedbackDelay.feedback,
			fbDelayWet: this.feedbackDelay.wet,
			bitCrusherBits: this.bitCrusher.bits.value,
			gainAmount: this.gain.gain.value
		};
	}
}
