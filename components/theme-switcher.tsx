"use client";

import { Button } from "@/components/ui/button";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const themes = ["light", "dark", "system"] as const;

const icons = {
  light: Sun,
  dark: Moon,
  system: Laptop,
};

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentIdx = themes.indexOf((theme as typeof themes[number]) || "system");
  const nextTheme = themes[(currentIdx + 1) % themes.length];
  const IconComponent = icons[(theme as typeof themes[number]) || "system"];
  const ICON_SIZE = 16;

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={`Change theme to ${nextTheme}`}
      onClick={() => setTheme(nextTheme)}
    >
      <IconComponent size={ICON_SIZE} className="text-muted-foreground" />
    </Button>
  );
};

export { ThemeSwitcher };
