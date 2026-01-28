--
-- PostgreSQL database dump
--

\restrict 9V1S2KtIcVm77SJvxS1SO0LbsRG1m3LynLWs7lqonrdzaB8QE778lAPQuqzUmtQ

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_fecha_actualizacion(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_fecha_actualizacion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
                        BEGIN
                            NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
                            RETURN NEW;
                        END;
                        $$;


ALTER FUNCTION public.update_fecha_actualizacion() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: especialistas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.especialistas (
    uid character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    especialidad character varying(50) NOT NULL,
    capacidad_turnos integer DEFAULT 1,
    CONSTRAINT especialistas_especialidad_check CHECK (((especialidad)::text = ANY (ARRAY[('Kinesiologia'::character varying)::text, ('Odontologia'::character varying)::text])))
);


ALTER TABLE public.especialistas OWNER TO postgres;

--
-- Name: fichas_kinesicas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fichas_kinesicas (
    id integer NOT NULL,
    paciente_uid character varying(255) NOT NULL,
    especialista_uid character varying(255) NOT NULL,
    diagnostico text NOT NULL,
    tratamiento text NOT NULL,
    evaluacion text NOT NULL,
    observaciones text,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    sintomas text DEFAULT ''::text NOT NULL,
    estudios jsonb DEFAULT '[]'::jsonb,
    sesiones jsonb DEFAULT '[]'::jsonb,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.fichas_kinesicas OWNER TO postgres;

--
-- Name: fichas_kinesicas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fichas_kinesicas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fichas_kinesicas_id_seq OWNER TO postgres;

--
-- Name: fichas_kinesicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fichas_kinesicas_id_seq OWNED BY public.fichas_kinesicas.id;


--
-- Name: horarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.horarios (
    id integer NOT NULL,
    especialista_uid character varying(255) NOT NULL,
    lunes jsonb DEFAULT '[]'::jsonb,
    martes jsonb DEFAULT '[]'::jsonb,
    miercoles jsonb DEFAULT '[]'::jsonb,
    jueves jsonb DEFAULT '[]'::jsonb,
    viernes jsonb DEFAULT '[]'::jsonb,
    sabado jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.horarios OWNER TO postgres;

--
-- Name: horarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.horarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.horarios_id_seq OWNER TO postgres;

--
-- Name: horarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.horarios_id_seq OWNED BY public.horarios.id;


--
-- Name: odontogramas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.odontogramas (
    id integer NOT NULL,
    paciente_uid character varying(255) NOT NULL,
    especialista_uid character varying(255) NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tipo character varying(10) DEFAULT 'adulto'::character varying,
    atenciones jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT odontogramas_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('adulto'::character varying)::text, ('nino'::character varying)::text])))
);


ALTER TABLE public.odontogramas OWNER TO postgres;

--
-- Name: odontogramas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.odontogramas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.odontogramas_id_seq OWNER TO postgres;

--
-- Name: odontogramas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.odontogramas_id_seq OWNED BY public.odontogramas.id;


--
-- Name: pacientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pacientes (
    uid character varying(255) NOT NULL,
    nombre character varying(255) NOT NULL,
    obrasocial character varying(255) NOT NULL,
    domicilio text NOT NULL,
    telefono character varying(50) NOT NULL,
    fechanacimiento date NOT NULL,
    seccion character varying(50) NOT NULL,
    localidad character varying(100),
    CONSTRAINT pacientes_seccion_check CHECK (((seccion)::text = ANY (ARRAY[('Kinesiologia'::character varying)::text, ('Odontologia'::character varying)::text, ('Ambas'::character varying)::text])))
);


ALTER TABLE public.pacientes OWNER TO postgres;

--
-- Name: partes_pieza; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.partes_pieza (
    id integer NOT NULL,
    pieza_odontograma_id integer,
    nombre_parte character varying(20) NOT NULL,
    estado character varying(30),
    tratamiento character varying(30),
    color character varying(10),
    observaciones text
);


ALTER TABLE public.partes_pieza OWNER TO postgres;

--
-- Name: partes_pieza_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.partes_pieza_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.partes_pieza_id_seq OWNER TO postgres;

--
-- Name: partes_pieza_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.partes_pieza_id_seq OWNED BY public.partes_pieza.id;


--
-- Name: pdf_pacientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pdf_pacientes (
    id integer NOT NULL,
    uid_paciente character varying,
    path text NOT NULL,
    fecha_subida timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pdf_pacientes OWNER TO postgres;

--
-- Name: pdf_pacientes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pdf_pacientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pdf_pacientes_id_seq OWNER TO postgres;

--
-- Name: pdf_pacientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pdf_pacientes_id_seq OWNED BY public.pdf_pacientes.id;


--
-- Name: piezas_odontograma; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.piezas_odontograma (
    id integer NOT NULL,
    odontograma_id integer,
    numero_pieza integer NOT NULL,
    simbolo character varying(10),
    simbolo_color character varying(20)
);


ALTER TABLE public.piezas_odontograma OWNER TO postgres;

--
-- Name: piezas_odontograma_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.piezas_odontograma_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.piezas_odontograma_id_seq OWNER TO postgres;

--
-- Name: piezas_odontograma_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.piezas_odontograma_id_seq OWNED BY public.piezas_odontograma.id;


--
-- Name: reportes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reportes (
    id integer NOT NULL,
    reporte text
);


ALTER TABLE public.reportes OWNER TO postgres;

--
-- Name: reportes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reportes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reportes_id_seq OWNER TO postgres;

--
-- Name: reportes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reportes_id_seq OWNED BY public.reportes.id;


--
-- Name: turnos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.turnos (
    uid character varying(255) NOT NULL,
    especialista_uid character varying(255) NOT NULL,
    paciente_uid character varying(255) NOT NULL,
    fecha date NOT NULL,
    hora character varying(5) NOT NULL,
    comentario text,
    estado character varying(20) DEFAULT 'activo'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT turnos_estado_check CHECK (((estado)::text = ANY (ARRAY[('activo'::character varying)::text, ('cancelado'::character varying)::text, ('completado'::character varying)::text])))
);


ALTER TABLE public.turnos OWNER TO postgres;

--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    uid character varying(255) NOT NULL,
    lastlogin timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: fichas_kinesicas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fichas_kinesicas ALTER COLUMN id SET DEFAULT nextval('public.fichas_kinesicas_id_seq'::regclass);


--
-- Name: horarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.horarios ALTER COLUMN id SET DEFAULT nextval('public.horarios_id_seq'::regclass);


--
-- Name: odontogramas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.odontogramas ALTER COLUMN id SET DEFAULT nextval('public.odontogramas_id_seq'::regclass);


--
-- Name: partes_pieza id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partes_pieza ALTER COLUMN id SET DEFAULT nextval('public.partes_pieza_id_seq'::regclass);


--
-- Name: pdf_pacientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_pacientes ALTER COLUMN id SET DEFAULT nextval('public.pdf_pacientes_id_seq'::regclass);


--
-- Name: piezas_odontograma id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.piezas_odontograma ALTER COLUMN id SET DEFAULT nextval('public.piezas_odontograma_id_seq'::regclass);


--
-- Name: reportes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportes ALTER COLUMN id SET DEFAULT nextval('public.reportes_id_seq'::regclass);


--
-- Data for Name: especialistas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.especialistas (uid, email, password, especialidad, capacidad_turnos) FROM stdin;
esp_kinesiologa	admin@kine.com	$2a$10$EcP2nYqrRPZ9krnQuZ9QLelctfn05QMju4cfJH9Pr6XqRfDl0yIVa	Kinesiologia	4
esp_odontologo	admin@odon.com	$2a$10$YpUNSj9kUG/vW2z8vXZaUubmtAigEewEYrg5VcTRztBCQ6XXNyyem	Odontologia	2
\.


--
-- Data for Name: fichas_kinesicas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fichas_kinesicas (id, paciente_uid, especialista_uid, diagnostico, tratamiento, evaluacion, observaciones, fecha_creacion, sintomas, estudios, sesiones, fecha_actualizacion) FROM stdin;
1	4c8948c6-cd11-4b28-b00a-462aff7620ea	esp_kinesiologa	Algun diagnostico	Tratamiento a seguir	Evaluacion no editada	Observaciones	2025-09-22 15:01:08.209123	Sintoma1 sintoma2	["Estudio1", "Estudio2", "estudio3"]	[{"fecha": "2025-09-22", "notas": "Alguna nota", "numero": 1, "descripcion": "Hoy fue la sesion1"}, {"fecha": "2025-09-22", "notas": "Notas", "numero": 2, "descripcion": "Hoy sesion2"}, {"fecha": "2025-09-22", "notas": "notas", "numero": 3, "descripcion": "Sesion3"}]	2025-10-16 15:39:55.163833
\.


--
-- Data for Name: horarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.horarios (id, especialista_uid, lunes, martes, miercoles, jueves, viernes, sabado) FROM stdin;
2	esp_odontologo	[]	[]	["16:30"]	[]	[]	[]
1	esp_kinesiologa	[]	["08:00", "08:30", "09:00", "09:30", "10:00", "10:30"]	["08:00", "08:30", "09:00", "09:30"]	[]	["14:00", "14:30", "15:00", "15:30"]	["11:00", "11:30", "12:00", "12:30", "13:00", "13:30"]
\.


--
-- Data for Name: odontogramas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.odontogramas (id, paciente_uid, especialista_uid, fecha_creacion, tipo, atenciones) FROM stdin;
\.


--
-- Data for Name: pacientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pacientes (uid, nombre, obrasocial, domicilio, telefono, fechanacimiento, seccion, localidad) FROM stdin;
83e50081-42b8-43e8-ae60-d79e46be6681	Priscilla Belen Cuenca	UP	Alsina 1099	1168884740	2006-05-06	Kinesiologia	Marcos Paz
4c8948c6-cd11-4b28-b00a-462aff7620ea	Hilario Sanchez	OSDE	Alsina 1079	11223213321	2020-12-24	Kinesiologia	Marcos Paz
e943ce58-6657-45d0-acea-8d90f9d32c82	Alejandro Quintana	UP	Alsina 1079	1168884740	1960-09-27	Kinesiologia	Marcos Paz
3fae8f61-0d46-4e04-b199-81391b93b2ad	Priscilla Cuenca	MANUEL	Moro	11223213321	2025-09-26	Odontologia	Marcos Paz
9d43f857-faba-4d53-a641-35656827b3b6	Alejandro	MANUEL	Moro 2834	3243223214	2025-09-27	Odontologia	Marcos Paz
8a6498a8-079d-4ede-b3f3-f35078ac7117	Nuevo Paciente	OSDE	Moro 2834	11223213321	2025-10-17	Kinesiologia	Marcos Paz
\.


--
-- Data for Name: partes_pieza; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.partes_pieza (id, pieza_odontograma_id, nombre_parte, estado, tratamiento, color, observaciones) FROM stdin;
\.


--
-- Data for Name: pdf_pacientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pdf_pacientes (id, uid_paciente, path, fecha_subida) FROM stdin;
\.


--
-- Data for Name: piezas_odontograma; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.piezas_odontograma (id, odontograma_id, numero_pieza, simbolo, simbolo_color) FROM stdin;
\.


--
-- Data for Name: reportes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reportes (id, reporte) FROM stdin;
5	nuevo
\.


--
-- Data for Name: turnos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.turnos (uid, especialista_uid, paciente_uid, fecha, hora, comentario, estado, created_at) FROM stdin;
67b5487b-fe9b-422b-a8de-5bb10a85e1c1	esp_kinesiologa	4c8948c6-cd11-4b28-b00a-462aff7620ea	2025-09-23	08:00		cancelado	2025-09-12 20:16:22.466926
c62b3760-054c-4243-a6c9-00ad86ffc2a9	esp_kinesiologa	83e50081-42b8-43e8-ae60-d79e46be6681	2025-09-26	14:00	\N	completado	2025-09-22 14:59:28.315935
1b959788-eebb-44a6-bcbf-6aad2ff19ca7	esp_kinesiologa	4c8948c6-cd11-4b28-b00a-462aff7620ea	2025-09-23	09:00		activo	2025-09-22 15:20:13.35543
ec530c9c-9e4f-4dbd-a954-f97845ef5aeb	esp_kinesiologa	e943ce58-6657-45d0-acea-8d90f9d32c82	2025-09-23	08:00		activo	2025-09-22 15:38:15.611092
afd284b2-959e-4dd8-9068-d154a1690d90	esp_odontologo	9d43f857-faba-4d53-a641-35656827b3b6	2025-10-15	16:30	\N	activo	2025-10-14 11:19:05.810946
ea914311-91f5-49b9-b156-f8c1d317c8ef	esp_kinesiologa	8a6498a8-079d-4ede-b3f3-f35078ac7117	2025-10-17	14:30	\N	activo	2025-10-16 13:52:27.475093
5dd549b2-91e2-40e1-9491-1204f2840a5d	esp_kinesiologa	e943ce58-6657-45d0-acea-8d90f9d32c82	2025-10-17	14:30	\N	activo	2025-10-16 16:13:40.2313
c6ebfe0d-0d4f-4a51-8f8d-35ed47606f3b	esp_odontologo	9d43f857-faba-4d53-a641-35656827b3b6	2025-10-22	16:30	\N	activo	2025-10-16 16:14:44.986915
ed025222-8e47-4567-ad2b-1df6fd704e7f	esp_odontologo	3fae8f61-0d46-4e04-b199-81391b93b2ad	2025-10-22	16:30	\N	activo	2025-10-16 16:15:02.141335
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (uid, lastlogin, created_at) FROM stdin;
aeac928b-a78f-490a-bd47-ae7f9ad30036	\N	2025-07-09 20:08:47.760279
9af64f2d-2524-4862-ab4c-1967e7b04346	\N	2025-07-09 20:13:44.996328
5961f853-429d-460e-8553-5e2fa4c2271f	\N	2025-07-09 20:25:04.737736
a8a74282-dd59-4010-aaf8-6f9335cfc9e8	\N	2025-07-09 21:50:58.985116
f5656ef9-7aa4-4ae4-a134-30d02463ed4c	\N	2025-07-09 21:51:16.424819
2eb8ec55-5949-460d-9652-5172f4df131e	\N	2025-07-09 21:52:51.531385
460c4c37-6540-4340-bd48-5586104a029f	\N	2025-07-09 21:53:17.118945
66ef166a-8678-4d1b-8577-b8294d984314	\N	2025-07-09 21:53:34.056642
cd6e78c3-fe5e-460e-93a9-fbd92ee71fcb	\N	2025-07-09 22:36:08.014629
912a1180-c423-48c1-a701-b931a4503f37	\N	2025-09-04 01:37:21.782889
bcdc896c-ca7f-4635-971a-28466a818938	\N	2025-09-04 01:44:53.350818
4c8948c6-cd11-4b28-b00a-462aff7620ea	\N	2025-09-12 20:15:21.18068
83e50081-42b8-43e8-ae60-d79e46be6681	\N	2025-09-22 14:58:07.437454
b7b01a51-a767-4cbb-b678-b0b9a660d901	\N	2025-09-22 15:19:19.478715
e943ce58-6657-45d0-acea-8d90f9d32c82	\N	2025-09-22 15:36:43.151729
3fae8f61-0d46-4e04-b199-81391b93b2ad	\N	2025-09-26 19:42:37.635398
9d43f857-faba-4d53-a641-35656827b3b6	\N	2025-09-27 14:20:37.027352
8a6498a8-079d-4ede-b3f3-f35078ac7117	\N	2025-10-16 13:51:11.431466
esp_odontologo	2026-01-02 14:36:01.435546	2025-07-07 04:10:38.641109
esp_kinesiologa	2026-01-04 20:24:19.219084	2025-07-07 04:10:38.641109
\.


--
-- Name: fichas_kinesicas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fichas_kinesicas_id_seq', 2, true);


--
-- Name: horarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.horarios_id_seq', 2, true);


--
-- Name: odontogramas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.odontogramas_id_seq', 1, false);


--
-- Name: partes_pieza_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.partes_pieza_id_seq', 1, false);


--
-- Name: pdf_pacientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pdf_pacientes_id_seq', 19, true);


--
-- Name: piezas_odontograma_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.piezas_odontograma_id_seq', 1, false);


--
-- Name: reportes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reportes_id_seq', 5, true);


--
-- Name: especialistas especialistas_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialistas
    ADD CONSTRAINT especialistas_email_key UNIQUE (email);


--
-- Name: especialistas especialistas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialistas
    ADD CONSTRAINT especialistas_pkey PRIMARY KEY (uid);


--
-- Name: fichas_kinesicas fichas_kinesicas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fichas_kinesicas
    ADD CONSTRAINT fichas_kinesicas_pkey PRIMARY KEY (id);


--
-- Name: horarios horarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT horarios_pkey PRIMARY KEY (id);


--
-- Name: odontogramas odontogramas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.odontogramas
    ADD CONSTRAINT odontogramas_pkey PRIMARY KEY (id);


--
-- Name: pacientes pacientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pacientes
    ADD CONSTRAINT pacientes_pkey PRIMARY KEY (uid);


--
-- Name: partes_pieza partes_pieza_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partes_pieza
    ADD CONSTRAINT partes_pieza_pkey PRIMARY KEY (id);


--
-- Name: pdf_pacientes pdf_pacientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_pacientes
    ADD CONSTRAINT pdf_pacientes_pkey PRIMARY KEY (id);


--
-- Name: piezas_odontograma piezas_odontograma_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.piezas_odontograma
    ADD CONSTRAINT piezas_odontograma_pkey PRIMARY KEY (id);


--
-- Name: reportes reportes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_pkey PRIMARY KEY (id);


--
-- Name: turnos turnos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.turnos
    ADD CONSTRAINT turnos_pkey PRIMARY KEY (uid);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (uid);


--
-- Name: idx_especialistas_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_especialistas_email ON public.especialistas USING btree (email);


--
-- Name: idx_fichas_paciente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fichas_paciente ON public.fichas_kinesicas USING btree (paciente_uid);


--
-- Name: idx_odontogramas_paciente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_odontogramas_paciente ON public.odontogramas USING btree (paciente_uid);


--
-- Name: idx_pdf_pacientes_uid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pdf_pacientes_uid ON public.pdf_pacientes USING btree (uid_paciente);


--
-- Name: idx_turnos_especialista; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_turnos_especialista ON public.turnos USING btree (especialista_uid);


--
-- Name: idx_turnos_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_turnos_fecha ON public.turnos USING btree (fecha);


--
-- Name: idx_turnos_paciente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_turnos_paciente ON public.turnos USING btree (paciente_uid);


--
-- Name: fichas_kinesicas trigger_update_fecha_actualizacion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_fecha_actualizacion BEFORE UPDATE ON public.fichas_kinesicas FOR EACH ROW EXECUTE FUNCTION public.update_fecha_actualizacion();


--
-- Name: especialistas especialistas_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialistas
    ADD CONSTRAINT especialistas_uid_fkey FOREIGN KEY (uid) REFERENCES public.usuarios(uid) ON DELETE CASCADE;


--
-- Name: fichas_kinesicas fichas_kinesicas_especialista_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fichas_kinesicas
    ADD CONSTRAINT fichas_kinesicas_especialista_uid_fkey FOREIGN KEY (especialista_uid) REFERENCES public.especialistas(uid) ON DELETE CASCADE;


--
-- Name: fichas_kinesicas fichas_kinesicas_paciente_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fichas_kinesicas
    ADD CONSTRAINT fichas_kinesicas_paciente_uid_fkey FOREIGN KEY (paciente_uid) REFERENCES public.pacientes(uid) ON DELETE CASCADE;


--
-- Name: horarios horarios_especialista_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT horarios_especialista_uid_fkey FOREIGN KEY (especialista_uid) REFERENCES public.especialistas(uid) ON DELETE CASCADE;


--
-- Name: odontogramas odontogramas_especialista_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.odontogramas
    ADD CONSTRAINT odontogramas_especialista_uid_fkey FOREIGN KEY (especialista_uid) REFERENCES public.especialistas(uid) ON DELETE CASCADE;


--
-- Name: odontogramas odontogramas_paciente_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.odontogramas
    ADD CONSTRAINT odontogramas_paciente_uid_fkey FOREIGN KEY (paciente_uid) REFERENCES public.pacientes(uid) ON DELETE CASCADE;


--
-- Name: pacientes pacientes_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pacientes
    ADD CONSTRAINT pacientes_uid_fkey FOREIGN KEY (uid) REFERENCES public.usuarios(uid) ON DELETE CASCADE;


--
-- Name: partes_pieza partes_pieza_pieza_odontograma_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partes_pieza
    ADD CONSTRAINT partes_pieza_pieza_odontograma_id_fkey FOREIGN KEY (pieza_odontograma_id) REFERENCES public.piezas_odontograma(id) ON DELETE CASCADE;


--
-- Name: pdf_pacientes pdf_pacientes_uid_paciente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_pacientes
    ADD CONSTRAINT pdf_pacientes_uid_paciente_fkey FOREIGN KEY (uid_paciente) REFERENCES public.pacientes(uid) ON DELETE CASCADE;


--
-- Name: piezas_odontograma piezas_odontograma_odontograma_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.piezas_odontograma
    ADD CONSTRAINT piezas_odontograma_odontograma_id_fkey FOREIGN KEY (odontograma_id) REFERENCES public.odontogramas(id) ON DELETE CASCADE;


--
-- Name: turnos turnos_especialista_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.turnos
    ADD CONSTRAINT turnos_especialista_uid_fkey FOREIGN KEY (especialista_uid) REFERENCES public.especialistas(uid) ON DELETE CASCADE;


--
-- Name: turnos turnos_paciente_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.turnos
    ADD CONSTRAINT turnos_paciente_uid_fkey FOREIGN KEY (paciente_uid) REFERENCES public.pacientes(uid) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 9V1S2KtIcVm77SJvxS1SO0LbsRG1m3LynLWs7lqonrdzaB8QE778lAPQuqzUmtQ

