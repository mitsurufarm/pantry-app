import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../shared/api";
import { renderWithProviders } from "../../test/test-utils";
import { AssistantPage } from "./AssistantPage";

vi.mock("../../shared/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../shared/api")>();
  return {
    ...original,
    api: {
      ...original.api,
      proposeStockChange: vi.fn(),
      proposalAction: vi.fn(),
    },
  };
});

describe("AssistantPage", () => {
  const mockNotice = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates proposal on submit and shows proposal card", async () => {
    const user = userEvent.setup();
    vi.mocked(api.proposeStockChange).mockResolvedValue({
      status: "success",
      proposal_id: "PRP0001",
      ai_response: "豚バラ肉500gを100gずつ5つに小分けして冷凍します。",
      proposed_actions: [],
    });

    renderWithProviders(<AssistantPage onNotice={mockNotice} />);

    expect(
      screen.getByRole("heading", { name: "AIアシスタント" }),
    ).toBeInTheDocument();

    const input = screen.getByPlaceholderText(
      "例：豚バラ肉を100gずつに小分けして冷凍したい",
    );
    const submitBtn = screen.getByRole("button", { name: "提案を作成" });

    await user.type(input, "豚バラ肉を100gずつに小分けしたい");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(api.proposeStockChange).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "豚バラ肉を100gずつに小分けしたい",
        }),
        expect.any(String),
      );
    });

    // Proposal card displayed
    expect(
      await screen.findByText(
        "豚バラ肉500gを100gずつ5つに小分けして冷凍します。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "反映する" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "取り消す" }),
    ).toBeInTheDocument();
  });

  it("confirms and applies proposal via confirmation dialog", async () => {
    const user = userEvent.setup();
    vi.mocked(api.proposeStockChange).mockResolvedValue({
      status: "success",
      proposal_id: "PRP0001",
      ai_response: "豚バラ肉を小分けします。",
      proposed_actions: [],
    });
    vi.mocked(api.proposalAction).mockResolvedValue({
      status: "applied",
      proposal_id: "PRP0001",
    });

    renderWithProviders(<AssistantPage onNotice={mockNotice} />);

    const input = screen.getByPlaceholderText(
      "例：豚バラ肉を100gずつに小分けして冷凍したい",
    );
    await user.type(input, "小分け");
    await user.click(screen.getByRole("button", { name: "提案を作成" }));

    const confirmBtn = await screen.findByRole("button", { name: "反映する" });
    await user.click(confirmBtn);

    // Confirmation dialog appears
    expect(
      screen.getByRole("heading", { name: "提案の反映" }),
    ).toBeInTheDocument();
    const dialogConfirm = screen.getByRole("button", { name: "確認" });
    await user.click(dialogConfirm);

    await waitFor(() => {
      expect(api.proposalAction).toHaveBeenCalledWith(
        "PRP0001",
        "confirm",
        expect.any(String),
      );
      expect(mockNotice).toHaveBeenCalledWith("提案を在庫に反映しました。");
    });
  });
});
