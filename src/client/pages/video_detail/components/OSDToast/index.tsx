interface OSDToastProps {
  message?: string
}

export default function OSDToast({ message }: OSDToastProps) {
  if (!message) return null;
  return (
    <div style={{ position: "absolute", bottom: "56px", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)", color: "#e2e8f0", fontFamily: "'JetBrains Mono',monospace", fontSize: "12px", padding: "5px 16px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 20, animation: "osdIn .15s ease" }}>
      {message}
    </div>
  );
}