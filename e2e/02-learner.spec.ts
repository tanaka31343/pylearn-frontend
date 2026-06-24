import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers";

test.describe("学習者管理", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("学習者選択ページが表示される", async ({ page }) => {
    await saveScreenshot(page, "10-select-learner");
    await expect(page.getByText("だれで　あそぶ？")).toBeVisible();
  });

  test("学習者を追加できる", async ({ page }) => {
    await page.getByText("ついか").click();
    await saveScreenshot(page, "11-add-learner-form");
    await expect(page.getByPlaceholder("たろう")).toBeVisible();
    await page.getByPlaceholder("たろう").fill("テストくん");
    await saveScreenshot(page, "12-add-learner-filled");
    await page.getByRole("button", { name: "ついか" }).last().click();
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "13-add-learner-done");
    await expect(page.getByText("テストくん").first()).toBeVisible();
  });

  test("学習者を選択するとマイページへ遷移する", async ({ page }) => {
    const learnerBtn = page.locator("button.rounded-2xl").first();
    await learnerBtn.click();
    await page.waitForURL("**/learner**", { timeout: 5000 });
    await saveScreenshot(page, "14-mypage");
    await expect(page).toHaveURL(/learner/);
  });
});
