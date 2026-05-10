---
read_when:
    - การเพิ่มหรือแก้ไขไมเกรชันของ doctor
    - การนำการเปลี่ยนแปลงการกำหนดค่าที่ไม่รองรับความเข้ากันได้ย้อนหลังมาใช้
sidebarTitle: Doctor
summary: 'คำสั่ง Doctor: การตรวจสอบสถานภาพ การย้ายข้อมูลการกำหนดค่า และขั้นตอนการซ่อมแซม'
title: ตรวจวินิจฉัย
x-i18n:
    generated_at: "2026-05-10T19:38:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417440c2f658be5848b305bffeb006ad435f069d93f7e73ffbeef9468b58e1b3
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` คือเครื่องมือซ่อมแซมและย้ายข้อมูลสำหรับ OpenClaw เครื่องมือนี้แก้ไข config/สถานะที่ล้าสมัย ตรวจสอบสุขภาพ และให้ขั้นตอนซ่อมแซมที่นำไปปฏิบัติได้

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw doctor
```

### โหมด Headless และระบบอัตโนมัติ

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    ยอมรับค่าเริ่มต้นโดยไม่ถามพร้อมท์ รวมถึงขั้นตอนซ่อมแซม restart/service/sandbox เมื่อเกี่ยวข้อง

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    ใช้การซ่อมแซมที่แนะนำโดยไม่ถามพร้อมท์ รวมถึงการซ่อมแซมและการ restart เมื่อปลอดภัย

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    ใช้การซ่อมแซมเชิงรุกด้วย รวมถึงเขียนทับ config ของ supervisor แบบกำหนดเอง

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    รันโดยไม่มีพร้อมท์และใช้เฉพาะการย้ายข้อมูลที่ปลอดภัย ได้แก่ การปรับ config ให้เป็นมาตรฐานและการย้ายสถานะบนดิสก์ ข้ามการทำงานกับ restart/service/sandbox ที่ต้องมีการยืนยันจากมนุษย์ การย้ายสถานะเดิมจะรันโดยอัตโนมัติเมื่อตรวจพบ

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    สแกน service ของระบบเพื่อหา gateway ที่ติดตั้งเพิ่มเติม (launchd/systemd/schtasks)

  </Tab>
</Tabs>

หากต้องการตรวจทานการเปลี่ยนแปลงก่อนเขียน ให้เปิดไฟล์ config ก่อน:

```bash
cat ~/.openclaw/openclaw.json
```

## สิ่งที่เครื่องมือนี้ทำ (สรุป)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - การอัปเดตก่อนเริ่มที่เลือกได้สำหรับการติดตั้งจาก git (เฉพาะโหมดโต้ตอบ)
    - การตรวจสอบความสดใหม่ของโปรโตคอล UI (สร้าง Control UI ใหม่เมื่อ schema ของโปรโตคอลใหม่กว่า)
    - การตรวจสอบสุขภาพและพร้อมท์ให้ restart
    - สรุปสถานะ Skills (ใช้ได้/ขาดหาย/ถูกบล็อก) และสถานะ Plugin

  </Accordion>
  <Accordion title="Config and migrations">
    - การปรับ config ให้เป็นมาตรฐานสำหรับค่าเดิม
    - การย้าย config ของ Talk จากฟิลด์แบบแบนเดิม `talk.*` ไปเป็น `talk.provider` + `talk.providers.<provider>`
    - การตรวจสอบการย้าย browser สำหรับ config Chrome extension เดิมและความพร้อมของ Chrome MCP
    - คำเตือน OpenCode provider override (`models.providers.opencode` / `models.providers.opencode-go`)
    - คำเตือน Codex OAuth shadowing (`models.providers.openai-codex`)
    - การตรวจสอบข้อกำหนดเบื้องต้นของ OAuth TLS สำหรับโปรไฟล์ OpenAI Codex OAuth
    - คำเตือน allowlist ของ Plugin/tool เมื่อ `plugins.allow` จำกัดมาก แต่ policy ของ tool ยังขอ wildcard หรือ tool ที่ Plugin เป็นเจ้าของ
    - การย้ายสถานะเดิมบนดิสก์ (sessions/agent dir/WhatsApp auth)
    - การย้าย key ของสัญญา manifest ของ Plugin เดิม (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
    - การย้าย store ของ cron เดิม (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบน, payload `provider`, งาน fallback ของ webhook แบบง่าย `notify: true`)
    - การล้าง runtime-policy เดิมทั้ง agent; provider/model runtime policy คือ route selector ที่ใช้งานอยู่
    - การล้าง config ของ Plugin ที่ล้าสมัยเมื่อเปิดใช้งาน plugins; เมื่อ `plugins.enabled=false` การอ้างอิง Plugin ที่ล้าสมัยจะถือเป็น config containment ที่ไม่ทำงานและจะถูกเก็บไว้

  </Accordion>
  <Accordion title="State and integrity">
    - การตรวจสอบไฟล์ lock ของ session และการล้าง lock ที่ล้าสมัย
    - การซ่อมแซม transcript ของ session สำหรับแขนง prompt-rewrite ที่ซ้ำกัน ซึ่งสร้างโดย build รุ่น 2026.4.24 ที่ได้รับผลกระทบ
    - การตรวจจับ tombstone ของการกู้คืนหลัง restart ของ subagent ที่ค้าง พร้อมรองรับ `--fix` เพื่อล้างแฟล็กการกู้คืนที่ abort แล้วซึ่งล้าสมัย เพื่อไม่ให้ startup ปฏิบัติกับ child เหมือนยังถูก abort จากการ restart ต่อไป
    - การตรวจสอบความสมบูรณ์และสิทธิ์ของสถานะ (sessions, transcripts, state dir)
    - การตรวจสอบสิทธิ์ไฟล์ config (chmod 600) เมื่อรันในเครื่อง
    - สุขภาพของ model auth: ตรวจสอบการหมดอายุของ OAuth, สามารถ refresh token ที่ใกล้หมดอายุ และรายงานสถานะ cooldown/disabled ของ auth-profile
    - การตรวจจับ workspace dir เพิ่มเติม (`~/openclaw`)

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - การซ่อมแซม sandbox image เมื่อเปิดใช้งาน sandboxing
    - การย้าย service เดิมและการตรวจจับ gateway เพิ่มเติม
    - การย้ายสถานะเดิมของช่องทาง Matrix (ในโหมด `--fix` / `--repair`)
    - การตรวจสอบ Gateway runtime (ติดตั้ง service แล้วแต่ไม่ทำงาน; label ของ launchd ที่ cache ไว้)
    - คำเตือนสถานะช่องทาง (probe จาก gateway ที่กำลังรัน)
    - การตรวจสอบสิทธิ์เฉพาะช่องทางอยู่ใต้ `openclaw channels capabilities`; เช่น สิทธิ์ช่องเสียง Discord จะถูก audit ด้วย `openclaw channels capabilities --channel discord --target channel:<channel-id>`
    - การตรวจสอบการตอบสนองของ WhatsApp สำหรับสุขภาพ event-loop ของ Gateway ที่เสื่อมลงขณะที่ client TUI ในเครื่องยังรันอยู่; `--fix` จะหยุดเฉพาะ client TUI ในเครื่องที่ตรวจยืนยันแล้วเท่านั้น
    - การซ่อม route ของ Codex สำหรับ model ref เดิม `openai-codex/*` ในโมเดลหลัก, fallback, heartbeat/subagent/compaction override, hooks, channel model override และ session route pin; `--fix` เขียนใหม่เป็น `openai/*`, ลบ session/whole-agent runtime pin ที่ล้าสมัย และคง ref ของ agent OpenAI ที่เป็นมาตรฐานไว้บน Codex harness เริ่มต้น
    - การ audit config ของ supervisor (launchd/systemd/schtasks) พร้อมการซ่อมแซมที่เลือกได้
    - การล้าง environment ของ embedded proxy สำหรับ service ของ gateway ที่จับค่า shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` ไว้ระหว่างติดตั้งหรืออัปเดต
    - การตรวจสอบแนวทางปฏิบัติที่ดีของ Gateway runtime (Node เทียบกับ Bun, path ของ version-manager)
    - การวินิจฉัยการชนกันของพอร์ต Gateway (ค่าเริ่มต้น `18789`)

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - คำเตือนด้านความปลอดภัยสำหรับ policy ของ DM แบบเปิด
    - การตรวจสอบ auth ของ Gateway สำหรับโหมด token ในเครื่อง (เสนอการสร้าง token เมื่อไม่มีแหล่ง token; ไม่เขียนทับ config ของ token SecretRef)
    - การตรวจจับปัญหา device pairing (คำขอจับคู่ครั้งแรกที่ค้างอยู่, การอัปเกรด role/scope ที่ค้างอยู่, drift ของ cache device-token ในเครื่องที่ล้าสมัย และ drift ของ auth ใน paired-record)

  </Accordion>
  <Accordion title="Workspace and shell">
    - การตรวจสอบ systemd linger บน Linux
    - การตรวจสอบขนาดไฟล์ bootstrap ของ workspace (คำเตือนการตัดทอน/ใกล้ถึงขีดจำกัดสำหรับไฟล์ context)
    - การตรวจสอบความพร้อมของ Skills สำหรับ agent เริ่มต้น; รายงาน skills ที่อนุญาตแต่ขาด bin, env, config หรือข้อกำหนด OS และ `--fix` สามารถปิดใช้งาน skills ที่ไม่พร้อมใช้งานใน `skills.entries`
    - การตรวจสอบสถานะ shell completion และการติดตั้ง/อัปเกรดอัตโนมัติ
    - การตรวจสอบความพร้อมของ provider สำหรับ embedding ของ memory search (โมเดลในเครื่อง, remote API key หรือ binary ของ QMD)
    - การตรวจสอบการติดตั้งจาก source (pnpm workspace ไม่ตรงกัน, ขาด UI assets, ขาด binary ของ tsx)
    - เขียน config และ wizard metadata ที่อัปเดต

  </Accordion>
</AccordionGroup>

## การ backfill และ reset ของ Dreams UI

ฉาก Dreams ใน Control UI มี action **Backfill**, **Reset** และ **Clear Grounded** สำหรับ workflow ของ grounded dreaming action เหล่านี้ใช้เมธอด RPC แบบ doctor ของ gateway แต่ไม่ได้เป็นส่วนหนึ่งของการซ่อมแซม/ย้ายข้อมูลใน CLI `openclaw doctor`

สิ่งที่ action เหล่านี้ทำ:

- **Backfill** สแกนไฟล์ประวัติ `memory/YYYY-MM-DD.md` ใน workspace ที่ใช้งานอยู่ รัน grounded REM diary pass และเขียนรายการ backfill ที่ย้อนกลับได้ลงใน `DREAMS.md`
- **Reset** ลบเฉพาะรายการ backfill diary ที่ทำเครื่องหมายไว้เหล่านั้นออกจาก `DREAMS.md`
- **Clear Grounded** ลบเฉพาะรายการ short-term แบบ grounded-only ที่ staged แล้ว ซึ่งมาจาก historical replay และยังไม่ได้สะสม live recall หรือ daily support

สิ่งที่ action เหล่านี้ **ไม่** ทำเอง:

- ไม่แก้ไข `MEMORY.md`
- ไม่รันการย้ายข้อมูลของ doctor แบบเต็ม
- ไม่ stage grounded candidates เข้าไปใน live short-term promotion store โดยอัตโนมัติ เว้นแต่คุณจะรัน path ของ CLI แบบ staged อย่างชัดเจนก่อน

หากต้องการให้ grounded historical replay ส่งผลต่อ lane การ promote แบบ deep ตามปกติ ให้ใช้ flow ของ CLI แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

คำสั่งนี้จะ stage grounded durable candidates เข้าไปใน short-term dreaming store ขณะที่ยังคงให้ `DREAMS.md` เป็นพื้นผิวสำหรับตรวจทาน

## พฤติกรรมและเหตุผลโดยละเอียด

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    หากนี่เป็น git checkout และ doctor กำลังรันแบบโต้ตอบ ระบบจะเสนอให้อัปเดต (fetch/rebase/build) ก่อนรัน doctor
  </Accordion>
  <Accordion title="1. Config normalization">
    หาก config มีรูปแบบค่าดั้งเดิม เช่น `messages.ackReaction` ที่ไม่มี override เฉพาะช่องทาง doctor จะปรับให้เป็นมาตรฐานตาม schema ปัจจุบัน

    ซึ่งรวมถึงฟิลด์แบบแบนเดิมของ Talk config สาธารณะปัจจุบันของ Talk speech คือ `talk.provider` + `talk.providers.<provider>` และ config เสียง realtime คือ `talk.realtime.*` Doctor เขียนรูปแบบเก่า `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ใหม่เข้าไปใน provider map และเขียน selector ของ realtime ระดับบนเดิม (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) ใหม่ไปเป็น `talk.realtime`

    Doctor ยังเตือนเมื่อ `plugins.allow` ไม่ว่างและ policy ของ tool ใช้
    wildcard หรือรายการ tool ที่ Plugin เป็นเจ้าของ `tools.allow: ["*"]` จะ match เฉพาะ tools
    จาก plugins ที่โหลดจริงเท่านั้น; ไม่ได้ข้าม allowlist ของ Plugin แบบ exclusive
    Doctor เขียน `plugins.bundledDiscovery: "compat"` สำหรับ config allowlist เดิมที่ย้ายแล้ว
    เพื่อคงพฤติกรรม provider แบบ bundled ที่มีอยู่ แล้วจึงชี้ไปยังการตั้งค่า `"allowlist"` ที่เข้มงวดกว่า

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    เมื่อ config มี key ที่ deprecated คำสั่งอื่นจะปฏิเสธการรันและขอให้คุณรัน `openclaw doctor`

    Doctor จะ:

    - อธิบายว่าพบ key เดิมใดบ้าง
    - แสดงการย้ายข้อมูลที่นำไปใช้
    - เขียน `~/.openclaw/openclaw.json` ใหม่ด้วย schema ที่อัปเดตแล้ว

    การเริ่มต้น Gateway ปฏิเสธรูปแบบ config เดิมและขอให้คุณรัน `openclaw doctor --fix`; จะไม่เขียน `openclaw.json` ใหม่ตอน startup การย้าย store ของ Cron job ก็จัดการโดย `openclaw doctor --fix` เช่นกัน

    การย้ายข้อมูลปัจจุบัน:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - การกำหนดค่าแชนเนลที่กำหนดไว้ซึ่งขาดนโยบายการตอบกลับที่มองเห็นได้ → `messages.groupChat.visibleReplies: "message_tool"`
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
    - สำหรับแชนเนลที่มี `accounts` แบบตั้งชื่อ แต่ยังมีค่าระดับบนสุดของแชนเนลแบบบัญชีเดียวหลงเหลืออยู่ ให้ย้ายค่าที่ผูกกับบัญชีเหล่านั้นเข้าไปในบัญชีที่โปรโมตซึ่งเลือกไว้สำหรับแชนเนลนั้น (`accounts.default` สำหรับแชนเนลส่วนใหญ่; Matrix สามารถคงเป้าหมายที่ตั้งชื่อไว้/ค่าเริ่มต้นที่มีอยู่และตรงกันได้)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - ลบ `agents.defaults.llm`; ใช้ `models.providers.<id>.timeoutSeconds` สำหรับการหมดเวลาของผู้ให้บริการ/โมเดลที่ช้า
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - ลบ `browser.relayBindHost` (การตั้งค่ารีเลย์ส่วนขยายแบบเดิม)
    - `models.providers.*.api: "openai"` แบบเดิม → `"openai-completions"` (การเริ่มต้น Gateway ยังข้ามผู้ให้บริการที่ตั้งค่า `api` เป็นค่า enum ในอนาคตหรือไม่รู้จัก แทนที่จะล้มเหลวแบบปิด)
    - ลบ `plugins.entries.codex.config.codexDynamicToolsProfile`; เซิร์ฟเวอร์แอป Codex จะคงเครื่องมือเวิร์กสเปซแบบเนทีฟของ Codex ให้เป็นเนทีฟเสมอ

    คำเตือนของ doctor ยังรวมคำแนะนำค่าเริ่มต้นของบัญชีสำหรับแชนเนลหลายบัญชีด้วย:

    - หากกำหนดรายการ `channels.<channel>.accounts` ตั้งแต่สองรายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default` doctor จะเตือนว่าการกำหนดเส้นทางสำรองอาจเลือกบัญชีที่ไม่คาดคิดได้
    - หากตั้งค่า `channels.<channel>.defaultAccount` เป็น ID บัญชีที่ไม่รู้จัก doctor จะเตือนและแสดงรายการ ID บัญชีที่กำหนดค่าไว้

  </Accordion>
  <Accordion title="2b. การแทนที่ผู้ให้บริการ OpenCode">
    หากคุณเพิ่ม `models.providers.opencode`, `opencode-zen` หรือ `opencode-go` ด้วยตนเอง การตั้งค่านั้นจะแทนที่แค็ตตาล็อก OpenCode ในตัวจาก `@mariozechner/pi-ai` ซึ่งอาจบังคับให้โมเดลใช้ API ผิดตัวหรือทำให้ต้นทุนเป็นศูนย์ doctor จะเตือนเพื่อให้คุณลบการแทนที่และกู้คืนการกำหนดเส้นทาง API + ต้นทุนรายโมเดล
  </Accordion>
  <Accordion title="2c. การย้ายข้อมูลเบราว์เซอร์และความพร้อมของ Chrome MCP">
    หากการกำหนดค่าเบราว์เซอร์ของคุณยังชี้ไปที่พาธส่วนขยาย Chrome ที่ถูกลบแล้ว doctor จะปรับให้เป็นโมเดลแนบ Chrome MCP แบบโฮสต์ภายในปัจจุบัน:

    - `browser.profiles.*.driver: "extension"` จะกลายเป็น `"existing-session"`
    - `browser.relayBindHost` จะถูกลบ

    doctor ยังตรวจสอบพาธ Chrome MCP แบบโฮสต์ภายในเมื่อคุณใช้ `defaultProfile: "user"` หรือโปรไฟล์ `existing-session` ที่กำหนดค่าไว้:

    - ตรวจว่า Google Chrome ติดตั้งอยู่บนโฮสต์เดียวกันสำหรับโปรไฟล์เชื่อมต่ออัตโนมัติเริ่มต้นหรือไม่
    - ตรวจเวอร์ชัน Chrome ที่ตรวจพบ และเตือนเมื่อเวอร์ชันต่ำกว่า Chrome 144
    - เตือนให้คุณเปิดใช้การดีบักระยะไกลในหน้า inspect ของเบราว์เซอร์ (เช่น `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` หรือ `edge://inspect/#remote-debugging`)

    doctor ไม่สามารถเปิดใช้การตั้งค่าฝั่ง Chrome ให้คุณได้ Chrome MCP แบบโฮสต์ภายในยังต้องมี:

    - เบราว์เซอร์ที่ใช้ Chromium 144+ บนโฮสต์ Gateway/Node
    - เบราว์เซอร์ทำงานอยู่ในเครื่อง
    - เปิดใช้การดีบักระยะไกลในเบราว์เซอร์นั้น
    - อนุมัติพรอมป์ขอความยินยอมในการแนบครั้งแรกในเบราว์เซอร์

    ความพร้อมตรงนี้เกี่ยวกับข้อกำหนดเบื้องต้นของการแนบภายในเครื่องเท่านั้น Existing-session จะคงขีดจำกัดเส้นทาง Chrome MCP ปัจจุบันไว้; เส้นทางขั้นสูงอย่าง `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และการดำเนินการแบบกลุ่มยังต้องใช้เบราว์เซอร์ที่จัดการหรือโปรไฟล์ CDP ดิบ

    การตรวจนี้**ไม่**ใช้กับ Docker, sandbox, remote-browser หรือโฟลว์ headless อื่น ๆ โฟลว์เหล่านั้นยังคงใช้ CDP ดิบต่อไป

  </Accordion>
  <Accordion title="2d. ข้อกำหนดเบื้องต้นของ OAuth TLS">
    เมื่อกำหนดค่าโปรไฟล์ OpenAI Codex OAuth ไว้ doctor จะตรวจสอบปลายทางการอนุญาตของ OpenAI เพื่อยืนยันว่าสแต็ก TLS ของ Node/OpenSSL ในเครื่องสามารถตรวจสอบเชนใบรับรองได้ หากการตรวจสอบล้มเหลวด้วยข้อผิดพลาดใบรับรอง (เช่น `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ใบรับรองหมดอายุ หรือใบรับรอง self-signed) doctor จะแสดงคำแนะนำการแก้ไขเฉพาะแพลตฟอร์ม บน macOS ที่ใช้ Node จาก Homebrew การแก้มักเป็น `brew postinstall ca-certificates` เมื่อใช้ `--deep` การตรวจสอบจะทำงานแม้ Gateway จะปกติดี
  </Accordion>
  <Accordion title="2e. การแทนที่ผู้ให้บริการ Codex OAuth">
    หากก่อนหน้านี้คุณเพิ่มการตั้งค่าการขนส่ง OpenAI แบบเดิมไว้ใต้ `models.providers.openai-codex` การตั้งค่าเหล่านั้นอาจบดบังพาธผู้ให้บริการ Codex OAuth ในตัวที่รีลีสใหม่ใช้โดยอัตโนมัติ doctor จะเตือนเมื่อพบการตั้งค่าการขนส่งเก่าเหล่านั้นร่วมกับ Codex OAuth เพื่อให้คุณลบหรือเขียนการแทนที่การขนส่งที่ล้าสมัยใหม่ และนำพฤติกรรมการกำหนดเส้นทาง/สำรองในตัวกลับมาใช้ได้ พร็อกซีแบบกำหนดเองและการแทนที่เฉพาะเฮดเดอร์ยังรองรับอยู่และจะไม่ทำให้เกิดคำเตือนนี้
  </Accordion>
  <Accordion title="2f. การซ่อมแซมเส้นทาง Codex">
    doctor ตรวจหา ref โมเดล `openai-codex/*` แบบเดิม การกำหนดเส้นทาง harness ของ Codex แบบเนทีฟใช้ ref โมเดลมาตรฐาน `openai/*`; เทิร์นของเอเจนต์ OpenAI จะผ่าน harness เซิร์ฟเวอร์แอป Codex แทนพาธ OpenClaw PI OpenAI

    ในโหมด `--fix` / `--repair` doctor จะเขียน ref ของเอเจนต์เริ่มต้นและรายเอเจนต์ที่ได้รับผลกระทบใหม่ รวมถึงโมเดลหลัก รายการสำรอง การแทนที่ Heartbeat/subagent/Compaction, hook, การแทนที่โมเดลของแชนเนล และสถานะเส้นทางเซสชันที่คงอยู่ซึ่งล้าสมัย:

    - `openai-codex/gpt-*` จะกลายเป็น `openai/gpt-*`
    - เจตนา Codex จะย้ายไปยังรายการ `agentRuntime.id: "codex"` ที่ผูกกับผู้ให้บริการ/โมเดลสำหรับ ref โมเดลเอเจนต์ที่ซ่อมแซมแล้ว เพื่อให้ยังเลือกโปรไฟล์ auth `openai-codex:...` ได้หลังจาก ref โมเดลกลายเป็น `openai/*`
    - การกำหนดค่า runtime ของทั้งเอเจนต์ที่ล้าสมัยและ pin runtime ของเซสชันที่คงอยู่จะถูกลบ เพราะการเลือก runtime ผูกกับผู้ให้บริการ/โมเดล
    - นโยบาย runtime ของผู้ให้บริการ/โมเดลที่มีอยู่จะถูกคงไว้ เว้นแต่ ref โมเดลเดิมที่ซ่อมแซมต้องใช้การกำหนดเส้นทาง Codex เพื่อคงพาธ auth เดิมไว้
    - รายการ fallback ของโมเดลที่มีอยู่จะถูกคงไว้พร้อมเขียนรายการเดิมใหม่; การตั้งค่ารายโมเดลที่คัดลอกมาจะย้ายจากคีย์เดิมไปยังคีย์มาตรฐาน `openai/*`
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, ข้อความแจ้ง fallback และ pin โปรไฟล์ auth ของเซสชันที่คงอยู่จะถูกซ่อมแซมในที่เก็บเซสชันเอเจนต์ทั้งหมดที่ค้นพบ
    - `/codex ...` หมายถึง "ควบคุมหรือผูกการสนทนา Codex แบบเนทีฟจากแชต"
    - `/acp ...` หรือ `runtime: "acp"` หมายถึง "ใช้อะแดปเตอร์ ACP/acpx ภายนอก"

  </Accordion>
  <Accordion title="2g. การล้างข้อมูลเส้นทางเซสชัน">
    doctor ยังสแกนที่เก็บเซสชันเอเจนต์ที่ค้นพบเพื่อหาสถานะเส้นทางที่สร้างอัตโนมัติและล้าสมัย หลังจากคุณย้ายโมเดลหรือ runtime ที่กำหนดค่าไว้ออกจากเส้นทางที่ Plugin เป็นเจ้าของ เช่น Codex

    `openclaw doctor --fix` สามารถล้างสถานะล้าสมัยที่สร้างอัตโนมัติ เช่น pin โมเดล `modelOverrideSource: "auto"`, เมตาดาต้าโมเดล runtime, ID harness ที่ถูก pin, การผูกเซสชัน CLI และการแทนที่โปรไฟล์ auth อัตโนมัติ เมื่อเส้นทางเจ้าของไม่ได้ถูกกำหนดค่าอีกต่อไป ตัวเลือกโมเดลของผู้ใช้แบบระบุชัดหรือเซสชันเดิมจะถูกรายงานให้ตรวจสอบด้วยตนเองและไม่ถูกแตะต้อง; ให้เปลี่ยนด้วย `/model ...`, `/new` หรือรีเซ็ตเซสชันเมื่อไม่ต้องการเส้นทางนั้นอีกต่อไป

  </Accordion>
  <Accordion title="3. การย้ายข้อมูลสถานะเดิม (เลย์เอาต์ดิสก์)">
    doctor สามารถย้ายเลย์เอาต์บนดิสก์รุ่นเก่าเข้าสู่โครงสร้างปัจจุบันได้:

    - ที่เก็บเซสชัน + ทรานสคริปต์:
      - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
    - ไดเรกทอรีเอเจนต์:
      - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
    - สถานะ auth ของ WhatsApp (Baileys):
      - จาก `~/.openclaw/credentials/*.json` แบบเดิม (ยกเว้น `oauth.json`)
      - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID บัญชีเริ่มต้น: `default`)

    การย้ายข้อมูลเหล่านี้เป็นแบบพยายามให้ดีที่สุดและทำซ้ำได้อย่างปลอดภัย; doctor จะส่งคำเตือนเมื่อปล่อยโฟลเดอร์เดิมบางส่วนไว้เป็นข้อมูลสำรอง Gateway/CLI ยังย้ายเซสชัน + ไดเรกทอรีเอเจนต์แบบเดิมโดยอัตโนมัติเมื่อเริ่มต้น เพื่อให้ประวัติ/auth/โมเดลไปอยู่ในพาธรายเอเจนต์โดยไม่ต้องรัน doctor ด้วยตนเอง การย้าย auth ของ WhatsApp ตั้งใจให้ทำผ่าน `openclaw doctor` เท่านั้น การปรับให้ provider/provider-map ของ Talk เป็นรูปแบบปกติตอนนี้เปรียบเทียบด้วยความเท่ากันเชิงโครงสร้าง ดังนั้น diff ที่ต่างเฉพาะลำดับคีย์จะไม่ทำให้เกิดการเปลี่ยนแปลง `doctor --fix` แบบไม่มีผลซ้ำอีก

  </Accordion>
  <Accordion title="3a. การย้ายข้อมูล manifest ของ Plugin แบบเดิม">
    doctor สแกน manifest ของ Plugin ที่ติดตั้งทั้งหมดเพื่อหาคีย์ capability ระดับบนสุดที่เลิกใช้แล้ว (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) เมื่อพบ จะเสนอให้ย้ายคีย์เหล่านั้นเข้าไปในออบเจ็กต์ `contracts` และเขียนไฟล์ manifest ใหม่ในตำแหน่งเดิม การย้ายนี้ทำซ้ำได้อย่างปลอดภัย; หากคีย์ `contracts` มีค่าเดียวกันอยู่แล้ว คีย์เดิมจะถูกลบโดยไม่ทำซ้ำข้อมูล
  </Accordion>
  <Accordion title="3b. การย้ายข้อมูลที่เก็บ cron แบบเดิม">
    doctor ยังตรวจที่เก็บงาน cron (`~/.openclaw/cron/jobs.json` โดยค่าเริ่มต้น หรือ `cron.store` เมื่อถูกแทนที่) เพื่อหารูปแบบงานเก่าที่ยังถูก scheduler ยอมรับเพื่อความเข้ากันได้

    การล้างข้อมูล cron ปัจจุบันรวมถึง:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - ฟิลด์ payload ระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
    - ฟิลด์การส่งระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - นามแฝงการส่ง payload `provider` → `delivery.channel` แบบชัดเจน
    - งาน fallback webhook แบบ legacy อย่างง่าย `notify: true` → `delivery.mode="webhook"` แบบชัดเจนพร้อม `delivery.to=cron.webhook`

    Doctor จะย้ายข้อมูล `notify: true` jobs อัตโนมัติเฉพาะเมื่อทำได้โดยไม่เปลี่ยนพฤติกรรมเท่านั้น หาก job รวม legacy notify fallback เข้ากับ delivery mode ที่ไม่ใช่ webhook ซึ่งมีอยู่แล้ว doctor จะแจ้งเตือนและปล่อย job นั้นไว้ให้ตรวจสอบด้วยตนเอง

    บน Linux doctor จะแจ้งเตือนด้วยเมื่อ crontab ของผู้ใช้ยังเรียกใช้ legacy `~/.openclaw/bin/ensure-whatsapp.sh` สคริปต์เฉพาะโฮสต์นี้ไม่ได้รับการดูแลโดย OpenClaw ปัจจุบัน และอาจเขียนข้อความ `Gateway inactive` ที่ผิดพลาดไปยัง `~/.openclaw/logs/whatsapp-health.log` เมื่อ cron เข้าถึง systemd user bus ไม่ได้ ลบรายการ crontab ที่ค้างอยู่ด้วย `crontab -e`; ใช้ `openclaw channels status --probe`, `openclaw doctor`, และ `openclaw gateway status` สำหรับการตรวจสอบสุขภาพปัจจุบัน

  </Accordion>
  <Accordion title="3c. การล้าง session lock">
    Doctor จะสแกนทุกไดเรกทอรี session ของ agent เพื่อหาไฟล์ write-lock ที่ค้างอยู่ — ไฟล์ที่เหลือไว้เมื่อ session ออกจากระบบอย่างผิดปกติ สำหรับแต่ละ lock file ที่พบ จะรายงาน: path, PID, PID ยังทำงานอยู่หรือไม่, อายุของ lock, และถือว่าค้างหรือไม่ (PID ตายแล้ว, เก่ากว่า 30 นาที, หรือ PID ที่ยังทำงานอยู่ซึ่งพิสูจน์ได้ว่าเป็นของ process ที่ไม่ใช่ OpenClaw) ในโหมด `--fix` / `--repair` จะลบ lock files ที่ค้างโดยอัตโนมัติ มิฉะนั้นจะพิมพ์หมายเหตุและแนะนำให้คุณรันซ้ำด้วย `--fix`
  </Accordion>
  <Accordion title="3d. การซ่อมแซม branch ของ transcript session">
    Doctor จะสแกนไฟล์ JSONL ของ session agent เพื่อหารูปแบบ branch ซ้ำที่สร้างโดยบั๊กการเขียน prompt transcript ใหม่ของ 2026.4.24: user turn ที่ถูกทิ้งพร้อมบริบท runtime ภายในของ OpenClaw และ sibling ที่ยัง active ซึ่งมี prompt ผู้ใช้ที่มองเห็นได้เหมือนกัน ในโหมด `--fix` / `--repair` doctor จะสำรองไฟล์ที่ได้รับผลกระทบแต่ละไฟล์ไว้ข้างไฟล์ต้นฉบับ แล้วเขียน transcript ใหม่ไปยัง branch ที่ active เพื่อให้ประวัติ Gateway และตัวอ่าน memory ไม่เห็น turns ซ้ำอีกต่อไป
  </Accordion>
  <Accordion title="4. การตรวจสอบความสมบูรณ์ของ state (การคงอยู่ของ session, routing, และความปลอดภัย)">
    ไดเรกทอรี state คือแกนการทำงาน หากหายไป คุณจะสูญเสีย sessions, credentials, logs, และ config (เว้นแต่คุณมีข้อมูลสำรองไว้ที่อื่น)

    Doctor ตรวจสอบ:

    - **State dir missing**: แจ้งเตือนเกี่ยวกับการสูญเสีย state อย่างร้ายแรง, แจ้งให้สร้างไดเรกทอรีใหม่, และเตือนว่ากู้คืนข้อมูลที่หายไปไม่ได้
    - **State dir permissions**: ตรวจสอบว่าสามารถเขียนได้; เสนอให้ซ่อมแซม permissions (และแสดงคำแนะนำ `chown` เมื่อตรวจพบ owner/group ไม่ตรงกัน)
    - **macOS cloud-synced state dir**: แจ้งเตือนเมื่อ state resolve อยู่ใต้ iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ `~/Library/CloudStorage/...` เพราะ path ที่หนุนด้วย sync อาจทำให้ I/O ช้าลงและเกิด lock/sync races
    - **Linux SD or eMMC state dir**: แจ้งเตือนเมื่อ state resolve ไปยัง mount source แบบ `mmcblk*` เพราะ random I/O ที่หนุนด้วย SD หรือ eMMC อาจช้ากว่าและสึกหรอเร็วกว่าเมื่อมีการเขียน session และ credential
    - **Session dirs missing**: ต้องมี `sessions/` และไดเรกทอรี session store เพื่อคงประวัติไว้และหลีกเลี่ยง crash แบบ `ENOENT`
    - **Transcript mismatch**: แจ้งเตือนเมื่อรายการ session ล่าสุดไม่มีไฟล์ transcript
    - **Main session "1-line JSONL"**: ชี้สถานะเมื่อ transcript หลักมีเพียงหนึ่งบรรทัด (ประวัติไม่ได้สะสม)
    - **Multiple state dirs**: แจ้งเตือนเมื่อมีโฟลเดอร์ `~/.openclaw` หลายโฟลเดอร์อยู่ข้าม home directories หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (ประวัติอาจถูกแบ่งระหว่างการติดตั้ง)
    - **Remote mode reminder**: หาก `gateway.mode=remote` doctor จะเตือนให้คุณรันบน remote host (state อยู่ที่นั่น)
    - **Config file permissions**: แจ้งเตือนหาก `~/.openclaw/openclaw.json` อ่านได้โดย group/world และเสนอให้จำกัดเป็น `600`

  </Accordion>
  <Accordion title="5. สุขภาพการยืนยันตัวตนของโมเดล (OAuth หมดอายุ)">
    Doctor ตรวจสอบ OAuth profiles ใน auth store, แจ้งเตือนเมื่อ tokens กำลังจะหมดอายุ/หมดอายุแล้ว, และสามารถ refresh ได้เมื่อปลอดภัย หาก Anthropic OAuth/token profile ค้างเก่า จะแนะนำ Anthropic API key หรือ path setup-token ของ Anthropic prompt สำหรับ refresh จะแสดงเฉพาะเมื่อรันแบบ interactive (TTY); `--non-interactive` จะข้ามความพยายาม refresh

    เมื่อ OAuth refresh ล้มเหลวถาวร (เช่น `refresh_token_reused`, `invalid_grant`, หรือ provider แจ้งให้ลงชื่อเข้าใช้อีกครั้ง) doctor จะรายงานว่าต้อง re-auth และพิมพ์คำสั่ง `openclaw models auth login --provider ...` ที่ต้องรันแบบตรงตัว

    Doctor ยังรายงาน auth profiles ที่ใช้งานไม่ได้ชั่วคราวเนื่องจาก:

    - cooldown สั้น ๆ (rate limits/timeouts/auth failures)
    - การปิดใช้งานที่นานกว่า (billing/credit failures)

  </Accordion>
  <Accordion title="6. การตรวจสอบความถูกต้องของโมเดล hooks">
    หากตั้งค่า `hooks.gmail.model` ไว้ doctor จะตรวจสอบ model reference กับ catalog และ allowlist และแจ้งเตือนเมื่อ resolve ไม่ได้หรือไม่ได้รับอนุญาต
  </Accordion>
  <Accordion title="7. การซ่อมแซม image ของ sandbox">
    เมื่อเปิดใช้ sandboxing doctor จะตรวจสอบ Docker images และเสนอให้ build หรือสลับไปใช้ชื่อ legacy หาก image ปัจจุบันหายไป
  </Accordion>
  <Accordion title="7b. การล้างการติดตั้ง Plugin">
    Doctor จะลบ state staging ของ dependency Plugin แบบ legacy ที่ OpenClaw สร้างขึ้นในโหมด `openclaw doctor --fix` / `openclaw doctor --repair` ซึ่งครอบคลุม roots ของ dependency ที่สร้างไว้และค้าง, ไดเรกทอรี install-stage เก่า, debris ระดับ package จากโค้ดซ่อม dependency ของ bundled-plugin รุ่นก่อน, และสำเนา npm ที่ managed ของ bundled `@openclaw/*` plugins ที่ orphaned หรือ recovered ซึ่งอาจ shadow manifest แบบ bundled ปัจจุบัน

    Doctor ยังสามารถติดตั้ง downloadable plugins ที่หายไปใหม่เมื่อ config อ้างถึงแต่ local plugin registry หาไม่พบ ตัวอย่างรวมถึง `plugins.entries` ที่เป็น material, การตั้งค่า channel/provider/search ที่กำหนดไว้, และ agent runtimes ที่กำหนดไว้ ระหว่าง package updates doctor จะหลีกเลี่ยงการรันการซ่อม Plugin ผ่าน package-manager ขณะที่ core package กำลังถูกสลับ; รัน `openclaw doctor --fix` อีกครั้งหลัง update หาก Plugin ที่กำหนดค่าไว้ยังต้องกู้คืน การเริ่ม Gateway และการโหลด config ใหม่จะไม่รัน package managers; การติดตั้ง Plugin ยังคงเป็นงาน doctor/install/update แบบ explicit

  </Accordion>
  <Accordion title="8. การย้ายข้อมูล service ของ Gateway และคำแนะนำการล้าง">
    Doctor ตรวจจับ legacy gateway services (launchd/systemd/schtasks) และเสนอให้ลบออกและติดตั้ง service ของ OpenClaw โดยใช้ gateway port ปัจจุบัน นอกจากนี้ยังสแกนหา services เพิ่มเติมที่คล้าย gateway และพิมพ์คำแนะนำการล้างได้ OpenClaw gateway services ที่ตั้งชื่อตาม profile ถือเป็น first-class และจะไม่ถูกชี้สถานะว่าเป็น "extra"

    บน Linux หาก user-level gateway service หายไปแต่มี system-level OpenClaw gateway service อยู่ doctor จะไม่ติดตั้ง user-level service ตัวที่สองโดยอัตโนมัติ ตรวจสอบด้วย `openclaw gateway status --deep` หรือ `openclaw doctor --deep` จากนั้นลบตัวซ้ำหรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ system supervisor เป็นเจ้าของ lifecycle ของ gateway

  </Accordion>
  <Accordion title="8b. การย้ายข้อมูล Startup Matrix">
    เมื่อบัญชี channel ของ Matrix มี legacy state migration ที่ pending หรือ actionable doctor (ในโหมด `--fix` / `--repair`) จะสร้าง snapshot ก่อน migration แล้วรันขั้นตอน migration แบบ best-effort: legacy Matrix state migration และ legacy encrypted-state preparation ทั้งสองขั้นตอนไม่เป็น fatal; errors จะถูก logged และ startup จะดำเนินต่อไป ในโหมด read-only (`openclaw doctor` ที่ไม่มี `--fix`) การตรวจสอบนี้จะถูกข้ามทั้งหมด
  </Accordion>
  <Accordion title="8c. การจับคู่อุปกรณ์และ auth drift">
    ตอนนี้ Doctor ตรวจสอบ state การจับคู่อุปกรณ์เป็นส่วนหนึ่งของ health pass ปกติ

    สิ่งที่รายงาน:

    - คำขอจับคู่ครั้งแรกที่ pending
    - role upgrades ที่ pending สำหรับอุปกรณ์ที่จับคู่แล้ว
    - scope upgrades ที่ pending สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การซ่อม public-key mismatch ที่ device id ยังตรงกันแต่ device identity ไม่ตรงกับ record ที่อนุมัติแล้วอีกต่อไป
    - paired records ที่ไม่มี token ที่ active สำหรับ role ที่อนุมัติแล้ว
    - paired tokens ที่ scopes drift ออกนอก baseline การจับคู่ที่อนุมัติแล้ว
    - รายการ device-token ใน cache ภายในเครื่องสำหรับเครื่องปัจจุบันที่เก่ากว่า token rotation ฝั่ง gateway หรือมี metadata ของ scope ที่ค้างเก่า

    Doctor จะไม่ auto-approve pair requests หรือ auto-rotate device tokens แต่จะพิมพ์ขั้นตอนถัดไปแบบตรงตัวแทน:

    - ตรวจสอบ pending requests ด้วย `openclaw devices list`
    - อนุมัติ request แบบตรงตัวด้วย `openclaw devices approve <requestId>`
    - rotate token ใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
    - ลบและ approve record ที่ค้างเก่าใหม่ด้วย `openclaw devices remove <deviceId>`

    สิ่งนี้ปิดช่องโหว่ทั่วไปแบบ "จับคู่แล้วแต่ยังได้รับ pairing required": ตอนนี้ doctor แยก first-time pairing ออกจาก role/scope upgrades ที่ pending และจาก stale token/device-identity drift

  </Accordion>
  <Accordion title="9. คำเตือนด้านความปลอดภัย">
    Doctor แสดงคำเตือนเมื่อ provider เปิดรับ DMs โดยไม่มี allowlist หรือเมื่อ policy ถูกตั้งค่าในลักษณะที่อันตราย
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    หากรันเป็น systemd user service doctor จะตรวจสอบให้เปิดใช้ lingering เพื่อให้ gateway ยังทำงานอยู่หลัง logout
  </Accordion>
  <Accordion title="11. สถานะ workspace (skills, plugins, และ legacy dirs)">
    Doctor พิมพ์สรุป state ของ workspace สำหรับ agent เริ่มต้น:

    - **Skills status**: นับ Skills ที่ eligible, missing-requirements, และ allowlist-blocked
    - **Legacy workspace dirs**: แจ้งเตือนเมื่อมี `~/openclaw` หรือไดเรกทอรี workspace แบบ legacy อื่นอยู่ข้าง workspace ปัจจุบัน
    - **Plugin status**: นับ plugins ที่ enabled/disabled/errored; แสดงรายการ plugin IDs สำหรับ errors ใด ๆ; รายงาน capabilities ของ bundle plugin
    - **Plugin compatibility warnings**: ชี้สถานะ plugins ที่มีปัญหา compatibility กับ runtime ปัจจุบัน
    - **Plugin diagnostics**: แสดง warnings หรือ errors ตอน load-time ที่ plugin registry ปล่อยออกมา

  </Accordion>
  <Accordion title="11b. ขนาดไฟล์ bootstrap">
    Doctor ตรวจสอบว่าไฟล์ bootstrap ของ workspace (เช่น `AGENTS.md`, `CLAUDE.md`, หรือไฟล์ context ที่ injected อื่น ๆ) อยู่ใกล้หรือเกิน character budget ที่กำหนดไว้หรือไม่ โดยรายงานจำนวนอักขระ raw เทียบกับ injected รายไฟล์, เปอร์เซ็นต์การตัดทอน, สาเหตุการตัดทอน (`max/file` หรือ `max/total`), และจำนวนอักขระ injected ทั้งหมดเป็นสัดส่วนของ budget ทั้งหมด เมื่อไฟล์ถูกตัดทอนหรือใกล้ถึงขีดจำกัด doctor จะพิมพ์เคล็ดลับสำหรับปรับ `agents.defaults.bootstrapMaxChars` และ `agents.defaults.bootstrapTotalMaxChars`
  </Accordion>
  <Accordion title="11d. การล้าง Plugin ของ channel ที่ค้างเก่า">
    เมื่อ `openclaw doctor --fix` ลบ Plugin ของ channel ที่หายไป จะลบ config ขอบเขต channel ที่ dangling ซึ่งอ้างถึง Plugin นั้นด้วย: รายการ `channels.<id>`, heartbeat targets ที่ตั้งชื่อ channel, และ overrides `agents.*.models["<channel>/*"]` สิ่งนี้ป้องกัน Gateway boot loops ที่ channel runtime หายไปแล้วแต่ config ยังขอให้ gateway bind เข้ากับมัน
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor ตรวจสอบว่ามีการติดตั้ง tab completion สำหรับ shell ปัจจุบันหรือไม่ (zsh, bash, fish, หรือ PowerShell):

    - หาก shell profile ใช้รูปแบบ dynamic completion ที่ช้า (`source <(openclaw completion ...)`) doctor จะ upgrade เป็น variant ไฟล์ cache ที่เร็วกว่า
    - หากกำหนดค่า completion ไว้ใน profile แต่ cache file หายไป doctor จะ regenerate cache โดยอัตโนมัติ
    - หากไม่ได้กำหนดค่า completion เลย doctor จะแจ้งให้ติดตั้ง (เฉพาะโหมด interactive; ข้ามด้วย `--non-interactive`)

    รัน `openclaw completion --write-state` เพื่อ regenerate cache ด้วยตนเอง

  </Accordion>
  <Accordion title="12. การตรวจสอบการยืนยันตัวตนของ Gateway (โทเค็นในเครื่อง)">
    Doctor ตรวจสอบความพร้อมของการยืนยันตัวตนด้วยโทเค็น Gateway ภายในเครื่อง

    - หากโหมดโทเค็นต้องใช้โทเค็นและไม่มีแหล่งโทเค็นอยู่ doctor จะเสนอให้สร้างขึ้น
    - หาก `gateway.auth.token` จัดการด้วย SecretRef แต่ใช้งานไม่ได้ doctor จะเตือนและจะไม่เขียนทับด้วยข้อความธรรมดา
    - `openclaw doctor --generate-gateway-token` บังคับให้สร้างเฉพาะเมื่อไม่ได้กำหนด SecretRef ของโทเค็นไว้

  </Accordion>
  <Accordion title="12b. การซ่อมแซมแบบอ่านอย่างเดียวที่รับรู้ SecretRef">
    โฟลว์การซ่อมแซมบางรายการต้องตรวจสอบข้อมูลประจำตัวที่กำหนดค่าไว้โดยไม่ทำให้พฤติกรรม fail-fast ขณะรันไทม์อ่อนลง

    - ตอนนี้ `openclaw doctor --fix` ใช้โมเดลสรุป SecretRef แบบอ่านอย่างเดียวเดียวกับคำสั่งกลุ่มสถานะสำหรับการซ่อมแซมการกำหนดค่าแบบเจาะจง
    - ตัวอย่าง: การซ่อมแซม Telegram `allowFrom` / `groupAllowFrom` `@username` จะพยายามใช้ข้อมูลประจำตัวของบอตที่กำหนดค่าไว้เมื่อมี
    - หากโทเค็นบอต Telegram ถูกกำหนดค่าผ่าน SecretRef แต่ใช้งานไม่ได้ในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานว่าข้อมูลประจำตัวถูกกำหนดค่าไว้แต่ใช้งานไม่ได้ และข้ามการแก้ค่าอัตโนมัติแทนที่จะหยุดทำงานหรือรายงานผิดว่าโทเค็นหายไป

  </Accordion>
  <Accordion title="13. การตรวจสอบสุขภาพ Gateway + รีสตาร์ต">
    Doctor รันการตรวจสอบสุขภาพและเสนอให้รีสตาร์ต Gateway เมื่อดูเหมือนไม่สมบูรณ์
  </Accordion>
  <Accordion title="13b. ความพร้อมของการค้นหาหน่วยความจำ">
    Doctor ตรวจสอบว่าผู้ให้บริการ embedding สำหรับการค้นหาหน่วยความจำที่กำหนดค่าไว้พร้อมสำหรับเอเจนต์เริ่มต้นหรือไม่ พฤติกรรมขึ้นอยู่กับแบ็กเอนด์และผู้ให้บริการที่กำหนดค่าไว้:

    - **แบ็กเอนด์ QMD**: ตรวจสอบว่าไบนารี `qmd` พร้อมใช้งานและเริ่มทำงานได้หรือไม่ หากไม่พร้อม จะแสดงคำแนะนำการแก้ไข รวมถึงแพ็กเกจ npm และตัวเลือกพาธไบนารีแบบกำหนดเอง
    - **ผู้ให้บริการภายในเครื่องที่ระบุชัดเจน**: ตรวจสอบไฟล์โมเดลภายในเครื่องหรือ URL โมเดลระยะไกล/ที่ดาวน์โหลดได้ซึ่งเป็นที่รู้จัก หากไม่พบ จะแนะนำให้สลับไปใช้ผู้ให้บริการระยะไกล
    - **ผู้ให้บริการระยะไกลที่ระบุชัดเจน** (`openai`, `voyage` ฯลฯ): ตรวจสอบว่ามีคีย์ API อยู่ในสภาพแวดล้อมหรือที่เก็บข้อมูลยืนยันตัวตน แสดงคำแนะนำการแก้ไขที่นำไปใช้ได้หากไม่มี
    - **ผู้ให้บริการอัตโนมัติ**: ตรวจสอบความพร้อมของโมเดลภายในเครื่องก่อน จากนั้นลองผู้ให้บริการระยะไกลแต่ละรายตามลำดับการเลือกอัตโนมัติ

    เมื่อมีผลการตรวจสอบ Gateway จากแคช (Gateway มีสุขภาพดีในเวลาที่ตรวจสอบ) doctor จะอ้างอิงผลนั้นร่วมกับการกำหนดค่าที่ CLI มองเห็น และระบุความคลาดเคลื่อนใด ๆ Doctor จะไม่เริ่ม ping embedding ใหม่บนเส้นทางเริ่มต้น ใช้คำสั่งสถานะหน่วยความจำเชิงลึกเมื่อคุณต้องการตรวจสอบผู้ให้บริการแบบสด

    ใช้ `openclaw memory status --deep` เพื่อตรวจสอบความพร้อมของ embedding ขณะรันไทม์

  </Accordion>
  <Accordion title="14. คำเตือนสถานะช่องทาง">
    หาก Gateway มีสุขภาพดี doctor จะรันการตรวจสอบสถานะช่องทางและรายงานคำเตือนพร้อมคำแนะนำการแก้ไข
  </Accordion>
  <Accordion title="15. การตรวจสอบ + ซ่อมแซมการกำหนดค่า supervisor">
    Doctor ตรวจสอบการกำหนดค่า supervisor ที่ติดตั้งไว้ (launchd/systemd/schtasks) เพื่อหาค่าเริ่มต้นที่หายไปหรือล้าสมัย (เช่น dependency ของ systemd network-online และเวลาหน่วงการรีสตาร์ต) เมื่อพบรายการที่ไม่ตรงกัน ระบบจะแนะนำให้อัปเดตและสามารถเขียนไฟล์บริการ/งานใหม่เป็นค่าเริ่มต้นปัจจุบันได้

    หมายเหตุ:

    - `openclaw doctor` จะแจ้งก่อนเขียนการกำหนดค่า supervisor ใหม่
    - `openclaw doctor --yes` ยอมรับพรอมป์ซ่อมแซมเริ่มต้น
    - `openclaw doctor --repair` ใช้การแก้ไขที่แนะนำโดยไม่แสดงพรอมป์
    - `openclaw doctor --repair --force` เขียนทับการกำหนดค่า supervisor แบบกำหนดเอง
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` ทำให้ doctor เป็นแบบอ่านอย่างเดียวสำหรับวงจรชีวิตบริการ Gateway โดยยังคงรายงานสุขภาพบริการและรันการซ่อมแซมที่ไม่ใช่บริการ แต่ข้ามการติดตั้ง/เริ่ม/รีสตาร์ต/บูตสแตรปบริการ การเขียนการกำหนดค่า supervisor ใหม่ และการล้างบริการดั้งเดิม เพราะ supervisor ภายนอกเป็นเจ้าของวงจรชีวิตนั้น
    - บน Linux doctor จะไม่เขียนเมทาดาทาของคำสั่ง/entrypoint ใหม่ในขณะที่ยูนิต systemd ของ Gateway ที่ตรงกันยังทำงานอยู่ และยังละเว้นยูนิตคล้าย Gateway เพิ่มเติมที่ไม่ใช่ของดั้งเดิมและไม่ได้ใช้งานระหว่างการสแกนบริการซ้ำ เพื่อไม่ให้ไฟล์บริการประกอบสร้างเสียงรบกวนในการล้างข้อมูล
    - หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็นและ `gateway.auth.token` จัดการด้วย SecretRef การติดตั้ง/ซ่อมแซมบริการของ doctor จะตรวจสอบ SecretRef แต่จะไม่คงค่าข้อความธรรมดาของโทเค็นที่แก้ค่าแล้วไว้ในเมทาดาทาสภาพแวดล้อมของบริการ supervisor
    - Doctor ตรวจพบค่าสภาพแวดล้อมบริการที่จัดการด้วย `.env`/SecretRef ซึ่งการติดตั้ง LaunchAgent, systemd หรือ Windows Scheduled Task รุ่นเก่าเคยฝังไว้แบบ inline และเขียนเมทาดาทาบริการใหม่เพื่อให้ค่าเหล่านั้นโหลดจากแหล่งรันไทม์แทนการกำหนดของ supervisor
    - Doctor ตรวจพบเมื่อคำสั่งบริการยังตรึง `--port` เก่าไว้หลังจาก `gateway.port` เปลี่ยน และเขียนเมทาดาทาบริการใหม่เป็นพอร์ตปัจจุบัน
    - หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็นและ SecretRef ของโทเค็นที่กำหนดค่าไว้ยังไม่ถูกแก้ค่า doctor จะบล็อกเส้นทางติดตั้ง/ซ่อมแซมพร้อมคำแนะนำที่นำไปใช้ได้
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้งค่าโหมดอย่างชัดเจน
    - สำหรับยูนิต user-systemd ของ Linux ตอนนี้การตรวจสอบ token drift ของ doctor รวมทั้งแหล่ง `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบเมทาดาทาการยืนยันตัวตนของบริการ
    - การซ่อมแซมบริการของ Doctor ปฏิเสธที่จะเขียนใหม่ หยุด หรือรีสตาร์ตบริการ Gateway จากไบนารี OpenClaw รุ่นเก่าเมื่อการกำหนดค่าถูกเขียนล่าสุดโดยเวอร์ชันที่ใหม่กว่า ดู [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)
    - คุณสามารถบังคับให้เขียนใหม่ทั้งหมดได้เสมอผ่าน `openclaw gateway install --force`

  </Accordion>
  <Accordion title="16. การวินิจฉัยรันไทม์ + พอร์ตของ Gateway">
    Doctor ตรวจสอบรันไทม์ของบริการ (PID, สถานะออกล่าสุด) และเตือนเมื่อบริการติดตั้งแล้วแต่ไม่ได้ทำงานจริง นอกจากนี้ยังตรวจสอบการชนกันของพอร์ตบนพอร์ต Gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (Gateway ทำงานอยู่แล้ว, ทันเนล SSH)
  </Accordion>
  <Accordion title="17. แนวทางปฏิบัติที่ดีสำหรับรันไทม์ Gateway">
    Doctor เตือนเมื่อบริการ Gateway ทำงานบน Bun หรือพาธ Node ที่จัดการด้วยเวอร์ชัน (`nvm`, `fnm`, `volta`, `asdf` ฯลฯ) ช่องทาง WhatsApp + Telegram ต้องใช้ Node และพาธของตัวจัดการเวอร์ชันอาจเสียหลังการอัปเกรด เพราะบริการไม่ได้โหลด shell init ของคุณ Doctor เสนอให้ย้ายไปใช้การติดตั้ง Node ของระบบเมื่อมี (Homebrew/apt/choco)

    LaunchAgents ของ macOS ที่ติดตั้งหรือซ่อมแซมใหม่ใช้ PATH ระบบแบบมาตรฐาน (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) แทนการคัดลอก PATH ของเชลล์แบบโต้ตอบ ดังนั้นไบนารีระบบที่จัดการโดย Homebrew ยังคงพร้อมใช้งาน ขณะที่ Volta, asdf, fnm, pnpm และไดเรกทอรีตัวจัดการเวอร์ชันอื่น ๆ จะไม่เปลี่ยนว่าโปรเซสลูกของ Node แก้ค่าเป็นอะไร บริการ Linux ยังคงเก็บรากสภาพแวดล้อมที่ระบุชัดเจน (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) และไดเรกทอรี user-bin ที่เสถียร แต่ไดเรกทอรี fallback ของตัวจัดการเวอร์ชันที่คาดเดาจะถูกเขียนลงใน PATH ของบริการเฉพาะเมื่อไดเรกทอรีเหล่านั้นมีอยู่บนดิสก์

  </Accordion>
  <Accordion title="18. การเขียนการกำหนดค่า + เมทาดาทา wizard">
    Doctor คงการเปลี่ยนแปลงการกำหนดค่าใด ๆ และประทับเมทาดาทา wizard เพื่อบันทึกการรัน doctor
  </Accordion>
  <Accordion title="19. เคล็ดลับพื้นที่ทำงาน (การสำรองข้อมูล + ระบบหน่วยความจำ)">
    Doctor แนะนำระบบหน่วยความจำของพื้นที่ทำงานเมื่อไม่มี และแสดงเคล็ดลับการสำรองข้อมูลหากพื้นที่ทำงานยังไม่ได้อยู่ภายใต้ git

    ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคู่มือฉบับเต็มเกี่ยวกับโครงสร้างพื้นที่ทำงานและการสำรองข้อมูลด้วย git (แนะนำ GitHub หรือ GitLab แบบส่วนตัว)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
