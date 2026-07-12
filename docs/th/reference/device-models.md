---
read_when:
    - การอัปเดตการแมปตัวระบุรุ่นอุปกรณ์หรือไฟล์ NOTICE/ใบอนุญาต
    - การเปลี่ยนวิธีที่ UI ของอินสแตนซ์แสดงชื่ออุปกรณ์
summary: วิธีที่ OpenClaw รวมตัวระบุรุ่นอุปกรณ์ Apple ไว้ในซอร์สเพื่อใช้เป็นชื่อที่อ่านเข้าใจง่ายในแอป macOS
title: ฐานข้อมูลรุ่นอุปกรณ์
x-i18n:
    generated_at: "2026-07-12T16:41:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

UI **อินสแตนซ์** ของแอปคู่หูบน macOS จับคู่ตัวระบุรุ่นของ Apple กับชื่อที่อ่านเข้าใจง่าย (`iPad16,6` -> "iPad Pro 13 นิ้ว (M4)", `Mac16,6` -> "MacBook Pro (14 นิ้ว, 2024)") นอกจากนี้ `DeviceModelCatalog` ยังใช้คำนำหน้าตัวระบุ (และใช้ตระกูลอุปกรณ์เป็นทางเลือกสำรอง) เพื่อเลือก SF Symbol สำหรับอุปกรณ์แต่ละเครื่อง

ไฟล์ใน `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`:

| ไฟล์                                   | วัตถุประสงค์                               |
| -------------------------------------- | ------------------------------------- |
| `ios-device-identifiers.json`          | การจับคู่ตัวระบุ iOS/iPadOS -> ชื่อ |
| `mac-device-identifiers.json`          | การจับคู่ตัวระบุ Mac -> ชื่อ        |
| `NOTICE.md`                            | SHA ของคอมมิตต้นทางที่ตรึงไว้           |
| `LICENSE.apple-device-identifiers.txt` | ใบอนุญาต MIT ของต้นทาง                  |

## แหล่งข้อมูล

นำมาไว้ในโครงการจากรีโพซิทอรี GitHub `kyle-seongwoo-jun/apple-device-identifiers` ซึ่งใช้ใบอนุญาต MIT ไฟล์ JSON ถูกตรึงไว้กับ SHA ของคอมมิตที่บันทึกใน `NOTICE.md` เพื่อให้ผลลัพธ์การบิลด์เป็นแบบกำหนดได้แน่นอน

## การอัปเดตฐานข้อมูล

1. เลือก SHA ของคอมมิตต้นทางที่จะตรึงไว้ (หนึ่งรายการสำหรับ iOS และหนึ่งรายการสำหรับ macOS)
2. อัปเดต `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` ด้วย SHA ใหม่
3. ดาวน์โหลดไฟล์ JSON ที่ตรึงไว้กับคอมมิตเหล่านั้นอีกครั้ง:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. ยืนยันว่า `LICENSE.apple-device-identifiers.txt` ยังคงตรงกับต้นทาง หากใบอนุญาตต้นทางมีการเปลี่ยนแปลง ให้แทนที่ไฟล์นี้
5. ตรวจสอบว่าแอป macOS บิลด์ได้สำเร็จโดยไม่มีข้อผิดพลาด:

```bash
swift build --package-path apps/macos
```

## เนื้อหาที่เกี่ยวข้อง

- [Node](/th/nodes)
- [การแก้ไขปัญหา Node](/th/nodes/troubleshooting)
