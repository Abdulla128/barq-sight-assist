import { Link, useRouter } from "@tanstack/react-router";
import { claimsStore } from "@/lib/claims-store";
import barqLogoAsset from "@/assets/barq-logo.png.asset.json";

export function BarqHeader({ children }: { children?: React.ReactNode }) {
  const router = useRouter();

  function handleReset() {
    claimsStore.reset();
    router.navigate({ to: "/" });
  }

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={barqLogoAsset.url}
            alt="Barq logo"
            className="h-8 w-8"
            width={32}
            height={32}
          />
          <span className="text-2xl font-semibold tracking-tight text-foreground">Barq</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Reset demo data
          </button>
          {children}
        </div>
      </div>
    </header>
  );
}
