import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Stock } from "../../shared/api";
import { operationKey } from "../../shared/utils/operationKey";
import { ErrorMessage, Loading } from "../../shared/components";
import { StockCard } from "./components/StockCard";
import { StockForm } from "./components/StockForm";

interface StocksPageProps {
  onNotice: (message: string) => void;
}

type FilterType = "all" | "fridge" | "freezer" | "room" | "unset" | "prepared";

const filterOptions: [FilterType, string][] = [
  ["all", "すべて"],
  ["fridge", "冷蔵"],
  ["freezer", "冷凍"],
  ["room", "常温"],
  ["unset", "未設定"],
  ["prepared", "作り置き惣菜"],
];

export function StocksPage({ onNotice }: StocksPageProps) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["stocks"], queryFn: api.stocks });
  const [filter, setFilter] = useState<FilterType>("all");

  const add = useMutation({
    mutationFn: (data: {
      display_name: string;
      quantity: number;
      unit: string;
      expiration_date: string;
      storage_type: Stock["storage_type"];
    }) => api.addStock(data, operationKey()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["stocks"] });
      onNotice("食材を在庫に追加しました。");
    },
  });

  const stocks = useMemo(
    () =>
      (query.data ?? []).filter((stock) => {
        if (filter === "all") return true;
        if (filter === "unset") return !stock.storage_type;
        if (filter === "prepared")
          return (
            stock.category === "作り置き惣菜" || stock.tags.includes("作り置き")
          );
        return stock.storage_type === filter;
      }),
    [query.data, filter],
  );

  return (
    <section>
      <p className="eyebrow">食材の状態をまとめて管理</p>
      <h1>食材ストック</h1>

      <div className="tabs filter-tabs">
        {filterOptions.map(([value, label]) => (
          <button
            key={value}
            className={filter === value ? "active" : ""}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <ErrorMessage error={query.error} />
      ) : stocks.length ? (
        <div className="cards">
          {stocks.map((stock) => (
            <StockCard key={stock.stock_id} stock={stock} onNotice={onNotice} />
          ))}
        </div>
      ) : (
        <p className="empty">該当する在庫はありません。</p>
      )}

      <StockForm
        onSubmit={(data) => add.mutate(data)}
        isPending={add.isPending}
        error={add.error}
      />
    </section>
  );
}
