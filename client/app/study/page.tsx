import { Suspense } from "react";
import { TestLab } from "@/components/TestLab";

export default function StudyPage() {
  return (
    <Suspense>
      <TestLab />
    </Suspense>
  );
}
