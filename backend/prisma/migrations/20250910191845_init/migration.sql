-- CreateTable
CREATE TABLE `user_profiles` (
    `id` VARCHAR(36) NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `address` VARCHAR(500) NULL,
    `referral_source` VARCHAR(100) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `consent_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_email`(`email`),
    INDEX `idx_phone`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `devices` (
    `id` VARCHAR(36) NOT NULL,
    `device_fp_hash` VARCHAR(255) NOT NULL,
    `first_seen_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `last_seen_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `device_fp_hash`(`device_fp_hash`),
    INDEX `idx_device_fp`(`device_fp_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `device_sessions` (
    `id` VARCHAR(36) NOT NULL,
    `device_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_device_id`(`device_id`),
    INDEX `idx_user_id`(`user_id`),
    UNIQUE INDEX `unique_device_session`(`device_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vouchers` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `face_value` VARCHAR(255) NOT NULL,
    `voucher_type` ENUM('discount_percentage', 'discount_amount', 'free_product') NULL DEFAULT 'discount_percentage',
    `base_probability` DECIMAL(10, 4) NOT NULL DEFAULT 0.1000,
    `initial_stock` INTEGER NOT NULL DEFAULT 0,
    `remaining_stock` INTEGER NOT NULL DEFAULT 0,
    `max_per_user` INTEGER NULL DEFAULT 1,
    `valid_from` TIMESTAMP(0) NULL,
    `valid_to` TIMESTAMP(0) NULL,
    `status` ENUM('draft', 'active', 'inactive') NULL DEFAULT 'draft',
    `code_generation` ENUM('auto', 'pre_seeded') NULL DEFAULT 'auto',
    `code_prefix` VARCHAR(10) NULL DEFAULT 'LV',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_status`(`status`),
    INDEX `idx_valid_period`(`valid_from`, `valid_to`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `voucher_codes` (
    `id` VARCHAR(36) NOT NULL,
    `voucher_id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `status` ENUM('available', 'issued', 'redeemed', 'expired') NULL DEFAULT 'available',
    `issued_to_user_id` VARCHAR(36) NULL,
    `issued_at` TIMESTAMP(0) NULL,
    `redeemed_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `code`(`code`),
    INDEX `idx_code`(`code`),
    INDEX `idx_status`(`status`),
    INDEX `idx_voucher`(`voucher_id`),
    INDEX `issued_to_user_id`(`issued_to_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spin_attempts` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `device_id` VARCHAR(36) NOT NULL,
    `outcome` ENUM('win', 'lose') NOT NULL,
    `voucher_id` VARCHAR(36) NULL,
    `voucher_code_id` VARCHAR(36) NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `device_id`(`device_id`),
    INDEX `idx_created_at`(`created_at`),
    INDEX `idx_outcome`(`outcome`),
    INDEX `voucher_code_id`(`voucher_code_id`),
    INDEX `voucher_id`(`voucher_id`),
    UNIQUE INDEX `unique_user_device_campaign`(`user_id`, `device_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `role` ENUM('STAFF', 'ADMIN') NULL DEFAULT 'STAFF',
    `is_active` BOOLEAN NULL DEFAULT true,
    `mfa_secret` VARCHAR(255) NULL,
    `mfa_enabled` BOOLEAN NULL DEFAULT false,
    `last_login_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `email`(`email`),
    INDEX `idx_email`(`email`),
    INDEX `idx_role`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(36) NOT NULL,
    `actor_id` VARCHAR(36) NULL,
    `actor_role` ENUM('STAFF', 'ADMIN', 'SYSTEM') NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` VARCHAR(36) NULL,
    `before_data` JSON NULL,
    `after_data` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_actor`(`actor_id`),
    INDEX `idx_created_at`(`created_at`),
    INDEX `idx_entity`(`entity_type`, `entity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_adjustments` (
    `id` VARCHAR(36) NOT NULL,
    `voucher_id` VARCHAR(36) NOT NULL,
    `staff_id` VARCHAR(36) NOT NULL,
    `delta_amount` INTEGER NOT NULL,
    `reason` TEXT NULL,
    `previous_stock` INTEGER NOT NULL,
    `new_stock` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_created_at`(`created_at`),
    INDEX `idx_voucher`(`voucher_id`),
    INDEX `staff_id`(`staff_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaigns` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `status` ENUM('draft', 'active', 'inactive', 'ended') NULL DEFAULT 'draft',
    `start_at` TIMESTAMP(0) NULL,
    `end_at` TIMESTAMP(0) NULL,
    `no_win_weight` DECIMAL(10, 4) NULL DEFAULT 0.1000,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `migrations` (
    `version` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `executed_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`version`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `device_sessions` ADD CONSTRAINT `device_sessions_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `device_sessions` ADD CONSTRAINT `device_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `voucher_codes` ADD CONSTRAINT `voucher_codes_ibfk_1` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `voucher_codes` ADD CONSTRAINT `voucher_codes_ibfk_2` FOREIGN KEY (`issued_to_user_id`) REFERENCES `user_profiles`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `spin_attempts` ADD CONSTRAINT `spin_attempts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user_profiles`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `spin_attempts` ADD CONSTRAINT `spin_attempts_ibfk_2` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `spin_attempts` ADD CONSTRAINT `spin_attempts_ibfk_5` FOREIGN KEY (`voucher_code_id`) REFERENCES `voucher_codes`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`actor_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `stock_adjustments` ADD CONSTRAINT `stock_adjustments_ibfk_1` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `stock_adjustments` ADD CONSTRAINT `stock_adjustments_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
