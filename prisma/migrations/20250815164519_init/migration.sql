/*
  Warnings:

  - Added the required column `Address` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pincode` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Customer" ADD COLUMN     "Address" TEXT NOT NULL,
ADD COLUMN     "pincode" TEXT NOT NULL;
