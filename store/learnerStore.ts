import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Learner {
  id: number;
  nickname: string;
  avatar_key: string | null;
}

interface LearnerStore {
  currentLearner: Learner | null;
  setCurrentLearner: (learner: Learner) => void;
  clearLearner: () => void;
}

export const useLearnerStore = create<LearnerStore>()(
  persist(
    (set) => ({
      currentLearner: null,
      setCurrentLearner: (learner) => set({ currentLearner: learner }),
      clearLearner: () => set({ currentLearner: null }),
    }),
    { name: "learner-storage" }
  )
);
