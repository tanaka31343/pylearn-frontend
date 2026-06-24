import { test, expect } from "@playwright/test";
import { login, saveScreenshot, TEST_EMAIL, TEST_PASSWORD } from "./helpers";

test.describe("認証", () => {
  test("未ログイン状態で保護ページへ直接アクセスするとログインページへリダイレクトされる", async ({ page }) => {
    await page.goto("/select-learner");
    await page.waitForURL("**/login**", { timeout: 8000 });
    await saveScreenshot(page, "01-auth-redirect");
    await expect(page).toHaveURL(/login/);
  });

  test("ログイン成功 → こども選択ページへ遷移する", async ({ page }) => {
    await page.goto("/login");
    await saveScreenshot(page, "02-login-page");
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await saveScreenshot(page, "03-login-filled");
    await page.getByRole("button", { name: "ログイン" }).click();
    await page.waitForURL("**/select-learner**", { timeout: 10000 });
    await saveScreenshot(page, "04-login-success");
    await expect(page).toHaveURL(/select-learner/);
  });

  test("パスワード誤りでエラーメッセージが表示される", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.getByRole("button", { name: "ログイン" }).click();
    await page.waitForTimeout(3000);
    await saveScreenshot(page, "05-login-error");
    await expect(page).toHaveURL(/login/);
  });

  test("ログアウトするとログインページへ戻る", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "ログアウト" }).click();
    await page.waitForURL("**/login**", { timeout: 5000 });
    await saveScreenshot(page, "06-logout");
    await expect(page).toHaveURL(/login/);
  });
});
