---
read_when:
    - คุณต้องการผลลัพธ์เครื่องมือ `exec` หรือ `bash` ที่สั้นลงใน OpenClaw
    - คุณต้องการติดตั้งหรือเปิดใช้งาน Plugin Tokenjuice
    - คุณต้องเข้าใจว่า tokenjuice เปลี่ยนอะไร และปล่อยอะไรไว้แบบดิบ
summary: ย่อผลลัพธ์ exec และเครื่องมือ bash ที่มีสัญญาณรบกวนมากด้วย Plugin Tokenjuice แบบไม่บังคับ
title: Tokenjuice
x-i18n:
    generated_at: "2026-06-27T18:32:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 183ab08d2a1150b446245514423b893cff9a85581980c15600cc16aec10eeae7
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice` เป็น Plugin ภายนอกแบบไม่บังคับที่ย่อผลลัพธ์ของเครื่องมือ `exec` และ `bash`
ที่มีข้อมูลรบกวนมาก หลังจากคำสั่งรันเสร็จแล้ว

มันเปลี่ยน `tool_result` ที่ส่งกลับ ไม่ใช่ตัวคำสั่งเอง Tokenjuice
ไม่เขียนอินพุต shell ใหม่ ไม่รันคำสั่งซ้ำ และไม่เปลี่ยน exit codes

ปัจจุบัน สิ่งนี้ใช้กับการรันแบบฝังใน OpenClaw และเครื่องมือแบบไดนามิกของ OpenClaw ในฮาร์เนส Codex
app-server Tokenjuice hook เข้ากับ middleware ผลลัพธ์ของเครื่องมือของ OpenClaw และ
ตัดแต่งเอาต์พุตก่อนส่งกลับเข้าไปในเซสชันฮาร์เนสที่ใช้งานอยู่

## เปิดใช้งาน Plugin

ติดตั้งครั้งเดียว:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

จากนั้นเปิดใช้งาน:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

เทียบเท่ากับ:

```bash
openclaw plugins enable tokenjuice
```

หากคุณต้องการแก้ไข config โดยตรง:

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

- ย่อผลลัพธ์ของ `exec` และ `bash` ที่มีข้อมูลรบกวนมาก ก่อนป้อนกลับเข้าไปในเซสชัน
- คงการดำเนินการคำสั่งเดิมไว้โดยไม่แตะต้อง
- รักษาการอ่านเนื้อหาไฟล์แบบตรงตัวและคำสั่งอื่น ๆ ที่ tokenjuice ควรปล่อยไว้แบบ raw
- ยังคงเป็นแบบเลือกเปิดใช้: ปิดใช้งาน Plugin หากคุณต้องการเอาต์พุตแบบคำต่อคำทุกที่

## ตรวจสอบว่าทำงานอยู่

1. เปิดใช้งาน Plugin
2. เริ่มเซสชันที่สามารถเรียก `exec` ได้
3. รันคำสั่งที่มีข้อมูลรบกวนมาก เช่น `git status`
4. ตรวจสอบว่าผลลัพธ์เครื่องมือที่ส่งกลับสั้นกว่าและมีโครงสร้างมากกว่าเอาต์พุต shell แบบ raw

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
- [ระดับการคิด](/th/tools/thinking)
- [เอนจินบริบท](/th/concepts/context-engine)
