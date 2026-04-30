---
read_when:
    - การเพิ่มหรือแก้ไขไมเกรชันของ doctor
    - การนำการเปลี่ยนแปลงการกำหนดค่าที่ไม่เข้ากันย้อนหลังมาใช้
sidebarTitle: Doctor
summary: 'คำสั่ง Doctor: การตรวจสอบสุขภาพ การย้ายข้อมูลการกำหนดค่า และขั้นตอนการซ่อมแซม'
title: ตรวจสุขภาพ
x-i18n:
    generated_at: "2026-04-30T09:52:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: c27b8e85eb0a577e676f0e6e205262775ff37303453e64fc1bc2adaf8b51147c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` เป็นเครื่องมือซ่อมแซม + ย้ายข้อมูลสำหรับ OpenClaw โดยจะแก้ไข config/state ที่ล้าสมัย ตรวจสอบสุขภาพ และให้ขั้นตอนการซ่อมแซมที่นำไปปฏิบัติได้

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

    ยอมรับค่าเริ่มต้นโดยไม่ถามยืนยัน (รวมถึงขั้นตอนซ่อมแซมการรีสตาร์ท/บริการ/sandbox เมื่อใช้ได้)

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    ใช้การซ่อมแซมที่แนะนำโดยไม่ถามยืนยัน (การซ่อมแซม + การรีสตาร์ทเมื่อปลอดภัย)

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

    เรียกใช้โดยไม่มีพรอมป์ และใช้เฉพาะการย้ายข้อมูลที่ปลอดภัย (การปรับ config ให้เป็นมาตรฐาน + การย้ายสถานะบนดิสก์) ข้ามการดำเนินการรีสตาร์ท/บริการ/sandbox ที่ต้องมีการยืนยันจากคน การย้ายข้อมูลสถานะ legacy จะทำงานอัตโนมัติเมื่อตรวจพบ

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    สแกนบริการระบบเพื่อหาการติดตั้ง gateway เพิ่มเติม (launchd/systemd/schtasks)

  </Tab>
</Tabs>

หากคุณต้องการตรวจทานการเปลี่ยนแปลงก่อนเขียน ให้เปิดไฟล์ config ก่อน:

```bash
cat ~/.openclaw/openclaw.json
```

## สิ่งที่เครื่องมือนี้ทำ (สรุป)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - การอัปเดตก่อนเริ่มแบบเลือกได้สำหรับการติดตั้งจาก git (เฉพาะแบบโต้ตอบ)
    - การตรวจสอบความสดใหม่ของโปรโตคอล UI (สร้าง Control UI ใหม่เมื่อ schema โปรโตคอลใหม่กว่า)
    - การตรวจสุขภาพ + พรอมป์รีสตาร์ท
    - สรุปสถานะ Skills (มีสิทธิ์/ขาดหาย/ถูกบล็อก) และสถานะ Plugin

  </Accordion>
  <Accordion title="Config and migrations">
    - การปรับ config ให้เป็นมาตรฐานสำหรับค่า legacy
    - การย้าย config ของ Talk จากฟิลด์ legacy แบบแบน `talk.*` ไปเป็น `talk.provider` + `talk.providers.<provider>`
    - การตรวจสอบการย้ายข้อมูลเบราว์เซอร์สำหรับ config legacy ของ Chrome extension และความพร้อมของ Chrome MCP
    - คำเตือนการ override provider ของ OpenCode (`models.providers.opencode` / `models.providers.opencode-go`)
    - คำเตือนการ shadowing ของ Codex OAuth (`models.providers.openai-codex`)
    - การตรวจสอบข้อกำหนดเบื้องต้นของ OAuth TLS สำหรับโปรไฟล์ OpenAI Codex OAuth
    - การย้ายสถานะ legacy บนดิสก์ (sessions/agent dir/WhatsApp auth)
    - การย้ายคีย์ contract ของ manifest Plugin แบบ legacy (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
    - การย้าย store ของ cron แบบ legacy (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบนสุด, payload `provider`, งาน webhook fallback แบบง่าย `notify: true`)
    - การย้ายนโยบาย runtime ของ agent แบบ legacy ไปยัง `agents.defaults.agentRuntime` และ `agents.list[].agentRuntime`
    - การล้าง config Plugin ที่ล้าสมัยเมื่อเปิดใช้ plugins; เมื่อ `plugins.enabled=false` การอ้างอิง Plugin ที่ล้าสมัยจะถือเป็น config containment ที่ไม่ทำงานและจะถูกเก็บไว้

  </Accordion>
  <Accordion title="State and integrity">
    - การตรวจสอบไฟล์ lock ของ session และการล้าง lock ที่ล้าสมัย
    - การซ่อมแซม transcript ของ session สำหรับกิ่ง prompt-rewrite ที่ซ้ำกันซึ่งสร้างโดย build 2026.4.24 ที่ได้รับผลกระทบ
    - การตรวจสอบความถูกต้องสมบูรณ์ของสถานะและ permission (sessions, transcripts, state dir)
    - การตรวจสอบ permission ของไฟล์ config (chmod 600) เมื่อเรียกใช้ภายในเครื่อง
    - สุขภาพของ model auth: ตรวจสอบการหมดอายุของ OAuth, รีเฟรช token ที่ใกล้หมดอายุได้, และรายงานสถานะ cooldown/disabled ของ auth-profile
    - การตรวจหา workspace dir เพิ่มเติม (`~/openclaw`)

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - การซ่อมแซมอิมเมจ sandbox เมื่อเปิดใช้ sandboxing
    - การย้ายบริการ legacy และการตรวจหา gateway เพิ่มเติม
    - การย้ายสถานะ legacy ของช่องทาง Matrix (ในโหมด `--fix` / `--repair`)
    - การตรวจสอบ runtime ของ Gateway (ติดตั้งบริการแล้วแต่ไม่ได้ทำงาน; label ของ launchd ที่แคชไว้)
    - คำเตือนสถานะช่องทาง (probe จาก gateway ที่กำลังทำงาน)
    - การ audit config supervisor (launchd/systemd/schtasks) พร้อมการซ่อมแซมแบบเลือกได้
    - การล้างสภาพแวดล้อม embedded proxy สำหรับบริการ gateway ที่จับค่า shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` ระหว่างการติดตั้งหรืออัปเดต
    - การตรวจสอบแนวปฏิบัติที่ดีของ runtime ของ Gateway (Node เทียบกับ Bun, path ของ version-manager)
    - การวินิจฉัย port collision ของ Gateway (ค่าเริ่มต้น `18789`)

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - คำเตือนด้านความปลอดภัยสำหรับนโยบาย DM แบบเปิด
    - การตรวจสอบ auth ของ Gateway สำหรับโหมด token ภายในเครื่อง (เสนอการสร้าง token เมื่อไม่มีแหล่ง token; ไม่เขียนทับ config token SecretRef)
    - การตรวจหาปัญหาการ pairing อุปกรณ์ (คำขอ pair ครั้งแรกที่ค้างอยู่, การอัปเกรด role/scope ที่ค้างอยู่, drift ของแคช device-token ภายในเครื่องที่ล้าสมัย, และ drift ของ auth ใน paired-record)

  </Accordion>
  <Accordion title="Workspace and shell">
    - การตรวจสอบ systemd linger บน Linux
    - การตรวจสอบขนาดไฟล์ bootstrap ของ workspace (คำเตือนการตัดทอน/ใกล้ขีดจำกัดสำหรับไฟล์ context)
    - การตรวจสอบสถานะ shell completion และการติดตั้ง/อัปเกรดอัตโนมัติ
    - การตรวจสอบความพร้อมของ provider สำหรับ memory search embedding (โมเดลภายในเครื่อง, คีย์ API ระยะไกล, หรือ binary QMD)
    - การตรวจสอบการติดตั้งจาก source (pnpm workspace ไม่ตรงกัน, ขาด asset ของ UI, ขาด binary tsx)
    - เขียน config ที่อัปเดต + metadata ของ wizard

  </Accordion>
</AccordionGroup>

## การ backfill และ reset ของ Dreams UI

ฉาก Dreams ใน Control UI มี action **Backfill**, **Reset**, และ **Clear Grounded** สำหรับ workflow grounded dreaming action เหล่านี้ใช้เมธอด RPC แบบ gateway doctor แต่ **ไม่ใช่** ส่วนหนึ่งของการซ่อมแซม/ย้ายข้อมูลของ CLI `openclaw doctor`

สิ่งที่ action เหล่านี้ทำ:

- **Backfill** สแกนไฟล์ประวัติ `memory/YYYY-MM-DD.md` ใน workspace ที่ใช้งานอยู่ เรียกใช้ grounded REM diary pass และเขียนรายการ backfill ที่ย้อนกลับได้ลงใน `DREAMS.md`
- **Reset** ลบเฉพาะรายการ diary backfill ที่ทำเครื่องหมายไว้เหล่านั้นออกจาก `DREAMS.md`
- **Clear Grounded** ลบเฉพาะรายการ short-term แบบ grounded-only ที่ staged ไว้ ซึ่งมาจากการ replay ประวัติ และยังไม่ได้สะสม live recall หรือ daily support

สิ่งที่ action เหล่านี้ **ไม่** ทำด้วยตัวเอง:

- ไม่แก้ไข `MEMORY.md`
- ไม่เรียกใช้การย้ายข้อมูล doctor เต็มรูปแบบ
- ไม่ stage grounded candidates เข้าไปใน live short-term promotion store โดยอัตโนมัติ เว้นแต่คุณจะเรียกใช้ path CLI แบบ staged ก่อนอย่างชัดเจน

หากคุณต้องการให้ grounded historical replay มีผลต่อ lane การโปรโมตเชิงลึกตามปกติ ให้ใช้ flow ของ CLI แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

คำสั่งนี้จะ stage grounded durable candidates เข้าไปใน short-term dreaming store โดยยังคงใช้ `DREAMS.md` เป็นพื้นผิวสำหรับตรวจทาน

## พฤติกรรมโดยละเอียดและเหตุผล

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    หากนี่เป็น git checkout และ doctor กำลังทำงานแบบโต้ตอบ จะเสนอให้อัปเดต (fetch/rebase/build) ก่อนเรียกใช้ doctor
  </Accordion>
  <Accordion title="1. Config normalization">
    หาก config มีรูปแบบค่า legacy (เช่น `messages.ackReaction` โดยไม่มี override เฉพาะช่องทาง) doctor จะปรับให้เป็นมาตรฐานตาม schema ปัจจุบัน

    ซึ่งรวมถึงฟิลด์แบนของ Talk แบบ legacy ด้วย config สาธารณะปัจจุบันของ Talk คือ `talk.provider` + `talk.providers.<provider>` Doctor จะเขียนรูปแบบเก่า `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ใหม่เป็น map ของ provider

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    เมื่อ config มีคีย์ที่เลิกใช้แล้ว คำสั่งอื่นจะปฏิเสธไม่ทำงานและขอให้คุณเรียกใช้ `openclaw doctor`

    Doctor จะ:

    - อธิบายว่าพบคีย์ legacy ใดบ้าง
    - แสดงการย้ายข้อมูลที่นำไปใช้
    - เขียน `~/.openclaw/openclaw.json` ใหม่ด้วย schema ที่อัปเดตแล้ว

    Gateway ยังเรียกใช้การย้ายข้อมูลของ doctor อัตโนมัติเมื่อเริ่มต้น หากตรวจพบรูปแบบ config legacy ดังนั้น config ที่ล้าสมัยจะถูกซ่อมแซมโดยไม่ต้องดำเนินการเอง การย้ายข้อมูล store ของงาน Cron จัดการโดย `openclaw doctor --fix`

    การย้ายข้อมูลปัจจุบัน:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` ระดับบนสุด
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - legacy `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - สำหรับช่องทางที่มี `accounts` แบบตั้งชื่อ แต่ยังมีค่าช่องทางระดับบนสุดแบบ single-account ค้างอยู่ ให้ย้ายค่าที่อยู่ใน scope ของบัญชีเหล่านั้นเข้าไปในบัญชีที่ถูกโปรโมตสำหรับช่องทางนั้น (`accounts.default` สำหรับช่องทางส่วนใหญ่; Matrix สามารถเก็บ target แบบ named/default ที่ตรงกันซึ่งมีอยู่แล้วได้)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - ลบ `agents.defaults.llm`; ใช้ `models.providers.<id>.timeoutSeconds` สำหรับ timeout ของ provider/model ที่ช้า
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - ลบ `browser.relayBindHost` (การตั้งค่า relay ของ extension แบบ legacy)
    - legacy `models.providers.*.api: "openai"` → `"openai-completions"` (การเริ่มต้น gateway ยังข้าม provider ที่ตั้งค่า `api` เป็นค่า enum ในอนาคตหรือไม่รู้จัก แทนที่จะ fail closed)

    คำเตือนของ Doctor ยังรวมคำแนะนำ account-default สำหรับช่องทางแบบหลายบัญชี:

    - หากตั้งค่า `channels.<channel>.accounts` สองรายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default` doctor จะเตือนว่า fallback routing อาจเลือกบัญชีที่ไม่คาดคิด
    - หากตั้งค่า `channels.<channel>.defaultAccount` เป็น ID บัญชีที่ไม่รู้จัก doctor จะเตือนและแสดงรายการ ID บัญชีที่ตั้งค่าไว้

  </Accordion>
  <Accordion title="2b. การ override ผู้ให้บริการ OpenCode">
    หากคุณเพิ่ม `models.providers.opencode`, `opencode-zen` หรือ `opencode-go` ด้วยตนเอง ค่าเหล่านี้จะ override แค็ตตาล็อก OpenCode ในตัวจาก `@mariozechner/pi-ai` ซึ่งอาจบังคับให้โมเดลไปใช้ API ที่ไม่ถูกต้อง หรือทำให้ต้นทุนกลายเป็นศูนย์ Doctor จะเตือนเพื่อให้คุณลบการ override และกู้คืนการกำหนดเส้นทาง API ตามโมเดลพร้อมต้นทุนกลับมาได้
  </Accordion>
  <Accordion title="2c. การย้ายเบราว์เซอร์และความพร้อมของ Chrome MCP">
    หากการตั้งค่าเบราว์เซอร์ของคุณยังชี้ไปยังพาธส่วนขยาย Chrome ที่ถูกลบไปแล้ว doctor จะปรับให้เป็นโมเดลการแนบ Chrome MCP บนโฮสต์ภายในปัจจุบัน:

    - `browser.profiles.*.driver: "extension"` กลายเป็น `"existing-session"`
    - `browser.relayBindHost` ถูกลบออก

    Doctor ยังตรวจสอบพาธ Chrome MCP บนโฮสต์ภายในเมื่อคุณใช้ `defaultProfile: "user"` หรือโปรไฟล์ `existing-session` ที่ตั้งค่าไว้:

    - ตรวจสอบว่า Google Chrome ติดตั้งอยู่บนโฮสต์เดียวกันสำหรับโปรไฟล์เชื่อมต่ออัตโนมัติเริ่มต้นหรือไม่
    - ตรวจสอบเวอร์ชัน Chrome ที่ตรวจพบ และเตือนเมื่อเวอร์ชันต่ำกว่า Chrome 144
    - เตือนให้คุณเปิดใช้การดีบักระยะไกลในหน้า inspect ของเบราว์เซอร์ (เช่น `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` หรือ `edge://inspect/#remote-debugging`)

    Doctor ไม่สามารถเปิดการตั้งค่าฝั่ง Chrome ให้คุณได้ Chrome MCP บนโฮสต์ภายในยังต้องมี:

    - เบราว์เซอร์ที่อิง Chromium เวอร์ชัน 144+ บนโฮสต์ gateway/node
    - เบราว์เซอร์ทำงานอยู่ภายในเครื่อง
    - เปิดใช้การดีบักระยะไกลในเบราว์เซอร์นั้น
    - อนุมัติพรอมป์ความยินยอมสำหรับการแนบครั้งแรกในเบราว์เซอร์

    ความพร้อมในที่นี้เกี่ยวข้องเฉพาะข้อกำหนดเบื้องต้นสำหรับการแนบภายในเครื่องเท่านั้น Existing-session ยังคงมีขีดจำกัดเส้นทาง Chrome MCP ปัจจุบัน เส้นทางขั้นสูงอย่าง `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และการทำงานแบบกลุ่มยังต้องใช้เบราว์เซอร์ที่มีการจัดการหรือโปรไฟล์ CDP ดิบ

    การตรวจสอบนี้ **ไม่** ใช้กับ Docker, sandbox, remote-browser หรือโฟลว์ headless อื่น ๆ โฟลว์เหล่านั้นยังคงใช้ CDP ดิบต่อไป

  </Accordion>
  <Accordion title="2d. ข้อกำหนดเบื้องต้นของ OAuth TLS">
    เมื่อมีการตั้งค่าโปรไฟล์ OpenAI Codex OAuth doctor จะตรวจสอบปลายทางการอนุญาตของ OpenAI เพื่อยืนยันว่าสแตก TLS ของ Node/OpenSSL ภายในเครื่องสามารถตรวจสอบ chain ของใบรับรองได้ หากการตรวจสอบล้มเหลวด้วยข้อผิดพลาดเกี่ยวกับใบรับรอง (เช่น `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ใบรับรองหมดอายุ หรือใบรับรอง self-signed) doctor จะพิมพ์คำแนะนำการแก้ไขเฉพาะแพลตฟอร์ม บน macOS ที่ใช้ Homebrew Node การแก้มักเป็น `brew postinstall ca-certificates` เมื่อใช้ `--deep` การตรวจสอบจะทำงานแม้ gateway จะสมบูรณ์ดีอยู่แล้ว
  </Accordion>
  <Accordion title="2e. การ override ผู้ให้บริการ Codex OAuth">
    หากคุณเคยเพิ่มการตั้งค่าการขนส่ง OpenAI แบบเก่าไว้ใต้ `models.providers.openai-codex` การตั้งค่าเหล่านี้อาจบดบังพาธผู้ให้บริการ Codex OAuth ในตัวที่รุ่นใหม่กว่าใช้อัตโนมัติ Doctor จะเตือนเมื่อพบการตั้งค่าการขนส่งเก่าเหล่านั้นอยู่ร่วมกับ Codex OAuth เพื่อให้คุณลบหรือเขียนการ override การขนส่งที่ล้าสมัยใหม่ และได้พฤติกรรมการกำหนดเส้นทาง/ fallback ในตัวกลับคืนมา พร็อกซีแบบกำหนดเองและการ override เฉพาะ header ยังรองรับอยู่และจะไม่ทำให้เกิดคำเตือนนี้
  </Accordion>
  <Accordion title="2f. คำเตือนเส้นทาง Plugin Codex">
    เมื่อเปิดใช้ Plugin Codex ที่รวมมาให้แล้ว doctor จะตรวจสอบด้วยว่า refs ของโมเดลหลัก `openai-codex/*` ยังคง resolve ผ่าน PI runner เริ่มต้นหรือไม่ ชุดค่านี้ใช้ได้เมื่อคุณต้องการ auth แบบ Codex OAuth/subscription ผ่าน PI แต่สับสนกับ harness ของ app-server Codex แบบ native ได้ง่าย Doctor จะเตือนและชี้ไปยังรูปแบบ app-server ที่ชัดเจน: `openai/*` พร้อม `agentRuntime.id: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex`

    Doctor ไม่ซ่อมสิ่งนี้โดยอัตโนมัติ เพราะทั้งสองเส้นทางใช้ได้:

    - `openai-codex/*` + PI หมายถึง "ใช้ auth แบบ Codex OAuth/subscription ผ่าน runner ปกติของ OpenClaw"
    - `openai/*` + `runtime: "codex"` หมายถึง "รันเทิร์นที่ฝังไว้ผ่าน app-server Codex แบบ native"
    - `/codex ...` หมายถึง "ควบคุมหรือ bind การสนทนา Codex แบบ native จากแชต"
    - `/acp ...` หรือ `runtime: "acp"` หมายถึง "ใช้อะแดปเตอร์ ACP/acpx ภายนอก"

    หากคำเตือนปรากฏขึ้น ให้เลือกเส้นทางที่คุณตั้งใจใช้และแก้ไข config ด้วยตนเอง คงคำเตือนไว้ตามเดิมเมื่อ PI Codex OAuth เป็นสิ่งที่ตั้งใจไว้

  </Accordion>
  <Accordion title="3. การย้ายสถานะเดิม (เลย์เอาต์บนดิสก์)">
    Doctor สามารถย้ายเลย์เอาต์บนดิสก์รุ่นเก่าเข้าสู่โครงสร้างปัจจุบันได้:

    - ที่เก็บเซสชัน + บันทึกการสนทนา:
      - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
    - ไดเรกทอรีเอเจนต์:
      - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
    - สถานะการยืนยันตัวตนของ WhatsApp (Baileys):
      - จาก `~/.openclaw/credentials/*.json` แบบเดิม (ยกเว้น `oauth.json`)
      - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID บัญชีเริ่มต้น: `default`)

    การย้ายข้อมูลเหล่านี้เป็นแบบพยายามให้ดีที่สุดและทำซ้ำได้อย่างปลอดภัย; doctor จะส่งคำเตือนเมื่อปล่อยให้โฟลเดอร์เดิมใด ๆ ค้างไว้เป็นข้อมูลสำรอง Gateway/CLI ยังย้ายที่เก็บเซสชันเดิม + ไดเรกทอรีเอเจนต์โดยอัตโนมัติเมื่อเริ่มทำงานด้วย เพื่อให้ประวัติ/การยืนยันตัวตน/โมเดลไปอยู่ในเส้นทางแบบรายเอเจนต์โดยไม่ต้องรัน doctor เอง การยืนยันตัวตนของ WhatsApp ตั้งใจให้ย้ายผ่าน `openclaw doctor` เท่านั้น การทำให้ผู้ให้บริการพูดคุย/แมปผู้ให้บริการเป็นมาตรฐานตอนนี้เปรียบเทียบด้วยความเท่ากันเชิงโครงสร้าง ดังนั้นความต่างที่มีแค่ลำดับคีย์จะไม่ทริกเกอร์การเปลี่ยนแปลง `doctor --fix` แบบไม่ทำอะไรซ้ำอีกต่อไป

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor จะสแกน manifest ของ Plugin ที่ติดตั้งทั้งหมดเพื่อหาคีย์ความสามารถระดับบนสุดที่เลิกใช้แล้ว (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) เมื่อพบแล้ว จะเสนอให้ย้ายคีย์เหล่านั้นเข้าไปในออบเจ็กต์ `contracts` และเขียนไฟล์ manifest ใหม่แทนที่ไฟล์เดิม การย้ายข้อมูลนี้ทำซ้ำได้อย่างปลอดภัย; หากคีย์ `contracts` มีค่าเดียวกันอยู่แล้ว คีย์เดิมจะถูกลบออกโดยไม่ทำซ้ำข้อมูล
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor ยังตรวจสอบที่เก็บงาน Cron (`~/.openclaw/cron/jobs.json` ตามค่าเริ่มต้น หรือ `cron.store` เมื่อมีการแทนที่) เพื่อหารูปร่างงานแบบเก่าที่ตัวจัดตารางเวลายังยอมรับเพื่อความเข้ากันได้

    การล้างข้อมูล Cron ปัจจุบันประกอบด้วย:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - ฟิลด์ payload ระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
    - ฟิลด์ delivery ระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - นามแฝง delivery ของ `provider` ใน payload → `delivery.channel` แบบชัดเจน
    - งานสำรอง Webhook แบบเดิมอย่างง่าย `notify: true` → `delivery.mode="webhook"` แบบชัดเจนพร้อม `delivery.to=cron.webhook`

    Doctor จะย้ายงาน `notify: true` โดยอัตโนมัติก็ต่อเมื่อทำได้โดยไม่เปลี่ยนพฤติกรรม หากงานรวมการสำรอง notify แบบเดิมเข้ากับโหมด delivery ที่มีอยู่ซึ่งไม่ใช่ Webhook doctor จะเตือนและปล่อยงานนั้นไว้ให้ตรวจทานด้วยตนเอง

  </Accordion>
  <Accordion title="3c. Session lock cleanup">
    Doctor จะสแกนไดเรกทอรีเซสชันของเอเจนต์ทุกตัวเพื่อหาไฟล์ล็อกการเขียนที่ค้างอยู่ — ไฟล์ที่เหลือไว้เมื่อเซสชันออกอย่างผิดปกติ สำหรับไฟล์ล็อกแต่ละไฟล์ที่พบ ระบบจะรายงาน: เส้นทาง, PID, ว่า PID ยังทำงานอยู่หรือไม่, อายุของล็อก และถือว่าค้างอยู่หรือไม่ (PID ตายแล้วหรือเก่ากว่า 30 นาที) ในโหมด `--fix` / `--repair` ระบบจะลบไฟล์ล็อกที่ค้างอยู่โดยอัตโนมัติ; มิฉะนั้นจะพิมพ์หมายเหตุและบอกให้คุณรันใหม่พร้อม `--fix`
  </Accordion>
  <Accordion title="3d. Session transcript branch repair">
    Doctor จะสแกนไฟล์ JSONL ของเซสชันเอเจนต์เพื่อหารูปร่างกิ่งที่ซ้ำกันซึ่งเกิดจากบั๊กการเขียนบันทึก prompt ใหม่เมื่อ 2026.4.24: รอบผู้ใช้ที่ถูกทิ้งไว้พร้อมบริบทรันไทม์ภายในของ OpenClaw และกิ่งพี่น้องที่ยังใช้งานอยู่ซึ่งมี prompt ผู้ใช้ที่มองเห็นได้เดียวกัน ในโหมด `--fix` / `--repair` doctor จะสำรองไฟล์ที่ได้รับผลกระทบแต่ละไฟล์ไว้ข้างไฟล์ต้นฉบับ และเขียนบันทึกการสนทนาใหม่ให้เป็นกิ่งที่ใช้งานอยู่ เพื่อให้ประวัติ Gateway และตัวอ่านหน่วยความจำไม่เห็นรอบที่ซ้ำกันอีกต่อไป
  </Accordion>
  <Accordion title="4. State integrity checks (session persistence, routing, and safety)">
    ไดเรกทอรีสถานะคือแกนควบคุมการทำงาน หากมันหายไป คุณจะสูญเสียเซสชัน ข้อมูลประจำตัว บันทึก และการกำหนดค่า (เว้นแต่คุณจะมีข้อมูลสำรองอยู่ที่อื่น)

    การตรวจสอบของ doctor:

    - **ไดเรกทอรีสถานะหายไป**: เตือนเกี่ยวกับการสูญเสียสถานะอย่างร้ายแรง แจ้งให้สร้างไดเรกทอรีใหม่ และย้ำว่าไม่สามารถกู้คืนข้อมูลที่หายไปได้
    - **สิทธิ์ของไดเรกทอรีสถานะ**: ตรวจสอบว่าสามารถเขียนได้ เสนอให้ซ่อมแซมสิทธิ์ (และแสดงคำแนะนำ `chown` เมื่อตรวจพบว่าเจ้าของ/กลุ่มไม่ตรงกัน)
    - **ไดเรกทอรีสถานะบน macOS ที่ซิงก์กับคลาวด์**: เตือนเมื่อสถานะถูก resolve อยู่ใต้ iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ `~/Library/CloudStorage/...` เพราะพาธที่มีการซิงก์รองรับอาจทำให้ I/O ช้าลงและเกิดการแข่งขันของการล็อก/การซิงก์ได้
    - **ไดเรกทอรีสถานะบน SD หรือ eMMC ของ Linux**: เตือนเมื่อสถานะถูก resolve ไปยังแหล่งเมานต์ `mmcblk*` เพราะ I/O แบบสุ่มที่รองรับด้วย SD หรือ eMMC อาจช้ากว่าและสึกหรอเร็วขึ้นเมื่อมีการเขียนเซสชันและข้อมูลประจำตัว
    - **ไดเรกทอรีเซสชันหายไป**: ต้องมี `sessions/` และไดเรกทอรีจัดเก็บเซสชันเพื่อคงประวัติไว้และหลีกเลี่ยงการ crash แบบ `ENOENT`
    - **ทรานสคริปต์ไม่ตรงกัน**: เตือนเมื่อรายการเซสชันล่าสุดมีไฟล์ทรานสคริปต์หายไป
    - **เซสชันหลัก "JSONL 1 บรรทัด"**: แจ้งเมื่อทรานสคริปต์หลักมีเพียงหนึ่งบรรทัด (ประวัติไม่ได้สะสมเพิ่ม)
    - **ไดเรกทอรีสถานะหลายแห่ง**: เตือนเมื่อมีโฟลเดอร์ `~/.openclaw` หลายโฟลเดอร์อยู่ในไดเรกทอรี home ต่าง ๆ หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (ประวัติอาจแยกระหว่างการติดตั้ง)
    - **ตัวเตือนโหมดระยะไกล**: หาก `gateway.mode=remote` doctor จะเตือนให้คุณรันบนโฮสต์ระยะไกล (สถานะอยู่ที่นั่น)
    - **สิทธิ์ของไฟล์ config**: เตือนหาก `~/.openclaw/openclaw.json` สามารถอ่านได้โดยกลุ่ม/คนทั่วไป และเสนอให้จำกัดสิทธิ์เป็น `600`

  </Accordion>
  <Accordion title="5. Model auth health (OAuth expiry)">
    doctor ตรวจสอบโปรไฟล์ OAuth ในที่เก็บ auth เตือนเมื่อโทเค็นกำลังจะหมดอายุ/หมดอายุแล้ว และสามารถรีเฟรชได้เมื่อปลอดภัย หากโปรไฟล์ OAuth/token ของ Anthropic เก่าเกินไป ระบบจะแนะนำคีย์ API ของ Anthropic หรือพาธ setup-token ของ Anthropic พรอมต์รีเฟรชจะแสดงเฉพาะเมื่อรันแบบโต้ตอบ (TTY); `--non-interactive` จะข้ามความพยายามรีเฟรช

    เมื่อการรีเฟรช OAuth ล้มเหลวถาวร (เช่น `refresh_token_reused`, `invalid_grant` หรือ provider แจ้งให้คุณลงชื่อเข้าใช้อีกครั้ง) doctor จะรายงานว่าต้อง auth ใหม่ และพิมพ์คำสั่ง `openclaw models auth login --provider ...` ที่ต้องรันอย่างชัดเจน

    doctor ยังรายงานโปรไฟล์ auth ที่ใช้งานไม่ได้ชั่วคราวเนื่องจาก:

    - คูลดาวน์สั้น ๆ (ขีดจำกัดอัตรา/หมดเวลา/auth ล้มเหลว)
    - การปิดใช้งานนานขึ้น (ปัญหาการเรียกเก็บเงิน/เครดิต)

  </Accordion>
  <Accordion title="6. Hooks model validation">
    หากตั้งค่า `hooks.gmail.model` ไว้ doctor จะตรวจสอบความถูกต้องของการอ้างอิงโมเดลเทียบกับแคตตาล็อกและ allowlist และเตือนเมื่อไม่สามารถ resolve ได้หรือไม่ได้รับอนุญาต
  </Accordion>
  <Accordion title="7. Sandbox image repair">
    เมื่อเปิดใช้ sandboxing doctor จะตรวจสอบอิมเมจ Docker และเสนอให้ build หรือสลับไปใช้ชื่อแบบ legacy หากอิมเมจปัจจุบันหายไป
  </Accordion>
  <Accordion title="7b. Bundled plugin runtime deps">
    doctor ตรวจสอบ runtime dependencies เฉพาะสำหรับ Plugin ที่บันเดิลมาซึ่ง active อยู่ใน config ปัจจุบันหรือเปิดใช้โดยค่าเริ่มต้นใน manifest ที่บันเดิลมา เช่น `plugins.entries.discord.enabled: true`, legacy `channels.discord.enabled: true`, `models.providers.*` ที่กำหนดค่าไว้ / การอ้างอิงโมเดลของเอเจนต์ หรือ Plugin ที่บันเดิลมาและเปิดใช้โดยค่าเริ่มต้นโดยไม่มีความเป็นเจ้าของ provider หากมีสิ่งใดหายไป doctor จะรายงานแพ็กเกจและติดตั้งให้ในโหมด `openclaw doctor --fix` / `openclaw doctor --repair` Plugin ภายนอกยังคงใช้ `openclaw plugins install` / `openclaw plugins update`; doctor จะไม่ติดตั้ง dependencies สำหรับพาธ Plugin ใด ๆ

    ระหว่างการซ่อมแซมของ doctor การติดตั้ง npm สำหรับ runtime-dependency ที่ bundled ไว้จะรายงานความคืบหน้าแบบ spinner ในเซสชัน TTY และรายงานความคืบหน้าเป็นบรรทัดเป็นระยะในเอาต์พุตแบบ pipe/headless Gateway และ CLI ในเครื่องยังสามารถซ่อมแซม dependency ของ runtime ของ bundled Plugin ที่ใช้งานอยู่ตามคำขอก่อน import bundled Plugin ได้ด้วย การติดตั้งเหล่านี้ถูกจำกัดขอบเขตไว้ที่รากการติดตั้ง runtime ของ Plugin, รันโดยปิด scripts, ไม่เขียน package lock และถูกป้องกันด้วย lock ของรากการติดตั้ง เพื่อให้การเริ่ม CLI หรือ Gateway พร้อมกันไม่แก้ไข tree `node_modules` เดียวกันในเวลาเดียวกัน

  </Accordion>
  <Accordion title="8. การย้ายบริการ Gateway และคำแนะนำการล้างข้อมูล">
    Doctor ตรวจพบบริการ gateway แบบเก่า (launchd/systemd/schtasks) และเสนอให้ลบออกพร้อมติดตั้งบริการ OpenClaw โดยใช้พอร์ต gateway ปัจจุบัน นอกจากนี้ยังสามารถสแกนหาบริการอื่นที่คล้าย gateway และพิมพ์คำแนะนำการล้างข้อมูลได้ บริการ gateway ของ OpenClaw ที่ตั้งชื่อตามโปรไฟล์ถือเป็นบริการชั้นหนึ่งและจะไม่ถูกทำเครื่องหมายว่าเป็น "extra"

    บน Linux หากบริการ gateway ระดับผู้ใช้หายไปแต่มีบริการ gateway ของ OpenClaw ระดับระบบอยู่ doctor จะไม่ติดตั้งบริการระดับผู้ใช้อีกชุดโดยอัตโนมัติ ตรวจสอบด้วย `openclaw gateway status --deep` หรือ `openclaw doctor --deep` จากนั้นลบรายการซ้ำหรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ system supervisor เป็นผู้ดูแล lifecycle ของ gateway

  </Accordion>
  <Accordion title="8b. การย้าย Startup Matrix">
    เมื่อบัญชีช่อง Matrix มีการย้ายสถานะแบบเก่าที่ค้างอยู่หรือดำเนินการได้ doctor (ในโหมด `--fix` / `--repair`) จะสร้าง snapshot ก่อนการย้าย แล้วรันขั้นตอนการย้ายแบบ best-effort: การย้ายสถานะ Matrix แบบเก่าและการเตรียม encrypted-state แบบเก่า ทั้งสองขั้นตอนไม่ทำให้ล้มเหลวร้ายแรง ข้อผิดพลาดจะถูกบันทึก log และการเริ่มต้นจะดำเนินต่อไป ในโหมดอ่านอย่างเดียว (`openclaw doctor` ที่ไม่มี `--fix`) การตรวจนี้จะถูกข้ามทั้งหมด
  </Accordion>
  <Accordion title="8c. การจับคู่อุปกรณ์และ auth drift">
    ตอนนี้ Doctor ตรวจสอบสถานะการจับคู่อุปกรณ์เป็นส่วนหนึ่งของการตรวจสุขภาพปกติ

    สิ่งที่รายงาน:

    - คำขอจับคู่ครั้งแรกที่ค้างอยู่
    - การอัปเกรดบทบาทที่ค้างอยู่สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การอัปเกรด scope ที่ค้างอยู่สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การซ่อมแซม public-key mismatch เมื่อ device id ยังตรงกัน แต่ตัวตนอุปกรณ์ไม่ตรงกับระเบียนที่อนุมัติแล้วอีกต่อไป
    - ระเบียนที่จับคู่แล้วซึ่งไม่มี token ที่ใช้งานอยู่สำหรับบทบาทที่อนุมัติ
    - token ที่จับคู่แล้วซึ่ง scope drift ออกนอก baseline การจับคู่ที่อนุมัติ
    - รายการ device-token ที่แคชไว้ในเครื่องสำหรับเครื่องปัจจุบัน ซึ่งเก่ากว่าการหมุนเวียน token ฝั่ง gateway หรือมี metadata ของ scope ที่ล้าสมัย

    Doctor ไม่อนุมัติคำขอจับคู่หรือหมุนเวียน device token โดยอัตโนมัติ แต่จะพิมพ์ขั้นตอนถัดไปที่แน่นอนแทน:

    - ตรวจสอบคำขอที่ค้างอยู่ด้วย `openclaw devices list`
    - อนุมัติคำขอที่เจาะจงด้วย `openclaw devices approve <requestId>`
    - หมุนเวียน token ใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
    - ลบและอนุมัติระเบียนที่ล้าสมัยอีกครั้งด้วย `openclaw devices remove <deviceId>`

    วิธีนี้ปิดช่องโหว่ทั่วไปแบบ "จับคู่แล้วแต่ยังถูกแจ้งว่าต้องจับคู่": ตอนนี้ doctor แยกแยะการจับคู่ครั้งแรกออกจากการอัปเกรดบทบาท/scope ที่ค้างอยู่ และจาก drift ของ token/ตัวตนอุปกรณ์ที่ล้าสมัย

  </Accordion>
  <Accordion title="9. คำเตือนด้านความปลอดภัย">
    Doctor แสดงคำเตือนเมื่อ provider เปิดรับ DM โดยไม่มี allowlist หรือเมื่อ policy ถูกกำหนดค่าในลักษณะที่เป็นอันตราย
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    หากรันเป็นบริการผู้ใช้ systemd doctor จะตรวจให้แน่ใจว่าเปิดใช้ lingering แล้ว เพื่อให้ gateway ยังทำงานหลัง logout
  </Accordion>
  <Accordion title="11. สถานะ workspace (Skills, Plugin, และไดเรกทอรีเก่า)">
    Doctor พิมพ์สรุปสถานะ workspace สำหรับ agent เริ่มต้น:

    - **สถานะ Skills**: นับจำนวน Skills ที่มีสิทธิ์ใช้งาน, ขาด requirements, และถูก allowlist บล็อก
    - **ไดเรกทอรี workspace เก่า**: เตือนเมื่อ `~/openclaw` หรือไดเรกทอรี workspace เก่าอื่นมีอยู่ข้าง workspace ปัจจุบัน
    - **สถานะ Plugin**: นับจำนวน Plugin ที่เปิดใช้/ปิดใช้/เกิดข้อผิดพลาด; แสดงรายการ Plugin ID สำหรับข้อผิดพลาดใดๆ; รายงานความสามารถของ bundled Plugin
    - **คำเตือนความเข้ากันได้ของ Plugin**: ทำเครื่องหมาย Plugin ที่มีปัญหาความเข้ากันได้กับ runtime ปัจจุบัน
    - **diagnostics ของ Plugin**: แสดงคำเตือนหรือข้อผิดพลาดใดๆ ระหว่างโหลดที่ออกมาจาก registry ของ Plugin

  </Accordion>
  <Accordion title="11b. ขนาดไฟล์ bootstrap">
    Doctor ตรวจว่าไฟล์ bootstrap ของ workspace (เช่น `AGENTS.md`, `CLAUDE.md` หรือไฟล์ context อื่นที่ inject เข้ามา) ใกล้หรือเกินงบจำนวนอักขระที่กำหนดไว้หรือไม่ โดยรายงานจำนวนอักขระ raw เทียบกับ injected ต่อไฟล์, เปอร์เซ็นต์การตัดทอน, สาเหตุการตัดทอน (`max/file` หรือ `max/total`) และจำนวนอักขระ injected รวมเป็นสัดส่วนของงบทั้งหมด เมื่อไฟล์ถูกตัดทอนหรือใกล้ถึงขีดจำกัด doctor จะพิมพ์คำแนะนำสำหรับปรับ `agents.defaults.bootstrapMaxChars` และ `agents.defaults.bootstrapTotalMaxChars`
  </Accordion>
  <Accordion title="11d. การล้าง channel Plugin ที่ล้าสมัย">
    เมื่อ `openclaw doctor --fix` ลบ channel Plugin ที่หายไป มันจะลบ config ที่ห้อยค้างในขอบเขต channel ซึ่งอ้างถึง Plugin นั้นด้วย: รายการ `channels.<id>`, เป้าหมาย Heartbeat ที่ตั้งชื่อ channel และ overrides ของ `agents.*.models["<channel>/*"]` วิธีนี้ป้องกัน boot loop ของ Gateway ที่ channel runtime หายไปแล้วแต่ config ยังขอให้ gateway bind เข้ากับมัน
  </Accordion>
  <Accordion title="11c. การเติมคำสั่งของ shell">
    Doctor ตรวจว่าติดตั้ง tab completion สำหรับ shell ปัจจุบันแล้วหรือไม่ (zsh, bash, fish หรือ PowerShell):

    - หากโปรไฟล์ shell ใช้รูปแบบ completion แบบ dynamic ที่ช้า (`source <(openclaw completion ...)`) doctor จะอัปเกรดเป็นรูปแบบไฟล์แคชที่เร็วกว่า
    - หากกำหนดค่า completion ในโปรไฟล์ไว้แล้วแต่ไฟล์แคชหายไป doctor จะสร้างแคชใหม่โดยอัตโนมัติ
    - หากยังไม่ได้กำหนดค่า completion เลย doctor จะถามให้ติดตั้ง (เฉพาะโหมด interactive; ข้ามเมื่อใช้ `--non-interactive`)

    รัน `openclaw completion --write-state` เพื่อสร้างแคชใหม่ด้วยตนเอง

  </Accordion>
  <Accordion title="12. การตรวจ auth ของ Gateway (token ในเครื่อง)">
    Doctor ตรวจความพร้อมของ auth ด้วย token สำหรับ gateway ในเครื่อง

    - หากโหมด token ต้องใช้ token และไม่มีแหล่ง token doctor จะเสนอให้สร้างให้
    - หาก `gateway.auth.token` จัดการโดย SecretRef แต่ใช้งานไม่ได้ doctor จะเตือนและไม่เขียนทับด้วย plaintext
    - `openclaw doctor --generate-gateway-token` บังคับสร้างเฉพาะเมื่อไม่มีการกำหนดค่า token SecretRef

  </Accordion>
  <Accordion title="12b. การซ่อมแซมแบบอ่านอย่างเดียวที่รู้จัก SecretRef">
    repair flow บางรายการต้องตรวจสอบ credentials ที่กำหนดค่าไว้โดยไม่ทำให้พฤติกรรม fail-fast ของ runtime อ่อนลง

    - ตอนนี้ `openclaw doctor --fix` ใช้โมเดลสรุป SecretRef แบบอ่านอย่างเดียวเดียวกับคำสั่งตระกูล status สำหรับการซ่อมแซม config แบบเจาะจง
    - ตัวอย่าง: การซ่อมแซม `allowFrom` / `groupAllowFrom` `@username` ของ Telegram จะพยายามใช้ bot credentials ที่กำหนดค่าไว้เมื่อมี
    - หากกำหนดค่า token ของ Telegram bot ผ่าน SecretRef แต่ใช้งานไม่ได้ใน command path ปัจจุบัน doctor จะรายงานว่า credential ถูกกำหนดค่าไว้แต่ใช้งานไม่ได้ และข้าม auto-resolution แทนที่จะ crash หรือรายงานผิดว่า token หายไป

  </Accordion>
  <Accordion title="13. การตรวจสุขภาพ Gateway + restart">
    Doctor รันการตรวจสุขภาพและเสนอให้ restart gateway เมื่อดูเหมือนว่าไม่ healthy
  </Accordion>
  <Accordion title="13b. ความพร้อมของการค้นหา Memory">
    Doctor ตรวจว่า provider สำหรับ embedding ของการค้นหา memory ที่กำหนดค่าไว้พร้อมสำหรับ agent เริ่มต้นหรือไม่ พฤติกรรมขึ้นอยู่กับ backend และ provider ที่กำหนดค่าไว้:

    - **QMD backend**: ตรวจว่า binary `qmd` มีอยู่และเริ่มทำงานได้หรือไม่ หากไม่ได้ จะพิมพ์คำแนะนำการแก้ไขรวมถึงแพ็กเกจ npm และตัวเลือก path ของ binary แบบ manual
    - **provider ในเครื่องแบบระบุชัดเจน**: ตรวจหาไฟล์โมเดลในเครื่องหรือ URL โมเดลระยะไกล/ดาวน์โหลดได้ที่รู้จัก หากหายไป จะแนะนำให้เปลี่ยนไปใช้ provider ระยะไกล
    - **provider ระยะไกลแบบระบุชัดเจน** (`openai`, `voyage` ฯลฯ): ตรวจว่ามี API key อยู่ใน environment หรือ auth store พิมพ์คำแนะนำการแก้ไขที่นำไปใช้ได้หากหายไป
    - **provider แบบ Auto**: ตรวจความพร้อมของโมเดลในเครื่องก่อน จากนั้นลอง provider ระยะไกลแต่ละตัวตามลำดับ auto-selection

    เมื่อมีผลลัพธ์ probe ของ gateway ที่แคชไว้ (gateway healthy ณ เวลาตรวจ) doctor จะ cross-reference ผลลัพธ์นั้นกับ config ที่ CLI มองเห็น และระบุความคลาดเคลื่อนใดๆ Doctor ไม่เริ่ม embedding ping ใหม่บน path เริ่มต้น; ใช้คำสั่งสถานะ memory แบบ deep เมื่อต้องการตรวจ provider แบบ live

    ใช้ `openclaw memory status --deep` เพื่อตรวจความพร้อมของ embedding ตอน runtime

  </Accordion>
  <Accordion title="14. คำเตือนสถานะ Channel">
    หาก gateway healthy doctor จะรัน channel status probe และรายงานคำเตือนพร้อมวิธีแก้ที่แนะนำ
  </Accordion>
  <Accordion title="15. การ audit + ซ่อมแซม config ของ supervisor">
    Doctor ตรวจ config ของ supervisor ที่ติดตั้งไว้ (launchd/systemd/schtasks) เพื่อหาค่าเริ่มต้นที่หายไปหรือล้าสมัย (เช่น dependency `network-online` ของ systemd และ delay ก่อน restart) เมื่อพบความไม่ตรงกัน จะแนะนำให้อัปเดตและสามารถเขียน service file/task ใหม่ให้เป็นค่าเริ่มต้นปัจจุบันได้

    หมายเหตุ:

    - `openclaw doctor` จะถามก่อนเขียน config ของ supervisor ใหม่
    - `openclaw doctor --yes` ยอมรับ prompt การซ่อมแซมเริ่มต้น
    - `openclaw doctor --repair` ใช้การแก้ไขที่แนะนำโดยไม่ถาม
    - `openclaw doctor --repair --force` เขียนทับ config ของ supervisor ที่ปรับแต่งเอง
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` ทำให้ doctor เป็นแบบอ่านอย่างเดียวสำหรับ lifecycle ของบริการ gateway โดยยังรายงานสุขภาพบริการและรันการซ่อมแซมที่ไม่เกี่ยวกับบริการ แต่ข้ามการติดตั้ง/เริ่ม/start ใหม่/bootstrap บริการ การเขียน config ของ supervisor ใหม่ และการล้างบริการเก่า เพราะ supervisor ภายนอกเป็นผู้ดูแล lifecycle นั้น
    - บน Linux doctor จะไม่เขียน metadata ของ command/entrypoint ใหม่ขณะที่ systemd gateway unit ที่ตรงกันยัง active อยู่ และยังเพิกเฉยต่อ unit ที่คล้าย gateway เพิ่มเติมซึ่ง inactive และไม่ใช่ของเก่าระหว่างการสแกนบริการซ้ำ เพื่อไม่ให้ companion service file สร้าง noise ในการล้างข้อมูล
    - หาก token auth ต้องใช้ token และ `gateway.auth.token` จัดการโดย SecretRef การติดตั้ง/ซ่อมแซมบริการของ doctor จะ validate SecretRef แต่ไม่ persist ค่า token plaintext ที่ resolve แล้วลงใน metadata environment ของบริการ supervisor
    - Doctor ตรวจพบค่า environment ของบริการที่จัดการด้วย `.env`/SecretRef ซึ่งการติดตั้ง LaunchAgent, systemd หรือ Windows Scheduled Task รุ่นเก่าฝัง inline ไว้ และเขียน metadata ของบริการใหม่เพื่อให้ค่าเหล่านั้นโหลดจาก runtime source แทน definition ของ supervisor
    - Doctor ตรวจพบเมื่อคำสั่งบริการยัง pin `--port` เก่าหลัง `gateway.port` เปลี่ยน และเขียน metadata ของบริการใหม่ให้เป็นพอร์ตปัจจุบัน
    - หาก token auth ต้องใช้ token และ token SecretRef ที่กำหนดค่าไว้ resolve ไม่ได้ doctor จะบล็อก path การติดตั้ง/ซ่อมแซมพร้อมคำแนะนำที่นำไปใช้ได้
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้งค่า mode อย่างชัดเจน
    - สำหรับ unit user-systemd บน Linux ตอนนี้การตรวจ token drift ของ doctor รวมทั้งแหล่ง `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบ metadata auth ของบริการ
    - การซ่อมแซมบริการของ Doctor จะปฏิเสธการเขียนใหม่ หยุด หรือ restart บริการ gateway จาก binary OpenClaw รุ่นเก่า เมื่อ config ถูกเขียนล่าสุดโดยเวอร์ชันใหม่กว่า ดู [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)
    - คุณสามารถบังคับเขียนใหม่ทั้งหมดได้เสมอผ่าน `openclaw gateway install --force`

  </Accordion>
  <Accordion title="16. การวินิจฉัยรันไทม์ Gateway + พอร์ต">
    Doctor ตรวจสอบรันไทม์ของบริการ (PID, สถานะออกล่าสุด) และเตือนเมื่อมีการติดตั้งบริการแล้วแต่ไม่ได้ทำงานอยู่จริง นอกจากนี้ยังตรวจหาการชนกันของพอร์ตบนพอร์ต Gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (Gateway กำลังทำงานอยู่แล้ว, SSH tunnel)
  </Accordion>
  <Accordion title="17. แนวทางปฏิบัติที่ดีที่สุดสำหรับรันไทม์ Gateway">
    Doctor เตือนเมื่อบริการ Gateway ทำงานบน Bun หรือพาธ Node ที่จัดการด้วยตัวจัดการเวอร์ชัน (`nvm`, `fnm`, `volta`, `asdf` ฯลฯ) ช่องทาง WhatsApp + Telegram ต้องใช้ Node และพาธของตัวจัดการเวอร์ชันอาจเสียหลังการอัปเกรด เพราะบริการไม่ได้โหลดการตั้งค่าเริ่มต้นของเชลล์ของคุณ Doctor เสนอให้ย้ายไปใช้การติดตั้ง Node ของระบบเมื่อมีให้ใช้ (Homebrew/apt/choco)

    บริการที่ติดตั้งใหม่หรือซ่อมแซมแล้วจะคงรากสภาพแวดล้อมที่ระบุชัดเจน (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) และไดเรกทอรี user-bin ที่เสถียรไว้ แต่ไดเรกทอรีสำรองของตัวจัดการเวอร์ชันที่เดาได้จะถูกเขียนลงใน PATH ของบริการเฉพาะเมื่อไดเรกทอรีเหล่านั้นมีอยู่บนดิสก์เท่านั้น วิธีนี้ทำให้ PATH ของตัวควบคุมที่สร้างขึ้นสอดคล้องกับการตรวจสอบ PATH ขั้นต่ำแบบเดียวกันที่ doctor จะเรียกใช้ภายหลัง

  </Accordion>
  <Accordion title="18. การเขียนคอนฟิก + เมตาดาต้าตัวช่วยตั้งค่า">
    Doctor บันทึกการเปลี่ยนแปลงคอนฟิกทั้งหมดและประทับเมตาดาต้าของตัวช่วยตั้งค่าเพื่อบันทึกการเรียกใช้ doctor
  </Accordion>
  <Accordion title="19. เคล็ดลับเวิร์กสเปซ (การสำรองข้อมูล + ระบบหน่วยความจำ)">
    Doctor แนะนำระบบหน่วยความจำสำหรับเวิร์กสเปซเมื่อยังไม่มี และพิมพ์เคล็ดลับการสำรองข้อมูลหากเวิร์กสเปซยังไม่ได้อยู่ภายใต้ git

    ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคู่มือฉบับเต็มเกี่ยวกับโครงสร้างเวิร์กสเปซและการสำรองข้อมูลด้วย git (แนะนำ GitHub หรือ GitLab แบบส่วนตัว)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
