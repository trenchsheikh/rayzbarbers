import { CustomerSite } from "@/components/customer-site";
import { getGoogleReviews } from "@/lib/google-reviews";
import { listActiveServices } from "@/lib/services-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [services, reviews] = await Promise.all([
    listActiveServices(),
    getGoogleReviews(),
  ]);
  return <CustomerSite services={services} reviews={reviews} />;
}
