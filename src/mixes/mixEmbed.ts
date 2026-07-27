export type MixEmbedPlatform =
  | "youtube"
  | "soundcloud"
  | "mixcloud"
  | "spotify";

export type AllowedMixLinkPlatform = Exclude<MixEmbedPlatform, "spotify">;

export type MixEmbed = {
  platform: MixEmbedPlatform;
  src: string;
};

function getYoutubeVideoId(url: URL): string | null {
  if (url.hostname === "youtu.be") {
    return url.pathname.slice(1).split("/")[0] || null;
  }

  if (!url.hostname.includes("youtube.com")) {
    return null;
  }

  const fromQuery = url.searchParams.get("v");
  if (fromQuery) {
    return fromQuery;
  }

  const embedMatch = url.pathname.match(/^\/embed\/([^/?]+)/);
  if (embedMatch?.[1]) {
    return embedMatch[1];
  }

  const shortsMatch = url.pathname.match(/^\/shorts\/([^/?]+)/);
  if (shortsMatch?.[1]) {
    return shortsMatch[1];
  }

  return null;
}

function getSpotifyEmbedSrc(url: URL): string | null {
  const match = url.pathname.match(
    /^\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/,
  );
  if (!match) {
    return null;
  }

  return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator`;
}

export function getAllowedMixLinkPlatform(
  link: string,
): AllowedMixLinkPlatform | null {
  try {
    const url = new URL(link);

    if (getYoutubeVideoId(url)) {
      return "youtube";
    }

    if (
      url.hostname.includes("soundcloud.com") &&
      url.pathname.length > 1
    ) {
      return "soundcloud";
    }

    if (url.hostname.includes("mixcloud.com") && url.pathname.length > 1) {
      return "mixcloud";
    }

    return null;
  } catch {
    return null;
  }
}

export function isAllowedMixLink(link: string): boolean {
  return getAllowedMixLinkPlatform(link) !== null;
}

export function getMixEmbed(link: string): MixEmbed | null {
  try {
    const url = new URL(link);

    const youtubeId = getYoutubeVideoId(url);
    if (youtubeId) {
      return {
        platform: "youtube",
        src: `https://www.youtube.com/embed/${youtubeId}`,
      };
    }

    if (url.hostname.includes("soundcloud.com")) {
      return {
        platform: "soundcloud",
        src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(link)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=true&visual=true`,
      };
    }

    if (url.hostname.includes("mixcloud.com") && url.pathname.length > 1) {
      return {
        platform: "mixcloud",
        src: `https://www.mixcloud.com/widget/iframe/?hide_cover=1&light=1&feed=${encodeURIComponent(url.pathname)}`,
      };
    }

    const spotifySrc = getSpotifyEmbedSrc(url);
    if (spotifySrc) {
      return {
        platform: "spotify",
        src: spotifySrc,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function getMixEmbedHeight(platform: MixEmbedPlatform): number | undefined {
  switch (platform) {
    case "soundcloud":
      return 166;
    case "mixcloud":
      return 120;
    case "spotify":
      return 152;
    case "youtube":
      return undefined;
  }
}
