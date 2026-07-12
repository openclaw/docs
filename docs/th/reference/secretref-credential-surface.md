---
read_when:
    - การตรวจสอบความครอบคลุมของข้อมูลประจำตัว SecretRef
    - การตรวจสอบว่าข้อมูลประจำตัวมีสิทธิ์ใช้ `secrets configure` หรือ `secrets apply` หรือไม่
    - การตรวจสอบว่าเหตุใดข้อมูลประจำตัวจึงอยู่นอกขอบเขตที่รองรับ
summary: ขอบเขตข้อมูลประจำตัว SecretRef มาตรฐานที่รองรับและไม่รองรับ
title: พื้นผิวข้อมูลประจำตัว SecretRef
x-i18n:
    generated_at: "2026-07-12T16:41:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 435fc25ea9268be40abc367d96def70e8d367cb0ab640a4f2d271a0e9db19147
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

หน้านี้กำหนดพื้นผิวข้อมูลประจำตัว SecretRef มาตรฐาน: ฟิลด์ข้อมูลประจำตัวใดบ้างที่ยอมรับ `SecretRef` (การอ้างอิงที่อิงกับ env/file/exec) แทนค่าความลับแบบดิบ

ขอบเขต:

- อยู่ในขอบเขต: เฉพาะข้อมูลประจำตัวที่ผู้ใช้ระบุเองอย่างเคร่งครัด ซึ่ง OpenClaw ไม่ได้สร้างหรือหมุนเวียนให้
- อยู่นอกขอบเขต: ข้อมูลประจำตัวที่สร้างหรือหมุนเวียนระหว่างรันไทม์ ข้อมูลรีเฟรช OAuth และอาร์ติแฟกต์ที่มีลักษณะคล้ายเซสชัน

รายการด้านล่างสร้างจากรีจิสทรีเป้าหมายในซอร์สและตรวจสอบเทียบกับ `docs/reference/secretref-user-supplied-credentials-matrix.json` ใน CI อย่าแก้ไขรายการด้วยตนเอง

## ข้อมูลประจำตัวที่รองรับ

### เป้าหมายใน `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

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

### เป้าหมายใน `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; ไม่รองรับเมื่อ `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; ไม่รองรับเมื่อ `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

หมายเหตุ:

- เป้าหมายของแผนโปรไฟล์การยืนยันตัวตนต้องมี `agentId` รายการแผนกำหนดเป้าหมายไปยัง `profiles.*.key` / `profiles.*.token` และเขียนการอ้างอิงที่อยู่ระดับเดียวกัน (`keyRef` / `tokenRef`) การอ้างอิงโปรไฟล์การยืนยันตัวตนรวมอยู่ในการแก้ค่าระหว่างรันไทม์และขอบเขตการตรวจสอบ
- ใน `openclaw.json` SecretRef ต้องใช้ออบเจ็กต์แบบมีโครงสร้าง เช่น `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` สตริงตัวทำเครื่องหมายแบบเดิม `secretref-env:<ENV_VAR>` จะถูกปฏิเสธบนพาธข้อมูลประจำตัว SecretRef ให้เรียกใช้ `openclaw doctor --fix` เพื่อย้ายตัวทำเครื่องหมายที่ถูกต้อง
- ตัวควบคุมนโยบาย OAuth: ไม่สามารถใช้ `auth.profiles.<id>.mode = "oauth"` ร่วมกับอินพุต SecretRef สำหรับโปรไฟล์นั้นได้ การเริ่มต้น/โหลดซ้ำและการแก้ค่าโปรไฟล์การยืนยันตัวตนจะล้มเหลวทันทีเมื่อละเมิดนโยบายนี้
- สำหรับผู้ให้บริการโมเดลที่จัดการด้วย SecretRef รายการ `agents/*/agent/models.json` ที่สร้างขึ้นจะเก็บตัวทำเครื่องหมายที่ไม่เป็นความลับ (ไม่ใช่ค่าความลับที่แก้ค่าแล้ว) สำหรับพื้นผิว `apiKey`/ส่วนหัว การเก็บตัวทำเครื่องหมายยึดซอร์สเป็นแหล่งข้อมูลหลัก: OpenClaw เขียนตัวทำเครื่องหมายจากสแนปช็อตการกำหนดค่าซอร์สที่ใช้งานอยู่ (ก่อนการแก้ค่า) ไม่ใช่จากค่าความลับที่แก้ค่าแล้วในรันไทม์
- สำหรับการค้นหาเว็บ: ในโหมดระบุผู้ให้บริการอย่างชัดเจน (ตั้งค่า `tools.web.search.provider`) จะใช้งานเฉพาะคีย์ของผู้ให้บริการที่เลือก ในโหมดอัตโนมัติ (ไม่ได้ตั้งค่า `tools.web.search.provider`) จะใช้งานเฉพาะคีย์ของผู้ให้บริการรายแรกที่แก้ค่าได้ตามลำดับความสำคัญ และการอ้างอิงของผู้ให้บริการที่ไม่ได้เลือกจะถือว่าไม่ได้ใช้งานจนกว่าจะถูกเลือก พาธผู้ให้บริการแบบเดิม `tools.web.search.*` ยังคงแก้ค่าได้ในช่วงความเข้ากันได้ แต่พื้นผิว SecretRef มาตรฐานคือ `plugins.entries.<plugin>.config.webSearch.*`

## ข้อมูลประจำตัวที่ไม่รองรับ

ข้อมูลประจำตัวเหล่านี้อยู่ในประเภทที่สร้างขึ้น หมุนเวียน มีเซสชัน หรือคงอยู่สำหรับ OAuth ซึ่งไม่เหมาะกับการแก้ค่า SecretRef ภายนอกแบบอ่านอย่างเดียว:

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
- [ความหมายของข้อมูลประจำตัวสำหรับการยืนยันตัวตน](/th/auth-credential-semantics)
