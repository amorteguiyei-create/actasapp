class VoiceRecorder {
  constructor() {
    this.isRecording = false;
    this.recognition = null;
    this.transcript = '';
    this.onResult = null;
    this.onStateChange = null;
    this.init();
  }

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API no soportada en este navegador');
      return;
    }
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es-CO'; // Español Colombia
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    
    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        this.transcript += finalTranscript + ' ';
      }
      if (this.onResult) {
        this.onResult(this.transcript + interimTranscript, interimTranscript !== '');
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Error de reconocimiento:', event.error);
      this.stop();
    };

    this.recognition.onend = () => {
      if (this.isRecording) {
        try { this.recognition.start(); } catch(e) {}
      }
    };
  }

  start() {
    if (!this.recognition) {
      alert('Tu navegador no soporta el reconocimiento de voz. Por favor usa Chrome o Edge.');
      return false;
    }
    this.transcript = '';
    this.isRecording = true;
    try { this.recognition.start(); } catch(e) {}
    if (this.onStateChange) this.onStateChange(true);
    return true;
  }

  stop() {
    this.isRecording = false;
    if (this.recognition) this.recognition.stop();
    if (this.onStateChange) this.onStateChange(false);
    return this.transcript.trim();
  }

  toggle() {
    if (this.isRecording) {
      return this.stop();
    } else {
      this.start();
      return null;
    }
  }
}
