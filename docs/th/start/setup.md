---
read_when:
    - การตั้งค่าเครื่องใหม่
    - คุณต้องการ “ล่าสุด + ดีที่สุด” โดยไม่ทำให้การตั้งค่าส่วนตัวของคุณเสียหาย
summary: การตั้งค่าขั้นสูงและเวิร์กโฟลว์การพัฒนาสำหรับ OpenClaw
title: การตั้งค่า
x-i18n:
    generated_at: "2026-05-06T09:31:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99b65443deac92ed74d2fb0d8db9a00bf81b37d60ce25c0c38c1f8d9a7c0cfd3
    source_path: start/setup.md
    workflow: 16
---

<Note>
หากคุณกำลังตั้งค่าเป็นครั้งแรก ให้เริ่มที่ [เริ่มต้นใช้งาน](/th/start/getting-started)
สำหรับรายละเอียดการเริ่มต้นใช้งาน โปรดดู [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
</Note>

## สรุปสั้น ๆ

เลือกเวิร์กโฟลว์การตั้งค่าตามความถี่ที่คุณต้องการอัปเดต และตามว่าคุณต้องการรัน Gateway เองหรือไม่:

- **การปรับแต่งอยู่ภายนอก repo:** เก็บ config และ workspace ของคุณไว้ใน `~/.openclaw/openclaw.json` และ `~/.openclaw/workspace/` เพื่อให้การอัปเดต repo ไม่ไปแตะไฟล์เหล่านั้น
- **เวิร์กโฟลว์เสถียร (แนะนำสำหรับผู้ใช้ส่วนใหญ่):** ติดตั้งแอป macOS แล้วให้แอปรัน Gateway ที่มาพร้อมกัน
- **เวิร์กโฟลว์รุ่นล่าสุดสำหรับนักพัฒนา (dev):** รัน Gateway เองผ่าน `pnpm gateway:watch` แล้วให้แอป macOS เชื่อมต่อในโหมดภายในเครื่อง

## ข้อกำหนดเบื้องต้น (จากซอร์ส)

- แนะนำ Node 24 (ยังรองรับ Node 22 LTS ซึ่งปัจจุบันคือ `22.14+`)
- ต้องใช้ `pnpm` สำหรับ source checkout OpenClaw โหลด plugins ที่มาพร้อมกันจากแพ็กเกจ pnpm workspace
  `extensions/*` ในโหมด dev ดังนั้นการรัน `npm install` ที่ราก repo
  จะไม่เตรียม source tree ให้ครบถ้วน
- Docker (ไม่บังคับ; ใช้เฉพาะสำหรับการตั้งค่า/e2e แบบ containerized - ดู [Docker](/th/install/docker))

## กลยุทธ์การปรับแต่ง (เพื่อไม่ให้การอัปเดตทำให้เสียหาย)

หากคุณต้องการ "ปรับแต่งให้เข้ากับฉัน 100%" _และ_ อัปเดตได้ง่าย ให้เก็บการปรับแต่งไว้ใน:

- **Config:** `~/.openclaw/openclaw.json` (คล้าย JSON/JSON5)
- **Workspace:** `~/.openclaw/workspace` (skills, prompts, memories; ทำให้เป็น git repo ส่วนตัว)

Bootstrap หนึ่งครั้ง:

```bash
openclaw setup
```

จากภายใน repo นี้ ให้ใช้รายการ CLI ภายในเครื่อง:

```bash
openclaw setup
```

หากคุณยังไม่มีการติดตั้งแบบ global ให้รันผ่าน `pnpm openclaw setup`

## รัน Gateway จาก repo นี้

หลังจาก `pnpm build` คุณสามารถรัน CLI ที่แพ็กไว้ได้โดยตรง:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## เวิร์กโฟลว์เสถียร (เริ่มจากแอป macOS)

1. ติดตั้งและเปิด **OpenClaw.app** (แถบเมนู)
2. ทำเช็กลิสต์การเริ่มต้นใช้งาน/สิทธิ์ให้ครบ (พรอมป์ TCC)
3. ตรวจสอบว่า Gateway เป็น **ภายในเครื่อง** และกำลังทำงาน (แอปจะจัดการให้)
4. เชื่อมโยงพื้นผิวการใช้งาน (ตัวอย่าง: WhatsApp):

```bash
openclaw channels login
```

5. ตรวจสอบความพร้อมเบื้องต้น:

```bash
openclaw health
```

หากการเริ่มต้นใช้งานยังไม่พร้อมใช้งานใน build ของคุณ:

- รัน `openclaw setup` จากนั้น `openclaw channels login` แล้วเริ่ม Gateway ด้วยตนเอง (`openclaw gateway`)

## เวิร์กโฟลว์รุ่นล่าสุดสำหรับนักพัฒนา (Gateway ใน terminal)

เป้าหมาย: ทำงานกับ TypeScript Gateway, ได้ hot reload, และให้ UI ของแอป macOS เชื่อมต่ออยู่เสมอ

### 0) (ไม่บังคับ) รันแอป macOS จากซอร์สด้วย

หากคุณต้องการให้แอป macOS อยู่บนรุ่นล่าสุดสำหรับนักพัฒนาด้วย:

```bash
./scripts/restart-mac.sh
```

### 1) เริ่ม Gateway สำหรับ dev

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` เริ่มหรือรีสตาร์ตกระบวนการ watch ของ Gateway ใน tmux
session ที่มีชื่อ และ auto-attach จาก terminal แบบ interactive shell แบบ non-interactive จะยังคง
detached และพิมพ์ `tmux attach -t openclaw-gateway-watch-main`; ใช้
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` เพื่อให้การรันแบบ interactive
คงสถานะ detached หรือใช้ `pnpm gateway:watch:raw` สำหรับโหมด watch แบบ foreground watcher
จะ reload เมื่อซอร์ส, config และ metadata ของ bundled-plugin ที่เกี่ยวข้องเปลี่ยนแปลง หาก
Gateway ที่ถูก watch ออกจากโปรแกรมระหว่าง startup, `gateway:watch` จะรัน
`openclaw doctor --fix --non-interactive` หนึ่งครั้งแล้วลองใหม่ ตั้งค่า
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` เพื่อปิด repair pass สำหรับ dev เท่านั้นนี้
`pnpm openclaw setup` คือขั้นตอนเริ่มต้น config/workspace ภายในเครื่องครั้งเดียวสำหรับ checkout ใหม่
`pnpm gateway:watch` จะไม่ rebuild `dist/control-ui` ดังนั้นให้รัน `pnpm ui:build` อีกครั้งหลังมีการเปลี่ยนแปลงใน `ui/` หรือใช้ `pnpm ui:dev` ขณะพัฒนา Control UI

### 2) ชี้แอป macOS ไปยัง Gateway ที่กำลังรันอยู่

ใน **OpenClaw.app**:

- โหมดการเชื่อมต่อ: **ภายในเครื่อง**
  แอปจะเชื่อมต่อกับ gateway ที่กำลังรันอยู่บน port ที่กำหนดค่าไว้

### 3) ตรวจสอบ

- สถานะ Gateway ในแอปควรแสดงว่า **"กำลังใช้ gateway ที่มีอยู่ …"**
- หรือผ่าน CLI:

```bash
openclaw health
```

### ข้อผิดพลาดที่พบบ่อย

- **Port ผิด:** ค่าเริ่มต้นของ Gateway WS คือ `ws://127.0.0.1:18789`; ให้แอปและ CLI ใช้ port เดียวกัน
- **ตำแหน่งที่เก็บสถานะ:**
  - สถานะ channel/provider: `~/.openclaw/credentials/`
  - โปรไฟล์ auth ของโมเดล: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessions: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## แผนผังที่เก็บข้อมูลรับรอง

ใช้ส่วนนี้เมื่อ debug auth หรือตัดสินใจว่าจะสำรองข้อมูลอะไร:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env หรือ `channels.telegram.tokenFile` (เฉพาะไฟล์ปกติเท่านั้น; symlink ถูกปฏิเสธ)
- **Discord bot token**: config/env หรือ SecretRef (ผู้ให้บริการ env/file/exec)
- **Slack tokens**: config/env (`channels.slack.*`)
- **Pairing allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (บัญชีเริ่มต้น)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (บัญชีที่ไม่ใช่ค่าเริ่มต้น)
- **โปรไฟล์ auth ของโมเดล**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload ของ secrets ที่ backed by file (ไม่บังคับ)**: `~/.openclaw/secrets.json`
- **การนำเข้า OAuth แบบ legacy**: `~/.openclaw/credentials/oauth.json`
  รายละเอียดเพิ่มเติม: [ความปลอดภัย](/th/gateway/security#credential-storage-map)

## การอัปเดต (โดยไม่ทำให้การตั้งค่าของคุณเสียหาย)

- เก็บ `~/.openclaw/workspace` และ `~/.openclaw/` เป็น "ของคุณ"; อย่าใส่ prompts/config ส่วนตัวไว้ใน repo `openclaw`
- การอัปเดตซอร์ส: `git pull` + `pnpm install` + ใช้ `pnpm gateway:watch` ต่อไป

## Linux (systemd user service)

การติดตั้งบน Linux ใช้ systemd service แบบ **user** โดยค่าเริ่มต้น systemd จะหยุด user
services เมื่อ logout/idle ซึ่งจะทำให้ Gateway ถูกหยุด การเริ่มต้นใช้งานจะพยายามเปิดใช้
lingering ให้คุณ (อาจถาม sudo) หากยังปิดอยู่ ให้รัน:

```bash
sudo loginctl enable-linger $USER
```

สำหรับเซิร์ฟเวอร์ที่ต้องเปิดตลอดเวลาหรือมีหลายผู้ใช้ ให้พิจารณาใช้ service แบบ **system** แทน
user service (ไม่ต้องใช้ lingering) ดูหมายเหตุ systemd ใน [คู่มือปฏิบัติการ Gateway](/th/gateway)

## เอกสารที่เกี่ยวข้อง

- [คู่มือปฏิบัติการ Gateway](/th/gateway) (flags, supervision, ports)
- [การกำหนดค่า Gateway](/th/gateway/configuration) (config schema + ตัวอย่าง)
- [Discord](/th/channels/discord) และ [Telegram](/th/channels/telegram) (reply tags + การตั้งค่า replyToMode)
- [การตั้งค่าผู้ช่วย OpenClaw](/th/start/openclaw)
- [แอป macOS](/th/platforms/macos) (วงจรชีวิต gateway)
