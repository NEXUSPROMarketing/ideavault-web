import { hasLiveMarker, stripLiveMarker } from "@/lib/format";
import { LiveBadge } from "@/components/pills";

/**
 * Renders a string, stripping any "[live]" / "(live …)" markers and
 * appending a green LIVE badge when they were present.
 */
export function LiveText({
  text,
  className,
}: {
  text: string | null | undefined;
  className?: string;
}) {
  if (!text) return null;
  const live = hasLiveMarker(text);
  return (
    <span className={className}>
      {stripLiveMarker(text)}
      {live && (
        <>
          {" "}
          <LiveBadge />
        </>
      )}
    </span>
  );
}
