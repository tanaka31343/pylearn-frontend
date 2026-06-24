interface Props {
  text: string;
  charaType?: "normal" | "hint" | "correct";
}

const charaEmoji: Record<string, string> = {
  normal: "🔬",
  hint: "💡",
  correct: "🎉",
};

export default function CharaSpeech({ text, charaType = "normal" }: Props) {
  return (
    <div className="flex items-end gap-3 mb-5">
      <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-3xl flex-shrink-0">
        {charaEmoji[charaType]}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl rounded-bl-none px-4 py-3 text-sm leading-relaxed text-gray-800 max-w-xl">
        {text}
      </div>
    </div>
  );
}
