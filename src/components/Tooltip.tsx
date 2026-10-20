import { useState, useRef, useEffect, ReactNode } from "react";

interface TooltipProps {
  // Main tooltip label (e.g. "Bold" or "Bold (Ctrl+B)")
  content: string;
  // Optional explicit keyboard shortcut (e.g. "Ctrl+B")
  shortcut?: string;
  // Placement relative to the target element (defaults to "bottom")
  side?: "top" | "bottom";
  // The trigger button or element
  children: ReactNode;
  // Hover delay in milliseconds before appearing
  delay?: number;
}

export default function Tooltip({
  content,
  shortcut,
  side = "bottom",
  children,
  delay = 200,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // If shortcut is not explicitly provided, automatically extract (Ctrl+...) from content
  let label = content;
  let detectedShortcut = shortcut;
  if (!detectedShortcut) {
    const match = content.match(/\((Ctrl\+[A-Za-z0-9]+)\)/);
    if (match) {
      label = content.replace(match[0], "").trim();
      detectedShortcut = match[1];
    }
  }

  const show = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hide = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onMouseDown={hide} // Dismiss tooltip immediately on button press
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute left-1/2 -translate-x-1/2 px-2 py-0.5 bg-text text-surface border border-border rounded-none text-[10px] font-medium tracking-wide whitespace-nowrap shadow-[2px_2px_0px_var(--border)] z-50 pointer-events-none select-none flex items-center gap-1.5 animate-in fade-in duration-100 ${
            side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          <span>{label}</span>
          {detectedShortcut && (
            <kbd className="font-mono text-[9px] px-1 py-0.2 bg-surface text-text border border-border/40 font-semibold rounded-none">
              {detectedShortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
}
