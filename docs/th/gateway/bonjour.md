---
read_when:
    - การแก้ไขปัญหาการค้นพบ Bonjour บน macOS/iOS
    - การเปลี่ยนประเภทบริการ mDNS, ระเบียน TXT หรือประสบการณ์ผู้ใช้ในการค้นพบ
summary: การค้นหาและการดีบัก Bonjour/mDNS (บีคอน Gateway, ไคลเอนต์ และรูปแบบความล้มเหลวที่พบบ่อย)
title: การค้นพบ Bonjour
x-i18n:
    generated_at: "2026-05-11T20:29:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03bd9403591a389c06d3131e4c110d4ccf711eee56cbe9a5c9baed2b6df8fb80
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw สามารถใช้ Bonjour (mDNS / DNS-SD) เพื่อค้นหา Gateway ที่ทำงานอยู่ (WebSocket endpoint) ได้
การเรียกดูมัลติคาสต์ `local.` เป็น **ความสะดวกสำหรับ LAN เท่านั้น** Plugin `bonjour`
ที่รวมมาให้เป็นเจ้าของการประกาศบน LAN โดยจะเริ่มทำงานอัตโนมัติบนโฮสต์ macOS และต้องเลือกเปิดใช้บน
Linux, Windows และการปรับใช้ Gateway แบบคอนเทนเนอร์ สำหรับการค้นหาข้ามเครือข่าย beacon เดียวกัน
ยังสามารถเผยแพร่ผ่านโดเมน wide-area DNS-SD ที่กำหนดค่าไว้ได้เช่นกัน การค้นหา
ยังคงเป็นแบบ best-effort และ **ไม่** แทนที่การเชื่อมต่อผ่าน SSH หรือ Tailnet

## Wide-area Bonjour (Unicast DNS-SD) ผ่าน Tailscale

หาก node และ gateway อยู่คนละเครือข่าย มัลติคาสต์ mDNS จะไม่ข้าม
ขอบเขตนั้น คุณสามารถคง UX การค้นหาแบบเดิมไว้ได้โดยเปลี่ยนไปใช้ **unicast DNS-SD**
("Wide-Area Bonjour") ผ่าน Tailscale

ขั้นตอนระดับสูง:

1. รันเซิร์ฟเวอร์ DNS บนโฮสต์ gateway (เข้าถึงได้ผ่าน Tailnet)
2. เผยแพร่ระเบียน DNS-SD สำหรับ `_openclaw-gw._tcp` ใต้ zone เฉพาะ
   (ตัวอย่าง: `openclaw.internal.`)
3. กำหนดค่า Tailscale **split DNS** เพื่อให้โดเมนที่คุณเลือก resolve ผ่าน
   เซิร์ฟเวอร์ DNS นั้นสำหรับ client (รวมถึง iOS)

OpenClaw รองรับโดเมนการค้นหาใดก็ได้; `openclaw.internal.` เป็นเพียงตัวอย่าง
node iOS/Android จะเรียกดูทั้ง `local.` และโดเมน wide-area ที่คุณกำหนดค่าไว้

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

- ฟังที่พอร์ต 53 เฉพาะบนอินเทอร์เฟซ Tailscale ของ gateway
- ให้บริการโดเมนที่คุณเลือก (ตัวอย่าง: `openclaw.internal.`) จาก `~/.openclaw/dns/<domain>.db`

ตรวจสอบจากเครื่องที่เชื่อมต่อ tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### การตั้งค่า DNS ของ Tailscale

ในคอนโซลผู้ดูแล Tailscale:

- เพิ่ม nameserver ที่ชี้ไปยัง IP tailnet ของ gateway (UDP/TCP 53)
- เพิ่ม split DNS เพื่อให้โดเมนการค้นหาของคุณใช้ nameserver นั้น

เมื่อ client ยอมรับ DNS ของ tailnet แล้ว node iOS และการค้นหาผ่าน CLI จะสามารถเรียกดู
`_openclaw-gw._tcp` ในโดเมนการค้นหาของคุณได้โดยไม่ต้องใช้มัลติคาสต์

### ความปลอดภัยของ listener ของ Gateway (แนะนำ)

พอร์ต WS ของ Gateway (ค่าเริ่มต้น `18789`) bind กับ loopback โดยค่าเริ่มต้น สำหรับการเข้าถึงผ่าน LAN/tailnet
ให้ bind อย่างชัดเจนและเปิด auth ไว้

สำหรับการตั้งค่าแบบ tailnet-only:

- ตั้งค่า `gateway.bind: "tailnet"` ใน `~/.openclaw/openclaw.json`
- รีสตาร์ท Gateway (หรือรีสตาร์ทแอป menubar ของ macOS)

## สิ่งที่ประกาศ

เฉพาะ Gateway เท่านั้นที่ประกาศ `_openclaw-gw._tcp` การประกาศมัลติคาสต์บน LAN
มีให้โดย Plugin `bonjour` ที่รวมมาให้เมื่อเปิดใช้ Plugin นั้น; การเผยแพร่
wide-area DNS-SD ยังคงเป็นของ Gateway

## ประเภทบริการ

- `_openclaw-gw._tcp` - beacon สำหรับการขนส่งของ gateway (ใช้โดย node macOS/iOS/Android)

## คีย์ TXT (คำใบ้ที่ไม่ใช่ความลับ)

Gateway ประกาศคำใบ้ขนาดเล็กที่ไม่ใช่ความลับเพื่อให้ flow ของ UI สะดวกขึ้น:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (เฉพาะเมื่อเปิดใช้ TLS)
- `gatewayTlsSha256=<sha256>` (เฉพาะเมื่อเปิดใช้ TLS และมี fingerprint)
- `canvasPort=<port>` (เฉพาะเมื่อเปิดใช้โฮสต์ canvas; ปัจจุบันเหมือนกับ `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (เฉพาะโหมด mDNS full, เป็นคำใบ้เสริมเมื่อมี Tailnet)
- `sshPort=<port>` (เฉพาะโหมด mDNS full; wide-area DNS-SD อาจละไว้)
- `cliPath=<path>` (เฉพาะโหมด mDNS full; wide-area DNS-SD ยังคงเขียนไว้เป็นคำใบ้สำหรับ remote-install)

หมายเหตุด้านความปลอดภัย:

- ระเบียน TXT ของ Bonjour/mDNS **ไม่ได้รับการยืนยันตัวตน** client ต้องไม่ถือว่า TXT เป็นแหล่ง routing ที่เชื่อถือได้
- client ควร route โดยใช้ service endpoint ที่ resolve ได้ (SRV + A/AAAA) ให้ถือว่า `lanHost`, `tailnetDns`, `gatewayPort` และ `gatewayTlsSha256` เป็นเพียงคำใบ้เท่านั้น
- การกำหนด target อัตโนมัติของ SSH ควรใช้ service host ที่ resolve ได้เช่นกัน ไม่ใช่คำใบ้จาก TXT เท่านั้น
- การ pin TLS ต้องไม่อนุญาตให้ `gatewayTlsSha256` ที่ประกาศมา override pin ที่เก็บไว้ก่อนหน้า
- node iOS/Android ควรถือว่าการเชื่อมต่อโดยตรงจากการค้นหาเป็นแบบ **TLS-only** และต้องให้ผู้ใช้ยืนยันอย่างชัดเจนก่อนเชื่อถือ fingerprint ครั้งแรก

## การดีบักบน macOS

เครื่องมือ built-in ที่มีประโยชน์:

- เรียกดู instance:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Resolve instance หนึ่งรายการ (แทนที่ `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

หากเรียกดูได้แต่ resolve ไม่สำเร็จ โดยปกติคุณกำลังเจอนโยบาย LAN หรือ
ปัญหา resolver ของ mDNS

## การดีบักใน log ของ Gateway

Gateway เขียนไฟล์ log แบบ rolling (พิมพ์เมื่อเริ่มต้นเป็น
`gateway log file: ...`) ให้มองหาบรรทัด `bonjour:` โดยเฉพาะ:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

watchdog ถือว่าสถานะ `probing`, `announcing` ที่ทำงานอยู่ และการ rename จาก conflict ที่เพิ่งเกิด
เป็นสถานะที่กำลังดำเนินการ หาก service ไม่เคยไปถึง `announced` ในที่สุด OpenClaw จะ
สร้าง advertiser ใหม่ และหลังจากล้มเหลวซ้ำๆ จะปิดใช้ Bonjour สำหรับ
process ของ Gateway นั้นแทนที่จะ re-advertise ไปเรื่อยๆ

Bonjour ใช้ hostname ของระบบสำหรับโฮสต์ `.local` ที่ประกาศเมื่อเป็น
DNS label ที่ถูกต้อง หาก hostname ของระบบมีช่องว่าง ขีดล่าง หรืออักขระ
DNS-label ที่ไม่ถูกต้องอื่นๆ OpenClaw จะ fallback ไปที่ `openclaw.local` ตั้งค่า
`OPENCLAW_MDNS_HOSTNAME=<name>` ก่อนเริ่ม Gateway เมื่อคุณต้องการ
host label อย่างชัดเจน

## การดีบักบน node iOS

node iOS ใช้ `NWBrowser` เพื่อค้นหา `_openclaw-gw._tcp`

วิธีเก็บ log:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → ทำซ้ำปัญหา → **Copy**

log ประกอบด้วยการเปลี่ยนสถานะของ browser และการเปลี่ยนแปลงของ result-set

## เมื่อใดควรเปิดใช้ Bonjour

Bonjour เริ่มทำงานอัตโนมัติสำหรับการเริ่มต้น Gateway แบบ empty-config บนโฮสต์ macOS เพราะ
แอป local และ node iOS/Android ใกล้เคียงมักพึ่งพาการค้นหาบน LAN เดียวกัน

เปิดใช้ Bonjour อย่างชัดเจนเมื่อการค้นหาอัตโนมัติบน LAN เดียวกันมีประโยชน์บน Linux,
Windows หรือโฮสต์อื่นที่ไม่ใช่ macOS:

```bash
openclaw plugins enable bonjour
```

เมื่อเปิดใช้แล้ว Bonjour จะใช้ `discovery.mdns.mode` เพื่อตัดสินใจว่าจะเผยแพร่ metadata TXT
มากน้อยเพียงใด โหมดเริ่มต้นคือ `minimal`; ใช้ `full` เฉพาะเมื่อ client local ต้องการ
คำใบ้ `cliPath` หรือ `sshPort` และใช้ `off` เพื่อระงับมัลติคาสต์ LAN โดยไม่
เปลี่ยนการเปิดใช้ Plugin

## เมื่อใดควรปิดใช้ Bonjour

ปล่อยให้ Bonjour ปิดอยู่เมื่อไม่จำเป็นต้องประกาศมัลติคาสต์บน LAN, ใช้งานไม่ได้
หรือมีผลเสีย กรณีทั่วไปคือเซิร์ฟเวอร์ที่ไม่ใช่ macOS, Docker bridge networking,
WSL หรือนโยบายเครือข่ายที่ดรอปมัลติคาสต์ mDNS ในสภาพแวดล้อมเหล่านั้น
Gateway ยังเข้าถึงได้ผ่าน URL ที่เผยแพร่ไว้, SSH, Tailnet หรือ wide-area
DNS-SD แต่การค้นหาอัตโนมัติบน LAN ไม่น่าเชื่อถือ

ควรใช้การ override ผ่าน environment ที่มีอยู่เมื่อปัญหาอยู่ในขอบเขตของการปรับใช้:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

ค่านี้ปิดการประกาศมัลติคาสต์บน LAN โดยไม่เปลี่ยนการกำหนดค่า Plugin
ปลอดภัยสำหรับ Docker image, service file, launch script และการดีบักเฉพาะครั้ง
เพราะการตั้งค่านี้จะหายไปเมื่อ environment หายไป

ใช้การกำหนดค่า Plugin เมื่อคุณตั้งใจต้องการปิด Plugin การค้นหา LAN
ที่รวมมาให้สำหรับการกำหนดค่า OpenClaw นั้น:

```bash
openclaw plugins disable bonjour
```

## ข้อควรระวังของ Docker

Plugin Bonjour ที่รวมมาให้จะปิดการประกาศมัลติคาสต์บน LAN อัตโนมัติในคอนเทนเนอร์ที่ตรวจพบ
เมื่อไม่ได้ตั้งค่า `OPENCLAW_DISABLE_BONJOUR` เครือข่าย Docker bridge
มักไม่ forward มัลติคาสต์ mDNS (`224.0.0.251:5353`) ระหว่างคอนเทนเนอร์
กับ LAN ดังนั้นการประกาศจากคอนเทนเนอร์จึงแทบไม่ทำให้การค้นหาทำงานได้

ข้อควรระวังสำคัญ:

- Bonjour เริ่มทำงานอัตโนมัติบนโฮสต์ macOS และต้องเลือกเปิดใช้ที่อื่น การปล่อยให้
  ปิดอยู่ไม่ได้หยุด Gateway; เพียงข้ามการประกาศมัลติคาสต์บน LAN เท่านั้น
- การปิดใช้ Bonjour ไม่เปลี่ยน `gateway.bind`; Docker ยังใช้ค่าเริ่มต้นเป็น
  `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้พอร์ต host ที่เผยแพร่ทำงานได้
- การปิดใช้ Bonjour ไม่ได้ปิดใช้ wide-area DNS-SD ใช้การค้นหาแบบ wide-area
  หรือ Tailnet เมื่อ Gateway และ node ไม่ได้อยู่บน LAN เดียวกัน
- การใช้ `OPENCLAW_CONFIG_DIR` เดียวกันซ้ำนอก Docker จะไม่คงนโยบาย
  auto-disable ของคอนเทนเนอร์ไว้
- ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะสำหรับ host networking, macvlan หรือเครือข่ายอื่น
  ที่ทราบว่า mDNS multicast ผ่านได้; ตั้งค่าเป็น `1` เพื่อบังคับปิด

## การแก้ปัญหา Bonjour ที่ถูกปิดใช้

หาก node ไม่ค้นหา Gateway อัตโนมัติอีกต่อไปหลังจากตั้งค่า Docker:

1. ยืนยันว่า Gateway กำลังรันในโหมด auto, forced-on หรือ forced-off:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. ยืนยันว่า Gateway เองเข้าถึงได้ผ่านพอร์ตที่เผยแพร่:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. ใช้ target โดยตรงเมื่อ Bonjour ถูกปิดใช้:
   - Control UI หรือเครื่องมือ local: `http://127.0.0.1:18789`
   - client บน LAN: `http://<gateway-host>:18789`
   - client ข้ามเครือข่าย: Tailnet MagicDNS, Tailnet IP, SSH tunnel หรือ
     wide-area DNS-SD

4. หากคุณจงใจเปิดใช้ Plugin Bonjour ใน Docker และบังคับประกาศ
   ด้วย `OPENCLAW_DISABLE_BONJOUR=0` ให้ทดสอบมัลติคาสต์จาก host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   หากการเรียกดูว่างเปล่า หรือ log ของ Gateway แสดงการยกเลิกจาก ciao watchdog
   ซ้ำๆ ให้คืนค่า `OPENCLAW_DISABLE_BONJOUR=1` และใช้ route โดยตรงหรือ
   route ผ่าน Tailnet

## โหมดความล้มเหลวที่พบบ่อย

- **Bonjour ไม่ข้ามเครือข่าย**: ใช้ Tailnet หรือ SSH
- **มัลติคาสต์ถูกบล็อก**: เครือข่าย Wi-Fi บางเครือข่ายปิดใช้ mDNS
- **Advertiser ค้างอยู่ใน probing/announcing**: โฮสต์ที่บล็อกมัลติคาสต์,
  container bridge, WSL หรือการเปลี่ยนแปลงอินเทอร์เฟซอาจทำให้ ciao advertiser อยู่ใน
  สถานะที่ยังไม่ announced OpenClaw จะ retry สองสามครั้งแล้วปิดใช้ Bonjour
  สำหรับ process ของ Gateway ปัจจุบันแทนที่จะรีสตาร์ท advertiser ไปเรื่อยๆ
- **Docker bridge networking**: Bonjour ปิดอัตโนมัติในคอนเทนเนอร์ที่ตรวจพบ
  ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะสำหรับ host, macvlan หรือเครือข่ายอื่น
  ที่รองรับ mDNS
- **Sleep / การเปลี่ยนแปลงอินเทอร์เฟซ**: macOS อาจดรอปผลลัพธ์ mDNS ชั่วคราว; ลองใหม่
- **เรียกดูได้แต่ resolve ไม่สำเร็จ**: ใช้ชื่อเครื่องแบบเรียบง่าย (หลีกเลี่ยง emoji หรือ
  เครื่องหมายวรรคตอน) แล้วรีสตาร์ท Gateway ชื่อ service instance มาจาก
  ชื่อ host ดังนั้นชื่อที่ซับซ้อนเกินไปอาจทำให้ resolver บางตัวสับสนได้

## ชื่อ instance ที่ escape แล้ว (`\032`)

Bonjour/DNS-SD มัก escape byte ในชื่อ service instance เป็นลำดับ `\DDD`
แบบเลขฐานสิบ (เช่น ช่องว่างกลายเป็น `\032`)

- นี่เป็นเรื่องปกติในระดับ protocol
- UI ควร decode เพื่อแสดงผล (iOS ใช้ `BonjourEscapes.decode`)

## การเปิดใช้ / การปิดใช้ / การกำหนดค่า

- โฮสต์ macOS จะเริ่มต้น Plugin การค้นหา LAN ที่บันเดิลมาให้โดยอัตโนมัติตามค่าเริ่มต้น
- `openclaw plugins enable bonjour` เปิดใช้ Plugin การค้นหา LAN ที่บันเดิลมาให้บนโฮสต์ที่ไม่ได้เปิดใช้เป็นค่าเริ่มต้น
- `openclaw plugins disable bonjour` ปิดการโฆษณาแบบมัลติแคสต์บน LAN โดยปิดใช้ Plugin ที่บันเดิลมาให้
- `OPENCLAW_DISABLE_BONJOUR=1` ปิดการโฆษณาแบบมัลติแคสต์บน LAN โดยไม่เปลี่ยนการกำหนดค่า Plugin; ค่าจริงที่ยอมรับคือ `1`, `true`, `yes` และ `on` (เดิม: `OPENCLAW_DISABLE_BONJOUR`)
- `OPENCLAW_DISABLE_BONJOUR=0` บังคับเปิดการโฆษณาแบบมัลติแคสต์บน LAN รวมถึงภายในคอนเทนเนอร์ที่ตรวจพบ; ค่าเท็จที่ยอมรับคือ `0`, `false`, `no` และ `off`
- เมื่อเปิดใช้ Plugin Bonjour และไม่ได้ตั้งค่า `OPENCLAW_DISABLE_BONJOUR` ไว้ Bonjour จะโฆษณาบนโฮสต์ปกติและปิดใช้อัตโนมัติภายในคอนเทนเนอร์ที่ตรวจพบ
- `gateway.bind` ใน `~/.openclaw/openclaw.json` ควบคุมโหมดการผูกของ Gateway
- `OPENCLAW_SSH_PORT` แทนที่พอร์ต SSH เมื่อมีการโฆษณา `sshPort` (เดิม: `OPENCLAW_SSH_PORT`)
- `OPENCLAW_TAILNET_DNS` เผยแพร่คำใบ้ MagicDNS ใน TXT เมื่อเปิดใช้โหมดเต็มของ mDNS (เดิม: `OPENCLAW_TAILNET_DNS`)
- `OPENCLAW_CLI_PATH` แทนที่เส้นทาง CLI ที่โฆษณา (เดิม: `OPENCLAW_CLI_PATH`)

## เอกสารที่เกี่ยวข้อง

- นโยบายการค้นหาและการเลือกทรานสปอร์ต: [การค้นหา](/th/gateway/discovery)
- การจับคู่ Node + การอนุมัติ: [การจับคู่ Gateway](/th/gateway/pairing)
