import { useState, type FormEvent } from "react";
import type { Stock } from "../../../shared/api";
import { ErrorMessage } from "../../../shared/components";
import { storageLabels } from "../constants";
import { UnitInput } from "./UnitInput";

interface StockFormProps {
  onSubmit: (data: {
    display_name: string;
    quantity: number;
    unit: string;
    expiration_date: string;
    storage_type: Stock["storage_type"];
  }) => void;
  isPending: boolean;
  error: unknown;
}

const initialForm = {
  display_name: "",
  quantity: "1",
  unit: "g",
  expiration_date: "",
  storage_type: "" as "" | "fridge" | "freezer" | "room",
};

export function StockForm({ onSubmit, isPending, error }: StockFormProps) {
  const [form, setForm] = useState(initialForm);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      display_name: form.display_name,
      quantity: Number(form.quantity),
      unit: form.unit,
      expiration_date: form.expiration_date,
      storage_type: form.storage_type ? form.storage_type : null,
    });
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h2>食材を追加</h2>
      <label>
        食材名
        <input
          required
          maxLength={100}
          value={form.display_name}
          onChange={(event) =>
            setForm({ ...form, display_name: event.target.value })
          }
        />
      </label>
      <div className="form-row">
        <label>
          数量（1〜99,999）
          <input
            required
            type="number"
            min={1}
            max={99999}
            step={1}
            value={form.quantity}
            onChange={(event) =>
              setForm({ ...form, quantity: event.target.value })
            }
          />
        </label>
        <UnitInput
          value={form.unit}
          onChange={(unit) => setForm({ ...form, unit })}
        />
      </div>
      <label>
        賞味期限（任意）
        <input
          type="date"
          value={form.expiration_date}
          onChange={(event) =>
            setForm({ ...form, expiration_date: event.target.value })
          }
        />
      </label>
      <label>
        保管場所（任意）
        <select
          value={form.storage_type}
          onChange={(event) =>
            setForm({
              ...form,
              storage_type: event.target.value as typeof form.storage_type,
            })
          }
        >
          <option value="">未設定</option>
          {Object.entries(storageLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <button disabled={isPending}>在庫に登録</button>
      <ErrorMessage error={error} />
    </form>
  );
}
