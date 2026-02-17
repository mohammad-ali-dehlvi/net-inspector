

export type NetworkItemType = {
    "url": string,
    "method": string,
    "headers": Record<string, string>,
    "post_data": string | null,
    "post_data_json": Record<string, any> | null,
    "end_seconds": number,
    "start_seconds": number,
}