---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับพื้นที่ทำงาน Raft
    - คุณกำลังกำหนดค่าเอเจนต์ภายนอกของ Raft
    - คุณกำลังแก้ไขข้อบกพร่องในการส่งการปลุกของ Raft
sidebarTitle: Raft
summary: การรองรับเอเจนต์ภายนอกของ Raft ผ่านบริดจ์ปลุกของ Raft CLI
title: แพลอยน้ำ
x-i18n:
    generated_at: "2026-07-12T15:54:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 454d92d764a4ec3b0ec52467cba254dcad795870e04d1d32d4cf65d8b451a0de
    source_path: channels/raft.md
    workflow: 16
---

Raft เชื่อมต่อเอเจนต์ OpenClaw กับ Raft External Agent ผ่าน Raft CLI ภายในเครื่อง
Raft ส่งสัญญาณปลุกที่ผ่านการยืนยันตัวตนไปยัง Gateway จากนั้นเอเจนต์จะ
ใช้ Raft CLI เพื่อตรวจสอบและส่งข้อความ รองรับเฉพาะแชตโดยตรง (ไม่รองรับกลุ่ม)

## การติดตั้ง

Raft เป็น Plugin ภายนอกอย่างเป็นทางการ ติดตั้งบนโฮสต์ Gateway:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

รายละเอียด: [Plugin](/th/tools/plugin)

## ข้อกำหนดเบื้องต้น

- พื้นที่ทำงาน Raft ที่มี External Agent
- ติดตั้ง Raft CLI บนโฮสต์เดียวกับ Gateway ของ OpenClaw และอยู่ใน
  `PATH` ของบริการ
- โปรไฟล์ Raft CLI ที่ลงชื่อเข้าใช้แล้วและเชื่อมโยงกับ
  External Agent นั้น

Plugin ไม่จัดเก็บข้อมูลประจำตัวของ Raft โดย Raft CLI จะเก็บ
ข้อมูลการยืนยันตัวตนดังกล่าวไว้ในโปรไฟล์ของตนเอง

## การกำหนดค่า

ตั้งค่าโปรไฟล์ในการกำหนดค่า:

```json5
{
  channels: {
    raft: {
      enabled: true,
      profile: "openclaw",
    },
  },
}
```

สำหรับบัญชีเริ่มต้น คุณสามารถตั้งค่า `RAFT_PROFILE` ในสภาพแวดล้อมของ
Gateway แทนได้:

```bash
RAFT_PROFILE=openclaw
```

ใช้บัญชีที่มีชื่อเมื่อ Gateway หนึ่งรายการเชื่อมต่อกับ Raft External Agent มากกว่าหนึ่งรายการ:

```json5
{
  channels: {
    raft: {
      accounts: {
        support: {
          profile: "support-agent",
        },
        engineering: {
          profile: "engineering-agent",
        },
      },
    },
  },
}
```

การตั้งค่าแบบโต้ตอบจะบันทึกโปรไฟล์เดียวกัน:

```bash
openclaw channels add --channel raft
```

## วิธีการทำงาน

เมื่อ Gateway เริ่มทำงาน Plugin จะ:

1. เปิดปลายทาง HTTP สำหรับการปลุกที่รับการเชื่อมต่อเฉพาะ local loopback บนพอร์ตชั่วคราว
2. เริ่ม `raft --profile <profile> agent bridge` โดยใช้ปลายทางนั้นและ
   โทเค็นเฉพาะกระบวนการ
3. ยอมรับเฉพาะสัญญาณปลุกที่ผ่านการยืนยันตัวตน ไม่มีเนื้อหา และมีข้อมูลระบุตัวตนสำหรับป้องกันการส่งซ้ำ
   จากบริดจ์ภายในเครื่อง
4. กำหนดให้เพย์โหลดการปลุกทุกรายการต้องมีค่าใดค่าหนึ่งจาก `eventId`, `attemptId`, `messageId`, `delivery_id`,
   `wake_id` หรือ `id`
5. ขจัดการส่งสัญญาณปลุกที่ลองส่งซ้ำโดยอิงตามรหัสเหตุการณ์ของบริดจ์เป็นเวลา 24 ชั่วโมง
   รวมถึงข้ามการรีสตาร์ต Gateway
6. ส่งคืนเซสชันรันไทม์ที่คงที่สำหรับบริดจ์ปัจจุบันและ
   ชุดระบายกิจกรรมที่ว่างเปล่าสำหรับโปรโตคอล Raft CLI
7. เริ่มรอบการทำงานของเอเจนต์ OpenClaw แบบเรียงลำดับหนึ่งรอบต่อสัญญาณปลุกที่ยอมรับแต่ละรายการ

บริดจ์เป็นผู้จัดการการลองส่ง Raft ซ้ำและการเชื่อมต่อใหม่ รอบการทำงานของ OpenClaw
จะได้รับเพียงการแจ้งเตือนให้ปลุก ไม่ใช่สำเนาเนื้อหาข้อความ Raft โดยจะใช้ CLI
เพื่ออ่านข้อความที่รอดำเนินการและส่งการตอบกลับ:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft ไม่ใช่กลไกขนส่งข้อความแบบพุช OpenClaw จะไม่ส่งข้อความสุดท้ายของโมเดลกลับผ่านบริดจ์โดยอัตโนมัติ ดังนั้นเอเจนต์ต้องใช้ Raft CLI หลังจากประมวลผลสัญญาณปลุกแล้ว
</Note>

## การตรวจสอบ

ตรวจสอบว่า OpenClaw สามารถค้นหา CLI และมีโปรไฟล์ที่กำหนดค่าไว้:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

จากนั้นส่งข้อความไปยัง Raft External Agent บันทึกของ Gateway ควรแสดง
การเริ่มต้นบริดจ์ Raft ตามด้วยสัญญาณปลุกขาเข้า เอเจนต์ควรใช้
โปรไฟล์ Raft ที่กำหนดค่าไว้เพื่อตรวจสอบข้อความที่รอดำเนินการ

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่พบ Raft CLI">
    ติดตั้ง Raft CLI บนโฮสต์ Gateway และทำให้ `raft` พร้อมใช้งานใน
    `PATH` ของบริการ ตรวจสอบด้วย `raft --help` แล้วรีสตาร์ต Gateway
  </Accordion>
  <Accordion title="บริดจ์หยุดทำงานทันที">
    ตรวจสอบว่าโปรไฟล์ที่กำหนดค่าไว้ลงชื่อเข้าใช้แล้วและเป็นของ
    Raft External Agent ที่ต้องการ เรียกใช้ `raft --profile <profile> agent bridge` โดยตรง
    เพื่อดูข้อมูลการวินิจฉัยจาก CLI
  </Accordion>
  <Accordion title="ได้รับสัญญาณปลุกแต่ไม่มีการส่งการตอบกลับ Raft">
    นี่เป็นพฤติกรรมที่คาดไว้เมื่อเอเจนต์ไม่ได้เรียกใช้ Raft CLI บริดจ์สำหรับการปลุก
    ไม่ได้ส่งผ่านเนื้อหาข้อความหรือการตอบกลับสุดท้ายโดยอัตโนมัติ ตรวจสอบ
    นโยบายเครื่องมือของเอเจนต์และตรวจสอบให้แน่ใจว่าสามารถเรียกใช้ `raft --profile <profile>
    message check` และ `message send` ได้
  </Accordion>
</AccordionGroup>

## แหล่งอ้างอิง

- [Raft](https://raft.build/)
- [เอกสาร Raft](https://docs.raft.build/welcome/)
- [การผสานรวม Hermes กับ Raft](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
