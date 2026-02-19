import { useCallback, useEffect } from "react"
import { useParams } from "react-router"
import { useVideoDetailContext, VideoDetailProvider } from "src/client/context/videoDetail"
import NetworkVideoPlayer from "src/client/pages/video_detail/components/Main"
import useApiHook from "src/client/hooks/useApiHook"
import { videoService } from "src/client/services"


function VideoDetail() {
    const { name = "" } = useParams()
    const { videoDetails, videoDetailLoading, videoDetailError, getVideoDetails } = useVideoDetailContext()

    useEffect(() => {
        getVideoDetails(name)
    }, [])

    return (
        <div style={{ width: "100%", height: "100vh", }} >
            {videoDetailLoading && <p>Loading...</p>}
            {videoDetailError && <p>{videoDetailError.message}</p>}
            {videoDetails && !videoDetails.success && <p>{videoDetails.message}</p>}
            {videoDetails && videoDetails.success && (
                <NetworkVideoPlayer />
            )}
        </div>
    )
}

export default () => {
    return (
        <VideoDetailProvider>
            <VideoDetail />
        </VideoDetailProvider>
    )
}