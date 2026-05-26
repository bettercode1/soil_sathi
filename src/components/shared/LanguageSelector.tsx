import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGE_OPTIONS } from "@/constants/languages";
import { commonTranslations } from "@/constants/allTranslations";

export const LanguageSelector = () => {
  const { language, setLanguage, getLanguageName, t } = useLanguage();

  const indiaOptions = LANGUAGE_OPTIONS.filter((o) => o.group === "india");
  const northeastOptions = LANGUAGE_OPTIONS.filter((o) => o.group === "northeast");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 shrink-0">
          <Globe className="h-4 w-4" />
          <span className="hidden 2xl:inline-block">{getLanguageName(language)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[min(70vh,24rem)] overflow-y-auto">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t(commonTranslations.languageGroupIndia)}
        </DropdownMenuLabel>
        {indiaOptions.map((option) => (
          <DropdownMenuItem
            key={option.code}
            onClick={() => setLanguage(option.code)}
            className={language === option.code ? "bg-accent" : undefined}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t(commonTranslations.languageGroupNortheast)}
        </DropdownMenuLabel>
        {northeastOptions.map((option) => (
          <DropdownMenuItem
            key={option.code}
            onClick={() => setLanguage(option.code)}
            className={language === option.code ? "bg-accent" : undefined}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
