import express from "express";
import expressWs from "express-ws";
import * as path from "node:path";
import * as routers from "src/server/routers";

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

app.use("/browser", routers.BrowserRouter)
app.use("/video", routers.VideoRouter)
app.use("/tools", routers.ToolsRouter)

app.listen(PORT, () => {
    console.log(`Server is running as ${BASE_URL}/`)
})