---
doc-schema-version: 1
read_when:
    - คุณต้องการค้นหา Plugin ของ OpenClaw จากบุคคลที่สาม
    - คุณต้องการเผยแพร่หรือนำ Plugin ของคุณเองไปแสดงบน ClawHub
summary: ค้นหาและเผยแพร่ Plugin ของ OpenClaw ที่ดูแลโดยชุมชน
title: Plugin จากชุมชน
x-i18n:
    generated_at: "2026-06-27T17:53:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ecf059fa0c32f09d09381b2153a6a63ca522d49719aaa8476209389a6b5b36a
    source_path: plugins/community.md
    workflow: 16
---

Plugin ชุมชนคือแพ็กเกจจากบุคคลที่สามที่ขยาย OpenClaw ด้วยช่องทาง,
เครื่องมือ, ผู้ให้บริการ, hooks หรือความสามารถอื่น ๆ ใช้ [ClawHub](/th/clawhub) เป็นพื้นผิวการค้นพบหลักสำหรับ Plugin ชุมชนสาธารณะ

## ค้นหา Plugin

ค้นหา ClawHub จาก CLI:

```bash
openclaw plugins search "calendar"
```

ติดตั้ง Plugin จาก ClawHub ด้วยคำนำหน้าแหล่งที่มาแบบชัดเจน:

```bash
openclaw plugins install clawhub:<package-name>
```

npm ยังคงเป็นเส้นทางติดตั้งโดยตรงที่รองรับในช่วงเปลี่ยนผ่านการเปิดตัว:

```bash
openclaw plugins install npm:<package-name>
```

ใช้ [จัดการ Plugin](/th/plugins/manage-plugins) สำหรับตัวอย่างการติดตั้ง, อัปเดต,
ตรวจสอบ และถอนการติดตั้งทั่วไป ใช้ [`openclaw plugins`](/th/cli/plugins) สำหรับเอกสารอ้างอิงคำสั่งฉบับเต็มและกฎการเลือกแหล่งที่มา

## เผยแพร่ Plugin

เผยแพร่ Plugin ชุมชนสาธารณะบน ClawHub เมื่อคุณต้องการให้ผู้ใช้ OpenClaw
ค้นพบและติดตั้งได้ ClawHub เป็นเจ้าของรายการแพ็กเกจสด, ประวัติรีลีส,
สถานะการสแกน และคำแนะนำการติดตั้ง; เอกสารไม่ได้ดูแลแค็ตตาล็อก Plugin จากบุคคลที่สามแบบคงที่

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

ก่อนเผยแพร่ ตรวจสอบให้แน่ใจว่า Plugin มีเมทาดาทาแพ็กเกจ, manifest ของ Plugin,
เอกสารการตั้งค่า และเจ้าของการบำรุงรักษาที่ชัดเจน ClawHub ตรวจสอบขอบเขตเจ้าของ,
ชื่อแพ็กเกจ, เวอร์ชัน, ขีดจำกัดไฟล์ และเมทาดาทาแหล่งที่มาก่อนสร้างรีลีส
จากนั้นจะซ่อนรีลีสใหม่จากพื้นผิวการติดตั้งและดาวน์โหลดตามปกติจนกว่าการตรวจทานและการยืนยันจะเสร็จสิ้น

ใช้รายการตรวจสอบนี้ก่อนเผยแพร่:

| ข้อกำหนด              | เหตุผล                                               |
| -------------------- | --------------------------------------------------- |
| เผยแพร่บน ClawHub | ผู้ใช้ต้องการคำแนะนำ `openclaw plugins install` เพื่อให้ใช้งานได้ |
| รีโป GitHub สาธารณะ   | การตรวจทานซอร์ส, การติดตาม issue, ความโปร่งใส         |
| เอกสารการตั้งค่าและการใช้งาน | ผู้ใช้ต้องรู้วิธีกำหนดค่า              |
| การบำรุงรักษาอย่างต่อเนื่อง   | การอัปเดตล่าสุดหรือการจัดการ issue อย่างตอบสนอง         |

ใช้หน้าเหล่านี้สำหรับสัญญาการเผยแพร่ฉบับเต็ม:

- [การเผยแพร่ ClawHub](/th/clawhub/publishing) อธิบายเจ้าของ, ขอบเขต, รีลีส,
  การตรวจทาน, การตรวจสอบแพ็กเกจ และการโอนแพ็กเกจ
- [การสร้าง Plugin](/th/plugins/building-plugins) แสดงรูปแบบแพ็กเกจ Plugin
  และเวิร์กโฟลว์การเผยแพร่ครั้งแรก
- [manifest ของ Plugin](/th/plugins/manifest) กำหนดฟิลด์ manifest ของ Plugin แบบเนทีฟ

## ที่เกี่ยวข้อง

- [Plugin](/th/tools/plugin) - ติดตั้ง, กำหนดค่า, รีสตาร์ต และแก้ไขปัญหา
- [จัดการ Plugin](/th/plugins/manage-plugins) - ตัวอย่างคำสั่ง
- [การเผยแพร่ ClawHub](/th/clawhub/publishing) - กฎการเผยแพร่และรีลีส
