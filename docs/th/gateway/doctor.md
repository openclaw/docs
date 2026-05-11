---
read_when:
    - การเพิ่มหรือแก้ไขการย้ายข้อมูลของ doctor
    - การแนะนำการเปลี่ยนแปลงการกำหนดค่าที่ไม่เข้ากันย้อนหลัง
sidebarTitle: Doctor
summary: 'คำสั่ง doctor: การตรวจสอบสถานภาพ, การย้ายข้อมูลการกำหนดค่า และขั้นตอนการซ่อมแซม'
title: ตรวจวินิจฉัย
x-i18n:
    generated_at: "2026-05-11T20:30:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4994177bb3a3751211437403becc1c68c7f07fa52a72b84c9d129c7922705522
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` คือเครื่องมือซ่อมแซม + ย้ายข้อมูลสำหรับ OpenClaw ใช้แก้ config/state ที่ล้าสมัย ตรวจสอบสถานะสุขภาพ และให้ขั้นตอนซ่อมแซมที่นำไปใช้ได้จริง

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

    ยอมรับค่าเริ่มต้นโดยไม่ถาม (รวมถึงขั้นตอนซ่อมแซม restart/service/sandbox เมื่อใช้ได้)

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    ใช้การซ่อมแซมที่แนะนำโดยไม่ถาม (การซ่อมแซม + การ restart ในกรณีที่ปลอดภัย)

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    ใช้การซ่อมแซมเชิงรุกด้วย (เขียนทับ config ของ supervisor ที่ปรับแต่งเอง)

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    รันโดยไม่มี prompt และใช้เฉพาะการย้ายข้อมูลที่ปลอดภัย (การทำให้ config เป็นมาตรฐาน + การย้าย state บนดิสก์) ข้ามการทำงานกับ restart/service/sandbox ที่ต้องมีการยืนยันจากมนุษย์ การย้ายข้อมูล state รุ่นเก่าจะรันอัตโนมัติเมื่อตรวจพบ

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    สแกนบริการระบบเพื่อหา gateway ที่ติดตั้งเพิ่มเติม (launchd/systemd/schtasks)

  </Tab>
</Tabs>

หากคุณต้องการตรวจทานการเปลี่ยนแปลงก่อนเขียน ให้เปิดไฟล์ config ก่อน:

```bash
cat ~/.openclaw/openclaw.json
```

## สิ่งที่ทำ (สรุป)

<AccordionGroup>
  <Accordion title="สุขภาพ, UI, และการอัปเดต">
    - การอัปเดตก่อนเริ่มแบบเลือกได้สำหรับการติดตั้งจาก git (เฉพาะโหมดโต้ตอบ)
    - การตรวจสอบความใหม่ของโปรโตคอล UI (สร้าง Control UI ใหม่เมื่อ schema ของโปรโตคอลใหม่กว่า)
    - การตรวจสุขภาพ + prompt ให้ restart
    - สรุปสถานะ Skills (eligible/missing/blocked) และสถานะ Plugin

  </Accordion>
  <Accordion title="Config และการย้ายข้อมูล">
    - การทำให้ config เป็นมาตรฐานสำหรับค่ารุ่นเก่า
    - การย้าย config ของ Talk จากฟิลด์แบนรุ่นเก่า `talk.*` ไปเป็น `talk.provider` + `talk.providers.<provider>`
    - การตรวจสอบการย้าย Browser สำหรับ config ของ Chrome extension รุ่นเก่าและความพร้อมของ Chrome MCP
    - คำเตือน override ของ OpenCode provider (`models.providers.opencode` / `models.providers.opencode-go`)
    - คำเตือนการ shadow ของ Codex OAuth (`models.providers.openai-codex`)
    - การตรวจสอบข้อกำหนดเบื้องต้นของ OAuth TLS สำหรับโปรไฟล์ OpenAI Codex OAuth
    - คำเตือน allowlist ของ Plugin/tool เมื่อ `plugins.allow` จำกัดอยู่ แต่ policy ของ tool ยังขอ wildcard หรือ tool ที่ Plugin เป็นเจ้าของ
    - การย้าย state รุ่นเก่าบนดิสก์ (sessions/agent dir/WhatsApp auth)
    - การย้าย key ของสัญญา manifest ของ Plugin รุ่นเก่า (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
    - การย้าย store ของ Cron รุ่นเก่า (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบนสุด, payload `provider`, งาน webhook fallback แบบง่าย `notify: true`)
    - การล้าง runtime-policy ทั้ง agent รุ่นเก่า; runtime policy ของ provider/model คือ route selector ที่ใช้งานอยู่
    - การล้าง config ของ Plugin ที่ค้างอยู่เมื่อเปิดใช้งาน Plugin; เมื่อ `plugins.enabled=false` การอ้างอิง Plugin ที่ค้างอยู่จะถูกถือเป็น config สำหรับ containment ที่ไม่มีผล และจะถูกเก็บไว้

  </Accordion>
  <Accordion title="State และความถูกต้องสมบูรณ์">
    - การตรวจสอบไฟล์ lock ของ session และการล้าง lock ที่ค้างอยู่
    - การซ่อม transcript ของ session สำหรับ branch prompt-rewrite ที่ซ้ำกันซึ่งสร้างโดย build 2026.4.24 ที่ได้รับผลกระทบ
    - การตรวจจับ tombstone สำหรับ restart-recovery ของ subagent ที่ค้าง พร้อมรองรับ `--fix` เพื่อล้าง flag recovery ที่ถูกยกเลิกและค้างอยู่ เพื่อไม่ให้ startup ยังถือว่า child ถูก restart-aborted
    - การตรวจสอบความถูกต้องสมบูรณ์และ permission ของ state (sessions, transcripts, state dir)
    - การตรวจสอบ permission ของไฟล์ config (chmod 600) เมื่อรันในเครื่อง
    - สุขภาพของ model auth: ตรวจ OAuth expiry, สามารถ refresh token ที่ใกล้หมดอายุ และรายงานสถานะ cooldown/disabled ของ auth-profile
    - การตรวจจับ workspace dir เพิ่มเติม (`~/openclaw`)

  </Accordion>
  <Accordion title="Gateway, บริการ, และ supervisor">
    - การซ่อม image ของ sandbox เมื่อเปิดใช้ sandboxing
    - การย้ายบริการรุ่นเก่าและการตรวจจับ gateway เพิ่มเติม
    - การย้าย state รุ่นเก่าของช่องทาง Matrix (ในโหมด `--fix` / `--repair`)
    - การตรวจสอบ runtime ของ Gateway (ติดตั้ง service แล้วแต่ไม่ทำงาน; label ของ launchd ที่ cache ไว้)
    - คำเตือนสถานะช่องทาง (probe จาก gateway ที่กำลังรันอยู่)
    - การตรวจสอบ permission เฉพาะช่องทางอยู่ใต้ `openclaw channels capabilities`; เช่น permission ของช่องเสียง Discord จะถูก audit ด้วย `openclaw channels capabilities --channel discord --target channel:<channel-id>`
    - การตรวจสอบการตอบสนองของ WhatsApp สำหรับสุขภาพ event-loop ของ Gateway ที่เสื่อมลงขณะที่ local TUI client ยังรันอยู่; `--fix` จะหยุดเฉพาะ local TUI client ที่ยืนยันแล้วเท่านั้น
    - การซ่อม route ของ Codex สำหรับ model ref รุ่นเก่า `openai-codex/*` ใน primary models, fallbacks, heartbeat/subagent/compaction overrides, hooks, channel model overrides, และ session route pins; `--fix` จะเขียนใหม่เป็น `openai/*`, ลบ runtime pin ของ session/whole-agent ที่ค้างอยู่ และปล่อยให้ ref ของ canonical OpenAI agent อยู่บน Codex harness เริ่มต้น
    - การ audit config ของ supervisor (launchd/systemd/schtasks) พร้อมการซ่อมแซมแบบเลือกได้
    - การล้าง environment ของ proxy ที่ฝังไว้สำหรับบริการ gateway ที่จับค่า shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` ระหว่างติดตั้งหรืออัปเดต
    - การตรวจสอบแนวปฏิบัติที่ดีที่สุดของ runtime ของ Gateway (Node เทียบกับ Bun, path ของ version-manager)
    - การวินิจฉัย port collision ของ Gateway (ค่าเริ่มต้น `18789`)

  </Accordion>
  <Accordion title="Auth, ความปลอดภัย, และการจับคู่">
    - คำเตือนด้านความปลอดภัยสำหรับ policy ของ DM แบบเปิด
    - การตรวจสอบ auth ของ Gateway สำหรับโหมด local token (เสนอการสร้าง token เมื่อไม่มีแหล่ง token; ไม่เขียนทับ config แบบ token SecretRef)
    - การตรวจจับปัญหาการจับคู่อุปกรณ์ (คำขอจับคู่ครั้งแรกที่ค้างอยู่, การอัปเกรด role/scope ที่ค้างอยู่, drift ของ cache device-token ในเครื่องที่ล้าสมัย, และ drift ของ auth ใน paired-record)

  </Accordion>
  <Accordion title="Workspace และ shell">
    - การตรวจ systemd linger บน Linux
    - การตรวจขนาดไฟล์ bootstrap ของ workspace (คำเตือนการถูกตัดทอน/ใกล้ถึงขีดจำกัดสำหรับไฟล์ context)
    - การตรวจความพร้อมของ Skills สำหรับ agent เริ่มต้น; รายงาน skills ที่อนุญาตแต่ขาด bins, env, config, หรือข้อกำหนด OS และ `--fix` สามารถปิด skills ที่ไม่พร้อมใช้งานใน `skills.entries`
    - การตรวจสถานะ shell completion และติดตั้ง/อัปเกรดอัตโนมัติ
    - การตรวจความพร้อมของ memory search embedding provider (model ในเครื่อง, remote API key, หรือ binary QMD)
    - การตรวจการติดตั้งจาก source (pnpm workspace ไม่ตรงกัน, asset ของ UI หายไป, binary tsx หายไป)
    - เขียน config ที่อัปเดต + metadata ของ wizard

  </Accordion>
</AccordionGroup>

## Dreams UI backfill และ reset

ฉาก Dreams ใน Control UI มี action **Backfill**, **Reset**, และ **Clear Grounded** สำหรับ workflow ของ grounded dreaming action เหล่านี้ใช้เมธอด RPC แบบ doctor-style ของ gateway แต่ไม่ได้เป็นส่วนหนึ่งของการซ่อมแซม/ย้ายข้อมูลใน `openclaw doctor` CLI

สิ่งที่ทำ:

- **Backfill** สแกนไฟล์ย้อนหลัง `memory/YYYY-MM-DD.md` ใน workspace ที่ใช้งานอยู่ รัน grounded REM diary pass และเขียน entry backfill ที่ย้อนกลับได้ลงใน `DREAMS.md`
- **Reset** ลบเฉพาะ entry diary backfill ที่ทำเครื่องหมายไว้เหล่านั้นออกจาก `DREAMS.md`
- **Clear Grounded** ลบเฉพาะ entry ระยะสั้นแบบ grounded-only ที่ stage ไว้ ซึ่งมาจากการ replay ประวัติและยังไม่ได้สะสม live recall หรือ daily support

สิ่งที่ไม่ได้ทำด้วยตัวเอง:

- ไม่แก้ไข `MEMORY.md`
- ไม่รันการย้ายข้อมูล doctor แบบเต็ม
- ไม่ stage grounded candidates เข้าสู่ live short-term promotion store โดยอัตโนมัติ เว้นแต่คุณจะรัน path CLI แบบ staged ก่อนอย่างชัดเจน

หากคุณต้องการให้ grounded historical replay มีผลต่อ deep promotion lane ปกติ ให้ใช้ flow ของ CLI แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

สิ่งนี้จะ stage grounded durable candidates เข้าสู่ short-term dreaming store โดยยังคงใช้ `DREAMS.md` เป็นพื้นที่สำหรับตรวจทาน

## พฤติกรรมโดยละเอียดและเหตุผล

<AccordionGroup>
  <Accordion title="0. การอัปเดตแบบเลือกได้ (การติดตั้งจาก git)">
    หากนี่เป็น git checkout และ doctor กำลังรันแบบโต้ตอบ ระบบจะเสนอให้อัปเดต (fetch/rebase/build) ก่อนรัน doctor
  </Accordion>
  <Accordion title="1. การทำให้ config เป็นมาตรฐาน">
    หาก config มีรูปแบบค่ารุ่นเก่า (เช่น `messages.ackReaction` ที่ไม่มี override เฉพาะช่องทาง) doctor จะทำให้ค่าเหล่านั้นเป็นมาตรฐานตาม schema ปัจจุบัน

    ซึ่งรวมถึงฟิลด์แบนรุ่นเก่าของ Talk config สาธารณะของ Talk speech ปัจจุบันคือ `talk.provider` + `talk.providers.<provider>` และ config ของ realtime voice คือ `talk.realtime.*` Doctor จะเขียนรูปแบบเก่า `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ใหม่ลงในแผนที่ provider และเขียน selector realtime ระดับบนสุดรุ่นเก่า (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) ใหม่เป็น `talk.realtime`

    Doctor ยังเตือนเมื่อ `plugins.allow` ไม่ว่างและ policy ของ tool ใช้
    wildcard หรือ entry ของ tool ที่ Plugin เป็นเจ้าของ `tools.allow: ["*"]` จะจับคู่เฉพาะ tool
    จาก Plugin ที่โหลดจริงเท่านั้น; ไม่ได้ข้าม exclusive plugin
    allowlist Doctor จะเขียน `plugins.bundledDiscovery: "compat"` สำหรับ config
    allowlist รุ่นเก่าที่ถูกย้าย เพื่อรักษาพฤติกรรม provider แบบ bundled ที่มีอยู่ และ
    จากนั้นชี้ไปยังการตั้งค่า `"allowlist"` ที่เข้มงวดกว่า

  </Accordion>
  <Accordion title="2. การย้าย key ของ config รุ่นเก่า">
    เมื่อ config มี key ที่เลิกใช้แล้ว คำสั่งอื่นจะปฏิเสธการรันและขอให้คุณรัน `openclaw doctor`

    Doctor จะ:

    - อธิบายว่าพบ key รุ่นเก่าใดบ้าง
    - แสดงการย้ายข้อมูลที่ใช้ไป
    - เขียน `~/.openclaw/openclaw.json` ใหม่ด้วย schema ที่อัปเดต

    การเริ่มต้น Gateway จะปฏิเสธรูปแบบ config รุ่นเก่าและขอให้คุณรัน `openclaw doctor --fix`; จะไม่เขียน `openclaw.json` ใหม่ตอน startup การย้าย job store ของ Cron ก็จัดการโดย `openclaw doctor --fix` เช่นกัน

    การย้ายข้อมูลปัจจุบัน:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - การกำหนดค่าช่องทางที่กำหนดไว้ซึ่งไม่มีนโยบายการตอบกลับแบบมองเห็นได้ → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` ระดับบนสุด
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` เดิม → `talk.provider` + `talk.providers.<provider>`
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
    - สำหรับช่องทางที่มี `accounts` แบบตั้งชื่อ แต่ยังมีค่าช่องทางระดับบนสุดแบบบัญชีเดียวค้างอยู่ ให้ย้ายค่าที่อยู่ในขอบเขตบัญชีเหล่านั้นไปยังบัญชีที่ถูกยกระดับซึ่งเลือกไว้สำหรับช่องทางนั้น (`accounts.default` สำหรับช่องทางส่วนใหญ่; Matrix สามารถรักษาเป้าหมายแบบตั้งชื่อ/ค่าเริ่มต้นที่ตรงกันซึ่งมีอยู่แล้วไว้ได้)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - ลบ `agents.defaults.llm`; ใช้ `models.providers.<id>.timeoutSeconds` สำหรับระยะหมดเวลาของผู้ให้บริการ/โมเดลที่ช้า
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - ลบ `browser.relayBindHost` (การตั้งค่า relay ของส่วนขยายเดิม)
    - `models.providers.*.api: "openai"` เดิม → `"openai-completions"` (การเริ่มต้น Gateway ยังข้ามผู้ให้บริการที่ตั้งค่า `api` เป็นค่า enum ในอนาคตหรือไม่รู้จัก แทนที่จะล้มเหลวแบบปิดกั้น)
    - ลบ `plugins.entries.codex.config.codexDynamicToolsProfile`; เซิร์ฟเวอร์แอป Codex จะคงเครื่องมือพื้นที่ทำงานเนทีฟของ Codex ให้เป็นเนทีฟเสมอ

    คำเตือนของ doctor ยังรวมคำแนะนำบัญชีเริ่มต้นสำหรับช่องทางหลายบัญชีด้วย:

    - หากมีการกำหนดค่ารายการ `channels.<channel>.accounts` ตั้งแต่สองรายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default` doctor จะเตือนว่าการกำหนดเส้นทางสำรองอาจเลือกบัญชีที่ไม่คาดคิด
    - หากตั้งค่า `channels.<channel>.defaultAccount` เป็น ID บัญชีที่ไม่รู้จัก doctor จะเตือนและแสดงรายการ ID บัญชีที่กำหนดค่าไว้

  </Accordion>
  <Accordion title="2b. การแทนที่ค่าผู้ให้บริการ OpenCode">
    หากคุณเพิ่ม `models.providers.opencode`, `opencode-zen` หรือ `opencode-go` ด้วยตนเอง ค่านั้นจะแทนที่แค็ตตาล็อก OpenCode ในตัวจาก `@earendil-works/pi-ai` ซึ่งอาจบังคับให้โมเดลใช้ API ที่ผิดหรือทำให้ค่าใช้จ่ายเป็นศูนย์ doctor จะเตือนเพื่อให้คุณลบการแทนที่ค่านั้นและกู้คืนการกำหนดเส้นทาง API + ค่าใช้จ่ายรายโมเดล
  </Accordion>
  <Accordion title="2c. การย้ายข้อมูลเบราว์เซอร์และความพร้อมของ Chrome MCP">
    หากการกำหนดค่าเบราว์เซอร์ของคุณยังชี้ไปยังเส้นทางส่วนขยาย Chrome ที่ถูกลบแล้ว doctor จะปรับให้เป็นรูปแบบการแนบ Chrome MCP ภายในโฮสต์ปัจจุบัน:

    - `browser.profiles.*.driver: "extension"` จะเป็น `"existing-session"`
    - `browser.relayBindHost` จะถูกลบ

    doctor ยังตรวจสอบเส้นทาง Chrome MCP ภายในโฮสต์เมื่อคุณใช้ `defaultProfile: "user"` หรือโปรไฟล์ `existing-session` ที่กำหนดค่าไว้:

    - ตรวจสอบว่ามีการติดตั้ง Google Chrome บนโฮสต์เดียวกันสำหรับโปรไฟล์เชื่อมต่ออัตโนมัติเริ่มต้นหรือไม่
    - ตรวจสอบเวอร์ชัน Chrome ที่ตรวจพบและเตือนเมื่อเวอร์ชันต่ำกว่า Chrome 144
    - เตือนให้คุณเปิดใช้งานการดีบักระยะไกลในหน้าตรวจสอบของเบราว์เซอร์ (เช่น `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` หรือ `edge://inspect/#remote-debugging`)

    doctor ไม่สามารถเปิดใช้งานการตั้งค่าฝั่ง Chrome ให้คุณได้ Chrome MCP ภายในโฮสต์ยังต้องมี:

    - เบราว์เซอร์ที่ใช้ Chromium 144+ บนโฮสต์ Gateway/Node
    - เบราว์เซอร์รันอยู่ภายในเครื่อง
    - เปิดใช้งานการดีบักระยะไกลในเบราว์เซอร์นั้น
    - อนุมัติพรอมป์ยินยอมสำหรับการแนบครั้งแรกในเบราว์เซอร์

    ความพร้อมในที่นี้เกี่ยวข้องเฉพาะข้อกำหนดเบื้องต้นของการแนบในเครื่องเท่านั้น Existing-session ยังคงใช้ข้อจำกัดเส้นทาง Chrome MCP ปัจจุบัน; เส้นทางขั้นสูงอย่าง `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และการกระทำแบบชุดยังต้องใช้เบราว์เซอร์ที่จัดการแล้วหรือโปรไฟล์ CDP โดยตรง

    การตรวจสอบนี้ **ไม่** ใช้กับ Docker, แซนด์บ็อกซ์, remote-browser หรือโฟลว์ headless อื่นๆ โฟลว์เหล่านั้นยังคงใช้ CDP โดยตรง

  </Accordion>
  <Accordion title="2d. ข้อกำหนดเบื้องต้นของ OAuth TLS">
    เมื่อมีการกำหนดค่าโปรไฟล์ OpenAI Codex OAuth doctor จะตรวจสอบ endpoint การอนุญาตของ OpenAI เพื่อยืนยันว่าสแต็ก TLS ของ Node/OpenSSL ภายในเครื่องสามารถตรวจสอบ chain ของใบรับรองได้ หากการตรวจสอบล้มเหลวด้วยข้อผิดพลาดของใบรับรอง (เช่น `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ใบรับรองหมดอายุ หรือใบรับรองที่ลงนามเอง) doctor จะแสดงคำแนะนำการแก้ไขเฉพาะแพลตฟอร์ม บน macOS ที่ใช้ Homebrew Node วิธีแก้มักเป็น `brew postinstall ca-certificates` เมื่อใช้ `--deep` การตรวจสอบจะทำงานแม้ว่า Gateway จะปกติดี
  </Accordion>
  <Accordion title="2e. การแทนที่ค่าผู้ให้บริการ Codex OAuth">
    หากก่อนหน้านี้คุณเพิ่มการตั้งค่าการส่งผ่าน OpenAI เดิมไว้ใต้ `models.providers.openai-codex` ค่านั้นอาจบดบังเส้นทางผู้ให้บริการ Codex OAuth ในตัวที่รุ่นใหม่กว่าใช้โดยอัตโนมัติ doctor จะเตือนเมื่อพบการตั้งค่าการส่งผ่านเก่าเหล่านั้นควบคู่กับ Codex OAuth เพื่อให้คุณลบหรือเขียนการแทนที่ค่าการส่งผ่านที่ล้าสมัยใหม่ และเรียกคืนพฤติกรรมการกำหนดเส้นทาง/สำรองในตัว พร็อกซีที่กำหนดเองและการแทนที่เฉพาะส่วนหัวยังคงรองรับอยู่และจะไม่ทำให้เกิดคำเตือนนี้
  </Accordion>
  <Accordion title="2f. การซ่อมแซมเส้นทาง Codex">
    doctor ตรวจสอบการอ้างอิงโมเดล `openai-codex/*` เดิม การกำหนดเส้นทาง harness ของ Codex แบบเนทีฟใช้การอ้างอิงโมเดล `openai/*` มาตรฐาน; เทิร์นของเอเจนต์ OpenAI จะผ่าน harness เซิร์ฟเวอร์แอป Codex แทนเส้นทาง OpenClaw PI OpenAI

    ในโหมด `--fix` / `--repair` doctor จะเขียนการอ้างอิงของเอเจนต์เริ่มต้นและรายเอเจนต์ที่ได้รับผลกระทบใหม่ รวมถึงโมเดลหลัก รายการสำรอง การแทนที่ค่า Heartbeat/เอเจนต์ย่อย/Compaction ฮุก การแทนที่ค่าโมเดลของช่องทาง และสถานะเส้นทางเซสชันที่คงอยู่ซึ่งล้าสมัย:

    - `openai-codex/gpt-*` จะเป็น `openai/gpt-*`
    - เจตนาการใช้ Codex จะย้ายไปยังรายการ `agentRuntime.id: "codex"` ที่อยู่ในขอบเขตผู้ให้บริการ/โมเดลสำหรับการอ้างอิงโมเดลเอเจนต์ที่ซ่อมแล้ว เพื่อให้ยังสามารถเลือกโปรไฟล์การยืนยันตัวตน `openai-codex:...` ได้หลังจากการอ้างอิงโมเดลกลายเป็น `openai/*`
    - การกำหนดค่ารันไทม์ทั้งเอเจนต์ที่ล้าสมัยและการปักหมุดรันไทม์ของเซสชันที่คงอยู่จะถูกลบ เพราะการเลือกรันไทม์อยู่ในขอบเขตผู้ให้บริการ/โมเดล
    - นโยบายรันไทม์ผู้ให้บริการ/โมเดลที่มีอยู่จะถูกเก็บไว้ เว้นแต่การอ้างอิงโมเดลเดิมที่ซ่อมแล้วต้องใช้การกำหนดเส้นทาง Codex เพื่อรักษาเส้นทางการยืนยันตัวตนเดิมไว้
    - รายการสำรองของโมเดลที่มีอยู่จะถูกเก็บไว้โดยเขียนรายการเดิมใหม่; การตั้งค่ารายโมเดลที่คัดลอกไว้จะย้ายจากคีย์เดิมไปยังคีย์ `openai/*` มาตรฐาน
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, ประกาศสำรอง และการปักหมุดโปรไฟล์การยืนยันตัวตนของเซสชันที่คงอยู่จะถูกซ่อมในที่เก็บเซสชันเอเจนต์ที่ค้นพบทั้งหมด
    - `/codex ...` หมายถึง "ควบคุมหรือผูกการสนทนา Codex แบบเนทีฟจากแชต"
    - `/acp ...` หรือ `runtime: "acp"` หมายถึง "ใช้อะแดปเตอร์ ACP/acpx ภายนอก"

  </Accordion>
  <Accordion title="2g. การล้างเส้นทางเซสชัน">
    doctor ยังสแกนที่เก็บเซสชันเอเจนต์ที่ค้นพบเพื่อหาสถานะเส้นทางที่สร้างอัตโนมัติและล้าสมัย หลังจากคุณย้ายโมเดลหรือรันไทม์ที่กำหนดค่าไว้ออกจากเส้นทางที่ Plugin เป็นเจ้าของ เช่น Codex

    `openclaw doctor --fix` สามารถล้างสถานะล้าสมัยที่สร้างอัตโนมัติได้ เช่น การปักหมุดโมเดล `modelOverrideSource: "auto"`, ข้อมูลเมตาโมเดลรันไทม์, ID harness ที่ปักหมุด, การผูกเซสชัน CLI และการแทนที่โปรไฟล์การยืนยันตัวตนอัตโนมัติ เมื่อเส้นทางเจ้าของไม่ได้ถูกกำหนดค่าอีกต่อไป ตัวเลือกโมเดลของผู้ใช้ที่ระบุชัดเจนหรือของเซสชันเดิมจะถูกรายงานให้ตรวจทานด้วยตนเองและคงไว้ไม่แตะต้อง; เปลี่ยนตัวเลือกเหล่านั้นด้วย `/model ...`, `/new` หรือรีเซ็ตเซสชันเมื่อไม่ต้องการเส้นทางนั้นอีกต่อไป

  </Accordion>
  <Accordion title="3. การย้ายข้อมูลสถานะเดิม (เค้าโครงดิสก์)">
    doctor สามารถย้ายเค้าโครงบนดิสก์รุ่นเก่าเข้าสู่โครงสร้างปัจจุบันได้:

    - ที่เก็บเซสชัน + บันทึกบทสนทนา:
      - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
    - ไดเรกทอรีเอเจนต์:
      - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
    - สถานะการยืนยันตัวตน WhatsApp (Baileys):
      - จาก `~/.openclaw/credentials/*.json` เดิม (ยกเว้น `oauth.json`)
      - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID บัญชีเริ่มต้น: `default`)

    การย้ายข้อมูลเหล่านี้เป็นแบบพยายามให้ดีที่สุดและทำซ้ำแล้วได้ผลเดิม; doctor จะแสดงคำเตือนเมื่อปล่อยโฟลเดอร์เดิมใดๆ ไว้เป็นข้อมูลสำรอง Gateway/CLI ยังย้ายข้อมูลเซสชันเดิม + ไดเรกทอรีเอเจนต์โดยอัตโนมัติเมื่อเริ่มต้น เพื่อให้ประวัติ/การยืนยันตัวตน/โมเดลไปอยู่ในเส้นทางรายเอเจนต์โดยไม่ต้องรัน doctor ด้วยตนเอง การยืนยันตัวตน WhatsApp ตั้งใจให้ย้ายผ่าน `openclaw doctor` เท่านั้น ตอนนี้การปรับมาตรฐานผู้ให้บริการ/แผนที่ผู้ให้บริการของ Talk เปรียบเทียบด้วยความเท่ากันเชิงโครงสร้าง ดังนั้นความแตกต่างที่เกิดจากลำดับคีย์เท่านั้นจะไม่ทำให้เกิดการเปลี่ยนแปลง `doctor --fix` แบบไม่มีผลซ้ำอีก

  </Accordion>
  <Accordion title="3a. การย้ายข้อมูลแมนิเฟสต์ Plugin เดิม">
    doctor สแกนแมนิเฟสต์ Plugin ที่ติดตั้งไว้ทั้งหมดเพื่อหาคีย์ความสามารถระดับบนสุดที่เลิกใช้แล้ว (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) เมื่อพบแล้ว จะเสนอให้ย้ายคีย์เหล่านั้นเข้าไปในออบเจ็กต์ `contracts` และเขียนไฟล์แมนิเฟสต์ทับที่เดิม การย้ายข้อมูลนี้ทำซ้ำแล้วได้ผลเดิม; หากคีย์ `contracts` มีค่าเดียวกันอยู่แล้ว คีย์เดิมจะถูกลบโดยไม่ทำให้ข้อมูลซ้ำ
  </Accordion>
  <Accordion title="3b. การย้ายข้อมูลที่เก็บ Cron เดิม">
    doctor ยังตรวจสอบที่เก็บงาน Cron (`~/.openclaw/cron/jobs.json` โดยค่าเริ่มต้น หรือ `cron.store` เมื่อถูกแทนที่) เพื่อหารูปแบบงานเก่าที่ตัวจัดกำหนดการยังยอมรับเพื่อความเข้ากันได้ย้อนหลัง

    การล้างข้อมูล Cron ปัจจุบันรวมถึง:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - ฟิลด์ payload ระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
    - ฟิลด์ delivery ระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - นามแฝงการส่งมอบ `provider` ของ payload → `delivery.channel` แบบชัดเจน
    - งาน fallback webhook แบบเดิมอย่างง่าย `notify: true` → `delivery.mode="webhook"` แบบชัดเจน พร้อม `delivery.to=cron.webhook`

    Doctor จะย้ายงาน `notify: true` อัตโนมัติเฉพาะเมื่อทำได้โดยไม่เปลี่ยนพฤติกรรมเท่านั้น หากงานรวม fallback การแจ้งเตือนแบบเดิมกับโหมดการส่งมอบที่มีอยู่ซึ่งไม่ใช่ webhook doctor จะเตือนและปล่อยงานนั้นไว้ให้ตรวจสอบด้วยตนเอง

    บน Linux doctor ยังเตือนเมื่อ crontab ของผู้ใช้ยังเรียกใช้ `~/.openclaw/bin/ensure-whatsapp.sh` แบบเดิม สคริปต์ภายในโฮสต์นั้นไม่ได้รับการดูแลโดย OpenClaw ปัจจุบัน และอาจเขียนข้อความ `Gateway inactive` ที่เป็นเท็จไปยัง `~/.openclaw/logs/whatsapp-health.log` เมื่อ cron ไม่สามารถเข้าถึง systemd user bus ได้ ลบรายการ crontab ที่ค้างอยู่ด้วย `crontab -e`; ใช้ `openclaw channels status --probe`, `openclaw doctor` และ `openclaw gateway status` สำหรับการตรวจสุขภาพปัจจุบัน

  </Accordion>
  <Accordion title="3c. การล้างล็อกเซสชัน">
    Doctor สแกนไดเรกทอรีเซสชันของเอเจนต์ทุกตัวเพื่อหาไฟล์ write-lock ที่ค้างอยู่ — ไฟล์ที่หลงเหลือเมื่อเซสชันออกอย่างผิดปกติ สำหรับไฟล์ล็อกแต่ละไฟล์ที่พบ จะรายงาน: path, PID, PID ยังมีชีวิตอยู่หรือไม่, อายุของล็อก และถือว่าไฟล์นั้นค้างหรือไม่ (PID ตายแล้ว, เก่ากว่า 30 นาที, หรือ PID ที่ยังมีชีวิตซึ่งพิสูจน์ได้ว่าเป็นของกระบวนการที่ไม่ใช่ OpenClaw) ในโหมด `--fix` / `--repair` จะลบไฟล์ล็อกที่ค้างโดยอัตโนมัติ มิฉะนั้นจะพิมพ์หมายเหตุและสั่งให้คุณรันซ้ำพร้อม `--fix`
  </Accordion>
  <Accordion title="3d. การซ่อมแซมสาขาทรานสคริปต์เซสชัน">
    Doctor สแกนไฟล์ JSONL ของเซสชันเอเจนต์เพื่อหารูปแบบสาขาที่ซ้ำกันซึ่งเกิดจากบั๊กการเขียนทรานสคริปต์พรอมป์ใหม่ใน 2026.4.24: รอบผู้ใช้ที่ถูกทิ้งไว้ซึ่งมีบริบทรันไทม์ภายในของ OpenClaw พร้อม sibling ที่ active ซึ่งมีพรอมป์ผู้ใช้ที่มองเห็นได้เหมือนกัน ในโหมด `--fix` / `--repair` doctor จะสำรองไฟล์แต่ละไฟล์ที่ได้รับผลกระทบไว้ข้างไฟล์เดิม และเขียนทรานสคริปต์ใหม่ให้เป็นสาขา active เพื่อให้ประวัติของ gateway และตัวอ่านหน่วยความจำไม่เห็นรอบที่ซ้ำกันอีกต่อไป
  </Accordion>
  <Accordion title="4. การตรวจสอบความถูกต้องของสถานะ (การคงอยู่ของเซสชัน, การกำหนดเส้นทาง และความปลอดภัย)">
    ไดเรกทอรีสถานะคือแกนปฏิบัติการ หากมันหายไป คุณจะสูญเสียเซสชัน ข้อมูลประจำตัว บันทึก และคอนฟิก (เว้นแต่คุณมีข้อมูลสำรองไว้ที่อื่น)

    Doctor ตรวจสอบ:

    - **ไดเรกทอรีสถานะหายไป**: เตือนเกี่ยวกับการสูญเสียสถานะอย่างร้ายแรง แจ้งให้สร้างไดเรกทอรีใหม่ และเตือนว่ามันไม่สามารถกู้คืนข้อมูลที่หายไปได้
    - **สิทธิ์ของไดเรกทอรีสถานะ**: ตรวจสอบว่าสามารถเขียนได้ เสนอให้ซ่อมแซมสิทธิ์ (และแสดงคำแนะนำ `chown` เมื่อตรวจพบว่า owner/group ไม่ตรงกัน)
    - **ไดเรกทอรีสถานะที่ซิงก์กับคลาวด์บน macOS**: เตือนเมื่อสถานะ resolve อยู่ใต้ iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ `~/Library/CloudStorage/...` เพราะ path ที่มี sync รองรับอาจทำให้ I/O ช้าลงและเกิดการแข่งขันของ lock/sync ได้
    - **ไดเรกทอรีสถานะบน SD หรือ eMMC ของ Linux**: เตือนเมื่อสถานะ resolve ไปยังแหล่ง mount `mmcblk*` เพราะ random I/O ที่รองรับด้วย SD หรือ eMMC อาจช้ากว่าและสึกหรอเร็วขึ้นภายใต้การเขียนเซสชันและข้อมูลประจำตัว
    - **ไดเรกทอรีเซสชันหายไป**: ต้องมี `sessions/` และไดเรกทอรี session store เพื่อคงประวัติและหลีกเลี่ยง crash แบบ `ENOENT`
    - **ทรานสคริปต์ไม่ตรงกัน**: เตือนเมื่อรายการเซสชันล่าสุดมีไฟล์ทรานสคริปต์ที่หายไป
    - **เซสชันหลัก "JSONL 1 บรรทัด"**: flag เมื่อทรานสคริปต์หลักมีเพียงหนึ่งบรรทัด (ประวัติไม่ได้สะสม)
    - **ไดเรกทอรีสถานะหลายแห่ง**: เตือนเมื่อมีโฟลเดอร์ `~/.openclaw` หลายแห่งในหลาย home directory หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (ประวัติอาจแยกระหว่างการติดตั้ง)
    - **ตัวเตือนโหมดรีโมต**: หาก `gateway.mode=remote` doctor จะเตือนให้คุณรันมันบนโฮสต์รีโมต (สถานะอยู่ที่นั่น)
    - **สิทธิ์ของไฟล์คอนฟิก**: เตือนหาก `~/.openclaw/openclaw.json` อ่านได้โดย group/world และเสนอให้ทำให้เข้มงวดเป็น `600`

  </Accordion>
  <Accordion title="5. สุขภาพการยืนยันตัวตนของโมเดล (การหมดอายุของ OAuth)">
    Doctor ตรวจสอบโปรไฟล์ OAuth ใน auth store เตือนเมื่อโทเค็นกำลังจะหมดอายุ/หมดอายุแล้ว และสามารถรีเฟรชได้เมื่อปลอดภัย หากโปรไฟล์ OAuth/token ของ Anthropic ค้างอยู่ จะแนะนำ Anthropic API key หรือ path setup-token ของ Anthropic พรอมป์รีเฟรชจะแสดงเฉพาะเมื่อรันแบบโต้ตอบ (TTY); `--non-interactive` จะข้ามความพยายามรีเฟรช

    เมื่อการรีเฟรช OAuth ล้มเหลวถาวร (เช่น `refresh_token_reused`, `invalid_grant` หรือผู้ให้บริการบอกให้คุณลงชื่อเข้าใช้อีกครั้ง) doctor จะรายงานว่าจำเป็นต้องยืนยันตัวตนใหม่ และพิมพ์คำสั่ง `openclaw models auth login --provider ...` ที่ต้องรันอย่างชัดเจน

    Doctor ยังรายงานโปรไฟล์ auth ที่ใช้งานไม่ได้ชั่วคราวเนื่องจาก:

    - cooldown สั้น ๆ (rate limits/timeouts/auth failures)
    - การปิดใช้นานขึ้น (billing/credit failures)

  </Accordion>
  <Accordion title="6. การตรวจสอบโมเดล hooks">
    หากตั้งค่า `hooks.gmail.model` ไว้ doctor จะตรวจสอบความถูกต้องของการอ้างอิงโมเดลเทียบกับ catalog และ allowlist และเตือนเมื่อ resolve ไม่ได้หรือไม่ได้รับอนุญาต
  </Accordion>
  <Accordion title="7. การซ่อมแซมอิมเมจ sandbox">
    เมื่อเปิดใช้ sandboxing doctor จะตรวจสอบอิมเมจ Docker และเสนอให้ build หรือสลับไปใช้ชื่อ legacy หากอิมเมจปัจจุบันหายไป
  </Accordion>
  <Accordion title="7b. การล้างการติดตั้ง Plugin">
    Doctor ลบสถานะ staging ของ dependency ของ plugin แบบเดิมที่ OpenClaw สร้างขึ้นในโหมด `openclaw doctor --fix` / `openclaw doctor --repair` ซึ่งครอบคลุม root ของ dependency ที่สร้างไว้ซึ่งค้างอยู่ ไดเรกทอรี install-stage เก่า debris ภายในแพ็กเกจจากโค้ดซ่อมแซม dependency ของ bundled-plugin ก่อนหน้า และสำเนา npm ที่จัดการไว้ซึ่ง orphaned หรือ recovered ของ Plugin `@openclaw/*` ที่ bundled ซึ่งอาจบดบัง bundled manifest ปัจจุบัน

    Doctor ยังสามารถติดตั้ง Plugin ที่ดาวน์โหลดได้ซึ่งหายไปใหม่ เมื่อคอนฟิกอ้างอิงถึงมันแต่ registry ของ Plugin ภายในเครื่องหาไม่พบ ตัวอย่างรวมถึง `plugins.entries` ที่เป็นรูปธรรม การตั้งค่า channel/provider/search ที่กำหนดไว้ และรันไทม์เอเจนต์ที่กำหนดไว้ ระหว่างการอัปเดตแพ็กเกจ doctor จะหลีกเลี่ยงการรันการซ่อมแซม Plugin ของ package-manager ขณะที่แพ็กเกจ core กำลังถูกสลับอยู่ ให้รัน `openclaw doctor --fix` อีกครั้งหลังอัปเดต หาก Plugin ที่กำหนดค่าไว้ยังต้องกู้คืนอยู่ การเริ่มต้น Gateway และการ reload คอนฟิกจะไม่รัน package manager; การติดตั้ง Plugin ยังคงเป็นงาน doctor/install/update ที่ชัดเจน

  </Accordion>
  <Accordion title="8. การย้ายบริการ Gateway และคำแนะนำการล้างข้อมูล">
    Doctor ตรวจพบบริการ gateway แบบเดิม (launchd/systemd/schtasks) และเสนอให้ลบออกพร้อมติดตั้งบริการ OpenClaw โดยใช้พอร์ต gateway ปัจจุบัน นอกจากนี้ยังสแกนหาบริการเพิ่มเติมที่มีลักษณะคล้าย gateway และพิมพ์คำแนะนำการล้างข้อมูลได้ด้วย บริการ OpenClaw gateway ที่ตั้งชื่อตามโปรไฟล์ถือเป็นบริการชั้นหนึ่งและจะไม่ถูกทำเครื่องหมายเป็น "เพิ่มเติม"

    บน Linux หากไม่มีบริการ gateway ระดับผู้ใช้ แต่มีบริการ OpenClaw gateway ระดับระบบอยู่แล้ว doctor จะไม่ติดตั้งบริการระดับผู้ใช้อีกชุดโดยอัตโนมัติ ให้ตรวจสอบด้วย `openclaw gateway status --deep` หรือ `openclaw doctor --deep` จากนั้นลบรายการที่ซ้ำกัน หรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ system supervisor เป็นผู้ควบคุมวงจรชีวิตของ gateway

  </Accordion>
  <Accordion title="8b. การย้าย Startup Matrix">
    เมื่อบัญชีช่องทาง Matrix มีการย้ายสถานะเดิมที่รอดำเนินการหรือดำเนินการได้ doctor (ในโหมด `--fix` / `--repair`) จะสร้าง snapshot ก่อนการย้าย แล้วจึงเรียกใช้ขั้นตอนการย้ายแบบพยายามอย่างดีที่สุด ได้แก่ การย้ายสถานะ Matrix แบบเดิม และการเตรียมสถานะที่เข้ารหัสแบบเดิม ทั้งสองขั้นตอนไม่ทำให้ล้มเหลวถาวร ระบบจะบันทึกข้อผิดพลาดและดำเนินการเริ่มต้นต่อไป ในโหมดอ่านอย่างเดียว (`openclaw doctor` ที่ไม่มี `--fix`) การตรวจสอบนี้จะถูกข้ามทั้งหมด
  </Accordion>
  <Accordion title="8c. การจับคู่อุปกรณ์และความคลาดเคลื่อนของการยืนยันตัวตน">
    ตอนนี้ Doctor ตรวจสอบสถานะการจับคู่อุปกรณ์เป็นส่วนหนึ่งของการตรวจสุขภาพตามปกติ

    สิ่งที่รายงาน:

    - คำขอจับคู่ครั้งแรกที่รอดำเนินการ
    - การอัปเกรดบทบาทที่รอดำเนินการสำหรับอุปกรณ์ที่จับคู่แล้ว
    - การอัปเกรดขอบเขตที่รอดำเนินการสำหรับอุปกรณ์ที่จับคู่แล้ว
    - การซ่อมแซม public-key mismatch เมื่อ device id ยังตรงกัน แต่ตัวตนอุปกรณ์ไม่ตรงกับระเบียนที่อนุมัติแล้วอีกต่อไป
    - ระเบียนที่จับคู่แล้วซึ่งไม่มี token ที่ใช้งานอยู่สำหรับบทบาทที่อนุมัติ
    - token ที่จับคู่แล้วซึ่งขอบเขตคลาดเคลื่อนออกจาก baseline การจับคู่ที่อนุมัติ
    - รายการ device-token ที่แคชไว้ในเครื่องสำหรับเครื่องปัจจุบัน ซึ่งเก่ากว่าการหมุน token ฝั่ง gateway หรือมี metadata ขอบเขตที่ล้าสมัย

    Doctor จะไม่อนุมัติคำขอจับคู่หรือหมุนเวียน device token โดยอัตโนมัติ แต่จะพิมพ์ขั้นตอนถัดไปที่แน่นอนแทน:

    - ตรวจสอบคำขอที่รอดำเนินการด้วย `openclaw devices list`
    - อนุมัติคำขอที่เจาะจงด้วย `openclaw devices approve <requestId>`
    - หมุนเวียน token ใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
    - ลบระเบียนที่ล้าสมัยแล้วอนุมัติใหม่ด้วย `openclaw devices remove <deviceId>`

    สิ่งนี้ปิดช่องโหว่ทั่วไปของ "จับคู่แล้วแต่ยังคงได้รับข้อความว่าต้องจับคู่": ตอนนี้ doctor แยกแยะการจับคู่ครั้งแรกออกจากการอัปเกรดบทบาท/ขอบเขตที่รอดำเนินการ และจากความคลาดเคลื่อนของ token/ตัวตนอุปกรณ์ที่ล้าสมัย

  </Accordion>
  <Accordion title="9. คำเตือนด้านความปลอดภัย">
    Doctor แสดงคำเตือนเมื่อ provider เปิดรับ DM โดยไม่มี allowlist หรือเมื่อนโยบายถูกกำหนดค่าในลักษณะที่อันตราย
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    หากทำงานเป็นบริการผู้ใช้ของ systemd doctor จะตรวจสอบให้แน่ใจว่าเปิดใช้งาน lingering เพื่อให้ gateway ยังทำงานต่อหลังจาก logout
  </Accordion>
  <Accordion title="11. สถานะ workspace (Skills, Plugin และไดเรกทอรีเดิม)">
    Doctor พิมพ์สรุปสถานะ workspace สำหรับ agent เริ่มต้น:

    - **สถานะ Skills**: นับ Skills ที่เข้าเกณฑ์, ขาด requirements และถูก allowlist บล็อก
    - **ไดเรกทอรี workspace เดิม**: เตือนเมื่อมี `~/openclaw` หรือไดเรกทอรี workspace เดิมอื่น ๆ อยู่ร่วมกับ workspace ปัจจุบัน
    - **สถานะ Plugin**: นับ Plugin ที่เปิดใช้งาน/ปิดใช้งาน/มีข้อผิดพลาด; แสดงรายการ plugin IDs สำหรับข้อผิดพลาดใด ๆ; รายงานความสามารถของ bundle plugin
    - **คำเตือนความเข้ากันได้ของ Plugin**: ทำเครื่องหมาย Plugin ที่มีปัญหาความเข้ากันได้กับ runtime ปัจจุบัน
    - **การวินิจฉัย Plugin**: แสดงคำเตือนหรือข้อผิดพลาดขณะโหลดที่ plugin registry ส่งออกมา

  </Accordion>
  <Accordion title="11b. ขนาดไฟล์ bootstrap">
    Doctor ตรวจสอบว่าไฟล์ bootstrap ของ workspace (เช่น `AGENTS.md`, `CLAUDE.md` หรือไฟล์ context อื่นที่ถูกฉีดเข้าไป) ใกล้ถึงหรือเกินงบประมาณอักขระที่กำหนดไว้หรือไม่ โดยรายงานจำนวนอักขระดิบเทียบกับจำนวนอักขระที่ฉีดเข้าไปแยกตามไฟล์, เปอร์เซ็นต์การตัดทอน, สาเหตุการตัดทอน (`max/file` หรือ `max/total`) และจำนวนอักขระที่ฉีดเข้าไปทั้งหมดในรูปเศษส่วนของงบประมาณทั้งหมด เมื่อไฟล์ถูกตัดทอนหรือใกล้ถึงขีดจำกัด doctor จะพิมพ์คำแนะนำสำหรับการปรับ `agents.defaults.bootstrapMaxChars` และ `agents.defaults.bootstrapTotalMaxChars`
  </Accordion>
  <Accordion title="11d. การล้าง Plugin ช่องทางที่ล้าสมัย">
    เมื่อ `openclaw doctor --fix` ลบ Plugin ช่องทางที่ขาดหายไป ระบบจะลบ config ที่ผูกกับขอบเขตช่องทางซึ่งค้างอยู่และอ้างถึง Plugin นั้นด้วย ได้แก่ รายการ `channels.<id>`, เป้าหมาย Heartbeat ที่ระบุชื่อช่องทาง และ overrides `agents.*.models["<channel>/*"]` สิ่งนี้ช่วยป้องกัน boot loop ของ Gateway เมื่อ runtime ของช่องทางหายไปแล้ว แต่ config ยังสั่งให้ gateway bind กับช่องทางนั้น
  </Accordion>
  <Accordion title="11c. การเติมคำสั่งของ shell">
    Doctor ตรวจสอบว่ามีการติดตั้ง tab completion สำหรับ shell ปัจจุบันแล้วหรือไม่ (zsh, bash, fish หรือ PowerShell):

    - หากโปรไฟล์ shell ใช้รูปแบบ completion แบบ dynamic ที่ช้า (`source <(openclaw completion ...)`) doctor จะอัปเกรดเป็นรูปแบบไฟล์แคชที่เร็วกว่า
    - หากมีการกำหนดค่า completion ในโปรไฟล์ แต่ไฟล์แคชหายไป doctor จะสร้างแคชใหม่โดยอัตโนมัติ
    - หากยังไม่ได้กำหนดค่า completion เลย doctor จะแจ้งให้ติดตั้ง (เฉพาะโหมด interactive เท่านั้น; ข้ามเมื่อใช้ `--non-interactive`)

    เรียกใช้ `openclaw completion --write-state` เพื่อสร้างแคชใหม่ด้วยตนเอง

  </Accordion>
  <Accordion title="12. การตรวจสอบการรับรองความถูกต้องของ Gateway (โทเค็นภายในเครื่อง)">
    Doctor ตรวจสอบความพร้อมของการรับรองความถูกต้องด้วยโทเค็น Gateway ภายในเครื่อง

    - หากโหมดโทเค็นต้องใช้โทเค็นและไม่มีแหล่งโทเค็นอยู่ Doctor จะเสนอให้สร้างโทเค็นหนึ่งรายการ
    - หาก `gateway.auth.token` จัดการโดย SecretRef แต่ไม่พร้อมใช้งาน Doctor จะเตือนและไม่เขียนทับด้วยข้อความธรรมดา
    - `openclaw doctor --generate-gateway-token` บังคับสร้างเฉพาะเมื่อไม่มีการกำหนดค่าโทเค็น SecretRef

  </Accordion>
  <Accordion title="12b. การซ่อมแซมแบบอ่านอย่างเดียวที่รับรู้ SecretRef">
    โฟลว์การซ่อมแซมบางรายการต้องตรวจสอบข้อมูลรับรองที่กำหนดค่าไว้โดยไม่ลดทอนพฤติกรรมล้มเหลวเร็วของ runtime

    - ตอนนี้ `openclaw doctor --fix` ใช้โมเดลสรุป SecretRef แบบอ่านอย่างเดียวเดียวกันกับคำสั่งตระกูลสถานะสำหรับการซ่อมแซม config แบบเจาะจง
    - ตัวอย่าง: การซ่อมแซม Telegram `allowFrom` / `groupAllowFrom` `@username` จะพยายามใช้ข้อมูลรับรองบอทที่กำหนดค่าไว้เมื่อพร้อมใช้งาน
    - หากโทเค็นบอท Telegram ถูกกำหนดค่าผ่าน SecretRef แต่ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน Doctor จะรายงานว่าข้อมูลรับรองถูกกำหนดค่าแล้วแต่ไม่พร้อมใช้งาน และข้ามการแก้ค่าอัตโนมัติแทนที่จะล้มเหลวหรือรายงานผิดว่าโทเค็นหายไป

  </Accordion>
  <Accordion title="13. การตรวจสุขภาพ Gateway + การรีสตาร์ต">
    Doctor เรียกใช้การตรวจสุขภาพและเสนอให้รีสตาร์ต Gateway เมื่อดูเหมือนว่าไม่ปกติ
  </Accordion>
  <Accordion title="13b. ความพร้อมของการค้นหาหน่วยความจำ">
    Doctor ตรวจสอบว่าผู้ให้บริการ embedding สำหรับการค้นหาหน่วยความจำที่กำหนดค่าไว้นั้นพร้อมสำหรับ agent เริ่มต้นหรือไม่ พฤติกรรมขึ้นอยู่กับ backend และผู้ให้บริการที่กำหนดค่าไว้:

    - **QMD backend**: ตรวจสอบว่าไบนารี `qmd` พร้อมใช้งานและเริ่มได้หรือไม่ หากไม่ได้ จะพิมพ์คำแนะนำการแก้ไขรวมถึงแพ็กเกจ npm และตัวเลือกพาธไบนารีแบบกำหนดเอง
    - **ผู้ให้บริการภายในเครื่องที่ระบุอย่างชัดเจน**: ตรวจสอบไฟล์โมเดลภายในเครื่องหรือ URL โมเดลระยะไกล/ที่ดาวน์โหลดได้ซึ่งรู้จัก หากหายไป จะแนะนำให้เปลี่ยนไปใช้ผู้ให้บริการระยะไกล
    - **ผู้ให้บริการระยะไกลที่ระบุอย่างชัดเจน** (`openai`, `voyage` ฯลฯ): ตรวจสอบว่ามี API key ใน environment หรือ auth store หรือไม่ พิมพ์คำแนะนำการแก้ไขที่ลงมือทำได้หากหายไป
    - **ผู้ให้บริการอัตโนมัติ**: ตรวจสอบความพร้อมของโมเดลภายในเครื่องก่อน จากนั้นลองผู้ให้บริการระยะไกลแต่ละรายตามลำดับการเลือกอัตโนมัติ

    เมื่อมีผลการ probe ของ Gateway ที่แคชไว้ (Gateway มีสุขภาพดี ณ เวลาที่ตรวจสอบ) Doctor จะเทียบผลลัพธ์นั้นกับ config ที่ CLI มองเห็นและระบุความคลาดเคลื่อนใด ๆ Doctor จะไม่เริ่ม embedding ping ใหม่ในเส้นทางเริ่มต้น ให้ใช้คำสั่งสถานะหน่วยความจำแบบ deep เมื่อคุณต้องการตรวจสอบผู้ให้บริการแบบ live

    ใช้ `openclaw memory status --deep` เพื่อตรวจสอบความพร้อมของ embedding ใน runtime

  </Accordion>
  <Accordion title="14. คำเตือนสถานะช่องทาง">
    หาก Gateway มีสุขภาพดี Doctor จะเรียกใช้การ probe สถานะช่องทางและรายงานคำเตือนพร้อมวิธีแก้ไขที่แนะนำ
  </Accordion>
  <Accordion title="15. การตรวจสอบ config ของ supervisor + การซ่อมแซม">
    Doctor ตรวจสอบ config ของ supervisor ที่ติดตั้งไว้ (launchd/systemd/schtasks) เพื่อหาค่าเริ่มต้นที่หายไปหรือล้าสมัย (เช่น การพึ่งพา systemd network-online และดีเลย์การรีสตาร์ต) เมื่อพบความไม่ตรงกัน จะแนะนำให้อัปเดตและสามารถเขียนไฟล์ service/task ใหม่เป็นค่าเริ่มต้นปัจจุบันได้

    หมายเหตุ:

    - `openclaw doctor` จะแจ้งถามก่อนเขียน config ของ supervisor ใหม่
    - `openclaw doctor --yes` ยอมรับพรอมป์การซ่อมแซมเริ่มต้น
    - `openclaw doctor --repair` ใช้การแก้ไขที่แนะนำโดยไม่แจ้งถาม
    - `openclaw doctor --repair --force` เขียนทับ config ของ supervisor แบบกำหนดเอง
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` ทำให้ Doctor เป็นแบบอ่านอย่างเดียวสำหรับ lifecycle ของ service Gateway โดยยังคงรายงานสุขภาพ service และเรียกใช้การซ่อมแซมที่ไม่ใช่ service แต่ข้ามการติดตั้ง/เริ่ม/รีสตาร์ต/บูตสแตรป service การเขียน config ของ supervisor ใหม่ และการล้าง service เก่า เพราะ supervisor ภายนอกเป็นเจ้าของ lifecycle นั้น
    - บน Linux Doctor จะไม่เขียน metadata ของคำสั่ง/entrypoint ใหม่ขณะที่ unit ของ systemd Gateway ที่ตรงกันทำงานอยู่ และยังละเว้น unit แบบคล้าย Gateway เพิ่มเติมที่ไม่ใช่ legacy และไม่ได้ทำงานระหว่างการสแกน service ซ้ำ เพื่อไม่ให้ไฟล์ service คู่ขนานสร้างเสียงรบกวนในการล้างข้อมูล
    - หากการรับรองความถูกต้องด้วยโทเค็นต้องใช้โทเค็นและ `gateway.auth.token` จัดการโดย SecretRef การติดตั้ง/ซ่อมแซม service ของ Doctor จะตรวจสอบ SecretRef แต่ไม่บันทึกค่าโทเค็นข้อความธรรมดาที่ resolve แล้วลงใน metadata environment ของ supervisor service
    - Doctor ตรวจพบค่า environment ของ service ที่รองรับด้วย `.env`/SecretRef ที่ติดตั้ง LaunchAgent, systemd หรือ Windows Scheduled Task รุ่นเก่าเคยฝังไว้ inline และเขียน metadata ของ service ใหม่เพื่อให้ค่าเหล่านั้นโหลดจากแหล่ง runtime แทนที่จะอยู่ในคำจำกัดความของ supervisor
    - Doctor ตรวจพบเมื่อคำสั่ง service ยังตรึง `--port` เก่าไว้หลังจาก `gateway.port` เปลี่ยน และเขียน metadata ของ service ใหม่ให้เป็นพอร์ตปัจจุบัน
    - หากการรับรองความถูกต้องด้วยโทเค็นต้องใช้โทเค็นและ token SecretRef ที่กำหนดค่าไว้ยังไม่ถูก resolve Doctor จะบล็อกเส้นทางติดตั้ง/ซ่อมแซมพร้อมคำแนะนำที่ลงมือทำได้
    - หากทั้ง `gateway.auth.token` และ `gateway.auth.password` ถูกกำหนดค่า และไม่ได้ตั้งค่า `gateway.auth.mode` Doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้งค่า mode อย่างชัดเจน
    - สำหรับ unit ของ Linux user-systemd ตอนนี้การตรวจสอบ token drift ของ Doctor รวมทั้งแหล่ง `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบ metadata การรับรองความถูกต้องของ service
    - การซ่อมแซม service ของ Doctor จะปฏิเสธการเขียนใหม่ หยุด หรือรีสตาร์ต service Gateway จากไบนารี OpenClaw รุ่นเก่า เมื่อ config ถูกเขียนครั้งล่าสุดโดยเวอร์ชันที่ใหม่กว่า ดู [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)
    - คุณสามารถบังคับเขียนใหม่ทั้งหมดได้เสมอผ่าน `openclaw gateway install --force`

  </Accordion>
  <Accordion title="16. การวินิจฉัย runtime ของ Gateway + พอร์ต">
    Doctor ตรวจสอบ runtime ของ service (PID, สถานะ exit ล่าสุด) และเตือนเมื่อมีการติดตั้ง service แล้วแต่ไม่ได้ทำงานจริง และยังตรวจหาการชนกันของพอร์ตบนพอร์ต Gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (Gateway ทำงานอยู่แล้ว, SSH tunnel)
  </Accordion>
  <Accordion title="17. แนวทางปฏิบัติที่ดีของ runtime ของ Gateway">
    Doctor เตือนเมื่อ service Gateway ทำงานบน Bun หรือพาธ Node ที่จัดการด้วยตัวจัดการเวอร์ชัน (`nvm`, `fnm`, `volta`, `asdf` ฯลฯ) ช่องทาง WhatsApp + Telegram ต้องใช้ Node และพาธตัวจัดการเวอร์ชันอาจเสียหลังอัปเกรด เพราะ service ไม่โหลด shell init ของคุณ Doctor เสนอให้ย้ายไปใช้การติดตั้ง Node ของระบบเมื่อพร้อมใช้งาน (Homebrew/apt/choco)

    LaunchAgent ของ macOS ที่ติดตั้งหรือซ่อมแซมใหม่ใช้ PATH ระบบมาตรฐาน (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) แทนการคัดลอก PATH ของ shell แบบ interactive เพื่อให้ไบนารีระบบที่จัดการโดย Homebrew ยังคงพร้อมใช้งาน ขณะที่ Volta, asdf, fnm, pnpm และไดเรกทอรีตัวจัดการเวอร์ชันอื่น ๆ ไม่เปลี่ยน Node ที่ child process resolve ได้ service ของ Linux ยังคงเก็บ environment roots ที่ระบุชัดเจน (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) และไดเรกทอรี user-bin ที่เสถียร แต่ไดเรกทอรี fallback ของตัวจัดการเวอร์ชันที่คาดเดาจะถูกเขียนลงใน PATH ของ service เฉพาะเมื่อไดเรกทอรีเหล่านั้นมีอยู่บนดิสก์

  </Accordion>
  <Accordion title="18. การเขียน config + metadata ของ wizard">
    Doctor บันทึกการเปลี่ยนแปลง config ใด ๆ และประทับ metadata ของ wizard เพื่อบันทึกการเรียกใช้ Doctor
  </Accordion>
  <Accordion title="19. เคล็ดลับ workspace (สำรองข้อมูล + ระบบหน่วยความจำ)">
    Doctor แนะนำระบบหน่วยความจำของ workspace เมื่อไม่มี และพิมพ์เคล็ดลับการสำรองข้อมูลหาก workspace ยังไม่ได้อยู่ภายใต้ git

    ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคู่มือฉบับเต็มเกี่ยวกับโครงสร้าง workspace และการสำรองข้อมูลด้วย git (แนะนำ GitHub หรือ GitLab แบบ private)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [runbook ของ Gateway](/th/gateway)
- [การแก้ปัญหา Gateway](/th/gateway/troubleshooting)
