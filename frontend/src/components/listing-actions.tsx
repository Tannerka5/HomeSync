import { Heart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

type BaseProps = {
  disabled?: boolean;
  className?: string;
};

type ChatActionProps = BaseProps & {
  onClick: () => void;
  label?: string;
};

type HeartActionProps = BaseProps & {
  onClick: () => void;
  inBoard: boolean;
  loading?: boolean;
  hoverLabel: string;
};

export function ListingChatAction({
  onClick,
  disabled,
  className,
  label = "Send to chat",
}: ChatActionProps) {
  return (
    <div className={`inline-flex flex-row-reverse items-center gap-2 ${className ?? ""}`}>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="peer h-8 w-8 rounded-full bg-black/20 text-white hover:bg-white hover:text-primary backdrop-blur-sm transition-colors"
        aria-label={label}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }}
        disabled={disabled}
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
      <span className="rounded-md border border-border/40 bg-background/90 px-2 py-1 text-[11px] font-semibold text-foreground whitespace-nowrap opacity-0 translate-x-1 transition-all duration-200 peer-hover:opacity-100 peer-hover:translate-x-0 peer-focus-visible:opacity-100 peer-focus-visible:translate-x-0">
        {label}
      </span>
    </div>
  );
}

export function ListingHeartAction({
  onClick,
  inBoard,
  loading,
  disabled,
  hoverLabel,
  className,
}: HeartActionProps) {
  return (
    <div className={`relative group/heart inline-flex flex-row-reverse items-center gap-2 ${className ?? ""}`}>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={`peer h-8 w-8 rounded-full backdrop-blur-sm transition-colors ${inBoard ? "bg-pink-500/20 text-pink-500 hover:bg-pink-500/30" : "bg-black/20 text-white hover:bg-white hover:text-red-500"}`}
        aria-label={hoverLabel}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }}
        disabled={loading || disabled}
      >
        <Heart className="h-4 w-4" fill={inBoard ? "currentColor" : "none"} />
      </Button>
      <span className="rounded-md border border-border/40 bg-background/90 px-2 py-1 text-[11px] font-semibold text-foreground whitespace-nowrap opacity-0 translate-x-1 transition-all duration-200 peer-hover:opacity-100 peer-hover:translate-x-0 peer-focus-visible:opacity-100 peer-focus-visible:translate-x-0">
        {hoverLabel}
      </span>
    </div>
  );
}

