import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, type ShoppingList } from "../../shared/api";
import { renderWithProviders } from "../../test/test-utils";
import { ShoppingListPage } from "./ShoppingListPage";

vi.mock("../../shared/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../shared/api")>();
  return {
    ...original,
    api: {
      ...original.api,
      shopping: vi.fn(),
      setPurchased: vi.fn(),
    },
  };
});

describe("ShoppingListPage", () => {
  const mockNotice = vi.fn();

  const mockShoppingList: ShoppingList = {
    week_start_date: "2026-10-11",
    revision: 1,
    updated_at: "2026-10-11T00:00:00Z",
    items: [
      {
        item_id: "SHP0001",
        name: "キャベツ",
        item_variant: "1玉",
        item_key: "キャベツ||count",
        quantity: 1,
        unit: "玉",
        is_purchased: false,
        needs_stock_confirmation: false,
        unmatched_stock_ids: [],
      },
      {
        item_id: "SHP0002",
        name: "豚バラ肉",
        item_variant: "薄切り",
        item_key: "豚バラ肉|薄切り|weight",
        quantity: 300,
        unit: "g",
        is_purchased: true,
        needs_stock_confirmation: false,
        unmatched_stock_ids: [],
      },
      {
        item_id: "SHP0003",
        name: "しょうゆ",
        item_variant: "",
        item_key: "しょうゆ||volume",
        quantity: 1,
        unit: "本",
        is_purchased: false,
        needs_stock_confirmation: true,
        unmatched_stock_ids: ["STK9999"],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders shopping items grouped by purchased status", async () => {
    vi.mocked(api.shopping).mockResolvedValue(mockShoppingList);

    renderWithProviders(<ShoppingListPage onNotice={mockNotice} />);

    expect(await screen.findByText("2026-10-11週のリスト")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "買い物リスト" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "未購入（2）" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "購入済み（1）" }),
    ).toBeInTheDocument();

    expect(screen.getByText("キャベツ")).toBeInTheDocument();
    expect(screen.getByText("豚バラ肉")).toBeInTheDocument();
    expect(screen.getByText("在庫要確認")).toBeInTheDocument();
  });

  it("toggles item purchased status on checkbox click", async () => {
    const user = userEvent.setup();
    vi.mocked(api.shopping).mockResolvedValue(mockShoppingList);
    vi.mocked(api.setPurchased).mockResolvedValue({
      status: "success",
      item_id: "SHP0001",
      is_purchased: true,
    });

    renderWithProviders(<ShoppingListPage onNotice={mockNotice} />);

    const cabbageCheckbox = (await screen.findAllByRole("checkbox"))[0];
    expect(cabbageCheckbox).not.toBeChecked();

    await user.click(cabbageCheckbox);

    await waitFor(() => {
      expect(api.setPurchased).toHaveBeenCalledWith(
        "SHP0001",
        true,
        expect.any(String),
      );
      expect(mockNotice).toHaveBeenCalledWith(
        "購入状況を更新しました。在庫は変更されていません。",
      );
    });
  });

  it("shows empty message when list is empty or null", async () => {
    vi.mocked(api.shopping).mockResolvedValue(null);

    renderWithProviders(<ShoppingListPage onNotice={mockNotice} />);

    expect(
      await screen.findByText("追加で購入するものはありません。"),
    ).toBeInTheDocument();
  });
});
