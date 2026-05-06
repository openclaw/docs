---
read_when:
    - การเพิ่มหรือแก้ไขการย้ายข้อมูลของ doctor
    - การเพิ่มการเปลี่ยนแปลงการกำหนดค่าที่ไม่รองรับความเข้ากันได้ย้อนหลัง
sidebarTitle: Doctor
summary: 'คำสั่งตรวจสอบระบบ: การตรวจสอบสถานภาพ การย้ายการกำหนดค่า และขั้นตอนการซ่อมแซม'
title: ตรวจสุขภาพ
x-i18n:
    generated_at: "2026-05-06T09:13:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5cee2793b1a0665a3a816586fcb597de1fd3133819d34480aa420346f4d7a78d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` คือเครื่องมือซ่อมแซมและย้ายข้อมูลสำหรับ OpenClaw โดยจะแก้ไข config/state ที่ล้าสมัย ตรวจสอบสุขภาพ และให้ขั้นตอนการซ่อมแซมที่นำไปปฏิบัติได้

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

    ใช้การซ่อมแซมที่แนะนำโดยไม่ถามยืนยัน (การซ่อมแซมและการรีสตาร์ทในกรณีที่ปลอดภัย)

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    ใช้การซ่อมแซมแบบเข้มข้นด้วย (เขียนทับ config ของ supervisor ที่กำหนดเอง)

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    รันโดยไม่มี prompt และใช้เฉพาะ migration ที่ปลอดภัย (การปรับ config ให้เป็นรูปแบบมาตรฐานและการย้าย state บนดิสก์) ข้ามการกระทำกับ restart/service/sandbox ที่ต้องให้มนุษย์ยืนยัน migration ของ state แบบเก่าจะรันอัตโนมัติเมื่อตรวจพบ

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    สแกนบริการระบบเพื่อหา gateway install เพิ่มเติม (launchd/systemd/schtasks)

  </Tab>
</Tabs>

หากคุณต้องการตรวจทานการเปลี่ยนแปลงก่อนเขียน ให้เปิดไฟล์ config ก่อน:

```bash
cat ~/.openclaw/openclaw.json
```

## สิ่งที่ทำ (สรุป)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - การอัปเดตก่อนเริ่มแบบเลือกได้สำหรับการติดตั้งจาก git (เฉพาะแบบ interactive)
    - การตรวจสอบความใหม่ของโปรโตคอล UI (สร้าง Control UI ใหม่เมื่อ protocol schema ใหม่กว่า)
    - การตรวจสอบสุขภาพและ prompt ให้รีสตาร์ท
    - สรุปสถานะ Skills (ใช้ได้/ขาดหาย/ถูกบล็อก) และสถานะ plugin

  </Accordion>
  <Accordion title="Config and migrations">
    - การปรับ config แบบเก่าให้เป็นรูปแบบมาตรฐาน
    - การย้าย config ของ Talk จากฟิลด์แบบ flat เก่า `talk.*` ไปเป็น `talk.provider` + `talk.providers.<provider>`
    - การตรวจสอบ migration ของเบราว์เซอร์สำหรับ config Chrome extension แบบเก่าและความพร้อมของ Chrome MCP
    - คำเตือน override ของ OpenCode provider (`models.providers.opencode` / `models.providers.opencode-go`)
    - คำเตือนการ shadow ของ Codex OAuth (`models.providers.openai-codex`)
    - การตรวจสอบข้อกำหนดเบื้องต้นของ OAuth TLS สำหรับโปรไฟล์ OpenAI Codex OAuth
    - คำเตือน allowlist ของ Plugin/tool เมื่อ `plugins.allow` จำกัดการใช้งาน แต่ tool policy ยังขอ wildcard หรือเครื่องมือที่ plugin เป็นเจ้าของ
    - การย้าย state บนดิสก์แบบเก่า (sessions/agent dir/WhatsApp auth)
    - การย้ายคีย์สัญญา manifest ของ plugin แบบเก่า (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
    - การย้าย cron store แบบเก่า (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบน, payload `provider`, งาน webhook fallback แบบง่าย `notify: true`)
    - การย้าย agent runtime-policy แบบเก่าไปยัง `agents.defaults.agentRuntime` และ `agents.list[].agentRuntime`
    - การล้าง config ของ plugin ที่ล้าสมัยเมื่อเปิดใช้งาน plugins; เมื่อ `plugins.enabled=false` การอ้างอิง plugin ที่ล้าสมัยจะถือเป็น config containment ที่ไม่มีผลและจะถูกเก็บไว้

  </Accordion>
  <Accordion title="State and integrity">
    - การตรวจสอบไฟล์ session lock และการล้าง lock ที่ล้าสมัย
    - การซ่อมแซม transcript ของ session สำหรับกิ่ง prompt-rewrite ที่ซ้ำกันซึ่งสร้างโดย build 2026.4.24 ที่ได้รับผลกระทบ
    - การตรวจจับ tombstone สำหรับการกู้คืนการรีสตาร์ทของ subagent ที่ติดค้าง พร้อมรองรับ `--fix` เพื่อล้างแฟล็กการกู้คืนที่ถูก aborted และล้าสมัย เพื่อให้ startup ไม่ปฏิบัติต่อ child ต่อไปเหมือนถูก restart-aborted
    - การตรวจสอบความสมบูรณ์ของ state และ permissions (sessions, transcripts, state dir)
    - การตรวจสอบ permission ของไฟล์ config (chmod 600) เมื่อรันภายในเครื่อง
    - สุขภาพ auth ของโมเดล: ตรวจสอบการหมดอายุของ OAuth, สามารถ refresh token ที่ใกล้หมดอายุ และรายงานสถานะ cooldown/disabled ของ auth-profile
    - การตรวจจับ workspace dir เพิ่มเติม (`~/openclaw`)

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - การซ่อมแซม sandbox image เมื่อเปิดใช้งาน sandboxing
    - การย้าย service แบบเก่าและการตรวจจับ Gateway เพิ่มเติม
    - การย้าย state แบบเก่าของ channel Matrix (ในโหมด `--fix` / `--repair`)
    - การตรวจสอบ runtime ของ Gateway (service ถูกติดตั้งแต่ไม่ได้รัน; label launchd ที่ cache ไว้)
    - คำเตือนสถานะ channel (probe จาก gateway ที่กำลังรันอยู่)
    - การตรวจสอบการตอบสนองของ WhatsApp สำหรับสุขภาพ event-loop ของ Gateway ที่เสื่อมลงขณะที่ client TUI ภายในเครื่องยังรันอยู่; `--fix` จะหยุดเฉพาะ client TUI ภายในเครื่องที่ยืนยันแล้วเท่านั้น
    - การซ่อมแซม route ของ Codex สำหรับ model ref แบบเก่า `openai-codex/*` ในโมเดลหลัก, fallbacks, heartbeat/subagent/compaction overrides, hooks, channel model overrides, และ session route pins; `--fix` จะเขียนใหม่เป็น `openai/*` และเลือก `agentRuntime.id: "codex"` เฉพาะเมื่อ Codex plugin ถูกติดตั้ง เปิดใช้งาน มีส่วนร่วมกับ harness `codex` และมี OAuth ที่ใช้งานได้ มิฉะนั้นจะเลือก `agentRuntime.id: "pi"`
    - การ audit config ของ supervisor (launchd/systemd/schtasks) พร้อมการซ่อมแซมแบบเลือกได้
    - การล้างสภาพแวดล้อม embedded proxy สำหรับบริการ gateway ที่จับค่า shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` ไว้ระหว่าง install หรือ update
    - การตรวจสอบแนวทางปฏิบัติที่ดีของ runtime Gateway (Node เทียบกับ Bun, path ของ version-manager)
    - diagnostics การชนกันของพอร์ต Gateway (ค่าเริ่มต้น `18789`)

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - คำเตือนด้านความปลอดภัยสำหรับนโยบาย DM แบบเปิด
    - การตรวจสอบ auth ของ Gateway สำหรับโหมด token ภายในเครื่อง (เสนอการสร้าง token เมื่อไม่มีแหล่ง token; ไม่เขียนทับ config SecretRef ของ token)
    - การตรวจจับปัญหา device pairing (คำขอ pair ครั้งแรกที่ค้างอยู่, การอัปเกรด role/scope ที่ค้างอยู่, drift ของ cache device-token ภายในเครื่องที่ล้าสมัย, และ drift ของ auth ใน paired-record)

  </Accordion>
  <Accordion title="Workspace and shell">
    - การตรวจสอบ systemd linger บน Linux
    - การตรวจสอบขนาดไฟล์ bootstrap ของ workspace (คำเตือน truncation/near-limit สำหรับไฟล์ context)
    - การตรวจสอบความพร้อมของ Skills สำหรับ agent เริ่มต้น; รายงาน skills ที่อนุญาตแต่ขาด bin, env, config, หรือข้อกำหนด OS และ `--fix` สามารถปิดใช้งาน skills ที่ไม่พร้อมใน `skills.entries`
    - การตรวจสอบสถานะ shell completion และการติดตั้ง/อัปเกรดอัตโนมัติ
    - การตรวจสอบความพร้อมของ memory search embedding provider (โมเดลภายในเครื่อง, remote API key, หรือ QMD binary)
    - การตรวจสอบการติดตั้งจาก source (pnpm workspace ไม่ตรงกัน, assets ของ UI ขาดหาย, binary tsx ขาดหาย)
    - เขียน config ที่อัปเดตแล้วและ metadata ของ wizard

  </Accordion>
</AccordionGroup>

## การเติมย้อนหลังและรีเซ็ต Dreams UI

ฉาก Dreams ใน Control UI มี action **Backfill**, **Reset**, และ **Clear Grounded** สำหรับ workflow grounded dreaming action เหล่านี้ใช้เมธอด RPC แบบ doctor ของ gateway แต่ **ไม่ใช่** ส่วนหนึ่งของการซ่อมแซม/migration ของ CLI `openclaw doctor`

สิ่งที่ action เหล่านี้ทำ:

- **Backfill** สแกนไฟล์ประวัติ `memory/YYYY-MM-DD.md` ใน workspace ที่ active อยู่ รัน pass ไดอารี grounded REM และเขียนรายการ backfill ที่ย้อนกลับได้ลงใน `DREAMS.md`
- **Reset** ลบเฉพาะรายการไดอารี backfill ที่ถูกทำเครื่องหมายเหล่านั้นออกจาก `DREAMS.md`
- **Clear Grounded** ลบเฉพาะรายการระยะสั้นแบบ grounded-only ที่ staged ไว้ ซึ่งมาจาก historical replay และยังไม่ได้สะสม live recall หรือ daily support

สิ่งที่ action เหล่านี้ **ไม่** ทำด้วยตัวเอง:

- ไม่แก้ไข `MEMORY.md`
- ไม่รัน migration ของ doctor แบบเต็ม
- ไม่ stage grounded candidates เข้า live short-term promotion store โดยอัตโนมัติ เว้นแต่คุณจะรันเส้นทาง CLI แบบ staged ก่อนอย่างชัดเจน

หากคุณต้องการให้ grounded historical replay ส่งผลต่อ lane การ promote แบบ deep ตามปกติ ให้ใช้ flow ของ CLI แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

คำสั่งนี้จะ stage grounded durable candidates เข้า short-term dreaming store ขณะที่คง `DREAMS.md` เป็นพื้นผิวสำหรับตรวจทาน

## พฤติกรรมโดยละเอียดและเหตุผล

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    หากนี่เป็น git checkout และ doctor กำลังรันแบบ interactive ระบบจะเสนอให้อัปเดต (fetch/rebase/build) ก่อนรัน doctor
  </Accordion>
  <Accordion title="1. Config normalization">
    หาก config มีรูปทรงค่าจากระบบเก่า (เช่น `messages.ackReaction` โดยไม่มี override เฉพาะ channel) doctor จะปรับให้เป็น schema ปัจจุบัน

    ซึ่งรวมถึงฟิลด์ flat แบบเก่าของ Talk config speech สาธารณะปัจจุบันของ Talk คือ `talk.provider` + `talk.providers.<provider>` และ config realtime voice คือ `talk.realtime.*` Doctor จะเขียนรูปแบบเก่า `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ใหม่เข้า provider map และเขียน selector realtime ระดับบนแบบเก่า (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) ใหม่เข้า `talk.realtime`

    Doctor ยังเตือนเมื่อ `plugins.allow` ไม่ว่างและ tool policy ใช้
    รายการ wildcard หรือรายการเครื่องมือที่ plugin เป็นเจ้าของ `tools.allow: ["*"]` จะจับคู่เฉพาะเครื่องมือ
    จาก plugins ที่โหลดจริงเท่านั้น; ไม่ได้ข้าม allowlist ของ plugin แบบ exclusive
    Doctor จะเขียน `plugins.bundledDiscovery: "compat"` สำหรับ config allowlist
    แบบเก่าที่ migrated แล้วเพื่อรักษาพฤติกรรม bundled provider ที่มีอยู่ และ
    จากนั้นชี้ไปยังการตั้งค่า `"allowlist"` ที่เข้มงวดกว่า

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    เมื่อ config มีคีย์ที่เลิกใช้แล้ว คำสั่งอื่นจะปฏิเสธการรันและขอให้คุณรัน `openclaw doctor`

    Doctor จะ:

    - อธิบายว่าพบคีย์แบบเก่าใดบ้าง
    - แสดง migration ที่ใช้ไปแล้ว
    - เขียน `~/.openclaw/openclaw.json` ใหม่ด้วย schema ที่อัปเดตแล้ว

    Gateway ยังรัน doctor migrations อัตโนมัติเมื่อ startup หากตรวจพบรูปแบบ config แบบเก่า เพื่อซ่อมแซม config ที่ล้าสมัยโดยไม่ต้องดำเนินการด้วยมือ migration ของ cron job store จัดการโดย `openclaw doctor --fix`

    migration ปัจจุบัน:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - การกำหนดค่าช่องที่ตั้งค่าไว้แต่ไม่มีนโยบายการตอบกลับแบบมองเห็นได้ → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` ระดับบนสุด
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` แบบเก่า → `talk.provider` + `talk.providers.<provider>`
    - ตัวเลือก Talk แบบเรียลไทม์ระดับบนสุดแบบเก่า (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - สำหรับช่องที่มี `accounts` แบบมีชื่อ แต่ยังมีค่าช่องระดับบนสุดสำหรับบัญชีเดียวค้างอยู่ ให้ย้ายค่าที่มีขอบเขตตามบัญชีเหล่านั้นเข้าไปยังบัญชีที่เลื่อนระดับซึ่งเลือกไว้สำหรับช่องนั้น (`accounts.default` สำหรับช่องส่วนใหญ่; Matrix สามารถคงเป้าหมายแบบมีชื่อ/ค่าเริ่มต้นที่ตรงกันซึ่งมีอยู่แล้วได้)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - ลบ `agents.defaults.llm`; ใช้ `models.providers.<id>.timeoutSeconds` สำหรับการหมดเวลาของผู้ให้บริการ/โมเดลที่ช้า
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - ลบ `browser.relayBindHost` (การตั้งค่ารีเลย์ extension แบบเก่า)
    - `models.providers.*.api: "openai"` แบบเก่า → `"openai-completions"` (การเริ่มต้น Gateway ยังข้ามผู้ให้บริการที่ตั้งค่า `api` เป็นค่า enum ในอนาคตหรือที่ไม่รู้จัก แทนที่จะล้มเหลวแบบปิดกั้น)

    คำเตือนของ Doctor ยังมีคำแนะนำบัญชีเริ่มต้นสำหรับช่องแบบหลายบัญชีด้วย:

    - หากมีการกำหนดค่า `channels.<channel>.accounts` สองรายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default` doctor จะเตือนว่าการกำหนดเส้นทางสำรองอาจเลือกบัญชีที่ไม่คาดคิด
    - หากตั้งค่า `channels.<channel>.defaultAccount` เป็น ID บัญชีที่ไม่รู้จัก doctor จะเตือนและแสดงรายการ ID บัญชีที่กำหนดค่าไว้

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    หากคุณเพิ่ม `models.providers.opencode`, `opencode-zen` หรือ `opencode-go` ด้วยตนเอง รายการเหล่านี้จะแทนที่แคตตาล็อก OpenCode ในตัวจาก `@mariozechner/pi-ai` ซึ่งอาจบังคับให้โมเดลไปใช้ API ที่ไม่ถูกต้องหรือทำให้ค่าใช้จ่ายกลายเป็นศูนย์ Doctor จะเตือนเพื่อให้คุณลบการแทนที่และกู้คืนการกำหนดเส้นทาง API + ค่าใช้จ่ายรายโมเดล
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    หากการกำหนดค่าเบราว์เซอร์ของคุณยังชี้ไปยังพาธ Chrome extension ที่ถูกลบแล้ว doctor จะทำให้เป็นปกติเป็นโมเดลการแนบ Chrome MCP แบบโฮสต์ภายในปัจจุบัน:

    - `browser.profiles.*.driver: "extension"` กลายเป็น `"existing-session"`
    - `browser.relayBindHost` ถูกลบออก

    Doctor ยังตรวจสอบพาธ Chrome MCP แบบโฮสต์ภายในเมื่อคุณใช้ `defaultProfile: "user"` หรือโปรไฟล์ `existing-session` ที่กำหนดค่าไว้:

    - ตรวจสอบว่ามีการติดตั้ง Google Chrome บนโฮสต์เดียวกันสำหรับโปรไฟล์เชื่อมต่ออัตโนมัติเริ่มต้นหรือไม่
    - ตรวจสอบเวอร์ชัน Chrome ที่ตรวจพบและเตือนเมื่อเวอร์ชันต่ำกว่า Chrome 144
    - เตือนให้คุณเปิดใช้การดีบักระยะไกลในหน้า inspect ของเบราว์เซอร์ (เช่น `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` หรือ `edge://inspect/#remote-debugging`)

    Doctor ไม่สามารถเปิดใช้การตั้งค่าฝั่ง Chrome ให้คุณได้ Chrome MCP แบบโฮสต์ภายในยังต้องมี:

    - เบราว์เซอร์ที่ใช้ Chromium 144+ บนโฮสต์ gateway/node
    - เบราว์เซอร์ทำงานอยู่ภายในเครื่อง
    - เปิดใช้การดีบักระยะไกลในเบราว์เซอร์นั้น
    - อนุมัติพรอมป์ขอความยินยอมในการแนบครั้งแรกในเบราว์เซอร์

    ความพร้อมใช้งานตรงนี้เกี่ยวข้องเฉพาะข้อกำหนดเบื้องต้นของการแนบภายในเครื่องเท่านั้น Existing-session ยังคงใช้ขีดจำกัดเส้นทาง Chrome MCP ปัจจุบัน; เส้นทางขั้นสูงอย่าง `responsebody`, การส่งออก PDF, การดักดาวน์โหลด และการดำเนินการแบบชุดยังต้องใช้เบราว์เซอร์ที่มีการจัดการหรือโปรไฟล์ CDP ดิบ

    การตรวจสอบนี้ **ไม่** ใช้กับ Docker, sandbox, remote-browser หรือโฟลว์ headless อื่นๆ โฟลว์เหล่านั้นยังคงใช้ CDP ดิบ

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    เมื่อมีการกำหนดค่าโปรไฟล์ OAuth ของ OpenAI Codex doctor จะตรวจสอบปลายทางการอนุญาตของ OpenAI เพื่อยืนยันว่าสแต็ก TLS ของ Node/OpenSSL ภายในเครื่องสามารถตรวจสอบเชนใบรับรองได้ หากการตรวจสอบล้มเหลวด้วยข้อผิดพลาดใบรับรอง (เช่น `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ใบรับรองหมดอายุ หรือใบรับรองแบบ self-signed) doctor จะแสดงคำแนะนำการแก้ไขเฉพาะแพลตฟอร์ม บน macOS ที่ใช้ Node จาก Homebrew การแก้มักเป็น `brew postinstall ca-certificates` เมื่อใช้ `--deep` การตรวจสอบจะทำงานแม้ว่า Gateway จะปกติดี
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    หากก่อนหน้านี้คุณเพิ่มการตั้งค่าการขนส่ง OpenAI แบบเก่าไว้ใต้ `models.providers.openai-codex` การตั้งค่าเหล่านั้นอาจบดบังพาธผู้ให้บริการ Codex OAuth ในตัวที่รุ่นใหม่กว่าใช้โดยอัตโนมัติ Doctor จะเตือนเมื่อพบการตั้งค่าการขนส่งเก่าเหล่านั้นควบคู่กับ Codex OAuth เพื่อให้คุณลบหรือเขียนการแทนที่การขนส่งที่ล้าสมัยใหม่ และนำพฤติกรรมการกำหนดเส้นทาง/สำรองในตัวกลับมาใช้ พร็อกซีแบบกำหนดเองและการแทนที่เฉพาะส่วนหัวข้อมูลยังคงรองรับและจะไม่เรียกคำเตือนนี้
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor ตรวจหา refs โมเดล `openai-codex/*` แบบเก่า การกำหนดเส้นทางของ Codex harness ดั้งเดิมใช้ refs โมเดล `openai/*` แบบบัญญัติร่วมกับ `agentRuntime.id: "codex"` เพื่อให้เทิร์นผ่าน Codex app-server harness แทนพาธ OpenClaw PI OpenAI

    ในโหมด `--fix` / `--repair` doctor จะเขียน refs ของตัวแทนเริ่มต้นและรายตัวแทนที่ได้รับผลกระทบใหม่ รวมถึงโมเดลหลัก รายการสำรอง การแทนที่ heartbeat/subagent/compaction, hooks, การแทนที่โมเดลของช่อง และสถานะเส้นทางเซสชันที่คงอยู่ซึ่งล้าสมัย:

    - `openai-codex/gpt-*` กลายเป็น `openai/gpt-*`
    - runtime ของตัวแทนที่ตรงกันจะกลายเป็น `agentRuntime.id: "codex"` เฉพาะเมื่อมีการติดตั้ง Codex, เปิดใช้งานอยู่, ส่งมอบ harness `codex` และมี OAuth ที่ใช้งานได้
    - มิฉะนั้น runtime ของตัวแทนที่ตรงกันจะกลายเป็น `agentRuntime.id: "pi"`
    - รายการ fallback ของโมเดลที่มีอยู่จะถูกคงไว้พร้อมเขียนรายการแบบเก่าใหม่; การตั้งค่ารายโมเดลที่คัดลอกจะย้ายจากคีย์แบบเก่าไปยังคีย์ `openai/*` แบบบัญญัติ
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, ประกาศ fallback, การปักหมุด auth-profile และการปักหมุด Codex harness ในเซสชันที่คงอยู่จะได้รับการซ่อมแซมในที่เก็บเซสชันตัวแทนทั้งหมดที่ค้นพบ
    - `/codex ...` หมายถึง "ควบคุมหรือผูกการสนทนา Codex ดั้งเดิมจากแชต"
    - `/acp ...` หรือ `runtime: "acp"` หมายถึง "ใช้อะแดปเตอร์ ACP/acpx ภายนอก"

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor ยังสแกนที่เก็บเซสชันตัวแทนที่ค้นพบเพื่อหาสถานะเส้นทางที่สร้างอัตโนมัติและล้าสมัยหลังจากคุณย้ายโมเดลหรือ runtime ที่กำหนดค่าไว้ออกจากเส้นทางที่ Plugin เป็นเจ้าของ เช่น Codex

    `openclaw doctor --fix` สามารถล้างสถานะล้าสมัยที่สร้างอัตโนมัติ เช่น การปักหมุดโมเดล `modelOverrideSource: "auto"`, เมทาดาทาโมเดล runtime, ID harness ที่ปักหมุดไว้, การผูกเซสชัน CLI และการแทนที่ auth-profile อัตโนมัติ เมื่อเส้นทางที่เป็นเจ้าของไม่ได้ถูกกำหนดค่าอีกต่อไป ตัวเลือกโมเดลของผู้ใช้ที่ระบุชัดเจนหรือเซสชันแบบเก่าจะถูกรายงานให้ตรวจสอบด้วยตนเองและคงไว้ไม่แตะต้อง; สลับรายการเหล่านั้นด้วย `/model ...`, `/new` หรือรีเซ็ตเซสชันเมื่อไม่ต้องการใช้เส้นทางนั้นอีกต่อไป

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor สามารถย้ายเลย์เอาต์บนดิสก์รุ่นเก่าเข้าสู่โครงสร้างปัจจุบันได้:

    - ที่เก็บเซสชัน + transcripts:
      - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
    - ไดเรกทอรีตัวแทน:
      - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
    - สถานะการยืนยันตัวตน WhatsApp (Baileys):
      - จาก `~/.openclaw/credentials/*.json` แบบเก่า (ยกเว้น `oauth.json`)
      - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID บัญชีเริ่มต้น: `default`)

    การย้ายเหล่านี้ทำแบบดีที่สุดเท่าที่ทำได้และทำซ้ำได้โดยไม่เปลี่ยนผลลัพธ์; doctor จะแสดงคำเตือนเมื่อทิ้งโฟลเดอร์แบบเก่าไว้เป็นข้อมูลสำรอง Gateway/CLI ยังย้ายเซสชันแบบเก่า + ไดเรกทอรีตัวแทนโดยอัตโนมัติเมื่อเริ่มต้น เพื่อให้ประวัติ/auth/models ไปอยู่ในพาธรายตัวแทนโดยไม่ต้องรัน doctor ด้วยตนเอง ตอนนี้การทำให้ provider/provider-map ของ Talk เป็นปกติเปรียบเทียบด้วยความเท่ากันเชิงโครงสร้าง ดังนั้นความต่างที่เกิดจากลำดับคีย์เท่านั้นจะไม่ทำให้เกิดการเปลี่ยนแปลง `doctor --fix` แบบไม่ทำอะไรซ้ำอีก

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor สแกน manifest ของ Plugin ที่ติดตั้งทั้งหมดเพื่อหาคีย์ความสามารถระดับบนสุดที่เลิกใช้แล้ว (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) เมื่อพบ จะเสนอให้ย้ายคีย์เหล่านั้นเข้าไปในอ็อบเจ็กต์ `contracts` และเขียนไฟล์ manifest ใหม่ในที่เดิม การย้ายนี้ทำซ้ำได้โดยไม่เปลี่ยนผลลัพธ์; หากคีย์ `contracts` มีค่าเดียวกันอยู่แล้ว คีย์แบบเก่าจะถูกลบออกโดยไม่ทำซ้ำข้อมูล
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor ยังตรวจสอบที่เก็บงาน cron (`~/.openclaw/cron/jobs.json` โดยค่าเริ่มต้น หรือ `cron.store` เมื่อมีการแทนที่) เพื่อหารูปแบบงานเก่าที่ตัวจัดกำหนดการยังยอมรับเพื่อความเข้ากันได้

    การล้าง cron ปัจจุบันรวมถึง:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - ฟิลด์ payload ระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
    - ฟิลด์ delivery ระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - นามแฝง delivery ของ payload `provider` → `delivery.channel` ที่ระบุชัดเจน
    - งาน fallback webhook แบบเก่าอย่างง่าย `notify: true` → `delivery.mode="webhook"` ที่ระบุชัดเจนพร้อม `delivery.to=cron.webhook`

    ตัวตรวจสุขภาพจะย้ายงาน `notify: true` โดยอัตโนมัติเฉพาะเมื่อทำได้โดยไม่เปลี่ยนพฤติกรรมเท่านั้น หากงานหนึ่งรวมการสำรอง notify แบบเดิมกับโหมดการส่งที่มีอยู่แล้วซึ่งไม่ใช่ webhook ตัวตรวจสุขภาพจะเตือนและปล่อยงานนั้นไว้ให้ตรวจสอบด้วยตนเอง

    บน Linux ตัวตรวจสุขภาพจะเตือนด้วยเมื่อ crontab ของผู้ใช้ยังเรียกใช้ `~/.openclaw/bin/ensure-whatsapp.sh` แบบเดิม สคริปต์เฉพาะโฮสต์นี้ไม่ได้รับการดูแลโดย OpenClaw รุ่นปัจจุบัน และอาจเขียนข้อความ `Gateway inactive` ที่ไม่ถูกต้องไปยัง `~/.openclaw/logs/whatsapp-health.log` เมื่อ cron ไม่สามารถเข้าถึง systemd user bus ได้ ลบรายการ crontab ที่ค้างอยู่ด้วย `crontab -e`; ใช้ `openclaw channels status --probe`, `openclaw doctor` และ `openclaw gateway status` สำหรับการตรวจสุขภาพปัจจุบัน

  </Accordion>
  <Accordion title="3c. การล้าง session lock">
    ตัวตรวจสุขภาพจะสแกนไดเรกทอรี session ของ agent ทุกตัวเพื่อหาไฟล์ write-lock ที่ค้างอยู่ — ไฟล์ที่ถูกทิ้งไว้เมื่อ session ออกจากระบบอย่างผิดปกติ สำหรับไฟล์ lock แต่ละไฟล์ที่พบ จะรายงาน: path, PID, PID ยังทำงานอยู่หรือไม่, อายุของ lock และถือว่าค้างหรือไม่ (PID ตายแล้วหรือเก่ากว่า 30 นาที) ในโหมด `--fix` / `--repair` ระบบจะลบไฟล์ lock ที่ค้างอยู่โดยอัตโนมัติ มิฉะนั้นจะพิมพ์หมายเหตุและบอกให้คุณรันใหม่พร้อม `--fix`
  </Accordion>
  <Accordion title="3d. การซ่อมแซม branch ของ transcript session">
    ตัวตรวจสุขภาพจะสแกนไฟล์ JSONL ของ session agent เพื่อหารูปแบบ branch ซ้ำที่เกิดจากบั๊กการเขียน transcript prompt ใหม่เมื่อ 2026.4.24: user turn ที่ถูกทิ้งไว้พร้อมบริบท runtime ภายในของ OpenClaw และ sibling ที่ยังใช้งานอยู่ซึ่งมี prompt ผู้ใช้ที่มองเห็นได้เหมือนกัน ในโหมด `--fix` / `--repair` ตัวตรวจสุขภาพจะสำรองไฟล์ที่ได้รับผลกระทบแต่ละไฟล์ไว้ข้างต้นฉบับ และเขียน transcript ใหม่ไปยัง branch ที่ใช้งานอยู่ เพื่อให้ประวัติ gateway และตัวอ่านหน่วยความจำไม่เห็น turn ซ้ำอีก
  </Accordion>
  <Accordion title="4. การตรวจสอบความถูกต้องของ state (การคงอยู่ของ session, routing และความปลอดภัย)">
    ไดเรกทอรี state คือแกนปฏิบัติการหลัก หากมันหายไป คุณจะสูญเสีย session, credentials, logs และ config (เว้นแต่คุณมีข้อมูลสำรองอยู่ที่อื่น)

    ตัวตรวจสุขภาพตรวจสอบ:

    - **ไดเรกทอรี state หายไป**: เตือนเกี่ยวกับการสูญเสีย state อย่างร้ายแรง แจ้งให้สร้างไดเรกทอรีใหม่ และย้ำว่าไม่สามารถกู้ข้อมูลที่หายไปได้
    - **สิทธิ์ของไดเรกทอรี state**: ตรวจสอบว่าสามารถเขียนได้; เสนอให้ซ่อมสิทธิ์ (และแสดงคำแนะนำ `chown` เมื่อตรวจพบว่า owner/group ไม่ตรงกัน)
    - **ไดเรกทอรี state ที่ซิงก์กับคลาวด์บน macOS**: เตือนเมื่อ state resolve อยู่ใต้ iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ `~/Library/CloudStorage/...` เพราะ path ที่มีการซิงก์รองรับอาจทำให้ I/O ช้าลงและเกิดการแข่งกันของ lock/sync
    - **ไดเรกทอรี state บน Linux SD หรือ eMMC**: เตือนเมื่อ state resolve ไปยังแหล่ง mount แบบ `mmcblk*` เพราะ random I/O ที่รองรับด้วย SD หรือ eMMC อาจช้ากว่าและสึกหรอเร็วกว่าเมื่อมีการเขียน session และ credential
    - **ไดเรกทอรี session หายไป**: ต้องมี `sessions/` และไดเรกทอรี session store เพื่อคงประวัติไว้และหลีกเลี่ยง crash แบบ `ENOENT`
    - **Transcript ไม่ตรงกัน**: เตือนเมื่อรายการ session ล่าสุดมีไฟล์ transcript หายไป
    - **Session หลักแบบ "JSONL 1 บรรทัด"**: แจ้งเตือนเมื่อ transcript หลักมีเพียงบรรทัดเดียว (ประวัติไม่ได้สะสมเพิ่ม)
    - **มีไดเรกทอรี state หลายแห่ง**: เตือนเมื่อมีโฟลเดอร์ `~/.openclaw` หลายแห่งอยู่ตาม home directory ต่าง ๆ หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (ประวัติอาจแยกกันระหว่างการติดตั้ง)
    - **คำเตือนเกี่ยวกับโหมด remote**: หาก `gateway.mode=remote` ตัวตรวจสุขภาพจะเตือนให้คุณรันบนโฮสต์ remote (state อยู่ที่นั่น)
    - **สิทธิ์ของไฟล์ config**: เตือนหาก `~/.openclaw/openclaw.json` อ่านได้โดย group/world และเสนอให้ปรับให้เข้มงวดเป็น `600`

  </Accordion>
  <Accordion title="5. สุขภาพการยืนยันตัวตนของโมเดล (OAuth หมดอายุ)">
    ตัวตรวจสุขภาพจะตรวจโปรไฟล์ OAuth ใน auth store เตือนเมื่อ token กำลังจะหมดอายุ/หมดอายุแล้ว และสามารถ refresh ได้เมื่อปลอดภัย หากโปรไฟล์ Anthropic OAuth/token ล้าสมัย ระบบจะแนะนำ Anthropic API key หรือเส้นทาง setup-token ของ Anthropic prompt สำหรับ refresh จะปรากฏเฉพาะเมื่อรันแบบโต้ตอบ (TTY); `--non-interactive` จะข้ามการพยายาม refresh

    เมื่อ OAuth refresh ล้มเหลวถาวร (เช่น `refresh_token_reused`, `invalid_grant` หรือ provider แจ้งให้คุณ sign in ใหม่) ตัวตรวจสุขภาพจะรายงานว่าต้อง re-auth และพิมพ์คำสั่ง `openclaw models auth login --provider ...` ที่ต้องรันอย่างชัดเจน

    ตัวตรวจสุขภาพยังรายงานโปรไฟล์ auth ที่ใช้งานไม่ได้ชั่วคราวเนื่องจาก:

    - cooldown สั้น ๆ (rate limits/timeouts/auth failures)
    - การปิดใช้งานที่ยาวกว่า (billing/credit failures)

  </Accordion>
  <Accordion title="6. การตรวจสอบโมเดลของ hooks">
    หากตั้งค่า `hooks.gmail.model` ไว้ ตัวตรวจสุขภาพจะตรวจสอบการอ้างอิงโมเดลกับ catalog และ allowlist และเตือนเมื่อ resolve ไม่ได้หรือไม่ได้รับอนุญาต
  </Accordion>
  <Accordion title="7. การซ่อมแซม sandbox image">
    เมื่อเปิดใช้ sandboxing ตัวตรวจสุขภาพจะตรวจ Docker images และเสนอให้ build หรือสลับไปใช้ชื่อแบบเดิมหาก image ปัจจุบันหายไป
  </Accordion>
  <Accordion title="7b. การล้างการติดตั้ง Plugin">
    ตัวตรวจสุขภาพจะลบ state การ stage dependency ของ Plugin ที่ OpenClaw สร้างไว้แบบเดิมในโหมด `openclaw doctor --fix` / `openclaw doctor --repair` ซึ่งครอบคลุม root dependency ที่สร้างค้างไว้, ไดเรกทอรี install-stage เก่า, เศษไฟล์เฉพาะ package จากโค้ดซ่อมแซม dependency ของ bundled-plugin รุ่นก่อน และสำเนา npm ที่จัดการไว้ของ Plugin `@openclaw/*` แบบ bundled ที่ orphaned หรือ recovered ซึ่งอาจ shadow manifest แบบ bundled ปัจจุบันได้

    ตัวตรวจสุขภาพยังสามารถติดตั้ง Plugin ที่ดาวน์โหลดได้ซึ่งหายไปใหม่ เมื่อ config อ้างถึงแต่ local plugin registry หาไม่พบ ตัวอย่างเช่น `plugins.entries` ที่เป็น material, การตั้งค่า channel/provider/search ที่กำหนดไว้ และ runtime ของ agent ที่กำหนดไว้ ระหว่างการอัปเดต package ตัวตรวจสุขภาพจะหลีกเลี่ยงการรันการซ่อม Plugin ด้วย package-manager ขณะที่ core package กำลังถูกสลับ; รัน `openclaw doctor --fix` อีกครั้งหลังการอัปเดตหาก Plugin ที่กำหนดค่าไว้ยังต้องกู้คืน การเริ่มต้น Gateway และการ reload config จะไม่รัน package manager; การติดตั้ง Plugin ยังคงเป็นงาน doctor/install/update ที่ต้องทำอย่างชัดเจน

  </Accordion>
  <Accordion title="8. การย้าย Gateway service และคำแนะนำการล้างข้อมูล">
    ตัวตรวจสุขภาพจะตรวจพบ gateway service แบบเดิม (launchd/systemd/schtasks) และเสนอให้ลบออกแล้วติดตั้ง service ของ OpenClaw โดยใช้ port ของ gateway ปัจจุบัน นอกจากนี้ยังสามารถสแกนหา service เพิ่มเติมที่คล้าย gateway และพิมพ์คำแนะนำการล้างข้อมูลได้ Gateway service ของ OpenClaw ที่ตั้งชื่อตามโปรไฟล์ถือเป็น first-class และจะไม่ถูกแจ้งว่าเป็น "extra"

    บน Linux หาก service gateway ระดับผู้ใช้หายไป แต่มี service gateway ของ OpenClaw ระดับระบบอยู่ ตัวตรวจสุขภาพจะไม่ติดตั้ง service ระดับผู้ใช้อันที่สองโดยอัตโนมัติ ตรวจสอบด้วย `openclaw gateway status --deep` หรือ `openclaw doctor --deep` จากนั้นลบรายการซ้ำหรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ system supervisor เป็นเจ้าของ lifecycle ของ gateway

  </Accordion>
  <Accordion title="8b. การย้าย Startup Matrix">
    เมื่อบัญชี channel Matrix มีการย้าย state แบบเดิมที่ pending หรือ actionable ตัวตรวจสุขภาพ (ในโหมด `--fix` / `--repair`) จะสร้าง snapshot ก่อนการย้าย แล้วรันขั้นตอนการย้ายแบบ best-effort: การย้าย state ของ Matrix แบบเดิมและการเตรียม encrypted-state แบบเดิม ทั้งสองขั้นตอนเป็น non-fatal; ข้อผิดพลาดจะถูก log และการเริ่มต้นจะดำเนินต่อ ในโหมด read-only (`openclaw doctor` โดยไม่มี `--fix`) การตรวจนี้จะถูกข้ามทั้งหมด
  </Accordion>
  <Accordion title="8c. การจับคู่อุปกรณ์และ auth drift">
    ตอนนี้ตัวตรวจสุขภาพจะตรวจ state การจับคู่อุปกรณ์เป็นส่วนหนึ่งของการตรวจสุขภาพปกติ

    สิ่งที่รายงาน:

    - คำขอจับคู่ครั้งแรกที่ pending
    - การอัปเกรด role ที่ pending สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การอัปเกรด scope ที่ pending สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การซ่อมแซม public-key mismatch เมื่อ device id ยังตรงกัน แต่ identity ของอุปกรณ์ไม่ตรงกับ record ที่อนุมัติแล้ว
    - record ที่จับคู่แล้วซึ่งไม่มี token ที่ active สำหรับ role ที่อนุมัติ
    - token ที่จับคู่แล้วซึ่ง scope drift ออกนอก pairing baseline ที่อนุมัติ
    - รายการ device-token ใน cache ภายในเครื่องสำหรับเครื่องปัจจุบันที่เก่ากว่า gateway-side token rotation หรือมี metadata scope ที่ล้าสมัย

    ตัวตรวจสุขภาพจะไม่อนุมัติคำขอจับคู่โดยอัตโนมัติหรือ rotate device token โดยอัตโนมัติ แต่จะพิมพ์ขั้นตอนถัดไปที่ชัดเจนแทน:

    - ตรวจคำขอที่ pending ด้วย `openclaw devices list`
    - อนุมัติคำขอที่เจาะจงด้วย `openclaw devices approve <requestId>`
    - rotate token ใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
    - ลบและอนุมัติ record ที่ล้าสมัยใหม่ด้วย `openclaw devices remove <deviceId>`

    สิ่งนี้ปิดช่องโหว่ทั่วไป "จับคู่แล้วแต่ยังได้รับ pairing required": ตอนนี้ตัวตรวจสุขภาพจะแยกการจับคู่ครั้งแรกออกจากการอัปเกรด role/scope ที่ pending และจาก token/device-identity drift ที่ล้าสมัย

  </Accordion>
  <Accordion title="9. คำเตือนด้านความปลอดภัย">
    ตัวตรวจสุขภาพจะแสดงคำเตือนเมื่อ provider เปิดรับ DM โดยไม่มี allowlist หรือเมื่อ policy ถูกกำหนดค่าในลักษณะที่อันตราย
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    หากรันเป็น systemd user service ตัวตรวจสุขภาพจะทำให้แน่ใจว่าเปิดใช้ lingering แล้ว เพื่อให้ gateway ยังทำงานต่อหลัง logout
  </Accordion>
  <Accordion title="11. สถานะ workspace (Skills, Plugin และไดเรกทอรีแบบเดิม)">
    ตัวตรวจสุขภาพพิมพ์สรุป state ของ workspace สำหรับ agent เริ่มต้น:

    - **สถานะ Skills**: นับ skills ที่ eligible, missing-requirements และ allowlist-blocked
    - **ไดเรกทอรี workspace แบบเดิม**: เตือนเมื่อมี `~/openclaw` หรือไดเรกทอรี workspace แบบเดิมอื่น ๆ อยู่ข้าง workspace ปัจจุบัน
    - **สถานะ Plugin**: นับ Plugin ที่ enabled/disabled/errored; แสดง plugin ID สำหรับข้อผิดพลาดใด ๆ; รายงานความสามารถของ bundle plugin
    - **คำเตือนความเข้ากันได้ของ Plugin**: แจ้งเตือน Plugin ที่มีปัญหาความเข้ากันได้กับ runtime ปัจจุบัน
    - **การวินิจฉัย Plugin**: แสดง warning หรือ error ใด ๆ ตอนโหลดที่ plugin registry ส่งออกมา

  </Accordion>
  <Accordion title="11b. ขนาดไฟล์ bootstrap">
    ตัวตรวจสุขภาพจะตรวจว่าไฟล์ bootstrap ของ workspace (เช่น `AGENTS.md`, `CLAUDE.md` หรือไฟล์บริบทอื่นที่ inject เข้ามา) ใกล้หรือเกิน character budget ที่กำหนดไว้หรือไม่ โดยรายงานจำนวนอักขระ raw เทียบกับ injected ต่อไฟล์, เปอร์เซ็นต์การตัดทอน, สาเหตุการตัดทอน (`max/file` หรือ `max/total`) และจำนวนอักขระ injected รวมเป็นสัดส่วนของ budget ทั้งหมด เมื่อไฟล์ถูกตัดทอนหรือใกล้ถึงขีดจำกัด ตัวตรวจสุขภาพจะพิมพ์คำแนะนำสำหรับปรับ `agents.defaults.bootstrapMaxChars` และ `agents.defaults.bootstrapTotalMaxChars`
  </Accordion>
  <Accordion title="11d. การล้าง Plugin channel ที่ล้าสมัย">
    เมื่อ `openclaw doctor --fix` ลบ Plugin channel ที่หายไป ระบบจะลบ config ที่ dangling และ scoped ตาม channel ซึ่งอ้างถึง Plugin นั้นด้วย: รายการ `channels.<id>`, heartbeat target ที่ระบุชื่อ channel และ override `agents.*.models["<channel>/*"]` สิ่งนี้ป้องกัน boot loop ของ Gateway ซึ่ง channel runtime หายไปแล้ว แต่ config ยังขอให้ gateway bind เข้ากับมัน
  </Accordion>
  <Accordion title="11c. Shell completion">
    ตัวตรวจสุขภาพจะตรวจว่า tab completion ถูกติดตั้งสำหรับ shell ปัจจุบัน (zsh, bash, fish หรือ PowerShell) หรือไม่:

    - หาก shell profile ใช้ pattern completion แบบ dynamic ที่ช้า (`source <(openclaw completion ...)`) ตัวตรวจสุขภาพจะอัปเกรดเป็น variant แบบ cached file ที่เร็วกว่า
    - หาก completion ถูกกำหนดค่าใน profile แต่ไฟล์ cache หายไป ตัวตรวจสุขภาพจะสร้าง cache ใหม่โดยอัตโนมัติ
    - หากไม่มีการกำหนดค่า completion เลย ตัวตรวจสุขภาพจะแจ้งให้ติดตั้ง (โหมด interactive เท่านั้น; ข้ามด้วย `--non-interactive`)

    รัน `openclaw completion --write-state` เพื่อสร้าง cache ใหม่ด้วยตนเอง

  </Accordion>
  <Accordion title="12. การตรวจ auth ของ Gateway (local token)">
    ตัวตรวจสุขภาพตรวจความพร้อมของ auth token สำหรับ local gateway

    - หากโหมด token ต้องใช้ token และไม่มีแหล่ง token อยู่ ตัวตรวจสุขภาพจะเสนอให้สร้างขึ้น
    - หาก `gateway.auth.token` จัดการโดย SecretRef แต่ใช้งานไม่ได้ ตัวตรวจสุขภาพจะเตือนและไม่เขียนทับด้วย plaintext
    - `openclaw doctor --generate-gateway-token` จะบังคับสร้างเฉพาะเมื่อไม่ได้กำหนดค่า token SecretRef ไว้เท่านั้น

  </Accordion>
  <Accordion title="12b. การซ่อมแซมแบบอ่านอย่างเดียวที่รับรู้ SecretRef">
    โฟลว์การซ่อมแซมบางรายการจำเป็นต้องตรวจสอบข้อมูลประจำตัวที่กำหนดค่าไว้โดยไม่ทำให้พฤติกรรม fail-fast ของรันไทม์อ่อนลง

    - ตอนนี้ `openclaw doctor --fix` ใช้โมเดลสรุป SecretRef แบบอ่านอย่างเดียวเดียวกับคำสั่งตระกูลสถานะสำหรับการซ่อมแซมการกำหนดค่าแบบเจาะจง
    - ตัวอย่าง: การซ่อมแซม Telegram `allowFrom` / `groupAllowFrom` `@username` จะพยายามใช้ข้อมูลประจำตัวของบอตที่กำหนดค่าไว้เมื่อพร้อมใช้งาน
    - หากโทเค็นบอต Telegram ถูกกำหนดค่าผ่าน SecretRef แต่ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานว่าข้อมูลประจำตัวถูกกำหนดค่าไว้แต่ไม่พร้อมใช้งาน และข้ามการแก้ไขอัตโนมัติ แทนที่จะล้มเหลวหรือรายงานผิดว่าโทเค็นหายไป

  </Accordion>
  <Accordion title="13. การตรวจสุขภาพ Gateway + การรีสตาร์ต">
    Doctor จะเรียกใช้การตรวจสุขภาพและเสนอให้รีสตาร์ต Gateway เมื่อดูเหมือนไม่อยู่ในสถานะปกติ
  </Accordion>
  <Accordion title="13b. ความพร้อมของการค้นหาหน่วยความจำ">
    Doctor ตรวจสอบว่าผู้ให้บริการ embedding สำหรับการค้นหาหน่วยความจำที่กำหนดค่าไว้พร้อมสำหรับเอเจนต์เริ่มต้นหรือไม่ พฤติกรรมขึ้นอยู่กับแบ็กเอนด์และผู้ให้บริการที่กำหนดค่าไว้:

    - **แบ็กเอนด์ QMD**: ตรวจสอบว่าไบนารี `qmd` พร้อมใช้งานและเริ่มทำงานได้หรือไม่ หากไม่ได้ จะพิมพ์คำแนะนำการแก้ไข รวมถึงแพ็กเกจ npm และตัวเลือกพาธไบนารีแบบกำหนดเอง
    - **ผู้ให้บริการภายในเครื่องที่ระบุชัดเจน**: ตรวจสอบไฟล์โมเดลภายในเครื่องหรือ URL โมเดลระยะไกล/ดาวน์โหลดได้ที่รู้จัก หากไม่พบ จะแนะนำให้เปลี่ยนไปใช้ผู้ให้บริการระยะไกล
    - **ผู้ให้บริการระยะไกลที่ระบุชัดเจน** (`openai`, `voyage` ฯลฯ): ตรวจสอบว่ามี API key อยู่ในสภาพแวดล้อมหรือที่เก็บ auth หรือไม่ และพิมพ์คำแนะนำการแก้ไขที่นำไปใช้ได้หากขาดหาย
    - **ผู้ให้บริการอัตโนมัติ**: ตรวจสอบความพร้อมของโมเดลภายในเครื่องก่อน จากนั้นลองผู้ให้บริการระยะไกลแต่ละรายตามลำดับการเลือกอัตโนมัติ

    เมื่อมีผลการตรวจสอบ Gateway ที่แคชไว้พร้อมใช้งาน (Gateway อยู่ในสถานะปกติ ณ เวลาที่ตรวจสอบ) doctor จะอ้างอิงผลนั้นเทียบกับการกำหนดค่าที่ CLI มองเห็น และระบุความคลาดเคลื่อนใดๆ Doctor จะไม่เริ่มการ ping embedding ใหม่ในเส้นทางเริ่มต้น ให้ใช้คำสั่งสถานะหน่วยความจำเชิงลึกเมื่อต้องการตรวจสอบผู้ให้บริการแบบสด

    ใช้ `openclaw memory status --deep` เพื่อตรวจสอบความพร้อมของ embedding ขณะรันไทม์

  </Accordion>
  <Accordion title="14. คำเตือนสถานะแชนเนล">
    หาก Gateway อยู่ในสถานะปกติ doctor จะเรียกใช้การตรวจสอบสถานะแชนเนลและรายงานคำเตือนพร้อมการแก้ไขที่แนะนำ
  </Accordion>
  <Accordion title="15. การตรวจสอบ + ซ่อมแซมการกำหนดค่า supervisor">
    Doctor ตรวจสอบการกำหนดค่า supervisor ที่ติดตั้งไว้ (launchd/systemd/schtasks) เพื่อหาค่าเริ่มต้นที่ขาดหายหรือล้าสมัย (เช่น การพึ่งพา network-online ของ systemd และดีเลย์การรีสตาร์ต) เมื่อพบความไม่ตรงกัน จะแนะนำให้อัปเดตและสามารถเขียนไฟล์บริการ/งานใหม่เป็นค่าเริ่มต้นปัจจุบันได้

    หมายเหตุ:

    - `openclaw doctor` จะแจ้งยืนยันก่อนเขียนการกำหนดค่า supervisor ใหม่
    - `openclaw doctor --yes` ยอมรับพรอมป์การซ่อมแซมเริ่มต้น
    - `openclaw doctor --repair` ใช้การแก้ไขที่แนะนำโดยไม่มีพรอมป์
    - `openclaw doctor --repair --force` เขียนทับการกำหนดค่า supervisor แบบกำหนดเอง
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` ทำให้ doctor เป็นแบบอ่านอย่างเดียวสำหรับวงจรชีวิตบริการ Gateway โดยยังคงรายงานสุขภาพบริการและเรียกใช้การซ่อมแซมที่ไม่ใช่บริการ แต่ข้ามการติดตั้ง/เริ่ม/รีสตาร์ต/บูตสแตรปบริการ การเขียนการกำหนดค่า supervisor ใหม่ และการล้างบริการเดิม เพราะ supervisor ภายนอกเป็นเจ้าของวงจรชีวิตนั้น
    - บน Linux doctor จะไม่เขียนเมทาดาทาคำสั่ง/entrypoint ใหม่ในขณะที่หน่วย systemd Gateway ที่ตรงกันทำงานอยู่ และยังละเว้นหน่วยเพิ่มเติมที่คล้าย Gateway ซึ่งไม่ทำงานและไม่ใช่ legacy ระหว่างการสแกนบริการซ้ำ เพื่อไม่ให้ไฟล์บริการคู่กันสร้างสัญญาณรบกวนในการล้างข้อมูล
    - หาก token auth ต้องใช้โทเค็นและ `gateway.auth.token` ถูกจัดการด้วย SecretRef การติดตั้ง/ซ่อมแซมบริการของ doctor จะตรวจสอบ SecretRef แต่จะไม่บันทึกค่าโทเค็นข้อความธรรมดาที่ resolve แล้วลงในเมทาดาทาสภาพแวดล้อมของบริการ supervisor
    - Doctor ตรวจจับค่าสภาพแวดล้อมบริการที่จัดการโดย `.env`/รองรับด้วย SecretRef ซึ่งการติดตั้ง LaunchAgent, systemd หรือ Windows Scheduled Task รุ่นเก่าฝังไว้แบบ inline และเขียนเมทาดาทาบริการใหม่เพื่อให้ค่าเหล่านั้นโหลดจากแหล่งรันไทม์แทนที่จะมาจากนิยาม supervisor
    - Doctor ตรวจจับเมื่อคำสั่งบริการยังคงตรึง `--port` เก่าหลังจาก `gateway.port` เปลี่ยน และเขียนเมทาดาทาบริการใหม่ให้เป็นพอร์ตปัจจุบัน
    - หาก token auth ต้องใช้โทเค็นและ SecretRef ของโทเค็นที่กำหนดค่าไว้ยัง resolve ไม่ได้ doctor จะบล็อกเส้นทางติดตั้ง/ซ่อมแซมพร้อมคำแนะนำที่นำไปใช้ได้
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้งค่า mode อย่างชัดเจน
    - สำหรับหน่วย user-systemd บน Linux ตอนนี้การตรวจสอบ token drift ของ doctor รวมทั้งแหล่ง `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบเมทาดาทา auth ของบริการ
    - การซ่อมแซมบริการของ Doctor จะปฏิเสธการเขียนใหม่ หยุด หรือรีสตาร์ตบริการ Gateway จากไบนารี OpenClaw รุ่นเก่า เมื่อการกำหนดค่าถูกเขียนครั้งล่าสุดโดยเวอร์ชันที่ใหม่กว่า ดู [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)
    - คุณสามารถบังคับเขียนใหม่ทั้งหมดได้เสมอผ่าน `openclaw gateway install --force`

  </Accordion>
  <Accordion title="16. การวินิจฉัยรันไทม์ + พอร์ตของ Gateway">
    Doctor ตรวจสอบรันไทม์ของบริการ (PID, สถานะการออกล่าสุด) และเตือนเมื่อบริการติดตั้งแล้วแต่ไม่ได้ทำงานจริง นอกจากนี้ยังตรวจสอบการชนกันของพอร์ตบนพอร์ต Gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (Gateway ทำงานอยู่แล้ว, SSH tunnel)
  </Accordion>
  <Accordion title="17. แนวทางปฏิบัติที่ดีสำหรับรันไทม์ Gateway">
    Doctor เตือนเมื่อบริการ Gateway ทำงานบน Bun หรือพาธ Node ที่จัดการด้วยเวอร์ชัน (`nvm`, `fnm`, `volta`, `asdf` ฯลฯ) แชนเนล WhatsApp + Telegram ต้องใช้ Node และพาธของตัวจัดการเวอร์ชันอาจเสียหลังอัปเกรด เพราะบริการไม่โหลด shell init ของคุณ Doctor เสนอให้ย้ายไปใช้การติดตั้ง Node ของระบบเมื่อพร้อมใช้งาน (Homebrew/apt/choco)

    LaunchAgents ของ macOS ที่ติดตั้งหรือซ่อมแซมใหม่ใช้ PATH ระบบมาตรฐาน (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) แทนการคัดลอก PATH ของเชลล์แบบโต้ตอบ ดังนั้น Volta, asdf, fnm, pnpm และไดเรกทอรีตัวจัดการเวอร์ชันอื่นๆ จะไม่เปลี่ยนว่าโปรเซสลูกของ Node จะ resolve จากที่ใด บริการ Linux ยังคงเก็บรากสภาพแวดล้อมที่ระบุชัดเจน (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) และไดเรกทอรี user-bin ที่เสถียร แต่ไดเรกทอรี fallback ของตัวจัดการเวอร์ชันที่เดาจะถูกเขียนลงใน PATH ของบริการเฉพาะเมื่อไดเรกทอรีเหล่านั้นมีอยู่บนดิสก์เท่านั้น

  </Accordion>
  <Accordion title="18. การเขียนการกำหนดค่า + เมทาดาทา wizard">
    Doctor บันทึกการเปลี่ยนแปลงการกำหนดค่าใดๆ และประทับเมทาดาทา wizard เพื่อบันทึกการเรียกใช้ doctor
  </Accordion>
  <Accordion title="19. เคล็ดลับพื้นที่ทำงาน (การสำรองข้อมูล + ระบบหน่วยความจำ)">
    Doctor แนะนำระบบหน่วยความจำของพื้นที่ทำงานเมื่อไม่มี และพิมพ์เคล็ดลับการสำรองข้อมูลหากพื้นที่ทำงานยังไม่ได้อยู่ภายใต้ git

    ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคู่มือฉบับเต็มเกี่ยวกับโครงสร้างพื้นที่ทำงานและการสำรองข้อมูลด้วย git (แนะนำ GitHub หรือ GitLab แบบส่วนตัว)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [runbook ของ Gateway](/th/gateway)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
