-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "verificationToken" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" TIMESTAMP(3);
