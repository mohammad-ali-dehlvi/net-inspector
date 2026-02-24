import { useMemo, useState } from "react";
import MultiSelectAutocomplete from "src/client/components/MultiAutocomplete";
import { NetworkItemType } from "src/shared/types";
import _ from "lodash";
import { useVideoDetailContext } from "src/client/pages/video_detail/context/videoDetail";


interface ShowUniqueValuesProps {

}

export default function ShowUniqueValues(props: ShowUniqueValuesProps) {
    const { requests } = useVideoDetailContext()
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

    const value = useMemo(() => {
        return Array.from(selectedKeys).map(key => ({ label: key, value: key }))
    }, [selectedKeys])

    const options = useMemo(() => {
        if (!requests) return [];
        const resultSet = new Set<string>();
        for (let i = 0; i < requests.length; i++) {
            const item = requests[i]
            const value = selectedKeys.size > 0 ? _.get(item, Array.from(selectedKeys)) : item
            if (!!value && typeof value === "object") {
                const keys = Object.keys(value)
                for (let j = 0; j < keys.length; j++) {
                    resultSet.add(keys[j])
                }
            } else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
                resultSet.add(String(value))
            }
        }
        return Array.from(resultSet).map(v => ({ label: v, value: v }))
    }, [requests, selectedKeys])

    return (
        <div>
            <MultiSelectAutocomplete options={options} value={value} onChange={(values) => {
                setSelectedKeys(new Set(values.map(e => e.value)))
            }} />
        </div>
    )
}