import { HttpError } from "wasp/server";

import {
  getAllowedMixLinkPlatform,
  getMixEmbed,
  type AllowedMixLinkPlatform,
} from "./mixEmbed";

export type MixLinkPreview = {
  platform: AllowedMixLinkPlatform;
  title: string | null;
  artistName: string | null;
  embed: {
    platform: AllowedMixLinkPlatform;
    src: string;
  };
};

type OEmbedResponse = {
  title?: string;
  author_name?: string;
};

function getOEmbedUrl(platform: AllowedMixLinkPlatform, link: string): string {
  const encoded = encodeURIComponent(link);

  switch (platform) {
    case "youtube":
      return `https://www.youtube.com/oembed?url=${encoded}&format=json`;
    case "soundcloud":
      return `https://soundcloud.com/oembed?format=json&url=${encoded}`;
    case "mixcloud":
      return `https://www.mixcloud.com/oembed/?format=json&url=${encoded}`;
  }
}

export async function fetchMixLinkPreview(link: string): Promise<MixLinkPreview> {
  const platform = getAllowedMixLinkPlatform(link);
  if (!platform) {
    throw new HttpError(
      400,
      "Link must be a YouTube, SoundCloud, or Mixcloud URL",
    );
  }

  const embed = getMixEmbed(link);
  if (!embed) {
    throw new HttpError(400, "Could not build embed for this link");
  }

  const response = await fetch(getOEmbedUrl(platform, link), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new HttpError(502, "Could not fetch link metadata");
  }

  const data = (await response.json()) as OEmbedResponse;

  return {
    platform,
    title: data.title?.trim() || null,
    artistName: data.author_name?.trim() || null,
    embed: {
      platform,
      src: embed.src,
    },
  };
}
