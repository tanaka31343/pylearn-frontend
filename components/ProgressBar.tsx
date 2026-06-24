interface Props {
  value: number;
  max: number;
  label?: string;
}

export default function ProgressBar({ value, max, label }: Props) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        {label && <span>{label}</span>}
        <span>{pct}%</span>
      </div>
      <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-purple-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {value} / {max} ステップ　クリア
      </p>
    </div>
  );
}
