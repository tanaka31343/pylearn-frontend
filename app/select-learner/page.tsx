"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useLearnerStore } from "@/store/learnerStore";
import GlobalNav from "@/components/GlobalNav";
import apiClient from "@/lib/apiClient";

interface Learner {
  id: number;
  nickname: string;
  avatar_key: string | null;
}

const AVATARS = ["🧑", "👧", "👦", "👩", "🧒"];

export default function SelectLearnerPage() {
  useRequireAuth();
  const router = useRouter();
  const setCurrentLearner = useLearnerStore((s) => s.setCurrentLearner);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [adding, setAdding] = useState(false);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLearners = async () => {
    try {
      const res = await apiClient.get("/learners");
      setLearners(res.data);
    } catch {
      // 認証エラーは interceptor が処理
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLearners(); }, []);

  const handleSelect = (learner: Learner) => {
    setCurrentLearner(learner);
    router.push(`/learner/${learner.id}`);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    try {
      await apiClient.post("/learners", { nickname: nickname.trim() });
      setNickname("");
      setAdding(false);
      fetchLearners();
    } catch {
      // エラー処理
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalNav />
      <main className="max-w-3xl mx-auto px-8 py-12">
        <h1 className="text-2xl font-medium text-gray-800 mb-8">だれで　あそぶ？</h1>

        {loading ? (
          <p className="text-sm text-gray-400">よみこみちゅう...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {learners.map((learner, i) => (
              <button
                key={learner.id}
                onClick={() => handleSelect(learner)}
                className="bg-white border border-gray-200 hover:border-purple-400 rounded-2xl p-5 text-center transition-colors"
              >
                <div className="text-5xl mb-3">{AVATARS[i % AVATARS.length]}</div>
                <p className="text-sm font-medium text-gray-800">{learner.nickname}</p>
              </button>
            ))}

            {!adding && (
              <button
                onClick={() => setAdding(true)}
                className="bg-white border border-dashed border-gray-300 hover:border-purple-400 rounded-2xl p-5 text-center transition-colors"
              >
                <div className="text-4xl text-gray-400 mb-3">＋</div>
                <p className="text-sm text-gray-400">ついか</p>
              </button>
            )}
          </div>
        )}

        {adding && (
          <form onSubmit={handleAdd} className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 max-w-xs">
            <p className="text-sm font-medium text-gray-700 mb-3">ニックネームを　きめよう</p>
            <input
              autoFocus
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="たろう"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-purple-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-purple-600">
                ついか
              </button>
              <button type="button" onClick={() => setAdding(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
                やめる
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
