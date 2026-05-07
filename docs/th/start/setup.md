---
read_when:
    - การตั้งค่าเครื่องใหม่
    - คุณต้องการ "ล่าสุด + ดีที่สุด" โดยไม่ทำให้การตั้งค่าส่วนตัวของคุณเสียหาย
summary: การตั้งค่าขั้นสูงและเวิร์กโฟลว์การพัฒนาสำหรับ OpenClaw
title: การตั้งค่า
x-i18n:
    generated_at: "2026-05-07T13:26:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9325ebfc2c5868e44fba18b75ca27cd9333a8bc7072e933468e1608dde487a8e
    source_path: start/setup.md
    workflow: 16
---

<Note>
หากคุณกำลังตั้งค่าเป็นครั้งแรก ให้เริ่มจาก [เริ่มต้นใช้งาน](/th/start/getting-started)
สำหรับรายละเอียดการเริ่มต้นใช้งาน โปรดดู [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
</Note>

## สรุปสั้น ๆ

เลือกเวิร์กโฟลว์การตั้งค่าตามความถี่ที่คุณต้องการอัปเดต และว่าคุณต้องการรัน Gateway ด้วยตัวเองหรือไม่:

- **การปรับแต่งอยู่นอกรีโพ:** เก็บการกำหนดค่าและพื้นที่ทำงานของคุณไว้ใน `~/.openclaw/openclaw.json` และ `~/.openclaw/workspace/` เพื่อให้การอัปเดตรีโพไม่ไปแตะต้องสิ่งเหล่านั้น
- **เวิร์กโฟลว์เสถียร (แนะนำสำหรับคนส่วนใหญ่):** ติดตั้งแอป macOS และปล่อยให้แอปรัน Gateway ที่รวมมาให้
- **เวิร์กโฟลว์ล้ำหน้า (สำหรับนักพัฒนา):** รัน Gateway ด้วยตัวเองผ่าน `pnpm gateway:watch` จากนั้นให้แอป macOS เชื่อมต่อในโหมด Local

## ข้อกำหนดเบื้องต้น (จากซอร์ส)

- แนะนำ Node 24 (ยังรองรับ Node 22 LTS ซึ่งปัจจุบันคือ `22.16+`)
- จำเป็นต้องใช้ `pnpm` สำหรับซอร์สเช็กเอาต์ OpenClaw โหลด plugins ที่รวมมาให้จากแพ็กเกจ pnpm workspace
  `extensions/*` ในโหมดพัฒนา ดังนั้นการรัน `npm install` ที่รูตจึง
  ไม่ได้เตรียมซอร์สทรีทั้งหมด
- Docker (ไม่บังคับ; ใช้เฉพาะสำหรับการตั้งค่า/e2e แบบคอนเทนเนอร์ - ดู [Docker](/th/install/docker))

## กลยุทธ์การปรับแต่ง (เพื่อให้อัปเดตแล้วไม่กระทบ)

หากคุณต้องการให้ "ปรับให้เข้ากับฉัน 100%" _และ_ อัปเดตได้ง่าย ให้เก็บการปรับแต่งไว้ใน:

- **การกำหนดค่า:** `~/.openclaw/openclaw.json` (คล้าย JSON/JSON5)
- **พื้นที่ทำงาน:** `~/.openclaw/workspace` (skills, prompts, memories; ทำให้เป็นรีโพ git ส่วนตัว)

บูตสแตรปหนึ่งครั้ง:

```bash
openclaw setup
```

จากภายในรีโพนี้ ให้ใช้ทางเข้า CLI แบบโลคัล:

```bash
openclaw setup
```

หากคุณยังไม่มีการติดตั้งแบบโกลบอล ให้รันผ่าน `pnpm openclaw setup`

## รัน Gateway จากรีโพนี้

หลังจาก `pnpm build` คุณสามารถรัน CLI ที่แพ็กเกจแล้วได้โดยตรง:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## เวิร์กโฟลว์เสถียร (เริ่มจากแอป macOS)

1. ติดตั้ง + เปิด **OpenClaw.app** (แถบเมนู)
2. ทำเช็กลิสต์การเริ่มต้นใช้งาน/สิทธิ์ให้ครบ (พรอมป์ TCC)
3. ตรวจสอบให้ Gateway เป็น **Local** และกำลังทำงานอยู่ (แอปจะจัดการให้)
4. เชื่อมโยงพื้นผิวการใช้งาน (ตัวอย่าง: WhatsApp):

```bash
openclaw channels login
```

5. ตรวจสอบความสมบูรณ์เบื้องต้น:

```bash
openclaw health
```

หากบิลด์ของคุณไม่มีการเริ่มต้นใช้งาน:

- รัน `openclaw setup` จากนั้น `openclaw channels login` แล้วจึงเริ่ม Gateway ด้วยตนเอง (`openclaw gateway`)

## เวิร์กโฟลว์ล้ำหน้า (Gateway ในเทอร์มินัล)

เป้าหมาย: ทำงานกับ TypeScript Gateway, ได้ hot reload, และให้ UI ของแอป macOS เชื่อมต่ออยู่

### 0) (ไม่บังคับ) รันแอป macOS จากซอร์สด้วย

หากคุณต้องการให้แอป macOS อยู่บนรุ่นล้ำหน้าด้วย:

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

`gateway:watch` เริ่มหรือรีสตาร์ตกระบวนการเฝ้าดู Gateway ในเซสชัน tmux
ที่มีชื่อ และแนบอัตโนมัติจากเทอร์มินัลแบบโต้ตอบ เชลล์ที่ไม่โต้ตอบจะยังคง
แยกอยู่และพิมพ์ `tmux attach -t openclaw-gateway-watch-main`; ใช้
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` เพื่อให้การรันแบบโต้ตอบ
ยังคงแยกอยู่ หรือใช้ `pnpm gateway:watch:raw` สำหรับโหมดเฝ้าดูใน foreground ตัวเฝ้าดู
จะโหลดซ้ำเมื่อมีการเปลี่ยนแปลงซอร์ส การกำหนดค่า และเมทาดาทาของ bundled-plugin ที่เกี่ยวข้อง หาก
Gateway ที่ถูกเฝ้าดูออกระหว่างเริ่มต้น `gateway:watch` จะรัน
`openclaw doctor --fix --non-interactive` หนึ่งครั้งแล้วลองใหม่; ตั้งค่า
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` เพื่อปิดพาสซ่อมแซมสำหรับงานพัฒนาเท่านั้นนี้
`pnpm openclaw setup` คือขั้นตอนเริ่มต้นการกำหนดค่า/พื้นที่ทำงานแบบโลคัลครั้งเดียวสำหรับเช็กเอาต์ใหม่
`pnpm gateway:watch` ไม่ได้สร้าง `dist/control-ui` ใหม่ ดังนั้นให้รัน `pnpm ui:build` อีกครั้งหลังเปลี่ยนแปลง `ui/` หรือใช้ `pnpm ui:dev` ขณะพัฒนา Control UI

### 2) ชี้แอป macOS ไปยัง Gateway ที่กำลังรันอยู่

ใน **OpenClaw.app**:

- โหมดการเชื่อมต่อ: **Local**
  แอปจะเชื่อมต่อกับ gateway ที่กำลังรันอยู่บนพอร์ตที่กำหนดค่าไว้

### 3) ตรวจสอบ

- สถานะ Gateway ในแอปควรแสดงว่า **"ใช้ gateway ที่มีอยู่ …"**
- หรือผ่าน CLI:

```bash
openclaw health
```

### ข้อผิดพลาดที่พบบ่อย

- **พอร์ตผิด:** ค่าเริ่มต้นของ Gateway WS คือ `ws://127.0.0.1:18789`; ให้แอป + CLI ใช้พอร์ตเดียวกัน
- **ตำแหน่งที่เก็บสถานะ:**
  - สถานะช่องทาง/ผู้ให้บริการ: `~/.openclaw/credentials/`
  - โปรไฟล์ยืนยันตัวตนของโมเดล: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - เซสชัน: `~/.openclaw/agents/<agentId>/sessions/`
  - ล็อก: `/tmp/openclaw/`

## แผนผังการจัดเก็บข้อมูลรับรอง

ใช้ส่วนนี้เมื่อดีบักการยืนยันตัวตนหรือเมื่อตัดสินใจว่าจะสำรองข้อมูลใด:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **โทเคนบอต Telegram**: config/env หรือ `channels.telegram.tokenFile` (ไฟล์ปกติเท่านั้น; ไม่รับ symlinks)
- **โทเคนบอต Discord**: config/env หรือ SecretRef (ผู้ให้บริการ env/file/exec)
- **โทเคน Slack**: config/env (`channels.slack.*`)
- **allowlists สำหรับการจับคู่**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (บัญชีเริ่มต้น)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (บัญชีที่ไม่ใช่ค่าเริ่มต้น)
- **โปรไฟล์ยืนยันตัวตนของโมเดล**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **payload ความลับที่อิงไฟล์ (ไม่บังคับ)**: `~/.openclaw/secrets.json`
- **การนำเข้า OAuth รุ่นเก่า**: `~/.openclaw/credentials/oauth.json`
  รายละเอียดเพิ่มเติม: [ความปลอดภัย](/th/gateway/security#credential-storage-map)

## การอัปเดต (โดยไม่ทำให้การตั้งค่าของคุณพัง)

- เก็บ `~/.openclaw/workspace` และ `~/.openclaw/` เป็น "ของของคุณ"; อย่าใส่พรอมป์/การกำหนดค่าส่วนตัวไว้ในรีโพ `openclaw`
- การอัปเดตซอร์ส: `git pull` + `pnpm install` + ใช้ `pnpm gateway:watch` ต่อไป

## Linux (บริการผู้ใช้ systemd)

การติดตั้งบน Linux ใช้บริการ **ผู้ใช้** ของ systemd ตามค่าเริ่มต้น systemd จะหยุด
บริการผู้ใช้เมื่อออกจากระบบ/ไม่ได้ใช้งาน ซึ่งจะปิด Gateway การเริ่มต้นใช้งานจะพยายามเปิดใช้
lingering ให้คุณ (อาจขอ sudo) หากยังปิดอยู่ ให้รัน:

```bash
sudo loginctl enable-linger $USER
```

สำหรับเซิร์ฟเวอร์ที่ต้องเปิดตลอดเวลาหรือมีผู้ใช้หลายคน ให้พิจารณาใช้บริการ **ระบบ** แทน
บริการผู้ใช้ (ไม่ต้องใช้ lingering) ดูหมายเหตุ systemd ได้ที่ [คู่มือปฏิบัติการ Gateway](/th/gateway)

## เอกสารที่เกี่ยวข้อง

- [คู่มือปฏิบัติการ Gateway](/th/gateway) (flags, supervision, ports)
- [การกำหนดค่า Gateway](/th/gateway/configuration) (config schema + examples)
- [Discord](/th/channels/discord) และ [Telegram](/th/channels/telegram) (reply tags + replyToMode settings)
- [การตั้งค่าผู้ช่วย OpenClaw](/th/start/openclaw)
- [แอป macOS](/th/platforms/macos) (วงจรชีวิต gateway)
