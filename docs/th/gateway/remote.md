---
read_when:
    - การรันหรือการแก้ไขปัญหาการตั้งค่า gateway ระยะไกล
summary: การเข้าถึงระยะไกลโดยใช้ SSH tunnels (Gateway WS) และ tailnets
title: การเข้าถึงระยะไกล
x-i18n:
    generated_at: "2026-04-26T11:31:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 208f0e6a4dbb342df878ea99d70606327efdfd3df36b07dfa3e68aafcae98e5c
    source_path: gateway/remote.md
    workflow: 15
---

repo นี้รองรับ “remote over SSH” โดยให้มี Gateway เดียว (ตัวหลัก) ทำงานอยู่บนโฮสต์เฉพาะ (เดสก์ท็อป/เซิร์ฟเวอร์) แล้วให้ไคลเอนต์เชื่อมต่อเข้ามา

- สำหรับ **operators (คุณ / แอป macOS)**: การทำ SSH tunnel คือทางเลือกสำรองที่ใช้ได้ครอบจักรวาล
- สำหรับ **nodes (iOS/Android และอุปกรณ์อื่นในอนาคต)**: เชื่อมต่อไปยัง Gateway **WebSocket** (ผ่าน LAN/tailnet หรือ SSH tunnel ตามความเหมาะสม)

## แนวคิดหลัก

- Gateway WebSocket จะ bind กับ **loopback** บนพอร์ตที่กำหนดไว้ (ค่าเริ่มต้นคือ 18789)
- สำหรับการใช้งานระยะไกล คุณจะส่งต่อพอร์ต loopback นั้นผ่าน SSH (หรือใช้ tailnet/VPN เพื่อลดการพึ่ง tunnel)

## การตั้งค่า VPN/tailnet ที่พบบ่อย (ที่ที่เอเจนต์อยู่)

ให้คิดว่า **โฮสต์ Gateway** คือ “ที่ที่เอเจนต์อยู่” มันเป็นเจ้าของ sessions, auth profiles, channels และ state
แล็ปท็อป/เดสก์ท็อปของคุณ (รวมถึง nodes) จะเชื่อมต่อเข้าหาโฮสต์นั้น

### 1) Gateway แบบ always-on ใน tailnet ของคุณ (VPS หรือโฮมเซิร์ฟเวอร์)

รัน Gateway บนโฮสต์ที่เปิดตลอดเวลา แล้วเข้าถึงผ่าน **Tailscale** หรือ SSH

- **UX ที่ดีที่สุด:** ใช้ `gateway.bind: "loopback"` ต่อไป และใช้ **Tailscale Serve** สำหรับ Control UI
- **ทางเลือกสำรอง:** คง loopback ไว้ + ทำ SSH tunnel จากเครื่องใดก็ตามที่ต้องการเข้าถึง
- **ตัวอย่าง:** [exe.dev](/th/install/exe-dev) (VM แบบง่าย) หรือ [Hetzner](/th/install/hetzner) (VPS ระดับ production)

เหมาะอย่างยิ่งเมื่อแล็ปท็อปของคุณพักเครื่องบ่อย แต่คุณต้องการให้เอเจนต์ทำงานตลอดเวลา

### 2) เดสก์ท็อปที่บ้านรัน Gateway, แล็ปท็อปเป็นรีโมตคอนโทรล

แล็ปท็อป **ไม่ได้** รันเอเจนต์ แต่จะเชื่อมต่อระยะไกล:

- ใช้โหมด **Remote over SSH** ของแอป macOS (Settings → General → “OpenClaw runs”)
- แอปจะเปิดและจัดการ tunnel ให้เอง ดังนั้น WebChat + health checks จะ “ใช้งานได้ทันที”

คู่มือปฏิบัติการ: [macOS remote access](/th/platforms/mac/remote)

### 3) แล็ปท็อปรัน Gateway, ต้องการเข้าถึงจากเครื่องอื่น

คง Gateway ไว้ในเครื่องแต่เปิดให้เข้าถึงอย่างปลอดภัย:

- ทำ SSH tunnel ไปยังแล็ปท็อปจากเครื่องอื่น หรือ
- ใช้ Tailscale Serve กับ Control UI และคง Gateway ให้เป็น loopback-only

คู่มือ: [Tailscale](/th/gateway/tailscale) และ [ภาพรวมเว็บ](/th/web)

## ลำดับคำสั่ง (อะไรทำงานที่ไหน)

มี gateway service เดียวที่เป็นเจ้าของ state + channels ส่วน Nodes เป็นอุปกรณ์ต่อพ่วง

ตัวอย่างโฟลว์ (Telegram → node):

- ข้อความ Telegram มาถึงที่ **Gateway**
- Gateway รัน **agent** และตัดสินใจว่าจะเรียกใช้เครื่องมือของ node หรือไม่
- Gateway เรียก **node** ผ่าน Gateway WebSocket (`node.*` RPC)
- Node ส่งผลลัพธ์กลับมา; Gateway ตอบกลับออกไปยัง Telegram

หมายเหตุ:

- **Nodes ไม่ได้รัน gateway service** ควรรัน gateway เพียงหนึ่งตัวต่อหนึ่งโฮสต์ เว้นแต่คุณตั้งใจรัน profiles ที่แยกออกจากกัน (ดู [Multiple gateways](/th/gateway/multiple-gateways))
- “node mode” ในแอป macOS เป็นเพียงไคลเอนต์ node ผ่าน Gateway WebSocket

## SSH tunnel (CLI + เครื่องมือ)

สร้าง local tunnel ไปยัง Gateway WS ระยะไกล:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

เมื่อ tunnel ทำงานแล้ว:

- `openclaw health` และ `openclaw status --deep` จะเข้าถึง gateway ระยะไกลผ่าน `ws://127.0.0.1:18789`
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` และ `openclaw gateway call` ก็สามารถกำหนดเป้าหมายไปยัง URL ที่ส่งต่อแล้วผ่าน `--url` ได้เมื่อจำเป็น

หมายเหตุ: แทนที่ `18789` ด้วย `gateway.port` ที่คุณตั้งค่าไว้ (หรือ `--port`/`OPENCLAW_GATEWAY_PORT`)
หมายเหตุ: เมื่อคุณส่ง `--url` CLI จะไม่ fallback ไปใช้ข้อมูลรับรองจาก config หรือ environment
ให้ใส่ `--token` หรือ `--password` อย่างชัดเจน การไม่มีข้อมูลรับรองแบบชัดเจนถือเป็นข้อผิดพลาด

## ค่าเริ่มต้นระยะไกลของ CLI

คุณสามารถบันทึกเป้าหมายระยะไกลไว้เพื่อให้คำสั่ง CLI ใช้มันเป็นค่าเริ่มต้น:

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

เมื่อ gateway เป็น loopback-only ให้คง URL เป็น `ws://127.0.0.1:18789` แล้วเปิด SSH tunnel ก่อน
ใน transport แบบ SSH tunnel ของแอป macOS ชื่อโฮสต์ gateway ที่ค้นพบได้ควรอยู่ใน
`gateway.remote.sshTarget`; ส่วน `gateway.remote.url` ยังคงเป็น URL ของ local tunnel

## ลำดับความสำคัญของข้อมูลรับรอง

การ resolve ข้อมูลรับรองของ Gateway ใช้สัญญาร่วมหนึ่งชุดในเส้นทาง call/probe/status และการเฝ้าดูการอนุมัติ exec ของ Discord Node-host ใช้สัญญาพื้นฐานเดียวกันโดยมีข้อยกเว้นหนึ่งข้อสำหรับ local-mode (จะเพิกเฉย `gateway.remote.*` โดยตั้งใจ):

- ข้อมูลรับรองแบบชัดเจน (`--token`, `--password` หรือ tool `gatewayToken`) มีลำดับสูงสุดเสมอในเส้นทาง call ที่รองรับ auth แบบชัดเจน
- ความปลอดภัยของการ override URL:
  - การ override URL ของ CLI (`--url`) จะไม่ใช้ข้อมูลรับรองจาก config/env แบบอัตโนมัติ
  - การ override URL จาก env (`OPENCLAW_GATEWAY_URL`) อาจใช้ข้อมูลรับรองจาก env เท่านั้น (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)
- ค่าเริ่มต้นของ local mode:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (fallback ไปยัง remote ใช้ได้เฉพาะเมื่อไม่มีอินพุต local auth token)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (fallback ไปยัง remote ใช้ได้เฉพาะเมื่อไม่มีอินพุต local auth password)
- ค่าเริ่มต้นของ remote mode:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- ข้อยกเว้นของ Node-host local-mode: จะเพิกเฉย `gateway.remote.token` / `gateway.remote.password`
- การตรวจสอบ token ของ remote probe/status เข้มงวดเป็นค่าเริ่มต้น: จะใช้ `gateway.remote.token` เท่านั้น (ไม่มี local token fallback) เมื่อกำหนดเป้าหมายเป็น remote mode
- การ override env ของ Gateway ใช้เฉพาะ `OPENCLAW_GATEWAY_*`

## Chat UI ผ่าน SSH

WebChat ไม่ได้ใช้พอร์ต HTTP แยกต่างหากอีกต่อไป SwiftUI chat UI จะเชื่อมต่อกับ Gateway WebSocket โดยตรง

- ส่งต่อ `18789` ผ่าน SSH (ดูด้านบน) แล้วเชื่อมต่อไคลเอนต์ไปยัง `ws://127.0.0.1:18789`
- บน macOS ให้ใช้โหมด “Remote over SSH” ของแอปเป็นหลัก ซึ่งจะจัดการ tunnel ให้อัตโนมัติ

## “Remote over SSH” ในแอป macOS

แอปเมนูบาร์ของ macOS สามารถขับเคลื่อนการตั้งค่าเดียวกันนี้แบบครบวงจรได้ (การตรวจสอบสถานะระยะไกล, WebChat และการส่งต่อ Voice Wake)

คู่มือปฏิบัติการ: [macOS remote access](/th/platforms/mac/remote)

## กฎความปลอดภัย (remote/VPN)

สรุปสั้น ๆ: **ให้ Gateway เป็น loopback-only** เว้นแต่คุณแน่ใจจริง ๆ ว่าต้อง bind ออกภายนอก

- **Loopback + SSH/Tailscale Serve** คือค่าเริ่มต้นที่ปลอดภัยที่สุด (ไม่มีการเปิดเผยสู่สาธารณะ)
- `ws://` แบบ plaintext ใช้ได้เฉพาะ loopback เป็นค่าเริ่มต้น สำหรับ private networks ที่เชื่อถือได้
  ให้ตั้ง `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ในโปรเซสไคลเอนต์เป็น
  break-glass ไม่มีค่าเทียบเท่าใน `openclaw.json`; ต้องตั้งใน process
  environment ของไคลเอนต์ที่ทำการเชื่อมต่อ WebSocket เท่านั้น
- **การ bind แบบ non-loopback** (`lan`/`tailnet`/`custom` หรือ `auto` เมื่อ loopback ใช้ไม่ได้) ต้องใช้ gateway auth: token, password หรือ reverse proxy ที่รู้จักตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"`
- `gateway.remote.token` / `.password` เป็นแหล่งข้อมูลรับรองฝั่งไคลเอนต์ มัน **ไม่ได้** กำหนดค่า auth ของเซิร์ฟเวอร์ด้วยตัวเอง
- เส้นทาง call แบบ local สามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้ง `gateway.auth.*`
- หากมีการกำหนด `gateway.auth.token` / `gateway.auth.password` แบบชัดเจนผ่าน SecretRef แล้ว resolve ไม่ได้ การ resolve จะ fail closed (จะไม่มี remote fallback มาช่วยปกปิด)
- `gateway.remote.tlsFingerprint` ใช้ pin ใบรับรอง TLS ระยะไกลเมื่อใช้ `wss://`
- **Tailscale Serve** สามารถยืนยันตัวตนทราฟฟิก Control UI/WebSocket ผ่าน identity
  headers ได้เมื่อ `gateway.auth.allowTailscale: true`; ส่วน endpoints HTTP API จะไม่
  ใช้ Tailscale header auth นี้ และจะเป็นไปตามโหมด HTTP auth ปกติของ gateway แทน
  โฟลว์แบบไม่ใช้ token นี้ถือว่าโฮสต์ gateway เป็นที่เชื่อถือได้ ตั้งค่าเป็น
  `false` หากคุณต้องการ shared-secret auth ทุกที่
- auth แบบ **trusted-proxy** ใช้สำหรับการตั้งค่า identity-aware proxy แบบ non-loopback เท่านั้น
  reverse proxies แบบ loopback บนโฮสต์เดียวกันไม่ผ่านเงื่อนไข `gateway.auth.mode: "trusted-proxy"`
- ให้มอง browser control ว่าเทียบเท่าการเข้าถึงของ operator: tailnet-only + การจับคู่ Node อย่างตั้งใจ

เจาะลึก: [Security](/th/gateway/security)

### macOS: SSH tunnel แบบถาวรผ่าน LaunchAgent

สำหรับไคลเอนต์ macOS ที่เชื่อมต่อกับ gateway ระยะไกล วิธีที่ง่ายที่สุดในการตั้งค่าแบบถาวรคือใช้รายการ `LocalForward` ใน config ของ SSH ร่วมกับ LaunchAgent เพื่อให้ tunnel ทำงานต่อเนื่องข้ามการรีบูตและการ crash

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

เก็บ token ไว้ใน config เพื่อให้คงอยู่ข้ามการรีสตาร์ต:

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

tunnel จะเริ่มทำงานอัตโนมัติเมื่อ login รีสตาร์ตเมื่อ crash และคงพอร์ตที่ส่งต่อไว้ให้พร้อมใช้งาน

หมายเหตุ: หากคุณมี LaunchAgent `com.openclaw.ssh-tunnel` ที่ค้างมาจากการตั้งค่าเก่า ให้ unload และลบทิ้ง

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

| Config entry                         | สิ่งที่ทำ |
| ------------------------------------ | --------- |
| `LocalForward 18789 127.0.0.1:18789` | ส่งต่อพอร์ต local 18789 ไปยังพอร์ต remote 18789 |
| `ssh -N`                             | SSH โดยไม่รันคำสั่งบนเครื่องปลายทาง (ทำเฉพาะ port-forwarding) |
| `KeepAlive`                          | รีสตาร์ต tunnel โดยอัตโนมัติหากเกิด crash |
| `RunAtLoad`                          | เริ่มต้น tunnel เมื่อ LaunchAgent ถูกโหลดตอน login |

## ที่เกี่ยวข้อง

- [Tailscale](/th/gateway/tailscale)
- [Authentication](/th/gateway/authentication)
- [การตั้งค่า gateway ระยะไกล](/th/gateway/remote-gateway-readme)
