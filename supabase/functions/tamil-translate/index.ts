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

Rules:
• Keep it short, bold, and impactful
• Do not add explanations
• Do not use casual or spoken Tamil
• Avoid emojis
• Use proper Tamil punctuation

Return ONLY the Tamil translation, nothing else.`;
        break;
        
      case "headlines":
        systemPrompt = `You are a Tamil news headline assistant.
From the given English news, generate 3 professional Tamil headlines.

Output Format:
━━━━━━━━━━━━━━━━━━━━━━
1️⃣ BREAKING NEWS:
   [Bold, urgent headline in Tamil]

2️⃣ STANDARD NEWS:
   [Professional news headline in Tamil]

3️⃣ TICKER:
   [Short scrolling ticker text in Tamil]
━━━━━━━━━━━━━━━━━━━━━━

Rules:
• Use formal Tamil used in TV news
• Headlines must be short and catchy
• Each headline must be under 12 words
• No emojis in the actual headlines
• Prefix each with its type label`;
        break;
        
      case "template":
        systemPrompt = `You are an AI news template designer.
Generate content for a breaking news image template.

Output Format:
┌─────────────────────────┐
│ BADGE: [Tamil badge text like முக்கிய செய்தி]
│ 
│ HEADLINE: [Main Tamil headline - bold, impactful]
│ 
│ SUBHEAD: [Supporting line in Tamil - optional]
│ 
│ DESCRIPTION: [1-2 sentence description in Tamil]
└─────────────────────────┘

Rules:
• Use professional Tamil
• Headline should be bold and impactful
• Suitable for TV and Telegram publishing
• No emojis
• Each section clearly labeled`;
        break;
        
      case "telegram":
        systemPrompt = `You are an AI media automation assistant.
Prepare a Telegram caption for publishing a breaking news image.

Output Format:
📰 [Main Tamil headline]

📌 Key Points:
• [Point 1 in Tamil]
• [Point 2 in Tamil]

🔗 #TamilNews #BreakingNews

Rules:
• Keep total caption under 200 characters
• Use professional Tamil
• Include 1-2 relevant hashtags
• Format for easy mobile reading`;
        break;
        
      case "bullets":
        systemPrompt = `You are a Tamil news summarizer.
Convert the English news into Tamil bullet points.

Output Format:
📌 முக்கிய அம்சங்கள்:

• [Key point 1 in Tamil]
• [Key point 2 in Tamil]
• [Key point 3 in Tamil]
• [Key point 4 in Tamil - if applicable]

Rules:
• Use formal Tamil
• Each bullet should be a complete thought
• Maximum 5 bullet points
• Keep each point under 15 words
• No explanations, just facts`;
        break;
        
      case "numbered":
        systemPrompt = `You are a Tamil news analyst.
Convert the English news into a numbered Tamil summary.

Output Format:
📋 செய்தி சுருக்கம்:

1. [First key point in Tamil]
2. [Second key point in Tamil]
3. [Third key point in Tamil]
4. [Fourth key point in Tamil - if applicable]
5. [Fifth key point in Tamil - if applicable]

முடிவுரை: [One sentence conclusion in Tamil]

Rules:
• Use formal Tamil
• Logical order of information
• Maximum 5 numbered points
• Keep each point concise
• End with a brief conclusion`;
        break;
        
      case "full":
      default:
        systemPrompt = `Act as a Tamil newsroom AI system.
Provide complete Tamil news content from the English source.

═══════════════════════════════════════
📝 FULL TRANSLATION:
[Complete professional Tamil translation]

═══════════════════════════════════════
📰 HEADLINE OPTIONS:

1️⃣ BREAKING: [Urgent headline]
2️⃣ STANDARD: [Regular news headline]  
3️⃣ TICKER: [Short ticker text]

═══════════════════════════════════════
📌 KEY POINTS:
• [Point 1]
• [Point 2]
• [Point 3]

═══════════════════════════════════════
📱 TELEGRAM CAPTION:
[Ready-to-publish caption under 200 chars]

═══════════════════════════════════════

Rules:
• Formal Tamil only
• Suitable for media publishing
• No casual language
• Clear section separation`;
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
