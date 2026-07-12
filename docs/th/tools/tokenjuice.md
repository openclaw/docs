---
read_when:
    - คุณต้องการให้ผลลัพธ์ของเครื่องมือ `exec` หรือ `bash` ใน OpenClaw สั้นลง
    - คุณต้องการติดตั้งหรือเปิดใช้งาน Plugin Tokenjuice
    - คุณต้องเข้าใจว่า tokenjuice เปลี่ยนแปลงอะไรและปล่อยอะไรไว้ในรูปแบบดิบ
summary: ย่อผลลัพธ์ที่มีสัญญาณรบกวนจากเครื่องมือ exec และ bash ด้วย Plugin Tokenjuice ที่เลือกใช้ได้
title: Tokenjuice
x-i18n:
    generated_at: "2026-07-12T16:51:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96b110563a2600429dd9f0d38997cf7cc5ae4952b7f146a6ab64c96f2f202440
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` เป็น Plugin ภายนอกแบบไม่บังคับ ซึ่งบีบอัดผลลัพธ์ที่มีข้อมูลรบกวนจากเครื่องมือ `exec` และ `bash`
หลังจากคำสั่งทำงานเสร็จแล้ว

Plugin นี้เปลี่ยน `tool_result` ที่ส่งคืน ไม่ใช่ตัวคำสั่งเอง Tokenjuice
จะไม่เขียนอินพุตเชลล์ใหม่ เรียกใช้คำสั่งซ้ำ หรือเปลี่ยนรหัสออก

ปัจจุบันการทำงานนี้มีผลกับการเรียกใช้แบบฝังตัวของ OpenClaw และเครื่องมือแบบไดนามิกของ OpenClaw ในชุดทดสอบ
app-server ของ Codex โดย Tokenjuice เชื่อมเข้ากับมิดเดิลแวร์ผลลัพธ์เครื่องมือของ OpenClaw และ
ตัดทอนเอาต์พุตก่อนส่งกลับเข้าสู่เซสชันที่กำลังทำงานของชุดทดสอบ

## เปิดใช้งาน Plugin

ติดตั้งหนึ่งครั้ง:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

จากนั้นเปิดใช้งาน:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

คำสั่งที่เทียบเท่า:

```bash
openclaw plugins enable tokenjuice
```

หากต้องการแก้ไขการกำหนดค่าโดยตรง:

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

## สิ่งที่ tokenjuice เปลี่ยนแปลง

- บีบอัดผลลัพธ์ที่มีข้อมูลรบกวนจาก `exec` และ `bash` ก่อนป้อนกลับเข้าสู่เซสชัน
- คงการเรียกใช้คำสั่งเดิมไว้โดยไม่แก้ไข
- ใช้นโยบายการสำรวจรายการอย่างปลอดภัย: การอ่านเนื้อหาไฟล์แบบตรงตัวจะคงข้อมูลดิบไว้ คำสั่งสำรวจรายการของที่เก็บซึ่งทำงานแยกเดี่ยวสามารถบีบอัดได้ และลำดับคำสั่งแบบผสมที่ไม่ปลอดภัยจะคงข้อมูลดิบไว้
- ยังคงเป็นแบบเลือกเปิดใช้: ปิดใช้งาน Plugin หากต้องการเอาต์พุตแบบคำต่อคำทุกแห่ง

## ตรวจสอบว่าทำงานอยู่

1. เปิดใช้งาน Plugin
2. เริ่มเซสชันที่สามารถเรียก `exec` ได้
3. เรียกใช้คำสั่งที่มีข้อมูลรบกวนมาก เช่น `git status`
4. ตรวจสอบว่าผลลัพธ์เครื่องมือที่ส่งคืนสั้นกว่าและมีโครงสร้างชัดเจนกว่าเอาต์พุตดิบของเชลล์

## ปิดใช้งาน Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

หรือ:

```bash
openclaw plugins disable tokenjuice
```

## เนื้อหาที่เกี่ยวข้อง

- [เครื่องมือ Exec](/th/tools/exec)
- [ระดับการคิด](/th/tools/thinking)
- [กลไกบริบท](/th/concepts/context-engine)
