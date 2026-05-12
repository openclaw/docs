---
read_when:
    - การลงชื่อเข้าใช้ ClawHub
    - การใช้ ClawHub CLI
    - การแก้ไขข้อผิดพลาด 401
summary: การลงชื่อเข้าใช้ ClawHub, โทเค็น API, การเข้าสู่ระบบ CLI, การจัดเก็บโทเค็น และการเพิกถอน
x-i18n:
    generated_at: "2026-05-12T23:28:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261f5a93200db8415e3bc8f35251c3486110ce8e076c482e846ad11f2ccd517f
    source_path: clawhub/auth.md
    workflow: 16
---

# การยืนยันตัวตน

ClawHub ใช้ GitHub สำหรับการลงชื่อเข้าใช้บนเว็บ CLI ใช้โทเค็น API ของ ClawHub ที่สร้าง
ผ่านบัญชีที่ลงชื่อเข้าใช้นั้น

## การลงชื่อเข้าใช้บนเว็บ

ใช้ GitHub เพื่อลงชื่อเข้าใช้ที่ [clawhub.ai](https://clawhub.ai)

บัญชีที่ถูกลบ ถูกแบน หรือถูกปิดใช้งานไม่สามารถดำเนินการลงชื่อเข้าใช้ ClawHub ตามปกติให้เสร็จสมบูรณ์ได้
หากการลงชื่อเข้าใช้พาคุณกลับไปยังสถานะที่ออกจากระบบแล้ว บัญชีของคุณอาจไม่ได้อยู่ในสถานะที่ดี

## การเข้าสู่ระบบ CLI

โฟลว์การเข้าสู่ระบบ CLI เริ่มต้นจะเปิดเบราว์เซอร์ของคุณ:

```bash
clawhub login
clawhub whoami
```

สิ่งที่เกิดขึ้น:

1. CLI เริ่มเซิร์ฟเวอร์ callback ชั่วคราวบน `127.0.0.1`
2. เบราว์เซอร์ของคุณเปิดหน้าลงชื่อเข้าใช้ ClawHub
3. หลังจากลงชื่อเข้าใช้ GitHub แล้ว ClawHub จะสร้างโทเค็น API
4. เบราว์เซอร์เปลี่ยนเส้นทางกลับไปยัง callback ในเครื่อง
5. CLI จัดเก็บโทเค็นไว้ในไฟล์ config ของ ClawHub

หากเบราว์เซอร์ของคุณไม่สามารถเข้าถึง callback ในเครื่องได้เนื่องจากกฎของไฟร์วอลล์ VPN หรือ
พร็อกซี ให้ใช้โฟลว์โทเค็นแบบ headless

## การเข้าสู่ระบบแบบ headless

สร้างโทเค็นในส่วนติดต่อเว็บของ ClawHub แล้วส่งให้ CLI:

```bash
clawhub login --token clh_...
```

ใช้โฟลว์นี้สำหรับเซิร์ฟเวอร์ งาน CI หรือสภาพแวดล้อมที่มีเฉพาะเทอร์มินัล

สำหรับเชลล์ระยะไกลที่คุณสามารถเปิดเบราว์เซอร์ที่อื่นได้ ให้รัน:

```bash
clawhub login --device
```

CLI จะพิมพ์รหัสแบบใช้ครั้งเดียวและรอขณะที่คุณอนุญาตที่
`https://clawhub.ai/cli/device`

## การจัดเก็บโทเค็น

พาธ config เริ่มต้น:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` หรือ `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

แทนที่พาธด้วย:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

## การเพิกถอน

คุณสามารถเพิกถอนโทเค็น API ได้ในส่วนติดต่อเว็บของ ClawHub

โทเค็นที่ถูกเพิกถอน ไม่ถูกต้อง หรือขาดหายไปจะส่งคืน `401 Unauthorized` ลงชื่อเข้าใช้อีกครั้ง
ด้วย `clawhub login` หรือระบุโทเค็นใหม่ด้วย `clawhub login --token`

บัญชีที่ถูกลบ ถูกแบน หรือถูกปิดใช้งานไม่สามารถใช้โทเค็น API ที่มีอยู่ต่อไปได้
