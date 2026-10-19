import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface CustomSelectOption {
  label: string;
  shortLabel?: string;
  value: string;
  fontFamily?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  title?: string;
  ariaLabel?: string;
  className?: string;
  minWidth?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  title,
  ariaLabel,
  className = "",
  minWidth = "110px",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Match the selected option (exact match or fallback substring check)
  const selectedOption =
    options.find((opt) => opt.value === value) ||
    options.find(
      (opt) =>
        opt.value &&
        value &&
        (opt.value.toLowerCase().includes(value.toLowerCase()) ||
          value.toLowerCase().includes(opt.value.toLowerCase()))
    );

  const displayLabel = selectedOption
    ? selectedOption.shortLabel || selectedOption.label
    : placeholder;

  // Close dropdown on click outside or Escape key press
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
      style={{ minWidth }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onMouseDown={(e) => {
          // Prevent stealing focus from the editor before opening
          e.preventDefault();
        }}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-8 w-full px-2.5 py-1 text-xs font-medium bg-surface text-text border rounded-xl flex items-center justify-between gap-1.5 transition-all duration-150 cursor-pointer outline-none select-none ${
          isOpen
            ? "border-text/30 ring-1 ring-text/10 bg-hover/70"
            : "border-border hover:bg-hover hover:border-border active:scale-98"
        }`}
        title={title}
        aria-label={ariaLabel || title}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className="truncate"
          style={{ fontFamily: selectedOption?.fontFamily || "inherit" }}
        >
          {displayLabel}
        </span>
        <ChevronDown
          size={13}
          className={`text-muted transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-text" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute top-9 left-0 min-w-full w-max max-w-[200px] max-h-60 overflow-y-auto bg-surface/95 backdrop-blur-md border border-border shadow-[0_8px_24px_rgba(0,0,0,0.12)] rounded-xl p-1 pr-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
        >
          {options.map((option) => {
            const isSelected = selectedOption
              ? option.value === selectedOption.value
              : option.value === value;

            return (
              <button
                key={option.label}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => {
                  // Prevent stealing focus from TipTap selection
                  e.preventDefault();
                }}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer select-none ${
                  isSelected
                    ? "bg-hover font-semibold text-text"
                    : "text-text hover:bg-hover/80 font-normal"
                }`}
                style={{ fontFamily: option.fontFamily || "inherit" }}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && (
                  <Check
                    size={13}
                    strokeWidth={2.5}
                    className="text-text shrink-0 ml-2"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

