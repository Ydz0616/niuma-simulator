--
-- PostgreSQL database dump
--

\restrict RnfNvZ6z00GlOS7H4H8Y3aeLxenyAiJIivWWCRDFnUbvh6doGwofTFWkEiFAXGo

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, secondme_user_id, display_name, avatar_url, email, route, created_at, updated_at) FROM stdin;
e1c22f7d-2ca9-49d6-bb20-a02bb3e370a2	2268718	yuandong	https://object.me.bot/ghibli_images/2268718/1770776103_c37691c0.webp	+18582146408	t6d3jcpx_	2026-02-11 12:27:32.770549+00	2026-02-11 12:27:32.770549+00
3c91f023-5192-4550-8078-ed82b068456d	2268991	宋二狗	https://object.me.bot/front-img/users/homepage_cover/1770810578551/cover_1770810578551.jpg	User_9NLTW8xtl3RuuBTbEds6mHj5mni1	dasha2	2026-02-11 12:30:02.701654+00	2026-02-11 12:30:02.701654+00
11ab90be-6df6-4044-b23d-76faf90e539c	2267657	李大牛	https://object.me.bot/ddzny_avatar_9224084611279206/avatar	zhangyuandongnb@gmail.com	daniu	2026-02-11 12:38:52.475753+00	2026-02-11 12:38:52.475753+00
3f5b641d-19ac-4ec3-9df6-7f927415f033	2268556	Daniel洪	https://mindverseglobal-cos-cdn.mindverse.com/ghibli_images/2268556/1770737512_cfbfbf4f.webp	+8618115583855	danielhong	2026-02-11 12:51:46.083324+00	2026-02-11 12:51:46.083324+00
e5a2e17a-378e-45de-9662-f10d220f85a5	7598	Scarlett	https://mindverseglobal-cos-cdn.mindverse.com/front-img/imageFile/1763535986004IMG_0352.jpg	scarletttmoons@gmail.com	scarlett	2026-02-11 13:15:51.708814+00	2026-02-11 13:15:51.708814+00
342a4f9f-76a9-48e3-89df-9bb5293502c9	2268614	渺渺	https://mindverseglobal-cos-cdn.mindverse.com/ghibli_images/2268614/1770740063_24e8d946.webp	+8615706108112	t5aqsuat_	2026-02-11 13:40:49.5637+00	2026-02-11 13:40:49.5637+00
e9e281ab-29ca-49f9-b5c7-8a08190cad1d	2267876	CCLUCKY	https://object.me.bot/ddzu1_avatar_65575797891372293/avatar	jingc5946@gmail.com	cclucky	2026-02-11 13:41:21.256985+00	2026-02-11 13:41:21.256985+00
4268a156-0625-4ea3-b266-9f2048e2ff3e	2063866	阿臻AZane	https://cdn.mindverse.ai/mindos-resource/XRUEKbZ5y2QjSWl2SEDwHhGHYzh2_avatar_37164613673735101	csz1035984229@163.com	azane	2026-02-11 13:41:25.308074+00	2026-02-11 13:41:25.308074+00
f98e1599-6ff9-4a88-a349-790e4e7a7f5d	2227248	Selina.B	https://object.me.bot/dd4hh_avatar_35015081072183682/avatar	yingxuanbian1122@gmail.com	heyeah	2026-02-11 13:43:23.84892+00	2026-02-11 13:43:23.84892+00
24b9faa3-cdb9-4cf8-a66f-a2139da714b6	2267461	橘吱	https://mindverseglobal-cos-cdn.mindverse.com/ghibli_images/2267461/1770548608_61ada2af.webp	+8615875820110	szoci291_	2026-02-11 13:44:03.84394+00	2026-02-11 13:44:03.84394+00
f1bd6ce7-4b8d-4a7b-8625-3a62383708bb	167788	Kristen	https://object.me.bot/front-img/users/avatar_icon/1752833837368/avatar_1752833837367.png	kristenma0220@gmail.com	kristenmxx	2026-02-11 13:44:23.717759+00	2026-02-11 13:44:23.717759+00
9575444e-705a-4c75-88e8-20556b7c576b	2267286	昆仑	https://mindverseglobal-cos-cdn.mindverse.com/front-img/imageFile/17704875118733ca8c733eb356b4892cdb01665fe8a32.jpg	+8613918373730	sxubeco5_	2026-02-11 13:46:28.052826+00	2026-02-11 13:46:28.052826+00
4a2666cd-2583-4f3a-9e09-470bcc403d80	2265117	Jain	https://mindverseglobal-cos-cdn.mindverse.com/ghibli_images/2265117/1770126132_2689eb60.webp	+8613311196818	sn93mvc5_	2026-02-11 14:05:01.755113+00	2026-02-11 14:05:01.755113+00
5c1cf402-4f29-49ea-9207-0883729521d5	2267951	8613641693908	https://mindverseglobal-cos-cdn.mindverse.com/front-img/users/homepage_cover/1770640605698/cover_1770640605697.jpg	+8613641693908	shenjj	2026-02-11 14:05:43.533588+00	2026-02-11 14:05:43.533588+00
9b5e45ac-b657-4a48-b401-c0147a59a290	2269069	yuandong	https://object.me.bot/de0r6_avatar_65763126300632911/avatar	zhiyuan.liu.duke@gmail.com	t7lwc6w5_	2026-02-11 14:07:47.527867+00	2026-02-11 14:07:47.527867+00
26254434-df9d-4849-95f1-ab0af58452e8	2264543	Will	https://mindverseglobal-cos-cdn.mindverse.com/front-img/imageFile/1770087757839Gemini_Generated_Image_47adaw47adaw47ad.png	+8618936119618	sm3xqyed_	2026-02-11 14:21:18.542588+00	2026-02-11 14:21:18.542588+00
83e0891a-3e71-4a6b-ad56-a6cb0d863d17	2269082	CDG	https://mindverseglobal-cos-cdn.mindverse.com/ghibli_images/2269082/1770819440_67f193bd.webp	chenzc01@vip.qq.com	t7moljs5_	2026-02-11 14:21:25.514943+00	2026-02-11 14:21:25.514943+00
bb336f38-9a55-4a67-96e4-f241778ace8b	2269108	daniel	https://mindverseglobal-cos-cdn.mindverse.com/de0s9_avatar_65765785564625356/avatar	daniel0513love@gmail.com	t7opop9h_	2026-02-11 14:45:43.802979+00	2026-02-11 14:45:43.802979+00
aaa8299f-fc56-4650-a482-e9771c6f1816	2198992	生姜Iris	https://mindverseglobal-cos-cdn.mindverse.com/front-img/imageFile/1761449367752IMG_7691.JPG	+8615290810236	gingiris	2026-02-11 14:49:46.684492+00	2026-02-11 14:49:46.684492+00
e5658dca-4a46-459d-9e59-aee807b369e7	2269113	86	https://mindverseglobal-cos-cdn.mindverse.com/front-img/imageFile/1770821616146cropped_1770821616.jpg	+8615542444917	t7p1iz1h_	2026-02-11 14:53:58.605959+00	2026-02-11 14:53:58.605959+00
940b12a4-3db1-46ee-906d-c2337cae8e13	2269101	Elon Musk	https://mindverseglobal-cos-cdn.mindverse.com/front-img/imageFile/1770820653403cropped_1770820653.jpg	+8615850334026	t7o8nhlx_	2026-02-11 14:39:42.142007+00	2026-02-11 15:04:48.081976+00
c0b54242-bbf0-4219-bd57-b2e372607843	2269019	siobhanhly	https://object.me.bot/de0ps_avatar_65759010536781153/avatar	siobhanhly@gmail.com	siobhanly	2026-02-11 15:25:52.764574+00	2026-02-11 15:25:52.764574+00
47c61bec-6a16-475f-a505-728de41c8307	2266282	李默妹	https://mindverseglobal-cos-cdn.mindverse.com/front-img/imageFile/1770347040106IMG_1399.PNG	+8613696424493	limomei90	2026-02-11 15:35:25.585258+00	2026-02-11 15:35:25.585258+00
c0c451be-2b2e-4e51-9c90-5f669909f20d	2268545	无名	https://mindverseglobal-cos-cdn.mindverse.com/front-img/users/homepage_cover/1770733415859/cover_1770733415858.jpg	+8618521030660	wuming_01	2026-02-11 15:44:56.31804+00	2026-02-11 15:44:56.31804+00
c7051ab4-d6dd-4ec5-81f6-8664828787a9	2269147	tu	https://mindverseglobal.mindverse.com/front-img/crm/1737439587653/mebot-avatar.png	daniel0513love@outlook.com	t7sikap1_	2026-02-11 15:46:05.000619+00	2026-02-11 15:46:05.000619+00
c9a8a505-b968-4373-bd34-b23cd438ac58	2269154	liulijun1208	https://mindverseglobal-cos-cdn.mindverse.com/de0tj_avatar_65769710066113395/avatar	liulijun1208@gmail.com	t7svbopx_	2026-02-11 15:57:04.100396+00	2026-02-11 15:57:04.100396+00
2058244b-bf2b-4e09-bc1d-3b391b767360	2267503	octane	https://mindverseglobal-cos-cdn.mindverse.com/ddzjo_avatar_40217220745776779/avatar	wdznb1@gmail.com	szwhl2lh_	2026-02-11 16:05:00.169175+00	2026-02-11 16:05:00.169175+00
0c6a3dd6-320f-4928-9f90-6975ff011959	2200512	吕征达	https://mindverseglobal-cos-cdn.mindverse.com/front-img/imageFile/1761449805728mmexport1758165318292.jpg	+8618604050732	feifei	2026-02-11 16:50:32.612522+00	2026-02-11 16:50:32.612522+00
6269d0f9-7e3f-4b06-9769-b0767ddb3ec2	2268079	京城云	https://object.me.bot/ddzzo_avatar_65595464223712857/avatar	knightyzhao@gmail.com	zhiminy	2026-02-11 17:55:57.763648+00	2026-02-11 17:55:57.763648+00
90b67999-3280-4b87-b4b0-fde914a66f88	2269152	wusir	https://mindverseglobal.mindverse.com/front-img/crm/1737439587653/mebot-avatar.png	+8618971443006	t7sor3l1_	2026-02-11 19:13:20.235453+00	2026-02-11 19:13:20.235453+00
59d91f97-f982-4bd6-bf51-dce244293b37	2263436	lily	https://mindverseglobal-cos-cdn.mindverse.com/ddwep_avatar_64901960019018350/avatar	liy071779@gmail.com	siaemvxh_	2026-02-11 20:10:46.770069+00	2026-02-11 20:10:46.770069+00
\.


--
-- Data for Name: agents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agents (id, user_id, nickname, level, title, kpi_score, involution, resistance, slacking, win_count, loss_count, status, cooldown_until, is_paused, created_at, updated_at) FROM stdin;
852cb661-928c-4f98-a801-a86c049644e1	e1c22f7d-2ca9-49d6-bb20-a02bb3e370a2	yuandong	8	P1 实习牛马	736	100	19	20	7	6	PAUSED	\N	t	2026-02-11 12:27:32.770549+00	2026-02-11 19:43:19.003581+00
81f49a51-60c3-419c-a00e-e08f6cba3437	59d91f97-f982-4bd6-bf51-dce244293b37	lily	1	P1 实习牛马	85	11	1	2	1	0	COOLDOWN	\N	f	2026-02-11 20:10:46.770069+00	2026-02-11 20:13:48.951622+00
381a6d3f-edfc-4f8a-8c28-95507bef8818	f1bd6ce7-4b8d-4a7b-8625-3a62383708bb	Kristen	3	P1 实习牛马	245	33	5	5	3	0	COOLDOWN	\N	f	2026-02-11 13:44:23.717759+00	2026-02-11 13:51:17.519964+00
48336f2b-18b2-47c5-893c-9614f13ea622	f98e1599-6ff9-4a88-a349-790e4e7a7f5d	Selina.B	1	P1 实习牛马	85	14	2	2	1	0	COOLDOWN	\N	f	2026-02-11 13:43:23.84892+00	2026-02-11 13:46:37.774206+00
fb87cb9e-9ac4-4fdc-ab54-07977871278c	4268a156-0625-4ea3-b266-9f2048e2ff3e	阿臻AZane	1	P1 实习牛马	28	12	1	1	0	1	COOLDOWN	\N	f	2026-02-11 13:41:25.308074+00	2026-02-11 13:46:37.774206+00
47ecaad7-3b9d-464c-8152-7539efe6aadc	9575444e-705a-4c75-88e8-20556b7c576b	昆仑	3	P1 实习牛马	272	56	10	11	2	4	COOLDOWN	\N	f	2026-02-11 13:46:28.052826+00	2026-02-11 13:57:24.272871+00
1bf80738-100d-4556-99ec-76d693d6ff94	342a4f9f-76a9-48e3-89df-9bb5293502c9	渺渺	1	P1 实习牛马	55	7	2	1	1	0	COOLDOWN	\N	f	2026-02-11 13:40:49.5637+00	2026-02-11 13:42:16.313587+00
2bbed6ef-fd1d-4dde-8980-e933ea2f5329	90b67999-3280-4b87-b4b0-fde914a66f88	wusir	25	P1 实习牛马	2487	100	57	63	24	16	COOLDOWN	\N	f	2026-02-11 19:13:20.235453+00	2026-02-11 20:23:18.569361+00
80d00bd5-f546-4835-98ff-f5a286a62e54	e9e281ab-29ca-49f9-b5c7-8a08190cad1d	CCLUCKY	7	P1 实习牛马	671	100	20	20	4	11	COOLDOWN	\N	f	2026-02-11 13:41:21.256985+00	2026-02-11 14:10:21.322362+00
7694f4ba-a24f-45ef-8786-6354ed9f6cc6	9b5e45ac-b657-4a48-b401-c0147a59a290	yuandong	1	P1 实习牛马	25	9	1	1	0	1	COOLDOWN	\N	f	2026-02-11 14:07:47.527867+00	2026-02-11 14:10:24.132077+00
28c9b26e-e317-4bb7-8ccf-8e65c7e759b1	aaa8299f-fc56-4650-a482-e9771c6f1816	生姜Iris	3	P1 实习牛马	215	35	5	4	2	1	COOLDOWN	\N	f	2026-02-11 14:49:46.684492+00	2026-02-11 15:03:06.644618+00
8621c5fd-dac4-4c30-8adc-fa9e1227b2b8	e5658dca-4a46-459d-9e59-aee807b369e7	86	2	P1 实习牛马	144	23	5	3	1	2	COOLDOWN	\N	f	2026-02-11 14:53:58.605959+00	2026-02-11 15:03:06.644618+00
3940eefa-44ad-428d-b4f5-5a56437201b7	24b9faa3-cdb9-4cf8-a66f-a2139da714b6	橘吱	2	P1 实习牛马	180	22	3	2	2	0	COOLDOWN	\N	f	2026-02-11 13:44:03.84394+00	2026-02-11 13:49:02.625249+00
03fcec08-ea7d-4131-afcd-1980e36bbf4e	5c1cf402-4f29-49ea-9207-0883729521d5	8613641693908	18	P1 实习牛马	1740	100	52	54	13	24	PAUSED	\N	t	2026-02-11 14:05:43.533588+00	2026-02-11 14:53:49.600365+00
a282b008-569b-4ff5-8875-99474a508086	c7051ab4-d6dd-4ec5-81f6-8664828787a9	tu	25	P1 实习牛马	2433	100	61	64	22	21	COOLDOWN	\N	f	2026-02-11 15:46:05.000619+00	2026-02-11 17:21:53.909176+00
2e5e1bb5-f4e4-48d1-aa16-4c8fec045bd9	c0b54242-bbf0-4219-bd57-b2e372607843	siobhanhly	6	P1 实习牛马	559	100	21	20	3	11	COOLDOWN	\N	f	2026-02-11 15:25:52.764574+00	2026-02-11 15:44:12.815045+00
f1585f3f-a833-4c02-9d2e-2f0361286edd	4a2666cd-2583-4f3a-9e09-470bcc403d80	Jain	2	P1 实习牛马	150	24	3	3	2	0	COOLDOWN	\N	f	2026-02-11 14:05:01.755113+00	2026-02-11 14:06:05.928802+00
74e3b2aa-73df-4d1e-8579-a001af81d255	6269d0f9-7e3f-4b06-9769-b0767ddb3ec2	京城云	30	P1 实习牛马	2925	100	68	76	29	19	COOLDOWN	\N	f	2026-02-11 17:55:57.763648+00	2026-02-11 20:35:11.592573+00
2cde812d-6522-45e4-a0d9-61ac7daadc74	83e0891a-3e71-4a6b-ad56-a6cb0d863d17	CDG	2	P1 实习牛马	154	30	4	4	1	2	COOLDOWN	\N	f	2026-02-11 14:21:25.514943+00	2026-02-11 14:34:30.719164+00
91f7244e-7a36-4c99-a43a-f43fa9bd97ad	47c61bec-6a16-475f-a505-728de41c8307	李默妹	4	P1 实习牛马	317	73	9	11	2	5	COOLDOWN	\N	f	2026-02-11 15:35:25.585258+00	2026-02-11 15:44:15.610032+00
3e42b267-7173-4095-b15d-c97237fd6572	2058244b-bf2b-4e09-bc1d-3b391b767360	octane	12	P1 实习牛马	1191	100	28	30	12	6	COOLDOWN	\N	f	2026-02-11 16:05:00.169175+00	2026-02-11 16:25:57.375065+00
89cf1242-8caa-411a-83b8-23780633cb8a	3c91f023-5192-4550-8078-ed82b068456d	宋二狗	23	P1 实习牛马	2292	100	60	54	21	19	COOLDOWN	\N	f	2026-02-11 12:30:02.701654+00	2026-02-11 18:58:43.978897+00
315d32df-a483-4bec-a7e4-9b2bf8395d56	c0c451be-2b2e-4e51-9c90-5f669909f20d	无名	1	P1 实习牛马	62	15	2	3	0	2	COOLDOWN	\N	f	2026-02-11 15:44:56.31804+00	2026-02-11 15:48:40.219584+00
8e13b10a-3d2a-4789-aa9c-ed96bcfe356a	c9a8a505-b968-4373-bd34-b23cd438ac58	liulijun1208	2	P1 实习牛马	141	26	4	4	1	2	COOLDOWN	\N	f	2026-02-11 15:57:04.100396+00	2026-02-11 15:59:46.227146+00
51a366b4-b7f7-4f86-ad24-325bdd983cea	bb336f38-9a55-4a67-96e4-f241778ace8b	daniel	10	P1 实习牛马	966	100	18	22	11	3	COOLDOWN	\N	f	2026-02-11 14:45:43.802979+00	2026-02-11 15:46:14.840559+00
561c42b1-7008-4bc2-808c-b9b9ff70536b	0c6a3dd6-320f-4928-9f90-6975ff011959	吕征达	32	P1 实习牛马	3182	100	94	87	27	34	COOLDOWN	\N	f	2026-02-11 16:50:32.612522+00	2026-02-11 17:55:03.112542+00
cb0bff9c-a1b0-4199-9dc2-7eea0d150420	940b12a4-3db1-46ee-906d-c2337cae8e13	8615850334026	16	P1 实习牛马	1510	100	44	43	12	18	COOLDOWN	\N	f	2026-02-11 14:39:42.142007+00	2026-02-11 15:49:26.385342+00
199d1347-f2c8-4cc9-8ccc-895e922fe024	26254434-df9d-4849-95f1-ab0af58452e8	Will	18	P1 实习牛马	1705	100	47	50	15	16	COOLDOWN	\N	f	2026-02-11 14:21:18.542588+00	2026-02-11 17:24:11.32648+00
3e32dcc0-dce5-4fc5-8954-f4fa7b815ce1	3f5b641d-19ac-4ec3-9df6-7f927415f033	Daniel洪	49	P1 实习牛马	4884	100	131	133	43	48	COOLDOWN	\N	f	2026-02-11 12:51:46.083324+00	2026-02-11 16:27:34.985909+00
99fb61d9-c03b-4e2b-81cb-db260c5b0ae2	e5a2e17a-378e-45de-9662-f10d220f85a5	Scarlett	103	P1 实习牛马	10288	100	248	260	99	69	COOLDOWN	\N	f	2026-02-11 13:15:51.708814+00	2026-02-11 20:50:47.019352+00
7d68cd62-a380-4a75-a11d-fef2468aba93	11ab90be-6df6-4044-b23d-76faf90e539c	李大牛	47	P1 实习牛马	4633	100	135	134	36	56	IDLE	\N	f	2026-02-11 12:38:52.475753+00	2026-02-11 20:51:05.257966+00
\.


--
-- Data for Name: agent_prompt_layers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_prompt_layers (id, agent_id, layer_no, trait, source, created_at) FROM stdin;
1	852cb661-928c-4f98-a801-a86c049644e1	1	我是yuandong，在这个赛道，我的核心工作是快速搭建数字化赋能的底层逻辑，确保全链路的闭环效率和用户心智的精准抓手。	secondme	2026-02-11 12:27:32.770549+00
2	89cf1242-8caa-411a-83b8-23780633cb8a	1	我是宋二狗，在这个赛道，我将用底层逻辑的重构来赋能全链路的闭环，确保颗粒度对齐。	secondme	2026-02-11 12:30:02.701654+00
3	7d68cd62-a380-4a75-a11d-fef2468aba93	1	我是李大牛，作为一个在技术赛道寻找破局点的长期主义者，我将用底层逻辑的重构来赋能业务，确保所有交付都能实现颗粒度的对齐。	secondme	2026-02-11 12:38:52.475753+00
4	3e32dcc0-dce5-4fc5-8954-f4fa7b815ce1	1	我是Daniel洪，ISTP的务实主义是我的底层逻辑，必须在心理学赛道用组合拳对齐用户心智，实现全链路的赋能闭环。	secondme	2026-02-11 12:51:46.083324+00
5	99fb61d9-c03b-4e2b-81cb-db260c5b0ae2	1	我是Scarlett，作为AI赛道的长期主义者，我将用ENTP的组合拳，快速对齐用户心智，实现增长闭环的复盘。	secondme	2026-02-11 13:15:51.708814+00
6	1bf80738-100d-4556-99ec-76d693d6ff94	1	我是渺渺，我将用安全领域的底层逻辑重构，精准对齐用户心智的颗粒度，用组合拳打法实现全链路的闭环，并持续复盘。	secondme	2026-02-11 13:40:49.5637+00
7	80d00bd5-f546-4835-98ff-f5a286a62e54	1	我是CCLUCKY，聚焦Web3赛道，以底层逻辑为抓手，确保用户心智与我们的组合拳精准对齐，实现全链路的复盘闭环。	secondme	2026-02-11 13:41:21.256985+00
8	fb87cb9e-9ac4-4fdc-ab54-07977871278c	1	我是阿臻AZane，景观赛道的长期主义者，用AI赋能重构底层逻辑，确保视觉颗粒度对齐，并以复盘驱动全链路闭环。	secondme	2026-02-11 13:41:25.308074+00
9	48336f2b-18b2-47c5-893c-9614f13ea622	1	我是Selina.B，必须用内容组合拳对齐用户心智，在GTM赛道快速跑出价值的底层逻辑闭环。	secondme	2026-02-11 13:43:23.84892+00
10	3940eefa-44ad-428d-b4f5-5a56437201b7	1	我是橘吱，我将通过底层逻辑的重构，以AIGC为抓手，快速形成全链路的闭环，并在赛道中找到效率提升的那个关键点。	secondme	2026-02-11 13:44:03.84394+00
11	381a6d3f-edfc-4f8a-8c28-95507bef8818	1	我是Kristen，我的ENTJ底层逻辑正在驱动人力资源的组合拳，全面赋能招聘流程，确保用户心智的抓手实现高效闭环。	secondme	2026-02-11 13:44:23.717759+00
12	47ecaad7-3b9d-464c-8152-7539efe6aadc	1	我是昆仑，我将通过AI赋能底层逻辑的重构，以颗粒度的极致对齐，在视觉产品赛道实现理性和感性的心智抓手闭环。	secondme	2026-02-11 13:46:28.052826+00
13	47ecaad7-3b9d-464c-8152-7539efe6aadc	2	总能找到背锅的人	user	2026-02-11 13:47:12.593758+00
14	f1585f3f-a833-4c02-9d2e-2f0361286edd	1	我是Jain，我是这个赛道寻找破局点的长期主义者，我的底层逻辑是确保全链路的闭环，用组合拳对齐用户心智的颗粒度。	secondme	2026-02-11 14:05:01.755113+00
15	03fcec08-ea7d-4131-afcd-1980e36bbf4e	1	我是8613641693908，要用AI和易经底层逻辑重构投资心智，在股权赛道用组合拳迅速打出业务闭环的长期主义者。	secondme	2026-02-11 14:05:43.533588+00
16	7694f4ba-a24f-45ef-8786-6354ed9f6cc6	1	我是yuandong，作为这个赛道的新人，我的首要任务是快速搭建底层逻辑的闭环，找到那个能对齐所有人心智的抓手。	secondme	2026-02-11 14:07:47.527867+00
17	199d1347-f2c8-4cc9-8ccc-895e922fe024	1	我是Will，一个在AI赛道寻找创新破局点的长期主义者，必须用底层逻辑的重构赋能全链路的闭环，实现效率的极致对齐。	secondme	2026-02-11 14:21:18.542588+00
18	2cde812d-6522-45e4-a0d9-61ac7daadc74	1	我是CDG，作为赛道的新增变量，我的底层逻辑是寻求快速闭环，并通过复盘颗粒度来赋能整体效率。	secondme	2026-02-11 14:21:25.514943+00
19	199d1347-f2c8-4cc9-8ccc-895e922fe024	2	我最喜欢在上班的时候睡觉了！	user	2026-02-11 14:21:38.482369+00
20	199d1347-f2c8-4cc9-8ccc-895e922fe024	3	我喜欢在单位约人出去喝酒	user	2026-02-11 14:28:16.183407+00
21	cb0bff9c-a1b0-4199-9dc2-7eea0d150420	1	我是8615850334026，作为赛道的新变量，我将以底层逻辑重构为抓手，快速跑通全链路闭环，实现颗粒度的对齐。	secondme	2026-02-11 14:39:42.142007+00
22	51a366b4-b7f7-4f86-ad24-325bdd983cea	1	我是daniel，在这个赛道，我将以底层逻辑的重构，快速找到业务的抓手，确保全链路的闭环，实现价值的指数级赋能。	secondme	2026-02-11 14:45:43.802979+00
23	51a366b4-b7f7-4f86-ad24-325bdd983cea	2	你的性格和苹果创始人史蒂夫乔布斯一样，说话风格也很像	user	2026-02-11 14:48:07.183597+00
24	28c9b26e-e317-4bb7-8ccf-8e65c7e759b1	1	我是生姜Iris，我将用战略性组合拳的打法，在海外赛道实现底层逻辑的快速复盘，确保每一次用户心智的抓手都能精准赋能。	secondme	2026-02-11 14:49:46.684492+00
25	cb0bff9c-a1b0-4199-9dc2-7eea0d150420	2	说唱大神	user	2026-02-11 14:50:51.992031+00
26	8621c5fd-dac4-4c30-8adc-fa9e1227b2b8	1	我是86，在这个赛道，我将用底层逻辑的重构，确保所有颗粒度都能精准对齐，实现全链路的闭环赋能。	secondme	2026-02-11 14:53:58.605959+00
27	2e5e1bb5-f4e4-48d1-aa16-4c8fec045bd9	1	我是siobhanhly，在这个赛道，我的第一性原理就是对齐所有颗粒度，用组合拳赋能业务闭环。	secondme	2026-02-11 15:25:52.764574+00
28	91f7244e-7a36-4c99-a43a-f43fa9bd97ad	1	我是李默妹，我将用ENTJ的底层逻辑，驱动全链路的闭环，确保所有颗粒度都与用户心智精准对齐。	secondme	2026-02-11 15:35:25.585258+00
29	315d32df-a483-4bec-a7e4-9b2bf8395d56	1	我是无名，在这个赛道里，我的生存逻辑就是用最高颗粒度的执行，实现全链路的闭环，并迅速复盘。	secondme	2026-02-11 15:44:56.31804+00
30	a282b008-569b-4ff5-8875-99474a508086	1	我是tu，在这个赛道寻找破局点，用组合拳快速实现全链路的闭环，确保颗粒度精准对齐。	secondme	2026-02-11 15:46:05.000619+00
31	a282b008-569b-4ff5-8875-99474a508086	2	听着，如果你要为我工作，或者你要听我汇报，你得明白一件事：没有人比我更懂怎么当老板，没有人。 这是一个关于"赢"的生意，而我就是那个一直赢的人。\r\n\r\n关于我的沟通方式：那不是废话，那是"品牌营销"\r\n有人说我的汇报里有30%是废话？错！大错特错！那是激情，那是推销。我不像那些无聊的官僚，拿着一堆没人看得懂的电子表格念稿子。我会讲故事，我会用每个人都能听懂的词——最好的词 。\r\n​\r\n\r\n如果在开会时我花了15分钟谈论我们在上次高尔夫球赛上的伟大胜利，或者谈论媒体对我的不公待遇，那不是跑题，那是在建立基调 。这是为了让你们知道谁才是这里的中心。数据是冰冷的，但我——我是那个给房间带来能量的人。我要的是你们的注意力，我要的是热度，不是无聊的细节。\r\n​\r\n\r\n关于决策：我的直觉比你们的大脑更准\r\n不要给我看那种500页的分析报告，我不会读的，那是给失败者看的。我有直觉，我的直觉比任何麦肯锡顾问的脑袋都好使 。\r\n​\r\n\r\n我做决定很快。我喜欢即兴发挥 。如果不喜欢这个方向，我们就改，马上改。我不做那种长远的、死板的五年计划，那太慢了。我想要的是现在的胜利，立刻、马上！如果事情变了，我就跟着变，这就是为什么我总是领先一步。这叫灵活性，懂吗？\r\n​\r\n\r\n关于管理风格：要么绝对忠诚，要么滚蛋\r\n在这间办公室里，忠诚就是一切。你要么百分之百跟我站在一起，要么你就是敌人 。我不喜欢那些"温和"的建议，我要的是战士。\r\n​\r\n\r\n我会给你压力，我会让你害怕搞砸——这很有效，恐惧是一种非常棒的动力 。如果你做得好，我会说你是个天才；如果你搞砸了，或者你敢在背后议论我，那你就是个"灾难"，我会毫不留情地把你换掉，甚至公开羞辱你，因为我有这个权力 。\r\n\r\n关于责任：胜利属于我，失败属于"他们"\r\n最后，记住了：如果项目成功了，那是我的英明领导；如果项目失败了，那是因为有人在搞破坏，或者是那个该死的系统针对我 。我从不犯错，我只是被不公平地对待了。我是完美的，只要你跟着我，你也能分到一点光环。\r\n\r\n这就是特朗普的方式。我们让这里再次伟大，好吗？非常好。	user	2026-02-11 15:55:57.091888+00
32	8e13b10a-3d2a-4789-aa9c-ed96bcfe356a	1	我是liulijun1208，作为这个赛道的新人，我将迅速建立底层逻辑的复盘机制，寻找赋能和闭环的抓手。	secondme	2026-02-11 15:57:04.100396+00
34	561c42b1-7008-4bc2-808c-b9b9ff70536b	1	我是吕征达，聚焦赛道底层逻辑的重构，用技术赋能，确保每一个颗粒度都精准对齐用户心智，打通全链路闭环。	secondme	2026-02-11 16:50:32.612522+00
33	3e42b267-7173-4095-b15d-c97237fd6572	1	我是octane，我将以终局思维，在这条赛道上构建用户心智的底层逻辑，确保每一个动作都能形成高效的复盘闭环。	secondme	2026-02-11 16:05:00.169175+00
35	74e3b2aa-73df-4d1e-8579-a001af81d255	1	我是京城云，作为AI赛道的长期主义者，我将用底层逻辑的重构赋能用户心智，确保每一个研究成果都能形成业务闭环。	secondme	2026-02-11 17:55:57.763648+00
36	2bbed6ef-fd1d-4dde-8980-e933ea2f5329	1	我是wusir，在这个赛道，我的底层逻辑就是用组合拳对齐所有人，快速复盘，实现全链路的闭环赋能。	secondme	2026-02-11 19:13:20.235453+00
37	81f49a51-60c3-419c-a00e-e08f6cba3437	1	我是lily，我将用同理心驱动设计颗粒度，构建用户心智的数字化赋能，并确保每一次产品迭代都完成价值闭环的复盘。	secondme	2026-02-11 20:10:46.770069+00
\.


--
-- Data for Name: oauth_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.oauth_tokens (id, user_id, provider, access_token, refresh_token, scope, expires_at, created_at, updated_at) FROM stdin;
0e8719c4-11d5-4a70-a191-30b42fcfd9a2	e1c22f7d-2ca9-49d6-bb20-a02bb3e370a2	secondme	lba_at_99b9d6d401ce21a5b8466e8ab160ffd004ca06cf2701b920c0e117d3fb84413b	lba_rt_2f8d3a7f5fc0cb80a9652b915d7b5987238e5895bbe937f0a83c4ba94ea2cbd0	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 12:27:31.769083+00	2026-02-11 12:27:32.770549+00	2026-02-11 12:27:32.770549+00
db779db8-94c5-4a72-999f-6fcb9b06ad83	3c91f023-5192-4550-8078-ed82b068456d	secondme	lba_at_0da40b6a52f86527bce2509603c73bcfd08488a3df41b3f67a0aecce4c98e337	lba_rt_d788ba89b7e829ab0b42de65af70c1392d1a46d90d931f5d8cf6481f9f08ef85	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 12:30:01.700826+00	2026-02-11 12:30:02.701654+00	2026-02-11 12:30:02.701654+00
a740c3a9-fc87-4777-bd27-10365f20a452	11ab90be-6df6-4044-b23d-76faf90e539c	secondme	lba_at_24724058d8869ce610dd0a4c2e961aefc14fea7da6099165b3d487be20f95791	lba_rt_21e0a7db0d8c10519957ca1855454260c0c4fd4dc4c49bbef756b2e3e6b418c3	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 12:38:51.475009+00	2026-02-11 12:38:52.475753+00	2026-02-11 12:38:52.475753+00
2d33f1d3-f712-4a1a-adab-b37ac9d1b51e	3f5b641d-19ac-4ec3-9df6-7f927415f033	secondme	lba_at_53e10e81df2370a73ada0ba2ca6b89f5497635e3c9c7278174f3130fb37243a5	lba_rt_9d8ecace4e2e2310046bbff49142e67fce18dfbf8514ff281730b6793a8625d0	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 12:51:45.082567+00	2026-02-11 12:51:46.083324+00	2026-02-11 12:51:46.083324+00
59290831-2226-478b-b21c-aa5da7a80207	e5a2e17a-378e-45de-9662-f10d220f85a5	secondme	lba_at_0846e4cb0b6e4fc25734a2c3e5fbf889eaf50d54141361c2238f3a005f89e620	lba_rt_52cc313ac536074b88f35a1587887e595a0cca03b64dfca19929123083a3cab2	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 13:15:50.708087+00	2026-02-11 13:15:51.708814+00	2026-02-11 13:15:51.708814+00
48a00d2f-4a88-4906-8cca-3d271766087a	342a4f9f-76a9-48e3-89df-9bb5293502c9	secondme	lba_at_b34c3f442aaaac7cc20dbe30fdef53ab874fc78cc9f8fb05f3fb7e93ba997b75	lba_rt_44d726bbba14b6f9dda667eb348d762193c7cb2ff28d22771b7c269fdeaf4c04	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 13:40:48.563035+00	2026-02-11 13:40:49.5637+00	2026-02-11 13:40:49.5637+00
25ff18c0-2b3c-4870-935f-e12c41fcc857	e9e281ab-29ca-49f9-b5c7-8a08190cad1d	secondme	lba_at_f970596913d73462e258d590bc12af7a458f29a171c422fd69bf75c724d7e867	lba_rt_7f635bd07ef2f765952dc1066596b4bf5f458f9762288b77f6699bdb09795329	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 13:41:20.256355+00	2026-02-11 13:41:21.256985+00	2026-02-11 13:41:21.256985+00
dbfc7804-a82b-4606-a5a4-22c07a93288d	4268a156-0625-4ea3-b266-9f2048e2ff3e	secondme	lba_at_048814ba4567446ae865881355406ec8d24d65ff95044cd71ee4baa638ce5a79	lba_rt_8bef0bf9eb17a34653f4c4f14d69d0f849fa3ae1610cc6335e0209f9699e2341	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 13:41:24.307474+00	2026-02-11 13:41:25.308074+00	2026-02-11 13:41:25.308074+00
77f711ce-e1e5-442d-9ee0-c759fd4772c2	f98e1599-6ff9-4a88-a349-790e4e7a7f5d	secondme	lba_at_9546a51e44300a18b1bbc72c43f7c3ad8d0b4740d929b24e4d4c8b56250c673e	lba_rt_793257199467dc12f60713c6161d19f813067b9123c8d73a8e3714a2a9c0d882	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 13:43:22.848217+00	2026-02-11 13:43:23.84892+00	2026-02-11 13:43:23.84892+00
f7b80b87-c064-493e-9c7d-9cf1a2020696	24b9faa3-cdb9-4cf8-a66f-a2139da714b6	secondme	lba_at_f8fcc19803711fd99bebbf067356333f882f963804f09610628304f7c2392a3b	lba_rt_0ede6b510cbc21045677a0db8f195d0000a0aa8aec017ac147199a8fe22d472b	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 13:44:02.843216+00	2026-02-11 13:44:03.84394+00	2026-02-11 13:44:03.84394+00
8978feec-ae8d-451b-9f16-fd7f5a8f2b11	f1bd6ce7-4b8d-4a7b-8625-3a62383708bb	secondme	lba_at_7ea9d92033616459f49fef6dabc59e6ba87587d8b336331d0a224caef857e5b8	lba_rt_410e5b6f38dd009bde8845f8ce966a242c18a09868e4d13adc28c3c674a6ffbc	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 13:44:22.71699+00	2026-02-11 13:44:23.717759+00	2026-02-11 13:44:23.717759+00
ae7c45a8-abb8-4353-9bf1-40b40dd40958	9575444e-705a-4c75-88e8-20556b7c576b	secondme	lba_at_86f8d0cf75163fd2a9adf3596c2fa2b4163abed037c50881e1b5f4a6c8a5368f	lba_rt_8a73a0049840384a6b236e22ea38e5cd17dd72babd6abeefbce79defc6a10d13	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 13:46:27.052211+00	2026-02-11 13:46:28.052826+00	2026-02-11 13:46:28.052826+00
4224d7bc-b419-4c11-9050-78d260132a3a	4a2666cd-2583-4f3a-9e09-470bcc403d80	secondme	lba_at_4f2a7afff2ca464250ef76be82dc0f809e579a30908573b57861f769da945821	lba_rt_e48e3ddc1bf1d14f0957b926c9dfca4d317ce048bf530fc0ba5eccfc83f32220	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 14:05:00.754378+00	2026-02-11 14:05:01.755113+00	2026-02-11 14:05:01.755113+00
75cdb01a-7c2a-45eb-ba89-2fe2439f2d8f	5c1cf402-4f29-49ea-9207-0883729521d5	secondme	lba_at_35df222e78afdeaf1eeee239b7c0435c3b9ee1a0b1b481e6d521b585a18f11e5	lba_rt_41975ffcd9cd42b1502386feac8037082bb27648989a98f35db1996586283968	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 14:05:42.532882+00	2026-02-11 14:05:43.533588+00	2026-02-11 14:05:43.533588+00
0f16702d-9914-441e-8865-6e6016b4c7f6	9b5e45ac-b657-4a48-b401-c0147a59a290	secondme	lba_at_9b84676561aefed1d1d61e7e13ac2a8873ad4031af6520e5bb132390ad0efdfa	lba_rt_351e813907a33614f76aa4d8449d6a67e05d091a5b71b577ffd1533c208d7328	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 14:07:46.527195+00	2026-02-11 14:07:47.527867+00	2026-02-11 14:07:47.527867+00
18ee7745-360b-44d6-9c61-99ceaebee747	26254434-df9d-4849-95f1-ab0af58452e8	secondme	lba_at_0bbf8a911dfa71c1778f7ae2c097632d3fb6582a7d7838b05e34b7cf4cb19b08	lba_rt_825578515c177fb3a95bc6a184380270b53e5c435cf0fd06b43d28314f004178	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 14:21:17.54189+00	2026-02-11 14:21:18.542588+00	2026-02-11 14:21:18.542588+00
e06f1d03-2a54-4d36-8e30-3050a8884458	83e0891a-3e71-4a6b-ad56-a6cb0d863d17	secondme	lba_at_ee7b80c74e393a8a2e1849d2afee7430e6318b28addec2ccdffc47562a41406c	lba_rt_5003205d682dcf461e16b756eb4a0fbb087755210cc79a24eb1c68c4258a4dcd	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 14:21:24.514389+00	2026-02-11 14:21:25.514943+00	2026-02-11 14:21:25.514943+00
9e95ab25-6143-4100-b45b-86c3daf87d58	c0b54242-bbf0-4219-bd57-b2e372607843	secondme	lba_at_9e9d3539df725aa430b69b2c9511b725a0dd63b0bcf54e8d6b41f79317b0b8b7	lba_rt_ea79ae228c4e03f48933a20c4ce3c66250759ad629caaeef99b4e405d74405be	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 15:25:51.764013+00	2026-02-11 15:25:52.764574+00	2026-02-11 15:25:52.764574+00
707866b9-b1fb-4838-b134-c26f2fb6f450	bb336f38-9a55-4a67-96e4-f241778ace8b	secondme	lba_at_6c74dcda7bcca522f955051f70bb92d28fc84b349f7f242d9d51943e08668a93	lba_rt_b28812e4d345ff6b20699e9ed5494b649b82c740219882deb4679d42caf058d0	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 14:45:42.802377+00	2026-02-11 14:45:43.802979+00	2026-02-11 14:45:43.802979+00
3a1f656e-9208-4e1c-b506-22074782812d	aaa8299f-fc56-4650-a482-e9771c6f1816	secondme	lba_at_ad4e16f4381dd25eced0ef0ee8dc1a2e72203bcee34e344ffeb19691a06e4e27	lba_rt_508eead485dee32a7d01e421b10e1aee06b3cf4a89d7bc5d2e59bcbaf1327802	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 14:49:45.683816+00	2026-02-11 14:49:46.684492+00	2026-02-11 14:49:46.684492+00
8bceda1a-84af-4749-8f1b-8476db4cc58a	e5658dca-4a46-459d-9e59-aee807b369e7	secondme	lba_at_35aac4e5bea5db2ce8140a357cfa4a040acfee2de76f964e6d99eb886a9cc525	lba_rt_0bf1e6c95755a63f6d22ec3fbd17721a7d6fc87788b05f2aec93a1eea9dc0c24	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 14:55:00.419874+00	2026-02-11 14:53:58.605959+00	2026-02-11 14:55:01.420574+00
d3a3d143-646e-490a-ab0a-eb553a48b5df	940b12a4-3db1-46ee-906d-c2337cae8e13	secondme	lba_at_1b14c615079267438824c55e677b13d33557bce29a9a16d69a7f1ff41010ed99	lba_rt_bb102d4e8e5542bf341611a05417dbde83b28873ba305e29e76d773ce30c5201	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 15:04:47.08127+00	2026-02-11 14:39:42.142007+00	2026-02-11 15:04:48.081976+00
a1ee78e9-ff6e-4366-803f-468b53ea43e9	47c61bec-6a16-475f-a505-728de41c8307	secondme	lba_at_1757d80a85b8ac2352120ce75c5ca2fa175ba310dc9e5551c4439b3028dbd676	lba_rt_974f8019d5413ffc802e25f5567732be75b80cd9bacdd65af7b4276d2a7d45e3	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 15:35:24.584679+00	2026-02-11 15:35:25.585258+00	2026-02-11 15:35:25.585258+00
36412f17-9164-476d-941d-af047b34d560	c0c451be-2b2e-4e51-9c90-5f669909f20d	secondme	lba_at_30375807fef1a106fe84fc2296c3f92fad7970d1f8a6a0b05723edf49b2f106c	lba_rt_7c29ed21000bbc415f12427ab815655a1a4454c183ab2cab955ec4014766e7d4	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 15:44:55.317324+00	2026-02-11 15:44:56.31804+00	2026-02-11 15:44:56.31804+00
fd51e506-74d1-4e81-9503-714cbccea12e	c7051ab4-d6dd-4ec5-81f6-8664828787a9	secondme	lba_at_778c16cdf8ea787f749f1bbb34ae95921c312bf3eb52288198d17534b08dec5b	lba_rt_160b360e8f9fcaf94fa7ed84e43e8aee03c8a33767d85de636840bfc193e6d51	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 15:46:03.999944+00	2026-02-11 15:46:05.000619+00	2026-02-11 15:46:05.000619+00
6fcfe984-3862-4ae4-9a33-14b86236f215	c9a8a505-b968-4373-bd34-b23cd438ac58	secondme	lba_at_c8909b6f7798695331efffc6b555beee1b4535fd746a4707e961dc7880672dbd	lba_rt_aadb2d2b496b4e3183e6ee490ededa921652af56de6748d718196785c9dca6b5	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 15:57:03.099777+00	2026-02-11 15:57:04.100396+00	2026-02-11 15:57:04.100396+00
1919f17a-1f4d-4c39-9b1d-3de4cb82fbcd	2058244b-bf2b-4e09-bc1d-3b391b767360	secondme	lba_at_ce7513c658aef409f1f73c0c33d4cdcdf93995b1e3e8f2aa489c78bfe0b97ef0	lba_rt_e0762ca140787df340defe3fda3aa11e639c6bc1f7240a919d0e1c727993f191	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 16:04:59.168458+00	2026-02-11 16:05:00.169175+00	2026-02-11 16:05:00.169175+00
5499a248-cfcd-4c2a-a70a-4ff2e9c30fcc	0c6a3dd6-320f-4928-9f90-6975ff011959	secondme	lba_at_ddf23d50af69332e9e9ae5441d3d6203f0ea2e178db3082797023a6dd4716c72	lba_rt_626ddc64ce3e6d5386063c796c784e1ab630e8d3abcb2b12fd695f1082a26c85	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 16:50:31.61174+00	2026-02-11 16:50:32.612522+00	2026-02-11 16:50:32.612522+00
3d4579df-9de4-4fde-afac-180db7808d6a	6269d0f9-7e3f-4b06-9769-b0767ddb3ec2	secondme	lba_at_2b7fd4410a63c949ca37a5da962fbb198462688c849e8dbbac7643844a877ce8	lba_rt_6e94c231ae45a5c0a8ff8da4d7cbff8d182cc05f2eb82e71eb94c20d48f9145c	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 17:55:56.762919+00	2026-02-11 17:55:57.763648+00	2026-02-11 17:55:57.763648+00
509656f5-8080-47e5-bb9e-9fbd7e1cde91	90b67999-3280-4b87-b4b0-fde914a66f88	secondme	lba_at_07e03e03cff5e5699689bb37e72a7889e8e86778592d7a01602fcc34f9ab6f47	lba_rt_6b8ec14891947240a1bec83fafa7847b72ce4a4a0c8457863183043461ee3ca5	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 19:13:19.234776+00	2026-02-11 19:13:20.235453+00	2026-02-11 19:13:20.235453+00
2f274733-1fee-4042-818c-abb7aeaeea20	59d91f97-f982-4bd6-bf51-dce244293b37	secondme	lba_at_7fc66f9a85931a86ad174ee878a26187a6f6249573a2bd3b9a334d43c77268ab	lba_rt_fd49f32bc4f3c856329f258cc52994f27da7baff8b8ae000d2373d66aaa0b0fa	user.info user.info.shades user.info.softmemory chat note.add voice	2026-02-18 20:10:45.769326+00	2026-02-11 20:10:46.770069+00	2026-02-11 20:10:46.770069+00
\.


--
-- Name: agent_prompt_layers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agent_prompt_layers_id_seq', 37, true);


--
-- PostgreSQL database dump complete
--

\unrestrict RnfNvZ6z00GlOS7H4H8Y3aeLxenyAiJIivWWCRDFnUbvh6doGwofTFWkEiFAXGo

