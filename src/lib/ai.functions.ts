import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { analyzeImageJson, askAgentAi, type AgentChatMessage } from "./ai.server";

const imageInput = z.object({
  imageDataUrl: z
    .string()
    .max(8_000_000, "Image too large")
    .regex(/^data:image\/(png|jpe?g|webp);base64,/, "Unsupported image"),
});

export interface MealAnalysis {
  isFood: boolean;
  mealName: string;
  items: { name: string; portion: string; calories: number; kgCO2e: number }[];
  totalCalories: number;
  totalKgCO2e: number;
  plantBased: boolean;
  tip: string;
}

const mealSchema = {
  type: "object",
  additionalProperties: false,
  required: ["isFood", "mealName", "items", "totalCalories", "totalKgCO2e", "plantBased", "tip"],
  properties: {
    isFood: { type: "boolean" },
    mealName: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "portion", "calories", "kgCO2e"],
        properties: {
          name: { type: "string" },
          portion: { type: "string" },
          calories: { type: "number" },
          kgCO2e: { type: "number" },
        },
      },
    },
    totalCalories: { type: "number" },
    totalKgCO2e: { type: "number" },
    plantBased: { type: "boolean" },
    tip: { type: "string" },
  },
};

export const analyzeMeal = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => imageInput.parse(d))
  .handler(async ({ data }) =>
    analyzeImageJson<MealAnalysis>({
      imageDataUrl: data.imageDataUrl,
      schemaName: "meal_analysis",
      schema: mealSchema,
      prompt:
        "You are a nutrition and food-carbon expert. Identify each food item visible in this meal photo, estimate the portion, calories, and the carbon footprint in kg CO2e using life-cycle averages (e.g. Poore & Nemecek 2018; beef/mutton ≈ 25–60 kg CO2e per kg, chicken ≈ 6, paneer/cheese ≈ 10–20, rice ≈ 4, pulses/vegetables ≈ 0.5–2). Indian dishes are common. Sum the totals. plantBased is true only if no meat, fish, eggs or dairy. Give one short, friendly tip (max 20 words) to lower this meal's footprint. If the image is not food, set isFood false, items empty and totals 0.",
    }),
  );

export interface BillAnalysis {
  isBill: boolean;
  billType: "electricity" | "water" | "fuel" | "gas" | "shopping" | "other";
  vendor: string;
  period: string;
  periodDays: number;
  quantity: number;
  unit: string;
  amount: number;
  currency: string;
  kgCO2e: number;
  factorUsed: string;
  factorSource: string;
  summary: string;
}

const billSchema = {
  type: "object",
  additionalProperties: false,
  required: ["isBill", "billType", "vendor", "period", "periodDays", "quantity", "unit", "amount", "currency", "kgCO2e", "factorUsed", "factorSource", "summary"],
  properties: {
    isBill: { type: "boolean" },
    billType: { type: "string", enum: ["electricity", "water", "fuel", "gas", "shopping", "other"] },
    vendor: { type: "string" },
    period: { type: "string" },
    periodDays: { type: "number" },
    quantity: { type: "number" },
    unit: { type: "string" },
    amount: { type: "number" },
    currency: { type: "string" },
    kgCO2e: { type: "number" },
    factorUsed: { type: "string" },
    factorSource: { type: "string" },
    summary: { type: "string" },
  },
};

export const analyzeBill = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => imageInput.parse(d))
  .handler(async ({ data }) =>
    analyzeImageJson<BillAnalysis>({
      imageDataUrl: data.imageDataUrl,
      schemaName: "bill_analysis",
      schema: billSchema,
      prompt:
        "You read utility and purchase bills/invoices. Extract the vendor, billing period, the number of days that period covers (periodDays; use 1 for a one-off purchase receipt, 30 if a utility bill's period is unclear), the consumption quantity and unit (kWh, litres, kg, m³ — or line items for shopping), total amount and currency. Estimate the carbon footprint in kg CO2e using standard emission factors: electricity India grid 0.71 kg/kWh (CEA), petrol 2.31 kg/L, diesel 2.68 kg/L (DEFRA), LPG 2.98 kg/kg (India GHG Platform), water 0.34 kg/m³ (DEFRA); for shopping use spend-based EPA/DEFRA factors per category. State the factor used and its source (EPA, DEFRA, or India GHG Platform/CEA). Write a one-sentence plain-language summary. If the image is not a bill, set isBill false and numbers to 0.",
    }),
  );

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(2500),
});

const askAgentSchema = z.object({
  prompt: z.string().min(1).max(2500),
  history: z.array(chatMessageSchema).max(20).optional(),
  context: z
    .object({
      todayKg: z.number().optional(),
      streak: z.number().optional(),
      locality: z.string().optional(),
      recentActions: z.array(z.string()).optional(),
    })
    .optional(),
});

export type AskAgentPayload = z.infer<typeof askAgentSchema>;
export type { AgentChatMessage };

export const askEcoAgent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => askAgentSchema.parse(d))
  .handler(async ({ data }) => {
    return askAgentAi(data);
  });
