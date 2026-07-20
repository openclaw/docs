---
read_when:
    - การตรวจสอบความครอบคลุมของข้อมูลรับรอง SecretRef
    - การตรวจสอบว่าข้อมูลรับรองมีสิทธิ์ใช้กับ `secrets configure` หรือ `secrets apply` หรือไม่
    - การตรวจสอบสาเหตุที่ข้อมูลประจำตัวอยู่นอกขอบเขตที่รองรับ
summary: พื้นผิวข้อมูลรับรอง SecretRef ที่รองรับและไม่รองรับอย่างเป็นมาตรฐาน
title: พื้นผิวข้อมูลประจำตัว SecretRef
x-i18n:
    generated_at: "2026-07-20T06:06:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8409060dd08d8cdb9bde59bc1857da7e2c6273d10e148a3de35b23bd3cd3b1ab
    source_path: reference/secretref-credential-surface.md
    workflow: 16
---

หน้านี้กำหนดพื้นผิวข้อมูลประจำตัว SecretRef มาตรฐาน: ฟิลด์ข้อมูลประจำตัวใดบ้างที่ยอมรับ `SecretRef` (การอ้างอิงที่มี env/file/exec เป็นแหล่งข้อมูล) แทนค่าความลับดิบ

ขอบเขต:

- อยู่ในขอบเขต: เฉพาะข้อมูลประจำตัวที่ผู้ใช้ระบุ ซึ่ง OpenClaw ไม่ได้ออกหรือหมุนเวียนให้
- อยู่นอกขอบเขต: ข้อมูลประจำตัวที่ออกหรือหมุนเวียนขณะรัน ข้อมูลสำหรับรีเฟรช OAuth และอาร์ติแฟกต์ที่มีลักษณะเป็นเซสชัน

รายการด้านล่างสร้างจากรีจิสทรีเป้าหมายในซอร์สและตรวจสอบกับ `docs/reference/secretref-user-supplied-credentials-matrix.json` ใน CI โปรดอย่าแก้ไขรายการด้วยตนเอง

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
- `plugins.entries.acpx.config.mcpServers.*.env.*`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.codex.config.appServer.authToken`
- `plugins.entries.codex.config.appServer.headers.*`
- `plugins.entries.exa.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webFetch.apiKey`
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

- เป้าหมายแผนโปรไฟล์การยืนยันตัวตนต้องใช้ `agentId`; รายการแผนกำหนดเป้าหมายไปยัง `profiles.*.key` / `profiles.*.token` และเขียนการอ้างอิงที่อยู่ระดับเดียวกัน (`keyRef` / `tokenRef`) การอ้างอิงโปรไฟล์การยืนยันตัวตนรวมอยู่ในการแก้ไขค่าขณะรันและขอบเขตการตรวจสอบ
- ใน `openclaw.json` SecretRefs ต้องใช้ออบเจ็กต์แบบมีโครงสร้าง เช่น `{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}` ระบบจะปฏิเสธสตริงเครื่องหมาย `secretref-env:<ENV_VAR>` แบบเดิมในเส้นทางข้อมูลประจำตัว SecretRef; เรียกใช้ `openclaw doctor --fix` เพื่อย้ายเครื่องหมายที่ถูกต้อง
- ตัวป้องกันนโยบาย OAuth: ไม่สามารถใช้ `auth.profiles.<id>.mode = "oauth"` ร่วมกับอินพุต SecretRef สำหรับโปรไฟล์นั้นได้ การเริ่มต้น/โหลดซ้ำและการแก้ไขโปรไฟล์การยืนยันตัวตนจะล้มเหลวทันทีเมื่อละเมิดนโยบายนี้
- สำหรับผู้ให้บริการโมเดลที่จัดการด้วย SecretRef รายการ `agents/*/agent/models.json` ที่สร้างขึ้นจะคงเครื่องหมายที่ไม่ใช่ความลับ (ไม่ใช่ค่าความลับที่แก้ไขแล้ว) สำหรับพื้นผิว `apiKey`/ส่วนหัว การคงเครื่องหมายยึดแหล่งข้อมูลเป็นหลัก: OpenClaw เขียนเครื่องหมายจากสแนปช็อตการกำหนดค่าแหล่งข้อมูลที่ใช้งานอยู่ (ก่อนการแก้ไขค่า) ไม่ใช่จากค่าความลับขณะรันที่แก้ไขแล้ว
- การเริ่มต้น Gateway แบบ cold สามารถแยกความล้มเหลวในการแก้ไขค่าที่ลองใหม่ได้สำหรับเจ้าของที่มีการแมปและไม่ใช่ Gateway คลาสที่มีการแมปในปัจจุบันประกอบด้วยผู้ให้บริการโมเดลและ skills, ผู้ให้บริการสื่อ/TTS/cron, โปรไฟล์การยืนยันตัวตนที่เข้าเกณฑ์, หน่วยความจำรายเอเจนต์, sandbox SSH, บัญชีช่องทาง และเส้นทาง Plugin ที่ประกาศใน manifest การเริ่มต้นจะเก็บการอ้างอิงที่ระบุไว้อย่างชัดเจนของเจ้าของแต่ละรายที่ล้มเหลวไว้ในสแนปช็อตขณะรัน รายงานเจ้าของผ่านสถานะและ doctor และปฏิเสธคำขอสำหรับเจ้าของนั้นโดยไม่ลองใช้ข้อมูลประจำตัวที่มีลำดับความสำคัญต่ำกว่า การโหลดซ้ำและการตรวจสอบล่วงหน้าก่อนเขียนการกำหนดค่าใช้นโยบายที่รับรู้เจ้าของแบบเดียวกัน: เจ้าของที่สมบูรณ์จะรีเฟรช; เจ้าของที่เข้าเกณฑ์และล้มเหลวจะคงสถานะเก่าไว้เฉพาะเมื่ออัตลักษณ์การอ้างอิง คำจำกัดความผู้ให้บริการ และสัญญาของเจ้าของที่ไม่ใช่ความลับทั้งหมดไม่เปลี่ยนแปลง; ความล้มเหลวใหม่หรือที่เปลี่ยนแปลงจะกลายเป็น cold การยืนยันตัวตนขาเข้าของ Gateway, การอ้างอิงหรือค่าที่มีโครงสร้างไม่ถูกต้อง, เจ้าของที่ปิดเมื่อเกิดความล้มเหลว และเจ้าของที่ยังไม่มีการแมปยังคงเข้มงวด
- สำหรับการค้นหาเว็บ: ในโหมดระบุผู้ให้บริการอย่างชัดเจน (ตั้งค่า `tools.web.search.provider`) เฉพาะคีย์ของผู้ให้บริการที่เลือกเท่านั้นที่ทำงาน ในโหมดอัตโนมัติ (ไม่ได้ตั้งค่า `tools.web.search.provider`) เฉพาะคีย์ผู้ให้บริการแรกที่แก้ไขค่าได้ตามลำดับความสำคัญเท่านั้นที่ทำงาน และการอ้างอิงของผู้ให้บริการที่ไม่ได้เลือกจะถือว่าไม่ทำงานจนกว่าจะถูกเลือก ข้อมูลประจำตัวของผู้ให้บริการใช้ `plugins.entries.<plugin>.config.webSearch.*`
- Slack `identity: "user"` ใช้ `channels.slack.userToken` ร่วมกับ `channels.slack.appToken` สำหรับ Socket Mode หรือ `channels.slack.signingSecret` สำหรับโหมด HTTP การจับคู่แบบเดียวกันใช้ภายใต้ `channels.slack.accounts.*`; อัตลักษณ์นี้ไม่ต้องใช้โทเค็นบอต

## ข้อมูลประจำตัวที่ไม่รองรับ

ข้อมูลประจำตัวเหล่านี้เป็นคลาสที่มีการออกใหม่ หมุนเวียน มีข้อมูลเซสชัน หรือเก็บรักษา OAuth ระยะยาว ซึ่งไม่เหมาะกับการแก้ไขค่า SecretRef ภายนอกแบบอ่านอย่างเดียว:

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

## ที่เกี่ยวข้อง

- [การจัดการความลับ](/th/gateway/secrets)
- [ความหมายของข้อมูลประจำตัวสำหรับการยืนยันตัวตน](/th/auth-credential-semantics)
