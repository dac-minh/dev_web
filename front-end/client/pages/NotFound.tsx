import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-6">
        <h1 className="text-5xl font-extrabold mb-3">404</h1>
        <p className="text-base text-muted-foreground mb-6">
          Oops! Page not found.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
