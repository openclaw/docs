---
read_when:
    - การเรียกใช้หรือแก้ไขปัญหาการตั้งค่า Gateway ระยะไกล
summary: การเข้าถึงระยะไกลโดยใช้ Gateway WS, อุโมงค์ SSH และเครือข่าย Tailnet
title: การเข้าถึงระยะไกล
x-i18n:
    generated_at: "2026-07-12T16:11:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw เรียกใช้ Gateway หนึ่งตัว (ตัวหลัก) บนโฮสต์ และเชื่อมต่อไคลเอนต์ทุกตัวเข้ากับ Gateway นั้น Gateway เป็นเจ้าของเซสชัน โปรไฟล์การยืนยันตัวตน ช่องทาง และสถานะ ส่วนที่เหลือทั้งหมดเป็นไคลเอนต์

- **ผู้ควบคุมระบบ** (คุณหรือแอป macOS): WebSocket โดยตรงผ่าน LAN/Tailnet เป็นวิธีที่ง่ายที่สุดเมื่อเข้าถึง Gateway ได้ ส่วนอุโมงค์ SSH เป็นทางเลือกสำรองที่ใช้ได้ทั่วไป
- **Node** (iOS/Android และอุปกรณ์อื่นๆ): เชื่อมต่อกับ **WebSocket** ของ Gateway (ผ่าน LAN/tailnet หรืออุโมงค์ SSH)

## แนวคิดหลัก

โดยค่าเริ่มต้น WebSocket ของ Gateway จะผูกกับ **loopback** ที่พอร์ต `18789` (`gateway.port`) สำหรับการใช้งานระยะไกล ให้เปิดเผยผ่าน Tailscale Serve / การผูกกับ LAN-Tailnet ที่เชื่อถือได้ หรือส่งต่อพอร์ต loopback ผ่าน SSH

## ตัวเลือกโทโพโลยี

| การตั้งค่า                             | ตำแหน่งที่ Gateway ทำงาน                                                                                    | เหมาะที่สุดสำหรับ                                                                                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gateway ที่ทำงานตลอดเวลาใน tailnet ของคุณ | โฮสต์ถาวร (VPS หรือเซิร์ฟเวอร์ภายในบ้าน) ซึ่งเข้าถึงผ่าน Tailscale หรือ SSH                                        | แล็ปท็อปที่พักเครื่องบ่อยแต่ต้องการให้เอเจนต์ทำงานตลอดเวลา ดู [exe.dev](/th/install/exe-dev) (VM ที่ใช้งานง่าย) หรือ [Hetzner](/th/install/hetzner) (VPS สำหรับระบบใช้งานจริง) |
| เดสก์ท็อปภายในบ้าน                      | เดสก์ท็อป โดยแล็ปท็อปเชื่อมต่อจากระยะไกลผ่านโหมดระยะไกลของแอป macOS (Settings → Connection → OpenClaw runs) | ให้เอเจนต์ทำงานบนฮาร์ดแวร์ที่เปิดเครื่องอยู่ตลอด คู่มือปฏิบัติงาน: [การเข้าถึง macOS จากระยะไกล](/th/platforms/mac/remote)                                       |
| แล็ปท็อป                            | แล็ปท็อป ซึ่งเปิดเผยอย่างปลอดภัยผ่านอุโมงค์ SSH หรือ Tailscale Serve (คง `gateway.bind: "loopback"` ไว้)                | การตั้งค่าแบบเครื่องเดียว ดู [Tailscale](/th/gateway/tailscale) และ [เว็บ](/th/web)                                                                       |

สำหรับการตั้งค่าแบบทำงานตลอดเวลาและแบบแล็ปท็อป ควรคง `gateway.bind: "loopback"` ไว้และใช้ **Tailscale Serve** สำหรับ UI ควบคุม หรือใช้การผูกกับ LAN/Tailnet ที่เชื่อถือได้ร่วมกับ `gateway.remote.transport: "direct"` อุโมงค์ SSH เป็นทางเลือกสำรองที่ใช้ได้จากทุกเครื่อง

## ลำดับการทำงานของคำสั่ง (สิ่งใดทำงานที่ใด)

Gateway หนึ่งตัวเป็นเจ้าของสถานะและช่องทาง ส่วน Node เป็นอุปกรณ์ต่อพ่วง ตัวอย่าง (ข้อความ Telegram ถูกกำหนดเส้นทางไปยังเครื่องมือของ Node):

1. ข้อความ Telegram มาถึง **Gateway**
2. Gateway เรียกใช้ **เอเจนต์** ซึ่งตัดสินใจว่าจะเรียกเครื่องมือของ Node หรือไม่
3. Gateway เรียก **Node** ผ่าน WebSocket ของ Gateway (`node.invoke` RPC)
4. Node ส่งผลลัพธ์กลับมา จากนั้น Gateway ตอบกลับไปยัง Telegram

Node ไม่ได้เรียกใช้บริการ Gateway ควรมี Gateway เพียงหนึ่งตัวต่อโฮสต์ เว้นแต่คุณตั้งใจเรียกใช้โปรไฟล์ที่แยกจากกัน (ดู [Gateway หลายตัว](/th/gateway/multiple-gateways)) "โหมด Node" ของแอป macOS เป็นเพียงไคลเอนต์ Node ที่ทำงานผ่าน WebSocket ของ Gateway

## อุโมงค์ SSH (CLI + เครื่องมือ)

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

เมื่ออุโมงค์ทำงานแล้ว `openclaw health` และ `openclaw status --deep` จะเข้าถึง Gateway ระยะไกลผ่าน `ws://127.0.0.1:18789` นอกจากนี้ `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` และ `openclaw gateway call` ยังสามารถกำหนดเป้าหมายเป็น URL ที่ส่งต่อไว้ผ่าน `--url` ได้

<Note>
แทนที่ `18789` ด้วย `gateway.port` ที่คุณกำหนดค่าไว้ (หรือ `--port` / `OPENCLAW_GATEWAY_PORT`)
</Note>

<Warning>
`--url` จะไม่ย้อนกลับไปใช้ข้อมูลประจำตัวจากการกำหนดค่าหรือตัวแปรสภาพแวดล้อมโดยเด็ดขาด ส่ง `--token` หรือ `--password` อย่างชัดเจน หากไม่ส่ง ไคลเอนต์จะไม่ส่งข้อมูลประจำตัวใดๆ และการเชื่อมต่อจะล้มเหลวหาก Gateway เป้าหมายกำหนดให้ต้องยืนยันตัวตน
</Warning>

## ค่าเริ่มต้นระยะไกลของ CLI

บันทึกเป้าหมายระยะไกลไว้เพื่อให้คำสั่ง CLI ใช้เป้าหมายนั้นโดยค่าเริ่มต้น:

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

เมื่อ Gateway จำกัดไว้เฉพาะ loopback ให้คง URL เป็น `ws://127.0.0.1:18789` และเปิดอุโมงค์ SSH ก่อน ในการรับส่งผ่านอุโมงค์ SSH ของแอป macOS ให้ใส่ชื่อโฮสต์ Gateway ที่ค้นพบไว้ใน `gateway.remote.sshTarget` (`user@host` หรือ `user@host:port`) ส่วน `gateway.remote.url` ยังคงเป็น URL ของอุโมงค์ภายในเครื่อง หากพอร์ตระยะไกลแตกต่างจากพอร์ตภายในเครื่อง ให้ตั้งค่า `gateway.remote.remotePort`

การตรวจสอบคีย์โฮสต์มีความเข้มงวดโดยค่าเริ่มต้น (`gateway.remote.sshHostKeyPolicy: "strict"`) ตั้งค่าเป็น `"openssh"` เพื่อมอบหมายให้การกำหนดค่า OpenSSH ที่มีผลใช้งานของคุณจัดการแทน โปรดตรวจสอบการตั้งค่า SSH ระดับผู้ใช้และระดับระบบก่อนเปิดใช้

สำหรับ Gateway ที่เข้าถึงได้อยู่แล้วผ่าน LAN หรือ Tailnet ที่เชื่อถือได้ ให้ใช้โหมดโดยตรง:

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

## ลำดับความสำคัญของข้อมูลประจำตัว

การแก้ไขข้อมูลประจำตัวของ Gateway ใช้สัญญาร่วมเดียวกันในเส้นทางการเรียก/การตรวจสอบ/สถานะ และการเฝ้าติดตามการอนุมัติการดำเนินการของ Discord โฮสต์ Node ใช้สัญญาเดียวกัน โดยมีข้อยกเว้นหนึ่งรายการในโหมดภายในเครื่อง (จะละเว้น `gateway.remote.*`)

- ข้อมูลประจำตัวที่ระบุอย่างชัดเจน (`--token`, `--password` หรือ `gatewayToken` ของเครื่องมือ) มีลำดับความสำคัญสูงสุดเสมอในเส้นทางการเรียกที่ยอมรับการยืนยันตัวตนแบบระบุชัดเจน
- ความปลอดภัยในการแทนที่ URL:
  - `--url` ของ CLI จะไม่นำข้อมูลประจำตัวโดยนัยจากการกำหนดค่า/ตัวแปรสภาพแวดล้อมมาใช้ซ้ำโดยเด็ดขาด
  - `OPENCLAW_GATEWAY_URL` จากตัวแปรสภาพแวดล้อมอาจใช้ได้เฉพาะข้อมูลประจำตัวจากตัวแปรสภาพแวดล้อม (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)
- ค่าเริ่มต้นของโหมดภายในเครื่อง:
  - โทเค็น: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (ย้อนกลับไปใช้ค่าระยะไกลเฉพาะเมื่อไม่ได้ตั้งค่าโทเค็นภายในเครื่อง)
  - รหัสผ่าน: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (ย้อนกลับไปใช้ค่าระยะไกลเฉพาะเมื่อไม่ได้ตั้งค่ารหัสผ่านภายในเครื่อง)
- ค่าเริ่มต้นของโหมดระยะไกล:
  - โทเค็น: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - รหัสผ่าน: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- ข้อยกเว้นของโฮสต์ Node ในโหมดภายในเครื่อง: จะละเว้น `gateway.remote.token` / `gateway.remote.password`
- การตรวจสอบโทเค็นสำหรับการตรวจสอบ/สถานะระยะไกลมีความเข้มงวดโดยค่าเริ่มต้น โดยจะใช้เฉพาะ `gateway.remote.token` (ไม่ย้อนกลับไปใช้โทเค็นภายในเครื่อง) เมื่อกำหนดเป้าหมายเป็นโหมดระยะไกล
- การแทนที่ค่าของ Gateway ผ่านตัวแปรสภาพแวดล้อมใช้เฉพาะ `OPENCLAW_GATEWAY_*`

## การเข้าถึง UI แชตจากระยะไกล

WebChat ไม่มีพอร์ต HTTP แยกต่างหาก UI แชต SwiftUI จะเชื่อมต่อโดยตรงกับ WebSocket ของ Gateway

- ส่งต่อ `18789` ผ่าน SSH (ดูด้านบน) จากนั้นเชื่อมต่อไคลเอนต์กับ `ws://127.0.0.1:18789`
- สำหรับโหมดโดยตรงผ่าน LAN/Tailnet ให้เชื่อมต่อไคลเอนต์กับ URL ส่วนตัว `ws://` หรือ URL ที่ปลอดภัย `wss://` ตามที่กำหนดค่าไว้
- บน macOS โหมดระยะไกลของแอปจะจัดการวิธีการรับส่งที่เลือกโดยอัตโนมัติ

## โหมดระยะไกลของแอป macOS

แอปแถบเมนูของ macOS ควบคุมการตั้งค่าเดียวกันตั้งแต่ต้นจนจบ ได้แก่ การตรวจสอบสถานะระยะไกล WebChat และการส่งต่อการปลุกด้วยเสียง คู่มือปฏิบัติงาน: [การเข้าถึง macOS จากระยะไกล](/th/platforms/mac/remote)

## กฎความปลอดภัย (ระยะไกล/VPN)

คง Gateway ให้ **จำกัดเฉพาะ loopback** เว้นแต่คุณจะแน่ใจว่าต้องใช้การผูก

- **Loopback + SSH/Tailscale Serve** เป็นค่าเริ่มต้นที่ปลอดภัยที่สุด (ไม่มีการเปิดเผยต่อสาธารณะ)
- ยอมรับ `ws://` แบบข้อความธรรมดาสำหรับโฮสต์ loopback, ส่วนตัว/LAN (RFC 1918), link-local, CGNAT, `.local` และ `.ts.net` โฮสต์ระยะไกลสาธารณะต้องใช้ `wss://`
- **การผูกที่ไม่ใช่ loopback** (`lan`/`tailnet`/`custom` หรือ `auto` เมื่อใช้งาน loopback ไม่ได้) ต้องใช้การยืนยันตัวตนของ Gateway ได้แก่ โทเค็น รหัสผ่าน หรือพร็อกซีย้อนกลับที่รับรู้ข้อมูลประจำตัวร่วมกับ `gateway.auth.mode: "trusted-proxy"`
- `gateway.remote.token` / `.password` เป็นแหล่งข้อมูลประจำตัวของไคลเอนต์ โดยไม่ได้กำหนดค่าการยืนยันตัวตนของเซิร์ฟเวอร์ด้วยตัวมันเอง
- เส้นทางการเรียกภายในเครื่องสามารถใช้ `gateway.remote.*` เป็นทางเลือกสำรองได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
- หากกำหนดค่า `gateway.auth.token` / `gateway.auth.password` อย่างชัดเจนผ่าน SecretRef แต่ไม่สามารถแก้ไขค่าได้ การแก้ไขค่าจะล้มเหลวแบบปิดกั้น (ไม่มีทางเลือกสำรองระยะไกลมาปกปิดข้อผิดพลาด)
- `gateway.remote.tlsFingerprint` จะตรึงใบรับรอง TLS ระยะไกลสำหรับ `wss://` รวมถึงโหมดโดยตรงของ macOS หากไม่มีลายนิ้วมือที่บันทึกไว้ macOS จะตรึงเฉพาะเมื่อใช้งานครั้งแรกหลังจากผ่านการตรวจสอบความเชื่อถือของระบบตามปกติแล้ว Gateway ที่ใช้ใบรับรองที่ลงนามด้วยตนเองหรือ CA ส่วนตัวต้องระบุลายนิ้วมืออย่างชัดเจน หรือใช้การเชื่อมต่อระยะไกลผ่าน SSH
- **Tailscale Serve** สามารถยืนยันตัวตนการรับส่งข้อมูลของ UI ควบคุม/WebSocket ผ่านส่วนหัวข้อมูลประจำตัวเมื่อ `gateway.auth.allowTailscale: true` ปลายทาง HTTP API ไม่ใช้การยืนยันตัวตนผ่านส่วนหัวดังกล่าว แต่จะใช้โหมดการยืนยันตัวตน HTTP ตามปกติของ Gateway แทน กระบวนการที่ไม่ใช้โทเค็นนี้ถือว่าโฮสต์ Gateway เชื่อถือได้ ให้ตั้งค่าเป็น `false` เพื่อใช้การยืนยันตัวตนด้วยข้อมูลลับร่วมกันทุกแห่ง
- การยืนยันตัวตนแบบ **พร็อกซีที่เชื่อถือได้** คาดหวังพร็อกซีที่รับรู้ข้อมูลประจำตัวและไม่ใช่ loopback โดยค่าเริ่มต้น พร็อกซีย้อนกลับแบบ loopback บนโฮสต์เดียวกันต้องเปิดใช้อย่างชัดเจนด้วย `gateway.auth.trustedProxy.allowLoopback = true`
- ปฏิบัติต่อการควบคุมผ่านเบราว์เซอร์เสมือนเป็นการเข้าถึงของผู้ควบคุมระบบ: จำกัดเฉพาะ tailnet และจับคู่ Node อย่างตั้งใจ

เจาะลึก: [ความปลอดภัย](/th/gateway/security)

### macOS: อุโมงค์ SSH แบบถาวรผ่าน LaunchAgent

สำหรับไคลเอนต์ macOS การตั้งค่าแบบถาวรที่ง่ายที่สุดใช้รายการกำหนดค่า SSH `LocalForward` ร่วมกับ LaunchAgent ซึ่งช่วยให้อุโมงค์ทำงานต่อเนื่องเมื่อรีบูตหรือเกิดข้อขัดข้อง

#### ขั้นตอนที่ 1: เพิ่มการกำหนดค่า SSH

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

#### ขั้นตอนที่ 3: กำหนดค่าโทเค็นของ Gateway

```bash
openclaw config set gateway.remote.token "<your-token>"
```

ใช้ `gateway.remote.password` แทน หาก Gateway ระยะไกลใช้การยืนยันตัวตนด้วยรหัสผ่าน `OPENCLAW_GATEWAY_TOKEN` ยังคงใช้เป็นค่าที่แทนที่ในระดับเชลล์ได้ แต่การตั้งค่าไคลเอนต์ระยะไกลแบบถาวรคือ `gateway.remote.token` / `gateway.remote.password`

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

อุโมงค์จะเริ่มทำงานโดยอัตโนมัติเมื่อเข้าสู่ระบบ เริ่มใหม่เมื่อเกิดข้อขัดข้อง และคงพอร์ตที่ส่งต่อไว้ให้ใช้งานได้

<Note>
หากคุณมี LaunchAgent `com.openclaw.ssh-tunnel` ที่หลงเหลือจากการตั้งค่าเก่า ให้ยกเลิกการโหลดและลบออก
</Note>

#### การแก้ไขปัญหา

```bash
# ตรวจสอบว่าอุโมงค์กำลังทำงานอยู่หรือไม่
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789

# เริ่มอุโมงค์ใหม่
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel

# หยุดอุโมงค์
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| รายการกำหนดค่า                         | การทำงาน                                                 |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | ส่งต่อพอร์ตภายในเครื่อง 18789 ไปยังพอร์ตระยะไกล 18789               |
| `ssh -N`                             | ใช้ SSH โดยไม่เรียกใช้คำสั่งระยะไกล (ส่งต่อพอร์ตเท่านั้น) |
| `KeepAlive`                          | เริ่มอุโมงค์ใหม่โดยอัตโนมัติหากเกิดข้อขัดข้อง              |
| `RunAtLoad`                          | เริ่มอุโมงค์เมื่อ LaunchAgent โหลดขณะเข้าสู่ระบบ        |

## เนื้อหาที่เกี่ยวข้อง

- [Tailscale](/th/gateway/tailscale)
- [การยืนยันตัวตน](/th/gateway/authentication)
- [การตั้งค่า Gateway ระยะไกล](/th/gateway/remote-gateway-readme)
