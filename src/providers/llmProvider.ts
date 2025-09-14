import * as vscode from 'vscode';

export interface LLMProvider {
    invokeSplitView(prompt: string, title: string): Promise<void>;
    invokeHeadless(prompt: string): Promise<{ exitCode: number | undefined; output?: string }>;
    getSteeringFilename(): string;
}
