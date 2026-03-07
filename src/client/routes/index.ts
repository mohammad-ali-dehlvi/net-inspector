import { createBrowserRouter } from "react-router"
import Home from "src/client/pages/home"
import AllVideos from "src/client/pages/all_videos"
import VideoDetail from "src/client/pages/video_detail"
import AllDownloads from "src/client/pages/all_downloads"
import Dashboard from "src/client/pages/dashboard"

export const router = createBrowserRouter([
    { path: "/", Component: Home },
    { path: "/videos", Component: AllVideos },
    { path: "/video-details/:name", Component: VideoDetail },
    { path: "/dashboard", Component: Dashboard },
    { path: "/all-downloads", Component: AllDownloads },
])