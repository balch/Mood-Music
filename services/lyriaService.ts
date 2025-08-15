
import { GoogleGenAI, LiveMusicServerMessage, LiveMusicSession, LiveMusicGenerationConfig } from "@google/genai";
import * as Tone from 'tone';
import { logger } from './logger';
import { LivePrompt } from '../types';

// Constants for the Lyria service
const LYRIA_API_KEY = process.env.API_KEY;
const LYRIA_MODEL_NAME = 'models/lyria-realtime-exp';
const INITIAL_BUFFER_TARGET_MS = 100; 
const MIN_PLAY_AHEAD_ON_LAG_MS = 50;
const SAMPLE_RATE = 48000; 
const NUM_CHANNELS = 2;    
const ENSURE_READY_TIMEOUT_MS = 10000; 
const LYRIA_OUTPUT_GAIN_PLAYING = 1.0;
const LYRIA_OUTPUT_GAIN_MUTED = 0.0;

type PlaybackState = 'stopped' | 'playing' | 'loading' | 'paused' | 'buffering';

class LyriaServiceInternal {
  private readonly toneContext: Tone.Context;
  private outputNode: Tone.Gain;
  private googleGenAIInstance: GoogleGenAI | null = null;

  private session: LiveMusicSession | null = null;
  private playbackState: PlaybackState;
  public connectionError: boolean;
  public isConnectedToService: boolean;
  public readonly isServiceAvailable: boolean;
  public isContextReady: boolean;

  private nextStartTime: number = 0;
  private readonly initialBufferTimeSecs: number = INITIAL_BUFFER_TARGET_MS / 1000;
  private readonly minPlayAheadOnLagSecs: number = MIN_PLAY_AHEAD_ON_LAG_MS / 1000;
  private activeAudioSources: Set<AudioBufferSourceNode> = new Set();

  private currentWeightedPromptsForService: LivePrompt[] = [];
  private lastErrorMessage: string | null = null;
  private pendingConfig: LiveMusicGenerationConfig | null = null;
  private shouldResetContext: boolean = false;

  public get isEffectivelyPlaying(): boolean {
    const state = this.playbackState;
    return state === 'playing' || state === 'buffering' || state === 'loading';
  }

  constructor(toneContext: Tone.Context) {
    logger.info("LyriaService constructor called.");
    this.toneContext = toneContext;
    this.outputNode = new Tone.Gain(LYRIA_OUTPUT_GAIN_PLAYING); 
    this.isContextReady = this.toneContext.state === 'running';

    this.playbackState = 'stopped';
    this.connectionError = false;
    this.isConnectedToService = false;

    this.toneContext.on('statechange', this.handleContextStateChange);

    if (!LYRIA_API_KEY) {
      logger.error("Lyria API Key (process.env.API_KEY) is missing.");
      this.isServiceAvailable = false;
      this.lastErrorMessage = "API Key missing";
    } else {
      try {
        // Using `apiVersion` as it was in the working reference code for this experimental model.
        this.googleGenAIInstance = new GoogleGenAI({ apiKey: LYRIA_API_KEY, apiVersion: 'v1alpha'});
        this.isServiceAvailable = true;
      } catch (e: any) {
        logger.error("Failed to initialize GoogleGenAI:", e);
        this.isServiceAvailable = false;
        this.lastErrorMessage = "Failed to init GoogleGenAI";
      }
    }
    
    // Connect output to destination
    this.outputNode.connect(this.toneContext.destination);
  }

  private handleContextStateChange = (): void => {
    const newState = this.toneContext.state;
    logger.info(`LyriaService: Tone.Context state changed to: ${newState}`);
    this.isContextReady = (newState === 'running');

    if (newState === 'closed' && this.isEffectivelyPlaying) {
        logger.warn("LyriaService: Context closed, stopping playback.");
        this.internalStop(true);
    }
  }

  private static decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioDataInternal(rawDataBytes: Uint8Array): Promise<AudioBuffer> {
    if (this.toneContext.state !== 'running') {
        throw new Error("LyriaService: Cannot decode audio data, ToneContext is not running.");
    }
    const audioContext = this.toneContext.rawContext;
    const numFramesPerChannel = rawDataBytes.length / 2 / NUM_CHANNELS;
    const audioBuffer = audioContext.createBuffer(NUM_CHANNELS, numFramesPerChannel, SAMPLE_RATE);
    const int16PcmData = new Int16Array(rawDataBytes.buffer, rawDataBytes.byteOffset, rawDataBytes.length / 2);

    const leftFloat32Data = new Float32Array(numFramesPerChannel);
    const rightFloat32Data = new Float32Array(numFramesPerChannel);
    for (let i = 0; i < numFramesPerChannel; i++) {
      leftFloat32Data[i] = int16PcmData[i * 2] / 32768.0;
      rightFloat32Data[i] = int16PcmData[i * 2 + 1] / 32768.0;
    }
    audioBuffer.copyToChannel(leftFloat32Data, 0);
    audioBuffer.copyToChannel(rightFloat32Data, 1);
    return audioBuffer;
  }

  private async connectToSessionInternal(): Promise<boolean> {
    if (!this.isServiceAvailable || !this.googleGenAIInstance) {
      logger.error("Cannot connect: Service unavailable.");
      this.connectionError = true;
      return false;
    }
    if (this.toneContext.state === 'closed') {
        logger.error("Cannot connect to Lyria session: ToneContext is closed.");
        this.connectionError = true;
        return false;
    }

    this.playbackState = 'loading';
    this.connectionError = false;
    this.lastErrorMessage = null;

    try {
      this.session = await this.googleGenAIInstance.live.music.connect({
        model: LYRIA_MODEL_NAME,
        callbacks: {
          onmessage: async (e: LiveMusicServerMessage) => { 
            if (e.setupComplete) {
              this.isConnectedToService = true;
              this.connectionError = false;
              logger.info("Lyria session setup complete.");
            }

            if (e.serverContent?.audioChunks?.[0]?.data) {
              const audioBase64 = e.serverContent.audioChunks[0].data;
              try {
                  if (this.toneContext.state !== 'running') {
                      logger.warn("Audio chunk received but ToneContext not running. Skipping playback.");
                      return;
                  }
                  const rawAudioData = LyriaServiceInternal.decode(audioBase64);
                  const audioBuffer = await this.decodeAudioDataInternal(rawAudioData);

                  if (this.playbackState === 'paused' || this.playbackState === 'stopped') return;

                  const source = this.toneContext.rawContext.createBufferSource();
                  if (!source) return;
                  source.buffer = audioBuffer;
                  Tone.connect(source, this.outputNode); 

                  this.activeAudioSources.add(source);
                  source.onended = () => this.activeAudioSources.delete(source);

                  const currentTime = this.toneContext.currentTime;
                  if (this.nextStartTime === 0) { 
                    this.nextStartTime = currentTime + this.initialBufferTimeSecs;
                    this.playbackState = 'buffering';
                    setTimeout(() => {
                      if (this.playbackState === 'buffering') this.playbackState = 'playing';
                    }, this.initialBufferTimeSecs * 1000);
                  }

                  if (this.nextStartTime < currentTime) { 
                    logger.warn(`Audio under-run. Rescheduling.`);
                    this.playbackState = 'loading'; 
                    this.nextStartTime = currentTime + this.minPlayAheadOnLagSecs;
                  }

                  source.start(this.nextStartTime);
                  this.nextStartTime += audioBuffer.duration;

                  if (this.playbackState === 'loading' && this.nextStartTime > currentTime) {
                      this.playbackState = 'playing';
                  }
              } catch (processErr: any) {
                logger.error("Error processing audio chunk:", processErr.message);
                this.lastErrorMessage = `Audio process error: ${processErr.message}`;
              }
            }
          },
          onerror: (e: ErrorEvent) => {
            logger.error("Lyria session error:", JSON.stringify(e));
            this.connectionError = true;
            this.isConnectedToService = false;
            this.lastErrorMessage = `Session error: ${e.message}`;
            this.internalStop(false);
          },
          onclose: (e: CloseEvent) => {
            logger.info("Lyria session closed. Code:", e.code, "Reason:", e.reason);
            this.isConnectedToService = false;
            this.session = null; 
            if (this.playbackState !== 'stopped') this.playbackState = 'stopped';
          },
        },
      });
      logger.info("Lyria session connection initiated.");

      return true;
    } catch (e: any) {
      logger.error("Failed to connect to Lyria session:", e);
      this.connectionError = true;
      this.isConnectedToService = false;
      this.session = null;
      this.lastErrorMessage = `Connection failed: ${e.message}`;
      return false;
    }
  }

  private async ensureSessionIsReady(): Promise<boolean> {
    if (this.session && this.isConnectedToService) {
        return true;
    }
    if (this.session && (!this.isConnectedToService || this.connectionError)) {
        try { this.session.close(); } catch (e) { /* ignore */ }
        this.session = null;
        this.isConnectedToService = false;
        this.connectionError = false;
    }
    if (!this.session) {
        const sessionObjectCreated = await this.connectToSessionInternal();
        if (!sessionObjectCreated) {
            logger.error("ensureSessionIsReady: Failed to create session object.");
            return false;
        }
    }
    return new Promise((resolve) => {
        if (this.isConnectedToService) {
            resolve(true); return;
        }
        let checkCount = 0;
        const intervalId = setInterval(() => {
            checkCount++;
            if (this.isConnectedToService) {
                clearInterval(intervalId); resolve(true);
            } else if (this.connectionError || checkCount >= (ENSURE_READY_TIMEOUT_MS / 100)) {
                clearInterval(intervalId);
                logger.warn(`ensureSessionIsReady: Timeout or error waiting for setupComplete.`);
                resolve(false);
            }
        }, 100);
    });
  }

  private async setSessionPromptsInternal(): Promise<void> {
    if (!this.session || !this.isConnectedToService) {
      logger.warn("Cannot set prompts: session not active or not connected.");
      return;
    }
    if (this.currentWeightedPromptsForService.length === 0) {
      logger.info("No prompts to set.");
      return;
    }
    try {
      await this.session.setWeightedPrompts({ weightedPrompts: this.currentWeightedPromptsForService }); 
      logger.info("Lyria prompts set:", this.currentWeightedPromptsForService);
    } catch (e: any) {
      logger.error("Error setting Lyria prompts:", e);
      this.lastErrorMessage = `Error setting prompts: ${e.message}`;
    }
  }
  
  private async sendPrompts(prompts: LivePrompt[]): Promise<void> {
    if (!this.isServiceAvailable) return;
    this.currentWeightedPromptsForService = prompts; 
    logger.info("Prompts staged:", prompts);
  }

  public internalStop(sendSessionStop: boolean = true): void {
    if (this.session && sendSessionStop && (this.isConnectedToService || this.playbackState !== 'stopped')) {
        try { this.session.stop(); logger.info("Sent session.stop()"); } 
        catch (e: any) { logger.warn("Error sending session.stop():", e.message); }
    }
    this.activeAudioSources.forEach(source => { try { source.stop(); source.disconnect(); } catch (e) { /* ignore */ } });
    this.activeAudioSources.clear();

    this.outputNode.gain.cancelScheduledValues(this.toneContext.currentTime);
    this.outputNode.gain.setValueAtTime(this.outputNode.gain.value, this.toneContext.currentTime); 
    this.outputNode.gain.linearRampToValueAtTime(LYRIA_OUTPUT_GAIN_MUTED, this.toneContext.currentTime + 0.1); 

    this.playbackState = 'stopped';
    this.nextStartTime = 0;
  }
  
  private async internalPlay(): Promise<void> {
    if (!this.isServiceAvailable) {
        logger.warn("Cannot play: service is not available.");
        return;
    }
    const currentState = this.playbackState;
    if (currentState === 'playing' || currentState === 'loading' || currentState === 'buffering') {
        logger.debug(`Play called but already in state: ${currentState}. No action taken.`);
        return;
    }

    if (this.toneContext.state !== 'running') {
        try {
            await Tone.start();
            logger.info('AudioContext started by user interaction.');
        } catch (e) {
            logger.error('Failed to start Tone context', e);
            return;
        }
    }
      
    const ready = await this.ensureSessionIsReady();
    if (!ready) {
      logger.warn("Session not ready after ensureSessionIsReady, cannot play.");
      return;
    }

    this.nextStartTime = 0; // Reset for fresh buffering logic
    this.outputNode.gain.cancelScheduledValues(this.toneContext.currentTime);
    this.outputNode.gain.linearRampToValueAtTime(LYRIA_OUTPUT_GAIN_PLAYING, this.toneContext.currentTime + 0.05);

    if (this.session) { 
        try {
            if (this.shouldResetContext) {
              this.session.resetContext();
              this.shouldResetContext = false;
              logger.info("Session context reset.");
            }
            if (this.pendingConfig) {
              await this.session.setMusicGenerationConfig({ musicGenerationConfig: this.pendingConfig });
              this.pendingConfig = null;
              logger.info("Pending music config applied.");
            }
            if (this.currentWeightedPromptsForService.length > 0) {
                await this.setSessionPromptsInternal();
            }
            this.session.play();
            this.playbackState = 'loading'; 
            logger.info("Sent session.play() command.");
        } catch (e: any) {
            logger.error("Error sending session.play():", e.message);
            this.playbackState = 'stopped';
        }
    } else {
        logger.warn("Play called but session is unexpectedly null.");
        this.playbackState = 'stopped';
    }
  }

  public reset(): void {
    logger.info("Flagging to reset context on next play.");
    this.shouldResetContext = true;
  }

  public setConfig(params: LiveMusicGenerationConfig): Promise<void> {
    logger.info("Storing config to apply on next play.");
    this.pendingConfig = params;
    return Promise.resolve();
  }

  public async play(prompt: string): Promise<void> {
    if (!this.isServiceAvailable) {
        logger.warn('[LyriaService] Cannot play: service is not available.');
        return;
    }
    
    await this.sendPrompts([{ text: prompt, weight: 1.0 }]);
    await this.internalPlay();
  }

  public stop(): void { this.internalStop(true); }

  public dispose(): void {
    logger.info("Disposing LyriaService.");
    this.internalStop(true); 
    if (this.session) {
        try { this.session.close(); } 
        catch (e: any) { logger.warn("Error closing Lyria session on dispose:", e.message); }
        this.session = null;
    }
    this.toneContext.off('statechange', this.handleContextStateChange);
    this.outputNode.dispose();
  }
}

// --- Service Instantiation and Export ---

let lyriaService: LyriaServiceInternal;

const initialize = () => {
    if (!lyriaService) {
        const toneContext = new Tone.Context(new AudioContext());
        Tone.setContext(toneContext);
        lyriaService = new LyriaServiceInternal(toneContext);
        logger.info("LyriaService initialized.");
    }
};

export const LyriaService = {
  play: async (type: 'mood' | 'victory', prompt?: string) => {
    initialize();
    if (Tone.context.state !== 'running') {
        await Tone.start();
        logger.info('AudioContext started by user interaction.');
    }

    let playPrompt: string | undefined = prompt;
    if (type === 'victory') {
        playPrompt = "A triumphant and joyous fanfare with brass and percussion, celebrating a great victory. Uplifting and epic.";
        logger.info('Generating victory music!');
    }
    
    if (playPrompt) {
        logger.info(`Generating music for prompt: "${playPrompt}"`);
        await lyriaService.play(playPrompt);
    } else {
        logger.warn("Play called without a valid prompt.");
    }
  },
  stop: () => {
    if (lyriaService) {
        lyriaService.stop();
        logger.debug('Music audio stopped.');
    }
  },
  setConfig: async (params: LiveMusicGenerationConfig) => {
    initialize();
    await lyriaService.setConfig(params)
  }, 
  reset: () => {
    initialize();
    lyriaService.reset()
  },
};