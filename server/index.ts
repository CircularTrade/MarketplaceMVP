import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

/**
 * Replit runs your app behind a proxy and inside an iframe.
 * This is required so cookies (sessions) work correctly in Preview.
 */
app.set("trust proxy", 1);

/* -------------------- SESSION MIDDLEWARE -------------------- */

// memorystore is a wrapper around express-session's MemoryStore
const MemStore = MemoryStore(session);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    store: new MemStore({
      checkPeriod: 1000 * 60 * 60 * 24, // clean up once a day
    }),
    cookie: {
      httpOnly: true,
      secure: false,        // MUST be false for Replit Preview (no https inside iframe)
      sameSite: "lax",      // REQUIRED so cookies are not blocked as 3rd-party
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

/* -------------------- PASSPORT MIDDLEWARE -------------------- */
// CRITICAL: Passport must be initialized RIGHT AFTER session middleware
// and BEFORE any routes are registered
app.use(passport.initialize());
app.use(passport.session());

// --- SESSION DIAGNOSTIC ---
app.use((req, res, next) => {
  console.log("SESSION DEBUG:", {
    url: req.url,
    cookieHeader: req.headers.cookie,
    sessionID: (req as any).sessionID,
    session: (req as any).session,
    isAuthenticated: (req as any).isAuthenticated?.(),
    user: (req as any).user?.id,
  });
  next();
});

/* -------------------- RAW BODY (Stripe etc.) -------------------- */

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));

/* -------------------- API LOGGING -------------------- */

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let captured: any = undefined;

  const oldJson = res.json;
  res.json = function (body, ...args) {
    captured = body;
    return oldJson.apply(res, [body, ...args]);
  };

  res.on("finish", () => {
    if (path.startsWith("/api")) {
      let line = `${req.method} ${path} ${res.statusCode} in ${
        Date.now() - start
      }ms`;

      if (captured) {
        let body = JSON.stringify(captured);
        if (body.length > 80) body = body.slice(0, 79) + "…";
        line += ` :: ${body}`;
      }

      log(line);
    }
  });

  next();
});

/* -------------------- ROUTES & SERVER START -------------------- */

(async () => {
  const server = await registerRoutes(app);

  // Central error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res
      .status(err.status || err.statusCode || 500)
      .json({ message: err.message || "Internal Server Error" });
    console.error(err);
  });

  // Dev vs production client serving
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);

  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
