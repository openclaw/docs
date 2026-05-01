---
read_when:
    - คุณต้องการอัปเดตซอร์สที่เช็กเอาต์ไว้อย่างปลอดภัย
    - คุณต้องเข้าใจพฤติกรรมแบบย่อของ `--update`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw update` (การอัปเดตซอร์สที่ค่อนข้างปลอดภัย + การรีสตาร์ท Gateway อัตโนมัติ)
title: อัปเดต
x-i18n:
    generated_at: "2026-05-01T10:15:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfbbd6e3cd1a83e3700fa248a6ce2cb3adf1c94d0d5491895eea21bfec5d52b0
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

อัปเดต OpenClaw อย่างปลอดภัยและสลับระหว่างช่องทาง stable/beta/dev

หากคุณติดตั้งผ่าน **npm/pnpm/bun** (การติดตั้งแบบ global ไม่มีข้อมูลเมตา git)
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

- `--no-restart`: ข้ามการรีสตาร์ทบริการ Gateway หลังจากอัปเดตสำเร็จ การอัปเดตผ่านตัวจัดการแพ็กเกจที่รีสตาร์ท Gateway จะตรวจสอบว่าบริการที่รีสตาร์ทรายงานเวอร์ชันที่อัปเดตตามที่คาดไว้ก่อนที่คำสั่งจะสำเร็จ
- `--channel <stable|beta|dev>`: ตั้งค่าช่องทางอัปเดต (git + npm; บันทึกไว้ในคอนฟิก)
- `--tag <dist-tag|version|spec>`: แทนที่เป้าหมายแพ็กเกจสำหรับการอัปเดตครั้งนี้เท่านั้น สำหรับการติดตั้งแพ็กเกจ `main` จะแมปเป็น `github:openclaw/openclaw#main`
- `--dry-run`: ดูตัวอย่างการดำเนินการอัปเดตที่วางแผนไว้ (ช่องทาง/แท็ก/เป้าหมาย/โฟลว์รีสตาร์ท) โดยไม่เขียนคอนฟิก ติดตั้ง ซิงค์ Plugin หรือรีสตาร์ท
- `--json`: พิมพ์ JSON `UpdateRunResult` ที่เครื่องอ่านได้ รวมถึง
  `postUpdate.plugins.integrityDrifts` เมื่อตรวจพบการเบี่ยงเบนของอาร์ติแฟกต์ Plugin ของ npm
  ระหว่างการซิงค์ Plugin หลังอัปเดต
- `--timeout <seconds>`: เวลาหมดต่อขั้นตอน (ค่าเริ่มต้นคือ 1800s)
- `--yes`: ข้ามพรอมป์ยืนยัน (เช่น การยืนยันการดาวน์เกรด)

<Warning>
การดาวน์เกรดต้องมีการยืนยัน เพราะเวอร์ชันเก่าอาจทำให้คอนฟิกเสียหายได้
</Warning>

## `update status`

แสดงช่องทางอัปเดตที่ใช้งานอยู่ + แท็ก/สาขา/SHA ของ git (สำหรับ source checkouts) พร้อมสถานะความพร้อมของอัปเดต

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

ตัวเลือก:

- `--json`: พิมพ์ JSON สถานะที่เครื่องอ่านได้
- `--timeout <seconds>`: เวลาหมดสำหรับการตรวจสอบ (ค่าเริ่มต้นคือ 3s)

## `update wizard`

โฟลว์แบบโต้ตอบเพื่อเลือกช่องทางอัปเดตและยืนยันว่าจะรีสตาร์ท Gateway
หลังอัปเดตหรือไม่ (ค่าเริ่มต้นคือรีสตาร์ท) หากคุณเลือก `dev` โดยไม่มี git checkout ระบบจะ
เสนอให้สร้างขึ้น

ตัวเลือก:

- `--timeout <seconds>`: เวลาหมดสำหรับแต่ละขั้นตอนการอัปเดต (ค่าเริ่มต้น `1800`)

## สิ่งที่ทำ

เมื่อคุณสลับช่องทางอย่างชัดเจน (`--channel ...`) OpenClaw จะรักษา
วิธีติดตั้งให้สอดคล้องด้วย:

- `dev` → ตรวจให้แน่ใจว่ามี git checkout (ค่าเริ่มต้น: `~/openclaw`, แทนที่ได้ด้วย `OPENCLAW_GIT_DIR`),
  อัปเดต checkout นั้น และติดตั้ง CLI แบบ global จาก checkout นั้น
- `stable` → ติดตั้งจาก npm โดยใช้ `latest`
- `beta` → เลือกใช้ npm dist-tag `beta` ก่อน แต่จะถอยกลับไปใช้ `latest` เมื่อ beta
  ไม่มีหรือเก่ากว่า stable release ปัจจุบัน

ตัวอัปเดตอัตโนมัติของแกน Gateway (เมื่อเปิดใช้ผ่านคอนฟิก) จะเรียกเส้นทางอัปเดตของ CLI
นอกตัวจัดการคำขอ Gateway ที่กำลังทำงานอยู่ การอัปเดตผ่านตัวจัดการแพ็กเกจของ control-plane `update.run`
จะบังคับให้รีสตาร์ทอัปเดตแบบไม่เลื่อนเวลาและไม่มีช่วงคูลดาวน์หลังการสลับแพ็กเกจ
เพราะโปรเซส Gateway เก่าอาจยังมีชิ้นส่วนในหน่วยความจำที่ชี้ไปยัง
ไฟล์ที่ถูกแพ็กเกจใหม่ลบออกแล้ว

สำหรับการติดตั้งผ่านตัวจัดการแพ็กเกจ `openclaw update` จะ resolve เวอร์ชันแพ็กเกจเป้าหมาย
ก่อนเรียกตัวจัดการแพ็กเกจ การติดตั้ง npm แบบ global ใช้การติดตั้งแบบ staging:
OpenClaw ติดตั้งแพ็กเกจใหม่ลงใน prefix ชั่วคราวของ npm ตรวจสอบ
รายการ `dist` ที่แพ็กเกจไว้ที่นั่น จากนั้นสลับ package tree ที่สะอาดนั้นเข้าไปใน
prefix แบบ global จริง หากการตรวจสอบล้มเหลว doctor หลังอัปเดต การซิงค์ Plugin และ
งานรีสตาร์ทจะไม่รันจาก tree ที่น่าสงสัยนั้น แม้ว่าเวอร์ชันที่ติดตั้งอยู่
จะตรงกับเป้าหมายแล้ว คำสั่งก็จะรีเฟรชการติดตั้งแพ็กเกจแบบ global
จากนั้นรันการซิงค์ Plugin รีเฟรชการเติมคำสั่งอัตโนมัติของคำสั่งหลัก และงานรีสตาร์ท สิ่งนี้
ช่วยให้ sidecar ที่แพ็กเกจไว้และเรคคอร์ด Plugin ที่ช่องทางเป็นเจ้าของสอดคล้องกับ
บิลด์ OpenClaw ที่ติดตั้งอยู่ ขณะปล่อยให้การสร้างการเติมคำสั่งอัตโนมัติของคำสั่ง Plugin ทั้งหมด
เกิดขึ้นจากการรัน `openclaw completion --write-state` อย่างชัดเจน

เมื่อมีการติดตั้งบริการ Gateway ที่จัดการในเครื่อง และเปิดใช้การรีสตาร์ท
การอัปเดตผ่านตัวจัดการแพ็กเกจจะหยุดบริการที่กำลังทำงานก่อนแทนที่ package
tree จากนั้นรีเฟรชข้อมูลเมตาของบริการจากการติดตั้งที่อัปเดตแล้ว รีสตาร์ท
บริการ และตรวจสอบว่า Gateway ที่รีสตาร์ทรายงานเวอร์ชันที่คาดไว้ เมื่อใช้
`--no-restart` การแทนที่แพ็กเกจยังคงทำงาน แต่บริการที่จัดการจะไม่ถูก
หยุดหรือรีสตาร์ท ดังนั้น Gateway ที่กำลังทำงานอยู่อาจยังใช้โค้ดเก่าจนกว่าคุณจะรีสตาร์ท
ด้วยตนเอง

## โฟลว์ Git checkout

### การเลือกช่องทาง

- `stable`: checkout แท็กล่าสุดที่ไม่ใช่ beta จากนั้น build และ doctor
- `beta`: เลือกแท็ก `-beta` ล่าสุดก่อน แต่ถอยกลับไปใช้แท็ก stable ล่าสุดเมื่อ beta ไม่มีหรือเก่ากว่า
- `dev`: checkout `main` จากนั้น fetch และ rebase

### ขั้นตอนการอัปเดต

<Steps>
  <Step title="ตรวจสอบ worktree ที่สะอาด">
    ต้องไม่มีการเปลี่ยนแปลงที่ยังไม่ได้ commit
  </Step>
  <Step title="สลับช่องทาง">
    สลับไปยังช่องทางที่เลือก (แท็กหรือสาขา)
  </Step>
  <Step title="Fetch upstream">
    เฉพาะ Dev
  </Step>
  <Step title="Preflight build (เฉพาะ dev)">
    รัน lint และ TypeScript build ใน worktree ชั่วคราว หาก tip ล้มเหลว จะถอยย้อนกลับสูงสุด 10 commit เพื่อหาบิลด์ที่สะอาดใหม่ที่สุด
  </Step>
  <Step title="Rebase">
    Rebase ไปยัง commit ที่เลือก (เฉพาะ dev)
  </Step>
  <Step title="ติดตั้ง dependencies">
    ใช้ตัวจัดการแพ็กเกจของ repo สำหรับ pnpm checkouts ตัวอัปเดตจะ bootstrap `pnpm` ตามต้องการ (ผ่าน `corepack` ก่อน แล้วจึงใช้ fallback ชั่วคราว `npm install pnpm@10`) แทนการรัน `npm run build` ภายใน pnpm workspace
  </Step>
  <Step title="Build Control UI">
    Build gateway และ Control UI
  </Step>
  <Step title="รัน doctor">
    `openclaw doctor` จะรันเป็นการตรวจสอบ safe-update ขั้นสุดท้าย
  </Step>
  <Step title="ซิงค์ Plugin">
    ซิงค์ Plugin ไปยังช่องทางที่ใช้งานอยู่ Dev ใช้ Plugin ที่บันเดิลมา ส่วน stable และ beta ใช้ npm อัปเดต Plugin ที่ติดตั้งผ่าน npm
  </Step>
</Steps>

<Warning>
หากการอัปเดต Plugin ของ npm ที่ pin แบบเจาะจง resolve ไปยังอาร์ติแฟกต์ที่มี integrity แตกต่างจากเรคคอร์ดการติดตั้งที่เก็บไว้ `openclaw update` จะยกเลิกการอัปเดตอาร์ติแฟกต์ Plugin นั้นแทนการติดตั้ง ติดตั้งใหม่หรืออัปเดต Plugin อย่างชัดเจนหลังจากตรวจสอบแล้วว่าคุณเชื่อถืออาร์ติแฟกต์ใหม่เท่านั้น
</Warning>

<Note>
ความล้มเหลวในการซิงค์ Plugin หลังอัปเดตจะทำให้ผลการอัปเดตล้มเหลวและหยุดงานต่อเนื่องสำหรับการรีสตาร์ท แก้ไขข้อผิดพลาดของการติดตั้งหรืออัปเดต Plugin แล้วรัน `openclaw update` อีกครั้ง

เมื่อ Gateway ที่อัปเดตเริ่มทำงาน dependencies ของ runtime สำหรับ Plugin ที่บันเดิลและเปิดใช้งานอยู่จะถูก staging ก่อนการเปิดใช้งาน Plugin การรีสตาร์ทของ `update.run` ผ่านตัวจัดการแพ็กเกจจะข้ามการเลื่อนเวลาเมื่อ idle ตามปกติและคูลดาวน์การรีสตาร์ทหลังจากสลับ package tree แล้ว ดังนั้นโปรเซสเก่าจึงไม่สามารถ lazy-load ชิ้นส่วนที่ถูกลบออกได้ การรีสตาร์ทของ service-manager ยังคง drain การ staging ของ runtime-dependency ก่อนปิด Gateway

หาก pnpm bootstrap ยังล้มเหลว ตัวอัปเดตจะหยุดตั้งแต่ต้นพร้อมข้อผิดพลาดเฉพาะของตัวจัดการแพ็กเกจ แทนที่จะลอง `npm run build` ภายใน checkout
</Note>

## ชวเลข `--update`

`openclaw --update` จะเขียนใหม่เป็น `openclaw update` (มีประโยชน์สำหรับ shell และสคริปต์ launcher)

## ที่เกี่ยวข้อง

- `openclaw doctor` (เสนอให้รัน update ก่อนบน git checkouts)
- [ช่องทางการพัฒนา](/th/install/development-channels)
- [การอัปเดต](/th/install/updating)
- [อ้างอิง CLI](/th/cli)
