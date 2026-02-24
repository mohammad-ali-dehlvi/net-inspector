import { findSimilarAPIs, formatSeconds, getMethodColor } from "src/client/pages/video_detail/utils/helper";
import useApiHook from "src/client/hooks/useApiHook";
import { browserService } from "src/client/services";
import { useEffect, useMemo, useState } from "react";
import { useVideoDetailContext } from "src/client/pages/video_detail/context/videoDetail";
import ContentRenderer from "src/client/pages/video_detail/components/ContentRenderer"
import { useVideoDetailPlayerContext } from "src/client/pages/video_detail/context/VideoDetailPlayerContext";
import cssStyles from "src/client/pages/video_detail/components/DetailPanel/style.module.css";
import { NetworkItemType } from "src/shared/types";
import Collapse from "src/client/components/Collapse";

interface DetailPanelProps {
    item?: NetworkItemType
}

export default function DetailPanel(props: DetailPanelProps) {
    const { item: propsItem } = props
    const { requests } = useVideoDetailContext()
    const { selectedIndex } = useVideoDetailPlayerContext()
    const [combineUrl, setCombineUrl] = useState<string | null>(null)

    const [openRequestHeader, setOpenRequestHeader] = useState(false)
    const [openResponseHeader, setOpenResponseHeader] = useState(false)

    const item = propsItem ?? requests?.[selectedIndex ?? -1] ?? null;

    const { data, loading, error, hitApi, reset } = useApiHook({ callback: browserService.apiRequest })

    const similarAPIs = useMemo(() => {
        if (!item || !requests) return []
        return findSimilarAPIs(item, requests)
    }, [item, requests])

    useEffect(() => {
        reset()
    }, [item])

    if (!item) return (
        <div className={cssStyles.emptyState}>
            ← click a request · video seeks to start time
        </div>
    );

    const mc = getMethodColor(item.request.method as any);

    const combineSimilarAPIs = async () => {
        // const similarAPIs = findSimilarAPIs(item, requests || [])
        if (similarAPIs.length <= 1) return
        if (!(item.response.body && "url" in item.response.body)) return
        const urls = similarAPIs
            .map(e => e.response.body && "url" in e.response.body ? e.response.body.url : undefined)
            .filter(Boolean) as string[]
        try {
            const promises = urls.map(async (url) => {
                const response = await fetch(url);

                // Handle Binary (Video, Audio, Image)
                return await response.blob();
            });

            const results = await Promise.all(promises);

            // Combine all blobs into one
            const superBlob = new Blob(results, { type: item.response.body.contentType || item.response.headers['content-type'] });

            const url = URL.createObjectURL(superBlob)
            console.log("Super blob url: ", url)

            // Create a URL that the <video> tag can play
            // return url;
            setCombineUrl(url)
        } catch (err) {
            console.error("Fetch failed", err);
            setCombineUrl(null)
        }
    }

    return (
        <div className={cssStyles.container}>
            <div className={cssStyles.headerRow}>
                <div className={cssStyles.sectionLabel}>REQUEST DETAILS</div>
            </div>

            {!!item.pageUrl && (
                <div style={{ marginBottom: "16px" }}>
                    <div className={cssStyles.fieldLabel}>PAGE URL</div>
                    <div className={cssStyles.urlValue}>{item.pageUrl}</div>
                </div>
            )}

            {similarAPIs.length > 1 && !combineUrl && (
                <button
                    className={cssStyles.requestButton}
                    style={{
                        color: mc,
                        background: `${mc}18`,
                        border: `1px solid ${mc}35`,
                    }}
                    onClick={() => { combineSimilarAPIs() }}
                    disabled={loading}
                >
                    COMBINE
                </button>
            )}
            {combineUrl && (
                <div style={{ marginBottom: "10px" }}>
                    <div className={cssStyles.fieldLabel}>COMBINE RESPONSE</div>
                    <div className={cssStyles.contentRendererWrapper}>
                        <ContentRenderer data={{
                            ...item.response.body,
                            url: combineUrl
                        }} />
                    </div>
                </div>
            )}

            {item.response.body && !combineUrl && (
                <div style={{ marginBottom: "10px" }}>
                    <div className={cssStyles.fieldLabel}>RESPONSE</div>
                    <div className={cssStyles.contentRendererWrapper}>
                        <ContentRenderer data={item.response.body} />
                    </div>
                </div>
            )}

            <div style={{ marginBottom: "16px" }}>
                <div className={cssStyles.fieldLabel}>URL</div>
                <div className={cssStyles.urlValue}>{item.request.url}</div>
            </div>

            <div className={cssStyles.gridContainer}>
                {[
                    { label: "METHOD", value: item.request.method, color: mc },
                    { label: "START", value: formatSeconds(item.startSeconds), color: "var(--text-main)" },
                    { label: "END", value: formatSeconds(item.endSeconds), color: "var(--text-main)" }
                ].map(({ label, value, color }) => (
                    <div key={label} className={cssStyles.gridItem}>
                        <div className={cssStyles.fieldLabel}>{label}</div>
                        <div className={cssStyles.gridValue} style={{ color }}>{value}</div>
                    </div>
                ))}
            </div>

            {Object.keys(item.request.headers).length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                    <div className={cssStyles.fieldLabel} style={{ cursor: "pointer" }} onClick={() => setOpenRequestHeader(p => !p)} >REQUEST HEADERS</div>
                    <Collapse in={openRequestHeader} >
                        <table className={cssStyles.tableContainer}>
                            <tbody>
                                {Object.entries(item.request.headers).map(([k, v]) => (
                                    <tr key={k} className={cssStyles.tableRow}>
                                        <td className={cssStyles.tableKey}>{k}</td>
                                        <td className={cssStyles.tableValue}>{v}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Collapse>
                </div>
            )}

            {Object.keys(item.response.headers).length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                    <div className={cssStyles.fieldLabel} style={{ cursor: "pointer" }} onClick={() => setOpenResponseHeader(p => !p)} >RESPONSE HEADERS</div>
                    <Collapse in={openResponseHeader} >
                        <table className={cssStyles.tableContainer}>
                            <tbody>
                                {Object.entries(item.response.headers).map(([k, v]) => (
                                    <tr key={k} className={cssStyles.tableRow}>
                                        <td className={cssStyles.tableKey}>{k}</td>
                                        <td className={cssStyles.tableValue}>{v}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Collapse>
                </div>
            )}

            {item.request.postDataJSON && (
                <div style={{ marginBottom: "10px" }}>
                    <div className={cssStyles.fieldLabel}>BODY (JSON)</div>
                    <pre className={cssStyles.jsonBlock}>
                        {JSON.stringify(item.request.postDataJSON, null, 2)}
                    </pre>
                </div>
            )}

            {!data && (
                <div style={{ marginBottom: "10px" }}>
                    <button
                        className={cssStyles.requestButton}
                        style={{
                            color: mc,
                            background: `${mc}18`,
                            border: `1px solid ${mc}35`,
                        }}
                        onClick={() => { hitApi({ request: item.request, pageUrl: item.pageUrl }) }}
                        disabled={loading}
                    >
                        REQUEST
                    </button>
                    {!!error && (
                        <p className={cssStyles.errorMessage} style={{ color: mc, border: `1px solid ${mc}35` }}>
                            {error.message}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}