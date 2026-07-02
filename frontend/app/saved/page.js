export const metadata = { title: "Saved" };

export default function SavedPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Saved Tours</h1>
      <p className="mt-2 text-slate-600">
        Tours you save will appear here. This requires logging in and will be
        built after authentication.
      </p>
    </div>
  );
}
