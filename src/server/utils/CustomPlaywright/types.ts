
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
    bytes: Uint8Array<ArrayBuffer>;
    fileSuffix: string;
}
export type MediaSourceDataType = {
    type: "mediasource";
    data: {
        audio: {
            bytes: Uint8Array<ArrayBuffer>;
            fileSuffix: string | undefined;
        } | null;
        video: {
            bytes: Uint8Array<ArrayBuffer>;
            fileSuffix: string | undefined;
        } | null;
    };
}
export type PassDataFunc = (data: (NormalDataType | MediaSourceDataType)[]) => void