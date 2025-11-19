
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { notFoundTranslations } from "@/constants/allTranslations";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-background px-2">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4 text-primary">{t(notFoundTranslations.title)}</h1>
          <p className="text-xl text-muted-foreground mb-8">
            {t(notFoundTranslations.message)}
          </p>
          <Button asChild className="mb-2">
            <Link to="/">{t(notFoundTranslations.returnHome)}</Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-6">
            {t(notFoundTranslations.lookingFor)}{" "}
            <Link to="/soil-analyzer" className="text-primary hover:underline mx-1">
              {t(notFoundTranslations.soilAnalyzer)}
            </Link>
            {" "}{t(notFoundTranslations.or)}{" "}
            <Link to="/recommendations" className="text-primary hover:underline mx-1">
              {t(notFoundTranslations.recommendations)}
            </Link>
            {" "}{t(notFoundTranslations.pagesInstead)}
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
