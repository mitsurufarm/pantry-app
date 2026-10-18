import type { ShoppingItem } from "../../../shared/api";

interface ShoppingRowProps {
  item: ShoppingItem;
  onToggle: (value: boolean) => void;
}

export function ShoppingRow({ item, onToggle }: ShoppingRowProps) {
  return (
    <label className={`shopping-row ${item.is_purchased ? "done" : ""}`}>
      <input
        type="checkbox"
        checked={item.is_purchased}
        onChange={(event) => onToggle(event.target.checked)}
      />
      <span className="shopping-name">
        {item.name}
        {item.item_variant && <small>（{item.item_variant}）</small>}
      </span>
      <b>
        {item.quantity}
        {item.unit}
      </b>
      {item.needs_stock_confirmation && (
        <span className="tag warning">在庫要確認</span>
      )}
    </label>
  );
}
