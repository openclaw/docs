---
read_when:
    - กำลังค้นหานิยามช่องทางการเผยแพร่สาธารณะ
    - การเรียกใช้การตรวจสอบความถูกต้องของรีลีสหรือการยอมรับแพ็กเกจ
    - กำลังค้นหารูปแบบการตั้งชื่อเวอร์ชันและรอบการออกรุ่น
summary: เลนการเผยแพร่, รายการตรวจสอบสำหรับผู้ปฏิบัติการ, กล่องตรวจสอบความถูกต้อง, การตั้งชื่อเวอร์ชัน และรอบการเผยแพร่
title: นโยบายการเผยแพร่
x-i18n:
    generated_at: "2026-05-04T07:06:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef50d3ef5d1e23b4e2c2b097fc4ca9f6d46bf8acb9aea0c9bca6d14e213b88b6
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw มีเลนการเผยแพร่สาธารณะสามเลน:

- stable: รุ่นเผยแพร่ที่ติดแท็ก ซึ่งเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อมีการร้องขออย่างชัดเจน
- beta: แท็กก่อนเผยแพร่ที่เผยแพร่ไปยัง npm `beta`
- dev: หัวปัจจุบันที่เปลี่ยนแปลงอยู่ของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันรุ่นเผยแพร่เสถียร: `YYYY.M.D`
  - แท็ก Git: `vYYYY.M.D`
- เวอร์ชันรุ่นเผยแพร่แก้ไขของรุ่นเสถียร: `YYYY.M.D-N`
  - แท็ก Git: `vYYYY.M.D-N`
- เวอร์ชันก่อนเผยแพร่ Beta: `YYYY.M.D-beta.N`
  - แท็ก Git: `vYYYY.M.D-beta.N`
- อย่าเติมศูนย์นำหน้าเดือนหรือวัน
- `latest` หมายถึงรุ่นเผยแพร่ npm เสถียรที่ได้รับการโปรโมตในปัจจุบัน
- `beta` หมายถึงเป้าหมายการติดตั้ง beta ปัจจุบัน
- รุ่นเผยแพร่เสถียรและรุ่นเผยแพร่แก้ไขของรุ่นเสถียรจะเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น; ผู้ดำเนินการเผยแพร่สามารถกำหนดเป้าหมาย `latest` อย่างชัดเจน หรือโปรโมตบิลด์ beta ที่ตรวจสอบแล้วในภายหลังได้
- OpenClaw รุ่นเผยแพร่เสถียรทุกเวอร์ชันจะส่งแพ็กเกจ npm และแอป macOS พร้อมกัน;
  รุ่น beta โดยปกติจะตรวจสอบและเผยแพร่เส้นทาง npm/แพ็กเกจก่อน โดยสงวนการ build/sign/notarize แอป Mac ไว้สำหรับรุ่นเสถียร เว้นแต่จะมีการร้องขออย่างชัดเจน

## จังหวะการเผยแพร่

- การเผยแพร่จะเดินหน้าแบบ beta-first
- รุ่นเสถียรจะตามมาหลังจาก beta ล่าสุดได้รับการตรวจสอบแล้วเท่านั้น
- โดยปกติผู้ดูแลจะตัดรุ่นจากสาขา `release/YYYY.M.D` ที่สร้างจาก `main` ปัจจุบัน เพื่อให้การตรวจสอบรุ่นเผยแพร่และการแก้ไขไม่บล็อกการพัฒนาใหม่บน `main`
- หากแท็ก beta ถูก push หรือเผยแพร่แล้วและต้องการการแก้ไข ผู้ดูแลจะตัดแท็ก `-beta.N` ถัดไปแทนการลบหรือสร้างแท็ก beta เก่าใหม่
- ขั้นตอนการเผยแพร่โดยละเอียด การอนุมัติ ข้อมูลประจำตัว และบันทึกการกู้คืนมีไว้สำหรับผู้ดูแลเท่านั้น

## เช็กลิสต์ผู้ดำเนินการเผยแพร่

เช็กลิสต์นี้คือโครงร่างสาธารณะของโฟลว์การเผยแพร่ ข้อมูลประจำตัวส่วนตัว,
การลงนาม, notarization, การกู้คืน dist-tag และรายละเอียดการ rollback ฉุกเฉินยังอยู่ใน
runbook การเผยแพร่สำหรับผู้ดูแลเท่านั้น

1. เริ่มจาก `main` ปัจจุบัน: pull ล่าสุด ยืนยันว่า commit เป้าหมายถูก push แล้ว
   และยืนยันว่า CI ของ `main` ปัจจุบันเขียวพอที่จะสร้างสาขาจากมัน
2. เขียนส่วนบนสุดของ `CHANGELOG.md` ใหม่จากประวัติ commit จริงด้วย
   `/changelog` เก็บรายการให้เป็นเนื้อหาสำหรับผู้ใช้ commit แล้ว push และ rebase/pull
   อีกครั้งก่อนสร้างสาขา
3. ตรวจทานบันทึกความเข้ากันได้ของรุ่นเผยแพร่ใน
   `src/plugins/compat/registry.ts` และ
   `src/commands/doctor/shared/deprecation-compat.ts` ลบความเข้ากันได้ที่หมดอายุ
   เฉพาะเมื่อเส้นทางอัปเกรดยังคงครอบคลุมอยู่ หรือบันทึกเหตุผลว่าทำไมจึงตั้งใจคงไว้
4. สร้าง `release/YYYY.M.D` จาก `main` ปัจจุบัน; อย่าทำงานเผยแพร่ปกติ
   โดยตรงบน `main`
5. เพิ่มเวอร์ชันในทุกตำแหน่งที่จำเป็นสำหรับแท็กที่ตั้งใจไว้ รัน
   `pnpm plugins:sync` เพื่อให้แพ็กเกจ Plugin ที่เผยแพร่ได้ใช้เวอร์ชันรุ่นเผยแพร่
   และ metadata ความเข้ากันได้ร่วมกัน จากนั้นรัน preflight แบบกำหนดแน่นอนในเครื่อง:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` และ
   `pnpm release:check`
6. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true` ก่อนมีแท็ก
   อนุญาตให้ใช้ SHA ของสาขารุ่นเผยแพร่แบบเต็ม 40 อักขระสำหรับ preflight
   เพื่อการตรวจสอบเท่านั้น บันทึก `preflight_run_id` ที่สำเร็จ
7. เริ่มการทดสอบก่อนเผยแพร่ทั้งหมดด้วย `Full Release Validation` สำหรับ
   สาขารุ่นเผยแพร่ แท็ก หรือ SHA commit แบบเต็ม นี่คือ entrypoint แบบ manual เดียว
   สำหรับกล่องทดสอบรุ่นเผยแพร่ขนาดใหญ่สี่ชุด: Vitest, Docker, QA Lab และ Package
8. หากการตรวจสอบล้มเหลว ให้แก้บนสาขารุ่นเผยแพร่และรันไฟล์ เลน งาน workflow
   โปรไฟล์แพ็กเกจ provider หรือรายการ allowlist ของโมเดลที่ล้มเหลวที่เล็กที่สุด
   ซึ่งพิสูจน์การแก้ไขได้ รัน umbrella แบบเต็มอีกครั้งเฉพาะเมื่อพื้นผิวที่เปลี่ยนทำให้
   หลักฐานก่อนหน้าเก่าเกินใช้
9. สำหรับ beta ให้ติดแท็ก `vYYYY.M.D-beta.N` จากนั้นรัน `OpenClaw Release Publish` จาก
   สาขา `release/YYYY.M.D` ที่ตรงกัน ระบบจะตรวจสอบ `pnpm plugins:sync:check`,
   เผยแพร่แพ็กเกจ Plugin ที่เผยแพร่ได้ทั้งหมดไปยัง npm ก่อน, เผยแพร่ชุดเดียวกัน
   ไปยัง ClawHub เป็นลำดับที่สองในรูปแบบ tarball ClawPack npm-pack แล้วจึงโปรโมต
   artifact preflight ของ OpenClaw npm ที่เตรียมไว้ด้วย dist-tag ที่ตรงกัน หลังเผยแพร่
   ให้รันการยอมรับแพ็กเกจหลังเผยแพร่กับแพ็กเกจ `openclaw@YYYY.M.D-beta.N` หรือ
   `openclaw@beta` ที่เผยแพร่แล้ว หาก prerelease ที่ถูก push หรือเผยแพร่แล้วต้องการการแก้ไข
   ให้ตัดหมายเลข prerelease ถัดไปที่ตรงกัน; อย่าลบหรือเขียน prerelease เก่าใหม่
10. สำหรับรุ่นเสถียร ให้ดำเนินการต่อเฉพาะหลังจาก beta หรือ release candidate
    ที่ตรวจสอบแล้วมีหลักฐานการตรวจสอบที่จำเป็น การเผยแพร่ npm รุ่นเสถียรก็ผ่าน
    `OpenClaw Release Publish` เช่นกัน โดยนำ artifact preflight ที่สำเร็จกลับมาใช้ผ่าน
    `preflight_run_id`; ความพร้อมของรุ่นเผยแพร่ macOS เสถียรยังต้องมี
    `.zip`, `.dmg`, `.dSYM.zip` ที่แพ็กแล้ว และ `appcast.xml` ที่อัปเดตบน `main`
11. หลังเผยแพร่ ให้รันตัวตรวจสอบหลังเผยแพร่ของ npm, E2E ของ Telegram จาก published-npm
    แบบ standalone ที่เป็นทางเลือกเมื่อคุณต้องการหลักฐานช่องทางหลังเผยแพร่,
    การโปรโมต dist-tag เมื่อจำเป็น, บันทึก release/prerelease ของ GitHub จากส่วน
    `CHANGELOG.md` ที่ตรงกันครบถ้วน และขั้นตอนประกาศรุ่นเผยแพร่

## Release preflight

- เรียกใช้ `pnpm check:test-types` ก่อนการ preflight รีลีส เพื่อให้ TypeScript ของการทดสอบยังคง
  ครอบคลุมอยู่นอก gate `pnpm check` แบบ local ที่เร็วกว่า
- เรียกใช้ `pnpm check:architecture` ก่อนการ preflight รีลีส เพื่อให้การตรวจสอบ import
  cycle และขอบเขตสถาปัตยกรรมที่กว้างขึ้นเป็นสีเขียวอยู่นอก gate แบบ local ที่เร็วกว่า
- เรียกใช้ `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้อาร์ติแฟกต์รีลีส
  `dist/*` ที่คาดไว้และบันเดิล Control UI มีอยู่สำหรับขั้นตอนตรวจสอบความถูกต้องของแพ็ก
- เรียกใช้ `pnpm plugins:sync` หลังจากเพิ่มเวอร์ชันที่รากและก่อนติดแท็ก โดยจะ
  อัปเดตเวอร์ชันแพ็กเกจ Plugin ที่เผยแพร่ได้, เมตาดาต้าความเข้ากันได้ของ peer/API ของ OpenClaw,
  เมตาดาต้า build และสตับ changelog ของ Plugin ให้ตรงกับเวอร์ชันรีลีสหลัก
  `pnpm plugins:sync:check` คือ guard รีลีสแบบไม่แก้ไขข้อมูล;
  workflow เผยแพร่จะล้มเหลวก่อนมีการแก้ไข registry ใดๆ หากลืมขั้นตอนนี้
- เรียกใช้ workflow แบบ manual `Full Release Validation` ก่อนอนุมัติรีลีสเพื่อ
  เริ่ม test boxes ก่อนรีลีสทั้งหมดจาก entrypoint เดียว รับ branch,
  tag หรือ full commit SHA, dispatch `CI` แบบ manual และ dispatch
  `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, ชุดทดสอบ
  release-path ของ Docker, live/E2E, OpenWebUI, QA Lab parity, Matrix และ Telegram
  lanes เมื่อใช้ `release_profile=full` และ `rerun_group=all` จะเรียกใช้ package
  Telegram E2E กับอาร์ติแฟกต์ `release-package-under-test` จาก release
  checks ด้วย ระบุ `npm_telegram_package_spec` หลังเผยแพร่เมื่อควรให้ Telegram E2E
  เดียวกันพิสูจน์แพ็กเกจ npm ที่เผยแพร่แล้วด้วย ระบุ
  `package_acceptance_package_spec` หลังเผยแพร่เมื่อ Package Acceptance
  ควรเรียกใช้เมทริกซ์ package/update กับแพ็กเกจ npm ที่ส่งมอบแล้วแทนอาร์ติแฟกต์ที่ build จาก SHA ระบุ
  `evidence_package_spec` เมื่อรายงานหลักฐานแบบ private ควรพิสูจน์ว่าการตรวจสอบความถูกต้อง
  ตรงกับแพ็กเกจ npm ที่เผยแพร่แล้วโดยไม่บังคับใช้ Telegram E2E
  ตัวอย่าง:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- เรียกใช้ workflow แบบ manual `Package Acceptance` เมื่อคุณต้องการหลักฐาน side-channel
  สำหรับตัวเลือกแพ็กเกจระหว่างที่งานรีลีสดำเนินต่อไป ใช้ `source=npm` สำหรับ
  `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรีลีสที่ระบุแน่นอน; `source=ref`
  เพื่อแพ็ก branch/tag/SHA `package_ref` ที่เชื่อถือได้ด้วย harness
  `workflow_ref` ปัจจุบัน; `source=url` สำหรับ tarball HTTPS พร้อม SHA-256
  ที่จำเป็น; หรือ `source=artifact` สำหรับ tarball ที่อัปโหลดโดย GitHub
  Actions run อื่น workflow จะแปลงตัวเลือกเป็น
  `package-under-test`, ใช้ Docker E2E release scheduler ซ้ำกับ tarball นั้น
  และสามารถเรียกใช้ Telegram QA กับ tarball เดียวกันด้วย
  `telegram_mode=mock-openai` หรือ `telegram_mode=live-frontier` เมื่อ Docker
  lanes ที่เลือกมี `published-upgrade-survivor` อาร์ติแฟกต์แพ็กเกจคือ
  ตัวเลือก และ `published_upgrade_survivor_baseline` เลือก baseline ที่เผยแพร่แล้ว
  ตัวอย่าง: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  โปรไฟล์ทั่วไป:
  - `smoke`: lanes สำหรับ install/channel/agent, เครือข่าย Gateway และโหลด config ใหม่
  - `package`: lanes package/update/plugin ที่อิงอาร์ติแฟกต์โดยตรง โดยไม่มี OpenWebUI หรือ ClawHub แบบ live
  - `product`: โปรไฟล์ package รวมกับช่อง MCP, cron/subagent cleanup,
    OpenAI web search และ OpenWebUI
  - `full`: ชิ้นส่วน release-path ของ Docker พร้อม OpenWebUI
  - `custom`: การเลือก `docker_lanes` แบบเจาะจงสำหรับการ rerun ที่มุ่งเน้น
- เรียกใช้ workflow แบบ manual `CI` โดยตรงเมื่อคุณต้องการเพียงความครอบคลุมของ CI ปกติแบบเต็ม
  สำหรับ release candidate การ dispatch CI แบบ manual จะข้ามการกำหนด scope ตามการเปลี่ยนแปลง
  และบังคับใช้ Linux Node shards, bundled-plugin shards, channel
  contracts, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke,
  docs checks, Python skills, Windows, macOS, Android และ Control UI i18n
  lanes
  ตัวอย่าง: `gh workflow run ci.yml --ref release/YYYY.M.D`
- เรียกใช้ `pnpm qa:otel:smoke` เมื่อตรวจสอบ telemetry ของรีลีส โดยจะทดสอบ
  QA-lab ผ่านตัวรับ OTLP/HTTP แบบ local และตรวจสอบชื่อ trace
  span ที่ส่งออก, attributes ที่มีขอบเขต และการ redaction ของ content/identifier โดยไม่ต้องใช้
  Opik, Langfuse หรือตัวรวบรวมภายนอกอื่น
- เรียกใช้ `pnpm release:check` ก่อนรีลีสที่ติดแท็กทุกครั้ง
- เรียกใช้ `OpenClaw Release Publish` สำหรับลำดับการเผยแพร่ที่แก้ไขข้อมูลหลังจาก
  มี tag แล้ว Dispatch จาก `release/YYYY.M.D` (หรือ `main` เมื่อเผยแพร่ tag
  ที่เข้าถึงได้จาก main), ส่ง release tag และ OpenClaw npm
  `preflight_run_id` ที่สำเร็จ และคงขอบเขตการเผยแพร่ Plugin ค่าเริ่มต้น
  `all-publishable` ไว้ เว้นแต่คุณตั้งใจรันการซ่อมเฉพาะจุด workflow
  จะจัดลำดับการเผยแพร่ npm ของ Plugin, การเผยแพร่ ClawHub ของ Plugin และการเผยแพร่ npm ของ OpenClaw
  เพื่อไม่ให้แพ็กเกจหลักถูกเผยแพร่ก่อน Plugin ที่แยกออกไปภายนอก
- Release checks ตอนนี้รันใน workflow แบบ manual แยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังเรียกใช้ QA Lab mock parity lane พร้อมโปรไฟล์ Matrix
  แบบ live ที่เร็วและ Telegram QA lane ก่อนอนุมัติรีลีสด้วย live
  lanes ใช้ environment `qa-live-shared`; Telegram ยังใช้ leases ข้อมูลรับรอง Convex CI
  ด้วย เรียกใช้ workflow แบบ manual `QA-Lab - All Lanes` ด้วย
  `matrix_profile=all` และ `matrix_shards=true` เมื่อคุณต้องการ inventory ของ Matrix
  transport, media และ E2EE แบบเต็มในแบบขนาน
- การตรวจสอบ runtime สำหรับการติดตั้งและอัปเกรดข้าม OS เป็นส่วนหนึ่งของ
  `OpenClaw Release Checks` และ `Full Release Validation` สาธารณะ ซึ่งเรียกใช้
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` โดยตรง
- การแยกนี้เป็นความตั้งใจ: รักษาเส้นทางรีลีส npm จริงให้สั้น
  deterministic และมุ่งเน้นอาร์ติแฟกต์ ขณะที่การตรวจแบบ live ที่ช้ากว่าอยู่ใน lane
  ของตัวเอง เพื่อไม่ให้หยุดชะงักหรือบล็อกการเผยแพร่
- Release checks ที่มี secret ควรถูก dispatch ผ่าน `Full Release
Validation` หรือจาก workflow ref ของ `main`/release เพื่อให้ logic ของ workflow และ
  secrets ยังอยู่ภายใต้การควบคุม
- `OpenClaw Release Checks` รับ branch, tag หรือ full commit SHA ตราบใดที่
  commit ที่ resolve ได้เข้าถึงได้จาก branch ของ OpenClaw หรือ release tag
- preflight แบบ validation-only ของ `OpenClaw NPM Release` ยังรับ
  full 40-character workflow-branch commit SHA ปัจจุบันโดยไม่ต้องมี pushed tag
- เส้นทาง SHA นั้นเป็น validation-only และไม่สามารถเลื่อนระดับเป็นการเผยแพร่จริงได้
- ในโหมด SHA workflow จะสร้าง `v<package.json version>` เฉพาะสำหรับการตรวจเมตาดาต้า
  แพ็กเกจเท่านั้น; การเผยแพร่จริงยังต้องใช้ release tag จริง
- workflow ทั้งสองคงเส้นทางเผยแพร่และ promotion จริงไว้บน GitHub-hosted
  runners ขณะที่เส้นทาง validation แบบไม่แก้ไขข้อมูลสามารถใช้ Blacksmith Linux runners
  ที่ใหญ่กว่าได้
- workflow นั้นเรียกใช้
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ workflow secrets ทั้ง `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- preflight รีลีส npm จะไม่รอ release checks lane แยกอีกต่อไป
- เรียกใช้ `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือ tag beta/correction ที่ตรงกัน) ก่อนอนุมัติ
- หลังจากเผยแพร่ npm ให้เรียกใช้
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (หรือเวอร์ชัน beta/correction ที่ตรงกัน) เพื่อตรวจสอบเส้นทางการติดตั้ง registry
  ที่เผยแพร่แล้วใน prefix ชั่วคราวใหม่
- หลังเผยแพร่ beta ให้เรียกใช้ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  เพื่อตรวจสอบ onboarding ของแพ็กเกจที่ติดตั้งแล้ว, การตั้งค่า Telegram และ Telegram E2E จริง
  กับแพ็กเกจ npm ที่เผยแพร่แล้วโดยใช้พูลข้อมูลรับรอง Telegram แบบ leased ที่ใช้ร่วมกัน
  การรันเฉพาะกิจบนเครื่อง maintainer แบบ local อาจละเว้น Convex vars และส่ง credentials env
  `OPENCLAW_QA_TELEGRAM_*` ทั้งสามโดยตรงได้
- หากต้องการรัน post-publish beta smoke แบบเต็มจากเครื่อง maintainer ให้ใช้ `pnpm release:beta-smoke -- --beta betaN` helper จะรันการตรวจสอบ Parallels npm update/fresh-target, dispatch `NPM Telegram Beta E2E`, poll workflow run ที่ระบุแน่นอน, ดาวน์โหลดอาร์ติแฟกต์ และพิมพ์รายงาน Telegram
- Maintainers สามารถรันการตรวจ post-publish เดียวกันจาก GitHub Actions ผ่าน
  workflow แบบ manual `NPM Telegram Beta E2E` ได้ โดยตั้งใจให้เป็น manual-only และ
  ไม่รันทุกครั้งที่ merge
- ระบบอัตโนมัติสำหรับรีลีสของ maintainer ตอนนี้ใช้ preflight-then-promote:
  - การเผยแพร่ npm จริงต้องผ่าน npm `preflight_run_id` ที่สำเร็จ
  - การเผยแพร่ npm จริงต้องถูก dispatch จาก branch `main` หรือ
    `release/YYYY.M.D` เดียวกับ preflight run ที่สำเร็จ
  - รีลีส npm แบบ stable ค่าเริ่มต้นคือ `beta`
  - การเผยแพร่ npm แบบ stable สามารถกำหนดเป้าหมาย `latest` ได้อย่างชัดเจนผ่าน workflow input
  - การแก้ไข npm dist-tag ด้วย token ตอนนี้อยู่ใน
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    เพื่อความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่
    public repo คงการเผยแพร่แบบ OIDC-only
  - `macOS Release` สาธารณะเป็น validation-only; เมื่อ tag อยู่เฉพาะบน
    release branch แต่ workflow ถูก dispatch จาก `main` ให้ตั้งค่า
    `public_release_branch=release/YYYY.M.D`
  - การเผยแพร่ mac แบบ private จริงต้องผ่าน private mac
    `preflight_run_id` และ `validate_run_id` ที่สำเร็จ
  - เส้นทางเผยแพร่จริงจะ promote อาร์ติแฟกต์ที่เตรียมไว้แทนการ rebuild
    อีกครั้ง
- สำหรับรีลีส correction แบบ stable เช่น `YYYY.M.D-N` ตัวตรวจสอบ post-publish
  จะตรวจเส้นทางอัปเกรด temp-prefix เดียวกันจาก `YYYY.M.D` เป็น `YYYY.M.D-N`
  ด้วย เพื่อไม่ให้ release corrections ปล่อยให้การติดตั้ง global รุ่นเก่าอยู่บน payload
  stable ฐานอย่างเงียบๆ
- preflight รีลีส npm จะ fail closed เว้นแต่ tarball จะมีทั้ง
  `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่าง
  เพื่อไม่ให้เราส่ง dashboard เบราว์เซอร์ที่ว่างเปล่าอีก
- การตรวจสอบ post-publish ยังตรวจว่า entrypoints ของ Plugin ที่เผยแพร่แล้วและ
  เมตาดาต้าแพ็กเกจมีอยู่ใน layout registry ที่ติดตั้งแล้ว รีลีสที่ส่ง runtime payloads ของ Plugin
  ขาดหายจะทำให้ตัวตรวจสอบ postpublish ล้มเหลว และ
  ไม่สามารถ promote เป็น `latest` ได้
- `pnpm test:install:smoke` ยังบังคับใช้งบประมาณ `unpackedSize` ของ npm pack กับ
  candidate update tarball ดังนั้น installer e2e จะจับ pack bloat ที่ไม่ได้ตั้งใจ
  ได้ก่อนเส้นทางเผยแพร่รีลีส
- หากงานรีลีสแตะการวางแผน CI, manifests เวลา extension หรือ
  เมทริกซ์การทดสอบ extension ให้สร้างใหม่และทบทวน outputs ของเมทริกซ์
  `plugin-prerelease-extension-shard` ที่ planner เป็นเจ้าของจาก
  `.github/workflows/plugin-prerelease.yml` ก่อนอนุมัติ เพื่อให้ release notes ไม่
  อธิบาย layout CI ที่ล้าสมัย
- ความพร้อมของรีลีส macOS แบบ stable ยังรวมถึง surfaces ของ updater:
  - GitHub release ต้องลงเอยด้วย `.zip`, `.dmg` และ `.dSYM.zip` ที่แพ็กแล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปที่ zip แบบ stable ใหม่หลังเผยแพร่
  - แอปที่แพ็กแล้วต้องคง bundle id ที่ไม่ใช่ debug, URL feed Sparkle ที่ไม่ว่าง
    และ `CFBundleVersion` ที่เท่ากับหรือสูงกว่า canonical Sparkle build floor
    สำหรับเวอร์ชันรีลีสนั้น

## กล่องทดสอบรีลีส

`Full Release Validation` คือวิธีที่ operators เริ่มการทดสอบก่อนรีลีสทั้งหมดจาก
entrypoint เดียว สำหรับหลักฐาน commit ที่ pin ไว้บน branch ที่เปลี่ยนเร็ว ให้ใช้
helper เพื่อให้ workflow ลูกทุกตัวรันจาก branch ชั่วคราวที่ตรึงไว้กับ target
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

helper จะ push `release-ci/<sha>-...`, dispatch `Full Release Validation`
จาก branch นั้นด้วย `ref=<sha>`, ตรวจสอบว่า `headSha` ของ workflow ลูกทุกตัว
ตรงกับ target จากนั้นลบ branch ชั่วคราว วิธีนี้หลีกเลี่ยงการพิสูจน์ child run ของ
`main` ที่ใหม่กว่าโดยไม่ตั้งใจ

สำหรับการตรวจสอบ release branch หรือ tag ให้รันจาก workflow ref `main` ที่เชื่อถือได้
และส่ง release branch หรือ tag เป็น `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

เวิร์กโฟลว์จะ resolve ref เป้าหมาย, dispatch `CI` แบบ manual ด้วย
`target_ref=<release-ref>`, dispatch `OpenClaw Release Checks`, เตรียม artifact
หลัก `release-package-under-test` สำหรับการตรวจสอบฝั่งแพ็กเกจ และ dispatch
Telegram E2E แบบแพ็กเกจ standalone เมื่อ `release_profile=full` พร้อม
`rerun_group=all` หรือเมื่อมีการตั้งค่า `npm_telegram_package_spec` จากนั้น
`OpenClaw Release Checks` จะ fan out ไปยัง install smoke, การตรวจสอบรีลีสข้าม OS,
ความครอบคลุม live/E2E Docker ตาม release path, Package Acceptance พร้อม QA
แพ็กเกจ Telegram, QA Lab parity, live Matrix และ live Telegram การรันแบบเต็มจะ
ยอมรับได้ก็ต่อเมื่อสรุป `Full Release Validation` แสดงว่า `normal_ci` และ
`release_checks` สำเร็จแล้วเท่านั้น ในโหมด full/all child `npm_telegram` ต้อง
สำเร็จด้วย นอก full/all จะถูกข้าม เว้นแต่จะมีการระบุ
`npm_telegram_package_spec` ที่เผยแพร่แล้ว สรุป verifier สุดท้ายมีตารางงานที่
ช้าที่สุดสำหรับแต่ละ child run เพื่อให้ผู้จัดการรีลีสเห็น critical path ปัจจุบัน
ได้โดยไม่ต้องดาวน์โหลด log
ดู [การตรวจสอบรีลีสแบบเต็ม](/th/reference/full-release-validation) สำหรับ stage
matrix ฉบับสมบูรณ์, ชื่องาน workflow ที่แน่นอน, ความแตกต่างระหว่างโปรไฟล์ stable
กับ full, artifacts และ handle สำหรับ rerun แบบเจาะจง
Child workflows จะถูก dispatch จาก ref ที่เชื่อถือได้ซึ่งรัน `Full Release
Validation` โดยปกติคือ `--ref main` แม้ว่า `ref` เป้าหมายจะชี้ไปที่ release
branch หรือ tag ที่เก่ากว่าก็ตาม ไม่มี input workflow-ref แยกต่างหากสำหรับ Full
Release Validation ให้เลือก harness ที่เชื่อถือได้โดยเลือก ref ของ workflow run
อย่าใช้ `--ref main -f ref=<sha>` เพื่อพิสูจน์ commit แบบเจาะจงบน `main` ที่เลื่อนไป
เรื่อย ๆ เพราะ raw commit SHA ไม่สามารถเป็น workflow dispatch ref ได้ ดังนั้นให้ใช้
`pnpm ci:full-release --sha <sha>` เพื่อสร้าง branch ชั่วคราวที่ pin ไว้

ใช้ `release_profile` เพื่อเลือกขอบเขต live/provider:

- `minimum`: เส้นทาง live และ Docker ที่สำคัญต่อรีลีสของ OpenAI/core ที่เร็วที่สุด
- `stable`: minimum พร้อมความครอบคลุม provider/backend แบบ stable สำหรับการอนุมัติรีลีส
- `full`: stable พร้อมความครอบคลุม provider/media เชิง advisory ที่กว้างขึ้น

`OpenClaw Release Checks` ใช้ workflow ref ที่เชื่อถือได้เพื่อ resolve ref เป้าหมาย
หนึ่งครั้งเป็น `release-package-under-test` และนำ artifact นั้นกลับมาใช้ทั้งในการ
ตรวจสอบ Docker ตาม release path และ Package Acceptance สิ่งนี้ทำให้กล่องฝั่ง
แพ็กเกจทั้งหมดอยู่บน bytes เดียวกัน และหลีกเลี่ยงการ build แพ็กเกจซ้ำ
cross-OS OpenAI install smoke ใช้ `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อมีการตั้งค่า
ตัวแปร repo/org ไม่เช่นนั้นจะใช้ `openai/gpt-5.4` เพราะ lane นี้พิสูจน์การติดตั้ง
แพ็กเกจ, onboarding, การเริ่มต้น Gateway และ agent turn แบบ live หนึ่งครั้ง
มากกว่าการ benchmark โมเดล default ที่ช้าที่สุด ส่วน live provider matrix ที่กว้างกว่า
ยังคงเป็นที่สำหรับความครอบคลุมเฉพาะโมเดล

ใช้ variant เหล่านี้ตาม stage ของรีลีส:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

อย่าใช้ umbrella แบบเต็มเป็น rerun แรกหลังจากการแก้ไขแบบเจาะจง หากกล่องหนึ่งล้มเหลว
ให้ใช้ child workflow, job, Docker lane, package profile, model provider หรือ QA
lane ที่ล้มเหลวสำหรับ proof ถัดไป รัน umbrella แบบเต็มอีกครั้งเฉพาะเมื่อการแก้ไข
เปลี่ยน release orchestration ที่ใช้ร่วมกัน หรือทำให้ evidence แบบทุกกล่องก่อนหน้า
ล้าสมัย final verifier ของ umbrella จะตรวจซ้ำ workflow run id ของ child ที่บันทึกไว้
ดังนั้นหลังจาก rerun child workflow สำเร็จแล้ว ให้ rerun เฉพาะ parent job
`Verify full validation` ที่ล้มเหลว

สำหรับการกู้คืนแบบมีขอบเขต ให้ส่ง `rerun_group` ไปยัง umbrella `all` คือการรัน
release-candidate จริง, `ci` รันเฉพาะ normal CI child, `plugin-prerelease` รันเฉพาะ
plugin child สำหรับรีลีสเท่านั้น, `release-checks` รันทุก release box และกลุ่มรีลีส
ที่แคบกว่าคือ `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` และ `npm-telegram` การ rerun `npm-telegram` แบบเจาะจงต้องมี
`npm_telegram_package_spec`; การรัน full/all ด้วย `release_profile=full` ใช้ package
artifact ของ release-checks

### Vitest

กล่อง Vitest คือ child workflow `CI` แบบ manual Manual CI ตั้งใจ bypass changed
scoping และบังคับใช้กราฟทดสอบปกติสำหรับ release candidate: Linux Node shards,
bundled-plugin shards, channel contracts, ความเข้ากันได้กับ Node 22, `check`,
`check-additional`, build smoke, docs checks, Python skills, Windows, macOS,
Android และ Control UI i18n

ใช้กล่องนี้เพื่อตอบว่า "source tree ผ่านชุดทดสอบปกติแบบเต็มหรือไม่?"
มันไม่เหมือนกับการตรวจสอบผลิตภัณฑ์ตาม release path หลักฐานที่ควรเก็บ:

- สรุป `Full Release Validation` ที่แสดง URL ของ `CI` run ที่ dispatch แล้ว
- `CI` run เป็นสีเขียวบน SHA เป้าหมายที่แน่นอน
- ชื่อ shard ที่ล้มเหลวหรือช้าจากงาน CI เมื่อสืบสวน regression
- timing artifacts ของ Vitest เช่น `.artifacts/vitest-shard-timings.json` เมื่อ
  run ต้องการการวิเคราะห์ประสิทธิภาพ

รัน manual CI โดยตรงเฉพาะเมื่อรีลีสต้องการ normal CI แบบ deterministic แต่ไม่ต้องการ
กล่อง Docker, QA Lab, live, cross-OS หรือ package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

กล่อง Docker อยู่ใน `OpenClaw Release Checks` ผ่าน
`openclaw-live-and-e2e-checks-reusable.yml` รวมถึง workflow `install-smoke`
ในโหมดรีลีส มันตรวจสอบ release candidate ผ่านสภาพแวดล้อม Docker แบบแพ็กเกจ
แทนที่จะเป็นเฉพาะการทดสอบระดับซอร์ส

ความครอบคลุม Docker ของรีลีสประกอบด้วย:

- full install smoke พร้อมเปิดใช้ slow Bun global install smoke
- การเตรียม/นำ smoke image ของ root Dockerfile กลับมาใช้ตาม SHA เป้าหมาย โดยมีงาน QR,
  root/gateway และ installer/Bun smoke รันเป็น install-smoke shards แยกกัน
- lane E2E ของ repository
- chunk Docker ตาม release path: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` และ `plugins-runtime-install-h`
- ความครอบคลุม OpenWebUI ภายใน chunk `plugins-runtime-services` เมื่อมีการร้องขอ
- lane install/uninstall ของ bundled Plugin ที่ split แล้ว
  `bundled-plugin-install-uninstall-0` ถึง
  `bundled-plugin-install-uninstall-23`
- ชุด provider live/E2E และความครอบคลุมโมเดล Docker live เมื่อ release checks
  รวม live suites

ใช้ Docker artifacts ก่อน rerun release-path scheduler อัปโหลด
`.artifacts/docker-tests/` พร้อม log ของ lane, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON และคำสั่ง rerun สำหรับการกู้คืนแบบเจาะจง ให้ใช้
`docker_lanes=<lane[,lane]>` บน reusable live/E2E workflow แทนการ rerun release
chunks ทั้งหมด คำสั่ง rerun ที่สร้างขึ้นจะรวม `package_artifact_run_id` ก่อนหน้าและ
input ของ Docker image ที่เตรียมไว้เมื่อมี เพื่อให้ lane ที่ล้มเหลวสามารถใช้ tarball
และ GHCR images เดิมซ้ำได้

### QA Lab

กล่อง QA Lab เป็นส่วนหนึ่งของ `OpenClaw Release Checks` เช่นกัน มันคือ release gate
ด้านพฤติกรรม agentic และระดับ channel แยกจากกลไกแพ็กเกจของ Vitest และ Docker

ความครอบคลุม QA Lab ของรีลีสประกอบด้วย:

- mock parity lane ที่เปรียบเทียบ lane candidate ของ OpenAI กับ baseline Opus 4.6
  โดยใช้ agentic parity pack
- โปรไฟล์ fast live Matrix QA ที่ใช้ environment `qa-live-shared`
- live Telegram QA lane ที่ใช้ credential lease ของ Convex CI
- `pnpm qa:otel:smoke` เมื่อ release telemetry ต้องการ local proof ที่ชัดเจน

ใช้กล่องนี้เพื่อตอบว่า "รีลีสทำงานถูกต้องในสถานการณ์ QA และ flow ของ live channel
หรือไม่?" เก็บ URL artifact สำหรับ lane parity, Matrix และ Telegram เมื่ออนุมัติรีลีส
ความครอบคลุม Matrix แบบเต็มยังมีให้เป็น QA-Lab run แบบ sharded manual แทนที่จะเป็น
lane สำคัญต่อรีลีสตาม default

### Package

กล่อง Package คือ gate สำหรับผลิตภัณฑ์ที่ติดตั้งได้ รองรับโดย
`Package Acceptance` และ resolver
`scripts/resolve-openclaw-package-candidate.mjs` resolver จะ normalize candidate
เป็น tarball `package-under-test` ที่ Docker E2E ใช้, validate package inventory,
บันทึก version และ SHA-256 ของแพ็กเกจ และแยก workflow harness ref ออกจาก package
source ref

แหล่ง candidate ที่รองรับ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` หรือ version รีลีส OpenClaw ที่แน่นอน
- `source=ref`: pack branch, tag หรือ full commit SHA ของ `package_ref` ที่เชื่อถือได้
  ด้วย harness `workflow_ref` ที่เลือก
- `source=url`: ดาวน์โหลด HTTPS `.tgz` พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: ใช้ `.tgz` ที่อัปโหลดโดย GitHub Actions run อื่นซ้ำ

`OpenClaw Release Checks` รัน Package Acceptance ด้วย `source=artifact`, package
artifact ของรีลีสที่เตรียมไว้, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` และ
`telegram_mode=mock-openai` Package Acceptance เก็บ migration, update, การล้าง
dependency ของ Plugin เก่า, fixture ของ Plugin แบบ offline, การอัปเดต Plugin และ
Telegram package QA ไว้กับ tarball ที่ resolve แล้วเดียวกัน upgrade matrix ครอบคลุม
baseline stable ที่เผยแพร่บน npm ทุกตัวตั้งแต่ `2026.4.23` ถึง `latest`; ใช้
Package Acceptance ด้วย `source=npm` สำหรับ candidate ที่ ship แล้ว หรือ
`source=ref`/`source=artifact` สำหรับ npm tarball ในเครื่องที่มี SHA รองรับก่อน publish
มันคือสิ่งทดแทนแบบ GitHub-native สำหรับความครอบคลุม package/update ส่วนใหญ่ที่ก่อนหน้า
ต้องใช้ Parallels การตรวจสอบรีลีสข้าม OS ยังสำคัญสำหรับ onboarding, installer และ
พฤติกรรมเฉพาะ platform แต่การตรวจสอบผลิตภัณฑ์ด้าน package/update ควรเลือกใช้
Package Acceptance

checklist canonical สำหรับการตรวจสอบ update และ Plugin คือ
[การทดสอบ updates และ plugins](/th/help/testing-updates-plugins) ใช้เมื่อจะตัดสินว่า
lane แบบ local, Docker, Package Acceptance หรือ release-check ใดพิสูจน์การ
ติดตั้ง/อัปเดต Plugin, การล้างด้วย doctor หรือการเปลี่ยนแปลง migration ของแพ็กเกจที่
เผยแพร่แล้ว การ migration อัปเดตที่เผยแพร่แบบละเอียดจากทุกแพ็กเกจ stable
`2026.4.23+` เป็น workflow manual `Update Migration` แยกต่างหาก ไม่ใช่ส่วนหนึ่งของ
Full Release CI

ความผ่อนปรน legacy package-acceptance ถูกจำกัดเวลาโดยตั้งใจ แพ็กเกจจนถึง
`2026.4.25` อาจใช้ compatibility path สำหรับช่องว่าง metadata ที่เผยแพร่ไปยัง npm
แล้ว: รายการ inventory QA ส่วนตัวที่หายไปจาก tarball, `gateway install --wrapper`
ที่หายไป, ไฟล์ patch ที่หายไปใน git fixture ที่ได้จาก tarball, `update.channel` ที่
persist หายไป, ตำแหน่ง legacy plugin install-record, persistence ของ marketplace
install-record ที่หายไป และการ migration config metadata ระหว่าง `plugins update`
แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจ warn สำหรับไฟล์ stamp metadata ของ local build
ที่ ship ไปแล้ว แพ็กเกจหลังจากนั้นต้องเป็นไปตาม package contracts สมัยใหม่
ช่องว่างเดียวกันเหล่านั้นจะทำให้ release validation ล้มเหลว

ใช้โปรไฟล์ Package Acceptance ที่กว้างขึ้นเมื่อคำถามของรีลีสเกี่ยวกับแพ็กเกจที่
ติดตั้งได้จริง:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

โปรไฟล์แพ็กเกจทั่วไป:

- `smoke`: เลนติดตั้งแพ็กเกจ/ช่องทาง/เอเจนต์แบบเร็ว, เครือข่าย Gateway, และโหลดการกำหนดค่าใหม่
- `package`: สัญญาการติดตั้ง/อัปเดต/แพ็กเกจ Plugin โดยไม่มี ClawHub แบบสด; นี่คือค่าเริ่มต้นของการตรวจสอบรีลีส
- `product`: `package` รวมกับช่องทาง MCP, การล้าง cron/subagent, การค้นหาเว็บ OpenAI, และ OpenWebUI
- `full`: ส่วนของเส้นทางรีลีส Docker พร้อม OpenWebUI
- `custom`: รายการ `docker_lanes` ที่แน่นอนสำหรับการรันซ้ำแบบเจาะจง

สำหรับหลักฐาน Telegram ของแพ็กเกจตัวเลือก ให้เปิดใช้ `telegram_mode=mock-openai` หรือ
`telegram_mode=live-frontier` บน Package Acceptance เวิร์กโฟลว์จะส่ง tarball
`package-under-test` ที่แก้ค่าแล้วเข้าสู่เลน Telegram; เวิร์กโฟลว์ Telegram แบบสแตนด์อโลน
ยังรับสเปก npm ที่เผยแพร่แล้วสำหรับการตรวจสอบหลังเผยแพร่

## การเผยแพร่รีลีสอัตโนมัติ

`OpenClaw Release Publish` คือจุดเริ่มต้นการเผยแพร่แบบเปลี่ยนแปลงสถานะตามปกติ ซึ่ง
ประสานเวิร์กโฟลว์ trusted-publisher ตามลำดับที่รีลีสต้องใช้:

1. เช็กเอาต์แท็กรีลีสและแก้ค่า commit SHA ของแท็กนั้น
2. ตรวจสอบว่าแท็กเข้าถึงได้จาก `main` หรือ `release/*`
3. รัน `pnpm plugins:sync:check`
4. Dispatch `Plugin NPM Release` ด้วย `publish_scope=all-publishable` และ
   `ref=<release-sha>`
5. Dispatch `Plugin ClawHub Release` ด้วย scope และ SHA เดียวกัน
6. Dispatch `OpenClaw NPM Release` ด้วยแท็กรีลีส, npm dist-tag, และ
   `preflight_run_id` ที่บันทึกไว้

ตัวอย่างการเผยแพร่เบต้า:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

การเผยแพร่เสถียรไปยัง dist-tag เบต้าเริ่มต้น:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

การโปรโมตรีลีสเสถียรตรงไปยัง `latest` ต้องระบุอย่างชัดเจน:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

ใช้เวิร์กโฟลว์ระดับล่าง `Plugin NPM Release` และ `Plugin ClawHub Release`
เฉพาะสำหรับงานซ่อมแซมหรือเผยแพร่ซ้ำแบบเจาะจงเท่านั้น สำหรับการซ่อมแซม Plugin ที่เลือกไว้ ให้ส่ง
`plugin_publish_scope=selected` และ `plugins=@openclaw/name` ไปยัง
`OpenClaw Release Publish` หรือ dispatch เวิร์กโฟลว์ลูกโดยตรงเมื่อไม่ควรเผยแพร่
แพ็กเกจ OpenClaw

## อินพุตเวิร์กโฟลว์ NPM

`OpenClaw NPM Release` รับอินพุตที่ผู้ปฏิบัติงานควบคุมได้ดังนี้:

- `tag`: แท็กรีลีสที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1`, หรือ
  `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` ค่านี้อาจเป็น workflow-branch commit SHA
  แบบเต็ม 40 อักขระปัจจุบันสำหรับ preflight ที่ใช้ตรวจสอบเท่านั้นได้ด้วย
- `preflight_only`: `true` สำหรับการตรวจสอบ/บิลด์/แพ็กเกจเท่านั้น, `false` สำหรับเส้นทาง
  เผยแพร่จริง
- `preflight_run_id`: จำเป็นบนเส้นทางเผยแพร่จริงเพื่อให้เวิร์กโฟลว์ใช้ tarball ที่เตรียมไว้
  จากการรัน preflight ที่สำเร็จซ้ำ
- `npm_dist_tag`: แท็กเป้าหมาย npm สำหรับเส้นทางเผยแพร่; ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Publish` รับอินพุตที่ผู้ปฏิบัติงานควบคุมได้ดังนี้:

- `tag`: แท็กรีลีสที่จำเป็น; ต้องมีอยู่แล้ว
- `preflight_run_id`: id การรัน preflight ของ `OpenClaw NPM Release` ที่สำเร็จ;
  จำเป็นเมื่อ `publish_openclaw_npm=true`
- `npm_dist_tag`: แท็กเป้าหมาย npm สำหรับแพ็กเกจ OpenClaw
- `plugin_publish_scope`: ค่าเริ่มต้นคือ `all-publishable`; ใช้ `selected` เฉพาะ
  สำหรับงานซ่อมแซมแบบเจาะจง
- `plugins`: ชื่อแพ็กเกจ `@openclaw/*` คั่นด้วยจุลภาคเมื่อ
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: ค่าเริ่มต้นคือ `true`; ตั้งเป็น `false` เฉพาะเมื่อใช้
  เวิร์กโฟลว์เป็นตัวประสานงานการซ่อมแซมแบบเฉพาะ Plugin เท่านั้น

`OpenClaw Release Checks` รับอินพุตที่ผู้ปฏิบัติงานควบคุมได้ดังนี้:

- `ref`: branch, tag, หรือ commit SHA แบบเต็มที่ต้องตรวจสอบ เช็กที่มี secret
  ต้องให้ commit ที่แก้ค่าแล้วเข้าถึงได้จาก branch หรือแท็กรีลีสของ OpenClaw

กฎ:

- แท็กเสถียรและแท็กแก้ไขอาจเผยแพร่ไปยัง `beta` หรือ `latest` ก็ได้
- แท็ก prerelease เบต้าอาจเผยแพร่ได้เฉพาะไปยัง `beta`
- สำหรับ `OpenClaw NPM Release` อนุญาตให้อินพุต commit SHA แบบเต็มได้เฉพาะเมื่อ
  `preflight_only=true`
- `OpenClaw Release Checks` และ `Full Release Validation` เป็นแบบตรวจสอบเท่านั้นเสมอ
- เส้นทางเผยแพร่จริงต้องใช้ `npm_dist_tag` เดียวกับที่ใช้ระหว่าง preflight;
  เวิร์กโฟลว์จะตรวจสอบว่าเมทาดาทาดังกล่าวยังคงถูกต้องก่อนเผยแพร่ต่อไป

## ลำดับการรีลีส npm แบบเสถียร

เมื่อตัดรีลีส npm แบบเสถียร:

1. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนมีแท็ก คุณอาจใช้ workflow-branch commit SHA แบบเต็มปัจจุบัน
     สำหรับ dry run แบบตรวจสอบเท่านั้นของเวิร์กโฟลว์ preflight
2. เลือก `npm_dist_tag=beta` สำหรับโฟลว์ปกติแบบเบต้าก่อน หรือ `latest` เฉพาะ
   เมื่อคุณตั้งใจต้องการเผยแพร่เสถียรโดยตรง
3. รัน `Full Release Validation` บน branch รีลีส, แท็กรีลีส, หรือ
   commit SHA แบบเต็ม เมื่อต้องการ CI ปกติรวมกับ live prompt cache, Docker, QA Lab,
   Matrix, และความครอบคลุมของ Telegram จากเวิร์กโฟลว์แบบแมนนวลเดียว
4. หากคุณตั้งใจต้องการเฉพาะกราฟทดสอบปกติแบบกำหนดแน่นอน ให้รันเวิร์กโฟลว์
   `CI` แบบแมนนวลบน ref รีลีสแทน
5. บันทึก `preflight_run_id` ที่สำเร็จ
6. รัน `OpenClaw Release Publish` ด้วย `tag` เดียวกัน, `npm_dist_tag` เดียวกัน,
   และ `preflight_run_id` ที่บันทึกไว้; เวิร์กโฟลว์จะเผยแพร่ Plugin ที่แยกออกภายนอกไปยัง npm
   และ ClawHub ก่อนโปรโมตแพ็กเกจ npm ของ OpenClaw
7. หากรีลีสลงที่ `beta` ให้ใช้เวิร์กโฟลว์ส่วนตัว
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   เพื่อโปรโมตเวอร์ชันเสถียรนั้นจาก `beta` ไปยัง `latest`
8. หากรีลีสตั้งใจเผยแพร่ตรงไปยัง `latest` และ `beta`
   ควรตามบิลด์เสถียรเดียวกันทันที ให้ใช้เวิร์กโฟลว์ส่วนตัวเดียวกัน
   เพื่อชี้ dist-tag ทั้งสองไปยังเวอร์ชันเสถียร หรือปล่อยให้การซิงก์แก้ไขตัวเองตามกำหนดการ
   ย้าย `beta` ภายหลัง

การเปลี่ยนแปลง dist-tag อยู่ใน repo ส่วนตัวด้วยเหตุผลด้านความปลอดภัย เพราะยัง
ต้องใช้ `NPM_TOKEN` ขณะที่ repo สาธารณะคงการเผยแพร่แบบ OIDC-only ไว้

สิ่งนี้ทำให้ทั้งเส้นทางเผยแพร่โดยตรงและเส้นทางโปรโมตแบบเบต้าก่อน
มีเอกสารครบถ้วนและผู้ปฏิบัติงานมองเห็นได้

หาก maintainer ต้อง fallback ไปใช้การยืนยันตัวตน npm แบบ local ให้รันคำสั่ง 1Password
CLI (`op`) ใด ๆ เฉพาะในเซสชัน tmux เฉพาะเท่านั้น อย่าเรียก `op`
โดยตรงจากเชลล์เอเจนต์หลัก; การเก็บไว้ใน tmux ทำให้ prompt,
การแจ้งเตือน, และการจัดการ OTP สังเกตเห็นได้และป้องกันการแจ้งเตือน host ซ้ำ

## เอกสารอ้างอิงสาธารณะ

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainers ใช้เอกสารรีลีสส่วนตัวใน
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
สำหรับ runbook จริง

## ที่เกี่ยวข้อง

- [ช่องทางรีลีส](/th/install/development-channels)
