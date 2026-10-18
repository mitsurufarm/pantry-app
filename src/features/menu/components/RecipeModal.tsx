import type { Plan, Recipe } from "../../../shared/api";
import { Dialog, ErrorMessage } from "../../../shared/components";

interface RecipeModalProps {
  recipe: Recipe;
  plan: Plan;
  conditions: string;
  setConditions: (value: string) => void;
  loading: boolean;
  onClose: () => void;
  onGenerate: () => void;
  error: unknown;
}

export function RecipeModal({
  recipe,
  plan,
  conditions,
  setConditions,
  loading,
  onClose,
  onGenerate,
  error,
}: RecipeModalProps) {
  return (
    <Dialog isOpen onClose={onClose} title={`${plan.menu_name}のレシピ`}>
      <div className="page-title">
        <h2>{plan.menu_name}</h2>
        <button className="text-button" onClick={onClose}>
          閉じる
        </button>
      </div>
      <p>
        {recipe.servings}人分
        {recipe.estimated_minutes ? `・約${recipe.estimated_minutes}分` : ""}
      </p>
      <h3>材料</h3>
      <ul>
        {recipe.ingredients.map((ingredient, index) => (
          <li key={`${ingredient.name}-${index}`}>
            {ingredient.name}：
            {ingredient.quantity.toFixed(2).replace(/\.?0+$/, "")}
            {ingredient.unit}
          </li>
        ))}
      </ul>
      <h3>作り方</h3>
      <ol>
        {recipe.steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
      <label>
        人数・調理条件（任意）
        <textarea
          maxLength={1000}
          value={conditions}
          onChange={(event) => setConditions(event.target.value)}
          placeholder="例：3人分、フライパンで作る"
        />
      </label>
      <p className="privacy-note">
        入力内容はレシピ生成のため外部AIサービスへ送信されます。
      </p>
      <button disabled={loading} onClick={onGenerate}>
        {loading ? "生成中…" : "条件を指定して再生成"}
      </button>
      <ErrorMessage error={error} />
    </Dialog>
  );
}
