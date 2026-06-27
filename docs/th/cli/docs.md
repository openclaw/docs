---
read_when:
    - คุณต้องการค้นหาเอกสาร OpenClaw แบบสดจากเทอร์มินัล
    - คุณต้องรู้ว่า CLI ของเอกสารเรียกใช้ API ค้นหาแบบโฮสต์ตัวใด
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw docs` (ค้นหาดัชนีเอกสารสด)
title: เอกสาร
x-i18n:
    generated_at: "2026-06-27T17:20:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8be22f689d40ffec29df9562b69444c0f8b9bb607dfcb79de20b3023e0eb30a
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

ค้นหาดัชนีเอกสาร OpenClaw แบบสดจากเทอร์มินัล คำสั่งนี้เรียก API ค้นหาเอกสารที่โฮสต์บน Cloudflare ของ OpenClaw และแสดงผลลัพธ์ในเทอร์มินัลของคุณ

## การใช้งาน

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

อาร์กิวเมนต์:

| อาร์กิวเมนต์ | คำอธิบาย |
| ------------ | ---------------------------------------------------------------------------------- |
| `[query...]` | คำค้นหาแบบอิสระ คำค้นหาหลายคำจะถูกรวมด้วยช่องว่างและส่งเป็นรายการเดียว |

## ตัวอย่าง

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

เมื่อไม่มีคำค้นหา `openclaw docs` จะแสดง URL จุดเข้าใช้งานเอกสารพร้อมคำสั่งค้นหาตัวอย่าง แทนการเรียกค้นหา

## วิธีทำงาน

`openclaw docs` เรียก `https://docs.openclaw.ai/api/search` และแสดงผลลัพธ์ JSON การเรียกค้นหาใช้ระยะหมดเวลาคงที่ 30 วินาที

## เอาต์พุต

ในเทอร์มินัลแบบสมบูรณ์ (TTY) ผลลัพธ์จะแสดงเป็นหัวข้อ ตามด้วยรายการหัวข้อย่อย แต่ละหัวข้อย่อยจะแสดงชื่อหน้า, URL เอกสารที่ลิงก์ไว้ และข้อความตัดตอนสั้น ๆ ในบรรทัดถัดไป ผลลัพธ์ว่างจะแสดงว่า "ไม่พบผลลัพธ์"

ในเอาต์พุตแบบไม่สมบูรณ์ (ส่งผ่าน pipe, `--no-color`, สคริปต์) ข้อมูลเดียวกันจะแสดงเป็น Markdown:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## รหัสออก

| รหัส | ความหมาย |
| ---- | ----------------------------------------------------------------- |
| `0`  | การค้นหาสำเร็จ (รวมถึงการตอบกลับที่ไม่มีผลลัพธ์) |
| `1`  | การเรียก API ค้นหาเอกสารที่โฮสต์ไว้ล้มเหลว; stderr จะถูกพิมพ์แบบอินไลน์ |

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [เอกสารแบบสด](https://docs.openclaw.ai)
