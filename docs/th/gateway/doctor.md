---
read_when:
    - การเพิ่มหรือแก้ไข doctor migrations
    - การนำการเปลี่ยนแปลงการกำหนดค่าที่ไม่เข้ากันแบบย้อนหลังมาใช้
sidebarTitle: Doctor
summary: 'คำสั่ง Doctor: การตรวจสอบสถานะ, การย้ายข้อมูลการกำหนดค่า, และขั้นตอนการซ่อมแซม'
title: ตรวจสุขภาพ
x-i18n:
    generated_at: "2026-04-30T16:29:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89150fe2b2848f1f168b42ca6b240bc0e6a0edee4f1bcad7f79d297face9c95e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` คือเครื่องมือซ่อมแซม + ย้ายข้อมูลสำหรับ OpenClaw เครื่องมือนี้แก้ไขการกำหนดค่า/สถานะที่ค้างเก่า ตรวจสุขภาพ และให้ขั้นตอนการซ่อมแซมที่นำไปปฏิบัติได้

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw doctor
```

### โหมดแบบไม่มีส่วนติดต่อผู้ใช้และระบบอัตโนมัติ

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    ยอมรับค่าเริ่มต้นโดยไม่ถาม (รวมถึงขั้นตอนซ่อมแซมการรีสตาร์ท/บริการ/แซนด์บ็อกซ์เมื่อเกี่ยวข้อง)

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    ใช้การซ่อมแซมที่แนะนำโดยไม่ถาม (การซ่อมแซม + การรีสตาร์ทเมื่อปลอดภัย)

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    ใช้การซ่อมแซมเชิงรุกด้วย (เขียนทับการกำหนดค่าตัวกำกับบริการแบบกำหนดเอง)

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    รันโดยไม่มีพรอมต์และใช้เฉพาะการย้ายข้อมูลที่ปลอดภัย (การปรับการกำหนดค่าให้เป็นรูปแบบปกติ + การย้ายสถานะบนดิสก์) ข้ามการดำเนินการรีสตาร์ท/บริการ/แซนด์บ็อกซ์ที่ต้องให้มนุษย์ยืนยัน การย้ายสถานะเดิมจะรันโดยอัตโนมัติเมื่อตรวจพบ

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    สแกนบริการระบบเพื่อหาการติดตั้ง Gateway เพิ่มเติม (launchd/systemd/schtasks)

  </Tab>
</Tabs>

หากต้องการตรวจทานการเปลี่ยนแปลงก่อนเขียน ให้เปิดไฟล์การกำหนดค่าก่อน:

```bash
cat ~/.openclaw/openclaw.json
```

## สิ่งที่เครื่องมือนี้ทำ (สรุป)

<AccordionGroup>
  <Accordion title="สุขภาพ, ส่วนติดต่อผู้ใช้ และการอัปเดต">
    - การอัปเดตก่อนเริ่มแบบเลือกได้สำหรับการติดตั้งจาก git (เฉพาะแบบโต้ตอบ)
    - การตรวจสอบว่าโปรโตคอลส่วนติดต่อผู้ใช้เป็นปัจจุบัน (สร้างส่วนติดต่อผู้ใช้ควบคุมใหม่เมื่อสคีมาโปรโตคอลใหม่กว่า)
    - การตรวจสุขภาพ + พรอมต์ให้รีสตาร์ท
    - สรุปสถานะ Skills (มีสิทธิ์/ขาดหาย/ถูกบล็อก) และสถานะ Plugin

  </Accordion>
  <Accordion title="การกำหนดค่าและการย้ายข้อมูล">
    - การปรับการกำหนดค่าให้เป็นรูปแบบปกติสำหรับค่าเดิม
    - การย้ายข้อมูลการกำหนดค่า Talk จากฟิลด์ `talk.*` แบบแบนเดิมไปเป็น `talk.provider` + `talk.providers.<provider>`
    - การตรวจสอบการย้ายข้อมูลของเบราว์เซอร์สำหรับการกำหนดค่าส่วนขยาย Chrome แบบเดิมและความพร้อมของ Chrome MCP
    - คำเตือนการแทนที่ผู้ให้บริการ OpenCode (`models.providers.opencode` / `models.providers.opencode-go`)
    - คำเตือนการบดบัง OAuth ของ Codex (`models.providers.openai-codex`)
    - การตรวจสอบข้อกำหนดเบื้องต้นของ OAuth TLS สำหรับโปรไฟล์ OpenAI Codex OAuth
    - การย้ายสถานะบนดิสก์เดิม (เซสชัน/ไดเรกทอรีเอเจนต์/การยืนยันตัวตน WhatsApp)
    - การย้ายคีย์สัญญาในรายการกำกับของ Plugin แบบเดิม (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`)
    - การย้ายที่เก็บ Cron เดิม (`jobId`, `schedule.cron`, ฟิลด์ delivery/payload ระดับบน, payload `provider`, งานสำรอง Webhook แบบง่ายที่มี `notify: true`)
    - การย้ายนโยบายรันไทม์ของเอเจนต์เดิมไปยัง `agents.defaults.agentRuntime` และ `agents.list[].agentRuntime`
    - การล้างการกำหนดค่า Plugin ที่ค้างเก่าเมื่อเปิดใช้ Plugin; เมื่อ `plugins.enabled=false` การอ้างอิง Plugin ที่ค้างเก่าจะถือเป็นการกำหนดค่าการกักกันที่ไม่มีผลและจะถูกเก็บไว้

  </Accordion>
  <Accordion title="สถานะและความถูกต้องสมบูรณ์">
    - การตรวจสอบไฟล์ล็อกของเซสชันและการล้างล็อกที่ค้างเก่า
    - การซ่อมแซมบันทึกการสนทนาของเซสชันสำหรับแขนงการเขียนพรอมต์ใหม่ที่ซ้ำกันซึ่งสร้างโดยบิลด์ 2026.4.24 ที่ได้รับผลกระทบ
    - การตรวจจับเครื่องหมายสถานะสิ้นสุดสำหรับการกู้คืนหลังรีสตาร์ทของเอเจนต์ย่อยที่ติดค้าง พร้อมรองรับ `--fix` สำหรับล้างแฟล็กการกู้คืนที่ถูกยกเลิกและค้างเก่า เพื่อไม่ให้การเริ่มต้นยังคงมองเอเจนต์ลูกว่าเป็นกรณีถูกยกเลิกจากการรีสตาร์ท
    - การตรวจสอบความถูกต้องสมบูรณ์และสิทธิ์ของสถานะ (เซสชัน, บันทึกการสนทนา, ไดเรกทอรีสถานะ)
    - การตรวจสอบสิทธิ์ไฟล์การกำหนดค่า (chmod 600) เมื่อรันในเครื่อง
    - สุขภาพการยืนยันตัวตนของโมเดล: ตรวจการหมดอายุของ OAuth, สามารถต่ออายุโทเค็นที่ใกล้หมดอายุ และรายงานสถานะพักใช้/ปิดใช้งานของโปรไฟล์การยืนยันตัวตน
    - การตรวจหาไดเรกทอรีพื้นที่ทำงานเพิ่มเติม (`~/openclaw`)

  </Accordion>
  <Accordion title="Gateway, บริการ และตัวกำกับบริการ">
    - การซ่อมแซมอิมเมจแซนด์บ็อกซ์เมื่อเปิดใช้การทำงานแบบแซนด์บ็อกซ์
    - การย้ายข้อมูลบริการเดิมและการตรวจหา Gateway เพิ่มเติม
    - การย้ายสถานะเดิมของช่องทาง Matrix (ในโหมด `--fix` / `--repair`)
    - การตรวจสอบรันไทม์ของ Gateway (ติดตั้งบริการแล้วแต่ไม่ได้รัน; ป้ายกำกับ launchd ที่แคชไว้)
    - คำเตือนสถานะช่องทาง (ตรวจสอบจาก Gateway ที่กำลังรัน)
    - การตรวจสอบการกำหนดค่าตัวกำกับบริการ (launchd/systemd/schtasks) พร้อมการซ่อมแซมแบบเลือกได้
    - การล้างสภาพแวดล้อมพร็อกซีที่ฝังอยู่สำหรับบริการ Gateway ที่จับค่า shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` ระหว่างการติดตั้งหรืออัปเดต
    - การตรวจสอบแนวทางปฏิบัติที่ดีที่สุดของรันไทม์ Gateway (Node เทียบกับ Bun, พาธของตัวจัดการเวอร์ชัน)
    - การวินิจฉัยการชนกันของพอร์ต Gateway (ค่าเริ่มต้น `18789`)

  </Accordion>
  <Accordion title="การยืนยันตัวตน, ความปลอดภัย และการจับคู่">
    - คำเตือนด้านความปลอดภัยสำหรับนโยบาย DM แบบเปิด
    - การตรวจสอบการยืนยันตัวตนของ Gateway สำหรับโหมดโทเค็นในเครื่อง (เสนอการสร้างโทเค็นเมื่อไม่มีแหล่งโทเค็นอยู่; ไม่เขียนทับการกำหนดค่า SecretRef ของโทเค็น)
    - การตรวจหาปัญหาการจับคู่อุปกรณ์ (คำขอจับคู่ครั้งแรกที่ค้างอยู่, การอัปเกรดบทบาท/ขอบเขตที่ค้างอยู่, ความคลาดเคลื่อนของแคชโทเค็นอุปกรณ์ในเครื่องที่ค้างเก่า และความคลาดเคลื่อนของการยืนยันตัวตนในระเบียนที่จับคู่แล้ว)

  </Accordion>
  <Accordion title="พื้นที่ทำงานและเชลล์">
    - การตรวจสอบ systemd linger บน Linux
    - การตรวจสอบขนาดไฟล์เริ่มต้นพื้นที่ทำงาน (คำเตือนการถูกตัดทอน/ใกล้ถึงขีดจำกัดสำหรับไฟล์บริบท)
    - การตรวจสอบสถานะการเติมคำสั่งในเชลล์และการติดตั้ง/อัปเกรดอัตโนมัติ
    - การตรวจสอบความพร้อมของผู้ให้บริการการฝังเวกเตอร์สำหรับการค้นหาหน่วยความจำ (โมเดลในเครื่อง, คีย์ API ระยะไกล หรือไบนารี QMD)
    - การตรวจสอบการติดตั้งจากซอร์ส (พื้นที่ทำงาน pnpm ไม่ตรงกัน, ขาดทรัพยากรของส่วนติดต่อผู้ใช้, ขาดไบนารี tsx)
    - เขียนการกำหนดค่าที่อัปเดตแล้ว + ข้อมูลเมทาของตัวช่วยตั้งค่า

  </Accordion>
</AccordionGroup>

## การเติมย้อนหลังและรีเซ็ตในส่วนติดต่อผู้ใช้ความฝัน

ฉากความฝันในส่วนติดต่อผู้ใช้ควบคุมมีการดำเนินการ **เติมย้อนหลัง**, **รีเซ็ต** และ **ล้างรายการมีหลักฐานรองรับ** สำหรับเวิร์กโฟลว์ Dreaming แบบมีหลักฐานรองรับ การดำเนินการเหล่านี้ใช้เมธอด RPC แบบเดียวกับเครื่องมือซ่อมแซมของ Gateway แต่ **ไม่ใช่** ส่วนหนึ่งของการซ่อมแซม/ย้ายข้อมูลของ CLI `openclaw doctor`

สิ่งที่การดำเนินการเหล่านี้ทำ:

- **เติมย้อนหลัง** สแกนไฟล์ `memory/YYYY-MM-DD.md` ย้อนหลังในพื้นที่ทำงานที่ใช้งานอยู่ รันขั้นตอนไดอารี REM แบบมีหลักฐานรองรับ และเขียนรายการเติมย้อนหลังที่ย้อนกลับได้ลงใน `DREAMS.md`
- **รีเซ็ต** ลบเฉพาะรายการไดอารีเติมย้อนหลังที่มีเครื่องหมายเหล่านั้นออกจาก `DREAMS.md`
- **ล้างรายการมีหลักฐานรองรับ** ลบเฉพาะรายการระยะสั้นแบบเฉพาะมีหลักฐานรองรับที่ถูกจัดเตรียมไว้ ซึ่งมาจากการเล่นซ้ำประวัติย้อนหลังและยังไม่ได้สะสมการเรียกคืนสดหรือการสนับสนุนรายวัน

สิ่งที่การดำเนินการเหล่านี้ **ไม่** ทำด้วยตัวเอง:

- ไม่แก้ไข `MEMORY.md`
- ไม่รันการย้ายข้อมูลของเครื่องมือซ่อมแซมแบบเต็ม
- ไม่จัดเตรียมรายการที่มีสิทธิ์แบบมีหลักฐานรองรับเข้าสู่ที่เก็บการเลื่อนขั้นระยะสั้นแบบสดโดยอัตโนมัติ เว้นแต่คุณจะรันเส้นทาง CLI แบบจัดเตรียมไว้อย่างชัดเจนก่อน

หากต้องการให้การเล่นซ้ำประวัติย้อนหลังแบบมีหลักฐานรองรับส่งผลต่อเส้นทางการเลื่อนขั้นเชิงลึกตามปกติ ให้ใช้ขั้นตอน CLI แทน:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

คำสั่งนั้นจะจัดเตรียมรายการถาวรที่มีสิทธิ์แบบมีหลักฐานรองรับเข้าสู่ที่เก็บ Dreaming ระยะสั้น พร้อมคง `DREAMS.md` ไว้เป็นพื้นที่ตรวจทาน

## พฤติกรรมโดยละเอียดและเหตุผล

<AccordionGroup>
  <Accordion title="0. การอัปเดตแบบเลือกได้ (การติดตั้งจาก git)">
    หากนี่เป็นสำเนาจาก git และเครื่องมือนี้กำลังรันแบบโต้ตอบ เครื่องมือจะเสนอให้อัปเดต (fetch/rebase/build) ก่อนรัน
  </Accordion>
  <Accordion title="1. การปรับการกำหนดค่าให้เป็นรูปแบบปกติ">
    หากการกำหนดค่ามีรูปแบบค่าดั้งเดิม (เช่น `messages.ackReaction` โดยไม่มีการแทนที่เฉพาะช่องทาง) เครื่องมือนี้จะปรับให้อยู่ในสคีมาปัจจุบัน

    ซึ่งรวมถึงฟิลด์แบนของ Talk แบบเดิม การกำหนดค่า Talk สาธารณะปัจจุบันคือ `talk.provider` + `talk.providers.<provider>` เครื่องมือนี้เขียนรูปแบบเก่า `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ใหม่เข้าสู่แผนที่ผู้ให้บริการ

  </Accordion>
  <Accordion title="2. การย้ายคีย์การกำหนดค่าเดิม">
    เมื่อการกำหนดค่ามีคีย์ที่เลิกใช้แล้ว คำสั่งอื่นจะปฏิเสธการรันและขอให้คุณรัน `openclaw doctor`

    เครื่องมือนี้จะ:

    - อธิบายว่าพบคีย์เดิมใดบ้าง
    - แสดงการย้ายข้อมูลที่ใช้
    - เขียน `~/.openclaw/openclaw.json` ใหม่ด้วยสคีมาที่อัปเดตแล้ว

    Gateway ยังรันการย้ายข้อมูลของเครื่องมือนี้โดยอัตโนมัติเมื่อเริ่มต้น หากตรวจพบรูปแบบการกำหนดค่าเดิม เพื่อให้การกำหนดค่าที่ค้างเก่าถูกซ่อมแซมโดยไม่ต้องดำเนินการเอง การย้ายข้อมูลที่เก็บงาน Cron จัดการโดย `openclaw doctor --fix`

    การย้ายข้อมูลปัจจุบัน:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` ระดับบน
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
    - สำหรับช่องทางที่มี `accounts` แบบมีชื่อแต่ยังมีค่าช่องทางระดับบนแบบบัญชีเดียวหลงเหลืออยู่ ให้ย้ายค่าที่อยู่ในขอบเขตบัญชีเหล่านั้นไปยังบัญชีที่ถูกเลื่อนขึ้นซึ่งเลือกไว้สำหรับช่องทางนั้น (`accounts.default` สำหรับช่องทางส่วนใหญ่; Matrix สามารถเก็บเป้าหมายแบบมีชื่อ/ค่าเริ่มต้นที่ตรงกันซึ่งมีอยู่แล้วได้)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - ลบ `agents.defaults.llm`; ใช้ `models.providers.<id>.timeoutSeconds` สำหรับค่าหมดเวลาของผู้ให้บริการ/โมเดลที่ช้า
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - ลบ `browser.relayBindHost` (การตั้งค่ารีเลย์ของส่วนขยายเดิม)
    - `models.providers.*.api: "openai"` แบบเดิม → `"openai-completions"` (การเริ่มต้น Gateway ยังข้ามผู้ให้บริการที่ `api` ถูกตั้งเป็นค่า enum ในอนาคตหรือไม่รู้จัก แทนที่จะล้มเหลวแบบปิดกั้น)

    คำเตือนของเครื่องมือนี้ยังมีคำแนะนำเรื่องค่าเริ่มต้นของบัญชีสำหรับช่องทางแบบหลายบัญชี:

    - หากมีการกำหนดค่ารายการ `channels.<channel>.accounts` ตั้งแต่สองรายการขึ้นไปโดยไม่มี `channels.<channel>.defaultAccount` หรือ `accounts.default` doctor จะเตือนว่าการกำหนดเส้นทาง fallback อาจเลือกบัญชีที่ไม่คาดคิด
    - หากตั้งค่า `channels.<channel>.defaultAccount` เป็น ID บัญชีที่ไม่รู้จัก doctor จะเตือนและแสดงรายการ ID บัญชีที่กำหนดค่าไว้

  </Accordion>
  <Accordion title="2b. การ override ผู้ให้บริการ OpenCode">
    หากคุณเพิ่ม `models.providers.opencode`, `opencode-zen` หรือ `opencode-go` ด้วยตนเอง รายการเหล่านี้จะ override แค็ตตาล็อก OpenCode ในตัวจาก `@mariozechner/pi-ai` ซึ่งอาจบังคับให้โมเดลไปใช้ API ที่ผิดหรือทำให้ต้นทุนกลายเป็นศูนย์ Doctor จะเตือนเพื่อให้คุณลบ override และกู้คืนการกำหนดเส้นทาง API + ต้นทุนรายโมเดลได้
  </Accordion>
  <Accordion title="2c. การย้าย Browser และความพร้อมของ Chrome MCP">
    หากคอนฟิก Browser ของคุณยังชี้ไปยังเส้นทาง Chrome extension ที่ถูกนำออกแล้ว doctor จะปรับให้เป็นโมเดลแนบ Chrome MCP แบบ host-local ปัจจุบัน:

    - `browser.profiles.*.driver: "extension"` จะกลายเป็น `"existing-session"`
    - `browser.relayBindHost` จะถูกนำออก

    Doctor ยังตรวจสอบเส้นทาง Chrome MCP แบบ host-local เมื่อคุณใช้ `defaultProfile: "user"` หรือโปรไฟล์ `existing-session` ที่กำหนดค่าไว้:

    - ตรวจสอบว่าติดตั้ง Google Chrome บนโฮสต์เดียวกันสำหรับโปรไฟล์ auto-connect เริ่มต้นหรือไม่
    - ตรวจสอบเวอร์ชัน Chrome ที่ตรวจพบและเตือนเมื่อเวอร์ชันต่ำกว่า Chrome 144
    - เตือนให้คุณเปิดใช้ remote debugging ในหน้า inspect ของ Browser (เช่น `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` หรือ `edge://inspect/#remote-debugging`)

    Doctor ไม่สามารถเปิดใช้การตั้งค่าฝั่ง Chrome ให้คุณได้ Chrome MCP แบบ host-local ยังต้องมี:

    - Browser ที่ใช้ Chromium 144+ บนโฮสต์ gateway/node
    - Browser ทำงานอยู่ในเครื่อง
    - เปิดใช้ remote debugging ใน Browser นั้นแล้ว
    - อนุมัติพรอมป์ยินยอมการแนบครั้งแรกใน Browser

    ความพร้อมในที่นี้เกี่ยวข้องกับข้อกำหนดเบื้องต้นของการแนบในเครื่องเท่านั้น Existing-session ยังคงใช้ขีดจำกัดเส้นทาง Chrome MCP ปัจจุบัน เส้นทางขั้นสูงอย่าง `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด และการทำงานแบบ batch ยังต้องใช้ Browser ที่จัดการให้หรือโปรไฟล์ raw CDP

    การตรวจนี้ **ไม่** ใช้กับ Docker, sandbox, remote-browser หรือโฟลว์ headless อื่นๆ โฟลว์เหล่านั้นยังคงใช้ raw CDP ต่อไป

  </Accordion>
  <Accordion title="2d. ข้อกำหนดเบื้องต้นของ OAuth TLS">
    เมื่อกำหนดค่าโปรไฟล์ OpenAI Codex OAuth แล้ว doctor จะ probe endpoint การอนุญาตของ OpenAI เพื่อตรวจสอบว่าสแตก TLS ของ Node/OpenSSL ในเครื่องสามารถตรวจสอบความถูกต้องของ certificate chain ได้ หากการ probe ล้มเหลวด้วยข้อผิดพลาดใบรับรอง (เช่น `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, ใบรับรองหมดอายุ หรือใบรับรอง self-signed) doctor จะแสดงคำแนะนำการแก้ไขเฉพาะแพลตฟอร์ม บน macOS ที่ใช้ Homebrew Node การแก้มักเป็น `brew postinstall ca-certificates` เมื่อใช้ `--deep` การ probe จะทำงานแม้ว่า Gateway จะแข็งแรงอยู่ก็ตาม
  </Accordion>
  <Accordion title="2e. การ override ผู้ให้บริการ Codex OAuth">
    หากก่อนหน้านี้คุณเพิ่มการตั้งค่า transport เดิมของ OpenAI ไว้ใต้ `models.providers.openai-codex` การตั้งค่าเหล่านั้นอาจบดบังเส้นทางผู้ให้บริการ Codex OAuth ในตัวที่รุ่นใหม่กว่าใช้อัตโนมัติ Doctor จะเตือนเมื่อเห็นการตั้งค่า transport เก่าเหล่านั้นควบคู่กับ Codex OAuth เพื่อให้คุณลบหรือเขียน override transport ที่ค้างอยู่ใหม่ และได้พฤติกรรมการกำหนดเส้นทาง/fallback ในตัวกลับมา พร็อกซีแบบกำหนดเองและ override เฉพาะ header ยังรองรับอยู่และจะไม่ทำให้เกิดคำเตือนนี้
  </Accordion>
  <Accordion title="2f. คำเตือนเส้นทาง Plugin Codex">
    เมื่อเปิดใช้ Plugin Codex ที่ bundled มา doctor จะตรวจด้วยว่า ref โมเดลหลัก `openai-codex/*` ยัง resolve ผ่าน PI runner เริ่มต้นหรือไม่ การผสมนี้ใช้ได้เมื่อคุณต้องการ auth แบบ Codex OAuth/subscription ผ่าน PI แต่สับสนกับ native Codex app-server harness ได้ง่าย Doctor จะเตือนและชี้ไปยังรูปแบบ app-server ที่ชัดเจน: `openai/*` พร้อม `agentRuntime.id: "codex"` หรือ `OPENCLAW_AGENT_RUNTIME=codex`

    Doctor ไม่ซ่อมแซมสิ่งนี้โดยอัตโนมัติ เพราะทั้งสองเส้นทางถูกต้อง:

    - `openai-codex/*` + PI หมายถึง "ใช้ auth แบบ Codex OAuth/subscription ผ่าน OpenClaw runner ปกติ"
    - `openai/*` + `runtime: "codex"` หมายถึง "รันเทิร์นที่ฝังไว้ผ่าน native Codex app-server"
    - `/codex ...` หมายถึง "ควบคุมหรือ bind การสนทนา native Codex จากแชท"
    - `/acp ...` หรือ `runtime: "acp"` หมายถึง "ใช้อะแดปเตอร์ ACP/acpx ภายนอก"

    หากคำเตือนปรากฏ ให้เลือกเส้นทางที่คุณตั้งใจใช้และแก้ไขคอนฟิกด้วยตนเอง คงคำเตือนไว้ตามเดิมเมื่อ PI Codex OAuth เป็นความตั้งใจ

  </Accordion>
  <Accordion title="3. การย้าย state เดิม (layout บนดิสก์)">
    Doctor สามารถย้าย layout บนดิสก์แบบเก่าเข้าสู่โครงสร้างปัจจุบันได้:

    - ที่เก็บ Sessions + transcripts:
      - จาก `~/.openclaw/sessions/` ไปยัง `~/.openclaw/agents/<agentId>/sessions/`
    - ไดเรกทอรี Agent:
      - จาก `~/.openclaw/agent/` ไปยัง `~/.openclaw/agents/<agentId>/agent/`
    - state การ auth ของ WhatsApp (Baileys):
      - จาก `~/.openclaw/credentials/*.json` แบบเดิม (ยกเว้น `oauth.json`)
      - ไปยัง `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID บัญชีเริ่มต้น: `default`)

    การย้ายเหล่านี้เป็นแบบ best-effort และทำซ้ำได้โดยไม่เปลี่ยนผลลัพธ์; doctor จะส่งคำเตือนเมื่อปล่อยโฟลเดอร์เดิมบางส่วนไว้เป็นข้อมูลสำรอง Gateway/CLI ยังย้าย sessions เดิม + ไดเรกทอรี agent โดยอัตโนมัติเมื่อเริ่มทำงาน เพื่อให้ประวัติ/auth/models ไปอยู่ในเส้นทางราย agent โดยไม่ต้องรัน doctor ด้วยตนเอง การ auth ของ WhatsApp ตั้งใจให้ย้ายผ่าน `openclaw doctor` เท่านั้น ตอนนี้การปรับ provider/provider-map ของ Talk ให้เป็นรูปแบบปกติเปรียบเทียบด้วยความเท่ากันของโครงสร้าง ดังนั้น diff ที่ต่างกันเฉพาะลำดับ key จะไม่ทำให้เกิดการเปลี่ยนแปลง `doctor --fix` แบบ no-op ซ้ำอีก

  </Accordion>
  <Accordion title="3a. การย้าย manifest ของ Plugin เดิม">
    Doctor สแกน manifest ของ Plugin ที่ติดตั้งทั้งหมดเพื่อหาคีย์ capability ระดับบนสุดที่เลิกใช้แล้ว (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) เมื่อพบแล้ว จะเสนอให้ย้ายคีย์เหล่านั้นเข้าไปในอ็อบเจกต์ `contracts` และเขียนไฟล์ manifest ใหม่ในที่เดิม การย้ายนี้ทำซ้ำได้โดยไม่เปลี่ยนผลลัพธ์; หากคีย์ `contracts` มีค่าเดียวกันอยู่แล้ว คีย์เดิมจะถูกนำออกโดยไม่ทำซ้ำข้อมูล
  </Accordion>
  <Accordion title="3b. การย้าย store ของ Cron เดิม">
    Doctor ยังตรวจที่เก็บ job ของ Cron (`~/.openclaw/cron/jobs.json` โดยค่าเริ่มต้น หรือ `cron.store` เมื่อ override) เพื่อหารูปทรง job แบบเก่าที่ scheduler ยังยอมรับเพื่อความเข้ากันได้

    การล้าง Cron ปัจจุบันรวมถึง:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - ฟิลด์ payload ระดับบนสุด (`message`, `model`, `thinking`, ...) → `payload`
    - ฟิลด์ delivery ระดับบนสุด (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias การ delivery ของ payload `provider` → `delivery.channel` ที่ชัดเจน
    - job fallback แบบ webhook เดิมอย่างง่าย `notify: true` → `delivery.mode="webhook"` ที่ชัดเจนพร้อม `delivery.to=cron.webhook`

    Doctor จะ auto-migrate job `notify: true` เฉพาะเมื่อทำได้โดยไม่เปลี่ยนพฤติกรรม หาก job รวม fallback notify แบบเดิมเข้ากับโหมด delivery ที่ไม่ใช่ webhook ที่มีอยู่ doctor จะเตือนและปล่อย job นั้นไว้ให้ตรวจทานด้วยตนเอง

  </Accordion>
  <Accordion title="3c. การล้าง lock ของ Session">
    Doctor สแกนไดเรกทอรี session ของ agent ทุกตัวเพื่อหาไฟล์ write-lock ที่ค้างอยู่ — ไฟล์ที่เหลืออยู่เมื่อ session ออกอย่างผิดปกติ สำหรับไฟล์ lock แต่ละไฟล์ที่พบ จะรายงาน: เส้นทาง, PID, ว่า PID ยังทำงานอยู่หรือไม่, อายุของ lock และถือว่าค้างหรือไม่ (PID ตายแล้วหรือเก่ากว่า 30 นาที) ในโหมด `--fix` / `--repair` จะนำไฟล์ lock ที่ค้างออกโดยอัตโนมัติ; มิฉะนั้นจะแสดงหมายเหตุและบอกให้คุณรันซ้ำด้วย `--fix`
  </Accordion>
  <Accordion title="3d. การซ่อมแซม branch ของ transcript Session">
    Doctor สแกนไฟล์ JSONL ของ session agent เพื่อหารูปทรง branch ที่ซ้ำกันซึ่งสร้างโดยบั๊กการเขียน transcript prompt ใหม่เมื่อ 2026.4.24: user turn ที่ถูกทิ้งไว้พร้อม context runtime ภายในของ OpenClaw และ sibling ที่ active ซึ่งมี prompt ผู้ใช้ที่มองเห็นเหมือนกัน ในโหมด `--fix` / `--repair` doctor จะสำรองไฟล์ที่ได้รับผลกระทบแต่ละไฟล์ไว้ข้างไฟล์ต้นฉบับ และเขียน transcript ใหม่เป็น branch ที่ active เพื่อให้ประวัติ Gateway และตัวอ่านหน่วยความจำไม่เห็น turn ซ้ำอีก
  </Accordion>
  <Accordion title="4. การตรวจความสมบูรณ์ของ state (การคงอยู่ของ session, การกำหนดเส้นทาง และความปลอดภัย)">
    ไดเรกทอรี state คือแกนปฏิบัติการ หากหายไป คุณจะสูญเสีย sessions, credentials, logs และ config (เว้นแต่คุณมีข้อมูลสำรองอยู่ที่อื่น)

    Doctor ตรวจสอบ:

    - **ไม่มีไดเรกทอรี state**: เตือนเกี่ยวกับการสูญเสีย state อย่างรุนแรง แจ้งให้สร้างไดเรกทอรีใหม่ และเตือนว่าไม่สามารถกู้คืนข้อมูลที่หายไปได้
    - **สิทธิ์ของไดเรกทอรี state**: ตรวจสอบว่าสามารถเขียนได้; เสนอให้ซ่อมแซมสิทธิ์ (และแสดง hint `chown` เมื่อตรวจพบ owner/group ไม่ตรงกัน)
    - **ไดเรกทอรี state ที่ sync กับ cloud บน macOS**: เตือนเมื่อ state resolve อยู่ใต้ iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) หรือ `~/Library/CloudStorage/...` เพราะเส้นทางที่มีการ sync รองรับอาจทำให้ I/O ช้าลงและเกิด race ของ lock/sync
    - **ไดเรกทอรี state บน SD หรือ eMMC ของ Linux**: เตือนเมื่อ state resolve ไปยังแหล่ง mount แบบ `mmcblk*` เพราะ random I/O ที่พึ่งพา SD หรือ eMMC อาจช้ากว่าและสึกหรอเร็วกว่าเมื่อมีการเขียน session และ credential
    - **ไม่มีไดเรกทอรี Session**: ต้องมี `sessions/` และไดเรกทอรีที่เก็บ session เพื่อคงประวัติและหลีกเลี่ยง crash แบบ `ENOENT`
    - **Transcript ไม่ตรงกัน**: เตือนเมื่อรายการ session ล่าสุดมีไฟล์ transcript หายไป
    - **Main session "1-line JSONL"**: flag เมื่อ transcript หลักมีเพียงบรรทัดเดียว (ประวัติไม่ได้สะสม)
    - **มีไดเรกทอรี state หลายแห่ง**: เตือนเมื่อมีโฟลเดอร์ `~/.openclaw` หลายแห่งอยู่ตาม home directory ต่างๆ หรือเมื่อ `OPENCLAW_STATE_DIR` ชี้ไปที่อื่น (ประวัติอาจแยกระหว่างการติดตั้ง)
    - **คำเตือนโหมด remote**: หาก `gateway.mode=remote` doctor จะเตือนให้คุณรันบนโฮสต์ remote (state อยู่ที่นั่น)
    - **สิทธิ์ของไฟล์คอนฟิก**: เตือนหาก `~/.openclaw/openclaw.json` อ่านได้โดย group/world และเสนอให้ปรับให้แน่นขึ้นเป็น `600`

  </Accordion>
  <Accordion title="5. สุขภาพการ auth ของโมเดล (OAuth หมดอายุ)">
    Doctor ตรวจสอบโปรไฟล์ OAuth ใน auth store เตือนเมื่อ token ใกล้หมดอายุ/หมดอายุแล้ว และสามารถ refresh เมื่อปลอดภัย หากโปรไฟล์ OAuth/token ของ Anthropic ค้างอยู่ จะเสนอให้ใช้ Anthropic API key หรือเส้นทาง setup-token ของ Anthropic พรอมป์ refresh จะปรากฏเฉพาะเมื่อรันแบบ interactive (TTY); `--non-interactive` จะข้ามความพยายาม refresh

    เมื่อการ refresh OAuth ล้มเหลวถาวร (เช่น `refresh_token_reused`, `invalid_grant` หรือผู้ให้บริการบอกให้คุณ sign in อีกครั้ง) doctor จะรายงานว่าจำเป็นต้อง re-auth และแสดงคำสั่ง `openclaw models auth login --provider ...` ที่ต้องรันแบบตรงตัว

    Doctor ยังรายงานโปรไฟล์ auth ที่ใช้งานไม่ได้ชั่วคราวเนื่องจาก:

    - cooldown สั้นๆ (rate limits/timeouts/auth failures)
    - การ disable ที่ยาวกว่า (billing/credit failures)

  </Accordion>
  <Accordion title="6. การตรวจสอบความถูกต้องของโมเดล hooks">
    หากตั้งค่า `hooks.gmail.model` ไว้ doctor จะตรวจสอบการอ้างอิงโมเดลกับแค็ตตาล็อกและรายการที่อนุญาต และเตือนเมื่อไม่สามารถ resolve ได้หรือไม่ได้รับอนุญาต
  </Accordion>
  <Accordion title="7. การซ่อมแซมอิมเมจ sandbox">
    เมื่อเปิดใช้ sandboxing doctor จะตรวจสอบอิมเมจ Docker และเสนอให้ build หรือสลับไปใช้ชื่อแบบเดิมหากอิมเมจปัจจุบันหายไป
  </Accordion>
  <Accordion title="7b. runtime deps ของ Plugin ที่ bundled">
    Doctor ตรวจสอบ runtime dependencies เฉพาะสำหรับ bundled plugins ที่ active อยู่ในการกำหนดค่าปัจจุบันหรือเปิดใช้งานโดยค่าเริ่มต้นของ bundled manifest เช่น `plugins.entries.discord.enabled: true`, legacy `channels.discord.enabled: true`, `models.providers.*` ที่กำหนดค่าไว้ / การอ้างอิงโมเดลของ agent หรือ bundled plugin ที่เปิดใช้โดยค่าเริ่มต้นซึ่งไม่มี provider ownership หากมีรายการใดหายไป doctor จะรายงานแพ็กเกจเหล่านั้นและติดตั้งในโหมด `openclaw doctor --fix` / `openclaw doctor --repair` ส่วน external plugins ยังคงใช้ `openclaw plugins install` / `openclaw plugins update`; doctor จะไม่ติดตั้ง dependencies สำหรับ path ของ plugin ใดๆ ตามอำเภอใจ

    ระหว่างการซ่อมแซมของ doctor การติดตั้ง npm สำหรับ bundled runtime-dependency จะรายงานความคืบหน้าด้วย spinner ในเซสชัน TTY และรายงานความคืบหน้าเป็นบรรทัดเป็นระยะในเอาต์พุตแบบ piped/headless นอกจากนี้ Gateway และ local CLI ยังสามารถซ่อมแซม runtime dependencies ของ bundled plugin ที่ active ได้ตามต้องการก่อนนำเข้า bundled plugin การติดตั้งเหล่านี้ถูกจำกัดขอบเขตไว้ที่ plugin runtime install root, รันโดยปิด scripts, ไม่เขียน package lock และมี install-root lock ป้องกันไว้ เพื่อไม่ให้การเริ่ม CLI หรือ Gateway พร้อมกันแก้ไข tree `node_modules` เดียวกันในเวลาเดียวกัน

  </Accordion>
  <Accordion title="8. การ migrate Gateway service และคำแนะนำการ cleanup">
    Doctor ตรวจพบ gateway services แบบ legacy (launchd/systemd/schtasks) และเสนอให้ลบออกและติดตั้ง OpenClaw service โดยใช้ gateway port ปัจจุบัน นอกจากนี้ยังสามารถสแกนหา service อื่นที่มีลักษณะคล้าย gateway และพิมพ์คำแนะนำการ cleanup ได้ OpenClaw gateway services ที่ตั้งชื่อตาม profile ถือเป็น first-class และจะไม่ถูกระบุว่าเป็น "extra"

    บน Linux หาก user-level gateway service หายไป แต่มี system-level OpenClaw gateway service อยู่ doctor จะไม่ติดตั้ง user-level service ตัวที่สองโดยอัตโนมัติ ให้ตรวจสอบด้วย `openclaw gateway status --deep` หรือ `openclaw doctor --deep` จากนั้นลบรายการซ้ำ หรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ system supervisor เป็นผู้จัดการ lifecycle ของ gateway

  </Accordion>
  <Accordion title="8b. การ migrate Startup Matrix">
    เมื่อบัญชีช่องทาง Matrix มีการ migrate สถานะ legacy ที่ค้างอยู่หรือดำเนินการได้ doctor (ในโหมด `--fix` / `--repair`) จะสร้าง snapshot ก่อน migrate แล้วรันขั้นตอน migrate แบบ best-effort: การ migrate สถานะ Matrix แบบ legacy และการเตรียม encrypted-state แบบ legacy ทั้งสองขั้นตอนไม่ทำให้ล้มเหลวร้ายแรง; ข้อผิดพลาดจะถูกบันทึกและ startup จะดำเนินต่อ ในโหมด read-only (`openclaw doctor` ที่ไม่มี `--fix`) การตรวจสอบนี้จะถูกข้ามทั้งหมด
  </Accordion>
  <Accordion title="8c. การจับคู่อุปกรณ์และ auth drift">
    ตอนนี้ Doctor ตรวจสอบสถานะ device-pairing เป็นส่วนหนึ่งของ health pass ปกติ

    สิ่งที่รายงาน:

    - คำขอ pairing ครั้งแรกที่ค้างอยู่
    - การอัปเกรด role ที่ค้างอยู่สำหรับอุปกรณ์ที่ paired แล้ว
    - การอัปเกรด scope ที่ค้างอยู่สำหรับอุปกรณ์ที่ paired แล้ว
    - การซ่อมแซม public-key mismatch เมื่อ device id ยังตรงกันแต่ device identity ไม่ตรงกับ record ที่อนุมัติแล้วอีกต่อไป
    - record ที่ paired แล้วซึ่งไม่มี active token สำหรับ role ที่อนุมัติแล้ว
    - token ที่ paired แล้วซึ่ง scope drift ออกนอก pairing baseline ที่อนุมัติ
    - รายการ device-token ที่ cache ไว้ในเครื่อง local สำหรับเครื่องปัจจุบัน ซึ่งเก่ากว่า token rotation ฝั่ง gateway หรือมี stale scope metadata

    Doctor จะไม่ auto-approve คำขอ pair หรือ auto-rotate device tokens แต่จะพิมพ์ขั้นตอนถัดไปที่ชัดเจนแทน:

    - ตรวจสอบคำขอที่ค้างอยู่ด้วย `openclaw devices list`
    - อนุมัติคำขอที่ตรงกันด้วย `openclaw devices approve <requestId>`
    - rotate token ใหม่ด้วย `openclaw devices rotate --device <deviceId> --role <role>`
    - ลบและอนุมัติ record ที่ stale อีกครั้งด้วย `openclaw devices remove <deviceId>`

    สิ่งนี้ปิดช่องโหว่ทั่วไปแบบ "paired แล้วแต่ยังเจอ pairing required": ตอนนี้ doctor แยกความแตกต่างระหว่าง pairing ครั้งแรก, การอัปเกรด role/scope ที่ค้างอยู่ และ stale token/device-identity drift

  </Accordion>
  <Accordion title="9. คำเตือนด้านความปลอดภัย">
    Doctor จะแสดงคำเตือนเมื่อ provider เปิดรับ DM โดยไม่มี allowlist หรือเมื่อนโยบายถูกกำหนดค่าในลักษณะที่อันตราย
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    หากรันเป็น systemd user service doctor จะตรวจให้แน่ใจว่าเปิดใช้ lingering เพื่อให้ gateway ยังคงทำงานหลัง logout
  </Accordion>
  <Accordion title="11. สถานะ workspace (Skills, plugins และ dirs แบบ legacy)">
    Doctor พิมพ์สรุปสถานะ workspace สำหรับ agent เริ่มต้น:

    - **สถานะ Skills**: นับ skills ที่ eligible, missing-requirements และ allowlist-blocked
    - **dirs ของ workspace แบบ legacy**: เตือนเมื่อมี `~/openclaw` หรือไดเรกทอรี workspace แบบ legacy อื่นอยู่ร่วมกับ workspace ปัจจุบัน
    - **สถานะ Plugin**: นับ plugins ที่ enabled/disabled/errored; แสดง plugin IDs สำหรับข้อผิดพลาดใดๆ; รายงานความสามารถของ bundle plugin
    - **คำเตือนความเข้ากันได้ของ Plugin**: ระบุ plugins ที่มีปัญหาความเข้ากันได้กับ runtime ปัจจุบัน
    - **การวินิจฉัย Plugin**: แสดงคำเตือนหรือข้อผิดพลาดขณะ load ที่ plugin registry ส่งออกมา

  </Accordion>
  <Accordion title="11b. ขนาดไฟล์ bootstrap">
    Doctor ตรวจสอบว่า workspace bootstrap files (เช่น `AGENTS.md`, `CLAUDE.md` หรือ injected context files อื่นๆ) อยู่ใกล้หรือเกิน character budget ที่กำหนดไว้หรือไม่ โดยรายงานจำนวนอักขระ raw เทียบกับ injected แยกตามไฟล์, เปอร์เซ็นต์การ truncate, สาเหตุการ truncate (`max/file` หรือ `max/total`) และจำนวนอักขระ injected รวมเป็นสัดส่วนของ budget ทั้งหมด เมื่อไฟล์ถูก truncate หรือใกล้ถึง limit doctor จะพิมพ์เคล็ดลับสำหรับปรับ `agents.defaults.bootstrapMaxChars` และ `agents.defaults.bootstrapTotalMaxChars`
  </Accordion>
  <Accordion title="11d. การ cleanup stale channel plugin">
    เมื่อ `openclaw doctor --fix` ลบ channel plugin ที่หายไป ระบบจะลบ config dangling ที่อยู่ในขอบเขต channel ซึ่งอ้างอิง plugin นั้นด้วย: รายการ `channels.<id>`, heartbeat targets ที่ระบุชื่อ channel และ overrides `agents.*.models["<channel>/*"]` สิ่งนี้ป้องกัน Gateway boot loops ที่ channel runtime หายไปแล้วแต่ config ยังขอให้ gateway bind เข้ากับมัน
  </Accordion>
  <Accordion title="11c. shell completion">
    Doctor ตรวจสอบว่าติดตั้ง tab completion สำหรับ shell ปัจจุบันแล้วหรือไม่ (zsh, bash, fish หรือ PowerShell):

    - หาก shell profile ใช้รูปแบบ dynamic completion ที่ช้า (`source <(openclaw completion ...)`) doctor จะอัปเกรดเป็น variant แบบ cached file ที่เร็วกว่า
    - หากกำหนดค่า completion ไว้ใน profile แต่ cache file หายไป doctor จะสร้าง cache ใหม่โดยอัตโนมัติ
    - หากไม่ได้กำหนดค่า completion เลย doctor จะถามให้ติดตั้ง (เฉพาะโหมด interactive; ข้ามเมื่อใช้ `--non-interactive`)

    รัน `openclaw completion --write-state` เพื่อสร้าง cache ใหม่ด้วยตนเอง

  </Accordion>
  <Accordion title="12. การตรวจสอบ auth ของ Gateway (local token)">
    Doctor ตรวจสอบความพร้อมของ local gateway token auth

    - หาก token mode ต้องใช้ token และไม่มีแหล่ง token อยู่ doctor จะเสนอให้สร้าง token
    - หาก `gateway.auth.token` จัดการโดย SecretRef แต่ไม่พร้อมใช้งาน doctor จะเตือนและไม่เขียนทับด้วย plaintext
    - `openclaw doctor --generate-gateway-token` บังคับให้สร้างเฉพาะเมื่อไม่ได้กำหนดค่า token SecretRef ไว้

  </Accordion>
  <Accordion title="12b. การซ่อมแซมแบบ read-only ที่รับรู้ SecretRef">
    repair flows บางรายการจำเป็นต้องตรวจสอบ credentials ที่กำหนดค่าไว้โดยไม่ทำให้พฤติกรรม runtime fail-fast อ่อนลง

    - ตอนนี้ `openclaw doctor --fix` ใช้ read-only SecretRef summary model เดียวกับคำสั่งกลุ่ม status สำหรับการซ่อมแซม config แบบ targeted
    - ตัวอย่าง: การซ่อมแซม Telegram `allowFrom` / `groupAllowFrom` `@username` จะพยายามใช้ bot credentials ที่กำหนดค่าไว้เมื่อพร้อมใช้งาน
    - หากกำหนดค่า Telegram bot token ผ่าน SecretRef แต่ไม่พร้อมใช้งานใน command path ปัจจุบัน doctor จะรายงานว่า credential ถูกกำหนดค่าไว้แต่ไม่พร้อมใช้งาน และข้าม auto-resolution แทนที่จะ crash หรือรายงาน token ผิดว่าหายไป

  </Accordion>
  <Accordion title="13. Gateway health check + restart">
    Doctor รัน health check และเสนอให้ restart gateway เมื่อดูเหมือนว่าไม่ healthy
  </Accordion>
  <Accordion title="13b. ความพร้อมของ memory search">
    Doctor ตรวจสอบว่า memory search embedding provider ที่กำหนดค่าไว้พร้อมสำหรับ agent เริ่มต้นหรือไม่ พฤติกรรมขึ้นอยู่กับ backend และ provider ที่กำหนดค่าไว้:

    - **QMD backend**: probe ว่า binary `qmd` พร้อมใช้งานและเริ่มต้นได้หรือไม่ หากไม่ได้ จะพิมพ์คำแนะนำการแก้ไข รวมถึง npm package และตัวเลือก binary path แบบ manual
    - **Explicit local provider**: ตรวจหา local model file หรือ remote/downloadable model URL ที่รู้จัก หากหายไป จะแนะนำให้สลับไปใช้ remote provider
    - **Explicit remote provider** (`openai`, `voyage` เป็นต้น): ตรวจสอบว่ามี API key อยู่ใน environment หรือ auth store พิมพ์คำแนะนำการแก้ไขที่ดำเนินการได้หากหายไป
    - **Auto provider**: ตรวจสอบความพร้อมของ local model ก่อน แล้วจึงลอง remote provider แต่ละตัวตามลำดับ auto-selection

    เมื่อมี cached gateway probe result พร้อมใช้งาน (gateway healthy ในขณะตรวจสอบ) doctor จะ cross-reference ผลลัพธ์กับ config ที่ CLI มองเห็น และบันทึกความแตกต่างใดๆ Doctor จะไม่เริ่ม embedding ping ใหม่บน default path; ใช้คำสั่ง deep memory status เมื่อต้องการตรวจสอบ provider แบบ live

    ใช้ `openclaw memory status --deep` เพื่อตรวจสอบความพร้อมของ embedding ที่ runtime

  </Accordion>
  <Accordion title="14. คำเตือนสถานะ channel">
    หาก gateway healthy doctor จะรัน channel status probe และรายงานคำเตือนพร้อมคำแนะนำการแก้ไข
  </Accordion>
  <Accordion title="15. การ audit + repair config ของ supervisor">
    Doctor ตรวจสอบ config ของ supervisor ที่ติดตั้งไว้ (launchd/systemd/schtasks) เพื่อหาค่าเริ่มต้นที่หายไปหรือล้าสมัย (เช่น systemd network-online dependencies และ restart delay) เมื่อพบ mismatch จะพร้อมแนะนำการอัปเดตและสามารถเขียน service file/task ใหม่ให้เป็นค่าเริ่มต้นปัจจุบัน

    หมายเหตุ:

    - `openclaw doctor` จะแสดงพรอมป์ก่อนเขียน config ของ supervisor ใหม่
    - `openclaw doctor --yes` ยอมรับพรอมป์การซ่อมแซมเริ่มต้น
    - `openclaw doctor --repair` ใช้การแก้ไขที่แนะนำโดยไม่มีพรอมป์
    - `openclaw doctor --repair --force` เขียนทับ config ของ supervisor แบบกำหนดเอง
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` ทำให้ doctor เป็นแบบอ่านอย่างเดียวสำหรับวงจรชีวิตของบริการ gateway โดยยังคงรายงานสถานภาพบริการและรันการซ่อมแซมที่ไม่เกี่ยวกับบริการ แต่จะข้ามการติดตั้ง/เริ่ม/รีสตาร์ต/บูตสแตรปบริการ การเขียน config ของ supervisor ใหม่ และการล้างบริการ legacy เพราะ supervisor ภายนอกเป็นเจ้าของวงจรชีวิตนั้น
    - บน Linux doctor จะไม่เขียน metadata ของคำสั่ง/entrypoint ใหม่ขณะที่ unit ของ systemd gateway ที่ตรงกันยังทำงานอยู่ และยังละเว้น unit เสริมที่คล้าย gateway ซึ่งไม่ได้ใช้งานและไม่ใช่ legacy ระหว่างการสแกนบริการซ้ำ เพื่อไม่ให้ไฟล์บริการประกอบสร้างเสียงรบกวนจากการล้างข้อมูล
    - หากการยืนยันตัวตนด้วย token ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef การติดตั้ง/ซ่อมแซมบริการของ doctor จะตรวจสอบ SecretRef แต่จะไม่บันทึกค่า token แบบ plaintext ที่ resolve แล้วลงใน metadata สภาพแวดล้อมของบริการ supervisor
    - Doctor ตรวจพบค่าสภาพแวดล้อมบริการที่จัดการโดย `.env`/SecretRef ซึ่งการติดตั้ง LaunchAgent, systemd หรือ Windows Scheduled Task รุ่นเก่าฝังไว้แบบ inline และเขียน metadata ของบริการใหม่เพื่อให้ค่าเหล่านั้นโหลดจากแหล่ง runtime แทนที่จะอยู่ในนิยามของ supervisor
    - Doctor ตรวจพบเมื่อคำสั่งบริการยังคงตรึง `--port` เก่าไว้หลังจาก `gateway.port` เปลี่ยน และเขียน metadata ของบริการใหม่ให้เป็นพอร์ตปัจจุบัน
    - หากการยืนยันตัวตนด้วย token ต้องใช้ token และ SecretRef ของ token ที่กำหนดค่าไว้ยัง unresolved อยู่ doctor จะบล็อกเส้นทางการติดตั้ง/ซ่อมแซมพร้อมคำแนะนำที่นำไปทำต่อได้
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` ไว้ doctor จะบล็อกการติดตั้ง/ซ่อมแซมจนกว่าจะตั้งค่า mode อย่างชัดเจน
    - สำหรับ unit ของ Linux user-systemd ตอนนี้การตรวจสอบ token drift ของ doctor จะรวมทั้งแหล่งที่มาจาก `Environment=` และ `EnvironmentFile=` เมื่อเปรียบเทียบ metadata การยืนยันตัวตนของบริการ
    - การซ่อมแซมบริการของ Doctor จะปฏิเสธการเขียนใหม่ หยุด หรือรีสตาร์ตบริการ gateway จากไบนารี OpenClaw รุ่นเก่า เมื่อ config ถูกเขียนครั้งล่าสุดโดยเวอร์ชันใหม่กว่า ดู [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)
    - คุณสามารถบังคับให้เขียนใหม่ทั้งหมดได้เสมอผ่าน `openclaw gateway install --force`

  </Accordion>
  <Accordion title="16. การวินิจฉัย runtime ของ Gateway + พอร์ต">
    Doctor ตรวจสอบ runtime ของบริการ (PID, สถานะออกล่าสุด) และเตือนเมื่อบริการติดตั้งแล้วแต่ไม่ได้ทำงานจริง นอกจากนี้ยังตรวจสอบการชนกันของพอร์ตบนพอร์ต gateway (ค่าเริ่มต้น `18789`) และรายงานสาเหตุที่เป็นไปได้ (gateway ทำงานอยู่แล้ว, SSH tunnel)
  </Accordion>
  <Accordion title="17. แนวทางปฏิบัติที่ดีที่สุดสำหรับ runtime ของ Gateway">
    Doctor เตือนเมื่อบริการ gateway ทำงานบน Bun หรือเส้นทาง Node ที่จัดการด้วยเวอร์ชัน (`nvm`, `fnm`, `volta`, `asdf` ฯลฯ) ช่องทาง WhatsApp + Telegram ต้องใช้ Node และเส้นทางของ version-manager อาจเสียหลังอัปเกรด เพราะบริการไม่โหลด shell init ของคุณ Doctor เสนอให้ย้ายไปใช้การติดตั้ง Node ของระบบเมื่อมีให้ใช้ (Homebrew/apt/choco)

    บริการที่ติดตั้งหรือซ่อมแซมใหม่จะเก็บ root ของสภาพแวดล้อมที่ระบุชัดเจน (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) และไดเรกทอรี user-bin ที่เสถียร แต่ไดเรกทอรี fallback ของ version-manager ที่คาดเดาจะถูกเขียนลงใน PATH ของบริการเฉพาะเมื่อไดเรกทอรีเหล่านั้นมีอยู่บนดิสก์เท่านั้น วิธีนี้ทำให้ PATH ของ supervisor ที่สร้างขึ้นสอดคล้องกับการตรวจสอบ minimal-PATH แบบเดียวกับที่ doctor รันในภายหลัง

  </Accordion>
  <Accordion title="18. การเขียน config + metadata ของวิซาร์ด">
    Doctor บันทึกการเปลี่ยนแปลง config ใดๆ และประทับ metadata ของวิซาร์ดเพื่อบันทึกการรัน doctor
  </Accordion>
  <Accordion title="19. เคล็ดลับ workspace (backup + ระบบ memory)">
    Doctor แนะนำระบบ memory ของ workspace เมื่อยังไม่มี และพิมพ์เคล็ดลับการ backup หาก workspace ยังไม่ได้อยู่ภายใต้ git

    ดู [/concepts/agent-workspace](/th/concepts/agent-workspace) สำหรับคู่มือฉบับเต็มเกี่ยวกับโครงสร้าง workspace และการ backup ด้วย git (แนะนำให้ใช้ GitHub หรือ GitLab แบบ private)

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
