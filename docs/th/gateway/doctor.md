---
read_when:
    - การเพิ่มหรือแก้ไขการย้ายข้อมูลของ doctor
    - กำลังนำการเปลี่ยนแปลง config ที่ทำให้ไม่เข้ากันเข้ามา
summary: 'คำสั่ง doctor: การตรวจสุขภาพ การย้าย config และขั้นตอนการซ่อมแซม'
title: Doctor
x-i18n:
    generated_at: "2026-04-25T13:47:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05063983a5ffd9dc117a8135f76519941c28d30778d6ecbaa3f276a5fd4fce46
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` คือเครื่องมือสำหรับการซ่อมแซม + ย้ายข้อมูลของ OpenClaw โดยใช้แก้ไข
config/state ที่ค้างเก่า ตรวจสอบสุขภาพระบบ และให้ขั้นตอนการซ่อมแซมที่ทำได้จริง

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw doctor
```

### แบบ headless / automation

```bash
openclaw doctor --yes
```

ยอมรับค่าเริ่มต้นโดยไม่ถาม (รวมถึงขั้นตอนการรีสตาร์ต/บริการ/sandbox repair เมื่อเกี่ยวข้อง)

```bash
openclaw doctor --repair
```

ใช้การซ่อมแซมที่แนะนำโดยไม่ถาม (ซ่อมแซม + รีสตาร์ตเมื่อปลอดภัย)

```bash
openclaw doctor --repair --force
```

ใช้การซ่อมแซมแบบเข้มข้นด้วย (เขียนทับการกำหนดค่า supervisor แบบกำหนดเอง)

```bash
openclaw doctor --non-interactive
```

รันโดยไม่มีการถาม และใช้เฉพาะการย้ายข้อมูลที่ปลอดภัย (การ normalize config + การย้าย state บนดิสก์) ข้ามการรีสตาร์ต/บริการ/sandbox actions ที่ต้องการการยืนยันจากมนุษย์
การย้าย legacy state จะรันอัตโนมัติเมื่อถูกตรวจพบ

```bash
openclaw doctor --deep
```

สแกนบริการของระบบเพื่อหาการติดตั้ง gateway เพิ่มเติม (launchd/systemd/schtasks)

หากคุณต้องการตรวจสอบการเปลี่ยนแปลงก่อนเขียน ให้เปิดไฟล์ config ก่อน:

```bash
cat ~/.openclaw/openclaw.json
```

## สิ่งที่ทำ (สรุป)

- การอัปเดตก่อนเริ่มแบบไม่บังคับสำหรับการติดตั้งจาก git (เฉพาะแบบโต้ตอบ)
- การตรวจสอบความใหม่ของ UI protocol (สร้าง Control UI ใหม่เมื่อ protocol schema ใหม่กว่า)
- การตรวจสุขภาพ + พรอมป์ตให้รีสตาร์ต
- สรุปสถานะ Skills (พร้อมใช้/ขาดหาย/ถูกบล็อก) และสถานะ Plugin
- การ normalize config สำหรับค่าแบบเดิม
- การย้าย talk config จากฟิลด์ `talk.*` แบบแบนเดิมไปเป็น `talk.provider` + `talk.providers.<provider>`
- การตรวจสอบ browser migration สำหรับ config ของ Chrome extension แบบเดิมและความพร้อมของ Chrome MCP
- คำเตือนเกี่ยวกับ OpenCode provider override (`models.providers.opencode` / `models.providers.opencode-go`)
- คำเตือนเกี่ยวกับการ shadow ของ Codex OAuth (`models.providers.openai-codex`)
- การตรวจสอบข้อกำหนดเบื้องต้นด้าน OAuth TLS สำหรับ OpenAI Codex OAuth profiles
- การย้าย legacy on-disk state (sessions/ไดเรกทอรี agent/WhatsApp auth)
- การย้ายคีย์สัญญา manifest ของ Plugin แบบเดิม (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
- การย้าย legacy cron store (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบนสุด, payload `provider`, งาน webhook fallback แบบง่าย `notify: true`)
- การตรวจสอบไฟล์ session lock และล้าง stale locks
- การตรวจสอบความสมบูรณ์และสิทธิ์ของ state (sessions, transcripts, state dir)
- การตรวจสอบสิทธิ์ของไฟล์ config (chmod 600) เมื่อรันในเครื่อง
- สุขภาพของ model auth: ตรวจสอบวันหมดอายุของ OAuth, สามารถรีเฟรชโทเค็นที่ใกล้หมดอายุ, และรายงานสถานะ cooldown/disabled ของ auth profile
- การตรวจพบ workspace dir เพิ่มเติม (`~/openclaw`)
- การซ่อมแซม sandbox image เมื่อเปิดใช้ sandboxing
- การย้าย legacy service และการตรวจพบ gateway เพิ่มเติม
- การย้าย legacy state ของ Matrix channel (ในโหมด `--fix` / `--repair`)
- การตรวจสอบรันไทม์ของ Gateway (ติดตั้ง service แล้วแต่ไม่ทำงาน; cached launchd label)
- คำเตือนสถานะ channel (ตรวจจาก gateway ที่กำลังทำงาน)
- การตรวจสอบ supervisor config (launchd/systemd/schtasks) พร้อมตัวเลือกซ่อมแซม
- การตรวจสอบแนวปฏิบัติที่ดีของรันไทม์ Gateway (Node เทียบกับ Bun, paths ของ version-manager)
- การวินิจฉัยการชนกันของพอร์ต Gateway (ค่าเริ่มต้น `18789`)
- คำเตือนด้านความปลอดภัยสำหรับนโยบาย DM แบบเปิด
- การตรวจสอบ auth ของ Gateway สำหรับโหมด local token (เสนอการสร้างโทเค็นเมื่อไม่มีแหล่งโทเค็น; จะไม่เขียนทับ token SecretRef configs)
- การตรวจพบปัญหา device pairing (คำขอ pair ครั้งแรกที่รออยู่, การอัปเกรด role/scope ที่รออยู่, stale local device-token cache drift และ paired-record auth drift)
- การตรวจสอบ systemd linger บน Linux
- การตรวจสอบขนาดไฟล์ bootstrap ของ workspace (คำเตือนเรื่องการตัดทอน/ใกล้ถึงขีดจำกัดสำหรับไฟล์ context)
- การตรวจสอบสถานะ shell completion และการติดตั้ง/อัปเกรดอัตโนมัติ
- การตรวจสอบความพร้อมของ memory search embedding provider (local model, remote API key หรือไบนารี QMD)
- การตรวจสอบการติดตั้งจาก source (pnpm workspace mismatch, ขาด UI assets, ขาดไบนารี tsx)
- เขียน config และข้อมูลเมตาของ wizard ที่อัปเดตแล้ว

## การ backfill และ reset ใน Dreams UI

ฉาก Dreams ใน Control UI มีการดำเนินการ **Backfill**, **Reset** และ **Clear Grounded**
สำหรับเวิร์กโฟลว์ grounded dreaming การดำเนินการเหล่านี้ใช้เมธอด RPC
สไตล์ doctor ของ gateway แต่ **ไม่ใช่** ส่วนหนึ่งของการซ่อมแซม/ย้ายข้อมูลของ CLI `openclaw doctor`

สิ่งที่ทำ:

- **Backfill** จะสแกนไฟล์ `memory/YYYY-MM-DD.md` ใน workspace
  ที่กำลังใช้งาน รัน grounded REM diary pass และเขียนรายการ backfill แบบย้อนกลับได้
  ลงใน `DREAMS.md`
- **Reset** จะลบเฉพาะรายการ diary backfill ที่มีการทำเครื่องหมายไว้จาก `DREAMS.md`
- **Clear Grounded** จะลบเฉพาะรายการ short-term แบบ grounded-only ที่จัดเตรียมไว้
  ซึ่งมาจาก historical replay และยังไม่ได้สะสม live recall หรือ daily
  support

สิ่งที่ **ไม่** ทำด้วยตัวเอง:

- จะไม่แก้ไข `MEMORY.md`
- จะไม่รันการย้ายข้อมูลแบบ doctor เต็มรูปแบบ
- จะไม่จัดเตรียม grounded candidates เข้าสู่ live short-term
  promotion store โดยอัตโนมัติ เว้นแต่คุณจะรันเส้นทาง CLI แบบ staged ก่อนอย่างชัดเจน

หากคุณต้องการให้ grounded historical replay ส่งผลต่อ deep promotion
lane ปกติ ให้ใช้โฟลว์ CLI แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

สิ่งนี้จะจัดเตรียม grounded durable candidates ลงใน short-term dreaming store ขณะที่
ยังคงให้ `DREAMS.md` เป็นพื้นผิวสำหรับการตรวจทาน

## พฤติกรรมโดยละเอียดและเหตุผล

### 0) การอัปเดตแบบไม่บังคับ (การติดตั้งจาก git)

หากนี่คือ git checkout และ doctor กำลังรันแบบโต้ตอบ มันจะเสนอให้
อัปเดต (fetch/rebase/build) ก่อนรัน doctor

### 1) การ normalize config

หาก config มีรูปร่างค่าที่เป็นแบบเดิม (เช่น `messages.ackReaction`
ที่ไม่มี channel-specific override) doctor จะ normalize ให้เป็น
schema ปัจจุบัน

รวมถึงฟิลด์ Talk แบบแบนเดิมด้วย ตอนนี้ public Talk config คือ
`talk.provider` + `talk.providers.<provider>` doctor จะเขียนรูปแบบเก่า
อย่าง `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` ใหม่ไปยัง provider map

### 2) การย้ายคีย์ config แบบเดิม

เมื่อ config มีคีย์ที่เลิกใช้แล้ว คำสั่งอื่นจะปฏิเสธการทำงานและขอ
ให้คุณรัน `openclaw doctor`

Doctor จะ:

- อธิบายว่าพบคีย์แบบเดิมใดบ้าง
- แสดงการย้ายข้อมูลที่มันใช้
- เขียน `~/.openclaw/openclaw.json` ใหม่ด้วย schema ที่อัปเดตแล้ว

Gateway จะรัน doctor migrations อัตโนมัติขณะเริ่มต้นเมื่อมันตรวจพบ
รูปแบบ config แบบเดิมด้วย ดังนั้น config ที่ล้าสมัยจะถูกซ่อมแซมโดยไม่ต้องทำเอง
การย้าย cron job store จัดการโดย `openclaw doctor --fix`

การย้ายปัจจุบัน:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
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
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- สำหรับ channels ที่มี `accounts` แบบมีชื่อ แต่ยังมีค่าระดับบนสุดของ channel แบบบัญชีเดียวค้างอยู่ ให้ย้ายค่าระดับบัญชีนั้นไปยังบัญชีที่ถูกยกระดับซึ่งเลือกไว้สำหรับ channel นั้น (`accounts.default` สำหรับ channels ส่วนใหญ่; Matrix สามารถคงเป้าหมายแบบมีชื่อ/ค่าเริ่มต้นที่ตรงกันไว้ได้)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- ลบ `browser.relayBindHost` (การตั้งค่า relay ของ extension แบบเดิม)

คำเตือนจาก doctor ยังรวมคำแนะนำเกี่ยวกับ account-default สำหรับ multi-account channels ด้วย:

- หากมีการกำหนดค่า `channels.<channel>.accounts` ตั้งแต่สองรายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default` doctor จะเตือนว่าการกำหนดเส้นทาง fallback อาจเลือกบัญชีที่ไม่คาดคิด
- หาก `channels.<channel>.defaultAccount` ถูกตั้งเป็น account ID ที่ไม่รู้จัก doctor จะเตือนและแสดงรายการ account IDs ที่กำหนดค่าไว้

### 2b) OpenCode provider overrides

หากคุณเพิ่ม `models.providers.opencode`, `opencode-zen` หรือ `opencode-go`
ด้วยตนเอง มันจะเขียนทับ built-in OpenCode catalog จาก `@mariozechner/pi-ai`
สิ่งนี้อาจบังคับให้ models ไปใช้ API ที่ไม่ถูกต้องหรือทำให้ cost กลายเป็นศูนย์ Doctor จะเตือนเพื่อให้
คุณลบ override นั้นและกู้คืนการกำหนดเส้นทาง API + cost ราย model

### 2c) Browser migration และความพร้อมของ Chrome MCP

หาก browser config ของคุณยังชี้ไปที่เส้นทาง Chrome extension ที่ถูกถอดออกแล้ว doctor จะ
normalize ให้เป็นโมเดลการเชื่อมต่อ Chrome MCP แบบ host-local ปัจจุบัน:

- `browser.profiles.*.driver: "extension"` จะกลายเป็น `"existing-session"`
- `browser.relayBindHost` จะถูกลบ

Doctor ยังตรวจสอบเส้นทาง Chrome MCP แบบ host-local เมื่อคุณใช้ `defaultProfile:
"user"` หรือโปรไฟล์ `existing-session` ที่กำหนดค่าไว้:

- ตรวจสอบว่ามีการติดตั้ง Google Chrome บนโฮสต์เดียวกันหรือไม่สำหรับโปรไฟล์ auto-connect เริ่มต้น
- ตรวจสอบเวอร์ชัน Chrome ที่ตรวจพบ และเตือนเมื่อเวอร์ชันต่ำกว่า Chrome 144
- เตือนให้เปิดใช้ remote debugging ในหน้าตรวจสอบของ browser (เช่น
  `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`
  หรือ `edge://inspect/#remote-debugging`)

Doctor ไม่สามารถเปิดใช้การตั้งค่าฝั่ง Chrome ให้คุณได้ Host-local Chrome MCP
ยังคงต้องการ:

- browser แบบ Chromium-based 144+ บนโฮสต์ gateway/node
- browser ต้องกำลังรันอยู่ในเครื่อง
- ต้องเปิดใช้ remote debugging ใน browser นั้น
- ต้องอนุมัติพรอมป์ตขอความยินยอมสำหรับการเชื่อมต่อครั้งแรกใน browser

ความพร้อมในที่นี้เกี่ยวข้องเฉพาะกับข้อกำหนดเบื้องต้นสำหรับการเชื่อมต่อในเครื่อง Existing-session ยังคงมีข้อจำกัดของเส้นทาง Chrome MCP ปัจจุบัน; เส้นทางขั้นสูงอย่าง `responsebody`, การส่งออก PDF, download interception และ batch actions ยังคงต้องใช้ managed
browser หรือ raw CDP profile

การตรวจสอบนี้ **ไม่** ใช้กับ Docker, sandbox, remote-browser หรือโฟลว์ headless อื่น ๆ
กรณีเหล่านั้นจะยังคงใช้ raw CDP

### 2d) ข้อกำหนดเบื้องต้นด้าน OAuth TLS

เมื่อมีการกำหนดค่า OpenAI Codex OAuth profile ไว้ doctor จะ probe ไปยัง
authorization endpoint ของ OpenAI เพื่อตรวจสอบว่า local Node/OpenSSL TLS stack สามารถ
ตรวจสอบ certificate chain ได้ หาก probe ล้มเหลวด้วย certificate error (เช่น
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ใบรับรองหมดอายุ หรือใบรับรองแบบ self-signed)
doctor จะพิมพ์คำแนะนำการแก้ไขเฉพาะตามแพลตฟอร์ม สำหรับ macOS ที่ใช้ Node จาก Homebrew
การแก้ไขมักจะเป็น `brew postinstall ca-certificates` เมื่อใช้ `--deep` probe นี้จะรัน
แม้ gateway จะอยู่ในสถานะปกติ

### 2c) Codex OAuth provider overrides

หากก่อนหน้านี้คุณเพิ่มการตั้งค่า transport ของ OpenAI แบบเดิมไว้ภายใต้
`models.providers.openai-codex` สิ่งนี้อาจไป shadow เส้นทาง built-in Codex OAuth
provider ที่รุ่นใหม่ ๆ ใช้งานโดยอัตโนมัติ Doctor จะเตือนเมื่อเห็น
การตั้งค่า transport เก่าเหล่านั้นอยู่ร่วมกับ Codex OAuth เพื่อให้คุณสามารถลบหรือเขียน transport override ที่ล้าสมัยนั้นใหม่ และได้พฤติกรรม routing/fallback แบบ built-in กลับคืนมา
ทั้ง custom proxies และ header-only overrides ยังคงรองรับและจะไม่
ทำให้เกิดคำเตือนนี้

### 3) การย้าย legacy state (โครงสร้างบนดิสก์)

Doctor สามารถย้ายโครงสร้างบนดิสก์แบบเก่าให้มาอยู่ในรูปแบบปัจจุบันได้:

- ที่เก็บ sessions + transcripts:
  - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
- ไดเรกทอรี agent:
  - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
- สถานะ auth ของ WhatsApp (Baileys):
  - จาก `~/.openclaw/credentials/*.json` แบบเดิม (ยกเว้น `oauth.json`)
  - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (account id ค่าเริ่มต้น: `default`)

การย้ายเหล่านี้เป็นแบบ best-effort และ idempotent; doctor จะปล่อยคำเตือนเมื่อ
ยังคงเหลือโฟลเดอร์ legacy ไว้เป็นข้อมูลสำรอง Gateway/CLI ก็จะย้าย
legacy sessions + ไดเรกทอรี agent อัตโนมัติขณะเริ่มต้นด้วย เพื่อให้ประวัติ/auth/models ไปอยู่ใน
path รายเอเจนต์โดยไม่ต้องรัน doctor เอง ส่วน WhatsApp auth ตั้งใจให้ย้ายเฉพาะผ่าน
`openclaw doctor` เท่านั้น ตอนนี้การ normalize Talk provider/provider-map เปรียบเทียบด้วยความเท่ากันเชิงโครงสร้าง จึงไม่ทำให้เกิดการเปลี่ยนแปลง `doctor --fix` แบบ no-op ซ้ำอีกจากความต่างเพียงลำดับคีย์

### 3a) การย้าย legacy plugin manifest

Doctor จะสแกน plugin manifests ที่ติดตั้งทั้งหมดเพื่อหาคีย์ capability ระดับบนสุดที่เลิกใช้แล้ว
(`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`) เมื่อพบ มันจะเสนอให้ย้ายคีย์เหล่านั้นไปไว้ใน object `contracts`
และเขียนไฟล์ manifest ใหม่ในตำแหน่งเดิม การย้ายนี้เป็นแบบ idempotent;
หากคีย์ `contracts` มีค่าเดียวกันอยู่แล้ว คีย์เดิมจะถูกลบออก
โดยไม่ทำข้อมูลซ้ำ

### 3b) การย้าย legacy cron store

Doctor ยังตรวจสอบ cron job store (`~/.openclaw/cron/jobs.json` เป็นค่าเริ่มต้น,
หรือ `cron.store` หากมีการ override) เพื่อหารูปร่างงานแบบเก่าที่ scheduler ยัง
ยอมรับเพื่อความเข้ากันได้

การทำความสะอาด cron ปัจจุบันประกอบด้วย:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- ฟิลด์ payload ระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
- ฟิลด์ delivery ระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- aliases ของการส่ง payload `provider` → `delivery.channel` แบบชัดเจน
- งาน webhook fallback แบบเดิมที่ใช้ `notify: true` อย่างง่าย → `delivery.mode="webhook"` แบบชัดเจน พร้อม `delivery.to=cron.webhook`

Doctor จะย้าย jobs แบบ `notify: true` อัตโนมัติเฉพาะเมื่อมันสามารถทำได้โดย
ไม่เปลี่ยนพฤติกรรม หาก job รวม fallback notify แบบเดิมเข้ากับโหมด delivery ที่มีอยู่และไม่ใช่ webhook
doctor จะเตือนและปล่อย job นั้นไว้ให้ตรวจสอบด้วยตนเอง

### 3c) การล้าง session lock

Doctor จะสแกนไดเรกทอรี session ของเอเจนต์ทุกตัวเพื่อหาไฟล์ write-lock ที่ค้าง —
ไฟล์ที่หลงเหลือเมื่อ session จบอย่างผิดปกติ สำหรับแต่ละไฟล์ lock ที่พบ มันจะรายงาน:
path, PID, PID ยังมีชีวิตอยู่หรือไม่, อายุของ lock และมัน
ถูกพิจารณาว่าค้างหรือไม่ (PID ตายแล้วหรือเก่ากว่า 30 นาที) ในโหมด `--fix` / `--repair`
มันจะลบไฟล์ lock ที่ค้างโดยอัตโนมัติ; มิฉะนั้นมันจะพิมพ์หมายเหตุและ
สั่งให้คุณรันใหม่ด้วย `--fix`

### 4) การตรวจสอบความสมบูรณ์ของ state (การคงอยู่ของเซสชัน การกำหนดเส้นทาง และความปลอดภัย)

ไดเรกทอรี state คือแกนหลักของการทำงาน หากมันหายไป คุณจะสูญเสีย
sessions, credentials, logs และ config (เว้นแต่คุณจะมีข้อมูลสำรองไว้ที่อื่น)

Doctor ตรวจสอบ:

- **State dir หายไป**: เตือนเรื่องการสูญเสีย state อย่างรุนแรง พรอมป์ตให้สร้าง
  ไดเรกทอรีใหม่ และเตือนว่ามันไม่สามารถกู้คืนข้อมูลที่หายไปได้
- **สิทธิ์ของ state dir**: ตรวจสอบความสามารถในการเขียน; เสนอการซ่อมแซมสิทธิ์
  (และปล่อยคำใบ้ `chown` เมื่อพบ owner/group ไม่ตรงกัน)
- **state dir บน macOS ที่ซิงก์กับคลาวด์**: เตือนเมื่อ state resolve อยู่ใต้ iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ
  `~/Library/CloudStorage/...` เพราะ path ที่มีการซิงก์อาจทำให้ I/O ช้าลง
  และเกิด race ของ lock/sync
- **state dir บน Linux ที่อยู่บน SD หรือ eMMC**: เตือนเมื่อ state resolve ไปยัง mount source แบบ `mmcblk*`
  เพราะ random I/O ที่พึ่งพา SD หรือ eMMC อาจช้ากว่าและสึกหรอเร็วขึ้น
  เมื่อมีการเขียน session และ credentials
- **Session dirs หายไป**: ต้องมี `sessions/` และไดเรกทอรี session store
  เพื่อคงประวัติและหลีกเลี่ยงการแครช `ENOENT`
- **Transcript ไม่ตรงกัน**: เตือนเมื่อรายการ session ล่าสุดมี
  ไฟล์ transcript หายไป
- **Main session “1-line JSONL”**: แจ้งเมื่อ transcript หลักมีเพียงหนึ่ง
  บรรทัด (ประวัติไม่สะสม)
- **หลาย state dirs**: เตือนเมื่อมีโฟลเดอร์ `~/.openclaw` หลายแห่งอยู่ใน
  home directories ต่างกัน หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (ประวัติอาจ
  แยกกันคนละที่ระหว่างการติดตั้ง)
- **การเตือนโหมด remote**: หาก `gateway.mode=remote` doctor จะเตือนให้คุณรัน
  บนโฮสต์ remote (เพราะ state อยู่ที่นั่น)
- **สิทธิ์ของไฟล์ config**: เตือนหาก `~/.openclaw/openclaw.json` ถูกอ่านได้
  โดย group/world และเสนอให้ลดสิทธิ์ให้เป็น `600`

### 5) สุขภาพของ model auth (วันหมดอายุของ OAuth)

Doctor จะตรวจสอบ OAuth profiles ใน auth store เตือนเมื่อโทเค็นใกล้
หมดอายุ/หมดอายุ และสามารถรีเฟรชเมื่อปลอดภัย หาก Anthropic
OAuth/token profile ล้าสมัย มันจะเสนอให้ใช้ Anthropic API key หรือเส้นทาง
Anthropic setup-token
พรอมป์ตการรีเฟรชจะปรากฏเฉพาะเมื่อรันแบบโต้ตอบ (TTY); `--non-interactive`
จะข้ามความพยายามในการรีเฟรช

เมื่อการรีเฟรช OAuth ล้มเหลวแบบถาวร (เช่น `refresh_token_reused`,
`invalid_grant` หรือผู้ให้บริการบอกให้คุณลงชื่อเข้าใช้อีกครั้ง) doctor จะรายงาน
ว่าจำเป็นต้องทำ re-auth และพิมพ์คำสั่ง `openclaw models auth login --provider ...`
แบบตรงตัวที่ต้องรัน

Doctor ยังรายงาน auth profiles ที่ใช้งานไม่ได้ชั่วคราวเนื่องจาก:

- cooldowns ระยะสั้น (rate limits/timeouts/auth failures)
- การปิดใช้งานที่นานขึ้น (billing/credit failures)

### 6) การตรวจสอบ model ของ Hooks

หากมีการตั้ง `hooks.gmail.model` doctor จะตรวจสอบ model reference กับ
catalog และ allowlist และเตือนเมื่อมัน resolve ไม่ได้หรือไม่ได้รับอนุญาต

### 7) การซ่อมแซม sandbox image

เมื่อเปิดใช้ sandboxing doctor จะตรวจสอบ Docker images และเสนอให้สร้าง
หรือสลับไปใช้ชื่อแบบเดิมหาก image ปัจจุบันหายไป

### 7b) runtime deps ของ bundled Plugin

Doctor จะตรวจสอบ runtime dependencies เฉพาะสำหรับ bundled plugins ที่ active อยู่ใน
config ปัจจุบัน หรือถูกเปิดใช้โดยค่าเริ่มต้นของ bundled manifest เช่น
`plugins.entries.discord.enabled: true`, `channels.discord.enabled: true`
แบบเดิม หรือ bundled provider ที่เปิดใช้เป็นค่าเริ่มต้น หากมีรายการใดหายไป doctor จะรายงานแพ็กเกจเหล่านั้นและติดตั้งให้ในโหมด
`openclaw doctor --fix` / `openclaw doctor --repair` ส่วน external plugins ยังคง
ใช้ `openclaw plugins install` / `openclaw plugins update`; doctor จะไม่
ติดตั้ง dependencies ให้กับ arbitrary plugin paths

Gateway และ local CLI ยังสามารถซ่อมแซม runtime dependencies ของ active bundled plugin
แบบตามต้องการก่อน import bundled plugin การติดตั้งเหล่านี้
ถูกจำกัดไว้ที่ plugin runtime install root รันโดยปิด scripts ไม่เขียน package lock
และมี install-root lock คอยป้องกัน เพื่อไม่ให้การเริ่ม CLI หรือ Gateway พร้อมกัน
แก้ไขต้นไม้ `node_modules` เดียวกันในเวลาเดียวกัน

### 8) การย้าย Gateway service และคำใบ้การล้างข้อมูล

Doctor จะตรวจจับ legacy gateway services (launchd/systemd/schtasks) และ
เสนอให้ลบออกแล้วติดตั้งบริการ OpenClaw โดยใช้พอร์ต gateway ปัจจุบัน
นอกจากนี้ยังสามารถสแกนหา gateway-like services เพิ่มเติมและพิมพ์คำใบ้สำหรับการล้างข้อมูล
บริการ OpenClaw gateway ที่ตั้งชื่อตาม profile ถือเป็นรายการปกติและจะไม่
ถูกแจ้งว่าเป็น "extra"

### 8b) Startup Matrix migration

เมื่อบัญชี Matrix channel มีการย้าย legacy state ที่รออยู่หรือดำเนินการได้
doctor (ในโหมด `--fix` / `--repair`) จะสร้าง pre-migration snapshot แล้ว
จึงรันขั้นตอน migration แบบ best-effort: การย้าย legacy Matrix state และการเตรียม legacy
encrypted-state ทั้งสองขั้นตอนไม่ถือเป็นข้อผิดพลาดร้ายแรง; ข้อผิดพลาดจะถูกบันทึกล็อกและการเริ่มต้นระบบจะดำเนินต่อไป ในโหมดอ่านอย่างเดียว (`openclaw doctor` โดยไม่มี `--fix`) การตรวจสอบนี้
จะถูกข้ามทั้งหมด

### 8c) Device pairing และ auth drift

ตอนนี้ doctor จะตรวจสอบสถานะ device-pairing เป็นส่วนหนึ่งของ health pass ปกติ

สิ่งที่มันรายงาน:

- คำขอ pair ครั้งแรกที่รออยู่
- การอัปเกรด role ที่รออยู่สำหรับอุปกรณ์ที่ pair แล้ว
- การอัปเกรด scope ที่รออยู่สำหรับอุปกรณ์ที่ pair แล้ว
- การซ่อมแซม public-key mismatch ในกรณีที่ device id ยังตรงกัน แต่อัตลักษณ์ของอุปกรณ์
  ไม่ตรงกับระเบียนที่อนุมัติไว้แล้ว
- ระเบียนที่ pair แล้วแต่ไม่มีโทเค็นที่ยัง active สำหรับ role ที่ได้รับอนุมัติ
- โทเค็นที่ pair แล้วซึ่ง scopes เบี่ยงเบนออกจาก baseline การ pair ที่ได้รับอนุมัติ
- รายการ cached device-token ในเครื่องปัจจุบันที่เก่ากว่าการหมุนเวียนโทเค็นฝั่ง
  gateway หรือมีข้อมูลเมตา scope ที่ล้าสมัย

Doctor จะไม่อนุมัติคำขอ pair อัตโนมัติหรือหมุนเวียน device token อัตโนมัติ มัน
จะพิมพ์ขั้นตอนถัดไปที่แน่นอนแทน:

- ตรวจสอบคำขอที่รออยู่ด้วย `openclaw devices list`
- อนุมัติคำขอที่ต้องการด้วย `openclaw devices approve <requestId>`
- หมุนเวียนโทเค็นใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
- ลบและอนุมัติระเบียนที่ล้าสมัยอีกครั้งด้วย `openclaw devices remove <deviceId>`

สิ่งนี้ช่วยปิดช่องโหว่ที่พบบ่อยในกรณี "pair แล้วแต่ยังขึ้น pairing required":
ตอนนี้ doctor แยกแยะระหว่างการ pair ครั้งแรก การอัปเกรด role/scope
ที่รออยู่ และ token/device-identity drift ที่ล้าสมัยได้แล้ว

### 9) คำเตือนด้านความปลอดภัย

Doctor จะปล่อยคำเตือนเมื่อผู้ให้บริการเปิดรับ DM โดยไม่มี allowlist หรือ
เมื่อนโยบายถูกกำหนดค่าในลักษณะที่อันตราย

### 10) systemd linger (Linux)

หากรันเป็น systemd user service doctor จะตรวจสอบให้แน่ใจว่าเปิด lingering แล้ว เพื่อให้
gateway ยังคงทำงานต่อหลังจากออกจากระบบ

### 11) สถานะของ workspace (skills, plugins และไดเรกทอรีแบบเดิม)

Doctor จะพิมพ์สรุปสถานะของ workspace สำหรับเอเจนต์ค่าเริ่มต้น:

- **สถานะ Skills**: นับจำนวน skills ที่พร้อมใช้, requirements ขาดหาย และถูกบล็อกโดย allowlist
- **ไดเรกทอรี workspace แบบเดิม**: เตือนเมื่อมี `~/openclaw` หรือไดเรกทอรี workspace แบบเดิมอื่น ๆ
  อยู่คู่กับ workspace ปัจจุบัน
- **สถานะ Plugin**: นับจำนวน plugins ที่โหลดแล้ว/ปิดใช้งาน/เกิดข้อผิดพลาด; แสดง plugin IDs สำหรับ
  ข้อผิดพลาดใด ๆ; รายงานความสามารถของ bundled plugin
- **คำเตือนด้านความเข้ากันได้ของ Plugin**: แจ้ง plugins ที่มีปัญหาความเข้ากันได้กับ
  รันไทม์ปัจจุบัน
- **การวินิจฉัย Plugin**: แสดงคำเตือนหรือข้อผิดพลาดขณะโหลดที่ถูกปล่อยโดย
  plugin registry

### 11b) ขนาดไฟล์ Bootstrap

Doctor จะตรวจสอบว่าไฟล์ bootstrap ของ workspace (เช่น `AGENTS.md`,
`CLAUDE.md` หรือไฟล์ context ที่ inject อื่น ๆ) ใกล้ถึงหรือเกิน
งบประมาณจำนวนอักขระที่กำหนดไว้หรือไม่ มันจะรายงานจำนวนอักขระดิบเทียบกับจำนวนอักขระที่ inject ต่อไฟล์ เปอร์เซ็นต์การตัดทอน
สาเหตุของการตัดทอน (`max/file` หรือ `max/total`) และจำนวนอักขระที่ inject รวม
เป็นสัดส่วนของงบประมาณรวม เมื่อไฟล์ถูกตัดทอนหรือใกล้ถึงขีดจำกัด doctor จะพิมพ์คำแนะนำสำหรับการปรับแต่ง `agents.defaults.bootstrapMaxChars`
และ `agents.defaults.bootstrapTotalMaxChars`

### 11c) Shell completion

Doctor จะตรวจสอบว่ามีการติดตั้ง tab completion สำหรับ shell ปัจจุบันหรือไม่
(zsh, bash, fish หรือ PowerShell):

- หากโปรไฟล์ shell ใช้รูปแบบ dynamic completion ที่ช้า
  (`source <(openclaw completion ...)`) doctor จะอัปเกรดให้เป็น
  รูปแบบไฟล์แคชที่เร็วกว่า
- หากมีการกำหนดค่า completion ไว้ในโปรไฟล์ แต่ไฟล์แคชหายไป
  doctor จะสร้างแคชใหม่ให้อัตโนมัติ
- หากยังไม่มีการกำหนดค่า completion เลย doctor จะถามเพื่อติดตั้ง
  (เฉพาะโหมดโต้ตอบ; จะข้ามเมื่อใช้ `--non-interactive`)

รัน `openclaw completion --write-state` เพื่อสร้างแคชใหม่ด้วยตนเอง

### 12) การตรวจสอบ auth ของ Gateway (local token)

Doctor จะตรวจสอบความพร้อมของ local gateway token auth

- หากโหมดโทเค็นต้องใช้โทเค็นและยังไม่มีแหล่งโทเค็น doctor จะเสนอให้สร้างโทเค็น
- หาก `gateway.auth.token` ถูกจัดการด้วย SecretRef แต่ไม่พร้อมใช้งาน doctor จะเตือนและจะไม่เขียนทับด้วย plaintext
- `openclaw doctor --generate-gateway-token` จะบังคับการสร้างเฉพาะเมื่อไม่มีการกำหนดค่า token SecretRef

### 12b) การซ่อมแซมแบบอ่านอย่างเดียวที่รับรู้ SecretRef

บางโฟลว์การซ่อมแซมจำเป็นต้องตรวจสอบข้อมูลรับรองที่กำหนดค่าไว้โดยไม่ลดทอนพฤติกรรม fail-fast ของรันไทม์

- ตอนนี้ `openclaw doctor --fix` ใช้โมเดลสรุป SecretRef แบบอ่านอย่างเดียวเดียวกันกับคำสั่งตระกูล status สำหรับการซ่อมแซม config แบบเจาะจง
- ตัวอย่าง: การซ่อมแซม `allowFrom` / `groupAllowFrom` แบบ `@username` ของ Telegram จะพยายามใช้ข้อมูลรับรอง bot ที่กำหนดค่าไว้เมื่อพร้อมใช้งาน
- หากโทเค็น bot ของ Telegram ถูกกำหนดค่าผ่าน SecretRef แต่ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานว่าข้อมูลรับรองถูกกำหนดค่าไว้แต่ยังไม่พร้อมใช้งาน และข้ามการ resolve อัตโนมัติ แทนที่จะล่มหรือรายงานผิดว่าโทเค็นหายไป

### 13) การตรวจสุขภาพของ Gateway + การรีสตาร์ต

Doctor จะรันการตรวจสุขภาพ และเสนอให้รีสตาร์ต gateway เมื่อดูเหมือนว่า
ทำงานไม่สมบูรณ์

### 13b) ความพร้อมของ memory search

Doctor จะตรวจสอบว่า embedding provider ของ memory search ที่กำหนดค่าไว้พร้อมใช้งาน
สำหรับเอเจนต์ค่าเริ่มต้นหรือไม่ พฤติกรรมจะขึ้นอยู่กับ backend และ provider ที่กำหนดค่าไว้:

- **QMD backend**: probe เพื่อตรวจว่าไบนารี `qmd` พร้อมใช้งานและเริ่มทำงานได้หรือไม่
  หากไม่ จะพิมพ์คำแนะนำการแก้ไข รวมถึงแพ็กเกจ npm และตัวเลือก path ของไบนารีแบบกำหนดเอง
- **local provider แบบระบุชัดเจน**: ตรวจหาไฟล์ model ในเครื่องหรือ URL ของ model แบบ
  remote/downloadable ที่รู้จัก หากไม่มี จะเสนอให้เปลี่ยนไปใช้ remote provider
- **remote provider แบบระบุชัดเจน** (`openai`, `voyage` ฯลฯ): ตรวจสอบว่ามี API key
  อยู่ใน environment หรือ auth store หากไม่มี จะพิมพ์คำแนะนำการแก้ไขที่ทำได้จริง
- **auto provider**: ตรวจสอบความพร้อมของ model ในเครื่องก่อน จากนั้นลอง remote
  providers แต่ละตัวตามลำดับการเลือกอัตโนมัติ

เมื่อมีผลลัพธ์จาก gateway probe พร้อมใช้งาน (gateway อยู่ในสถานะปกติขณะตรวจสอบ)
doctor จะอ้างอิงผลนั้นร่วมกับ config ที่ CLI มองเห็นได้ และแจ้ง
หากมีความไม่ตรงกัน

ใช้ `openclaw memory status --deep` เพื่อตรวจสอบความพร้อมของ embedding ระหว่างรันไทม์

### 14) คำเตือนสถานะของ channel

หาก gateway อยู่ในสถานะปกติ doctor จะรันการ probe สถานะ channel และรายงาน
คำเตือนพร้อมแนวทางแก้ไขที่แนะนำ

### 15) การตรวจสอบ supervisor config + การซ่อมแซม

Doctor จะตรวจสอบ supervisor config ที่ติดตั้งไว้ (launchd/systemd/schtasks) เพื่อหา
ค่าเริ่มต้นที่หายไปหรือล้าสมัย (เช่น systemd network-online dependencies และ
restart delay) เมื่อพบความไม่ตรงกัน มันจะ
แนะนำให้อัปเดต และสามารถเขียนไฟล์ service/task ใหม่ให้เป็นค่าเริ่มต้นปัจจุบันได้

หมายเหตุ:

- `openclaw doctor` จะถามก่อนเขียน supervisor config ใหม่
- `openclaw doctor --yes` จะยอมรับพรอมป์ตการซ่อมแซมค่าเริ่มต้น
- `openclaw doctor --repair` จะใช้การแก้ไขที่แนะนำโดยไม่ถาม
- `openclaw doctor --repair --force` จะเขียนทับ supervisor configs แบบกำหนดเอง
- หาก token auth ต้องใช้โทเค็น และ `gateway.auth.token` ถูกจัดการด้วย SecretRef การติดตั้ง/ซ่อมแซม service ของ doctor จะตรวจสอบ SecretRef แต่จะไม่บันทึกค่าโทเค็น plaintext ที่ resolve แล้วลงในข้อมูลเมตา environment ของ supervisor service
- หาก token auth ต้องใช้โทเค็น และ token SecretRef ที่กำหนดค่าไว้ยัง resolve ไม่ได้ doctor จะบล็อกเส้นทางการติดตั้ง/ซ่อมแซมพร้อมคำแนะนำที่ทำได้จริง
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้ง `gateway.auth.mode` doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้งค่า mode อย่างชัดเจน
- สำหรับ user-systemd units บน Linux ตอนนี้การตรวจ token drift ของ doctor จะรวมทั้งแหล่ง `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบข้อมูลเมตา auth ของ service
- คุณสามารถบังคับการเขียนใหม่ทั้งหมดได้เสมอด้วย `openclaw gateway install --force`

### 16) การวินิจฉัยรันไทม์ของ Gateway + พอร์ต

Doctor จะตรวจสอบรันไทม์ของ service (PID, สถานะการออกล่าสุด) และเตือนเมื่อ
service ถูกติดตั้งแล้วแต่ไม่ได้กำลังทำงานจริง นอกจากนี้ยังตรวจสอบการชนกันของพอร์ต
บนพอร์ต gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (gateway กำลังรันอยู่แล้ว
หรือ SSH tunnel)

### 17) แนวปฏิบัติที่ดีที่สุดของรันไทม์ Gateway

Doctor จะเตือนเมื่อ gateway service รันบน Bun หรือ path ของ Node ที่จัดการด้วย version manager
(`nvm`, `fnm`, `volta`, `asdf` ฯลฯ) channels อย่าง WhatsApp + Telegram ต้องใช้ Node
และ paths ของ version manager อาจใช้งานไม่ได้หลังอัปเกรด เพราะ service ไม่ได้
โหลด shell init ของคุณ Doctor จะเสนอให้ย้ายไปใช้การติดตั้ง Node แบบระบบเมื่อ
มีให้ใช้ (Homebrew/apt/choco)

### 18) การเขียน config + ข้อมูลเมตาของ wizard

Doctor จะคงการเปลี่ยนแปลง config ใด ๆ ไว้ และประทับข้อมูลเมตาของ wizard เพื่อบันทึก
การรัน doctor

### 19) เคล็ดลับสำหรับ workspace (ข้อมูลสำรอง + ระบบ memory)

Doctor จะแนะนำระบบ memory สำหรับ workspace หากยังไม่มี และพิมพ์คำแนะนำเรื่องข้อมูลสำรอง
หาก workspace ยังไม่ได้อยู่ภายใต้ git

ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคู่มือฉบับเต็มเกี่ยวกับ
โครงสร้าง workspace และการสำรองด้วย git (แนะนำให้ใช้ GitHub หรือ GitLab แบบส่วนตัว)

## ที่เกี่ยวข้อง

- [Gateway troubleshooting](/th/gateway/troubleshooting)
- [Gateway runbook](/th/gateway)
