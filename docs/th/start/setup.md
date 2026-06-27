---
read_when:
    - การตั้งค่าเครื่องใหม่
    - คุณต้องการ “ล่าสุด + ดีที่สุด” โดยไม่ทำให้การตั้งค่าส่วนตัวของคุณเสียหาย
summary: เวิร์กโฟลว์การตั้งค่าขั้นสูงและการพัฒนาสำหรับ OpenClaw
title: การตั้งค่า
x-i18n:
    generated_at: "2026-06-27T18:24:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81cad59d4eab731ba548452211bfc578d6f79e38431057c52cc3580d3b9d9944
    source_path: start/setup.md
    workflow: 16
---

<Note>
หากคุณกำลังตั้งค่าเป็นครั้งแรก ให้เริ่มจาก [เริ่มต้นใช้งาน](/th/start/getting-started)
สำหรับรายละเอียดการเริ่มต้นใช้งาน โปรดดู [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
</Note>

## สรุปสั้น ๆ

เลือกเวิร์กโฟลว์การตั้งค่าตามความถี่ที่คุณต้องการอัปเดต และว่าคุณต้องการรัน Gateway ด้วยตัวเองหรือไม่:

- **การปรับแต่งอยู่ภายนอก repo:** เก็บ config และ workspace ของคุณไว้ใน `~/.openclaw/openclaw.json` และ `~/.openclaw/workspace/` เพื่อให้อัปเดต repo แล้วไม่กระทบสิ่งเหล่านี้
- **เวิร์กโฟลว์เสถียร (แนะนำสำหรับผู้ใช้ส่วนใหญ่):** ติดตั้งแอป macOS และให้แอปรัน Gateway ที่บันเดิลมาให้
- **เวิร์กโฟลว์ล้ำหน้า (dev):** รัน Gateway เองผ่าน `pnpm gateway:watch` จากนั้นให้แอป macOS เชื่อมต่อในโหมดภายในเครื่อง

## ข้อกำหนดเบื้องต้น (จากซอร์ส)

- แนะนำ Node 24 (Node 22 LTS, ปัจจุบันคือ `22.19+`, ยังรองรับอยู่)
- ต้องใช้ `pnpm` สำหรับ source checkout OpenClaw โหลด Plugin ที่บันเดิลมาจากแพ็กเกจ pnpm workspace
  `extensions/*` ในโหมด dev ดังนั้น `npm install` ที่ root
  จึงไม่ได้เตรียม source tree ทั้งหมดให้พร้อม
- Docker (ไม่บังคับ; ใช้เฉพาะสำหรับการตั้งค่า/e2e แบบคอนเทนเนอร์ - ดู [Docker](/th/install/docker))

## กลยุทธ์การปรับแต่ง (เพื่อให้อัปเดตแล้วไม่เจ็บตัว)

หากคุณต้องการให้ "ปรับแต่งให้ตรงกับฉัน 100%" _และ_ อัปเดตง่าย ให้เก็บการปรับแต่งไว้ใน:

- **Config:** `~/.openclaw/openclaw.json` (JSON/JSON5-ish)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompts, memories; ทำให้เป็น git repo ส่วนตัว)

Bootstrap หนึ่งครั้ง:

```bash
openclaw setup
```

จากภายใน repo นี้ ให้ใช้ entry ของ CLI ภายในเครื่อง:

```bash
openclaw setup
```

หากคุณยังไม่มีการติดตั้งแบบ global ให้รันผ่าน `pnpm openclaw setup`

## รัน Gateway จาก repo นี้

หลังจาก `pnpm build` คุณสามารถรัน CLI ที่แพ็กเกจแล้วได้โดยตรง:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## เวิร์กโฟลว์เสถียร (เริ่มจากแอป macOS)

1. ติดตั้ง + เปิด **OpenClaw.app** (แถบเมนู)
2. ทำ checklist สำหรับ onboarding/permissions ให้ครบ (พรอมป์ TCC)
3. ตรวจสอบว่า Gateway เป็น **ภายในเครื่อง** และกำลังทำงานอยู่ (แอปเป็นผู้จัดการ)
4. เชื่อม surfaces (ตัวอย่าง: WhatsApp):

```bash
openclaw channels login
```

5. ตรวจสอบความเรียบร้อย:

```bash
openclaw health
```

หาก onboarding ไม่มีใน build ของคุณ:

- รัน `openclaw setup` จากนั้น `openclaw channels login` แล้วเริ่ม Gateway ด้วยตนเอง (`openclaw gateway`)

## เวิร์กโฟลว์ล้ำหน้า (Gateway ในเทอร์มินัล)

เป้าหมาย: ทำงานกับ TypeScript Gateway, ได้ hot reload, และให้ UI ของแอป macOS เชื่อมต่ออยู่

### 0) (ไม่บังคับ) รันแอป macOS จากซอร์สด้วย

หากคุณต้องการให้แอป macOS อยู่บนรุ่นล้ำหน้าด้วย:

```bash
./scripts/restart-mac.sh
```

### 1) เริ่ม dev Gateway

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` เริ่มหรือรีสตาร์ทกระบวนการ watch ของ Gateway ใน tmux
session ที่มีชื่อ และ auto-attach จากเทอร์มินัลแบบ interactive ส่วน shell ที่ไม่ใช่ interactive จะยังคง
detached และพิมพ์ `tmux attach -t openclaw-gateway-watch-main`; ใช้
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` เพื่อให้การรันแบบ interactive
ยังคง detached หรือใช้ `pnpm gateway:watch:raw` สำหรับโหมด watch แบบ foreground ตัว watcher
จะ reload เมื่อมีการเปลี่ยนแปลงซอร์ส config และ metadata ของ Plugin ที่บันเดิลมาที่เกี่ยวข้อง หาก
Gateway ที่ถูก watch ออกระหว่าง startup, `gateway:watch` จะรัน
`openclaw doctor --fix --non-interactive` หนึ่งครั้งแล้วลองใหม่; ตั้งค่า
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` เพื่อปิด repair pass สำหรับ dev เท่านั้นนี้
`pnpm openclaw setup` คือขั้นตอนเริ่มต้น config/workspace ภายในเครื่องแบบครั้งเดียวสำหรับ checkout ใหม่
`pnpm gateway:watch` จะไม่ rebuild `dist/control-ui` ดังนั้นให้รัน `pnpm ui:build` อีกครั้งหลังมีการเปลี่ยนแปลงใน `ui/` หรือใช้ `pnpm ui:dev` ระหว่างพัฒนา Control UI

### 2) ชี้แอป macOS ไปยัง Gateway ที่คุณรันอยู่

ใน **OpenClaw.app**:

- โหมดการเชื่อมต่อ: **ภายในเครื่อง**
  แอปจะเชื่อมต่อกับ gateway ที่กำลังรันอยู่บนพอร์ตที่กำหนดค่าไว้

### 3) ตรวจสอบ

- สถานะ Gateway ในแอปควรแสดงว่า **"กำลังใช้ gateway ที่มีอยู่ …"**
- หรือผ่าน CLI:

```bash
openclaw health
```

### จุดพลาดที่พบบ่อย

- **พอร์ตผิด:** ค่าเริ่มต้นของ Gateway WS คือ `ws://127.0.0.1:18789`; ให้แอป + CLI ใช้พอร์ตเดียวกัน
- **ตำแหน่งที่เก็บ state:**
  - State ของ channel/provider: `~/.openclaw/credentials/`
  - โปรไฟล์ auth ของโมเดล: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessions: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## แผนที่การจัดเก็บ credential

ใช้ส่วนนี้เมื่อตรวจสอบปัญหา auth หรือตัดสินใจว่าจะสำรองข้อมูลอะไร:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env หรือ `channels.telegram.tokenFile` (เฉพาะไฟล์ปกติเท่านั้น; symlink จะถูกปฏิเสธ)
- **Discord bot token**: config/env หรือ SecretRef (ผู้ให้บริการ env/file/exec)
- **Slack tokens**: config/env (`channels.slack.*`)
- **Pairing allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (บัญชีเริ่มต้น)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (บัญชีที่ไม่ใช่ค่าเริ่มต้น)
- **โปรไฟล์ auth ของโมเดล**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Secrets payload ที่ backed by file (ไม่บังคับ)**: `~/.openclaw/secrets.json`
- **การนำเข้า OAuth แบบ legacy**: `~/.openclaw/credentials/oauth.json`
  รายละเอียดเพิ่มเติม: [ความปลอดภัย](/th/gateway/security#credential-storage-map)

## การอัปเดต (โดยไม่ทำให้การตั้งค่าของคุณพัง)

- เก็บ `~/.openclaw/workspace` และ `~/.openclaw/` เป็น "ของของคุณ"; อย่าใส่ prompts/config ส่วนตัวลงใน repo `openclaw`
- การอัปเดตซอร์ส: `git pull` + `pnpm install` + ใช้ `pnpm gateway:watch` ต่อไป

## Linux (systemd user service)

การติดตั้งบน Linux ใช้ systemd service แบบ **user** โดยค่าเริ่มต้น systemd จะหยุด user
services เมื่อ logout/idle ซึ่งจะฆ่า Gateway onboarding จะพยายามเปิดใช้
lingering ให้คุณ (อาจถาม sudo) หากยังปิดอยู่ ให้รัน:

```bash
sudo loginctl enable-linger $USER
```

สำหรับเซิร์ฟเวอร์แบบ always-on หรือ multi-user ให้พิจารณาใช้ service แบบ **system** แทน
user service (ไม่ต้องใช้ lingering) ดูหมายเหตุ systemd ใน [รันบุ๊ก Gateway](/th/gateway)

## เอกสารที่เกี่ยวข้อง

- [รันบุ๊ก Gateway](/th/gateway) (flags, supervision, ports)
- [การกำหนดค่า Gateway](/th/gateway/configuration) (config schema + examples)
- [Discord](/th/channels/discord) และ [Telegram](/th/channels/telegram) (reply tags + การตั้งค่า replyToMode)
- [การตั้งค่าผู้ช่วย OpenClaw](/th/start/openclaw)
- [แอป macOS](/th/platforms/macos) (วงจรชีวิตของ gateway)
