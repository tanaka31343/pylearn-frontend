import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers";

test.describe("マイページ", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    const learnerBtn = page.locator("button.rounded-2xl").first();
    await learnerBtn.click();
    await page.waitForURL("**/learner**", { timeout: 5000 });
  });

  test("進捗バーが表示される", async ({ page }) => {
    await saveScreenshot(page, "20-mypage-progress");
    await expect(page.getByText("ぜんたいの　しんちょく")).toBeVisible();
  });

  test("バッジ一覧が表示される", async ({ page }) => {
    await saveScreenshot(page, "21-mypage-badges");
    await expect(page.getByText("とったバッジ")).toBeVisible();
    await expect(page.getByText("🐍 へんすう")).toBeVisible();
    await expect(page.getByText("🔢 えんざん")).toBeVisible();
    await expect(page.getByText("⚡ if文")).toBeVisible();
  });

  test("連続学習日数が表示される", async ({ page }) => {
    await saveScreenshot(page, "22-mypage-streak");
    await expect(page.getByText("れんぞく　がくしゅう　にっすう")).toBeVisible();
  });

  test("ユニット一覧が表示されクリックで説明ページへ遷移する", async ({ page }) => {
    await saveScreenshot(page, "23-mypage-units");
    await expect(page.getByText("print・へんすう")).toBeVisible();
    await page.getByText("print・へんすう").click();
    await page.waitForURL("**/unit/explanation**", { timeout: 5000 });
    await saveScreenshot(page, "24-explanation-page");
    await expect(page).toHaveURL(/unit\/explanation/);
  });
});
