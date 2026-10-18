import { test, expect } from "@playwright/test";

test.describe("Pantry App E2E Flows", () => {
  test.beforeEach(async ({ page }) => {
    // Mock API routes to isolate from backend
    await page.route("**/api/pantry/stocks", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "success",
            stocks: [
              {
                stock_id: "STK0001",
                original_item_name: "豚バラ肉",
                display_name: "豚バラ肉",
                item_variant: "薄切り",
                item_key: "豚バラ肉|薄切り|weight",
                category: "肉類",
                quantity: 500,
                unit: "g",
                version: 1,
                storage_type: "freezer",
                expiration_date: "2026-10-25",
                purchase_date: "2026-10-10",
                parent_stock_id: "",
                tags: [],
                created_at: "2026-10-10T00:00:00Z",
              },
            ],
          }),
        });
      } else if (route.request().method() === "POST") {
        const body = JSON.parse(route.request().postData() || "{}");
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "success",
            stock: {
              stock_id: "STK0002",
              original_item_name: body.display_name,
              display_name: body.display_name,
              item_variant: "",
              item_key: `${body.display_name}||weight`,
              category: "その他",
              quantity: body.quantity,
              unit: body.unit,
              version: 1,
              storage_type: body.storage_type,
              expiration_date: body.expiration_date,
              purchase_date: "2026-10-13",
              parent_stock_id: "",
              tags: [],
              created_at: "2026-10-13T00:00:00Z",
            },
          }),
        });
      }
    });

    await page.route("**/api/pantry/menu-plans*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          menu_plans: [
            {
              plan_id: "PLN0001",
              date: "2026-10-13",
              meal_type: "dinner",
              meal_context: null,
              menu_name: "豚肉の生姜焼き",
              used_stocks: [],
              status: "planned",
              version: 1,
              status_changed_at: null,
              undo_expires_at: null,
            },
          ],
        }),
      });
    });

    await page.route("**/api/pantry/shopping-list", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          shopping_list: {
            week_start_date: "2026-10-11",
            revision: 1,
            updated_at: "2026-10-11T00:00:00Z",
            items: [
              {
                item_id: "SHP0001",
                name: "生姜",
                item_variant: "",
                item_key: "生姜||count",
                quantity: 1,
                unit: "個",
                is_purchased: false,
                needs_stock_confirmation: false,
                unmatched_stock_ids: [],
              },
            ],
          },
        }),
      });
    });
  });

  test("displays login page when unauthenticated", async ({ page }) => {
    await page.goto("/#/login");
    await expect(
      page.getByRole("heading", { name: "食材・献立サポート" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Googleでログイン" }),
    ).toBeVisible();
  });
});
