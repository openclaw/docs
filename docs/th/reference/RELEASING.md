---
read_when:
    - กำลังค้นหาคำจำกัดความของช่องทางการเผยแพร่สาธารณะ
    - การรันการตรวจสอบความถูกต้องของรีลีสหรือการยอมรับแพ็กเกจ
    - กำลังมองหาการตั้งชื่อเวอร์ชันและรอบการเผยแพร่
summary: เลนการรีลีส, เช็กลิสต์สำหรับผู้ปฏิบัติการ, กล่องตรวจสอบความถูกต้อง, การตั้งชื่อเวอร์ชัน และรอบการออกเวอร์ชัน
title: นโยบายการเผยแพร่รุ่น
x-i18n:
    generated_at: "2026-05-02T23:39:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba316d1736eae8edd2fb0a71b9a3da345f8895c3b536e9a1f619718ea12fc851
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw มีเลนการเผยแพร่สาธารณะสามเลน:

- stable: รุ่นที่ติดแท็กซึ่งเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อมีการร้องขออย่างชัดเจน
- beta: แท็กก่อนเผยแพร่ที่เผยแพร่ไปยัง npm `beta`
- dev: หัวปัจจุบันที่เคลื่อนไหวของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันรุ่นเสถียร: `YYYY.M.D`
  - แท็ก Git: `vYYYY.M.D`
- เวอร์ชันรุ่นแก้ไขของรุ่นเสถียร: `YYYY.M.D-N`
  - แท็ก Git: `vYYYY.M.D-N`
- เวอร์ชันก่อนเผยแพร่เบต้า: `YYYY.M.D-beta.N`
  - แท็ก Git: `vYYYY.M.D-beta.N`
- อย่าเติมศูนย์นำหน้าสำหรับเดือนหรือวัน
- `latest` หมายถึงรุ่นเสถียร npm ปัจจุบันที่ได้รับการโปรโมตแล้ว
- `beta` หมายถึงเป้าหมายการติดตั้งเบต้าปัจจุบัน
- รุ่นเสถียรและรุ่นแก้ไขของรุ่นเสถียรเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น; ผู้ดำเนินการเผยแพร่สามารถกำหนดเป้าหมายเป็น `latest` ได้อย่างชัดเจน หรือโปรโมตบิลด์เบต้าที่ตรวจสอบแล้วในภายหลัง
- ทุกการเผยแพร่ OpenClaw รุ่นเสถียรจะส่งมอบแพ็กเกจ npm และแอป macOS พร้อมกัน;
  โดยปกติรุ่นเบต้าจะตรวจสอบและเผยแพร่เส้นทาง npm/แพ็กเกจก่อน โดยสงวนการ build/sign/notarize
  แอป Mac ไว้สำหรับรุ่นเสถียร เว้นแต่จะมีการร้องขออย่างชัดเจน

## จังหวะการเผยแพร่

- การเผยแพร่จะดำเนินแบบเบต้าก่อน
- รุ่นเสถียรจะตามมาหลังจากเบต้าล่าสุดผ่านการตรวจสอบแล้วเท่านั้น
- โดยปกติผู้ดูแลจะตัดรุ่นจากกิ่ง `release/YYYY.M.D` ที่สร้างจาก
  `main` ปัจจุบัน เพื่อให้การตรวจสอบการเผยแพร่และการแก้ไขไม่บล็อกการพัฒนาใหม่
  บน `main`
- หากแท็กเบต้าถูก push หรือเผยแพร่แล้วและต้องแก้ไข ผู้ดูแลจะตัดแท็ก
  `-beta.N` ถัดไปแทนการลบหรือสร้างแท็กเบต้าเดิมใหม่
- ขั้นตอนการเผยแพร่โดยละเอียด การอนุมัติ ข้อมูลรับรอง และบันทึกการกู้คืน
  มีไว้สำหรับผู้ดูแลเท่านั้น

## เช็กลิสต์ผู้ดำเนินการเผยแพร่

เช็กลิสต์นี้คือรูปแบบสาธารณะของโฟลว์การเผยแพร่ ข้อมูลรับรองส่วนตัว,
การลงนาม, การ notarization, การกู้คืน dist-tag และรายละเอียดการย้อนกลับฉุกเฉินจะอยู่ใน
runbook การเผยแพร่สำหรับผู้ดูแลเท่านั้น

1. เริ่มจาก `main` ปัจจุบัน: pull ล่าสุด, ยืนยันว่า commit เป้าหมายถูก push แล้ว,
   และยืนยันว่า CI ของ `main` ปัจจุบันเขียวพอที่จะสร้างกิ่งจากจุดนั้นได้
2. เขียนส่วนบนสุดของ `CHANGELOG.md` ใหม่จากประวัติ commit จริงด้วย
   `/changelog`, รักษารายการให้เป็นมุมมองผู้ใช้, commit, push และ rebase/pull
   อีกครั้งก่อนสร้างกิ่ง
3. ตรวจสอบระเบียนความเข้ากันได้ของการเผยแพร่ใน
   `src/plugins/compat/registry.ts` และ
   `src/commands/doctor/shared/deprecation-compat.ts` ลบความเข้ากันได้ที่หมดอายุแล้ว
   เฉพาะเมื่อเส้นทางการอัปเกรดยังคงครอบคลุมอยู่ หรือบันทึกเหตุผลว่าทำไมจึงตั้งใจคงไว้
4. สร้าง `release/YYYY.M.D` จาก `main` ปัจจุบัน; อย่าทำงานเผยแพร่ตามปกติ
   โดยตรงบน `main`
5. เพิ่มเวอร์ชันในทุกตำแหน่งที่จำเป็นสำหรับแท็กที่ตั้งใจไว้, รัน
   `pnpm plugins:sync` เพื่อให้แพ็กเกจ Plugin ที่เผยแพร่ได้ใช้เวอร์ชันการเผยแพร่
   และ metadata ความเข้ากันได้เดียวกัน จากนั้นรัน preflight แบบกำหนดแน่นอนภายในเครื่อง:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` และ
   `pnpm release:check`
6. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true` ก่อนมีแท็ก
   อนุญาตให้ใช้ SHA 40 อักขระแบบเต็มของกิ่งเผยแพร่สำหรับ preflight ที่ใช้ตรวจสอบเท่านั้น
   บันทึก `preflight_run_id` ที่สำเร็จไว้
7. เริ่มการทดสอบก่อนเผยแพร่ทั้งหมดด้วย `Full Release Validation` สำหรับ
   กิ่งเผยแพร่, แท็ก หรือ SHA commit แบบเต็ม นี่คือ entrypoint แบบ manual หนึ่งเดียว
   สำหรับกล่องทดสอบการเผยแพร่ขนาดใหญ่สี่ชุด: Vitest, Docker, QA Lab และ Package
8. หากการตรวจสอบล้มเหลว ให้แก้บนกิ่งเผยแพร่แล้วรันซ้ำเฉพาะไฟล์, เลน,
   งาน workflow, โปรไฟล์แพ็กเกจ, provider หรือรายการอนุญาตของโมเดลที่เล็กที่สุด
   ซึ่งพิสูจน์การแก้ไขได้ รัน umbrella แบบเต็มซ้ำเฉพาะเมื่อพื้นที่ที่เปลี่ยนแปลงทำให้หลักฐานก่อนหน้าไม่สดใหม่แล้ว
9. สำหรับเบต้า ให้แท็ก `vYYYY.M.D-beta.N` แล้วรัน `OpenClaw Release Publish` จาก
   กิ่ง `release/YYYY.M.D` ที่ตรงกัน ขั้นตอนนี้จะตรวจสอบ `pnpm plugins:sync:check`,
   เผยแพร่แพ็กเกจ Plugin ที่เผยแพร่ได้ทั้งหมดไปยัง npm ก่อน, เผยแพร่ชุดเดียวกัน
   ไปยัง ClawHub เป็นลำดับที่สอง แล้วจึงโปรโมตอาร์ติแฟกต์ preflight npm ของ OpenClaw
   ที่เตรียมไว้ด้วย dist-tag ที่ตรงกัน หลังเผยแพร่ ให้รัน package acceptance หลังเผยแพร่
   กับแพ็กเกจ `openclaw@YYYY.M.D-beta.N` หรือ `openclaw@beta` ที่เผยแพร่แล้ว
   หาก prerelease ที่ push หรือเผยแพร่แล้วต้องแก้ไข ให้ตัดหมายเลข prerelease
   ถัดไปที่ตรงกัน; อย่าลบหรือเขียน prerelease เดิมใหม่
10. สำหรับรุ่นเสถียร ให้ดำเนินต่อเฉพาะหลังจากเบต้าที่ตรวจสอบแล้วหรือ release candidate มี
    หลักฐานการตรวจสอบที่จำเป็นแล้ว การเผยแพร่ npm รุ่นเสถียรยังดำเนินผ่าน
    `OpenClaw Release Publish` โดยใช้ซ้ำอาร์ติแฟกต์ preflight ที่สำเร็จผ่าน
    `preflight_run_id`; ความพร้อมของการเผยแพร่ macOS รุ่นเสถียรยังต้องมี
    `.zip`, `.dmg`, `.dSYM.zip` ที่แพ็กแล้ว และ `appcast.xml` ที่อัปเดตบน `main`
11. หลังเผยแพร่ ให้รันตัวตรวจสอบ npm หลังเผยแพร่, E2E Telegram สำหรับ published-npm
    แบบ standalone ที่เป็นตัวเลือกเมื่อคุณต้องการหลักฐานช่องทางหลังเผยแพร่,
    การโปรโมต dist-tag เมื่อจำเป็น, หมายเหตุ GitHub release/prerelease จากส่วน
    `CHANGELOG.md` ที่ตรงกันและครบถ้วน และขั้นตอนการประกาศการเผยแพร่

## preflight การเผยแพร่

- รัน `pnpm check:test-types` ก่อน release preflight เพื่อให้ TypeScript ของ test ยังได้รับการครอบคลุมนอกเหนือจาก gate `pnpm check` แบบ local ที่เร็วกว่า
- รัน `pnpm check:architecture` ก่อน release preflight เพื่อให้การตรวจสอบ import cycle และขอบเขต architecture ที่กว้างขึ้นเป็นสีเขียวนอกเหนือจาก gate แบบ local ที่เร็วกว่า
- รัน `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้ release artifacts `dist/*` ที่คาดไว้และบันเดิล Control UI มีอยู่สำหรับขั้นตอนการตรวจสอบ pack
- รัน `pnpm plugins:sync` หลังจาก bump version ที่ root และก่อน tag คำสั่งนี้จะอัปเดต version ของ package Plugin ที่ publish ได้, metadata ความเข้ากันได้ของ OpenClaw peer/API, build metadata และ changelog stubs ของ Plugin ให้ตรงกับ core release version `pnpm plugins:sync:check` คือ release guard แบบไม่แก้ไขไฟล์; publish workflow จะล้มเหลวก่อนการแก้ไข registry ใด ๆ หากลืมขั้นตอนนี้
- รัน workflow แบบ manual `Full Release Validation` ก่อนการอนุมัติ release เพื่อเริ่ม test box ก่อน release ทั้งหมดจาก entrypoint เดียว รองรับ branch, tag หรือ full commit SHA, dispatch `CI` แบบ manual และ dispatch `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, ชุดทดสอบ Docker release-path, live/E2E, OpenWebUI, QA Lab parity, Matrix และ Telegram lanes เมื่อใช้ `release_profile=full` และ `rerun_group=all` จะรัน package Telegram E2E กับ artifact `release-package-under-test` จาก release checks ด้วย ระบุ `npm_telegram_package_spec` หลัง publish เมื่อ Telegram E2E เดียวกันควรพิสูจน์ npm package ที่ publish แล้วด้วย ระบุ `package_acceptance_package_spec` หลัง publish เมื่อ Package Acceptance ควรรัน package/update matrix กับ npm package ที่ ship แล้วแทน artifact ที่ build จาก SHA ระบุ `evidence_package_spec` เมื่อรายงาน evidence ส่วนตัวควรพิสูจน์ว่า validation ตรงกับ npm package ที่ publish แล้วโดยไม่บังคับ Telegram E2E ตัวอย่าง:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- รัน workflow แบบ manual `Package Acceptance` เมื่อคุณต้องการหลักฐาน side-channel สำหรับ package candidate ระหว่างที่งาน release ยังดำเนินต่อ ใช้ `source=npm` สำหรับ `openclaw@beta`, `openclaw@latest` หรือ release version แบบ exact; ใช้ `source=ref` เพื่อ pack branch/tag/SHA `package_ref` ที่เชื่อถือได้ด้วย harness `workflow_ref` ปัจจุบัน; ใช้ `source=url` สำหรับ HTTPS tarball พร้อม SHA-256 ที่จำเป็น; หรือใช้ `source=artifact` สำหรับ tarball ที่อัปโหลดโดย GitHub Actions run อื่น workflow จะ resolve candidate เป็น `package-under-test`, ใช้ Docker E2E release scheduler ซ้ำกับ tarball นั้น และสามารถรัน Telegram QA กับ tarball เดียวกันด้วย `telegram_mode=mock-openai` หรือ `telegram_mode=live-frontier` เมื่อ Docker lanes ที่เลือกมี `published-upgrade-survivor` artifact ของ package จะเป็น candidate และ `published_upgrade_survivor_baseline` จะเลือก baseline ที่ publish แล้ว
  ตัวอย่าง: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  โปรไฟล์ทั่วไป:
  - `smoke`: lanes สำหรับ install/channel/agent, gateway network และ config reload
  - `package`: lanes สำหรับ package/update/plugin ที่ยึด artifact เป็นหลัก โดยไม่มี OpenWebUI หรือ ClawHub แบบ live
  - `product`: package profile พร้อม MCP channels, cron/subagent cleanup, OpenAI web search และ OpenWebUI
  - `full`: ชิ้นส่วน Docker release-path พร้อม OpenWebUI
  - `custom`: การเลือก `docker_lanes` แบบ exact สำหรับ rerun ที่เจาะจง
- รัน workflow แบบ manual `CI` โดยตรงเมื่อคุณต้องการเพียง coverage CI ปกติแบบเต็มสำหรับ release candidate การ dispatch CI แบบ manual จะข้าม changed scoping และบังคับ lanes สำหรับ Linux Node shards, bundled-plugin shards, channel contracts, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, Android และ Control UI i18n
  ตัวอย่าง: `gh workflow run ci.yml --ref release/YYYY.M.D`
- รัน `pnpm qa:otel:smoke` เมื่อตรวจสอบ release telemetry คำสั่งนี้จะทดสอบ QA-lab ผ่านตัวรับ OTLP/HTTP แบบ local และตรวจสอบชื่อ trace span ที่ export, attributes ที่ถูกจำกัดขอบเขต และการ redact content/identifier โดยไม่ต้องใช้ Opik, Langfuse หรือ collector ภายนอกอื่น
- รัน `pnpm release:check` ก่อนทุก tagged release
- รัน `OpenClaw Release Publish` สำหรับลำดับ publish ที่แก้ไขสถานะ หลังจากมี tag แล้ว Dispatch จาก `release/YYYY.M.D` (หรือ `main` เมื่อ publish tag ที่ reachable จาก main), ส่ง release tag และ `preflight_run_id` ของ OpenClaw npm ที่สำเร็จ และคง scope publish ของ Plugin ค่าเริ่มต้น `all-publishable` เว้นแต่คุณตั้งใจรัน repair ที่เจาะจง workflow จะทำให้ npm publish ของ Plugin, ClawHub publish ของ Plugin และ npm publish ของ OpenClaw ทำงานแบบ serial เพื่อไม่ให้ core package ถูก publish ก่อน plugins ที่ externalized
- Release checks ตอนนี้รันใน workflow แบบ manual แยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรัน QA Lab mock parity lane พร้อม fast live Matrix profile และ Telegram QA lane ก่อนการอนุมัติ release ด้วย live lanes ใช้ environment `qa-live-shared`; Telegram ยังใช้ Convex CI credential leases ด้วย รัน workflow แบบ manual `QA-Lab - All Lanes` ด้วย `matrix_profile=all` และ `matrix_shards=true` เมื่อคุณต้องการ inventory ของ Matrix transport, media และ E2EE แบบเต็มใน parallel
- การตรวจสอบ runtime สำหรับ cross-OS install และ upgrade เป็นส่วนหนึ่งของ `OpenClaw Release Checks` และ `Full Release Validation` สาธารณะ ซึ่งเรียก reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` โดยตรง
- การแยกนี้ตั้งใจทำ: รักษาเส้นทาง npm release จริงให้สั้น กำหนดผลได้แน่นอน และเน้น artifact ขณะที่ live checks ที่ช้ากว่าอยู่ใน lane ของตัวเองเพื่อไม่ให้ publish สะดุดหรือถูกบล็อก
- release checks ที่มี secret ควรถูก dispatch ผ่าน `Full Release Validation` หรือจาก workflow ref `main`/release เพื่อให้ workflow logic และ secrets อยู่ภายใต้การควบคุม
- `OpenClaw Release Checks` รองรับ branch, tag หรือ full commit SHA ตราบใดที่ commit ที่ resolve ได้ reachable จาก branch หรือ release tag ของ OpenClaw
- preflight แบบ validation-only ของ `OpenClaw NPM Release` ยังรองรับ full workflow-branch commit SHA ความยาว 40 ตัวอักษรปัจจุบันโดยไม่ต้องมี pushed tag
- เส้นทาง SHA นั้นเป็น validation-only และไม่สามารถเลื่อนเป็น publish จริงได้
- ในโหมด SHA workflow จะ synthesize `v<package.json version>` เฉพาะสำหรับการตรวจสอบ package metadata เท่านั้น; publish จริงยังต้องใช้ release tag จริง
- ทั้งสอง workflow คงเส้นทาง publish และ promotion จริงไว้บน GitHub-hosted runners ขณะที่เส้นทาง validation ที่ไม่แก้ไขสถานะสามารถใช้ Blacksmith Linux runners ที่ใหญ่กว่าได้
- workflow นั้นรัน
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ workflow secrets ทั้ง `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- npm release preflight ไม่รอ release checks lane แยกต่างหากอีกต่อไป
- รัน `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือ tag beta/correction ที่ตรงกัน) ก่อนการอนุมัติ
- หลัง npm publish ให้รัน
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (หรือ version beta/correction ที่ตรงกัน) เพื่อตรวจสอบเส้นทาง install registry ที่ publish แล้วใน temp prefix ใหม่
- หลัง beta publish ให้รัน `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  เพื่อตรวจสอบ onboarding ของ installed-package, การตั้งค่า Telegram และ Telegram E2E จริงกับ npm package ที่ publish แล้วโดยใช้ pool credential Telegram แบบ leased ที่ใช้ร่วมกัน maintainer ที่รันครั้งเดียวแบบ local อาจละเว้น Convex vars และส่ง env credentials `OPENCLAW_QA_TELEGRAM_*` ทั้งสามตัวโดยตรง
- Maintainers สามารถรัน post-publish check เดียวกันจาก GitHub Actions ผ่าน workflow แบบ manual `NPM Telegram Beta E2E` workflow นี้ตั้งใจให้เป็น manual-only และไม่รันทุกครั้งที่ merge
- release automation ของ maintainer ตอนนี้ใช้ preflight-then-promote:
  - npm publish จริงต้องผ่าน npm `preflight_run_id` ที่สำเร็จ
  - npm publish จริงต้องถูก dispatch จาก branch `main` หรือ `release/YYYY.M.D` เดียวกันกับ preflight run ที่สำเร็จ
  - stable npm releases มีค่าเริ่มต้นเป็น `beta`
  - stable npm publish สามารถ target `latest` โดยชัดเจนผ่าน workflow input
  - การแก้ไข npm dist-tag แบบใช้ token ตอนนี้อยู่ใน
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    เพื่อความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่ repo สาธารณะคง publish แบบ OIDC-only
  - `macOS Release` สาธารณะเป็น validation-only; เมื่อ tag อยู่เฉพาะบน release branch แต่ workflow ถูก dispatch จาก `main` ให้ตั้งค่า `public_release_branch=release/YYYY.M.D`
  - private mac publish จริงต้องผ่าน private mac `preflight_run_id` และ `validate_run_id` ที่สำเร็จ
  - เส้นทาง publish จริงจะ promote artifacts ที่เตรียมไว้แทนการ rebuild อีกครั้ง
- สำหรับ stable correction releases เช่น `YYYY.M.D-N` post-publish verifier ยังตรวจสอบเส้นทาง upgrade ด้วย temp-prefix เดียวกันจาก `YYYY.M.D` เป็น `YYYY.M.D-N` เพื่อให้ release corrections ไม่สามารถปล่อยให้ global installs เก่าค้างอยู่บน payload stable base แบบเงียบ ๆ
- npm release preflight จะ fail แบบปิด เว้นแต่ tarball จะมีทั้ง `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่าง เพื่อไม่ให้เรา ship browser dashboard ที่ว่างเปล่าอีก
- Post-publish verification ยังตรวจสอบว่า entrypoints ของ Plugin ที่ publish แล้วและ package metadata มีอยู่ใน registry layout ที่ install แล้ว release ที่ ship payload runtime ของ Plugin ขาดหายจะทำให้ postpublish verifier ล้มเหลวและไม่สามารถ promote เป็น `latest` ได้
- `pnpm test:install:smoke` ยังบังคับใช้งบประมาณ `unpackedSize` ของ npm pack บน tarball update candidate ดังนั้น installer e2e จะจับ pack bloat ที่ไม่ตั้งใจก่อนเส้นทาง release publish
- หากงาน release แตะ CI planning, extension timing manifests หรือ extension test matrices ให้ regenerate และ review matrix outputs `plugin-prerelease-extension-shard` ที่ planner เป็นเจ้าของจาก `.github/workflows/plugin-prerelease.yml` ก่อนอนุมัติ เพื่อไม่ให้ release notes อธิบาย layout CI ที่ล้าสมัย
- ความพร้อมของ stable macOS release ยังรวมถึง updater surfaces:
  - GitHub release ต้องลงเอยด้วย `.zip`, `.dmg` และ `.dSYM.zip` ที่ package แล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปยัง stable zip ใหม่หลัง publish
  - app ที่ package แล้วต้องคง bundle id ที่ไม่ใช่ debug, Sparkle feed URL ที่ไม่ว่าง และ `CFBundleVersion` ที่เท่ากับหรือสูงกว่า canonical Sparkle build floor สำหรับ release version นั้น

## Release test boxes

`Full Release Validation` คือวิธีที่ operators ใช้เริ่ม pre-release tests ทั้งหมดจาก entrypoint เดียว สำหรับ pinned commit proof บน branch ที่เปลี่ยนเร็ว ให้ใช้ helper เพื่อให้ child workflow ทุกตัวรันจาก temporary branch ที่ตรึงไว้กับ target SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

helper จะ push `release-ci/<sha>-...`, dispatch `Full Release Validation` จาก branch นั้นด้วย `ref=<sha>`, ตรวจสอบว่า `headSha` ของ child workflow ทุกตัวตรงกับ target แล้วลบ temporary branch วิธีนี้หลีกเลี่ยงการพิสูจน์ child run ของ `main` ที่ใหม่กว่าโดยไม่ตั้งใจ

สำหรับการตรวจสอบ release branch หรือ tag ให้รันจาก workflow ref `main` ที่เชื่อถือได้และส่ง release branch หรือ tag เป็น `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

เวิร์กโฟลว์จะแก้ไข ref เป้าหมาย, dispatch `CI` แบบ manual พร้อม
`target_ref=<release-ref>`, dispatch `OpenClaw Release Checks`, และ dispatch
Telegram E2E สำหรับ standalone package เมื่อ `release_profile=full` พร้อม
`rerun_group=all` หรือเมื่อมีการตั้งค่า `npm_telegram_package_spec` จากนั้น `OpenClaw Release
Checks` จะกระจายงานไปยัง install smoke, cross-OS release checks, live/E2E Docker
release-path coverage, Package Acceptance พร้อม Telegram package QA, QA Lab
parity, live Matrix, และ live Telegram การรันแบบเต็มจะยอมรับได้ก็ต่อเมื่อ
สรุป `Full Release Validation`
แสดงว่า `normal_ci` และ `release_checks` สำเร็จ ในโหมด full/all
child `npm_telegram` ต้องสำเร็จด้วยเช่นกัน; นอก full/all จะถูกข้าม
เว้นแต่จะมีการระบุ `npm_telegram_package_spec` ที่เผยแพร่แล้ว สรุป
verifier สุดท้ายมีตารางงานที่ช้าที่สุดสำหรับแต่ละ child run เพื่อให้ผู้จัดการ release
เห็น critical path ปัจจุบันโดยไม่ต้องดาวน์โหลดล็อก
ดู [การตรวจสอบ release แบบเต็ม](/th/reference/full-release-validation) สำหรับ
stage matrix ที่สมบูรณ์, ชื่องานเวิร์กโฟลว์ที่แน่นอน, ความแตกต่างระหว่างโปรไฟล์ stable กับ full,
artifacts, และ handle สำหรับ rerun แบบเจาะจง
Child workflows จะถูก dispatch จาก ref ที่เชื่อถือได้ซึ่งรัน `Full Release
Validation` โดยปกติคือ `--ref main` แม้ว่า target `ref` จะชี้ไปยัง
release branch หรือ tag ที่เก่ากว่า ไม่มี input workflow-ref แยกต่างหากสำหรับ Full Release Validation;
ให้เลือก harness ที่เชื่อถือได้โดยเลือก ref ของ workflow run
อย่าใช้ `--ref main -f ref=<sha>` สำหรับหลักฐาน commit ที่แน่นอนบน `main` ที่เปลี่ยนแปลงได้;
commit SHA แบบ raw ไม่สามารถเป็น workflow dispatch refs ได้ ดังนั้นให้ใช้
`pnpm ci:full-release --sha <sha>` เพื่อสร้าง branch ชั่วคราวที่ pin ไว้

ใช้ `release_profile` เพื่อเลือกขอบเขต live/provider:

- `minimum`: เส้นทาง OpenAI/core live และ Docker ที่สำคัญต่อ release เร็วที่สุด
- `stable`: minimum พร้อม stable provider/backend coverage สำหรับการอนุมัติ release
- `full`: stable พร้อม broad advisory provider/media coverage

`OpenClaw Release Checks` ใช้ trusted workflow ref เพื่อ resolve target
ref หนึ่งครั้งเป็น `release-package-under-test` และนำ artifact นั้นกลับมาใช้ทั้งใน
release-path Docker checks และ Package Acceptance วิธีนี้ทำให้ box ทั้งหมดที่เกี่ยวกับ package
ใช้ bytes เดียวกันและหลีกเลี่ยงการ build package ซ้ำ
cross-OS OpenAI install smoke ใช้ `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อมีการตั้งค่า
repo/org variable ไม่เช่นนั้นใช้ `openai/gpt-5.4` เพราะ lane นี้กำลัง
พิสูจน์การติดตั้ง package, onboarding, การเริ่มต้น gateway, และ agent live หนึ่ง turn
แทนที่จะ benchmark model ค่าเริ่มต้นที่ช้าที่สุด matrix live provider
ที่กว้างกว่ายังคงเป็นที่สำหรับ coverage เฉพาะ model

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

อย่าใช้ umbrella แบบเต็มเป็น rerun แรกหลังจาก fix แบบเจาะจง หาก box หนึ่ง
ล้มเหลว ให้ใช้ failed child workflow, job, Docker lane, package profile, model
provider, หรือ QA lane สำหรับหลักฐานถัดไป รัน umbrella แบบเต็มอีกครั้งก็ต่อเมื่อ
fix เปลี่ยน release orchestration ที่ใช้ร่วมกันหรือทำให้หลักฐาน all-box ก่อนหน้า
ล้าสมัย verifier สุดท้ายของ umbrella จะตรวจซ้ำ workflow run
ids ของ child ที่บันทึกไว้ ดังนั้นหลังจาก child workflow ถูกรันซ้ำจนสำเร็จ ให้ rerun เฉพาะ parent job
`Verify full validation` ที่ล้มเหลวเท่านั้น

สำหรับการกู้คืนแบบมีขอบเขต ให้ส่ง `rerun_group` ไปยัง umbrella `all` คือการรัน
release-candidate จริง, `ci` รันเฉพาะ child CI ปกติ, `plugin-prerelease`
รันเฉพาะ child plugin สำหรับ release เท่านั้น, `release-checks` รันทุก release
box, และกลุ่ม release ที่แคบกว่าคือ `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, และ `npm-telegram`
การ rerun `npm-telegram` แบบเจาะจงต้องมี `npm_telegram_package_spec`; การรัน full/all
พร้อม `release_profile=full` ใช้ artifact package ของ release-checks

### Vitest

box Vitest คือ child workflow `CI` แบบ manual CI แบบ manual ตั้งใจ
ข้าม changed scoping และบังคับใช้กราฟ test ปกติสำหรับ release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, ความเข้ากันได้กับ Node 22,
`check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android, และ Control UI i18n

ใช้ box นี้เพื่อตอบว่า "source tree ผ่าน test suite ปกติแบบเต็มหรือไม่?"
มันไม่เหมือนกับการตรวจสอบ product แบบ release-path หลักฐานที่ควรเก็บ:

- สรุป `Full Release Validation` ที่แสดง URL ของ run `CI` ที่ถูก dispatch
- run `CI` เป็นสีเขียวบน target SHA ที่แน่นอน
- ชื่อ shard ที่ล้มเหลวหรือช้าจากงาน CI เมื่อตรวจสอบ regression
- artifact timing ของ Vitest เช่น `.artifacts/vitest-shard-timings.json` เมื่อ
  run ต้องการการวิเคราะห์ performance

รัน manual CI โดยตรงเฉพาะเมื่อ release ต้องการ normal CI แบบ deterministic แต่
ไม่ต้องการ Docker, QA Lab, live, cross-OS, หรือ package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

box Docker อยู่ใน `OpenClaw Release Checks` ผ่าน
`openclaw-live-and-e2e-checks-reusable.yml` รวมถึงเวิร์กโฟลว์ `install-smoke`
ในโหมด release มันตรวจสอบ release candidate ผ่านสภาพแวดล้อม Docker
แบบ packaged แทนที่จะเป็นเพียง test ระดับ source

coverage ของ release Docker รวมถึง:

- install smoke แบบเต็มโดยเปิดใช้งาน slow Bun global install smoke
- การเตรียม/นำ root Dockerfile smoke image กลับมาใช้ตาม target SHA พร้อมงาน QR,
  root/gateway, และ installer/Bun smoke ที่รันเป็น shard install-smoke แยกกัน
- lane E2E ของ repository
- chunk Docker แบบ release-path: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, และ `plugins-runtime-install-h`
- coverage OpenWebUI ภายใน chunk `plugins-runtime-services` เมื่อร้องขอ
- lane install/uninstall ของ bundled plugin ที่แยกแล้ว
  `bundled-plugin-install-uninstall-0` ถึง
  `bundled-plugin-install-uninstall-23`
- suite live/E2E provider และ coverage model live ของ Docker เมื่อ release checks
  รวม live suites

ใช้ artifact Docker ก่อน rerun scheduler แบบ release-path จะอัปโหลด
`.artifacts/docker-tests/` พร้อม lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON, และคำสั่ง rerun สำหรับการกู้คืนแบบเจาะจง
ให้ใช้ `docker_lanes=<lane[,lane]>` บนเวิร์กโฟลว์ live/E2E แบบ reusable แทนการ
rerun release chunks ทั้งหมด คำสั่ง rerun ที่สร้างขึ้นจะมี
`package_artifact_run_id` ก่อนหน้าและ input Docker image ที่เตรียมไว้เมื่อมี เพื่อให้
lane ที่ล้มเหลวสามารถนำ tarball และ GHCR images เดิมกลับมาใช้ได้

### QA Lab

box QA Lab เป็นส่วนหนึ่งของ `OpenClaw Release Checks` เช่นกัน เป็น gate release
ด้านพฤติกรรมแบบ agentic และระดับ channel แยกจากกลไก package ของ Vitest และ Docker

coverage ของ release QA Lab รวมถึง:

- mock parity lane ที่เปรียบเทียบ candidate lane ของ OpenAI กับ baseline Opus 4.6
  โดยใช้ agentic parity pack
- fast live Matrix QA profile ที่ใช้ environment `qa-live-shared`
- live Telegram QA lane ที่ใช้ Convex CI credential leases
- `pnpm qa:otel:smoke` เมื่อ release telemetry ต้องการหลักฐาน local ที่ชัดเจน

ใช้ box นี้เพื่อตอบว่า "release ทำงานถูกต้องในสถานการณ์ QA และ
flow channel แบบ live หรือไม่?" เก็บ artifact URLs สำหรับ lane parity, Matrix, และ Telegram
เมื่ออนุมัติ release coverage Matrix แบบเต็มยังคงมีให้ใช้เป็น
manual sharded QA-Lab run แทน lane release-critical ค่าเริ่มต้น

### Package

box Package คือ gate ของ product ที่ติดตั้งได้ รองรับโดย
`Package Acceptance` และ resolver
`scripts/resolve-openclaw-package-candidate.mjs` resolver จะ normalize
candidate เป็น tarball `package-under-test` ที่ Docker E2E ใช้, ตรวจสอบ
inventory ของ package, บันทึกเวอร์ชัน package และ SHA-256, และเก็บ
ref ของ workflow harness แยกจาก ref ของ source package

แหล่ง candidate ที่รองรับ:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, หรือเวอร์ชัน release ของ OpenClaw
  ที่แน่นอน
- `source=ref`: pack branch, tag, หรือ full commit SHA ของ `package_ref` ที่เชื่อถือได้
  ด้วย harness `workflow_ref` ที่เลือก
- `source=url`: ดาวน์โหลด HTTPS `.tgz` พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: นำ `.tgz` ที่อัปโหลดโดย GitHub Actions run อื่นกลับมาใช้

`OpenClaw Release Checks` รัน Package Acceptance ด้วย `source=artifact`, artifact
package ของ release ที่เตรียมไว้, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues`, และ
`telegram_mode=mock-openai` Package Acceptance จะเก็บ migration, update, การล้าง dependency plugin ที่ stale,
fixtures plugin offline, plugin update, และ Telegram
package QA กับ tarball ที่ resolve แล้วเดียวกัน upgrade matrix ครอบคลุม baseline ที่เผยแพร่บน npm แบบ stable ทุกตัวตั้งแต่ `2026.4.23` ถึง `latest`; ใช้
Package Acceptance พร้อม `source=npm` สำหรับ candidate ที่จัดส่งไปแล้ว หรือ
`source=ref`/`source=artifact` สำหรับ npm tarball แบบ local ที่มี SHA รองรับก่อน
publish นี่คือสิ่งทดแทนแบบ GitHub-native
สำหรับ coverage package/update ส่วนใหญ่ที่ก่อนหน้านี้ต้องใช้
Parallels cross-OS release checks ยังคงสำคัญสำหรับ onboarding เฉพาะ OS,
installer, และพฤติกรรม platform แต่การตรวจสอบ product ด้าน package/update ควร
ใช้ Package Acceptance เป็นหลัก

checklist canonical สำหรับการตรวจสอบ update และ plugin คือ
[การทดสอบ updates และ plugins](/th/help/testing-updates-plugins) ใช้มันเมื่อ
ตัดสินใจว่า lane local, Docker, Package Acceptance, หรือ release-check ใดพิสูจน์
การติดตั้ง/update plugin, doctor cleanup, หรือการเปลี่ยนแปลง migration ของ published-package
การ migration update แบบ exhaustive ที่เผยแพร่จากทุก package `2026.4.23+` แบบ stable
เป็นเวิร์กโฟลว์ `Update Migration` แบบ manual แยกต่างหาก ไม่ใช่ส่วนหนึ่งของ Full Release CI

ความผ่อนปรน package-acceptance แบบ legacy ถูกจำกัดเวลาโดยตั้งใจ Packages จนถึง
`2026.4.25` อาจใช้ compatibility path สำหรับช่องว่าง metadata ที่เผยแพร่ไปยัง npm แล้ว:
รายการ private QA inventory ที่หายไปจาก tarball, `gateway install --wrapper` ที่หายไป, patch files ที่หายไปใน git
fixture ที่ได้จาก tarball, `update.channel` ที่ persist หายไป, ตำแหน่ง
legacy plugin install-record, การ persist marketplace install-record ที่หายไป, และการ migration config metadata
ระหว่าง `plugins update` package `2026.4.26` ที่เผยแพร่อาจ warn
สำหรับไฟล์ local build metadata stamp ที่จัดส่งไปแล้ว package ภายหลัง
ต้องผ่าน package contracts สมัยใหม่; ช่องว่างเดียวกันเหล่านั้นทำให้ release
validation ล้มเหลว

ใช้โปรไฟล์ Package Acceptance ที่กว้างขึ้นเมื่อคำถามของ release เกี่ยวกับ
package ที่ติดตั้งได้จริง:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

โปรไฟล์ package ทั่วไป:

- `smoke`: lane การติดตั้ง package/channel/agent, gateway network, และ config
  reload แบบเร็ว
- `package`: contracts ของ install/update/plugin package โดยไม่มี live ClawHub; นี่คือค่าเริ่มต้นของ release-check
- `product`: `package` พร้อม MCP channels, cron/subagent cleanup, OpenAI web
  search, และ OpenWebUI
- `full`: chunk Docker release-path พร้อม OpenWebUI
- `custom`: รายการ `docker_lanes` ที่แน่นอนสำหรับ rerun แบบเจาะจง

สำหรับหลักฐาน Telegram ของแพ็กเกจตัวเลือก ให้เปิดใช้ `telegram_mode=mock-openai` หรือ
`telegram_mode=live-frontier` บน Package Acceptance เวิร์กโฟลว์จะส่ง tarball
`package-under-test` ที่ resolve แล้วเข้าไปในเลน Telegram; ส่วนเวิร์กโฟลว์
Telegram แบบแยกเดี่ยวจะยังคงรับ spec npm ที่เผยแพร่แล้วสำหรับการตรวจหลังเผยแพร่

## ระบบอัตโนมัติสำหรับเผยแพร่รีลีส

`OpenClaw Release Publish` คือ entrypoint การเผยแพร่แบบแก้ไขสถานะตามปกติ ซึ่ง
ประสานเวิร์กโฟลว์ trusted-publisher ตามลำดับที่รีลีสต้องใช้:

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

การเผยแพร่ stable ไปยัง dist-tag เบต้าเริ่มต้น:

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
เฉพาะงานซ่อมแซมหรือเผยแพร่ซ้ำที่เจาะจงเท่านั้น สำหรับการซ่อมแซม Plugin ที่เลือกไว้ ให้ส่ง
`plugin_publish_scope=selected` และ `plugins=@openclaw/name` ไปยัง
`OpenClaw Release Publish` หรือ dispatch เวิร์กโฟลว์ลูกโดยตรงเมื่อไม่ควรเผยแพร่แพ็กเกจ
OpenClaw

## อินพุตของเวิร์กโฟลว์ NPM

`OpenClaw NPM Release` รับอินพุตที่ผู้ปฏิบัติงานควบคุมได้ดังนี้:

- `tag`: แท็กรีลีสที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1` หรือ
  `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` ค่านี้อาจเป็น workflow-branch commit SHA
  แบบเต็ม 40 อักขระปัจจุบันสำหรับ preflight แบบตรวจสอบเท่านั้นได้ด้วย
- `preflight_only`: `true` สำหรับการตรวจสอบ/บิลด์/แพ็กเกจเท่านั้น, `false` สำหรับเส้นทางเผยแพร่จริง
- `preflight_run_id`: จำเป็นบนเส้นทางเผยแพร่จริง เพื่อให้เวิร์กโฟลว์นำ tarball ที่เตรียมไว้จากรัน preflight ที่สำเร็จกลับมาใช้
- `npm_dist_tag`: แท็กเป้าหมายของ npm สำหรับเส้นทางเผยแพร่; ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Publish` รับอินพุตที่ผู้ปฏิบัติงานควบคุมได้ดังนี้:

- `tag`: แท็กรีลีสที่จำเป็น; ต้องมีอยู่แล้ว
- `preflight_run_id`: id ของรัน preflight `OpenClaw NPM Release` ที่สำเร็จ;
  จำเป็นเมื่อ `publish_openclaw_npm=true`
- `npm_dist_tag`: แท็กเป้าหมายของ npm สำหรับแพ็กเกจ OpenClaw
- `plugin_publish_scope`: ค่าเริ่มต้นคือ `all-publishable`; ใช้ `selected` เฉพาะ
  งานซ่อมแซมที่เจาะจง
- `plugins`: ชื่อแพ็กเกจ `@openclaw/*` คั่นด้วยจุลภาค เมื่อ
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: ค่าเริ่มต้นคือ `true`; ตั้งเป็น `false` เฉพาะเมื่อใช้เวิร์กโฟลว์
  เป็นตัวประสานงานซ่อมแซมเฉพาะ Plugin

`OpenClaw Release Checks` รับอินพุตที่ผู้ปฏิบัติงานควบคุมได้ดังนี้:

- `ref`: branch, tag หรือ commit SHA แบบเต็มที่จะตรวจสอบ เช็กที่มี secret
  กำหนดให้ commit ที่ resolve แล้วต้องเข้าถึงได้จาก branch ของ OpenClaw หรือ
  แท็กรีลีส

กฎ:

- แท็ก stable และแท็กแก้ไขอาจเผยแพร่ไปยัง `beta` หรือ `latest` ก็ได้
- แท็ก prerelease เบต้าเผยแพร่ได้เฉพาะไปยัง `beta`
- สำหรับ `OpenClaw NPM Release` อนุญาตให้อินพุตเป็น commit SHA แบบเต็มเฉพาะเมื่อ
  `preflight_only=true`
- `OpenClaw Release Checks` และ `Full Release Validation` เป็นแบบตรวจสอบเท่านั้นเสมอ
- เส้นทางเผยแพร่จริงต้องใช้ `npm_dist_tag` เดียวกับที่ใช้ระหว่าง preflight;
  เวิร์กโฟลว์จะตรวจสอบ metadata นั้นก่อนดำเนินการเผยแพร่ต่อ

## ลำดับการรีลีส npm stable

เมื่อทำรีลีส npm stable:

1. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนมีแท็ก คุณอาจใช้ workflow-branch commit SHA แบบเต็มปัจจุบันสำหรับ dry run แบบตรวจสอบเท่านั้นของเวิร์กโฟลว์ preflight
2. เลือก `npm_dist_tag=beta` สำหรับ flow ปกติที่ปล่อยเบต้าก่อน หรือ `latest` เฉพาะ
   เมื่อคุณตั้งใจเผยแพร่ stable โดยตรง
3. รัน `Full Release Validation` บน branch รีลีส, แท็กรีลีส หรือ commit SHA แบบเต็ม
   เมื่อคุณต้องการ CI ปกติพร้อมความครอบคลุมของ prompt cache แบบ live, Docker, QA Lab,
   Matrix และ Telegram จากเวิร์กโฟลว์ manual เดียว
4. หากคุณตั้งใจต้องการเฉพาะกราฟทดสอบปกติแบบกำหนดแน่นอน ให้รันเวิร์กโฟลว์ manual `CI`
   บน ref ของรีลีสแทน
5. บันทึก `preflight_run_id` ที่สำเร็จ
6. รัน `OpenClaw Release Publish` ด้วย `tag` เดียวกัน, `npm_dist_tag` เดียวกัน
   และ `preflight_run_id` ที่บันทึกไว้; ระบบจะเผยแพร่ Plugin ที่ externalized ไปยัง npm
   และ ClawHub ก่อนโปรโมตแพ็กเกจ npm ของ OpenClaw
7. หากรีลีสลงที่ `beta` ให้ใช้เวิร์กโฟลว์ส่วนตัว
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   เพื่อโปรโมตเวอร์ชัน stable นั้นจาก `beta` ไปยัง `latest`
8. หากรีลีสตั้งใจเผยแพร่โดยตรงไปยัง `latest` และ `beta`
   ควรตามบิลด์ stable เดียวกันทันที ให้ใช้เวิร์กโฟลว์ส่วนตัวเดียวกันนั้นเพื่อชี้ dist-tag ทั้งสองไปยังเวอร์ชัน stable หรือปล่อยให้การซิงก์ self-healing ตามกำหนดการย้าย `beta` ในภายหลัง

การแก้ไข dist-tag อยู่ใน repo ส่วนตัวเพื่อความปลอดภัย เพราะยังต้องใช้
`NPM_TOKEN` ในขณะที่ repo สาธารณะคงการเผยแพร่แบบ OIDC-only ไว้

สิ่งนี้ทำให้ทั้งเส้นทางเผยแพร่โดยตรงและเส้นทางโปรโมตแบบเบต้าก่อนได้รับการบันทึกเป็นเอกสารและมองเห็นได้สำหรับผู้ปฏิบัติงาน

หาก maintainer ต้อง fallback ไปใช้การยืนยันตัวตน npm แบบ local ให้รันคำสั่ง 1Password
CLI (`op`) ใดๆ เฉพาะใน tmux session ที่แยกไว้เท่านั้น อย่าเรียก `op`
โดยตรงจาก shell หลักของ agent; การเก็บไว้ใน tmux ทำให้ prompt,
alert และการจัดการ OTP สังเกตได้ และป้องกัน alert ซ้ำบน host

## อ้างอิงสาธารณะ

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
เป็น runbook จริง

## ที่เกี่ยวข้อง

- [ช่องทางรีลีส](/th/install/development-channels)
