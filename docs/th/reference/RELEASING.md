---
read_when:
    - กำลังค้นหานิยามช่องทางการเผยแพร่สาธารณะ
    - การเรียกใช้การตรวจสอบรีลีสหรือการตรวจรับแพ็กเกจ
    - กำลังมองหารูปแบบการตั้งชื่อเวอร์ชันและรอบการเผยแพร่
summary: เลนการเผยแพร่, รายการตรวจสอบสำหรับผู้ปฏิบัติงาน, กล่องตรวจสอบความถูกต้อง, การตั้งชื่อเวอร์ชัน และรอบการเผยแพร่
title: นโยบายการเผยแพร่รุ่น
x-i18n:
    generated_at: "2026-05-07T13:26:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw มีช่องทางการเผยแพร่สาธารณะสามช่องทาง:

- เสถียร: รีลีสที่ติดแท็กซึ่งเผยแพร่ไปยัง npm `beta` เป็นค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อมีการร้องขออย่างชัดเจน
- เบต้า: แท็ก prerelease ที่เผยแพร่ไปยัง npm `beta`
- dev: head ที่เปลี่ยนแปลงต่อเนื่องของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันรีลีสเสถียร: `YYYY.M.D`
  - แท็ก Git: `vYYYY.M.D`
- เวอร์ชันรีลีสแก้ไขสำหรับเสถียร: `YYYY.M.D-N`
  - แท็ก Git: `vYYYY.M.D-N`
- เวอร์ชัน prerelease เบต้า: `YYYY.M.D-beta.N`
  - แท็ก Git: `vYYYY.M.D-beta.N`
- อย่าเติมศูนย์นำหน้าเดือนหรือวัน
- `latest` หมายถึงรีลีส npm เสถียรที่ได้รับการโปรโมตในปัจจุบัน
- `beta` หมายถึงเป้าหมายการติดตั้งเบต้าปัจจุบัน
- รีลีสเสถียรและรีลีสแก้ไขสำหรับเสถียรเผยแพร่ไปยัง npm `beta` เป็นค่าเริ่มต้น ผู้ดำเนินการรีลีสสามารถกำหนดเป้าหมายเป็น `latest` ได้อย่างชัดเจน หรือโปรโมตบิลด์เบต้าที่ผ่านการตรวจสอบแล้วในภายหลัง
- OpenClaw รีลีสเสถียรทุกครั้งจะส่งมอบแพ็กเกจ npm และแอป macOS พร้อมกัน;
  รีลีสเบต้าปกติจะตรวจสอบและเผยแพร่เส้นทาง npm/package ก่อน โดยสงวน
  การ build/sign/notarize แอป Mac ไว้สำหรับรีลีสเสถียร เว้นแต่จะมีการร้องขออย่างชัดเจน

## รอบการเผยแพร่

- รีลีสจะเคลื่อนไปแบบเบต้าก่อน
- เสถียรจะตามมาเฉพาะหลังจากเบต้าล่าสุดผ่านการตรวจสอบแล้ว
- โดยปกติ maintainer จะตัดรีลีสจากสาขา `release/YYYY.M.D` ที่สร้าง
  จาก `main` ปัจจุบัน เพื่อให้การตรวจสอบและการแก้ไขรีลีสไม่บล็อกการพัฒนาใหม่
  บน `main`
- หากมีการ push หรือเผยแพร่แท็กเบต้าแล้วและต้องแก้ไข maintainer จะตัด
  แท็ก `-beta.N` ถัดไปแทนการลบหรือสร้างแท็กเบต้าเดิมใหม่
- ขั้นตอนรีลีสโดยละเอียด การอนุมัติ ข้อมูลรับรอง และบันทึกการกู้คืน
  เป็นข้อมูลสำหรับ maintainer เท่านั้น

## เช็กลิสต์ผู้ดำเนินการรีลีส

เช็กลิสต์นี้คือโครงสร้างสาธารณะของโฟลว์รีลีส ข้อมูลรับรองส่วนตัว,
การลงนาม, การ notarization, การกู้คืน dist-tag, และรายละเอียด rollback ฉุกเฉินจะอยู่ใน
runbook รีลีสสำหรับ maintainer เท่านั้น

1. เริ่มจาก `main` ปัจจุบัน: pull ล่าสุด ยืนยันว่า commit เป้าหมายถูก push แล้ว
   และยืนยันว่า CI ของ `main` ปัจจุบันเขียวพอที่จะสร้างสาขาจากจุดนั้นได้
2. เขียนส่วนบนสุดของ `CHANGELOG.md` ใหม่จากประวัติ commit จริงด้วย
   `/changelog` ให้รายการเป็นเนื้อหาสำหรับผู้ใช้ commit แล้ว push จากนั้น rebase/pull
   อีกครั้งก่อนสร้างสาขา
3. ตรวจทานระเบียนความเข้ากันได้ของรีลีสใน
   `src/plugins/compat/registry.ts` และ
   `src/commands/doctor/shared/deprecation-compat.ts` ลบความเข้ากันได้ที่หมดอายุ
   เฉพาะเมื่อเส้นทางอัปเกรดยังคงครอบคลุมอยู่ หรือบันทึกเหตุผลว่าทำไมจึง
   ตั้งใจเก็บไว้
4. สร้าง `release/YYYY.M.D` จาก `main` ปัจจุบัน; อย่าทำงานรีลีสปกติ
   โดยตรงบน `main`
5. เพิ่มเวอร์ชันในทุกตำแหน่งที่จำเป็นสำหรับแท็กที่ตั้งใจไว้ รัน
   `pnpm plugins:sync` เพื่อให้แพ็กเกจ Plugin ที่เผยแพร่ได้ใช้เวอร์ชันรีลีส
   และ metadata ความเข้ากันได้ร่วมกัน จากนั้นรัน preflight แบบ deterministic ในเครื่อง:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, และ
   `pnpm release:check`
6. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true` ก่อนมีแท็ก
   อนุญาตให้ใช้ SHA แบบเต็ม 40 อักขระของสาขารีลีสสำหรับ preflight
   เพื่อการตรวจสอบเท่านั้น บันทึก `preflight_run_id` ที่สำเร็จไว้
7. เริ่มการทดสอบก่อนรีลีสทั้งหมดด้วย `Full Release Validation` สำหรับ
   สาขารีลีส แท็ก หรือ SHA commit แบบเต็ม นี่คือ entrypoint แบบแมนนวลหนึ่งเดียว
   สำหรับกล่องทดสอบรีลีสขนาดใหญ่สี่รายการ: Vitest, Docker, QA Lab, และ Package
8. หากการตรวจสอบล้มเหลว ให้แก้บนสาขารีลีสและรันซ้ำเฉพาะไฟล์, lane, workflow job,
   package profile, provider, หรือ model allowlist ที่ล้มเหลวและเล็กที่สุดซึ่งพิสูจน์
   การแก้ไขได้ รัน umbrella เต็มอีกครั้งเฉพาะเมื่อพื้นผิวที่เปลี่ยนทำให้หลักฐานก่อนหน้า
   ไม่ทันสมัย
9. สำหรับเบต้า ให้แท็ก `vYYYY.M.D-beta.N` จากนั้นรัน `OpenClaw Release Publish` จาก
   สาขา `release/YYYY.M.D` ที่ตรงกัน ซึ่งจะตรวจสอบ `pnpm plugins:sync:check`,
   dispatch แพ็กเกจ Plugin ที่เผยแพร่ได้ทั้งหมดไปยัง npm และชุดเดียวกันไปยัง
   ClawHub แบบขนาน จากนั้นโปรโมต artifact preflight ของ OpenClaw npm ที่เตรียมไว้
   ด้วย dist-tag ที่ตรงกันทันทีที่การเผยแพร่ Plugin npm สำเร็จ
   การเผยแพร่ ClawHub อาจยังทำงานอยู่ในขณะที่ OpenClaw npm เผยแพร่ แต่
   workflow การเผยแพร่รีลีสจะไม่เสร็จจนกว่าเส้นทางเผยแพร่ Plugin ทั้งสองและ
   เส้นทางเผยแพร่ OpenClaw npm จะเสร็จสมบูรณ์สำเร็จ หลังเผยแพร่ ให้รัน
   การยอมรับแพ็กเกจหลังเผยแพร่
   กับแพ็กเกจ `openclaw@YYYY.M.D-beta.N` หรือ
   `openclaw@beta` ที่เผยแพร่แล้ว หาก prerelease ที่ถูก push หรือเผยแพร่แล้วต้องแก้ไข
   ให้ตัดหมายเลข prerelease ถัดไปที่ตรงกัน อย่าลบหรือเขียน prerelease เดิมใหม่
10. สำหรับเสถียร ให้ดำเนินต่อเฉพาะหลังจากเบต้าหรือ release candidate ที่ผ่านการตรวจสอบแล้วมี
    หลักฐานการตรวจสอบที่จำเป็น การเผยแพร่ npm เสถียรก็ผ่าน
    `OpenClaw Release Publish` เช่นกัน โดยใช้ artifact preflight ที่สำเร็จผ่าน
    `preflight_run_id`; ความพร้อมของรีลีส macOS เสถียรยังต้องมี
    `.zip`, `.dmg`, `.dSYM.zip` ที่แพ็กเกจแล้ว และ `appcast.xml` ที่อัปเดตบน `main`
11. หลังเผยแพร่ ให้รันตัวตรวจสอบหลังเผยแพร่ของ npm, E2E Telegram ของ published-npm
    แบบ standalone ที่เป็นตัวเลือกเมื่อคุณต้องการหลักฐานช่องทางหลังเผยแพร่,
    การโปรโมต dist-tag เมื่อจำเป็น, บันทึก GitHub release/prerelease จาก
    ส่วน `CHANGELOG.md` ที่ตรงกันอย่างครบถ้วน, และขั้นตอนประกาศรีลีส

## Release preflight

- รัน `pnpm check:test-types` ก่อน preflight รีลีส เพื่อให้ TypeScript ของการทดสอบยังคงถูกครอบคลุมนอก gate `pnpm check` แบบ local ที่เร็วกว่า
- รัน `pnpm check:architecture` ก่อน preflight รีลีส เพื่อให้การตรวจสอบวงจร import และขอบเขตสถาปัตยกรรมที่กว้างขึ้นผ่านเป็นสีเขียวนอก gate แบบ local ที่เร็วกว่า
- รัน `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้ artifact รีลีส `dist/*` ที่คาดไว้และ bundle ของ Control UI มีอยู่สำหรับขั้นตอนตรวจสอบ pack
- รัน `pnpm plugins:sync` หลังจาก bump เวอร์ชัน root และก่อนติดแท็ก คำสั่งนี้จะอัปเดตเวอร์ชันแพ็กเกจ Plugin ที่เผยแพร่ได้, metadata ความเข้ากันได้ของ OpenClaw peer/API, build metadata และ stub changelog ของ Plugin ให้ตรงกับเวอร์ชันรีลีส core `pnpm plugins:sync:check` คือ guard รีลีสแบบไม่แก้ไขไฟล์; workflow เผยแพร่จะล้มเหลวก่อนมีการเปลี่ยนแปลง registry ใด ๆ หากลืมขั้นตอนนี้
- รัน workflow แบบ manual `Full Release Validation` ก่อนอนุมัติรีลีส เพื่อเริ่ม test box ก่อนรีลีสทั้งหมดจาก entrypoint เดียว Workflow นี้รับ branch, tag หรือ commit SHA แบบเต็ม, dispatch `CI` แบบ manual และ dispatch `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, การตรวจสอบแพ็กเกจข้าม OS, QA Lab parity, Matrix และ lane ของ Telegram การรัน stable/default จะเก็บ live/E2E แบบ exhaustive และ Docker release-path soak ไว้หลัง `run_release_soak=true`; `release_profile=full` จะบังคับเปิด soak เมื่อใช้ `release_profile=full` และ `rerun_group=all` จะรัน Telegram E2E ของแพ็กเกจกับ artifact `release-package-under-test` จาก release checks ด้วย ระบุ `npm_telegram_package_spec` หลังเผยแพร่เมื่อ Telegram E2E เดียวกันควรพิสูจน์แพ็กเกจ npm ที่เผยแพร่แล้วด้วย ระบุ `package_acceptance_package_spec` หลังเผยแพร่เมื่อ Package Acceptance ควรรัน matrix package/update กับแพ็กเกจ npm ที่ส่งออกแล้วแทน artifact ที่ build จาก SHA ระบุ `evidence_package_spec` เมื่อรายงาน evidence แบบ private ควรพิสูจน์ว่าการตรวจสอบตรงกับแพ็กเกจ npm ที่เผยแพร่แล้วโดยไม่บังคับ Telegram E2E ตัวอย่าง:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- รัน workflow แบบ manual `Package Acceptance` เมื่อคุณต้องการหลักฐาน side-channel สำหรับ candidate ของแพ็กเกจขณะที่งานรีลีสดำเนินต่อไป ใช้ `source=npm` สำหรับ `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรีลีสแบบเจาะจง; ใช้ `source=ref` เพื่อ pack branch/tag/SHA `package_ref` ที่เชื่อถือได้ด้วย harness `workflow_ref` ปัจจุบัน; ใช้ `source=url` สำหรับ tarball HTTPS พร้อม SHA-256 ที่บังคับมี; หรือใช้ `source=artifact` สำหรับ tarball ที่อัปโหลดโดย GitHub Actions run อื่น Workflow จะ resolve candidate ไปเป็น `package-under-test`, ใช้ตัวจัดตาราง Docker E2E release ซ้ำกับ tarball นั้น และสามารถรัน Telegram QA กับ tarball เดียวกันด้วย `telegram_mode=mock-openai` หรือ `telegram_mode=live-frontier` เมื่อ lane Docker ที่เลือกมี `published-upgrade-survivor` artifact ของแพ็กเกจคือ candidate และ `published_upgrade_survivor_baseline` จะเลือก baseline ที่เผยแพร่แล้ว `update-restart-auth` ใช้แพ็กเกจ candidate เป็นทั้ง CLI ที่ติดตั้งและ package-under-test เพื่อให้ทดสอบเส้นทาง managed restart ของคำสั่ง update ของ candidate
  ตัวอย่าง: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  โปรไฟล์ทั่วไป:
  - `smoke`: lane install/channel/agent, เครือข่าย Gateway และ config reload
  - `package`: lane package/update/restart/Plugin แบบ artifact-native โดยไม่มี OpenWebUI หรือ ClawHub live
  - `product`: โปรไฟล์ package พร้อมช่องทาง MCP, การล้าง cron/subagent, การค้นหาเว็บของ OpenAI และ OpenWebUI
  - `full`: chunk Docker release-path พร้อม OpenWebUI
  - `custom`: การเลือก `docker_lanes` แบบเจาะจงสำหรับการ rerun ที่โฟกัส
- รัน workflow แบบ manual `CI` โดยตรงเมื่อคุณต้องการเฉพาะ coverage CI ปกติแบบเต็มสำหรับ release candidate การ dispatch CI แบบ manual จะข้าม changed scoping และบังคับ lane Linux Node shards, bundled-Plugin shards, channel contracts, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, Android และ Control UI i18n
  ตัวอย่าง: `gh workflow run ci.yml --ref release/YYYY.M.D`
- รัน `pnpm qa:otel:smoke` เมื่อตรวจสอบ telemetry ของรีลีส คำสั่งนี้ทดสอบ QA-lab ผ่านตัวรับ OTLP/HTTP แบบ local และตรวจสอบชื่อ span ของ trace ที่ export แล้ว, attribute ที่มีขอบเขต และการ redact เนื้อหา/identifier โดยไม่ต้องใช้ Opik, Langfuse หรือ collector ภายนอกอื่น
- รัน `pnpm release:check` ก่อนรีลีสที่ติดแท็กทุกครั้ง
- รัน `OpenClaw Release Publish` สำหรับลำดับการเผยแพร่ที่มีการเปลี่ยนแปลงหลังจากมี tag แล้ว Dispatch จาก `release/YYYY.M.D` (หรือ `main` เมื่อเผยแพร่ tag ที่ reachable จาก main), ส่ง release tag และ `preflight_run_id` ของ OpenClaw npm ที่สำเร็จ และคง scope เผยแพร่ Plugin ค่าเริ่มต้น `all-publishable` ไว้ เว้นแต่คุณตั้งใจรันการซ่อมเฉพาะจุด Workflow จะทำให้การเผยแพร่ Plugin npm, การเผยแพร่ Plugin ClawHub และการเผยแพร่ OpenClaw npm ทำงานตามลำดับ เพื่อไม่ให้แพ็กเกจ core ถูกเผยแพร่ก่อน Plugin ที่ externalize แล้ว
- ตอนนี้ release checks รันใน workflow แบบ manual แยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรัน lane QA Lab mock parity พร้อมโปรไฟล์ live Matrix แบบเร็วและ lane Telegram QA ก่อนอนุมัติรีลีส lane live ใช้ environment `qa-live-shared`; Telegram ยังใช้ lease credential ของ Convex CI ด้วย รัน workflow แบบ manual `QA-Lab - All Lanes` ด้วย `matrix_profile=all` และ `matrix_shards=true` เมื่อคุณต้องการ inventory Matrix transport, media และ E2EE แบบเต็มในแบบขนาน
- การตรวจสอบ runtime สำหรับการติดตั้งและอัปเกรดข้าม OS เป็นส่วนหนึ่งของ `OpenClaw Release Checks` และ `Full Release Validation` แบบ public ซึ่งเรียก reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` โดยตรง
- การแยกนี้เป็นความตั้งใจ: ทำให้เส้นทางรีลีส npm จริงสั้น, deterministic และเน้น artifact ขณะที่การตรวจสอบ live ที่ช้ากว่าอยู่ใน lane ของตัวเองเพื่อไม่ให้หน่วงหรือบล็อกการเผยแพร่
- release checks ที่มี secret ควร dispatch ผ่าน `Full Release
Validation` หรือจาก workflow ref `main`/release เพื่อให้ logic ของ workflow และ secret ยังถูกควบคุม
- `OpenClaw Release Checks` รับ branch, tag หรือ commit SHA แบบเต็ม ตราบใดที่ commit ที่ resolve แล้ว reachable จาก branch หรือ release tag ของ OpenClaw
- preflight แบบ validation-only ของ `OpenClaw NPM Release` ยังรับ commit SHA แบบเต็ม 40 อักขระของ workflow-branch ปัจจุบันได้ โดยไม่ต้องมี tag ที่ push แล้ว
- เส้นทาง SHA นั้นเป็นแบบ validation-only และไม่สามารถ promote เป็น publish จริงได้
- ในโหมด SHA workflow จะสังเคราะห์ `v<package.json version>` เฉพาะสำหรับการตรวจสอบ package metadata; การ publish จริงยังต้องใช้ release tag จริง
- ทั้งสอง workflow ยังคงให้เส้นทาง publish และ promotion จริงอยู่บน runner ที่ GitHub-hosted ขณะที่เส้นทาง validation ที่ไม่เปลี่ยนแปลงข้อมูลสามารถใช้ runner Blacksmith Linux ที่ใหญ่กว่าได้
- Workflow นั้นรัน
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ workflow secret ทั้ง `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- preflight รีลีส npm ไม่รอ lane release checks แยกต่างหากอีกต่อไป
- รัน `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือ tag beta/correction ที่ตรงกัน) ก่อนอนุมัติ
- หลัง publish npm แล้ว ให้รัน
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (หรือเวอร์ชัน beta/correction ที่ตรงกัน) เพื่อตรวจสอบเส้นทางติดตั้งจาก registry ที่เผยแพร่แล้วใน temp prefix ใหม่
- หลังเผยแพร่ beta ให้รัน `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  เพื่อตรวจสอบ onboarding ของแพ็กเกจที่ติดตั้งแล้ว, การตั้งค่า Telegram และ Telegram E2E จริงกับแพ็กเกจ npm ที่เผยแพร่แล้วโดยใช้ pool credential Telegram แบบ leased ที่แชร์ร่วมกัน maintainer ที่รัน one-off แบบ local อาจละเว้นตัวแปร Convex และส่ง env credential `OPENCLAW_QA_TELEGRAM_*` ทั้งสามตัวโดยตรง
- หากต้องการรัน post-publish beta smoke แบบเต็มจากเครื่องของ maintainer ให้ใช้ `pnpm release:beta-smoke -- --beta betaN` helper จะรันการตรวจสอบ Parallels npm update/fresh-target, dispatch `NPM Telegram Beta E2E`, poll workflow run ที่เจาะจง, ดาวน์โหลด artifact และพิมพ์รายงาน Telegram
- Maintainer สามารถรัน post-publish check เดียวกันจาก GitHub Actions ผ่าน workflow แบบ manual `NPM Telegram Beta E2E` ได้ Workflow นี้ตั้งใจให้เป็น manual-only และไม่รันทุกครั้งที่ merge
- ตอนนี้ automation รีลีสของ maintainer ใช้ preflight-then-promote:
  - การ publish npm จริงต้องผ่าน npm `preflight_run_id` ที่สำเร็จ
  - การ publish npm จริงต้อง dispatch จาก branch `main` หรือ `release/YYYY.M.D` เดียวกับ preflight run ที่สำเร็จ
  - รีลีส npm แบบ stable มีค่าเริ่มต้นเป็น `beta`
  - การ publish npm แบบ stable สามารถ target `latest` ได้อย่างชัดเจนผ่าน input ของ workflow
  - ตอนนี้การเปลี่ยน npm dist-tag แบบ token-based อยู่ใน
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    เพื่อความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่ repo public ใช้การ publish แบบ OIDC-only
  - `macOS Release` แบบ public เป็น validation-only; เมื่อ tag อยู่เฉพาะบน release branch แต่ workflow dispatch จาก `main` ให้ตั้งค่า `public_release_branch=release/YYYY.M.D`
  - การ publish mac แบบ private จริงต้องผ่าน `preflight_run_id` และ `validate_run_id` ของ mac private ที่สำเร็จ
  - เส้นทาง publish จริงจะ promote artifact ที่เตรียมไว้แทนที่จะ rebuild อีกครั้ง
- สำหรับรีลีส correction แบบ stable เช่น `YYYY.M.D-N` verifier หลัง publish จะตรวจสอบเส้นทางอัปเกรด temp-prefix เดียวกันจาก `YYYY.M.D` ไปเป็น `YYYY.M.D-N` ด้วย เพื่อไม่ให้ release correction ปล่อยให้การติดตั้ง global รุ่นเก่าค้างอยู่บน payload stable ฐานโดยไม่รู้ตัว
- preflight รีลีส npm จะ fail-closed เว้นแต่ tarball มีทั้ง `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่าง เพื่อไม่ให้เราส่ง dashboard เบราว์เซอร์ว่างอีก
- การตรวจสอบหลัง publish ยังตรวจสอบว่า entrypoint ของ Plugin ที่เผยแพร่แล้วและ package metadata มีอยู่ใน layout registry ที่ติดตั้งแล้ว รีลีสที่ส่ง payload runtime ของ Plugin ขาดหายจะทำให้ postpublish verifier ล้มเหลวและไม่สามารถ promote เป็น `latest` ได้
- `pnpm test:install:smoke` ยังบังคับใช้งบประมาณ npm pack `unpackedSize` กับ tarball อัปเดต candidate เพื่อให้ installer e2e จับ pack bloat ที่เกิดโดยไม่ตั้งใจก่อนเส้นทาง publish รีลีส
- หากงานรีลีสแตะการวางแผน CI, manifest timing ของ extension หรือ matrix การทดสอบ extension ให้ regenerate และ review matrix output `plugin-prerelease-extension-shard` ที่ planner เป็นเจ้าของจาก `.github/workflows/plugin-prerelease.yml` ก่อนอนุมัติ เพื่อไม่ให้ release notes อธิบาย layout CI ที่ล้าสมัย
- ความพร้อมของรีลีส macOS แบบ stable ยังรวมถึงพื้นผิว updater:
  - GitHub release ต้องลงเอยด้วย `.zip`, `.dmg` และ `.dSYM.zip` ที่จัดแพ็กแล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปยัง stable zip ใหม่หลัง publish
  - แอปที่จัดแพ็กแล้วต้องคง bundle id แบบไม่ใช่ debug, URL feed ของ Sparkle ที่ไม่ว่าง และ `CFBundleVersion` ที่เท่ากับหรือสูงกว่า canonical Sparkle build floor สำหรับเวอร์ชันรีลีสนั้น

## test box ของรีลีส

`Full Release Validation` คือวิธีที่ operator ใช้เริ่มการทดสอบก่อนรีลีสทั้งหมดจาก entrypoint เดียว สำหรับหลักฐาน commit ที่ pin ไว้บน branch ที่เคลื่อนไหวเร็ว ให้ใช้ helper เพื่อให้ workflow ลูกทุกตัวรันจาก branch ชั่วคราวที่ตรึงไว้กับ SHA เป้าหมาย:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper จะ push `release-ci/<sha>-...`, dispatch `Full Release Validation` จาก branch นั้นด้วย `ref=<sha>`, ตรวจสอบว่า `headSha` ของ workflow ลูกทุกตัวตรงกับเป้าหมาย แล้วลบ branch ชั่วคราว วิธีนี้ช่วยหลีกเลี่ยงการพิสูจน์ child run ของ `main` ที่ใหม่กว่าโดยไม่ตั้งใจ

สำหรับการตรวจสอบ release branch หรือ tag ให้รันจาก workflow ref `main` ที่เชื่อถือได้ และส่ง release branch หรือ tag เป็น `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

เวิร์กโฟลว์จะแปลง target ref, dispatch `CI` แบบ manual โดยใช้
`target_ref=<release-ref>`, dispatch `OpenClaw Release Checks`, เตรียม artifact
หลัก `release-package-under-test` สำหรับการตรวจสอบที่เกี่ยวกับ package และ
dispatch package Telegram E2E แบบ standalone เมื่อ `release_profile=full` พร้อม
`rerun_group=all` หรือเมื่อมีการตั้งค่า `npm_telegram_package_spec` จากนั้น
`OpenClaw Release Checks` จะกระจายงานไปยัง install smoke, cross-OS release checks,
live/E2E Docker release-path coverage เมื่อเปิดใช้ soak, Package Acceptance พร้อม
Telegram package QA, QA Lab parity, live Matrix และ live Telegram การรันแบบเต็มจะยอมรับได้ก็ต่อเมื่อ
สรุป `Full Release Validation`
แสดงว่า `normal_ci` และ `release_checks` สำเร็จ ในโหมด full/all งานลูก
`npm_telegram` ต้องสำเร็จด้วย นอกเหนือจาก full/all งานนี้จะถูกข้าม เว้นแต่มีการระบุ
`npm_telegram_package_spec` ที่เผยแพร่แล้ว สรุป verifier สุดท้ายมีตารางงานที่ช้าที่สุดสำหรับแต่ละ child run เพื่อให้ release manager เห็น critical path ปัจจุบันโดยไม่ต้องดาวน์โหลด log
ดู [การตรวจสอบความถูกต้องของรุ่นแบบเต็ม](/th/reference/full-release-validation) สำหรับ
stage matrix แบบครบถ้วน ชื่อ workflow job ที่แน่นอน ความแตกต่างระหว่าง stable กับ full profile
artifacts และ focused rerun handles
Child workflows จะถูก dispatch จาก trusted ref ที่รัน `Full Release
Validation` โดยปกติคือ `--ref main` แม้ว่า target `ref` จะชี้ไปยัง release branch หรือ tag
ที่เก่ากว่าก็ตาม ไม่มี workflow-ref input แยกต่างหากสำหรับ Full Release Validation
ให้เลือก trusted harness ด้วยการเลือก workflow run ref
อย่าใช้ `--ref main -f ref=<sha>` สำหรับหลักฐาน commit ที่แน่นอนบน `main` ที่เคลื่อนไปเรื่อย ๆ
เพราะ raw commit SHA ไม่สามารถเป็น workflow dispatch ref ได้ ดังนั้นให้ใช้
`pnpm ci:full-release --sha <sha>` เพื่อสร้าง temporary branch ที่ pin ไว้

ใช้ `release_profile` เพื่อเลือกความครอบคลุมของ live/provider:

- `minimum`: เส้นทาง live OpenAI/core และ Docker ที่สำคัญต่อ release ซึ่งเร็วที่สุด
- `stable`: minimum พร้อม coverage ของ provider/backend แบบ stable สำหรับการอนุมัติ release
- `full`: stable พร้อม coverage ของ advisory provider/media ที่กว้างขึ้น

ใช้ `run_release_soak=true` กับ `stable` เมื่อ release-blocking lanes
เขียวแล้ว และคุณต้องการ sweep แบบ exhaustive สำหรับ live/E2E, Docker release-path และ
bounded published upgrade-survivor ก่อนการโปรโมต sweep นี้ครอบคลุม
stable packages สี่รายการล่าสุด รวมถึง baseline ที่ pin ไว้ `2026.4.23` และ `2026.5.2`
พร้อม coverage เก่ากว่า `2026.4.15` โดยลบ baseline ที่ซ้ำกันออกและ
แบ่งแต่ละ baseline เป็น Docker runner job ของตัวเอง `full` หมายรวมถึง
`run_release_soak=true`

`OpenClaw Release Checks` ใช้ trusted workflow ref เพื่อ resolve target
ref หนึ่งครั้งเป็น `release-package-under-test` และใช้ artifact นั้นซ้ำใน cross-OS,
Package Acceptance และ release-path Docker checks เมื่อ soak ทำงาน วิธีนี้ทำให้
box ทั้งหมดที่เกี่ยวกับ package ใช้ byte เดียวกันและหลีกเลี่ยงการ build package ซ้ำ
OpenAI install smoke แบบ cross-OS ใช้ `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อมีการตั้งค่า
repo/org variable ไม่เช่นนั้นใช้ `openai/gpt-5.4` เพราะ lane นี้กำลัง
พิสูจน์การติดตั้ง package, onboarding, การเริ่มต้น Gateway และ agent turn แบบ live หนึ่งครั้ง
แทนที่จะ benchmark model default ที่ช้าที่สุด ส่วน live provider
matrix ที่กว้างกว่ายังคงเป็นที่สำหรับ coverage เฉพาะ model

ใช้ variant เหล่านี้ตาม stage ของ release:

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

อย่าใช้ umbrella แบบเต็มเป็นการ rerun ครั้งแรกหลังจากการแก้ไขแบบ focused หาก box หนึ่ง
ล้มเหลว ให้ใช้ failed child workflow, job, Docker lane, package profile, model
provider หรือ QA lane สำหรับหลักฐานครั้งถัดไป รัน umbrella แบบเต็มอีกครั้งก็ต่อเมื่อ
การแก้ไขเปลี่ยน release orchestration ที่ใช้ร่วมกัน หรือทำให้หลักฐาน all-box ก่อนหน้า
ล้าสมัย verifier สุดท้ายของ umbrella จะตรวจซ้ำ workflow run
ids ของ child ที่บันทึกไว้ ดังนั้นหลังจาก child workflow ถูก rerun จนสำเร็จแล้ว ให้ rerun เฉพาะ parent job
`Verify full validation` ที่ล้มเหลว

สำหรับการกู้คืนแบบมีขอบเขต ให้ส่ง `rerun_group` ไปยัง umbrella `all` คือการรัน
release-candidate จริง, `ci` รันเฉพาะ normal CI child, `plugin-prerelease`
รันเฉพาะ release-only plugin child, `release-checks` รัน release
box ทุกตัว และกลุ่ม release ที่แคบกว่าคือ `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` และ `npm-telegram`
การ rerun `npm-telegram` แบบ focused ต้องมี `npm_telegram_package_spec`; การรัน full/all
ด้วย `release_profile=full` จะใช้ release-checks package artifact การ rerun
cross-OS แบบ focused สามารถเพิ่ม `cross_os_suite_filter=windows/packaged-upgrade` หรือ
ตัวกรอง OS/suite อื่นได้ ความล้มเหลวของ QA release-check เป็น advisory; ความล้มเหลวเฉพาะ QA
ไม่ block release validation

### Vitest

Vitest box คือ manual `CI` child workflow Manual CI ตั้งใจ
ข้าม changed scoping และบังคับใช้ test graph ปกติสำหรับ release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, ความเข้ากันได้กับ Node 22,
`check`, `check-additional`, build smoke, docs checks, Python
Skills, Windows, macOS, Android และ Control UI i18n

ใช้ box นี้เพื่อตอบว่า "source tree ผ่าน full normal test suite หรือไม่?"
มันไม่เหมือนกับ release-path product validation หลักฐานที่ควรเก็บไว้:

- สรุป `Full Release Validation` ที่แสดง URL ของ `CI` run ที่ถูก dispatch
- `CI` run เขียวบน target SHA ที่แน่นอน
- ชื่อ shard ที่ล้มเหลวหรือช้าจาก CI jobs เมื่อสืบสวน regression
- artifact timing ของ Vitest เช่น `.artifacts/vitest-shard-timings.json` เมื่อ
  run ต้องการ performance analysis

รัน manual CI โดยตรงเฉพาะเมื่อ release ต้องการ normal CI ที่ deterministic แต่
ไม่ต้องการ Docker, QA Lab, live, cross-OS หรือ package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box อยู่ใน `OpenClaw Release Checks` ผ่าน
`openclaw-live-and-e2e-checks-reusable.yml` รวมถึง workflow `install-smoke`
ใน release-mode มันตรวจสอบ release candidate ผ่าน packaged
Docker environments แทนที่จะเป็นเพียง source-level tests

Docker coverage สำหรับ release ประกอบด้วย:

- full install smoke พร้อมเปิดใช้ slow Bun global install smoke
- การเตรียม/ใช้ซ้ำ root Dockerfile smoke image ตาม target SHA โดยมี QR,
  root/Gateway และ installer/Bun smoke jobs ทำงานเป็น install-smoke
  shards แยกกัน
- repository E2E lanes
- release-path Docker chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` และ `plugins-runtime-install-h`
- OpenWebUI coverage ภายใน chunk `plugins-runtime-services` เมื่อมีการร้องขอ
- bundled plugin install/uninstall lanes แบบแยก
  `bundled-plugin-install-uninstall-0` ถึง
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites และ Docker live model coverage เมื่อ release checks
  รวม live suites

ใช้ Docker artifacts ก่อน rerun release-path scheduler อัปโหลด
`.artifacts/docker-tests/` พร้อม lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON และคำสั่ง rerun สำหรับการกู้คืนแบบ focused
ให้ใช้ `docker_lanes=<lane[,lane]>` บน reusable live/E2E workflow แทนการ
rerun release chunks ทั้งหมด คำสั่ง rerun ที่สร้างขึ้นจะรวม
`package_artifact_run_id` ก่อนหน้าและ prepared Docker image inputs เมื่อมีให้ใช้ เพื่อให้
lane ที่ล้มเหลวสามารถใช้ tarball และ GHCR images ชุดเดิมซ้ำได้

### QA Lab

QA Lab box เป็นส่วนหนึ่งของ `OpenClaw Release Checks` เช่นกัน มันคือ release gate
สำหรับพฤติกรรม agentic และระดับ channel แยกจาก Vitest และกลไก
package ของ Docker

QA Lab coverage สำหรับ release ประกอบด้วย:

- mock parity lane ที่เปรียบเทียบ OpenAI candidate lane กับ baseline Opus 4.6
  โดยใช้ agentic parity pack
- fast live Matrix QA profile โดยใช้ environment `qa-live-shared`
- live Telegram QA lane โดยใช้ Convex CI credential leases
- `pnpm qa:otel:smoke` เมื่อ release telemetry ต้องการหลักฐาน local ที่ชัดเจน

ใช้ box นี้เพื่อตอบว่า "release ทำงานถูกต้องใน QA scenarios และ
live channel flows หรือไม่?" เก็บ artifact URLs สำหรับ parity, Matrix และ Telegram
lanes เมื่ออนุมัติ release Full Matrix coverage ยังคงมีให้ใช้เป็นการรัน
QA-Lab แบบ sharded manual แทนที่จะเป็น lane สำคัญต่อ release แบบ default

### แพ็กเกจ

Package box คือ gate ของ installable-product ซึ่งรองรับโดย
`Package Acceptance` และ resolver
`scripts/resolve-openclaw-package-candidate.mjs` resolver จะ normalize
candidate ให้เป็น tarball `package-under-test` ที่ Docker E2E ใช้, ตรวจสอบ
package inventory, บันทึก package version และ SHA-256 และแยก workflow harness ref
ออกจาก package source ref

แหล่ง candidate ที่รองรับ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` หรือ OpenClaw release
  version ที่แน่นอน
- `source=ref`: pack branch, tag หรือ full commit SHA ของ `package_ref` ที่ trusted
  ด้วย harness `workflow_ref` ที่เลือก
- `source=url`: ดาวน์โหลด HTTPS `.tgz` พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: ใช้ `.tgz` ที่อัปโหลดโดย GitHub Actions run อื่นซ้ำ

`OpenClaw Release Checks` รัน Package Acceptance ด้วย `source=artifact`,
prepared release package artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` Package Acceptance รักษา migration, update,
configured-auth update restart, stale plugin dependency cleanup, offline plugin
fixtures, plugin update และ Telegram package QA กับ tarball ที่ resolve แล้วชุดเดียวกัน
Blocking release checks ใช้ baseline ของ latest published package ตาม default;
`run_release_soak=true` หรือ
`release_profile=full` ขยายเป็น baseline npm-published แบบ stable ทุกตัวตั้งแต่
`2026.4.23` ถึง `latest` รวมถึง fixtures ของ reported issue ใช้
Package Acceptance ด้วย `source=npm` สำหรับ candidate ที่ shipped แล้ว หรือ
`source=ref`/`source=artifact` สำหรับ tarball npm local ที่มี SHA รองรับก่อน
publish มันเป็นการแทนที่แบบ GitHub-native
สำหรับ package/update coverage ส่วนใหญ่ที่ก่อนหน้านี้ต้องใช้
Parallels Cross-OS release checks ยังคงสำคัญสำหรับ onboarding,
installer และ platform behavior ที่เฉพาะ OS แต่ product validation ของ package/update ควร
ให้ความสำคัญกับ Package Acceptance

checklist หลักสำหรับ update และ plugin validation คือ
[การทดสอบอัปเดตและ plugins](/th/help/testing-updates-plugins) ใช้ checklist นี้เมื่อ
ตัดสินใจว่า lane แบบ local, Docker, Package Acceptance หรือ release-check ใดพิสูจน์
plugin install/update, doctor cleanup หรือ published-package migration change
การ migrate update แบบ exhaustive จาก package stable ทุกตัวตั้งแต่ `2026.4.23+`
เป็น workflow `Update Migration` แบบ manual แยกต่างหาก ไม่ใช่ส่วนหนึ่งของ Full Release CI

ความผ่อนปรนสำหรับ package-acceptance แบบเดิมถูกจำกัดเวลาไว้อย่างตั้งใจ แพ็กเกจจนถึง
`2026.4.25` อาจใช้เส้นทางความเข้ากันได้สำหรับช่องว่างของเมทาดาทาที่เผยแพร่ไปยัง
npm แล้ว ได้แก่ รายการคลัง QA แบบส่วนตัวที่หายไปจาก tarball, ไม่มี
`gateway install --wrapper`, ไม่มีไฟล์แพตช์ในฟิกซ์เจอร์ git ที่ได้จาก tarball,
ไม่มี `update.channel` ที่คงไว้ถาวร, ตำแหน่ง install-record ของ Plugin แบบเดิม,
ไม่มีการคงอยู่ถาวรของ install-record สำหรับ marketplace และการย้ายเมทาดาทาคอนฟิก
ระหว่าง `plugins update` แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือน
สำหรับไฟล์ stamp เมทาดาทาของบิลด์ในเครื่องที่จัดส่งไปแล้ว แพ็กเกจหลังจากนั้น
ต้องเป็นไปตามสัญญาแพ็กเกจสมัยใหม่ ช่องว่างเดียวกันเหล่านั้นจะทำให้การตรวจสอบ
รีลีสล้มเหลว

ใช้โปรไฟล์ Package Acceptance ที่กว้างขึ้นเมื่อคำถามเกี่ยวกับรีลีสเป็นเรื่องของ
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

- `smoke`: เลนติดตั้งแพ็กเกจ/ช่องทาง/เอเจนต์, เครือข่าย Gateway และโหลดคอนฟิกใหม่แบบเร็ว
- `package`: สัญญาแพ็กเกจ install/update/restart/plugin โดยไม่มี ClawHub แบบ live; นี่คือค่าเริ่มต้นของ release-check
- `product`: `package` รวมกับช่องทาง MCP, การล้าง cron/subagent, การค้นหาเว็บ OpenAI และ OpenWebUI
- `full`: ชิ้นส่วน release-path ของ Docker พร้อม OpenWebUI
- `custom`: รายการ `docker_lanes` ที่แน่นอนสำหรับการรันซ้ำแบบเฉพาะจุด

สำหรับหลักฐาน Telegram ของ package-candidate ให้เปิดใช้ `telegram_mode=mock-openai` หรือ
`telegram_mode=live-frontier` บน Package Acceptance workflow จะส่ง tarball
`package-under-test` ที่ resolve แล้วเข้าไปในเลน Telegram ส่วน workflow Telegram
แบบสแตนด์อโลนยังรับสเปก npm ที่เผยแพร่แล้วสำหรับการตรวจหลังเผยแพร่

## ระบบอัตโนมัติสำหรับเผยแพร่รีลีส

`OpenClaw Release Publish` เป็นจุดเข้าเผยแพร่ที่เปลี่ยนแปลงสถานะตามปกติ โดยจะ
ประสานงาน workflow trusted-publisher ตามลำดับที่รีลีสต้องใช้:

1. Check out tag ของรีลีสและ resolve SHA ของ commit
2. ตรวจสอบว่า tag เข้าถึงได้จาก `main` หรือ `release/*`
3. รัน `pnpm plugins:sync:check`
4. Dispatch `Plugin NPM Release` ด้วย `publish_scope=all-publishable` และ
   `ref=<release-sha>`
5. Dispatch `Plugin ClawHub Release` ด้วย scope และ SHA เดียวกัน
6. Dispatch `OpenClaw NPM Release` ด้วย tag ของรีลีส, npm dist-tag และ
   `preflight_run_id` ที่บันทึกไว้

ตัวอย่างเผยแพร่ Beta:

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

การโปรโมต Stable ตรงไปยัง `latest` ต้องระบุอย่างชัดเจน:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

ใช้ workflow ระดับล่าง `Plugin NPM Release` และ `Plugin ClawHub Release`
เฉพาะสำหรับงานซ่อมหรือเผยแพร่ซ้ำแบบเฉพาะจุด สำหรับการซ่อม Plugin ที่เลือก ให้ส่ง
`plugin_publish_scope=selected` และ `plugins=@openclaw/name` ไปยัง
`OpenClaw Release Publish` หรือ dispatch workflow ลูกโดยตรงเมื่อไม่ควรเผยแพร่
แพ็กเกจ OpenClaw

## อินพุต workflow ของ NPM

`OpenClaw NPM Release` รับอินพุตที่ควบคุมโดยผู้ปฏิบัติงานเหล่านี้:

- `tag`: tag รีลีสที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1` หรือ
  `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` อาจเป็น SHA commit แบบเต็ม
  40 อักขระของ workflow-branch ปัจจุบันสำหรับ preflight เพื่อการตรวจสอบเท่านั้นได้ด้วย
- `preflight_only`: `true` สำหรับตรวจสอบ/บิลด์/แพ็กเกจเท่านั้น, `false` สำหรับ
  เส้นทางเผยแพร่จริง
- `preflight_run_id`: จำเป็นบนเส้นทางเผยแพร่จริง เพื่อให้ workflow ใช้ tarball
  ที่เตรียมไว้จาก preflight run ที่สำเร็จซ้ำ
- `npm_dist_tag`: tag เป้าหมายของ npm สำหรับเส้นทางเผยแพร่; ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Publish` รับอินพุตที่ควบคุมโดยผู้ปฏิบัติงานเหล่านี้:

- `tag`: tag รีลีสที่จำเป็น; ต้องมีอยู่แล้ว
- `preflight_run_id`: id ของ preflight run `OpenClaw NPM Release` ที่สำเร็จ;
  จำเป็นเมื่อ `publish_openclaw_npm=true`
- `npm_dist_tag`: tag เป้าหมายของ npm สำหรับแพ็กเกจ OpenClaw
- `plugin_publish_scope`: ค่าเริ่มต้นคือ `all-publishable`; ใช้ `selected` เฉพาะ
  สำหรับงานซ่อมแบบเฉพาะจุด
- `plugins`: ชื่อแพ็กเกจ `@openclaw/*` คั่นด้วยจุลภาค เมื่อ
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: ค่าเริ่มต้นคือ `true`; ตั้งเป็น `false` เฉพาะเมื่อใช้
  workflow เป็นตัวประสานงานซ่อมเฉพาะ Plugin เท่านั้น

`OpenClaw Release Checks` รับอินพุตที่ควบคุมโดยผู้ปฏิบัติงานเหล่านี้:

- `ref`: branch, tag หรือ SHA commit แบบเต็มที่จะตรวจสอบ การตรวจที่มี secret
  กำหนดให้ commit ที่ resolve แล้วต้องเข้าถึงได้จาก branch ของ OpenClaw หรือ
  tag รีลีส
- `run_release_soak`: เลือกเข้าร่วม soak แบบ exhaustive live/E2E, Docker release-path
  และ all-since upgrade-survivor บน release checks แบบ stable/default ค่านี้ถูกบังคับเปิด
  โดย `release_profile=full`

กฎ:

- tag แบบ Stable และ correction อาจเผยแพร่ไปยัง `beta` หรือ `latest` ได้
- tag prerelease แบบ Beta เผยแพร่ได้เฉพาะไปยัง `beta`
- สำหรับ `OpenClaw NPM Release` อนุญาตให้ใช้อินพุต SHA commit แบบเต็มเฉพาะเมื่อ
  `preflight_only=true`
- `OpenClaw Release Checks` และ `Full Release Validation` เป็นการตรวจสอบเท่านั้นเสมอ
- เส้นทางเผยแพร่จริงต้องใช้ `npm_dist_tag` เดียวกับที่ใช้ระหว่าง preflight;
  workflow จะตรวจสอบเมทาดาทานั้นก่อนเผยแพร่ต่อ

## ลำดับรีลีส npm แบบ Stable

เมื่อออกรีลีส npm แบบ stable:

1. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนมี tag คุณอาจใช้ SHA commit แบบเต็มของ workflow-branch ปัจจุบันสำหรับ dry run
     ของ workflow preflight เพื่อการตรวจสอบเท่านั้น
2. เลือก `npm_dist_tag=beta` สำหรับ flow ปกติแบบ beta-first หรือ `latest` เฉพาะ
   เมื่อคุณตั้งใจเผยแพร่ stable โดยตรง
3. รัน `Full Release Validation` บน release branch, release tag หรือ SHA commit แบบเต็ม
   เมื่อคุณต้องการ CI ปกติรวมกับความครอบคลุมของ live prompt cache, Docker, QA Lab,
   Matrix และ Telegram จาก workflow แบบ manual เดียว
4. หากคุณตั้งใจต้องการเฉพาะกราฟทดสอบปกติแบบกำหนดตายตัว ให้รัน workflow `CI`
   แบบ manual บน release ref แทน
5. บันทึก `preflight_run_id` ที่สำเร็จ
6. รัน `OpenClaw Release Publish` ด้วย `tag` เดียวกัน, `npm_dist_tag` เดียวกัน
   และ `preflight_run_id` ที่บันทึกไว้; workflow นี้จะเผยแพร่ Plugin ที่ externalized
   ไปยัง npm และ ClawHub ก่อนโปรโมตแพ็กเกจ npm ของ OpenClaw
7. หากรีลีสลงบน `beta` ให้ใช้ workflow ส่วนตัว
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   เพื่อโปรโมตเวอร์ชัน stable นั้นจาก `beta` ไปยัง `latest`
8. หากรีลีสตั้งใจเผยแพร่ตรงไปยัง `latest` และ `beta` ควรตามไปใช้บิลด์ stable
   เดียวกันทันที ให้ใช้ workflow ส่วนตัวเดียวกันนั้นเพื่อชี้ dist-tag ทั้งสองไปยัง
   เวอร์ชัน stable หรือปล่อยให้การซิงก์ self-healing ตามกำหนดเวลาย้าย `beta` ภายหลัง

การเปลี่ยน dist-tag อยู่ใน repo ส่วนตัวเพื่อความปลอดภัย เพราะยังต้องใช้
`NPM_TOKEN` ในขณะที่ repo สาธารณะคงการเผยแพร่แบบ OIDC-only ไว้

สิ่งนี้ทำให้ทั้งเส้นทางเผยแพร่โดยตรงและเส้นทางโปรโมตแบบ beta-first ถูกบันทึกไว้
ในเอกสารและผู้ปฏิบัติงานมองเห็นได้

หากผู้ดูแลต้อง fallback ไปใช้การยืนยันตัวตน npm ในเครื่อง ให้รันคำสั่ง 1Password
CLI (`op`) ใด ๆ เฉพาะใน tmux session เฉพาะเท่านั้น อย่าเรียก `op`
โดยตรงจาก shell หลักของเอเจนต์ การเก็บไว้ใน tmux ทำให้ prompt,
alert และการจัดการ OTP สังเกตได้ และป้องกัน host alert ซ้ำ ๆ

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

ผู้ดูแลใช้เอกสารรีลีสส่วนตัวใน
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
สำหรับ runbook จริง

## ที่เกี่ยวข้อง

- [ช่องทางรีลีส](/th/install/development-channels)
