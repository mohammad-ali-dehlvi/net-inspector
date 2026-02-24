import { createBrowserRouter } from "react-router"
import Home from "src/client/pages/home"
import AllVideos from "src/client/pages/all_videos"
import VideoDetail from "src/client/pages/video_detail"
import ToolCombineBuffers from "src/client/pages/tools/combine_buffers"

export const router = createBrowserRouter([
    { path: "/", Component: Home },
    { path: "/videos", Component: AllVideos },
    { path: "/video-details/:name", Component: VideoDetail },
    { path: "/tools", Component: ToolCombineBuffers },
    { path: "/tools/combine-buffers", Component: ToolCombineBuffers },
])