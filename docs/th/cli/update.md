---
read_when:
    - คุณต้องการอัปเดตสำเนาซอร์สโค้ดที่เช็กเอาต์มาอย่างปลอดภัย
    - คุณกำลังดีบักเอาต์พุตหรือตัวเลือกของ `openclaw update`
    - คุณต้องเข้าใจลักษณะการทำงานของรูปแบบย่อ `--update`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw update` (การอัปเดตซอร์สที่ค่อนข้างปลอดภัย + การรีสตาร์ท Gateway อัตโนมัติ)
title: อัปเดต
x-i18n:
    generated_at: "2026-05-06T09:06:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eff9aeaecd4bf4eaa98fa511a3b9ebaedaf5872ff9407398665f2a8c2ab7d9
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

อัปเดต OpenClaw อย่างปลอดภัยและสลับระหว่างช่องทาง stable/beta/dev

หากคุณติดตั้งผ่าน **npm/pnpm/bun** (การติดตั้งแบบ global ไม่มี metadata ของ git)
การอัปเดตจะเกิดผ่านโฟลว์ของ package manager ใน [การอัปเดต](/th/install/updating)

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

- `--no-restart`: ข้ามการ restart บริการ Gateway หลังจากอัปเดตสำเร็จ การอัปเดตผ่าน package manager ที่ restart Gateway จะตรวจสอบว่าบริการที่ restart แล้วรายงานเวอร์ชันที่อัปเดตตามที่คาดไว้ก่อนที่คำสั่งจะสำเร็จ
- `--channel <stable|beta|dev>`: ตั้งค่าช่องทางการอัปเดต (git + npm; บันทึกคงไว้ใน config)
- `--tag <dist-tag|version|spec>`: override เป้าหมาย package เฉพาะการอัปเดตครั้งนี้ สำหรับการติดตั้งแบบ package, `main` จะ map ไปที่ `github:openclaw/openclaw#main`
- `--dry-run`: แสดงตัวอย่างการดำเนินการอัปเดตที่วางแผนไว้ (โฟลว์ channel/tag/target/restart) โดยไม่เขียน config, ติดตั้ง, ซิงก์ Plugin หรือ restart
- `--json`: พิมพ์ JSON `UpdateRunResult` ที่ machine-readable รวมถึง
  `postUpdate.plugins.warnings` เมื่อ Plugin ที่จัดการอยู่เสียหายหรือโหลดไม่ได้และต้อง
  ซ่อมหลังจากการอัปเดต core สำเร็จ และ `postUpdate.plugins.integrityDrifts`
  เมื่อพบความคลาดเคลื่อนของ artifact ของ Plugin npm ระหว่างการซิงก์ Plugin หลังอัปเดต
- `--timeout <seconds>`: timeout ต่อขั้นตอน (ค่าเริ่มต้นคือ 1800s)
- `--yes`: ข้าม prompt ยืนยัน (เช่น การยืนยันการ downgrade)

`openclaw update` ไม่มี flag `--verbose` ใช้ `--dry-run` เพื่อดูตัวอย่าง
การดำเนินการ channel/tag/install/restart ที่วางแผนไว้, ใช้ `--json` สำหรับผลลัพธ์
แบบ machine-readable และใช้ `openclaw update status --json` เมื่อคุณต้องการเพียง
รายละเอียดช่องทางและความพร้อมใช้งาน หากคุณกำลัง debug log ของ Gateway รอบการอัปเดต
ระดับความละเอียดของคอนโซลและระดับ log ของไฟล์เป็นคนละส่วนกัน: Gateway `--verbose` ส่งผลต่อ
output ของ terminal/WebSocket ส่วน log ไฟล์ต้องใช้ `logging.level: "debug"` หรือ
`"trace"` ใน config ดู [การบันทึก log ของ Gateway](/th/gateway/logging)

<Warning>
การ downgrade ต้องมีการยืนยัน เพราะเวอร์ชันเก่าอาจทำให้ configuration เสียหายได้
</Warning>

## `update status`

แสดงช่องทางการอัปเดตที่ใช้งานอยู่ + tag/branch/SHA ของ git (สำหรับ source checkout) รวมถึงความพร้อมของอัปเดต

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

ตัวเลือก:

- `--json`: พิมพ์ JSON สถานะแบบ machine-readable
- `--timeout <seconds>`: timeout สำหรับการตรวจสอบ (ค่าเริ่มต้นคือ 3s)

## `update wizard`

โฟลว์แบบโต้ตอบเพื่อเลือกช่องทางการอัปเดตและยืนยันว่าจะ restart Gateway
หลังอัปเดตหรือไม่ (ค่าเริ่มต้นคือ restart) หากคุณเลือก `dev` โดยไม่มี git checkout ระบบจะ
เสนอให้สร้าง checkout หนึ่งรายการ

ตัวเลือก:

- `--timeout <seconds>`: timeout สำหรับแต่ละขั้นตอนการอัปเดต (ค่าเริ่มต้น `1800`)

## สิ่งที่คำสั่งนี้ทำ

เมื่อคุณสลับช่องทางอย่างชัดเจน (`--channel ...`), OpenClaw จะทำให้
วิธีการติดตั้งสอดคล้องกันด้วย:

- `dev` → ตรวจให้แน่ใจว่ามี git checkout (ค่าเริ่มต้น: `~/openclaw`, override ด้วย `OPENCLAW_GIT_DIR`),
  อัปเดต checkout นั้น และติดตั้ง CLI แบบ global จาก checkout นั้น
- `stable` → ติดตั้งจาก npm โดยใช้ `latest`
- `beta` → เลือกใช้ npm dist-tag `beta` ก่อน แต่ fallback เป็น `latest` เมื่อ beta
  ไม่มีหรือเก่ากว่า release stable ปัจจุบัน

ตัวอัปเดตอัตโนมัติของ core Gateway (เมื่อเปิดใช้ผ่าน config) จะเรียกใช้เส้นทางอัปเดตของ CLI
นอก request handler ของ Gateway ที่กำลังทำงานอยู่ การอัปเดต package manager ผ่าน control-plane
`update.run` จะบังคับ restart การอัปเดตแบบไม่เลื่อนเวลาและไม่มี cooldown หลังจากสลับ package
เพราะ process Gateway เก่าอาจยังมี chunks ในหน่วยความจำที่ชี้ไปยัง
ไฟล์ที่ package ใหม่ลบออกไปแล้ว

สำหรับการติดตั้งผ่าน package manager, `openclaw update` จะ resolve เวอร์ชัน package
เป้าหมายก่อนเรียก package manager การติดตั้ง npm global ใช้การติดตั้งแบบ staged:
OpenClaw ติดตั้ง package ใหม่ลงใน npm prefix ชั่วคราว ตรวจสอบ inventory `dist`
ที่อยู่ใน package ตรงนั้น แล้วสลับ package tree ที่สะอาดนั้นเข้าไปใน
global prefix จริง หากการตรวจสอบล้มเหลว งาน doctor หลังอัปเดต, การซิงก์ Plugin และ
restart จะไม่รันจาก tree ที่น่าสงสัย แม้ว่าเวอร์ชันที่ติดตั้งแล้ว
จะตรงกับเป้าหมายอยู่แล้ว คำสั่งจะ refresh การติดตั้ง package global
จากนั้นรันการซิงก์ Plugin, refresh completion ของ core-command และงาน restart สิ่งนี้
ช่วยให้ sidecar ที่อยู่ใน package และระเบียน Plugin ที่ช่องทางเป็นเจ้าของสอดคล้องกับ
build OpenClaw ที่ติดตั้งอยู่ โดยปล่อยให้การ rebuild completion ของ plugin-command แบบเต็มเป็นหน้าที่ของ
การรัน `openclaw completion --write-state` อย่างชัดเจน

เมื่อมีการติดตั้งบริการ Gateway ภายในเครื่องที่จัดการอยู่และเปิดใช้ restart,
การอัปเดตผ่าน package manager จะหยุดบริการที่กำลังรันก่อนแทนที่ package
tree จากนั้น refresh metadata ของบริการจากการติดตั้งที่อัปเดตแล้ว, restart
บริการ และตรวจสอบว่า Gateway ที่ restart แล้วรายงานเวอร์ชันที่คาดไว้ก่อน
รายงานว่าสำเร็จ บน macOS การตรวจสอบหลังอัปเดตจะตรวจสอบด้วยว่า LaunchAgent
ถูกโหลด/กำลังรันสำหรับ profile ที่ใช้งานอยู่ และพอร์ต loopback ที่กำหนดค่าไว้
ทำงานได้ดี หากติดตั้ง plist แล้วแต่ launchd ไม่ได้กำกับดูแลอยู่ OpenClaw
จะ bootstrap LaunchAgent ใหม่โดยอัตโนมัติ แล้วรันการตรวจสอบ
ความพร้อมของ health/version/channel อีกครั้ง การ bootstrap ใหม่จะโหลด job RunAtLoad
โดยตรง ดังนั้นการ recovery จากการอัปเดตจะไม่ `kickstart -k` Gateway ที่เพิ่ง
spawn ขึ้นมาทันที หาก Gateway ยังไม่ healthy คำสั่งจะ exit
ด้วย non-zero และพิมพ์ path ของ restart log พร้อมคำแนะนำ restart, reinstall และ
rollback package อย่างชัดเจน เมื่อใช้ `--no-restart`,
การแทนที่ package ยังคงรัน แต่บริการที่จัดการอยู่จะไม่ถูกหยุดหรือ
restart ดังนั้น Gateway ที่กำลังรันอาจยังใช้ code เก่าจนกว่าคุณจะ restart
ด้วยตนเอง

## โฟลว์ git checkout

### การเลือกช่องทาง

- `stable`: checkout tag ล่าสุดที่ไม่ใช่ beta จากนั้น build และ doctor
- `beta`: เลือก tag `-beta` ล่าสุดก่อน แต่ fallback เป็น tag stable ล่าสุดเมื่อ beta ไม่มีหรือเก่ากว่า
- `dev`: checkout `main` จากนั้น fetch และ rebase

### ขั้นตอนการอัปเดต

<Steps>
  <Step title="Verify clean worktree">
    ต้องไม่มีการเปลี่ยนแปลงที่ยังไม่ได้ commit
  </Step>
  <Step title="Switch channel">
    สลับไปยังช่องทางที่เลือก (tag หรือ branch)
  </Step>
  <Step title="Fetch upstream">
    เฉพาะ dev
  </Step>
  <Step title="Preflight build (dev only)">
    รัน TypeScript build ใน worktree ชั่วคราว หาก tip ล้มเหลว จะย้อนกลับไปสูงสุด 10 commits เพื่อหา commit ล่าสุดที่ build ได้ ตั้งค่า `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` เพื่อรัน lint ระหว่าง preflight นี้ด้วย; lint จะรันในโหมด serial ที่จำกัด เพราะ host ที่ผู้ใช้ใช้อัปเดตมักมีขนาดเล็กกว่า runner ของ CI
  </Step>
  <Step title="Rebase">
    rebase ไปยัง commit ที่เลือก (เฉพาะ dev)
  </Step>
  <Step title="Install dependencies">
    ใช้ package manager ของ repo สำหรับ checkout ที่ใช้ pnpm ตัว updater จะ bootstrap `pnpm` ตามต้องการ (ผ่าน `corepack` ก่อน จากนั้น fallback เป็น `npm install pnpm@10` ชั่วคราว) แทนการรัน `npm run build` ภายใน pnpm workspace
  </Step>
  <Step title="Build Control UI">
    build Gateway และ Control UI
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` รันเป็นการตรวจสอบ safe-update ขั้นสุดท้าย
  </Step>
  <Step title="Sync plugins">
    ซิงก์ Plugin ไปยังช่องทางที่ใช้งานอยู่ dev ใช้ Plugin ที่ bundled มา; stable และ beta ใช้ npm อัปเดตการติดตั้ง Plugin ที่ติดตามไว้
  </Step>
</Steps>

บนช่องทางการอัปเดต beta การติดตั้ง Plugin npm และ ClawHub ที่ติดตามไว้ซึ่งตาม
สาย default/latest จะลอง release `@beta` ของ Plugin ก่อน หาก Plugin ไม่มี
release beta, OpenClaw จะ fallback ไปยัง spec default/latest ที่บันทึกไว้ สำหรับ npm
Plugin, OpenClaw จะ fallback ด้วยเมื่อ package beta มีอยู่แต่ไม่ผ่าน
การตรวจสอบการติดตั้ง เวอร์ชัน exact และ tag ที่ระบุชัดเจนจะไม่ถูกเขียนใหม่

<Warning>
หากการอัปเดต Plugin npm ที่ pin เวอร์ชัน exact resolve ไปยัง artifact ที่มี integrity แตกต่างจากระเบียนการติดตั้งที่เก็บไว้, `openclaw update` จะ abort การอัปเดต artifact ของ Plugin นั้นแทนการติดตั้ง ติดตั้งใหม่หรืออัปเดต Plugin อย่างชัดเจนเฉพาะหลังจากตรวจสอบแล้วว่าคุณเชื่อถือ artifact ใหม่
</Warning>

<Note>
ความล้มเหลวของการซิงก์ Plugin หลังอัปเดตที่จำกัดอยู่กับ Plugin ที่จัดการอยู่จะถูกรายงานเป็น warning หลังจากการอัปเดต core สำเร็จ ผลลัพธ์ JSON จะคง `status: "ok"` ของการอัปเดตระดับบนสุดไว้ และรายงาน `postUpdate.plugins.status: "warning"` พร้อมคำแนะนำ `openclaw doctor --fix` และ `openclaw plugins inspect <id> --runtime --json` ข้อยกเว้นจาก updater หรือ sync ที่ไม่คาดคิดยังคงทำให้ผลการอัปเดตล้มเหลว แก้ข้อผิดพลาดการติดตั้งหรืออัปเดต Plugin แล้วรัน `openclaw doctor --fix` หรือ `openclaw update` อีกครั้ง

เมื่อ Gateway ที่อัปเดตแล้วเริ่มทำงาน การโหลด Plugin จะเป็นแบบ verify-only: startup จะไม่รัน package manager หรือเปลี่ยนแปลง dependency tree การ restart จาก `update.run` ของ package manager จะข้ามการเลื่อนเวลาแบบ idle และ cooldown การ restart ปกติหลังจาก package tree ถูกสลับแล้ว ดังนั้น process เก่าจะไม่สามารถ lazy-load chunks ที่ถูกลบออกไปต่อได้

หาก bootstrap ของ pnpm ยังล้มเหลว updater จะหยุดตั้งแต่ต้นพร้อม error เฉพาะ package manager แทนการลอง `npm run build` ภายใน checkout
</Note>

## shorthand `--update`

`openclaw --update` จะถูกเขียนใหม่เป็น `openclaw update` (มีประโยชน์สำหรับ shell และ launcher script)

## ที่เกี่ยวข้อง

- `openclaw doctor` (เสนอให้รัน update ก่อนบน git checkout)
- [ช่องทางการพัฒนา](/th/install/development-channels)
- [การอัปเดต](/th/install/updating)
- [เอกสารอ้างอิง CLI](/th/cli)
