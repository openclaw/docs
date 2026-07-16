---
read_when:
    - การเพิ่มการรองรับ Node ตำแหน่งที่ตั้งหรือ UI การอนุญาต
    - การออกแบบสิทธิ์เข้าถึงตำแหน่งหรือการทำงานเบื้องหน้าบน Android
summary: คำสั่งตำแหน่งที่ตั้งสำหรับ Node โหมดสิทธิ์ของแพลตฟอร์ม และการตั้งค่า GeoClue บน Linux
title: คำสั่งตำแหน่งที่ตั้ง
x-i18n:
    generated_at: "2026-07-16T19:17:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 644229c1eafc8fc7b59bc23ba01d4ba95687ea66c4f9bd4a4cda98a87f2b6085
    source_path: nodes/location-command.md
    workflow: 16
---

## สรุปย่อ

- `location.get` เป็นคำสั่งของ Node ซึ่งเรียกใช้ผ่าน `node.invoke` หรือ `openclaw nodes location get`
- ปิดโดยค่าเริ่มต้น
- บิลด์ Android จากบุคคลที่สามใช้ตัวเลือก: ปิด / ขณะใช้งาน / ตลอดเวลา ส่วนบิลด์ Play ยังคงมีตัวเลือก ปิด / ขณะใช้งาน
- ตำแหน่งที่แม่นยำเป็นสวิตช์แยกต่างหาก

## เหตุใดจึงใช้ตัวเลือก (ไม่ใช่เพียงสวิตช์)

สิทธิ์เข้าถึงตำแหน่งของระบบปฏิบัติการมีหลายระดับ ตำแหน่งที่แม่นยำยังเป็นสิทธิ์ที่ระบบปฏิบัติการอนุญาตแยกต่างหากด้วย ("Precise" ใน iOS 14+ และ "fine" เทียบกับ "coarse" ใน Android) ตัวเลือกภายในแอปกำหนดโหมดที่ร้องขอ แต่ระบบปฏิบัติการยังคงเป็นผู้ตัดสินใจว่าจะให้สิทธิ์จริงในระดับใด

## โมเดลการตั้งค่า

สำหรับอุปกรณ์ Node แต่ละเครื่อง:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

ลักษณะการทำงานของ UI:

- การเลือก `whileUsing` จะร้องขอสิทธิ์ขณะใช้งานแอป
- การเลือก `always` ในบิลด์ Android จากบุคคลที่สามจะร้องขอสิทธิ์ขณะใช้งานแอปก่อน อธิบายการเข้าถึงเบื้องหลัง จากนั้นเปิดการตั้งค่าแอปของ Android เพื่อให้สิทธิ์ **Allow all the time** แยกต่างหาก
- บิลด์ Android Play ไม่ได้ประกาศสิทธิ์เข้าถึงตำแหน่งเบื้องหลังหรือแสดง `always`
- หากระบบปฏิบัติการปฏิเสธระดับที่ร้องขอ แอปจะย้อนกลับไปใช้ระดับสูงสุดที่ได้รับอนุญาตและแสดงสถานะ

## การแมปสิทธิ์ (node.permissions)

ไม่บังคับ Node บน macOS รายงาน `location` ผ่านแมป `permissions` บน `node.list`/`node.describe` ส่วน iOS/Android อาจไม่ระบุข้อมูลนี้

## คำสั่ง: `location.get`

เรียกผ่าน `node.invoke` หรือตัวช่วย CLI:

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

แฟล็ก CLI แมปโดยตรงดังนี้: `--location-timeout` -> `timeoutMs`, `--max-age` -> `maxAgeMs`, `--accuracy` -> `desiredAccuracy`

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

- `LOCATION_DISABLED`: ปิดตัวเลือกอยู่
- `LOCATION_PERMISSION_REQUIRED`: ไม่มีสิทธิ์สำหรับโหมดที่ร้องขอ
- `LOCATION_BACKGROUND_UNAVAILABLE`: แอปทำงานอยู่เบื้องหลัง แต่ได้รับอนุญาตเฉพาะขณะใช้งาน
- `LOCATION_TIMEOUT`: ไม่สามารถระบุตำแหน่งได้ภายในเวลาที่กำหนด
- `LOCATION_UNAVAILABLE`: ระบบขัดข้องหรือไม่มีผู้ให้บริการ

## ลักษณะการทำงานเบื้องหลัง

- บิลด์ Android จากบุคคลที่สามยอมรับ `location.get` ในเบื้องหลังเฉพาะเมื่อผู้ใช้เลือก `Always` และ Android อนุญาตตำแหน่งเบื้องหลังแล้วเท่านั้น บริการ Node แบบคงอยู่ที่มีอยู่จะเพิ่มประเภทบริการ `location` และแสดง `Location: Always` ขณะทำงาน
- บิลด์ Android Play และโหมด `While Using` จะปฏิเสธ `location.get` ขณะทำงานเบื้องหลัง
- แพลตฟอร์ม Node อื่นอาจมีลักษณะการทำงานแตกต่างกัน

## โฮสต์ Node บน Linux

Plugin Linux Node ที่ให้มาพร้อมระบบจะเพิ่ม `location.get` ให้กับบริการ CLI `openclaw node` รวมถึงโฮสต์แบบไม่มีส่วนติดต่อผู้ใช้ที่ไม่มีแอปเดสก์ท็อป Linux ตำแหน่งจะปิดโดยค่าเริ่มต้น เปิดใช้งานภายใต้รายการ Plugin จากนั้นเริ่มบริการ Node ใหม่:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          location: { enabled: true },
        },
      },
    },
  },
}
```

ติดตั้ง GeoClue2 และตัวอย่าง `where-am-i` ของ GeoClue2 (`geoclue-2-demo` บน Debian และ Ubuntu) ผู้ใช้บริการ Node ต้องได้รับอนุญาตจากนโยบาย GeoClue และเอเจนต์การอนุญาตของโฮสต์

Plugin ใช้ `where-am-i` แทนลำดับการเรียก `busctl` GeoClue ผูกการสร้างไคลเอนต์ คุณสมบัติ การเริ่มต้น การอัปเดต และการหยุดไว้กับการเชื่อมต่อไคลเอนต์ D-Bus เดียว ตัวอย่างจะคงวงจรชีวิตดังกล่าวไว้ด้วยกัน แต่โปรเซสย่อย `busctl` ที่แยกกันไม่สามารถทำได้ ไม่มีการเพิ่มการขึ้นต่อกันของ npm

Linux แมป `coarse`, `balanced` และ `precise` กับระดับความแม่นยำของ GeoClue ได้แก่ `4`, `6` และ `8` โดยจะตรวจสอบ `maxAgeMs` เทียบกับการประทับเวลาที่ส่งกลับ ตัวอย่างของ GeoClue ไม่เปิดเผยผู้ให้บริการที่เลือก ดังนั้น `source` จึงเป็น `unknown`; `isPrecise` จะเป็น true เฉพาะเมื่อความแม่นยำที่รายงานเท่ากับ 100 เมตรหรือดีกว่า

Linux ใช้ข้อผิดพลาดคงที่ชุดเดียวกัน ได้แก่ `LOCATION_DISABLED`, `LOCATION_TIMEOUT` และ `LOCATION_UNAVAILABLE`

## การผสานรวมโมเดล/เครื่องมือ

- เครื่องมือเอเจนต์: การดำเนินการ `location_get` ของเครื่องมือ `nodes` (ต้องมี Node)
- CLI: `openclaw nodes location get --node <id>`
- แนวทางสำหรับเอเจนต์: เรียกใช้เฉพาะเมื่อผู้ใช้เปิดใช้งานตำแหน่งและเข้าใจขอบเขตแล้วเท่านั้น

## ข้อความ UX (แนะนำ)

- ปิด: "ปิดใช้งานการแชร์ตำแหน่งแล้ว"
- ขณะใช้งาน: "เฉพาะเมื่อเปิด OpenClaw อยู่"
- ตลอดเวลา: "อนุญาตการตรวจสอบตำแหน่งที่ร้องขอขณะที่ OpenClaw ทำงานอยู่เบื้องหลัง"
- แม่นยำ: "ใช้ตำแหน่ง GPS ที่แม่นยำ ปิดสวิตช์เพื่อแชร์ตำแหน่งโดยประมาณ"

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมของ Node](/th/nodes)
- [การแยกวิเคราะห์ตำแหน่งของช่องทาง](/th/channels/location)
- [การจับภาพจากกล้อง](/th/nodes/camera)
- [โหมดพูดคุย](/th/nodes/talk)
