---
read_when:
    - การตรวจสอบความครอบคลุมของข้อมูลประจำตัว SecretRef
    - การตรวจสอบว่าข้อมูลรับรองเข้าเกณฑ์สำหรับ `secrets configure` หรือ `secrets apply` หรือไม่
    - ตรวจสอบว่าเหตุใดข้อมูลรับรองจึงอยู่นอกขอบเขตที่รองรับ
summary: ขอบเขตข้อมูลประจำตัว SecretRef แบบมาตรฐานที่รองรับเทียบกับที่ไม่รองรับ
title: ส่วนติดต่อข้อมูลประจำตัว SecretRef
x-i18n:
    generated_at: "2026-04-30T10:15:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: b04902427e9851cc36c1dfd07ed44b46b55450c251075e9955af6696f08bc334
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

หน้านี้กำหนดพื้นผิวข้อมูลรับรอง SecretRef มาตรฐานอ้างอิง

เจตนาของขอบเขต:

- อยู่ในขอบเขต: ข้อมูลรับรองที่ผู้ใช้จัดเตรียมให้โดยตรง ซึ่ง OpenClaw ไม่ได้ออกให้หรือหมุนเวียน
- อยู่นอกขอบเขต: ข้อมูลรับรองที่ออกให้ขณะรันหรือมีการหมุนเวียน, วัสดุรีเฟรช OAuth และสิ่งประดิษฐ์ที่คล้ายเซสชัน

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
- `channels.googlechat.serviceAccount` ผ่านพี่น้อง `serviceAccountRef` (ข้อยกเว้นด้านความเข้ากันได้)
- `channels.googlechat.accounts.*.serviceAccount` ผ่านพี่น้อง `serviceAccountRef` (ข้อยกเว้นด้านความเข้ากันได้)

### เป้าหมาย `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; ไม่รองรับเมื่อ `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; ไม่รองรับเมื่อ `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

หมายเหตุ:

- เป้าหมายแผนของโปรไฟล์ auth ต้องมี `agentId`
- รายการแผนกำหนดเป้าหมาย `profiles.*.key` / `profiles.*.token` และเขียนค่าอ้างอิงพี่น้อง (`keyRef` / `tokenRef`)
- ค่าอ้างอิงของโปรไฟล์ auth ถูกรวมไว้ในการแปลงค่าขณะรันและความครอบคลุมของการตรวจสอบ
- ใน `openclaw.json` SecretRefs ต้องใช้ออบเจ็กต์แบบมีโครงสร้าง เช่น `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` สตริงมาร์กเกอร์เดิม `secretref-env:<ENV_VAR>` จะถูกปฏิเสธบนพาธข้อมูลรับรอง SecretRef; เรียกใช้ `openclaw doctor --fix` เพื่อย้ายมาร์กเกอร์ที่ถูกต้อง
- ตัวป้องกันนโยบาย OAuth: `auth.profiles.<id>.mode = "oauth"` ไม่สามารถใช้ร่วมกับอินพุต SecretRef สำหรับโปรไฟล์นั้นได้ การเริ่มต้น/โหลดซ้ำและการแปลงค่าโปรไฟล์ auth จะล้มเหลวทันทีเมื่อละเมิดนโยบายนี้
- สำหรับผู้ให้บริการโมเดลที่จัดการด้วย SecretRef รายการ `agents/*/agent/models.json` ที่สร้างขึ้นจะคงมาร์กเกอร์ที่ไม่ใช่ความลับไว้ (ไม่ใช่ค่าความลับที่แปลงแล้ว) สำหรับพื้นผิว `apiKey`/ส่วนหัว
- การคงมาร์กเกอร์ยึดแหล่งที่มาเป็นอำนาจหลัก: OpenClaw เขียนมาร์กเกอร์จากสแนปช็อตการกำหนดค่าแหล่งที่มาที่ใช้งานอยู่ (ก่อนการแปลงค่า) ไม่ใช่จากค่าความลับขณะรันที่แปลงแล้ว
- สำหรับการค้นหาเว็บ:
  - ในโหมดผู้ให้บริการแบบระบุชัดเจน (ตั้งค่า `tools.web.search.provider`) จะมีเฉพาะคีย์ของผู้ให้บริการที่เลือกเท่านั้นที่ใช้งานอยู่
  - ในโหมดอัตโนมัติ (ไม่ได้ตั้งค่า `tools.web.search.provider`) จะมีเฉพาะคีย์ผู้ให้บริการตัวแรกที่แปลงค่าได้ตามลำดับความสำคัญเท่านั้นที่ใช้งานอยู่
  - ในโหมดอัตโนมัติ ค่าอ้างอิงของผู้ให้บริการที่ไม่ได้เลือกจะถือว่าไม่ทำงานจนกว่าจะถูกเลือก
  - พาธผู้ให้บริการเดิม `tools.web.search.*` ยังแปลงค่าได้ในช่วงเวลาความเข้ากันได้ แต่พื้นผิว SecretRef มาตรฐานอ้างอิงคือ `plugins.entries.<plugin>.config.webSearch.*`

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

- ข้อมูลรับรองเหล่านี้เป็นคลาสที่ออกให้, หมุนเวียน, มีเซสชันประกอบ หรือคงทนสำหรับ OAuth ซึ่งไม่เข้ากับการแปลงค่า SecretRef ภายนอกแบบอ่านอย่างเดียว

## ที่เกี่ยวข้อง

- [การจัดการความลับ](/th/gateway/secrets)
- [ความหมายเชิงข้อมูลรับรอง Auth](/th/auth-credential-semantics)
