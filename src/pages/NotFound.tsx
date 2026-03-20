import { useEffect } from "react";
import { useStore } from "@/lib/store";

const NotFound = () => {
  const { setView } = useStore();
  const pathName = window.location.pathname;

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", pathName);
  }, [pathName]);

  const handleGoHome = () => {
    window.history.replaceState(null, "", "/");
    setView('dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <button onClick={handleGoHome} className="text-primary underline hover:text-primary/90">
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
