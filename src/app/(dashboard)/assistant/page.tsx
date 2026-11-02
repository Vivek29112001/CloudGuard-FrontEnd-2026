import { AssistantPage } from "@/features/assistant/assistant-page";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ chat?: string }>;
}) {
  const params = await searchParams;
  return <AssistantPage initialChat={params.chat} />;
}
