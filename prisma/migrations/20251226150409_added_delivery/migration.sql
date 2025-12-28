-- CreateEnum
CREATE TYPE "public"."shippingstatus" AS ENUM ('PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."OrderItem" ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "shippedBy" TEXT,
ADD COLUMN     "shippingStatus" "public"."shippingstatus" NOT NULL DEFAULT 'PENDING';
