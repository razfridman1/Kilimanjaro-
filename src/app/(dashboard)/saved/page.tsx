import type { Metadata } from "next";
import { SavedView } from "@/components/views/saved-view";

export const metadata: Metadata = {
  title: "שמורים",
};

export default function SavedPage() {
  return <SavedView />;
}
