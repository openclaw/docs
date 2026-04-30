---
read_when:
    - การเริ่มต้นใช้งานอินสแตนซ์ผู้ช่วยใหม่
    - การตรวจสอบผลกระทบด้านความปลอดภัย/สิทธิ์
summary: คู่มือแบบครบวงจรสำหรับการใช้งาน OpenClaw เป็นผู้ช่วยส่วนตัว พร้อมข้อควรระวังด้านความปลอดภัย
title: การตั้งค่าผู้ช่วยส่วนตัว
x-i18n:
    generated_at: "2026-04-30T10:17:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0614272f9a2b30e0900c55b39a8bd6a2b71b9f5d5fbf0fe00c534b91193e6a0
    source_path: start/openclaw.md
    workflow: 16
---

# การสร้างผู้ช่วยส่วนตัวด้วย OpenClaw

OpenClaw คือ Gateway แบบโฮสต์เองที่เชื่อมต่อ Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo และอื่น ๆ เข้ากับเอเจนต์ AI คู่มือนี้ครอบคลุมการตั้งค่าแบบ "ผู้ช่วยส่วนตัว": หมายเลข WhatsApp เฉพาะที่ทำงานเหมือนผู้ช่วย AI ที่พร้อมใช้งานตลอดเวลา

## ⚠️ ความปลอดภัยมาก่อน

คุณกำลังวางเอเจนต์ไว้ในตำแหน่งที่สามารถ:

- รันคำสั่งบนเครื่องของคุณ (ขึ้นอยู่กับนโยบายเครื่องมือของคุณ)
- อ่าน/เขียนไฟล์ในพื้นที่ทำงานของคุณ
- ส่งข้อความกลับออกไปผ่าน WhatsApp/Telegram/Discord/Mattermost และช่องทางที่รวมมาอื่น ๆ

เริ่มแบบรัดกุมไว้ก่อน:

- ตั้งค่า `channels.whatsapp.allowFrom` เสมอ (อย่ารันแบบเปิดให้ทั้งโลกบน Mac ส่วนตัวของคุณ)
- ใช้หมายเลข WhatsApp เฉพาะสำหรับผู้ช่วย
- Heartbeats ตอนนี้ค่าเริ่มต้นคือทุก 30 นาที ปิดไว้จนกว่าคุณจะเชื่อถือการตั้งค่านี้ โดยตั้งค่า `agents.defaults.heartbeat.every: "0m"`

## ข้อกำหนดเบื้องต้น

- ติดตั้งและเริ่มต้นใช้งาน OpenClaw แล้ว — ดู [เริ่มต้นใช้งาน](/th/start/getting-started) หากคุณยังไม่ได้ทำ
- หมายเลขโทรศัพท์ที่สอง (SIM/eSIM/เติมเงิน) สำหรับผู้ช่วย

## การตั้งค่าแบบสองโทรศัพท์ (แนะนำ)

คุณต้องการแบบนี้:

```mermaid
flowchart TB
    A["<b>Your Phone (personal)<br></b><br>Your WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Second Phone (assistant)<br></b><br>Assistant WA<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Your Mac (openclaw)<br></b><br>AI agent"]
```

หากคุณลิงก์ WhatsApp ส่วนตัวกับ OpenClaw ทุกข้อความที่ส่งถึงคุณจะกลายเป็น “อินพุตของเอเจนต์” ซึ่งแทบไม่ใช่สิ่งที่คุณต้องการ

## เริ่มต้นอย่างรวดเร็วใน 5 นาที

1. จับคู่ WhatsApp Web (แสดง QR; สแกนด้วยโทรศัพท์ของผู้ช่วย):

```bash
openclaw channels login
```

2. เริ่ม Gateway (ปล่อยให้รันต่อไป):

```bash
openclaw gateway --port 18789
```

3. ใส่การกำหนดค่าขั้นต่ำใน `~/.openclaw/openclaw.json`:

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

ตอนนี้ให้ส่งข้อความไปยังหมายเลขผู้ช่วยจากโทรศัพท์ที่อยู่ในรายการอนุญาตของคุณ

เมื่อการเริ่มต้นใช้งานเสร็จสิ้น OpenClaw จะเปิดแดชบอร์ดโดยอัตโนมัติและพิมพ์ลิงก์ที่สะอาด (ไม่มีโทเคน) หากแดชบอร์ดขอการยืนยันตัวตน ให้วาง shared secret ที่กำหนดค่าไว้ในค่าตั้งของ Control UI การเริ่มต้นใช้งานใช้โทเคนเป็นค่าเริ่มต้น (`gateway.auth.token`) แต่การยืนยันตัวตนด้วยรหัสผ่านก็ใช้ได้เช่นกัน หากคุณเปลี่ยน `gateway.auth.mode` เป็น `password` หากต้องการเปิดอีกครั้งภายหลัง: `openclaw dashboard`

## ให้พื้นที่ทำงานแก่เอเจนต์ (AGENTS)

OpenClaw อ่านคำสั่งการทำงานและ “หน่วยความจำ” จากไดเรกทอรีพื้นที่ทำงานของมัน

โดยค่าเริ่มต้น OpenClaw ใช้ `~/.openclaw/workspace` เป็นพื้นที่ทำงานของเอเจนต์ และจะสร้างพื้นที่นี้ (รวมถึงไฟล์เริ่มต้น `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`) โดยอัตโนมัติระหว่างการตั้งค่า/การรันเอเจนต์ครั้งแรก `BOOTSTRAP.md` จะถูกสร้างเฉพาะเมื่อพื้นที่ทำงานเป็นของใหม่เท่านั้น (ไม่ควรกลับมาหลังจากคุณลบไปแล้ว) `MEMORY.md` เป็นตัวเลือก (ไม่ถูกสร้างอัตโนมัติ); เมื่อมีไฟล์นี้ จะถูกโหลดสำหรับเซสชันปกติ เซสชันเอเจนต์ย่อยจะฉีดเฉพาะ `AGENTS.md` และ `TOOLS.md`

<Tip>
ปฏิบัติต่อโฟลเดอร์นี้เหมือนหน่วยความจำของ OpenClaw และทำให้เป็นรีโพ git (ควรเป็นแบบส่วนตัว) เพื่อสำรอง `AGENTS.md` และไฟล์หน่วยความจำของคุณ หากติดตั้ง git ไว้ พื้นที่ทำงานใหม่เอี่ยมจะถูกเริ่มต้นโดยอัตโนมัติ
</Tip>

```bash
openclaw setup
```

ผังพื้นที่ทำงานแบบเต็ม + คู่มือสำรองข้อมูล: [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)
เวิร์กโฟลว์หน่วยความจำ: [หน่วยความจำ](/th/concepts/memory)

ตัวเลือก: เลือกพื้นที่ทำงานอื่นด้วย `agents.defaults.workspace` (รองรับ `~`)

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

หากคุณส่งไฟล์พื้นที่ทำงานของคุณเองจากรีโพอยู่แล้ว คุณสามารถปิดการสร้างไฟล์เริ่มต้นทั้งหมดได้:

```json5
{
  agents: {
    defaults: {
      skipBootstrap: true,
    },
  },
}
```

## การกำหนดค่าที่ทำให้มันกลายเป็น "ผู้ช่วย"

OpenClaw มีค่าเริ่มต้นที่เหมาะกับการตั้งค่าผู้ช่วยอยู่แล้ว แต่โดยปกติคุณจะต้องปรับแต่ง:

- บุคลิก/คำสั่งใน [`SOUL.md`](/th/concepts/soul)
- ค่าเริ่มต้นการคิด (หากต้องการ)
- heartbeats (เมื่อคุณเชื่อถือมันแล้ว)

ตัวอย่าง:

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-6",
    workspace: "~/.openclaw/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    // Start with 0; enable later.
    heartbeat: { every: "0m" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

## เซสชันและหน่วยความจำ

- ไฟล์เซสชัน: `~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- เมตาดาต้าเซสชัน (การใช้โทเคน เส้นทางล่าสุด ฯลฯ): `~/.openclaw/agents/<agentId>/sessions/sessions.json` (เดิม: `~/.openclaw/sessions/sessions.json`)
- `/new` หรือ `/reset` เริ่มเซสชันใหม่สำหรับแชตนั้น (กำหนดค่าได้ผ่าน `resetTriggers`) หากส่งมาเพียงอย่างเดียว OpenClaw จะยืนยันการรีเซ็ตโดยไม่เรียกใช้โมเดล
- `/compact [instructions]` ทำ Compaction บริบทของเซสชันและรายงานงบประมาณบริบทที่เหลืออยู่

## Heartbeats (โหมดเชิงรุก)

โดยค่าเริ่มต้น OpenClaw รัน heartbeat ทุก 30 นาทีด้วยพรอมป์:
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
ตั้งค่า `agents.defaults.heartbeat.every: "0m"` เพื่อปิดใช้งาน

- หากมี `HEARTBEAT.md` อยู่แต่แทบว่างเปล่า (มีเพียงบรรทัดว่างและส่วนหัว markdown เช่น `# Heading`) OpenClaw จะข้ามการรัน heartbeat เพื่อประหยัดการเรียก API
- หากไม่มีไฟล์ heartbeat จะยังรันอยู่และโมเดลจะตัดสินใจว่าจะทำอะไร
- หากเอเจนต์ตอบด้วย `HEARTBEAT_OK` (อาจมีข้อความเสริมสั้น ๆ; ดู `agents.defaults.heartbeat.ackMaxChars`) OpenClaw จะระงับการส่งออกสำหรับ heartbeat นั้น
- โดยค่าเริ่มต้น อนุญาตให้ส่ง heartbeat ไปยังเป้าหมายแบบ DM `user:<id>` ได้ ตั้งค่า `agents.defaults.heartbeat.directPolicy: "block"` เพื่อระงับการส่งไปยังเป้าหมายโดยตรง ในขณะที่ยังคงให้การรัน heartbeat ทำงานอยู่
- Heartbeats รันเทิร์นของเอเจนต์แบบเต็ม — ช่วงเวลาที่สั้นลงใช้โทเคนมากขึ้น

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## สื่อเข้าและออก

ไฟล์แนบขาเข้า (รูปภาพ/เสียง/เอกสาร) สามารถส่งต่อไปยังคำสั่งของคุณผ่านเทมเพลต:

- `{{MediaPath}}` (พาธไฟล์ชั่วคราวในเครื่อง)
- `{{MediaUrl}}` (pseudo-URL)
- `{{Transcript}}` (หากเปิดใช้การถอดเสียง)

ไฟล์แนบขาออกจากเอเจนต์: ใส่ `MEDIA:<path-or-url>` ในบรรทัดของตัวเอง (ไม่มีช่องว่าง) ตัวอย่าง:

```
Here’s the screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw จะดึงรายการเหล่านี้และส่งเป็นสื่อไปพร้อมกับข้อความ

พฤติกรรมของพาธในเครื่องเป็นไปตามโมเดลความเชื่อถือในการอ่านไฟล์แบบเดียวกับเอเจนต์:

- หาก `tools.fs.workspaceOnly` เป็น `true` พาธในเครื่องของ `MEDIA:` ขาออกจะยังถูกจำกัดไว้ที่รากชั่วคราวของ OpenClaw, แคชสื่อ, พาธพื้นที่ทำงานของเอเจนต์ และไฟล์ที่สร้างโดย sandbox
- หาก `tools.fs.workspaceOnly` เป็น `false` `MEDIA:` ขาออกสามารถใช้ไฟล์ในเครื่องโฮสต์ที่เอเจนต์ได้รับอนุญาตให้อ่านอยู่แล้ว
- การส่งจากเครื่องโฮสต์ยังคงอนุญาตเฉพาะสื่อและชนิดเอกสารที่ปลอดภัยเท่านั้น (รูปภาพ เสียง วิดีโอ PDF และเอกสาร Office) ไฟล์ข้อความล้วนและไฟล์ที่คล้ายความลับจะไม่ถือว่าเป็นสื่อที่ส่งได้

นั่นหมายความว่ารูปภาพ/ไฟล์ที่สร้างนอกพื้นที่ทำงานสามารถส่งได้แล้วเมื่อ policy fs ของคุณอนุญาตการอ่านเหล่านั้นอยู่แล้ว โดยไม่เปิดทางให้ไฟล์แนบข้อความจากโฮสต์ใด ๆ ถูกส่งออกไปโดยพลการ

## รายการตรวจสอบการปฏิบัติการ

```bash
openclaw status          # local status (creds, sessions, queued events)
openclaw status --all    # full diagnosis (read-only, pasteable)
openclaw status --deep   # asks the gateway for a live health probe with channel probes when supported
openclaw health --json   # gateway health snapshot (WS; default can return a fresh cached snapshot)
```

บันทึกอยู่ใต้ `/tmp/openclaw/` (ค่าเริ่มต้น: `openclaw-YYYY-MM-DD.log`)

## ขั้นตอนถัดไป

- WebChat: [WebChat](/th/web/webchat)
- การปฏิบัติการ Gateway: [คู่มือปฏิบัติการ Gateway](/th/gateway)
- Cron + การปลุก: [งาน Cron](/th/automation/cron-jobs)
- ตัวช่วยแถบเมนู macOS: [แอป OpenClaw macOS](/th/platforms/macos)
- แอป Node บน iOS: [แอป iOS](/th/platforms/ios)
- แอป Node บน Android: [แอป Android](/th/platforms/android)
- สถานะ Windows: [Windows (WSL2)](/th/platforms/windows)
- สถานะ Linux: [แอป Linux](/th/platforms/linux)
- ความปลอดภัย: [ความปลอดภัย](/th/gateway/security)

## ที่เกี่ยวข้อง

- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [การตั้งค่า](/th/start/setup)
- [ภาพรวมช่องทาง](/th/channels)
