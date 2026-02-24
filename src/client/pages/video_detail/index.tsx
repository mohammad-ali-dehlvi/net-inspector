import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router"
import Header from "src/client/components/Header";
import cssHeaderStyles from "src/client/components/Header/style.module.css";
import KbdPill from "src/client/pages/video_detail/components/KeyBoardHitPill";
import { SEEK_SECONDS } from "src/client/pages/video_detail/utils/constants";
import { Tab } from "src/client/components/Tabs/Tab";
import { TabPanel } from "src/client/components/Tabs/TabPanel";
import Tabs from "src/client/components/Tabs/Tabs";
import useApiHook from "src/client/hooks/useApiHook";
import { VideoDetailProvider } from "src/client/pages/video_detail/context/videoDetail"
import VideoDetailPlayerContextProvider from "src/client/pages/video_detail/context/VideoDetailPlayerContext"
import { videoService } from "src/client/services";

export default function VideoDetail() {
    const { name = "" } = useParams()
    const [tabValue, setTabValue] = useState<string>("")
    const { data, error, loading, hitApi } = useApiHook({ callback: videoService.getNameDetails })

    const tabValues = useMemo(() => {
        if (!data || !data.success) return []
        return data.data.result.map((e, i) => {
            return `page_${i + 1}`
        })
    }, [data])

    useEffect(() => {
        if (tabValues.length > 0 && !tabValues.includes(tabValue)) {
            setTabValue(tabValues[0])
        }
    }, [tabValues, tabValue])

    useEffect(() => {
        hitApi(name)
    }, [])

    return (
        <div style={{ width: "100%", height: "100vh", }} >
            {/* ── Top Bar ── */}
            <Header
                leftComponent={<>
                    <Link to="/videos" className={cssHeaderStyles.footerBackLink}>
                        ← ALL VIDEOS
                    </Link>
                </>}
                rightComponent={<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <KbdPill keys={["Space"]} label="play" />
                    <KbdPill keys={["←", "→"]} label={`${SEEK_SECONDS}s`} />
                    <KbdPill keys={["↑", "↓"]} label="vol" />
                    <KbdPill keys={["<", ">"]} label="speed" />
                    <KbdPill keys={["M"]} label="mute" />
                </div>}
            />
            {loading && <p>Loading...</p>}
            {error && <p>{error.message}</p>}
            {data && !data.success && <p>{data.message}</p>}
            {data && data.success && (
                // <NetworkVideoPlayer />
                <div>
                    {data.data.result.length > 1 && (
                        <Tabs value={tabValue} onChange={setTabValue} >
                            {data.data.result.map((item, index) => {
                                return (
                                    <Tab key={item.file} value={`page_${index + 1}`}  >
                                        Page {index + 1}
                                    </Tab>
                                )
                            })}
                        </Tabs>
                    )}
                    {data.data.result.map((item, index) => {
                        return (
                            <TabPanel key={item.file} value={`page_${index + 1}`} activeValue={tabValue} >
                                <VideoDetailProvider item={item} >
                                    <VideoDetailPlayerContextProvider />
                                </VideoDetailProvider>
                            </TabPanel>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
