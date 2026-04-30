---
read_when:
    - คุณต้องการการรองรับ Zalo Personal (ไม่เป็นทางการ) ใน OpenClaw
    - คุณกำลังกำหนดค่าหรือพัฒนา Plugin zalouser
summary: 'Plugin Zalo Personal: การเข้าสู่ระบบด้วย QR + การส่งข้อความผ่าน zca-js แบบเนทีฟ (การติดตั้ง Plugin + การกำหนดค่าช่องทาง + เครื่องมือ)'
title: Plugin ส่วนบุคคลของ Zalo
x-i18n:
    generated_at: "2026-04-30T10:10:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4cbf56d81d4137706fb03b516f65b20f51a4e40ce301c2eaa7923ddc9ac0787f
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

การรองรับ Zalo Personal สำหรับ OpenClaw ผ่าน Plugin โดยใช้ `zca-js` แบบเนทีฟเพื่อทำงานอัตโนมัติกับบัญชีผู้ใช้ Zalo ปกติ

<Warning>
การทำงานอัตโนมัติที่ไม่เป็นทางการอาจทำให้บัญชีถูกระงับหรือถูกแบน ใช้งานโดยยอมรับความเสี่ยงเอง
</Warning>

## การตั้งชื่อ

รหัสช่องทางคือ `zalouser` เพื่อระบุให้ชัดเจนว่าสิ่งนี้ทำงานอัตโนมัติกับ **บัญชีผู้ใช้ Zalo ส่วนบุคคล** (ไม่เป็นทางการ) เราสงวน `zalo` ไว้สำหรับการผสานรวมกับ Zalo API อย่างเป็นทางการที่อาจมีในอนาคต

## ตำแหน่งที่ทำงาน

Plugin นี้ทำงาน **ภายในกระบวนการ Gateway**

หากคุณใช้ Gateway ระยะไกล ให้ติดตั้ง/กำหนดค่าบน **เครื่องที่รัน Gateway** แล้วรีสตาร์ท Gateway

ไม่จำเป็นต้องมีไบนารี CLI ภายนอก `zca`/`openzca`

## ติดตั้ง

### ตัวเลือก A: ติดตั้งจาก npm

```bash
openclaw plugins install @openclaw/zalouser
```

หาก npm รายงานว่าแพ็กเกจที่ OpenClaw เป็นเจ้าของถูกเลิกใช้แล้ว แพ็กเกจเวอร์ชันนั้นมาจากสายแพ็กเกจภายนอกที่เก่ากว่า ให้ใช้บิลด์ OpenClaw ที่แพ็กเกจแล้วในปัจจุบัน หรือใช้เส้นทางโฟลเดอร์ภายในเครื่องจนกว่าจะมีการเผยแพร่แพ็กเกจ npm ที่ใหม่กว่า

รีสตาร์ท Gateway หลังจากนั้น

### ตัวเลือก B: ติดตั้งจากโฟลเดอร์ภายในเครื่อง (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

รีสตาร์ท Gateway หลังจากนั้น

## การกำหนดค่า

การกำหนดค่าช่องทางอยู่ใต้ `channels.zalouser` (ไม่ใช่ `plugins.entries.*`):

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

การดำเนินการข้อความของช่องทางยังรองรับ `react` สำหรับการแสดงปฏิกิริยาต่อข้อความด้วย

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins)
- [Plugin ชุมชน](/th/plugins/community)
