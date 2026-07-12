---
read_when:
    - คุณต้องการลบบริการ Gateway และ/หรือสถานะภายในเครื่อง
    - คุณต้องการทดลองรันก่อน
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw uninstall` (ลบบริการ Gateway และข้อมูลภายในเครื่อง)
title: ถอนการติดตั้ง
x-i18n:
    generated_at: "2026-07-12T16:04:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

ถอนการติดตั้งบริการ Gateway และ/หรือข้อมูลภายในเครื่อง โดยจะไม่ลบตัว CLI เอง
โปรดถอนการติดตั้ง CLI ผ่าน npm/pnpm แยกต่างหาก

## ตัวเลือก

| แฟล็ก                | ค่าเริ่มต้น | คำอธิบาย                                                        |
| ------------------- | ------- | ------------------------------------------------------------ |
| `--service`         | `false` | ลบบริการ Gateway                                               |
| `--state`           | `false` | ลบสถานะและการกำหนดค่า                                            |
| `--workspace`       | `false` | ลบไดเรกทอรีพื้นที่ทำงาน                                            |
| `--app`             | `false` | ลบแอป macOS                                                   |
| `--all`             | `false` | รูปแบบย่อของ `--service --state --workspace --app`               |
| `--yes`             | `false` | ข้ามข้อความแจ้งให้ยืนยัน                                           |
| `--non-interactive` | `false` | ปิดใช้งานข้อความแจ้ง ต้องใช้ร่วมกับ `--yes`                           |
| `--dry-run`         | `false` | แสดงการดำเนินการที่วางแผนไว้โดยไม่ลบไฟล์                              |

หากไม่ระบุแฟล็กขอบเขต ระบบโต้ตอบจะแสดงตัวเลือกแบบเลือกได้หลายรายการเพื่อให้เลือกคอมโพเนนต์
ที่จะลบ (โดยค่าเริ่มต้นจะเลือกบริการ สถานะ และพื้นที่ทำงานไว้ล่วงหน้า)

## ตัวอย่าง

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## หมายเหตุ

- เรียกใช้ `openclaw backup create` ก่อน เพื่อสร้างสแนปช็อตที่สามารถกู้คืนได้ก่อนลบ
  สถานะหรือพื้นที่ทำงาน
- `--state` จะเก็บไดเรกทอรีพื้นที่ทำงานที่กำหนดค่าไว้ เว้นแต่จะเลือก `--workspace`
  ร่วมด้วย

## เนื้อหาที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [การถอนการติดตั้ง](/th/install/uninstall)
