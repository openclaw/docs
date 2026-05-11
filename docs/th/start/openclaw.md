---
read_when:
    - การเริ่มต้นใช้งานอินสแตนซ์ผู้ช่วยใหม่
    - กำลังตรวจสอบผลกระทบด้านความปลอดภัย/สิทธิ์
summary: คู่มือแบบครบวงจรสำหรับการใช้งาน OpenClaw เป็นผู้ช่วยส่วนตัว พร้อมข้อควรระวังด้านความปลอดภัย
title: การตั้งค่าผู้ช่วยส่วนตัว
x-i18n:
    generated_at: "2026-05-11T20:37:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 74dd13c4b43faa8e29e1fd56a355f36c6cf7c3fa8193bb62c1056211933f4df9
    source_path: start/openclaw.md
    workflow: 16
---

OpenClaw เป็น Gateway ที่โฮสต์เอง ซึ่งเชื่อมต่อ Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo และอื่นๆ เข้ากับเอเจนต์ AI คู่มือนี้ครอบคลุมการตั้งค่าแบบ "ผู้ช่วยส่วนตัว": หมายเลข WhatsApp เฉพาะที่ทำงานเหมือนผู้ช่วย AI ที่พร้อมใช้งานตลอดเวลาของคุณ

## ⚠️ ความปลอดภัยต้องมาก่อน

คุณกำลังวางเอเจนต์ไว้ในตำแหน่งที่สามารถ:

- รันคำสั่งบนเครื่องของคุณ (ขึ้นอยู่กับนโยบายเครื่องมือของคุณ)
- อ่าน/เขียนไฟล์ในเวิร์กสเปซของคุณ
- ส่งข้อความกลับออกไปผ่าน WhatsApp/Telegram/Discord/Mattermost และช่องทางอื่นๆ ที่รวมมาให้

เริ่มแบบระมัดระวัง:

- ตั้งค่า `channels.whatsapp.allowFrom` เสมอ (อย่ารันแบบเปิดให้ทั้งโลกเข้าถึงบน Mac ส่วนตัวของคุณ)
- ใช้หมายเลข WhatsApp เฉพาะสำหรับผู้ช่วย
- ตอนนี้ Heartbeat มีค่าเริ่มต้นเป็นทุก 30 นาที ปิดไว้จนกว่าคุณจะเชื่อถือการตั้งค่านี้ โดยตั้งค่า `agents.defaults.heartbeat.every: "0m"`

## ข้อกำหนดเบื้องต้น

- ติดตั้งและเริ่มต้นใช้งาน OpenClaw แล้ว - ดู [เริ่มต้นใช้งาน](/th/start/getting-started) หากคุณยังไม่ได้ทำขั้นตอนนี้
- หมายเลขโทรศัพท์ที่สอง (SIM/eSIM/เติมเงิน) สำหรับผู้ช่วย

## การตั้งค่าแบบสองโทรศัพท์ (แนะนำ)

คุณต้องการแบบนี้:

```mermaid
flowchart TB
    A["<b>Your Phone (personal)<br></b><br>Your WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Second Phone (assistant)<br></b><br>Assistant WA<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Your Mac (openclaw)<br></b><br>AI agent"]
```

หากคุณเชื่อม WhatsApp ส่วนตัวของคุณกับ OpenClaw ทุกข้อความที่ส่งถึงคุณจะกลายเป็น "อินพุตของเอเจนต์" ซึ่งแทบไม่ใช่สิ่งที่คุณต้องการ

## เริ่มต้นอย่างรวดเร็วใน 5 นาที

1. จับคู่ WhatsApp Web (แสดง QR; สแกนด้วยโทรศัพท์ของผู้ช่วย):

```bash
openclaw channels login
```

2. เริ่ม Gateway (ปล่อยให้รันต่อไป):

```bash
openclaw gateway --port 18789
```

3. ใส่คอนฟิกขั้นต่ำใน `~/.openclaw/openclaw.json`:

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

ตอนนี้ให้ส่งข้อความไปยังหมายเลขผู้ช่วยจากโทรศัพท์ที่อยู่ใน allowlist ของคุณ

เมื่อการเริ่มต้นใช้งานเสร็จสิ้น OpenClaw จะเปิดแดชบอร์ดอัตโนมัติและพิมพ์ลิงก์ที่สะอาด (ไม่มีโทเค็น) หากแดชบอร์ดถามการยืนยันตัวตน ให้วาง shared secret ที่กำหนดค่าไว้ในการตั้งค่า Control UI การเริ่มต้นใช้งานใช้โทเค็นเป็นค่าเริ่มต้น (`gateway.auth.token`) แต่การยืนยันตัวตนด้วยรหัสผ่านก็ใช้งานได้เช่นกัน หากคุณเปลี่ยน `gateway.auth.mode` เป็น `password` หากต้องการเปิดใหม่ภายหลัง: `openclaw dashboard`

## ให้เวิร์กสเปซแก่เอเจนต์ (AGENTS)

OpenClaw อ่านคำสั่งการทำงานและ "หน่วยความจำ" จากไดเรกทอรีเวิร์กสเปซของมัน

โดยค่าเริ่มต้น OpenClaw ใช้ `~/.openclaw/workspace` เป็นเวิร์กสเปซของเอเจนต์ และจะสร้างไดเรกทอรีนี้ (พร้อม `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` เริ่มต้น) โดยอัตโนมัติระหว่างการตั้งค่า/การรันเอเจนต์ครั้งแรก `BOOTSTRAP.md` จะถูกสร้างเฉพาะเมื่อเวิร์กสเปซใหม่จริงๆ เท่านั้น (ไม่ควรกลับมาหลังจากคุณลบไปแล้ว) `MEMORY.md` เป็นทางเลือก (ไม่สร้างอัตโนมัติ); เมื่อมีอยู่ ไฟล์นี้จะถูกโหลดสำหรับเซสชันปกติ เซสชันซับเอเจนต์จะ inject เฉพาะ `AGENTS.md` และ `TOOLS.md`

<Tip>
ให้ถือว่าโฟลเดอร์นี้เป็นหน่วยความจำของ OpenClaw และทำให้เป็น git repo (ควรเป็นแบบส่วนตัว) เพื่อให้ `AGENTS.md` และไฟล์หน่วยความจำของคุณมีข้อมูลสำรอง หากติดตั้ง git ไว้ เวิร์กสเปซใหม่เอี่ยมจะถูกเริ่มต้นอัตโนมัติ
</Tip>

```bash
openclaw setup
```

เลย์เอาต์เวิร์กสเปซฉบับเต็ม + คู่มือสำรองข้อมูล: [เวิร์กสเปซเอเจนต์](/th/concepts/agent-workspace)
เวิร์กโฟลว์หน่วยความจำ: [หน่วยความจำ](/th/concepts/memory)

ไม่บังคับ: เลือกเวิร์กสเปซอื่นด้วย `agents.defaults.workspace` (รองรับ `~`)

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

หากคุณส่งไฟล์เวิร์กสเปซของคุณเองจาก repo อยู่แล้ว คุณสามารถปิดการสร้างไฟล์ bootstrap ทั้งหมดได้:

```json5
{
  agents: {
    defaults: {
      skipBootstrap: true,
    },
  },
}
```

## คอนฟิกที่ทำให้มันกลายเป็น "ผู้ช่วย"

OpenClaw มีค่าเริ่มต้นที่เหมาะกับการตั้งค่าผู้ช่วยอยู่แล้ว แต่โดยทั่วไปคุณจะต้องปรับ:

- บุคลิก/คำสั่งใน [`SOUL.md`](/th/concepts/soul)
- ค่าเริ่มต้นการคิด (หากต้องการ)
- Heartbeat (เมื่อคุณเชื่อถือมันแล้ว)

ตัวอย่าง:

```json5
{
  logging: { level: "info" },
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      workspace: "~/.openclaw/workspace",
      thinkingDefault: "high",
      timeoutSeconds: 1800,
      // Start with 0; enable later.
      heartbeat: { every: "0m" },
    },
    list: [
      {
        id: "main",
        default: true,
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
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
- เมทาดาทาเซสชัน (การใช้โทเค็น, เส้นทางล่าสุด ฯลฯ): `~/.openclaw/agents/<agentId>/sessions/sessions.json` (แบบเดิม: `~/.openclaw/sessions/sessions.json`)
- `/new` หรือ `/reset` เริ่มเซสชันใหม่สำหรับแชตนั้น (กำหนดค่าได้ผ่าน `resetTriggers`) หากส่งมาเดี่ยวๆ OpenClaw จะยืนยันการรีเซ็ตโดยไม่เรียกโมเดล
- `/compact [instructions]` compact บริบทเซสชันและรายงานงบประมาณบริบทที่เหลืออยู่

## Heartbeat (โหมดเชิงรุก)

โดยค่าเริ่มต้น OpenClaw จะรัน Heartbeat ทุก 30 นาทีด้วยพรอมป์:
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
ตั้งค่า `agents.defaults.heartbeat.every: "0m"` เพื่อปิดใช้งาน

- หากมี `HEARTBEAT.md` อยู่แต่แทบว่างเปล่า (มีเพียงบรรทัดว่างและหัวข้อ markdown เช่น `# Heading`) OpenClaw จะข้ามการรัน Heartbeat เพื่อประหยัดการเรียก API
- หากไฟล์หายไป Heartbeat จะยังคงรันและโมเดลจะตัดสินใจว่าต้องทำอะไร
- หากเอเจนต์ตอบกลับด้วย `HEARTBEAT_OK` (อาจมีข้อความเสริมสั้นๆ; ดู `agents.defaults.heartbeat.ackMaxChars`) OpenClaw จะระงับการส่งออกสำหรับ Heartbeat นั้น
- โดยค่าเริ่มต้น อนุญาตให้ส่ง Heartbeat ไปยังเป้าหมายแบบ DM `user:<id>` ได้ ตั้งค่า `agents.defaults.heartbeat.directPolicy: "block"` เพื่อระงับการส่งไปยังเป้าหมายโดยตรง โดยยังคงให้การรัน Heartbeat ทำงานอยู่
- Heartbeat รันเป็นรอบเอเจนต์เต็มรูปแบบ - ช่วงเวลาที่สั้นลงจะใช้โทเค็นมากขึ้น

```json5
{
  agents: {
    defaults: {
      heartbeat: { every: "30m" },
    },
  },
}
```

## สื่อขาเข้าและขาออก

ไฟล์แนบขาเข้า (รูปภาพ/เสียง/เอกสาร) สามารถส่งต่อให้คำสั่งของคุณผ่านเทมเพลตได้:

- `{{MediaPath}}` (พาธไฟล์ชั่วคราวภายในเครื่อง)
- `{{MediaUrl}}` (pseudo-URL)
- `{{Transcript}}` (หากเปิดใช้การถอดเสียง)

ไฟล์แนบขาออกจากเอเจนต์: ใส่ `MEDIA:<path-or-url>` ในบรรทัดของมันเอง (ไม่มีช่องว่าง) ตัวอย่าง:

```
Here's the screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw จะแยกสิ่งเหล่านี้และส่งเป็นสื่อพร้อมกับข้อความ

พฤติกรรมของพาธภายในเครื่องใช้โมเดลความเชื่อถือการอ่านไฟล์เดียวกับเอเจนต์:

- หาก `tools.fs.workspaceOnly` เป็น `true` พาธภายในเครื่องของ `MEDIA:` ขาออกจะยังถูกจำกัดให้อยู่ใน temp root ของ OpenClaw, แคชสื่อ, พาธเวิร์กสเปซของเอเจนต์ และไฟล์ที่สร้างจาก sandbox
- หาก `tools.fs.workspaceOnly` เป็น `false` `MEDIA:` ขาออกสามารถใช้ไฟล์ภายในเครื่องโฮสต์ที่เอเจนต์ได้รับอนุญาตให้อ่านอยู่แล้ว
- พาธภายในเครื่องสามารถเป็นพาธสัมบูรณ์, สัมพัทธ์กับเวิร์กสเปซ หรือสัมพัทธ์กับโฮมด้วย `~/`
- การส่งจากเครื่องโฮสต์ยังอนุญาตเฉพาะสื่อและชนิดเอกสารที่ปลอดภัยเท่านั้น (รูปภาพ, เสียง, วิดีโอ, PDF และเอกสาร Office) ไฟล์ข้อความล้วนและไฟล์ที่ดูเหมือนมีความลับจะไม่ถูกถือว่าเป็นสื่อที่ส่งได้

นั่นหมายความว่ารูปภาพ/ไฟล์ที่สร้างขึ้นนอกเวิร์กสเปซสามารถส่งได้แล้วเมื่อ policy ของ fs อนุญาตให้อ่านสิ่งเหล่านั้นอยู่แล้ว โดยไม่ต้องเปิดช่องทางให้ exfiltrate ไฟล์แนบข้อความจากโฮสต์โดยพลการอีกครั้ง

## รายการตรวจสอบการปฏิบัติการ

```bash
openclaw status          # local status (creds, sessions, queued events)
openclaw status --all    # full diagnosis (read-only, pasteable)
openclaw status --deep   # asks the gateway for a live health probe with channel probes when supported
openclaw health --json   # gateway health snapshot (WS; default can return a fresh cached snapshot)
```

บันทึกอยู่ภายใต้ `/tmp/openclaw/` (ค่าเริ่มต้น: `openclaw-YYYY-MM-DD.log`)

## ขั้นตอนถัดไป

- WebChat: [WebChat](/th/web/webchat)
- การปฏิบัติการ Gateway: [คู่มือปฏิบัติการ Gateway](/th/gateway)
- Cron + การปลุก: [งาน Cron](/th/automation/cron-jobs)
- ตัวช่วยบนแถบเมนู macOS: [แอป OpenClaw macOS](/th/platforms/macos)
- แอปโหนด iOS: [แอป iOS](/th/platforms/ios)
- แอปโหนด Android: [แอป Android](/th/platforms/android)
- สถานะ Windows: [Windows (WSL2)](/th/platforms/windows)
- สถานะ Linux: [แอป Linux](/th/platforms/linux)
- ความปลอดภัย: [ความปลอดภัย](/th/gateway/security)

## ที่เกี่ยวข้อง

- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [ตั้งค่า](/th/start/setup)
- [ภาพรวมช่องทาง](/th/channels)
