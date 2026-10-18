import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Stock } from "../../../shared/api";
import { getExpirationState } from "../../../shared/utils/date";
import { operationKey } from "../../../shared/utils/operationKey";
import { ConfirmDialog, ErrorMessage } from "../../../shared/components";
import { storageLabels } from "../constants";
import { UnitInput } from "./UnitInput";

interface StockCardProps {
  stock: Stock;
  onNotice: (message: string) => void;
}

export function StockCard({ stock, onNotice }: StockCardProps) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(stock.display_name);
  const [quantity, setQuantity] = useState(String(stock.quantity));
  const [unit, setUnit] = useState(stock.unit);
  const [storage, setStorage] = useState(stock.storage_type ?? "");
  const [consumeQuantity, setConsumeQuantity] = useState(
    String(stock.quantity),
  );
  const [mode, setMode] = useState<"edit" | "consume" | "dispose" | null>(null);

  // 確認ダイアログ用ステート
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["stocks"] }),
      queryClient.invalidateQueries({ queryKey: ["menu"] }),
    ]);
  };

  const update = useMutation({
    mutationFn: (key: string) =>
      api.updateStock(
        stock.stock_id,
        {
          display_name: name,
          quantity: Number(quantity),
          unit,
          storage_type: storage ? (storage as Stock["storage_type"]) : null,
          expected_version: stock.version,
        },
        key,
      ),
    onSuccess: async () => {
      await refresh();
      onNotice("在庫を更新しました。");
      setMode(null);
    },
  });

  const change = useMutation({
    mutationFn: ({ dispose, key }: { dispose: boolean; key: string }) =>
      api.consumeStock(
        stock.stock_id,
        dispose,
        {
          quantity: dispose ? stock.quantity : Number(consumeQuantity),
          unit: stock.unit,
          expected_version: stock.version,
        },
        key,
      ),
    onSuccess: async (result) => {
      await refresh();
      onNotice(
        result.remaining_quantity
          ? `在庫を更新しました。残り${result.remaining_quantity}${stock.unit}です。`
          : "在庫を使い切りました。",
      );
      setMode(null);
    },
  });

  const expirationState = stock.expiration_date
    ? getExpirationState(stock.expiration_date)
    : "";

  const handleUpdateClick = () => {
    setConfirmDialog({
      isOpen: true,
      title: "在庫の変更",
      message: `${stock.display_name}の品名・数量・単位・保管場所を変更しますか？`,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        update.mutate(operationKey());
      },
    });
  };

  const handleConsumeClick = () => {
    setConfirmDialog({
      isOpen: true,
      title: "在庫の消費",
      message: `${consumeQuantity}${stock.unit}を消費しますか？`,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        change.mutate({ dispose: false, key: operationKey() });
      },
    });
  };

  const handleDisposeClick = () => {
    setConfirmDialog({
      isOpen: true,
      title: "在庫の廃棄",
      message: `${stock.display_name}を全量廃棄しますか？`,
      isDanger: true,
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        change.mutate({ dispose: true, key: operationKey() });
      },
    });
  };

  return (
    <article className={`card stock-card ${expirationState}`}>
      <button
        className="card-title"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <b>{stock.display_name}</b>
        <span>
          {stock.quantity}
          {stock.unit}・
          {storageLabels[stock.storage_type ?? ""] ?? "保管場所未設定"}・
          {expanded ? "−" : "＋"}
        </span>
      </button>
      <div className="stock-meta">
        <span>
          {stock.category}
          {stock.item_variant ? `・${stock.item_variant}` : ""}
        </span>
        <span>
          {stock.expiration_date
            ? `賞味期限 ${stock.expiration_date}`
            : "賞味期限未設定"}
        </span>
      </div>
      {stock.tags.length > 0 && (
        <div className="tags">
          {stock.tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      )}
      {expanded && (
        <div className="detail">
          <p className="muted">登録日: {stock.purchase_date || "—"}</p>
          <div className="button-row">
            <button onClick={() => setMode(mode === "edit" ? null : "edit")}>
              編集
            </button>
            <button
              className="secondary"
              onClick={() => setMode(mode === "consume" ? null : "consume")}
            >
              消費
            </button>
            <button
              className="danger"
              onClick={() => setMode(mode === "dispose" ? null : "dispose")}
            >
              廃棄
            </button>
          </div>

          {mode === "edit" && (
            <div className="inline-form">
              <h3>在庫を編集</h3>
              <label>
                食材名
                <input
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <div className="form-row">
                <label>
                  数量
                  <input
                    type="number"
                    min={1}
                    max={99999}
                    step={1}
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </label>
                <UnitInput value={unit} onChange={setUnit} />
              </div>
              <label>
                保管場所
                <select
                  value={storage}
                  onChange={(event) => setStorage(event.target.value)}
                >
                  <option value="">未設定</option>
                  {Object.entries(storageLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <button disabled={update.isPending} onClick={handleUpdateClick}>
                変更を保存
              </button>
              <ErrorMessage error={update.error} />
            </div>
          )}

          {mode === "consume" && (
            <div className="inline-form">
              <h3>消費する</h3>
              <label>
                消費量
                <input
                  type="number"
                  min={1}
                  max={stock.quantity}
                  step={1}
                  value={consumeQuantity}
                  onChange={(event) => setConsumeQuantity(event.target.value)}
                />
              </label>
              <p>
                残り:{" "}
                {Math.max(0, stock.quantity - Number(consumeQuantity || 0))}
                {stock.unit}
              </p>
              <button disabled={change.isPending} onClick={handleConsumeClick}>
                消費を確定
              </button>
              <ErrorMessage error={change.error} />
            </div>
          )}

          {mode === "dispose" && (
            <div className="inline-form">
              <h3>廃棄する</h3>
              <p>
                {stock.quantity}
                {stock.unit}をすべて廃棄します。
              </p>
              <button
                className="danger"
                disabled={change.isPending}
                onClick={handleDisposeClick}
              >
                全量廃棄を確定
              </button>
              <ErrorMessage error={change.error} />
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDanger={confirmDialog.isDanger}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() =>
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </article>
  );
}
