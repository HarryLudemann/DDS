export function Footer() {
  return (
    <footer className="border-t border-zinc-200">
      <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-zinc-600">
        © {new Date().getFullYear()} Author Name. All rights reserved.
      </div>
    </footer>
  );
}
