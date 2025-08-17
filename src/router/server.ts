import { Server } from "@musistudio/llms";
import { readConfigFile, writeConfigFile, backupConfigFile } from "./utils";
import { join } from "path";
import * as vscode from 'vscode';


export const createServer = (config: any): Server => {
  const server = new Server(config);

  server.app.get("/api/config", async (req: any, reply: any) => {
    return await readConfigFile();
  });

  server.app.get("/api/transformers", async (req: any, reply: any) => {
    // @ts-ignore
    const transformers = server.app._server!.transformerService.getAllTransformers();
    const transformerList = Array.from(transformers.entries()).map(
      ([name, transformer]: any) => ({
        name,
        endpoint: transformer.endPoint || null,
      })
    );
    return { transformers: transformerList };
  });

  server.app.post("/api/config", async (req: any, reply: any) => {
    const newConfig = req.body;

    const backupPath = await backupConfigFile();
    if (backupPath) {
      vscode.window.showInformationMessage(`Backed up config to ${backupPath}`);
    }

    await writeConfigFile(newConfig);
    return { success: true, message: "Config saved successfully" };
  });

  return server;
};
