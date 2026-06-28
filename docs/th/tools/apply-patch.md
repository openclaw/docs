---
read_when:
    - คุณต้องแก้ไขไฟล์อย่างมีโครงสร้างในหลายไฟล์
    - คุณต้องการจัดทำเอกสารหรือดีบักการแก้ไขแบบใช้แพตช์
summary: ใช้แพตช์หลายไฟล์ด้วยเครื่องมือ apply_patch
title: เครื่องมือ apply_patch
x-i18n:
    generated_at: "2026-05-06T09:32:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ff2f8e6ecd55ff1bdc553619ab3d590d0967efe7a9a90a31946ad15fd89a1dc
    source_path: tools/apply-patch.md
    workflow: 16
    postprocess_version: locale-links-v1
---

ใช้การเปลี่ยนแปลงไฟล์ด้วยรูปแบบแพตช์ที่มีโครงสร้าง เหมาะสำหรับการแก้ไขหลายไฟล์
หรือหลายฮังก์ที่การเรียก `edit` เพียงครั้งเดียวอาจเปราะบาง

เครื่องมือนี้รับสตริง `input` เดียวที่ครอบการดำเนินการกับไฟล์หนึ่งรายการขึ้นไป:

```
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## พารามิเตอร์

- `input` (จำเป็น): เนื้อหาแพตช์ทั้งหมด รวมถึง `*** Begin Patch` และ `*** End Patch`

## หมายเหตุ

- เส้นทางแพตช์รองรับเส้นทางสัมพัทธ์ (จากไดเรกทอรีเวิร์กสเปซ) และเส้นทางสัมบูรณ์
- `tools.exec.applyPatch.workspaceOnly` มีค่าเริ่มต้นเป็น `true` (จำกัดอยู่ในเวิร์กสเปซ) ตั้งค่าเป็น `false` เฉพาะเมื่อคุณตั้งใจให้ `apply_patch` เขียน/ลบนอกไดเรกทอรีเวิร์กสเปซ
- ใช้ `*** Move to:` ภายในฮังก์ `*** Update File:` เพื่อเปลี่ยนชื่อไฟล์
- `*** End of File` ทำเครื่องหมายการแทรกเฉพาะ EOF เมื่อจำเป็น
- พร้อมใช้งานตามค่าเริ่มต้นสำหรับโมเดล OpenAI และ OpenAI Codex ตั้งค่า
  `tools.exec.applyPatch.enabled: false` เพื่อปิดใช้งาน
- เลือกกำหนดให้จำกัดตามโมเดลได้ผ่าน
  `tools.exec.applyPatch.allowModels`
- การกำหนดค่าอยู่ภายใต้ `tools.exec` เท่านั้น

## ตัวอย่าง

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Diffs" href="/th/tools/diffs" icon="code-compare">
    ตัวดู diff แบบอ่านอย่างเดียวสำหรับการนำเสนอการเปลี่ยนแปลง
  </Card>
  <Card title="Exec tool" href="/th/tools/exec" icon="terminal">
    การรันคำสั่งเชลล์จาก agent
  </Card>
  <Card title="Code execution" href="/th/tools/code-execution" icon="square-code">
    การวิเคราะห์ Python ระยะไกลในแซนด์บ็อกซ์ด้วย xAI
  </Card>
</CardGroup>
