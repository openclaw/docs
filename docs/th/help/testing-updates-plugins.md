---
read_when:
    - การเปลี่ยนแปลงพฤติกรรมการอัปเดต, doctor, การยอมรับแพ็กเกจ หรือการติดตั้ง Plugin ของ OpenClaw
    - การเตรียมหรืออนุมัติรุ่นที่เสนอให้เผยแพร่
    - การดีบักการอัปเดตแพ็กเกจ การล้างการพึ่งพาของ Plugin หรือปัญหาการถดถอยในการติดตั้ง Plugin
sidebarTitle: Update and plugin tests
summary: วิธีที่ OpenClaw ตรวจสอบความถูกต้องของเส้นทางการอัปเดต การไมเกรตแพ็กเกจ และพฤติกรรมการติดตั้ง/อัปเดต Plugin
title: 'การทดสอบ: การอัปเดตและ Plugin'
x-i18n:
    generated_at: "2026-05-05T06:18:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19ae526d3daa8a1b67cb2f74225138b3e1fa192c9f956c9dd6d0e407581b9ed9
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

นี่คือรายการตรวจสอบเฉพาะสำหรับการตรวจสอบการอัปเดตและ Plugin เป้าหมายคือ
เรียบง่าย: พิสูจน์ว่าแพ็กเกจที่ติดตั้งได้สามารถอัปเดตสถานะผู้ใช้จริง ซ่อมแซมสถานะ
เดิมที่ล้าสมัยผ่าน `doctor` และยังคงติดตั้ง โหลด อัปเดต และถอนการติดตั้ง
Plugin จากแหล่งที่รองรับได้

สำหรับแผนที่ตัวรันการทดสอบที่กว้างขึ้น ดู [การทดสอบ](/th/help/testing) สำหรับคีย์ผู้ให้บริการแบบสด
และชุดทดสอบที่แตะเครือข่าย ดู [การทดสอบแบบสด](/th/help/testing-live)

## สิ่งที่เราปกป้อง

การทดสอบการอัปเดตและ Plugin ปกป้องสัญญาเหล่านี้:

- แพ็กเกจ tarball สมบูรณ์ มี `dist/postinstall-inventory.json` ที่ถูกต้อง
  และไม่พึ่งพาไฟล์ repo ที่ยังไม่ได้แพ็ก
- ผู้ใช้สามารถย้ายจากแพ็กเกจเก่าที่เผยแพร่แล้วไปยังแพ็กเกจผู้สมัคร
  โดยไม่สูญเสีย config, agents, sessions, workspaces, รายการอนุญาต Plugin หรือ
  config ของช่องทาง
- `openclaw doctor --fix --non-interactive` เป็นเจ้าของเส้นทางล้างข้อมูลและซ่อมแซม
  แบบเดิม การเริ่มต้นไม่ควรเพิ่ม migration ความเข้ากันได้ที่ซ่อนอยู่สำหรับสถานะ
  Plugin ที่ล้าสมัย
- การติดตั้ง Plugin ทำงานได้จากไดเรกทอรีภายในเครื่อง, git repos, แพ็กเกจ npm และ
  เส้นทางรีจิสทรี ClawHub
- dependency ของ Plugin npm ถูกติดตั้งในราก npm ที่จัดการไว้ ถูกสแกนก่อน
  trust และถูกลบผ่าน npm ระหว่างถอนการติดตั้ง เพื่อไม่ให้ dependency ที่ถูก hoist
  ค้างอยู่
- การอัปเดต Plugin เสถียรเมื่อไม่มีอะไรเปลี่ยน: ระเบียนการติดตั้ง แหล่งที่ resolve แล้ว
  โครงสร้าง dependency ที่ติดตั้ง และสถานะเปิดใช้งานยังคงเดิม

## หลักฐานภายในเครื่องระหว่างการพัฒนา

เริ่มแบบแคบ:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

สำหรับการเปลี่ยนแปลงการติดตั้ง Plugin การถอนการติดตั้ง dependency หรือ package-inventory ให้รัน
การทดสอบเฉพาะจุดที่ครอบคลุม seam ที่แก้ไขด้วย:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

ก่อนที่ Docker lane ของแพ็กเกจใดจะใช้ tarball ให้พิสูจน์ artifact ของแพ็กเกจ:

```bash
pnpm release:check
```

`release:check` รันการตรวจสอบ drift ของ config/docs/API เขียน package dist
inventory รัน `npm pack --dry-run` ปฏิเสธไฟล์ที่ห้ามถูกแพ็ก ติดตั้ง
tarball ลงใน prefix ชั่วคราว รัน postinstall และ smoke entrypoint ของช่องทาง
ที่ bundle มา

## Docker lanes

Docker lanes คือหลักฐานระดับผลิตภัณฑ์ พวกมันติดตั้งหรืออัปเดตแพ็กเกจจริง
ภายในคอนเทนเนอร์ Linux และ assert พฤติกรรมผ่านคำสั่ง CLI,
การเริ่มต้น Gateway, HTTP probes, สถานะ RPC และสถานะระบบไฟล์

ใช้ lane เฉพาะจุดระหว่างวนแก้ไข:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

lane สำคัญ:

- `test:docker:plugins` ตรวจสอบ smoke การติดตั้ง Plugin, การติดตั้งโฟลเดอร์ภายในเครื่อง,
  พฤติกรรมข้ามการอัปเดตของโฟลเดอร์ภายในเครื่อง, โฟลเดอร์ภายในเครื่องที่มี
  dependency ติดตั้งไว้ล่วงหน้า, การติดตั้งแพ็กเกจ `file:`, การติดตั้ง git พร้อมการรัน CLI,
  การอัปเดต moving-ref ของ git, การติดตั้งจากรีจิสทรี npm พร้อม dependency เชิงส่งผ่าน
  ที่ถูก hoist, npm update แบบ no-op, การติดตั้ง fixture ClawHub ภายในเครื่องและ update
  แบบ no-op, พฤติกรรมการอัปเดต marketplace และการ enable/inspect Claude-bundle ตั้งค่า
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อให้บล็อก ClawHub เป็นแบบ hermetic/offline
- `test:docker:plugin-lifecycle-matrix` ติดตั้งแพ็กเกจผู้สมัครในคอนเทนเนอร์เปล่า
  รัน Plugin npm ผ่าน install, inspect, disable, enable,
  upgrade แบบระบุชัดเจน, downgrade แบบระบุชัดเจน และ uninstall หลังลบโค้ด Plugin
  มันบันทึก metrics ของ RSS และ CPU สำหรับแต่ละ phase
- `test:docker:plugin-update` ตรวจสอบว่า Plugin ที่ติดตั้งแล้วและไม่เปลี่ยนแปลง
  จะไม่ reinstall หรือสูญเสีย metadata การติดตั้งระหว่าง `openclaw plugins update`
- `test:docker:upgrade-survivor` ติดตั้ง tarball ผู้สมัครทับ fixture ผู้ใช้เก่า
  ที่มีสถานะสกปรก รัน package update พร้อม doctor แบบ non-interactive จากนั้นเริ่ม
  Gateway แบบ loopback และตรวจสอบการรักษาสถานะ
- `test:docker:published-upgrade-survivor` ติดตั้ง baseline ที่เผยแพร่แล้วก่อน
  config ผ่านสูตร `openclaw config set` ที่ bake ไว้ อัปเดตไปยัง
  tarball ผู้สมัคร รัน doctor ตรวจสอบการล้างข้อมูลเดิม เริ่ม Gateway และ
  probe `/healthz`, `/readyz` และสถานะ RPC
- `test:docker:update-restart-auth` ติดตั้งแพ็กเกจผู้สมัคร เริ่ม
  Gateway แบบ managed token-auth ยกเลิก env ของ caller gateway auth สำหรับ
  `openclaw update --yes --json` และกำหนดให้คำสั่งอัปเดตผู้สมัคร
  restart Gateway ก่อน probe ปกติ
- `test:docker:update-migration` คือ lane published-update ที่เน้นการล้างข้อมูลมาก
  เริ่มจากสถานะผู้ใช้สไตล์ Discord/Telegram ที่ config ไว้ รัน baseline
  doctor เพื่อให้ dependency ของ Plugin ที่ config ไว้มีโอกาส materialize, seed
  เศษ dependency เดิมของ Plugin สำหรับ Plugin ที่แพ็กไว้และ config แล้ว อัปเดตไปยัง
  tarball ผู้สมัคร และกำหนดให้ doctor หลังอัปเดตลบราก dependency เดิม

variant ของ published-upgrade survivor ที่มีประโยชน์:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

scenario ที่มีคือ `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path` และ `versioned-runtime-deps` ในการรันแบบรวม,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` ขยายเป็น scenario ทั้งหมด
ที่มีรูปทรงตาม issue ที่ถูกรายงาน รวมถึง migration การติดตั้ง Plugin ที่ config ไว้

Full update migration ถูกแยกออกจาก Full Release CI โดยตั้งใจ ใช้
workflow `Update Migration` แบบ manual เมื่อคำถามของ release คือ "ทุก
stable release ที่เผยแพร่ตั้งแต่ 2026.4.23 เป็นต้นไปสามารถอัปเดตเป็นผู้สมัครนี้และ
ล้างเศษ dependency ของ Plugin ได้หรือไม่?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance คือ gate แพ็กเกจแบบ native ของ GitHub มัน resolve แพ็กเกจผู้สมัครหนึ่งรายการ
เป็น tarball `package-under-test` บันทึกเวอร์ชันและ SHA-256 จากนั้น
รัน Docker E2E lanes ที่นำกลับมาใช้ซ้ำกับ tarball ที่แน่นอนนั้น harness ของ workflow
ใช้ ref แยกจาก ref ของแหล่งแพ็กเกจ ดังนั้นตรรกะการทดสอบปัจจุบันจึงตรวจสอบ
release เก่าที่ trust แล้วได้

แหล่งของผู้สมัคร:

- `source=npm`: ตรวจสอบ `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันที่เผยแพร่แล้ว
  แบบระบุชัดเจน
- `source=ref`: แพ็ก branch, tag หรือ commit ที่ trust แล้วด้วย harness ปัจจุบัน
  ที่เลือก
- `source=url`: ตรวจสอบ HTTPS tarball พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: นำ tarball ที่อัปโหลดโดย Actions run อื่นกลับมาใช้ซ้ำ

Full Release Validation ใช้ `source=artifact` เป็นค่าเริ่มต้น ซึ่งสร้างจาก
release SHA ที่ resolve แล้ว สำหรับหลักฐานหลัง publish ให้ส่ง
`package_acceptance_package_spec=openclaw@YYYY.M.D` เพื่อให้ upgrade matrix เดียวกัน
เล็งไปที่แพ็กเกจ npm ที่ส่งมอบแล้วแทน

Release checks เรียก Package Acceptance ด้วยชุด package/update/restart/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

เมื่อเปิด release soak พวกมันยังส่ง:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

สิ่งนี้ทำให้ package migration, การสลับ update channel, การล้าง dependency ของ Plugin ที่ล้าสมัย,
coverage ของ Plugin แบบ offline, พฤติกรรมการอัปเดต Plugin และ QA แพ็กเกจ Telegram
อยู่บน artifact ที่ resolve เดียวกัน โดยไม่ทำให้ gate แพ็กเกจ release ค่าเริ่มต้น
เดินผ่านทุก release ที่เผยแพร่

`last-stable-4` resolve เป็น release OpenClaw stable ล่าสุดสี่รายการที่เผยแพร่บน npm
Package acceptance ของ release pin `2026.4.23` เป็น boundary ความเข้ากันได้
แรกของ plugin-update, `2026.5.2` เป็น boundary ความปั่นป่วนของสถาปัตยกรรม Plugin และ
`2026.4.15` เป็น baseline published-update เก่าของ 2026.4.1x; resolver
dedupe pin ที่อยู่ในสี่รายการล่าสุดแล้ว สำหรับ coverage migration published
update แบบ exhaustive ให้ใช้ `all-since-2026.4.23` ใน workflow Update
Migration ที่แยกต่างหากแทน Full Release CI `release-history` ยังคง
พร้อมใช้งานสำหรับการสุ่มตัวอย่างที่กว้างขึ้นแบบ manual เมื่อคุณต้องการ anchor แบบเดิมก่อนวันที่กำหนดด้วย

เมื่อเลือก baseline published-upgrade survivor หลายรายการ workflow Docker ที่นำกลับมาใช้ซ้ำ
จะแยก shard แต่ละ baseline เป็น targeted runner job ของตัวเอง แต่ละ
baseline shard ยังคงรันชุด scenario ที่เลือก แต่ logs และ artifacts จะอยู่
แยกตาม baseline และ wall time ถูกจำกัดด้วย shard ที่ช้าที่สุดแทนที่จะเป็น
serial job ขนาดใหญ่หนึ่งงาน

รัน package profile แบบ manual เมื่อตรวจสอบผู้สมัครก่อน release:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

ใช้ `suite_profile=product` เมื่อคำถามของ release รวมถึงช่องทาง MCP,
การล้าง cron/subagent, OpenAI web search หรือ OpenWebUI ใช้ `suite_profile=full`
เฉพาะเมื่อคุณต้องการ coverage ของ Docker release-path แบบเต็ม

## ค่าเริ่มต้นของ release

สำหรับ release candidate ชุดหลักฐานค่าเริ่มต้นคือ:

1. `pnpm check:changed` และ `pnpm test:changed` สำหรับ regression ระดับซอร์ส
2. `pnpm release:check` สำหรับความสมบูรณ์ของ artifact แพ็กเกจ
3. Package Acceptance profile `package` หรือ lane แพ็กเกจแบบกำหนดเองของ release-check
   สำหรับสัญญา install/update/restart/plugin
4. Cross-OS release checks สำหรับ installer, onboarding และพฤติกรรมแพลตฟอร์ม
   เฉพาะ OS
5. ชุดทดสอบแบบสดเฉพาะเมื่อพื้นผิวที่เปลี่ยนแตะพฤติกรรมผู้ให้บริการหรือ hosted-service

บนเครื่องของ maintainer gate กว้างและหลักฐานผลิตภัณฑ์ Docker/package ควรรัน
ใน Testbox เว้นแต่จะทำหลักฐานภายในเครื่องอย่างชัดเจน

## ความเข้ากันได้แบบเดิม

การผ่อนปรนด้านความเข้ากันได้แคบและมีกรอบเวลา:

- แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจ tolerate
  ช่องว่าง metadata ของแพ็กเกจที่ส่งมอบไปแล้วใน Package Acceptance
- แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจ warn สำหรับไฟล์ local build metadata stamp
  ที่ส่งมอบไปแล้ว
- แพ็กเกจหลังจากนั้นต้องเป็นไปตามสัญญาสมัยใหม่ ช่องว่างเดียวกันจะ fail แทนที่จะ
  warn หรือ skip

อย่าเพิ่ม startup migration ใหม่สำหรับรูปทรงเก่าเหล่านี้ เพิ่มหรือขยายการซ่อมแซมของ doctor
จากนั้นพิสูจน์ด้วย `upgrade-survivor`, `published-upgrade-survivor` หรือ
`update-restart-auth` เมื่อคำสั่งอัปเดตเป็นเจ้าของการ restart

## การเพิ่ม coverage

เมื่อเปลี่ยนพฤติกรรมการอัปเดตหรือ Plugin ให้เพิ่ม coverage ที่เลเยอร์ต่ำที่สุดที่
สามารถ fail ด้วยเหตุผลที่ถูกต้อง:

- ตรรกะ path หรือ metadata ล้วน: unit test ข้างซอร์ส
- พฤติกรรม package inventory หรือ packed-file: `package-dist-inventory` หรือการทดสอบตัวตรวจ tarball
- พฤติกรรม CLI install/update: assertion หรือ fixture ของ Docker lane
- พฤติกรรม migration ของ published-release: scenario `published-upgrade-survivor`
- พฤติกรรม restart ที่ update เป็นเจ้าของ: `update-restart-auth`
- พฤติกรรม registry/package source: fixture `test:docker:plugins` หรือเซิร์ฟเวอร์ fixture ClawHub
- พฤติกรรมโครงสร้างหรือการล้าง dependency: assert ทั้ง runtime execution และ
  boundary ของระบบไฟล์ dependency ของ npm อาจถูก hoist ใต้ราก npm
  ที่จัดการไว้ ดังนั้นการทดสอบควรพิสูจน์ว่ารากถูกสแกน/ล้าง แทนที่จะสมมติว่าเป็น
  tree `node_modules` ภายในแพ็กเกจ

ให้ fixture Docker ใหม่เป็นแบบ hermetic โดยค่าเริ่มต้น ใช้รีจิสทรี fixture ภายในเครื่องและ
แพ็กเกจปลอม เว้นแต่จุดประสงค์ของการทดสอบคือพฤติกรรมรีจิสทรีแบบสด

## การคัดแยกความล้มเหลว

เริ่มจากตัวตนของ artifact:

- สรุป Package Acceptance `resolve_package`: แหล่งที่มา, เวอร์ชัน, SHA-256 และ
  ชื่ออาร์ติแฟกต์
- อาร์ติแฟกต์ Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, บันทึก lane และคำสั่ง rerun
- สรุป upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  รวมถึงเวอร์ชัน baseline, เวอร์ชัน candidate, สถานการณ์, เวลาของแต่ละเฟส และ
  ขั้นตอน recipe

ควร rerun lane ที่ล้มเหลวเดิมแบบตรงตัวด้วยอาร์ติแฟกต์แพ็กเกจเดียวกันมากกว่า
rerun release umbrella ทั้งหมด
