export class EnvelopeParams {
	private attack: number;
	private decay: number;
	private sustain: number;
	private release: number;

	constructor() {
		this.attack = 0;
		this.decay = 0;
		this.sustain = 1;
		this.release = 0;
	}

	// Setters
	setAttack(value: number): void {
		this.attack = value;
	}

	setDecay(value: number): void {
		this.decay = value;
	}

	setSustain(value: number): void {
		this.sustain = value;
	}

	setRelease(value: number): void {
		this.release = value;
	}

	// Getters
	getAttack(): number {
		return this.attack;
	}

	getDecay(): number {
		return this.decay;
	}

	getSustain(): number {
		return this.sustain;
	}

	getRelease(): number {
		return this.release;
	}
}
