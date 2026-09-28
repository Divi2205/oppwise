import { CheckIcon, AlertIcon, BanIcon } from "./Icons";

const STYLES = {
  go: { cls: "bg-go-bg text-go", Icon: CheckIcon, label: "Go for it" },
  tight: { cls: "bg-tight-bg text-tight", Icon: AlertIcon, label: "Tight" },
  skip: { cls: "bg-skip-bg text-skip", Icon: BanIcon, label: "Skip" },
};

export default function VerdictBadge({ verdict, large = false }) {
  const s = STYLES[verdict] || STYLES.tight;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold ${s.cls} ${large ? "px-4 py-1.5 text-base" : "px-2.5 py-1 text-xs"}`}>
      <s.Icon size={large ? 20 : 14} />
      {s.label}
    </span>
  );
}
