import { action, page, query, route, type Spec } from "@wasp.sh/spec";

import { FavouriteMixesPage } from "./FavouriteMixesPage" with { type: "ref" };
import { MixesPage } from "./MixesPage" with { type: "ref" };
import { ArtistMixesPage } from "./ArtistMixesPage" with { type: "ref" };
import { SubmitMixPage } from "./SubmitMixPage" with { type: "ref" };
import {
  createMix,
  ensureDemoMixes,
  getArtistMixes,
  getMixLinkPreview,
  getMyFavouriteMixes,
  getPopularMixes,
  searchArtists,
  toggleMixFavourite,
} from "./operations" with { type: "ref" };

export const mixesSpec: Spec = [
  route("MixesRoute", "/", page(MixesPage)),
  route("ArtistMixesRoute", "/artist/:artistId", page(ArtistMixesPage)),
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
  action(ensureDemoMixes, {
    entities: ["User", "Mix", "MixFavourite", "Artist", "Genre", "Tag"],
  }),
  action(createMix, {
    entities: ["User", "Mix", "Artist", "Genre", "Tag"],
  }),
];
