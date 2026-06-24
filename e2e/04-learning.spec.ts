import { test, expect } from "@playwright/test";
import { login, saveScreenshot } from "./helpers";

test.describe("学習フロー（ユニット1）", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    const learnerBtn = page.locator("button.rounded-2xl").first();
    await learnerBtn.click();
    await page.waitForURL("**/learner**", { timeout: 5000 });
    await page.getByText("print・へんすう").click();
    await page.waitForURL("**/unit/explanation**", { timeout: 5000 });
  });

  test("説明ページが正しく表示される", async ({ page }) => {
    await saveScreenshot(page, "30-explanation-unit1");
    await expect(page.getByText("print・へんすう")).toBeVisible();
    await expect(page.getByText("せつめい")).toBeVisible();
    await expect(page.getByText("えんしゅうへ →")).toBeVisible();
  });

  test("演習ページへ遷移できる", async ({ page }) => {
    await page.getByText("えんしゅうへ →").click();
    await page.waitForURL("**/unit/exercise**", { timeout: 5000 });
    await saveScreenshot(page, "31-exercise-unit1");
    await expect(page).toHaveURL(/unit\/exercise/);
  });

  test("Monaco Editorが表示される", async ({ page }) => {
    await page.getByText("えんしゅうへ →").click();
    await page.waitForURL("**/unit/exercise**", { timeout: 5000 });
    await page.waitForSelector(".monaco-editor", { timeout: 10000 });
    await saveScreenshot(page, "32-monaco-editor");
    await expect(page.locator(".monaco-editor")).toBeVisible();
  });

  test("コード実行ボタンが表示され3秒クールダウンが動作する", async ({ page }) => {
    await page.getByText("えんしゅうへ →").click();
    await page.waitForURL("**/unit/exercise**", { timeout: 5000 });
    // Pyodideのロード完了を待つ（最大60秒）
    await expect(page.getByRole("button", { name: /じっこう/ })).toBeEnabled({ timeout: 60000 });
    await page.getByRole("button", { name: /じっこう/ }).click();
    await saveScreenshot(page, "33-cooldown");
    await expect(page.getByRole("button", { name: /まってね/ })).toBeVisible();
    await page.waitForTimeout(3500);
    await expect(page.getByRole("button", { name: /じっこう/ })).toBeEnabled();
    await saveScreenshot(page, "34-cooldown-done");
  });

  test("ヒントが最大3回表示される", async ({ page }) => {
    await page.getByText("えんしゅうへ →").click();
    await page.waitForURL("**/unit/exercise**", { timeout: 5000 });
    await page.getByText(/ヒントを　みる/).click();
    await saveScreenshot(page, "35-hint-1");
    await expect(page.locator(".bg-amber-50")).toBeVisible();
    await page.getByText(/ヒントを　みる/).click();
    await page.getByText(/ヒントを　みる/).click();
    await saveScreenshot(page, "36-hint-3");
    await expect(page.getByText(/ヒントを　みる/)).not.toBeVisible();
  });

  test("不正解コードで「うーん」メッセージが出る", async ({ page }) => {
    await page.getByText("えんしゅうへ →").click();
    await page.waitForURL("**/unit/exercise**", { timeout: 5000 });
    // Pyodideのロード完了を待つ（最大60秒）
    await expect(page.getByRole("button", { name: /じっこう/ })).toBeEnabled({ timeout: 60000 });
    await page.getByRole("button", { name: /じっこう/ }).click();
    // Pyodide実行完了を待つ
    await expect(page.getByRole("button", { name: /まってね|じっこう/ })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(4000);
    await saveScreenshot(page, "37-incorrect");
    await expect(page.getByText("うーん、もう一度　ためしてみよう。")).toBeVisible();
  });

  test("正解コードでバッジアニメーションが表示される", async ({ page }) => {
    await page.getByText("えんしゅうへ →").click();
    await page.waitForURL("**/unit/exercise**", { timeout: 5000 });
    await page.waitForSelector(".monaco-editor", { timeout: 10000 });
    // Pyodideのロード完了を待つ（最大60秒）
    await expect(page.getByRole("button", { name: /じっこう/ })).toBeEnabled({ timeout: 60000 });

    // Monaco EditorにAPI経由でコードを設定
    await page.evaluate(() => {
      const editor = (window as unknown as { monaco?: { editor?: { getEditors: () => Array<{ setValue: (v: string) => void }> } } }).monaco?.editor?.getEditors()[0];
      editor?.setValue('name = "たろう"\nprint("こんにちは、" + name)');
    });
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: /じっこう/ }).click();
    // Pyodide実行完了を待つ（最大30秒）
    await expect(page.getByText("バッジを　てにいれた！")).toBeVisible({ timeout: 30000 });
    await saveScreenshot(page, "38-correct-badge");
  });
});
