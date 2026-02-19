import { getMethodColor } from "src/client/pages/video_detail/utils/helper";
import { NetworkItemType } from "src/shared/types"

interface ProgressBarProps {
  item: NetworkItemType
  duration: number
  isHighlighted: boolean
  rangeStart: number
  rangeEnd: number
}

export default function ProgressBar({ item, duration, isHighlighted, rangeStart, rangeEnd }: ProgressBarProps) {
  const left = duration > 0 ? (item.startSeconds / duration) * 100 : 0;
  const width = duration > 0 ? ((item.endSeconds - item.startSeconds) / duration) * 100 : 0;
  const color = getMethodColor(item.request.method as any);

  // shade overlay for out-of-range portion
  const rsLeft = duration > 0 ? (rangeStart / duration) * 100 : 0;
  const rsRight = duration > 0 ? (rangeEnd / duration) * 100 : 100;

  return (
    <div style={{ position: "relative", height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", width: "100%", marginTop: "6px", overflow: "hidden" }}>
      {/* Full bar */}
      <div style={{ position: "absolute", left: `${left}%`, width: `${Math.max(width, 0.5)}%`, top: 0, height: "4px", background: color, opacity: 0.25, borderRadius: "2px", minWidth: "6px" }} />
      {/* Active (in-range) portion clipped */}
      <div style={{ position: "absolute", left: `${Math.max(left, rsLeft)}%`, width: `${Math.max(Math.min(left + width, rsRight) - Math.max(left, rsLeft), 0)}%`, top: 0, height: "4px", background: color, borderRadius: "2px", boxShadow: isHighlighted ? `0 0 8px ${color}88` : "none", transition: "box-shadow .2s" }} />
    </div>
  );
}