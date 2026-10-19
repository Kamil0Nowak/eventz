import { Hono } from 'hono'
import { auth } from './lib/auth';
import { logger } from 'hono/logger';
import eventsRoutes from "./routes/events"
import { HTTPException } from 'hono/http-exception';

const app = new Hono()

app.use(logger())

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api/events", eventsRoutes)

app.get('/ok', (c) => {
  return c.text('Ready to go!')
})

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: err.message,
      },
      err.status
    );
  }

  return c.json(
    {
      success: false,
      error: "Internal server error",
    },
    500
  );
});

export default app
