

export type CombineBufferRequest = {
    dataPaths: { path: string }[]
}

export type CombineBufferResponse = {
    success: true;
    data: string;
} | {
    success: false;
    message: string;
}