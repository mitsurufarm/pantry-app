import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../shared/api";
import { operationKey } from "../../shared/utils/operationKey";
import { ErrorMessage, Loading } from "../../shared/components";
import { ShoppingRow } from "./components/ShoppingRow";

interface ShoppingListPageProps {
  onNotice: (message: string) => void;
}

export function ShoppingListPage({ onNotice }: ShoppingListPageProps) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["shopping"], queryFn: api.shopping });

  const toggle = useMutation({
    mutationFn: ({
      id,
      value,
      key,
    }: {
      id: string;
      value: boolean;
      key: string;
    }) => api.setPurchased(id, value, key),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["shopping"] });
      onNotice("購入状況を更新しました。在庫は変更されていません。");
    },
  });

  const items = query.data?.items ?? [];
  const openItems = items.filter((item) => !item.is_purchased);
  const purchasedItems = items.filter((item) => item.is_purchased);

  return (
    <section>
      <p className="eyebrow">買ったものをチェック</p>
      <h1>買い物リスト</h1>

      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <ErrorMessage error={query.error} />
      ) : !query.data || items.length === 0 ? (
        <p className="empty">追加で購入するものはありません。</p>
      ) : (
        <>
          <p className="muted">{query.data.week_start_date}週のリスト</p>
          {openItems.length > 0 && (
            <>
              <h2>未購入（{openItems.length}）</h2>
              {openItems.map((item) => (
                <ShoppingRow
                  key={item.item_id}
                  item={item}
                  onToggle={(value) =>
                    toggle.mutate({
                      id: item.item_id,
                      value,
                      key: operationKey(),
                    })
                  }
                />
              ))}
            </>
          )}
          {purchasedItems.length > 0 && (
            <>
              <h2>購入済み（{purchasedItems.length}）</h2>
              {purchasedItems.map((item) => (
                <ShoppingRow
                  key={item.item_id}
                  item={item}
                  onToggle={(value) =>
                    toggle.mutate({
                      id: item.item_id,
                      value,
                      key: operationKey(),
                    })
                  }
                />
              ))}
            </>
          )}
          {items.some((item) => item.needs_stock_confirmation) && (
            <p className="warning-note">
              単位換算できない在庫が含まれる食材があります。必要量と在庫を確認してください。
            </p>
          )}
          <p className="privacy-note">
            購入済みにしても在庫は増えません。在庫登録は「在庫」画面から行ってください。
          </p>
        </>
      )}

      <ErrorMessage error={toggle.error} />
      {toggle.isPending && <Loading label="購入状況を保存しています…" />}
    </section>
  );
}
