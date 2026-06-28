---
read_when:
    - การดีบักปัญหาการค้นพบ Bonjour บน macOS/iOS
    - การเปลี่ยนประเภทบริการ mDNS, ระเบียน TXT หรือประสบการณ์ผู้ใช้ในการค้นพบ
summary: การค้นพบและการดีบัก Bonjour/mDNS (บีคอน Gateway, ไคลเอนต์ และรูปแบบความล้มเหลวที่พบบ่อย)
title: การค้นพบ Bonjour
x-i18n:
    generated_at: "2026-05-12T12:50:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05892ee8f0dc880f68f7cf024de9452b8d999ff1af3c7ca9850fb4f2d732af0c
    source_path: gateway/bonjour.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw สามารถใช้ Bonjour (mDNS / DNS-SD) เพื่อค้นหา Gateway ที่ใช้งานอยู่ (WebSocket endpoint) ได้
การ browse แบบ multicast `local.` เป็น **ความสะดวกเฉพาะ LAN เท่านั้น** Plugin `bonjour`
ที่รวมมาด้วยเป็นเจ้าของการโฆษณาบน LAN โดยจะเริ่มทำงานอัตโนมัติบนโฮสต์ macOS และต้องเลือกเปิดใช้เองบน
Linux, Windows และการปรับใช้ Gateway ในคอนเทนเนอร์ สำหรับการค้นหาข้ามเครือข่าย beacon เดียวกัน
ยังสามารถเผยแพร่ผ่านโดเมน wide-area DNS-SD ที่กำหนดค่าไว้ได้ด้วย การค้นหา
ยังคงเป็นแบบ best-effort และ **ไม่** แทนที่การเชื่อมต่อผ่าน SSH หรือ Tailnet

## Wide-area Bonjour (Unicast DNS-SD) ผ่าน Tailscale

หาก node และ gateway อยู่คนละเครือข่าย multicast mDNS จะไม่ข้าม
ขอบเขตนั้น คุณสามารถคง UX การค้นหาเดิมไว้ได้โดยเปลี่ยนไปใช้ **unicast DNS-SD**
("Wide-Area Bonjour") ผ่าน Tailscale

ขั้นตอนระดับสูง:

1. รัน DNS server บนโฮสต์ gateway (เข้าถึงได้ผ่าน Tailnet)
2. เผยแพร่ระเบียน DNS-SD สำหรับ `_openclaw-gw._tcp` ภายใต้โซนเฉพาะ
   (ตัวอย่าง: `openclaw.internal.`)
3. กำหนดค่า Tailscale **split DNS** เพื่อให้โดเมนที่คุณเลือก resolve ผ่าน
   DNS server นั้นสำหรับ client (รวมถึง iOS)

OpenClaw รองรับโดเมนค้นหาใดก็ได้; `openclaw.internal.` เป็นเพียงตัวอย่าง
node iOS/Android จะ browse ทั้ง `local.` และโดเมน wide-area ที่คุณกำหนดค่าไว้

### การกำหนดค่า Gateway (แนะนำ)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### การตั้งค่า DNS server ครั้งเดียว (โฮสต์ gateway)

```bash
openclaw dns setup --apply
```

คำสั่งนี้ติดตั้ง CoreDNS และกำหนดค่าให้:

- listen บนพอร์ต 53 เฉพาะบนอินเทอร์เฟซ Tailscale ของ gateway
- ให้บริการโดเมนที่คุณเลือก (ตัวอย่าง: `openclaw.internal.`) จาก `~/.openclaw/dns/<domain>.db`

ตรวจสอบจากเครื่องที่เชื่อมต่อกับ tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### การตั้งค่า DNS ของ Tailscale

ในคอนโซลผู้ดูแลระบบ Tailscale:

- เพิ่ม nameserver ที่ชี้ไปยัง IP tailnet ของ gateway (UDP/TCP 53)
- เพิ่ม split DNS เพื่อให้โดเมนค้นหาของคุณใช้ nameserver นั้น

เมื่อ client ยอมรับ DNS ของ tailnet แล้ว node iOS และการค้นหาของ CLI จะสามารถ browse
`_openclaw-gw._tcp` ในโดเมนค้นหาของคุณได้โดยไม่ต้องใช้ multicast

### ความปลอดภัยของ Gateway listener (แนะนำ)

พอร์ต WS ของ Gateway (ค่าเริ่มต้น `18789`) bind กับ loopback โดยค่าเริ่มต้น สำหรับการเข้าถึงผ่าน LAN/tailnet
ให้ bind อย่างชัดเจนและเปิด auth ไว้

สำหรับการตั้งค่าแบบ tailnet-only:

- ตั้งค่า `gateway.bind: "tailnet"` ใน `~/.openclaw/openclaw.json`
- รีสตาร์ท Gateway (หรือรีสตาร์ทแอป menubar บน macOS)

## สิ่งที่โฆษณา

มีเพียง Gateway ที่โฆษณา `_openclaw-gw._tcp` การโฆษณาแบบ multicast บน LAN
จัดให้โดย Plugin `bonjour` ที่รวมมาด้วยเมื่อเปิดใช้ Plugin; ส่วนการเผยแพร่
DNS-SD แบบ wide-area ยังคงเป็นของ Gateway

## ประเภทบริการ

- `_openclaw-gw._tcp` - beacon สำหรับการขนส่งของ gateway (ใช้โดย node macOS/iOS/Android)

## คีย์ TXT (hint ที่ไม่ใช่ความลับ)

Gateway โฆษณา hint ขนาดเล็กที่ไม่ใช่ความลับเพื่อให้โฟลว์ UI สะดวก:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (เฉพาะเมื่อเปิดใช้ TLS)
- `gatewayTlsSha256=<sha256>` (เฉพาะเมื่อเปิดใช้ TLS และมี fingerprint)
- `canvasPort=<port>` (เฉพาะเมื่อเปิดใช้โฮสต์ canvas; ปัจจุบันเหมือนกับ `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (เฉพาะโหมด mDNS แบบ full, เป็น hint เสริมเมื่อมี Tailnet)
- `sshPort=<port>` (เฉพาะโหมด full; ไม่รวมในโหมด minimal และ off)
- `cliPath=<path>` (เฉพาะโหมด full; ไม่รวมในโหมด minimal และ off)

หมายเหตุด้านความปลอดภัย:

- ระเบียน TXT ของ Bonjour/mDNS **ไม่ได้ผ่านการตรวจสอบตัวตน** client ต้องไม่ถือว่า TXT เป็นข้อมูล routing ที่เชื่อถือได้
- client ควร route โดยใช้ service endpoint ที่ resolve แล้ว (SRV + A/AAAA) ให้ถือว่า `lanHost`, `tailnetDns`, `gatewayPort` และ `gatewayTlsSha256` เป็นเพียง hint เท่านั้น
- การตั้งเป้าหมาย SSH อัตโนมัติก็ควรใช้ service host ที่ resolve แล้วเช่นกัน ไม่ใช่ hint จาก TXT เท่านั้น
- TLS pinning ต้องไม่อนุญาตให้ `gatewayTlsSha256` ที่โฆษณามา override pin ที่เคยจัดเก็บไว้
- node iOS/Android ควรถือว่าการเชื่อมต่อโดยตรงจากการค้นหาเป็น **TLS-only** และต้องให้ผู้ใช้ยืนยันอย่างชัดเจนก่อนเชื่อถือ fingerprint ครั้งแรก

## การดีบักบน macOS

เครื่องมือที่มีในตัวและมีประโยชน์:

- Browse instance:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Resolve instance หนึ่งรายการ (แทนที่ `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

หาก browse ได้แต่ resolve ล้มเหลว โดยปกติคุณมักเจอนโยบาย LAN หรือ
ปัญหากับ mDNS resolver

## การดีบักใน log ของ Gateway

Gateway เขียนไฟล์ log แบบ rolling (พิมพ์ตอนเริ่มต้นเป็น
`gateway log file: ...`) ให้มองหาบรรทัด `bonjour:` โดยเฉพาะ:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

watchdog ถือว่าสถานะ `probing`, `announcing` ที่ใช้งานอยู่ และการเปลี่ยนชื่อหลัง conflict ที่ยังใหม่
เป็นสถานะที่กำลังดำเนินการ หากบริการไม่เคยไปถึง `announced` ในที่สุด OpenClaw จะ
สร้าง advertiser ใหม่ และหลังจากล้มเหลวซ้ำ ๆ จะปิดใช้ Bonjour สำหรับ
โปรเซส Gateway นั้นแทนที่จะโฆษณาซ้ำไปเรื่อย ๆ

Bonjour ใช้ hostname ของระบบสำหรับโฮสต์ `.local` ที่โฆษณาเมื่อเป็น
DNS label ที่ถูกต้อง หาก hostname ของระบบมีช่องว่าง underscore หรืออักขระอื่น
ที่ไม่ถูกต้องสำหรับ DNS-label OpenClaw จะ fallback ไปที่ `openclaw.local` ตั้งค่า
`OPENCLAW_MDNS_HOSTNAME=<name>` ก่อนเริ่ม Gateway เมื่อคุณต้องการ
host label แบบชัดเจน

## การดีบักบน node iOS

node iOS ใช้ `NWBrowser` เพื่อค้นหา `_openclaw-gw._tcp`

เพื่อเก็บ log:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → ทำซ้ำปัญหา → **Copy**

log จะรวมการเปลี่ยนสถานะของ browser และการเปลี่ยนแปลงของ result-set

## เมื่อใดควรเปิดใช้ Bonjour

Bonjour จะเริ่มอัตโนมัติสำหรับการเริ่ม Gateway แบบ empty-config บนโฮสต์ macOS เพราะ
แอป local และ node iOS/Android ที่อยู่ใกล้กันมักพึ่งพาการค้นหาใน LAN เดียวกัน

เปิดใช้ Bonjour อย่างชัดเจนเมื่อการค้นหาอัตโนมัติใน LAN เดียวกันมีประโยชน์บน Linux,
Windows หรือโฮสต์อื่นที่ไม่ใช่ macOS:

```bash
openclaw plugins enable bonjour
```

เมื่อเปิดใช้ Bonjour จะใช้ `discovery.mdns.mode` เพื่อตัดสินใจว่าจะเผยแพร่ metadata TXT
มากเท่าใด โหมดเดียวกันนี้ควบคุม hint TXT เสริมในระเบียน DNS-SD แบบ wide-area ด้วย
โหมดเริ่มต้นคือ `minimal`; ใช้ `full` เฉพาะเมื่อ client ต้องการ hint `cliPath` หรือ
`sshPort` ใช้ `off` เพื่อระงับ multicast บน LAN โดยไม่เปลี่ยนการเปิดใช้ Plugin;
wide-area DNS-SD ยังสามารถเผยแพร่ beacon ของ Gateway แบบ minimal ได้เมื่อ
`discovery.wideArea.enabled` เป็น true

## เมื่อใดควรปิดใช้ Bonjour

ปล่อยให้ Bonjour ปิดอยู่เมื่อการโฆษณาแบบ multicast บน LAN ไม่จำเป็น ใช้ไม่ได้
หรือเป็นผลเสีย กรณีที่พบบ่อยคือ server ที่ไม่ใช่ macOS, Docker bridge networking,
WSL หรือนโยบายเครือข่ายที่ drop mDNS multicast ในสภาพแวดล้อมเหล่านั้น
Gateway ยังเข้าถึงได้ผ่าน URL ที่เผยแพร่ไว้, SSH, Tailnet หรือ wide-area
DNS-SD แต่การค้นหาอัตโนมัติบน LAN ไม่น่าเชื่อถือ

ควรใช้ environment override ที่มีอยู่เมื่อปัญหามีขอบเขตตามการปรับใช้:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

การตั้งค่านี้ปิดการโฆษณาแบบ multicast บน LAN โดยไม่เปลี่ยนการกำหนดค่า Plugin
ปลอดภัยสำหรับ Docker image, service file, launch script และการดีบักเฉพาะครั้ง
เพราะการตั้งค่านี้หายไปเมื่อ environment หายไป

ใช้การกำหนดค่า Plugin เมื่อคุณตั้งใจปิด Plugin การค้นหา LAN ที่รวมมาด้วย
สำหรับ config ของ OpenClaw นั้น:

```bash
openclaw plugins disable bonjour
```

## ข้อควรระวังของ Docker

Plugin Bonjour ที่รวมมาด้วยจะปิดการโฆษณาแบบ multicast บน LAN อัตโนมัติในคอนเทนเนอร์
ที่ตรวจพบเมื่อไม่ได้ตั้งค่า `OPENCLAW_DISABLE_BONJOUR` เครือข่าย Docker bridge
โดยปกติจะไม่ forward mDNS multicast (`224.0.0.251:5353`) ระหว่างคอนเทนเนอร์
กับ LAN ดังนั้นการโฆษณาจากคอนเทนเนอร์จึงแทบไม่ทำให้การค้นหาใช้งานได้

ข้อควรระวังสำคัญ:

- Bonjour เริ่มอัตโนมัติบนโฮสต์ macOS และต้องเลือกเปิดใช้เองที่อื่น การปล่อยให้
  ปิดอยู่ไม่ได้หยุด Gateway; เพียงแค่ข้ามการโฆษณาแบบ multicast บน LAN
- การปิดใช้ Bonjour ไม่เปลี่ยน `gateway.bind`; Docker ยังใช้ค่าเริ่มต้นเป็น
  `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้พอร์ตโฮสต์ที่เผยแพร่ทำงานได้
- การปิดใช้ Bonjour ไม่ได้ปิด wide-area DNS-SD ใช้การค้นหาแบบ wide-area
  หรือ Tailnet เมื่อ Gateway และ node ไม่ได้อยู่บน LAN เดียวกัน
- การใช้ `OPENCLAW_CONFIG_DIR` เดียวกันนอก Docker ซ้ำจะไม่คงนโยบาย
  auto-disable ของคอนเทนเนอร์ไว้
- ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะสำหรับ host networking, macvlan หรือเครือข่ายอื่น
  ที่ทราบว่า mDNS multicast ผ่านได้; ตั้งเป็น `1` เพื่อบังคับปิด

## การแก้ปัญหาเมื่อ Bonjour ถูกปิดใช้

หาก node ไม่ค้นพบ Gateway อัตโนมัติอีกหลังการตั้งค่า Docker:

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

4. หากคุณตั้งใจเปิดใช้ Plugin Bonjour ใน Docker และบังคับโฆษณา
   ด้วย `OPENCLAW_DISABLE_BONJOUR=0` ให้ทดสอบ multicast จากโฮสต์:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   หาก browse ได้ผลว่าง หรือ log ของ Gateway แสดงการยกเลิกจาก ciao watchdog
   ซ้ำ ๆ ให้คืนค่า `OPENCLAW_DISABLE_BONJOUR=1` และใช้ route โดยตรงหรือ
   Tailnet

## โหมดความล้มเหลวที่พบบ่อย

- **Bonjour ไม่ข้ามเครือข่าย**: ใช้ Tailnet หรือ SSH
- **Multicast ถูกบล็อก**: เครือข่าย Wi-Fi บางแห่งปิดใช้ mDNS
- **Advertiser ค้างอยู่ใน probing/announcing**: โฮสต์ที่ multicast ถูกบล็อก,
  bridge ของคอนเทนเนอร์, WSL หรือการเปลี่ยนแปลงของอินเทอร์เฟซอาจทำให้ ciao advertiser อยู่ใน
  สถานะที่ยังไม่ announced OpenClaw จะลองซ้ำไม่กี่ครั้งแล้วปิดใช้ Bonjour
  สำหรับโปรเซส Gateway ปัจจุบันแทนที่จะรีสตาร์ท advertiser ไปเรื่อย ๆ
- **Docker bridge networking**: Bonjour ปิดอัตโนมัติในคอนเทนเนอร์ที่ตรวจพบ
  ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะสำหรับ host, macvlan หรือเครือข่ายอื่น
  ที่รองรับ mDNS
- **Sleep / การเปลี่ยนแปลงของอินเทอร์เฟซ**: macOS อาจ drop ผลลัพธ์ mDNS ชั่วคราว; ลองใหม่
- **Browse ได้แต่ resolve ล้มเหลว**: ใช้ชื่อเครื่องให้ง่าย (หลีกเลี่ยง emoji หรือ
  เครื่องหมายวรรคตอน) แล้วรีสตาร์ท Gateway ชื่อ service instance มาจาก
  host name ดังนั้นชื่อที่ซับซ้อนเกินไปอาจทำให้ resolver บางตัวสับสนได้

## ชื่อ instance ที่ escape แล้ว (`\032`)

Bonjour/DNS-SD มัก escape byte ในชื่อ service instance เป็นลำดับ decimal `\DDD`
(เช่น ช่องว่างจะกลายเป็น `\032`)

- สิ่งนี้เป็นปกติในระดับโปรโตคอล
- UI ควรถอดรหัสเพื่อแสดงผล (iOS ใช้ `BonjourEscapes.decode`)

## การเปิดใช้ / ปิดใช้ / การกำหนดค่า

- โฮสต์ macOS จะเริ่มต้น Plugin การค้นหา LAN ที่บันเดิลมาให้โดยอัตโนมัติตามค่าเริ่มต้น
- `openclaw plugins enable bonjour` เปิดใช้ Plugin การค้นหา LAN ที่บันเดิลมาให้บนโฮสต์ที่ไม่ได้เปิดใช้ตามค่าเริ่มต้น
- `openclaw plugins disable bonjour` ปิดการโฆษณาแบบมัลติคาสต์บน LAN โดยปิดใช้ Plugin ที่บันเดิลมาให้
- `OPENCLAW_DISABLE_BONJOUR=1` ปิดการโฆษณาแบบมัลติคาสต์บน LAN โดยไม่เปลี่ยนการกำหนดค่า Plugin; ค่าที่ถือว่าเป็นจริงที่ยอมรับคือ `1`, `true`, `yes` และ `on` (เดิม: `OPENCLAW_DISABLE_BONJOUR`)
- `OPENCLAW_DISABLE_BONJOUR=0` บังคับเปิดการโฆษณาแบบมัลติคาสต์บน LAN รวมถึงภายในคอนเทนเนอร์ที่ตรวจพบ; ค่าที่ถือว่าเป็นเท็จที่ยอมรับคือ `0`, `false`, `no` และ `off`
- เมื่อเปิดใช้ Plugin Bonjour และไม่ได้ตั้งค่า `OPENCLAW_DISABLE_BONJOUR` ไว้ Bonjour จะโฆษณาบนโฮสต์ทั่วไปและปิดใช้อัตโนมัติภายในคอนเทนเนอร์ที่ตรวจพบ
- `gateway.bind` ใน `~/.openclaw/openclaw.json` ควบคุมโหมดการผูกของ Gateway
- `OPENCLAW_SSH_PORT` แทนที่พอร์ต SSH เมื่อมีการโฆษณา `sshPort` (เดิม: `OPENCLAW_SSH_PORT`)
- `OPENCLAW_TAILNET_DNS` เผยแพร่คำใบ้ MagicDNS ใน TXT เมื่อเปิดใช้โหมด mDNS แบบเต็ม (เดิม: `OPENCLAW_TAILNET_DNS`)
- `OPENCLAW_CLI_PATH` แทนที่เส้นทาง CLI ที่โฆษณา (เดิม: `OPENCLAW_CLI_PATH`)

## เอกสารที่เกี่ยวข้อง

- นโยบายการค้นหาและการเลือกทรานสปอร์ต: [การค้นหา](/th/gateway/discovery)
- การจับคู่ Node + การอนุมัติ: [การจับคู่ Gateway](/th/gateway/pairing)
