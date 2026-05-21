import { useEffect, useRef } from "react";

interface Props { value: string; onChange: (v: string) => void; length?: number }

export function CodeInput({ value, onChange, length = 6 }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = value.padEnd(length, " ").slice(0, length).split("");
  useEffect(() => { refs.current[0]?.focus(); }, []);

  const setAt = (i: number, c: string) => {
    const next = (value + " ".repeat(length)).slice(0, length).split("");
    next[i] = c || " ";
    onChange(next.join("").replace(/ +$/, "").toUpperCase());
  };

  return (
    <div className="flex gap-2 justify-center">
      {chars.map((c, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={c.trim()}
          maxLength={1}
          inputMode="text"
          onChange={(e) => {
            const v = e.target.value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
            setAt(i, v);
            if (v && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !chars[i].trim() && i > 0) refs.current[i - 1]?.focus();
          }}
          className="w-11 h-12 text-center text-subtitle font-display bg-white rounded-[10px_12px_10px_14px] outline-none border-2 transition-colors"
          style={{ borderColor: c.trim() ? "#FF6B6B" : "#2D3436" }}
        />
      ))}
    </div>
  );
}
