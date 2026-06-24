"use client";
import { useState, useCallback, useRef, useEffect, Suspense } from "react";
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
};

const UNIT_BADGE: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "🐍", label: "「へんすう　マスター」" },
  2: { emoji: "🔢", label: "「えんざん　マスター」" },
  3: { emoji: "⚡", label: "「if文　マスター」" },
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
  const [pyodideReady, setPyodideReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<Map<number, (result: { stdout: string; stderr: string; exitCode: number }) => void>>(new Map());
  const reqIdRef = useRef(0);

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

      if (ex.validate(stdout)) {
        setIsCorrect(true);
        // 最後の問題のときだけ進捗・バッジを記録
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

  const runButtonDisabled = cooldown > 0 || running || !pyodideReady;
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
            {uid < 3 && (
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
      {!pyodideReady && (
        <div className="bg-purple-50 border-b border-purple-200 px-4 py-2">
          <div className="flex items-center gap-3 max-w-md mx-auto">
            <span className="text-xs text-purple-700 whitespace-nowrap">⏳ Pythonを　よみこみちゅう...</span>
            <div className="flex-1 bg-purple-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <span className="text-xs text-purple-700 w-8 text-right">{loadProgress}%</span>
          </div>
        </div>
      )}

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
              ▶ {!pyodideReady ? "Pythonを　よみこみちゅう..." : cooldown > 0 ? `まってね... (${cooldown}びょう)` : "じっこう"}
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
