import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, caption, customWebhook } = await req.json();

    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");

    // If using custom webhook URL (for Zapier, Make, etc.)
    if (customWebhook) {
      console.log("Using custom webhook:", customWebhook);
      
      const webhookResponse = await fetch(customWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageBase64,
          caption: caption || "",
          timestamp: new Date().toISOString(),
        }),
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook failed: ${webhookResponse.status}`);
      }

      return new Response(
        JSON.stringify({ success: true, method: "webhook" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Direct Telegram Bot API
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      throw new Error("Telegram credentials not configured. Please add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in settings.");
    }

    console.log(`Publishing to Telegram chat: ${TELEGRAM_CHAT_ID}`);

    // If we have an image, send as photo
    if (imageBase64) {
      // Convert base64 to blob for Telegram
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const formData = new FormData();
      formData.append("chat_id", TELEGRAM_CHAT_ID);
      formData.append("photo", new Blob([binaryData], { type: "image/png" }), "news.png");
      if (caption) {
        formData.append("caption", caption.substring(0, 1024)); // Telegram caption limit
        formData.append("parse_mode", "HTML");
      }

      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
        { method: "POST", body: formData }
      );

      const result = await response.json();
      
      if (!result.ok) {
        console.error("Telegram API error:", result);
        throw new Error(result.description || "Failed to send to Telegram");
      }

      console.log("Photo sent successfully:", result.result?.message_id);

      return new Response(
        JSON.stringify({ success: true, messageId: result.result?.message_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Text-only message
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: caption || "News update",
          parse_mode: "HTML",
        }),
      }
    );

    const result = await response.json();

    if (!result.ok) {
      console.error("Telegram API error:", result);
      throw new Error(result.description || "Failed to send message");
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result.result?.message_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("telegram-publish error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
