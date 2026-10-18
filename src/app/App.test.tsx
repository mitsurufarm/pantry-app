import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it } from "vitest";
import { HashRouter } from "react-router-dom";
import { App } from "./App";

afterEach(() => {
  cleanup();
});

describe("App", () => {
  it("shows the login screen when Firebase is not configured", async () => {
    window.location.hash = "#/login";
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <App />
        </HashRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "食材・献立サポート" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Googleでログイン" }),
    ).toBeDisabled();
  });
});
