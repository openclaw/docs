---
read_when:
    - กำลังนำการอนุมัติการจับคู่ Node มาใช้โดยไม่มี macOS UI
    - กำลังเพิ่มโฟลว์ CLI สำหรับการอนุมัติ Node ระยะไกล
    - กำลังขยายโปรโตคอล Gateway ด้วยการจัดการ Node
summary: การจับคู่ Node ที่ Gateway เป็นเจ้าของ (ตัวเลือก B) สำหรับ iOS และ Node ระยะไกลอื่น ๆ
title: การจับคู่ที่ Gateway เป็นเจ้าของ
x-i18n:
    generated_at: "2026-04-26T11:30:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 436391f7576b7285733eb4a8283b73d7b4c52f22b227dd915c09313cfec776bd
    source_path: gateway/pairing.md
    workflow: 15
---

ในการจับคู่ที่ Gateway เป็นเจ้าของ **Gateway** คือแหล่งข้อมูลจริงสำหรับกำหนดว่า Node ใด
ได้รับอนุญาตให้เข้าร่วมได้ UIs (แอป macOS, ไคลเอนต์ในอนาคต) เป็นเพียงฟรอนต์เอนด์ที่
อนุมัติหรือปฏิเสธคำขอที่รอดำเนินการ

**สำคัญ:** WS nodes ใช้ **การจับคู่อุปกรณ์** (role `node`) ระหว่าง `connect`
`node.pair.*` เป็น store การจับคู่อีกชุดหนึ่งและ **ไม่ได้** ใช้ควบคุม WS handshake
มีเพียงไคลเอนต์ที่เรียก `node.pair.*` โดยชัดเจนเท่านั้นที่ใช้โฟลว์นี้

## แนวคิด

- **คำขอที่รอดำเนินการ**: Node ร้องขอเข้าร่วม; ต้องได้รับการอนุมัติ
- **Node ที่จับคู่แล้ว**: Node ที่ได้รับอนุมัติแล้วพร้อม auth token ที่ออกให้
- **Transport**: endpoint WS ของ Gateway ส่งต่อคำขอ แต่ไม่ได้ตัดสินใจเรื่อง
  membership (รองรับ legacy TCP bridge ถูกถอดออกแล้ว)

## การจับคู่ทำงานอย่างไร

1. Node เชื่อมต่อกับ Gateway WS และร้องขอการจับคู่
2. Gateway เก็บ **คำขอที่รอดำเนินการ** และส่ง event `node.pair.requested`
3. คุณอนุมัติหรือปฏิเสธคำขอ (ผ่าน CLI หรือ UI)
4. เมื่ออนุมัติ Gateway จะออก **โทเค็นใหม่** (โทเค็นจะถูกหมุนเวียนเมื่อจับคู่ซ้ำ)
5. Node เชื่อมต่อใหม่โดยใช้โทเค็นและตอนนี้จะถือว่า “จับคู่แล้ว”

คำขอที่รอดำเนินการจะหมดอายุโดยอัตโนมัติหลัง **5 นาที**

## เวิร์กโฟลว์ CLI (เหมาะกับแบบเฮดเลส)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` จะแสดง Node ที่จับคู่แล้ว/เชื่อมต่ออยู่ และ capabilities ของพวกมัน

## พื้นผิว API (โปรโตคอล gateway)

Events:

- `node.pair.requested` — ส่งเมื่อมีการสร้างคำขอที่รอดำเนินการใหม่
- `node.pair.resolved` — ส่งเมื่อคำขอได้รับการอนุมัติ/ปฏิเสธ/หมดอายุ

Methods:

- `node.pair.request` — สร้างหรือใช้คำขอที่รอดำเนินการซ้ำ
- `node.pair.list` — แสดงรายการคำขอที่รอดำเนินการ + Node ที่จับคู่แล้ว (`operator.pairing`)
- `node.pair.approve` — อนุมัติคำขอที่รอดำเนินการ (ออกโทเค็น)
- `node.pair.reject` — ปฏิเสธคำขอที่รอดำเนินการ
- `node.pair.verify` — ตรวจสอบ `{ nodeId, token }`

หมายเหตุ:

- `node.pair.request` เป็น idempotent ต่อ Node: การเรียกซ้ำจะส่งคืนคำขอที่รอดำเนินการเดิม
- คำขอซ้ำสำหรับ Node ที่ยังรอดำเนินการตัวเดิมจะรีเฟรชข้อมูลเมตาของ Node ที่เก็บไว้
  และ snapshot ของ declared commands ล่าสุดที่อยู่ใน allowlist เพื่อให้ operator มองเห็น
- การอนุมัติจะ **สร้างโทเค็นใหม่เสมอ**; จะไม่มีการส่งโทเค็นกลับจาก
  `node.pair.request`
- คำขออาจมี `silent: true` เป็นคำใบ้สำหรับโฟลว์ auto-approval
- `node.pair.approve` ใช้ declared commands ของคำขอที่รอดำเนินการเพื่อบังคับใช้
  approval scopes เพิ่มเติม:
  - คำขอที่ไม่มีคำสั่ง: `operator.pairing`
  - คำขอคำสั่งที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
  - คำขอ `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

สำคัญ:

- การจับคู่ Node คือโฟลว์ความเชื่อถือ/ตัวตนพร้อมการออกโทเค็น
- มัน **ไม่ได้** pin พื้นผิวคำสั่งสดของ Node แยกราย Node
- คำสั่ง Node แบบ live มาจากสิ่งที่ Node ประกาศระหว่าง connect หลังจากที่
  นโยบายคำสั่ง Node ส่วนกลางของ gateway (`gateway.nodes.allowCommands` /
  `denyCommands`) ถูกนำไปใช้แล้ว
- นโยบาย allow/ask ของ `system.run` แยกราย Node อยู่บน Node เองใน
  `exec.approvals.node.*` ไม่ได้อยู่ในระเบียนการจับคู่

## การควบคุมคำสั่ง Node (2026.3.31+)

<Warning>
**การเปลี่ยนแปลงที่ไม่เข้ากันเดิม:** เริ่มตั้งแต่ `2026.3.31` คำสั่ง Node จะถูกปิดใช้งานจนกว่าการจับคู่ Node จะได้รับการอนุมัติ การจับคู่อุปกรณ์เพียงอย่างเดียวไม่เพียงพออีกต่อไปสำหรับการเปิดเผย declared commands ของ Node
</Warning>

เมื่อ Node เชื่อมต่อครั้งแรก การจับคู่จะถูกร้องขอโดยอัตโนมัติ จนกว่าคำขอจับคู่นั้นจะได้รับการอนุมัติ คำสั่ง Node ที่รอดำเนินการทั้งหมดจาก Node นั้นจะถูกกรองและจะไม่ถูกรัน เมื่อสร้างความเชื่อถือผ่านการอนุมัติการจับคู่แล้ว declared commands ของ Node จะพร้อมใช้งานภายใต้นโยบายคำสั่งปกติ

ซึ่งหมายความว่า:

- Node ที่ก่อนหน้านี้อาศัยเพียงการจับคู่อุปกรณ์เพื่อเปิดเผยคำสั่ง จะต้องทำการจับคู่ Node ให้เสร็จสิ้นแล้ว
- คำสั่งที่เข้าคิวไว้ก่อนอนุมัติการจับคู่จะถูกทิ้ง ไม่ใช่เลื่อนออกไป

## ขอบเขตความเชื่อถือของ Node events (2026.3.31+)

<Warning>
**การเปลี่ยนแปลงที่ไม่เข้ากันเดิม:** การรันที่มีต้นทางจาก Node จะคงอยู่บนพื้นผิวที่เชื่อถือได้แบบลดรูปแล้ว
</Warning>

สรุปที่มีต้นทางจาก Node และ session events ที่เกี่ยวข้องจะถูกจำกัดไว้ในพื้นผิวที่เชื่อถือได้ตามที่ตั้งใจไว้ โฟลว์ที่ขับเคลื่อนด้วย notification หรือทริกเกอร์จาก Node ซึ่งก่อนหน้านี้อาจพึ่งพาการเข้าถึงเครื่องมือของโฮสต์หรือ session ที่กว้างกว่าเดิม อาจต้องมีการปรับเปลี่ยน การ hardening นี้ช่วยให้มั่นใจว่า Node events จะไม่สามารถยกระดับไปสู่การเข้าถึงเครื่องมือระดับโฮสต์เกินกว่าที่ขอบเขตความเชื่อถือของ Node อนุญาต

## Auto-approval (แอป macOS)

แอป macOS สามารถพยายามทำ **silent approval** ได้ตามตัวเลือก เมื่อ:

- คำขอถูกทำเครื่องหมายว่า `silent` และ
- แอปสามารถยืนยันการเชื่อมต่อ SSH ไปยังโฮสต์ gateway โดยใช้ผู้ใช้คนเดียวกันได้

หาก silent approval ล้มเหลว ระบบจะ fallback ไปยังพรอมป์ต์ “Approve/Reject” แบบปกติ

## Trusted-CIDR device auto-approval

WS device pairing สำหรับ `role: node` ยังคงต้องทำด้วยตนเองเป็นค่าเริ่มต้น สำหรับ
เครือข่าย Node ส่วนตัวที่ Gateway เชื่อถือเส้นทางเครือข่ายอยู่แล้ว operators สามารถ
เลือกใช้ด้วย CIDRs หรือ IP ที่ตรงกันแบบชัดเจนได้:

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

- ปิดใช้งานเมื่อไม่ได้ตั้งค่า `gateway.nodes.pairing.autoApproveCidrs`
- ไม่มีโหมด auto-approve แบบครอบคลุมทั้ง LAN หรือ private-network
- มีสิทธิ์เฉพาะการจับคู่อุปกรณ์ `role: node` แบบใหม่ที่ไม่มี requested scopes เท่านั้น
- Operator, browser, Control UI และไคลเอนต์ WebChat ยังคงต้องทำด้วยตนเอง
- การอัปเกรด role, scope, metadata และ public key ยังคงต้องทำด้วยตนเอง
- เส้นทาง trusted-proxy header แบบ loopback บนโฮสต์เดียวกันไม่มีสิทธิ์ เพราะ
  ผู้เรียกในเครื่องสามารถปลอมเส้นทางนั้นได้

## Metadata-upgrade auto-approval

เมื่ออุปกรณ์ที่จับคู่แล้วเชื่อมต่อใหม่โดยมีการเปลี่ยนแปลงเฉพาะ metadata ที่ไม่ละเอียดอ่อน
(เช่น display name หรือคำใบ้ platform ของไคลเอนต์) OpenClaw จะถือว่าเป็น
`metadata-upgrade` การ auto-approval แบบเงียบมีขอบเขตแคบ: ใช้ได้เฉพาะกับ
การเชื่อมต่อใหม่ในเครื่องที่เชื่อถือได้ ไม่ใช่เบราว์เซอร์ และได้พิสูจน์การครอบครองข้อมูลรับรอง
แบบ local หรือ shared แล้ว รวมถึงการเชื่อมต่อใหม่ของ native app บนโฮสต์เดียวกันหลัง
metadata เวอร์ชันระบบปฏิบัติการเปลี่ยน Browser/Control UI และไคลเอนต์ระยะไกลยังคงใช้
โฟลว์การอนุมัติใหม่แบบชัดเจน การอัปเกรด scope (read เป็น write/admin) และการเปลี่ยน
public key **ไม่มีสิทธิ์** สำหรับ metadata-upgrade auto-approval — ยังคงเป็นคำขอ
อนุมัติใหม่แบบชัดเจน

## ตัวช่วยจับคู่ด้วย QR

`/pair qr` จะแสดง payload ของการจับคู่เป็นสื่อที่มีโครงสร้าง เพื่อให้ไคลเอนต์บนมือถือและ
เบราว์เซอร์สแกนได้โดยตรง

การลบอุปกรณ์จะกวาดคำขอจับคู่ที่รอดำเนินการเก่าทั้งหมดสำหรับ
device id นั้นด้วย ดังนั้น `nodes pending` จะไม่แสดงแถว orphaned หลังการ revoke

## ความเป็น local และ forwarded headers

Gateway pairing จะถือว่าการเชื่อมต่อเป็น loopback ก็ต่อเมื่อทั้ง raw socket
และหลักฐาน upstream proxy สอดคล้องกัน หากคำขอมาถึงบน loopback แต่มี
headers `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
ที่ชี้ไปยังต้นทางที่ไม่ใช่ local หลักฐานจาก forwarded-header นั้นจะทำให้การอ้างว่าเป็น
loopback ใช้ไม่ได้ เส้นทาง pairing จะต้องได้รับการอนุมัติแบบชัดเจนแทนที่จะถือว่าเป็น
การเชื่อมต่อบนโฮสต์เดียวกันแบบเงียบ ๆ ดู
[Trusted Proxy Auth](/th/gateway/trusted-proxy-auth) สำหรับกฎที่เทียบเท่ากันใน
operator auth

## ที่เก็บข้อมูล (ในเครื่อง, แบบส่วนตัว)

สถานะการจับคู่จะถูกเก็บไว้ใต้ state directory ของ Gateway (ค่าเริ่มต้น `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

หากคุณแทนที่ `OPENCLAW_STATE_DIR` โฟลเดอร์ `nodes/` จะย้ายตามไปด้วย

หมายเหตุด้านความปลอดภัย:

- โทเค็นเป็น secrets; ให้ถือว่า `paired.json` เป็นข้อมูลอ่อนไหว
- การหมุนเวียนโทเค็นต้องได้รับการอนุมัติใหม่ (หรือลบรายการ Node)

## พฤติกรรมของ transport

- transport เป็นแบบ **stateless**; ไม่ได้เก็บ membership
- หาก Gateway ออฟไลน์หรือปิดการจับคู่ Nodes จะไม่สามารถจับคู่ได้
- หาก Gateway อยู่ในโหมด remote การจับคู่จะยังคงเกิดขึ้นกับ store ของ Gateway ระยะไกลนั้น

## ที่เกี่ยวข้อง

- [Channel pairing](/th/channels/pairing)
- [Nodes](/th/nodes)
- [ข้อมูลอ้างอิง CLI ของอุปกรณ์](/th/cli/devices)
