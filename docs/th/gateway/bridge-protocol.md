---
read_when:
    - การสร้างหรือดีบักไคลเอนต์ Node (โหมด Node ของ iOS/Android/macOS)
    - กำลังตรวจสอบความล้มเหลวของการจับคู่หรือการยืนยันตัวตนของบริดจ์
    - ตรวจสอบพื้นผิวของ node ที่ Gateway เปิดเผย
summary: 'โปรโตคอลสะพานเชื่อมแบบย้อนหลัง (โหนดเดิม): TCP JSONL, การจับคู่, RPC แบบกำหนดขอบเขต'
title: โปรโตคอลบริดจ์
x-i18n:
    generated_at: "2026-06-27T17:32:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 485d18f94b731018c6e0df493068b0b6aceff9afba6bebf1350db63c04cee98c
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
บริดจ์ TCP ถูก**นำออกแล้ว** บิลด์ OpenClaw ปัจจุบันไม่ได้ส่งมาพร้อมตัวรับฟังบริดจ์ และคีย์การกำหนดค่า `bridge.*` ไม่อยู่ในสคีมาอีกต่อไป หน้านี้เก็บไว้เพื่ออ้างอิงทางประวัติเท่านั้น ใช้ [Gateway Protocol](/th/gateway/protocol) สำหรับไคลเอนต์ Node/ผู้ปฏิบัติงานทั้งหมด
</Warning>

## เหตุผลที่เคยมีอยู่

- **ขอบเขตความปลอดภัย**: บริดจ์เปิดเผยรายการที่อนุญาตขนาดเล็กแทนพื้นผิว API ของ Gateway
  ทั้งหมด
- **การจับคู่ + ตัวตนของ Node**: การรับ Node เข้าระบบเป็นของ Gateway และผูกกับโทเค็น
  ราย Node
- **UX การค้นหา**: Node สามารถค้นหา Gateway ผ่าน Bonjour บน LAN หรือเชื่อมต่อ
  โดยตรงผ่าน tailnet
- **Loopback WS**: ระนาบควบคุม WS แบบเต็มยังคงอยู่ในเครื่อง เว้นแต่จะถูกทำอุโมงค์ผ่าน SSH

## การขนส่ง

- TCP, หนึ่งออบเจ็กต์ JSON ต่อบรรทัด (JSONL)
- TLS แบบเลือกใช้ได้ (เมื่อ `bridge.tls.enabled` เป็น true)
- พอร์ตตัวรับฟังเริ่มต้นในอดีตคือ `18790` (บิลด์ปัจจุบันไม่เริ่ม
  บริดจ์ TCP)

เมื่อเปิดใช้ TLS ระเบียน TXT สำหรับการค้นหาจะมี `bridgeTls=1` พร้อม
`bridgeTlsSha256` เป็นคำใบ้ที่ไม่ใช่ความลับ โปรดทราบว่าระเบียน TXT ของ Bonjour/mDNS
ไม่ได้ผ่านการยืนยันตัวตน ไคลเอนต์ต้องไม่ถือว่าลายนิ้วมือที่ประกาศเป็น
พินที่เชื่อถือได้โดยสมบูรณ์ หากไม่มีเจตนาผู้ใช้ที่ชัดเจนหรือการยืนยันนอกช่องทางอื่น

## Handshake + การจับคู่

1. ไคลเอนต์ส่ง `hello` พร้อมเมทาดาทาของ Node + โทเค็น (ถ้าจับคู่แล้ว)
2. หากยังไม่ได้จับคู่ Gateway จะตอบกลับ `error` (`NOT_PAIRED`/`UNAUTHORIZED`)
3. ไคลเอนต์ส่ง `pair-request`
4. Gateway รอการอนุมัติ จากนั้นส่ง `pair-ok` และ `hello-ok`

ในอดีต `hello-ok` ส่งคืน `serverName`; พื้นผิว Plugin ที่โฮสต์อยู่ตอนนี้
ประกาศผ่าน `pluginSurfaceUrls` Canvas/A2UI ใช้
`pluginSurfaceUrls.canvas`; alias `canvasHostUrl` ที่เลิกใช้แล้วไม่เป็นส่วนหนึ่งของ
โปรโตคอลที่ปรับโครงสร้างใหม่

## เฟรม

ไคลเอนต์ → Gateway:

- `req` / `res`: RPC ของ Gateway แบบกำหนดขอบเขต (แชต, เซสชัน, การกำหนดค่า, สุขภาพ, voicewake, skills.bins)
- `event`: สัญญาณของ Node (ข้อความถอดเสียง, คำขอเอเจนต์, สมัครรับแชต, วงจรชีวิต exec)

Gateway → ไคลเอนต์:

- `invoke` / `invoke-res`: คำสั่งของ Node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: อัปเดตแชตสำหรับเซสชันที่สมัครรับ
- `ping` / `pong`: keepalive

การบังคับใช้รายการที่อนุญาตแบบเดิมเคยอยู่ใน `src/gateway/server-bridge.ts` (นำออกแล้ว)

## เหตุการณ์วงจรชีวิต Exec

Node สามารถปล่อยเหตุการณ์ `exec.finished` เพื่อแสดงกิจกรรม `system.run` ที่เสร็จสิ้นแล้ว
สิ่งเหล่านี้ถูกแมปเป็นเหตุการณ์ระบบใน Gateway (Node แบบเดิมอาจยังปล่อย `exec.started`)
Node อาจปล่อย `exec.denied` สำหรับความพยายาม `system.run` ที่ถูกปฏิเสธ; Gateway ยอมรับ
เหตุการณ์นี้เป็นการปฏิเสธปลายทาง และไม่จัดคิวเหตุการณ์ระบบหรือปลุกงานเอเจนต์

ฟิลด์ payload (ทั้งหมดเป็นทางเลือก เว้นแต่ระบุไว้):

- `sessionKey` (จำเป็น): เซสชันเอเจนต์สำหรับการเชื่อมโยงเหตุการณ์ และสำหรับ
  `exec.finished` การส่งเหตุการณ์ระบบ
- `runId`: id exec ที่ไม่ซ้ำสำหรับการจัดกลุ่ม
- `command`: สตริงคำสั่งดิบหรือที่จัดรูปแบบแล้ว
- `exitCode`, `timedOut`, `success`, `output`: รายละเอียดการเสร็จสิ้น (เฉพาะ finished)
- `reason`: เหตุผลการปฏิเสธ (เฉพาะ denied)

## การใช้งาน tailnet ในอดีต

- ผูกบริดจ์กับ IP ของ tailnet: `bridge.bind: "tailnet"` ใน
  `~/.openclaw/openclaw.json` (เฉพาะในอดีต; `bridge.*` ไม่ถูกต้องอีกต่อไป)
- ไคลเอนต์เชื่อมต่อผ่านชื่อ MagicDNS หรือ IP ของ tailnet
- Bonjour **ไม่** ข้ามเครือข่าย; ใช้โฮสต์/พอร์ตแบบกำหนดเองหรือ wide-area DNS-SD
  เมื่อจำเป็น

## การกำหนดเวอร์ชัน

บริดจ์เป็น **v1 โดยนัย** (ไม่มีการเจรจา min/max) ส่วนนี้เป็น
ข้อมูลอ้างอิงทางประวัติเท่านั้น; ไคลเอนต์ Node/ผู้ปฏิบัติงานปัจจุบันใช้ WebSocket
[Gateway Protocol](/th/gateway/protocol)

## ที่เกี่ยวข้อง

- [โปรโตคอล Gateway](/th/gateway/protocol)
- [Node](/th/nodes)
