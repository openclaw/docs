---
read_when:
    - คุณกำลังเปลี่ยนวิธีแสดงไทม์สแตมป์ต่อโมเดลหรือผู้ใช้
    - คุณกำลังดีบักการจัดรูปแบบเวลาในข้อความหรือเอาต์พุตพรอมต์ระบบ
summary: การจัดการวันที่และเวลาทั่วทั้งซองข้อมูล พรอมป์ เครื่องมือ และตัวเชื่อมต่อ
title: วันที่และเวลา
x-i18n:
    generated_at: "2026-05-06T09:11:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f695a5009c949cc24689bfb8950d96cf72f0b2a1472efe88923182527b56b74
    source_path: date-time.md
    workflow: 16
---

OpenClaw ตั้งค่าเริ่มต้นให้ใช้ **เวลาท้องถิ่นของโฮสต์สำหรับ timestamp ของการขนส่ง** และใช้ **เขตเวลาของผู้ใช้เฉพาะใน system prompt** เท่านั้น
Provider timestamp จะถูกคงไว้ เพื่อให้เครื่องมือรักษา semantics ดั้งเดิมของตนไว้ได้ (เวลาปัจจุบันมีให้ใช้งานผ่าน `session_status`)

## ซองข้อความ (ค่าเริ่มต้นเป็นเวลาท้องถิ่น)

ข้อความขาเข้าจะถูกห่อด้วย timestamp (ความละเอียดระดับนาที):

```
[Provider ... 2026-01-05 16:26 PST] message text
```

timestamp ของซองนี้เป็น **เวลาท้องถิ่นของโฮสต์โดยค่าเริ่มต้น** ไม่ว่าเขตเวลาของ provider จะเป็นอะไร

คุณสามารถ override พฤติกรรมนี้ได้:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` ใช้ UTC
- `envelopeTimezone: "local"` ใช้เขตเวลาของโฮสต์
- `envelopeTimezone: "user"` ใช้ `agents.defaults.userTimezone` (fallback เป็นเขตเวลาของโฮสต์)
- ใช้เขตเวลา IANA แบบระบุชัดเจน (เช่น `"America/Chicago"`) สำหรับโซนคงที่
- `envelopeTimestamp: "off"` ลบ timestamp แบบสัมบูรณ์ออกจากส่วนหัวของซอง
- `envelopeElapsed: "off"` ลบ suffix เวลาที่ผ่านไป (รูปแบบ `+2m`)

### ตัวอย่าง

**ท้องถิ่น (ค่าเริ่มต้น):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**เขตเวลาของผู้ใช้:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**เปิดใช้เวลาที่ผ่านไป:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## System prompt: วันที่และเวลาปัจจุบัน

หากทราบเขตเวลาของผู้ใช้ system prompt จะมีส่วนเฉพาะ
**วันที่และเวลาปัจจุบัน** พร้อม **เฉพาะเขตเวลา** (ไม่มีรูปแบบนาฬิกา/เวลา)
เพื่อให้ prompt caching เสถียร:

```
Time zone: America/Chicago
```

เมื่อ agent ต้องการเวลาปัจจุบัน ให้ใช้เครื่องมือ `session_status`; status
card จะมีบรรทัด timestamp

## บรรทัด system event (ค่าเริ่มต้นเป็นเวลาท้องถิ่น)

system event ที่เข้าคิวซึ่งแทรกลงในบริบทของ agent จะมี timestamp นำหน้าโดยใช้
การเลือกเขตเวลาเดียวกับซองข้อความ (ค่าเริ่มต้น: เวลาท้องถิ่นของโฮสต์)

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### กำหนดค่าเขตเวลาของผู้ใช้ + รูปแบบ

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` ตั้งค่า **เขตเวลาท้องถิ่นของผู้ใช้** สำหรับบริบทของ prompt
- `timeFormat` ควบคุม **การแสดงผลแบบ 12h/24h** ใน prompt ค่า `auto` จะตามค่ากำหนดของ OS

## การตรวจจับรูปแบบเวลา (auto)

เมื่อ `timeFormat: "auto"` OpenClaw จะตรวจสอบค่ากำหนดของ OS (macOS/Windows)
และ fallback เป็นการจัดรูปแบบตาม locale ค่าที่ตรวจพบจะถูก **แคชต่อ process**
เพื่อหลีกเลี่ยงการเรียกระบบซ้ำ

## payload ของเครื่องมือ + connector (เวลาของ provider แบบ raw + ฟิลด์ที่ normalize แล้ว)

เครื่องมือของ Channel จะคืนค่า **timestamp ดั้งเดิมของ provider** และเพิ่มฟิลด์ที่ normalize แล้วเพื่อความสอดคล้อง:

- `timestampMs`: มิลลิวินาทีตั้งแต่ epoch (UTC)
- `timestampUtc`: สตริง ISO 8601 UTC

ฟิลด์ raw ของ provider จะถูกคงไว้เพื่อไม่ให้ข้อมูลใดหายไป

- Slack: สตริงลักษณะ epoch จาก API
- Discord: timestamp แบบ UTC ISO
- Telegram/WhatsApp: timestamp แบบตัวเลข/ISO เฉพาะของ provider

หากคุณต้องการเวลาท้องถิ่น ให้แปลงภายหลังโดยใช้เขตเวลาที่ทราบ

## เอกสารที่เกี่ยวข้อง

- [System Prompt](/th/concepts/system-prompt)
- [เขตเวลา](/th/concepts/timezone)
- [ข้อความ](/th/concepts/messages)
