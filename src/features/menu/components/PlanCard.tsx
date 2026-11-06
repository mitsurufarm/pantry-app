import type { Plan } from "../../../shared/api";

interface PlanCardProps {
  plan: Plan;
  remaining: number;
  onStatus: (status: Plan["status"]) => void;
  onRecipe: () => void;
  isRecipeLoading?: boolean;
  isStatusLoading?: boolean;
}

export function PlanCard({
  plan,
  remaining,
  onStatus,
  onRecipe,
  isRecipeLoading = false,
  isStatusLoading = false,
}: PlanCardProps) {
  const statusText =
    plan.status === "cooked"
      ? "作った"
      : plan.status === "skipped"
        ? "作らなかった"
        : "予定";
  const active = plan.status !== "planned" && remaining > 0;
  const locked = plan.status !== "planned" && remaining <= 0;

  return (
    <article className={`card plan-card ${active ? "soon" : ""}`}>
      <div className="plan-heading">
        <small>
          {plan.date}・
          {plan.meal_type === "lunch"
            ? plan.meal_context === "bento"
              ? "昼（弁当）"
              : "昼"
            : "夕食"}
        </small>
        <span className={`tag ${plan.status}`}>
          {statusText}
          {active ? `・取消 ${remaining}秒` : ""}
        </span>
      </div>
      <h3>{plan.menu_name}</h3>
      {plan.used_stocks.length > 0 && (
        <p className="muted">
          使用予定:{" "}
          {plan.used_stocks
            .map(
              (stock) =>
                `${stock.display_name ?? "食材"} ${stock.quantity}${stock.unit}`,
            )
            .join("、")}
        </p>
      )}
      <div className="button-row">
        <button
          disabled={locked || isStatusLoading || isRecipeLoading}
          onClick={() => onStatus("cooked")}
        >
          {plan.status === "cooked" && active ? "作ったを取消" : "作った"}
        </button>
        <button
          className="secondary"
          disabled={locked || isStatusLoading || isRecipeLoading}
          onClick={() => onStatus("skipped")}
        >
          {plan.status === "skipped" && active
            ? "作らなかったを取消"
            : "作らなかった"}
        </button>
        <button
          className="secondary"
          disabled={isRecipeLoading || isStatusLoading}
          onClick={onRecipe}
        >
          {isRecipeLoading ? "レシピ作成中…" : "レシピを見る"}
        </button>
      </div>
    </article>
  );
}
