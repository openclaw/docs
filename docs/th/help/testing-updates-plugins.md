---
read_when:
    - การเปลี่ยนพฤติกรรมการอัปเดต, doctor, การยอมรับแพ็กเกจ หรือการติดตั้ง Plugin ของ OpenClaw
    - การเตรียมหรืออนุมัติรุ่นเตรียมเผยแพร่
    - การดีบักการอัปเดตแพ็กเกจ การล้างข้อมูลการพึ่งพาของ Plugin หรือการถดถอยในการติดตั้ง Plugin
sidebarTitle: Update and plugin tests
summary: วิธีที่ OpenClaw ตรวจสอบความถูกต้องของเส้นทางการอัปเดต การย้ายข้อมูลแพ็กเกจ และพฤติกรรมการติดตั้ง/อัปเดต Plugin
title: 'การทดสอบ: การอัปเดตและ Plugin'
x-i18n:
    generated_at: "2026-05-02T20:45:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a56e249f565cc23a439142b3332c0a57fd4afe9021b79f644d353946d6d2ffc
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

นี่คือรายการตรวจสอบเฉพาะสำหรับการตรวจสอบการอัปเดตและ Plugin เป้าหมายนั้นเรียบง่าย:
พิสูจน์ว่าแพ็กเกจที่ติดตั้งได้สามารถอัปเดตสถานะผู้ใช้จริง ซ่อมแซม
สถานะ legacy ที่ค้างผ่าน `doctor` และยังคงติดตั้ง โหลด อัปเดต และถอนการติดตั้ง
Plugin จากแหล่งที่รองรับได้

สำหรับแผนผังตัวรันการทดสอบที่กว้างขึ้น โปรดดู [การทดสอบ](/th/help/testing) สำหรับคีย์ผู้ให้บริการแบบ live
และชุดทดสอบที่แตะเครือข่าย โปรดดู [การทดสอบแบบ live](/th/help/testing-live)

## สิ่งที่เราปกป้อง

การทดสอบการอัปเดตและ Plugin ปกป้องสัญญาเหล่านี้:

- tarball ของแพ็กเกจครบถ้วน มี `dist/postinstall-inventory.json` ที่ถูกต้อง
  และไม่พึ่งพาไฟล์ repo ที่ยังไม่ได้แพ็ก
- ผู้ใช้สามารถย้ายจากแพ็กเกจที่เผยแพร่รุ่นเก่าไปยังแพ็กเกจ candidate
  โดยไม่สูญเสีย config, agents, sessions, workspaces, allowlists ของ Plugin หรือ
  config ของช่องทาง
- `openclaw doctor --fix --non-interactive` เป็นเจ้าของเส้นทางการล้างและซ่อมแซม
  legacy Startup ไม่ควรเพิ่ม migration ความเข้ากันได้แบบซ่อนสำหรับสถานะ
  Plugin เก่าที่ค้าง
- การติดตั้ง Plugin ทำงานได้จากไดเรกทอรี local, git repos, แพ็กเกจ npm และ
  เส้นทาง registry ของ ClawHub
- การพึ่งพา npm ของ Plugin ถูกติดตั้งใน managed npm root, ถูกสแกนก่อน
  trust และถูกลบผ่าน npm ระหว่างถอนการติดตั้ง เพื่อให้การพึ่งพาที่ถูก hoist
  ไม่ค้างอยู่
- การอัปเดต Plugin เสถียรเมื่อไม่มีสิ่งใดเปลี่ยน: install records, resolved
  source, layout ของการพึ่งพาที่ติดตั้ง และสถานะ enabled ยังคงเดิม

## หลักฐาน local ระหว่างการพัฒนา

เริ่มให้แคบ:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

สำหรับการเปลี่ยนแปลงการติดตั้ง Plugin, การถอนการติดตั้ง, การพึ่งพา หรือ package-inventory ให้รัน
การทดสอบแบบเจาะจงที่ครอบคลุม seam ที่แก้ไขด้วย:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

ก่อนที่ package Docker lane ใดๆ จะใช้ tarball ให้พิสูจน์ artifact ของแพ็กเกจก่อน:

```bash
pnpm release:check
```

`release:check` รันการตรวจ drift ของ config/docs/API, เขียน package dist
inventory, รัน `npm pack --dry-run`, ปฏิเสธไฟล์ที่ห้ามถูกแพ็ก, ติดตั้ง
tarball ลงใน temp prefix, รัน postinstall และ smoke entrypoints ของช่องทาง
ที่ bundled

## Docker lanes

Docker lanes คือหลักฐานระดับผลิตภัณฑ์ พวกมันติดตั้งหรืออัปเดตแพ็กเกจจริง
ภายใน Linux containers และยืนยันพฤติกรรมผ่านคำสั่ง CLI, การเริ่ม Gateway,
HTTP probes, สถานะ RPC และสถานะระบบไฟล์

ใช้ lanes แบบเจาะจงระหว่างทำซ้ำ:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Lanes สำคัญ:

- `test:docker:plugins` ตรวจสอบ plugin install smoke, การติดตั้ง local folder,
  พฤติกรรมข้ามการอัปเดต local folder, local folders ที่มีการพึ่งพาติดตั้งไว้ล่วงหน้า,
  การติดตั้งแพ็กเกจ `file:`, การติดตั้ง git พร้อมการรัน CLI, การอัปเดต git
  moving-ref, การติดตั้ง npm registry พร้อม transitive dependencies ที่ถูก hoist,
  npm update แบบ no-op, การติดตั้ง local ClawHub fixture และ update no-op,
  พฤติกรรม marketplace update และ Claude-bundle enable/inspect ตั้งค่า
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อให้บล็อก ClawHub เป็น hermetic/offline
- `test:docker:plugin-update` ตรวจสอบว่า Plugin ที่ติดตั้งแล้วและไม่เปลี่ยนแปลง
  จะไม่ติดตั้งใหม่หรือสูญเสีย metadata การติดตั้งระหว่าง `openclaw plugins update`
- `test:docker:upgrade-survivor` ติดตั้ง candidate tarball ทับ fixture ผู้ใช้เก่า
  ที่สกปรก รัน package update พร้อม non-interactive doctor จากนั้นเริ่ม
  loopback Gateway และตรวจสอบการคงสถานะไว้
- `test:docker:published-upgrade-survivor` ติดตั้ง baseline ที่เผยแพร่ก่อน,
  config ผ่านสูตร `openclaw config set` ที่ baked ไว้, อัปเดตเป็น
  candidate tarball, รัน doctor, ตรวจสอบการล้าง legacy, เริ่ม Gateway และ
  probe `/healthz`, `/readyz` และสถานะ RPC
- `test:docker:update-migration` คือ lane published-update ที่เน้นการล้างอย่างหนัก
  โดยเริ่มจากสถานะผู้ใช้แบบ Discord/Telegram ที่ config แล้ว, รัน baseline
  doctor เพื่อให้การพึ่งพาของ Plugin ที่ config มีโอกาส materialize, seed
  เศษการพึ่งพา Plugin แบบ legacy สำหรับ Plugin แบบ packaged ที่ config แล้ว,
  อัปเดตเป็น candidate tarball และกำหนดให้ post-update doctor ลบ legacy
  dependency roots

Variants ของ published-upgrade survivor ที่มีประโยชน์:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Scenarios ที่มีคือ `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`, `tilde-log-path` และ
`versioned-runtime-deps` ในการรันแบบ aggregate,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` จะขยายเป็น scenarios
ทั้งหมดที่มีรูปทรงเหมือน issue ที่ถูกรายงาน รวมถึง migration การติดตั้ง Plugin
ที่ config แล้ว

Full update migration ถูกแยกออกจาก Full Release CI โดยตั้งใจ ใช้ workflow
`Update Migration` แบบ manual เมื่อคำถามสำหรับ release คือ "ทุก stable release
ที่เผยแพร่ตั้งแต่ 2026.4.23 เป็นต้นไปสามารถอัปเดตเป็น candidate นี้และ
ล้างเศษการพึ่งพา Plugin ได้หรือไม่":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## การยอมรับแพ็กเกจ

การยอมรับแพ็กเกจคือ package gate แบบ GitHub-native มัน resolve แพ็กเกจ
candidate หนึ่งเป็น tarball `package-under-test`, บันทึก version และ SHA-256
จากนั้นรัน Docker E2E lanes แบบ reusable กับ tarball นั้นโดยตรง harness ref
ของ workflow แยกจาก package source ref ดังนั้นตรรกะการทดสอบปัจจุบันจึงสามารถ
ตรวจสอบ release เก่าที่ trusted ได้

แหล่ง candidate:

- `source=npm`: ตรวจสอบ `openclaw@beta`, `openclaw@latest` หรือ version ที่เผยแพร่
  แบบเจาะจง
- `source=ref`: แพ็ก branch, tag หรือ commit ที่ trusted ด้วย harness ปัจจุบัน
  ที่เลือกไว้
- `source=url`: ตรวจสอบ HTTPS tarball พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: ใช้ tarball ที่อัปโหลดโดย Actions run อื่นซ้ำ

Full Release Validation ใช้ `source=artifact` เป็นค่าเริ่มต้น ซึ่งสร้างจาก
release SHA ที่ resolve แล้ว สำหรับหลักฐานหลังเผยแพร่ ให้ส่ง
`package_acceptance_package_spec=openclaw@YYYY.M.D` เพื่อให้ upgrade matrix
เดียวกัน target แพ็กเกจ npm ที่ส่งมอบแล้วแทน

Release checks เรียกการยอมรับแพ็กเกจด้วยชุด package/update/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

พวกมันยังส่งค่าเหล่านี้:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

สิ่งนี้ทำให้ package migration, การสลับ update channel, การล้างการพึ่งพา
Plugin เก่าที่ค้าง, coverage ของ Plugin แบบ offline, พฤติกรรมการอัปเดต Plugin
และ Telegram package QA อยู่บน artifact ที่ resolve เดียวกัน

`all-since-2026.4.23` คือ sample การอัปเกรดของ Full Release CI: ทุก stable
release ที่เผยแพร่บน npm ตั้งแต่ `2026.4.23` ถึง `latest` สำหรับ coverage ของ
published update migration แบบครบถ้วน ให้ใช้ `all-since-2026.4.23` ใน workflow
Update Migration แยกต่างหากแทน Full Release CI `release-history` ยังคง
พร้อมใช้สำหรับการสุ่มตัวอย่างที่กว้างขึ้นแบบ manual เมื่อคุณต้องการ anchor
legacy ก่อนวันที่นั้นด้วย

รัน package profile แบบ manual เมื่อตรวจสอบ candidate ก่อน release:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=all-since-2026.4.23 \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

ใช้ `suite_profile=product` เมื่อคำถามสำหรับ release รวมถึงช่องทาง MCP,
การล้าง cron/subagent, OpenAI web search หรือ OpenWebUI ใช้ `suite_profile=full`
เฉพาะเมื่อคุณต้องการ coverage เส้นทาง release ของ Docker แบบเต็ม

## ค่าเริ่มต้นสำหรับ release

สำหรับ release candidates ชุดหลักฐานเริ่มต้นคือ:

1. `pnpm check:changed` และ `pnpm test:changed` สำหรับ regression ระดับซอร์ส
2. `pnpm release:check` สำหรับความสมบูรณ์ของ artifact แพ็กเกจ
3. profile การยอมรับแพ็กเกจ `package` หรือ release-check custom package
   lanes สำหรับสัญญา install/update/plugin
4. Cross-OS release checks สำหรับ installer, onboarding และพฤติกรรมของแพลตฟอร์ม
   ที่เฉพาะกับ OS
5. Live suites เฉพาะเมื่อพื้นผิวที่เปลี่ยนแตะพฤติกรรม provider หรือ hosted-service

บนเครื่อง maintainer gates กว้างๆ และหลักฐานผลิตภัณฑ์ Docker/package ควรรัน
ใน Testbox เว้นแต่กำลังทำหลักฐาน local อย่างชัดเจน

## ความเข้ากันได้กับ legacy

การผ่อนปรนด้านความเข้ากันได้มีขอบเขตแคบและจำกัดเวลา:

- แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจยอมรับช่องว่าง
  metadata ของแพ็กเกจที่ส่งมอบไปแล้วใน Package Acceptance ได้
- แพ็กเกจ `2026.4.26` ที่เผยแพร่อาจเตือนสำหรับไฟล์ stamp ของ metadata build
  แบบ local ที่ส่งมอบไปแล้ว
- แพ็กเกจหลังจากนั้นต้องเป็นไปตามสัญญาสมัยใหม่ ช่องว่างเดียวกันจะล้มเหลว
  แทนที่จะเตือนหรือข้าม

อย่าเพิ่ม startup migrations ใหม่สำหรับรูปทรงเก่าเหล่านี้ ให้เพิ่มหรือขยาย
การซ่อมด้วย doctor แล้วพิสูจน์ด้วย `upgrade-survivor` หรือ
`published-upgrade-survivor`

## การเพิ่ม coverage

เมื่อเปลี่ยนพฤติกรรมการอัปเดตหรือ Plugin ให้เพิ่ม coverage ในเลเยอร์ต่ำสุด
ที่สามารถล้มเหลวด้วยเหตุผลที่ถูกต้อง:

- ตรรกะ path หรือ metadata แบบ pure: unit test ข้างซอร์ส
- พฤติกรรม package inventory หรือ packed-file: `package-dist-inventory` หรือ
  tarball checker test
- พฤติกรรมการติดตั้ง/อัปเดต CLI: การยืนยันหรือ fixture ของ Docker lane
- พฤติกรรม migration ของ release ที่เผยแพร่แล้ว: scenario ของ
  `published-upgrade-survivor`
- พฤติกรรม registry/package source: fixture ของ `test:docker:plugins` หรือ
  fixture server ของ ClawHub
- พฤติกรรม layout หรือการล้างการพึ่งพา: ยืนยันทั้งการรัน runtime และขอบเขต
  ระบบไฟล์ การพึ่งพา npm อาจถูก hoist ใต้ managed npm root ดังนั้นการทดสอบควร
  พิสูจน์ว่า root ถูกสแกน/ล้าง แทนที่จะสมมติว่ามี tree `node_modules`
  แบบ package-local

ให้ Docker fixtures ใหม่เป็น hermetic โดยค่าเริ่มต้น ใช้ fixture registries
แบบ local และแพ็กเกจปลอม เว้นแต่จุดประสงค์ของการทดสอบคือพฤติกรรม registry
แบบ live

## การ triage ความล้มเหลว

เริ่มจากตัวตนของ artifact:

- สรุป `resolve_package` ของ Package Acceptance: source, version, SHA-256 และ
  ชื่อ artifact
- Docker artifacts: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane logs และคำสั่ง rerun
- สรุป upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  รวมถึง baseline version, candidate version, scenario, phase timings และ
  recipe steps

ควรรัน lane ที่ล้มเหลวเดิมแบบตรงจุดซ้ำด้วย package artifact เดิม มากกว่ารัน
release umbrella ทั้งหมดซ้ำ
