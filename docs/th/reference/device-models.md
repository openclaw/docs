---
read_when:
    - การอัปเดตการแมปตัวระบุรุ่นอุปกรณ์ หรือไฟล์ NOTICE/license
    - การเปลี่ยนวิธีที่ UI ของ Instances แสดงชื่ออุปกรณ์
summary: วิธีที่ OpenClaw vend Apple device model identifiers เป็นชื่อที่อ่านเข้าใจง่ายสำหรับใช้งานในแอป macOS
title: ฐานข้อมูลรุ่นอุปกรณ์
x-i18n:
    generated_at: "2026-04-25T13:58:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: f20e035f787ba7d9bb48d2a18263679d20b295e12ffb263a63c3a0ef72312d34
    source_path: reference/device-models.md
    workflow: 15
---

แอปคู่หูบน macOS จะแสดงชื่อรุ่นอุปกรณ์ Apple ที่อ่านเข้าใจง่ายใน UI ของ **Instances** โดยแมปตัวระบุรุ่นของ Apple (เช่น `iPad16,6`, `Mac16,6`) ไปเป็นชื่อที่มนุษย์อ่านได้

การแมปนี้ถูก vendor มาเป็น JSON ภายใต้:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## แหล่งข้อมูล

ปัจจุบันเรา vendor การแมปนี้มาจากรีโพสิตอรีที่ใช้สัญญาอนุญาต MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

เพื่อให้บิลด์มีความกำหนดแน่นอน ไฟล์ JSON จะถูก pin ไว้กับ upstream commits ที่เฉพาะเจาะจง (บันทึกไว้ใน `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`)

## การอัปเดตฐานข้อมูล

1. เลือก upstream commits ที่คุณต้องการ pin ไว้ (หนึ่งรายการสำหรับ iOS และหนึ่งรายการสำหรับ macOS)
2. อัปเดต commit hashes ใน `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`
3. ดาวน์โหลดไฟล์ JSON ใหม่ โดย pin กับ commits เหล่านั้น:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. ตรวจสอบให้แน่ใจว่า `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` ยังคงตรงกับ upstream (แทนที่ไฟล์นี้หากสัญญาอนุญาตของ upstream เปลี่ยนแปลง)
5. ตรวจสอบว่าแอป macOS บิลด์ผ่านอย่างสะอาด (ไม่มีคำเตือน):

```bash
swift build --package-path apps/macos
```

## ที่เกี่ยวข้อง

- [Nodes](/th/nodes)
- [Node troubleshooting](/th/nodes/troubleshooting)
