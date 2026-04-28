---
read_when:
- การเพิ่มการรองรับ Node สำหรับตำแหน่งหรือ UI ของสิทธิ์
- การออกแบบสิทธิ์ตำแหน่งหรือพฤติกรรมการทำงานเบื้องหน้าบน Android
summary: คำสั่งตำแหน่งสำหรับ Node (`location.get`), โหมดสิทธิ์ และพฤติกรรมการทำงานเบื้องหน้าบน
  Android
title: Location command
x-i18n:
  generated_at: '2026-04-24T09:19:53Z'
  model: gpt-5.4
  provider: openai
  source_hash: fcd7ae3bf411be4331d62494a5d5263e8cda345475c5f849913122c029377f06
  source_path: nodes/location-command.md
  workflow: 15
---

## สรุปสั้น ๆ

- `location.get` เป็นคำสั่งของ Node (ผ่าน `node.invoke`)
- ปิดไว้เป็นค่าปริยาย
- การตั้งค่าในแอป Android ใช้ตัวเลือก: ปิด / ขณะใช้งาน
- มี toggle แยกสำหรับ: ตำแหน่งแบบแม่นยำ

## เหตุใดจึงใช้ตัวเลือก (ไม่ใช่แค่สวิตช์)

สิทธิ์ของ OS มีหลายระดับ เราสามารถแสดงตัวเลือกในแอปได้ แต่ OS ยังคงเป็นผู้ตัดสินสิทธิ์จริง

- iOS/macOS อาจแสดง **ขณะใช้งาน** หรือ **ตลอดเวลา** ในพรอมป์/การตั้งค่าของระบบ
- ปัจจุบันแอป Android รองรับเฉพาะตำแหน่งขณะอยู่เบื้องหน้า
- ตำแหน่งแบบแม่นยำเป็นสิทธิ์แยกต่างหาก (iOS 14+ “Precise”, Android “fine” เทียบกับ “coarse”)

ตัวเลือกใน UI ใช้กำหนดโหมดที่เราร้องขอ; ส่วนสิทธิ์จริงอยู่ในค่าตั้งของ OS

## โมเดลการตั้งค่า

ต่ออุปกรณ์ Node หนึ่งเครื่อง:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

พฤติกรรมของ UI:

- การเลือก `whileUsing` จะร้องขอสิทธิ์แบบ foreground
- หาก OS ปฏิเสธระดับสิทธิ์ที่ร้องขอ ให้ย้อนกลับไปยังระดับสิทธิ์สูงสุดที่ได้รับ และแสดงสถานะ

## การแมปสิทธิ์ (`node.permissions`)

เป็นแบบไม่บังคับ Node บน macOS จะรายงาน `location` ผ่าน permissions map; ส่วน iOS/Android อาจไม่รายงานก็ได้

## คำสั่ง: `location.get`

เรียกผ่าน `node.invoke`

พารามิเตอร์ (แนะนำ):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

payload ของการตอบกลับ:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

ข้อผิดพลาด (โค้ดแบบคงที่):

- `LOCATION_DISABLED`: ตัวเลือกถูกปิดอยู่
- `LOCATION_PERMISSION_REQUIRED`: ไม่มีสิทธิ์สำหรับโหมดที่ร้องขอ
- `LOCATION_BACKGROUND_UNAVAILABLE`: แอปอยู่เบื้องหลัง แต่อนุญาตเฉพาะขณะใช้งาน
- `LOCATION_TIMEOUT`: ไม่ได้ตำแหน่งทันเวลา
- `LOCATION_UNAVAILABLE`: ระบบล้มเหลว / ไม่มี provider

## พฤติกรรมในเบื้องหลัง

- แอป Android จะปฏิเสธ `location.get` เมื่ออยู่เบื้องหลัง
- ควรเปิด OpenClaw ไว้เมื่อร้องขอตำแหน่งบน Android
- แพลตฟอร์ม Node อื่นอาจมีพฤติกรรมต่างกัน

## การเชื่อมกับโมเดล/เครื่องมือ

- พื้นผิวของเครื่องมือ: เครื่องมือ `nodes` เพิ่ม action `location_get` (ต้องระบุ Node)
- CLI: `openclaw nodes location get --node <id>`
- แนวทางสำหรับเอเจนต์: ควรเรียกใช้เฉพาะเมื่อผู้ใช้เปิดใช้ตำแหน่งแล้ว และเข้าใจขอบเขตของการใช้งาน

## ข้อความ UX (แนะนำ)

- ปิด: “การแชร์ตำแหน่งถูกปิดใช้งาน”
- ขณะใช้งาน: “เฉพาะเมื่อ OpenClaw เปิดอยู่”
- แม่นยำ: “ใช้ตำแหน่ง GPS แบบแม่นยำ ปิดสวิตช์นี้เพื่อแชร์ตำแหน่งแบบประมาณ”

## ที่เกี่ยวข้อง

- [การแยกวิเคราะห์ตำแหน่งของช่องทาง](/th/channels/location)
- [การจับภาพจากกล้อง](/th/nodes/camera)
- [โหมด Talk](/th/nodes/talk)
