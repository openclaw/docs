---
read_when:
    - การลงชื่อเข้าใช้ ClawHub
    - การใช้ ClawHub CLI
    - การดีบัก 401s
summary: การลงชื่อเข้าใช้ ClawHub, โทเค็น API, การเข้าสู่ระบบ CLI, การจัดเก็บโทเค็น และการเพิกถอน
x-i18n:
    generated_at: "2026-07-04T20:45:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# การยืนยันตัวตน

ClawHub ใช้ GitHub สำหรับการลงชื่อเข้าใช้บนเว็บ ส่วน CLI ใช้โทเค็น API ของ ClawHub ที่สร้างขึ้น
ผ่านบัญชีที่ลงชื่อเข้าใช้นั้น

## การลงชื่อเข้าใช้บนเว็บ

ใช้ GitHub เพื่อลงชื่อเข้าใช้ที่ [clawhub.ai](https://clawhub.ai)

บัญชีที่ถูกลบ ถูกแบน หรือถูกปิดใช้งานไม่สามารถลงชื่อเข้าใช้ ClawHub ตามปกติได้
หากการลงชื่อเข้าใช้พาคุณกลับไปยังสถานะที่ยังไม่ได้เข้าสู่ระบบ บัญชีของคุณอาจไม่ได้อยู่ในสถานะที่ดี
หากบัญชีของคุณถูกแบนหรือถูกปิดใช้งาน ให้ใช้
[แบบฟอร์มอุทธรณ์ของ ClawHub](https://appeals.openclaw.ai/) หากคุณเชื่อว่านี่เป็น
ข้อผิดพลาด

## การเข้าสู่ระบบ CLI

ขั้นตอนการเข้าสู่ระบบ CLI ตามค่าเริ่มต้นจะเปิดเบราว์เซอร์ของคุณ:

```bash
clawhub login
clawhub whoami
```

สิ่งที่เกิดขึ้น:

1. CLI เริ่มเซิร์ฟเวอร์ callback ชั่วคราวบน `127.0.0.1`
2. เบราว์เซอร์ของคุณเปิดหน้าลงชื่อเข้าใช้ ClawHub
3. หลังจากลงชื่อเข้าใช้ GitHub แล้ว ClawHub จะสร้างโทเค็น API
4. เบราว์เซอร์เปลี่ยนเส้นทางกลับไปยัง callback ภายในเครื่อง
5. CLI จัดเก็บโทเค็นไว้ในไฟล์ config ของ ClawHub ของคุณ

หากเบราว์เซอร์ของคุณไม่สามารถเข้าถึง callback ภายในเครื่องได้เนื่องจากกฎของไฟร์วอลล์, VPN หรือ
พร็อกซี ให้ใช้ขั้นตอนโทเค็นแบบ headless

## การเข้าสู่ระบบแบบ headless

สร้างโทเค็นใน UI เว็บของ ClawHub แล้วส่งต่อให้ CLI:

```bash
clawhub login --token clh_...
```

ใช้ขั้นตอนนี้สำหรับเซิร์ฟเวอร์ งาน CI หรือสภาพแวดล้อมที่มีเฉพาะเทอร์มินัล

สำหรับเชลล์ระยะไกลที่คุณสามารถเปิดเบราว์เซอร์ที่อื่นได้ ให้รัน:

```bash
clawhub login --device
```

CLI จะแสดงรหัสแบบใช้ครั้งเดียวและรอขณะที่คุณอนุญาตที่
`https://clawhub.ai/cli/device`

## การจัดเก็บโทเค็น

พาธ config เริ่มต้น:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

เขียนทับพาธด้วย:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

แสดงโทเค็นที่จัดเก็บไว้สำหรับการตั้งค่า CI ด้วย:

```bash
clawhub token
```

## การเพิกถอน

คุณสามารถเพิกถอนโทเค็น API ได้ใน UI เว็บของ ClawHub

โทเค็นที่ถูกเพิกถอน ไม่ถูกต้อง หรือขาดหายไปจะส่งคืน `401 Unauthorized` ลงชื่อเข้าใช้อีกครั้ง
ด้วย `clawhub login` หรือระบุโทเค็นใหม่ด้วย `clawhub login --token`

บัญชีที่ถูกลบ ถูกแบน หรือถูกปิดใช้งานไม่สามารถใช้โทเค็น API ที่มีอยู่ต่อไปได้
หากบัญชีของคุณถูกแบนหรือถูกปิดใช้งาน ให้ใช้
[แบบฟอร์มอุทธรณ์ของ ClawHub](https://appeals.openclaw.ai/) หากคุณเชื่อว่านี่เป็น
ข้อผิดพลาด
