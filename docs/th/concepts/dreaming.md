---
read_when:
    - คุณต้องการให้การเลื่อนระดับหน่วยความจำทำงานโดยอัตโนมัติ
    - คุณต้องการเข้าใจว่าแต่ละระยะของ Dreaming ทำอะไรบ้าง
    - คุณต้องการปรับแต่งการรวมหน่วยความจำโดยไม่ทำให้ `MEMORY.md` ปะปนไปด้วยข้อมูลไม่จำเป็น
summary: การรวมหน่วยความจำเบื้องหลังด้วยระยะ light, deep และ REM พร้อม Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-23T10:17:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a44c7568992e60d249d7e424a585318401f678767b9feb7d75c830b01de1cf6
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming คือระบบรวมหน่วยความจำเบื้องหลังใน `memory-core`
ซึ่งช่วยให้ OpenClaw ย้ายสัญญาณระยะสั้นที่มีน้ำหนักไปยังหน่วยความจำถาวร โดยยังคง
ทำให้กระบวนการนี้อธิบายและตรวจทานได้

Dreaming เป็นฟังก์ชันแบบ **opt-in** และปิดใช้งานโดยค่าเริ่มต้น

## สิ่งที่ Dreaming เขียน

Dreaming เก็บผลลัพธ์ไว้ 2 ประเภท:

- **สถานะของเครื่อง** ใน `memory/.dreams/` (recall store, phase signals, ingestion checkpoints, locks)
- **ผลลัพธ์ที่มนุษย์อ่านได้** ใน `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่เดิม) และไฟล์รายงาน phase แบบเพิ่มเติมภายใต้ `memory/dreaming/<phase>/YYYY-MM-DD.md`

การเลื่อนระดับระยะยาวยังคงเขียนลง `MEMORY.md` เท่านั้น

## โมเดล phase

Dreaming ใช้ 3 phase ที่ทำงานร่วมกัน:

| Phase | วัตถุประสงค์                              | การเขียนแบบถาวร    |
| ----- | ----------------------------------------- | ------------------ |
| Light | จัดเรียงและจัดเตรียมข้อมูลระยะสั้นล่าสุด | ไม่                |
| Deep  | ให้คะแนนและเลื่อนระดับตัวเลือกถาวร       | ใช่ (`MEMORY.md`)  |
| REM   | สะท้อนธีมและแนวคิดที่เกิดซ้ำ             | ไม่                |

phase เหล่านี้เป็นรายละเอียดการทำงานภายใน ไม่ใช่ "โหมด"
ที่ผู้ใช้กำหนดค่าแยกกัน

### phase Light

phase Light นำเข้าสัญญาณหน่วยความจำรายวันล่าสุดและร่องรอย recall ทำการ dedupe
และจัดเตรียมบรรทัดตัวเลือก

- อ่านจากสถานะ recall ระยะสั้น ไฟล์หน่วยความจำรายวันล่าสุด และ session transcript ที่ปกปิดข้อมูลแล้วเมื่อมี
- เขียนบล็อก `## Light Sleep` ที่จัดการโดยระบบเมื่อ storage รองรับผลลัพธ์แบบ inline
- บันทึกสัญญาณ reinforcement สำหรับการจัดอันดับ deep ในภายหลัง
- ไม่เขียนลง `MEMORY.md` เด็ดขาด

### phase Deep

phase Deep ตัดสินใจว่าสิ่งใดจะกลายเป็นหน่วยความจำระยะยาว

- จัดอันดับตัวเลือกโดยใช้การให้คะแนนแบบถ่วงน้ำหนักและ threshold gates
- ต้องผ่าน `minScore`, `minRecallCount` และ `minUniqueQueries`
- โหลด snippet จากไฟล์รายวันจริงอีกครั้งก่อนเขียน จึงข้าม snippet ที่เก่าหรือลบไปแล้ว
- ต่อท้ายรายการที่ถูกเลื่อนระดับลงใน `MEMORY.md`
- เขียนสรุป `## Deep Sleep` ลงใน `DREAMS.md` และสามารถเขียน `memory/dreaming/deep/YYYY-MM-DD.md` แบบเพิ่มเติมได้

### phase REM

phase REM แยกรูปแบบและสัญญาณเชิงสะท้อน

- สร้างสรุปธีมและการสะท้อนจากร่องรอยระยะสั้นล่าสุด
- เขียนบล็อก `## REM Sleep` ที่จัดการโดยระบบเมื่อ storage รองรับผลลัพธ์แบบ inline
- บันทึกสัญญาณ reinforcement ของ REM ที่ใช้โดยการจัดอันดับ deep
- ไม่เขียนลง `MEMORY.md` เด็ดขาด

## การนำเข้า session transcript

Dreaming สามารถนำเข้า session transcript ที่ปกปิดข้อมูลแล้วเข้าสู่ corpus ของ Dreaming ได้ เมื่อ
มี transcript พร้อมใช้งาน transcript จะถูกป้อนเข้าสู่ phase Light ควบคู่กับสัญญาณหน่วยความจำรายวัน
และร่องรอย recall เนื้อหาส่วนบุคคลและข้อมูลอ่อนไหวจะถูกปกปิด
ก่อนการนำเข้า

## Dream Diary

Dreaming ยังเก็บ **Dream Diary** แบบบรรยายไว้ใน `DREAMS.md`
หลังจากแต่ละ phase มีข้อมูลเพียงพอ `memory-core` จะรัน subagent เบื้องหลังแบบ best-effort
(โดยใช้โมเดลรันไทม์ค่าเริ่มต้น) และต่อท้ายบันทึกไดอารีสั้น ๆ

ไดอารีนี้มีไว้ให้อ่านโดยมนุษย์ใน Dreams UI ไม่ใช่แหล่งสำหรับการเลื่อนระดับ
อาร์ติแฟกต์ไดอารี/รายงานที่สร้างโดย Dreaming จะถูกยกเว้นจากการ
เลื่อนระดับระยะสั้น เฉพาะ snippet หน่วยความจำที่มีหลักฐานรองรับเท่านั้นที่มีสิทธิ์เลื่อนระดับเข้า
`MEMORY.md`

ยังมี lane สำหรับ historical backfill แบบ grounded สำหรับงานตรวจทานและกู้คืนด้วย:

- `memory rem-harness --path ... --grounded` พรีวิวผลลัพธ์ไดอารีแบบ grounded จากโน้ตย้อนหลัง `YYYY-MM-DD.md`
- `memory rem-backfill --path ...` เขียนรายการไดอารีแบบ grounded ที่ย้อนกลับได้ลงใน `DREAMS.md`
- `memory rem-backfill --path ... --stage-short-term` จัดเตรียมตัวเลือกถาวรแบบ grounded ลงใน evidence store ระยะสั้นเดียวกับที่ phase Deep ปกติใช้อยู่แล้ว
- `memory rem-backfill --rollback` และ `--rollback-short-term` ลบอาร์ติแฟกต์ backfill ที่จัดเตรียมไว้โดยไม่กระทบรายการไดอารีปกติหรือ recall ระยะสั้นที่ใช้งานจริง

Control UI แสดงโฟลว์ backfill/reset ของไดอารีแบบเดียวกันด้วย เพื่อให้คุณตรวจสอบ
ผลลัพธ์ในฉาก Dreams ก่อนตัดสินใจว่าตัวเลือกแบบ grounded
สมควรถูกเลื่อนระดับหรือไม่ Scene ยังแสดง grounded lane แยกต่างหากเพื่อให้คุณเห็นว่า
รายการระยะสั้นที่จัดเตรียมไว้รายการใดมาจาก historical replay รายการใดที่ถูกเลื่อนระดับโดยมี grounded เป็นตัวนำ และสามารถล้างเฉพาะรายการที่จัดเตรียมไว้แบบ grounded-only ได้โดยไม่กระทบสถานะระยะสั้นปกติที่ใช้งานจริง

## สัญญาณการจัดอันดับ deep

การจัดอันดับ deep ใช้สัญญาณพื้นฐานแบบถ่วงน้ำหนัก 6 รายการ บวกกับ phase reinforcement:

| Signal              | Weight | คำอธิบาย                                         |
| ------------------- | ------ | ------------------------------------------------ |
| Frequency           | 0.24   | รายการนั้นสะสมสัญญาณระยะสั้นไว้กี่รายการ       |
| Relevance           | 0.30   | คุณภาพการดึงคืนเฉลี่ยของรายการนั้น              |
| Query diversity     | 0.15   | บริบท query/วันที่ที่ต่างกันซึ่งทำให้มันปรากฏขึ้น |
| Recency             | 0.15   | คะแนนความใหม่แบบลดทอนตามเวลา                   |
| Consolidation       | 0.10   | ความแข็งแรงของการเกิดซ้ำข้ามหลายวัน            |
| Conceptual richness | 0.06   | ความหนาแน่นของ concept tag จาก snippet/path     |

การพบใน phase Light และ REM จะเพิ่ม boost เล็กน้อยที่ลดทอนตามเวลา จาก
`memory/.dreams/phase-signals.json`

## การจัดตารางเวลา

เมื่อเปิดใช้ `memory-core` จะจัดการ Cron job หนึ่งรายการโดยอัตโนมัติสำหรับการกวาด Dreaming แบบเต็ม
แต่ละรอบจะรัน phase ตามลำดับ: light -> REM -> deep

พฤติกรรมรอบเวลาค่าเริ่มต้น:

| Setting              | ค่าเริ่มต้น |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## เริ่มต้นอย่างรวดเร็ว

เปิดใช้ Dreaming:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

เปิดใช้ Dreaming พร้อมรอบเวลาการกวาดแบบกำหนดเอง:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## คำสั่ง slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## เวิร์กโฟลว์ CLI

ใช้การเลื่อนระดับผ่าน CLI สำหรับการพรีวิวหรือการนำไปใช้ด้วยตนเอง:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

`memory promote` แบบแมนนวลจะใช้ threshold ของ phase Deep โดยค่าเริ่มต้น เว้นแต่จะถูก override
ด้วยแฟล็ก CLI

อธิบายว่าทำไมตัวเลือกรายการหนึ่งจึงจะถูกเลื่อนระดับหรือไม่ถูกเลื่อนระดับ:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

พรีวิวการสะท้อนของ REM ข้อเท็จจริงตัวเลือก และผลลัพธ์การเลื่อนระดับแบบ deep โดยไม่
เขียนอะไรเลย:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## ค่าเริ่มต้นสำคัญ

การตั้งค่าทั้งหมดอยู่ภายใต้ `plugins.entries.memory-core.config.dreaming`

| Key         | ค่าเริ่มต้น |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

นโยบาย phase, threshold และพฤติกรรมของ storage เป็นรายละเอียดการทำงาน
ภายใน (ไม่ใช่ config ที่ผู้ใช้ตั้งค่าโดยตรง)

ดู [ข้อมูลอ้างอิงการกำหนดค่า Memory](/th/reference/memory-config#dreaming)
สำหรับรายการคีย์ทั้งหมด

## Dreams UI

เมื่อเปิดใช้ แท็บ **Dreams** ใน Gateway จะแสดง:

- สถานะเปิดใช้ Dreaming ปัจจุบัน
- สถานะระดับ phase และการมีอยู่ของ managed-sweep
- จำนวนรายการระยะสั้น grounded signal และที่เลื่อนระดับแล้วในวันนี้
- เวลาของรอบการทำงานถัดไปตามตาราง
- grounded Scene lane แยกต่างหากสำหรับรายการ historical replay ที่จัดเตรียมไว้
- ตัวอ่าน Dream Diary แบบขยายได้ที่รองรับโดย `doctor.memory.dreamDiary`

## การแก้ไขปัญหา

### Dreaming ไม่ทำงานเลย (สถานะแสดง blocked)

Cron Dreaming ที่จัดการโดยระบบจะอาศัย Heartbeat ของเอเจนต์ค่าเริ่มต้น หาก Heartbeat ไม่ทำงานสำหรับเอเจนต์นั้น Cron จะเข้าคิว system event ที่ไม่มีใครรับไปประมวลผล และ Dreaming จะไม่ทำงานอย่างเงียบ ๆ ทั้ง `openclaw memory status` และ `/dreaming status` จะรายงาน `blocked` ในกรณีนี้ และระบุชื่อเอเจนต์ที่มี Heartbeat เป็นตัวขัดขวาง

สาเหตุทั่วไป 2 ประการ:

- มีเอเจนต์อื่นประกาศบล็อก `heartbeat:` แบบ explicit เมื่อมีรายการใด ๆ ใน `agents.list` ที่มีบล็อก `heartbeat` ของตัวเอง จะมีเพียงเอเจนต์เหล่านั้นเท่านั้นที่ทำ Heartbeat — ค่าเริ่มต้นจะไม่ถูกนำไปใช้กับทุกคนอีกต่อไป ดังนั้นเอเจนต์ค่าเริ่มต้นอาจเงียบไป ย้ายการตั้งค่า Heartbeat ไปที่ `agents.defaults.heartbeat` หรือเพิ่มบล็อก `heartbeat` แบบ explicit ในเอเจนต์ค่าเริ่มต้น ดู [ขอบเขตและลำดับความสำคัญ](/th/gateway/heartbeat#scope-and-precedence)
- `heartbeat.every` เป็น `0`, ว่างเปล่า หรือแปลค่าไม่ได้ Cron จะไม่มีช่วงเวลาให้ใช้จัดตาราง ดังนั้น Heartbeat จึงถูกปิดใช้งานโดยพฤตินัย ตั้งค่า `every` เป็นระยะเวลาบวก เช่น `30m` ดู [ค่าเริ่มต้น](/th/gateway/heartbeat#defaults)

## ที่เกี่ยวข้อง

- [Heartbeat](/th/gateway/heartbeat)
- [Memory](/th/concepts/memory)
- [Memory Search](/th/concepts/memory-search)
- [memory CLI](/th/cli/memory)
- [ข้อมูลอ้างอิงการกำหนดค่า Memory](/th/reference/memory-config)
