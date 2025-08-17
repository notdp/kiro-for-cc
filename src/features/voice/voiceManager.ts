import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
const record = require('node-mic-record');

export class VoiceManager {
    private outputChannel: vscode.OutputChannel;
    private isRecording: boolean = false;
    private recordingProcess: any; // Will hold the recording process
    private tempFilePath: string;

    constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
        this.tempFilePath = path.join(context.globalStorageUri.fsPath, 'temp_recording.wav');

        // Ensure the global storage path exists
        try {
            if (!fs.existsSync(context.globalStorageUri.fsPath)) {
                fs.mkdirSync(context.globalStorageUri.fsPath, { recursive: true });
            }
        } catch (error) {
            this.outputChannel.appendLine(`[VoiceManager] Error creating storage directory: ${error}`);
        }
    }

    public startRecording() {
        if (this.isRecording) {
            this.outputChannel.appendLine('[VoiceManager] Already recording.');
            return;
        }

        this.outputChannel.appendLine('[VoiceManager] Starting recording...');
        this.isRecording = true;

        const file = fs.createWriteStream(this.tempFilePath, { encoding: 'binary' });

        this.recordingProcess = record.start({
            sampleRate: 16000,
            verbose: true,
            recordProgram: 'sox', // User needs to install 'sox' -> sudo apt-get install sox libsox-fmt-all
        });

        this.recordingProcess.pipe(file);

        this.recordingProcess.on('error', (error: any) => {
            this.outputChannel.appendLine(`[VoiceManager] Recording Error: ${error}`);
            vscode.window.showErrorMessage(`Microphone Error: ${error}. Make sure 'sox' is installed (sudo apt-get install sox libsox-fmt-all).`);
            this.stopRecording();
        });
    }

    public stopRecording(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.isRecording || !this.recordingProcess) {
                this.outputChannel.appendLine('[VoiceManager] Not recording.');
                reject('Not recording.');
                return;
            }

            this.outputChannel.appendLine('[VoiceManager] Stopping recording...');
            record.stop();
            this.isRecording = false;

            // It takes a moment for the file to be fully written
            setTimeout(() => {
                this.outputChannel.appendLine(`[VoiceManager] Recording saved to: ${this.tempFilePath}`);
                resolve(this.tempFilePath);
            }, 500);
        });
    }

    public getIsRecording(): boolean {
        return this.isRecording;
    }
}
