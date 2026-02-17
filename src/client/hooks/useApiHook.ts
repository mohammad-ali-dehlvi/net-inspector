import { useCallback, useEffect, useState } from "react"

type UseApiHookParams<Args extends any[], Data> = {
    callback: (...args: Args) => Promise<Data>
}

export default function useApiHook<Args extends any[], Data>(obj: UseApiHookParams<Args, Data>){
    const {callback} = obj
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const [data, setData] = useState<Data | null>(null)

    const hitApi = useCallback(async (...args: Args) => {
        setLoading(true)
        setError(null)

        try {
            // Execute the callback with the passed arguments
            const result = await callback(...args)
            setData(result)
        } catch (err) {
            setError(err instanceof Error ? err : new Error("An unknown error occurred"))
        } finally {
            setLoading(false)
        }
    }, [loading, data, error])

    const reset = useCallback(() => {
        setLoading(false)
        setError(null)
        setData(null)
    }, [loading, data, error])
    
    return {
        loading,
        error,
        data,
        hitApi,
        reset
    }
}