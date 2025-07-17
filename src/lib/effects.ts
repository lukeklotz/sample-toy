import * as Tone from 'tone';

export class AudioEffect {

    private reverb: Tone.Reverb;
    private bitCrusher: Tone.BitCrusher;
    private gain: Tone.Gain;
    private effectChain: Tone.ToneAudioNode;

    constructor() {
        this.reverb = new Tone.Reverb({decay: 2, wet: 0.5})
        this.bitCrusher = new Tone.BitCrusher({bits: 8})
        this.gain = new Tone.Gain(0.5);
        this.effectChain = this.bitCrusher.chain(
            this.reverb,
            this.bitCrusher,
            this.gain
        );
    }

    connect(source: Tone.ToneAudioNode | AudioNode): void {
        if (source instanceof AudioNode) {
          Tone.connect(source, this.effectChain);
        } else {
          source.connect(this.effectChain);
        }
      }

    setReverbWet(value: number): void {
        this.reverb.wet.setValueAtTime(value, Tone.now());
    }

    setBitCrusherBits(bits: number): void {
        this.bitCrusher.bits.setValueAtTime(bits, Tone.now());
    }

    setGainValue(n: number): void {
        this.gain.gain.setValueAtTime(n, Tone.now());
    }

    getParameters() {
        return {
          reverbWet: this.reverb.wet.value,
          bitCrusherBits: this.bitCrusher.bits.value,
          gainAmount: this.gain.gain.value
        };
      }
}