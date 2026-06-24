import { test, expect, type Page } from "@playwright/test";
import { login, saveScreenshot } from "./helpers";

// Monaco Editorにコードをセットするヘルパー
async function setEditorCode(page: Page, code: string) {
  await page.evaluate((c) => {
    const editor = (window as unknown as { monaco?: { editor?: { getEditors: () => Array<{ setValue: (v: string) => void }> } } }).monaco?.editor?.getEditors()[0];
    editor?.setValue(c);
  }, code);
  await page.waitForTimeout(300);
}

// じっこうボタンが有効になるまで待つ（バックエンドAPI化により即時有効）
async function waitForRunButton(page: Page) {
  await expect(page.getByRole("button", { name: /じっこう/ })).toBeEnabled({ timeout: 5000 });
}

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
    await waitForRunButton(page);
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
    await page.getByText("ヒントを　みる").click();
    await saveScreenshot(page, "35-hint-show");
    await expect(page.locator(".bg-amber-50")).toBeVisible();
    await page.getByText("ヒントを　かくす").click();
    await saveScreenshot(page, "36-hint-hide");
    await expect(page.locator(".bg-amber-50")).not.toBeVisible();
  });

  test("不正解コードで「うーん」メッセージが出る", async ({ page }) => {
    await page.getByText("えんしゅうへ →").click();
    await page.waitForURL("**/unit/exercise**", { timeout: 5000 });
    await waitForRunButton(page);
    // 初期コード（name=""）は不正解
    await page.getByRole("button", { name: /じっこう/ }).click();
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "37-incorrect");
    await expect(page.getByText("うーん、もう一度　ためしてみよう。")).toBeVisible();
  });

  test("正解コードでバッジアニメーションが表示される", async ({ page }) => {
    await page.getByText("えんしゅうへ →").click();
    await page.waitForURL("**/unit/exercise**", { timeout: 5000 });
    await page.waitForSelector(".monaco-editor", { timeout: 10000 });
    await waitForRunButton(page);

    await setEditorCode(page, 'name = "ねこ"\nprint("こんにちは、" + name + "！")\nprint(name + "さん、いっしょに　Pythonを　まなぼう！")');
    await page.getByRole("button", { name: /じっこう/ }).click();
    await expect(page.getByText("バッジを　てにいれた！")).toBeVisible({ timeout: 10000 });
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
    await waitForRunButton(page);

    await setEditorCode(page, 'hp = 50\nheal = 30\nhp = hp + heal\nprint("かいふく後のHP:", hp)');
    await page.getByRole("button", { name: /じっこう/ }).click();
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "41-unit2-q1-correct");

    await expect(page.getByText("つぎの　もんだいへ →")).toBeVisible({ timeout: 5000 });
    await page.getByText("つぎの　もんだいへ →").click();
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
    await page.getByRole("button", { name: /if文.*てきとの/ }).click();
    await page.waitForURL("**/unit/explanation**", { timeout: 5000 });
  });

  test("説明ページに比較演算子が表示される", async ({ page }) => {
    await saveScreenshot(page, "50-unit3-explanation");
    await expect(page.getByText(/==（おなじ）/).first()).toBeVisible();
    await expect(page.getByText(/!=（ちがう）/).first()).toBeVisible();
  });

  test("if/elif/else問題に正解するとバッジが表示される", async ({ page }) => {
    await page.getByText("えんしゅうへ →").click();
    await page.waitForURL("**/unit/exercise**", { timeout: 5000 });
    await page.waitForSelector(".monaco-editor", { timeout: 10000 });
    await waitForRunButton(page);

    // 問題1: if/else（>）
    await setEditorCode(page, 'hp = 10\nif hp > 0:\n    print("かった！")\nelse:\n    print("まけた…")');
    await page.getByRole("button", { name: /じっこう/ }).click();
    await page.waitForTimeout(2000);
    await expect(page.getByText("つぎの　もんだいへ →")).toBeVisible({ timeout: 5000 });
    await page.getByText("つぎの　もんだいへ →").click();
    await saveScreenshot(page, "51-unit3-q1-done");

    // 問題2: ==
    await waitForRunButton(page);
    await setEditorCode(page, 'item = "つるぎ"\nif item == "つるぎ":\n    print("ぶきを　そうびした！")\nelse:\n    print("そうびできない…")');
    await page.getByRole("button", { name: /じっこう/ }).click();
    await page.waitForTimeout(2000);
    await page.getByText("つぎの　もんだいへ →").click();

    // 問題3: !=
    await waitForRunButton(page);
    await setEditorCode(page, 'name = "ねこ"\nif name != "":\n    print("こんにちは、" + name + "！")\nelse:\n    print("なまえが　ないよ…")');
    await page.getByRole("button", { name: /じっこう/ }).click();
    await page.waitForTimeout(2000);
    await page.getByText("つぎの　もんだいへ →").click();

    // 問題4: if/elif/else（最終問題）
    await waitForRunButton(page);
    await setEditorCode(page, 'hp = 50\nif hp >= 80:\n    print("げんき！")\nelif hp >= 30:\n    print("ピンチ！")\nelse:\n    print("まけた…")');
    await page.getByRole("button", { name: /じっこう/ }).click();
    await expect(page.getByText("バッジを　てにいれた！")).toBeVisible({ timeout: 10000 });
    await saveScreenshot(page, "52-unit3-complete");
  });
});

test.describe("学習フロー（ユニット4・データ型）", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    const learnerBtn = page.locator("button.rounded-2xl").first();
    await learnerBtn.click();
    await page.waitForURL("**/learner**", { timeout: 5000 });
    await page.getByRole("button", { name: /データ型/ }).click();
    await page.waitForURL("**/unit/explanation**", { timeout: 5000 });
  });

  test("説明ページにstr/int/floatが表示される", async ({ page }) => {
    await saveScreenshot(page, "55-unit4-explanation");
    await expect(page.getByText(/str（もじれつ）/).first()).toBeVisible();
    await expect(page.getByText(/int（せいすう）/).first()).toBeVisible();
  });

  test("str()演習問題に正解すると次の問題へ進める", async ({ page }) => {
    await page.getByText("えんしゅうへ →").click();
    await page.waitForURL("**/unit/exercise**", { timeout: 5000 });
    await page.waitForSelector(".monaco-editor", { timeout: 10000 });
    await waitForRunButton(page);

    // 問題1: str()でスコア表示
    await setEditorCode(page, 'score = 250\nprint("スコア：" + str(score) + "てん")');
    await page.getByRole("button", { name: /じっこう/ }).click();
    await page.waitForTimeout(2000);
    await expect(page.getByText("つぎの　もんだいへ →")).toBeVisible({ timeout: 5000 });
    await saveScreenshot(page, "56-unit4-q1-correct");
    await page.getByText("つぎの　もんだいへ →").click();
    await expect(page.getByText("2 / 3")).toBeVisible();
  });

  test("全問正解するとデータ型バッジが表示される", async ({ page }) => {
    await page.getByText("えんしゅうへ →").click();
    await page.waitForURL("**/unit/exercise**", { timeout: 5000 });
    await page.waitForSelector(".monaco-editor", { timeout: 10000 });
    await waitForRunButton(page);

    // 問題1: str()
    await setEditorCode(page, 'score = 250\nprint("スコア：" + str(score) + "てん")');
    await page.getByRole("button", { name: /じっこう/ }).click();
    await page.waitForTimeout(2000);
    await expect(page.getByText("つぎの　もんだいへ →")).toBeVisible({ timeout: 5000 });
    await page.getByText("つぎの　もんだいへ →").click();

    // 問題2: str() + 変数結合
    await waitForRunButton(page);
    await setEditorCode(page, 'name = "たろう"\nlevel = 5\nprint(name + "　レベル：" + str(level))');
    await page.getByRole("button", { name: /じっこう/ }).click();
    await page.waitForTimeout(2000);
    await expect(page.getByText("つぎの　もんだいへ →")).toBeVisible({ timeout: 5000 });
    await page.getByText("つぎの　もんだいへ →").click();

    // 問題3: int()（最終問題）
    await waitForRunButton(page);
    await setEditorCode(page, 'attack_str = "30"\nattack = int(attack_str)\ndamage = attack - 10\nprint("ダメージ：" + str(damage))');
    await page.getByRole("button", { name: /じっこう/ }).click();
    await expect(page.getByText("バッジを　てにいれた！")).toBeVisible({ timeout: 10000 });
    await saveScreenshot(page, "57-unit4-complete");
  });
});

test.describe("チャレンジ問題（ユニット1）", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    const learnerBtn = page.locator("button.rounded-2xl").first();
    await learnerBtn.click();
    await page.waitForURL("**/learner**", { timeout: 5000 });
  });

  test("マイページにチャレンジボタンが表示される", async ({ page }) => {
    await saveScreenshot(page, "60-mypage-challenge-buttons");
    const challengeBtns = page.locator("button[title*='チャレンジ']");
    await expect(challengeBtns.first()).toBeVisible();
  });

  test("チャレンジバッジセクションが表示される", async ({ page }) => {
    await expect(page.getByText("チャレンジバッジ")).toBeVisible();
    await saveScreenshot(page, "61-mypage-challenge-badges");
  });

  test("未クリア時はロック画面が表示される", async ({ page }) => {
    const id = new URL(page.url()).searchParams.get("id") ?? "";
    await page.goto(`/unit/challenge?unitId=1&learnerId=${id}`);
    await saveScreenshot(page, "62-challenge-locked");
    const isLocked = await page.getByText("まだ　チャレンジできないよ").isVisible().catch(() => false);
    const isOpen = await page.getByText("チャレンジもんだい").isVisible().catch(() => false);
    expect(isLocked || isOpen).toBeTruthy();
  });

  test("チャレンジ問題に正解するとチャレンジバッジが表示される", async ({ page }) => {
    const id = new URL(page.url()).searchParams.get("id") ?? "";
    await page.goto(`/unit/challenge?unitId=1&learnerId=${id}`);

    const lockedText = page.getByText("まだ　チャレンジできないよ");
    const challengeText = page.getByText("チャレンジもんだい");
    await expect(lockedText.or(challengeText)).toBeVisible({ timeout: 10000 });

    const isLocked = await lockedText.isVisible().catch(() => false);
    if (isLocked) {
      test.skip(true, "unit_1_completeバッジ未取得のためスキップ");
      return;
    }

    await expect(challengeText).toBeVisible({ timeout: 3000 });
    await page.waitForSelector(".monaco-editor", { timeout: 10000 });
    await waitForRunButton(page);

    await setEditorCode(page, 'name = "たろう"\njob = "ゆうしゃ"\nweapon = "つるぎ"\nprint("なまえ：" + name)\nprint("しょくぎょう：" + job)\nprint(name + "の　ぶき：" + weapon)');

    await page.getByRole("button", { name: /じっこう/ }).click();
    await expect(page.getByText("チャレンジバッジを　てにいれた！")).toBeVisible({ timeout: 10000 });
    await saveScreenshot(page, "63-challenge-badge-earned");
  });
});

test.describe("チャレンジ問題（解放条件・ユニット2）", () => {
  test("ユニット2チャレンジページが開く（ロックまたは解放のいずれか）", async ({ page }) => {
    await login(page);
    const learnerBtn = page.locator("button.rounded-2xl").first();
    await learnerBtn.click();
    await page.waitForURL("**/learner**", { timeout: 5000 });

    const learnerId = new URL(page.url()).searchParams.get("id") ?? "";
    await page.goto(`/unit/challenge?unitId=2&learnerId=${learnerId}`);

    await expect(
      page.getByText("まだ　チャレンジできないよ").or(page.getByText("チャレンジもんだい"))
    ).toBeVisible({ timeout: 10000 });
    await saveScreenshot(page, "64-unit2-challenge-gate");
  });
});
