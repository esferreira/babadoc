"use client";

import { useState, useTransition } from "react";
import { createUser, updateUserRole, toggleUserActive } from "@/actions/admin";
import { ROLE_LABELS } from "@/lib/labels";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

export function UsersTable({ users: initialUsers }: { users: User[] }) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createUser(fd);
      if ("error" in res) setError(res.error ?? "Erro desconhecido");
      else { setSuccess("Usuário criado!"); setShowForm(false); setTimeout(() => setSuccess(null), 3000); }
    });
  }

  function handleRoleChange(userId: string, newRole: string) {
    startTransition(async () => {
      const res = await updateUserRole(userId, newRole);
      if ("error" in res) setError(res.error ?? "Erro desconhecido");
    });
  }

  function handleToggleActive(userId: string) {
    startTransition(async () => {
      const res = await toggleUserActive(userId);
      if ("error" in res) setError(res.error ?? "Erro desconhecido");
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          👥 Gerenciar Usuários ({initialUsers.length})
        </h2>
        <button onClick={() => setShowForm(!showForm)} className="baba-button-primary text-sm">
          {showForm ? "Cancelar" : "+ Novo Usuário"}
        </button>
      </div>

      {(error || success) && (
        <div className="rounded-lg px-4 py-2 text-sm mb-4 animate-fade-in" style={{
          background: error ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
          border: `1px solid ${error ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
          color: error ? "#f87171" : "#4ade80",
        }}>
          {error || success}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="baba-card p-5 mb-4 grid grid-cols-2 gap-4 animate-fade-in">
          <div>
            <label className="baba-label">Email *</label>
            <input name="email" type="email" required className="baba-input" placeholder="user@empresa.com" />
          </div>
          <div>
            <label className="baba-label">Nome</label>
            <input name="name" className="baba-input" placeholder="Nome completo" />
          </div>
          <div>
            <label className="baba-label">Senha *</label>
            <input name="password" type="password" required minLength={6} className="baba-input" placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label className="baba-label">Perfil</label>
            <select name="role" className="baba-select">
              <option value="member">{ROLE_LABELS.member}</option>
              <option value="editor">{ROLE_LABELS.editor}</option>
              <option value="admin">{ROLE_LABELS.admin}</option>
            </select>
          </div>
          <div className="col-span-2">
            <button type="submit" disabled={isPending} className="baba-button-primary">
              {isPending ? "Criando..." : "Criar Usuário"}
            </button>
          </div>
        </form>
      )}

      <div className="baba-card overflow-hidden">
        <table className="baba-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {initialUsers.map((user) => (
              <tr key={user.id} style={{ opacity: user.isActive ? 1 : 0.5 }}>
                <td className="font-medium">{user.name ?? "—"}</td>
                <td style={{ color: "var(--text-secondary)" }}>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={isPending}
                    className="baba-select text-xs"
                    style={{ maxWidth: "120px", padding: "4px 8px" }}
                  >
                    <option value="member">{ROLE_LABELS.member}</option>
                    <option value="editor">{ROLE_LABELS.editor}</option>
                    <option value="admin">{ROLE_LABELS.admin}</option>
                  </select>
                </td>
                <td>
                  <span className={`baba-badge ${user.isActive ? "baba-badge-published" : "baba-badge-archived"}`}>
                    {user.isActive ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => handleToggleActive(user.id)}
                    disabled={isPending}
                    className="text-xs px-3 py-1 rounded-lg transition-colors"
                    style={{
                      background: user.isActive ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                      color: user.isActive ? "#f87171" : "#4ade80",
                      border: `1px solid ${user.isActive ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
                    }}
                  >
                    {user.isActive ? "Desativar" : "Reativar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-xl p-4" style={{ background: "var(--bg-input)" }}>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          <strong>Permissões:</strong> Administrador = acesso total | Editor = editar artefatos e respostas | Membro = visualização e preencher suas respostas
        </p>
      </div>
    </div>
  );
}
