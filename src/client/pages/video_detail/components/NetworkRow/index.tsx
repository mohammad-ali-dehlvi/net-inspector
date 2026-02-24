import { useEffect, useMemo, useRef, useState } from "react";
import { NetworkItemType } from "src/shared/types";
import { findSimilarAPIs, formatSeconds, getDomain, getMethodColor, getPath } from "src/client/pages/video_detail/utils/helper";
import ProgressBar from "src/client/pages/video_detail/components/ProgressBar";
import Tooltip from "src/client/components/Tooltip";
import _ from "lodash";
import { useVideoDetailPlayerContext } from "src/client/pages/video_detail/context/VideoDetailPlayerContext";
import { useVideoDetailContext } from "src/client/pages/video_detail/context/videoDetail";
import ContentRenderer from "src/client/pages/video_detail/components/ContentRenderer";
import cssStyles from "src/client/pages/video_detail/components/NetworkRow/style.module.css";
import Collapse from "src/client/components/Collapse";
import DetailPanel from "../DetailPanel";
import Chip from "src/client/components/Chip";

interface NetworkRowProps {
  item: NetworkItemType;
  isHighlighted: boolean;
  onSeek: (n: number) => void;
}

export default function NetworkRow({ item, isHighlighted, onSeek }: NetworkRowProps) {
  const { requests } = useVideoDetailContext();
  const { range, selectedIndex, setSelectedIndex } = useVideoDetailPlayerContext();
  const rangeStart = range.start;
  const rangeEnd = range.end;
  const rowRef = useRef<HTMLDivElement | null>(null);
  const mc = getMethodColor(item.request.method as any);

  const globalIndex = useMemo(() => {
    return requests?.indexOf(item) ?? -1;
  }, [item, requests]);

  const isSelected = useMemo(() => {
    return globalIndex === selectedIndex;
  }, [globalIndex, selectedIndex]);

  useEffect(() => {
    if (isHighlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isHighlighted]);

  // Dynamic values passed via CSS Variables
  const dynamicVars = {
    "--method-color": mc,
    "--method-color-alpha-10":
      `color-mix(in srgb, ${mc} 10%, transparent)`,
    "--method-color-alpha-18":
      `color-mix(in srgb, ${mc} 18%, transparent)`,
    "--method-color-alpha-30":
      `color-mix(in srgb, ${mc} 30%, transparent)`,
    "--method-color-alpha-cc":
      `color-mix(in srgb, ${mc} 80%, transparent)`,
  } as React.CSSProperties;

  return (
    <div>
      <Tooltip
        title={
          <DetailPanel item={item} />
          // item.response.body && "url" in item.response.body ? (
          //   <ContentRenderer data={item.response.body} />
          // ) : (
          //   "NO PREVIEW AVAILABLE"
          // )
        }
        titleStyle={{ padding: 0 }}
        arrow
        position="left"
      >
        <div
          ref={rowRef}
          onClick={() => {
            // setSelectedIndex(globalIndex);
            onSeek(item.startSeconds);
          }}
          title={`Jump to ${formatSeconds(item.startSeconds)}`}
          className={`
          ${cssStyles.rowContainer} 
          ${isHighlighted ? cssStyles.isHighlighted : ""} 
          ${isSelected ? cssStyles.isSelected : ""} 
          ${globalIndex % 2 !== 0 ? cssStyles.isOdd : ""}
        `}
          style={dynamicVars}
        >
          {isHighlighted && <span className={cssStyles.pulseDot} />}

          <div className={cssStyles.flexWrapper}>
            <span className={cssStyles.indexNumber}>
              {String(globalIndex + 1).padStart(2, "0")}
            </span>

            <div className={cssStyles.contentBody}>
              <div
                className={`${cssStyles.urlHeader} ${isHighlighted ? cssStyles.highlightedText : ""}`}
                title={item.request.url}
              >
                <span className={cssStyles.domain}>{getDomain(item.request.url)}</span>
                <span className={isHighlighted ? cssStyles.pathHighlighted : cssStyles.path}>
                  {getPath(item.request.url)}
                </span>
              </div>

              <div className={cssStyles.metaRow}>
                <Chip variant={getMethodColor(item.request.method as any, true) as any} style={{ padding: "1px 6px", fontSize: "10px" }} removeBackground removeBorder >{item.request.method}</Chip>

                <span className={cssStyles.timeInfo}>
                  <span className={cssStyles.icon}>▶</span>
                  <span>{formatSeconds(item.startSeconds)}</span>
                  <span className={cssStyles.arrow}>→</span>
                  <span className={cssStyles.icon}>■</span>
                  <span>{formatSeconds(item.endSeconds)}</span>
                </span>

                <span className={`${cssStyles.duration} ${isHighlighted ? cssStyles.durationHighlighted : ""}`}>
                  {formatSeconds(item.endSeconds - item.startSeconds)} dur
                </span>

                {!!item?.response?.headers?.['content-type'] && (
                  <Chip>{item.response.headers['content-type']}</Chip>
                )}

                {/* TODO show content-type here */}

                <span className={cssStyles.seekLabel}>↗ seek</span>
              </div>

              <ProgressBar
                item={item}
                isHighlighted={isHighlighted}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
              />
            </div>
          </div>
        </div>
      </Tooltip>
      {/* <Collapse in={openCollapse} >
        <div style={{ maxHeight: "200px", overflow: "auto" }} >
          <DetailPanel item={item} />
        </div>
      </Collapse> */}
    </div>
  );
}