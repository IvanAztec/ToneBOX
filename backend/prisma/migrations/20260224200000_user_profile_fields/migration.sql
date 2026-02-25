-- Migration: user_profile_fields
-- Adds empresa, cargo, ciudad, estado, origenUTM to users table
-- SaaS Factory Data Engine — Growth Intelligence v1

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "empresa"   TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cargo"     TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ciudad"    TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "estado"    TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "origenUTM" TEXT;
