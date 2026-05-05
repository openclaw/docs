---
read_when:
    - คุณต้องการอัปเดตสำเนาซอร์สโค้ดที่เช็กเอาต์ไว้อย่างปลอดภัย
    - คุณกำลังดีบักเอาต์พุตหรือตัวเลือกของ `openclaw update`
    - คุณต้องเข้าใจลักษณะการทำงานแบบย่อของ `--update`
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw update` (การอัปเดตซอร์สที่ค่อนข้างปลอดภัย + การรีสตาร์ต Gateway อัตโนมัติ)
title: อัปเดต
x-i18n:
    generated_at: "2026-05-05T01:45:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b1837ae80a3688fb7805d78d5a354f07dccdaba175cfa429e18145e543a1f
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

อัปเดต OpenClaw อย่างปลอดภัยและสลับระหว่างแชนเนล stable/beta/dev

หากคุณติดตั้งผ่าน **npm/pnpm/bun** (ติดตั้งแบบ global โดยไม่มีเมทาดาทา git)
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
- `--channel <stable|beta|dev>`: ตั้งค่าแชนเนลอัปเดต (git + npm; บันทึกคงไว้ใน config)
- `--tag <dist-tag|version|spec>`: เขียนทับเป้าหมายแพ็กเกจสำหรับการอัปเดตครั้งนี้เท่านั้น สำหรับการติดตั้งแบบแพ็กเกจ `main` จะจับคู่กับ `github:openclaw/openclaw#main`
- `--dry-run`: แสดงตัวอย่างการดำเนินการอัปเดตที่วางแผนไว้ (โฟลว์ channel/tag/target/restart) โดยไม่เขียน config, ติดตั้ง, ซิงค์ Plugin หรือรีสตาร์ต
- `--json`: พิมพ์ JSON `UpdateRunResult` ที่เครื่องอ่านได้ รวมถึง
  `postUpdate.plugins.integrityDrifts` เมื่อตรวจพบ drift ของ npm Plugin artifact
  ระหว่างการซิงค์ Plugin หลังอัปเดต
- `--timeout <seconds>`: หมดเวลาต่อขั้นตอน (ค่าเริ่มต้นคือ 1800 วินาที)
- `--yes`: ข้ามพรอมป์ยืนยัน (เช่น การยืนยันการดาวน์เกรด)

`openclaw update` ไม่มีแฟล็ก `--verbose` ใช้ `--dry-run` เพื่อดูตัวอย่าง
การดำเนินการ channel/tag/install/restart ที่วางแผนไว้, `--json` สำหรับผลลัพธ์
ที่เครื่องอ่านได้ และ `openclaw update status --json` เมื่อคุณต้องการเฉพาะรายละเอียด
แชนเนลและความพร้อมใช้งานเท่านั้น หากคุณกำลังดีบักล็อก Gateway รอบการอัปเดต
ระดับความละเอียดของคอนโซลและระดับล็อกไฟล์จะแยกจากกัน: Gateway `--verbose` มีผลกับ
เอาต์พุตเทอร์มินัล/WebSocket ส่วนล็อกไฟล์ต้องใช้ `logging.level: "debug"` หรือ
`"trace"` ใน config ดู [การบันทึกล็อก Gateway](/th/gateway/logging)

<Warning>
การดาวน์เกรดต้องมีการยืนยัน เพราะเวอร์ชันเก่าอาจทำให้การกำหนดค่าเสียหายได้
</Warning>

## `update status`

แสดงแชนเนลอัปเดตที่ใช้งานอยู่ + แท็ก/บรานช์/SHA ของ git (สำหรับเช็กเอาต์จากซอร์ส) พร้อมความพร้อมใช้งานของอัปเดต

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

ตัวเลือก:

- `--json`: พิมพ์ JSON สถานะที่เครื่องอ่านได้
- `--timeout <seconds>`: หมดเวลาสำหรับการตรวจสอบ (ค่าเริ่มต้นคือ 3 วินาที)

## `update wizard`

โฟลว์แบบโต้ตอบเพื่อเลือกแชนเนลอัปเดตและยืนยันว่าจะรีสตาร์ต Gateway
หลังอัปเดตหรือไม่ (ค่าเริ่มต้นคือรีสตาร์ต) หากคุณเลือก `dev` โดยไม่มี git checkout ระบบจะ
เสนอให้สร้างให้

ตัวเลือก:

- `--timeout <seconds>`: หมดเวลาสำหรับแต่ละขั้นตอนอัปเดต (ค่าเริ่มต้น `1800`)

## สิ่งที่คำสั่งทำ

เมื่อคุณสลับแชนเนลอย่างชัดเจน (`--channel ...`) OpenClaw จะรักษา
วิธีติดตั้งให้สอดคล้องกันด้วย:

- `dev` → ตรวจให้แน่ใจว่ามี git checkout (ค่าเริ่มต้น: `~/openclaw`, เขียนทับด้วย `OPENCLAW_GIT_DIR`),
  อัปเดต checkout นั้น และติดตั้ง CLI แบบ global จาก checkout ดังกล่าว
- `stable` → ติดตั้งจาก npm โดยใช้ `latest`
- `beta` → เลือกใช้ npm dist-tag `beta` ก่อน แต่ fallback เป็น `latest` เมื่อ beta
  ไม่มีอยู่หรือเก่ากว่ารีลีส stable ปัจจุบัน

ตัวอัปเดตอัตโนมัติของแกน Gateway (เมื่อเปิดใช้ผ่าน config) จะเรียกเส้นทางอัปเดตของ CLI
นอกตัวจัดการคำขอ Gateway ที่กำลังทำงานอยู่ การอัปเดตผ่านตัวจัดการแพ็กเกจของ control-plane `update.run`
จะบังคับให้รีสตาร์ตหลังสลับแพ็กเกจแบบไม่เลื่อนเวลาและไม่มีคูลดาวน์
เพราะโปรเซส Gateway เก่าอาจยังมีชิ้นส่วนในหน่วยความจำที่ชี้ไปยัง
ไฟล์ที่ถูกแพ็กเกจใหม่ลบไปแล้ว

สำหรับการติดตั้งผ่านตัวจัดการแพ็กเกจ `openclaw update` จะ resolve เวอร์ชันแพ็กเกจ
เป้าหมายก่อนเรียกตัวจัดการแพ็กเกจ การติดตั้ง global ของ npm ใช้การติดตั้งแบบ staged:
OpenClaw ติดตั้งแพ็กเกจใหม่ลงใน npm prefix ชั่วคราว ตรวจสอบ
inventory ของ `dist` ที่แพ็กเกจไว้ในนั้น จากนั้นสลับต้นไม้แพ็กเกจที่สะอาดนั้นเข้าไปใน
global prefix จริง หากการตรวจสอบล้มเหลว doctor หลังอัปเดต, การซิงค์ Plugin และ
งานรีสตาร์ตจะไม่รันจากต้นไม้ที่น่าสงสัยนั้น แม้เมื่อเวอร์ชันที่ติดตั้งอยู่
ตรงกับเป้าหมายแล้ว คำสั่งก็จะรีเฟรชการติดตั้งแพ็กเกจ global
จากนั้นรันการซิงค์ Plugin, รีเฟรช completion ของคำสั่งแกน และงานรีสตาร์ต สิ่งนี้
ช่วยให้ sidecar ที่แพ็กเกจไว้และระเบียน Plugin ที่เป็นเจ้าของโดยแชนเนลสอดคล้องกับ
บิลด์ OpenClaw ที่ติดตั้งอยู่ โดยปล่อยให้การ rebuild completion ของคำสั่ง Plugin แบบเต็มเป็นหน้าที่ของ
การรัน `openclaw completion --write-state` อย่างชัดเจน

เมื่อมีการติดตั้งบริการ Gateway ที่จัดการภายในเครื่องและเปิดใช้การรีสตาร์ต
การอัปเดตผ่านตัวจัดการแพ็กเกจจะหยุดบริการที่กำลังทำงานก่อนแทนที่ต้นไม้แพ็กเกจ
จากนั้นรีเฟรชเมทาดาทาบริการจากการติดตั้งที่อัปเดตแล้ว รีสตาร์ต
บริการ และตรวจสอบว่า Gateway ที่รีสตาร์ตรายงานเวอร์ชันที่คาดไว้ก่อน
รายงานว่าสำเร็จ บน macOS การตรวจสอบหลังอัปเดตยังตรวจสอบว่า LaunchAgent
ถูกโหลด/กำลังทำงานสำหรับโปรไฟล์ที่ใช้งานอยู่ และพอร์ต loopback ที่กำหนดค่าไว้
มีสุขภาพดี หาก plist ถูกติดตั้งแล้วแต่ launchd ไม่ได้กำกับดูแล OpenClaw
จะ re-bootstrap LaunchAgent โดยอัตโนมัติ แล้วรันการตรวจสอบความพร้อม
ด้านสุขภาพ/เวอร์ชัน/แชนเนลซ้ำ การ bootstrap ใหม่จะโหลดงาน RunAtLoad
โดยตรง ดังนั้นการกู้คืนการอัปเดตจะไม่ `kickstart -k` Gateway ที่เพิ่ง
spawn ขึ้นมาทันที หาก Gateway ยังไม่กลับมามีสุขภาพดี คำสั่งจะออกด้วย
สถานะไม่เป็นศูนย์และพิมพ์พาธล็อกการรีสตาร์ต พร้อมคำแนะนำการรีสตาร์ต การติดตั้งใหม่ และ
การ rollback แพ็กเกจอย่างชัดเจน เมื่อใช้ `--no-restart`
การแทนที่แพ็กเกจยังคงรัน แต่บริการที่จัดการจะไม่ถูกหยุดหรือ
รีสตาร์ต ดังนั้น Gateway ที่กำลังทำงานอาจยังใช้โค้ดเก่าจนกว่าคุณจะรีสตาร์ตด้วยตนเอง

## โฟลว์ Git checkout

### การเลือกแชนเนล

- `stable`: checkout แท็กล่าสุดที่ไม่ใช่ beta จากนั้น build และ doctor
- `beta`: เลือกแท็ก `-beta` ล่าสุดก่อน แต่ fallback เป็นแท็ก stable ล่าสุดเมื่อ beta ไม่มีอยู่หรือเก่ากว่า
- `dev`: checkout `main` จากนั้น fetch และ rebase

### ขั้นตอนการอัปเดต

<Steps>
  <Step title="ตรวจสอบ worktree ว่าสะอาด">
    ต้องไม่มีการเปลี่ยนแปลงที่ยังไม่ได้ commit
  </Step>
  <Step title="สลับแชนเนล">
    สลับไปยังแชนเนลที่เลือก (แท็กหรือบรานช์)
  </Step>
  <Step title="Fetch upstream">
    เฉพาะ dev
  </Step>
  <Step title="Preflight build (เฉพาะ dev)">
    รัน lint และ TypeScript build ใน temp worktree หาก tip ล้มเหลว จะถอยย้อนกลับได้สูงสุด 10 commits เพื่อหาบิลด์ที่สะอาดล่าสุด
  </Step>
  <Step title="Rebase">
    Rebase ไปยัง commit ที่เลือก (เฉพาะ dev)
  </Step>
  <Step title="ติดตั้ง dependencies">
    ใช้ตัวจัดการแพ็กเกจของ repo สำหรับ pnpm checkouts ตัวอัปเดตจะ bootstrap `pnpm` เมื่อจำเป็น (ผ่าน `corepack` ก่อน แล้วจึง fallback เป็น `npm install pnpm@10` ชั่วคราว) แทนการรัน `npm run build` ภายใน pnpm workspace
  </Step>
  <Step title="Build Control UI">
    Build gateway และ Control UI
  </Step>
  <Step title="รัน doctor">
    `openclaw doctor` จะรันเป็นการตรวจสอบ safe-update ขั้นสุดท้าย
  </Step>
  <Step title="ซิงค์ Plugin">
    ซิงค์ Plugin ไปยังแชนเนลที่ใช้งานอยู่ dev ใช้ Plugin ที่ bundled มา; stable และ beta ใช้ npm อัปเดตการติดตั้ง Plugin ที่ติดตามอยู่
  </Step>
</Steps>

บนแชนเนลอัปเดต beta การติดตั้ง npm และ ClawHub Plugin ที่ติดตามอยู่และตาม
สาย default/latest จะลองใช้รีลีส Plugin `@beta` ก่อน หาก Plugin ไม่มี
รีลีส beta OpenClaw จะ fallback ไปยัง spec default/latest ที่บันทึกไว้ สำหรับ npm
Plugin OpenClaw จะ fallback ด้วยเมื่อแพ็กเกจ beta มีอยู่แต่ไม่ผ่าน
การตรวจสอบการติดตั้ง เวอร์ชันที่ระบุแน่นอนและแท็กที่ระบุชัดเจนจะไม่ถูกเขียนใหม่

<Warning>
หากการอัปเดต npm Plugin ที่ปักหมุดเวอร์ชันแน่นอน resolve ไปยัง artifact ที่ integrity แตกต่างจากระเบียนการติดตั้งที่เก็บไว้ `openclaw update` จะยกเลิกการอัปเดต Plugin artifact นั้นแทนที่จะติดตั้ง ให้ติดตั้งใหม่หรืออัปเดต Plugin อย่างชัดเจนหลังจากตรวจสอบแล้วเท่านั้นว่าคุณเชื่อถือ artifact ใหม่
</Warning>

<Note>
ความล้มเหลวในการซิงค์ Plugin หลังอัปเดตจะทำให้ผลลัพธ์การอัปเดตล้มเหลวและหยุดงาน follow-up การรีสตาร์ต แก้ข้อผิดพลาดการติดตั้งหรืออัปเดต Plugin แล้วรัน `openclaw update` อีกครั้ง

เมื่อ Gateway ที่อัปเดตเริ่มทำงาน การโหลด Plugin จะเป็นแบบ verify-only: ตอน startup จะไม่รันตัวจัดการแพ็กเกจหรือเปลี่ยนแปลงต้นไม้ dependencies การรีสตาร์ต `update.run` ผ่านตัวจัดการแพ็กเกจจะข้ามการเลื่อนเวลาตาม idle และคูลดาวน์รีสตาร์ตตามปกติหลังจากสลับต้นไม้แพ็กเกจแล้ว ดังนั้นโปรเซสเก่าจะไม่สามารถโหลดชิ้นส่วนที่ถูกลบแบบ lazy ต่อไปได้

หาก pnpm bootstrap ยังล้มเหลว ตัวอัปเดตจะหยุดตั้งแต่ต้นพร้อมข้อผิดพลาดเฉพาะตัวจัดการแพ็กเกจ แทนที่จะพยายามรัน `npm run build` ภายใน checkout
</Note>

## คำย่อ `--update`

`openclaw --update` จะเขียนใหม่เป็น `openclaw update` (มีประโยชน์สำหรับเชลล์และสคริปต์ launcher)

## ที่เกี่ยวข้อง

- `openclaw doctor` (เสนอให้รัน update ก่อนบน git checkouts)
- [แชนเนลสำหรับการพัฒนา](/th/install/development-channels)
- [การอัปเดต](/th/install/updating)
- [ข้อมูลอ้างอิง CLI](/th/cli)
