---
read_when:
    - การเปลี่ยนลักษณะการทำงานของการอัปเดต OpenClaw, doctor, การยอมรับแพ็กเกจ หรือการติดตั้ง Plugin
    - การเตรียมหรืออนุมัติรุ่นที่เสนอให้เผยแพร่
    - การดีบักการอัปเดตแพ็กเกจ การล้าง dependency ของ Plugin หรือปัญหาการถดถอยในการติดตั้ง Plugin
sidebarTitle: Update and plugin tests
summary: วิธีที่ OpenClaw ตรวจสอบความถูกต้องของเส้นทางการอัปเดต การย้ายข้อมูลแพ็กเกจ และพฤติกรรมการติดตั้ง/อัปเดต Plugin
title: 'การทดสอบ: การอัปเดตและ Plugin'
x-i18n:
    generated_at: "2026-05-05T01:48:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: e83a847c76f424199b5fccbd9a2b30d0bf01e4f466c4f9822bf7693d1c2ad286
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

นี่คือรายการตรวจสอบเฉพาะสำหรับการตรวจสอบการอัปเดตและ Plugin เป้าหมายคือ
เรียบง่าย: พิสูจน์ว่าแพ็กเกจที่ติดตั้งได้สามารถอัปเดตสถานะผู้ใช้จริง ซ่อมแซม
สถานะเดิมที่ล้าสมัยผ่าน `doctor` และยังคงติดตั้ง โหลด อัปเดต และถอนการติดตั้ง
plugins จากแหล่งที่รองรับได้

สำหรับแผนผัง test runner ที่กว้างขึ้น โปรดดู [การทดสอบ](/th/help/testing) สำหรับคีย์ provider แบบสด
และชุดทดสอบที่แตะเครือข่าย โปรดดู [การทดสอบแบบสด](/th/help/testing-live)

## สิ่งที่เราปกป้อง

การทดสอบการอัปเดตและ plugin ปกป้องสัญญาเหล่านี้:

- tarball ของแพ็กเกจต้องครบถ้วน มี `dist/postinstall-inventory.json` ที่ถูกต้อง
  และไม่พึ่งพาไฟล์ repo ที่ยังไม่ได้แพ็ก
- ผู้ใช้สามารถย้ายจากแพ็กเกจเผยแพร่รุ่นเก่าไปยังแพ็กเกจ candidate
  โดยไม่สูญเสีย config, agents, sessions, workspaces, allowlists ของ plugin หรือ
  config ของ channel
- `openclaw doctor --fix --non-interactive` เป็นเจ้าของเส้นทางการล้างและซ่อมแซมแบบ legacy
  Startup ไม่ควรเพิ่ม migration ความเข้ากันได้ที่ซ่อนอยู่สำหรับสถานะ plugin ที่ล้าสมัย
- การติดตั้ง Plugin ทำงานได้จากไดเรกทอรี local, git repos, npm packages และเส้นทาง
  registry ของ ClawHub
- npm dependencies ของ Plugin ถูกติดตั้งใน managed npm root, ถูกสแกนก่อน
  trust และถูกนำออกผ่าน npm ระหว่าง uninstall เพื่อไม่ให้ dependencies ที่ถูก hoist
  ค้างอยู่
- การอัปเดต Plugin เสถียรเมื่อไม่มีอะไรเปลี่ยน: install records, resolved
  source, layout ของ installed dependency และ enabled state ยังคงเดิม

## หลักฐาน local ระหว่างการพัฒนา

เริ่มแบบแคบ:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

สำหรับการเปลี่ยนแปลงการติดตั้ง plugin, uninstall, dependency หรือ package-inventory ให้
รันการทดสอบแบบโฟกัสที่ครอบคลุม seam ที่แก้ไขด้วย:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

ก่อนที่ package Docker lane ใด ๆ จะใช้ tarball ให้พิสูจน์ artifact ของแพ็กเกจ:

```bash
pnpm release:check
```

`release:check` รันการตรวจสอบ drift ของ config/docs/API, เขียน package dist
inventory, รัน `npm pack --dry-run`, ปฏิเสธไฟล์ packed ที่ต้องห้าม, ติดตั้ง
tarball ลงใน temp prefix, รัน postinstall และ smoke entrypoints ของ bundled channel

## Docker lanes

Docker lanes คือหลักฐานระดับผลิตภัณฑ์ พวกมันติดตั้งหรืออัปเดตแพ็กเกจจริง
ภายใน Linux containers และยืนยันพฤติกรรมผ่าน CLI commands,
Gateway startup, HTTP probes, RPC status และสถานะ filesystem

ใช้ lanes แบบโฟกัสระหว่าง iterate:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

lanes สำคัญ:

- `test:docker:plugins` ตรวจสอบ plugin install smoke, การติดตั้ง local folder,
  พฤติกรรมข้ามการอัปเดต local folder, local folders ที่มี dependencies
  ติดตั้งไว้ล่วงหน้า, การติดตั้งแพ็กเกจ `file:`, การติดตั้ง git พร้อมการเรียกใช้งาน CLI, การอัปเดต
  moving-ref ของ git, การติดตั้งจาก npm registry พร้อม transitive dependencies ที่ถูก hoist,
  npm update no-ops, การติดตั้ง fixture ของ local ClawHub และ update
  no-ops, พฤติกรรม marketplace update และ Claude-bundle enable/inspect ตั้งค่า
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อให้บล็อก ClawHub เป็น hermetic/offline
- `test:docker:plugin-lifecycle-matrix` ติดตั้งแพ็กเกจ candidate ใน container เปล่า
  รัน npm plugin ผ่าน install, inspect, disable, enable,
  explicit upgrade, explicit downgrade และ uninstall หลังลบโค้ด plugin
  มันบันทึก metrics ของ RSS และ CPU สำหรับแต่ละ phase
- `test:docker:plugin-update` ตรวจสอบว่า plugin ที่ติดตั้งแล้วและไม่เปลี่ยนแปลง
  จะไม่ reinstall หรือสูญเสีย install metadata ระหว่าง `openclaw plugins update`
- `test:docker:upgrade-survivor` ติดตั้ง candidate tarball ทับ dirty
  old-user fixture, รัน package update พร้อม non-interactive doctor จากนั้นเริ่ม
  loopback Gateway และตรวจสอบการรักษาสถานะ
- `test:docker:published-upgrade-survivor` ติดตั้ง baseline ที่เผยแพร่ก่อน
  config ผ่าน recipe `openclaw config set` ที่ baked ไว้, อัปเดตไปยัง
  candidate tarball, รัน doctor, ตรวจสอบ legacy cleanup, เริ่ม Gateway และ
  probe `/healthz`, `/readyz` และ RPC status
- `test:docker:update-migration` คือ lane published-update ที่เน้นการล้างหนัก มัน
  เริ่มจากสถานะผู้ใช้แบบ Discord/Telegram-style ที่ config ไว้, รัน baseline
  doctor เพื่อให้ dependencies ของ plugin ที่ config ไว้มีโอกาส materialize, seed
  legacy plugin dependency debris สำหรับ packaged plugin ที่ config ไว้, อัปเดตไปยัง
  candidate tarball และกำหนดให้ post-update doctor ต้องลบ legacy
  dependency roots

variants ของ published-upgrade survivor ที่มีประโยชน์:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

scenarios ที่มีคือ `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path` และ `versioned-runtime-deps` ในการรันแบบรวม
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` จะขยายเป็น scenarios รูปแบบ issue ที่รายงานทั้งหมด
รวมถึง migration การติดตั้ง configured-plugin

Full update migration ถูกแยกออกจาก Full Release CI โดยตั้งใจ ใช้
workflow `Update Migration` แบบ manual เมื่อคำถามของ release คือ "stable release ที่เผยแพร่ทุกตัว
ตั้งแต่ 2026.4.23 เป็นต้นไปสามารถอัปเดตมายัง candidate นี้และ
ล้าง plugin dependency debris ได้หรือไม่?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## การยอมรับแพ็กเกจ

การยอมรับแพ็กเกจคือ gate ของแพ็กเกจแบบ GitHub-native มัน resolve แพ็กเกจ candidate หนึ่งตัว
เป็น tarball `package-under-test`, บันทึก version และ SHA-256 จากนั้น
รัน reusable Docker E2E lanes กับ tarball นั้นโดยตรง workflow harness
ref แยกจาก package source ref ดังนั้น logic การทดสอบปัจจุบันจึงตรวจสอบ
trusted releases รุ่นเก่าได้

แหล่ง candidate:

- `source=npm`: ตรวจสอบ `openclaw@beta`, `openclaw@latest` หรือ version ที่เผยแพร่
  แบบเจาะจง
- `source=ref`: pack branch, tag หรือ commit ที่ trusted ด้วย harness ปัจจุบัน
  ที่เลือกไว้
- `source=url`: ตรวจสอบ HTTPS tarball พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: ใช้ tarball ที่อัปโหลดโดย Actions run อื่นซ้ำ

Full Release Validation ใช้ `source=artifact` ตามค่าเริ่มต้น โดย build จาก
release SHA ที่ resolve แล้ว สำหรับหลักฐานหลัง publish ให้ส่ง
`package_acceptance_package_spec=openclaw@YYYY.M.D` เพื่อให้ upgrade matrix เดียวกัน
target แพ็กเกจ npm ที่ ship แล้วแทน

release checks เรียกการยอมรับแพ็กเกจด้วยชุด package/update/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

พวกมันยังส่ง:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

สิ่งนี้ทำให้ package migration, update channel switching, การล้าง stale plugin dependency,
coverage plugin แบบ offline, พฤติกรรม plugin update และ Telegram package
QA อยู่บน artifact ที่ resolve แล้วเดียวกัน

`all-since-2026.4.23` คือ sample การอัปเกรดของ Full Release CI: release ที่เผยแพร่บน npm แบบ stable ทุกตัวตั้งแต่ `2026.4.23` ถึง `latest` สำหรับ coverage
update migration ที่เผยแพร่แบบ exhaustive ให้ใช้ `all-since-2026.4.23` ใน workflow Update
Migration ที่แยกต่างหากแทน Full Release CI `release-history` ยังคง
พร้อมใช้สำหรับการ sampling ที่กว้างขึ้นแบบ manual เมื่อคุณต้องการ anchor ก่อนวันที่ legacy ด้วย

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

ใช้ `suite_profile=product` เมื่อคำถามของ release รวมถึง MCP channels,
cron/subagent cleanup, OpenAI web search หรือ OpenWebUI ใช้ `suite_profile=full`
เฉพาะเมื่อคุณต้องการ coverage ของ Docker release-path แบบเต็ม

## ค่าเริ่มต้นของ release

สำหรับ release candidates ชุดหลักฐานเริ่มต้นคือ:

1. `pnpm check:changed` และ `pnpm test:changed` สำหรับ regressions ระดับ source
2. `pnpm release:check` สำหรับความสมบูรณ์ของ package artifact
3. profile `package` ของการยอมรับแพ็กเกจ หรือ custom package
   lanes ของ release-check สำหรับสัญญา install/update/plugin
4. Cross-OS release checks สำหรับ installer, onboarding และพฤติกรรม platform
   เฉพาะ OS
5. Live suites เฉพาะเมื่อ surface ที่เปลี่ยนแตะพฤติกรรม provider หรือ hosted-service

บนเครื่อง maintainer, broad gates และหลักฐานผลิตภัณฑ์ Docker/package ควรรัน
ใน Testbox เว้นแต่จะทำ local proof โดยชัดแจ้ง

## ความเข้ากันได้แบบ legacy

การผ่อนปรนความเข้ากันได้แคบและจำกัดเวลา:

- แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจยอมรับ
  ช่องว่างของ package metadata ที่ ship ไปแล้วในการยอมรับแพ็กเกจ
- แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจ warn สำหรับไฟล์ local build metadata stamp
  ที่ ship ไปแล้ว
- แพ็กเกจหลังจากนั้นต้องผ่านสัญญาสมัยใหม่ ช่องว่างเดียวกันจะ fail แทนการ
  warn หรือ skip

อย่าเพิ่ม startup migrations ใหม่สำหรับรูปแบบเก่าเหล่านี้ เพิ่มหรือขยาย doctor
repair แล้วพิสูจน์ด้วย `upgrade-survivor` หรือ `published-upgrade-survivor`

## การเพิ่ม coverage

เมื่อเปลี่ยนพฤติกรรม update หรือ plugin ให้เพิ่ม coverage ใน layer ต่ำสุดที่
fail ด้วยเหตุผลที่ถูกต้องได้:

- logic ของ path หรือ metadata ล้วน: unit test ข้าง source
- พฤติกรรม package inventory หรือ packed-file: `package-dist-inventory` หรือ tarball
  checker test
- พฤติกรรม CLI install/update: assertion หรือ fixture ของ Docker lane
- พฤติกรรม published-release migration: scenario ของ `published-upgrade-survivor`
- พฤติกรรม registry/package source: fixture ของ `test:docker:plugins` หรือ ClawHub
  fixture server
- พฤติกรรม dependency layout หรือ cleanup: assert ทั้ง runtime execution และ
  filesystem boundary npm dependencies อาจถูก hoist ใต้ managed npm
  root ดังนั้น tests ควรพิสูจน์ว่า root ถูก scan/clean แทนการสมมติว่าเป็น
  tree `node_modules` แบบ package-local

รักษา Docker fixtures ใหม่ให้เป็น hermetic ตามค่าเริ่มต้น ใช้ fixture registries แบบ local และ
fake packages เว้นแต่ประเด็นของ test คือพฤติกรรม live registry

## การ triage ความล้มเหลว

เริ่มจากตัวตนของ artifact:

- summary ของการยอมรับแพ็กเกจ `resolve_package`: source, version, SHA-256 และ
  artifact name
- Docker artifacts: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane logs และ rerun commands
- Upgrade survivor summary: `.artifacts/upgrade-survivor/summary.json`,
  รวมถึง baseline version, candidate version, scenario, phase timings และ
  recipe steps

ควร rerun lane ที่ fail แบบเจาะจงด้วย package artifact เดียวกัน มากกว่า
rerun release umbrella ทั้งหมด
