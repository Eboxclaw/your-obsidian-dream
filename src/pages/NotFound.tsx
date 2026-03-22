import { useEffect } from "react";
import { useStore } from "@/lib/store";

const NotFound = () => {
  const navigate = useStore((s) => s.navigate);
  const attemptedPath = window.location.pathname;

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", attemptedPath);
  }, [attemptedPath]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-6">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">Oops! Page not found</p>
        <button
          type="button"
          aria-label="Go to dashboard"
          onClick={() => navigate("dashboard")}
          className="inline-flex items-center rounded-md px-4 py-2 font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
