---
read_when:
    - การเพิ่มหรือแก้ไขการย้ายข้อมูลของ doctor
    - การนำการเปลี่ยนแปลงการกำหนดค่าที่ทำให้เข้ากันไม่ได้มาใช้
sidebarTitle: Doctor
summary: 'คำสั่งตรวจสุขภาพ: การตรวจสอบสุขภาพ การไมเกรตการกำหนดค่า และขั้นตอนการซ่อมแซม'
title: ตัวตรวจวินิจฉัย
x-i18n:
    generated_at: "2026-05-01T10:16:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: eef5715d485609fa60bdb4aa97ee441b053a60519b9dea03b0c8ec09db157474
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` คือเครื่องมือซ่อมแซม + ย้ายข้อมูลสำหรับ OpenClaw โดยจะแก้ไข config/state ที่ล้าสมัย ตรวจสอบสุขภาพ และให้ขั้นตอนซ่อมแซมที่นำไปทำต่อได้

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

    ยอมรับค่าเริ่มต้นโดยไม่ถาม (รวมถึงขั้นตอนซ่อมแซมการ restart/service/sandbox เมื่อใช้ได้)

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    ใช้การซ่อมแซมที่แนะนำโดยไม่ถาม (การซ่อมแซม + การ restart เมื่อปลอดภัย)

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    ใช้การซ่อมแซมแบบเข้มข้นด้วย (เขียนทับ config supervisor แบบกำหนดเอง)

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    รันโดยไม่มี prompt และใช้เฉพาะการย้ายข้อมูลที่ปลอดภัย (การปรับ config ให้เป็นรูปแบบมาตรฐาน + การย้าย state บนดิสก์) ข้ามการทำงาน restart/service/sandbox ที่ต้องมีการยืนยันจากคน การย้ายข้อมูล state แบบเดิมจะรันโดยอัตโนมัติเมื่อตรวจพบ

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    สแกน service ของระบบเพื่อหา gateway install เพิ่มเติม (launchd/systemd/schtasks)

  </Tab>
</Tabs>

หากต้องการตรวจทานการเปลี่ยนแปลงก่อนเขียน ให้เปิดไฟล์ config ก่อน:

```bash
cat ~/.openclaw/openclaw.json
```

## สิ่งที่ทำ (สรุป)

<AccordionGroup>
  <Accordion title="สุขภาพ, UI, และการอัปเดต">
    - การอัปเดตก่อนรันแบบไม่บังคับสำหรับ git install (เฉพาะโหมดโต้ตอบ)
    - การตรวจสอบความใหม่ของ protocol UI (สร้าง Control UI ใหม่เมื่อ schema ของ protocol ใหม่กว่า)
    - การตรวจสุขภาพ + prompt ให้ restart
    - สรุปสถานะ Skills (eligible/missing/blocked) และสถานะ Plugin

  </Accordion>
  <Accordion title="Config และการย้ายข้อมูล">
    - การปรับ config ให้เป็นรูปแบบมาตรฐานสำหรับค่าแบบเดิม
    - การย้าย config Talk จากฟิลด์แบนแบบเดิม `talk.*` ไปเป็น `talk.provider` + `talk.providers.<provider>`
    - การตรวจสอบการย้าย browser สำหรับ config Chrome extension แบบเดิมและความพร้อมของ Chrome MCP
    - คำเตือนการ override provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`)
    - คำเตือน Codex OAuth shadowing (`models.providers.openai-codex`)
    - การตรวจสอบข้อกำหนดเบื้องต้นของ OAuth TLS สำหรับโปรไฟล์ OpenAI Codex OAuth
    - คำเตือน allowlist ของ Plugin/tool เมื่อ `plugins.allow` จำกัดอยู่ แต่ policy ของ tool ยังขอ wildcard หรือ tool ที่ Plugin เป็นเจ้าของ
    - การย้าย state บนดิสก์แบบเดิม (sessions/agent dir/WhatsApp auth)
    - การย้ายคีย์ contract manifest ของ Plugin แบบเดิม (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
    - การย้าย store Cron แบบเดิม (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบน, payload `provider`, งาน fallback Webhook แบบง่าย `notify: true`)
    - การย้าย runtime-policy ของ agent แบบเดิมไปยัง `agents.defaults.agentRuntime` และ `agents.list[].agentRuntime`
    - การล้าง config Plugin ที่ล้าสมัยเมื่อเปิดใช้ Plugin; เมื่อ `plugins.enabled=false` การอ้างอิง Plugin ที่ล้าสมัยจะถือเป็น containment config ที่ไม่มีผลและจะถูกเก็บไว้

  </Accordion>
  <Accordion title="State และความสมบูรณ์">
    - การตรวจไฟล์ session lock และการล้าง lock ที่ล้าสมัย
    - การซ่อมแซม transcript ของ session สำหรับ branch prompt-rewrite ซ้ำที่สร้างโดย build วันที่ 2026.4.24 ที่ได้รับผลกระทบ
    - การตรวจ tombstone สำหรับการกู้คืนด้วยการ restart ของ subagent ที่ค้าง พร้อมรองรับ `--fix` เพื่อล้าง flag การกู้คืนที่ถูก aborted และล้าสมัย เพื่อให้ startup ไม่ตีความ child ว่า restart-aborted ต่อไป
    - การตรวจความสมบูรณ์และ permission ของ state (sessions, transcripts, state dir)
    - การตรวจ permission ของไฟล์ config (chmod 600) เมื่อรันในเครื่อง
    - สุขภาพ auth ของ model: ตรวจ OAuth expiry, สามารถ refresh token ที่ใกล้หมดอายุ, และรายงานสถานะ cooldown/disabled ของ auth-profile
    - การตรวจพบ workspace dir เพิ่มเติม (`~/openclaw`)

  </Accordion>
  <Accordion title="Gateway, service, และ supervisor">
    - การซ่อมแซม sandbox image เมื่อเปิดใช้ sandboxing
    - การย้าย service แบบเดิมและการตรวจพบ Gateway เพิ่มเติม
    - การย้าย state แบบเดิมของช่องทาง Matrix (ในโหมด `--fix` / `--repair`)
    - การตรวจ runtime ของ Gateway (ติดตั้ง service แล้วแต่ไม่รัน; label launchd ที่แคชไว้)
    - คำเตือนสถานะช่องทาง (probe จาก Gateway ที่กำลังรัน)
    - การ audit config supervisor (launchd/systemd/schtasks) พร้อมการซ่อมแซมแบบไม่บังคับ
    - การล้างสภาพแวดล้อม embedded proxy สำหรับ service ของ Gateway ที่จับค่า shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` ไว้ระหว่าง install หรือ update
    - การตรวจแนวทางปฏิบัติที่ดีของ runtime Gateway (Node กับ Bun, path ของ version-manager)
    - การวินิจฉัย port collision ของ Gateway (ค่าเริ่มต้น `18789`)

  </Accordion>
  <Accordion title="Auth, ความปลอดภัย, และการ pairing">
    - คำเตือนด้านความปลอดภัยสำหรับ policy DM แบบเปิด
    - การตรวจ auth ของ Gateway สำหรับโหมด local token (เสนอการสร้าง token เมื่อไม่มีแหล่ง token; ไม่เขียนทับ config token SecretRef)
    - การตรวจปัญหา device pairing (คำขอ pair ครั้งแรกที่รอดำเนินการ, การอัปเกรด role/scope ที่รอดำเนินการ, cache device-token ในเครื่องที่ล้าสมัยและ drift, และ auth drift ของ paired-record)

  </Accordion>
  <Accordion title="Workspace และ shell">
    - การตรวจ systemd linger บน Linux
    - การตรวจขนาดไฟล์ bootstrap ของ workspace (คำเตือน truncation/near-limit สำหรับไฟล์ context)
    - การตรวจสถานะ shell completion และ auto-install/upgrade
    - การตรวจความพร้อมของ provider สำหรับ memory search embedding (model ในเครื่อง, remote API key, หรือ binary QMD)
    - การตรวจ source install (pnpm workspace mismatch, UI assets ขาดหาย, binary tsx ขาดหาย)
    - เขียน config ที่อัปเดต + metadata ของ wizard

  </Accordion>
</AccordionGroup>

## การ backfill และ reset ของ UI Dreams

ฉาก Dreams ใน Control UI มีการทำงาน **Backfill**, **Reset**, และ **Clear Grounded** สำหรับ workflow grounded dreaming การทำงานเหล่านี้ใช้ method RPC แบบ doctor ของ Gateway แต่ **ไม่ใช่** ส่วนหนึ่งของการซ่อมแซม/ย้ายข้อมูลใน `openclaw doctor` CLI

สิ่งที่ทำ:

- **Backfill** สแกนไฟล์ย้อนหลัง `memory/YYYY-MM-DD.md` ใน workspace ที่ active, รัน grounded REM diary pass, และเขียนรายการ backfill ที่ย้อนกลับได้ลงใน `DREAMS.md`
- **Reset** ลบเฉพาะรายการ backfill diary ที่ทำเครื่องหมายไว้เหล่านั้นจาก `DREAMS.md`
- **Clear Grounded** ลบเฉพาะรายการ short-term แบบ grounded-only ที่ staged ไว้ซึ่งมาจาก historical replay และยังไม่ได้สะสม live recall หรือ daily support

สิ่งที่การทำงานเหล่านี้ **ไม่** ทำด้วยตัวเอง:

- ไม่แก้ไข `MEMORY.md`
- ไม่รันการย้ายข้อมูล doctor แบบเต็ม
- ไม่ stage grounded candidates เข้าไปใน live short-term promotion store โดยอัตโนมัติ เว้นแต่คุณจะรัน staged CLI path ก่อนอย่างชัดเจน

หากต้องการให้ grounded historical replay มีผลกับ lane deep promotion ตามปกติ ให้ใช้ flow CLI แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

คำสั่งนั้นจะ stage grounded durable candidates เข้าไปใน short-term dreaming store โดยยังคงให้ `DREAMS.md` เป็นพื้นผิวสำหรับตรวจทาน

## พฤติกรรมและเหตุผลโดยละเอียด

<AccordionGroup>
  <Accordion title="0. การอัปเดตแบบไม่บังคับ (git install)">
    หากนี่เป็น git checkout และ doctor กำลังรันแบบโต้ตอบ ระบบจะเสนอให้อัปเดต (fetch/rebase/build) ก่อนรัน doctor
  </Accordion>
  <Accordion title="1. การปรับ config ให้เป็นรูปแบบมาตรฐาน">
    หาก config มีรูปแบบค่าแบบเดิม (เช่น `messages.ackReaction` โดยไม่มี override เฉพาะช่องทาง) doctor จะปรับค่าเหล่านั้นให้เป็น schema ปัจจุบัน

    ซึ่งรวมถึงฟิลด์แบนของ Talk แบบเดิมด้วย Config Talk สาธารณะปัจจุบันคือ `talk.provider` + `talk.providers.<provider>` Doctor จะเขียนรูปแบบเก่า `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ใหม่เข้าไปใน provider map

    Doctor ยังเตือนเมื่อ `plugins.allow` ไม่ว่างและ tool policy ใช้
    รายการ wildcard หรือ tool ที่ Plugin เป็นเจ้าของ `tools.allow: ["*"]` จะ match เฉพาะ tool
    จาก Plugin ที่โหลดจริงเท่านั้น; ไม่ได้ข้าม allowlist ของ Plugin แบบ exclusive

  </Accordion>
  <Accordion title="2. การย้ายคีย์ config แบบเดิม">
    เมื่อ config มีคีย์ที่เลิกใช้แล้ว คำสั่งอื่นจะปฏิเสธการรันและขอให้คุณรัน `openclaw doctor`

    Doctor จะ:

    - อธิบายว่าพบคีย์แบบเดิมใดบ้าง
    - แสดงการย้ายข้อมูลที่นำไปใช้
    - เขียน `~/.openclaw/openclaw.json` ใหม่ด้วย schema ที่อัปเดตแล้ว

    Gateway จะรันการย้ายข้อมูลของ doctor โดยอัตโนมัติเมื่อ startup หากตรวจพบรูปแบบ config แบบเดิม ดังนั้น config ที่ล้าสมัยจะถูกซ่อมแซมโดยไม่ต้องทำเอง การย้าย store ของงาน Cron จัดการโดย `openclaw doctor --fix`

    การย้ายข้อมูลปัจจุบัน:

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
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - สำหรับช่องทางที่มี `accounts` แบบมีชื่อ แต่ยังมีค่าช่องทางระดับบนสุดแบบบัญชีเดียวค้างอยู่ ให้ย้ายค่าที่อยู่ในขอบเขตบัญชีเหล่านั้นเข้าไปในบัญชีที่ถูกเลื่อนขึ้นมาสำหรับช่องทางนั้น (`accounts.default` สำหรับช่องทางส่วนใหญ่; Matrix สามารถคงเป้าหมายที่มีชื่อ/ค่าเริ่มต้นเดิมที่ตรงกันไว้ได้)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - ลบ `agents.defaults.llm`; ใช้ `models.providers.<id>.timeoutSeconds` สำหรับ timeout ของ provider/model ที่ช้า
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - ลบ `browser.relayBindHost` (การตั้งค่า relay ของ extension แบบเดิม)
    - `models.providers.*.api: "openai"` แบบเดิม → `"openai-completions"` (การเริ่มต้น Gateway จะข้าม provider ที่ `api` ตั้งเป็นค่า enum ในอนาคตหรือไม่รู้จักแทนที่จะล้มเหลวแบบปิด)

    คำเตือนของ doctor ยังมีคำแนะนำเกี่ยวกับค่าเริ่มต้นของบัญชีสำหรับช่องทางแบบหลายบัญชีด้วย:

    - หากมีการตั้งค่ารายการ `channels.<channel>.accounts` ตั้งแต่สองรายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default` doctor จะเตือนว่า fallback routing อาจเลือกบัญชีที่ไม่คาดคิด
    - หากตั้งค่า `channels.<channel>.defaultAccount` เป็น ID บัญชีที่ไม่รู้จัก doctor จะเตือนและแสดงรายการ ID บัญชีที่ตั้งค่าไว้

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    หากคุณเพิ่ม `models.providers.opencode`, `opencode-zen` หรือ `opencode-go` ด้วยตนเอง รายการนั้นจะ override แค็ตตาล็อก OpenCode ในตัวจาก `@mariozechner/pi-ai` ซึ่งอาจบังคับให้โมเดลใช้ API ที่ผิด หรือทำให้ต้นทุนกลายเป็นศูนย์ doctor จะเตือนเพื่อให้คุณลบ override และคืนค่า API routing + ต้นทุนรายโมเดล
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    หาก config ของเบราว์เซอร์ยังชี้ไปยังเส้นทาง Chrome extension ที่ถูกลบแล้ว doctor จะปรับให้เป็นโมเดล attach Chrome MCP แบบ host-local ปัจจุบัน:

    - `browser.profiles.*.driver: "extension"` กลายเป็น `"existing-session"`
    - `browser.relayBindHost` ถูกลบออก

    doctor ยังตรวจสอบเส้นทาง Chrome MCP แบบ host-local เมื่อคุณใช้ `defaultProfile: "user"` หรือ profile `existing-session` ที่ตั้งค่าไว้:

    - ตรวจสอบว่า Google Chrome ติดตั้งอยู่บน host เดียวกันสำหรับ profile auto-connect ค่าเริ่มต้นหรือไม่
    - ตรวจสอบเวอร์ชัน Chrome ที่ตรวจพบและเตือนเมื่อเวอร์ชันต่ำกว่า Chrome 144
    - เตือนให้คุณเปิดใช้ remote debugging ในหน้า inspect ของเบราว์เซอร์ (เช่น `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` หรือ `edge://inspect/#remote-debugging`)

    doctor ไม่สามารถเปิดใช้การตั้งค่าฝั่ง Chrome ให้คุณได้ Chrome MCP แบบ host-local ยังต้องใช้:

    - เบราว์เซอร์ที่ใช้ Chromium เวอร์ชัน 144+ บน host ของ gateway/node
    - เบราว์เซอร์ที่ทำงานอยู่ภายในเครื่อง
    - เปิดใช้ remote debugging ในเบราว์เซอร์นั้น
    - อนุมัติพรอมป์ยินยอมสำหรับการ attach ครั้งแรกในเบราว์เซอร์

    ความพร้อมในส่วนนี้เกี่ยวข้องเฉพาะข้อกำหนดเบื้องต้นของการ attach ภายในเครื่องเท่านั้น Existing-session ยังคงใช้ขีดจำกัด route ของ Chrome MCP ปัจจุบัน; route ขั้นสูงอย่าง `responsebody`, การ export PDF, การดักจับการดาวน์โหลด และการดำเนินการแบบ batch ยังต้องใช้เบราว์เซอร์ที่จัดการโดยระบบหรือ profile CDP ดิบ

    การตรวจสอบนี้ **ไม่** ใช้กับ Docker, sandbox, remote-browser หรือ flow แบบ headless อื่น ๆ รายการเหล่านั้นยังคงใช้ CDP ดิบต่อไป

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    เมื่อตั้งค่า profile OpenAI Codex OAuth ไว้ doctor จะ probe endpoint การอนุญาตของ OpenAI เพื่อตรวจสอบว่า stack TLS ของ Node/OpenSSL ภายในเครื่องสามารถตรวจสอบ certificate chain ได้ หาก probe ล้มเหลวด้วยข้อผิดพลาด certificate (เช่น `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificate หมดอายุ หรือ certificate ที่ลงนามเอง) doctor จะแสดงคำแนะนำการแก้ไขเฉพาะแพลตฟอร์ม บน macOS ที่ใช้ Homebrew Node การแก้มักเป็น `brew postinstall ca-certificates` เมื่อใช้ `--deep` probe จะทำงานแม้ว่า gateway จะปกติดี
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    หากก่อนหน้านี้คุณเพิ่มการตั้งค่า transport ของ OpenAI แบบเดิมไว้ใต้ `models.providers.openai-codex` ค่าเหล่านั้นอาจบดบังเส้นทาง provider Codex OAuth ในตัวที่ release ใหม่กว่าใช้โดยอัตโนมัติ doctor จะเตือนเมื่อพบการตั้งค่า transport เก่าเหล่านั้นอยู่ร่วมกับ Codex OAuth เพื่อให้คุณลบหรือเขียน override transport ที่ล้าสมัยใหม่ และได้พฤติกรรม routing/fallback ในตัวกลับมา custom proxy และ override แบบเฉพาะ header ยังรองรับอยู่และจะไม่ทำให้เกิดคำเตือนนี้
  </Accordion>
  <Accordion title="2f. Codex plugin route warnings">
    เมื่อเปิดใช้ Codex plugin ที่ bundled มา doctor จะตรวจสอบด้วยว่า ref โมเดลหลัก `openai-codex/*` ยัง resolve ผ่าน PI runner ค่าเริ่มต้นอยู่หรือไม่ ชุดค่านี้ถูกต้องเมื่อคุณต้องการใช้ auth Codex OAuth/subscription ผ่าน PI แต่สับสนกับ harness app-server ดั้งเดิมของ Codex ได้ง่าย doctor จะเตือนและชี้ไปยังรูปแบบ app-server ที่ชัดเจน: `openai/*` บวก `agentRuntime.id: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex`

    doctor ไม่ซ่อมแซมสิ่งนี้โดยอัตโนมัติ เพราะทั้งสอง route ใช้ได้:

    - `openai-codex/*` + PI หมายถึง "ใช้ auth Codex OAuth/subscription ผ่าน OpenClaw runner ปกติ"
    - `openai/*` + `runtime: "codex"` หมายถึง "รัน turn ที่ฝังไว้ผ่าน app-server ดั้งเดิมของ Codex"
    - `/codex ...` หมายถึง "ควบคุมหรือ bind การสนทนา Codex ดั้งเดิมจากแชต"
    - `/acp ...` หรือ `runtime: "acp"` หมายถึง "ใช้ adapter ACP/acpx ภายนอก"

    หากคำเตือนปรากฏขึ้น ให้เลือก route ที่คุณตั้งใจใช้และแก้ไข config ด้วยตนเอง คงคำเตือนไว้ตามเดิมเมื่อ PI Codex OAuth เป็นความตั้งใจ

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    doctor สามารถ migrate layout บนดิสก์แบบเก่าเข้าสู่โครงสร้างปัจจุบันได้:

    - ที่เก็บ session + transcript:
      - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
    - ไดเรกทอรี agent:
      - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
    - สถานะ auth ของ WhatsApp (Baileys):
      - จาก `~/.openclaw/credentials/*.json` แบบเดิม (ยกเว้น `oauth.json`)
      - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (id บัญชีค่าเริ่มต้น: `default`)

    migration เหล่านี้เป็นแบบ best-effort และ idempotent; doctor จะส่งคำเตือนเมื่อปล่อยโฟลเดอร์เดิมไว้เป็นข้อมูลสำรอง Gateway/CLI ยัง auto-migrate sessions + ไดเรกทอรี agent แบบเดิมเมื่อเริ่มต้นด้วย เพื่อให้ประวัติ/auth/models ไปอยู่ในเส้นทางราย agent โดยไม่ต้องรัน doctor ด้วยตนเอง auth ของ WhatsApp ตั้งใจให้ migrate ผ่าน `openclaw doctor` เท่านั้น ตอนนี้การ normalize talk provider/provider-map เปรียบเทียบด้วย structural equality ดังนั้น diff ที่ต่างกันเฉพาะลำดับ key จะไม่ทำให้เกิดการเปลี่ยนแปลง `doctor --fix` แบบ no-op ซ้ำอีก

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    doctor สแกน manifest ของ Plugin ที่ติดตั้งทั้งหมดเพื่อหา key capability ระดับบนสุดที่เลิกใช้แล้ว (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) เมื่อพบ จะเสนอให้ย้ายค่าเหล่านั้นเข้าไปใน object `contracts` และเขียนไฟล์ manifest ใหม่แบบ in-place migration นี้เป็นแบบ idempotent; หาก key `contracts` มีค่าเดียวกันอยู่แล้ว key เดิมจะถูกลบออกโดยไม่ duplicate ข้อมูล
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    doctor ยังตรวจสอบที่เก็บงาน cron (`~/.openclaw/cron/jobs.json` โดยค่าเริ่มต้น หรือ `cron.store` เมื่อมีการ override) เพื่อหารูปแบบงานเก่าที่ scheduler ยังรับเพื่อความเข้ากันได้

    การ cleanup cron ปัจจุบันมีดังนี้:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - field payload ระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
    - field delivery ระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias delivery ของ payload `provider` → `delivery.channel` ที่ชัดเจน
    - งาน fallback webhook แบบเดิมอย่างง่าย `notify: true` → `delivery.mode="webhook"` ที่ชัดเจนพร้อม `delivery.to=cron.webhook`

    doctor จะ auto-migrate งาน `notify: true` เฉพาะเมื่อทำได้โดยไม่เปลี่ยนพฤติกรรม หากงานหนึ่งรวม fallback notify แบบเดิมเข้ากับ delivery mode ที่ไม่ใช่ webhook อยู่แล้ว doctor จะเตือนและปล่อยงานนั้นไว้ให้ตรวจทานด้วยตนเอง

  </Accordion>
  <Accordion title="3c. Session lock cleanup">
    doctor สแกนไดเรกทอรี session ของ agent ทุกตัวเพื่อหาไฟล์ write-lock ที่ค้างอยู่ — ไฟล์ที่เหลืออยู่เมื่อ session ออกแบบผิดปกติ สำหรับ lock file แต่ละไฟล์ที่พบ จะรายงาน: เส้นทาง, PID, ว่า PID ยังทำงานอยู่หรือไม่, อายุของ lock และถือว่า stale หรือไม่ (PID ตายแล้วหรือเก่ากว่า 30 นาที) ในโหมด `--fix` / `--repair` จะลบ lock file ที่ stale โดยอัตโนมัติ; มิฉะนั้นจะแสดงหมายเหตุและสั่งให้คุณรันใหม่พร้อม `--fix`
  </Accordion>
  <Accordion title="3d. Session transcript branch repair">
    doctor สแกนไฟล์ JSONL ของ session agent เพื่อหารูปแบบ branch ซ้ำที่เกิดจากบั๊กการเขียน prompt transcript ใหม่ใน 2026.4.24: turn ของผู้ใช้ที่ถูกทิ้งซึ่งมี runtime context ภายในของ OpenClaw พร้อม sibling ที่ active ซึ่งมี prompt ผู้ใช้ที่มองเห็นได้เหมือนกัน ในโหมด `--fix` / `--repair` doctor จะสำรองไฟล์ที่ได้รับผลกระทบแต่ละไฟล์ไว้ข้างไฟล์เดิมและเขียน transcript ใหม่ให้เป็น branch ที่ active เพื่อให้ประวัติ gateway และตัวอ่าน memory ไม่เห็น turn ซ้ำอีก
  </Accordion>
  <Accordion title="4. State integrity checks (session persistence, routing, and safety)">
    ไดเรกทอรีสถานะคือแกนปฏิบัติการหลัก หากหายไป คุณจะสูญเสีย sessions, credentials, logs และ config (เว้นแต่คุณมีข้อมูลสำรองที่อื่น)

    doctor ตรวจสอบ:

    - **ไดเรกทอรีสถานะหายไป**: เตือนเกี่ยวกับการสูญเสียสถานะแบบร้ายแรง แจ้งให้สร้างไดเรกทอรีใหม่ และเตือนว่าคำสั่งนี้ไม่สามารถกู้คืนข้อมูลที่หายไปได้
    - **สิทธิ์ของไดเรกทอรีสถานะ**: ตรวจสอบว่าสามารถเขียนได้หรือไม่ เสนอให้ซ่อมแซมสิทธิ์ (และแสดงคำแนะนำ `chown` เมื่อตรวจพบว่าเจ้าของ/กลุ่มไม่ตรงกัน)
    - **ไดเรกทอรีสถานะที่ซิงก์กับคลาวด์บน macOS**: เตือนเมื่อสถานะ resolve อยู่ใต้ iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ `~/Library/CloudStorage/...` เพราะพาธที่มีการซิงก์รองรับอาจทำให้ I/O ช้าลงและเกิด race ระหว่าง lock/sync
    - **ไดเรกทอรีสถานะบน SD หรือ eMMC ของ Linux**: เตือนเมื่อสถานะ resolve ไปยังแหล่ง mount แบบ `mmcblk*` เพราะ random I/O ที่รองรับด้วย SD หรือ eMMC อาจช้ากว่าและสึกหรอเร็วขึ้นภายใต้การเขียนเซสชันและข้อมูลรับรอง
    - **ไดเรกทอรีเซสชันหายไป**: ต้องมี `sessions/` และไดเรกทอรี session store เพื่อคงประวัติไว้และหลีกเลี่ยงการ crash แบบ `ENOENT`
    - **ทรานสคริปต์ไม่ตรงกัน**: เตือนเมื่อรายการเซสชันล่าสุดมีไฟล์ทรานสคริปต์หายไป
    - **เซสชันหลัก "JSONL 1 บรรทัด"**: แจ้งเตือนเมื่อทรานสคริปต์หลักมีเพียงหนึ่งบรรทัด (ประวัติไม่ได้สะสมเพิ่ม)
    - **ไดเรกทอรีสถานะหลายชุด**: เตือนเมื่อมีโฟลเดอร์ `~/.openclaw` หลายชุดอยู่ข้ามไดเรกทอรี home หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (ประวัติอาจแยกระหว่างการติดตั้ง)
    - **ตัวเตือนโหมดรีโมต**: หาก `gateway.mode=remote` ตัวตรวจสอบจะเตือนให้คุณรันบนโฮสต์รีโมต (สถานะอยู่ที่นั่น)
    - **สิทธิ์ของไฟล์ config**: เตือนหาก `~/.openclaw/openclaw.json` อ่านได้โดย group/world และเสนอให้ปรับให้เข้มงวดเป็น `600`

  </Accordion>
  <Accordion title="5. สถานะการตรวจสอบสิทธิ์โมเดล (OAuth หมดอายุ)">
    ตัวตรวจสอบจะตรวจโปรไฟล์ OAuth ใน auth store เตือนเมื่อโทเค็นใกล้หมดอายุ/หมดอายุแล้ว และสามารถรีเฟรชได้เมื่อปลอดภัย หากโปรไฟล์ Anthropic OAuth/token เก่าเกินไป จะเสนอ Anthropic API key หรือพาธ setup-token ของ Anthropic พรอมป์รีเฟรชจะแสดงเฉพาะเมื่อรันแบบโต้ตอบ (TTY) เท่านั้น; `--non-interactive` จะข้ามความพยายามรีเฟรช

    เมื่อการรีเฟรช OAuth ล้มเหลวถาวร (เช่น `refresh_token_reused`, `invalid_grant` หรือผู้ให้บริการแจ้งให้คุณลงชื่อเข้าใช้อีกครั้ง) ตัวตรวจสอบจะรายงานว่าจำเป็นต้องยืนยันตัวตนใหม่และพิมพ์คำสั่ง `openclaw models auth login --provider ...` ที่ต้องรันแบบตรงตัว

    ตัวตรวจสอบยังรายงานโปรไฟล์ auth ที่ใช้งานไม่ได้ชั่วคราวเนื่องจาก:

    - cooldown ระยะสั้น (rate limits/timeouts/auth failures)
    - การปิดใช้งานที่นานกว่า (billing/credit failures)

  </Accordion>
  <Accordion title="6. การตรวจสอบความถูกต้องของโมเดล hooks">
    หากตั้งค่า `hooks.gmail.model` ไว้ ตัวตรวจสอบจะตรวจสอบความถูกต้องของการอ้างอิงโมเดลกับ catalog และ allowlist และเตือนเมื่อ resolve ไม่ได้หรือไม่ได้รับอนุญาต
  </Accordion>
  <Accordion title="7. การซ่อมแซมอิมเมจ sandbox">
    เมื่อเปิดใช้ sandboxing ตัวตรวจสอบจะตรวจอิมเมจ Docker และเสนอให้ build หรือสลับไปใช้ชื่อ legacy หากอิมเมจปัจจุบันหายไป
  </Accordion>
  <Accordion title="7b. การพึ่งพารันไทม์ของ Plugin ที่บันเดิลมา">
    ตัวตรวจสอบจะตรวจสอบ runtime dependencies เฉพาะสำหรับ Plugin ที่บันเดิลมาซึ่ง active อยู่ใน config ปัจจุบันหรือเปิดใช้ตามค่าเริ่มต้นของ bundled manifest เช่น `plugins.entries.discord.enabled: true`, legacy `channels.discord.enabled: true`, `models.providers.*` / agent model refs ที่กำหนดค่าไว้ หรือ Plugin ที่บันเดิลมาและเปิดใช้เป็นค่าเริ่มต้นโดยไม่มี provider ownership หากมีรายการใดหายไป ตัวตรวจสอบจะรายงานแพ็กเกจและติดตั้งในโหมด `openclaw doctor --fix` / `openclaw doctor --repair` Plugin ภายนอกยังคงใช้ `openclaw plugins install` / `openclaw plugins update`; ตัวตรวจสอบจะไม่ติดตั้ง dependencies สำหรับพาธ Plugin ใดๆ ตามอำเภอใจ

    ระหว่างการซ่อมแซมของตัวตรวจสอบ การติดตั้ง npm สำหรับ runtime-dependency ที่บันเดิลมาจะแสดงความคืบหน้าแบบ spinner ในเซสชัน TTY และความคืบหน้าเป็นบรรทัดเป็นระยะในเอาต์พุตแบบ pipe/headless การเริ่มต้น Gateway และการโหลด config ใหม่จะเข้าสู่โหมด plugin-plan ก่อน import โมดูล runtime ของ Plugin ที่บันเดิลมา; การ import runtime ปกติเป็นแบบ verify-only และไม่ spawn การซ่อมแซม package-manager การติดตั้งเหล่านี้ถูกจำกัดขอบเขตไว้ที่ plugin runtime install root, รันโดยปิด scripts, ไม่เขียน package lock และถูกป้องกันด้วย install-root lock เพื่อไม่ให้การเริ่ม CLI หรือ Gateway พร้อมกัน mutate โครงสร้าง `node_modules` เดียวกันในเวลาเดียวกัน stale legacy locks จากการเริ่ม Docker/container ที่ถูก kill จะถูก reclaim เมื่อ metadata ของเจ้าของไม่สามารถพิสูจน์ incarnation ของ process ปัจจุบันได้และไฟล์ lock เก่าแล้ว

  </Accordion>
  <Accordion title="8. การย้ายข้อมูลบริการ Gateway และคำแนะนำการล้างข้อมูล">
    ตัวตรวจสอบจะตรวจพบบริการ gateway legacy (launchd/systemd/schtasks) และเสนอให้ลบออกแล้วติดตั้งบริการ OpenClaw โดยใช้พอร์ต Gateway ปัจจุบัน นอกจากนี้ยังสามารถสแกนหาบริการที่คล้าย Gateway เพิ่มเติมและพิมพ์คำแนะนำการล้างข้อมูลได้ บริการ OpenClaw gateway ที่ตั้งชื่อตามโปรไฟล์ถือเป็น first-class และจะไม่ถูกแจ้งว่าเป็น "extra"

    บน Linux หากบริการ gateway ระดับผู้ใช้หายไปแต่มีบริการ OpenClaw gateway ระดับระบบอยู่ ตัวตรวจสอบจะไม่ติดตั้งบริการระดับผู้ใช้ชุดที่สองโดยอัตโนมัติ ตรวจสอบด้วย `openclaw gateway status --deep` หรือ `openclaw doctor --deep` จากนั้นลบรายการซ้ำหรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ system supervisor เป็นเจ้าของ lifecycle ของ gateway

  </Accordion>
  <Accordion title="8b. การย้ายข้อมูล Startup Matrix">
    เมื่อบัญชีช่องทาง Matrix มีการย้ายสถานะ legacy ที่ pending หรือ actionable ตัวตรวจสอบ (ในโหมด `--fix` / `--repair`) จะสร้าง snapshot ก่อนการย้ายข้อมูล จากนั้นรันขั้นตอนการย้ายข้อมูลแบบ best-effort: การย้ายสถานะ Matrix legacy และการเตรียม encrypted-state legacy ทั้งสองขั้นตอนไม่ fatal; ข้อผิดพลาดจะถูกบันทึกและการเริ่มต้นจะดำเนินต่อ ในโหมด read-only (`openclaw doctor` ที่ไม่มี `--fix`) การตรวจนี้จะถูกข้ามทั้งหมด
  </Accordion>
  <Accordion title="8c. การจับคู่อุปกรณ์และ auth drift">
    ตอนนี้ตัวตรวจสอบจะตรวจสถานะการจับคู่อุปกรณ์เป็นส่วนหนึ่งของ health pass ปกติ

    สิ่งที่รายงาน:

    - คำขอจับคู่ครั้งแรกที่ pending
    - การอัปเกรดบทบาทที่ pending สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การอัปเกรด scope ที่ pending สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การซ่อมแซม public-key mismatch ที่ device id ยังตรงกันแต่ device identity ไม่ตรงกับเรคคอร์ดที่อนุมัติแล้วอีกต่อไป
    - เรคคอร์ดที่จับคู่แล้วซึ่งไม่มีโทเค็นที่ active สำหรับบทบาทที่อนุมัติ
    - โทเค็นที่จับคู่แล้วซึ่ง scopes drift ออกนอก baseline การจับคู่ที่อนุมัติ
    - รายการ device-token ในแคชภายในเครื่องสำหรับเครื่องปัจจุบันที่มีมาก่อนการ rotate โทเค็นฝั่ง gateway หรือมี metadata ของ scope ที่ stale

    ตัวตรวจสอบจะไม่อนุมัติคำขอจับคู่หรือ rotate โทเค็นอุปกรณ์โดยอัตโนมัติ แต่จะพิมพ์ขั้นตอนถัดไปแบบตรงตัวแทน:

    - ตรวจสอบคำขอที่ pending ด้วย `openclaw devices list`
    - อนุมัติคำขอที่ระบุด้วย `openclaw devices approve <requestId>`
    - rotate โทเค็นใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
    - ลบและอนุมัติเรคคอร์ด stale ใหม่ด้วย `openclaw devices remove <deviceId>`

    วิธีนี้ปิดช่องโหว่ทั่วไป "จับคู่แล้วแต่ยังได้รับ pairing required": ตอนนี้ตัวตรวจสอบจะแยกการจับคู่ครั้งแรกออกจากการอัปเกรด role/scope ที่ pending และจาก stale token/device-identity drift

  </Accordion>
  <Accordion title="9. คำเตือนด้านความปลอดภัย">
    ตัวตรวจสอบจะแสดงคำเตือนเมื่อผู้ให้บริการเปิดรับ DM โดยไม่มี allowlist หรือเมื่อนโยบายถูกกำหนดค่าในลักษณะที่อันตราย
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    หากรันเป็นบริการผู้ใช้ systemd ตัวตรวจสอบจะตรวจให้แน่ใจว่าเปิดใช้ lingering เพื่อให้ gateway ยังทำงานอยู่หลัง logout
  </Accordion>
  <Accordion title="11. สถานะ workspace (Skills, plugins และไดเรกทอรี legacy)">
    ตัวตรวจสอบจะพิมพ์สรุปสถานะ workspace สำหรับ agent เริ่มต้น:

    - **สถานะ Skills**: นับ Skills ที่ eligible, missing-requirements และ allowlist-blocked
    - **ไดเรกทอรี workspace legacy**: เตือนเมื่อมี `~/openclaw` หรือไดเรกทอรี workspace legacy อื่นอยู่ alongside workspace ปัจจุบัน
    - **สถานะ Plugin**: นับ Plugin ที่ enabled/disabled/errored; แสดงรายการ Plugin IDs สำหรับข้อผิดพลาดใดๆ; รายงานความสามารถของ bundle Plugin
    - **คำเตือนความเข้ากันได้ของ Plugin**: แจ้งเตือน Plugin ที่มีปัญหาความเข้ากันได้กับ runtime ปัจจุบัน
    - **การวินิจฉัย Plugin**: แสดง load-time warnings หรือ errors ใดๆ ที่ plugin registry ปล่อยออกมา

  </Accordion>
  <Accordion title="11b. ขนาดไฟล์ bootstrap">
    ตัวตรวจสอบจะตรวจว่าไฟล์ bootstrap ของ workspace (เช่น `AGENTS.md`, `CLAUDE.md` หรือไฟล์ context อื่นที่ inject เข้ามา) ใกล้หรือเกินงบประมาณตัวอักษรที่กำหนดไว้หรือไม่ โดยรายงานจำนวนอักขระ raw เทียบกับ injected ต่อไฟล์ เปอร์เซ็นต์การตัดทอน สาเหตุการตัดทอน (`max/file` หรือ `max/total`) และจำนวนอักขระ injected ทั้งหมดเป็นสัดส่วนของงบประมาณทั้งหมด เมื่อไฟล์ถูกตัดทอนหรือใกล้ถึงขีดจำกัด ตัวตรวจสอบจะพิมพ์เคล็ดลับสำหรับปรับ `agents.defaults.bootstrapMaxChars` และ `agents.defaults.bootstrapTotalMaxChars`
  </Accordion>
  <Accordion title="11d. การล้าง Plugin ช่องทางที่ stale">
    เมื่อ `openclaw doctor --fix` ลบ Plugin ช่องทางที่หายไป ระบบจะลบ config dangling ที่ scoped กับช่องทางซึ่งอ้างถึง Plugin นั้นด้วย: รายการ `channels.<id>`, heartbeat targets ที่ตั้งชื่อช่องทาง และ overrides `agents.*.models["<channel>/*"]` วิธีนี้ป้องกัน boot loops ของ Gateway ที่ runtime ของช่องทางหายไปแล้วแต่ config ยังขอให้ gateway bind เข้ากับมัน
  </Accordion>
  <Accordion title="11c. Shell completion">
    ตัวตรวจสอบจะตรวจว่าได้ติดตั้ง tab completion สำหรับ shell ปัจจุบันแล้วหรือไม่ (zsh, bash, fish หรือ PowerShell):

    - หากโปรไฟล์ shell ใช้รูปแบบ dynamic completion ที่ช้า (`source <(openclaw completion ...)`) ตัวตรวจสอบจะอัปเกรดเป็นรูปแบบไฟล์แคชที่เร็วกว่า
    - หาก completion ถูกกำหนดค่าในโปรไฟล์แต่ไฟล์แคชหายไป ตัวตรวจสอบจะสร้างแคชใหม่โดยอัตโนมัติ
    - หากยังไม่ได้กำหนดค่า completion เลย ตัวตรวจสอบจะแจ้งให้ติดตั้ง (เฉพาะโหมดโต้ตอบเท่านั้น; ข้ามเมื่อใช้ `--non-interactive`)

    รัน `openclaw completion --write-state` เพื่อสร้างแคชใหม่ด้วยตนเอง

  </Accordion>
  <Accordion title="12. การตรวจ auth ของ Gateway (โทเค็น local)">
    ตัวตรวจสอบจะตรวจความพร้อมของ token auth สำหรับ gateway ภายในเครื่อง

    - หากโหมดโทเค็นต้องใช้โทเค็นและไม่มีแหล่งโทเค็น ตัวตรวจสอบจะเสนอให้สร้างหนึ่งรายการ
    - หาก `gateway.auth.token` จัดการโดย SecretRef แต่ใช้งานไม่ได้ ตัวตรวจสอบจะเตือนและไม่เขียนทับด้วย plaintext
    - `openclaw doctor --generate-gateway-token` บังคับการสร้างเฉพาะเมื่อไม่มี token SecretRef ที่กำหนดค่าไว้

  </Accordion>
  <Accordion title="12b. การซ่อมแซมแบบ read-only ที่รับรู้ SecretRef">
    บาง flow การซ่อมแซมจำเป็นต้องตรวจข้อมูลรับรองที่กำหนดค่าไว้โดยไม่ทำให้พฤติกรรม fail-fast ของ runtime อ่อนลง

    - ตอนนี้ `openclaw doctor --fix` ใช้โมเดลสรุป SecretRef แบบ read-only เดียวกับคำสั่งตระกูล status สำหรับการซ่อม config แบบ targeted
    - ตัวอย่าง: การซ่อม Telegram `allowFrom` / `groupAllowFrom` `@username` จะพยายามใช้ข้อมูลรับรองบอตที่กำหนดค่าไว้เมื่อมี
    - หาก Telegram bot token ถูกกำหนดค่าผ่าน SecretRef แต่ใช้งานไม่ได้ใน command path ปัจจุบัน ตัวตรวจสอบจะรายงานว่าข้อมูลรับรองถูกกำหนดค่าไว้แต่ใช้งานไม่ได้ และข้าม auto-resolution แทนการ crash หรือรายงานผิดว่าโทเค็นหายไป

  </Accordion>
  <Accordion title="13. การตรวจสุขภาพ Gateway + restart">
    ตัวตรวจสอบจะรันการตรวจสุขภาพและเสนอให้ restart gateway เมื่อดูเหมือนไม่ปกติ
  </Accordion>
  <Accordion title="13b. ความพร้อมของการค้นหาหน่วยความจำ">
    ตัวตรวจสอบจะตรวจว่า embedding provider สำหรับการค้นหาหน่วยความจำที่กำหนดค่าไว้พร้อมสำหรับ agent เริ่มต้นหรือไม่ พฤติกรรมขึ้นอยู่กับ backend และ provider ที่กำหนดค่าไว้:

    - **QMD backend**: probe ว่า binary `qmd` พร้อมใช้งานและเริ่มได้หรือไม่ หากไม่ได้ จะพิมพ์คำแนะนำการแก้ไขรวมถึงแพ็กเกจ npm และตัวเลือกพาธ binary แบบ manual
    - **ผู้ให้บริการ local แบบ explicit**: ตรวจหาไฟล์โมเดล local หรือ URL โมเดล remote/downloadable ที่รู้จัก หากหายไป จะแนะนำให้สลับไปใช้ provider แบบ remote
    - **ผู้ให้บริการ remote แบบ explicit** (`openai`, `voyage` ฯลฯ): ตรวจสอบว่ามี API key อยู่ใน environment หรือ auth store หรือไม่ พิมพ์คำแนะนำการแก้ไขที่ดำเนินการได้หากหายไป
    - **ผู้ให้บริการ auto**: ตรวจความพร้อมของโมเดล local ก่อน จากนั้นลองผู้ให้บริการ remote แต่ละรายตามลำดับ auto-selection

    เมื่อมีผลลัพธ์การตรวจสอบ Gateway แบบแคชให้ใช้งาน (Gateway มีสถานะปกติ ณ เวลาที่ตรวจสอบ) doctor จะเทียบผลลัพธ์นั้นกับการกำหนดค่าที่ CLI มองเห็น และแจ้งความคลาดเคลื่อนใด ๆ Doctor จะไม่เริ่ม ping embedding ใหม่ในเส้นทางเริ่มต้น ให้ใช้คำสั่งสถานะหน่วยความจำแบบ deep เมื่อคุณต้องการตรวจสอบผู้ให้บริการแบบสด

    ใช้ `openclaw memory status --deep` เพื่อตรวจสอบความพร้อมของ embedding ขณะรันไทม์

  </Accordion>
  <Accordion title="14. คำเตือนสถานะช่องทาง">
    หาก Gateway มีสถานะปกติ doctor จะเรียกใช้การตรวจสอบสถานะช่องทาง และรายงานคำเตือนพร้อมคำแนะนำการแก้ไข
  </Accordion>
  <Accordion title="15. การตรวจสอบ + ซ่อมแซมการกำหนดค่า supervisor">
    Doctor ตรวจสอบการกำหนดค่า supervisor ที่ติดตั้งไว้ (launchd/systemd/schtasks) เพื่อหาค่าเริ่มต้นที่ขาดหายหรือล้าสมัย (เช่น การพึ่งพา network-online ของ systemd และความล่าช้าในการรีสตาร์ต) เมื่อพบความไม่ตรงกัน จะแนะนำให้อัปเดตและสามารถเขียนไฟล์บริการ/งานใหม่ให้เป็นค่าเริ่มต้นปัจจุบันได้

    หมายเหตุ:

    - `openclaw doctor` จะแจ้งก่อนเขียนการกำหนดค่า supervisor ใหม่
    - `openclaw doctor --yes` ยอมรับพรอมต์ซ่อมแซมเริ่มต้น
    - `openclaw doctor --repair` ใช้การแก้ไขที่แนะนำโดยไม่แจ้งพรอมต์
    - `openclaw doctor --repair --force` เขียนทับการกำหนดค่า supervisor แบบกำหนดเอง
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` ทำให้ doctor เป็นแบบอ่านอย่างเดียวสำหรับวงจรชีวิตบริการ Gateway โดยยังรายงานสุขภาพบริการและเรียกใช้การซ่อมแซมที่ไม่ใช่บริการ แต่ข้ามการติดตั้ง/เริ่ม/รีสตาร์ต/บูตสแตรปบริการ การเขียนการกำหนดค่า supervisor ใหม่ และการล้างบริการแบบเดิม เพราะ supervisor ภายนอกเป็นเจ้าของวงจรชีวิตนั้น
    - บน Linux doctor จะไม่เขียนเมตาดาต้า command/entrypoint ใหม่ขณะที่ systemd gateway unit ที่ตรงกันยังทำงานอยู่ และยังละเว้น unit เพิ่มเติมที่คล้าย Gateway แบบไม่ใช่ legacy และไม่ทำงาน ระหว่างการสแกนบริการซ้ำ เพื่อไม่ให้ไฟล์บริการประกอบสร้างเสียงรบกวนในการล้างข้อมูล
    - หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็น และ `gateway.auth.token` จัดการโดย SecretRef การติดตั้ง/ซ่อมแซมบริการของ doctor จะตรวจสอบ SecretRef แต่จะไม่คงค่าข้อความธรรมดาของโทเค็นที่ resolve แล้วไว้ในเมตาดาต้า environment ของบริการ supervisor
    - Doctor ตรวจจับค่า environment ของบริการที่จัดการผ่าน `.env`/SecretRef ซึ่งการติดตั้ง LaunchAgent, systemd หรือ Windows Scheduled Task รุ่นเก่าฝังไว้แบบ inline และเขียนเมตาดาต้าบริการใหม่เพื่อให้ค่าเหล่านั้นโหลดจากแหล่งรันไทม์แทนคำจำกัดความของ supervisor
    - Doctor ตรวจจับเมื่อคำสั่งบริการยังตรึง `--port` เก่าไว้หลังจาก `gateway.port` เปลี่ยน และเขียนเมตาดาต้าบริการใหม่ให้ใช้พอร์ตปัจจุบัน
    - หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็น และ SecretRef ของโทเค็นที่กำหนดค่าไว้ยัง resolve ไม่ได้ doctor จะบล็อกเส้นทางติดตั้ง/ซ่อมแซมพร้อมคำแนะนำที่นำไปปฏิบัติได้
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้งค่า mode อย่างชัดเจน
    - สำหรับ Linux user-systemd units การตรวจสอบความคลาดเคลื่อนของโทเค็นโดย doctor ตอนนี้รวมทั้งแหล่ง `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบเมตาดาต้าการยืนยันตัวตนของบริการ
    - การซ่อมแซมบริการของ Doctor จะปฏิเสธการเขียนใหม่ หยุด หรือรีสตาร์ตบริการ Gateway จากไบนารี OpenClaw รุ่นเก่า เมื่อการกำหนดค่าถูกเขียนล่าสุดโดยเวอร์ชันที่ใหม่กว่า ดู [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)
    - คุณสามารถบังคับเขียนใหม่ทั้งหมดได้เสมอผ่าน `openclaw gateway install --force`

  </Accordion>
  <Accordion title="16. การวินิจฉัยรันไทม์ + พอร์ตของ Gateway">
    Doctor ตรวจสอบรันไทม์ของบริการ (PID, สถานะ exit ล่าสุด) และเตือนเมื่อมีการติดตั้งบริการแล้วแต่ไม่ได้ทำงานจริง นอกจากนี้ยังตรวจสอบการชนกันของพอร์ตบนพอร์ต Gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (Gateway ทำงานอยู่แล้ว, SSH tunnel)
  </Accordion>
  <Accordion title="17. แนวทางปฏิบัติที่ดีสำหรับรันไทม์ของ Gateway">
    Doctor เตือนเมื่อบริการ Gateway ทำงานบน Bun หรือพาธ Node ที่จัดการด้วยเวอร์ชัน (`nvm`, `fnm`, `volta`, `asdf` ฯลฯ) ช่องทาง WhatsApp + Telegram ต้องใช้ Node และพาธของตัวจัดการเวอร์ชันอาจเสียหลังการอัปเกรด เพราะบริการไม่โหลด shell init ของคุณ Doctor เสนอให้ย้ายไปใช้การติดตั้ง Node ระดับระบบเมื่อพร้อมใช้งาน (Homebrew/apt/choco)

    บริการที่ติดตั้งหรือซ่อมแซมใหม่จะเก็บ environment roots แบบชัดเจน (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) และไดเรกทอรี user-bin ที่เสถียร แต่ไดเรกทอรีสำรองของตัวจัดการเวอร์ชันที่เดาจะถูกเขียนลงใน PATH ของบริการเฉพาะเมื่อไดเรกทอรีเหล่านั้นมีอยู่บนดิสก์เท่านั้น วิธีนี้ทำให้ PATH ของ supervisor ที่สร้างขึ้นสอดคล้องกับการตรวจสอบ minimal-PATH เดียวกันที่ doctor เรียกใช้ภายหลัง

  </Accordion>
  <Accordion title="18. การเขียนการกำหนดค่า + เมตาดาต้า wizard">
    Doctor คงการเปลี่ยนแปลงการกำหนดค่าใด ๆ และประทับเมตาดาต้า wizard เพื่อบันทึกการรัน doctor
  </Accordion>
  <Accordion title="19. เคล็ดลับ workspace (การสำรองข้อมูล + ระบบหน่วยความจำ)">
    Doctor แนะนำระบบหน่วยความจำของ workspace เมื่อขาดหาย และพิมพ์เคล็ดลับการสำรองข้อมูลหาก workspace ยังไม่ได้อยู่ภายใต้ git

    ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคู่มือฉบับเต็มเกี่ยวกับโครงสร้าง workspace และการสำรองข้อมูลด้วย git (แนะนำ GitHub หรือ GitLab แบบส่วนตัว)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [รันบุ๊ก Gateway](/th/gateway)
- [การแก้ปัญหา Gateway](/th/gateway/troubleshooting)
