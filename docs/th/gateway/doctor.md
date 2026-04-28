---
read_when:
    - การเพิ่มหรือแก้ไข migration ของ doctor
    - การนำการเปลี่ยนแปลงคอนฟิกที่เข้ากันไม่ได้ย้อนหลังเข้ามา
sidebarTitle: Doctor
summary: 'คำสั่ง Doctor: การตรวจสอบสถานะ การย้ายคอนฟิก และขั้นตอนการซ่อมแซม'
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:29:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 592a9f886e0e6dcbfeb41a09c765ab289f3ed16ed360be37ff9fbefba920754f
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` คือเครื่องมือซ่อมแซม + migration สำหรับ OpenClaw โดยใช้แก้ไขคอนฟิก/สถานะที่ค้างเก่า ตรวจสอบสถานะ และให้ขั้นตอนการซ่อมแซมที่นำไปใช้ได้จริง

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw doctor
```

### โหมด headless และระบบอัตโนมัติ

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    ยอมรับค่าเริ่มต้นโดยไม่ถาม (รวมถึงขั้นตอนซ่อมแซมการรีสตาร์ต/บริการ/sandbox เมื่อมีความเหมาะสม)

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    ใช้การซ่อมแซมที่แนะนำโดยไม่ถาม (การซ่อมแซม + การรีสตาร์ตเมื่อปลอดภัย)

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    ใช้การซ่อมแซมแบบเข้มข้นด้วย (เขียนทับคอนฟิก supervisor แบบกำหนดเอง)

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    รันโดยไม่มีพรอมป์ และใช้เฉพาะ migration ที่ปลอดภัย (การทำคอนฟิกให้เป็นมาตรฐาน + การย้ายสถานะบนดิสก์) ข้ามการทำงานด้านรีสตาร์ต/บริการ/sandbox ที่ต้องการการยืนยันจากมนุษย์ migration ของสถานะเดิมจะทำงานอัตโนมัติเมื่อตรวจพบ

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    สแกนบริการของระบบเพื่อค้นหาการติดตั้ง gateway เพิ่มเติม (launchd/systemd/schtasks)

  </Tab>
</Tabs>

หากต้องการตรวจสอบการเปลี่ยนแปลงก่อนเขียน ให้เปิดไฟล์คอนฟิกก่อน:

```bash
cat ~/.openclaw/openclaw.json
```

## สิ่งที่คำสั่งนี้ทำ (สรุป)

<AccordionGroup>
  <Accordion title="สถานะ, UI และการอัปเดต">
    - การอัปเดตล่วงหน้าแบบเลือกได้สำหรับการติดตั้งจาก git (เฉพาะแบบโต้ตอบ)
    - การตรวจสอบความใหม่ของโปรโตคอล UI (สร้าง Control UI ใหม่เมื่อ schema ของโปรโตคอลใหม่กว่า)
    - การตรวจสอบสถานะ + พรอมป์ให้รีสตาร์ต
    - สรุปสถานะ Skills (ใช้งานได้/ขาดหาย/ถูกบล็อก) และสถานะ Plugin

  </Accordion>
  <Accordion title="คอนฟิกและ migration">
    - การทำคอนฟิกให้เป็นมาตรฐานสำหรับค่ารูปแบบเดิม
    - migration ของคอนฟิก Talk จากฟิลด์แบบแบน `talk.*` เดิมไปเป็น `talk.provider` + `talk.providers.<provider>`
    - การตรวจสอบ migration ของเบราว์เซอร์สำหรับคอนฟิก Chrome extension เดิมและความพร้อมของ Chrome MCP
    - คำเตือนเกี่ยวกับการเขียนทับผู้ให้บริการ OpenCode (`models.providers.opencode` / `models.providers.opencode-go`)
    - คำเตือนการ shadow ของ Codex OAuth (`models.providers.openai-codex`)
    - การตรวจสอบข้อกำหนด TLS ของ OAuth สำหรับโปรไฟล์ OpenAI Codex OAuth
    - migration ของสถานะบนดิสก์แบบเดิม (sessions/ไดเรกทอรี agent/WhatsApp auth)
    - migration ของคีย์สัญญา manifest ของ Plugin แบบเดิม (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
    - migration ของที่เก็บ Cron แบบเดิม (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบนสุด, `provider` ใน payload, งาน Webhook fallback แบบ `notify: true` อย่างง่าย)
    - migration ของนโยบายรันไทม์ agent แบบเดิมไปเป็น `agents.defaults.agentRuntime` และ `agents.list[].agentRuntime`

  </Accordion>
  <Accordion title="สถานะและความถูกต้อง">
    - การตรวจสอบไฟล์ล็อกของเซสชันและการล้างล็อกที่ค้าง
    - การซ่อมแซมทรานสคริปต์ของเซสชันสำหรับกิ่ง prompt-rewrite ที่ซ้ำกันซึ่งถูกสร้างโดยบิลด์ 2026.4.24 ที่ได้รับผลกระทบ
    - การตรวจสอบความถูกต้องของสถานะและสิทธิ์ (sessions, transcripts, state dir)
    - การตรวจสอบสิทธิ์ของไฟล์คอนฟิก (chmod 600) เมื่อรันในเครื่อง
    - สถานะ auth ของโมเดล: ตรวจสอบการหมดอายุของ OAuth, สามารถรีเฟรชโทเค็นที่ใกล้หมดอายุ และรายงานสถานะคูลดาวน์/ปิดใช้งานของ auth profile
    - การตรวจจับไดเรกทอรี workspace เพิ่มเติม (`~/openclaw`)

  </Accordion>
  <Accordion title="Gateway, บริการ และ supervisor">
    - การซ่อมแซมอิมเมจ sandbox เมื่อเปิดใช้ sandboxing
    - migration ของบริการแบบเดิมและการตรวจจับ gateway เพิ่มเติม
    - migration ของสถานะเดิมของแชนเนล Matrix (ในโหมด `--fix` / `--repair`)
    - การตรวจสอบรันไทม์ของ Gateway (มีการติดตั้งบริการแต่ไม่ได้รัน; cached launchd label)
    - คำเตือนสถานะแชนเนล (ตรวจจาก gateway ที่กำลังรัน)
    - การตรวจสอบคอนฟิก supervisor (launchd/systemd/schtasks) พร้อมตัวเลือกการซ่อมแซม
    - การตรวจสอบแนวทางปฏิบัติที่ดีของรันไทม์ Gateway (Node เทียบกับ Bun, พาธของ version manager)
    - การวินิจฉัยพอร์ต Gateway ชนกัน (ค่าเริ่มต้น `18789`)

  </Accordion>
  <Accordion title="Auth, ความปลอดภัย และการจับคู่">
    - คำเตือนด้านความปลอดภัยสำหรับนโยบาย DM แบบเปิด
    - การตรวจสอบ auth ของ Gateway สำหรับโหมด local token (มีตัวเลือกสร้าง token เมื่อไม่มีแหล่ง token; ไม่เขียนทับคอนฟิก token SecretRef)
    - การตรวจจับปัญหาการจับคู่อุปกรณ์ (คำขอจับคู่ครั้งแรกที่รอดำเนินการ, การอัปเกรด role/scope ที่รอดำเนินการ, ความคลาดเคลื่อนของแคช local device-token ที่ค้างเก่า, และความคลาดเคลื่อนด้าน auth ของระเบียน paired)

  </Accordion>
  <Accordion title="Workspace และ shell">
    - การตรวจสอบ systemd linger บน Linux
    - การตรวจสอบขนาดไฟล์ bootstrap ของ workspace (คำเตือนเรื่องการตัดทอน/ใกล้ถึงขีดจำกัดสำหรับไฟล์บริบท)
    - การตรวจสอบสถานะ shell completion และการติดตั้ง/อัปเกรดอัตโนมัติ
    - การตรวจสอบความพร้อมของผู้ให้บริการ embedding สำหรับการค้นหา Memory (โมเดล local, API key ระยะไกล หรือไบนารี QMD)
    - การตรวจสอบการติดตั้งจากซอร์ส (pnpm workspace ไม่ตรงกัน, ขาด asset ของ UI, ขาดไบนารี tsx)
    - เขียนคอนฟิกและ metadata ของ wizard ที่อัปเดตแล้ว

  </Accordion>
</AccordionGroup>

## Dreams UI backfill และ reset

ฉาก Dreams ใน Control UI มีการทำงาน **Backfill**, **Reset** และ **Clear Grounded** สำหรับเวิร์กโฟลว์ grounded dreaming การทำงานเหล่านี้ใช้เมธอด RPC แบบ doctor-style ของ gateway แต่**ไม่ได้**เป็นส่วนหนึ่งของการซ่อมแซม/migration ใน CLI `openclaw doctor`

สิ่งที่ทำ:

- **Backfill** สแกนไฟล์ `memory/YYYY-MM-DD.md` เดิมใน workspace ที่ใช้งานอยู่ รัน grounded REM diary pass และเขียนรายการ backfill แบบย้อนกลับได้ลงใน `DREAMS.md`
- **Reset** ลบเฉพาะรายการ diary backfill ที่ทำเครื่องหมายไว้จาก `DREAMS.md`
- **Clear Grounded** ลบเฉพาะรายการ short-term แบบ grounded-only ที่ถูก stage จาก historical replay และยังไม่ได้สะสม live recall หรือการสนับสนุนรายวัน

สิ่งที่**ไม่ได้**ทำด้วยตัวเอง:

- ไม่แก้ไข `MEMORY.md`
- ไม่รัน migration ของ doctor แบบเต็ม
- ไม่ stage grounded candidate เข้าสู่ที่เก็บ promotion แบบ short-term ที่มีชีวิตอยู่โดยอัตโนมัติ เว้นแต่คุณจะรันเส้นทาง CLI แบบ staged อย่างชัดเจนก่อน

หากคุณต้องการให้ historical replay แบบ grounded มีผลต่อเส้นทาง deep promotion ปกติ ให้ใช้โฟลว์ CLI แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

คำสั่งนี้จะ stage grounded durable candidate เข้าไปในที่เก็บ short-term dreaming โดยยังคงใช้ `DREAMS.md` เป็นพื้นผิวสำหรับการตรวจทาน

## พฤติกรรมโดยละเอียดและเหตุผล

<AccordionGroup>
  <Accordion title="0. การอัปเดตแบบเลือกได้ (การติดตั้งจาก git)">
    หากนี่คือ git checkout และ doctor กำลังรันแบบโต้ตอบ ระบบจะมีตัวเลือกให้อัปเดต (fetch/rebase/build) ก่อนรัน doctor
  </Accordion>
  <Accordion title="1. การทำคอนฟิกให้เป็นมาตรฐาน">
    หากคอนฟิกมีรูปร่างค่าของรูปแบบเดิม (เช่น `messages.ackReaction` ที่ไม่มีการเขียนทับแบบเฉพาะแชนเนล) doctor จะทำให้เป็นมาตรฐานตาม schema ปัจจุบัน

    ซึ่งรวมถึงฟิลด์ Talk แบบแบนของระบบเดิมด้วย คอนฟิก Talk สาธารณะปัจจุบันคือ `talk.provider` + `talk.providers.<provider>` doctor จะเขียนรูปร่างเดิมของ `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ใหม่เข้าไปในแมปของ provider

  </Accordion>
  <Accordion title="2. migration ของคีย์คอนฟิกแบบเดิม">
    เมื่อคอนฟิกมีคีย์ที่เลิกใช้แล้ว คำสั่งอื่นจะปฏิเสธการทำงานและขอให้คุณรัน `openclaw doctor`

    Doctor จะ:

    - อธิบายว่าพบคีย์แบบเดิมใดบ้าง
    - แสดง migration ที่นำไปใช้
    - เขียน `~/.openclaw/openclaw.json` ใหม่ด้วย schema ที่อัปเดตแล้ว

    Gateway ยังรัน migration ของ doctor อัตโนมัติขณะเริ่มต้นเมื่อพบรูปแบบคอนฟิกเดิมด้วย ดังนั้นคอนฟิกเก่าจะถูกซ่อมแซมโดยไม่ต้องแทรกแซงด้วยตนเอง migration ของที่เก็บงาน Cron จัดการโดย `openclaw doctor --fix`

    migration ปัจจุบัน:

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
    - สำหรับแชนเนลที่มี `accounts` แบบตั้งชื่อ แต่ยังมีค่าระดับบนสุดของแชนเนลแบบบัญชีเดียวที่ค้างอยู่ ให้ย้ายค่าที่อยู่ในขอบเขตบัญชีนั้นไปยังบัญชีที่ถูกยกระดับซึ่งเลือกไว้สำหรับแชนเนลนั้น (`accounts.default` สำหรับแชนเนลส่วนใหญ่; Matrix สามารถคงเป้าหมายที่ตรงกันอยู่เดิม/ค่าเริ่มต้นแบบตั้งชื่อไว้ได้)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - ลบ `browser.relayBindHost` (การตั้งค่า relay ของ extension แบบเดิม)

    คำเตือนของ doctor ยังรวมถึงคำแนะนำเรื่อง account-default สำหรับแชนเนลหลายบัญชี:

    - หากมีการกำหนด `channels.<channel>.accounts` ตั้งแต่ 2 รายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default` doctor จะเตือนว่าการกำหนดเส้นทาง fallback อาจเลือกบัญชีที่ไม่คาดคิด
    - หากตั้งค่า `channels.<channel>.defaultAccount` เป็น account ID ที่ไม่รู้จัก doctor จะเตือนและแสดงรายการ account ID ที่กำหนดค่าไว้

  </Accordion>
  <Accordion title="2b. การเขียนทับผู้ให้บริการ OpenCode">
    หากคุณเพิ่ม `models.providers.opencode`, `opencode-zen` หรือ `opencode-go` ด้วยตนเอง มันจะเขียนทับแค็ตตาล็อก OpenCode ในตัวจาก `@mariozechner/pi-ai` ซึ่งอาจบังคับให้โมเดลไปใช้ API ที่ไม่ถูกต้องหรือทำให้ต้นทุนเป็นศูนย์ Doctor จะเตือนเพื่อให้คุณลบการเขียนทับดังกล่าวและคืนค่าการกำหนดเส้นทาง API + ต้นทุนรายโมเดล
  </Accordion>
  <Accordion title="2c. migration ของเบราว์เซอร์และความพร้อมของ Chrome MCP">
    หากคอนฟิกเบราว์เซอร์ของคุณยังชี้ไปยังเส้นทาง Chrome extension ที่ถูกนำออกไปแล้ว doctor จะทำให้เป็นมาตรฐานไปยังโมเดลการเชื่อมต่อ Chrome MCP แบบ host-local ปัจจุบัน:

    - `browser.profiles.*.driver: "extension"` จะกลายเป็น `"existing-session"`
    - `browser.relayBindHost` จะถูกลบ

    Doctor ยังตรวจสอบเส้นทาง Chrome MCP แบบ host-local เมื่อคุณใช้ `defaultProfile: "user"` หรือโปรไฟล์ `existing-session` ที่กำหนดค่าไว้:

    - ตรวจสอบว่ามีการติดตั้ง Google Chrome บนโฮสต์เดียวกันหรือไม่สำหรับโปรไฟล์ auto-connect เริ่มต้น
    - ตรวจสอบเวอร์ชัน Chrome ที่ตรวจพบ และเตือนเมื่อเวอร์ชันต่ำกว่า Chrome 144
    - เตือนให้คุณเปิด remote debugging ในหน้าตรวจสอบของเบราว์เซอร์ (เช่น `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` หรือ `edge://inspect/#remote-debugging`)

    Doctor ไม่สามารถเปิดการตั้งค่าฝั่ง Chrome ให้คุณได้ Host-local Chrome MCP ยังคงต้องมี:

    - เบราว์เซอร์ที่อิง Chromium เวอร์ชัน 144+ บนโฮสต์ gateway/node
    - เบราว์เซอร์กำลังทำงานอยู่ในเครื่อง
    - เปิดใช้ remote debugging ในเบราว์เซอร์นั้น
    - อนุมัติพรอมป์ขอความยินยอมในการ attach ครั้งแรกในเบราว์เซอร์

    ความพร้อมในที่นี้หมายถึงเฉพาะข้อกำหนดเบื้องต้นสำหรับ local attach เท่านั้น Existing-session ยังคงมีข้อจำกัดของเส้นทาง Chrome MCP ปัจจุบัน; เส้นทางขั้นสูง เช่น `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และการทำงานแบบ batch ยังคงต้องใช้เบราว์เซอร์ที่ถูกจัดการหรือโปรไฟล์ CDP แบบดิบ

    การตรวจสอบนี้**ไม่**ใช้กับโฟลว์ Docker, sandbox, remote-browser หรือโฟลว์ headless อื่น ๆ โฟลว์เหล่านั้นยังคงใช้ CDP แบบดิบ

  </Accordion>
  <Accordion title="2d. ข้อกำหนดเบื้องต้น TLS ของ OAuth">
    เมื่อมีการกำหนดค่าโปรไฟล์ OpenAI Codex OAuth ไว้ doctor จะ probe ไปยังปลายทาง authorization ของ OpenAI เพื่อตรวจสอบว่า TLS stack ของ Node/OpenSSL ในเครื่องสามารถตรวจสอบ certificate chain ได้ หาก probe ล้มเหลวด้วยข้อผิดพลาดด้าน certificate (เช่น `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ใบรับรองหมดอายุ หรือใบรับรองแบบ self-signed) doctor จะพิมพ์แนวทางแก้ไขเฉพาะแพลตฟอร์ม สำหรับ macOS ที่ใช้ Node จาก Homebrew วิธีแก้โดยทั่วไปคือ `brew postinstall ca-certificates` เมื่อใช้ `--deep` ระบบจะรัน probe แม้ว่า gateway จะอยู่ในสถานะปกติก็ตาม
  </Accordion>
  <Accordion title="2e. การเขียนทับผู้ให้บริการ Codex OAuth">
    หากก่อนหน้านี้คุณเพิ่มการตั้งค่า OpenAI transport แบบเดิมไว้ใต้ `models.providers.openai-codex` การตั้งค่าเหล่านั้นอาจ shadow เส้นทางผู้ให้บริการ Codex OAuth ในตัวที่รีลีสใหม่ใช้โดยอัตโนมัติ Doctor จะเตือนเมื่อพบการตั้งค่า transport แบบเก่าเหล่านั้นพร้อมกับ Codex OAuth เพื่อให้คุณลบหรือเขียนทับ transport override ที่ค้างเก่า แล้วกลับไปใช้พฤติกรรม routing/fallback ในตัว ส่วน proxy แบบกำหนดเองและ override แบบ header-only ยังคงรองรับและจะไม่ทำให้เกิดคำเตือนนี้
  </Accordion>
  <Accordion title="2f. คำเตือนเส้นทาง Plugin Codex">
    เมื่อเปิดใช้ Plugin Codex ที่มาพร้อมกัน doctor จะตรวจสอบด้วยว่า primary model ref แบบ `openai-codex/*` ยัง resolve ผ่าน PI runner เริ่มต้นอยู่หรือไม่ การผสมกันแบบนี้ถูกต้องเมื่อคุณต้องการใช้การยืนยันตัวตนแบบ Codex OAuth/subscription ผ่าน PI แต่ก็สับสนได้ง่ายกับ native Codex app-server harness Doctor จะเตือนและชี้ไปยังรูปแบบ app-server แบบชัดเจน: `openai/*` พร้อม `agentRuntime.id: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex`

    Doctor จะไม่ซ่อมแซมสิ่งนี้อัตโนมัติ เพราะทั้งสองเส้นทางใช้ได้ถูกต้อง:

    - `openai-codex/*` + PI หมายถึง "ใช้การยืนยันตัวตนแบบ Codex OAuth/subscription ผ่าน OpenClaw runner ปกติ"
    - `openai/*` + `runtime: "codex"` หมายถึง "รัน embedded turn ผ่าน native Codex app-server"
    - `/codex ...` หมายถึง "ควบคุมหรือ bind การสนทนา Codex แบบเนทีฟจากแชต"
    - `/acp ...` หรือ `runtime: "acp"` หมายถึง "ใช้ adapter ACP/acpx ภายนอก"

    หากมีคำเตือนนี้ปรากฏขึ้น ให้เลือกเส้นทางที่คุณตั้งใจใช้และแก้ไขคอนฟิกด้วยตนเอง คงคำเตือนไว้ตามเดิมได้เมื่อใช้ PI Codex OAuth โดยตั้งใจ

  </Accordion>
  <Accordion title="3. migration ของสถานะแบบเดิม (โครงสร้างบนดิสก์)">
    Doctor สามารถย้ายโครงสร้างบนดิสก์แบบเก่าไปยังโครงสร้างปัจจุบันได้:

    - ที่เก็บ sessions + transcripts:
      - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
    - ไดเรกทอรี agent:
      - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
    - สถานะ auth ของ WhatsApp (Baileys):
      - จาก `~/.openclaw/credentials/*.json` แบบเดิม (ยกเว้น `oauth.json`)
      - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (account id เริ่มต้น: `default`)

    migration เหล่านี้เป็นแบบ best-effort และ idempotent; doctor จะส่งคำเตือนเมื่อยังเหลือโฟลเดอร์แบบเดิมไว้เป็นข้อมูลสำรอง Gateway/CLI ยังย้าย sessions + ไดเรกทอรี agent แบบเดิมโดยอัตโนมัติขณะเริ่มต้นด้วย เพื่อให้ประวัติ/auth/models ไปอยู่ในพาธราย agent โดยไม่ต้องรัน doctor ด้วยตนเอง ส่วน auth ของ WhatsApp ตั้งใจให้ย้ายผ่าน `openclaw doctor` เท่านั้น ขณะนี้การทำ normalization ของ Talk provider/provider-map จะเปรียบเทียบด้วย structural equality ดังนั้นความต่างที่มีแค่ลำดับคีย์จะไม่ทำให้เกิดการเปลี่ยนแปลง `doctor --fix` แบบ no-op ซ้ำ ๆ อีก

  </Accordion>
  <Accordion title="3a. migration ของ manifest Plugin แบบเดิม">
    Doctor จะสแกน manifest ของ Plugin ที่ติดตั้งไว้ทั้งหมดเพื่อหาคีย์ capability ระดับบนสุดที่เลิกใช้แล้ว (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) เมื่อพบ ระบบจะเสนอให้ย้ายคีย์เหล่านั้นเข้าไปในอ็อบเจ็กต์ `contracts` และเขียนไฟล์ manifest ใหม่ในตำแหน่งเดิม migration นี้เป็นแบบ idempotent; หากคีย์ `contracts` มีค่าเดียวกันอยู่แล้ว คีย์แบบเดิมจะถูกลบออกโดยไม่ทำให้ข้อมูลซ้ำซ้อน
  </Accordion>
  <Accordion title="3b. migration ของที่เก็บ Cron แบบเดิม">
    Doctor จะตรวจสอบที่เก็บงาน Cron ด้วย (`~/.openclaw/cron/jobs.json` โดยค่าเริ่มต้น หรือ `cron.store` เมื่อมีการเขียนทับ) เพื่อหารูปแบบงานเก่าที่ scheduler ยังยอมรับเพื่อความเข้ากันได้

    การล้างข้อมูล Cron ปัจจุบันรวมถึง:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - ฟิลด์ payload ระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
    - ฟิลด์ delivery ระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias ของ delivery ใน `provider` ของ payload → `delivery.channel` แบบชัดเจน
    - งาน Webhook fallback แบบเดิมอย่างง่าย `notify: true` → `delivery.mode="webhook"` แบบชัดเจน พร้อม `delivery.to=cron.webhook`

    Doctor จะย้ายงาน `notify: true` อัตโนมัติเฉพาะเมื่อสามารถทำได้โดยไม่เปลี่ยนพฤติกรรม หากงานหนึ่งรวม legacy notify fallback เข้ากับโหมด delivery ที่ไม่ใช่ Webhook อยู่แล้ว doctor จะเตือนและปล่อยงานนั้นไว้ให้ตรวจทานด้วยตนเอง

  </Accordion>
  <Accordion title="3c. การล้างล็อกของเซสชัน">
    Doctor จะสแกนทุกไดเรกทอรีเซสชันของ agent เพื่อหาไฟล์ write-lock ที่ค้างเก่า — ไฟล์ที่ถูกทิ้งไว้เมื่อเซสชันออกจากระบบอย่างผิดปกติ สำหรับแต่ละไฟล์ล็อกที่พบ ระบบจะรายงาน: พาธ, PID, PID นั้นยังมีชีวิตอยู่หรือไม่, อายุของล็อก และถือว่าเป็นล็อกค้างหรือไม่ (PID ตายแล้วหรือเก่ากว่า 30 นาที) ในโหมด `--fix` / `--repair` ระบบจะลบไฟล์ล็อกที่ค้างโดยอัตโนมัติ; มิฉะนั้นจะพิมพ์หมายเหตุและแนะนำให้คุณรันใหม่ด้วย `--fix`
  </Accordion>
  <Accordion title="3d. การซ่อมแซมกิ่งทรานสคริปต์ของเซสชัน">
    Doctor จะสแกนไฟล์ JSONL ของเซสชัน agent เพื่อหารูปแบบกิ่งซ้ำที่ถูกสร้างจากบั๊ก rewrite ทรานสคริปต์พรอมป์ในวันที่ 2026.4.24: มี user turn ที่ถูกละทิ้งแต่ยังมีบริบทรันไทม์ภายในของ OpenClaw อยู่ พร้อมกับกิ่งพี่น้องที่ยัง active ซึ่งมีพรอมป์ user ที่มองเห็นได้เหมือนกัน ในโหมด `--fix` / `--repair` doctor จะสำรองไฟล์ที่ได้รับผลกระทบแต่ละไฟล์ไว้ข้างต้นฉบับ แล้วเขียนทรานสคริปต์ใหม่ให้ชี้ไปยัง active branch เพื่อให้ประวัติ gateway และตัวอ่าน Memory ไม่เห็น turn ซ้ำอีก
  </Accordion>
  <Accordion title="4. การตรวจสอบความถูกต้องของสถานะ (การเก็บรักษาเซสชัน, การกำหนดเส้นทาง และความปลอดภัย)">
    state dir คือแกนกลางการทำงาน หากมันหายไป คุณจะสูญเสีย sessions, credentials, logs และ config (เว้นแต่คุณมีข้อมูลสำรองไว้ที่อื่น)

    Doctor จะตรวจสอบ:

    - **ไม่มี state dir**: เตือนเรื่องการสูญเสียสถานะอย่างร้ายแรง มีพรอมป์ให้สร้างไดเรกทอรีใหม่ และเตือนว่าไม่สามารถกู้คืนข้อมูลที่หายไปได้
    - **สิทธิ์ของ state dir**: ตรวจสอบว่าสามารถเขียนได้หรือไม่; เสนอซ่อมแซมสิทธิ์ (และแสดงคำแนะนำ `chown` เมื่อพบ owner/group ไม่ตรงกัน)
    - **state dir บน macOS ที่ซิงก์ผ่านคลาวด์**: เตือนเมื่อ state resolve ไปอยู่ใต้ iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ `~/Library/CloudStorage/...` เพราะพาธที่มีการซิงก์อาจทำให้ I/O ช้าลงและเกิด race ของ lock/sync
    - **state dir บน Linux ที่อยู่บน SD หรือ eMMC**: เตือนเมื่อ state resolve ไปยังแหล่งเมานต์ `mmcblk*` เพราะ random I/O บน SD หรือ eMMC อาจช้ากว่าและสึกหรอเร็วกว่าเมื่อมีการเขียน session และ credential
    - **ไม่มีไดเรกทอรีเซสชัน**: `sessions/` และไดเรกทอรีของ session store จำเป็นต่อการเก็บประวัติและหลีกเลี่ยง crash แบบ `ENOENT`
    - **transcript ไม่ตรงกัน**: เตือนเมื่อ entry ของเซสชันล่าสุดมีไฟล์ transcript ที่หายไป
    - **เซสชันหลักเป็น "1-line JSONL"**: แจ้งเมื่อ transcript หลักมีเพียงหนึ่งบรรทัด (ประวัติไม่ได้สะสม)
    - **มี state dir หลายชุด**: เตือนเมื่อมีโฟลเดอร์ `~/.openclaw` หลายแห่งใน home directory ต่างกัน หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (ประวัติอาจแยกระหว่างการติดตั้ง)
    - **เตือนเรื่อง remote mode**: หาก `gateway.mode=remote` doctor จะเตือนให้คุณรันบนโฮสต์ระยะไกล (เพราะ state อยู่ที่นั่น)
    - **สิทธิ์ของไฟล์คอนฟิก**: เตือนหาก `~/.openclaw/openclaw.json` อ่านได้โดยกลุ่ม/สาธารณะ และเสนอให้ปรับให้เข้มงวดเป็น `600`

  </Accordion>
  <Accordion title="5. สถานะ auth ของโมเดล (OAuth หมดอายุ)">
    Doctor จะตรวจสอบโปรไฟล์ OAuth ใน auth store เตือนเมื่อโทเค็นใกล้หมดอายุ/หมดอายุแล้ว และสามารถรีเฟรชได้เมื่อปลอดภัย หากโปรไฟล์ Anthropic OAuth/token ค้างเก่า ระบบจะแนะนำ Anthropic API key หรือเส้นทาง setup-token ของ Anthropic พรอมป์รีเฟรชจะปรากฏเฉพาะเมื่อรันแบบโต้ตอบ (TTY); `--non-interactive` จะข้ามความพยายามรีเฟรช

    เมื่อการรีเฟรช OAuth ล้มเหลวอย่างถาวร (เช่น `refresh_token_reused`, `invalid_grant` หรือผู้ให้บริการแจ้งให้คุณลงชื่อเข้าใช้อีกครั้ง) doctor จะรายงานว่าจำเป็นต้อง re-auth และพิมพ์คำสั่ง `openclaw models auth login --provider ...` ที่ต้องใช้ให้แบบตรงตัว

    Doctor ยังรายงานโปรไฟล์ auth ที่ใช้งานไม่ได้ชั่วคราวเนื่องจาก:

    - คูลดาวน์สั้น ๆ (rate limit/timeout/auth failure)
    - การปิดใช้งานที่ยาวกว่า (ความล้มเหลวด้าน billing/เครดิต)

  </Accordion>
  <Accordion title="6. การตรวจสอบความถูกต้องของโมเดลสำหรับ hooks">
    หากตั้งค่า `hooks.gmail.model` ไว้ doctor จะตรวจสอบ model reference กับแค็ตตาล็อกและ allowlist และเตือนเมื่อมัน resolve ไม่ได้หรือไม่ได้รับอนุญาต
  </Accordion>
  <Accordion title="7. การซ่อมแซมอิมเมจ sandbox">
    เมื่อเปิดใช้ sandboxing doctor จะตรวจสอบ Docker image และเสนอให้ build หรือสลับไปใช้ชื่อแบบเดิมหาก image ปัจจุบันหายไป
  </Accordion>
  <Accordion title="7b. dependency รันไทม์ของ Plugin ที่มาพร้อมกัน">
    Doctor จะตรวจสอบ dependency ของรันไทม์เฉพาะสำหรับ Plugin ที่มาพร้อมกันซึ่ง active อยู่ในคอนฟิกปัจจุบัน หรือเปิดใช้งานตามค่าเริ่มต้นของ bundled manifest เช่น `plugins.entries.discord.enabled: true`, `channels.discord.enabled: true` แบบเดิม หรือ bundled provider ที่เปิดใช้โดยค่าเริ่มต้น หากขาดรายการใด doctor จะรายงานแพ็กเกจเหล่านั้นและติดตั้งให้ในโหมด `openclaw doctor --fix` / `openclaw doctor --repair` ส่วน Plugin ภายนอกยังคงใช้ `openclaw plugins install` / `openclaw plugins update`; doctor จะไม่ติดตั้ง dependency สำหรับพาธ Plugin ตามอำเภอใจ

    Gateway และ CLI ในเครื่องยังสามารถซ่อมแซม dependency รันไทม์ของ Plugin ที่มาพร้อมกันและ active ตามต้องการก่อน import Plugin ที่มาพร้อมกันได้ด้วย การติดตั้งเหล่านี้จะถูกจำกัดไว้ที่รากการติดตั้งของรันไทม์ Plugin รันโดยปิด scripts ไม่เขียน package lock และถูกป้องกันด้วย install-root lock เพื่อไม่ให้การเริ่มต้น CLI หรือ Gateway พร้อมกันหลายตัวแก้ไข tree `node_modules` เดียวกันในเวลาเดียวกัน

  </Accordion>
  <Accordion title="8. migration ของบริการ Gateway และคำแนะนำการล้างข้อมูล">
    Doctor จะตรวจจับบริการ gateway แบบเดิม (launchd/systemd/schtasks) และเสนอให้ลบบริการเหล่านั้น พร้อมติดตั้งบริการ OpenClaw โดยใช้พอร์ต gateway ปัจจุบัน นอกจากนี้ยังสามารถสแกนหาบริการลักษณะคล้าย gateway เพิ่มเติมและพิมพ์คำแนะนำในการล้างข้อมูลได้ บริการ OpenClaw gateway ที่ตั้งชื่อตามโปรไฟล์จะถือเป็นบริการปกติและจะไม่ถูกทำเครื่องหมายว่าเป็น "ส่วนเกิน"
  </Accordion>
  <Accordion title="8b. migration ของ Matrix ตอนเริ่มต้น">
    เมื่อบัญชีแชนเนล Matrix มี migration ของสถานะเดิมที่รอดำเนินการหรือสามารถดำเนินการได้ doctor (ในโหมด `--fix` / `--repair`) จะสร้างสแนปช็อตก่อน migration แล้วจึงรันขั้นตอน migration แบบ best-effort ได้แก่ migration ของสถานะ Matrix แบบเดิม และการเตรียมสถานะเข้ารหัสแบบเดิม ทั้งสองขั้นตอนนี้ไม่ถือเป็นข้อผิดพลาดร้ายแรง; ข้อผิดพลาดจะถูกบันทึก log และการเริ่มต้นจะดำเนินต่อไป ในโหมดอ่านอย่างเดียว (`openclaw doctor` โดยไม่มี `--fix`) การตรวจสอบนี้จะถูกข้ามทั้งหมด
  </Accordion>
  <Accordion title="8c. การจับคู่อุปกรณ์และความคลาดเคลื่อนด้าน auth">
    ตอนนี้ Doctor จะตรวจสอบสถานะการจับคู่อุปกรณ์เป็นส่วนหนึ่งของ health pass ปกติ

    สิ่งที่รายงาน:

    - คำขอจับคู่ครั้งแรกที่รอดำเนินการ
    - การอัปเกรด role ที่รอดำเนินการสำหรับอุปกรณ์ที่จับคู่แล้ว
    - การอัปเกรด scope ที่รอดำเนินการสำหรับอุปกรณ์ที่จับคู่แล้ว
    - การซ่อมแซมกรณี public key ไม่ตรงกัน ซึ่ง device id ยังตรงอยู่แต่ตัวตนของอุปกรณ์ไม่ตรงกับระเบียนที่อนุมัติไว้แล้ว
    - ระเบียน paired ที่ไม่มีโทเค็น active สำหรับ role ที่ได้รับอนุมัติ
    - โทเค็น paired ที่มี scopes เบี่ยงเบนออกนอก baseline ของการจับคู่ที่ได้รับอนุมัติ
    - entry ของ local cached device-token สำหรับเครื่องปัจจุบันที่เก่ากว่าการหมุนเวียนโทเค็นฝั่ง gateway หรือมีเมทาดาทา scope ที่ค้างเก่า

    Doctor จะไม่อนุมัติคำขอจับคู่อัตโนมัติหรือหมุนเวียนโทเค็นอุปกรณ์อัตโนมัติ แต่จะพิมพ์ขั้นตอนถัดไปที่ชัดเจนแทน:

    - ตรวจสอบคำขอที่รอดำเนินการด้วย `openclaw devices list`
    - อนุมัติคำขอที่ตรงตัวด้วย `openclaw devices approve <requestId>`
    - หมุนเวียนโทเค็นใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
    - ลบระเบียนที่ค้างเก่าแล้วอนุมัติใหม่ด้วย `openclaw devices remove <deviceId>`

    สิ่งนี้ช่วยปิดช่องโหว่ที่พบบ่อยในลักษณะ "จับคู่แล้วแต่ยังขึ้นว่าต้องจับคู่": ตอนนี้ doctor แยกแยะได้แล้วระหว่างการจับคู่ครั้งแรก การอัปเกรด role/scope ที่รอดำเนินการ และความคลาดเคลื่อนของ token/device identity ที่ค้างเก่า

  </Accordion>
  <Accordion title="9. คำเตือนด้านความปลอดภัย">
    Doctor จะส่งคำเตือนเมื่อผู้ให้บริการเปิดรับ DM โดยไม่มี allowlist หรือเมื่อนโยบายถูกกำหนดค่าในลักษณะที่เป็นอันตราย
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    หากรันเป็นบริการผู้ใช้ของ systemd doctor จะตรวจสอบให้แน่ใจว่าเปิดใช้ lingering แล้ว เพื่อให้ gateway ยังทำงานต่อหลังออกจากระบบ
  </Accordion>
  <Accordion title="11. สถานะ Workspace (Skills, Plugins และไดเรกทอรีแบบเดิม)">
    Doctor จะพิมพ์สรุปสถานะของ workspace สำหรับ agent เริ่มต้น:

    - **สถานะ Skills**: นับจำนวน Skills ที่ใช้งานได้, ขาดข้อกำหนด และถูกบล็อกโดย allowlist
    - **ไดเรกทอรี workspace แบบเดิม**: เตือนเมื่อมี `~/openclaw` หรือไดเรกทอรี workspace แบบเดิมอื่น ๆ อยู่ร่วมกับ workspace ปัจจุบัน
    - **สถานะ Plugin**: นับจำนวน Plugin ที่เปิดใช้งาน/ปิดใช้งาน/มีข้อผิดพลาด; แสดง Plugin ID สำหรับข้อผิดพลาดที่พบ; รายงานความสามารถของ bundled Plugin
    - **คำเตือนความเข้ากันได้ของ Plugin**: ทำเครื่องหมาย Plugins ที่มีปัญหาความเข้ากันได้กับรันไทม์ปัจจุบัน
    - **การวินิจฉัย Plugin**: แสดงคำเตือนหรือข้อผิดพลาดขณะโหลดที่ถูกส่งออกโดยรีจิสทรีของ Plugin

  </Accordion>
  <Accordion title="11b. ขนาดไฟล์ bootstrap">
    Doctor จะตรวจสอบว่าไฟล์ bootstrap ของ workspace (เช่น `AGENTS.md`, `CLAUDE.md` หรือไฟล์บริบทที่ถูก inject อื่น ๆ) ใกล้หรือเกินงบประมาณจำนวนอักขระที่กำหนดไว้หรือไม่ โดยจะรายงานจำนวนอักขระดิบเทียบกับจำนวนอักขระที่ถูก inject รายไฟล์, เปอร์เซ็นต์การตัดทอน, สาเหตุของการตัดทอน (`max/file` หรือ `max/total`) และจำนวนอักขระที่ถูก inject ทั้งหมดเทียบเป็นสัดส่วนกับงบประมาณรวม เมื่อไฟล์ถูกตัดทอนหรือใกล้ถึงขีดจำกัด doctor จะพิมพ์คำแนะนำสำหรับการปรับ `agents.defaults.bootstrapMaxChars` และ `agents.defaults.bootstrapTotalMaxChars`
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor จะตรวจสอบว่ามีการติดตั้ง tab completion สำหรับ shell ปัจจุบันหรือไม่ (zsh, bash, fish หรือ PowerShell):

    - หากโปรไฟล์ shell ใช้รูปแบบ dynamic completion ที่ช้า (`source <(openclaw completion ...)`) doctor จะอัปเกรดเป็นรูปแบบไฟล์แคชที่เร็วกว่า
    - หากกำหนดค่า completion ในโปรไฟล์แล้ว แต่ไฟล์แคชหายไป doctor จะสร้างแคชใหม่โดยอัตโนมัติ
    - หากยังไม่ได้กำหนดค่า completion เลย doctor จะถามเพื่อติดตั้ง (เฉพาะโหมดโต้ตอบ; ข้ามเมื่อใช้ `--non-interactive`)

    รัน `openclaw completion --write-state` เพื่อสร้างแคชใหม่ด้วยตนเอง

  </Accordion>
  <Accordion title="12. การตรวจสอบ auth ของ Gateway (local token)">
    Doctor จะตรวจสอบความพร้อมของ auth แบบ local token สำหรับ gateway

    - หากโหมด token ต้องใช้ token และไม่มีแหล่ง token อยู่ doctor จะเสนอให้สร้างขึ้นใหม่
    - หาก `gateway.auth.token` ถูกจัดการด้วย SecretRef แต่ใช้งานไม่ได้ doctor จะเตือนและไม่เขียนทับด้วย plaintext
    - `openclaw doctor --generate-gateway-token` จะบังคับให้สร้าง token เฉพาะเมื่อไม่ได้กำหนด token SecretRef ไว้

  </Accordion>
  <Accordion title="12b. การซ่อมแซมแบบอ่านอย่างเดียวที่รับรู้ SecretRef">
    โฟลว์การซ่อมแซมบางอย่างจำเป็นต้องตรวจสอบข้อมูลรับรองที่กำหนดค่าไว้โดยไม่ทำให้พฤติกรรม fail-fast ของรันไทม์อ่อนลง

    - ตอนนี้ `openclaw doctor --fix` ใช้โมเดลสรุป SecretRef แบบอ่านอย่างเดียวเดียวกับคำสั่งในตระกูล status สำหรับการซ่อมแซมคอนฟิกแบบเจาะจง
    - ตัวอย่าง: การซ่อมแซม `allowFrom` / `groupAllowFrom` แบบ `@username` ของ Telegram จะพยายามใช้ข้อมูลรับรองบอตที่กำหนดค่าไว้เมื่อมีให้ใช้
    - หาก token ของบอต Telegram ถูกกำหนดค่าผ่าน SecretRef แต่ใช้งานไม่ได้ในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานว่าข้อมูลรับรองนั้น "กำหนดค่าไว้แต่ใช้งานไม่ได้" และข้ามการ resolve อัตโนมัติ แทนที่จะ crash หรือรายงานผิดว่าไม่มี token

  </Accordion>
  <Accordion title="13. การตรวจสอบสถานะ Gateway + การรีสตาร์ต">
    Doctor จะรันการตรวจสอบสถานะ และเสนอให้รีสตาร์ต gateway เมื่อดูเหมือนว่าอยู่ในสภาพไม่ปกติ
  </Accordion>
  <Accordion title="13b. ความพร้อมของการค้นหา Memory">
    Doctor จะตรวจสอบว่าผู้ให้บริการ embedding สำหรับการค้นหา Memory ที่กำหนดค่าไว้พร้อมใช้งานสำหรับ agent เริ่มต้นหรือไม่ โดยพฤติกรรมจะขึ้นอยู่กับ backend และ provider ที่กำหนดไว้:

    - **QMD backend**: probe ว่ามีไบนารี `qmd` และสามารถเริ่มทำงานได้หรือไม่ หากไม่ได้ จะพิมพ์แนวทางแก้ไขรวมถึงแพ็กเกจ npm และตัวเลือกพาธไบนารีแบบกำหนดเอง
    - **ผู้ให้บริการ local แบบกำหนดชัดเจน**: ตรวจสอบว่ามีไฟล์โมเดล local หรือ URL ของโมเดลระยะไกล/ดาวน์โหลดได้ที่รู้จักหรือไม่ หากไม่พบ จะเสนอให้เปลี่ยนไปใช้ผู้ให้บริการระยะไกล
    - **ผู้ให้บริการระยะไกลแบบกำหนดชัดเจน** (`openai`, `voyage` เป็นต้น): ตรวจสอบว่ามี API key อยู่ใน environment หรือ auth store หรือไม่ หากไม่มี จะพิมพ์คำแนะนำการแก้ไขที่นำไปใช้ได้จริง
    - **ผู้ให้บริการอัตโนมัติ**: ตรวจสอบความพร้อมของโมเดล local ก่อน จากนั้นจึงลองผู้ให้บริการระยะไกลแต่ละรายตามลำดับการเลือกอัตโนมัติ

    เมื่อมีผลลัพธ์จาก gateway probe (gateway อยู่ในสภาพปกติ ณ เวลาที่ตรวจสอบ) doctor จะอ้างอิงผลลัพธ์นั้นข้ามกับคอนฟิกที่ CLI มองเห็น และระบุหากมีความไม่ตรงกัน

    ใช้ `openclaw memory status --deep` เพื่อตรวจสอบความพร้อมของ embedding ระหว่างรันไทม์

  </Accordion>
  <Accordion title="14. คำเตือนสถานะแชนเนล">
    หาก gateway อยู่ในสภาพปกติ doctor จะรันการ probe สถานะแชนเนล และรายงานคำเตือนพร้อมแนวทางแก้ไขที่แนะนำ
  </Accordion>
  <Accordion title="15. การตรวจสอบคอนฟิก supervisor + การซ่อมแซม">
    Doctor จะตรวจสอบคอนฟิก supervisor ที่ติดตั้งไว้ (launchd/systemd/schtasks) เพื่อหาค่าเริ่มต้นที่หายไปหรือล้าสมัย (เช่น dependency ของ systemd กับ network-online และ delay ของการรีสตาร์ต) เมื่อพบความไม่ตรงกัน ระบบจะแนะนำการอัปเดต และสามารถเขียนไฟล์บริการ/งานใหม่ให้เป็นค่าเริ่มต้นปัจจุบันได้

    หมายเหตุ:

    - `openclaw doctor` จะถามก่อนเขียนคอนฟิก supervisor ใหม่
    - `openclaw doctor --yes` จะยอมรับพรอมป์การซ่อมแซมเริ่มต้น
    - `openclaw doctor --repair` จะใช้การแก้ไขที่แนะนำโดยไม่ถาม
    - `openclaw doctor --repair --force` จะเขียนทับคอนฟิก supervisor แบบกำหนดเอง
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` จะทำให้ doctor อยู่ในโหมดอ่านอย่างเดียวสำหรับวงจรชีวิตของบริการ gateway โดยยังรายงานสถานะบริการและรันการซ่อมแซมที่ไม่เกี่ยวกับบริการต่อได้ แต่จะข้ามการติดตั้ง/เริ่ม/รีสตาร์ต/bootstrap ของบริการ การเขียนคอนฟิก supervisor ใหม่ และการล้างข้อมูลบริการแบบเดิม เพราะวงจรชีวิตดังกล่าวเป็นของ supervisor ภายนอก
    - หาก auth แบบ token ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef การติดตั้ง/ซ่อมแซมบริการผ่าน doctor จะตรวจสอบ SecretRef แต่จะไม่บันทึกค่า token แบบ plaintext ที่ resolve แล้วลงในเมทาดาทา environment ของบริการ supervisor
    - หาก auth แบบ token ต้องใช้ token และ token SecretRef ที่กำหนดค่าไว้ resolve ไม่ได้ doctor จะบล็อกเส้นทาง install/repair พร้อมแนวทางที่นำไปใช้ได้จริง
    - หากกำหนดทั้ง `gateway.auth.token` และ `gateway.auth.password` แต่ไม่ได้ตั้ง `gateway.auth.mode` doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้ง mode อย่างชัดเจน
    - สำหรับ unit ของ Linux user-systemd ตอนนี้การตรวจสอบ token drift ของ doctor จะรวมทั้งแหล่ง `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบเมทาดาทา auth ของบริการ
    - การซ่อมแซมบริการผ่าน doctor จะปฏิเสธการเขียนใหม่ หยุด หรือรีสตาร์ตบริการ gateway จากไบนารี OpenClaw เวอร์ชันเก่า เมื่อคอนฟิกถูกเขียนล่าสุดโดยเวอร์ชันที่ใหม่กว่า ดู [Gateway troubleshooting](/th/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)
    - คุณสามารถบังคับเขียนใหม่ทั้งหมดได้เสมอด้วย `openclaw gateway install --force`

  </Accordion>
  <Accordion title="16. การวินิจฉัยรันไทม์ของ Gateway + พอร์ต">
    Doctor จะตรวจสอบรันไทม์ของบริการ (PID, สถานะการออกล่าสุด) และเตือนเมื่อมีการติดตั้งบริการไว้แต่ไม่ได้รันจริง นอกจากนี้ยังตรวจสอบการชนกันของพอร์ตบนพอร์ต gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (gateway รันอยู่แล้ว, SSH tunnel)
  </Accordion>
  <Accordion title="17. แนวปฏิบัติที่ดีสำหรับรันไทม์ของ Gateway">
    Doctor จะเตือนเมื่อบริการ gateway รันบน Bun หรือพาธ Node ที่มาจาก version manager (`nvm`, `fnm`, `volta`, `asdf` ฯลฯ) แชนเนล WhatsApp + Telegram ต้องใช้ Node และพาธจาก version manager อาจใช้งานไม่ได้หลังอัปเกรด เพราะบริการไม่ได้โหลด shell init ของคุณ Doctor จะเสนอให้ย้ายไปใช้การติดตั้ง Node ระดับระบบเมื่อมีให้ใช้ (Homebrew/apt/choco)
  </Accordion>
  <Accordion title="18. การเขียนคอนฟิก + metadata ของ wizard">
    Doctor จะบันทึกการเปลี่ยนแปลงคอนฟิกที่มี และประทับ metadata ของ wizard เพื่อบันทึกการรัน doctor
  </Accordion>
  <Accordion title="19. คำแนะนำเกี่ยวกับ Workspace (การสำรองข้อมูล + ระบบ Memory)">
    Doctor จะแนะนำระบบ Memory สำหรับ workspace เมื่อยังไม่มี และพิมพ์คำแนะนำเรื่องการสำรองข้อมูลหาก workspace ยังไม่ได้อยู่ภายใต้ git

    ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคู่มือฉบับเต็มเกี่ยวกับโครงสร้าง workspace และการสำรองข้อมูลด้วย git (แนะนำให้ใช้ GitHub หรือ GitLab แบบส่วนตัว)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [การแก้ปัญหา Gateway](/th/gateway/troubleshooting)
