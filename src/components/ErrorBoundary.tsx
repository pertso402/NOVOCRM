import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="glass-card p-8 max-w-md w-full text-center space-y-6 animate-scale-in">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Ops! Algo deu errado</h1>
              <p className="text-muted-foreground text-sm">
                Ocorreu um erro inesperado na aplicação. Tente recarregar a página.
              </p>
              {this.state.error && (
                <pre className="mt-4 p-4 bg-secondary/50 rounded-lg text-[10px] text-left overflow-auto max-h-32 font-mono text-destructive">
                  {this.state.error.toString()}
                </pre>
              )}
            </div>
            <Button 
              className="w-full gap-2" 
              onClick={() => window.location.reload()}
            >
              <RefreshCcw className="w-4 h-4" />
              Recarregar Sistema
            </Button>
          </div>
        </div>
      );
    }

    return this.children;
  }
}
