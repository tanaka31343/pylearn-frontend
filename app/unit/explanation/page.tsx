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
    speech: "Pythonでは　たし算・ひき算・かけ算・わり算が　できるよ！\n\nきごうは　それぞれ：\n　+（たす）\n　-（ひく）\n　*（かける）\n　/（わる）\n\nゲームのHPや　スコアを　けいさんして　みよう！",
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
    speech: "「if文」をつかうと、じょうけんによって\nちがう　うごきを　させられるよ！\n\nじょうけんの　くらべかた：\n　>（より　おおきい）\n　<（より　ちいさい）\n　>=（いじょう）\n　<=（いか）\n　==（おなじ）\n　!=（ちがう）\n\nelif で　3つ以上の　ばあいわけも　できるよ！",
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
  4: {
    title: "データ型・型変換",
    speech: "Pythonの　データには　「型（かた）」があるよ！\n\n・str（もじれつ）\n　\"たろう\"　\"100\" のように\n　\"\" でかこんだもの\n\n・int（せいすう）\n　1、50、-3 のような　かず\n\n・float（しょうすう）\n　3.14、100.0 のような　小数のかず\n\nstr()・int()・float() で　型を　かえることができるよ。\n\n文字列と　かずを「+」でくっつけるには\nstr() が　ひつようだよ！",
    codeBlocks: [
      {
        label: "str()：かずを　もじにする",
        code: `score = 350\nprint("スコア：" + str(score))\n# → スコア：350`,
      },
      {
        label: "int()・float()：もじを　かずにする",
        code: `hp_str = "75"\nhp = int(hp_str)\nprint(hp + 25)   # → 100\n\nprice = float("1.5")\nprint(price * 2)  # → 3.0`,
      },
    ],
  },
  5: {
    title: "リスト",
    speech: "「リスト」をつかうと、たくさんの　データを　まとめて　おけるよ！\n\n・リストの　つくりかた：\n　enemies = [\"スライム\", \"ゴブリン\", \"ドラゴン\"]\n\n・ばんごう（インデックス）で　とりだす：\n　enemies[0]  # → スライム\n　（0から　はじまるよ！）\n\n・ついか（append）：\n　enemies.append(\"まおう\")\n\n・かず（len）：\n　len(enemies)  # → 4",
    codeBlocks: [
      {
        label: "リストと　インデックス",
        code: `enemies = ["スライム", "ゴブリン", "ドラゴン"]\nprint(enemies[0])  # → スライム\nprint(enemies[1])  # → ゴブリン\nprint(enemies[2])  # → ドラゴン`,
      },
      {
        label: "append と len",
        code: `items = ["つるぎ", "たて"]\nitems.append("ポーション")\nprint(len(items))   # → 3\nprint(items[2])     # → ポーション`,
      },
    ],
  },
  6: {
    title: "辞書",
    speech: "「辞書（じしょ）」をつかうと、なまえを　つけて　データを　まとめられるよ！\n\n・辞書の　つくりかた：\n　hero = {\"name\": \"たろう\", \"hp\": 100}\n\n・データの　とりだしかた：\n　hero[\"name\"]  # → たろう\n\n・データの　こうしん：\n　hero[\"hp\"] = 70\n\nリストが「ばんごう」で　とりだすのに対して、\n辞書は「なまえ（キー）」で　とりだすよ！",
    codeBlocks: [
      {
        label: "辞書の　つくりかたと　アクセス",
        code: `hero = {"name": "たろう", "hp": 100, "attack": 20}\nprint(hero["name"])    # → たろう\nprint(hero["hp"])      # → 100\nprint(hero["attack"])  # → 20`,
      },
      {
        label: "値の　こうしん",
        code: `hero = {"name": "たろう", "hp": 100}\nhero["hp"] = hero["hp"] - 35\nprint(hero["name"] + "のHP：" + str(hero["hp"]))\n# → たろうのHP：65`,
      },
    ],
  },
  7: {
    title: "for・whileループ",
    speech: "「ループ」をつかうと、おなじ　しょりを　くりかえせるよ！\n\n・for文（リストの　くりかえし）：\n　for enemy in enemies:\n　    print(enemy)\n\n・range()：\n　for i in range(3):  # 0, 1, 2\n\n・while文：\n　while hp > 0:\n　    hp = hp - 10\n\n・break：\n　ループを　とちゅうで　やめる",
    codeBlocks: [
      {
        label: "for文",
        code: `enemies = ["スライム", "ゴブリン", "ドラゴン"]\nfor enemy in enemies:\n    print(enemy + "が　あらわれた！")`,
      },
      {
        label: "while文",
        code: `hp = 30\nwhile hp > 0:\n    hp = hp - 10\n    print("のこりHP：" + str(hp))\nprint("たおれた…")`,
      },
    ],
  },
  8: {
    title: "かんすう（def）",
    speech: "「かんすう（def）」をつかうと、コードを　まとめて　なまえを　つけられるよ！\n\n・かんすうの　つくりかた：\n　def greet(name):\n　    print(\"こんにちは、\" + name + \"！\")\n\n・よびだしかた：\n　greet(\"たろう\")  # こんにちは、たろう！\n\n・もどりち（return）：\n　def add(a, b):\n　    return a + b\n　result = add(10, 5)  # → 15\n\nかんすうを　つかうと、おなじコードを　なんどでも　つかいまわせるよ！",
    codeBlocks: [
      {
        label: "引数（ひきすう）あり",
        code: `def greet(name):\n    print("こんにちは、" + name + "！")\n\ngreet("たろう")   # こんにちは、たろう！\ngreet("はなこ")   # こんにちは、はなこ！`,
      },
      {
        label: "もどりち（return）",
        code: `def damage(atk, def_):\n    return atk - def_\n\ndmg = damage(25, 10)\nprint("ダメージ：" + str(dmg))  # → 15`,
      },
    ],
  },
  9: {
    title: "randomライブラリ",
    speech: "「random」ライブラリをつかうと、ランダムな　かずや　もじを　えらべるよ！\n\nまず　import が　ひつようだよ：\n　import random\n\n・ランダムな　せいすう（randint）：\n　random.randint(1, 6)  # 1〜6の　かず\n\n・リストから　ランダムに　えらぶ（choice）：\n　random.choice(enemies)\n\nゲームの　ダメージの　ブレや、\nランダムエンカウントに　つかえるよ！",
    codeBlocks: [
      {
        label: "randint：ランダムな　かず",
        code: `import random\ndice = random.randint(1, 6)\nprint("さいころ：" + str(dice))  # 1〜6`,
      },
      {
        label: "choice：リストから　えらぶ",
        code: `import random\nenemies = ["スライム", "ゴブリン", "ドラゴン"]\nenemy = random.choice(enemies)\nprint("エンカウント：" + enemy)`,
      },
    ],
  },
};

const UNIT_LIST = [
  { id: 1, title: "print・へんすう" },
  { id: 2, title: "すうじ・えんざん" },
  { id: 3, title: "if文" },
  { id: 4, title: "データ型・型変換" },
  { id: 5, title: "リスト" },
  { id: 6, title: "辞書" },
  { id: 7, title: "for・whileループ" },
  { id: 8, title: "かんすう（def）" },
  { id: 9, title: "randomライブラリ" },
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
