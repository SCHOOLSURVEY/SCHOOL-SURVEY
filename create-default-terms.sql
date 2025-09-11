-- Create default terms for the school management system
-- This ensures there are terms available for course creation

-- First, check if the terms table exists, if not create it
CREATE TABLE IF NOT EXISTS terms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default terms if they don't exist (Nigerian Academic System)
INSERT INTO terms (name, start_date, end_date, is_active) VALUES
('First Term 2024/2025', '2024-09-01', '2024-12-15', true),
('Second Term 2024/2025', '2025-01-15', '2025-04-15', true),
('Third Term 2024/2025', '2025-05-01', '2025-07-15', false),
('First Term 2025/2026', '2025-09-01', '2025-12-15', false),
('Second Term 2025/2026', '2026-01-15', '2026-04-15', false),
('Third Term 2025/2026', '2026-05-01', '2026-07-15', false)
ON CONFLICT (name) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'NIGERIAN ACADEMIC TERMS CREATED SUCCESSFULLY!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Created terms table and inserted Nigerian academic terms:';
    RAISE NOTICE '- First Term 2024/2025 (Active)';
    RAISE NOTICE '- Second Term 2024/2025 (Active)';
    RAISE NOTICE '- Third Term 2024/2025 (Inactive)';
    RAISE NOTICE '- First Term 2025/2026 (Inactive)';
    RAISE NOTICE '- Second Term 2025/2026 (Inactive)';
    RAISE NOTICE '- Third Term 2025/2026 (Inactive)';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'You can now create courses with these terms!';
    RAISE NOTICE 'Perfect for Nigerian schools! 🇳🇬';
    RAISE NOTICE '=====================================================';
END $$;
