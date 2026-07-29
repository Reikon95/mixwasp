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

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

const SOUNDCLOUD_HOSTS = new Set(["soundcloud.com", "www.soundcloud.com", "m.soundcloud.com"]);

const MIXCLOUD_HOSTS = new Set(["mixcloud.com", "www.mixcloud.com"]);

const SPOTIFY_HOSTS = new Set(["open.spotify.com"]);

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, "");
}

function isHttpsUrl(url: URL): boolean {
  return url.protocol === "https:";
}

function getYoutubeVideoId(url: URL): string | null {
  const host = normalizeHostname(url.hostname);
  if (!YOUTUBE_HOSTS.has(host)) {
    return null;
  }

  if (host === "youtu.be" || host === "www.youtu.be") {
    const id = url.pathname.slice(1).split("/")[0] || null;
    return id && /^[\w-]{6,}$/.test(id) ? id : null;
  }

  const fromQuery = url.searchParams.get("v");
  if (fromQuery && /^[\w-]{6,}$/.test(fromQuery)) {
    return fromQuery;
  }

  const embedMatch = url.pathname.match(/^\/embed\/([\w-]{6,})/);
  if (embedMatch?.[1]) {
    return embedMatch[1];
  }

  const shortsMatch = url.pathname.match(/^\/shorts\/([\w-]{6,})/);
  if (shortsMatch?.[1]) {
    return shortsMatch[1];
  }

  return null;
}

function getSpotifyEmbedSrc(url: URL): string | null {
  if (!SPOTIFY_HOSTS.has(normalizeHostname(url.hostname))) {
    return null;
  }

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
    if (!isHttpsUrl(url)) {
      return null;
    }

    if (getYoutubeVideoId(url)) {
      return "youtube";
    }

    const host = normalizeHostname(url.hostname);

    if (SOUNDCLOUD_HOSTS.has(host) && url.pathname.length > 1) {
      return "soundcloud";
    }

    if (MIXCLOUD_HOSTS.has(host) && url.pathname.length > 1) {
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
    if (!isHttpsUrl(url)) {
      return null;
    }

    const youtubeId = getYoutubeVideoId(url);
    if (youtubeId) {
      return {
        platform: "youtube",
        src: `https://www.youtube.com/embed/${youtubeId}`,
      };
    }

    const host = normalizeHostname(url.hostname);

    if (SOUNDCLOUD_HOSTS.has(host) && url.pathname.length > 1) {
      return {
        platform: "soundcloud",
        src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(link)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=true&visual=true`,
      };
    }

    if (MIXCLOUD_HOSTS.has(host) && url.pathname.length > 1) {
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
