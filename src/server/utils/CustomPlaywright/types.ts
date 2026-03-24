
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
    type?: "blob" | "file" | "mediasource"
})

export type GetExtensionFunc = {
    (mimeType: string, backupExtension: string): string;
    (mimeType: string): string | false;
}

export type NormalDataType = {
    type: "normal";
    // bytes: Uint8Array<ArrayBuffer>;
    url: string;
    // uid: string;
    fileSuffix: string;
}
export type MediaSourceDataType = {
    type: "mediasource";
    data: {
        audio: {
            // bytes: Uint8Array<ArrayBuffer>;
            url: string;
            // uid: string;
            fileSuffix: string | undefined;
        } | null;
        video: {
            // bytes: Uint8Array<ArrayBuffer>;
            url: string;
            // uid: string;
            fileSuffix: string | undefined;
        } | null;
    };
}
export type PassDataFunc = (data: (NormalDataType | MediaSourceDataType)[]) => void

export type HighlightObj = {
    total: number | null;
    loaded: number;
    percentCompleted: number | null;
}

export type HighlightProgress = {
    [index: string | number]: HighlightObj
}