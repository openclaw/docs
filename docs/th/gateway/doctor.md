---
read_when:
    - การเพิ่มหรือแก้ไขไมเกรชันของตัวตรวจสอบ
    - การนำการเปลี่ยนแปลงการกำหนดค่าที่ไม่เข้ากันย้อนหลังมาใช้
sidebarTitle: Doctor
summary: 'คำสั่ง doctor: การตรวจสอบสถานะระบบ การย้ายข้อมูลการกำหนดค่า และขั้นตอนการซ่อมแซม'
title: ตรวจสอบระบบ
x-i18n:
    generated_at: "2026-05-02T20:44:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 504cf06e8457315eb1df4970a877b88fdc2e32f34974ce789875373e9e030234
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` คือเครื่องมือซ่อมแซมและย้ายข้อมูลสำหรับ OpenClaw โดยแก้ไขค่ากำหนด/สถานะที่ค้างเก่า ตรวจสอบสุขภาพระบบ และให้ขั้นตอนซ่อมแซมที่นำไปทำได้ทันที

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

    ยอมรับค่าเริ่มต้นโดยไม่ถามยืนยัน (รวมถึงขั้นตอนรีสตาร์ต/บริการ/ซ่อมแซม sandbox เมื่อใช้ได้)

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    ใช้การซ่อมแซมที่แนะนำโดยไม่ถามยืนยัน (ซ่อมแซมและรีสตาร์ตในจุดที่ปลอดภัย)

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    ใช้การซ่อมแซมเชิงรุกด้วย (เขียนทับค่ากำหนด supervisor แบบกำหนดเอง)

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    รันโดยไม่แสดงพรอมป์ และใช้เฉพาะการย้ายข้อมูลที่ปลอดภัย (ปรับค่ากำหนดให้เป็นมาตรฐาน + ย้ายสถานะบนดิสก์) ข้ามการดำเนินการรีสตาร์ต/บริการ/sandbox ที่ต้องให้มนุษย์ยืนยัน การย้ายข้อมูลสถานะรุ่นเก่าจะรันอัตโนมัติเมื่อตรวจพบ

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    สแกนบริการระบบเพื่อหา gateway ที่ติดตั้งเพิ่ม (launchd/systemd/schtasks)

  </Tab>
</Tabs>

หากต้องการตรวจทานการเปลี่ยนแปลงก่อนเขียน ให้เปิดไฟล์ค่ากำหนดก่อน:

```bash
cat ~/.openclaw/openclaw.json
```

## สิ่งที่เครื่องมือนี้ทำ (สรุป)

<AccordionGroup>
  <Accordion title="สุขภาพระบบ, UI และการอัปเดต">
    - การอัปเดตก่อนเริ่มงานแบบไม่บังคับสำหรับการติดตั้งผ่าน git (เฉพาะโหมดโต้ตอบ)
    - การตรวจสอบความสดใหม่ของโปรโตคอล UI (สร้าง Control UI ใหม่เมื่อสคีมาโปรโตคอลใหม่กว่า)
    - การตรวจสอบสุขภาพระบบ + พรอมป์รีสตาร์ต
    - สรุปสถานะ Skills (ใช้ได้/ขาดหาย/ถูกบล็อก) และสถานะ Plugin

  </Accordion>
  <Accordion title="ค่ากำหนดและการย้ายข้อมูล">
    - การปรับค่ากำหนดรุ่นเก่าให้เป็นมาตรฐาน
    - การย้ายค่ากำหนด Talk จากฟิลด์แบบแบนรุ่นเก่า `talk.*` ไปเป็น `talk.provider` + `talk.providers.<provider>`
    - การตรวจสอบการย้ายข้อมูลเบราว์เซอร์สำหรับค่ากำหนด Chrome extension รุ่นเก่าและความพร้อมของ Chrome MCP
    - คำเตือนการเขียนทับ provider ของ OpenCode (`models.providers.opencode` / `models.providers.opencode-go`)
    - คำเตือนการบดบัง OAuth ของ Codex (`models.providers.openai-codex`)
    - การตรวจสอบข้อกำหนดเบื้องต้นของ OAuth TLS สำหรับโปรไฟล์ OpenAI Codex OAuth
    - คำเตือน allowlist ของ Plugin/เครื่องมือ เมื่อ `plugins.allow` จำกัดมาก แต่ policy ของเครื่องมือยังขอ wildcard หรือเครื่องมือที่ Plugin เป็นเจ้าของ
    - การย้ายสถานะบนดิสก์รุ่นเก่า (sessions/agent dir/WhatsApp auth)
    - การย้ายคีย์ contract ของ manifest Plugin รุ่นเก่า (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
    - การย้าย store ของ Cron รุ่นเก่า (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบนสุด, payload `provider`, งาน webhook สำรองแบบง่าย `notify: true`)
    - การย้าย runtime-policy ของ agent รุ่นเก่าไปยัง `agents.defaults.agentRuntime` และ `agents.list[].agentRuntime`
    - การล้างค่ากำหนด Plugin ที่ค้างเก่าเมื่อเปิดใช้ Plugin; เมื่อ `plugins.enabled=false` การอ้างอิง Plugin ที่ค้างเก่าจะถือเป็นค่ากำหนด containment ที่ไม่ทำงานและจะถูกเก็บไว้

  </Accordion>
  <Accordion title="สถานะและความถูกต้องสมบูรณ์">
    - การตรวจสอบไฟล์ล็อก session และการล้างล็อกค้างเก่า
    - การซ่อมแซม transcript ของ session สำหรับแขนง prompt-rewrite ที่ซ้ำกัน ซึ่งถูกสร้างโดยบิลด์ 2026.4.24 ที่ได้รับผลกระทบ
    - การตรวจจับ tombstone สำหรับการกู้คืนด้วยการรีสตาร์ตของ subagent ที่ค้าง พร้อมรองรับ `--fix` เพื่อล้างธงการกู้คืนที่ถูกยกเลิกและค้างเก่า เพื่อไม่ให้ startup ยังถือว่า child ถูกยกเลิกจากการรีสตาร์ต
    - การตรวจสอบความถูกต้องสมบูรณ์ของสถานะและสิทธิ์ (sessions, transcripts, state dir)
    - การตรวจสอบสิทธิ์ไฟล์ค่ากำหนด (chmod 600) เมื่อรันในเครื่อง
    - สุขภาพ auth ของโมเดล: ตรวจสอบการหมดอายุของ OAuth, รีเฟรช token ที่ใกล้หมดอายุได้ และรายงานสถานะ cooldown/disabled ของ auth-profile
    - การตรวจจับ workspace dir เพิ่มเติม (`~/openclaw`)

  </Accordion>
  <Accordion title="Gateway, บริการ และ supervisor">
    - การซ่อมแซม image ของ sandbox เมื่อเปิดใช้ sandboxing
    - การย้ายข้อมูลบริการรุ่นเก่าและการตรวจจับ Gateway เพิ่มเติม
    - การย้ายสถานะรุ่นเก่าของช่อง Matrix (ในโหมด `--fix` / `--repair`)
    - การตรวจสอบ runtime ของ Gateway (ติดตั้งบริการแล้วแต่ไม่ทำงาน; label ของ launchd ที่แคชไว้)
    - คำเตือนสถานะช่องทาง (ตรวจจาก Gateway ที่กำลังทำงาน)
    - การตรวจสอบค่ากำหนด supervisor (launchd/systemd/schtasks) พร้อมตัวเลือกซ่อมแซม
    - การล้างสภาพแวดล้อม proxy แบบฝังสำหรับบริการ Gateway ที่บันทึกค่า shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` ระหว่างติดตั้งหรืออัปเดต
    - การตรวจสอบแนวทางปฏิบัติที่ดีของ runtime Gateway (Node เทียบกับ Bun, path ของ version-manager)
    - การวินิจฉัยการชนกันของพอร์ต Gateway (ค่าเริ่มต้น `18789`)

  </Accordion>
  <Accordion title="Auth, ความปลอดภัย และการจับคู่">
    - คำเตือนด้านความปลอดภัยสำหรับ policy ของ DM ที่เปิดกว้าง
    - การตรวจสอบ auth ของ Gateway สำหรับโหมด local token (เสนอการสร้าง token เมื่อไม่มีแหล่ง token; ไม่เขียนทับค่ากำหนด token SecretRef)
    - การตรวจจับปัญหาการจับคู่อุปกรณ์ (คำขอจับคู่ครั้งแรกที่ค้างอยู่, การอัปเกรด role/scope ที่ค้างอยู่, ความคลาดเคลื่อนของแคช device-token ในเครื่องที่ค้างเก่า และความคลาดเคลื่อนของ auth ใน record ที่จับคู่แล้ว)

  </Accordion>
  <Accordion title="Workspace และ shell">
    - การตรวจสอบ systemd linger บน Linux
    - การตรวจสอบขนาดไฟล์ bootstrap ของ workspace (คำเตือนการตัดทอน/ใกล้ขีดจำกัดสำหรับไฟล์ context)
    - การตรวจสอบความพร้อมของ Skills สำหรับ agent เริ่มต้น; รายงาน skills ที่อนุญาตแต่ขาด bin, env, config หรือข้อกำหนด OS และ `--fix` สามารถปิดใช้ skills ที่ไม่พร้อมใน `skills.entries`
    - การตรวจสอบสถานะ shell completion และการติดตั้ง/อัปเกรดอัตโนมัติ
    - การตรวจสอบความพร้อมของ provider สำหรับ embedding การค้นหาหน่วยความจำ (โมเดลภายในเครื่อง, คีย์ API ระยะไกล หรือ binary ของ QMD)
    - การตรวจสอบการติดตั้งจากซอร์ส (pnpm workspace ไม่ตรงกัน, ขาด asset ของ UI, ขาด binary ของ tsx)
    - เขียนค่ากำหนดที่อัปเดตแล้ว + metadata ของ wizard

  </Accordion>
</AccordionGroup>

## การเติมข้อมูลย้อนหลังและรีเซ็ต Dreams UI

ฉาก Dreams ของ Control UI มีการดำเนินการ **เติมย้อนหลัง**, **รีเซ็ต** และ **ล้างรายการที่ยึดโยงข้อมูลจริง** สำหรับเวิร์กโฟลว์ Dreaming แบบยึดโยงข้อมูลจริง การดำเนินการเหล่านี้ใช้เมธอด RPC แบบ doctor-style ของ Gateway แต่ **ไม่ใช่** ส่วนหนึ่งของการซ่อมแซม/ย้ายข้อมูลของ `openclaw doctor` CLI

สิ่งที่การดำเนินการเหล่านี้ทำ:

- **เติมย้อนหลัง** สแกนไฟล์ `memory/YYYY-MM-DD.md` ในอดีตของ workspace ที่ใช้งานอยู่ รัน pass ไดอารี REM ที่ยึดโยงข้อมูลจริง และเขียนรายการเติมย้อนหลังที่ย้อนกลับได้ลงใน `DREAMS.md`
- **รีเซ็ต** ลบเฉพาะรายการไดอารีเติมย้อนหลังที่ทำเครื่องหมายไว้เหล่านั้นออกจาก `DREAMS.md`
- **ล้างรายการที่ยึดโยงข้อมูลจริง** ลบเฉพาะรายการระยะสั้นที่ staged ไว้และเป็น grounded-only ซึ่งมาจากการเล่นย้อนหลังข้อมูลอดีต และยังไม่ได้สะสม live recall หรือการสนับสนุนรายวัน

สิ่งที่การดำเนินการเหล่านี้ **ไม่** ทำด้วยตัวเอง:

- ไม่แก้ไข `MEMORY.md`
- ไม่รันการย้ายข้อมูลของ doctor แบบเต็ม
- ไม่ stage ตัวเลือกที่ยึดโยงข้อมูลจริงเข้าสู่ live short-term promotion store โดยอัตโนมัติ เว้นแต่คุณจะรัน path ของ CLI แบบ staged อย่างชัดเจนก่อน

หากต้องการให้การเล่นย้อนหลังประวัติที่ยึดโยงข้อมูลจริงส่งผลต่อ lane การโปรโมตเชิงลึกตามปกติ ให้ใช้ flow ของ CLI แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

คำสั่งนี้จะ stage ตัวเลือกที่ทนทานและยึดโยงข้อมูลจริงเข้าสู่ short-term dreaming store โดยยังคงให้ `DREAMS.md` เป็นพื้นที่ตรวจทาน

## พฤติกรรมโดยละเอียดและเหตุผล

<AccordionGroup>
  <Accordion title="0. การอัปเดตแบบไม่บังคับ (การติดตั้งผ่าน git)">
    หากนี่เป็น git checkout และ doctor กำลังรันแบบโต้ตอบ ระบบจะเสนอให้อัปเดต (fetch/rebase/build) ก่อนรัน doctor
  </Accordion>
  <Accordion title="1. การปรับค่ากำหนดให้เป็นมาตรฐาน">
    หากค่ากำหนดมีรูปแบบค่ารุ่นเก่า (เช่น `messages.ackReaction` ที่ไม่มีการเขียนทับเฉพาะช่องทาง) doctor จะปรับให้อยู่ในสคีมาปัจจุบัน

    ซึ่งรวมถึงฟิลด์แบบแบนของ Talk รุ่นเก่า ค่ากำหนด Talk สาธารณะปัจจุบันคือ `talk.provider` + `talk.providers.<provider>` Doctor จะเขียนรูปแบบเก่า `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ใหม่เข้าสู่ map ของ provider

    Doctor ยังเตือนเมื่อ `plugins.allow` ไม่ว่างและ policy ของเครื่องมือใช้
    wildcard หรือรายการเครื่องมือที่ Plugin เป็นเจ้าของ `tools.allow: ["*"]` จะจับคู่เฉพาะเครื่องมือ
    จาก Plugin ที่โหลดจริงเท่านั้น; ไม่ได้ข้าม allowlist ของ Plugin แบบ exclusive

  </Accordion>
  <Accordion title="2. การย้ายคีย์ค่ากำหนดรุ่นเก่า">
    เมื่อค่ากำหนดมีคีย์ที่เลิกใช้แล้ว คำสั่งอื่นจะปฏิเสธการรันและขอให้คุณรัน `openclaw doctor`

    Doctor จะ:

    - อธิบายว่าพบคีย์รุ่นเก่าใดบ้าง
    - แสดงการย้ายข้อมูลที่ใช้
    - เขียน `~/.openclaw/openclaw.json` ใหม่ด้วยสคีมาที่อัปเดตแล้ว

    Gateway ยังรันการย้ายข้อมูลของ doctor อัตโนมัติเมื่อเริ่มต้น หากตรวจพบรูปแบบค่ากำหนดรุ่นเก่า ดังนั้นค่ากำหนดที่ค้างเก่าจะถูกซ่อมแซมโดยไม่ต้องดำเนินการเอง การย้าย store ของงาน Cron จัดการโดย `openclaw doctor --fix`

    การย้ายข้อมูลปัจจุบัน:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` ระดับบนสุด
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` แบบเก่า → `talk.provider` + `talk.providers.<provider>`
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
    - สำหรับช่องทางที่มี `accounts` แบบตั้งชื่อ แต่ยังมีค่าช่องทางระดับบนสุดแบบบัญชีเดียวค้างอยู่ ให้ย้ายค่าที่อยู่ในขอบเขตบัญชีเหล่านั้นไปยังบัญชีที่ถูกโปรโมตซึ่งเลือกไว้สำหรับช่องทางนั้น (`accounts.default` สำหรับช่องทางส่วนใหญ่; Matrix สามารถคงเป้าหมายที่ตั้งชื่อ/ค่าเริ่มต้นเดิมที่ตรงกันไว้ได้)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - ลบ `agents.defaults.llm`; ใช้ `models.providers.<id>.timeoutSeconds` สำหรับค่าหมดเวลาของผู้ให้บริการ/โมเดลที่ช้า
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - ลบ `browser.relayBindHost` (การตั้งค่า relay ของ extension แบบเก่า)
    - `models.providers.*.api: "openai"` แบบเก่า → `"openai-completions"` (การเริ่มต้น Gateway ยังข้ามผู้ให้บริการที่ตั้งค่า `api` เป็นค่า enum ในอนาคตหรือไม่รู้จัก แทนที่จะล้มเหลวแบบปิด)

    คำเตือนจาก Doctor ยังรวมคำแนะนำค่าเริ่มต้นของบัญชีสำหรับช่องทางหลายบัญชีด้วย:

    - หากมีการกำหนดค่ารายการ `channels.<channel>.accounts` ตั้งแต่สองรายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default` Doctor จะเตือนว่าการกำหนดเส้นทางสำรองอาจเลือกบัญชีที่ไม่คาดคิด
    - หากตั้งค่า `channels.<channel>.defaultAccount` เป็น ID บัญชีที่ไม่รู้จัก Doctor จะเตือนและแสดงรายการ ID บัญชีที่กำหนดค่าไว้

  </Accordion>
  <Accordion title="2b. การแทนที่ผู้ให้บริการ OpenCode">
    หากคุณเพิ่ม `models.providers.opencode`, `opencode-zen` หรือ `opencode-go` ด้วยตนเอง ค่านั้นจะแทนที่แค็ตตาล็อก OpenCode ในตัวจาก `@mariozechner/pi-ai` ซึ่งอาจบังคับให้โมเดลไปใช้ API ที่ผิด หรือทำให้ค่าใช้จ่ายกลายเป็นศูนย์ Doctor จะเตือนเพื่อให้คุณลบการแทนที่และกู้คืนการกำหนดเส้นทาง API + ค่าใช้จ่ายต่อโมเดล
  </Accordion>
  <Accordion title="2c. การย้ายเบราว์เซอร์และความพร้อมของ Chrome MCP">
    หากการกำหนดค่าเบราว์เซอร์ของคุณยังชี้ไปยังพาธ extension ของ Chrome ที่ถูกลบแล้ว Doctor จะปรับให้เป็นโมเดลแนบ Chrome MCP แบบ host-local ปัจจุบัน:

    - `browser.profiles.*.driver: "extension"` จะกลายเป็น `"existing-session"`
    - `browser.relayBindHost` จะถูกลบ

    Doctor ยังตรวจสอบพาธ Chrome MCP แบบ host-local เมื่อคุณใช้ `defaultProfile: "user"` หรือโปรไฟล์ `existing-session` ที่กำหนดค่าไว้:

    - ตรวจสอบว่ามีการติดตั้ง Google Chrome บนโฮสต์เดียวกันสำหรับโปรไฟล์เชื่อมต่ออัตโนมัติเริ่มต้นหรือไม่
    - ตรวจสอบเวอร์ชัน Chrome ที่ตรวจพบและเตือนเมื่อเวอร์ชันต่ำกว่า Chrome 144
    - เตือนให้คุณเปิดใช้การดีบักระยะไกลในหน้า inspect ของเบราว์เซอร์ (เช่น `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` หรือ `edge://inspect/#remote-debugging`)

    Doctor ไม่สามารถเปิดใช้การตั้งค่าฝั่ง Chrome ให้คุณได้ Chrome MCP แบบ host-local ยังคงต้องมี:

    - เบราว์เซอร์ที่ใช้ Chromium 144+ บนโฮสต์ gateway/node
    - เบราว์เซอร์ที่ทำงานในเครื่อง
    - เปิดใช้การดีบักระยะไกลในเบราว์เซอร์นั้น
    - อนุมัติพรอมต์ยินยอมการแนบครั้งแรกในเบราว์เซอร์

    ความพร้อมในที่นี้เกี่ยวกับข้อกำหนดเบื้องต้นของการแนบในเครื่องเท่านั้น Existing-session ยังคงใช้ขีดจำกัดเส้นทาง Chrome MCP ปัจจุบัน; เส้นทางขั้นสูงเช่น `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และการดำเนินการแบบแบตช์ยังต้องใช้เบราว์เซอร์ที่จัดการอยู่หรือโปรไฟล์ CDP ดิบ

    การตรวจสอบนี้ **ไม่** ใช้กับ Docker, sandbox, remote-browser หรือโฟลว์ headless อื่น ๆ สิ่งเหล่านั้นยังคงใช้ CDP ดิบต่อไป

  </Accordion>
  <Accordion title="2d. ข้อกำหนดเบื้องต้นของ OAuth TLS">
    เมื่อมีการกำหนดค่าโปรไฟล์ OpenAI Codex OAuth Doctor จะ probe endpoint การให้สิทธิ์ของ OpenAI เพื่อตรวจสอบว่า Node/OpenSSL TLS stack ในเครื่องสามารถตรวจสอบห่วงโซ่ใบรับรองได้ หาก probe ล้มเหลวด้วยข้อผิดพลาดใบรับรอง (เช่น `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ใบรับรองหมดอายุ หรือใบรับรองที่ลงนามเอง) Doctor จะพิมพ์คำแนะนำการแก้ไขเฉพาะแพลตฟอร์ม บน macOS ที่ใช้ Homebrew Node การแก้มักเป็น `brew postinstall ca-certificates` เมื่อใช้ `--deep` probe จะทำงานแม้ว่า Gateway จะปกติดี
  </Accordion>
  <Accordion title="2e. การแทนที่ผู้ให้บริการ Codex OAuth">
    หากก่อนหน้านี้คุณเพิ่มการตั้งค่า transport ของ OpenAI แบบเก่าไว้ใต้ `models.providers.openai-codex` ค่าเหล่านั้นอาจบดบังพาธผู้ให้บริการ Codex OAuth ในตัวที่รุ่นใหม่กว่าใช้อัตโนมัติ Doctor จะเตือนเมื่อเห็นการตั้งค่า transport เก่าเหล่านั้นควบคู่กับ Codex OAuth เพื่อให้คุณลบหรือเขียนการแทนที่ transport ที่ค้างอยู่ใหม่ และนำพฤติกรรมการกำหนดเส้นทาง/สำรองในตัวกลับมา พร็อกซีแบบกำหนดเองและการแทนที่เฉพาะ header ยังรองรับอยู่และจะไม่ทำให้เกิดคำเตือนนี้
  </Accordion>
  <Accordion title="2f. คำเตือนเส้นทาง Plugin Codex">
    เมื่อเปิดใช้ Plugin Codex ที่รวมมา Doctor จะตรวจสอบด้วยว่า refs โมเดลหลัก `openai-codex/*` ยัง resolve ผ่าน PI runner เริ่มต้นหรือไม่ การผสมนี้ถูกต้องเมื่อคุณต้องการ auth แบบ Codex OAuth/subscription ผ่าน PI แต่สับสนได้ง่ายกับ harness app-server ของ Codex แบบ native Doctor จะเตือนและชี้ไปยังรูปแบบ app-server ที่ระบุชัดเจน: `openai/*` พร้อม `agentRuntime.id: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex`

    Doctor ไม่ซ่อมแซมสิ่งนี้โดยอัตโนมัติ เพราะทั้งสองเส้นทางถูกต้อง:

    - `openai-codex/*` + PI หมายถึง "ใช้ auth แบบ Codex OAuth/subscription ผ่าน runner ปกติของ OpenClaw"
    - `openai/*` + `agentRuntime.id: "codex"` หมายถึง "รัน embedded turn ผ่าน app-server ของ Codex แบบ native"
    - `/codex ...` หมายถึง "ควบคุมหรือ bind การสนทนา Codex แบบ native จากแชต"
    - `/acp ...` หรือ `runtime: "acp"` หมายถึง "ใช้อะแดปเตอร์ ACP/acpx ภายนอก"

    หากคำเตือนปรากฏ ให้เลือกเส้นทางที่คุณตั้งใจและแก้ไข config ด้วยตนเอง คงคำเตือนไว้ตามเดิมเมื่อ PI Codex OAuth เป็นความตั้งใจ

  </Accordion>
  <Accordion title="3. การย้ายสถานะเก่า (เลย์เอาต์ดิสก์)">
    Doctor สามารถย้ายเลย์เอาต์บนดิสก์รุ่นเก่าไปยังโครงสร้างปัจจุบันได้:

    - ที่เก็บเซสชัน + transcript:
      - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
    - ไดเรกทอรี agent:
      - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
    - สถานะ auth ของ WhatsApp (Baileys):
      - จาก `~/.openclaw/credentials/*.json` แบบเก่า (ยกเว้น `oauth.json`)
      - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID บัญชีเริ่มต้น: `default`)

    การย้ายเหล่านี้เป็นแบบพยายามให้ดีที่สุดและทำซ้ำได้อย่างปลอดภัย; Doctor จะปล่อยคำเตือนเมื่อปล่อยโฟลเดอร์เก่าใด ๆ ไว้เป็นข้อมูลสำรอง Gateway/CLI ยังย้ายเซสชันเก่า + ไดเรกทอรี agent โดยอัตโนมัติเมื่อเริ่มต้นด้วย เพื่อให้ประวัติ/auth/โมเดลไปอยู่ในพาธต่อ agent โดยไม่ต้องรัน Doctor ด้วยตนเอง การย้าย auth ของ WhatsApp ตั้งใจให้ย้ายผ่าน `openclaw doctor` เท่านั้น การปรับ provider/provider-map ของ Talk ให้เป็นปกติตอนนี้เปรียบเทียบด้วยความเท่ากันเชิงโครงสร้าง ดังนั้น diff ที่ต่างแค่ลำดับคีย์จะไม่ทำให้เกิดการเปลี่ยนแปลง `doctor --fix` แบบ no-op ซ้ำอีกต่อไป

  </Accordion>
  <Accordion title="3a. การย้าย manifest Plugin แบบเก่า">
    Doctor สแกน manifest ของ Plugin ที่ติดตั้งทั้งหมดเพื่อหาคีย์ความสามารถระดับบนสุดที่เลิกใช้แล้ว (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) เมื่อพบ จะเสนอให้ย้ายคีย์เหล่านั้นเข้าไปในอ็อบเจกต์ `contracts` และเขียนไฟล์ manifest ใหม่ในตำแหน่งเดิม การย้ายนี้ทำซ้ำได้อย่างปลอดภัย; หากคีย์ `contracts` มีค่าเดียวกันอยู่แล้ว คีย์เก่าจะถูกลบโดยไม่ทำซ้ำข้อมูล
  </Accordion>
  <Accordion title="3b. การย้ายที่เก็บ Cron แบบเก่า">
    Doctor ยังตรวจสอบที่เก็บงาน Cron (`~/.openclaw/cron/jobs.json` โดยค่าเริ่มต้น หรือ `cron.store` เมื่อมีการแทนที่) เพื่อหารูปแบบงานเก่าที่ยังรองรับใน scheduler เพื่อความเข้ากันได้

    การล้าง Cron ปัจจุบันประกอบด้วย:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - ฟิลด์ payload ระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
    - ฟิลด์ delivery ระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias การส่ง delivery ของ payload `provider` → `delivery.channel` ที่ระบุชัดเจน
    - งาน webhook fallback แบบเก่าอย่างง่าย `notify: true` → `delivery.mode="webhook"` ที่ระบุชัดเจนพร้อม `delivery.to=cron.webhook`

    Doctor จะย้ายงาน `notify: true` อัตโนมัติก็ต่อเมื่อทำได้โดยไม่เปลี่ยนพฤติกรรม หากงานหนึ่งผสม fallback notify แบบเก่ากับโหมด delivery ที่ไม่ใช่ webhook ซึ่งมีอยู่แล้ว Doctor จะเตือนและปล่อยงานนั้นไว้ให้ตรวจสอบด้วยตนเอง

    บน Linux Doctor ยังเตือนเมื่อ crontab ของผู้ใช้ยังเรียกใช้ `~/.openclaw/bin/ensure-whatsapp.sh` แบบเก่า สคริปต์ host-local นี้ไม่ได้รับการดูแลโดย OpenClaw ปัจจุบัน และอาจเขียนข้อความ `Gateway inactive` ที่ไม่ถูกต้องไปยัง `~/.openclaw/logs/whatsapp-health.log` เมื่อ cron ติดต่อ systemd user bus ไม่ได้ ให้ลบรายการ crontab ที่ค้างอยู่ด้วย `crontab -e`; ใช้ `openclaw channels status --probe`, `openclaw doctor` และ `openclaw gateway status` สำหรับการตรวจสุขภาพปัจจุบัน

  </Accordion>
  <Accordion title="3c. การล้างล็อกเซสชัน">
    Doctor จะสแกนไดเรกทอรีเซสชันของเอเจนต์ทุกตัวเพื่อหาไฟล์ล็อกการเขียนที่ค้างอยู่ — ไฟล์ที่หลงเหลือเมื่อเซสชันออกแบบผิดปกติ สำหรับไฟล์ล็อกแต่ละไฟล์ที่พบ ระบบจะรายงาน: พาธ, PID, ว่า PID ยังทำงานอยู่หรือไม่, อายุของล็อก และถือว่าค้างหรือไม่ (PID ตายแล้วหรือเก่ากว่า 30 นาที) ในโหมด `--fix` / `--repair` ระบบจะลบไฟล์ล็อกที่ค้างโดยอัตโนมัติ มิฉะนั้นจะพิมพ์หมายเหตุและแนะนำให้คุณรันซ้ำด้วย `--fix`
  </Accordion>
  <Accordion title="3d. การซ่อมแซมบรานช์ทรานสคริปต์ของเซสชัน">
    Doctor จะสแกนไฟล์ JSONL ของเซสชันเอเจนต์เพื่อหารูปแบบบรานช์ซ้ำที่เกิดจากบั๊กการเขียนพรอมป์ทรานสคริปต์ใหม่ใน 2026.4.24: เทิร์นผู้ใช้ที่ถูกทิ้งซึ่งมีบริบทรันไทม์ภายในของ OpenClaw พร้อมกับพี่น้องที่ยังใช้งานอยู่ซึ่งมีพรอมป์ผู้ใช้ที่มองเห็นได้เหมือนกัน ในโหมด `--fix` / `--repair` Doctor จะสำรองไฟล์ที่ได้รับผลกระทบแต่ละไฟล์ไว้ข้างไฟล์เดิม แล้วเขียนทรานสคริปต์ใหม่ไปยังบรานช์ที่ใช้งานอยู่ เพื่อให้ประวัติ Gateway และตัวอ่านหน่วยความจำไม่เห็นเทิร์นซ้ำอีกต่อไป
  </Accordion>
  <Accordion title="4. การตรวจสอบความสมบูรณ์ของสถานะ (การคงอยู่ของเซสชัน, การกำหนดเส้นทาง และความปลอดภัย)">
    ไดเรกทอรีสถานะคือแกนควบคุมการทำงาน หากมันหายไป คุณจะสูญเสียเซสชัน ข้อมูลรับรอง ล็อก และคอนฟิก (เว้นแต่คุณมีข้อมูลสำรองอยู่ที่อื่น)

    Doctor ตรวจสอบ:

    - **ไดเรกทอรีสถานะหายไป**: เตือนเกี่ยวกับการสูญเสียสถานะขั้นร้ายแรง แจ้งให้สร้างไดเรกทอรีใหม่ และเตือนว่าระบบกู้ข้อมูลที่หายไปไม่ได้
    - **สิทธิ์ของไดเรกทอรีสถานะ**: ตรวจสอบว่าสามารถเขียนได้หรือไม่ เสนอให้ซ่อมแซมสิทธิ์ (และแสดงคำแนะนำ `chown` เมื่อตรวจพบว่าเจ้าของ/กลุ่มไม่ตรงกัน)
    - **ไดเรกทอรีสถานะบน macOS ที่ซิงก์กับคลาวด์**: เตือนเมื่อสถานะแก้เป็นพาธใต้ iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ `~/Library/CloudStorage/...` เพราะพาธที่มีการซิงก์รองรับอาจทำให้ I/O ช้าลงและเกิดการแข่งขันของล็อก/การซิงก์
    - **ไดเรกทอรีสถานะ Linux บน SD หรือ eMMC**: เตือนเมื่อสถานะแก้ไปยังแหล่งเมานต์ `mmcblk*` เพราะ random I/O ที่รองรับโดย SD หรือ eMMC อาจช้ากว่าและสึกหรอเร็วขึ้นเมื่อมีการเขียนเซสชันและข้อมูลรับรอง
    - **ไดเรกทอรีเซสชันหายไป**: จำเป็นต้องมี `sessions/` และไดเรกทอรีที่เก็บเซสชันเพื่อคงประวัติและหลีกเลี่ยงการแครชแบบ `ENOENT`
    - **ทรานสคริปต์ไม่ตรงกัน**: เตือนเมื่อรายการเซสชันล่าสุดไม่มีไฟล์ทรานสคริปต์
    - **เซสชันหลัก "JSONL 1 บรรทัด"**: ระบุเมื่อทรานสคริปต์หลักมีเพียงหนึ่งบรรทัด (ประวัติไม่ได้สะสม)
    - **ไดเรกทอรีสถานะหลายชุด**: เตือนเมื่อมีโฟลเดอร์ `~/.openclaw` หลายชุดอยู่ตามไดเรกทอรีโฮม หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (ประวัติอาจถูกแยกระหว่างการติดตั้ง)
    - **การเตือนโหมดรีโมต**: หาก `gateway.mode=remote` Doctor จะเตือนให้คุณรันบนโฮสต์รีโมต (สถานะอยู่ที่นั่น)
    - **สิทธิ์ของไฟล์คอนฟิก**: เตือนหาก `~/.openclaw/openclaw.json` อ่านได้โดยกลุ่ม/ทุกคน และเสนอให้จำกัดเป็น `600`

  </Accordion>
  <Accordion title="5. สุขภาพการยืนยันตัวตนของโมเดล (OAuth หมดอายุ)">
    Doctor ตรวจสอบโปรไฟล์ OAuth ในที่เก็บการยืนยันตัวตน เตือนเมื่อโทเคนกำลังจะหมดอายุ/หมดอายุแล้ว และสามารถรีเฟรชได้เมื่อปลอดภัย หากโปรไฟล์ Anthropic OAuth/โทเคนล้าสมัย ระบบจะแนะนำคีย์ Anthropic API หรือพาธ setup-token ของ Anthropic พรอมป์รีเฟรชจะแสดงเฉพาะเมื่อรันแบบโต้ตอบ (TTY); `--non-interactive` จะข้ามความพยายามรีเฟรช

    เมื่อการรีเฟรช OAuth ล้มเหลวถาวร (เช่น `refresh_token_reused`, `invalid_grant` หรือผู้ให้บริการแจ้งให้คุณลงชื่อเข้าใช้อีกครั้ง) Doctor จะรายงานว่าต้องยืนยันตัวตนใหม่และพิมพ์คำสั่ง `openclaw models auth login --provider ...` ที่ต้องรันอย่างตรงตัว

    Doctor ยังรายงานโปรไฟล์การยืนยันตัวตนที่ใช้งานไม่ได้ชั่วคราวเนื่องจาก:

    - คูลดาวน์สั้น ๆ (การจำกัดอัตรา/หมดเวลา/การยืนยันตัวตนล้มเหลว)
    - การปิดใช้งานที่นานขึ้น (ปัญหาบิลลิง/เครดิต)

  </Accordion>
  <Accordion title="6. การตรวจสอบโมเดล hooks">
    หากตั้งค่า `hooks.gmail.model` แล้ว Doctor จะตรวจสอบการอ้างอิงโมเดลกับแคตตาล็อกและ allowlist และเตือนเมื่อแก้ไม่ได้หรือไม่ได้รับอนุญาต
  </Accordion>
  <Accordion title="7. การซ่อมแซมอิมเมจแซนด์บ็อกซ์">
    เมื่อเปิดใช้งานแซนด์บ็อกซ์ Doctor จะตรวจสอบอิมเมจ Docker และเสนอให้สร้างหรือสลับไปใช้ชื่อ legacy หากอิมเมจปัจจุบันหายไป
  </Accordion>
  <Accordion title="7b. การล้างการติดตั้ง Plugin">
    Doctor จะลบสถานะ staging ของ dependency Plugin ที่ OpenClaw สร้างไว้แบบ legacy ในโหมด `openclaw doctor --fix` / `openclaw doctor --repair` ซึ่งครอบคลุม root ของ dependency ที่สร้างไว้ค้าง, ไดเรกทอรี install-stage เก่า และเศษข้อมูลในแพ็กเกจจากโค้ดซ่อมแซม dependency ของ Plugin ที่บันเดิลมาก่อนหน้า

    Doctor ยังสามารถติดตั้ง Plugin แบบดาวน์โหลดที่คอนฟิกไว้ใหม่ได้เมื่อคอนฟิกอ้างถึง Plugin เหล่านั้น แต่ registry ของ Plugin ในเครื่องหาไม่พบ สำหรับการแยก Plugin ที่บันเดิลใน 2026.5.2 ออกเป็นภายนอก Doctor จะติดตั้ง Plugin แบบดาวน์โหลดที่คอนฟิกเดิมใช้อยู่แล้วโดยอัตโนมัติ จากนั้นอาศัย `meta.lastTouchedVersion` เพื่อให้ pass ของรุ่นนั้นรันเพียงครั้งเดียว การเริ่มต้น Gateway และการโหลดคอนฟิกซ้ำจะไม่รัน package manager; การติดตั้ง Plugin ยังคงเป็นงานของ Doctor/install/update ที่ชัดเจน

  </Accordion>
  <Accordion title="8. การย้ายบริการ Gateway และคำแนะนำการล้าง">
    Doctor ตรวจพบบริการ Gateway แบบ legacy (launchd/systemd/schtasks) และเสนอให้ลบบริการเหล่านั้นและติดตั้งบริการ OpenClaw โดยใช้พอร์ต Gateway ปัจจุบัน นอกจากนี้ยังสามารถสแกนหาบริการที่คล้าย Gateway เพิ่มเติมและพิมพ์คำแนะนำการล้างได้ บริการ OpenClaw Gateway ที่ตั้งชื่อตามโปรไฟล์ถือเป็นบริการชั้นหนึ่งและจะไม่ถูกระบุว่าเป็น "เพิ่มเติม"

    บน Linux หากบริการ Gateway ระดับผู้ใช้หายไปแต่มีบริการ OpenClaw Gateway ระดับระบบอยู่ Doctor จะไม่ติดตั้งบริการระดับผู้ใช้อีกตัวโดยอัตโนมัติ ตรวจสอบด้วย `openclaw gateway status --deep` หรือ `openclaw doctor --deep` จากนั้นลบตัวซ้ำหรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ system supervisor เป็นเจ้าของวงจรชีวิตของ Gateway

  </Accordion>
  <Accordion title="8b. การย้าย Startup Matrix">
    เมื่อบัญชีช่องทาง Matrix มีการย้ายสถานะ legacy ที่ค้างอยู่หรือดำเนินการได้ Doctor (ในโหมด `--fix` / `--repair`) จะสร้างสแนปช็อตก่อนย้าย แล้วรันขั้นตอนการย้ายแบบพยายามให้ดีที่สุด: การย้ายสถานะ Matrix แบบ legacy และการเตรียม encrypted-state แบบ legacy ทั้งสองขั้นตอนไม่ถึงขั้นทำให้ล้มเหลว; ข้อผิดพลาดจะถูกล็อกและการเริ่มต้นจะดำเนินต่อ ในโหมดอ่านอย่างเดียว (`openclaw doctor` ที่ไม่มี `--fix`) การตรวจสอบนี้จะถูกข้ามทั้งหมด
  </Accordion>
  <Accordion title="8c. การจับคู่อุปกรณ์และความคลาดเคลื่อนของการยืนยันตัวตน">
    ตอนนี้ Doctor ตรวจสอบสถานะการจับคู่อุปกรณ์เป็นส่วนหนึ่งของการตรวจสุขภาพปกติ

    สิ่งที่รายงาน:

    - คำขอจับคู่ครั้งแรกที่ค้างอยู่
    - การอัปเกรดบทบาทที่ค้างอยู่สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การอัปเกรด scope ที่ค้างอยู่สำหรับอุปกรณ์ที่จับคู่แล้ว
    - การซ่อมแซม public-key mismatch ที่ id อุปกรณ์ยังตรงกัน แต่ identity ของอุปกรณ์ไม่ตรงกับระเบียนที่อนุมัติแล้วอีกต่อไป
    - ระเบียนที่จับคู่แล้วซึ่งไม่มีโทเคนที่ใช้งานอยู่สำหรับบทบาทที่อนุมัติแล้ว
    - โทเคนที่จับคู่แล้วซึ่ง scope คลาดออกจาก baseline การจับคู่ที่อนุมัติแล้ว
    - รายการ device-token ที่แคชไว้ในเครื่องสำหรับเครื่องปัจจุบัน ซึ่งเกิดก่อนการหมุนโทเคนฝั่ง Gateway หรือมีเมทาดาทา scope ที่ล้าสมัย

    Doctor จะไม่อนุมัติคำขอจับคู่โดยอัตโนมัติหรือหมุนโทเคนอุปกรณ์โดยอัตโนมัติ แต่จะพิมพ์ขั้นตอนถัดไปที่ตรงตัวแทน:

    - ตรวจสอบคำขอที่ค้างอยู่ด้วย `openclaw devices list`
    - อนุมัติคำขอที่แน่นอนด้วย `openclaw devices approve <requestId>`
    - หมุนโทเคนใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
    - ลบและอนุมัติระเบียนที่ล้าสมัยอีกครั้งด้วย `openclaw devices remove <deviceId>`

    สิ่งนี้ปิดช่องโหว่ทั่วไปของ "จับคู่แล้วแต่ยังต้องจับคู่": ตอนนี้ Doctor แยกการจับคู่ครั้งแรกออกจากการอัปเกรดบทบาท/scope ที่ค้างอยู่ และจากความคลาดเคลื่อนของโทเคน/identity อุปกรณ์ที่ล้าสมัย

  </Accordion>
  <Accordion title="9. คำเตือนด้านความปลอดภัย">
    Doctor แสดงคำเตือนเมื่อผู้ให้บริการเปิดรับ DM โดยไม่มี allowlist หรือเมื่อนโยบายถูกคอนฟิกในลักษณะที่อันตราย
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    หากรันเป็นบริการผู้ใช้ของ systemd Doctor จะตรวจให้แน่ใจว่าเปิดใช้ lingering เพื่อให้ Gateway ยังทำงานต่อหลังออกจากระบบ
  </Accordion>
  <Accordion title="11. สถานะเวิร์กสเปซ (Skills, Plugin และไดเรกทอรี legacy)">
    Doctor พิมพ์สรุปสถานะเวิร์กสเปซสำหรับเอเจนต์ค่าเริ่มต้น:

    - **สถานะ Skills**: นับ Skills ที่เข้าเกณฑ์, ขาดข้อกำหนด และถูก allowlist บล็อก
    - **ไดเรกทอรีเวิร์กสเปซ legacy**: เตือนเมื่อมี `~/openclaw` หรือไดเรกทอรีเวิร์กสเปซ legacy อื่นอยู่ข้างเวิร์กสเปซปัจจุบัน
    - **สถานะ Plugin**: นับ Plugin ที่เปิดใช้งาน/ปิดใช้งาน/ผิดพลาด; แสดงรายการ ID ของ Plugin สำหรับข้อผิดพลาดใด ๆ; รายงานความสามารถของ Plugin บันเดิล
    - **คำเตือนความเข้ากันได้ของ Plugin**: ระบุ Plugin ที่มีปัญหาความเข้ากันได้กับรันไทม์ปัจจุบัน
    - **การวินิจฉัย Plugin**: แสดงคำเตือนหรือข้อผิดพลาดระหว่างโหลดที่ registry ของ Plugin ปล่อยออกมา

  </Accordion>
  <Accordion title="11b. ขนาดไฟล์ bootstrap">
    Doctor ตรวจสอบว่าไฟล์ bootstrap ของเวิร์กสเปซ (เช่น `AGENTS.md`, `CLAUDE.md` หรือไฟล์บริบทที่ฉีดอื่น ๆ) อยู่ใกล้หรือเกินงบประมาณอักขระที่คอนฟิกไว้หรือไม่ ระบบจะรายงานจำนวนอักขระดิบเทียบกับที่ฉีดต่อไฟล์, เปอร์เซ็นต์การตัดทอน, สาเหตุการตัดทอน (`max/file` หรือ `max/total`) และอักขระที่ฉีดทั้งหมดเป็นสัดส่วนของงบประมาณทั้งหมด เมื่อไฟล์ถูกตัดทอนหรือใกล้ถึงขีดจำกัด Doctor จะพิมพ์เคล็ดลับสำหรับปรับ `agents.defaults.bootstrapMaxChars` และ `agents.defaults.bootstrapTotalMaxChars`
  </Accordion>
  <Accordion title="11d. การล้าง Plugin ช่องทางที่ล้าสมัย">
    เมื่อ `openclaw doctor --fix` ลบ Plugin ช่องทางที่หายไป ระบบจะลบคอนฟิกตาม scope ช่องทางที่ห้อยค้างซึ่งอ้างถึง Plugin นั้นด้วย: รายการ `channels.<id>`, เป้าหมาย Heartbeat ที่ระบุชื่อช่องทาง และ override `agents.*.models["<channel>/*"]` สิ่งนี้ป้องกันลูปการบูต Gateway ที่รันไทม์ของช่องทางหายไปแล้ว แต่คอนฟิกยังขอให้ Gateway ผูกกับมัน
  </Accordion>
  <Accordion title="11c. การเติมคำสั่งเชลล์">
    Doctor ตรวจสอบว่ามีการติดตั้ง tab completion สำหรับเชลล์ปัจจุบันหรือไม่ (zsh, bash, fish หรือ PowerShell):

    - หากโปรไฟล์เชลล์ใช้รูปแบบ dynamic completion ที่ช้า (`source <(openclaw completion ...)`) Doctor จะอัปเกรดเป็นรูปแบบไฟล์แคชที่เร็วกว่า
    - หากคอนฟิก completion ไว้ในโปรไฟล์แต่ไฟล์แคชหายไป Doctor จะสร้างแคชใหม่โดยอัตโนมัติ
    - หากไม่มีการคอนฟิก completion เลย Doctor จะแจ้งให้ติดตั้ง (เฉพาะโหมดโต้ตอบ; ข้ามด้วย `--non-interactive`)

    รัน `openclaw completion --write-state` เพื่อสร้างแคชใหม่ด้วยตนเอง

  </Accordion>
  <Accordion title="12. การตรวจสอบการยืนยันตัวตนของ Gateway (โทเคนในเครื่อง)">
    Doctor ตรวจสอบความพร้อมของการยืนยันตัวตนโทเคน Gateway ในเครื่อง

    - หากโหมดโทเคนต้องใช้โทเคนและไม่มีแหล่งโทเคน Doctor จะเสนอให้สร้างโทเคน
    - หาก `gateway.auth.token` จัดการโดย SecretRef แต่ไม่พร้อมใช้งาน Doctor จะเตือนและไม่เขียนทับด้วย plaintext
    - `openclaw doctor --generate-gateway-token` บังคับสร้างเฉพาะเมื่อไม่มีการคอนฟิก SecretRef ของโทเคน

  </Accordion>
  <Accordion title="12b. การซ่อมแซมแบบอ่านอย่างเดียวที่รับรู้ SecretRef">
    โฟลว์การซ่อมแซมบางส่วนจำเป็นต้องตรวจสอบข้อมูลรับรองที่คอนฟิกไว้โดยไม่ทำให้พฤติกรรม fail-fast ของรันไทม์อ่อนลง

    - ตอนนี้ `openclaw doctor --fix` ใช้โมเดลสรุป SecretRef แบบอ่านอย่างเดียวเดียวกับคำสั่งตระกูล status สำหรับการซ่อมแซมคอนฟิกแบบเจาะจง
    - ตัวอย่าง: การซ่อมแซม `allowFrom` / `groupAllowFrom` `@username` ของ Telegram จะพยายามใช้ข้อมูลรับรองบอทที่คอนฟิกไว้เมื่อพร้อมใช้งาน
    - หากโทเคนบอท Telegram ถูกคอนฟิกผ่าน SecretRef แต่ไม่พร้อมใช้งานในพาธคำสั่งปัจจุบัน Doctor จะรายงานว่าข้อมูลรับรองถูกคอนฟิกไว้แต่ไม่พร้อมใช้งาน และข้ามการแก้ค่าอัตโนมัติแทนที่จะแครชหรือรายงานผิดว่าโทเคนหายไป

  </Accordion>
  <Accordion title="13. การตรวจสุขภาพ Gateway + การรีสตาร์ต">
    Doctor จะเรียกใช้การตรวจสุขภาพและเสนอให้รีสตาร์ต Gateway เมื่อดูเหมือนว่าไม่สมบูรณ์
  </Accordion>
  <Accordion title="13b. ความพร้อมของการค้นหาหน่วยความจำ">
    Doctor จะตรวจสอบว่า embedding provider สำหรับการค้นหาหน่วยความจำที่กำหนดค่าไว้พร้อมสำหรับเอเจนต์เริ่มต้นหรือไม่ ลักษณะการทำงานขึ้นอยู่กับแบ็กเอนด์และ provider ที่กำหนดค่าไว้:

    - **แบ็กเอนด์ QMD**: ตรวจสอบว่าไบนารี `qmd` พร้อมใช้งานและเริ่มทำงานได้หรือไม่ หากไม่ได้ จะพิมพ์คำแนะนำการแก้ไข รวมถึงแพ็กเกจ npm และตัวเลือกพาธไบนารีแบบกำหนดเอง
    - **provider ภายในที่ระบุชัดเจน**: ตรวจหาไฟล์โมเดลภายในหรือ URL ของโมเดลระยะไกล/ที่ดาวน์โหลดได้ซึ่งรู้จัก หากไม่มี จะแนะนำให้สลับไปใช้ provider ระยะไกล
    - **provider ระยะไกลที่ระบุชัดเจน** (`openai`, `voyage` ฯลฯ): ตรวจสอบว่ามี API key อยู่ในสภาพแวดล้อมหรือ auth store หรือไม่ หากไม่มี จะพิมพ์คำแนะนำการแก้ไขที่นำไปทำได้
    - **provider อัตโนมัติ**: ตรวจสอบความพร้อมของโมเดลภายในก่อน จากนั้นลอง provider ระยะไกลแต่ละตัวตามลำดับการเลือกอัตโนมัติ

    เมื่อมีผลการตรวจสอบ Gateway ที่แคชไว้พร้อมใช้งาน (Gateway มีสุขภาพดี ณ เวลาที่ตรวจสอบ) doctor จะเทียบผลนั้นกับค่าคอนฟิกที่ CLI มองเห็นและระบุความคลาดเคลื่อนใด ๆ Doctor จะไม่เริ่ม ping embedding ใหม่ในพาธเริ่มต้น ใช้คำสั่งสถานะหน่วยความจำเชิงลึกเมื่อคุณต้องการตรวจสอบ provider แบบสด

    ใช้ `openclaw memory status --deep` เพื่อตรวจสอบความพร้อมของ embedding ขณะรันไทม์

  </Accordion>
  <Accordion title="14. คำเตือนสถานะช่องทาง">
    หาก Gateway มีสุขภาพดี doctor จะเรียกใช้การตรวจสอบสถานะช่องทางและรายงานคำเตือนพร้อมการแก้ไขที่แนะนำ
  </Accordion>
  <Accordion title="15. การตรวจสอบคอนฟิก supervisor + การซ่อมแซม">
    Doctor จะตรวจสอบคอนฟิก supervisor ที่ติดตั้งไว้ (launchd/systemd/schtasks) เพื่อหาค่าเริ่มต้นที่ขาดหายหรือล้าสมัย (เช่น dependency ของ systemd network-online และความหน่วงก่อนรีสตาร์ต) เมื่อพบความไม่ตรงกัน จะแนะนำให้อัปเดตและสามารถเขียนไฟล์ service/task ใหม่เป็นค่าเริ่มต้นปัจจุบันได้

    หมายเหตุ:

    - `openclaw doctor` จะถามก่อนเขียนคอนฟิก supervisor ใหม่
    - `openclaw doctor --yes` จะยอมรับพรอมต์ซ่อมแซมเริ่มต้น
    - `openclaw doctor --repair` จะใช้การแก้ไขที่แนะนำโดยไม่แสดงพรอมต์
    - `openclaw doctor --repair --force` จะเขียนทับคอนฟิก supervisor แบบกำหนดเอง
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` ทำให้ doctor เป็นแบบอ่านอย่างเดียวสำหรับวงจรชีวิตของ service Gateway โดยยังรายงานสุขภาพ service และเรียกใช้การซ่อมแซมที่ไม่ใช่ service แต่จะข้ามการติดตั้ง/เริ่ม/รีสตาร์ต/bootstrap service, การเขียนคอนฟิก supervisor ใหม่ และการล้าง service เดิม เพราะ supervisor ภายนอกเป็นเจ้าของวงจรชีวิตนั้น
    - บน Linux, doctor จะไม่เขียน metadata ของคำสั่ง/entrypoint ใหม่ขณะที่ unit Gateway ของ systemd ที่ตรงกันกำลัง active อยู่ และยังจะละเว้น unit เพิ่มเติมที่คล้าย Gateway ซึ่ง inactive และไม่ใช่ legacy ระหว่างการสแกน service ซ้ำ เพื่อไม่ให้ไฟล์ service คู่กันสร้างสัญญาณรบกวนในการล้างข้อมูล
    - หาก token auth ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef การติดตั้ง/ซ่อมแซม service ของ doctor จะตรวจสอบ SecretRef แต่จะไม่บันทึกค่า token plaintext ที่ resolve แล้วลงใน metadata สภาพแวดล้อมของ supervisor service
    - Doctor ตรวจพบค่าสภาพแวดล้อม service ที่จัดการด้วย `.env`/SecretRef ซึ่งการติดตั้ง LaunchAgent, systemd หรือ Windows Scheduled Task รุ่นเก่าฝังไว้แบบ inline และจะเขียน metadata ของ service ใหม่เพื่อให้ค่าเหล่านั้นโหลดจากแหล่ง runtime แทนจากนิยาม supervisor
    - Doctor ตรวจพบเมื่อคำสั่ง service ยังตรึง `--port` เก่าไว้หลังจาก `gateway.port` เปลี่ยน และจะเขียน metadata ของ service ใหม่ให้ใช้พอร์ตปัจจุบัน
    - หาก token auth ต้องใช้ token และ SecretRef ของ token ที่กำหนดค่าไว้ยัง resolve ไม่ได้ doctor จะบล็อกพาธการติดตั้ง/ซ่อมแซมพร้อมคำแนะนำที่นำไปทำได้
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และยังไม่ได้ตั้งค่า `gateway.auth.mode` doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้งค่า mode อย่างชัดเจน
    - สำหรับ unit user-systemd บน Linux ตอนนี้การตรวจสอบ token drift ของ doctor รวมทั้งแหล่งที่มา `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบ metadata auth ของ service
    - การซ่อมแซม service ของ Doctor จะปฏิเสธการเขียนใหม่ หยุด หรือรีสตาร์ต service Gateway จากไบนารี OpenClaw รุ่นเก่า เมื่อคอนฟิกถูกเขียนล่าสุดโดยเวอร์ชันที่ใหม่กว่า ดู [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)
    - คุณสามารถบังคับเขียนใหม่ทั้งหมดได้เสมอผ่าน `openclaw gateway install --force`

  </Accordion>
  <Accordion title="16. การวินิจฉัย runtime ของ Gateway + พอร์ต">
    Doctor จะตรวจสอบ runtime ของ service (PID, สถานะ exit ล่าสุด) และเตือนเมื่อ service ถูกติดตั้งแล้วแต่ไม่ได้รันจริง นอกจากนี้ยังตรวจสอบการชนกันของพอร์ตบนพอร์ต Gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (Gateway กำลังรันอยู่แล้ว, SSH tunnel)
  </Accordion>
  <Accordion title="17. แนวทางปฏิบัติที่ดีสำหรับ runtime ของ Gateway">
    Doctor จะเตือนเมื่อ service Gateway รันบน Bun หรือพาธ Node ที่จัดการด้วยเวอร์ชัน (`nvm`, `fnm`, `volta`, `asdf` ฯลฯ) ช่องทาง WhatsApp + Telegram ต้องใช้ Node และพาธของ version-manager อาจพังหลังอัปเกรด เพราะ service ไม่ได้โหลด shell init ของคุณ Doctor จะเสนอให้ย้ายไปใช้การติดตั้ง Node ของระบบเมื่อมีพร้อมใช้งาน (Homebrew/apt/choco)

    macOS LaunchAgents ที่ติดตั้งใหม่หรือซ่อมแซมแล้วจะใช้ PATH ของระบบแบบมาตรฐาน (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) แทนการคัดลอก PATH ของ shell แบบโต้ตอบ ดังนั้นไดเรกทอรีของ Volta, asdf, fnm, pnpm และ version-manager อื่น ๆ จะไม่เปลี่ยนว่า child process ของ Node จะ resolve ตัวใด service บน Linux ยังเก็บ root ของสภาพแวดล้อมอย่างชัดเจน (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) และไดเรกทอรี user-bin ที่เสถียรไว้ แต่ไดเรกทอรี fallback ของ version-manager ที่คาดเดาจะถูกเขียนลงใน PATH ของ service เฉพาะเมื่อไดเรกทอรีเหล่านั้นมีอยู่บนดิสก์เท่านั้น

  </Accordion>
  <Accordion title="18. การเขียนคอนฟิก + metadata ของตัวช่วยตั้งค่า">
    Doctor จะบันทึกการเปลี่ยนแปลงคอนฟิกใด ๆ และประทับ metadata ของตัวช่วยตั้งค่าเพื่อบันทึกการรัน doctor
  </Accordion>
  <Accordion title="19. เคล็ดลับ workspace (การสำรองข้อมูล + ระบบหน่วยความจำ)">
    Doctor จะแนะนำระบบหน่วยความจำของ workspace เมื่อขาดหาย และพิมพ์เคล็ดลับการสำรองข้อมูลหาก workspace ยังไม่ได้อยู่ภายใต้ git

    ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคู่มือฉบับเต็มเกี่ยวกับโครงสร้าง workspace และการสำรองข้อมูลด้วย git (แนะนำ GitHub หรือ GitLab แบบส่วนตัว)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [runbook ของ Gateway](/th/gateway)
- [การแก้ปัญหา Gateway](/th/gateway/troubleshooting)
