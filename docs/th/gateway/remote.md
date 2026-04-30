---
read_when:
    - การเรียกใช้หรือแก้ไขปัญหาการตั้งค่า Gateway ระยะไกล
summary: การเข้าถึงระยะไกลโดยใช้ทันเนล SSH (Gateway WS) และเทลเน็ต
title: การเข้าถึงระยะไกล
x-i18n:
    generated_at: "2026-04-30T09:55:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 116ffba71801d3363eba293997ee4a5c8ad083a82298e57e68f678510263650a
    source_path: gateway/remote.md
    workflow: 16
---

รีโปนี้รองรับ “ระยะไกลผ่าน SSH” โดยให้ Gateway เดียว (มาสเตอร์) ทำงานบนโฮสต์เฉพาะ (เดสก์ท็อป/เซิร์ฟเวอร์) และเชื่อมต่อไคลเอนต์ไปยัง Gateway นั้น

- สำหรับ **ผู้ปฏิบัติการ (คุณ / แอป macOS)**: SSH tunneling คือทางเลือกสำรองสากล
- สำหรับ **Node (iOS/Android และอุปกรณ์ในอนาคต)**: เชื่อมต่อกับ Gateway **WebSocket** (LAN/tailnet หรือ SSH tunnel ตามต้องการ)

## แนวคิดหลัก

- Gateway WebSocket bind กับ **loopback** บนพอร์ตที่คุณกำหนดค่าไว้ (ค่าเริ่มต้นคือ 18789)
- สำหรับการใช้งานระยะไกล ให้ forward พอร์ต loopback นั้นผ่าน SSH (หรือใช้ tailnet/VPN และใช้อุโมงค์ให้น้อยลง)

## การตั้งค่า VPN และ tailnet ที่พบบ่อย

ให้คิดว่า **โฮสต์ Gateway** คือที่ที่ agent อยู่ โฮสต์นี้ถือครองเซสชัน โปรไฟล์ auth ช่องทาง และสถานะ แล็ปท็อป เดสก์ท็อป และ Node ของคุณเชื่อมต่อไปยังโฮสต์นั้น

### Gateway ที่เปิดตลอดใน tailnet ของคุณ

รัน Gateway บนโฮสต์ถาวร (VPS หรือเซิร์ฟเวอร์ที่บ้าน) และเข้าถึงผ่าน **Tailscale** หรือ SSH

- **UX ที่ดีที่สุด:** คง `gateway.bind: "loopback"` ไว้ และใช้ **Tailscale Serve** สำหรับ Control UI
- **ทางเลือกสำรอง:** คง loopback ไว้ พร้อม SSH tunnel จากเครื่องใดก็ตามที่ต้องการเข้าถึง
- **ตัวอย่าง:** [exe.dev](/th/install/exe-dev) (VM ที่ใช้ง่าย) หรือ [Hetzner](/th/install/hetzner) (VPS สำหรับ production)

เหมาะเมื่อแล็ปท็อปของคุณพักเครื่องบ่อย แต่คุณต้องการให้ agent เปิดตลอดเวลา

### เดสก์ท็อปที่บ้านรัน Gateway

แล็ปท็อป **ไม่ได้** รัน agent แต่เชื่อมต่อจากระยะไกล:

- ใช้โหมด **Remote over SSH** ของแอป macOS (Settings → General → OpenClaw runs)
- แอปจะเปิดและจัดการอุโมงค์ให้ ดังนั้น WebChat และ health check จะใช้งานได้ทันที

Runbook: [การเข้าถึงระยะไกลบน macOS](/th/platforms/mac/remote)

### แล็ปท็อปรัน Gateway

คง Gateway ไว้ในเครื่อง แต่เปิดให้เข้าถึงอย่างปลอดภัย:

- SSH tunnel ไปยังแล็ปท็อปจากเครื่องอื่น หรือ
- ใช้ Tailscale Serve กับ Control UI และคง Gateway ให้เป็น loopback-only

คู่มือ: [Tailscale](/th/gateway/tailscale) และ [ภาพรวมเว็บ](/th/web)

## ลำดับคำสั่ง (อะไรทำงานที่ไหน)

บริการ Gateway หนึ่งตัวถือครองสถานะ + ช่องทาง Node เป็นอุปกรณ์ต่อพ่วง

ตัวอย่างลำดับงาน (Telegram → node):

- ข้อความ Telegram เข้ามาที่ **Gateway**
- Gateway รัน **agent** และตัดสินใจว่าจะเรียกเครื่องมือของ Node หรือไม่
- Gateway เรียก **Node** ผ่าน Gateway WebSocket (`node.*` RPC)
- Node ส่งผลลัพธ์กลับมา; Gateway ตอบกลับออกไปยัง Telegram

หมายเหตุ:

- **Node ไม่ได้รันบริการ gateway** ควรมี gateway เพียงตัวเดียวต่อโฮสต์ เว้นแต่คุณตั้งใจรันโปรไฟล์ที่แยกจากกัน (ดู [หลาย gateway](/th/gateway/multiple-gateways))
- “node mode” ของแอป macOS เป็นเพียงไคลเอนต์ Node ผ่าน Gateway WebSocket

## SSH tunnel (CLI + เครื่องมือ)

สร้างอุโมงค์ในเครื่องไปยัง Gateway WS ระยะไกล:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

เมื่ออุโมงค์พร้อมใช้งาน:

- `openclaw health` และ `openclaw status --deep` จะเข้าถึง gateway ระยะไกลผ่าน `ws://127.0.0.1:18789`
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` และ `openclaw gateway call` สามารถชี้ไปยัง URL ที่ forward ไว้ผ่าน `--url` ได้เช่นกันเมื่อจำเป็น

<Note>
แทนที่ `18789` ด้วย `gateway.port` ที่คุณกำหนดค่าไว้ (หรือ `--port` หรือ `OPENCLAW_GATEWAY_PORT`)
</Note>

<Warning>
เมื่อคุณส่ง `--url` CLI จะไม่ fallback ไปใช้ข้อมูลรับรองจาก config หรือ environment โปรดใส่ `--token` หรือ `--password` อย่างชัดเจน การไม่มีข้อมูลรับรองแบบชัดเจนถือเป็นข้อผิดพลาด
</Warning>

## ค่าเริ่มต้นระยะไกลของ CLI

คุณสามารถบันทึกเป้าหมายระยะไกลไว้ถาวร เพื่อให้คำสั่ง CLI ใช้งานเป็นค่าเริ่มต้น:

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

เมื่อ gateway เป็น loopback-only ให้คง URL เป็น `ws://127.0.0.1:18789` และเปิด SSH tunnel ก่อน
ใน transport แบบ SSH tunnel ของแอป macOS ชื่อโฮสต์ gateway ที่ค้นพบควรอยู่ใน
`gateway.remote.sshTarget`; `gateway.remote.url` ยังคงเป็น URL ของอุโมงค์ในเครื่อง

## ลำดับความสำคัญของข้อมูลรับรอง

การ resolve ข้อมูลรับรองของ Gateway ใช้สัญญาร่วมเดียวกันใน path call/probe/status และการตรวจสอบ exec-approval ของ Discord Node-host ใช้สัญญาพื้นฐานเดียวกันโดยมีข้อยกเว้น local-mode หนึ่งอย่าง (ตั้งใจให้ไม่สนใจ `gateway.remote.*`):

- ข้อมูลรับรองแบบชัดเจน (`--token`, `--password` หรือ `gatewayToken` ของเครื่องมือ) จะชนะเสมอใน call path ที่รับ auth แบบชัดเจน
- ความปลอดภัยของการ override URL:
  - การ override URL ของ CLI (`--url`) จะไม่ใช้ข้อมูลรับรอง config/env แบบ implicit ซ้ำ
  - การ override URL ของ env (`OPENCLAW_GATEWAY_URL`) อาจใช้เฉพาะข้อมูลรับรองจาก env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)
- ค่าเริ่มต้นของ local mode:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (remote fallback ใช้เฉพาะเมื่อไม่มีการตั้งค่า input ของ local auth token)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (remote fallback ใช้เฉพาะเมื่อไม่มีการตั้งค่า input ของ local auth password)
- ค่าเริ่มต้นของ remote mode:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- ข้อยกเว้น local-mode ของ node-host: `gateway.remote.token` / `gateway.remote.password` จะถูกละเว้น
- การตรวจ token ของ remote probe/status จะเข้มงวดโดยค่าเริ่มต้น: ใช้เฉพาะ `gateway.remote.token` (ไม่มี local token fallback) เมื่อกำหนดเป้าหมายเป็น remote mode
- การ override env ของ Gateway ใช้เฉพาะ `OPENCLAW_GATEWAY_*`

## Chat UI ผ่าน SSH

WebChat ไม่ใช้พอร์ต HTTP แยกอีกต่อไป SwiftUI chat UI เชื่อมต่อโดยตรงกับ Gateway WebSocket

- Forward `18789` ผ่าน SSH (ดูด้านบน) จากนั้นเชื่อมต่อไคลเอนต์ไปยัง `ws://127.0.0.1:18789`
- บน macOS แนะนำให้ใช้โหมด “Remote over SSH” ของแอป ซึ่งจัดการอุโมงค์ให้อัตโนมัติ

## Remote over SSH ของแอป macOS

แอปแถบเมนูของ macOS สามารถขับเคลื่อนการตั้งค่าเดียวกันได้ครบวงจร (การตรวจสถานะระยะไกล, WebChat และการ forward Voice Wake)

Runbook: [การเข้าถึงระยะไกลบน macOS](/th/platforms/mac/remote)

## กฎความปลอดภัย (remote/VPN)

ฉบับสั้น: **คง Gateway ให้เป็น loopback-only** เว้นแต่คุณแน่ใจว่าต้องการ bind

- **Loopback + SSH/Tailscale Serve** คือค่าเริ่มต้นที่ปลอดภัยที่สุด (ไม่มีการเปิดเผยสาธารณะ)
- `ws://` แบบ plaintext เป็น loopback-only โดยค่าเริ่มต้น สำหรับเครือข่ายส่วนตัวที่เชื่อถือได้
  ให้ตั้ง `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` บนโปรเซสไคลเอนต์เป็น
  ทางเลือกฉุกเฉิน ไม่มีค่าเทียบเท่าใน `openclaw.json`; ค่านี้ต้องเป็น process
  environment สำหรับไคลเอนต์ที่สร้างการเชื่อมต่อ WebSocket
- **Non-loopback binds** (`lan`/`tailnet`/`custom` หรือ `auto` เมื่อ loopback ใช้งานไม่ได้) ต้องใช้ gateway auth: token, password หรือ reverse proxy ที่รู้จัก identity พร้อม `gateway.auth.mode: "trusted-proxy"`
- `gateway.remote.token` / `.password` เป็นแหล่งข้อมูลรับรองของไคลเอนต์ ค่าเหล่านี้ **ไม่ได้** กำหนดค่า server auth ด้วยตัวเอง
- Local call path สามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
- หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าอย่างชัดเจนผ่าน SecretRef และ resolve ไม่ได้ การ resolve จะ fail closed (ไม่มี remote fallback มาบัง)
- `gateway.remote.tlsFingerprint` pin ใบรับรอง TLS ระยะไกลเมื่อใช้ `wss://`
- **Tailscale Serve** สามารถยืนยันตัวตนทราฟฟิก Control UI/WebSocket ผ่าน identity
  headers เมื่อ `gateway.auth.allowTailscale: true`; endpoint ของ HTTP API จะไม่
  ใช้ auth ผ่าน header ของ Tailscale นั้น และจะทำตามโหมด HTTP auth ปกติ
  ของ gateway แทน flow แบบไม่ใช้ token นี้ถือว่าโฮสต์ gateway เชื่อถือได้ ตั้งค่าเป็น
  `false` หากคุณต้องการ shared-secret auth ทุกที่
- auth แบบ **Trusted-proxy** คาดหวังการตั้งค่า proxy ที่รู้จัก identity แบบ non-loopback โดยค่าเริ่มต้น
  reverse proxy แบบ loopback บนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน
- ปฏิบัติต่อการควบคุมผ่านเบราว์เซอร์เหมือนการเข้าถึงของผู้ปฏิบัติการ: tailnet-only + การจับคู่ Node อย่างตั้งใจ

เจาะลึก: [ความปลอดภัย](/th/gateway/security)

### macOS: SSH tunnel แบบถาวรผ่าน LaunchAgent

สำหรับไคลเอนต์ macOS ที่เชื่อมต่อกับ gateway ระยะไกล การตั้งค่าแบบถาวรที่ง่ายที่สุดคือใช้รายการ config `LocalForward` ของ SSH พร้อม LaunchAgent เพื่อให้อุโมงค์มีชีวิตอยู่ต่อหลังรีบูตและหลัง crash

#### ขั้นตอนที่ 1: เพิ่ม SSH config

แก้ไข `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

แทนที่ `<REMOTE_IP>` และ `<REMOTE_USER>` ด้วยค่าของคุณ

#### ขั้นตอนที่ 2: คัดลอก SSH key (ครั้งเดียว)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### ขั้นตอนที่ 3: กำหนดค่า gateway token

เก็บ token ไว้ใน config เพื่อให้คงอยู่หลัง restart:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### ขั้นตอนที่ 4: สร้าง LaunchAgent

บันทึกสิ่งนี้เป็น `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

#### ขั้นตอนที่ 5: โหลด LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

อุโมงค์จะเริ่มโดยอัตโนมัติเมื่อเข้าสู่ระบบ restart เมื่อ crash และคงพอร์ตที่ forward ไว้ให้พร้อมใช้งาน

<Note>
หากคุณมี LaunchAgent `com.openclaw.ssh-tunnel` ที่เหลือจากการตั้งค่าเก่า ให้ unload และลบออก
</Note>

#### การแก้ไขปัญหา

ตรวจสอบว่าอุโมงค์กำลังทำงานอยู่หรือไม่:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Restart อุโมงค์:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

หยุดอุโมงค์:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| รายการ config                         | สิ่งที่ทำ                                                   |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Forward พอร์ต local 18789 ไปยังพอร์ต remote 18789           |
| `ssh -N`                             | SSH โดยไม่ execute คำสั่ง remote (เฉพาะ port-forwarding) |
| `KeepAlive`                          | Restart อุโมงค์โดยอัตโนมัติหาก crash                       |
| `RunAtLoad`                          | เริ่มอุโมงค์เมื่อ LaunchAgent โหลดตอน login                 |

## ที่เกี่ยวข้อง

- [Tailscale](/th/gateway/tailscale)
- [การยืนยันตัวตน](/th/gateway/authentication)
- [การตั้งค่า gateway ระยะไกล](/th/gateway/remote-gateway-readme)
