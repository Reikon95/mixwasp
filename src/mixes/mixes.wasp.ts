import { action, page, query, route, type Spec } from "@wasp.sh/spec";

import { MixesPage } from "./MixesPage" with { type: "ref" };
import {
  ensureDemoMixes,
  getPopularMixes,
  toggleMixUpvote,
} from "./operations" with { type: "ref" };

export const mixesSpec: Spec = [
  route("MixesRoute", "/mixes", page(MixesPage)),

  query(getPopularMixes, {
    entities: ["Mix", "MixUpvote", "Artist", "Genre", "Tag"],
  }),
  action(toggleMixUpvote, {
    entities: ["User", "Mix", "MixUpvote"],
  }),
  action(ensureDemoMixes, {
    entities: ["User", "Mix", "MixUpvote", "Artist", "Genre", "Tag"],
  }),
];
