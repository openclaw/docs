---
read_when:
    - คุณต้องการให้การเลื่อนระดับหน่วยความจำทำงานโดยอัตโนมัติ
    - คุณต้องการเข้าใจว่าระยะต่าง ๆ ของ Dreaming ทำอะไรบ้าง
    - คุณต้องการปรับแต่งการรวมความทรงจำโดยไม่ทำให้ `MEMORY.md` ปะปนไปด้วยข้อมูลไม่จำเป็น
sidebarTitle: Dreaming
summary: การรวมความทรงจำเบื้องหลังด้วยระยะ light, deep และ REM พร้อม Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-26T11:27:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: cba9593c5f697d49dbb20a3c908bf43ad37989f8cb029443b44523f2acab0e1d
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming คือระบบรวมความทรงจำเบื้องหลังใน `memory-core` โดยช่วยให้ OpenClaw ย้ายสัญญาณระยะสั้นที่มีน้ำหนักมากไปยังหน่วยความจำถาวร พร้อมคงความสามารถในการอธิบายและการตรวจสอบย้อนกลับได้

<Note>
Dreaming เป็น **ฟีเจอร์แบบเลือกใช้** และปิดอยู่เป็นค่าเริ่มต้น
</Note>

## สิ่งที่ Dreaming เขียน

Dreaming เก็บเอาต์พุตไว้ 2 ประเภท:

- **สถานะของเครื่อง** ใน `memory/.dreams/` (recall store, phase signals, ingestion checkpoints, locks)
- **เอาต์พุตที่มนุษย์อ่านได้** ใน `DREAMS.md` (หรือ `dreams.md` ที่มีอยู่เดิม) และไฟล์รายงานของ phase แบบเลือกได้ภายใต้ `memory/dreaming/<phase>/YYYY-MM-DD.md`

การเลื่อนระดับไปยังหน่วยความจำระยะยาวยังคงเขียนลง `MEMORY.md` เท่านั้น

## โมเดล phase

Dreaming ใช้ 3 phase ที่ทำงานร่วมกัน:

| Phase | วัตถุประสงค์                              | การเขียนแบบถาวร   |
| ----- | ----------------------------------------- | ----------------- |
| Light | คัดแยกและจัดเตรียมข้อมูลระยะสั้นล่าสุด    | ไม่เขียน           |
| Deep  | ให้คะแนนและเลื่อนระดับผู้สมัครแบบถาวร     | ใช่ (`MEMORY.md`) |
| REM   | สะท้อนธีมและแนวคิดที่เกิดซ้ำ              | ไม่เขียน           |

phase เหล่านี้เป็นรายละเอียดการทำงานภายใน ไม่ใช่ "โหมด" ที่ผู้ใช้ตั้งค่าแยกกันได้

<AccordionGroup>
  <Accordion title="ระยะ Light">
    ระยะ Light จะนำเข้าสัญญาณหน่วยความจำรายวันล่าสุดและร่องรอย recall มาลดข้อมูลซ้ำ และจัดเตรียมบรรทัดผู้สมัคร

    - อ่านจากสถานะ recall ระยะสั้น, ไฟล์หน่วยความจำรายวันล่าสุด และ session transcript ที่ปิดข้อมูลสำคัญแล้วเมื่อมีให้ใช้
    - เขียนบล็อก `## Light Sleep` ที่ระบบจัดการให้เมื่อพื้นที่จัดเก็บรองรับเอาต์พุตแบบ inline
    - บันทึกสัญญาณ reinforcement สำหรับใช้จัดอันดับ deep ในภายหลัง
    - จะไม่เขียนลง `MEMORY.md` เด็ดขาด

  </Accordion>
  <Accordion title="ระยะ Deep">
    ระยะ Deep จะตัดสินว่าอะไรควรกลายเป็นหน่วยความจำระยะยาว

    - จัดอันดับผู้สมัครโดยใช้การให้คะแนนแบบถ่วงน้ำหนักและเกณฑ์ threshold
    - ต้องผ่าน `minScore`, `minRecallCount` และ `minUniqueQueries`
    - ดึง snippet จากไฟล์รายวันปัจจุบันกลับมาอีกครั้งก่อนเขียน ดังนั้น snippet ที่เก่าหรือถูกลบจะถูกข้าม
    - ต่อท้ายรายการที่เลื่อนระดับแล้วลงใน `MEMORY.md`
    - เขียนสรุป `## Deep Sleep` ลงใน `DREAMS.md` และสามารถเขียน `memory/dreaming/deep/YYYY-MM-DD.md` ได้แบบเลือกได้

  </Accordion>
  <Accordion title="ระยะ REM">
    ระยะ REM จะดึงรูปแบบและสัญญาณเชิงสะท้อนออกมา

    - สร้างสรุปธีมและการสะท้อนจากร่องรอยระยะสั้นล่าสุด
    - เขียนบล็อก `## REM Sleep` ที่ระบบจัดการให้เมื่อพื้นที่จัดเก็บรองรับเอาต์พุตแบบ inline
    - บันทึกสัญญาณ reinforcement จาก REM ที่ใช้ในการจัดอันดับ deep
    - จะไม่เขียนลง `MEMORY.md` เด็ดขาด

  </Accordion>
</AccordionGroup>

## การนำเข้า session transcript

Dreaming สามารถนำ session transcript ที่ปิดข้อมูลสำคัญแล้วเข้าสู่ชุดข้อมูลของ Dreaming ได้ เมื่อมี transcript พร้อมใช้งาน ข้อมูลเหล่านี้จะถูกส่งเข้าสู่ระยะ Light ควบคู่กับสัญญาณหน่วยความจำรายวันและร่องรอย recall เนื้อหาส่วนบุคคลและข้อมูลอ่อนไหวจะถูกปิดบังก่อนนำเข้า

## Dream Diary

Dreaming ยังเก็บ **Dream Diary** แบบบรรยายไว้ใน `DREAMS.md` ด้วย หลังจากแต่ละ phase มีข้อมูลเพียงพอแล้ว `memory-core` จะรันเทิร์น subagent เบื้องหลังแบบ best-effort (โดยใช้โมเดล runtime ค่าเริ่มต้น) และต่อท้ายบันทึก diary สั้น ๆ

<Note>
diary นี้มีไว้สำหรับให้อ่านใน Dreams UI ไม่ใช่แหล่งที่มาสำหรับการเลื่อนระดับ อาร์ติแฟกต์ diary/report ที่สร้างโดย Dreaming จะถูกยกเว้นจากการเลื่อนระดับระยะสั้น มีเพียง snippet หน่วยความจำที่อิงข้อเท็จจริงเท่านั้นที่มีสิทธิ์ถูกเลื่อนระดับไปยัง `MEMORY.md`
</Note>

ยังมี lane สำหรับ historical backfill ที่อิงข้อเท็จจริงเพื่อใช้ในการตรวจสอบและการกู้คืนด้วย:

<AccordionGroup>
  <Accordion title="คำสั่ง Backfill">
    - `memory rem-harness --path ... --grounded` แสดงตัวอย่างเอาต์พุต diary แบบอิงข้อเท็จจริงจากโน้ตย้อนหลัง `YYYY-MM-DD.md`
    - `memory rem-backfill --path ...` เขียนรายการ diary แบบอิงข้อเท็จจริงที่ย้อนกลับได้ลงใน `DREAMS.md`
    - `memory rem-backfill --path ... --stage-short-term` จัดเตรียมผู้สมัครแบบถาวรที่อิงข้อเท็จจริงไว้ใน evidence store ระยะสั้นเดียวกับที่ระยะ Deep ปกติใช้อยู่แล้ว
    - `memory rem-backfill --rollback` และ `--rollback-short-term` จะลบอาร์ติแฟกต์ backfill ที่จัดเตรียมไว้เหล่านั้น โดยไม่แตะรายการ diary ปกติหรือ live short-term recall
  </Accordion>
</AccordionGroup>

Control UI เปิดให้ใช้โฟลว์ backfill/reset ของ diary แบบเดียวกันด้วย เพื่อให้คุณตรวจสอบผลลัพธ์ในฉาก Dreams ก่อนตัดสินใจว่าผู้สมัครแบบ grounded เหล่านั้นสมควรถูกเลื่อนระดับหรือไม่ ฉากนี้ยังแสดง lane แบบ grounded ที่แยกต่างหากด้วย เพื่อให้คุณเห็นว่ารายการระยะสั้นที่ถูกจัดเตรียมรายการใดมาจากการ replay ข้อมูลย้อนหลัง รายการใดที่ถูกเลื่อนระดับโดยมี grounded เป็นตัวนำ และสามารถล้างเฉพาะรายการที่จัดเตรียมแบบ grounded-only ได้โดยไม่กระทบสถานะระยะสั้นแบบ live ปกติ

## สัญญาณการจัดอันดับ Deep

การจัดอันดับ Deep ใช้สัญญาณพื้นฐานแบบถ่วงน้ำหนัก 6 ตัว ร่วมกับ phase reinforcement:

| สัญญาณ              | น้ำหนัก | คำอธิบาย                                         |
| ------------------- | ------- | ------------------------------------------------ |
| Frequency           | 0.24    | จำนวนสัญญาณระยะสั้นที่รายการนั้นสะสมไว้         |
| Relevance           | 0.30    | คุณภาพการดึงข้อมูลเฉลี่ยของรายการนั้น           |
| Query diversity     | 0.15    | บริบท query/day ที่แตกต่างกันซึ่งทำให้มันปรากฏ |
| Recency             | 0.15    | คะแนนความใหม่ที่ลดทอนตามเวลา                    |
| Consolidation       | 0.10    | ความแข็งแรงของการเกิดซ้ำข้ามหลายวัน             |
| Conceptual richness | 0.06    | ความหนาแน่นของ concept-tag จาก snippet/path     |

การพบในระยะ Light และ REM จะเพิ่ม boost เล็กน้อยแบบลดทอนตามเวลา จาก `memory/.dreams/phase-signals.json`

## การตั้งเวลา

เมื่อเปิดใช้งาน `memory-core` จะจัดการงาน cron หนึ่งรายการโดยอัตโนมัติสำหรับการกวาด Dreaming แบบเต็ม แต่ละรอบจะรัน phase ตามลำดับ: light → REM → deep

พฤติกรรม cadence ค่าเริ่มต้น:

| การตั้งค่า            | ค่าเริ่มต้น |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## เริ่มต้นอย่างรวดเร็ว

<Tabs>
  <Tab title="เปิดใช้ Dreaming">
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
  </Tab>
  <Tab title="ปรับ cadence ของการกวาดเอง">
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
  </Tab>
</Tabs>

## คำสั่ง Slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## เวิร์กโฟลว์ CLI

<Tabs>
  <Tab title="แสดงตัวอย่าง / ใช้การเลื่อนระดับ">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    `memory promote` แบบ manual จะใช้ threshold ของระยะ Deep เป็นค่าเริ่มต้น เว้นแต่จะมีการ override ด้วยแฟล็ก CLI

  </Tab>
  <Tab title="อธิบายการเลื่อนระดับ">
    อธิบายว่าทำไมผู้สมัครที่ระบุจึงจะถูกหรือไม่ถูกเลื่อนระดับ:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="แสดงตัวอย่าง REM harness">
    แสดงตัวอย่างการสะท้อนของ REM, candidate truths และเอาต์พุตการเลื่อนระดับของ Deep โดยไม่เขียนอะไรเลย:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## ค่าเริ่มต้นสำคัญ

การตั้งค่าทั้งหมดอยู่ภายใต้ `plugins.entries.memory-core.config.dreaming`

<ParamField path="enabled" type="boolean" default="false">
  เปิดหรือปิดการกวาด Dreaming
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  จังหวะ Cron สำหรับการกวาด Dreaming แบบเต็ม
</ParamField>

<Note>
นโยบาย phase, threshold และพฤติกรรมของการจัดเก็บเป็นรายละเอียดการทำงานภายใน (ไม่ใช่คอนฟิกที่ผู้ใช้เห็นโดยตรง) ดู [ข้อมูลอ้างอิงการตั้งค่า Memory](/th/reference/memory-config#dreaming) สำหรับรายการคีย์ทั้งหมด
</Note>

## Dreams UI

เมื่อเปิดใช้งาน แท็บ **Dreams** ของ Gateway จะแสดง:

- สถานะการเปิดใช้ Dreaming ปัจจุบัน
- สถานะระดับ phase และการมีอยู่ของ managed-sweep
- จำนวนระยะสั้น, grounded, signal และ promoted-today
- เวลาการรันตามกำหนดครั้งถัดไป
- lane ของ Scene แบบ grounded ที่แยกต่างหากสำหรับรายการ replay ย้อนหลังที่ถูกจัดเตรียมไว้
- ตัวอ่าน Dream Diary แบบขยายได้ที่ขับเคลื่อนโดย `doctor.memory.dreamDiary`

## ที่เกี่ยวข้อง

- [Memory](/th/concepts/memory)
- [Memory CLI](/th/cli/memory)
- [ข้อมูลอ้างอิงการตั้งค่า Memory](/th/reference/memory-config)
- [การค้นหา Memory](/th/concepts/memory-search)
