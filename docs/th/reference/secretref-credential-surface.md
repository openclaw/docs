---
read_when:
    - การตรวจสอบความครอบคลุมของ credential แบบ SecretRef
    - การตรวจสอบว่า credential มีสิทธิ์ใช้กับ `secrets configure` หรือ `secrets apply` หรือไม่
    - การตรวจสอบว่าเหตุใด credential จึงอยู่นอกพื้นผิวที่รองรับ
summary: พื้นผิว credential ของ SecretRef ที่รองรับกับไม่รองรับแบบ canonical
title: พื้นผิว credential ของ SecretRef
x-i18n:
    generated_at: "2026-04-25T13:58:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 50a4602939970d92831c0de9339e84b0f42b119c2e25ea30375925282f55d237
    source_path: reference/secretref-credential-surface.md
    workflow: 15
---

หน้านี้กำหนดพื้นผิว credential ของ SecretRef แบบ canonical

เจตนาของขอบเขต:

- อยู่ในขอบเขต: credentials ที่ผู้ใช้จัดหาให้โดยตรงอย่างเคร่งครัด ซึ่ง OpenClaw ไม่ได้สร้างหรือหมุนเวียนเอง
- อยู่นอกขอบเขต: credentials ที่ถูกสร้างขึ้นระหว่างรันไทม์หรือมีการหมุนเวียน, วัสดุสำหรับ OAuth refresh และอาร์ติแฟกต์ลักษณะคล้ายเซสชัน

## credentials ที่รองรับ

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
- `channels.googlechat.serviceAccount` ผ่าน `serviceAccountRef` ที่เป็น sibling (ข้อยกเว้นเพื่อความเข้ากันได้)
- `channels.googlechat.accounts.*.serviceAccount` ผ่าน `serviceAccountRef` ที่เป็น sibling (ข้อยกเว้นเพื่อความเข้ากันได้)

### เป้าหมายใน `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`; ไม่รองรับเมื่อ `auth.profiles.<id>.mode = "oauth"`)
- `profiles.*.tokenRef` (`type: "token"`; ไม่รองรับเมื่อ `auth.profiles.<id>.mode = "oauth"`)

[//]: # "secretref-supported-list-end"

หมายเหตุ:

- เป้าหมายแผนของ auth-profile ต้องใช้ `agentId`
- รายการในแผนจะชี้ไปที่ `profiles.*.key` / `profiles.*.token` และเขียน sibling refs (`keyRef` / `tokenRef`)
- auth-profile refs จะถูกรวมอยู่ในการ resolve ระหว่างรันไทม์และความครอบคลุมของ audit
- ใน `openclaw.json`, SecretRefs ต้องใช้ structured objects เช่น `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` ระบบจะปฏิเสธ marker strings แบบ legacy `secretref-env:<ENV_VAR>` บนพาธ credential ของ SecretRef; ให้รัน `openclaw doctor --fix` เพื่อย้าย marker ที่ถูกต้อง
- ตัวป้องกันนโยบาย OAuth: `auth.profiles.<id>.mode = "oauth"` ไม่สามารถใช้ร่วมกับอินพุตแบบ SecretRef สำหรับ profile นั้นได้ การเริ่มต้น/รีโหลดและการ resolve auth-profile จะล้มเหลวอย่างรวดเร็วเมื่อมีการละเมิดนโยบายนี้
- สำหรับ model providers ที่จัดการด้วย SecretRef รายการ `agents/*/agent/models.json` ที่ถูกสร้างขึ้นจะคง markers ที่ไม่ใช่ความลับไว้ (ไม่ใช่ค่าความลับที่ resolve แล้ว) สำหรับพื้นผิว `apiKey`/header
- การคงค่า marker ยึดตามแหล่งที่มาเป็นหลัก: OpenClaw จะเขียน markers จาก active source config snapshot (ก่อนการ resolve) ไม่ใช่จากค่าความลับระหว่างรันไทม์ที่ resolve แล้ว
- สำหรับ web search:
  - ใน explicit provider mode (ตั้งค่า `tools.web.search.provider` ไว้) จะมีเพียงคีย์ของ provider ที่เลือกเท่านั้นที่ active
  - ใน auto mode (ไม่ได้ตั้งค่า `tools.web.search.provider`) จะมีเพียงคีย์ของ provider ตัวแรกที่ resolve ได้ตามลำดับความสำคัญเท่านั้นที่ active
  - ใน auto mode, refs ของ providers ที่ไม่ได้ถูกเลือกจะถือว่า inactive จนกว่าจะถูกเลือก
  - พาธ provider แบบ legacy `tools.web.search.*` ยังคง resolve ได้ในช่วงหน้าต่างความเข้ากันได้ แต่พื้นผิว SecretRef แบบ canonical คือ `plugins.entries.<plugin>.config.webSearch.*`

## credentials ที่ไม่รองรับ

credentials ที่อยู่นอกขอบเขตประกอบด้วย:

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

- credentials เหล่านี้เป็นคลาสที่ถูกสร้างขึ้น หมุนเวียน ผูกกับเซสชัน หรือคงทนแบบ OAuth ซึ่งไม่เข้ากับการ resolve แบบ SecretRef ภายนอกที่อ่านอย่างเดียว

## ที่เกี่ยวข้อง

- [Secrets management](/th/gateway/secrets)
- [Auth credential semantics](/th/auth-credential-semantics)
