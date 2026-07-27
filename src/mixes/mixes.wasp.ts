import { action, page, query, route, type Spec } from "@wasp.sh/spec";

import { FavouriteMixesPage } from "./FavouriteMixesPage" with { type: "ref" };
import { MixesPage } from "./MixesPage" with { type: "ref" };
import { ArtistMixesPage } from "./ArtistMixesPage" with { type: "ref" };
import { TagMixesPage } from "./TagMixesPage" with { type: "ref" };
import { SubmitMixPage } from "./SubmitMixPage" with { type: "ref" };
import {
  createMix,
  getArtistMixes,
  getMixLinkPreview,
  getMyFavouriteMixes,
  getPopularMixes,
  getTagMixes,
  searchArtists,
  toggleMixFavourite,
} from "./operations" with { type: "ref" };

export const mixesSpec: Spec = [
  route("MixesRoute", "/", page(MixesPage)),
  route("ArtistMixesRoute", "/artist/:artistId", page(ArtistMixesPage)),
  route("TagMixesRoute", "/tag/:tagId", page(TagMixesPage)),
  route(
    "FavouriteMixesRoute",
    "/favourites",
    page(FavouriteMixesPage, { authRequired: true }),
  ),
  route(
    "SubmitMixRoute",
    "/submit",
    page(SubmitMixPage, { authRequired: true }),
  ),

  query(getPopularMixes, {
    entities: ["Mix", "MixFavourite", "Artist", "Genre", "Tag"],
  }),
  query(getArtistMixes, {
    entities: ["Mix", "MixFavourite", "Artist", "Genre", "Tag"],
  }),
  query(getTagMixes, {
    entities: ["Mix", "MixFavourite", "Artist", "Genre", "Tag"],
  }),
  query(getMyFavouriteMixes, {
    entities: ["Mix", "MixFavourite", "Artist", "Genre", "Tag"],
  }),
  query(getMixLinkPreview, {}),
  query(searchArtists, {
    entities: ["Artist"],
  }),
  action(toggleMixFavourite, {
    entities: ["User", "Mix", "MixFavourite"],
  }),
  action(createMix, {
    entities: ["User", "Mix", "Artist", "Genre", "Tag"],
  }),
];
