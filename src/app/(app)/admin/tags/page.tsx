import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export const metadata = { title: "Tags — Babadoc" };

async function createTag(formData: FormData) {
  "use server";
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") return;

  const category = formData.get("category") as string;
  const value = formData.get("value") as string;
  const color = (formData.get("color") as string) || null;
  const icon = (formData.get("icon") as string) || null;

  if (!category || !value) return;

  await (prisma as any).tag.create({
    data: { category, value, color, icon },
  });

  revalidatePath("/admin/tags");
}

async function deleteTag(formData: FormData) {
  "use server";
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") return;

  const id = formData.get("id") as string;
  await (prisma as any).tag.delete({ where: { id } });
  revalidatePath("/admin/tags");
}

export default async function TagsPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/dashboard");

  const tags = await (prisma as any).tag.findMany({
    include: { _count: { select: { artifacts: true } } },
    orderBy: [{ category: "asc" }, { value: "asc" }],
  });

  const grouped = tags.reduce((acc: any, tag: any) => {
    if (!acc[tag.category]) acc[tag.category] = [];
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <main className="flex-1 p-8" style={{ maxWidth: 800, margin: "0 auto" }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          🏷️ Gestão de Tags
        </h1>
        <Link href="/admin" className="baba-button-secondary text-sm">← Admin</Link>
      </div>

      {/* Create tag form */}
      <form action={createTag} className="baba-card p-4 mb-8">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--accent-text)" }}>
          + Nova Tag
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="baba-label">Categoria</label>
            <select name="category" required className="baba-select">
              <option value="domain">Domínio</option>
              <option value="technology">Tecnologia</option>
              <option value="zone">Zona</option>
              <option value="criticality">Criticidade</option>
            </select>
          </div>
          <div>
            <label className="baba-label">Valor</label>
            <input name="value" required className="baba-input" placeholder="ex: SAP" />
          </div>
          <div>
            <label className="baba-label">Cor (hex)</label>
            <input name="color" className="baba-input" placeholder="#d4a017" />
          </div>
          <div>
            <label className="baba-label">Ícone (emoji)</label>
            <input name="icon" className="baba-input" placeholder="📦" />
          </div>
        </div>
        <button type="submit" className="baba-button-primary mt-3 text-sm">
          Criar Tag
        </button>
      </form>

      {/* Tags list */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
          Nenhuma tag cadastrada
        </div>
      ) : (
        Object.entries(grouped).map(([category, catTags]: [string, any]) => (
          <div key={category} className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--accent-text)" }}>
              {category} ({catTags.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {catTags.map((tag: any) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-muted)" }}
                >
                  {tag.icon && <span>{tag.icon}</span>}
                  <span
                    className="text-sm font-medium"
                    style={{ color: tag.color ?? "var(--text-primary)" }}
                  >
                    {tag.value}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    ({tag._count.artifacts})
                  </span>
                  <form action={deleteTag} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={tag.id} />
                    <button
                      type="submit"
                      className="text-xs px-1 rounded hover:bg-red-500/20"
                      style={{ color: "var(--danger)", cursor: "pointer", background: "none", border: "none" }}
                      title="Deletar tag"
                    >
                      ×
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </main>
  );
}
