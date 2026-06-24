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
    await expect(page.getByRole("button", { name: /じっこう/ })).toBeEnabled({ timeout: 60000 });
    await page.getByRole("button", { name: /じっこう/ }).click();
    await saveScreenshot(page, "33-cooldown");
    await expect(page.getByRole("button", { name: /まってね/ })).toBeVisible();
    await page.waitForTimeout(3500);
    await expect(page.getByRole("button", { name: /じっこう/ })).toBeEnabled();
    await saveScreenshot(page, "34-cooldown-done");
  });

  test("ヒントのトグル表示が動作する", async ({ page }) => {
    await page.getByText("えんしゅうへ →").click();
    await page.waitForURL("**/unit/exercise**", { timeout: 5000 });
    // ヒントを表示
    await page.getByText("ヒントを　みる").click();
    await saveScreenshot(page, "35-hint-show");
    await expect(page.locator(".bg-amber-50")).toBeVisible();
    // ヒントを非表示
    await page.getByText("ヒントを　かくす").click();
    await saveScreenshot(page, "36-hint-hide");
    await expect(page.locator(".bg-amber-50")).not.toBeVisible();
  });

  test("不正解コードで「うーん」メッセージが出る", async ({ page }) => {
    await page.getByText("えんしゅうへ →").click();
    await page.waitForURL("**/unit/exercise**", { timeout: 5000 });
    await expect(page.getByRole("button", { name: /じっこう/ })).toBeEnabled({ timeout: 60000 });
    // 初期コード（name=""）は不正解
    await page.getByRole("button", { name: /じっこう/ }).click();
    await page.waitForTimeout(4000);
    await saveScreenshot(page, "37-incorrect");
    await expect(page.getByText("うーん、もう一度　ためしてみよう。")).toBeVisible();
  });

  test("正解コードでバッジアニメーションが表示される", async ({ page }) => {
    await page.getByText("えんしゅうへ →").click();
    await page.waitForURL("**/unit/exercise**", { timeout: 5000 });
    await page.waitForSelector(".monaco-editor", { timeout: 10000 });
    await expect(page.getByRole("button", { name: /じっこう/ })).toBeEnabled({ timeout: 60000 });

    // 単元1の正解コード（nameを設定して2箇所で使う）
    await page.evaluate(() => {
      const editor = (window as unknown as { monaco?: { editor?: { getEditors: () => Array<{ setValue: (v: string) => void }> } } }).monaco?.editor?.getEditors()[0];
      editor?.setValue('name = "ねこ"\nprint("こんにちは、" + name + "！")\nprint(name + "さん、いっしょに　Pythonを　まなぼう！")');
    });
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: /じっこう/ }).click();
    await expect(page.getByText("バッジを　てにいれた！")).toBeVisible({ timeout: 30000 });
    await saveScreenshot(page, "38-correct-badge");
  });
});

test.describe("学習フロー（ユニット2・複数問）", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    const learnerBtn = page.locator("button.rounded-2xl").first();
    await learnerBtn.click();
    await page.waitForURL("**/learner**", { timeout: 5000 });
    await page.getByText("すうじ・えんざん").click();
    await page.waitForURL("**/unit/explanation**", { timeout: 5000 });
    await page.getByText("えんしゅうへ →").click();
    await page.waitForURL("**/unit/exercise**", { timeout: 5000 });
  });

  test("問題数インジケーターが表示される（1/4）", async ({ page }) => {
    await saveScreenshot(page, "40-unit2-exercise-start");
    await expect(page.getByText("1 / 4")).toBeVisible();
    await expect(page.getByText("たし算")).toBeVisible();
  });

  test("たし算問題に正解すると次の問題へ進める", async ({ page }) => {
    await expect(page.getByRole("button", { name: /じっこう/ })).toBeEnabled({ timeout: 60000 });

    // たし算の正解コード
    await page.evaluate(() => {
      const editor = (window as unknown as { monaco?: { editor?: { getEditors: () => Array<{ setValue: (v: string) => void }> } } }).monaco?.editor?.getEditors()[0];
      editor?.setValue('hp = 50\nheal = 30\nhp = hp + heal\nprint("かいふく後のHP:", hp)');
    });
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /じっこう/ }).click();
    await page.waitForTimeout(5000);
    await saveScreenshot(page, "41-unit2-q1-correct");

    // 「つぎの　もんだいへ →」ボタンが出ることを確認
    await expect(page.getByText("つぎの　もんだいへ →")).toBeVisible({ timeout: 10000 });
    await page.getByText("つぎの　もんだいへ →").click();

    // 2問目に進んでいることを確認
    await expect(page.getByText("2 / 4")).toBeVisible();
    await saveScreenshot(page, "42-unit2-q2");
  });
});

test.describe("学習フロー（ユニット3・if文）", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    const learnerBtn = page.locator("button.rounded-2xl").first();
    await learnerBtn.click();
    await page.waitForURL("**/learner**", { timeout: 5000 });
    await page.getByText("if文").click();
    await page.waitForURL("**/unit/explanation**", { timeout: 5000 });
  });

  test("説明ページに比較演算子が表示される", async ({ page }) => {
    await saveScreenshot(page, "50-unit3-explanation");
    await expect(page.getByText(/==（おなじ）/)).toBeVisible();
    await expect(page.getByText(/!=（ちがう）/)).toBeVisible();
  });

  test("if/elif/else問題に正解するとバッジが表示される", async ({ page }) => {
    await page.getByText("えんしゅうへ →").click();
    await page.waitForURL("**/unit/exercise**", { timeout: 5000 });
    await page.waitForSelector(".monaco-editor", { timeout: 10000 });
    await expect(page.getByRole("button", { name: /じっこう/ })).toBeEnabled({ timeout: 60000 });

    // 問題1: if/else（>）の正解コード
    await page.evaluate(() => {
      const editor = (window as unknown as { monaco?: { editor?: { getEditors: () => Array<{ setValue: (v: string) => void }> } } }).monaco?.editor?.getEditors()[0];
      editor?.setValue('hp = 10\nif hp > 0:\n    print("かった！")\nelse:\n    print("まけた…")');
    });
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /じっこう/ }).click();
    await page.waitForTimeout(5000);
    await expect(page.getByText("つぎの　もんだいへ →")).toBeVisible({ timeout: 10000 });
    await page.getByText("つぎの　もんだいへ →").click();
    await saveScreenshot(page, "51-unit3-q1-done");

    // 問題2: ==の正解コード
    await expect(page.getByRole("button", { name: /じっこう/ })).toBeEnabled({ timeout: 60000 });
    await page.evaluate(() => {
      const editor = (window as unknown as { monaco?: { editor?: { getEditors: () => Array<{ setValue: (v: string) => void }> } } }).monaco?.editor?.getEditors()[0];
      editor?.setValue('item = "つるぎ"\nif item == "つるぎ":\n    print("ぶきを　そうびした！")\nelse:\n    print("そうびできない…")');
    });
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /じっこう/ }).click();
    await page.waitForTimeout(5000);
    await page.getByText("つぎの　もんだいへ →").click();

    // 問題3: !=の正解コード
    await expect(page.getByRole("button", { name: /じっこう/ })).toBeEnabled({ timeout: 60000 });
    await page.evaluate(() => {
      const editor = (window as unknown as { monaco?: { editor?: { getEditors: () => Array<{ setValue: (v: string) => void }> } } }).monaco?.editor?.getEditors()[0];
      editor?.setValue('name = "ねこ"\nif name != "":\n    print("こんにちは、" + name + "！")\nelse:\n    print("なまえが　ないよ…")');
    });
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /じっこう/ }).click();
    await page.waitForTimeout(5000);
    await page.getByText("つぎの　もんだいへ →").click();

    // 問題4: if/elif/elseの正解コード（最終問題）
    await expect(page.getByRole("button", { name: /じっこう/ })).toBeEnabled({ timeout: 60000 });
    await page.evaluate(() => {
      const editor = (window as unknown as { monaco?: { editor?: { getEditors: () => Array<{ setValue: (v: string) => void }> } } }).monaco?.editor?.getEditors()[0];
      editor?.setValue('hp = 50\nif hp >= 80:\n    print("げんき！")\nelif hp >= 30:\n    print("ピンチ！")\nelse:\n    print("まけた…")');
    });
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /じっこう/ }).click();
    await expect(page.getByText("バッジを　てにいれた！")).toBeVisible({ timeout: 30000 });
    await saveScreenshot(page, "52-unit3-complete");
  });
});
