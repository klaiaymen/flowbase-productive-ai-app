import { getDashboardData } from "@/app/actions/dashboard";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { LandingPage } from "@/components/landing/landing-page";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getDashboardData();
  
  if (!data) {
    return <LandingPage />;
  }

  return <DashboardClient initialData={data} />;
}
