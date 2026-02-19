import React, { useMemo } from "react";
import { buildDataUrl, createObjectUrlFromBinaryString, isString, normalizeBinaryString, safeJsonParse } from "src/client/pages/video_detail/utils/helper";
import styles from "src/client/pages/video_detail/components/ContentRenderer/index.module.css";

type ContentRendererProps = {
    contentType?: string | null
    data: unknown
}

export default function ContentRenderer({ contentType, data }: ContentRendererProps) {
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
            // const normalized = normalizeBinaryString(data)
            try {
                // const url = createObjectUrlFromBinaryString(normalizedType, data)
                // console.log("created object url: ", { url, normalizedType, data })
                return `data:${normalizedType};base64,${data}`
            } catch (err) {
                console.log(err)
                console.log({ normalizedType, data })
                return null
            }
        }
        return null
    }, [normalizedType, data])

    // ---- JSON ----
    if (parsedJson) {
        return (
            <pre className={styles.pre}>
                {JSON.stringify(parsedJson, null, 2)}
            </pre>
        )
    }

    // ---- Plain Text ----
    if (normalizedType.startsWith("text/plain") && isString(data)) {
        return <pre className={styles.pre}>{data}</pre>
    }

    // ---- HTML ----
    if (normalizedType.startsWith("text/html") && isString(data)) {
        return (
            <iframe
                title="html-preview"
                srcDoc={data}
                className={styles.iframe}
                sandbox=""
            />
        )
    }

    // ---- Image / GIF ----
    if (normalizedType.startsWith("image/") && binaryDataUrl) {
        return <img src={binaryDataUrl} className={styles.image} />
    }

    // ---- Video ----
    if (normalizedType.startsWith("video/") && binaryDataUrl) {
        return (
            <video controls className={styles.media}>
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
        <pre className={styles.pre}>
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