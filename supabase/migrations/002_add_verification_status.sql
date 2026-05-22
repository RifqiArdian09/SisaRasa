-- Add verification_status and rejection_reason to stores
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Migrate existing data: is_verified = true -> 'approved', false -> 'pending'
UPDATE public.stores 
SET verification_status = 'approved' 
WHERE is_verified = true AND (verification_status IS NULL OR verification_status = 'pending');

UPDATE public.stores 
SET verification_status = 'pending' 
WHERE is_verified = false AND verification_status IS NULL;
