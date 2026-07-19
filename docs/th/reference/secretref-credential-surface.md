---
read_when:
    - การตรวจสอบความครอบคลุมของข้อมูลรับรอง SecretRef
    - การตรวจสอบว่าข้อมูลประจำตัวมีสิทธิ์สำหรับ `secrets configure` หรือ `secrets apply` หรือไม่
    - การตรวจสอบสาเหตุที่ข้อมูลประจำตัวอยู่นอกขอบเขตที่รองรับ
summary: ขอบเขตข้อมูลรับรอง SecretRef มาตรฐานที่รองรับและไม่รองรับ
title: พื้นผิวข้อมูลรับรอง SecretRef
x-i18n:
    generated_at: "2026-07-19T07:35:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 396336826e6ac16440a26630a34030b70f3c4e2d75c699c743f07821c035ad72
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

หน้านี้กำหนดพื้นผิวข้อมูลประจำตัว SecretRef มาตรฐาน: ฟิลด์ข้อมูลประจำตัวใดบ้างที่ยอมรับ `SecretRef` (การอ้างอิงที่มี env/file/exec เป็นแหล่งข้อมูล) แทนค่าความลับดิบ

ขอบเขต:

- อยู่ในขอบเขต: เฉพาะข้อมูลประจำตัวที่ผู้ใช้ระบุ ซึ่ง OpenClaw ไม่ได้ออกหรือหมุนเวียนให้
- อยู่นอกขอบเขต: ข้อมูลประจำตัวที่ออกหรือหมุนเวียนขณะรัน ข้อมูลการรีเฟรช OAuth และอาร์ติแฟกต์ที่มีลักษณะคล้ายเซสชัน

รายการด้านล่างสร้างขึ้นจากรีจิสทรีเป้าหมายในซอร์สและตรวจสอบกับ `docs/reference/secretref-user-supplied-credentials-matrix.json` ใน CI โปรดอย่าแก้ไขรายการด้วยตนเอง

## ข้อมูลประจำตัวที่รองรับ

### เป้าหมาย `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

[//]: # "secretref-supported-list-start"

- `models.providers.*.apiKey`
- `models.providers.*.headers.*`
- `models.providers.*.request.auth.token`
- `models.providers.*.request.auth.value`
- `models.providers.*.request.headers.*`
- `models.providers.*.request.proxy.tls.ca`
- `models.providers.*.request.proxy.tls.cert`
- `models.providers.*.request.proxy.tls.key`
- `models.providers.*.request.proxy.tls.passphrase`
- `models.providers.*.request.tls.ca`
- `models.providers.*.request.tls.cert`
- `models.providers.*.request.tls.key`
- `models.providers.*.request.tls.passphrase`
- `skills.entries.*.apiKey`
- `agents.defaults.memorySearch.remote.apiKey`
- `agents.list[].tts.providers.*.apiKey`
- `agents.list[].memorySearch.remote.apiKey`
- `talk.providers.*.apiKey`
- `talk.realtime.providers.*.apiKey`
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.acpx.config.mcpServers.*.env.*`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.codex.config.appServer.authToken`
- `plugins.entries.codex.config.appServer.headers.*`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.google-meet.config.realtime.providers.*.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `plugins.entries.parallel.config.webSearch.apiKey`
- `plugins.entries.voice-call.config.realtime.providers.*.apiKey`
- `plugins.entries.voice-call.config.streaming.providers.*.apiKey`
- `plugins.entries.voice-call.config.tts.providers.*.apiKey`
- `plugins.entries.voice-call.config.twilio.authToken`
- `plugins.entries.webhooks.config.routes.*.secret`
- `tools.web.search.*.apiKey`
- `tools.web.search.apiKey`
- `gateway.auth.password`
- `gateway.auth.token`
- `gateway.remote.token`
- `gateway.remote.password`
- `cron.webhookToken`
- `channels.telegram.botToken`
- `channels.telegram.webhookSecret`
- `channels.telegram.accounts.*.botToken`
- `channels.telegram.accounts.*.webhookSecret`
- `channels.slack.botToken`
- `channels.slack.appToken`
- `channels.slack.relay.authToken`
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.relay.authToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
- `channels.sms.authToken`
- `channels.sms.accounts.*.authToken`
- `channels.clickclack.token`
- `channels.clickclack.accounts.*.token`
- `channels.discord.token`
- `channels.discord.pluralkit.token`
- `channels.discord.voice.tts.providers.*.apiKey`
- `channels.discord.accounts.*.token`
- `channels.discord.accounts.*.pluralkit.token`
- `channels.discord.accounts.*.voice.tts.providers.*.apiKey`
- `channels.irc.password`
- `channels.irc.nickserv.password`
- `channels.irc.accounts.*.password`
- `channels.irc.accounts.*.nickserv.password`
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
- `channels.qqbot.clientSecret`
- `channels.qqbot.accounts.*.clientSecret`
- `channels.msteams.appPassword`
- `channels.mattermost.botToken`
- `channels.mattermost.accounts.*.botToken`
- `channels.matrix.accessToken`
- `channels.matrix.password`
- `channels.matrix.accounts.*.accessToken`
- `channels.matrix.accounts.*.password`
- `channels.nextcloud-talk.botSecret`
- `channels.nextcloud-talk.apiPassword`
- `channels.nextcloud-talk.accounts.*.botSecret`
- `channels.nextcloud-talk.accounts.*.apiPassword`
- `channels.zalo.botToken`
- `channels.zalo.webhookSecret`
- `channels.zalo.accounts.*.botToken`
- `channels.zalo.accounts.*.webhookSecret`
- `channels.googlechat.serviceAccount` ผ่าน `serviceAccountRef` ที่อยู่ระดับเดียวกัน (ข้อยกเว้นด้านความเข้ากันได้)
- `channels.googlechat.accounts.*.serviceAccount` ผ่าน `serviceAccountRef` ที่อยู่ระดับเดียวกัน (ข้อยกเว้นด้านความเข้ากันได้)

### เป้าหมาย `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; ไม่รองรับเมื่อ `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; ไม่รองรับเมื่อ `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

หมายเหตุ:

- เป้าหมายแผนโปรไฟล์การตรวจสอบสิทธิ์ต้องใช้ `agentId`; รายการแผนกำหนดเป้าหมายไปยัง `profiles.*.key` / `profiles.*.token` และเขียนการอ้างอิงระดับเดียวกัน (`keyRef` / `tokenRef`) การอ้างอิงโปรไฟล์การตรวจสอบสิทธิ์รวมอยู่ในการแก้ไขค่าขณะรันและขอบเขตการตรวจสอบ
- ใน `openclaw.json` SecretRef ต้องใช้ออบเจ็กต์แบบมีโครงสร้าง เช่น `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` ระบบจะปฏิเสธสตริงตัวทำเครื่องหมาย `secretref-env:<ENV_VAR>` แบบเดิมในพาธข้อมูลประจำตัว SecretRef; เรียกใช้ `openclaw doctor --fix` เพื่อย้ายตัวทำเครื่องหมายที่ถูกต้อง
- ตัวป้องกันนโยบาย OAuth: ไม่สามารถใช้ `auth.profiles.<id>.mode = "oauth"` ร่วมกับอินพุต SecretRef สำหรับโปรไฟล์นั้นได้ การเริ่มต้น/โหลดใหม่และการแก้ไขค่าโปรไฟล์การตรวจสอบสิทธิ์จะล้มเหลวทันทีเมื่อละเมิดนโยบายนี้
- สำหรับผู้ให้บริการโมเดลที่จัดการด้วย SecretRef รายการ `agents/*/agent/models.json` ที่สร้างขึ้นจะเก็บตัวทำเครื่องหมายที่ไม่ใช่ความลับ (ไม่ใช่ค่าความลับที่แก้ไขแล้ว) ไว้สำหรับพื้นผิว `apiKey`/ส่วนหัว การเก็บตัวทำเครื่องหมายยึดแหล่งข้อมูลเป็นหลัก: OpenClaw เขียนตัวทำเครื่องหมายจากสแนปช็อตการกำหนดค่าแหล่งข้อมูลที่ใช้งานอยู่ (ก่อนแก้ไขค่า) ไม่ใช่จากค่าความลับขณะรันที่แก้ไขแล้ว
- การเริ่มต้น Gateway แบบ cold สามารถแยกความล้มเหลวในการแก้ไขค่าที่ลองใหม่ได้สำหรับเจ้าของที่แมปไว้และไม่ใช่ Gateway คลาสที่แมปในปัจจุบันประกอบด้วยผู้ให้บริการโมเดลและ Skills, ผู้ให้บริการสื่อ/TTS/cron, โปรไฟล์การตรวจสอบสิทธิ์ที่เข้าเกณฑ์, หน่วยความจำรายเอเจนต์, sandbox SSH, บัญชีช่องทาง และเส้นทาง Plugin ที่ประกาศใน manifest การเริ่มต้นจะเก็บการอ้างอิงที่ระบุอย่างชัดเจนของเจ้าของแต่ละรายที่ล้มเหลวไว้ในสแนปช็อตขณะรัน รายงานเจ้าของผ่านสถานะและ doctor และปฏิเสธคำขอสำหรับเจ้าของรายนั้นโดยไม่ลองใช้ข้อมูลประจำตัวที่มีลำดับความสำคัญต่ำกว่า การโหลดใหม่และการตรวจสอบก่อนเขียนการกำหนดค่าใช้นโยบายที่ตระหนักถึงเจ้าของแบบเดียวกัน: เจ้าของที่ปกติจะรีเฟรช; เจ้าของที่เข้าเกณฑ์และล้มเหลวจะคงสถานะเก่าไว้เฉพาะเมื่ออัตลักษณ์การอ้างอิง คำนิยามผู้ให้บริการ และสัญญาเจ้าของที่ไม่ใช่ความลับทั้งหมดไม่มีการเปลี่ยนแปลง; ความล้มเหลวใหม่หรือที่เปลี่ยนแปลงจะกลายเป็น cold การตรวจสอบสิทธิ์ขาเข้าของ Gateway, การอ้างอิงหรือค่าที่มีโครงสร้างไม่ถูกต้อง, เจ้าของที่ปิดกั้นเมื่อเกิดความล้มเหลว และเจ้าของที่ยังไม่ได้แมปยังคงใช้ข้อกำหนดแบบเคร่งครัด
- สำหรับการค้นหาเว็บ: ในโหมดระบุผู้ให้บริการอย่างชัดเจน (ตั้งค่า `tools.web.search.provider`) เฉพาะคีย์ของผู้ให้บริการที่เลือกเท่านั้นที่ทำงาน ในโหมดอัตโนมัติ (ไม่ได้ตั้งค่า `tools.web.search.provider`) เฉพาะคีย์ของผู้ให้บริการรายแรกที่แก้ไขค่าได้ตามลำดับความสำคัญเท่านั้นที่ทำงาน และการอ้างอิงผู้ให้บริการที่ไม่ได้เลือกจะถือว่าไม่ทำงานจนกว่าจะถูกเลือก พาธผู้ให้บริการ `tools.web.search.*` แบบเดิมยังคงแก้ไขค่าได้ในช่วงเวลาความเข้ากันได้ แต่พื้นผิว SecretRef มาตรฐานคือ `plugins.entries.<plugin>.config.webSearch.*`
- Slack `identity: "user"` ใช้ `channels.slack.userToken` ร่วมกับ `channels.slack.appToken` สำหรับ Socket Mode หรือ `channels.slack.signingSecret` สำหรับโหมด HTTP การจับคู่เดียวกันนี้ใช้ภายใต้ `channels.slack.accounts.*`; อัตลักษณ์นี้ไม่ต้องใช้โทเค็นบอต

## ข้อมูลประจำตัวที่ไม่รองรับ

ข้อมูลประจำตัวเหล่านี้เป็นคลาสที่ระบบออกให้ หมุนเวียน มีเซสชัน หรือคงทนสำหรับ OAuth ซึ่งไม่เหมาะกับการแก้ไข SecretRef ภายนอกแบบอ่านอย่างเดียว:

[//]: # "secretref-unsupported-list-start"

- `commands.ownerDisplaySecret`
- `hooks.token`
- `hooks.gmail.pushToken`
- `hooks.mappings[].sessionKey`
- `auth-profiles.oauth.*`
- `channels.discord.threadBindings.webhookToken`
- `channels.discord.accounts.*.threadBindings.webhookToken`
- `channels.whatsapp.creds.json`
- `channels.whatsapp.accounts.*.creds.json`

[//]: # "secretref-unsupported-list-end"

## เนื้อหาที่เกี่ยวข้อง

- [การจัดการความลับ](/th/gateway/secrets)
- [ความหมายของข้อมูลประจำตัวการตรวจสอบสิทธิ์](/th/auth-credential-semantics)
