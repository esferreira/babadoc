import { getApplicabilityMatrix } from "@/actions/applicability";
import { ApplicabilityMatrix } from "./ApplicabilityMatrix";

export default async function AdminApplicabilityPage() {
  const { questions, matrix } = await getApplicabilityMatrix();

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          🎛️ Matriz de Aplicabilidade
        </h2>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Defina quais perguntas são obrigatórias, desejáveis ou não se aplicam para cada tipo de artefato.
          Isso determina o score de documentação e quais perguntas aparecem no roteiro.
        </p>
      </div>
      <ApplicabilityMatrix questions={questions} matrix={matrix} />
    </div>
  );
}
