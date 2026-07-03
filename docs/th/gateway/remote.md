---
read_when:
    - การเรียกใช้หรือแก้ไขปัญหาการตั้งค่า Gateway ระยะไกล
summary: การเข้าถึงระยะไกลโดยใช้ Gateway WS, อุโมงค์ SSH และ tailnet
title: การเข้าถึงระยะไกล
x-i18n:
    generated_at: "2026-07-03T23:45:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb6fd38698480f1dff93a6e4819082711e8e4395556a2fd85a8eb772ef6fbe31
    source_path: gateway/remote.md
    workflow: 16
---

รีโพนี้รองรับการเข้าถึง Gateway ระยะไกลโดยให้ Gateway เดียว (ตัวหลัก) ทำงานบนโฮสต์เฉพาะ (เดสก์ท็อป/เซิร์ฟเวอร์) และเชื่อมต่อไคลเอนต์เข้าหา Gateway นั้น

- สำหรับ **ผู้ควบคุม (คุณ / แอป macOS)**: WebSocket ผ่าน LAN/Tailnet โดยตรงเป็นวิธีที่ง่ายที่สุดเมื่อเข้าถึง gateway ได้; SSH tunneling เป็นทางเลือกสำรองที่ใช้ได้ทั่วไป
- สำหรับ **โหนด (iOS/Android และอุปกรณ์ในอนาคต)**: เชื่อมต่อกับ **WebSocket** ของ Gateway (LAN/tailnet หรือ SSH tunnel ตามที่จำเป็น)

## แนวคิดหลัก

- โดยปกติ WebSocket ของ Gateway จะ bind กับ **loopback** บนพอร์ตที่คุณกำหนดค่าไว้ (ค่าเริ่มต้นคือ 18789)
- สำหรับการใช้งานระยะไกล ให้เปิดให้เข้าถึงผ่าน Tailscale Serve หรือ bind กับ LAN/Tailnet ที่เชื่อถือได้ หรือ forward พอร์ต loopback ผ่าน SSH

## การตั้งค่า VPN และ tailnet ที่พบบ่อย

ให้มองว่า **โฮสต์ Gateway** คือที่ที่เอเจนต์ทำงานอยู่ โฮสต์นี้เป็นเจ้าของเซสชัน, โปรไฟล์ auth, ช่องทาง และสถานะ แล็ปท็อป เดสก์ท็อป และโหนดของคุณเชื่อมต่อมายังโฮสต์นี้

### Gateway ที่เปิดตลอดใน tailnet ของคุณ

รัน Gateway บนโฮสต์ที่คงอยู่ต่อเนื่อง (VPS หรือเซิร์ฟเวอร์ที่บ้าน) และเข้าถึงผ่าน **Tailscale** หรือ SSH

- **UX ที่ดีที่สุด:** คง `gateway.bind: "loopback"` ไว้ และใช้ **Tailscale Serve** สำหรับ Control UI
- **LAN/Tailnet ที่เชื่อถือได้:** bind gateway กับอินเทอร์เฟซส่วนตัวและเชื่อมต่อโดยตรงด้วย `gateway.remote.transport: "direct"`
- **ทางเลือกสำรอง:** คง loopback ไว้พร้อม SSH tunnel จากเครื่องใดก็ตามที่ต้องการเข้าถึง
- **ตัวอย่าง:** [exe.dev](/th/install/exe-dev) (VM ที่ใช้ง่าย) หรือ [Hetzner](/th/install/hetzner) (VPS สำหรับ production)

เหมาะเมื่อแล็ปท็อปของคุณมักเข้าสู่โหมด sleep แต่คุณต้องการให้เอเจนต์เปิดตลอด

### เดสก์ท็อปที่บ้านรัน Gateway

แล็ปท็อป **ไม่ได้** รันเอเจนต์ แต่เชื่อมต่อจากระยะไกล:

- ใช้โหมดระยะไกลของแอป macOS (Settings → General → OpenClaw runs)
- แอปจะเชื่อมต่อโดยตรงเมื่อเข้าถึง gateway ได้บน LAN/Tailnet หรือเปิดและจัดการ SSH tunnel เมื่อคุณเลือก SSH

คู่มือปฏิบัติ: [การเข้าถึงระยะไกลบน macOS](/th/platforms/mac/remote)

### แล็ปท็อปรัน Gateway

คง Gateway ไว้ในเครื่อง แต่เปิดให้เข้าถึงอย่างปลอดภัย:

- SSH tunnel ไปยังแล็ปท็อปจากเครื่องอื่น หรือ
- ใช้ Tailscale Serve สำหรับ Control UI และคง Gateway ให้ใช้ได้เฉพาะ loopback

คู่มือ: [Tailscale](/th/gateway/tailscale) และ [ภาพรวมเว็บ](/th/web)

## ลำดับคำสั่ง (อะไรทำงานที่ไหน)

บริการ gateway เดียวเป็นเจ้าของสถานะ + ช่องทาง โหนดเป็นอุปกรณ์ต่อพ่วง

ตัวอย่าง flow (Telegram → โหนด):

- ข้อความ Telegram มาถึงที่ **Gateway**
- Gateway รัน **เอเจนต์** และตัดสินใจว่าจะเรียกเครื่องมือของโหนดหรือไม่
- Gateway เรียก **โหนด** ผ่าน WebSocket ของ Gateway (`node.*` RPC)
- โหนดส่งผลลัพธ์กลับมา; Gateway ตอบกลับออกไปยัง Telegram

หมายเหตุ:

- **โหนดไม่ได้รันบริการ gateway** ควรมี gateway เพียงตัวเดียวต่อโฮสต์ เว้นแต่คุณตั้งใจรันโปรไฟล์ที่แยกกัน (ดู [หลาย gateway](/th/gateway/multiple-gateways))
- "โหมดโหนด" ของแอป macOS เป็นเพียงไคลเอนต์โหนดผ่าน WebSocket ของ Gateway

## SSH tunnel (CLI + เครื่องมือ)

สร้าง tunnel ในเครื่องไปยัง Gateway WS ระยะไกล:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

เมื่อเปิด tunnel แล้ว:

- `openclaw health` และ `openclaw status --deep` จะเข้าถึง gateway ระยะไกลผ่าน `ws://127.0.0.1:18789`
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` และ `openclaw gateway call` ยังสามารถชี้ไปยัง URL ที่ forward ไว้ผ่าน `--url` ได้เมื่อจำเป็น

<Note>
แทนที่ `18789` ด้วย `gateway.port` ที่คุณกำหนดค่าไว้ (หรือ `--port` หรือ `OPENCLAW_GATEWAY_PORT`)
</Note>

<Warning>
เมื่อคุณส่ง `--url` CLI จะไม่ fallback ไปใช้ config หรือข้อมูลรับรองจาก environment ให้ใส่ `--token` หรือ `--password` อย่างชัดเจน การไม่มีข้อมูลรับรองที่ระบุชัดเจนถือเป็นข้อผิดพลาด
</Warning>

## ค่าเริ่มต้นระยะไกลของ CLI

คุณสามารถบันทึกเป้าหมายระยะไกลถาวรเพื่อให้คำสั่ง CLI ใช้เป็นค่าเริ่มต้นได้:

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

เมื่อ gateway ใช้ได้เฉพาะ loopback ให้คง URL เป็น `ws://127.0.0.1:18789` และเปิด SSH tunnel ก่อน
ใน transport แบบ SSH tunnel ของแอป macOS ชื่อโฮสต์ gateway ที่ค้นพบควรอยู่ใน
`gateway.remote.sshTarget`; `gateway.remote.url` ยังคงเป็น URL ของ tunnel ในเครื่อง
หากพอร์ตเหล่านั้นต่างกัน ให้ตั้ง `gateway.remote.remotePort` เป็นพอร์ต gateway บน
โฮสต์ SSH
การตรวจสอบ host-key เข้มงวดโดยค่าเริ่มต้น alias ที่จัดการอยู่สามารถใช้
นโยบายความเชื่อถือ OpenSSH ที่มีผลของตนได้อย่างชัดเจนด้วย
`gateway.remote.sshHostKeyPolicy: "openssh"`; ตรวจทานการตั้งค่า SSH ของผู้ใช้และระบบที่ตรงกันก่อนเปิดใช้

สำหรับ gateway ที่เข้าถึงได้อยู่แล้วบน LAN หรือ Tailnet ที่เชื่อถือได้ ให้ใช้โหมด direct:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## ลำดับความสำคัญของข้อมูลรับรอง

การ resolve ข้อมูลรับรองของ Gateway ใช้สัญญาร่วมกันหนึ่งชุดในเส้นทาง call/probe/status และการมอนิเตอร์ exec-approval ของ Discord Node-host ใช้สัญญาพื้นฐานเดียวกันพร้อมข้อยกเว้นของ local-mode หนึ่งรายการ (ตั้งใจละเว้น `gateway.remote.*`):

- ข้อมูลรับรองที่ระบุชัดเจน (`--token`, `--password` หรือ `gatewayToken` ของเครื่องมือ) ชนะเสมอบนเส้นทาง call ที่รับ auth แบบชัดเจน
- ความปลอดภัยของการ override URL:
  - การ override URL ของ CLI (`--url`) จะไม่ใช้ข้อมูลรับรอง config/env แบบ implicit ซ้ำ
  - การ override URL ของ env (`OPENCLAW_GATEWAY_URL`) อาจใช้ได้เฉพาะข้อมูลรับรองจาก env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)
- ค่าเริ่มต้นของ local mode:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (remote fallback ใช้เฉพาะเมื่อไม่ได้ตั้งค่า input ของ local auth token)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (remote fallback ใช้เฉพาะเมื่อไม่ได้ตั้งค่า input ของ local auth password)
- ค่าเริ่มต้นของ remote mode:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- ข้อยกเว้น local-mode ของ Node-host: `gateway.remote.token` / `gateway.remote.password` จะถูกละเว้น
- การตรวจ token ของ remote probe/status เข้มงวดโดยค่าเริ่มต้น: ใช้เฉพาะ `gateway.remote.token` (ไม่มี local token fallback) เมื่อชี้ไปที่ remote mode
- การ override env ของ Gateway ใช้เฉพาะ `OPENCLAW_GATEWAY_*`

## การเข้าถึง Chat UI ระยะไกล

WebChat ไม่ใช้พอร์ต HTTP แยกต่างหากอีกต่อไป Chat UI ของ SwiftUI เชื่อมต่อโดยตรงกับ WebSocket ของ Gateway

- Forward `18789` ผ่าน SSH (ดูด้านบน) แล้วเชื่อมต่อไคลเอนต์ไปยัง `ws://127.0.0.1:18789`
- สำหรับโหมด direct ผ่าน LAN/Tailnet ให้เชื่อมต่อไคลเอนต์ไปยัง URL `ws://` ส่วนตัวหรือ `wss://` แบบปลอดภัยที่กำหนดค่าไว้
- บน macOS แนะนำให้ใช้โหมดระยะไกลของแอป ซึ่งจัดการ transport ที่เลือกให้โดยอัตโนมัติ

## โหมดระยะไกลของแอป macOS

แอปแถบเมนู macOS สามารถขับเคลื่อนการตั้งค่าเดียวกันแบบครบวงจร (การตรวจสถานะระยะไกล, WebChat และการ forward Voice Wake)

คู่มือปฏิบัติ: [การเข้าถึงระยะไกลบน macOS](/th/platforms/mac/remote)

## กฎความปลอดภัย (ระยะไกล/VPN)

สรุปสั้น ๆ: **คง Gateway ให้ใช้ได้เฉพาะ loopback** เว้นแต่คุณแน่ใจว่าต้อง bind

- **Loopback + SSH/Tailscale Serve** เป็นค่าเริ่มต้นที่ปลอดภัยที่สุด (ไม่มีการเปิดสู่สาธารณะ)
- `ws://` แบบ plaintext ยอมรับได้สำหรับ loopback, LAN, link-local, `.local`, `.ts.net` และโฮสต์ Tailscale CGNAT โฮสต์ระยะไกลสาธารณะต้องใช้ `wss://`
- **การ bind ที่ไม่ใช่ loopback** (`lan`/`tailnet`/`custom` หรือ `auto` เมื่อ loopback ใช้งานไม่ได้) ต้องใช้ gateway auth: token, password หรือ reverse proxy ที่รู้ identity พร้อม `gateway.auth.mode: "trusted-proxy"`
- `gateway.remote.token` / `.password` เป็นแหล่งข้อมูลรับรองของไคลเอนต์ โดยตัวมันเอง **ไม่ได้** กำหนดค่า auth ฝั่งเซิร์ฟเวอร์
- เส้นทาง local call สามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
- หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าอย่างชัดเจนผ่าน SecretRef และ resolve ไม่ได้ การ resolve จะ fail closed (ไม่มี remote fallback มาบดบัง)
- `gateway.remote.tlsFingerprint` pin ใบรับรอง TLS ระยะไกลเมื่อใช้ `wss://` รวมถึงโหมด direct บน macOS หากไม่มี pin ที่กำหนดค่าไว้หรือเก็บไว้ก่อนหน้า macOS จะ pin ใบรับรองเมื่อใช้ครั้งแรกหลังจากผ่านความเชื่อถือของระบบตามปกติเท่านั้น; gateway ที่ self-signed หรือใช้ private-CA ที่ macOS ยังไม่เชื่อถือต้องใช้ fingerprint ที่ระบุชัดเจนหรือ Remote over SSH
- **Tailscale Serve** สามารถยืนยันตัวตนทราฟฟิก Control UI/WebSocket ผ่าน header ของ identity
  เมื่อ `gateway.auth.allowTailscale: true`; endpoint ของ HTTP API จะไม่
  ใช้ auth จาก header ของ Tailscale นั้น และจะทำตามโหมด auth HTTP ปกติ
  ของ gateway แทน flow แบบไม่ใช้ token นี้ถือว่าโฮสต์ gateway เชื่อถือได้ ตั้งค่าเป็น
  `false` หากคุณต้องการ auth แบบ shared-secret ทุกที่
- auth แบบ **trusted-proxy** คาดหวังการตั้งค่า proxy ที่รู้ identity และไม่ใช่ loopback โดยค่าเริ่มต้น
  reverse proxy แบบ loopback บนโฮสต์เดียวกันต้องตั้ง `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน
- ปฏิบัติกับการควบคุมผ่านเบราว์เซอร์เหมือนการเข้าถึงของผู้ควบคุม: เฉพาะ tailnet + การจับคู่โหนดโดยเจตนา

เจาะลึก: [ความปลอดภัย](/th/gateway/security)

### macOS: SSH tunnel แบบถาวรผ่าน LaunchAgent

สำหรับไคลเอนต์ macOS ที่เชื่อมต่อกับ gateway ระยะไกล การตั้งค่าแบบถาวรที่ง่ายที่สุดใช้รายการ config `LocalForward` ของ SSH ร่วมกับ LaunchAgent เพื่อให้ tunnel ยังทำงานข้ามการรีบูตและการ crash

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

#### ขั้นตอนที่ 2: คัดลอกคีย์ SSH (ครั้งเดียว)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### ขั้นตอนที่ 3: กำหนดค่า token ของ gateway

เก็บ token ไว้ใน config เพื่อให้คงอยู่ข้ามการ restart:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### ขั้นตอนที่ 4: สร้าง LaunchAgent

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

#### ขั้นตอนที่ 5: โหลด LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

tunnel จะเริ่มโดยอัตโนมัติเมื่อ login, restart เมื่อ crash และคงพอร์ตที่ forward ไว้ให้ใช้งานได้

<Note>
หากคุณมี LaunchAgent `com.openclaw.ssh-tunnel` ที่เหลือจากการตั้งค่าเก่า ให้ unload และลบออก
</Note>

#### การแก้ปัญหา

ตรวจว่า tunnel กำลังทำงานอยู่หรือไม่:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Restart tunnel:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

หยุด tunnel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| รายการ config                        | สิ่งที่ทำ                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Forward พอร์ต local 18789 ไปยังพอร์ต remote 18789            |
| `ssh -N`                             | SSH โดยไม่รันคำสั่ง remote (เฉพาะ port-forwarding)           |
| `KeepAlive`                          | Restart tunnel โดยอัตโนมัติหาก tunnel crash                  |
| `RunAtLoad`                          | เริ่ม tunnel เมื่อ LaunchAgent โหลดตอน login                 |

## ที่เกี่ยวข้อง

- [Tailscale](/th/gateway/tailscale)
- [การยืนยันตัวตน](/th/gateway/authentication)
- [การตั้งค่า gateway ระยะไกล](/th/gateway/remote-gateway-readme)
