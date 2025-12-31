--
-- PostgreSQL database dump
--

\restrict QJPVnlddLJ6tI7RVhYXjQaMJ7kFY2IlcqTFbgnoN5DWzfxMAwlJOWmugu3uRLrT

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
-- Name: pdf_pacientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_pacientes ALTER COLUMN id SET DEFAULT nextval('public.pdf_pacientes_id_seq'::regclass);


--
-- Name: pdf_pacientes pdf_pacientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_pacientes
    ADD CONSTRAINT pdf_pacientes_pkey PRIMARY KEY (id);


--
-- Name: idx_pdf_pacientes_uid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pdf_pacientes_uid ON public.pdf_pacientes USING btree (uid_paciente);


--
-- Name: pdf_pacientes pdf_pacientes_uid_paciente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_pacientes
    ADD CONSTRAINT pdf_pacientes_uid_paciente_fkey FOREIGN KEY (uid_paciente) REFERENCES public.pacientes(uid) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict QJPVnlddLJ6tI7RVhYXjQaMJ7kFY2IlcqTFbgnoN5DWzfxMAwlJOWmugu3uRLrT

