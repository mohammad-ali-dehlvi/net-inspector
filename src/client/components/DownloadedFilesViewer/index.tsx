import moment from "moment";
import { CSSProperties, Fragment, useCallback } from "react";
import styles from "src/client/components/DownloadedFilesViewer/styles.module.css";
import Header from "src/client/components/Header";
import HeaderLink from "src/client/components/Header/HeaderLink";
import { DownloadFileResponseType } from "src/shared/types";
import FileViewer from "./FileViewer";

type DataType = DownloadFileResponseType

interface DownloadedFilesViewerProps {
    data: DataType[]
    onDelete?: (data: DataType) => void
}

export default function DownloadedFilesViewer(props: DownloadedFilesViewerProps) {
    const { data, onDelete } = props
    const getMediaType = useCallback((url: string) => {
        const clean = url.split("?")[0].toLowerCase();
        if (/\.(mp4|webm|ogg|mov|avi|mkv)$/.test(clean)) return "video";
        if (/\.(mp3|wav|ogg|aac|flac|m4a)$/.test(clean)) return "audio";
        if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)$/.test(clean)) return "image";
        // Fallback: try to guess from domain/path hints
        if (clean.includes("audio")) return "audio";
        if (clean.includes("video")) return "video";
        return "image"; // default
    }, [])
    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }} >
                {data.map((e, index) => {
                    const createdAt = e.created_at ? new Date(e.created_at) : null
                    const style: CSSProperties = { width: "100%", height: "max(calc(100vh - 100px), 200px)", objectFit: "contain" }
                    console.log(e)
                    return <div key={index} className={styles.item} >
                        <FileViewer
                            urls={"urls" in e && e.urls ? e.urls.map(e => e.url) : "url" in e && e.url ? [e.url] : []}
                            style={style}
                        />
                        {!!createdAt && (
                            <div className={styles.created_at} >
                                <p>{moment(createdAt).format("DD MMM YYYY hh:mm a")}</p>
                            </div>
                        )}
                        {!!onDelete && (
                            <button className={styles.delete_btn} onClick={() => { onDelete(e) }} >
                                Delete
                            </button>
                        )}
                    </div>
                })}
            </div>
        </div>
    )
}