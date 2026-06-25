"use client";
import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import GlobalNav from "@/components/GlobalNav";
import CharaSpeech from "@/components/CharaSpeech";
import apiClient from "@/lib/apiClient";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface ExerciseItem {
  question: string;
  initialCode: string;
  expectedHint: string;
  hint: string;
  validate: (stdout: string) => boolean;
}

const EXERCISES: Record<number, ExerciseItem[]> = {
  1: [
    {
      question: "なまえを　へんすうに　いれて、2つの　メッセージで　つかってみよう！　へんすうを　かえると　2か所　いっぺんに　かわるよ！",
      initialCode: `name = ""\nprint("こんにちは、" + name + "！")\nprint(name + "さん、いっしょに　Pythonを　まなぼう！")`,
      expectedHint: "こんにちは、〇〇！\n〇〇さん、いっしょに　Pythonを　まなぼう！",
      hint: "name = \"ねこ\" のように　なまえを　いれてみよう。name を　1か所　かえるだけで　2つの　メッセージが　かわるよ！",
      validate: (stdout) => {
        const lines = stdout.trim().split("\n");
        const line1ok = lines[0]?.startsWith("こんにちは、") && lines[0].length > "こんにちは、！".length;
        const line2ok = lines[1]?.includes("さん、");
        return line1ok && line2ok;
      },
    },
  ],
  2: [
    {
      question: "たし算：HPが　50　あるとき、かいふくポーションで　30　かいふくしよう！　のこりHPを　ひょうじしてね。",
      initialCode: `hp = 50\nheal = 30\n# たし算で　かいふく\nprint("かいふく後のHP:", hp)`,
      expectedHint: "かいふく後のHP: 80",
      hint: "hp = hp + heal と　かいて、HPに　healを　たしてみよう。",
      validate: (stdout) => stdout.trim().includes("80"),
    },
    {
      question: "ひき算：HP100　のキャラクターが　ダメージ30を　うけた！　のこりのHPを　ひょうじしよう。",
      initialCode: `hp = 100\ndamage = 30\n# ひき算で　ダメージ\nprint("のこりHP:", hp)`,
      expectedHint: "のこりHP: 70",
      hint: "hp = hp - damage と　かいて、HPから　damageを　ひこう。",
      validate: (stdout) => stdout.trim().includes("70"),
    },
    {
      question: "かけ算：こうげきりょくが　15　あるとき、クリティカルヒットで　2ばいのダメージに　なるよ！　ダメージを　ひょうじしよう。",
      initialCode: `attack = 15\nrate = 2\n# かけ算で　ダメージ\nprint("ダメージ:", attack)`,
      expectedHint: "ダメージ: 30",
      hint: "damage = attack * rate と　かいて、attackに　rateを　かけてみよう。",
      validate: (stdout) => stdout.trim().includes("30"),
    },
    {
      question: "わり算：スコアが　200　あるとき、2人で　わけると　1人ぶんは　いくつ？　ひょうじしてみよう。",
      initialCode: `score = 200\nplayers = 2\n# わり算で　わけると...\nprint("1人ぶん:", score)`,
      expectedHint: "1人ぶん: 100.0",
      hint: "share = score / players と　かいて、scoreを　playersで　わってみよう。",
      validate: (stdout) => stdout.trim().includes("100"),
    },
  ],
  3: [
    {
      question: "if / else（> をつかう）：hp が 0より　おおきいとき「かった！」、そうじゃないとき「まけた…」と　ひょうじしよう！",
      initialCode: `hp = 10\n# if文を　かいてみよう`,
      expectedHint: "かった！",
      hint: "if hp > 0: と　かいて、その下に　print(\"かった！\") と　かこう。さらに else: の下に　print(\"まけた…\") と　かこう。",
      validate: (stdout) => stdout.trim().includes("かった！"),
    },
    {
      question: "==（おなじ）をつかおう：item が \"つるぎ\" と　おなじなら「ぶきを　そうびした！」、ちがうなら「そうびできない…」と　ひょうじしよう。",
      initialCode: `item = "つるぎ"\n# == をつかって　くらべよう`,
      expectedHint: "ぶきを　そうびした！",
      hint: "if item == \"つるぎ\": と　かいて、その下に　print(\"ぶきを　そうびした！\") と　かこう。",
      validate: (stdout) => stdout.trim().includes("ぶきを　そうびした！"),
    },
    {
      question: "!=（ちがう）をつかおう：name が　空（\"\"）じゃないとき「こんにちは、〇〇！」、空のとき「なまえが　ないよ…」と　ひょうじしよう。name = \"ねこ\" で　ためしてね。",
      initialCode: `name = "ねこ"\n# != をつかって　じょうけんを　かこう\nif :\n    print("こんにちは、" + name + "！")\nelse:\n    print("なまえが　ないよ…")`,
      expectedHint: "こんにちは、ねこ！",
      hint: "if の　あとに　name != \"\" と　かこう。name が　からっぽじゃない　ときだけ　「こんにちは、」が　でるよ。",
      validate: (stdout) => {
        const line = stdout.trim().split("\n")[0] ?? "";
        return line.startsWith("こんにちは、") && line.endsWith("！") && line.length > "こんにちは、！".length;
      },
    },
    {
      question: "if / elif / else（>=をつかう）：hp が 80以上なら「げんき！」、30以上なら「ピンチ！」、それいがいは「まけた…」と　ひょうじしよう。hp = 50 で　ためしてね。",
      initialCode: `hp = 50\n# elif を　つかって　3つの　ばあいわけを　しよう`,
      expectedHint: "ピンチ！",
      hint: "if hp >= 80: のあとに elif hp >= 30: と　かこう。hp=50 は　80みまん・30いじょうなので　「ピンチ！」が　でるよ。",
      validate: (stdout) => stdout.trim().includes("ピンチ！"),
    },
  ],
  4: [
    {
      question: "str()をつかおう：score = 250 を　もじにして「スコア：250てん」と　ひょうじしよう。",
      initialCode: `score = 250\n# str() でかずをもじにして + でくっつけよう\nprint(score)`,
      expectedHint: "スコア：250てん",
      hint: "print(\"スコア：\" + str(score) + \"てん\") と　かこう。str(score) で　かずが　もじに　なるよ！",
      validate: (stdout) => stdout.trim() === "スコア：250てん",
    },
    {
      question: "str()で　じょうほうを　くみあわせよう：name = \"たろう\"、level = 5 をつかって「たろう　レベル：5」と　ひょうじしよう。",
      initialCode: `name = "たろう"\nlevel = 5\n# name と level を + でくっつけよう\nprint(name)`,
      expectedHint: "たろう　レベル：5",
      hint: "print(name + \"　レベル：\" + str(level)) と　かこう。level は　かず（int）なので　str() が　ひつようだよ。",
      validate: (stdout) => stdout.trim() === "たろう　レベル：5",
    },
    {
      question: "int()をつかおう：attack_str = \"30\" は　もじ（str）のかず。int() でほんとうのかずにして、damage = attack_str - 10 を　けいさんして　ひょうじしよう。",
      initialCode: `attack_str = "30"\n# int() でかずに　かえよう\ndamage = attack_str - 10\nprint("ダメージ：" + str(damage))`,
      expectedHint: "ダメージ：20",
      hint: "attack = int(attack_str) とかいて、damage = attack - 10 に　なおそう。もじのまま　ひき算は　できないよ。",
      validate: (stdout) => stdout.trim().includes("20"),
    },
  ],
  5: [
    {
      question: "リストを　つくって　さいしょの　てきを　ひょうじしよう！\nenemies = [\"スライム\", \"ゴブリン\", \"ドラゴン\"]\nえんしゅう：enemies[0] を　ひょうじしてね。",
      initialCode: `enemies = ["スライム", "ゴブリン", "ドラゴン"]\n# さいしょの　てきを　ひょうじしよう\nprint(enemies)`,
      expectedHint: "スライム",
      hint: "print(enemies[0]) と　かこう。インデックスは　0から　はじまるよ！",
      validate: (stdout) => stdout.trim() === "スライム",
    },
    {
      question: "リストの　2ばんめの　てきを　ひょうじしよう！\nenemies = [\"スライム\", \"ゴブリン\", \"ドラゴン\"]\nえんしゅう：2ばんめ（インデックス1）を　ひょうじしてね。",
      initialCode: `enemies = ["スライム", "ゴブリン", "ドラゴン"]\n# 2ばんめの　てきを　ひょうじしよう\nprint(enemies[0])`,
      expectedHint: "ゴブリン",
      hint: "print(enemies[1]) と　かこう。2ばんめは　インデックス1だよ！",
      validate: (stdout) => stdout.trim() === "ゴブリン",
    },
    {
      question: "append で　てきを　ついかして、len で　かずを　ひょうじしよう！\nenemies に「まおう」を　ついかして、ごうけいの　てきの　かずを　ひょうじしてね。",
      initialCode: `enemies = ["スライム", "ゴブリン", "ドラゴン"]\n# まおうを　ついかしよう\n\nprint("てきの　かず：" + str(len(enemies)))`,
      expectedHint: "てきの　かず：4",
      hint: "enemies.append(\"まおう\") と　かいて、まおうを　リストに　ついかしよう。len(enemies) で　かずが　わかるよ！",
      validate: (stdout) => stdout.trim().includes("4"),
    },
    {
      question: "リストの　さいごの　てきを　ひょうじしよう！\nenemies = [\"スライム\", \"ゴブリン\", \"ドラゴン\"]\nえんしゅう：さいごの　てき（インデックス2）を　ひょうじしてね。",
      initialCode: `enemies = ["スライム", "ゴブリン", "ドラゴン"]\n# さいごの　てきを　ひょうじしよう\nprint(enemies[0])`,
      expectedHint: "ドラゴン",
      hint: "print(enemies[2]) と　かこう。さいごは　インデックス2だよ（3こあるから0・1・2）！",
      validate: (stdout) => stdout.trim() === "ドラゴン",
    },
  ],
  6: [
    {
      question: "辞書から　なまえを　とりだして　ひょうじしよう！\nhero = {\"name\": \"たろう\", \"hp\": 100, \"attack\": 20}\nえんしゅう：hero[\"name\"] を　ひょうじしてね。",
      initialCode: `hero = {"name": "たろう", "hp": 100, "attack": 20}\n# なまえを　とりだして　ひょうじしよう\nprint(hero)`,
      expectedHint: "たろう",
      hint: "print(hero[\"name\"]) と　かこう。\" \" の　なかに　キーを　いれるよ！",
      validate: (stdout) => stdout.trim() === "たろう",
    },
    {
      question: "バトルで　ダメージを　うけた！HPを　こうしんしよう。\nhero[\"hp\"] を　35　へらして、のこりのHPを　ひょうじしてね。",
      initialCode: `hero = {"name": "たろう", "hp": 100, "attack": 20}\n# HPを　35　へらそう\n\nprint("のこりHP：" + str(hero["hp"]))`,
      expectedHint: "のこりHP：65",
      hint: "hero[\"hp\"] = hero[\"hp\"] - 35 と　かこう。",
      validate: (stdout) => stdout.trim().includes("65"),
    },
    {
      question: "辞書から　なまえと　HPを　両方　ひょうじしよう！\nhero の　name と　hp を　それぞれ　ひょうじしてね。",
      initialCode: `hero = {"name": "たろう", "hp": 100, "attack": 20}\n# なまえと　HPを　ひょうじしよう\nprint(hero["name"])`,
      expectedHint: "たろう\n100",
      hint: "print(hero[\"name\"]) のあとに print(hero[\"hp\"]) も　かこう。",
      validate: (stdout) => {
        const lines = stdout.trim().split("\n");
        return lines.some(l => l.includes("たろう")) && lines.some(l => l.includes("100"));
      },
    },
    {
      question: "辞書に　あたらしい　キーを　ついかしよう！\nhero に　level = 1 を　ついかして、ひょうじしてね。",
      initialCode: `hero = {"name": "たろう", "hp": 100}\n# level = 1 を　ついかしよう\n\nprint("レベル：" + str(hero["level"]))`,
      expectedHint: "レベル：1",
      hint: "hero[\"level\"] = 1 と　かいて、あたらしいキーを　ついかしよう！",
      validate: (stdout) => stdout.trim().includes("1"),
    },
  ],
  7: [
    {
      question: "for文で　リストの　てきを　ぜんぶ　ひょうじしよう！\nitems = [\"つるぎ\", \"たて\", \"ポーション\"]\nfor文をつかって　1こずつ　ひょうじしてね。",
      initialCode: `items = ["つるぎ", "たて", "ポーション"]\n# for文で　ぜんぶ　ひょうじしよう\n`,
      expectedHint: "つるぎ\nたて\nポーション",
      hint: "for item in items: と　かいて、その下に　print(item) と　かこう。インデントを　わすれずに！",
      validate: (stdout) => {
        const lines = stdout.trim().split("\n");
        return lines.some(l => l.includes("つるぎ")) && lines.some(l => l.includes("たて")) && lines.some(l => l.includes("ポーション"));
      },
    },
    {
      question: "range() で　1〜3の　かずを　ひょうじしよう！\nfor i in range(3): で　0・1・2 が　でるよ。\n「こうげき 1かいめ！」「こうげき 2かいめ！」「こうげき 3かいめ！」と　ひょうじしてね。",
      initialCode: `# range(3) は　0, 1, 2 の　じゅんに　くりかえすよ\nfor i in range(3):\n    print("こうげき " + str(i) + "かいめ！")`,
      expectedHint: "こうげき 1かいめ！\nこうげき 2かいめ！\nこうげき 3かいめ！",
      hint: "str(i + 1) と　かくと　1・2・3に　なるよ！",
      validate: (stdout) => {
        const lines = stdout.trim().split("\n");
        return lines.some(l => l.includes("1かいめ")) && lines.some(l => l.includes("3かいめ"));
      },
    },
    {
      question: "while文で　HPが　0に　なるまで　くりかえそう！\nhp = 30 から　まいかい　10ずつ　へって、のこりHPを　ひょうじしてね。",
      initialCode: `hp = 30\n# while文で　くりかえそう\nwhile hp > 0:\n    hp = hp - 10\n    print("のこりHP：" + str(hp))`,
      expectedHint: "のこりHP：20\nのこりHP：10\nのこりHP：0",
      hint: "このコードは　もう　かかれているよ！じっこうして　かくにんしてみよう。",
      validate: (stdout) => stdout.trim().includes("のこりHP：0"),
    },
    {
      question: "break で　ループを　とちゅうで　やめよう！\n0から　かぞえて、3に　なったら　break で　ストップ。\n0・1・2 だけ　ひょうじしてね。",
      initialCode: `for i in range(10):\n    # i が 3 に　なったら　やめる\n    if i == 3:\n        break\n    print(i)`,
      expectedHint: "0\n1\n2",
      hint: "このコードを　そのまま　じっこうしてみよう！break で　i=3 の　まえに　とまるよ。",
      validate: (stdout) => {
        const lines = stdout.trim().split("\n");
        return lines.includes("0") && lines.includes("2") && !lines.includes("3");
      },
    },
  ],
  8: [
    {
      question: "かんすうを　つくって　よびだそう！\ngreet() という　かんすうを　つくって「こんにちは！」と　ひょうじしてね。",
      initialCode: `# greet かんすうを　つくろう\ndef greet():\n    print("")\n\n# よびだす\ngreet()`,
      expectedHint: "こんにちは！",
      hint: "print(\"こんにちは！\") と　かこう。かんすうを　よびだすには　greet() と　かく。",
      validate: (stdout) => stdout.trim() === "こんにちは！",
    },
    {
      question: "ひきすう（引数）あり　かんすうを　つくろう！\ngreet(name) という　かんすうで「こんにちは、たろう！」と　ひょうじしてね。",
      initialCode: `def greet(name):\n    # name をつかって　あいさつしよう\n    print("")\n\ngreet("たろう")`,
      expectedHint: "こんにちは、たろう！",
      hint: "print(\"こんにちは、\" + name + \"！\") と　かこう。name に　よびだしの　ときの　もじが　はいるよ！",
      validate: (stdout) => stdout.trim() === "こんにちは、たろう！",
    },
    {
      question: "もどりち（return）あり　かんすうを　つくろう！\nadd(a, b) という　かんすうで　a + b の　けっかを　もどして、10 + 20 の　けっかを　ひょうじしてね。",
      initialCode: `def add(a, b):\n    # a + b を　もどそう\n    return 0\n\nresult = add(10, 20)\nprint("こたえ：" + str(result))`,
      expectedHint: "こたえ：30",
      hint: "return a + b と　かこう。return で　けっかを　かえすと、result に　はいるよ！",
      validate: (stdout) => stdout.trim().includes("30"),
    },
  ],
  9: [
    {
      question: "import random をつかって、さいころを　ふろう！\nrandom.randint(1, 6) で　1〜6の　かずを　だして「さいころ：〇」と　ひょうじしてね。",
      initialCode: `import random\n# randint で　1〜6の　かずを　だそう\ndice = random.randint(1, 6)\nprint("さいころ：" + str(dice))`,
      expectedHint: "さいころ：3（1〜6の　どれかが　でるよ）",
      hint: "このコードを　そのまま　じっこうしてみよう！じっこうするたびに　ちがう　かずが　でるよ。",
      validate: (stdout) => stdout.trim().startsWith("さいころ："),
    },
    {
      question: "random.choice で　リストから　ランダムに　えらぼう！\nenemies = [\"スライム\", \"ゴブリン\", \"ドラゴン\"] から　1ひき　えらんで「エンカウント：〇〇」と　ひょうじしてね。",
      initialCode: `import random\nenemies = ["スライム", "ゴブリン", "ドラゴン"]\n# choice で　1ひき　えらぼう\nenemy = random.choice(enemies)\nprint("エンカウント：" + enemy)`,
      expectedHint: "エンカウント：スライム（ランダムに　かわるよ）",
      hint: "このコードを　そのまま　じっこうしてみよう！じっこうするたびに　ちがう　てきが　でるよ。",
      validate: (stdout) => {
        const t = stdout.trim();
        return t.startsWith("エンカウント：") && ["スライム", "ゴブリン", "ドラゴン"].some(e => t.includes(e));
      },
    },
    {
      question: "random.randint で　ダメージに　ブレを　だそう！\ndamage = random.randint(10, 20) で　ランダムなダメージを　だして「ダメージ：〇〇」と　ひょうじしてね。",
      initialCode: `import random\n# ランダムな　ダメージを　だそう\ndamage = random.randint(10, 20)\nprint("ダメージ：" + str(damage))`,
      expectedHint: "ダメージ：15（10〜20の　どれかが　でるよ）",
      hint: "このコードを　そのまま　じっこうしてみよう！10〜20の　ランダムな　ダメージが　でるよ。",
      validate: (stdout) => stdout.trim().startsWith("ダメージ："),
    },
  ],
};

const UNIT_BADGE: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "🐍", label: "「へんすう　マスター」" },
  2: { emoji: "🔢", label: "「えんざん　マスター」" },
  3: { emoji: "⚡", label: "「if文　マスター」" },
  4: { emoji: "🔄", label: "「データ型　マスター」" },
  5: { emoji: "📋", label: "「リスト　マスター」" },
  6: { emoji: "📖", label: "「辞書　マスター」" },
  7: { emoji: "🔁", label: "「ループ　マスター」" },
  8: { emoji: "🔧", label: "「かんすう　マスター」" },
  9: { emoji: "🎲", label: "「ランダム　マスター」" },
};

function ExercisePageInner() {
  useRequireAuth();
  const searchParams = useSearchParams();
  const unitId = searchParams.get("unitId");
  const learnerId = searchParams.get("learnerId");
  const router = useRouter();

  const uid = Number(unitId);
  const exercises = EXERCISES[uid] ?? [];

  const [exIndex, setExIndex] = useState(0);
  const ex = exercises[exIndex];

  const [code, setCode] = useState(ex?.initialCode ?? "");
  const [output, setOutput] = useState("");
  const [stderr, setStderr] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isIncorrect, setIsIncorrect] = useState(false);
  const [running, setRunning] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  const runCode = useCallback(async (code: string) => {
    const res = await apiClient.post("/execute", { code });
    return {
      stdout: (res.data.stdout ?? "") as string,
      stderr: (res.data.stderr ?? "") as string,
      exitCode: (res.data.exit_code ?? 0) as number,
    };
  }, []);

  const startCooldown = useCallback(() => {
    setCooldown(3);
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const goNextExercise = () => {
    const next = exIndex + 1;
    setExIndex(next);
    setCode(exercises[next].initialCode);
    setOutput("");
    setStderr("");
    setIsCorrect(false);
    setIsIncorrect(false);
    setShowHint(false);
  };

  const handleRun = async () => {
    if (cooldown > 0 || running) return;
    setRunning(true);
    setOutput("");
    setStderr("");
    setIsCorrect(false);
    setIsIncorrect(false);
    startCooldown();

    try {
      const res = await runCode(code);
      const stdout = res.stdout.trim();
      const stderr = res.stderr.trim();
      setOutput(stdout);
      setStderr(stderr);

      if (res.exitCode === 0 && ex.validate(stdout)) {
        setIsCorrect(true);
        if (exIndex === exercises.length - 1) {
          if (learnerId) {
            await apiClient.post(`/progress/${learnerId}`, { unit_id: uid, step: "exercise" });
            await apiClient.post(`/badges/${learnerId}`, { badge_type: `unit_${uid}_complete` });
            await apiClient.post(`/learning-logs/${learnerId}`);
          }
          setShowBadge(true);
        }
      } else {
        setIsIncorrect(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "エラーが　おきました";
      setStderr(message);
    } finally {
      setRunning(false);
    }
  };

  if (!ex) return null;

  const runButtonDisabled = cooldown > 0 || running;
  const badge = UNIT_BADGE[uid];
  const total = exercises.length;

  if (showBadge) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center max-w-sm w-full">
          <div className="text-7xl mb-5 animate-bounce">{badge?.emoji}</div>
          <p className="text-xs text-gray-400 mb-2">やったー！</p>
          <p className="text-xl font-medium text-gray-800 mb-1">{badge?.label}</p>
          <p className="text-sm text-purple-600 font-medium mb-6">バッジを　てにいれた！</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push(`/learner?id=${learnerId}`)}
              className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              マイページに　もどる
            </button>
            {uid < 9 && (
              <button
                onClick={() => router.push(`/unit/explanation?unitId=${uid + 1}&learnerId=${learnerId}`)}
                className="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium"
              >
                つぎの　たんげんへ
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <GlobalNav
        subtitle={`だいたんげん${uid}　えんしゅう`}
        showBack
        backLabel="← せつめいに　もどる"
        backHref={`/unit/explanation?unitId=${unitId}&learnerId=${learnerId}`}
      />

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 52px)" }}>
        {/* problem panel */}
        <div className="w-72 border-r border-gray-200 p-5 overflow-y-auto bg-white flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-800">もんだい</p>
            {total > 1 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {exIndex + 1} / {total}
              </span>
            )}
          </div>

          {total > 1 && (
            <div className="flex gap-1 mb-4">
              {exercises.map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full ${i < exIndex ? "bg-green-400" : i === exIndex ? "bg-purple-400" : "bg-gray-200"}`}
                />
              ))}
            </div>
          )}

          <CharaSpeech
            text={ex.question}
            charaType={isCorrect ? "correct" : isIncorrect ? "incorrect" : "normal"}
          />

          <div className="bg-gray-50 rounded-xl p-3 text-xs font-mono text-gray-700 mb-4">
            <p className="text-gray-400 mb-1">きたいされる　けっか：</p>
            <p className="text-purple-600 whitespace-pre-line">{ex.expectedHint}</p>
          </div>

          {showHint && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 mb-3 leading-relaxed">
              💡 {ex.hint}
            </div>
          )}

          {!isCorrect && (
            <button
              onClick={() => setShowHint((v) => !v)}
              className="text-xs text-purple-500 hover:text-purple-700"
            >
              {showHint ? "ヒントを　かくす" : "ヒントを　みる"}
            </button>
          )}
        </div>

        {/* editor panel */}
        <div className="flex-1 flex flex-col p-5 overflow-hidden">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">コードを　かいてみよう</p>
          <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 mb-3">
            <MonacoEditor
              language="python"
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v ?? "")}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRun}
              disabled={runButtonDisabled}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${runButtonDisabled ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-purple-500 hover:bg-purple-600 text-white"}`}
            >
              ▶ {running ? "じっこうちゅう..." : cooldown > 0 ? `まってね... (${cooldown}びょう)` : "じっこう"}
            </button>
          </div>
        </div>

        {/* output panel */}
        <div className="w-64 border-l border-gray-200 p-5 bg-white flex-shrink-0 flex flex-col">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">こうさく　けっか</p>
          <div className="bg-gray-50 rounded-xl p-3 font-mono text-sm text-gray-800 flex-1 mb-3 min-h-0 overflow-y-auto">
            {output || <span className="text-gray-300">じっこうすると　ここに　でるよ</span>}
          </div>

          {stderr && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 mb-3 font-mono whitespace-pre-line">
              {stderr}
            </div>
          )}

          {isCorrect && exIndex < exercises.length - 1 && (
            <div className="flex flex-col gap-2">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium">
                ✅ せいかい！
              </div>
              <button
                onClick={goNextExercise}
                className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium"
              >
                つぎの　もんだいへ →
              </button>
            </div>
          )}
          {isCorrect && exIndex === exercises.length - 1 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium">
              ✅ せいかい！　すごいね！
            </div>
          )}
          {isIncorrect && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
              うーん、もう一度　ためしてみよう。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExercisePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-sm text-gray-400">よみこみちゅう...</p></div>}>
      <ExercisePageInner />
    </Suspense>
  );
}
