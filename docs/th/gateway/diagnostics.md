---
read_when:
    - การเตรียมรายงานบั๊กหรือคำขอรับการสนับสนุน
    - การดีบักการล่มของ Gateway การรีสตาร์ต แรงกดดันด้านหน่วยความจำ หรือ payload ที่มีขนาดใหญ่เกินไป
    - การตรวจสอบว่าข้อมูลวินิจฉัยใดถูกบันทึกหรือถูกปกปิด მონაცემ
summary: สร้างชุดข้อมูลวินิจฉัยของ Gateway ที่แชร์ได้สำหรับรายงานบั๊ก
title: การส่งออกข้อมูลวินิจฉัย
x-i18n:
    generated_at: "2026-04-26T11:29:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64866d929ed42f8484aa7c153e3056bad7b594d9e02705c095b7005f3094ec36
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw สามารถสร้างไฟล์ zip ข้อมูลวินิจฉัยแบบโลคัลที่ปลอดภัยสำหรับแนบกับรายงานบั๊กได้ โดยรวมสถานะ Gateway, health, logs, รูปแบบ config และเหตุการณ์ stability ล่าสุดแบบไม่มี payload ที่ผ่านการทำให้ปลอดภัยแล้ว

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw gateway diagnostics export
```

คำสั่งนี้จะแสดง path ของไฟล์ zip ที่เขียนแล้ว หากต้องการเลือก path เอง:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

สำหรับระบบอัตโนมัติ:

```bash
openclaw gateway diagnostics export --json
```

## สิ่งที่อยู่ใน export

ไฟล์ zip จะรวม:

- `summary.md`: ภาพรวมแบบมนุษย์อ่านได้สำหรับทีมซัพพอร์ต
- `diagnostics.json`: สรุปแบบอ่านได้โดยเครื่องของข้อมูล config, logs, status, health และ stability
- `manifest.json`: metadata ของ export และรายการไฟล์
- รูปแบบ config ที่ผ่านการทำให้ปลอดภัย และรายละเอียด config ที่ไม่เป็นความลับ
- สรุป logs ที่ผ่านการทำให้ปลอดภัย และบรรทัด log ล่าสุดที่ปกปิดข้อมูลแล้ว
- snapshots ของ Gateway status และ health แบบ best-effort
- `stability/latest.json`: stability bundle ที่บันทึกล่าสุด เมื่อมี

export นี้มีประโยชน์แม้ในกรณีที่ Gateway ไม่สมบูรณ์ หาก Gateway ไม่สามารถตอบคำขอ status หรือ health ได้ ระบบจะยังคงเก็บ local logs, รูปแบบ config และ stability bundle ล่าสุดเมื่อมีอยู่

## โมเดลความเป็นส่วนตัว

ข้อมูลวินิจฉัยถูกออกแบบมาให้แชร์ได้ export นี้จะเก็บข้อมูลเชิงปฏิบัติการที่ช่วยในการดีบัก เช่น:

- ชื่อ subsystem, plugin ids, provider ids, channel ids และโหมดที่ตั้งค่าไว้
- status codes, durations, จำนวนไบต์, สถานะ queue และค่าหน่วยความจำ
- metadata ของ log ที่ผ่านการทำให้ปลอดภัย และข้อความเชิงปฏิบัติการที่ปกปิดข้อมูลแล้ว
- รูปแบบ config และการตั้งค่าฟีเจอร์ที่ไม่เป็นความลับ

export จะละเว้นหรือปกปิด:

- ข้อความแชต, prompts, instructions, เนื้อหา Webhook และ outputs ของ tool
- credentials, API keys, tokens, cookies และค่า secrets
- เนื้อหา request หรือ response แบบดิบ
- account ids, message ids, raw session ids, hostnames และ local usernames

เมื่อข้อความ log ดูเหมือนเป็นข้อความ payload ของผู้ใช้ แชต prompt หรือ tool export จะเก็บไว้เพียงว่ามีข้อความหนึ่งถูกละเว้น และจำนวนไบต์ของข้อความนั้น

## Stability recorder

Gateway จะบันทึกสตรีม stability แบบมีขอบเขตและไม่มี payload โดยค่าเริ่มต้นเมื่อเปิดใช้ diagnostics มันมีไว้สำหรับข้อเท็จจริงเชิงปฏิบัติการ ไม่ใช่เนื้อหา

ตรวจสอบตัวบันทึกแบบ live:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

ตรวจสอบ stability bundle ล่าสุดที่บันทึกไว้หลังจาก fatal exit, shutdown
timeout หรือความล้มเหลวในการเริ่มต้นใหม่:

```bash
openclaw gateway stability --bundle latest
```

สร้างไฟล์ zip ข้อมูลวินิจฉัยจาก bundle ที่บันทึกล่าสุด:

```bash
openclaw gateway stability --bundle latest --export
```

bundles ที่บันทึกไว้จะอยู่ภายใต้ `~/.openclaw/logs/stability/` เมื่อมีเหตุการณ์อยู่

## ตัวเลือกที่มีประโยชน์

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: เขียนไปยัง path ของ zip ที่ระบุ
- `--log-lines <count>`: จำนวนบรรทัด log ที่ผ่านการทำให้ปลอดภัยสูงสุดที่จะรวม
- `--log-bytes <bytes>`: จำนวนไบต์ log สูงสุดที่จะตรวจสอบ
- `--url <url>`: URL WebSocket ของ Gateway สำหรับ snapshots ของ status และ health
- `--token <token>`: token ของ Gateway สำหรับ snapshots ของ status และ health
- `--password <password>`: รหัสผ่านของ Gateway สำหรับ snapshots ของ status และ health
- `--timeout <ms>`: timeout ของ snapshots ของ status และ health
- `--no-stability-bundle`: ข้ามการค้นหา stability bundle ที่บันทึกไว้
- `--json`: พิมพ์ metadata ของ export แบบอ่านได้โดยเครื่อง

## ปิดใช้งาน diagnostics

diagnostics เปิดใช้งานโดยค่าเริ่มต้น หากต้องการปิด stability recorder และการเก็บเหตุการณ์วินิจฉัย:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

การปิด diagnostics จะลดรายละเอียดของรายงานบั๊ก แต่จะไม่กระทบต่อการบันทึก log ปกติของ Gateway

## ที่เกี่ยวข้อง

- [การตรวจสอบ health](/th/gateway/health)
- [CLI ของ Gateway](/th/cli/gateway#gateway-diagnostics-export)
- [โปรโตคอล Gateway](/th/gateway/protocol#system-and-identity)
- [การบันทึก log](/th/logging)
- [การส่งออก OpenTelemetry](/th/gateway/opentelemetry) — ขั้นตอนแยกต่างหากสำหรับสตรีมข้อมูลวินิจฉัยไปยัง collector
