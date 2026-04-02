import { getUsers } from "@/actions/admin";
import { UsersTable } from "./UsersTable";

export default async function AdminUsersPage() {
  const users = await getUsers();
  return <UsersTable users={users} />;
}
