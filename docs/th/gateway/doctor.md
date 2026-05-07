---
read_when:
    - การเพิ่มหรือแก้ไขไมเกรชันของ doctor
    - การเพิ่มการเปลี่ยนแปลงการกำหนดค่าที่ไม่เข้ากันย้อนหลัง
sidebarTitle: Doctor
summary: 'คำสั่ง doctor: การตรวจสอบสุขภาพ การไมเกรตการกำหนดค่า และขั้นตอนการซ่อมแซม'
title: ตรวจสุขภาพ
x-i18n:
    generated_at: "2026-05-07T13:17:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7826cb4f3e97e56b07a5ba3b1c61860b15d6831d29012a0a16fe8f5f7014d1d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` คือเครื่องมือซ่อมแซม + ย้ายข้อมูลสำหรับ OpenClaw เครื่องมือนี้แก้ไข config/สถานะที่ค้างเก่า ตรวจสุขภาพ และให้ขั้นตอนซ่อมแซมที่นำไปใช้ได้จริง

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

    ยอมรับค่าเริ่มต้นโดยไม่ถาม prompt (รวมถึงขั้นตอนซ่อมแซมการรีสตาร์ท/service/sandbox เมื่อมีผลบังคับใช้)

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    ใช้การซ่อมแซมที่แนะนำโดยไม่ถาม prompt (การซ่อมแซม + การรีสตาร์ทเมื่อปลอดภัย)

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

    รันโดยไม่มี prompt และใช้เฉพาะการย้ายข้อมูลที่ปลอดภัย (การปรับ config ให้เป็นมาตรฐาน + การย้ายสถานะบนดิสก์) ข้ามการดำเนินการ restart/service/sandbox ที่ต้องการการยืนยันจากมนุษย์ การย้ายข้อมูลสถานะ legacy จะรันโดยอัตโนมัติเมื่อตรวจพบ

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
  <Accordion title="สุขภาพ, UI และการอัปเดต">
    - การอัปเดต pre-flight แบบไม่บังคับสำหรับ git installs (เฉพาะแบบ interactive)
    - การตรวจความสดใหม่ของโปรโตคอล UI (สร้าง Control UI ใหม่เมื่อ schema ของโปรโตคอลใหม่กว่า)
    - การตรวจสุขภาพ + prompt ให้รีสตาร์ท
    - สรุปสถานะ Skills (มีสิทธิ์/หายไป/ถูกบล็อก) และสถานะ Plugin

  </Accordion>
  <Accordion title="Config และการย้ายข้อมูล">
    - การปรับ config ให้เป็นมาตรฐานสำหรับค่า legacy
    - การย้าย config ของ Talk จากฟิลด์ legacy แบบแบน `talk.*` ไปเป็น `talk.provider` + `talk.providers.<provider>`
    - การตรวจการย้ายข้อมูล browser สำหรับ config legacy ของ Chrome extension และความพร้อมของ Chrome MCP
    - คำเตือน override สำหรับ OpenCode provider (`models.providers.opencode` / `models.providers.opencode-go`)
    - คำเตือน Codex OAuth shadowing (`models.providers.openai-codex`)
    - การตรวจข้อกำหนดเบื้องต้นของ OAuth TLS สำหรับโปรไฟล์ OpenAI Codex OAuth
    - คำเตือน allowlist ของ Plugin/tool เมื่อ `plugins.allow` จำกัดเข้มงวดแต่ policy ของเครื่องมือยังขอ wildcard หรือเครื่องมือที่ Plugin เป็นเจ้าของ
    - การย้ายข้อมูลสถานะ legacy บนดิสก์ (sessions/agent dir/WhatsApp auth)
    - การย้าย key สัญญา manifest ของ Plugin แบบ legacy (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
    - การย้าย store ของ Cron แบบ legacy (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบนสุด, payload `provider`, fallback jobs ของ webhook แบบง่าย `notify: true`)
    - การย้าย agent runtime-policy แบบ legacy ไปยัง `agents.defaults.agentRuntime` และ `agents.list[].agentRuntime`
    - การล้าง config Plugin ที่ค้างเก่าเมื่อเปิดใช้งาน Plugin; เมื่อ `plugins.enabled=false` การอ้างอิง Plugin ที่ค้างเก่าจะถูกถือเป็น config containment ที่ไม่ทำงานและจะถูกเก็บไว้

  </Accordion>
  <Accordion title="สถานะและความถูกต้องสมบูรณ์">
    - การตรวจไฟล์ lock ของ session และการล้าง lock ที่ค้างเก่า
    - การซ่อมแซม transcript ของ session สำหรับ prompt-rewrite branches ที่ซ้ำกันซึ่งสร้างโดย build 2026.4.24 ที่ได้รับผลกระทบ
    - การตรวจ tombstone สำหรับ restart-recovery ของ subagent ที่ค้าง พร้อมการรองรับ `--fix` เพื่อล้าง flag การกู้คืนที่ aborted และค้างเก่า เพื่อให้ startup ไม่ยังคงถือ child ว่า restart-aborted
    - การตรวจความถูกต้องสมบูรณ์ของสถานะและ permission (sessions, transcripts, state dir)
    - การตรวจ permission ของไฟล์ config (chmod 600) เมื่อรันในเครื่อง
    - สุขภาพ model auth: ตรวจ OAuth expiry, สามารถ refresh token ที่ใกล้หมดอายุ และรายงานสถานะ cooldown/disabled ของ auth-profile
    - การตรวจ workspace dir เพิ่มเติม (`~/openclaw`)

  </Accordion>
  <Accordion title="Gateway, services และ supervisors">
    - การซ่อมแซม sandbox image เมื่อเปิดใช้ sandboxing
    - การย้ายข้อมูล service แบบ legacy และการตรวจ Gateway เพิ่มเติม
    - การย้ายข้อมูลสถานะ legacy ของช่องทาง Matrix (ในโหมด `--fix` / `--repair`)
    - การตรวจ runtime ของ Gateway (ติดตั้ง service แล้วแต่ไม่รัน; label launchd ที่ cache ไว้)
    - คำเตือนสถานะช่องทาง (probe จาก Gateway ที่กำลังรัน)
    - การตรวจ permission เฉพาะช่องทางอยู่ภายใต้ `openclaw channels capabilities`; ตัวอย่างเช่น permission ของ Discord voice channel จะถูก audit ด้วย `openclaw channels capabilities --channel discord --target channel:<channel-id>`
    - การตรวจการตอบสนองของ WhatsApp สำหรับสุขภาพ event-loop ของ Gateway ที่เสื่อมลงโดยที่ local TUI clients ยังรันอยู่; `--fix` จะหยุดเฉพาะ local TUI clients ที่ยืนยันแล้ว
    - การซ่อมแซม route ของ Codex สำหรับ model refs แบบ legacy `openai-codex/*` ใน primary models, fallbacks, heartbeat/subagent/compaction overrides, hooks, channel model overrides และ session route pins; `--fix` เขียนใหม่เป็น `openai/*` และเลือก `agentRuntime.id: "codex"` เฉพาะเมื่อ Codex plugin ถูกติดตั้ง เปิดใช้งาน ส่งมอบ harness `codex` และมี OAuth ที่ใช้งานได้ ไม่เช่นนั้นจะเลือก `agentRuntime.id: "pi"`
    - การ audit config supervisor (launchd/systemd/schtasks) พร้อมการซ่อมแซมแบบไม่บังคับ
    - การล้าง environment ของ embedded proxy สำหรับ Gateway services ที่จับค่า shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` ระหว่าง install หรือ update
    - การตรวจ best practice ของ runtime Gateway (Node เทียบกับ Bun, path ของ version-manager)
    - การวินิจฉัย port collision ของ Gateway (ค่าเริ่มต้น `18789`)

  </Accordion>
  <Accordion title="Auth, security และ pairing">
    - คำเตือนความปลอดภัยสำหรับ policy DM แบบเปิด
    - การตรวจ auth ของ Gateway สำหรับโหมด local token (เสนอการสร้าง token เมื่อไม่มีแหล่ง token; ไม่เขียนทับ config token SecretRef)
    - การตรวจปัญหา device pairing (คำขอ pair ครั้งแรกที่ค้างอยู่, การอัปเกรด role/scope ที่ค้างอยู่, drift ของ local device-token cache ที่ค้างเก่า และ drift ของ paired-record auth)

  </Accordion>
  <Accordion title="Workspace และ shell">
    - การตรวจ systemd linger บน Linux
    - การตรวจขนาดไฟล์ bootstrap ของ workspace (คำเตือน truncation/near-limit สำหรับไฟล์ context)
    - การตรวจความพร้อมของ Skills สำหรับ agent เริ่มต้น; รายงาน skills ที่อนุญาตซึ่งขาด bins, env, config หรือข้อกำหนด OS และ `--fix` สามารถปิดใช้งาน skills ที่ไม่พร้อมใช้งานใน `skills.entries`
    - การตรวจสถานะ shell completion และการติดตั้ง/อัปเกรดอัตโนมัติ
    - การตรวจความพร้อมของ provider สำหรับ memory search embedding (local model, remote API key หรือ QMD binary)
    - การตรวจ source install (pnpm workspace ไม่ตรงกัน, UI assets หายไป, tsx binary หายไป)
    - เขียน config ที่อัปเดตแล้ว + metadata ของ wizard

  </Accordion>
</AccordionGroup>

## Dreams UI backfill และ reset

ฉาก Dreams ใน Control UI มี action **Backfill**, **Reset** และ **Clear Grounded** สำหรับ workflow grounded dreaming action เหล่านี้ใช้เมธอด RPC แบบ gateway doctor-style แต่ **ไม่ใช่** ส่วนหนึ่งของการซ่อมแซม/ย้ายข้อมูลผ่าน CLI ของ `openclaw doctor`

สิ่งที่ action เหล่านี้ทำ:

- **Backfill** สแกนไฟล์ประวัติ `memory/YYYY-MM-DD.md` ใน workspace ที่ active, รัน grounded REM diary pass และเขียนรายการ backfill ที่ย้อนกลับได้ลงใน `DREAMS.md`
- **Reset** ลบเฉพาะรายการ backfill diary ที่มี marker เหล่านั้นออกจาก `DREAMS.md`
- **Clear Grounded** ลบเฉพาะรายการ staged grounded-only short-term ที่มาจาก historical replay และยังไม่ได้สะสม live recall หรือ daily support

สิ่งที่ action เหล่านี้ **ไม่ได้** ทำด้วยตัวเอง:

- action เหล่านี้ไม่แก้ไข `MEMORY.md`
- action เหล่านี้ไม่รันการย้ายข้อมูล doctor แบบเต็ม
- action เหล่านี้ไม่ stage grounded candidates เข้า live short-term promotion store โดยอัตโนมัติ เว้นแต่คุณจะรัน staged CLI path ก่อนอย่างชัดเจน

หากคุณต้องการให้ grounded historical replay ส่งผลต่อ normal deep promotion lane ให้ใช้ flow ของ CLI แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

คำสั่งนั้นจะ stage grounded durable candidates เข้า short-term dreaming store โดยยังคงให้ `DREAMS.md` เป็นพื้นผิวสำหรับตรวจทาน

## พฤติกรรมและเหตุผลโดยละเอียด

<AccordionGroup>
  <Accordion title="0. การอัปเดตแบบไม่บังคับ (git installs)">
    หากนี่เป็น git checkout และ doctor กำลังรันแบบ interactive ระบบจะเสนอให้อัปเดต (fetch/rebase/build) ก่อนรัน doctor
  </Accordion>
  <Accordion title="1. การปรับ config ให้เป็นมาตรฐาน">
    หาก config มีรูปแบบค่า legacy (เช่น `messages.ackReaction` ที่ไม่มี override เฉพาะช่องทาง) doctor จะปรับค่าเหล่านั้นให้เป็น schema ปัจจุบัน

    ซึ่งรวมถึงฟิลด์ legacy Talk แบบแบนด้วย config speech ของ Talk แบบ public ปัจจุบันคือ `talk.provider` + `talk.providers.<provider>` และ config realtime voice คือ `talk.realtime.*` Doctor เขียนรูปแบบ `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` เก่าใหม่เข้า map ของ provider และเขียน selector realtime ระดับบนสุดแบบ legacy (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) ใหม่เข้า `talk.realtime`

    Doctor ยังเตือนเมื่อ `plugins.allow` ไม่ว่าง และ policy ของเครื่องมือใช้
    wildcard หรือ entries ของเครื่องมือที่ Plugin เป็นเจ้าของ `tools.allow: ["*"]` จะ match เฉพาะเครื่องมือ
    จาก Plugin ที่โหลดจริงเท่านั้น; ไม่ได้ bypass exclusive plugin
    allowlist Doctor เขียน `plugins.bundledDiscovery: "compat"` สำหรับ config
    allowlist legacy ที่ย้ายข้อมูลแล้วเพื่อคงพฤติกรรม bundled provider ที่มีอยู่ และ
    จากนั้นชี้ไปยังการตั้งค่า `"allowlist"` ที่เข้มงวดกว่า

  </Accordion>
  <Accordion title="2. การย้าย key config แบบ legacy">
    เมื่อ config มี key ที่เลิกใช้แล้ว คำสั่งอื่นจะปฏิเสธการรันและขอให้คุณรัน `openclaw doctor`

    Doctor จะ:

    - อธิบายว่าเจอ key legacy ใดบ้าง
    - แสดงการย้ายข้อมูลที่ใช้ไป
    - เขียน `~/.openclaw/openclaw.json` ใหม่ด้วย schema ที่อัปเดตแล้ว

    การ startup ของ Gateway จะปฏิเสธรูปแบบ config legacy และขอให้คุณรัน `openclaw doctor --fix`; จะไม่เขียน `openclaw.json` ใหม่ตอน startup การย้ายข้อมูล store ของ Cron job ก็จัดการโดย `openclaw doctor --fix` เช่นกัน

    การย้ายข้อมูลปัจจุบัน:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - คอนฟิกช่องทางที่กำหนดค่าไว้ซึ่งไม่มีนโยบายการตอบกลับที่มองเห็นได้ → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` ระดับบนสุด
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - ค่าเดิม `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - ตัวเลือก Talk แบบเรียลไทม์ระดับบนสุดเดิม (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - สำหรับช่องทางที่มี `accounts` แบบตั้งชื่อ แต่ยังมีค่าช่องทางระดับบนสุดแบบบัญชีเดียวหลงเหลืออยู่ ให้ย้ายค่าที่มีขอบเขตตามบัญชีเหล่านั้นเข้าไปในบัญชีที่ยกระดับซึ่งเลือกไว้สำหรับช่องทางนั้น (`accounts.default` สำหรับช่องทางส่วนใหญ่; Matrix สามารถคงเป้าหมายแบบตั้งชื่อ/ค่าเริ่มต้นที่ตรงกันซึ่งมีอยู่แล้วได้)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - ลบ `agents.defaults.llm`; ใช้ `models.providers.<id>.timeoutSeconds` สำหรับไทม์เอาต์ของผู้ให้บริการ/โมเดลที่ช้า
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - ลบ `browser.relayBindHost` (การตั้งค่ารีเลย์ส่วนขยายแบบเดิม)
    - ค่าเดิม `models.providers.*.api: "openai"` → `"openai-completions"` (การเริ่มต้น Gateway ยังข้ามผู้ให้บริการที่ตั้งค่า `api` เป็นค่า enum ในอนาคตหรือไม่รู้จัก แทนที่จะล้มเหลวโดยปิดกั้น)

    คำเตือนของ doctor ยังรวมคำแนะนำค่าเริ่มต้นของบัญชีสำหรับช่องทางหลายบัญชีด้วย:

    - หากกำหนดค่ารายการ `channels.<channel>.accounts` ไว้สองรายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default` doctor จะเตือนว่าการกำหนดเส้นทางสำรองอาจเลือกบัญชีที่ไม่คาดคิด
    - หากตั้งค่า `channels.<channel>.defaultAccount` เป็น ID บัญชีที่ไม่รู้จัก doctor จะเตือนและแสดงรายการ ID บัญชีที่กำหนดค่าไว้

  </Accordion>
  <Accordion title="2b. การเขียนทับผู้ให้บริการ OpenCode">
    หากคุณเพิ่ม `models.providers.opencode`, `opencode-zen` หรือ `opencode-go` ด้วยตนเอง ค่านั้นจะเขียนทับแค็ตตาล็อก OpenCode ในตัวจาก `@mariozechner/pi-ai` ซึ่งอาจบังคับให้โมเดลใช้ API ผิดหรือทำให้ค่าใช้จ่ายเป็นศูนย์ doctor จะเตือนเพื่อให้คุณนำค่าที่เขียนทับออกและกู้คืนการกำหนดเส้นทาง API + ค่าใช้จ่ายตามแต่ละโมเดล
  </Accordion>
  <Accordion title="2c. การย้ายข้อมูลเบราว์เซอร์และความพร้อมของ Chrome MCP">
    หากคอนฟิกเบราว์เซอร์ของคุณยังชี้ไปที่พาธส่วนขยาย Chrome ที่ถูกลบออกแล้ว doctor จะปรับให้เป็นรูปแบบการแนบ Chrome MCP แบบโลคัลบนโฮสต์ปัจจุบัน:

    - `browser.profiles.*.driver: "extension"` กลายเป็น `"existing-session"`
    - `browser.relayBindHost` ถูกลบออก

    doctor ยังตรวจเส้นทาง Chrome MCP แบบโลคัลบนโฮสต์เมื่อคุณใช้ `defaultProfile: "user"` หรือโปรไฟล์ `existing-session` ที่กำหนดค่าไว้:

    - ตรวจว่า Google Chrome ติดตั้งอยู่บนโฮสต์เดียวกันสำหรับโปรไฟล์เชื่อมต่ออัตโนมัติค่าเริ่มต้นหรือไม่
    - ตรวจเวอร์ชัน Chrome ที่ตรวจพบและเตือนเมื่อต่ำกว่า Chrome 144
    - เตือนให้คุณเปิดใช้การดีบักระยะไกลในหน้า inspect ของเบราว์เซอร์ (เช่น `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` หรือ `edge://inspect/#remote-debugging`)

    doctor ไม่สามารถเปิดใช้การตั้งค่าฝั่ง Chrome แทนคุณได้ Chrome MCP แบบโลคัลบนโฮสต์ยังต้องมี:

    - เบราว์เซอร์ที่ใช้ Chromium 144+ บนโฮสต์ Gateway/Node
    - เบราว์เซอร์ที่กำลังทำงานแบบโลคัล
    - เปิดใช้การดีบักระยะไกลในเบราว์เซอร์นั้น
    - อนุมัติพรอมป์ยินยอมสำหรับการแนบครั้งแรกในเบราว์เซอร์

    ความพร้อมในที่นี้หมายถึงข้อกำหนดเบื้องต้นสำหรับการแนบแบบโลคัลเท่านั้น Existing-session คงข้อจำกัดเส้นทาง Chrome MCP ปัจจุบันไว้; เส้นทางขั้นสูงอย่าง `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และการทำงานแบบชุดยังต้องใช้เบราว์เซอร์ที่มีการจัดการหรือโปรไฟล์ CDP แบบดิบ

    การตรวจนี้ **ไม่** ใช้กับ Docker, sandbox, remote-browser หรือโฟลว์ headless อื่นๆ โฟลว์เหล่านั้นยังใช้ CDP แบบดิบต่อไป

  </Accordion>
  <Accordion title="2d. ข้อกำหนดเบื้องต้นของ OAuth TLS">
    เมื่อกำหนดค่าโปรไฟล์ OpenAI Codex OAuth แล้ว doctor จะตรวจปลายทางการอนุญาตของ OpenAI เพื่อยืนยันว่าสแตก TLS ของ Node/OpenSSL ในเครื่องสามารถตรวจสอบเชนใบรับรองได้ หากการตรวจล้มเหลวด้วยข้อผิดพลาดของใบรับรอง (เช่น `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ใบรับรองหมดอายุ หรือใบรับรองที่ลงนามด้วยตัวเอง) doctor จะแสดงคำแนะนำการแก้ไขเฉพาะแพลตฟอร์ม บน macOS ที่ใช้ Node จาก Homebrew วิธีแก้โดยทั่วไปคือ `brew postinstall ca-certificates` เมื่อใช้ `--deep` การตรวจจะทำงานแม้ Gateway จะปกติดี
  </Accordion>
  <Accordion title="2e. การเขียนทับผู้ให้บริการ Codex OAuth">
    หากก่อนหน้านี้คุณเพิ่มการตั้งค่าทรานสปอร์ต OpenAI แบบเดิมใต้ `models.providers.openai-codex` การตั้งค่าเหล่านั้นอาจบดบังเส้นทางผู้ให้บริการ Codex OAuth ในตัวที่รุ่นใหม่ใช้โดยอัตโนมัติ doctor จะเตือนเมื่อพบการตั้งค่าทรานสปอร์ตเก่าเหล่านั้นร่วมกับ Codex OAuth เพื่อให้คุณลบหรือเขียนค่าการเขียนทับทรานสปอร์ตที่ล้าสมัยใหม่ และกู้คืนพฤติกรรมการกำหนดเส้นทาง/การสำรองในตัว พร็อกซีแบบกำหนดเองและการเขียนทับเฉพาะส่วนหัวยังรองรับอยู่และไม่เรียกคำเตือนนี้
  </Accordion>
  <Accordion title="2f. การซ่อมแซมเส้นทาง Codex">
    doctor ตรวจหาการอ้างอิงโมเดลแบบเดิม `openai-codex/*` การกำหนดเส้นทาง harness ของ Codex แบบเนทีฟใช้การอ้างอิงโมเดลมาตรฐาน `openai/*`; รอบการทำงานของเอเจนต์ OpenAI จะผ่าน harness ของแอปเซิร์ฟเวอร์ Codex แทนเส้นทาง OpenClaw PI OpenAI

    ในโหมด `--fix` / `--repair` doctor จะเขียนการอ้างอิงของเอเจนต์ค่าเริ่มต้นและรายเอเจนต์ที่ได้รับผลกระทบใหม่ รวมถึงโมเดลหลัก ตัวสำรอง การเขียนทับ Heartbeat/subagent/Compaction, hooks, การเขียนทับโมเดลของช่องทาง และสถานะเส้นทางเซสชันถาวรที่ล้าสมัย:

    - `openai-codex/gpt-*` กลายเป็น `openai/gpt-*`
    - runtime ของเอเจนต์ที่ตรงกันจะกลายเป็น `agentRuntime.id: "codex"` เฉพาะเมื่อ Codex ติดตั้งแล้ว เปิดใช้แล้ว จัดหา harness `codex` และมี OAuth ที่ใช้งานได้
    - มิฉะนั้น runtime ของเอเจนต์ที่ตรงกันจะกลายเป็น `agentRuntime.id: "pi"`
    - รายการตัวสำรองของโมเดลที่มีอยู่จะคงไว้โดยเขียนรายการเดิมใหม่; การตั้งค่าต่อโมเดลที่คัดลอกไว้จะย้ายจากคีย์เดิมไปยังคีย์มาตรฐาน `openai/*`
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, ประกาศตัวสำรอง, การปักหมุดโปรไฟล์ auth และการปักหมุด harness Codex ในเซสชันที่บันทึกถาวรจะได้รับการซ่อมแซมในที่เก็บเซสชันเอเจนต์ทั้งหมดที่ค้นพบ
    - `/codex ...` หมายถึง "ควบคุมหรือผูกการสนทนา Codex แบบเนทีฟจากแชต"
    - `/acp ...` หรือ `runtime: "acp"` หมายถึง "ใช้ adapter ACP/acpx ภายนอก"

  </Accordion>
  <Accordion title="2g. การล้างเส้นทางเซสชัน">
    doctor ยังสแกนที่เก็บเซสชันเอเจนต์ที่ค้นพบเพื่อหาสถานะเส้นทางที่สร้างอัตโนมัติและล้าสมัย หลังจากคุณย้ายโมเดลหรือ runtime ที่กำหนดค่าไว้ออกจากเส้นทางที่ Plugin เป็นเจ้าของ เช่น Codex

    `openclaw doctor --fix` สามารถล้างสถานะล้าสมัยที่สร้างอัตโนมัติ เช่น การปักหมุดโมเดล `modelOverrideSource: "auto"`, metadata โมเดล runtime, ID harness ที่ปักหมุดไว้, การผูกเซสชัน CLI และการเขียนทับโปรไฟล์ auth อัตโนมัติ เมื่อเส้นทางเจ้าของของสถานะเหล่านั้นไม่ได้กำหนดค่าไว้อีกต่อไป ตัวเลือกโมเดลของผู้ใช้ที่ระบุชัดเจนหรือของเซสชันเดิมจะถูกรายงานเพื่อให้ตรวจสอบด้วยตนเองและจะไม่ถูกแตะต้อง; เปลี่ยนตัวเลือกเหล่านั้นด้วย `/model ...`, `/new` หรือรีเซ็ตเซสชันเมื่อไม่ต้องการใช้เส้นทางนั้นแล้ว

  </Accordion>
  <Accordion title="3. การย้ายสถานะเดิม (โครงร่างดิสก์)">
    doctor สามารถย้ายโครงร่างบนดิสก์รุ่นเก่าเข้าสู่โครงสร้างปัจจุบัน:

    - ที่เก็บเซสชัน + ทรานสคริปต์:
      - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
    - ไดเรกทอรีเอเจนต์:
      - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
    - สถานะการยืนยันตัวตนของ WhatsApp (Baileys):
      - จาก `~/.openclaw/credentials/*.json` เดิม (ยกเว้น `oauth.json`)
      - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID บัญชีค่าเริ่มต้น: `default`)

    การย้ายเหล่านี้เป็นแบบพยายามเท่าที่ทำได้และทำซ้ำได้โดยไม่เปลี่ยนผลลัพธ์; doctor จะส่งคำเตือนเมื่อปล่อยให้โฟลเดอร์เดิมใดๆ เหลือไว้เป็นข้อมูลสำรอง Gateway/CLI ยังย้ายที่เก็บเซสชัน + ไดเรกทอรีเอเจนต์เดิมโดยอัตโนมัติเมื่อเริ่มทำงาน เพื่อให้ประวัติ/การยืนยันตัวตน/โมเดลไปอยู่ในพาธรายเอเจนต์โดยไม่ต้องรัน doctor ด้วยตนเอง WhatsApp auth ตั้งใจให้ย้ายผ่าน `openclaw doctor` เท่านั้น การปรับรูปแบบ provider/provider-map ของ Talk ให้เป็นมาตรฐานตอนนี้เปรียบเทียบด้วยความเท่ากันเชิงโครงสร้าง ดังนั้นความแตกต่างที่ต่างแค่ลำดับคีย์จะไม่กระตุ้นการเปลี่ยนแปลง `doctor --fix` แบบไม่มีผลซ้ำอีก

  </Accordion>
  <Accordion title="3a. การย้าย manifest ของ Plugin เดิม">
    doctor สแกน manifest ของ Plugin ที่ติดตั้งทั้งหมดเพื่อหาคีย์ความสามารถระดับบนสุดที่เลิกใช้แล้ว (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) เมื่อพบ จะเสนอให้ย้ายคีย์เหล่านั้นเข้าไปในออบเจ็กต์ `contracts` และเขียนไฟล์ manifest ใหม่ในที่เดิม การย้ายนี้ทำซ้ำได้โดยไม่เปลี่ยนผลลัพธ์; หากคีย์ `contracts` มีค่าเดียวกันอยู่แล้ว คีย์เดิมจะถูกลบโดยไม่ทำข้อมูลซ้ำ
  </Accordion>
  <Accordion title="3b. การย้ายที่เก็บ Cron เดิม">
    doctor ยังตรวจที่เก็บงาน Cron (`~/.openclaw/cron/jobs.json` โดยค่าเริ่มต้น หรือ `cron.store` เมื่อมีการเขียนทับ) เพื่อหาโครงร่างงานเก่าที่ตัวจัดตารางเวลายังยอมรับเพื่อความเข้ากันได้

    การล้าง Cron ปัจจุบันรวมถึง:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - ฟิลด์ payload ระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
    - ฟิลด์ delivery ระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias การส่ง delivery ของ payload `provider` → `delivery.channel` แบบชัดเจน
    - งาน Webhook สำรองแบบเดิมอย่างง่าย `notify: true` → `delivery.mode="webhook"` แบบชัดเจนพร้อม `delivery.to=cron.webhook`

    Doctor จะย้ายข้อมูลอัตโนมัติเฉพาะงาน `notify: true` เมื่อสามารถทำได้โดยไม่เปลี่ยนพฤติกรรม หากงานรวม fallback การแจ้งเตือนแบบเดิมกับโหมดการส่งที่มีอยู่ซึ่งไม่ใช่ webhook, doctor จะเตือนและปล่อยงานนั้นไว้ให้ตรวจสอบด้วยตนเอง

    บน Linux, doctor ยังเตือนเมื่อ crontab ของผู้ใช้ยังเรียกใช้ `~/.openclaw/bin/ensure-whatsapp.sh` แบบเดิม สคริปต์เฉพาะโฮสต์นี้ไม่ได้รับการดูแลโดย OpenClaw ปัจจุบัน และอาจเขียนข้อความ `Gateway inactive` ที่เป็นเท็จลงใน `~/.openclaw/logs/whatsapp-health.log` เมื่อ cron เข้าถึง systemd user bus ไม่ได้ ให้ลบรายการ crontab ที่ค้างอยู่นี้ด้วย `crontab -e`; ใช้ `openclaw channels status --probe`, `openclaw doctor` และ `openclaw gateway status` สำหรับการตรวจสอบสถานะปัจจุบัน

  </Accordion>
  <Accordion title="3c. การล้าง session lock">
    Doctor จะสแกนไดเรกทอรีเซสชันของเอเจนต์ทุกตัวเพื่อหาไฟล์ write-lock ที่ค้างอยู่ — ไฟล์ที่เหลือไว้เมื่อเซสชันออกผิดปกติ สำหรับแต่ละไฟล์ lock ที่พบ จะรายงาน: พาธ, PID, ว่า PID ยังทำงานอยู่หรือไม่, อายุของ lock และถือว่าค้างอยู่หรือไม่ (PID ตายแล้วหรือเก่ากว่า 30 นาที) ในโหมด `--fix` / `--repair` จะลบไฟล์ lock ที่ค้างอยู่โดยอัตโนมัติ; มิฉะนั้นจะพิมพ์หมายเหตุและบอกให้คุณรันซ้ำด้วย `--fix`
  </Accordion>
  <Accordion title="3d. การซ่อมแซมกิ่ง transcript ของเซสชัน">
    Doctor จะสแกนไฟล์ JSONL ของเซสชันเอเจนต์เพื่อหารูปทรงกิ่งที่ซ้ำกันซึ่งเกิดจากบั๊กการเขียน prompt transcript ใหม่ใน 2026.4.24: เทิร์นผู้ใช้ที่ถูกละทิ้งซึ่งมีบริบทรันไทม์ภายในของ OpenClaw พร้อมกับพี่น้องที่ใช้งานอยู่ซึ่งมี prompt ผู้ใช้ที่มองเห็นเหมือนกัน ในโหมด `--fix` / `--repair`, doctor จะสำรองไฟล์ที่ได้รับผลกระทบแต่ละไฟล์ไว้ข้างต้นฉบับ แล้วเขียน transcript ใหม่ให้เป็นกิ่งที่ใช้งานอยู่ เพื่อให้ประวัติ Gateway และตัวอ่าน memory ไม่เห็นเทิร์นซ้ำอีกต่อไป
  </Accordion>
  <Accordion title="4. การตรวจสอบความสมบูรณ์ของสถานะ (การคงอยู่ของเซสชัน, routing และความปลอดภัย)">
    ไดเรกทอรีสถานะคือแกนกลางการทำงาน หากหายไป คุณจะสูญเสียเซสชัน, credentials, log และ config (เว้นแต่คุณมีข้อมูลสำรองอยู่ที่อื่น)

    Doctor ตรวจสอบ:

    - **ไดเรกทอรีสถานะหายไป**: เตือนเกี่ยวกับการสูญเสียสถานะอย่างร้ายแรง, แจ้งให้สร้างไดเรกทอรีใหม่ และเตือนว่าไม่สามารถกู้ข้อมูลที่หายไปได้
    - **สิทธิ์ไดเรกทอรีสถานะ**: ตรวจสอบว่าสามารถเขียนได้; เสนอให้ซ่อมแซมสิทธิ์ (และแสดงคำแนะนำ `chown` เมื่อตรวจพบว่า owner/group ไม่ตรงกัน)
    - **ไดเรกทอรีสถานะบน macOS ที่ซิงก์กับคลาวด์**: เตือนเมื่อสถานะ resolve อยู่ใต้ iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ `~/Library/CloudStorage/...` เพราะพาธที่มีการซิงก์อาจทำให้ I/O ช้าลงและเกิดการแข่งขันของ lock/sync ได้
    - **ไดเรกทอรีสถานะบน Linux SD หรือ eMMC**: เตือนเมื่อสถานะ resolve ไปยังแหล่ง mount แบบ `mmcblk*` เพราะ random I/O ที่อิง SD หรือ eMMC อาจช้ากว่าและสึกหรอเร็วกว่าเมื่อมีการเขียนเซสชันและ credentials
    - **ไดเรกทอรีเซสชันหายไป**: ต้องมี `sessions/` และไดเรกทอรี store ของเซสชันเพื่อคงประวัติไว้และหลีกเลี่ยงการ crash แบบ `ENOENT`
    - **Transcript ไม่ตรงกัน**: เตือนเมื่อรายการเซสชันล่าสุดมีไฟล์ transcript หายไป
    - **เซสชันหลัก "JSONL 1 บรรทัด"**: ระบุเมื่อ transcript หลักมีเพียงบรรทัดเดียว (ประวัติไม่ได้สะสม)
    - **ไดเรกทอรีสถานะหลายแห่ง**: เตือนเมื่อมีโฟลเดอร์ `~/.openclaw` หลายแห่งในหลาย home directory หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (ประวัติอาจแยกระหว่างการติดตั้ง)
    - **ตัวเตือนโหมดรีโมต**: หาก `gateway.mode=remote`, doctor จะเตือนให้คุณรันบนโฮสต์รีโมต (สถานะอยู่ที่นั่น)
    - **สิทธิ์ไฟล์ config**: เตือนหาก `~/.openclaw/openclaw.json` อ่านได้โดย group/world และเสนอให้ปรับให้เข้มงวดเป็น `600`

  </Accordion>
  <Accordion title="5. สถานะการ auth ของโมเดล (OAuth หมดอายุ)">
    Doctor จะตรวจสอบโปรไฟล์ OAuth ใน auth store, เตือนเมื่อ token ใกล้หมดอายุ/หมดอายุแล้ว และสามารถ refresh ได้เมื่อปลอดภัย หากโปรไฟล์ Anthropic OAuth/token เก่าเกินไป จะแนะนำ Anthropic API key หรือพาธ setup-token ของ Anthropic ข้อความแจ้งให้ refresh จะปรากฏเฉพาะเมื่อรันแบบโต้ตอบ (TTY); `--non-interactive` จะข้ามการพยายาม refresh

    เมื่อ OAuth refresh ล้มเหลวถาวร (เช่น `refresh_token_reused`, `invalid_grant` หรือ provider บอกให้คุณ sign in อีกครั้ง), doctor จะรายงานว่าต้อง re-auth และพิมพ์คำสั่ง `openclaw models auth login --provider ...` ที่แน่นอนให้รัน

    Doctor ยังรายงานโปรไฟล์ auth ที่ใช้งานไม่ได้ชั่วคราวเนื่องจาก:

    - cooldown สั้น ๆ (rate limit/timeout/auth failure)
    - การปิดใช้งานที่นานกว่า (billing/credit failure)

  </Accordion>
  <Accordion title="6. การตรวจสอบโมเดลของ hooks">
    หากตั้งค่า `hooks.gmail.model`, doctor จะตรวจสอบ model reference กับ catalog และ allowlist และเตือนเมื่อ resolve ไม่ได้หรือไม่ได้รับอนุญาต
  </Accordion>
  <Accordion title="7. การซ่อมแซม sandbox image">
    เมื่อเปิดใช้ sandboxing, doctor จะตรวจสอบ Docker images และเสนอให้ build หรือสลับไปใช้ชื่อ legacy หาก image ปัจจุบันหายไป
  </Accordion>
  <Accordion title="7b. การล้างการติดตั้ง Plugin">
    Doctor จะลบสถานะ staging ของ dependency ของ plugin ที่ OpenClaw สร้างแบบเดิมในโหมด `openclaw doctor --fix` / `openclaw doctor --repair` ซึ่งครอบคลุม stale generated dependency roots, ไดเรกทอรี install-stage เก่า, เศษไฟล์เฉพาะ package จากโค้ดซ่อมแซม dependency ของ bundled-plugin ก่อนหน้า และสำเนา npm ที่จัดการของ Plugin `@openclaw/*` แบบ bundled ที่ถูก orphaned หรือ recovered ซึ่งอาจ shadow manifest แบบ bundled ปัจจุบัน

    Doctor ยังสามารถติดตั้ง Plugin ที่ดาวน์โหลดได้ซึ่งหายไปใหม่เมื่อ config อ้างถึงแต่ local plugin registry หาไม่พบ ตัวอย่างรวมถึง `plugins.entries` ที่เป็นสาระสำคัญ, การตั้งค่า channel/provider/search ที่กำหนดไว้ และ agent runtimes ที่กำหนดไว้ ระหว่างการอัปเดต package, doctor จะหลีกเลี่ยงการรันการซ่อม Plugin ด้วย package-manager ขณะที่ core package กำลังถูกสลับ; รัน `openclaw doctor --fix` อีกครั้งหลังการอัปเดตหาก Plugin ที่กำหนดค่าไว้ยังต้องกู้คืน การเริ่ม Gateway และการโหลด config ใหม่จะไม่รัน package managers; การติดตั้ง Plugin ยังคงเป็นงาน doctor/install/update ที่ชัดเจน

  </Accordion>
  <Accordion title="8. การย้ายข้อมูลบริการ Gateway และคำแนะนำการล้างข้อมูล">
    Doctor ตรวจพบบริการ gateway แบบเดิม (launchd/systemd/schtasks) และเสนอให้ลบออกแล้วติดตั้งบริการ OpenClaw โดยใช้พอร์ต gateway ปัจจุบัน นอกจากนี้ยังสามารถสแกนหาบริการอื่นที่คล้าย gateway และพิมพ์คำแนะนำการล้างข้อมูลได้ บริการ OpenClaw gateway ที่ตั้งชื่อตามโปรไฟล์ถือเป็น first-class และจะไม่ถูกระบุว่าเป็น "extra"

    บน Linux, หากบริการ gateway ระดับผู้ใช้หายไปแต่มีบริการ OpenClaw gateway ระดับระบบอยู่, doctor จะไม่ติดตั้งบริการระดับผู้ใช้ตัวที่สองโดยอัตโนมัติ ตรวจสอบด้วย `openclaw gateway status --deep` หรือ `openclaw doctor --deep` จากนั้นลบรายการที่ซ้ำหรือกำหนด `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ system supervisor เป็นเจ้าของ lifecycle ของ gateway

  </Accordion>
  <Accordion title="8b. การย้ายข้อมูล Startup Matrix">
    เมื่อบัญชีช่องทาง Matrix มีการย้ายสถานะ legacy ที่ pending หรือ actionable, doctor (ในโหมด `--fix` / `--repair`) จะสร้าง snapshot ก่อนย้ายข้อมูล แล้วรันขั้นตอนการย้ายข้อมูลแบบ best-effort: การย้ายสถานะ Matrix แบบ legacy และการเตรียม encrypted-state แบบ legacy ทั้งสองขั้นตอนไม่เป็น fatal; ข้อผิดพลาดจะถูกบันทึกและ startup จะดำเนินต่อไป ในโหมด read-only (`openclaw doctor` โดยไม่มี `--fix`) การตรวจสอบนี้จะถูกข้ามทั้งหมด
  </Accordion>
  <Accordion title="8c. การจับคู่อุปกรณ์และ auth drift">
    ตอนนี้ Doctor ตรวจสอบสถานะการจับคู่อุปกรณ์เป็นส่วนหนึ่งของ health pass ปกติ

    สิ่งที่รายงาน:

    - คำขอจับคู่ครั้งแรกที่ pending
    - การอัปเกรด role ที่ pending สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การอัปเกรด scope ที่ pending สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การซ่อมแซม public-key mismatch เมื่อ device id ยังตรงกันแต่ device identity ไม่ตรงกับ record ที่อนุมัติอีกต่อไป
    - paired records ที่ไม่มี active token สำหรับ role ที่อนุมัติ
    - paired tokens ที่ scopes drift ออกนอก baseline การจับคู่ที่อนุมัติ
    - รายการ device-token ที่ cache ในเครื่องสำหรับเครื่องปัจจุบันซึ่งเก่ากว่าการหมุน token ฝั่ง gateway หรือมี metadata ของ scope ที่ค้างอยู่

    Doctor ไม่อนุมัติคำขอจับคู่อัตโนมัติหรือหมุน device tokens อัตโนมัติ แต่จะพิมพ์ขั้นตอนถัดไปที่แน่นอนแทน:

    - ตรวจสอบคำขอที่ pending ด้วย `openclaw devices list`
    - อนุมัติคำขอที่แน่นอนด้วย `openclaw devices approve <requestId>`
    - หมุน token ใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
    - ลบและอนุมัติ record ที่ค้างใหม่ด้วย `openclaw devices remove <deviceId>`

    สิ่งนี้ปิดช่องโหว่ทั่วไป "จับคู่แล้วแต่ยังได้ข้อความว่าต้องจับคู่": ตอนนี้ doctor แยกการจับคู่ครั้งแรกออกจากการอัปเกรด role/scope ที่ pending และจาก token/device-identity drift ที่ค้างอยู่

  </Accordion>
  <Accordion title="9. คำเตือนด้านความปลอดภัย">
    Doctor จะแสดงคำเตือนเมื่อ provider เปิดรับ DM โดยไม่มี allowlist หรือเมื่อตั้งค่า policy ในลักษณะที่เป็นอันตราย
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    หากรันเป็นบริการผู้ใช้ systemd, doctor จะตรวจให้แน่ใจว่าเปิด lingering เพื่อให้ gateway ยังทำงานหลัง logout
  </Accordion>
  <Accordion title="11. สถานะ workspace (skills, plugins และ legacy dirs)">
    Doctor พิมพ์สรุปสถานะ workspace สำหรับเอเจนต์เริ่มต้น:

    - **สถานะ Skills**: นับ skills ที่ eligible, missing-requirements และ allowlist-blocked
    - **ไดเรกทอรี workspace แบบเดิม**: เตือนเมื่อมี `~/openclaw` หรือไดเรกทอรี workspace แบบเดิมอื่น ๆ อยู่ควบคู่กับ workspace ปัจจุบัน
    - **สถานะ Plugin**: นับ plugins ที่ enabled/disabled/errored; แสดงรายการ plugin IDs สำหรับข้อผิดพลาดใด ๆ; รายงาน capabilities ของ bundle plugin
    - **คำเตือน compatibility ของ Plugin**: ระบุ plugins ที่มีปัญหา compatibility กับ runtime ปัจจุบัน
    - **Diagnostics ของ Plugin**: แสดงคำเตือนหรือข้อผิดพลาดขณะโหลดที่ plugin registry ปล่อยออกมา

  </Accordion>
  <Accordion title="11b. ขนาดไฟล์ bootstrap">
    Doctor ตรวจสอบว่าไฟล์ bootstrap ของ workspace (เช่น `AGENTS.md`, `CLAUDE.md` หรือไฟล์บริบทอื่นที่ injected) ใกล้หรือเกิน character budget ที่กำหนดไว้หรือไม่ โดยรายงานจำนวนอักขระ raw เทียบกับ injected ต่อไฟล์, เปอร์เซ็นต์การตัดทอน, สาเหตุการตัดทอน (`max/file` หรือ `max/total`) และจำนวนอักขระ injected ทั้งหมดเป็นสัดส่วนของ budget ทั้งหมด เมื่อไฟล์ถูกตัดทอนหรือใกล้ถึงขีดจำกัด, doctor จะพิมพ์คำแนะนำสำหรับการปรับ `agents.defaults.bootstrapMaxChars` และ `agents.defaults.bootstrapTotalMaxChars`
  </Accordion>
  <Accordion title="11d. การล้าง Plugin ของ channel ที่ค้างอยู่">
    เมื่อ `openclaw doctor --fix` ลบ Plugin ของ channel ที่หายไป จะลบ config ขอบเขต channel ที่ค้างซึ่งอ้างถึง Plugin นั้นด้วย: รายการ `channels.<id>`, heartbeat targets ที่ตั้งชื่อ channel และ overrides ของ `agents.*.models["<channel>/*"]` สิ่งนี้ป้องกันลูปการบูต Gateway ที่ channel runtime หายไปแล้วแต่ config ยังขอให้ gateway bind กับมัน
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor ตรวจสอบว่าติดตั้ง tab completion สำหรับ shell ปัจจุบันแล้วหรือไม่ (zsh, bash, fish หรือ PowerShell):

    - หาก shell profile ใช้รูปแบบ dynamic completion ที่ช้า (`source <(openclaw completion ...)`), doctor จะอัปเกรดเป็น variant ไฟล์ cache ที่เร็วกว่า
    - หากตั้งค่า completion ใน profile แล้วแต่ไฟล์ cache หายไป, doctor จะสร้าง cache ใหม่โดยอัตโนมัติ
    - หากไม่ได้ตั้งค่า completion เลย, doctor จะถามให้ติดตั้ง (เฉพาะโหมดโต้ตอบ; ข้ามด้วย `--non-interactive`)

    รัน `openclaw completion --write-state` เพื่อสร้าง cache ใหม่ด้วยตนเอง

  </Accordion>
  <Accordion title="12. การตรวจสอบ auth ของ Gateway (local token)">
    Doctor ตรวจสอบความพร้อมของ auth ด้วย local gateway token

    - หากโหมด token ต้องใช้ token และไม่มีแหล่ง token, doctor จะเสนอให้สร้างให้
    - หาก `gateway.auth.token` จัดการด้วย SecretRef แต่ใช้งานไม่ได้, doctor จะเตือนและไม่เขียนทับด้วย plaintext
    - `openclaw doctor --generate-gateway-token` บังคับสร้างเฉพาะเมื่อไม่ได้กำหนด token SecretRef

  </Accordion>
  <Accordion title="12b. การซ่อมแซมที่รับรู้ SecretRef แบบอ่านอย่างเดียว">
    โฟลว์การซ่อมแซมบางอย่างจำเป็นต้องตรวจสอบข้อมูลประจำตัวที่กำหนดค่าไว้โดยไม่ทำให้พฤติกรรม fail-fast ของรันไทม์อ่อนลง

    - ตอนนี้ `openclaw doctor --fix` ใช้โมเดลสรุป SecretRef แบบอ่านอย่างเดียวเดียวกันกับคำสั่งตระกูลสถานะสำหรับการซ่อมแซมคอนฟิกแบบเจาะจง
    - ตัวอย่าง: การซ่อมแซม Telegram `allowFrom` / `groupAllowFrom` `@username` จะพยายามใช้ข้อมูลประจำตัวของบอตที่กำหนดค่าไว้เมื่อมี
    - หากโทเค็นบอต Telegram ถูกกำหนดค่าผ่าน SecretRef แต่ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานว่าข้อมูลประจำตัวถูกกำหนดค่าไว้แต่ไม่พร้อมใช้งาน และข้ามการแก้ไขอัตโนมัติแทนที่จะขัดข้องหรือรายงานผิดว่าโทเค็นหายไป

  </Accordion>
  <Accordion title="13. การตรวจสุขภาพ Gateway + รีสตาร์ท">
    Doctor เรียกใช้การตรวจสุขภาพและเสนอให้รีสตาร์ท Gateway เมื่อดูเหมือนไม่สมบูรณ์
  </Accordion>
  <Accordion title="13b. ความพร้อมของการค้นหาหน่วยความจำ">
    Doctor ตรวจสอบว่า provider embedding สำหรับการค้นหาหน่วยความจำที่กำหนดค่าไว้พร้อมสำหรับเอเจนต์เริ่มต้นหรือไม่ พฤติกรรมขึ้นอยู่กับ backend และ provider ที่กำหนดค่าไว้:

    - **QMD backend**: ตรวจสอบว่าไบนารี `qmd` พร้อมใช้งานและเริ่มต้นได้หรือไม่ หากไม่ จะพิมพ์คำแนะนำการแก้ไขรวมถึงแพ็กเกจ npm และตัวเลือกพาธไบนารีแบบกำหนดเอง
    - **Provider ภายในแบบระบุชัดเจน**: ตรวจหาไฟล์โมเดลภายในหรือ URL โมเดลระยะไกล/ดาวน์โหลดได้ที่รู้จัก หากขาดหายไป จะแนะนำให้สลับไปใช้ provider ระยะไกล
    - **Provider ระยะไกลแบบระบุชัดเจน** (`openai`, `voyage` ฯลฯ): ตรวจสอบว่ามี API key อยู่ในสภาพแวดล้อมหรือที่เก็บ auth หรือไม่ พิมพ์คำแนะนำการแก้ไขที่ทำได้จริงหากขาดหายไป
    - **Provider อัตโนมัติ**: ตรวจสอบความพร้อมของโมเดลภายในก่อน จากนั้นลอง provider ระยะไกลแต่ละรายการตามลำดับการเลือกอัตโนมัติ

    เมื่อมีผลการ probe Gateway ที่แคชไว้ (Gateway สมบูรณ์ในเวลาที่ตรวจสอบ) doctor จะอ้างอิงผลนั้นเทียบกับคอนฟิกที่ CLI มองเห็นและระบุความคลาดเคลื่อนใดๆ Doctor จะไม่เริ่ม ping embedding ใหม่ในเส้นทางเริ่มต้น ใช้คำสั่งสถานะหน่วยความจำเชิงลึกเมื่อคุณต้องการตรวจสอบ provider แบบสด

    ใช้ `openclaw memory status --deep` เพื่อตรวจสอบความพร้อมของ embedding ณ รันไทม์

  </Accordion>
  <Accordion title="14. คำเตือนสถานะช่องทาง">
    หาก Gateway สมบูรณ์ doctor จะเรียกใช้ probe สถานะช่องทางและรายงานคำเตือนพร้อมวิธีแก้ไขที่แนะนำ
  </Accordion>
  <Accordion title="15. การตรวจสอบ + ซ่อมแซมคอนฟิก supervisor">
    Doctor ตรวจสอบคอนฟิก supervisor ที่ติดตั้งไว้ (launchd/systemd/schtasks) เพื่อหาค่าเริ่มต้นที่ขาดหายหรือล้าสมัย (เช่น การพึ่งพา network-online ของ systemd และดีเลย์การรีสตาร์ท) เมื่อพบความไม่ตรงกัน ระบบจะแนะนำการอัปเดตและสามารถเขียนไฟล์ service/task ใหม่เป็นค่าเริ่มต้นปัจจุบันได้

    หมายเหตุ:

    - `openclaw doctor` จะแจ้งถามก่อนเขียนคอนฟิก supervisor ใหม่
    - `openclaw doctor --yes` ยอมรับ prompt การซ่อมแซมค่าเริ่มต้น
    - `openclaw doctor --repair` ใช้การแก้ไขที่แนะนำโดยไม่แสดง prompt
    - `openclaw doctor --repair --force` เขียนทับคอนฟิก supervisor แบบกำหนดเอง
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` ทำให้ doctor เป็นแบบอ่านอย่างเดียวสำหรับวงจรชีวิตของ service Gateway โดยยังรายงานสุขภาพ service และเรียกใช้การซ่อมแซมที่ไม่ใช่ service แต่จะข้ามการติดตั้ง/เริ่ม/รีสตาร์ท/bootstrap service, การเขียนคอนฟิก supervisor ใหม่ และการล้าง service ดั้งเดิม เพราะ supervisor ภายนอกเป็นเจ้าของวงจรชีวิตนั้น
    - บน Linux doctor จะไม่เขียนเมทาดาทา command/entrypoint ใหม่ขณะที่ systemd gateway unit ที่ตรงกันยัง active อยู่ และยังละเว้น gateway-like unit เพิ่มเติมที่ inactive และไม่ใช่ legacy ระหว่างการสแกน service ซ้ำ เพื่อไม่ให้ไฟล์ service ประกอบสร้างเสียงรบกวนในการล้างข้อมูล
    - หาก token auth ต้องใช้โทเค็นและ `gateway.auth.token` ถูกจัดการโดย SecretRef การติดตั้ง/ซ่อมแซม service ของ doctor จะตรวจสอบ SecretRef แต่จะไม่บันทึกค่าโทเค็น plaintext ที่ resolve แล้วลงในเมทาดาทาสภาพแวดล้อมของ supervisor service
    - Doctor ตรวจพบค่าสภาพแวดล้อม service ที่จัดการโดย `.env`/SecretRef ซึ่งการติดตั้ง LaunchAgent, systemd หรือ Windows Scheduled Task รุ่นเก่าฝังไว้แบบ inline และเขียนเมทาดาทา service ใหม่เพื่อให้ค่าเหล่านั้นโหลดจากแหล่งรันไทม์แทนที่จะมาจากนิยาม supervisor
    - Doctor ตรวจพบเมื่อคำสั่ง service ยังตรึง `--port` เก่าไว้หลังจาก `gateway.port` เปลี่ยน และเขียนเมทาดาทา service ใหม่เป็นพอร์ตปัจจุบัน
    - หาก token auth ต้องใช้โทเค็นและ SecretRef ของโทเค็นที่กำหนดค่าไว้ยังไม่ถูก resolve doctor จะบล็อกเส้นทางติดตั้ง/ซ่อมแซมพร้อมคำแนะนำที่ทำได้จริง
    - หากทั้ง `gateway.auth.token` และ `gateway.auth.password` ถูกกำหนดค่าไว้ และไม่ได้ตั้งค่า `gateway.auth.mode` doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้งค่าโหมดอย่างชัดเจน
    - สำหรับ user-systemd unit บน Linux ตอนนี้การตรวจสอบ token drift ของ doctor รวมทั้งแหล่ง `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบเมทาดาทา auth ของ service
    - การซ่อมแซม service ของ Doctor จะปฏิเสธการเขียนใหม่ หยุด หรือรีสตาร์ท service Gateway จากไบนารี OpenClaw รุ่นเก่าเมื่อคอนฟิกถูกเขียนล่าสุดโดยเวอร์ชันใหม่กว่า ดู [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)
    - คุณสามารถบังคับให้เขียนใหม่ทั้งหมดได้เสมอผ่าน `openclaw gateway install --force`

  </Accordion>
  <Accordion title="16. การวินิจฉัยรันไทม์ Gateway + พอร์ต">
    Doctor ตรวจสอบรันไทม์ของ service (PID, สถานะออกครั้งล่าสุด) และเตือนเมื่อ service ถูกติดตั้งแล้วแต่ไม่ได้ทำงานจริง นอกจากนี้ยังตรวจสอบการชนกันของพอร์ตบนพอร์ต Gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (Gateway ทำงานอยู่แล้ว, SSH tunnel)
  </Accordion>
  <Accordion title="17. แนวทางปฏิบัติที่ดีสำหรับรันไทม์ Gateway">
    Doctor เตือนเมื่อ service Gateway ทำงานบน Bun หรือพาธ Node ที่จัดการด้วย version manager (`nvm`, `fnm`, `volta`, `asdf` ฯลฯ) ช่องทาง WhatsApp + Telegram ต้องใช้ Node และพาธ version-manager อาจเสียหลังอัปเกรดเพราะ service ไม่โหลด shell init ของคุณ Doctor เสนอให้ย้ายไปใช้การติดตั้ง Node ของระบบเมื่อมี (Homebrew/apt/choco)

    macOS LaunchAgents ที่ติดตั้งใหม่หรือซ่อมแซมแล้วใช้ PATH ระบบมาตรฐาน (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) แทนการคัดลอก PATH ของ shell แบบโต้ตอบ ดังนั้นไดเรกทอรีของ Volta, asdf, fnm, pnpm และ version-manager อื่นๆ จะไม่เปลี่ยนว่า child process ของ Node resolve ที่ใด service บน Linux ยังเก็บ root สภาพแวดล้อมแบบชัดเจน (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) และไดเรกทอรี user-bin ที่เสถียรไว้ แต่ไดเรกทอรี fallback ของ version-manager ที่คาดเดาจะถูกเขียนลงใน PATH ของ service เฉพาะเมื่อไดเรกทอรีเหล่านั้นมีอยู่บนดิสก์เท่านั้น

  </Accordion>
  <Accordion title="18. การเขียนคอนฟิก + เมทาดาทา wizard">
    Doctor บันทึกการเปลี่ยนแปลงคอนฟิกใดๆ และประทับเมทาดาทา wizard เพื่อบันทึกการรัน doctor
  </Accordion>
  <Accordion title="19. เคล็ดลับ workspace (การสำรองข้อมูล + ระบบหน่วยความจำ)">
    Doctor แนะนำระบบหน่วยความจำของ workspace เมื่อยังไม่มี และพิมพ์เคล็ดลับการสำรองข้อมูลหาก workspace ยังไม่ได้อยู่ภายใต้ git

    ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคู่มือฉบับเต็มเกี่ยวกับโครงสร้าง workspace และการสำรองข้อมูลด้วย git (แนะนำ GitHub หรือ GitLab แบบส่วนตัว)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [Runbook ของ Gateway](/th/gateway)
- [การแก้ปัญหา Gateway](/th/gateway/troubleshooting)
