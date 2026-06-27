---
read_when:
    - การเปลี่ยนลักษณะการทำงานของการอัปเดต, doctor, package acceptance หรือการติดตั้ง Plugin ของ OpenClaw
    - กำลังเตรียมหรืออนุมัติ release candidate
    - การดีบักการอัปเดตแพ็กเกจ การล้าง dependency ของ Plugin หรือ regression ในการติดตั้ง Plugin
sidebarTitle: Update and plugin tests
summary: OpenClaw ตรวจสอบเส้นทางการอัปเดต การย้ายแพ็กเกจ และพฤติกรรมการติดตั้ง/อัปเดต Plugin อย่างไร
title: 'การทดสอบ: การอัปเดตและ Plugin'
x-i18n:
    generated_at: "2026-06-27T17:41:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be94eab4be97c53022bdac3110da74a61cfa23db989964c803497305e5415db
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

นี่คือเช็กลิสต์เฉพาะสำหรับการตรวจสอบความถูกต้องของการอัปเดตและ Plugin เป้าหมาย
เรียบง่าย: พิสูจน์ว่าแพ็กเกจที่ติดตั้งได้สามารถอัปเดตสถานะผู้ใช้จริง ซ่อมแซมสถานะ
ดั้งเดิมเก่าผ่าน `doctor` และยังคงติดตั้ง โหลด อัปเดต และถอนการติดตั้ง
Plugin จากแหล่งที่รองรับได้

สำหรับแผนผังตัวรันการทดสอบที่กว้างขึ้น โปรดดู [การทดสอบ](/th/help/testing) สำหรับ
คีย์ผู้ให้บริการแบบสดและชุดทดสอบที่แตะเครือข่าย โปรดดู [การทดสอบแบบสด](/th/help/testing-live)

## สิ่งที่เราปกป้อง

การทดสอบอัปเดตและ Plugin ปกป้องสัญญาเหล่านี้:

- tarball ของแพ็กเกจสมบูรณ์ มี `dist/postinstall-inventory.json` ที่ถูกต้อง
  และไม่ขึ้นกับไฟล์ repo ที่ยังไม่ได้แพ็ก
- ผู้ใช้สามารถย้ายจากแพ็กเกจที่เผยแพร่เก่ากว่าไปยังแพ็กเกจตัวเลือกได้
  โดยไม่สูญเสีย config, agent, session, workspace, allowlist ของ Plugin หรือ
  channel config
- `openclaw doctor --fix --non-interactive` เป็นเจ้าของเส้นทางล้างและซ่อมแซม
  ดั้งเดิมเก่า Startup ไม่ควรเพิ่ม migration ความเข้ากันได้ที่ซ่อนอยู่สำหรับ
  สถานะ Plugin ที่ค้างเก่า
- การติดตั้ง Plugin ทำงานจากไดเรกทอรีในเครื่อง, git repo, แพ็กเกจ npm และเส้นทาง
  registry ของ ClawHub
- dependency ของ npm สำหรับ Plugin ถูกติดตั้งในโปรเจกต์ npm ที่จัดการหนึ่งรายการต่อ
  Plugin สแกนก่อนเชื่อถือ และถูกลบผ่าน npm ระหว่างถอนการติดตั้ง เพื่อไม่ให้
  dependency ที่ถูก hoist ค้างอยู่
- การอัปเดต Plugin เสถียรเมื่อไม่มีอะไรเปลี่ยน: install record, source ที่ resolve แล้ว,
  layout ของ dependency ที่ติดตั้ง และสถานะ enabled ยังคงอยู่ครบถ้วน

## หลักฐานในเครื่องระหว่างการพัฒนา

เริ่มแบบแคบ:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

สำหรับการเปลี่ยนแปลงด้านการติดตั้ง Plugin, การถอนการติดตั้ง, dependency หรือ
package-inventory ให้รันการทดสอบแบบเจาะจงที่ครอบคลุม seam ที่แก้ไขด้วย:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

ก่อนที่ Docker lane ของแพ็กเกจใดจะใช้ tarball ให้พิสูจน์ artifact ของแพ็กเกจก่อน:

```bash
pnpm release:check
```

`release:check` รันการตรวจสอบ drift ของ config/docs/API, เขียน inventory ของ package dist,
รัน `npm pack --dry-run`, ปฏิเสธไฟล์ที่ห้ามถูกแพ็ก, ติดตั้ง tarball ลงใน temp prefix,
รัน postinstall และ smoke entrypoint ของ channel ที่ bundle มา

## Docker lane

Docker lane คือหลักฐานระดับผลิตภัณฑ์ โดยจะติดตั้งหรืออัปเดตแพ็กเกจจริง
ภายในคอนเทนเนอร์ Linux และยืนยันพฤติกรรมผ่านคำสั่ง CLI, การเริ่มต้น Gateway,
HTTP probe, สถานะ RPC และสถานะ filesystem

ใช้ lane แบบเจาะจงระหว่างทำซ้ำ:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Lane สำคัญ:

- `test:docker:plugins` ตรวจสอบ smoke การติดตั้ง Plugin, การติดตั้งจากโฟลเดอร์ในเครื่อง,
  พฤติกรรมข้ามการอัปเดตโฟลเดอร์ในเครื่อง, โฟลเดอร์ในเครื่องที่มี dependency ติดตั้งไว้ล่วงหน้า,
  การติดตั้งแพ็กเกจ `file:`, การติดตั้งจาก git พร้อมการเรียกใช้ CLI, การอัปเดต moving-ref ของ git,
  การติดตั้งจาก npm registry พร้อม transitive dependency ที่ถูก hoist, no-op ของการอัปเดต npm,
  การปฏิเสธ metadata แพ็กเกจ npm ที่ผิดรูป, การติดตั้งจาก fixture ClawHub ในเครื่องและ no-op ของการอัปเดต,
  พฤติกรรมการอัปเดต marketplace และการ enable/inspect ของ Claude-bundle ตั้งค่า `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อให้บล็อก ClawHub เป็นแบบ hermetic/offline
- `test:docker:plugin-lifecycle-matrix` ติดตั้งแพ็กเกจตัวเลือกในคอนเทนเนอร์เปล่า,
  รัน Plugin npm ผ่าน install, inspect, disable, enable, explicit upgrade, explicit downgrade
  และ uninstall หลังลบโค้ด Plugin โดยจะบันทึก metric RSS และ CPU สำหรับแต่ละเฟส
- `test:docker:plugin-update` ตรวจสอบว่า Plugin ที่ติดตั้งแล้วและไม่เปลี่ยนแปลง
  จะไม่ติดตั้งซ้ำหรือสูญเสีย metadata การติดตั้งระหว่าง `openclaw plugins update`
- `test:docker:upgrade-survivor` ติดตั้ง tarball ตัวเลือกทับ fixture ผู้ใช้เก่าที่มีสถานะสกปรก,
  รันการอัปเดตแพ็กเกจพร้อม doctor แบบ non-interactive จากนั้นเริ่ม Gateway แบบ loopback
  และตรวจสอบการรักษาสถานะ
- `test:docker:published-upgrade-survivor` ติดตั้ง baseline ที่เผยแพร่ก่อน,
  config ผ่านสูตร `openclaw config set` ที่อบไว้, อัปเดตเป็น tarball ตัวเลือก,
  รัน doctor, ตรวจสอบการล้างของเก่า, เริ่ม Gateway และ probe `/healthz`, `/readyz`
  รวมถึงสถานะ RPC
- `test:docker:update-restart-auth` ติดตั้งแพ็กเกจตัวเลือก, เริ่ม Gateway แบบ token-auth ที่จัดการอยู่,
  unset env auth ของ gateway ฝั่ง caller สำหรับ `openclaw update --yes --json` และกำหนดให้คำสั่งอัปเดตตัวเลือก
  restart Gateway ก่อน probe ปกติ
- `test:docker:update-migration` คือ lane published-update ที่เน้นการล้างมากเป็นพิเศษ โดยเริ่มจาก
  สถานะผู้ใช้สไตล์ Discord/Telegram ที่ config แล้ว, รัน doctor baseline เพื่อให้ dependency ของ Plugin
  ที่ config แล้วมีโอกาส materialize, seed เศษซาก dependency ดั้งเดิมเก่าของ Plugin สำหรับ Plugin แบบแพ็กเกจที่ config แล้ว,
  อัปเดตเป็น tarball ตัวเลือก และกำหนดให้ doctor หลังอัปเดตลบ root ของ dependency ดั้งเดิมเก่าออก

Variant ที่มีประโยชน์ของ published-upgrade survivor:

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
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` จะขยายเป็น scenario ที่มีรูปทรงเหมือน issue ที่ถูกรายงานทั้งหมด
รวมถึง migration การติดตั้ง Plugin ที่ config แล้ว

Full update migration แยกออกจาก Full Release CI โดยตั้งใจ ใช้ workflow แบบ manual
`Update Migration` เมื่อคำถามของ release คือ "ทุก stable release ที่เผยแพร่ตั้งแต่ 2026.4.23 เป็นต้นไป
สามารถอัปเดตเป็นตัวเลือกนี้และล้างเศษซาก dependency ของ Plugin ได้หรือไม่":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## การยอมรับแพ็กเกจ

Package Acceptance คือ gate แพ็กเกจแบบ GitHub-native โดย resolve แพ็กเกจตัวเลือกหนึ่งรายการ
เป็น tarball `package-under-test`, บันทึก version และ SHA-256 จากนั้นรัน Docker E2E lane ที่ reusable
กับ tarball เดียวกันนั้น ref ของ workflow harness แยกจาก ref ของ source แพ็กเกจ
ดังนั้น logic การทดสอบปัจจุบันจึงตรวจสอบ release เก่าที่เชื่อถือได้ได้

แหล่งตัวเลือก:

- `source=npm`: ตรวจสอบ `openclaw@beta`, `openclaw@latest` หรือ version ที่เผยแพร่แบบเจาะจง
- `source=ref`: แพ็ก branch, tag หรือ commit ที่เชื่อถือได้ด้วย harness ปัจจุบันที่เลือก
- `source=url`: ตรวจสอบ tarball HTTPS สาธารณะพร้อม `package_sha256` ที่จำเป็น
  เส้นทางนี้ปฏิเสธ credential ใน URL, พอร์ต HTTPS ที่ไม่ใช่ค่า default, hostname หรือผลลัพธ์ DNS/IP แบบ private/internal,
  พื้นที่ IP สำหรับการใช้งานพิเศษ และ redirect ที่ไม่ปลอดภัย
- `source=trusted-url`: ตรวจสอบ tarball HTTPS พร้อม `package_sha256` และ `trusted_source_id` ที่จำเป็น
  เทียบกับ policy ที่ maintainer เป็นเจ้าของใน `.github/package-trusted-sources.json` ใช้เส้นทางนี้สำหรับ mirror
  enterprise/private แทนการทำให้ `source=url` อ่อนลงด้วยสวิตช์ allow-private ระดับ input
  Bearer auth เมื่อ config โดย policy จะใช้ secret คงที่ `OPENCLAW_TRUSTED_PACKAGE_TOKEN`
- `source=artifact`: ใช้ tarball ที่อัปโหลดโดย Actions run อื่นซ้ำ

Full Release Validation ใช้ `source=artifact` เป็นค่า default ซึ่ง build จาก SHA ของ release ที่ resolve แล้ว
สำหรับหลักฐานหลังเผยแพร่ ให้ส่ง
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` เพื่อให้ upgrade matrix เดียวกัน
target แพ็กเกจ npm ที่ส่งมอบแล้วแทน

Release check เรียก Package Acceptance ด้วยชุด package/update/restart/plugin:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

เมื่อเปิดใช้งาน release soak จะส่งค่าต่อไปนี้ด้วย:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

สิ่งนี้ทำให้ package migration, การสลับ update channel, tolerance ต่อ managed-plugin ที่เสียหาย,
การล้าง dependency ของ Plugin ที่ค้างเก่า, coverage ของ Plugin แบบ offline, พฤติกรรมการอัปเดต Plugin
และ QA แพ็กเกจ Telegram อยู่บน artifact ที่ resolve เดียวกัน โดยไม่ทำให้ gate แพ็กเกจ release แบบ default
ต้องเดินผ่านทุก release ที่เผยแพร่แล้ว

`last-stable-4` resolve เป็น release OpenClaw แบบ stable สี่รายการล่าสุดที่เผยแพร่บน npm
Release package acceptance pin `2026.4.23` เป็นขอบเขตความเข้ากันได้แรกของ plugin-update,
`2026.5.2` เป็นขอบเขต churn ของสถาปัตยกรรม Plugin และ `2026.4.15` เป็น baseline published-update
เก่ากว่าจาก 2026.4.1x; resolver จะ dedupe pin ที่อยู่ในสี่รายการล่าสุดอยู่แล้ว สำหรับ coverage migration
published update แบบ exhaustive ให้ใช้ `all-since-2026.4.23` ใน workflow Update Migration แยก
แทน Full Release CI `release-history` ยังคงพร้อมใช้สำหรับการสุ่มตัวอย่างที่กว้างขึ้นแบบ manual
เมื่อคุณต้องการ anchor pre-date ดั้งเดิมเก่าด้วย

เมื่อเลือก baseline ของ published-upgrade survivor หลายรายการ workflow Docker ที่ reusable
จะแบ่ง shard baseline แต่ละรายการเป็น runner job เป้าหมายของตัวเอง แต่ละ baseline shard
ยังคงรันชุด scenario ที่เลือก แต่ log และ artifact จะอยู่แยกตาม baseline และ wall time
ถูกจำกัดด้วย shard ที่ช้าที่สุดแทน job serial ขนาดใหญ่หนึ่งรายการ

รัน package profile แบบ manual เมื่อตรวจสอบตัวเลือกก่อน release:

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

ใช้ `suite_profile=product` เมื่อคำถามของ release รวมถึง MCP channel,
การล้าง cron/subagent, OpenAI web search หรือ OpenWebUI ใช้ `suite_profile=full`
เฉพาะเมื่อคุณต้องการ coverage เส้นทาง release ของ Docker แบบเต็ม

## ค่า default ของ release

สำหรับ release candidate ชุดหลักฐาน default คือ:

1. `pnpm check:changed` และ `pnpm test:changed` สำหรับ regression ระดับ source
2. `pnpm release:check` สำหรับความสมบูรณ์ของ artifact แพ็กเกจ
3. Package Acceptance profile `package` หรือ lane แพ็กเกจแบบ custom ของ release-check
   สำหรับสัญญา install/update/restart/plugin
4. release check ข้าม OS สำหรับ installer, onboarding และพฤติกรรม platform เฉพาะ OS
5. ชุดทดสอบแบบสดเฉพาะเมื่อ surface ที่เปลี่ยนแตะพฤติกรรมผู้ให้บริการหรือ hosted-service

บนเครื่อง maintainer, gate กว้างและหลักฐานผลิตภัณฑ์ Docker/package ควรรันใน Testbox
เว้นแต่ตั้งใจทำหลักฐานในเครื่องอย่างชัดเจน

## ความเข้ากันได้ดั้งเดิมเก่า

การผ่อนปรนด้านความเข้ากันได้แคบและมีกำหนดเวลา:

- แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจยอมรับช่องว่าง metadata
  ของแพ็กเกจที่ส่งมอบไปแล้วใน Package Acceptance
- แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ stamp metadata ของ build ในเครื่อง
  ที่ส่งมอบไปแล้ว
- แพ็กเกจหลังจากนั้นต้องผ่านสัญญาสมัยใหม่ ช่องว่างเดียวกันจะ fail แทนการเตือนหรือข้าม

อย่าเพิ่ม startup migration ใหม่สำหรับ shape เก่าเหล่านี้ เพิ่มหรือขยายการซ่อมแซมของ doctor
แล้วพิสูจน์ด้วย `upgrade-survivor`, `published-upgrade-survivor` หรือ
`update-restart-auth` เมื่อคำสั่งอัปเดตเป็นเจ้าของการ restart

## การเพิ่ม coverage

เมื่อเปลี่ยนพฤติกรรมการอัปเดตหรือ Plugin ให้เพิ่ม coverage ที่ layer ต่ำที่สุดที่
สามารถ fail ด้วยเหตุผลที่ถูกต้อง:

- ตรรกะเกี่ยวกับพาธหรือเมทาดาทาล้วน ๆ: ทดสอบแบบ unit ไว้ข้างซอร์ส
- ลักษณะการทำงานของ inventory ของแพ็กเกจหรือไฟล์ที่ถูกแพ็ก: ทดสอบด้วย `package-dist-inventory` หรือ tarball
  checker
- ลักษณะการทำงานของการติดตั้ง/อัปเดตผ่าน CLI: assertion ใน Docker lane หรือ fixture
- ลักษณะการทำงานของการย้ายข้อมูลจากรีลีสที่เผยแพร่แล้ว: สถานการณ์ `published-upgrade-survivor`
- ลักษณะการทำงานของการรีสตาร์ทที่การอัปเดตเป็นเจ้าของ: `update-restart-auth`
- ลักษณะการทำงานของซอร์ส registry/แพ็กเกจ: fixture ของ `test:docker:plugins` หรือเซิร์ฟเวอร์ fixture ของ ClawHub
- ลักษณะการทำงานของเลย์เอาต์ dependency หรือการล้างข้อมูล: assert ทั้งการทำงานตอนรันไทม์และขอบเขตของ
  ระบบไฟล์ dependency ของ npm อาจถูก hoist ไว้ภายในโปรเจกต์ npm ที่ Plugin
  จัดการอยู่ ดังนั้นการทดสอบควรพิสูจน์ว่าโปรเจกต์นั้นถูกสแกน/ล้างข้อมูล
  แทนที่จะสมมติว่ามีเพียงแผนผัง `node_modules` ภายในแพ็กเกจ Plugin เท่านั้น

ให้ Docker fixture ใหม่เป็นแบบ hermetic โดยค่าเริ่มต้น ใช้ registry fixture ในเครื่องและ
แพ็กเกจปลอม เว้นแต่ว่าจุดประสงค์ของการทดสอบคือพฤติกรรมของ registry จริง

## การคัดแยกความล้มเหลว

เริ่มจากตัวตนของ artifact:

- สรุป `resolve_package` ของ Package Acceptance: ซอร์ส, เวอร์ชัน, SHA-256 และ
  ชื่อ artifact
- Docker artifacts: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, บันทึก lane และคำสั่ง rerun
- สรุป upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  รวมถึงเวอร์ชัน baseline, เวอร์ชัน candidate, สถานการณ์, เวลาในแต่ละ phase และ
  ขั้นตอน recipe

ควร rerun lane ที่ล้มเหลวเดิมแบบเจาะจงด้วย artifact แพ็กเกจเดิม มากกว่า
rerun release umbrella ทั้งหมด
