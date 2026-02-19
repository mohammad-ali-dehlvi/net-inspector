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

app.listen(PORT, () => {
    console.log(`Server is running as ${BASE_URL}/`)
})