/**
 * LLM client for CampusFlow (model-agnostic `converse()` layer).
 *
 * NOTE ON AMAZON BEDROCK: the app was architected for Bedrock (Converse API) and
 * the integration is built. Bedrock invocation needs an AWS Marketplace subscription
 * = a CARD payment instrument; the demo account only had UPI AutoPay, which AWS
 * Marketplace rejects (INVALID_PAYMENT_INSTRUMENT). Anthropic + Google Gemini free
 * tier were also card/region-gated. To keep the demo live and FREE, this same
 * `converse()` abstraction calls Groq's free API (OpenAI-compatible). Switching to
 * Bedrock/Claude is a one-file change — every caller stays identical.
 *
 * Env: GROQ_API_KEY (required). GROQ_MODEL_EXTRACT / GROQ_MODEL_CHAT optional.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export const MODEL_EXTRACT =
  process.env.GROQ_MODEL_EXTRACT || "llama-3.3-70b-versatile";

export const MODEL_CHAT =
  process.env.GROQ_MODEL_CHAT || "llama-3.3-70b-versatile";

type ConverseOpts = {
  modelId: string;
  system?: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
};

/** Call the LLM and return the assistant's text. Same signature everywhere. */
export async function converse({
  modelId,
  system,
  user,
  maxTokens = 1500,
  temperature = 0.2,
}: ConverseOpts): Promise<string> {
  // GROQ_API_KEY is the primary name; GROQVAL is a plain-named alias that some
  // hosts (Amplify) inject even when they withhold "secret-looking" variables.
  const apiKey = process.env.GROQ_API_KEY || process.env.GROQVAL;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY env var");
  }

  const messages: { role: string; content: string }[] = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: user });

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq ${res.status}: ${errText}`);
  }

  const data: any = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  return text.trim();
}
