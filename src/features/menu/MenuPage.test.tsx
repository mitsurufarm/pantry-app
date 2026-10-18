import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  api,
  type Plan,
  type Recipe,
  type ShoppingList,
} from "../../shared/api";
import { renderWithProviders } from "../../test/test-utils";
import { MenuPage } from "./MenuPage";

vi.mock("../../shared/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../shared/api")>();
  return {
    ...original,
    api: {
      ...original.api,
      menu: vi.fn(),
      shopping: vi.fn(),
      generateMenu: vi.fn(),
      updatePlanStatus: vi.fn(),
      recipe: vi.fn(),
      correctMenu: vi.fn(),
    },
  };
});

describe("MenuPage", () => {
  const mockNotice = vi.fn();

  const mockPlans: Plan[] = [
    {
      plan_id: "PLN0001",
      date: "2026-10-13",
      meal_type: "lunch",
      meal_context: "bento",
      menu_name: "鶏そぼろ弁当",
      used_stocks: [
        {
          stock_id: "STK001",
          quantity: 150,
          unit: "g",
          display_name: "鶏ひき肉",
        },
      ],
      status: "planned",
      version: 1,
      status_changed_at: null,
      undo_expires_at: null,
    },
    {
      plan_id: "PLN0002",
      date: "2026-10-13",
      meal_type: "dinner",
      meal_context: null,
      menu_name: "豚肉とキャベツの味噌炒め",
      used_stocks: [
        { stock_id: "STK002", quantity: 200, unit: "g", display_name: "豚肉" },
      ],
      status: "planned",
      version: 1,
      status_changed_at: null,
      undo_expires_at: null,
    },
  ];

  const mockRecipeData: Recipe = {
    servings: 2,
    ingredients: [
      { name: "豚肉", quantity: 200, unit: "g" },
      { name: "キャベツ", quantity: 0.25, unit: "玉" },
    ],
    steps: ["材料を一口大に切る", "フライパンで炒めて味噌で味付けする"],
    estimated_minutes: 15,
  };

  const mockShoppingList: ShoppingList = {
    week_start_date: "2026-10-11",
    revision: 1,
    updated_at: "2026-10-11T00:00:00Z",
    items: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders menu plans for today and the selected week", async () => {
    vi.mocked(api.menu).mockResolvedValue(mockPlans);
    vi.mocked(api.shopping).mockResolvedValue(mockShoppingList);

    renderWithProviders(<MenuPage onNotice={mockNotice} />);

    const bentoElements = await screen.findAllByText("鶏そぼろ弁当");
    expect(bentoElements.length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "献立" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "今日の献立" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("豚肉とキャベツの味噌炒め").length,
    ).toBeGreaterThan(0);
  });

  it("updates plan status to cooked on button click", async () => {
    const user = userEvent.setup();
    vi.mocked(api.menu).mockResolvedValue(mockPlans);
    vi.mocked(api.shopping).mockResolvedValue(mockShoppingList);
    vi.mocked(api.updatePlanStatus).mockResolvedValue({
      status: "cooked",
      plan_id: "PLN0001",
      version: 2,
      status_changed_at: "2026-10-13T06:00:00Z",
      undo_expires_at: "2026-10-13T06:00:30Z",
    });

    renderWithProviders(<MenuPage onNotice={mockNotice} />);

    // Click "作った" button for first plan
    const cookedBtns = await screen.findAllByRole("button", { name: "作った" });
    await user.click(cookedBtns[0]);

    await waitFor(() => {
      expect(api.updatePlanStatus).toHaveBeenCalledWith(
        "PLN0001",
        "cooked",
        expect.any(String),
      );
      expect(mockNotice).toHaveBeenCalledWith("献立の状態を更新しました。");
    });
  });

  it("opens and closes recipe modal", async () => {
    const user = userEvent.setup();
    vi.mocked(api.menu).mockResolvedValue(mockPlans);
    vi.mocked(api.shopping).mockResolvedValue(mockShoppingList);
    vi.mocked(api.recipe).mockResolvedValue(mockRecipeData);

    renderWithProviders(<MenuPage onNotice={mockNotice} />);

    const recipeBtns = await screen.findAllByRole("button", {
      name: "レシピを見る",
    });
    await user.click(recipeBtns[0]);

    // Modal should appear
    expect(await screen.findByText("2人分・約15分")).toBeInTheDocument();
    expect(screen.getByText("材料を一口大に切る")).toBeInTheDocument();

    // Close button
    const closeBtn = screen.getByRole("button", { name: "閉じる" });
    await user.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText("2人分・約15分")).not.toBeInTheDocument();
    });
  });

  it("submits correction form for different cooked meal", async () => {
    const user = userEvent.setup();
    vi.mocked(api.menu).mockResolvedValue(mockPlans);
    vi.mocked(api.shopping).mockResolvedValue(mockShoppingList);
    vi.mocked(api.correctMenu).mockResolvedValue({
      status: "success",
      plan_id: "PLN0001",
      menu_name: "カレーライス",
    });

    renderWithProviders(<MenuPage onNotice={mockNotice} />);

    const correctionInput =
      await screen.findByPlaceholderText("例：水曜の夕食はカレーを作った");
    const submitBtn = screen.getByRole("button", {
      name: "実際に作った料理を記録",
    });

    await user.type(correctionInput, "水曜の夕食はカレーを作った");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(api.correctMenu).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "水曜の夕食はカレーを作った",
        }),
        expect.any(String),
      );
      expect(mockNotice).toHaveBeenCalledWith(
        "実際に作った料理として記録しました。",
      );
    });
  });
});
