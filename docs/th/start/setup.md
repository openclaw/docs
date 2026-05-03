---
read_when:
    - การตั้งค่าเครื่องใหม่
    - คุณต้องการ “ใหม่ล่าสุด + ดีที่สุด” โดยไม่ทำให้การตั้งค่าส่วนตัวของคุณเสียหาย
summary: การตั้งค่าขั้นสูงและเวิร์กโฟลว์การพัฒนาสำหรับ OpenClaw
title: การตั้งค่า
x-i18n:
    generated_at: "2026-05-03T21:38:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d12f319ab4c60be7ff6538ffd28626f425f7df1a10bbe08cceb59eef3662c75
    source_path: start/setup.md
    workflow: 16
---

<Note>
หากคุณกำลังตั้งค่าเป็นครั้งแรก ให้เริ่มที่ [เริ่มต้นใช้งาน](/th/start/getting-started)
สำหรับรายละเอียดการเริ่มใช้งาน โปรดดู [การเริ่มใช้งาน (CLI)](/th/start/wizard)
</Note>

## สรุปสั้น ๆ

เลือกเวิร์กโฟลว์การตั้งค่าตามความถี่ที่คุณต้องการอัปเดต และคุณต้องการรัน Gateway ด้วยตัวเองหรือไม่:

- **การปรับแต่งควรอยู่นอก repo:** เก็บ config และ workspace ของคุณไว้ใน `~/.openclaw/openclaw.json` และ `~/.openclaw/workspace/` เพื่อไม่ให้อัปเดตของ repo ไปแตะต้อง
- **เวิร์กโฟลว์เสถียร (แนะนำสำหรับคนส่วนใหญ่):** ติดตั้งแอป macOS และปล่อยให้แอปรัน Gateway ที่รวมมาให้
- **เวิร์กโฟลว์ล้ำหน้า (สำหรับพัฒนา):** รัน Gateway ด้วยตัวเองผ่าน `pnpm gateway:watch` แล้วให้แอป macOS เชื่อมต่อในโหมด Local

## สิ่งที่ต้องมีก่อน (จากซอร์ส)

- แนะนำ Node 24 (Node 22 LTS ซึ่งปัจจุบันคือ `22.14+` ยังรองรับอยู่)
- ต้องมี `pnpm` สำหรับการ checkout จากซอร์ส OpenClaw โหลด Plugin ที่รวมมาให้จากแพ็กเกจ pnpm workspace
  `extensions/*` ในโหมดพัฒนา ดังนั้นการรัน `npm install` ที่ root
  จะไม่เตรียม source tree ให้ครบทั้งหมด
- Docker (ไม่บังคับ; ใช้เฉพาะสำหรับการตั้งค่า/e2e แบบ containerized — ดู [Docker](/th/install/docker))

## กลยุทธ์การปรับแต่ง (เพื่อให้อัปเดตไม่กระทบ)

หากคุณต้องการให้ “ปรับแต่งสำหรับฉัน 100%” _และ_ อัปเดตได้ง่าย ให้เก็บการปรับแต่งของคุณไว้ใน:

- **Config:** `~/.openclaw/openclaw.json` (แนว JSON/JSON5)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompts, memories; ทำให้เป็น private git repo)

บูตสแตรปครั้งเดียว:

```bash
openclaw setup
```

จากภายใน repo นี้ ให้ใช้รายการ CLI ภายในเครื่อง:

```bash
openclaw setup
```

หากยังไม่มีการติดตั้งแบบ global ให้รันผ่าน `pnpm openclaw setup`

## รัน Gateway จาก repo นี้

หลังจาก `pnpm build` คุณสามารถรัน CLI ที่แพ็กเกจแล้วได้โดยตรง:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## เวิร์กโฟลว์เสถียร (เริ่มจากแอป macOS)

1. ติดตั้งและเปิด **OpenClaw.app** (แถบเมนู)
2. ทำ checklist การเริ่มใช้งาน/สิทธิ์ให้ครบ (พรอมป์ TCC)
3. ตรวจให้แน่ใจว่า Gateway เป็น **Local** และกำลังรันอยู่ (แอปเป็นผู้จัดการให้)
4. เชื่อมโยงพื้นผิวการใช้งาน (ตัวอย่าง: WhatsApp):

```bash
openclaw channels login
```

5. ตรวจสอบความปกติ:

```bash
openclaw health
```

หากการเริ่มใช้งานยังไม่มีใน build ของคุณ:

- รัน `openclaw setup` จากนั้น `openclaw channels login` แล้วเริ่ม Gateway เอง (`openclaw gateway`)

## เวิร์กโฟลว์ล้ำหน้า (Gateway ใน terminal)

เป้าหมาย: ทำงานกับ TypeScript Gateway, ได้ hot reload, และให้ UI ของแอป macOS ยังเชื่อมต่ออยู่

### 0) (ไม่บังคับ) รันแอป macOS จากซอร์สด้วย

หากคุณต้องการให้แอป macOS อยู่ในเวอร์ชันล้ำหน้าด้วย:

```bash
./scripts/restart-mac.sh
```

### 1) เริ่ม Gateway สำหรับพัฒนา

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` จะเริ่มหรือรีสตาร์ทกระบวนการ watch ของ Gateway ใน tmux
session ที่มีชื่อ และ auto-attach จาก terminal แบบ interactive shell แบบ non-interactive จะยังคง
detached และพิมพ์ `tmux attach -t openclaw-gateway-watch-main`; ใช้
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` เพื่อให้การรันแบบ interactive
ยังคง detached หรือใช้ `pnpm gateway:watch:raw` สำหรับโหมด watch แบบ foreground ตัว watcher
จะ reload เมื่อมีการเปลี่ยนแปลงซอร์ส config และ metadata ของ Plugin ที่รวมมาให้ที่เกี่ยวข้อง หาก
Gateway ที่ถูก watch ออกระหว่าง startup, `gateway:watch` จะรัน
`openclaw doctor --fix --non-interactive` หนึ่งครั้งแล้วลองใหม่; ตั้งค่า
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` เพื่อปิด repair pass เฉพาะสำหรับการพัฒนานี้
`pnpm openclaw setup` คือขั้นตอนเริ่มต้น config/workspace ภายในเครื่องแบบครั้งเดียวสำหรับ checkout ใหม่
`pnpm gateway:watch` จะไม่ rebuild `dist/control-ui` ดังนั้นให้รัน `pnpm ui:build` อีกครั้งหลังเปลี่ยนแปลง `ui/` หรือใช้ `pnpm ui:dev` ขณะพัฒนา Control UI

### 2) ชี้แอป macOS ไปยัง Gateway ที่กำลังรันอยู่

ใน **OpenClaw.app**:

- โหมดการเชื่อมต่อ: **Local**
  แอปจะเชื่อมต่อกับ gateway ที่กำลังรันอยู่บน port ที่กำหนดค่าไว้

### 3) ตรวจสอบ

- สถานะ Gateway ในแอปควรแสดง **“ใช้ gateway ที่มีอยู่ …”**
- หรือผ่าน CLI:

```bash
openclaw health
```

### ปัญหาที่พบบ่อย

- **Port ผิด:** Gateway WS มีค่าเริ่มต้นเป็น `ws://127.0.0.1:18789`; ให้แอปและ CLI ใช้ port เดียวกัน
- **ตำแหน่งที่เก็บ state:**
  - State ของช่องทาง/ผู้ให้บริการ: `~/.openclaw/credentials/`
  - โปรไฟล์ auth ของ model: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessions: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## แผนผังที่เก็บ credentials

ใช้ส่วนนี้เมื่อ debug auth หรือเมื่อตัดสินใจว่าจะ back up อะไร:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env หรือ `channels.telegram.tokenFile` (ไฟล์ปกติเท่านั้น; ปฏิเสธ symlinks)
- **Discord bot token**: config/env หรือ SecretRef (ผู้ให้บริการ env/file/exec)
- **Slack tokens**: config/env (`channels.slack.*`)
- **Pairing allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (บัญชีเริ่มต้น)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (บัญชีที่ไม่ใช่ค่าเริ่มต้น)
- **โปรไฟล์ auth ของ model**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload ของ secrets ที่อิงไฟล์ (ไม่บังคับ)**: `~/.openclaw/secrets.json`
- **การนำเข้า OAuth แบบ legacy**: `~/.openclaw/credentials/oauth.json`
  รายละเอียดเพิ่มเติม: [ความปลอดภัย](/th/gateway/security#credential-storage-map)

## การอัปเดต (โดยไม่ทำให้การตั้งค่าของคุณเสีย)

- เก็บ `~/.openclaw/workspace` และ `~/.openclaw/` เป็น “ของของคุณ”; อย่าใส่ prompts/config ส่วนตัวลงใน repo `openclaw`
- การอัปเดตซอร์ส: `git pull` + `pnpm install` + ใช้ `pnpm gateway:watch` ต่อไป

## Linux (systemd user service)

การติดตั้งบน Linux ใช้ systemd service แบบ **user** โดยค่าเริ่มต้น systemd จะหยุด user
services เมื่อ logout/idle ซึ่งจะทำให้ Gateway ถูกปิด การเริ่มใช้งานจะพยายามเปิด
lingering ให้คุณ (อาจขอ sudo) หากยังปิดอยู่ ให้รัน:

```bash
sudo loginctl enable-linger $USER
```

สำหรับเซิร์ฟเวอร์แบบ always-on หรือ multi-user ให้พิจารณาใช้ service แบบ **system** แทน
user service (ไม่ต้องใช้ lingering) ดูหมายเหตุ systemd ได้ใน [runbook ของ Gateway](/th/gateway)

## เอกสารที่เกี่ยวข้อง

- [runbook ของ Gateway](/th/gateway) (flags, supervision, ports)
- [การกำหนดค่า Gateway](/th/gateway/configuration) (config schema + ตัวอย่าง)
- [Discord](/th/channels/discord) และ [Telegram](/th/channels/telegram) (reply tags + การตั้งค่า replyToMode)
- [การตั้งค่าผู้ช่วย OpenClaw](/th/start/openclaw)
- [แอป macOS](/th/platforms/macos) (lifecycle ของ gateway)
