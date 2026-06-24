"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useLearnerStore } from "@/store/learnerStore";
import GlobalNav from "@/components/GlobalNav";
import ProgressBar from "@/components/ProgressBar";
import apiClient from "@/lib/apiClient";

interface Badge { badge_type: string; earned_at: string; }
interface Progress { unit_id: number; step: string; completed: boolean; }

const UNITS = [
  { id: 1, title: "print・へんすう", sub: "キャラの　なまえを　きめよう" },
  { id: 2, title: "すうじ・えんざん", sub: "HPを　けいさんしよう" },
  { id: 3, title: "if文", sub: "てきとの　しょうぶを　つくろう" },
];

const BADGE_LABELS: Record<string, string> = {
  unit_1_complete: "🐍 へんすう",
  unit_2_complete: "🔢 えんざん",
  unit_3_complete: "⚡ if文",
};

export default function MyPage() {
  useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const currentLearner = useLearnerStore((s) => s.currentLearner);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      apiClient.get(`/badges/${id}`),
      apiClient.get(`/progress/${id}`),
      apiClient.get(`/learning-logs/${id}/streak`),
    ]).then(([b, p, s]) => {
      setBadges(b.data);
      setProgress(p.data);
      setStreak(s.data.streak);
    }).catch(() => {});
  }, [id]);

  const completedSteps = progress.filter((p) => p.completed).length;
  const totalSteps = UNITS.length * 3;

  const earnedBadgeTypes = new Set(badges.map((b) => b.badge_type));

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalNav showBack backLabel="← こども　えらぶ" backHref="/select-learner" />
      <main className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="text-4xl">🧑</div>
          <h1 className="text-xl font-medium text-gray-800">
            {currentLearner?.nickname ?? ""}の　ページ
          </h1>
        </div>

        <div className="grid grid-cols-[280px_1fr] gap-6">
          {/* sidebar */}
          <div className="flex flex-col gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">ぜんたいの　しんちょく</p>
              <ProgressBar value={completedSteps} max={totalSteps} />
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">れんぞく　がくしゅう　にっすう</p>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${i < streak ? "bg-purple-100" : "bg-gray-100"}`}
                  >
                    {i < streak ? "⭐" : ""}
                  </div>
                ))}
              </div>
              {streak > 0 && (
                <p className="text-xs text-purple-600 font-medium">{streak}日　れんぞく　がくしゅう中！</p>
              )}
            </div>
          </div>

          {/* main */}
          <div className="flex flex-col gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">とったバッジ</p>
              <div className="flex gap-3 flex-wrap">
                {Object.entries(BADGE_LABELS).map(([type, label]) => (
                  <div
                    key={type}
                    className={`bg-gray-100 rounded-xl px-4 py-3 text-center ${!earnedBadgeTypes.has(type) ? "opacity-30" : ""}`}
                  >
                    <p className="text-sm">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">たんげん　いちらん</p>
              <div className="flex flex-col gap-3">
                {UNITS.map((unit) => {
                  const done = progress.filter((p) => p.unit_id === unit.id && p.completed).length;
                  const isActive = done > 0 && done < 3;
                  const isComplete = done >= 3;
                  return (
                    <button
                      key={unit.id}
                      onClick={() => router.push(`/unit/${unit.id}/explanation?learnerId=${id}`)}
                      className="flex items-center gap-3 p-3 border border-gray-200 hover:border-purple-400 rounded-xl text-left transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium flex-shrink-0 ${isComplete ? "bg-green-100 text-green-700" : isActive ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-400"}`}>
                        {isComplete ? "✓" : unit.id}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{unit.title}</p>
                        <p className="text-xs text-gray-400">{unit.sub}</p>
                      </div>
                      <div className="ml-auto text-gray-400 text-sm">→</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
