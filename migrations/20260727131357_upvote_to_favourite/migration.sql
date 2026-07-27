-- RenameColumn
ALTER TABLE "Mix" RENAME COLUMN "upvoteCount" TO "favouriteCount";

-- RenameTable
ALTER TABLE "MixUpvote" RENAME TO "MixFavourite";

-- RenameForeignKey
ALTER TABLE "MixFavourite" RENAME CONSTRAINT "MixUpvote_userId_fkey" TO "MixFavourite_userId_fkey";
ALTER TABLE "MixFavourite" RENAME CONSTRAINT "MixUpvote_mixId_fkey" TO "MixFavourite_mixId_fkey";

-- RenameIndex
ALTER INDEX "MixUpvote_createdAt_idx" RENAME TO "MixFavourite_createdAt_idx";
ALTER INDEX "MixUpvote_mixId_createdAt_idx" RENAME TO "MixFavourite_mixId_createdAt_idx";
ALTER INDEX "MixUpvote_userId_mixId_key" RENAME TO "MixFavourite_userId_mixId_key";
