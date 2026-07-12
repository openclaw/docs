---
read_when:
    - คุณต้องการลบ OpenClaw ออกจากเครื่อง
    - บริการ Gateway ยังคงทำงานอยู่หลังจากถอนการติดตั้ง
summary: ถอนการติดตั้ง OpenClaw อย่างสมบูรณ์ (CLI, บริการ, สถานะ, พื้นที่ทำงาน)
title: ถอนการติดตั้ง
x-i18n:
    generated_at: "2026-07-12T16:19:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

สองวิธี:

- **วิธีง่าย** หากยังติดตั้ง `openclaw` อยู่
- **นำบริการออกด้วยตนเอง** หากไม่มี CLI แล้ว แต่บริการยังทำงานอยู่

## วิธีง่าย (ยังติดตั้ง CLI อยู่)

แนะนำ: ใช้โปรแกรมถอนการติดตั้งในตัว:

```bash
openclaw uninstall
```

การลบสถานะจะเก็บรักษาไดเรกทอรีพื้นที่ทำงานที่กำหนดค่าไว้ เว้นแต่คุณจะเลือก `--workspace` ด้วย

ดูตัวอย่างสิ่งที่จะถูกลบ (ปลอดภัย):

```bash
openclaw uninstall --dry-run --all
```

แบบไม่โต้ตอบ (ระบบอัตโนมัติ / npx) โปรดใช้อย่างระมัดระวังและหลังจากยืนยันขอบเขตแล้วเท่านั้น:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

แฟล็ก: `--service`, `--state`, `--workspace`, `--app` ใช้เลือกแต่ละขอบเขตแยกกัน ส่วน `--all` เลือกทั้งสี่ขอบเขต

ขั้นตอนด้วยตนเอง (ได้ผลลัพธ์เดียวกัน):

1. หยุดบริการ Gateway:

```bash
openclaw gateway stop
```

2. ถอนการติดตั้งบริการ Gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. ลบสถานะและการกำหนดค่า:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

หากคุณตั้งค่า `OPENCLAW_CONFIG_PATH` เป็นตำแหน่งแบบกำหนดเองที่อยู่นอกไดเรกทอรีสถานะ ให้ลบไฟล์นั้นด้วย
หากคุณต้องการเก็บพื้นที่ทำงานที่อยู่ภายในไดเรกทอรีสถานะ เช่น `~/.openclaw/workspace` ให้ย้ายออกไปก่อนเรียกใช้ `rm -rf` หรือลบเฉพาะเนื้อหาสถานะที่ต้องการ

4. ลบพื้นที่ทำงานของคุณ (ไม่บังคับ เป็นการลบไฟล์ของเอเจนต์):

```bash
rm -rf ~/.openclaw/workspace
```

5. นำการติดตั้ง CLI ออก (เลือกคำสั่งที่ตรงกับวิธีที่คุณใช้ติดตั้ง):

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
- ในโหมดระยะไกล ไดเรกทอรีสถานะจะอยู่บน **โฮสต์ Gateway** ดังนั้นให้ทำขั้นตอนที่ 1-4 ที่นั่นด้วย

## นำบริการออกด้วยตนเอง (ไม่ได้ติดตั้ง CLI)

ใช้วิธีนี้หากบริการ Gateway ยังคงทำงานอยู่ แต่ไม่มี `openclaw`

### macOS (launchd)

ป้ายกำกับเริ่มต้นคือ `ai.openclaw.gateway` (หรือ `ai.openclaw.<profile>` เมื่อใช้โปรไฟล์):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

หากคุณใช้โปรไฟล์ ให้แทนที่ป้ายกำกับและชื่อไฟล์ plist ด้วย `ai.openclaw.<profile>`

### Linux (ยูนิตผู้ใช้ systemd)

ชื่อยูนิตเริ่มต้นคือ `openclaw-gateway.service` (หรือ `openclaw-gateway-<profile>.service`) ยูนิตชื่อเดิมก่อนเปลี่ยนชื่อ `clawdbot-gateway.service` อาจยังคงอยู่บนเครื่องที่อัปเกรดมาจากการติดตั้งรุ่นเก่ามาก โดย `openclaw uninstall` / `openclaw gateway uninstall` จะตรวจพบและนำออกโดยอัตโนมัติ

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (งานที่จัดกำหนดการไว้)

ชื่องานเริ่มต้นคือ `OpenClaw Gateway` (หรือ `OpenClaw Gateway (<profile>)`)
งานนี้เรียกใช้สคริปต์ `gateway.vbs` แบบไม่มีหน้าต่างภายใต้ไดเรกทอรีสถานะของคุณ ซึ่งจะเรียกใช้ `gateway.cmd` ต่ออีกทอดหนึ่ง ให้ลบทั้งสองไฟล์

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

หากคุณใช้โปรไฟล์ ให้ลบงานที่มีชื่อตรงกันและไฟล์ `gateway.cmd` /
`gateway.vbs` ภายใต้ `~\.openclaw-<profile>`

## การติดตั้งปกติเทียบกับการเช็กเอาต์ซอร์ส

### การติดตั้งปกติ (install.sh / npm / pnpm / bun)

หากคุณใช้ `https://openclaw.ai/install.sh` หรือ `install.ps1` CLI จะถูกติดตั้งด้วย `npm install -g openclaw@latest`
ให้นำออกด้วย `npm rm -g openclaw` (หรือ `pnpm remove -g` / `bun remove -g` หากคุณติดตั้งด้วยวิธีนั้น)

### การเช็กเอาต์ซอร์ส (git clone)

หากคุณเรียกใช้จากการเช็กเอาต์รีโพ (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. ถอนการติดตั้งบริการ Gateway **ก่อน** ลบรีโพ (ใช้วิธีง่ายด้านบนหรือนำบริการออกด้วยตนเอง)
2. ลบไดเรกทอรีรีโพ
3. ลบสถานะและพื้นที่ทำงานตามที่แสดงด้านบน

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [คู่มือการย้ายระบบ](/th/install/migrating)
