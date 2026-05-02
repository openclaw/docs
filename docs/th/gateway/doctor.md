---
read_when:
    - การเพิ่มหรือแก้ไขไมเกรชันของตัวตรวจสุขภาพ
    - การนำการเปลี่ยนแปลงการกำหนดค่าที่ไม่เข้ากันแบบย้อนหลังมาใช้
sidebarTitle: Doctor
summary: 'คำสั่ง doctor: การตรวจสอบสถานะระบบ การย้ายการกำหนดค่า และขั้นตอนการซ่อมแซม'
title: ตรวจสุขภาพ
x-i18n:
    generated_at: "2026-05-02T10:15:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff4ab00fd6a11588abe790350fe139bc49f61e688bcd741389dd63732aa4430c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` คือเครื่องมือซ่อมแซม + ย้ายข้อมูลสำหรับ OpenClaw เครื่องมือนี้แก้ไข config/state ที่ล้าสมัย ตรวจสอบสุขภาพ และให้ขั้นตอนการซ่อมแซมที่ดำเนินการได้

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

    ยอมรับค่าเริ่มต้นโดยไม่ถามพร้อมต์ (รวมถึงขั้นตอนซ่อมแซม restart/service/sandbox เมื่อใช้ได้)

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    ใช้การซ่อมแซมที่แนะนำโดยไม่ถามพร้อมต์ (ซ่อมแซม + restart ในจุดที่ปลอดภัย)

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

    เรียกใช้โดยไม่มีพร้อมต์และใช้เฉพาะการย้ายข้อมูลที่ปลอดภัย (การปรับ config ให้เป็นมาตรฐาน + การย้าย state บนดิสก์) ข้ามการดำเนินการ restart/service/sandbox ที่ต้องมีการยืนยันจากมนุษย์ การย้าย state รุ่นเก่าจะทำงานโดยอัตโนมัติเมื่อตรวจพบ

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    สแกนบริการระบบเพื่อหา gateway ที่ติดตั้งเพิ่มเติม (launchd/systemd/schtasks)

  </Tab>
</Tabs>

หากต้องการตรวจทานการเปลี่ยนแปลงก่อนเขียน ให้เปิดไฟล์ config ก่อน:

```bash
cat ~/.openclaw/openclaw.json
```

## สิ่งที่เครื่องมือนี้ทำ (สรุป)

<AccordionGroup>
  <Accordion title="สุขภาพ, UI, และอัปเดต">
    - อัปเดตก่อนเริ่มแบบเลือกได้สำหรับการติดตั้งผ่าน git (เฉพาะโหมดโต้ตอบ)
    - ตรวจสอบความสดใหม่ของโปรโตคอล UI (สร้าง Control UI ใหม่เมื่อ schema โปรโตคอลใหม่กว่า)
    - ตรวจสอบสุขภาพ + พร้อมต์ให้ restart
    - สรุปสถานะ Skills (eligible/missing/blocked) และสถานะ Plugin

  </Accordion>
  <Accordion title="Config และการย้ายข้อมูล">
    - ปรับ config ให้เป็นมาตรฐานสำหรับค่ารุ่นเก่า
    - ย้าย config ของ Talk จากฟิลด์แบนรุ่นเก่า `talk.*` ไปเป็น `talk.provider` + `talk.providers.<provider>`
    - ตรวจสอบการย้าย browser สำหรับ config Chrome extension รุ่นเก่าและความพร้อมของ Chrome MCP
    - คำเตือนการ override provider ของ OpenCode (`models.providers.opencode` / `models.providers.opencode-go`)
    - คำเตือนการ shadow ของ Codex OAuth (`models.providers.openai-codex`)
    - ตรวจสอบข้อกำหนดเบื้องต้นของ OAuth TLS สำหรับโปรไฟล์ OpenAI Codex OAuth
    - คำเตือน allowlist ของ Plugin/tool เมื่อ `plugins.allow` จำกัดมากแต่ policy ของ tool ยังขอ wildcard หรือ tool ที่ Plugin เป็นเจ้าของ
    - ย้าย state รุ่นเก่าบนดิสก์ (sessions/agent dir/WhatsApp auth)
    - ย้าย key contract ของ manifest Plugin รุ่นเก่า (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
    - ย้าย store ของ cron รุ่นเก่า (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบน, payload `provider`, งาน fallback webhook แบบง่าย `notify: true`)
    - ย้าย runtime-policy ของ agent รุ่นเก่าไปยัง `agents.defaults.agentRuntime` และ `agents.list[].agentRuntime`
    - ล้าง config Plugin ที่ล้าสมัยเมื่อเปิดใช้ Plugin; เมื่อ `plugins.enabled=false` การอ้างอิง Plugin ที่ล้าสมัยจะถือเป็น config containment ที่ไม่ทำงานและจะถูกเก็บไว้

  </Accordion>
  <Accordion title="State และความถูกต้องสมบูรณ์">
    - ตรวจสอบไฟล์ล็อกของ session และล้างล็อกที่ล้าสมัย
    - ซ่อมแซม transcript ของ session สำหรับ branch prompt-rewrite ที่ซ้ำกันซึ่งสร้างโดยบิลด์ 2026.4.24 ที่ได้รับผลกระทบ
    - ตรวจหา tombstone การกู้คืนหลัง restart ของ subagent ที่ค้าง พร้อมรองรับ `--fix` เพื่อล้าง flag การกู้คืนที่ถูก abort และล้าสมัย เพื่อให้ startup ไม่ถือ child เป็น restart-aborted ต่อไป
    - ตรวจสอบความถูกต้องสมบูรณ์และสิทธิ์ของ state (sessions, transcripts, state dir)
    - ตรวจสอบสิทธิ์ไฟล์ config (chmod 600) เมื่อเรียกใช้ในเครื่อง
    - สุขภาพ auth ของ model: ตรวจสอบวันหมดอายุ OAuth, รีเฟรช token ที่ใกล้หมดอายุได้ และรายงานสถานะ cooldown/disabled ของ auth-profile
    - ตรวจหา workspace dir เพิ่มเติม (`~/openclaw`)

  </Accordion>
  <Accordion title="Gateway, services, และ supervisors">
    - ซ่อมแซม sandbox image เมื่อเปิดใช้ sandboxing
    - ย้าย service รุ่นเก่าและตรวจหา gateway เพิ่มเติม
    - ย้าย state รุ่นเก่าของ Matrix channel (ในโหมด `--fix` / `--repair`)
    - ตรวจสอบ runtime ของ Gateway (service ติดตั้งแล้วแต่ไม่ทำงาน; label launchd ที่ cache ไว้)
    - คำเตือนสถานะ Channel (probe จาก gateway ที่กำลังทำงาน)
    - ตรวจ audit config supervisor (launchd/systemd/schtasks) พร้อมการซ่อมแซมแบบเลือกได้
    - ล้าง environment ของ embedded proxy สำหรับบริการ gateway ที่จับค่า shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` ระหว่างติดตั้งหรืออัปเดต
    - ตรวจสอบ best practice ของ runtime Gateway (Node เทียบกับ Bun, path ของ version-manager)
    - วินิจฉัยการชนกันของ port Gateway (ค่าเริ่มต้น `18789`)

  </Accordion>
  <Accordion title="Auth, security, และ pairing">
    - คำเตือนด้านความปลอดภัยสำหรับ policy DM แบบเปิด
    - ตรวจสอบ auth ของ Gateway สำหรับโหมด local token (เสนอการสร้าง token เมื่อไม่มีแหล่ง token; ไม่เขียนทับ config token SecretRef)
    - ตรวจหาปัญหา device pairing (คำขอ pair ครั้งแรกที่ค้างอยู่, การอัปเกรด role/scope ที่ค้างอยู่, drift ของ cache device-token ในเครื่องที่ล้าสมัย, และ drift ของ auth ใน paired-record)

  </Accordion>
  <Accordion title="Workspace และ shell">
    - ตรวจสอบ systemd linger บน Linux
    - ตรวจสอบขนาดไฟล์ bootstrap ของ workspace (คำเตือนการตัดทอน/ใกล้ขีดจำกัดสำหรับไฟล์ context)
    - ตรวจสอบสถานะ shell completion และติดตั้ง/อัปเกรดอัตโนมัติ
    - ตรวจสอบความพร้อมของ provider สำหรับ memory search embedding (model ในเครื่อง, remote API key, หรือ QMD binary)
    - ตรวจสอบ source install (pnpm workspace ไม่ตรงกัน, ไม่มี UI assets, ไม่มี tsx binary)
    - เขียน config ที่อัปเดต + metadata ของ wizard

  </Accordion>
</AccordionGroup>

## Backfill และ reset ของ Dreams UI

ฉาก Dreams ใน Control UI มี action **Backfill**, **Reset**, และ **Clear Grounded** สำหรับ workflow grounded dreaming action เหล่านี้ใช้เมธอด RPC แบบ doctor ของ gateway แต่ **ไม่ใช่** ส่วนหนึ่งของการซ่อมแซม/ย้ายข้อมูลด้วย CLI `openclaw doctor`

สิ่งที่ action เหล่านี้ทำ:

- **Backfill** สแกนไฟล์ประวัติ `memory/YYYY-MM-DD.md` ใน workspace ที่ใช้งานอยู่ เรียกใช้ pass grounded REM diary และเขียนรายการ backfill ที่ย้อนกลับได้ลงใน `DREAMS.md`
- **Reset** ลบเฉพาะรายการ backfill diary ที่ทำเครื่องหมายไว้เหล่านั้นออกจาก `DREAMS.md`
- **Clear Grounded** ลบเฉพาะรายการ short-term แบบ grounded-only ที่ staged แล้วซึ่งมาจาก historical replay และยังไม่ได้สะสม live recall หรือ daily support

สิ่งที่ action เหล่านี้ **ไม่** ทำด้วยตัวเอง:

- ไม่แก้ไข `MEMORY.md`
- ไม่เรียกใช้การย้ายข้อมูล doctor แบบเต็ม
- ไม่ stage grounded candidates เข้าไปใน live short-term promotion store โดยอัตโนมัติ เว้นแต่คุณจะเรียกใช้ staged CLI path ก่อนอย่างชัดเจน

หากต้องการให้ grounded historical replay ส่งผลต่อ lane deep promotion ปกติ ให้ใช้ CLI flow แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

คำสั่งนี้จะ stage grounded durable candidates เข้าไปใน short-term dreaming store โดยยังคงใช้ `DREAMS.md` เป็นพื้นผิวสำหรับตรวจทาน

## พฤติกรรมโดยละเอียดและเหตุผล

<AccordionGroup>
  <Accordion title="0. อัปเดตแบบเลือกได้ (การติดตั้งผ่าน git)">
    หากนี่เป็น git checkout และ doctor กำลังทำงานแบบโต้ตอบ เครื่องมือจะเสนอให้อัปเดต (fetch/rebase/build) ก่อนเรียกใช้ doctor
  </Accordion>
  <Accordion title="1. การปรับ config ให้เป็นมาตรฐาน">
    หาก config มีรูปแบบค่ารุ่นเก่า (เช่น `messages.ackReaction` ที่ไม่มี override เฉพาะ channel) doctor จะปรับค่าเหล่านั้นให้เป็น schema ปัจจุบัน

    รวมถึงฟิลด์แบนรุ่นเก่าของ Talk ด้วย config Talk สาธารณะปัจจุบันคือ `talk.provider` + `talk.providers.<provider>` Doctor จะเขียนรูปแบบเก่า `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ใหม่ลงใน map ของ provider

    Doctor ยังเตือนเมื่อ `plugins.allow` ไม่ว่างและ policy ของ tool ใช้
    wildcard หรือรายการ tool ที่ Plugin เป็นเจ้าของ `tools.allow: ["*"]` จะ match เฉพาะ tool
    จาก Plugin ที่โหลดจริงเท่านั้น; ไม่ได้ข้าม allowlist แบบ exclusive ของ Plugin

  </Accordion>
  <Accordion title="2. การย้าย key config รุ่นเก่า">
    เมื่อ config มี key ที่เลิกใช้แล้ว คำสั่งอื่นจะปฏิเสธการทำงานและขอให้คุณเรียกใช้ `openclaw doctor`

    Doctor จะ:

    - อธิบายว่าพบ key รุ่นเก่าใด
    - แสดงการย้ายข้อมูลที่ใช้
    - เขียน `~/.openclaw/openclaw.json` ใหม่ด้วย schema ที่อัปเดตแล้ว

    Gateway ยังเรียกใช้การย้ายข้อมูลของ doctor อัตโนมัติเมื่อเริ่มต้น หากตรวจพบรูปแบบ config รุ่นเก่า ดังนั้น config ที่ล้าสมัยจะถูกซ่อมแซมโดยไม่ต้องดำเนินการด้วยตนเอง การย้าย store ของ Cron job จะจัดการโดย `openclaw doctor --fix`

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
    - สำหรับช่องที่มี `accounts` แบบมีชื่อ แต่ยังมีค่าช่องระดับบนสุดแบบบัญชีเดียวค้างอยู่ ให้ย้ายค่าที่อยู่ในขอบเขตบัญชีเหล่านั้นไปยังบัญชีที่ถูกยกระดับซึ่งเลือกไว้สำหรับช่องนั้น (`accounts.default` สำหรับช่องส่วนใหญ่; Matrix สามารถคงเป้าหมายแบบมีชื่อ/ค่าเริ่มต้นที่ตรงกันซึ่งมีอยู่แล้วได้)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - ลบ `agents.defaults.llm`; ใช้ `models.providers.<id>.timeoutSeconds` สำหรับเวลาหมดอายุของผู้ให้บริการ/โมเดลที่ช้า
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - ลบ `browser.relayBindHost` (การตั้งค่ารีเลย์ส่วนขยายแบบเดิม)
    - `models.providers.*.api: "openai"` แบบเดิม → `"openai-completions"` (การเริ่มต้น Gateway ยังข้ามผู้ให้บริการที่ตั้งค่า `api` เป็นค่า enum ในอนาคตหรือไม่รู้จัก แทนที่จะล้มเหลวแบบปิด)

    คำเตือนของ doctor ยังรวมคำแนะนำบัญชีเริ่มต้นสำหรับช่องหลายบัญชีด้วย:

    - หากมีการกำหนดค่ารายการ `channels.<channel>.accounts` สองรายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default` doctor จะเตือนว่าการกำหนดเส้นทางสำรองอาจเลือกบัญชีที่ไม่คาดคิด
    - หากตั้งค่า `channels.<channel>.defaultAccount` เป็น ID บัญชีที่ไม่รู้จัก doctor จะเตือนและแสดงรายการ ID บัญชีที่กำหนดค่าไว้

  </Accordion>
  <Accordion title="2b. การแทนที่ผู้ให้บริการ OpenCode">
    หากคุณเพิ่ม `models.providers.opencode`, `opencode-zen` หรือ `opencode-go` ด้วยตนเอง ค่านั้นจะแทนที่แค็ตตาล็อก OpenCode ในตัวจาก `@mariozechner/pi-ai` ซึ่งอาจบังคับให้โมเดลไปใช้ API ที่ผิด หรือทำให้ต้นทุนกลายเป็นศูนย์ Doctor จะเตือนเพื่อให้คุณลบการแทนที่และกู้คืนการกำหนดเส้นทาง API + ต้นทุนแบบรายโมเดลได้
  </Accordion>
  <Accordion title="2c. การย้ายข้อมูลเบราว์เซอร์และความพร้อมของ Chrome MCP">
    หากการกำหนดค่าเบราว์เซอร์ของคุณยังชี้ไปยังพาธส่วนขยาย Chrome ที่ถูกลบไปแล้ว doctor จะปรับให้เป็นโมเดลแนบ Chrome MCP แบบโฮสต์เฉพาะเครื่องปัจจุบัน:

    - `browser.profiles.*.driver: "extension"` จะกลายเป็น `"existing-session"`
    - `browser.relayBindHost` จะถูกลบออก

    Doctor ยังตรวจสอบพาธ Chrome MCP แบบโฮสต์เฉพาะเครื่องเมื่อคุณใช้ `defaultProfile: "user"` หรือโปรไฟล์ `existing-session` ที่กำหนดค่าไว้:

    - ตรวจสอบว่า Google Chrome ติดตั้งอยู่บนโฮสต์เดียวกันสำหรับโปรไฟล์เชื่อมต่ออัตโนมัติค่าเริ่มต้นหรือไม่
    - ตรวจสอบเวอร์ชัน Chrome ที่ตรวจพบ และเตือนเมื่อเวอร์ชันต่ำกว่า Chrome 144
    - เตือนให้คุณเปิดใช้การดีบักระยะไกลในหน้า inspect ของเบราว์เซอร์ (เช่น `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` หรือ `edge://inspect/#remote-debugging`)

    Doctor ไม่สามารถเปิดใช้การตั้งค่าฝั่ง Chrome ให้คุณได้ Chrome MCP แบบโฮสต์เฉพาะเครื่องยังต้องใช้:

    - เบราว์เซอร์ที่ใช้ Chromium 144+ บนโฮสต์ gateway/node
    - เบราว์เซอร์ที่ทำงานอยู่ในเครื่อง
    - เปิดใช้การดีบักระยะไกลในเบราว์เซอร์นั้น
    - อนุมัติพรอมป์ยินยอมการแนบครั้งแรกในเบราว์เซอร์

    ความพร้อมที่นี่เกี่ยวข้องเฉพาะข้อกำหนดเบื้องต้นของการแนบในเครื่องเท่านั้น Existing-session จะคงขีดจำกัดเส้นทาง Chrome MCP ปัจจุบันไว้; เส้นทางขั้นสูงอย่าง `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และการกระทำแบบชุดยังต้องใช้เบราว์เซอร์ที่จัดการหรือโปรไฟล์ CDP ดิบ

    การตรวจสอบนี้ **ไม่** ใช้กับ Docker, sandbox, remote-browser หรือโฟลว์ headless อื่นๆ สิ่งเหล่านั้นยังคงใช้ CDP ดิบต่อไป

  </Accordion>
  <Accordion title="2d. ข้อกำหนดเบื้องต้นของ OAuth TLS">
    เมื่อกำหนดค่าโปรไฟล์ OpenAI Codex OAuth แล้ว doctor จะ probe endpoint การอนุญาตของ OpenAI เพื่อตรวจสอบว่าสแต็ก TLS ของ Node/OpenSSL ในเครื่องสามารถตรวจสอบความถูกต้องของเชนใบรับรองได้ หากการ probe ล้มเหลวด้วยข้อผิดพลาดใบรับรอง (เช่น `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ใบรับรองหมดอายุ หรือใบรับรอง self-signed) doctor จะพิมพ์คำแนะนำการแก้ไขเฉพาะแพลตฟอร์ม บน macOS ที่ใช้ Node จาก Homebrew การแก้ไขมักเป็น `brew postinstall ca-certificates` เมื่อใช้ `--deep` การ probe จะทำงานแม้ว่า gateway จะปกติดี
  </Accordion>
  <Accordion title="2e. การแทนที่ผู้ให้บริการ Codex OAuth">
    หากคุณเคยเพิ่มการตั้งค่าการขนส่ง OpenAI แบบเดิมไว้ใต้ `models.providers.openai-codex` ค่านั้นอาจบดบังเส้นทางผู้ให้บริการ Codex OAuth ในตัวที่รุ่นใหม่กว่าใช้โดยอัตโนมัติ Doctor จะเตือนเมื่อตรวจพบการตั้งค่าการขนส่งเก่าเหล่านั้นร่วมกับ Codex OAuth เพื่อให้คุณลบหรือเขียนการแทนที่การขนส่งที่ล้าสมัยใหม่ และเรียกคืนพฤติกรรมการกำหนดเส้นทาง/สำรองในตัว พร็อกซีแบบกำหนดเองและการแทนที่เฉพาะ header ยังคงรองรับและจะไม่ทำให้เกิดคำเตือนนี้
  </Accordion>
  <Accordion title="2f. คำเตือนเส้นทาง Plugin Codex">
    เมื่อเปิดใช้ Plugin Codex ที่รวมมาให้ doctor จะตรวจสอบด้วยว่า ref โมเดลหลัก `openai-codex/*` ยัง resolve ผ่าน PI runner ค่าเริ่มต้นหรือไม่ ชุดค่านี้ถูกต้องเมื่อคุณต้องการการยืนยันตัวตน Codex OAuth/subscription ผ่าน PI แต่สับสนกับ harness app-server ของ Codex แบบเนทีฟได้ง่าย Doctor จะเตือนและชี้ไปยังรูปแบบ app-server ที่ชัดเจน: `openai/*` พร้อม `agentRuntime.id: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex`

    Doctor ไม่ซ่อมแซมสิ่งนี้โดยอัตโนมัติ เพราะทั้งสองเส้นทางถูกต้อง:

    - `openai-codex/*` + PI หมายถึง "ใช้การยืนยันตัวตน Codex OAuth/subscription ผ่าน runner ปกติของ OpenClaw"
    - `openai/*` + `agentRuntime.id: "codex"` หมายถึง "รัน turn ที่ฝังอยู่ผ่าน app-server ของ Codex แบบเนทีฟ"
    - `/codex ...` หมายถึง "ควบคุมหรือ bind การสนทนา Codex แบบเนทีฟจากแชต"
    - `/acp ...` หรือ `runtime: "acp"` หมายถึง "ใช้อะแดปเตอร์ ACP/acpx ภายนอก"

    หากคำเตือนปรากฏขึ้น ให้เลือกเส้นทางที่คุณตั้งใจและแก้ไข config ด้วยตนเอง คงคำเตือนไว้ตามเดิมเมื่อ PI Codex OAuth เป็นความตั้งใจของคุณ

  </Accordion>
  <Accordion title="3. การย้ายข้อมูลสถานะแบบเดิม (เลย์เอาต์ดิสก์)">
    Doctor สามารถย้ายเลย์เอาต์บนดิสก์รุ่นเก่าเข้าสู่โครงสร้างปัจจุบันได้:

    - ที่เก็บเซสชัน + transcript:
      - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
    - ไดเรกทอรี Agent:
      - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
    - สถานะการยืนยันตัวตน WhatsApp (Baileys):
      - จาก `~/.openclaw/credentials/*.json` แบบเดิม (ยกเว้น `oauth.json`)
      - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID บัญชีเริ่มต้น: `default`)

    การย้ายข้อมูลเหล่านี้เป็นแบบพยายามให้ดีที่สุดและทำซ้ำได้โดยไม่เกิดผลข้างเคียง; doctor จะส่งคำเตือนเมื่อปล่อยโฟลเดอร์เดิมใดๆ ไว้เป็นข้อมูลสำรอง Gateway/CLI ยังย้าย sessions + agent dir แบบเดิมโดยอัตโนมัติเมื่อเริ่มต้น เพื่อให้ประวัติ/auth/models ไปอยู่ในพาธราย agent โดยไม่ต้องรัน doctor ด้วยตนเอง การยืนยันตัวตน WhatsApp ตั้งใจให้ย้ายผ่าน `openclaw doctor` เท่านั้น ตอนนี้การ normalize ผู้ให้บริการ talk/แผนที่ผู้ให้บริการจะเปรียบเทียบด้วยความเท่ากันเชิงโครงสร้าง ดังนั้น diff ที่ต่างกันเฉพาะลำดับคีย์จะไม่ทำให้เกิดการเปลี่ยนแปลง `doctor --fix` แบบ no-op ซ้ำอีก

  </Accordion>
  <Accordion title="3a. การย้ายข้อมูล manifest Plugin แบบเดิม">
    Doctor จะสแกน manifest ของ Plugin ที่ติดตั้งทั้งหมดเพื่อหาคีย์ capability ระดับบนสุดที่เลิกใช้แล้ว (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) เมื่อพบ Doctor จะเสนอให้ย้ายคีย์เหล่านั้นเข้าไปในอ็อบเจกต์ `contracts` และเขียนไฟล์ manifest ใหม่ในตำแหน่งเดิม การย้ายข้อมูลนี้ทำซ้ำได้โดยไม่เกิดผลข้างเคียง; หากคีย์ `contracts` มีค่าเดียวกันอยู่แล้ว คีย์เดิมจะถูกลบออกโดยไม่ทำซ้ำข้อมูล
  </Accordion>
  <Accordion title="3b. การย้ายข้อมูลที่เก็บ Cron แบบเดิม">
    Doctor ยังตรวจสอบที่เก็บงาน cron (`~/.openclaw/cron/jobs.json` เป็นค่าเริ่มต้น หรือ `cron.store` เมื่อแทนที่ค่า) เพื่อหารูปแบบงานเก่าที่ scheduler ยังยอมรับเพื่อความเข้ากันได้

    การล้าง cron ปัจจุบันรวมถึง:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - ฟิลด์ payload ระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
    - ฟิลด์ delivery ระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias delivery ของ payload `provider` → `delivery.channel` ที่ชัดเจน
    - งาน webhook fallback แบบเดิมอย่างง่าย `notify: true` → `delivery.mode="webhook"` ที่ชัดเจนพร้อม `delivery.to=cron.webhook`

    Doctor จะย้ายข้อมูลอัตโนมัติเฉพาะงาน `notify: true` เมื่อทำได้โดยไม่เปลี่ยนพฤติกรรม หากงานผสม legacy notify fallback เข้ากับโหมด delivery ที่ไม่ใช่ webhook ซึ่งมีอยู่แล้ว doctor จะเตือนและปล่อยงานนั้นไว้ให้ตรวจสอบด้วยตนเอง

    บน Linux doctor ยังเตือนเมื่อ crontab ของผู้ใช้ยังเรียกใช้ `~/.openclaw/bin/ensure-whatsapp.sh` แบบเดิม สคริปต์โฮสต์เฉพาะเครื่องนั้นไม่ได้รับการดูแลโดย OpenClaw ปัจจุบัน และอาจเขียนข้อความ `Gateway inactive` ที่ไม่ถูกต้องไปยัง `~/.openclaw/logs/whatsapp-health.log` เมื่อ cron เข้าถึง systemd user bus ไม่ได้ ให้ลบรายการ crontab ที่ล้าสมัยด้วย `crontab -e`; ใช้ `openclaw channels status --probe`, `openclaw doctor` และ `openclaw gateway status` สำหรับการตรวจสุขภาพปัจจุบัน

  </Accordion>
  <Accordion title="3c. การล้างล็อกเซสชัน">
    ตัวตรวจสอบสแกนไดเรกทอรีเซสชันของเอเจนต์ทุกไดเรกทอรีเพื่อหาไฟล์ล็อกการเขียนที่ค้างอยู่ ซึ่งเป็นไฟล์ที่เหลือเมื่อเซสชันออกอย่างผิดปกติ สำหรับไฟล์ล็อกแต่ละไฟล์ที่พบ จะรายงาน: พาธ, PID, PID ยังทำงานอยู่หรือไม่, อายุของล็อก และถือว่าค้างหรือไม่ (PID ตายแล้วหรือเก่ากว่า 30 นาที) ในโหมด `--fix` / `--repair` จะลบไฟล์ล็อกที่ค้างโดยอัตโนมัติ มิฉะนั้นจะพิมพ์หมายเหตุและสั่งให้คุณรันซ้ำพร้อม `--fix`
  </Accordion>
  <Accordion title="3d. การซ่อมกิ่งทรานสคริปต์เซสชัน">
    ตัวตรวจสอบสแกนไฟล์ JSONL ของเซสชันเอเจนต์เพื่อหารูปแบบกิ่งที่ซ้ำกันซึ่งสร้างโดยบั๊กการเขียนทรานสคริปต์พรอมป์ใหม่เมื่อ 2026.4.24: เทิร์นผู้ใช้ที่ถูกละทิ้งพร้อมบริบทรันไทม์ภายในของ OpenClaw และกิ่งพี่น้องที่ยังทำงานอยู่ซึ่งมีพรอมป์ผู้ใช้ที่มองเห็นได้เหมือนกัน ในโหมด `--fix` / `--repair` ตัวตรวจสอบจะสำรองไฟล์ที่ได้รับผลกระทบแต่ละไฟล์ไว้ข้างไฟล์ต้นฉบับ แล้วเขียนทรานสคริปต์ใหม่ให้เป็นกิ่งที่ยังทำงานอยู่ เพื่อให้ประวัติ Gateway และตัวอ่านหน่วยความจำไม่เห็นเทิร์นซ้ำอีกต่อไป
  </Accordion>
  <Accordion title="4. การตรวจสอบความสมบูรณ์ของสถานะ (การคงอยู่ของเซสชัน การกำหนดเส้นทาง และความปลอดภัย)">
    ไดเรกทอรีสถานะคือแกนปฏิบัติการหลัก หากหายไป คุณจะสูญเสียเซสชัน ข้อมูลรับรอง บันทึก และการกำหนดค่า (เว้นแต่คุณมีข้อมูลสำรองที่อื่น)

    ตัวตรวจสอบตรวจสอบ:

    - **ไดเรกทอรีสถานะหายไป**: เตือนเกี่ยวกับการสูญเสียสถานะอย่างร้ายแรง ถามเพื่อสร้างไดเรกทอรีใหม่ และเตือนว่ามันกู้ข้อมูลที่หายไปไม่ได้
    - **สิทธิ์ไดเรกทอรีสถานะ**: ตรวจสอบว่าสามารถเขียนได้ เสนอให้ซ่อมสิทธิ์ (และแสดงคำแนะนำ `chown` เมื่อตรวจพบว่าเจ้าของ/กลุ่มไม่ตรงกัน)
    - **ไดเรกทอรีสถานะที่ซิงก์กับคลาวด์บน macOS**: เตือนเมื่อสถานะชี้ไปใต้ iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ `~/Library/CloudStorage/...` เพราะพาธที่มีการซิงก์รองรับอาจทำให้ I/O ช้าลงและเกิดการแข่งกันของล็อก/การซิงก์
    - **ไดเรกทอรีสถานะบน SD หรือ eMMC ของ Linux**: เตือนเมื่อสถานะชี้ไปยังแหล่งเมานต์ `mmcblk*` เพราะ I/O แบบสุ่มที่รองรับด้วย SD หรือ eMMC อาจช้ากว่าและสึกหรอเร็วขึ้นภายใต้การเขียนเซสชันและข้อมูลรับรอง
    - **ไดเรกทอรีเซสชันหายไป**: ต้องมี `sessions/` และไดเรกทอรีที่เก็บเซสชันเพื่อคงประวัติไว้และหลีกเลี่ยงการแครช `ENOENT`
    - **ทรานสคริปต์ไม่ตรงกัน**: เตือนเมื่อรายการเซสชันล่าสุดไม่มีไฟล์ทรานสคริปต์
    - **เซสชันหลัก "JSONL 1 บรรทัด"**: แจ้งเมื่อทรานสคริปต์หลักมีเพียงบรรทัดเดียว (ประวัติไม่ได้สะสมเพิ่ม)
    - **มีไดเรกทอรีสถานะหลายแห่ง**: เตือนเมื่อมีโฟลเดอร์ `~/.openclaw` หลายโฟลเดอร์ในไดเรกทอรีบ้านต่าง ๆ หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (ประวัติอาจถูกแยกระหว่างการติดตั้ง)
    - **ตัวเตือนโหมดรีโมต**: หาก `gateway.mode=remote` ตัวตรวจสอบจะเตือนให้คุณรันบนโฮสต์รีโมต (สถานะอยู่ที่นั่น)
    - **สิทธิ์ไฟล์กำหนดค่า**: เตือนหาก `~/.openclaw/openclaw.json` อ่านได้โดยกลุ่ม/ทุกคน และเสนอให้ปรับให้เข้มงวดเป็น `600`

  </Accordion>
  <Accordion title="5. สุขภาพการยืนยันตัวตนโมเดล (การหมดอายุของ OAuth)">
    ตัวตรวจสอบตรวจดูโปรไฟล์ OAuth ในที่เก็บการยืนยันตัวตน เตือนเมื่อโทเค็นกำลังจะหมดอายุ/หมดอายุแล้ว และสามารถรีเฟรชได้เมื่อปลอดภัย หากโปรไฟล์ OAuth/โทเค็นของ Anthropic เก่าเกินไป จะแนะนำคีย์ API ของ Anthropic หรือพาธ setup-token ของ Anthropic พรอมป์รีเฟรชจะแสดงเฉพาะเมื่อรันแบบโต้ตอบ (TTY); `--non-interactive` จะข้ามความพยายามรีเฟรช

    เมื่อการรีเฟรช OAuth ล้มเหลวถาวร (เช่น `refresh_token_reused`, `invalid_grant` หรือผู้ให้บริการบอกให้คุณเข้าสู่ระบบอีกครั้ง) ตัวตรวจสอบจะรายงานว่าต้องยืนยันตัวตนใหม่และพิมพ์คำสั่ง `openclaw models auth login --provider ...` ที่ต้องรันอย่างชัดเจน

    ตัวตรวจสอบยังรายงานโปรไฟล์การยืนยันตัวตนที่ใช้ไม่ได้ชั่วคราวเนื่องจาก:

    - คูลดาวน์สั้น ๆ (การจำกัดอัตรา/หมดเวลา/การยืนยันตัวตนล้มเหลว)
    - การปิดใช้งานที่นานขึ้น (การเรียกเก็บเงิน/เครดิตล้มเหลว)

  </Accordion>
  <Accordion title="6. การตรวจสอบโมเดลฮุก">
    หากตั้งค่า `hooks.gmail.model` ไว้ ตัวตรวจสอบจะตรวจสอบการอ้างอิงโมเดลกับแคตตาล็อกและรายการอนุญาต แล้วเตือนเมื่อไม่สามารถแก้ไขได้หรือไม่ได้รับอนุญาต
  </Accordion>
  <Accordion title="7. การซ่อมอิมเมจ Sandbox">
    เมื่อเปิดใช้ Sandbox ตัวตรวจสอบจะตรวจสอบอิมเมจ Docker และเสนอให้สร้างหรือสลับไปใช้ชื่อเดิมหากอิมเมจปัจจุบันหายไป
  </Accordion>
  <Accordion title="7b. การล้างการติดตั้ง Plugin">
    ตัวตรวจสอบลบสถานะ staging ของ dependency ของ Plugin ที่ OpenClaw สร้างไว้แบบเดิมในโหมด `openclaw doctor --fix` / `openclaw doctor --repair` ซึ่งครอบคลุมราก dependency ที่สร้างไว้เก่า ไดเรกทอรี install-stage เก่า และเศษไฟล์เฉพาะแพ็กเกจจากโค้ดซ่อม dependency ของ bundled-plugin รุ่นก่อนหน้า

    ตัวตรวจสอบยังสามารถติดตั้ง Plugin ที่ดาวน์โหลดได้ซึ่งกำหนดค่าไว้ใหม่ เมื่อการกำหนดค่าอ้างอิงถึง Plugin เหล่านั้นแต่รีจิสทรี Plugin ในเครื่องหาไม่พบ การเริ่มต้น Gateway และการโหลดการกำหนดค่าใหม่จะไม่รันตัวจัดการแพ็กเกจ การติดตั้ง Plugin ยังคงเป็นงาน doctor/install/update ที่ต้องทำอย่างชัดเจน

  </Accordion>
  <Accordion title="8. การย้ายข้อมูลบริการ Gateway และคำแนะนำการล้าง">
    ตัวตรวจสอบตรวจพบบริการ Gateway แบบเดิม (launchd/systemd/schtasks) และเสนอให้ลบออกแล้วติดตั้งบริการ OpenClaw โดยใช้พอร์ต Gateway ปัจจุบัน นอกจากนี้ยังสามารถสแกนหาบริการลักษณะคล้าย Gateway เพิ่มเติมและพิมพ์คำแนะนำการล้างได้ บริการ OpenClaw Gateway ที่ตั้งชื่อตามโปรไฟล์ถือเป็นบริการชั้นหนึ่งและจะไม่ถูกแจ้งว่าเป็น "ส่วนเกิน"

    บน Linux หากบริการ Gateway ระดับผู้ใช้หายไปแต่มีบริการ OpenClaw Gateway ระดับระบบอยู่ ตัวตรวจสอบจะไม่ติดตั้งบริการระดับผู้ใช้ตัวที่สองโดยอัตโนมัติ ตรวจสอบด้วย `openclaw gateway status --deep` หรือ `openclaw doctor --deep` จากนั้นลบรายการซ้ำ หรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ supervisor ระดับระบบเป็นเจ้าของวงจรชีวิต Gateway

  </Accordion>
  <Accordion title="8b. การย้ายข้อมูล Matrix ตอนเริ่มต้น">
    เมื่อบัญชีช่องทาง Matrix มีการย้ายข้อมูลสถานะเดิมที่ค้างอยู่หรือดำเนินการได้ ตัวตรวจสอบ (ในโหมด `--fix` / `--repair`) จะสร้างสแนปช็อตก่อนการย้ายข้อมูล แล้วรันขั้นตอนการย้ายข้อมูลแบบดีที่สุดเท่าที่ทำได้: การย้ายข้อมูลสถานะ Matrix แบบเดิม และการเตรียมสถานะเข้ารหัสแบบเดิม ทั้งสองขั้นตอนไม่เป็นอันตรายถึงขั้นหยุดระบบ ข้อผิดพลาดจะถูกบันทึกและการเริ่มต้นจะดำเนินต่อไป ในโหมดอ่านอย่างเดียว (`openclaw doctor` โดยไม่มี `--fix`) การตรวจสอบนี้จะถูกข้ามทั้งหมด
  </Accordion>
  <Accordion title="8c. การจับคู่อุปกรณ์และการเบี่ยงเบนของการยืนยันตัวตน">
    ตอนนี้ตัวตรวจสอบตรวจดูสถานะการจับคู่อุปกรณ์เป็นส่วนหนึ่งของการตรวจสุขภาพปกติ

    สิ่งที่รายงาน:

    - คำขอจับคู่ครั้งแรกที่รอดำเนินการ
    - การอัปเกรดบทบาทที่รอดำเนินการสำหรับอุปกรณ์ที่จับคู่แล้ว
    - การอัปเกรดขอบเขตที่รอดำเนินการสำหรับอุปกรณ์ที่จับคู่แล้ว
    - การซ่อมกรณีคีย์สาธารณะไม่ตรงกันเมื่อรหัสอุปกรณ์ยังตรงกันแต่ตัวตนอุปกรณ์ไม่ตรงกับระเบียนที่อนุมัติแล้ว
    - ระเบียนที่จับคู่แล้วซึ่งไม่มีโทเค็นที่ใช้งานอยู่สำหรับบทบาทที่อนุมัติ
    - โทเค็นที่จับคู่แล้วซึ่งขอบเขตเบี่ยงเบนออกนอกบรรทัดฐานการจับคู่ที่อนุมัติ
    - รายการโทเค็นอุปกรณ์ที่แคชในเครื่องสำหรับเครื่องปัจจุบัน ซึ่งเก่ากว่าการหมุนโทเค็นฝั่ง Gateway หรือมีเมทาดาทาขอบเขตที่เก่า

    ตัวตรวจสอบไม่อนุมัติคำขอจับคู่โดยอัตโนมัติหรือหมุนโทเค็นอุปกรณ์โดยอัตโนมัติ แต่จะพิมพ์ขั้นตอนถัดไปที่ชัดเจนแทน:

    - ตรวจสอบคำขอที่รอดำเนินการด้วย `openclaw devices list`
    - อนุมัติคำขอที่ระบุด้วย `openclaw devices approve <requestId>`
    - หมุนโทเค็นใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
    - ลบและอนุมัติระเบียนเก่าอีกครั้งด้วย `openclaw devices remove <deviceId>`

    สิ่งนี้ปิดช่องโหว่ทั่วไป "จับคู่แล้วแต่ยังถูกขอให้จับคู่" ได้ ตอนนี้ตัวตรวจสอบแยกแยะการจับคู่ครั้งแรกออกจากการอัปเกรดบทบาท/ขอบเขตที่รอดำเนินการ และจากการเบี่ยงเบนของโทเค็น/ตัวตนอุปกรณ์ที่เก่าได้แล้ว

  </Accordion>
  <Accordion title="9. คำเตือนด้านความปลอดภัย">
    ตัวตรวจสอบแสดงคำเตือนเมื่อผู้ให้บริการเปิดให้ DM โดยไม่มีรายการอนุญาต หรือเมื่อนโยบายถูกกำหนดค่าในลักษณะที่อันตราย
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    หากรันเป็นบริการผู้ใช้ systemd ตัวตรวจสอบจะตรวจให้แน่ใจว่าเปิดใช้ lingering เพื่อให้ Gateway ยังทำงานหลังออกจากระบบ
  </Accordion>
  <Accordion title="11. สถานะเวิร์กสเปซ (Skills, Plugin และไดเรกทอรีเดิม)">
    ตัวตรวจสอบพิมพ์สรุปสถานะเวิร์กสเปซสำหรับเอเจนต์เริ่มต้น:

    - **สถานะ Skills**: นับ Skills ที่เข้าเกณฑ์ ขาดข้อกำหนด และถูกบล็อกโดยรายการอนุญาต
    - **ไดเรกทอรีเวิร์กสเปซเดิม**: เตือนเมื่อมี `~/openclaw` หรือไดเรกทอรีเวิร์กสเปซเดิมอื่นอยู่คู่กับเวิร์กสเปซปัจจุบัน
    - **สถานะ Plugin**: นับ Plugin ที่เปิดใช้/ปิดใช้/เกิดข้อผิดพลาด แสดงรายการ ID ของ Plugin สำหรับข้อผิดพลาดใด ๆ และรายงานความสามารถของ Plugin ในบันเดิล
    - **คำเตือนความเข้ากันได้ของ Plugin**: แจ้ง Plugin ที่มีปัญหาความเข้ากันได้กับรันไทม์ปัจจุบัน
    - **การวินิจฉัย Plugin**: แสดงคำเตือนหรือข้อผิดพลาดขณะโหลดใด ๆ ที่รีจิสทรี Plugin ปล่อยออกมา

  </Accordion>
  <Accordion title="11b. ขนาดไฟล์บูตสแตรป">
    ตัวตรวจสอบตรวจว่าไฟล์บูตสแตรปของเวิร์กสเปซ (เช่น `AGENTS.md`, `CLAUDE.md` หรือไฟล์บริบทอื่นที่ฉีดเข้าไป) ใกล้หรือเกินงบอักขระที่กำหนดไว้หรือไม่ โดยรายงานจำนวนอักขระดิบเทียบกับที่ฉีดต่อไฟล์ เปอร์เซ็นต์การตัดทอน สาเหตุการตัดทอน (`max/file` หรือ `max/total`) และจำนวนอักขระที่ฉีดทั้งหมดเป็นสัดส่วนของงบทั้งหมด เมื่อไฟล์ถูกตัดทอนหรือใกล้ถึงขีดจำกัด ตัวตรวจสอบจะพิมพ์เคล็ดลับสำหรับปรับ `agents.defaults.bootstrapMaxChars` และ `agents.defaults.bootstrapTotalMaxChars`
  </Accordion>
  <Accordion title="11d. การล้าง Plugin ช่องทางที่เก่า">
    เมื่อ `openclaw doctor --fix` ลบ Plugin ช่องทางที่หายไป จะลบการกำหนดค่าที่อยู่ในขอบเขตช่องทางซึ่งค้างอยู่และอ้างอิงถึง Plugin นั้นด้วย ได้แก่ รายการ `channels.<id>`, เป้าหมาย Heartbeat ที่ตั้งชื่อช่องทาง และการแทนที่ `agents.*.models["<channel>/*"]` สิ่งนี้ป้องกันลูปการบูต Gateway เมื่อรันไทม์ช่องทางหายไปแต่การกำหนดค่ายังขอให้ Gateway ผูกกับช่องทางนั้น
  </Accordion>
  <Accordion title="11c. การเติมคำสั่ง Shell อัตโนมัติ">
    ตัวตรวจสอบตรวจว่าติดตั้งการเติมคำสั่งด้วยแท็บสำหรับ Shell ปัจจุบันแล้วหรือไม่ (zsh, bash, fish หรือ PowerShell):

    - หากโปรไฟล์ Shell ใช้รูปแบบการเติมคำสั่งแบบไดนามิกที่ช้า (`source <(openclaw completion ...)`) ตัวตรวจสอบจะอัปเกรดเป็นรูปแบบไฟล์แคชที่เร็วกว่า
    - หากกำหนดค่าการเติมคำสั่งไว้ในโปรไฟล์แต่ไฟล์แคชหายไป ตัวตรวจสอบจะสร้างแคชใหม่โดยอัตโนมัติ
    - หากไม่ได้กำหนดค่าการเติมคำสั่งเลย ตัวตรวจสอบจะถามให้ติดตั้ง (เฉพาะโหมดโต้ตอบ; ข้ามเมื่อใช้ `--non-interactive`)

    รัน `openclaw completion --write-state` เพื่อสร้างแคชใหม่ด้วยตนเอง

  </Accordion>
  <Accordion title="12. การตรวจสอบการยืนยันตัวตน Gateway (โทเค็นภายในเครื่อง)">
    ตัวตรวจสอบตรวจความพร้อมของการยืนยันตัวตนด้วยโทเค็น Gateway ภายในเครื่อง

    - หากโหมดโทเค็นต้องใช้โทเค็นและไม่มีแหล่งโทเค็น ตัวตรวจสอบจะเสนอให้สร้างให้
    - หาก `gateway.auth.token` จัดการด้วย SecretRef แต่ใช้ไม่ได้ ตัวตรวจสอบจะเตือนและไม่เขียนทับด้วยข้อความธรรมดา
    - `openclaw doctor --generate-gateway-token` บังคับสร้างเฉพาะเมื่อไม่ได้กำหนดค่า SecretRef ของโทเค็นไว้

  </Accordion>
  <Accordion title="12b. การซ่อมแบบอ่านอย่างเดียวที่รับรู้ SecretRef">
    โฟลว์การซ่อมบางอย่างต้องตรวจสอบข้อมูลรับรองที่กำหนดค่าไว้โดยไม่ทำให้พฤติกรรม fail-fast ของรันไทม์อ่อนลง

    - ตอนนี้ `openclaw doctor --fix` ใช้โมเดลสรุป SecretRef แบบอ่านอย่างเดียวเดียวกับคำสั่งตระกูลสถานะสำหรับการซ่อมการกำหนดค่าแบบเจาะจง
    - ตัวอย่าง: การซ่อม Telegram `allowFrom` / `groupAllowFrom` `@username` จะพยายามใช้ข้อมูลรับรองบ็อตที่กำหนดค่าไว้เมื่อมี
    - หากโทเค็นบ็อต Telegram ถูกกำหนดค่าผ่าน SecretRef แต่ใช้ไม่ได้ในพาธคำสั่งปัจจุบัน ตัวตรวจสอบจะรายงานว่าข้อมูลรับรองถูกกำหนดค่าแล้วแต่ใช้ไม่ได้ และข้ามการแก้ไขอัตโนมัติแทนการแครชหรือรายงานผิดว่าโทเค็นหายไป

  </Accordion>
  <Accordion title="13. การตรวจสุขภาพ Gateway + การรีสตาร์ต">
    ตัวตรวจสอบรันการตรวจสุขภาพและเสนอให้รีสตาร์ต Gateway เมื่อดูเหมือนว่าไม่ปกติ
  </Accordion>
  <Accordion title="13b. ความพร้อมของการค้นหาหน่วยความจำ">
    ตัวตรวจสอบตรวจว่าผู้ให้บริการ embedding สำหรับการค้นหาหน่วยความจำที่กำหนดค่าไว้พร้อมสำหรับเอเจนต์เริ่มต้นหรือไม่ พฤติกรรมขึ้นอยู่กับแบ็กเอนด์และผู้ให้บริการที่กำหนดค่าไว้:

    - **แบ็กเอนด์ QMD**: ตรวจสอบว่าไบนารี `qmd` พร้อมใช้งานและเริ่มทำงานได้หรือไม่ หากไม่ได้ จะพิมพ์คำแนะนำการแก้ไข รวมถึงแพ็กเกจ npm และตัวเลือกพาธไบนารีแบบกำหนดเอง
    - **ผู้ให้บริการภายในที่ระบุชัดเจน**: ตรวจสอบไฟล์โมเดลภายในเครื่องหรือ URL โมเดลระยะไกล/ที่ดาวน์โหลดได้ซึ่งรู้จัก หากไม่พบ จะแนะนำให้สลับไปใช้ผู้ให้บริการระยะไกล
    - **ผู้ให้บริการระยะไกลที่ระบุชัดเจน** (`openai`, `voyage` เป็นต้น): ตรวจสอบว่ามีคีย์ API อยู่ในสภาพแวดล้อมหรือที่เก็บการยืนยันตัวตน พิมพ์คำแนะนำการแก้ไขที่นำไปทำได้หากไม่พบ
    - **ผู้ให้บริการอัตโนมัติ**: ตรวจสอบความพร้อมใช้งานของโมเดลภายในเครื่องก่อน จากนั้นลองผู้ให้บริการระยะไกลแต่ละรายตามลำดับการเลือกอัตโนมัติ

    เมื่อมีผลการตรวจสอบ Gateway จากแคชพร้อมใช้งาน (Gateway อยู่ในสถานะปกติขณะตรวจสอบ) doctor จะอ้างอิงผลนั้นเทียบกับการกำหนดค่าที่ CLI มองเห็นและระบุความคลาดเคลื่อนใด ๆ Doctor จะไม่เริ่ม ping embedding ใหม่ในพาธเริ่มต้น ให้ใช้คำสั่งสถานะหน่วยความจำแบบลึกเมื่อคุณต้องการตรวจสอบผู้ให้บริการแบบสด

    ใช้ `openclaw memory status --deep` เพื่อตรวจสอบความพร้อมของ embedding ขณะรันไทม์

  </Accordion>
  <Accordion title="14. คำเตือนสถานะแชนเนล">
    หาก Gateway อยู่ในสถานะปกติ doctor จะเรียกใช้การตรวจสอบสถานะแชนเนลและรายงานคำเตือนพร้อมคำแนะนำการแก้ไข
  </Accordion>
  <Accordion title="15. การตรวจสอบ + ซ่อมแซมการกำหนดค่า supervisor">
    Doctor ตรวจสอบการกำหนดค่า supervisor ที่ติดตั้งไว้ (launchd/systemd/schtasks) เพื่อหาค่าเริ่มต้นที่ขาดหายหรือล้าสมัย (เช่น dependencies ของ systemd network-online และหน่วงเวลาการรีสตาร์ต) เมื่อพบความไม่ตรงกัน จะแนะนำให้อัปเดตและสามารถเขียนไฟล์ service/task ใหม่ให้เป็นค่าเริ่มต้นปัจจุบันได้

    หมายเหตุ:

    - `openclaw doctor` จะแจ้งถามก่อนเขียนการกำหนดค่า supervisor ใหม่
    - `openclaw doctor --yes` ยอมรับพรอมป์การซ่อมแซมเริ่มต้น
    - `openclaw doctor --repair` ใช้การแก้ไขที่แนะนำโดยไม่แจ้งถาม
    - `openclaw doctor --repair --force` เขียนทับการกำหนดค่า supervisor ที่ปรับแต่งเอง
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` ทำให้ doctor เป็นแบบอ่านอย่างเดียวสำหรับวงจรชีวิต service ของ Gateway โดยยังรายงานสุขภาพ service และเรียกใช้การซ่อมแซมที่ไม่ใช่ service แต่ข้ามการติดตั้ง/เริ่ม/รีสตาร์ต/bootstrap service การเขียนการกำหนดค่า supervisor ใหม่ และการล้าง service รุ่นเก่า เพราะ supervisor ภายนอกเป็นเจ้าของวงจรชีวิตนั้น
    - บน Linux doctor จะไม่เขียน metadata ของ command/entrypoint ใหม่ขณะที่ systemd gateway unit ที่ตรงกันยัง active อยู่ และยังละเว้น gateway-like units เพิ่มเติมที่ inactive และไม่ใช่รุ่นเก่าระหว่างการสแกน service ซ้ำ เพื่อไม่ให้ไฟล์ service ที่ทำงานร่วมกันสร้างเสียงรบกวนในการล้างข้อมูล
    - หาก token auth ต้องใช้ token และ `gateway.auth.token` จัดการด้วย SecretRef การติดตั้ง/ซ่อมแซม service ของ doctor จะตรวจสอบ SecretRef แต่จะไม่คงค่า token plaintext ที่ resolve แล้วลงใน metadata สภาพแวดล้อมของ supervisor service
    - Doctor ตรวจพบค่า environment ของ service ที่จัดการด้วย `.env`/SecretRef ซึ่งการติดตั้ง LaunchAgent, systemd หรือ Windows Scheduled Task รุ่นเก่าฝังไว้แบบ inline และเขียน metadata ของ service ใหม่เพื่อให้ค่าเหล่านั้นโหลดจากแหล่งรันไทม์แทนที่จะมาจากนิยาม supervisor
    - Doctor ตรวจพบเมื่อคำสั่ง service ยังตรึง `--port` เก่าไว้หลังจาก `gateway.port` เปลี่ยน และเขียน metadata ของ service ใหม่ให้ใช้พอร์ตปัจจุบัน
    - หาก token auth ต้องใช้ token และ SecretRef ของ token ที่กำหนดค่าไว้ยัง resolve ไม่ได้ doctor จะบล็อกพาธการติดตั้ง/ซ่อมแซมพร้อมคำแนะนำที่นำไปทำได้
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้งค่า mode อย่างชัดเจน
    - สำหรับ Linux user-systemd units ตอนนี้การตรวจสอบ token drift ของ doctor รวมทั้งแหล่ง `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบ metadata การยืนยันตัวตนของ service
    - การซ่อมแซม service ของ Doctor จะปฏิเสธการเขียนใหม่ หยุด หรือรีสตาร์ต service ของ Gateway จากไบนารี OpenClaw รุ่นเก่าเมื่อการกำหนดค่าถูกเขียนล่าสุดโดยเวอร์ชันที่ใหม่กว่า ดู [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)
    - คุณสามารถบังคับให้เขียนใหม่ทั้งหมดได้เสมอผ่าน `openclaw gateway install --force`

  </Accordion>
  <Accordion title="16. การวินิจฉัยรันไทม์ + พอร์ตของ Gateway">
    Doctor ตรวจสอบรันไทม์ของ service (PID, สถานะออกล่าสุด) และเตือนเมื่อ service ติดตั้งแล้วแต่ไม่ได้รันจริง นอกจากนี้ยังตรวจสอบการชนกันของพอร์ตบนพอร์ต Gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (Gateway รันอยู่แล้ว, SSH tunnel)
  </Accordion>
  <Accordion title="17. แนวปฏิบัติที่ดีของรันไทม์ Gateway">
    Doctor เตือนเมื่อ service ของ Gateway รันบน Bun หรือพาธ Node ที่จัดการด้วยเวอร์ชัน (`nvm`, `fnm`, `volta`, `asdf` เป็นต้น) แชนเนล WhatsApp + Telegram ต้องใช้ Node และพาธของ version-manager อาจพังหลังอัปเกรด เพราะ service ไม่ได้โหลด shell init ของคุณ Doctor เสนอให้ย้ายไปใช้การติดตั้ง Node ของระบบเมื่อพร้อมใช้งาน (Homebrew/apt/choco)

    service ที่ติดตั้งหรือซ่อมแซมใหม่จะเก็บ environment roots ที่ระบุชัดเจน (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) และไดเรกทอรี user-bin ที่เสถียร แต่ไดเรกทอรี fallback ของ version-manager ที่คาดเดาจะถูกเขียนลงใน PATH ของ service เฉพาะเมื่อไดเรกทอรีเหล่านั้นมีอยู่บนดิสก์เท่านั้น ซึ่งทำให้ PATH ของ supervisor ที่สร้างขึ้นสอดคล้องกับการตรวจสอบ minimal-PATH เดียวกันที่ doctor เรียกใช้ภายหลัง

  </Accordion>
  <Accordion title="18. การเขียนการกำหนดค่า + metadata ของ wizard">
    Doctor คงการเปลี่ยนแปลงการกำหนดค่าใด ๆ และประทับ metadata ของ wizard เพื่อบันทึกการรัน doctor
  </Accordion>
  <Accordion title="19. เคล็ดลับ workspace (การสำรองข้อมูล + ระบบหน่วยความจำ)">
    Doctor แนะนำระบบหน่วยความจำของ workspace เมื่อไม่มี และพิมพ์เคล็ดลับการสำรองข้อมูลหาก workspace ยังไม่ได้อยู่ภายใต้ git

    ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคู่มือฉบับเต็มเกี่ยวกับโครงสร้าง workspace และการสำรองข้อมูลด้วย git (แนะนำ GitHub หรือ GitLab แบบ private)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
