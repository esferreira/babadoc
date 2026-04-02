import { getQuestions } from "@/actions/admin";
import { QuestionsTable } from "./QuestionsTable";

export default async function AdminQuestionsPage() {
  const questions = await getQuestions();
  return <QuestionsTable questions={questions} />;
}
