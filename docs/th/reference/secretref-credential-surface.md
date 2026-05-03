---
read_when:
    - การตรวจสอบความครอบคลุมของข้อมูลประจำตัว SecretRef
    - การตรวจสอบว่าข้อมูลรับรองมีสิทธิ์สำหรับ `secrets configure` หรือ `secrets apply` หรือไม่
    - ตรวจสอบว่าเหตุใดข้อมูลรับรองจึงอยู่นอกขอบเขตที่รองรับ
summary: พื้นผิวข้อมูลรับรอง SecretRef แบบมาตรฐานที่รองรับเทียบกับที่ไม่รองรับ
title: พื้นผิวข้อมูลประจำตัว SecretRef
x-i18n:
    generated_at: "2026-05-03T21:37:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f95ca284f241e40f233fc9e388c26be094dd8bc878daf8a420453ef65b0ad6d
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

หน้านี้กำหนดพื้นผิวข้อมูลรับรอง SecretRef แบบมาตรฐาน

เจตนาของขอบเขต:

- อยู่ในขอบเขต: ข้อมูลรับรองที่ผู้ใช้ระบุเองอย่างเคร่งครัด ซึ่ง OpenClaw ไม่ได้ออกหรือหมุนเวียนให้
- อยู่นอกขอบเขต: ข้อมูลรับรองที่ออก ณ รันไทม์หรือมีการหมุนเวียน, วัสดุสำหรับรีเฟรช OAuth และอาร์ทิแฟกต์ที่มีลักษณะคล้ายเซสชัน

## ข้อมูลรับรองที่รองรับ

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
- `messages.tts.providers.*.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.acpx.config.mcpServers.*.env.*`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `plugins.entries.voice-call.config.realtime.providers.*.apiKey`
- `plugins.entries.voice-call.config.streaming.providers.*.apiKey`
- `plugins.entries.voice-call.config.tts.providers.*.apiKey`
- `plugins.entries.voice-call.config.twilio.authToken`
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
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
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
- `channels.bluebubbles.password`
- `channels.bluebubbles.accounts.*.password`
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
- `channels.googlechat.serviceAccount` ผ่าน `serviceAccountRef` ระดับพี่น้อง (ข้อยกเว้นเพื่อความเข้ากันได้)
- `channels.googlechat.accounts.*.serviceAccount` ผ่าน `serviceAccountRef` ระดับพี่น้อง (ข้อยกเว้นเพื่อความเข้ากันได้)

### เป้าหมาย `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; ไม่รองรับเมื่อ `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; ไม่รองรับเมื่อ `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

หมายเหตุ:

- เป้าหมายแผนของโปรไฟล์การยืนยันตัวตนต้องมี `agentId`
- รายการแผนกำหนดเป้าหมายที่ `profiles.*.key` / `profiles.*.token` และเขียน ref ระดับพี่น้อง (`keyRef` / `tokenRef`)
- ref ของโปรไฟล์การยืนยันตัวตนรวมอยู่ในการแก้ค่า ณ รันไทม์และขอบเขตการตรวจสอบ
- ใน `openclaw.json` SecretRef ต้องใช้ออบเจ็กต์แบบมีโครงสร้าง เช่น `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` สตริงมาร์กเกอร์เดิม `secretref-env:<ENV_VAR>` จะถูกปฏิเสธบนพาธข้อมูลรับรอง SecretRef; ให้รัน `openclaw doctor --fix` เพื่อย้ายมาร์กเกอร์ที่ถูกต้อง
- ตัวป้องกันนโยบาย OAuth: `auth.profiles.<id>.mode = "oauth"` ไม่สามารถใช้ร่วมกับอินพุต SecretRef สำหรับโปรไฟล์นั้นได้ การเริ่มต้น/โหลดใหม่และการแก้ค่าโปรไฟล์การยืนยันตัวตนจะล้มเหลวทันทีเมื่อนโยบายนี้ถูกละเมิด
- สำหรับผู้ให้บริการโมเดลที่จัดการด้วย SecretRef รายการ `agents/*/agent/models.json` ที่สร้างขึ้นจะคงมาร์กเกอร์ที่ไม่ใช่ความลับไว้ (ไม่ใช่ค่าความลับที่แก้แล้ว) สำหรับพื้นผิว `apiKey`/header
- การคงมาร์กเกอร์ยึดแหล่งที่มาเป็นหลัก: OpenClaw เขียนมาร์กเกอร์จากสแนปช็อตการกำหนดค่าแหล่งที่มาที่ใช้งานอยู่ (ก่อนการแก้ค่า) ไม่ใช่จากค่าความลับ ณ รันไทม์ที่แก้แล้ว
- สำหรับการค้นหาเว็บ:
  - ในโหมดผู้ให้บริการแบบระบุชัดเจน (ตั้งค่า `tools.web.search.provider`) เฉพาะคีย์ของผู้ให้บริการที่เลือกเท่านั้นที่ใช้งานอยู่
  - ในโหมดอัตโนมัติ (ไม่ได้ตั้งค่า `tools.web.search.provider`) เฉพาะคีย์ผู้ให้บริการตัวแรกที่แก้ค่าได้ตามลำดับความสำคัญเท่านั้นที่ใช้งานอยู่
  - ในโหมดอัตโนมัติ ref ของผู้ให้บริการที่ไม่ได้เลือกจะถือว่าไม่ใช้งานจนกว่าจะถูกเลือก
  - พาธผู้ให้บริการเดิม `tools.web.search.*` ยังแก้ค่าได้ในช่วงเวลาความเข้ากันได้ แต่พื้นผิว SecretRef มาตรฐานคือ `plugins.entries.<plugin>.config.webSearch.*`

## ข้อมูลรับรองที่ไม่รองรับ

ข้อมูลรับรองที่อยู่นอกขอบเขตรวมถึง:

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

เหตุผล:

- ข้อมูลรับรองเหล่านี้เป็นคลาสที่ถูกออก, ถูกหมุนเวียน, พกพาเซสชัน หรือคงทนแบบ OAuth ซึ่งไม่เข้ากับการแก้ค่า SecretRef ภายนอกแบบอ่านอย่างเดียว

## ที่เกี่ยวข้อง

- [การจัดการความลับ](/th/gateway/secrets)
- [ความหมายของข้อมูลรับรองการยืนยันตัวตน](/th/auth-credential-semantics)
