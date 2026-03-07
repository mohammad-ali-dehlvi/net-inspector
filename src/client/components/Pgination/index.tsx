import { useCallback, useEffect, useState } from "react";
import styles from "src/client/components/Pgination/style.module.css";

interface PaginationState {
    startIndex: number;
    offset: number;
    currentPage: number;
    totalPages: number;
}

interface PaginationProps {
    totalLength: number;
    actualLength?: number;
    onActualPageEnd?: (state: PaginationState) => void;
    onChange?: (state: PaginationState) => void;
    itemsPerPageOptions?: number[];
    defaultItemsPerPage?: number;
    initialPage?: number;
}

export function Pagination({
    totalLength,
    actualLength: propsActualLength,
    onActualPageEnd,
    onChange,
    itemsPerPageOptions = [10, 25, 50, 100],
    defaultItemsPerPage = 25,
    initialPage = 1,
}: PaginationProps) {
    const actualLength = propsActualLength ?? totalLength
    const [offset, setOffset] = useState(defaultItemsPerPage);
    const [page, setPage] = useState(initialPage);

    const totalPages = Math.max(1, Math.ceil(totalLength / offset));
    const startIndex = (page - 1) * offset;
    const displayEnd = Math.min(startIndex + offset, totalLength);
    const nearBoundary = startIndex + offset >= actualLength && totalLength > actualLength;

    const emit = useCallback((s: PaginationState) => {
        onChange?.(s);
        if (s.startIndex + s.offset >= actualLength) onActualPageEnd?.(s);
    }, [actualLength, onChange, onActualPageEnd]);

    const buildPages = useCallback((current: number, total: number): (number | "…")[] => {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        const p: (number | "…")[] = [1];
        if (current > 3) p.push("…");
        for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) p.push(i);
        if (current < total - 2) p.push("…");
        p.push(total);
        return p;
    }, [])

    const goTo = (p: number) => {
        const c = Math.max(1, Math.min(totalPages, p));
        setPage(c);
        emit({ startIndex: (c - 1) * offset, offset, currentPage: c, totalPages });
    };

    const handleOffset = (n: number) => {
        setOffset(n);
        const newTotal = Math.max(1, Math.ceil(totalLength / n));
        const newPage = Math.min(page, newTotal);
        setPage(newPage);
        emit({ startIndex: (newPage - 1) * n, offset: n, currentPage: newPage, totalPages: newTotal });
    };

    useEffect(() => {
        goTo(0)
    }, [])

    return (
        <>
            {/* <style>{styles}</style> */}
            <div className={styles.pgn}>
                <span className={styles.pgn__info}>
                    <strong>{startIndex + 1}–{displayEnd}</strong> of <strong>{totalLength.toLocaleString()}</strong>
                </span>

                <div className={styles.pgn__sep} />

                <select className={styles.pgn__select} value={offset} onChange={e => handleOffset(Number(e.target.value))}>
                    {itemsPerPageOptions.map(n => <option key={n} value={n}>{n} / page</option>)}
                </select>

                <div className={styles.pgn__sep} />

                <button className={styles.pgn__btn} onClick={() => goTo(page - 1)} disabled={page === 1} title="Previous">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                <div className={styles.pgn__pages}>
                    {buildPages(page, totalPages).map((p, i) =>
                        p === "…"
                            ? <span key={`e${i}`} className={styles.pgn__ellipsis}>…</span>
                            : <button key={p} className={`${styles.pgn__btn} ${styles.pgn__btn__active}`} onClick={() => goTo(p as number)}>{p}</button>
                    )}
                </div>

                <button className={styles.pgn__btn} onClick={() => goTo(page + 1)} disabled={page === totalPages} title="Next">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {nearBoundary && <span className={styles.pgn__dot} title="Near loaded data boundary — more data may be fetched" />}
            </div>
        </>
    );
}