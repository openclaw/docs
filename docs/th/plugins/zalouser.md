---
read_when:
    - คุณต้องการการรองรับ Zalo Personal (ไม่เป็นทางการ) ใน OpenClaw
    - คุณกำลังกำหนดค่าหรือพัฒนา Plugin zalouser
summary: 'Plugin Zalo Personal: การเข้าสู่ระบบด้วย QR + การส่งข้อความผ่าน zca-js แบบเนทีฟ (การติดตั้ง Plugin + การกำหนดค่าช่องทาง + เครื่องมือ)'
title: Plugin ส่วนบุคคลของ Zalo
x-i18n:
    generated_at: "2026-05-10T19:53:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 405348eac4c08cc6e28b22cfff615fa34c117dedc51a31613545c4057069c20b
    source_path: plugins/zalouser.md
    workflow: 16
---

รองรับ Zalo Personal สำหรับ OpenClaw ผ่าน Plugin โดยใช้ `zca-js` แบบเนทีฟเพื่อทำงานอัตโนมัติกับบัญชีผู้ใช้ Zalo ปกติ

<Warning>
การทำงานอัตโนมัติที่ไม่เป็นทางการอาจนำไปสู่การระงับหรือแบนบัญชี ใช้งานโดยรับความเสี่ยงเอง
</Warning>

## การตั้งชื่อ

รหัสช่องทางคือ `zalouser` เพื่อระบุให้ชัดเจนว่าสิ่งนี้ทำงานอัตโนมัติกับ**บัญชีผู้ใช้ Zalo ส่วนบุคคล** (ไม่เป็นทางการ) เราสงวน `zalo` ไว้สำหรับการผสานรวม Zalo API อย่างเป็นทางการที่อาจมีในอนาคต

## ตำแหน่งที่ทำงาน

Plugin นี้ทำงาน**ภายในโปรเซส Gateway**

หากคุณใช้ Gateway ระยะไกล ให้ติดตั้ง/กำหนดค่าบน**เครื่องที่รัน Gateway** แล้วรีสตาร์ท Gateway

ไม่จำเป็นต้องมีไบนารี CLI ภายนอก `zca`/`openzca`

## ติดตั้ง

### ตัวเลือก A: ติดตั้งจาก npm

```bash
openclaw plugins install @openclaw/zalouser
```

ใช้แพ็กเกจแบบไม่ระบุเวอร์ชันเพื่อติดตามแท็กรุ่นทางการปัจจุบัน ปักหมุดเวอร์ชันที่แน่นอน
เฉพาะเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้เท่านั้น

รีสตาร์ท Gateway หลังจากนั้น

### ตัวเลือก B: ติดตั้งจากโฟลเดอร์ภายในเครื่อง (สำหรับพัฒนา)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

รีสตาร์ท Gateway หลังจากนั้น

## การกำหนดค่า

การกำหนดค่าช่องทางอยู่ภายใต้ `channels.zalouser` (ไม่ใช่ `plugins.entries.*`):

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## เครื่องมือ Agent

ชื่อเครื่องมือ: `zalouser`

การกระทำ: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

การกระทำข้อความช่องทางยังรองรับ `react` สำหรับการแสดงปฏิกิริยาต่อข้อความด้วย

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ClawHub](/th/clawhub)
