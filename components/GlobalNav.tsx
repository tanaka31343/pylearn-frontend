"use client";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLearnerStore } from "@/store/learnerStore";

interface Props {
  subtitle?: string;
  showBack?: boolean;
  backLabel?: string;
  backHref?: string;
}

export default function GlobalNav({ subtitle, showBack, backLabel = "← もどる", backHref }: Props) {
  const router = useRouter();
  const clearLearner = useLearnerStore((s) => s.clearLearner);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearLearner();
    router.push("/login");
  };

  return (
    <nav className="h-13 border-b border-gray-200 flex items-center px-7 gap-3 bg-white">
      <div className="w-8 h-8 rounded-lg bg-purple-300 flex items-center justify-center text-purple-800 font-medium text-sm">
        P
      </div>
      <span className="text-base font-medium text-gray-800">
        Pylearn{subtitle ? ` — ${subtitle}` : ""}
      </span>
      <div className="flex-1" />
      {showBack && (
        <button
          onClick={() => (backHref ? router.push(backHref) : router.back())}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1"
        >
          {backLabel}
        </button>
      )}
      <button
        onClick={handleLogout}
        className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1"
      >
        ログアウト
      </button>
    </nav>
  );
}
