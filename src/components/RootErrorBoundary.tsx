import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "@/lib/error-reporter";
import { classifyError } from "@/lib/error-classify";
import { RefreshCw, LifeBuoy } from "lucide-react";

interface State {
  error: Error | null;
}

/**
 * Top-level React error boundary. Catches crashes that escape route-level
 * errorComponents (e.g. inside providers, layout shells, modals rendered
 * outside the route tree) and reports them to system_error_logs.
 *
 * Shows a context-aware, user-friendly message — never the raw error.
 */
export class RootErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError({
      source: "frontend",
      severity: "critical",
      message: error.message || "React render crash",
      stack: error.stack,
      payload: { componentStack: info.componentStack?.slice(0, 4000) ?? null },
    });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    const { title, message, kind } = classifyError(this.state.error, "page");
    return (
      <div role="alert" aria-live="assertive" className="bg-background px-4 py-8">
        <div className="mx-auto max-w-md rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-center">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            This section failed to load.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              onClick={this.reset}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" aria-hidden /> Try again
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Go home
            </a>
            {(kind === "server" || kind === "unknown") && (
              <a
                href="mailto:support@edumaster.app"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <LifeBuoy className="h-4 w-4" aria-hidden /> Contact support
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }
}

