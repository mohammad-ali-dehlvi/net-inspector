import {
    DetailedHTMLProps,
    MediaHTMLAttributes,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

type FileViewerProps = DetailedHTMLProps<MediaHTMLAttributes<HTMLMediaElement>,
    HTMLMediaElement
> &
    (
        { urls: string[]; }
    );

export default function FileViewer(props: FileViewerProps) {
    const { url, urls, ...mediaProps } = props as any;
    const videoRef = useRef<HTMLVideoElement>(null);
    const [mediaSourceReady, setMediaSourceReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const normalizedUrls: string[] = url ? [url] : urls ?? [];

    const getMediaType = useCallback((url: string) => {
        const clean = url.split("?")[0].toLowerCase();
        if (/\.(mp4|webm|ogg|mov|avi|mkv)$/.test(clean)) return "video";
        if (/\.(mp3|wav|ogg|aac|flac|m4a)$/.test(clean)) return "audio";
        if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)$/.test(clean)) return "image";
        if (clean.includes("audio")) return "audio";
        if (clean.includes("video")) return "video";
        return "iframe";
    }, []);

    const hasVideo = normalizedUrls.some((u) => getMediaType(u) === "video");
    const hasAudio = normalizedUrls.some((u) => getMediaType(u) === "audio");
    const useMediaSource =
        normalizedUrls.length > 1 && hasVideo && hasAudio;

    // MediaSource: merge video + audio tracks into one <video> element
    useEffect(() => {
        if (!useMediaSource || !videoRef.current) return;

        const videoUrls = normalizedUrls.filter((u) => getMediaType(u) === "video");
        const audioUrls = normalizedUrls.filter((u) => getMediaType(u) === "audio");

        if (!("MediaSource" in window)) {
            setError("MediaSource API not supported in this browser.");
            return;
        }

        const ms = new MediaSource();
        videoRef.current.src = URL.createObjectURL(ms);

        const fetchAndAppend = async (
            sb: SourceBuffer,
            url: string
        ) => {
            const res = await fetch(url);
            const buf = await res.arrayBuffer();
            await new Promise<void>((resolve, reject) => {
                sb.addEventListener("updateend", () => resolve(), { once: true });
                sb.addEventListener("error", reject, { once: true });
                sb.appendBuffer(buf);
            });
        };

        ms.addEventListener("sourceopen", async () => {
            try {
                const videoMime = 'video/mp4; codecs="avc1.42E01E"';
                const audioMime = 'audio/mp4; codecs="mp4a.40.2"';

                const vSB = ms.addSourceBuffer(videoMime);
                const aSB = ms.addSourceBuffer(audioMime);

                await Promise.all([
                    ...videoUrls.map((u) => fetchAndAppend(vSB, u)),
                    ...audioUrls.map((u) => fetchAndAppend(aSB, u)),
                ]);

                ms.endOfStream();
                setMediaSourceReady(true);
            } catch (e) {
                setError(
                    "Failed to load media via MediaSource. Falling back to individual players."
                );
            }
        });

        return () => {
            if (videoRef.current) {
                URL.revokeObjectURL(videoRef.current.src);
            }
        };
    }, [useMediaSource, normalizedUrls, getMediaType]);

    const renderSingle = (url: string, key?: number) => {
        const type = getMediaType(url);
        const sharedProps = { ...mediaProps, key };

        switch (type) {
            case "video":
                return (
                    <video
                        {...sharedProps}
                        src={url}
                        controls
                        style={{ maxWidth: "100%", display: "block", ...sharedProps.style }}
                    />
                );
            case "audio":
                return (
                    <audio
                        {...sharedProps}
                        src={url}
                        controls
                        style={{ width: "100%", ...sharedProps.style }}
                    />
                );
            case "image":
                return (
                    <img
                        key={key}
                        src={url}
                        alt=""
                        style={{ maxWidth: "100%", display: "block", ...sharedProps.style }}
                    />
                );
            default:
                return (
                    <iframe
                        key={key}
                        src={url}
                        style={{ width: "100%", height: "480px", border: "none", ...sharedProps.style }}
                        allowFullScreen
                    />
                );
        }
    };

    // Single URL — straightforward render
    if (normalizedUrls.length === 1) {
        return <>{renderSingle(normalizedUrls[0])}</>;
    }

    // Multiple URLs with at least one video + one audio → MediaSource
    if (useMediaSource) {
        return (
            <>
                {error && (
                    <p style={{ color: "red" }}>{error}</p>
                )}
                {error ? (
                    // Graceful fallback: render each file individually
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {normalizedUrls.map((u, i) => renderSingle(u, i))}
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        {...mediaProps}
                        controls
                        style={{ maxWidth: "100%", display: "block", ...mediaProps.style }}
                    />
                )}
            </>
        );
    }

    // Multiple URLs, mixed types — render each independently
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {normalizedUrls.map((u, i) => renderSingle(u, i))}
        </div>
    );
}