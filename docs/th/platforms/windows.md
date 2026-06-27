---
read_when:
    - การติดตั้ง OpenClaw บน Windows
    - การเลือกระหว่าง Windows Hub, Windows แบบเนทีฟ และ WSL2
    - การตั้งค่าแอปคู่หู Windows หรือโหมดโหนด Windows
summary: 'รองรับ Windows: Windows Hub, CLI และ Gateway แบบเนทีฟ, การตั้งค่า Gateway บน WSL2, โหมด Node และการแก้ไขปัญหา'
title: Windows
x-i18n:
    generated_at: "2026-06-27T17:50:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7c7bde33f27bce6c1136ccf688547ee82750d317a997c4a45b354c52ae1b690
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw มาพร้อมแอปคู่หู **Windows Hub** แบบเนทีฟ พร้อมการรองรับ Windows CLI
ใช้ Windows Hub เมื่อคุณต้องการแอปเดสก์ท็อปที่มีการตั้งค่า สถานะในถาดระบบ แชต
การวินิจฉัยของ Command Center และความสามารถของโหนด Windows ใช้ตัวติดตั้ง PowerShell
เมื่อคุณต้องการ CLI/Gateway โดยตรง ใช้ WSL2 เมื่อคุณต้องการรันไทม์ Gateway
ที่เข้ากันได้กับ Linux มากที่สุด

## แนะนำ: Windows Hub

Windows Hub คือแอปคู่หู WinUI แบบเนทีฟสำหรับ Windows 10 20H2+ และ Windows 11 แอปนี้ติดตั้งได้โดยไม่ต้องมีสิทธิ์ผู้ดูแลระบบ และเผยแพร่พร้อมตัวติดตั้ง x64 และ ARM64 ที่ลงลายเซ็นแล้วในรุ่นเผยแพร่ของ OpenClaw

ดาวน์โหลดตัวติดตั้งเสถียรรุ่นล่าสุดจาก [หน้ารุ่นเผยแพร่ของ OpenClaw](https://github.com/openclaw/openclaw/releases):

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-arm64.exe)
- [Checksums](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-SHA256SUMS.txt)

หากลิงก์ดาวน์โหลดด้านบนคืนค่า 404 ให้ไปที่ [หน้ารุ่นเผยแพร่](https://github.com/openclaw/openclaw/releases) และมองหาแอสเซ็ต `OpenClawCompanion-Setup-*` ในรุ่นเผยแพร่ล่าสุด

หลังติดตั้ง ให้เปิด **OpenClaw Companion** จากเมนู Start หรือถาดระบบ
ตัวติดตั้งยังเพิ่มทางลัดสำหรับการตั้งค่า Gateway, Chat, Settings,
Check for Updates และถอนการติดตั้งด้วย

### สิ่งที่ Windows Hub มีให้

- สถานะในถาดระบบและการเปิดเมื่อเข้าสู่ระบบ
- การตั้งค่าครั้งแรกสำหรับ WSL Gateway ภายในเครื่องที่แอปเป็นเจ้าของ
- การตั้งค่าการเชื่อมต่อสำหรับ Gateway ภายในเครื่อง ระยะไกล และผ่าน SSH tunnel
- หน้าต่างแชตแบบเนทีฟ พร้อมการเข้าถึง Control UI ผ่านเบราว์เซอร์
- การวินิจฉัยของ Command Center สำหรับเซสชัน การใช้งาน ช่องทาง โหนด การจับคู่ และ
  คำสั่งซ่อมแซม
- โหมดโหนด Windows สำหรับ canvas ที่ควบคุมโดยเอเจนต์ หน้าจอ กล้อง การแจ้งเตือน
  สถานะอุปกรณ์ การแปลงข้อความเป็นเสียง การแปลงเสียงเป็นข้อความ และ `system.run` ที่ถูกควบคุม
- โหมดเซิร์ฟเวอร์ MCP ภายในเครื่องสำหรับไคลเอนต์ MCP เช่น Claude Desktop, Claude Code และ
  Cursor

### การเปิดใช้งานครั้งแรก

เมื่อเปิดใช้งานครั้งแรก Windows Hub จะเปิดการตั้งค่าเมื่อไม่มี Gateway ที่บันทึกไว้และใช้งานได้
เส้นทางที่เร็วที่สุดคือ **Set up locally** ซึ่งจะจัดเตรียมดิสโทร WSL
`OpenClawGateway` ที่แอปเป็นเจ้าของ ติดตั้ง Gateway ข้างในนั้น และจับคู่แอป
การทำเช่นนี้จะไม่ส่งออกหรือแก้ไขดิสโทร Ubuntu ที่คุณมีอยู่

เลือก **Advanced setup** หรือเปิดแท็บ Connections เมื่อคุณมี
Gateway อยู่แล้ว คุณสามารถเชื่อมต่อกับ:

- Gateway ภายในเครื่องบนพีซีเครื่องนี้
- WSL Gateway บนพีซีเครื่องนี้
- Gateway ระยะไกลด้วย URL และโทเค็นหรือรหัสตั้งค่า
- Gateway ที่เข้าถึงผ่าน SSH tunnel

เมื่อตั้งค่าเสร็จ ไอคอนในถาดระบบจะเปลี่ยนเป็นสีเขียว เปิด **Command Center** จากถาดระบบ
เพื่อยืนยันการเชื่อมต่อ การจับคู่ สถานะโหนด และสุขภาพของช่องทาง

## โหมดโหนด Windows

Windows Hub สามารถลงทะเบียนเป็นโหนด OpenClaw ชั้นหนึ่งได้ จากนั้นเอเจนต์สามารถใช้
ความสามารถแบบเนทีฟของ Windows ที่ประกาศไว้ผ่าน Gateway

คำสั่งทั่วไปประกอบด้วย:

- `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`,
  `canvas.snapshot`
- `screen.snapshot` และ `screen.record` เมื่อยินยอมอย่างชัดเจน
- `camera.list` และ `camera.snap`, `camera.clip` เมื่อยินยอมอย่างชัดเจน
- `system.notify`, `system.run`, `system.run.prepare`, `system.which`
- `location.get`, `device.info`, `device.status`
- `stt.transcribe`, `tts.speak`

โหมดโหนดต้องจับคู่กับ Gateway หากแอปแสดงคำขอจับคู่ ให้อนุมัติ
จากโฮสต์ Gateway:

```powershell
openclaw devices list
openclaw devices approve <request-id>
openclaw nodes status
```

Gateway จะส่งต่อเฉพาะคำสั่งที่โหนดประกาศและนโยบายเซิร์ฟเวอร์อนุญาตเท่านั้น
คำสั่งที่อ่อนไหวต่อความเป็นส่วนตัว เช่น `screen.record`, `camera.snap` และ
`camera.clip` ต้องเลือกยินยอม `gateway.nodes.allowCommands` อย่างชัดเจน

## โหมด MCP ภายในเครื่อง

Windows Hub สามารถเปิดเผยรีจิสทรีความสามารถแบบเนทีฟของ Windows เดียวกันเป็นเซิร์ฟเวอร์
MCP ภายในเครื่องบน local loopback ได้ สิ่งนี้มีประโยชน์เมื่อคุณต้องการให้ไคลเอนต์ MCP ภายในเครื่องขับเคลื่อน
ความสามารถของ Windows โดยไม่ต้องมี OpenClaw Gateway ที่กำลังทำงาน

เปิดใช้งานได้ใน Settings ของ Windows Hub ใต้ส่วน developer/advanced แอปจะ
แสดงปลายทาง local loopback และ bearer token หลังจากเปิดใช้งานเซิร์ฟเวอร์แล้ว

เมทริกซ์โหมด:

| โหมดโหนด | เซิร์ฟเวอร์ MCP | พฤติกรรม                           |
| --------- | ---------- | ---------------------------------- |
| ปิด       | ปิด        | แอปเดสก์ท็อปสำหรับโอเปอเรเตอร์เท่านั้น          |
| เปิด        | ปิด        | โหนด Windows ที่เชื่อมต่อกับ Gateway     |
| ปิด       | เปิด         | เซิร์ฟเวอร์ MCP ภายในเครื่องเท่านั้น              |
| เปิด        | เปิด         | โหนด Gateway พร้อมเซิร์ฟเวอร์ MCP ภายในเครื่อง |

## Windows CLI และ Gateway แบบเนทีฟ

สำหรับการใช้งานที่เน้นเทอร์มินัลก่อน ให้ติดตั้ง OpenClaw จาก PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

ตรวจสอบ:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

โฟลว์ Windows CLI และ Gateway แบบเนทีฟได้รับการรองรับและยังคงพัฒนาอย่างต่อเนื่อง
การเริ่มต้นที่จัดการไว้ใช้ Windows Scheduled Tasks เมื่อพร้อมใช้งาน งานจะเก็บสคริปต์
`gateway.cmd` ที่อ่านได้ไว้ในไดเรกทอรีสถานะ OpenClaw แต่เปิดใช้งานผ่าน
ตัวครอบ WScript `gateway.vbs` ที่สร้างขึ้น เพื่อให้ Gateway ที่ทำงานเบื้องหลังไม่เปิด
หน้าต่างคอนโซลที่มองเห็นได้ หากการสร้างงานถูกปฏิเสธ OpenClaw จะถอยกลับไปใช้
รายการเข้าสู่ระบบในโฟลเดอร์ Startup สำหรับผู้ใช้แต่ละคน

หากต้องการติดตั้งบริการ Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

หากคุณต้องการใช้เฉพาะ CLI โดยไม่มีบริการ Gateway ที่จัดการไว้:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 Gateway

WSL2 ยังคงเป็นรันไทม์ Gateway บน Windows ที่เข้ากันได้กับ Linux มากที่สุด Windows Hub
สามารถตั้งค่า WSL Gateway ที่แอปเป็นเจ้าของให้คุณได้ หรือคุณจะติดตั้งเองภายใน
ดิสโทรของคุณก็ได้

การตั้งค่าด้วยตนเอง:

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

เปิดใช้งาน systemd ภายใน WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

รีสตาร์ต WSL จาก PowerShell:

```powershell
wsl --shutdown
```

จากนั้นติดตั้ง OpenClaw ภายใน WSL ด้วย Linux quickstart:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## การเริ่ม Gateway อัตโนมัติก่อนเข้าสู่ระบบ Windows

สำหรับการตั้งค่า WSL แบบ headless ให้ตรวจสอบว่าเชนการบูตทั้งหมดทำงานแม้ไม่มีใครเข้าสู่ระบบ
Windows

ภายใน WSL:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

ใน PowerShell ในฐานะผู้ดูแลระบบ:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

แทนที่ `Ubuntu` ด้วยชื่อดิสโทรของคุณจาก:

```powershell
wsl --list --verbose
```

> **หมายเหตุ:** มีการเปลี่ยนแปลงสองอย่างจากสูตรรุ่นเก่า:
>
> - **`dbus-launch true` แทน `/bin/true`** — ใน WSL ≥ 2.6.1.0 มี regression ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)) ที่ทำให้ดิสโทรยุติตัวเองเมื่อ idle หลังจากไคลเอนต์สุดท้ายออกไป 15–20 วินาที แม้เปิด linger แล้วก็ตาม `dbus-launch true` ทำให้กระบวนการ child-of-init ยังทำงานอยู่เป็นวิธีแก้ปัญหาชั่วคราว ([การสนทนาในชุมชน, microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245))
> - **`/ru "$env:USERNAME"` แทน `/ru SYSTEM`** — ดิสโทร WSL แบบรายผู้ใช้ (การตั้งค่าเริ่มต้น) ไม่ปรากฏต่อบัญชี SYSTEM งานจะดูเหมือนทำงาน แต่ดิสโทรจะไม่ถูกเริ่มเลย การรันในบัญชีของคุณเองช่วยหลีกเลี่ยงปัญหานี้ Windows จะถามรหัสผ่านของคุณเมื่อสร้างงาน

หลังรีบูต ให้ตรวจสอบจาก WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## เปิดเผยบริการ WSL ผ่าน LAN

WSL มีเครือข่ายเสมือนของตัวเอง หากเครื่องอื่นต้องเข้าถึงบริการภายใน
WSL ให้ส่งต่อพอร์ต Windows ไปยัง IP ปัจจุบันของ WSL IP ของ WSL อาจเปลี่ยนหลัง
รีสตาร์ต ดังนั้นให้รีเฟรชกฎการส่งต่อเมื่อจำเป็น

ตัวอย่างใน PowerShell ในฐานะผู้ดูแลระบบ:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

หมายเหตุ:

- SSH จากเครื่องอื่นจะชี้ไปที่ IP ของโฮสต์ Windows เช่น
  `ssh user@windows-host -p 2222`
- โหนดระยะไกลต้องชี้ไปที่ URL ของ Gateway ที่เข้าถึงได้ ไม่ใช่ `127.0.0.1`
- ใช้ `listenaddress=0.0.0.0` สำหรับการเข้าถึงผ่าน LAN ใช้ `127.0.0.1` สำหรับการเข้าถึง
  เฉพาะภายในเครื่อง

## การแก้ไขปัญหา

### ไอคอนในถาดระบบไม่ปรากฏ

ตรวจสอบ Task Manager สำหรับ `OpenClaw.Tray.WinUI.exe` หากกำลังทำงานอยู่ ให้เปิดพื้นที่
ไอคอนถาดระบบที่ซ่อนอยู่และปักหมุดไว้ หากไม่ได้ทำงาน ให้เปิด **OpenClaw
Companion** จากเมนู Start

### การตั้งค่าภายในเครื่องล้มเหลว

เปิดบันทึกการตั้งค่าจาก Windows Hub หรือตรวจสอบ:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

สาเหตุทั่วไปคือ WSL ถูกปิดใช้งาน การจำลองเสมือนถูกบล็อก สถานะ WSL
ที่แอปเป็นเจ้าของค้างอยู่ หรือเครือข่ายล้มเหลวระหว่างติดตั้งแพ็กเกจ Gateway

### แอปแจ้งว่าต้องจับคู่

อนุมัติคำขอโอเปอเรเตอร์หรือโหนดจาก Gateway:

```powershell
openclaw devices list
openclaw devices approve <request-id>
```

หากอุปกรณ์มีโทเค็นอยู่แล้ว ให้เชื่อมต่อใหม่จากแท็บ Connections หลัง
อนุมัติ

### เว็บแชตเข้าถึง Gateway ระยะไกลไม่ได้

เว็บแชตระยะไกลต้องใช้ HTTPS หรือ localhost สำหรับใบรับรองที่ลงนามเอง ให้เชื่อถือ
ใบรับรองใน Windows หรือใช้ SSH tunnel ไปยัง URL localhost

### คำสั่ง `screen.snapshot`, กล้อง หรือเสียงล้มเหลว

ยืนยันสิทธิ์ของ Windows สำหรับกล้อง ไมโครโฟน การจับภาพหน้าจอ และ
การแจ้งเตือน การติดตั้งแบบแพ็กเกจจะประกาศความสามารถที่ได้รับการป้องกันไว้แล้ว แต่ Windows
อาจยังแจ้งเตือนในครั้งแรกที่คำสั่งใช้ความสามารถเหล่านั้น

### การเชื่อมต่อ Git หรือ GitHub ล้มเหลว

บางเครือข่ายบล็อกหรือจำกัดความเร็ว HTTPS ไปยัง GitHub หาก `git clone` หรือ `gh auth
login` ล้มเหลว ให้ลองเครือข่ายอื่น VPN หรือพร็อกซี HTTP/HTTPS

สำหรับการยืนยันตัวตน `gh` ด้วยโทเค็นในเซสชันปัจจุบัน:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

ห้าม commit โทเค็นหรือวางโทเค็นลงใน issue หรือ pull request

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [การตั้งค่า Node.js](/th/install/node)
- [โหนด](/th/nodes)
- [Control UI](/th/web/control-ui)
- [การกำหนดค่า Gateway](/th/gateway/configuration)
