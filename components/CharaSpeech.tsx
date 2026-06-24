import Image from "next/image";

interface Props {
  text: string;
  charaType?: "normal" | "hint" | "correct" | "incorrect";
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const charaImage: Record<string, string> = {
  normal:   `${BASE}/characters/hakase_tachi.jpg`,
  hint:     `${BASE}/characters/hakase_setsumei.jpg`,
  correct:  `${BASE}/characters/hakase_smile.jpg`,
  incorrect:`${BASE}/characters/hakase_bakuhatsu.jpg`,
};

export default function CharaSpeech({ text, charaType = "normal" }: Props) {
  return (
    <div className="flex items-end gap-3 mb-5">
      <div className="w-14 h-14 rounded-full bg-purple-100 flex-shrink-0 overflow-hidden">
        <Image
          src={charaImage[charaType]}
          alt="博士"
          width={56}
          height={56}
          className="object-cover w-full h-full"
        />
      </div>
      <div className="bg-white border border-gray-200 rounded-xl rounded-bl-none px-4 py-3 text-sm leading-relaxed text-gray-800 max-w-xl">
        {text}
      </div>
    </div>
  );
}
