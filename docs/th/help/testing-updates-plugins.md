---
read_when:
    - การเปลี่ยนแปลงพฤติกรรมการอัปเดต OpenClaw, doctor, การยอมรับแพ็กเกจ หรือการติดตั้ง Plugin
    - การเตรียมหรืออนุมัติรุ่นที่เสนอให้เผยแพร่
    - การดีบักการอัปเดตแพ็กเกจ การล้างข้อมูลการพึ่งพาของ Plugin หรือปัญหาถดถอยในการติดตั้ง Plugin
sidebarTitle: Update and plugin tests
summary: วิธีที่ OpenClaw ตรวจสอบความถูกต้องของเส้นทางการอัปเดต การย้ายข้อมูลแพ็กเกจ และพฤติกรรมการติดตั้ง/อัปเดต Plugin
title: 'การทดสอบ: การอัปเดตและ Plugins'
x-i18n:
    generated_at: "2026-05-06T09:17:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: db3790bb8c6b952458342727f3e326f9610b4d8155889dfdadb143e3ef07aa46
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

นี่คือรายการตรวจสอบเฉพาะสำหรับการตรวจสอบความถูกต้องของการอัปเดตและ Plugin เป้าหมายนั้นเรียบง่าย: พิสูจน์ว่าแพ็กเกจที่ติดตั้งได้สามารถอัปเดตสถานะผู้ใช้จริง ซ่อมแซมสถานะเดิมที่ล้าสมัยผ่าน `doctor` และยังคงติดตั้ง โหลด อัปเดต และถอนการติดตั้ง Plugin จากแหล่งที่รองรับได้

สำหรับแผนผังตัวรันทดสอบที่กว้างกว่า โปรดดู [การทดสอบ](/th/help/testing) สำหรับคีย์ผู้ให้บริการแบบสดและชุดทดสอบที่แตะเครือข่าย โปรดดู [การทดสอบแบบสด](/th/help/testing-live)

## สิ่งที่เราปกป้อง

การทดสอบอัปเดตและ Plugin ปกป้องสัญญาเหล่านี้:

- ทาร์บอลแพ็กเกจต้องครบถ้วน มี `dist/postinstall-inventory.json` ที่ถูกต้อง และไม่พึ่งพาไฟล์ repo ที่ยังไม่ได้แพ็ก
- ผู้ใช้สามารถย้ายจากแพ็กเกจที่เผยแพร่รุ่นเก่าไปยังแพ็กเกจตัวเลือกได้โดยไม่สูญเสีย config, agents, sessions, workspaces, รายการอนุญาต Plugin หรือ config ช่องทาง
- `openclaw doctor --fix --non-interactive` เป็นเจ้าของเส้นทางล้างข้อมูลและซ่อมแซมระบบเดิม Startup ไม่ควรเพิ่ม migration ความเข้ากันได้ที่ซ่อนอยู่สำหรับสถานะ Plugin ที่ล้าสมัย
- การติดตั้ง Plugin ทำงานได้จากไดเรกทอรีในเครื่อง, git repos, แพ็กเกจ npm และเส้นทางรีจิสทรี ClawHub
- dependency ของ Plugin ใน npm ถูกติดตั้งใน root npm ที่จัดการไว้ ถูกสแกนก่อน trust และถูกนำออกผ่าน npm ระหว่างถอนการติดตั้ง เพื่อไม่ให้ dependency ที่ถูก hoist ค้างอยู่
- การอัปเดต Plugin เสถียรเมื่อไม่มีอะไรเปลี่ยนแปลง: ระเบียนการติดตั้ง แหล่งที่ resolve แล้ว โครงร่าง dependency ที่ติดตั้ง และสถานะ enabled ยังคงเดิม

## หลักฐานในเครื่องระหว่างพัฒนา

เริ่มแบบแคบ:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

สำหรับการเปลี่ยนแปลงเกี่ยวกับการติดตั้ง Plugin, การถอนการติดตั้ง, dependency หรือ package-inventory ให้รันการทดสอบแบบเจาะจงที่ครอบคลุม seam ที่แก้ไขด้วย:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

ก่อนที่เลน Docker ของแพ็กเกจใดจะใช้ทาร์บอล ให้พิสูจน์ artifact ของแพ็กเกจ:

```bash
pnpm release:check
```

`release:check` รันการตรวจ drift ของ config/docs/API, เขียน inventory dist ของแพ็กเกจ, รัน `npm pack --dry-run`, ปฏิเสธไฟล์ที่ห้ามแพ็ก, ติดตั้งทาร์บอลลงใน prefix ชั่วคราว, รัน postinstall และ smoke entrypoint ของช่องทางที่ bundled มา

## เลน Docker

เลน Docker คือหลักฐานระดับผลิตภัณฑ์ เลนเหล่านี้ติดตั้งหรืออัปเดตแพ็กเกจจริงภายในคอนเทนเนอร์ Linux และตรวจยืนยันพฤติกรรมผ่านคำสั่ง CLI, การเริ่มต้น Gateway, HTTP probes, สถานะ RPC และสถานะระบบไฟล์

ใช้เลนแบบเจาะจงระหว่างวนพัฒนา:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

เลนสำคัญ:

- `test:docker:plugins` ตรวจสอบ smoke การติดตั้ง Plugin, การติดตั้งจากโฟลเดอร์ในเครื่อง, พฤติกรรมข้ามการอัปเดตโฟลเดอร์ในเครื่อง, โฟลเดอร์ในเครื่องที่มี dependency ติดตั้งไว้ล่วงหน้า, การติดตั้งแพ็กเกจ `file:`, การติดตั้งจาก git พร้อมการรัน CLI, การอัปเดต moving-ref ของ git, การติดตั้งจากรีจิสทรี npm พร้อม dependency แบบ transitive ที่ถูก hoist, no-op ของการอัปเดต npm, การติดตั้งจาก fixture ClawHub ในเครื่องและ no-op ของการอัปเดต, พฤติกรรมการอัปเดต marketplace และการ enable/inspect บันเดิล Claude ตั้งค่า `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` เพื่อให้บล็อก ClawHub เป็น hermetic/offline
- `test:docker:plugin-lifecycle-matrix` ติดตั้งแพ็กเกจตัวเลือกในคอนเทนเนอร์เปล่า รัน Plugin npm ผ่าน install, inspect, disable, enable, explicit upgrade, explicit downgrade และ uninstall หลังจากลบโค้ด Plugin โดยจะบันทึกเมตริก RSS และ CPU ของแต่ละเฟส
- `test:docker:plugin-update` ตรวจสอบว่า Plugin ที่ติดตั้งไว้และไม่เปลี่ยนแปลงจะไม่ติดตั้งใหม่หรือสูญเสีย metadata การติดตั้งระหว่าง `openclaw plugins update`
- `test:docker:upgrade-survivor` ติดตั้งทาร์บอลตัวเลือกทับ fixture ผู้ใช้เก่าที่สกปรก รันการอัปเดตแพ็กเกจพร้อม doctor แบบไม่โต้ตอบ จากนั้นเริ่ม Gateway แบบ loopback และตรวจการคงสถานะ
- `test:docker:published-upgrade-survivor` ติดตั้ง baseline ที่เผยแพร่ก่อน ตั้งค่าผ่านสูตร `openclaw config set` ที่ baked ไว้ อัปเดตไปยังทาร์บอลตัวเลือก รัน doctor ตรวจการล้างข้อมูล legacy เริ่ม Gateway และ probe `/healthz`, `/readyz` และสถานะ RPC
- `test:docker:update-restart-auth` ติดตั้งแพ็กเกจตัวเลือก เริ่ม Gateway แบบ managed token-auth ยกเลิก env auth ของ gateway ผู้เรียกสำหรับ `openclaw update --yes --json` และกำหนดให้คำสั่งอัปเดตตัวเลือก restart Gateway ก่อน probe ตามปกติ
- `test:docker:update-migration` คือเลนอัปเดตจากแพ็กเกจที่เผยแพร่ซึ่งเน้นการล้างข้อมูลมาก เลนนี้เริ่มจากสถานะผู้ใช้สไตล์ Discord/Telegram ที่ตั้งค่าไว้ รัน baseline doctor เพื่อให้ dependency ของ Plugin ที่ตั้งค่าไว้มีโอกาส materialize, seed เศษ dependency ของ Plugin legacy สำหรับ Plugin ที่แพ็กไว้และตั้งค่าแล้ว อัปเดตไปยังทาร์บอลตัวเลือก และกำหนดให้ doctor หลังอัปเดตนำ root dependency legacy ออก

variant ของ published-upgrade survivor ที่มีประโยชน์:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

scenario ที่มีคือ `base`, `feishu-channel`, `bootstrap-persona`, `plugin-deps-cleanup`, `configured-plugin-installs`, `stale-source-plugin-shadow`, `tilde-log-path` และ `versioned-runtime-deps` ในการรันแบบ aggregate, `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` จะขยายเป็น scenario รูปแบบ issue ที่ถูกรายงานทั้งหมด รวมถึง migration การติดตั้ง Plugin ที่ตั้งค่าไว้

การ migration การอัปเดตเต็มรูปแบบถูกแยกออกจาก CI รีลีสเต็มรูปแบบโดยตั้งใจ ใช้เวิร์กโฟลว์ `Update Migration` แบบ manual เมื่อคำถามของรีลีสคือ "รีลีส stable ที่เผยแพร่แล้วทุกตัวตั้งแต่ 2026.4.23 เป็นต้นมาสามารถอัปเดตมายังตัวเลือกนี้และล้างเศษ dependency ของ Plugin ได้หรือไม่":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## การยอมรับแพ็กเกจ

การยอมรับแพ็กเกจคือ gate แพ็กเกจแบบ GitHub-native โดยจะ resolve แพ็กเกจตัวเลือกหนึ่งตัวเป็นทาร์บอล `package-under-test`, บันทึกเวอร์ชันและ SHA-256 จากนั้นรันเลน Docker E2E แบบ reusable กับทาร์บอลนั้นโดยตรง ref ของ workflow harness แยกจาก ref แหล่งแพ็กเกจ ดังนั้นตรรกะทดสอบปัจจุบันจึงตรวจสอบความถูกต้องของรีลีสที่ trusted รุ่นเก่าได้

แหล่งตัวเลือก:

- `source=npm`: ตรวจสอบ `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันที่เผยแพร่แบบระบุแน่นอน
- `source=ref`: แพ็ก branch, tag หรือ commit ที่ trusted ด้วย harness ปัจจุบันที่เลือกไว้
- `source=url`: ตรวจสอบทาร์บอล HTTPS พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: ใช้ทาร์บอลที่อัปโหลดโดย Actions run อื่นซ้ำ

การตรวจสอบรีลีสเต็มรูปแบบใช้ `source=artifact` เป็นค่าเริ่มต้น ซึ่งสร้างจาก release SHA ที่ resolve แล้ว สำหรับหลักฐานหลังเผยแพร่ ให้ส่ง `package_acceptance_package_spec=openclaw@YYYY.M.D` เพื่อให้ matrix อัปเกรดเดียวกันกำหนดเป้าหมายเป็นแพ็กเกจ npm ที่ส่งออกจริงแทน

การตรวจรีลีสเรียกการยอมรับแพ็กเกจด้วยชุด package/update/restart/plugin:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

เมื่อเปิด release soak จะส่งสิ่งนี้ด้วย:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

สิ่งนี้ทำให้ package migration, การสลับ update channel, ความทนทานต่อ managed-plugin ที่เสีย, การล้าง dependency ของ Plugin ที่ล้าสมัย, coverage ของ Plugin แบบ offline, พฤติกรรมการอัปเดต Plugin และ QA แพ็กเกจ Telegram อยู่บน artifact ที่ resolve เดียวกัน โดยไม่ทำให้ gate แพ็กเกจรีลีสค่าเริ่มต้นต้องเดินผ่านทุกรีลีสที่เผยแพร่แล้ว

`last-stable-4` resolve เป็นรีลีส OpenClaw stable สี่รุ่นล่าสุดที่เผยแพร่บน npm การยอมรับแพ็กเกจรีลีส pin `2026.4.23` เป็นขอบเขตความเข้ากันได้แรกของ plugin-update, `2026.5.2` เป็นขอบเขต churn ของสถาปัตยกรรม Plugin และ `2026.4.15` เป็น baseline การอัปเดตจากแพ็กเกจที่เผยแพร่ของ 2026.4.1x ที่เก่ากว่า; resolver จะ dedupe pin ที่อยู่ในสี่รุ่นล่าสุดแล้ว สำหรับ coverage migration การอัปเดตจากแพ็กเกจที่เผยแพร่แบบครบถ้วน ให้ใช้ `all-since-2026.4.23` ในเวิร์กโฟลว์ Update Migration แยกต่างหากแทน Full Release CI `release-history` ยังคงพร้อมใช้งานสำหรับการสุ่มตัวอย่างที่กว้างขึ้นแบบ manual เมื่อคุณต้องการ anchor ก่อนวันที่แบบ legacy ด้วย

เมื่อเลือก baseline published-upgrade survivor หลายรายการ เวิร์กโฟลว์ Docker แบบ reusable จะแยกแต่ละ baseline เป็น job runner แบบเจาะจงของตัวเอง แต่ละ shard ของ baseline ยังคงรันชุด scenario ที่เลือกไว้ แต่ log และ artifact จะอยู่แยกตาม baseline และ wall time ถูกจำกัดด้วย shard ที่ช้าที่สุดแทนที่จะเป็น job serial ขนาดใหญ่หนึ่งงาน

รัน profile แพ็กเกจแบบ manual เมื่อตรวจสอบตัวเลือกก่อนรีลีส:

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

ใช้ `suite_profile=product` เมื่อคำถามของรีลีสรวมถึงช่องทาง MCP, การล้าง cron/subagent, การค้นเว็บ OpenAI หรือ OpenWebUI ใช้ `suite_profile=full` เฉพาะเมื่อคุณต้องการ coverage ของเส้นทางรีลีส Docker แบบเต็ม

## ค่าเริ่มต้นของรีลีส

สำหรับ release candidate ชุดหลักฐานค่าเริ่มต้นคือ:

1. `pnpm check:changed` และ `pnpm test:changed` สำหรับ regression ระดับ source
2. `pnpm release:check` สำหรับความสมบูรณ์ของ artifact แพ็กเกจ
3. profile `package` ของการยอมรับแพ็กเกจ หรือเลนแพ็กเกจ custom ของ release-check สำหรับสัญญา install/update/restart/plugin
4. การตรวจรีลีสข้าม OS สำหรับ installer, onboarding และพฤติกรรม platform เฉพาะ OS
5. ชุดทดสอบแบบสดเฉพาะเมื่อพื้นผิวที่เปลี่ยนแตะพฤติกรรม provider หรือ hosted-service

บนเครื่อง maintainer, gate แบบกว้างและหลักฐานผลิตภัณฑ์ Docker/package ควรรันใน Testbox เว้นแต่จะทำหลักฐานในเครื่องโดยชัดเจน

## ความเข้ากันได้กับ legacy

ความผ่อนปรนด้านความเข้ากันได้มีขอบเขตแคบและมีกรอบเวลา:

- แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจยอมรับช่องว่าง metadata ของแพ็กเกจที่ส่งออกไปแล้วในการยอมรับแพ็กเกจได้
- แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ stamp metadata ของ build ในเครื่องที่ส่งออกไปแล้ว
- แพ็กเกจหลังจากนั้นต้องผ่านสัญญาสมัยใหม่ ช่องว่างเดียวกันจะ fail แทนที่จะเตือนหรือข้าม

อย่าเพิ่ม startup migration ใหม่สำหรับรูปทรงเก่าเหล่านี้ ให้เพิ่มหรือขยายการซ่อมแซมของ doctor แล้วพิสูจน์ด้วย `upgrade-survivor`, `published-upgrade-survivor` หรือ `update-restart-auth` เมื่อคำสั่งอัปเดตเป็นเจ้าของการ restart

## การเพิ่ม coverage

เมื่อเปลี่ยนพฤติกรรมอัปเดตหรือ Plugin ให้เพิ่ม coverage ที่ชั้นต่ำสุดที่สามารถ fail ด้วยเหตุผลที่ถูกต้อง:

- ตรรกะ path หรือ metadata ล้วน: unit test ข้าง source
- พฤติกรรม package inventory หรือ packed-file: การทดสอบ `package-dist-inventory` หรือ tarball checker
- พฤติกรรม CLI install/update: assertion หรือ fixture ในเลน Docker
- พฤติกรรม migration ของรีลีสที่เผยแพร่: scenario `published-upgrade-survivor`
- พฤติกรรม restart ที่ update เป็นเจ้าของ: `update-restart-auth`
- พฤติกรรม registry/package source: fixture `test:docker:plugins` หรือเซิร์ฟเวอร์ fixture ClawHub
- พฤติกรรมโครงร่างหรือการล้าง dependency: assert ทั้งการรัน runtime และขอบเขตระบบไฟล์ dependency npm อาจถูก hoist ภายใต้ root npm ที่จัดการไว้ ดังนั้นการทดสอบควรพิสูจน์ว่า root ถูกสแกน/ล้าง แทนที่จะสมมติว่ามี tree `node_modules` ภายในแพ็กเกจ

ให้ fixture Docker ใหม่เป็น hermetic โดยค่าเริ่มต้น ใช้รีจิสทรี fixture ในเครื่องและแพ็กเกจปลอม เว้นแต่ประเด็นของการทดสอบคือพฤติกรรมรีจิสทรีแบบสด

## การ triage ความล้มเหลว

เริ่มจาก identity ของ artifact:

- สรุป Package Acceptance `resolve_package`: แหล่งที่มา เวอร์ชัน SHA-256 และ
  ชื่ออาร์ติแฟกต์
- อาร์ติแฟกต์ Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, บันทึกของเลน และคำสั่งรันซ้ำ
- สรุปผู้รอดจากการอัปเกรด: `.artifacts/upgrade-survivor/summary.json`,
  รวมถึงเวอร์ชันฐาน เวอร์ชันตัวเลือก สถานการณ์ เวลาของแต่ละเฟส และ
  ขั้นตอนของสูตร

ควรรันเลนที่ล้มเหลวเดิมแบบตรงจุดซ้ำด้วยอาร์ติแฟกต์แพ็กเกจเดียวกัน
แทนการรันกรอบงานรีลีสทั้งหมดซ้ำ
