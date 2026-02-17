import { NetworkItemType } from "src/shared/types";
import { formatSeconds, getMethodColor } from "src/client/pages/video_detail/utils/helper";
import useApiHook from "src/client/hooks/useApiHook";
import { browserService } from "src/client/services";
import { useEffect } from "react";


interface DetailPanelProps {
    item: NetworkItemType | null
}

export default function DetailPanel({ item }: DetailPanelProps) {
    const { data, loading, error, hitApi, reset } = useApiHook({ callback: browserService.apiRequest })
    useEffect(() => {
        if (data) {
            console.log("API data: ", data)
        }
    }, [data])

    useEffect(() => {
        reset()
    }, [item])

    if (!item) return (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#2d3748", fontFamily: "'JetBrains Mono',monospace", fontSize: "12px" }}>
            ← click a request · video seeks to start time
        </div>
    );
    const mc = getMethodColor(item.method as any);
    return (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", fontFamily: "'JetBrains Mono',monospace", fontSize: "11px" }}>
            <div style={{ marginBottom: "14px", display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", justifyContent: "space-between" }} >
                <div style={{ color: "#94a3b8", fontSize: "10px", letterSpacing: "0.1em" }}>REQUEST DETAILS</div>
            </div>
            <div style={{ marginBottom: "16px" }}>
                <div style={{ color: "#4a5568", fontSize: "9px", letterSpacing: "0.08em", marginBottom: "4px" }}>URL</div>
                <div style={{ color: "#a0aec0", wordBreak: "break-all", lineHeight: "1.6", background: "rgba(255,255,255,0.03)", padding: "8px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.05)" }}>{item.url}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                {[{ label: "METHOD", value: item.method, color: mc }, { label: "START", value: formatSeconds(item.start_seconds), color: "#e2e8f0" }, { label: "END", value: formatSeconds(item.end_seconds), color: "#e2e8f0" }].map(({ label, value, color }) => (
                    <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", padding: "8px" }}>
                        <div style={{ color: "#4a5568", fontSize: "9px", letterSpacing: "0.08em", marginBottom: "4px" }}>{label}</div>
                        <div style={{ color, fontWeight: "700", fontSize: "12px" }}>{value}</div>
                    </div>
                ))}
            </div>
            {Object.keys(item.headers).length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                    <div style={{ color: "#4a5568", fontSize: "9px", letterSpacing: "0.08em", marginBottom: "6px" }}>HEADERS</div>
                    {/* <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
            {Object.entries(item.headers).map(([k, v], i, arr) => (
              <div key={k} style={{ display: "flex", padding: "6px 8px", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", gap: "10px" }}>
                <span style={{ color: "#60a5fa", minWidth: "140px", flexShrink: 0 }}>{k}</span>
                <span style={{ color: "#a0aec0", wordBreak: "break-all" }}>{v}</span>
              </div>
            ))}
          </div> */}
                    <table style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                        {Object.entries(item.headers).map(([k, v], i, arr) => (
                            <tr key={k} style={{ padding: "6px 8px", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                                <td style={{ color: "#60a5fa", padding: "10px" }}>{k}</td>
                                <td style={{ color: "#a0aec0", padding: "10px", wordBreak: "break-all" }}>{v}</td>
                            </tr>
                        ))}
                    </table>
                </div>
            )}
            {item.post_data_json && (
                <div style={{ marginBottom: "10px" }}>
                    <div style={{ color: "#4a5568", fontSize: "9px", letterSpacing: "0.08em", marginBottom: "6px" }}>BODY (JSON)</div>
                    <pre style={{ userSelect: "text", margin: 0, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "4px", padding: "10px", color: "#a0aec0", overflowX: "auto", lineHeight: "1.6", fontSize: "11px" }}>
                        {JSON.stringify(item.post_data_json, null, 2)}
                    </pre>
                </div>
            )}
            {!data && (
                <div style={{marginBottom: "10px"}} >
                    {!error && (
                    <button
                        style={{
                            fontSize: "9px", fontWeight: "700", letterSpacing: "0.1em",
                            color: mc, background: `${mc}18`,
                            padding: "2px 7px", borderRadius: "3px",
                            border: `1px solid ${mc}35`,
                            flexShrink: 0,
                            cursor: "pointer",
                        }}
                        onClick={() => { hitApi(item) }}
                        disabled={loading}
                    >
                        REQUEST
                    </button>
                    )}
                    {!!error && (
                        <>
                            <p style={{color: mc, border: `1px solid ${mc}35`}} >{error.message}</p>
                        </>
                    )}
                </div>
            )}
            {data && (
                <div style={{ marginBottom: "10px" }}>
                    <div style={{ color: "#4a5568", fontSize: "9px", letterSpacing: "0.08em", marginBottom: "6px" }}>RESPONSE</div>
                    <pre style={{ userSelect: "text", margin: 0, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "4px", padding: "10px", color: "#a0aec0", overflowX: "auto", lineHeight: "1.6", fontSize: "11px" }}>
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}