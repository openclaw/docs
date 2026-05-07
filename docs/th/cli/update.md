---
read_when:
    - คุณต้องการอัปเดตสำเนาซอร์สที่เช็กเอาต์ไว้อย่างปลอดภัย
    - คุณกำลังดีบักเอาต์พุตหรือตัวเลือกของ `openclaw update`
    - คุณต้องเข้าใจลักษณะการทำงานแบบย่อของ `--update`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw update` (การอัปเดตซอร์สที่ค่อนข้างปลอดภัย + การรีสตาร์ต Gateway อัตโนมัติ)
title: อัปเดต
x-i18n:
    generated_at: "2026-05-07T01:51:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33c1474c6525257b79e947dfa4ce750cadd4e2e440775f5fa3058dcea1a17809
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

อัปเดต OpenClaw อย่างปลอดภัยและสลับระหว่างช่องทาง stable/beta/dev

หากคุณติดตั้งผ่าน **npm/pnpm/bun** (ติดตั้งแบบ global ไม่มีข้อมูลเมตาของ git)
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

- `--no-restart`: ข้ามการรีสตาร์ตบริการ Gateway หลังจากอัปเดตสำเร็จ การอัปเดตผ่านตัวจัดการแพ็กเกจที่รีสตาร์ต Gateway จะตรวจสอบว่าบริการที่รีสตาร์ตรายงานเวอร์ชันที่อัปเดตตามที่คาดไว้ก่อนที่คำสั่งจะสำเร็จ
- `--channel <stable|beta|dev>`: ตั้งค่าช่องทางอัปเดต (git + npm; บันทึกคงไว้ใน config)
- `--tag <dist-tag|version|spec>`: เขียนทับเป้าหมายแพ็กเกจสำหรับการอัปเดตครั้งนี้เท่านั้น สำหรับการติดตั้งแพ็กเกจ `main` จะจับคู่ไปที่ `github:openclaw/openclaw#main`
- `--dry-run`: ดูตัวอย่างการดำเนินการอัปเดตที่วางแผนไว้ (โฟลว์ channel/tag/target/restart) โดยไม่เขียน config, ติดตั้ง, ซิงก์ Plugin หรือรีสตาร์ต
- `--json`: พิมพ์ JSON `UpdateRunResult` ที่เครื่องอ่านได้ รวมถึง
  `postUpdate.plugins.warnings` เมื่อ Plugin ที่จัดการอยู่เสียหายหรือโหลดไม่ได้และต้อง
  ซ่อมแซมหลังจากการอัปเดต core สำเร็จ และ `postUpdate.plugins.integrityDrifts`
  เมื่อตรวจพบความคลาดเคลื่อนของอาร์ติแฟกต์ Plugin npm ระหว่างการซิงก์ Plugin หลังอัปเดต
- `--timeout <seconds>`: เวลาหมดอายุต่อขั้นตอน (ค่าเริ่มต้นคือ 1800s)
- `--yes`: ข้ามพรอมป์ยืนยัน (เช่น การยืนยันการดาวน์เกรด)

`openclaw update` ไม่มีแฟล็ก `--verbose` ใช้ `--dry-run` เพื่อดูตัวอย่าง
การดำเนินการ channel/tag/install/restart ที่วางแผนไว้, `--json` สำหรับผลลัพธ์
ที่เครื่องอ่านได้ และ `openclaw update status --json` เมื่อคุณต้องการเพียง
รายละเอียดช่องทางและความพร้อมใช้งาน หากคุณกำลังดีบักบันทึก Gateway รอบการอัปเดต
ความละเอียดของคอนโซลและระดับบันทึกไฟล์จะแยกกัน: Gateway `--verbose` มีผลต่อ
เอาต์พุตเทอร์มินัล/WebSocket ขณะที่บันทึกไฟล์ต้องใช้ `logging.level: "debug"` หรือ
`"trace"` ใน config ดู [การบันทึก Gateway](/th/gateway/logging)

<Note>
ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) การรัน `openclaw update` ที่เปลี่ยนแปลงระบบจะถูกปิดใช้งาน ให้อัปเดตซอร์ส Nix หรือ flake input สำหรับการติดตั้งนี้แทน; สำหรับ nix-openclaw ให้ใช้ [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first `openclaw update status` และ `openclaw update --dry-run` ยังคงเป็นแบบอ่านอย่างเดียว
</Note>

<Warning>
การดาวน์เกรดต้องมีการยืนยันเพราะเวอร์ชันเก่าอาจทำให้การกำหนดค่าเสียหายได้
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
- `--timeout <seconds>`: เวลาหมดอายุสำหรับการตรวจสอบ (ค่าเริ่มต้นคือ 3s)

## `update wizard`

โฟลว์แบบโต้ตอบเพื่อเลือกช่องทางอัปเดตและยืนยันว่าจะรีสตาร์ต Gateway
หลังอัปเดตหรือไม่ (ค่าเริ่มต้นคือรีสตาร์ต) หากคุณเลือก `dev` โดยไม่มี git checkout ระบบจะ
เสนอให้สร้างขึ้น

ตัวเลือก:

- `--timeout <seconds>`: เวลาหมดอายุสำหรับแต่ละขั้นตอนการอัปเดต (ค่าเริ่มต้น `1800`)

## สิ่งที่คำสั่งทำ

เมื่อคุณสลับช่องทางอย่างชัดเจน (`--channel ...`) OpenClaw จะรักษา
วิธีการติดตั้งให้สอดคล้องด้วย:

- `dev` → ตรวจให้แน่ใจว่ามี git checkout (ค่าเริ่มต้น: `~/openclaw`, เขียนทับด้วย `OPENCLAW_GIT_DIR`),
  อัปเดต checkout นั้น และติดตั้ง CLI แบบ global จาก checkout นั้น
- `stable` → ติดตั้งจาก npm โดยใช้ `latest`
- `beta` → เลือกใช้ npm dist-tag `beta` ก่อน แต่จะถอยกลับไปใช้ `latest` เมื่อ beta
  ไม่มีหรือเก่ากว่า stable release ปัจจุบัน

OpenClaw ยังไม่มีช่องทางรองรับ LTS หรือรายเดือน เรากำลังพัฒนาไปสู่
สายการรองรับรายเดือน แต่ตอนนี้ `--channel` รับเฉพาะ
`stable`, `beta` และ `dev` ใช้ `--tag <version-or-dist-tag>` สำหรับเป้าหมาย
แบบครั้งเดียวเมื่อคุณต้องการอาร์ติแฟกต์แพ็กเกจที่เฉพาะเจาะจง

ตัวอัปเดตอัตโนมัติของ core Gateway (เมื่อเปิดใช้งานผ่าน config) จะเปิดเส้นทางอัปเดต CLI
นอกตัวจัดการคำขอ Gateway ที่กำลังทำงาน การอัปเดตผ่านตัวจัดการแพ็กเกจของ control-plane `update.run`
จะบังคับให้รีสตาร์ตอัปเดตแบบไม่เลื่อนและไม่มี cooldown หลังจากสลับแพ็กเกจ
เพราะกระบวนการ Gateway เก่าอาจยังมีชิ้นส่วนในหน่วยความจำที่ชี้ไปยัง
ไฟล์ที่ถูกแพ็กเกจใหม่ลบออก

สำหรับการติดตั้งผ่านตัวจัดการแพ็กเกจ `openclaw update` จะ resolve เวอร์ชันแพ็กเกจ
เป้าหมายก่อนเรียกตัวจัดการแพ็กเกจ การติดตั้ง npm แบบ global ใช้การติดตั้งแบบ staged:
OpenClaw ติดตั้งแพ็กเกจใหม่ลงใน npm prefix ชั่วคราว ตรวจสอบ
รายการ `dist` ที่บรรจุอยู่ในนั้น แล้วสลับต้นไม้แพ็กเกจที่สะอาดนั้นเข้าไปยัง
global prefix จริง หากการตรวจสอบล้มเหลว doctor หลังอัปเดต, การซิงก์ Plugin และ
งานรีสตาร์ตจะไม่รันจากต้นไม้ที่น่าสงสัยนั้น แม้เมื่อเวอร์ชันที่ติดตั้งแล้ว
ตรงกับเป้าหมายอยู่แล้ว คำสั่งจะรีเฟรชการติดตั้งแพ็กเกจ global
จากนั้นรันการซิงก์ Plugin, การรีเฟรช core-command completion และงานรีสตาร์ต การทำเช่นนี้
ช่วยให้ sidecar ที่บรรจุมาและเรคคอร์ด Plugin ที่ช่องทางเป็นเจ้าของสอดคล้องกับ
บิลด์ OpenClaw ที่ติดตั้งอยู่ โดยปล่อยให้การสร้าง plugin-command completion ทั้งหมด
เกิดขึ้นในการรัน `openclaw completion --write-state` อย่างชัดเจน

เมื่อติดตั้งบริการ Gateway แบบ local ที่จัดการอยู่และเปิดใช้งานการรีสตาร์ต
การอัปเดตผ่านตัวจัดการแพ็กเกจจะหยุดบริการที่กำลังทำงานก่อนแทนที่ต้นไม้แพ็กเกจ
จากนั้นรีเฟรชข้อมูลเมตาของบริการจากการติดตั้งที่อัปเดต รีสตาร์ต
บริการ และตรวจสอบว่า Gateway ที่รีสตาร์ตรายงานเวอร์ชันที่คาดไว้ก่อน
รายงานว่าสำเร็จ บน macOS การตรวจหลังอัปเดตยังตรวจว่า LaunchAgent
ถูกโหลด/กำลังทำงานสำหรับโปรไฟล์ที่ใช้งานอยู่ และพอร์ต loopback ที่กำหนดค่าไว้
ปกติดี หาก plist ติดตั้งแล้วแต่ launchd ไม่ได้ควบคุมดูแลอยู่ OpenClaw
จะ bootstrap LaunchAgent ใหม่โดยอัตโนมัติ แล้วรันการตรวจ
health/version/channel readiness ซ้ำ bootstrap ใหม่จะโหลดงาน RunAtLoad
โดยตรง ดังนั้นการกู้คืนอัปเดตจะไม่ `kickstart -k` Gateway ที่เพิ่ง
เกิดขึ้นทันที หาก Gateway ยังไม่กลับมาปกติ คำสั่งจะออกด้วย
non-zero และพิมพ์พาธบันทึกการรีสตาร์ตพร้อมคำแนะนำการรีสตาร์ต ติดตั้งใหม่ และ
ย้อนแพ็กเกจอย่างชัดเจน เมื่อใช้ `--no-restart`
การแทนที่แพ็กเกจยังคงทำงาน แต่บริการที่จัดการอยู่จะไม่ถูกหยุดหรือ
รีสตาร์ต ดังนั้น Gateway ที่กำลังทำงานอยู่อาจยังใช้โค้ดเก่าจนกว่าคุณจะรีสตาร์ต
ด้วยตนเอง

## โฟลว์ git checkout

### การเลือกช่องทาง

- `stable`: checkout tag ล่าสุดที่ไม่ใช่ beta จากนั้น build และ doctor
- `beta`: เลือก tag `-beta` ล่าสุดก่อน แต่จะถอยกลับไปใช้ tag stable ล่าสุดเมื่อ beta ไม่มีหรือเก่ากว่า
- `dev`: checkout `main` จากนั้น fetch และ rebase

### ขั้นตอนการอัปเดต

<Steps>
  <Step title="ตรวจสอบ worktree ที่สะอาด">
    ต้องไม่มีการเปลี่ยนแปลงที่ยังไม่ได้ commit
  </Step>
  <Step title="สลับช่องทาง">
    สลับไปยังช่องทางที่เลือก (tag หรือ branch)
  </Step>
  <Step title="Fetch upstream">
    เฉพาะ dev
  </Step>
  <Step title="Preflight build (เฉพาะ dev)">
    รัน TypeScript build ใน temp worktree หาก tip ล้มเหลว จะย้อนกลับสูงสุด 10 commits เพื่อหา commit ใหม่ที่สุดที่ build ได้ ตั้งค่า `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` เพื่อรัน lint ระหว่าง preflight นี้ด้วย; lint จะรันในโหมด serial ที่จำกัด เพราะโฮสต์อัปเดตของผู้ใช้มักมีขนาดเล็กกว่า CI runners
  </Step>
  <Step title="Rebase">
    Rebase ไปยัง commit ที่เลือก (เฉพาะ dev)
  </Step>
  <Step title="ติดตั้ง dependency">
    ใช้ตัวจัดการแพ็กเกจของ repo สำหรับ pnpm checkout ตัวอัปเดตจะ bootstrap `pnpm` เมื่อต้องใช้ (ผ่าน `corepack` ก่อน แล้วจึงใช้ fallback ชั่วคราว `npm install pnpm@10`) แทนการรัน `npm run build` ภายใน pnpm workspace
  </Step>
  <Step title="Build Control UI">
    Build gateway และ Control UI
  </Step>
  <Step title="รัน doctor">
    `openclaw doctor` รันเป็นการตรวจ safe-update ขั้นสุดท้าย
  </Step>
  <Step title="ซิงก์ Plugin">
    ซิงก์ Plugin ไปยังช่องทางที่ใช้งานอยู่ Dev ใช้ Plugin ที่ bundled; stable และ beta ใช้ npm อัปเดตการติดตั้ง Plugin ที่ติดตามอยู่
  </Step>
</Steps>

บนช่องทางอัปเดต beta การติดตั้ง Plugin npm และ ClawHub ที่ติดตามอยู่ซึ่งตาม
สาย default/latest จะลอง release Plugin `@beta` ก่อน หาก Plugin ไม่มี
beta release OpenClaw จะถอยกลับไปใช้ spec default/latest ที่บันทึกไว้ สำหรับ Plugin npm
OpenClaw ยังถอยกลับเมื่อแพ็กเกจ beta มีอยู่แต่ไม่ผ่าน
การตรวจสอบการติดตั้ง เวอร์ชันที่แน่นอนและ tag ที่ระบุชัดเจนจะไม่ถูกเขียนใหม่

<Warning>
หากการอัปเดต Plugin npm ที่ปักเวอร์ชันแน่นอน resolve ไปยังอาร์ติแฟกต์ที่ integrity แตกต่างจากเรคคอร์ดการติดตั้งที่เก็บไว้ `openclaw update` จะยกเลิกการอัปเดตอาร์ติแฟกต์ Plugin นั้นแทนการติดตั้ง ติดตั้งใหม่หรืออัปเดต Plugin อย่างชัดเจนหลังจากตรวจสอบแล้วเท่านั้นว่าคุณเชื่อถืออาร์ติแฟกต์ใหม่
</Warning>

<Note>
ความล้มเหลวในการซิงก์ Plugin หลังอัปเดตที่จำกัดอยู่ใน Plugin ที่จัดการอยู่จะถูกรายงานเป็นคำเตือนหลังจากการอัปเดต core สำเร็จ ผลลัพธ์ JSON จะคง `status: "ok"` ระดับบนสุดของการอัปเดตไว้ และรายงาน `postUpdate.plugins.status: "warning"` พร้อมคำแนะนำ `openclaw doctor --fix` และ `openclaw plugins inspect <id> --runtime --json` ข้อยกเว้นของตัวอัปเดตหรือการซิงก์ที่ไม่คาดคิดยังคงทำให้ผลลัพธ์การอัปเดตล้มเหลว แก้การติดตั้ง Plugin หรือข้อผิดพลาดการอัปเดต แล้วรัน `openclaw doctor --fix` หรือ `openclaw update` อีกครั้ง

เมื่อ Gateway ที่อัปเดตเริ่มทำงาน การโหลด Plugin จะเป็นแบบ verify-only: startup จะไม่รันตัวจัดการแพ็กเกจหรือเปลี่ยนแปลงต้นไม้ dependency การรีสตาร์ต `update.run` ผ่านตัวจัดการแพ็กเกจจะข้ามการเลื่อนแบบ idle ปกติและ restart cooldown หลังจากสลับต้นไม้แพ็กเกจแล้ว ดังนั้นกระบวนการเก่าจะไม่สามารถ lazy-load ชิ้นส่วนที่ถูกลบออกต่อไปได้

หาก pnpm bootstrap ยังล้มเหลว ตัวอัปเดตจะหยุดตั้งแต่ต้นพร้อมข้อผิดพลาดเฉพาะตัวจัดการแพ็กเกจ แทนที่จะพยายาม `npm run build` ภายใน checkout
</Note>

## คำย่อ `--update`

`openclaw --update` จะเขียนใหม่เป็น `openclaw update` (มีประโยชน์สำหรับ shell และสคริปต์ launcher)

## ที่เกี่ยวข้อง

- `openclaw doctor` (เสนอให้รัน update ก่อนบน git checkout)
- [ช่องทางการพัฒนา](/th/install/development-channels)
- [การอัปเดต](/th/install/updating)
- [เอกสารอ้างอิง CLI](/th/cli)
