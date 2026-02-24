import React, { CSSProperties, useEffect, useMemo } from "react";
import { buildDataUrl, createObjectUrlFromBinaryString, isString, normalizeBinaryString, safeJsonParse } from "src/client/pages/video_detail/utils/helper";
import cssStyles from "src/client/pages/video_detail/components/ContentRenderer/index.module.css";
import { useVideoDetailContext } from "src/client/pages/video_detail/context/videoDetail";
import { useVideoDetailPlayerContext } from "src/client/pages/video_detail/context/VideoDetailPlayerContext";
import { NetworkItemType } from "src/shared/types";

type ContentRendererProps = {
    contentType?: string | null;
    data?: string | NetworkItemType['response']['body'] | null;
}

export default function ContentRenderer({ contentType: propContentType, data: propData }: ContentRendererProps) {
    const { requests } = useVideoDetailContext()
    const { selectedIndex } = useVideoDetailPlayerContext()

    const item = !!requests && selectedIndex !== null ? requests[selectedIndex] : null;

    const contentType =
        propContentType ||
        (typeof propData === "object" && !!propData && "contentType" in propData ?
            propData['contentType'] :
            undefined
        ) ||
        item?.response.headers["content-type"] ||
        null
    const data = propData || item?.response.body

    const normalizedType = contentType?.toLowerCase() ?? ""

    const parsedJson = useMemo(() => {
        if (normalizedType.includes("application/json") && isString(data)) {
            return safeJsonParse(data)
        }
        return null
    }, [normalizedType, data])

    const binaryDataUrl = useMemo(() => {
        if (!isString(data)) return null
        if (
            normalizedType.startsWith("image/") ||
            normalizedType.startsWith("video/") ||
            normalizedType.startsWith("audio/")
        ) {
            try {
                return `data:${normalizedType};base64,${data}`
            } catch (err) {
                console.log(err)
                console.log({ normalizedType, data })
                return null
            }
        }
        return null
    }, [normalizedType, data])

    if (typeof data === "object" && !!data && "url" in data) {
        const url = `${data.url}`
        const contentType = normalizedType
        const style: CSSProperties = { width: "100%", maxWidth: "400px", maxHeight: "200px", objectFit: "contain", color: "#94a3b8" }
        if (contentType?.startsWith("image/")) {
            return <img src={url} className={cssStyles.image} style={style} />
        } else if (data.contentType?.startsWith("video/")) {
            return (
                <video controls className={cssStyles.media} style={style}>
                    <source src={url} type={data.contentType} />
                </video>
            )
        } else if (contentType?.startsWith("audio/")) {
            return (
                <audio controls style={{ width: "100%" }}>
                    <source src={url} type={data.contentType} />
                </audio>
            )
        } else if (contentType?.startsWith("text/html")) {
            return (
                <iframe
                    title="html-preview"
                    src={data.url}
                    className={cssStyles.iframe}
                    sandbox=""
                />
            )
        }
        return (
            <div style={style} >
                <p style={{ wordBreak: "break-word" }} >URL: <span>{url}</span></p>
                {/* TODO: handle later (it is downloading JS files) */}
                {/* <iframe src={url} /> */}
            </div>
        )
    }

    // ---- JSON ----
    if (parsedJson) {
        return (
            <pre className={cssStyles.pre}>
                {JSON.stringify(parsedJson, null, 2)}
            </pre>
        )
    }

    // ---- Plain Text ----
    if (normalizedType.startsWith("text/plain") && isString(data)) {
        return <pre className={cssStyles.pre}>{data}</pre>
    }

    // ---- HTML ----
    if (normalizedType.startsWith("text/html") && isString(data)) {
        return (
            <iframe
                title="html-preview"
                srcDoc={data}
                className={cssStyles.iframe}
                sandbox=""
            />
        )
    }

    // ---- Image / GIF ----
    if (normalizedType.startsWith("image/") && binaryDataUrl) {
        return <img src={binaryDataUrl} className={cssStyles.image} />
    }

    // ---- Video ----
    if (normalizedType.startsWith("video/") && binaryDataUrl) {
        return (
            <video controls className={cssStyles.media}>
                <source src={binaryDataUrl} type={normalizedType} />
            </video>
        )
    }

    // ---- Audio ----
    if (normalizedType.startsWith("audio/") && binaryDataUrl) {
        return (
            <audio controls>
                <source src={binaryDataUrl} type={normalizedType} />
            </audio>
        )
    }

    // ---- Fallback ----
    return (
        <pre className={cssStyles.pre}>
            {typeof data === "string"
                ? (() => {
                    try {
                        return JSON.stringify(data, null, 2)
                    } catch (err) {
                        console.log("error in fallback: ", err)
                    }
                    return data
                })()
                : JSON.stringify(data, null, 2)}
        </pre>
    )
}