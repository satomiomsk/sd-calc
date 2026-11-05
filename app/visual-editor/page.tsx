import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import VisualEditorClient from "./editor-client";

export const dynamic = "force-dynamic";

export default async function VisualEditorPage() {
  let session = null;
  try {
    session = await getSession();
  } catch {
    redirect("/developer");
  }

  if (!session) redirect("/developer");

  return <VisualEditorClient />;
}
