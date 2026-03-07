import { useEffect, useMemo, useState } from "react"
import DownloadedFilesViewer from "src/client/components/DownloadedFilesViewer"
import Header from "src/client/components/Header"
import HeaderLink from "src/client/components/Header/HeaderLink"
import { Pagination } from "src/client/components/Pgination"
import useApiHook from "src/client/hooks/useApiHook"
import { videoService } from "src/client/services"


export default function AllDownloads() {
    const { data, loading, error, hitApi } = useApiHook({ callback: videoService.getAllDownloads })
    const [paginationState, setPaginationState] = useState({ startIndex: 0, offset: 0 })

    const urls = useMemo(() => {
        if (data?.success) {
            return data.data.urls
        }
        return []
    }, [data, paginationState])

    const paginatedUrls = useMemo(() => {
        const { startIndex, offset } = paginationState
        return urls.slice(startIndex, startIndex + offset)
    }, [urls, paginationState])

    useEffect(() => {
        console.log(data)
    }, [data])

    useEffect(() => {
        hitApi()
    }, [])

    if (loading) {
        return <div>
            <p>Loading...</p>
        </div>
    }

    return (
        <div>
            <Header
                leftComponent={(
                    <HeaderLink to="/" >HOME</HeaderLink>
                )}
            />
            <DownloadedFilesViewer
                data={paginatedUrls}
            />
            <div style={{ display: "inline-block", position: "sticky", bottom: "10px", left: "50%", transform: "translateX(-50%)" }} >
                <Pagination
                    totalLength={urls.length}
                    itemsPerPageOptions={[3, 6, 9]}
                    defaultItemsPerPage={3}
                    onChange={(state) => {
                        setPaginationState(state)
                    }}
                />
            </div>
        </div>
    )
}