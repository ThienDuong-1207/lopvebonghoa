-- Migration: Add address field to parents table
-- Chay file nay tren Supabase SQL Editor

ALTER TABLE parents ADD COLUMN IF NOT EXISTS address text;
