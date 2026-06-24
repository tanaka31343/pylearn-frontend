"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError("かくにんメールを　おくりました。メールを　かくにんしてください。");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/select-learner");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "エラーが　おきました";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-gray-200 overflow-hidden flex">
        {/* left panel */}
        <div className="w-1/2 bg-purple-100 flex flex-col items-center justify-center p-12">
          <div className="text-7xl mb-4">🐍</div>
          <p className="text-xl font-medium text-purple-800 mb-2">Pylearn</p>
          <p className="text-sm text-purple-600 text-center">たのしく　まなぼう　Python！</p>
        </div>

        {/* right panel */}
        <div className="w-1/2 p-10 flex flex-col justify-center">
          <h1 className="text-xl font-medium text-gray-800 mb-1">
            {isSignUp ? "あたらしく　つくる" : "おかえりなさい！"}
          </h1>
          <p className="text-sm text-gray-500 mb-7">
            ほごしゃの　かたは　{isSignUp ? "アカウントを　つくってください" : "ログインしてください"}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
            >
              {loading ? "しょりちゅう..." : isSignUp ? "アカウントを　つくる" : "ログイン"}
            </button>

            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
              className="text-sm text-purple-500 hover:text-purple-700 text-center"
            >
              {isSignUp ? "すでに　アカウントが　ある → ログイン" : "あたらしく　つくる"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
