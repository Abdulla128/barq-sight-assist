import { Link } from "@tanstack/react-router";

export function BarqHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold tracking-tight text-foreground">Barq</span>
          <span className="text-sm text-muted-foreground">Barq routes. Humans decide.</span>
        </Link>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </header>
  );
}
