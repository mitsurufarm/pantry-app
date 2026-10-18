import { useState } from "react";

interface MenuCorrectionFormProps {
  onSubmit: (message: string) => void;
  isPending: boolean;
}

export function MenuCorrectionForm({
  onSubmit,
  isPending,
}: MenuCorrectionFormProps) {
  const [correction, setCorrection] = useState("");

  const handleSubmit = () => {
    if (!correction.trim() || isPending) return;
    onSubmit(correction);
    setCorrection("");
  };

  return (
    <section className="form">
      <h2>予定と違う料理を記録</h2>
      <label>
        変更内容
        <textarea
          maxLength={500}
          value={correction}
          onChange={(event) => setCorrection(event.target.value)}
          placeholder="例：水曜の夕食はカレーを作った"
        />
      </label>
      <p className="privacy-note">
        料理名の更新だけを行い、在庫は変更しません。
      </p>
      <button disabled={!correction.trim() || isPending} onClick={handleSubmit}>
        実際に作った料理を記録
      </button>
    </section>
  );
}
