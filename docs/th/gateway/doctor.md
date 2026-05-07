---
read_when:
    - การเพิ่มหรือแก้ไขการไมเกรตสำหรับการตรวจวินิจฉัย
    - การนำการเปลี่ยนแปลงการกำหนดค่าที่ทำให้เข้ากันไม่ได้มาใช้
sidebarTitle: Doctor
summary: 'คำสั่ง Doctor: การตรวจสอบสุขภาพ การไมเกรตการกำหนดค่า และขั้นตอนการซ่อมแซม'
title: ตัวตรวจสอบ
x-i18n:
    generated_at: "2026-05-07T01:52:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: d76a31a8f2197e226894f90fb534f53acf969b75ca1dfdf438a26059880e7ab2
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` คือเครื่องมือซ่อมแซม + ย้ายข้อมูลสำหรับ OpenClaw โดยจะแก้ไข config/สถานะที่ล้าสมัย ตรวจสอบสุขภาพ และให้ขั้นตอนซ่อมแซมที่นำไปทำต่อได้

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw doctor
```

### โหมด headless และอัตโนมัติ

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    ยอมรับค่าเริ่มต้นโดยไม่ถามยืนยัน (รวมถึงขั้นตอนซ่อมแซมการรีสตาร์ท/service/sandbox เมื่อใช้ได้)

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    ใช้การซ่อมแซมที่แนะนำโดยไม่ถามยืนยัน (การซ่อมแซม + การรีสตาร์ทในจุดที่ปลอดภัย)

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

    รันโดยไม่มีพรอมป์และใช้เฉพาะการย้ายข้อมูลที่ปลอดภัย (การปรับ config ให้เป็นมาตรฐาน + การย้ายสถานะบนดิสก์) ข้ามการดำเนินการ restart/service/sandbox ที่ต้องให้มนุษย์ยืนยัน การย้ายข้อมูลสถานะรุ่นเก่าจะรันอัตโนมัติเมื่อตรวจพบ

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    สแกน service ของระบบเพื่อหา gateway ที่ติดตั้งเพิ่มเติม (launchd/systemd/schtasks)

  </Tab>
</Tabs>

หากคุณต้องการตรวจทานการเปลี่ยนแปลงก่อนเขียน ให้เปิดไฟล์ config ก่อน:

```bash
cat ~/.openclaw/openclaw.json
```

## สิ่งที่ทำ (สรุป)

<AccordionGroup>
  <Accordion title="สุขภาพ, UI, และอัปเดต">
    - การอัปเดตก่อนรันแบบไม่บังคับสำหรับการติดตั้งผ่าน git (เฉพาะแบบโต้ตอบ)
    - การตรวจสอบความสดใหม่ของโปรโตคอล UI (สร้าง Control UI ใหม่เมื่อสคีมาโปรโตคอลใหม่กว่า)
    - การตรวจสุขภาพ + พรอมป์ให้รีสตาร์ท
    - สรุปสถานะ Skills (พร้อมใช้/หายไป/ถูกบล็อก) และสถานะ plugin

  </Accordion>
  <Accordion title="Config และการย้ายข้อมูล">
    - การปรับ config รุ่นเก่าให้เป็นมาตรฐาน
    - การย้าย config ของ Talk จากฟิลด์แบนรุ่นเก่า `talk.*` ไปเป็น `talk.provider` + `talk.providers.<provider>`
    - การตรวจสอบการย้ายข้อมูลเบราว์เซอร์สำหรับ config ส่วนขยาย Chrome รุ่นเก่าและความพร้อมของ Chrome MCP
    - คำเตือน OpenCode provider override (`models.providers.opencode` / `models.providers.opencode-go`)
    - คำเตือน Codex OAuth shadowing (`models.providers.openai-codex`)
    - การตรวจสอบข้อกำหนดเบื้องต้นของ OAuth TLS สำหรับโปรไฟล์ OpenAI Codex OAuth
    - คำเตือน allowlist ของ Plugin/tool เมื่อ `plugins.allow` จำกัดมาก แต่ policy ของ tool ยังขอ wildcard หรือ tool ที่ plugin เป็นเจ้าของ
    - การย้ายสถานะบนดิสก์รุ่นเก่า (sessions/agent dir/WhatsApp auth)
    - การย้ายคีย์สัญญา manifest ของ plugin รุ่นเก่า (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
    - การย้าย store ของ cron รุ่นเก่า (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบน, payload `provider`, job fallback แบบ webhook ง่าย ๆ `notify: true`)
    - การย้าย runtime-policy ของ agent รุ่นเก่าไปยัง `agents.defaults.agentRuntime` และ `agents.list[].agentRuntime`
    - การล้าง config plugin ที่ค้างอยู่เมื่อเปิดใช้งาน plugin; เมื่อ `plugins.enabled=false` การอ้างอิง plugin ที่ค้างอยู่จะถือเป็น config containment ที่ไม่มีผลและจะถูกเก็บไว้

  </Accordion>
  <Accordion title="สถานะและความสมบูรณ์">
    - การตรวจไฟล์ล็อก session และการล้างล็อกที่ค้างอยู่
    - การซ่อมแซม transcript ของ session สำหรับกิ่ง prompt-rewrite ที่ซ้ำกันซึ่งสร้างโดยบิลด์ 2026.4.24 ที่ได้รับผลกระทบ
    - การตรวจหา tombstone สำหรับการกู้คืนด้วยการรีสตาร์ท subagent ที่ติดค้าง พร้อมรองรับ `--fix` สำหรับล้าง flag การกู้คืนที่ถูกยกเลิกและค้างอยู่ เพื่อให้ startup ไม่ยังคงถือว่า child ถูกยกเลิกจากการรีสตาร์ท
    - การตรวจสอบความสมบูรณ์ของสถานะและสิทธิ์ (sessions, transcripts, state dir)
    - การตรวจสอบสิทธิ์ไฟล์ config (chmod 600) เมื่อรันภายในเครื่อง
    - สุขภาพ auth ของโมเดล: ตรวจ OAuth expiry, สามารถ refresh token ที่ใกล้หมดอายุ, และรายงานสถานะ cooldown/disabled ของ auth-profile
    - การตรวจหา dir workspace เพิ่มเติม (`~/openclaw`)

  </Accordion>
  <Accordion title="Gateway, services, และ supervisors">
    - การซ่อมแซม image ของ sandbox เมื่อเปิดใช้ sandboxing
    - การย้าย service รุ่นเก่าและการตรวจหา gateway เพิ่มเติม
    - การย้ายสถานะรุ่นเก่าของช่องทาง Matrix (ในโหมด `--fix` / `--repair`)
    - การตรวจ runtime ของ Gateway (ติดตั้ง service แล้วแต่ไม่รัน; label launchd ที่แคชไว้)
    - คำเตือนสถานะช่องทาง (probe จาก gateway ที่กำลังรัน)
    - การตรวจสอบการตอบสนองของ WhatsApp สำหรับสุขภาพ event-loop ของ Gateway ที่ลดลงขณะที่ local TUI clients ยังรันอยู่; `--fix` จะหยุดเฉพาะ local TUI clients ที่ตรวจยืนยันแล้ว
    - การซ่อม route ของ Codex สำหรับ model refs รุ่นเก่า `openai-codex/*` ในโมเดลหลัก, fallbacks, heartbeat/subagent/compaction overrides, hooks, channel model overrides, และ session route pins; `--fix` จะเขียนใหม่เป็น `openai/*` และเลือก `agentRuntime.id: "codex"` เฉพาะเมื่อมีการติดตั้ง plugin Codex, เปิดใช้งานแล้ว, มีส่วนร่วมใน harness `codex`, และมี OAuth ที่ใช้งานได้ มิฉะนั้นจะเลือก `agentRuntime.id: "pi"`
    - การ audit config supervisor (launchd/systemd/schtasks) พร้อมการซ่อมแซมแบบไม่บังคับ
    - การล้างสภาพแวดล้อม embedded proxy สำหรับ service ของ gateway ที่จับค่า shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` ระหว่างติดตั้งหรืออัปเดตไว้
    - การตรวจแนวปฏิบัติที่ดีของ runtime Gateway (Node เทียบกับ Bun, path ของ version-manager)
    - การวินิจฉัย port collision ของ Gateway (ค่าเริ่มต้น `18789`)

  </Accordion>
  <Accordion title="Auth, ความปลอดภัย, และ pairing">
    - คำเตือนความปลอดภัยสำหรับ policy ของ DM ที่เปิดกว้าง
    - การตรวจ auth ของ Gateway สำหรับโหมด token ภายในเครื่อง (เสนอการสร้าง token เมื่อไม่มีแหล่ง token; ไม่เขียนทับ config token SecretRef)
    - การตรวจหาปัญหา device pairing (คำขอ pair ครั้งแรกที่ค้างอยู่, การอัปเกรด role/scope ที่ค้างอยู่, drift ของแคช device-token ภายในเครื่องที่ค้างอยู่, และ auth drift ของ paired-record)

  </Accordion>
  <Accordion title="Workspace และ shell">
    - การตรวจ systemd linger บน Linux
    - การตรวจขนาดไฟล์ bootstrap ของ workspace (คำเตือน truncation/near-limit สำหรับไฟล์ context)
    - การตรวจความพร้อมของ Skills สำหรับ agent เริ่มต้น; รายงาน skills ที่อนุญาตแต่ขาด bin, env, config, หรือข้อกำหนด OS และ `--fix` สามารถปิดใช้ skills ที่ไม่พร้อมใช้งานใน `skills.entries`
    - การตรวจสถานะ shell completion และการติดตั้ง/อัปเกรดอัตโนมัติ
    - การตรวจความพร้อมของ embedding provider สำหรับ memory search (โมเดลภายในเครื่อง, remote API key, หรือ QMD binary)
    - การตรวจการติดตั้งจาก source (pnpm workspace ไม่ตรงกัน, ขาด UI assets, ขาด tsx binary)
    - เขียน config ที่อัปเดต + metadata ของ wizard

  </Accordion>
</AccordionGroup>

## การ backfill และ reset ของ Dreams UI

ฉาก Dreams ใน Control UI มี action **Backfill**, **Reset**, และ **Clear Grounded** สำหรับ workflow grounded dreaming action เหล่านี้ใช้เมธอด RPC แบบ gateway doctor แต่ **ไม่ใช่** ส่วนหนึ่งของการซ่อมแซม/ย้ายข้อมูลใน `openclaw doctor` CLI

สิ่งที่ action เหล่านี้ทำ:

- **Backfill** สแกนไฟล์ย้อนหลัง `memory/YYYY-MM-DD.md` ใน workspace ที่ใช้งานอยู่, รัน grounded REM diary pass, และเขียน entry backfill ที่ย้อนกลับได้ลงใน `DREAMS.md`
- **Reset** ลบเฉพาะ entry diary backfill ที่ทำเครื่องหมายไว้เหล่านั้นออกจาก `DREAMS.md`
- **Clear Grounded** ลบเฉพาะ entry ระยะสั้นแบบ staged grounded-only ที่มาจาก historical replay และยังไม่ได้สะสม live recall หรือ daily support

สิ่งที่ action เหล่านี้ **ไม่** ทำด้วยตัวเอง:

- ไม่แก้ไข `MEMORY.md`
- ไม่รันการย้ายข้อมูล doctor แบบเต็ม
- ไม่ stage grounded candidates เข้าไปใน live short-term promotion store โดยอัตโนมัติ เว้นแต่คุณจะรัน staged CLI path อย่างชัดเจนก่อน

หากคุณต้องการให้ grounded historical replay มีผลต่อ deep promotion lane ปกติ ให้ใช้ flow ของ CLI แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

คำสั่งนั้นจะ stage grounded durable candidates เข้าไปใน short-term dreaming store ขณะที่ยังใช้ `DREAMS.md` เป็นพื้นผิวสำหรับตรวจทาน

## พฤติกรรมโดยละเอียดและเหตุผล

<AccordionGroup>
  <Accordion title="0. การอัปเดตแบบไม่บังคับ (การติดตั้งผ่าน git)">
    หากนี่เป็น git checkout และ doctor กำลังรันแบบโต้ตอบ จะเสนอให้อัปเดต (fetch/rebase/build) ก่อนรัน doctor
  </Accordion>
  <Accordion title="1. การปรับ config ให้เป็นมาตรฐาน">
    หาก config มีรูปแบบค่ารุ่นเก่า (เช่น `messages.ackReaction` โดยไม่มี override เฉพาะช่องทาง) doctor จะปรับให้เป็นสคีมาปัจจุบัน

    รวมถึงฟิลด์แบนของ Talk รุ่นเก่าด้วย config speech สาธารณะของ Talk ปัจจุบันคือ `talk.provider` + `talk.providers.<provider>` และ config realtime voice คือ `talk.realtime.*` Doctor จะเขียนรูปแบบเก่า `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ใหม่เข้าไปใน provider map และเขียน selector realtime ระดับบนรุ่นเก่า (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) ใหม่เข้าไปใน `talk.realtime`

    Doctor ยังเตือนเมื่อ `plugins.allow` ไม่ว่างและ policy ของ tool ใช้
    รายการ wildcard หรือ tool ที่ plugin เป็นเจ้าของ `tools.allow: ["*"]` จะ match เฉพาะ tools
    จาก plugins ที่โหลดจริง; ไม่ได้ข้าม allowlist ของ plugin แบบ exclusive
    Doctor เขียน `plugins.bundledDiscovery: "compat"` สำหรับ config allowlist
    รุ่นเก่าที่ถูกย้ายข้อมูลเพื่อรักษาพฤติกรรม bundled provider เดิมไว้ และ
    จากนั้นชี้ไปที่การตั้งค่า `"allowlist"` ที่เข้มงวดกว่า

  </Accordion>
  <Accordion title="2. การย้ายคีย์ config รุ่นเก่า">
    เมื่อ config มีคีย์ที่เลิกใช้แล้ว คำสั่งอื่นจะปฏิเสธที่จะรันและขอให้คุณรัน `openclaw doctor`

    Doctor จะ:

    - อธิบายว่าพบคีย์รุ่นเก่าใดบ้าง
    - แสดงการย้ายข้อมูลที่ใช้ไป
    - เขียน `~/.openclaw/openclaw.json` ใหม่ด้วยสคีมาที่อัปเดต

    การเริ่มต้น Gateway จะปฏิเสธรูปแบบ config รุ่นเก่าและขอให้คุณรัน `openclaw doctor --fix`; จะไม่เขียน `openclaw.json` ใหม่ตอน startup การย้าย store ของ Cron job ยังถูกจัดการโดย `openclaw doctor --fix` ด้วย

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
    - สำหรับช่องทางที่มี `accounts` แบบตั้งชื่อ แต่ยังมีค่าช่องทางระดับบนสุดแบบบัญชีเดียวค้างอยู่ ให้ย้ายค่าที่อยู่ในขอบเขตบัญชีเหล่านั้นเข้าไปยังบัญชีที่เลื่อนระดับซึ่งเลือกไว้สำหรับช่องทางนั้น (`accounts.default` สำหรับช่องทางส่วนใหญ่; Matrix สามารถคงเป้าหมายแบบตั้งชื่อ/ค่าเริ่มต้นที่ตรงกันเดิมไว้ได้)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - ลบ `agents.defaults.llm`; ใช้ `models.providers.<id>.timeoutSeconds` สำหรับค่า timeout ของผู้ให้บริการ/โมเดลที่ช้า
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - ลบ `browser.relayBindHost` (การตั้งค่ารีเลย์ extension แบบเดิม)
    - `models.providers.*.api: "openai"` แบบเดิม → `"openai-completions"` (การเริ่มต้น Gateway จะข้ามผู้ให้บริการที่ตั้งค่า `api` เป็นค่า enum ในอนาคตหรือที่ไม่รู้จัก แทนที่จะปิดล้มเหลว)

    คำเตือนของ doctor ยังรวมคำแนะนำบัญชีค่าเริ่มต้นสำหรับช่องทางหลายบัญชีด้วย:

    - หากมีการกำหนดค่ารายการ `channels.<channel>.accounts` ตั้งแต่สองรายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default` doctor จะเตือนว่าการกำหนดเส้นทางสำรองอาจเลือกบัญชีที่ไม่คาดคิด
    - หากตั้งค่า `channels.<channel>.defaultAccount` เป็น ID บัญชีที่ไม่รู้จัก doctor จะเตือนและแสดงรายการ ID บัญชีที่กำหนดค่าไว้

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    หากคุณเพิ่ม `models.providers.opencode`, `opencode-zen` หรือ `opencode-go` ด้วยตนเอง การตั้งค่านั้นจะแทนที่แค็ตตาล็อก OpenCode ในตัวจาก `@mariozechner/pi-ai` ซึ่งอาจบังคับให้โมเดลใช้ API ผิดตัวหรือทำให้ต้นทุนกลายเป็นศูนย์ doctor จะเตือนเพื่อให้คุณลบการแทนที่นั้นและกู้คืนการกำหนดเส้นทาง API + ต้นทุนแบบรายโมเดล
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    หากการกำหนดค่าเบราว์เซอร์ของคุณยังชี้ไปยังพาธ Chrome extension ที่ถูกลบออกแล้ว doctor จะปรับให้เป็นโมเดลแนบ Chrome MCP แบบ host-local ปัจจุบัน:

    - `browser.profiles.*.driver: "extension"` จะกลายเป็น `"existing-session"`
    - `browser.relayBindHost` จะถูกลบออก

    doctor ยังตรวจสอบพาธ Chrome MCP แบบ host-local เมื่อคุณใช้ `defaultProfile: "user"` หรือโปรไฟล์ `existing-session` ที่กำหนดค่าไว้:

    - ตรวจสอบว่ามีการติดตั้ง Google Chrome บนโฮสต์เดียวกันสำหรับโปรไฟล์เชื่อมต่ออัตโนมัติค่าเริ่มต้นหรือไม่
    - ตรวจสอบเวอร์ชัน Chrome ที่ตรวจพบ และเตือนเมื่อเวอร์ชันต่ำกว่า Chrome 144
    - เตือนให้คุณเปิดใช้การดีบักระยะไกลในหน้าตรวจสอบของเบราว์เซอร์ (เช่น `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` หรือ `edge://inspect/#remote-debugging`)

    doctor ไม่สามารถเปิดใช้การตั้งค่าฝั่ง Chrome ให้คุณได้ Chrome MCP แบบ host-local ยังคงต้องมี:

    - เบราว์เซอร์ที่ใช้ Chromium 144+ บนโฮสต์ gateway/node
    - เบราว์เซอร์ทำงานอยู่ภายในเครื่อง
    - เปิดใช้การดีบักระยะไกลในเบราว์เซอร์นั้น
    - อนุมัติพรอมต์ยินยอมการแนบครั้งแรกในเบราว์เซอร์

    ความพร้อมในที่นี้เกี่ยวข้องเฉพาะข้อกำหนดเบื้องต้นของการแนบภายในเครื่องเท่านั้น Existing-session ยังคงใช้ขีดจำกัดเส้นทาง Chrome MCP ปัจจุบัน; เส้นทางขั้นสูงอย่าง `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และการดำเนินการแบบแบตช์ ยังคงต้องใช้เบราว์เซอร์ที่มีการจัดการหรือโปรไฟล์ CDP ดิบ

    การตรวจสอบนี้ **ไม่** ใช้กับ Docker, sandbox, remote-browser หรือโฟลว์ headless อื่น ๆ โฟลว์เหล่านั้นยังคงใช้ CDP ดิบต่อไป

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    เมื่อมีการกำหนดค่าโปรไฟล์ OpenAI Codex OAuth doctor จะตรวจปลายทางการอนุญาตของ OpenAI เพื่อตรวจสอบว่า stack TLS ของ Node/OpenSSL ในเครื่องสามารถตรวจสอบห่วงโซ่ใบรับรองได้ หากการตรวจล้มเหลวด้วยข้อผิดพลาดใบรับรอง (เช่น `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ใบรับรองหมดอายุ หรือใบรับรองที่ลงนามเอง) doctor จะพิมพ์คำแนะนำการแก้ไขเฉพาะแพลตฟอร์ม บน macOS ที่ใช้ Homebrew Node วิธีแก้มักเป็น `brew postinstall ca-certificates` เมื่อใช้ `--deep` การตรวจจะทำงานแม้ว่า gateway จะสุขภาพดีอยู่แล้ว
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    หากคุณเคยเพิ่มการตั้งค่า transport แบบเดิมของ OpenAI ไว้ใต้ `models.providers.openai-codex` การตั้งค่าเหล่านั้นอาจบดบังพาธผู้ให้บริการ Codex OAuth ในตัวที่รีลีสใหม่ใช้โดยอัตโนมัติ doctor จะเตือนเมื่อพบการตั้งค่า transport เก่าเหล่านั้นควบคู่กับ Codex OAuth เพื่อให้คุณลบหรือเขียนการแทนที่ transport ที่ล้าสมัยนั้นใหม่ และได้พฤติกรรมการกำหนดเส้นทาง/สำรองในตัวกลับมา พร็อกซีแบบกำหนดเองและการแทนที่เฉพาะส่วนหัวหัวยังคงรองรับอยู่และจะไม่ทำให้เกิดคำเตือนนี้
  </Accordion>
  <Accordion title="2f. Codex route repair">
    doctor ตรวจสอบ refs โมเดล `openai-codex/*` แบบเดิม การกำหนดเส้นทาง harness ของ Codex แบบเนทีฟใช้ refs โมเดล `openai/*` แบบมาตรฐานพร้อม `agentRuntime.id: "codex"` เพื่อให้ turn ผ่าน harness แอปเซิร์ฟเวอร์ของ Codex แทนพาธ OpenClaw PI OpenAI

    ในโหมด `--fix` / `--repair` doctor จะเขียน refs ของเอเจนต์ค่าเริ่มต้นและรายเอเจนต์ที่ได้รับผลกระทบใหม่ รวมถึงโมเดลหลัก fallback การแทนที่ heartbeat/subagent/compaction, hooks, การแทนที่โมเดลช่องทาง และสถานะเส้นทางเซสชันที่คงอยู่ซึ่งล้าสมัย:

    - `openai-codex/gpt-*` จะกลายเป็น `openai/gpt-*`
    - runtime เอเจนต์ที่ตรงกันจะกลายเป็น `agentRuntime.id: "codex"` เฉพาะเมื่อ Codex ติดตั้งแล้ว เปิดใช้งานแล้ว ส่งมอบ harness `codex` และมี OAuth ที่ใช้งานได้
    - มิฉะนั้น runtime เอเจนต์ที่ตรงกันจะกลายเป็น `agentRuntime.id: "pi"`
    - รายการ fallback ของโมเดลที่มีอยู่จะถูกคงไว้โดยเขียนรายการแบบเดิมใหม่; การตั้งค่ารายโมเดลที่คัดลอกมาจะย้ายจากคีย์แบบเดิมไปยังคีย์มาตรฐาน `openai/*`
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, ประกาศ fallback, การปักหมุด auth-profile และการปักหมุด harness ของ Codex ที่คงอยู่ในเซสชัน จะถูกซ่อมแซมในที่เก็บเซสชันเอเจนต์ทั้งหมดที่ค้นพบ
    - `/codex ...` หมายถึง "ควบคุมหรือผูกการสนทนา Codex แบบเนทีฟจากแชท"
    - `/acp ...` หรือ `runtime: "acp"` หมายถึง "ใช้ adapter ACP/acpx ภายนอก"

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    doctor ยังสแกนที่เก็บเซสชันเอเจนต์ที่ค้นพบเพื่อหาสถานะเส้นทางที่สร้างอัตโนมัติซึ่งล้าสมัย หลังจากคุณย้ายโมเดลหรือ runtime ที่กำหนดค่าไว้ออกจากเส้นทางที่ Plugin เป็นเจ้าของ เช่น Codex

    `openclaw doctor --fix` สามารถล้างสถานะล้าสมัยที่สร้างอัตโนมัติ เช่น การปักหมุดโมเดล `modelOverrideSource: "auto"`, เมทาดาทาโมเดล runtime, ID harness ที่ปักหมุดไว้, การผูกเซสชัน CLI และการแทนที่ auth-profile อัตโนมัติ เมื่อเส้นทางเจ้าของของสิ่งเหล่านั้นไม่ได้ถูกกำหนดค่าอีกต่อไป ตัวเลือกโมเดลเซสชันแบบผู้ใช้ระบุชัดเจนหรือแบบเดิมจะถูกรายงานเพื่อให้ตรวจสอบด้วยตนเองและจะไม่ถูกแตะต้อง; สลับด้วย `/model ...`, `/new` หรือรีเซ็ตเซสชันเมื่อไม่ได้ต้องการเส้นทางนั้นอีกต่อไป

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    doctor สามารถย้ายเลย์เอาต์บนดิสก์รุ่นเก่าเข้าสู่โครงสร้างปัจจุบันได้:

    - ที่เก็บเซสชัน + transcripts:
      - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
    - ไดเรกทอรีเอเจนต์:
      - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
    - สถานะ auth ของ WhatsApp (Baileys):
      - จาก `~/.openclaw/credentials/*.json` แบบเดิม (ยกเว้น `oauth.json`)
      - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID บัญชีค่าเริ่มต้น: `default`)

    การย้ายเหล่านี้เป็นแบบพยายามเต็มที่และทำซ้ำได้อย่างปลอดภัย; doctor จะส่งคำเตือนเมื่อเหลือโฟลเดอร์แบบเดิมไว้เป็นข้อมูลสำรอง Gateway/CLI ยังย้ายเซสชัน + ไดเรกทอรีเอเจนต์แบบเดิมโดยอัตโนมัติเมื่อเริ่มทำงาน เพื่อให้ประวัติ/auth/โมเดลไปอยู่ในพาธรายเอเจนต์โดยไม่ต้องรัน doctor ด้วยตนเอง การย้าย auth ของ WhatsApp ตั้งใจให้ย้ายผ่าน `openclaw doctor` เท่านั้น ตอนนี้การปรับ provider/provider-map ของ Talk ให้เป็นรูปแบบปกติจะเปรียบเทียบด้วยความเท่ากันเชิงโครงสร้าง ดังนั้น diff ที่มีเพียงลำดับคีย์ต่างกันจะไม่ทำให้เกิดการเปลี่ยนแปลง `doctor --fix` แบบ no-op ซ้ำอีก

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    doctor สแกน manifest ของ Plugin ที่ติดตั้งทั้งหมดเพื่อหาคีย์ capability ระดับบนสุดที่เลิกใช้แล้ว (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) เมื่อพบแล้ว จะเสนอให้ย้ายคีย์เหล่านั้นเข้าไปในออบเจ็กต์ `contracts` และเขียนไฟล์ manifest ใหม่ในตำแหน่งเดิม การย้ายนี้ทำซ้ำได้อย่างปลอดภัย; หากคีย์ `contracts` มีค่าเดียวกันอยู่แล้ว คีย์แบบเดิมจะถูกลบออกโดยไม่ทำซ้ำข้อมูล
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    doctor ยังตรวจสอบที่เก็บงาน cron (`~/.openclaw/cron/jobs.json` ตามค่าเริ่มต้น หรือ `cron.store` เมื่อมีการแทนที่) เพื่อหารูปทรงงานเก่าที่ตัวกำหนดเวลายังคงยอมรับเพื่อความเข้ากันได้

    การล้าง cron ปัจจุบันรวมถึง:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - ฟิลด์ payload ระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
    - ฟิลด์ delivery ระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias delivery ของ payload `provider` → `delivery.channel` แบบชัดเจน
    - sentinel ของ `payload.model` ใน cron ที่คงอยู่ซึ่งไม่ถูกต้อง (`"default"`, `"null"`, สตริงว่าง, JSON `null`) → ลบการแทนที่โมเดล
    - งาน fallback webhook แบบเดิมอย่างง่าย `notify: true` → `delivery.mode="webhook"` แบบชัดเจนพร้อม `delivery.to=cron.webhook`

    Doctor จะย้ายงาน `notify: true` อัตโนมัติเฉพาะเมื่อทำได้โดยไม่เปลี่ยนแปลงพฤติกรรมเท่านั้น หากงานหนึ่งรวม fallback ของ notify แบบเดิมเข้ากับโหมดการส่งที่ไม่ใช่ Webhook ซึ่งมีอยู่แล้ว doctor จะเตือนและปล่อยให้งานนั้นรอการตรวจสอบด้วยตนเอง

    บน Linux doctor ยังเตือนเมื่อ crontab ของผู้ใช้ยังคงเรียกใช้ `~/.openclaw/bin/ensure-whatsapp.sh` แบบเดิม สคริปต์เฉพาะโฮสต์นี้ไม่ได้รับการดูแลโดย OpenClaw ปัจจุบัน และอาจเขียนข้อความ `Gateway inactive` ที่ไม่ถูกต้องไปยัง `~/.openclaw/logs/whatsapp-health.log` เมื่อ cron เข้าถึง systemd user bus ไม่ได้ ให้นำรายการ crontab ที่ล้าสมัยออกด้วย `crontab -e`; ใช้ `openclaw channels status --probe`, `openclaw doctor`, และ `openclaw gateway status` สำหรับการตรวจสอบสถานะปัจจุบัน

  </Accordion>
  <Accordion title="3c. การล้างล็อกเซสชัน">
    Doctor สแกนไดเรกทอรีเซสชันของเอเจนต์ทุกตัวเพื่อหาไฟล์ write-lock ที่ค้างอยู่ — ไฟล์ที่ถูกทิ้งไว้เมื่อเซสชันออกอย่างผิดปกติ สำหรับไฟล์ล็อกแต่ละไฟล์ที่พบ ระบบจะรายงาน: พาธ, PID, PID ยังทำงานอยู่หรือไม่, อายุของล็อก, และถือว่าค้างหรือไม่ (PID ตายแล้วหรือเก่ากว่า 30 นาที) ในโหมด `--fix` / `--repair` ระบบจะลบไฟล์ล็อกที่ค้างโดยอัตโนมัติ มิฉะนั้นจะพิมพ์หมายเหตุและแนะนำให้คุณรันซ้ำด้วย `--fix`
  </Accordion>
  <Accordion title="3d. การซ่อมแซมกิ่ง transcript ของเซสชัน">
    Doctor สแกนไฟล์ JSONL ของเซสชันเอเจนต์เพื่อหารูปร่างกิ่งที่ซ้ำกันซึ่งถูกสร้างโดยบั๊กการเขียน prompt transcript ใหม่ใน 2026.4.24: เทิร์นผู้ใช้ที่ถูกทิ้งไว้พร้อมบริบทรันไทม์ภายในของ OpenClaw และกิ่ง sibling ที่ยังใช้งานอยู่ซึ่งมีพรอมป์ผู้ใช้ที่มองเห็นได้เหมือนกัน ในโหมด `--fix` / `--repair` doctor จะสำรองไฟล์ที่ได้รับผลกระทบแต่ละไฟล์ไว้ข้างไฟล์ต้นฉบับ แล้วเขียน transcript ใหม่ไปยังกิ่งที่ใช้งานอยู่ เพื่อให้ประวัติ Gateway และตัวอ่านหน่วยความจำไม่เห็นเทิร์นซ้ำอีก
  </Accordion>
  <Accordion title="4. การตรวจสอบความสมบูรณ์ของสถานะ (การคงอยู่ของเซสชัน, การกำหนดเส้นทาง, และความปลอดภัย)">
    ไดเรกทอรีสถานะคือแกนปฏิบัติการของระบบ หากไดเรกทอรีนี้หายไป คุณจะสูญเสียเซสชัน, ข้อมูลประจำตัว, บันทึก, และการกำหนดค่า (เว้นแต่คุณมีข้อมูลสำรองอยู่ที่อื่น)

    Doctor ตรวจสอบ:

    - **ไดเรกทอรีสถานะหายไป**: เตือนเกี่ยวกับการสูญเสียสถานะอย่างร้ายแรง, แจ้งให้สร้างไดเรกทอรีใหม่, และเตือนว่าระบบไม่สามารถกู้คืนข้อมูลที่หายไปได้
    - **สิทธิ์ของไดเรกทอรีสถานะ**: ตรวจสอบความสามารถในการเขียน; เสนอให้ซ่อมแซมสิทธิ์ (และแสดงคำแนะนำ `chown` เมื่อตรวจพบว่า owner/group ไม่ตรงกัน)
    - **ไดเรกทอรีสถานะที่ซิงค์กับคลาวด์บน macOS**: เตือนเมื่อสถานะ resolve อยู่ใต้ iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ `~/Library/CloudStorage/...` เพราะพาธที่มีการซิงค์หนุนหลังอาจทำให้ I/O ช้าลงและเกิดการแข่งกันของ lock/sync
    - **ไดเรกทอรีสถานะบน SD หรือ eMMC ของ Linux**: เตือนเมื่อสถานะ resolve ไปยังแหล่ง mount แบบ `mmcblk*` เพราะ random I/O ที่อยู่บน SD หรือ eMMC อาจช้ากว่าและสึกหรอเร็วขึ้นภายใต้การเขียนเซสชันและข้อมูลประจำตัว
    - **ไดเรกทอรีเซสชันหายไป**: ต้องมี `sessions/` และไดเรกทอรี session store เพื่อคงประวัติและหลีกเลี่ยง crash แบบ `ENOENT`
    - **Transcript ไม่ตรงกัน**: เตือนเมื่อรายการเซสชันล่าสุดมีไฟล์ transcript หายไป
    - **เซสชันหลัก "JSONL 1 บรรทัด"**: แจ้งเมื่อ transcript หลักมีเพียงหนึ่งบรรทัด (ประวัติไม่ได้สะสมเพิ่ม)
    - **ไดเรกทอรีสถานะหลายชุด**: เตือนเมื่อมีโฟลเดอร์ `~/.openclaw` หลายชุดอยู่ใน home directories หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (ประวัติอาจแยกระหว่างการติดตั้ง)
    - **ตัวเตือนโหมดระยะไกล**: หาก `gateway.mode=remote` doctor จะเตือนให้คุณรันบนโฮสต์ระยะไกล (สถานะอยู่ที่นั่น)
    - **สิทธิ์ของไฟล์กำหนดค่า**: เตือนหาก `~/.openclaw/openclaw.json` อ่านได้โดย group/world และเสนอให้ปรับให้เข้มงวดเป็น `600`

  </Accordion>
  <Accordion title="5. สุขภาพการยืนยันตัวตนของโมเดล (OAuth หมดอายุ)">
    Doctor ตรวจสอบโปรไฟล์ OAuth ใน auth store, เตือนเมื่อโทเค็นกำลังจะหมดอายุหรือหมดอายุแล้ว, และสามารถรีเฟรชเมื่อทำได้อย่างปลอดภัย หากโปรไฟล์ OAuth/token ของ Anthropic ล้าสมัย ระบบจะแนะนำ Anthropic API key หรือเส้นทาง setup-token ของ Anthropic พรอมป์รีเฟรชจะแสดงเฉพาะเมื่อรันแบบโต้ตอบ (TTY); `--non-interactive` จะข้ามความพยายามรีเฟรช

    เมื่อการรีเฟรช OAuth ล้มเหลวถาวร (เช่น `refresh_token_reused`, `invalid_grant`, หรือ provider แจ้งให้คุณลงชื่อเข้าใช้อีกครั้ง) doctor จะรายงานว่าจำเป็นต้องยืนยันตัวตนใหม่ และพิมพ์คำสั่ง `openclaw models auth login --provider ...` ที่ต้องรันแบบตรงตัว

    Doctor ยังรายงานโปรไฟล์ auth ที่ใช้งานไม่ได้ชั่วคราวเนื่องจาก:

    - cooldown ระยะสั้น (rate limits/timeouts/auth failures)
    - การปิดใช้งานที่นานขึ้น (billing/credit failures)

  </Accordion>
  <Accordion title="6. การตรวจสอบความถูกต้องของโมเดล hooks">
    หากตั้งค่า `hooks.gmail.model` ไว้ doctor จะตรวจสอบความถูกต้องของการอ้างอิงโมเดลกับแค็ตตาล็อกและ allowlist และเตือนเมื่อ resolve ไม่ได้หรือไม่ได้รับอนุญาต
  </Accordion>
  <Accordion title="7. การซ่อมแซมอิมเมจ sandbox">
    เมื่อเปิดใช้ sandboxing doctor จะตรวจสอบอิมเมจ Docker และเสนอให้ build หรือสลับไปใช้ชื่อแบบเดิมหากอิมเมจปัจจุบันหายไป
  </Accordion>
  <Accordion title="7b. การล้างการติดตั้ง Plugin">
    Doctor ลบสถานะ staging ของ dependency ของ Plugin แบบเดิมที่ OpenClaw สร้างขึ้นในโหมด `openclaw doctor --fix` / `openclaw doctor --repair` ซึ่งครอบคลุม dependency roots ที่สร้างไว้และค้างอยู่, ไดเรกทอรี install-stage เก่า, เศษไฟล์เฉพาะแพ็กเกจจากโค้ดซ่อมแซม dependency ของ bundled-plugin ก่อนหน้า, และสำเนา npm ที่จัดการแล้วซึ่ง orphaned หรือ recovered ของ Plugin `@openclaw/*` ที่ bundle มา ซึ่งอาจบัง manifest ที่ bundle มาปัจจุบันได้

    Doctor ยังสามารถติดตั้ง Plugin ที่ดาวน์โหลดได้ซึ่งหายไปใหม่เมื่อ config อ้างอิงถึง Plugin เหล่านั้น แต่ registry Plugin ภายในเครื่องหาไม่พบ ตัวอย่างรวมถึง `plugins.entries` ที่เป็นสาระสำคัญ, การตั้งค่า channel/provider/search ที่กำหนดไว้, และรันไทม์เอเจนต์ที่กำหนดไว้ ระหว่างการอัปเดตแพ็กเกจ doctor จะหลีกเลี่ยงการรันการซ่อมแซม Plugin ผ่าน package-manager ขณะที่กำลังสลับแพ็กเกจ core; รัน `openclaw doctor --fix` อีกครั้งหลังการอัปเดตหาก Plugin ที่กำหนดค่าไว้ยังต้องการการกู้คืน การเริ่มต้น Gateway และการโหลด config ใหม่จะไม่รัน package managers; การติดตั้ง Plugin ยังคงเป็นงาน doctor/install/update ที่ชัดเจน

  </Accordion>
  <Accordion title="8. การย้ายบริการ Gateway และคำแนะนำการล้างข้อมูล">
    Doctor ตรวจพบบริการ Gateway แบบเดิม (launchd/systemd/schtasks) และเสนอให้นำออกแล้วติดตั้งบริการ OpenClaw โดยใช้พอร์ต Gateway ปัจจุบัน นอกจากนี้ยังสามารถสแกนหาบริการเพิ่มเติมที่คล้าย Gateway และพิมพ์คำแนะนำการล้างข้อมูล บริการ Gateway ของ OpenClaw ที่ตั้งชื่อตามโปรไฟล์ถือเป็น first-class และจะไม่ถูกแจ้งว่าเป็น "extra"

    บน Linux หากบริการ Gateway ระดับผู้ใช้หายไป แต่มีบริการ Gateway ของ OpenClaw ระดับระบบอยู่ doctor จะไม่ติดตั้งบริการระดับผู้ใช้ตัวที่สองโดยอัตโนมัติ ตรวจสอบด้วย `openclaw gateway status --deep` หรือ `openclaw doctor --deep` จากนั้นนำรายการซ้ำออกหรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ system supervisor เป็นเจ้าของวงจรชีวิตของ Gateway

  </Accordion>
  <Accordion title="8b. การย้าย Startup Matrix">
    เมื่อบัญชี channel ของ Matrix มีการย้ายสถานะแบบเดิมที่ค้างอยู่หรือดำเนินการได้ doctor (ในโหมด `--fix` / `--repair`) จะสร้าง snapshot ก่อนการย้าย แล้วรันขั้นตอนการย้ายแบบ best-effort: การย้ายสถานะ Matrix แบบเดิมและการเตรียม encrypted-state แบบเดิม ทั้งสองขั้นตอนไม่ทำให้ระบบล้มเหลว; ข้อผิดพลาดจะถูกบันทึกและ startup จะดำเนินต่อไป ในโหมดอ่านอย่างเดียว (`openclaw doctor` โดยไม่มี `--fix`) การตรวจสอบนี้จะถูกข้ามทั้งหมด
  </Accordion>
  <Accordion title="8c. การจับคู่อุปกรณ์และความคลาดเคลื่อนของ auth">
    ตอนนี้ Doctor ตรวจสอบสถานะการจับคู่อุปกรณ์เป็นส่วนหนึ่งของการตรวจสุขภาพปกติ

    สิ่งที่รายงาน:

    - คำขอจับคู่ครั้งแรกที่ค้างอยู่
    - การอัปเกรดบทบาทที่ค้างอยู่สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การอัปเกรด scope ที่ค้างอยู่สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การซ่อมแซม public-key mismatch เมื่อ device id ยังตรงกันแต่ identity ของอุปกรณ์ไม่ตรงกับระเบียนที่อนุมัติแล้ว
    - ระเบียนที่จับคู่แล้วซึ่งไม่มีโทเค็นที่ใช้งานอยู่สำหรับบทบาทที่อนุมัติ
    - โทเค็นที่จับคู่แล้วซึ่ง scope คลาดเคลื่อนออกนอก baseline การจับคู่ที่อนุมัติ
    - รายการ device-token ที่แคชไว้ในเครื่องสำหรับเครื่องปัจจุบันซึ่งเกิดก่อนการหมุนเวียนโทเค็นฝั่ง Gateway หรือมี metadata ของ scope ที่ล้าสมัย

    Doctor ไม่อนุมัติคำขอจับคู่โดยอัตโนมัติหรือหมุนเวียนโทเค็นอุปกรณ์โดยอัตโนมัติ แต่จะพิมพ์ขั้นตอนถัดไปแบบตรงตัวแทน:

    - ตรวจสอบคำขอที่ค้างอยู่ด้วย `openclaw devices list`
    - อนุมัติคำขอที่แน่นอนด้วย `openclaw devices approve <requestId>`
    - หมุนเวียนโทเค็นใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
    - นำระเบียนที่ล้าสมัยออกและอนุมัติใหม่ด้วย `openclaw devices remove <deviceId>`

    สิ่งนี้ปิดช่องโหว่ทั่วไปแบบ "จับคู่แล้วแต่ยังขึ้นว่าต้องจับคู่": ตอนนี้ doctor แยกการจับคู่ครั้งแรกออกจากการอัปเกรดบทบาท/scope ที่ค้างอยู่ และจากความคลาดเคลื่อนของโทเค็น/identity อุปกรณ์ที่ล้าสมัย

  </Accordion>
  <Accordion title="9. คำเตือนด้านความปลอดภัย">
    Doctor แสดงคำเตือนเมื่อ provider เปิดรับ DM โดยไม่มี allowlist หรือเมื่อนโยบายถูกกำหนดค่าในลักษณะที่อันตราย
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    หากรันเป็นบริการผู้ใช้ของ systemd doctor จะทำให้แน่ใจว่าเปิดใช้ lingering แล้ว เพื่อให้ Gateway ยังทำงานต่อหลัง logout
  </Accordion>
  <Accordion title="11. สถานะ workspace (Skills, Plugin, และไดเรกทอรีเดิม)">
    Doctor พิมพ์สรุปสถานะ workspace สำหรับเอเจนต์เริ่มต้น:

    - **สถานะ Skills**: นับ Skills ที่ eligible, missing-requirements, และถูก allowlist-blocked
    - **ไดเรกทอรี workspace แบบเดิม**: เตือนเมื่อ `~/openclaw` หรือไดเรกทอรี workspace แบบเดิมอื่น ๆ มีอยู่ร่วมกับ workspace ปัจจุบัน
    - **สถานะ Plugin**: นับ Plugin ที่เปิดใช้งาน/ปิดใช้งาน/เกิดข้อผิดพลาด; แสดงรายการ ID ของ Plugin สำหรับข้อผิดพลาดใด ๆ; รายงานความสามารถของ Plugin ที่ bundle มา
    - **คำเตือนความเข้ากันได้ของ Plugin**: แจ้ง Plugin ที่มีปัญหาความเข้ากันได้กับรันไทม์ปัจจุบัน
    - **การวินิจฉัย Plugin**: แสดงคำเตือนหรือข้อผิดพลาดตอนโหลดที่ emit โดย registry Plugin

  </Accordion>
  <Accordion title="11b. ขนาดไฟล์ bootstrap">
    Doctor ตรวจสอบว่าไฟล์ bootstrap ของ workspace (เช่น `AGENTS.md`, `CLAUDE.md`, หรือไฟล์ context ที่ inject อื่น ๆ) อยู่ใกล้หรือเกินงบประมาณอักขระที่กำหนดไว้หรือไม่ ระบบรายงานจำนวนอักขระ raw เทียบกับ injected ต่อไฟล์, เปอร์เซ็นต์การตัดทอน, สาเหตุการตัดทอน (`max/file` หรือ `max/total`), และจำนวนอักขระ injected รวมเป็นสัดส่วนของงบประมาณทั้งหมด เมื่อไฟล์ถูกตัดทอนหรือใกล้ถึงขีดจำกัด doctor จะพิมพ์เคล็ดลับสำหรับปรับแต่ง `agents.defaults.bootstrapMaxChars` และ `agents.defaults.bootstrapTotalMaxChars`
  </Accordion>
  <Accordion title="11d. การล้าง Plugin channel ที่ค้างอยู่">
    เมื่อ `openclaw doctor --fix` ลบ Plugin channel ที่หายไป ระบบจะลบ config ที่ค้างอยู่ใน scope ของ channel ซึ่งอ้างอิง Plugin นั้นด้วย: รายการ `channels.<id>`, เป้าหมาย Heartbeat ที่ระบุชื่อ channel, และ overrides ของ `agents.*.models["<channel>/*"]` สิ่งนี้ป้องกัน boot loop ของ Gateway ที่รันไทม์ channel หายไปแล้วแต่ config ยังขอให้ Gateway bind เข้ากับมัน
  </Accordion>
  <Accordion title="11c. การเติมคำสั่งใน shell">
    Doctor ตรวจสอบว่ามีการติดตั้ง tab completion สำหรับ shell ปัจจุบันหรือไม่ (zsh, bash, fish, หรือ PowerShell):

    - หาก shell profile ใช้รูปแบบ dynamic completion ที่ช้า (`source <(openclaw completion ...)`) doctor จะอัปเกรดเป็น variant แบบไฟล์แคชที่เร็วกว่า
    - หาก completion ถูกกำหนดค่าไว้ใน profile แต่ไฟล์แคชหายไป doctor จะสร้างแคชใหม่โดยอัตโนมัติ
    - หากยังไม่ได้กำหนดค่า completion เลย doctor จะแจ้งให้ติดตั้ง (เฉพาะโหมดโต้ตอบ; ข้ามเมื่อใช้ `--non-interactive`)

    รัน `openclaw completion --write-state` เพื่อสร้างแคชใหม่ด้วยตนเอง

  </Accordion>
  <Accordion title="12. การตรวจสอบ auth ของ Gateway (โทเค็นภายในเครื่อง)">
    Doctor ตรวจสอบความพร้อมของ auth โทเค็น Gateway ภายในเครื่อง

    - หากโหมดโทเค็นต้องใช้โทเค็นและไม่มีแหล่งโทเค็น doctor จะเสนอให้สร้างให้
    - หาก `gateway.auth.token` จัดการโดย SecretRef แต่ไม่พร้อมใช้งาน doctor จะเตือนและไม่เขียนทับด้วย plaintext
    - `openclaw doctor --generate-gateway-token` บังคับให้สร้างเฉพาะเมื่อไม่มีการกำหนดค่า SecretRef ของโทเค็น

  </Accordion>
  <Accordion title="12b. การซ่อมแซมแบบอ่านอย่างเดียวที่รับรู้ SecretRef">
    โฟลว์การซ่อมแซมบางรายการจำเป็นต้องตรวจสอบข้อมูลรับรองที่กำหนดค่าไว้ โดยไม่ทำให้พฤติกรรมล้มเหลวทันทีของรันไทม์อ่อนลง

    - `openclaw doctor --fix` ตอนนี้ใช้โมเดลสรุป SecretRef แบบอ่านอย่างเดียวเดียวกับคำสั่งตระกูลสถานะสำหรับการซ่อมแซมคอนฟิกแบบเจาะจง
    - ตัวอย่าง: การซ่อมแซม Telegram `allowFrom` / `groupAllowFrom` `@username` จะพยายามใช้ข้อมูลรับรองบอตที่กำหนดค่าไว้เมื่อพร้อมใช้งาน
    - หากโทเค็นบอต Telegram ถูกกำหนดค่าผ่าน SecretRef แต่ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานว่าข้อมูลรับรองถูกกำหนดค่าไว้แต่ไม่พร้อมใช้งาน และข้ามการแก้ไขอัตโนมัติแทนที่จะขัดข้องหรือรายงานผิดว่าโทเค็นหายไป

  </Accordion>
  <Accordion title="13. การตรวจสุขภาพ Gateway + การรีสตาร์ท">
    Doctor เรียกใช้การตรวจสุขภาพและเสนอให้รีสตาร์ท Gateway เมื่อดูเหมือนไม่แข็งแรง
  </Accordion>
  <Accordion title="13b. ความพร้อมของการค้นหาหน่วยความจำ">
    Doctor ตรวจสอบว่าผู้ให้บริการ embedding สำหรับการค้นหาหน่วยความจำที่กำหนดค่าไว้พร้อมสำหรับเอเจนต์เริ่มต้นหรือไม่ พฤติกรรมจะขึ้นอยู่กับแบ็กเอนด์และผู้ให้บริการที่กำหนดค่าไว้:

    - **แบ็กเอนด์ QMD**: ตรวจสอบว่าไบนารี `qmd` พร้อมใช้งานและเริ่มทำงานได้หรือไม่ หากไม่พร้อม จะแสดงคำแนะนำการแก้ไข รวมถึงแพ็กเกจ npm และตัวเลือกพาธไบนารีแบบกำหนดเอง
    - **ผู้ให้บริการภายในเครื่องแบบระบุชัดเจน**: ตรวจหาไฟล์โมเดลภายในเครื่องหรือ URL โมเดลระยะไกล/ดาวน์โหลดได้ที่รู้จัก หากขาดหาย จะแนะนำให้สลับไปใช้ผู้ให้บริการระยะไกล
    - **ผู้ให้บริการระยะไกลแบบระบุชัดเจน** (`openai`, `voyage` เป็นต้น): ตรวจสอบว่ามีคีย์ API อยู่ในสภาพแวดล้อมหรือที่เก็บการยืนยันตัวตน แสดงคำแนะนำการแก้ไขที่นำไปทำได้จริงหากขาดหาย
    - **ผู้ให้บริการอัตโนมัติ**: ตรวจสอบความพร้อมของโมเดลภายในเครื่องก่อน จากนั้นลองผู้ให้บริการระยะไกลแต่ละรายตามลำดับการเลือกอัตโนมัติ

    เมื่อมีผลลัพธ์การ probe Gateway ที่แคชไว้พร้อมใช้งาน (Gateway แข็งแรงในเวลาที่ตรวจสอบ) doctor จะเทียบผลลัพธ์นั้นกับคอนฟิกที่ CLI มองเห็นและระบุความไม่ตรงกันใดๆ Doctor จะไม่เริ่ม ping embedding ใหม่ในเส้นทางเริ่มต้น ใช้คำสั่งสถานะหน่วยความจำแบบลึกเมื่อคุณต้องการตรวจสอบผู้ให้บริการแบบสด

    ใช้ `openclaw memory status --deep` เพื่อตรวจสอบความพร้อมของ embedding ในรันไทม์

  </Accordion>
  <Accordion title="14. คำเตือนสถานะช่องทาง">
    หาก Gateway แข็งแรง doctor จะเรียกใช้การ probe สถานะช่องทางและรายงานคำเตือนพร้อมการแก้ไขที่แนะนำ
  </Accordion>
  <Accordion title="15. การตรวจสอบ + ซ่อมแซมคอนฟิก supervisor">
    Doctor ตรวจสอบคอนฟิก supervisor ที่ติดตั้งไว้ (launchd/systemd/schtasks) เพื่อหาค่าเริ่มต้นที่ขาดหายหรือล้าสมัย (เช่น dependency ของ systemd network-online และดีเลย์การรีสตาร์ท) เมื่อพบความไม่ตรงกัน จะแนะนำให้อัปเดตและสามารถเขียนไฟล์บริการ/งานใหม่เป็นค่าเริ่มต้นปัจจุบันได้

    หมายเหตุ:

    - `openclaw doctor` จะถามก่อนเขียนคอนฟิก supervisor ใหม่
    - `openclaw doctor --yes` ยอมรับพรอมต์การซ่อมแซมเริ่มต้น
    - `openclaw doctor --repair` ใช้การแก้ไขที่แนะนำโดยไม่ถาม
    - `openclaw doctor --repair --force` เขียนทับคอนฟิก supervisor แบบกำหนดเอง
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` ทำให้ doctor เป็นแบบอ่านอย่างเดียวสำหรับวงจรชีวิตบริการ Gateway โดยยังคงรายงานสุขภาพบริการและเรียกใช้การซ่อมแซมที่ไม่ใช่บริการ แต่ข้ามการติดตั้ง/เริ่ม/รีสตาร์ท/bootstrap บริการ การเขียนคอนฟิก supervisor ใหม่ และการล้างบริการเก่า เพราะ supervisor ภายนอกเป็นเจ้าของวงจรชีวิตนั้น
    - บน Linux doctor จะไม่เขียน metadata คำสั่ง/entrypoint ใหม่ในขณะที่ systemd gateway unit ที่ตรงกันยังทำงานอยู่ และยังละเว้น unit เพิ่มเติมที่ไม่ใช่ legacy ซึ่งไม่ได้ทำงานแต่มีลักษณะคล้าย Gateway ระหว่างการสแกนบริการซ้ำ เพื่อให้ไฟล์บริการประกอบไม่สร้างเสียงรบกวนในการล้างข้อมูล
    - หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็นและ `gateway.auth.token` จัดการด้วย SecretRef การติดตั้ง/ซ่อมแซมบริการของ doctor จะตรวจสอบ SecretRef แต่จะไม่คงค่าโทเค็นข้อความล้วนที่ resolve แล้วไว้ใน metadata สภาพแวดล้อมของบริการ supervisor
    - Doctor ตรวจพบค่าสภาพแวดล้อมของบริการที่จัดการโดย `.env`/SecretRef ซึ่งการติดตั้ง LaunchAgent, systemd หรือ Windows Scheduled Task รุ่นเก่าเคยฝังไว้แบบ inline และเขียน metadata บริการใหม่เพื่อให้ค่าเหล่านั้นโหลดจากแหล่งรันไทม์แทนที่จะมาจากนิยาม supervisor
    - Doctor ตรวจพบเมื่อคำสั่งบริการยังคงตรึง `--port` เก่าไว้หลังจาก `gateway.port` เปลี่ยน และเขียน metadata บริการใหม่เป็นพอร์ตปัจจุบัน
    - หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็นและ SecretRef ของโทเค็นที่กำหนดค่าไว้ยังไม่ได้ resolve doctor จะบล็อกเส้นทางติดตั้ง/ซ่อมแซมพร้อมคำแนะนำที่นำไปทำได้จริง
    - หากทั้ง `gateway.auth.token` และ `gateway.auth.password` ถูกกำหนดค่าไว้และไม่ได้ตั้งค่า `gateway.auth.mode` doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้งค่าโหมดอย่างชัดเจน
    - สำหรับ Linux user-systemd units ตอนนี้การตรวจสอบ token drift ของ doctor รวมทั้งแหล่งที่มา `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบ metadata การยืนยันตัวตนของบริการ
    - การซ่อมแซมบริการของ Doctor จะปฏิเสธการเขียนใหม่ หยุด หรือรีสตาร์ทบริการ Gateway จากไบนารี OpenClaw รุ่นเก่า เมื่อคอนฟิกถูกเขียนล่าสุดโดยเวอร์ชันที่ใหม่กว่า ดู [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)
    - คุณสามารถบังคับเขียนใหม่ทั้งหมดได้เสมอผ่าน `openclaw gateway install --force`

  </Accordion>
  <Accordion title="16. การวินิจฉัยรันไทม์ + พอร์ตของ Gateway">
    Doctor ตรวจสอบรันไทม์ของบริการ (PID, สถานะออกล่าสุด) และเตือนเมื่อบริการติดตั้งแล้วแต่ไม่ได้ทำงานจริง นอกจากนี้ยังตรวจสอบการชนกันของพอร์ตบนพอร์ต Gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (Gateway ทำงานอยู่แล้ว, SSH tunnel)
  </Accordion>
  <Accordion title="17. แนวทางปฏิบัติที่ดีสำหรับรันไทม์ Gateway">
    Doctor เตือนเมื่อบริการ Gateway ทำงานบน Bun หรือพาธ Node ที่จัดการด้วยเวอร์ชัน (`nvm`, `fnm`, `volta`, `asdf` เป็นต้น) ช่องทาง WhatsApp + Telegram ต้องใช้ Node และพาธของตัวจัดการเวอร์ชันอาจเสียหลังอัปเกรด เพราะบริการไม่ได้โหลด shell init ของคุณ Doctor เสนอให้ย้ายไปใช้การติดตั้ง Node ของระบบเมื่อพร้อมใช้งาน (Homebrew/apt/choco)

    macOS LaunchAgents ที่ติดตั้งหรือซ่อมแซมใหม่ใช้ PATH ของระบบแบบ canonical (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) แทนการคัดลอก PATH ของ interactive shell ดังนั้น Volta, asdf, fnm, pnpm และไดเรกทอรีตัวจัดการเวอร์ชันอื่นๆ จะไม่เปลี่ยนว่าโปรเซสลูกของ Node resolve ไปที่ใด บริการ Linux ยังคงเก็บรากสภาพแวดล้อมแบบชัดเจน (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) และไดเรกทอรี user-bin ที่เสถียร แต่ไดเรกทอรี fallback ของตัวจัดการเวอร์ชันที่เดาจะถูกเขียนไปยัง PATH ของบริการเฉพาะเมื่อไดเรกทอรีเหล่านั้นมีอยู่บนดิสก์เท่านั้น

  </Accordion>
  <Accordion title="18. การเขียนคอนฟิก + metadata ของวิซาร์ด">
    Doctor คงการเปลี่ยนแปลงคอนฟิกใดๆ และประทับ metadata ของวิซาร์ดเพื่อบันทึกการเรียกใช้ doctor
  </Accordion>
  <Accordion title="19. เคล็ดลับเวิร์กสเปซ (การสำรองข้อมูล + ระบบหน่วยความจำ)">
    Doctor แนะนำระบบหน่วยความจำของเวิร์กสเปซเมื่อขาดหาย และแสดงเคล็ดลับการสำรองข้อมูลหากเวิร์กสเปซยังไม่ได้อยู่ภายใต้ git

    ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคู่มือฉบับเต็มเกี่ยวกับโครงสร้างเวิร์กสเปซและการสำรองข้อมูลด้วย git (แนะนำ GitHub หรือ GitLab แบบส่วนตัว)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [รันบุ๊ก Gateway](/th/gateway)
- [การแก้ปัญหา Gateway](/th/gateway/troubleshooting)
