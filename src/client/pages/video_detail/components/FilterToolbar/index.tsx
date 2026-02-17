import { useRef } from "react";
import { getMethodColor } from "src/client/pages/video_detail/utils/helper";


// ─── FilterToolbar ────────────────────────────────────────────────────────────
interface FilterToolbarProps {
  availableMethods: string[];
  selectedMethods: Set<string>;
  onToggleMethod: (m: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalCount: number;
  visibleCount: number;
}

export default function FilterToolbar({
  availableMethods,
  selectedMethods,
  onToggleMethod,
  searchQuery,
  onSearchChange,
  totalCount,
  visibleCount,
}: FilterToolbarProps) {
  const isFiltered = selectedMethods.size > 0 || searchQuery.trim() !== "";
  const searchRef  = useRef<HTMLInputElement>(null);

  return (
    <div style={{
      borderBottom: "1px solid #141820",
      background: "#0a0c10",
      flexShrink: 0,
    }}>
      {/* ── Search row ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "8px 14px",
        borderBottom: "1px solid #0f1218",
      }}>
        {/* Magnifier icon */}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3d4451" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>

        <input
          ref={searchRef}
          type="text"
          placeholder="Search url, method, headers, body…"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            color: "#a0aec0",
            letterSpacing: "0.02em",
          }}
        />

        {/* Clear button */}
        {searchQuery && (
          <button
            onClick={() => { onSearchChange(""); searchRef.current?.focus(); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#4a5568", fontSize: "11px", padding: "0 2px",
              lineHeight: 1, transition: "color .15s",
              fontFamily: "'JetBrains Mono', monospace",
            }}
            title="Clear search"
          >
            ✕
          </button>
        )}

        {/* Result count */}
        <span style={{
          fontSize: "9px", color: isFiltered ? "#fb923c" : "#2d3748",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.06em", flexShrink: 0,
          transition: "color .2s",
        }}>
          {isFiltered ? `${visibleCount}/${totalCount}` : `${totalCount}`}
        </span>
      </div>

      {/* ── Method chips row ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "5px",
        padding: "7px 14px",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}>
        <span style={{ fontSize: "8px", color: "#2d3748", letterSpacing: "0.08em", marginRight: "2px", flexShrink: 0 }}>
          METHOD
        </span>

        {/* "All" chip */}
        <button
          onClick={() => {
            if (selectedMethods.size === 0) {
              // select all available
              availableMethods.forEach(m => onToggleMethod(m));
            } else {
              // deselect all
              availableMethods.forEach(m => {
                if (selectedMethods.has(m)) onToggleMethod(m);
              });
            }
          }}
          style={{
            padding: "2px 8px",
            borderRadius: "3px",
            border: `1px solid ${selectedMethods.size === 0 ? "#1e2433" : "#1e2433"}`,
            background: selectedMethods.size === 0 ? "rgba(255,255,255,0.06)" : "transparent",
            color: selectedMethods.size === 0 ? "#a0aec0" : "#3d4451",
            fontSize: "9px", fontWeight: "700",
            letterSpacing: "0.08em",
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
            transition: "all .12s",
            flexShrink: 0,
          }}
        >
          ALL
        </button>

        {availableMethods.map(method => {
          const color   = getMethodColor(method as any);
          const active  = selectedMethods.has(method);
          return (
            <button
              key={method}
              onClick={() => onToggleMethod(method)}
              style={{
                padding: "2px 8px",
                borderRadius: "3px",
                border: `1px solid ${active ? color + "60" : "#1a2030"}`,
                background: active ? `${color}18` : "transparent",
                color: active ? color : "#3d4451",
                fontSize: "9px", fontWeight: "700",
                letterSpacing: "0.08em",
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                transition: "all .12s",
                flexShrink: 0,
                boxShadow: active ? `0 0 8px ${color}22` : "none",
              }}
            >
              {method}
            </button>
          );
        })}

        {/* Clear filters shortcut */}
        {selectedMethods.size > 0 && (
          <button
            onClick={() => availableMethods.forEach(m => { if (selectedMethods.has(m)) onToggleMethod(m); })}
            style={{
              marginLeft: "auto",
              padding: "2px 7px",
              borderRadius: "3px",
              border: "1px solid #1a2030",
              background: "transparent",
              color: "#3d4451",
              fontSize: "8px",
              cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.06em",
              flexShrink: 0,
              transition: "color .12s",
            }}
          >
            clear
          </button>
        )}
      </div>
    </div>
  );
}