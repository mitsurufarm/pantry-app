import { Navigate, Route, Routes } from "react-router-dom";
import { MenuPage } from "../../features/menu/MenuPage";
import { StocksPage } from "../../features/stocks/StocksPage";
import { ShoppingListPage } from "../../features/shopping-list/ShoppingListPage";
import { AssistantPage } from "../../features/assistant/AssistantPage";
import { SettingsPage } from "../../features/settings/SettingsPage";
import { MorePage } from "../../features/more/MorePage";

interface AppRoutesProps {
  onNotice: (message: string) => void;
}

export function AppRoutes({ onNotice }: AppRoutesProps) {
  return (
    <Routes>
      <Route path="/" element={<MenuPage onNotice={onNotice} />} />
      <Route path="/stocks" element={<StocksPage onNotice={onNotice} />} />
      <Route
        path="/shopping-list"
        element={<ShoppingListPage onNotice={onNotice} />}
      />
      <Route
        path="/assistant"
        element={<AssistantPage onNotice={onNotice} />}
      />
      <Route path="/settings" element={<SettingsPage onNotice={onNotice} />} />
      <Route path="/more" element={<MorePage onNotice={onNotice} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
