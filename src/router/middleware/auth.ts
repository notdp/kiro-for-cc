export const apiKeyAuth =
  (config: any) =>
  async (req: any, reply: any, done: (err?: Error) => void) => {
    // When running inside the extension, we can simplify the auth logic.
    // The webview is a trusted environment.
    // For API calls (e.g. from another tool), the API key is still relevant.
    const apiKey = config.APIKEY;
    if (!apiKey || !req.url.startsWith('/v1/')) {
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
