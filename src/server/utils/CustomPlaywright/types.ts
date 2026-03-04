
export type PassLinksMediaSourceDataType<T extends ArrayBuffer | Uint8Array> = {
    sourceBuffers: SourceBuffer[];
    data: {
        mimeType: string;
        data: T;
    }[];
}

export type PassLinksDataType = {
    link: string;
    pageUrl: string;
} & ({
    type?: "blob" | "file"
})

export type PassLinksType = (data: PassLinksDataType[]) => Promise<void>

export type PassMediaSourceDataType = {
    [link: string]: {
        readyState: ReadyState,
        data: PassLinksMediaSourceDataType<Uint8Array>['data']
    }
}

export type PassMediaSourceFuncType = (data: PassMediaSourceDataType) => void