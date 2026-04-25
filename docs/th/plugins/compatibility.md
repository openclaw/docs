---
read_when:
    - คุณดูแล Plugin ของ OpenClaw մեկը
    - คุณเห็นคำเตือนเกี่ยวกับความเข้ากันได้ของ Plugin
    - คุณกำลังวางแผนการย้าย SDK ของ Plugin หรือ manifest
summary: สัญญาความเข้ากันได้ของ Plugin, metadata การเลิกใช้งาน และความคาดหวังในการย้ายระบบ
title: ความเข้ากันได้ของ Plugin
x-i18n:
    generated_at: "2026-04-25T13:53:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02e0cdbc763eed5a38b303fc44202ddd36e58bce43dc29b6348db3f5fea66f26
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw จะคงสัญญาของ Plugin รุ่นเก่าไว้ผ่าน compatibility
adapter ที่มีชื่อก่อนจะลบออก วิธีนี้ช่วยปกป้องทั้ง Plugin ที่มาพร้อมระบบและ Plugin ภายนอก
ขณะที่สัญญาของ SDK, manifest, setup, config และ runtime ของ Agent
กำลังเปลี่ยนแปลง

## registry ความเข้ากันได้

สัญญาความเข้ากันได้ของ Plugin ถูกติดตามใน registry หลักที่
`src/plugins/compat/registry.ts`

แต่ละระเบียนมี:

- compatibility code ที่เสถียร
- สถานะ: `active`, `deprecated`, `removal-pending` หรือ `removed`
- owner: SDK, config, setup, channel, provider, การรัน Plugin, runtime ของ Agent
  หรือ core
- วันที่เริ่มใช้และวันที่เลิกใช้งานเมื่อมี
- แนวทางการแทนที่
- เอกสาร การวินิจฉัย และการทดสอบที่ครอบคลุมพฤติกรรมทั้งเก่าและใหม่

registry คือแหล่งอ้างอิงสำหรับการวางแผนของผู้ดูแลและการตรวจสอบ
plugin inspector ในอนาคต หากพฤติกรรมที่เกี่ยวข้องกับ Plugin เปลี่ยนไป ให้เพิ่มหรืออัปเดต
compatibility record ในการเปลี่ยนแปลงเดียวกันกับที่เพิ่ม adapter

## แพ็กเกจ plugin inspector

plugin inspector ควรอยู่แยกนอก repo หลักของ OpenClaw เป็น
แพ็กเกจ/repository แยกต่างหากที่อิงกับสัญญาความเข้ากันได้และ manifest
แบบมีเวอร์ชัน

CLI รุ่นแรกควรเป็น:

```sh
openclaw-plugin-inspector ./my-plugin
```

มันควรแสดง:

- การตรวจสอบความถูกต้องของ manifest/schema
- เวอร์ชันของสัญญาความเข้ากันได้ที่กำลังตรวจสอบ
- การตรวจสอบ metadata ของ install/source
- การตรวจสอบ import บน cold path
- คำเตือนเรื่องการเลิกใช้งานและความเข้ากันได้

ใช้ `--json` เพื่อให้ได้เอาต์พุตแบบอ่านได้ด้วยเครื่องที่เสถียรสำหรับ annotation ใน CI OpenClaw
core ควรเปิดเผยสัญญาและ fixture ที่ inspector ใช้ได้ แต่ไม่ควร
เผยแพร่ไบนารี inspector จากแพ็กเกจ `openclaw` หลัก

## นโยบายการเลิกใช้งาน

OpenClaw ไม่ควรลบสัญญาของ Plugin ที่มีเอกสารแล้วในรีลีสเดียวกับ
ที่เปิดตัวตัวแทนใหม่

ลำดับการย้ายระบบคือ:

1. เพิ่มสัญญาใหม่
2. คงพฤติกรรมเก่าไว้ผ่าน compatibility adapter ที่มีชื่อ
3. แสดง diagnostics หรือ warnings เมื่อผู้เขียน Plugin สามารถลงมือได้
4. จัดทำเอกสารตัวแทนใหม่และกรอบเวลา
5. ทดสอบทั้งเส้นทางเก่าและใหม่
6. รอให้พ้นหน้าต่างการย้ายระบบที่ประกาศไว้
7. ลบออกได้เฉพาะเมื่อมีการอนุมัติรีลีสแบบ breaking อย่างชัดเจน

ระเบียนที่ deprecated ต้องมีวันที่เริ่มแสดงคำเตือน ตัวแทนใหม่ ลิงก์เอกสาร
และวันที่เป้าหมายสำหรับการลบเมื่อทราบแล้ว

## พื้นที่ความเข้ากันได้ในปัจจุบัน

compatibility record ปัจจุบันประกอบด้วย:

- การ import SDK แบบกว้างรุ่นเก่า เช่น `openclaw/plugin-sdk/compat`
- รูปแบบ Plugin แบบ hook-only รุ่นเก่าและ `before_agent_start`
- พฤติกรรม allowlist และการเปิดใช้งาน Plugin ที่มาพร้อมระบบ
- metadata ของ manifest สำหรับ env var ของ provider/channel รุ่นเก่า
- activation hints ที่กำลังถูกแทนที่ด้วย ownership ของ manifest contribution
- alias ของชื่อ `embeddedHarness` และ `agent-harness` ขณะที่ชื่อสาธารณะกำลังย้าย
  ไปสู่ `agentRuntime`
- fallback ของ metadata การกำหนดค่าช่องทางแบบ bundled ที่สร้างขึ้น ขณะกำลังนำ
  metadata `channelConfigs` แบบ registry-first มาใช้

โค้ด Plugin ใหม่ควรเลือกใช้ตัวแทนที่ระบุไว้ใน registry และใน
คู่มือการย้ายระบบเฉพาะทาง Plugin ที่มีอยู่แล้วสามารถใช้เส้นทางความเข้ากันได้ต่อไปได้
จนกว่าเอกสาร diagnostics และ release notes จะประกาศหน้าต่างการลบออก

## release notes

release notes ควรระบุการเลิกใช้งานของ Plugin ที่กำลังจะมาถึง พร้อมวันที่เป้าหมายและ
ลิงก์ไปยังเอกสารการย้ายระบบ การเตือนนี้ต้องเกิดขึ้นก่อนที่เส้นทางความเข้ากันได้จะย้ายไปเป็น
`removal-pending` หรือ `removed`
