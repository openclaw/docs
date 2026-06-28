---
read_when:
    - กำลังเพิ่มหรือแก้ไขการแยกวิเคราะห์ตำแหน่งของ channel
    - การใช้ฟิลด์บริบทของตำแหน่งในพรอมป์ต์ของเอเจนต์หรือเครื่องมือ
summary: การแยกวิเคราะห์ตำแหน่งจาก channel ขาเข้า (Telegram/WhatsApp/Matrix) และฟิลด์บริบท
title: การแยกวิเคราะห์ตำแหน่งของ channel
x-i18n:
    generated_at: "2026-04-24T08:58:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19c10a55e30c70a7af5d041f9a25c0a2783e3191403e7c0cedfbe7dd8f1a77c1
    source_path: channels/location.md
    workflow: 15
    postprocess_version: locale-links-v1
---

OpenClaw ทำการทำให้ข้อมูลตำแหน่งที่แชร์มาจาก chat channels อยู่ในรูปแบบมาตรฐานดังนี้:

- ข้อความพิกัดแบบย่อที่ต่อท้ายเข้าไปในเนื้อหาขาเข้า และ
- ฟิลด์แบบมีโครงสร้างใน payload บริบทการตอบกลับอัตโนมัติ ป้ายกำกับ ที่อยู่ และคำบรรยาย/ความคิดเห็นที่มาจาก channel จะถูกเรนเดอร์เข้าไปในพรอมป์ต์ผ่านบล็อก JSON ของ metadata ที่ไม่เชื่อถือร่วมกัน ไม่ได้แทรกแบบอินไลน์ในเนื้อหาของผู้ใช้

ปัจจุบันรองรับ:

- **Telegram** (หมุดตำแหน่ง + สถานที่ + ตำแหน่งสด)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)
- **Matrix** (`m.location` พร้อม `geo_uri`)

## การจัดรูปแบบข้อความ

ตำแหน่งจะถูกเรนเดอร์เป็นบรรทัดที่อ่านง่ายโดยไม่มีวงเล็บ:

- หมุด:
  - `📍 48.858844, 2.294351 ±12m`
- สถานที่ที่มีชื่อ:
  - `📍 48.858844, 2.294351 ±12m`
- การแชร์แบบสด:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

หาก channel มีป้ายกำกับ ที่อยู่ หรือคำบรรยาย/ความคิดเห็น ข้อมูลนั้นจะถูกเก็บไว้ใน payload บริบทและจะแสดงในพรอมป์ต์เป็น JSON แบบ fenced ที่ไม่เชื่อถือ:

````text
ตำแหน่ง (metadata ที่ไม่เชื่อถือ):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "name": "Eiffel Tower",
  "address": "Champ de Mars, Paris",
  "caption": "Meet here"
}
```
````

## ฟิลด์บริบท

เมื่อมีข้อมูลตำแหน่ง ระบบจะเพิ่มฟิลด์เหล่านี้ลงใน `ctx`:

- `LocationLat` (number)
- `LocationLon` (number)
- `LocationAccuracy` (number, เมตร; ไม่บังคับ)
- `LocationName` (string; ไม่บังคับ)
- `LocationAddress` (string; ไม่บังคับ)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (boolean)
- `LocationCaption` (string; ไม่บังคับ)

ตัวเรนเดอร์พรอมป์ต์จะถือว่า `LocationName`, `LocationAddress` และ `LocationCaption` เป็น metadata ที่ไม่เชื่อถือ และทำการ serialize ผ่านเส้นทาง JSON แบบมีขอบเขตเดียวกับที่ใช้สำหรับบริบท channel อื่นๆ

## หมายเหตุของ channel

- **Telegram**: สถานที่จะถูกแมปไปยัง `LocationName/LocationAddress`; ตำแหน่งสดใช้ `live_period`
- **WhatsApp**: `locationMessage.comment` และ `liveLocationMessage.caption` จะเติมค่าให้ `LocationCaption`
- **Matrix**: `geo_uri` จะถูกแยกวิเคราะห์เป็นตำแหน่งแบบหมุด; ระบบจะละเว้น altitude และ `LocationIsLive` จะเป็น false เสมอ

## ที่เกี่ยวข้อง

- [Location command (nodes)](/th/nodes/location-command)
- [Camera capture](/th/nodes/camera)
- [Media understanding](/th/nodes/media-understanding)
