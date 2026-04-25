---
read_when:
    - การรันหรือแก้ไขปัญหาการตั้งค่า Gateway ระยะไกล
summary: การเข้าถึงระยะไกลโดยใช้ SSH tunnel (Gateway WS) และ tailnet
title: การเข้าถึงระยะไกล
x-i18n:
    generated_at: "2026-04-25T13:49:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91f53a1f6798f56b3752c96c01f6944c4b5e9ee649ae58975a2669a099203e40
    source_path: gateway/remote.md
    workflow: 15
---

repo นี้รองรับ “remote over SSH” โดยคงให้มี Gateway เพียงตัวเดียว (master) รันอยู่บนโฮสต์เฉพาะ (เดสก์ท็อป/เซิร์ฟเวอร์) แล้วให้ไคลเอนต์เชื่อมต่อเข้าหามัน

- สำหรับ **operators (คุณ / แอป macOS)**: การทำ SSH tunnel คือ fallback ที่ใช้ได้ทั่วไป
- สำหรับ **Nodes (iOS/Android และอุปกรณ์ในอนาคต)**: ให้เชื่อมต่อกับ Gateway **WebSocket** (ผ่าน LAN/tailnet หรือ SSH tunnel ตามความเหมาะสม)

## แนวคิดหลัก

- Gateway WebSocket จะ bind กับ **loopback** บนพอร์ตที่คุณกำหนดค่าไว้ (ค่าเริ่มต้นคือ 18789)
- สำหรับการใช้งานระยะไกล คุณจะ forward พอร์ต loopback นั้นผ่าน SSH (หรือใช้ tailnet/VPN เพื่อลดความจำเป็นในการทำ tunnel)

## การตั้งค่า VPN/tailnet ที่พบบ่อย (ตำแหน่งที่ Agent อยู่)

ให้มอง **โฮสต์ Gateway** ว่าเป็น “ที่ที่ Agent อยู่” มันเป็นเจ้าของเซสชัน auth profile ช่องทาง และสถานะทั้งหมด
แล็ปท็อป/เดสก์ท็อปของคุณ (รวมถึง Nodes) จะเชื่อมต่อเข้าหาโฮสต์นั้น

### 1) Gateway แบบ always-on ใน tailnet ของคุณ (VPS หรือโฮมเซิร์ฟเวอร์)

รัน Gateway บนโฮสต์ถาวรและเข้าถึงผ่าน **Tailscale** หรือ SSH

- **ประสบการณ์ใช้งานดีที่สุด:** คง `gateway.bind: "loopback"` ไว้และใช้ **Tailscale Serve** สำหรับ Control UI
- **Fallback:** คง loopback ไว้ + ใช้ SSH tunnel จากทุกเครื่องที่ต้องการเข้าถึง
- **ตัวอย่าง:** [exe.dev](/th/install/exe-dev) (VM แบบง่าย) หรือ [Hetzner](/th/install/hetzner) (VPS สำหรับ production)

เหมาะอย่างยิ่งเมื่อแล็ปท็อปของคุณพักเครื่องบ่อย แต่คุณต้องการให้ Agent ทำงานตลอดเวลา

### 2) เดสก์ท็อปที่บ้านรัน Gateway ส่วนแล็ปท็อปใช้ควบคุมระยะไกล

แล็ปท็อปจะ **ไม่** รัน Agent แต่จะเชื่อมต่อระยะไกลแทน:

- ใช้โหมด **Remote over SSH** ของแอป macOS (Settings → General → “OpenClaw runs”)
- แอปจะเปิดและจัดการ tunnel ให้ ดังนั้น WebChat + health checks จะ “ใช้งานได้ทันที”

คู่มือปฏิบัติการ: [macOS remote access](/th/platforms/mac/remote)

### 3) แล็ปท็อปรัน Gateway และให้เครื่องอื่นเข้าถึงจากระยะไกล

ให้ Gateway อยู่ในเครื่อง แต่เปิดให้เข้าถึงอย่างปลอดภัย:

- ทำ SSH tunnel ไปยังแล็ปท็อปจากเครื่องอื่น หรือ
- ใช้ Tailscale Serve กับ Control UI และคงให้ Gateway ใช้ loopback เท่านั้น

คู่มือ: [Tailscale](/th/gateway/tailscale) และ [Web overview](/th/web)

## ลำดับการทำงานของคำสั่ง (อะไรทำงานที่ไหน)

บริการ gateway หนึ่งตัวเป็นเจ้าของสถานะ + ช่องทาง ส่วน Nodes เป็นอุปกรณ์รอบข้าง

ตัวอย่างลำดับการทำงาน (Telegram → node):

- ข้อความ Telegram มาถึง **Gateway**
- Gateway รัน **agent** และตัดสินใจว่าจะเรียกเครื่องมือของ node หรือไม่
- Gateway เรียก **node** ผ่าน Gateway WebSocket (`node.*` RPC)
- Node ส่งผลลัพธ์กลับมา จากนั้น Gateway ตอบกลับออกไปยัง Telegram

หมายเหตุ:

- **Nodes ไม่ได้รันบริการ gateway** ควรมี gateway เพียงตัวเดียวต่อหนึ่งโฮสต์ เว้นแต่คุณตั้งใจจะรันโปรไฟล์แยกหลายตัว (ดู [Multiple gateways](/th/gateway/multiple-gateways))
- “node mode” ของแอป macOS เป็นเพียงไคลเอนต์ node ผ่าน Gateway WebSocket

## SSH tunnel (CLI + tools)

สร้าง local tunnel ไปยัง Gateway WS ระยะไกล:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

เมื่อ tunnel ทำงานแล้ว:

- `openclaw health` และ `openclaw status --deep` จะเข้าถึง gateway ระยะไกลผ่าน `ws://127.0.0.1:18789`
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` และ `openclaw gateway call` ก็สามารถกำหนดเป้าหมายไปยัง URL ที่ forward ไว้ผ่าน `--url` ได้เมื่อจำเป็น

หมายเหตุ: ให้แทน `18789` ด้วย `gateway.port` ที่คุณกำหนดไว้ (หรือ `--port`/`OPENCLAW_GATEWAY_PORT`)
หมายเหตุ: เมื่อคุณส่ง `--url` CLI จะไม่ fallback ไปใช้ข้อมูลรับรองจาก config หรือ environment
ให้ระบุ `--token` หรือ `--password` อย่างชัดเจน การไม่มีข้อมูลรับรองแบบชัดเจนจะถือเป็นข้อผิดพลาด

## ค่าเริ่มต้นระยะไกลของ CLI

คุณสามารถบันทึก remote target ไว้ เพื่อให้คำสั่ง CLI ใช้มันเป็นค่าเริ่มต้น:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

เมื่อ gateway ใช้ loopback เท่านั้น ให้คง URL เป็น `ws://127.0.0.1:18789` แล้วเปิด SSH tunnel ก่อน

## ลำดับความสำคัญของข้อมูลรับรอง

การ resolve ข้อมูลรับรองของ Gateway ใช้สัญญาร่วมชุดเดียวกันในเส้นทาง call/probe/status และการติดตาม exec-approval ของ Discord โฮสต์ Node ใช้สัญญาพื้นฐานเดียวกัน โดยมีข้อยกเว้นหนึ่งข้อใน local mode (ระบบจะตั้งใจไม่ใช้ `gateway.remote.*`):

- ข้อมูลรับรองแบบชัดเจน (`--token`, `--password` หรือ tool `gatewayToken`) มีลำดับความสำคัญสูงสุดเสมอในเส้นทางการเรียกที่รองรับการยืนยันตัวตนแบบชัดเจน
- ความปลอดภัยของการเขียนทับ URL:
  - การเขียนทับ URL ผ่าน CLI (`--url`) จะไม่ใช้ข้อมูลรับรองจาก config/env โดยปริยาย
  - การเขียนทับ URL ผ่าน env (`OPENCLAW_GATEWAY_URL`) อาจใช้ข้อมูลรับรองจาก env เท่านั้น (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)
- ค่าเริ่มต้นใน local mode:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (การ fallback ไป remote ใช้ได้เฉพาะเมื่ออินพุต token ของ local auth ยังไม่ได้ตั้งค่า)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (การ fallback ไป remote ใช้ได้เฉพาะเมื่ออินพุต password ของ local auth ยังไม่ได้ตั้งค่า)
- ค่าเริ่มต้นใน remote mode:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- ข้อยกเว้นของโฮสต์ Node ใน local mode: จะไม่ใช้ `gateway.remote.token` / `gateway.remote.password`
- การตรวจสอบ token ของ remote probe/status จะเข้มงวดเป็นค่าเริ่มต้น: จะใช้ `gateway.remote.token` เท่านั้น (ไม่มีการ fallback ไป local token) เมื่อกำหนดเป้าหมายเป็น remote mode
- การเขียนทับ env ของ Gateway ใช้เฉพาะ `OPENCLAW_GATEWAY_*`

## Chat UI ผ่าน SSH

ตอนนี้ WebChat ไม่ใช้พอร์ต HTTP แยกต่างหากอีกต่อไป UI แชต SwiftUI จะเชื่อมต่อกับ Gateway WebSocket โดยตรง

- forward พอร์ต `18789` ผ่าน SSH (ดูด้านบน) แล้วให้ไคลเอนต์เชื่อมต่อกับ `ws://127.0.0.1:18789`
- บน macOS แนะนำให้ใช้โหมด “Remote over SSH” ของแอป ซึ่งจัดการ tunnel ให้อัตโนมัติ

## "Remote over SSH" ของแอป macOS

แอปแถบเมนูบน macOS สามารถขับเคลื่อนการตั้งค่าเดียวกันนี้ได้แบบ end-to-end (การตรวจสอบสถานะระยะไกล WebChat และการ forward Voice Wake)

คู่มือปฏิบัติการ: [macOS remote access](/th/platforms/mac/remote)

## กฎความปลอดภัย (remote/VPN)

สรุปสั้น ๆ: **คงให้ Gateway ใช้ loopback เท่านั้น** เว้นแต่คุณมั่นใจว่าจำเป็นต้อง bind

- **Loopback + SSH/Tailscale Serve** คือค่าเริ่มต้นที่ปลอดภัยที่สุด (ไม่เปิดเผยสู่สาธารณะ)
- โดยค่าเริ่มต้น `ws://` แบบ plaintext ใช้ได้เฉพาะ loopback เท่านั้น สำหรับเครือข่ายส่วนตัวที่เชื่อถือได้
  ให้ตั้ง `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ในโปรเซสของไคลเอนต์เป็น
  break-glass ไม่มีค่าเทียบเท่าใน `openclaw.json`; ต้องตั้งเป็น process
  environment สำหรับไคลเอนต์ที่กำลังเชื่อมต่อ WebSocket
- **การ bind แบบ non-loopback** (`lan`/`tailnet`/`custom` หรือ `auto` เมื่อ loopback ใช้ไม่ได้) ต้องใช้ gateway auth: token, password หรือ reverse proxy ที่รับรู้ identity พร้อม `gateway.auth.mode: "trusted-proxy"`
- `gateway.remote.token` / `.password` เป็นแหล่งข้อมูลรับรองของไคลเอนต์ มัน **ไม่ได้** กำหนดค่า server auth ด้วยตัวเอง
- เส้นทางการเรียกใน local อาจใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อ `gateway.auth.*` ยังไม่ถูกตั้งค่า
- หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดไว้อย่างชัดเจนผ่าน SecretRef และยัง resolve ไม่ได้ การ resolve จะ fail closed (ไม่มี remote fallback มาบดบัง)
- `gateway.remote.tlsFingerprint` ใช้ pin ใบรับรอง TLS ระยะไกลเมื่อใช้ `wss://`
- **Tailscale Serve** สามารถยืนยันตัวตนทราฟฟิกของ Control UI/WebSocket ผ่าน identity
  headers ได้เมื่อ `gateway.auth.allowTailscale: true`; ปลายทาง HTTP API จะไม่ใช้
  การยืนยันตัวตนผ่าน Tailscale header แบบนั้น แต่จะทำตามโหมด HTTP auth ปกติของ gateway แทน
  flow แบบไม่ใช้ token นี้ถือว่าโฮสต์ gateway เชื่อถือได้ ตั้งค่านี้เป็น
  `false` หากคุณต้องการ shared-secret auth ทุกที่
- auth แบบ **trusted-proxy** มีไว้สำหรับการตั้งค่าที่ใช้ proxy รับรู้ identity แบบ non-loopback เท่านั้น
  reverse proxy แบบ loopback บนโฮสต์เดียวกันไม่ตรงตามเงื่อนไขของ `gateway.auth.mode: "trusted-proxy"`
- ให้ถือว่าการควบคุมเบราว์เซอร์คือการเข้าถึงระดับ operator: ใช้ tailnet เท่านั้น + จับคู่ Node อย่างตั้งใจ

เจาะลึก: [Security](/th/gateway/security)

### macOS: SSH tunnel แบบถาวรผ่าน LaunchAgent

สำหรับไคลเอนต์ macOS ที่เชื่อมต่อกับ gateway ระยะไกล วิธีที่ง่ายที่สุดสำหรับการตั้งค่าแบบถาวรคือใช้รายการ `LocalForward` ใน SSH config ร่วมกับ LaunchAgent เพื่อให้ tunnel ทำงานต่อเนื่องข้ามการรีบูตและการล่ม

#### ขั้นที่ 1: เพิ่ม SSH config

แก้ไข `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

แทน `<REMOTE_IP>` และ `<REMOTE_USER>` ด้วยค่าของคุณ

#### ขั้นที่ 2: คัดลอก SSH key (ครั้งเดียว)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### ขั้นที่ 3: กำหนดค่า gateway token

เก็บ token ไว้ในการกำหนดค่าเพื่อให้คงอยู่ข้ามการรีสตาร์ต:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### ขั้นที่ 4: สร้าง LaunchAgent

บันทึกไฟล์นี้เป็น `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### ขั้นที่ 5: โหลด LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

tunnel จะเริ่มอัตโนมัติเมื่อเข้าสู่ระบบ เริ่มใหม่เมื่อเกิดการล่ม และคงพอร์ตที่ forward ไว้ให้ใช้งานได้ต่อเนื่อง

หมายเหตุ: หากคุณยังมี LaunchAgent `com.openclaw.ssh-tunnel` ค้างอยู่จากการตั้งค่าแบบเก่า ให้ unload และลบมันออก

#### การแก้ไขปัญหา

ตรวจสอบว่า tunnel กำลังทำงานอยู่หรือไม่:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

รีสตาร์ต tunnel:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

หยุด tunnel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| รายการ config                         | สิ่งที่มันทำ                                                  |
| ------------------------------------ | ------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | forward พอร์ต local 18789 ไปยังพอร์ต remote 18789             |
| `ssh -N`                             | SSH โดยไม่รันคำสั่งบนเครื่อง remote (ใช้สำหรับ port-forwarding เท่านั้น) |
| `KeepAlive`                          | รีสตาร์ต tunnel อัตโนมัติหากมันล่ม                           |
| `RunAtLoad`                          | เริ่ม tunnel เมื่อ LaunchAgent ถูกโหลดตอนเข้าสู่ระบบ         |

## ที่เกี่ยวข้อง

- [Tailscale](/th/gateway/tailscale)
- [Authentication](/th/gateway/authentication)
- [Remote gateway setup](/th/gateway/remote-gateway-readme)
