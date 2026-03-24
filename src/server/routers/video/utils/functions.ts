import path from "node:path";
import fs from "node:fs";
import { RandomFileName } from "src/server/utils/functions";
import { DownloadFileResponseType } from "src/shared/types";
import { CustomPlaywrightPage } from "src/server/utils/CustomPlaywright";

export function parseDownloadFileUrl(p: string): DownloadFileResponseType {
    const stat = fs.statSync(p)
    const created_at = RandomFileName.getDateFromName(path.basename(p))
    if (stat.isDirectory()) {
        const files = fs.readdirSync(p)
        const folderName = path.basename(p)
        return {
            created_at,
            urls: files.map((fileName) => {
                return { url: `/data/${CustomPlaywrightPage.all_downloads_folder_name}/${folderName}/${fileName}` }
            })
        }
    } else {
        const fileName = path.basename(p)
        return {
            created_at,
            url: `/data/${CustomPlaywrightPage.all_downloads_folder_name}/${fileName}`
        }
    }
}