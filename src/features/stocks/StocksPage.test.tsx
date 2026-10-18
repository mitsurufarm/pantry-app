import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, type Stock } from "../../shared/api";
import { renderWithProviders } from "../../test/test-utils";
import { StocksPage } from "./StocksPage";

vi.mock("../../shared/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../shared/api")>();
  return {
    ...original,
    api: {
      ...original.api,
      stocks: vi.fn(),
      addStock: vi.fn(),
      updateStock: vi.fn(),
      consumeStock: vi.fn(),
    },
  };
});

describe("StocksPage", () => {
  const mockNotice = vi.fn();

  const mockStocks: Stock[] = [
    {
      stock_id: "STK0001",
      original_item_name: "豚バラ肉",
      display_name: "豚バラ肉",
      item_variant: "薄切り",
      item_key: "豚バラ肉|薄切り|weight",
      category: "肉類",
      quantity: 500,
      unit: "g",
      version: 1,
      storage_type: "freezer",
      expiration_date: "2026-10-25",
      purchase_date: "2026-10-10",
      parent_stock_id: "",
      tags: ["小分け"],
      created_at: "2026-10-10T00:00:00Z",
    },
    {
      stock_id: "STK0002",
      original_item_name: "牛乳",
      display_name: "牛乳",
      item_variant: "",
      item_key: "牛乳||volume",
      category: "乳製品",
      quantity: 1,
      unit: "本",
      version: 1,
      storage_type: "fridge",
      expiration_date: "2026-10-15",
      purchase_date: "2026-10-11",
      parent_stock_id: "",
      tags: [],
      created_at: "2026-10-11T00:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders stock items and filters by storage type", async () => {
    const user = userEvent.setup();
    vi.mocked(api.stocks).mockResolvedValue(mockStocks);

    renderWithProviders(<StocksPage onNotice={mockNotice} />);

    expect(await screen.findByText("豚バラ肉")).toBeInTheDocument();
    expect(screen.getByText("牛乳")).toBeInTheDocument();

    // Click "冷蔵" filter
    const fridgeFilter = screen.getByRole("button", { name: "冷蔵" });
    await user.click(fridgeFilter);

    // Only fridge items should show
    expect(screen.getByText("牛乳")).toBeInTheDocument();
    expect(screen.queryByText("豚バラ肉")).not.toBeInTheDocument();

    // Click "冷凍" filter
    const freezerFilter = screen.getByRole("button", { name: "冷凍" });
    await user.click(freezerFilter);

    expect(screen.getByText("豚バラ肉")).toBeInTheDocument();
    expect(screen.queryByText("牛乳")).not.toBeInTheDocument();
  });

  it("submits add stock form and clears fields on success", async () => {
    const user = userEvent.setup();
    vi.mocked(api.stocks).mockResolvedValue(mockStocks);
    vi.mocked(api.addStock).mockResolvedValue({
      status: "success",
      stock: {
        stock_id: "STK0003",
        original_item_name: "にんじん",
        display_name: "にんじん",
        item_variant: "",
        item_key: "にんじん||count",
        category: "野菜",
        quantity: 3,
        unit: "本",
        version: 1,
        storage_type: "room",
        expiration_date: "2026-10-20",
        purchase_date: "2026-10-13",
        parent_stock_id: "",
        tags: [],
        created_at: "2026-10-13T00:00:00Z",
      },
    });

    renderWithProviders(<StocksPage onNotice={mockNotice} />);

    expect(await screen.findByText("豚バラ肉")).toBeInTheDocument();

    const nameInput = screen.getByLabelText("食材名");
    const quantityInput = screen.getByLabelText("数量（1〜99,999）");
    const unitInput = screen.getByPlaceholderText("例：g、個");
    const submitBtn = screen.getByRole("button", { name: "在庫に登録" });

    await user.type(nameInput, "にんじん");
    await user.clear(quantityInput);
    await user.type(quantityInput, "3");
    await user.clear(unitInput);
    await user.type(unitInput, "本");

    await user.click(submitBtn);

    await waitFor(() => {
      expect(api.addStock).toHaveBeenCalledWith(
        expect.objectContaining({
          display_name: "にんじん",
          quantity: 3,
          unit: "本",
        }),
        expect.any(String),
      );
      expect(mockNotice).toHaveBeenCalledWith("食材を在庫に追加しました。");
    });
  });

  it("expands stock card and consumes quantity with confirm dialog", async () => {
    const user = userEvent.setup();
    vi.mocked(api.stocks).mockResolvedValue(mockStocks);
    vi.mocked(api.consumeStock).mockResolvedValue({
      status: "success",
      stock_id: "STK0001",
      remaining_quantity: 300,
    });

    renderWithProviders(<StocksPage onNotice={mockNotice} />);

    // Click stock title to expand
    const cardTitle = await screen.findByRole("button", { name: /豚バラ肉/ });
    await user.click(cardTitle);

    // Click "消費" button inside expanded card
    const consumeBtn = screen.getByRole("button", { name: "消費" });
    await user.click(consumeBtn);

    // Consume input appears
    const consumeInput = screen.getByLabelText("消費量");
    await user.clear(consumeInput);
    await user.type(consumeInput, "200");

    // Click "消費を確定"
    const confirmActionBtn = screen.getByRole("button", { name: "消費を確定" });
    await user.click(confirmActionBtn);

    // ConfirmDialog opens
    expect(
      screen.getByRole("heading", { name: "在庫の消費" }),
    ).toBeInTheDocument();
    const dialogConfirmBtn = screen.getByRole("button", { name: "確認" });
    await user.click(dialogConfirmBtn);

    await waitFor(() => {
      expect(api.consumeStock).toHaveBeenCalledWith(
        "STK0001",
        false,
        expect.objectContaining({
          quantity: 200,
          unit: "g",
          expected_version: 1,
        }),
        expect.any(String),
      );
      expect(mockNotice).toHaveBeenCalledWith(
        "在庫を更新しました。残り300gです。",
      );
    });
  });
});
