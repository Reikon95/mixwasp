import { action, page, query, route, type Spec } from "@wasp.sh/spec";

import { FavouriteMixesPage } from "./FavouriteMixesPage" with { type: "ref" };
import { MixesPage } from "./MixesPage" with { type: "ref" };
import { ArtistMixesPage } from "./ArtistMixesPage" with { type: "ref" };
import { GenreMixesPage } from "./GenreMixesPage" with { type: "ref" };
import { TagMixesPage } from "./TagMixesPage" with { type: "ref" };
import { SubmitMixPage } from "./SubmitMixPage" with { type: "ref" };
import {
  createMix,
  getArtistMixes,
  getGenreMixes,
  getMixLinkPreview,
  getMyFavouriteMixes,
  getPopularMixes,
  getTagMixes,
  searchArtists,
  searchGenres,
  searchTags,
  toggleMixFavourite,
} from "./operations" with { type: "ref" };

export const mixesSpec: Spec = [
  route("MixesRoute", "/", page(MixesPage)),
  route("ArtistMixesRoute", "/artist/:artistId", page(ArtistMixesPage)),
  route("GenreMixesRoute", "/genre/:genreId", page(GenreMixesPage)),
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
  query(getGenreMixes, {
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
  query(searchGenres, {
    entities: ["Genre"],
  }),
  query(searchTags, {
    entities: ["Tag"],
  }),
  action(toggleMixFavourite, {
    entities: ["User", "Mix", "MixFavourite"],
  }),
  action(createMix, {
    entities: ["User", "Mix", "Artist", "Genre", "Tag"],
  }),
];
