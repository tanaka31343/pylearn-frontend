"use client";
import { useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import GlobalNav from "@/components/GlobalNav";
import CharaSpeech from "@/components/CharaSpeech";
import apiClient from "@/lib/apiClient";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const EXERCISES: Record<number, {
  question: string;
  initialCode: string;
  expected: string;
  hint: string;
}> = {
  1: {
    question: "じぶんの　なまえを　へんすうに　いれて、「こんにちは、〇〇」と　ひょうじしよう！",
    initialCode: `name = ""\nprint("こんにちは、" + name)`,
    expected: "こんにちは、",
    hint: "name = \"たろう\" のように　なまえを　いれてみよう。",
  },
  2: {
    question: "HP100から　ダメージ30を　ひいて、のこりのHPを　ひょうじしよう！",
    initialCode: `hp = 100\ndamage = 30\n# hp から damage を　ひこう\nprint("のこりHP:", hp)`,
    expected: "のこりHP: 70",
    hint: "hp = hp - damage と　かいてみよう。",
  },
  3: {
    question: "hp が 0より　おおきいとき「かった！」、そうじゃないとき「まけた…」と　ひょうじしよう！",
    initialCode: `hp = 10\n# if文を　かいてみよう`,
    expected: "かった！",
    hint: "if hp > 0: と　かいて、その下に　print(\"かった！\") と　かこう。",
  },
};

export default function ExercisePage() {
  useRequireAuth();
  const { unitId } = useParams<{ unitId: string }>();
  const searchParams = useSearchParams();
  const learnerId = searchParams.get("learnerId");
  const router = useRouter();

  const uid = Number(unitId);
  const ex = EXERCISES[uid];

  const [code, setCode] = useState(ex?.initialCode ?? "");
  const [output, setOutput] = useState("");
  const [stderr, setStderr] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [hintCount, setHintCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isIncorrect, setIsIncorrect] = useState(false);
  const [running, setRunning] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

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
    if (cooldown > 0 || running) return;
    setRunning(true);
    setOutput("");
    setStderr("");
    setIsCorrect(false);
    setIsIncorrect(false);
    startCooldown();

    try {
      const res = await apiClient.post("/execute", { code });
      const stdout = res.data.stdout.trim();
      const stderr = res.data.stderr.trim();
      setOutput(stdout);
      setStderr(stderr);

      if (stdout.includes(ex.expected)) {
        setIsCorrect(true);
        // 進捗を保存
        if (learnerId) {
          await apiClient.post(`/progress/${learnerId}`, { unit_id: uid, step: "exercise" });
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

  if (!ex) return null;

  if (showBadge) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center max-w-sm w-full">
          <div className="text-7xl mb-5 animate-bounce">
            {uid === 1 ? "🐍" : uid === 2 ? "🔢" : "⚡"}
          </div>
          <p className="text-xs text-gray-400 mb-2">やったー！</p>
          <p className="text-xl font-medium text-gray-800 mb-1">
            {uid === 1 ? "「へんすう　マスター」" : uid === 2 ? "「えんざん　マスター」" : "「if文　マスター」"}
          </p>
          <p className="text-sm text-purple-600 font-medium mb-6">バッジを　てにいれた！</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push(`/learner/${learnerId}`)}
              className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              マイページに　もどる
            </button>
            {uid < 3 && (
              <button
                onClick={() => router.push(`/unit/${uid + 1}/explanation?learnerId=${learnerId}`)}
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
        backHref={`/unit/${unitId}/explanation?learnerId=${learnerId}`}
      />

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 52px)" }}>
        {/* problem panel */}
        <div className="w-72 border-r border-gray-200 p-5 overflow-y-auto bg-white flex-shrink-0">
          <p className="text-sm font-medium text-gray-800 mb-4">もんだい</p>
          <CharaSpeech text={ex.question} />

          <div className="bg-gray-50 rounded-xl p-3 text-xs font-mono text-gray-700 mb-4">
            <p className="text-gray-400 mb-1">きたいされる　けっか：</p>
            <p className="text-purple-600">{ex.expected}...</p>
          </div>

          {showHint && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 mb-3 leading-relaxed">
              💡 {ex.hint}
            </div>
          )}

          {!isCorrect && hintCount < 3 && (
            <button
              onClick={() => { setShowHint(true); setHintCount((c) => c + 1); }}
              className="text-xs text-purple-500 hover:text-purple-700"
            >
              ヒントを　みる（のこり{3 - hintCount}かい）
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
              disabled={cooldown > 0 || running}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${cooldown > 0 || running ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-purple-500 hover:bg-purple-600 text-white"}`}
            >
              ▶ {cooldown > 0 ? `まってね... (${cooldown}びょう)` : "じっこう"}
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
