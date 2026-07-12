---
read_when:
    - คุณต้องการจับคู่แอป Node บนอุปกรณ์เคลื่อนที่กับ Gateway อย่างรวดเร็ว
    - คุณต้องมีเอาต์พุตรหัสการตั้งค่าสำหรับการแชร์จากระยะไกล/ด้วยตนเอง
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw qr` (สร้าง QR สำหรับจับคู่กับอุปกรณ์เคลื่อนที่และรหัสตั้งค่า)
title: QR
x-i18n:
    generated_at: "2026-07-12T15:54:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32641ff4e8035f6ca2eda849a59146125763af21c4105ae6cfa584da31ac070f
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

สร้าง QR สำหรับจับคู่กับอุปกรณ์มือถือและรหัสตั้งค่าจากการกำหนดค่า Gateway ปัจจุบันของคุณ

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

แอป OpenClaw อย่างเป็นทางการสำหรับ iOS และ Android จะเชื่อมต่อโดยอัตโนมัติเมื่อข้อมูลเมตาของรหัสตั้งค่าตรงกัน หากคำขอยังคงรอดำเนินการอยู่ (เช่น มาจากไคลเอนต์ที่ไม่เป็นทางการหรือข้อมูลเมตาไม่ตรงกัน) ให้ตรวจสอบและอนุมัติคำขอนั้น:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## ตัวเลือก

- `--remote`: เลือกใช้ `gateway.remote.url` ก่อน หากไม่ได้ตั้งค่า URL ดังกล่าว จะใช้ `gateway.tailscale.mode=serve|funnel` แทน โดยไม่ใช้ `publicUrl` ของ Plugin `device-pair`
- `--url <url>`: แทนที่ URL ของ Gateway ที่ใช้ในเพย์โหลด
- `--public-url <url>`: แทนที่ URL สาธารณะที่ใช้ในเพย์โหลด
- `--token <token>`: แทนที่โทเค็นของ Gateway ที่โฟลว์เริ่มต้นระบบใช้ยืนยันตัวตน
- `--password <password>`: แทนที่รหัสผ่านของ Gateway ที่โฟลว์เริ่มต้นระบบใช้ยืนยันตัวตน
- `--setup-code-only`: แสดงเฉพาะรหัสตั้งค่า
- `--no-ascii`: ข้ามการแสดง QR แบบ ASCII
- `--json`: ส่งออก JSON (`setupCode`, `gatewayUrl`, `gatewayUrls` ซึ่งมีหรือไม่มีก็ได้, `auth`, `urlSource`)

ไม่สามารถใช้ `--token` และ `--password` พร้อมกันได้

## เนื้อหาของรหัสตั้งค่า

รหัสตั้งค่าประกอบด้วย `bootstrapToken` แบบทึบแสงที่มีอายุสั้น ไม่ใช่โทเค็น/รหัสผ่านร่วมของ Gateway โฟลว์เริ่มต้นระบบในตัวจะออก:

- โทเค็น `node` หลักที่มี `scopes: []`
- โทเค็นส่งต่อ `operator` ที่มีขอบเขตจำกัดเฉพาะ `operator.approvals`, `operator.read`, `operator.talk.secrets` และ `operator.write`

ขอบเขตที่แก้ไขการจับคู่และ `operator.admin` ยังคงต้องใช้การจับคู่ operator ที่ได้รับอนุมัติแยกต่างหากหรือโฟลว์โทเค็น

## การกำหนด URL ของ Gateway

การจับคู่กับอุปกรณ์มือถือจะปฏิเสธการเชื่อมต่อโดยค่าเริ่มต้นสำหรับ URL ของ Gateway แบบ `ws://` ที่เป็น Tailscale/สาธารณะ โดยให้ใช้ Tailscale Serve/Funnel หรือ URL ของ Gateway แบบ `wss://` แทน ส่วนที่อยู่ LAN ส่วนตัวและโฮสต์ Bonjour แบบ `.local` ยังคงรองรับผ่าน `ws://` แบบไม่เข้ารหัส

เมื่อ URL ของ Gateway ที่เลือกมาจาก `gateway.bind=lan` OpenClaw จะตรวจสอบเส้นทางถาวรจาก `tailscale serve status --json` ด้วย โดยจะรวมรากของ HTTPS Serve ที่พร็อกซีไปยังพอร์ต local loopback ของ Gateway ที่ใช้งานอยู่เป็นเส้นทางสำรอง คำสั่ง QR จะเพิ่มเส้นทางสำรองนี้เฉพาะสำหรับ `lan` เท่านั้น ส่วน `custom` และ `tailnet` จะคงเส้นทางที่ประกาศไว้อย่างชัดเจน ไคลเอนต์ iOS ปัจจุบันจะตรวจสอบเส้นทางที่ประกาศตามลำดับและบันทึกเส้นทางแรกที่เข้าถึงได้ ส่วนฟิลด์ `url` แบบเดิมจะไม่เปลี่ยนแปลงเพื่อรองรับไคลเอนต์รุ่นเก่า

เมื่อใช้ `--remote` ต้องกำหนดค่า `gateway.remote.url` หรือ `gateway.tailscale.mode=serve|funnel` อย่างใดอย่างหนึ่ง

## การกำหนดข้อมูลยืนยันตัวตน (ไม่ใช้ `--remote`)

เมื่อไม่ได้ส่งตัวเลือกแทนที่ข้อมูลยืนยันตัวตนผ่าน CLI ระบบจะแก้ไข SecretRefs สำหรับการยืนยันตัวตนของ Gateway ภายในเครื่องดังนี้:

| เงื่อนไข                                                                                                                    | ค่าที่ใช้                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"` หรือโหมดที่อนุมานได้เมื่อไม่มีแหล่งรหัสผ่านที่มีสิทธิ์เหนือกว่า                                                | `gateway.auth.token`                      |
| `gateway.auth.mode="password"` หรือโหมดที่อนุมานได้เมื่อไม่มีโทเค็นที่มีสิทธิ์เหนือกว่าจากการยืนยันตัวตน/ตัวแปรสภาพแวดล้อม                                         | `gateway.auth.password`                   |
| มีการกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) และไม่ได้ตั้งค่า `gateway.auth.mode` | ล้มเหลว โปรดตั้งค่า `gateway.auth.mode` อย่างชัดเจน |

## การกำหนดข้อมูลยืนยันตัวตน (`--remote`)

หากข้อมูลยืนยันตัวตนระยะไกลที่มีผลใช้งานถูกกำหนดค่าเป็น SecretRefs และไม่ได้ส่งทั้ง `--token` และ `--password` คำสั่งจะแก้ไขค่าจากสแนปช็อต Gateway ที่ใช้งานอยู่ หาก Gateway ไม่พร้อมใช้งาน คำสั่งจะล้มเหลวทันที

<Note>
เส้นทางคำสั่งนี้ต้องใช้ Gateway ที่รองรับเมธอด RPC `secrets.resolve` Gateway รุ่นเก่าจะส่งคืนข้อผิดพลาดว่าไม่รู้จักเมธอด
</Note>

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [อุปกรณ์](/th/cli/devices)
- [การจับคู่](/th/cli/pairing)
