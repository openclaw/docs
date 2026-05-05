---
read_when:
    - การติดตั้ง OpenClaw บน Windows
    - การเลือกระหว่าง Windows แบบเนทีฟกับ WSL2
    - กำลังค้นหาสถานะแอปคู่หูสำหรับ Windows
summary: 'การรองรับ Windows: เส้นทางการติดตั้งแบบเนทีฟและ WSL2, ดีมอน และข้อควรทราบในปัจจุบัน'
title: Windows
x-i18n:
    generated_at: "2026-05-05T06:18:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: adf885747e3a897cb4ee57f6494805468d38c4595c0ab7582b063153a1134d18
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw รองรับทั้ง **Windows แบบเนทีฟ** และ **WSL2** WSL2 เป็นเส้นทางที่เสถียรกว่าและแนะนำสำหรับประสบการณ์เต็มรูปแบบ — CLI, Gateway และเครื่องมือต่าง ๆ ทำงานภายใน Linux พร้อมความเข้ากันได้เต็มรูปแบบ Windows แบบเนทีฟใช้งานได้สำหรับ CLI หลักและการใช้งาน Gateway โดยมีข้อควรระวังบางอย่างที่ระบุไว้ด้านล่าง

มีแผนสำหรับแอปคู่หูบน Windows แบบเนทีฟ

## WSL2 (แนะนำ)

- [เริ่มต้นใช้งาน](/th/start/getting-started) (ใช้ภายใน WSL)
- [การติดตั้งและอัปเดต](/th/install/updating)
- คู่มือ WSL2 อย่างเป็นทางการ (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## สถานะ Windows แบบเนทีฟ

โฟลว์ CLI บน Windows แบบเนทีฟกำลังปรับปรุงอยู่ แต่ WSL2 ยังคงเป็นเส้นทางที่แนะนำ

สิ่งที่ทำงานได้ดีบน Windows แบบเนทีฟในปัจจุบัน:

- ตัวติดตั้งผ่านเว็บไซต์ด้วย `install.ps1`
- การใช้งาน CLI แบบ local เช่น `openclaw --version`, `openclaw doctor` และ `openclaw plugins list --json`
- การทดสอบ smoke ของ local-agent/provider แบบฝังตัว เช่น:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

ข้อควรระวังปัจจุบัน:

- `openclaw onboard --non-interactive` ยังคงคาดหวัง Gateway แบบ local ที่เข้าถึงได้ เว้นแต่คุณจะส่ง `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` และ `openclaw gateway install` จะลองใช้ Windows Scheduled Tasks ก่อน
- หากการสร้าง Scheduled Task ถูกปฏิเสธ OpenClaw จะถอยกลับไปใช้รายการเข้าสู่ระบบในโฟลเดอร์ Startup ต่อผู้ใช้ และเริ่ม Gateway ทันที
- หาก `schtasks` ค้างหรือหยุดตอบสนอง OpenClaw จะยกเลิกเส้นทางนั้นอย่างรวดเร็วและถอยกลับแทนที่จะค้างตลอดไป
- Scheduled Tasks ยังคงเป็นตัวเลือกที่ต้องการเมื่อใช้งานได้ เพราะให้สถานะตัวควบคุมบริการที่ดีกว่า

หากคุณต้องการเฉพาะ CLI แบบเนทีฟ โดยไม่ติดตั้งบริการ Gateway ให้ใช้หนึ่งในคำสั่งเหล่านี้:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

หากคุณต้องการการเริ่มต้นแบบจัดการบน Windows แบบเนทีฟ:

```powershell
openclaw gateway install
openclaw gateway status --json
```

หากการสร้าง Scheduled Task ถูกบล็อก โหมดบริการสำรองจะยังคงเริ่มอัตโนมัติหลังเข้าสู่ระบบผ่านโฟลเดอร์ Startup ของผู้ใช้ปัจจุบัน

## Gateway

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [การกำหนดค่า](/th/gateway/configuration)

## การติดตั้งบริการ Gateway (CLI)

ภายใน WSL2:

```
openclaw onboard --install-daemon
```

หรือ:

```
openclaw gateway install
```

หรือ:

```
openclaw configure
```

เลือก **บริการ Gateway** เมื่อระบบถาม

ซ่อมแซม/ย้ายข้อมูล:

```
openclaw doctor
```

## การเริ่ม Gateway อัตโนมัติก่อนเข้าสู่ระบบ Windows

สำหรับการตั้งค่าแบบไม่มีหน้าจอ ให้ตรวจสอบว่าห่วงโซ่การบูตทั้งหมดทำงานแม้ไม่มีใครเข้าสู่ระบบ Windows

### 1) ให้บริการผู้ใช้ทำงานต่อโดยไม่ต้องเข้าสู่ระบบ

ภายใน WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) ติดตั้งบริการผู้ใช้ OpenClaw gateway

ภายใน WSL:

```bash
openclaw gateway install
```

### 3) เริ่ม WSL อัตโนมัติเมื่อ Windows บูต

ใน PowerShell ในฐานะผู้ดูแลระบบ:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

แทนที่ `Ubuntu` ด้วยชื่อดิสโทรของคุณจาก:

```powershell
wsl --list --verbose
```

### ตรวจสอบห่วงโซ่การเริ่มต้น

หลังรีบูต (ก่อนลงชื่อเข้าใช้ Windows) ให้ตรวจสอบจาก WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## ขั้นสูง: เปิดบริการ WSL ให้เข้าถึงผ่าน LAN (portproxy)

WSL มีเครือข่ายเสมือนของตัวเอง หากเครื่องอื่นจำเป็นต้องเข้าถึงบริการที่ทำงาน **ภายใน WSL** (SSH, เซิร์ฟเวอร์ TTS แบบ local หรือ Gateway) คุณต้องส่งต่อพอร์ตของ Windows ไปยัง IP ของ WSL ปัจจุบัน IP ของ WSL จะเปลี่ยนหลังรีสตาร์ต ดังนั้นคุณอาจต้องรีเฟรชกฎการส่งต่อ

ตัวอย่าง (PowerShell **ในฐานะผู้ดูแลระบบ**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

อนุญาตพอร์ตผ่าน Windows Firewall (ครั้งเดียว):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

รีเฟรช portproxy หลัง WSL รีสตาร์ต:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

หมายเหตุ:

- SSH จากเครื่องอื่นจะชี้ไปที่ **IP ของโฮสต์ Windows** (ตัวอย่าง: `ssh user@windows-host -p 2222`)
- โหนดระยะไกลต้องชี้ไปยัง URL ของ Gateway ที่ **เข้าถึงได้** (ไม่ใช่ `127.0.0.1`); ใช้ `openclaw status --all` เพื่อยืนยัน
- ใช้ `listenaddress=0.0.0.0` สำหรับการเข้าถึงผ่าน LAN; `127.0.0.1` จะทำให้เป็น local เท่านั้น
- หากคุณต้องการให้ทำงานอัตโนมัติ ให้ลงทะเบียน Scheduled Task เพื่อรันขั้นตอนรีเฟรชเมื่อเข้าสู่ระบบ

## การติดตั้ง WSL2 แบบทีละขั้นตอน

### 1) ติดตั้ง WSL2 + Ubuntu

เปิด PowerShell (ผู้ดูแลระบบ):

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

รีบูตหาก Windows แจ้งให้ทำ

### 2) เปิดใช้งาน systemd (จำเป็นสำหรับการติดตั้ง Gateway)

ในเทอร์มินัล WSL ของคุณ:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

จากนั้นจาก PowerShell:

```powershell
wsl --shutdown
```

เปิด Ubuntu อีกครั้ง แล้วตรวจสอบ:

```bash
systemctl --user status
```

### 3) ติดตั้ง OpenClaw (ภายใน WSL)

สำหรับการตั้งค่าครั้งแรกตามปกติภายใน WSL ให้ทำตามโฟลว์เริ่มต้นใช้งาน Linux:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

หากคุณกำลังพัฒนาจากซอร์สแทนการเริ่ม onboarding ครั้งแรก ให้ใช้ local dev loop จาก [การตั้งค่า](/th/start/setup):

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

คู่มือฉบับเต็ม: [เริ่มต้นใช้งาน](/th/start/getting-started)

## แอปคู่หู Windows

เรายังไม่มีแอปคู่หู Windows ในตอนนี้ ยินดีรับการมีส่วนร่วมหากคุณต้องการช่วยทำให้เกิดขึ้น

## การเชื่อมต่อ Git และ GitHub (ผู้มีส่วนร่วม)

บางเครือข่ายบล็อกหรือจำกัด HTTPS ไปยัง GitHub หาก `git clone` ล้มเหลวด้วย timeout หรือการรีเซ็ตการเชื่อมต่อ ให้ลองใช้เครือข่ายอื่น, VPN หรือพร็อกซี HTTP/HTTPS ที่องค์กรของคุณจัดเตรียมไว้

หาก `gh auth login` ล้มเหลวระหว่างโฟลว์อุปกรณ์ผ่านเบราว์เซอร์ (เช่น timeout ขณะเข้าถึง `github.com:443`) ให้ตรวจสอบสิทธิ์ด้วย personal access token แทน:

1. สร้าง token ที่มี scope อย่างน้อย `repo` (classic PAT) หรือสิทธิ์แบบ fine-grained ที่เทียบเท่า
2. ใน PowerShell สำหรับเซสชันปัจจุบัน:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

3. หาก `gh auth status` เตือนว่าไม่มี `read:org` ให้สร้าง token ที่มี scope นั้นและกำหนดตัวแปรใหม่:

```powershell
$env:GH_TOKEN="<your-token-with-repo-and-read:org>"
gh auth status
```

`gh auth refresh -s read:org` ใช้ได้เฉพาะเมื่อคุณตรวจสอบสิทธิ์ผ่าน `gh auth login` และมี credentials ที่จัดเก็บไว้ให้รีเฟรช (ไม่ใช่เมื่อใช้ `GH_TOKEN`)

อย่า commit token หรือวาง token ลงใน issues หรือ pull requests

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [แพลตฟอร์ม](/th/platforms)
