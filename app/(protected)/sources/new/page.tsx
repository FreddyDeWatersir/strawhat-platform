import { ProviderForm } from "@/components/ProviderForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NewProviderPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link href="/sources" className="text-sm text-gold hover:underline">
          ← Sources
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-gold">Add provider</h1>
        <p className="text-sm text-muted">
          Add a new sourcing channel — JP retailer, proxy, exporter, or Italian
          contact.
        </p>
      </div>

      <ProviderForm />
    </div>
  );
}
