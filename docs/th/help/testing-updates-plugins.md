---
read_when:
    - การเปลี่ยนแปลงพฤติกรรมของการอัปเดต OpenClaw, doctor, การยอมรับแพ็กเกจ หรือการติดตั้ง Plugin
    - การเตรียมหรืออนุมัติรุ่นก่อนเผยแพร่ขั้นสุดท้าย
    - การแก้จุดบกพร่องการอัปเดตแพ็กเกจ การจัดระเบียบการพึ่งพาของ Plugin หรือการถดถอยของการติดตั้ง Plugin
sidebarTitle: Update and plugin tests
summary: วิธีที่ OpenClaw ตรวจสอบความถูกต้องของเส้นทางการอัปเดต การย้ายข้อมูลแพ็กเกจ และพฤติกรรมการติดตั้ง/อัปเดต Plugin
title: 'การทดสอบ: การอัปเดตและ Plugin'
x-i18n:
    generated_at: "2026-05-03T10:12:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 309ac7785a8d49db241989d28580887d3f6739982108af7148b624082c5f23dd
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

นี่คือรายการตรวจสอบเฉพาะสำหรับการตรวจสอบการอัปเดตและ Plugin เป้าหมายเรียบง่าย: พิสูจน์ว่าแพ็กเกจที่ติดตั้งได้สามารถอัปเดตสถานะผู้ใช้จริง ซ่อมแซมสถานะดั้งเดิมที่ล้าสมัยผ่าน `doctor` และยังคงติดตั้ง โหลด อัปเดต และถอนการติดตั้ง Plugin จากแหล่งที่รองรับได้

สำหรับแผนผังตัวรันการทดสอบที่กว้างกว่า ดู [การทดสอบ](/th/help/testing) สำหรับคีย์ผู้ให้บริการแบบ live และชุดทดสอบที่แตะเครือข่าย ดู [การทดสอบแบบ live](/th/help/testing-live)

## สิ่งที่เราปกป้อง

การทดสอบการอัปเดตและ Plugin ปกป้องสัญญาเหล่านี้:

- แพ็กเกจ tarball สมบูรณ์ มี `dist/postinstall-inventory.json` ที่ถูกต้อง และไม่พึ่งพาไฟล์ repo ที่ยังไม่ได้แพ็ก
- ผู้ใช้สามารถย้ายจากแพ็กเกจที่เผยแพร่เก่ากว่าไปยังแพ็กเกจ candidate ได้โดยไม่สูญเสีย config, agent, session, workspace, allowlist ของ Plugin หรือ config ของช่องทาง
- `openclaw doctor --fix --non-interactive` เป็นเจ้าของเส้นทางการล้างและซ่อมแซม legacy การเริ่มต้นไม่ควรเพิ่มการย้าย compatibility แบบซ่อนสำหรับสถานะ Plugin ที่ล้าสมัย
- การติดตั้ง Plugin ใช้งานได้จากไดเรกทอรี local, git repo, แพ็กเกจ npm และเส้นทาง registry ของ ClawHub
- dependency ของ Plugin npm ถูกติดตั้งใน managed npm root, ถูกสแกนก่อน trust และถูกลบผ่าน npm ระหว่างถอนการติดตั้งเพื่อไม่ให้ dependency ที่ถูก hoist ค้างอยู่
- การอัปเดต Plugin เสถียรเมื่อไม่มีอะไรเปลี่ยน: install record, source ที่ resolve แล้ว, layout ของ dependency ที่ติดตั้ง และสถานะ enabled ยังคงเดิม

## หลักฐาน local ระหว่างการพัฒนา

เริ่มแบบแคบ:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

สำหรับการเปลี่ยนแปลงการติดตั้ง Plugin, การถอนการติดตั้ง, dependency หรือ package-inventory ให้รันการทดสอบเฉพาะจุดที่ครอบคลุม seam ที่แก้ไขด้วย:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

ก่อนที่ Docker lane ของแพ็กเกจใด ๆ จะใช้ tarball ให้พิสูจน์ artifact ของแพ็กเกจ:

```bash
pnpm release:check
```

`release:check` รันการตรวจ drift ของ config/docs/API, เขียน package dist inventory, รัน `npm pack --dry-run`, ปฏิเสธไฟล์ต้องห้ามที่ถูกแพ็ก, ติดตั้ง tarball ลงใน temp prefix, รัน postinstall และ smoke entrypoint ของช่องทางที่ bundled

## Docker lanes

Docker lanes คือหลักฐานระดับผลิตภัณฑ์ โดยติดตั้งหรืออัปเดตแพ็กเกจจริงภายใน Linux container และ assert พฤติกรรมผ่านคำสั่ง CLI, การเริ่มต้น Gateway, HTTP probe, สถานะ RPC และสถานะ filesystem

ใช้ lane เฉพาะจุดระหว่าง iterate:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Lane สำคัญ:

- `test:docker:plugins` ตรวจสอบ plugin install smoke, การติดตั้ง local folder, พฤติกรรมการข้ามการอัปเดต local folder, local folder ที่มี dependency ติดตั้งไว้ล่วงหน้า, การติดตั้งแพ็กเกจ `file:`, การติดตั้ง git พร้อมการรัน CLI, การอัปเดต moving-ref ของ git, การติดตั้งจาก npm registry พร้อม transitive dependency ที่ถูก hoist, no-op ของ npm update, การติดตั้ง fixture ของ ClawHub แบบ local และ no-op ของ update, พฤติกรรม marketplace update และ Claude-bundle enable/inspect ตั้งค่า `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อให้บล็อก ClawHub เป็นแบบ hermetic/offline
- `test:docker:plugin-lifecycle-matrix` ติดตั้งแพ็กเกจ candidate ใน container เปล่า รัน Plugin npm ผ่าน install, inspect, disable, enable, explicit upgrade, explicit downgrade และ uninstall หลังลบโค้ด Plugin โดยบันทึก metrics ของ RSS และ CPU สำหรับแต่ละ phase
- `test:docker:plugin-update` ตรวจสอบว่า Plugin ที่ติดตั้งแล้วและไม่เปลี่ยนแปลงจะไม่ถูกติดตั้งใหม่หรือสูญเสีย metadata การติดตั้งระหว่าง `openclaw plugins update`
- `test:docker:upgrade-survivor` ติดตั้ง candidate tarball ทับ fixture ของผู้ใช้เก่าที่สกปรก รัน package update พร้อม non-interactive doctor จากนั้นเริ่ม loopback Gateway และตรวจการรักษาสถานะ
- `test:docker:published-upgrade-survivor` ติดตั้ง published baseline ก่อน กำหนดค่าผ่าน recipe `openclaw config set` ที่อบไว้ อัปเดตเป็น candidate tarball รัน doctor ตรวจ legacy cleanup เริ่ม Gateway และ probe `/healthz`, `/readyz` และสถานะ RPC
- `test:docker:update-migration` คือ lane published-update ที่เน้น cleanup อย่างหนัก เริ่มจากสถานะผู้ใช้แบบ Discord/Telegram ที่กำหนดค่าแล้ว รัน baseline doctor เพื่อให้ dependency ของ Plugin ที่กำหนดค่าแล้วมีโอกาสเกิดขึ้นจริง seed เศษ dependency ของ Plugin legacy สำหรับ packaged Plugin ที่กำหนดค่าแล้ว อัปเดตเป็น candidate tarball และกำหนดให้ post-update doctor ต้องลบ legacy dependency roots

Variant ที่มีประโยชน์ของ published-upgrade survivor:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Scenario ที่มีคือ `base`, `feishu-channel`, `bootstrap-persona`, `plugin-deps-cleanup`, `configured-plugin-installs`, `tilde-log-path` และ `versioned-runtime-deps` ใน aggregate runs,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` จะขยายเป็น scenario รูปแบบ issue ที่รายงานทั้งหมด รวมถึง configured-plugin install migration

Full update migration แยกออกจาก Full Release CI โดยตั้งใจ ใช้ workflow แบบ manual `Update Migration` เมื่อคำถามของ release คือ "stable release ที่เผยแพร่แล้วทุกเวอร์ชันตั้งแต่ 2026.4.23 เป็นต้นไปสามารถอัปเดตมายัง candidate นี้และล้างเศษ dependency ของ Plugin ได้หรือไม่":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance คือ package gate แบบ GitHub-native โดย resolve แพ็กเกจ candidate หนึ่งรายการเป็น tarball `package-under-test`, บันทึกเวอร์ชันและ SHA-256 จากนั้นรัน Docker E2E lane ที่ reuse ได้กับ tarball นั้นโดยตรง harness ref ของ workflow แยกจาก package source ref ดังนั้น logic การทดสอบปัจจุบันจึงตรวจสอบ release ที่เชื่อถือได้ซึ่งเก่ากว่าได้

แหล่ง candidate:

- `source=npm`: ตรวจสอบ `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันที่เผยแพร่แบบ exact
- `source=ref`: แพ็ก branch, tag หรือ commit ที่เชื่อถือได้ด้วย harness ปัจจุบันที่เลือก
- `source=url`: ตรวจสอบ HTTPS tarball พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: ใช้ tarball ที่อัปโหลดโดย Actions run อื่นซ้ำ

Full Release Validation ใช้ `source=artifact` เป็นค่าเริ่มต้น ซึ่งสร้างจาก release SHA ที่ resolve แล้ว สำหรับหลักฐานหลังเผยแพร่ ให้ส่ง
`package_acceptance_package_spec=openclaw@YYYY.M.D` เพื่อให้ upgrade matrix เดียวกัน target ไปยังแพ็กเกจ npm ที่ shipped แทน

Release checks เรียก Package Acceptance พร้อมชุด package/update/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

และส่งค่าต่อไปนี้ด้วย:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

สิ่งนี้ทำให้ package migration, การสลับ update channel, การล้าง dependency ของ Plugin ที่ล้าสมัย, ความครอบคลุม Plugin แบบ offline, พฤติกรรม Plugin update และ QA แพ็กเกจ Telegram อยู่บน artifact ที่ resolve เดียวกัน

`all-since-2026.4.23` คือ sample การอัปเกรดของ Full Release CI: ทุก stable release ที่เผยแพร่บน npm ตั้งแต่ `2026.4.23` ถึง `latest` สำหรับ coverage ของ published update migration แบบ exhaustive ให้ใช้ `all-since-2026.4.23` ใน workflow Update Migration แยกต่างหากแทน Full Release CI `release-history` ยังคงพร้อมใช้งานสำหรับการ sampling ที่กว้างขึ้นแบบ manual เมื่อคุณต้องการ anchor รุ่น legacy ก่อนวันที่กำหนดด้วย

รัน package profile ด้วยตนเองเมื่อ validate candidate ก่อน release:

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

ใช้ `suite_profile=product` เมื่อคำถามของ release รวมถึงช่องทาง MCP, การล้าง cron/subagent, OpenAI web search หรือ OpenWebUI ใช้ `suite_profile=full` เฉพาะเมื่อคุณต้องการ coverage ของเส้นทาง Docker release แบบเต็ม

## ค่าเริ่มต้นของ release

สำหรับ release candidate, stack หลักฐานค่าเริ่มต้นคือ:

1. `pnpm check:changed` และ `pnpm test:changed` สำหรับ regression ระดับ source
2. `pnpm release:check` สำหรับความสมบูรณ์ของ artifact แพ็กเกจ
3. Package Acceptance profile `package` หรือ release-check custom package lanes สำหรับสัญญา install/update/plugin
4. Cross-OS release checks สำหรับ installer เฉพาะ OS, onboarding และพฤติกรรม platform
5. ชุดทดสอบ live เฉพาะเมื่อ surface ที่เปลี่ยนแตะพฤติกรรม provider หรือ hosted-service

บนเครื่อง maintainer, broad gate และหลักฐาน product ของ Docker/package ควรรันใน Testbox เว้นแต่กำลังทำ local proof อย่างชัดเจน

## Legacy compatibility

การผ่อนปรน compatibility แคบและมีกำหนดเวลา:

- แพ็กเกจถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจยอมรับช่องว่างของ package metadata ที่ shipped ไปแล้วใน Package Acceptance
- แพ็กเกจ `2026.4.26` ที่เผยแพร่อาจเตือนสำหรับไฟล์ local build metadata stamp ที่ shipped ไปแล้ว
- แพ็กเกจหลังจากนั้นต้องผ่านสัญญาสมัยใหม่ ช่องว่างเดียวกันจะ fail แทนการเตือนหรือข้าม

อย่าเพิ่ม startup migration ใหม่สำหรับรูปทรงเก่าเหล่านี้ ให้เพิ่มหรือขยายการซ่อมแซมของ doctor แล้วพิสูจน์ด้วย `upgrade-survivor` หรือ `published-upgrade-survivor`

## การเพิ่ม coverage

เมื่อเปลี่ยนพฤติกรรม update หรือ Plugin ให้เพิ่ม coverage ที่ชั้นต่ำที่สุดที่ fail ได้ด้วยเหตุผลที่ถูกต้อง:

- logic ของ path หรือ metadata แบบ pure: unit test ข้าง source
- พฤติกรรม package inventory หรือ packed-file: `package-dist-inventory` หรือการทดสอบ tarball checker
- พฤติกรรม CLI install/update: assertion หรือ fixture ของ Docker lane
- พฤติกรรม migration ของ published-release: scenario ของ `published-upgrade-survivor`
- พฤติกรรม registry/package source: fixture ของ `test:docker:plugins` หรือ fixture server ของ ClawHub
- พฤติกรรม layout หรือ cleanup ของ dependency: assert ทั้ง runtime execution และขอบเขต filesystem dependency ของ npm อาจถูก hoist ใต้ managed npm root ดังนั้นการทดสอบควรพิสูจน์ว่า root ถูกสแกน/ล้าง แทนที่จะสมมติ tree `node_modules` เฉพาะแพ็กเกจ

ทำให้ Docker fixture ใหม่เป็น hermetic โดยค่าเริ่มต้น ใช้ fixture registry แบบ local และแพ็กเกจปลอม เว้นแต่ประเด็นของการทดสอบคือพฤติกรรม live registry

## การ triage ความล้มเหลว

เริ่มจาก identity ของ artifact:

- สรุป `resolve_package` ของ Package Acceptance: source, version, SHA-256 และชื่อ artifact
- Docker artifacts: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane logs และคำสั่ง rerun
- สรุป Upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  รวมถึง baseline version, candidate version, scenario, phase timings และ recipe steps

ควร rerun lane ที่ล้มเหลวแบบ exact ด้วย package artifact เดียวกัน มากกว่าการ rerun umbrella ของ release ทั้งหมด
