-- Add branding fields to schools table
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#1E40AF',
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255);

-- Update existing schools with default branding
UPDATE schools 
SET 
  primary_color = '#3B82F6',
  secondary_color = '#1E40AF'
WHERE primary_color IS NULL;

-- Create index for custom domains
CREATE INDEX IF NOT EXISTS idx_schools_custom_domain ON schools(custom_domain) WHERE custom_domain IS NOT NULL;

-- Create index for slugs
CREATE INDEX IF NOT EXISTS idx_schools_slug ON schools(slug) WHERE slug IS NOT NULL;
