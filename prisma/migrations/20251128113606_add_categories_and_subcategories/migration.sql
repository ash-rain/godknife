-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "subcategoryId" TEXT;

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameBg" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "descriptionBg" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subcategory" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameBg" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "descriptionBg" TEXT,
    "categoryId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_order_idx" ON "Category"("order");

-- CreateIndex
CREATE INDEX "Category_isActive_idx" ON "Category"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_slug_key" ON "Subcategory"("slug");

-- CreateIndex
CREATE INDEX "Subcategory_slug_idx" ON "Subcategory"("slug");

-- CreateIndex
CREATE INDEX "Subcategory_categoryId_idx" ON "Subcategory"("categoryId");

-- CreateIndex
CREATE INDEX "Subcategory_order_idx" ON "Subcategory"("order");

-- CreateIndex
CREATE INDEX "Subcategory_isActive_idx" ON "Subcategory"("isActive");

-- CreateIndex
CREATE INDEX "Post_categoryId_idx" ON "Post"("categoryId");

-- CreateIndex
CREATE INDEX "Post_subcategoryId_idx" ON "Post"("subcategoryId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
