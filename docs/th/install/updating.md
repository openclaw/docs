---
read_when:
    - การอัปเดต OpenClaw
    - มีบางอย่างเสียหลังการอัปเดต
summary: การอัปเดต OpenClaw อย่างปลอดภัย (การติดตั้งแบบโกลบอลหรือจาก source) พร้อมกลยุทธ์การย้อนกลับ
title: การอัปเดต
x-i18n:
    generated_at: "2026-04-25T13:50:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: af88eaa285145dd5fc370b28c0f9d91069b815c75ec416df726cfce4271a6b54
    source_path: install/updating.md
    workflow: 15
---

อัปเดต OpenClaw ให้เป็นเวอร์ชันล่าสุดอยู่เสมอ

## แนะนำ: `openclaw update`

วิธีที่เร็วที่สุดในการอัปเดต มันจะตรวจจับประเภทการติดตั้งของคุณ (npm หรือ git) ดึงเวอร์ชันล่าสุด รัน `openclaw doctor` และรีสตาร์ต gateway

```bash
openclaw update
```

หากต้องการสลับ channel หรือกำหนดเวอร์ชันเฉพาะ:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`--channel beta` จะให้ความสำคัญกับ beta แต่รันไทม์จะ fallback ไปใช้ stable/latest เมื่อ
ไม่มี beta tag หรือเก่ากว่า stable release ล่าสุด ใช้ `--tag beta`
หากคุณต้องการ npm beta dist-tag แบบดิบสำหรับการอัปเดตแพ็กเกจแบบครั้งเดียว

ดู [Development channels](/th/install/development-channels) สำหรับความหมายของ channel

## ทางเลือก: รันตัวติดตั้งอีกครั้ง

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

เพิ่ม `--no-onboard` เพื่อข้าม onboarding สำหรับการติดตั้งจาก source ให้ส่ง `--install-method git --no-onboard`

## ทางเลือก: npm, pnpm หรือ bun แบบแมนนวล

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### การติดตั้ง npm แบบโกลบอลและ runtime dependencies

OpenClaw จะถือว่าการติดตั้งแบบแพ็กเกจโกลบอลเป็นแบบอ่านอย่างเดียวระหว่างรันไทม์ แม้ว่า
ไดเรกทอรีแพ็กเกจโกลบอลจะเขียนได้โดยผู้ใช้ปัจจุบันก็ตาม bundled plugin runtime
dependencies จะถูกจัดเตรียมไว้ในไดเรกทอรีรันไทม์ที่เขียนได้ แทนการแก้ไข
ต้นไม้แพ็กเกจ วิธีนี้ช่วยป้องกันไม่ให้ `openclaw update` แข่งกันกับ gateway หรือ
local agent ที่กำลังซ่อมแซม plugin dependencies ระหว่างการติดตั้งเดียวกัน

การตั้งค่า npm บางแบบบน Linux จะติดตั้งแพ็กเกจโกลบอลไว้ใต้ไดเรกทอรีที่ root เป็นเจ้าของ เช่น `/usr/lib/node_modules/openclaw` OpenClaw รองรับ
โครงสร้างนี้ผ่านเส้นทางการจัดเตรียมภายนอกแบบเดียวกัน

สำหรับ systemd units แบบ hardened ให้ตั้งค่าไดเรกทอรี staging ที่เขียนได้และรวมไว้ใน
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

หากไม่ได้ตั้ง `OPENCLAW_PLUGIN_STAGE_DIR` OpenClaw จะใช้ `$STATE_DIRECTORY` เมื่อ
systemd จัดให้ จากนั้นจึง fallback ไปใช้ `~/.openclaw/plugin-runtime-deps`

### bundled plugin runtime dependencies

การติดตั้งแบบแพ็กเกจจะเก็บ bundled plugin runtime dependencies ไว้นอก
ต้นไม้แพ็กเกจแบบอ่านอย่างเดียว ในการเริ่มต้นและระหว่าง `openclaw doctor --fix`, OpenClaw จะซ่อมแซม
runtime dependencies เฉพาะสำหรับ bundled plugins ที่ active ใน config, active
ผ่าน legacy channel config หรือถูกเปิดใช้โดย bundled manifest default

การปิดใช้งานอย่างชัดเจนมีผลเหนือกว่า Plugin หรือ channel ที่ถูกปิดใช้งานจะไม่ถูก
ซ่อมแซม runtime dependencies เพียงเพราะมันมีอยู่ในแพ็กเกจ External
plugins และ custom load paths ยังคงใช้ `openclaw plugins install` หรือ
`openclaw plugins update`

## Auto-updater

auto-updater ปิดอยู่เป็นค่าเริ่มต้น เปิดใช้งานได้ใน `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Channel  | พฤติกรรม                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| `stable` | รอ `stableDelayHours` แล้วจึงใช้การอัปเดตพร้อม deterministic jitter ภายใน `stableJitterHours` (กระจายการ rollout) |
| `beta`   | ตรวจทุก `betaCheckIntervalHours` (ค่าเริ่มต้น: ทุกชั่วโมง) และใช้ทันที                                          |
| `dev`    | ไม่มีการใช้โดยอัตโนมัติ ใช้ `openclaw update` ด้วยตนเอง                                                        |

gateway จะบันทึกคำแนะนำการอัปเดตในตอนเริ่มต้นด้วย (ปิดได้ด้วย `update.checkOnStart: false`)

## หลังการอัปเดต

<Steps>

### รัน doctor

```bash
openclaw doctor
```

ย้าย config ตรวจสอบนโยบาย DM และตรวจสุขภาพ gateway รายละเอียด: [Doctor](/th/gateway/doctor)

### รีสตาร์ต gateway

```bash
openclaw gateway restart
```

### ตรวจสอบ

```bash
openclaw health
```

</Steps>

## การย้อนกลับ

### ปักหมุดเวอร์ชัน (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

เคล็ดลับ: `npm view openclaw version` จะแสดงเวอร์ชันที่เผยแพร่อยู่ปัจจุบัน

### ปักหมุด commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

หากต้องการกลับไปยังเวอร์ชันล่าสุด: `git checkout main && git pull`

## หากคุณติดปัญหา

- รัน `openclaw doctor` อีกครั้งและอ่านผลลัพธ์อย่างละเอียด
- สำหรับ `openclaw update --channel dev` บน source checkouts ตัวอัปเดตจะ bootstrap `pnpm` ให้อัตโนมัติเมื่อจำเป็น หากคุณเห็นข้อผิดพลาดเกี่ยวกับการ bootstrap pnpm/corepack ให้ติดตั้ง `pnpm` ด้วยตนเอง (หรือเปิด `corepack` กลับมาใช้อีกครั้ง) แล้วรันการอัปเดตใหม่
- ตรวจสอบ: [Troubleshooting](/th/gateway/troubleshooting)
- ถามใน Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ที่เกี่ยวข้อง

- [Install Overview](/th/install) — วิธีการติดตั้งทั้งหมด
- [Doctor](/th/gateway/doctor) — การตรวจสุขภาพหลังการอัปเดต
- [Migrating](/th/install/migrating) — คู่มือการย้ายข้อมูลสำหรับเวอร์ชันหลัก
