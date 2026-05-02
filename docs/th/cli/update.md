---
read_when:
    - คุณต้องการอัปเดตสำเนาซอร์สที่เช็กเอาต์ไว้อย่างปลอดภัย
    - คุณต้องเข้าใจพฤติกรรมแบบย่อของ `--update`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw update` (การอัปเดตซอร์สที่ค่อนข้างปลอดภัย + การรีสตาร์ท Gateway โดยอัตโนมัติ)
title: อัปเดต
x-i18n:
    generated_at: "2026-05-02T20:43:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35df8c6d8b1adb9597377f6e2b4844352577992c12636a88b3f3c1854dc0666b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

อัปเดต OpenClaw อย่างปลอดภัยและสลับระหว่างช่องทาง stable/beta/dev

หากคุณติดตั้งผ่าน **npm/pnpm/bun** (การติดตั้งแบบ global ไม่มีเมทาดาทา git)
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

- `--no-restart`: ข้ามการรีสตาร์ตบริการ Gateway หลังจากอัปเดตสำเร็จ การอัปเดตผ่านตัวจัดการแพ็กเกจที่รีสตาร์ต Gateway จะตรวจสอบว่าบริการที่รีสตาร์ตรายงานเวอร์ชันที่อัปเดตตามคาดก่อนที่คำสั่งจะสำเร็จ
- `--channel <stable|beta|dev>`: ตั้งค่าช่องทางอัปเดต (git + npm; คงค่าไว้ในการกำหนดค่า)
- `--tag <dist-tag|version|spec>`: แทนที่เป้าหมายแพ็กเกจสำหรับการอัปเดตครั้งนี้เท่านั้น สำหรับการติดตั้งแบบแพ็กเกจ `main` จะจับคู่กับ `github:openclaw/openclaw#main`
- `--dry-run`: แสดงตัวอย่างการดำเนินการอัปเดตที่วางแผนไว้ (โฟลว์ channel/tag/target/restart) โดยไม่เขียนการกำหนดค่า ติดตั้ง ซิงก์ plugins หรือรีสตาร์ต
- `--json`: พิมพ์ JSON `UpdateRunResult` ที่อ่านได้โดยเครื่อง รวมถึง
  `postUpdate.plugins.integrityDrifts` เมื่อตรวจพบการคลาดเคลื่อนของอาร์ติแฟกต์ npm plugin
  ระหว่างการซิงก์ plugin หลังอัปเดต
- `--timeout <seconds>`: หมดเวลาต่อแต่ละขั้นตอน (ค่าเริ่มต้นคือ 1800 วินาที)
- `--yes`: ข้ามพรอมป์ยืนยัน (เช่น การยืนยันการดาวน์เกรด)

<Warning>
การดาวน์เกรดต้องมีการยืนยัน เพราะเวอร์ชันเก่าอาจทำให้การกำหนดค่าเสียหายได้
</Warning>

## `update status`

แสดงช่องทางอัปเดตที่ใช้งานอยู่ + git tag/branch/SHA (สำหรับ source checkouts) พร้อมสถานะความพร้อมของอัปเดต

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

ตัวเลือก:

- `--json`: พิมพ์ JSON สถานะที่อ่านได้โดยเครื่อง
- `--timeout <seconds>`: หมดเวลาสำหรับการตรวจสอบ (ค่าเริ่มต้นคือ 3 วินาที)

## `update wizard`

โฟลว์แบบโต้ตอบเพื่อเลือกช่องทางอัปเดตและยืนยันว่าจะรีสตาร์ต Gateway
หลังอัปเดตหรือไม่ (ค่าเริ่มต้นคือรีสตาร์ต) หากคุณเลือก `dev` โดยไม่มี git checkout ระบบจะ
เสนอให้สร้างหนึ่งรายการ

ตัวเลือก:

- `--timeout <seconds>`: หมดเวลาสำหรับแต่ละขั้นตอนอัปเดต (ค่าเริ่มต้น `1800`)

## สิ่งที่ทำ

เมื่อคุณสลับช่องทางอย่างชัดเจน (`--channel ...`) OpenClaw จะคงให้
วิธีติดตั้งสอดคล้องกันด้วย:

- `dev` → ทำให้แน่ใจว่ามี git checkout (ค่าเริ่มต้น: `~/openclaw`, แทนที่ด้วย `OPENCLAW_GIT_DIR`),
  อัปเดต checkout นั้น และติดตั้ง CLI แบบ global จาก checkout นั้น
- `stable` → ติดตั้งจาก npm โดยใช้ `latest`
- `beta` → ให้ความสำคัญกับ npm dist-tag `beta` แต่จะ fallback ไปที่ `latest` เมื่อ beta
  ไม่มีหรือเก่ากว่ารุ่น stable ปัจจุบัน

ตัวอัปเดตอัตโนมัติของแกน Gateway (เมื่อเปิดใช้งานผ่านการกำหนดค่า) จะเปิดเส้นทางอัปเดต CLI
นอกตัวจัดการคำขอ Gateway ที่กำลังทำงานอยู่ การอัปเดตตัวจัดการแพ็กเกจ `update.run` ใน control-plane
จะบังคับรีสตาร์ตอัปเดตแบบไม่เลื่อนเวลาและไม่มี cooldown หลังจากสลับแพ็กเกจ
เพราะกระบวนการ Gateway เก่าอาจยังมีชิ้นส่วนในหน่วยความจำที่ชี้ไปยัง
ไฟล์ที่ถูกแพ็กเกจใหม่ลบออกไปแล้ว

สำหรับการติดตั้งผ่านตัวจัดการแพ็กเกจ `openclaw update` จะแก้หาเวอร์ชันแพ็กเกจเป้าหมาย
ก่อนเรียกตัวจัดการแพ็กเกจ การติดตั้ง npm แบบ global ใช้การติดตั้งแบบ staged:
OpenClaw ติดตั้งแพ็กเกจใหม่ลงใน npm prefix ชั่วคราว ตรวจสอบ
inventory ของ `dist` ที่แพ็กเกจไว้ที่นั่น แล้วสลับ package tree ที่สะอาดนั้นเข้าไปใน
global prefix จริง หากการตรวจสอบล้มเหลว doctor หลังอัปเดต การซิงก์ plugin และ
งานรีสตาร์ตจะไม่รันจาก tree ที่น่าสงสัย แม้เมื่อเวอร์ชันที่ติดตั้งอยู่
ตรงกับเป้าหมายแล้ว คำสั่งจะรีเฟรชการติดตั้งแพ็กเกจ global
แล้วรันการซิงก์ plugin การรีเฟรช completion ของคำสั่งแกน และงานรีสตาร์ต สิ่งนี้
ช่วยให้ sidecars ที่แพ็กเกจไว้และระเบียน plugin ที่ช่องทางเป็นเจ้าของสอดคล้องกับ
build ของ OpenClaw ที่ติดตั้งอยู่ ขณะปล่อยให้การ rebuild completion ของคำสั่ง plugin แบบเต็มเป็นหน้าที่ของ
การรัน `openclaw completion --write-state` อย่างชัดเจน

เมื่อมีการติดตั้งบริการ Gateway ที่จัดการในเครื่องและเปิดใช้งานการรีสตาร์ต
การอัปเดตผ่านตัวจัดการแพ็กเกจจะหยุดบริการที่กำลังทำงานก่อนแทนที่ package
tree จากนั้นรีเฟรชเมทาดาทาของบริการจากการติดตั้งที่อัปเดตแล้ว รีสตาร์ต
บริการ และตรวจสอบว่า Gateway ที่รีสตาร์ตรายงานเวอร์ชันตามที่คาดไว้ ด้วย
`--no-restart` การแทนที่แพ็กเกจยังคงทำงาน แต่บริการที่จัดการจะไม่ถูก
หยุดหรือรีสตาร์ต ดังนั้น Gateway ที่กำลังทำงานอยู่อาจยังใช้โค้ดเก่าจนกว่าคุณจะรีสตาร์ต
ด้วยตนเอง

## โฟลว์ git checkout

### การเลือกช่องทาง

- `stable`: checkout tag non-beta ล่าสุด จากนั้น build และ doctor
- `beta`: ให้ความสำคัญกับ tag `-beta` ล่าสุด แต่ fallback ไปยัง tag stable ล่าสุดเมื่อ beta ไม่มีหรือเก่ากว่า
- `dev`: checkout `main` จากนั้น fetch และ rebase

### ขั้นตอนอัปเดต

<Steps>
  <Step title="ตรวจสอบว่า worktree สะอาด">
    ต้องไม่มีการเปลี่ยนแปลงที่ยังไม่ได้ commit
  </Step>
  <Step title="สลับช่องทาง">
    สลับไปยังช่องทางที่เลือก (tag หรือ branch)
  </Step>
  <Step title="Fetch upstream">
    เฉพาะ Dev
  </Step>
  <Step title="Preflight build (เฉพาะ dev)">
    รัน lint และ TypeScript build ใน temp worktree หาก tip ล้มเหลว จะถอยกลับสูงสุด 10 commits เพื่อหา build ใหม่ล่าสุดที่สะอาด
  </Step>
  <Step title="Rebase">
    Rebase ไปยัง commit ที่เลือก (เฉพาะ dev)
  </Step>
  <Step title="ติดตั้ง dependencies">
    ใช้ตัวจัดการแพ็กเกจของ repo สำหรับ pnpm checkouts ตัวอัปเดตจะ bootstrap `pnpm` เมื่อต้องใช้ (ผ่าน `corepack` ก่อน จากนั้น fallback ไปที่ `npm install pnpm@10` แบบชั่วคราว) แทนที่จะรัน `npm run build` ภายใน pnpm workspace
  </Step>
  <Step title="Build Control UI">
    Build gateway และ Control UI
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` รันเป็นการตรวจสอบ safe-update ขั้นสุดท้าย
  </Step>
  <Step title="Sync plugins">
    ซิงก์ plugins ไปยังช่องทางที่ใช้งานอยู่ Dev ใช้ bundled plugins; stable และ beta ใช้ npm อัปเดตการติดตั้ง plugin ที่ติดตามไว้
  </Step>
</Steps>

บนช่องทางอัปเดต beta การติดตั้ง npm และ ClawHub plugin ที่ติดตามไว้ซึ่งตาม
สาย default/latest จะลอง release ของ plugin `@beta` ก่อน หาก plugin ไม่มี
beta release OpenClaw จะ fallback ไปยัง spec default/latest ที่บันทึกไว้
เวอร์ชันแบบ exact และ tag ที่ระบุชัดเจนจะไม่ถูกเขียนใหม่

<Warning>
หากการอัปเดต npm plugin ที่ pin แบบ exact แก้ไปยังอาร์ติแฟกต์ที่มี integrity แตกต่างจากระเบียนการติดตั้งที่เก็บไว้ `openclaw update` จะยกเลิกการอัปเดตอาร์ติแฟกต์ plugin นั้นแทนที่จะติดตั้ง ให้ติดตั้งใหม่หรืออัปเดต plugin อย่างชัดเจนหลังจากตรวจสอบแล้วว่าคุณไว้วางใจอาร์ติแฟกต์ใหม่นั้นเท่านั้น
</Warning>

<Note>
ความล้มเหลวในการซิงก์ plugin หลังอัปเดตจะทำให้ผลลัพธ์การอัปเดตล้มเหลวและหยุดงานติดตามผลการรีสตาร์ต แก้ข้อผิดพลาดการติดตั้งหรืออัปเดต plugin แล้วรัน `openclaw update` อีกครั้ง

เมื่อ Gateway ที่อัปเดตแล้วเริ่มทำงาน การโหลด plugin เป็นแบบ verify-only: startup จะไม่รันตัวจัดการแพ็กเกจหรือเปลี่ยนแปลง dependency trees การรีสตาร์ต `update.run` ของตัวจัดการแพ็กเกจจะ bypass การเลื่อนเวลาช่วง idle ตามปกติและ restart cooldown หลังจาก package tree ถูกสลับแล้ว ดังนั้นกระบวนการเก่าจะไม่สามารถ lazy-load ชิ้นส่วนที่ถูกลบไปแล้วได้

หาก pnpm bootstrap ยังล้มเหลว ตัวอัปเดตจะหยุดก่อนกำหนดพร้อมข้อผิดพลาดเฉพาะตัวจัดการแพ็กเกจ แทนที่จะพยายามรัน `npm run build` ภายใน checkout
</Note>

## ชวเลข `--update`

`openclaw --update` เขียนใหม่เป็น `openclaw update` (มีประโยชน์สำหรับ shell และ launcher scripts)

## ที่เกี่ยวข้อง

- `openclaw doctor` (เสนอให้รัน update ก่อนบน git checkouts)
- [ช่องทางการพัฒนา](/th/install/development-channels)
- [การอัปเดต](/th/install/updating)
- [อ้างอิง CLI](/th/cli)
