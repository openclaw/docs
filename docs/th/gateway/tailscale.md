---
read_when:
    - การเปิดเผย UI ควบคุม Gateway นอก localhost
    - การทำให้การเข้าถึงแดชบอร์ดผ่าน tailnet หรือแบบสาธารณะเป็นอัตโนมัติ
summary: ผสานรวม Tailscale Serve/Funnel สำหรับแดชบอร์ด Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-07-12T16:14:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw สามารถกำหนดค่า Tailscale **Serve** (tailnet) หรือ **Funnel** (สาธารณะ) โดยอัตโนมัติสำหรับแดชบอร์ด Gateway และพอร์ต WebSocket ได้ วิธีนี้ทำให้ Gateway ยังคงผูกอยู่กับ local loopback ขณะที่ Tailscale ให้บริการ HTTPS, การกำหนดเส้นทาง และส่วนหัวข้อมูลประจำตัว (สำหรับ Serve)

## โหมด

`gateway.tailscale.mode`:

| โหมด            | ลักษณะการทำงาน                                                                    |
| --------------- | --------------------------------------------------------------------------- |
| `serve`         | Serve เฉพาะ tailnet ผ่าน `tailscale serve` โดย Gateway ยังคงอยู่บน `127.0.0.1` |
| `funnel`        | HTTPS สาธารณะผ่าน `tailscale funnel` ต้องใช้รหัสผ่านที่ใช้ร่วมกัน            |
| `off` (ค่าเริ่มต้น) | ไม่มีการทำงานอัตโนมัติของ Tailscale                                                    |

ผลลัพธ์สถานะและการตรวจสอบใช้คำว่า **การเปิดให้เข้าถึงผ่าน Tailscale** สำหรับโหมด Serve/Funnel ของ OpenClaw นี้ `off` หมายความว่า OpenClaw ไม่ได้จัดการ Serve หรือ Funnel ไม่ได้หมายความว่า daemon ของ Tailscale ในเครื่องหยุดทำงานหรือออกจากระบบแล้ว

## ตัวอย่างการกำหนดค่า

### เฉพาะ Tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

เปิด: `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดค่าไว้)

หากต้องการเปิดให้เข้าถึง Control UI ผ่าน Tailscale Service ที่มีชื่อแทนชื่อโฮสต์ของอุปกรณ์ ให้ตั้งค่า `gateway.tailscale.serviceName` เป็นชื่อ Service:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

จากนั้นเมื่อเริ่มต้น ระบบจะรายงาน URL ของ Service เป็น `https://openclaw.<tailnet-name>.ts.net/` แทนชื่อโฮสต์ของอุปกรณ์ Tailscale Services กำหนดให้โฮสต์เป็น Node ที่ติดแท็กและได้รับอนุมัติใน tailnet ของคุณ — กำหนดค่าแท็กและอนุมัติ Service ใน Tailscale ก่อนเปิดใช้งาน มิฉะนั้น `tailscale serve --service=...` จะล้มเหลวระหว่างการเริ่มต้น Gateway

### เฉพาะ Tailnet (ผูกกับ IP ของ Tailnet)

ใช้การตั้งค่านี้เพื่อให้ Gateway รับฟังโดยตรงบน IP ของ Tailnet โดยไม่มี Serve/Funnel:

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

เชื่อมต่อจากอุปกรณ์อื่นใน Tailnet:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
เมื่อมี IPv4 ของ Tailnet ที่สามารถผูกได้ Gateway จะกำหนดให้ไคลเอนต์บนโฮสต์เดียวกันที่ผ่านการยืนยันตัวตนใช้ `http://127.0.0.1:18789` ได้ด้วย หากไม่มีที่อยู่ Tailnet ขณะเริ่มต้น ระบบจะถอยกลับไปใช้เฉพาะ local loopback ให้เริ่มระบบใหม่หลังจาก Tailscale พร้อมใช้งานเพื่อเพิ่มการเข้าถึง Tailnet โดยตรง ทั้งสองเส้นทางนี้ไม่เพิ่มการเปิดให้เข้าถึงจาก LAN หรือสาธารณะ
</Note>

### อินเทอร์เน็ตสาธารณะ (Funnel + รหัสผ่านที่ใช้ร่วมกัน)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

ควรใช้ `OPENCLAW_GATEWAY_PASSWORD` แทนการบันทึกรหัสผ่านลงดิสก์

## ตัวอย่าง CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## การยืนยันตัวตน

`gateway.auth.mode` ควบคุมการจับมือเชื่อมต่อ:

| โหมด                                                   | กรณีใช้งาน                                                                            |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `none`                                                 | เฉพาะทราฟฟิกขาเข้าส่วนตัว                                                                |
| `token` (ค่าเริ่มต้นเมื่อตั้งค่า `OPENCLAW_GATEWAY_TOKEN`) | โทเค็นที่ใช้ร่วมกัน                                                                        |
| `password`                                             | ข้อมูลลับที่ใช้ร่วมกันผ่าน `OPENCLAW_GATEWAY_PASSWORD` หรือการกำหนดค่า                             |
| `trusted-proxy`                                        | พร็อกซีย้อนกลับที่รับรู้ข้อมูลประจำตัว ดู[การยืนยันตัวตนผ่านพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth) |

### ส่วนหัวข้อมูลประจำตัวของ Tailscale (เฉพาะ Serve)

เมื่อ `tailscale.mode: "serve"` และ `gateway.auth.allowTailscale` เป็น `true` การยืนยันตัวตนของ Control UI/WebSocket สามารถใช้ส่วนหัวข้อมูลประจำตัวของ Tailscale (`tailscale-user-login`) แทนโทเค็น/รหัสผ่านได้ OpenClaw ตรวจสอบส่วนหัวโดยใช้ daemon ของ Tailscale ในเครื่อง (`tailscale whois`) เพื่อแปลงที่อยู่ `x-forwarded-for` ของคำขอ และจับคู่กับข้อมูลเข้าสู่ระบบในส่วนหัวก่อนยอมรับคำขอ คำขอจะเข้าเกณฑ์สำหรับเส้นทางนี้ต่อเมื่อมาจาก local loopback พร้อมส่วนหัว `x-forwarded-for`, `x-forwarded-proto` และ `x-forwarded-host` ของ Tailscale เท่านั้น

กระบวนการที่ไม่ใช้โทเค็นนี้ตั้งสมมติฐานว่าโฮสต์ Gateway เชื่อถือได้ หากอาจมีโค้ดในเครื่องที่ไม่น่าเชื่อถือทำงานบนโฮสต์เดียวกัน ให้ตั้งค่า `gateway.auth.allowTailscale: false` และกำหนดให้ใช้การยืนยันตัวตนด้วยโทเค็น/รหัสผ่านแทน

ขอบเขตของการข้ามขั้นตอน:

- ใช้เฉพาะกับพื้นผิวการยืนยันตัวตนของ WebSocket สำหรับ Control UI เท่านั้น ปลายทาง HTTP API (`/v1/*`, `/tools/invoke`, `/api/channels/*` เป็นต้น) จะไม่ใช้การยืนยันตัวตนด้วยส่วนหัวข้อมูลประจำตัวของ Tailscale และจะใช้โหมดการยืนยันตัวตน HTTP ปกติของ Gateway เสมอ
- สำหรับเซสชันผู้ควบคุม Control UI ที่มีข้อมูลประจำตัวอุปกรณ์ของเบราว์เซอร์อยู่แล้ว ข้อมูลประจำตัว Tailscale ที่ผ่านการตรวจสอบจะข้ามขั้นตอนแบบไปกลับของการจับคู่ด้วยโทเค็นเริ่มต้น/คิวอาร์โค้ด
- กระบวนการนี้ไม่ข้ามข้อมูลประจำตัวของอุปกรณ์: ไคลเอนต์ที่ไม่มีข้อมูลประจำตัวอุปกรณ์ยังคงถูกปฏิเสธ และการเชื่อมต่อบทบาท Node ยังคงผ่านการจับคู่และการตรวจสอบการยืนยันตัวตนตามปกติ

## หมายเหตุ

- Tailscale Serve/Funnel กำหนดให้ติดตั้ง CLI `tailscale` และเข้าสู่ระบบแล้ว
- `tailscale.mode: "funnel"` จะปฏิเสธการเริ่มต้น เว้นแต่โหมดการยืนยันตัวตนเป็น `password` เพื่อหลีกเลี่ยงการเปิดให้สาธารณะเข้าถึง
- `gateway.tailscale.serviceName` ใช้เฉพาะกับโหมด Serve และจะถูกส่งไปยัง `tailscale serve --service=<name>` ค่าต้องใช้รูปแบบ `svc:<dns-label>` ของ Tailscale เช่น `svc:openclaw` Tailscale กำหนดให้โฮสต์ของ Service เป็น Node ที่ติดแท็ก และ Service อาจต้องได้รับการอนุมัติจากคอนโซลผู้ดูแลก่อนที่ Serve จะเผยแพร่ได้
- `gateway.tailscale.resetOnExit` ย้อนคืนการกำหนดค่า `tailscale serve`/`tailscale funnel` เมื่อปิดระบบ
- `gateway.tailscale.preserveFunnel: true` ทำให้เส้นทาง `tailscale funnel` ที่กำหนดค่าจากภายนอกยังคงทำงานเมื่อเริ่ม Gateway ใหม่ เมื่อใช้ `mode: "serve"` OpenClaw จะตรวจสอบ `tailscale funnel status` ก่อนใช้ Serve อีกครั้ง และข้ามการดำเนินการเมื่อมีเส้นทาง Funnel ครอบคลุมพอร์ต Gateway อยู่แล้ว นโยบายที่กำหนดให้ Funnel ที่ OpenClaw จัดการใช้เฉพาะรหัสผ่านยังคงไม่เปลี่ยนแปลง
- `gateway.bind: "tailnet"` ใช้การผูกกับ Tailnet โดยตรง (ไม่มี HTTPS และไม่มี Serve/Funnel) พร้อม local `127.0.0.1` ที่จำเป็นเมื่อมี IPv4 ของ Tailnet มิฉะนั้นจะถอยกลับไปใช้เฉพาะ local loopback
- `gateway.bind: "auto"` เลือก local loopback ก่อน ใช้ `tailnet` เพื่อจำกัดการเปิดให้เครือข่ายเข้าถึงไว้เฉพาะ Tailnet ขณะยังคงให้เข้าถึงผ่าน local loopback จากโฮสต์เดียวกันได้
- Serve/Funnel เปิดให้เข้าถึงเฉพาะ **Control UI + WS ของ Gateway** เท่านั้น Node เชื่อมต่อผ่านปลายทาง WS ของ Gateway เดียวกัน ดังนั้น Serve จึงรองรับการเข้าถึง Node ด้วย

### ข้อกำหนดเบื้องต้นและข้อจำกัดของ Tailscale

- Serve กำหนดให้เปิดใช้งาน HTTPS สำหรับ tailnet ของคุณ CLI จะแจ้งให้ดำเนินการหากยังไม่ได้เปิด
- Serve แทรกส่วนหัวข้อมูลประจำตัวของ Tailscale แต่ Funnel ไม่ทำเช่นนั้น
- Funnel ต้องใช้ Tailscale v1.38.3 ขึ้นไป, MagicDNS, เปิดใช้งาน HTTPS และแอตทริบิวต์ Node สำหรับ Funnel
- Funnel รองรับเฉพาะพอร์ต `443`, `8443` และ `10000` ผ่าน TLS
- Funnel บน macOS ต้องใช้แอป Tailscale รุ่นโอเพนซอร์ส

## การควบคุมเบราว์เซอร์ (Gateway ระยะไกล + เบราว์เซอร์ในเครื่อง)

หากต้องการเรียกใช้ Gateway บนเครื่องหนึ่งแต่ควบคุมเบราว์เซอร์บนอีกเครื่อง ให้เรียกใช้ **โฮสต์ Node** บนเครื่องที่มีเบราว์เซอร์ และให้อุปกรณ์ทั้งสองอยู่ใน tailnet เดียวกัน Gateway จะพร็อกซีการดำเนินการของเบราว์เซอร์ไปยัง Node โดยไม่ต้องมีเซิร์ฟเวอร์ควบคุมหรือ URL ของ Serve แยกต่างหาก

หลีกเลี่ยงการใช้ Funnel สำหรับการควบคุมเบราว์เซอร์ ให้ถือว่าการจับคู่ Node เป็นการเข้าถึงระดับผู้ควบคุม

## เรียนรู้เพิ่มเติม

- ภาพรวม Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- คำสั่ง `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- ภาพรวม Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- คำสั่ง `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## ที่เกี่ยวข้อง

- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [การค้นหา](/th/gateway/discovery)
- [การยืนยันตัวตน](/th/gateway/authentication)
