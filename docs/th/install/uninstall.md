---
read_when:
    - คุณต้องการลบ OpenClaw ออกจากเครื่อง
    - บริการ Gateway ยังคงทำงานอยู่หลังจากถอนการติดตั้ง
summary: ถอนการติดตั้ง OpenClaw อย่างสมบูรณ์ (CLI, บริการ, สถานะ, พื้นที่ทำงาน)
title: ถอนการติดตั้ง
x-i18n:
    generated_at: "2026-06-27T17:45:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0f63bde2769b3d35d928aed1668121086a2952338f2634d45d55da8cc637025b
    source_path: install/uninstall.md
    workflow: 16
---

สองเส้นทาง:

- **เส้นทางง่าย** หากยังติดตั้ง `openclaw` อยู่
- **การลบบริการด้วยตนเอง** หาก CLI หายไปแล้วแต่บริการยังทำงานอยู่

## เส้นทางง่าย (ยังติดตั้ง CLI อยู่)

แนะนำ: ใช้ตัวถอนการติดตั้งในตัว:

```bash
openclaw uninstall
```

เมื่อใช้ CLI การลบสถานะจะเก็บไดเรกทอรี workspace ที่กำหนดค่าไว้ เว้นแต่คุณจะเลือก `--workspace` ด้วย

ดูตัวอย่างสิ่งที่จะถูกลบ (ปลอดภัย):

```bash
openclaw uninstall --dry-run --all
```

แบบไม่โต้ตอบ (ระบบอัตโนมัติ / npx) ใช้ด้วยความระมัดระวังและหลังจากยืนยันขอบเขตแล้วเท่านั้น:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

ขั้นตอนด้วยตนเอง (ผลลัพธ์เดียวกัน):

1. หยุดบริการ Gateway:

```bash
openclaw gateway stop
```

2. ถอนการติดตั้งบริการ Gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. ลบสถานะ + การกำหนดค่า:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

หากคุณตั้งค่า `OPENCLAW_CONFIG_PATH` ไปยังตำแหน่งกำหนดเองนอกไดเรกทอรีสถานะ ให้ลบไฟล์นั้นด้วย
หากคุณต้องการเก็บ workspace ภายในไดเรกทอรีสถานะ เช่น `~/.openclaw/workspace` ให้ย้ายออกไปก่อนเรียกใช้ `rm -rf` หรือลบเนื้อหาสถานะแบบเลือกเฉพาะรายการ

4. ลบ workspace ของคุณ (ไม่บังคับ, ลบไฟล์เอเจนต์):

```bash
rm -rf ~/.openclaw/workspace
```

5. ลบการติดตั้ง CLI (เลือกคำสั่งที่คุณใช้ติดตั้ง):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. หากคุณติดตั้งแอป macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

หมายเหตุ:

- หากคุณใช้โปรไฟล์ (`--profile` / `OPENCLAW_PROFILE`) ให้ทำขั้นตอนที่ 3 ซ้ำสำหรับไดเรกทอรีสถานะแต่ละรายการ (ค่าเริ่มต้นคือ `~/.openclaw-<profile>`)
- ในโหมดรีโมต ไดเรกทอรีสถานะอยู่บน **โฮสต์ Gateway** ดังนั้นให้ทำขั้นตอนที่ 1-4 ที่นั่นด้วย

## การลบบริการด้วยตนเอง (ไม่ได้ติดตั้ง CLI)

ใช้วิธีนี้หากบริการ Gateway ยังทำงานอยู่แต่ไม่มี `openclaw`

### macOS (launchd)

ป้ายกำกับเริ่มต้นคือ `ai.openclaw.gateway` (หรือ `ai.openclaw.<profile>`; อาจยังมีแบบเดิม `com.openclaw.*` อยู่):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

หากคุณใช้โปรไฟล์ ให้แทนที่ป้ายกำกับและชื่อ plist ด้วย `ai.openclaw.<profile>` ลบ plist เดิม `com.openclaw.*` ใด ๆ หากมีอยู่

### Linux (systemd user unit)

ชื่อ unit เริ่มต้นคือ `openclaw-gateway.service` (หรือ `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

ชื่องานเริ่มต้นคือ `OpenClaw Gateway` (หรือ `OpenClaw Gateway (<profile>)`)
สคริปต์งานอยู่ใต้ไดเรกทอรีสถานะของคุณในชื่อ `gateway.cmd`; การติดตั้งปัจจุบันอาจ
สร้างตัวเรียกใช้งาน `gateway.vbs` แบบไม่มีหน้าต่างด้วย ซึ่ง Task Scheduler จะเรียกใช้แทน
การเปิด `gateway.cmd` โดยตรง

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

หากคุณใช้โปรไฟล์ ให้ลบชื่องานที่ตรงกันและไฟล์ `gateway.cmd` /
`gateway.vbs` ใต้ `~\.openclaw-<profile>`

## การติดตั้งปกติเทียบกับการ checkout ซอร์ส

### การติดตั้งปกติ (install.sh / npm / pnpm / bun)

หากคุณใช้ `https://openclaw.ai/install.sh` หรือ `install.ps1` CLI จะถูกติดตั้งด้วย `npm install -g openclaw@latest`
ลบด้วย `npm rm -g openclaw` (หรือ `pnpm remove -g` / `bun remove -g` หากคุณติดตั้งด้วยวิธีนั้น)

### การ checkout ซอร์ส (git clone)

หากคุณเรียกใช้จากการ checkout รีโป (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. ถอนการติดตั้งบริการ Gateway **ก่อน** ลบรีโป (ใช้เส้นทางง่ายด้านบนหรือการลบบริการด้วยตนเอง)
2. ลบไดเรกทอรีรีโป
3. ลบสถานะ + workspace ตามที่แสดงด้านบน

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [คู่มือการย้ายข้อมูล](/th/install/migrating)
