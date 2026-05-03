---
read_when:
    - การนำการค้นพบบริการ/การประกาศบริการของ Bonjour ไปใช้หรือการเปลี่ยนแปลง
    - การปรับโหมดการเชื่อมต่อระยะไกล (direct เทียบกับ SSH)
    - การออกแบบการค้นพบ Node + การจับคู่สำหรับ Node ระยะไกล
summary: การค้นพบ Node และทรานสปอร์ต (Bonjour, Tailscale, SSH) สำหรับค้นหา Gateway
title: การค้นพบและทรานสปอร์ต
x-i18n:
    generated_at: "2026-05-03T21:32:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41a5ed7a910ae4bbdfa21a81882c3b1af0c16622fa20a5e616b666390dccdc9c
    source_path: gateway/discovery.md
    workflow: 16
---

# Discovery และ transports

OpenClaw มีปัญหาสองอย่างที่ดูคล้ายกันเมื่อมองผิวเผิน:

1. **การควบคุมระยะไกลของผู้ปฏิบัติการ**: แอปแถบเมนู macOS ที่ควบคุม Gateway ซึ่งทำงานอยู่ที่อื่น
2. **การจับคู่ Node**: iOS/Android (และ Node ในอนาคต) ค้นหา Gateway และจับคู่อย่างปลอดภัย

เป้าหมายการออกแบบคือเก็บการค้นหา/การประกาศบนเครือข่ายทั้งหมดไว้ใน **Node Gateway** (`openclaw gateway`) และให้ไคลเอนต์ (แอป Mac, iOS) เป็นผู้ใช้งาน

## คำศัพท์

- **Gateway**: โปรเซส Gateway ที่ทำงานระยะยาวเพียงตัวเดียว ซึ่งเป็นเจ้าของสถานะ (เซสชัน, การจับคู่, รีจิสทรี Node) และรันช่องทาง การตั้งค่าส่วนใหญ่ใช้หนึ่งตัวต่อโฮสต์; การตั้งค่าแบบหลาย Gateway ที่แยกกันก็ทำได้
- **Gateway WS (control plane)**: เอนด์พอยต์ WebSocket บน `127.0.0.1:18789` ตามค่าเริ่มต้น; สามารถผูกกับ LAN/tailnet ผ่าน `gateway.bind`
- **Direct WS transport**: เอนด์พอยต์ Gateway WS ที่เปิดให้ LAN/tailnet เข้าถึงได้ (ไม่มี SSH)
- **SSH transport (fallback)**: การควบคุมระยะไกลโดยส่งต่อ `127.0.0.1:18789` ผ่าน SSH
- **Legacy TCP bridge (เอาออกแล้ว)**: transport ของ Node แบบเก่า (ดู
  [โปรโตคอล Bridge](/th/gateway/bridge-protocol)); ไม่ประกาศสำหรับ
  การค้นหาอีกต่อไป และไม่เป็นส่วนหนึ่งของบิลด์ปัจจุบันแล้ว

รายละเอียดโปรโตคอล:

- [โปรโตคอล Gateway](/th/gateway/protocol)
- [โปรโตคอล Bridge (legacy)](/th/gateway/bridge-protocol)

## ทำไมเรายังคงมีทั้ง "direct" และ SSH

- **Direct WS** ให้ UX ที่ดีที่สุดบนเครือข่ายเดียวกันและภายใน tailnet:
  - ค้นหาอัตโนมัติบน LAN ผ่าน Bonjour
  - โทเค็นการจับคู่ + ACL ที่ Gateway เป็นเจ้าของ
  - ไม่ต้องมีสิทธิ์เข้าถึงเชลล์; พื้นผิวโปรโตคอลจึงยังคงแคบและตรวจสอบได้
- **SSH** ยังคงเป็น fallback สากล:
  - ใช้ได้ทุกที่ที่คุณมีสิทธิ์เข้าถึง SSH (แม้ข้ามเครือข่ายที่ไม่เกี่ยวข้องกัน)
  - ทนต่อปัญหา multicast/mDNS
  - ไม่ต้องเปิดพอร์ตขาเข้าใหม่ นอกจาก SSH

## อินพุตการค้นหา (ไคลเอนต์รู้ได้อย่างไรว่า Gateway อยู่ที่ไหน)

### 1) การค้นหา Bonjour / DNS-SD

Bonjour แบบ multicast เป็นแบบ best-effort และไม่ข้ามเครือข่าย OpenClaw ยังสามารถเรียกดู beacon ของ Gateway เดียวกันผ่านโดเมน DNS-SD แบบ wide-area ที่กำหนดค่าไว้ได้ ดังนั้นการค้นหาจึงครอบคลุมได้:

- `local.` บน LAN เดียวกัน
- โดเมน unicast DNS-SD ที่กำหนดค่าไว้สำหรับการค้นหาข้ามเครือข่าย

ทิศทางเป้าหมาย:

- **Gateway** ประกาศเอนด์พอยต์ WS ของตัวเองผ่าน Bonjour เมื่อเปิดใช้
  Plugin `bonjour` ที่รวมมา Plugin จะเริ่มอัตโนมัติบนโฮสต์ macOS และ
  ต้องเลือกเปิดใช้เองที่อื่น
- ไคลเอนต์เรียกดูและแสดงรายการ “เลือก Gateway” จากนั้นเก็บเอนด์พอยต์ที่เลือกไว้

รายละเอียดการแก้ปัญหาและ beacon: [Bonjour](/th/gateway/bonjour)

#### รายละเอียด service beacon

- ประเภทบริการ:
  - `_openclaw-gw._tcp` (beacon transport ของ Gateway)
- คีย์ TXT (ไม่ใช่ความลับ):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (ชื่อแสดงผลที่ผู้ปฏิบัติการกำหนดค่า)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (เฉพาะเมื่อเปิดใช้ TLS)
  - `gatewayTlsSha256=<sha256>` (เฉพาะเมื่อเปิดใช้ TLS และมี fingerprint)
  - `canvasPort=<port>` (พอร์ตโฮสต์ canvas; ปัจจุบันเหมือนกับ `gatewayPort` เมื่อเปิดใช้โฮสต์ canvas)
  - `tailnetDns=<magicdns>` (คำใบ้เสริม; ตรวจพบอัตโนมัติเมื่อมี Tailscale)
  - `sshPort=<port>` (เฉพาะโหมด mDNS full; wide-area DNS-SD อาจละไว้ ซึ่งในกรณีนั้นค่าเริ่มต้น SSH จะยังเป็น `22`)
  - `cliPath=<path>` (เฉพาะโหมด mDNS full; wide-area DNS-SD ยังคงเขียนค่านี้เป็นคำใบ้ remote-install)

หมายเหตุด้านความปลอดภัย:

- ระเบียน TXT ของ Bonjour/mDNS **ไม่ได้ผ่านการยืนยันตัวตน** ไคลเอนต์ต้องถือว่าค่า TXT เป็นเพียงคำใบ้ UX เท่านั้น
- การกำหนดเส้นทาง (โฮสต์/พอร์ต) ควรเลือกใช้ **เอนด์พอยต์บริการที่ resolve แล้ว** (SRV + A/AAAA) ก่อน `lanHost`, `tailnetDns`, หรือ `gatewayPort` ที่มาจาก TXT
- TLS pinning ต้องไม่อนุญาตให้ `gatewayTlsSha256` ที่ประกาศมาเขียนทับ pin ที่เคยเก็บไว้ก่อนหน้า
- Node iOS/Android ควรกำหนดให้มีการยืนยัน “เชื่อถือ fingerprint นี้” อย่างชัดเจนก่อนเก็บ pin ครั้งแรก (การตรวจสอบนอกแบนด์) ทุกครั้งที่เส้นทางที่เลือกเป็นแบบปลอดภัย/ใช้ TLS

เปิดใช้/ปิดใช้/เขียนทับ:

- `openclaw plugins enable bonjour` เปิดใช้การประกาศแบบ LAN multicast
- `OPENCLAW_DISABLE_BONJOUR=1` ปิดใช้การประกาศ
- เมื่อเปิดใช้ Plugin Bonjour และไม่ได้ตั้งค่า `OPENCLAW_DISABLE_BONJOUR`
  Bonjour จะประกาศบนโฮสต์ปกติและปิดใช้อัตโนมัติภายในคอนเทนเนอร์ที่ตรวจพบ
  การเริ่มต้น Gateway บน macOS ที่มีคอนฟิกว่างจะเปิดใช้ Plugin โดยอัตโนมัติ; การปรับใช้บน Linux,
  Windows และคอนเทนเนอร์ต้องเปิดใช้อย่างชัดเจน
  ใช้ `0` เฉพาะบน host, macvlan หรือเครือข่ายอื่นที่รองรับ mDNS; ใช้ `1` เพื่อ
  บังคับปิด
- `gateway.bind` ใน `~/.openclaw/openclaw.json` ควบคุมโหมด bind ของ Gateway
- `OPENCLAW_SSH_PORT` เขียนทับพอร์ต SSH ที่ประกาศเมื่อมีการส่งออก `sshPort`
- `OPENCLAW_TAILNET_DNS` เผยแพร่คำใบ้ `tailnetDns` (MagicDNS)
- `OPENCLAW_CLI_PATH` เขียนทับพาธ CLI ที่ประกาศ

### 2) Tailnet (ข้ามเครือข่าย)

สำหรับการตั้งค่าแบบ London/Vienna, Bonjour จะช่วยไม่ได้ เป้าหมาย “direct” ที่แนะนำคือ:

- ชื่อ Tailscale MagicDNS (แนะนำ) หรือ IP tailnet ที่เสถียร

ถ้า Gateway ตรวจพบว่ากำลังทำงานภายใต้ Tailscale จะเผยแพร่ `tailnetDns` เป็นคำใบ้เสริมสำหรับไคลเอนต์ (รวมถึง beacon แบบ wide-area)

ตอนนี้แอป macOS จะเลือกใช้ชื่อ MagicDNS ก่อน IP ดิบของ Tailscale สำหรับการค้นหา Gateway วิธีนี้เพิ่มความเชื่อถือได้เมื่อ IP ของ tailnet เปลี่ยน (เช่น หลังรีสตาร์ต Node หรือมีการกำหนดใหม่จาก CGNAT) เพราะชื่อ MagicDNS จะ resolve ไปยัง IP ปัจจุบันโดยอัตโนมัติ

สำหรับการจับคู่ Node บนมือถือ คำใบ้การค้นหาไม่ได้ผ่อนปรนความปลอดภัยของ transport บนเส้นทาง tailnet/public:

- iOS/Android ยังคงต้องใช้เส้นทางเชื่อมต่อ tailnet/public ครั้งแรกที่ปลอดภัย (`wss://` หรือ Tailscale Serve/Funnel)
- IP ดิบของ tailnet ที่ค้นพบเป็นคำใบ้การกำหนดเส้นทาง ไม่ใช่อนุญาตให้ใช้ `ws://` ระยะไกลแบบ plaintext
- ยังคงรองรับการเชื่อมต่อ direct บน LAN ส่วนตัวผ่าน `ws://`
- ถ้าคุณต้องการเส้นทาง Tailscale ที่ง่ายที่สุดสำหรับ Node มือถือ ให้ใช้ Tailscale Serve เพื่อให้ทั้งการค้นหาและโค้ดตั้งค่า resolve ไปยังเอนด์พอยต์ MagicDNS ที่ปลอดภัยเดียวกัน

### 3) เป้าหมายแบบ Manual / SSH

เมื่อไม่มีเส้นทาง direct (หรือปิดใช้ direct) ไคลเอนต์สามารถเชื่อมต่อผ่าน SSH ได้เสมอโดยส่งต่อพอร์ต Gateway บน loopback

ดู [การเข้าถึงระยะไกล](/th/gateway/remote)

## การเลือก transport (นโยบายไคลเอนต์)

พฤติกรรมไคลเอนต์ที่แนะนำ:

1. ถ้ามีการกำหนดค่าเอนด์พอยต์ direct ที่จับคู่ไว้และเข้าถึงได้ ให้ใช้เอนด์พอยต์นั้น
2. ไม่เช่นนั้น ถ้าการค้นหาพบ Gateway บน `local.` หรือโดเมน wide-area ที่กำหนดค่าไว้ ให้เสนอทางเลือก “ใช้ Gateway นี้” แบบแตะครั้งเดียว และบันทึกเป็นเอนด์พอยต์ direct
3. ไม่เช่นนั้น ถ้ามีการกำหนดค่า DNS/IP ของ tailnet ไว้ ให้ลอง direct
   สำหรับ Node มือถือบนเส้นทาง tailnet/public, direct หมายถึงเอนด์พอยต์ที่ปลอดภัย ไม่ใช่ `ws://` ระยะไกลแบบ plaintext
4. ไม่เช่นนั้น ให้ fallback ไปใช้ SSH

## การจับคู่ + auth (direct transport)

Gateway เป็นแหล่งข้อมูลจริงสำหรับการอนุญาต Node/ไคลเอนต์

- คำขอจับคู่ถูกสร้าง/อนุมัติ/ปฏิเสธใน Gateway (ดู [การจับคู่ Gateway](/th/gateway/pairing))
- Gateway บังคับใช้:
  - auth (token / keypair)
  - scopes/ACLs (Gateway ไม่ใช่ raw proxy ไปยังทุกเมธอด)
  - rate limits

## ความรับผิดชอบตามคอมโพเนนต์

- **Gateway**: ประกาศ beacon การค้นหา เป็นเจ้าของการตัดสินใจจับคู่ และโฮสต์เอนด์พอยต์ WS
- **แอป macOS**: ช่วยคุณเลือก Gateway แสดงพรอมป์การจับคู่ และใช้ SSH เป็น fallback เท่านั้น
- **Node iOS/Android**: เรียกดู Bonjour เพื่อความสะดวกและเชื่อมต่อกับ Gateway WS ที่จับคู่ไว้

## ที่เกี่ยวข้อง

- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [Tailscale](/th/gateway/tailscale)
- [การค้นหา Bonjour](/th/gateway/bonjour)
