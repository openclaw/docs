---
read_when:
    - การอัปเดต OpenClaw
    - มีบางอย่างพังหลังการอัปเดต
summary: การอัปเดต OpenClaw อย่างปลอดภัย (การติดตั้งแบบ global หรือจากซอร์ส) พร้อมกลยุทธ์การย้อนกลับ
title: การอัปเดต
x-i18n:
    generated_at: "2026-04-26T11:34:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: e40ff4d2db5f0b75107894d2b4959f34f3077acb55045230fb104b95795d9149
    source_path: install/updating.md
    workflow: 15
---

อัปเดต OpenClaw ให้เป็นปัจจุบันอยู่เสมอ

## แนะนำ: `openclaw update`

วิธีอัปเดตที่เร็วที่สุด ระบบจะตรวจจับประเภทการติดตั้งของคุณ (npm หรือ git) ดึงเวอร์ชันล่าสุด รัน `openclaw doctor` และรีสตาร์ต gateway

```bash
openclaw update
```

หากต้องการสลับ channel หรือกำหนดเวอร์ชันเฉพาะ:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # ดูตัวอย่างก่อนโดยยังไม่ apply
```

`--channel beta` จะเลือก beta ก่อน แต่รันไทม์จะ fallback ไปใช้ stable/latest เมื่อ
ไม่มี beta tag หรือเก่ากว่า stable release ล่าสุด ใช้ `--tag beta`
หากคุณต้องการ npm beta dist-tag แบบดิบสำหรับการอัปเดตแพ็กเกจแบบครั้งเดียว

ดู [Development channels](/th/install/development-channels) สำหรับความหมายของแต่ละ channel

## สลับระหว่างการติดตั้งแบบ npm และ git

ใช้ channels เมื่อต้องการเปลี่ยนประเภทการติดตั้ง updater จะเก็บ
state, config, credentials และ workspace ของคุณไว้ใน `~/.openclaw`; มันเปลี่ยนเพียง
ชุดโค้ด OpenClaw ที่ CLI และ gateway ใช้งานอยู่

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

รันด้วย `--dry-run` ก่อนเพื่อดูตัวอย่างการสลับโหมดการติดตั้งแบบตรงตัว:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

channel `dev` จะทำให้มี git checkout แน่นอน สร้าง build และติดตั้ง global CLI
จาก checkout นั้น ส่วน `stable` และ `beta` จะใช้การติดตั้งแบบแพ็กเกจ หาก
gateway ถูกติดตั้งอยู่แล้ว `openclaw update` จะรีเฟรช metadata ของ service
และรีสตาร์ตมัน เว้นแต่คุณจะส่ง `--no-restart`

## ทางเลือก: รันตัวติดตั้งอีกครั้ง

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

เพิ่ม `--no-onboard` เพื่อข้าม onboarding หากต้องการบังคับประเภทการติดตั้งผ่าน
ตัวติดตั้ง ให้ส่ง `--install-method git --no-onboard` หรือ
`--install-method npm --no-onboard`

## ทางเลือก: ใช้ npm, pnpm หรือ bun แบบ manual

```bash
npm i -g openclaw@latest
```

เมื่อ `openclaw update` จัดการการติดตั้ง npm แบบ global มันจะรันคำสั่ง
ติดตั้งแบบ global ปกติก่อน หากคำสั่งนั้นล้มเหลว OpenClaw จะลองใหม่อีกครั้งด้วย
`--omit=optional` การลองใหม่นี้ช่วยกับโฮสต์ที่ native optional dependencies
คอมไพล์ไม่ได้ โดยยังคงแสดงความล้มเหลวเดิมไว้หาก fallback ก็ยังล้มเหลว

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### การติดตั้ง npm แบบ global และ runtime dependencies

OpenClaw ปฏิบัติต่อการติดตั้งแบบ packaged global ว่าเป็นแบบอ่านอย่างเดียวระหว่างรัน แม้ว่า
ไดเรกทอรี global package จะเขียนได้โดยผู้ใช้ปัจจุบันก็ตาม runtime
dependencies ของ bundled plugins จะถูกจัดวางไว้ใน writable runtime directory
แทนที่จะไปแก้ไข package tree โดยตรง วิธีนี้ช่วยป้องกันไม่ให้ `openclaw update` ชนกับ
gateway หรือ local agent ที่กำลังรันอยู่ซึ่งกำลังซ่อมแซม plugin dependencies
ในช่วงการติดตั้งเดียวกัน

การตั้งค่า npm บางแบบบน Linux จะติดตั้ง global packages ในไดเรกทอรีที่ root เป็นเจ้าของ
เช่น `/usr/lib/node_modules/openclaw` OpenClaw รองรับ layout นี้ผ่านเส้นทาง staging ภายนอกแบบเดียวกัน

สำหรับ systemd units แบบ hardened ให้ตั้ง writable stage directory ที่ถูกรวมไว้ใน
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

หากไม่ได้ตั้ง `OPENCLAW_PLUGIN_STAGE_DIR` OpenClaw จะใช้ `$STATE_DIRECTORY` เมื่อ
systemd มีให้ จากนั้น fallback ไปที่ `~/.openclaw/plugin-runtime-deps`
ขั้นตอน repair จะถือว่า stage นั้นเป็น local package root ที่ OpenClaw เป็นเจ้าของ และ
จะเพิกเฉยต่อการตั้งค่า npm prefix/global ของผู้ใช้ ดังนั้น config npm ของ global install
จะไม่เปลี่ยนทิศทาง bundled plugin dependencies ไปยัง `~/node_modules` หรือ package tree แบบ global

ก่อนการอัปเดตแพ็กเกจและการซ่อม bundled runtime-dependency OpenClaw จะพยายาม
ตรวจสอบพื้นที่ดิสก์ของ volume เป้าหมายแบบ best-effort หากพื้นที่เหลือน้อยจะมีคำเตือน
พร้อมพาธที่ตรวจสอบ แต่จะไม่บล็อกการอัปเดต เพราะ filesystem quotas,
snapshots และ network volumes สามารถเปลี่ยนแปลงได้หลังการตรวจสอบ ส่วน npm
install, copy และ post-install verification จริงยังคงเป็นตัวชี้ขาด

### Bundled plugin runtime dependencies

การติดตั้งแบบ packaged จะเก็บ bundled plugin runtime dependencies ไว้นอก
package tree แบบอ่านอย่างเดียว ระหว่าง startup และระหว่าง `openclaw doctor --fix`
OpenClaw จะซ่อม runtime dependencies เฉพาะสำหรับ bundled plugins ที่ active
ใน config, active ผ่าน legacy channel config หรือถูกเปิดใช้โดยค่าเริ่มต้นของ bundled manifest
persisted channel auth state เพียงอย่างเดียวจะไม่ทริกเกอร์การซ่อม
runtime-dependency ระหว่าง Gateway startup

การปิดใช้งานแบบชัดเจนมีผลสูงสุด Plugin หรือ channel ที่ถูกปิดใช้งานจะไม่ถูกซ่อม
runtime dependencies เพียงเพราะมันมีอยู่ใน package ส่วน external
plugins และ custom load paths ยังคงใช้ `openclaw plugins install` หรือ
`openclaw plugins update`

## ตัวอัปเดตอัตโนมัติ

ตัวอัปเดตอัตโนมัติปิดอยู่เป็นค่าเริ่มต้น เปิดใช้ได้ใน `~/.openclaw/openclaw.json`:

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

| Channel  | พฤติกรรม |
| -------- | --------- |
| `stable` | รอ `stableDelayHours` จากนั้น apply พร้อม deterministic jitter ตลอด `stableJitterHours` (กระจายการ rollout) |
| `beta`   | ตรวจสอบทุก `betaCheckIntervalHours` (ค่าเริ่มต้น: ทุกชั่วโมง) และ apply ทันที |
| `dev`    | ไม่ apply อัตโนมัติ ใช้ `openclaw update` ด้วยตัวเอง |

gateway จะบันทึกคำใบ้เรื่องการอัปเดตตอน startup ด้วย (ปิดได้ด้วย `update.checkOnStart: false`)

## หลังการอัปเดต

<Steps>

### รัน doctor

```bash
openclaw doctor
```

ย้าย config ตรวจสอบ DM policies และตรวจสอบสุขภาพของ gateway รายละเอียด: [Doctor](/th/gateway/doctor)

### รีสตาร์ต gateway

```bash
openclaw gateway restart
```

### ตรวจสอบ

```bash
openclaw health
```

</Steps>

## ย้อนกลับ

### ปักหมุดเวอร์ชัน (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

เคล็ดลับ: `npm view openclaw version` จะแสดงเวอร์ชันที่เผยแพร่ปัจจุบัน

### ปักหมุด commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

หากต้องการกลับไปเวอร์ชันล่าสุด: `git checkout main && git pull`

## หากคุณยังติดขัด

- รัน `openclaw doctor` อีกครั้งและอ่านผลลัพธ์อย่างละเอียด
- สำหรับ `openclaw update --channel dev` บน source checkouts updater จะ bootstrap `pnpm` ให้อัตโนมัติเมื่อจำเป็น หากคุณเห็นข้อผิดพลาดเกี่ยวกับ pnpm/corepack bootstrap ให้ติดตั้ง `pnpm` ด้วยตนเอง (หรือเปิดใช้ `corepack` อีกครั้ง) แล้วรันการอัปเดตใหม่
- ตรวจสอบ: [การแก้ไขปัญหา](/th/gateway/troubleshooting)
- ถามใน Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install) — วิธีการติดตั้งทั้งหมด
- [Doctor](/th/gateway/doctor) — การตรวจสอบสุขภาพหลังอัปเดต
- [Migrating](/th/install/migrating) — คู่มือการย้ายเวอร์ชันหลัก
