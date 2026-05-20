import { createServiceClient } from "@/lib/supabase/server";
import type {
  ProviderListingRow,
  ProviderListingWithProvider,
  ProviderRow,
} from "@/lib/supabase/server";
import { TIER_ORDER } from "@/lib/sources/format";

export type LatestListingKey = {
  provider_id: string;
  set_code: string;
  product_type: string;
};

export type LatestListing = ProviderListingRow & {
  provider?: Pick<ProviderRow, "id" | "name" | "tier" | "url" | "is_active">;
};

export async function listProviders(activeOnly = true): Promise<ProviderRow[]> {
  const supabase = createServiceClient();
  let query = supabase.from("providers").select("*").order("name");

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ProviderRow[];
}

export async function getProvider(id: string): Promise<ProviderRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as ProviderRow;
}

export async function listListingsForProvider(
  providerId: string,
): Promise<ProviderListingRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("provider_listings")
    .select("*")
    .eq("provider_id", providerId)
    .order("observed_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ProviderListingRow[];
}

/** Most recent observation per (provider_id, set_code, product_type). */
export async function latestListingsBySet(): Promise<LatestListing[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("provider_listings")
    .select("*, providers(id, name, tier, url, is_active)")
    .order("observed_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as (ProviderListingRow & {
    providers: LatestListing["provider"];
  })[];

  const seen = new Set<string>();
  const latest: LatestListing[] = [];

  for (const row of rows) {
    const key = `${row.provider_id}:${row.set_code}:${row.product_type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const { providers: provider, ...listing } = row;
    latest.push({ ...listing, provider });
  }

  return latest;
}

export async function latestListingsForProvider(
  providerId: string,
  setCodes?: string[],
): Promise<ProviderListingRow[]> {
  const all = await listListingsForProvider(providerId);
  const seen = new Set<string>();
  const latest: ProviderListingRow[] = [];

  for (const row of all) {
    const key = `${row.set_code}:${row.product_type}`;
    if (seen.has(key)) continue;
    if (setCodes && !setCodes.includes(row.set_code)) continue;
    seen.add(key);
    latest.push(row);
  }

  return latest;
}

export async function recentListings(
  limit = 5,
): Promise<ProviderListingWithProvider[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("provider_listings")
    .select("*, providers(id, name, tier, url)")
    .order("observed_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as ProviderListingWithProvider[];
}

export function groupProvidersByTier(
  providers: ProviderRow[],
): Map<number, ProviderRow[]> {
  const grouped = new Map<number, ProviderRow[]>();
  for (const tier of TIER_ORDER) {
    const tierProviders = providers.filter((p) => p.tier === tier);
    if (tierProviders.length > 0) {
      grouped.set(TIER_ORDER.indexOf(tier) + 1, tierProviders);
    }
  }
  return grouped;
}

export type CompareRow = {
  set_code: string;
  product_type: string;
};

export function buildCompareMatrix(
  providers: ProviderRow[],
  latest: LatestListing[],
): {
  rows: CompareRow[];
  cells: Map<string, LatestListing>;
} {
  const activeProviderIds = new Set(providers.map((p) => p.id));
  const filtered = latest.filter(
    (l) => l.provider?.is_active !== false && activeProviderIds.has(l.provider_id),
  );

  const rowKeys = new Set<string>();
  const cells = new Map<string, LatestListing>();

  for (const listing of filtered) {
    const rowKey = `${listing.set_code}\0${listing.product_type}`;
    rowKeys.add(rowKey);
    const cellKey = `${listing.set_code}\0${listing.product_type}\0${listing.provider_id}`;
    if (!cells.has(cellKey)) {
      cells.set(cellKey, listing);
    }
  }

  const rows = [...rowKeys]
    .map((k) => {
      const [set_code, product_type] = k.split("\0");
      return { set_code, product_type };
    })
    .sort((a, b) => {
      const setCmp = a.set_code.localeCompare(b.set_code);
      if (setCmp !== 0) return setCmp;
      return a.product_type.localeCompare(b.product_type);
    });

  return { rows, cells };
}
