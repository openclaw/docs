---
read_when:
    - การติดตั้งใช้งานหรือเปลี่ยนแปลงการค้นหา/การประกาศผ่าน Bonjour
    - การปรับโหมดการเชื่อมต่อระยะไกล (direct เทียบกับ SSH)
    - การออกแบบการค้นหา Node + การจับคู่สำหรับ Node ระยะไกล
summary: การค้นหา Node และ transport (Bonjour, Tailscale, SSH) สำหรับการค้นหา gateway
title: การค้นหาและ transport
x-i18n:
    generated_at: "2026-04-26T11:29:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 615be0f501470772c257beb8e798c522c108b09081a603f44218404277fdf269
    source_path: gateway/discovery.md
    workflow: 15
---

# การค้นหาและ transport

OpenClaw มีปัญหาสองอย่างที่ดูคล้ายกันในระดับผิวเผิน แต่จริง ๆ แล้วต่างกัน:

1. **การควบคุมระยะไกลของโอเปอเรเตอร์**: แอปเมนูบาร์บน macOS ควบคุม gateway ที่รันอยู่ที่อื่น
2. **การจับคู่ Node**: iOS/Android (และ Node ในอนาคต) ค้นหา gateway และจับคู่อย่างปลอดภัย

เป้าหมายของการออกแบบคือให้การค้นหา/การประกาศผ่านเครือข่ายทั้งหมดอยู่ใน **Node Gateway** (`openclaw gateway`) และให้ไคลเอนต์ (แอป Mac, iOS) เป็นเพียงผู้ใช้ข้อมูลเหล่านั้น

## คำศัพท์

- **Gateway**: โปรเซส gateway แบบ long-running หนึ่งตัวที่เป็นเจ้าของสถานะ (sessions, pairing, node registry) และรันช่องทางต่าง ๆ การติดตั้งส่วนใหญ่ใช้หนึ่งตัวต่อหนึ่งโฮสต์; การติดตั้งแบบหลาย gateway ที่แยกขาดกันก็เป็นไปได้
- **Gateway WS (control plane)**: ปลายทาง WebSocket ที่ค่าเริ่มต้นอยู่บน `127.0.0.1:18789`; สามารถ bind ไปยัง LAN/tailnet ผ่าน `gateway.bind`
- **Direct WS transport**: ปลายทาง Gateway WS ที่หันออกสู่ LAN/tailnet (ไม่ใช้ SSH)
- **SSH transport (fallback)**: การควบคุมระยะไกลโดย forward `127.0.0.1:18789` ผ่าน SSH
- **Legacy TCP bridge (ถูกถอดออกแล้ว)**: transport ของ Node รุ่นเก่า (ดู [Bridge protocol](/th/gateway/bridge-protocol)); ไม่มีการประกาศเพื่อการค้นหาอีกต่อไป และไม่เป็นส่วนหนึ่งของบิลด์ปัจจุบันแล้ว

รายละเอียดโปรโตคอล:

- [Gateway protocol](/th/gateway/protocol)
- [Bridge protocol (legacy)](/th/gateway/bridge-protocol)

## เหตุผลที่เรายังเก็บทั้ง direct และ SSH

- **Direct WS** ให้ UX ที่ดีที่สุดบนเครือข่ายเดียวกันและภายใน tailnet:
  - ค้นหาอัตโนมัติบน LAN ผ่าน Bonjour
  - โทเค็น pairing + ACLs ถูกดูแลโดย gateway
  - ไม่ต้องมี shell access; พื้นผิวของโปรโตคอลยังคงแคบและตรวจสอบได้
- **SSH** ยังคงเป็น fallback ที่ใช้ได้ในทุกกรณี:
  - ใช้งานได้ทุกที่ที่คุณมี SSH access (แม้ข้ามเครือข่ายที่ไม่เกี่ยวข้องกัน)
  - ทนต่อปัญหา multicast/mDNS
  - ไม่ต้องเปิดพอร์ตขาเข้าใหม่เพิ่มเติมนอกจาก SSH

## อินพุตของการค้นหา (ไคลเอนต์รู้ได้อย่างไรว่ามี gateway อยู่ที่ไหน)

### 1) การค้นหา Bonjour / DNS-SD

Bonjour แบบ multicast เป็นแบบ best-effort และไม่ข้ามเครือข่าย OpenClaw ยังสามารถ browse beacon ของ gateway เดียวกันผ่านโดเมน wide-area DNS-SD ที่กำหนดไว้ได้ด้วย ดังนั้นการค้นหาจึงครอบคลุมได้ทั้ง:

- `local.` บน LAN เดียวกัน
- โดเมน unicast DNS-SD ที่กำหนดไว้สำหรับการค้นหาข้ามเครือข่าย

ทิศทางเป้าหมาย:

- **gateway** จะประกาศปลายทาง WS ของมันผ่าน Bonjour
- ไคลเอนต์จะ browse และแสดงรายการ “เลือก gateway” จากนั้นเก็บปลายทางที่เลือกไว้

รายละเอียด beacon และการแก้ไขปัญหา: [Bonjour](/th/gateway/bonjour)

#### รายละเอียดของ service beacon

- ประเภทบริการ:
  - `_openclaw-gw._tcp` (beacon transport ของ gateway)
- คีย์ TXT (ไม่เป็นความลับ):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (ชื่อที่กำหนดโดยโอเปอเรเตอร์)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (เฉพาะเมื่อเปิดใช้ TLS)
  - `gatewayTlsSha256=<sha256>` (เฉพาะเมื่อเปิดใช้ TLS และมี fingerprint)
  - `canvasPort=<port>` (พอร์ตของ canvas host; ปัจจุบันเป็นพอร์ตเดียวกับ `gatewayPort` เมื่อเปิดใช้ canvas host)
  - `tailnetDns=<magicdns>` (hint แบบไม่บังคับ; ตรวจจับอัตโนมัติเมื่อมี Tailscale)
  - `sshPort=<port>` (เฉพาะโหมด mDNS แบบเต็ม; wide-area DNS-SD อาจละไว้ ซึ่งในกรณีนั้นจะใช้ค่าเริ่มต้นของ SSH คือ `22`)
  - `cliPath=<path>` (เฉพาะโหมด mDNS แบบเต็ม; wide-area DNS-SD ยังเขียนค่าไว้เป็น hint สำหรับการติดตั้งระยะไกล)

หมายเหตุด้านความปลอดภัย:

- TXT record ของ Bonjour/mDNS เป็น **ข้อมูลที่ไม่ผ่านการยืนยันตัวตน** ไคลเอนต์ต้องถือว่าค่า TXT เป็นเพียง hint สำหรับ UX เท่านั้น
- การกำหนดเส้นทาง (host/port) ควรให้ความสำคัญกับ **service endpoint ที่ resolve แล้ว** (SRV + A/AAAA) มากกว่าค่า `lanHost`, `tailnetDns` หรือ `gatewayPort` ที่มาจาก TXT
- TLS pinning ต้องไม่ยอมให้ `gatewayTlsSha256` ที่ถูกประกาศมาทับ pin ที่เคยเก็บไว้ก่อนหน้า
- Node ของ iOS/Android ควรบังคับให้มีการยืนยัน “เชื่อถือ fingerprint นี้” แบบชัดเจนก่อนเก็บ pin ครั้งแรก (การยืนยันนอกแบนด์) เมื่อเส้นทางที่เลือกเป็นแบบ secure/TLS

ปิดใช้งาน/แทนที่:

- `OPENCLAW_DISABLE_BONJOUR=1` ปิดการประกาศ
- Docker Compose ใช้ค่าเริ่มต้น `OPENCLAW_DISABLE_BONJOUR=1` เพราะ bridge network
  มักไม่พา mDNS multicast ได้อย่างน่าเชื่อถือ; ใช้ `0` เฉพาะบน host, macvlan
  หรือเครือข่ายอื่นที่รองรับ mDNS เท่านั้น
- `gateway.bind` ใน `~/.openclaw/openclaw.json` ควบคุมโหมด bind ของ Gateway
- `OPENCLAW_SSH_PORT` ใช้แทนพอร์ต SSH ที่ประกาศเมื่อมีการส่ง `sshPort`
- `OPENCLAW_TAILNET_DNS` ใช้เผยแพร่ hint `tailnetDns` (MagicDNS)
- `OPENCLAW_CLI_PATH` ใช้แทน CLI path ที่ประกาศ

### 2) Tailnet (ข้ามเครือข่าย)

สำหรับการติดตั้งแบบ London/Vienna, Bonjour จะไม่ช่วย เป้าหมาย direct ที่แนะนำคือ:

- ชื่อ Tailscale MagicDNS (แนะนำ) หรือ tailnet IP แบบคงที่

หาก gateway สามารถตรวจพบว่ากำลังรันภายใต้ Tailscale มันจะเผยแพร่ `tailnetDns` เป็น hint แบบไม่บังคับสำหรับไคลเอนต์ (รวมถึง wide-area beacon)

ตอนนี้แอป macOS จะให้ความสำคัญกับชื่อ MagicDNS มากกว่า Tailscale IP แบบดิบสำหรับการค้นหา gateway ซึ่งช่วยเพิ่มความน่าเชื่อถือเมื่อ tailnet IP เปลี่ยน (เช่น หลังรีสตาร์ต Node หรือมีการเปลี่ยน CGNAT) เพราะชื่อ MagicDNS จะ resolve ไปยัง IP ปัจจุบันโดยอัตโนมัติ

สำหรับการจับคู่ Node บนมือถือ discovery hint จะไม่ทำให้ความปลอดภัยของ transport ผ่อนคลายลงบนเส้นทาง tailnet/สาธารณะ:

- iOS/Android ยังคงต้องใช้เส้นทางเชื่อมต่อครั้งแรกที่ปลอดภัยบน tailnet/สาธารณะ (`wss://` หรือ Tailscale Serve/Funnel)
- tailnet IP ดิบที่ถูกค้นพบเป็นเพียง hint สำหรับการกำหนดเส้นทาง ไม่ใช่การอนุญาตให้ใช้ `ws://` ระยะไกลแบบ plaintext
- `ws://` แบบ direct-connect บน Private LAN ยังคงรองรับ
- หากคุณต้องการเส้นทาง Tailscale ที่ง่ายที่สุดสำหรับ Node บนมือถือ ให้ใช้ Tailscale Serve เพื่อให้ทั้ง discovery และ setup code resolve ไปยังปลายทาง MagicDNS ที่ปลอดภัยเดียวกัน

### 3) เป้าหมายแบบกำหนดเอง / SSH

เมื่อไม่มีเส้นทาง direct (หรือปิด direct ไว้) ไคลเอนต์ยังสามารถเชื่อมต่อผ่าน SSH ได้เสมอโดย forward พอร์ต loopback ของ gateway

ดู [การเข้าถึงระยะไกล](/th/gateway/remote)

## การเลือก transport (นโยบายฝั่งไคลเอนต์)

พฤติกรรมฝั่งไคลเอนต์ที่แนะนำ:

1. หากมี direct endpoint ที่จับคู่ไว้และเข้าถึงได้ ให้ใช้สิ่งนั้น
2. มิฉะนั้น หากการค้นหาพบ gateway บน `local.` หรือโดเมน wide-area ที่กำหนดไว้ ให้เสนอทางเลือก “ใช้ gateway นี้” แบบแตะครั้งเดียว แล้วบันทึกไว้เป็น direct endpoint
3. มิฉะนั้น หากมีการกำหนด tailnet DNS/IP ไว้ ให้ลอง direct
   สำหรับ Node บนมือถือบนเส้นทาง tailnet/สาธารณะ direct หมายถึงปลายทางที่ปลอดภัย ไม่ใช่ `ws://` ระยะไกลแบบ plaintext
4. มิฉะนั้น fallback ไปใช้ SSH

## Pairing + auth (direct transport)

gateway คือแหล่งข้อมูลจริงสำหรับการรับ Node/ไคลเอนต์เข้าสู่ระบบ

- คำขอ pairing ถูกสร้าง/อนุมัติ/ปฏิเสธใน gateway (ดู [Gateway pairing](/th/gateway/pairing))
- gateway เป็นผู้บังคับใช้:
  - auth (token / keypair)
  - scopes/ACLs (gateway ไม่ใช่ raw proxy ที่เข้าถึงได้ทุกเมธอด)
  - rate limit

## ความรับผิดชอบตามองค์ประกอบ

- **Gateway**: ประกาศ discovery beacon, เป็นเจ้าของการตัดสินใจ pairing และโฮสต์ปลายทาง WS
- **แอป macOS**: ช่วยคุณเลือก gateway, แสดงพรอมป์ pairing และใช้ SSH เฉพาะเป็น fallback
- **Node ของ iOS/Android**: browse Bonjour เพื่อความสะดวก และเชื่อมต่อไปยัง Gateway WS ที่จับคู่ไว้

## ที่เกี่ยวข้อง

- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [Tailscale](/th/gateway/tailscale)
- [การค้นหา Bonjour](/th/gateway/bonjour)
