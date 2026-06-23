-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.patients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT patients_pkey PRIMARY KEY (id)
);
CREATE TABLE public.medications (
  id integer NOT NULL DEFAULT nextval('obat_obat_id_seq'::regclass),
  name text NOT NULL,
  description text,
  dosage text,
  side_effects text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  form text CHECK (form = ANY (ARRAY['tablet'::text, 'capsule'::text, 'liquid'::text, 'injection'::text, 'drops'::text, 'cream'::text, 'kapsul'::text, 'sirup'::text, 'tetes'::text, 'salep'::text, 'injeksi'::text, 'cair'::text])),
  patient_id uuid,
  stock_quantity numeric DEFAULT 0,
  stock_unit text DEFAULT 'piece'::text,
  is_active boolean DEFAULT true,
  CONSTRAINT medications_pkey PRIMARY KEY (id),
  CONSTRAINT obat_pasien_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id)
);
CREATE TABLE public.compliance_logs (
  laporan_id integer NOT NULL DEFAULT nextval('laporan_kepatuhan_laporan_id_seq'::regclass),
  patient_id uuid,
  logged_at timestamp with time zone DEFAULT now(),
  status text,
  schedule_id integer,
  updated_at timestamp with time zone DEFAULT now(),
  notes text,
  CONSTRAINT compliance_logs_pkey PRIMARY KEY (laporan_id),
  CONSTRAINT laporan_kepatuhan_pasien_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT laporan_kepatuhan_jadwal_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.medication_schedules(id)
);
CREATE TABLE public.medication_schedules (
  id integer NOT NULL DEFAULT nextval('jadwal_obat_jadwal_id_seq'::regclass),
  scheduled_time time without time zone,
  dosis text,
  patient_id uuid,
  medication_id integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  instructions text,
  CONSTRAINT medication_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT jadwal_obat_pasien_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT jadwal_obat_obat_id_fkey FOREIGN KEY (medication_id) REFERENCES public.medications(id)
);
CREATE TABLE public.reminder (
  reminder_id integer NOT NULL DEFAULT nextval('reminder_reminder_id_seq'::regclass),
  jadwal_id integer UNIQUE,
  waktu_kirim timestamp with time zone,
  status boolean DEFAULT false,
  CONSTRAINT reminder_pkey PRIMARY KEY (reminder_id),
  CONSTRAINT reminder_jadwal_id_fkey FOREIGN KEY (jadwal_id) REFERENCES public.medication_schedules(id)
);
CREATE TABLE public.chat_messages (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  patient_id uuid NOT NULL,
  ai_id integer NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  chat_id uuid NOT NULL,
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_pasien_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT chat_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id)
);
CREATE TABLE public.drug_interactions (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  patient_id uuid,
  medication_pair ARRAY,
  target_medication text,
  risk_level text,
  finding_details text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT drug_interactions_pkey PRIMARY KEY (id),
  CONSTRAINT interaksi_obat_pasien_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id)
);
CREATE TABLE public.chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  ai_id integer,
  title text DEFAULT 'New Conversation'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chats_pkey PRIMARY KEY (id),
  CONSTRAINT chats_pasien_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id)
);