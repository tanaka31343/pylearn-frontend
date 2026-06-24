"use client";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import GlobalNav from "@/components/GlobalNav";
import CharaSpeech from "@/components/CharaSpeech";

interface CodeBlock {
  label: string;
  code: string;
}

const UNIT_CONTENT: Record<number, {
  title: string;
  speech: string;
  codeBlocks: CodeBlock[];
}> = {
  1: {
    title: "print・へんすう",
    speech: "「へんすう」をつかうと、なまえや　かずを　おぼえさせることが　できるよ！\n\nprint()をつかうと、おぼえさせたものを　がめんに　ひょうじできるんだ。\n\nまた、「+」をつかうと　もじと　もじを　くっつけることが　できるよ！",
    codeBlocks: [
      {
        label: "へんすうと　print",
        code: `name = "たろう"\nprint(name)  # たろう`,
      },
      {
        label: "「+」で　もじを　くっつける",
        code: `name = "たろう"\nprint("こんにちは、" + name + "！")\n# → こんにちは、たろう！`,
      },
    ],
  },
  2: {
    title: "すうじ・えんざん",
    speech: "Pythonでは　たし算・ひき算・かけ算・わり算が　できるよ！\n\nきごうは　それぞれ　+（たす）、-（ひく）、*（かける）、/（わる）を　つかうんだ。\n\nゲームのHPや　スコアを　けいさんして　みよう！",
    codeBlocks: [
      {
        label: "たし算（+）",
        code: `hp = 50\nheal = 30\nhp = hp + heal\nprint("かいふく後のHP:", hp)  # 80`,
      },
      {
        label: "ひき算（-）",
        code: `hp = 100\ndamage = 30\nhp = hp - damage\nprint("のこりHP:", hp)  # 70`,
      },
      {
        label: "かけ算（*）",
        code: `attack = 15\nrate = 2\ndamage = attack * rate\nprint("ダメージ:", damage)  # 30`,
      },
      {
        label: "わり算（/）",
        code: `score = 200\nplayers = 2\nshare = score / players\nprint("1人ぶん:", share)  # 100.0`,
      },
    ],
  },
  3: {
    title: "if文",
    speech: "「if文」をつかうと、じょうけんによって　ちがう　うごきを　させられるよ！\n\nじょうけんには　6つの　くらべかたが　あるよ：\n　>（より　おおきい）　　<（より　ちいさい）\n　>=（いじょう）　　　　<=（いか）\n　==（おなじ）　　　　　!=（ちがう）\n\nさらに　elif で　3つ以上の　ばあいわけも　できるよ！",
    codeBlocks: [
      {
        label: "> / < / >= / <=",
        code: `hp = 50\nif hp >= 80:\n    print("げんき！")\nelif hp >= 30:\n    print("ピンチ！")\nelse:\n    print("まけた…")`,
      },
      {
        label: "==（おなじ）/ !=（ちがう）",
        code: `item = "つるぎ"\nif item == "つるぎ":\n    print("ぶきを　そうびした！")\nelse:\n    print("そうびできない…")\n\nif item != "たて":\n    print("たては　もっていない")`,
      },
    ],
  },
};

const UNIT_LIST = [
  { id: 1, title: "print・へんすう" },
  { id: 2, title: "すうじ・えんざん" },
  { id: 3, title: "if文" },
];

function ExplanationPageInner() {
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

          {content.codeBlocks.length === 1 ? (
            <div className="bg-gray-800 rounded-xl p-5 font-mono text-sm leading-7 text-gray-100 mb-6 whitespace-pre">
              {content.codeBlocks[0].code}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {content.codeBlocks.map((block) => (
                <div key={block.label} className="bg-gray-800 rounded-xl p-4">
                  <p className="text-xs text-purple-400 mb-2 font-medium">{block.label}</p>
                  <pre className="font-mono text-xs leading-6 text-gray-100 whitespace-pre overflow-x-auto">{block.code}</pre>
                </div>
              ))}
            </div>
          )}

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

export default function ExplanationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-sm text-gray-400">よみこみちゅう...</p></div>}>
      <ExplanationPageInner />
    </Suspense>
  );
}
