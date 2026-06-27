---
read_when:
    - คุณต้องการอัปเดตเช็กเอาต์ซอร์สอย่างปลอดภัย
    - คุณกำลังดีบักเอาต์พุตหรือตัวเลือกของ `openclaw update`
    - คุณต้องเข้าใจพฤติกรรมของรูปแบบย่อ `--update`
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw update` (อัปเดตแหล่งที่มาที่ค่อนข้างปลอดภัย + รีสตาร์ท Gateway อัตโนมัติ)
title: อัปเดต
x-i18n:
    generated_at: "2026-06-27T17:24:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3503e1cd15baa4d4f6c26734b37556831c612f1da0da5ccfe7bcde35b9be64b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

อัปเดต OpenClaw อย่างปลอดภัย และสลับระหว่างช่องทาง stable/beta/dev

หากคุณติดตั้งผ่าน **npm/pnpm/bun** (ติดตั้งแบบ global ไม่มีข้อมูลเมตา git)
การอัปเดตจะเกิดขึ้นผ่านโฟลว์ตัวจัดการแพ็กเกจใน [การอัปเดต](/th/install/updating)

## การใช้งาน

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

## ตัวเลือก

- `--no-restart`: ข้ามการรีสตาร์ตบริการ Gateway หลังจากอัปเดตสำเร็จ การอัปเดตผ่านตัวจัดการแพ็กเกจที่รีสตาร์ต Gateway จะตรวจสอบว่าบริการที่รีสตาร์ตรายงานเวอร์ชันที่อัปเดตตามที่คาดไว้ก่อนที่คำสั่งจะสำเร็จ
- `--channel <stable|beta|dev>`: ตั้งค่าช่องทางอัปเดต (git + npm; บันทึกคงไว้ใน config)
- `--tag <dist-tag|version|spec>`: แทนที่เป้าหมายแพ็กเกจสำหรับการอัปเดตครั้งนี้เท่านั้น สำหรับการติดตั้งแพ็กเกจ `main` จะ map ไปที่ `github:openclaw/openclaw#main`; สเปกซอร์ส GitHub/git จะถูกแพ็กเป็น tarball ชั่วคราวก่อนการติดตั้ง npm แบบ global ที่จัดเตรียมไว้
- `--dry-run`: แสดงตัวอย่างการดำเนินการอัปเดตที่วางแผนไว้ (โฟลว์ channel/tag/target/restart) โดยไม่เขียน config, ติดตั้ง, ซิงก์ Plugin หรือรีสตาร์ต
- `--json`: พิมพ์ JSON `UpdateRunResult` ที่เครื่องอ่านได้ รวมถึง
  `postUpdate.plugins.warnings` เมื่อ Plugin ที่จัดการไว้เสียหายหรือโหลดไม่ได้และต้อง
  ซ่อมหลังจากการอัปเดต core สำเร็จ รายละเอียดการ fallback ของ Plugin ช่องทาง beta
  เมื่อ Plugin ไม่มีรุ่น beta และ `postUpdate.plugins.integrityDrifts`
  เมื่อตรวจพบการคลาดเคลื่อนของอาร์ติแฟกต์ Plugin npm ระหว่างการซิงก์ Plugin หลังอัปเดต
- `--timeout <seconds>`: ระยะหมดเวลาต่อขั้นตอน (ค่าเริ่มต้นคือ 1800s)
- `--yes`: ข้ามพรอมป์ยืนยัน (เช่น การยืนยันการดาวน์เกรด)
- `--acknowledge-clawhub-risk`: หลังจากตรวจสอบคำเตือนความน่าเชื่อถือของ ClawHub ชุมชนแล้ว
  อนุญาตให้การซิงก์ Plugin หลังอัปเดตดำเนินต่อโดยไม่มีพรอมป์แบบโต้ตอบ
  หากไม่มีตัวเลือกนี้ รุ่น Plugin ClawHub ชุมชนที่มีความเสี่ยงจะถูกข้ามและ
  คงไว้ไม่เปลี่ยนแปลงเมื่อ OpenClaw ไม่สามารถแสดงพรอมป์ได้ แพ็กเกจ ClawHub อย่างเป็นทางการและ
  ซอร์ส Plugin OpenClaw ที่รวมมากับระบบจะข้ามพรอมป์ความน่าเชื่อถือของรุ่นนี้

`openclaw update` ไม่มีแฟล็ก `--verbose` ใช้ `--dry-run` เพื่อแสดงตัวอย่าง
การดำเนินการ channel/tag/install/restart ที่วางแผนไว้, `--json` สำหรับผลลัพธ์ที่เครื่องอ่านได้
และ `openclaw update status --json` เมื่อคุณต้องการเพียงรายละเอียดช่องทางและ
ความพร้อมใช้งาน หากคุณกำลังดีบักบันทึก Gateway ระหว่างการอัปเดต
ความละเอียดของคอนโซลและระดับบันทึกไฟล์จะแยกกัน: Gateway `--verbose` มีผลต่อ
เอาต์พุต terminal/WebSocket ส่วนบันทึกไฟล์ต้องใช้ `logging.level: "debug"` หรือ
`"trace"` ใน config ดู [การบันทึก Gateway](/th/gateway/logging)

<Note>
ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) การรัน `openclaw update` ที่เปลี่ยนแปลงสถานะจะถูกปิดใช้งาน ให้อัปเดตซอร์ส Nix หรืออินพุต flake สำหรับการติดตั้งนี้แทน; สำหรับ nix-openclaw ให้ใช้ [เริ่มต้นอย่างรวดเร็ว](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first `openclaw update status` และ `openclaw update --dry-run` ยังคงเป็นแบบอ่านอย่างเดียว
</Note>

<Warning>
การดาวน์เกรดต้องมีการยืนยัน เพราะเวอร์ชันเก่าอาจทำให้การกำหนดค่าเสียหายได้
</Warning>

## `update status`

แสดงช่องทางอัปเดตที่ใช้งานอยู่ + tag/branch/SHA ของ git (สำหรับ source checkout) พร้อมความพร้อมใช้งานของอัปเดต

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

ตัวเลือก:

- `--json`: พิมพ์ JSON สถานะที่เครื่องอ่านได้
- `--timeout <seconds>`: ระยะหมดเวลาสำหรับการตรวจสอบ (ค่าเริ่มต้นคือ 3s)

## `update repair`

รันการจบงานอัปเดตอีกครั้งหลังจากแพ็กเกจ core เปลี่ยนไปแล้ว แต่ภายหลัง
งานซ่อมไม่เสร็จเรียบร้อย นี่คือเส้นทางกู้คืนที่รองรับเมื่อ
`openclaw update` ติดตั้งแพ็กเกจ core ใหม่แล้ว แต่การซิงก์ Plugin หลัง core,
ข้อมูลเมตา Plugin npm ที่จัดการไว้, การรีเฟรช registry หรือการซ่อม doctor ยังต้อง
ทำให้เข้าที่

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

ตัวเลือก:

- `--channel <stable|beta|dev>`: บันทึกช่องทางอัปเดตก่อนซ่อมและ
  รันการทำให้ Plugin เข้าที่กับช่องทางนั้น
- `--json`: พิมพ์ JSON การจบงานที่เครื่องอ่านได้
- `--timeout <seconds>`: ระยะหมดเวลาสำหรับขั้นตอนซ่อม (ค่าเริ่มต้น `1800`)
- `--yes`: ข้ามพรอมป์ยืนยัน
- `--acknowledge-clawhub-risk`: หลังจากตรวจสอบคำเตือนความน่าเชื่อถือของ ClawHub ชุมชนแล้ว
  อนุญาตให้การทำให้ Plugin เข้าที่ในช่วงซ่อมดำเนินต่อโดยไม่มี
  พรอมป์แบบโต้ตอบ แพ็กเกจ ClawHub อย่างเป็นทางการและซอร์ส Plugin OpenClaw
  ที่รวมมากับระบบจะข้ามพรอมป์ความน่าเชื่อถือของรุ่นนี้
- `--no-restart`: รับไว้เพื่อให้สอดคล้องกับคำสั่ง update; repair จะไม่รีสตาร์ต
  Gateway

`openclaw update repair` รัน `openclaw doctor --fix`, โหลด config และบันทึกการติดตั้ง
ที่ซ่อมแล้วใหม่, ซิงก์ Plugin ที่ติดตามไว้สำหรับช่องทางอัปเดตที่ใช้งานอยู่,
อัปเดตการติดตั้ง Plugin npm ที่จัดการไว้, ซ่อม payload ของ Plugin ที่กำหนดค่าไว้แต่ขาดหาย,
รีเฟรช Plugin registry และเขียนข้อมูลเมตาบันทึกการติดตั้งที่เข้าที่แล้ว
คำสั่งนี้ไม่ติดตั้งแพ็กเกจ core ใหม่และไม่รีสตาร์ต Gateway

## `update wizard`

โฟลว์แบบโต้ตอบเพื่อเลือกช่องทางอัปเดตและยืนยันว่าจะรีสตาร์ต Gateway
หลังอัปเดตหรือไม่ (ค่าเริ่มต้นคือรีสตาร์ต) หากคุณเลือก `dev` โดยไม่มี git checkout ระบบจะ
เสนอให้สร้างให้

ตัวเลือก:

- `--timeout <seconds>`: ระยะหมดเวลาสำหรับแต่ละขั้นตอนอัปเดต (ค่าเริ่มต้น `1800`)

## สิ่งที่ทำ

เมื่อคุณสลับช่องทางอย่างชัดเจน (`--channel ...`) OpenClaw จะคงวิธีการ
ติดตั้งให้สอดคล้องด้วย:

- `dev` → ทำให้แน่ใจว่ามี git checkout (ค่าเริ่มต้น: `~/openclaw` หรือ `$OPENCLAW_HOME/openclaw` เมื่อ
  ตั้งค่า `OPENCLAW_HOME`; แทนที่ได้ด้วย `OPENCLAW_GIT_DIR`),
  อัปเดต checkout นั้น และติดตั้ง CLI แบบ global จาก checkout นั้น
- `stable` → ติดตั้งจาก npm โดยใช้ `latest`
- `beta` → เลือกใช้ npm dist-tag `beta` ก่อน แต่ fallback ไปที่ `latest` เมื่อ beta
  ไม่มีหรือเก่ากว่ารุ่น stable ปัจจุบัน

ตัวอัปเดตอัตโนมัติของ core Gateway (เมื่อเปิดใช้ผ่าน config) จะเปิดเส้นทางอัปเดต CLI
นอกตัวจัดการคำขอ Gateway ที่กำลังทำงานอยู่ การอัปเดตผ่านตัวจัดการแพ็กเกจ
`update.run` ของระนาบควบคุมและการอัปเดต git-checkout ที่ถูกควบคุมดูแลจะใช้
การส่งต่อให้บริการที่จัดการไว้เช่นกัน แทนการแทนที่แผนผังแพ็กเกจหรือ rebuild
`dist/` ภายในกระบวนการ Gateway ที่กำลังทำงาน Gateway จะเริ่มตัวช่วยแบบ detached,
ออกจากกระบวนการ และตัวช่วยจะรันเส้นทาง CLI ปกติ `openclaw update --yes --json`
จากนอกแผนผังกระบวนการ Gateway หากการส่งต่อนั้นใช้ไม่ได้
`update.run` จะส่งคืนคำตอบแบบมีโครงสร้างพร้อมคำสั่ง shell ที่ปลอดภัยให้รัน
ด้วยตนเอง

สำหรับการติดตั้งผ่านตัวจัดการแพ็กเกจ `openclaw update` จะ resolve เวอร์ชันแพ็กเกจเป้าหมาย
ก่อนเรียกใช้ตัวจัดการแพ็กเกจ การติดตั้ง npm แบบ global ใช้การติดตั้งแบบจัดเตรียม:
OpenClaw ติดตั้งแพ็กเกจใหม่ลงใน npm prefix ชั่วคราว ตรวจสอบ
inventory ของ `dist` ที่แพ็กไว้ที่นั่น แล้วสลับแผนผังแพ็กเกจสะอาดนั้นเข้าไปใน
global prefix จริง หากการตรวจสอบล้มเหลว doctor หลังอัปเดต, การซิงก์ Plugin และ
งานรีสตาร์ตจะไม่รันจากแผนผังที่น่าสงสัยนั้น แม้เมื่อเวอร์ชันที่ติดตั้ง
ตรงกับเป้าหมายอยู่แล้ว คำสั่งจะรีเฟรชการติดตั้งแพ็กเกจ global,
จากนั้นรันการซิงก์ Plugin, การรีเฟรช completion ของคำสั่ง core และงานรีสตาร์ต สิ่งนี้
ช่วยให้ sidecar ที่แพ็กไว้และบันทึก Plugin ที่ช่องทางเป็นเจ้าของสอดคล้องกับ
build OpenClaw ที่ติดตั้งอยู่ โดยปล่อยการ rebuild completion ของคำสั่ง Plugin ทั้งหมดให้กับ
การรัน `openclaw completion --write-state` ที่สั่งอย่างชัดเจน

เมื่อบริการ Gateway ที่จัดการไว้แบบ local ติดตั้งอยู่และเปิดใช้การรีสตาร์ต
การอัปเดตผ่านตัวจัดการแพ็กเกจและ git-checkout จะหยุดบริการที่กำลังรันก่อน
แทนที่แผนผังแพ็กเกจหรือเปลี่ยนแปลง checkout/build output จากนั้นตัวอัปเดต
จะรีเฟรชข้อมูลเมตาบริการจากการติดตั้งที่อัปเดตแล้ว รีสตาร์ต
บริการ และตรวจสอบ Gateway ที่รีสตาร์ตก่อนรายงาน
`Gateway: restarted and verified.` การอัปเดตผ่านตัวจัดการแพ็กเกจยังตรวจสอบเพิ่มเติมว่า
Gateway ที่รีสตาร์ตรายงานเวอร์ชันแพ็กเกจที่คาดไว้; การอัปเดต git-checkout
ตรวจสอบสุขภาพ gateway และความพร้อมของบริการหลังการ rebuild บน macOS
การตรวจสอบหลังอัปเดตยังตรวจสอบว่า LaunchAgent ถูกโหลด/กำลังรันสำหรับโปรไฟล์ที่ใช้งานอยู่
และพอร์ต loopback ที่กำหนดค่าสุขภาพดี หากติดตั้ง plist แล้ว
แต่ launchd ไม่ได้ควบคุมดูแล OpenClaw จะ bootstrap LaunchAgent ใหม่
โดยอัตโนมัติ แล้วรันการตรวจสุขภาพ/เวอร์ชัน/ช่องทางซ้ำ การ bootstrap ใหม่
โหลดงาน RunAtLoad โดยตรง ดังนั้นการกู้คืนการอัปเดตจะไม่
`kickstart -k` Gateway ที่เพิ่ง spawn ทันที หาก Gateway ยัง
ไม่สุขภาพดี คำสั่งจะออกด้วย non-zero และพิมพ์ path บันทึกการรีสตาร์ต
พร้อมคำแนะนำการรีสตาร์ต, ติดตั้งใหม่ และ rollback แพ็กเกจอย่างชัดเจน หากรีสตาร์ต
รันไม่ได้ คำสั่งจะพิมพ์ `Gateway: restart skipped (...)` หรือ
`Gateway: restart failed: ...` พร้อมคำใบ้ `openclaw gateway restart` แบบทำเอง
เมื่อใช้ `--no-restart` การแทนที่แพ็กเกจหรือ rebuild git ยังคงรัน แต่
บริการที่จัดการไว้จะไม่ถูกหยุดหรือรีสตาร์ต ดังนั้น Gateway ที่กำลังรันอาจยังใช้โค้ดเก่า
จนกว่าคุณจะรีสตาร์ตด้วยตนเอง

### รูปแบบคำตอบของระนาบควบคุม

เมื่อเรียก `update.run` ผ่านระนาบควบคุมของ Gateway บนการติดตั้ง
ผ่านตัวจัดการแพ็กเกจหรือ git checkout ที่ถูกควบคุมดูแล ตัวจัดการจะรายงาน
การเริ่มต้น handoff แยกจากการอัปเดต CLI ที่ดำเนินต่อหลังจาก
Gateway ออก:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` และ
  `handoff.status: "started"` หมายความว่า Gateway สร้าง handoff ให้บริการที่จัดการไว้
  และกำหนดเวลาการรีสตาร์ตของตัวเอง เพื่อให้ตัวช่วยแบบ detached สามารถรัน
  `openclaw update --yes --json` นอกกระบวนการบริการที่กำลังทำงานอยู่
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` และ
  `handoff.status: "unavailable"` หมายความว่า OpenClaw ไม่พบขอบเขตบริการที่ควบคุมดูแล
  และตัวตนบริการที่คงทนสำหรับ handoff ที่ปลอดภัย ตัวอย่างเช่น
  handoff ของ systemd ต้องใช้อัตลักษณ์ unit ของ OpenClaw
  (`OPENCLAW_SYSTEMD_UNIT`) ไม่ใช่เพียงเครื่องหมายกระบวนการ systemd แวดล้อม
  คำตอบมี `handoff.command` ซึ่งเป็นคำสั่ง shell ที่ให้รันจากนอก
  Gateway
- `ok: false`, `result.reason: "managed-service-handoff-failed"` หมายความว่า
  Gateway พยายามสร้าง handoff แต่ไม่สามารถ spawn ตัวช่วยแบบ detached ได้

payload `sentinel` ยังคงถูกเขียนก่อน Gateway ออก และ handoff ของ CLI
อัปเดต restart sentinel เดียวกันหลังจากการตรวจสุขภาพการรีสตาร์ตบริการที่จัดการไว้
เสร็จสิ้น ระหว่าง handoff sentinel อาจมี
`stats.reason: "restart-health-pending"` โดยไม่มี continuation สำเร็จ;
Gateway ที่รีสตาร์ตจะ polling ต่อไป และจะเรียก continuation หลังจาก CLI
ตรวจสอบสุขภาพบริการและเขียน sentinel ใหม่พร้อมผลลัพธ์ `ok` สุดท้ายแล้วเท่านั้น
`openclaw status` และ `openclaw status --all` แสดงแถว `Update restart`
ขณะที่ sentinel นั้นค้างอยู่หรือล้มเหลว และ `update.status` จะรีเฟรชและ
ส่งคืน sentinel ล่าสุด

## โฟลว์ git checkout

### การเลือกช่องทาง

- `stable`: checkout tag non-beta ล่าสุด แล้ว build และ doctor
- `beta`: เลือก tag `-beta` ล่าสุดก่อน แต่ fallback ไปที่ tag stable ล่าสุดเมื่อ beta ไม่มีหรือเก่ากว่า
- `dev`: checkout `main` แล้ว fetch และ rebase

### ขั้นตอนอัปเดต

<Steps>
  <Step title="ตรวจสอบ worktree ที่สะอาด">
    ต้องไม่มีการเปลี่ยนแปลงที่ยังไม่ได้ commit
  </Step>
  <Step title="สลับช่องทาง">
    สลับไปยังช่องทางที่เลือก (tag หรือ branch)
  </Step>
  <Step title="ดึง upstream">
    สำหรับ dev เท่านั้น
  </Step>
  <Step title="บิลด์ preflight (สำหรับ dev เท่านั้น)">
    รันการบิลด์ TypeScript ใน worktree ชั่วคราว หาก tip ล้มเหลว จะย้อนกลับไปสูงสุด 10 commits เพื่อหา commit ล่าสุดที่บิลด์ได้ ตั้งค่า `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` เพื่อรัน lint ระหว่าง preflight นี้ด้วย; lint จะรันในโหมด serial ที่จำกัดทรัพยากร เพราะโฮสต์อัปเดตของผู้ใช้มักมีขนาดเล็กกว่า CI runners
  </Step>
  <Step title="Rebase">
    rebase ไปยัง commit ที่เลือก (สำหรับ dev เท่านั้น)
  </Step>
  <Step title="ติดตั้ง dependencies">
    ใช้ package manager ของ repo สำหรับ checkout ที่ใช้ pnpm ตัวอัปเดตจะ bootstrap `pnpm` เมื่อต้องใช้ (ผ่าน `corepack` ก่อน แล้วจึง fallback เป็น `npm install pnpm@11` ชั่วคราว) แทนการรัน `npm run build` ภายใน pnpm workspace
  </Step>
  <Step title="บิลด์ Control UI">
    บิลด์ gateway และ Control UI
  </Step>
  <Step title="รัน doctor">
    `openclaw doctor` รันเป็นการตรวจสอบ safe-update ขั้นสุดท้าย
  </Step>
  <Step title="ซิงค์ plugins">
    ซิงค์ plugins ไปยังช่องทางที่ใช้งานอยู่ dev ใช้ plugins ที่ bundle มา; stable และ beta ใช้ npm อัปเดตการติดตั้ง plugin ที่ติดตามไว้
  </Step>
</Steps>

บนช่องทางอัปเดต beta การติดตั้ง plugin จาก npm และ ClawHub ที่ติดตามไว้ซึ่งตามสาย default/latest
จะลองใช้ release `@beta` ของ plugin ก่อน หาก plugin ไม่มี release beta
OpenClaw จะ fallback ไปยัง spec default/latest ที่บันทึกไว้และรายงาน
เป็นคำเตือน สำหรับ plugins ของ npm OpenClaw จะ fallback ด้วยเมื่อมี
package beta อยู่แต่ไม่ผ่านการตรวจสอบการติดตั้ง คำเตือน fallback ของ plugin เหล่านี้
จะไม่ทำให้การอัปเดต core ล้มเหลว เวอร์ชันแบบเจาะจงและ tags แบบชัดเจนจะไม่ถูก
เขียนทับ

<Warning>
หากการอัปเดต npm plugin ที่ pin แบบเจาะจง resolve ไปยัง artifact ที่มี integrity ต่างจากบันทึกการติดตั้งที่จัดเก็บไว้ `openclaw update` จะยกเลิกการอัปเดต artifact ของ plugin นั้นแทนการติดตั้ง ให้ติดตั้งใหม่หรืออัปเดต plugin อย่างชัดเจนหลังจากตรวจสอบแล้วเท่านั้นว่าคุณเชื่อถือ artifact ใหม่
</Warning>

<Note>
ความล้มเหลวในการซิงค์ plugin หลังอัปเดตที่จำกัดอยู่กับ plugin ที่มีการจัดการ และเส้นทางซิงค์สามารถเลี่ยงได้ (เช่น npm registry ที่เข้าถึงไม่ได้สำหรับ plugin ที่ไม่จำเป็น) จะถูกรายงานเป็นคำเตือนหลังจากการอัปเดต core สำเร็จ ผลลัพธ์ JSON จะคง `status: "ok"` ระดับบนสุดไว้ และรายงาน `postUpdate.plugins.status: "warning"` พร้อมคำแนะนำ `openclaw update repair` และ `openclaw plugins inspect <id> --runtime --json` ข้อยกเว้นที่ไม่คาดคิดจากตัวอัปเดตหรือการซิงค์ยังคงทำให้ผลลัพธ์การอัปเดตล้มเหลว แก้ข้อผิดพลาดการติดตั้งหรืออัปเดต plugin แล้วรัน `openclaw update repair` อีกครั้ง

หลังขั้นตอนซิงค์ราย plugin แล้ว `openclaw update` จะรัน pass **การรวมตัวหลัง core** ที่บังคับก่อน Gateway จะถูกรีสตาร์ต: ระบบจะซ่อม payloads ของ plugin ที่กำหนดค่าไว้ซึ่งขาดหาย ตรวจสอบบันทึกการติดตั้งที่ติดตามไว้แต่ละรายการที่ _ใช้งานอยู่_ บนดิสก์ และตรวจสอบแบบ static ว่า `package.json` ของรายการนั้น parse ได้ (และ `main` ที่ประกาศไว้อย่างชัดเจนมีอยู่จริง ถ้ามี) ความล้มเหลวจาก pass นี้ รวมถึง snapshot config ของ OpenClaw ที่ไม่ถูกต้อง จะส่งคืน `postUpdate.plugins.status: "error"` และเปลี่ยน `status` การอัปเดตระดับบนสุดเป็น `"error"` ดังนั้น `openclaw update` จะออกด้วยค่าที่ไม่ใช่ศูนย์ และ Gateway จะ _ไม่_ ถูกรีสตาร์ตพร้อมชุด plugin ที่ยังไม่ได้ตรวจสอบ ข้อผิดพลาดจะมีบรรทัด `postUpdate.plugins.warnings[].guidance` แบบมีโครงสร้างที่ชี้ไปยัง `openclaw update repair` และ `openclaw plugins inspect <id> --runtime --json` สำหรับการติดตามผล รายการ plugin ที่ปิดใช้งานและบันทึกที่ไม่ได้เป็นเป้าหมายซิงค์อย่างเป็นทางการที่เชื่อมกับ trusted-source จะถูกข้ามที่นี่ ซึ่งสอดคล้องกับนโยบาย `skipDisabledPlugins` ที่ใช้โดยการตรวจสอบ payload ที่ขาดหาย ดังนั้นบันทึก plugin ที่ปิดใช้งานซึ่งล้าสมัยจึงไม่สามารถบล็อกการอัปเดตที่ถูกต้องในส่วนอื่นได้

เมื่อ Gateway ที่อัปเดตแล้วเริ่มทำงาน การโหลด plugin จะเป็นแบบตรวจสอบเท่านั้น: การเริ่มต้นจะไม่
รัน package managers หรือแก้ไข dependency trees การรีสตาร์ต `update.run`
ของ package manager จะถูกส่งต่อไปยังเส้นทาง managed-service ของ CLI ดังนั้นการสลับ package จึงเกิดขึ้น
นอกโปรเซส Gateway เดิม และการตรวจสอบ service health จะตัดสินว่าการ
อัปเดตรายงานว่าเสร็จสมบูรณ์ได้หรือไม่

หาก bootstrap pnpm ยังคงล้มเหลว ตัวอัปเดตจะหยุดตั้งแต่ต้นพร้อมข้อผิดพลาดเฉพาะ package manager แทนการลอง `npm run build` ภายใน checkout
</Note>

## รูปแบบย่อ `--update`

`openclaw --update` จะ rewrite เป็น `openclaw update` (มีประโยชน์สำหรับ shells และ launcher scripts)

## ที่เกี่ยวข้อง

- `openclaw doctor` (เสนอให้รัน update ก่อนบน git checkouts)
- [ช่องทางพัฒนา](/th/install/development-channels)
- [การอัปเดต](/th/install/updating)
- [เอกสารอ้างอิง CLI](/th/cli)
