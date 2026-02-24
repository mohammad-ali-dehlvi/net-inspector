import cssStyles from "src/client/pages/video_detail/components/KeyBoardHitPill/style.module.css";

interface KbdPillProps {
  keys: string[];
  label: string;
}

export default function KbdPill({ keys, label }: KbdPillProps) {
  return (
    <span className={cssStyles.container}>
      {keys.map((k) => (
        <span key={k} className={cssStyles.key}>
          {k}
        </span>
      ))}
      <span className={cssStyles.label}>{label}</span>
    </span>
  );
}