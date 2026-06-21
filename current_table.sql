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
CREATE TABLE public.obat (
  obat_id integer NOT NULL DEFAULT nextval('obat_obat_id_seq'::regclass),
  nama_obat text NOT NULL,
  keterangan text,
  dosis text,
  efek_samping text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  bentuk_obat text,
  CONSTRAINT obat_pkey PRIMARY KEY (obat_id)
);
CREATE TABLE public.ai_assistant (
  ai_id integer NOT NULL DEFAULT nextval('ai_assistant_ai_id_seq'::regclass),
  keterangan text,
  model text,
  CONSTRAINT ai_assistant_pkey PRIMARY KEY (ai_id)
);
CREATE TABLE public.laporan_kepatuhan (
  laporan_id integer NOT NULL DEFAULT nextval('laporan_kepatuhan_laporan_id_seq'::regclass),
  pasien_id uuid,
  tanggal timestamp with time zone DEFAULT now(),
  status_kepatuhan text,
  jadwal_obat_id integer,
  updated_at timestamp with time zone DEFAULT now(),
  catatan_pasien text,
  CONSTRAINT laporan_kepatuhan_pkey PRIMARY KEY (laporan_id),
  CONSTRAINT laporan_kepatuhan_pasien_id_fkey FOREIGN KEY (pasien_id) REFERENCES public.patients(id),
  CONSTRAINT laporan_kepatuhan_jadwal_id_fkey FOREIGN KEY (jadwal_obat_id) REFERENCES public.jadwal_obat(jadwal_id)
);
CREATE TABLE public.jadwal_obat (
  jadwal_id integer NOT NULL DEFAULT nextval('jadwal_obat_jadwal_id_seq'::regclass),
  waktu_minum time without time zone,
  dosis text,
  pasien_id uuid,
  obat_id integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  tanggal_mulai date DEFAULT CURRENT_DATE,
  tanggal_selesai date,
  instruksi_konsumsi text,
  CONSTRAINT jadwal_obat_pkey PRIMARY KEY (jadwal_id),
  CONSTRAINT jadwal_obat_pasien_id_fkey FOREIGN KEY (pasien_id) REFERENCES public.patients(id),
  CONSTRAINT jadwal_obat_obat_id_fkey FOREIGN KEY (obat_id) REFERENCES public.obat(obat_id)
);
CREATE TABLE public.reminder (
  reminder_id integer NOT NULL DEFAULT nextval('reminder_reminder_id_seq'::regclass),
  jadwal_id integer UNIQUE,
  waktu_kirim timestamp with time zone,
  status boolean DEFAULT false,
  CONSTRAINT reminder_pkey PRIMARY KEY (reminder_id),
  CONSTRAINT reminder_jadwal_id_fkey FOREIGN KEY (jadwal_id) REFERENCES public.jadwal_obat(jadwal_id)
);
CREATE TABLE public.chat_messages (
  message_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  pasien_id uuid NOT NULL,
  ai_id integer NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  waktu timestamp with time zone DEFAULT now(),
  chat_id uuid NOT NULL,
  CONSTRAINT chat_messages_pkey PRIMARY KEY (message_id),
  CONSTRAINT chat_messages_pasien_id_fkey FOREIGN KEY (pasien_id) REFERENCES public.patients(id),
  CONSTRAINT chat_messages_ai_id_fkey FOREIGN KEY (ai_id) REFERENCES public.ai_assistant(ai_id),
  CONSTRAINT chat_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(chat_id)
);
CREATE TABLE public.interaksi_obat (
  interaksi_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  pasien_id uuid,
  obat1 ARRAY,
  obat2 text,
  tingkat_risiko text,
  hasil_interaksi text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT interaksi_obat_pkey PRIMARY KEY (interaksi_id),
  CONSTRAINT interaksi_obat_pasien_id_fkey FOREIGN KEY (pasien_id) REFERENCES public.patients(id)
);
CREATE TABLE public.kepemilikan_obat (
  kepemilikan_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  pasien_id uuid NOT NULL,
  obat_id integer NOT NULL,
  tanggal_didapat timestamp with time zone DEFAULT now(),
  stok_obat integer DEFAULT 0,
  status_aktif boolean DEFAULT true,
  CONSTRAINT kepemilikan_obat_pkey PRIMARY KEY (kepemilikan_id),
  CONSTRAINT kepemilikan_obat_pasien_fkey FOREIGN KEY (pasien_id) REFERENCES public.patients(id),
  CONSTRAINT kepemilikan_obat_obat_fkey FOREIGN KEY (obat_id) REFERENCES public.obat(obat_id)
);
CREATE TABLE public.chats (
  chat_id uuid NOT NULL DEFAULT gen_random_uuid(),
  pasien_id uuid NOT NULL,
  ai_id integer,
  title text DEFAULT 'New Conversation'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chats_pkey PRIMARY KEY (chat_id),
  CONSTRAINT chats_pasien_id_fkey FOREIGN KEY (pasien_id) REFERENCES public.patients(id),
  CONSTRAINT chats_ai_id_fkey FOREIGN KEY (ai_id) REFERENCES public.ai_assistant(ai_id)
);



BEGIN
  -- We use "public.patients" to be explicit about the schema
  INSERT INTO public.patients (id, email, name)
  VALUES (
    new.id, -- This must match the 'id' column type in your table (usually uuid)
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', 'New Patient') -- Grabs 'name' from frontend
  );
  RETURN new;
END;



BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
