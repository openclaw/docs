---
read_when:
    - คุณต้องการอัปเดตเช็กเอาต์ซอร์สอย่างปลอดภัย
    - คุณต้องเข้าใจลักษณะการทำงานแบบย่อของ `--update`
summary: คู่มืออ้างอิง CLI สำหรับ `openclaw update` (การอัปเดตซอร์สที่ค่อนข้างปลอดภัย + การรีสตาร์ท Gateway อัตโนมัติ)
title: อัปเดต
x-i18n:
    generated_at: "2026-04-30T09:45:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cd4be6be8f6ae7df501f8bce3d208dd507ae5a1539f9772101cd844dcd93976
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

อัปเดต OpenClaw อย่างปลอดภัยและสลับระหว่างช่องทาง stable/beta/dev

หากคุณติดตั้งผ่าน **npm/pnpm/bun** (การติดตั้งแบบ global ไม่มีเมตาดาต้า git)
การอัปเดตจะเกิดขึ้นผ่านโฟลว์ตัวจัดการแพ็กเกจใน [การอัปเดต](/th/install/updating)

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

- `--no-restart`: ข้ามการรีสตาร์ตบริการ Gateway หลังจากอัปเดตสำเร็จ การอัปเดตด้วยตัวจัดการแพ็กเกจที่รีสตาร์ต Gateway จะตรวจสอบว่าบริการที่รีสตาร์ตรายงานเวอร์ชันที่อัปเดตตามที่คาดไว้ก่อนที่คำสั่งจะสำเร็จ
- `--channel <stable|beta|dev>`: ตั้งค่าช่องทางอัปเดต (git + npm; บันทึกถาวรใน config)
- `--tag <dist-tag|version|spec>`: แทนที่เป้าหมายแพ็กเกจสำหรับการอัปเดตครั้งนี้เท่านั้น สำหรับการติดตั้งแบบแพ็กเกจ `main` จะแมปไปยัง `github:openclaw/openclaw#main`
- `--dry-run`: แสดงตัวอย่างการดำเนินการอัปเดตที่วางแผนไว้ (ช่องทาง/แท็ก/เป้าหมาย/โฟลว์รีสตาร์ต) โดยไม่เขียน config ติดตั้ง ซิงค์ Plugin หรือรีสตาร์ต
- `--json`: พิมพ์ JSON `UpdateRunResult` ที่อ่านได้ด้วยเครื่อง รวมถึง
  `postUpdate.plugins.integrityDrifts` เมื่อตรวจพบความคลาดเคลื่อนของอาร์ติแฟกต์ Plugin npm
  ระหว่างการซิงค์ Plugin หลังอัปเดต
- `--timeout <seconds>`: ระยะหมดเวลาต่อขั้นตอน (ค่าเริ่มต้นคือ 1800s)
- `--yes`: ข้ามพรอมป์ยืนยัน (เช่น การยืนยันการดาวน์เกรด)

<Warning>
การดาวน์เกรดต้องมีการยืนยัน เพราะเวอร์ชันเก่าอาจทำให้การกำหนดค่าเสียหายได้
</Warning>

## `update status`

แสดงช่องทางอัปเดตที่ใช้งานอยู่ + แท็ก/สาขา/SHA ของ git (สำหรับซอร์สเช็กเอาต์) รวมถึงความพร้อมใช้งานของอัปเดต

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

ตัวเลือก:

- `--json`: พิมพ์ JSON สถานะที่อ่านได้ด้วยเครื่อง
- `--timeout <seconds>`: ระยะหมดเวลาสำหรับการตรวจสอบ (ค่าเริ่มต้นคือ 3s)

## `update wizard`

โฟลว์แบบโต้ตอบสำหรับเลือกช่องทางอัปเดตและยืนยันว่าจะรีสตาร์ต Gateway
หลังอัปเดตหรือไม่ (ค่าเริ่มต้นคือรีสตาร์ต) หากคุณเลือก `dev` โดยไม่มี git checkout ระบบจะ
เสนอให้สร้างให้

ตัวเลือก:

- `--timeout <seconds>`: ระยะหมดเวลาสำหรับแต่ละขั้นตอนการอัปเดต (ค่าเริ่มต้น `1800`)

## สิ่งที่ทำ

เมื่อคุณสลับช่องทางอย่างชัดเจน (`--channel ...`) OpenClaw จะทำให้
วิธีติดตั้งสอดคล้องกันด้วย:

- `dev` → ตรวจให้มี git checkout (ค่าเริ่มต้น: `~/openclaw` แทนที่ได้ด้วย `OPENCLAW_GIT_DIR`),
  อัปเดตเช็กเอาต์นั้น และติดตั้ง CLI แบบ global จากเช็กเอาต์นั้น
- `stable` → ติดตั้งจาก npm โดยใช้ `latest`
- `beta` → เลือกใช้ npm dist-tag `beta` ก่อน แต่จะถอยกลับไปใช้ `latest` เมื่อ beta
  ไม่มีหรือเก่ากว่า stable release ปัจจุบัน

ตัวอัปเดตอัตโนมัติของคอร์ Gateway (เมื่อเปิดใช้ผ่าน config) จะใช้เส้นทางอัปเดตเดียวกันนี้ซ้ำ

สำหรับการติดตั้งด้วยตัวจัดการแพ็กเกจ `openclaw update` จะ resolve เวอร์ชันแพ็กเกจเป้าหมาย
ก่อนเรียกใช้ตัวจัดการแพ็กเกจ การติดตั้ง npm global ใช้การติดตั้งแบบ staged:
OpenClaw ติดตั้งแพ็กเกจใหม่ลงใน prefix ชั่วคราวของ npm ตรวจสอบ inventory
ของ `dist` ที่แพ็กมาที่นั่น แล้วสลับ tree แพ็กเกจที่สะอาดนั้นเข้าไปใน
prefix global จริง หากการตรวจสอบล้มเหลว doctor หลังอัปเดต การซิงค์ Plugin และ
งานรีสตาร์ตจะไม่รันจาก tree ที่น่าสงสัย แม้เมื่อเวอร์ชันที่ติดตั้งอยู่
ตรงกับเป้าหมายแล้ว คำสั่งก็จะรีเฟรชการติดตั้งแพ็กเกจ global
จากนั้นรันการซิงค์ Plugin รีเฟรชการทำ completion ของคำสั่งคอร์ และงานรีสตาร์ต การทำเช่นนี้
ช่วยให้ sidecar ที่แพ็กมาและเรคคอร์ด Plugin ที่ช่องทางเป็นเจ้าของสอดคล้องกับ
บิลด์ OpenClaw ที่ติดตั้งอยู่ ขณะที่ปล่อยให้การสร้าง completion ของคำสั่ง Plugin ทั้งหมด
ทำผ่านการรัน `openclaw completion --write-state` อย่างชัดเจน

เมื่อติดตั้งบริการ Gateway แบบ local managed และเปิดใช้การรีสตาร์ต
การอัปเดตด้วยตัวจัดการแพ็กเกจจะหยุดบริการที่กำลังรันอยู่ก่อนแทนที่ tree แพ็กเกจ
จากนั้นรีเฟรชเมตาดาต้าบริการจากการติดตั้งที่อัปเดต รีสตาร์ต
บริการ และตรวจสอบว่า Gateway ที่รีสตาร์ตรายงานเวอร์ชันที่คาดไว้ ด้วย
`--no-restart` การแทนที่แพ็กเกจยังคงทำงาน แต่บริการ managed จะไม่ถูก
หยุดหรือรีสตาร์ต ดังนั้น Gateway ที่กำลังรันอยู่อาจยังใช้โค้ดเก่าจนกว่าคุณจะรีสตาร์ต
ด้วยตนเอง

## โฟลว์ git checkout

### การเลือกช่องทาง

- `stable`: checkout แท็กล่าสุดที่ไม่ใช่ beta จากนั้น build และ doctor
- `beta`: เลือกแท็ก `-beta` ล่าสุดก่อน แต่ถอยกลับไปใช้แท็ก stable ล่าสุดเมื่อ beta ไม่มีหรือเก่ากว่า
- `dev`: checkout `main` จากนั้น fetch และ rebase

### ขั้นตอนการอัปเดต

<Steps>
  <Step title="Verify clean worktree">
    ต้องไม่มีการเปลี่ยนแปลงที่ยังไม่ได้ commit
  </Step>
  <Step title="Switch channel">
    สลับไปยังช่องทางที่เลือก (แท็กหรือสาขา)
  </Step>
  <Step title="Fetch upstream">
    เฉพาะ dev เท่านั้น
  </Step>
  <Step title="Preflight build (dev only)">
    รัน lint และ TypeScript build ใน worktree ชั่วคราว หาก tip ล้มเหลว จะย้อนกลับได้สูงสุด 10 commits เพื่อหาบิลด์สะอาดที่ใหม่ที่สุด
  </Step>
  <Step title="Rebase">
    rebase ไปยัง commit ที่เลือก (เฉพาะ dev)
  </Step>
  <Step title="Install dependencies">
    ใช้ตัวจัดการแพ็กเกจของ repo สำหรับ pnpm checkouts ตัวอัปเดตจะ bootstrap `pnpm` เมื่อจำเป็น (ผ่าน `corepack` ก่อน แล้วจึง fallback เป็น `npm install pnpm@10` ชั่วคราว) แทนการรัน `npm run build` ภายใน pnpm workspace
  </Step>
  <Step title="Build Control UI">
    build gateway และ Control UI
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` รันเป็นการตรวจสอบ safe-update ขั้นสุดท้าย
  </Step>
  <Step title="Sync plugins">
    ซิงค์ Plugin ไปยังช่องทางที่ใช้งานอยู่ dev ใช้ Plugin ที่ bundled มา; stable และ beta ใช้ npm อัปเดต Plugin ที่ติดตั้งด้วย npm
  </Step>
</Steps>

<Warning>
หากการอัปเดต Plugin npm ที่ pin แบบแน่นอน resolve เป็นอาร์ติแฟกต์ที่ integrity แตกต่างจากเรคคอร์ดการติดตั้งที่จัดเก็บไว้ `openclaw update` จะยกเลิกการอัปเดตอาร์ติแฟกต์ Plugin นั้นแทนการติดตั้ง ติดตั้งใหม่หรืออัปเดต Plugin อย่างชัดเจนเฉพาะหลังจากตรวจสอบแล้วว่าคุณเชื่อถืออาร์ติแฟกต์ใหม่นั้น
</Warning>

<Note>
ความล้มเหลวในการซิงค์ Plugin หลังอัปเดตจะทำให้ผลลัพธ์การอัปเดตล้มเหลวและหยุดงานติดตามผลการรีสตาร์ต แก้ข้อผิดพลาดการติดตั้งหรืออัปเดต Plugin แล้วรัน `openclaw update` อีกครั้ง

เมื่อ Gateway ที่อัปเดตเริ่มทำงาน dependency runtime ของ Plugin ที่ bundled และเปิดใช้อยู่จะถูก staged ก่อนการเปิดใช้งาน Plugin การรีสตาร์ตที่เกิดจากการอัปเดตจะ drain การ staging ของ runtime-dependency ที่ยังใช้งานอยู่ก่อนปิด Gateway ดังนั้นการรีสตาร์ตโดย service-manager จะไม่ขัดจังหวะ `npm install` ที่กำลังดำเนินอยู่

หาก pnpm bootstrap ยังล้มเหลว ตัวอัปเดตจะหยุดตั้งแต่ต้นพร้อมข้อผิดพลาดเฉพาะตัวจัดการแพ็กเกจ แทนที่จะพยายาม `npm run build` ภายใน checkout
</Note>

## ชวเลข `--update`

`openclaw --update` จะเขียนใหม่เป็น `openclaw update` (มีประโยชน์สำหรับ shell และสคริปต์ launcher)

## ที่เกี่ยวข้อง

- `openclaw doctor` (เสนอให้รัน update ก่อนบน git checkouts)
- [ช่องทางการพัฒนา](/th/install/development-channels)
- [การอัปเดต](/th/install/updating)
- [อ้างอิง CLI](/th/cli)
