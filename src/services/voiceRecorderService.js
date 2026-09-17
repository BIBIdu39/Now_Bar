/**
 * Service d'enregistrement audio en tâche de fond
 * Utilise l'API MediaRecorder native du navigateur (Chromium)
 * Enregistre sans aucune fenêtre externe ni application tierce.
 */

class VoiceRecorderService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.mediaStream = null;
    this.startTime = null;
    this.isRecording = false;
  }

  /**
   * Démarre l'enregistrement audio en tâche de fond
   */
  async startRecording() {
    if (this.isRecording) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.audioChunks = [];
      
      // Select best supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

      this.mediaRecorder = new MediaRecorder(this.mediaStream, mimeType ? { mimeType } : {});

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.startTime = Date.now();
      this.isRecording = true;
      this.mediaRecorder.start(250); // Slice chunks every 250ms

      return { success: true };
    } catch (err) {
      console.error('Erreur au démarrage de l\'enregistrement vocal:', err);
      this.isRecording = false;
      return { success: false, error: err.message };
    }
  }

  /**
   * Arrête l'enregistrement audio et retourne le buffer binaire et la durée
   */
  async stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      return null;
    }

    return new Promise((resolve) => {
      this.mediaRecorder.onstop = async () => {
        const durationSecs = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));
        const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        const arrayBuffer = await audioBlob.arrayBuffer();

        // Release hardware mic stream
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach((track) => track.stop());
          this.mediaStream = null;
        }

        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.startTime = null;

        resolve({
          arrayBuffer,
          durationSecs,
          mimeType,
          sizeBytes: audioBlob.size,
        });
      };

      try {
        this.mediaRecorder.stop();
      } catch (e) {
        this.isRecording = false;
        resolve(null);
      }
    });
  }

  /**
   * Annule l'enregistrement sans rien conserver
   */
  cancelRecording() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.startTime = null;
  }
}

export const voiceRecorderService = new VoiceRecorderService();
