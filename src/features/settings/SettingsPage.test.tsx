import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, type Profile } from "../../shared/api";
import { renderWithProviders } from "../../test/test-utils";
import { SettingsPage } from "./SettingsPage";

vi.mock("../../shared/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../shared/api")>();
  return {
    ...original,
    api: {
      ...original.api,
      profile: vi.fn(),
      saveProfile: vi.fn(),
      organizePreferences: vi.fn(),
    },
  };
});

describe("SettingsPage", () => {
  const mockNotice = vi.fn();

  const mockProfile: Profile = {
    family_members: "夫婦2人",
    preference_notes: "辛いものが苦手",
    preference_summary: "辛さは控えめにする",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and displays current profile", async () => {
    vi.mocked(api.profile).mockResolvedValue(mockProfile);

    renderWithProviders(<SettingsPage onNotice={mockNotice} />);

    expect(await screen.findByDisplayValue("夫婦2人")).toBeInTheDocument();
    expect(screen.getByDisplayValue("辛いものが苦手")).toBeInTheDocument();
    expect(screen.getByDisplayValue("辛さは控えめにする")).toBeInTheDocument();
  });

  it("organizes additional notes and updates draft", async () => {
    const user = userEvent.setup();
    vi.mocked(api.profile).mockResolvedValue(mockProfile);
    vi.mocked(api.organizePreferences).mockResolvedValue({
      status: "success",
      preference_notes: "辛いものが苦手\n平日は時短料理",
      preference_summary: "辛さは控えめにする。平日は時短料理を優先する。",
    });

    renderWithProviders(<SettingsPage onNotice={mockNotice} />);

    expect(await screen.findByDisplayValue("夫婦2人")).toBeInTheDocument();

    const additionalInput =
      screen.getByPlaceholderText("例：平日は短時間で作れる料理がよい");
    const organizeBtn = screen.getByRole("button", { name: "要約して追記" });

    await user.type(additionalInput, "平日は時短料理");
    await user.click(organizeBtn);

    await waitFor(() => {
      expect(api.organizePreferences).toHaveBeenCalledWith({
        current_family_members: "夫婦2人",
        current_preference_notes: "辛いものが苦手",
        current_preference_summary: "辛さは控えめにする",
        additional_notes: "平日は時短料理",
      });
      expect(
        screen.getByDisplayValue(
          "辛さは控えめにする。平日は時短料理を優先する。",
        ),
      ).toBeInTheDocument();
    });
  });

  it("saves profile on button click", async () => {
    const user = userEvent.setup();
    vi.mocked(api.profile).mockResolvedValue(mockProfile);
    vi.mocked(api.saveProfile).mockResolvedValue({
      ...mockProfile,
      family_members: "夫婦と子ども1人",
    });

    renderWithProviders(<SettingsPage onNotice={mockNotice} />);

    const familyInput = await screen.findByDisplayValue("夫婦2人");
    await user.clear(familyInput);
    await user.type(familyInput, "夫婦と子ども1人");

    const saveBtn = screen.getByRole("button", { name: "プロフィールを保存" });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(api.saveProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          family_members: "夫婦と子ども1人",
        }),
        expect.any(String),
      );
      expect(mockNotice).toHaveBeenCalledWith("プロフィールを保存しました。");
    });
  });

  it("shows confirmation dialog when clicking link with unsaved changes", async () => {
    const user = userEvent.setup();
    vi.mocked(api.profile).mockResolvedValue(mockProfile);

    renderWithProviders(
      <div>
        <a href="#/stocks">在庫へ移動</a>
        <SettingsPage onNotice={mockNotice} />
      </div>,
    );

    const familyInput = await screen.findByDisplayValue("夫婦2人");
    await user.type(familyInput, "（編集）");

    // Click link to leave
    const link = screen.getByText("在庫へ移動");
    await user.click(link);

    // Confirmation dialog should be displayed
    expect(
      screen.getByRole("heading", { name: "未保存の変更" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "保存されていない変更があります。変更を破棄して移動しますか？",
      ),
    ).toBeInTheDocument();

    // Click "編集に戻る"
    const cancelBtn = screen.getByRole("button", { name: "編集に戻る" });
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "未保存の変更" }),
      ).not.toBeInTheDocument();
    });
  });
});
