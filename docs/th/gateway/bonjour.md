---
read_when:
    - การดีบักปัญหาการค้นพบ Bonjour บน macOS/iOS
    - การเปลี่ยนประเภทบริการ mDNS, ระเบียน TXT หรือประสบการณ์ผู้ใช้ในการค้นหา
summary: การค้นหาและการดีบัก Bonjour/mDNS (บีคอนของ Gateway, ไคลเอนต์ และรูปแบบความล้มเหลวที่พบบ่อย)
title: การค้นพบ Bonjour
x-i18n:
    generated_at: "2026-05-06T09:12:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7b7d029e6eb6bee90eb96e7ea169ecadf3bda6d969b2450349c5716a950e205
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw สามารถใช้ Bonjour (mDNS / DNS-SD) เพื่อค้นหา Gateway ที่ทำงานอยู่ (ปลายทาง WebSocket) ได้
การเรียกดูแบบมัลติแคสต์ `local.` เป็น **ความสะดวกสำหรับ LAN เท่านั้น** Plugin `bonjour`
ที่มาพร้อมชุดเป็นเจ้าของการประกาศบน LAN โดยจะเริ่มทำงานอัตโนมัติบนโฮสต์ macOS และต้องเลือกเปิดใช้เองบน
Linux, Windows และการปรับใช้ Gateway ในคอนเทนเนอร์ สำหรับการค้นหาข้ามเครือข่าย สามารถเผยแพร่
beacon เดียวกันผ่านโดเมน DNS-SD แบบ wide-area ที่กำหนดค่าไว้ได้ด้วย การค้นหา
ยังคงเป็นแบบ best-effort และ **ไม่ได้** แทนที่การเชื่อมต่อผ่าน SSH หรือ Tailnet

## Wide-area Bonjour (Unicast DNS-SD) ผ่าน Tailscale

หากโหนดและ Gateway อยู่คนละเครือข่าย มัลติแคสต์ mDNS จะไม่ข้าม
ขอบเขตนั้น คุณสามารถคง UX การค้นหาแบบเดิมไว้ได้โดยสลับไปใช้ **unicast DNS-SD**
("Wide-Area Bonjour") ผ่าน Tailscale

ขั้นตอนระดับสูง:

1. เรียกใช้เซิร์ฟเวอร์ DNS บนโฮสต์ Gateway (เข้าถึงได้ผ่าน Tailnet)
2. เผยแพร่ระเบียน DNS-SD สำหรับ `_openclaw-gw._tcp` ใต้โซนเฉพาะ
   (ตัวอย่าง: `openclaw.internal.`)
3. กำหนดค่า Tailscale **split DNS** เพื่อให้โดเมนที่คุณเลือก resolve ผ่าน
   เซิร์ฟเวอร์ DNS นั้นสำหรับไคลเอนต์ (รวมถึง iOS)

OpenClaw รองรับโดเมนการค้นหาใดก็ได้; `openclaw.internal.` เป็นเพียงตัวอย่าง
โหนด iOS/Android จะเรียกดูทั้ง `local.` และโดเมน wide-area ที่คุณกำหนดค่าไว้

### การกำหนดค่า Gateway (แนะนำ)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### การตั้งค่าเซิร์ฟเวอร์ DNS ครั้งเดียว (โฮสต์ Gateway)

```bash
openclaw dns setup --apply
```

คำสั่งนี้จะติดตั้ง CoreDNS และกำหนดค่าให้:

- รับฟังบนพอร์ต 53 เฉพาะบนอินเทอร์เฟซ Tailscale ของ Gateway
- ให้บริการโดเมนที่คุณเลือก (ตัวอย่าง: `openclaw.internal.`) จาก `~/.openclaw/dns/<domain>.db`

ตรวจสอบจากเครื่องที่เชื่อมต่อกับ tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### การตั้งค่า DNS ของ Tailscale

ในคอนโซลผู้ดูแลระบบ Tailscale:

- เพิ่ม nameserver ที่ชี้ไปยัง IP tailnet ของ Gateway (UDP/TCP 53)
- เพิ่ม split DNS เพื่อให้โดเมนการค้นหาของคุณใช้ nameserver นั้น

เมื่อไคลเอนต์ยอมรับ DNS ของ tailnet แล้ว โหนด iOS และการค้นหาของ CLI จะสามารถเรียกดู
`_openclaw-gw._tcp` ในโดเมนการค้นหาของคุณได้โดยไม่ต้องใช้มัลติแคสต์

### ความปลอดภัยของตัวรับฟัง Gateway (แนะนำ)

พอร์ต WS ของ Gateway (ค่าเริ่มต้น `18789`) จะ bind กับ loopback โดยค่าเริ่มต้น สำหรับการเข้าถึงผ่าน LAN/tailnet
ให้ bind อย่างชัดเจนและเปิด auth ไว้

สำหรับการตั้งค่าแบบ tailnet-only:

- ตั้งค่า `gateway.bind: "tailnet"` ใน `~/.openclaw/openclaw.json`
- รีสตาร์ท Gateway (หรือรีสตาร์ทแอปแถบเมนู macOS)

## สิ่งที่ประกาศ

เฉพาะ Gateway เท่านั้นที่ประกาศ `_openclaw-gw._tcp` การประกาศมัลติแคสต์บน LAN
จัดทำโดย Plugin `bonjour` ที่มาพร้อมชุดเมื่อเปิดใช้ Plugin; การเผยแพร่
DNS-SD แบบ wide-area ยังคงเป็นของ Gateway

## ประเภทบริการ

- `_openclaw-gw._tcp` - beacon การขนส่งของ Gateway (ใช้โดยโหนด macOS/iOS/Android)

## คีย์ TXT (คำใบ้ที่ไม่ใช่ความลับ)

Gateway ประกาศคำใบ้เล็กๆ ที่ไม่ใช่ความลับเพื่อให้โฟลว์ UI สะดวกขึ้น:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (เฉพาะเมื่อเปิดใช้ TLS)
- `gatewayTlsSha256=<sha256>` (เฉพาะเมื่อเปิดใช้ TLS และมี fingerprint พร้อมใช้งาน)
- `canvasPort=<port>` (เฉพาะเมื่อเปิดใช้โฮสต์ canvas; ปัจจุบันเหมือนกับ `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (เฉพาะโหมด mDNS full, คำใบ้เสริมเมื่อมี Tailnet)
- `sshPort=<port>` (เฉพาะโหมด mDNS full; DNS-SD แบบ wide-area อาจไม่ใส่ค่านี้)
- `cliPath=<path>` (เฉพาะโหมด mDNS full; DNS-SD แบบ wide-area ยังเขียนค่านี้เป็นคำใบ้สำหรับการติดตั้งระยะไกล)

หมายเหตุด้านความปลอดภัย:

- ระเบียน TXT ของ Bonjour/mDNS **ไม่ได้ผ่านการยืนยันตัวตน** ไคลเอนต์ต้องไม่ถือว่า TXT เป็นข้อมูลการกำหนดเส้นทางที่ authoritative
- ไคลเอนต์ควรกำหนดเส้นทางโดยใช้ปลายทางบริการที่ resolve แล้ว (SRV + A/AAAA) ให้ถือว่า `lanHost`, `tailnetDns`, `gatewayPort` และ `gatewayTlsSha256` เป็นเพียงคำใบ้เท่านั้น
- การเลือกเป้าหมาย SSH อัตโนมัติก็ควรใช้โฮสต์บริการที่ resolve แล้วเช่นกัน ไม่ใช่คำใบ้จาก TXT เท่านั้น
- TLS pinning ต้องไม่อนุญาตให้ `gatewayTlsSha256` ที่ประกาศมา override pin ที่จัดเก็บไว้ก่อนหน้า
- โหนด iOS/Android ควรถือว่าการเชื่อมต่อโดยตรงผ่านการค้นหาเป็น **TLS-only** และต้องให้ผู้ใช้ยืนยันอย่างชัดเจนก่อนเชื่อถือ fingerprint ครั้งแรก

## การดีบักบน macOS

เครื่องมือในตัวที่มีประโยชน์:

- เรียกดู instance:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Resolve instance หนึ่งรายการ (แทนที่ `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

หากการเรียกดูทำงานแต่การ resolve ล้มเหลว โดยปกติคุณกำลังเจอนโยบาย LAN หรือ
ปัญหา resolver ของ mDNS

## การดีบักในบันทึกของ Gateway

Gateway เขียนไฟล์บันทึกแบบหมุนเวียน (พิมพ์เมื่อเริ่มต้นเป็น
`gateway log file: ...`) มองหาบรรทัด `bonjour:` โดยเฉพาะ:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour ใช้ชื่อโฮสต์ของระบบสำหรับโฮสต์ `.local` ที่ประกาศเมื่อเป็น
ป้ายกำกับ DNS ที่ถูกต้อง หากชื่อโฮสต์ของระบบมีช่องว่าง ขีดล่าง หรืออักขระอื่น
ที่ไม่ถูกต้องสำหรับป้ายกำกับ DNS, OpenClaw จะ fallback ไปที่ `openclaw.local` ตั้งค่า
`OPENCLAW_MDNS_HOSTNAME=<name>` ก่อนเริ่ม Gateway เมื่อคุณต้องการ
ป้ายกำกับโฮสต์แบบชัดเจน

## การดีบักบนโหนด iOS

โหนด iOS ใช้ `NWBrowser` เพื่อค้นหา `_openclaw-gw._tcp`

วิธีเก็บบันทึก:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → ทำซ้ำปัญหา → **Copy**

บันทึกจะรวมการเปลี่ยนสถานะของเบราว์เซอร์และการเปลี่ยนแปลงของชุดผลลัพธ์

## ควรเปิดใช้ Bonjour เมื่อใด

Bonjour จะเริ่มทำงานอัตโนมัติสำหรับการเริ่มต้น Gateway แบบ config ว่างบนโฮสต์ macOS เพราะ
แอปในเครื่องและโหนด iOS/Android ที่อยู่ใกล้กันมักพึ่งพาการค้นหาภายใน LAN เดียวกัน

เปิดใช้ Bonjour อย่างชัดเจนเมื่อการค้นหาอัตโนมัติภายใน LAN เดียวกันมีประโยชน์บน Linux,
Windows หรือโฮสต์อื่นที่ไม่ใช่ macOS:

```bash
openclaw plugins enable bonjour
```

เมื่อเปิดใช้ Bonjour จะใช้ `discovery.mdns.mode` เพื่อตัดสินใจว่าจะเผยแพร่เมทาดาทา TXT มากเพียงใด
โหมดเริ่มต้นคือ `minimal`; ใช้ `full` เฉพาะเมื่อไคลเอนต์ภายในเครื่องต้องการ
คำใบ้ `cliPath` หรือ `sshPort` และใช้ `off` เพื่อระงับมัลติแคสต์บน LAN โดยไม่
เปลี่ยนสถานะการเปิดใช้ Plugin

## ควรปิดใช้ Bonjour เมื่อใด

ปล่อยให้ Bonjour ปิดอยู่เมื่อการประกาศมัลติแคสต์บน LAN ไม่จำเป็น ใช้งานไม่ได้
หรือเป็นผลเสีย กรณีที่พบบ่อยคือเซิร์ฟเวอร์ที่ไม่ใช่ macOS, Docker bridge networking,
WSL หรือนโยบายเครือข่ายที่ทิ้งมัลติแคสต์ mDNS ในสภาพแวดล้อมเหล่านี้
Gateway ยังเข้าถึงได้ผ่าน URL ที่เผยแพร่ไว้, SSH, Tailnet หรือ DNS-SD
แบบ wide-area แต่การค้นหาอัตโนมัติบน LAN ไม่น่าเชื่อถือ

ควรใช้ environment override ที่มีอยู่เมื่อปัญหาอยู่ในขอบเขตการปรับใช้:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

ค่านี้ปิดการประกาศมัลติแคสต์บน LAN โดยไม่เปลี่ยนการกำหนดค่า Plugin
ปลอดภัยสำหรับอิมเมจ Docker, ไฟล์ service, สคริปต์ launch และการดีบัก
ครั้งเดียว เพราะค่านี้จะหายไปเมื่อ environment หายไป

ใช้การกำหนดค่า Plugin เมื่อคุณตั้งใจต้องการปิด Plugin การค้นหา LAN
ที่มาพร้อมชุดสำหรับ config ของ OpenClaw นั้น:

```bash
openclaw plugins disable bonjour
```

## ข้อควรระวังของ Docker

Plugin Bonjour ที่มาพร้อมชุดจะปิดการประกาศมัลติแคสต์บน LAN อัตโนมัติในคอนเทนเนอร์
ที่ตรวจพบเมื่อไม่ได้ตั้งค่า `OPENCLAW_DISABLE_BONJOUR` เครือข่าย Docker bridge
มักไม่ส่งต่อมัลติแคสต์ mDNS (`224.0.0.251:5353`) ระหว่างคอนเทนเนอร์
และ LAN ดังนั้นการประกาศจากคอนเทนเนอร์จึงแทบไม่ทำให้การค้นหาใช้งานได้

ข้อควรระวังสำคัญ:

- Bonjour เริ่มทำงานอัตโนมัติบนโฮสต์ macOS และต้องเลือกเปิดใช้เองที่อื่น การปล่อยไว้
  ปิดอยู่ไม่ได้หยุด Gateway; เพียงแค่ข้ามการประกาศมัลติแคสต์บน LAN
- การปิด Bonjour ไม่ได้เปลี่ยน `gateway.bind`; Docker ยังมีค่าเริ่มต้นเป็น
  `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้พอร์ตโฮสต์ที่เผยแพร่ทำงานได้
- การปิด Bonjour ไม่ได้ปิด DNS-SD แบบ wide-area ใช้การค้นหาแบบ wide-area
  หรือ Tailnet เมื่อ Gateway และโหนดไม่ได้อยู่บน LAN เดียวกัน
- การใช้ `OPENCLAW_CONFIG_DIR` เดียวกันซ้ำนอก Docker ไม่ได้ทำให้นโยบาย
  auto-disable ของคอนเทนเนอร์คงอยู่
- ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะสำหรับ host networking, macvlan หรือเครือข่ายอื่น
  ที่ทราบว่า mDNS multicast ผ่านได้; ตั้งเป็น `1` เพื่อบังคับปิด

## การแก้ปัญหา Bonjour ที่ถูกปิดใช้

หากโหนดไม่ค้นพบ Gateway อัตโนมัติอีกต่อไปหลังจากตั้งค่า Docker:

1. ยืนยันว่า Gateway กำลังทำงานในโหมด auto, forced-on หรือ forced-off:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. ยืนยันว่า Gateway เองเข้าถึงได้ผ่านพอร์ตที่เผยแพร่:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. ใช้เป้าหมายโดยตรงเมื่อ Bonjour ถูกปิด:
   - Control UI หรือเครื่องมือภายในเครื่อง: `http://127.0.0.1:18789`
   - ไคลเอนต์ LAN: `http://<gateway-host>:18789`
   - ไคลเอนต์ข้ามเครือข่าย: Tailnet MagicDNS, Tailnet IP, SSH tunnel หรือ
     DNS-SD แบบ wide-area

4. หากคุณตั้งใจเปิดใช้ Plugin Bonjour ใน Docker และบังคับให้ประกาศ
   ด้วย `OPENCLAW_DISABLE_BONJOUR=0` ให้ทดสอบมัลติแคสต์จากโฮสต์:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   หากการเรียกดูว่างเปล่าหรือบันทึก Gateway แสดงการยกเลิกจาก ciao watchdog
   ซ้ำๆ ให้คืนค่า `OPENCLAW_DISABLE_BONJOUR=1` แล้วใช้เส้นทางโดยตรงหรือ
   Tailnet

## รูปแบบความล้มเหลวที่พบบ่อย

- **Bonjour ไม่ข้ามเครือข่าย**: ใช้ Tailnet หรือ SSH
- **มัลติแคสต์ถูกบล็อก**: เครือข่าย Wi-Fi บางแห่งปิดใช้ mDNS
- **Advertiser ค้างอยู่ใน probing/announcing**: โฮสต์ที่มัลติแคสต์ถูกบล็อก,
  container bridge, WSL หรือการเปลี่ยนแปลงอินเทอร์เฟซบ่อยๆ อาจทำให้ ciao advertiser อยู่ใน
  สถานะที่ยังไม่ประกาศ OpenClaw จะลองใหม่สองสามครั้งแล้วปิด Bonjour
  สำหรับกระบวนการ Gateway ปัจจุบันแทนที่จะรีสตาร์ท advertiser ตลอดไป
- **Docker bridge networking**: Bonjour จะ auto-disable ในคอนเทนเนอร์ที่ตรวจพบ
  ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะสำหรับ host, macvlan หรือเครือข่ายอื่น
  ที่รองรับ mDNS
- **Sleep / interface churn**: macOS อาจทิ้งผลลัพธ์ mDNS ชั่วคราว; ลองใหม่
- **เรียกดูได้แต่ resolve ล้มเหลว**: ใช้ชื่อเครื่องแบบเรียบง่าย (หลีกเลี่ยงอีโมจิหรือ
  เครื่องหมายวรรคตอน) แล้วรีสตาร์ท Gateway ชื่อ instance ของบริการได้มาจาก
  ชื่อโฮสต์ ดังนั้นชื่อที่ซับซ้อนเกินไปอาจทำให้ resolver บางตัวสับสนได้

## ชื่อ instance ที่ escape แล้ว (`\032`)

Bonjour/DNS-SD มัก escape ไบต์ในชื่อ instance ของบริการเป็นลำดับ `\DDD`
แบบทศนิยม (เช่น ช่องว่างกลายเป็น `\032`)

- นี่เป็นเรื่องปกติในระดับโปรโตคอล
- UI ควร decode เพื่อแสดงผล (iOS ใช้ `BonjourEscapes.decode`)

## การเปิดใช้ / การปิดใช้ / การกำหนดค่า

- โฮสต์ macOS จะเริ่ม Plugin การค้นหา LAN ที่มาพร้อมชุดโดยอัตโนมัติตามค่าเริ่มต้น
- `openclaw plugins enable bonjour` เปิดใช้ Plugin การค้นหา LAN ที่มาพร้อมชุดบนโฮสต์ที่ไม่ได้เปิดใช้เป็นค่าเริ่มต้น
- `openclaw plugins disable bonjour` ปิดการประกาศมัลติแคสต์บน LAN โดยปิดใช้ Plugin ที่มาพร้อมชุด
- `OPENCLAW_DISABLE_BONJOUR=1` ปิดการประกาศมัลติแคสต์บน LAN โดยไม่เปลี่ยน config ของ Plugin; ค่าที่ถือว่าเป็นจริงที่ยอมรับคือ `1`, `true`, `yes` และ `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`)
- `OPENCLAW_DISABLE_BONJOUR=0` บังคับเปิดการประกาศมัลติแคสต์บน LAN รวมถึงภายในคอนเทนเนอร์ที่ตรวจพบ; ค่าที่ถือว่าเป็นเท็จที่ยอมรับคือ `0`, `false`, `no` และ `off`
- เมื่อเปิดใช้ Plugin Bonjour และไม่ได้ตั้งค่า `OPENCLAW_DISABLE_BONJOUR`, Bonjour จะประกาศบนโฮสต์ปกติและ auto-disable ภายในคอนเทนเนอร์ที่ตรวจพบ
- `gateway.bind` ใน `~/.openclaw/openclaw.json` ควบคุมโหมด bind ของ Gateway
- `OPENCLAW_SSH_PORT` override พอร์ต SSH เมื่อมีการประกาศ `sshPort` (legacy: `OPENCLAW_SSH_PORT`)
- `OPENCLAW_TAILNET_DNS` เผยแพร่คำใบ้ MagicDNS ใน TXT เมื่อเปิดใช้โหมด mDNS full (legacy: `OPENCLAW_TAILNET_DNS`)
- `OPENCLAW_CLI_PATH` override path ของ CLI ที่ประกาศ (legacy: `OPENCLAW_CLI_PATH`)

## เอกสารที่เกี่ยวข้อง

- นโยบายการค้นหาและการเลือกการขนส่ง: [Discovery](/th/gateway/discovery)
- การจับคู่โหนด + การอนุมัติ: [การจับคู่ Gateway](/th/gateway/pairing)
