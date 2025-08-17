import fs from "node:fs";
import path from "node:path";
import { HOME_DIR } from "../constants";
import * as vscode from 'vscode';

const LOG_FILE = path.join(HOME_DIR, "claude-code-router.log");

// Ensure log directory exists
if (!fs.existsSync(HOME_DIR)) {
  fs.mkdirSync(HOME_DIR, { recursive: true });
}

// Global variable to store the logging configuration
let isLogEnabled: boolean | null = null;
let outputChannel: vscode.OutputChannel | null = null;


// Function to configure logging
export function configureLogging(config: any, channel?: vscode.OutputChannel)
{
  isLogEnabled = config.LOG !== false; // Default to true if not explicitly set to false
  if (channel) {
    outputChannel = channel;
  }
}

export function log(...args: any[]) {
  // If logging configuration hasn't been set, default to enabled
  if (isLogEnabled === null) {
    isLogEnabled = true;
  }

  const message = args
    .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg) : String(arg)
    )
    .join(" ");

  if (outputChannel) {
    outputChannel.appendLine(message);
  }

  if (!isLogEnabled) {
    return;
  }

  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  // Append to log file
  fs.appendFileSync(LOG_FILE, logMessage, "utf8");
}
