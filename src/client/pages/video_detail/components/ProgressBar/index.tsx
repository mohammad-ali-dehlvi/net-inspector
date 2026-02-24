import cssStyles from "src/client/pages/video_detail/components/ProgressBar/style.module.css";
import { getMethodColor } from "src/client/pages/video_detail/utils/helper";
import { NetworkItemType } from "src/shared/types";
import { useVideoDetailPlayerContext } from "src/client/pages/video_detail/context/VideoDetailPlayerContext";

interface ProgressBarProps {
  item: NetworkItemType;
  isHighlighted: boolean;
  rangeStart: number;
  rangeEnd: number;
}

export default function ProgressBar({ item, isHighlighted, rangeStart, rangeEnd }: ProgressBarProps) {
  const { duration } = useVideoDetailPlayerContext();

  const left = duration > 0 ? (item.startSeconds / duration) * 100 : 0;
  const width = duration > 0 ? ((item.endSeconds - item.startSeconds) / duration) * 100 : 0;
  const color = getMethodColor(item.request.method as any);

  // shade overlay calculations
  const rsLeft = duration > 0 ? (rangeStart / duration) * 100 : 0;
  const rsRight = duration > 0 ? (rangeEnd / duration) * 100 : 100;

  // Dynamic active portion math
  const activeLeft = Math.max(left, rsLeft);
  const activeWidth = Math.max(Math.min(left + width, rsRight) - activeLeft, 0);

  return (
    <div className={cssStyles.container}>
      {/* Full bar background layer */}
      <div
        className={cssStyles.fullBar}
        style={{
          left: `${left}%`,
          width: `${Math.max(width, 0.5)}%`,
          background: color
        }}
      />

      {/* Active (in-range) layer */}
      <div
        className={cssStyles.activeBar}
        style={{
          left: `${activeLeft}%`,
          width: `${activeWidth}%`,
          background: color,
          boxShadow: isHighlighted ? `0 0 8px ${color}88` : "none"
        }}
      />
    </div>
  );
}