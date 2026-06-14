import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { logDataLoadFailure } from "@/lib/safe-request";

type BoundaryState = { error: Error | null; resetKey: number };

export class SectionBoundary extends Component<
  { children: ReactNode; name?: string; className?: string },
  BoundaryState
> {
  state: BoundaryState = { error: null, resetKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<BoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logDataLoadFailure(this.props.name ?? "section", error, {
      componentStack: info.componentStack?.slice(0, 3000),
    });
  }

  reset = () => this.setState((s) => ({ error: null, resetKey: s.resetKey + 1 }));

  render() {
    if (this.state.error) {
      return (
        <SectionErrorFallback
          error={this.state.error}
          title="This section failed to load."
          onRetry={this.reset}
          className={this.props.className}
        />
      );
    }
    return <div key={this.state.resetKey}>{this.props.children}</div>;
  }
}

export function SectionSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3 rounded-2xl border border-border/60 bg-card/30 p-4", className)}>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function SectionErrorFallback({
  error,
  title = "This section failed to load.",
  onRetry,
  className,
}: {
  error?: unknown;
  title?: string;
  onRetry?: () => void | Promise<void>;
  className?: string;
}) {
  const message = error instanceof Error ? error.message : undefined;
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-foreground",
        className,
      )}
    >
      <div className="flex gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-muted-foreground">
            {message || "Try again. The rest of the page is still available."}
          </p>
          {onRetry && (
            <Button size="sm" variant="outline" className="mt-3" onClick={() => void onRetry()}>
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
