---
read_when:
    - การตั้งค่าเครื่องใหม่
    - คุณต้องการ “ล่าสุด + ดีที่สุด” โดยไม่ทำให้การตั้งค่าส่วนตัวของคุณเสียหาย
summary: การตั้งค่าขั้นสูงและเวิร์กโฟลว์การพัฒนาสำหรับ OpenClaw
title: การตั้งค่า
x-i18n:
    generated_at: "2026-05-02T10:29:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 101f7911d4a4cba139dd7a464b2ed82e2c80c630ba6ea58486309642c6690ee9
    source_path: start/setup.md
    workflow: 16
---

<Note>
หากคุณกำลังตั้งค่าเป็นครั้งแรก ให้เริ่มจาก [เริ่มต้นใช้งาน](/th/start/getting-started)
สำหรับรายละเอียดการเริ่มต้นใช้งาน โปรดดู [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
</Note>

## สรุปสั้น ๆ

เลือกเวิร์กโฟลว์การตั้งค่าตามความถี่ที่คุณต้องการอัปเดต และว่าคุณต้องการรัน Gateway ด้วยตัวเองหรือไม่:

- **การปรับแต่งอยู่ภายนอก repo:** เก็บ config และ workspace ของคุณไว้ใน `~/.openclaw/openclaw.json` และ `~/.openclaw/workspace/` เพื่อไม่ให้การอัปเดต repo ไปแตะต้องสิ่งเหล่านั้น
- **เวิร์กโฟลว์เสถียร (แนะนำสำหรับผู้ใช้ส่วนใหญ่):** ติดตั้งแอป macOS และให้แอปรัน Gateway ที่มาพร้อมกัน
- **เวิร์กโฟลว์ล้ำหน้า (dev):** รัน Gateway เองผ่าน `pnpm gateway:watch` จากนั้นให้แอป macOS เชื่อมต่อในโหมด Local

## ข้อกำหนดเบื้องต้น (จากซอร์ส)

- แนะนำ Node 24 (Node 22 LTS ซึ่งปัจจุบันคือ `22.14+` ยังคงรองรับอยู่)
- ต้องใช้ `pnpm` สำหรับ source checkouts OpenClaw โหลด plugins ที่มาพร้อมกันจากแพ็กเกจ pnpm workspace ใน
  `extensions/*` เมื่ออยู่ในโหมด dev ดังนั้น `npm install` ที่ root
  จึงไม่เตรียม source tree ทั้งหมดให้พร้อม
- Docker (ไม่บังคับ ใช้เฉพาะสำหรับการตั้งค่า/e2e แบบคอนเทนเนอร์ — ดู [Docker](/th/install/docker))

## กลยุทธ์การปรับแต่ง (เพื่อไม่ให้การอัปเดตสร้างปัญหา)

หากคุณต้องการ “ปรับแต่งให้เข้ากับฉัน 100%” _และ_ อัปเดตได้ง่าย ให้เก็บการปรับแต่งของคุณไว้ใน:

- **Config:** `~/.openclaw/openclaw.json` (คล้าย JSON/JSON5)
- **Workspace:** `~/.openclaw/workspace` (skills, prompts, memories; ทำให้เป็น repo git ส่วนตัว)

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

หลังจาก `pnpm build` คุณสามารถรัน CLI ที่แพ็กเกจไว้โดยตรง:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## เวิร์กโฟลว์เสถียร (เริ่มจากแอป macOS)

1. ติดตั้ง + เปิด **OpenClaw.app** (แถบเมนู)
2. ทำรายการตรวจสอบการเริ่มต้นใช้งาน/สิทธิ์ให้ครบ (พรอมป์ TCC)
3. ตรวจสอบให้แน่ใจว่า Gateway เป็น **Local** และกำลังรันอยู่ (แอปเป็นผู้จัดการ)
4. เชื่อมโยงพื้นผิวต่าง ๆ (ตัวอย่าง: WhatsApp):

```bash
openclaw channels login
```

5. ตรวจสอบความเรียบร้อย:

```bash
openclaw health
```

หากการเริ่มต้นใช้งานไม่มีใน build ของคุณ:

- รัน `openclaw setup` จากนั้น `openclaw channels login` แล้วเริ่ม Gateway ด้วยตนเอง (`openclaw gateway`)

## เวิร์กโฟลว์ล้ำหน้า (Gateway ในเทอร์มินัล)

เป้าหมาย: ทำงานบน TypeScript Gateway, ได้ hot reload, และให้ UI ของแอป macOS เชื่อมต่ออยู่

### 0) (ไม่บังคับ) รันแอป macOS จากซอร์สด้วย

หากคุณต้องการให้แอป macOS อยู่บนรุ่นล้ำหน้าด้วย:

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

`gateway:watch` เริ่มหรือรีสตาร์ตกระบวนการ watch ของ Gateway ใน session tmux
ที่มีชื่อ และ auto-attach จากเทอร์มินัลแบบ interactive ส่วน shell แบบ non-interactive จะยังคง
detached และพิมพ์ `tmux attach -t openclaw-gateway-watch-main`; ใช้
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` เพื่อให้การรันแบบ interactive
ยังคง detached หรือใช้ `pnpm gateway:watch:raw` สำหรับโหมด watch แบบ foreground ตัว watcher
จะ reload เมื่อมีการเปลี่ยนแปลงซอร์ส, config และ metadata ของ bundled-plugin ที่เกี่ยวข้อง
`pnpm openclaw setup` คือขั้นตอนเริ่มต้น config/workspace ภายในเครื่องแบบครั้งเดียวสำหรับ fresh checkout
`pnpm gateway:watch` จะไม่ rebuild `dist/control-ui` ดังนั้นให้รัน `pnpm ui:build` อีกครั้งหลังเปลี่ยน `ui/` หรือใช้ `pnpm ui:dev` ขณะพัฒนา Control UI

### 2) ชี้แอป macOS ไปยัง Gateway ที่คุณรันอยู่

ใน **OpenClaw.app**:

- โหมดการเชื่อมต่อ: **Local**
  แอปจะเชื่อมต่อกับ gateway ที่กำลังรันอยู่บน port ที่กำหนดค่าไว้

### 3) ตรวจสอบ

- สถานะ Gateway ในแอปควรแสดง **“Using existing gateway …”**
- หรือผ่าน CLI:

```bash
openclaw health
```

### จุดพลาดที่พบบ่อย

- **port ผิด:** Gateway WS มีค่าเริ่มต้นเป็น `ws://127.0.0.1:18789`; ให้แอป + CLI อยู่บน port เดียวกัน
- **ตำแหน่งที่เก็บสถานะ:**
  - สถานะ channel/provider: `~/.openclaw/credentials/`
  - โปรไฟล์ auth ของโมเดล: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessions: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## แผนผังการจัดเก็บ credential

ใช้ส่วนนี้เมื่อ debug auth หรือตัดสินใจว่าจะสำรองข้อมูลอะไร:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env หรือ `channels.telegram.tokenFile` (ไฟล์ปกติเท่านั้น; ปฏิเสธ symlinks)
- **Discord bot token**: config/env หรือ SecretRef (ผู้ให้บริการ env/file/exec)
- **Slack tokens**: config/env (`channels.slack.*`)
- **allowlists สำหรับการจับคู่**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (บัญชีเริ่มต้น)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (บัญชีที่ไม่ใช่ค่าเริ่มต้น)
- **โปรไฟล์ auth ของโมเดล**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **payload secrets ที่ backed ด้วยไฟล์ (ไม่บังคับ)**: `~/.openclaw/secrets.json`
- **การนำเข้า OAuth เดิม**: `~/.openclaw/credentials/oauth.json`
  รายละเอียดเพิ่มเติม: [ความปลอดภัย](/th/gateway/security#credential-storage-map)

## การอัปเดต (โดยไม่ทำให้การตั้งค่าของคุณเสียหาย)

- เก็บ `~/.openclaw/workspace` และ `~/.openclaw/` ไว้เป็น “ของของคุณ”; อย่าใส่ prompts/config ส่วนตัวลงใน repo `openclaw`
- การอัปเดตซอร์ส: `git pull` + `pnpm install` + ใช้ `pnpm gateway:watch` ต่อไป

## Linux (systemd user service)

การติดตั้ง Linux ใช้ systemd service แบบ **user** โดยค่าเริ่มต้น systemd จะหยุด user
services เมื่อ logout/idle ซึ่งจะทำให้ Gateway หยุดทำงาน การเริ่มต้นใช้งานจะพยายามเปิดใช้
lingering ให้คุณ (อาจขอ sudo) หากยังปิดอยู่ ให้รัน:

```bash
sudo loginctl enable-linger $USER
```

สำหรับเซิร์ฟเวอร์แบบ always-on หรือ multi-user ให้พิจารณาใช้ service แบบ **system** แทน
user service (ไม่ต้องใช้ lingering) ดูหมายเหตุ systemd ได้ที่ [runbook ของ Gateway](/th/gateway)

## เอกสารที่เกี่ยวข้อง

- [runbook ของ Gateway](/th/gateway) (flags, supervision, ports)
- [การกำหนดค่า Gateway](/th/gateway/configuration) (config schema + ตัวอย่าง)
- [Discord](/th/channels/discord) และ [Telegram](/th/channels/telegram) (reply tags + การตั้งค่า replyToMode)
- [การตั้งค่าผู้ช่วย OpenClaw](/th/start/openclaw)
- [แอป macOS](/th/platforms/macos) (วงจรชีวิตของ gateway)
