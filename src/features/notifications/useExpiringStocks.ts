import { useMemo } from "react";
import type { Stock } from "../../shared/api";
import { tomorrowJst } from "../../shared/utils/date";

export function useExpiringStocks(stocks: Stock[] | undefined): Stock[] {
  const tomorrow = tomorrowJst();
  return useMemo(
    () => (stocks ?? []).filter((stock) => stock.expiration_date === tomorrow),
    [stocks, tomorrow],
  );
}
