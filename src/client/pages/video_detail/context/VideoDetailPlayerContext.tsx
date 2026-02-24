import { createContext, Dispatch, RefObject, SetStateAction, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useVideoDetailContext } from "src/client/pages/video_detail/context/videoDetail";
import NetworkVideoPlayer from "src/client/pages/video_detail/components/Main";
import { inRange, itemMatchesQuery } from "src/client/pages/video_detail/utils/helper";
import { NetworkItemType } from "src/shared/types";


interface VideoDetailPlayerContextInterface {
    duration: number;
    setDuration: Dispatch<SetStateAction<number>>;
    selectedIndex: number | null;
    setSelectedIndex: (index: number | null) => void;
    // Range selection
    range: { start: number; end: number };
    setRange: Dispatch<SetStateAction<{
        start: number;
        end: number;
    }>>;

    // Filter & search state
    selectedTags: Set<string>;
    setSelectedTags: Dispatch<SetStateAction<Set<string>>>;
    searchQueries: string[];
    setSearchQueries: Dispatch<SetStateAction<string[]>>;

    rangeFiltered: NetworkItemType[]
    displayedNetwork: NetworkItemType[]
}

const VideoDetailPlayerContext = createContext({} as VideoDetailPlayerContextInterface)

export const useVideoDetailPlayerContext = () => useContext(VideoDetailPlayerContext)

interface VideoDetailPlayerContextProviderProps {

}

export default function VideoDetailPlayerContextProvider(props: VideoDetailPlayerContextProviderProps) {
    const { requests } = useVideoDetailContext();
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [duration, setDuration] = useState(0);

    // ── Range ─────────────────────────────────────────────────────────────────
    const [range, setRange] = useState({ start: 0, end: 0 });

    // ── Filter & search state ─────────────────────────────────────────────────
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
    const [searchQueries, setSearchQueries] = useState<string[]>([]);

    const rangeFiltered = useMemo(
        () => requests?.filter(item => inRange(item, range.start, range.end)) || [],
        [requests, range.start, range.end],
    );

    const displayedNetwork = useMemo(() => {
        const result: typeof rangeFiltered = []
        for (const item of rangeFiltered) {
            if (selectedTags.size > 0 && !selectedTags.has(item.request.method.toUpperCase())) continue;
            if (!itemMatchesQuery(item, searchQueries)) continue;
            result.push(item)
        }
        return result
    }, [rangeFiltered, selectedTags, searchQueries])

    const contextValue = useMemo<VideoDetailPlayerContextInterface>(() => {
        return {
            duration,
            setDuration,
            selectedIndex,
            setSelectedIndex,
            range,
            setRange,
            selectedTags,
            setSelectedTags,
            searchQueries,
            setSearchQueries,

            rangeFiltered,
            displayedNetwork,
        }
    }, [selectedIndex, range, selectedTags, searchQueries, rangeFiltered, displayedNetwork, duration])

    return (
        <VideoDetailPlayerContext.Provider value={contextValue}>
            <NetworkVideoPlayer />
        </VideoDetailPlayerContext.Provider>
    )
}