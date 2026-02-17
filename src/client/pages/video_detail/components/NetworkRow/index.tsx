import { useEffect, useRef } from "react";
import { NetworkItemType } from "src/shared/types";
import { formatSeconds, getDomain, getMethodColor, getPath } from "src/client/pages/video_detail/utils/helper";
import ProgressBar from "src/client/pages/video_detail/components/ProgressBar";


interface NetworkRowProps {
    item: NetworkItemType
    index: number
    isHighlighted: boolean
    duration: number
    onSelect: (n: number) => void
    onSeek: (n: number) => void
    isSelected: boolean
    rangeStart: number
    rangeEnd: number
}

export default function NetworkRow({ item, index, isHighlighted, duration, onSelect, onSeek, isSelected, rangeStart, rangeEnd }: NetworkRowProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const mc     = getMethodColor(item.method as any);

  useEffect(() => {
    if (isHighlighted && rowRef.current) rowRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [isHighlighted]);

  return (
    <div
      ref={rowRef}
      onClick={() => { onSelect(index); onSeek(item.start_seconds); }}
      title={`Jump to ${formatSeconds(item.start_seconds)}`}
      style={{ padding: "10px 14px", cursor: "pointer", borderLeft: `2px solid ${isHighlighted ? mc : isSelected ? "#3b5bdb" : "transparent"}`, background: isHighlighted ? `${mc}10` : isSelected ? "rgba(59,91,219,0.08)" : index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", transition: "background .15s, border-color .15s", position: "relative" }}
    >
      {isHighlighted && <span style={{ position: "absolute", top: "12px", right: "12px", width: "7px", height: "7px", borderRadius: "50%", background: mc, boxShadow: `0 0 6px ${mc}`, animation: "pulse 1s ease-in-out infinite" }} />}
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <span style={{ color: "#3d4451", fontSize: "10px", fontFamily: "'JetBrains Mono',monospace", minWidth: "18px", paddingTop: "1px", userSelect: "none" }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "11px", color: isHighlighted ? "#e2e8f0" : "#a0aec0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: "1.5" }} title={item.url}>
            <span style={{ color: "#4a5568" }}>{getDomain(item.url)}</span>
            <span style={{ color: isHighlighted ? "#cbd5e0" : "#718096" }}>{getPath(item.url)}</span>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "4px" }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em", color: mc, background: `${mc}18`, padding: "1px 6px", borderRadius: "3px", border: `1px solid ${mc}30` }}>{item.method}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", color: "#4a5568", display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ color: "#2d3748" }}>▶</span><span>{formatSeconds(item.start_seconds)}</span>
              <span style={{ color: "#2d3748", margin: "0 2px" }}>→</span>
              <span style={{ color: "#2d3748" }}>■</span><span>{formatSeconds(item.end_seconds)}</span>
            </span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", color: isHighlighted ? `${mc}cc` : "#3d4451" }}>{formatSeconds(item.end_seconds - item.start_seconds)} dur</span>
            <span style={{ marginLeft: "auto", fontSize: "9px", color: "#2d3748", fontFamily: "'JetBrains Mono',monospace" }}>↗ seek</span>
          </div>
          <ProgressBar item={item} duration={duration} isHighlighted={isHighlighted} rangeStart={rangeStart} rangeEnd={rangeEnd} />
        </div>
      </div>
    </div>
  );
}