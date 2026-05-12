---
read_when:
    - คุณต้องการอัปเดตสำเนาซอร์สที่เช็กเอาต์ไว้อย่างปลอดภัย
    - คุณกำลังดีบักเอาต์พุตหรือตัวเลือกของ `openclaw update`
    - คุณต้องเข้าใจลักษณะการทำงานแบบย่อของ `--update`
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw update` (การอัปเดตซอร์สที่ค่อนข้างปลอดภัย + การรีสตาร์ต Gateway อัตโนมัติ)
title: อัปเดต
x-i18n:
    generated_at: "2026-05-12T08:45:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93244af800aaa53c55a52f9593a7727910aa91acac9d1e34e89c39a95b133461
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

อัปเดต OpenClaw อย่างปลอดภัยและสลับระหว่างช่องทาง stable/beta/dev

หากคุณติดตั้งผ่าน **npm/pnpm/bun** (ติดตั้งแบบ global ไม่มีข้อมูลเมตา git)
การอัปเดตจะเกิดขึ้นผ่านขั้นตอน package-manager ใน [การอัปเดต](/th/install/updating)

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

- `--no-restart`: ข้ามการรีสตาร์ตบริการ Gateway หลังการอัปเดตสำเร็จ การอัปเดตผ่าน package-manager ที่รีสตาร์ต Gateway จะตรวจสอบว่าบริการที่รีสตาร์ตรายงานเวอร์ชันที่อัปเดตตามที่คาดไว้ก่อนที่คำสั่งจะสำเร็จ
- `--channel <stable|beta|dev>`: ตั้งค่าช่องทางอัปเดต (git + npm; บันทึกไว้ในคอนฟิก)
- `--tag <dist-tag|version|spec>`: แทนที่เป้าหมายแพ็กเกจสำหรับการอัปเดตครั้งนี้เท่านั้น สำหรับการติดตั้งแบบแพ็กเกจ `main` จะแมปไปยัง `github:openclaw/openclaw#main`
- `--dry-run`: ดูตัวอย่างการดำเนินการอัปเดตที่วางแผนไว้ (ช่องทาง/แท็ก/เป้าหมาย/ขั้นตอนรีสตาร์ต) โดยไม่เขียนคอนฟิก ติดตั้ง ซิงก์ plugins หรือรีสตาร์ต
- `--json`: พิมพ์ JSON `UpdateRunResult` ที่เครื่องอ่านได้ รวมถึง
  `postUpdate.plugins.warnings` เมื่อ plugins ที่จัดการอยู่เสียหายหรือโหลดไม่ได้และต้อง
  ซ่อมแซมหลังการอัปเดตแกนหลักสำเร็จ รายละเอียดการถอยกลับของ Plugin ในช่องทาง beta
  เมื่อ Plugin ไม่มีรุ่น beta และ `postUpdate.plugins.integrityDrifts`
  เมื่อพบความคลาดเคลื่อนของอาร์ติแฟกต์ Plugin ของ npm ระหว่างการซิงก์ Plugin หลังอัปเดต
- `--timeout <seconds>`: เวลาหมดอายุต่อขั้นตอน (ค่าเริ่มต้นคือ 1800 วินาที)
- `--yes`: ข้ามพรอมป์ยืนยัน (เช่น การยืนยันการดาวน์เกรด)

`openclaw update` ไม่มีแฟล็ก `--verbose` ใช้ `--dry-run` เพื่อดูตัวอย่าง
การดำเนินการช่องทาง/แท็ก/ติดตั้ง/รีสตาร์ตที่วางแผนไว้, `--json` สำหรับผลลัพธ์
ที่เครื่องอ่านได้ และ `openclaw update status --json` เมื่อคุณต้องการเฉพาะรายละเอียด
ช่องทางและความพร้อมใช้งาน หากคุณกำลังดีบักบันทึก Gateway ในช่วงการอัปเดต
ระดับความละเอียดของคอนโซลและระดับบันทึกไฟล์จะแยกกัน: Gateway `--verbose` มีผลต่อ
เอาต์พุตเทอร์มินัล/WebSocket ขณะที่บันทึกไฟล์ต้องใช้ `logging.level: "debug"` หรือ
`"trace"` ในคอนฟิก ดู [การบันทึก Gateway](/th/gateway/logging)

<Note>
ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) การรัน `openclaw update` ที่เปลี่ยนแปลงระบบจะถูกปิดใช้งาน ให้อัปเดตซอร์ส Nix หรืออินพุต flake สำหรับการติดตั้งนี้แทน; สำหรับ nix-openclaw ให้ใช้ [เริ่มต้นอย่างรวดเร็ว](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first `openclaw update status` และ `openclaw update --dry-run` ยังคงเป็นแบบอ่านอย่างเดียว
</Note>

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
- `--timeout <seconds>`: เวลาหมดอายุสำหรับการตรวจสอบ (ค่าเริ่มต้นคือ 3 วินาที)

## `update wizard`

ขั้นตอนแบบโต้ตอบเพื่อเลือกช่องทางอัปเดตและยืนยันว่าจะรีสตาร์ต Gateway
หลังอัปเดตหรือไม่ (ค่าเริ่มต้นคือรีสตาร์ต) หากคุณเลือก `dev` โดยไม่มี git checkout ระบบจะ
เสนอให้สร้างให้

ตัวเลือก:

- `--timeout <seconds>`: เวลาหมดอายุสำหรับแต่ละขั้นตอนการอัปเดต (ค่าเริ่มต้น `1800`)

## สิ่งที่ทำ

เมื่อคุณสลับช่องทางอย่างชัดเจน (`--channel ...`) OpenClaw จะรักษา
วิธีติดตั้งให้สอดคล้องกันด้วย:

- `dev` → รับประกันว่ามี git checkout (ค่าเริ่มต้น: `~/openclaw`, แทนที่ด้วย `OPENCLAW_GIT_DIR`),
  อัปเดต checkout นั้น และติดตั้ง CLI แบบ global จาก checkout นั้น
- `stable` → ติดตั้งจาก npm โดยใช้ `latest`
- `beta` → ให้ความสำคัญกับ npm dist-tag `beta` แต่ถอยกลับไปใช้ `latest` เมื่อ beta
  ไม่มีหรือเก่ากว่ารุ่น stable ปัจจุบัน

ตัวอัปเดตอัตโนมัติของแกน Gateway (เมื่อเปิดใช้ผ่านคอนฟิก) จะเปิดเส้นทางอัปเดต CLI
ภายนอกตัวจัดการคำขอ Gateway ที่กำลังทำงานอยู่ การอัปเดต package-manager ผ่าน control-plane `update.run`
จะบังคับให้มีการรีสตาร์ตอัปเดตแบบไม่เลื่อนเวลาและไม่มีคูลดาวน์หลังการสลับแพ็กเกจ
เพราะกระบวนการ Gateway เก่าอาจยังมีชิ้นส่วนในหน่วยความจำที่ชี้ไปยัง
ไฟล์ที่แพ็กเกจใหม่ลบออกแล้ว

สำหรับการติดตั้งผ่าน package-manager, `openclaw update` จะแก้หาเวอร์ชัน
แพ็กเกจเป้าหมายก่อนเรียก package manager การติดตั้ง npm แบบ global ใช้การติดตั้งแบบจัดเตรียม:
OpenClaw ติดตั้งแพ็กเกจใหม่ลงใน prefix ชั่วคราวของ npm ตรวจสอบ
รายการ `dist` ที่แพ็กเกจไว้ที่นั่น แล้วจึงสลับ tree ของแพ็กเกจที่สะอาดนั้นเข้าไปใน
prefix global จริง หากการตรวจสอบล้มเหลว งาน doctor หลังอัปเดต การซิงก์ Plugin และ
การรีสตาร์ตจะไม่รันจาก tree ที่น่าสงสัยนั้น แม้เวอร์ชันที่ติดตั้งอยู่
จะตรงกับเป้าหมายแล้ว คำสั่งก็จะรีเฟรชการติดตั้งแพ็กเกจ global,
จากนั้นรันการซิงก์ Plugin, การรีเฟรช completion ของคำสั่งแกนหลัก และงานรีสตาร์ต สิ่งนี้
ช่วยให้ sidecar ที่แพ็กเกจไว้และระเบียน Plugin ที่ช่องทางเป็นเจ้าของสอดคล้องกับ
บิลด์ OpenClaw ที่ติดตั้งอยู่ ขณะที่ปล่อยให้การสร้าง completion ของคำสั่ง Plugin แบบเต็ม
ทำผ่านการรัน `openclaw completion --write-state` อย่างชัดเจน

เมื่อมีบริการ Gateway ในเครื่องที่จัดการอยู่ติดตั้งไว้และเปิดใช้การรีสตาร์ต
การอัปเดตผ่าน package-manager จะหยุดบริการที่กำลังทำงานก่อนแทนที่ tree ของแพ็กเกจ
จากนั้นรีเฟรชข้อมูลเมตาของบริการจากการติดตั้งที่อัปเดต รีสตาร์ต
บริการ และตรวจสอบว่า Gateway ที่รีสตาร์ตรายงานเวอร์ชันที่คาดไว้ก่อน
รายงานว่าสำเร็จ บน macOS การตรวจสอบหลังอัปเดตยังตรวจสอบว่า LaunchAgent
ถูกโหลด/ทำงานสำหรับโปรไฟล์ที่ใช้งานอยู่ และพอร์ตลูปแบ็กที่กำหนดค่าไว้
มีสถานะปกติ หากติดตั้ง plist แล้วแต่ launchd ไม่ได้กำกับดูแลอยู่ OpenClaw
จะ bootstrap LaunchAgent ใหม่โดยอัตโนมัติ แล้วรันการตรวจสอบ
ความพร้อมด้านสุขภาพ/เวอร์ชัน/ช่องทางอีกครั้ง bootstrap ใหม่จะโหลดงาน RunAtLoad
โดยตรง ดังนั้นการกู้คืนอัปเดตจะไม่ `kickstart -k` Gateway ที่เพิ่ง
เริ่มขึ้นทันที หาก Gateway ยังไม่พร้อมใช้งาน คำสั่งจะออกด้วย
รหัสไม่เป็นศูนย์และพิมพ์เส้นทางบันทึกการรีสตาร์ต พร้อมคำสั่งรีสตาร์ต ติดตั้งใหม่ และ
ย้อนกลับแพ็กเกจอย่างชัดเจน เมื่อใช้ `--no-restart`,
การแทนที่แพ็กเกจยังคงรัน แต่บริการที่จัดการอยู่จะไม่ถูกหยุดหรือ
รีสตาร์ต ดังนั้น Gateway ที่กำลังทำงานอาจยังใช้โค้ดเก่าจนกว่าคุณจะรีสตาร์ต
ด้วยตนเอง

## ขั้นตอน git checkout

### การเลือกช่องทาง

- `stable`: checkout แท็ก non-beta ล่าสุด จากนั้น build และ doctor
- `beta`: ให้ความสำคัญกับแท็ก `-beta` ล่าสุด แต่ถอยกลับไปใช้แท็ก stable ล่าสุดเมื่อ beta ไม่มีหรือเก่ากว่า
- `dev`: checkout `main` จากนั้น fetch และ rebase

### ขั้นตอนการอัปเดต

<Steps>
  <Step title="ตรวจสอบ worktree ที่สะอาด">
    ต้องไม่มีการเปลี่ยนแปลงที่ยังไม่ได้ commit
  </Step>
  <Step title="สลับช่องทาง">
    สลับไปยังช่องทางที่เลือก (แท็กหรือสาขา)
  </Step>
  <Step title="ดึงข้อมูลจาก upstream">
    เฉพาะ Dev
  </Step>
  <Step title="บิลด์ตรวจล่วงหน้า (เฉพาะ dev)">
    รันบิลด์ TypeScript ใน worktree ชั่วคราว หาก tip ล้มเหลว จะถอยกลับได้สูงสุด 10 commits เพื่อหา commit ล่าสุดที่ build ได้ ตั้งค่า `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` เพื่อรัน lint ระหว่างการตรวจล่วงหน้านี้ด้วย; lint จะรันในโหมด serial แบบจำกัด เพราะโฮสต์อัปเดตของผู้ใช้มักเล็กกว่า runner ของ CI
  </Step>
  <Step title="Rebase">
    rebase ไปยัง commit ที่เลือก (เฉพาะ dev)
  </Step>
  <Step title="ติดตั้ง dependencies">
    ใช้ package manager ของ repo สำหรับ checkout ที่ใช้ pnpm ตัวอัปเดตจะ bootstrap `pnpm` เมื่อต้องการ (ผ่าน `corepack` ก่อน จากนั้นใช้ fallback ชั่วคราว `npm install pnpm@11`) แทนการรัน `npm run build` ภายใน workspace ของ pnpm
  </Step>
  <Step title="Build Control UI">
    build gateway และ Control UI
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` รันเป็นการตรวจสอบ safe-update ขั้นสุดท้าย
  </Step>
  <Step title="Sync plugins">
    ซิงก์ plugins ไปยังช่องทางที่ใช้งานอยู่ Dev ใช้ plugins ที่ bundled มา; stable และ beta ใช้ npm อัปเดตการติดตั้ง Plugin ที่ติดตามอยู่
  </Step>
</Steps>

บนช่องทางอัปเดต beta การติดตั้ง Plugin ของ npm และ ClawHub ที่ติดตามอยู่และตาม
สาย default/latest จะลองใช้รุ่น Plugin `@beta` ก่อน หาก Plugin ไม่มี
รุ่น beta, OpenClaw จะถอยกลับไปใช้ spec default/latest ที่บันทึกไว้และรายงาน
เป็นคำเตือน สำหรับ plugins ของ npm, OpenClaw จะถอยกลับเช่นกันเมื่อมีแพ็กเกจ beta
แต่ไม่ผ่านการตรวจสอบการติดตั้ง คำเตือนการถอยกลับของ Plugin เหล่านี้
ไม่ทำให้การอัปเดตแกนหลักล้มเหลว เวอร์ชันแบบเจาะจงและแท็กแบบชัดเจนจะไม่ถูก
เขียนใหม่

<Warning>
หากการอัปเดต Plugin ของ npm ที่ปักหมุดเวอร์ชันแบบเจาะจงแก้ไปยังอาร์ติแฟกต์ที่ integrity ต่างจากระเบียนการติดตั้งที่เก็บไว้ `openclaw update` จะยกเลิกการอัปเดตอาร์ติแฟกต์ Plugin นั้นแทนการติดตั้ง ให้ติดตั้งใหม่หรืออัปเดต Plugin นั้นอย่างชัดเจนเฉพาะหลังจากตรวจสอบแล้วว่าคุณเชื่อถืออาร์ติแฟกต์ใหม่
</Warning>

<Note>
ความล้มเหลวในการซิงก์ Plugin หลังอัปเดตที่จำกัดอยู่กับ Plugin ที่จัดการอยู่และเส้นทางซิงก์สามารถเลี่ยงได้ (เช่น registry ของ npm ที่เข้าถึงไม่ได้สำหรับ Plugin ที่ไม่จำเป็น) จะถูกรายงานเป็นคำเตือนหลังการอัปเดตแกนหลักสำเร็จ ผลลัพธ์ JSON จะคง `status: "ok"` ระดับบนสุดและรายงาน `postUpdate.plugins.status: "warning"` พร้อมคำแนะนำ `openclaw doctor --fix` และ `openclaw plugins inspect <id> --runtime --json` ข้อยกเว้นที่ไม่คาดคิดของตัวอัปเดตหรือการซิงก์ยังคงทำให้ผลลัพธ์การอัปเดตล้มเหลว แก้ข้อผิดพลาดการติดตั้งหรืออัปเดต Plugin แล้วรัน `openclaw doctor --fix` หรือ `openclaw update` อีกครั้ง

หลังขั้นตอนซิงก์ราย Plugin, `openclaw update` จะรันรอบ **post-core convergence** ที่บังคับก่อนรีสตาร์ต gateway: โดยจะซ่อม payload ของ Plugin ที่กำหนดค่าไว้แต่หายไป ตรวจสอบระเบียนการติดตั้งที่ติดตามและ _ใช้งานอยู่_ แต่ละรายการบนดิสก์ และตรวจสอบแบบ static ว่า `package.json` ของรายการนั้น parse ได้ (และมี `main` ที่ประกาศไว้อย่างชัดเจน หากมี) ความล้มเหลวจากรอบนี้ และ snapshot คอนฟิก OpenClaw ที่ไม่ถูกต้อง จะคืน `postUpdate.plugins.status: "error"` และเปลี่ยน `status` ระดับบนสุดเป็น `"error"` ดังนั้น `openclaw update` จะออกด้วยรหัสไม่เป็นศูนย์ และ gateway จะ _ไม่_ ถูกรีสตาร์ตพร้อมชุด Plugin ที่ยังไม่ได้ตรวจสอบ ข้อผิดพลาดจะมีบรรทัด `postUpdate.plugins.warnings[].guidance` แบบมีโครงสร้างที่ชี้ไปยัง `openclaw doctor --fix` และ `openclaw plugins inspect <id> --runtime --json` สำหรับการติดตามผล รายการ Plugin ที่ปิดใช้งานและระเบียนที่ไม่ใช่เป้าหมายซิงก์อย่างเป็นทางการที่เชื่อมโยงกับ trusted source จะถูกข้ามที่นี่ โดยสะท้อนนโยบาย `skipDisabledPlugins` ที่ใช้ในการตรวจ payload ที่หายไป ดังนั้นระเบียน Plugin ที่ปิดใช้งานและค้างอยู่จะไม่สามารถบล็อกการอัปเดตที่ถูกต้องได้

เมื่อ Gateway ที่อัปเดตเริ่มทำงาน การโหลด Plugin จะเป็นแบบตรวจสอบเท่านั้น: การเริ่มต้นจะไม่รัน package managers หรือเปลี่ยนแปลง tree ของ dependency การรีสตาร์ต package-manager `update.run` จะข้ามการเลื่อนเวลาตาม idle และคูลดาวน์รีสตาร์ตปกติหลังจาก tree ของแพ็กเกจถูกสลับแล้ว ดังนั้นกระบวนการเก่าจะไม่สามารถ lazy-load ชิ้นส่วนที่ถูกลบไปแล้วต่อไปได้

หาก bootstrap pnpm ยังคงล้มเหลว ตัวอัปเดตจะหยุดตั้งแต่ต้นพร้อมข้อผิดพลาดเฉพาะ package-manager แทนการลอง `npm run build` ภายใน checkout
</Note>

## ชวเลข `--update`

`openclaw --update` จะเขียนใหม่เป็น `openclaw update` (มีประโยชน์สำหรับ shell และสคริปต์ launcher)

## ที่เกี่ยวข้อง

- `openclaw doctor` (เสนอให้รัน update ก่อนบน git checkouts)
- [ช่องทางการพัฒนา](/th/install/development-channels)
- [การอัปเดต](/th/install/updating)
- [เอกสารอ้างอิง CLI](/th/cli)
