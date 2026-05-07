---
read_when:
    - คุณต้องการอัปเดตสำเนาซอร์สที่เช็กเอาต์มาอย่างปลอดภัย
    - คุณกำลังดีบักเอาต์พุตหรือตัวเลือกของ `openclaw update`
    - คุณต้องเข้าใจพฤติกรรมแบบย่อของ `--update`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw update` (การอัปเดตซอร์สที่ค่อนข้างปลอดภัย + การรีสตาร์ต Gateway อัตโนมัติ)
title: อัปเดต
x-i18n:
    generated_at: "2026-05-07T13:15:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

อัปเดต OpenClaw อย่างปลอดภัยและสลับระหว่างแชนเนล stable/beta/dev

หากคุณติดตั้งผ่าน **npm/pnpm/bun** (การติดตั้งแบบ global ไม่มี metadata ของ git)
การอัปเดตจะเกิดขึ้นผ่านโฟลว์ package manager ใน [การอัปเดต](/th/install/updating)

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

- `--no-restart`: ข้ามการรีสตาร์ตบริการ Gateway หลังอัปเดตสำเร็จ การอัปเดตผ่าน package manager ที่รีสตาร์ต Gateway จะตรวจสอบว่าบริการที่รีสตาร์ตรายงานเวอร์ชันที่อัปเดตตามที่คาดไว้ก่อนคำสั่งจะสำเร็จ
- `--channel <stable|beta|dev>`: ตั้งค่าแชนเนลอัปเดต (git + npm; เก็บถาวรใน config)
- `--tag <dist-tag|version|spec>`: override เป้าหมายแพ็กเกจสำหรับการอัปเดตครั้งนี้เท่านั้น สำหรับการติดตั้งแบบแพ็กเกจ `main` จะ map ไปที่ `github:openclaw/openclaw#main`
- `--dry-run`: ดูตัวอย่างการดำเนินการอัปเดตที่วางแผนไว้ (แชนเนล/tag/เป้าหมาย/โฟลว์การรีสตาร์ต) โดยไม่เขียน config, ติดตั้ง, sync plugins หรือรีสตาร์ต
- `--json`: พิมพ์ JSON `UpdateRunResult` ที่อ่านได้โดยเครื่อง รวมถึง
  `postUpdate.plugins.warnings` เมื่อ plugins ที่จัดการอยู่เสียหายหรือโหลดไม่ได้และต้อง
  ซ่อมหลังจากการอัปเดต core สำเร็จ และ `postUpdate.plugins.integrityDrifts`
  เมื่อตรวจพบ drift ของ artifact ของ npm plugin ระหว่างการ sync plugin หลังอัปเดต
- `--timeout <seconds>`: timeout ต่อขั้นตอน (ค่าเริ่มต้นคือ 1800s)
- `--yes`: ข้าม prompt ยืนยัน (เช่น การยืนยัน downgrade)

`openclaw update` ไม่มี flag `--verbose` ใช้ `--dry-run` เพื่อดูตัวอย่าง
การดำเนินการแชนเนล/tag/install/restart ที่วางแผนไว้, `--json` สำหรับผลลัพธ์
ที่อ่านได้โดยเครื่อง และ `openclaw update status --json` เมื่อคุณต้องการเพียง
รายละเอียดแชนเนลและความพร้อมใช้งาน หากคุณกำลัง debug log ของ Gateway รอบการอัปเดต
ความละเอียดของ console และระดับ file log จะแยกกัน: Gateway `--verbose` มีผลต่อ
output ของ terminal/WebSocket ส่วน file logs ต้องใช้ `logging.level: "debug"` หรือ
`"trace"` ใน config ดู [การบันทึก log ของ Gateway](/th/gateway/logging)

<Note>
ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) การรัน `openclaw update` ที่เปลี่ยนแปลงระบบจะถูกปิดใช้งาน ให้อัปเดต source ของ Nix หรือ flake input สำหรับการติดตั้งนี้แทน; สำหรับ nix-openclaw ให้ใช้ [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first `openclaw update status` และ `openclaw update --dry-run` ยังคงเป็นแบบอ่านอย่างเดียว
</Note>

<Warning>
การ downgrade ต้องมีการยืนยัน เพราะเวอร์ชันเก่าอาจทำให้ configuration พังได้
</Warning>

## `update status`

แสดงแชนเนลอัปเดตที่ใช้งานอยู่ + git tag/branch/SHA (สำหรับ source checkouts) พร้อมความพร้อมใช้งานของอัปเดต

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

ตัวเลือก:

- `--json`: พิมพ์ JSON สถานะที่อ่านได้โดยเครื่อง
- `--timeout <seconds>`: timeout สำหรับการตรวจสอบ (ค่าเริ่มต้นคือ 3s)

## `update wizard`

โฟลว์แบบ interactive เพื่อเลือกแชนเนลอัปเดตและยืนยันว่าจะรีสตาร์ต Gateway
หลังอัปเดตหรือไม่ (ค่าเริ่มต้นคือรีสตาร์ต) หากคุณเลือก `dev` โดยไม่มี git checkout ระบบ
จะเสนอให้สร้าง checkout ให้

ตัวเลือก:

- `--timeout <seconds>`: timeout สำหรับแต่ละขั้นตอนอัปเดต (ค่าเริ่มต้น `1800`)

## สิ่งที่คำสั่งทำ

เมื่อคุณสลับแชนเนลอย่างชัดเจน (`--channel ...`) OpenClaw จะรักษาให้
วิธีติดตั้งสอดคล้องกันด้วย:

- `dev` → ตรวจให้แน่ใจว่ามี git checkout (ค่าเริ่มต้น: `~/openclaw`, override ด้วย `OPENCLAW_GIT_DIR`),
  อัปเดต checkout นั้น และติดตั้ง CLI แบบ global จาก checkout นั้น
- `stable` → ติดตั้งจาก npm โดยใช้ `latest`
- `beta` → เลือกใช้ npm dist-tag `beta` ก่อน แต่ fallback ไปเป็น `latest` เมื่อ beta
  ไม่มีหรือเก่ากว่า release stable ปัจจุบัน

ตัวอัปเดตอัตโนมัติของ core Gateway (เมื่อเปิดใช้งานผ่าน config) จะเรียกเส้นทางการอัปเดต CLI
นอก handler คำขอ Gateway ที่กำลังทำงานอยู่ การอัปเดต package manager ของ control-plane `update.run`
จะบังคับ restart การอัปเดตแบบไม่ defer และไม่มี cooldown หลังจากสลับแพ็กเกจ
เพราะ process Gateway เดิมอาจยังมี chunks ในหน่วยความจำที่ชี้ไปยัง
ไฟล์ที่ถูกลบโดยแพ็กเกจใหม่

สำหรับการติดตั้งผ่าน package manager, `openclaw update` จะ resolve เวอร์ชันแพ็กเกจ
เป้าหมายก่อนเรียก package manager การติดตั้ง npm แบบ global ใช้การติดตั้งแบบ staged:
OpenClaw ติดตั้งแพ็กเกจใหม่ลงใน npm prefix ชั่วคราว, ตรวจสอบ
inventory ของ `dist` ที่แพ็กเกจไว้ที่นั่น แล้วสลับ package tree ที่สะอาดนั้นเข้าไปใน
global prefix จริง หากการตรวจสอบล้มเหลว post-update doctor, plugin sync และ
งาน restart จะไม่รันจาก tree ที่น่าสงสัย แม้เวอร์ชันที่ติดตั้งอยู่
จะตรงกับเป้าหมายแล้ว คำสั่งก็จะ refresh การติดตั้งแพ็กเกจ global
แล้วรัน plugin sync, refresh completion ของ core command และงาน restart สิ่งนี้
ช่วยให้ sidecars ที่แพ็กเกจไว้และระเบียน plugin ที่แชนเนลเป็นเจ้าของสอดคล้องกับ
build ของ OpenClaw ที่ติดตั้งอยู่ โดยปล่อยให้การ rebuild completion แบบเต็มของ plugin command
เป็นการรัน `openclaw completion --write-state` อย่างชัดเจน

เมื่อมีบริการ Gateway แบบ managed ในเครื่องติดตั้งอยู่และเปิดใช้ restart
การอัปเดตผ่าน package manager จะหยุดบริการที่กำลังรันก่อนแทนที่ package
tree จากนั้น refresh metadata ของบริการจาก install ที่อัปเดตแล้ว, restart
บริการ และตรวจสอบว่า Gateway ที่รีสตาร์ตรายงานเวอร์ชันที่คาดไว้ก่อน
รายงานว่าสำเร็จ บน macOS การตรวจหลังอัปเดตยังตรวจสอบว่า LaunchAgent
ถูกโหลด/กำลังรันสำหรับโปรไฟล์ที่ใช้งานอยู่ และ port loopback ที่กำหนดค่าไว้
สุขภาพดี หากติดตั้ง plist แล้วแต่ launchd ไม่ได้ supervise อยู่ OpenClaw
จะ re-bootstrap LaunchAgent โดยอัตโนมัติ แล้วรัน
การตรวจความพร้อมของ health/version/channel อีกครั้ง bootstrap ใหม่จะโหลด job RunAtLoad
โดยตรง ดังนั้นการกู้คืนอัปเดตจะไม่ `kickstart -k` Gateway ที่เพิ่ง
spawn ทันที หาก Gateway ยังไม่ healthy คำสั่งจะ exit
ด้วยค่า non-zero และพิมพ์ path ของ restart log พร้อมคำสั่ง restart, reinstall และ
rollback package อย่างชัดเจน เมื่อใช้ `--no-restart`
การแทนที่แพ็กเกจยังคงรัน แต่บริการ managed จะไม่ถูกหยุดหรือ
รีสตาร์ต ดังนั้น Gateway ที่กำลังรันอาจยังใช้โค้ดเก่าจนกว่าคุณจะรีสตาร์ต
เอง

## โฟลว์ git checkout

### การเลือกแชนเนล

- `stable`: checkout tag ล่าสุดที่ไม่ใช่ beta จากนั้น build และ doctor
- `beta`: เลือก tag `-beta` ล่าสุดก่อน แต่ fallback ไปยัง tag stable ล่าสุดเมื่อ beta ไม่มีหรือเก่ากว่า
- `dev`: checkout `main` จากนั้น fetch และ rebase

### ขั้นตอนการอัปเดต

<Steps>
  <Step title="ตรวจสอบ worktree ที่สะอาด">
    ต้องไม่มีการเปลี่ยนแปลงที่ยังไม่ได้ commit
  </Step>
  <Step title="สลับแชนเนล">
    สลับไปยังแชนเนลที่เลือก (tag หรือ branch)
  </Step>
  <Step title="Fetch upstream">
    เฉพาะ Dev
  </Step>
  <Step title="Preflight build (เฉพาะ dev)">
    รัน TypeScript build ใน temp worktree หาก tip ล้มเหลว จะถอยกลับสูงสุด 10 commits เพื่อหา commit ใหม่ล่าสุดที่ build ได้ ตั้งค่า `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` เพื่อรัน lint ระหว่าง preflight นี้ด้วย; lint จะรันในโหมด serial แบบจำกัด เพราะ host สำหรับอัปเดตของผู้ใช้มักเล็กกว่า CI runners
  </Step>
  <Step title="Rebase">
    Rebase ไปยัง commit ที่เลือก (เฉพาะ dev)
  </Step>
  <Step title="ติดตั้ง dependencies">
    ใช้ package manager ของ repo สำหรับ pnpm checkouts ตัวอัปเดตจะ bootstrap `pnpm` เมื่อจำเป็น (ผ่าน `corepack` ก่อน แล้วจึงใช้ fallback ชั่วคราว `npm install pnpm@10`) แทนการรัน `npm run build` ภายใน pnpm workspace
  </Step>
  <Step title="Build Control UI">
    Build gateway และ Control UI
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` รันเป็นการตรวจ safe-update ขั้นสุดท้าย
  </Step>
  <Step title="Sync plugins">
    Sync plugins ไปยังแชนเนลที่ใช้งานอยู่ Dev ใช้ bundled plugins; stable และ beta ใช้ npm อัปเดตการติดตั้ง plugin ที่ติดตามไว้
  </Step>
</Steps>

บนแชนเนลอัปเดต beta การติดตั้ง npm และ ClawHub plugin ที่ติดตามไว้ซึ่งตาม
บรรทัด default/latest จะลอง release ของ plugin `@beta` ก่อน หาก plugin ไม่มี
release beta OpenClaw จะ fallback ไปยัง spec default/latest ที่บันทึกไว้ สำหรับ npm
plugins, OpenClaw จะ fallback ด้วยเมื่อมีแพ็กเกจ beta แต่ติดตั้งไม่ผ่าน
validation เวอร์ชัน exact และ tags ที่ระบุชัดเจนจะไม่ถูกเขียนใหม่

<Warning>
หากการอัปเดต npm plugin ที่ pin exact resolve ไปยัง artifact ที่ integrity แตกต่างจากระเบียนการติดตั้งที่เก็บไว้ `openclaw update` จะ abort การอัปเดต artifact ของ plugin นั้นแทนการติดตั้ง ให้ติดตั้งใหม่หรืออัปเดต plugin อย่างชัดเจนก็ต่อเมื่อคุณตรวจสอบแล้วว่า trust artifact ใหม่
</Warning>

<Note>
ความล้มเหลวของ plugin sync หลังอัปเดตที่จำกัดขอบเขตอยู่กับ managed plugin จะถูกรายงานเป็น warning หลังจากการอัปเดต core สำเร็จ ผลลัพธ์ JSON จะคง `status: "ok"` ระดับบนสุดของการอัปเดตไว้ และรายงาน `postUpdate.plugins.status: "warning"` พร้อมคำแนะนำ `openclaw doctor --fix` และ `openclaw plugins inspect <id> --runtime --json` ข้อยกเว้นของตัวอัปเดตหรือ sync ที่ไม่คาดคิดจะยังทำให้ผลลัพธ์การอัปเดตล้มเหลว แก้ข้อผิดพลาดของการติดตั้งหรืออัปเดต plugin แล้วรัน `openclaw doctor --fix` หรือ `openclaw update` อีกครั้ง

เมื่อ Gateway ที่อัปเดตแล้วเริ่มทำงาน การโหลด plugin เป็นแบบ verify-only: startup จะไม่รัน package managers หรือเปลี่ยนแปลง dependency trees การ restart จาก `update.run` ของ package manager จะข้าม idle deferral และ restart cooldown ปกติหลังจาก package tree ถูกสลับแล้ว เพื่อให้ process เก่าไม่สามารถ lazy-load chunks ที่ถูกลบออกไปต่อได้

หาก bootstrap ของ pnpm ยังคงล้มเหลว ตัวอัปเดตจะหยุดแต่เนิ่น ๆ พร้อมข้อผิดพลาดเฉพาะ package manager แทนการลอง `npm run build` ภายใน checkout
</Note>

## ตัวย่อ `--update`

`openclaw --update` จะเขียนใหม่เป็น `openclaw update` (มีประโยชน์สำหรับ shells และ launcher scripts)

## ที่เกี่ยวข้อง

- `openclaw doctor` (เสนอให้รัน update ก่อนบน git checkouts)
- [แชนเนลสำหรับการพัฒนา](/th/install/development-channels)
- [การอัปเดต](/th/install/updating)
- [ข้อมูลอ้างอิง CLI](/th/cli)
