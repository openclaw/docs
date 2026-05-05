---
read_when:
    - การเพิ่มหรือแก้ไขไมเกรชันของ doctor
    - การเพิ่มการเปลี่ยนแปลงการกำหนดค่าที่ทำให้เข้ากันไม่ได้
sidebarTitle: Doctor
summary: 'คำสั่ง Doctor: การตรวจสอบสถานะ การย้ายข้อมูลการกำหนดค่า และขั้นตอนการซ่อมแซม'
title: ตัวตรวจวินิจฉัย
x-i18n:
    generated_at: "2026-05-05T01:47:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e374f91d00d4b43a3852de6f746b044471e80af936d464a789061a31cadd09d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` คือเครื่องมือซ่อมแซม + ย้ายข้อมูลสำหรับ OpenClaw เครื่องมือนี้แก้ไข config/state ที่ค้างเก่า ตรวจสอบสุขภาพ และให้ขั้นตอนซ่อมแซมที่นำไปทำต่อได้

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw doctor
```

### โหมด headless และ automation

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    ยอมรับค่าเริ่มต้นโดยไม่ถาม (รวมถึงขั้นตอนซ่อมแซม restart/service/sandbox เมื่อเกี่ยวข้อง)

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    ใช้การซ่อมแซมที่แนะนำโดยไม่ถาม (การซ่อมแซม + การ restart เมื่อปลอดภัย)

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    ใช้การซ่อมแซมแบบเข้มข้นด้วย (เขียนทับ supervisor config แบบกำหนดเอง)

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    รันโดยไม่ถาม และใช้เฉพาะ migration ที่ปลอดภัยเท่านั้น (การปรับ config ให้เป็นมาตรฐาน + การย้าย state บนดิสก์) ข้ามการทำงาน restart/service/sandbox ที่ต้องให้มนุษย์ยืนยัน Legacy state migrations จะรันโดยอัตโนมัติเมื่อตรวจพบ

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    สแกน service ของระบบเพื่อหา gateway installs เพิ่มเติม (launchd/systemd/schtasks)

  </Tab>
</Tabs>

ถ้าคุณต้องการตรวจทานการเปลี่ยนแปลงก่อนเขียน ให้เปิดไฟล์ config ก่อน:

```bash
cat ~/.openclaw/openclaw.json
```

## สิ่งที่ทำ (สรุป)

<AccordionGroup>
  <Accordion title="สุขภาพ, UI, และการอัปเดต">
    - การอัปเดตก่อนเริ่มแบบ optional สำหรับ git installs (เฉพาะ interactive)
    - ตรวจสอบความสดใหม่ของ UI protocol (สร้าง Control UI ใหม่เมื่อ protocol schema ใหม่กว่า)
    - Health check + prompt สำหรับ restart
    - สรุปสถานะ Skills (eligible/missing/blocked) และสถานะ plugin

  </Accordion>
  <Accordion title="Config และ migrations">
    - การปรับ config ให้เป็นมาตรฐานสำหรับค่า legacy
    - ย้าย Talk config จากฟิลด์ legacy แบบ flat `talk.*` ไปเป็น `talk.provider` + `talk.providers.<provider>`
    - ตรวจสอบ browser migration สำหรับ legacy Chrome extension configs และความพร้อมของ Chrome MCP
    - คำเตือน OpenCode provider override (`models.providers.opencode` / `models.providers.opencode-go`)
    - คำเตือน Codex OAuth shadowing (`models.providers.openai-codex`)
    - ตรวจสอบข้อกำหนดเบื้องต้นของ OAuth TLS สำหรับ OpenAI Codex OAuth profiles
    - คำเตือน Plugin/tool allowlist เมื่อ `plugins.allow` จำกัดมาก แต่ tool policy ยังขอ wildcard หรือเครื่องมือที่ plugin เป็นเจ้าของ
    - Legacy on-disk state migration (sessions/agent dir/WhatsApp auth)
    - การย้าย legacy plugin manifest contract key (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
    - การย้าย legacy cron store (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบนสุด, payload `provider`, fallback jobs แบบ webhook อย่างง่าย `notify: true`)
    - การย้าย legacy agent runtime-policy ไปยัง `agents.defaults.agentRuntime` และ `agents.list[].agentRuntime`
    - ล้าง plugin config ที่ค้างเก่าเมื่อเปิดใช้ plugins; เมื่อ `plugins.enabled=false` การอ้างอิง plugin ที่ค้างเก่าจะถือเป็น inert containment config และจะถูกเก็บไว้

  </Accordion>
  <Accordion title="State และ integrity">
    - ตรวจสอบ session lock file และล้าง lock ที่ค้างเก่า
    - ซ่อมแซม session transcript สำหรับ prompt-rewrite branches ที่ซ้ำกันซึ่งสร้างโดย builds 2026.4.24 ที่ได้รับผลกระทบ
    - ตรวจจับ tombstone สำหรับ restart-recovery ของ subagent ที่ติดค้าง พร้อมรองรับ `--fix` เพื่อล้าง recovery flags แบบ aborted ที่ค้างเก่า เพื่อไม่ให้ startup ยังถือว่า child เป็น restart-aborted ต่อไป
    - ตรวจสอบ state integrity และ permissions (sessions, transcripts, state dir)
    - ตรวจสอบ permission ของไฟล์ config (chmod 600) เมื่อรันในเครื่อง
    - สุขภาพ model auth: ตรวจสอบ OAuth expiry, refresh tokens ที่ใกล้หมดอายุได้, และรายงานสถานะ cooldown/disabled ของ auth-profile
    - ตรวจจับ workspace dir เพิ่มเติม (`~/openclaw`)

  </Accordion>
  <Accordion title="Gateway, services, และ supervisors">
    - ซ่อมแซม sandbox image เมื่อเปิดใช้ sandboxing
    - Legacy service migration และการตรวจจับ gateway เพิ่มเติม
    - Matrix channel legacy state migration (ในโหมด `--fix` / `--repair`)
    - ตรวจสอบ Gateway runtime (ติดตั้ง service แล้วแต่ไม่รัน; cached launchd label)
    - คำเตือนสถานะ channel (probe จาก gateway ที่กำลังรัน)
    - ตรวจสอบ supervisor config (launchd/systemd/schtasks) พร้อมการซ่อมแซมแบบ optional
    - ล้าง embedded proxy environment สำหรับ gateway services ที่จับค่า shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` ไว้ระหว่าง install หรือ update
    - ตรวจสอบแนวปฏิบัติที่ดีของ Gateway runtime (Node เทียบกับ Bun, paths ของ version-manager)
    - diagnostics สำหรับ Gateway port collision (ค่าเริ่มต้น `18789`)

  </Accordion>
  <Accordion title="Auth, security, และ pairing">
    - คำเตือนด้านความปลอดภัยสำหรับ open DM policies
    - ตรวจสอบ Gateway auth สำหรับ local token mode (เสนอการสร้าง token เมื่อไม่มี token source; ไม่เขียนทับ token SecretRef configs)
    - ตรวจจับปัญหา device pairing (pending first-time pair requests, pending role/scope upgrades, stale local device-token cache drift, และ paired-record auth drift)

  </Accordion>
  <Accordion title="Workspace และ shell">
    - ตรวจสอบ systemd linger บน Linux
    - ตรวจสอบขนาดไฟล์ workspace bootstrap (คำเตือน truncation/near-limit สำหรับ context files)
    - ตรวจสอบความพร้อมของ Skills สำหรับ agent เริ่มต้น; รายงาน skills ที่อนุญาตแต่ขาด bins, env, config, หรือข้อกำหนดของ OS และ `--fix` สามารถปิดใช้ skills ที่ใช้ไม่ได้ใน `skills.entries`
    - ตรวจสอบสถานะ shell completion และติดตั้ง/อัปเกรดอัตโนมัติ
    - ตรวจสอบความพร้อมของ memory search embedding provider (local model, remote API key, หรือ QMD binary)
    - ตรวจสอบ source install (pnpm workspace mismatch, UI assets ที่ขาด, tsx binary ที่ขาด)
    - เขียน config + wizard metadata ที่อัปเดตแล้ว

  </Accordion>
</AccordionGroup>

## การ backfill และ reset ใน Dreams UI

ฉาก Dreams ของ Control UI มี action **Backfill**, **Reset**, และ **Clear Grounded** สำหรับ workflow แบบ grounded Dreaming action เหล่านี้ใช้เมธอด RPC สไตล์ gateway doctor แต่ **ไม่ใช่** ส่วนหนึ่งของการซ่อมแซม/migration ของ `openclaw doctor` CLI

สิ่งที่ทำ:

- **Backfill** สแกนไฟล์ `memory/YYYY-MM-DD.md` ใน workspace ที่ active, รัน grounded REM diary pass, และเขียน backfill entries ที่ย้อนกลับได้ลงใน `DREAMS.md`
- **Reset** ลบเฉพาะ backfill diary entries ที่ถูกทำเครื่องหมายไว้เหล่านั้นออกจาก `DREAMS.md`
- **Clear Grounded** ลบเฉพาะ staged grounded-only short-term entries ที่มาจาก historical replay และยังไม่มี live recall หรือ daily support สะสม

สิ่งที่ **ไม่** ทำด้วยตัวเอง:

- ไม่แก้ไข `MEMORY.md`
- ไม่รัน doctor migrations ทั้งหมด
- ไม่ stage grounded candidates เข้า live short-term promotion store โดยอัตโนมัติ เว้นแต่คุณจะรัน staged CLI path อย่างชัดเจนก่อน

ถ้าคุณต้องการให้ grounded historical replay ส่งผลต่อ deep promotion lane ปกติ ให้ใช้ CLI flow แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

คำสั่งนี้จะ stage grounded durable candidates เข้า short-term dreaming store โดยยังคงใช้ `DREAMS.md` เป็นพื้นผิวสำหรับตรวจทาน

## พฤติกรรมโดยละเอียดและเหตุผล

<AccordionGroup>
  <Accordion title="0. การอัปเดตแบบ optional (git installs)">
    ถ้านี่เป็น git checkout และ doctor กำลังรันแบบ interactive ระบบจะเสนอให้อัปเดต (fetch/rebase/build) ก่อนรัน doctor
  </Accordion>
  <Accordion title="1. การปรับ config ให้เป็นมาตรฐาน">
    ถ้า config มีรูปแบบค่า legacy (เช่น `messages.ackReaction` โดยไม่มี channel-specific override) doctor จะปรับให้เป็น schema ปัจจุบัน

    ซึ่งรวมถึงฟิลด์ flat ของ Talk แบบ legacy ด้วย Talk config สาธารณะปัจจุบันคือ `talk.provider` + `talk.providers.<provider>` Doctor จะเขียนรูปแบบ `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` เก่าใหม่ลงใน provider map

    Doctor ยังเตือนเมื่อ `plugins.allow` ไม่ว่าง และ tool policy ใช้
    wildcard หรือรายการเครื่องมือที่ plugin เป็นเจ้าของ `tools.allow: ["*"]` จะ match เฉพาะเครื่องมือ
    จาก plugins ที่โหลดจริงเท่านั้น; มันไม่ข้าม exclusive plugin
    allowlist Doctor เขียน `plugins.bundledDiscovery: "compat"` สำหรับ migrated
    legacy allowlist configs เพื่อรักษาพฤติกรรม bundled provider ที่มีอยู่ และ
    จากนั้นชี้ไปยังการตั้งค่า `"allowlist"` ที่เข้มงวดกว่า

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    เมื่อ config มี key ที่ deprecated คำสั่งอื่นจะปฏิเสธที่จะรันและขอให้คุณรัน `openclaw doctor`

    Doctor จะ:

    - อธิบายว่าพบ legacy keys ใดบ้าง
    - แสดง migration ที่ใช้
    - เขียน `~/.openclaw/openclaw.json` ใหม่ด้วย schema ที่อัปเดตแล้ว

    Gateway จะรัน doctor migrations อัตโนมัติเมื่อ startup เมื่อพบรูปแบบ legacy config ดังนั้น configs ที่ค้างเก่าจะถูกซ่อมแซมโดยไม่ต้องทำเอง Cron job store migrations จัดการโดย `openclaw doctor --fix`

    Migrations ปัจจุบัน:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - การกำหนดค่าช่องที่กำหนดไว้ซึ่งไม่มีนโยบายการตอบกลับแบบมองเห็นได้ → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` ระดับบนสุด
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` แบบเดิม → `talk.provider` + `talk.providers.<provider>`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` และ `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` และ `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` และ `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` และ `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - สำหรับช่องที่มี `accounts` แบบตั้งชื่อไว้ แต่ยังมีค่าช่องระดับบนสุดแบบบัญชีเดียวค้างอยู่ ให้ย้ายค่าที่อยู่ในขอบเขตบัญชีเหล่านั้นไปยังบัญชีที่เลื่อนระดับซึ่งเลือกไว้สำหรับช่องนั้น (`accounts.default` สำหรับช่องส่วนใหญ่; Matrix สามารถคงเป้าหมายแบบตั้งชื่อ/ค่าเริ่มต้นที่ตรงกันซึ่งมีอยู่แล้วได้)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - นำ `agents.defaults.llm` ออก; ใช้ `models.providers.<id>.timeoutSeconds` สำหรับการหมดเวลาของผู้ให้บริการ/โมเดลที่ช้า
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - นำ `browser.relayBindHost` ออก (การตั้งค่ารีเลย์ extension แบบเดิม)
    - `models.providers.*.api: "openai"` แบบเดิม → `"openai-completions"` (การเริ่มต้น Gateway จะข้ามผู้ให้บริการที่ตั้งค่า `api` เป็นค่า enum ในอนาคตหรือไม่รู้จักด้วย แทนที่จะล้มเหลวแบบปิด)

    คำเตือนของ Doctor ยังรวมคำแนะนำค่าเริ่มต้นของบัญชีสำหรับช่องที่มีหลายบัญชีด้วย:

    - หากกำหนดค่ารายการ `channels.<channel>.accounts` ตั้งแต่สองรายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default` doctor จะเตือนว่าการกำหนดเส้นทางสำรองอาจเลือกบัญชีที่ไม่คาดคิด
    - หากตั้งค่า `channels.<channel>.defaultAccount` เป็น ID บัญชีที่ไม่รู้จัก doctor จะเตือนและแสดงรายการ ID บัญชีที่กำหนดค่าไว้

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    หากคุณเพิ่ม `models.providers.opencode`, `opencode-zen` หรือ `opencode-go` ด้วยตนเอง จะเป็นการแทนที่แค็ตตาล็อก OpenCode ในตัวจาก `@mariozechner/pi-ai` ซึ่งอาจบังคับให้โมเดลใช้ API ที่ไม่ถูกต้องหรือทำให้ต้นทุนเป็นศูนย์ Doctor จะเตือนเพื่อให้คุณสามารถนำการแทนที่ออกและกู้คืนการกำหนดเส้นทาง API + ต้นทุนแบบต่อโมเดลได้
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    หากการกำหนดค่าเบราว์เซอร์ของคุณยังชี้ไปยังพาธ Chrome extension ที่ถูกนำออกแล้ว doctor จะปรับให้เป็นโมเดลการเชื่อมต่อ Chrome MCP แบบ host-local ปัจจุบัน:

    - `browser.profiles.*.driver: "extension"` กลายเป็น `"existing-session"`
    - `browser.relayBindHost` ถูกนำออก

    Doctor ยังตรวจสอบพาธ Chrome MCP แบบ host-local เมื่อคุณใช้ `defaultProfile: "user"` หรือโปรไฟล์ `existing-session` ที่กำหนดค่าไว้:

    - ตรวจสอบว่า Google Chrome ติดตั้งอยู่บนโฮสต์เดียวกันสำหรับโปรไฟล์เชื่อมต่ออัตโนมัติเริ่มต้นหรือไม่
    - ตรวจสอบเวอร์ชัน Chrome ที่ตรวจพบและเตือนเมื่อเวอร์ชันต่ำกว่า Chrome 144
    - เตือนให้คุณเปิดใช้ remote debugging ในหน้า inspect ของเบราว์เซอร์ (เช่น `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` หรือ `edge://inspect/#remote-debugging`)

    Doctor ไม่สามารถเปิดใช้การตั้งค่าฝั่ง Chrome ให้คุณได้ Chrome MCP แบบ host-local ยังคงต้องใช้:

    - เบราว์เซอร์ที่ใช้ Chromium 144+ บนโฮสต์ gateway/node
    - เบราว์เซอร์ที่ทำงานอยู่ในเครื่อง
    - เปิดใช้ remote debugging ในเบราว์เซอร์นั้น
    - อนุมัติพรอมป์ยินยอมการเชื่อมต่อครั้งแรกในเบราว์เซอร์

    ความพร้อมในที่นี้เกี่ยวข้องกับข้อกำหนดเบื้องต้นของการเชื่อมต่อในเครื่องเท่านั้น Existing-session ยังคงใช้ขีดจำกัดเส้นทาง Chrome MCP ปัจจุบัน; เส้นทางขั้นสูง เช่น `responsebody`, การส่งออก PDF, การดักการดาวน์โหลด และการทำงานแบบแบตช์ ยังคงต้องใช้เบราว์เซอร์ที่จัดการอยู่หรือโปรไฟล์ CDP ดิบ

    การตรวจสอบนี้ **ไม่** ใช้กับ Docker, sandbox, remote-browser หรือโฟลว์ headless อื่น ๆ สิ่งเหล่านั้นยังคงใช้ CDP ดิบต่อไป

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    เมื่อกำหนดค่าโปรไฟล์ OpenAI Codex OAuth doctor จะตรวจสอบปลายทางการอนุญาตของ OpenAI เพื่อยืนยันว่า Node/OpenSSL TLS stack ในเครื่องสามารถตรวจสอบสายโซ่ใบรับรองได้ หากการตรวจสอบล้มเหลวด้วยข้อผิดพลาดใบรับรอง (เช่น `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ใบรับรองหมดอายุ หรือใบรับรองที่ลงนามเอง) doctor จะพิมพ์คำแนะนำการแก้ไขเฉพาะแพลตฟอร์ม บน macOS ที่ใช้ Homebrew Node วิธีแก้มักเป็น `brew postinstall ca-certificates` เมื่อใช้ `--deep` การตรวจสอบจะทำงานแม้ว่า Gateway จะปกติดี
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    หากก่อนหน้านี้คุณเพิ่มการตั้งค่าขนส่ง OpenAI แบบเดิมไว้ใต้ `models.providers.openai-codex` การตั้งค่าเหล่านั้นอาจบดบังพาธผู้ให้บริการ Codex OAuth ในตัวที่รุ่นใหม่กว่าใช้โดยอัตโนมัติ Doctor จะเตือนเมื่อพบการตั้งค่าขนส่งเก่าเหล่านั้นควบคู่กับ Codex OAuth เพื่อให้คุณสามารถนำการแทนที่ขนส่งที่ล้าสมัยออกหรือเขียนใหม่ และนำพฤติกรรมการกำหนดเส้นทาง/สำรองในตัวกลับมาได้ พร็อกซีแบบกำหนดเองและการแทนที่เฉพาะส่วนหัว ยังรองรับอยู่และจะไม่ทำให้เกิดคำเตือนนี้
  </Accordion>
  <Accordion title="2f. Codex plugin route warnings">
    เมื่อเปิดใช้ Codex plugin ที่รวมมา doctor จะตรวจสอบด้วยว่า ref โมเดลหลัก `openai-codex/*` ยัง resolve ผ่านตัวรัน PI เริ่มต้นหรือไม่ ชุดค่านี้ใช้ได้เมื่อคุณต้องการการยืนยันตัวตน Codex OAuth/การสมัครใช้งานผ่าน PI แต่สับสนได้ง่ายกับ native Codex app-server harness Doctor จะเตือนและชี้ไปยังรูปแบบ app-server แบบชัดเจน: `openai/*` บวก `agentRuntime.id: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex`

    Doctor ไม่ซ่อมแซมสิ่งนี้โดยอัตโนมัติ เพราะทั้งสองเส้นทางใช้ได้:

    - `openai-codex/*` + PI หมายถึง "ใช้การยืนยันตัวตน Codex OAuth/การสมัครใช้งานผ่านตัวรัน OpenClaw ปกติ"
    - `openai/*` + `agentRuntime.id: "codex"` หมายถึง "รัน turn ที่ฝังไว้ผ่าน native Codex app-server"
    - `/codex ...` หมายถึง "ควบคุมหรือผูกการสนทนา native Codex จากแชท"
    - `/acp ...` หรือ `runtime: "acp"` หมายถึง "ใช้อะแดปเตอร์ ACP/acpx ภายนอก"

    หากคำเตือนปรากฏขึ้น ให้เลือกเส้นทางที่คุณตั้งใจและแก้ไข config ด้วยตนเอง คงคำเตือนไว้ตามเดิมเมื่อ PI Codex OAuth เป็นสิ่งที่ตั้งใจไว้

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor ยังสแกนที่เก็บเซสชันที่ใช้งานอยู่เพื่อหาสถานะเส้นทางที่สร้างอัตโนมัติซึ่งล้าสมัย หลังจากคุณย้ายโมเดลหรือ runtime ค่าเริ่มต้น/สำรองที่กำหนดค่าไว้ออกจากเส้นทางที่ plugin เป็นเจ้าของ เช่น Codex

    `openclaw doctor --fix` สามารถล้างสถานะล้าสมัยที่สร้างอัตโนมัติได้ เช่น การปักหมุดโมเดล `modelOverrideSource: "auto"`, เมทาดาทาโมเดล runtime, ID harness ที่ปักหมุดไว้, การผูกเซสชัน CLI และการแทนที่ auth-profile อัตโนมัติ เมื่อเส้นทางเจ้าของของรายการเหล่านั้นไม่ได้ถูกกำหนดค่าอีกต่อไป ตัวเลือกโมเดลของผู้ใช้แบบชัดเจนหรือเซสชันเดิมจะถูกรายงานให้ตรวจสอบด้วยตนเองและปล่อยไว้โดยไม่แตะต้อง; เปลี่ยนด้วย `/model ...`, `/new` หรือรีเซ็ตเซสชันเมื่อไม่ต้องการเส้นทางนั้นอีกต่อไป

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor สามารถย้ายเลย์เอาต์บนดิสก์รุ่นเก่าไปยังโครงสร้างปัจจุบันได้:

    - ที่เก็บเซสชัน + ทรานสคริปต์:
      - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
    - ไดเรกทอรี Agent:
      - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
    - สถานะการยืนยันตัวตน WhatsApp (Baileys):
      - จาก `~/.openclaw/credentials/*.json` แบบเดิม (ยกเว้น `oauth.json`)
      - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID บัญชีเริ่มต้น: `default`)

    การย้ายเหล่านี้เป็นแบบ best-effort และ idempotent; doctor จะส่งคำเตือนเมื่อปล่อยโฟลเดอร์เดิมใด ๆ ไว้เป็นข้อมูลสำรอง Gateway/CLI ยังย้ายเซสชันเดิม + ไดเรกทอรี agent โดยอัตโนมัติเมื่อเริ่มต้น เพื่อให้ประวัติ/auth/models ไปอยู่ในพาธต่อ agent โดยไม่ต้องรัน doctor ด้วยตนเอง การย้าย auth ของ WhatsApp จงใจให้ทำผ่าน `openclaw doctor` เท่านั้น การปรับรูปแบบ talk provider/provider-map ตอนนี้เปรียบเทียบด้วยความเท่ากันเชิงโครงสร้าง ดังนั้น diff ที่ต่างกันเฉพาะลำดับคีย์จะไม่ทำให้เกิดการเปลี่ยนแปลง `doctor --fix` แบบ no-op ซ้ำอีก

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor สแกน manifest ของ plugin ที่ติดตั้งทั้งหมดเพื่อหาคีย์ capability ระดับบนสุดที่เลิกใช้แล้ว (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) เมื่อพบ จะเสนอให้ย้ายไปยังออบเจ็กต์ `contracts` และเขียนไฟล์ manifest ใหม่ในที่เดิม การย้ายนี้เป็น idempotent; หากคีย์ `contracts` มีค่าเดียวกันอยู่แล้ว คีย์เดิมจะถูกนำออกโดยไม่ทำข้อมูลซ้ำ
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor ยังตรวจสอบที่เก็บงาน cron (`~/.openclaw/cron/jobs.json` โดยค่าเริ่มต้น หรือ `cron.store` เมื่อถูกแทนที่) เพื่อหารูปแบบงานเก่าที่ตัวจัดตารางเวลายังคงยอมรับเพื่อความเข้ากันได้

    การล้างข้อมูล cron ปัจจุบันรวมถึง:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - ฟิลด์ payload ระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
    - ฟิลด์ delivery ระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias การส่งของ `provider` ใน payload → `delivery.channel` แบบชัดเจน
    - งาน fallback webhook `notify: true` แบบเดิมอย่างง่าย → `delivery.mode="webhook"` แบบชัดเจนพร้อม `delivery.to=cron.webhook`

    Doctor จะย้ายงาน `notify: true` โดยอัตโนมัติเฉพาะเมื่อทำได้โดยไม่เปลี่ยนพฤติกรรม หากงานรวม fallback notify แบบเดิมเข้ากับโหมด delivery ที่ไม่ใช่ webhook ซึ่งมีอยู่แล้ว doctor จะเตือนและปล่อยให้งานนั้นตรวจสอบด้วยตนเอง

    บน Linux doctor จะเตือนด้วยเมื่อ crontab ของผู้ใช้ยังเรียกใช้ `~/.openclaw/bin/ensure-whatsapp.sh` แบบดั้งเดิมอยู่ สคริปต์เฉพาะโฮสต์นี้ไม่ได้รับการดูแลโดย OpenClaw ปัจจุบัน และอาจเขียนข้อความ `Gateway inactive` ที่ไม่ถูกต้องลงใน `~/.openclaw/logs/whatsapp-health.log` เมื่อ cron ไม่สามารถเข้าถึง systemd user bus ได้ ลบรายการ crontab ที่ค้างอยู่ด้วย `crontab -e`; ใช้ `openclaw channels status --probe`, `openclaw doctor` และ `openclaw gateway status` สำหรับการตรวจสอบสุขภาพปัจจุบัน

  </Accordion>
  <Accordion title="3c. การล้าง session lock">
    Doctor สแกนไดเรกทอรีเซสชันของ agent ทุกตัวเพื่อหาไฟล์ write-lock ที่ค้างอยู่ — ไฟล์ที่ถูกทิ้งไว้เมื่อเซสชันออกผิดปกติ สำหรับ lock file แต่ละไฟล์ที่พบ จะรายงาน: path, PID, PID ยังมีชีวิตอยู่หรือไม่, อายุของ lock และถือว่า stale หรือไม่ (PID ตายแล้วหรือเก่ากว่า 30 นาที) ในโหมด `--fix` / `--repair` จะลบ stale lock files โดยอัตโนมัติ; มิฉะนั้นจะพิมพ์บันทึกและแนะนำให้คุณรันซ้ำด้วย `--fix`
  </Accordion>
  <Accordion title="3d. การซ่อมแซม branch ของ session transcript">
    Doctor สแกนไฟล์ JSONL ของเซสชัน agent เพื่อหารูปแบบ branch ที่ซ้ำกันซึ่งสร้างโดยบั๊กการเขียน prompt transcript ใหม่ของ 2026.4.24: user turn ที่ถูกละทิ้งซึ่งมี context runtime ภายในของ OpenClaw พร้อมกับ sibling ที่ active ซึ่งมี prompt ของผู้ใช้ที่มองเห็นได้เหมือนกัน ในโหมด `--fix` / `--repair` doctor จะสำรองไฟล์ที่ได้รับผลกระทบแต่ละไฟล์ไว้ข้างไฟล์ต้นฉบับ และเขียน transcript ใหม่ให้เป็น branch ที่ active เพื่อให้ประวัติ gateway และ memory readers ไม่เห็น turn ซ้ำอีกต่อไป
  </Accordion>
  <Accordion title="4. การตรวจสอบความสมบูรณ์ของ state (session persistence, routing และความปลอดภัย)">
    ไดเรกทอรี state คือแกนปฏิบัติการหลัก หากมันหายไป คุณจะสูญเสียเซสชัน, credentials, logs และ config (เว้นแต่คุณมีข้อมูลสำรองที่อื่น)

    Doctor ตรวจสอบ:

    - **State dir missing**: เตือนเรื่องการสูญเสีย state อย่างร้ายแรง แจ้งให้สร้างไดเรกทอรีใหม่ และเตือนว่าไม่สามารถกู้คืนข้อมูลที่หายไปได้
    - **State dir permissions**: ตรวจสอบว่าสามารถเขียนได้; เสนอให้ซ่อมแซม permissions (และแสดงคำแนะนำ `chown` เมื่อตรวจพบ owner/group ไม่ตรงกัน)
    - **macOS cloud-synced state dir**: เตือนเมื่อ state resolve ไปอยู่ใต้ iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ `~/Library/CloudStorage/...` เพราะ path ที่มี sync รองรับอาจทำให้ I/O ช้าลงและเกิด lock/sync race ได้
    - **Linux SD or eMMC state dir**: เตือนเมื่อ state resolve ไปยัง mount source แบบ `mmcblk*` เพราะ random I/O ที่รองรับด้วย SD หรือ eMMC อาจช้ากว่าและสึกหรอเร็วกว่าเมื่อมีการเขียน session และ credential
    - **Session dirs missing**: จำเป็นต้องมี `sessions/` และไดเรกทอรี session store เพื่อ persist history และหลีกเลี่ยง crash แบบ `ENOENT`
    - **Transcript mismatch**: เตือนเมื่อ session entries ล่าสุดมี transcript files ที่หายไป
    - **Main session "1-line JSONL"**: flag เมื่อ main transcript มีเพียงหนึ่งบรรทัด (history ไม่ได้สะสม)
    - **Multiple state dirs**: เตือนเมื่อมีโฟลเดอร์ `~/.openclaw` หลายชุดอยู่ใน home directories หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (history อาจแยกระหว่าง installs)
    - **Remote mode reminder**: หาก `gateway.mode=remote` doctor จะเตือนให้คุณรันบน remote host (state อยู่ที่นั่น)
    - **Config file permissions**: เตือนหาก `~/.openclaw/openclaw.json` อ่านได้โดย group/world และเสนอให้ปรับให้เข้มงวดเป็น `600`

  </Accordion>
  <Accordion title="5. สุขภาพ model auth (OAuth expiry)">
    Doctor ตรวจสอบ OAuth profiles ใน auth store เตือนเมื่อ tokens ใกล้หมดอายุ/หมดอายุแล้ว และสามารถ refresh ได้เมื่อปลอดภัย หาก Anthropic OAuth/token profile stale จะแนะนำ Anthropic API key หรือ path setup-token ของ Anthropic ข้อความแจ้ง refresh จะปรากฏเฉพาะเมื่อรันแบบ interactive (TTY); `--non-interactive` จะข้ามความพยายาม refresh

    เมื่อ OAuth refresh ล้มเหลวอย่างถาวร (เช่น `refresh_token_reused`, `invalid_grant` หรือ provider แจ้งให้คุณ sign in ใหม่) doctor จะรายงานว่าจำเป็นต้อง re-auth และพิมพ์คำสั่ง `openclaw models auth login --provider ...` ที่ต้องรันอย่างแม่นยำ

    Doctor ยังรายงาน auth profiles ที่ใช้งานไม่ได้ชั่วคราวเนื่องจาก:

    - cooldown สั้นๆ (rate limits/timeouts/auth failures)
    - การ disable ที่นานกว่า (billing/credit failures)

  </Accordion>
  <Accordion title="6. การตรวจสอบ hooks model">
    หากตั้งค่า `hooks.gmail.model` แล้ว doctor จะตรวจสอบ model reference กับ catalog และ allowlist และเตือนเมื่อ resolve ไม่ได้หรือถูก disallow
  </Accordion>
  <Accordion title="7. การซ่อมแซม sandbox image">
    เมื่อเปิดใช้ sandboxing doctor จะตรวจสอบ Docker images และเสนอให้ build หรือสลับไปใช้ชื่อ legacy หาก image ปัจจุบันหายไป
  </Accordion>
  <Accordion title="7b. การล้าง plugin install">
    Doctor ลบ state staging dependency ของ plugin ที่สร้างโดย OpenClaw แบบดั้งเดิมในโหมด `openclaw doctor --fix` / `openclaw doctor --repair` ซึ่งครอบคลุม stale generated dependency roots, install-stage directories เก่า, debris เฉพาะ package จากโค้ดซ่อมแซม dependency ของ bundled-plugin รุ่นก่อนหน้า และ managed npm copies ของ bundled `@openclaw/*` plugins ที่ orphaned หรือ recovered ซึ่งอาจ shadow manifest ที่ bundled ปัจจุบัน

    Doctor ยังสามารถ reinstall downloadable plugins ที่หายไปเมื่อ config อ้างอิงถึงมันแต่ local plugin registry หาไม่พบ ตัวอย่างได้แก่ `plugins.entries` ที่มีเนื้อหา, channel/provider/search settings ที่ configure แล้ว และ agent runtimes ที่ configure แล้ว ระหว่าง package updates doctor จะหลีกเลี่ยงการรัน package-manager plugin repair ขณะ core package กำลังถูกสลับ; รัน `openclaw doctor --fix` อีกครั้งหลัง update หาก plugin ที่ configure แล้วยังต้อง recovery อยู่ Gateway startup และ config reload จะไม่รัน package managers; plugin installs ยังคงเป็นงาน doctor/install/update ที่ explicit

  </Accordion>
  <Accordion title="8. Gateway service migrations และ cleanup hints">
    Doctor ตรวจพบ gateway services แบบดั้งเดิม (launchd/systemd/schtasks) และเสนอให้ลบออกและติดตั้งบริการ OpenClaw โดยใช้ gateway port ปัจจุบัน นอกจากนี้ยังสามารถสแกนหา services เพิ่มเติมที่คล้าย gateway และพิมพ์ cleanup hints ได้ OpenClaw gateway services ที่ตั้งชื่อตาม profile ถือเป็น first-class และจะไม่ถูก flag ว่าเป็น "extra"

    บน Linux หาก user-level gateway service หายไปแต่มี system-level OpenClaw gateway service อยู่ doctor จะไม่ติดตั้ง user-level service ตัวที่สองโดยอัตโนมัติ ตรวจสอบด้วย `openclaw gateway status --deep` หรือ `openclaw doctor --deep` จากนั้นลบตัวที่ซ้ำ หรือกำหนด `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ system supervisor เป็นเจ้าของ lifecycle ของ gateway

  </Accordion>
  <Accordion title="8b. Startup Matrix migration">
    เมื่อบัญชีช่อง Matrix มี legacy state migration ที่ pending หรือ actionable doctor (ในโหมด `--fix` / `--repair`) จะสร้าง snapshot ก่อน migration แล้วรันขั้นตอน migration แบบ best-effort: legacy Matrix state migration และ legacy encrypted-state preparation ทั้งสองขั้นตอนไม่ fatal; errors จะถูก log และ startup จะดำเนินต่อไป ในโหมด read-only (`openclaw doctor` ที่ไม่มี `--fix`) การตรวจสอบนี้จะถูกข้ามทั้งหมด
  </Accordion>
  <Accordion title="8c. Device pairing และ auth drift">
    ตอนนี้ Doctor ตรวจสอบ state ของ device-pairing เป็นส่วนหนึ่งของ health pass ปกติ

    สิ่งที่รายงาน:

    - first-time pairing requests ที่ pending
    - role upgrades ที่ pending สำหรับ devices ที่ paired แล้ว
    - scope upgrades ที่ pending สำหรับ devices ที่ paired แล้ว
    - การซ่อมแซม public-key mismatch เมื่อ device id ยังตรงกันแต่ device identity ไม่ตรงกับ record ที่ approved แล้ว
    - paired records ที่ไม่มี active token สำหรับ role ที่ approved แล้ว
    - paired tokens ที่ scopes drift ออกจาก pairing baseline ที่ approved แล้ว
    - local cached device-token entries สำหรับเครื่องปัจจุบันที่เก่ากว่า gateway-side token rotation หรือมี stale scope metadata

    Doctor ไม่ auto-approve pair requests หรือ auto-rotate device tokens แต่จะพิมพ์ขั้นตอนถัดไปที่แน่นอนแทน:

    - ตรวจสอบ pending requests ด้วย `openclaw devices list`
    - approve request ที่แน่นอนด้วย `openclaw devices approve <requestId>`
    - rotate token ใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
    - ลบและ re-approve stale record ด้วย `openclaw devices remove <deviceId>`

    สิ่งนี้ปิดช่องโหว่ทั่วไปแบบ "paired แล้วแต่ยังได้รับ pairing required": ตอนนี้ doctor แยก first-time pairing ออกจาก pending role/scope upgrades และจาก stale token/device-identity drift ได้แล้ว

  </Accordion>
  <Accordion title="9. คำเตือนด้านความปลอดภัย">
    Doctor แสดงคำเตือนเมื่อ provider เปิดรับ DMs โดยไม่มี allowlist หรือเมื่อ policy ถูก configure ในลักษณะที่เป็นอันตราย
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    หากรันเป็น systemd user service doctor จะทำให้แน่ใจว่าเปิดใช้ lingering เพื่อให้ gateway ยังมีชีวิตอยู่หลัง logout
  </Accordion>
  <Accordion title="11. Workspace status (skills, plugins และ legacy dirs)">
    Doctor พิมพ์สรุป state ของ workspace สำหรับ default agent:

    - **Skills status**: นับ skills ที่ eligible, missing-requirements และ allowlist-blocked
    - **Legacy workspace dirs**: เตือนเมื่อมี `~/openclaw` หรือไดเรกทอรี workspace แบบดั้งเดิมอื่นๆ อยู่ข้าง workspace ปัจจุบัน
    - **Plugin status**: นับ plugins ที่ enabled/disabled/errored; แสดง plugin IDs สำหรับ errors ใดๆ; รายงาน capabilities ของ bundle plugin
    - **Plugin compatibility warnings**: flag plugins ที่มี compatibility issues กับ runtime ปัจจุบัน
    - **Plugin diagnostics**: แสดง load-time warnings หรือ errors ใดๆ ที่ plugin registry emit

  </Accordion>
  <Accordion title="11b. ขนาด bootstrap file">
    Doctor ตรวจสอบว่า workspace bootstrap files (เช่น `AGENTS.md`, `CLAUDE.md` หรือ injected context files อื่นๆ) ใกล้หรือเกิน character budget ที่ configure ไว้หรือไม่ โดยรายงานจำนวนอักขระ raw เทียบกับ injected ต่อไฟล์, เปอร์เซ็นต์การ truncate, สาเหตุการ truncate (`max/file` หรือ `max/total`) และจำนวนอักขระ injected ทั้งหมดเป็นสัดส่วนของ budget รวม เมื่อ files ถูก truncate หรือใกล้ถึง limit doctor จะพิมพ์ tips สำหรับปรับ `agents.defaults.bootstrapMaxChars` และ `agents.defaults.bootstrapTotalMaxChars`
  </Accordion>
  <Accordion title="11d. การล้าง stale channel plugin">
    เมื่อ `openclaw doctor --fix` ลบ channel plugin ที่หายไป ก็จะลบ dangling channel-scoped config ที่อ้างถึง plugin นั้นด้วย: entries แบบ `channels.<id>`, heartbeat targets ที่ระบุชื่อ channel และ overrides แบบ `agents.*.models["<channel>/*"]` สิ่งนี้ป้องกัน Gateway boot loops ที่ channel runtime หายไปแล้วแต่ config ยังขอให้ gateway bind ไปยังมัน
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor ตรวจสอบว่ามีการติดตั้ง tab completion สำหรับ shell ปัจจุบันหรือไม่ (zsh, bash, fish หรือ PowerShell):

    - หาก shell profile ใช้ dynamic completion pattern ที่ช้า (`source <(openclaw completion ...)`) doctor จะ upgrade เป็น variant ไฟล์ cache ที่เร็วกว่า
    - หาก completion ถูก configure ใน profile แต่ cache file หายไป doctor จะ regenerate cache โดยอัตโนมัติ
    - หากไม่มีการ configure completion เลย doctor จะ prompt ให้ติดตั้ง (เฉพาะ interactive mode; ข้ามด้วย `--non-interactive`)

    รัน `openclaw completion --write-state` เพื่อ regenerate cache ด้วยตนเอง

  </Accordion>
  <Accordion title="12. การตรวจสอบ Gateway auth (local token)">
    Doctor ตรวจสอบความพร้อมของ local gateway token auth

    - หาก token mode ต้องใช้ token และไม่มี token source อยู่ doctor จะเสนอให้ generate token
    - หาก `gateway.auth.token` จัดการโดย SecretRef แต่ unavailable doctor จะเตือนและไม่ overwrite ด้วย plaintext
    - `openclaw doctor --generate-gateway-token` บังคับ generation เฉพาะเมื่อไม่มี token SecretRef ที่ configure ไว้

  </Accordion>
  <Accordion title="12b. การซ่อมแซมแบบ read-only ที่รับรู้ SecretRef">
    repair flows บางรายการจำเป็นต้องตรวจสอบ credentials ที่ configure ไว้โดยไม่ทำให้พฤติกรรม runtime fail-fast อ่อนลง

    - ตอนนี้ `openclaw doctor --fix` ใช้โมเดลสรุป SecretRef แบบอ่านอย่างเดียวเดียวกับคำสั่งตระกูลสถานะสำหรับการซ่อมแซมการกำหนดค่าแบบเจาะจง
    - ตัวอย่าง: การซ่อมแซม Telegram `allowFrom` / `groupAllowFrom` `@username` จะพยายามใช้ข้อมูลประจำตัวของบ็อตที่กำหนดค่าไว้เมื่อพร้อมใช้งาน
    - หากโทเค็นบ็อต Telegram ถูกกำหนดค่าผ่าน SecretRef แต่ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานว่าข้อมูลประจำตัวถูกกำหนดค่าแล้วแต่ไม่พร้อมใช้งาน และข้ามการแก้ไขอัตโนมัติแทนที่จะล้มเหลวหรือรายงานผิดว่าโทเค็นหายไป

  </Accordion>
  <Accordion title="13. การตรวจสุขภาพ Gateway + การรีสตาร์ต">
    doctor รันการตรวจสุขภาพและเสนอให้รีสตาร์ต Gateway เมื่อดูเหมือนว่าไม่สมบูรณ์
  </Accordion>
  <Accordion title="13b. ความพร้อมของการค้นหาหน่วยความจำ">
    doctor ตรวจสอบว่าผู้ให้บริการ embedding สำหรับการค้นหาหน่วยความจำที่กำหนดค่าไว้พร้อมสำหรับเอเจนต์เริ่มต้นหรือไม่ ลักษณะการทำงานขึ้นอยู่กับแบ็กเอนด์และผู้ให้บริการที่กำหนดค่าไว้:

    - **แบ็กเอนด์ QMD**: ตรวจสอบว่าไบนารี `qmd` พร้อมใช้งานและเริ่มทำงานได้หรือไม่ หากไม่พร้อม จะแสดงคำแนะนำการแก้ไข รวมถึงแพ็กเกจ npm และตัวเลือกพาธไบนารีแบบกำหนดเอง
    - **ผู้ให้บริการภายในเครื่องแบบระบุชัดเจน**: ตรวจสอบไฟล์โมเดลภายในเครื่องหรือ URL โมเดลระยะไกล/ดาวน์โหลดได้ที่รู้จัก หากไม่พบ จะแนะนำให้เปลี่ยนไปใช้ผู้ให้บริการระยะไกล
    - **ผู้ให้บริการระยะไกลแบบระบุชัดเจน** (`openai`, `voyage` ฯลฯ): ตรวจสอบว่ามีคีย์ API อยู่ในสภาพแวดล้อมหรือ auth store หรือไม่ แสดงคำแนะนำการแก้ไขที่นำไปทำได้หากไม่มี
    - **ผู้ให้บริการอัตโนมัติ**: ตรวจสอบความพร้อมใช้งานของโมเดลภายในเครื่องก่อน จากนั้นลองผู้ให้บริการระยะไกลแต่ละรายตามลำดับการเลือกอัตโนมัติ

    เมื่อมีผลลัพธ์การตรวจสอบ Gateway ที่แคชไว้ (Gateway สมบูรณ์ในขณะที่ตรวจสอบ) doctor จะตรวจเทียบผลลัพธ์นั้นกับการกำหนดค่าที่ CLI มองเห็นได้ และบันทึกความคลาดเคลื่อนใด ๆ doctor จะไม่เริ่ม ping embedding ใหม่ในเส้นทางเริ่มต้น ให้ใช้คำสั่งสถานะหน่วยความจำแบบละเอียดเมื่อต้องการตรวจสอบผู้ให้บริการแบบสด

    ใช้ `openclaw memory status --deep` เพื่อตรวจสอบความพร้อมของ embedding ขณะรันไทม์

  </Accordion>
  <Accordion title="14. คำเตือนสถานะช่องทาง">
    หาก Gateway สมบูรณ์ doctor จะรันการตรวจสอบสถานะช่องทางและรายงานคำเตือนพร้อมการแก้ไขที่แนะนำ
  </Accordion>
  <Accordion title="15. การตรวจสอบ + ซ่อมแซมการกำหนดค่า supervisor">
    doctor ตรวจสอบการกำหนดค่า supervisor ที่ติดตั้งไว้ (launchd/systemd/schtasks) เพื่อหาค่าเริ่มต้นที่หายไปหรือล้าสมัย (เช่น การพึ่งพา network-online ของ systemd และระยะหน่วงการรีสตาร์ต) เมื่อพบว่าไม่ตรงกัน จะแนะนำการอัปเดตและสามารถเขียนไฟล์บริการ/งานใหม่ให้เป็นค่าเริ่มต้นปัจจุบันได้

    หมายเหตุ:

    - `openclaw doctor` จะแจ้งเตือนก่อนเขียนการกำหนดค่า supervisor ใหม่
    - `openclaw doctor --yes` ยอมรับพรอมป์การซ่อมแซมเริ่มต้น
    - `openclaw doctor --repair` ใช้การแก้ไขที่แนะนำโดยไม่ต้องมีพรอมป์
    - `openclaw doctor --repair --force` เขียนทับการกำหนดค่า supervisor แบบกำหนดเอง
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` ทำให้ doctor เป็นแบบอ่านอย่างเดียวสำหรับวงจรชีวิตบริการ Gateway โดยยังคงรายงานสุขภาพบริการและรันการซ่อมแซมที่ไม่ใช่บริการ แต่ข้ามการติดตั้ง/เริ่ม/รีสตาร์ต/bootstrap บริการ การเขียนการกำหนดค่า supervisor ใหม่ และการล้างบริการเดิม เพราะ supervisor ภายนอกเป็นเจ้าของวงจรชีวิตนั้น
    - บน Linux doctor จะไม่เขียนข้อมูลเมตาคำสั่ง/จุดเริ่มต้นใหม่ขณะที่ยูนิต systemd Gateway ที่ตรงกันกำลังทำงานอยู่ และจะละเว้นยูนิตเพิ่มเติมที่คล้าย Gateway ซึ่งไม่ใช่ legacy และไม่ทำงานอยู่ระหว่างการสแกนบริการซ้ำ เพื่อไม่ให้ไฟล์บริการคู่ขนานสร้างสัญญาณรบกวนการล้างข้อมูล
    - หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็นและ `gateway.auth.token` จัดการโดย SecretRef การติดตั้ง/ซ่อมแซมบริการของ doctor จะตรวจสอบ SecretRef แต่จะไม่บันทึกค่าโทเค็นข้อความล้วนที่ resolve แล้วลงในข้อมูลเมตาสภาพแวดล้อมบริการของ supervisor
    - doctor ตรวจพบค่าสภาพแวดล้อมบริการที่จัดการด้วย `.env`/SecretRef ซึ่งการติดตั้ง LaunchAgent, systemd หรือ Windows Scheduled Task รุ่นเก่าฝังไว้แบบ inline และเขียนข้อมูลเมตาบริการใหม่เพื่อให้ค่าเหล่านั้นโหลดจากแหล่งรันไทม์แทนคำจำกัดความของ supervisor
    - doctor ตรวจพบเมื่อคำสั่งบริการยังคงตรึง `--port` เก่าไว้หลังจาก `gateway.port` เปลี่ยน และเขียนข้อมูลเมตาบริการใหม่ให้เป็นพอร์ตปัจจุบัน
    - หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็นและ SecretRef ของโทเค็นที่กำหนดค่าไว้ยังไม่ถูก resolve doctor จะบล็อกเส้นทางติดตั้ง/ซ่อมแซมพร้อมคำแนะนำที่นำไปทำได้
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้งค่าโหมดอย่างชัดเจน
    - สำหรับยูนิต user-systemd บน Linux ตอนนี้การตรวจสอบ token drift ของ doctor รวมทั้งแหล่ง `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบข้อมูลเมตาการยืนยันตัวตนของบริการ
    - การซ่อมแซมบริการของ doctor จะปฏิเสธการเขียนใหม่ หยุด หรือรีสตาร์ตบริการ Gateway จากไบนารี OpenClaw รุ่นเก่าเมื่อการกำหนดค่าถูกเขียนครั้งล่าสุดโดยเวอร์ชันที่ใหม่กว่า ดู [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)
    - คุณสามารถบังคับให้เขียนใหม่ทั้งหมดได้เสมอผ่าน `openclaw gateway install --force`

  </Accordion>
  <Accordion title="16. การวินิจฉัยรันไทม์ + พอร์ตของ Gateway">
    doctor ตรวจสอบรันไทม์ของบริการ (PID, สถานะการออกล่าสุด) และเตือนเมื่อบริการติดตั้งแล้วแต่ไม่ได้ทำงานจริง นอกจากนี้ยังตรวจสอบการชนกันของพอร์ตบนพอร์ต Gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (Gateway กำลังทำงานอยู่แล้ว, อุโมงค์ SSH)
  </Accordion>
  <Accordion title="17. แนวทางปฏิบัติที่ดีสำหรับรันไทม์ Gateway">
    doctor เตือนเมื่อบริการ Gateway ทำงานบน Bun หรือพาธ Node ที่จัดการด้วยเวอร์ชัน (`nvm`, `fnm`, `volta`, `asdf` ฯลฯ) ช่องทาง WhatsApp + Telegram ต้องใช้ Node และพาธของตัวจัดการเวอร์ชันอาจเสียหลังอัปเกรดเพราะบริการไม่โหลด shell init ของคุณ doctor เสนอให้ย้ายไปใช้การติดตั้ง Node ของระบบเมื่อพร้อมใช้งาน (Homebrew/apt/choco)

    LaunchAgents ของ macOS ที่ติดตั้งหรือซ่อมแซมใหม่จะใช้ PATH ระบบแบบมาตรฐาน (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) แทนการคัดลอก PATH ของเชลล์แบบโต้ตอบ ดังนั้น Volta, asdf, fnm, pnpm และไดเรกทอรีตัวจัดการเวอร์ชันอื่น ๆ จะไม่เปลี่ยนว่าโปรเซสลูกของ Node ใดถูก resolve บริการ Linux ยังคงเก็บรากสภาพแวดล้อมที่ระบุชัดเจน (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) และไดเรกทอรี user-bin ที่เสถียร แต่ไดเรกทอรีสำรองของตัวจัดการเวอร์ชันที่เดาจะถูกเขียนลงใน PATH ของบริการเฉพาะเมื่อไดเรกทอรีเหล่านั้นมีอยู่บนดิสก์เท่านั้น

  </Accordion>
  <Accordion title="18. การเขียนการกำหนดค่า + ข้อมูลเมตา wizard">
    doctor บันทึกการเปลี่ยนแปลงการกำหนดค่าใด ๆ และประทับข้อมูลเมตา wizard เพื่อบันทึกการรัน doctor
  </Accordion>
  <Accordion title="19. เคล็ดลับเวิร์กสเปซ (การสำรองข้อมูล + ระบบหน่วยความจำ)">
    doctor แนะนำระบบหน่วยความจำของเวิร์กสเปซเมื่อยังไม่มี และแสดงเคล็ดลับการสำรองข้อมูลหากเวิร์กสเปซยังไม่ได้อยู่ภายใต้ git

    ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคู่มือฉบับเต็มเกี่ยวกับโครงสร้างเวิร์กสเปซและการสำรองข้อมูลด้วย git (แนะนำ GitHub หรือ GitLab แบบส่วนตัว)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
