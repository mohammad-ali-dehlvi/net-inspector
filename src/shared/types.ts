

// export type NetworkItemType = {
//     "id": number | string,
//     "url": string,
//     "method": string,
//     "headers": Record<string, string>,
//     "response_headers": Record<string, string>,
//     "post_data": string | null,
//     "post_data_json": Record<string, any> | null,
//     "end_seconds": number,
//     "start_seconds": number,
//     // "screen_shot"?: string
//     "html"?: string
// }

export type NetworkItemType = {
    startSeconds: number;
    endSeconds: number;
    pageUrl?: string;
    request: {
        method: string,
        url: string,
        headers: Record<string, string>,
        postData: any,
        postDataJSON: any
    },
    response: {
        status: number,
        headers: Record<string, string>,
        body?: {
            url: string,
            contentType?: string
        } | {
            error: string,
        }
    }
}