-- Migration based on class_diagram.jpeg schema
-- Resetting existing if any
DROP TABLE IF EXISTS public.reminder CASCADE;
DROP TABLE IF EXISTS public.jadwal_obat CASCADE;
DROP TABLE IF EXISTS public.laporan_kepatuhan CASCADE;
DROP TABLE IF EXISTS public.interaksi_obat CASCADE;
DROP TABLE IF EXISTS public.obat CASCADE;
DROP TABLE IF EXISTS public.ai_assistant CASCADE;
DROP TABLE IF EXISTS public.chat CASCADE;
DROP TABLE IF EXISTS public.pasien CASCADE;
DROP TABLE IF EXISTS public.chat_db CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 1. PASIEN
-- Manual authentication table
CREATE TABLE public.pasien (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

-- 2. Obat
CREATE TABLE public.obat (
    obat_id SERIAL PRIMARY KEY,
    nama_obat TEXT NOT NULL,
    keterangan TEXT,
    dosis TEXT,
    efek_samping TEXT
);

-- 3. AI_Assistant
CREATE TABLE public.ai_assistant (
    ai_id SERIAL PRIMARY KEY,
    keterangan TEXT,
    model TEXT
);

-- 4. Chat
CREATE TABLE public.chat (
    chat_id SERIAL PRIMARY KEY,
    pasien_id UUID REFERENCES public.pasien(id) ON DELETE CASCADE,
    ai_id INTEGER REFERENCES public.ai_assistant(ai_id) ON DELETE SET NULL,
    chat TEXT[], -- Array of strings mapping to the diagram
    respon_ai TEXT,
    waktu TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Interaksi_Obat
CREATE TABLE public.interaksi_obat (
    interaksi_id SERIAL PRIMARY KEY,
    pasien_id UUID REFERENCES public.pasien(id) ON DELETE CASCADE,
    obat1 TEXT[], -- Array to match diagram
    obat2 TEXT,
    tingkat_risiko TEXT,
    hasil_interaksi TEXT
);

-- 6. Laporan_kepatuhan
CREATE TABLE public.laporan_kepatuhan (
    laporan_id SERIAL PRIMARY KEY,
    pasien_id UUID REFERENCES public.pasien(id) ON DELETE CASCADE,
    tanggal TIMESTAMPTZ DEFAULT NOW(),
    status_kepatuhan TEXT
);

-- 7. Jadwal_Obat
CREATE TABLE public.jadwal_obat (
    jadwal_id SERIAL PRIMARY KEY,
    laporan_id INTEGER REFERENCES public.laporan_kepatuhan(laporan_id) ON DELETE CASCADE,
    nama_obat TEXT,
    jenis_obat TEXT,
    waktu_minum TIMESTAMPTZ,
    dosis TEXT
);

-- 8. Reminder (Composition with Jadwal_Obat)
CREATE TABLE public.reminder (
    reminder_id SERIAL PRIMARY KEY,
    jadwal_id INTEGER UNIQUE REFERENCES public.jadwal_obat(jadwal_id) ON DELETE CASCADE,
    waktu_kirim TIMESTAMPTZ,
    status BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.pasien ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assistant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaksi_obat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan_kepatuhan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal_obat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder ENABLE ROW LEVEL SECURITY;

-- Create default permissive policies for development
CREATE POLICY "Allow public all access to pasien" ON public.pasien FOR ALL USING (true);
CREATE POLICY "Allow public all access to obat" ON public.obat FOR ALL USING (true);
CREATE POLICY "Allow public all access to ai_assistant" ON public.ai_assistant FOR ALL USING (true);
CREATE POLICY "Allow public all access to chat" ON public.chat FOR ALL USING (true);
CREATE POLICY "Allow public all access to interaksi_obat" ON public.interaksi_obat FOR ALL USING (true);
CREATE POLICY "Allow public all access to laporan_kepatuhan" ON public.laporan_kepatuhan FOR ALL USING (true);
CREATE POLICY "Allow public all access to jadwal_obat" ON public.jadwal_obat FOR ALL USING (true);
CREATE POLICY "Allow public all access to reminder" ON public.reminder FOR ALL USING (true);

-- Insert dummy AI Assistant data
INSERT INTO public.ai_assistant (keterangan, model) VALUES ('Gemini Health Assistant', 'gemini-1.5-flash');
