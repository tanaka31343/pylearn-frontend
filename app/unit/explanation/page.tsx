"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import GlobalNav from "@/components/GlobalNav";
import CharaSpeech from "@/components/CharaSpeech";

const UNIT_CONTENT: Record<number, {
  title: string;
  speech: string;
  codeExample: string;
}> = {
  1: {
    title: "print・へんすう",
    speech: "「へんすう」をつかうと、なまえや　かずを　おぼえさせることが　できるよ！\n\nprint()をつかうと、おぼえさせたものを　がめんに　ひょうじできるんだ。",
    codeExample: `name = "たろう"\nprint("こんにちは、" + name)`,
  },
  2: {
    title: "すうじ・えんざん",
    speech: "Pythonでは　たし算・ひき算・かけ算・わり算が　できるよ！\n\nキャラクターのHPを　けいさんして　みよう。",
    codeExample: `hp = 100\ndamage = 30\nhp = hp - damage\nprint("のこりHP:", hp)`,
  },
  3: {
    title: "if文",
    speech: "「if文」をつかうと、じょうけんによって　ちがう　うごきを　させられるよ！\n\nたとえば「HPが0より　おおきければ　かった！」そうじゃなければ「まけた…」と　ひょうじできるんだ。",
    codeExample: `hp = 10\nif hp > 0:\n    print("かった！")\nelse:\n    print("まけた…")`,
  },
};

const UNIT_LIST = [
  { id: 1, title: "print・へんすう" },
  { id: 2, title: "すうじ・えんざん" },
  { id: 3, title: "if文" },
];

export default function ExplanationPage() {
  useRequireAuth();
  const searchParams = useSearchParams();
  const unitId = searchParams.get("unitId");
  const learnerId = searchParams.get("learnerId");
  const router = useRouter();

  const uid = Number(unitId);
  const content = UNIT_CONTENT[uid];

  if (!content) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalNav showBack backLabel="← マイページ" backHref={`/learner?id=${learnerId}`} />
      <div className="max-w-5xl mx-auto px-8 py-8 grid grid-cols-[220px_1fr] gap-6">
        {/* unit sidebar */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">たんげん　いちらん</p>
          <div className="flex flex-col gap-2">
            {UNIT_LIST.map((u) => (
              <button
                key={u.id}
                onClick={() => router.push(`/unit/explanation?unitId=${u.id}&learnerId=${learnerId}`)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${u.id === uid ? "border-purple-400 border-2 bg-white" : "border-gray-200 bg-white hover:border-gray-300"}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0 ${u.id === uid ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-400"}`}>
                  {u.id}
                </div>
                <span className="text-sm font-medium text-gray-700">{u.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* content */}
        <div>
          <div className="flex gap-2 mb-6">
            {["せつめい", "れいだい", "えんしゅう"].map((label, i) => (
              <span
                key={label}
                className={`px-4 py-1.5 rounded-full text-xs font-medium ${i === 0 ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-400"}`}
              >
                {i + 1} {label}
              </span>
            ))}
          </div>

          <CharaSpeech text={content.speech} />

          <div className="bg-gray-800 rounded-xl p-5 font-mono text-sm leading-7 text-gray-100 mb-6 whitespace-pre">
            {content.codeExample}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => router.back()}
              className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              ← もどる
            </button>
            <button
              onClick={() => router.push(`/unit/exercise?unitId=${unitId}&learnerId=${learnerId}`)}
              className="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium"
            >
              えんしゅうへ →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
