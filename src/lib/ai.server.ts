import {
  GatewayError,
  PaymentRequiredError,
  RateLimitError,
  generateResponse,
} from "@lovable.dev/ai-gateway";

export type AiResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Ask the vision model about an image and parse its strict-JSON answer. */
export async function analyzeImageJson<T>(opts: {
  imageDataUrl: string;
  prompt: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<AiResult<T>> {
  try {
    const res = await generateResponse({
      model: "openai/gpt-6-astra",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: opts.prompt },
            { type: "input_image", image_url: opts.imageDataUrl, detail: "auto" },
          ],
        },
      ],
      text: {
        format: { type: "json_schema", name: opts.schemaName, strict: true, schema: opts.schema },
      },
    });
    let text = "";
    for (const item of res.output) {
      if (item.type !== "message") continue;
      for (const c of item.content) {
        if (c.type === "output_text") text += c.text;
        else if (c.type === "refusal") return { ok: false, error: "The AI couldn't analyse this image." };
      }
    }
    if (!text) return { ok: false, error: "The AI returned no answer. Try a clearer photo." };
    return { ok: true, data: JSON.parse(text) as T };
  } catch (err) {
    if (err instanceof PaymentRequiredError)
      return { ok: false, error: "AI credits have run out for this workspace." };
    if (err instanceof RateLimitError)
      return { ok: false, error: "The AI is busy right now. Please try again in a minute." };
    if (err instanceof GatewayError) {
      console.error("AI gateway error", err.code, err.httpStatus, err.ids);
      return { ok: false, error: "AI analysis failed. Please try again." };
    }
    console.error("AI analysis error", err);
    return { ok: false, error: "Something went wrong analysing the image." };
  }
}
