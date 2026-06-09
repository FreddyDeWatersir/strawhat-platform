import { createServiceClient } from "@/lib/supabase/server";
import type {
  WholesaleChangeRow,
  WholesaleListingRow,
} from "@/lib/sources/scrapers/types";

export async function latestWholesaleListings(): Promise<WholesaleListingRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("wholesale_listings")
    .select("*")
    .order("observed_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as WholesaleListingRow[];
  const seen = new Set<number>();
  const latest: WholesaleListingRow[] = [];

  for (const row of rows) {
    if (seen.has(row.variant_id)) continue;
    seen.add(row.variant_id);
    latest.push(row);
  }

  return latest;
}

export async function recentWholesaleChanges(
  limit = 50,
): Promise<WholesaleChangeRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("wholesale_changes")
    .select("*")
    .order("detected_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as WholesaleChangeRow[];
}

export async function unnotifiedWholesaleChanges(): Promise<
  WholesaleChangeRow[]
> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("wholesale_changes")
    .select("*")
    .is("notified_at", null)
    .order("detected_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as WholesaleChangeRow[];
}

export async function markWholesaleChangesNotified(
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("wholesale_changes")
    .update({ notified_at: new Date().toISOString() })
    .in("id", ids);

  if (error) throw new Error(error.message);
}
