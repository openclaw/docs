---
read_when:
    - การเรียกใช้งานหรือการแก้ไขปัญหาการตั้งค่า Gateway ระยะไกล
summary: การเข้าถึงจากระยะไกลโดยใช้อุโมงค์ SSH (Gateway WS) และ tailnets
title: การเข้าถึงระยะไกล
x-i18n:
    generated_at: "2026-05-06T09:15:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6272f4ee9fa52091d461cd70be05ccf01c209c3b26fe98a71752f6ea86ea448
    source_path: gateway/remote.md
    workflow: 16
---

รีโพนี้รองรับ "รีโมตผ่าน SSH" โดยให้ Gateway ตัวเดียว (ตัวหลัก) ทำงานบนโฮสต์เฉพาะ (เดสก์ท็อป/เซิร์ฟเวอร์) และเชื่อมต่อไคลเอนต์เข้ากับมัน

- สำหรับ **ผู้ปฏิบัติการ (คุณ / แอป macOS)**: การทำ SSH tunneling เป็นตัวสำรองสากล
- สำหรับ **โหนด (iOS/Android และอุปกรณ์ในอนาคต)**: เชื่อมต่อกับ **WebSocket** ของ Gateway (LAN/tailnet หรือ SSH tunnel ตามที่จำเป็น)

## แนวคิดหลัก

- WebSocket ของ Gateway bind กับ **loopback** บนพอร์ตที่คุณกำหนดค่าไว้ (ค่าเริ่มต้นคือ 18789)
- สำหรับการใช้งานระยะไกล ให้ forward พอร์ต loopback นั้นผ่าน SSH (หรือใช้ tailnet/VPN แล้ว tunnel ให้น้อยลง)

## การตั้งค่า VPN และ tailnet ที่พบบ่อย

ให้คิดว่า **โฮสต์ Gateway** คือที่ที่เอเจนต์ทำงานอยู่ มันเป็นเจ้าของเซสชัน, โปรไฟล์ auth, ช่องทาง และสถานะ แล็ปท็อป เดสก์ท็อป และโหนดของคุณเชื่อมต่อเข้ากับโฮสต์นั้น

### Gateway ที่เปิดทำงานตลอดใน tailnet ของคุณ

รัน Gateway บนโฮสต์ที่คงอยู่ถาวร (VPS หรือเซิร์ฟเวอร์ที่บ้าน) และเข้าถึงผ่าน **Tailscale** หรือ SSH

- **UX ที่ดีที่สุด:** คง `gateway.bind: "loopback"` ไว้และใช้ **Tailscale Serve** สำหรับ Control UI
- **ทางเลือกสำรอง:** คง loopback ไว้พร้อม SSH tunnel จากเครื่องใดก็ตามที่ต้องการเข้าถึง
- **ตัวอย่าง:** [exe.dev](/th/install/exe-dev) (VM ที่ใช้ง่าย) หรือ [Hetzner](/th/install/hetzner) (VPS สำหรับ production)

เหมาะเมื่อแล็ปท็อปของคุณ sleep บ่อย แต่คุณต้องการให้เอเจนต์เปิดทำงานตลอด

### เดสก์ท็อปที่บ้านรัน Gateway

แล็ปท็อป **ไม่ได้** รันเอเจนต์ แต่เชื่อมต่อจากระยะไกล:

- ใช้โหมด **รีโมตผ่าน SSH** ของแอป macOS (Settings → General → OpenClaw runs)
- แอปจะเปิดและจัดการ tunnel ดังนั้น WebChat และการตรวจสุขภาพจึงใช้งานได้ทันที

Runbook: [การเข้าถึงระยะไกลบน macOS](/th/platforms/mac/remote)

### แล็ปท็อปรัน Gateway

คง Gateway ไว้ในเครื่อง แต่เปิดให้เข้าถึงอย่างปลอดภัย:

- SSH tunnel ไปยังแล็ปท็อปจากเครื่องอื่น หรือ
- ใช้ Tailscale Serve กับ Control UI และคง Gateway ให้เป็น loopback-only

คู่มือ: [Tailscale](/th/gateway/tailscale) และ [ภาพรวมเว็บ](/th/web)

## โฟลว์คำสั่ง (อะไรทำงานที่ไหน)

บริการ Gateway หนึ่งตัวเป็นเจ้าของสถานะ + ช่องทาง โหนดเป็นอุปกรณ์ต่อพ่วง

ตัวอย่างโฟลว์ (Telegram → โหนด):

- ข้อความ Telegram มาถึงที่ **Gateway**
- Gateway รัน **เอเจนต์** และตัดสินใจว่าจะเรียกเครื่องมือของโหนดหรือไม่
- Gateway เรียก **โหนด** ผ่าน WebSocket ของ Gateway (`node.*` RPC)
- โหนดส่งผลลัพธ์กลับมา; Gateway ตอบกลับออกไปยัง Telegram

หมายเหตุ:

- **โหนดไม่ได้รันบริการ gateway** ควรมี gateway เพียงตัวเดียวต่อโฮสต์ เว้นแต่คุณตั้งใจรันโปรไฟล์ที่แยกจากกัน (ดู [หลาย gateway](/th/gateway/multiple-gateways))
- "โหมดโหนด" ของแอป macOS เป็นเพียงไคลเอนต์โหนดผ่าน WebSocket ของ Gateway

## SSH tunnel (CLI + เครื่องมือ)

สร้าง tunnel ภายในเครื่องไปยัง Gateway WS ระยะไกล:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

เมื่อเปิด tunnel แล้ว:

- `openclaw health` และ `openclaw status --deep` จะเข้าถึง gateway ระยะไกลผ่าน `ws://127.0.0.1:18789`
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` และ `openclaw gateway call` สามารถชี้ไปยัง URL ที่ forward แล้วผ่าน `--url` ได้เช่นกันเมื่อจำเป็น

<Note>
แทนที่ `18789` ด้วย `gateway.port` ที่คุณกำหนดค่าไว้ (หรือ `--port` หรือ `OPENCLAW_GATEWAY_PORT`)
</Note>

<Warning>
เมื่อคุณส่ง `--url` CLI จะไม่ fallback ไปใช้ config หรือข้อมูลลับจาก environment ให้ใส่ `--token` หรือ `--password` อย่างชัดเจน การไม่มีข้อมูลลับที่ระบุชัดเจนถือเป็นข้อผิดพลาด
</Warning>

## ค่าเริ่มต้นระยะไกลของ CLI

คุณสามารถบันทึกเป้าหมายระยะไกลไว้ถาวร เพื่อให้คำสั่ง CLI ใช้เป็นค่าเริ่มต้น:

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

เมื่อ gateway เป็น loopback-only ให้คง URL ไว้ที่ `ws://127.0.0.1:18789` และเปิด SSH tunnel ก่อน
ใน transport แบบ SSH tunnel ของแอป macOS ชื่อโฮสต์ gateway ที่ค้นพบควรอยู่ใน
`gateway.remote.sshTarget`; `gateway.remote.url` ยังคงเป็น URL ของ tunnel ภายในเครื่อง

## ลำดับความสำคัญของข้อมูลลับ

การแก้ข้อมูลลับของ Gateway ใช้สัญญาร่วมเดียวกันใน path ของ call/probe/status และการมอนิเตอร์ exec-approval ของ Discord Node-host ใช้สัญญาพื้นฐานเดียวกันพร้อมข้อยกเว้น local-mode หนึ่งข้อ (มันตั้งใจละเว้น `gateway.remote.*`):

- ข้อมูลลับที่ระบุชัดเจน (`--token`, `--password` หรือเครื่องมือ `gatewayToken`) ชนะเสมอบน path การเรียกที่รองรับ auth แบบระบุชัดเจน
- ความปลอดภัยของการ override URL:
  - การ override URL ของ CLI (`--url`) จะไม่ reuse ข้อมูลลับ implicit จาก config/env
  - การ override URL จาก env (`OPENCLAW_GATEWAY_URL`) อาจใช้ได้เฉพาะข้อมูลลับจาก env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)
- ค่าเริ่มต้นของโหมดภายในเครื่อง:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (remote fallback ใช้เฉพาะเมื่อไม่ได้ตั้งค่าอินพุต token ของ local auth)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (remote fallback ใช้เฉพาะเมื่อไม่ได้ตั้งค่าอินพุต password ของ local auth)
- ค่าเริ่มต้นของโหมดระยะไกล:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- ข้อยกเว้น local-mode ของ Node-host: `gateway.remote.token` / `gateway.remote.password` จะถูกละเว้น
- การตรวจ token ของ probe/status ระยะไกลเข้มงวดตามค่าเริ่มต้น: เมื่อชี้ไปที่โหมดระยะไกล จะใช้เฉพาะ `gateway.remote.token` เท่านั้น (ไม่มี local token fallback)
- การ override env ของ Gateway ใช้เฉพาะ `OPENCLAW_GATEWAY_*`

## Chat UI ผ่าน SSH

WebChat ไม่ใช้พอร์ต HTTP แยกอีกต่อไป SwiftUI chat UI เชื่อมต่อโดยตรงกับ WebSocket ของ Gateway

- Forward `18789` ผ่าน SSH (ดูด้านบน) จากนั้นเชื่อมต่อไคลเอนต์ไปที่ `ws://127.0.0.1:18789`
- บน macOS ให้ใช้โหมด "รีโมตผ่าน SSH" ของแอป ซึ่งจัดการ tunnel ให้อัตโนมัติ

## แอป macOS รีโมตผ่าน SSH

แอปแถบเมนู macOS สามารถขับเคลื่อนการตั้งค่าเดียวกันแบบครบวงจร (การตรวจสถานะระยะไกล, WebChat และการ forward Voice Wake)

Runbook: [การเข้าถึงระยะไกลบน macOS](/th/platforms/mac/remote)

## กฎความปลอดภัย (remote/VPN)

เวอร์ชันสั้น: **คง Gateway ให้เป็น loopback-only** เว้นแต่คุณแน่ใจว่าจำเป็นต้อง bind

- **Loopback + SSH/Tailscale Serve** เป็นค่าเริ่มต้นที่ปลอดภัยที่สุด (ไม่มีการเปิดเผยต่อสาธารณะ)
- Plaintext `ws://` เป็น loopback-only ตามค่าเริ่มต้น สำหรับเครือข่ายส่วนตัวที่เชื่อถือได้
  ให้ตั้ง `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` บนโปรเซสไคลเอนต์เป็น
  มาตรการฉุกเฉิน ไม่มีค่าเทียบเท่าใน `openclaw.json`; ค่านี้ต้องเป็น process
  environment สำหรับไคลเอนต์ที่สร้างการเชื่อมต่อ WebSocket
- **Non-loopback binds** (`lan`/`tailnet`/`custom` หรือ `auto` เมื่อ loopback ไม่พร้อมใช้งาน) ต้องใช้ gateway auth: token, password หรือ reverse proxy ที่รับรู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"`
- `gateway.remote.token` / `.password` เป็นแหล่งข้อมูลลับของไคลเอนต์ มัน **ไม่ได้** กำหนดค่า server auth ด้วยตัวเอง
- path การเรียกภายในเครื่องสามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
- หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าไว้อย่างชัดเจนผ่าน SecretRef และแก้ค่าไม่ได้ การแก้ค่าจะ fail closed (ไม่มี remote fallback มาบดบัง)
- `gateway.remote.tlsFingerprint` pin ใบรับรอง TLS ระยะไกลเมื่อใช้ `wss://`
- **Tailscale Serve** สามารถ authenticate ทราฟฟิก Control UI/WebSocket ผ่าน identity
  headers เมื่อ `gateway.auth.allowTailscale: true`; endpoint ของ HTTP API ไม่ได้
  ใช้ Tailscale header auth นั้น และจะทำตามโหมด HTTP auth ปกติของ gateway
  แทน โฟลว์แบบไม่มี token นี้ถือว่าโฮสต์ gateway เชื่อถือได้ ตั้งค่าเป็น
  `false` หากคุณต้องการ shared-secret auth ทุกที่
- **Trusted-proxy** auth คาดหวังการตั้งค่า proxy ที่รับรู้ตัวตนแบบ non-loopback ตามค่าเริ่มต้น
  reverse proxy แบบ loopback บนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน
- ปฏิบัติต่อการควบคุมผ่านเบราว์เซอร์เหมือนการเข้าถึงของผู้ปฏิบัติการ: เฉพาะ tailnet + การจับคู่โหนดอย่างตั้งใจ

เจาะลึก: [ความปลอดภัย](/th/gateway/security)

### macOS: SSH tunnel แบบถาวรผ่าน LaunchAgent

สำหรับไคลเอนต์ macOS ที่เชื่อมต่อกับ gateway ระยะไกล การตั้งค่าแบบถาวรที่ง่ายที่สุดใช้รายการ config `LocalForward` ของ SSH พร้อม LaunchAgent เพื่อคง tunnel ให้ทำงานต่อเนื่องข้ามการรีบูตและการ crash

#### ขั้นตอนที่ 1: เพิ่ม config ของ SSH

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

จัดเก็บ token ไว้ใน config เพื่อให้คงอยู่ข้ามการรีสตาร์ท:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### ขั้นตอนที่ 4: สร้าง LaunchAgent

บันทึกเป็น `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

Tunnel จะเริ่มทำงานอัตโนมัติเมื่อเข้าสู่ระบบ รีสตาร์ทเมื่อ crash และคงพอร์ตที่ forward ไว้ให้ใช้งาน

<Note>
หากคุณมี LaunchAgent `com.openclaw.ssh-tunnel` ที่เหลือจากการตั้งค่าเก่า ให้ unload และลบมัน
</Note>

#### การแก้ไขปัญหา

ตรวจว่า tunnel กำลังทำงานอยู่หรือไม่:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

รีสตาร์ท tunnel:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

หยุด tunnel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| รายการ Config                         | ทำอะไร                                                       |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Forward พอร์ตภายในเครื่อง 18789 ไปยังพอร์ตระยะไกล 18789       |
| `ssh -N`                             | SSH โดยไม่รันคำสั่งระยะไกล (เฉพาะ port-forwarding เท่านั้น) |
| `KeepAlive`                          | รีสตาร์ท tunnel อัตโนมัติหากมัน crash                         |
| `RunAtLoad`                          | เริ่ม tunnel เมื่อ LaunchAgent โหลดตอนเข้าสู่ระบบ             |

## ที่เกี่ยวข้อง

- [Tailscale](/th/gateway/tailscale)
- [การยืนยันตัวตน](/th/gateway/authentication)
- [การตั้งค่า gateway ระยะไกล](/th/gateway/remote-gateway-readme)
