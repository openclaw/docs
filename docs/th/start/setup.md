---
read_when:
    - การตั้งค่าเครื่องใหม่
    - คุณต้องการ “ล่าสุด + ดีที่สุด” โดยไม่ทำให้การตั้งค่าส่วนตัวของคุณเสียหาย
summary: การตั้งค่าขั้นสูงและเวิร์กโฟลว์การพัฒนาสำหรับ OpenClaw
title: การตั้งค่า
x-i18n:
    generated_at: "2026-04-30T10:17:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: f96e5e8d46e694f0dfc67eeeb34f4c49498a56e384c3a2a6266c2214afdc0870
    source_path: start/setup.md
    workflow: 16
---

<Note>
หากคุณกำลังตั้งค่าเป็นครั้งแรก ให้เริ่มที่ [เริ่มต้นใช้งาน](/th/start/getting-started)
สำหรับรายละเอียดการเริ่มใช้งาน ดู [การเริ่มใช้งาน (CLI)](/th/start/wizard)
</Note>

## สรุปสั้น ๆ

เลือกเวิร์กโฟลว์การตั้งค่าตามความถี่ที่คุณต้องการรับการอัปเดต และว่าคุณต้องการรัน Gateway เองหรือไม่:

- **การปรับแต่งอยู่ภายนอก repo:** เก็บ config และ workspace ของคุณไว้ใน `~/.openclaw/openclaw.json` และ `~/.openclaw/workspace/` เพื่อไม่ให้การอัปเดต repo ไปแตะต้องสิ่งเหล่านี้
- **เวิร์กโฟลว์เสถียร (แนะนำสำหรับผู้ใช้ส่วนใหญ่):** ติดตั้งแอป macOS แล้วปล่อยให้แอปรัน Gateway ที่รวมมาให้
- **เวิร์กโฟลว์ bleeding edge (dev):** รัน Gateway เองผ่าน `pnpm gateway:watch` จากนั้นให้แอป macOS เชื่อมต่อในโหมด Local

## สิ่งที่ต้องมีก่อน (จากซอร์ส)

- แนะนำ Node 24 (Node 22 LTS ซึ่งปัจจุบันคือ `22.14+` ยังรองรับอยู่)
- แนะนำให้ใช้ `pnpm` (หรือ Bun หากคุณตั้งใจใช้ [เวิร์กโฟลว์ Bun](/th/install/bun))
- Docker (ไม่บังคับ; ใช้เฉพาะสำหรับการตั้งค่า/e2e แบบคอนเทนเนอร์ ดู [Docker](/th/install/docker))

## กลยุทธ์การปรับแต่ง (เพื่อไม่ให้การอัปเดตสร้างปัญหา)

หากคุณต้องการ “ปรับแต่งให้เข้ากับฉัน 100%” _และ_ อัปเดตได้ง่าย ให้เก็บการปรับแต่งของคุณไว้ใน:

- **Config:** `~/.openclaw/openclaw.json` (คล้าย JSON/JSON5)
- **Workspace:** `~/.openclaw/workspace` (skills, prompts, memories; ทำให้เป็น repo git ส่วนตัว)

บูตสแตรปหนึ่งครั้ง:

```bash
openclaw setup
```

จากภายใน repo นี้ ให้ใช้ entry ของ CLI ภายในเครื่อง:

```bash
openclaw setup
```

หากคุณยังไม่มีการติดตั้งแบบ global ให้รันผ่าน `pnpm openclaw setup` (หรือ `bun run openclaw setup` หากคุณใช้เวิร์กโฟลว์ Bun)

## รัน Gateway จาก repo นี้

หลังจาก `pnpm build` คุณสามารถรัน CLI ที่แพ็กเกจไว้ได้โดยตรง:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## เวิร์กโฟลว์เสถียร (เริ่มจากแอป macOS)

1. ติดตั้งและเปิด **OpenClaw.app** (แถบเมนู)
2. ทำ checklist การเริ่มใช้งาน/สิทธิ์ให้ครบ (พรอมป์ TCC)
3. ตรวจสอบให้แน่ใจว่า Gateway เป็น **Local** และกำลังทำงานอยู่ (แอปจัดการให้)
4. เชื่อมโยงพื้นผิวต่าง ๆ (ตัวอย่าง: WhatsApp):

```bash
openclaw channels login
```

5. ตรวจสอบความพร้อมพื้นฐาน:

```bash
openclaw health
```

หากการเริ่มใช้งานไม่มีให้ใช้ใน build ของคุณ:

- รัน `openclaw setup` จากนั้น `openclaw channels login` แล้วเริ่ม Gateway ด้วยตนเอง (`openclaw gateway`)

## เวิร์กโฟลว์ bleeding edge (Gateway ในเทอร์มินัล)

เป้าหมาย: ทำงานกับ TypeScript Gateway, ได้ hot reload, และให้ UI ของแอป macOS เชื่อมต่ออยู่

### 0) (ไม่บังคับ) รันแอป macOS จากซอร์สด้วย

หากคุณต้องการให้แอป macOS อยู่บน bleeding edge ด้วย:

```bash
./scripts/restart-mac.sh
```

### 1) เริ่ม Gateway สำหรับ dev

```bash
pnpm install
# เฉพาะการรันครั้งแรก (หรือหลังจากรีเซ็ต config/workspace ของ OpenClaw ภายในเครื่อง)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` เริ่มหรือรีสตาร์ตโปรเซส watch ของ Gateway ในเซสชัน tmux
ที่มีชื่อ และ auto-attach จากเทอร์มินัลแบบโต้ตอบ shell แบบไม่โต้ตอบจะอยู่ในโหมด
detached และพิมพ์ `tmux attach -t openclaw-gateway-watch-main`; ใช้
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` เพื่อให้การรันแบบโต้ตอบ
ยังคง detached หรือใช้ `pnpm gateway:watch:raw` สำหรับโหมด watch แบบ foreground ตัว watcher
จะโหลดซ้ำเมื่อมีการเปลี่ยนแปลงซอร์ส, config และ metadata ของ bundled-plugin ที่เกี่ยวข้อง
`pnpm openclaw setup` คือขั้นตอนเริ่มต้น config/workspace ภายในเครื่องแบบครั้งเดียวสำหรับ checkout ใหม่
`pnpm gateway:watch` จะไม่ rebuild `dist/control-ui` ดังนั้นให้รัน `pnpm ui:build` อีกครั้งหลังจากมีการเปลี่ยนแปลง `ui/` หรือใช้ `pnpm ui:dev` ระหว่างพัฒนา Control UI

หากคุณตั้งใจใช้เวิร์กโฟลว์ Bun คำสั่งที่เทียบเท่าคือ:

```bash
bun install
# เฉพาะการรันครั้งแรก (หรือหลังจากรีเซ็ต config/workspace ของ OpenClaw ภายในเครื่อง)
bun run openclaw setup
bun run gateway:watch
```

### 2) ชี้แอป macOS ไปยัง Gateway ที่กำลังทำงานอยู่

ใน **OpenClaw.app**:

- โหมดการเชื่อมต่อ: **Local**
  แอปจะเชื่อมต่อกับ gateway ที่กำลังทำงานอยู่บนพอร์ตที่กำหนดค่าไว้

### 3) ตรวจสอบ

- สถานะ Gateway ในแอปควรแสดงว่า **“กำลังใช้ gateway ที่มีอยู่ …”**
- หรือผ่าน CLI:

```bash
openclaw health
```

### ข้อผิดพลาดที่พบบ่อย

- **พอร์ตผิด:** ค่าเริ่มต้นของ Gateway WS คือ `ws://127.0.0.1:18789`; ให้แอปและ CLI ใช้พอร์ตเดียวกัน
- **ตำแหน่งที่เก็บสถานะ:**
  - สถานะ channel/provider: `~/.openclaw/credentials/`
  - โปรไฟล์ auth ของโมเดล: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - เซสชัน: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## แผนผังการจัดเก็บ credential

ใช้ส่วนนี้เมื่อ debug auth หรือตัดสินใจว่าจะสำรองข้อมูลอะไร:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **โทเค็นบอต Telegram**: config/env หรือ `channels.telegram.tokenFile` (เฉพาะไฟล์ปกติเท่านั้น; ปฏิเสธ symlink)
- **โทเค็นบอต Discord**: config/env หรือ SecretRef (ผู้ให้บริการ env/file/exec)
- **โทเค็น Slack**: config/env (`channels.slack.*`)
- **allowlist สำหรับการ pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (บัญชีเริ่มต้น)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (บัญชีที่ไม่ใช่ค่าเริ่มต้น)
- **โปรไฟล์ auth ของโมเดล**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **payload secrets ที่อิงไฟล์ (ไม่บังคับ)**: `~/.openclaw/secrets.json`
- **การนำเข้า OAuth แบบ legacy**: `~/.openclaw/credentials/oauth.json`
  รายละเอียดเพิ่มเติม: [ความปลอดภัย](/th/gateway/security#credential-storage-map)

## การอัปเดต (โดยไม่ทำให้การตั้งค่าของคุณเสียหาย)

- เก็บ `~/.openclaw/workspace` และ `~/.openclaw/` ไว้เป็น “ของของคุณ”; อย่าใส่ prompts/config ส่วนตัวลงใน repo `openclaw`
- การอัปเดตซอร์ส: `git pull` + ขั้นตอนติดตั้งของ package manager ที่คุณเลือก (`pnpm install` เป็นค่าเริ่มต้น; `bun install` สำหรับเวิร์กโฟลว์ Bun) + ใช้คำสั่ง `gateway:watch` ที่ตรงกันต่อไป

## Linux (systemd user service)

การติดตั้งบน Linux ใช้บริการ **user** ของ systemd โดยค่าเริ่มต้น systemd จะหยุดบริการของผู้ใช้
เมื่อ logout/idle ซึ่งจะทำให้ Gateway หยุดทำงาน การเริ่มใช้งานจะพยายามเปิดใช้
lingering ให้คุณ (อาจถาม sudo) หากยังปิดอยู่ ให้รัน:

```bash
sudo loginctl enable-linger $USER
```

สำหรับเซิร์ฟเวอร์แบบเปิดตลอดเวลาหรือมีผู้ใช้หลายคน ให้พิจารณาใช้บริการ **system** แทนบริการ
user (ไม่ต้องใช้ lingering) ดู [คู่มือปฏิบัติการ Gateway](/th/gateway) สำหรับหมายเหตุเกี่ยวกับ systemd

## เอกสารที่เกี่ยวข้อง

- [คู่มือปฏิบัติการ Gateway](/th/gateway) (flags, supervision, ports)
- [การกำหนดค่า Gateway](/th/gateway/configuration) (schema ของ config + ตัวอย่าง)
- [Discord](/th/channels/discord) และ [Telegram](/th/channels/telegram) (แท็กตอบกลับ + การตั้งค่า replyToMode)
- [การตั้งค่าผู้ช่วย OpenClaw](/th/start/openclaw)
- [แอป macOS](/th/platforms/macos) (วงจรชีวิตของ gateway)
