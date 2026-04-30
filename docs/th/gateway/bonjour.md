---
read_when:
    - การแก้ไขปัญหาการค้นหา Bonjour บน macOS/iOS
    - การเปลี่ยนประเภทบริการ mDNS, ระเบียน TXT หรือประสบการณ์ผู้ใช้ในการค้นพบ
summary: การค้นพบ Bonjour/mDNS + การดีบัก (บีคอน Gateway, ไคลเอนต์ และรูปแบบความล้มเหลวที่พบบ่อย)
title: การค้นพบ Bonjour
x-i18n:
    generated_at: "2026-04-30T09:50:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0720451843aae0509949324e51f3a23dc69e366e68de851c595ce76c8ab0eec9
    source_path: gateway/bonjour.md
    workflow: 16
---

# การค้นพบ Bonjour / mDNS

OpenClaw ใช้ Bonjour (mDNS / DNS‑SD) เพื่อค้นหา Gateway ที่ใช้งานอยู่ (ปลายทาง WebSocket)
การเรียกดู multicast `local.` เป็น **ความสะดวกที่ใช้ได้เฉพาะ LAN** เท่านั้น Plugin `bonjour`
ที่มาพร้อมกันเป็นเจ้าของการประกาศบน LAN และเปิดใช้งานตามค่าเริ่มต้น สำหรับการค้นพบข้ามเครือข่าย
สามารถเผยแพร่สัญญาณ beacon เดียวกันผ่านโดเมน DNS-SD แบบพื้นที่กว้างที่กำหนดค่าไว้ได้ด้วย
การค้นพบยังคงเป็นแบบพยายามให้ดีที่สุด และ **ไม่** แทนที่การเชื่อมต่อผ่าน SSH หรือ Tailnet

## Bonjour แบบพื้นที่กว้าง (Unicast DNS-SD) ผ่าน Tailscale

ถ้าโหนดและ gateway อยู่คนละเครือข่าย multicast mDNS จะไม่ข้าม
ขอบเขตนั้น คุณสามารถคงประสบการณ์การค้นพบแบบเดิมไว้ได้โดยเปลี่ยนไปใช้ **unicast DNS‑SD**
("Bonjour แบบพื้นที่กว้าง") ผ่าน Tailscale

ขั้นตอนระดับสูง:

1. รันเซิร์ฟเวอร์ DNS บนโฮสต์ gateway (เข้าถึงได้ผ่าน Tailnet)
2. เผยแพร่ระเบียน DNS‑SD สำหรับ `_openclaw-gw._tcp` ใต้โซนเฉพาะ
   (ตัวอย่าง: `openclaw.internal.`)
3. กำหนดค่า **split DNS** ของ Tailscale เพื่อให้โดเมนที่คุณเลือก resolve ผ่าน
   เซิร์ฟเวอร์ DNS นั้นสำหรับไคลเอนต์ (รวมถึง iOS)

OpenClaw รองรับโดเมนการค้นพบใดก็ได้; `openclaw.internal.` เป็นเพียงตัวอย่าง
โหนด iOS/Android จะเรียกดูทั้ง `local.` และโดเมนพื้นที่กว้างที่คุณกำหนดค่าไว้

### การกำหนดค่า Gateway (แนะนำ)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### การตั้งค่าเซิร์ฟเวอร์ DNS ครั้งเดียว (โฮสต์ gateway)

```bash
openclaw dns setup --apply
```

คำสั่งนี้ติดตั้ง CoreDNS และกำหนดค่าให้:

- ฟังบนพอร์ต 53 เฉพาะบนอินเทอร์เฟซ Tailscale ของ gateway
- ให้บริการโดเมนที่คุณเลือก (ตัวอย่าง: `openclaw.internal.`) จาก `~/.openclaw/dns/<domain>.db`

ตรวจสอบจากเครื่องที่เชื่อมต่อกับ tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### การตั้งค่า DNS ของ Tailscale

ในคอนโซลผู้ดูแลระบบ Tailscale:

- เพิ่ม nameserver ที่ชี้ไปยัง IP tailnet ของ gateway (UDP/TCP 53)
- เพิ่ม split DNS เพื่อให้โดเมนการค้นพบของคุณใช้ nameserver นั้น

เมื่อไคลเอนต์ยอมรับ DNS ของ tailnet แล้ว โหนด iOS และการค้นพบของ CLI จะสามารถเรียกดู
`_openclaw-gw._tcp` ในโดเมนการค้นพบของคุณได้โดยไม่ต้องใช้ multicast

### ความปลอดภัยของตัวรับฟัง Gateway (แนะนำ)

พอร์ต WS ของ Gateway (ค่าเริ่มต้น `18789`) จะ bind กับ loopback ตามค่าเริ่มต้น สำหรับการเข้าถึงผ่าน LAN/tailnet
ให้ bind อย่างชัดเจนและเปิด auth ไว้

สำหรับการตั้งค่าที่ใช้เฉพาะ tailnet:

- ตั้งค่า `gateway.bind: "tailnet"` ใน `~/.openclaw/openclaw.json`
- รีสตาร์ท Gateway (หรือรีสตาร์ทแอปแถบเมนู macOS)

## สิ่งที่ประกาศ

เฉพาะ Gateway เท่านั้นที่ประกาศ `_openclaw-gw._tcp` การประกาศ multicast บน LAN
จัดให้โดย Plugin `bonjour` ที่มาพร้อมกัน; การเผยแพร่ DNS-SD แบบพื้นที่กว้างยังคงเป็นของ
Gateway

## ประเภทบริการ

- `_openclaw-gw._tcp` — beacon สำหรับการขนส่งของ gateway (ใช้โดยโหนด macOS/iOS/Android)

## คีย์ TXT (คำใบ้ที่ไม่เป็นความลับ)

Gateway ประกาศคำใบ้ขนาดเล็กที่ไม่เป็นความลับเพื่อให้โฟลว์ UI สะดวกขึ้น:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (เฉพาะเมื่อเปิดใช้งาน TLS)
- `gatewayTlsSha256=<sha256>` (เฉพาะเมื่อเปิดใช้งาน TLS และมี fingerprint)
- `canvasPort=<port>` (เฉพาะเมื่อเปิดใช้งานโฮสต์ canvas; ปัจจุบันเหมือนกับ `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (เฉพาะโหมด mDNS เต็มรูปแบบ, เป็นคำใบ้เสริมเมื่อมี Tailnet)
- `sshPort=<port>` (เฉพาะโหมด mDNS เต็มรูปแบบ; DNS-SD แบบพื้นที่กว้างอาจไม่ใส่ค่านี้)
- `cliPath=<path>` (เฉพาะโหมด mDNS เต็มรูปแบบ; DNS-SD แบบพื้นที่กว้างยังคงเขียนค่านี้เป็นคำใบ้สำหรับการติดตั้งระยะไกล)

หมายเหตุด้านความปลอดภัย:

- ระเบียน TXT ของ Bonjour/mDNS **ไม่ได้ผ่านการตรวจสอบความถูกต้อง** ไคลเอนต์ต้องไม่ถือว่า TXT เป็นแหล่งอ้างอิงที่มีอำนาจสำหรับการกำหนดเส้นทาง
- ไคลเอนต์ควรกำหนดเส้นทางโดยใช้ปลายทางบริการที่ resolve ได้ (SRV + A/AAAA) ให้ถือว่า `lanHost`, `tailnetDns`, `gatewayPort`, และ `gatewayTlsSha256` เป็นเพียงคำใบ้เท่านั้น
- การกำหนดเป้าหมาย SSH อัตโนมัติควรใช้โฮสต์บริการที่ resolve ได้เช่นกัน ไม่ใช่คำใบ้จาก TXT เท่านั้น
- TLS pinning ต้องไม่อนุญาตให้ `gatewayTlsSha256` ที่ประกาศมาทับ pin ที่จัดเก็บไว้ก่อนหน้า
- โหนด iOS/Android ควรถือว่าการเชื่อมต่อโดยตรงที่อิงการค้นพบเป็น **TLS เท่านั้น** และต้องขอการยืนยันจากผู้ใช้อย่างชัดเจนก่อนเชื่อถือ fingerprint ครั้งแรก

## การดีบักบน macOS

เครื่องมือในตัวที่มีประโยชน์:

- เรียกดูอินสแตนซ์:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Resolve อินสแตนซ์หนึ่งรายการ (แทนที่ `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

ถ้าการเรียกดูทำงานแต่การ resolve ล้มเหลว โดยปกติคุณกำลังเจอนโยบาย LAN หรือ
ปัญหา resolver ของ mDNS

## การดีบักในบันทึก Gateway

Gateway เขียนไฟล์บันทึกแบบ rolling (พิมพ์ตอนเริ่มต้นเป็น
`gateway log file: ...`) ให้มองหาบรรทัด `bonjour:` โดยเฉพาะ:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour ใช้ hostname ของระบบสำหรับโฮสต์ `.local` ที่ประกาศเมื่อค่านั้นเป็น
ป้ายกำกับ DNS ที่ถูกต้อง ถ้า hostname ของระบบมีช่องว่าง ขีดล่าง หรืออักขระอื่น
ที่ไม่ถูกต้องสำหรับป้ายกำกับ DNS, OpenClaw จะ fallback ไปเป็น `openclaw.local` ตั้งค่า
`OPENCLAW_MDNS_HOSTNAME=<name>` ก่อนเริ่ม Gateway เมื่อคุณต้องการ
ป้ายกำกับโฮสต์อย่างชัดเจน

## การดีบักบนโหนด iOS

โหนด iOS ใช้ `NWBrowser` เพื่อค้นหา `_openclaw-gw._tcp`

เพื่อบันทึก log:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → ทำซ้ำปัญหา → **Copy**

บันทึกจะรวมการเปลี่ยนสถานะของ browser และการเปลี่ยนแปลงของชุดผลลัพธ์

## เมื่อใดควรปิดใช้งาน Bonjour

ปิดใช้งาน Bonjour เฉพาะเมื่อการประกาศ multicast บน LAN ไม่พร้อมใช้งานหรือก่อผลเสีย
กรณีทั่วไปคือ Gateway ที่รันอยู่หลัง Docker bridge networking, WSL หรือ
นโยบายเครือข่ายที่ทิ้ง multicast mDNS ในสภาพแวดล้อมเหล่านั้น Gateway
ยังคงเข้าถึงได้ผ่าน URL ที่เผยแพร่ไว้, SSH, Tailnet หรือ DNS-SD แบบพื้นที่กว้าง
แต่การค้นพบอัตโนมัติบน LAN ไม่น่าเชื่อถือ

ให้เลือกใช้ environment override ที่มีอยู่เมื่อปัญหาอยู่ในขอบเขต deployment:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

ค่านี้จะปิดการประกาศ multicast บน LAN โดยไม่เปลี่ยนการกำหนดค่า Plugin
ปลอดภัยสำหรับ Docker images, service files, launch scripts และการดีบักเฉพาะครั้ง
เพราะการตั้งค่านี้จะหายไปเมื่อ environment หายไป

ใช้การกำหนดค่า Plugin เฉพาะเมื่อคุณตั้งใจต้องการปิด
Plugin การค้นพบบน LAN ที่มาพร้อมกันสำหรับการกำหนดค่า OpenClaw นั้น:

```bash
openclaw plugins disable bonjour
```

## ข้อควรระวังของ Docker

Plugin Bonjour ที่มาพร้อมกันจะปิดการประกาศ multicast บน LAN อัตโนมัติในคอนเทนเนอร์
ที่ตรวจพบเมื่อไม่ได้ตั้งค่า `OPENCLAW_DISABLE_BONJOUR` เครือข่าย Docker bridge
มักไม่ forward multicast mDNS (`224.0.0.251:5353`) ระหว่างคอนเทนเนอร์
กับ LAN ดังนั้นการประกาศจากคอนเทนเนอร์จึงแทบไม่ทำให้การค้นพบทำงาน

ข้อควรระวังสำคัญ:

- การปิดใช้งาน Bonjour ไม่ได้หยุด Gateway แต่หยุดเฉพาะการประกาศ multicast
  บน LAN
- การปิดใช้งาน Bonjour ไม่ได้เปลี่ยน `gateway.bind`; Docker ยังคงตั้งค่าเริ่มต้นเป็น
  `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้พอร์ตโฮสต์ที่เผยแพร่ไว้ทำงานได้
- การปิดใช้งาน Bonjour ไม่ได้ปิดใช้งาน DNS-SD แบบพื้นที่กว้าง ให้ใช้การค้นพบแบบพื้นที่กว้าง
  หรือ Tailnet เมื่อ Gateway และโหนดไม่ได้อยู่บน LAN เดียวกัน
- การใช้ `OPENCLAW_CONFIG_DIR` เดียวกันซ้ำภายนอก Docker ไม่ได้คงนโยบายปิดใช้งานอัตโนมัติ
  ของคอนเทนเนอร์ไว้
- ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะสำหรับ host networking, macvlan หรือเครือข่ายอื่น
  ที่ทราบว่า multicast mDNS ผ่านได้; ตั้งเป็น `1` เพื่อบังคับปิดใช้งาน

## การแก้ปัญหา Bonjour ที่ถูกปิดใช้งาน

ถ้าโหนดไม่ค้นพบ Gateway อัตโนมัติอีกหลังจากตั้งค่า Docker:

1. ยืนยันว่า Gateway กำลังรันในโหมด auto, forced-on หรือ forced-off:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. ยืนยันว่า Gateway เองเข้าถึงได้ผ่านพอร์ตที่เผยแพร่ไว้:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. ใช้เป้าหมายโดยตรงเมื่อ Bonjour ถูกปิดใช้งาน:
   - Control UI หรือเครื่องมือ local: `http://127.0.0.1:18789`
   - ไคลเอนต์ LAN: `http://<gateway-host>:18789`
   - ไคลเอนต์ข้ามเครือข่าย: Tailnet MagicDNS, Tailnet IP, SSH tunnel หรือ
     DNS-SD แบบพื้นที่กว้าง

4. ถ้าคุณตั้งใจเปิดใช้งาน Bonjour ใน Docker ด้วย
   `OPENCLAW_DISABLE_BONJOUR=0` ให้ทดสอบ multicast จากโฮสต์:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   ถ้าการเรียกดูว่างเปล่าหรือบันทึก Gateway แสดงการยกเลิก ciao watchdog
   ซ้ำ ๆ ให้คืนค่า `OPENCLAW_DISABLE_BONJOUR=1` และใช้เส้นทางโดยตรงหรือ
   Tailnet

## โหมดความล้มเหลวทั่วไป

- **Bonjour ไม่ข้ามเครือข่าย**: ใช้ Tailnet หรือ SSH
- **Multicast ถูกบล็อก**: เครือข่าย Wi‑Fi บางแห่งปิดใช้งาน mDNS
- **Advertiser ค้างอยู่ในการ probe/announce**: โฮสต์ที่ multicast ถูกบล็อก,
  container bridges, WSL หรือการเปลี่ยนแปลงอินเทอร์เฟซบ่อย ๆ อาจทำให้ advertiser ของ ciao อยู่ใน
  สถานะที่ยังไม่ได้ประกาศ OpenClaw จะ retry สองสามครั้งแล้วปิดใช้งาน Bonjour
  สำหรับกระบวนการ Gateway ปัจจุบัน แทนที่จะรีสตาร์ท advertiser ไปเรื่อย ๆ
- **Docker bridge networking**: Bonjour ปิดใช้งานอัตโนมัติในคอนเทนเนอร์ที่ตรวจพบ
  ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะสำหรับ host, macvlan หรือเครือข่ายอื่น
  ที่รองรับ mDNS
- **Sleep / การเปลี่ยนแปลงอินเทอร์เฟซ**: macOS อาจทิ้งผลลัพธ์ mDNS ชั่วคราว; ให้ลองใหม่
- **เรียกดูได้แต่ resolve ล้มเหลว**: ใช้ชื่อเครื่องที่เรียบง่าย (หลีกเลี่ยงอีโมจิหรือ
  เครื่องหมายวรรคตอน) แล้วรีสตาร์ท Gateway ชื่ออินสแตนซ์บริการมาจาก
  ชื่อโฮสต์ ดังนั้นชื่อที่ซับซ้อนเกินไปอาจทำให้ resolver บางตัวสับสน

## ชื่ออินสแตนซ์ที่ escape แล้ว (`\032`)

Bonjour/DNS‑SD มัก escape ไบต์ในชื่ออินสแตนซ์บริการเป็นลำดับ `\DDD`
แบบเลขฐานสิบ (เช่น ช่องว่างกลายเป็น `\032`)

- สิ่งนี้เป็นเรื่องปกติในระดับโปรโตคอล
- UI ควรถอดรหัสเพื่อแสดงผล (iOS ใช้ `BonjourEscapes.decode`)

## การปิดใช้งาน / การกำหนดค่า

- `openclaw plugins disable bonjour` ปิดการประกาศ multicast บน LAN โดยปิดใช้งาน Plugin ที่มาพร้อมกัน
- `openclaw plugins enable bonjour` คืนค่า Plugin การค้นพบบน LAN ตามค่าเริ่มต้น
- `OPENCLAW_DISABLE_BONJOUR=1` ปิดการประกาศ multicast บน LAN โดยไม่เปลี่ยนการกำหนดค่า Plugin; ค่า truthy ที่ยอมรับคือ `1`, `true`, `yes` และ `on` (เดิม: `OPENCLAW_DISABLE_BONJOUR`)
- `OPENCLAW_DISABLE_BONJOUR=0` บังคับเปิดการประกาศ multicast บน LAN รวมถึงภายในคอนเทนเนอร์ที่ตรวจพบ; ค่า falsy ที่ยอมรับคือ `0`, `false`, `no` และ `off`
- เมื่อไม่ได้ตั้งค่า `OPENCLAW_DISABLE_BONJOUR`, Bonjour จะประกาศบนโฮสต์ปกติและปิดใช้งานอัตโนมัติภายในคอนเทนเนอร์ที่ตรวจพบ
- `gateway.bind` ใน `~/.openclaw/openclaw.json` ควบคุมโหมด bind ของ Gateway
- `OPENCLAW_SSH_PORT` override พอร์ต SSH เมื่อมีการประกาศ `sshPort` (เดิม: `OPENCLAW_SSH_PORT`)
- `OPENCLAW_TAILNET_DNS` เผยแพร่คำใบ้ MagicDNS ใน TXT เมื่อเปิดใช้งานโหมด mDNS เต็มรูปแบบ (เดิม: `OPENCLAW_TAILNET_DNS`)
- `OPENCLAW_CLI_PATH` override เส้นทาง CLI ที่ประกาศ (เดิม: `OPENCLAW_CLI_PATH`)

## เอกสารที่เกี่ยวข้อง

- นโยบายการค้นพบและการเลือก transport: [การค้นพบ](/th/gateway/discovery)
- การจับคู่โหนด + การอนุมัติ: [การจับคู่ Gateway](/th/gateway/pairing)
