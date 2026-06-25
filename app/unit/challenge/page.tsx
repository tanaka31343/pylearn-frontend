"use client";
import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import GlobalNav from "@/components/GlobalNav";
import CharaSpeech from "@/components/CharaSpeech";
import apiClient from "@/lib/apiClient";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface ChallengeItem {
  question: string;
  initialCode: string;
  expectedHint: string;
  hint: string;
  validate: (stdout: string) => boolean;
}

const CHALLENGES: Record<number, ChallengeItem> = {
  1: {
    question:
      "【チャレンジ】ゆうしゃの　しょうかいカードを　つくろう！\n\n3つの　へんすうに　すきな　なまえを　いれよう。\n　name（なまえ）\n　job（しょくぎょう）\n　weapon（ぶき）\n\nひょうじする　3こう：\n・なまえ：〇〇\n・しょくぎょう：〇〇\n・〇〇の　ぶき：〇〇",
    initialCode:
      `name = ""\njob = ""\nweapon = ""\nprint("なまえ：" + name)\nprint("しょくぎょう：" + job)\nprint(name + "の　ぶき：" + weapon)`,
    expectedHint:
      "なまえ：たろう\nしょくぎょう：ゆうしゃ\nたろうの　ぶき：つるぎ",
    hint:
      "name = \"たろう\" のように\n3つの　へんすうに　なまえを　いれよう。\nprint文は　かえなくて　OK！",
    validate: (stdout) => {
      const lines = stdout.trim().split("\n");
      if (lines.length < 3) return false;
      const nameOk = lines[0].startsWith("なまえ：") && lines[0].length > "なまえ：".length;
      const jobOk = lines[1].startsWith("しょくぎょう：") && lines[1].length > "しょくぎょう：".length;
      const weaponOk = lines[2].includes("の　ぶき：") && lines[2].length > "の　ぶき：".length;
      return nameOk && jobOk && weaponOk;
    },
  },
  2: {
    question:
      "【チャレンジ】3かいの　こうげきで\nごうけいダメージを　もとめよう！\n\nこうげきりょく（attack）：25\nぼうぎょりょく（defense）：10\n1かいの　ダメージ = attack - defense\nこうげきかいすう（hits）：3\n\n3かいぶんの　ごうけいダメージを　けいさんして\n「ごうけいダメージ：〇〇」と　ひょうじしよう！",
    initialCode:
      `attack = 25\ndefense = 10\nhits = 3\n# 1かいぶんの　ダメージを　もとめよう\ndamage = 0\n# 3かいぶんの　ごうけいを　もとめよう\ntotal = 0\nprint("ごうけいダメージ：", total)`,
    expectedHint: "ごうけいダメージ： 45",
    hint:
      "damage = attack - defense で\n1かいぶんのダメージ（15）が　でるよ。\ntotal = damage * hits で\n3かいぶんのごうけい（45）が　もとめられるよ！",
    validate: (stdout) => stdout.trim().includes("45"),
  },
  3: {
    question:
      "【チャレンジ】ぼうけんしゃの　ランクを　はんていしよう！\n\nhero_hp = 65 で　ためしてね。\n\n・80いじょう　→「Sランク！」\n・50いじょう　→「Aランク！」\n・30いじょう　→「Bランク！」\n・それいがい　→「Cランク…」",
    initialCode:
      `hero_hp = 65\n# if / elif / else で　ランクを　はんていしよう\n`,
    expectedHint: "Aランク！",
    hint:
      "if hero_hp >= 80: → 「Sランク！」\nelif hero_hp >= 50: → 「Aランク！」\nelif hero_hp >= 30: → 「Bランク！」\nelse: → 「Cランク…」\n\nhero_hp=65 は　50いじょうなので\n「Aランク！」が　でるよ。",
    validate: (stdout) => stdout.trim().includes("Aランク！"),
  },
  4: {
    question:
      "【チャレンジ】ぼうけんカードを　つくろう！\n\nつかうへんすう：\n　name（もじ）= \"たろう\"\n　level（かず）= 5\n　hp（かず）= 80\n\nひょうじする　2こう：\n・なまえ：たろう　Lv.5\n・HP：80\n\nかずを + でくっつけるには\nstr() が　ひつようだよ！",
    initialCode:
      `name = "たろう"\nlevel = 5\nhp = 80\n# str() でかずを　もじに　かえて + でくっつけよう\n`,
    expectedHint: "なまえ：たろう　Lv.5\nHP：80",
    hint:
      "print(\"なまえ：\" + name + \"　Lv.\" + str(level))\nprint(\"HP：\" + str(hp))\nの　2行を　かいてみよう！",
    validate: (stdout) => {
      const lines = stdout.trim().split("\n");
      const line1ok = lines[0]?.includes("なまえ：") && lines[0].includes("Lv.") && lines[0].includes("5");
      const line2ok = lines[1]?.includes("HP：") && lines[1].includes("80");
      return line1ok && line2ok;
    },
  },
  5: {
    question:
      "【チャレンジ】てきリストを　かんりしよう！\n\nenemies = [\"スライム\", \"ゴブリン\", \"ドラゴン\"]\n\nやること：\n① さいしょの　てきを　ひょうじする\n　→「てき：スライム」\n② 「まおう」を　リストに　ついかする\n③ ごうけいの　てきの　かずを　ひょうじ\n　→「のこり：4たい」",
    initialCode:
      `enemies = ["スライム", "ゴブリン", "ドラゴン"]\n# ① さいしょの　てきを　ひょうじしよう\n\n# ② まおうを　ついかしよう\n\n# ③ ごうけいの　かずを　ひょうじしよう\n`,
    expectedHint: "てき：スライム\nのこり：4たい",
    hint:
      "① print(\"てき：\" + enemies[0])\n② enemies.append(\"まおう\")\n③ print(\"のこり：\" + str(len(enemies)) + \"たい\")\nの　3ぎょうを　かいてみよう！",
    validate: (stdout) => {
      const lines = stdout.trim().split("\n");
      return lines.some(l => l.includes("スライム")) && lines.some(l => l.includes("4"));
    },
  },
  6: {
    question:
      "【チャレンジ】ゆうしゃの　ステータスを　辞書で　かんりしよう！\n\nhero 辞書（name・hp・attack）を　つくって、\nバトルで　35ダメージを　うけた　あとの\nステータスを　3こう　ひょうじしよう：\n・なまえ：たろう\n・HP：65\n・こうげき：20",
    initialCode:
      `hero = {"name": "たろう", "hp": 100, "attack": 20}\n# バトルで　35ダメージ　うけた\n\n# 3こう　ひょうじしよう\n`,
    expectedHint: "なまえ：たろう\nHP：65\nこうげき：20",
    hint:
      "hero[\"hp\"] = hero[\"hp\"] - 35 でHP　こうしん。\nprint(\"なまえ：\" + hero[\"name\"])\nprint(\"HP：\" + str(hero[\"hp\"]))\nprint(\"こうげき：\" + str(hero[\"attack\"]))\nの　3ぎょうを　かこう！",
    validate: (stdout) => {
      const lines = stdout.trim().split("\n");
      return lines.some(l => l.includes("たろう")) && lines.some(l => l.includes("65")) && lines.some(l => l.includes("20"));
    },
  },
  7: {
    question:
      "【チャレンジ】while文で　バトルを　つくろう！\n\nenemy_hp = 45、attack = 15 で、\nてきのHPが　0いか　になるまで　こうげきしよう。\n\nまいかい「てきのHP：〇〇」と　ひょうじして、\nさいごに「かった！」と　ひょうじしてね。",
    initialCode:
      `enemy_hp = 45\nattack = 15\n# while文で　バトル！\n`,
    expectedHint: "てきのHP：30\nてきのHP：15\nてきのHP：0\nかった！",
    hint:
      "while enemy_hp > 0: と　かいて、\n　enemy_hp = enemy_hp - attack\n　print(\"てきのHP：\" + str(enemy_hp))\nloop の　あとに　print(\"かった！\") を　かこう！",
    validate: (stdout) => stdout.trim().includes("かった！") && stdout.includes("てきのHP："),
  },
  8: {
    question:
      "【チャレンジ】2つの　かんすうを　つくろう！\n\n① show_status(name, hp)\n　→「なまえ：〇〇」「HP：〇〇」を　ひょうじ\n\n② calc_damage(atk, defense)\n　→ atk - defense を　もどす（return）\n\ndamage = calc_damage(25, 10) で　けいさんして\n「ダメージ：15」を　ひょうじ、\nそのあと show_status(\"たろう\", 80) を　よびだそう。",
    initialCode:
      `# ① show_status かんすう\ndef show_status(name, hp):\n    print("なまえ：" + name)\n    print("HP：" + str(hp))\n\n# ② calc_damage かんすう\ndef calc_damage(atk, defense):\n    return 0  # atk - defense に　なおそう\n\ndamage = calc_damage(25, 10)\nprint("ダメージ：" + str(damage))\nshow_status("たろう", 80)`,
    expectedHint: "ダメージ：15\nなまえ：たろう\nHP：80",
    hint:
      "calc_damage の return を\nreturn atk - defense に　なおそう！\nshow_status は　もう　できているよ。",
    validate: (stdout) => {
      const lines = stdout.trim().split("\n");
      return lines.some(l => l.includes("15")) && lines.some(l => l.includes("たろう")) && lines.some(l => l.includes("80"));
    },
  },
  9: {
    question:
      "【チャレンジ】ランダムバトルを　つくろう！\n\n① random.choice で　てきを　1ひき　えらぶ\n　→「エンカウント：〇〇が　あらわれた！」\n\n② random.randint(10, 20) で　ダメージを　だす\n　→「ダメージ：〇〇」\n\n③ if文で　ダメージが　15いじょうなら\n　「クリティカルヒット！」、\n　そうじゃなければ「こうげき　せいこう！」",
    initialCode:
      `import random\n\nenemies = ["スライム", "ゴブリン", "ドラゴン"]\n\n# ① てきを　えらぼう\nenemy = random.choice(enemies)\nprint("エンカウント：" + enemy + "が　あらわれた！")\n\n# ② ランダムな　ダメージ\ndamage = random.randint(10, 20)\nprint("ダメージ：" + str(damage))\n\n# ③ クリティカル　はんてい\nif damage >= 15:\n    print("クリティカルヒット！")\nelse:\n    print("こうげき　せいこう！")`,
    expectedHint: "エンカウント：〇〇が　あらわれた！\nダメージ：〇〇\nクリティカルヒット！（または　こうげき　せいこう！）",
    hint:
      "このコードは　もう　かかれているよ！\nそのまま　じっこうしてみよう。\nじっこうするたびに　ちがう　てきが　でるよ！",
    validate: (stdout) => {
      return stdout.includes("エンカウント：") && stdout.includes("ダメージ：") &&
        (stdout.includes("クリティカルヒット！") || stdout.includes("こうげき　せいこう！"));
    },
  },
};

const CHALLENGE_BADGE: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "⚔️", label: "「へんすう　チャレンジャー」" },
  2: { emoji: "💥", label: "「えんざん　チャレンジャー」" },
  3: { emoji: "🏆", label: "「if文　チャレンジャー」" },
  4: { emoji: "🧪", label: "「データ型　チャレンジャー」" },
  5: { emoji: "📋", label: "「リスト　チャレンジャー」" },
  6: { emoji: "📖", label: "「辞書　チャレンジャー」" },
  7: { emoji: "🔁", label: "「ループ　チャレンジャー」" },
  8: { emoji: "🔧", label: "「かんすう　チャレンジャー」" },
  9: { emoji: "🎲", label: "「ランダム　チャレンジャー」" },
};

function canAttempt(unitId: number, earnedBadges: Set<string>): boolean {
  const hasBasic = earnedBadges.has(`unit_${unitId}_complete`);
  if (unitId === 1) return hasBasic;
  const hasPrevChallenge = earnedBadges.has(`unit_${unitId - 1}_challenge`);
  return hasBasic && hasPrevChallenge;
}

function ChallengePageInner() {
  useRequireAuth();
  const searchParams = useSearchParams();
  const unitId = searchParams.get("unitId");
  const learnerId = searchParams.get("learnerId");
  const router = useRouter();

  const uid = Number(unitId);
  const challenge = CHALLENGES[uid];

  const [code, setCode] = useState(challenge?.initialCode ?? "");
  const [output, setOutput] = useState("");
  const [stderr, setStderr] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isIncorrect, setIsIncorrect] = useState(false);
  const [running, setRunning] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [locked, setLocked] = useState<null | string>(null);
  const [alreadyEarned, setAlreadyEarned] = useState(false);

  useEffect(() => {
    if (!learnerId) return;
    apiClient.get(`/badges/${learnerId}`).then((res) => {
      const earned = new Set<string>(res.data.map((b: { badge_type: string }) => b.badge_type));
      if (earned.has(`unit_${uid}_challenge`)) {
        setAlreadyEarned(true);
        setLocked("");
        return;
      }
      if (!canAttempt(uid, earned)) {
        if (!earned.has(`unit_${uid}_complete`)) {
          setLocked(`まず　たんげん${uid}の　えんしゅうもんだいを　クリアしよう！`);
        } else {
          setLocked(`まず　たんげん${uid - 1}の　チャレンジもんだいを　クリアしよう！`);
        }
      } else {
        setLocked("");
      }
    }).catch(() => setLocked(""));
  }, [learnerId, uid]);

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

  const handleRun = async () => {
    if (cooldown > 0 || running || locked) return;
    setRunning(true);
    setOutput("");
    setStderr("");
    setIsCorrect(false);
    setIsIncorrect(false);
    startCooldown();

    try {
      const res = await runCode(code);
      const stdout = res.stdout.trim();
      const stderrText = res.stderr.trim();
      setOutput(stdout);
      setStderr(stderrText);

      if (res.exitCode === 0 && challenge.validate(stdout)) {
        setIsCorrect(true);
        if (learnerId && !alreadyEarned) {
          await apiClient.post(`/progress/${learnerId}`, { unit_id: uid, step: "challenge" });
          await apiClient.post(`/badges/${learnerId}`, { badge_type: `unit_${uid}_challenge` });
          await apiClient.post(`/learning-logs/${learnerId}`);
        }
        setShowBadge(true);
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

  if (!challenge) return null;

  const runButtonDisabled = cooldown > 0 || running || !!locked;
  const badge = CHALLENGE_BADGE[uid];

  if (showBadge) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center max-w-sm w-full">
          <div className="text-7xl mb-5 animate-bounce">{badge?.emoji}</div>
          <p className="text-xs text-gray-400 mb-2">すごい！　チャレンジ　クリア！</p>
          <p className="text-xl font-medium text-gray-800 mb-1">{badge?.label}</p>
          <p className="text-sm text-yellow-600 font-medium mb-6">チャレンジバッジを　てにいれた！</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push(`/learner?id=${learnerId}`)}
              className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              マイページに　もどる
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <GlobalNav
        subtitle={`たんげん${uid}　チャレンジ`}
        showBack
        backLabel="← マイページに　もどる"
        backHref={`/learner?id=${learnerId}`}
      />

      {locked && (
        <div className="flex flex-1 items-center justify-center">
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center max-w-sm">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-base font-medium text-gray-700 mb-2">まだ　チャレンジできないよ</p>
            <p className="text-sm text-gray-500 mb-6">{locked}</p>
            <button
              onClick={() => router.push(`/learner?id=${learnerId}`)}
              className="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium"
            >
              マイページに　もどる
            </button>
          </div>
        </div>
      )}

      {locked === null && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-400">よみこみちゅう...</p>
        </div>
      )}

      {locked === "" && alreadyEarned && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2 text-xs text-yellow-700 text-center">
          {badge?.emoji} このチャレンジは　クリアずみ！　もう一度　たのしんでね。
        </div>
      )}

      {locked === "" && (
        <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 52px)" }}>
          {/* problem panel */}
          <div className="w-72 border-r border-gray-200 p-5 overflow-y-auto bg-white flex-shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">{badge?.emoji}</span>
              <p className="text-sm font-medium text-yellow-700">チャレンジもんだい</p>
            </div>

            <CharaSpeech
              text={challenge.question}
              charaType={isCorrect ? "correct" : isIncorrect ? "incorrect" : "normal"}
            />

            <div className="bg-gray-50 rounded-xl p-3 text-xs font-mono text-gray-700 mb-4">
              <p className="text-gray-400 mb-1">きたいされる　けっか：</p>
              <p className="text-yellow-700 whitespace-pre-line">{challenge.expectedHint}</p>
            </div>

            {showHint && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 mb-3 leading-relaxed">
                💡 {challenge.hint}
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
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${runButtonDisabled ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600 text-white"}`}
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

            {isCorrect && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700 font-medium">
                🏆 チャレンジ　クリア！
              </div>
            )}
            {isIncorrect && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
                うーん、もう一度　ためしてみよう。
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChallengePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-sm text-gray-400">よみこみちゅう...</p></div>}>
      <ChallengePageInner />
    </Suspense>
  );
}
