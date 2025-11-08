
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4 text-primary">404</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Oops! The soil expert couldn't find this page.
          </p>
          <Button asChild className="mb-2">
            <Link to="/">Return to Home</Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-6">
            Looking for soil advice? Try our 
            <Link to="/soil-analyzer" className="text-primary hover:underline mx-1">
              Soil Analyzer
            </Link>
            or
            <Link to="/recommendations" className="text-primary hover:underline mx-1">
              Recommendations
            </Link>
            pages instead.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
