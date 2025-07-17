// place files you want to import through the `$lib` alias in this folder.
import { AudioEffect } from "./effects";
import * as Tone from 'tone';

export interface AudioChunk {
    start: number; 
    duration: number; 
    buffer: AudioBuffer; 
  }
  
  export class Granulator {
    private audioContext: AudioContext;
    private buffer: AudioBuffer | null = null;
    private chunks: AudioChunk[] = [];
    private currentSource: AudioBufferSourceNode | null = null;
    private effect: AudioEffect;
  
    constructor() {
      //this.audioContext = new AudioContext();
      this.audioContext = new(window.AudioContext)();
      Tone.setContext(this.audioContext);
      this.effect = new AudioEffect();
    }
  
    async loadAudio(file: File): Promise<void> {
      try {
        await Tone.start();
        const arrayBuffer = await file.arrayBuffer();
        this.buffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.sliceIntoChunks(200);
      } catch (error) {
        console.error('Error loading audio:', error);
        throw error;
      }
    }
  
    private sliceIntoChunks(numChunks: number): void {
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
        const chunkBuffer = this.audioContext.createBuffer(
          numChannels,
          chunkSamples,
          sampleRate
        );
  
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
          buffer: chunkBuffer,
        });
      }
    }
  
    getChunks(): AudioChunk[] {
      return this.chunks;
    }

    playChunk(chunk: AudioChunk): void {
        // Stop any currently playing chunk
        if (this.currentSource) {
            this.currentSource.stop();
            this.currentSource.disconnect();
            this.currentSource = null;
        }

        if(!chunk.buffer){
            console.error('No buffer available for chunk');
            return;
        }

        // Create new source node
        this.currentSource = this.audioContext.createBufferSource();
        this.currentSource.buffer = chunk.buffer;

        // Connect to Tone.js effect chain using Tone.connect
        Tone.connect(this.currentSource, this.effect.getEffectChainInput());

        // Start playback
        this.currentSource.start();
        
        /*
        // Create and play new chunk
        this.currentSource = this.audioContext.createBufferSource();
        this.currentSource.buffer = chunk.buffer;
        // Connect to effects chain
        this.effect.connect(this.currentSource);
        //this.currentSource.connect(this.audioContext.destination);
        this.currentSource.start();
        */
      }

    setReverbWet(value: number): void {
        this.effect.setReverbWet(value);
    }

    setReverbDecay(value: number): void {
        this.effect.setReverbDecay(value);
    }

    setBitCrusherBits(bits: number): void {
        this.effect.setBitCrusherBits(bits);
    }

    setGainValue(value: number): void {
        this.effect.setGainValue(value);
    }

    getEffectParameters() {
        return this.effect.getEffectParameters();
    }

      stop(): void {
        if (this.currentSource) {
            this.currentSource.stop();
            this.currentSource.disconnect();
            this.currentSource = null;
        }
    }
  }