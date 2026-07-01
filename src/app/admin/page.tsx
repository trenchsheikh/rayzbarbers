import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { listActiveServices } from "@/lib/services-data";
import { getAdminUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const services = await listActiveServices();
  return <AdminDashboard initialServices={services} />;
}
