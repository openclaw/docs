---
read_when:
    - การติดตั้ง OpenClaw บน Windows
    - การเลือกระหว่าง Windows Hub, Windows แบบเนทีฟ และ WSL2
    - การตั้งค่าแอปคู่หูสำหรับ Windows หรือโหมด Node บน Windows
summary: 'การรองรับ Windows: Windows Hub, CLI และ Gateway แบบเนทีฟ, การตั้งค่า Gateway บน WSL2, โหมด Node และการแก้ไขปัญหา'
title: Windows
x-i18n:
    generated_at: "2026-07-16T19:26:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f1a756d3af3898f211c27c34e16bbcc08f71e214ca1e0d5680c15a091ae1c2ca
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw มาพร้อมแอปคู่หู **Windows Hub** แบบเนทีฟ และรองรับ CLI บน Windows
ใช้ Windows Hub สำหรับแอปเดสก์ท็อปที่มีการตั้งค่า สถานะในถาดระบบ แชต การวินิจฉัยของ Command
Center และความสามารถของ Node บน Windows ใช้ตัวติดตั้ง PowerShell
สำหรับ CLI/Gateway โดยตรง ใช้ WSL2 เพื่อให้ได้รันไทม์ Gateway
ที่เข้ากันได้กับ Linux มากที่สุด

## แนะนำ: Windows Hub

Windows Hub คือแอปคู่หู WinUI แบบเนทีฟสำหรับ Windows 10 20H2+ และ
Windows 11 ติดตั้งได้โดยไม่ต้องมีสิทธิ์ผู้ดูแลระบบ และมีตัวติดตั้ง x64
และ ARM64 ที่ลงนามแล้วจากหน้ารีลีสของแอปเอง

Windows Hub เผยแพร่แยกจาก OpenClaw CLI และ Gateway ดาวน์โหลด
ตัวติดตั้ง Hub รุ่นเสถียรล่าสุดจาก
[หน้ารีลีส Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases/latest)
หรือดาวน์โหลดโดยตรงผ่าน `releases/latest/download`:

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)

หากลิงก์ข้างต้นส่งคืนข้อผิดพลาด 404 ให้ไปที่ [หน้ารีลีส Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases)
และเปิดรีลีส Windows Hub รุ่นเสถียรล่าสุด รีลีสเสถียรตามปกติของ OpenClaw
ยังมิเรอร์บิลด์ Windows Hub ที่ตรึงเวอร์ชันและผ่านการตรวจสอบสำหรับรีลีสไว้ด้วย แต่มิเรอร์นั้นอาจตามหลัง
รีลีส Hub แบบแยกที่ใหม่กว่า

หลังติดตั้ง ให้เปิด **OpenClaw Companion** จากเมนู Start หรือถาดระบบ
ตัวติดตั้งยังเพิ่มทางลัดสำหรับ Gateway Setup, Chat, Settings,
Check for Updates และการถอนการติดตั้ง

### สิ่งที่ Windows Hub มีให้

- สถานะในถาดระบบและการเปิดเมื่อเข้าสู่ระบบ
- การตั้งค่าครั้งแรกสำหรับ WSL Gateway ภายในที่แอปเป็นเจ้าของ
- การตั้งค่าการเชื่อมต่อสำหรับ Gateway ภายใน เครื่องระยะไกล และผ่านอุโมงค์ SSH
- หน้าต่างแชตแบบเนทีฟพร้อมการเข้าถึง Control UI ในเบราว์เซอร์
- การวินิจฉัยของ Command Center สำหรับเซสชัน การใช้งาน ช่องทาง Node การจับคู่
  และคำสั่งซ่อมแซม
- โหมด Node บน Windows สำหรับแคนวาส หน้าจอ กล้อง
  การแจ้งเตือน สถานะอุปกรณ์ การพูด และ `system.run` ที่ควบคุมโดยเอเจนต์
- โหมดเซิร์ฟเวอร์ MCP ภายในสำหรับไคลเอนต์ MCP เช่น Claude Desktop, Claude Code
  และ Cursor

### การเปิดครั้งแรก

เมื่อเปิดครั้งแรก Windows Hub จะเปิดการตั้งค่าหากไม่มี
Gateway ที่บันทึกไว้และใช้งานได้ เส้นทางที่เร็วที่สุดคือ **Set up locally** ซึ่งจะจัดเตรียม
ดิสโทร WSL `OpenClawGateway` ที่แอปเป็นเจ้าของ ติดตั้ง Gateway ภายในดิสโทร และ
จับคู่แอป การดำเนินการนี้จะไม่ส่งออกหรือแก้ไขดิสโทร Ubuntu ที่มีอยู่ของคุณ

เลือก **Advanced setup** หรือเปิดแท็บ Connections เมื่อมี
Gateway อยู่แล้ว คุณสามารถเชื่อมต่อกับ:

- Gateway ภายในบนพีซีเครื่องนี้
- WSL Gateway บนพีซีเครื่องนี้
- Gateway ระยะไกลด้วย URL และโทเค็นหรือรหัสตั้งค่า
- Gateway ที่เข้าถึงผ่านอุโมงค์ SSH

เมื่อการตั้งค่าเสร็จสิ้น ไอคอนในถาดระบบจะเปลี่ยนเป็นสีเขียว เปิด **Command Center** จาก
ถาดระบบเพื่อยืนยันการเชื่อมต่อ การจับคู่ สถานะ Node และสถานภาพของช่องทาง

## โหมด Node บน Windows

Windows Hub สามารถลงทะเบียนเป็น Node ของ OpenClaw เพื่อให้เอเจนต์ใช้ความสามารถ
แบบเนทีฟของ Windows ที่ประกาศไว้ผ่าน Gateway ได้ คำสั่ง Node ต้อง
ได้รับการประกาศโดย Node และได้รับอนุญาตจากนโยบาย Gateway ก่อนจึงจะทำงานได้ โปรดดู
[Node](/th/nodes#command-policy) สำหรับโมเดลอนุญาต/ปฏิเสธฉบับเต็ม

คำสั่งทั่วไป:

| กลุ่ม | คำสั่ง                                                                             |
| ------ | ------------------------------------------------------------------------------------ |
| แคนวาส | `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot` |
| หน้าจอ | `screen.snapshot`; `screen.record` ต้องเลือกเข้าร่วมอย่างชัดแจ้ง                          |
| กล้อง | `camera.list`; `camera.snap`, `camera.clip` ต้องเลือกเข้าร่วมอย่างชัดแจ้ง                  |
| ระบบ | `system.notify`, `system.run`, `system.run.prepare`, `system.which`                  |
| อุปกรณ์ | `location.get`, `device.info`, `device.status`                                       |
| การพูด   | `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`, `talk.speak`  |

โหมด Node ต้องมีการจับคู่ Gateway หากแอปแสดงคำขอจับคู่
ให้อนุมัติจากโฮสต์ Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Gateway จะส่งต่อเฉพาะคำสั่งที่ Node ประกาศและนโยบายเซิร์ฟเวอร์
อนุญาตเท่านั้น คำสั่งที่เกี่ยวข้องกับความเป็นส่วนตัว เช่น `screen.record`, `camera.snap`
และ `camera.clip` ต้องเลือกเข้าร่วม `gateway.nodes.allowCommands` อย่างชัดแจ้ง

## โหมด MCP ภายใน

Windows Hub สามารถเปิดเผยรีจิสทรีความสามารถแบบเนทีฟของ Windows ชุดเดียวกันในฐานะ
เซิร์ฟเวอร์ MCP ภายในบนลูปแบ็ก เพื่อให้ไคลเอนต์ MCP ภายในควบคุมความสามารถของ Windows
ได้โดยไม่ต้องมี OpenClaw Gateway ที่กำลังทำงาน

เปิดใช้งานใน Settings ของ Windows Hub ภายใต้ส่วน developer/advanced
แอปจะแสดงปลายทางลูปแบ็กและ bearer token เมื่อเปิดใช้งานเซิร์ฟเวอร์แล้ว

ตารางโหมด:

| โหมด Node | เซิร์ฟเวอร์ MCP | ลักษณะการทำงาน                           |
| --------- | ---------- | ---------------------------------- |
| ปิด       | ปิด        | แอปเดสก์ท็อปสำหรับผู้ปฏิบัติงานเท่านั้น          |
| เปิด        | ปิด        | Node บน Windows ที่เชื่อมต่อกับ Gateway     |
| ปิด        | เปิด         | เซิร์ฟเวอร์ MCP ภายในเท่านั้น              |
| เปิด        | เปิด         | Node ของ Gateway พร้อมเซิร์ฟเวอร์ MCP ภายใน |

## CLI และ Gateway แบบเนทีฟบน Windows

สำหรับการใช้งานที่เน้นเทอร์มินัล ให้ติดตั้ง OpenClaw จาก PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

ตรวจสอบ:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

การเริ่มต้นระบบที่มีการจัดการจะใช้ Windows Scheduled Tasks เมื่อพร้อมใช้งาน Task จะเก็บ
สคริปต์ `gateway.cmd` ที่อ่านได้ไว้ในไดเรกทอรีสถานะของ OpenClaw แต่เปิดใช้งานสคริปต์
ผ่านตัวห่อหุ้ม WScript `gateway.vbs` ที่สร้างขึ้น เพื่อให้ Gateway เบื้องหลัง
ไม่เปิดหน้าต่างคอนโซลที่มองเห็นได้ หากระบบปฏิเสธการสร้าง Task OpenClaw
จะเปลี่ยนไปใช้รายการเข้าสู่ระบบในโฟลเดอร์ Startup สำหรับผู้ใช้แต่ละราย

ติดตั้งบริการ Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

สำหรับการใช้เฉพาะ CLI โดยไม่มีบริการ Gateway ที่มีการจัดการ:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 Gateway

WSL2 ยังคงเป็นรันไทม์ Gateway บน Windows ที่เข้ากันได้กับ Linux มากที่สุด Windows
Hub สามารถตั้งค่า WSL Gateway ที่แอปเป็นเจ้าของให้ หรือจะติดตั้งด้วยตนเองภายใน
ดิสโทรของคุณเองก็ได้

การตั้งค่าด้วยตนเอง:

```powershell
wsl --install
# หรือเลือกดิสโทรอย่างชัดเจน:
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

เริ่ม WSL ใหม่จาก PowerShell:

```powershell
wsl --shutdown
```

จากนั้นติดตั้ง OpenClaw ภายใน WSL ด้วยคู่มือเริ่มต้นอย่างรวดเร็วสำหรับ Linux:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## เริ่ม Gateway อัตโนมัติก่อนเข้าสู่ระบบ Windows

สำหรับการตั้งค่า WSL แบบไม่มีจอภาพ ตรวจสอบให้แน่ใจว่าลำดับการบูตทั้งหมดทำงานแม้ไม่มีใคร
เข้าสู่ระบบ Windows

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

แทนที่ `Ubuntu` ด้วยชื่อดิสโทรจาก:

```powershell
wsl --list --verbose
```

<Note>
มีการเปลี่ยนแปลงสองอย่างจากสูตรเดิม:

- **ใช้ `dbus-launch true` แทน `/bin/true`**: บน WSL >= 2.6.1.0 มี
  การถดถอย ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416))
  ที่ยุติดิสโทรเมื่อไม่มีการใช้งานภายใน 15-20 วินาทีหลังไคลเอนต์สุดท้ายออก แม้จะ
  เปิดใช้งาน linger แล้วก็ตาม `dbus-launch true` จะคงกระบวนการลูกของ init ไว้
  เป็นวิธีแก้ชั่วคราว (การสนทนาในชุมชน [microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245))
- **ใช้ `/ru "$env:USERNAME"` แทน `/ru SYSTEM`**: ดิสโทร WSL สำหรับผู้ใช้แต่ละราย (ซึ่งเป็น
  การตั้งค่าเริ่มต้น) จะไม่ปรากฏต่อบัญชี SYSTEM ดังนั้น Task จึงดูเหมือน
  ทำงานอยู่ แต่ดิสโทรไม่เคยเริ่ม การเรียกใช้ด้วยบัญชีของคุณเองจะหลีกเลี่ยง
  ปัญหานี้ โดย Windows จะขอรหัสผ่านเมื่อสร้าง Task

</Note>

หลังรีบูต ให้ตรวจสอบจาก WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## เปิดให้เข้าถึงบริการ WSL ผ่าน LAN

WSL มีเครือข่ายเสมือนของตัวเอง หากเครื่องอื่นจำเป็นต้องเข้าถึงบริการ
ภายใน WSL ให้ส่งต่อพอร์ต Windows ไปยัง IP ปัจจุบันของ WSL โดย IP ของ WSL อาจ
เปลี่ยนแปลงหลังรีสตาร์ต ดังนั้นให้รีเฟรชกฎการส่งต่อเมื่อจำเป็น

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

- การเชื่อมต่อ SSH จากเครื่องอื่นจะใช้ IP ของโฮสต์ Windows เป็นเป้าหมาย เช่น `ssh user@windows-host -p 2222`
- Node ระยะไกลต้องชี้ไปยัง URL ของ Gateway ที่เข้าถึงได้ ไม่ใช่ `127.0.0.1`
- ใช้ `listenaddress=0.0.0.0` สำหรับการเข้าถึงผ่าน LAN และ `127.0.0.1` สำหรับการเข้าถึงภายในเท่านั้น

## การแก้ไขปัญหา

### ไอคอนไม่ปรากฏในถาดระบบ

ตรวจสอบ `OpenClaw.Tray.WinUI.exe` ใน Task Manager หากกำลังทำงานอยู่ ให้เปิด
พื้นที่ไอคอนถาดระบบที่ซ่อนอยู่และปักหมุด หากไม่ทำงาน ให้เปิด **OpenClaw Companion** จาก
เมนู Start

### การตั้งค่าภายในล้มเหลว

เปิดบันทึกการตั้งค่าจาก Windows Hub หรือตรวจสอบ:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

สาเหตุทั่วไป ได้แก่ WSL ถูกปิดใช้งาน การจำลองเสมือนถูกบล็อก สถานะ WSL
ที่แอปเป็นเจ้าของล้าสมัย หรือเครือข่ายล้มเหลวขณะติดตั้งแพ็กเกจ Gateway

### แอประบุว่าต้องมีการจับคู่

อนุมัติคำขอของผู้ปฏิบัติงานหรือ Node จาก Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

หากอุปกรณ์มีโทเค็นอยู่แล้ว ให้เชื่อมต่อใหม่จากแท็บ Connections หลัง
อนุมัติ

### เว็บแชตเข้าถึง Gateway ระยะไกลไม่ได้

เว็บแชตระยะไกลต้องใช้ HTTPS หรือ localhost สำหรับใบรับรองที่ลงนามด้วยตนเอง ให้เชื่อถือ
ใบรับรองใน Windows หรือใช้อุโมงค์ SSH ไปยัง URL ของ localhost

### คำสั่ง `screen.snapshot`, กล้อง หรือเสียงล้มเหลว

ยืนยันสิทธิ์ของ Windows สำหรับกล้อง ไมโครโฟน การจับภาพหน้าจอ และ
การแจ้งเตือน การติดตั้งแบบแพ็กเกจจะประกาศความสามารถที่ได้รับการป้องกัน แต่
Windows อาจยังคงแจ้งให้ยืนยันในครั้งแรกที่คำสั่งใช้ความสามารถเหล่านั้น

### การเชื่อมต่อ Git หรือ GitHub ล้มเหลว

บางเครือข่ายบล็อกหรือจำกัดความเร็ว HTTPS ไปยัง GitHub หาก `git clone` หรือ
`gh auth login` ล้มเหลว ให้ลองใช้เครือข่ายอื่น VPN หรือพร็อกซี HTTP/HTTPS

สำหรับการยืนยันตัวตน `gh` แบบใช้โทเค็นในเซสชันปัจจุบัน:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

ห้ามคอมมิตโทเค็นหรือวางโทเค็นใน Issue หรือ Pull Request

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [การตั้งค่า Node.js](/th/install/node)
- [Node](/th/nodes)
- [Control UI](/th/web/control-ui)
- [การกำหนดค่า Gateway](/th/gateway/configuration)
