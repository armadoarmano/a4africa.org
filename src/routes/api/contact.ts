import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { sendAdminAlert } from "@/lib/notify.server";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().max(150).optional(),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(0).optional(), // honeypot: real people leave this empty
});

export const Route = createFileRoute("/api/contact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Please check the form and try again." }, { status: 400 });
        }
        const parsed = contactSchema.safeParse(body);
        if (!parsed.success)
          return Response.json(
            {
              error:
                "Please add your name, a valid email, and a message of at least 10 characters.",
            },
            { status: 400 },
          );

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { name, email, subject, message } = parsed.data;

        // Light abuse guard: max 3 messages per email address per hour.
        const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count } = await supabaseAdmin
          .from("contact_messages")
          .select("id", { count: "exact", head: true })
          .eq("email", email)
          .gte("created_at", since);
        if ((count ?? 0) >= 3)
          return Response.json(
            { error: "Thanks — we've already received your messages. We'll be in touch soon." },
            { status: 429 },
          );

        const { error } = await supabaseAdmin
          .from("contact_messages")
          .insert({ name, email, subject: subject || null, message });
        if (error)
          return Response.json(
            { error: "Your message could not be sent. Please try again." },
            { status: 500 },
          );

        await sendAdminAlert(
          `New contact message: ${subject || "No subject"}`,
          `From: ${name} <${email}>\n\n${message}\n\nReply from your inbox, or view it on the admin desk.`,
        );
        return Response.json({ ok: true }, { status: 201 });
      },
    },
  },
});
