export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row">
        <p>
          <span className="font-semibold text-brand">CityMate</span> — Explore
          Nepal&apos;s culture &amp; heritage.
        </p>
        <p>&copy; {year} CityMate. For educational use.</p>
      </div>
    </footer>
  );
}
