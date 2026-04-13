-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "partnerId" TEXT NOT NULL DEFAULT 'techno-default-id';

-- CreateTable
CREATE TABLE "public"."Partner" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_username_key" ON "public"."Partner"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_password_key" ON "public"."Partner"("password");
