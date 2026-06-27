---
read_when:
    - การเปลี่ยนพฤติกรรมหรือค่าเริ่มต้นของคำปลุกด้วยเสียง
    - การเพิ่มแพลตฟอร์ม Node ใหม่ที่ต้องใช้การซิงค์คำปลุก
summary: คำปลุกด้วยเสียงแบบโกลบอล (เป็นของ Gateway) และวิธีซิงค์ข้ามโหนด
title: การปลุกด้วยเสียง
x-i18n:
    generated_at: "2026-06-27T17:47:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c57955e8061eca2f9fec83500e829f183cd3ef9f794bf385823a28f9c89b0a4
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw ถือว่า **คำปลุกเป็นรายการส่วนกลางรายการเดียว** ที่เป็นของ **Gateway**

- **ไม่มีคำปลุกแบบกำหนดเองแยกตามโหนด**
- **UI ของโหนด/แอปใดก็สามารถแก้ไข** รายการได้ การเปลี่ยนแปลงจะถูกบันทึกโดย Gateway และกระจายให้ทุกคน
- macOS และ iOS ยังคงมีสวิตช์ **เปิด/ปิด Voice Wake** ภายในเครื่อง (UX ภายในเครื่อง + สิทธิ์แตกต่างกัน)
- ปัจจุบัน Android ปิด Voice Wake ไว้ และใช้ขั้นตอนเปิดไมค์ด้วยตนเองในแท็บ Voice

## พื้นที่จัดเก็บ (โฮสต์ Gateway)

คำปลุกและกฎการกำหนดเส้นทางถูกจัดเก็บในฐานข้อมูลสถานะของ Gateway:

- `~/.openclaw/state/openclaw.sqlite`

ตารางที่ใช้งานอยู่คือ:

- `voicewake_triggers`
- `voicewake_routing_config`
- `voicewake_routing_routes`

ไฟล์เดิม `settings/voicewake.json` และ `settings/voicewake-routing.json` เป็น
อินพุตสำหรับการย้ายข้อมูลโดย doctor เท่านั้น; runtime อ่านและเขียนตาราง SQLite

## โปรโตคอล

### เมธอด

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` พร้อมพารามิเตอร์ `{ triggers: string[] }` → `{ triggers: string[] }`

หมายเหตุ:

- ทริกเกอร์จะถูกทำให้เป็นมาตรฐาน (ตัดช่องว่างหัวท้าย, ตัดรายการว่างออก) รายการว่างจะย้อนกลับไปใช้ค่าเริ่มต้น
- มีการบังคับใช้ขีดจำกัดเพื่อความปลอดภัย (เพดานจำนวน/ความยาว)

### เมธอดการกำหนดเส้นทาง (ทริกเกอร์ → เป้าหมาย)

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

เป้าหมายของเส้นทางรองรับอย่างใดอย่างหนึ่งเท่านั้น:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### เหตุการณ์

- เพย์โหลด `voicewake.changed` `{ triggers: string[] }`
- เพย์โหลด `voicewake.routing.changed` `{ config: VoiceWakeRoutingConfig }`

ผู้ที่ได้รับ:

- ไคลเอนต์ WebSocket ทั้งหมด (แอป macOS, WebChat ฯลฯ)
- โหนดที่เชื่อมต่อทั้งหมด (iOS/Android) และยังส่งสถานะ "ปัจจุบัน" เริ่มต้นเมื่อโหนดเชื่อมต่อด้วย

## พฤติกรรมของไคลเอนต์

### แอป macOS

- ใช้รายการส่วนกลางเพื่อกั้นทริกเกอร์ของ `VoiceWakeRuntime`
- การแก้ไข "คำทริกเกอร์" ในการตั้งค่า Voice Wake จะเรียก `voicewake.set` จากนั้นอาศัยการกระจายข้อมูลเพื่อให้ไคลเอนต์อื่นซิงค์กัน

### โหนด iOS

- ใช้รายการส่วนกลางสำหรับการตรวจจับทริกเกอร์ของ `VoiceWakeManager`
- การแก้ไข Wake Words ใน Settings จะเรียก `voicewake.set` (ผ่าน Gateway WS) และยังคงทำให้การตรวจจับคำปลุกในเครื่องตอบสนองได้ดี

### โหนด Android

- ปัจจุบัน Voice Wake ถูกปิดใช้งานใน runtime/Settings ของ Android
- เสียงของ Android ใช้การจับเสียงจากไมค์ด้วยตนเองในแท็บ Voice แทนทริกเกอร์คำปลุก

## ที่เกี่ยวข้อง

- [โหมดพูดคุย](/th/nodes/talk)
- [เสียงและโน้ตเสียง](/th/nodes/audio)
- [การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
