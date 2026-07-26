-- CreateTable
CREATE TABLE "Mix" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "artistId" INTEGER NOT NULL,
    "link" TEXT NOT NULL,
    "promoter" TEXT,
    "description" TEXT,

    CONSTRAINT "Mix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MixToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_GenreToMix" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_MixToTag_AB_unique" ON "_MixToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_MixToTag_B_index" ON "_MixToTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_GenreToMix_AB_unique" ON "_GenreToMix"("A", "B");

-- CreateIndex
CREATE INDEX "_GenreToMix_B_index" ON "_GenreToMix"("B");

-- AddForeignKey
ALTER TABLE "Mix" ADD CONSTRAINT "Mix_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MixToTag" ADD CONSTRAINT "_MixToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Mix"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MixToTag" ADD CONSTRAINT "_MixToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenreToMix" ADD CONSTRAINT "_GenreToMix_A_fkey" FOREIGN KEY ("A") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenreToMix" ADD CONSTRAINT "_GenreToMix_B_fkey" FOREIGN KEY ("B") REFERENCES "Mix"("id") ON DELETE CASCADE ON UPDATE CASCADE;
