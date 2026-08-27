// Browser Web Speech & Audio Analysis Voice Engine with Guaranteed Female Voice

export class BrowserVoiceEngine {
  private recognition: any = null;
  private synth: SpeechSynthesis | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private isListening = false;
  private isSpeaking = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;

  public onSpeechStart?: () => void;
  public onSpeechEnd?: () => void;
  public onTranscript?: (text: string, isFinal: boolean) => void;
  public onAiSpeakingStart?: () => void;
  public onAiSpeakingEnd?: () => void;
  public onError?: (error: any) => void;

  constructor() {
    if (typeof window !== 'undefined') {
      // Speech Synthesis
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.initVoice();
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => this.initVoice();
        }
      }

      // Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.setupRecognitionListeners();
      }
    }
  }

  private initVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return;

    // Prioritize natural female voices
    const femaleVoiceKeywords = ['female', 'zira', 'samantha', 'karen', 'victoria', 'moira', 'fiona', 'jenny', 'aria', 'sara', 'eva', 'google uk english female', 'natural'];
    
    let found = voices.find(v => 
      v.lang.startsWith('en') && femaleVoiceKeywords.some(kw => v.name.toLowerCase().includes(kw))
    );

    if (!found) {
      found = voices.find(v => v.lang.startsWith('en'));
    }

    this.selectedVoice = found || voices[0] || null;
  }

  private setupRecognitionListeners() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onSpeechStart?.();
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      const text = final || interim;
      if (text.trim()) {
        this.onTranscript?.(text.trim(), Boolean(final));
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        console.warn('Speech recognition event warning:', event.error);
        this.onError?.(event.error);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening && !this.isSpeaking) {
        try {
          this.recognition.start();
        } catch (e) {
          // already started or stopped
        }
      }
    };
  }

  public async startListening(): Promise<boolean> {
    try {
      if (!this.mediaStream) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.setupAudioAnalyser(this.mediaStream);
      }

      if (this.recognition) {
        this.isListening = true;
        try {
          this.recognition.start();
        } catch (e) {
          // might be running
        }
      }
      return true;
    } catch (err) {
      console.error('Microphone permission or start error:', err);
      this.onError?.(err);
      return false;
    }
  }

  private setupAudioAnalyser(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);
    } catch (e) {
      console.warn('AudioAnalyser setup failed:', e);
    }
  }

  public getAudioFrequencyData(): Uint8Array | null {
    if (!this.analyser) return null;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve();
        return;
      }

      // Temporarily pause recognition to prevent self-loop
      this.synth.cancel();
      this.isSpeaking = true;
      this.onAiSpeakingStart?.();

      if (this.recognition) {
        try {
          this.recognition.stop();
        } catch (e) {}
      }

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      utterance.rate = 1.0;
      utterance.pitch = 1.05; // slightly higher natural female pitch

      utterance.onend = () => {
        this.isSpeaking = false;
        this.onAiSpeakingEnd?.();
        if (this.isListening && this.recognition) {
          try {
            this.recognition.start();
          } catch (e) {}
        }
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        this.isSpeaking = false;
        this.onAiSpeakingEnd?.();
        if (this.isListening && this.recognition) {
          try {
            this.recognition.start();
          } catch (err) {}
        }
        resolve();
      };

      this.synth.speak(utterance);
    });
  }

  public stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.onAiSpeakingEnd?.();
    }
  }

  public stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {}
    }
  }

  public destroy() {
    this.stopSpeaking();
    this.stopListening();
  }
}
