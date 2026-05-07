---
read_when:
    - กำลังมองหาคำจำกัดความของช่องทางเผยแพร่สาธารณะ
    - การเรียกใช้การตรวจสอบความถูกต้องของรุ่นเผยแพร่หรือการยอมรับแพ็กเกจ
    - กำลังค้นหาการตั้งชื่อเวอร์ชันและรอบการเผยแพร่
summary: เลนการเผยแพร่ รายการตรวจสอบสำหรับผู้ปฏิบัติงาน กล่องตรวจสอบความถูกต้อง การตั้งชื่อเวอร์ชัน และรอบการเผยแพร่
title: นโยบายการเผยแพร่
x-i18n:
    generated_at: "2026-05-07T15:08:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6843c7bd0d0a4f3815661f7d392ae7e60b0485a03f1cc53a4c3f13ad3e9a5f8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw มีแทร็กการเผยแพร่สาธารณะสามแทร็ก:

- เสถียร: รุ่นเผยแพร่ที่ติดแท็ก ซึ่งเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อมีการร้องขออย่างชัดเจน
- เบต้า: แท็กก่อนเผยแพร่ที่เผยแพร่ไปยัง npm `beta`
- พัฒนา: จุดปลายที่เปลี่ยนแปลงของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันรุ่นเผยแพร่เสถียร: `YYYY.M.D`
  - แท็ก Git: `vYYYY.M.D`
- เวอร์ชันรุ่นแก้ไขเสถียร: `YYYY.M.D-N`
  - แท็ก Git: `vYYYY.M.D-N`
- เวอร์ชันก่อนเผยแพร่เบต้า: `YYYY.M.D-beta.N`
  - แท็ก Git: `vYYYY.M.D-beta.N`
- อย่าเติมศูนย์นำหน้าเดือนหรือวัน
- `latest` หมายถึงรุ่นเผยแพร่ npm เสถียรที่โปรโมตอยู่ในปัจจุบัน
- `beta` หมายถึงเป้าหมายการติดตั้งเบต้าปัจจุบัน
- รุ่นเผยแพร่เสถียรและรุ่นแก้ไขเสถียรเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น; ผู้ปฏิบัติการเผยแพร่สามารถกำหนดเป้าหมายเป็น `latest` อย่างชัดเจน หรือโปรโมตบิลด์เบต้าที่ตรวจสอบแล้วภายหลัง
- รุ่นเผยแพร่ OpenClaw เสถียรทุกครั้งจะจัดส่งแพ็กเกจ npm และแอป macOS พร้อมกัน;
  รุ่นเบต้าปกติตรวจสอบและเผยแพร่เส้นทาง npm/package ก่อน โดยสงวน
  การ build/sign/notarize แอป Mac ไว้สำหรับรุ่นเสถียร เว้นแต่จะมีการร้องขออย่างชัดเจน

## จังหวะการเผยแพร่

- การเผยแพร่จะเริ่มจากเบต้าก่อน
- รุ่นเสถียรจะตามมาหลังจากตรวจสอบเบต้าล่าสุดแล้วเท่านั้น
- โดยปกติ Maintainer จะตัดรุ่นจากสาขา `release/YYYY.M.D` ที่สร้าง
  จาก `main` ปัจจุบัน เพื่อให้การตรวจสอบและการแก้ไขการเผยแพร่ไม่บล็อกการพัฒนาใหม่
  บน `main`
- หากแท็กเบต้าถูกพุชหรือเผยแพร่แล้วและต้องการการแก้ไข Maintainer จะตัด
  แท็ก `-beta.N` ถัดไปแทนการลบหรือสร้างแท็กเบต้าเก่าขึ้นใหม่
- ขั้นตอนการเผยแพร่โดยละเอียด การอนุมัติ ข้อมูลประจำตัว และบันทึกการกู้คืน
  จำกัดเฉพาะ Maintainer เท่านั้น

## เช็กลิสต์ผู้ปฏิบัติการเผยแพร่

เช็กลิสต์นี้คือโครงร่างสาธารณะของโฟลว์การเผยแพร่ ข้อมูลประจำตัวส่วนตัว
การลงนาม การ notarization การกู้คืน dist-tag และรายละเอียดการย้อนกลับฉุกเฉินจะอยู่ใน
คู่มือการเผยแพร่ที่จำกัดเฉพาะ Maintainer เท่านั้น

1. เริ่มจาก `main` ปัจจุบัน: ดึงล่าสุด ยืนยันว่า commit เป้าหมายถูกพุชแล้ว
   และยืนยันว่า CI ของ `main` ปัจจุบันเขียวเพียงพอที่จะสร้างสาขาจากมัน
2. เขียนส่วนบนสุดของ `CHANGELOG.md` ใหม่จากประวัติ commit จริงด้วย
   `/changelog` ทำให้รายการเป็นเนื้อหาสำหรับผู้ใช้ commit พุช และ rebase/pull
   อีกครั้งก่อนสร้างสาขา
3. ตรวจสอบระเบียนความเข้ากันได้ของการเผยแพร่ใน
   `src/plugins/compat/registry.ts` และ
   `src/commands/doctor/shared/deprecation-compat.ts` ลบความเข้ากันได้ที่หมดอายุ
   เฉพาะเมื่อเส้นทางอัปเกรดยังครอบคลุมอยู่ หรือบันทึกเหตุผลว่าทำไมจึง
   ตั้งใจคงไว้
4. สร้าง `release/YYYY.M.D` จาก `main` ปัจจุบัน; อย่าทำงานเผยแพร่ตามปกติ
   โดยตรงบน `main`
5. เพิ่มเวอร์ชันในทุกตำแหน่งที่จำเป็นสำหรับแท็กที่ต้องการ จากนั้นรัน
   `pnpm release:prep` คำสั่งนี้จะรีเฟรชเวอร์ชัน Plugin, คลังรายการ Plugin, สคีมา config,
   metadata config ของช่องทางที่รวมมา, baseline เอกสาร config, export ของ Plugin SDK
   และ baseline API ของ Plugin SDK ตามลำดับที่ถูกต้อง commit drift ที่สร้างขึ้น
   ก่อนติดแท็ก จากนั้นรัน preflight แบบ deterministic ภายในเครื่อง:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` และ `pnpm release:check`
6. รัน `OpenClaw NPM Release` โดยตั้ง `preflight_only=true` ก่อนมีแท็ก
   อนุญาตให้ใช้ SHA เต็ม 40 อักขระของสาขาเผยแพร่สำหรับ preflight
   เพื่อการตรวจสอบเท่านั้น บันทึก `preflight_run_id` ที่สำเร็จไว้
7. เริ่มการทดสอบก่อนเผยแพร่ทั้งหมดด้วย `Full Release Validation` สำหรับ
   สาขาเผยแพร่ แท็ก หรือ commit SHA แบบเต็ม นี่คือ entrypoint แบบ manual เดียว
   สำหรับกล่องทดสอบการเผยแพร่ขนาดใหญ่สี่รายการ: Vitest, Docker, QA Lab และ Package
8. หากการตรวจสอบล้มเหลว ให้แก้ไขบนสาขาเผยแพร่และรันซ้ำเฉพาะไฟล์ แทร็ก งาน workflow,
   โปรไฟล์ package, provider หรือ allowlist ของ model ที่ล้มเหลวและเล็กที่สุด
   ซึ่งพิสูจน์การแก้ไขได้ รัน umbrella เต็มอีกครั้งเฉพาะเมื่อพื้นผิวที่เปลี่ยนทำให้
   หลักฐานก่อนหน้าไม่สดใหม่แล้ว
9. สำหรับเบต้า ให้ติดแท็ก `vYYYY.M.D-beta.N` จากนั้นรัน `OpenClaw Release Publish` จาก
   สาขา `release/YYYY.M.D` ที่ตรงกัน คำสั่งนี้ตรวจสอบ `pnpm plugins:sync:check`,
   dispatch แพ็กเกจ Plugin ที่เผยแพร่ได้ทั้งหมดไปยัง npm และชุดเดียวกันไปยัง
   ClawHub แบบขนาน แล้วโปรโมต artifact preflight ของ OpenClaw npm ที่เตรียมไว้
   ด้วย dist-tag ที่ตรงกันทันทีที่การเผยแพร่ Plugin npm สำเร็จ การเผยแพร่ ClawHub
   อาจยังทำงานอยู่ในขณะที่ OpenClaw npm เผยแพร่ แต่ workflow การเผยแพร่จะแสดง
   ID ของ run ลูกทันที ตามค่าเริ่มต้นจะไม่รอ ClawHub หลังจาก dispatch แล้ว ดังนั้น
   ความพร้อมใช้งานของ OpenClaw npm จะไม่ถูกบล็อกโดยการอนุมัติ ClawHub หรือการทำงาน
   registry ที่ช้ากว่า; ตั้ง `wait_for_clawhub=true` เมื่อ ClawHub ต้องบล็อกการเสร็จสิ้น
   ของ workflow เส้นทาง ClawHub จะ retry ความล้มเหลวชั่วคราวในการติดตั้ง dependency ของ CLI,
   เผยแพร่ Plugin ที่ผ่าน preview แม้เมื่อ preview cell หนึ่ง flake และจบด้วย
   การตรวจสอบ registry สำหรับเวอร์ชัน Plugin ทุกตัวที่คาดไว้ เพื่อให้การเผยแพร่บางส่วน
   ยังคงมองเห็นได้และ retry ได้ หลังเผยแพร่ ให้รัน
   package acceptance หลังเผยแพร่
   กับแพ็กเกจ `openclaw@YYYY.M.D-beta.N` หรือ
   `openclaw@beta` ที่เผยแพร่แล้ว หากรุ่นก่อนเผยแพร่ที่ถูกพุชหรือเผยแพร่แล้วต้องการการแก้ไข
   ให้ตัดหมายเลขก่อนเผยแพร่ถัดไปที่ตรงกัน; อย่าลบหรือเขียนรุ่นก่อนเผยแพร่เก่าใหม่
10. สำหรับรุ่นเสถียร ให้ดำเนินต่อเฉพาะหลังจากเบต้าหรือ release candidate ที่ตรวจสอบแล้วมี
    หลักฐานการตรวจสอบที่จำเป็น การเผยแพร่ npm เสถียรจะผ่าน
    `OpenClaw Release Publish` เช่นกัน โดยใช้ artifact preflight ที่สำเร็จซ้ำผ่าน
    `preflight_run_id`; ความพร้อมของการเผยแพร่ macOS เสถียรยังต้องมี
    `.zip`, `.dmg`, `.dSYM.zip` ที่แพ็กแล้ว และ `appcast.xml` ที่อัปเดตบน `main`
11. หลังเผยแพร่ ให้รันตัวตรวจสอบ npm หลังเผยแพร่, E2E Telegram แบบ standalone
    จาก published-npm ที่เป็นทางเลือกเมื่อคุณต้องการหลักฐานช่องทางหลังเผยแพร่,
    การโปรโมต dist-tag เมื่อจำเป็น, บันทึก GitHub release/prerelease จากส่วน
    `CHANGELOG.md` ที่ตรงกันแบบครบถ้วน และขั้นตอนการประกาศการเผยแพร่

## Preflight การเผยแพร่

- รัน `pnpm check:test-types` ก่อน release preflight เพื่อให้ TypeScript ของเทสต์ยังคง
  ได้รับการครอบคลุมนอก gate `pnpm check` แบบ local ที่เร็วกว่า
- รัน `pnpm check:architecture` ก่อน release preflight เพื่อให้การตรวจสอบ import
  cycle และ architecture boundary ที่กว้างขึ้นผ่านเป็นสีเขียวนอก gate local ที่เร็วกว่า
- รัน `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้ release artifact
  `dist/*` ที่คาดไว้และบันเดิล Control UI มีอยู่สำหรับขั้นตอนตรวจสอบ pack
- รัน `pnpm release:prep` หลังจาก bump เวอร์ชัน root และก่อน tagging คำสั่งนี้
  รัน release generator แบบ deterministic ทุกตัวที่มัก drift หลังจากการเปลี่ยน
  version/config/API: เวอร์ชัน Plugin, inventory ของ Plugin, base config
  schema, metadata ของ bundled channel config, baseline ของ config docs, export ของ plugin SDK
  และ baseline ของ plugin SDK API `pnpm release:check` จะรัน guard เหล่านั้นซ้ำ
  ในโหมด check และรายงาน generated drift failure ทุกตัวที่พบในรอบเดียว
  ก่อนรัน package release checks
- รัน workflow แบบ manual `Full Release Validation` ก่อนอนุมัติ release เพื่อ
  เริ่ม test box ก่อน release ทั้งหมดจาก entrypoint เดียว รองรับ branch,
  tag หรือ full commit SHA, dispatch `CI` แบบ manual และ dispatch
  `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, cross-OS
  package checks, QA Lab parity, Matrix และ lane ของ Telegram การรัน stable/default
  จะเก็บ live/E2E แบบ exhaustive และ Docker release-path soak ไว้หลัง
  `run_release_soak=true`; `release_profile=full` จะบังคับเปิด soak เมื่อใช้
  `release_profile=full` และ `rerun_group=all` จะรัน package Telegram
  E2E กับ artifact `release-package-under-test` จาก release checks ด้วย
  ระบุ `npm_telegram_package_spec` หลัง publish เมื่อ Telegram E2E ชุดเดียวกัน
  ควรพิสูจน์ npm package ที่ publish แล้วด้วย ระบุ
  `package_acceptance_package_spec` หลัง publish เมื่อ Package Acceptance
  ควรรัน matrix package/update กับ npm package ที่ส่งมอบแล้วแทน
  artifact ที่ build จาก SHA ระบุ
  `evidence_package_spec` เมื่อรายงาน private evidence ควรพิสูจน์ว่า
  validation ตรงกับ npm package ที่ publish แล้วโดยไม่บังคับ Telegram E2E
  ตัวอย่าง:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- รัน workflow แบบ manual `Package Acceptance` เมื่อต้องการหลักฐาน side-channel
  สำหรับ package candidate ระหว่างที่งาน release ยังดำเนินต่อ ใช้ `source=npm` สำหรับ
  `openclaw@beta`, `openclaw@latest` หรือ release version แบบ exact; `source=ref`
  เพื่อ pack branch/tag/SHA `package_ref` ที่เชื่อถือได้ด้วย harness
  `workflow_ref` ปัจจุบัน; `source=url` สำหรับ HTTPS tarball พร้อม
  SHA-256 ที่จำเป็น; หรือ `source=artifact` สำหรับ tarball ที่ upload โดย GitHub
  Actions run อื่น workflow จะ resolve candidate เป็น
  `package-under-test`, reuse Docker E2E release scheduler กับ tarball นั้น
  และสามารถรัน Telegram QA กับ tarball เดียวกันด้วย
  `telegram_mode=mock-openai` หรือ `telegram_mode=live-frontier` เมื่อ
  lane Docker ที่เลือกมี `published-upgrade-survivor` artifact ของ package
  คือ candidate และ `published_upgrade_survivor_baseline` จะเลือก
  baseline ที่ publish แล้ว `update-restart-auth` ใช้ candidate package เป็น
  ทั้ง CLI ที่ติดตั้งและ package-under-test เพื่อให้ทดสอบเส้นทาง managed restart
  ของคำสั่ง update ของ candidate
  ตัวอย่าง: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  โปรไฟล์ทั่วไป:
  - `smoke`: lane install/channel/agent, gateway network และ config reload
  - `package`: lane package/update/restart/plugin ที่อิง artifact โดยตรง โดยไม่มี OpenWebUI หรือ live ClawHub
  - `product`: โปรไฟล์ package พร้อม MCP channels, การ cleanup Cron/subagent,
    การค้นหาเว็บของ OpenAI และ OpenWebUI
  - `full`: chunk Docker release-path พร้อม OpenWebUI
  - `custom`: การเลือก `docker_lanes` แบบ exact สำหรับ rerun ที่เจาะจง
- รัน workflow แบบ manual `CI` โดยตรงเมื่อคุณต้องการเฉพาะ coverage ของ CI
  ปกติแบบเต็มสำหรับ release candidate การ dispatch CI แบบ manual จะ bypass
  changed scoping และบังคับ lane Linux Node shards, bundled-plugin shards, channel
  contracts, Node 22 compatibility, `check`, `check-additional`, build smoke,
  docs checks, Python skills, Windows, macOS, Android และ Control UI i18n
  ตัวอย่าง: `gh workflow run ci.yml --ref release/YYYY.M.D`
- รัน `pnpm qa:otel:smoke` เมื่อตรวจสอบ telemetry ของ release คำสั่งนี้จะทดสอบ
  QA-lab ผ่าน receiver OTLP/HTTP แบบ local และตรวจสอบชื่อ trace
  span ที่ export, attribute ที่มีขอบเขต และการ redact content/identifier โดยไม่
  ต้องใช้ Opik, Langfuse หรือ collector ภายนอกอื่น
- รัน `pnpm release:check` ก่อน tagged release ทุกครั้ง
- รัน `OpenClaw Release Publish` สำหรับลำดับ publish ที่มีการเปลี่ยนแปลงหลังจาก
  tag มีอยู่แล้ว Dispatch จาก `release/YYYY.M.D` (หรือ `main` เมื่อ publish
  tag ที่ main เข้าถึงได้), ส่ง release tag และ `preflight_run_id` ของ OpenClaw npm
  ที่สำเร็จ และคง default plugin publish scope
  `all-publishable` ไว้ เว้นแต่ตั้งใจรันการซ่อมแซมแบบเจาะจง workflow จะ serialize
  plugin npm publish, plugin ClawHub publish และ OpenClaw
  npm publish เพื่อไม่ให้ core package ถูก publish ก่อน Plugin ภายนอกของมัน
- Release checks ตอนนี้รันใน workflow แบบ manual แยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรัน lane QA Lab mock parity พร้อมโปรไฟล์
  live Matrix แบบเร็วและ lane Telegram QA ก่อนอนุมัติ release lane แบบ live
  ใช้ environment `qa-live-shared`; Telegram ยังใช้ credential lease ของ Convex CI
  ด้วย รัน workflow แบบ manual `QA-Lab - All Lanes` ด้วย
  `matrix_profile=all` และ `matrix_shards=true` เมื่อคุณต้องการ inventory ของ Matrix
  transport, media และ E2EE แบบเต็มพร้อมกัน
- การตรวจสอบ runtime สำหรับการติดตั้งและ upgrade ข้าม OS เป็นส่วนหนึ่งของ
  `OpenClaw Release Checks` และ `Full Release Validation` แบบ public ซึ่งเรียก
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` โดยตรง
- การแยกนี้ตั้งใจไว้: ให้เส้นทาง release npm จริงสั้น,
  deterministic และเน้น artifact ขณะที่ live checks ที่ช้ากว่าอยู่ใน
  lane ของตัวเองเพื่อไม่ให้ทำให้ publish ค้างหรือถูกบล็อก
- release checks ที่มี secret ควรถูก dispatch ผ่าน `Full Release
Validation` หรือจาก workflow ref ของ `main`/release เพื่อให้ logic ของ workflow และ
  secrets ยังคงถูกควบคุม
- `OpenClaw Release Checks` รองรับ branch, tag หรือ full commit SHA ตราบใดที่
  commit ที่ resolve แล้วเข้าถึงได้จาก branch หรือ release tag ของ OpenClaw
- validation-only preflight ของ `OpenClaw NPM Release` ยังรองรับ workflow-branch
  commit SHA แบบเต็ม 40 อักขระปัจจุบันโดยไม่ต้องมี pushed tag
- เส้นทาง SHA นั้นเป็น validation-only และไม่สามารถ promote เป็น publish จริงได้
- ในโหมด SHA workflow จะสังเคราะห์ `v<package.json version>` เฉพาะสำหรับ
  การตรวจ metadata ของ package; publish จริงยังต้องใช้ release tag จริง
- workflow ทั้งสองคงเส้นทาง publish และ promotion จริงไว้บน runner ที่ GitHub-hosted
  ขณะที่เส้นทาง validation ที่ไม่เปลี่ยนแปลงสิ่งใดสามารถใช้ runner Blacksmith Linux
  ที่ใหญ่กว่าได้
- workflow นั้นรัน
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ workflow secrets ทั้ง `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- npm release preflight ไม่รอ lane release checks แยกต่างหากอีกต่อไป
- รัน `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือ tag beta/correction ที่ตรงกัน) ก่อนอนุมัติ
- หลัง npm publish ให้รัน
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (หรือเวอร์ชัน beta/correction ที่ตรงกัน) เพื่อตรวจสอบเส้นทาง install จาก registry
  ที่ publish แล้วใน temp prefix ใหม่
- หลัง publish beta ให้รัน `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  เพื่อตรวจสอบ onboarding ของ installed-package, การตั้งค่า Telegram และ Telegram E2E จริง
  กับ npm package ที่ publish แล้วโดยใช้ shared leased Telegram credential
  pool ผู้ดูแลที่รันเฉพาะกิจแบบ local อาจละ Convex vars และส่ง env credentials
  `OPENCLAW_QA_TELEGRAM_*` ทั้งสามตัวโดยตรง
- หากต้องการรัน full post-publish beta smoke จากเครื่องของผู้ดูแล ให้ใช้ `pnpm release:beta-smoke -- --beta betaN` helper จะรัน Parallels npm update/fresh-target validation, dispatch `NPM Telegram Beta E2E`, poll workflow run แบบ exact, download artifact และพิมพ์รายงาน Telegram
- ผู้ดูแลสามารถรัน post-publish check เดียวกันจาก GitHub Actions ผ่าน
  workflow แบบ manual `NPM Telegram Beta E2E` ได้ workflow นี้ตั้งใจให้เป็น manual-only
  และไม่รันทุกครั้งที่ merge
- release automation ของผู้ดูแลตอนนี้ใช้ preflight-then-promote:
  - npm publish จริงต้องผ่าน npm `preflight_run_id` ที่สำเร็จ
  - npm publish จริงต้องถูก dispatch จาก branch `main` หรือ
    `release/YYYY.M.D` เดียวกันกับ preflight run ที่สำเร็จ
  - stable npm releases ตั้งค่า default เป็น `beta`
  - stable npm publish สามารถ target `latest` ได้อย่างชัดเจนผ่าน workflow input
  - การเปลี่ยนแปลง npm dist-tag ที่ใช้ token ตอนนี้อยู่ใน
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    เพื่อความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่
    public repo คงการ publish แบบ OIDC-only
  - public `macOS Release` เป็น validation-only; เมื่อ tag อยู่เฉพาะบน
    release branch แต่ workflow ถูก dispatch จาก `main` ให้ตั้ง
    `public_release_branch=release/YYYY.M.D`
  - private mac publish จริงต้องผ่าน private mac
    `preflight_run_id` และ `validate_run_id` ที่สำเร็จ
  - เส้นทาง publish จริงจะ promote artifact ที่เตรียมไว้แทนการ rebuild
    อีกครั้ง
- สำหรับ stable correction releases เช่น `YYYY.M.D-N` ตัวตรวจสอบ post-publish
  ยังตรวจเส้นทาง upgrade ด้วย temp-prefix เดียวกันจาก `YYYY.M.D` เป็น `YYYY.M.D-N`
  เพื่อไม่ให้ release corrections ปล่อยให้ global install รุ่นเก่าค้างอยู่บน
  base stable payload โดยไม่รู้ตัว
- npm release preflight จะ fail แบบปิด เว้นแต่ tarball มีทั้ง
  `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่าง
  เพื่อไม่ให้เราส่ง dashboard บนเบราว์เซอร์ว่างอีกครั้ง
- การตรวจสอบหลัง publish ยังตรวจว่า entrypoint ของ Plugin ที่ publish แล้วและ
  metadata ของ package มีอยู่ใน layout ของ registry ที่ติดตั้งแล้ว release ที่
  ส่งมอบ runtime payload ของ Plugin ขาดหายจะทำให้ postpublish verifier ล้มเหลวและ
  ไม่สามารถ promote เป็น `latest` ได้
- `pnpm test:install:smoke` ยังบังคับงบ `unpackedSize` ของ npm pack บน
  candidate update tarball เพื่อให้ installer e2e ตรวจพบ pack bloat โดยไม่ตั้งใจ
  ก่อนเส้นทาง release publish
- หากงาน release แตะ CI planning, extension timing manifests หรือ
  extension test matrices ให้ regenerate และ review output matrix
  `plugin-prerelease-extension-shard` ที่ planner เป็นเจ้าของจาก
  `.github/workflows/plugin-prerelease.yml` ก่อนอนุมัติ เพื่อไม่ให้ release notes
  อธิบาย layout ของ CI ที่เก่าแล้ว
- ความพร้อมของ stable macOS release ยังรวม updater surfaces:
  - GitHub release ต้องลงท้ายด้วย `.zip`, `.dmg` และ `.dSYM.zip` ที่ package แล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปยัง stable zip ใหม่หลัง publish
  - app ที่ package แล้วต้องคง bundle id แบบไม่ใช่ debug, URL ของ Sparkle feed
    ที่ไม่ว่าง และ `CFBundleVersion` ที่เท่ากับหรือสูงกว่า canonical Sparkle build floor
    สำหรับ release version นั้น

## test box สำหรับ Release

`Full Release Validation` คือวิธีที่ operator ใช้เริ่มเทสต์ก่อน release ทั้งหมดจาก
entrypoint เดียว สำหรับ pinned commit proof บน branch ที่เคลื่อนไหวเร็ว ให้ใช้
helper เพื่อให้ child workflow ทุกตัวรันจาก branch ชั่วคราวที่ตรึงไว้กับ target
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

helper จะ push `release-ci/<sha>-...`, dispatch `Full Release Validation`
จาก branch นั้นด้วย `ref=<sha>`, ตรวจสอบว่า `headSha` ของ child workflow ทุกตัว
ตรงกับ target จากนั้นลบ branch ชั่วคราว วิธีนี้หลีกเลี่ยงการพิสูจน์
child run ของ `main` ที่ใหม่กว่าโดยไม่ตั้งใจ

สำหรับการตรวจสอบความถูกต้องของ release branch หรือ tag ให้รันจาก workflow
ref `main` ที่เชื่อถือได้ แล้วส่ง release branch หรือ tag เป็น `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

workflow จะ resolve target ref, dispatch `CI` แบบ manual ด้วย
`target_ref=<release-ref>`, dispatch `OpenClaw Release Checks`, เตรียม artifact
หลัก `release-package-under-test` สำหรับการตรวจสอบที่เกี่ยวข้องกับ package และ
dispatch package Telegram E2E แบบ standalone เมื่อ `release_profile=full` ด้วย
`rerun_group=all` หรือเมื่อมีการตั้งค่า `npm_telegram_package_spec` จากนั้น
`OpenClaw Release Checks` จะกระจายไปยัง install smoke, การตรวจสอบ release ข้าม OS, live/E2E Docker
release-path coverage เมื่อเปิดใช้ soak, Package Acceptance พร้อม Telegram
package QA, QA Lab parity, live Matrix และ live Telegram การรันเต็มรูปแบบจะยอมรับได้เฉพาะเมื่อ
summary ของ `Full Release Validation`
แสดงว่า `normal_ci` และ `release_checks` สำเร็จ ในโหมด full/all
child `npm_telegram` ต้องสำเร็จด้วย; นอก full/all จะถูกข้าม
เว้นแต่จะให้ `npm_telegram_package_spec` ที่เผยแพร่แล้ว summary ของ verifier
สุดท้ายมีตารางงานที่ช้าที่สุดสำหรับแต่ละ child run เพื่อให้ release
manager เห็น critical path ปัจจุบันโดยไม่ต้องดาวน์โหลด logs
ดู [การตรวจสอบ release เต็มรูปแบบ](/th/reference/full-release-validation) สำหรับ
stage matrix ฉบับสมบูรณ์, ชื่อ workflow job ที่แน่นอน, ความแตกต่างระหว่าง profile
stable กับ full, artifacts และ focused rerun handles
Child workflows จะถูก dispatch จาก trusted ref ที่รัน `Full Release
Validation` โดยปกติคือ `--ref main` แม้เมื่อ target `ref` ชี้ไปยัง
release branch หรือ tag ที่เก่ากว่า ไม่มี input workflow-ref แยกสำหรับ Full Release Validation;
ให้เลือก trusted harness โดยเลือก workflow run ref
อย่าใช้ `--ref main -f ref=<sha>` เพื่อพิสูจน์ commit ที่แน่นอนบน `main` ที่เคลื่อนที่อยู่;
raw commit SHA ไม่สามารถเป็น workflow dispatch refs ได้ ดังนั้นให้ใช้
`pnpm ci:full-release --sha <sha>` เพื่อสร้าง branch ชั่วคราวที่ pin แล้ว

ใช้ `release_profile` เพื่อเลือกขอบเขต live/provider:

- `minimum`: เส้นทาง OpenAI/core live และ Docker ที่สำคัญต่อ release และเร็วที่สุด
- `stable`: minimum บวก coverage ของ provider/backend แบบ stable สำหรับการอนุมัติ release
- `full`: stable บวก coverage provider/media แบบกว้างสำหรับ advisory

ใช้ `run_release_soak=true` กับ `stable` เมื่อ lane ที่บล็อก release เป็น
สีเขียว และคุณต้องการ live/E2E แบบครอบคลุม, Docker release-path และ
published upgrade-survivor sweep แบบมีขอบเขตก่อน promotion การ sweep นั้นครอบคลุม
package stable สี่รายการล่าสุด บวก baseline ที่ pin ไว้ `2026.4.23` และ `2026.5.2`
บวก coverage `2026.4.15` ที่เก่ากว่า โดยลบ baseline ที่ซ้ำกันออก และ
แยกแต่ละ baseline เป็น Docker runner job ของตัวเอง `full` หมายรวมถึง
`run_release_soak=true`

`OpenClaw Release Checks` ใช้ trusted workflow ref เพื่อ resolve target
ref หนึ่งครั้งเป็น `release-package-under-test` และใช้ artifact นั้นซ้ำใน cross-OS,
Package Acceptance และการตรวจสอบ release-path Docker เมื่อรัน soak วิธีนี้ทำให้
box ที่เกี่ยวข้องกับ package ทั้งหมดใช้ bytes เดียวกัน และหลีกเลี่ยงการ build package ซ้ำ
OpenAI install smoke ข้าม OS ใช้ `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อมีการตั้งค่า
repo/org variable มิฉะนั้นใช้ `openai/gpt-5.4` เพราะ lane นี้กำลัง
พิสูจน์ package install, onboarding, gateway startup และ agent turn แบบ live หนึ่งครั้ง
แทนที่จะ benchmark model default ที่ช้าที่สุด matrix ของ live provider
ที่กว้างกว่ายังคงเป็นจุดสำหรับ coverage เฉพาะ model

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

อย่าใช้ umbrella เต็มรูปแบบเป็น rerun ครั้งแรกหลังจากแก้ไขแบบ focused หาก box หนึ่ง
ล้มเหลว ให้ใช้ child workflow, job, Docker lane, package profile, model
provider หรือ QA lane ที่ล้มเหลวสำหรับ proof ถัดไป รัน umbrella เต็มรูปแบบอีกครั้งเฉพาะเมื่อ
การแก้ไขเปลี่ยน release orchestration ที่ใช้ร่วมกัน หรือทำให้ evidence แบบ all-box ก่อนหน้า
ล้าสมัย verifier สุดท้ายของ umbrella จะตรวจสอบ child workflow run
ids ที่บันทึกไว้อีกครั้ง ดังนั้นหลังจาก rerun child workflow สำเร็จแล้ว ให้ rerun เฉพาะ parent job
`Verify full validation` ที่ล้มเหลว

สำหรับการกู้คืนแบบมีขอบเขต ให้ส่ง `rerun_group` ไปยัง umbrella `all` คือการรัน
release-candidate จริง, `ci` รันเฉพาะ child ของ normal CI, `plugin-prerelease`
รันเฉพาะ child plugin สำหรับ release เท่านั้น, `release-checks` รันทุก release
box และ release groups ที่แคบกว่าคือ `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` และ `npm-telegram`
การ rerun `npm-telegram` แบบ focused ต้องใช้ `npm_telegram_package_spec`; การรัน full/all
ด้วย `release_profile=full` ใช้ release-checks package artifact การ rerun
cross-OS แบบ focused สามารถเพิ่ม `cross_os_suite_filter=windows/packaged-upgrade` หรือ
OS/suite filter อื่นได้ ความล้มเหลวของ QA release-check เป็น advisory; ความล้มเหลวเฉพาะ QA
จะไม่บล็อกการตรวจสอบ release

### Vitest

Vitest box คือ workflow child `CI` แบบ manual Manual CI ตั้งใจ
ข้าม changed scoping และบังคับ normal test graph สำหรับ release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, ความเข้ากันได้กับ Node 22,
`check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android และ Control UI i18n

ใช้ box นี้เพื่อตอบว่า "source tree ผ่านชุดทดสอบ normal เต็มรูปแบบหรือไม่?"
มันไม่เหมือนกับการตรวจสอบ product แบบ release-path evidence ที่ควรเก็บ:

- summary ของ `Full Release Validation` ที่แสดง URL ของ `CI` run ที่ dispatch แล้ว
- `CI` run เป็นสีเขียวบน target SHA ที่แน่นอน
- ชื่อ shard ที่ล้มเหลวหรือช้าจาก CI jobs เมื่อสืบสวน regressions
- artifacts เวลาของ Vitest เช่น `.artifacts/vitest-shard-timings.json` เมื่อ
  run ต้องการการวิเคราะห์ performance

รัน manual CI โดยตรงเฉพาะเมื่อ release ต้องการ normal CI ที่ deterministic แต่
ไม่ต้องการ Docker, QA Lab, live, cross-OS หรือ package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box อยู่ใน `OpenClaw Release Checks` ผ่าน
`openclaw-live-and-e2e-checks-reusable.yml` บวก workflow
`install-smoke` แบบ release-mode มันตรวจสอบ release candidate ผ่าน packaged
Docker environments แทนที่จะเป็นเพียง source-level tests

Release Docker coverage รวมถึง:

- install smoke เต็มรูปแบบพร้อมเปิดใช้ slow Bun global install smoke
- การเตรียม/ใช้ซ้ำ root Dockerfile smoke image ตาม target SHA โดยมี QR,
  root/gateway และ installer/Bun smoke jobs รันเป็น install-smoke
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
- lane ติดตั้ง/ถอนการติดตั้ง bundled plugin ที่แยกไว้
  `bundled-plugin-install-uninstall-0` ถึง
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites และ Docker live model coverage เมื่อ release checks
  รวม live suites

ใช้ Docker artifacts ก่อน rerun scheduler ของ release-path อัปโหลด
`.artifacts/docker-tests/` พร้อม lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON และคำสั่ง rerun สำหรับการกู้คืนแบบ focused
ให้ใช้ `docker_lanes=<lane[,lane]>` บน reusable live/E2E workflow แทนที่จะ
rerun release chunks ทั้งหมด คำสั่ง rerun ที่สร้างขึ้นจะรวม
`package_artifact_run_id` ก่อนหน้าและ input ของ Docker image ที่เตรียมไว้เมื่อมีให้ใช้ เพื่อให้
lane ที่ล้มเหลวสามารถใช้ tarball และ GHCR images เดิมซ้ำได้

### QA Lab

QA Lab box เป็นส่วนหนึ่งของ `OpenClaw Release Checks` ด้วย มันคือ release gate
สำหรับพฤติกรรมแบบ agentic และระดับ channel แยกจาก Vitest และกลไก Docker
package

Release QA Lab coverage รวมถึง:

- mock parity lane ที่เปรียบเทียบ OpenAI candidate lane กับ baseline Opus 4.6
  โดยใช้ agentic parity pack
- fast live Matrix QA profile ที่ใช้ environment `qa-live-shared`
- live Telegram QA lane ที่ใช้ Convex CI credential leases
- `pnpm qa:otel:smoke` เมื่อ release telemetry ต้องการ proof local ที่ชัดเจน

ใช้ box นี้เพื่อตอบว่า "release ทำงานถูกต้องใน QA scenarios และ
live channel flows หรือไม่?" เก็บ artifact URLs สำหรับ parity, Matrix และ Telegram
lanes เมื่ออนุมัติ release Full Matrix coverage ยังคงมีให้ใช้เป็น
manual sharded QA-Lab run แทนที่จะเป็น lane ที่สำคัญต่อ release ตามค่า default

### Package

Package box คือ gate ของ installable-product มันรองรับโดย
`Package Acceptance` และ resolver
`scripts/resolve-openclaw-package-candidate.mjs` resolver ทำให้
candidate เป็นมาตรฐานเป็น tarball `package-under-test` ที่ Docker E2E ใช้, ตรวจสอบ
package inventory, บันทึก package version และ SHA-256 และแยก
workflow harness ref ออกจาก package source ref

แหล่ง candidate ที่รองรับ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` หรือ OpenClaw release
  version ที่แน่นอน
- `source=ref`: pack branch, tag หรือ full commit SHA ของ `package_ref` ที่เชื่อถือได้
  ด้วย harness `workflow_ref` ที่เลือก
- `source=url`: ดาวน์โหลด HTTPS `.tgz` พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: ใช้ `.tgz` ที่อัปโหลดโดย GitHub Actions run อื่นซ้ำ

`OpenClaw Release Checks` รัน Package Acceptance ด้วย `source=artifact`,
prepared release package artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` Package Acceptance เก็บ migration, update,
configured-auth update restart, stale plugin dependency cleanup, offline plugin
fixtures, plugin update และ Telegram package QA เทียบกับ tarball ที่ resolve เดียวกัน
release checks แบบ blocking ใช้ baseline package published ล่าสุดตามค่า default;
`run_release_soak=true` หรือ
`release_profile=full` ขยายเป็น baseline npm-published stable ทุกตัวตั้งแต่
`2026.4.23` ถึง `latest` บวก reported-issue fixtures ใช้
Package Acceptance ด้วย `source=npm` สำหรับ candidate ที่ ship แล้ว หรือ
`source=ref`/`source=artifact` สำหรับ local npm tarball ที่ผูกกับ SHA ก่อน
publish มันคือ replacement แบบ GitHub-native
สำหรับ package/update coverage ส่วนใหญ่ที่ก่อนหน้านี้ต้องใช้
Parallels การตรวจสอบ release ข้าม OS ยังคงสำคัญสำหรับ onboarding, installer และ
พฤติกรรมเฉพาะ platform แต่การตรวจสอบ product ด้าน package/update ควร
เลือกใช้ Package Acceptance

checklist หลักสำหรับการตรวจสอบ update และ plugin คือ
[การทดสอบ updates และ plugins](/th/help/testing-updates-plugins) ใช้มันเมื่อ
ตัดสินใจว่า lane แบบ local, Docker, Package Acceptance หรือ release-check ใดพิสูจน์
การติดตั้ง/update plugin, doctor cleanup หรือการเปลี่ยน migration ของ published-package
การตรวจสอบ migration ของ published update แบบครอบคลุมจาก package stable `2026.4.23+` ทุกตัวเป็น
workflow manual `Update Migration` แยกต่างหาก ไม่ใช่ส่วนหนึ่งของ Full Release CI

การผ่อนปรนแบบเดิมของ package-acceptance ถูกจำกัดเวลาไว้โดยตั้งใจ แพ็กเกจจนถึง
`2026.4.25` อาจใช้เส้นทางความเข้ากันได้สำหรับช่องว่างของเมทาดาทาที่เผยแพร่ไปยัง
npm แล้ว: รายการ inventory ของ QA แบบส่วนตัวที่ขาดหายจาก tarball, ไม่มี
`gateway install --wrapper`, ไม่มีไฟล์แพตช์ใน fixture git ที่ได้จาก tarball,
ไม่มี `update.channel` ที่คงอยู่, ตำแหน่ง install-record ของ Plugin แบบเดิม,
ไม่มีการคงอยู่ของ install-record ของ marketplace และการย้ายเมทาดาทาคอนฟิกระหว่าง
`plugins update` แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ stamp
เมทาดาทาของบิลด์ภายในเครื่องที่เคยถูกส่งออกไปแล้ว แพ็กเกจรุ่นหลังจากนั้นต้องเป็นไปตาม
สัญญาแพ็กเกจแบบสมัยใหม่ ช่องว่างเดียวกันเหล่านั้นจะทำให้การตรวจสอบความถูกต้องของรีลีสล้มเหลว

ใช้โปรไฟล์ Package Acceptance ที่กว้างขึ้นเมื่อคำถามของรีลีสเกี่ยวกับแพ็กเกจที่ติดตั้งได้จริง:

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

- `smoke`: เลนการติดตั้งแพ็กเกจ/ช่องทาง/agent แบบรวดเร็ว, เครือข่าย Gateway และการโหลดคอนฟิกใหม่
- `package`: สัญญาการติดตั้ง/อัปเดต/รีสตาร์ต/แพ็กเกจ Plugin โดยไม่ใช้ ClawHub แบบสด นี่คือค่าเริ่มต้นของ release-check
- `product`: `package` รวมกับช่องทาง MCP, การล้างข้อมูล cron/subagent, การค้นเว็บของ OpenAI และ OpenWebUI
- `full`: ส่วนต่างๆ ของเส้นทางรีลีส Docker พร้อม OpenWebUI
- `custom`: รายการ `docker_lanes` แบบเจาะจงสำหรับการรันซ้ำแบบเฉพาะจุด

สำหรับหลักฐาน Telegram ของ package-candidate ให้เปิดใช้ `telegram_mode=mock-openai` หรือ
`telegram_mode=live-frontier` บน Package Acceptance เวิร์กโฟลว์จะส่ง tarball
`package-under-test` ที่ resolve แล้วเข้าไปในเลน Telegram ส่วนเวิร์กโฟลว์ Telegram
แบบสแตนด์อโลนยังคงรับ spec npm ที่เผยแพร่แล้วสำหรับการตรวจหลังเผยแพร่

## ระบบอัตโนมัติสำหรับเผยแพร่รีลีส

`OpenClaw Release Publish` คือ entrypoint ปกติสำหรับการเผยแพร่ที่เปลี่ยนสถานะได้
โดยจะประสานเวิร์กโฟลว์ trusted-publisher ตามลำดับที่รีลีสต้องการ:

1. เช็กเอาต์แท็กรีลีสและ resolve commit SHA ของแท็กนั้น
2. ตรวจสอบว่าแท็กเข้าถึงได้จาก `main` หรือ `release/*`
3. รัน `pnpm plugins:sync:check`
4. Dispatch `Plugin NPM Release` ด้วย `publish_scope=all-publishable` และ
   `ref=<release-sha>`
5. Dispatch `Plugin ClawHub Release` ด้วย scope และ SHA เดียวกัน
6. Dispatch `OpenClaw NPM Release` ด้วยแท็กรีลีส, npm dist-tag และ
   `preflight_run_id` ที่บันทึกไว้

ตัวอย่างการเผยแพร่เบต้า:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

การเผยแพร่ stable ไปยัง beta dist-tag ค่าเริ่มต้น:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

การโปรโมต stable ไปยัง `latest` โดยตรงต้องระบุอย่างชัดเจน:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

ใช้เวิร์กโฟลว์ระดับล่าง `Plugin NPM Release` และ `Plugin ClawHub Release`
เฉพาะสำหรับงานซ่อมแซมหรือเผยแพร่ซ้ำแบบเฉพาะจุดเท่านั้น สำหรับการซ่อมแซม Plugin
ที่เลือกไว้ ให้ส่ง `plugin_publish_scope=selected` และ `plugins=@openclaw/name` ไปยัง
`OpenClaw Release Publish` หรือ dispatch เวิร์กโฟลว์ลูกโดยตรงเมื่อไม่ควรเผยแพร่แพ็กเกจ
OpenClaw

## อินพุตของเวิร์กโฟลว์ NPM

`OpenClaw NPM Release` รับอินพุตที่ควบคุมโดยผู้ปฏิบัติงานเหล่านี้:

- `tag`: แท็กรีลีสที่ต้องมี เช่น `v2026.4.2`, `v2026.4.2-1` หรือ
  `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` ค่านี้อาจเป็น workflow-branch
  commit SHA แบบเต็ม 40 อักขระปัจจุบันสำหรับ preflight เพื่อการตรวจสอบเท่านั้นได้ด้วย
- `preflight_only`: `true` สำหรับการตรวจสอบ/บิลด์/แพ็กเกจเท่านั้น, `false` สำหรับเส้นทางเผยแพร่จริง
- `preflight_run_id`: จำเป็นบนเส้นทางเผยแพร่จริงเพื่อให้เวิร์กโฟลว์ใช้ tarball
  ที่เตรียมไว้จาก preflight run ที่สำเร็จซ้ำ
- `npm_dist_tag`: แท็กเป้าหมายของ npm สำหรับเส้นทางเผยแพร่ ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Publish` รับอินพุตที่ควบคุมโดยผู้ปฏิบัติงานเหล่านี้:

- `tag`: แท็กรีลีสที่ต้องมี ต้องมีอยู่แล้ว
- `preflight_run_id`: run id ของ preflight `OpenClaw NPM Release` ที่สำเร็จ
  จำเป็นเมื่อ `publish_openclaw_npm=true`
- `npm_dist_tag`: แท็กเป้าหมายของ npm สำหรับแพ็กเกจ OpenClaw
- `plugin_publish_scope`: ค่าเริ่มต้นคือ `all-publishable`; ใช้ `selected` เฉพาะ
  สำหรับงานซ่อมแซมแบบเฉพาะจุด
- `plugins`: ชื่อแพ็กเกจ `@openclaw/*` คั่นด้วยจุลภาคเมื่อ
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: ค่าเริ่มต้นคือ `true`; ตั้งเป็น `false` เฉพาะเมื่อใช้
  เวิร์กโฟลว์เป็นตัวประสานงานการซ่อมแซมเฉพาะ Plugin

`OpenClaw Release Checks` รับอินพุตที่ควบคุมโดยผู้ปฏิบัติงานเหล่านี้:

- `ref`: branch, tag หรือ commit SHA แบบเต็มที่จะตรวจสอบความถูกต้อง การตรวจที่มี secret
  ต้องให้คอมมิตที่ resolve แล้วเข้าถึงได้จาก branch หรือแท็กรีลีสของ OpenClaw
- `run_release_soak`: เลือกใช้ live/E2E แบบครอบคลุม, เส้นทางรีลีส Docker และ
  การ soak upgrade-survivor แบบ all-since บนการตรวจรีลีส stable/default โดยจะถูกบังคับเปิดด้วย
  `release_profile=full`

กฎ:

- แท็ก stable และ correction อาจเผยแพร่ไปยัง `beta` หรือ `latest` ก็ได้
- แท็ก prerelease ของ beta เผยแพร่ได้เฉพาะไปยัง `beta`
- สำหรับ `OpenClaw NPM Release` อินพุต commit SHA แบบเต็มอนุญาตเฉพาะเมื่อ
  `preflight_only=true`
- `OpenClaw Release Checks` และ `Full Release Validation` เป็นการตรวจสอบความถูกต้องเท่านั้นเสมอ
- เส้นทางเผยแพร่จริงต้องใช้ `npm_dist_tag` เดียวกับที่ใช้ระหว่าง preflight
  เวิร์กโฟลว์จะตรวจสอบเมทาดาทานั้นก่อนที่การเผยแพร่จะดำเนินต่อ

## ลำดับการรีลีส npm แบบ stable

เมื่อตัดรีลีส npm แบบ stable:

1. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนมีแท็ก คุณอาจใช้ workflow-branch commit SHA แบบเต็มปัจจุบันสำหรับการ dry run
     ของเวิร์กโฟลว์ preflight เพื่อการตรวจสอบเท่านั้น
2. เลือก `npm_dist_tag=beta` สำหรับโฟลว์ปกติแบบ beta-first หรือ `latest` เฉพาะเมื่อ
   คุณตั้งใจเผยแพร่ stable โดยตรง
3. รัน `Full Release Validation` บน release branch, release tag หรือ commit SHA แบบเต็ม
   เมื่อคุณต้องการ CI ปกติพร้อมความครอบคลุมของ live prompt cache, Docker, QA Lab,
   Matrix และ Telegram จากเวิร์กโฟลว์แบบแมนนวลเดียว
4. หากคุณตั้งใจต้องการเฉพาะกราฟทดสอบปกติที่กำหนดแน่นอน ให้รันเวิร์กโฟลว์ `CI`
   แบบแมนนวลบน release ref แทน
5. บันทึก `preflight_run_id` ที่สำเร็จ
6. รัน `OpenClaw Release Publish` ด้วย `tag` เดียวกัน, `npm_dist_tag` เดียวกัน
   และ `preflight_run_id` ที่บันทึกไว้ โดยจะเผยแพร่ Plugin ที่ externalize แล้วไปยัง npm
   และ ClawHub ก่อนโปรโมตแพ็กเกจ npm ของ OpenClaw
7. หากรีลีสลงที่ `beta` ให้ใช้เวิร์กโฟลว์ส่วนตัว
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   เพื่อโปรโมตเวอร์ชัน stable นั้นจาก `beta` ไปยัง `latest`
8. หากรีลีสตั้งใจเผยแพร่โดยตรงไปยัง `latest` และ `beta` ควรตามบิลด์ stable เดียวกันทันที
   ให้ใช้เวิร์กโฟลว์ส่วนตัวเดียวกันนั้นเพื่อชี้ dist-tag ทั้งคู่ไปยังเวอร์ชัน stable
   หรือปล่อยให้การซิงก์ self-healing ตามกำหนดการย้าย `beta` ในภายหลัง

การเปลี่ยน dist-tag อยู่ใน repo ส่วนตัวด้วยเหตุผลด้านความปลอดภัย เพราะยังต้องใช้
`NPM_TOKEN` ขณะที่ repo สาธารณะคงการเผยแพร่แบบ OIDC-only ไว้

สิ่งนี้ทำให้ทั้งเส้นทางเผยแพร่โดยตรงและเส้นทางโปรโมตแบบ beta-first มีเอกสารกำกับ
และมองเห็นได้สำหรับผู้ปฏิบัติงาน

หาก maintainer จำเป็นต้อง fallback ไปใช้การยืนยันตัวตน npm ภายในเครื่อง ให้รันคำสั่ง
1Password CLI (`op`) เฉพาะภายในเซสชัน tmux เฉพาะเท่านั้น อย่าเรียก `op`
โดยตรงจาก shell หลักของ agent การเก็บไว้ใน tmux ทำให้ prompts, alerts และการจัดการ OTP
สังเกตเห็นได้และป้องกันการแจ้งเตือน host ซ้ำ

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

Maintainer ใช้เอกสารรีลีสส่วนตัวใน
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
สำหรับ runbook จริง

## ที่เกี่ยวข้อง

- [ช่องทางการเผยแพร่](/th/install/development-channels)
