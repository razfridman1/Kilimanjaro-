import type { Metadata } from "next";
import { GenerateView } from "@/components/views/generate-view";

export const metadata: Metadata = {
  title: "קילימנג'רו",
};

export default function DashboardPage() {
  return <GenerateView />;
}
