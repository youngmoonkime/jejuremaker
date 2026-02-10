
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/30 text-center h-full min-h-[200px]">
                    <span className="material-icons-round text-4xl text-red-400 mb-3">error_outline</span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">오류가 발생했습니다</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 break-all max-w-xs mx-auto">
                        {this.state.error?.message || "알 수 없는 오류"}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                        다시 시도
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
