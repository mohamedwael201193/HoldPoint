import { httpRouter } from "convex/server";
import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { components, internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { verifySvixSignature } from "./model/svix";

const http = httpRouter();

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ ok: true, product: "holdpoint" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }),
});

http.route({
  path: "/webhooks/agentmail",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const secret = process.env.AGENTMAIL_WEBHOOK_SECRET;
    if (!secret) {
      return new Response(JSON.stringify({ error: "webhook secret not configured" }), {
        status: 503,
        headers: { "content-type": "application/json" },
      });
    }
    const id = request.headers.get("svix-id") ?? "";
    const timestamp = request.headers.get("svix-timestamp") ?? "";
    const signature = request.headers.get("svix-signature") ?? "";
    const ok = await verifySvixSignature({
      secret,
      id,
      timestamp,
      body,
      signatureHeader: signature,
    });
    if (!ok) {
      return new Response(JSON.stringify({ error: "invalid signature" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
    await ctx.runAction(internal.mail.acceptWebhook, { raw: body, eventId: id });
    return new Response(null, { status: 204 });
  }),
});

registerStaticRoutes(http, components.staticHosting);

export default http;
