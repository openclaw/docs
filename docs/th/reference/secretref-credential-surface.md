---
read_when:
    - การตรวจสอบความครอบคลุมของข้อมูลประจำตัว SecretRef
    - ตรวจสอบว่าข้อมูลรับรองมีสิทธิ์สำหรับ `secrets configure` หรือ `secrets apply` หรือไม่
    - การตรวจสอบว่าเหตุใดข้อมูลประจำตัวจึงอยู่นอกพื้นผิวที่รองรับ
summary: พื้นผิวข้อมูลประจำตัว SecretRef ที่รองรับและไม่รองรับตามแบบมาตรฐาน
title: อินเทอร์เฟซข้อมูลประจำตัว SecretRef
x-i18n:
    generated_at: "2026-06-27T18:21:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 668ee7e72565194bfe53a397767d060e5fe7743c9bf8bde2597ec3dad2a32431
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

หน้านี้กำหนดพื้นผิวข้อมูลประจำตัว SecretRef แบบมาตรฐาน

เจตนาของขอบเขต:

- อยู่ในขอบเขต: ข้อมูลประจำตัวที่ผู้ใช้ระบุเองอย่างเคร่งครัด ซึ่ง OpenClaw ไม่ได้ออกหรือหมุนเวียนให้
- อยู่นอกขอบเขต: ข้อมูลประจำตัวที่รันไทม์ออกให้หรือมีการหมุนเวียน, วัสดุ OAuth refresh, และอาร์ติแฟกต์ลักษณะคล้ายเซสชัน

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
- `channels.googlechat.serviceAccount` ผ่าน `serviceAccountRef` ระดับพี่น้อง (ข้อยกเว้นด้านความเข้ากันได้)
- `channels.googlechat.accounts.*.serviceAccount` ผ่าน `serviceAccountRef` ระดับพี่น้อง (ข้อยกเว้นด้านความเข้ากันได้)

### เป้าหมาย `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; ไม่รองรับเมื่อ `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; ไม่รองรับเมื่อ `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

หมายเหตุ:

- เป้าหมายแผน Auth-profile ต้องมี `agentId`
- รายการแผนกำหนดเป้าหมายไปที่ `profiles.*.key` / `profiles.*.token` และเขียน refs ระดับพี่น้อง (`keyRef` / `tokenRef`)
- refs ของ Auth-profile รวมอยู่ในการแก้ค่าในรันไทม์และขอบเขตการ audit
- ใน `openclaw.json`, SecretRefs ต้องใช้ออบเจ็กต์แบบมีโครงสร้าง เช่น `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` สตริงมาร์กเกอร์แบบเดิม `secretref-env:<ENV_VAR>` จะถูกปฏิเสธบนเส้นทางข้อมูลประจำตัว SecretRef; เรียกใช้ `openclaw doctor --fix` เพื่อย้ายมาร์กเกอร์ที่ถูกต้อง
- ตัวคุ้มกันนโยบาย OAuth: `auth.profiles.<id>.mode = "oauth"` ไม่สามารถใช้ร่วมกับอินพุต SecretRef สำหรับโปรไฟล์นั้นได้ การเริ่มต้น/โหลดซ้ำและการแก้ค่า auth-profile จะล้มเหลวอย่างรวดเร็วเมื่อมีการละเมิดนโยบายนี้
- สำหรับผู้ให้บริการโมเดลที่จัดการด้วย SecretRef รายการ `agents/*/agent/models.json` ที่สร้างขึ้นจะคงมาร์กเกอร์ที่ไม่ใช่ความลับ (ไม่ใช่ค่าความลับที่แก้แล้ว) สำหรับพื้นผิว `apiKey`/header
- การคงอยู่ของมาร์กเกอร์ยึดแหล่งที่มาเป็นอำนาจ: OpenClaw เขียนมาร์กเกอร์จากสแนปช็อตคอนฟิกแหล่งที่มาที่ใช้งานอยู่ (ก่อนการแก้ค่า) ไม่ใช่จากค่าความลับรันไทม์ที่แก้แล้ว
- สำหรับการค้นหาเว็บ:
  - ในโหมดผู้ให้บริการแบบชัดเจน (ตั้งค่า `tools.web.search.provider`) เฉพาะคีย์ของผู้ให้บริการที่เลือกเท่านั้นที่ใช้งานอยู่
  - ในโหมดอัตโนมัติ (ไม่ได้ตั้งค่า `tools.web.search.provider`) เฉพาะคีย์ผู้ให้บริการตัวแรกที่แก้ค่าได้ตามลำดับความสำคัญเท่านั้นที่ใช้งานอยู่
  - ในโหมดอัตโนมัติ refs ของผู้ให้บริการที่ไม่ได้เลือกจะถือว่าไม่ใช้งานจนกว่าจะถูกเลือก
  - เส้นทางผู้ให้บริการแบบเดิม `tools.web.search.*` ยังแก้ค่าได้ระหว่างช่วงความเข้ากันได้ แต่พื้นผิว SecretRef แบบมาตรฐานคือ `plugins.entries.<plugin>.config.webSearch.*`

## ข้อมูลประจำตัวที่ไม่รองรับ

ข้อมูลประจำตัวนอกขอบเขตรวมถึง:

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

- ข้อมูลประจำตัวเหล่านี้เป็นคลาสที่ถูกออกให้ มีการหมุนเวียน มีเซสชัน หรือคงทนด้วย OAuth ซึ่งไม่เหมาะกับการแก้ค่า SecretRef ภายนอกแบบอ่านอย่างเดียว

## ที่เกี่ยวข้อง

- [การจัดการความลับ](/th/gateway/secrets)
- [ความหมายของข้อมูลประจำตัวสำหรับ auth](/th/auth-credential-semantics)
