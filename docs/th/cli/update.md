---
read_when:
    - คุณต้องการอัปเดตซอร์ส checkout อย่างปลอดภัย
    - คุณต้องการทำความเข้าใจพฤติกรรมแบบย่อของ `--update`
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw update` (อัปเดตซอร์สอย่างค่อนข้างปลอดภัย + รีสตาร์ต Gateway อัตโนมัติ)
title: การอัปเดต
x-i18n:
    generated_at: "2026-04-26T11:27:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: e86e7f8ffbf3f4ccd0787ba06aead35cb96e8db98c5d32c99b18ef9fda62efd6
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

อัปเดต OpenClaw อย่างปลอดภัย และสลับระหว่างแชนเนล stable/beta/dev

หากคุณติดตั้งผ่าน **npm/pnpm/bun** (ติดตั้งแบบ global โดยไม่มี git metadata)
การอัปเดตจะเกิดขึ้นผ่านโฟลว์ของ package manager ตาม [Updating](/th/install/updating)

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

- `--no-restart`: ข้ามการรีสตาร์ตบริการ Gateway หลังจากอัปเดตสำเร็จ สำหรับการอัปเดตผ่าน package manager ที่มีการรีสตาร์ต Gateway คำสั่งจะตรวจสอบว่าบริการที่รีสตาร์ตแล้วรายงานเวอร์ชันที่อัปเดตตามที่คาดไว้ก่อนจึงจะถือว่าคำสั่งสำเร็จ
- `--channel <stable|beta|dev>`: ตั้งค่าแชนเนลการอัปเดต (ทั้ง git + npm; เก็บถาวรไว้ในคอนฟิก)
- `--tag <dist-tag|version|spec>`: เขียนทับ target ของแพ็กเกจสำหรับการอัปเดตครั้งนี้เท่านั้น สำหรับการติดตั้งแบบแพ็กเกจ `main` จะถูกแมปเป็น `github:openclaw/openclaw#main`
- `--dry-run`: แสดงตัวอย่างการดำเนินการอัปเดตที่วางแผนไว้ (แชนเนล/tag/target/โฟลว์รีสตาร์ต) โดยไม่เขียนคอนฟิก ติดตั้ง ซิงก์ Plugins หรือรีสตาร์ต
- `--json`: พิมพ์ JSON ของ `UpdateRunResult` แบบที่เครื่องอ่านได้ ซึ่งรวมถึง
  `postUpdate.plugins.integrityDrifts` เมื่อมีการตรวจพบการเบี่ยงเบนของ artifact ของ npm Plugin
  ระหว่างการซิงก์ Plugin หลังการอัปเดต
- `--timeout <seconds>`: เวลาหมดต่อหนึ่งขั้นตอน (ค่าเริ่มต้นคือ 1800 วินาที)
- `--yes`: ข้ามพรอมป์ยืนยัน (เช่น การยืนยันการดาวน์เกรด)

หมายเหตุ: การดาวน์เกรดต้องมีการยืนยัน เพราะเวอร์ชันเก่าอาจทำให้คอนฟิกใช้งานไม่ได้

## `update status`

แสดงแชนเนลการอัปเดตที่ใช้งานอยู่ + git tag/branch/SHA (สำหรับ source checkout) พร้อมสถานะการอัปเดตที่มีให้

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

ตัวเลือก:

- `--json`: พิมพ์ JSON สถานะแบบที่เครื่องอ่านได้
- `--timeout <seconds>`: เวลาหมดสำหรับการตรวจสอบ (ค่าเริ่มต้นคือ 3 วินาที)

## `update wizard`

โฟลว์แบบโต้ตอบเพื่อเลือกแชนเนลการอัปเดตและยืนยันว่าจะรีสตาร์ต Gateway
หลังการอัปเดตหรือไม่ (ค่าเริ่มต้นคือรีสตาร์ต) หากคุณเลือก `dev` โดยไม่มี git checkout
ระบบจะมีตัวเลือกให้สร้างขึ้นมา

ตัวเลือก:

- `--timeout <seconds>`: เวลาหมดสำหรับแต่ละขั้นตอนการอัปเดต (ค่าเริ่มต้น `1800`)

## สิ่งที่คำสั่งนี้ทำ

เมื่อคุณสลับแชนเนลอย่างชัดเจน (`--channel ...`) OpenClaw จะรักษา
วิธีติดตั้งให้สอดคล้องกันด้วย:

- `dev` → ตรวจสอบให้มี git checkout (ค่าเริ่มต้น: `~/openclaw`, เขียนทับได้ด้วย `OPENCLAW_GIT_DIR`),
  อัปเดตมัน และติดตั้ง CLI แบบ global จาก checkout นั้น
- `stable` → ติดตั้งจาก npm โดยใช้ `latest`
- `beta` → ให้ความสำคัญกับ npm dist-tag `beta` แต่จะ fallback ไปใช้ `latest` เมื่อ beta
  ไม่มีอยู่หรือเก่ากว่า stable release ปัจจุบัน

ตัวอัปเดตอัตโนมัติของ Gateway core (เมื่อเปิดใช้งานผ่านคอนฟิก) จะใช้เส้นทางการอัปเดตเดียวกันนี้ซ้ำ

สำหรับการติดตั้งผ่าน package manager `openclaw update` จะ resolve target package
version ก่อนเรียกใช้ package manager แม้ว่าเวอร์ชันที่ติดตั้งอยู่แล้ว
จะตรงกับ target อยู่แล้ว คำสั่งนี้ก็ยังจะรีเฟรชการติดตั้งแพ็กเกจแบบ global
จากนั้นเรียกใช้งานการซิงก์ Plugin การรีเฟรช completion และงานรีสตาร์ต วิธีนี้ช่วยให้ sidecar แบบแพ็กเกจ
และระเบียน Plugin ที่แชนเนลเป็นเจ้าของยังคงสอดคล้องกับ
บิลด์ OpenClaw ที่ติดตั้งอยู่

## โฟลว์ git checkout

แชนเนล:

- `stable`: checkout tag ล่าสุดที่ไม่ใช่ beta จากนั้น build + doctor
- `beta`: ให้ความสำคัญกับ tag `-beta` ล่าสุด แต่ fallback ไปใช้ stable tag ล่าสุด
  เมื่อ beta ไม่มีอยู่หรือเก่ากว่า
- `dev`: checkout `main` จากนั้น fetch + rebase

ภาพรวมระดับสูง:

1. ต้องใช้ worktree ที่สะอาด (ไม่มีการเปลี่ยนแปลงที่ยังไม่ได้ commit)
2. สลับไปยังแชนเนลที่เลือก (tag หรือ branch)
3. fetch จาก upstream (เฉพาะ dev)
4. เฉพาะ dev: รัน preflight lint + TypeScript build ใน temp worktree; หาก tip ล้มเหลว ระบบจะย้อนกลับได้สูงสุด 10 commits เพื่อหา build ที่สะอาดล่าสุด
5. rebase ไปยัง commit ที่เลือก (เฉพาะ dev)
6. ติดตั้ง dependencies ด้วย package manager ของ repo สำหรับ pnpm checkout ตัวอัปเดตจะ bootstrap `pnpm` ตามต้องการ (ผ่าน `corepack` ก่อน จากนั้น fallback ไปใช้ `npm install pnpm@10` แบบชั่วคราว) แทนการรัน `npm run build` ภายใน pnpm workspace
7. build + build Control UI
8. รัน `openclaw doctor` เป็นการตรวจสอบ “การอัปเดตอย่างปลอดภัย” ขั้นสุดท้าย
9. ซิงก์ Plugins ไปยังแชนเนลที่ใช้งานอยู่ (dev ใช้ Plugins ที่มากับระบบ; stable/beta ใช้ npm) และอัปเดต Plugins ที่ติดตั้งผ่าน npm

หากการอัปเดต npm Plugin ที่ pin แบบตรงตัว resolve ไปเป็น artifact ที่มี integrity
ต่างจากระเบียนการติดตั้งที่จัดเก็บไว้ `openclaw update` จะยกเลิกการอัปเดต artifact ของ Plugin นั้น
แทนการติดตั้ง ให้ติดตั้งใหม่หรืออัปเดต Plugin นั้นโดยชัดเจนเฉพาะหลังจากที่ตรวจสอบแล้วว่าคุณเชื่อถือ artifact ใหม่นั้น

หากการซิงก์ Plugin หลังการอัปเดตล้มเหลว จะถือว่าผลการอัปเดตล้มเหลวและหยุดงาน
ต่อเนื่องที่เกี่ยวกับการรีสตาร์ต ให้แก้ไขข้อผิดพลาดในการติดตั้ง/อัปเดต Plugin แล้วจึงรัน
`openclaw update` อีกครั้ง

หากการ bootstrap pnpm ยังคงล้มเหลว ตัวอัปเดตจะหยุดตั้งแต่ต้นพร้อมข้อผิดพลาดเฉพาะของ package manager แทนที่จะพยายามรัน `npm run build` ภายใน checkout

## ชวเลข `--update`

`openclaw --update` จะถูกเขียนใหม่เป็น `openclaw update` (มีประโยชน์สำหรับ shell และสคริปต์ launcher)

## ที่เกี่ยวข้อง

- `openclaw doctor` (มีตัวเลือกให้รัน update ก่อนสำหรับ git checkout)
- [Development channels](/th/install/development-channels)
- [Updating](/th/install/updating)
- [เอกสารอ้างอิง CLI](/th/cli)
