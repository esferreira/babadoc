import { getArtifactFormData } from "@/actions/artifact";
import { NewArtifactForm } from "./NewArtifactForm";

export const metadata = {
  title: "Novo Artifact — Babadoc",
};

export default async function NewArtifactPage() {
  const formData = await getArtifactFormData();

  return (
    <main className="flex-1 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Novo Artifact
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Defina o tipo e identidade do artifact. Você poderá preencher a documentação em seguida.
          </p>
        </div>

        {/* Form card */}
        <div className="baba-card p-8">
          <NewArtifactForm formData={formData} />
        </div>
      </div>
    </main>
  );
}
