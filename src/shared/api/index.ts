import { z } from "zod";
import { auth } from "../auth";
import { config } from "../config";

const baseUrl = config.apiBaseUrl;

const errorResponseSchema = z.object({
  code: z.string(),
  message: z.string().optional(),
  requestId: z.string().optional(),
  fieldErrors: z.record(z.string()).optional(),
});

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly retryAfter?: number,
    public readonly fields: Record<string, string> = {},
    public readonly requestId?: string,
  ) {
    super(code);
    this.name = "ApiError";
  }
}

async function request<Schema extends z.ZodTypeAny>(
  path: string,
  schema: Schema,
  init: RequestInit = {},
  idempotencyKey?: string,
): Promise<z.output<Schema>> {
  if (!baseUrl) {
    throw new Error("VITE_PANTRY_API_BASE_URL is not configured.");
  }

  const user = auth?.currentUser;
  if (!user) {
    throw new ApiError("AUTH_REQUIRED");
  }

  let token: string;
  try {
    token = await user.getIdToken();
  } catch {
    throw new ApiError("AUTH_REQUIRED");
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 100_000);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (idempotencyKey) {
    headers.set("Idempotency-Key", idempotencyKey);
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const parsed = errorResponseSchema.safeParse(payload);
      const code = parsed.success ? parsed.data.code : "INTERNAL_ERROR";
      if (response.status === 403) {
        window.dispatchEvent(new Event("pantry:access-denied"));
      }
      throw new ApiError(
        code,
        parseRetryAfter(response.headers.get("Retry-After")),
        parsed.success ? (parsed.data.fieldErrors ?? {}) : {},
        parsed.success ? parsed.data.requestId : undefined,
      );
    }

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      throw new ApiError("INVALID_API_RESPONSE");
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("REQUEST_TIMEOUT");
    }
    throw new ApiError("NETWORK_ERROR");
  } finally {
    window.clearTimeout(timer);
  }
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

const successSchema = z.object({ status: z.literal("success") });

const stockSchema = z
  .object({
    stock_id: z.string(),
    original_item_name: z.string().optional().default(""),
    display_name: z.string(),
    item_variant: z.string().optional().default(""),
    item_key: z.string().optional().default(""),
    category: z.string().optional().default("その他"),
    quantity: z.number().int(),
    unit: z.string(),
    version: z.number().int(),
    storage_type: z.enum(["fridge", "freezer", "room"]).nullable().optional(),
    expiration_date: z.string().optional().default(""),
    purchase_date: z.string().optional().default(""),
    parent_stock_id: z.string().optional().default(""),
    tags: z.array(z.string()).optional().default([]),
    created_at: z.string().optional().default(""),
  })
  .transform((stock) => ({
    ...stock,
    original_item_name: stock.original_item_name ?? "",
    item_variant: stock.item_variant ?? "",
    item_key: stock.item_key ?? "",
    category: stock.category ?? "その他",
    expiration_date: stock.expiration_date ?? "",
    purchase_date: stock.purchase_date ?? "",
    parent_stock_id: stock.parent_stock_id ?? "",
    tags: stock.tags ?? [],
    created_at: stock.created_at ?? "",
  }));

const usedStockSchema = z.object({
  stock_id: z.string(),
  quantity: z.number(),
  unit: z.string(),
  display_name: z.string().optional(),
});

const planSchema = z
  .object({
    plan_id: z.string(),
    date: z.string(),
    meal_type: z.enum(["lunch", "dinner"]),
    meal_context: z.string().nullable().optional(),
    menu_name: z.string(),
    used_stocks: z.array(usedStockSchema).default([]),
    status: z.enum(["planned", "cooked", "skipped"]),
    version: z.number().int(),
    status_changed_at: z.string().nullable().optional(),
    undo_expires_at: z.string().nullable().optional(),
  })
  .transform((plan) => ({
    ...plan,
    used_stocks: plan.used_stocks ?? [],
  }));

const shoppingItemSchema = z
  .object({
    item_id: z.string(),
    name: z.string(),
    item_variant: z.string().optional().default(""),
    item_key: z.string().optional().default(""),
    quantity: z.number(),
    unit: z.string(),
    is_purchased: z.boolean(),
    needs_stock_confirmation: z.boolean().default(false),
    unmatched_stock_ids: z.array(z.string()).default([]),
  })
  .transform((item) => ({
    ...item,
    item_variant: item.item_variant ?? "",
    item_key: item.item_key ?? "",
    needs_stock_confirmation: item.needs_stock_confirmation ?? false,
    unmatched_stock_ids: item.unmatched_stock_ids ?? [],
  }));

const profileSchema = z.object({
  family_members: z.string(),
  preference_notes: z.string(),
  preference_summary: z.string(),
});

const recipeSchema = z.object({
  servings: z.number().int(),
  ingredients: z.array(
    z.object({ name: z.string(), quantity: z.number(), unit: z.string() }),
  ),
  steps: z.array(z.string()),
  estimated_minutes: z.number().int().optional(),
});

const shoppingListSchema = z
  .object({
    week_start_date: z.string(),
    revision: z.number().int(),
    updated_at: z.string(),
    items: z.array(shoppingItemSchema),
  })
  .nullable();

const proposalSchema = z.object({
  proposal_id: z.string(),
  ai_response: z.string(),
  proposed_actions: z.array(z.unknown()),
});

const stockResponse = successSchema.extend({ stock: stockSchema });

export type Stock = z.infer<typeof stockSchema>;
export type Plan = z.infer<typeof planSchema>;
export type ShoppingItem = z.infer<typeof shoppingItemSchema>;
export type ShoppingList = z.infer<typeof shoppingListSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type Proposal = z.infer<typeof proposalSchema>;

export const api = {
  stocks: async () =>
    (
      await request(
        "/api/pantry/stocks",
        successSchema.extend({ stocks: z.array(stockSchema) }),
      )
    ).stocks,

  addStock: (
    data: {
      display_name: string;
      quantity: number;
      unit: string;
      expiration_date: string;
      storage_type: Stock["storage_type"];
    },
    key: string,
  ) =>
    request(
      "/api/pantry/stocks",
      stockResponse,
      { method: "POST", body: JSON.stringify(data) },
      key,
    ),

  updateStock: (
    stockId: string,
    data: {
      display_name: string;
      quantity: number;
      unit: string;
      storage_type: Stock["storage_type"];
      expected_version: number;
    },
    key: string,
  ) =>
    request(
      `/api/pantry/stocks/${encodeURIComponent(stockId)}`,
      stockResponse,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      key,
    ),

  consumeStock: (
    stockId: string,
    dispose: boolean,
    data: {
      quantity: number;
      unit: string;
      expected_version: number;
    },
    key: string,
  ) =>
    request(
      `/api/pantry/stocks/${encodeURIComponent(stockId)}/${dispose ? "dispose" : "consume"}`,
      successSchema.extend({
        stock_id: z.string(),
        remaining_quantity: z.number().int(),
      }),
      { method: "POST", body: JSON.stringify(data) },
      key,
    ),

  profile: async () =>
    (
      await request(
        "/api/pantry/profile",
        successSchema.extend({ profile: profileSchema }),
      )
    ).profile,

  saveProfile: async (data: Profile, key: string) =>
    (
      await request(
        "/api/pantry/profile",
        successSchema.extend({ profile: profileSchema }),
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
        key,
      )
    ).profile,

  organizePreferences: (data: {
    current_family_members: string;
    current_preference_notes: string;
    current_preference_summary: string;
    additional_notes: string;
  }) =>
    request(
      "/api/pantry/profile/preferences/organize",
      successSchema.extend({
        preference_notes: z.string(),
        preference_summary: z.string(),
      }),
      { method: "POST", body: JSON.stringify(data) },
    ),

  menu: async (weekStartDate: string) =>
    (
      await request(
        `/api/pantry/menu-plans?week_start_date=${encodeURIComponent(weekStartDate)}`,
        successSchema.extend({ menu_plans: z.array(planSchema) }),
      )
    ).menu_plans,

  generateMenu: (
    data: { week_start_date: string; cooking_conditions: string },
    key: string,
  ) =>
    request(
      "/api/pantry/generate-menu",
      successSchema.extend({
        menu_plans: z.array(planSchema),
        shopping_list: z.array(shoppingItemSchema),
      }),
      { method: "POST", body: JSON.stringify(data) },
      key,
    ),

  updatePlanStatus: (planId: string, status: Plan["status"], key: string) =>
    request(
      `/api/pantry/menu-plans/${encodeURIComponent(planId)}/status`,
      successSchema.extend({
        plan_id: z.string(),
        status: z.enum(["planned", "cooked", "skipped"]),
        version: z.number().int(),
        status_changed_at: z.string().nullable(),
        undo_expires_at: z.string().nullable(),
      }),
      { method: "PATCH", body: JSON.stringify({ status }) },
      key,
    ),

  recipe: async (planId: string, data: { cooking_conditions: string }) =>
    (
      await request(
        `/api/pantry/menu-plans/${encodeURIComponent(planId)}/recipe`,
        successSchema.extend({ recipe: recipeSchema }),
        { method: "POST", body: JSON.stringify(data) },
      )
    ).recipe,

  correctMenu: (
    data: { week_start_date: string; message: string },
    key: string,
  ) =>
    request(
      "/api/pantry/menu-plans/corrections",
      successSchema.extend({
        plan_id: z.string().optional(),
        menu_name: z.string().optional(),
        status: z.string().optional(),
        clarification_question: z.string().optional(),
      }),
      { method: "POST", body: JSON.stringify(data) },
      key,
    ),

  shopping: async () =>
    (
      await request(
        "/api/pantry/shopping-list",
        successSchema.extend({ shopping_list: shoppingListSchema }),
      )
    ).shopping_list,

  setPurchased: (itemId: string, purchased: boolean, key: string) =>
    request(
      `/api/pantry/shopping-list/items/${encodeURIComponent(itemId)}`,
      successSchema.extend({ item_id: z.string(), is_purchased: z.boolean() }),
      { method: "PATCH", body: JSON.stringify({ is_purchased: purchased }) },
      key,
    ),

  proposeStockChange: (
    data: { message: string; previous_proposal_id?: string },
    key: string,
  ) =>
    request(
      "/api/pantry/chat",
      proposalSchema.extend({ status: z.literal("success") }),
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      key,
    ),

  proposalAction: (
    proposalId: string,
    action: "confirm" | "cancel",
    key: string,
  ) =>
    request(
      `/api/pantry/chat/${encodeURIComponent(proposalId)}/${action}`,
      successSchema.extend({
        proposal_id: z.string(),
        status: z.enum(["applied", "cancelled"]),
      }),
      { method: "POST" },
      key,
    ),
};
