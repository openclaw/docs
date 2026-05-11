---
read_when:
    - คุณต้องการอัปเดตสำเนาซอร์สโค้ดที่เช็กเอาต์มาอย่างปลอดภัย
    - คุณกำลังดีบักเอาต์พุตหรือตัวเลือกของ `openclaw update`
    - คุณต้องเข้าใจพฤติกรรมแบบย่อของ `--update`
summary: อ้างอิง CLI สำหรับ `openclaw update` (การอัปเดตซอร์สแบบค่อนข้างปลอดภัย + การรีสตาร์ท Gateway อัตโนมัติ)
title: อัปเดต
x-i18n:
    generated_at: "2026-05-11T20:27:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: cefe31181412d398f205a51429f6f5c20e86dfa96bd3d78333cefeb8ab6873b0
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

อัปเดต OpenClaw อย่างปลอดภัย และสลับระหว่างช่องทาง stable/beta/dev

หากคุณติดตั้งผ่าน **npm/pnpm/bun** (ติดตั้งแบบ global ไม่มี metadata ของ git)
การอัปเดตจะเกิดขึ้นผ่านขั้นตอนของ package manager ใน [การอัปเดต](/th/install/updating)

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

- `--no-restart`: ข้ามการรีสตาร์ตบริการ Gateway หลังจากอัปเดตสำเร็จ การอัปเดตผ่าน package manager ที่รีสตาร์ต Gateway จะตรวจสอบว่าบริการที่รีสตาร์ตรายงานเวอร์ชันที่อัปเดตตามที่คาดไว้ก่อนที่คำสั่งจะสำเร็จ
- `--channel <stable|beta|dev>`: ตั้งค่าช่องทางอัปเดต (git + npm; บันทึกไว้ใน config)
- `--tag <dist-tag|version|spec>`: แทนที่เป้าหมาย package สำหรับการอัปเดตครั้งนี้เท่านั้น สำหรับการติดตั้งแบบ package, `main` จะแมปไปยัง `github:openclaw/openclaw#main`
- `--dry-run`: แสดงตัวอย่างการดำเนินการอัปเดตที่วางแผนไว้ (ช่องทาง/tag/เป้าหมาย/ขั้นตอนการรีสตาร์ต) โดยไม่เขียน config, ติดตั้ง, ซิงค์ปลั๊กอิน หรือรีสตาร์ต
- `--json`: พิมพ์ JSON `UpdateRunResult` ที่เครื่องอ่านได้ รวมถึง
  `postUpdate.plugins.warnings` เมื่อปลั๊กอินที่จัดการมีความเสียหายหรือโหลดไม่ได้และต้อง
  ซ่อมแซมหลังจากการอัปเดต core สำเร็จแล้ว รายละเอียด fallback ของปลั๊กอินช่องทาง beta
  เมื่อปลั๊กอินไม่มี release แบบ beta และ `postUpdate.plugins.integrityDrifts`
  เมื่อตรวจพบ drift ของ artifact ปลั๊กอิน npm ระหว่างการซิงค์ปลั๊กอินหลังอัปเดต
- `--timeout <seconds>`: timeout ต่อขั้นตอน (ค่าเริ่มต้นคือ 1800s)
- `--yes`: ข้ามพรอมต์ยืนยัน (เช่น การยืนยัน downgrade)

`openclaw update` ไม่มีแฟล็ก `--verbose` ใช้ `--dry-run` เพื่อแสดงตัวอย่าง
การดำเนินการช่องทาง/tag/install/restart ที่วางแผนไว้, `--json` สำหรับผลลัพธ์
ที่เครื่องอ่านได้ และ `openclaw update status --json` เมื่อคุณต้องการเพียงรายละเอียด
ช่องทางและความพร้อมใช้งาน หากคุณกำลังดีบัก log ของ Gateway ระหว่างการอัปเดต
ความละเอียดของ console และระดับ log ของไฟล์จะแยกกัน: Gateway `--verbose` มีผลกับ
เอาต์พุต terminal/WebSocket ขณะที่ log ไฟล์ต้องใช้ `logging.level: "debug"` หรือ
`"trace"` ใน config ดู [การบันทึก log ของ Gateway](/th/gateway/logging)

<Note>
ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) การรัน `openclaw update` ที่เปลี่ยนแปลงระบบจะถูกปิดใช้งาน ให้อัปเดตแหล่งที่มา Nix หรือ flake input สำหรับการติดตั้งนี้แทน; สำหรับ nix-openclaw ให้ใช้ [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first `openclaw update status` และ `openclaw update --dry-run` ยังคงเป็นแบบอ่านอย่างเดียว
</Note>

<Warning>
การ downgrade ต้องมีการยืนยัน เพราะเวอร์ชันเก่าอาจทำให้การกำหนดค่าเสียหายได้
</Warning>

## `update status`

แสดงช่องทางอัปเดตที่ใช้งานอยู่ + git tag/branch/SHA (สำหรับ source checkout) รวมถึงความพร้อมใช้งานของอัปเดต

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

ตัวเลือก:

- `--json`: พิมพ์ JSON สถานะที่เครื่องอ่านได้
- `--timeout <seconds>`: timeout สำหรับการตรวจสอบ (ค่าเริ่มต้นคือ 3s)

## `update wizard`

ขั้นตอนแบบโต้ตอบเพื่อเลือกช่องทางอัปเดตและยืนยันว่าจะรีสตาร์ต Gateway
หลังอัปเดตหรือไม่ (ค่าเริ่มต้นคือรีสตาร์ต) หากคุณเลือก `dev` โดยไม่มี git checkout ระบบจะ
เสนอให้สร้างให้

ตัวเลือก:

- `--timeout <seconds>`: timeout สำหรับแต่ละขั้นตอนอัปเดต (ค่าเริ่มต้น `1800`)

## สิ่งที่คำสั่งนี้ทำ

เมื่อคุณสลับช่องทางอย่างชัดเจน (`--channel ...`) OpenClaw จะรักษา
วิธีติดตั้งให้สอดคล้องกันด้วย:

- `dev` → ทำให้มี git checkout (ค่าเริ่มต้น: `~/openclaw`, แทนที่ด้วย `OPENCLAW_GIT_DIR`),
  อัปเดต checkout นั้น และติดตั้ง CLI แบบ global จาก checkout นั้น
- `stable` → ติดตั้งจาก npm โดยใช้ `latest`
- `beta` → เลือกใช้ npm dist-tag `beta` ก่อน แต่ fallback ไปที่ `latest` เมื่อ beta
  ไม่มีอยู่หรือเก่ากว่า release stable ปัจจุบัน

ตัวอัปเดตอัตโนมัติของ core Gateway (เมื่อเปิดใช้ผ่าน config) จะเรียกเส้นทางอัปเดต CLI
นอก live Gateway request handler การอัปเดตผ่าน package manager ของ control-plane `update.run`
จะบังคับให้รีสตาร์ตการอัปเดตแบบไม่ defer และไม่มี cooldown หลังจากสลับ package แล้ว
เพราะ process Gateway เก่าอาจยังมี chunk ในหน่วยความจำที่ชี้ไปยัง
ไฟล์ที่ถูกลบโดย package ใหม่

สำหรับการติดตั้งผ่าน package manager, `openclaw update` จะ resolve เวอร์ชัน package
เป้าหมายก่อนเรียกใช้ package manager การติดตั้ง npm global ใช้การติดตั้งแบบ staged:
OpenClaw ติดตั้ง package ใหม่ลงใน npm prefix ชั่วคราว ตรวจสอบ
inventory `dist` ที่บรรจุอยู่ในนั้น แล้วสลับ package tree ที่สะอาดนั้นเข้าไปใน
global prefix จริง หากการตรวจสอบล้มเหลว งาน doctor หลังอัปเดต การซิงค์ปลั๊กอิน และ
การรีสตาร์ตจะไม่รันจาก tree ที่น่าสงสัยนั้น แม้เมื่อเวอร์ชันที่ติดตั้ง
ตรงกับเป้าหมายอยู่แล้ว คำสั่งจะ refresh การติดตั้ง package global
แล้วรันการซิงค์ปลั๊กอิน, refresh การเติมคำสั่ง core และงานรีสตาร์ต วิธีนี้
ช่วยให้ sidecar ที่บรรจุมาใน package และ record ปลั๊กอินที่ช่องทางเป็นเจ้าของสอดคล้องกับ
build ของ OpenClaw ที่ติดตั้งอยู่ ขณะปล่อยให้การ rebuild completion ของคำสั่งปลั๊กอินแบบเต็ม
เป็นหน้าที่ของการรัน `openclaw completion --write-state` อย่างชัดเจน

เมื่อมีการติดตั้งบริการ Gateway ที่จัดการแบบ local และเปิดใช้การรีสตาร์ต
การอัปเดตผ่าน package manager จะหยุดบริการที่กำลังรันก่อนแทนที่ package
tree จากนั้น refresh metadata ของบริการจากการติดตั้งที่อัปเดตแล้ว รีสตาร์ต
บริการ และตรวจสอบว่า Gateway ที่รีสตาร์ตรายงานเวอร์ชันตามที่คาดไว้ก่อน
รายงานว่าสำเร็จ บน macOS การตรวจสอบหลังอัปเดตจะตรวจสอบด้วยว่า LaunchAgent
ถูกโหลด/กำลังรันสำหรับ profile ที่ใช้งานอยู่ และพอร์ต loopback ที่กำหนดค่าไว้
healthy หาก plist ถูกติดตั้งแล้วแต่ launchd ไม่ได้ supervise อยู่ OpenClaw
จะ re-bootstrap LaunchAgent โดยอัตโนมัติ แล้วรันการตรวจสอบ
health/version/channel readiness อีกครั้ง bootstrap ใหม่จะโหลด job RunAtLoad
โดยตรง ดังนั้นการกู้คืนจากการอัปเดตจะไม่ `kickstart -k` Gateway ที่เพิ่ง
spawn ทันที หาก Gateway ยังไม่ healthy คำสั่งจะออกด้วยค่าที่ไม่ใช่ศูนย์
และพิมพ์ path ของ log การรีสตาร์ต พร้อมคำแนะนำการรีสตาร์ต ติดตั้งใหม่ และ
rollback package อย่างชัดเจน เมื่อใช้ `--no-restart`
การแทนที่ package ยังทำงาน แต่บริการที่จัดการจะไม่ถูกหยุดหรือ
รีสตาร์ต ดังนั้น Gateway ที่กำลังรันอาจยังใช้โค้ดเก่าจนกว่าคุณจะรีสตาร์ตเอง

## ขั้นตอน git checkout

### การเลือกช่องทาง

- `stable`: checkout tag ล่าสุดที่ไม่ใช่ beta จากนั้น build และ doctor
- `beta`: เลือก tag `-beta` ล่าสุดก่อน แต่ fallback ไปที่ tag stable ล่าสุดเมื่อ beta ไม่มีอยู่หรือเก่ากว่า
- `dev`: checkout `main` จากนั้น fetch และ rebase

### ขั้นตอนอัปเดต

<Steps>
  <Step title="ตรวจสอบ worktree ที่สะอาด">
    ต้องไม่มีการเปลี่ยนแปลงที่ยังไม่ได้ commit
  </Step>
  <Step title="สลับช่องทาง">
    สลับไปยังช่องทางที่เลือก (tag หรือ branch)
  </Step>
  <Step title="Fetch upstream">
    เฉพาะ Dev
  </Step>
  <Step title="Preflight build (เฉพาะ dev)">
    รัน TypeScript build ใน worktree ชั่วคราว หาก tip ล้มเหลว จะย้อนกลับได้สูงสุด 10 commit เพื่อหา commit ใหม่ที่สุดที่ build ได้ ตั้งค่า `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` เพื่อรัน lint ระหว่าง preflight นี้ด้วย; lint จะรันในโหมด serial ที่จำกัด เพราะเครื่องของผู้ใช้ที่รันการอัปเดตมักเล็กกว่า CI runner
  </Step>
  <Step title="Rebase">
    Rebase ไปยัง commit ที่เลือก (เฉพาะ dev)
  </Step>
  <Step title="ติดตั้ง dependency">
    ใช้ package manager ของ repo สำหรับ pnpm checkout ตัวอัปเดตจะ bootstrap `pnpm` เมื่อจำเป็น (ผ่าน `corepack` ก่อน แล้วจึง fallback เป็น `npm install pnpm@11` ชั่วคราว) แทนการรัน `npm run build` ภายใน pnpm workspace
  </Step>
  <Step title="Build Control UI">
    Build gateway และ Control UI
  </Step>
  <Step title="รัน doctor">
    `openclaw doctor` รันเป็นการตรวจสอบ safe-update ขั้นสุดท้าย
  </Step>
  <Step title="ซิงค์ปลั๊กอิน">
    ซิงค์ปลั๊กอินไปยังช่องทางที่ใช้งานอยู่ Dev ใช้ปลั๊กอินที่ bundled; stable และ beta ใช้ npm อัปเดตการติดตั้งปลั๊กอินที่ติดตามไว้
  </Step>
</Steps>

บนช่องทางอัปเดต beta การติดตั้งปลั๊กอิน npm และ ClawHub ที่ติดตามไว้ซึ่งตาม
สาย default/latest จะลอง release ปลั๊กอิน `@beta` ก่อน หากปลั๊กอินไม่มี
release beta, OpenClaw จะ fallback ไปยัง spec default/latest ที่บันทึกไว้ และรายงาน
เป็น warning สำหรับปลั๊กอิน npm, OpenClaw จะ fallback ด้วยเมื่อ package beta
มีอยู่แต่ไม่ผ่านการตรวจสอบการติดตั้ง warning fallback ของปลั๊กอินเหล่านี้จะ
ไม่ทำให้การอัปเดต core ล้มเหลว เวอร์ชัน exact และ tag ที่ระบุชัดเจนจะไม่ถูก
เขียนทับ

<Warning>
หากการอัปเดตปลั๊กอิน npm ที่ปักหมุดเป็น exact resolve ไปยัง artifact ที่ integrity แตกต่างจาก record การติดตั้งที่จัดเก็บไว้ `openclaw update` จะ abort การอัปเดต artifact ของปลั๊กอินนั้นแทนการติดตั้ง ให้ติดตั้งใหม่หรืออัปเดตปลั๊กอินอย่างชัดเจนหลังจากตรวจสอบแล้วว่าคุณไว้วางใจ artifact ใหม่
</Warning>

<Note>
ความล้มเหลวในการซิงค์ปลั๊กอินหลังอัปเดตที่จำกัดอยู่กับปลั๊กอินที่จัดการจะถูกรายงานเป็น warning หลังจากการอัปเดต core สำเร็จ ผลลัพธ์ JSON จะคง `status: "ok"` ระดับบนสุดไว้ และรายงาน `postUpdate.plugins.status: "warning"` พร้อมคำแนะนำ `openclaw doctor --fix` และ `openclaw plugins inspect <id> --runtime --json` ข้อยกเว้นของตัวอัปเดตหรือการซิงค์ที่ไม่คาดคิดยังคงทำให้ผลลัพธ์การอัปเดตล้มเหลว แก้ข้อผิดพลาดการติดตั้งหรืออัปเดตปลั๊กอิน แล้วรัน `openclaw doctor --fix` หรือ `openclaw update` อีกครั้ง

เมื่อ Gateway ที่อัปเดตเริ่มทำงาน การโหลดปลั๊กอินเป็นแบบ verify-only: startup จะไม่รัน package manager หรือเปลี่ยนแปลง dependency tree การรีสตาร์ต `update.run` ผ่าน package manager จะ bypass การ defer เมื่อ idle และ cooldown การรีสตาร์ตตามปกติหลังจากสลับ package tree แล้ว ดังนั้น process เก่าจะไม่สามารถ lazy-load chunk ที่ถูกลบไปแล้วต่อไปได้

หาก pnpm bootstrap ยังคงล้มเหลว ตัวอัปเดตจะหยุดตั้งแต่ต้นพร้อมข้อผิดพลาดเฉพาะ package manager แทนการลอง `npm run build` ภายใน checkout
</Note>

## ตัวย่อ `--update`

`openclaw --update` เขียนใหม่เป็น `openclaw update` (มีประโยชน์สำหรับ shell และ launcher script)

## ที่เกี่ยวข้อง

- `openclaw doctor` (เสนอให้รัน update ก่อนบน git checkout)
- [ช่องทางการพัฒนา](/th/install/development-channels)
- [การอัปเดต](/th/install/updating)
- [อ้างอิง CLI](/th/cli)
