---
read_when:
    - การตรวจสอบความครอบคลุมของข้อมูลประจำตัว SecretRef
    - การตรวจสอบว่าข้อมูลประจำตัวเข้าเกณฑ์สำหรับ `secrets configure` หรือ `secrets apply`
    - การตรวจสอบว่าเหตุใดข้อมูลประจำตัวจึงอยู่นอกขอบเขตที่รองรับ
summary: ขอบเขตข้อมูลประจำตัว SecretRef ที่รองรับเทียบกับที่ไม่รองรับตามมาตรฐาน
title: พื้นผิวข้อมูลรับรองของ SecretRef
x-i18n:
    generated_at: "2026-05-01T10:20:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41111ac82142c906005e0f585c86f2ff0b454afdaec07343c295e6b83571718e
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

หน้านี้กำหนดพื้นผิวข้อมูลประจำตัว SecretRef มาตรฐาน

เจตนาของขอบเขต:

- อยู่ในขอบเขต: ข้อมูลประจำตัวที่ผู้ใช้ระบุเองเท่านั้น ซึ่ง OpenClaw ไม่ได้สร้างหรือหมุนเวียน
- อยู่นอกขอบเขต: ข้อมูลประจำตัวที่สร้างขณะรันไทม์หรือมีการหมุนเวียน วัสดุรีเฟรช OAuth และอาร์ติแฟกต์ลักษณะคล้ายเซสชัน

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

- เป้าหมายแผนของโปรไฟล์การยืนยันตัวตนต้องมี `agentId`
- รายการแผนกำหนดเป้าหมาย `profiles.*.key` / `profiles.*.token` และเขียน ref ที่อยู่ระดับเดียวกัน (`keyRef` / `tokenRef`)
- ref ของโปรไฟล์การยืนยันตัวตนถูกรวมไว้ในการแก้ค่าเมื่อรันไทม์และความครอบคลุมของการตรวจสอบ
- ใน `openclaw.json` SecretRefs ต้องใช้ออบเจ็กต์แบบมีโครงสร้าง เช่น `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` สตริงมาร์กเกอร์เดิม `secretref-env:<ENV_VAR>` จะถูกปฏิเสธบนพาธข้อมูลประจำตัว SecretRef; เรียกใช้ `openclaw doctor --fix` เพื่อย้ายมาร์กเกอร์ที่ถูกต้อง
- ตัวป้องกันนโยบาย OAuth: `auth.profiles.<id>.mode = "oauth"` ไม่สามารถใช้ร่วมกับอินพุต SecretRef สำหรับโปรไฟล์นั้นได้ การเริ่มต้น/โหลดซ้ำ และการแก้ค่าโปรไฟล์การยืนยันตัวตนจะล้มเหลวอย่างรวดเร็วเมื่อมีการละเมิดนโยบายนี้
- สำหรับผู้ให้บริการโมเดลที่จัดการด้วย SecretRef รายการ `agents/*/agent/models.json` ที่สร้างขึ้นจะคงมาร์กเกอร์ที่ไม่ใช่ความลับ (ไม่ใช่ค่าความลับที่แก้แล้ว) สำหรับพื้นผิว `apiKey`/header
- การคงอยู่ของมาร์กเกอร์ยึดแหล่งที่มาเป็นหลัก: OpenClaw เขียนมาร์กเกอร์จากสแนปช็อตการกำหนดค่าแหล่งที่มาที่ใช้งานอยู่ (ก่อนการแก้ค่า) ไม่ใช่จากค่าความลับรันไทม์ที่แก้แล้ว
- สำหรับการค้นหาเว็บ:
  - ในโหมดผู้ให้บริการแบบชัดเจน (ตั้งค่า `tools.web.search.provider`) เฉพาะคีย์ผู้ให้บริการที่เลือกเท่านั้นที่ทำงาน
  - ในโหมดอัตโนมัติ (ไม่ได้ตั้งค่า `tools.web.search.provider`) เฉพาะคีย์ผู้ให้บริการตัวแรกที่แก้ค่าได้ตามลำดับความสำคัญเท่านั้นที่ทำงาน
  - ในโหมดอัตโนมัติ ref ของผู้ให้บริการที่ไม่ได้เลือกจะถือว่าไม่ทำงานจนกว่าจะถูกเลือก
  - พาธผู้ให้บริการเดิม `tools.web.search.*` ยังคงแก้ค่าได้ในช่วงเวลาความเข้ากันได้ แต่พื้นผิว SecretRef มาตรฐานคือ `plugins.entries.<plugin>.config.webSearch.*`

## ข้อมูลประจำตัวที่ไม่รองรับ

ข้อมูลประจำตัวที่อยู่นอกขอบเขตรวมถึง:

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

- ข้อมูลประจำตัวเหล่านี้เป็นคลาสที่ถูกสร้าง หมุนเวียน มีเซสชัน หรือคงทนสำหรับ OAuth ซึ่งไม่เหมาะกับการแก้ค่า SecretRef ภายนอกแบบอ่านอย่างเดียว

## ที่เกี่ยวข้อง

- [การจัดการความลับ](/th/gateway/secrets)
- [ความหมายของข้อมูลประจำตัวสำหรับการยืนยันตัวตน](/th/auth-credential-semantics)
