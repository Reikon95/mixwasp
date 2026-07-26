-- AlterTable
ALTER TABLE "Mix" ADD COLUMN "upvoteCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "MixUpvote" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "mixId" INTEGER NOT NULL,

    CONSTRAINT "MixUpvote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MixUpvote_createdAt_idx" ON "MixUpvote"("createdAt");

-- CreateIndex
CREATE INDEX "MixUpvote_mixId_createdAt_idx" ON "MixUpvote"("mixId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MixUpvote_userId_mixId_key" ON "MixUpvote"("userId", "mixId");

-- AddForeignKey
ALTER TABLE "MixUpvote" ADD CONSTRAINT "MixUpvote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MixUpvote" ADD CONSTRAINT "MixUpvote_mixId_fkey" FOREIGN KEY ("mixId") REFERENCES "Mix"("id") ON DELETE CASCADE ON UPDATE CASCADE;
