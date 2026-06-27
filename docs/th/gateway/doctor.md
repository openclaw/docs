---
read_when:
    - การเพิ่มหรือแก้ไขการย้ายข้อมูลของ doctor
    - การแนะนำการเปลี่ยนแปลง config ที่ไม่เข้ากันย้อนหลัง
sidebarTitle: Doctor
summary: 'คำสั่ง doctor: การตรวจสอบสุขภาพ การย้ายข้อมูลการกำหนดค่า และขั้นตอนการซ่อมแซม'
title: ตัวตรวจสอบ
x-i18n:
    generated_at: "2026-06-27T17:33:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdb5e3fb437a8678c427dee698a0ea6004b22b71c6e38cc6f75ba674fa4fcc5e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` เป็นเครื่องมือซ่อมแซม + ย้ายข้อมูลสำหรับ OpenClaw โดยแก้ไข config/state ที่ค้างเก่า ตรวจสุขภาพ และให้ขั้นตอนซ่อมแซมที่นำไปทำต่อได้

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

    ยอมรับค่าเริ่มต้นโดยไม่ถามยืนยัน (รวมถึงขั้นตอนซ่อมแซม restart/service/sandbox เมื่อมีผลใช้ได้)

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    ใช้การซ่อมแซมที่แนะนำโดยไม่ถามยืนยัน (การซ่อมแซม + การ restart เมื่อปลอดภัย)

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    รันการตรวจสุขภาพแบบมีโครงสร้างสำหรับ CI หรือ automation ก่อนเริ่มงาน โหมดนี้เป็น
    แบบอ่านอย่างเดียว: ไม่ถามยืนยัน ไม่ซ่อมแซม ไม่ย้าย config ไม่ restart services และไม่
    แตะต้อง state

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    ใช้การซ่อมแซมเชิงรุกด้วย (เขียนทับ config supervisor แบบกำหนดเอง)

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    รันโดยไม่ถามยืนยันและใช้เฉพาะ migration ที่ปลอดภัย (การ normalize config + การย้าย state บนดิสก์) ข้ามการกระทำ restart/service/sandbox ที่ต้องให้มนุษย์ยืนยัน migration ของ state แบบ legacy จะรันอัตโนมัติเมื่อตรวจพบ

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    สแกน system services เพื่อหา gateway installs เพิ่มเติม (launchd/systemd/schtasks)

  </Tab>
</Tabs>

หากต้องการตรวจทานการเปลี่ยนแปลงก่อนเขียน ให้เปิดไฟล์ config ก่อน:

```bash
cat ~/.openclaw/openclaw.json
```

## โหมด lint แบบอ่านอย่างเดียว

`openclaw doctor --lint` เป็นโหมดพี่น้องที่เป็นมิตรกับ automation ของ
`openclaw doctor --fix` ทั้งสองใช้การตรวจสุขภาพของ doctor แต่ท่าทีของโหมด
ต่างกัน:

| โหมด                     | การถามยืนยัน   | เขียน config/state     | เอาต์พุต                 | ใช้สำหรับ                      |
| ------------------------ | --------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | ใช่       | ไม่                      | รายงานสุขภาพที่อ่านง่าย | คนตรวจสถานะ         |
| `openclaw doctor --fix`  | บางครั้ง | ใช่ พร้อมนโยบายการซ่อมแซม | log การซ่อมแซมที่อ่านง่าย    | ใช้การซ่อมแซมที่อนุมัติแล้ว       |
| `openclaw doctor --lint` | ไม่        | ไม่                      | findings แบบมีโครงสร้าง    | CI, preflight และ review gates |

การตรวจสุขภาพที่ปรับให้ทันสมัยอาจให้ implementation `repair()` แบบไม่บังคับ
`doctor --fix` จะใช้การซ่อมแซมเหล่านั้นเมื่อมีอยู่ และยังใช้ flow การซ่อมแซม
ของ doctor ที่มีอยู่สำหรับ checks ที่ยังไม่ได้ migrate
สัญญาการซ่อมแซมแบบมีโครงสร้างยังแยกการรายงานการซ่อมแซมออกจากการตรวจจับ:
`detect()` รายงาน findings ปัจจุบัน ขณะที่ `repair()` สามารถรายงานการเปลี่ยนแปลง,
diff ของ config/file และผลข้างเคียงที่ไม่ใช่ไฟล์ วิธีนี้ทำให้เส้นทาง migration ยังเปิดอยู่
สำหรับ `doctor --fix --dry-run` และเอาต์พุต diff ในอนาคต โดยไม่ทำให้ lint checks
วางแผน mutation

ตัวอย่าง:

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

เอาต์พุต JSON มี:

- `ok`: มี finding ที่มองเห็นได้ตรงตาม threshold ความรุนแรงที่เลือกหรือไม่
- `checksRun`: จำนวน health checks ที่รัน
- `checksSkipped`: checks ที่ถูกข้ามโดย profile ที่เลือก, `--only` หรือ `--skip`
- `findings`: diagnostics แบบมีโครงสร้างพร้อม `checkId`, `severity`, `message` และ
  `path`, `line`, `column`, `ocPath` และ `fixHint` แบบไม่บังคับ

Exit codes:

- `0`: ไม่มี findings ที่ระดับหรือสูงกว่า threshold ที่เลือก
- `1`: มี findings อย่างน้อยหนึ่งรายการตรงตาม threshold ที่เลือก
- `2`: command/runtime ล้มเหลวก่อนปล่อย lint findings ได้

ใช้ `--severity-min info|warning|error` เพื่อควบคุมทั้งสิ่งที่พิมพ์และสิ่งที่
ทำให้ lint exit ไม่เป็นศูนย์ ใช้ `--all` เพื่อรันรายการ lint ทั้งหมด
รวมถึง checks เชิงลึกแบบ opt-in ที่ถูกยกเว้นจากชุด automation เริ่มต้น ใช้ `--only <id>` สำหรับ preflight gates แบบแคบ และ
`--skip <id>` เพื่อยกเว้น check ที่มีเสียงรบกวนชั่วคราว โดยยังคงให้ส่วนที่เหลือของ
lint run ทำงานอยู่
ตัวเลือกเอาต์พุต lint เช่น `--json`, `--severity-min`, `--all`, `--only` และ
`--skip` ต้องใช้คู่กับ `--lint`; การรัน doctor และ repair ปกติจะปฏิเสธ
ตัวเลือกเหล่านี้

## สิ่งที่ทำ (สรุป)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - การ update ก่อนเริ่มงานแบบไม่บังคับสำหรับ git installs (เฉพาะ interactive)
    - การตรวจความสดใหม่ของโปรโตคอล UI (build Control UI ใหม่เมื่อ protocol schema ใหม่กว่า)
    - การตรวจสุขภาพ + prompt ให้ restart
    - สรุปสถานะ Skills (eligible/missing/blocked) และสถานะ Plugin

  </Accordion>
  <Accordion title="Config and migrations">
    - การ normalize config สำหรับค่า legacy
    - การ migrate talk config จากฟิลด์ legacy แบบแบน `talk.*` ไปเป็น `talk.provider` + `talk.providers.<provider>`
    - การตรวจ migration ของ browser สำหรับ config legacy ของ Chrome extension และความพร้อม Chrome MCP
    - คำเตือนการ override provider ของ OpenCode (`models.providers.opencode` / `models.providers.opencode-go`)
    - migration ของ provider/profile OpenAI Codex แบบ legacy (`openai-codex` → `openai`) และคำเตือน shadowing สำหรับ `models.providers.openai-codex` ที่ค้างเก่า
    - การตรวจ prerequisites ของ OAuth TLS สำหรับ profile OpenAI Codex OAuth
    - คำเตือน allowlist ของ Plugin/tool เมื่อ `plugins.allow` จำกัดเข้มงวดแต่นโยบาย tool ยังขอ wildcard หรือ tools ที่ Plugin เป็นเจ้าของ
    - migration ของ state บนดิสก์แบบ legacy (sessions/agent dir/WhatsApp auth)
    - migration key สัญญา manifest ของ Plugin แบบ legacy (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
    - migration ของ cron store แบบ legacy (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบน, payload `provider`, งาน fallback webhook `notify: true`)
    - การล้าง runtime-policy ทั้ง agent แบบ legacy; runtime policy ของ provider/model คือ route selector ที่ใช้งานอยู่
    - การล้าง config ของ Plugin ที่ค้างเก่าเมื่อ plugins เปิดใช้งานอยู่; เมื่อ `plugins.enabled=false` การอ้างอิง Plugin ที่ค้างเก่าจะถือเป็น config containment ที่ไม่ทำงานและจะถูกเก็บไว้

  </Accordion>
  <Accordion title="State and integrity">
    - การตรวจไฟล์ lock ของ session และการล้าง lock ที่ค้างเก่า
    - การซ่อมแซม transcript ของ session สำหรับ branch prompt-rewrite ที่ซ้ำกันซึ่งสร้างโดย build 2026.4.24 ที่ได้รับผลกระทบ
    - การตรวจ tombstone สำหรับการกู้คืน restart ของ subagent ที่ค้าง พร้อมรองรับ `--fix` เพื่อล้าง flag การกู้คืนที่ aborted และค้างเก่า เพื่อให้ startup ไม่ถือว่า child เป็น restart-aborted ต่อไป
    - การตรวจความสมบูรณ์ของ state และ permissions (sessions, transcripts, state dir)
    - การตรวจ permission ของไฟล์ config (chmod 600) เมื่อรันในเครื่อง
    - สุขภาพ auth ของ model: ตรวจ OAuth expiry, สามารถ refresh token ที่ใกล้หมดอายุ และรายงานสถานะ cooldown/disabled ของ auth-profile

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - การซ่อมแซม sandbox image เมื่อเปิดใช้ sandboxing
    - migration ของ service แบบ legacy และการตรวจ gateway เพิ่มเติม
    - migration ของ state legacy สำหรับ Matrix channel (ในโหมด `--fix` / `--repair`)
    - การตรวจ runtime ของ Gateway (service ติดตั้งแล้วแต่ไม่ทำงาน; label launchd ที่ cache ไว้)
    - คำเตือนสถานะ channel (probe จาก gateway ที่กำลังรัน)
    - การตรวจ permission เฉพาะ channel อยู่ใต้ `openclaw channels capabilities`; ตัวอย่างเช่น permission ของ Discord voice channel ถูก audit ด้วย `openclaw channels capabilities --channel discord --target channel:<channel-id>`
    - การตรวจ responsiveness ของ WhatsApp สำหรับสุขภาพ event-loop ของ Gateway ที่เสื่อมสภาพโดยยังมี local TUI clients ทำงานอยู่; `--fix` หยุดเฉพาะ local TUI clients ที่ยืนยันแล้ว
    - การซ่อม route ของ Codex สำหรับ model refs แบบ legacy `openai-codex/*` ใน primary models, fallbacks, models สำหรับ image/video generation, overrides ของ heartbeat/subagent/compaction, hooks, overrides ของ channel model และ route pins ของ session; `--fix` เขียนใหม่เป็น `openai/*`, migrate auth profiles/order `openai-codex:*` เป็น `openai:*`, ลบ runtime pins ของ session/whole-agent ที่ค้างเก่า และคง agent refs ของ OpenAI แบบ canonical ไว้บน Codex harness เริ่มต้น
    - การ audit config supervisor (launchd/systemd/schtasks) พร้อมการซ่อมแซมแบบไม่บังคับ
    - การล้าง environment ของ embedded proxy สำหรับ gateway services ที่จับค่า shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` ไว้ระหว่าง install หรือ update
    - การตรวจ best practice ของ runtime Gateway (Node เทียบกับ Bun, paths ของ version-manager)
    - diagnostics สำหรับการชนกันของพอร์ต Gateway (ค่าเริ่มต้น `18789`)

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - คำเตือน security สำหรับนโยบาย DM ที่เปิดกว้าง
    - การตรวจ auth ของ Gateway สำหรับโหมด token ในเครื่อง (เสนอการสร้าง token เมื่อไม่มี token source; ไม่เขียนทับ config SecretRef ของ token)
    - การตรวจจับปัญหาการ pairing อุปกรณ์ (คำขอ pair ครั้งแรกที่ pending, การอัปเกรด role/scope ที่ pending, drift ของ cache device-token ในเครื่องที่ค้างเก่า และ drift ของ auth ใน paired-record)

  </Accordion>
  <Accordion title="Workspace and shell">
    - การตรวจ systemd linger บน Linux
    - การตรวจขนาดไฟล์ bootstrap ของ workspace (คำเตือน truncation/ใกล้ถึง limit สำหรับ context files)
    - การตรวจความพร้อม Skills สำหรับ agent เริ่มต้น; รายงาน skills ที่อนุญาตแต่ขาด bins, env, config หรือข้อกำหนด OS และ `--fix` สามารถปิด skills ที่ใช้ไม่ได้ใน `skills.entries`
    - การตรวจสถานะ shell completion และการ auto-install/upgrade
    - การตรวจความพร้อม provider ของ memory search embedding (local model, remote API key หรือ QMD binary)
    - การตรวจ source install (pnpm workspace mismatch, UI assets หาย, tsx binary หาย)
    - เขียน config ที่ update แล้ว + metadata ของ wizard

  </Accordion>
</AccordionGroup>

## การ backfill และ reset ของ Dreams UI

ฉาก Dreams ใน Control UI มี action **Backfill**, **Reset** และ **Clear Grounded** สำหรับ workflow grounded dreaming action เหล่านี้ใช้ method RPC แบบ doctor-style ของ gateway แต่ **ไม่ใช่** ส่วนหนึ่งของการซ่อมแซม/migration ของ CLI `openclaw doctor`

สิ่งที่ action เหล่านี้ทำ:

- **Backfill** สแกนไฟล์ประวัติ `memory/YYYY-MM-DD.md` ใน workspace ที่ใช้งานอยู่ รัน grounded REM diary pass และเขียน entry backfill ที่ย้อนกลับได้ลงใน `DREAMS.md`
- **Reset** ลบเฉพาะ diary entries ของ backfill ที่ทำเครื่องหมายไว้จาก `DREAMS.md`
- **Clear Grounded** ลบเฉพาะ entry ระยะสั้นแบบ grounded-only ที่ staged ไว้ ซึ่งมาจาก historical replay และยังไม่ได้สะสม live recall หรือ daily support

สิ่งที่ action เหล่านี้ **ไม่** ทำด้วยตัวเอง:

- ไม่แก้ไข `MEMORY.md`
- ไม่รัน doctor migrations แบบเต็ม
- ไม่ stage grounded candidates เข้า live short-term promotion store โดยอัตโนมัติ เว้นแต่คุณจะรัน staged CLI path ก่อนอย่างชัดเจน

หากต้องการให้ grounded historical replay มีผลกับ lane การ promote เชิงลึกตามปกติ ให้ใช้ flow ของ CLI แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

คำสั่งนี้จะ stage grounded durable candidates เข้า short-term dreaming store ขณะที่คง `DREAMS.md` ไว้เป็นพื้นผิวสำหรับ review

## พฤติกรรมและเหตุผลโดยละเอียด

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    หากนี่เป็น git checkout และ doctor กำลังรันแบบ interactive จะเสนอให้ update (fetch/rebase/build) ก่อนรัน doctor
  </Accordion>
  <Accordion title="1. Config normalization">
    หาก config มีรูปแบบค่า legacy (เช่น `messages.ackReaction` โดยไม่มี override เฉพาะ channel) doctor จะ normalize ค่าเหล่านั้นเข้าสู่ schema ปัจจุบัน

    ซึ่งรวมถึงฟิลด์แบบแบนของ Talk legacy ด้วย config speech ของ Talk แบบ public ปัจจุบันคือ `talk.provider` + `talk.providers.<provider>` และ config realtime voice คือ `talk.realtime.*` Doctor เขียนรูปแบบเก่า `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ใหม่เข้า provider map และเขียน selector realtime ระดับบนแบบ legacy (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) ใหม่เข้า `talk.realtime`

    doctor ยังเตือนเมื่อ `plugins.allow` ไม่ว่างและนโยบายเครื่องมือใช้
    รายการไวลด์การ์ดหรือรายการเครื่องมือที่ Plugin เป็นเจ้าของ `tools.allow: ["*"]` จะจับคู่เฉพาะเครื่องมือ
    จาก Plugin ที่โหลดได้จริงเท่านั้น และจะไม่ข้าม allowlist เฉพาะของ Plugin

  </Accordion>
  <Accordion title="2. การย้ายคีย์คอนฟิกแบบเดิม">
    เมื่อคอนฟิกมีคีย์ที่เลิกใช้แล้ว คำสั่งอื่นจะปฏิเสธการทำงานและขอให้คุณเรียกใช้ `openclaw doctor`

    doctor จะ:

    - อธิบายว่าพบคีย์เดิมใดบ้าง
    - แสดงการย้ายที่นำไปใช้
    - เขียน `~/.openclaw/openclaw.json` ใหม่ด้วยสคีมาที่อัปเดตแล้ว

    การเริ่มต้น Gateway จะปฏิเสธรูปแบบคอนฟิกเดิมและขอให้คุณเรียกใช้ `openclaw doctor --fix`; ระบบจะไม่เขียน `openclaw.json` ใหม่ตอนเริ่มต้น การย้ายที่เก็บงาน Cron ก็จัดการโดย `openclaw doctor --fix` เช่นกัน

    การย้ายปัจจุบัน:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - ลบ `channels.webchat` และ `gateway.webchat` ที่ปลดระวางแล้ว
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` ระดับบนสุด
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` แบบเดิม → `talk.provider` + `talk.providers.<provider>`
    - ตัวเลือก Talk แบบเรียลไทม์ระดับบนสุดแบบเดิม (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` และ `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` และ `messages.tts.providers.microsoft`
    - ฟิลด์เลือกผู้พูด TTS (`voice`/`voiceName`/`voiceId`) → `speakerVoice`/`speakerVoiceId`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` และ `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` และ `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - สำหรับช่องทางที่มี `accounts` แบบตั้งชื่อ แต่ยังมีค่าช่องทางระดับบนสุดแบบบัญชีเดียวค้างอยู่ ให้ย้ายค่าที่อยู่ในขอบเขตบัญชีเหล่านั้นไปยังบัญชีที่เลื่อนระดับซึ่งเลือกไว้สำหรับช่องทางนั้น (`accounts.default` สำหรับช่องทางส่วนใหญ่; Matrix สามารถรักษาเป้าหมายแบบตั้งชื่อ/ค่าเริ่มต้นที่ตรงกันอยู่แล้วได้)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - ลบ `agents.defaults.llm`; ใช้ `models.providers.<id>.timeoutSeconds` สำหรับไทม์เอาต์ของผู้ให้บริการ/โมเดลที่ช้า และตั้งค่าไทม์เอาต์ของเอเจนต์/การรันให้สูงกว่าค่านั้นเมื่อทั้งการรันต้องคงอยู่ได้นานกว่า
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - ลบ `browser.relayBindHost` (การตั้งค่ารีเลย์ส่วนขยายแบบเดิม)
    - `models.providers.*.api: "openai"` แบบเดิม → `"openai-completions"` (การเริ่มต้น Gateway จะข้ามผู้ให้บริการที่ตั้งค่า `api` เป็นค่า enum ในอนาคตหรือไม่รู้จักแทนการล้มเหลวแบบปิด)
    - ลบ `plugins.entries.codex.config.codexDynamicToolsProfile`; แอปเซิร์ฟเวอร์ Codex จะคงเครื่องมือเวิร์กสเปซแบบเนทีฟของ Codex ไว้เป็นเนทีฟเสมอ

    คำเตือนของ doctor ยังรวมคำแนะนำค่าเริ่มต้นของบัญชีสำหรับช่องทางหลายบัญชีด้วย:

    - หากกำหนดค่ารายการ `channels.<channel>.accounts` สองรายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default` doctor จะเตือนว่าการกำหนดเส้นทางสำรองอาจเลือกบัญชีที่ไม่คาดคิด
    - หากตั้งค่า `channels.<channel>.defaultAccount` เป็น ID บัญชีที่ไม่รู้จัก doctor จะเตือนและแสดงรายการ ID บัญชีที่กำหนดค่าไว้

  </Accordion>
  <Accordion title="2b. การแทนที่ผู้ให้บริการ OpenCode">
    หากคุณเพิ่ม `models.providers.opencode`, `opencode-zen` หรือ `opencode-go` ด้วยตนเอง ค่านั้นจะแทนที่แคตตาล็อก OpenCode ในตัวจาก `openclaw/plugin-sdk/llm` ซึ่งอาจบังคับให้โมเดลใช้ API ที่ผิดหรือทำให้ต้นทุนเป็นศูนย์ doctor จะเตือนเพื่อให้คุณลบการแทนที่และกู้คืนการกำหนดเส้นทาง API + ต้นทุนรายโมเดล
  </Accordion>
  <Accordion title="2c. การย้ายเบราว์เซอร์และความพร้อมของ Chrome MCP">
    หากคอนฟิกเบราว์เซอร์ของคุณยังชี้ไปยังพาธส่วนขยาย Chrome ที่ถูกลบแล้ว doctor จะปรับให้เป็นโมเดลการแนบ Chrome MCP แบบโฮสต์ภายในปัจจุบัน:

    - `browser.profiles.*.driver: "extension"` กลายเป็น `"existing-session"`
    - `browser.relayBindHost` ถูกลบออก

    doctor ยังตรวจสอบพาธ Chrome MCP แบบโฮสต์ภายในเมื่อคุณใช้ `defaultProfile: "user"` หรือโปรไฟล์ `existing-session` ที่กำหนดค่าไว้:

    - ตรวจว่า Google Chrome ติดตั้งอยู่บนโฮสต์เดียวกันสำหรับโปรไฟล์เชื่อมต่ออัตโนมัติค่าเริ่มต้นหรือไม่
    - ตรวจเวอร์ชัน Chrome ที่ตรวจพบ และเตือนเมื่อเวอร์ชันต่ำกว่า Chrome 144
    - เตือนให้คุณเปิดใช้การดีบักระยะไกลในหน้า inspect ของเบราว์เซอร์ (เช่น `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` หรือ `edge://inspect/#remote-debugging`)

    doctor ไม่สามารถเปิดใช้การตั้งค่าฝั่ง Chrome ให้คุณได้ Chrome MCP แบบโฮสต์ภายในยังต้องการ:

    - เบราว์เซอร์ที่ใช้ Chromium 144+ บนโฮสต์ gateway/node
    - เบราว์เซอร์ทำงานอยู่ในเครื่อง
    - เปิดใช้การดีบักระยะไกลในเบราว์เซอร์นั้น
    - อนุมัติพรอมป์ยินยอมแนบครั้งแรกในเบราว์เซอร์

    ความพร้อมในส่วนนี้เกี่ยวข้องเฉพาะข้อกำหนดเบื้องต้นของการแนบในเครื่องเท่านั้น Existing-session ยังคงใช้ขีดจำกัดเส้นทาง Chrome MCP ปัจจุบัน; เส้นทางขั้นสูง เช่น `responsebody`, การส่งออก PDF, การดักการดาวน์โหลด และการทำงานแบบชุด ยังต้องใช้เบราว์เซอร์ที่จัดการแล้วหรือโปรไฟล์ CDP ดิบ

    การตรวจนี้ **ไม่** ใช้กับ Docker, sandbox, remote-browser หรือโฟลว์ headless อื่น โฟลว์เหล่านั้นยังใช้ CDP ดิบต่อไป

  </Accordion>
  <Accordion title="2d. ข้อกำหนดเบื้องต้นของ OAuth TLS">
    เมื่อกำหนดค่าโปรไฟล์ OpenAI Codex OAuth doctor จะตรวจ endpoint การอนุญาตของ OpenAI เพื่อยืนยันว่าสแต็ก TLS ของ Node/OpenSSL ในเครื่องสามารถตรวจสอบสายโซ่ใบรับรองได้ หากการตรวจล้มเหลวด้วยข้อผิดพลาดใบรับรอง (เช่น `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ใบรับรองหมดอายุ หรือใบรับรองที่ลงนามเอง) doctor จะพิมพ์คำแนะนำการแก้ไขเฉพาะแพลตฟอร์ม บน macOS ที่ใช้ Node จาก Homebrew การแก้มักเป็น `brew postinstall ca-certificates` เมื่อใช้ `--deep` การตรวจจะทำงานแม้ Gateway จะปกติดี
  </Accordion>
  <Accordion title="2e. การแทนที่ผู้ให้บริการ Codex OAuth">
    หากก่อนหน้านี้คุณเพิ่มการตั้งค่าการขนส่ง OpenAI แบบเดิมไว้ใต้ `models.providers.openai-codex` ค่านั้นอาจบดบังพาธผู้ให้บริการ Codex OAuth ในตัวที่รีลีสใหม่กว่าใช้อัตโนมัติ doctor จะเตือนเมื่อเห็นการตั้งค่าการขนส่งเก่าเหล่านั้นอยู่ร่วมกับ Codex OAuth เพื่อให้คุณลบหรือเขียนการแทนที่การขนส่งที่ค้างอยู่ใหม่ และนำพฤติกรรมการกำหนดเส้นทาง/สำรองในตัวกลับมา พร็อกซีแบบกำหนดเองและการแทนที่เฉพาะส่วนหัวรองรับอยู่เช่นเดิมและจะไม่ทำให้เกิดคำเตือนนี้
  </Accordion>
  <Accordion title="2f. การซ่อมเส้นทาง Codex">
    doctor ตรวจหา ref โมเดล `openai-codex/*` แบบเดิม การกำหนดเส้นทางฮาร์เนส Codex แบบเนทีฟใช้ ref โมเดล `openai/*` ตามรูปแบบบัญญัติ; เทิร์นเอเจนต์ OpenAI จะผ่านฮาร์เนสแอปเซิร์ฟเวอร์ Codex แทนพาธผู้ให้บริการ OpenAI ของ OpenClaw

    ในโหมด `--fix` / `--repair` doctor จะเขียน ref ของเอเจนต์ค่าเริ่มต้นและรายเอเจนต์ที่ได้รับผลกระทบใหม่ รวมถึงโมเดลหลัก โมเดลสำรอง โมเดลสร้างภาพ/วิดีโอ การแทนที่ Heartbeat/subagent/Compaction, hooks, การแทนที่โมเดลของช่องทาง และสถานะเส้นทางเซสชันที่คงอยู่ซึ่งค้างอยู่:

    - `openai-codex/gpt-*` กลายเป็น `openai/gpt-*`
    - เจตนา Codex ย้ายไปยังรายการ `agentRuntime.id: "codex"` ตามขอบเขตผู้ให้บริการ/โมเดลสำหรับ ref โมเดลเอเจนต์ที่ซ่อมแล้ว
    - คอนฟิกรันไทม์ทั้งเอเจนต์และ pin รันไทม์เซสชันที่คงอยู่ซึ่งค้างอยู่จะถูกลบ เพราะการเลือกรันไทม์อยู่ในขอบเขตผู้ให้บริการ/โมเดล
    - นโยบายรันไทม์ผู้ให้บริการ/โมเดลที่มีอยู่จะถูกเก็บรักษาไว้ เว้นแต่ ref โมเดลเดิมที่ซ่อมแล้วต้องใช้การกำหนดเส้นทาง Codex เพื่อรักษาพาธ auth เดิม
    - รายการโมเดลสำรองที่มีอยู่จะถูกเก็บรักษาไว้พร้อมเขียนรายการเดิมใหม่; การตั้งค่ารายโมเดลที่คัดลอกไว้จะย้ายจากคีย์เดิมไปยังคีย์ `openai/*` ตามรูปแบบบัญญัติ
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, ประกาศ fallback และ pin โปรไฟล์ auth ของเซสชันที่คงอยู่จะถูกซ่อมในที่เก็บเซสชันเอเจนต์ทั้งหมดที่ค้นพบ
    - `/codex ...` หมายถึง "ควบคุมหรือผูกการสนทนา Codex แบบเนทีฟจากแชต"
    - `/acp ...` หรือ `runtime: "acp"` หมายถึง "ใช้ตัวปรับต่อ ACP/acpx ภายนอก"

  </Accordion>
  <Accordion title="2g. การล้างเส้นทางเซสชัน">
    doctor ยังสแกนที่เก็บเซสชันเอเจนต์ที่ค้นพบเพื่อหาสถานะเส้นทางที่สร้างอัตโนมัติและค้างอยู่ หลังจากคุณย้ายโมเดลหรือรันไทม์ที่กำหนดค่าไว้ให้ออกจากเส้นทางที่ Plugin เป็นเจ้าของ เช่น Codex

    `openclaw doctor --fix` สามารถล้างสถานะค้างที่สร้างอัตโนมัติ เช่น pin โมเดล `modelOverrideSource: "auto"`, เมทาดาทาโมเดลรันไทม์, ID ฮาร์เนสที่ pin ไว้, การผูกเซสชัน CLI และการแทนที่โปรไฟล์ auth อัตโนมัติ เมื่อเส้นทางเจ้าของของสิ่งเหล่านั้นไม่ได้ถูกกำหนดค่าไว้อีกต่อไป ตัวเลือกโมเดลของผู้ใช้แบบชัดเจนหรือเซสชันเดิมจะถูกรายงานเพื่อให้ตรวจสอบด้วยตนเองและปล่อยไว้โดยไม่แตะต้อง; เปลี่ยนด้วย `/model ...`, `/new` หรือรีเซ็ตเซสชันเมื่อไม่ต้องการเส้นทางนั้นอีกต่อไป

  </Accordion>
  <Accordion title="3. การย้ายสถานะเดิม (เลย์เอาต์ดิสก์)">
    doctor สามารถย้ายเลย์เอาต์บนดิสก์ที่เก่ากว่าไปยังโครงสร้างปัจจุบันได้:

    - ที่เก็บเซสชัน + transcripts:
      - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
    - ไดเรกทอรีเอเจนต์:
      - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
    - สถานะ auth ของ WhatsApp (Baileys):
      - จาก `~/.openclaw/credentials/*.json` แบบเดิม (ยกเว้น `oauth.json`)
      - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID บัญชีค่าเริ่มต้น: `default`)

    การย้ายเหล่านี้เป็นแบบพยายามอย่างดีที่สุดและทำซ้ำได้อย่างปลอดภัย; doctor จะส่งคำเตือนเมื่อปล่อยให้โฟลเดอร์เดิมใด ๆ เหลือไว้เป็นข้อมูลสำรอง Gateway/CLI ยังย้ายเซสชันเดิม + ไดเรกทอรีเอเจนต์โดยอัตโนมัติตอนเริ่มต้น เพื่อให้ประวัติ/auth/โมเดลลงไปอยู่ในพาธรายเอเจนต์โดยไม่ต้องเรียก doctor ด้วยตนเอง auth ของ WhatsApp ตั้งใจให้ย้ายผ่าน `openclaw doctor` เท่านั้น การปรับ provider/provider-map ของ Talk ให้เป็นรูปแบบปกติตอนนี้เปรียบเทียบด้วยความเท่ากันเชิงโครงสร้าง ดังนั้น diff ที่ต่างกันเฉพาะลำดับคีย์จะไม่ทำให้เกิดการเปลี่ยนแปลง `doctor --fix` แบบ no-op ซ้ำอีก

  </Accordion>
  <Accordion title="3a. การย้าย manifest ของ Plugin รุ่นเก่า">
    เครื่องมือ doctor สแกน manifest ของ Plugin ที่ติดตั้งทั้งหมดเพื่อหาคีย์ความสามารถระดับบนสุดที่เลิกใช้แล้ว (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) เมื่อพบ ระบบจะเสนอให้ย้ายคีย์เหล่านั้นเข้าไปในออบเจ็กต์ `contracts` และเขียนไฟล์ manifest เดิมทับที่ การย้ายนี้ทำซ้ำได้อย่างปลอดภัย หากคีย์ `contracts` มีค่าเดียวกันอยู่แล้ว คีย์รุ่นเก่าจะถูกลบโดยไม่ทำข้อมูลซ้ำ
  </Accordion>
  <Accordion title="3b. การย้ายที่เก็บ Cron รุ่นเก่า">
    เครื่องมือ doctor ยังตรวจสอบที่เก็บงาน cron (`~/.openclaw/cron/jobs.json` โดยค่าเริ่มต้น หรือ `cron.store` เมื่อถูกแทนที่) เพื่อหารูปแบบงานเก่าที่ยังยอมรับในตัวจัดกำหนดการเพื่อความเข้ากันได้

    การล้าง cron ปัจจุบันประกอบด้วย:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - ฟิลด์ payload ระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
    - ฟิลด์ delivery ระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias การส่ง payload `provider` → `delivery.channel` แบบชัดเจน
    - งาน fallback Webhook รุ่นเก่าที่เป็น `notify: true` → การส่ง Webhook แบบชัดเจนจาก `cron.webhook` เมื่อตั้งค่าไว้; งานประกาศจะยังคงการส่งทางแชตไว้และได้รับ `delivery.completionDestination` เมื่อไม่ได้ตั้งค่า `cron.webhook` เครื่องหมาย `notify` ระดับบนสุดที่ไม่ทำงานจะถูกลบสำหรับงานที่ไม่มีเป้าหมาย (การส่งที่มีอยู่ รวมถึงการประกาศ จะถูกคงไว้) เพราะการส่งขณะรันไทม์ไม่เคยอ่านค่านี้

    Gateway ยังทำความสะอาดแถว cron ที่มีรูปแบบผิดขณะโหลด เพื่อให้งานที่ถูกต้องยังทำงานต่อไปได้ แถวดิบที่มีรูปแบบผิดจะถูกคัดลอกไปยัง `jobs-quarantine.json` ถัดจากที่เก็บที่ใช้งานอยู่ก่อนถูกลบออกจาก `jobs.json`; doctor รายงานแถวที่ถูกกักกันเพื่อให้คุณตรวจสอบหรือซ่อมแซมด้วยตนเองได้

    ตอนเริ่มต้น Gateway จะ normalize projection ขณะรันไทม์และละเว้นเครื่องหมาย `notify` ระดับบนสุด แต่ยังคง config cron ที่บันทึกไว้เพื่อให้ doctor ซ่อมแซม เมื่อไม่ได้ตั้งค่า `cron.webhook` doctor จะลบเครื่องหมายที่ไม่ทำงานสำหรับงานที่ไม่มีเป้าหมายการย้าย (`delivery.mode` เป็น none/ไม่มีอยู่, เป้าหมาย Webhook ที่ใช้ไม่ได้, หรือการส่งประกาศ/แชตที่มีอยู่) โดยปล่อยการส่งเดิมไว้ไม่แตะต้อง ทำให้การรัน `doctor --fix` ซ้ำไม่เตือนงานเดิมอีกต่อไป หากตั้งค่า `cron.webhook` แล้วแต่ไม่ใช่ URL HTTP(S) ที่ถูกต้อง doctor จะยังเตือนและคงเครื่องหมายนั้นไว้เพื่อให้คุณแก้ URL ได้

    บน Linux doctor ยังเตือนเมื่อ crontab ของผู้ใช้ยังเรียกใช้ `~/.openclaw/bin/ensure-whatsapp.sh` รุ่นเก่า สคริปต์เฉพาะโฮสต์นี้ไม่ได้รับการดูแลโดย OpenClaw ปัจจุบัน และอาจเขียนข้อความ `Gateway inactive` ที่ไม่ถูกต้องลงใน `~/.openclaw/logs/whatsapp-health.log` เมื่อ cron เข้าถึง systemd user bus ไม่ได้ ลบรายการ crontab ที่เก่าด้วย `crontab -e`; ใช้ `openclaw channels status --probe`, `openclaw doctor` และ `openclaw gateway status` สำหรับการตรวจสุขภาพปัจจุบัน

  </Accordion>
  <Accordion title="3c. การล้าง lock ของเซสชัน">
    เครื่องมือ doctor สแกนไดเรกทอรีเซสชันของ agent ทุกตัวเพื่อหาไฟล์ write-lock ที่ค้างอยู่ — ไฟล์ที่เหลืออยู่เมื่อเซสชันออกอย่างผิดปกติ สำหรับไฟล์ lock แต่ละไฟล์ที่พบ ระบบจะรายงาน: path, PID, PID นั้นยังทำงานอยู่หรือไม่, อายุของ lock และถือว่าเป็นไฟล์ค้างหรือไม่ (PID ตายแล้ว, metadata เจ้าของมีรูปแบบผิด, เก่ากว่า 30 นาที, หรือ PID ที่ยังทำงานอยู่แต่พิสูจน์ได้ว่าเป็นของกระบวนการที่ไม่ใช่ OpenClaw) ในโหมด `--fix` / `--repair` ระบบจะลบ lock ที่มีเจ้าของเป็น PID ที่ตายแล้ว, กำพร้า, ถูกนำกลับมาใช้ใหม่, เก่าและมีรูปแบบผิด, หรือไม่ใช่ OpenClaw โดยอัตโนมัติ lock เก่าที่ยังเป็นของกระบวนการ OpenClaw ที่ทำงานอยู่จะถูกรายงานแต่คงไว้ เพื่อไม่ให้ doctor ตัดการทำงานของตัวเขียน transcript ที่ยังใช้งานอยู่
  </Accordion>
  <Accordion title="3d. การซ่อมแซม branch ของ transcript เซสชัน">
    เครื่องมือ doctor สแกนไฟล์ JSONL ของเซสชัน agent เพื่อหารูปแบบ branch ซ้ำที่สร้างโดยบั๊กการเขียน prompt transcript ใหม่ใน 2026.4.24: turn ของผู้ใช้ที่ถูกทิ้งซึ่งมี context รันไทม์ภายในของ OpenClaw รวมกับ sibling ที่ยังใช้งานอยู่ซึ่งมี prompt ผู้ใช้ที่มองเห็นได้เหมือนกัน ในโหมด `--fix` / `--repair` doctor จะสำรองไฟล์ที่ได้รับผลกระทบแต่ละไฟล์ไว้ถัดจากต้นฉบับ แล้วเขียน transcript ใหม่ให้เป็น branch ที่ใช้งานอยู่ เพื่อให้ประวัติ Gateway และตัวอ่าน memory ไม่เห็น turn ซ้ำอีก
  </Accordion>
  <Accordion title="4. การตรวจสอบความสมบูรณ์ของสถานะ (การคงอยู่ของเซสชัน, การ routing และความปลอดภัย)">
    ไดเรกทอรีสถานะคือแกนประสาทการทำงาน หากมันหายไป คุณจะสูญเสียเซสชัน ข้อมูลรับรอง log และ config (เว้นแต่คุณมี backup อยู่ที่อื่น)

    Doctor ตรวจสอบ:

    - **ไดเรกทอรีสถานะหายไป**: เตือนเรื่องการสูญเสียสถานะอย่างรุนแรง แจ้งให้สร้างไดเรกทอรีใหม่ และย้ำว่าไม่สามารถกู้คืนข้อมูลที่หายไปได้
    - **สิทธิ์ของไดเรกทอรีสถานะ**: ตรวจสอบว่าสามารถเขียนได้; เสนอให้ซ่อมสิทธิ์ (และแสดงคำใบ้ `chown` เมื่อตรวจพบว่า owner/group ไม่ตรงกัน)
    - **ไดเรกทอรีสถานะบน macOS ที่ซิงก์กับ cloud**: เตือนเมื่อ state resolve ไปอยู่ใต้ iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ `~/Library/CloudStorage/...` เพราะ path ที่รองรับด้วยการ sync อาจทำให้ I/O ช้าลงและเกิดการแข่งขันของ lock/sync
    - **ไดเรกทอรีสถานะ Linux บน SD หรือ eMMC**: เตือนเมื่อ state resolve ไปยังแหล่ง mount `mmcblk*` เพราะ random I/O ที่รองรับด้วย SD หรือ eMMC อาจช้ากว่าและสึกหรอเร็วขึ้นภายใต้การเขียนเซสชันและข้อมูลรับรอง
    - **ไดเรกทอรีสถานะ Linux แบบ volatile**: เตือนเมื่อ state resolve ไปยัง `tmpfs` หรือ `ramfs` เพราะเซสชัน ข้อมูลรับรอง config และสถานะ SQLite พร้อมไฟล์ sidecar WAL/journal จะหายไปเมื่อรีบูต Docker mount แบบ `overlay` จะไม่ถูก flag โดยตั้งใจ เพราะ writable layer ของมันคงอยู่ข้ามการรีบูตโฮสต์ตราบใดที่ container ยังอยู่
    - **ไดเรกทอรีเซสชันหายไป**: `sessions/` และไดเรกทอรีที่เก็บเซสชันจำเป็นต่อการคงประวัติและหลีกเลี่ยง crash แบบ `ENOENT`
    - **Transcript ไม่ตรงกัน**: เตือนเมื่อรายการเซสชันล่าสุดมีไฟล์ transcript หายไป
    - **เซสชันหลัก "JSONL 1 บรรทัด"**: flag เมื่อ transcript หลักมีเพียงหนึ่งบรรทัด (ประวัติไม่ได้สะสม)
    - **ไดเรกทอรีสถานะหลายชุด**: เตือนเมื่อมีโฟลเดอร์ `~/.openclaw` หลายชุดใน home directory ต่าง ๆ หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (ประวัติอาจแยกระหว่างการติดตั้ง)
    - **ตัวเตือนโหมดระยะไกล**: หาก `gateway.mode=remote` doctor จะเตือนให้คุณรันบนโฮสต์ระยะไกล (state อยู่ที่นั่น)
    - **สิทธิ์ไฟล์ config**: เตือนหาก `~/.openclaw/openclaw.json` อ่านได้โดย group/world และเสนอให้จำกัดเป็น `600`

  </Accordion>
  <Accordion title="5. สุขภาพการ auth ของโมเดล (OAuth หมดอายุ)">
    Doctor ตรวจสอบโปรไฟล์ OAuth ในที่เก็บ auth เตือนเมื่อ token ใกล้หมดอายุ/หมดอายุแล้ว และสามารถ refresh ได้เมื่อปลอดภัย หากโปรไฟล์ Anthropic OAuth/token เก่า ระบบจะแนะนำ Anthropic API key หรือ path setup-token ของ Anthropic prompt สำหรับ refresh จะแสดงเฉพาะเมื่อรันแบบโต้ตอบ (TTY); `--non-interactive` จะข้ามความพยายาม refresh

    เมื่อ OAuth refresh ล้มเหลวถาวร (เช่น `refresh_token_reused`, `invalid_grant` หรือ provider บอกให้คุณ sign in อีกครั้ง) doctor จะรายงานว่าจำเป็นต้อง auth ใหม่ และพิมพ์คำสั่ง `openclaw models auth login --provider ...` ที่ต้องรันแบบตรงตัว

    Doctor ยังรายงานโปรไฟล์ auth ที่ใช้งานไม่ได้ชั่วคราวเนื่องจาก:

    - cooldown สั้น ๆ (rate limit/timeout/auth failure)
    - การปิดใช้งานนานขึ้น (billing/credit failure)

    โปรไฟล์ OAuth ของ Codex รุ่นเก่าที่ token อยู่ใน macOS Keychain (onboarding รุ่นเก่าก่อน layout sidecar แบบไฟล์) จะถูกซ่อมโดย doctor เท่านั้น รัน `openclaw doctor --fix` หนึ่งครั้งจาก terminal แบบโต้ตอบเพื่อย้าย token รุ่นเก่าที่รองรับด้วย Keychain เข้าไปใน `auth-profiles.json` แบบ inline; หลังจากนั้น turn แบบ embedded (Telegram, cron, sub-agent dispatch) จะ resolve เป็นโปรไฟล์ OpenAI OAuth แบบ canonical

  </Accordion>
  <Accordion title="6. การตรวจสอบโมเดลของ hooks">
    หากตั้งค่า `hooks.gmail.model` doctor จะตรวจสอบ model reference กับ catalog และ allowlist และเตือนเมื่อ resolve ไม่ได้หรือไม่ได้รับอนุญาต
  </Accordion>
  <Accordion title="7. การซ่อมแซม image ของ sandbox">
    เมื่อเปิดใช้ sandboxing doctor จะตรวจสอบ image ของ Docker และเสนอให้ build หรือสลับไปใช้ชื่อรุ่นเก่าหาก image ปัจจุบันหายไป
  </Accordion>
  <Accordion title="7b. การล้างการติดตั้ง Plugin">
    Doctor ลบสถานะ staging dependency ของ Plugin ที่ OpenClaw สร้างรุ่นเก่าในโหมด `openclaw doctor --fix` / `openclaw doctor --repair` ซึ่งครอบคลุม root dependency ที่สร้างไว้และเก่าแล้ว, ไดเรกทอรี install-stage เก่า, เศษไฟล์เฉพาะ package จากโค้ดซ่อมแซม dependency ของ bundled-plugin รุ่นก่อน และสำเนา npm ที่จัดการไว้ของ Plugin `@openclaw/*` แบบ bundled ที่กำพร้าหรือกู้คืนมา ซึ่งอาจบัง manifest แบบ bundled ปัจจุบัน Doctor ยัง relink package `openclaw` ของโฮสต์เข้าไปใน Plugin npm ที่จัดการไว้และประกาศ `peerDependencies.openclaw` เพื่อให้ runtime import เฉพาะ package เช่น `openclaw/plugin-sdk/*` ยัง resolve ได้หลังการอัปเดตหรือการซ่อม npm

    Doctor ยังสามารถติดตั้ง Plugin ที่ดาวน์โหลดได้ซึ่งหายไปใหม่ เมื่อ config อ้างถึง Plugin เหล่านั้นแต่ registry ของ Plugin ภายในเครื่องหาไม่พบ ตัวอย่างเช่น `plugins.entries` ที่เป็นเนื้อหา, การตั้งค่า channel/provider/search ที่กำหนดไว้ และ runtime ของ agent ที่กำหนดไว้ ระหว่างการอัปเดต package doctor จะหลีกเลี่ยงการซ่อม Plugin ด้วย package-manager ขณะที่ core package กำลังถูกสลับ; รัน `openclaw doctor --fix` อีกครั้งหลังอัปเดตหาก Plugin ที่กำหนดไว้ยังต้องกู้คืน การเริ่มต้น Gateway และการ reload config จะไม่รัน package manager; การติดตั้ง Plugin ยังคงเป็นงาน doctor/install/update ที่ต้องทำอย่างชัดเจน

  </Accordion>
  <Accordion title="8. การย้าย service ของ Gateway และคำใบ้การล้าง">
    Doctor ตรวจพบ service Gateway รุ่นเก่า (launchd/systemd/schtasks) และเสนอให้ลบออกพร้อมติดตั้ง service ของ OpenClaw โดยใช้พอร์ต Gateway ปัจจุบัน นอกจากนี้ยังสามารถสแกนหา service เพิ่มเติมที่คล้าย Gateway และพิมพ์คำใบ้การล้างได้ service Gateway ของ OpenClaw ที่ตั้งชื่อตามโปรไฟล์ถือเป็นสิ่งหลักและจะไม่ถูก flag ว่า "เพิ่มเติม"

    บน Linux หาก service Gateway ระดับผู้ใช้หายไปแต่มี service Gateway ของ OpenClaw ระดับระบบอยู่ doctor จะไม่ติดตั้ง service ระดับผู้ใช้อันที่สองโดยอัตโนมัติ ตรวจสอบด้วย `openclaw gateway status --deep` หรือ `openclaw doctor --deep` จากนั้นลบรายการซ้ำหรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ supervisor ของระบบเป็นเจ้าของ lifecycle ของ Gateway

  </Accordion>
  <Accordion title="8b. การย้าย Startup Matrix">
    เมื่อบัญชี channel ของ Matrix มีการย้ายสถานะรุ่นเก่าที่ค้างอยู่หรือดำเนินการได้ doctor (ในโหมด `--fix` / `--repair`) จะสร้าง snapshot ก่อนการย้าย จากนั้นรันขั้นตอนการย้ายแบบ best-effort: การย้ายสถานะ Matrix รุ่นเก่าและการเตรียม encrypted-state รุ่นเก่า ทั้งสองขั้นตอนไม่ทำให้ระบบล้มเหลว; ข้อผิดพลาดจะถูก log และการเริ่มต้นจะดำเนินต่อไป ในโหมดอ่านอย่างเดียว (`openclaw doctor` โดยไม่มี `--fix`) การตรวจนี้จะถูกข้ามทั้งหมด
  </Accordion>
  <Accordion title="8c. การจับคู่อุปกรณ์และ auth drift">
    Doctor ตอนนี้ตรวจสอบสถานะการจับคู่อุปกรณ์เป็นส่วนหนึ่งของการตรวจสุขภาพปกติ

    สิ่งที่รายงาน:

    - คำขอจับคู่ครั้งแรกที่ค้างอยู่
    - การอัปเกรด role ที่ค้างอยู่สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การอัปเกรด scope ที่ค้างอยู่สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การซ่อม public-key mismatch ที่ device id ยังตรงกันแต่ identity ของอุปกรณ์ไม่ตรงกับ record ที่อนุมัติแล้วอีกต่อไป
    - record ที่จับคู่แล้วซึ่งไม่มี token ที่ active สำหรับ role ที่อนุมัติ
    - token ที่จับคู่แล้วซึ่ง scope drift ออกจาก baseline การจับคู่ที่อนุมัติ
    - รายการ device-token ที่ cache ไว้ในเครื่องสำหรับเครื่องปัจจุบัน ซึ่งเก่ากว่าการ rotate token ฝั่ง Gateway หรือมี metadata scope ที่เก่าแล้ว

    Doctor ไม่อนุมัติคำขอจับคู่หรือ rotate device token โดยอัตโนมัติ แต่พิมพ์ขั้นตอนถัดไปแบบตรงตัวแทน:

    - ตรวจสอบคำขอที่ค้างอยู่ด้วย `openclaw devices list`
    - อนุมัติคำขอที่เจาะจงด้วย `openclaw devices approve <requestId>`
    - rotate token ใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
    - ลบและอนุมัติ record เก่าอีกครั้งด้วย `openclaw devices remove <deviceId>`

    การแก้ไขนี้ปิดช่องโหว่ทั่วไปแบบ "จับคู่แล้วแต่ยังได้รับข้อความว่าต้องจับคู่": ตอนนี้ doctor แยกแยะการจับคู่ครั้งแรกออกจากการอัปเกรดบทบาท/ขอบเขตที่ค้างอยู่ และจากความคลาดเคลื่อนของโทเค็น/อัตลักษณ์อุปกรณ์ที่ล้าสมัย

  </Accordion>
  <Accordion title="9. คำเตือนด้านความปลอดภัย">
    Doctor แสดงคำเตือนเมื่อผู้ให้บริการเปิดรับ DM โดยไม่มี allowlist หรือเมื่อนโยบายถูกกำหนดค่าในลักษณะที่เป็นอันตราย
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    หากรันเป็นบริการผู้ใช้ systemd doctor จะตรวจให้แน่ใจว่าเปิดใช้ lingering เพื่อให้ Gateway ยังทำงานต่อหลังออกจากระบบ
  </Accordion>
  <Accordion title="11. สถานะเวิร์กสเปซ (skills, plugins และ TaskFlows)">
    Doctor พิมพ์สรุปสถานะเวิร์กสเปซสำหรับเอเจนต์เริ่มต้น:

    - **สถานะ Skills**: นับ Skills ที่มีสิทธิ์ใช้งาน, ขาดข้อกำหนด และถูก allowlist บล็อก
    - **สถานะ Plugin**: นับ plugins ที่เปิดใช้/ปิดใช้/เกิดข้อผิดพลาด; แสดงรายการ ID ของ plugin สำหรับข้อผิดพลาดใดๆ; รายงานความสามารถของ bundle plugin
    - **คำเตือนความเข้ากันได้ของ Plugin**: ระบุ plugins ที่มีปัญหาความเข้ากันได้กับ runtime ปัจจุบัน
    - **การวินิจฉัย Plugin**: แสดงคำเตือนหรือข้อผิดพลาดขณะโหลดที่ registry ของ plugin ส่งออกมา
    - **การกู้คืน TaskFlow**: แสดง TaskFlows ที่จัดการอยู่ซึ่งน่าสงสัยและต้องตรวจสอบหรือยกเลิกด้วยตนเอง

  </Accordion>
  <Accordion title="11b. ขนาดไฟล์ bootstrap">
    Doctor ตรวจว่าไฟล์ bootstrap ของเวิร์กสเปซ (เช่น `AGENTS.md`, `CLAUDE.md` หรือไฟล์ context อื่นที่ถูกฉีดเข้าไป) ใกล้หรือเกินงบประมาณจำนวนอักขระที่กำหนดไว้หรือไม่ โดยรายงานจำนวนอักขระดิบเทียบกับจำนวนที่ถูกฉีดต่อไฟล์, เปอร์เซ็นต์การตัดทอน, สาเหตุการตัดทอน (`max/file` หรือ `max/total`) และจำนวนอักขระที่ถูกฉีดทั้งหมดเป็นสัดส่วนของงบประมาณทั้งหมด เมื่อไฟล์ถูกตัดทอนหรือใกล้ถึงขีดจำกัด doctor จะพิมพ์คำแนะนำสำหรับปรับ `agents.defaults.bootstrapMaxChars` และ `agents.defaults.bootstrapTotalMaxChars`
  </Accordion>
  <Accordion title="11d. การล้าง channel plugin ที่ล้าสมัย">
    เมื่อ `openclaw doctor --fix` ลบ channel plugin ที่หายไปแล้ว มันจะลบ config ที่ผูกกับช่องทางซึ่งค้างอยู่และอ้างถึง plugin นั้นด้วย ได้แก่รายการ `channels.<id>`, เป้าหมาย Heartbeat ที่ระบุชื่อช่องทาง และ override ของ `agents.*.models["<channel>/*"]` วิธีนี้ป้องกันลูปการบูต Gateway ที่ runtime ของช่องทางหายไปแล้วแต่ config ยังสั่งให้ gateway ผูกกับช่องทางนั้น
  </Accordion>
  <Accordion title="11c. การเติมคำสั่งใน shell">
    Doctor ตรวจว่ามีการติดตั้งการเติมด้วยแท็บสำหรับ shell ปัจจุบันหรือไม่ (zsh, bash, fish หรือ PowerShell):

    - หากโปรไฟล์ shell ใช้รูปแบบการเติมคำสั่งแบบไดนามิกที่ช้า (`source <(openclaw completion ...)`) doctor จะอัปเกรดเป็นรูปแบบไฟล์แคชที่เร็วกว่า
    - หากกำหนดค่าการเติมคำสั่งไว้ในโปรไฟล์แต่ไฟล์แคชหายไป doctor จะสร้างแคชใหม่โดยอัตโนมัติ
    - หากไม่ได้กำหนดค่าการเติมคำสั่งไว้เลย doctor จะถามให้ติดตั้ง (เฉพาะโหมดโต้ตอบเท่านั้น; ข้ามเมื่อใช้ `--non-interactive`)

    รัน `openclaw completion --write-state` เพื่อสร้างแคชใหม่ด้วยตนเอง

  </Accordion>
  <Accordion title="12. การตรวจสอบการยืนยันตัวตนของ Gateway (โทเค็นภายในเครื่อง)">
    Doctor ตรวจความพร้อมของการยืนยันตัวตนด้วยโทเค็นของ gateway ภายในเครื่อง

    - หากโหมดโทเค็นต้องใช้โทเค็นและไม่มีแหล่งโทเค็น doctor จะเสนอให้สร้างโทเค็น
    - หาก `gateway.auth.token` จัดการโดย SecretRef แต่ไม่พร้อมใช้งาน doctor จะเตือนและจะไม่เขียนทับด้วยข้อความธรรมดา
    - `openclaw doctor --generate-gateway-token` บังคับสร้างเฉพาะเมื่อไม่ได้กำหนดค่า SecretRef ของโทเค็นไว้

  </Accordion>
  <Accordion title="12b. การซ่อมแซมแบบอ่านอย่างเดียวที่รับรู้ SecretRef">
    โฟลว์การซ่อมแซมบางอย่างต้องตรวจสอบข้อมูลประจำตัวที่กำหนดค่าไว้โดยไม่ทำให้พฤติกรรม runtime แบบล้มเหลวเร็วอ่อนลง

    - ตอนนี้ `openclaw doctor --fix` ใช้โมเดลสรุป SecretRef แบบอ่านอย่างเดียวเดียวกับคำสั่งตระกูลสถานะสำหรับการซ่อมแซม config แบบเจาะจง
    - ตัวอย่าง: การซ่อมแซม `@username` ของ Telegram `allowFrom` / `groupAllowFrom` จะพยายามใช้ข้อมูลประจำตัวของบอทที่กำหนดค่าไว้เมื่อพร้อมใช้งาน
    - หากโทเค็นบอท Telegram ถูกกำหนดค่าผ่าน SecretRef แต่ไม่พร้อมใช้งานในพาธคำสั่งปัจจุบัน doctor จะรายงานว่าข้อมูลประจำตัวถูกกำหนดค่าไว้แต่ไม่พร้อมใช้งาน และข้ามการแก้ไขอัตโนมัติแทนที่จะขัดข้องหรือรายงานผิดว่าโทเค็นหายไป

  </Accordion>
  <Accordion title="13. การตรวจสุขภาพ Gateway + การรีสตาร์ต">
    Doctor รันการตรวจสุขภาพและเสนอให้รีสตาร์ต gateway เมื่อดูเหมือนไม่ปกติ
  </Accordion>
  <Accordion title="13b. ความพร้อมของการค้นหาหน่วยความจำ">
    Doctor ตรวจว่าผู้ให้บริการ embedding สำหรับการค้นหาหน่วยความจำที่กำหนดค่าไว้พร้อมสำหรับเอเจนต์เริ่มต้นหรือไม่ พฤติกรรมขึ้นอยู่กับ backend และผู้ให้บริการที่กำหนดค่าไว้:

    - **QMD backend**: ตรวจว่าไบนารี `qmd` พร้อมใช้งานและเริ่มได้หรือไม่ หากไม่ได้ จะพิมพ์คำแนะนำการแก้ไขซึ่งรวมถึงแพ็กเกจ npm และตัวเลือกพาธไบนารีแบบกำหนดเอง
    - **ผู้ให้บริการภายในเครื่องแบบระบุชัดเจน**: ตรวจหาไฟล์โมเดลภายในเครื่องหรือ URL โมเดลระยะไกล/ที่ดาวน์โหลดได้ซึ่งรู้จัก หากหายไป จะแนะนำให้เปลี่ยนไปใช้ผู้ให้บริการระยะไกล
    - **ผู้ให้บริการระยะไกลแบบระบุชัดเจน** (`openai`, `voyage` ฯลฯ): ตรวจว่ามี API key อยู่ใน environment หรือ auth store พิมพ์คำแนะนำการแก้ไขที่ทำได้หากไม่มี
    - **ผู้ให้บริการ auto แบบเก่า**: ถือว่า `memorySearch.provider: "auto"` เป็น OpenAI, ตรวจความพร้อมของ OpenAI และ `doctor --fix` จะเขียนใหม่เป็น `provider: "openai"`

    เมื่อมีผลการ probe Gateway ที่แคชไว้ (gateway มีสุขภาพดี ณ เวลาที่ตรวจ) doctor จะเทียบผลนั้นกับ config ที่ CLI มองเห็นและบันทึกความคลาดเคลื่อนใดๆ Doctor จะไม่เริ่ม ping embedding ใหม่ในพาธเริ่มต้น; ใช้คำสั่งสถานะหน่วยความจำแบบลึกเมื่อคุณต้องการตรวจผู้ให้บริการแบบสด

    ใช้ `openclaw memory status --deep` เพื่อตรวจสอบความพร้อมของ embedding ขณะ runtime

  </Accordion>
  <Accordion title="14. คำเตือนสถานะช่องทาง">
    หาก gateway มีสุขภาพดี doctor จะรันการ probe สถานะช่องทางและรายงานคำเตือนพร้อมวิธีแก้ไขที่แนะนำ
  </Accordion>
  <Accordion title="15. การตรวจสอบ + ซ่อมแซม config ของ supervisor">
    Doctor ตรวจ config ของ supervisor ที่ติดตั้งไว้ (launchd/systemd/schtasks) เพื่อหาค่าเริ่มต้นที่หายไปหรือล้าสมัย (เช่น dependency ของ systemd network-online และเวลาหน่วงการรีสตาร์ต) เมื่อพบความไม่ตรงกัน จะแนะนำให้อัปเดตและสามารถเขียนไฟล์บริการ/งานใหม่เป็นค่าเริ่มต้นปัจจุบันได้

    หมายเหตุ:

    - `openclaw doctor` จะถามก่อนเขียน config ของ supervisor ใหม่
    - `openclaw doctor --yes` ยอมรับ prompt การซ่อมแซมเริ่มต้น
    - `openclaw doctor --fix` ใช้การแก้ไขที่แนะนำโดยไม่ถาม (`--repair` เป็น alias)
    - `openclaw doctor --fix --force` เขียนทับ config supervisor แบบกำหนดเอง
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` ทำให้ doctor เป็นแบบอ่านอย่างเดียวสำหรับวงจรชีวิตบริการ gateway โดยยังคงรายงานสุขภาพบริการและรันการซ่อมแซมที่ไม่ใช่บริการ แต่ข้ามการติดตั้ง/เริ่ม/รีสตาร์ต/bootstrap บริการ, การเขียน config supervisor ใหม่ และการล้างบริการเก่า เพราะ supervisor ภายนอกเป็นเจ้าของวงจรชีวิตนั้น
    - บน Linux doctor จะไม่เขียน metadata ของคำสั่ง/entrypoint ใหม่ขณะที่หน่วย systemd gateway ที่ตรงกันยังทำงานอยู่ นอกจากนี้ยังละเว้นหน่วย gateway-like เพิ่มเติมที่ไม่ใช่ legacy และไม่ได้ใช้งานระหว่างสแกนบริการซ้ำ เพื่อไม่ให้ไฟล์บริการคู่กันสร้างเสียงรบกวนในการล้างข้อมูล
    - หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็นและ `gateway.auth.token` จัดการโดย SecretRef การติดตั้ง/ซ่อมแซมบริการของ doctor จะตรวจสอบ SecretRef แต่จะไม่คงค่าโทเค็นข้อความธรรมดาที่ resolve แล้วลงใน metadata environment ของบริการ supervisor
    - Doctor ตรวจจับค่า environment ของบริการที่จัดการโดย `.env`/SecretRef ซึ่งการติดตั้ง LaunchAgent, systemd หรือ Windows Scheduled Task รุ่นเก่าเคยฝังแบบ inline และเขียน metadata ของบริการใหม่เพื่อให้ค่าเหล่านั้นโหลดจากแหล่ง runtime แทนที่จะอยู่ใน definition ของ supervisor
    - Doctor ตรวจจับเมื่อคำสั่งบริการยังตรึง `--port` เก่าไว้หลัง `gateway.port` เปลี่ยน และเขียน metadata ของบริการใหม่ให้เป็นพอร์ตปัจจุบัน
    - หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็นและ SecretRef ของโทเค็นที่กำหนดค่าไว้ยัง resolve ไม่ได้ doctor จะบล็อกพาธการติดตั้ง/ซ่อมแซมพร้อมคำแนะนำที่ทำได้
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` แล้วแต่ไม่ได้ตั้ง `gateway.auth.mode` doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้งโหมดอย่างชัดเจน
    - สำหรับหน่วย Linux user-systemd ตอนนี้การตรวจ token drift ของ doctor รวมทั้งแหล่ง `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบ metadata การยืนยันตัวตนของบริการ
    - การซ่อมแซมบริการของ Doctor จะปฏิเสธการเขียนใหม่ หยุด หรือรีสตาร์ตบริการ gateway จากไบนารี OpenClaw รุ่นเก่าเมื่อ config ถูกเขียนครั้งล่าสุดโดยเวอร์ชันใหม่กว่า ดู [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)
    - คุณสามารถบังคับเขียนใหม่ทั้งหมดได้เสมอผ่าน `openclaw gateway install --force`

  </Accordion>
  <Accordion title="16. การวินิจฉัย runtime + พอร์ตของ Gateway">
    Doctor ตรวจ runtime ของบริการ (PID, สถานะการออกล่าสุด) และเตือนเมื่อบริการติดตั้งแล้วแต่ไม่ได้ทำงานจริง นอกจากนี้ยังตรวจการชนกันของพอร์ตบนพอร์ต gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (gateway ทำงานอยู่แล้ว, SSH tunnel)
  </Accordion>
  <Accordion title="17. แนวทางปฏิบัติที่ดีของ runtime Gateway">
    Doctor เตือนเมื่อบริการ gateway รันบน Bun หรือพาธ Node ที่จัดการด้วยเวอร์ชัน (`nvm`, `fnm`, `volta`, `asdf` ฯลฯ) ช่องทาง WhatsApp + Telegram ต้องใช้ Node และพาธของ version-manager อาจเสียหลังการอัปเกรดเพราะบริการไม่ได้โหลด shell init ของคุณ Doctor เสนอให้ย้ายไปใช้การติดตั้ง Node ของระบบเมื่อพร้อมใช้งาน (Homebrew/apt/choco)

    LaunchAgents ของ macOS ที่ติดตั้งหรือซ่อมแซมใหม่ใช้ PATH ระบบแบบ canonical (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) แทนการคัดลอก PATH ของ shell แบบโต้ตอบ เพื่อให้ไบนารีระบบที่ Homebrew จัดการยังพร้อมใช้งาน ขณะที่ Volta, asdf, fnm, pnpm และไดเรกทอรี version-manager อื่นๆ ไม่เปลี่ยนว่าโปรเซสลูกของ Node จะ resolve อะไร บริการ Linux ยังเก็บ root environment ที่ระบุชัดเจน (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) และไดเรกทอรี user-bin ที่เสถียรไว้ แต่ไดเรกทอรี fallback ของ version-manager ที่คาดเดาจะถูกเขียนลงใน PATH ของบริการเฉพาะเมื่อไดเรกทอรีเหล่านั้นมีอยู่จริงบนดิสก์

  </Accordion>
  <Accordion title="18. การเขียน config + metadata ของ wizard">
    Doctor คงการเปลี่ยนแปลง config ใดๆ และประทับ metadata ของ wizard เพื่อบันทึกการรัน doctor
  </Accordion>
  <Accordion title="19. เคล็ดลับเวิร์กสเปซ (การสำรองข้อมูล + ระบบหน่วยความจำ)">
    Doctor แนะนำระบบหน่วยความจำของเวิร์กสเปซเมื่อไม่มี และพิมพ์เคล็ดลับการสำรองข้อมูลหากเวิร์กสเปซยังไม่ได้อยู่ภายใต้ git

    ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคู่มือฉบับเต็มเกี่ยวกับโครงสร้างเวิร์กสเปซและการสำรองข้อมูลด้วย git (แนะนำ GitHub หรือ GitLab แบบส่วนตัว)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [Runbook ของ Gateway](/th/gateway)
- [การแก้ปัญหา Gateway](/th/gateway/troubleshooting)
