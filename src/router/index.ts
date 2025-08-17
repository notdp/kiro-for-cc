import { existsSync } from "fs";
import { writeFile } from "fs/promises";
import { homedir } from "os";
import path, { join } from "path";
import { initConfig, initDir, cleanupLogFiles } from "./utils";
import { createServer } from "./server";
import { router } from "./utils/router";
import { apiKeyAuth } from "./middleware/auth";
import { CONFIG_FILE, HOME_DIR } from "./constants";
import { configureLogging } from "./utils/log";
import { sessionUsageCache } from "./utils/cache";
import * as vscode from 'vscode';

async function initializeClaudeConfig() {
  const homeDir = homedir();
  const configPath = join(homeDir, ".claude.json");
  if (!existsSync(configPath)) {
    const userID = Array.from(
      { length: 64 },
      () => Math.random().toString(16)[2]
    ).join("");
    const configContent = {
      numStartups: 184,
      autoUpdaterStatus: "enabled",
      userID,
      hasCompletedOnboarding: true,
      lastOnboardingVersion: "1.0.17",
      projects: {},
    };
    await writeFile(configPath, JSON.stringify(configContent, null, 2));
  }
}

interface RunOptions {
  port?: number;
  outputChannel: vscode.OutputChannel;
}

export async function run(options: RunOptions) {
  const { outputChannel } = options;

  await initializeClaudeConfig();
  await initDir();
  await cleanupLogFiles();
  const config = await initConfig();

  configureLogging(config, outputChannel);

  let HOST = config.HOST;

  if (config.HOST && !config.APIKEY) {
    HOST = "127.0.0.1";
    outputChannel.appendLine("⚠️ API key is not set. HOST is forced to 127.0.0.1.");
  }

  const port = config.PORT || 3456;
  outputChannel.appendLine(`Starting router server on ${HOST}:${port}`);

  const servicePort = process.env.SERVICE_PORT ? parseInt(process.env.SERVICE_PORT) : port;

  const server = createServer({
    jsonPath: CONFIG_FILE,
    initialConfig: {
      providers: config.Providers || config.providers,
      HOST: HOST,
      PORT: servicePort,
      LOG_FILE: join(
        homedir(),
        ".claude-code-router",
        "claude-code-router.log"
      ),
    },
    logger: false, // Use our custom logger via the output channel
  });

  server.addHook("preHandler", async (req: any, reply: any) => {
    return new Promise<void>((resolve, reject) => {
      apiKeyAuth(config)(req, reply, (err?: Error) => {
        if (err) reject(err);
        else resolve();
      }).catch(reject);
    });
  });

  server.addHook("preHandler", async (req: any, reply: any) => {
    if (req.url.startsWith("/v1/messages")) {
      router(req, reply, config);
    }
  });

  server.addHook("onSend", async (req: any, reply: any, payload: any) => {
    if (req.sessionId && req.url.startsWith("/v1/messages")) {
      if (payload && typeof payload.tee === 'function') { // Check if it's a ReadableStream
        const [originalStream, clonedStream] = payload.tee();
        const reader1 = clonedStream.getReader();
        (async () => {
            while (true) {
                const { done, value } = await reader1.read();
                if (done) break;
                const dataStr = new TextDecoder().decode(value);
                if (!dataStr.startsWith("event: message_delta")) continue;
                const str = dataStr.slice(27);
                try {
                    const message = JSON.parse(str);
                    // @ts-ignore
                    sessionUsageCache.put(req.sessionId, message.usage);
                } catch {}
            }
        })();
        return originalStream;
      } else if (payload && payload.usage) {
        // @ts-ignore
        sessionUsageCache.put(req.sessionId, payload.usage);
      }
    }
    return payload;
  });

  await server.start();
  outputChannel.appendLine(`🚀 Router server started successfully.`);
  return server;
}
