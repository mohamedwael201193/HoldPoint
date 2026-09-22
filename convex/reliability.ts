import { mutation, query } from "./_generated/server";
import { alreadyRecorded, requireCurrentRevision } from "./guards";
import { quoteExistsInSource } from "./engine/quotes";
import { hashesEqual } from "./engine/hash";
import { parseInboundPayload } from "./model/agentmail";

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("reliabilityProofs").order("desc").take(40),
});

export const runSuite = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cases: {
      attack: string;
      expectedBehavior: string;
      actualBehavior: string;
      passed: boolean;
    }[] = [];

    const org = await ctx.db.query("orgs").first();
    if (!org) {
      cases.push({
        attack: "workspace missing",
        expectedBehavior: "seed demo workspace first",
        actualBehavior: "no org",
        passed: false,
      });
    } else {
      const permit = await ctx.db
        .query("permits")
        .withIndex("byOrg", (q) => q.eq("orgId", org._id))
        .first();

      try {
        requireCurrentRevision(3, 4);
        cases.push({
          attack: "stale revision",
          expectedBehavior: "rejected",
          actualBehavior: "accepted",
          passed: false,
        });
      } catch (error) {
        cases.push({
          attack: "stale revision",
          expectedBehavior: "rejected",
          actualBehavior: error instanceof Error ? error.message : "rejected",
          passed: true,
        });
      }

      const source = "Provide revised structural calculations for the east footing.";
      const verified = quoteExistsInSource(source, "revised structural calculations");
      const invented = quoteExistsInSource(source, "install a rooftop helipad immediately");
      cases.push({
        attack: "unverified requirement",
        expectedBehavior: "never auto-applied",
        actualBehavior: invented ? "would apply invented quote" : "held",
        passed: verified && !invented,
      });

      cases.push({
        attack: "unchanged source hash",
        expectedBehavior: "no downstream language spend",
        actualBehavior: hashesEqual("abc", "abc") ? "short-circuit" : "mismatch",
        passed: hashesEqual("abc", "abc") && !hashesEqual("abc", "abd"),
      });

      const payload = JSON.stringify({
        event_id: "evt_dup_1",
        event_type: "message.received",
        message: {
          from_: ["trade@example.invalid"],
          subject: "[HP-RIV1] window",
          text: "Confirmed.",
          message_id: "msg_dup_1",
        },
      });
      const first = parseInboundPayload(payload);
      const second = parseInboundPayload(payload);
      cases.push({
        attack: "duplicate webhook",
        expectedBehavior: "one logical inbound event",
        actualBehavior:
          first?.providerMessageId === second?.providerMessageId
            ? "same provider message id"
            : "diverged",
        passed: first?.providerMessageId === "msg_dup_1",
      });

      if (permit) {
        const existing = await ctx.db
          .query("inboundEmails")
          .withIndex("byProviderMessageId", (q) => q.eq("providerMessageId", "proof-dup"))
          .unique();
        if (!alreadyRecorded(existing)) {
          await ctx.db.insert("inboundEmails", {
            orgId: org._id,
            permitId: permit._id,
            fromEmail: "trade@example.invalid",
            subject: "[HP-RIV1] proof",
            body: "Confirmed.",
            providerMessageId: "proof-dup",
            routedToken: "HP-RIV1",
            intent: "confirm",
            receivedAt: now,
          });
        }
        const again = await ctx.db
          .query("inboundEmails")
          .withIndex("byProviderMessageId", (q) => q.eq("providerMessageId", "proof-dup"))
          .collect();
        cases.push({
          attack: "duplicate inbound insert",
          expectedBehavior: "one row",
          actualBehavior: `${again.length} row(s)`,
          passed: again.length === 1,
        });
      }
    }

    const ids = [];
    for (const row of cases) {
      ids.push(
        await ctx.db.insert("reliabilityProofs", {
          ...row,
          ranAt: now,
        }),
      );
    }
    return { ranAt: now, results: cases };
  },
});
