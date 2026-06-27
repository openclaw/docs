---
read_when:
    - คุณต้องการลบบริการ Gateway และ/หรือสถานะภายในเครื่อง
    - คุณต้องการทดลองรันก่อน
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw uninstall` (ลบบริการ Gateway + ข้อมูลภายในเครื่อง)
title: ถอนการติดตั้ง
x-i18n:
    generated_at: "2026-06-27T17:24:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f90fa8cf513e2e8cd422c3b8a880e7fd20fb71131a3ec88260e765daa2ace543
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

ถอนการติดตั้งบริการ Gateway + ข้อมูลภายในเครื่อง (CLI ยังคงอยู่)

ตัวเลือก:

- `--service`: ลบบริการ Gateway
- `--state`: ลบสถานะและการกำหนดค่า
- `--workspace`: ลบไดเรกทอรี workspace
- `--app`: ลบแอป macOS
- `--all`: ลบบริการ สถานะ workspace และแอป
- `--yes`: ข้ามพรอมต์ยืนยัน
- `--non-interactive`: ปิดใช้พรอมต์; ต้องใช้ `--yes`
- `--dry-run`: แสดงการดำเนินการโดยไม่ลบไฟล์

ตัวอย่าง:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

หมายเหตุ:

- เรียกใช้ `openclaw backup create` ก่อน หากคุณต้องการสแนปช็อตที่กู้คืนได้ก่อนลบสถานะหรือ workspace
- `--state` จะคงไดเรกทอรี workspace ที่กำหนดค่าไว้ เว้นแต่จะเลือก `--workspace` ด้วย
- `--all` เป็นคำย่อสำหรับการลบบริการ สถานะ workspace และแอปพร้อมกัน
- `--non-interactive` ต้องใช้ `--yes`

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [ถอนการติดตั้ง](/th/install/uninstall)
