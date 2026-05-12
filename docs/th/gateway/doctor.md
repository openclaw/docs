---
read_when:
    - การเพิ่มหรือแก้ไขไมเกรชันของ doctor
    - การนำการเปลี่ยนแปลงการกำหนดค่าที่ไม่รองรับย้อนหลังมาใช้
sidebarTitle: Doctor
summary: 'คำสั่ง Doctor: การตรวจสอบสุขภาพ, การย้ายข้อมูลการกำหนดค่า, และขั้นตอนการซ่อมแซม'
title: ตัวตรวจวินิจฉัย
x-i18n:
    generated_at: "2026-05-12T08:45:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53d67fcc5ab4a356747bc4f4af0c5d42cbdae0c89a41616aaded7589e408a017
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` คือเครื่องมือซ่อมแซมและย้ายข้อมูลสำหรับ OpenClaw เครื่องมือนี้แก้ไข config/state ที่ค้างเก่า ตรวจสอบสุขภาพ และให้ขั้นตอนการซ่อมแซมที่นำไปปฏิบัติได้

## เริ่มใช้งานอย่างรวดเร็ว

```bash
openclaw doctor
```

### โหมด headless และ automation

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    ยอมรับค่าเริ่มต้นโดยไม่ถามยืนยัน (รวมถึงขั้นตอนการซ่อมแซม restart/service/sandbox เมื่อเกี่ยวข้อง)

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    ใช้การซ่อมแซมที่แนะนำโดยไม่ถามยืนยัน (การซ่อมแซมและการรีสตาร์ตในจุดที่ปลอดภัย)

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    ใช้การซ่อมแซมเชิงรุกด้วย (เขียนทับ config supervisor แบบกำหนดเอง)

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    รันโดยไม่มี prompt และใช้เฉพาะการย้ายข้อมูลที่ปลอดภัย (การปรับ config ให้เป็นรูปแบบมาตรฐานและการย้าย state บนดิสก์) ข้ามการกระทำกับ restart/service/sandbox ที่ต้องมีการยืนยันจากมนุษย์ การย้าย state รุ่นเก่าจะรันโดยอัตโนมัติเมื่อตรวจพบ

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    สแกน service ของระบบเพื่อหา gateway install เพิ่มเติม (launchd/systemd/schtasks)

  </Tab>
</Tabs>

หากคุณต้องการตรวจทานการเปลี่ยนแปลงก่อนเขียน ให้เปิดไฟล์ config ก่อน:

```bash
cat ~/.openclaw/openclaw.json
```

## สิ่งที่เครื่องมือนี้ทำ (สรุป)

<AccordionGroup>
  <Accordion title="สุขภาพ, UI, และการอัปเดต">
    - การอัปเดตก่อนเริ่มแบบเลือกได้สำหรับ git install (เฉพาะแบบ interactive)
    - การตรวจสอบความสดใหม่ของโปรโตคอล UI (สร้าง Control UI ใหม่เมื่อ protocol schema ใหม่กว่า)
    - การตรวจสุขภาพและ prompt ให้รีสตาร์ต
    - สรุปสถานะ Skills (eligible/missing/blocked) และสถานะ Plugin

  </Accordion>
  <Accordion title="Config และการย้ายข้อมูล">
    - การปรับ config ให้เป็นรูปแบบมาตรฐานสำหรับค่า legacy
    - การย้าย config ของ Talk จากฟิลด์แบนแบบ legacy `talk.*` ไปเป็น `talk.provider` + `talk.providers.<provider>`
    - การตรวจสอบการย้ายเบราว์เซอร์สำหรับ config ส่วนขยาย Chrome รุ่นเก่าและความพร้อมของ Chrome MCP
    - คำเตือน override provider ของ OpenCode (`models.providers.opencode` / `models.providers.opencode-go`)
    - คำเตือนการ shadowing ของ Codex OAuth (`models.providers.openai-codex`)
    - การตรวจสอบข้อกำหนดเบื้องต้นของ OAuth TLS สำหรับโปรไฟล์ OpenAI Codex OAuth
    - คำเตือน allowlist ของ Plugin/tool เมื่อ `plugins.allow` จำกัดไว้ แต่ policy ของ tool ยังขอ wildcard หรือ tool ที่ Plugin เป็นเจ้าของ
    - การย้าย state บนดิสก์รุ่นเก่า (sessions/agent dir/WhatsApp auth)
    - การย้ายคีย์สัญญา manifest ของ Plugin รุ่นเก่า (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
    - การย้าย cron store รุ่นเก่า (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบน, payload `provider`, งาน webhook fallback แบบง่าย `notify: true`)
    - การล้าง whole-agent runtime-policy รุ่นเก่า; provider/model runtime policy คือ route selector ที่ใช้งานอยู่
    - การล้าง config ของ Plugin ที่ค้างเก่าเมื่อเปิดใช้ plugins; เมื่อ `plugins.enabled=false` การอ้างอิง Plugin ที่ค้างเก่าจะถือเป็น inert containment config และจะถูกเก็บไว้

  </Accordion>
  <Accordion title="State และความถูกต้องสมบูรณ์">
    - การตรวจสอบไฟล์ session lock และการล้าง lock ที่ค้างเก่า
    - การซ่อม transcript ของ session สำหรับกิ่ง prompt-rewrite ที่ซ้ำกันซึ่งสร้างโดย build วันที่ 2026.4.24 ที่ได้รับผลกระทบ
    - การตรวจจับ tombstone ของการกู้คืนด้วยการรีสตาร์ต subagent ที่ค้าง พร้อมรองรับ `--fix` เพื่อล้าง flag การกู้คืนที่ถูกยกเลิกซึ่งค้างเก่า เพื่อไม่ให้ startup ยังปฏิบัติต่อ child ว่าเป็น restart-aborted ต่อไป
    - การตรวจสอบความถูกต้องสมบูรณ์ของ state และสิทธิ์ (sessions, transcripts, state dir)
    - การตรวจสอบสิทธิ์ของไฟล์ config (chmod 600) เมื่อรันในเครื่อง
    - สุขภาพ auth ของ model: ตรวจสอบการหมดอายุของ OAuth, สามารถ refresh token ที่ใกล้หมดอายุ, และรายงานสถานะ cooldown/disabled ของ auth-profile
    - การตรวจจับ workspace dir เพิ่มเติม (`~/openclaw`)

  </Accordion>
  <Accordion title="Gateway, service, และ supervisor">
    - การซ่อม sandbox image เมื่อเปิดใช้ sandboxing
    - การย้าย service รุ่นเก่าและการตรวจจับ gateway เพิ่มเติม
    - การย้าย state รุ่นเก่าของช่อง Matrix (ในโหมด `--fix` / `--repair`)
    - การตรวจสอบ runtime ของ Gateway (ติดตั้ง service แล้วแต่ไม่รัน; label launchd ที่แคชไว้)
    - คำเตือนสถานะช่อง (probe จาก gateway ที่กำลังรัน)
    - การตรวจสอบสิทธิ์เฉพาะช่องอยู่ภายใต้ `openclaw channels capabilities`; ตัวอย่างเช่น สิทธิ์ของช่องเสียง Discord จะถูก audit ด้วย `openclaw channels capabilities --channel discord --target channel:<channel-id>`
    - การตรวจสอบการตอบสนองของ WhatsApp สำหรับสุขภาพ event-loop ของ Gateway ที่เสื่อมลงโดยยังมี local TUI client รันอยู่; `--fix` หยุดเฉพาะ local TUI client ที่ยืนยันแล้วเท่านั้น
    - การซ่อม route ของ Codex สำหรับ model ref รุ่นเก่า `openai-codex/*` ใน primary models, fallbacks, heartbeat/subagent/compaction overrides, hooks, channel model overrides, และ session route pins; `--fix` เขียนใหม่เป็น `openai/*`, ลบ session/whole-agent runtime pins ที่ค้างเก่า, และคง OpenAI agent refs แบบ canonical ไว้บน harness Codex เริ่มต้น
    - การ audit config ของ supervisor (launchd/systemd/schtasks) พร้อมการซ่อมแบบเลือกได้
    - การล้างสภาพแวดล้อม proxy แบบ embedded สำหรับ service ของ gateway ที่จับค่า shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` ไว้ระหว่าง install หรือ update
    - การตรวจสอบ best practice ของ runtime Gateway (Node เทียบกับ Bun, path ของ version-manager)
    - การวิเคราะห์ port collision ของ Gateway (ค่าเริ่มต้น `18789`)

  </Accordion>
  <Accordion title="Auth, security, และ pairing">
    - คำเตือนด้าน security สำหรับ policy ของ DM ที่เปิดกว้าง
    - การตรวจสอบ auth ของ Gateway สำหรับโหมด token local (เสนอการสร้าง token เมื่อไม่มีแหล่ง token; ไม่เขียนทับ config SecretRef ของ token)
    - การตรวจจับปัญหา device pairing (คำขอจับคู่ครั้งแรกที่ค้างอยู่, การอัปเกรด role/scope ที่ค้างอยู่, drift ของ local device-token cache ที่ค้างเก่า, และ drift ของ auth ใน paired-record)

  </Accordion>
  <Accordion title="Workspace และ shell">
    - การตรวจสอบ systemd linger บน Linux
    - การตรวจสอบขนาดไฟล์ bootstrap ของ workspace (คำเตือนเรื่องการตัดทอน/ใกล้ขีดจำกัดสำหรับไฟล์ context)
    - การตรวจสอบความพร้อมของ Skills สำหรับ agent เริ่มต้น; รายงาน skills ที่อนุญาตแต่ขาด bin, env, config, หรือข้อกำหนด OS และ `--fix` สามารถปิดใช้ skills ที่ไม่พร้อมใน `skills.entries`
    - การตรวจสอบสถานะ shell completion และการติดตั้ง/อัปเกรดอัตโนมัติ
    - การตรวจสอบความพร้อมของ provider สำหรับ memory search embedding (model local, คีย์ remote API, หรือ binary QMD)
    - การตรวจสอบ source install (pnpm workspace ไม่ตรงกัน, asset UI หาย, binary tsx หาย)
    - เขียน config และ metadata ของ wizard ที่อัปเดตแล้ว

  </Accordion>
</AccordionGroup>

## Dreams UI backfill และ reset

ฉาก Dreams ใน Control UI มี action **Backfill**, **Reset**, และ **Clear Grounded** สำหรับ workflow grounded dreaming action เหล่านี้ใช้เมธอด RPC แบบ gateway doctor แต่ **ไม่ใช่** ส่วนหนึ่งของการซ่อม/ย้ายข้อมูลใน CLI `openclaw doctor`

สิ่งที่ action เหล่านี้ทำ:

- **Backfill** สแกนไฟล์ย้อนหลัง `memory/YYYY-MM-DD.md` ใน workspace ที่ใช้งานอยู่ รัน grounded REM diary pass และเขียนรายการ backfill ที่ย้อนกลับได้ลงใน `DREAMS.md`
- **Reset** ลบเฉพาะรายการ diary backfill ที่ถูกทำเครื่องหมายเหล่านั้นออกจาก `DREAMS.md`
- **Clear Grounded** ลบเฉพาะรายการ short-term แบบ grounded-only ที่ถูก stage ไว้ ซึ่งมาจากการ replay ย้อนหลังและยังไม่ได้สะสม live recall หรือ daily support

สิ่งที่ action เหล่านี้ **ไม่** ทำด้วยตัวเอง:

- ไม่แก้ไข `MEMORY.md`
- ไม่รันการย้ายข้อมูลทั้งหมดของ doctor
- ไม่ stage grounded candidates เข้าไปใน live short-term promotion store โดยอัตโนมัติ เว้นแต่คุณจะรันเส้นทาง CLI แบบ staged อย่างชัดเจนก่อน

หากคุณต้องการให้ grounded historical replay มีผลต่อ lane deep promotion ตามปกติ ให้ใช้ flow ของ CLI แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

คำสั่งนั้นจะ stage grounded durable candidates เข้าไปใน short-term dreaming store โดยยังคงให้ `DREAMS.md` เป็นพื้นผิวสำหรับตรวจทาน

## พฤติกรรมโดยละเอียดและเหตุผล

<AccordionGroup>
  <Accordion title="0. การอัปเดตแบบเลือกได้ (git installs)">
    หากนี่เป็น git checkout และ doctor กำลังรันแบบ interactive ระบบจะเสนอให้อัปเดต (fetch/rebase/build) ก่อนรัน doctor
  </Accordion>
  <Accordion title="1. การปรับ config ให้เป็นรูปแบบมาตรฐาน">
    หาก config มีรูปแบบค่ารุ่นเก่า (ตัวอย่างเช่น `messages.ackReaction` โดยไม่มี override เฉพาะช่อง) doctor จะปรับค่าเหล่านั้นให้เป็น schema ปัจจุบัน

    ซึ่งรวมถึงฟิลด์แบนของ Talk รุ่นเก่าด้วย config speech ของ Talk แบบ public ปัจจุบันคือ `talk.provider` + `talk.providers.<provider>` และ config realtime voice คือ `talk.realtime.*` Doctor เขียนรูปแบบเก่า `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ใหม่เข้าไปใน provider map และเขียน selector realtime ระดับบนแบบ legacy (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) ใหม่เข้าไปใน `talk.realtime`

    Doctor ยังเตือนเมื่อ `plugins.allow` ไม่ว่างและ tool policy ใช้
    รายการ tool แบบ wildcard หรือที่ Plugin เป็นเจ้าของ `tools.allow: ["*"]` จับคู่เฉพาะ tool
    จาก plugins ที่โหลดจริงเท่านั้น; ไม่ได้ข้าม allowlist ของ Plugin แบบ exclusive
    Doctor เขียน `plugins.bundledDiscovery: "compat"` สำหรับ config allowlist
    legacy ที่ถูกย้ายข้อมูล เพื่อรักษาพฤติกรรม bundled provider ที่มีอยู่ และ
    จากนั้นชี้ไปยังการตั้งค่า `"allowlist"` ที่เข้มงวดกว่า

  </Accordion>
  <Accordion title="2. การย้ายคีย์ config รุ่นเก่า">
    เมื่อ config มีคีย์ที่เลิกใช้แล้ว คำสั่งอื่นจะปฏิเสธการรันและขอให้คุณรัน `openclaw doctor`

    Doctor จะ:

    - อธิบายว่าพบคีย์ legacy ใด
    - แสดงการย้ายข้อมูลที่ใช้ไป
    - เขียน `~/.openclaw/openclaw.json` ใหม่ด้วย schema ที่อัปเดตแล้ว

    การเริ่มต้น Gateway ปฏิเสธรูปแบบ config รุ่นเก่าและขอให้คุณรัน `openclaw doctor --fix`; จะไม่เขียน `openclaw.json` ใหม่ตอน startup การย้าย job store ของ Cron ก็จัดการโดย `openclaw doctor --fix` เช่นกัน

    การย้ายข้อมูลปัจจุบัน:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - การกำหนดค่าช่องทางที่กำหนดไว้ซึ่งไม่มีนโยบายการตอบกลับที่มองเห็นได้ → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` ระดับบนสุด
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` แบบเดิม → `talk.provider` + `talk.providers.<provider>`
    - ตัวเลือก Talk แบบเรียลไทม์ระดับบนสุดแบบเดิม (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - สำหรับช่องทางที่มี `accounts` แบบตั้งชื่อ แต่ยังมีค่าช่องทางระดับบนสุดสำหรับบัญชีเดียวหลงเหลืออยู่ ให้ย้ายค่าที่อยู่ในขอบเขตบัญชีเหล่านั้นเข้าไปในบัญชีที่เลื่อนระดับซึ่งเลือกไว้สำหรับช่องทางนั้น (`accounts.default` สำหรับช่องทางส่วนใหญ่; Matrix สามารถคงเป้าหมายแบบตั้งชื่อ/ค่าเริ่มต้นที่ตรงกันซึ่งมีอยู่แล้วได้)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - ลบ `agents.defaults.llm`; ใช้ `models.providers.<id>.timeoutSeconds` สำหรับการหมดเวลาของผู้ให้บริการ/โมเดลที่ช้า
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - ลบ `browser.relayBindHost` (การตั้งค่ารีเลย์ส่วนขยายแบบเดิม)
    - `models.providers.*.api: "openai"` แบบเดิม → `"openai-completions"` (การเริ่มต้น Gateway จะข้ามผู้ให้บริการที่ตั้งค่า `api` เป็นค่า enum ในอนาคตหรือไม่รู้จักด้วย แทนที่จะล้มเหลวแบบปิด)
    - ลบ `plugins.entries.codex.config.codexDynamicToolsProfile`; เซิร์ฟเวอร์แอป Codex จะเก็บเครื่องมือเวิร์กสเปซแบบดั้งเดิมของ Codex ให้เป็นแบบดั้งเดิมเสมอ

    คำเตือนของ Doctor ยังรวมคำแนะนำค่าเริ่มต้นของบัญชีสำหรับช่องทางหลายบัญชีด้วย:

    - หากกำหนดค่ารายการ `channels.<channel>.accounts` สองรายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default` doctor จะเตือนว่าการกำหนดเส้นทางสำรองอาจเลือกบัญชีที่ไม่คาดคิด
    - หากตั้งค่า `channels.<channel>.defaultAccount` เป็น ID บัญชีที่ไม่รู้จัก doctor จะเตือนและแสดงรายการ ID บัญชีที่กำหนดค่าไว้

  </Accordion>
  <Accordion title="2b. การแทนที่ผู้ให้บริการ OpenCode">
    หากคุณเพิ่ม `models.providers.opencode`, `opencode-zen` หรือ `opencode-go` ด้วยตนเอง รายการนั้นจะแทนที่แค็ตตาล็อก OpenCode ในตัวจาก `@earendil-works/pi-ai` ซึ่งอาจบังคับให้โมเดลใช้ API ผิดตัวหรือทำให้ต้นทุนเป็นศูนย์ Doctor จะเตือนเพื่อให้คุณลบการแทนที่และกู้คืนการกำหนดเส้นทาง API + ต้นทุนรายโมเดล
  </Accordion>
  <Accordion title="2c. การย้าย Browser และความพร้อมของ Chrome MCP">
    หากการกำหนดค่า Browser ของคุณยังชี้ไปยังพาธส่วนขยาย Chrome ที่ถูกลบแล้ว doctor จะปรับให้เป็นโมเดลแนบ Chrome MCP แบบ host-local ปัจจุบัน:

    - `browser.profiles.*.driver: "extension"` จะกลายเป็น `"existing-session"`
    - `browser.relayBindHost` จะถูกลบ

    Doctor ยังตรวจสอบพาธ Chrome MCP แบบ host-local เมื่อคุณใช้ `defaultProfile: "user"` หรือโปรไฟล์ `existing-session` ที่กำหนดค่าไว้:

    - ตรวจสอบว่าติดตั้ง Google Chrome บนโฮสต์เดียวกันสำหรับโปรไฟล์เชื่อมต่ออัตโนมัติค่าเริ่มต้นหรือไม่
    - ตรวจสอบเวอร์ชัน Chrome ที่ตรวจพบและเตือนเมื่อเวอร์ชันต่ำกว่า Chrome 144
    - เตือนให้คุณเปิดใช้การดีบักระยะไกลในหน้า inspect ของ Browser (เช่น `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` หรือ `edge://inspect/#remote-debugging`)

    Doctor ไม่สามารถเปิดใช้การตั้งค่าฝั่ง Chrome ให้คุณได้ Chrome MCP แบบ host-local ยังต้องใช้:

    - Browser ที่อิง Chromium 144+ บนโฮสต์ gateway/node
    - Browser ที่ทำงานอยู่ในเครื่อง
    - เปิดใช้การดีบักระยะไกลใน Browser นั้น
    - อนุมัติพรอมป์ยินยอมการแนบครั้งแรกใน Browser

    ความพร้อมในที่นี้เกี่ยวข้องกับข้อกำหนดเบื้องต้นของการแนบในเครื่องเท่านั้น Existing-session ยังคงขีดจำกัดเส้นทาง Chrome MCP ปัจจุบันไว้; เส้นทางขั้นสูงอย่าง `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และการดำเนินการแบบชุดยังต้องใช้ Browser ที่จัดการหรือโปรไฟล์ CDP ดิบ

    การตรวจสอบนี้ **ไม่** ใช้กับ Docker, sandbox, remote-browser หรือโฟลว์ headless อื่น ๆ รายการเหล่านั้นยังคงใช้ CDP ดิบต่อไป

  </Accordion>
  <Accordion title="2d. ข้อกำหนดเบื้องต้น OAuth TLS">
    เมื่อกำหนดค่าโปรไฟล์ OpenAI Codex OAuth แล้ว doctor จะตรวจสอบปลายทางการอนุญาตของ OpenAI เพื่อยืนยันว่าสแตก TLS ของ Node/OpenSSL ในเครื่องสามารถตรวจสอบความถูกต้องของสายโซ่ใบรับรองได้ หากการตรวจสอบล้มเหลวด้วยข้อผิดพลาดใบรับรอง (เช่น `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ใบรับรองหมดอายุ หรือใบรับรองที่ลงนามด้วยตนเอง) doctor จะแสดงคำแนะนำการแก้ไขเฉพาะแพลตฟอร์ม บน macOS ที่ใช้ Homebrew Node การแก้มักเป็น `brew postinstall ca-certificates` เมื่อใช้ `--deep` การตรวจสอบจะทำงานแม้ว่า Gateway จะปกติดี
  </Accordion>
  <Accordion title="2e. การแทนที่ผู้ให้บริการ Codex OAuth">
    หากก่อนหน้านี้คุณเพิ่มการตั้งค่า transport ของ OpenAI แบบเดิมไว้ใต้ `models.providers.openai-codex` การตั้งค่าเหล่านั้นอาจบดบังพาธผู้ให้บริการ Codex OAuth ในตัวที่รีลีสใหม่กว่าใช้โดยอัตโนมัติ Doctor จะเตือนเมื่อพบการตั้งค่า transport เก่าเหล่านั้นร่วมกับ Codex OAuth เพื่อให้คุณลบหรือเขียนการแทนที่ transport ที่ล้าสมัยใหม่ และกู้คืนพฤติกรรมการกำหนดเส้นทาง/สำรองในตัว พร็อกซีแบบกำหนดเองและการแทนที่เฉพาะส่วนหัวดยังคงรองรับ และจะไม่ทำให้เกิดคำเตือนนี้
  </Accordion>
  <Accordion title="2f. การซ่อมแซมเส้นทาง Codex">
    Doctor ตรวจสอบ refs โมเดล `openai-codex/*` แบบเดิม การกำหนดเส้นทาง harness ดั้งเดิมของ Codex ใช้ refs โมเดล `openai/*` แบบ canonical; รอบของเอเจนต์ OpenAI จะผ่าน harness เซิร์ฟเวอร์แอป Codex แทนพาธ OpenClaw PI OpenAI

    ในโหมด `--fix` / `--repair` doctor จะเขียน refs ของเอเจนต์เริ่มต้นและรายเอเจนต์ที่ได้รับผลกระทบใหม่ รวมถึงโมเดลหลัก, fallbacks, การแทนที่ heartbeat/subagent/compaction, hooks, การแทนที่โมเดลของช่องทาง และสถานะเส้นทางเซสชันที่คงอยู่ซึ่งล้าสมัย:

    - `openai-codex/gpt-*` จะกลายเป็น `openai/gpt-*`
    - ความตั้งใจของ Codex จะย้ายไปยังรายการ `agentRuntime.id: "codex"` ที่อยู่ในขอบเขตผู้ให้บริการ/โมเดลสำหรับ refs โมเดลเอเจนต์ที่ซ่อมแล้ว เพื่อให้ยังสามารถเลือกโปรไฟล์ auth `openai-codex:...` ได้หลังจาก ref โมเดลกลายเป็น `openai/*`
    - การกำหนดค่ารันไทม์ทั้งเอเจนต์ที่ล้าสมัยและ pins รันไทม์ของเซสชันที่คงอยู่จะถูกลบ เพราะการเลือกรันไทม์อยู่ในขอบเขตผู้ให้บริการ/โมเดล
    - นโยบายรันไทม์ผู้ให้บริการ/โมเดลที่มีอยู่จะคงเดิม เว้นแต่ ref โมเดลแบบเดิมที่ซ่อมแล้วต้องใช้การกำหนดเส้นทาง Codex เพื่อรักษาพาธ auth เก่า
    - รายการ fallback ของโมเดลที่มีอยู่จะคงเดิมพร้อมเขียนรายการแบบเดิมใหม่; การตั้งค่ารายโมเดลที่คัดลอกจะย้ายจากคีย์เดิมไปยังคีย์ canonical `openai/*`
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, ประกาศ fallback และ pins โปรไฟล์ auth ของเซสชันที่คงอยู่จะถูกซ่อมในที่เก็บเซสชันเอเจนต์ทั้งหมดที่ค้นพบ
    - `/codex ...` หมายถึง "ควบคุมหรือผูกการสนทนา Codex ดั้งเดิมจากแชต"
    - `/acp ...` หรือ `runtime: "acp"` หมายถึง "ใช้อะแดปเตอร์ ACP/acpx ภายนอก"

  </Accordion>
  <Accordion title="2g. การล้างข้อมูลเส้นทางเซสชัน">
    Doctor ยังสแกนที่เก็บเซสชันเอเจนต์ที่ค้นพบเพื่อหาสถานะเส้นทางที่สร้างอัตโนมัติซึ่งล้าสมัย หลังจากคุณย้ายโมเดลหรือรันไทม์ที่กำหนดค่าไว้ออกจากเส้นทางที่ Plugin เป็นเจ้าของ เช่น Codex

    `openclaw doctor --fix` สามารถล้างสถานะล้าสมัยที่สร้างอัตโนมัติ เช่น pins โมเดล `modelOverrideSource: "auto"`, เมทาดาทาโมเดลรันไทม์, IDs harness ที่ pin ไว้, การผูกเซสชัน CLI และการแทนที่โปรไฟล์ auth แบบอัตโนมัติ เมื่อเส้นทางเจ้าของของรายการเหล่านั้นไม่ได้ถูกกำหนดค่าไว้อีกต่อไป ตัวเลือกโมเดลเซสชันที่ผู้ใช้ระบุอย่างชัดเจนหรือแบบเดิมจะถูกรายงานเพื่อให้ตรวจสอบด้วยตนเองและปล่อยไว้ตามเดิม; สลับรายการเหล่านั้นด้วย `/model ...`, `/new` หรือรีเซ็ตเซสชันเมื่อไม่ต้องการเส้นทางนั้นอีกต่อไป

  </Accordion>
  <Accordion title="3. การย้ายสถานะแบบเดิม (เลย์เอาต์ดิสก์)">
    Doctor สามารถย้ายเลย์เอาต์บนดิสก์ที่เก่ากว่าเข้าสู่โครงสร้างปัจจุบัน:

    - ที่เก็บเซสชัน + transcripts:
      - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
    - ไดเรกทอรีเอเจนต์:
      - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
    - สถานะ auth ของ WhatsApp (Baileys):
      - จาก `~/.openclaw/credentials/*.json` แบบเดิม (ยกเว้น `oauth.json`)
      - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID บัญชีค่าเริ่มต้น: `default`)

    การย้ายเหล่านี้เป็นแบบพยายามให้ดีที่สุดและทำซ้ำได้โดยไม่เกิดผลซ้ำ; doctor จะส่งคำเตือนเมื่อปล่อยโฟลเดอร์แบบเดิมใด ๆ ไว้เป็นข้อมูลสำรอง Gateway/CLI ยังย้ายเซสชันแบบเดิม + ไดเรกทอรีเอเจนต์โดยอัตโนมัติเมื่อเริ่มต้น เพื่อให้ประวัติ/auth/โมเดลอยู่ในพาธรายเอเจนต์โดยไม่ต้องเรียก doctor ด้วยตนเอง การย้าย auth ของ WhatsApp ตั้งใจให้ย้ายผ่าน `openclaw doctor` เท่านั้น ตอนนี้การปรับ provider/provider-map ของ Talk ให้เป็นรูปแบบปกติเปรียบเทียบด้วยความเท่ากันเชิงโครงสร้าง ดังนั้น diff ที่ต่างกันเฉพาะลำดับคีย์จะไม่ทำให้เกิดการเปลี่ยนแปลง `doctor --fix` แบบไม่มีผลซ้ำอีกต่อไป

  </Accordion>
  <Accordion title="3a. การย้าย manifest ของ Plugin แบบเดิม">
    Doctor สแกน manifest ของ Plugin ที่ติดตั้งทั้งหมดเพื่อหาคีย์ capability ระดับบนสุดที่เลิกใช้แล้ว (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) เมื่อพบ จะเสนอให้ย้ายรายการเหล่านั้นเข้าไปในอ็อบเจ็กต์ `contracts` และเขียนไฟล์ manifest ใหม่ในที่เดิม การย้ายนี้ทำซ้ำได้โดยไม่เกิดผลซ้ำ; หากคีย์ `contracts` มีค่าเดียวกันอยู่แล้ว คีย์เดิมจะถูกลบโดยไม่ทำซ้ำข้อมูล
  </Accordion>
  <Accordion title="3b. การย้ายที่เก็บ cron แบบเดิม">
    Doctor ยังตรวจสอบที่เก็บงาน cron (`~/.openclaw/cron/jobs.json` โดยค่าเริ่มต้น หรือ `cron.store` เมื่อถูกแทนที่) เพื่อหารูปแบบงานเก่าที่ตัวจัดตารางเวลายังยอมรับเพื่อความเข้ากันได้

    การล้าง cron ปัจจุบันประกอบด้วย:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - ฟิลด์ payload ระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
    - ฟิลด์ delivery ระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - นามแฝง delivery `provider` ของ payload → `delivery.channel` แบบชัดเจน
    - งาน fallback webhook แบบเดิมอย่างง่าย `notify: true` → `delivery.mode="webhook"` แบบชัดเจน พร้อม `delivery.to=cron.webhook`

    Doctor จะย้ายข้อมูลอัตโนมัติเฉพาะงาน `notify: true` เมื่อสามารถทำได้โดยไม่เปลี่ยนพฤติกรรม หากงานหนึ่งผสม fallback notify แบบเดิมเข้ากับโหมด delivery ที่มีอยู่ซึ่งไม่ใช่ webhook อยู่แล้ว doctor จะเตือนและปล่อยให้งานนั้นรอตรวจสอบด้วยตนเอง

    บน Linux doctor จะเตือนด้วยเมื่อ crontab ของผู้ใช้ยังเรียกใช้ `~/.openclaw/bin/ensure-whatsapp.sh` แบบเดิม สคริปต์เฉพาะเครื่องโฮสต์นี้ไม่ได้รับการดูแลโดย OpenClaw ปัจจุบัน และอาจเขียนข้อความ `Gateway inactive` ที่ไม่ถูกต้องไปยัง `~/.openclaw/logs/whatsapp-health.log` เมื่อ cron เข้าถึง systemd user bus ไม่ได้ ให้ลบรายการ crontab ที่ค้างอยู่ด้วย `crontab -e`; ใช้ `openclaw channels status --probe`, `openclaw doctor` และ `openclaw gateway status` สำหรับการตรวจสอบสถานะปัจจุบัน

  </Accordion>
  <Accordion title="3c. Session lock cleanup">
    Doctor จะสแกนไดเรกทอรีเซสชันของ agent ทุกตัวเพื่อหาไฟล์ write-lock ที่ค้างอยู่ ซึ่งเป็นไฟล์ที่หลงเหลือเมื่อเซสชันออกอย่างผิดปกติ สำหรับแต่ละไฟล์ lock ที่พบ ระบบจะรายงาน: เส้นทาง, PID, ว่า PID ยังมีชีวิตอยู่หรือไม่, อายุของ lock และว่าถูกจัดว่าเป็นของค้างหรือไม่ (PID ตายแล้ว, เก่ากว่า 30 นาที หรือ PID ที่ยังมีชีวิตซึ่งพิสูจน์ได้ว่าเป็นของกระบวนการที่ไม่ใช่ OpenClaw) ในโหมด `--fix` / `--repair` ระบบจะลบไฟล์ lock ที่ค้างอยู่โดยอัตโนมัติ ไม่เช่นนั้นจะพิมพ์หมายเหตุและบอกให้คุณรันอีกครั้งพร้อม `--fix`
  </Accordion>
  <Accordion title="3d. Session transcript branch repair">
    Doctor จะสแกนไฟล์ JSONL ของเซสชัน agent เพื่อหารูปแบบ branch ซ้ำที่เกิดจากบั๊กการเขียน prompt transcript ใหม่ใน 2026.4.24: turn ของผู้ใช้ที่ถูกทิ้งซึ่งมีบริบท runtime ภายในของ OpenClaw พร้อม sibling ที่ใช้งานอยู่ซึ่งมี prompt ผู้ใช้ที่มองเห็นเหมือนกัน ในโหมด `--fix` / `--repair` doctor จะสำรองไฟล์ที่ได้รับผลกระทบแต่ละไฟล์ไว้ข้างไฟล์ต้นฉบับ แล้วเขียน transcript ใหม่ให้เป็น branch ที่ใช้งานอยู่ เพื่อให้ประวัติ Gateway และตัวอ่านหน่วยความจำไม่เห็น turn ซ้ำอีกต่อไป
  </Accordion>
  <Accordion title="4. State integrity checks (session persistence, routing, and safety)">
    ไดเรกทอรี state คือแกนกลางการทำงาน หากมันหายไป คุณจะสูญเสียเซสชัน ข้อมูลรับรอง บันทึก และ config (เว้นแต่คุณมีข้อมูลสำรองอยู่ที่อื่น)

    Doctor ตรวจสอบ:

    - **ไดเรกทอรี state หายไป**: เตือนเกี่ยวกับการสูญเสีย state อย่างร้ายแรง แจ้งให้สร้างไดเรกทอรีใหม่ และย้ำว่าไม่สามารถกู้ข้อมูลที่หายไปได้
    - **สิทธิ์ของไดเรกทอรี state**: ตรวจสอบว่าสามารถเขียนได้หรือไม่ เสนอให้ซ่อมแซมสิทธิ์ (และแสดงคำแนะนำ `chown` เมื่อตรวจพบว่าเจ้าของ/กลุ่มไม่ตรงกัน)
    - **ไดเรกทอรี state ที่ซิงก์กับคลาวด์บน macOS**: เตือนเมื่อ state ชี้ไปใต้ iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ `~/Library/CloudStorage/...` เพราะเส้นทางที่มีการซิงก์รองรับอาจทำให้ I/O ช้าลงและเกิดการแข่งขันของ lock/การซิงก์
    - **ไดเรกทอรี state บน SD หรือ eMMC ของ Linux**: เตือนเมื่อ state ชี้ไปยังแหล่ง mount `mmcblk*` เพราะ random I/O ที่อิง SD หรือ eMMC อาจช้ากว่าและสึกหรอเร็วขึ้นเมื่อมีการเขียนเซสชันและข้อมูลรับรอง
    - **ไดเรกทอรีเซสชันหายไป**: ต้องมี `sessions/` และไดเรกทอรี session store เพื่อคงประวัติและหลีกเลี่ยง crash แบบ `ENOENT`
    - **Transcript ไม่ตรงกัน**: เตือนเมื่อรายการเซสชันล่าสุดมีไฟล์ transcript หายไป
    - **เซสชันหลัก "JSONL 1 บรรทัด"**: ทำเครื่องหมายเมื่อ transcript หลักมีเพียงบรรทัดเดียว (ประวัติไม่ได้สะสม)
    - **มีไดเรกทอรี state หลายชุด**: เตือนเมื่อมีโฟลเดอร์ `~/.openclaw` หลายชุดใน home directory ต่าง ๆ หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (ประวัติอาจแยกกันระหว่างการติดตั้ง)
    - **ตัวเตือนโหมด remote**: หาก `gateway.mode=remote` doctor จะเตือนให้คุณรันบนโฮสต์ remote (state อยู่ที่นั่น)
    - **สิทธิ์ของไฟล์ config**: เตือนหาก `~/.openclaw/openclaw.json` อ่านได้โดยกลุ่ม/ทุกคน และเสนอให้ปรับเข้มงวดเป็น `600`

  </Accordion>
  <Accordion title="5. Model auth health (OAuth expiry)">
    Doctor ตรวจสอบโปรไฟล์ OAuth ใน auth store เตือนเมื่อ token กำลังจะหมดอายุ/หมดอายุแล้ว และสามารถ refresh ได้เมื่อปลอดภัย หากโปรไฟล์ Anthropic OAuth/token ค้างเก่า ระบบจะแนะนำ Anthropic API key หรือเส้นทาง setup-token ของ Anthropic prompt สำหรับ refresh จะแสดงเฉพาะเมื่อรันแบบโต้ตอบ (TTY); `--non-interactive` จะข้ามความพยายาม refresh

    เมื่อ OAuth refresh ล้มเหลวอย่างถาวร (เช่น `refresh_token_reused`, `invalid_grant` หรือ provider แจ้งให้คุณลงชื่อเข้าใช้อีกครั้ง) doctor จะรายงานว่าต้องยืนยันตัวตนใหม่และพิมพ์คำสั่ง `openclaw models auth login --provider ...` ที่ต้องรันอย่างชัดเจน

    Doctor ยังรายงานโปรไฟล์ auth ที่ใช้งานไม่ได้ชั่วคราวเนื่องจาก:

    - cooldown สั้น ๆ (rate limits/timeouts/auth failures)
    - การปิดใช้งานที่นานกว่า (billing/credit failures)

  </Accordion>
  <Accordion title="6. Hooks model validation">
    หากตั้งค่า `hooks.gmail.model` ไว้ doctor จะตรวจสอบ model reference กับ catalog และ allowlist แล้วเตือนเมื่อ resolve ไม่ได้หรือไม่อนุญาต
  </Accordion>
  <Accordion title="7. Sandbox image repair">
    เมื่อเปิดใช้ sandboxing doctor จะตรวจสอบ Docker images และเสนอให้ build หรือสลับไปใช้ชื่อ legacy หาก image ปัจจุบันหายไป
  </Accordion>
  <Accordion title="7b. Plugin install cleanup">
    Doctor จะลบ state staging dependency ของ Plugin แบบเดิมที่ OpenClaw สร้างขึ้นในโหมด `openclaw doctor --fix` / `openclaw doctor --repair` ซึ่งครอบคลุม dependency root ที่สร้างไว้และค้างเก่า, ไดเรกทอรี install-stage เก่า, เศษไฟล์เฉพาะ package จากโค้ดซ่อมแซม dependency ของ bundled-plugin รุ่นก่อน และสำเนา npm ที่จัดการไว้ของ Plugin `@openclaw/*` แบบ bundled ที่ orphaned หรือ recovered ซึ่งอาจ shadow manifest แบบ bundled ปัจจุบัน Doctor ยัง relink package `openclaw` ของโฮสต์เข้าไปใน Plugin npm ที่จัดการไว้ซึ่งประกาศ `peerDependencies.openclaw` เพื่อให้ runtime import เฉพาะ package เช่น `openclaw/plugin-sdk/*` ยังคง resolve ได้หลังการอัปเดตหรือการซ่อมแซม npm

    Doctor ยังสามารถติดตั้ง Plugin แบบดาวน์โหลดได้ที่หายไปใหม่ เมื่อ config อ้างถึง Plugin เหล่านั้นแต่ registry Plugin ภายในเครื่องหาไม่พบ ตัวอย่างได้แก่ `plugins.entries` ที่เป็นสาระสำคัญ, การตั้งค่า channel/provider/search ที่กำหนดไว้ และ runtime ของ agent ที่กำหนดไว้ ระหว่างการอัปเดต package doctor จะหลีกเลี่ยงการรันการซ่อม Plugin ด้วย package-manager ขณะที่ core package กำลังถูกสลับ ให้รัน `openclaw doctor --fix` อีกครั้งหลังอัปเดต หาก Plugin ที่กำหนดค่าไว้ยังต้องกู้คืน การเริ่มต้น Gateway และการ reload config จะไม่รัน package manager; การติดตั้ง Plugin ยังคงเป็นงาน doctor/install/update ที่ต้องทำอย่างชัดเจน

  </Accordion>
  <Accordion title="8. Gateway service migrations and cleanup hints">
    Doctor ตรวจพบบริการ Gateway แบบเดิม (launchd/systemd/schtasks) และเสนอให้ลบออกแล้วติดตั้งบริการ OpenClaw โดยใช้พอร์ต Gateway ปัจจุบัน นอกจากนี้ยังสแกนหาบริการอื่นที่คล้าย Gateway และพิมพ์คำแนะนำการ cleanup ได้ด้วย บริการ OpenClaw Gateway ที่ตั้งชื่อตามโปรไฟล์ถือเป็นบริการชั้นหนึ่ง และจะไม่ถูกทำเครื่องหมายเป็น "extra"

    บน Linux หากบริการ Gateway ระดับผู้ใช้หายไปแต่มีบริการ OpenClaw Gateway ระดับระบบอยู่ doctor จะไม่ติดตั้งบริการระดับผู้ใช้อีกชุดโดยอัตโนมัติ ตรวจสอบด้วย `openclaw gateway status --deep` หรือ `openclaw doctor --deep` จากนั้นลบรายการซ้ำหรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ supervisor ระดับระบบเป็นผู้ดูแลวงจรชีวิตของ Gateway

  </Accordion>
  <Accordion title="8b. Startup Matrix migration">
    เมื่อบัญชี channel ของ Matrix มีการย้าย state legacy ที่ค้างอยู่หรือดำเนินการได้ doctor (ในโหมด `--fix` / `--repair`) จะสร้าง snapshot ก่อนการย้าย แล้วรันขั้นตอนการย้ายแบบ best-effort: การย้าย state legacy ของ Matrix และการเตรียม encrypted-state legacy ทั้งสองขั้นตอนไม่เป็น fatal; ข้อผิดพลาดจะถูกบันทึกและการเริ่มต้นจะดำเนินต่อ ในโหมดอ่านอย่างเดียว (`openclaw doctor` โดยไม่มี `--fix`) การตรวจสอบนี้จะถูกข้ามทั้งหมด
  </Accordion>
  <Accordion title="8c. Device pairing and auth drift">
    ตอนนี้ Doctor ตรวจสอบ state การจับคู่อุปกรณ์เป็นส่วนหนึ่งของรอบตรวจสุขภาพปกติ

    สิ่งที่รายงาน:

    - คำขอจับคู่ครั้งแรกที่ค้างอยู่
    - การอัปเกรด role ที่ค้างอยู่สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การอัปเกรด scope ที่ค้างอยู่สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การซ่อมแซม public-key mismatch เมื่อ device id ยังตรงกันแต่ identity ของอุปกรณ์ไม่ตรงกับระเบียนที่อนุมัติอีกต่อไป
    - ระเบียนที่จับคู่แล้วซึ่งไม่มี token ที่ใช้งานอยู่สำหรับ role ที่อนุมัติ
    - token ที่จับคู่แล้วซึ่ง scope เบี่ยงออกจาก baseline การจับคู่ที่อนุมัติ
    - รายการ device-token ที่แคชไว้ในเครื่องสำหรับเครื่องปัจจุบัน ซึ่งเก่ากว่าการ rotate token ฝั่ง Gateway หรือมี metadata scope ที่ค้างเก่า

    Doctor จะไม่อนุมัติคำขอจับคู่โดยอัตโนมัติหรือ rotate token อุปกรณ์โดยอัตโนมัติ แต่จะพิมพ์ขั้นตอนถัดไปที่ชัดเจนแทน:

    - ตรวจสอบคำขอที่ค้างอยู่ด้วย `openclaw devices list`
    - อนุมัติคำขอที่ระบุด้วย `openclaw devices approve <requestId>`
    - rotate token ใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
    - ลบและอนุมัติระเบียนที่ค้างเก่าใหม่ด้วย `openclaw devices remove <deviceId>`

    สิ่งนี้ปิดช่องโหว่ทั่วไปของ "จับคู่แล้วแต่ยังถูกแจ้งว่าต้องจับคู่": ตอนนี้ doctor แยกแยะการจับคู่ครั้งแรกออกจากการอัปเกรด role/scope ที่ค้างอยู่ และจาก token/device-identity drift ที่ค้างเก่า

  </Accordion>
  <Accordion title="9. Security warnings">
    Doctor จะแสดงคำเตือนเมื่อ provider เปิดรับ DM โดยไม่มี allowlist หรือเมื่อนโยบายถูกกำหนดค่าในลักษณะที่อันตราย
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    หากรันเป็นบริการผู้ใช้ systemd doctor จะตรวจสอบให้แน่ใจว่าเปิดใช้ lingering เพื่อให้ Gateway ยังทำงานอยู่หลัง logout
  </Accordion>
  <Accordion title="11. Workspace status (skills, plugins, and legacy dirs)">
    Doctor พิมพ์สรุป state ของ workspace สำหรับ agent เริ่มต้น:

    - **สถานะ Skills**: นับ Skills ที่มีสิทธิ์ใช้งาน, ขาด requirements และถูก allowlist บล็อก
    - **ไดเรกทอรี workspace แบบเดิม**: เตือนเมื่อมี `~/openclaw` หรือไดเรกทอรี workspace แบบเดิมอื่น ๆ อยู่เคียงข้าง workspace ปัจจุบัน
    - **สถานะ Plugin**: นับ Plugin ที่เปิดใช้/ปิดใช้/เกิดข้อผิดพลาด; แสดงรายการ ID ของ Plugin สำหรับข้อผิดพลาดใด ๆ; รายงานความสามารถของ bundle Plugin
    - **คำเตือนความเข้ากันได้ของ Plugin**: ทำเครื่องหมาย Plugin ที่มีปัญหาความเข้ากันได้กับ runtime ปัจจุบัน
    - **การวินิจฉัย Plugin**: แสดงคำเตือนหรือข้อผิดพลาดใด ๆ ระหว่างโหลดที่ปล่อยออกมาจาก registry Plugin

  </Accordion>
  <Accordion title="11b. Bootstrap file size">
    Doctor ตรวจสอบว่าไฟล์ bootstrap ของ workspace (เช่น `AGENTS.md`, `CLAUDE.md` หรือไฟล์บริบทอื่นที่ inject เข้ามา) ใกล้หรือเกินงบจำนวนอักขระที่กำหนดไว้หรือไม่ โดยรายงานจำนวนอักขระดิบเทียบกับอักขระที่ inject แล้วต่อไฟล์, เปอร์เซ็นต์การตัดทอน, สาเหตุการตัดทอน (`max/file` หรือ `max/total`) และจำนวนอักขระที่ inject ทั้งหมดเป็นสัดส่วนของงบทั้งหมด เมื่อไฟล์ถูกตัดทอนหรือใกล้ถึงขีดจำกัด doctor จะพิมพ์คำแนะนำสำหรับปรับ `agents.defaults.bootstrapMaxChars` และ `agents.defaults.bootstrapTotalMaxChars`
  </Accordion>
  <Accordion title="11d. Stale channel plugin cleanup">
    เมื่อ `openclaw doctor --fix` ลบ Plugin channel ที่หายไป ระบบจะลบ config ที่ผูกกับ channel ซึ่ง dangling และอ้างถึง Plugin นั้นด้วย ได้แก่ รายการ `channels.<id>`, target ของ Heartbeat ที่ระบุชื่อ channel และ override `agents.*.models["<channel>/*"]` สิ่งนี้ป้องกัน boot loop ของ Gateway ที่ runtime ของ channel หายไปแล้วแต่ config ยังขอให้ Gateway bind เข้ากับมัน
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor ตรวจสอบว่าติดตั้ง tab completion สำหรับ shell ปัจจุบันแล้วหรือไม่ (zsh, bash, fish หรือ PowerShell):

    - หากโปรไฟล์เชลล์ใช้รูปแบบการเติมคำสั่งแบบไดนามิกที่ช้า (`source <(openclaw completion ...)`) doctor จะอัปเกรดเป็นรูปแบบไฟล์แคชที่เร็วกว่า
    - หากมีการกำหนดค่าการเติมคำสั่งในโปรไฟล์ แต่ไฟล์แคชหายไป doctor จะสร้างแคชใหม่โดยอัตโนมัติ
    - หากไม่มีการกำหนดค่าการเติมคำสั่งเลย doctor จะแจ้งให้ติดตั้ง (เฉพาะโหมดโต้ตอบเท่านั้น; ข้ามเมื่อใช้ `--non-interactive`)

    เรียกใช้ `openclaw completion --write-state` เพื่อสร้างแคชใหม่ด้วยตนเอง

  </Accordion>
  <Accordion title="12. การตรวจสอบการยืนยันตัวตนของ Gateway (โทเค็นภายในเครื่อง)">
    Doctor ตรวจสอบความพร้อมของการยืนยันตัวตนด้วยโทเค็น Gateway ภายในเครื่อง

    - หากโหมดโทเค็นต้องใช้โทเค็นและไม่มีแหล่งที่มาของโทเค็น doctor จะเสนอให้สร้างให้
    - หาก `gateway.auth.token` จัดการโดย SecretRef แต่ไม่พร้อมใช้งาน doctor จะเตือนและไม่เขียนทับด้วยข้อความธรรมดา
    - `openclaw doctor --generate-gateway-token` จะบังคับสร้างเฉพาะเมื่อไม่ได้กำหนดค่า SecretRef สำหรับโทเค็นไว้

  </Accordion>
  <Accordion title="12b. การซ่อมแซมแบบอ่านอย่างเดียวที่รับรู้ SecretRef">
    โฟลว์การซ่อมแซมบางอย่างต้องตรวจสอบข้อมูลรับรองที่กำหนดค่าไว้โดยไม่ลดทอนพฤติกรรม fail-fast ขณะรันไทม์

    - ตอนนี้ `openclaw doctor --fix` ใช้โมเดลสรุป SecretRef แบบอ่านอย่างเดียวเดียวกับคำสั่งตระกูลสถานะสำหรับการซ่อมแซมการกำหนดค่าแบบเจาะจง
    - ตัวอย่าง: การซ่อมแซม Telegram `allowFrom` / `groupAllowFrom` `@username` จะพยายามใช้ข้อมูลรับรองบอตที่กำหนดค่าไว้เมื่อพร้อมใช้งาน
    - หากมีการกำหนดค่าโทเค็นบอต Telegram ผ่าน SecretRef แต่ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานว่ามีการกำหนดค่าข้อมูลรับรองไว้แต่ไม่พร้อมใช้งาน และข้ามการแก้ไขอัตโนมัติแทนที่จะหยุดทำงานหรือรายงานผิดว่าโทเค็นหายไป

  </Accordion>
  <Accordion title="13. การตรวจสุขภาพ Gateway + การรีสตาร์ต">
    Doctor เรียกใช้การตรวจสุขภาพและเสนอให้รีสตาร์ต Gateway เมื่อดูเหมือนไม่สมบูรณ์
  </Accordion>
  <Accordion title="13b. ความพร้อมของการค้นหาหน่วยความจำ">
    Doctor ตรวจสอบว่า embedding provider สำหรับการค้นหาหน่วยความจำที่กำหนดค่าไว้นั้นพร้อมสำหรับเอเจนต์เริ่มต้นหรือไม่ พฤติกรรมขึ้นอยู่กับ backend และ provider ที่กำหนดค่าไว้:

    - **QMD backend**: ตรวจสอบว่าไบนารี `qmd` พร้อมใช้งานและเริ่มได้หรือไม่ หากไม่พร้อม จะพิมพ์คำแนะนำการแก้ไขรวมถึงแพ็กเกจ npm และตัวเลือกเส้นทางไบนารีด้วยตนเอง
    - **Provider ภายในเครื่องแบบชัดเจน**: ตรวจสอบไฟล์โมเดลภายในเครื่องหรือ URL โมเดลระยะไกล/ดาวน์โหลดได้ที่รู้จัก หากหายไป จะแนะนำให้เปลี่ยนไปใช้ provider ระยะไกล
    - **Provider ระยะไกลแบบชัดเจน** (`openai`, `voyage` ฯลฯ): ตรวจสอบว่ามี API key อยู่ใน environment หรือ auth store พิมพ์คำแนะนำการแก้ไขที่ดำเนินการได้หากหายไป
    - **Provider อัตโนมัติ**: ตรวจสอบความพร้อมของโมเดลภายในเครื่องก่อน จากนั้นลอง provider ระยะไกลแต่ละรายการตามลำดับการเลือกอัตโนมัติ

    เมื่อมีผลการตรวจสอบ Gateway ที่แคชไว้ (Gateway สมบูรณ์ในเวลาที่ตรวจสอบ) doctor จะอ้างอิงข้ามผลลัพธ์กับการกำหนดค่าที่ CLI มองเห็นและระบุความคลาดเคลื่อนใด ๆ Doctor จะไม่เริ่ม ping embedding ใหม่บนเส้นทางเริ่มต้น; ใช้คำสั่งสถานะหน่วยความจำเชิงลึกเมื่อต้องการตรวจสอบ provider แบบสด

    ใช้ `openclaw memory status --deep` เพื่อตรวจสอบความพร้อมของ embedding ขณะรันไทม์

  </Accordion>
  <Accordion title="14. คำเตือนสถานะช่องทาง">
    หาก Gateway สมบูรณ์ doctor จะเรียกใช้การตรวจสอบสถานะช่องทางและรายงานคำเตือนพร้อมคำแนะนำการแก้ไข
  </Accordion>
  <Accordion title="15. การตรวจสอบ + ซ่อมแซมการกำหนดค่า supervisor">
    Doctor ตรวจสอบการกำหนดค่า supervisor ที่ติดตั้งไว้ (launchd/systemd/schtasks) สำหรับค่าเริ่มต้นที่หายไปหรือล้าสมัย (เช่น dependency ของ systemd network-online และระยะหน่วงการรีสตาร์ต) เมื่อพบความไม่ตรงกัน จะแนะนำการอัปเดตและสามารถเขียนไฟล์ service/task ใหม่เป็นค่าเริ่มต้นปัจจุบันได้

    หมายเหตุ:

    - `openclaw doctor` จะแจ้งก่อนเขียนการกำหนดค่า supervisor ใหม่
    - `openclaw doctor --yes` ยอมรับพรอมป์การซ่อมแซมเริ่มต้น
    - `openclaw doctor --repair` ใช้การแก้ไขที่แนะนำโดยไม่แสดงพรอมป์
    - `openclaw doctor --repair --force` เขียนทับการกำหนดค่า supervisor แบบกำหนดเอง
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` ทำให้ doctor เป็นแบบอ่านอย่างเดียวสำหรับวงจรชีวิต service ของ Gateway โดยยังคงรายงานสุขภาพ service และเรียกใช้การซ่อมแซมที่ไม่ใช่ service แต่ข้ามการติดตั้ง/เริ่ม/รีสตาร์ต/บูตสแตรป service, การเขียนการกำหนดค่า supervisor ใหม่ และการล้าง service เก่า เพราะมี supervisor ภายนอกเป็นเจ้าของวงจรชีวิตนั้น
    - บน Linux doctor จะไม่เขียน metadata ของคำสั่ง/entrypoint ใหม่ขณะที่ unit systemd ของ Gateway ที่ตรงกันกำลังทำงานอยู่ นอกจากนี้ยังละเว้น unit คล้าย Gateway เพิ่มเติมที่ไม่ใช่ legacy และไม่ได้ทำงานในระหว่างการสแกน service ซ้ำ เพื่อไม่ให้ไฟล์ service ร่วมสร้างสัญญาณรบกวนในการล้างข้อมูล
    - หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็นและ `gateway.auth.token` จัดการโดย SecretRef การติดตั้ง/ซ่อมแซม service ของ doctor จะตรวจสอบ SecretRef แต่จะไม่บันทึกค่าโทเค็นข้อความธรรมดาที่ resolve แล้วลงใน metadata environment ของ service supervisor
    - Doctor ตรวจพบค่า environment ของ service ที่จัดการผ่าน `.env`/SecretRef ซึ่งการติดตั้ง LaunchAgent, systemd หรือ Windows Scheduled Task รุ่นเก่าฝังไว้แบบ inline และเขียน metadata ของ service ใหม่เพื่อให้ค่าเหล่านั้นโหลดจากแหล่งที่มารันไทม์แทนคำจำกัดความของ supervisor
    - Doctor ตรวจพบเมื่อคำสั่ง service ยังตรึง `--port` เก่าไว้หลังจาก `gateway.port` เปลี่ยน และเขียน metadata ของ service ใหม่ให้เป็นพอร์ตปัจจุบัน
    - หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็นและ SecretRef โทเค็นที่กำหนดค่าไว้ยังไม่ได้ resolve doctor จะบล็อกเส้นทางติดตั้ง/ซ่อมแซมพร้อมคำแนะนำที่ดำเนินการได้
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้งค่าโหมดอย่างชัดเจน
    - สำหรับ unit user-systemd บน Linux ตอนนี้การตรวจสอบ token drift ของ doctor รวมทั้งแหล่งที่มา `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบ metadata การยืนยันตัวตนของ service
    - การซ่อมแซม service ของ Doctor จะปฏิเสธการเขียนใหม่ หยุด หรือรีสตาร์ต service ของ Gateway จากไบนารี OpenClaw รุ่นเก่า เมื่อการกำหนดค่าถูกเขียนครั้งล่าสุดโดยเวอร์ชันใหม่กว่า ดู [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)
    - คุณสามารถบังคับเขียนใหม่ทั้งหมดได้เสมอผ่าน `openclaw gateway install --force`

  </Accordion>
  <Accordion title="16. การวินิจฉัยรันไทม์ + พอร์ตของ Gateway">
    Doctor ตรวจสอบรันไทม์ของ service (PID, สถานะออกครั้งล่าสุด) และเตือนเมื่อมีการติดตั้ง service แล้วแต่ไม่ได้ทำงานจริง นอกจากนี้ยังตรวจสอบการชนกันของพอร์ตบนพอร์ต Gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (Gateway ทำงานอยู่แล้ว, SSH tunnel)
  </Accordion>
  <Accordion title="17. แนวทางปฏิบัติที่ดีที่สุดสำหรับรันไทม์ Gateway">
    Doctor เตือนเมื่อ service ของ Gateway ทำงานบน Bun หรือเส้นทาง Node ที่จัดการด้วยเวอร์ชัน (`nvm`, `fnm`, `volta`, `asdf` ฯลฯ) ช่องทาง WhatsApp + Telegram ต้องใช้ Node และเส้นทางของตัวจัดการเวอร์ชันอาจเสียหลังอัปเกรด เพราะ service ไม่ได้โหลด shell init ของคุณ Doctor เสนอให้ย้ายไปใช้การติดตั้ง Node ของระบบเมื่อพร้อมใช้งาน (Homebrew/apt/choco)

    macOS LaunchAgents ที่ติดตั้งหรือซ่อมแซมใหม่จะใช้ PATH ระบบมาตรฐาน (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) แทนการคัดลอก PATH ของเชลล์แบบโต้ตอบ ดังนั้นไบนารีระบบที่จัดการโดย Homebrew จึงยังพร้อมใช้งาน ขณะที่ Volta, asdf, fnm, pnpm และไดเรกทอรีตัวจัดการเวอร์ชันอื่น ๆ จะไม่เปลี่ยนว่า child process ของ Node resolve ไปที่ใด service ของ Linux ยังคงเก็บ environment root แบบชัดเจน (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) และไดเรกทอรี user-bin ที่เสถียร แต่ไดเรกทอรี fallback ของตัวจัดการเวอร์ชันที่คาดเดาจะถูกเขียนลงใน PATH ของ service เฉพาะเมื่อไดเรกทอรีเหล่านั้นมีอยู่บนดิสก์เท่านั้น

  </Accordion>
  <Accordion title="18. การเขียนการกำหนดค่า + metadata ของ wizard">
    Doctor บันทึกการเปลี่ยนแปลงการกำหนดค่าใด ๆ และประทับ metadata ของ wizard เพื่อบันทึกการเรียกใช้ doctor
  </Accordion>
  <Accordion title="19. เคล็ดลับ workspace (การสำรองข้อมูล + ระบบหน่วยความจำ)">
    Doctor แนะนำระบบหน่วยความจำของ workspace เมื่อหายไป และพิมพ์เคล็ดลับการสำรองข้อมูลหาก workspace ยังไม่ได้อยู่ภายใต้ git

    ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคู่มือฉบับเต็มเกี่ยวกับโครงสร้าง workspace และการสำรองข้อมูลด้วย git (แนะนำ GitHub หรือ GitLab แบบส่วนตัว)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [runbook ของ Gateway](/th/gateway)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
