interface Props { checked: boolean; onChange: (b: boolean) => void; label?: string }

export function SketchToggle({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className="flex items-center gap-3"
    >
      <span
        className="relative w-12 h-7 rounded-full border-2 transition-colors"
        style={{ background: checked ? "#4ECDC4" : "#F4EDE2", borderColor: "#2D3436" }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white border-2 transition-transform"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)", borderColor: "#2D3436" }}
        />
      </span>
      {label && <span className="text-body-md font-bold">{label}</span>}
    </button>
  );
}
