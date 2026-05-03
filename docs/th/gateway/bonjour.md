---
read_when:
    - การดีบักปัญหาการค้นพบ Bonjour บน macOS/iOS
    - การเปลี่ยนประเภทบริการ mDNS, ระเบียน TXT หรือประสบการณ์ผู้ใช้ในการค้นพบ
summary: การค้นพบและการดีบัก Bonjour/mDNS (บีคอนของ Gateway, ไคลเอนต์ และโหมดความล้มเหลวที่พบบ่อย)
title: การค้นพบด้วย Bonjour
x-i18n:
    generated_at: "2026-05-03T21:31:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2975fea03bc8fe8ccbd57f7a4ca8c15a59fb21b3f92c2b77b9a57ae4ebd5d374
    source_path: gateway/bonjour.md
    workflow: 16
---

# การค้นพบ Bonjour / mDNS

OpenClaw สามารถใช้ Bonjour (mDNS / DNS-SD) เพื่อค้นหา Gateway ที่ทำงานอยู่ (ปลายทาง WebSocket)
การเรียกดู multicast `local.` เป็น **ความสะดวกสำหรับ LAN เท่านั้น** Plugin `bonjour`
ที่รวมมาด้วยเป็นเจ้าของการประกาศบน LAN โดยจะเริ่มทำงานอัตโนมัติบนโฮสต์ macOS และต้องเลือกเปิดใช้บน
Linux, Windows และการปรับใช้ Gateway แบบคอนเทนเนอร์ สำหรับการค้นพบข้ามเครือข่าย beacon เดียวกัน
ยังสามารถเผยแพร่ผ่านโดเมน DNS-SD แบบ wide-area ที่กำหนดค่าไว้ได้เช่นกัน การค้นพบ
ยังคงเป็นแบบ best-effort และ **ไม่** แทนที่การเชื่อมต่อผ่าน SSH หรือ Tailnet

## Wide-area Bonjour (Unicast DNS-SD) ผ่าน Tailscale

หาก node และ gateway อยู่คนละเครือข่าย multicast mDNS จะไม่ข้ามขอบเขตนั้น
คุณสามารถคง UX การค้นพบแบบเดิมไว้ได้โดยเปลี่ยนไปใช้ **unicast DNS‑SD**
("Wide‑Area Bonjour") ผ่าน Tailscale

ขั้นตอนภาพรวม:

1. เรียกใช้เซิร์ฟเวอร์ DNS บนโฮสต์ gateway (เข้าถึงได้ผ่าน Tailnet)
2. เผยแพร่ระเบียน DNS‑SD สำหรับ `_openclaw-gw._tcp` ภายใต้โซนเฉพาะ
   (ตัวอย่าง: `openclaw.internal.`)
3. กำหนดค่า **split DNS** ของ Tailscale เพื่อให้โดเมนที่คุณเลือก resolve ผ่าน
   เซิร์ฟเวอร์ DNS นั้นสำหรับไคลเอนต์ (รวมถึง iOS)

OpenClaw รองรับโดเมนการค้นพบใดก็ได้; `openclaw.internal.` เป็นเพียงตัวอย่าง
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

- ฟังบนพอร์ต 53 เฉพาะบนอินเทอร์เฟซ Tailscale ของ gateway
- ให้บริการโดเมนที่คุณเลือก (ตัวอย่าง: `openclaw.internal.`) จาก `~/.openclaw/dns/<domain>.db`

ตรวจสอบจากเครื่องที่เชื่อมต่อ tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### การตั้งค่า DNS ของ Tailscale

ในคอนโซลผู้ดูแลระบบ Tailscale:

- เพิ่ม nameserver ที่ชี้ไปยัง IP tailnet ของ gateway (UDP/TCP 53)
- เพิ่ม split DNS เพื่อให้โดเมนการค้นพบของคุณใช้ nameserver นั้น

เมื่อไคลเอนต์ยอมรับ DNS ของ tailnet แล้ว node iOS และการค้นพบผ่าน CLI จะสามารถเรียกดู
`_openclaw-gw._tcp` ในโดเมนการค้นพบของคุณได้โดยไม่ต้องใช้ multicast

### ความปลอดภัยของ listener Gateway (แนะนำ)

พอร์ต WS ของ Gateway (ค่าเริ่มต้น `18789`) จะ bind กับ loopback โดยค่าเริ่มต้น สำหรับการเข้าถึงผ่าน LAN/tailnet
ให้ bind อย่างชัดเจนและเปิดใช้การยืนยันตัวตนไว้

สำหรับการตั้งค่าเฉพาะ tailnet:

- ตั้งค่า `gateway.bind: "tailnet"` ใน `~/.openclaw/openclaw.json`
- รีสตาร์ท Gateway (หรือรีสตาร์ทแอปแถบเมนู macOS)

## สิ่งที่ประกาศ

เฉพาะ Gateway เท่านั้นที่ประกาศ `_openclaw-gw._tcp` การประกาศ LAN multicast
จัดทำโดย Plugin `bonjour` ที่รวมมาด้วยเมื่อเปิดใช้ Plugin; การเผยแพร่
DNS-SD แบบ wide-area ยังคงเป็นของ Gateway

## ประเภทบริการ

- `_openclaw-gw._tcp` — beacon การขนส่งของ gateway (ใช้โดย node macOS/iOS/Android)

## คีย์ TXT (คำใบ้ที่ไม่ใช่ความลับ)

Gateway ประกาศคำใบ้ขนาดเล็กที่ไม่ใช่ความลับเพื่อให้โฟลว์ UI สะดวก:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (เฉพาะเมื่อเปิดใช้ TLS)
- `gatewayTlsSha256=<sha256>` (เฉพาะเมื่อเปิดใช้ TLS และมี fingerprint)
- `canvasPort=<port>` (เฉพาะเมื่อเปิดใช้ canvas host; ปัจจุบันเหมือนกับ `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (เฉพาะโหมด mDNS full, คำใบ้เสริมเมื่อมี Tailnet)
- `sshPort=<port>` (เฉพาะโหมด mDNS full; DNS-SD แบบ wide-area อาจละเว้นได้)
- `cliPath=<path>` (เฉพาะโหมด mDNS full; DNS-SD แบบ wide-area ยังคงเขียนไว้เป็นคำใบ้สำหรับการติดตั้งระยะไกล)

หมายเหตุด้านความปลอดภัย:

- ระเบียน TXT ของ Bonjour/mDNS **ไม่ได้ผ่านการยืนยันตัวตน** ไคลเอนต์ต้องไม่ถือว่า TXT เป็นข้อมูล routing ที่เชื่อถือได้
- ไคลเอนต์ควร route โดยใช้ปลายทางบริการที่ resolve แล้ว (SRV + A/AAAA) ให้ถือว่า `lanHost`, `tailnetDns`, `gatewayPort` และ `gatewayTlsSha256` เป็นเพียงคำใบ้เท่านั้น
- การกำหนดเป้าหมาย SSH อัตโนมัติก็ควรใช้โฮสต์บริการที่ resolve แล้วเช่นกัน ไม่ใช่คำใบ้จาก TXT อย่างเดียว
- TLS pinning ต้องไม่ยอมให้ `gatewayTlsSha256` ที่ประกาศมา override pin ที่จัดเก็บไว้ก่อนหน้า
- node iOS/Android ควรถือว่าการเชื่อมต่อโดยตรงจากการค้นพบเป็น **TLS-only** และต้องขอการยืนยันจากผู้ใช้อย่างชัดเจนก่อนเชื่อถือ fingerprint ครั้งแรก

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

หากเรียกดูได้แต่ resolve ไม่ได้ โดยปกติคุณกำลังเจอนโยบาย LAN หรือ
ปัญหา resolver ของ mDNS

## การดีบักในบันทึก Gateway

Gateway เขียนไฟล์บันทึกแบบ rolling (พิมพ์ตอนเริ่มต้นเป็น
`gateway log file: ...`) ให้มองหาบรรทัด `bonjour:` โดยเฉพาะ:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour ใช้ชื่อโฮสต์ของระบบสำหรับโฮสต์ `.local` ที่ประกาศเมื่อชื่อนั้นเป็น
DNS label ที่ถูกต้อง หากชื่อโฮสต์ของระบบมีช่องว่าง ขีดล่าง หรืออักขระอื่นที่ไม่ถูกต้องสำหรับ
DNS-label OpenClaw จะ fallback เป็น `openclaw.local` ตั้งค่า
`OPENCLAW_MDNS_HOSTNAME=<name>` ก่อนเริ่ม Gateway เมื่อคุณต้องการ
label โฮสต์อย่างชัดเจน

## การดีบักบน node iOS

node iOS ใช้ `NWBrowser` เพื่อค้นหา `_openclaw-gw._tcp`

วิธีเก็บบันทึก:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → ทำซ้ำขั้นตอน → **Copy**

บันทึกประกอบด้วยการเปลี่ยนสถานะของ browser และการเปลี่ยนแปลงของชุดผลลัพธ์

## ควรเปิดใช้ Bonjour เมื่อใด

Bonjour เริ่มทำงานอัตโนมัติสำหรับการเริ่มต้น Gateway แบบ config ว่างบนโฮสต์ macOS เพราะ
แอปในเครื่องและ node iOS/Android ใกล้เคียงมักพึ่งพาการค้นพบใน LAN เดียวกัน

เปิดใช้ Bonjour อย่างชัดเจนเมื่อการค้นพบอัตโนมัติใน LAN เดียวกันมีประโยชน์บน Linux,
Windows หรือโฮสต์ที่ไม่ใช่ macOS อื่น:

```bash
openclaw plugins enable bonjour
```

เมื่อเปิดใช้ Bonjour จะใช้ `discovery.mdns.mode` เพื่อตัดสินใจว่าจะเผยแพร่ metadata TXT มากน้อยเพียงใด
โหมดเริ่มต้นคือ `minimal`; ใช้ `full` เฉพาะเมื่อไคลเอนต์ในเครื่องต้องการคำใบ้
`cliPath` หรือ `sshPort` และใช้ `off` เพื่อระงับ LAN multicast โดยไม่
เปลี่ยนสถานะการเปิดใช้ Plugin

## ควรปิดใช้ Bonjour เมื่อใด

ปล่อยให้ Bonjour ปิดอยู่เมื่อการประกาศ LAN multicast ไม่จำเป็น ใช้งานไม่ได้
หรือเป็นอันตราย กรณีทั่วไปคือเซิร์ฟเวอร์ที่ไม่ใช่ macOS, เครือข่าย bridge ของ Docker,
WSL หรือนโยบายเครือข่ายที่ drop mDNS multicast ในสภาพแวดล้อมเหล่านั้น
Gateway ยังเข้าถึงได้ผ่าน URL ที่เผยแพร่, SSH, Tailnet หรือ DNS-SD
แบบ wide-area แต่การค้นพบอัตโนมัติผ่าน LAN จะไม่เสถียร

ให้ใช้ environment override ที่มีอยู่เมื่อปัญหาอยู่ในขอบเขตการปรับใช้:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

การตั้งค่านี้ปิดการประกาศ LAN multicast โดยไม่เปลี่ยนการกำหนดค่า Plugin
ปลอดภัยสำหรับอิมเมจ Docker, ไฟล์บริการ, สคริปต์ launch และการดีบักแบบครั้งเดียว
เพราะการตั้งค่าจะหายไปเมื่อ environment นั้นหมดไป

ใช้การกำหนดค่า Plugin เมื่อคุณตั้งใจปิด Plugin การค้นพบ LAN ที่รวมมาด้วย
สำหรับ config OpenClaw นั้น:

```bash
openclaw plugins disable bonjour
```

## ข้อควรระวังของ Docker

Plugin Bonjour ที่รวมมาด้วยจะปิดการประกาศ LAN multicast โดยอัตโนมัติในคอนเทนเนอร์ที่ตรวจพบ
เมื่อไม่ได้ตั้งค่า `OPENCLAW_DISABLE_BONJOUR` เครือข่าย bridge ของ Docker
มักไม่ส่งต่อ mDNS multicast (`224.0.0.251:5353`) ระหว่างคอนเทนเนอร์
กับ LAN ดังนั้นการประกาศจากคอนเทนเนอร์จึงแทบไม่ทำให้การค้นพบใช้งานได้

ข้อควรระวังสำคัญ:

- Bonjour เริ่มทำงานอัตโนมัติบนโฮสต์ macOS และต้องเลือกเปิดใช้ที่อื่น การปล่อยให้ปิดอยู่
  ไม่ได้หยุด Gateway; เพียงข้ามการประกาศ LAN multicast เท่านั้น
- การปิดใช้ Bonjour ไม่เปลี่ยน `gateway.bind`; Docker ยังมีค่าเริ่มต้นเป็น
  `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้พอร์ตโฮสต์ที่เผยแพร่ใช้งานได้
- การปิดใช้ Bonjour ไม่ได้ปิดใช้ DNS-SD แบบ wide-area ใช้การค้นพบแบบ wide-area
  หรือ Tailnet เมื่อ Gateway และ node ไม่ได้อยู่บน LAN เดียวกัน
- การใช้ `OPENCLAW_CONFIG_DIR` เดียวกันซ้ำภายนอก Docker จะไม่คงนโยบาย
  auto-disable ของคอนเทนเนอร์ไว้
- ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะสำหรับ host networking, macvlan หรือเครือข่ายอื่น
  ที่ทราบว่า mDNS multicast ผ่านได้; ตั้งเป็น `1` เพื่อบังคับปิดใช้

## การแก้ปัญหาเมื่อ Bonjour ถูกปิดใช้

หาก node ไม่ค้นพบ Gateway โดยอัตโนมัติอีกต่อไปหลังตั้งค่า Docker:

1. ยืนยันว่า Gateway กำลังทำงานในโหมด auto, forced-on หรือ forced-off:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. ยืนยันว่า Gateway เองเข้าถึงได้ผ่านพอร์ตที่เผยแพร่:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. ใช้เป้าหมายโดยตรงเมื่อ Bonjour ถูกปิดใช้:
   - Control UI หรือเครื่องมือในเครื่อง: `http://127.0.0.1:18789`
   - ไคลเอนต์ LAN: `http://<gateway-host>:18789`
   - ไคลเอนต์ข้ามเครือข่าย: Tailnet MagicDNS, IP ของ Tailnet, อุโมงค์ SSH หรือ
     DNS-SD แบบ wide-area

4. หากคุณตั้งใจเปิดใช้ Plugin Bonjour ใน Docker และบังคับการประกาศ
   ด้วย `OPENCLAW_DISABLE_BONJOUR=0` ให้ทดสอบ multicast จากโฮสต์:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   หากการเรียกดูว่างเปล่าหรือบันทึก Gateway แสดงการยกเลิกของ ciao watchdog ซ้ำๆ
   ให้คืนค่า `OPENCLAW_DISABLE_BONJOUR=1` และใช้เส้นทางโดยตรงหรือ
   Tailnet

## รูปแบบความล้มเหลวที่พบบ่อย

- **Bonjour ไม่ข้ามเครือข่าย**: ใช้ Tailnet หรือ SSH
- **Multicast ถูกบล็อก**: เครือข่าย Wi‑Fi บางแห่งปิดใช้ mDNS
- **Advertiser ค้างอยู่ใน probing/announcing**: โฮสต์ที่ multicast ถูกบล็อก,
  bridge ของคอนเทนเนอร์, WSL หรือการเปลี่ยนแปลงอินเทอร์เฟซสามารถทำให้ ciao advertiser อยู่ในสถานะ
  non-announced ได้ OpenClaw จะลองซ้ำไม่กี่ครั้งแล้วปิดใช้ Bonjour
  สำหรับ process Gateway ปัจจุบันแทนที่จะรีสตาร์ท advertiser ตลอดไป
- **เครือข่าย bridge ของ Docker**: Bonjour ปิดใช้อัตโนมัติในคอนเทนเนอร์ที่ตรวจพบ
  ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะสำหรับ host, macvlan หรือเครือข่ายอื่น
  ที่รองรับ mDNS
- **Sleep / การเปลี่ยนแปลงอินเทอร์เฟซ**: macOS อาจ drop ผลลัพธ์ mDNS ชั่วคราว; ลองใหม่
- **เรียกดูได้แต่ resolve ไม่ได้**: ใช้ชื่อเครื่องแบบเรียบง่าย (หลีกเลี่ยงอีโมจิหรือ
  เครื่องหมายวรรคตอน) แล้วรีสตาร์ท Gateway ชื่อ instance ของบริการได้มาจาก
  ชื่อโฮสต์ ดังนั้นชื่อที่ซับซ้อนเกินไปอาจทำให้ resolver บางตัวสับสน

## ชื่อ instance ที่ escape แล้ว (`\032`)

Bonjour/DNS‑SD มัก escape byte ในชื่อ instance ของบริการเป็นลำดับ `\DDD`
แบบทศนิยม (เช่น ช่องว่างกลายเป็น `\032`)

- นี่เป็นเรื่องปกติในระดับโปรโตคอล
- UI ควร decode เพื่อแสดงผล (iOS ใช้ `BonjourEscapes.decode`)

## การเปิดใช้ / การปิดใช้ / การกำหนดค่า

- โฮสต์ macOS เริ่ม Plugin การค้นพบ LAN ที่รวมมาด้วยโดยอัตโนมัติตามค่าเริ่มต้น
- `openclaw plugins enable bonjour` เปิดใช้ Plugin การค้นพบ LAN ที่รวมมาด้วยบนโฮสต์ที่ไม่ได้เปิดใช้เป็นค่าเริ่มต้น
- `openclaw plugins disable bonjour` ปิดการประกาศ LAN multicast โดยปิดใช้ Plugin ที่รวมมาด้วย
- `OPENCLAW_DISABLE_BONJOUR=1` ปิดการประกาศ LAN multicast โดยไม่เปลี่ยน config ของ Plugin; ค่าจริงที่ยอมรับคือ `1`, `true`, `yes` และ `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`)
- `OPENCLAW_DISABLE_BONJOUR=0` บังคับเปิดการประกาศ LAN multicast รวมถึงภายในคอนเทนเนอร์ที่ตรวจพบ; ค่าเท็จที่ยอมรับคือ `0`, `false`, `no` และ `off`
- เมื่อเปิดใช้ Plugin Bonjour และไม่ได้ตั้งค่า `OPENCLAW_DISABLE_BONJOUR` Bonjour จะประกาศบนโฮสต์ปกติและปิดใช้อัตโนมัติภายในคอนเทนเนอร์ที่ตรวจพบ
- `gateway.bind` ใน `~/.openclaw/openclaw.json` ควบคุมโหมด bind ของ Gateway
- `OPENCLAW_SSH_PORT` override พอร์ต SSH เมื่อมีการประกาศ `sshPort` (legacy: `OPENCLAW_SSH_PORT`)
- `OPENCLAW_TAILNET_DNS` เผยแพร่คำใบ้ MagicDNS ใน TXT เมื่อเปิดใช้โหมด mDNS full (legacy: `OPENCLAW_TAILNET_DNS`)
- `OPENCLAW_CLI_PATH` override path ของ CLI ที่ประกาศ (legacy: `OPENCLAW_CLI_PATH`)

## เอกสารที่เกี่ยวข้อง

- นโยบายการค้นพบและการเลือกการขนส่ง: [Discovery](/th/gateway/discovery)
- การจับคู่ node + การอนุมัติ: [การจับคู่ Gateway](/th/gateway/pairing)
