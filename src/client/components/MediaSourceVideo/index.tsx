import { DetailedHTMLProps, useEffect, useRef, VideoHTMLAttributes } from "react";

interface MediaSourceVideoProps extends Omit<DetailedHTMLProps<VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>, 'ref' | 'key'> {
    mediaSource?: MediaSource
    onSourceOpen?: (mediaSource: MediaSource) => void
    onSourceClose?: (mediaSource: MediaSource) => void
    onSourceEnded?: (mediaSource: MediaSource) => void
}

export default function MediaSourceVideo(props: MediaSourceVideoProps) {
    const { mediaSource: propsMediaSource, onSourceOpen, onSourceClose, onSourceEnded, ...rest } = props
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const mediaSource = propsMediaSource || new MediaSource()
        if (videoRef.current) {
            videoRef.current.src = URL.createObjectURL(mediaSource)

            mediaSource.addEventListener("sourceopen", () => {
                if (onSourceOpen) {
                    onSourceOpen(mediaSource)
                }
            })

            mediaSource.addEventListener("sourceclose", () => {
                if (onSourceClose) {
                    onSourceClose(mediaSource)
                }
            })

            mediaSource.addEventListener("sourceended", () => {
                if (onSourceEnded) {
                    onSourceEnded(mediaSource)
                }
            })
        }
    }, [propsMediaSource])

    return <video ref={videoRef} {...rest} />
}