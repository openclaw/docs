---
read_when:
    - คุณต้องการอัปเดตสำเนาซอร์สที่เช็กเอาต์ไว้อย่างปลอดภัย
    - คุณกำลังดีบักเอาต์พุตหรือตัวเลือกของ `openclaw update`
    - คุณต้องเข้าใจลักษณะการทำงานแบบย่อของ `--update`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw update` (การอัปเดตซอร์สโค้ดที่ค่อนข้างปลอดภัย + การรีสตาร์ต Gateway อัตโนมัติ)
title: อัปเดต
x-i18n:
    generated_at: "2026-05-03T21:29:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ec06b8db5e2aba4000922f92a36834e8782986a77f6b5889bb19031a59f1b8
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

อัปเดต OpenClaw อย่างปลอดภัยและสลับระหว่างช่องทาง stable/beta/dev

หากคุณติดตั้งผ่าน **npm/pnpm/bun** (ติดตั้งแบบ global ไม่มีเมทาดาต้า git)
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

- `--no-restart`: ข้ามการรีสตาร์ทบริการ Gateway หลังจากอัปเดตสำเร็จ การอัปเดตผ่านตัวจัดการแพ็กเกจที่รีสตาร์ท Gateway จะตรวจสอบว่าบริการที่รีสตาร์ทแล้วรายงานเวอร์ชันที่อัปเดตตามที่คาดไว้ ก่อนที่คำสั่งจะสำเร็จ
- `--channel <stable|beta|dev>`: ตั้งค่าช่องทางอัปเดต (git + npm; บันทึกไว้ในคอนฟิก)
- `--tag <dist-tag|version|spec>`: แทนที่เป้าหมายแพ็กเกจเฉพาะการอัปเดตครั้งนี้เท่านั้น สำหรับการติดตั้งแบบแพ็กเกจ `main` จะชี้ไปที่ `github:openclaw/openclaw#main`
- `--dry-run`: ดูตัวอย่างการดำเนินการอัปเดตที่วางแผนไว้ (โฟลว์ channel/tag/target/restart) โดยไม่เขียนคอนฟิก ติดตั้ง ซิงค์ Plugin หรือรีสตาร์ท
- `--json`: พิมพ์ JSON `UpdateRunResult` ที่เครื่องอ่านได้ รวมถึง
  `postUpdate.plugins.integrityDrifts` เมื่อตรวจพบความคลาดเคลื่อนของอาร์ติแฟกต์ Plugin npm
  ระหว่างการซิงค์ Plugin หลังอัปเดต
- `--timeout <seconds>`: ระยะหมดเวลาต่อขั้นตอน (ค่าเริ่มต้นคือ 1800 วินาที)
- `--yes`: ข้ามพรอมป์ยืนยัน (เช่น การยืนยันการดาวน์เกรด)

`openclaw update` ไม่มีแฟล็ก `--verbose` ใช้ `--dry-run` เพื่อดูตัวอย่าง
การดำเนินการ channel/tag/install/restart ที่วางแผนไว้, ใช้ `--json` สำหรับผลลัพธ์
ที่เครื่องอ่านได้ และใช้ `openclaw update status --json` เมื่อคุณต้องการเฉพาะรายละเอียด
ช่องทางและความพร้อมใช้งาน หากคุณกำลังดีบักบันทึก Gateway รอบการอัปเดต
ระดับความละเอียดในคอนโซลและระดับบันทึกไฟล์จะแยกกัน: `--verbose` ของ Gateway มีผลต่อ
เอาต์พุต terminal/WebSocket ขณะที่บันทึกไฟล์ต้องใช้ `logging.level: "debug"` หรือ
`"trace"` ในคอนฟิก ดู [การบันทึกของ Gateway](/th/gateway/logging)

<Warning>
การดาวน์เกรดต้องยืนยัน เพราะเวอร์ชันเก่าอาจทำให้คอนฟิกเสียหายได้
</Warning>

## `update status`

แสดงช่องทางอัปเดตที่ใช้งานอยู่ + แท็ก/บรานช์/SHA ของ git (สำหรับซอร์ส checkout) รวมถึงความพร้อมของการอัปเดต

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

ตัวเลือก:

- `--json`: พิมพ์ JSON สถานะที่เครื่องอ่านได้
- `--timeout <seconds>`: ระยะหมดเวลาสำหรับการตรวจสอบ (ค่าเริ่มต้นคือ 3 วินาที)

## `update wizard`

โฟลว์แบบโต้ตอบเพื่อเลือกช่องทางอัปเดตและยืนยันว่าจะรีสตาร์ท Gateway
หลังอัปเดตหรือไม่ (ค่าเริ่มต้นคือรีสตาร์ท) หากคุณเลือก `dev` โดยไม่มี git checkout ระบบ
จะเสนอให้สร้างให้

ตัวเลือก:

- `--timeout <seconds>`: ระยะหมดเวลาสำหรับแต่ละขั้นตอนอัปเดต (ค่าเริ่มต้น `1800`)

## สิ่งที่คำสั่งทำ

เมื่อคุณสลับช่องทางอย่างชัดเจน (`--channel ...`) OpenClaw จะรักษา
วิธีติดตั้งให้สอดคล้องด้วย:

- `dev` → ตรวจให้แน่ใจว่ามี git checkout (ค่าเริ่มต้น: `~/openclaw`, แทนที่ด้วย `OPENCLAW_GIT_DIR`),
  อัปเดต checkout นั้น และติดตั้ง CLI แบบ global จาก checkout นั้น
- `stable` → ติดตั้งจาก npm โดยใช้ `latest`
- `beta` → เลือกใช้ npm dist-tag `beta` ก่อน แต่จะถอยกลับไปใช้ `latest` เมื่อ beta
  หายไปหรือเก่ากว่า stable release ปัจจุบัน

ตัวอัปเดตอัตโนมัติของแกน Gateway (เมื่อเปิดใช้งานผ่านคอนฟิก) จะเปิดเส้นทางอัปเดตของ CLI
นอกตัวจัดการคำขอ Gateway ที่กำลังทำงานอยู่ การอัปเดตผ่านตัวจัดการแพ็กเกจของ control-plane `update.run`
จะบังคับให้รีสตาร์ทหลังสลับแพ็กเกจแบบไม่เลื่อนเวลาและไม่มีคูลดาวน์
เพราะโปรเซส Gateway เก่าอาจยังมีชิ้นส่วนในหน่วยความจำที่ชี้ไปยัง
ไฟล์ซึ่งถูกแพ็กเกจใหม่ลบออกแล้ว

สำหรับการติดตั้งผ่านตัวจัดการแพ็กเกจ `openclaw update` จะ resolve เวอร์ชันแพ็กเกจ
เป้าหมายก่อนเรียกตัวจัดการแพ็กเกจ การติดตั้ง npm แบบ global ใช้การติดตั้งแบบ staged:
OpenClaw ติดตั้งแพ็กเกจใหม่ลงใน npm prefix ชั่วคราว ตรวจสอบ
รายการ `dist` ที่แพ็กไว้ในนั้น จากนั้นสลับ package tree ที่สะอาดนั้นเข้าไปใน
global prefix จริง หากการตรวจสอบล้มเหลว งาน doctor หลังอัปเดต การซิงค์ Plugin และ
การรีสตาร์ทจะไม่รันจาก tree ที่น่าสงสัย แม้เวอร์ชันที่ติดตั้งอยู่
จะตรงกับเป้าหมายแล้ว คำสั่งก็จะรีเฟรชการติดตั้งแพ็กเกจ global
จากนั้นรันการซิงค์ Plugin รีเฟรชการเติมคำสั่งแกน และงานรีสตาร์ท สิ่งนี้
ช่วยให้ sidecar ที่แพ็กมาและระเบียน Plugin ที่ช่องทางเป็นเจ้าของสอดคล้องกับ
บิลด์ OpenClaw ที่ติดตั้งอยู่ โดยปล่อยให้การสร้างการเติมคำสั่ง Plugin เต็มรูปแบบเป็นหน้าที่ของ
การรัน `openclaw completion --write-state` อย่างชัดเจน

เมื่อมีบริการ Gateway แบบ managed ในเครื่องติดตั้งอยู่และเปิดใช้งานการรีสตาร์ท
การอัปเดตผ่านตัวจัดการแพ็กเกจจะหยุดบริการที่กำลังทำงานก่อนแทนที่ package
tree จากนั้นรีเฟรชเมทาดาต้าบริการจากการติดตั้งที่อัปเดตแล้ว รีสตาร์ท
บริการ และตรวจสอบว่า Gateway ที่รีสตาร์ทแล้วรายงานเวอร์ชันที่คาดไว้ก่อน
รายงานว่าสำเร็จ บน macOS การตรวจสอบหลังอัปเดตยังตรวจสอบว่า LaunchAgent
ถูกโหลด/กำลังทำงานสำหรับโปรไฟล์ที่ใช้งานอยู่ และพอร์ต loopback ที่กำหนดค่าไว้
มีสุขภาพดี หากติดตั้ง plist แล้วแต่ launchd ไม่ได้ควบคุมดูแลอยู่ OpenClaw
จะ bootstrap LaunchAgent ใหม่โดยอัตโนมัติ แล้วรันการตรวจสอบ
ความพร้อมด้านสุขภาพ/เวอร์ชัน/ช่องทางอีกครั้ง การ bootstrap ใหม่จะโหลดงาน RunAtLoad
โดยตรง ดังนั้นการกู้คืนการอัปเดตจะไม่ `kickstart -k` Gateway ที่เพิ่ง
เกิดขึ้นทันที หาก Gateway ยังไม่กลับมามีสุขภาพดี คำสั่งจะออกด้วยสถานะ
ไม่ใช่ศูนย์และพิมพ์พาธบันทึกการรีสตาร์ท พร้อมคำสั่งรีสตาร์ท ติดตั้งใหม่ และ
rollback แพ็กเกจอย่างชัดเจน เมื่อใช้ `--no-restart`
การแทนที่แพ็กเกจยังคงรัน แต่บริการ managed จะไม่ถูกหยุดหรือ
รีสตาร์ท ดังนั้น Gateway ที่กำลังทำงานอาจยังใช้โค้ดเก่าจนกว่าคุณจะรีสตาร์ท
ด้วยตนเอง

## โฟลว์ git checkout

### การเลือกช่องทาง

- `stable`: checkout แท็ก non-beta ล่าสุด จากนั้น build และ doctor
- `beta`: เลือกแท็ก `-beta` ล่าสุดก่อน แต่ถอยกลับไปใช้แท็ก stable ล่าสุดเมื่อ beta หายไปหรือเก่ากว่า
- `dev`: checkout `main` จากนั้น fetch และ rebase

### ขั้นตอนอัปเดต

<Steps>
  <Step title="Verify clean worktree">
    ต้องไม่มีการเปลี่ยนแปลงที่ยังไม่ได้ commit
  </Step>
  <Step title="Switch channel">
    สลับไปยังช่องทางที่เลือก (แท็กหรือบรานช์)
  </Step>
  <Step title="Fetch upstream">
    เฉพาะ Dev
  </Step>
  <Step title="Preflight build (dev only)">
    รัน lint และ TypeScript build ใน worktree ชั่วคราว หาก tip ล้มเหลว จะย้อนกลับไปสูงสุด 10 commit เพื่อหาบิลด์สะอาดใหม่ที่สุด
  </Step>
  <Step title="Rebase">
    rebase ไปยัง commit ที่เลือก (เฉพาะ dev)
  </Step>
  <Step title="Install dependencies">
    ใช้ตัวจัดการแพ็กเกจของ repo สำหรับ pnpm checkouts ตัวอัปเดตจะ bootstrap `pnpm` ตามต้องการ (ผ่าน `corepack` ก่อน แล้วจึง fallback เป็น `npm install pnpm@10` ชั่วคราว) แทนการรัน `npm run build` ภายใน pnpm workspace
  </Step>
  <Step title="Build Control UI">
    build gateway และ Control UI
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` รันเป็นการตรวจสอบ safe-update ขั้นสุดท้าย
  </Step>
  <Step title="Sync plugins">
    ซิงค์ Plugin ไปยังช่องทางที่ใช้งานอยู่ Dev ใช้ Plugin ที่ bundled มา ส่วน stable และ beta ใช้ npm อัปเดตการติดตั้ง Plugin ที่ติดตามไว้
  </Step>
</Steps>

บนช่องทางอัปเดต beta การติดตั้ง Plugin npm และ ClawHub ที่ติดตามไว้ซึ่งตาม
สาย default/latest จะลองใช้ release `@beta` ของ Plugin ก่อน หาก Plugin ไม่มี
beta release OpenClaw จะถอยกลับไปใช้ spec default/latest ที่บันทึกไว้ เวอร์ชันแบบ exact
และแท็กที่ระบุชัดเจนจะไม่ถูกเขียนใหม่

<Warning>
หากการอัปเดต Plugin npm ที่ปักเวอร์ชันแบบ exact resolve ไปยังอาร์ติแฟกต์ที่ integrity ต่างจากระเบียนการติดตั้งที่เก็บไว้ `openclaw update` จะยกเลิกการอัปเดตอาร์ติแฟกต์ Plugin นั้นแทนการติดตั้ง ติดตั้งใหม่หรืออัปเดต Plugin อย่างชัดเจนหลังจากตรวจสอบแล้วเท่านั้นว่าคุณเชื่อถืออาร์ติแฟกต์ใหม่
</Warning>

<Note>
ความล้มเหลวในการซิงค์ Plugin หลังอัปเดตจะทำให้ผลลัพธ์การอัปเดตล้มเหลวและหยุดงานติดตามผลการรีสตาร์ท แก้ข้อผิดพลาดการติดตั้งหรืออัปเดต Plugin แล้วรัน `openclaw update` อีกครั้ง

เมื่อ Gateway ที่อัปเดตแล้วเริ่มทำงาน การโหลด Plugin จะเป็นแบบ verify-only: startup จะไม่รันตัวจัดการแพ็กเกจหรือแก้ไข dependency tree การรีสตาร์ทของ `update.run` ผ่านตัวจัดการแพ็กเกจจะข้ามการเลื่อนเวลาว่างและคูลดาวน์การรีสตาร์ทตามปกติหลังจากสลับ package tree แล้ว เพื่อให้โปรเซสเก่าไม่สามารถ lazy-load ชิ้นส่วนที่ถูกลบออกไปแล้วได้

หาก pnpm bootstrap ยังล้มเหลว ตัวอัปเดตจะหยุดตั้งแต่ต้นพร้อมข้อผิดพลาดเฉพาะตัวจัดการแพ็กเกจ แทนที่จะพยายามรัน `npm run build` ภายใน checkout
</Note>

## ชวเลข `--update`

`openclaw --update` จะถูกเขียนใหม่เป็น `openclaw update` (มีประโยชน์สำหรับ shell และสคริปต์ launcher)

## ที่เกี่ยวข้อง

- `openclaw doctor` (เสนอให้รัน update ก่อนบน git checkouts)
- [ช่องทางพัฒนา](/th/install/development-channels)
- [การอัปเดต](/th/install/updating)
- [อ้างอิง CLI](/th/cli)
