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
    const { englishNews, mode } = await req.json();
    
    if (!englishNews || typeof englishNews !== "string") {
      throw new Error("English news text is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    
    switch (mode) {
      case "translate":
        systemPrompt = `You are a professional Tamil TV news editor.
Translate the following English news into formal, professional Tamil used by television news channels.
Keep it short, bold, and impactful.
Do not add explanations.
Do not use casual or spoken Tamil.
Avoid emojis.
Return ONLY the Tamil translation, nothing else.`;
        break;
        
      case "headlines":
        systemPrompt = `You are a Tamil news headline assistant.
From the given English news, generate 3 professional Tamil headlines:
1. Breaking News headline (prefix with "BREAKING: ")
2. Normal News headline (prefix with "NEWS: ")
3. Short Ticker headline (prefix with "TICKER: ")

Rules:
- Use formal Tamil used in TV news
- Headlines must be short and catchy
- Each headline must be under 12 words
- No emojis
- Return each headline on a new line`;
        break;
        
      case "template":
        systemPrompt = `You are an AI news template designer.
Generate content for a breaking news image template with the following sections:
- BADGE: Breaking badge text in Tamil (e.g., முக்கிய செய்தி)
- HEADLINE: Main Tamil headline (bold and impactful)
- DESCRIPTION: Optional short description in Tamil (1-2 sentences)

Rules:
- Use professional Tamil
- Headline should be bold and impactful
- Suitable for TV and Telegram publishing
- No emojis
- Format each section on a new line with the label prefix`;
        break;
        
      case "telegram":
        systemPrompt = `You are an AI media automation assistant.
Prepare a Telegram caption for publishing a breaking news image.
Create a professional Tamil headline from the English news.
Keep the caption under 200 characters.
Do not add emojis or hashtags.
Return ONLY the caption text.`;
        break;
        
      case "full":
      default:
        systemPrompt = `Act as a Tamil newsroom AI system.
From the following English news:
1. First, provide the full Tamil translation (prefix with "TRANSLATION:")
2. Then generate 3 headline options:
   - BREAKING: Breaking News headline
   - NEWS: Standard News headline
   - TICKER: Ticker Headline
3. Finally, provide a Telegram caption under 200 characters (prefix with "TELEGRAM:")

Rules:
- Formal Tamil only
- Suitable for media publishing
- No emojis
- No explanations
- Each section on a new line`;
        break;
    }

    console.log(`Processing ${mode} request for: ${englishNews.substring(0, 50)}...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `English News:\n${englishNews}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI processing failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated");
    }

    console.log("Generated content:", content.substring(0, 100));

    return new Response(
      JSON.stringify({ result: content, mode }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("tamil-translate error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
