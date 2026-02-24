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
            <AlertCircle className="h-16 w-16 text-violet-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">오류가 발생했습니다</h1>
            <p className="text-gray-400 mb-6">
              예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 다시 시도해주세요.
            </p>
            {this.state.error && process.env.NODE_ENV === "development" && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm text-[#b8a898] mb-2">
                  오류 상세 정보
                </summary>
                <pre className="text-xs bg-[#0d0b08] p-4 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white hover:from-indigo-600 hover:via-violet-600 hover:to-purple-600"
              >
                페이지 새로고침
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
                className="border-violet-600/50 text-violet-600 hover:bg-violet-600/10"
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
