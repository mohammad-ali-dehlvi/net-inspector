import { useMemo, useRef } from "react";
import { getMethodColor } from "src/client/pages/video_detail/utils/helper";
import { useVideoDetailContext } from "src/client/pages/video_detail/context/videoDetail";
import { useVideoDetailPlayerContext } from "src/client/pages/video_detail/context/VideoDetailPlayerContext";
import cssStyles from "src/client/pages/video_detail/components/FilterToolbar/style.module.css";
import MultiSelectAutocomplete from "src/client/components/MultiAutocomplete";
import { NetworkItemType } from "src/shared/types";
import Chip from "src/client/components/Chip";

interface FilterToolbarProps { }

export default function FilterToolbar({ }: FilterToolbarProps) {
  const { availableTags } = useVideoDetailContext();
  const {
    selectedTags,
    setSelectedTags,
    searchQueries,
    setSearchQueries,
  } = useVideoDetailPlayerContext();
  const searchRef = useRef<HTMLInputElement>(null);

  const onToggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  };

  return (
    <div className={cssStyles.container}>
      {/* ── Search row ── */}
      <div className={cssStyles.searchRow}>
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-deep)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cssStyles.searchIcon}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          ref={searchRef}
          type="text"
          placeholder="Search url, method, headers, body…"
          value={searchQueries[0] || ""}
          onChange={(e) => setSearchQueries([e.target.value])}
          className={cssStyles.searchInput}
        />

        {searchQueries && (
          <button
            onClick={() => {
              setSearchQueries([""]);
              searchRef.current?.focus();
            }}
            className={cssStyles.clearSearchBtn}
            title="Clear search"
          >
            ✕
          </button>
        )}

        {/* <span
          className={`${cssStyles.resultCount} ${isFiltered ? cssStyles.resultCountFiltered : ""
            }`}
        >
          {isFiltered ? `${visibleCount}/${totalCount}` : `${totalCount}`}
        </span> */}
      </div>



      {/* ── Method chips row ── */}
      <div className={cssStyles.chipsRow}>
        <span className={cssStyles.methodLabel}>METHOD</span>

        <Chip variant={selectedTags.size === 0 ? "active" : undefined}
          onClick={() => {
            if (selectedTags.size === 0) {
              availableTags.forEach((m) => onToggleTag(m));
            } else {
              availableTags.forEach((m) => {
                if (selectedTags.has(m)) onToggleTag(m);
              });
            }
          }}
        >ALL</Chip>

        {availableTags.map((tag) => {
          const color = getMethodColor(tag as any, true);
          const active = selectedTags.has(tag);

          return <Chip variant={active ? color as any : undefined} onClick={() => onToggleTag(tag)} >
            {tag}
          </Chip>
        })}

        {selectedTags.size > 0 && (
          <button
            onClick={() =>
              availableTags.forEach((m) => {
                if (selectedTags.has(m)) onToggleTag(m);
              })
            }
            className={cssStyles.clearAllBtn}
          >
            clear
          </button>
        )}
      </div>
    </div>
  );
}