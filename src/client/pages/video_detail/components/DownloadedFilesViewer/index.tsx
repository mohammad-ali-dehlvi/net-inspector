import { CSSProperties, useCallback } from "react";

interface DownloadedFilesViewerProps {
    data: { url: string }[]
}

export default function DownloadedFilesViewer(props: DownloadedFilesViewerProps) {
    const { data } = props
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
                {data.map((e) => {
                    const type = getMediaType(e.url)
                    const style: CSSProperties = { width: "100%", maxHeight: "calc(100vh - 85px)", objectFit: "contain" }
                    return <div key={e.url} >
                        {type === "audio" ? <audio src={e.url} controls style={style} /> :
                            type === "video" ? <video src={e.url} controls style={style} /> :
                                type === "image" ? <img src={e.url} style={style} /> :
                                    <iframe src={e.url} />}
                    </div>
                })}
            </div>
        </div>
    )
}