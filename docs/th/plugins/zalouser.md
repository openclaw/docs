---
read_when:
    - คุณต้องการให้ OpenClaw รองรับ Zalo Personal (อย่างไม่เป็นทางการ)
    - คุณกำลังกำหนดค่าหรือพัฒนา Plugin zalouser
summary: 'Plugin Zalo Personal: เข้าสู่ระบบด้วย QR + ส่งข้อความผ่าน zca-js แบบเนทีฟ (การติดตั้ง Plugin + การกำหนดค่าช่องทาง + เครื่องมือ)'
title: Plugin ส่วนบุคคลของ Zalo
x-i18n:
    generated_at: "2026-07-12T16:32:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

การรองรับ Zalo ส่วนบุคคลสำหรับ OpenClaw ผ่าน Plugin ที่ใช้ `zca-js` แบบเนทีฟเพื่อทำงานอัตโนมัติกับบัญชีผู้ใช้ Zalo ทั่วไป โดยไม่จำเป็นต้องใช้ไบนารี CLI ภายนอก `zca`/`openzca`

<Warning>
การทำงานอัตโนมัติอย่างไม่เป็นทางการอาจทำให้บัญชีถูกระงับหรือแบน โปรดใช้โดยยอมรับความเสี่ยงด้วยตนเอง
</Warning>

## การตั้งชื่อ

รหัสช่องคือ `zalouser` เพื่อระบุอย่างชัดเจนว่าช่องนี้ทำงานอัตโนมัติกับ **บัญชีผู้ใช้ Zalo ส่วนบุคคล** (อย่างไม่เป็นทางการ) ส่วนรหัสช่อง `zalo` ที่แยกต่างหากคือการผสานรวม Zalo Bot/Webhook อย่างเป็นทางการที่รวมมาให้แล้ว โปรดดู [Zalo](/th/channels/zalo)

## ตำแหน่งที่ทำงาน

Plugin นี้ทำงาน **ภายในกระบวนการ Gateway** สำหรับ Gateway ระยะไกล ให้ติดตั้งและกำหนดค่าบนโฮสต์นั้น แล้วรีสตาร์ต Gateway

## การติดตั้ง

### จาก npm

```bash
openclaw plugins install @openclaw/zalouser
```

ใช้แพ็กเกจเปล่าเพื่อติดตามแท็กรีลีสอย่างเป็นทางการล่าสุด ระบุเวอร์ชันที่แน่นอนเฉพาะเมื่อต้องการให้การติดตั้งทำซ้ำได้ จากนั้นรีสตาร์ต Gateway

### จากโฟลเดอร์ภายในเครื่อง (การพัฒนา)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

จากนั้นรีสตาร์ต Gateway

## การกำหนดค่า

การกำหนดค่าช่องอยู่ภายใต้ `channels.zalouser` (ไม่ใช่ `plugins.entries.*`):

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

โปรดดู [การกำหนดค่าช่อง Zalo ส่วนบุคคล](/th/channels/zalouser) สำหรับการควบคุมการเข้าถึงข้อความส่วนตัว/กลุ่ม การตั้งค่าหลายบัญชี ตัวแปรสภาพแวดล้อม และการแก้ไขปัญหา

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels login --channel zalouser --account <name>
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "name"
openclaw directory groups members --channel zalouser --group-id <id>
```

## เครื่องมือเอเจนต์

ชื่อเครื่องมือ: `zalouser`

การดำเนินการ: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

การดำเนินการกับข้อความของช่อง (ไม่ใช่เครื่องมือเอเจนต์) ยังรองรับ `react` สำหรับการแสดงปฏิกิริยาต่อข้อความด้วย

## ที่เกี่ยวข้อง

- [การกำหนดค่าช่อง Zalo ส่วนบุคคล](/th/channels/zalouser)
- [Zalo (ช่อง Bot/Webhook อย่างเป็นทางการ)](/th/channels/zalo)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ClawHub](/clawhub)
