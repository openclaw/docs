---
read_when:
    - การสร้างหรือดีบักไคลเอนต์ Node (โหมด Node บน iOS/Android/macOS)
    - การตรวจสอบความล้มเหลวของ Pairing หรือการยืนยันตัวตนของ Bridge
    - การตรวจสอบพื้นผิวของ Node ที่ Gateway เปิดเผยออกมา
summary: 'โปรโตคอล bridge แบบเดิมในอดีต (Node แบบ legacy): TCP JSONL, Pairing, และ RPC แบบกำหนดขอบเขต'
title: โปรโตคอล Bridge
x-i18n:
    generated_at: "2026-04-25T13:46:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb07ec4dab4394dd03b4c0002d6a842a9d77d12a1fc2f141f01d5a306fab1615
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

<Warning>
TCP bridge ถูก**นำออกแล้ว** บิลด์ OpenClaw ปัจจุบันไม่ได้มาพร้อมตัวรับฟัง bridge อีกต่อไป และคีย์ config `bridge.*` ก็ไม่อยู่ใน schema แล้ว หน้านี้เก็บไว้เพื่อใช้อ้างอิงทางประวัติศาสตร์เท่านั้น สำหรับไคลเอนต์ node/operator ทั้งหมด ให้ใช้ [Gateway Protocol](/th/gateway/protocol)
</Warning>

## เหตุผลที่เคยมีสิ่งนี้

- **ขอบเขตความปลอดภัย**: bridge เปิดเผย allowlist ขนาดเล็กแทนที่จะเป็นพื้นผิว API ของ gateway ทั้งหมด
- **Pairing + ตัวตนของ node**: การรับ node เข้าระบบเป็นหน้าที่ของ gateway และผูกกับ token ต่อ node
- **ประสบการณ์การใช้งานด้าน discovery**: node สามารถค้นหา gateway ผ่าน Bonjour บน LAN หรือเชื่อมต่อโดยตรงผ่าน tailnet ได้
- **Loopback WS**: control plane แบบ WS เต็มรูปแบบจะอยู่ใน local loopback เว้นแต่จะถูก tunnel ผ่าน SSH

## การขนส่ง

- TCP, หนึ่งออบเจ็กต์ JSON ต่อหนึ่งบรรทัด (JSONL)
- TLS แบบเลือกได้ (เมื่อ `bridge.tls.enabled` เป็น true)
- พอร์ตตัวรับฟังเริ่มต้นในอดีตคือ `18790` (บิลด์ปัจจุบันจะไม่เริ่ม TCP bridge)

เมื่อเปิดใช้ TLS, TXT record ของ discovery จะรวม `bridgeTls=1` พร้อม
`bridgeTlsSha256` เป็น hint ที่ไม่ใช่ความลับ โปรดทราบว่า TXT record ของ Bonjour/mDNS ไม่ได้มีการยืนยันตัวตน; ไคลเอนต์ต้องไม่ถือว่า fingerprint ที่ประกาศไว้เป็น pin ที่เชื่อถือได้โดยสมบูรณ์ หากไม่มีเจตนาชัดเจนจากผู้ใช้หรือการยืนยันนอกแบนด์รูปแบบอื่น

## Handshake + Pairing

1. ไคลเอนต์ส่ง `hello` พร้อม metadata ของ node + token (หากจับคู่แล้ว)
2. หากยังไม่ได้จับคู่ gateway จะตอบกลับ `error` (`NOT_PAIRED`/`UNAUTHORIZED`)
3. ไคลเอนต์ส่ง `pair-request`
4. gateway รอการอนุมัติ จากนั้นส่ง `pair-ok` และ `hello-ok`

ในอดีต `hello-ok` จะส่งกลับ `serverName` และอาจรวม
`canvasHostUrl`

## เฟรม

ไคลเอนต์ → Gateway:

- `req` / `res`: RPC ของ gateway แบบกำหนดขอบเขต (chat, sessions, config, health, voicewake, skills.bins)
- `event`: สัญญาณจาก node (voice transcript, คำขอเอเจนต์, chat subscribe, lifecycle ของ exec)

Gateway → ไคลเอนต์:

- `invoke` / `invoke-res`: คำสั่งของ node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: การอัปเดตแชตสำหรับเซสชันที่สมัครรับไว้
- `ping` / `pong`: keepalive

การบังคับใช้ allowlist แบบเดิมเคยอยู่ใน `src/gateway/server-bridge.ts` (ถูกนำออกแล้ว)

## event ของ lifecycle ของ exec

Node สามารถส่ง event `exec.finished` หรือ `exec.denied` เพื่อแสดงกิจกรรม system.run
สิ่งเหล่านี้จะถูกแมปเป็น system event ใน gateway (Node แบบเดิมอาจยังคงส่ง `exec.started`)

ฟิลด์ของ payload (ทั้งหมดเป็นทางเลือก เว้นแต่จะระบุไว้):

- `sessionKey` (จำเป็น): เซสชันเอเจนต์ที่จะรับ system event
- `runId`: exec id ที่ไม่ซ้ำสำหรับการจัดกลุ่ม
- `command`: สตริงคำสั่งแบบดิบหรือแบบจัดรูปแบบ
- `exitCode`, `timedOut`, `success`, `output`: รายละเอียดเมื่อเสร็จสิ้น (เฉพาะ finished)
- `reason`: เหตุผลที่ถูกปฏิเสธ (เฉพาะ denied)

## การใช้งาน tailnet ในอดีต

- bind bridge เข้ากับ tailnet IP: `bridge.bind: "tailnet"` ใน
  `~/.openclaw/openclaw.json` (ใช้เพื่ออ้างอิงทางประวัติศาสตร์เท่านั้น; `bridge.*` ใช้ไม่ได้อีกแล้ว)
- ไคลเอนต์เชื่อมต่อผ่านชื่อ MagicDNS หรือ tailnet IP
- Bonjour **ไม่** ข้ามเครือข่าย; ใช้ host/port แบบกำหนดเองหรือ DNS‑SD แบบ wide-area
  เมื่อจำเป็น

## การกำหนดเวอร์ชัน

bridge เป็น **v1 โดยปริยาย** (ไม่มีการเจรจา min/max) ส่วนนี้มีไว้เป็นข้อมูลอ้างอิงทางประวัติศาสตร์เท่านั้น; ไคลเอนต์ node/operator ปัจจุบันใช้ [Gateway Protocol](/th/gateway/protocol) แบบ WebSocket

## ที่เกี่ยวข้อง

- [Gateway protocol](/th/gateway/protocol)
- [Nodes](/th/nodes)
