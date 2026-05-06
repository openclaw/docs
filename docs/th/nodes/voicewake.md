---
read_when:
    - การเปลี่ยนพฤติกรรมหรือค่าเริ่มต้นของคำปลุกด้วยเสียง
    - การเพิ่มแพลตฟอร์ม Node ใหม่ที่ต้องใช้การซิงค์คำปลุก
summary: คำปลุกด้วยเสียงแบบส่วนกลาง (เป็นของ Gateway) และวิธีซิงค์ข้ามโหนด
title: การปลุกด้วยเสียง
x-i18n:
    generated_at: "2026-05-06T09:21:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: a284cbe3e12784a8d7a3eab6ba8ae230123557bca7593c956111199b94b91b73
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw ถือว่า **คำปลุกเป็นรายการส่วนกลางรายการเดียว** ที่ **Gateway** เป็นเจ้าของ

- **ไม่มีคำปลุกที่กำหนดเองต่อ Node**
- **UI ของ Node/แอปใดก็ได้สามารถแก้ไข** รายการได้ การเปลี่ยนแปลงจะถูกบันทึกโดย Gateway และกระจายให้ทุกคน
- macOS และ iOS มีสวิตช์ **เปิด/ปิดการปลุกด้วยเสียง** แบบภายในเครื่อง (UX ภายในเครื่องและสิทธิ์แตกต่างกัน)
- Android ปัจจุบันปิดการปลุกด้วยเสียงไว้ และใช้โฟลว์ไมค์แบบแมนนวลในแท็บเสียง

## ที่เก็บข้อมูล (โฮสต์ Gateway)

คำปลุกจะถูกเก็บไว้บนเครื่อง Gateway ที่:

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

- ตัวกระตุ้นจะถูกทำให้เป็นมาตรฐาน (ตัดช่องว่างหัวท้าย และตัดค่าว่างออก) รายการว่างจะย้อนกลับไปใช้ค่าเริ่มต้น
- มีการบังคับใช้ขีดจำกัดเพื่อความปลอดภัย (เพดานจำนวน/ความยาว)

### เมธอดการกำหนดเส้นทาง (ตัวกระตุ้น → เป้าหมาย)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` พร้อมพารามิเตอร์ `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

รูปแบบ `VoiceWakeRoutingConfig`:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

เป้าหมายของเส้นทางรองรับหนึ่งรายการเท่านั้นจาก:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### เหตุการณ์

- เพย์โหลด `voicewake.changed` คือ `{ triggers: string[] }`
- เพย์โหลด `voicewake.routing.changed` คือ `{ config: VoiceWakeRoutingConfig }`

ผู้ที่ได้รับ:

- ไคลเอนต์ WebSocket ทั้งหมด (แอป macOS, WebChat ฯลฯ)
- Node ที่เชื่อมต่อทั้งหมด (iOS/Android) และยังได้รับการพุช "สถานะปัจจุบัน" ครั้งแรกเมื่อ Node เชื่อมต่อด้วย

## พฤติกรรมของไคลเอนต์

### แอป macOS

- ใช้รายการส่วนกลางเพื่อควบคุมตัวกระตุ้นของ `VoiceWakeRuntime`
- การแก้ไข "คำกระตุ้น" ในการตั้งค่าการปลุกด้วยเสียงจะเรียก `voicewake.set` แล้วอาศัยการกระจายเพื่อให้ไคลเอนต์อื่นซิงค์กัน

### Node iOS

- ใช้รายการส่วนกลางสำหรับการตรวจจับตัวกระตุ้นของ `VoiceWakeManager`
- การแก้ไขคำปลุกในการตั้งค่าจะเรียก `voicewake.set` (ผ่าน Gateway WS) และยังทำให้การตรวจจับคำปลุกภายในเครื่องตอบสนองได้ต่อเนื่อง

### Node Android

- ปัจจุบันการปลุกด้วยเสียงถูกปิดใช้งานในรันไทม์/การตั้งค่าของ Android
- เสียงบน Android ใช้การบันทึกไมค์แบบแมนนวลในแท็บเสียงแทนตัวกระตุ้นจากคำปลุก

## ที่เกี่ยวข้อง

- [โหมดพูดคุย](/th/nodes/talk)
- [เสียงและบันทึกเสียง](/th/nodes/audio)
- [การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
