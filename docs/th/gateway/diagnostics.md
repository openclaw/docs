---
read_when:
    - การเตรียมรายงานข้อบกพร่องหรือคำขอรับการสนับสนุน
    - การดีบักการล่มของ Gateway, การรีสตาร์ต, ภาวะหน่วยความจำตึงตัว หรือเพย์โหลดขนาดใหญ่เกินไป
    - การตรวจสอบว่าข้อมูลการวินิจฉัยใดถูกบันทึกหรือถูกปกปิด
summary: สร้างชุดรวมข้อมูลวินิจฉัย Gateway ที่แชร์ได้สำหรับรายงานบั๊ก
title: การส่งออกข้อมูลวินิจฉัย
x-i18n:
    generated_at: "2026-05-10T19:37:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6df695c590fd8239226e2e4d4e266a7b705f3963f00a005be38c526b1f28afb
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw สามารถสร้าง zip การวินิจฉัยภายในเครื่องสำหรับรายงานบั๊กได้ โดยรวม
สถานะ Gateway, สุขภาพ, ล็อก, รูปแบบ config และเหตุการณ์เสถียรภาพล่าสุด
ที่ไม่มี payload ซึ่งผ่านการทำให้ปลอดภัยแล้ว

ปฏิบัติกับชุดการวินิจฉัยเหมือนเป็นความลับจนกว่าคุณจะตรวจสอบแล้ว ชุดเหล่านี้
ออกแบบมาให้ละเว้นหรือแก้ไข payload และข้อมูลรับรอง แต่ยังคงสรุป
ล็อก Gateway ภายในเครื่องและสถานะ runtime ระดับโฮสต์

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw gateway diagnostics export
```

คำสั่งจะแสดงพาธ zip ที่เขียนไว้ หากต้องการเลือกพาธ:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

สำหรับระบบอัตโนมัติ:

```bash
openclaw gateway diagnostics export --json
```

## คำสั่งแชท

เจ้าของสามารถใช้ `/diagnostics [note]` ในแชทเพื่อขอ export Gateway ภายในเครื่องได้
ใช้สิ่งนี้เมื่อบั๊กเกิดขึ้นในการสนทนาจริงและคุณต้องการรายงานสำหรับฝ่ายสนับสนุน
ที่คัดลอกและวางได้หนึ่งชุด:

1. ส่ง `/diagnostics` ในการสนทนาที่คุณพบปัญหา เพิ่มหมายเหตุสั้นๆ
   ถ้าช่วยได้ เช่น `/diagnostics bad tool choice`
2. OpenClaw จะส่งคำนำการวินิจฉัยและขออนุมัติ exec แบบชัดเจนหนึ่งครั้ง
   การอนุมัติจะเรียกใช้ `openclaw gateway diagnostics export --json`
   อย่าอนุมัติการวินิจฉัยผ่านกฎที่อนุญาตทั้งหมด
3. หลังอนุมัติ OpenClaw จะตอบกลับด้วยรายงานที่วางได้ ซึ่งประกอบด้วยพาธ bundle ภายในเครื่อง
   สรุป manifest, หมายเหตุความเป็นส่วนตัว และ session id ที่เกี่ยวข้อง

ในแชทกลุ่ม เจ้าของยังคงเรียกใช้ `/diagnostics` ได้ แต่ OpenClaw จะไม่
โพสต์รายละเอียดการวินิจฉัยกลับเข้าไปในแชทร่วม โดยจะส่งคำนำ
พรอมป์อนุมัติ ผลลัพธ์ export ของ Gateway และรายละเอียด session/thread ของ Codex
ให้เจ้าของผ่านเส้นทางอนุมัติส่วนตัว กลุ่มจะได้รับเพียงประกาศสั้นๆ
ว่าขั้นตอนการวินิจฉัยถูกส่งเป็นส่วนตัวแล้ว หาก OpenClaw ไม่พบเส้นทางส่วนตัว
ไปยังเจ้าของ คำสั่งจะล้มเหลวแบบปิดและขอให้เจ้าของเรียกใช้จากข้อความส่วนตัว

เมื่อ session ของ OpenClaw ที่ใช้งานอยู่ใช้ native OpenAI Codex harness
การอนุมัติ exec เดียวกันจะครอบคลุมการอัปโหลด feedback ไปยัง OpenAI สำหรับ thread
runtime ของ Codex ที่ OpenClaw รู้จักด้วย การอัปโหลดนั้นแยกจาก zip Gateway
ภายในเครื่อง และจะปรากฏเฉพาะสำหรับ session ของ Codex harness ก่อนอนุมัติ
พรอมป์จะอธิบายว่าการอนุมัติการวินิจฉัยจะส่ง feedback ของ Codex ด้วย แต่
จะไม่แสดง session id หรือ thread id ของ Codex หลังอนุมัติ การตอบกลับในแชทจะแสดง
ช่องทาง, session id ของ OpenClaw, thread id ของ Codex และคำสั่ง resume ภายในเครื่อง
สำหรับ thread ที่ถูกส่งไปยังเซิร์ฟเวอร์ของ OpenAI หากคุณปฏิเสธหรือไม่ตอบสนองต่อ
การอนุมัติ OpenClaw จะไม่เรียกใช้ export, ไม่ส่ง feedback ของ Codex และ
ไม่พิมพ์ id ของ Codex

สิ่งนี้ทำให้วงจรการดีบัก Codex ทั่วไปสั้นลง: พบพฤติกรรมที่ไม่ถูกต้องใน
Telegram, Discord หรือช่องทางอื่น เรียกใช้ `/diagnostics` อนุมัติหนึ่งครั้ง แชร์
รายงานกับฝ่ายสนับสนุน แล้วเรียกใช้คำสั่ง `codex resume <thread-id>` ที่พิมพ์ออกมา
ภายในเครื่อง หากคุณต้องการตรวจสอบ thread ของ native Codex ด้วยตนเอง ดู
[Codex harness](/th/plugins/codex-harness#inspect-codex-threads-locally) สำหรับ
เวิร์กโฟลว์การตรวจสอบนั้น

## export มีอะไรบ้าง

zip ประกอบด้วย:

- `summary.md`: ภาพรวมที่มนุษย์อ่านได้สำหรับฝ่ายสนับสนุน
- `diagnostics.json`: สรุป config, ล็อก, สถานะ, สุขภาพ และข้อมูลเสถียรภาพที่เครื่องอ่านได้
- `manifest.json`: metadata ของ export และรายการไฟล์
- รูปแบบ config และรายละเอียด config ที่ไม่ใช่ความลับซึ่งผ่านการทำให้ปลอดภัยแล้ว
- สรุปล็อกที่ผ่านการทำให้ปลอดภัยแล้วและบรรทัดล็อกล่าสุดที่ถูกแก้ไขข้อมูลแล้ว
- snapshot สถานะและสุขภาพของ Gateway แบบ best-effort
- `stability/latest.json`: bundle เสถียรภาพที่คงอยู่ล่าสุด เมื่อมี

export มีประโยชน์แม้ Gateway จะไม่อยู่ในสภาวะปกติ หาก Gateway ไม่สามารถ
ตอบคำขอสถานะหรือสุขภาพได้ ล็อกภายในเครื่อง, รูปแบบ config และ
bundle เสถียรภาพล่าสุดจะยังถูกรวบรวมเมื่อมี

## โมเดลความเป็นส่วนตัว

การวินิจฉัยถูกออกแบบมาให้แชร์ได้ export จะเก็บข้อมูลปฏิบัติการ
ที่ช่วยในการดีบัก เช่น:

- ชื่อ subsystem, plugin id, provider id, channel id และโหมดที่กำหนดค่าไว้
- status code, ระยะเวลา, จำนวน byte, สถานะ queue และค่าหน่วยความจำ
- metadata ล็อกที่ผ่านการทำให้ปลอดภัยแล้วและข้อความปฏิบัติการที่ถูกแก้ไขข้อมูลแล้ว
- รูปแบบ config และการตั้งค่าฟีเจอร์ที่ไม่ใช่ความลับ

export จะละเว้นหรือแก้ไขข้อมูล:

- ข้อความแชท, พรอมป์, คำสั่ง, webhook body และผลลัพธ์เครื่องมือ
- ข้อมูลรับรอง, API key, token, cookie และค่าความลับ
- request body หรือ response body ดิบ
- account id, message id, session id ดิบ, hostname และ username ภายในเครื่อง

เมื่อข้อความล็อกดูเหมือนข้อความผู้ใช้ แชท พรอมป์ หรือ payload ของเครื่องมือ
export จะเก็บไว้เพียงว่ามีข้อความถูกละเว้นและจำนวน byte

## ตัวบันทึกเสถียรภาพ

Gateway บันทึกสตรีมเสถียรภาพแบบมีขอบเขตและไม่มี payload เป็นค่าเริ่มต้นเมื่อ
เปิดใช้งานการวินิจฉัย สตรีมนี้มีไว้สำหรับข้อเท็จจริงด้านปฏิบัติการ ไม่ใช่เนื้อหา

Heartbeat การวินิจฉัยเดียวกันจะบันทึกตัวอย่าง liveness เมื่อ Gateway ยังทำงานต่อ
แต่ event loop ของ Node.js หรือ CPU ดูอิ่มตัว เหตุการณ์
`diagnostic.liveness.warning` เหล่านี้ประกอบด้วย event-loop delay, event-loop
utilization, CPU-core ratio, จำนวน session ที่ active/waiting/queued, phase
startup/runtime ปัจจุบันเมื่อทราบ, ช่วง phase ล่าสุด และป้ายกำกับงาน
active/queued แบบมีขอบเขต ตัวอย่าง idle จะอยู่ใน telemetry ที่ระดับ `info`
ตัวอย่าง liveness จะกลายเป็นคำเตือนของ Gateway เฉพาะเมื่อมีงาน waiting หรือ queued
หรือเมื่อ active work ซ้อนทับกับ event-loop delay ที่ต่อเนื่อง spike ของ max-delay
ชั่วคราวระหว่างงานพื้นหลังที่ยังปกติจะอยู่ใน debug log และจะไม่ restart
Gateway ด้วยตัวเอง

phase การเริ่มต้นจะ emit เหตุการณ์ `diagnostic.phase.completed` พร้อม timing แบบ
wall-clock และ CPU การวินิจฉัย embedded-run ที่ค้างจะตั้ง `terminalProgressStale=true`
เมื่อความคืบหน้า bridge ล่าสุดดูเหมือนเป็น terminal เช่น raw response item หรือ
เหตุการณ์ response completion แต่ Gateway ยังถือว่า embedded run นั้น active อยู่

ตรวจสอบตัวบันทึกสด:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

ตรวจสอบ bundle เสถียรภาพที่คงอยู่ล่าสุดหลัง fatal exit, shutdown timeout
หรือความล้มเหลวในการเริ่มต้นหลัง restart:

```bash
openclaw gateway stability --bundle latest
```

สร้าง zip การวินิจฉัยจาก bundle ที่คงอยู่ล่าสุด:

```bash
openclaw gateway stability --bundle latest --export
```

bundle ที่คงอยู่จะอยู่ใต้ `~/.openclaw/logs/stability/` เมื่อมีเหตุการณ์

## ตัวเลือกที่มีประโยชน์

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: เขียนไปยังพาธ zip ที่ระบุ
- `--log-lines <count>`: จำนวนบรรทัดล็อกที่ผ่านการทำให้ปลอดภัยแล้วสูงสุดที่จะรวม
- `--log-bytes <bytes>`: จำนวน byte ของล็อกสูงสุดที่จะตรวจสอบ
- `--url <url>`: URL WebSocket ของ Gateway สำหรับ snapshot สถานะและสุขภาพ
- `--token <token>`: token ของ Gateway สำหรับ snapshot สถานะและสุขภาพ
- `--password <password>`: รหัสผ่านของ Gateway สำหรับ snapshot สถานะและสุขภาพ
- `--timeout <ms>`: timeout สำหรับ snapshot สถานะและสุขภาพ
- `--no-stability-bundle`: ข้ามการค้นหา bundle เสถียรภาพที่คงอยู่
- `--json`: พิมพ์ metadata ของ export ที่เครื่องอ่านได้

## ปิดใช้งานการวินิจฉัย

การวินิจฉัยเปิดใช้งานเป็นค่าเริ่มต้น หากต้องการปิดใช้งานตัวบันทึกเสถียรภาพและ
การรวบรวมเหตุการณ์การวินิจฉัย:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

การปิดใช้งานการวินิจฉัยจะลดรายละเอียดของรายงานบั๊ก แต่ไม่ส่งผลต่อ
การล็อก Gateway ตามปกติ

## ที่เกี่ยวข้อง

- [การตรวจสอบสุขภาพ](/th/gateway/health)
- [Gateway CLI](/th/cli/gateway#gateway-diagnostics-export)
- [โปรโตคอล Gateway](/th/gateway/protocol#system-and-identity)
- [การล็อก](/th/logging)
- [OpenTelemetry export](/th/gateway/opentelemetry) — ขั้นตอนแยกสำหรับสตรีมการวินิจฉัยไปยัง collector
