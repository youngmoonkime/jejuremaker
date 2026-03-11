import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    errorMessage: string;
}

// Show internal error details only in development
const IS_DEV = process.env.NODE_ENV === "development";

export class ErrorBoundary extends Component<Props, State> {
    declare props: Readonly<Props>;
    declare state: Readonly<State>;
    declare setState: Component<Props, State>['setState'];

    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, errorMessage: "" };
        this.handleReset = this.handleReset.bind(this);
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, errorMessage: error.message };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        const { onError } = this.props;
        if (onError) onError(error, errorInfo);
    }

    handleReset() {
        this.setState({ hasError: false, errorMessage: "" });
    }

    render() {
        const { hasError, errorMessage } = this.state;
        const { fallback, children } = this.props;

        if (hasError) {
            if (fallback) return fallback;

            return (
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/30 text-center h-full min-h-[200px]">
                    <span className="material-icons-round text-4xl text-red-400 mb-3">error_outline</span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">오류가 발생했습니다</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs mx-auto">
                        {IS_DEV
                            ? (errorMessage || "알 수 없는 오류")
                            : "일시적인 오류가 발생했습니다. 페이지를 새로고침해 주세요."}
                    </p>
                    <button
                        onClick={this.handleReset}
                        className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                        다시 시도
                    </button>
                </div>
            );
        }

        return children;
    }
}

export default ErrorBoundary;
