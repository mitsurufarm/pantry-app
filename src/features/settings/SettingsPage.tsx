import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Profile } from "../../shared/api";
import { operationKey } from "../../shared/utils/operationKey";
import { ConfirmDialog, ErrorMessage, Loading } from "../../shared/components";

interface SettingsPageProps {
  onNotice: (message: string) => void;
}

export function SettingsPage({ onNotice }: SettingsPageProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ["profile"], queryFn: api.profile });
  const [form, setForm] = useState<Profile>({
    family_members: "",
    preference_notes: "",
    preference_summary: "",
  });
  const [additional, setAdditional] = useState("");
  const [dirty, setDirty] = useState(false);
  const [organizeError, setOrganizeError] = useState<unknown>(null);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (query.data && !dirty) setForm(query.data);
  }, [query.data, dirty]);

  const organize = useMutation({
    mutationFn: () =>
      api.organizePreferences({
        current_family_members: form.family_members,
        current_preference_notes: form.preference_notes,
        current_preference_summary: form.preference_summary,
        additional_notes: additional,
      }),
    onSuccess: (result) => {
      setForm((value) => ({
        ...value,
        preference_notes: result.preference_notes,
        preference_summary: result.preference_summary,
      }));
      setAdditional("");
      setDirty(true);
      setOrganizeError(null);
    },
    onError: setOrganizeError,
  });

  const save = useMutation({
    mutationFn: (key: string) => api.saveProfile(form, key),
    onSuccess: async (result) => {
      setForm(result);
      setDirty(false);
      setAdditional("");
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      onNotice("プロフィールを保存しました。");
    },
  });

  const update = (key: keyof Profile, value: string) => {
    setDirty(true);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const hasUnsaved = dirty || additional.trim().length > 0;

  // Intercept navigation links when there are unsaved changes
  useEffect(() => {
    if (!hasUnsaved) return;

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (
        href &&
        !href.includes("/settings") &&
        (href.startsWith("#") || href.startsWith("/"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        const targetPath = href.startsWith("#") ? href.replace(/^#/, "") : href;
        setPendingNavigation(targetPath);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [hasUnsaved]);

  // Browser refresh / tab close blocker
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsaved) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsaved]);

  if (query.isPending)
    return <Loading label="プロフィールを読み込んでいます…" />;
  if (query.error)
    return (
      <section>
        <h1>プロフィール設定</h1>
        <ErrorMessage error={query.error} />
      </section>
    );

  return (
    <section>
      <p className="eyebrow">家族に合わせた献立のために</p>
      <h1>プロフィール設定</h1>
      <p className="privacy-note">
        保存した内容は献立・レシピの個別化のため外部AIサービスへ送信されます。データ処理の場所は東京に限定されません。
      </p>

      <label>
        家族構成
        <textarea
          maxLength={2000}
          value={form.family_members}
          onChange={(event) => update("family_members", event.target.value)}
          placeholder="例：大人2人、子ども1人（5歳）"
        />
      </label>
      <label>
        好み・アレルギー・苦手食材・家庭内ルール
        <textarea
          maxLength={2000}
          value={form.preference_notes}
          onChange={(event) => update("preference_notes", event.target.value)}
        />
      </label>
      <label>
        整理した要件
        <textarea
          maxLength={2000}
          value={form.preference_summary}
          onChange={(event) => update("preference_summary", event.target.value)}
        />
      </label>

      <div className="form">
        <h2>好み・要件に追記</h2>
        <label>
          追加情報
          <textarea
            maxLength={1000}
            value={additional}
            onChange={(event) => setAdditional(event.target.value)}
            placeholder="例：平日は短時間で作れる料理がよい"
          />
        </label>
        <p className="privacy-note">
          追加情報は整理のため外部AIサービスへ送信されます。提案後に内容を編集して保存できます。
        </p>
        <button
          disabled={!additional.trim() || organize.isPending}
          onClick={() => organize.mutate()}
        >
          要約して追記
        </button>
        <ErrorMessage error={organizeError} />
        {organize.isPending && <Loading label="内容を整理しています…" />}
      </div>

      <button
        disabled={!dirty || additional.trim().length > 0 || save.isPending}
        onClick={() => save.mutate(operationKey())}
      >
        プロフィールを保存
      </button>
      {additional.trim() && (
        <p className="warning-note">
          追加情報を保存するには、先に「要約して追記」を実行してください。
        </p>
      )}

      <ErrorMessage error={save.error} />
      {save.isPending && <Loading label="保存しています…" />}

      <ConfirmDialog
        isOpen={pendingNavigation !== null}
        title="未保存の変更"
        message="保存されていない変更があります。変更を破棄して移動しますか？"
        confirmLabel="破棄して移動"
        cancelLabel="編集に戻る"
        isDanger
        onConfirm={() => {
          const path = pendingNavigation;
          setPendingNavigation(null);
          setDirty(false);
          setAdditional("");
          if (path) {
            navigate(path);
          }
        }}
        onCancel={() => setPendingNavigation(null)}
      />
    </section>
  );
}
