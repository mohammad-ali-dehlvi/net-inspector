import express from "express";
import expressWs from "express-ws";
import * as path from "node:path";
import { CustomPlaywrightPage } from "./utils/CustomPlaywright";
import { NetworkItemType } from "src/shared/types";

const PORT = 8000
const app = express()
console.log("Express ws initializing....")
const ins = expressWs(app)
console.log("Express ws initialized")
const BASE_URL = `http://localhost:${PORT}`

// This is the magic line that populates req.body
app.use(express.json()); 

// If you are sending data via HTML forms (x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

app.use("/data", express.static(path.join(process.cwd(), "data")));

const routers = await import("src/server/routers")

app.use("/socket/browser", routers.browserSocketRouter(ins))

app.use("/browser", routers.BrowserRouter)
app.use("/video", routers.VideoRouter)

app.get("/", async (req, res)=>{
    const data: NetworkItemType = {
            "url": "https://www.instagram.com/graphql/query",
            "end_seconds": 55.307,
            "method": "POST",
            "headers": {
                "sec-ch-ua-full-version-list": "\"Chromium\";v=\"145.0.7632.6\", \"Not:A-Brand\";v=\"99.0.0.0\"",
                "sec-ch-ua-platform": "\"Windows\"",
                "x-root-field-name": "xdt_api__v1__feed__user_timeline_graphql_connection",
                "sec-ch-ua": "\"Chromium\";v=\"145\", \"Not:A-Brand\";v=\"99\"",
                "sec-ch-ua-model": "\"\"",
                "sec-ch-ua-mobile": "?0",
                "x-ig-app-id": "936619743392459",
                "x-fb-lsd": "3bHJ_bAnzmgIFdlt7yCw3o",
                "content-type": "application/x-www-form-urlencoded",
                "x-csrftoken": "MWTpudBC_QZgknru7S3YyX",
                "referer": "https://www.instagram.com/",
                "x-fb-friendly-name": "PolarisProfilePostsQuery",
                "x-bloks-version-id": "549e3ff69ef67a13c41791a62b2c14e2a0979de8af853baac859e53cd47312a8",
                "x-asbd-id": "359341",
                "sec-ch-prefers-color-scheme": "light",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
                "sec-ch-ua-platform-version": "\"10.0.0\""
            },
            "post_data": "av=17841405929409756&__d=www&__user=0&__a=1&__req=1h&__hs=20501.HYP%3Ainstagram_web_pkg.2.1...0&dpr=1&__ccg=EXCELLENT&__rev=1033545382&__s=etahb5%3A1z61h5%3Az2v4ae&__hsi=7607849935167435338&__dyn=7xeUjG1mxu1syUbFp41twpUnwgU7SbzEdF8aUco2qwJxS0DU2wx609vCwjE1EE2Cw8G11wBz81s8hwGxu786a3a1YwBgao6C0Mo2swlo8od8-U2zxe2GewGw9a361qwuEjUlwhEe87q10w51wLyESE7i3vwDwHg2ZwrUK2K2WE5B08-269wr86C1mgcEed6hEhK2O4Xxui2qi7E5y4UrwfybBK4o16UsxWawOwi84q2i1cw&__csr=gDf93s8MshAD4n92L6OHHP4r4ic_-BnXPkDaleijzfKp4bbqH8-LnGiplbmXGu8ix6dKh1e48Wmmp7eujBGWVbSIGWAy4WAGHoWF99aVKqF_zKpCBqHJ6ykahaXxZ399pahUWEqGUC5k9VEDhGGt4AWh6Hy8kxHx6Gxb-aCGim9GUnzUVoO2aq5EPBoiDyUF2UW4ojxi00njGe80UUcUcEiwtodVoiwmU11U1wpi058ceyWK0dXwmo8E1RE1Hdw1eW0QU0Um0wE7u5U2By8ho2uo4ypwu64Eb8y1-wNyo9bhx826ym4onSu2lw7Xxi8P0lo0Bly8kc3aIGw3poz4G545MG4Erxmew7hw0RHw1-603_e02hW0caU1do3pwv8&__hsdp=go40CE4oah79q5MFb6jisSygH9yih2eNW2rd9cxsx59RAVhgYi4HFG5oHoGXC1I7i3Uh8jwjGQax5hF1oaCuBhA5E6cwd8couyoS88fghKfyUtwwwj8C44de10xGUcUbE-9zo4SazVEpwUxy1twCx22q3y1LGUC3i7o2ew4QG2W17w18x07awa608DwXwuk1hyo1CK0o-2i0Go1eaw6zw5Cg6K5U2u81_wdC1-g&__hblp=0dajAw-wBzoW4UF28CcwGG6EaUaU8EaXwhE56aBg8EK9jUkG6658kxq3e8BwywNVQ9G9yk5nAzEmJaVWGl1iu9yUGawGxq9Cy98rBBxi58qFa32u2qEO9zoa898Gfhrxl0Bh8K685S7FVEC2q489UO1axuHyod8txfxe2e4UqCyE6y0C8cGgOex617wv83pw33E8A0CojwEway18U2xw4ww46xa2y1Vg9oaUC1dw9O2S0AU8U1mU982FwjE3FG1Nw4Nx29wWwdC2Wt0iE88J2E2mD8azV85up1u8wJw8zwyK1ng52&__sjsp=go40CE4oah79q5MFb6jitHEAaOoAAgzIuxlOcQAO5O4kC9Vo88iKu5oHoGXC10871Qw-4i4U4WJ1NhF1oaCdg12U&__comet_req=7&fb_dtsg=NAfv5lyfCwbAuu9Cs3mUNZ6j9-DGUSEJ5mr5UC983Z6xRc1kwfeUdqQ%3A17854575481098892%3A1771340590&jazoest=26181&lsd=3bHJ_bAnzmgIFdlt7yCw3o&__spin_r=1033545382&__spin_b=trunk&__spin_t=1771340597&__crn=comet.igweb.PolarisFeedRoute&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisProfilePostsQuery&server_timestamps=true&variables=%7B%22data%22%3A%7B%22count%22%3A12%2C%22include_reel_media_seen_timestamp%22%3Atrue%2C%22include_relationship_info%22%3Atrue%2C%22latest_besties_reel_media%22%3Atrue%2C%22latest_reel_media%22%3Atrue%7D%2C%22username%22%3A%22okalun_%22%7D&doc_id=25848791338108280",
            "post_data_json": {
                "av": "17841405929409756",
                "__d": "www",
                "__user": "0",
                "__a": "1",
                "__req": "1h",
                "__hs": "20501.HYP:instagram_web_pkg.2.1...0",
                "dpr": "1",
                "__ccg": "EXCELLENT",
                "__rev": "1033545382",
                "__s": "etahb5:1z61h5:z2v4ae",
                "__hsi": "7607849935167435338",
                "__dyn": "7xeUjG1mxu1syUbFp41twpUnwgU7SbzEdF8aUco2qwJxS0DU2wx609vCwjE1EE2Cw8G11wBz81s8hwGxu786a3a1YwBgao6C0Mo2swlo8od8-U2zxe2GewGw9a361qwuEjUlwhEe87q10w51wLyESE7i3vwDwHg2ZwrUK2K2WE5B08-269wr86C1mgcEed6hEhK2O4Xxui2qi7E5y4UrwfybBK4o16UsxWawOwi84q2i1cw",
                "__csr": "gDf93s8MshAD4n92L6OHHP4r4ic_-BnXPkDaleijzfKp4bbqH8-LnGiplbmXGu8ix6dKh1e48Wmmp7eujBGWVbSIGWAy4WAGHoWF99aVKqF_zKpCBqHJ6ykahaXxZ399pahUWEqGUC5k9VEDhGGt4AWh6Hy8kxHx6Gxb-aCGim9GUnzUVoO2aq5EPBoiDyUF2UW4ojxi00njGe80UUcUcEiwtodVoiwmU11U1wpi058ceyWK0dXwmo8E1RE1Hdw1eW0QU0Um0wE7u5U2By8ho2uo4ypwu64Eb8y1-wNyo9bhx826ym4onSu2lw7Xxi8P0lo0Bly8kc3aIGw3poz4G545MG4Erxmew7hw0RHw1-603_e02hW0caU1do3pwv8",
                "__hsdp": "go40CE4oah79q5MFb6jisSygH9yih2eNW2rd9cxsx59RAVhgYi4HFG5oHoGXC1I7i3Uh8jwjGQax5hF1oaCuBhA5E6cwd8couyoS88fghKfyUtwwwj8C44de10xGUcUbE-9zo4SazVEpwUxy1twCx22q3y1LGUC3i7o2ew4QG2W17w18x07awa608DwXwuk1hyo1CK0o-2i0Go1eaw6zw5Cg6K5U2u81_wdC1-g",
                "__hblp": "0dajAw-wBzoW4UF28CcwGG6EaUaU8EaXwhE56aBg8EK9jUkG6658kxq3e8BwywNVQ9G9yk5nAzEmJaVWGl1iu9yUGawGxq9Cy98rBBxi58qFa32u2qEO9zoa898Gfhrxl0Bh8K685S7FVEC2q489UO1axuHyod8txfxe2e4UqCyE6y0C8cGgOex617wv83pw33E8A0CojwEway18U2xw4ww46xa2y1Vg9oaUC1dw9O2S0AU8U1mU982FwjE3FG1Nw4Nx29wWwdC2Wt0iE88J2E2mD8azV85up1u8wJw8zwyK1ng52",
                "__sjsp": "go40CE4oah79q5MFb6jitHEAaOoAAgzIuxlOcQAO5O4kC9Vo88iKu5oHoGXC10871Qw-4i4U4WJ1NhF1oaCdg12U",
                "__comet_req": "7",
                "fb_dtsg": "NAfv5lyfCwbAuu9Cs3mUNZ6j9-DGUSEJ5mr5UC983Z6xRc1kwfeUdqQ:17854575481098892:1771340590",
                "jazoest": "26181",
                "lsd": "3bHJ_bAnzmgIFdlt7yCw3o",
                "__spin_r": "1033545382",
                "__spin_b": "trunk",
                "__spin_t": "1771340597",
                "__crn": "comet.igweb.PolarisFeedRoute",
                "fb_api_caller_class": "RelayModern",
                "fb_api_req_friendly_name": "PolarisProfilePostsQuery",
                "server_timestamps": "true",
                "variables": "{\"data\":{\"count\":12,\"include_reel_media_seen_timestamp\":true,\"include_relationship_info\":true,\"latest_besties_reel_media\":true,\"latest_reel_media\":true},\"username\":\"okalun_\"}",
                "doc_id": "25848791338108280"
            },
            "start_seconds": 54.935
        }
    const response = await CustomPlaywrightPage.getInstange().request(data)
    // console.log(response)
    res.send(JSON.stringify({success: true, message: "this is '/'", response}))
})

app.listen(PORT, ()=>{
    console.log(`Server is running as ${BASE_URL}/`)
})