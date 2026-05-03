---
read_when:
    - กำลังค้นหานิยามช่องทางการเผยแพร่สาธารณะ
    - การเรียกใช้การตรวจสอบความถูกต้องของรีลีสหรือการยอมรับแพ็กเกจ
    - กำลังมองหารูปแบบการตั้งชื่อเวอร์ชันและจังหวะการออกเวอร์ชัน
summary: เลนการเผยแพร่, รายการตรวจสอบสำหรับผู้ปฏิบัติงาน, กล่องตรวจสอบความถูกต้อง, การตั้งชื่อเวอร์ชัน และรอบการเผยแพร่
title: นโยบายการเผยแพร่รุ่น
x-i18n:
    generated_at: "2026-05-03T21:36:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566088d826e1e2bac21b11443b82b62cb73ed1fd9c508c3fb865149cf8a428ba
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw มีเลนรีลีสสาธารณะสามเลน:

- stable: รีลีสที่ติดแท็กซึ่งเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อร้องขออย่างชัดเจน
- beta: แท็ก prerelease ที่เผยแพร่ไปยัง npm `beta`
- dev: หัวที่เคลื่อนไหวของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันรีลีส stable: `YYYY.M.D`
  - แท็ก Git: `vYYYY.M.D`
- เวอร์ชันรีลีสแก้ไข stable: `YYYY.M.D-N`
  - แท็ก Git: `vYYYY.M.D-N`
- เวอร์ชัน prerelease beta: `YYYY.M.D-beta.N`
  - แท็ก Git: `vYYYY.M.D-beta.N`
- อย่าเติมศูนย์นำหน้าเดือนหรือวัน
- `latest` หมายถึงรีลีส npm stable ที่โปรโมตอยู่ในปัจจุบัน
- `beta` หมายถึงเป้าหมายการติดตั้ง beta ปัจจุบัน
- รีลีส stable และรีลีสแก้ไข stable จะเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น; ผู้ปฏิบัติการรีลีสสามารถระบุเป้าหมายเป็น `latest` อย่างชัดเจน หรือโปรโมตบิลด์ beta ที่ผ่านการตรวจสอบภายหลังได้
- รีลีส OpenClaw stable ทุกครั้งจะส่งแพ็กเกจ npm และแอป macOS พร้อมกัน;
  รีลีส beta โดยปกติจะตรวจสอบความถูกต้องและเผยแพร่เส้นทาง npm/package ก่อน โดย
  สงวนการ build/sign/notarize แอป mac ไว้สำหรับ stable เว้นแต่จะร้องขออย่างชัดเจน

## รอบการออกรีลีส

- รีลีสจะเดินหน้าแบบ beta ก่อน
- stable จะตามมาหลังจาก beta ล่าสุดผ่านการตรวจสอบแล้วเท่านั้น
- โดยปกติ maintainer จะตัดรีลีสจากสาขา `release/YYYY.M.D` ที่สร้างจาก
  `main` ปัจจุบัน เพื่อให้การตรวจสอบรีลีสและการแก้ไขไม่บล็อกการพัฒนาใหม่
  บน `main`
- หากมีการ push หรือเผยแพร่แท็ก beta แล้วและต้องแก้ไข maintainer จะตัด
  แท็ก `-beta.N` ถัดไปแทนการลบหรือสร้างแท็ก beta เดิมใหม่
- ขั้นตอนรีลีสโดยละเอียด การอนุมัติ ข้อมูลรับรอง และบันทึกการกู้คืนเป็น
  เฉพาะ maintainer เท่านั้น

## เช็กลิสต์ผู้ปฏิบัติการรีลีส

เช็กลิสต์นี้คือรูปแบบสาธารณะของโฟลว์รีลีส ข้อมูลรับรองส่วนตัว,
การลงนาม, การ notarization, การกู้คืน dist-tag และรายละเอียดการ rollback ฉุกเฉินจะอยู่ใน
runbook รีลีสเฉพาะ maintainer เท่านั้น

1. เริ่มจาก `main` ปัจจุบัน: pull ล่าสุด ยืนยันว่า commit เป้าหมายถูก push แล้ว
   และยืนยันว่า CI ของ `main` ปัจจุบันเขียวพอที่จะสร้างสาขาจากมันได้
2. เขียนส่วนบนสุดของ `CHANGELOG.md` ใหม่จากประวัติ commit จริงด้วย
   `/changelog` รักษารายการให้เป็นเนื้อหาสำหรับผู้ใช้ commit แล้ว push จากนั้น rebase/pull
   อีกครั้งก่อนสร้างสาขา
3. ตรวจทานบันทึกความเข้ากันได้ของรีลีสใน
   `src/plugins/compat/registry.ts` และ
   `src/commands/doctor/shared/deprecation-compat.ts` ลบความเข้ากันได้ที่หมดอายุ
   เฉพาะเมื่อเส้นทางการอัปเกรดยังถูกครอบคลุม หรือบันทึกเหตุผลว่าทำไมจึง
   ตั้งใจคงไว้
4. สร้าง `release/YYYY.M.D` จาก `main` ปัจจุบัน; อย่าทำงานรีลีสปกติ
   โดยตรงบน `main`
5. เพิ่มเวอร์ชันทุกตำแหน่งที่จำเป็นสำหรับแท็กที่ตั้งใจไว้ รัน
   `pnpm plugins:sync` เพื่อให้แพ็กเกจ Plugin ที่เผยแพร่ได้ใช้เวอร์ชันรีลีส
   และเมตาดาต้าความเข้ากันได้ร่วมกัน จากนั้นรัน preflight แบบกำหนดผลลัพธ์ได้ในเครื่อง:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` และ
   `pnpm release:check`
6. รัน `OpenClaw NPM Release` พร้อม `preflight_only=true` ก่อนมีแท็ก
   SHA ของสาขารีลีสแบบเต็ม 40 อักขระอนุญาตให้ใช้สำหรับ preflight
   เพื่อการตรวจสอบเท่านั้น บันทึก `preflight_run_id` ที่สำเร็จไว้
7. เริ่มการทดสอบก่อนรีลีสทั้งหมดด้วย `Full Release Validation` สำหรับ
   สาขารีลีส แท็ก หรือ SHA commit แบบเต็ม นี่คือ entrypoint แบบแมนนวลหนึ่งเดียว
   สำหรับกล่องทดสอบรีลีสขนาดใหญ่ทั้งสี่: Vitest, Docker, QA Lab และ Package
8. หากการตรวจสอบล้มเหลว ให้แก้บนสาขารีลีสและรันซ้ำเฉพาะไฟล์ เลน งาน workflow,
   โปรไฟล์แพ็กเกจ provider หรือ allowlist ของโมเดลที่ล้มเหลวที่เล็กที่สุดซึ่ง
   พิสูจน์การแก้ไขได้ รัน umbrella เต็มซ้ำเฉพาะเมื่อพื้นผิวที่เปลี่ยนแปลงทำให้
   หลักฐานก่อนหน้าล้าสมัย
9. สำหรับ beta ให้แท็ก `vYYYY.M.D-beta.N` จากนั้นรัน `OpenClaw Release Publish` จาก
   สาขา `release/YYYY.M.D` ที่ตรงกัน โดยจะตรวจสอบ `pnpm plugins:sync:check`,
   เผยแพร่แพ็กเกจ Plugin ที่เผยแพร่ได้ทั้งหมดไปยัง npm ก่อน เผยแพร่ชุดเดียวกัน
   ไปยัง ClawHub เป็นลำดับที่สองในรูปแบบ ClawPack npm-pack tarball แล้วจึงโปรโมต
   artifact preflight ของ OpenClaw npm ที่เตรียมไว้พร้อม dist-tag ที่ตรงกัน หลังจาก
   เผยแพร่แล้ว ให้รัน package
   acceptance หลังเผยแพร่กับแพ็กเกจ `openclaw@YYYY.M.D-beta.N` หรือ
   `openclaw@beta` ที่เผยแพร่แล้ว หาก prerelease ที่ถูก push หรือเผยแพร่แล้วต้องแก้ไข
   ให้ตัดหมายเลข prerelease ถัดไปที่ตรงกัน; อย่าลบหรือเขียน prerelease เดิมใหม่
10. สำหรับ stable ให้ดำเนินต่อเฉพาะหลังจาก beta หรือ release candidate ที่ผ่านการตรวจสอบแล้วมี
    หลักฐานการตรวจสอบที่จำเป็น การเผยแพร่ npm stable ก็ผ่าน
    `OpenClaw Release Publish` เช่นกัน โดยใช้ artifact preflight ที่สำเร็จซ้ำผ่าน
    `preflight_run_id`; ความพร้อมของรีลีส macOS stable ยังต้องมี
    `.zip`, `.dmg`, `.dSYM.zip` ที่แพ็กแล้ว และ `appcast.xml` ที่อัปเดตบน `main`
11. หลังเผยแพร่ ให้รันตัวตรวจสอบ npm หลังเผยแพร่, Telegram E2E แบบ standalone
    published-npm ที่เป็นทางเลือกเมื่อคุณต้องการหลักฐานช่องทางหลังเผยแพร่,
    การโปรโมต dist-tag เมื่อจำเป็น, โน้ตรีลีส/prerelease ของ GitHub จาก
    ส่วน `CHANGELOG.md` ที่ตรงกันครบถ้วน และขั้นตอนการประกาศรีลีส

## การตรวจสอบก่อนออกรีลีส

- เรียกใช้ `pnpm check:test-types` ก่อนการตรวจสอบก่อนเผยแพร่ เพื่อให้ TypeScript ของการทดสอบยังได้รับการครอบคลุมนอกเหนือจาก gate `pnpm check` ในเครื่องที่เร็วกว่า
- เรียกใช้ `pnpm check:architecture` ก่อนการตรวจสอบก่อนเผยแพร่ เพื่อให้การตรวจสอบ import cycle และขอบเขตสถาปัตยกรรมที่กว้างขึ้นผ่านเป็นสีเขียวนอกเหนือจาก gate ในเครื่องที่เร็วกว่า
- เรียกใช้ `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้มีอาร์ติแฟกต์เผยแพร่ `dist/*` และบันเดิล Control UI ที่คาดไว้สำหรับขั้นตอนตรวจสอบ pack
- เรียกใช้ `pnpm plugins:sync` หลังการปรับเวอร์ชันที่ root และก่อนติดแท็ก คำสั่งนี้อัปเดตเวอร์ชันแพ็กเกจ Plugin ที่เผยแพร่ได้, metadata ความเข้ากันได้ของ peer/API ของ OpenClaw, metadata การ build และ stub changelog ของ Plugin ให้ตรงกับเวอร์ชันเผยแพร่ของ core `pnpm plugins:sync:check` คือ guard การเผยแพร่แบบไม่แก้ไขข้อมูล; workflow เผยแพร่จะล้มเหลวก่อนมีการแก้ไข registry ใด ๆ หากลืมขั้นตอนนี้
- เรียกใช้ workflow แบบ manual `Full Release Validation` ก่อนอนุมัติการเผยแพร่ เพื่อเริ่มกล่องทดสอบก่อนเผยแพร่ทั้งหมดจาก entrypoint เดียว Workflow นี้รับ branch, tag หรือ SHA ของ commit แบบเต็ม, dispatch `CI` แบบ manual และ dispatch `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, ชุดทดสอบ Docker release-path, live/E2E, OpenWebUI, QA Lab parity, Matrix และ lane ของ Telegram เมื่อใช้ `release_profile=full` และ `rerun_group=all` จะเรียกใช้ package Telegram E2E กับอาร์ติแฟกต์ `release-package-under-test` จาก release checks ด้วย ระบุ `npm_telegram_package_spec` หลังเผยแพร่เมื่อ Telegram E2E เดียวกันควรพิสูจน์แพ็กเกจ npm ที่เผยแพร่แล้วด้วย ระบุ `package_acceptance_package_spec` หลังเผยแพร่เมื่อ Package Acceptance ควรเรียกใช้เมทริกซ์ package/update กับแพ็กเกจ npm ที่ส่งมอบแล้ว แทนอาร์ติแฟกต์ที่ build จาก SHA ระบุ `evidence_package_spec` เมื่อรายงานหลักฐานส่วนตัวควรพิสูจน์ว่าการตรวจสอบตรงกับแพ็กเกจ npm ที่เผยแพร่แล้วโดยไม่บังคับใช้ Telegram E2E ตัวอย่าง: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- เรียกใช้ workflow แบบ manual `Package Acceptance` เมื่อคุณต้องการหลักฐาน side-channel สำหรับ candidate ของแพ็กเกจขณะที่งานเผยแพร่ยังดำเนินต่อ ใช้ `source=npm` สำหรับ `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันเผยแพร่แบบระบุชัดเจน; `source=ref` เพื่อ pack branch/tag/SHA ของ `package_ref` ที่เชื่อถือได้ด้วย harness `workflow_ref` ปัจจุบัน; `source=url` สำหรับ tarball HTTPS พร้อม SHA-256 ที่บังคับ; หรือ `source=artifact` สำหรับ tarball ที่อัปโหลดโดย GitHub Actions run อื่น Workflow จะแปลง candidate เป็น `package-under-test`, นำ release scheduler ของ Docker E2E มาใช้ซ้ำกับ tarball นั้น และสามารถเรียกใช้ Telegram QA กับ tarball เดียวกันด้วย `telegram_mode=mock-openai` หรือ `telegram_mode=live-frontier` เมื่อ Docker lane ที่เลือกมี `published-upgrade-survivor` อาร์ติแฟกต์แพ็กเกจคือ candidate และ `published_upgrade_survivor_baseline` จะเลือก baseline ที่เผยแพร่แล้ว
  ตัวอย่าง: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  โปรไฟล์ทั่วไป:
  - `smoke`: lane สำหรับ install/channel/agent, gateway network และ config reload
  - `package`: lane package/update/plugin ที่อิงอาร์ติแฟกต์โดยตรง โดยไม่มี OpenWebUI หรือ ClawHub live
  - `product`: โปรไฟล์ package รวมถึงช่องทาง MCP, การล้างข้อมูล cron/subagent, OpenAI web search และ OpenWebUI
  - `full`: ชิ้นส่วน Docker release-path พร้อม OpenWebUI
  - `custom`: การเลือก `docker_lanes` แบบระบุชัดเจนสำหรับการ rerun เฉพาะจุด
- เรียกใช้ workflow แบบ manual `CI` โดยตรงเมื่อคุณต้องการเพียง coverage ของ CI ปกติแบบเต็มสำหรับ release candidate การ dispatch CI แบบ manual จะข้าม scoping ตามการเปลี่ยนแปลงและบังคับใช้ lane ของ Linux Node shard, bundled-plugin shard, channel contract, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, Android และ Control UI i18n
  ตัวอย่าง: `gh workflow run ci.yml --ref release/YYYY.M.D`
- เรียกใช้ `pnpm qa:otel:smoke` เมื่อตรวจสอบ telemetry สำหรับการเผยแพร่ คำสั่งนี้ทดสอบ QA-lab ผ่านตัวรับ OTLP/HTTP ในเครื่อง และตรวจสอบชื่อ span ของ trace ที่ส่งออก, attribute ที่ถูกจำกัดขอบเขต และการ redact เนื้อหา/identifier โดยไม่ต้องใช้ Opik, Langfuse หรือตัวรวบรวมภายนอกอื่น
- เรียกใช้ `pnpm release:check` ก่อนทุกการเผยแพร่ที่ติดแท็ก
- เรียกใช้ `OpenClaw Release Publish` สำหรับลำดับการเผยแพร่ที่แก้ไขข้อมูลหลัง tag มีอยู่แล้ว Dispatch จาก `release/YYYY.M.D` (หรือ `main` เมื่อเผยแพร่ tag ที่เข้าถึงได้จาก main), ส่ง release tag และ `preflight_run_id` ของ OpenClaw npm ที่สำเร็จ และคง scope เผยแพร่ Plugin เริ่มต้น `all-publishable` ไว้ เว้นแต่คุณตั้งใจเรียกใช้การซ่อมแซมแบบเฉพาะจุด Workflow จะจัดลำดับการเผยแพร่ Plugin npm, การเผยแพร่ Plugin ClawHub และการเผยแพร่ OpenClaw npm เพื่อไม่ให้แพ็กเกจ core ถูกเผยแพร่ก่อน Plugin ที่ถูกแยกออกไปภายนอก
- ตอนนี้ release checks ทำงานใน workflow แบบ manual แยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังเรียกใช้ lane QA Lab mock parity รวมถึงโปรไฟล์ Matrix live แบบเร็วและ lane Telegram QA ก่อนอนุมัติการเผยแพร่ Lane live ใช้ environment `qa-live-shared`; Telegram ยังใช้ lease ของ credential Convex CI ด้วย เรียกใช้ workflow แบบ manual `QA-Lab - All Lanes` พร้อม `matrix_profile=all` และ `matrix_shards=true` เมื่อคุณต้องการ inventory ของ Matrix transport, media และ E2EE แบบเต็มพร้อมกัน
- การตรวจสอบ runtime สำหรับการติดตั้งและอัปเกรดข้าม OS เป็นส่วนหนึ่งของ `OpenClaw Release Checks` และ `Full Release Validation` สาธารณะ ซึ่งเรียก reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` โดยตรง
- การแยกนี้เป็นความตั้งใจ: รักษาเส้นทางเผยแพร่ npm จริงให้สั้น กำหนดผลได้แน่นอน และเน้นอาร์ติแฟกต์ ขณะที่การตรวจสอบ live ที่ช้ากว่าอยู่ใน lane ของตัวเอง เพื่อไม่ให้ถ่วงหรือบล็อกการเผยแพร่
- release checks ที่มี secret ควรถูก dispatch ผ่าน `Full Release Validation` หรือจาก workflow ref `main`/release เพื่อให้ logic ของ workflow และ secret ยังถูกควบคุม
- `OpenClaw Release Checks` รับ branch, tag หรือ SHA ของ commit แบบเต็ม ตราบใดที่ commit ที่ resolve ได้สามารถเข้าถึงได้จาก branch ของ OpenClaw หรือ release tag
- การตรวจสอบก่อนเผยแพร่แบบ validation-only ของ `OpenClaw NPM Release` ยังรับ SHA ของ commit ใน workflow branch ปัจจุบันแบบเต็ม 40 อักขระได้โดยไม่ต้องมี tag ที่ push แล้ว
- เส้นทาง SHA นั้นใช้สำหรับการตรวจสอบเท่านั้น และไม่สามารถ promote เป็นการเผยแพร่จริงได้
- ในโหมด SHA workflow จะสังเคราะห์ `v<package.json version>` เฉพาะสำหรับการตรวจสอบ metadata ของแพ็กเกจเท่านั้น; การเผยแพร่จริงยังต้องใช้ release tag จริง
- ทั้งสอง workflow คงเส้นทางเผยแพร่และ promote จริงไว้บน runner ที่โฮสต์โดย GitHub ขณะที่เส้นทางตรวจสอบแบบไม่แก้ไขข้อมูลสามารถใช้ runner Blacksmith Linux ที่ใหญ่กว่าได้
- Workflow นั้นเรียกใช้ `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` โดยใช้ workflow secrets ทั้ง `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- การตรวจสอบก่อนเผยแพร่ npm ไม่รอ lane release checks ที่แยกต่างหากอีกต่อไป
- เรียกใช้ `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (หรือ tag beta/correction ที่ตรงกัน) ก่อนอนุมัติ
- หลังเผยแพร่ npm ให้เรียกใช้ `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (หรือเวอร์ชัน beta/correction ที่ตรงกัน) เพื่อตรวจสอบเส้นทางติดตั้ง registry ที่เผยแพร่แล้วใน temp prefix ใหม่
- หลังเผยแพร่ beta ให้เรียกใช้ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` เพื่อตรวจสอบ onboarding ของแพ็กเกจที่ติดตั้งแล้ว, การตั้งค่า Telegram และ Telegram E2E จริงกับแพ็กเกจ npm ที่เผยแพร่แล้ว โดยใช้พูล credential Telegram แบบ leased ที่ใช้ร่วมกัน maintainer ที่รันครั้งเดียวในเครื่องอาจละ Convex vars และส่ง credential env ทั้งสาม `OPENCLAW_QA_TELEGRAM_*` โดยตรงได้
- Maintainer สามารถเรียกใช้การตรวจสอบหลังเผยแพร่เดียวกันจาก GitHub Actions ผ่าน workflow แบบ manual `NPM Telegram Beta E2E` ได้ Workflow นี้ตั้งใจให้เป็น manual-only และไม่ทำงานกับทุก merge
- ระบบอัตโนมัติการเผยแพร่ของ maintainer ตอนนี้ใช้ preflight-then-promote:
  - การเผยแพร่ npm จริงต้องผ่าน `preflight_run_id` ของ npm ที่สำเร็จ
  - การเผยแพร่ npm จริงต้องถูก dispatch จาก branch `main` หรือ `release/YYYY.M.D` เดียวกันกับ preflight run ที่สำเร็จ
  - การเผยแพร่ npm แบบ stable มีค่าเริ่มต้นเป็น `beta`
  - การเผยแพร่ npm แบบ stable สามารถ target `latest` อย่างชัดเจนผ่าน input ของ workflow
  - การแก้ไข npm dist-tag ที่ใช้ token ตอนนี้อยู่ใน `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` ด้วยเหตุผลด้านความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่ repo สาธารณะคงการเผยแพร่แบบ OIDC-only
  - `macOS Release` สาธารณะเป็น validation-only; เมื่อ tag อยู่บน release branch เท่านั้นแต่ workflow ถูก dispatch จาก `main` ให้ตั้งค่า `public_release_branch=release/YYYY.M.D`
  - การเผยแพร่ mac ส่วนตัวจริงต้องผ่าน `preflight_run_id` และ `validate_run_id` ของ mac ส่วนตัวที่สำเร็จ
  - เส้นทางเผยแพร่จริง promote อาร์ติแฟกต์ที่เตรียมไว้แทนการ rebuild อีกครั้ง
- สำหรับการเผยแพร่แก้ไข stable เช่น `YYYY.M.D-N` ตัวตรวจสอบหลังเผยแพร่ยังตรวจเส้นทางอัปเกรดใน temp-prefix เดียวกันจาก `YYYY.M.D` ไปเป็น `YYYY.M.D-N` เพื่อไม่ให้ release correction ปล่อยให้การติดตั้ง global เก่ายังคงอยู่บน payload stable พื้นฐานโดยเงียบ ๆ
- การตรวจสอบก่อนเผยแพร่ npm จะ fail closed เว้นแต่ tarball จะมีทั้ง `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่าง เพื่อไม่ให้เราส่งมอบ browser dashboard ว่างอีกครั้ง
- การตรวจสอบหลังเผยแพร่ยังตรวจว่า entrypoint ของ Plugin ที่เผยแพร่แล้วและ metadata ของแพ็กเกจมีอยู่ใน layout ของ registry ที่ติดตั้งแล้ว การเผยแพร่ที่ขาด payload runtime ของ Plugin จะทำให้ตัวตรวจสอบ postpublish ล้มเหลวและไม่สามารถ promote เป็น `latest` ได้
- `pnpm test:install:smoke` ยังบังคับใช้งบประมาณ `unpackedSize` ของ npm pack กับ tarball อัปเดต candidate ด้วย ดังนั้น installer e2e จะจับ pack bloat ที่ไม่ตั้งใจก่อนเส้นทางเผยแพร่ release
- หากงานเผยแพร่แตะการวางแผน CI, manifest timing ของ extension หรือเมทริกซ์ทดสอบ extension ให้สร้างใหม่และทบทวนผลลัพธ์เมทริกซ์ `plugin-prerelease-extension-shard` ที่ planner เป็นเจ้าของจาก `.github/workflows/plugin-prerelease.yml` ก่อนอนุมัติ เพื่อไม่ให้ release notes อธิบาย layout CI ที่ล้าสมัย
- ความพร้อมของการเผยแพร่ macOS แบบ stable ยังรวมถึงพื้นผิว updater:
  - GitHub release ต้องลงเอยด้วย `.zip`, `.dmg` และ `.dSYM.zip` ที่บรรจุแพ็กเกจแล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปยัง zip stable ใหม่หลังเผยแพร่
  - แอปที่บรรจุแพ็กเกจแล้วต้องคง bundle id ที่ไม่ใช่ debug, URL feed ของ Sparkle ที่ไม่ว่าง และ `CFBundleVersion` ที่เท่ากับหรือสูงกว่า build floor มาตรฐานของ Sparkle สำหรับเวอร์ชันเผยแพร่นั้น

## กล่องทดสอบการเผยแพร่

`Full Release Validation` คือวิธีที่ operator ใช้เริ่มการทดสอบก่อนเผยแพร่ทั้งหมดจาก entrypoint เดียว สำหรับหลักฐาน commit ที่ pin ไว้บน branch ที่เคลื่อนไหวเร็ว ให้ใช้ helper เพื่อให้ workflow ลูกทุกตัวทำงานจาก branch ชั่วคราวที่ตรึงไว้กับ SHA เป้าหมาย:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper จะ push `release-ci/<sha>-...`, dispatch `Full Release Validation` จาก branch นั้นด้วย `ref=<sha>`, ตรวจสอบว่า `headSha` ของ workflow ลูกทุกตัวตรงกับเป้าหมาย แล้วลบ branch ชั่วคราว วิธีนี้หลีกเลี่ยงการพิสูจน์ run ลูกของ `main` ที่ใหม่กว่าโดยไม่ตั้งใจ

สำหรับการตรวจสอบ release branch หรือ tag ให้เรียกใช้จาก workflow ref `main` ที่เชื่อถือได้และส่ง release branch หรือ tag เป็น `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

เวิร์กโฟลว์จะ resolve target ref, dispatch `CI` แบบ manual ด้วย
`target_ref=<release-ref>`, dispatch `OpenClaw Release Checks`, เตรียม artifact
หลัก `release-package-under-test` สำหรับการตรวจสอบที่เกี่ยวข้องกับแพ็กเกจ และ
dispatch package Telegram E2E แบบ standalone เมื่อ `release_profile=full` พร้อม
`rerun_group=all` หรือเมื่อมีการตั้งค่า `npm_telegram_package_spec` จากนั้น `OpenClaw Release
Checks` จะกระจายไปยัง install smoke, cross-OS release checks, live/E2E Docker
release-path coverage, Package Acceptance พร้อม Telegram package QA, QA Lab
parity, live Matrix และ live Telegram การรันแบบเต็มจะยอมรับได้ก็ต่อเมื่อ
สรุป `Full Release Validation`
แสดงว่า `normal_ci` และ `release_checks` สำเร็จ ในโหมด full/all
child `npm_telegram` ต้องสำเร็จด้วย; นอก full/all จะถูกข้าม
เว้นแต่จะมีการระบุ `npm_telegram_package_spec` ที่เผยแพร่แล้ว สรุป verifier
สุดท้ายมีตารางงานที่ช้าที่สุดสำหรับ child run แต่ละรายการ เพื่อให้ผู้จัดการ release
เห็น critical path ปัจจุบันได้โดยไม่ต้องดาวน์โหลด logs
ดู [การตรวจสอบ release แบบเต็ม](/th/reference/full-release-validation) สำหรับ
stage matrix ฉบับครบถ้วน, ชื่องาน workflow ที่แน่นอน, ความแตกต่างระหว่างโปรไฟล์ stable กับ full,
artifacts และ handle สำหรับ rerun แบบเฉพาะจุด
Child workflows จะถูก dispatch จาก trusted ref ที่รัน `Full Release
Validation` โดยปกติคือ `--ref main` แม้ target `ref` จะชี้ไปที่
release branch หรือ tag ที่เก่ากว่า ไม่มี input workflow-ref แยกต่างหากสำหรับ Full Release Validation;
ให้เลือก trusted harness โดยเลือก workflow run ref
อย่าใช้ `--ref main -f ref=<sha>` สำหรับหลักฐาน commit แบบแน่นอนบน `main` ที่เคลื่อนที่อยู่;
raw commit SHA ไม่สามารถเป็น workflow dispatch refs ได้ ดังนั้นให้ใช้
`pnpm ci:full-release --sha <sha>` เพื่อสร้าง pinned temporary branch

ใช้ `release_profile` เพื่อเลือกขอบเขต live/provider:

- `minimum`: เส้นทาง OpenAI/core live และ Docker ที่สำคัญต่อ release และเร็วที่สุด
- `stable`: minimum พร้อม coverage ของ provider/backend ที่ stable สำหรับอนุมัติ release
- `full`: stable พร้อม coverage กว้างของ advisory provider/media

`OpenClaw Release Checks` ใช้ trusted workflow ref เพื่อ resolve target
ref หนึ่งครั้งเป็น `release-package-under-test` และ reuse artifact นั้นทั้งใน
release-path Docker checks และ Package Acceptance วิธีนี้ทำให้ทุก
box ที่เกี่ยวข้องกับแพ็กเกจใช้ bytes ชุดเดียวกันและหลีกเลี่ยงการ build แพ็กเกจซ้ำ
cross-OS OpenAI install smoke ใช้ `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อมีการตั้งค่า
repo/org variable มิฉะนั้นจะใช้ `openai/gpt-5.4` เพราะ lane นี้กำลัง
พิสูจน์ package install, onboarding, gateway startup และ live agent turn หนึ่งครั้ง
ไม่ใช่การ benchmark default model ที่ช้าที่สุด ส่วน live provider
matrix ที่กว้างกว่ายังคงเป็นที่สำหรับ coverage เฉพาะ model

ใช้ variants เหล่านี้ตาม stage ของ release:

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

อย่าใช้ umbrella แบบเต็มเป็นการ rerun ครั้งแรกหลังแก้แบบเฉพาะจุด หาก box หนึ่ง
ล้มเหลว ให้ใช้ child workflow, งาน, Docker lane, package profile, model
provider หรือ QA lane ที่ล้มเหลวสำหรับหลักฐานถัดไป รัน umbrella แบบเต็มอีกครั้งก็ต่อเมื่อ
การแก้เปลี่ยน release orchestration ที่ใช้ร่วมกัน หรือทำให้หลักฐาน all-box ก่อนหน้า
ล้าสมัย verifier สุดท้ายของ umbrella จะตรวจซ้ำ workflow run
ids ของ child ที่บันทึกไว้ ดังนั้นหลังจาก child workflow ถูก rerun สำเร็จแล้ว ให้ rerun เฉพาะงานหลัก
`Verify full validation` ที่ล้มเหลว

สำหรับการกู้คืนแบบมีขอบเขต ให้ส่ง `rerun_group` ไปยัง umbrella `all` คือการรัน
release-candidate จริง, `ci` รันเฉพาะ child ของ CI ปกติ, `plugin-prerelease`
รันเฉพาะ child ของ Plugin เฉพาะ release, `release-checks` รัน release
box ทุกตัว และ release groups ที่แคบกว่าคือ `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` และ `npm-telegram`
การ rerun `npm-telegram` แบบเฉพาะจุดต้องมี `npm_telegram_package_spec`; การรัน full/all
ที่มี `release_profile=full` ใช้ release-checks package artifact

### Vitest

Vitest box คือ child workflow `CI` แบบ manual Manual CI ตั้งใจ
ข้าม changed scoping และบังคับ test graph ปกติสำหรับ release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android และ Control UI i18n

ใช้ box นี้เพื่อตอบว่า "source tree ผ่านชุดทดสอบปกติแบบเต็มหรือไม่?"
นี่ไม่เหมือนกับการตรวจสอบผลิตภัณฑ์ตาม release-path หลักฐานที่ควรเก็บ:

- สรุป `Full Release Validation` ที่แสดง URL ของ `CI` run ที่ถูก dispatch
- `CI` run เป็นสีเขียวบน target SHA ที่แน่นอน
- ชื่อ shard ที่ล้มเหลวหรือช้าจากงาน CI เมื่อตรวจสอบ regression
- Vitest timing artifacts เช่น `.artifacts/vitest-shard-timings.json` เมื่อ
  run ต้องการการวิเคราะห์ประสิทธิภาพ

รัน manual CI โดยตรงเฉพาะเมื่อ release ต้องการ CI ปกติที่ deterministic แต่
ไม่ต้องใช้ Docker, QA Lab, live, cross-OS หรือ package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box อยู่ใน `OpenClaw Release Checks` ผ่าน
`openclaw-live-and-e2e-checks-reusable.yml` รวมถึง workflow `install-smoke`
แบบ release-mode โดยตรวจสอบ release candidate ผ่านสภาพแวดล้อม Docker
แบบ packaged แทนที่จะใช้เฉพาะการทดสอบระดับ source

Release Docker coverage รวมถึง:

- install smoke แบบเต็มโดยเปิดใช้ Bun global install smoke ที่ช้า
- การเตรียม/reuse root Dockerfile smoke image ตาม target SHA พร้อมงาน QR,
  root/gateway และ installer/Bun smoke ที่รันเป็น install-smoke shards แยกกัน
- repository E2E lanes
- release-path Docker chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` และ `plugins-runtime-install-h`
- OpenWebUI coverage ภายใน chunk `plugins-runtime-services` เมื่อมีการร้องขอ
- lane ติดตั้ง/ถอนติดตั้ง bundled plugin แบบแยก
  `bundled-plugin-install-uninstall-0` ถึง
  `bundled-plugin-install-uninstall-23`
- ชุด live/E2E provider และ Docker live model coverage เมื่อ release checks
  รวม live suites

ใช้ Docker artifacts ก่อน rerun release-path scheduler อัปโหลด
`.artifacts/docker-tests/` พร้อม lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON และคำสั่ง rerun สำหรับการกู้คืนแบบเฉพาะจุด
ให้ใช้ `docker_lanes=<lane[,lane]>` บน workflow live/E2E แบบ reusable แทน
การ rerun release chunks ทั้งหมด คำสั่ง rerun ที่สร้างขึ้นจะรวม
`package_artifact_run_id` ก่อนหน้าและ prepared Docker image inputs เมื่อมี เพื่อให้
lane ที่ล้มเหลวสามารถ reuse tarball และ GHCR images ชุดเดียวกันได้

### QA Lab

QA Lab box เป็นส่วนหนึ่งของ `OpenClaw Release Checks` เช่นกัน เป็น gate ด้าน
พฤติกรรม agentic และระดับ channel สำหรับ release ซึ่งแยกจาก Vitest และกลไกแพ็กเกจ
ของ Docker

Release QA Lab coverage รวมถึง:

- mock parity lane ที่เปรียบเทียบ OpenAI candidate lane กับ baseline Opus 4.6
  โดยใช้ agentic parity pack
- fast live Matrix QA profile ที่ใช้ environment `qa-live-shared`
- live Telegram QA lane ที่ใช้ Convex CI credential leases
- `pnpm qa:otel:smoke` เมื่อ release telemetry ต้องการหลักฐาน local ที่ชัดเจน

ใช้ box นี้เพื่อตอบว่า "release ทำงานถูกต้องในสถานการณ์ QA และ
live channel flows หรือไม่?" เก็บ artifact URLs สำหรับ parity, Matrix และ Telegram
lanes เมื่ออนุมัติ release Full Matrix coverage ยังมีให้ใช้งานเป็น
QA-Lab run แบบ manual sharded ไม่ใช่ lane สำคัญต่อ release ตามค่าเริ่มต้น

### แพ็กเกจ

Package box คือ installable-product gate ซึ่งรองรับโดย
`Package Acceptance` และ resolver
`scripts/resolve-openclaw-package-candidate.mjs` resolver จะ normalize
candidate ให้เป็น tarball `package-under-test` ที่ Docker E2E ใช้, ตรวจสอบ
package inventory, บันทึก package version และ SHA-256 และแยก workflow harness ref
ออกจาก package source ref

แหล่ง candidate ที่รองรับ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` หรือเวอร์ชัน OpenClaw release ที่แน่นอน
- `source=ref`: pack branch, tag หรือ full commit SHA ของ `package_ref` ที่ trusted
  ด้วย harness `workflow_ref` ที่เลือก
- `source=url`: ดาวน์โหลด HTTPS `.tgz` พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: reuse `.tgz` ที่อัปโหลดโดย GitHub Actions run อื่น

`OpenClaw Release Checks` รัน Package Acceptance ด้วย `source=artifact`,
prepared release package artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` และ
`telegram_mode=mock-openai` Package Acceptance ทำให้ migration, update, การ cleanup
stale plugin dependency, offline plugin fixtures, plugin update และ Telegram
package QA ใช้ tarball ที่ resolve แล้วชุดเดียวกัน upgrade matrix ครอบคลุมทุก stable npm-published baseline ตั้งแต่ `2026.4.23` ถึง `latest`; ใช้
Package Acceptance ด้วย `source=npm` สำหรับ candidate ที่ ship ไปแล้ว หรือ
`source=ref`/`source=artifact` สำหรับ tarball npm local ที่มี SHA รองรับก่อน
publish นี่คือสิ่งทดแทนแบบ GitHub-native
สำหรับ package/update coverage ส่วนใหญ่ที่ก่อนหน้านี้ต้องใช้
Parallels Cross-OS release checks ยังสำคัญสำหรับ onboarding, installer และ
platform behavior เฉพาะ OS แต่การตรวจสอบผลิตภัณฑ์ package/update ควร
เลือกใช้ Package Acceptance

checklist มาตรฐานสำหรับการตรวจสอบ update และ Plugin คือ
[การทดสอบ updates และ plugins](/th/help/testing-updates-plugins) ใช้เมื่อ
ตัดสินใจว่า local, Docker, Package Acceptance หรือ release-check lane ใดพิสูจน์
การติดตั้ง/update Plugin, doctor cleanup หรือการเปลี่ยน migration ของ published-package ได้
การ exhaustive published update migration จากทุกแพ็กเกจ stable `2026.4.23+` เป็น
workflow `Update Migration` แบบ manual แยกต่างหาก ไม่ได้เป็นส่วนหนึ่งของ Full Release CI

ความผ่อนปรน legacy package-acceptance ถูกจำกัดเวลาด้วยเจตนา แพ็กเกจจนถึง
`2026.4.25` อาจใช้ compatibility path สำหรับ metadata gaps ที่เผยแพร่ไปยัง
npm แล้ว: private QA inventory entries ที่หายไปจาก tarball, ไม่มี
`gateway install --wrapper`, ไม่มี patch files ใน git fixture ที่ได้จาก tarball,
ไม่มี `update.channel` ที่ persisted, ตำแหน่ง install-record ของ legacy plugin,
ไม่มี marketplace install-record persistence และ config metadata
migration ระหว่าง `plugins update` แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจ warn
สำหรับไฟล์ local build metadata stamp ที่ ship ไปแล้ว แพ็กเกจที่ใหม่กว่า
ต้องเป็นไปตาม package contracts สมัยใหม่; gaps เดียวกันนั้นจะทำให้ release
validation ล้มเหลว

ใช้โปรไฟล์ Package Acceptance ที่กว้างขึ้นเมื่อคำถามของ release เกี่ยวกับ
แพ็กเกจที่ติดตั้งได้จริง:

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

- `smoke`: เลนการติดตั้งแพ็กเกจ/ช่องทาง/เอเจนต์แบบเร็ว เครือข่าย Gateway และการโหลดการกำหนดค่าใหม่
- `package`: สัญญาการติดตั้ง/อัปเดต/แพ็กเกจ Plugin โดยไม่มี ClawHub แบบไลฟ์; นี่เป็นค่าเริ่มต้นของการตรวจสอบรีลีส
- `product`: `package` รวมกับช่องทาง MCP, การล้าง cron/subagent, การค้นหาเว็บ OpenAI และ OpenWebUI
- `full`: ส่วนย่อยของเส้นทางรีลีส Docker พร้อม OpenWebUI
- `custom`: รายการ `docker_lanes` ที่แน่นอนสำหรับการรันซ้ำแบบเจาะจง

สำหรับหลักฐาน Telegram ของแพ็กเกจตัวเลือก ให้เปิดใช้ `telegram_mode=mock-openai` หรือ
`telegram_mode=live-frontier` บน Package Acceptance เวิร์กโฟลว์จะส่ง tarball
`package-under-test` ที่แก้ค่าแล้วเข้าไปยังเลน Telegram; เวิร์กโฟลว์ Telegram
แบบสแตนด์อโลนยังคงรับสเปก npm ที่เผยแพร่แล้วสำหรับการตรวจสอบหลังเผยแพร่

## ระบบอัตโนมัติสำหรับการเผยแพร่รีลีส

`OpenClaw Release Publish` คือจุดเข้าเผยแพร่แบบแก้ไขสถานะปกติ โดยจะจัดลำดับ
เวิร์กโฟลว์ trusted-publisher ตามที่รีลีสต้องการ:

1. เช็กเอาต์แท็กรีลีสและแก้ค่า commit SHA ของแท็กนั้น
2. ตรวจสอบว่าแท็กสามารถเข้าถึงได้จาก `main` หรือ `release/*`
3. รัน `pnpm plugins:sync:check`
4. เรียกใช้ `Plugin NPM Release` ด้วย `publish_scope=all-publishable` และ
   `ref=<release-sha>`
5. เรียกใช้ `Plugin ClawHub Release` ด้วยสโคปและ SHA เดียวกัน
6. เรียกใช้ `OpenClaw NPM Release` ด้วยแท็กรีลีส, npm dist-tag และ
   `preflight_run_id` ที่บันทึกไว้

ตัวอย่างการเผยแพร่ Beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

เผยแพร่ Stable ไปยัง beta dist-tag เริ่มต้น:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

การเลื่อน Stable ไปยัง `latest` โดยตรงต้องระบุอย่างชัดเจน:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

ใช้เวิร์กโฟลว์ระดับล่าง `Plugin NPM Release` และ `Plugin ClawHub Release`
เฉพาะสำหรับงานซ่อมแซมหรือเผยแพร่ซ้ำแบบเจาะจงเท่านั้น สำหรับการซ่อมแซม Plugin
ที่เลือก ให้ส่ง `plugin_publish_scope=selected` และ `plugins=@openclaw/name` ไปยัง
`OpenClaw Release Publish` หรือเรียกใช้เวิร์กโฟลว์ลูกโดยตรงเมื่อไม่ควรเผยแพร่
แพ็กเกจ OpenClaw

## อินพุตของเวิร์กโฟลว์ NPM

`OpenClaw NPM Release` รับอินพุตที่ควบคุมโดยผู้ปฏิบัติงานเหล่านี้:

- `tag`: แท็กรีลีสที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1` หรือ
  `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` ค่านี้อาจเป็น workflow-branch
  commit SHA แบบครบ 40 อักขระปัจจุบันสำหรับ preflight แบบตรวจสอบเท่านั้นได้ด้วย
- `preflight_only`: `true` สำหรับการตรวจสอบ/บิลด์/แพ็กเกจเท่านั้น, `false` สำหรับ
  เส้นทางเผยแพร่จริง
- `preflight_run_id`: จำเป็นบนเส้นทางเผยแพร่จริงเพื่อให้เวิร์กโฟลว์ใช้ tarball
  ที่เตรียมไว้จากการรัน preflight ที่สำเร็จซ้ำ
- `npm_dist_tag`: แท็กเป้าหมายของ npm สำหรับเส้นทางเผยแพร่; ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Publish` รับอินพุตที่ควบคุมโดยผู้ปฏิบัติงานเหล่านี้:

- `tag`: แท็กรีลีสที่จำเป็น; ต้องมีอยู่แล้ว
- `preflight_run_id`: รหัสการรัน preflight ของ `OpenClaw NPM Release` ที่สำเร็จ;
  จำเป็นเมื่อ `publish_openclaw_npm=true`
- `npm_dist_tag`: แท็กเป้าหมายของ npm สำหรับแพ็กเกจ OpenClaw
- `plugin_publish_scope`: ค่าเริ่มต้นคือ `all-publishable`; ใช้ `selected` เฉพาะ
  สำหรับงานซ่อมแซมแบบเจาะจง
- `plugins`: ชื่อแพ็กเกจ `@openclaw/*` คั่นด้วยจุลภาคเมื่อ
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: ค่าเริ่มต้นคือ `true`; ตั้งเป็น `false` เฉพาะเมื่อใช้
  เวิร์กโฟลว์เป็นตัวจัดลำดับการซ่อมแซมเฉพาะ Plugin เท่านั้น

`OpenClaw Release Checks` รับอินพุตที่ควบคุมโดยผู้ปฏิบัติงานเหล่านี้:

- `ref`: branch, tag หรือ full commit SHA ที่จะตรวจสอบ การตรวจสอบที่มี secret
  ต้องให้ commit ที่แก้ค่าแล้วสามารถเข้าถึงได้จาก branch ของ OpenClaw หรือ
  release tag

กฎ:

- แท็ก Stable และแท็กแก้ไขสามารถเผยแพร่ไปยัง `beta` หรือ `latest` ได้
- แท็ก prerelease แบบ Beta สามารถเผยแพร่ได้เฉพาะไปยัง `beta`
- สำหรับ `OpenClaw NPM Release` อนุญาตให้ใช้อินพุต full commit SHA เฉพาะเมื่อ
  `preflight_only=true`
- `OpenClaw Release Checks` และ `Full Release Validation` เป็นแบบตรวจสอบเท่านั้นเสมอ
- เส้นทางเผยแพร่จริงต้องใช้ `npm_dist_tag` เดียวกับที่ใช้ระหว่าง preflight;
  เวิร์กโฟลว์จะตรวจสอบ metadata นั้นก่อนที่การเผยแพร่จะดำเนินต่อ

## ลำดับการรีลีส npm แบบ Stable

เมื่อตัดรีลีส npm แบบ Stable:

1. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนที่จะมีแท็ก คุณสามารถใช้ full workflow-branch commit SHA ปัจจุบัน
     สำหรับ dry run ของเวิร์กโฟลว์ preflight แบบตรวจสอบเท่านั้น
2. เลือก `npm_dist_tag=beta` สำหรับโฟลว์ beta-first ปกติ หรือ `latest` เฉพาะเมื่อ
   คุณตั้งใจต้องการเผยแพร่ Stable โดยตรง
3. รัน `Full Release Validation` บน release branch, release tag หรือ full
   commit SHA เมื่อคุณต้องการ CI ปกติรวมกับ live prompt cache, Docker, QA Lab,
   Matrix และความครอบคลุมของ Telegram จากเวิร์กโฟลว์แบบแมนนวลเดียว
4. หากคุณตั้งใจต้องการเฉพาะกราฟทดสอบปกติแบบกำหนดได้แน่นอน ให้รันเวิร์กโฟลว์
   `CI` แบบแมนนวลบน release ref แทน
5. บันทึก `preflight_run_id` ที่สำเร็จ
6. รัน `OpenClaw Release Publish` ด้วย `tag` เดียวกัน, `npm_dist_tag` เดียวกัน
   และ `preflight_run_id` ที่บันทึกไว้; เวิร์กโฟลว์จะเผยแพร่ Plugin ที่ถูกทำให้เป็นภายนอกไปยัง npm
   และ ClawHub ก่อนเลื่อนแพ็กเกจ OpenClaw npm
7. หากรีลีสลงบน `beta` ให้ใช้เวิร์กโฟลว์ส่วนตัว
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   เพื่อเลื่อนเวอร์ชัน Stable นั้นจาก `beta` ไปยัง `latest`
8. หากรีลีสเผยแพร่โดยตรงไปยัง `latest` อย่างตั้งใจและ `beta` ควรตามบิลด์ Stable
   เดียวกันทันที ให้ใช้เวิร์กโฟลว์ส่วนตัวเดียวกันนั้นเพื่อชี้ dist-tag ทั้งสองไปยังเวอร์ชัน Stable
   หรือปล่อยให้การซิงก์ซ่อมแซมตัวเองตามกำหนดการย้าย `beta` ในภายหลัง

การแก้ไข dist-tag อยู่ใน repo ส่วนตัวเพื่อความปลอดภัย เพราะยังต้องใช้
`NPM_TOKEN` ในขณะที่ repo สาธารณะใช้การเผยแพร่แบบ OIDC เท่านั้น

สิ่งนี้ทำให้ทั้งเส้นทางเผยแพร่โดยตรงและเส้นทางเลื่อนแบบ beta-first
มีเอกสารกำกับและผู้ปฏิบัติงานมองเห็นได้

หาก maintainer จำเป็นต้อง fallback ไปใช้การยืนยันตัวตน npm ในเครื่อง ให้รันคำสั่ง
1Password CLI (`op`) ใด ๆ เฉพาะภายในเซสชัน tmux เฉพาะเท่านั้น อย่าเรียก `op`
โดยตรงจาก shell เอเจนต์หลัก; การเก็บไว้ภายใน tmux ทำให้ prompt,
alert และการจัดการ OTP สังเกตได้ และป้องกัน alert ของโฮสต์ที่เกิดซ้ำ

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
