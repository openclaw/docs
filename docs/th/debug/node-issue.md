---
read_when:
    - การแก้จุดบกพร่องสคริปต์สำหรับการพัฒนาที่ใช้ได้เฉพาะ Node หรือความล้มเหลวของโหมดเฝ้าดูการเปลี่ยนแปลง
    - การตรวจสอบการขัดข้องของตัวโหลด tsx/esbuild ใน OpenClaw
summary: หมายเหตุเกี่ยวกับข้อขัดข้องและวิธีแก้ปัญหาชั่วคราวของ Node + tsx "__name is not a function"
title: Node + tsx ขัดข้อง
x-i18n:
    generated_at: "2026-05-06T17:55:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 808f04959c70c96c983fb2517234d4c06712049d7afebb9b1b4b340df75d7d70
    source_path: debug/node-issue.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Node + tsx แครชด้วย "__name is not a function"

## สรุป

การรัน OpenClaw ผ่าน Node ด้วย `tsx` ล้มเหลวตอนเริ่มต้นด้วย:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

ปัญหานี้เริ่มเกิดหลังจากเปลี่ยนสคริปต์สำหรับพัฒนาจาก Bun เป็น `tsx` (คอมมิต `2871657e`, 2026-01-06) เส้นทางรันไทม์เดียวกันเคยทำงานได้กับ Bun

## สภาพแวดล้อม

- Node: v25.x (พบใน v25.3.0)
- tsx: 4.21.0
- OS: macOS (มีแนวโน้มทำซ้ำได้บนแพลตฟอร์มอื่นที่รัน Node 25 ด้วย)

## ทำซ้ำปัญหา (เฉพาะ Node)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## ตัวอย่างทำซ้ำขั้นต่ำใน repo

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## ตรวจสอบเวอร์ชัน Node

- Node 25.3.0: ล้มเหลว
- Node 22.22.0 (Homebrew `node@22`): ล้มเหลว
- Node 24: ยังไม่ได้ติดตั้งที่นี่ ต้องตรวจสอบเพิ่มเติม

## หมายเหตุ / สมมติฐาน

- `tsx` ใช้ esbuild เพื่อแปลง TS/ESM `keepNames` ของ esbuild จะปล่อย helper `__name` และครอบนิยามฟังก์ชันด้วย `__name(...)`
- การแครชบ่งชี้ว่า `__name` มีอยู่แต่ไม่ใช่ฟังก์ชันตอนรันไทม์ ซึ่งสื่อว่า helper ขาดหายหรือถูกเขียนทับสำหรับโมดูลนี้ในเส้นทาง loader ของ Node 25
- เคยมีรายงานปัญหา helper `__name` คล้ายกันในผู้ใช้งาน esbuild รายอื่น เมื่อ helper ขาดหายหรือถูกเขียนใหม่

## ประวัติ regression

- `2871657e` (2026-01-06): เปลี่ยนสคริปต์จาก Bun เป็น tsx เพื่อให้ Bun เป็นตัวเลือกเสริม
- ก่อนหน้านั้น (เส้นทาง Bun) `openclaw status` และ `gateway:watch` ทำงานได้

## วิธีเลี่ยงปัญหา

- ใช้ Bun สำหรับสคริปต์พัฒนา (การ revert ชั่วคราวในปัจจุบัน)
- ใช้ `tsgo` สำหรับการตรวจสอบประเภทของ repo แล้วรันผลลัพธ์ที่ build แล้ว:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- หมายเหตุย้อนหลัง: เคยใช้ `tsc` ที่นี่ระหว่างดีบักปัญหา Node/tsx นี้ แต่ตอนนี้ lane ตรวจสอบประเภทของ repo ใช้ `tsgo`
- ปิด keepNames ของ esbuild ใน TS loader หากทำได้ (ป้องกันการแทรก helper `__name`); ปัจจุบัน tsx ยังไม่ได้เปิดให้ตั้งค่านี้
- ทดสอบ Node LTS (22/24) กับ `tsx` เพื่อดูว่าปัญหาเฉพาะกับ Node 25 หรือไม่

## อ้างอิง

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## ขั้นตอนถัดไป

- ทำซ้ำปัญหาบน Node 22/24 เพื่อยืนยัน regression ของ Node 25
- ทดสอบ `tsx` nightly หรือ pin ไปยังเวอร์ชันก่อนหน้า หากมี regression ที่ทราบอยู่แล้ว
- หากทำซ้ำได้บน Node LTS ให้ส่งตัวอย่างทำซ้ำขั้นต่ำไปยัง upstream พร้อม stack trace ของ `__name`

## ที่เกี่ยวข้อง

- [การติดตั้ง Node.js](/th/install/node)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
