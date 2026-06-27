---
read_when:
    - การเขียนเอกสารที่มีโทเค็น คีย์ API หรือส่วนย่อยข้อมูลประจำตัว
    - กำลังอัปเดตตัวอย่างที่เครื่องมือตรวจจับความลับอาจสแกน
summary: แนวทางการใช้ตัวยึดตำแหน่งที่ปลอดภัยต่อเครื่องมือสแกนความลับสำหรับเอกสารและตัวอย่าง
title: หลักเกณฑ์การใช้ตัวแทนความลับ
x-i18n:
    generated_at: "2026-06-27T18:20:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 87e0db9ad47bf0c9d434da9bdcd6587e0b01d4eddf5ad245cf3dc87a1d166875
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# แบบแผนสำหรับตัวยึดตำแหน่งของความลับ

ใช้ตัวยึดตำแหน่งที่มนุษย์อ่านเข้าใจได้ แต่ไม่คล้ายกับความลับจริง

## รูปแบบที่แนะนำ

- ควรใช้ค่าที่สื่อความหมาย เช่น `example-openai-key-not-real` หรือ `example-discord-bot-token`
- สำหรับตัวอย่าง shell ควรใช้ `${OPENAI_API_KEY}` แทนสตริงแบบ inline ที่ดูเหมือนโทเค็น
- ทำให้ตัวอย่างดูเป็นของปลอมอย่างชัดเจน และจำกัดตามวัตถุประสงค์ (ผู้ให้บริการ ช่องทาง ประเภทการยืนยันตัวตน)

## หลีกเลี่ยงรูปแบบเหล่านี้ในเอกสาร

- ข้อความส่วนหัวหรือท้ายของคีย์ส่วนตัว PEM แบบตรงตัว
- คำนำหน้าที่คล้ายข้อมูลรับรองที่ใช้งานจริง เช่น `sk-...`, `xoxb-...`, `AKIA...`
- bearer token ที่ดูสมจริงซึ่งคัดลอกมาจากบันทึก runtime

## ตัวอย่าง

```bash
# Good
export OPENAI_API_KEY="example-openai-key-not-real"

# Better (when the doc is about env wiring)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
