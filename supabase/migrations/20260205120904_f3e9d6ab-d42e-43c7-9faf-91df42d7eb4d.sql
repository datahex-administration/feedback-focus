-- Create feedback table to store all form submissions
CREATE TABLE public.feedback (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    feedback_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_time TEXT NOT NULL CHECK (meal_time IN ('breakfast', 'lunch', 'dinner')),
    food_temperature TEXT NOT NULL CHECK (food_temperature IN ('excellent', 'very_good', 'good', 'average', 'dissatisfied')),
    food_taste TEXT NOT NULL CHECK (food_taste IN ('excellent', 'very_good', 'good', 'average', 'dissatisfied')),
    food_aroma TEXT NOT NULL CHECK (food_aroma IN ('excellent', 'very_good', 'good', 'average', 'dissatisfied')),
    menu_variety TEXT NOT NULL CHECK (menu_variety IN ('excellent', 'very_good', 'good', 'average', 'dissatisfied')),
    staff_attitude TEXT NOT NULL CHECK (staff_attitude IN ('excellent', 'very_good', 'good', 'average', 'dissatisfied')),
    service_time TEXT NOT NULL CHECK (service_time IN ('excellent', 'very_good', 'good', 'average', 'dissatisfied')),
    cleanliness TEXT NOT NULL CHECK (cleanliness IN ('excellent', 'very_good', 'good', 'average', 'dissatisfied')),
    overall_experience TEXT NOT NULL CHECK (overall_experience IN ('excellent', 'very_good', 'good', 'average', 'dissatisfied')),
    suggestions TEXT
);

-- Enable RLS but allow public inserts (anonymous feedback)
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (public form)
CREATE POLICY "Anyone can submit feedback"
ON public.feedback
FOR INSERT
WITH CHECK (true);

-- Only allow reading via authenticated (admin) users - we'll handle admin check in code
CREATE POLICY "Authenticated users can read feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (true);

-- Create admin_settings table to store the admin passcode
CREATE TABLE public.admin_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read for passcode verification
CREATE POLICY "Anyone can read admin settings for verification"
ON public.admin_settings
FOR SELECT
USING (true);

-- Insert the default admin passcode
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES ('admin_passcode', '54321');