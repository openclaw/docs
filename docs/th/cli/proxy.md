---
read_when:
    - คุณต้องจับทราฟฟิกการขนส่งของ OpenClaw ภายในเครื่องเพื่อการดีบัก
    - คุณต้องการตรวจสอบเซสชันของ debug proxy, blob หรือพรีเซ็ตคำสั่งค้นหาในตัว
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw proxy`, local debug proxy และตัวตรวจสอบ capture
title: พร็อกซี
x-i18n:
    generated_at: "2026-04-23T10:16:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 274de676a558153be85e345917c67647eb7e755b01869bc29e1effba66a7e828
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

เรียกใช้ local explicit debug proxy และตรวจสอบทราฟฟิกที่บันทึกไว้

นี่คือคำสั่งสำหรับการดีบักเพื่อการตรวจสอบในระดับ transport โดยสามารถเริ่มต้น
พร็อกซีภายในเครื่อง รันคำสั่งลูกพร้อมเปิดการบันทึก แสดงรายการเซสชันการบันทึก
สืบค้นรูปแบบทราฟฟิกทั่วไป อ่าน blob ที่บันทึกไว้ และล้างข้อมูลการบันทึกในเครื่อง

## คำสั่ง

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## พรีเซ็ตคำสั่งค้นหา

`openclaw proxy query --preset <name>` รองรับ:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## หมายเหตุ

- `start` ใช้ค่าเริ่มต้นเป็น `127.0.0.1` เว้นแต่จะตั้งค่า `--host`
- `run` จะเริ่ม local debug proxy แล้วจึงรันคำสั่งหลัง `--`
- ข้อมูลการบันทึกเป็นข้อมูลดีบักภายในเครื่อง; ใช้ `openclaw proxy purge` เมื่อใช้งานเสร็จ
