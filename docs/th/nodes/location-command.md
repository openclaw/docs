---
read_when:
    - การเพิ่มการรองรับ Node ตำแหน่งที่ตั้งหรือ UI การอนุญาต
    - การออกแบบสิทธิ์เข้าถึงตำแหน่งที่ตั้งหรือการทำงานเบื้องหน้าบน Android
summary: คำสั่งระบุตำแหน่งสำหรับ Node (`location.get`), โหมดสิทธิ์ และลักษณะการทำงานเบื้องหน้าของ Android
title: คำสั่งตำแหน่งที่ตั้ง
x-i18n:
    generated_at: "2026-07-12T16:19:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fae9f7707620f3f743d40c07618a431a6baa7a357dda6d74021bc986cd4974b1
    source_path: nodes/location-command.md
    workflow: 16
---

## สรุปย่อ

- `location.get` เป็นคำสั่งของ Node ซึ่งเรียกใช้ผ่าน `node.invoke` หรือ `openclaw nodes location get`
- ปิดไว้โดยค่าเริ่มต้น
- บิลด์ Android จากภายนอกใช้ตัวเลือก: ปิด / ขณะใช้งาน / ตลอดเวลา ส่วนบิลด์ Play ยังคงมีเฉพาะ ปิด / ขณะใช้งาน
- ตำแหน่งที่แม่นยำเป็นตัวเลือกเปิด/ปิดแยกต่างหาก

## เหตุใดจึงใช้ตัวเลือก (ไม่ใช่เพียงสวิตช์)

สิทธิ์เข้าถึงตำแหน่งของระบบปฏิบัติการมีหลายระดับ ตำแหน่งที่แม่นยำก็เป็นสิทธิ์จากระบบปฏิบัติการที่แยกต่างหากเช่นกัน (iOS 14+ ใช้ "Precise" ส่วน Android แยก "fine" กับ "coarse") ตัวเลือกภายในแอปกำหนดโหมดที่ร้องขอ แต่ระบบปฏิบัติการยังคงเป็นผู้ตัดสินใจว่าจะให้สิทธิ์จริงในระดับใด

## โมเดลการตั้งค่า

สำหรับอุปกรณ์ Node แต่ละเครื่อง:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

พฤติกรรมของ UI:

- การเลือก `whileUsing` จะร้องขอสิทธิ์การใช้งานขณะอยู่เบื้องหน้า
- เมื่อเลือก `always` ในบิลด์ Android จากภายนอก แอปจะร้องขอสิทธิ์ขณะอยู่เบื้องหน้าก่อน อธิบายการเข้าถึงในเบื้องหลัง แล้วเปิดการตั้งค่าแอปของ Android เพื่อขอสิทธิ์ **Allow all the time** แยกต่างหาก
- บิลด์ Android Play จะไม่ประกาศสิทธิ์เข้าถึงตำแหน่งในเบื้องหลังหรือแสดง `always`
- หากระบบปฏิบัติการปฏิเสธระดับที่ร้องขอ แอปจะย้อนกลับไปใช้ระดับสูงสุดที่ได้รับอนุญาตและแสดงสถานะ

## การจับคู่สิทธิ์ (node.permissions)

เป็นทางเลือก Node บน macOS จะรายงาน `location` ผ่านแมป `permissions` ใน `node.list`/`node.describe` ส่วน iOS/Android อาจไม่รายงานข้อมูลนี้

## คำสั่ง: `location.get`

เรียกใช้ผ่าน `node.invoke` หรือตัวช่วย CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

พารามิเตอร์:

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

แฟล็ก CLI จับคู่โดยตรงดังนี้: `--location-timeout` -> `timeoutMs`, `--max-age` -> `maxAgeMs`, `--accuracy` -> `desiredAccuracy`

เพย์โหลดการตอบกลับ:

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

ข้อผิดพลาด (รหัสคงที่):

- `LOCATION_DISABLED`: ตัวเลือกถูกตั้งเป็นปิด
- `LOCATION_PERMISSION_REQUIRED`: ไม่มีสิทธิ์สำหรับโหมดที่ร้องขอ
- `LOCATION_BACKGROUND_UNAVAILABLE`: แอปอยู่ในเบื้องหลัง แต่ได้รับอนุญาตเฉพาะขณะใช้งาน
- `LOCATION_TIMEOUT`: ไม่สามารถระบุตำแหน่งได้ภายในเวลาที่กำหนด
- `LOCATION_UNAVAILABLE`: ระบบล้มเหลวหรือไม่มีผู้ให้บริการตำแหน่ง

## พฤติกรรมในเบื้องหลัง

- บิลด์ Android จากภายนอกจะยอมรับ `location.get` ในเบื้องหลังเฉพาะเมื่อผู้ใช้เลือก `Always` และ Android อนุญาตตำแหน่งในเบื้องหลังแล้วเท่านั้น บริการ Node แบบทำงานต่อเนื่องที่มีอยู่จะเพิ่มประเภทบริการ `location` และแสดง `Location: Always` ขณะทำงาน
- บิลด์ Android Play และโหมด `While Using` จะปฏิเสธ `location.get` ขณะอยู่ในเบื้องหลัง
- แพลตฟอร์ม Node อื่นอาจมีพฤติกรรมแตกต่างกัน

## การผสานรวมโมเดล/เครื่องมือ

- เครื่องมือของเอเจนต์: การดำเนินการ `location_get` ของเครื่องมือ `nodes` (ต้องระบุ Node)
- CLI: `openclaw nodes location get --node <id>`
- แนวทางสำหรับเอเจนต์: เรียกใช้เฉพาะเมื่อผู้ใช้เปิดใช้งานตำแหน่งและเข้าใจขอบเขตแล้ว

## ข้อความ UX (แนะนำ)

- ปิด: "ปิดใช้งานการแชร์ตำแหน่งแล้ว"
- ขณะใช้งาน: "เฉพาะเมื่อเปิด OpenClaw อยู่เท่านั้น"
- ตลอดเวลา: "อนุญาตให้ตรวจสอบตำแหน่งตามคำขอขณะที่ OpenClaw อยู่ในเบื้องหลัง"
- แม่นยำ: "ใช้ตำแหน่ง GPS ที่แม่นยำ ปิดตัวเลือกนี้เพื่อแชร์ตำแหน่งโดยประมาณ"

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวม Node](/th/nodes)
- [การแยกวิเคราะห์ตำแหน่งของช่องทาง](/th/channels/location)
- [การจับภาพจากกล้อง](/th/nodes/camera)
- [โหมดสนทนา](/th/nodes/talk)
