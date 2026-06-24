"use client";
import { useState, useCallback, useRef, useEffect, Suspense } from "react";
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

// 解放条件: unit_N_complete バッジ + unit_(N-1)_challenge バッジ（N=1は不要）
const CHALLENGES: Record<number, ChallengeItem> = {
  1: {
    question:
      "【チャレンジ】ゆうしゃの　しょうかいカードを　つくろう！\n\n「name」「job」「weapon」の　3つの　へんすうに　すきな　なまえを　いれて、したの　3こうを　ぜんぶ　ひょうじしよう。\n\n・1こうめ：「なまえ：〇〇」\n・2こうめ：「しょくぎょう：〇〇」\n・3こうめ：「〇〇の　ぶき：〇〇」",
    initialCode:
      `name = ""\njob = ""\nweapon = ""\nprint("なまえ：" + name)\nprint("しょくぎょう：" + job)\nprint(name + "の　ぶき：" + weapon)`,
    expectedHint:
      "なまえ：たろう\nしょくぎょう：ゆうしゃ\nたろうの　ぶき：つるぎ",
    hint:
      "name = \"たろう\" のように　3つの　へんすうに　なまえを　いれよう。print文は　かえなくて　OK！",
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
      "【チャレンジ】3かいのこうげきで　ごうけいダメージを　もとめよう！\n\nゆうしゃの　こうげきりょく（attack）は 25、てきの　ぼうぎょりょく（defense）は 10。\n1かいの　ダメージ = attack - defense。\n3かいぶんの　ごうけいダメージを　けいさんして　「ごうけいダメージ：〇〇」と　ひょうじしよう！",
    initialCode:
      `attack = 25\ndefense = 10\nhits = 3\n# 1かいぶんの　ダメージを　もとめよう\ndamage = 0\n# 3かいぶんの　ごうけいを　もとめよう\ntotal = 0\nprint("ごうけいダメージ：", total)`,
    expectedHint: "ごうけいダメージ： 45",
    hint:
      "damage = attack - defense で　1かいぶんのダメージ（15）が　でるよ。total = damage * hits で　3かいぶんのごうけい（45）が　もとめられるよ！",
    validate: (stdout) => stdout.trim().includes("45"),
  },
  3: {
    question:
      "【チャレンジ】しょうりしたら　ボーナススコアを　ひょうじしよう！\n\nゆうしゃのHP（hero_hp）= 40、てきのHP（enemy_hp）= 0。\nif文で　enemy_hp が 0いか（<= 0）なら「しょうり！」と　ひょうじして、\nボーナススコア = hero_hp * 10 を　けいさんして　「スコア：〇〇」と　ひょうじしよう！\nてきが　のこっている（else）ときは「まだたたかえ！」と　ひょうじしよう。",
    initialCode:
      `hero_hp = 40\nenemy_hp = 0\n# if文で　しょうりはんてい\n\n# しょうりの　ときは　ボーナスを　けいさんしよう\n`,
    expectedHint: "しょうり！\nスコア： 400",
    hint:
      "if enemy_hp <= 0: の　ブロックに　print(\"しょうり！\") と　bonus = hero_hp * 10 と　print(\"スコア：\", bonus) を　かいてみよう！",
    validate: (stdout) => {
      const t = stdout.trim();
      return t.includes("しょうり！") && t.includes("400");
    },
  },
};

const CHALLENGE_BADGE: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "⚔️", label: "「へんすう　チャレンジャー」" },
  2: { emoji: "💥", label: "「えんざん　チャレンジャー」" },
  3: { emoji: "🏆", label: "「if文　チャレンジャー」" },
};

// 解放条件を満たしているか確認
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
  const [pyodideReady, setPyodideReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [locked, setLocked] = useState<null | string>(null); // null=loading, string=lock reason or ""=unlocked
  const [alreadyEarned, setAlreadyEarned] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<Map<number, (r: { stdout: string; stderr: string; exitCode: number }) => void>>(new Map());
  const reqIdRef = useRef(0);

  // 解放条件チェック
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

  // Pyodide Worker 初期化
  useEffect(() => {
    const worker = new Worker("/pyodide-worker.js");
    workerRef.current = worker;
    worker.onmessage = (e) => {
      const { id, stdout, stderr, exitCode, progress } = e.data;
      if (id === -1) {
        if (progress !== undefined) setLoadProgress(progress);
        if (exitCode === 0) setPyodideReady(true);
        return;
      }
      const cb = callbacksRef.current.get(id);
      if (cb) { cb({ stdout, stderr, exitCode }); callbacksRef.current.delete(id); }
    };
    worker.postMessage({ id: -1, code: "1+1" });
    return () => worker.terminate();
  }, []);

  const runCode = useCallback((code: string): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
    return new Promise((resolve) => {
      const id = ++reqIdRef.current;
      callbacksRef.current.set(id, resolve);
      workerRef.current?.postMessage({ id, code });
    });
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
      const stderr = res.stderr.trim();
      setOutput(stdout);
      setStderr(stderr);

      if (challenge.validate(stdout)) {
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

  const runButtonDisabled = cooldown > 0 || running || !pyodideReady || !!locked;
  const badge = CHALLENGE_BADGE[uid];

  // バッジ獲得画面
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

      {/* 解放条件未達 */}
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

      {/* チャレンジ済み表示（再チャレンジ可） */}
      {locked === "" && !pyodideReady && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="flex items-center gap-3 max-w-md mx-auto">
            <span className="text-xs text-yellow-700 whitespace-nowrap">⏳ Pythonを　よみこみちゅう...</span>
            <div className="flex-1 bg-yellow-200 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <span className="text-xs text-yellow-700 w-8 text-right">{loadProgress}%</span>
          </div>
        </div>
      )}
      {locked === "" && alreadyEarned && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2 text-xs text-yellow-700 text-center">
          {badge?.emoji} このチャレンジは　クリアずみ！　もう一度　たのしんでね。
        </div>
      )}

      {/* ロード中 */}
      {locked === null && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-400">よみこみちゅう...</p>
        </div>
      )}

      {/* チャレンジ本体 */}
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
                ▶ {!pyodideReady ? "よみこみちゅう..." : cooldown > 0 ? `まってね... (${cooldown}びょう)` : "じっこう"}
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
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 mb-3 font-mono">
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
