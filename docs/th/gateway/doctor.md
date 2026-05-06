---
read_when:
    - การเพิ่มหรือแก้ไขไมเกรชันของคำสั่ง doctor
    - การเริ่มใช้การเปลี่ยนแปลงการกำหนดค่าที่ไม่เข้ากันย้อนหลัง
sidebarTitle: Doctor
summary: 'คำสั่ง Doctor: การตรวจสอบสถานะ การย้ายข้อมูลการกำหนดค่า และขั้นตอนการซ่อมแซม'
title: การตรวจสุขภาพ
x-i18n:
    generated_at: "2026-05-06T17:56:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e8a1e280717b7a523ba092dec2e2f7d1c13e67a5ede30d0b4bb5a3100dc0e44
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` คือเครื่องมือซ่อมแซม + ย้ายข้อมูลสำหรับ OpenClaw เครื่องมือนี้แก้ไข config/state ที่ล้าสมัย ตรวจสอบสุขภาพ และให้ขั้นตอนซ่อมแซมที่นำไปดำเนินการได้

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

    ยอมรับค่าเริ่มต้นโดยไม่ถามยืนยัน (รวมถึงขั้นตอนการซ่อมแซม restart/service/sandbox เมื่อใช้ได้)

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    ใช้การซ่อมแซมที่แนะนำโดยไม่ถามยืนยัน (การซ่อมแซม + การ restart เมื่อปลอดภัย)

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    ใช้การซ่อมแซมเชิงรุกด้วย (เขียนทับ config ของ supervisor แบบกำหนดเอง)

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    ทำงานโดยไม่มี prompt และใช้เฉพาะการย้ายข้อมูลที่ปลอดภัย (การทำให้ config เป็นมาตรฐาน + การย้าย state บนดิสก์) ข้ามการดำเนินการ restart/service/sandbox ที่ต้องมีการยืนยันจากมนุษย์ การย้าย state แบบเดิมจะทำงานอัตโนมัติเมื่อตรวจพบ

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    สแกน service ของระบบเพื่อหา gateway install เพิ่มเติม (launchd/systemd/schtasks)

  </Tab>
</Tabs>

หากคุณต้องการตรวจสอบการเปลี่ยนแปลงก่อนเขียน ให้เปิดไฟล์ config ก่อน:

```bash
cat ~/.openclaw/openclaw.json
```

## สิ่งที่ทำ (สรุป)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - การอัปเดตก่อนเริ่มแบบเลือกได้สำหรับ git install (เฉพาะแบบ interactive)
    - การตรวจสอบความใหม่ของโปรโตคอล UI (สร้าง Control UI ใหม่เมื่อ protocol schema ใหม่กว่า)
    - การตรวจสอบสุขภาพ + prompt ให้ restart
    - สรุปสถานะ Skills (eligible/missing/blocked) และสถานะ plugin

  </Accordion>
  <Accordion title="Config and migrations">
    - การทำให้ config เป็นมาตรฐานสำหรับค่า legacy
    - การย้าย config ของ Talk จากฟิลด์แบนแบบ legacy `talk.*` ไปเป็น `talk.provider` + `talk.providers.<provider>`
    - การตรวจสอบการย้าย browser สำหรับ config ของ Chrome extension แบบ legacy และความพร้อมของ Chrome MCP
    - คำเตือนการ override provider ของ OpenCode (`models.providers.opencode` / `models.providers.opencode-go`)
    - คำเตือนการ shadowing ของ Codex OAuth (`models.providers.openai-codex`)
    - การตรวจสอบข้อกำหนดเบื้องต้นของ OAuth TLS สำหรับโปรไฟล์ OpenAI Codex OAuth
    - คำเตือน allowlist ของ plugin/tool เมื่อ `plugins.allow` จำกัดมาก แต่ tool policy ยังขอ wildcard หรือ tool ที่ plugin เป็นเจ้าของ
    - การย้าย state บนดิสก์แบบ legacy (sessions/agent dir/WhatsApp auth)
    - การย้าย key ของสัญญา manifest ของ plugin แบบ legacy (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
    - การย้าย cron store แบบ legacy (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบน, payload `provider`, งาน webhook fallback แบบง่าย `notify: true`)
    - การย้าย agent runtime-policy แบบ legacy ไปยัง `agents.defaults.agentRuntime` และ `agents.list[].agentRuntime`
    - การล้าง config ของ plugin ที่ล้าสมัยเมื่อเปิดใช้งาน plugin; เมื่อ `plugins.enabled=false` การอ้างอิง plugin ที่ล้าสมัยจะถือเป็น containment config ที่ไม่ทำงานและจะถูกเก็บไว้

  </Accordion>
  <Accordion title="State and integrity">
    - การตรวจสอบไฟล์ lock ของ session และการล้าง lock ที่ล้าสมัย
    - การซ่อมแซม transcript ของ session สำหรับ branch การเขียน prompt ใหม่ที่ซ้ำกันซึ่งสร้างโดย build 2026.4.24 ที่ได้รับผลกระทบ
    - การตรวจจับ tombstone สำหรับการกู้คืน restart ของ subagent ที่ค้าง พร้อมรองรับ `--fix` สำหรับล้าง flag การกู้คืนที่ถูก aborted และล้าสมัย เพื่อให้ startup ไม่ปฏิบัติต่อ child ว่า restart-aborted ต่อไป
    - การตรวจสอบความถูกต้องและ permission ของ state (sessions, transcripts, state dir)
    - การตรวจสอบ permission ของไฟล์ config (chmod 600) เมื่อรันภายในเครื่อง
    - สุขภาพ model auth: ตรวจสอบการหมดอายุของ OAuth, สามารถ refresh token ที่ใกล้หมดอายุ และรายงานสถานะ cooldown/disabled ของ auth-profile
    - การตรวจจับ workspace dir เพิ่มเติม (`~/openclaw`)

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - การซ่อมแซม sandbox image เมื่อเปิดใช้ sandboxing
    - การย้าย service แบบ legacy และการตรวจจับ gateway เพิ่มเติม
    - การย้าย state แบบ legacy ของ Matrix channel (ในโหมด `--fix` / `--repair`)
    - การตรวจสอบ runtime ของ Gateway (ติดตั้ง service แล้วแต่ไม่ทำงาน; label ของ launchd ที่ cache ไว้)
    - คำเตือนสถานะ channel (probe จาก gateway ที่กำลังทำงาน)
    - การตรวจสอบการตอบสนองของ WhatsApp สำหรับสุขภาพ event-loop ของ Gateway ที่เสื่อมลงขณะที่ client TUI ภายในเครื่องยังทำงานอยู่; `--fix` จะหยุดเฉพาะ client TUI ภายในเครื่องที่ยืนยันแล้วเท่านั้น
    - การซ่อมแซม route ของ Codex สำหรับ model refs แบบ legacy `openai-codex/*` ในโมเดลหลัก, fallback, override ของ heartbeat/subagent/compaction, hooks, override ของโมเดล channel และ route pin ของ session; `--fix` เขียนใหม่เป็น `openai/*` และเลือก `agentRuntime.id: "codex"` เฉพาะเมื่อ Codex plugin ติดตั้งแล้ว เปิดใช้งานแล้ว มี harness `codex` และมี OAuth ที่ใช้ได้ มิฉะนั้นจะเลือก `agentRuntime.id: "pi"`
    - การ audit config ของ supervisor (launchd/systemd/schtasks) พร้อมการซ่อมแซมแบบเลือกได้
    - การล้างสภาพแวดล้อม proxy แบบฝังสำหรับ gateway service ที่จับค่า shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` ระหว่าง install หรือ update
    - การตรวจสอบแนวทางปฏิบัติที่ดีที่สุดของ runtime ของ Gateway (Node เทียบกับ Bun, path ของ version-manager)
    - การวินิจฉัย port collision ของ Gateway (ค่าเริ่มต้น `18789`)

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - คำเตือนความปลอดภัยสำหรับนโยบาย DM แบบเปิด
    - การตรวจสอบ auth ของ Gateway สำหรับโหมด local token (เสนอการสร้าง token เมื่อไม่มีแหล่ง token; ไม่เขียนทับ config ของ token SecretRef)
    - การตรวจจับปัญหา device pairing (คำขอ pair ครั้งแรกที่ค้างอยู่, การอัปเกรด role/scope ที่ค้างอยู่, cache device-token ภายในเครื่องที่ล้าสมัยและ drift, และ auth drift ของ paired-record)

  </Accordion>
  <Accordion title="Workspace and shell">
    - การตรวจสอบ systemd linger บน Linux
    - การตรวจสอบขนาดไฟล์ bootstrap ของ workspace (คำเตือน truncation/ใกล้ถึงขีดจำกัดสำหรับไฟล์ context)
    - การตรวจสอบความพร้อมของ Skills สำหรับ agent เริ่มต้น; รายงาน skills ที่อนุญาตซึ่งขาด bin, env, config หรือข้อกำหนด OS และ `--fix` สามารถปิดใช้ skills ที่ไม่พร้อมใช้งานใน `skills.entries`
    - การตรวจสอบสถานะ shell completion และการติดตั้ง/อัปเกรดอัตโนมัติ
    - การตรวจสอบความพร้อมของ provider สำหรับ memory search embedding (model ภายในเครื่อง, remote API key หรือ QMD binary)
    - การตรวจสอบ source install (pnpm workspace ไม่ตรงกัน, ไม่มี UI assets, ไม่มี tsx binary)
    - เขียน config ที่อัปเดต + metadata ของ wizard

  </Accordion>
</AccordionGroup>

## การ backfill และ reset ของ Dreams UI

ฉาก Dreams ใน Control UI มีการดำเนินการ **Backfill**, **Reset** และ **Clear Grounded** สำหรับ workflow grounded dreaming การดำเนินการเหล่านี้ใช้เมธอด RPC แบบ doctor ของ gateway แต่ **ไม่ใช่** ส่วนหนึ่งของการซ่อมแซม/ย้ายข้อมูลด้วย CLI `openclaw doctor`

สิ่งที่ทำ:

- **Backfill** สแกนไฟล์ประวัติ `memory/YYYY-MM-DD.md` ใน workspace ที่ใช้งานอยู่ รัน grounded REM diary pass และเขียนรายการ backfill ที่ย้อนกลับได้ลงใน `DREAMS.md`
- **Reset** ลบเฉพาะรายการ backfill diary ที่ถูกทำเครื่องหมายไว้เหล่านั้นจาก `DREAMS.md`
- **Clear Grounded** ลบเฉพาะรายการ short-term แบบ grounded-only ที่ staged ไว้ ซึ่งมาจาก historical replay และยังไม่ได้สะสม live recall หรือ daily support

สิ่งที่การดำเนินการเหล่านี้ **ไม่** ทำด้วยตัวเอง:

- ไม่แก้ไข `MEMORY.md`
- ไม่รันการย้ายข้อมูล doctor แบบเต็ม
- ไม่ stage grounded candidates เข้าไปใน live short-term promotion store โดยอัตโนมัติ เว้นแต่คุณจะรัน staged CLI path ก่อนอย่างชัดเจน

หากคุณต้องการให้ grounded historical replay มีผลต่อ deep promotion lane ตามปกติ ให้ใช้ flow ของ CLI แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

คำสั่งนี้จะ stage grounded durable candidates เข้าไปใน short-term dreaming store โดยยังคงให้ `DREAMS.md` เป็นพื้นผิวสำหรับ review

## พฤติกรรมโดยละเอียดและเหตุผล

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    หากนี่เป็น git checkout และ doctor กำลังทำงานแบบ interactive ระบบจะเสนอให้อัปเดต (fetch/rebase/build) ก่อนรัน doctor
  </Accordion>
  <Accordion title="1. Config normalization">
    หาก config มีรูปแบบค่าแบบ legacy (เช่น `messages.ackReaction` ที่ไม่มี override เฉพาะ channel) doctor จะทำให้ค่าเหล่านั้นเป็นมาตรฐานตาม schema ปัจจุบัน

    ซึ่งรวมถึงฟิลด์แบนของ Talk แบบ legacy ด้วย config speech สาธารณะปัจจุบันของ Talk คือ `talk.provider` + `talk.providers.<provider>` และ config realtime voice คือ `talk.realtime.*` Doctor เขียนรูปแบบเก่า `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ใหม่ลงใน provider map และเขียน selector realtime ระดับบนแบบ legacy (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) ใหม่เป็น `talk.realtime`

    Doctor ยังเตือนเมื่อ `plugins.allow` ไม่ว่าง และ tool policy ใช้
    รายการ wildcard หรือ tool ที่ plugin เป็นเจ้าของ `tools.allow: ["*"]` จะ match เฉพาะ tool
    จาก plugin ที่ load จริงเท่านั้น; ไม่ได้ bypass allowlist ของ plugin แบบ exclusive
    Doctor เขียน `plugins.bundledDiscovery: "compat"` สำหรับ config allowlist แบบ
    legacy ที่ย้ายแล้วเพื่อรักษาพฤติกรรม provider ที่ bundled อยู่เดิม และ
    จากนั้นชี้ไปยังการตั้งค่า `"allowlist"` ที่เข้มงวดกว่า

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    เมื่อ config มี key ที่ deprecated แล้ว คำสั่งอื่นจะปฏิเสธการทำงานและขอให้คุณรัน `openclaw doctor`

    Doctor จะ:

    - อธิบายว่าพบ key แบบ legacy ใดบ้าง
    - แสดงการย้ายข้อมูลที่ใช้
    - เขียน `~/.openclaw/openclaw.json` ใหม่ด้วย schema ที่อัปเดตแล้ว

    การ startup ของ Gateway จะปฏิเสธรูปแบบ config แบบ legacy และขอให้คุณรัน `openclaw doctor --fix`; จะไม่เขียน `openclaw.json` ใหม่ตอน startup การย้าย cron job store จะจัดการโดย `openclaw doctor --fix` เช่นกัน

    การย้ายข้อมูลปัจจุบัน:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - การกำหนดค่าช่องทางที่ตั้งค่าไว้แต่ไม่มีนโยบายตอบกลับที่มองเห็นได้ → `messages.groupChat.visibleReplies: "message_tool"`
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
    - สำหรับช่องทางที่มี `accounts` แบบตั้งชื่อ แต่ยังมีค่าช่องทางระดับบนสุดสำหรับบัญชีเดียวค้างอยู่ ให้ย้ายค่าที่อยู่ในขอบเขตบัญชีเหล่านั้นไปยังบัญชีที่ถูกยกระดับซึ่งเลือกไว้สำหรับช่องทางนั้น (`accounts.default` สำหรับช่องทางส่วนใหญ่; Matrix สามารถคงเป้าหมายที่ตั้งชื่อ/ค่าเริ่มต้นซึ่งตรงกันอยู่แล้วไว้ได้)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - ลบ `agents.defaults.llm`; ใช้ `models.providers.<id>.timeoutSeconds` สำหรับหมดเวลาของผู้ให้บริการ/โมเดลที่ช้า
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - ลบ `browser.relayBindHost` (การตั้งค่ารีเลย์ส่วนขยายแบบเดิม)
    - `models.providers.*.api: "openai"` แบบเดิม → `"openai-completions"` (การเริ่มต้น Gateway จะข้ามผู้ให้บริการที่ตั้งค่า `api` เป็นค่า enum ในอนาคตหรือที่ไม่รู้จักด้วย แทนที่จะล้มเหลวแบบปิด)

    คำเตือนจากตัวตรวจสอบยังรวมคำแนะนำบัญชีเริ่มต้นสำหรับช่องทางหลายบัญชีด้วย:

    - หากมีการกำหนดค่ารายการ `channels.<channel>.accounts` สองรายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default` ตัวตรวจสอบจะเตือนว่าการกำหนดเส้นทางสำรองอาจเลือกบัญชีที่ไม่คาดคิด
    - หากตั้งค่า `channels.<channel>.defaultAccount` เป็น ID บัญชีที่ไม่รู้จัก ตัวตรวจสอบจะเตือนและแสดงรายการ ID บัญชีที่กำหนดค่าไว้

  </Accordion>
  <Accordion title="2b. การแทนที่ผู้ให้บริการ OpenCode">
    หากคุณเพิ่ม `models.providers.opencode`, `opencode-zen` หรือ `opencode-go` ด้วยตนเอง ค่านั้นจะแทนที่แค็ตตาล็อก OpenCode ในตัวจาก `@mariozechner/pi-ai` ซึ่งอาจบังคับให้โมเดลใช้ API ผิดตัวหรือทำให้ต้นทุนเป็นศูนย์ ตัวตรวจสอบจะเตือนเพื่อให้คุณลบการแทนที่และคืนค่าการกำหนดเส้นทาง API + ต้นทุนต่อโมเดล
  </Accordion>
  <Accordion title="2c. การย้าย Browser และความพร้อมของ Chrome MCP">
    หากการกำหนดค่าเบราว์เซอร์ของคุณยังชี้ไปยังเส้นทางส่วนขยาย Chrome ที่ถูกลบไปแล้ว ตัวตรวจสอบจะปรับให้เป็นโมเดลแนบ Chrome MCP แบบโฮสต์โลคัลปัจจุบัน:

    - `browser.profiles.*.driver: "extension"` กลายเป็น `"existing-session"`
    - `browser.relayBindHost` ถูกลบ

    ตัวตรวจสอบยังตรวจสอบเส้นทาง Chrome MCP แบบโฮสต์โลคัลเมื่อคุณใช้ `defaultProfile: "user"` หรือโปรไฟล์ `existing-session` ที่กำหนดค่าไว้:

    - ตรวจสอบว่ามีการติดตั้ง Google Chrome บนโฮสต์เดียวกันสำหรับโปรไฟล์เชื่อมต่ออัตโนมัติค่าเริ่มต้นหรือไม่
    - ตรวจสอบเวอร์ชัน Chrome ที่ตรวจพบและเตือนเมื่อเวอร์ชันต่ำกว่า Chrome 144
    - เตือนให้คุณเปิดใช้การดีบักระยะไกลในหน้าตรวจสอบของเบราว์เซอร์ (เช่น `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` หรือ `edge://inspect/#remote-debugging`)

    ตัวตรวจสอบไม่สามารถเปิดใช้การตั้งค่าฝั่ง Chrome ให้คุณได้ Chrome MCP แบบโฮสต์โลคัลยังต้องมี:

    - เบราว์เซอร์ที่ใช้ Chromium 144+ บนโฮสต์ gateway/node
    - เบราว์เซอร์ทำงานอยู่ในเครื่อง
    - เปิดใช้การดีบักระยะไกลในเบราว์เซอร์นั้น
    - อนุมัติพรอมต์ยินยอมการแนบครั้งแรกในเบราว์เซอร์

    ความพร้อมในที่นี้เกี่ยวกับข้อกำหนดเบื้องต้นของการแนบในเครื่องเท่านั้น Existing-session ยังคงใช้ขีดจำกัดเส้นทาง Chrome MCP ปัจจุบัน เส้นทางขั้นสูงอย่าง `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และการทำงานแบบแบตช์ยังต้องใช้เบราว์เซอร์ที่จัดการหรือโปรไฟล์ CDP ดิบ

    การตรวจสอบนี้ **ไม่** ใช้กับ Docker, sandbox, remote-browser หรือโฟลว์ headless อื่นๆ โฟลว์เหล่านั้นยังคงใช้ CDP ดิบต่อไป

  </Accordion>
  <Accordion title="2d. ข้อกำหนดเบื้องต้นของ OAuth TLS">
    เมื่อกำหนดค่าโปรไฟล์ OpenAI Codex OAuth ตัวตรวจสอบจะโพรบปลายทางการอนุญาตของ OpenAI เพื่อตรวจสอบว่า Node/OpenSSL TLS stack ในเครื่องสามารถตรวจสอบความถูกต้องของเชนใบรับรองได้หรือไม่ หากการโพรบล้มเหลวด้วยข้อผิดพลาดใบรับรอง (เช่น `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ใบรับรองหมดอายุ หรือใบรับรองที่ลงนามเอง) ตัวตรวจสอบจะแสดงคำแนะนำการแก้ไขเฉพาะแพลตฟอร์ม บน macOS ที่ใช้ Homebrew Node วิธีแก้มักเป็น `brew postinstall ca-certificates` เมื่อใช้ `--deep` การโพรบจะทำงานแม้ว่า Gateway จะปกติดี
  </Accordion>
  <Accordion title="2e. การแทนที่ผู้ให้บริการ Codex OAuth">
    หากก่อนหน้านี้คุณเพิ่มการตั้งค่าการขนส่ง OpenAI แบบเดิมภายใต้ `models.providers.openai-codex` การตั้งค่าเหล่านั้นอาจบังเส้นทางผู้ให้บริการ Codex OAuth ในตัวที่รุ่นใหม่กว่าใช้โดยอัตโนมัติ ตัวตรวจสอบจะเตือนเมื่อพบการตั้งค่าการขนส่งเก่าเหล่านั้นพร้อมกับ Codex OAuth เพื่อให้คุณลบหรือเขียนการแทนที่การขนส่งที่ล้าสมัยใหม่ และนำพฤติกรรมการกำหนดเส้นทาง/สำรองในตัวกลับมา พร็อกซีแบบกำหนดเองและการแทนที่เฉพาะส่วนหัวต่างๆ ยังรองรับอยู่และจะไม่ทริกเกอร์คำเตือนนี้
  </Accordion>
  <Accordion title="2f. การซ่อมแซมเส้นทาง Codex">
    ตัวตรวจสอบจะตรวจหา refs โมเดล `openai-codex/*` แบบเดิม การกำหนดเส้นทาง native Codex harness ใช้ refs โมเดล `openai/*` แบบ canonical พร้อม `agentRuntime.id: "codex"` เพื่อให้เทิร์นผ่าน Codex app-server harness แทนเส้นทาง OpenClaw PI OpenAI

    ในโหมด `--fix` / `--repair` ตัวตรวจสอบจะเขียน refs ของเอเจนต์ค่าเริ่มต้นและรายเอเจนต์ที่ได้รับผลกระทบใหม่ รวมถึงโมเดลหลัก, fallback, การแทนที่ heartbeat/subagent/compaction, hooks, การแทนที่โมเดลช่องทาง และสถานะเส้นทางเซสชันที่คงอยู่ซึ่งล้าสมัย:

    - `openai-codex/gpt-*` กลายเป็น `openai/gpt-*`
    - รันไทม์เอเจนต์ที่ตรงกันจะกลายเป็น `agentRuntime.id: "codex"` เฉพาะเมื่อ Codex ติดตั้งอยู่ เปิดใช้งานอยู่ มีส่วนร่วมกับ `codex` harness และมี OAuth ที่ใช้งานได้
    - มิฉะนั้นรันไทม์เอเจนต์ที่ตรงกันจะกลายเป็น `agentRuntime.id: "pi"`
    - รายการ fallback ของโมเดลที่มีอยู่จะถูกคงไว้โดยเขียนรายการแบบเดิมใหม่; การตั้งค่าต่อโมเดลที่คัดลอกไว้จะย้ายจากคีย์เดิมไปยังคีย์ canonical `openai/*`
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, การแจ้ง fallback, การปักหมุดโปรไฟล์การยืนยันตัวตน และการปักหมุด Codex harness ของเซสชันที่คงอยู่จะถูกซ่อมแซมในที่เก็บเซสชันเอเจนต์ทั้งหมดที่ค้นพบ
    - `/codex ...` หมายถึง "ควบคุมหรือผูกการสนทนา native Codex จากแชต"
    - `/acp ...` หรือ `runtime: "acp"` หมายถึง "ใช้ตัวแปลง ACP/acpx ภายนอก"

  </Accordion>
  <Accordion title="2g. การล้างเส้นทางเซสชัน">
    ตัวตรวจสอบยังสแกนที่เก็บเซสชันเอเจนต์ที่ค้นพบเพื่อหาสถานะเส้นทางที่สร้างอัตโนมัติซึ่งล้าสมัย หลังจากคุณย้ายโมเดลหรือรันไทม์ที่กำหนดค่าไว้ออกจากเส้นทางที่ Plugin เป็นเจ้าของ เช่น Codex

    `openclaw doctor --fix` สามารถล้างสถานะล้าสมัยที่สร้างอัตโนมัติ เช่น การปักหมุดโมเดล `modelOverrideSource: "auto"`, เมทาดาทาโมเดลรันไทม์, ID harness ที่ปักหมุดไว้, การผูกเซสชัน CLI และการแทนที่โปรไฟล์การยืนยันตัวตนอัตโนมัติ เมื่อเส้นทางเจ้าของของสิ่งเหล่านั้นไม่ได้กำหนดค่าไว้อีกต่อไป ตัวเลือกโมเดลเซสชันของผู้ใช้ที่ระบุชัดเจนหรือแบบเดิมจะถูกรายงานให้ตรวจสอบด้วยตนเองและปล่อยไว้โดยไม่แตะต้อง; สลับด้วย `/model ...`, `/new` หรือรีเซ็ตเซสชันเมื่อไม่ต้องการใช้เส้นทางนั้นอีกต่อไป

  </Accordion>
  <Accordion title="3. การย้ายสถานะเดิม (โครงร่างดิสก์)">
    ตัวตรวจสอบสามารถย้ายโครงร่างบนดิสก์รุ่นเก่าเข้าสู่โครงสร้างปัจจุบัน:

    - ที่เก็บเซสชัน + ทรานสคริปต์:
      - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
    - ไดเรกทอรีเอเจนต์:
      - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
    - สถานะการยืนยันตัวตน WhatsApp (Baileys):
      - จาก `~/.openclaw/credentials/*.json` แบบเดิม (ยกเว้น `oauth.json`)
      - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID บัญชีค่าเริ่มต้น: `default`)

    การย้ายเหล่านี้เป็นแบบพยายามให้ดีที่สุดและทำซ้ำได้อย่างปลอดภัย; ตัวตรวจสอบจะส่งคำเตือนเมื่อทิ้งโฟลเดอร์เดิมไว้เป็นข้อมูลสำรอง Gateway/CLI ยังย้ายเซสชันเดิม + ไดเรกทอรีเอเจนต์โดยอัตโนมัติเมื่อเริ่มต้น เพื่อให้ประวัติ/การยืนยันตัวตน/โมเดลไปอยู่ในเส้นทางต่อเอเจนต์โดยไม่ต้องรันตัวตรวจสอบด้วยตนเอง การยืนยันตัวตน WhatsApp จงใจให้ย้ายผ่าน `openclaw doctor` เท่านั้น ตอนนี้การทำให้แผนที่ผู้ให้บริการ/ผู้ให้บริการ Talk เป็นมาตรฐานจะเปรียบเทียบด้วยความเท่ากันเชิงโครงสร้าง ดังนั้น diff ที่ต่างกันเฉพาะลำดับคีย์จะไม่ทริกเกอร์การเปลี่ยนแปลง `doctor --fix` แบบไม่มีผลซ้ำอีก

  </Accordion>
  <Accordion title="3a. การย้าย manifest ของ Plugin แบบเดิม">
    ตัวตรวจสอบจะสแกน manifest ของ Plugin ที่ติดตั้งทั้งหมดเพื่อหาคีย์ความสามารถระดับบนสุดที่เลิกใช้แล้ว (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) เมื่อพบแล้ว จะเสนอให้ย้ายคีย์เหล่านั้นเข้าไปในออบเจ็กต์ `contracts` และเขียนไฟล์ manifest ใหม่ในตำแหน่งเดิม การย้ายนี้ทำซ้ำได้อย่างปลอดภัย; หากคีย์ `contracts` มีค่าเดียวกันอยู่แล้ว คีย์เดิมจะถูกลบโดยไม่ทำซ้ำข้อมูล
  </Accordion>
  <Accordion title="3b. การย้ายที่เก็บ Cron แบบเดิม">
    ตัวตรวจสอบยังตรวจสอบที่เก็บงาน Cron (`~/.openclaw/cron/jobs.json` ตามค่าเริ่มต้น หรือ `cron.store` เมื่อถูกแทนที่) เพื่อหารูปแบบงานเก่าที่ตัวจัดตารางเวลายังยอมรับเพื่อความเข้ากันได้

    การล้าง Cron ปัจจุบันรวมถึง:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - ฟิลด์ payload ระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
    - ฟิลด์ delivery ระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias การส่งมอบของ `provider` ใน payload → `delivery.channel` ที่ระบุชัดเจน
    - งาน fallback webhook แบบเดิมอย่างง่าย `notify: true` → `delivery.mode="webhook"` ที่ระบุชัดเจนพร้อม `delivery.to=cron.webhook`

    Doctor จะย้ายงาน `notify: true` โดยอัตโนมัติเฉพาะเมื่อทำได้โดยไม่เปลี่ยนพฤติกรรมเท่านั้น หากงานหนึ่งรวมการสำรองแบบแจ้งเตือนเดิมเข้ากับโหมดการส่งที่มีอยู่ซึ่งไม่ใช่ webhook doctor จะเตือนและปล่อยงานนั้นไว้ให้ตรวจสอบด้วยตนเอง

    บน Linux doctor ยังเตือนเมื่อ crontab ของผู้ใช้ยังเรียกใช้ `~/.openclaw/bin/ensure-whatsapp.sh` แบบเดิมอยู่ สคริปต์เฉพาะโฮสต์นี้ไม่ได้รับการดูแลโดย OpenClaw ปัจจุบัน และอาจเขียนข้อความ `Gateway inactive` ที่เป็นเท็จไปยัง `~/.openclaw/logs/whatsapp-health.log` เมื่อ cron เข้าถึง systemd user bus ไม่ได้ ลบรายการ crontab ที่ค้างอยู่ออกด้วย `crontab -e`; ใช้ `openclaw channels status --probe`, `openclaw doctor`, และ `openclaw gateway status` สำหรับการตรวจสุขภาพปัจจุบัน

  </Accordion>
  <Accordion title="3c. การล้าง session lock">
    Doctor สแกนไดเรกทอรี session ของ agent ทุกตัวเพื่อหาไฟล์ write-lock ที่ค้างอยู่ — ไฟล์ที่ถูกทิ้งไว้เมื่อ session ออกจากการทำงานอย่างผิดปกติ สำหรับไฟล์ lock แต่ละไฟล์ที่พบ ระบบจะรายงาน: path, PID, ว่า PID ยังทำงานอยู่หรือไม่, อายุของ lock, และถือว่าค้างหรือไม่ (PID ตายแล้วหรือเก่ากว่า 30 นาที) ในโหมด `--fix` / `--repair` ระบบจะลบไฟล์ lock ที่ค้างอยู่โดยอัตโนมัติ; มิฉะนั้นจะพิมพ์หมายเหตุและสั่งให้คุณรันอีกครั้งพร้อม `--fix`
  </Accordion>
  <Accordion title="3d. การซ่อม branch ของ transcript session">
    Doctor สแกนไฟล์ JSONL ของ session agent เพื่อหารูปแบบ branch ที่ซ้ำกันซึ่งสร้างโดยบั๊กการเขียน prompt transcript ใหม่ใน 2026.4.24: user turn ที่ถูกทิ้งไว้ซึ่งมีบริบท runtime ภายในของ OpenClaw พร้อมกับ sibling ที่ active ซึ่งมี prompt ผู้ใช้ที่มองเห็นได้เหมือนกัน ในโหมด `--fix` / `--repair` doctor จะสำรองไฟล์ที่ได้รับผลกระทบแต่ละไฟล์ไว้ข้างต้นฉบับ และเขียน transcript ใหม่ไปยัง branch ที่ active เพื่อให้ gateway history และ memory readers ไม่เห็น turn ซ้ำอีกต่อไป
  </Accordion>
  <Accordion title="4. การตรวจสอบความสมบูรณ์ของสถานะ (การคงอยู่ของ session, routing, และความปลอดภัย)">
    ไดเรกทอรี state คือแกนปฏิบัติการ หากหายไป คุณจะสูญเสีย sessions, credentials, logs, และ config (เว้นแต่คุณมี backups ที่อื่น)

    Doctor ตรวจสอบ:

    - **State dir missing**: เตือนเกี่ยวกับการสูญเสีย state อย่างร้ายแรง, แจ้งให้สร้างไดเรกทอรีใหม่, และเตือนว่าไม่สามารถกู้ข้อมูลที่หายไปได้
    - **State dir permissions**: ตรวจสอบว่าสามารถเขียนได้; เสนอให้ซ่อม permissions (และแสดงคำใบ้ `chown` เมื่อตรวจพบ owner/group ไม่ตรงกัน)
    - **macOS cloud-synced state dir**: เตือนเมื่อ state resolve อยู่ใต้ iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ `~/Library/CloudStorage/...` เพราะ path ที่มี sync รองรับอาจทำให้ I/O ช้าลงและเกิด race ของ lock/sync
    - **Linux SD or eMMC state dir**: เตือนเมื่อ state resolve ไปยัง mount source แบบ `mmcblk*` เพราะ random I/O ที่รองรับด้วย SD หรือ eMMC อาจช้ากว่าและสึกหรอเร็วขึ้นภายใต้การเขียน session และ credential
    - **Session dirs missing**: จำเป็นต้องมี `sessions/` และไดเรกทอรี session store เพื่อคง history และหลีกเลี่ยง crash แบบ `ENOENT`
    - **Transcript mismatch**: เตือนเมื่อรายการ session ล่าสุดมีไฟล์ transcript ขาดหาย
    - **Main session "1-line JSONL"**: flag เมื่อ transcript หลักมีเพียงหนึ่งบรรทัด (history ไม่สะสม)
    - **Multiple state dirs**: เตือนเมื่อมีโฟลเดอร์ `~/.openclaw` หลายแห่งใน home directories หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (history อาจแยกระหว่างการติดตั้ง)
    - **Remote mode reminder**: หาก `gateway.mode=remote` doctor จะเตือนให้คุณรันบน remote host (state อยู่ที่นั่น)
    - **Config file permissions**: เตือนหาก `~/.openclaw/openclaw.json` อ่านได้โดย group/world และเสนอให้ปรับให้เข้มงวดเป็น `600`

  </Accordion>
  <Accordion title="5. สุขภาพ auth ของ model (OAuth หมดอายุ)">
    Doctor ตรวจสอบ OAuth profiles ใน auth store, เตือนเมื่อ tokens กำลังจะหมดอายุ/หมดอายุแล้ว, และสามารถ refresh ได้เมื่อปลอดภัย หาก Anthropic OAuth/token profile ค้างเก่า ระบบจะแนะนำ Anthropic API key หรือ path setup-token ของ Anthropic prompt สำหรับ refresh จะปรากฏเฉพาะเมื่อรันแบบ interactive (TTY); `--non-interactive` จะข้ามความพยายาม refresh

    เมื่อ OAuth refresh ล้มเหลวถาวร (เช่น `refresh_token_reused`, `invalid_grant`, หรือ provider แจ้งให้คุณ sign in อีกครั้ง) doctor จะรายงานว่าต้อง re-auth และพิมพ์คำสั่ง `openclaw models auth login --provider ...` ที่ต้องรันอย่าง exact

    Doctor ยังรายงาน auth profiles ที่ใช้งานไม่ได้ชั่วคราวเนื่องจาก:

    - cooldown สั้น ๆ (rate limits/timeouts/auth failures)
    - การ disable ที่นานกว่า (billing/credit failures)

  </Accordion>
  <Accordion title="6. การตรวจสอบ model ของ hooks">
    หากตั้งค่า `hooks.gmail.model` doctor จะตรวจสอบ model reference กับ catalog และ allowlist และเตือนเมื่อ resolve ไม่ได้หรือไม่อนุญาต
  </Accordion>
  <Accordion title="7. การซ่อม sandbox image">
    เมื่อเปิดใช้ sandboxing doctor จะตรวจสอบ Docker images และเสนอให้ build หรือสลับไปใช้ชื่อเดิมหาก image ปัจจุบันหายไป
  </Accordion>
  <Accordion title="7b. การล้างการติดตั้ง Plugin">
    Doctor ลบ state staging ของ dependency plugin ที่ OpenClaw สร้างแบบเดิมในโหมด `openclaw doctor --fix` / `openclaw doctor --repair` ซึ่งครอบคลุม generated dependency roots ที่ค้างอยู่, ไดเรกทอรี install-stage เก่า, debris เฉพาะ package จากโค้ดซ่อม dependency ของ bundled-plugin ก่อนหน้า, และสำเนา npm ที่จัดการแล้วของ bundled `@openclaw/*` plugins ซึ่ง orphaned หรือ recovered แล้วและอาจบดบัง bundled manifest ปัจจุบัน

    Doctor ยังสามารถติดตั้ง downloadable plugins ที่หายไปใหม่เมื่อ config อ้างถึงแต่ local plugin registry หาไม่พบ ตัวอย่างรวมถึง `plugins.entries` ที่มีสาระสำคัญ, channel/provider/search settings ที่กำหนดค่าไว้, และ agent runtimes ที่กำหนดค่าไว้ ระหว่างการอัปเดต package doctor จะหลีกเลี่ยงการรัน package-manager plugin repair ขณะที่ core package กำลังถูกสลับ; รัน `openclaw doctor --fix` อีกครั้งหลังอัปเดตหาก plugin ที่กำหนดค่าไว้ยังต้อง recovery Gateway startup และ config reload จะไม่รัน package managers; การติดตั้ง plugin ยังคงเป็นงาน doctor/install/update ที่ explicit

  </Accordion>
  <Accordion title="8. การ migrate และคำใบ้ล้างข้อมูลบริการ Gateway">
    Doctor ตรวจพบบริการ gateway แบบเดิม (launchd/systemd/schtasks) และเสนอให้ลบออกและติดตั้งบริการ OpenClaw โดยใช้ gateway port ปัจจุบัน นอกจากนี้ยังสามารถสแกนหาบริการที่คล้าย gateway เพิ่มเติมและพิมพ์คำใบ้การล้างข้อมูลได้ บริการ OpenClaw gateway ที่ตั้งชื่อตาม profile ถือเป็น first-class และจะไม่ถูก flag ว่า "extra"

    บน Linux หากบริการ gateway ระดับผู้ใช้หายไปแต่มีบริการ OpenClaw gateway ระดับระบบอยู่ doctor จะไม่ติดตั้งบริการระดับผู้ใช้ตัวที่สองโดยอัตโนมัติ ตรวจสอบด้วย `openclaw gateway status --deep` หรือ `openclaw doctor --deep` จากนั้นลบ duplicate หรือกำหนด `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ system supervisor เป็นเจ้าของ lifecycle ของ gateway

  </Accordion>
  <Accordion title="8b. การ migrate Startup Matrix">
    เมื่อ account ของ Matrix channel มี legacy state migration ที่ pending หรือ actionable doctor (ในโหมด `--fix` / `--repair`) จะสร้าง snapshot ก่อน migrate แล้วรันขั้นตอน migration แบบ best-effort: legacy Matrix state migration และ legacy encrypted-state preparation ทั้งสองขั้นตอนไม่เป็น fatal; errors จะถูก log และ startup จะดำเนินต่อไป ในโหมด read-only (`openclaw doctor` โดยไม่มี `--fix`) การตรวจนี้จะถูกข้ามทั้งหมด
  </Accordion>
  <Accordion title="8c. การจับคู่อุปกรณ์และ auth drift">
    ตอนนี้ Doctor ตรวจสอบ state การจับคู่อุปกรณ์เป็นส่วนหนึ่งของ health pass ปกติ

    สิ่งที่รายงาน:

    - คำขอจับคู่ครั้งแรกที่ pending
    - การ upgrade role ที่ pending สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การ upgrade scope ที่ pending สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การซ่อม public-key mismatch เมื่อ device id ยังตรงกันแต่ device identity ไม่ตรงกับ record ที่อนุมัติแล้วอีกต่อไป
    - paired records ที่ไม่มี active token สำหรับ role ที่อนุมัติแล้ว
    - paired tokens ที่ scopes drift ออกจาก pairing baseline ที่อนุมัติแล้ว
    - รายการ device-token ที่ cache ใน local สำหรับเครื่องปัจจุบันซึ่งเก่ากว่า token rotation ฝั่ง gateway หรือมี scope metadata ที่ค้างเก่า

    Doctor ไม่ auto-approve pair requests หรือ auto-rotate device tokens แต่จะพิมพ์ขั้นตอนถัดไปที่ exact แทน:

    - ตรวจสอบ pending requests ด้วย `openclaw devices list`
    - อนุมัติคำขอที่ exact ด้วย `openclaw devices approve <requestId>`
    - rotate token ใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
    - ลบและ re-approve record ที่ค้างเก่าด้วย `openclaw devices remove <deviceId>`

    สิ่งนี้ปิดช่องโหว่ทั่วไปแบบ "จับคู่แล้วแต่ยังได้รับ pairing required": ตอนนี้ doctor แยก first-time pairing ออกจาก pending role/scope upgrades และจาก stale token/device-identity drift

  </Accordion>
  <Accordion title="9. คำเตือนด้านความปลอดภัย">
    Doctor แสดงคำเตือนเมื่อ provider เปิดรับ DMs โดยไม่มี allowlist หรือเมื่อ policy ถูกกำหนดค่าในลักษณะที่อันตราย
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    หากรันเป็น systemd user service doctor จะตรวจให้แน่ใจว่าเปิดใช้ lingering เพื่อให้ gateway ยังทำงานหลัง logout
  </Accordion>
  <Accordion title="11. สถานะ workspace (skills, plugins, และ legacy dirs)">
    Doctor พิมพ์สรุป state ของ workspace สำหรับ default agent:

    - **Skills status**: นับ skills ที่ eligible, missing-requirements, และ allowlist-blocked
    - **Legacy workspace dirs**: เตือนเมื่อมี `~/openclaw` หรือไดเรกทอรี workspace แบบเดิมอื่น ๆ อยู่ควบคู่กับ workspace ปัจจุบัน
    - **Plugin status**: นับ plugins ที่ enabled/disabled/errored; แสดง plugin IDs สำหรับ errors ใด ๆ; รายงาน capabilities ของ bundle plugin
    - **Plugin compatibility warnings**: flag plugins ที่มี compatibility issues กับ runtime ปัจจุบัน
    - **Plugin diagnostics**: แสดง warnings หรือ errors ช่วง load-time ที่ plugin registry ส่งออกมา

  </Accordion>
  <Accordion title="11b. ขนาดไฟล์ bootstrap">
    Doctor ตรวจสอบว่าไฟล์ bootstrap ของ workspace (เช่น `AGENTS.md`, `CLAUDE.md`, หรือไฟล์ context อื่นที่ inject เข้ามา) อยู่ใกล้หรือเกิน character budget ที่กำหนดไว้หรือไม่ ระบบรายงานจำนวนอักขระ raw เทียบกับ injected ต่อไฟล์, เปอร์เซ็นต์การ truncate, สาเหตุการ truncate (`max/file` หรือ `max/total`), และจำนวนอักขระ injected รวมเป็นสัดส่วนของ budget รวม เมื่อไฟล์ถูก truncate หรือใกล้ถึงขีดจำกัด doctor จะพิมพ์เคล็ดลับสำหรับปรับ `agents.defaults.bootstrapMaxChars` และ `agents.defaults.bootstrapTotalMaxChars`
  </Accordion>
  <Accordion title="11d. การล้าง channel plugin ที่ค้างเก่า">
    เมื่อ `openclaw doctor --fix` ลบ channel plugin ที่หายไป ระบบจะลบ config ใน scope ของ channel ที่ dangling ซึ่งอ้างถึง plugin นั้นด้วย: รายการ `channels.<id>`, heartbeat targets ที่ตั้งชื่อ channel, และ overrides ของ `agents.*.models["<channel>/*"]` สิ่งนี้ป้องกัน Gateway boot loops ที่ channel runtime หายไปแล้วแต่ config ยังขอให้ gateway bind กับมัน
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor ตรวจสอบว่ามีการติดตั้ง tab completion สำหรับ shell ปัจจุบันหรือไม่ (zsh, bash, fish, หรือ PowerShell):

    - หาก shell profile ใช้รูปแบบ dynamic completion ที่ช้า (`source <(openclaw completion ...)`) doctor จะ upgrade เป็น variant แบบไฟล์ cache ที่เร็วกว่า
    - หาก completion ถูกกำหนดค่าใน profile แต่ไฟล์ cache หายไป doctor จะ regenerate cache โดยอัตโนมัติ
    - หากไม่มีการกำหนดค่า completion เลย doctor จะ prompt ให้ติดตั้ง (เฉพาะโหมด interactive; ข้ามด้วย `--non-interactive`)

    รัน `openclaw completion --write-state` เพื่อ regenerate cache ด้วยตนเอง

  </Accordion>
  <Accordion title="12. การตรวจ auth ของ Gateway (local token)">
    Doctor ตรวจสอบความพร้อมของ local gateway token auth

    - หาก token mode ต้องการ token และไม่มี token source doctor จะเสนอให้สร้าง token
    - หาก `gateway.auth.token` จัดการโดย SecretRef แต่ไม่พร้อมใช้งาน doctor จะเตือนและจะไม่ overwrite ด้วย plaintext
    - `openclaw doctor --generate-gateway-token` บังคับการสร้างเฉพาะเมื่อไม่ได้กำหนดค่า token SecretRef

  </Accordion>
  <Accordion title="12b. การซ่อมแซมที่รับรู้ SecretRef แบบอ่านอย่างเดียว">
    โฟลว์การซ่อมแซมบางรายการจำเป็นต้องตรวจสอบข้อมูลประจำตัวที่กำหนดค่าไว้โดยไม่ทำให้พฤติกรรมล้มเหลวเร็วของรันไทม์อ่อนลง

    - `openclaw doctor --fix` ตอนนี้ใช้โมเดลสรุป SecretRef แบบอ่านอย่างเดียวเดียวกับคำสั่งกลุ่มสถานะสำหรับการซ่อมแซมการกำหนดค่าแบบเจาะจง
    - ตัวอย่าง: การซ่อมแซม `allowFrom` / `groupAllowFrom` `@username` ของ Telegram จะพยายามใช้ข้อมูลประจำตัวของบอตที่กำหนดค่าไว้เมื่อพร้อมใช้งาน
    - หากโทเค็นบอต Telegram ถูกกำหนดค่าผ่าน SecretRef แต่ไม่พร้อมใช้งานในพาธคำสั่งปัจจุบัน doctor จะรายงานว่าข้อมูลประจำตัวถูกกำหนดค่าแล้วแต่ไม่พร้อมใช้งาน และข้ามการแก้ค่าอัตโนมัติแทนที่จะหยุดทำงานหรือรายงานผิดว่าโทเค็นหายไป

  </Accordion>
  <Accordion title="13. การตรวจสอบสถานะ Gateway + การรีสตาร์ต">
    Doctor เรียกใช้การตรวจสอบสถานะและเสนอให้รีสตาร์ต Gateway เมื่อดูเหมือนว่าไม่สมบูรณ์
  </Accordion>
  <Accordion title="13b. ความพร้อมของการค้นหาหน่วยความจำ">
    Doctor ตรวจสอบว่าผู้ให้บริการ embedding สำหรับการค้นหาหน่วยความจำที่กำหนดค่าไว้พร้อมสำหรับเอเจนต์เริ่มต้นหรือไม่ ลักษณะการทำงานขึ้นอยู่กับแบ็กเอนด์และผู้ให้บริการที่กำหนดค่าไว้:

    - **แบ็กเอนด์ QMD**: ตรวจสอบว่าไบนารี `qmd` พร้อมใช้งานและเริ่มทำงานได้หรือไม่ หากไม่พร้อม จะแสดงคำแนะนำในการแก้ไข รวมถึงแพ็กเกจ npm และตัวเลือกพาธไบนารีแบบกำหนดเอง
    - **ผู้ให้บริการภายในเครื่องแบบระบุชัดเจน**: ตรวจสอบไฟล์โมเดลภายในเครื่องหรือ URL โมเดลระยะไกล/ดาวน์โหลดได้ที่รู้จัก หากไม่มี จะแนะนำให้สลับไปใช้ผู้ให้บริการระยะไกล
    - **ผู้ให้บริการระยะไกลแบบระบุชัดเจน** (`openai`, `voyage` เป็นต้น): ตรวจสอบว่ามี API key อยู่ในสภาพแวดล้อมหรือที่เก็บการยืนยันตัวตน แสดงคำแนะนำการแก้ไขที่นำไปทำได้จริงหากไม่มี
    - **ผู้ให้บริการอัตโนมัติ**: ตรวจสอบความพร้อมของโมเดลภายในเครื่องก่อน จากนั้นลองผู้ให้บริการระยะไกลแต่ละรายตามลำดับการเลือกอัตโนมัติ

    เมื่อมีผลการตรวจสอบ Gateway ที่แคชไว้พร้อมใช้งาน (Gateway สมบูรณ์ ณ เวลาที่ตรวจสอบ) doctor จะเทียบผลลัพธ์นั้นกับการกำหนดค่าที่ CLI มองเห็นและระบุความคลาดเคลื่อนใดๆ Doctor จะไม่เริ่มการ ping embedding ใหม่บนพาธเริ่มต้น ให้ใช้คำสั่งสถานะหน่วยความจำแบบลึกเมื่อคุณต้องการตรวจสอบผู้ให้บริการแบบสด

    ใช้ `openclaw memory status --deep` เพื่อตรวจสอบความพร้อมของ embedding ณ รันไทม์

  </Accordion>
  <Accordion title="14. คำเตือนสถานะช่องทาง">
    หาก Gateway สมบูรณ์ doctor จะเรียกใช้การตรวจสอบสถานะช่องทางและรายงานคำเตือนพร้อมการแก้ไขที่แนะนำ
  </Accordion>
  <Accordion title="15. การตรวจสอบและซ่อมแซมการกำหนดค่า supervisor">
    Doctor ตรวจสอบการกำหนดค่า supervisor ที่ติดตั้งไว้ (launchd/systemd/schtasks) เพื่อหาค่าเริ่มต้นที่หายไปหรือล้าสมัย (เช่น การพึ่งพา network-online ของ systemd และความล่าช้าในการรีสตาร์ต) เมื่อพบความไม่ตรงกัน จะแนะนำให้อัปเดตและสามารถเขียนไฟล์บริการ/งานใหม่เป็นค่าเริ่มต้นปัจจุบันได้

    หมายเหตุ:

    - `openclaw doctor` จะแจ้งถามก่อนเขียนการกำหนดค่า supervisor ใหม่
    - `openclaw doctor --yes` ยอมรับพรอมต์ซ่อมแซมค่าเริ่มต้น
    - `openclaw doctor --repair` ใช้การแก้ไขที่แนะนำโดยไม่แจ้งถาม
    - `openclaw doctor --repair --force` เขียนทับการกำหนดค่า supervisor แบบกำหนดเอง
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` ทำให้ doctor เป็นแบบอ่านอย่างเดียวสำหรับวงจรชีวิตบริการ gateway โดยยังคงรายงานสถานะบริการและเรียกใช้การซ่อมแซมที่ไม่ใช่บริการ แต่ข้ามการติดตั้ง/เริ่ม/รีสตาร์ต/บูตสแตรปบริการ การเขียนการกำหนดค่า supervisor ใหม่ และการล้างบริการแบบเก่า เพราะ supervisor ภายนอกเป็นเจ้าของวงจรชีวิตนั้น
    - บน Linux, doctor จะไม่เขียน metadata ของคำสั่ง/entrypoint ใหม่ขณะที่ systemd gateway unit ที่ตรงกันยังทำงานอยู่ และยังละเว้น unit gateway-like เพิ่มเติมที่ไม่ได้ใช้งานและไม่ใช่แบบเก่าระหว่างการสแกนบริการซ้ำ เพื่อไม่ให้ไฟล์บริการ companion สร้างสัญญาณรบกวนในการล้างข้อมูล
    - หากการยืนยันตัวตนด้วย token ต้องใช้ token และ `gateway.auth.token` จัดการด้วย SecretRef การติดตั้ง/ซ่อมแซมบริการของ doctor จะตรวจสอบ SecretRef แต่จะไม่บันทึกค่า token แบบ plaintext ที่ resolve แล้วลงใน metadata สภาพแวดล้อมบริการของ supervisor
    - Doctor ตรวจพบค่าสภาพแวดล้อมบริการที่จัดการด้วย `.env`/SecretRef ซึ่งการติดตั้ง LaunchAgent, systemd หรือ Windows Scheduled Task รุ่นเก่าฝังไว้แบบ inline และเขียน metadata บริการใหม่เพื่อให้ค่าเหล่านั้นโหลดจากแหล่ง runtime แทนคำจำกัดความของ supervisor
    - Doctor ตรวจพบเมื่อคำสั่งบริการยังคงตรึง `--port` เก่าหลังจาก `gateway.port` เปลี่ยน และเขียน metadata บริการใหม่เป็นพอร์ตปัจจุบัน
    - หากการยืนยันตัวตนด้วย token ต้องใช้ token และ SecretRef ของ token ที่กำหนดค่าไว้ยัง resolve ไม่ได้ doctor จะบล็อกเส้นทางการติดตั้ง/ซ่อมแซมพร้อมคำแนะนำที่นำไปปฏิบัติได้
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้งค่า mode อย่างชัดเจน
    - สำหรับ Linux user-systemd units การตรวจสอบ token drift ของ doctor ตอนนี้รวมทั้งแหล่ง `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบ metadata การยืนยันตัวตนของบริการ
    - การซ่อมแซมบริการของ Doctor จะปฏิเสธการเขียนใหม่ หยุด หรือรีสตาร์ตบริการ gateway จากไบนารี OpenClaw รุ่นเก่า เมื่อ config ถูกเขียนครั้งล่าสุดโดยเวอร์ชันที่ใหม่กว่า ดู [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)
    - คุณสามารถบังคับให้เขียนใหม่ทั้งหมดได้เสมอผ่าน `openclaw gateway install --force`

  </Accordion>
  <Accordion title="16. การวินิจฉัย Gateway runtime + พอร์ต">
    Doctor ตรวจสอบ runtime ของบริการ (PID, สถานะออกล่าสุด) และเตือนเมื่อบริการติดตั้งแล้วแต่ไม่ได้ทำงานจริง และยังตรวจสอบการชนกันของพอร์ตบนพอร์ต gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (gateway ทำงานอยู่แล้ว, SSH tunnel)
  </Accordion>
  <Accordion title="17. แนวทางปฏิบัติที่ดีสำหรับ Gateway runtime">
    Doctor เตือนเมื่อบริการ gateway ทำงานบน Bun หรือพาธ Node ที่จัดการด้วยเวอร์ชัน (`nvm`, `fnm`, `volta`, `asdf` ฯลฯ) ช่อง WhatsApp + Telegram ต้องใช้ Node และพาธของตัวจัดการเวอร์ชันอาจเสียหลังอัปเกรด เพราะบริการไม่ได้โหลด shell init ของคุณ Doctor เสนอให้ย้ายไปใช้การติดตั้ง Node ของระบบเมื่อมีให้ใช้ (Homebrew/apt/choco)

    macOS LaunchAgents ที่ติดตั้งหรือซ่อมแซมใหม่ใช้ PATH ของระบบแบบมาตรฐาน (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) แทนการคัดลอก PATH ของ interactive shell ดังนั้น Volta, asdf, fnm, pnpm และไดเรกทอรีของตัวจัดการเวอร์ชันอื่นๆ จะไม่เปลี่ยนว่า child process ของ Node resolve ไปที่ใด บริการ Linux ยังคงเก็บ environment roots แบบชัดเจน (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) และไดเรกทอรี user-bin ที่เสถียร แต่ไดเรกทอรีสำรองของตัวจัดการเวอร์ชันที่เดาจะถูกเขียนลงใน PATH ของบริการเฉพาะเมื่อไดเรกทอรีเหล่านั้นมีอยู่บนดิสก์เท่านั้น

  </Accordion>
  <Accordion title="18. การเขียน Config + metadata ของวิซาร์ด">
    Doctor บันทึกการเปลี่ยนแปลง config ใดๆ และประทับ metadata ของวิซาร์ดเพื่อบันทึกการเรียกใช้ doctor
  </Accordion>
  <Accordion title="19. เคล็ดลับ Workspace (การสำรองข้อมูล + ระบบหน่วยความจำ)">
    Doctor แนะนำระบบหน่วยความจำของ workspace เมื่อยังไม่มี และพิมพ์เคล็ดลับการสำรองข้อมูลหาก workspace ยังไม่ได้อยู่ภายใต้ git

    ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคู่มือฉบับเต็มเกี่ยวกับโครงสร้าง workspace และการสำรองข้อมูลด้วย git (แนะนำ GitHub หรือ GitLab แบบส่วนตัว)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [Runbook ของ Gateway](/th/gateway)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
