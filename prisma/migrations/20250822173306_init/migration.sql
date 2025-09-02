/*
  Warnings:

  - The `packaging` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "packaging",
ADD COLUMN     "packaging" INTEGER;
