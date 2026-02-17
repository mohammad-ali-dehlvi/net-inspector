
interface KbdPillProps {
    keys: string[]
    label: string
}

export default function KbdPill({ keys, label }: KbdPillProps) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
      {keys.map(k => <span key={k} style={{ background: "#141820", border: "1px solid #1e2433", borderRadius: "3px", padding: "1px 5px", color: "#4a5568", fontSize: "9px", fontFamily: "'JetBrains Mono',monospace" }}>{k}</span>)}
      <span style={{ color: "#2d3748", fontFamily: "'JetBrains Mono',monospace", fontSize: "9px" }}>{label}</span>
    </span>
  );
}