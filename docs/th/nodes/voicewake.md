---
read_when:
    - การเปลี่ยนพฤติกรรมหรือค่าเริ่มต้นของคำปลุกด้วยเสียง
    - การเพิ่มแพลตฟอร์ม Node ใหม่ที่ต้องการการซิงก์คำปลุกด้วยเสียง
summary: คำปลุกด้วยเสียงแบบ global (Gateway เป็นเจ้าของ) และวิธีซิงก์ข้าม nodes
title: คำปลุกด้วยเสียง
x-i18n:
    generated_at: "2026-04-26T11:35:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac638cdf89f09404cdf293b416417f6cb3e31865b09f04ef87b9604e436dcbbe
    source_path: nodes/voicewake.md
    workflow: 15
---

OpenClaw ถือว่า**คำปลุกเป็นรายการส่วนกลางเพียงรายการเดียว**ที่อยู่ภายใต้การดูแลของ **Gateway**

- **ไม่มีคำปลุกแบบกำหนดเองแยกตาม Node**
- **UI ของ Node/แอปใดก็ได้สามารถแก้ไข**รายการนี้ได้; การเปลี่ยนแปลงจะถูกบันทึกโดย Gateway และกระจายไปยังทุกคน
- macOS และ iOS ยังคงมีสวิตช์ **Voice Wake enabled/disabled** แบบภายในเครื่อง (ประสบการณ์ใช้งานภายในเครื่องและสิทธิ์แตกต่างกัน)
- ขณะนี้ Android ยังคงปิด Voice Wake ไว้ และใช้ขั้นตอนการทำงานไมโครโฟนแบบแมนนวลในแท็บ Voice

## การจัดเก็บ (โฮสต์ Gateway)

คำปลุกจะถูกจัดเก็บบนเครื่องเกตเวย์ที่:

- `~/.openclaw/settings/voicewake.json`

รูปแบบ:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## โปรโตคอล

### เมธอด

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` พร้อมพารามิเตอร์ `{ triggers: string[] }` → `{ triggers: string[] }`

หมายเหตุ:

- ทริกเกอร์จะถูกทำให้เป็นรูปแบบมาตรฐาน (ตัดช่องว่างหัวท้าย ทิ้งค่าว่าง) รายการว่างจะกลับไปใช้ค่าเริ่มต้น
- มีการบังคับใช้ข้อจำกัดเพื่อความปลอดภัย (จำนวน/ความยาวสูงสุด)

### เมธอดการกำหนดเส้นทาง (trigger → target)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` พร้อมพารามิเตอร์ `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

รูปแบบของ `VoiceWakeRoutingConfig`:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

เป้าหมายของเส้นทางรองรับได้อย่างใดอย่างหนึ่งต่อไปนี้เท่านั้น:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### เหตุการณ์

- `voicewake.changed` เพย์โหลด `{ triggers: string[] }`
- `voicewake.routing.changed` เพย์โหลด `{ config: VoiceWakeRoutingConfig }`

ผู้ที่ได้รับ:

- ไคลเอนต์ WebSocket ทั้งหมด (แอป macOS, WebChat เป็นต้น)
- Node ที่เชื่อมต่อทั้งหมด (iOS/Android) และจะได้รับด้วยเมื่อ Node เชื่อมต่อเป็นการส่ง “สถานะปัจจุบัน” ครั้งแรก

## พฤติกรรมของไคลเอนต์

### แอป macOS

- ใช้รายการส่วนกลางเพื่อควบคุมทริกเกอร์ของ `VoiceWakeRuntime`
- การแก้ไข “Trigger words” ในการตั้งค่า Voice Wake จะเรียก `voicewake.set` แล้วอาศัยการกระจายข้อมูลเพื่อให้ไคลเอนต์อื่นซิงก์กันต่อไป

### Node iOS

- ใช้รายการส่วนกลางสำหรับการตรวจจับทริกเกอร์ของ `VoiceWakeManager`
- การแก้ไข Wake Words ใน Settings จะเรียก `voicewake.set` (ผ่าน Gateway WS) และยังคงทำให้การตรวจจับคำปลุกในเครื่องตอบสนองได้

### Node Android

- ขณะนี้ Voice Wake ถูกปิดใช้งานในรันไทม์/Settings ของ Android
- ระบบเสียงบน Android ใช้การจับไมโครโฟนแบบแมนนวลในแท็บ Voice แทนทริกเกอร์คำปลุก

## ที่เกี่ยวข้อง

- [โหมดสนทนา](/th/nodes/talk)
- [เสียงและบันทึกเสียง](/th/nodes/audio)
- [ความเข้าใจสื่อ](/th/nodes/media-understanding)
