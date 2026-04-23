---
read_when:
    - คุณต้องการอัปเดต source checkout อย่างปลอดภัย
    - คุณต้องการทำความเข้าใจพฤติกรรมแบบ shorthand ของ `--update`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw update` (อัปเดตซอร์สแบบค่อนข้างปลอดภัย + รีสตาร์ต Gateway อัตโนมัติ)
title: อัปเดต
x-i18n:
    generated_at: "2026-04-23T10:17:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: abcfbd2fb66f560f2c6e9d78d37355510d78946eaeafa17d67fe36bc158ad5cd
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

อัปเดต OpenClaw อย่างปลอดภัยและสลับระหว่างช่องทาง stable/beta/dev

หากคุณติดตั้งผ่าน **npm/pnpm/bun** (การติดตั้งแบบ global โดยไม่มี metadata ของ git)
การอัปเดตจะทำผ่านโฟลว์ของ package manager ตามใน [การอัปเดต](/th/install/updating)

## การใช้งาน

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## ตัวเลือก

- `--no-restart`: ข้ามการรีสตาร์ตบริการ Gateway หลังอัปเดตสำเร็จ
- `--channel <stable|beta|dev>`: ตั้งค่าช่องทางการอัปเดต (git + npm; จะบันทึกไว้ในคอนฟิก)
- `--tag <dist-tag|version|spec>`: แทนที่เป้าหมาย package สำหรับการอัปเดตครั้งนี้เท่านั้น สำหรับการติดตั้งแบบ package `main` จะถูกแมปเป็น `github:openclaw/openclaw#main`
- `--dry-run`: แสดงตัวอย่างขั้นตอนการอัปเดตที่วางแผนไว้ (channel/tag/target/restart flow) โดยไม่เขียนคอนฟิก ติดตั้ง ซิงก์ plugin หรือรีสตาร์ต
- `--json`: พิมพ์ JSON ของ `UpdateRunResult` แบบอ่านได้ด้วยเครื่อง รวมถึง
  `postUpdate.plugins.integrityDrifts` เมื่อมีการตรวจพบความคลาดเคลื่อนของ artifact ของ npm plugin
  ระหว่างการซิงก์ plugin หลังอัปเดต
- `--timeout <seconds>`: timeout ต่อขั้นตอน (ค่าเริ่มต้นคือ 1200 วินาที)
- `--yes`: ข้ามพรอมต์ยืนยัน (เช่น การยืนยันการดาวน์เกรด)

หมายเหตุ: การดาวน์เกรดต้องมีการยืนยัน เพราะเวอร์ชันเก่าอาจทำให้คอนฟิกใช้งานไม่ได้

## `update status`

แสดงช่องทางการอัปเดตที่ใช้งานอยู่ + git tag/branch/SHA (สำหรับ source checkout) รวมถึงสถานะการอัปเดตที่มีให้

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

ตัวเลือก:

- `--json`: พิมพ์ JSON สถานะแบบอ่านได้ด้วยเครื่อง
- `--timeout <seconds>`: timeout สำหรับการตรวจสอบ (ค่าเริ่มต้นคือ 3 วินาที)

## `update wizard`

โฟลว์แบบโต้ตอบสำหรับเลือกช่องทางการอัปเดตและยืนยันว่าจะรีสตาร์ต Gateway
หลังอัปเดตหรือไม่ (ค่าเริ่มต้นคือรีสตาร์ต) หากคุณเลือก `dev` โดยไม่มี git checkout
ระบบจะเสนอให้สร้างขึ้นมา

ตัวเลือก:

- `--timeout <seconds>`: timeout สำหรับแต่ละขั้นตอนการอัปเดต (ค่าเริ่มต้น `1200`)

## สิ่งที่คำสั่งนี้ทำ

เมื่อคุณสลับช่องทางอย่างชัดเจน (`--channel ...`) OpenClaw จะรักษา
วิธีการติดตั้งให้สอดคล้องกันด้วย:

- `dev` → ตรวจสอบให้มี git checkout (ค่าเริ่มต้น: `~/openclaw`, แทนที่ได้ด้วย `OPENCLAW_GIT_DIR`)
  อัปเดต checkout นั้น แล้วติดตั้ง CLI แบบ global จาก checkout ดังกล่าว
- `stable` → ติดตั้งจาก npm โดยใช้ `latest`
- `beta` → เลือก npm dist-tag `beta` เป็นหลัก แต่จะ fallback ไปใช้ `latest` หาก beta
  ไม่มีหรือเก่ากว่า stable release ปัจจุบัน

ตัวอัปเดตอัตโนมัติของ Gateway core (เมื่อเปิดใช้งานผ่านคอนฟิก) จะใช้เส้นทางการอัปเดตเดียวกันนี้ซ้ำ

สำหรับการติดตั้งด้วย package manager `openclaw update` จะ resolve เวอร์ชัน package
เป้าหมายก่อนเรียกใช้ package manager หากเวอร์ชันที่ติดตั้งอยู่ตรงกับเป้าหมายพอดี
และไม่มีการเปลี่ยนช่องทางการอัปเดตที่ต้องบันทึก คำสั่งจะจบลงแบบข้ามขั้นตอนก่อนการติดตั้ง package
การซิงก์ plugin การรีเฟรช completion หรือการรีสตาร์ต Gateway

## โฟลว์ของ git checkout

ช่องทาง:

- `stable`: checkout tag ล่าสุดที่ไม่ใช่ beta จากนั้น build + doctor
- `beta`: เลือก tag `-beta` ล่าสุดเป็นหลัก แต่ fallback ไปใช้ tag stable ล่าสุด
  หาก beta ไม่มีหรือเก่ากว่า
- `dev`: checkout `main` จากนั้น fetch + rebase

ภาพรวมระดับสูง:

1. ต้องใช้ worktree ที่สะอาด (ไม่มีการเปลี่ยนแปลงที่ยังไม่ได้ commit)
2. สลับไปยังช่องทางที่เลือก (tag หรือ branch)
3. fetch upstream (เฉพาะ dev)
4. เฉพาะ dev: รัน preflight lint + TypeScript build ใน temp worktree; หาก tip ใช้งานไม่ได้ จะย้อนกลับได้สูงสุด 10 commits เพื่อหา build ที่สะอาดล่าสุด
5. rebase ไปยัง commit ที่เลือก (เฉพาะ dev)
6. ติดตั้ง dependency ด้วย package manager ของ repo สำหรับ pnpm checkout ตัวอัปเดตจะ bootstrap `pnpm` ตามต้องการ (ผ่าน `corepack` ก่อน แล้วค่อย fallback เป็น `npm install pnpm@10` แบบชั่วคราว) แทนการรัน `npm run build` ภายใน pnpm workspace
7. build + build Control UI
8. รัน `openclaw doctor` เป็นการตรวจสอบ “safe update” ขั้นสุดท้าย
9. ซิงก์ plugin กับช่องทางที่ใช้งานอยู่ (dev ใช้ plugin แบบ bundled; stable/beta ใช้ npm) และอัปเดต plugin ที่ติดตั้งผ่าน npm

หากการอัปเดต npm plugin แบบ pin ไว้ตรงเวอร์ชัน resolve ไปยัง artifact ที่มีค่า integrity
ต่างจากบันทึกการติดตั้งที่เก็บไว้ `openclaw update` จะยกเลิกการอัปเดต artifact ของ plugin นั้น
แทนการติดตั้ง ให้นำ plugin มาติดตั้งใหม่หรืออัปเดตแบบชัดเจนหลังจากตรวจสอบแล้วเท่านั้นว่าคุณเชื่อถือ artifact ใหม่นั้น

หากการ bootstrap pnpm ยังล้มเหลว ตัวอัปเดตจะหยุดก่อนพร้อมข้อผิดพลาดเฉพาะของ package manager แทนการพยายามรัน `npm run build` ภายใน checkout

## shorthand `--update`

`openclaw --update` จะถูกเขียนใหม่เป็น `openclaw update` (มีประโยชน์สำหรับ shell และ launcher script)

## ดูเพิ่มเติม

- `openclaw doctor` (จะเสนอให้รันการอัปเดตก่อนสำหรับ git checkout)
- [ช่องทางการพัฒนา](/th/install/development-channels)
- [การอัปเดต](/th/install/updating)
- [ข้อมูลอ้างอิง CLI](/th/cli)
