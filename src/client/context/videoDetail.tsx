import { createContext, PropsWithChildren, useContext } from "react";
import useApiHook from "src/client/hooks/useApiHook";
import { videoService } from "src/client/services";
import { VideoNameResponse } from "src/server/routers/video/types";


interface VideoDetailContextInterface{
    videoDetails: VideoNameResponse | null
    videoDetailLoading: boolean
    videoDetailError: Error | null
    getVideoDetails: (folderName: string) => Promise<void>
}

const VideoDetailContext = createContext({} as VideoDetailContextInterface)

export const useVideoDetailContext = () => useContext(VideoDetailContext)

export function VideoDetailProvider(props: PropsWithChildren) {
    const {data: videoDetails, loading: videoDetailLoading, error: videoDetailError, hitApi: getVideoDetails} = useApiHook({callback: videoService.getNameDetails})

    return (
        <VideoDetailContext.Provider value={{
            videoDetails,
            videoDetailLoading,
            videoDetailError,
            getVideoDetails
        }} >
            {props.children}
        </VideoDetailContext.Provider>
    )
}