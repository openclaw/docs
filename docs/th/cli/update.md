---
read_when:
    - คุณต้องการอัปเดตสำเนาซอร์สที่เช็กเอาต์ไว้อย่างปลอดภัย
    - คุณกำลังดีบักเอาต์พุตหรือตัวเลือกของ `openclaw update`
    - คุณจำเป็นต้องเข้าใจพฤติกรรมแบบย่อของ `--update`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw update` (การอัปเดตซอร์สที่ค่อนข้างปลอดภัย + การรีสตาร์ต Gateway อัตโนมัติ)
title: อัปเดต
x-i18n:
    generated_at: "2026-05-06T17:55:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

อัปเดต OpenClaw อย่างปลอดภัยและสลับระหว่างช่อง stable/beta/dev

หากคุณติดตั้งผ่าน **npm/pnpm/bun** (การติดตั้งแบบ global ไม่มีเมทาดาทา git)
การอัปเดตจะดำเนินผ่านโฟลว์ของตัวจัดการแพ็กเกจใน [การอัปเดต](/th/install/updating)

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
- `--channel <stable|beta|dev>`: ตั้งค่าช่องอัปเดต (git + npm; บันทึกไว้ใน config)
- `--tag <dist-tag|version|spec>`: แทนที่เป้าหมายแพ็กเกจสำหรับการอัปเดตครั้งนี้เท่านั้น สำหรับการติดตั้งแบบแพ็กเกจ `main` จะ map ไปที่ `github:openclaw/openclaw#main`
- `--dry-run`: แสดงตัวอย่างการดำเนินการอัปเดตที่วางแผนไว้ (โฟลว์ channel/tag/target/restart) โดยไม่เขียน config, ติดตั้ง, ซิงค์ plugins หรือรีสตาร์ต
- `--json`: พิมพ์ JSON `UpdateRunResult` ที่เครื่องอ่านได้ รวมถึง
  `postUpdate.plugins.warnings` เมื่อ plugins ที่จัดการอยู่เสียหายหรือโหลดไม่ได้และต้อง
  ซ่อมแซมหลังจากการอัปเดต core สำเร็จ และ `postUpdate.plugins.integrityDrifts`
  เมื่อตรวจพบ artifact drift ของ npm plugin ระหว่างการซิงค์ plugin หลังอัปเดต
- `--timeout <seconds>`: timeout ต่อขั้นตอน (ค่าเริ่มต้นคือ 1800s)
- `--yes`: ข้ามพรอมต์ยืนยัน (เช่น การยืนยันการ downgrade)

`openclaw update` ไม่มี flag `--verbose` ใช้ `--dry-run` เพื่อดูตัวอย่าง
การดำเนินการ channel/tag/install/restart ที่วางแผนไว้, `--json` สำหรับผลลัพธ์
ที่เครื่องอ่านได้ และ `openclaw update status --json` เมื่อคุณต้องการเพียงรายละเอียด
ช่องและความพร้อมใช้งาน หากคุณกำลังดีบัก log ของ Gateway รอบการอัปเดต
ความละเอียดของ console และระดับ log ของไฟล์จะแยกกัน: Gateway `--verbose` มีผลกับ
เอาต์พุต terminal/WebSocket ส่วน file logs ต้องใช้ `logging.level: "debug"` หรือ
`"trace"` ใน config ดู [การบันทึก log ของ Gateway](/th/gateway/logging)

<Note>
ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) การรัน `openclaw update` ที่แก้ไขสถานะจะถูกปิดใช้งาน ให้อัปเดตแหล่ง Nix หรือ flake input สำหรับการติดตั้งนี้แทน; สำหรับ nix-openclaw ให้ใช้ [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first `openclaw update status` และ `openclaw update --dry-run` ยังคงเป็นแบบอ่านอย่างเดียว
</Note>

<Warning>
การ downgrade ต้องมีการยืนยัน เพราะเวอร์ชันเก่าอาจทำให้การกำหนดค่าเสียหายได้
</Warning>

## `update status`

แสดงช่องอัปเดตที่ใช้งานอยู่ + git tag/branch/SHA (สำหรับ source checkouts) พร้อมความพร้อมของการอัปเดต

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

ตัวเลือก:

- `--json`: พิมพ์ JSON สถานะที่เครื่องอ่านได้
- `--timeout <seconds>`: timeout สำหรับการตรวจสอบ (ค่าเริ่มต้นคือ 3s)

## `update wizard`

โฟลว์แบบโต้ตอบเพื่อเลือกช่องอัปเดตและยืนยันว่าจะรีสตาร์ต Gateway
หลังอัปเดตหรือไม่ (ค่าเริ่มต้นคือรีสตาร์ต) หากคุณเลือก `dev` โดยไม่มี git checkout
ระบบจะเสนอให้สร้าง checkout หนึ่งรายการ

ตัวเลือก:

- `--timeout <seconds>`: timeout สำหรับแต่ละขั้นตอนการอัปเดต (ค่าเริ่มต้น `1800`)

## สิ่งที่คำสั่งทำ

เมื่อคุณสลับช่องอย่างชัดเจน (`--channel ...`) OpenClaw จะรักษา
วิธีการติดตั้งให้สอดคล้องด้วย:

- `dev` → ตรวจให้แน่ใจว่ามี git checkout (ค่าเริ่มต้น: `~/openclaw`, แทนที่ด้วย `OPENCLAW_GIT_DIR`),
  อัปเดต checkout นั้น และติดตั้ง global CLI จาก checkout นั้น
- `stable` → ติดตั้งจาก npm โดยใช้ `latest`
- `beta` → เลือกใช้ npm dist-tag `beta` ก่อน แต่ fallback ไปที่ `latest` เมื่อ beta
  ไม่มีหรือเก่ากว่า stable release ปัจจุบัน

ตัวอัปเดตอัตโนมัติของ core Gateway (เมื่อเปิดใช้งานผ่าน config) จะเรียกใช้เส้นทางอัปเดต CLI
นอก live Gateway request handler Control-plane `update.run` สำหรับการอัปเดตผ่านตัวจัดการแพ็กเกจ
จะบังคับให้รีสตาร์ตหลังอัปเดตแบบไม่เลื่อนเวลาและไม่มี cooldown หลังจากสลับแพ็กเกจ
เพราะ process Gateway เดิมอาจยังมี chunk ในหน่วยความจำที่ชี้ไปยัง
ไฟล์ที่ถูกแพ็กเกจใหม่ลบไปแล้ว

สำหรับการติดตั้งผ่านตัวจัดการแพ็กเกจ `openclaw update` จะ resolve เวอร์ชันแพ็กเกจเป้าหมาย
ก่อนเรียกใช้ตัวจัดการแพ็กเกจ การติดตั้ง npm global ใช้การติดตั้งแบบ staged:
OpenClaw ติดตั้งแพ็กเกจใหม่ลงใน npm prefix ชั่วคราว ตรวจสอบ
inventory ของ `dist` ที่อยู่ในแพ็กเกจนั้น จากนั้นสลับ package tree ที่สะอาดนั้นเข้าไปใน
global prefix จริง หากการตรวจสอบล้มเหลว งาน doctor หลังอัปเดต, การซิงค์ plugin และ
การรีสตาร์ตจะไม่รันจาก tree ที่น่าสงสัยนั้น แม้เมื่อเวอร์ชันที่ติดตั้ง
ตรงกับเป้าหมายอยู่แล้ว คำสั่งจะ refresh การติดตั้งแพ็กเกจ global
จากนั้นรันการซิงค์ plugin, การ refresh core-command completion และงานรีสตาร์ต สิ่งนี้
ช่วยให้ sidecars ที่บรรจุมาในแพ็กเกจและ records ของ plugin ที่ช่องเป็นเจ้าของสอดคล้องกับ
บิลด์ OpenClaw ที่ติดตั้งอยู่ โดยปล่อยการ rebuild completion ของ plugin-command แบบเต็มให้
การรัน `openclaw completion --write-state` อย่างชัดเจน

เมื่อมีการติดตั้งบริการ Gateway แบบ managed ในเครื่องและเปิดใช้งานการรีสตาร์ต
การอัปเดตผ่านตัวจัดการแพ็กเกจจะหยุดบริการที่กำลังรันก่อนแทนที่ package
tree จากนั้น refresh metadata ของบริการจากการติดตั้งที่อัปเดตแล้ว รีสตาร์ต
บริการ และตรวจสอบว่า Gateway ที่รีสตาร์ตรายงานเวอร์ชันที่คาดไว้ก่อน
รายงานว่าสำเร็จ บน macOS การตรวจหลังอัปเดตยังตรวจสอบว่า LaunchAgent
ถูกโหลด/กำลังรันสำหรับ active profile และ loopback port ที่กำหนดค่าไว้
พร้อมใช้งาน หากติดตั้ง plist แล้วแต่ launchd ไม่ได้กำกับดูแลอยู่ OpenClaw
จะ re-bootstrap LaunchAgent โดยอัตโนมัติ จากนั้นรันการตรวจ
health/version/channel readiness อีกครั้ง การ bootstrap ใหม่จะโหลดงาน RunAtLoad
โดยตรง ดังนั้นการกู้คืนจากการอัปเดตจะไม่ `kickstart -k` Gateway ที่เพิ่ง
spawn ทันที หาก Gateway ยังไม่พร้อมใช้งาน คำสั่งจะ exit
ด้วยสถานะ non-zero และพิมพ์ path ของ restart log พร้อมคำแนะนำการรีสตาร์ต, ติดตั้งใหม่ และ
rollback แพ็กเกจอย่างชัดเจน เมื่อใช้ `--no-restart`
การแทนที่แพ็กเกจยังคงรัน แต่บริการ managed จะไม่ถูกหยุดหรือ
รีสตาร์ต ดังนั้น Gateway ที่กำลังรันอาจยังใช้ code เก่าจนกว่าคุณจะรีสตาร์ต
ด้วยตนเอง

## โฟลว์ Git checkout

### การเลือกช่อง

- `stable`: checkout tag non-beta ล่าสุด จากนั้น build และ doctor
- `beta`: เลือก tag `-beta` ล่าสุดก่อน แต่ fallback ไปที่ stable tag ล่าสุดเมื่อ beta ไม่มีหรือเก่ากว่า
- `dev`: checkout `main` จากนั้น fetch และ rebase

### ขั้นตอนการอัปเดต

<Steps>
  <Step title="Verify clean worktree">
    ต้องไม่มีการเปลี่ยนแปลงที่ยังไม่ได้ commit
  </Step>
  <Step title="Switch channel">
    สลับไปยังช่องที่เลือก (tag หรือ branch)
  </Step>
  <Step title="Fetch upstream">
    เฉพาะ Dev
  </Step>
  <Step title="Preflight build (dev only)">
    รัน TypeScript build ใน temp worktree หาก tip ล้มเหลว จะถอยกลับไปสูงสุด 10 commits เพื่อหา commit ใหม่ที่สุดที่ build ได้ ตั้งค่า `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` เพื่อรัน lint ระหว่าง preflight นี้ด้วย; lint จะรันในโหมด serial ที่จำกัด เพราะ host สำหรับการอัปเดตของผู้ใช้มักเล็กกว่า CI runners
  </Step>
  <Step title="Rebase">
    rebase ไปยัง commit ที่เลือก (เฉพาะ dev)
  </Step>
  <Step title="Install dependencies">
    ใช้ตัวจัดการแพ็กเกจของ repo สำหรับ pnpm checkouts ตัวอัปเดตจะ bootstrap `pnpm` ตามต้องการ (ผ่าน `corepack` ก่อน จากนั้น fallback เป็น `npm install pnpm@10` ชั่วคราว) แทนการรัน `npm run build` ภายใน pnpm workspace
  </Step>
  <Step title="Build Control UI">
    build gateway และ Control UI
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` รันเป็นการตรวจ safe-update ขั้นสุดท้าย
  </Step>
  <Step title="Sync plugins">
    ซิงค์ plugins ไปยังช่องที่ใช้งานอยู่ Dev ใช้ bundled plugins; stable และ beta ใช้ npm อัปเดตการติดตั้ง plugin ที่ติดตามอยู่
  </Step>
</Steps>

บนช่องอัปเดต beta การติดตั้ง npm และ ClawHub plugin ที่ติดตามอยู่ซึ่งตาม
สาย default/latest จะลอง release `@beta` ของ plugin ก่อน หาก plugin ไม่มี
beta release OpenClaw จะ fallback ไปยัง spec default/latest ที่บันทึกไว้ สำหรับ npm
plugins OpenClaw จะ fallback ด้วยเมื่อมีแพ็กเกจ beta อยู่แต่ไม่ผ่าน
การตรวจสอบการติดตั้ง เวอร์ชันแบบ exact และ tag ที่ระบุชัดเจนจะไม่ถูกเขียนใหม่

<Warning>
หากการอัปเดต npm plugin ที่ pin แบบ exact resolve ไปยัง artifact ที่ integrity แตกต่างจาก install record ที่เก็บไว้ `openclaw update` จะ abort การอัปเดต artifact ของ plugin นั้นแทนการติดตั้ง ติดตั้งใหม่หรืออัปเดต plugin อย่างชัดเจนก็ต่อเมื่อคุณตรวจสอบแล้วว่าเชื่อถือ artifact ใหม่ได้
</Warning>

<Note>
ความล้มเหลวของการซิงค์ plugin หลังอัปเดตที่จำกัดอยู่กับ managed plugin จะถูกรายงานเป็นคำเตือนหลังจากการอัปเดต core สำเร็จ ผลลัพธ์ JSON จะคง `status: "ok"` ระดับบนสุดของการอัปเดตไว้ และรายงาน `postUpdate.plugins.status: "warning"` พร้อมคำแนะนำ `openclaw doctor --fix` และ `openclaw plugins inspect <id> --runtime --json` ข้อยกเว้นที่ไม่คาดคิดของ updater หรือ sync จะยังทำให้ผลลัพธ์การอัปเดตล้มเหลว แก้ข้อผิดพลาดการติดตั้งหรืออัปเดต plugin จากนั้นรัน `openclaw doctor --fix` หรือ `openclaw update` อีกครั้ง

เมื่อ Gateway ที่อัปเดตเริ่มทำงาน การโหลด plugin จะเป็นแบบ verify-only: startup จะไม่รันตัวจัดการแพ็กเกจหรือแก้ไข dependency trees การรีสตาร์ตจาก `update.run` ของตัวจัดการแพ็กเกจจะ bypass การเลื่อนเวลาตาม idle ปกติและ restart cooldown หลังจาก package tree ถูกสลับแล้ว ดังนั้น process เก่าจะไม่สามารถ lazy-load chunk ที่ถูกลบไปแล้วต่อได้

หาก pnpm bootstrap ยังล้มเหลว ตัวอัปเดตจะหยุดตั้งแต่ต้นพร้อมข้อผิดพลาดเฉพาะตัวจัดการแพ็กเกจ แทนการพยายาม `npm run build` ภายใน checkout
</Note>

## คำย่อ `--update`

`openclaw --update` เขียนใหม่เป็น `openclaw update` (มีประโยชน์สำหรับ shell และ launcher scripts)

## ที่เกี่ยวข้อง

- `openclaw doctor` (เสนอให้รัน update ก่อนบน git checkouts)
- [ช่องสำหรับการพัฒนา](/th/install/development-channels)
- [การอัปเดต](/th/install/updating)
- [อ้างอิง CLI](/th/cli)
