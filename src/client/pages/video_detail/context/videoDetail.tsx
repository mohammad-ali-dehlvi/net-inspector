import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import useApiHook from "src/client/hooks/useApiHook";
import { VideoNameData, VideoNameResponse } from "src/server/routers/video/types";
import { NetworkItemType } from "src/shared/types";


interface VideoDetailContextInterface {
    video?: { url: string }
    requests?: NetworkItemType[]
    availableTags: string[]
}

const VideoDetailContext = createContext({} as VideoDetailContextInterface)

export const useVideoDetailContext = () => useContext(VideoDetailContext)

interface VideoDetailProviderProps extends PropsWithChildren {
    item: VideoNameData['result'][0]
}

export function VideoDetailProvider(props: VideoDetailProviderProps) {
    const { item, children } = props
    // const { data: videoDetails, loading: videoDetailLoading, error: videoDetailError, hitApi: getVideoDetails } = useApiHook({ callback: videoService.getNameDetails })

    const { video, requests } = useMemo(() => {
        return {
            video: item.file ? { url: item.file } : undefined,
            requests: item.result.network,
        }
    }, [item])

    const availableTags = useMemo(() => {
        const result = new Set<string>();
        requests?.forEach(e => {
            result.add(e.request.method)
            // if (e.response.headers["content-type"]) {
            //     result.add(e.response.headers["content-type"].toUpperCase())
            // }
        })
        return Array.from(result);
    }, [requests])

    return (
        <VideoDetailContext.Provider value={{
            video,
            requests,
            availableTags,
        }} >
            {children}
        </VideoDetailContext.Provider>
    )
}