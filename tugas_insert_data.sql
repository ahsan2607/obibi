-- File: tugas_insert_data.sql
-- Kumpulan query untuk insert 5 dummy data ke masing-masing tabel

-- 1. Insert 5 Pasien
INSERT INTO public.pasien (id, nama, email, password) VALUES
('11111111-1111-1111-1111-111111111111', 'Budi Santoso', 'budi@example.com', 'password123'),
('22222222-2222-2222-2222-222222222222', 'Siti Aminah', 'siti@example.com', 'password123'),
('33333333-3333-3333-3333-333333333333', 'Andi Wijaya', 'andi@example.com', 'password123'),
('44444444-4444-4444-4444-444444444444', 'Dewi Lestari', 'dewi@example.com', 'password123'),
('55555555-5555-5555-5555-555555555555', 'Eko Prasetyo', 'eko@example.com', 'password123')
ON CONFLICT (email) DO NOTHING;

-- 2. Insert 5 Obat
INSERT INTO public.obat (obat_id, nama_obat, keterangan, dosis, efek_samping) VALUES
(1, 'Paracetamol', 'Obat penurun panas dan pereda nyeri', '3x sehari 500mg', 'Mual, ruam kulit'),
(2, 'Amoxicillin', 'Antibiotik untuk infeksi bakteri', '3x sehari 500mg', 'Diare, sakit perut'),
(3, 'Omeprazole', 'Antibiotik spektrum luas', '2x sehari 20mg', 'Sakit kepala'),
(4, 'Cetirizine', 'Obat untuk asam lambung', '1x sehari 10mg', 'Pusing'),
(5, 'Ibuprofen', 'Obat antiinflamasi nonsteroid', '2x sehari 400mg', 'Nyeri lambung')
ON CONFLICT (obat_id) DO NOTHING;

-- 3. Insert 5 AI Assistant (Tabel sudah punya 1 dari init.sql, kita insert 5 tambahan)
INSERT INTO public.ai_assistant (ai_id, keterangan, model) VALUES
(2, 'Gemini Diet Assistant', 'gemini-1.5-pro'),
(3, 'Gemini Mental Health', 'gemini-1.5-flash'),
(4, 'Gemini Fitness Coach', 'gemini-1.5-pro'),
(5, 'Gemini Child Care', 'gemini-1.5-flash'),
(6, 'Gemini Elderly Care', 'gemini-1.5-pro')
ON CONFLICT (ai_id) DO NOTHING;

-- 4. Insert 5 Laporan Kepatuhan
INSERT INTO public.laporan_kepatuhan (laporan_id, pasien_id, tanggal, status_kepatuhan) VALUES
(1, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '1 day', 'Patuh'),
(2, '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '2 days', 'Tidak Patuh'),
(3, '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '3 days', 'Patuh'),
(4, '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '4 days', 'Patuh'),
(5, '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '5 days', 'Sebagian Patuh')
ON CONFLICT (laporan_id) DO NOTHING;

-- 5. Insert 5 Jadwal Obat
INSERT INTO public.jadwal_obat (jadwal_id, laporan_id, nama_obat, jenis_obat, waktu_minum, dosis) VALUES
(1, 1, 'Paracetamol', 'Tablet', NOW() + INTERVAL '2 hours', '500mg'),
(2, 2, 'Amoxicillin', 'Kapsul', NOW() + INTERVAL '4 hours', '500mg'),
(3, 3, 'Omeprazole', 'Kapsul', NOW() + INTERVAL '6 hours', '20mg'),
(4, 4, 'Cetirizine', 'Tablet', NOW() + INTERVAL '8 hours', '10mg'),
(5, 5, 'Ibuprofen', 'Tablet', NOW() + INTERVAL '10 hours', '400mg')
ON CONFLICT (jadwal_id) DO NOTHING;

-- 6. Insert 5 Reminder
INSERT INTO public.reminder (reminder_id, jadwal_id, waktu_kirim, status) VALUES
(1, 1, NOW() + INTERVAL '1 hour 45 minutes', false),
(2, 2, NOW() + INTERVAL '3 hours 45 minutes', false),
(3, 3, NOW() + INTERVAL '5 hours 45 minutes', false),
(4, 4, NOW() + INTERVAL '7 hours 45 minutes', true),
(5, 5, NOW() + INTERVAL '9 hours 45 minutes', false)
ON CONFLICT (reminder_id) DO NOTHING;

-- 7. Insert 5 Chat
INSERT INTO public.chat (chat_id, pasien_id, ai_id, chat, respon_ai, waktu) VALUES
(1, '11111111-1111-1111-1111-111111111111', 1, ARRAY['User: Halo, saya sakit kepala.', 'AI: Anda bisa minum paracetamol.'], 'Anda bisa minum paracetamol.', NOW()),
(2, '22222222-2222-2222-2222-222222222222', 2, ARRAY['User: Berapa kalori nasi?', 'AI: Sekitar 130 kalori per 100 gram.'], 'Sekitar 130 kalori per 100 gram.', NOW()),
(3, '33333333-3333-3333-3333-333333333333', 1, ARRAY['User: Cara mengatasi flu?', 'AI: Istirahat yang cukup dan banyak minum air.'], 'Istirahat yang cukup dan banyak minum air.', NOW()),
(4, '44444444-4444-4444-4444-444444444444', 3, ARRAY['User: Saya merasa cemas.', 'AI: Cobalah latihan pernapasan.'], 'Cobalah latihan pernapasan.', NOW()),
(5, '55555555-5555-5555-5555-555555555555', 4, ARRAY['User: Olahraga untuk pemula?', 'AI: Jalan kaki 30 menit sehari sangat baik.'], 'Jalan kaki 30 menit sehari sangat baik.', NOW())
ON CONFLICT (chat_id) DO NOTHING;

-- 8. Insert 5 Interaksi Obat
INSERT INTO public.interaksi_obat (interaksi_id, pasien_id, obat1, obat2, tingkat_risiko, hasil_interaksi) VALUES
(1, '11111111-1111-1111-1111-111111111111', ARRAY['Ibuprofen'], 'Aspirin', 'Tinggi', 'Meningkatkan risiko perdarahan lambung'),
(2, '22222222-2222-2222-2222-222222222222', ARRAY['Omeprazole'], 'Clopidogrel', 'Sedang', 'Menurunkan efektivitas clopidogrel'),
(3, '33333333-3333-3333-3333-333333333333', ARRAY['Amoxicillin'], 'Pil KB', 'Rendah', 'Dapat menurunkan efektivitas kontrasepsi'),
(4, '44444444-4444-4444-4444-444444444444', ARRAY['Paracetamol'], 'Warfarin', 'Rendah', 'Dapat meningkatkan efek warfarin jika dosis tinggi'),
(5, '55555555-5555-5555-5555-555555555555', ARRAY['Cetirizine'], 'Alkohol', 'Tinggi', 'Meningkatkan rasa kantuk secara signifikan')
ON CONFLICT (interaksi_id) DO NOTHING;

-- Update sequences for auto-increment columns (SERIAL) to prevent ID conflicts for future inserts
SELECT setval('public.obat_obat_id_seq', (SELECT MAX(obat_id) FROM public.obat));
SELECT setval('public.ai_assistant_ai_id_seq', (SELECT MAX(ai_id) FROM public.ai_assistant));
SELECT setval('public.laporan_kepatuhan_laporan_id_seq', (SELECT MAX(laporan_id) FROM public.laporan_kepatuhan));
SELECT setval('public.jadwal_obat_jadwal_id_seq', (SELECT MAX(jadwal_id) FROM public.jadwal_obat));
SELECT setval('public.reminder_reminder_id_seq', (SELECT MAX(reminder_id) FROM public.reminder));
SELECT setval('public.chat_chat_id_seq', (SELECT MAX(chat_id) FROM public.chat));
SELECT setval('public.interaksi_obat_interaksi_id_seq', (SELECT MAX(interaksi_id) FROM public.interaksi_obat));
