import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Plan, type Recipe } from "../../shared/api";
import { todayJst, undoSeconds, weekStart } from "../../shared/utils/date";
import { operationKey } from "../../shared/utils/operationKey";
import { ConfirmDialog, ErrorMessage, Loading } from "../../shared/components";
import { PlanCard } from "./components/PlanCard";
import { RecipeModal } from "./components/RecipeModal";
import { MenuCorrectionForm } from "./components/MenuCorrectionForm";

interface MenuPageProps {
  onNotice: (message: string) => void;
}

export function MenuPage({ onNotice }: MenuPageProps) {
  const [next, setNext] = useState(false);
  const [conditions, setConditions] = useState("");
  const [recipe, setRecipe] = useState<{ plan: Plan; data: Recipe } | null>(
    null,
  );
  const [recipeConditions, setRecipeConditions] = useState("");
  const [remaining, setRemaining] = useState<Record<string, number>>({});
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  const queryClient = useQueryClient();
  const start = weekStart(next);
  const plansQuery = useQuery({
    queryKey: ["menu", start],
    queryFn: () => api.menu(start),
  });
  const shoppingQuery = useQuery({
    queryKey: ["shopping"],
    queryFn: api.shopping,
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["menu"] }),
      queryClient.invalidateQueries({ queryKey: ["shopping"] }),
      queryClient.invalidateQueries({ queryKey: ["stocks"] }),
    ]);
  };

  const generate = useMutation({
    mutationFn: (key: string) =>
      api.generateMenu(
        { week_start_date: start, cooking_conditions: conditions },
        key,
      ),
    onSuccess: async () => {
      setConditions("");
      await refresh();
      onNotice("献立を作成しました。");
    },
  });

  const status = useMutation({
    mutationFn: ({
      plan,
      value,
      key,
    }: {
      plan: Plan;
      value: Plan["status"];
      key: string;
    }) => api.updatePlanStatus(plan.plan_id, value, key),
    onSuccess: async () => {
      await refresh();
      onNotice("献立の状態を更新しました。");
    },
  });

  const recipeMutation = useMutation({
    mutationFn: ({
      plan,
      conditions: value,
    }: {
      plan: Plan;
      conditions: string;
    }) => api.recipe(plan.plan_id, { cooking_conditions: value }),
    onSuccess: (data, variables) => {
      setRecipe({ plan: variables.plan, data });
      setRecipeConditions("");
    },
  });

  const correctionMutation = useMutation({
    mutationFn: (message: string) =>
      api.correctMenu({ week_start_date: start, message }, operationKey()),
    onSuccess: async (result) => {
      if (result.clarification_question) {
        onNotice(result.clarification_question);
      } else {
        await refresh();
        onNotice("実際に作った料理として記録しました。");
      }
    },
  });

  useEffect(() => {
    const timer = window.setInterval(
      () =>
        setRemaining(
          Object.fromEntries(
            (plansQuery.data ?? []).map((plan) => [
              plan.plan_id,
              undoSeconds(plan.undo_expires_at),
            ]),
          ),
        ),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [plansQuery.data]);

  const plans = plansQuery.data ?? [];
  const today = todayJst();
  const todayPlans = plans.filter((plan) => plan.date === today);
  const pending = [...plans].sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a.meal_type.localeCompare(b.meal_type),
  );

  const handleStatusChange = (plan: Plan, value: Plan["status"]) => {
    const current = plan.status;
    const expired = undoSeconds(plan.undo_expires_at) <= 0;
    const nextStatus = current === value && !expired ? "planned" : value;
    // 画面設計2.1: 「作った」は確認ダイアログなしで在庫を減算する。「作らなかった」は在庫を変更しない。
    status.mutate({ plan, value: nextStatus, key: operationKey() });
  };

  const handleGenerateClick = () => {
    const currentList = shoppingQuery.data;
    if (currentList && currentList.week_start_date !== start) {
      setShowReplaceConfirm(true);
      return;
    }
    generate.mutate(operationKey());
  };

  return (
    <section>
      <div className="page-title">
        <div>
          <p className="eyebrow">今週の食事を整える</p>
          <h1>献立</h1>
        </div>
        <Link className="text-link" to="/assistant">
          AIに相談する
        </Link>
      </div>

      <section className="today-panel">
        <h2>今日の献立</h2>
        {plansQuery.isPending ? (
          <Loading />
        ) : todayPlans.length ? (
          todayPlans.map((plan) => (
            <PlanCard
              key={plan.plan_id}
              plan={plan}
              remaining={
                remaining[plan.plan_id] ?? undoSeconds(plan.undo_expires_at)
              }
              onStatus={(value) => handleStatusChange(plan, value)}
              onRecipe={() => recipeMutation.mutate({ plan, conditions: "" })}
            />
          ))
        ) : (
          <p className="empty">今日の献立はまだありません。</p>
        )}
      </section>

      <div className="tabs">
        <button
          className={!next ? "active" : ""}
          onClick={() => setNext(false)}
        >
          今週
        </button>
        <button className={next ? "active" : ""} onClick={() => setNext(true)}>
          来週
        </button>
        <span className="week-date">{start}から</span>
      </div>

      <div className="form">
        <label>
          献立への条件・人数（任意）
          <textarea
            maxLength={1000}
            value={conditions}
            onChange={(event) => setConditions(event.target.value)}
            placeholder="例：4人分で、辛さは控えめに"
          />
        </label>
        <p className="privacy-note">
          入力内容とプロフィールは、献立生成のため外部AIサービスへ送信されます。
        </p>
        <button
          disabled={generate.isPending || plansQuery.isPending}
          onClick={handleGenerateClick}
        >
          {generate.isPending ? "作成中…" : "選択週の献立を作成"}
        </button>
      </div>

      {plansQuery.isPending ? (
        <Loading />
      ) : pending.length ? (
        <div className="meal-grid">
          {pending.map((plan) => (
            <PlanCard
              key={plan.plan_id}
              plan={plan}
              remaining={
                remaining[plan.plan_id] ?? undoSeconds(plan.undo_expires_at)
              }
              onStatus={(value) => handleStatusChange(plan, value)}
              onRecipe={() => recipeMutation.mutate({ plan, conditions: "" })}
            />
          ))}
        </div>
      ) : (
        <p className="empty">
          この週の献立はまだありません。上のボタンから作成できます。
        </p>
      )}

      <MenuCorrectionForm
        onSubmit={(msg) => correctionMutation.mutate(msg)}
        isPending={correctionMutation.isPending}
      />

      <Link className="shopping-link" to="/shopping-list">
        買い物リストを開く（未購入{" "}
        {shoppingQuery.data?.items.filter((item) => !item.is_purchased)
          .length ?? 0}{" "}
        件）
      </Link>

      <ErrorMessage
        error={
          plansQuery.error ||
          generate.error ||
          status.error ||
          recipeMutation.error ||
          correctionMutation.error ||
          shoppingQuery.error
        }
      />
      {(generate.isPending ||
        status.isPending ||
        correctionMutation.isPending) && <Loading label="処理しています…" />}

      {recipe && (
        <RecipeModal
          recipe={recipe.data}
          plan={recipe.plan}
          conditions={recipeConditions}
          setConditions={setRecipeConditions}
          loading={recipeMutation.isPending}
          onClose={() => setRecipe(null)}
          onGenerate={() =>
            recipeMutation.mutate({
              plan: recipe.plan,
              conditions: recipeConditions,
            })
          }
          error={recipeMutation.error}
        />
      )}

      <ConfirmDialog
        isOpen={showReplaceConfirm}
        title="買い物リストの置き換え"
        message="別の週の買い物リストに置き換わります。続けますか？"
        confirmLabel="置き換えて作成"
        onConfirm={() => {
          setShowReplaceConfirm(false);
          generate.mutate(operationKey());
        }}
        onCancel={() => setShowReplaceConfirm(false)}
      />
    </section>
  );
}
