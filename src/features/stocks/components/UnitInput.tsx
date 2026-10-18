import { useState } from "react";
import { predefinedUnits } from "../constants";

interface UnitInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function UnitInput({ value, onChange }: UnitInputProps) {
  const [custom, setCustom] = useState(!predefinedUnits.includes(value));

  return (
    <label>
      単位
      <input
        list="unit-options"
        required
        maxLength={20}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setCustom(!predefinedUnits.includes(event.target.value));
        }}
        placeholder="例：g、個"
      />
      <datalist id="unit-options">
        {predefinedUnits.map((unit) => (
          <option key={unit} value={unit} />
        ))}
      </datalist>
      {custom && <small>単位を20文字以内で入力してください。</small>}
    </label>
  );
}
