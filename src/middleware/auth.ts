import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth";
import { HTTPException } from "hono/http-exception";

type Env = {
  Variables: {
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session;
  }
};

export const requireAuth = createMiddleware<Env>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  c.set("user", session.user);
  c.set("session", session.session);

  await next();
});