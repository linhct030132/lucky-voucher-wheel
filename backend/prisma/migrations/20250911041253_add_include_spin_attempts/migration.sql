-- AddForeignKey
ALTER TABLE `spin_attempts` ADD CONSTRAINT `spin_attempts_voucher_fk` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;
