---
read_when:
    - การเพิ่มหรือแก้ไขไมเกรชันของ doctor
    - การนำการเปลี่ยนแปลงการกำหนดค่าที่ไม่เข้ากันย้อนหลังมาใช้
sidebarTitle: Doctor
summary: 'คำสั่ง doctor: การตรวจสอบสถานภาพ การย้ายข้อมูลการกำหนดค่า และขั้นตอนการซ่อมแซม'
title: ตัวตรวจสุขภาพ
x-i18n:
    generated_at: "2026-05-04T09:37:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bc8615f5e49e8c20785a9dc9779c447fd0d5794c80663d2396b0a20b4187798
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` คือเครื่องมือซ่อมแซม + ย้ายข้อมูลสำหรับ OpenClaw ใช้แก้ไข config/สถานะที่ล้าสมัย ตรวจสอบสุขภาพ และให้ขั้นตอนการซ่อมแซมที่นำไปทำได้จริง

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

    ยอมรับค่าเริ่มต้นโดยไม่ถามยืนยัน (รวมถึงขั้นตอนซ่อมแซมการรีสตาร์ท/บริการ/sandbox เมื่อเกี่ยวข้อง)

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    ใช้การซ่อมแซมที่แนะนำโดยไม่ถามยืนยัน (ซ่อมแซม + รีสตาร์ทเมื่อปลอดภัย)

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

    รันโดยไม่มีพรอมป์และใช้เฉพาะการย้ายข้อมูลที่ปลอดภัย (การปรับ config ให้เป็นมาตรฐาน + การย้ายสถานะบนดิสก์) ข้ามการดำเนินการรีสตาร์ท/บริการ/sandbox ที่ต้องให้มนุษย์ยืนยัน การย้ายสถานะเดิมจะรันโดยอัตโนมัติเมื่อตรวจพบ

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    สแกนบริการระบบเพื่อตรวจหาการติดตั้ง Gateway เพิ่มเติม (launchd/systemd/schtasks)

  </Tab>
</Tabs>

หากคุณต้องการตรวจทานการเปลี่ยนแปลงก่อนเขียน ให้เปิดไฟล์ config ก่อน:

```bash
cat ~/.openclaw/openclaw.json
```

## สิ่งที่เครื่องมือนี้ทำ (สรุป)

<AccordionGroup>
  <Accordion title="สุขภาพ, UI และการอัปเดต">
    - การอัปเดตก่อนเริ่มแบบเลือกได้สำหรับการติดตั้งจาก git (เฉพาะแบบโต้ตอบ)
    - การตรวจสอบความสดใหม่ของโปรโตคอล UI (สร้าง Control UI ใหม่เมื่อ schema โปรโตคอลใหม่กว่า)
    - การตรวจสุขภาพ + พรอมป์รีสตาร์ท
    - สรุปสถานะ Skills (พร้อมใช้งาน/ขาดหาย/ถูกบล็อก) และสถานะ Plugin

  </Accordion>
  <Accordion title="Config และการย้ายข้อมูล">
    - การปรับ config ให้เป็นมาตรฐานสำหรับค่ารุ่นเดิม
    - การย้าย config Talk จากฟิลด์แบนแบบเดิม `talk.*` ไปเป็น `talk.provider` + `talk.providers.<provider>`
    - การตรวจสอบการย้ายเบราว์เซอร์สำหรับ config ส่วนขยาย Chrome รุ่นเดิมและความพร้อมของ Chrome MCP
    - คำเตือน override ของผู้ให้บริการ OpenCode (`models.providers.opencode` / `models.providers.opencode-go`)
    - คำเตือนการบดบัง OAuth ของ Codex (`models.providers.openai-codex`)
    - การตรวจข้อกำหนดเบื้องต้นของ TLS สำหรับโปรไฟล์ OAuth ของ OpenAI Codex
    - คำเตือน allowlist ของ Plugin/เครื่องมือ เมื่อ `plugins.allow` จำกัดเข้มงวดแต่ policy ของเครื่องมือยังขอ wildcard หรือเครื่องมือที่ Plugin เป็นเจ้าของ
    - การย้ายสถานะรุ่นเดิมบนดิสก์ (sessions/ไดเรกทอรี agent/การยืนยันตัวตน WhatsApp)
    - การย้าย key contract ของ manifest Plugin รุ่นเดิม (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
    - การย้าย store ของ cron รุ่นเดิม (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบนสุด, payload `provider`, งาน fallback webhook แบบง่าย `notify: true`)
    - การย้าย runtime-policy ของ agent รุ่นเดิมไปยัง `agents.defaults.agentRuntime` และ `agents.list[].agentRuntime`
    - การล้าง config Plugin ที่ล้าสมัยเมื่อเปิดใช้ plugins; เมื่อ `plugins.enabled=false` การอ้างอิง Plugin ที่ล้าสมัยจะถือเป็น config กักกันที่ไม่ทำงานและจะถูกเก็บไว้

  </Accordion>
  <Accordion title="สถานะและความสมบูรณ์">
    - การตรวจไฟล์ล็อก session และการล้างล็อกที่ล้าสมัย
    - การซ่อมแซม transcript ของ session สำหรับ branch การเขียน prompt ซ้ำที่ซ้ำกันซึ่งสร้างโดย build 2026.4.24 ที่ได้รับผลกระทบ
    - การตรวจจับ tombstone การกู้คืนด้วยการรีสตาร์ทของ subagent ที่ค้าง พร้อมรองรับ `--fix` เพื่อล้าง flag การกู้คืนที่ถูกยกเลิกและล้าสมัย เพื่อไม่ให้ startup ถือว่า child ถูกยกเลิกจากการรีสตาร์ทต่อไป
    - การตรวจความสมบูรณ์ของสถานะและสิทธิ์ (sessions, transcripts, ไดเรกทอรีสถานะ)
    - การตรวจสิทธิ์ไฟล์ config (chmod 600) เมื่อรันในเครื่อง
    - สุขภาพการยืนยันตัวตนโมเดล: ตรวจวันหมดอายุ OAuth, สามารถ refresh token ที่ใกล้หมดอายุ และรายงานสถานะ cooldown/disabled ของ auth-profile
    - การตรวจจับไดเรกทอรี workspace เพิ่มเติม (`~/openclaw`)

  </Accordion>
  <Accordion title="Gateway, บริการ และ supervisors">
    - การซ่อมแซม image ของ sandbox เมื่อเปิดใช้ sandboxing
    - การย้าย service รุ่นเดิมและการตรวจจับ Gateway เพิ่มเติม
    - การย้ายสถานะรุ่นเดิมของช่อง Matrix (ในโหมด `--fix` / `--repair`)
    - การตรวจ runtime ของ Gateway (ติดตั้ง service แล้วแต่ไม่ทำงาน; label launchd ที่แคชไว้)
    - คำเตือนสถานะช่อง (probe จาก Gateway ที่กำลังทำงาน)
    - การ audit config supervisor (launchd/systemd/schtasks) พร้อมการซ่อมแซมแบบเลือกได้
    - การล้าง environment ของ proxy แบบฝังสำหรับบริการ Gateway ที่จับค่า shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` ระหว่างติดตั้งหรืออัปเดต
    - การตรวจแนวปฏิบัติที่ดีของ runtime Gateway (Node เทียบกับ Bun, path ของ version-manager)
    - การวินิจฉัย port ชนกันของ Gateway (ค่าเริ่มต้น `18789`)

  </Accordion>
  <Accordion title="Auth, ความปลอดภัย และการจับคู่">
    - คำเตือนความปลอดภัยสำหรับ policy DM แบบเปิด
    - การตรวจ auth ของ Gateway สำหรับโหมด token ภายในเครื่อง (เสนอการสร้าง token เมื่อไม่มีแหล่ง token; ไม่เขียนทับ config token SecretRef)
    - การตรวจจับปัญหาการจับคู่อุปกรณ์ (คำขอจับคู่ครั้งแรกที่ค้างอยู่, การอัปเกรด role/scope ที่ค้างอยู่, drift ของแคช device-token ภายในเครื่องที่ล้าสมัย และ drift ของ auth ในระเบียนที่จับคู่แล้ว)

  </Accordion>
  <Accordion title="Workspace และ shell">
    - การตรวจ systemd linger บน Linux
    - การตรวจขนาดไฟล์ bootstrap ของ workspace (คำเตือนการตัดทอน/ใกล้ถึงขีดจำกัดสำหรับไฟล์ context)
    - การตรวจความพร้อมของ Skills สำหรับ agent เริ่มต้น; รายงาน skills ที่อนุญาตแต่ขาด bins, env, config หรือข้อกำหนด OS และ `--fix` สามารถปิดใช้ skills ที่ไม่พร้อมใช้งานใน `skills.entries`
    - การตรวจสถานะ shell completion และการติดตั้ง/อัปเกรดอัตโนมัติ
    - การตรวจความพร้อมของผู้ให้บริการ embedding สำหรับ memory search (โมเดลภายในเครื่อง, remote API key หรือ binary QMD)
    - การตรวจการติดตั้งจาก source (pnpm workspace ไม่ตรงกัน, ขาด asset ของ UI, ขาด binary tsx)
    - เขียน config ที่อัปเดต + metadata ของ wizard

  </Accordion>
</AccordionGroup>

## การ backfill และ reset UI Dreams

ฉาก Dreams ใน Control UI มีการดำเนินการ **Backfill**, **Reset** และ **Clear Grounded** สำหรับ workflow grounded dreaming การดำเนินการเหล่านี้ใช้เมธอด RPC แบบ doctor ของ gateway แต่ไม่ได้เป็นส่วนหนึ่งของการซ่อมแซม/ย้ายข้อมูลของ CLI `openclaw doctor`

สิ่งที่การดำเนินการเหล่านี้ทำ:

- **Backfill** สแกนไฟล์ย้อนหลัง `memory/YYYY-MM-DD.md` ใน workspace ที่ใช้งานอยู่ รัน pass ไดอารี REM แบบ grounded และเขียนรายการ backfill ที่ย้อนกลับได้ลงใน `DREAMS.md`
- **Reset** ลบเฉพาะรายการไดอารี backfill ที่ทำเครื่องหมายไว้จาก `DREAMS.md`
- **Clear Grounded** ลบเฉพาะรายการ short-term แบบ grounded-only ที่ staged ไว้ ซึ่งมาจากการ replay ประวัติ และยังไม่ได้สะสม live recall หรือ daily support

สิ่งที่การดำเนินการเหล่านี้ไม่ได้ทำด้วยตัวเอง:

- ไม่แก้ไข `MEMORY.md`
- ไม่รันการย้ายข้อมูล doctor แบบเต็ม
- ไม่ stage ผู้สมัครแบบ grounded เข้าไปใน store การโปรโมต short-term แบบ live โดยอัตโนมัติ เว้นแต่คุณจะรัน path CLI แบบ staged ก่อนอย่างชัดเจน

หากคุณต้องการให้การ replay ประวัติแบบ grounded มีผลต่อ lane การโปรโมตเชิงลึกตามปกติ ให้ใช้ flow CLI แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

คำสั่งนั้นจะ stage ผู้สมัคร durable แบบ grounded เข้าไปใน store short-term dreaming ขณะที่ยังใช้ `DREAMS.md` เป็นพื้นผิวสำหรับตรวจทาน

## พฤติกรรมและเหตุผลโดยละเอียด

<AccordionGroup>
  <Accordion title="0. การอัปเดตแบบเลือกได้ (การติดตั้งจาก git)">
    หากนี่เป็น git checkout และ doctor กำลังรันแบบโต้ตอบ ระบบจะเสนอให้อัปเดต (fetch/rebase/build) ก่อนรัน doctor
  </Accordion>
  <Accordion title="1. การปรับ config ให้เป็นมาตรฐาน">
    หาก config มีรูปแบบค่ารุ่นเดิม (เช่น `messages.ackReaction` โดยไม่มี override เฉพาะช่อง) doctor จะปรับให้เป็น schema ปัจจุบัน

    ซึ่งรวมถึงฟิลด์แบนของ Talk รุ่นเดิมด้วย config Talk สาธารณะปัจจุบันคือ `talk.provider` + `talk.providers.<provider>` Doctor จะเขียนรูปแบบเก่า `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ใหม่ให้อยู่ใน provider map

    Doctor ยังเตือนเมื่อ `plugins.allow` ไม่ว่างและ policy ของเครื่องมือใช้
    wildcard หรือรายการเครื่องมือที่ Plugin เป็นเจ้าของ `tools.allow: ["*"]` จะจับคู่เฉพาะเครื่องมือ
    จาก plugins ที่โหลดจริงเท่านั้น; ไม่ได้ข้าม allowlist Plugin แบบ exclusive

  </Accordion>
  <Accordion title="2. การย้าย key config รุ่นเดิม">
    เมื่อ config มี key ที่เลิกใช้แล้ว คำสั่งอื่นจะปฏิเสธการรันและขอให้คุณรัน `openclaw doctor`

    Doctor จะ:

    - อธิบายว่าพบ key รุ่นเดิมใดบ้าง
    - แสดงการย้ายข้อมูลที่ใช้
    - เขียน `~/.openclaw/openclaw.json` ใหม่ด้วย schema ที่อัปเดตแล้ว

    Gateway จะรันการย้ายข้อมูล doctor อัตโนมัติเมื่อ startup ด้วยเมื่อตรวจพบรูปแบบ config รุ่นเดิม ดังนั้น config ที่ล้าสมัยจะถูกซ่อมแซมโดยไม่ต้องดำเนินการเอง การย้าย store ของงาน Cron จัดการโดย `openclaw doctor --fix`

    การย้ายข้อมูลปัจจุบัน:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - การกำหนดค่าของช่องทางที่กำหนดไว้ซึ่งไม่มีนโยบายการตอบกลับที่มองเห็นได้ → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` ระดับบนสุด
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - ค่าเดิม `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - สำหรับช่องทางที่มี `accounts` แบบมีชื่อ แต่ยังมีค่าช่องทางระดับบนสุดแบบบัญชีเดียวค้างอยู่ ให้ย้ายค่าที่มีขอบเขตตามบัญชีเหล่านั้นไปยังบัญชีที่เลื่อนระดับและเลือกไว้สำหรับช่องทางนั้น (`accounts.default` สำหรับช่องทางส่วนใหญ่; Matrix สามารถรักษาเป้าหมายชื่อ/ค่าเริ่มต้นเดิมที่ตรงกันไว้ได้)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - ลบ `agents.defaults.llm`; ใช้ `models.providers.<id>.timeoutSeconds` สำหรับเวลาหมดเวลาของผู้ให้บริการ/โมเดลที่ช้า
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - ลบ `browser.relayBindHost` (การตั้งค่ารีเลย์ของส่วนขยายเดิม)
    - ค่าเดิม `models.providers.*.api: "openai"` → `"openai-completions"` (การเริ่มต้น Gateway จะข้ามผู้ให้บริการที่ตั้งค่า `api` เป็นค่า enum ในอนาคตหรือไม่รู้จักด้วย แทนที่จะล้มเหลวแบบปิดกั้น)

    คำเตือนของเครื่องมือตรวจสุขภาพยังรวมคำแนะนำบัญชีเริ่มต้นสำหรับช่องทางหลายบัญชีด้วย:

    - หากกำหนดค่ารายการ `channels.<channel>.accounts` ตั้งแต่สองรายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default` เครื่องมือตรวจสุขภาพจะเตือนว่าการกำหนดเส้นทางสำรองอาจเลือกบัญชีที่ไม่คาดคิดได้
    - หากตั้งค่า `channels.<channel>.defaultAccount` เป็น ID บัญชีที่ไม่รู้จัก เครื่องมือตรวจสุขภาพจะเตือนและแสดงรายการ ID บัญชีที่กำหนดค่าไว้

  </Accordion>
  <Accordion title="2b. การแทนที่ผู้ให้บริการ OpenCode">
    หากคุณเพิ่ม `models.providers.opencode`, `opencode-zen` หรือ `opencode-go` ด้วยตนเอง ค่านั้นจะแทนที่แค็ตตาล็อก OpenCode ในตัวจาก `@mariozechner/pi-ai` ซึ่งอาจบังคับให้โมเดลใช้ API ผิดตัวหรือทำให้ต้นทุนเป็นศูนย์ เครื่องมือตรวจสุขภาพจะเตือนเพื่อให้คุณลบการแทนที่และคืนค่าการกำหนดเส้นทาง API พร้อมต้นทุนแบบรายโมเดลได้
  </Accordion>
  <Accordion title="2c. การย้าย Browser และความพร้อมของ Chrome MCP">
    หากการกำหนดค่าเบราว์เซอร์ของคุณยังชี้ไปยังพาธส่วนขยาย Chrome ที่ถูกลบแล้ว เครื่องมือตรวจสุขภาพจะปรับให้เป็นรูปแบบแนบ Chrome MCP ในเครื่องโฮสต์ปัจจุบัน:

    - `browser.profiles.*.driver: "extension"` กลายเป็น `"existing-session"`
    - `browser.relayBindHost` ถูกลบออก

    เครื่องมือตรวจสุขภาพยังตรวจพาธ Chrome MCP ในเครื่องโฮสต์เมื่อคุณใช้ `defaultProfile: "user"` หรือโปรไฟล์ `existing-session` ที่กำหนดค่าไว้:

    - ตรวจว่า Google Chrome ติดตั้งอยู่บนโฮสต์เดียวกันสำหรับโปรไฟล์เชื่อมต่ออัตโนมัติเริ่มต้นหรือไม่
    - ตรวจเวอร์ชัน Chrome ที่ตรวจพบและเตือนเมื่อเวอร์ชันต่ำกว่า Chrome 144
    - เตือนให้คุณเปิดใช้การดีบักระยะไกลในหน้า inspect ของเบราว์เซอร์ (เช่น `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` หรือ `edge://inspect/#remote-debugging`)

    เครื่องมือตรวจสุขภาพไม่สามารถเปิดการตั้งค่าฝั่ง Chrome ให้คุณได้ Chrome MCP ในเครื่องโฮสต์ยังต้องมี:

    - เบราว์เซอร์ที่ใช้ Chromium 144+ บนโฮสต์ Gateway/Node
    - เบราว์เซอร์ที่รันอยู่ในเครื่อง
    - เปิดใช้การดีบักระยะไกลในเบราว์เซอร์นั้น
    - อนุมัติพร้อมต์ขอความยินยอมในการแนบครั้งแรกในเบราว์เซอร์

    ความพร้อมในที่นี้เกี่ยวข้องเฉพาะข้อกำหนดเบื้องต้นสำหรับการแนบในเครื่องเท่านั้น โหมดเซสชันที่มีอยู่ยังคงรักษาข้อจำกัดเส้นทาง Chrome MCP ปัจจุบันไว้; เส้นทางขั้นสูงอย่าง `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และการทำงานแบบกลุ่มยังต้องใช้เบราว์เซอร์ที่จัดการหรือโปรไฟล์ CDP แบบดิบ

    การตรวจนี้ **ไม่** ใช้กับ Docker, แซนด์บ็อกซ์, รีโมตเบราว์เซอร์ หรือโฟลว์ไร้หน้าต่างอื่น ๆ โฟลว์เหล่านั้นยังคงใช้ CDP แบบดิบต่อไป

  </Accordion>
  <Accordion title="2d. ข้อกำหนดเบื้องต้นของ OAuth TLS">
    เมื่อกำหนดค่าโปรไฟล์ OpenAI Codex OAuth เครื่องมือตรวจสุขภาพจะตรวจปลายทางการอนุญาตของ OpenAI เพื่อยืนยันว่าสแตก TLS ของ Node/OpenSSL ในเครื่องสามารถตรวจสอบสายใบรับรองได้ หากการตรวจล้มเหลวด้วยข้อผิดพลาดใบรับรอง (เช่น `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ใบรับรองหมดอายุ หรือใบรับรองที่ลงนามเอง) เครื่องมือตรวจสุขภาพจะแสดงคำแนะนำการแก้ไขเฉพาะแพลตฟอร์ม บน macOS ที่ใช้ Node จาก Homebrew วิธีแก้มักเป็น `brew postinstall ca-certificates` เมื่อใช้ `--deep` การตรวจจะรันแม้ว่า Gateway จะทำงานปกติ
  </Accordion>
  <Accordion title="2e. การแทนที่ผู้ให้บริการ Codex OAuth">
    หากก่อนหน้านี้คุณเพิ่มการตั้งค่าทรานสปอร์ต OpenAI แบบเดิมไว้ใต้ `models.providers.openai-codex` ค่านั้นอาจบดบังพาธผู้ให้บริการ Codex OAuth ในตัวที่รุ่นใหม่กว่าใช้โดยอัตโนมัติ เครื่องมือตรวจสุขภาพจะเตือนเมื่อพบการตั้งค่าทรานสปอร์ตเก่าเหล่านั้นร่วมกับ Codex OAuth เพื่อให้คุณลบหรือเขียนการแทนที่ทรานสปอร์ตที่ล้าสมัยใหม่ และนำพฤติกรรมการกำหนดเส้นทาง/สำรองในตัวกลับมา การใช้พร็อกซีแบบกำหนดเองและการแทนที่เฉพาะส่วนหัวเหล่านั้นยังรองรับอยู่และจะไม่ทำให้เกิดคำเตือนนี้
  </Accordion>
  <Accordion title="2f. คำเตือนเส้นทาง Plugin Codex">
    เมื่อเปิดใช้ Plugin Codex ที่บันเดิลมา เครื่องมือตรวจสุขภาพจะตรวจด้วยว่า ref โมเดลหลัก `openai-codex/*` ยัง resolve ผ่านตัวรัน PI เริ่มต้นหรือไม่ ชุดค่านี้ถูกต้องเมื่อคุณต้องการใช้การยืนยันตัวตน Codex OAuth/การสมัครสมาชิกผ่าน PI แต่สับสนกับชุดรันเซิร์ฟเวอร์แอปแบบเนทีฟของ Codex ได้ง่าย เครื่องมือตรวจสุขภาพจะเตือนและชี้ไปยังรูปแบบเซิร์ฟเวอร์แอปที่ชัดเจน: `openai/*` พร้อม `agentRuntime.id: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex`

    เครื่องมือตรวจสุขภาพจะไม่ซ่อมแซมสิ่งนี้โดยอัตโนมัติ เพราะทั้งสองเส้นทางถูกต้อง:

    - `openai-codex/*` + PI หมายถึง "ใช้การยืนยันตัวตน Codex OAuth/การสมัครสมาชิกผ่านตัวรัน OpenClaw ปกติ"
    - `openai/*` + `agentRuntime.id: "codex"` หมายถึง "รันเทิร์นที่ฝังไว้ผ่านเซิร์ฟเวอร์แอปแบบเนทีฟของ Codex"
    - `/codex ...` หมายถึง "ควบคุมหรือผูกบทสนทนา Codex แบบเนทีฟจากแชต"
    - `/acp ...` หรือ `runtime: "acp"` หมายถึง "ใช้อะแดปเตอร์ ACP/acpx ภายนอก"

    หากคำเตือนปรากฏ ให้เลือกเส้นทางที่คุณตั้งใจใช้และแก้ไขการกำหนดค่าด้วยตนเอง ปล่อยคำเตือนไว้ตามเดิมเมื่อคุณตั้งใจใช้ PI Codex OAuth

  </Accordion>
  <Accordion title="3. การย้ายสถานะเดิม (โครงสร้างบนดิสก์)">
    เครื่องมือตรวจสุขภาพสามารถย้ายโครงสร้างบนดิสก์รุ่นเก่าเข้าสู่โครงสร้างปัจจุบันได้:

    - ที่เก็บเซสชัน + บันทึกทรานสคริปต์:
      - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
    - ไดเรกทอรี Agent:
      - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
    - สถานะการยืนยันตัวตน WhatsApp (Baileys):
      - จากค่าเดิม `~/.openclaw/credentials/*.json` (ยกเว้น `oauth.json`)
      - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID บัญชีเริ่มต้น: `default`)

    การย้ายเหล่านี้เป็นแบบพยายามเต็มที่และทำซ้ำได้โดยไม่เปลี่ยนผลลัพธ์; เครื่องมือตรวจสุขภาพจะแสดงคำเตือนเมื่อยังคงทิ้งโฟลเดอร์เดิมไว้เป็นข้อมูลสำรอง Gateway/CLI ยังย้ายเซสชันเดิมและไดเรกทอรี agent โดยอัตโนมัติเมื่อเริ่มทำงาน เพื่อให้ประวัติ/auth/โมเดลไปอยู่ในพาธแยกตาม agent โดยไม่ต้องรันเครื่องมือตรวจสุขภาพด้วยตนเอง การยืนยันตัวตน WhatsApp ตั้งใจให้ย้ายผ่าน `openclaw doctor` เท่านั้น ตอนนี้การปรับรูปแบบผู้ให้บริการ Talk/แผนที่ผู้ให้บริการจะเปรียบเทียบด้วยความเท่ากันเชิงโครงสร้าง ดังนั้นความต่างที่เกิดจากลำดับคีย์เท่านั้นจะไม่ทำให้เกิดการเปลี่ยนแปลง `doctor --fix` แบบไม่ทำงานซ้ำอีก

  </Accordion>
  <Accordion title="3a. การย้ายไฟล์ประกาศ Plugin เดิม">
    เครื่องมือตรวจสุขภาพจะสแกนไฟล์ประกาศของ Plugin ที่ติดตั้งแล้วทั้งหมดเพื่อหาคีย์ความสามารถระดับบนสุดที่เลิกใช้แล้ว (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) เมื่อพบ จะเสนอให้ย้ายคีย์เหล่านั้นเข้าไปในวัตถุ `contracts` และเขียนไฟล์ประกาศเดิมใหม่ การย้ายนี้ทำซ้ำได้โดยไม่เปลี่ยนผลลัพธ์; หากคีย์ `contracts` มีค่าเดียวกันอยู่แล้ว คีย์เดิมจะถูกลบโดยไม่ทำข้อมูลซ้ำ
  </Accordion>
  <Accordion title="3b. การย้ายที่เก็บ Cron เดิม">
    เครื่องมือตรวจสุขภาพยังตรวจที่เก็บงาน cron (`~/.openclaw/cron/jobs.json` ตามค่าเริ่มต้น หรือ `cron.store` เมื่อมีการแทนที่) เพื่อหารูปแบบงานเก่าที่ตัวจัดกำหนดการยังยอมรับเพื่อความเข้ากันได้

    การปรับปรุงข้อมูล cron ปัจจุบันมีดังนี้:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - ฟิลด์ payload ระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
    - ฟิลด์ delivery ระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias การส่ง payload `provider` → `delivery.channel` แบบชัดเจน
    - งานสำรอง Webhook แบบเดิมที่เรียบง่าย `notify: true` → `delivery.mode="webhook"` แบบชัดเจนพร้อม `delivery.to=cron.webhook`

    เครื่องมือตรวจสุขภาพจะย้ายงาน `notify: true` โดยอัตโนมัติเฉพาะเมื่อทำได้โดยไม่เปลี่ยนพฤติกรรม หากงานรวมการสำรอง notify แบบเดิมเข้ากับโหมดการส่งที่ไม่ใช่ Webhook ที่มีอยู่ เครื่องมือตรวจสุขภาพจะเตือนและปล่อยให้งานนั้นรอการตรวจสอบด้วยตนเอง

    บน Linux เครื่องมือตรวจสุขภาพยังเตือนเมื่อ crontab ของผู้ใช้ยังเรียกใช้ `~/.openclaw/bin/ensure-whatsapp.sh` แบบเดิม สคริปต์ในเครื่องโฮสต์นั้นไม่ได้รับการดูแลโดย OpenClaw ปัจจุบัน และอาจเขียนข้อความ `Gateway inactive` ที่ผิดพลาดไปยัง `~/.openclaw/logs/whatsapp-health.log` เมื่อ cron ไม่สามารถเข้าถึง bus ผู้ใช้ของ systemd ได้ ลบรายการ crontab ที่ล้าสมัยด้วย `crontab -e`; ใช้ `openclaw channels status --probe`, `openclaw doctor` และ `openclaw gateway status` สำหรับการตรวจสุขภาพปัจจุบัน

  </Accordion>
  <Accordion title="3c. การล้างล็อกเซสชัน">
    Doctor สแกนไดเรกทอรีเซสชันของเอเจนต์ทุกตัวเพื่อหาไฟล์ล็อกการเขียนที่ค้างอยู่ — ไฟล์ที่ถูกทิ้งไว้เมื่อเซสชันออกจากระบบอย่างผิดปกติ สำหรับไฟล์ล็อกแต่ละไฟล์ที่พบ ระบบจะรายงาน: พาธ, PID, ว่า PID ยังทำงานอยู่หรือไม่, อายุของล็อก และถือว่าค้างหรือไม่ (PID ตายแล้วหรือเก่ากว่า 30 นาที) ในโหมด `--fix` / `--repair` ระบบจะลบไฟล์ล็อกที่ค้างโดยอัตโนมัติ มิฉะนั้นจะพิมพ์หมายเหตุและแนะนำให้คุณรันอีกครั้งพร้อม `--fix`
  </Accordion>
  <Accordion title="3d. การซ่อมแซมกิ่งทรานสคริปต์เซสชัน">
    Doctor สแกนไฟล์ JSONL ของเซสชันเอเจนต์เพื่อหารูปแบบกิ่งที่ซ้ำกันซึ่งสร้างโดยบั๊กการเขียนทรานสคริปต์พรอมป์ใหม่ใน 2026.4.24: เทิร์นผู้ใช้ที่ถูกละทิ้งพร้อมบริบทรันไทม์ภายในของ OpenClaw และกิ่งพี่น้องที่ใช้งานอยู่ซึ่งมีพรอมป์ผู้ใช้ที่มองเห็นได้เหมือนกัน ในโหมด `--fix` / `--repair` doctor จะสำรองไฟล์ที่ได้รับผลกระทบแต่ละไฟล์ไว้ข้างไฟล์เดิม แล้วเขียนทรานสคริปต์ใหม่ให้เป็นกิ่งที่ใช้งานอยู่ เพื่อให้ประวัติ Gateway และตัวอ่านหน่วยความจำไม่เห็นเทิร์นซ้ำอีกต่อไป
  </Accordion>
  <Accordion title="4. การตรวจสอบความสมบูรณ์ของสถานะ (การคงอยู่ของเซสชัน การกำหนดเส้นทาง และความปลอดภัย)">
    ไดเรกทอรีสถานะคือแกนควบคุมการทำงาน หากหายไป คุณจะสูญเสียเซสชัน ข้อมูลประจำตัว บันทึก และการกำหนดค่า (เว้นแต่คุณจะมีข้อมูลสำรองที่อื่น)

    Doctor ตรวจสอบ:

    - **ไดเรกทอรีสถานะหายไป**: เตือนเกี่ยวกับการสูญเสียสถานะครั้งใหญ่ แจ้งให้สร้างไดเรกทอรีใหม่ และเตือนว่าระบบไม่สามารถกู้คืนข้อมูลที่หายไปได้
    - **สิทธิ์ของไดเรกทอรีสถานะ**: ตรวจสอบว่าสามารถเขียนได้หรือไม่; เสนอให้ซ่อมแซมสิทธิ์ (และแสดงคำแนะนำ `chown` เมื่อตรวจพบว่าเจ้าของ/กลุ่มไม่ตรงกัน)
    - **ไดเรกทอรีสถานะที่ซิงก์กับคลาวด์บน macOS**: เตือนเมื่อสถานะชี้อยู่ใต้ iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ `~/Library/CloudStorage/...` เพราะพาธที่มีการซิงก์รองรับอาจทำให้ I/O ช้าลงและเกิดการแข่งขันของล็อก/การซิงก์
    - **ไดเรกทอรีสถานะบน SD หรือ eMMC ใน Linux**: เตือนเมื่อสถานะชี้ไปยังแหล่งเมานต์ `mmcblk*` เพราะ I/O แบบสุ่มที่รองรับด้วย SD หรือ eMMC อาจช้ากว่าและเสื่อมเร็วกว่าเมื่อมีการเขียนเซสชันและข้อมูลประจำตัว
    - **ไดเรกทอรีเซสชันหายไป**: ต้องมี `sessions/` และไดเรกทอรีที่เก็บเซสชันเพื่อคงประวัติและหลีกเลี่ยงการแครช `ENOENT`
    - **ทรานสคริปต์ไม่ตรงกัน**: เตือนเมื่อรายการเซสชันล่าสุดไม่มีไฟล์ทรานสคริปต์
    - **เซสชันหลัก "JSONL 1 บรรทัด"**: ทำเครื่องหมายเมื่อทรานสคริปต์หลักมีเพียงบรรทัดเดียว (ประวัติไม่ได้สะสมเพิ่ม)
    - **ไดเรกทอรีสถานะหลายรายการ**: เตือนเมื่อมีโฟลเดอร์ `~/.openclaw` หลายโฟลเดอร์อยู่ข้ามไดเรกทอรีบ้าน หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (ประวัติอาจถูกแยกระหว่างการติดตั้ง)
    - **การเตือนโหมดรีโมต**: หาก `gateway.mode=remote` doctor จะเตือนให้คุณรันบนโฮสต์รีโมต (สถานะอยู่ที่นั่น)
    - **สิทธิ์ไฟล์การกำหนดค่า**: เตือนหาก `~/.openclaw/openclaw.json` กลุ่ม/คนทั่วไปอ่านได้ และเสนอให้ปรับให้เข้มงวดเป็น `600`

  </Accordion>
  <Accordion title="5. สุขภาพการยืนยันตัวตนของโมเดล (OAuth หมดอายุ)">
    Doctor ตรวจสอบโปรไฟล์ OAuth ในที่เก็บการยืนยันตัวตน เตือนเมื่อโทเค็นกำลังจะหมดอายุ/หมดอายุแล้ว และสามารถรีเฟรชได้เมื่อปลอดภัย หากโปรไฟล์ Anthropic OAuth/โทเค็นล้าสมัย ระบบจะแนะนำคีย์ Anthropic API หรือพาธโทเค็นตั้งค่าของ Anthropic พรอมป์รีเฟรชจะแสดงเฉพาะเมื่อรันแบบโต้ตอบ (TTY); `--non-interactive` จะข้ามความพยายามรีเฟรช

    เมื่อการรีเฟรช OAuth ล้มเหลวถาวร (เช่น `refresh_token_reused`, `invalid_grant` หรือผู้ให้บริการแจ้งให้คุณเข้าสู่ระบบอีกครั้ง) doctor จะรายงานว่าต้องยืนยันตัวตนใหม่ และพิมพ์คำสั่ง `openclaw models auth login --provider ...` ที่ต้องรันอย่างชัดเจน

    Doctor ยังรายงานโปรไฟล์การยืนยันตัวตนที่ใช้งานไม่ได้ชั่วคราวเนื่องจาก:

    - คูลดาวน์สั้น ๆ (ข้อจำกัดอัตรา/หมดเวลา/การยืนยันตัวตนล้มเหลว)
    - การปิดใช้งานที่นานกว่า (การเรียกเก็บเงิน/เครดิตล้มเหลว)

  </Accordion>
  <Accordion title="6. การตรวจสอบโมเดลของฮุก">
    หากตั้งค่า `hooks.gmail.model` ไว้ doctor จะตรวจสอบการอ้างอิงโมเดลกับแคตตาล็อกและ allowlist และเตือนเมื่อไม่สามารถ resolve ได้หรือไม่ได้รับอนุญาต
  </Accordion>
  <Accordion title="7. การซ่อมแซมอิมเมจแซนด์บ็อกซ์">
    เมื่อเปิดใช้แซนด์บ็อกซ์ doctor จะตรวจสอบอิมเมจ Docker และเสนอให้สร้างหรือสลับไปใช้ชื่อเดิมหากอิมเมจปัจจุบันหายไป
  </Accordion>
  <Accordion title="7b. การล้างการติดตั้ง Plugin">
    Doctor ลบสถานะ staging ของการพึ่งพา Plugin ที่ OpenClaw สร้างไว้แบบเดิมในโหมด `openclaw doctor --fix` / `openclaw doctor --repair` ซึ่งครอบคลุมรากการพึ่งพาที่สร้างไว้และค้างอยู่ ไดเรกทอรีขั้นตอนติดตั้งเก่า เศษไฟล์เฉพาะแพ็กเกจจากโค้ดซ่อมแซมการพึ่งพา bundled-plugin รุ่นก่อน และสำเนา npm ที่จัดการไว้ของ Plugin `@openclaw/*` แบบ bundled ที่ถูกทิ้งไว้หรือกู้คืนมา ซึ่งอาจบดบัง manifest แบบ bundled ปัจจุบัน

    Doctor ยังสามารถติดตั้ง Plugin ที่ดาวน์โหลดได้ซ้ำ เมื่อการกำหนดค่าอ้างอิงถึง Plugin เหล่านั้นแต่รีจิสทรี Plugin ภายในเครื่องหาไม่พบ สำหรับการทำให้ bundled-plugin เป็นภายนอกใน 2026.5.2 doctor จะติดตั้ง Plugin ที่ดาวน์โหลดได้โดยอัตโนมัติหากการกำหนดค่าที่มีอยู่ใช้อยู่แล้ว จากนั้นอาศัย `meta.lastTouchedVersion` เพื่อให้พาสของรีลีสนั้นทำงานเพียงครั้งเดียว การเริ่มต้น Gateway และการโหลดการกำหนดค่าใหม่จะไม่รันตัวจัดการแพ็กเกจ; การติดตั้ง Plugin ยังคงเป็นงาน doctor/install/update ที่ชัดเจน

  </Accordion>
  <Accordion title="8. การย้ายบริการ Gateway และคำแนะนำการล้าง">
    Doctor ตรวจพบบริการ Gateway แบบเดิม (launchd/systemd/schtasks) และเสนอให้ลบบริการเหล่านั้นพร้อมติดตั้งบริการ OpenClaw โดยใช้พอร์ต Gateway ปัจจุบัน นอกจากนี้ยังสามารถสแกนหาบริการลักษณะคล้าย Gateway เพิ่มเติมและพิมพ์คำแนะนำการล้างได้ บริการ Gateway ของ OpenClaw ที่ตั้งชื่อตามโปรไฟล์ถือเป็นบริการชั้นหนึ่งและจะไม่ถูกทำเครื่องหมายว่าเป็น "เพิ่มเติม"

    บน Linux หากบริการ Gateway ระดับผู้ใช้หายไปแต่มีบริการ Gateway ของ OpenClaw ระดับระบบอยู่ doctor จะไม่ติดตั้งบริการระดับผู้ใช้ตัวที่สองโดยอัตโนมัติ ตรวจสอบด้วย `openclaw gateway status --deep` หรือ `openclaw doctor --deep` จากนั้นลบตัวซ้ำหรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ system supervisor เป็นเจ้าของวงจรชีวิตของ Gateway

  </Accordion>
  <Accordion title="8b. การย้าย Startup Matrix">
    เมื่อบัญชีช่องทาง Matrix มีการย้ายสถานะเดิมที่ค้างอยู่หรือดำเนินการได้ doctor (ในโหมด `--fix` / `--repair`) จะสร้าง snapshot ก่อนการย้าย จากนั้นรันขั้นตอนการย้ายแบบ best-effort: การย้ายสถานะ Matrix เดิมและการเตรียมสถานะเข้ารหัสแบบเดิม ทั้งสองขั้นตอนไม่ทำให้ล้มเหลวร้ายแรง; ข้อผิดพลาดจะถูกบันทึกและการเริ่มต้นจะดำเนินต่อไป ในโหมดอ่านอย่างเดียว (`openclaw doctor` ที่ไม่มี `--fix`) การตรวจสอบนี้จะถูกข้ามทั้งหมด
  </Accordion>
  <Accordion title="8c. การจับคู่อุปกรณ์และการเลื่อนของการยืนยันตัวตน">
    ตอนนี้ Doctor ตรวจสอบสถานะการจับคู่อุปกรณ์เป็นส่วนหนึ่งของการตรวจสุขภาพปกติ

    สิ่งที่รายงาน:

    - คำขอจับคู่ครั้งแรกที่ค้างอยู่
    - การอัปเกรดบทบาทที่ค้างอยู่สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การอัปเกรดขอบเขตที่ค้างอยู่สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การซ่อมแซม public-key mismatch ซึ่งรหัสอุปกรณ์ยังตรงกันแต่ตัวตนอุปกรณ์ไม่ตรงกับระเบียนที่อนุมัติแล้ว
    - ระเบียนที่จับคู่แล้วซึ่งไม่มีโทเค็นที่ใช้งานอยู่สำหรับบทบาทที่อนุมัติ
    - โทเค็นที่จับคู่แล้วซึ่งขอบเขตเลื่อนออกนอก baseline การจับคู่ที่อนุมัติ
    - รายการโทเค็นอุปกรณ์ที่แคชไว้ในเครื่องสำหรับเครื่องปัจจุบันซึ่งเก่ากว่าการหมุนโทเค็นฝั่ง Gateway หรือมีเมทาดาทาขอบเขตที่ล้าสมัย

    Doctor จะไม่อนุมัติคำขอจับคู่หรือหมุนโทเค็นอุปกรณ์โดยอัตโนมัติ แต่จะพิมพ์ขั้นตอนถัดไปที่แน่นอนแทน:

    - ตรวจสอบคำขอที่ค้างอยู่ด้วย `openclaw devices list`
    - อนุมัติคำขอที่แน่นอนด้วย `openclaw devices approve <requestId>`
    - หมุนโทเค็นใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
    - ลบและอนุมัติระเบียนล้าสมัยใหม่ด้วย `openclaw devices remove <deviceId>`

    สิ่งนี้ปิดช่องโหว่ทั่วไป "จับคู่แล้วแต่ยังถูกแจ้งว่าต้องจับคู่": ตอนนี้ doctor แยกแยะการจับคู่ครั้งแรกออกจากการอัปเกรดบทบาท/ขอบเขตที่ค้างอยู่ และจากการเลื่อนของโทเค็น/ตัวตนอุปกรณ์ที่ล้าสมัย

  </Accordion>
  <Accordion title="9. คำเตือนด้านความปลอดภัย">
    Doctor แสดงคำเตือนเมื่อผู้ให้บริการเปิดรับ DM โดยไม่มี allowlist หรือเมื่อนโยบายถูกกำหนดค่าในลักษณะที่อันตราย
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    หากรันเป็นบริการผู้ใช้ systemd doctor จะตรวจให้แน่ใจว่าเปิดใช้ lingering เพื่อให้ Gateway ยังทำงานหลังออกจากระบบ
  </Accordion>
  <Accordion title="11. สถานะพื้นที่ทำงาน (Skills, Plugin และไดเรกทอรีเดิม)">
    Doctor พิมพ์สรุปสถานะพื้นที่ทำงานสำหรับเอเจนต์เริ่มต้น:

    - **สถานะ Skills**: นับ Skills ที่เข้าเกณฑ์, ข้อกำหนดขาดหาย และถูกบล็อกโดย allowlist
    - **ไดเรกทอรีพื้นที่ทำงานเดิม**: เตือนเมื่อมี `~/openclaw` หรือไดเรกทอรีพื้นที่ทำงานเดิมอื่น ๆ อยู่ร่วมกับพื้นที่ทำงานปัจจุบัน
    - **สถานะ Plugin**: นับ Plugin ที่เปิดใช้/ปิดใช้/มีข้อผิดพลาด; แสดงรายการรหัส Plugin สำหรับข้อผิดพลาดใด ๆ; รายงานความสามารถของ bundle Plugin
    - **คำเตือนความเข้ากันได้ของ Plugin**: ทำเครื่องหมาย Plugin ที่มีปัญหาความเข้ากันได้กับรันไทม์ปัจจุบัน
    - **การวินิจฉัย Plugin**: แสดงคำเตือนหรือข้อผิดพลาดขณะโหลดที่ปล่อยออกมาจากรีจิสทรี Plugin

  </Accordion>
  <Accordion title="11b. ขนาดไฟล์บูตสแตรป">
    Doctor ตรวจสอบว่าไฟล์บูตสแตรปของพื้นที่ทำงาน (เช่น `AGENTS.md`, `CLAUDE.md` หรือไฟล์บริบทที่ฉีดเข้าอื่น ๆ) ใกล้หรือเกินงบประมาณจำนวนอักขระที่กำหนดไว้หรือไม่ โดยรายงานจำนวนอักขระดิบเทียบกับที่ฉีดเข้ารายไฟล์ เปอร์เซ็นต์การตัดทอน สาเหตุการตัดทอน (`max/file` หรือ `max/total`) และจำนวนอักขระที่ฉีดเข้าทั้งหมดเป็นสัดส่วนของงบประมาณรวม เมื่อไฟล์ถูกตัดทอนหรือใกล้ถึงขีดจำกัด doctor จะพิมพ์คำแนะนำสำหรับการปรับ `agents.defaults.bootstrapMaxChars` และ `agents.defaults.bootstrapTotalMaxChars`
  </Accordion>
  <Accordion title="11d. การล้าง Plugin ช่องทางที่ล้าสมัย">
    เมื่อ `openclaw doctor --fix` ลบ Plugin ช่องทางที่หายไป ระบบจะลบการกำหนดค่าขอบเขตช่องทางที่ค้างอยู่ซึ่งอ้างอิงถึง Plugin นั้นด้วย: รายการ `channels.<id>`, เป้าหมาย Heartbeat ที่ระบุชื่อช่องทาง และการ override `agents.*.models["<channel>/*"]` สิ่งนี้ป้องกันลูปการบูต Gateway เมื่อรันไทม์ของช่องทางหายไปแต่การกำหนดค่ายังขอให้ Gateway bind กับช่องทางนั้น
  </Accordion>
  <Accordion title="11c. การเติมคำสั่งเชลล์">
    Doctor ตรวจสอบว่ามีการติดตั้งการเติมแท็บสำหรับเชลล์ปัจจุบันหรือไม่ (zsh, bash, fish หรือ PowerShell):

    - หากโปรไฟล์เชลล์ใช้รูปแบบการเติมแบบไดนามิกที่ช้า (`source <(openclaw completion ...)`) doctor จะอัปเกรดเป็นรูปแบบไฟล์แคชที่เร็วกว่า
    - หากกำหนดค่าการเติมในโปรไฟล์ไว้แล้วแต่ไฟล์แคชหายไป doctor จะสร้างแคชใหม่โดยอัตโนมัติ
    - หากไม่มีการกำหนดค่าการเติมเลย doctor จะพรอมป์ให้ติดตั้ง (เฉพาะโหมดโต้ตอบ; ข้ามด้วย `--non-interactive`)

    รัน `openclaw completion --write-state` เพื่อสร้างแคชใหม่ด้วยตนเอง

  </Accordion>
  <Accordion title="12. การตรวจสอบการยืนยันตัวตน Gateway (โทเค็นภายในเครื่อง)">
    Doctor ตรวจสอบความพร้อมของการยืนยันตัวตนด้วยโทเค็น Gateway ภายในเครื่อง

    - หากโหมดโทเค็นต้องใช้โทเค็นและไม่มีแหล่งโทเค็น doctor จะเสนอให้สร้างหนึ่งรายการ
    - หาก `gateway.auth.token` จัดการโดย SecretRef แต่ใช้ไม่ได้ doctor จะเตือนและจะไม่เขียนทับด้วย plaintext
    - `openclaw doctor --generate-gateway-token` บังคับสร้างเฉพาะเมื่อไม่ได้กำหนดค่า SecretRef ของโทเค็นไว้

  </Accordion>
  <Accordion title="12b. การซ่อมแซมแบบอ่านอย่างเดียวที่รับรู้ SecretRef">
    บางโฟลว์การซ่อมแซมต้องตรวจสอบข้อมูลประจำตัวที่กำหนดค่าไว้โดยไม่ทำให้พฤติกรรม fail-fast ของรันไทม์อ่อนลง

    - ตอนนี้ `openclaw doctor --fix` ใช้โมเดลสรุป SecretRef แบบอ่านอย่างเดียวเดียวกับคำสั่งตระกูลสถานะสำหรับการซ่อมแซมการกำหนดค่าแบบเจาะจง
    - ตัวอย่าง: การซ่อมแซม `allowFrom` / `groupAllowFrom` `@username` ของ Telegram จะพยายามใช้ข้อมูลประจำตัวบอตที่กำหนดค่าไว้เมื่อมี
    - หากโทเค็นบอต Telegram ถูกกำหนดค่าผ่าน SecretRef แต่ใช้ไม่ได้ในพาธคำสั่งปัจจุบัน doctor จะรายงานว่าข้อมูลประจำตัวถูกกำหนดค่าแล้วแต่ใช้ไม่ได้ และข้ามการ resolve อัตโนมัติแทนที่จะแครชหรือรายงานผิดว่าโทเค็นหายไป

  </Accordion>
  <Accordion title="13. การตรวจสุขภาพ Gateway + รีสตาร์ต">
    Doctor เรียกใช้การตรวจสุขภาพและเสนอให้รีสตาร์ต Gateway เมื่อดูเหมือนว่าไม่สมบูรณ์
  </Accordion>
  <Accordion title="13b. ความพร้อมของการค้นหาหน่วยความจำ">
    Doctor ตรวจสอบว่าผู้ให้บริการ embedding สำหรับการค้นหาหน่วยความจำที่กำหนดค่าไว้พร้อมสำหรับเอเจนต์เริ่มต้นหรือไม่ ลักษณะการทำงานขึ้นอยู่กับแบ็กเอนด์และผู้ให้บริการที่กำหนดค่าไว้:

    - **แบ็กเอนด์ QMD**: ตรวจสอบว่าไบนารี `qmd` พร้อมใช้งานและเริ่มต้นได้หรือไม่ หากไม่ได้ จะพิมพ์คำแนะนำการแก้ไข รวมถึงแพ็กเกจ npm และตัวเลือกพาธไบนารีแบบกำหนดเอง
    - **ผู้ให้บริการภายในเครื่องแบบระบุชัดเจน**: ตรวจหาไฟล์โมเดลภายในเครื่องหรือ URL โมเดลระยะไกล/ดาวน์โหลดได้ที่รู้จัก หากไม่มี จะแนะนำให้เปลี่ยนไปใช้ผู้ให้บริการระยะไกล
    - **ผู้ให้บริการระยะไกลแบบระบุชัดเจน** (`openai`, `voyage` ฯลฯ): ตรวจสอบว่ามี API key อยู่ในสภาพแวดล้อมหรือที่เก็บ auth หรือไม่ และพิมพ์คำแนะนำการแก้ไขที่นำไปทำได้หากไม่มี
    - **ผู้ให้บริการอัตโนมัติ**: ตรวจสอบความพร้อมของโมเดลภายในเครื่องก่อน แล้วจึงลองผู้ให้บริการระยะไกลแต่ละรายตามลำดับการเลือกอัตโนมัติ

    เมื่อมีผลลัพธ์ probe ของ Gateway ที่แคชไว้พร้อมใช้งาน (Gateway สมบูรณ์ในเวลาที่ตรวจสอบ) doctor จะเทียบผลลัพธ์นั้นกับ config ที่ CLI มองเห็นได้และแจ้งความคลาดเคลื่อนใด ๆ Doctor จะไม่เริ่ม embedding ping ใหม่บนพาธเริ่มต้น ใช้คำสั่งสถานะหน่วยความจำเชิงลึกเมื่อคุณต้องการตรวจสอบผู้ให้บริการแบบสด

    ใช้ `openclaw memory status --deep` เพื่อตรวจสอบความพร้อมของ embedding ขณะรันไทม์

  </Accordion>
  <Accordion title="14. คำเตือนสถานะช่องทาง">
    หาก Gateway สมบูรณ์ doctor จะเรียกใช้ probe สถานะช่องทางและรายงานคำเตือนพร้อมการแก้ไขที่แนะนำ
  </Accordion>
  <Accordion title="15. การตรวจสอบ config ของ supervisor + การซ่อมแซม">
    Doctor ตรวจสอบ config ของ supervisor ที่ติดตั้งไว้ (launchd/systemd/schtasks) เพื่อหาค่าเริ่มต้นที่ขาดหายหรือล้าสมัย (เช่น dependency ของ systemd network-online และเวลาหน่วงก่อนรีสตาร์ต) เมื่อพบความไม่ตรงกัน จะแนะนำให้อัปเดตและสามารถเขียนไฟล์ service/task ใหม่เป็นค่าเริ่มต้นปัจจุบันได้

    หมายเหตุ:

    - `openclaw doctor` จะถามก่อนเขียน config ของ supervisor ใหม่
    - `openclaw doctor --yes` ยอมรับพรอมป์การซ่อมแซมเริ่มต้น
    - `openclaw doctor --repair` ใช้การแก้ไขที่แนะนำโดยไม่ถาม
    - `openclaw doctor --repair --force` เขียนทับ config ของ supervisor แบบกำหนดเอง
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` ทำให้ doctor เป็นแบบอ่านอย่างเดียวสำหรับวงจรชีวิต service ของ Gateway โดยยังคงรายงานสุขภาพของ service และเรียกใช้การซ่อมแซมที่ไม่ใช่ service แต่ข้ามการติดตั้ง/เริ่ม/รีสตาร์ต/bootstrap service การเขียน config ของ supervisor ใหม่ และการล้าง service แบบเดิม เพราะ supervisor ภายนอกเป็นเจ้าของวงจรชีวิตนั้น
    - บน Linux doctor จะไม่เขียนข้อมูลเมตาของคำสั่ง/entrypoint ใหม่ขณะที่ systemd gateway unit ที่ตรงกันกำลังทำงานอยู่ และยังละเว้น unit เพิ่มเติมที่คล้าย Gateway แบบไม่ใช่ legacy ที่ไม่ได้ใช้งานระหว่างการสแกน service ซ้ำ เพื่อไม่ให้ไฟล์ service คู่กันสร้างเสียงรบกวนจากการล้างข้อมูล
    - หาก token auth ต้องใช้ token และ `gateway.auth.token` จัดการโดย SecretRef การติดตั้ง/ซ่อมแซม service ของ doctor จะตรวจสอบ SecretRef แต่จะไม่คงค่าข้อความล้วนของ token ที่ resolve แล้วไว้ในข้อมูลเมตาสภาพแวดล้อมของ service ของ supervisor
    - Doctor ตรวจพบค่าสภาพแวดล้อมของ service ที่จัดการโดย `.env`/SecretRef ซึ่งการติดตั้ง LaunchAgent, systemd หรือ Windows Scheduled Task รุ่นเก่าฝังไว้ inline และเขียนข้อมูลเมตาของ service ใหม่เพื่อให้ค่าเหล่านั้นโหลดจากแหล่งรันไทม์แทนที่จะมาจาก definition ของ supervisor
    - Doctor ตรวจพบเมื่อคำสั่ง service ยังคงตรึง `--port` เก่าหลังจาก `gateway.port` เปลี่ยน และเขียนข้อมูลเมตาของ service ใหม่ให้ใช้พอร์ตปัจจุบัน
    - หาก token auth ต้องใช้ token และ SecretRef ของ token ที่กำหนดค่าไว้ยัง resolve ไม่ได้ doctor จะบล็อกพาธติดตั้ง/ซ่อมแซมพร้อมคำแนะนำที่นำไปทำได้
    - หากทั้ง `gateway.auth.token` และ `gateway.auth.password` ถูกกำหนดค่าไว้และไม่ได้ตั้งค่า `gateway.auth.mode` doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้ง mode อย่างชัดเจน
    - สำหรับ Linux user-systemd units การตรวจสอบ token drift ของ doctor ตอนนี้รวมทั้งแหล่ง `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบข้อมูลเมตา auth ของ service
    - การซ่อมแซม service ของ Doctor จะปฏิเสธการเขียนใหม่ หยุด หรือรีสตาร์ต service ของ Gateway จากไบนารี OpenClaw ที่เก่ากว่า เมื่อ config ถูกเขียนครั้งล่าสุดโดยเวอร์ชันที่ใหม่กว่า ดู [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)
    - คุณสามารถบังคับเขียนใหม่ทั้งหมดได้เสมอผ่าน `openclaw gateway install --force`

  </Accordion>
  <Accordion title="16. การวินิจฉัยรันไทม์ Gateway + พอร์ต">
    Doctor ตรวจสอบรันไทม์ของ service (PID, สถานะออกล่าสุด) และเตือนเมื่อ service ติดตั้งแล้วแต่ไม่ได้ทำงานจริง นอกจากนี้ยังตรวจหาการชนกันของพอร์ตบนพอร์ต Gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (Gateway ทำงานอยู่แล้ว, SSH tunnel)
  </Accordion>
  <Accordion title="17. แนวทางปฏิบัติที่ดีสำหรับรันไทม์ Gateway">
    Doctor เตือนเมื่อ service ของ Gateway ทำงานบน Bun หรือพาธ Node ที่จัดการเวอร์ชัน (`nvm`, `fnm`, `volta`, `asdf` ฯลฯ) ช่องทาง WhatsApp + Telegram ต้องใช้ Node และพาธของตัวจัดการเวอร์ชันอาจเสียหลังอัปเกรด เพราะ service ไม่ได้โหลด shell init ของคุณ Doctor เสนอให้ย้ายไปใช้การติดตั้ง Node ของระบบเมื่อพร้อมใช้งาน (Homebrew/apt/choco)

    LaunchAgents ของ macOS ที่ติดตั้งหรือซ่อมแซมใหม่จะใช้ PATH ของระบบแบบ canonical (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) แทนการคัดลอก PATH ของ shell แบบโต้ตอบ ดังนั้น Volta, asdf, fnm, pnpm และไดเรกทอรีของตัวจัดการเวอร์ชันอื่น ๆ จะไม่เปลี่ยนว่า child process ของ Node จะ resolve ตัวใด service บน Linux ยังคงเก็บ root ของสภาพแวดล้อมแบบชัดเจน (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) และไดเรกทอรี user-bin ที่เสถียร แต่ไดเรกทอรี fallback ของตัวจัดการเวอร์ชันที่คาดเดาจะถูกเขียนลงใน PATH ของ service เฉพาะเมื่อไดเรกทอรีเหล่านั้นมีอยู่บนดิสก์เท่านั้น

  </Accordion>
  <Accordion title="18. การเขียน Config + ข้อมูลเมตาของ wizard">
    Doctor คงการเปลี่ยนแปลง config ใด ๆ และประทับข้อมูลเมตาของ wizard เพื่อบันทึกการเรียกใช้ doctor
  </Accordion>
  <Accordion title="19. เคล็ดลับ workspace (การสำรองข้อมูล + ระบบหน่วยความจำ)">
    Doctor แนะนำระบบหน่วยความจำของ workspace เมื่อไม่มี และพิมพ์เคล็ดลับการสำรองข้อมูลหาก workspace ยังไม่ได้อยู่ภายใต้ git

    ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคู่มือฉบับเต็มเกี่ยวกับโครงสร้าง workspace และการสำรองข้อมูลด้วย git (แนะนำ GitHub หรือ GitLab แบบส่วนตัว)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
