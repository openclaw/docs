---
permalink: /security/formal-verification/
read_when:
    - การทบทวนการรับประกันหรือข้อจำกัดของแบบจำลองความปลอดภัยเชิงรูปแบบ
    - การทำซ้ำหรืออัปเดตการตรวจสอบโมเดลความปลอดภัยด้วย TLA+/TLC
summary: โมเดลความปลอดภัยที่ผ่านการตรวจสอบด้วยเครื่องสำหรับเส้นทางที่มีความเสี่ยงสูงสุดของ OpenClaw.
title: การตรวจสอบความถูกต้องอย่างเป็นทางการ (โมเดลความปลอดภัย)
x-i18n:
    generated_at: "2026-05-06T09:30:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298b92f27abb8321be807fe4d95c7cd568a0fb8f543d168863b2adb9b3ddcde4
    source_path: security/formal-verification.md
    workflow: 16
    postprocess_version: locale-links-v1
---

หน้านี้ติดตาม **โมเดลความปลอดภัยอย่างเป็นทางการ** ของ OpenClaw (ปัจจุบันคือ TLA+/TLC; และเพิ่มเติมตามความจำเป็น)

> หมายเหตุ: ลิงก์เก่าบางรายการอาจอ้างถึงชื่อโครงการก่อนหน้า

**เป้าหมาย (ดาวเหนือ):** ให้ข้อโต้แย้งที่ผ่านการตรวจสอบโดยเครื่องว่า OpenClaw บังคับใช้นโยบายความปลอดภัยที่ตั้งใจไว้ (การอนุญาต, การแยก session, การควบคุม tool gating, และความปลอดภัยจากการกำหนดค่าผิดพลาด) ภายใต้สมมติฐานที่ระบุอย่างชัดเจน

**สิ่งนี้คืออะไร (ปัจจุบัน):** **ชุดทดสอบถดถอยด้านความปลอดภัย** ที่เรียกใช้ได้และขับเคลื่อนโดยผู้โจมตี:

- แต่ละคำกล่าวอ้างมี model-check ที่รันได้บนพื้นที่สถานะจำกัด
- หลายคำกล่าวอ้างมี **โมเดลเชิงลบ** คู่กันที่สร้างร่องรอยตัวอย่างโต้แย้งสำหรับกลุ่มบั๊กที่สมจริง

**สิ่งนี้ยังไม่ใช่อะไร (ตอนนี้):** หลักฐานว่า "OpenClaw ปลอดภัยในทุกแง่มุม" หรือว่า implementation TypeScript ทั้งหมดถูกต้อง

## โมเดลอยู่ที่ไหน

โมเดลได้รับการดูแลใน repo แยกต่างหาก: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)

## ข้อควรระวังสำคัญ

- สิ่งเหล่านี้คือ **โมเดล** ไม่ใช่ implementation TypeScript ทั้งหมด การคลาดเคลื่อนระหว่างโมเดลกับโค้ดอาจเกิดขึ้นได้
- ผลลัพธ์ถูกจำกัดด้วยพื้นที่สถานะที่ TLC สำรวจ; "เขียว" ไม่ได้หมายความว่าปลอดภัยนอกเหนือจากสมมติฐานและขอบเขตที่ถูกโมเดลไว้
- บางคำกล่าวอ้างพึ่งพาสมมติฐานด้านสภาพแวดล้อมที่ระบุไว้อย่างชัดเจน (เช่น การ deploy ที่ถูกต้อง, อินพุตการกำหนดค่าที่ถูกต้อง)

## การทำซ้ำผลลัพธ์

ปัจจุบัน ผลลัพธ์ทำซ้ำได้โดย clone repo โมเดลลงในเครื่องและรัน TLC (ดูด้านล่าง) iteration ในอนาคตอาจมี:

- โมเดลที่รันด้วย CI พร้อม artifact สาธารณะ (ร่องรอยตัวอย่างโต้แย้ง, log การรัน)
- workflow แบบโฮสต์สำหรับ "รันโมเดลนี้" สำหรับการตรวจสอบขนาดเล็กที่มีขอบเขตจำกัด

เริ่มต้นใช้งาน:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### การเปิดเผย Gateway และการกำหนดค่า Gateway แบบเปิดที่ผิดพลาด

**คำกล่าวอ้าง:** การ bind นอกเหนือจาก loopback โดยไม่มี auth อาจทำให้เกิดการ compromise จากระยะไกลได้ / เพิ่มการเปิดเผย; token/password บล็อกผู้โจมตีที่ไม่ได้ auth (ตามสมมติฐานของโมเดล)

- รันที่ผ่าน:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- แดง (ตามคาด):
  - `make gateway-exposure-v2-negative`

ดูเพิ่มเติม: `docs/gateway-exposure-matrix.md` ใน repo โมเดล

### pipeline การ exec ของ Node (ความสามารถที่มีความเสี่ยงสูงสุด)

**คำกล่าวอ้าง:** `exec host=node` ต้องมี (a) allowlist คำสั่งของ node พร้อมคำสั่งที่ประกาศไว้ และ (b) การอนุมัติสดเมื่อกำหนดค่าไว้; การอนุมัติถูก tokenize เพื่อป้องกันการ replay (ในโมเดล)

- รันที่ผ่าน:
  - `make nodes-pipeline`
  - `make approvals-token`
- แดง (ตามคาด):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### pairing store (การควบคุม DM gating)

**คำกล่าวอ้าง:** คำขอ pairing เคารพ TTL และขีดจำกัดคำขอที่รอดำเนินการ

- รันที่ผ่าน:
  - `make pairing`
  - `make pairing-cap`
- แดง (ตามคาด):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Ingress gating (การ mention + การ bypass คำสั่งควบคุม)

**คำกล่าวอ้าง:** ในบริบทกลุ่มที่ต้องมีการ mention "คำสั่งควบคุม" ที่ไม่ได้รับอนุญาตไม่สามารถ bypass mention gating ได้

- ผ่าน:
  - `make ingress-gating`
- แดง (ตามคาด):
  - `make ingress-gating-negative`

### การแยก routing/session-key

**คำกล่าวอ้าง:** DM จาก peer ที่แตกต่างกันจะไม่ถูกรวมเข้าเป็น session เดียวกัน เว้นแต่จะถูกเชื่อมโยง/กำหนดค่าไว้อย่างชัดเจน

- ผ่าน:
  - `make routing-isolation`
- แดง (ตามคาด):
  - `make routing-isolation-negative`

## v1++: โมเดลเพิ่มเติมแบบมีขอบเขตจำกัด (concurrency, การ retry, ความถูกต้องของ trace)

สิ่งเหล่านี้คือโมเดลต่อยอดที่เพิ่มความเที่ยงตรงรอบ failure mode ในโลกจริง (การอัปเดตที่ไม่เป็น atomic, การ retry, และ message fan-out)

### concurrency / idempotency ของ pairing store

**คำกล่าวอ้าง:** pairing store ควรบังคับใช้ `MaxPending` และ idempotency ได้แม้อยู่ภายใต้ interleaving (กล่าวคือ "check-then-write" ต้องเป็น atomic / ถูก lock; refresh ไม่ควรสร้างรายการซ้ำ)

ความหมาย:

- ภายใต้คำขอพร้อมกัน คุณไม่สามารถเกิน `MaxPending` สำหรับ channel ได้
- คำขอ/การ refresh ซ้ำสำหรับ `(channel, sender)` เดียวกันไม่ควรสร้างแถว pending สดที่ซ้ำกัน

- รันที่ผ่าน:
  - `make pairing-race` (การตรวจสอบ cap แบบ atomic/locked)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- แดง (ตามคาด):
  - `make pairing-race-negative` (การแข่งขัน cap แบบ begin/commit ที่ไม่เป็น atomic)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### การสัมพันธ์ trace / idempotency ของ Ingress

**คำกล่าวอ้าง:** ingestion ควรรักษาการสัมพันธ์ของ trace ข้าม fan-out และเป็น idempotent ภายใต้การ retry ของ provider

ความหมาย:

- เมื่อ event ภายนอกหนึ่งรายการกลายเป็นข้อความภายในหลายรายการ ทุกส่วนจะคง identity ของ trace/event เดียวกันไว้
- การ retry ไม่ทำให้เกิดการประมวลผลซ้ำ
- หาก provider event ID หายไป dedupe จะ fallback ไปยัง key ที่ปลอดภัย (เช่น trace ID) เพื่อหลีกเลี่ยงการทิ้ง event ที่แตกต่างกัน

- ผ่าน:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- แดง (ตามคาด):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### ลำดับความสำคัญของ routing dmScope + identityLinks

**คำกล่าวอ้าง:** routing ต้องแยก session ของ DM ตามค่าเริ่มต้น และรวม session เฉพาะเมื่อกำหนดค่าไว้อย่างชัดเจนเท่านั้น (ลำดับความสำคัญของ channel + identity links)

ความหมาย:

- การ override `dmScope` เฉพาะ channel ต้องชนะค่าเริ่มต้นแบบ global
- identityLinks ควรรวมเฉพาะภายในกลุ่มที่เชื่อมโยงไว้อย่างชัดเจนเท่านั้น ไม่ใช่ข้าม peer ที่ไม่เกี่ยวข้องกัน

- ผ่าน:
  - `make routing-precedence`
  - `make routing-identitylinks`
- แดง (ตามคาด):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## ที่เกี่ยวข้อง

- [โมเดลภัยคุกคาม](/th/security/THREAT-MODEL-ATLAS)
- [การมีส่วนร่วมกับโมเดลภัยคุกคาม](/th/security/CONTRIBUTING-THREAT-MODEL)
