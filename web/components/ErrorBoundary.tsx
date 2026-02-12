"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">오류가 발생했습니다</h1>
            <p className="text-gray-400 mb-6">
              예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 다시 시도해주세요.
            </p>
            {this.state.error && process.env.NODE_ENV === "development" && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                  오류 상세 정보
                </summary>
                <pre className="text-xs bg-gray-900 p-4 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => window.location.reload()}
                className="bg-yellow-600 text-black hover:bg-yellow-500"
              >
                페이지 새로고침
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
                className="border-yellow-600/50 text-yellow-400 hover:bg-yellow-600/10"
              >
                홈으로
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
