--
-- PostgreSQL database dump
--

\restrict DhjgELYsNbSIgSiTlxGU7W2OcZX55L0avTx5eZvXCNQEoiDw2bELbhEe0xwOmVy

-- Dumped from database version 18.6 (Debian 18.6-1.pgdg12+2)
-- Dumped by pg_dump version 18.3

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    room_id text NOT NULL,
    username text NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    room_id text,
    filename text NOT NULL,
    language text,
    content text,
    saved_by text,
    saved_at timestamp without time zone DEFAULT now()
);


--
-- Name: room_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    room_id text,
    user_id uuid,
    username text,
    joined_at timestamp without time zone DEFAULT now()
);


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rooms (
    id text NOT NULL,
    name text NOT NULL,
    target_output text,
    target_type text DEFAULT 'terminal'::text,
    language text DEFAULT 'python'::text,
    time_limit integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    room_id text,
    user_id text,
    username text,
    code text NOT NULL,
    output text,
    matched boolean DEFAULT false,
    submitted_at timestamp without time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password_hash text,
    avatar_color text DEFAULT '#58A6FF'::text,
    created_at timestamp without time zone DEFAULT now(),
    provider text,
    provider_id text
);


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_messages (id, room_id, username, message, created_at) FROM stdin;
56ed3661-d1d3-45f8-b61f-ef588aef11e0	RPLZRM	Abhishek Singh	2 baar kyu dikh rha h apna name	2026-10-11 06:17:44.071
72fbddf5-88fa-4430-932a-7ef2310d8e36	RPLZRM	Ayushman	admin ka rola hai	2026-10-11 06:17:54.105
3b0f5cc8-3a09-4d53-98a1-6e7dd4b4e45b	RPLZRM	Abhishek Singh	mere me mera dikh rha h	2026-10-11 06:18:02.063
5c41b04a-5d1a-4b54-93fe-6ef1d71cb175	RPLZRM	Ayushman	aj shi kr denge	2026-10-11 06:18:57.508
f94a8e4b-f3c3-4914-a89b-c4d0466cf96f	RPLZRM	Ayushman	isko tum dekho mujhe abhi db migrate krna hai	2026-10-11 06:19:16.759
020f45f0-1652-428f-b4e3-9bcf6411dd37	RPLZRM	Ayushman	btata hu kya kya krna hai	2026-10-11 06:19:21.274
bd973ba1-8fd0-4cfb-93c9-dac2686f6597	RPLZRM	Ayushman	ao khane pe	2026-10-11 06:19:23.266
65e28daa-4e2a-4115-804b-9bb10d67e4d4	RPLZRM	Abhishek Singh	ohky	2026-10-11 06:19:33.91
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.files (id, room_id, filename, language, content, saved_by, saved_at) FROM stdin;
e42ee4c2-c4cb-44f7-aadd-ba4c1fe7dd87	4B06MB	index.html	html		system	2026-10-10 11:40:34.143382
099a4cd5-cbd1-4321-a185-7efd63cb9174	4B06MB	style.css	css		system	2026-10-10 11:40:34.145944
a210e760-443c-47b7-b62a-d26d3cd0204e	4B06MB	script.js	javascript		system	2026-10-10 11:40:34.147504
bed1b8d7-395e-419c-81cd-a72f175ed7a8	4B06MB	demo	folder		Ayushman	2026-10-10 11:40:47.187842
2e2a36d3-cc83-4e12-9a82-152fc9a186f9	JWF84W	style.css	css		system	2026-10-10 12:33:59.771118
e06ac6d0-9321-4db2-be54-4131c5886530	JWF84W	index.html	html		AKsingh	2026-10-10 12:34:09.800536
29bf836f-a4bd-4b6c-b27f-b7957d0735c1	JWF84W	script.js	javascript	const a = 10;\r\nconsole.log(10);	AKsingh	2026-10-10 12:34:50.313086
c4044f61-d3aa-4e2d-a667-2d82c177a226	82TLUN	index.html	html		system	2026-10-10 12:35:16.118249
fefa7861-6f29-42e6-83b7-e4cf7ea5d5f0	82TLUN	style.css	css		system	2026-10-10 12:35:16.120111
155e72f4-6040-4e35-bbdf-18dcdfedfebb	82TLUN	script.js	javascript	console.log(10);	AKsingh	2026-10-10 12:35:46.005955
0d532168-7a86-4a2c-bb19-e909dd067f0c	RPLZRM	style.css	css		system	2026-10-11 06:16:27.190926
20a8d02c-c689-4543-8228-85733e2a4c6d	RPLZRM	script.js	javascript		system	2026-10-11 06:16:27.192885
48c4ea77-4281-45f2-a094-90ce5b753f12	RPLZRM	React	plaintext		Ayushman	2026-10-11 06:17:21.311626
152d6aea-a5c5-4135-8fbe-57db99061c84	RPLZRM	Node	plaintext		Ayushman	2026-10-11 06:17:25.893703
bf3ec301-df2c-4bf7-b226-2af94a6e40f0	RPLZRM	index.css	css		Abhishek Singh	2026-10-11 06:19:05.925096
5400ec7b-b841-4c41-95a9-ab0a85054ed9	RPLZRM	index.html	html		Ayushman	2026-10-11 09:33:37.404493
\.


--
-- Data for Name: room_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.room_members (id, room_id, user_id, username, joined_at) FROM stdin;
a7fba56e-dcde-4cc0-a649-8b682dad2ea7	4B06MB	e9cd133a-a710-495e-94cb-f71a49f74dd1	Ayushman	2026-10-10 11:40:33.818252
10aef6a8-98e0-4424-91d4-738f9c38efd2	JWF84W	e25f24bc-efc9-4240-8118-8f9b2f02a102	AKsingh	2026-10-10 12:33:59.403365
a30c0a46-79d7-4ca0-9021-d1299055571a	82TLUN	e25f24bc-efc9-4240-8118-8f9b2f02a102	AKsingh	2026-10-10 12:35:15.540775
e01c885a-8b87-4d10-b914-63ea54d1ef57	RPLZRM	e9cd133a-a710-495e-94cb-f71a49f74dd1	Ayushman	2026-10-11 06:16:26.884666
ff249d29-9459-4e8c-8728-b7a9bf17fb7e	RPLZRM	b21fee35-9593-4834-b869-6812e0a3725f	Abhishek Singh	2026-10-11 06:16:46.554027
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rooms (id, name, target_output, target_type, language, time_limit, is_active, created_at) FROM stdin;
4B06MB	demo		terminal	javascript	0	t	2026-10-10 11:40:29.700966
JWF84W	test		terminal	javascript	0	t	2026-10-10 12:33:52.134149
82TLUN	test1	10	terminal	javascript	300	t	2026-10-10 12:35:12.338925
Y7TG74	react		terminal	javascript	0	t	2026-10-11 06:15:48.674415
RPLZRM	aaa		terminal	javascript	0	t	2026-10-11 06:15:59.794627
\.


--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.submissions (id, room_id, user_id, username, code, output, matched, submitted_at) FROM stdin;
05480494-7351-4e6c-816d-d7efca3354c9	JWF84W	e25f24bc-efc9-4240-8118-8f9b2f02a102	AKsingh	const a = 10;\r\nconsole.log(10);	10\n	f	2026-10-10 12:34:35.21068
2e8f516c-be7d-4cd7-92c8-739c9a49ae23	JWF84W	e25f24bc-efc9-4240-8118-8f9b2f02a102	AKsingh	const a = 10;\r\nconsole.log(10);	10\n	f	2026-10-10 12:34:48.010727
1fc3dd1a-6f6f-44fd-8122-671a918ea31b	82TLUN	e25f24bc-efc9-4240-8118-8f9b2f02a102	AKsingh	console.log(10);	10\n	f	2026-10-10 12:35:31.708413
4af4ec9b-3466-45ae-b0e0-5ef1c677606a	82TLUN	e25f24bc-efc9-4240-8118-8f9b2f02a102	AKsingh	console.log(10);	10\n	f	2026-10-10 12:35:45.813342
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, email, password_hash, avatar_color, created_at, provider, provider_id) FROM stdin;
e9cd133a-a710-495e-94cb-f71a49f74dd1	Ayushman	ayushmansriv622@gmail.com	$2b$12$TMe2a7fyTkE8JQ2X4u79hu242FZlPwL5WrTm/b538OdKAlfCWneFi	#DDA0DD	2026-10-10 11:40:15.216807	\N	\N
e25f24bc-efc9-4240-8118-8f9b2f02a102	AKsingh	singhchandrama1971@gmail.com	$2b$12$gSKrsfGMhhmK68KaJdUDau7BuXTIxOcszYHg6jtUBo2StCYLgg.iu	#FF6B6B	2026-10-10 12:33:33.058633	\N	\N
b21fee35-9593-4834-b869-6812e0a3725f	Abhishek Singh	abhisingh987661@gmail.com	$2b$12$3IisCJXAYzpmeOnH3bMQyu3rBC5qj43ekcNDy7dn1Md1ziAvuaQ12	#F7DC6F	2026-10-11 06:15:32.732342	\N	\N
\.


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: files files_room_filename_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_room_filename_unique UNIQUE (room_id, filename);


--
-- Name: room_members room_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_members
    ADD CONSTRAINT room_members_pkey PRIMARY KEY (id);


--
-- Name: room_members room_members_room_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_members
    ADD CONSTRAINT room_members_room_id_user_id_key UNIQUE (room_id, user_id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: chat_messages_room_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_messages_room_idx ON public.chat_messages USING btree (room_id, created_at);


--
-- Name: users_provider_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_provider_unique ON public.users USING btree (provider, provider_id) WHERE (provider IS NOT NULL);


--
-- Name: files files_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id);


--
-- Name: room_members room_members_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_members
    ADD CONSTRAINT room_members_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id);


--
-- Name: room_members room_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_members
    ADD CONSTRAINT room_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: submissions submissions_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id);


--
-- PostgreSQL database dump complete
--

\unrestrict DhjgELYsNbSIgSiTlxGU7W2OcZX55L0avTx5eZvXCNQEoiDw2bELbhEe0xwOmVy

