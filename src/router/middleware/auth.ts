import { FastifyRequest, FastifyReply } from "fastify";

export const apiKeyAuth =
  (config: any) =>
  async (req: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) => {
    // Public endpoints that don't require authentication when run inside the extension
    if (["/", "/health", "/api/config", "/api/transformers"].includes(req.url) || req.url.startsWith("/ui")) {
      return done();
    }

    const apiKey = config.APIKEY;
    if (!apiKey) {
      // If no API key is set, all internal calls are allowed.
      return done();
    }

    const authHeaderValue =
      req.headers.authorization || req.headers["x-api-key"];
    const authKey: string = Array.isArray(authHeaderValue)
      ? authHeaderValue[0]
      : authHeaderValue || "";
    if (!authKey) {
      reply.status(401).send("APIKEY is missing");
      return;
    }
    let token = "";
    if (authKey.startsWith("Bearer")) {
      token = authKey.split(" ")[1];
    } else {
      token = authKey;
    }

    if (token !== apiKey) {
      reply.status(401).send("Invalid API key");
      return;
    }

    done();
  };
