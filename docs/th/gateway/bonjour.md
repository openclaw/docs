---
read_when:
    - การดีบักปัญหาการค้นหา Bonjour บน macOS/iOS
    - การเปลี่ยนประเภทบริการ mDNS, ระเบียน TXT หรือประสบการณ์การค้นหา მომხმარ المستخدم
summary: การค้นหาและการดีบัก Bonjour/mDNS (บีคอนของ Gateway, ไคลเอนต์ และรูปแบบความล้มเหลวที่พบบ่อย)
title: การค้นหา Bonjour
x-i18n:
    generated_at: "2026-04-26T11:28:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: b055021bdcd92740934823dea2acf758c6ec991a15c0a315426dc359a7eea093
    source_path: gateway/bonjour.md
    workflow: 15
---

# การค้นหา Bonjour / mDNS

OpenClaw ใช้ Bonjour (mDNS / DNS‑SD) เพื่อค้นหา Gateway ที่กำลังทำงานอยู่ (ปลายทาง WebSocket)
การ browse แบบ multicast ใน `local.` เป็นเพียง**ความสะดวกภายใน LAN เท่านั้น** Plugin `bonjour`
ที่มาพร้อมกันเป็นผู้ดูแลการประกาศบน LAN และเปิดใช้งานไว้โดยค่าเริ่มต้น สำหรับการค้นหาข้ามเครือข่าย
beacon เดียวกันนี้ยังสามารถเผยแพร่ผ่านโดเมน DNS-SD แบบ wide-area ที่กำหนดค่าไว้ได้
การค้นหายังคงเป็นแบบ best-effort และ**ไม่ได้**มาแทนที่การเชื่อมต่อผ่าน SSH หรือ Tailnet

## Wide-area Bonjour (Unicast DNS-SD) ผ่าน Tailscale

หาก Node และ Gateway อยู่คนละเครือข่าย multicast mDNS จะไม่ข้าม
ขอบเขตนั้นไปได้ คุณยังคงใช้ประสบการณ์การค้นหาแบบเดิมได้โดยเปลี่ยนไปใช้ **unicast DNS‑SD**
("Wide‑Area Bonjour") ผ่าน Tailscale

ขั้นตอนระดับสูง:

1. รัน DNS server บนโฮสต์ Gateway (ที่เข้าถึงได้ผ่าน Tailnet)
2. เผยแพร่ระเบียน DNS‑SD สำหรับ `_openclaw-gw._tcp` ภายใต้โซนเฉพาะ
   (ตัวอย่าง: `openclaw.internal.`)
3. กำหนดค่า **split DNS** ใน Tailscale เพื่อให้โดเมนที่คุณเลือก resolve ผ่าน
   DNS server นั้นสำหรับไคลเอนต์ (รวมถึง iOS)

OpenClaw รองรับโดเมนการค้นหาใดก็ได้; `openclaw.internal.` เป็นเพียงตัวอย่าง
Node iOS/Android จะ browse ทั้ง `local.` และโดเมน wide‑area ที่คุณกำหนด

### คอนฟิก Gateway (แนะนำ)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (แนะนำ)
  discovery: { wideArea: { enabled: true } }, // เปิดการเผยแพร่ wide-area DNS-SD
}
```

### การตั้งค่า DNS server ครั้งเดียว (โฮสต์ Gateway)

```bash
openclaw dns setup --apply
```

คำสั่งนี้จะติดตั้ง CoreDNS และกำหนดค่าให้:

- ฟังที่พอร์ต 53 เฉพาะบนอินเทอร์เฟซ Tailscale ของ Gateway
- ให้บริการโดเมนที่คุณเลือก (ตัวอย่าง: `openclaw.internal.`) จาก `~/.openclaw/dns/<domain>.db`

ตรวจสอบจากเครื่องที่เชื่อมต่อกับ tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### การตั้งค่า DNS ของ Tailscale

ในคอนโซลผู้ดูแลของ Tailscale:

- เพิ่ม nameserver ที่ชี้ไปยัง tailnet IP ของ Gateway (UDP/TCP 53)
- เพิ่ม split DNS เพื่อให้โดเมนค้นหาของคุณใช้ nameserver นั้น

เมื่อไคลเอนต์ยอมรับ DNS ของ tailnet แล้ว Node iOS และการค้นหาผ่าน CLI จะสามารถ browse
`_openclaw-gw._tcp` ในโดเมนค้นหาของคุณได้โดยไม่ต้องใช้ multicast

### ความปลอดภัยของตัวรับฟัง Gateway (แนะนำ)

พอร์ต WS ของ Gateway (ค่าเริ่มต้น `18789`) จะ bind กับ loopback โดยค่าเริ่มต้น สำหรับการเข้าถึงผ่าน LAN/tailnet
ให้ bind อย่างชัดเจนและเปิดการยืนยันตัวตนไว้

สำหรับการตั้งค่าแบบ tailnet-only:

- ตั้งค่า `gateway.bind: "tailnet"` ใน `~/.openclaw/openclaw.json`
- รีสตาร์ต Gateway (หรือรีสตาร์ตแอป menubar บน macOS)

## สิ่งที่ประกาศ

มีเพียง Gateway เท่านั้นที่ประกาศ `_openclaw-gw._tcp` การประกาศ multicast บน LAN
จัดการโดย Plugin `bonjour` ที่มาพร้อมกัน ส่วนการเผยแพร่ wide-area DNS-SD
ยังคงเป็นของ Gateway

## ประเภทบริการ

- `_openclaw-gw._tcp` — beacon ของ transport สำหรับ gateway (ใช้โดย Node macOS/iOS/Android)

## คีย์ TXT (คำใบ้ที่ไม่เป็นความลับ)

Gateway จะประกาศคำใบ้ขนาดเล็กที่ไม่เป็นความลับเพื่อช่วยให้โฟลว์ใน UI ใช้งานสะดวก:

- `role=gateway`
- `displayName=<ชื่อที่เป็นมิตร>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (เฉพาะเมื่อเปิดใช้ TLS)
- `gatewayTlsSha256=<sha256>` (เฉพาะเมื่อเปิดใช้ TLS และมี fingerprint)
- `canvasPort=<port>` (เฉพาะเมื่อเปิดใช้ canvas host; ปัจจุบันเหมือนกับ `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (เฉพาะโหมด mDNS full; เป็นคำใบ้เพิ่มเติมเมื่อมี Tailnet)
- `sshPort=<port>` (เฉพาะโหมด mDNS full; wide-area DNS-SD อาจไม่ใส่)
- `cliPath=<path>` (เฉพาะโหมด mDNS full; wide-area DNS-SD ยังเขียนค่านี้เป็นคำใบ้สำหรับการติดตั้งระยะไกล)

หมายเหตุด้านความปลอดภัย:

- ระเบียน TXT ของ Bonjour/mDNS **ไม่มีการยืนยันตัวตน** ไคลเอนต์ต้องไม่ถือว่า TXT เป็นข้อมูลกำหนดเส้นทางที่เชื่อถือได้
- ไคลเอนต์ควรกำหนดเส้นทางโดยใช้ปลายทางบริการที่ resolve แล้ว (SRV + A/AAAA) ให้ถือ `lanHost`, `tailnetDns`, `gatewayPort` และ `gatewayTlsSha256` เป็นเพียงคำใบ้เท่านั้น
- การกำหนดเป้าหมาย SSH อัตโนมัติก็ควรใช้โฮสต์ของบริการที่ resolve แล้วเช่นกัน ไม่ใช่คำใบ้จาก TXT เพียงอย่างเดียว
- การ pin TLS ต้องไม่ยอมให้ `gatewayTlsSha256` ที่ประกาศมาทับ pin ที่เคยเก็บไว้ก่อนหน้า
- Node iOS/Android ควรถือว่าการเชื่อมต่อโดยตรงที่อิงจากการค้นหาเป็นแบบ**TLS-only** และต้องขอการยืนยันจากผู้ใช้อย่างชัดเจนก่อนเชื่อถือ fingerprint ที่พบเป็นครั้งแรก

## การดีบักบน macOS

เครื่องมือในตัวที่มีประโยชน์:

- Browse instance:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Resolve instance หนึ่งรายการ (แทนที่ `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

หาก browse ได้แต่ resolve ไม่สำเร็จ โดยทั่วไปแปลว่าคุณกำลังเจอปัญหานโยบาย LAN หรือ
ปัญหาของตัวแก้ไข mDNS

## การดีบักใน log ของ Gateway

Gateway จะเขียนไฟล์ log แบบหมุนเวียน (พิมพ์ตอนเริ่มต้นในรูปแบบ
`gateway log file: ...`) ให้มองหาบรรทัด `bonjour:` โดยเฉพาะ:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

## การดีบักบน Node iOS

Node บน iOS ใช้ `NWBrowser` เพื่อค้นหา `_openclaw-gw._tcp`

วิธีเก็บ log:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → ทำให้เกิดปัญหาอีกครั้ง → **Copy**

log นี้จะรวมการเปลี่ยนสถานะของ browser และการเปลี่ยนแปลงของชุดผลลัพธ์

## เมื่อใดควรปิด Bonjour

ให้ปิด Bonjour เฉพาะเมื่อการประกาศ multicast บน LAN ใช้งานไม่ได้หรือก่อปัญหา
กรณีที่พบบ่อยคือ Gateway ที่รันอยู่หลัง Docker bridge networking, WSL หรือ
นโยบายเครือข่ายที่ดรอป mDNS multicast ในสภาพแวดล้อมเหล่านั้น Gateway
ยังคงเข้าถึงได้ผ่าน URL ที่เผยแพร่ไว้, SSH, Tailnet หรือ wide-area DNS-SD
แต่การค้นหาอัตโนมัติบน LAN จะไม่เชื่อถือได้

ควรใช้ environment override ที่มีอยู่แล้วเมื่อปัญหานั้นผูกกับขอบเขตการดีพลอย:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

ค่านี้จะปิดการประกาศ multicast บน LAN โดยไม่เปลี่ยนคอนฟิกของ Plugin
ปลอดภัยสำหรับ Docker image, service file, launch script และการดีบักเฉพาะครั้ง
เพราะค่าจะหายไปเมื่อ environment นั้นหายไป

ให้ใช้คอนฟิกของ Plugin เฉพาะเมื่อคุณตั้งใจจะปิด
Plugin การค้นหาบน LAN ที่มาพร้อมกันสำหรับคอนฟิก OpenClaw นั้น:

```bash
openclaw plugins disable bonjour
```

## ข้อควรระวังใน Docker

Docker Compose ที่มาพร้อมกันจะตั้ง `OPENCLAW_DISABLE_BONJOUR=1` สำหรับบริการ Gateway
โดยค่าเริ่มต้น Docker bridge network มักไม่ส่งต่อ mDNS multicast
(`224.0.0.251:5353`) ระหว่างคอนเทนเนอร์กับ LAN ดังนั้นการเปิด Bonjour ทิ้งไว้
อาจทำให้เกิดความล้มเหลวซ้ำ ๆ ของ ciao ระหว่าง `probing` หรือ `announcing` โดยไม่ทำให้การค้นหา
ใช้งานได้จริง

ข้อควรระวังสำคัญ:

- การปิด Bonjour ไม่ได้หยุด Gateway มันเพียงหยุดการประกาศ multicast บน LAN
- การปิด Bonjour ไม่ได้เปลี่ยน `gateway.bind`; Docker ยังคงใช้ค่าเริ่มต้น
  `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้พอร์ตของโฮสต์ที่เผยแพร่ไว้ยังใช้งานได้
- การปิด Bonjour ไม่ได้ปิด wide-area DNS-SD ให้ใช้การค้นหาแบบ wide-area
  หรือ Tailnet เมื่อ Gateway และ Node ไม่ได้อยู่บน LAN เดียวกัน
- การใช้ `OPENCLAW_CONFIG_DIR` เดียวกันซ้ำนอก Docker จะไม่สืบทอดค่าเริ่มต้นของ
  Compose เว้นแต่ environment ยังคงตั้ง `OPENCLAW_DISABLE_BONJOUR`
- ให้ตั้ง `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะกับ host networking, macvlan หรือ
  เครือข่ายอื่นที่ทราบแน่ชัดว่า mDNS multicast ผ่านได้

## การแก้ปัญหาเมื่อปิด Bonjour

หาก Node ไม่ค้นพบ Gateway อัตโนมัติอีกต่อไปหลังตั้งค่า Docker:

1. ยืนยันก่อนว่า Gateway กำลังระงับการประกาศบน LAN โดยตั้งใจหรือไม่:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. ยืนยันว่าเข้าถึง Gateway ได้จริงผ่านพอร์ตที่เผยแพร่ไว้:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. ใช้ปลายทางโดยตรงเมื่อปิด Bonjour:
   - Control UI หรือเครื่องมือภายในเครื่อง: `http://127.0.0.1:18789`
   - ไคลเอนต์บน LAN: `http://<gateway-host>:18789`
   - ไคลเอนต์ข้ามเครือข่าย: Tailnet MagicDNS, Tailnet IP, SSH tunnel หรือ
     wide-area DNS-SD

4. หากคุณเปิด Bonjour ใน Docker โดยเจตนาด้วย
   `OPENCLAW_DISABLE_BONJOUR=0` ให้ทดสอบ multicast จากโฮสต์:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   หาก browse แล้วไม่พบอะไร หรือ log ของ Gateway แสดงการยกเลิก watchdog ของ ciao ซ้ำ ๆ
   ให้กลับไปใช้ `OPENCLAW_DISABLE_BONJOUR=1` และใช้เส้นทางแบบตรงหรือ
   เส้นทางผ่าน Tailnet แทน

## รูปแบบความล้มเหลวที่พบบ่อย

- **Bonjour ไม่ข้ามเครือข่าย**: ใช้ Tailnet หรือ SSH
- **multicast ถูกบล็อก**: เครือข่าย Wi‑Fi บางแห่งปิด mDNS
- **advertiser ค้างใน probing/announcing**: โฮสต์ที่ multicast ถูกบล็อก,
  container bridge, WSL หรือการสลับอินเทอร์เฟซ อาจทำให้ ciao advertiser อยู่ใน
  สถานะที่ยังไม่ประกาศ OpenClaw จะลองใหม่ไม่กี่ครั้ง แล้วปิด Bonjour
  สำหรับโปรเซส Gateway ปัจจุบันแทนการรีสตาร์ต advertiser ไม่รู้จบ
- **Docker bridge networking**: Docker Compose ที่มาพร้อมกันปิด Bonjour
  โดยค่าเริ่มต้นด้วย `OPENCLAW_DISABLE_BONJOUR=1` ให้ตั้งเป็น `0` เฉพาะกับ host,
  macvlan หรือเครือข่ายอื่นที่รองรับ mDNS
- **sleep / การสลับอินเทอร์เฟซ**: macOS อาจทำให้ผลลัพธ์ mDNS หายไปชั่วคราว; ให้ลองใหม่
- **browse ได้แต่ resolve ไม่สำเร็จ**: ใช้ชื่อเครื่องที่เรียบง่าย (หลีกเลี่ยงอีโมจิหรือ
  เครื่องหมายวรรคตอน) แล้วรีสตาร์ต Gateway ชื่อ instance ของบริการมาจาก
  ชื่อโฮสต์ ดังนั้นชื่อที่ซับซ้อนเกินไปอาจทำให้ตัว resolve บางตัวสับสน

## ชื่อ instance แบบ escape (`\032`)

Bonjour/DNS‑SD มัก escape ไบต์ในชื่อ service instance เป็นลำดับ `\DDD`
แบบเลขฐานสิบ (เช่น ช่องว่างจะกลายเป็น `\032`)

- นี่เป็นเรื่องปกติในระดับโปรโตคอล
- UI ควรถอดรหัสก่อนแสดงผล (iOS ใช้ `BonjourEscapes.decode`)

## การปิดใช้งาน / การกำหนดค่า

- `openclaw plugins disable bonjour` ปิดการประกาศ multicast บน LAN โดยปิด Plugin ที่มาพร้อมกัน
- `openclaw plugins enable bonjour` คืนค่า Plugin การค้นหาบน LAN เริ่มต้น
- `OPENCLAW_DISABLE_BONJOUR=1` ปิดการประกาศ multicast บน LAN โดยไม่เปลี่ยนคอนฟิก Plugin; ค่าที่ถือว่าเป็นจริงได้แก่ `1`, `true`, `yes` และ `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`)
- Docker Compose ตั้ง `OPENCLAW_DISABLE_BONJOUR=1` โดยค่าเริ่มต้นสำหรับ bridge networking; เขียนทับเป็น `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะเมื่อมี mDNS multicast
- `gateway.bind` ใน `~/.openclaw/openclaw.json` ใช้ควบคุมโหมด bind ของ Gateway
- `OPENCLAW_SSH_PORT` ใช้เขียนทับพอร์ต SSH เมื่อมีการประกาศ `sshPort` (legacy: `OPENCLAW_SSH_PORT`)
- `OPENCLAW_TAILNET_DNS` จะเผยแพร่คำใบ้ MagicDNS ใน TXT เมื่อเปิดใช้โหมด mDNS full (legacy: `OPENCLAW_TAILNET_DNS`)
- `OPENCLAW_CLI_PATH` ใช้เขียนทับพาธ CLI ที่ประกาศ (legacy: `OPENCLAW_CLI_PATH`)

## เอกสารที่เกี่ยวข้อง

- นโยบายการค้นหาและการเลือก transport: [Discovery](/th/gateway/discovery)
- การจับคู่ Node + การอนุมัติ: [Gateway pairing](/th/gateway/pairing)
