import * as vscode from 'vscode';
import mic from 'mic';
import { Writable } from 'stream';

export class AudioRecorder {
    private micInstance: any;
    private micInputStream: any;
    private outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    public startRecording(): Writable {
        this.outputChannel.appendLine('[AudioRecorder] Starting recording...');

        this.micInstance = mic({
            rate: '16000',
            channels: '1',
            debug: true,
            exitOnSilence: 6,
            device: 'default' // or specify another device e.g., 'plughw:1,0'
        });

        this.micInputStream = this.micInstance.getAudioStream();

        const audioStream = new Writable({
            write(chunk, encoding, callback) {
                // This is where the audio data comes in.
                // We will pipe this to the speech-to-text service.
                callback();
            }
        });

        this.micInputStream.pipe(audioStream);

        this.micInputStream.on('error', (err: any) => {
            this.outputChannel.appendLine(`[AudioRecorder] Microphone Error: ${err}`);
            vscode.window.showErrorMessage(`Microphone Error: ${err}`);
        });

        this.micInputStream.on('silence', () => {
            this.outputChannel.appendLine('[AudioRecorder] Detected silence, stopping recording.');
            this.stopRecording();
        });

        this.micInstance.start();

        return audioStream;
    }

    public stopRecording() {
        if (this.micInstance) {
            this.outputChannel.appendLine('[AudioRecorder] Stopping recording...');
            this.micInstance.stop();
            this.micInstance = null;
        }
    }
}
