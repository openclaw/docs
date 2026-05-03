---
read_when:
    - การเพิ่มหรือแก้ไขไมเกรชันของ doctor
    - การแนะนำการเปลี่ยนแปลงการกำหนดค่าที่ไม่เข้ากันย้อนหลัง
sidebarTitle: Doctor
summary: 'คำสั่ง Doctor: การตรวจสอบสถานะระบบ การย้ายข้อมูลการกำหนดค่า และขั้นตอนการซ่อมแซม'
title: ตัวตรวจสอบสุขภาพ
x-i18n:
    generated_at: "2026-05-03T10:11:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20b2cb3c3cd88e01050cb285a08a020603642439bd35668b7414360801fc03ff
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` คือเครื่องมือซ่อมแซม + ย้ายข้อมูลสำหรับ OpenClaw โดยจะแก้ไข config/state ที่ล้าสมัย ตรวจสอบสุขภาพ และให้ขั้นตอนการซ่อมแซมที่นำไปทำได้จริง

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

    ยอมรับค่าเริ่มต้นโดยไม่ถามยืนยัน (รวมถึงขั้นตอนซ่อม restart/service/sandbox เมื่อใช้ได้)

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    ใช้การซ่อมแซมที่แนะนำโดยไม่ถามยืนยัน (ซ่อมแซม + รีสตาร์ตในจุดที่ปลอดภัย)

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

    รันโดยไม่มีพรอมป์ และใช้เฉพาะการย้ายข้อมูลที่ปลอดภัย (การปรับ config ให้เป็นมาตรฐาน + การย้าย state บนดิสก์) ข้ามการกระทำ restart/service/sandbox ที่ต้องให้มนุษย์ยืนยัน การย้าย state แบบ legacy จะรันอัตโนมัติเมื่อตรวจพบ

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    สแกนบริการของระบบเพื่อหา gateway ที่ติดตั้งเพิ่ม (launchd/systemd/schtasks)

  </Tab>
</Tabs>

ถ้าคุณต้องการตรวจทานการเปลี่ยนแปลงก่อนเขียน ให้เปิดไฟล์ config ก่อน:

```bash
cat ~/.openclaw/openclaw.json
```

## สิ่งที่ทำ (สรุป)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - การอัปเดตก่อนเริ่มแบบไม่บังคับสำหรับการติดตั้งผ่าน git (เฉพาะแบบ interactive)
    - การตรวจความสดใหม่ของโปรโตคอล UI (สร้าง Control UI ใหม่เมื่อ schema ของโปรโตคอลใหม่กว่า)
    - การตรวจสุขภาพ + พรอมป์ให้รีสตาร์ต
    - สรุปสถานะ Skills (eligible/missing/blocked) และสถานะ Plugin

  </Accordion>
  <Accordion title="Config and migrations">
    - การปรับ config แบบ legacy ให้เป็นมาตรฐาน
    - การย้าย config ของ Talk จากฟิลด์ legacy แบบแบน `talk.*` ไปเป็น `talk.provider` + `talk.providers.<provider>`
    - การตรวจการย้าย browser สำหรับ config ของ Chrome extension แบบ legacy และความพร้อมของ Chrome MCP
    - คำเตือน override ของ provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`)
    - คำเตือนการ shadow ของ Codex OAuth (`models.providers.openai-codex`)
    - การตรวจข้อกำหนดเบื้องต้นของ OAuth TLS สำหรับโปรไฟล์ OpenAI Codex OAuth
    - คำเตือน allowlist ของ Plugin/tool เมื่อ `plugins.allow` จำกัดมาก แต่ policy ของ tool ยังขอ wildcard หรือ tool ที่ Plugin เป็นเจ้าของ
    - การย้าย state บนดิสก์แบบ legacy (sessions/agent dir/WhatsApp auth)
    - การย้ายคีย์สัญญา manifest ของ Plugin แบบ legacy (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
    - การย้าย cron store แบบ legacy (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบนสุด, payload `provider`, งาน webhook fallback แบบง่าย `notify: true`)
    - การย้าย agent runtime-policy แบบ legacy ไปเป็น `agents.defaults.agentRuntime` และ `agents.list[].agentRuntime`
    - การล้าง config ของ Plugin ที่ค้างเมื่อเปิดใช้ plugins; เมื่อ `plugins.enabled=false` การอ้างอิง Plugin ที่ค้างจะถือเป็น containment config ที่ไม่ทำงานและจะถูกเก็บไว้

  </Accordion>
  <Accordion title="State and integrity">
    - การตรวจไฟล์ล็อกของ session และการล้างล็อกที่ค้าง
    - การซ่อมแซม transcript ของ session สำหรับ branch prompt-rewrite ที่ซ้ำกันซึ่งสร้างโดย build 2026.4.24 ที่ได้รับผลกระทบ
    - การตรวจ tombstone สำหรับการกู้คืนจากการรีสตาร์ตของ subagent ที่ค้าง พร้อมรองรับ `--fix` เพื่อล้าง flag การกู้คืนที่ถูกยกเลิกและค้างอยู่ เพื่อให้ startup ไม่ถือว่า child ถูก restart-aborted ต่อไป
    - การตรวจความสมบูรณ์ของ state และสิทธิ์ (sessions, transcripts, state dir)
    - การตรวจสิทธิ์ไฟล์ config (chmod 600) เมื่อรันในเครื่อง
    - สุขภาพ auth ของโมเดล: ตรวจการหมดอายุของ OAuth, รีเฟรช token ที่ใกล้หมดอายุได้, และรายงานสถานะ cooldown/disabled ของ auth-profile
    - การตรวจ workspace dir เพิ่มเติม (`~/openclaw`)

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - การซ่อมแซม image ของ sandbox เมื่อเปิดใช้ sandboxing
    - การย้ายบริการแบบ legacy และการตรวจ gateway เพิ่มเติม
    - การย้าย state legacy ของ channel Matrix (ในโหมด `--fix` / `--repair`)
    - การตรวจ runtime ของ Gateway (ติดตั้ง service แล้วแต่ไม่ทำงาน; label ของ launchd ที่แคชไว้)
    - คำเตือนสถานะ channel (probe จาก gateway ที่กำลังทำงาน)
    - การ audit config ของ supervisor (launchd/systemd/schtasks) พร้อมการซ่อมแซมแบบไม่บังคับ
    - การล้างสภาพแวดล้อม proxy แบบ embedded สำหรับบริการ gateway ที่จับค่า `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` ของ shell ระหว่างติดตั้งหรืออัปเดต
    - การตรวจแนวทางปฏิบัติที่ดีของ runtime Gateway (Node เทียบกับ Bun, path ของ version-manager)
    - การวินิจฉัย port collision ของ Gateway (ค่าเริ่มต้น `18789`)

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - คำเตือนด้านความปลอดภัยสำหรับ policy ของ DM ที่เปิดกว้าง
    - การตรวจ auth ของ Gateway สำหรับโหมด token ในเครื่อง (เสนอการสร้าง token เมื่อไม่มีแหล่ง token; ไม่เขียนทับ config token SecretRef)
    - การตรวจปัญหา device pairing (คำขอจับคู่ครั้งแรกที่ค้างอยู่, การอัปเกรด role/scope ที่ค้างอยู่, drift ของแคช device-token ในเครื่องที่ค้าง, และ drift ของ auth ใน paired-record)

  </Accordion>
  <Accordion title="Workspace and shell">
    - การตรวจ systemd linger บน Linux
    - การตรวจขนาดไฟล์ bootstrap ของ workspace (คำเตือน truncation/ใกล้ถึงขีดจำกัดสำหรับไฟล์ context)
    - การตรวจความพร้อมของ Skills สำหรับ agent เริ่มต้น; รายงาน skills ที่อนุญาตแต่ขาด bins, env, config หรือข้อกำหนด OS และ `--fix` สามารถปิด skills ที่ใช้ไม่ได้ใน `skills.entries`
    - การตรวจสถานะ shell completion และติดตั้ง/อัปเกรดอัตโนมัติ
    - การตรวจความพร้อมของ provider สำหรับ embedding ใน memory search (โมเดลในเครื่อง, API key ระยะไกล, หรือ binary QMD)
    - การตรวจ source install (pnpm workspace mismatch, UI assets หาย, binary tsx หาย)
    - เขียน config ที่อัปเดต + metadata ของ wizard

  </Accordion>
</AccordionGroup>

## Backfill และ reset ของ Dreams UI

ฉาก Dreams ใน Control UI มี action **Backfill**, **Reset** และ **Clear Grounded** สำหรับ workflow grounded dreaming action เหล่านี้ใช้เมธอด RPC แบบ doctor-style ของ gateway แต่ **ไม่ใช่** ส่วนหนึ่งของการซ่อมแซม/ย้ายข้อมูลใน CLI `openclaw doctor`

สิ่งที่ action เหล่านี้ทำ:

- **Backfill** สแกนไฟล์ `memory/YYYY-MM-DD.md` ย้อนหลังใน workspace ที่ใช้งานอยู่ รัน pass ไดอารี grounded REM และเขียนรายการ backfill ที่ย้อนกลับได้ลงใน `DREAMS.md`
- **Reset** ลบเฉพาะรายการไดอารี backfill ที่ทำเครื่องหมายไว้จาก `DREAMS.md`
- **Clear Grounded** ลบเฉพาะรายการ short-term แบบ grounded-only ที่ staged แล้ว ซึ่งมาจาก historical replay และยังไม่ได้สะสม live recall หรือ daily support

สิ่งที่ action เหล่านี้ **ไม่** ทำด้วยตัวเอง:

- ไม่แก้ไข `MEMORY.md`
- ไม่รันการย้ายข้อมูลของ doctor แบบเต็ม
- ไม่ stage grounded candidates ไปยัง live short-term promotion store โดยอัตโนมัติ เว้นแต่คุณจะรัน path ของ CLI แบบ staged อย่างชัดเจนก่อน

ถ้าคุณต้องการให้ grounded historical replay มีผลต่อ lane การ promote เชิงลึกตามปกติ ให้ใช้ flow ของ CLI แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

คำสั่งนี้จะ stage grounded durable candidates ไปยัง short-term dreaming store โดยยังคงให้ `DREAMS.md` เป็นพื้นผิวสำหรับ review

## พฤติกรรมโดยละเอียดและเหตุผล

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    ถ้านี่เป็น git checkout และ doctor กำลังรันแบบ interactive จะเสนอให้อัปเดต (fetch/rebase/build) ก่อนรัน doctor
  </Accordion>
  <Accordion title="1. Config normalization">
    ถ้า config มีรูปร่างค่าจาก legacy (เช่น `messages.ackReaction` โดยไม่มี override เฉพาะ channel) doctor จะปรับให้เป็น schema ปัจจุบัน

    ซึ่งรวมถึงฟิลด์แบนของ Talk แบบ legacy ด้วย config สาธารณะปัจจุบันของ Talk คือ `talk.provider` + `talk.providers.<provider>` Doctor จะเขียนรูปร่างเก่า `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ใหม่เข้าไปใน map ของ provider

    Doctor ยังเตือนเมื่อ `plugins.allow` ไม่ว่างและ policy ของ tool ใช้
    รายการ tool แบบ wildcard หรือที่ Plugin เป็นเจ้าของ `tools.allow: ["*"]` จะ match เฉพาะ tools
    จาก plugins ที่โหลดจริงเท่านั้น; ไม่ได้ข้าม allowlist เฉพาะของ Plugin

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    เมื่อ config มีคีย์ที่เลิกใช้แล้ว คำสั่งอื่นจะปฏิเสธการรันและขอให้คุณรัน `openclaw doctor`

    Doctor จะ:

    - อธิบายว่าพบคีย์ legacy ใดบ้าง
    - แสดงการย้ายข้อมูลที่ใช้
    - เขียน `~/.openclaw/openclaw.json` ใหม่ด้วย schema ที่อัปเดตแล้ว

    Gateway ยังรันการย้ายข้อมูลของ doctor อัตโนมัติเมื่อเริ่มต้น หากตรวจพบรูปแบบ config แบบ legacy ดังนั้น config ที่ค้างจะถูกซ่อมโดยไม่ต้องทำเอง การย้าย store ของ Cron job จัดการโดย `openclaw doctor --fix`

    การย้ายข้อมูลปัจจุบัน:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - การกำหนดค่าของช่องทางที่ตั้งค่าไว้ซึ่งไม่มีนโยบายการตอบกลับแบบมองเห็นได้ → `messages.groupChat.visibleReplies: "message_tool"`
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
    - สำหรับช่องทางที่มี `accounts` แบบตั้งชื่อ แต่ยังมีค่าช่องทางระดับบนสุดแบบบัญชีเดียวหลงเหลืออยู่ ให้ย้ายค่าที่อยู่ในขอบเขตบัญชีเหล่านั้นเข้าไปในบัญชีที่เลื่อนขึ้นมาซึ่งเลือกไว้สำหรับช่องทางนั้น (`accounts.default` สำหรับช่องทางส่วนใหญ่; Matrix สามารถคงเป้าหมายที่ตั้งชื่อไว้/ค่าเริ่มต้นเดิมที่ตรงกันได้)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - ลบ `agents.defaults.llm`; ใช้ `models.providers.<id>.timeoutSeconds` สำหรับการหมดเวลาของผู้ให้บริการ/โมเดลที่ทำงานช้า
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - ลบ `browser.relayBindHost` (การตั้งค่า relay ของ extension แบบเดิม)
    - `models.providers.*.api: "openai"` แบบเดิม → `"openai-completions"` (การเริ่มต้น Gateway จะข้ามผู้ให้บริการที่ `api` ถูกตั้งเป็นค่า enum ในอนาคตหรือที่ไม่รู้จัก แทนที่จะล้มเหลวแบบปิดกั้น)

    คำเตือนของ Doctor ยังรวมคำแนะนำบัญชีเริ่มต้นสำหรับช่องทางแบบหลายบัญชีด้วย:

    - ถ้ามีการตั้งค่ารายการ `channels.<channel>.accounts` ตั้งแต่สองรายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default` Doctor จะเตือนว่าการกำหนดเส้นทางสำรองอาจเลือกบัญชีที่ไม่คาดคิด
    - ถ้า `channels.<channel>.defaultAccount` ถูกตั้งเป็น ID บัญชีที่ไม่รู้จัก Doctor จะเตือนและแสดงรายการ ID บัญชีที่ตั้งค่าไว้

  </Accordion>
  <Accordion title="2b. การแทนที่ผู้ให้บริการ OpenCode">
    ถ้าคุณเพิ่ม `models.providers.opencode`, `opencode-zen` หรือ `opencode-go` ด้วยตนเอง ค่านั้นจะแทนที่แค็ตตาล็อก OpenCode ในตัวจาก `@mariozechner/pi-ai` ซึ่งอาจบังคับให้โมเดลไปอยู่บน API ที่ไม่ถูกต้องหรือทำให้ต้นทุนเป็นศูนย์ Doctor จะเตือนเพื่อให้คุณลบการแทนที่และกู้คืนการกำหนดเส้นทาง API พร้อมต้นทุนแยกตามโมเดล
  </Accordion>
  <Accordion title="2c. การย้าย Browser และความพร้อมของ Chrome MCP">
    ถ้าการกำหนดค่า browser ของคุณยังชี้ไปยังพาธ Chrome extension ที่ถูกลบแล้ว Doctor จะปรับให้เป็นโมเดลแนบ Chrome MCP แบบ host-local ปัจจุบัน:

    - `browser.profiles.*.driver: "extension"` กลายเป็น `"existing-session"`
    - `browser.relayBindHost` ถูกลบ

    Doctor ยังตรวจสอบพาธ Chrome MCP แบบ host-local เมื่อคุณใช้ `defaultProfile: "user"` หรือโปรไฟล์ `existing-session` ที่กำหนดค่าไว้:

    - ตรวจสอบว่ามีการติดตั้ง Google Chrome บนโฮสต์เดียวกันสำหรับโปรไฟล์เชื่อมต่ออัตโนมัติเริ่มต้นหรือไม่
    - ตรวจสอบเวอร์ชัน Chrome ที่ตรวจพบและเตือนเมื่อเป็นเวอร์ชันต่ำกว่า Chrome 144
    - เตือนให้คุณเปิดใช้ remote debugging ในหน้า inspect ของ browser (เช่น `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` หรือ `edge://inspect/#remote-debugging`)

    Doctor ไม่สามารถเปิดใช้การตั้งค่าฝั่ง Chrome ให้คุณได้ Chrome MCP แบบ host-local ยังต้องใช้:

    - browser ที่ใช้ Chromium 144+ บนโฮสต์ gateway/node
    - browser ที่กำลังทำงานอยู่ในเครื่อง
    - เปิดใช้ remote debugging ใน browser นั้น
    - อนุมัติพรอมป์ความยินยอมการแนบครั้งแรกใน browser

    ความพร้อมในที่นี้เกี่ยวกับข้อกำหนดเบื้องต้นของการแนบแบบ local เท่านั้น Existing-session ยังคงใช้ขีดจำกัดเส้นทาง Chrome MCP ปัจจุบัน; เส้นทางขั้นสูงอย่าง `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และการทำงานแบบ batch ยังต้องใช้ browser ที่จัดการโดยระบบหรือโปรไฟล์ CDP ดิบ

    การตรวจสอบนี้ **ไม่** ใช้กับ Docker, sandbox, remote-browser หรือโฟลว์ headless อื่น ๆ สิ่งเหล่านั้นยังคงใช้ CDP ดิบ

  </Accordion>
  <Accordion title="2d. ข้อกำหนดเบื้องต้นของ OAuth TLS">
    เมื่อมีการตั้งค่าโปรไฟล์ OpenAI Codex OAuth Doctor จะตรวจ endpoint การอนุญาตของ OpenAI เพื่อยืนยันว่า stack TLS ของ Node/OpenSSL ในเครื่องสามารถตรวจสอบ certificate chain ได้ ถ้าการตรวจล้มเหลวด้วยข้อผิดพลาดใบรับรอง (เช่น `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ใบรับรองหมดอายุ หรือใบรับรองที่ลงนามเอง) Doctor จะแสดงคำแนะนำการแก้ไขเฉพาะแพลตฟอร์ม บน macOS ที่ใช้ Homebrew Node การแก้มักเป็น `brew postinstall ca-certificates` เมื่อใช้ `--deep` การตรวจจะทำงานแม้ Gateway จะปกติดี
  </Accordion>
  <Accordion title="2e. การแทนที่ผู้ให้บริการ Codex OAuth">
    ถ้าคุณเคยเพิ่มการตั้งค่า transport ของ OpenAI แบบเดิมไว้ใต้ `models.providers.openai-codex` การตั้งค่าเหล่านั้นอาจบดบังพาธผู้ให้บริการ Codex OAuth ในตัวที่ release ใหม่กว่าใช้โดยอัตโนมัติ Doctor จะเตือนเมื่อพบการตั้งค่า transport เก่าเหล่านั้นร่วมกับ Codex OAuth เพื่อให้คุณลบหรือเขียนการแทนที่ transport ที่ค้างอยู่ใหม่ และได้พฤติกรรมการกำหนดเส้นทาง/สำรองในตัวกลับมา พร็อกซีแบบกำหนดเองและการแทนที่เฉพาะ header ยังรองรับอยู่และจะไม่ทำให้เกิดคำเตือนนี้
  </Accordion>
  <Accordion title="2f. คำเตือนเส้นทาง Plugin Codex">
    เมื่อเปิดใช้ Plugin Codex ที่รวมมาให้ Doctor จะตรวจด้วยว่า ref โมเดลหลัก `openai-codex/*` ยัง resolve ผ่าน runner PI เริ่มต้นหรือไม่ ชุดค่านี้ใช้ได้เมื่อคุณต้องการใช้ auth Codex OAuth/subscription ผ่าน PI แต่สับสนกับ harness app-server ของ Codex แบบ native ได้ง่าย Doctor จะเตือนและชี้ไปยังรูปแบบ app-server ที่ชัดเจน: `openai/*` พร้อม `agentRuntime.id: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex`

    Doctor ไม่ซ่อมแซมสิ่งนี้โดยอัตโนมัติ เพราะทั้งสองเส้นทางใช้ได้:

    - `openai-codex/*` + PI หมายถึง "ใช้ auth Codex OAuth/subscription ผ่าน runner ปกติของ OpenClaw"
    - `openai/*` + `agentRuntime.id: "codex"` หมายถึง "รันเทิร์นที่ฝังอยู่ผ่าน app-server ของ Codex แบบ native"
    - `/codex ...` หมายถึง "ควบคุมหรือ bind การสนทนา Codex แบบ native จากแชต"
    - `/acp ...` หรือ `runtime: "acp"` หมายถึง "ใช้อะแดปเตอร์ ACP/acpx ภายนอก"

    ถ้าคำเตือนปรากฏ ให้เลือกเส้นทางที่คุณตั้งใจใช้และแก้ไขการกำหนดค่าด้วยตนเอง คงคำเตือนไว้ตามเดิมเมื่อ PI Codex OAuth เป็นสิ่งที่ตั้งใจไว้

  </Accordion>
  <Accordion title="3. การย้ายสถานะเดิม (เลย์เอาต์บนดิสก์)">
    Doctor สามารถย้ายเลย์เอาต์บนดิสก์รุ่นเก่าเข้าสู่โครงสร้างปัจจุบันได้:

    - ที่เก็บ sessions + transcripts:
      - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
    - ไดเรกทอรี Agent:
      - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
    - สถานะ auth ของ WhatsApp (Baileys):
      - จาก `~/.openclaw/credentials/*.json` แบบเดิม (ยกเว้น `oauth.json`)
      - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID บัญชีเริ่มต้น: `default`)

    การย้ายเหล่านี้เป็นแบบพยายามให้ดีที่สุดและทำซ้ำได้อย่างปลอดภัย; Doctor จะส่งคำเตือนเมื่อทิ้งโฟลเดอร์เดิมบางรายการไว้เป็นข้อมูลสำรอง Gateway/CLI ยังย้าย sessions + ไดเรกทอรี agent แบบเดิมโดยอัตโนมัติเมื่อเริ่มต้น เพื่อให้ประวัติ/auth/models ไปอยู่ในพาธแยกตาม agent โดยไม่ต้องรัน doctor ด้วยตนเอง WhatsApp auth ตั้งใจให้ย้ายผ่าน `openclaw doctor` เท่านั้น ตอนนี้การปรับ talk provider/provider-map ให้เป็นปกติเปรียบเทียบด้วยความเท่ากันเชิงโครงสร้าง ดังนั้น diff ที่ต่างกันเฉพาะลำดับ key จะไม่ทำให้เกิดการเปลี่ยนแปลง `doctor --fix` แบบไม่ทำอะไรซ้ำอีกต่อไป

  </Accordion>
  <Accordion title="3a. การย้าย manifest Plugin แบบเดิม">
    Doctor สแกน manifest ของ Plugin ที่ติดตั้งทั้งหมดเพื่อหาคีย์ความสามารถระดับบนสุดที่เลิกใช้แล้ว (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) เมื่อพบ จะเสนอให้ย้ายคีย์เหล่านั้นเข้าไปในอ็อบเจ็กต์ `contracts` และเขียนไฟล์ manifest ใหม่ในที่เดิม การย้ายนี้ทำซ้ำได้อย่างปลอดภัย; ถ้าคีย์ `contracts` มีค่าเดียวกันอยู่แล้ว คีย์เดิมจะถูกลบโดยไม่ทำซ้ำข้อมูล
  </Accordion>
  <Accordion title="3b. การย้ายที่เก็บ Cron แบบเดิม">
    Doctor ยังตรวจที่เก็บงาน cron (`~/.openclaw/cron/jobs.json` ตามค่าเริ่มต้น หรือ `cron.store` เมื่อถูกแทนที่) เพื่อหารูปร่างงานเก่าที่ยังยอมรับโดย scheduler เพื่อความเข้ากันได้ย้อนหลัง

    การล้าง Cron ปัจจุบันรวมถึง:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - ฟิลด์ payload ระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
    - ฟิลด์ delivery ระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias การส่งของ `provider` ใน payload → `delivery.channel` ที่ชัดเจน
    - งาน fallback webhook แบบเดิมอย่างง่าย `notify: true` → `delivery.mode="webhook"` ที่ชัดเจนพร้อม `delivery.to=cron.webhook`

    Doctor จะย้ายงาน `notify: true` โดยอัตโนมัติก็ต่อเมื่อทำได้โดยไม่เปลี่ยนพฤติกรรม ถ้างานหนึ่งผสม fallback notify แบบเดิมกับโหมด delivery ที่ไม่ใช่ webhook ที่มีอยู่ Doctor จะเตือนและปล่อยงานนั้นไว้ให้ตรวจทานด้วยตนเอง

    บน Linux, Doctor ยังเตือนเมื่อ crontab ของผู้ใช้ยังเรียกใช้ `~/.openclaw/bin/ensure-whatsapp.sh` แบบเดิม สคริปต์ host-local นี้ไม่ได้รับการดูแลโดย OpenClaw ปัจจุบันและอาจเขียนข้อความ `Gateway inactive` ที่ไม่จริงลงใน `~/.openclaw/logs/whatsapp-health.log` เมื่อ cron ไม่สามารถเข้าถึง systemd user bus ได้ ลบรายการ crontab ที่ค้างอยู่ด้วย `crontab -e`; ใช้ `openclaw channels status --probe`, `openclaw doctor` และ `openclaw gateway status` สำหรับการตรวจสุขภาพปัจจุบัน

  </Accordion>
  <Accordion title="3c. การล้างล็อกของเซสชัน">
    Doctor สแกนไดเรกทอรีเซสชันของเอเจนต์ทุกตัวเพื่อหาไฟล์ write-lock ที่ค้างอยู่ — ไฟล์ที่ถูกทิ้งไว้เมื่อเซสชันออกอย่างผิดปกติ สำหรับไฟล์ล็อกแต่ละไฟล์ที่พบ จะรายงาน: พาธ, PID, ว่า PID ยังมีชีวิตอยู่หรือไม่, อายุของล็อก และถือว่าค้างหรือไม่ (PID ตายแล้วหรือเก่ากว่า 30 นาที) ในโหมด `--fix` / `--repair` จะลบไฟล์ล็อกที่ค้างโดยอัตโนมัติ มิฉะนั้นจะพิมพ์หมายเหตุและบอกให้คุณรันซ้ำด้วย `--fix`
  </Accordion>
  <Accordion title="3d. การซ่อมแซมสาขาทรานสคริปต์ของเซสชัน">
    Doctor สแกนไฟล์ JSONL ของเซสชันเอเจนต์เพื่อหารูปแบบสาขาที่ซ้ำกันซึ่งเกิดจากบั๊กการเขียนพรอมป์ทรานสคริปต์ใหม่ใน 2026.4.24: เทิร์นผู้ใช้ที่ถูกละทิ้งซึ่งมีบริบทรันไทม์ภายในของ OpenClaw พร้อมกับ sibling ที่ใช้งานอยู่ซึ่งมีพรอมป์ผู้ใช้ที่มองเห็นได้เหมือนกัน ในโหมด `--fix` / `--repair` doctor จะสำรองไฟล์ที่ได้รับผลกระทบแต่ละไฟล์ไว้ข้างไฟล์ต้นฉบับ และเขียนทรานสคริปต์ใหม่ไปยังสาขาที่ใช้งานอยู่ เพื่อให้ประวัติ Gateway และตัวอ่านหน่วยความจำไม่เห็นเทิร์นซ้ำอีกต่อไป
  </Accordion>
  <Accordion title="4. การตรวจสอบความสมบูรณ์ของสถานะ (การคงอยู่ของเซสชัน, การกำหนดเส้นทาง และความปลอดภัย)">
    ไดเรกทอรีสถานะคือแกนควบคุมการทำงาน หากหายไป คุณจะสูญเสียเซสชัน ข้อมูลประจำตัว บันทึก และการกำหนดค่า (เว้นแต่คุณมีข้อมูลสำรองอยู่ที่อื่น)

    Doctor ตรวจสอบ:

    - **ไดเรกทอรีสถานะหายไป**: เตือนเกี่ยวกับการสูญเสียสถานะอย่างร้ายแรง แจ้งให้สร้างไดเรกทอรีใหม่ และเตือนว่ากู้ข้อมูลที่หายไปไม่ได้
    - **สิทธิ์ของไดเรกทอรีสถานะ**: ตรวจสอบความสามารถในการเขียน เสนอให้ซ่อมสิทธิ์ (และแสดงคำแนะนำ `chown` เมื่อตรวจพบว่าเจ้าของ/กลุ่มไม่ตรงกัน)
    - **ไดเรกทอรีสถานะที่ซิงก์กับคลาวด์บน macOS**: เตือนเมื่อสถานะ resolve อยู่ใต้ iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ `~/Library/CloudStorage/...` เพราะพาธที่มีการซิงก์รองรับอาจทำให้ I/O ช้าลงและเกิดการแข่งขันของล็อก/การซิงก์
    - **ไดเรกทอรีสถานะบน Linux SD หรือ eMMC**: เตือนเมื่อสถานะ resolve ไปยังแหล่งเมานต์ `mmcblk*` เพราะ random I/O ที่อยู่บน SD หรือ eMMC อาจช้ากว่าและสึกหรอเร็วขึ้นภายใต้การเขียนเซสชันและข้อมูลประจำตัว
    - **ไดเรกทอรีเซสชันหายไป**: ต้องมี `sessions/` และไดเรกทอรีที่เก็บเซสชันเพื่อคงประวัติไว้และหลีกเลี่ยงแครช `ENOENT`
    - **ทรานสคริปต์ไม่ตรงกัน**: เตือนเมื่อรายการเซสชันล่าสุดมีไฟล์ทรานสคริปต์หายไป
    - **เซสชันหลัก "JSONL 1 บรรทัด"**: แจ้งเตือนเมื่อทรานสคริปต์หลักมีเพียงหนึ่งบรรทัด (ประวัติไม่ได้สะสม)
    - **ไดเรกทอรีสถานะหลายแห่ง**: เตือนเมื่อมีโฟลเดอร์ `~/.openclaw` หลายแห่งข้ามไดเรกทอรี home หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (ประวัติอาจแยกระหว่างการติดตั้ง)
    - **ตัวเตือนโหมดรีโมต**: หาก `gateway.mode=remote` doctor จะเตือนให้คุณรันบนโฮสต์รีโมต (สถานะอยู่ที่นั่น)
    - **สิทธิ์ของไฟล์กำหนดค่า**: เตือนหาก `~/.openclaw/openclaw.json` สามารถอ่านได้โดยกลุ่ม/ทุกคน และเสนอให้ปรับให้เข้มงวดเป็น `600`

  </Accordion>
  <Accordion title="5. สุขภาพการยืนยันตัวตนของโมเดล (OAuth หมดอายุ)">
    Doctor ตรวจสอบโปรไฟล์ OAuth ใน auth store เตือนเมื่อโทเคนกำลังจะหมดอายุ/หมดอายุแล้ว และสามารถรีเฟรชได้เมื่อปลอดภัย หากโปรไฟล์ OAuth/โทเคนของ Anthropic เก่าเกินไป จะแนะนำคีย์ Anthropic API หรือพาธ setup-token ของ Anthropic พรอมป์รีเฟรชจะปรากฏเฉพาะเมื่อรันแบบโต้ตอบ (TTY); `--non-interactive` จะข้ามความพยายามรีเฟรช

    เมื่อการรีเฟรช OAuth ล้มเหลวถาวร (เช่น `refresh_token_reused`, `invalid_grant` หรือ provider แจ้งให้ลงชื่อเข้าใช้อีกครั้ง) doctor จะรายงานว่าต้องยืนยันตัวตนใหม่ และพิมพ์คำสั่ง `openclaw models auth login --provider ...` ที่ต้องรันอย่างชัดเจน

    Doctor ยังรายงานโปรไฟล์ auth ที่ใช้งานไม่ได้ชั่วคราวเนื่องจาก:

    - cooldown สั้น ๆ (rate limit/timeout/auth failure)
    - การปิดใช้นานขึ้น (billing/credit failure)

  </Accordion>
  <Accordion title="6. การตรวจสอบโมเดลของ hooks">
    หากตั้งค่า `hooks.gmail.model` ไว้ doctor จะตรวจสอบการอ้างอิงโมเดลกับแคตตาล็อกและ allowlist และเตือนเมื่อ resolve ไม่ได้หรือไม่อนุญาต
  </Accordion>
  <Accordion title="7. การซ่อมแซมอิมเมจ sandbox">
    เมื่อเปิดใช้ sandboxing doctor จะตรวจสอบอิมเมจ Docker และเสนอให้ build หรือสลับไปใช้ชื่อ legacy หากอิมเมจปัจจุบันหายไป
  </Accordion>
  <Accordion title="7b. การล้างการติดตั้ง Plugin">
    Doctor ลบสถานะ staging ของ dependency ของ Plugin ที่สร้างโดย OpenClaw แบบ legacy ในโหมด `openclaw doctor --fix` / `openclaw doctor --repair` ซึ่งครอบคลุมราก dependency ที่สร้างไว้และค้างอยู่, ไดเรกทอรี install-stage เก่า และเศษไฟล์ในแพ็กเกจจากโค้ดซ่อม dependency ของ bundled-plugin รุ่นก่อนหน้า

    Doctor ยังสามารถติดตั้ง Plugin ที่ดาวน์โหลดได้ซ้ำเมื่อ config อ้างอิงถึง Plugin เหล่านั้น แต่ registry ของ Plugin ภายในเครื่องหาไม่พบ สำหรับการทำให้ bundled-plugin เป็นภายนอกใน 2026.5.2 doctor จะติดตั้ง Plugin ที่ดาวน์โหลดได้ซึ่ง config เดิมใช้อยู่โดยอัตโนมัติ จากนั้นอาศัย `meta.lastTouchedVersion` เพื่อรันรอบ release นั้นเพียงครั้งเดียว การเริ่มต้น Gateway และการโหลด config ใหม่จะไม่รัน package manager; การติดตั้ง Plugin ยังคงเป็นงาน doctor/install/update ที่ต้องทำอย่างชัดเจน

  </Accordion>
  <Accordion title="8. การย้ายบริการ Gateway และคำแนะนำการล้าง">
    Doctor ตรวจพบบริการ Gateway แบบ legacy (launchd/systemd/schtasks) และเสนอให้ลบออกและติดตั้งบริการ OpenClaw โดยใช้พอร์ต Gateway ปัจจุบัน นอกจากนี้ยังสแกนหาบริการที่คล้าย Gateway เพิ่มเติมและพิมพ์คำแนะนำการล้างได้ บริการ OpenClaw Gateway ที่ตั้งชื่อตามโปรไฟล์ถือเป็นบริการชั้นหนึ่งและจะไม่ถูกแจ้งว่าเป็น "ส่วนเกิน"

    บน Linux หากบริการ Gateway ระดับผู้ใช้หายไปแต่มีบริการ OpenClaw Gateway ระดับระบบอยู่ doctor จะไม่ติดตั้งบริการระดับผู้ใช้ตัวที่สองโดยอัตโนมัติ ตรวจสอบด้วย `openclaw gateway status --deep` หรือ `openclaw doctor --deep` จากนั้นลบตัวซ้ำหรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ system supervisor เป็นเจ้าของวงจรชีวิตของ Gateway

  </Accordion>
  <Accordion title="8b. การย้าย Startup Matrix">
    เมื่อบัญชีช่องทาง Matrix มีการย้ายสถานะ legacy ที่ค้างอยู่หรือดำเนินการได้ doctor (ในโหมด `--fix` / `--repair`) จะสร้าง snapshot ก่อนการย้าย จากนั้นรันขั้นตอนการย้ายแบบ best-effort: การย้ายสถานะ Matrix แบบ legacy และการเตรียม encrypted-state แบบ legacy ทั้งสองขั้นตอนไม่เป็นเหตุให้ล้มเหลวร้ายแรง ข้อผิดพลาดจะถูกบันทึกและการเริ่มต้นจะดำเนินต่อไป ในโหมดอ่านอย่างเดียว (`openclaw doctor` โดยไม่มี `--fix`) การตรวจสอบนี้จะถูกข้ามทั้งหมด
  </Accordion>
  <Accordion title="8c. การจับคู่อุปกรณ์และ auth drift">
    ตอนนี้ Doctor ตรวจสอบสถานะการจับคู่อุปกรณ์เป็นส่วนหนึ่งของรอบตรวจสุขภาพปกติ

    สิ่งที่รายงาน:

    - คำขอจับคู่ครั้งแรกที่ค้างอยู่
    - การอัปเกรดบทบาทที่ค้างอยู่สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การอัปเกรด scope ที่ค้างอยู่สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การซ่อมแซม public-key mismatch ซึ่ง device id ยังคงตรงกัน แต่ตัวตนอุปกรณ์ไม่ตรงกับเรกคอร์ดที่อนุมัติแล้ว
    - เรกคอร์ดที่จับคู่แล้วซึ่งไม่มีโทเคนที่ใช้งานอยู่สำหรับบทบาทที่อนุมัติ
    - โทเคนที่จับคู่แล้วซึ่ง scope drift ออกนอก baseline การจับคู่ที่อนุมัติ
    - รายการ device-token ที่แคชไว้ภายในเครื่องสำหรับเครื่องปัจจุบันซึ่งเก่ากว่าการหมุนโทเคนฝั่ง Gateway หรือมีเมตาดาต้า scope ที่ค้างอยู่

    Doctor จะไม่อนุมัติคำขอจับคู่หรือหมุนโทเคนอุปกรณ์โดยอัตโนมัติ แต่จะพิมพ์ขั้นตอนถัดไปที่ชัดเจนแทน:

    - ตรวจสอบคำขอที่ค้างอยู่ด้วย `openclaw devices list`
    - อนุมัติคำขอที่ระบุด้วย `openclaw devices approve <requestId>`
    - หมุนโทเคนใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
    - ลบและอนุมัติเรกคอร์ดที่ค้างใหม่ด้วย `openclaw devices remove <deviceId>`

    สิ่งนี้ปิดช่องโหว่ทั่วไป "จับคู่แล้วแต่ยังได้รับ pairing required": ตอนนี้ doctor แยกแยะการจับคู่ครั้งแรกจากการอัปเกรดบทบาท/scope ที่ค้างอยู่ และจาก token/device-identity drift ที่ค้าง

  </Accordion>
  <Accordion title="9. คำเตือนด้านความปลอดภัย">
    Doctor แสดงคำเตือนเมื่อ provider เปิดรับ DM โดยไม่มี allowlist หรือเมื่อนโยบายถูกกำหนดค่าในลักษณะที่อันตราย
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    หากรันเป็นบริการผู้ใช้ systemd doctor จะตรวจให้แน่ใจว่าเปิดใช้ lingering เพื่อให้ Gateway ยังทำงานต่อหลังจาก logout
  </Accordion>
  <Accordion title="11. สถานะ workspace (Skills, Plugin และไดเรกทอรี legacy)">
    Doctor พิมพ์สรุปสถานะ workspace สำหรับเอเจนต์เริ่มต้น:

    - **สถานะ Skills**: นับ Skills ที่มีสิทธิ์, ขาดข้อกำหนด และถูกบล็อกโดย allowlist
    - **ไดเรกทอรี workspace แบบ legacy**: เตือนเมื่อมี `~/openclaw` หรือไดเรกทอรี workspace แบบ legacy อื่นอยู่ควบคู่กับ workspace ปัจจุบัน
    - **สถานะ Plugin**: นับ Plugin ที่เปิดใช้/ปิดใช้/มีข้อผิดพลาด; แสดงรายการ ID ของ Plugin สำหรับข้อผิดพลาดใด ๆ; รายงานความสามารถของ bundle Plugin
    - **คำเตือนความเข้ากันได้ของ Plugin**: แจ้งเตือน Plugin ที่มีปัญหาความเข้ากันได้กับ runtime ปัจจุบัน
    - **การวินิจฉัย Plugin**: แสดงคำเตือนหรือข้อผิดพลาดขณะโหลดที่ปล่อยโดย registry ของ Plugin

  </Accordion>
  <Accordion title="11b. ขนาดไฟล์ bootstrap">
    Doctor ตรวจว่าไฟล์ bootstrap ของ workspace (เช่น `AGENTS.md`, `CLAUDE.md` หรือไฟล์บริบทอื่นที่ถูกฉีดเข้าไป) อยู่ใกล้หรือเกินงบประมาณตัวอักษรที่กำหนดไว้หรือไม่ โดยรายงานจำนวนตัวอักษร raw เทียบกับ injected ต่อไฟล์, เปอร์เซ็นต์การตัดทอน, สาเหตุการตัดทอน (`max/file` หรือ `max/total`) และจำนวนตัวอักษร injected ทั้งหมดในสัดส่วนของงบประมาณรวม เมื่อไฟล์ถูกตัดทอนหรือใกล้ถึงขีดจำกัด doctor จะพิมพ์เคล็ดลับสำหรับปรับ `agents.defaults.bootstrapMaxChars` และ `agents.defaults.bootstrapTotalMaxChars`
  </Accordion>
  <Accordion title="11d. การล้าง Plugin ช่องทางที่ค้าง">
    เมื่อ `openclaw doctor --fix` ลบ Plugin ช่องทางที่หายไป จะลบ config ที่ผูกกับช่องทางซึ่งค้างและอ้างอิง Plugin นั้นด้วย: รายการ `channels.<id>`, เป้าหมาย Heartbeat ที่ตั้งชื่อช่องทาง และ override `agents.*.models["<channel>/*"]` สิ่งนี้ป้องกัน boot loop ของ Gateway ที่ runtime ของช่องทางหายไปแล้วแต่ config ยังขอให้ Gateway bind กับมัน
  </Accordion>
  <Accordion title="11c. การเติมคำสั่งใน shell">
    Doctor ตรวจว่าได้ติดตั้ง tab completion สำหรับ shell ปัจจุบันหรือไม่ (zsh, bash, fish หรือ PowerShell):

    - หากโปรไฟล์ shell ใช้รูปแบบ dynamic completion ที่ช้า (`source <(openclaw completion ...)`) doctor จะอัปเกรดเป็นตัวแปรไฟล์แคชที่เร็วกว่า
    - หากตั้งค่า completion ในโปรไฟล์แล้วแต่ไฟล์แคชหายไป doctor จะสร้างแคชใหม่โดยอัตโนมัติ
    - หากไม่ได้ตั้งค่า completion เลย doctor จะถามให้ติดตั้ง (เฉพาะโหมดโต้ตอบ; ข้ามด้วย `--non-interactive`)

    รัน `openclaw completion --write-state` เพื่อสร้างแคชใหม่ด้วยตนเอง

  </Accordion>
  <Accordion title="12. การตรวจสอบ auth ของ Gateway (โทเคนภายในเครื่อง)">
    Doctor ตรวจสอบความพร้อมของ auth โทเคน Gateway ภายในเครื่อง

    - หากโหมดโทเคนต้องการโทเคนและไม่มีแหล่งโทเคน doctor จะเสนอให้สร้างหนึ่งรายการ
    - หาก `gateway.auth.token` จัดการโดย SecretRef แต่ไม่พร้อมใช้งาน doctor จะเตือนและไม่เขียนทับด้วย plaintext
    - `openclaw doctor --generate-gateway-token` บังคับการสร้างเฉพาะเมื่อไม่ได้กำหนดค่าโทเคน SecretRef

  </Accordion>
  <Accordion title="12b. การซ่อมแซมแบบอ่านอย่างเดียวที่รับรู้ SecretRef">
    โฟลว์การซ่อมแซมบางอย่างจำเป็นต้องตรวจสอบข้อมูลประจำตัวที่กำหนดค่าไว้โดยไม่ทำให้พฤติกรรม fail-fast ของ runtime อ่อนลง

    - ตอนนี้ `openclaw doctor --fix` ใช้โมเดลสรุป SecretRef แบบอ่านอย่างเดียวเดียวกับคำสั่งตระกูล status สำหรับการซ่อมแซม config แบบเจาะจง
    - ตัวอย่าง: การซ่อมแซม `allowFrom` / `groupAllowFrom` `@username` ของ Telegram จะพยายามใช้ข้อมูลประจำตัวของบอตที่กำหนดค่าไว้เมื่อมี
    - หากกำหนดค่าโทเคนบอต Telegram ผ่าน SecretRef แต่ไม่พร้อมใช้งานในพาธคำสั่งปัจจุบัน doctor จะรายงานว่าข้อมูลประจำตัวถูกกำหนดค่าแล้วแต่ไม่พร้อมใช้งาน และข้ามการ resolve อัตโนมัติแทนที่จะแครชหรือรายงานผิดว่าโทเคนหายไป

  </Accordion>
  <Accordion title="13. การตรวจสุขภาพ Gateway + การรีสตาร์ต">
    Doctor เรียกใช้การตรวจสุขภาพและเสนอให้รีสตาร์ต Gateway เมื่อดูเหมือนว่าไม่สมบูรณ์
  </Accordion>
  <Accordion title="13b. ความพร้อมของการค้นหาหน่วยความจำ">
    Doctor ตรวจสอบว่าผู้ให้บริการ embedding สำหรับการค้นหาหน่วยความจำที่กำหนดค่าไว้พร้อมสำหรับเอเจนต์เริ่มต้นหรือไม่ ลักษณะการทำงานขึ้นอยู่กับ backend และผู้ให้บริการที่กำหนดค่าไว้:

    - **QMD backend**: ตรวจสอบว่าไบนารี `qmd` พร้อมใช้งานและเริ่มทำงานได้หรือไม่ หากไม่พร้อม จะพิมพ์คำแนะนำการแก้ไขรวมถึงแพ็กเกจ npm และตัวเลือกพาธไบนารีแบบกำหนดเอง
    - **ผู้ให้บริการภายในเครื่องแบบระบุชัดเจน**: ตรวจสอบไฟล์โมเดลภายในเครื่องหรือ URL โมเดลระยะไกล/ที่ดาวน์โหลดได้ซึ่งรู้จัก หากไม่มี จะแนะนำให้เปลี่ยนไปใช้ผู้ให้บริการระยะไกล
    - **ผู้ให้บริการระยะไกลแบบระบุชัดเจน** (`openai`, `voyage` ฯลฯ): ตรวจสอบว่ามี API key อยู่ในสภาพแวดล้อมหรือที่เก็บการยืนยันตัวตนหรือไม่ หากไม่มี จะพิมพ์คำแนะนำการแก้ไขที่นำไปปฏิบัติได้
    - **ผู้ให้บริการอัตโนมัติ**: ตรวจสอบความพร้อมของโมเดลภายในเครื่องก่อน จากนั้นลองผู้ให้บริการระยะไกลแต่ละรายตามลำดับการเลือกอัตโนมัติ

    เมื่อมีผลการตรวจสอบ Gateway ที่แคชไว้ (Gateway สมบูรณ์ ณ เวลาที่ตรวจสอบ) Doctor จะเทียบผลนั้นกับการกำหนดค่าที่ CLI มองเห็นได้และระบุความคลาดเคลื่อนใด ๆ Doctor จะไม่เริ่ม ping embedding ใหม่บนเส้นทางเริ่มต้น ให้ใช้คำสั่งสถานะหน่วยความจำแบบละเอียดเมื่อคุณต้องการตรวจสอบผู้ให้บริการแบบสด

    ใช้ `openclaw memory status --deep` เพื่อตรวจสอบความพร้อมของ embedding ขณะรันไทม์

  </Accordion>
  <Accordion title="14. คำเตือนสถานะช่องทาง">
    หาก Gateway สมบูรณ์ Doctor จะเรียกใช้การตรวจสอบสถานะช่องทางและรายงานคำเตือนพร้อมการแก้ไขที่แนะนำ
  </Accordion>
  <Accordion title="15. การตรวจสอบ + ซ่อมแซมการกำหนดค่า supervisor">
    Doctor ตรวจสอบการกำหนดค่า supervisor ที่ติดตั้งไว้ (launchd/systemd/schtasks) เพื่อหาค่าเริ่มต้นที่ขาดหายหรือเก่าเกินไป (เช่น dependency ของ systemd network-online และเวลาหน่วงก่อนรีสตาร์ต) เมื่อพบความไม่ตรงกัน จะแนะนำให้อัปเดตและสามารถเขียนไฟล์ service/task ใหม่ให้เป็นค่าเริ่มต้นปัจจุบันได้

    หมายเหตุ:

    - `openclaw doctor` จะถามก่อนเขียนการกำหนดค่า supervisor ใหม่
    - `openclaw doctor --yes` ยอมรับพรอมต์ซ่อมแซมเริ่มต้น
    - `openclaw doctor --repair` ใช้การแก้ไขที่แนะนำโดยไม่ถาม
    - `openclaw doctor --repair --force` เขียนทับการกำหนดค่า supervisor แบบกำหนดเอง
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` ทำให้ Doctor เป็นแบบอ่านอย่างเดียวสำหรับวงจรชีวิตของบริการ Gateway โดยยังคงรายงานสุขภาพของบริการและเรียกใช้การซ่อมแซมที่ไม่ใช่บริการ แต่ข้ามการติดตั้ง/เริ่ม/รีสตาร์ต/bootstrap บริการ การเขียนการกำหนดค่า supervisor ใหม่ และการล้างบริการ legacy เพราะ supervisor ภายนอกเป็นเจ้าของวงจรชีวิตนั้น
    - บน Linux Doctor จะไม่เขียน metadata ของคำสั่ง/entrypoint ใหม่ขณะที่ unit ของ systemd Gateway ที่ตรงกันกำลังทำงานอยู่ และยังละเว้น unit เพิ่มเติมที่คล้าย Gateway ซึ่งไม่ได้ใช้งานและไม่ใช่ legacy ระหว่างการสแกนบริการซ้ำ เพื่อไม่ให้ไฟล์บริการประกอบสร้างสัญญาณรบกวนในการล้างข้อมูล
    - หากการยืนยันตัวตนด้วย token ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef การติดตั้ง/ซ่อมแซมบริการของ Doctor จะตรวจสอบ SecretRef แต่จะไม่บันทึกค่า token plaintext ที่ resolve แล้วลงใน metadata สภาพแวดล้อมของบริการ supervisor
    - Doctor ตรวจพบค่าสภาพแวดล้อมของบริการที่จัดการด้วย `.env`/SecretRef ซึ่งการติดตั้ง LaunchAgent, systemd หรือ Windows Scheduled Task รุ่นเก่าฝังไว้ inline และจะเขียน metadata ของบริการใหม่เพื่อให้ค่าเหล่านั้นโหลดจากแหล่ง runtime แทนที่จะมาจากนิยาม supervisor
    - Doctor ตรวจพบเมื่อคำสั่งบริการยังคงตรึง `--port` เก่าไว้หลังจาก `gateway.port` เปลี่ยน และเขียน metadata ของบริการใหม่ไปยังพอร์ตปัจจุบัน
    - หากการยืนยันตัวตนด้วย token ต้องใช้ token และ SecretRef ของ token ที่กำหนดค่าไว้ยัง resolve ไม่ได้ Doctor จะบล็อกเส้นทางติดตั้ง/ซ่อมแซมพร้อมคำแนะนำที่นำไปปฏิบัติได้
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` Doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้งค่า mode อย่างชัดเจน
    - สำหรับ unit ของ user-systemd บน Linux ตอนนี้การตรวจสอบ token drift ของ Doctor รวมทั้งแหล่ง `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบ metadata การยืนยันตัวตนของบริการ
    - การซ่อมแซมบริการของ Doctor จะปฏิเสธการเขียนใหม่ หยุด หรือรีสตาร์ตบริการ Gateway จากไบนารี OpenClaw รุ่นเก่า เมื่อการกำหนดค่าถูกเขียนล่าสุดโดยเวอร์ชันที่ใหม่กว่า ดู [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)
    - คุณสามารถบังคับเขียนใหม่ทั้งหมดได้เสมอผ่าน `openclaw gateway install --force`

  </Accordion>
  <Accordion title="16. การวินิจฉัย runtime + พอร์ตของ Gateway">
    Doctor ตรวจสอบ runtime ของบริการ (PID, สถานะ exit ล่าสุด) และเตือนเมื่อบริการถูกติดตั้งแล้วแต่ไม่ได้ทำงานจริง นอกจากนี้ยังตรวจสอบการชนกันของพอร์ตบนพอร์ต Gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (Gateway ทำงานอยู่แล้ว, SSH tunnel)
  </Accordion>
  <Accordion title="17. แนวทางปฏิบัติที่ดีที่สุดสำหรับ runtime ของ Gateway">
    Doctor เตือนเมื่อบริการ Gateway ทำงานบน Bun หรือพาธ Node ที่จัดการด้วยเวอร์ชัน (`nvm`, `fnm`, `volta`, `asdf` ฯลฯ) ช่องทาง WhatsApp + Telegram ต้องใช้ Node และพาธของตัวจัดการเวอร์ชันอาจเสียหลังอัปเกรด เพราะบริการไม่ได้โหลด shell init ของคุณ Doctor เสนอให้ย้ายไปใช้การติดตั้ง Node ของระบบเมื่อพร้อมใช้งาน (Homebrew/apt/choco)

    LaunchAgent ของ macOS ที่เพิ่งติดตั้งหรือซ่อมแซมจะใช้ PATH ระบบแบบ canonical (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) แทนการคัดลอก PATH ของ shell แบบโต้ตอบ ดังนั้น Volta, asdf, fnm, pnpm และไดเรกทอรีตัวจัดการเวอร์ชันอื่น ๆ จะไม่เปลี่ยนว่าโปรเซสลูกของ Node resolve ไปที่ใด บริการ Linux ยังคงเก็บ root สภาพแวดล้อมแบบระบุชัดเจน (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) และไดเรกทอรี user-bin ที่เสถียร แต่ไดเรกทอรี fallback ของตัวจัดการเวอร์ชันที่เดาไว้จะถูกเขียนลงใน PATH ของบริการก็ต่อเมื่อไดเรกทอรีเหล่านั้นมีอยู่บนดิสก์เท่านั้น

  </Accordion>
  <Accordion title="18. การเขียนการกำหนดค่า + metadata ของ wizard">
    Doctor บันทึกการเปลี่ยนแปลงการกำหนดค่าใด ๆ และประทับ metadata ของ wizard เพื่อบันทึกการรัน Doctor
  </Accordion>
  <Accordion title="19. เคล็ดลับ workspace (การสำรองข้อมูล + ระบบหน่วยความจำ)">
    Doctor แนะนำระบบหน่วยความจำของ workspace เมื่อไม่มี และพิมพ์เคล็ดลับการสำรองข้อมูลหาก workspace ยังไม่ได้อยู่ภายใต้ git

    ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคู่มือฉบับเต็มเกี่ยวกับโครงสร้าง workspace และการสำรองข้อมูลด้วย git (แนะนำ GitHub หรือ GitLab แบบส่วนตัว)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [รันบุ๊ก Gateway](/th/gateway)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
