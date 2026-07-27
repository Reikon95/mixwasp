import { cn } from "../client/utils";
import { getMixEmbedHeight, type MixEmbed } from "./mixEmbed";

export function MixEmbedPreview({
  embed,
  title,
  className,
}: {
  embed: MixEmbed;
  title: string;
  className?: string;
}) {
  const height = getMixEmbedHeight(embed.platform);

  return (
    <div
      className={cn(
        "border-border overflow-hidden rounded-md border",
        className,
      )}
    >
      <iframe
        src={embed.src}
        title={`${title} preview`}
        className={cn(
          "bg-muted w-full border-0",
          embed.platform === "youtube" && "aspect-video",
        )}
        style={height ? { height } : undefined}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
