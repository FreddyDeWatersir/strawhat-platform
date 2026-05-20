import { DocumentsList } from "@/components/DocumentsList";
import { UploadForm } from "@/components/UploadForm";
import { createServiceClient, type DocumentRow } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  let documents: DocumentRow[] = [];
  let error: string | null = null;

  try {
    const supabase = createServiceClient();
    const { data, error: dbError } = await supabase
      .from("documents")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (dbError) throw new Error(dbError.message);
    documents = (data ?? []) as DocumentRow[];
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load documents";
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gold">Documents</h1>
        <p className="text-sm text-muted">
          Upload invoices and shipping PDFs. Text is indexed for chat.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <UploadForm />
      <div>
        <h2 className="mb-3 text-lg font-semibold">All uploads</h2>
        <DocumentsList documents={documents} />
      </div>
    </div>
  );
}
