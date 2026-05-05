---
read_when:
    - การเพิ่มหรือแก้ไขการย้ายข้อมูลของ doctor
    - การเริ่มนำการเปลี่ยนแปลงการกำหนดค่าที่เข้ากันไม่ได้แบบย้อนหลังมาใช้
sidebarTitle: Doctor
summary: 'คำสั่ง Doctor: การตรวจสอบสุขภาพ การไมเกรตการกำหนดค่า และขั้นตอนการซ่อมแซม'
title: ตัวตรวจสุขภาพ
x-i18n:
    generated_at: "2026-05-05T08:25:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360f9f7a349e4633ff61d526f1eb5b668b595b4f35c5e0fd2a314715a0599c4c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` คือเครื่องมือซ่อมแซม + การย้ายข้อมูลสำหรับ OpenClaw โดยจะแก้ไข config/state ที่ล้าสมัย ตรวจสอบสุขภาพ และให้ขั้นตอนการซ่อมแซมที่นำไปทำต่อได้

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw doctor
```

### โหมด Headless และอัตโนมัติ

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    ยอมรับค่าเริ่มต้นโดยไม่ถาม (รวมถึงขั้นตอนการซ่อมแซม restart/service/sandbox เมื่อใช้ได้)

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    ใช้การซ่อมแซมที่แนะนำโดยไม่ถาม (การซ่อมแซม + การรีสตาร์ตเมื่อปลอดภัย)

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    ใช้การซ่อมแซมแบบเข้มข้นด้วย (เขียนทับ config ของ supervisor แบบกำหนดเอง)

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    รันโดยไม่มี prompt และใช้เฉพาะการย้ายข้อมูลที่ปลอดภัย (การปรับ config ให้อยู่ในรูปแบบมาตรฐาน + การย้าย state บนดิสก์) ข้ามการทำงาน restart/service/sandbox ที่ต้องมีการยืนยันจากมนุษย์ การย้าย state รุ่นเก่าจะรันโดยอัตโนมัติเมื่อตรวจพบ

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    สแกน service ของระบบเพื่อหา gateway installs เพิ่มเติม (launchd/systemd/schtasks)

  </Tab>
</Tabs>

หากคุณต้องการตรวจทานการเปลี่ยนแปลงก่อนเขียน ให้เปิดไฟล์ config ก่อน:

```bash
cat ~/.openclaw/openclaw.json
```

## สิ่งที่เครื่องมือนี้ทำ (สรุป)

<AccordionGroup>
  <Accordion title="สุขภาพ, UI, และอัปเดต">
    - การอัปเดตก่อนรันแบบไม่บังคับสำหรับการติดตั้งผ่าน git (แบบ interactive เท่านั้น)
    - การตรวจสอบความสดใหม่ของโปรโตคอล UI (สร้าง Control UI ใหม่เมื่อ protocol schema ใหม่กว่า)
    - การตรวจสอบสุขภาพ + prompt ให้รีสตาร์ต
    - สรุปสถานะ Skills (eligible/missing/blocked) และสถานะ Plugin

  </Accordion>
  <Accordion title="Config และการย้ายข้อมูล">
    - การปรับ config รุ่นเก่าให้อยู่ในรูปแบบมาตรฐาน
    - การย้าย config ของ Talk จากฟิลด์แบนรุ่นเก่า `talk.*` ไปเป็น `talk.provider` + `talk.providers.<provider>`
    - การตรวจสอบการย้าย Browser สำหรับ config ของ Chrome extension รุ่นเก่าและความพร้อมของ Chrome MCP
    - คำเตือน OpenCode provider override (`models.providers.opencode` / `models.providers.opencode-go`)
    - คำเตือน Codex OAuth shadowing (`models.providers.openai-codex`)
    - การตรวจสอบข้อกำหนดเบื้องต้นของ OAuth TLS สำหรับโปรไฟล์ OpenAI Codex OAuth
    - คำเตือน allowlist ของ Plugin/เครื่องมือ เมื่อ `plugins.allow` มีข้อจำกัดแต่ tool policy ยังขอ wildcard หรือเครื่องมือที่ Plugin เป็นเจ้าของ
    - การย้าย state รุ่นเก่าบนดิสก์ (sessions/agent dir/WhatsApp auth)
    - การย้าย key ของสัญญา plugin manifest รุ่นเก่า (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
    - การย้าย store ของ Cron รุ่นเก่า (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบนสุด, payload `provider`, งาน fallback ของ webhook แบบง่าย `notify: true`)
    - การย้าย agent runtime-policy รุ่นเก่าไปยัง `agents.defaults.agentRuntime` และ `agents.list[].agentRuntime`
    - การล้าง config ของ Plugin ที่ล้าสมัยเมื่อเปิดใช้ plugins; เมื่อ `plugins.enabled=false` การอ้างอิง Plugin ที่ล้าสมัยจะถือเป็น config containment ที่ไม่ทำงานและจะถูกเก็บไว้

  </Accordion>
  <Accordion title="State และความถูกต้องครบถ้วน">
    - การตรวจสอบไฟล์ล็อก session และการล้างล็อกที่ล้าสมัย
    - การซ่อมแซม transcript ของ session สำหรับกิ่ง prompt-rewrite ที่ซ้ำกัน ซึ่งสร้างโดย build ของวันที่ 2026.4.24 ที่ได้รับผลกระทบ
    - การตรวจจับ tombstone สำหรับการกู้คืนด้วยการรีสตาร์ต subagent ที่ค้าง พร้อมรองรับ `--fix` สำหรับล้าง flag การกู้คืนที่ถูกยกเลิกและล้าสมัย เพื่อไม่ให้ startup ยังคงถือว่า child ถูกยกเลิกการรีสตาร์ต
    - การตรวจสอบความถูกต้องครบถ้วนของ state และ permission (sessions, transcripts, state dir)
    - การตรวจสอบ permission ของไฟล์ config (chmod 600) เมื่อรันในเครื่อง
    - สุขภาพของ model auth: ตรวจสอบ OAuth expiry, สามารถ refresh token ที่ใกล้หมดอายุ, และรายงานสถานะ cooldown/disabled ของ auth-profile
    - การตรวจจับ workspace dir เพิ่มเติม (`~/openclaw`)

  </Accordion>
  <Accordion title="Gateway, service, และ supervisor">
    - การซ่อมแซม sandbox image เมื่อเปิดใช้ sandboxing
    - การย้าย service รุ่นเก่าและการตรวจจับ gateway เพิ่มเติม
    - การย้าย state รุ่นเก่าของช่องทาง Matrix (ในโหมด `--fix` / `--repair`)
    - การตรวจสอบ runtime ของ Gateway (ติดตั้ง service แล้วแต่ไม่ทำงาน; label ของ launchd ที่ cache ไว้)
    - คำเตือนสถานะช่องทาง (probe จาก gateway ที่กำลังรันอยู่)
    - การตรวจสอบการตอบสนองของ WhatsApp สำหรับสุขภาพ event-loop ของ Gateway ที่เสื่อมลงโดยยังมี local TUI clients ทำงานอยู่; `--fix` จะหยุดเฉพาะ local TUI clients ที่ตรวจยืนยันแล้วเท่านั้น
    - การ audit config ของ supervisor (launchd/systemd/schtasks) พร้อมการซ่อมแซมแบบไม่บังคับ
    - การล้าง environment ของ embedded proxy สำหรับ gateway services ที่จับค่า shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` ไว้ระหว่างการติดตั้งหรืออัปเดต
    - การตรวจสอบแนวทางปฏิบัติที่ดีสำหรับ runtime ของ Gateway (Node เทียบกับ Bun, path ของ version-manager)
    - การวินิจฉัย port collision ของ Gateway (ค่าเริ่มต้น `18789`)

  </Accordion>
  <Accordion title="Auth, ความปลอดภัย, และการจับคู่">
    - คำเตือนด้านความปลอดภัยสำหรับนโยบาย DM แบบเปิด
    - การตรวจสอบ auth ของ Gateway สำหรับโหมด local token (เสนอให้สร้าง token เมื่อไม่มี token source; ไม่เขียนทับ config ของ token SecretRef)
    - การตรวจจับปัญหาการจับคู่อุปกรณ์ (คำขอ pair ครั้งแรกที่ค้างอยู่, การอัปเกรด role/scope ที่ค้างอยู่, cache ของ local device-token ที่ล้าสมัยและ drift, และ auth drift ของ paired-record)

  </Accordion>
  <Accordion title="Workspace และ shell">
    - การตรวจสอบ systemd linger บน Linux
    - การตรวจสอบขนาดไฟล์ bootstrap ของ workspace (คำเตือนการตัดทอน/ใกล้ถึงขีดจำกัดสำหรับไฟล์ context)
    - การตรวจสอบความพร้อมของ Skills สำหรับ agent เริ่มต้น; รายงาน skills ที่อนุญาตแต่ขาด bins, env, config, หรือข้อกำหนดของ OS และ `--fix` สามารถปิดใช้งาน skills ที่ไม่พร้อมใน `skills.entries`
    - การตรวจสอบสถานะ shell completion และ auto-install/upgrade
    - การตรวจสอบความพร้อมของ memory search embedding provider (local model, remote API key, หรือ QMD binary)
    - การตรวจสอบ source install (pnpm workspace mismatch, ไม่มี UI assets, ไม่มี tsx binary)
    - เขียน config + wizard metadata ที่อัปเดตแล้ว

  </Accordion>
</AccordionGroup>

## การ backfill และ reset ของ Dreams UI

ฉาก Dreams ใน Control UI มี action **Backfill**, **Reset**, และ **Clear Grounded** สำหรับ workflow ของ grounded dreaming action เหล่านี้ใช้เมธอด RPC แบบ gateway doctor-style แต่ **ไม่ใช่** ส่วนหนึ่งของการซ่อมแซม/ย้ายข้อมูลของ `openclaw doctor` CLI

สิ่งที่ action เหล่านี้ทำ:

- **Backfill** สแกนไฟล์ `memory/YYYY-MM-DD.md` ย้อนหลังใน workspace ที่ active รัน grounded REM diary pass และเขียนรายการ backfill ที่ย้อนกลับได้ลงใน `DREAMS.md`
- **Reset** ลบเฉพาะรายการ backfill diary ที่ถูกทำเครื่องหมายไว้เหล่านั้นออกจาก `DREAMS.md`
- **Clear Grounded** ลบเฉพาะรายการ short-term แบบ grounded-only ที่ staged ไว้ ซึ่งมาจาก historical replay และยังไม่ได้สะสม live recall หรือ daily support

สิ่งที่ action เหล่านี้ **ไม่ได้** ทำด้วยตัวเอง:

- ไม่แก้ไข `MEMORY.md`
- ไม่รันการย้ายข้อมูล doctor แบบเต็ม
- ไม่ stage grounded candidates ไปยัง live short-term promotion store โดยอัตโนมัติ เว้นแต่คุณจะรันเส้นทาง staged CLI ก่อนอย่างชัดเจน

หากคุณต้องการให้ grounded historical replay มีผลต่อ deep promotion lane ตามปกติ ให้ใช้ flow ของ CLI แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

คำสั่งนั้นจะ stage grounded durable candidates ไปยัง short-term dreaming store ขณะที่ยังคงใช้ `DREAMS.md` เป็นพื้นที่ตรวจทาน

## พฤติกรรมโดยละเอียดและเหตุผล

<AccordionGroup>
  <Accordion title="0. การอัปเดตแบบไม่บังคับ (git installs)">
    หากนี่เป็น git checkout และ doctor กำลังรันแบบ interactive เครื่องมือจะเสนอให้อัปเดต (fetch/rebase/build) ก่อนรัน doctor
  </Accordion>
  <Accordion title="1. การปรับ config ให้อยู่ในรูปแบบมาตรฐาน">
    หาก config มีรูปทรงค่ารุ่นเก่า (เช่น `messages.ackReaction` โดยไม่มี override เฉพาะช่องทาง) doctor จะปรับให้อยู่ใน schema ปัจจุบัน

    รวมถึงฟิลด์แบนของ Talk รุ่นเก่า config สาธารณะของ Talk ปัจจุบันคือ `talk.provider` + `talk.providers.<provider>` Doctor จะเขียนรูปทรง `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` เก่าใหม่ให้เป็น provider map

    Doctor ยังเตือนเมื่อ `plugins.allow` ไม่ว่างและ tool policy ใช้
    wildcard หรือรายการเครื่องมือที่ Plugin เป็นเจ้าของ `tools.allow: ["*"]` จะตรงกับเฉพาะเครื่องมือ
    จาก plugins ที่โหลดจริงเท่านั้น; ไม่ได้ข้าม allowlist ของ Plugin แบบ exclusive
    Doctor เขียน `plugins.bundledDiscovery: "compat"` สำหรับ config ของ allowlist
    รุ่นเก่าที่ถูกย้าย เพื่อรักษาพฤติกรรม bundled provider ที่มีอยู่ และ
    จากนั้นชี้ไปยังการตั้งค่า `"allowlist"` ที่เข้มงวดกว่า

  </Accordion>
  <Accordion title="2. การย้าย key ของ config รุ่นเก่า">
    เมื่อ config มี key ที่เลิกใช้แล้ว คำสั่งอื่นจะปฏิเสธการรันและขอให้คุณรัน `openclaw doctor`

    Doctor จะ:

    - อธิบายว่าพบ key รุ่นเก่าใด
    - แสดงการย้ายข้อมูลที่นำไปใช้
    - เขียน `~/.openclaw/openclaw.json` ใหม่ด้วย schema ที่อัปเดตแล้ว

    Gateway ยังรันการย้ายข้อมูลของ doctor โดยอัตโนมัติเมื่อ startup หากตรวจพบรูปแบบ config รุ่นเก่า ดังนั้น config ที่ล้าสมัยจะถูกซ่อมแซมโดยไม่ต้องดำเนินการด้วยตนเอง การย้าย store ของ Cron job จัดการโดย `openclaw doctor --fix`

    การย้ายข้อมูลปัจจุบัน:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - การกำหนดค่าช่องที่กำหนดค่าไว้แต่ไม่มีนโยบายการตอบกลับที่มองเห็นได้ → `messages.groupChat.visibleReplies: "message_tool"`
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
    - สำหรับช่องที่มี `accounts` แบบตั้งชื่อ แต่ยังมีค่าช่องระดับบนสุดแบบบัญชีเดียวที่ค้างอยู่ ให้ย้ายค่าที่มีขอบเขตระดับบัญชีเหล่านั้นเข้าไปในบัญชีที่เลื่อนระดับซึ่งเลือกไว้สำหรับช่องนั้น (`accounts.default` สำหรับช่องส่วนใหญ่; Matrix สามารถคงเป้าหมายแบบตั้งชื่อ/ค่าเริ่มต้นเดิมที่ตรงกันไว้ได้)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - ลบ `agents.defaults.llm`; ใช้ `models.providers.<id>.timeoutSeconds` สำหรับระยะหมดเวลาของผู้ให้บริการ/โมเดลที่ช้า
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - ลบ `browser.relayBindHost` (การตั้งค่ารีเลย์ส่วนขยายแบบเดิม)
    - `models.providers.*.api: "openai"` แบบเดิม → `"openai-completions"` (การเริ่มต้น Gateway ยังข้ามผู้ให้บริการที่ตั้งค่า `api` เป็นค่า enum ในอนาคตหรือที่ไม่รู้จัก แทนที่จะปิดแบบล้มเหลว)

    คำเตือนของ Doctor ยังรวมคำแนะนำบัญชีเริ่มต้นสำหรับช่องแบบหลายบัญชีด้วย:

    - หากกำหนดค่ารายการ `channels.<channel>.accounts` ตั้งแต่สองรายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default` Doctor จะเตือนว่าการกำหนดเส้นทางสำรองอาจเลือกบัญชีที่ไม่คาดคิด
    - หากตั้งค่า `channels.<channel>.defaultAccount` เป็น ID บัญชีที่ไม่รู้จัก Doctor จะเตือนและแสดงรายการ ID บัญชีที่กำหนดค่าไว้

  </Accordion>
  <Accordion title="2b. การแทนที่ผู้ให้บริการ OpenCode">
    หากคุณเพิ่ม `models.providers.opencode`, `opencode-zen` หรือ `opencode-go` ด้วยตนเอง สิ่งนี้จะแทนที่แค็ตตาล็อก OpenCode ในตัวจาก `@mariozechner/pi-ai` ซึ่งอาจบังคับให้โมเดลไปอยู่บน API ที่ผิด หรือทำให้ต้นทุนกลายเป็นศูนย์ Doctor จะเตือนเพื่อให้คุณลบการแทนที่และคืนค่าการกำหนดเส้นทาง API + ต้นทุนแยกตามโมเดล
  </Accordion>
  <Accordion title="2c. การย้ายเบราว์เซอร์และความพร้อมของ Chrome MCP">
    หากการกำหนดค่าเบราว์เซอร์ของคุณยังชี้ไปยังพาธส่วนขยาย Chrome ที่ถูกลบแล้ว Doctor จะทำให้เป็นรูปแบบปกติไปยังโมเดลแนบ Chrome MCP แบบโฮสต์โลคัลปัจจุบัน:

    - `browser.profiles.*.driver: "extension"` จะกลายเป็น `"existing-session"`
    - `browser.relayBindHost` จะถูกลบ

    Doctor ยังตรวจสอบพาธ Chrome MCP แบบโฮสต์โลคัลเมื่อคุณใช้ `defaultProfile: "user"` หรือโปรไฟล์ `existing-session` ที่กำหนดค่าไว้:

    - ตรวจสอบว่าติดตั้ง Google Chrome บนโฮสต์เดียวกันสำหรับโปรไฟล์เชื่อมต่ออัตโนมัติเริ่มต้นหรือไม่
    - ตรวจสอบเวอร์ชัน Chrome ที่ตรวจพบ และเตือนเมื่อเวอร์ชันต่ำกว่า Chrome 144
    - เตือนให้คุณเปิดใช้การดีบักระยะไกลในหน้า inspect ของเบราว์เซอร์ (เช่น `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` หรือ `edge://inspect/#remote-debugging`)

    Doctor ไม่สามารถเปิดใช้การตั้งค่าฝั่ง Chrome ให้คุณได้ Chrome MCP แบบโฮสต์โลคัลยังต้องมี:

    - เบราว์เซอร์ที่ใช้ Chromium 144+ บนโฮสต์ gateway/node
    - เบราว์เซอร์ที่ทำงานอยู่ในเครื่อง
    - เปิดใช้การดีบักระยะไกลในเบราว์เซอร์นั้น
    - อนุมัติพรอมป์ยินยอมการแนบครั้งแรกในเบราว์เซอร์

    ความพร้อมในที่นี้เกี่ยวข้องเฉพาะข้อกำหนดเบื้องต้นของการแนบภายในเครื่องเท่านั้น Existing-session ยังคงข้อจำกัดเส้นทาง Chrome MCP ปัจจุบันไว้; เส้นทางขั้นสูง เช่น `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และการกระทำแบบชุด ยังคงต้องใช้เบราว์เซอร์ที่จัดการหรือโปรไฟล์ CDP ดิบ

    การตรวจสอบนี้ **ไม่** ใช้กับ Docker, sandbox, remote-browser หรือโฟลว์ headless อื่น ๆ สิ่งเหล่านั้นยังคงใช้ CDP ดิบต่อไป

  </Accordion>
  <Accordion title="2d. ข้อกำหนดเบื้องต้น OAuth TLS">
    เมื่อกำหนดค่าโปรไฟล์ OpenAI Codex OAuth แล้ว Doctor จะตรวจปลายทางการอนุญาตของ OpenAI เพื่อยืนยันว่าสแต็ก TLS ของ Node/OpenSSL ในเครื่องสามารถตรวจสอบ chain ใบรับรองได้ หากการตรวจล้มเหลวด้วยข้อผิดพลาดใบรับรอง (เช่น `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ใบรับรองหมดอายุ หรือใบรับรอง self-signed) Doctor จะแสดงคำแนะนำการแก้ไขเฉพาะแพลตฟอร์ม บน macOS ที่ใช้ Homebrew Node การแก้มักเป็น `brew postinstall ca-certificates` เมื่อใช้ `--deep` การตรวจจะทำงานแม้ว่า Gateway จะปกติดี
  </Accordion>
  <Accordion title="2e. การแทนที่ผู้ให้บริการ Codex OAuth">
    หากก่อนหน้านี้คุณเพิ่มการตั้งค่าการขนส่ง OpenAI แบบเดิมไว้ใต้ `models.providers.openai-codex` การตั้งค่าเหล่านั้นอาจบดบังพาธผู้ให้บริการ Codex OAuth ในตัวที่รีลีสใหม่กว่าใช้โดยอัตโนมัติ Doctor จะเตือนเมื่อพบการตั้งค่าการขนส่งเก่าเหล่านั้นพร้อมกับ Codex OAuth เพื่อให้คุณลบหรือเขียนการแทนที่การขนส่งที่ล้าสมัยใหม่ และนำพฤติกรรมการกำหนดเส้นทาง/การสำรองในตัวกลับมา พร็อกซีแบบกำหนดเองและการแทนที่เฉพาะส่วนหัวเท่านั้นยังรองรับอยู่และจะไม่ทำให้เกิดคำเตือนนี้
  </Accordion>
  <Accordion title="2f. คำเตือนเส้นทาง Plugin Codex">
    เมื่อเปิดใช้ Plugin Codex ที่รวมมา Doctor จะตรวจด้วยว่า refs โมเดลหลัก `openai-codex/*` ยัง resolve ผ่าน runner PI เริ่มต้นหรือไม่ ชุดค่านี้ถูกต้องเมื่อคุณต้องการการยืนยันตัวตน Codex OAuth/การสมัครสมาชิกผ่าน PI แต่สับสนได้ง่ายกับฮาร์เนส app-server ของ Codex แบบ native Doctor จะเตือนและชี้ไปยังรูปแบบ app-server ที่ชัดเจน: `openai/*` พร้อม `agentRuntime.id: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor จะไม่ซ่อมแซมสิ่งนี้โดยอัตโนมัติ เพราะทั้งสองเส้นทางถูกต้อง:

    - `openai-codex/*` + PI หมายถึง "ใช้การยืนยันตัวตนผ่าน Codex OAuth/การสมัครสมาชิกผ่านตัวรัน OpenClaw ปกติ"
    - `openai/*` + `agentRuntime.id: "codex"` หมายถึง "รันเทิร์นที่ฝังไว้ผ่านเซิร์ฟเวอร์แอป Codex แบบเนทีฟ"
    - `/codex ...` หมายถึง "ควบคุมหรือผูกการสนทนา Codex แบบเนทีฟจากแชต"
    - `/acp ...` หรือ `runtime: "acp"` หมายถึง "ใช้อะแดปเตอร์ ACP/acpx ภายนอก"

    หากคำเตือนปรากฏ ให้เลือกเส้นทางที่คุณตั้งใจใช้และแก้ไขการกำหนดค่าด้วยตนเอง คงคำเตือนไว้ตามเดิมเมื่อ PI Codex OAuth เป็นสิ่งที่ตั้งใจไว้

  </Accordion>
  <Accordion title="2g. การล้างเส้นทางเซสชัน">
    Doctor ยังสแกนที่เก็บเซสชันที่ใช้งานอยู่เพื่อหาสถานะเส้นทางที่สร้างอัตโนมัติซึ่งค้างอยู่ หลังจากคุณย้ายโมเดลหรือรันไทม์เริ่มต้น/สำรองที่กำหนดค่าไว้ออกจากเส้นทางที่ Plugin เป็นเจ้าของ เช่น Codex

    `openclaw doctor --fix` สามารถล้างสถานะค้างที่สร้างอัตโนมัติได้ เช่น การปักหมุดโมเดล `modelOverrideSource: "auto"`, เมตาดาต้าโมเดลรันไทม์, id ของ harness ที่ปักหมุดไว้, การผูกเซสชัน CLI และการ override โปรไฟล์การยืนยันตัวตนอัตโนมัติ เมื่อเส้นทางที่เป็นเจ้าของสิ่งเหล่านั้นไม่ได้ถูกกำหนดค่าอีกต่อไป ตัวเลือกโมเดลของผู้ใช้ที่ระบุไว้อย่างชัดเจนหรือของเซสชันเดิมจะถูกรายงานเพื่อให้ตรวจสอบด้วยตนเองและปล่อยไว้โดยไม่แตะต้อง; เปลี่ยนตัวเลือกเหล่านั้นด้วย `/model ...`, `/new` หรือรีเซ็ตเซสชันเมื่อไม่ต้องการใช้เส้นทางนั้นอีกต่อไป

  </Accordion>
  <Accordion title="3. การย้ายสถานะเดิม (เลย์เอาต์บนดิสก์)">
    Doctor สามารถย้ายเลย์เอาต์บนดิสก์แบบเก่าเข้าสู่โครงสร้างปัจจุบันได้:

    - ที่จัดเก็บเซสชัน + บันทึกบทสนทนา:
      - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
    - ไดเรกทอรีเอเจนต์:
      - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
    - สถานะการยืนยันตัวตน WhatsApp (Baileys):
      - จากแบบเดิม `~/.openclaw/credentials/*.json` (ยกเว้น `oauth.json`)
      - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (รหัสบัญชีเริ่มต้น: `default`)

    การย้ายข้อมูลเหล่านี้ดำเนินการแบบพยายามให้ดีที่สุดและทำซ้ำได้อย่างปลอดภัย; doctor จะแสดงคำเตือนเมื่อปล่อยให้มีโฟลเดอร์แบบเดิมเหลืออยู่เป็นข้อมูลสำรอง Gateway/CLI ยังย้ายเซสชันแบบเดิม + ไดเรกทอรีเอเจนต์โดยอัตโนมัติเมื่อเริ่มทำงาน เพื่อให้ประวัติ/การยืนยันตัวตน/โมเดลไปอยู่ในพาธแยกตามเอเจนต์โดยไม่ต้องรัน doctor ด้วยตนเอง การยืนยันตัวตน WhatsApp ตั้งใจให้ย้ายผ่าน `openclaw doctor` เท่านั้น การทำให้ผู้ให้บริการสนทนา/แผนที่ผู้ให้บริการเป็นมาตรฐานตอนนี้เปรียบเทียบด้วยความเท่ากันเชิงโครงสร้าง ดังนั้น diff ที่ต่างกันเฉพาะลำดับคีย์จะไม่ทำให้เกิดการเปลี่ยนแปลง `doctor --fix` แบบ no-op ซ้ำอีกต่อไป

  </Accordion>
  <Accordion title="3a. การย้าย manifest ของ Plugin แบบเดิม">
    Doctor สแกน manifest ของ Plugin ที่ติดตั้งทั้งหมดเพื่อหาคีย์ความสามารถระดับบนสุดที่เลิกใช้แล้ว (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) เมื่อพบ จะเสนอให้ย้ายคีย์เหล่านั้นเข้าไปในอ็อบเจกต์ `contracts` และเขียนไฟล์ manifest ใหม่แบบแก้ไขไฟล์เดิมโดยตรง การย้ายข้อมูลนี้ทำซ้ำได้อย่างปลอดภัย; หากคีย์ `contracts` มีค่าเดียวกันอยู่แล้ว คีย์แบบเดิมจะถูกลบออกโดยไม่ทำซ้ำข้อมูล
  </Accordion>
  <Accordion title="3b. การย้ายที่จัดเก็บ cron แบบเดิม">
    Doctor ยังตรวจสอบที่จัดเก็บงาน cron (`~/.openclaw/cron/jobs.json` โดยค่าเริ่มต้น หรือ `cron.store` เมื่อถูก override) เพื่อหารูปแบบงานเก่าที่ตัวจัดตารางเวลายังคงยอมรับเพื่อความเข้ากันได้

    การล้างข้อมูล Cron ปัจจุบันประกอบด้วย:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - ฟิลด์เพย์โหลดระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
    - ฟิลด์การส่งระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - นามแฝงการส่ง `provider` ของเพย์โหลด → `delivery.channel` แบบชัดเจน
    - งาน fallback ของ Webhook แบบดั้งเดิมอย่างง่ายที่เป็น `notify: true` → `delivery.mode="webhook"` แบบชัดเจน พร้อม `delivery.to=cron.webhook`

    Doctor จะย้ายข้อมูลงาน `notify: true` โดยอัตโนมัติเฉพาะเมื่อสามารถทำได้โดยไม่เปลี่ยนพฤติกรรม หากงานรวม fallback การแจ้งเตือนแบบดั้งเดิมกับโหมดการส่งที่ไม่ใช่ Webhook ที่มีอยู่ Doctor จะเตือนและปล่อยให้งานนั้นรอการตรวจสอบด้วยตนเอง

    บน Linux doctor ยังเตือนเมื่อ crontab ของผู้ใช้ยังเรียกใช้ `~/.openclaw/bin/ensure-whatsapp.sh` แบบเก่าอยู่ สคริปต์เฉพาะโฮสต์นี้ไม่ได้รับการดูแลโดย OpenClaw ปัจจุบัน และอาจเขียนข้อความ `Gateway inactive` ที่ผิดพลาดลงใน `~/.openclaw/logs/whatsapp-health.log` เมื่อ cron ไม่สามารถเข้าถึง systemd user bus ได้ ลบรายการ crontab ที่ค้างอยู่ออกด้วย `crontab -e`; ใช้ `openclaw channels status --probe`, `openclaw doctor` และ `openclaw gateway status` สำหรับการตรวจสุขภาพปัจจุบัน

  </Accordion>
  <Accordion title="3c. การล้าง session lock">
    Doctor จะสแกนไดเรกทอรี session ของ agent ทุกตัวเพื่อหาไฟล์ write-lock ที่ค้างอยู่ ซึ่งเป็นไฟล์ที่หลงเหลือเมื่อ session ออกแบบผิดปกติ สำหรับไฟล์ lock แต่ละไฟล์ที่พบ จะรายงาน: พาธ, PID, ว่า PID ยังมีชีวิตอยู่หรือไม่, อายุของ lock และถือว่าค้างหรือไม่ (PID ตายแล้วหรือเก่ากว่า 30 นาที) ในโหมด `--fix` / `--repair` จะลบไฟล์ lock ที่ค้างโดยอัตโนมัติ; มิฉะนั้นจะพิมพ์หมายเหตุและบอกให้คุณรันซ้ำด้วย `--fix`
  </Accordion>
  <Accordion title="3d. การซ่อมแซม branch ของ transcript ใน session">
    Doctor จะสแกนไฟล์ JSONL ของ session agent เพื่อหารูปทรง branch ที่ซ้ำกันซึ่งเกิดจากบั๊กการเขียน prompt transcript ใหม่ของ 2026.4.24: user turn ที่ถูกทิ้งพร้อมบริบทรันไทม์ภายในของ OpenClaw และ sibling ที่ยังทำงานอยู่ซึ่งมี prompt ของผู้ใช้ที่มองเห็นได้เหมือนกัน ในโหมด `--fix` / `--repair` doctor จะสำรองไฟล์ที่ได้รับผลกระทบแต่ละไฟล์ไว้ข้างต้นฉบับ แล้วเขียน transcript ใหม่ให้เป็น branch ที่ยังทำงานอยู่ เพื่อให้ประวัติ Gateway และตัวอ่านหน่วยความจำไม่เห็น turn ซ้ำอีกต่อไป
  </Accordion>
  <Accordion title="4. การตรวจสอบความถูกต้องของ state (การคงอยู่ของ session, การกำหนดเส้นทาง และความปลอดภัย)">
    ไดเรกทอรี state คือแกนปฏิบัติการหลัก หากมันหายไป คุณจะสูญเสีย session, credentials, logs และ config (เว้นแต่คุณมีข้อมูลสำรองไว้ที่อื่น)

    Doctor ตรวจสอบ:

    - **State dir missing**: เตือนเกี่ยวกับการสูญเสีย state อย่างรุนแรง, แจ้งให้สร้างไดเรกทอรีใหม่ และเตือนว่าไม่สามารถกู้คืนข้อมูลที่หายไปได้
    - **State dir permissions**: ตรวจสอบว่าสามารถเขียนได้; เสนอให้ซ่อมแซม permissions (และแสดงคำใบ้ `chown` เมื่อตรวจพบ owner/group ไม่ตรงกัน)
    - **macOS cloud-synced state dir**: เตือนเมื่อ state resolve ไปอยู่ใต้ iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ `~/Library/CloudStorage/...` เพราะพาธที่มีการ sync อาจทำให้ I/O ช้าลงและเกิด lock/sync races
    - **Linux SD or eMMC state dir**: เตือนเมื่อ state resolve ไปยัง mount source แบบ `mmcblk*` เพราะ random I/O ที่อยู่บน SD หรือ eMMC อาจช้ากว่าและสึกหรอเร็วขึ้นภายใต้การเขียน session และ credential
    - **Session dirs missing**: ต้องมี `sessions/` และไดเรกทอรี session store เพื่อคงประวัติและหลีกเลี่ยง crash แบบ `ENOENT`
    - **Transcript mismatch**: เตือนเมื่อรายการ session ล่าสุดมีไฟล์ transcript หายไป
    - **Main session "1-line JSONL"**: แจ้งเมื่อ transcript หลักมีเพียงบรรทัดเดียว (ประวัติไม่ได้สะสมเพิ่ม)
    - **Multiple state dirs**: เตือนเมื่อมีโฟลเดอร์ `~/.openclaw` หลายโฟลเดอร์ข้าม home directory หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (ประวัติอาจแยกระหว่างการติดตั้ง)
    - **Remote mode reminder**: หาก `gateway.mode=remote`, doctor จะเตือนให้คุณรันบนโฮสต์ remote (state อยู่ที่นั่น)
    - **Config file permissions**: เตือนหาก `~/.openclaw/openclaw.json` อ่านได้โดย group/world และเสนอให้ปรับเข้มงวดเป็น `600`

  </Accordion>
  <Accordion title="5. สุขภาพการยืนยันตัวตนของโมเดล (OAuth หมดอายุ)">
    Doctor ตรวจสอบโปรไฟล์ OAuth ใน auth store, เตือนเมื่อโทเคนใกล้หมดอายุ/หมดอายุแล้ว และสามารถ refresh ได้เมื่อปลอดภัย หากโปรไฟล์ Anthropic OAuth/token เก่าเกินไป จะแนะนำ Anthropic API key หรือเส้นทาง setup-token ของ Anthropic prompt สำหรับ refresh จะปรากฏเฉพาะเมื่อรันแบบโต้ตอบ (TTY); `--non-interactive` จะข้ามการพยายาม refresh

    เมื่อ OAuth refresh ล้มเหลวถาวร (เช่น `refresh_token_reused`, `invalid_grant` หรือ provider บอกให้คุณลงชื่อเข้าใช้อีกครั้ง), doctor จะรายงานว่าต้องยืนยันตัวตนใหม่ และพิมพ์คำสั่ง `openclaw models auth login --provider ...` ที่ต้องรันอย่างชัดเจน

    Doctor ยังรายงานโปรไฟล์ auth ที่ใช้งานไม่ได้ชั่วคราวเนื่องจาก:

    - cooldown สั้น ๆ (rate limits/timeouts/auth failures)
    - การปิดใช้งานนานขึ้น (billing/credit failures)

  </Accordion>
  <Accordion title="6. การตรวจสอบโมเดลของ hooks">
    หากตั้งค่า `hooks.gmail.model` ไว้ doctor จะตรวจสอบ model reference กับ catalog และ allowlist และเตือนเมื่อ resolve ไม่ได้หรือไม่ได้รับอนุญาต
  </Accordion>
  <Accordion title="7. การซ่อมแซม sandbox image">
    เมื่อเปิดใช้ sandboxing, doctor จะตรวจสอบ Docker images และเสนอให้ build หรือสลับไปใช้ชื่อ legacy หาก image ปัจจุบันหายไป
  </Accordion>
  <Accordion title="7b. การล้างการติดตั้ง Plugin">
    Doctor จะลบสถานะ staging ของ dependency สำหรับ Plugin รุ่นเก่าที่ OpenClaw สร้างขึ้นในโหมด `openclaw doctor --fix` / `openclaw doctor --repair` ซึ่งครอบคลุม dependency roots ที่สร้างแล้วค้างอยู่, ไดเรกทอรี install-stage เก่า, debris เฉพาะ package จากโค้ดซ่อมแซม dependency ของ bundled-plugin รุ่นก่อนหน้า และสำเนา npm ที่จัดการอยู่ของ Plugin `@openclaw/*` ที่เป็น bundled ซึ่ง orphaned หรือ recovered และอาจ shadow manifest ที่ bundled ปัจจุบัน

    Doctor ยังสามารถติดตั้ง Plugin ที่ดาวน์โหลดได้ซึ่งหายไปใหม่ เมื่อ config อ้างถึง Plugin เหล่านั้นแต่ local plugin registry หาไม่พบ ตัวอย่างรวมถึง `plugins.entries` ที่มีสาระสำคัญ, การตั้งค่า channel/provider/search ที่กำหนดไว้ และ agent runtimes ที่กำหนดไว้ ระหว่างการอัปเดต package, doctor จะหลีกเลี่ยงการซ่อมแซม Plugin ด้วย package-manager ขณะ core package กำลังถูกสลับ; รัน `openclaw doctor --fix` อีกครั้งหลังอัปเดต หาก Plugin ที่กำหนดไว้ยังต้องกู้คืน การเริ่ม Gateway และการ reload config จะไม่รัน package managers; การติดตั้ง Plugin ยังคงเป็นงาน doctor/install/update ที่ต้องทำอย่างชัดเจน

  </Accordion>
  <Accordion title="8. การ migrate Gateway service และคำใบ้การล้าง">
    Doctor ตรวจพบ gateway services แบบ legacy (launchd/systemd/schtasks) และเสนอให้ลบออก แล้วติดตั้ง service ของ OpenClaw โดยใช้ gateway port ปัจจุบัน นอกจากนี้ยังสามารถสแกนหา service เพิ่มเติมที่คล้าย gateway และพิมพ์คำใบ้การล้างได้ Gateway services ของ OpenClaw ที่มีชื่อโปรไฟล์ถือเป็น first-class และจะไม่ถูกแจ้งว่าเป็น "extra"

    บน Linux หาก gateway service ระดับผู้ใช้หายไปแต่มี OpenClaw gateway service ระดับระบบอยู่ doctor จะไม่ติดตั้ง service ระดับผู้ใช้ตัวที่สองโดยอัตโนมัติ ตรวจสอบด้วย `openclaw gateway status --deep` หรือ `openclaw doctor --deep` จากนั้นลบรายการซ้ำหรือตั้ง `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ system supervisor เป็นผู้ดูแล lifecycle ของ gateway

  </Accordion>
  <Accordion title="8b. การ migrate Startup Matrix">
    เมื่อบัญชีช่องทาง Matrix มี legacy state migration ที่ค้างอยู่หรือดำเนินการได้, doctor (ในโหมด `--fix` / `--repair`) จะสร้าง snapshot ก่อน migration แล้วรันขั้นตอน migration แบบ best-effort: legacy Matrix state migration และ legacy encrypted-state preparation ทั้งสองขั้นตอนไม่ทำให้ล้มเหลวร้ายแรง; error จะถูกบันทึกและ startup จะดำเนินต่อ ในโหมดอ่านอย่างเดียว (`openclaw doctor` ที่ไม่มี `--fix`) การตรวจนี้จะถูกข้ามทั้งหมด
  </Accordion>
  <Accordion title="8c. การจับคู่ device และ auth drift">
    ตอนนี้ Doctor ตรวจสอบสถานะ device-pairing เป็นส่วนหนึ่งของ health pass ปกติ

    สิ่งที่รายงาน:

    - คำขอจับคู่ครั้งแรกที่ค้างอยู่
    - การอัปเกรด role ที่ค้างอยู่สำหรับ device ที่จับคู่แล้ว
    - การอัปเกรด scope ที่ค้างอยู่สำหรับ device ที่จับคู่แล้ว
    - การซ่อมแซม public-key mismatch ซึ่ง device id ยังตรงกัน แต่ device identity ไม่ตรงกับ record ที่อนุมัติแล้วอีกต่อไป
    - paired records ที่ไม่มี token ที่ active สำหรับ role ที่อนุมัติแล้ว
    - paired tokens ที่ scope drift ออกจาก baseline การจับคู่ที่อนุมัติแล้ว
    - รายการ device-token ที่ cache ไว้ในเครื่องสำหรับเครื่องปัจจุบัน ซึ่งเก่ากว่าการหมุน token ฝั่ง gateway หรือมี metadata ของ scope ที่ค้างอยู่

    Doctor จะไม่อนุมัติคำขอจับคู่โดยอัตโนมัติหรือหมุน device token โดยอัตโนมัติ แต่จะพิมพ์ขั้นตอนถัดไปที่แน่นอนแทน:

    - ตรวจสอบคำขอที่ค้างอยู่ด้วย `openclaw devices list`
    - อนุมัติคำขอที่แน่นอนด้วย `openclaw devices approve <requestId>`
    - หมุน token ใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
    - ลบและอนุมัติ record ที่ค้างใหม่ด้วย `openclaw devices remove <deviceId>`

    สิ่งนี้ปิดช่องโหว่ทั่วไป "จับคู่แล้วแต่ยังได้รับ pairing required": ตอนนี้ doctor แยกแยะการจับคู่ครั้งแรกออกจากการอัปเกรด role/scope ที่ค้างอยู่ และจาก token/device-identity drift ที่ค้างอยู่

  </Accordion>
  <Accordion title="9. คำเตือนด้านความปลอดภัย">
    Doctor จะแสดงคำเตือนเมื่อ provider เปิดรับ DM โดยไม่มี allowlist หรือเมื่อตั้งค่า policy ในลักษณะที่อันตราย
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    หากรันเป็น systemd user service, doctor จะตรวจให้แน่ใจว่าเปิด lingering แล้ว เพื่อให้ gateway ยังทำงานหลัง logout
  </Accordion>
  <Accordion title="11. สถานะ workspace (Skills, plugins และไดเรกทอรี legacy)">
    Doctor พิมพ์สรุปสถานะ workspace สำหรับ agent เริ่มต้น:

    - **Skills status**: นับ skills ที่ eligible, missing-requirements และ allowlist-blocked
    - **Legacy workspace dirs**: เตือนเมื่อมี `~/openclaw` หรือไดเรกทอรี workspace แบบ legacy อื่นอยู่ข้าง workspace ปัจจุบัน
    - **Plugin status**: นับ Plugin ที่ enabled/disabled/errored; แสดงรายการ plugin IDs สำหรับ error ใด ๆ; รายงาน bundle plugin capabilities
    - **Plugin compatibility warnings**: แจ้ง Plugin ที่มีปัญหา compatibility กับ runtime ปัจจุบัน
    - **Plugin diagnostics**: แสดง warning หรือ error ตอน load-time ที่ plugin registry ส่งออกมา

  </Accordion>
  <Accordion title="11b. ขนาดไฟล์ bootstrap">
    Doctor ตรวจว่าไฟล์ bootstrap ของ workspace (เช่น `AGENTS.md`, `CLAUDE.md` หรือไฟล์ context อื่นที่ inject เข้ามา) ใกล้หรือเกินงบประมาณตัวอักษรที่กำหนดไว้หรือไม่ โดยรายงานจำนวนตัวอักษร raw เทียบกับ injected ต่อไฟล์, เปอร์เซ็นต์การตัดทอน, สาเหตุการตัดทอน (`max/file` หรือ `max/total`) และจำนวนตัวอักษร injected ทั้งหมดเป็นสัดส่วนของงบประมาณทั้งหมด เมื่อไฟล์ถูกตัดทอนหรือใกล้ถึงขีดจำกัด doctor จะพิมพ์คำแนะนำสำหรับปรับ `agents.defaults.bootstrapMaxChars` และ `agents.defaults.bootstrapTotalMaxChars`
  </Accordion>
  <Accordion title="11d. การล้าง Plugin ช่องทางที่ค้าง">
    เมื่อ `openclaw doctor --fix` ลบ Plugin ช่องทางที่หายไป จะลบ config ระดับช่องทางที่ dangling และอ้างถึง Plugin นั้นด้วย: รายการ `channels.<id>`, heartbeat targets ที่ระบุชื่อช่องทาง และ overrides ของ `agents.*.models["<channel>/*"]` สิ่งนี้ป้องกัน Gateway boot loops ที่ channel runtime หายไปแล้วแต่ config ยังสั่งให้ gateway bind กับมัน
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor ตรวจว่า tab completion ถูกติดตั้งสำหรับ shell ปัจจุบันหรือไม่ (zsh, bash, fish หรือ PowerShell):

    - หาก shell profile ใช้รูปแบบ dynamic completion ที่ช้า (`source <(openclaw completion ...)`), doctor จะอัปเกรดเป็น variant แบบไฟล์ cache ที่เร็วกว่า
    - หาก completion ถูกตั้งค่าใน profile แต่ไฟล์ cache หายไป, doctor จะสร้าง cache ใหม่โดยอัตโนมัติ
    - หากไม่ได้ตั้งค่า completion ไว้เลย, doctor จะแจ้งให้ติดตั้ง (เฉพาะโหมดโต้ตอบ; ข้ามด้วย `--non-interactive`)

    รัน `openclaw completion --write-state` เพื่อสร้าง cache ใหม่ด้วยตนเอง

  </Accordion>
  <Accordion title="12. การตรวจสอบ auth ของ Gateway (local token)">
    Doctor ตรวจสอบความพร้อมของการยืนยันตัวตนด้วย local gateway token

    - หาก token mode ต้องมี token และไม่มี token source อยู่ doctor จะเสนอให้สร้างหนึ่งรายการ
    - หาก `gateway.auth.token` จัดการโดย SecretRef แต่ไม่พร้อมใช้งาน doctor จะเตือนและจะไม่เขียนทับด้วย plaintext
    - `openclaw doctor --generate-gateway-token` จะบังคับสร้างเฉพาะเมื่อไม่ได้กำหนด token SecretRef ไว้

  </Accordion>
  <Accordion title="12b. การซ่อมแซมที่รับรู้ SecretRef แบบอ่านอย่างเดียว">
    repair flows บางอย่างต้องตรวจสอบ credentials ที่กำหนดไว้โดยไม่ทำให้พฤติกรรม fail-fast ของ runtime อ่อนลง

    - ตอนนี้ `openclaw doctor --fix` ใช้โมเดลสรุป SecretRef แบบอ่านอย่างเดียวเดียวกับคำสั่งกลุ่มสถานะสำหรับการซ่อมแซมการกำหนดค่าแบบเจาะจง
    - ตัวอย่าง: การซ่อมแซม Telegram `allowFrom` / `groupAllowFrom` `@username` จะพยายามใช้ข้อมูลรับรองบอตที่กำหนดค่าไว้เมื่อมี
    - หากโทเค็นบอต Telegram ถูกกำหนดค่าผ่าน SecretRef แต่ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานว่าข้อมูลรับรองถูกกำหนดค่าแล้วแต่ไม่พร้อมใช้งาน และข้ามการแก้ค่าอัตโนมัติแทนที่จะล่มหรือรายงานผิดว่าโทเค็นหายไป

  </Accordion>
  <Accordion title="13. การตรวจสุขภาพ Gateway + การรีสตาร์ท">
    Doctor จะรันการตรวจสุขภาพและเสนอให้รีสตาร์ท Gateway เมื่อดูเหมือนว่าไม่แข็งแรง
  </Accordion>
  <Accordion title="13b. ความพร้อมของการค้นหาหน่วยความจำ">
    Doctor จะตรวจสอบว่าผู้ให้บริการ embedding สำหรับการค้นหาหน่วยความจำที่กำหนดค่าไว้พร้อมสำหรับเอเจนต์เริ่มต้นหรือไม่ พฤติกรรมขึ้นอยู่กับแบ็กเอนด์และผู้ให้บริการที่กำหนดค่าไว้:

    - **แบ็กเอนด์ QMD**: ตรวจสอบว่าไบนารี `qmd` พร้อมใช้งานและเริ่มทำงานได้หรือไม่ หากไม่ได้ จะพิมพ์คำแนะนำการแก้ไข รวมถึงแพ็กเกจ npm และตัวเลือกพาธไบนารีแบบกำหนดเอง
    - **ผู้ให้บริการภายในเครื่องแบบระบุชัดเจน**: ตรวจหาไฟล์โมเดลภายในเครื่องหรือ URL โมเดลระยะไกล/ดาวน์โหลดได้ที่รู้จัก หากหายไป จะแนะนำให้เปลี่ยนไปใช้ผู้ให้บริการระยะไกล
    - **ผู้ให้บริการระยะไกลแบบระบุชัดเจน** (`openai`, `voyage`, ฯลฯ): ตรวจสอบว่ามีคีย์ API อยู่ในสภาพแวดล้อมหรือที่เก็บ auth หรือไม่ และพิมพ์คำแนะนำการแก้ไขที่นำไปทำได้หากหายไป
    - **ผู้ให้บริการอัตโนมัติ**: ตรวจสอบความพร้อมของโมเดลภายในเครื่องก่อน จากนั้นลองผู้ให้บริการระยะไกลแต่ละรายตามลำดับการเลือกอัตโนมัติ

    เมื่อมีผลการตรวจ Gateway ที่แคชไว้พร้อมใช้งาน (Gateway แข็งแรงในเวลาที่ตรวจสอบ) doctor จะเทียบผลนั้นกับการกำหนดค่าที่ CLI มองเห็น และแจ้งความไม่ตรงกันถ้ามี Doctor จะไม่เริ่ม ping embedding ใหม่ในเส้นทางเริ่มต้น ให้ใช้คำสั่งสถานะหน่วยความจำเชิงลึกเมื่อต้องการตรวจสอบผู้ให้บริการแบบสด

    ใช้ `openclaw memory status --deep` เพื่อตรวจสอบความพร้อมของ embedding ขณะรันไทม์

  </Accordion>
  <Accordion title="14. คำเตือนสถานะช่องทาง">
    หาก Gateway แข็งแรง doctor จะรันการตรวจสถานะช่องทางและรายงานคำเตือนพร้อมคำแนะนำการแก้ไข
  </Accordion>
  <Accordion title="15. การตรวจสอบ + ซ่อมแซมการกำหนดค่า supervisor">
    Doctor จะตรวจสอบการกำหนดค่า supervisor ที่ติดตั้งไว้ (launchd/systemd/schtasks) เพื่อหาค่าเริ่มต้นที่หายไปหรือล้าสมัย (เช่น การพึ่งพา systemd network-online และดีเลย์การรีสตาร์ท) เมื่อพบความไม่ตรงกัน จะแนะนำให้อัปเดตและสามารถเขียนไฟล์ service/task ใหม่เป็นค่าเริ่มต้นปัจจุบันได้

    หมายเหตุ:

    - `openclaw doctor` จะถามก่อนเขียนการกำหนดค่า supervisor ใหม่
    - `openclaw doctor --yes` ยอมรับพรอมต์ซ่อมแซมเริ่มต้น
    - `openclaw doctor --repair` ใช้การแก้ไขที่แนะนำโดยไม่แสดงพรอมต์
    - `openclaw doctor --repair --force` เขียนทับการกำหนดค่า supervisor แบบกำหนดเอง
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` ทำให้ doctor เป็นแบบอ่านอย่างเดียวสำหรับวงจรชีวิต service ของ Gateway โดยยังคงรายงานสุขภาพ service และรันการซ่อมแซมที่ไม่ใช่ service แต่ข้ามการติดตั้ง/เริ่ม/รีสตาร์ท/bootstrap service การเขียนการกำหนดค่า supervisor ใหม่ และการล้าง service เก่า เพราะ supervisor ภายนอกเป็นเจ้าของวงจรชีวิตนั้น
    - บน Linux doctor จะไม่เขียนเมทาดาทาคำสั่ง/entrypoint ใหม่ขณะที่ systemd gateway unit ที่ตรงกันยัง active อยู่ และยังละเว้น unit เพิ่มเติมที่ไม่ใช่แบบเก่าและไม่ active แต่มีลักษณะคล้าย Gateway ระหว่างการสแกน service ซ้ำ เพื่อไม่ให้ไฟล์ service ที่ทำงานประกอบกันสร้างเสียงรบกวนในการล้างข้อมูล
    - หาก token auth ต้องใช้โทเค็นและ `gateway.auth.token` ถูกจัดการด้วย SecretRef การติดตั้ง/ซ่อมแซม service ของ doctor จะตรวจสอบ SecretRef แต่จะไม่บันทึกค่าโทเค็นข้อความล้วนที่แก้ค่าแล้วลงในเมทาดาทาสภาพแวดล้อมของ supervisor service
    - Doctor ตรวจพบค่าของสภาพแวดล้อม service ที่จัดการด้วย `.env`/รองรับด้วย SecretRef ซึ่งการติดตั้ง LaunchAgent, systemd หรือ Windows Scheduled Task รุ่นเก่าฝังไว้แบบ inline และเขียนเมทาดาทา service ใหม่เพื่อให้ค่าเหล่านั้นโหลดจากแหล่งรันไทม์แทนจากนิยาม supervisor
    - Doctor ตรวจพบเมื่อคำสั่ง service ยังตรึง `--port` เก่าไว้หลังจาก `gateway.port` เปลี่ยน และเขียนเมทาดาทา service ใหม่ให้เป็นพอร์ตปัจจุบัน
    - หาก token auth ต้องใช้โทเค็นและ SecretRef ของโทเค็นที่กำหนดค่าไว้ยังแก้ค่าไม่ได้ doctor จะบล็อกเส้นทางติดตั้ง/ซ่อมแซมพร้อมคำแนะนำที่นำไปทำได้
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้งค่า mode อย่างชัดเจน
    - สำหรับ Linux user-systemd units ตอนนี้การตรวจ token drift ของ doctor จะรวมทั้งแหล่ง `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบเมทาดาทา auth ของ service
    - การซ่อมแซม service ของ Doctor จะปฏิเสธการเขียนใหม่ หยุด หรือรีสตาร์ท Gateway service จากไบนารี OpenClaw รุ่นเก่ากว่า เมื่อการกำหนดค่าถูกเขียนครั้งล่าสุดโดยเวอร์ชันที่ใหม่กว่า ดู [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)
    - คุณสามารถบังคับเขียนใหม่ทั้งหมดได้เสมอผ่าน `openclaw gateway install --force`

  </Accordion>
  <Accordion title="16. การวินิจฉัยรันไทม์ + พอร์ตของ Gateway">
    Doctor ตรวจสอบรันไทม์ของ service (PID, สถานะออกล่าสุด) และเตือนเมื่อ service ติดตั้งแล้วแต่ไม่ได้รันจริง นอกจากนี้ยังตรวจหาการชนกันของพอร์ตบนพอร์ต Gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (Gateway รันอยู่แล้ว, SSH tunnel)
  </Accordion>
  <Accordion title="17. แนวทางปฏิบัติที่ดีของรันไทม์ Gateway">
    Doctor เตือนเมื่อ Gateway service รันบน Bun หรือพาธ Node ที่จัดการด้วยเวอร์ชัน (`nvm`, `fnm`, `volta`, `asdf`, ฯลฯ) ช่องทาง WhatsApp + Telegram ต้องใช้ Node และพาธของตัวจัดการเวอร์ชันอาจเสียหลังอัปเกรด เพราะ service ไม่ได้โหลดการตั้งค่าเริ่มต้นของ shell ของคุณ Doctor เสนอให้ย้ายไปใช้การติดตั้ง Node ของระบบเมื่อมี (Homebrew/apt/choco)

    LaunchAgents ของ macOS ที่ติดตั้งหรือซ่อมแซมใหม่จะใช้ PATH ระบบมาตรฐาน (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) แทนการคัดลอก PATH ของ shell แบบโต้ตอบ ดังนั้นไดเรกทอรีของตัวจัดการเวอร์ชันอย่าง Volta, asdf, fnm, pnpm และอื่น ๆ จะไม่เปลี่ยนว่าโปรเซสลูกของ Node ตัวใดถูก resolve ส่วน service บน Linux ยังคงเก็บรากสภาพแวดล้อมแบบชัดเจน (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) และไดเรกทอรี user-bin ที่เสถียร แต่ไดเรกทอรี fallback ของตัวจัดการเวอร์ชันที่คาดเดาจะถูกเขียนลงใน PATH ของ service เฉพาะเมื่อไดเรกทอรีเหล่านั้นมีอยู่บนดิสก์เท่านั้น

  </Accordion>
  <Accordion title="18. การเขียนการกำหนดค่า + เมทาดาทา wizard">
    Doctor บันทึกการเปลี่ยนแปลงการกำหนดค่าใด ๆ และประทับเมทาดาทา wizard เพื่อบันทึกการรัน doctor
  </Accordion>
  <Accordion title="19. เคล็ดลับพื้นที่ทำงาน (การสำรองข้อมูล + ระบบหน่วยความจำ)">
    Doctor แนะนำระบบหน่วยความจำของพื้นที่ทำงานเมื่อขาดหายไป และพิมพ์เคล็ดลับการสำรองข้อมูลหากพื้นที่ทำงานยังไม่ได้อยู่ภายใต้ git

    ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคู่มือฉบับเต็มเกี่ยวกับโครงสร้างพื้นที่ทำงานและการสำรองข้อมูลด้วย git (แนะนำ GitHub หรือ GitLab แบบส่วนตัว)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [การแก้ปัญหา Gateway](/th/gateway/troubleshooting)
