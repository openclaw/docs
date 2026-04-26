---
read_when:
    - การตรวจสอบความครอบคลุมของข้อมูลรับรอง SecretRef
    - การตรวจสอบว่าข้อมูลรับรองมีสิทธิ์สำหรับ `secrets configure` หรือ `secrets apply` หรือไม่
    - การตรวจสอบว่าเหตุใดข้อมูลรับรองจึงอยู่นอกพื้นผิวที่รองรับ
summary: พื้นผิวข้อมูลรับรอง SecretRef แบบ canonical ที่รองรับและไม่รองรับ
title: พื้นผิวข้อมูลรับรอง SecretRef
x-i18n:
    generated_at: "2026-04-26T11:41:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ffdf545e954f8d73d18adfeb196d9092bf346bd86648f09314bad2a0f40bb6c
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

หน้านี้กำหนดพื้นผิวข้อมูลรับรอง SecretRef แบบ canonical

เจตนาของขอบเขต:

- อยู่ในขอบเขต: ข้อมูลรับรองที่ผู้ใช้จัดเตรียมเองอย่างเคร่งครัด ซึ่ง OpenClaw ไม่ได้สร้างหรือหมุนเวียนให้
- อยู่นอกขอบเขต: ข้อมูลรับรองที่ถูกสร้างระหว่างรันไทม์หรือมีการหมุนเวียน วัสดุ OAuth refresh และอาร์ติแฟกต์ลักษณะคล้ายเซสชัน

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
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.minimax.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
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
- `channels.googlechat.serviceAccount` ผ่าน `serviceAccountRef` ระดับเดียวกัน (ข้อยกเว้นเพื่อความเข้ากันได้)
- `channels.googlechat.accounts.*.serviceAccount` ผ่าน `serviceAccountRef` ระดับเดียวกัน (ข้อยกเว้นเพื่อความเข้ากันได้)

### เป้าหมาย `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; ไม่รองรับเมื่อ `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; ไม่รองรับเมื่อ `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

หมายเหตุ:

- เป้าหมายแผนของโปรไฟล์การยืนยันตัวตนต้องใช้ `agentId`
- รายการแผนจะกำหนดเป้าหมายไปที่ `profiles.*.key` / `profiles.*.token` และเขียน ref ระดับเดียวกัน (`keyRef` / `tokenRef`)
- ref ของโปรไฟล์การยืนยันตัวตนถูกรวมอยู่ในการ resolve ระหว่างรันไทม์และความครอบคลุมของการตรวจสอบ
- ใน `openclaw.json` SecretRef ต้องใช้ structured object เช่น `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` สตริง marker แบบเดิม `secretref-env:<ENV_VAR>` จะถูกปฏิเสธบน path ข้อมูลรับรอง SecretRef; ให้เรียก `openclaw doctor --fix` เพื่อย้าย marker ที่ถูกต้อง
- ตัวป้องกันนโยบาย OAuth: `auth.profiles.<id>.mode = "oauth"` ไม่สามารถใช้ร่วมกับอินพุต SecretRef สำหรับโปรไฟล์นั้นได้ การเริ่มต้น/รีโหลดและการ resolve โปรไฟล์การยืนยันตัวตนจะล้มเหลวทันทีเมื่อมีการละเมิดนโยบายนี้
- สำหรับผู้ให้บริการโมเดลที่จัดการด้วย SecretRef รายการ `agents/*/agent/models.json` ที่ถูกสร้างขึ้นจะคงค่า marker ที่ไม่เป็นความลับไว้ (ไม่ใช่ค่าความลับที่ถูก resolve แล้ว) สำหรับพื้นผิว `apiKey`/header
- การคงค่า marker ถือซอร์สเป็นหลัก: OpenClaw จะเขียน marker จาก snapshot config ของซอร์สที่ใช้งานอยู่ (ก่อน resolve) ไม่ใช่จากค่าความลับของรันไทม์ที่ถูก resolve แล้ว
- สำหรับการค้นหาเว็บ:
  - ในโหมดผู้ให้บริการแบบระบุชัดเจน (ตั้งค่า `tools.web.search.provider`) จะมีเพียงคีย์ของผู้ให้บริการที่เลือกเท่านั้นที่ทำงานอยู่
  - ในโหมดอัตโนมัติ (ไม่ได้ตั้งค่า `tools.web.search.provider`) จะมีเพียงคีย์ของผู้ให้บริการตัวแรกที่ resolve ได้ตามลำดับความสำคัญเท่านั้นที่ทำงานอยู่
  - ในโหมดอัตโนมัติ ref ของผู้ให้บริการที่ไม่ได้ถูกเลือกจะถือว่าไม่ทำงานจนกว่าจะถูกเลือก
  - path ผู้ให้บริการแบบเดิม `tools.web.search.*` ยังคง resolve ได้ในช่วงหน้าต่างความเข้ากันได้ แต่พื้นผิว SecretRef แบบ canonical คือ `plugins.entries.<plugin>.config.webSearch.*`

## ข้อมูลรับรองที่ไม่รองรับ

ข้อมูลรับรองที่อยู่นอกขอบเขตประกอบด้วย:

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

- ข้อมูลรับรองเหล่านี้เป็นประเภทที่ถูกสร้าง มีการหมุนเวียน มีภาระของเซสชัน หรือมีความคงทนแบบ OAuth ซึ่งไม่สอดคล้องกับการ resolve SecretRef ภายนอกแบบอ่านอย่างเดียว

## ที่เกี่ยวข้อง

- [การจัดการ Secrets](/th/gateway/secrets)
- [ความหมายของข้อมูลรับรองการยืนยันตัวตน](/th/auth-credential-semantics)
