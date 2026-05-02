---
read_when:
    - การเปลี่ยนแปลงลักษณะการทำงานของการอัปเดต OpenClaw, การตรวจวินิจฉัย, การยอมรับแพ็กเกจ หรือการติดตั้ง Plugin
    - การเตรียมหรืออนุมัติรุ่นที่เข้าข่ายเผยแพร่
    - การดีบักการถดถอยของการอัปเดตแพ็กเกจ การล้าง dependency ของ Plugin หรือการติดตั้ง Plugin
sidebarTitle: Update and plugin tests
summary: วิธีที่ OpenClaw ตรวจสอบเส้นทางการอัปเดต การไมเกรตแพ็กเกจ และพฤติกรรมการติดตั้ง/อัปเดต Plugin
title: 'การทดสอบ: การอัปเดตและ Plugin'
x-i18n:
    generated_at: "2026-05-02T10:19:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1999106b52d2539a6ee0fd7cd88ebb3515c8726e080d4031d7bf421fb99de36
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

นี่คือรายการตรวจสอบเฉพาะสำหรับการตรวจสอบการอัปเดตและ Plugin เป้าหมายคือ
เรียบง่าย: พิสูจน์ว่าแพ็กเกจที่ติดตั้งได้สามารถอัปเดตสถานะผู้ใช้จริง ซ่อมแซมสถานะ
ดั้งเดิมที่ล้าสมัยผ่าน `doctor` และยังคงติดตั้ง โหลด อัปเดต และถอนการติดตั้ง
Plugin จากแหล่งที่รองรับได้

สำหรับแผนผังตัวรันการทดสอบที่กว้างกว่า โปรดดู [การทดสอบ](/th/help/testing) สำหรับคีย์ผู้ให้บริการแบบ live
และชุดทดสอบที่แตะเครือข่าย โปรดดู [การทดสอบแบบ live](/th/help/testing-live)

## สิ่งที่เราปกป้อง

การทดสอบการอัปเดตและ Plugin ปกป้องสัญญาเหล่านี้:

- tarball ของแพ็กเกจต้องครบถ้วน มี `dist/postinstall-inventory.json` ที่ถูกต้อง
  และไม่พึ่งพาไฟล์ repo ที่ยังไม่ได้แพ็ก
- ผู้ใช้สามารถย้ายจากแพ็กเกจที่เผยแพร่รุ่นเก่าไปยังแพ็กเกจตัวเลือก
  โดยไม่สูญเสีย config, agents, sessions, workspaces, รายการอนุญาต Plugin หรือ
  config ของช่องทาง
- `openclaw doctor --fix --non-interactive` เป็นเจ้าของเส้นทางการล้างและซ่อมแซมดั้งเดิม
  Startup ไม่ควรเพิ่ม migration ความเข้ากันได้แบบซ่อนสำหรับสถานะ
  Plugin ที่ล้าสมัย
- การติดตั้ง Plugin ทำงานได้จากไดเรกทอรี local, git repos, แพ็กเกจ npm และ
  เส้นทาง registry ของ ClawHub
- dependency ของ npm สำหรับ Plugin ถูกติดตั้งใน npm root ที่จัดการไว้ ถูกสแกนก่อน
  trust และถูกลบผ่าน npm ระหว่างการถอนการติดตั้ง เพื่อให้ dependency ที่ถูก hoist ไม่
  ค้างอยู่
- การอัปเดต Plugin เสถียรเมื่อไม่มีอะไรเปลี่ยน: install records, resolved
  source, layout ของ dependency ที่ติดตั้ง และสถานะ enabled ยังคงเหมือนเดิม

## หลักฐาน local ระหว่างการพัฒนา

เริ่มแบบแคบ:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

สำหรับการเปลี่ยนแปลงการติดตั้ง การถอนการติดตั้ง dependency หรือ package-inventory ของ Plugin ให้
รันการทดสอบเฉพาะจุดที่ครอบคลุม seam ที่แก้ไขด้วย:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

ก่อนที่ lane Docker ของแพ็กเกจใดๆ จะใช้ tarball ให้พิสูจน์ artifact ของแพ็กเกจก่อน:

```bash
pnpm release:check
```

`release:check` รันการตรวจ drift ของ config/docs/API, เขียน package dist
inventory, รัน `npm pack --dry-run`, ปฏิเสธไฟล์ที่ห้ามแพ็ก, ติดตั้ง
tarball ลงใน temp prefix, รัน postinstall และ smoke entrypoint ของช่องทางที่ bundle มา

## Docker lanes

Docker lanes คือหลักฐานระดับผลิตภัณฑ์ พวกมันติดตั้งหรืออัปเดตแพ็กเกจจริง
ภายในคอนเทนเนอร์ Linux และ assert behavior ผ่านคำสั่ง CLI,
การเริ่ม Gateway, HTTP probes, สถานะ RPC และสถานะ filesystem

ใช้ lane เฉพาะจุดระหว่าง iterate:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

lane สำคัญ:

- `test:docker:plugins` ตรวจสอบ smoke ของการติดตั้ง Plugin, การติดตั้งจากโฟลเดอร์ local,
  พฤติกรรมการข้ามอัปเดตของโฟลเดอร์ local, โฟลเดอร์ local ที่มี
  dependency ติดตั้งไว้ล่วงหน้า, การติดตั้งแพ็กเกจ `file:`, การติดตั้งจาก git พร้อมการรัน CLI, การอัปเดต
  moving-ref ของ git, การติดตั้งจาก npm registry พร้อม transitive
  dependency ที่ถูก hoist, no-op ของการอัปเดต npm, การติดตั้ง fixture ClawHub local และ update
  no-op, พฤติกรรม marketplace update และการ enable/inspect Claude-bundle ตั้งค่า
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อให้บล็อก ClawHub hermetic/offline
- `test:docker:plugin-update` ตรวจสอบว่า Plugin ที่ติดตั้งไว้และไม่เปลี่ยนแปลง
  จะไม่ติดตั้งซ้ำหรือสูญเสีย metadata การติดตั้งระหว่าง `openclaw plugins update`
- `test:docker:upgrade-survivor` ติดตั้ง tarball ตัวเลือกทับ fixture ผู้ใช้เก่าที่สกปรก
  รัน package update พร้อม doctor แบบ non-interactive จากนั้นเริ่ม
  Gateway แบบ loopback และตรวจการคงสถานะ
- `test:docker:published-upgrade-survivor` ติดตั้ง baseline ที่เผยแพร่ก่อน
  config ผ่านสูตร `openclaw config set` ที่ baked ไว้ อัปเดตไปยัง
  tarball ตัวเลือก รัน doctor ตรวจการล้าง legacy เริ่ม Gateway และ
  probe `/healthz`, `/readyz` และสถานะ RPC
- `test:docker:update-migration` คือ lane published-update ที่เน้นการล้างอย่างหนัก มัน
  เริ่มจากสถานะผู้ใช้แบบ Discord/Telegram ที่ config ไว้ รัน baseline
  doctor เพื่อให้ dependency ของ Plugin ที่ config ไว้มีโอกาสเกิดขึ้นจริง, seed
  เศษซาก dependency ดั้งเดิมของ Plugin สำหรับ Plugin แบบ packaged ที่ config ไว้, อัปเดตไปยัง
  tarball ตัวเลือก และกำหนดให้ post-update doctor ลบ root ของ dependency
  ดั้งเดิม

variant ของ published-upgrade survivor ที่มีประโยชน์:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

scenario ที่ใช้ได้คือ `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `tilde-log-path` และ `versioned-runtime-deps` ในการรันแบบรวม,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` จะขยายเป็น scenario รูปแบบ reported
issue ทั้งหมด

Full update migration แยกจาก Full Release CI โดยตั้งใจ ใช้
workflow `Update Migration` แบบ manual เมื่อคำถามของ release คือ "ทุก
stable release ที่เผยแพร่ตั้งแต่ 2026.4.23 เป็นต้นไปสามารถอัปเดตไปยังตัวเลือกนี้และ
ล้างเศษซาก dependency ของ Plugin ได้หรือไม่":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance คือ gate ของแพ็กเกจแบบ GitHub-native มัน resolve แพ็กเกจตัวเลือกหนึ่งรายการ
เป็น tarball `package-under-test`, บันทึกเวอร์ชันและ SHA-256 จากนั้น
รัน lane Docker E2E ที่ reusable กับ tarball ตรงนั้น ref ของ workflow harness
แยกจาก ref ของ source แพ็กเกจ ดังนั้น logic การทดสอบปัจจุบันสามารถตรวจสอบ
release เก่าที่ trust แล้วได้

แหล่งของตัวเลือก:

- `source=npm`: ตรวจสอบ `openclaw@beta`, `openclaw@latest` หรือ
  เวอร์ชันที่เผยแพร่แบบ exact
- `source=ref`: แพ็ก branch, tag หรือ commit ที่ trust แล้วด้วย current
  harness ที่เลือก
- `source=url`: ตรวจสอบ HTTPS tarball พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: ใช้ tarball ที่อัปโหลดโดย Actions run อื่นซ้ำ

Release checks เรียก Package Acceptance ด้วยชุด package/update/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

พวกมันยังส่งค่า:

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

สิ่งนี้ทำให้ package migration, การสลับ update channel, การล้าง dependency
Plugin ที่ล้าสมัย, coverage ของ Plugin แบบ offline, พฤติกรรมการอัปเดต Plugin และ package
QA ของ Telegram อยู่บน artifact ที่ resolve เดียวกัน

`release-history` คือ sample แบบมีขอบเขตสำหรับ release-check: stable releases หกรุ่นล่าสุด,
`2026.4.23` และ anchor ที่เก่ากว่าหนึ่งรายการก่อนวันนั้น สำหรับ coverage ของ published update
migration แบบ exhaustive ให้ใช้ `all-since-2026.4.23` ใน workflow Update Migration
แยกต่างหากแทน Full Release CI

รัน profile ของแพ็กเกจแบบ manual เมื่อตรวจสอบตัวเลือกก่อน release:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=release-history \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

ใช้ `suite_profile=product` เมื่อคำถามของ release รวมถึงช่องทาง MCP,
การล้าง cron/subagent, OpenAI web search หรือ OpenWebUI ใช้ `suite_profile=full`
เฉพาะเมื่อคุณต้องการ coverage ของเส้นทาง Docker release แบบเต็ม

## ค่าเริ่มต้นของ release

สำหรับ release candidates ชุดหลักฐานเริ่มต้นคือ:

1. `pnpm check:changed` และ `pnpm test:changed` สำหรับ regression ระดับ source
2. `pnpm release:check` สำหรับความสมบูรณ์ของ artifact แพ็กเกจ
3. Package Acceptance profile `package` หรือ lane custom package ของ release-check
   สำหรับสัญญา install/update/plugin
4. Cross-OS release checks สำหรับ installer, onboarding และพฤติกรรม
   เฉพาะ OS
5. ชุด live เฉพาะเมื่อ surface ที่เปลี่ยนแตะพฤติกรรม provider หรือ hosted-service

บนเครื่อง maintainer, broad gates และหลักฐานผลิตภัณฑ์ Docker/package ควรรัน
ใน Testbox เว้นแต่กำลังทำหลักฐาน local อย่างชัดเจน

## ความเข้ากันได้กับ legacy

ความผ่อนปรนด้าน compatibility แคบและมีกรอบเวลา:

- แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจยอมรับ
  ช่องว่าง metadata ของแพ็กเกจที่ shipped ไปแล้วใน Package Acceptance
- แพ็กเกจ `2026.4.26` ที่เผยแพร่อาจเตือนสำหรับไฟล์ stamp metadata ของ local build
  ที่ shipped ไปแล้ว
- แพ็กเกจรุ่นหลังต้องเป็นไปตามสัญญาสมัยใหม่ ช่องว่างเดียวกันจะ fail แทนที่จะ
  warning หรือ skip

อย่าเพิ่ม startup migration ใหม่สำหรับรูปทรงเก่าเหล่านี้ เพิ่มหรือขยาย doctor
repair แล้วพิสูจน์ด้วย `upgrade-survivor` หรือ `published-upgrade-survivor`

## การเพิ่ม coverage

เมื่อเปลี่ยนพฤติกรรม update หรือ Plugin ให้เพิ่ม coverage ที่ layer ต่ำที่สุดที่
สามารถ fail ด้วยเหตุผลที่ถูกต้อง:

- logic ของ path หรือ metadata แบบ pure: unit test ข้าง source
- พฤติกรรม package inventory หรือ packed-file: `package-dist-inventory` หรือการทดสอบ
  tarball checker
- พฤติกรรมการติดตั้ง/อัปเดต CLI: assertion หรือ fixture ของ Docker lane
- พฤติกรรม migration ของ release ที่เผยแพร่: scenario `published-upgrade-survivor`
- พฤติกรรม registry/package source: fixture `test:docker:plugins` หรือ server fixture ของ ClawHub
- พฤติกรรม layout หรือ cleanup ของ dependency: assert ทั้ง runtime execution และ
  filesystem boundary dependency ของ npm อาจถูก hoist ภายใต้ managed npm
  root ดังนั้นการทดสอบควรพิสูจน์ว่า root ถูกสแกน/ล้าง แทนที่จะสมมติ
  tree `node_modules` แบบ package-local

คง fixture Docker ใหม่ให้เป็น hermetic โดย default ใช้ fixture registry local และ
แพ็กเกจปลอม เว้นแต่จุดประสงค์ของการทดสอบคือพฤติกรรม live registry

## การ triage failure

เริ่มจาก identity ของ artifact:

- summary `resolve_package` ของ Package Acceptance: source, version, SHA-256 และ
  artifact name
- artifact ของ Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, log ของ lane และคำสั่ง rerun
- summary ของ Upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  รวมถึง baseline version, candidate version, scenario, phase timings และ
  recipe steps

ควร rerun lane ที่ fail แบบ exact ด้วย artifact แพ็กเกจเดิม มากกว่า
rerun release umbrella ทั้งหมด
