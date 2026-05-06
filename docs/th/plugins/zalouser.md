---
read_when:
    - คุณต้องการให้ OpenClaw รองรับ Zalo Personal (ไม่เป็นทางการ)
    - คุณกำลังกำหนดค่าหรือพัฒนา Plugin zalouser
summary: 'Plugin Zalo Personal: การเข้าสู่ระบบด้วย QR + การส่งข้อความผ่าน zca-js แบบเนทีฟ (การติดตั้ง Plugin + การกำหนดค่าช่องทาง + เครื่องมือ)'
title: Plugin ส่วนบุคคลสำหรับ Zalo
x-i18n:
    generated_at: "2026-05-06T18:00:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423325f99ddb5b39bba4c5f3aa71215edfdc092c872f92b5d2f00b6ea691246f
    source_path: plugins/zalouser.md
    workflow: 16
---

การรองรับ Zalo Personal สำหรับ OpenClaw ผ่าน Plugin โดยใช้ `zca-js` แบบเนทีฟเพื่อทำให้บัญชีผู้ใช้ Zalo ปกติทำงานอัตโนมัติ

<Warning>
การทำงานอัตโนมัติแบบไม่เป็นทางการอาจทำให้บัญชีถูกระงับหรือแบน ใช้งานโดยรับความเสี่ยงเอง
</Warning>

## การตั้งชื่อ

Channel id คือ `zalouser` เพื่อระบุให้ชัดเจนว่าสิ่งนี้ทำให้ **บัญชีผู้ใช้ Zalo ส่วนบุคคล** ทำงานอัตโนมัติ (ไม่เป็นทางการ) เราสงวน `zalo` ไว้สำหรับการผสานรวม Zalo API อย่างเป็นทางการที่อาจมีในอนาคต

## ตำแหน่งที่รัน

Plugin นี้รัน **ภายในกระบวนการ Gateway**

หากคุณใช้ Gateway ระยะไกล ให้ติดตั้ง/กำหนดค่าบน **เครื่องที่รัน Gateway** แล้วรีสตาร์ท Gateway

ไม่จำเป็นต้องใช้ไบนารี CLI ภายนอกของ `zca`/`openzca`

## ติดตั้ง

### ตัวเลือก A: ติดตั้งจาก npm

```bash
openclaw plugins install @openclaw/zalouser
```

ใช้แพ็กเกจแบบไม่ระบุเวอร์ชันเพื่อให้ตามแท็กรุ่นอย่างเป็นทางการปัจจุบัน ปักหมุดเวอร์ชันที่แน่นอนเฉพาะเมื่อคุณต้องการการติดตั้งที่ทำซ้ำได้เท่านั้น

รีสตาร์ท Gateway หลังจากนั้น

### ตัวเลือก B: ติดตั้งจากโฟลเดอร์ในเครื่อง (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

รีสตาร์ท Gateway หลังจากนั้น

## การกำหนดค่า

การกำหนดค่า Channel อยู่ภายใต้ `channels.zalouser` (ไม่ใช่ `plugins.entries.*`):

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

การดำเนินการ: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

การดำเนินการกับข้อความ Channel ยังรองรับ `react` สำหรับการแสดงปฏิกิริยาต่อข้อความด้วย

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [Plugin ชุมชน](/th/plugins/community)
