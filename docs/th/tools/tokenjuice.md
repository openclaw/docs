---
read_when:
    - คุณต้องการให้ผลลัพธ์ของเครื่องมือ `exec` หรือ `bash` ใน OpenClaw สั้นลง
    - คุณต้องการเปิดใช้งาน Plugin tokenjuice ที่มาพร้อมระบบ
    - คุณต้องเข้าใจว่า tokenjuice เปลี่ยนอะไร และอะไรที่ยังคงเป็นข้อมูลดิบไว้
summary: ย่อผลลัพธ์ที่มีสัญญาณรบกวนจากเครื่องมือ exec และ bash ด้วย Plugin ที่มาพร้อมระบบซึ่งเป็นตัวเลือกเสริม
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-25T14:01:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04328cc7a13ccd64f8309ddff867ae893387f93c26641dfa1a4013a4c3063962
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` เป็น Plugin ที่มาพร้อมระบบแบบเลือกใช้ ซึ่งใช้ย่อผลลัพธ์ที่มีสัญญาณรบกวนจากเครื่องมือ `exec` และ `bash`
หลังจากที่คำสั่งรันเสร็จแล้ว

มันเปลี่ยน `tool_result` ที่ส่งกลับ ไม่ได้เปลี่ยนคำสั่งเอง Tokenjuice
จะไม่เขียน shell input ใหม่ ไม่รันคำสั่งซ้ำ และไม่เปลี่ยน exit code

ปัจจุบันสิ่งนี้ใช้กับการรันแบบฝังของ PI และ OpenClaw dynamic tools ใน Codex
app-server harness Tokenjuice จะ hook เข้ากับ middleware ผลลัพธ์ของเครื่องมือใน OpenClaw และ
ตัดแต่งเอาต์พุตก่อนส่งกลับเข้าไปยังเซสชัน harness ที่กำลังทำงานอยู่

## เปิดใช้งาน Plugin

เส้นทางด่วน:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

แบบเทียบเท่า:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw มาพร้อม Plugin นี้อยู่แล้ว ไม่มีขั้นตอน `plugins install`
หรือ `tokenjuice install openclaw` แยกต่างหาก

หากคุณต้องการแก้ไขการตั้งค่าโดยตรง:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## สิ่งที่ tokenjuice เปลี่ยน

- ย่อผลลัพธ์ `exec` และ `bash` ที่มีสัญญาณรบกวนก่อนส่งกลับเข้าไปในเซสชัน
- คงการทำงานของคำสั่งต้นฉบับไว้โดยไม่เปลี่ยนแปลง
- คงการอ่านเนื้อหาไฟล์แบบตรงตามต้นฉบับและคำสั่งอื่น ๆ ที่ tokenjuice ควรปล่อยเป็นข้อมูลดิบไว้
- ยังคงเป็นแบบ opt-in: ปิด Plugin ได้หากคุณต้องการเอาต์พุตแบบตามต้นฉบับทุกที่

## ตรวจสอบว่าทำงานอยู่

1. เปิดใช้งาน Plugin
2. เริ่มเซสชันที่สามารถเรียก `exec` ได้
3. รันคำสั่งที่มีสัญญาณรบกวน เช่น `git status`
4. ตรวจสอบว่าผลลัพธ์ของเครื่องมือที่ส่งกลับสั้นกว่าและมีโครงสร้างมากกว่าเอาต์พุต shell แบบดิบ

## ปิดใช้งาน Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

หรือ:

```bash
openclaw plugins disable tokenjuice
```

## ที่เกี่ยวข้อง

- [เครื่องมือ Exec](/th/tools/exec)
- [ระดับ Thinking](/th/tools/thinking)
- [Context engine](/th/concepts/context-engine)
