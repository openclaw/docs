---
read_when:
    - คุณต้องแก้ไขไฟล์หลายไฟล์อย่างเป็นระบบ
    - คุณต้องการจัดทำเอกสารหรือแก้ไขข้อบกพร่องของการแก้ไขที่อิงแพตช์
summary: ใช้แพตช์กับหลายไฟล์ด้วยเครื่องมือ apply_patch
title: เครื่องมือ apply_patch
x-i18n:
    generated_at: "2026-07-12T16:45:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

ใช้การเปลี่ยนแปลงไฟล์ด้วยรูปแบบแพตช์ที่มีโครงสร้าง วิธีนี้เหมาะสำหรับการแก้ไขหลายไฟล์
หรือหลายส่วน ซึ่งการเรียก `edit` เพียงครั้งเดียวอาจเปราะบางและเกิดข้อผิดพลาดได้ง่าย

เครื่องมือนี้รับสตริง `input` เพียงรายการเดียว ซึ่งครอบการดำเนินการกับไฟล์อย่างน้อยหนึ่งรายการ:

```text
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@ optional change context
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## พารามิเตอร์

- `input` (จำเป็น): เนื้อหาแพตช์ทั้งหมด รวมถึง `*** Begin Patch` และ `*** End Patch`

## หมายเหตุ

- พาธในแพตช์รองรับทั้งพาธสัมพัทธ์ (อ้างอิงจากไดเรกทอรีพื้นที่ทำงาน) และพาธสัมบูรณ์
- ค่าเริ่มต้นของ `tools.exec.applyPatch.workspaceOnly` คือ `true` (จำกัดให้อยู่ภายในพื้นที่ทำงาน) ตั้งค่าเป็น `false` เฉพาะเมื่อคุณตั้งใจให้ `apply_patch` เขียนหรือลบไฟล์ภายนอกไดเรกทอรีพื้นที่ทำงาน
- ใช้ `*** Move to:` ภายในส่วน `*** Update File:` เพื่อเปลี่ยนชื่อไฟล์
- `*** End of File` ใช้ระบุการแทรกเฉพาะที่ท้ายไฟล์เมื่อจำเป็น
- เปิดใช้งานเป็นค่าเริ่มต้นสำหรับทุกโมเดล ตั้งค่า `tools.exec.applyPatch.enabled: false`
  เพื่อปิดใช้งาน หรือจำกัดให้ใช้ได้เฉพาะบางโมเดลด้วย
  `tools.exec.applyPatch.allowModels` (รองรับรหัสดิบ เช่น `gpt-5.4` หรือรหัสแบบเต็ม
  เช่น `openai/gpt-5.4`)
- การกำหนดค่าอยู่ภายใต้ `tools.exec.applyPatch.*`

## ตัวอย่าง

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ส่วนต่าง" href="/th/tools/diffs" icon="code-compare">
    เครื่องมือดูส่วนต่างแบบอ่านอย่างเดียวสำหรับนำเสนอการเปลี่ยนแปลง
  </Card>
  <Card title="เครื่องมือ Exec" href="/th/tools/exec" icon="terminal">
    การเรียกใช้คำสั่งเชลล์จากเอเจนต์
  </Card>
  <Card title="การเรียกใช้โค้ด" href="/th/tools/code-execution" icon="square-code">
    การวิเคราะห์ด้วย Python จากระยะไกลในสภาพแวดล้อมแยกด้วย xAI
  </Card>
</CardGroup>
