---
read_when:
    - การนำการอนุมัติการจับคู่ Node ไปใช้โดยไม่มี UI บน macOS
    - การเพิ่ม flow บน CLI สำหรับการอนุมัติ Node ระยะไกล
    - การขยายโปรโตคอล Gateway ด้วยการจัดการ Node
summary: การจับคู่ Node ที่ Gateway เป็นเจ้าของ (ตัวเลือก B) สำหรับ iOS และ Node ระยะไกลอื่น ๆ
title: การจับคู่ที่ Gateway เป็นเจ้าของ
x-i18n:
    generated_at: "2026-04-25T13:49:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b512fbf97e7557a1f467732f1b68d8c1b8183695e436b3f87b4c4aca1478cb5
    source_path: gateway/pairing.md
    workflow: 15
---

ในการจับคู่ที่ Gateway เป็นเจ้าของ **Gateway** คือแหล่งข้อมูลความจริงว่า Node ใด
ได้รับอนุญาตให้เข้าร่วมหรือไม่
UI ต่าง ๆ (แอป macOS, ไคลเอนต์ในอนาคต) เป็นเพียง frontend ที่ใช้อนุมัติหรือปฏิเสธคำขอที่รอดำเนินการ

**สำคัญ:** WS nodes ใช้ **device pairing** (role `node`) ระหว่าง `connect`
`node.pair.*` เป็น pairing store แยกต่างหาก และ **ไม่ได้** ใช้กั้น WS handshake
มีเพียงไคลเอนต์ที่เรียก `node.pair.*` อย่างชัดเจนเท่านั้นที่ใช้ flow นี้

## แนวคิด

- **Pending request**: มี node ขอเข้าร่วม; ต้องได้รับการอนุมัติ
- **Paired node**: node ที่ได้รับอนุมัติแล้วและมีการออก auth token ให้
- **Transport**: endpoint WS ของ Gateway ส่งต่อคำขอ แต่ไม่ได้ตัดสิน
  การเป็นสมาชิก (รองรับ legacy TCP bridge ถูกนำออกแล้ว)

## การจับคู่ทำงานอย่างไร

1. Node เชื่อมต่อกับ Gateway WS และขอจับคู่
2. Gateway จัดเก็บ **pending request** และปล่อย `node.pair.requested`
3. คุณอนุมัติหรือปฏิเสธคำขอ (ผ่าน CLI หรือ UI)
4. เมื่ออนุมัติ Gateway จะออก **token ใหม่** (token จะถูกหมุนเมื่อ re‑pair)
5. Node เชื่อมต่อใหม่โดยใช้ token และตอนนี้จะกลายเป็น “paired”

Pending requests จะหมดอายุอัตโนมัติหลัง **5 นาที**

## ขั้นตอนการทำงานบน CLI (เหมาะกับสภาพแวดล้อมแบบ headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` จะแสดง nodes ที่ paired/connected และ capabilities ของพวกมัน

## พื้นผิว API (โปรโตคอล Gateway)

Events:

- `node.pair.requested` — ปล่อยเมื่อมีการสร้าง pending request ใหม่
- `node.pair.resolved` — ปล่อยเมื่อคำขอถูกอนุมัติ/ปฏิเสธ/หมดอายุ

Methods:

- `node.pair.request` — สร้างหรือใช้ pending request เดิมซ้ำ
- `node.pair.list` — แสดงรายการ pending + paired nodes (`operator.pairing`)
- `node.pair.approve` — อนุมัติ pending request (ออก token)
- `node.pair.reject` — ปฏิเสธ pending request
- `node.pair.verify` — ตรวจสอบ `{ nodeId, token }`

หมายเหตุ:

- `node.pair.request` เป็น idempotent ต่อ node: การเรียกซ้ำจะส่งคืน
  pending request เดิม
- การขอซ้ำสำหรับ pending node เดียวกันจะรีเฟรช metadata ของ node ที่จัดเก็บไว้
  และ snapshot ของ declared commands ล่าสุดที่อยู่ใน allowlist เพื่อให้ operator มองเห็นได้
- การอนุมัติจะสร้าง token ใหม่ **ทุกครั้ง**; จะไม่มีการส่งคืน token จาก
  `node.pair.request`
- คำขอสามารถใส่ `silent: true` เป็น hint สำหรับ flow การอนุมัติอัตโนมัติ
- `node.pair.approve` ใช้ declared commands ของ pending request เพื่อบังคับใช้
  approval scopes เพิ่มเติม:
  - คำขอที่ไม่มี command: `operator.pairing`
  - คำขอ command ที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
  - คำขอ `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

สำคัญ:

- Node pairing เป็น flow ของ trust/identity พร้อมการออก token
- มัน **ไม่ได้** ปักหมุด live node command surface แยกตาม node
- live node commands มาจากสิ่งที่ node ประกาศตอน connect หลังจากมีการใช้
  นโยบาย command ระดับส่วนกลางของ gateway (`gateway.nodes.allowCommands` /
  `denyCommands`) แล้ว
- นโยบาย allow/ask ของ `system.run` แยกตาม node อยู่ที่ตัว node ใน
  `exec.approvals.node.*` ไม่ได้อยู่ใน pairing record

## การกั้น Node command (2026.3.31+)

<Warning>
**Breaking change:** เริ่มตั้งแต่ `2026.3.31` คำสั่งของ node จะถูกปิดไว้จนกว่าจะอนุมัติ node pairing การมีเพียง device pairing ไม่เพียงพออีกต่อไปสำหรับการเปิดเผย declared node commands
</Warning>

เมื่อ node เชื่อมต่อครั้งแรก ระบบจะร้องขอ pairing โดยอัตโนมัติ จนกว่าจะมีการอนุมัติ pairing request คำสั่ง node ที่รอดำเนินการทั้งหมดจาก node นั้นจะถูกกรองออกและจะไม่ถูกดำเนินการ เมื่อมีการสร้างความเชื่อถือผ่านการอนุมัติ pairing แล้ว declared commands ของ node จึงจะใช้งานได้ ภายใต้นโยบาย command ปกติ

ซึ่งหมายความว่า:

- Nodes ที่ก่อนหน้านี้อาศัยเพียง device pairing เพื่อเปิดเผย commands จะต้องทำ node pairing ให้เสร็จสมบูรณ์ก่อน
- Commands ที่เข้าคิวไว้ก่อนการอนุมัติ pairing จะถูกทิ้ง ไม่ได้ถูกเลื่อนไว้

## ขอบเขตความเชื่อถือของ Node events (2026.3.31+)

<Warning>
**Breaking change:** การรันที่มีต้นทางจาก node จะคงอยู่บนพื้นผิวที่เชื่อถือได้แบบลดรูปแล้ว
</Warning>

สรุปที่มีต้นทางจาก node และ session events ที่เกี่ยวข้อง จะถูกจำกัดไว้ในพื้นผิวที่เชื่อถือได้ตามเจตนา Notification-driven หรือ flow ที่ถูก trigger โดย node ซึ่งก่อนหน้านี้อาศัยการเข้าถึง host หรือ session tool ที่กว้างกว่า อาจต้องมีการปรับเปลี่ยน การ hardening นี้ช่วยให้มั่นใจว่า node events จะไม่สามารถยกระดับไปเป็นการเข้าถึง tool ระดับโฮสต์เกินกว่าที่ขอบเขตความเชื่อถือของ node อนุญาตได้

## การอนุมัติอัตโนมัติ (แอป macOS)

แอป macOS สามารถพยายามทำ **silent approval** ได้แบบไม่บังคับ เมื่อ:

- คำขอถูกทำเครื่องหมายว่า `silent` และ
- แอปสามารถยืนยันการเชื่อมต่อ SSH ไปยังโฮสต์ Gateway โดยใช้ผู้ใช้เดียวกันได้

หาก silent approval ล้มเหลว ระบบจะ fallback ไปยัง prompt “Approve/Reject” ตามปกติ

## การอนุมัติอัตโนมัติสำหรับอุปกรณ์ใน Trusted-CIDR

WS device pairing สำหรับ `role: node` ยังคงเป็นแบบ manual โดยค่าเริ่มต้น สำหรับ
เครือข่าย node แบบ private ที่ Gateway เชื่อถือเส้นทางเครือข่ายนั้นอยู่แล้ว ผู้ดูแลระบบสามารถ
เลือกเปิดใช้ด้วย CIDRs หรือ IP แบบตรงตัวที่ระบุอย่างชัดเจนได้:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

ขอบเขตความปลอดภัย:

- ปิดใช้งานเมื่อไม่ได้ตั้ง `gateway.nodes.pairing.autoApproveCidrs`
- ไม่มีโหมดอนุมัติอัตโนมัติแบบครอบจักรวาลสำหรับ LAN หรือ private network
- มีสิทธิ์ได้เฉพาะ device pairing แบบ `role: node` ใหม่ที่ไม่มี requested scopes
- ไคลเอนต์ operator, เบราว์เซอร์, Control UI และ WebChat ยังคงเป็นแบบ manual
- การอัปเกรด role, scope, metadata และ public-key ยังคงเป็นแบบ manual
- เส้นทาง trusted-proxy header แบบ local loopback บนโฮสต์เดียวกันไม่มีสิทธิ์ เพราะ
  เส้นทางนั้นอาจถูกปลอมแปลงโดยผู้เรียกในเครื่องได้

## การอนุมัติอัตโนมัติสำหรับการอัปเกรด metadata

เมื่ออุปกรณ์ที่จับคู่แล้วเชื่อมต่อใหม่โดยมีการเปลี่ยนแปลงเฉพาะ metadata ที่ไม่อ่อนไหว
(เช่น display name หรือ hints ของแพลตฟอร์มไคลเอนต์) OpenClaw จะถือว่า
เป็น `metadata-upgrade` การอนุมัติอัตโนมัติแบบเงียบนั้นมีขอบเขตแคบ: ใช้เฉพาะกับ
การเชื่อมต่อใหม่จาก CLI/helper ในเครื่องที่เชื่อถือได้ ซึ่งพิสูจน์การครอบครอง
token หรือรหัสผ่านร่วมผ่าน loopback มาแล้ว ไคลเอนต์เบราว์เซอร์/Control UI และไคลเอนต์ระยะไกล
ยังคงใช้ flow การอนุมัติใหม่แบบ explicit การอัปเกรด scope (จาก read ไป
write/admin) และการเปลี่ยน public key **ไม่มีสิทธิ์** สำหรับ metadata-upgrade auto-approval
— ยังคงเป็นคำขออนุมัติใหม่แบบ explicit

## ตัวช่วย QR pairing

`/pair qr` จะแสดง pairing payload เป็นสื่อแบบมีโครงสร้าง เพื่อให้ไคลเอนต์บนมือถือและเบราว์เซอร์สามารถสแกนได้โดยตรง

การลบอุปกรณ์ยังจะล้าง stale pending pairing requests ทั้งหมดของ
device id นั้นด้วย ดังนั้น `nodes pending` จะไม่แสดงแถว orphaned หลังจาก revoke

## Locality และ forwarded headers

Gateway pairing จะถือว่าการเชื่อมต่อเป็น loopback ก็ต่อเมื่อทั้ง raw socket
และหลักฐานจาก upstream proxy สอดคล้องกัน หากคำขอมาถึงบน loopback แต่มี
headers `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
ที่ชี้ไปยังต้นทางที่ไม่ใช่ local หลักฐานจาก forwarded-header นั้นจะทำให้
การอ้างว่าเป็น loopback ใช้ไม่ได้ เส้นทาง pairing จึงต้องใช้การอนุมัติแบบ explicit
แทนที่จะถือว่าเป็นการเชื่อมต่อจากโฮสต์เดียวกันแบบเงียบ ๆ ดู
[Trusted Proxy Auth](/th/gateway/trusted-proxy-auth) สำหรับกฎที่เทียบเท่ากันใน
operator auth

## ที่เก็บข้อมูล (ในเครื่อง, ส่วนตัว)

สถานะ pairing ถูกเก็บไว้ใต้ไดเรกทอรีสถานะของ Gateway (ค่าเริ่มต้น `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

หากคุณ override `OPENCLAW_STATE_DIR` โฟลเดอร์ `nodes/` จะย้ายตามไปด้วย

หมายเหตุด้านความปลอดภัย:

- Tokens เป็นซีเคร็ต; ให้ถือว่า `paired.json` มีความอ่อนไหว
- การหมุน token ต้องมีการอนุมัติใหม่ (หรือลบรายการของ node)

## พฤติกรรมของ Transport

- transport เป็นแบบ **stateless**; มันไม่ได้เก็บข้อมูลสมาชิก
- หาก Gateway ออฟไลน์ หรือปิด pairing อยู่ nodes จะจับคู่ไม่ได้
- หาก Gateway อยู่ในโหมด remote pairing ก็ยังเกิดขึ้นกับ store ของ Gateway ระยะไกลนั้น

## ที่เกี่ยวข้อง

- [Channel pairing](/th/channels/pairing)
- [Nodes](/th/nodes)
- [Devices CLI](/th/cli/devices)
