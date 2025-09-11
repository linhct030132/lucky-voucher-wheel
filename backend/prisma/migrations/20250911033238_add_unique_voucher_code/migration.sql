/*
  Warnings:

  - A unique constraint covering the columns `[voucher_code]` on the table `vouchers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `voucher_code` to the `vouchers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `vouchers` ADD COLUMN `voucher_code` VARCHAR(50) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `voucher_code` ON `vouchers`(`voucher_code`);
