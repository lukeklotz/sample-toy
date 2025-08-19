import { EnvelopeParams } from '$lib/envelope';
import { Granulator, type AudioChunk } from '$lib/granulator';
import { AudioEffect } from '$lib/effects';
import { writable } from 'svelte/store';
import { nanoid } from 'nanoid'; 
import { dndzone } from 'svelte-dnd-action';
import { derived, get } from 'svelte/store';
import type { ToneAudioNode } from 'tone';
import * as Tone from 'tone';

export class State {
    private envelope: EnvelopeParams;
    private granulator: Granulator;
    private chunks: AudioChunk[];
    private error: string | null;
    private effects = writable<AudioEffect | null>(null);
    private effectOrder = writable<ToneAudioNode[] | null>([]);

    //values
    /*
    let reverbWet: number = 0.5;
    let reverbDecay: number = 2;
    let fbDelayTime: number = 1;
    let fbDelayFeedback: number = 0.5;
    let fbDelayWet: number = 0.5;
    let bitCrusherBits: number = 8;
    let gain: number = 1;
    let isRecording: boolean = false;
    */

	private effectsMeta = writable([
		{ id: nanoid(), name: 'Bit Crusher', type: 'bitCrusher' },
		{ id: nanoid(), name: 'Feedback Delay', type: 'feedbackDelay' },
		{ id: nanoid(), name: 'Reverb', type: 'reverb' }
	]);

    constructor() {
        this.envelope = new EnvelopeParams();
        this.granulator = new Granulator();
        this.chunks = [];
        this.error = null;
        this.effects.set(new AudioEffect());
        Tone.start();
    }

    getNodeByType(type: string) {
		const fx = get(this.effects);
		if (!fx) return null;
		return type === "feedbackDelay" ? fx.feedbackDelay
			: type === "bitCrusher" ? fx.bitCrusher
			: type === "reverb" ? fx.reverb
			: null;
	}

};