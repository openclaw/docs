---
read_when:
    - การสร้างหรือดีบักไคลเอนต์ Node (โหมด Node ของ iOS/Android/macOS)
    - การตรวจสอบความล้มเหลวในการจับคู่หรือการยืนยันตัวตนของบริดจ์
    - การตรวจสอบพื้นผิวของ Node ที่ Gateway เปิดเผย
summary: 'โปรโตคอลบริดจ์ในอดีต (โหนดรุ่นเก่า): TCP JSONL, การจับคู่, RPC แบบจำกัดขอบเขต'
title: โปรโตคอลบริดจ์
x-i18n:
    generated_at: "2026-05-07T13:16:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc906ca3a8a4ebef9b39c53187bcb4d06b287875b8e8748a168812f9a52e6152
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
บริดจ์ TCP ถูก**นำออกแล้ว** บิลด์ OpenClaw ปัจจุบันไม่ได้จัดส่ง listener ของบริดจ์ และคีย์การกำหนดค่า `bridge.*` ไม่อยู่ใน schema อีกต่อไป หน้านี้เก็บไว้เพื่ออ้างอิงทางประวัติเท่านั้น ใช้ [โปรโตคอล Gateway](/th/gateway/protocol) สำหรับไคลเอนต์ Node/operator ทั้งหมด
</Warning>

## เหตุผลที่เคยมีอยู่

- **ขอบเขตความปลอดภัย**: บริดจ์เปิดเผย allowlist ขนาดเล็กแทนพื้นผิว API ทั้งหมดของ Gateway
- **การจับคู่ + ตัวตนของ Node**: การรับ Node เข้าใช้งานเป็นหน้าที่ของ Gateway และผูกกับโทเค็นราย Node
- **UX การค้นหา**: Node สามารถค้นหา Gateway ผ่าน Bonjour บน LAN หรือเชื่อมต่อโดยตรงผ่าน tailnet
- **Loopback WS**: control plane แบบ WS ทั้งหมดยังคงอยู่ในเครื่อง เว้นแต่จะถูก tunnel ผ่าน SSH

## การขนส่ง

- TCP หนึ่งอ็อบเจ็กต์ JSON ต่อบรรทัด (JSONL)
- TLS แบบเลือกได้ (เมื่อ `bridge.tls.enabled` เป็น true)
- พอร์ต listener เริ่มต้นในอดีตคือ `18790` (บิลด์ปัจจุบันไม่เริ่มบริดจ์ TCP)

เมื่อเปิดใช้ TLS ระเบียน TXT ของการค้นหาจะรวม `bridgeTls=1` พร้อมกับ `bridgeTlsSha256` เป็นคำใบ้ที่ไม่ใช่ความลับ โปรดทราบว่าระเบียน TXT ของ Bonjour/mDNS ไม่ได้รับการยืนยันตัวตน ไคลเอนต์ต้องไม่ถือว่า fingerprint ที่ประกาศเป็น pin ที่เชื่อถือได้โดยไม่มีเจตนาชัดเจนจากผู้ใช้หรือการยืนยันแบบ out-of-band อื่น

## Handshake + การจับคู่

1. ไคลเอนต์ส่ง `hello` พร้อม metadata ของ Node + โทเค็น (หากจับคู่แล้ว)
2. หากยังไม่ได้จับคู่ Gateway จะตอบกลับ `error` (`NOT_PAIRED`/`UNAUTHORIZED`)
3. ไคลเอนต์ส่ง `pair-request`
4. Gateway รอการอนุมัติ จากนั้นส่ง `pair-ok` และ `hello-ok`

ในอดีต `hello-ok` ส่งคืน `serverName`; ตอนนี้พื้นผิว Plugin ที่โฮสต์อยู่จะประกาศผ่าน `pluginSurfaceUrls` Canvas/A2UI ใช้ `pluginSurfaceUrls.canvas`; alias `canvasHostUrl` ที่เลิกใช้แล้วไม่เป็นส่วนหนึ่งของโปรโตคอลที่ปรับโครงสร้างใหม่

## เฟรม

ไคลเอนต์ → Gateway:

- `req` / `res`: RPC ของ Gateway แบบมีขอบเขต (chat, sessions, config, health, voicewake, skills.bins)
- `event`: สัญญาณจาก Node (voice transcript, agent request, chat subscribe, exec lifecycle)

Gateway → ไคลเอนต์:

- `invoke` / `invoke-res`: คำสั่งของ Node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: การอัปเดตแชตสำหรับ session ที่สมัครรับข้อมูล
- `ping` / `pong`: keepalive

การบังคับใช้ allowlist แบบเดิมเคยอยู่ใน `src/gateway/server-bridge.ts` (นำออกแล้ว)

## เหตุการณ์วงจรชีวิต Exec

Node สามารถปล่อยเหตุการณ์ `exec.finished` หรือ `exec.denied` เพื่อแสดงกิจกรรม system.run ได้
สิ่งเหล่านี้จะถูกแมปเป็นเหตุการณ์ระบบใน Gateway (Node รุ่นเดิมอาจยังปล่อย `exec.started`)

ฟิลด์ payload (ทั้งหมดเป็นตัวเลือก เว้นแต่ระบุไว้):

- `sessionKey` (จำเป็น): session ของ agent ที่จะรับเหตุการณ์ระบบ
- `runId`: id ของ exec ที่ไม่ซ้ำสำหรับการจัดกลุ่ม
- `command`: สตริงคำสั่งดิบหรือที่จัดรูปแบบแล้ว
- `exitCode`, `timedOut`, `success`, `output`: รายละเอียดการเสร็จสิ้น (เฉพาะ finished)
- `reason`: เหตุผลการปฏิเสธ (เฉพาะ denied)

## การใช้งาน tailnet ในอดีต

- ผูกบริดจ์กับ IP ของ tailnet: `bridge.bind: "tailnet"` ใน
  `~/.openclaw/openclaw.json` (เฉพาะในอดีต; `bridge.*` ไม่ถูกต้องอีกต่อไป)
- ไคลเอนต์เชื่อมต่อผ่านชื่อ MagicDNS หรือ IP ของ tailnet
- Bonjour **ไม่** ข้ามเครือข่าย; ใช้ host/port แบบกำหนดเองหรือ DNS-SD แบบ wide-area เมื่อจำเป็น

## การกำหนดเวอร์ชัน

บริดจ์เป็น **implicit v1** (ไม่มีการต่อรอง min/max) ส่วนนี้เป็นข้อมูลอ้างอิงทางประวัติเท่านั้น ไคลเอนต์ Node/operator ปัจจุบันใช้ WebSocket [โปรโตคอล Gateway](/th/gateway/protocol)

## ที่เกี่ยวข้อง

- [โปรโตคอล Gateway](/th/gateway/protocol)
- [Node](/th/nodes)
