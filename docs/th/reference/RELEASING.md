---
read_when:
    - กำลังค้นหาคำจำกัดความของช่องทางเผยแพร่สาธารณะ
    - การเรียกใช้การตรวจสอบความถูกต้องของรีลีสหรือการยอมรับแพ็กเกจ
    - กำลังมองหาการตั้งชื่อเวอร์ชันและรอบการออกรุ่น
summary: เลนการเผยแพร่ รายการตรวจสอบสำหรับผู้ปฏิบัติการ กล่องตรวจสอบความถูกต้อง การตั้งชื่อเวอร์ชัน และรอบการทำงาน
title: นโยบายการเผยแพร่รุ่น
x-i18n:
    generated_at: "2026-05-02T20:59:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 493cb8b42f0e15f3bf5f8fb9be7d01fd626f4f16db9ac0a85e6efa747ef12d12
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw มีช่องทางการเผยแพร่สาธารณะสี่ช่องทาง:

- เสถียร: รุ่นที่ติดแท็กซึ่งเผยแพร่ไปยัง npm `beta` เป็นค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อร้องขออย่างชัดเจน
- อัลฟา: แท็ก prerelease ที่เผยแพร่ไปยัง npm `alpha`
- เบต้า: แท็ก prerelease ที่เผยแพร่ไปยัง npm `beta`
- dev: head ที่เปลี่ยนไปเรื่อย ๆ ของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันรุ่นเผยแพร่เสถียร: `YYYY.M.D`
  - แท็ก Git: `vYYYY.M.D`
- เวอร์ชันรุ่นแก้ไขเสถียร: `YYYY.M.D-N`
  - แท็ก Git: `vYYYY.M.D-N`
- เวอร์ชัน prerelease อัลฟา: `YYYY.M.D-alpha.N`
  - แท็ก Git: `vYYYY.M.D-alpha.N`
- เวอร์ชัน prerelease เบต้า: `YYYY.M.D-beta.N`
  - แท็ก Git: `vYYYY.M.D-beta.N`
- อย่าเติมศูนย์นำหน้าเดือนหรือวัน
- `latest` หมายถึงรุ่นเผยแพร่ npm เสถียรที่ถูกโปรโมตปัจจุบัน
- `alpha` หมายถึงเป้าหมายการติดตั้งอัลฟาปัจจุบัน
- `beta` หมายถึงเป้าหมายการติดตั้งเบต้าปัจจุบัน
- รุ่นเผยแพร่เสถียรและรุ่นแก้ไขเสถียรเผยแพร่ไปยัง npm `beta` เป็นค่าเริ่มต้น; ผู้ดำเนินการเผยแพร่สามารถกำหนดเป้าหมายเป็น `latest` อย่างชัดเจน หรือโปรโมตบิลด์เบต้าที่ผ่านการตรวจแล้วในภายหลัง
- ทุกการเผยแพร่ OpenClaw แบบเสถียรจะส่งมอบแพ็กเกจ npm และแอป macOS พร้อมกัน;
  โดยปกติรุ่นเบต้าจะตรวจสอบและเผยแพร่เส้นทาง npm/package ก่อน ส่วนการ build/sign/notarize
  แอป mac จะสงวนไว้สำหรับรุ่นเสถียร เว้นแต่จะมีการร้องขออย่างชัดเจน

## จังหวะการเผยแพร่

- การเผยแพร่จะเริ่มจากเบต้าก่อน
- รุ่นเสถียรจะตามมาหลังจากเบต้าล่าสุดผ่านการตรวจสอบแล้วเท่านั้น
- โดยปกติ maintainers จะตัดรุ่นจากสาขา `release/YYYY.M.D` ที่สร้าง
  จาก `main` ปัจจุบัน เพื่อให้การตรวจสอบและการแก้ไขรุ่นเผยแพร่ไม่ขวางการพัฒนาใหม่
  บน `main`
- หากมีการ push หรือเผยแพร่แท็กเบต้าไปแล้วและต้องแก้ไข maintainers จะตัด
  แท็ก `-beta.N` ถัดไปแทนการลบหรือสร้างแท็กเบต้าเดิมใหม่
- ขั้นตอนการเผยแพร่โดยละเอียด การอนุมัติ credentials และหมายเหตุการกู้คืน
  เป็นข้อมูลเฉพาะ maintainer เท่านั้น

## เช็กลิสต์ผู้ดำเนินการเผยแพร่

เช็กลิสต์นี้คือรูปแบบสาธารณะของโฟลว์การเผยแพร่ รายละเอียด credentials ส่วนตัว
การลงนาม การ notarization การกู้คืน dist-tag และการ rollback ฉุกเฉินจะอยู่ใน
runbook การเผยแพร่เฉพาะ maintainer เท่านั้น

1. เริ่มจาก `main` ปัจจุบัน: pull ล่าสุด ยืนยันว่า commit เป้าหมายถูก push แล้ว
   และยืนยันว่า CI ของ `main` ปัจจุบันเขียวพอที่จะสร้างสาขาจากจุดนั้น
2. เขียนส่วนบนสุดของ `CHANGELOG.md` ใหม่จากประวัติ commit จริงด้วย
   `/changelog` คงรายการให้เป็นมุมมองผู้ใช้ commit รายการนั้น push รายการนั้น และ rebase/pull
   อีกครั้งก่อนสร้างสาขา
3. ตรวจทานระเบียนความเข้ากันได้ของการเผยแพร่ใน
   `src/plugins/compat/registry.ts` และ
   `src/commands/doctor/shared/deprecation-compat.ts` ลบความเข้ากันได้ที่หมดอายุ
   เฉพาะเมื่อเส้นทางอัปเกรดยังคงครอบคลุมอยู่ หรือบันทึกเหตุผลว่าทำไมจึงตั้งใจ
   คงไว้
4. สร้าง `release/YYYY.M.D` จาก `main` ปัจจุบัน; อย่าทำงานเผยแพร่ปกติ
   โดยตรงบน `main`
5. เพิ่มเวอร์ชันในทุกตำแหน่งที่จำเป็นสำหรับแท็กที่ตั้งใจไว้ รัน
   `pnpm plugins:sync` เพื่อให้แพ็กเกจ Plugin ที่เผยแพร่ได้ใช้เวอร์ชันรุ่นเผยแพร่
   และ metadata ความเข้ากันได้ร่วมกัน จากนั้นรัน preflight แบบ deterministic ในเครื่อง:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, และ
   `pnpm release:check`
6. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true` ก่อนมีแท็ก
   อนุญาตให้ใช้ SHA ความยาว 40 อักขระเต็มของสาขา release สำหรับ preflight
   แบบตรวจสอบเท่านั้น บันทึก `preflight_run_id` ที่สำเร็จ
7. เริ่มการทดสอบก่อนเผยแพร่ทั้งหมดด้วย `Full Release Validation` สำหรับ
   สาขา release แท็ก หรือ commit SHA แบบเต็ม นี่คือ entrypoint แบบแมนนวลหนึ่งเดียว
   สำหรับกล่องทดสอบรุ่นเผยแพร่ขนาดใหญ่สี่ชุด: Vitest, Docker, QA Lab และ Package
8. หากการตรวจสอบล้มเหลว ให้แก้บนสาขา release แล้วรันซ้ำเฉพาะไฟล์ lane งาน workflow
   package profile provider หรือ model allowlist ที่ล้มเหลวซึ่งเล็กที่สุดและพิสูจน์
   การแก้ไขได้ รัน umbrella แบบเต็มซ้ำเฉพาะเมื่อพื้นผิวที่เปลี่ยนทำให้หลักฐานเดิม
   ล้าสมัย
9. สำหรับอัลฟาหรือเบต้า ให้แท็ก `vYYYY.M.D-alpha.N` หรือ `vYYYY.M.D-beta.N` แล้วรัน `OpenClaw Release Publish` จาก
   สาขา `release/YYYY.M.D` ที่ตรงกัน คำสั่งนี้ตรวจสอบ `pnpm plugins:sync:check`
   เผยแพร่แพ็กเกจ Plugin ที่เผยแพร่ได้ทั้งหมดไปยัง npm ก่อน เผยแพร่ชุดเดียวกัน
   ไปยัง ClawHub เป็นลำดับที่สอง แล้วจึงโปรโมต artifact preflight ของ OpenClaw npm
   ที่เตรียมไว้ด้วย dist-tag ที่ตรงกัน หลังเผยแพร่ ให้รันการยอมรับแพ็กเกจหลังเผยแพร่
   กับแพ็กเกจ `openclaw@YYYY.M.D-alpha.N`, `openclaw@alpha`,
   `openclaw@YYYY.M.D-beta.N` หรือ `openclaw@beta` ที่เผยแพร่แล้ว หาก prerelease
   ที่ถูก push หรือเผยแพร่แล้วต้องการการแก้ไข ให้ตัดหมายเลข prerelease ถัดไปที่ตรงกัน;
   อย่าลบหรือเขียน prerelease เดิมใหม่
10. สำหรับรุ่นเสถียร ให้ดำเนินการต่อเฉพาะหลังจากเบต้าหรือ release candidate ที่ผ่านการตรวจแล้วมี
    หลักฐานการตรวจสอบที่จำเป็น การเผยแพร่ npm แบบเสถียรก็ผ่าน
    `OpenClaw Release Publish` เช่นกัน โดยใช้ artifact preflight ที่สำเร็จซ้ำผ่าน
    `preflight_run_id`; ความพร้อมของการเผยแพร่ macOS แบบเสถียรยังต้องมี
    `.zip`, `.dmg`, `.dSYM.zip` ที่แพ็กแล้ว และ `appcast.xml` ที่อัปเดตบน `main`
11. หลังเผยแพร่ ให้รันตัวตรวจสอบ npm หลังเผยแพร่, E2E Telegram ของ published-npm
    แบบ standalone ที่เป็นทางเลือกเมื่อคุณต้องการหลักฐาน channel หลังเผยแพร่,
    การโปรโมต dist-tag เมื่อจำเป็น, บันทึก GitHub release/prerelease จากส่วน
    `CHANGELOG.md` ที่ตรงกันและครบถ้วน และขั้นตอนประกาศการเผยแพร่

## Release preflight

- รัน `pnpm check:test-types` ก่อน release preflight เพื่อให้ TypeScript ของเทสต์ยังคงได้รับการ
  ครอบคลุมนอก gate `pnpm check` ภายในเครื่องที่เร็วกว่า
- รัน `pnpm check:architecture` ก่อน release preflight เพื่อให้การตรวจสอบ import
  cycle และขอบเขตสถาปัตยกรรมที่กว้างกว่าสำเร็จนอก gate ภายในเครื่องที่เร็วกว่า
- รัน `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้ artifact
  release `dist/*` ที่คาดไว้และ Control UI bundle มีอยู่สำหรับขั้นตอน pack
  validation
- รัน `pnpm plugins:sync` หลังจาก bump เวอร์ชัน root และก่อนติดแท็ก คำสั่งนี้
  อัปเดตเวอร์ชันแพ็กเกจ Plugin ที่เผยแพร่ได้, metadata ความเข้ากันได้ของ OpenClaw peer/API,
  build metadata และ stub changelog ของ Plugin ให้ตรงกับเวอร์ชัน release หลัก
  `pnpm plugins:sync:check` คือ release guard แบบไม่แก้ไขข้อมูล;
  workflow เผยแพร่จะล้มเหลวก่อนมีการเปลี่ยนแปลง registry ใดๆ หากลืมขั้นตอนนี้
- รัน workflow แบบ manual `Full Release Validation` ก่อนอนุมัติ release เพื่อ
  เริ่ม test box ก่อน release ทั้งหมดจาก entrypoint เดียว คำสั่งนี้รับ branch,
  tag หรือ commit SHA แบบเต็ม, dispatch `CI` แบบ manual และ dispatch
  `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, Docker
  release-path suites, live/E2E, OpenWebUI, QA Lab parity, Matrix และ Telegram
  lanes เมื่อใช้ `release_profile=full` และ `rerun_group=all` จะรัน package
  Telegram E2E กับ artifact `release-package-under-test` จาก release
  checks ด้วย ระบุ `npm_telegram_package_spec` หลังเผยแพร่เมื่อควรให้ Telegram E2E
  ชุดเดียวกันพิสูจน์แพ็กเกจ npm ที่เผยแพร่แล้วด้วย ระบุ
  `package_acceptance_package_spec` หลังเผยแพร่เมื่อ Package Acceptance
  ควรรัน matrix package/update กับแพ็กเกจ npm ที่ส่งออกจริงแทน
  artifact ที่ build จาก SHA ระบุ
  `evidence_package_spec` เมื่อรายงานหลักฐานส่วนตัวควรพิสูจน์ว่า
  การ validation ตรงกับแพ็กเกจ npm ที่เผยแพร่แล้วโดยไม่บังคับ Telegram E2E
  ตัวอย่าง:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- รัน workflow แบบ manual `Package Acceptance` เมื่อคุณต้องการหลักฐานแบบ side-channel
  สำหรับ candidate แพ็กเกจระหว่างที่งาน release ยังดำเนินต่อ ใช้ `source=npm` สำหรับ
  `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` หรือเวอร์ชัน release ที่ระบุแน่นอน; ใช้ `source=ref`
  เพื่อ pack branch/tag/SHA `package_ref` ที่เชื่อถือได้ด้วย harness
  `workflow_ref` ปัจจุบัน; ใช้ `source=url` สำหรับ HTTPS tarball ที่ต้องมี
  SHA-256; หรือใช้ `source=artifact` สำหรับ tarball ที่อัปโหลดโดย GitHub
  Actions run อื่น workflow จะ resolve candidate เป็น
  `package-under-test`, ใช้ Docker E2E release scheduler ซ้ำกับ
  tarball นั้น และสามารถรัน Telegram QA กับ tarball เดียวกันด้วย
  `telegram_mode=mock-openai` หรือ `telegram_mode=live-frontier` เมื่อ
  Docker lanes ที่เลือกมี `published-upgrade-survivor`, package
  artifact คือ candidate และ `published_upgrade_survivor_baseline` เลือก
  baseline ที่เผยแพร่แล้ว
  ตัวอย่าง: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  โปรไฟล์ทั่วไป:
  - `smoke`: install/channel/agent, gateway network และ config reload lanes
  - `package`: artifact-native package/update/plugin lanes โดยไม่มี OpenWebUI หรือ ClawHub แบบ live
  - `product`: โปรไฟล์ package พร้อม MCP channels, cron/subagent cleanup,
    OpenAI web search และ OpenWebUI
  - `full`: Docker release-path chunks พร้อม OpenWebUI
  - `custom`: การเลือก `docker_lanes` ที่แน่นอนสำหรับ rerun แบบเจาะจง
- รัน workflow แบบ manual `CI` โดยตรงเมื่อคุณต้องการเพียง coverage CI ปกติแบบเต็ม
  สำหรับ release candidate เท่านั้น การ dispatch CI แบบ manual จะข้าม changed
  scoping และบังคับ Linux Node shards, bundled-plugin shards, channel
  contracts, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke,
  docs checks, Python skills, Windows, macOS, Android และ Control UI i18n
  lanes
  ตัวอย่าง: `gh workflow run ci.yml --ref release/YYYY.M.D`
- รัน `pnpm qa:otel:smoke` เมื่อตรวจสอบ release telemetry คำสั่งนี้ exercise
  QA-lab ผ่านตัวรับ OTLP/HTTP ภายในเครื่อง และตรวจสอบชื่อ trace
  span ที่ส่งออก, attributes ที่มีขอบเขต และการ redact content/identifier โดยไม่
  ต้องใช้ Opik, Langfuse หรือตัวรวบรวมภายนอกอื่น
- รัน `pnpm release:check` ก่อนทุก release ที่มี tag
- รัน `OpenClaw Release Publish` สำหรับลำดับการเผยแพร่ที่เปลี่ยนแปลงข้อมูลหลังจาก
  tag มีอยู่แล้ว Dispatch จาก `release/YYYY.M.D` (หรือ `main` เมื่อเผยแพร่
  tag ที่เข้าถึงได้จาก main), ส่ง release tag และ OpenClaw npm
  `preflight_run_id` ที่สำเร็จ และคง default plugin publish scope
  `all-publishable` ไว้ เว้นแต่คุณตั้งใจรันการซ่อมแบบเจาะจง workflow
  จะจัดลำดับ plugin npm publish, plugin ClawHub publish และ OpenClaw
  npm publish เพื่อไม่ให้แพ็กเกจ core ถูกเผยแพร่ก่อน Plugin ที่ถูก externalize
- ตอนนี้ release checks รันใน workflow แบบ manual แยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรัน QA Lab mock parity lane พร้อมโปรไฟล์
  Matrix live แบบเร็ว และ Telegram QA lane ก่อนอนุมัติ release ด้วย live
  lanes ใช้ environment `qa-live-shared`; Telegram ยังใช้ Convex CI
  credential leases ด้วย รัน workflow แบบ manual `QA-Lab - All Lanes` ด้วย
  `matrix_profile=all` และ `matrix_shards=true` เมื่อคุณต้องการ inventory Matrix
  transport, media และ E2EE แบบเต็มในแบบขนาน
- การ validation runtime สำหรับการติดตั้งและอัปเกรดข้าม OS เป็นส่วนหนึ่งของ
  `OpenClaw Release Checks` และ `Full Release Validation` แบบสาธารณะ ซึ่งเรียก
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` โดยตรง
- การแยกนี้ตั้งใจทำ: รักษาเส้นทาง release npm จริงให้สั้น,
  deterministic และมุ่งเน้น artifact ขณะที่ checks แบบ live ที่ช้ากว่าอยู่ใน
  lane ของตัวเองเพื่อไม่ให้ทำให้การเผยแพร่ชะงักหรือติดขัด
- release checks ที่มี secret ควรถูก dispatch ผ่าน `Full Release
Validation` หรือจาก workflow ref `main`/release เพื่อให้ logic ของ workflow และ
  secrets อยู่ในการควบคุม
- `OpenClaw Release Checks` รับ branch, tag หรือ commit SHA แบบเต็ม ตราบใดที่
  commit ที่ resolve แล้วเข้าถึงได้จาก branch หรือ release tag ของ OpenClaw
- preflight แบบ validation-only ของ `OpenClaw NPM Release` ยังรับ commit SHA
  แบบเต็ม 40 ตัวอักษรของ workflow-branch ปัจจุบันได้โดยไม่ต้องใช้ tag ที่ push แล้ว
- เส้นทาง SHA นั้นเป็น validation-only และไม่สามารถโปรโมตเป็นการเผยแพร่จริงได้
- ในโหมด SHA workflow จะสังเคราะห์ `v<package.json version>` เฉพาะสำหรับการตรวจสอบ
  package metadata; การเผยแพร่จริงยังต้องใช้ release tag จริง
- ทั้งสอง workflow คงเส้นทางเผยแพร่และโปรโมตจริงไว้บน GitHub-hosted
  runners ขณะที่เส้นทาง validation ที่ไม่เปลี่ยนแปลงข้อมูลสามารถใช้
  Blacksmith Linux runners ที่ใหญ่กว่าได้
- workflow นั้นรัน
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ workflow secrets ทั้ง `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- npm release preflight ไม่รอ release checks lane แยกต่างหากอีกต่อไป
- รัน `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือ tag beta/correction ที่ตรงกัน) ก่อนอนุมัติ
- หลังจาก npm publish ให้รัน
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (หรือเวอร์ชัน beta/correction ที่ตรงกัน) เพื่อตรวจสอบเส้นทางการติดตั้ง registry
  ที่เผยแพร่แล้วใน temp prefix ใหม่
- หลังจาก beta publish ให้รัน `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  เพื่อตรวจสอบ installed-package onboarding, การตั้งค่า Telegram และ Telegram E2E จริง
  กับแพ็กเกจ npm ที่เผยแพร่แล้ว โดยใช้ pool credential Telegram แบบ leased ที่แชร์กัน
  maintainer ที่รันเฉพาะกิจในเครื่องอาจละ Convex vars และส่ง credentials env ทั้งสาม
  `OPENCLAW_QA_TELEGRAM_*` โดยตรง
- Maintainer สามารถรัน post-publish check เดียวกันจาก GitHub Actions ผ่าน
  workflow แบบ manual `NPM Telegram Beta E2E` ได้ workflow นี้ตั้งใจให้เป็น manual-only และ
  ไม่รันทุกครั้งที่ merge
- release automation ของ maintainer ตอนนี้ใช้ preflight-then-promote:
  - npm publish จริงต้องผ่าน npm `preflight_run_id` ที่สำเร็จ
  - npm publish จริงต้อง dispatch จาก branch `main` หรือ
    `release/YYYY.M.D` เดียวกันกับ preflight run ที่สำเร็จ
  - release npm stable ตั้งค่า default เป็น `beta`
  - stable npm publish สามารถ target `latest` อย่างชัดเจนผ่าน workflow input
  - ตอนนี้การเปลี่ยนแปลง npm dist-tag แบบใช้ token อยู่ใน
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    เพื่อความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่
    repo สาธารณะยังคงใช้ OIDC-only publish
  - `macOS Release` สาธารณะเป็น validation-only; เมื่อ tag อยู่เฉพาะบน
    release branch แต่ workflow ถูก dispatch จาก `main` ให้ตั้งค่า
    `public_release_branch=release/YYYY.M.D`
  - private mac publish จริงต้องผ่าน private mac
    `preflight_run_id` และ `validate_run_id` ที่สำเร็จ
  - เส้นทาง publish จริงโปรโมต artifact ที่เตรียมไว้แทนที่จะ build
    ใหม่อีกครั้ง
- สำหรับ stable correction releases เช่น `YYYY.M.D-N`, post-publish verifier
  ยังตรวจสอบเส้นทางอัปเกรด temp-prefix เดียวกันจาก `YYYY.M.D` เป็น `YYYY.M.D-N`
  เพื่อให้ release corrections ไม่สามารถปล่อยให้การติดตั้ง global รุ่นเก่าอยู่บน
  payload stable ฐานอย่างเงียบๆ
- npm release preflight จะ fail closed เว้นแต่ tarball มีทั้ง
  `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่าง
  เพื่อไม่ให้เราส่งมอบ browser dashboard ว่างเปล่าอีก
- post-publish verification ยังตรวจสอบว่า entrypoints ของ Plugin ที่เผยแพร่แล้วและ
  package metadata มีอยู่ใน layout ของ registry ที่ติดตั้งแล้ว release ที่
  ส่ง payload runtime ของ Plugin ขาดหายจะทำให้ postpublish verifier ล้มเหลวและ
  ไม่สามารถโปรโมตเป็น `latest` ได้
- `pnpm test:install:smoke` ยังบังคับใช้งบประมาณ npm pack `unpackedSize` กับ
  tarball update candidate ดังนั้น installer e2e จะจับ pack bloat ที่ไม่ตั้งใจ
  ได้ก่อนเส้นทาง release publish
- หากงาน release แตะ CI planning, extension timing manifests หรือ
  extension test matrices ให้ regenerate และ review matrix outputs
  `plugin-prerelease-extension-shard` ที่ planner เป็นเจ้าของจาก
  `.github/workflows/plugin-prerelease.yml` ก่อนอนุมัติ เพื่อให้ release notes ไม่
  อธิบาย layout CI ที่ล้าสมัย
- ความพร้อมของ release macOS stable ยังรวม updater surfaces:
  - GitHub release ต้องลงเอยด้วย `.zip`, `.dmg` และ `.dSYM.zip` ที่แพ็กเกจแล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปยัง stable zip ใหม่หลังเผยแพร่
  - app ที่แพ็กเกจแล้วต้องคง bundle id แบบไม่ใช่ debug, Sparkle feed
    URL ที่ไม่ว่าง และ `CFBundleVersion` ที่เท่ากับหรือสูงกว่า canonical Sparkle build floor
    สำหรับเวอร์ชัน release นั้น

## Release test boxes

`Full Release Validation` คือวิธีที่ operators ใช้เริ่มเทสต์ก่อน release ทั้งหมดจาก
entrypoint เดียว สำหรับหลักฐาน commit ที่ pin ไว้บน branch ที่เปลี่ยนเร็ว ให้ใช้
helper เพื่อให้ workflow ลูกทุกตัวรันจาก branch ชั่วคราวที่ fix อยู่ที่ target
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

helper จะ push `release-ci/<sha>-...`, dispatch `Full Release Validation`
จาก branch นั้นด้วย `ref=<sha>`, ตรวจสอบว่า workflow ลูกทุกตัวมี `headSha`
ตรงกับ target แล้วจึงลบ branch ชั่วคราว การทำเช่นนี้หลีกเลี่ยงการพิสูจน์
child run ของ `main` ที่ใหม่กว่าโดยไม่ตั้งใจ

สำหรับการ validation release branch หรือ tag ให้รันจาก workflow
ref `main` ที่เชื่อถือได้ และส่ง release branch หรือ tag เป็น `ref`:

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
`target_ref=<release-ref>`, dispatch `OpenClaw Release Checks`, และ dispatch
Telegram E2E สำหรับแพ็กเกจแบบ standalone เมื่อ `release_profile=full` พร้อม
`rerun_group=all` หรือเมื่อมีการตั้งค่า `npm_telegram_package_spec` จากนั้น `OpenClaw Release
Checks` จะกระจายงานไปยัง install smoke, cross-OS release checks, live/E2E Docker
release-path coverage, Package Acceptance พร้อม Telegram package QA, QA Lab
parity, live Matrix และ live Telegram การรันแบบเต็มจะยอมรับได้ก็ต่อเมื่อ
สรุป `Full Release Validation`
แสดงว่า `normal_ci` และ `release_checks` สำเร็จ ในโหมด full/all
child `npm_telegram` ต้องสำเร็จด้วยเช่นกัน; นอก full/all จะถูกข้าม
เว้นแต่จะมีการระบุ `npm_telegram_package_spec` ที่เผยแพร่แล้ว สรุป
verifier สุดท้ายมีตารางงานที่ช้าที่สุดสำหรับ child run แต่ละรายการ เพื่อให้ผู้จัดการรีลีส
เห็น critical path ปัจจุบันได้โดยไม่ต้องดาวน์โหลดล็อก
ดู [การตรวจสอบรีลีสเต็มรูปแบบ](/th/reference/full-release-validation) สำหรับ
stage matrix ฉบับสมบูรณ์, ชื่องานเวิร์กโฟลว์ที่แน่นอน, ความแตกต่างระหว่างโปรไฟล์ stable กับ full,
artifacts และ handle สำหรับการ rerun แบบเจาะจง
Child workflows จะถูก dispatch จาก trusted ref ที่รัน `Full Release
Validation` โดยปกติคือ `--ref main` แม้ target `ref` จะชี้ไปยัง
release branch หรือ tag ที่เก่ากว่า ไม่มีอินพุต workflow-ref แยกต่างหากสำหรับ Full Release Validation;
เลือก harness ที่เชื่อถือได้ด้วยการเลือก workflow run ref
อย่าใช้ `--ref main -f ref=<sha>` เพื่อพิสูจน์ commit ที่แน่นอนบน `main` ที่เคลื่อนที่อยู่;
raw commit SHA ไม่สามารถเป็น workflow dispatch refs ได้ ดังนั้นให้ใช้
`pnpm ci:full-release --sha <sha>` เพื่อสร้าง branch ชั่วคราวที่ pin ไว้

ใช้ `release_profile` เพื่อเลือกขอบเขต live/provider:

- `minimum`: OpenAI/core live และ Docker path ที่เร็วที่สุดและสำคัญต่อรีลีส
- `stable`: minimum บวก stable provider/backend coverage สำหรับการอนุมัติรีลีส
- `full`: stable บวก broad advisory provider/media coverage

`OpenClaw Release Checks` ใช้ trusted workflow ref เพื่อ resolve target
ref หนึ่งครั้งเป็น `release-package-under-test` และใช้ artifact นั้นซ้ำทั้งใน
release-path Docker checks และ Package Acceptance วิธีนี้ทำให้กล่องที่เกี่ยวกับแพ็กเกจทั้งหมด
อยู่บน bytes เดียวกัน และหลีกเลี่ยงการ build แพ็กเกจซ้ำ
OpenAI install smoke แบบ cross-OS ใช้ `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อมีการตั้งค่า
ตัวแปร repo/org มิฉะนั้นจะใช้ `openai/gpt-5.4` เพราะ lane นี้กำลัง
พิสูจน์การติดตั้งแพ็กเกจ, onboarding, การเริ่มต้น Gateway และ agent turn แบบ live หนึ่งครั้ง
ไม่ใช่การ benchmark โมเดล default ที่ช้าที่สุด เมทริกซ์ live provider
ที่กว้างกว่ายังคงเป็นที่สำหรับ coverage เฉพาะโมเดล

ใช้ variant เหล่านี้ตามระยะของรีลีส:

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

อย่าใช้ umbrella แบบเต็มเป็นการ rerun ครั้งแรกหลังการแก้ไขแบบเจาะจง หากกล่องหนึ่ง
ล้มเหลว ให้ใช้ child workflow, job, Docker lane, package profile, model
provider หรือ QA lane ที่ล้มเหลวสำหรับ proof ถัดไป รัน umbrella เต็มอีกครั้งเฉพาะเมื่อ
การแก้ไขเปลี่ยน release orchestration ที่ใช้ร่วมกัน หรือทำให้ evidence แบบ all-box ก่อนหน้า
ล้าสมัย verifier สุดท้ายของ umbrella จะตรวจซ้ำ workflow run
ids ของ child ที่บันทึกไว้ ดังนั้นหลังจาก child workflow ถูก rerun จนสำเร็จแล้ว ให้ rerun เฉพาะ
parent job `Verify full validation` ที่ล้มเหลว

สำหรับ recovery แบบมีขอบเขต ให้ส่ง `rerun_group` ไปยัง umbrella `all` คือการรัน
release-candidate จริง, `ci` รันเฉพาะ child ของ normal CI, `plugin-prerelease`
รันเฉพาะ child ของ plugin สำหรับ release เท่านั้น, `release-checks` รันทุก release
box และ release groups ที่แคบกว่าคือ `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` และ `npm-telegram`
การ rerun `npm-telegram` แบบเจาะจงต้องมี `npm_telegram_package_spec`; การรัน full/all
ที่มี `release_profile=full` จะใช้ release-checks package artifact

### Vitest

กล่อง Vitest คือ child workflow `CI` แบบ manual Manual CI ตั้งใจ
ข้าม changed scoping และบังคับ test graph ปกติสำหรับ release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android และ Control UI i18n

ใช้กล่องนี้เพื่อตอบว่า "source tree ผ่าน test suite ปกติแบบเต็มหรือไม่?"
มันไม่เหมือนกับ release-path product validation หลักฐานที่ควรเก็บ:

- สรุป `Full Release Validation` ที่แสดง URL ของ run `CI` ที่ dispatch แล้ว
- run `CI` เป็นสีเขียวบน target SHA ที่แน่นอน
- ชื่อ shard ที่ล้มเหลวหรือช้าจากงาน CI เมื่อตรวจสอบ regression
- timing artifacts ของ Vitest เช่น `.artifacts/vitest-shard-timings.json` เมื่อ
  run ต้องการการวิเคราะห์ประสิทธิภาพ

รัน manual CI โดยตรงเฉพาะเมื่อรีลีสต้องการ normal CI ที่ deterministic แต่
ไม่ต้องใช้ Docker, QA Lab, live, cross-OS หรือ package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

กล่อง Docker อยู่ใน `OpenClaw Release Checks` ผ่าน
`openclaw-live-and-e2e-checks-reusable.yml` รวมถึงเวิร์กโฟลว์ `install-smoke`
แบบ release-mode มันตรวจสอบ release candidate ผ่าน packaged
Docker environments แทนที่จะเป็นเฉพาะ source-level tests

Release Docker coverage รวมถึง:

- full install smoke พร้อมเปิดใช้ slow Bun global install smoke
- การเตรียม/ใช้ซ้ำ root Dockerfile smoke image ตาม target SHA โดยมีงาน QR,
  root/gateway และ installer/Bun smoke ทำงานเป็น install-smoke shards แยกกัน
- repository E2E lanes
- release-path Docker chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` และ `plugins-runtime-install-h`
- OpenWebUI coverage ภายใน chunk `plugins-runtime-services` เมื่อมีการร้องขอ
- split bundled plugin install/uninstall lanes
  `bundled-plugin-install-uninstall-0` ถึง
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites และ Docker live model coverage เมื่อ release checks
  รวม live suites

ใช้ Docker artifacts ก่อน rerun release-path scheduler จะอัปโหลด
`.artifacts/docker-tests/` พร้อม lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON และคำสั่ง rerun สำหรับ recovery แบบเจาะจง
ให้ใช้ `docker_lanes=<lane[,lane]>` บนเวิร์กโฟลว์ reusable live/E2E แทนการ
rerun release chunks ทั้งหมด คำสั่ง rerun ที่สร้างขึ้นมี
`package_artifact_run_id` ก่อนหน้าและ prepared Docker image inputs เมื่อพร้อมใช้งาน ดังนั้น
lane ที่ล้มเหลวสามารถใช้ tarball และ GHCR images เดียวกันซ้ำได้

### QA Lab

กล่อง QA Lab เป็นส่วนหนึ่งของ `OpenClaw Release Checks` เช่นกัน มันคือ gate สำหรับ
พฤติกรรมแบบ agentic และระดับ channel ของรีลีส แยกจาก Vitest และกลไกแพ็กเกจของ Docker

Release QA Lab coverage รวมถึง:

- mock parity lane ที่เปรียบเทียบ OpenAI candidate lane กับ baseline Opus 4.6
  โดยใช้ agentic parity pack
- fast live Matrix QA profile ที่ใช้ environment `qa-live-shared`
- live Telegram QA lane ที่ใช้ Convex CI credential leases
- `pnpm qa:otel:smoke` เมื่อ release telemetry ต้องการ proof แบบ local ที่ชัดเจน

ใช้กล่องนี้เพื่อตอบว่า "รีลีสทำงานถูกต้องใน QA scenarios และ
live channel flows หรือไม่?" เก็บ artifact URLs สำหรับ parity, Matrix และ Telegram
lanes เมื่ออนุมัติรีลีส Full Matrix coverage ยังคงพร้อมใช้งานในฐานะ
manual sharded QA-Lab run แทนที่จะเป็น lane default ที่สำคัญต่อรีลีส

### แพ็กเกจ

กล่อง Package คือ gate ของผลิตภัณฑ์ที่ติดตั้งได้ มี
`Package Acceptance` และ resolver
`scripts/resolve-openclaw-package-candidate.mjs` รองรับ resolver จะ normalize
candidate ให้เป็น tarball `package-under-test` ที่ Docker E2E ใช้, ตรวจสอบ
package inventory, บันทึก package version และ SHA-256 และแยก
workflow harness ref ออกจาก package source ref

แหล่ง candidate ที่รองรับ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรีลีส OpenClaw ที่แน่นอน
- `source=ref`: pack branch, tag หรือ full commit SHA ของ `package_ref` ที่เชื่อถือได้
  ด้วย harness `workflow_ref` ที่เลือก
- `source=url`: ดาวน์โหลด HTTPS `.tgz` พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: ใช้ `.tgz` ที่อัปโหลดโดย GitHub Actions run อื่นซ้ำ

`OpenClaw Release Checks` รัน Package Acceptance ด้วย `source=artifact`,
prepared release package artifact, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` และ
`telegram_mode=mock-openai` Package Acceptance ทำให้ migration, update, การ cleanup stale
plugin dependency, offline plugin fixtures, plugin update และ Telegram
package QA ใช้ tarball ที่ resolve แล้วเดียวกัน เมทริกซ์ upgrade ครอบคลุมทุก baseline ที่เผยแพร่บน npm แบบ stable ตั้งแต่ `2026.4.23` ถึง `latest`; ใช้
Package Acceptance พร้อม `source=npm` สำหรับ candidate ที่ shipped แล้ว หรือ
`source=ref`/`source=artifact` สำหรับ tarball npm แบบ local ที่มี SHA รองรับก่อน
publish นี่คือ replacement แบบ GitHub-native
สำหรับ coverage package/update ส่วนใหญ่ที่ก่อนหน้านี้ต้องใช้
Parallels Cross-OS release checks ยังคงสำคัญสำหรับ onboarding,
installer และ platform behavior เฉพาะ OS แต่ package/update product validation ควร
เลือกใช้ Package Acceptance

เช็กลิสต์ canonical สำหรับ update และ Plugin validation คือ
[การทดสอบ updates และ plugins](/th/help/testing-updates-plugins) ใช้เมื่อตัดสินใจว่า
lane แบบ local, Docker, Package Acceptance หรือ release-check ใดพิสูจน์การ
ติดตั้ง/update Plugin, doctor cleanup หรือการเปลี่ยนแปลง migration ของแพ็กเกจที่เผยแพร่แล้ว
การ migration ของ published update แบบ exhaustive จากทุกแพ็กเกจ stable `2026.4.23+` เป็น
เวิร์กโฟลว์ manual `Update Migration` แยกต่างหาก ไม่ใช่ส่วนหนึ่งของ Full Release CI

ความผ่อนปรน legacy package-acceptance ถูกจำกัดเวลาด้วยความตั้งใจ แพ็กเกจจนถึง
`2026.4.25` อาจใช้ compatibility path สำหรับช่องว่าง metadata ที่เผยแพร่แล้ว
ไปยัง npm: รายการ private QA inventory ที่หายไปจาก tarball, ไม่มี
`gateway install --wrapper`, ไม่มี patch files ใน git
fixture ที่ได้จาก tarball, ไม่มี `update.channel` ที่ persisted, ตำแหน่ง legacy plugin install-record,
ไม่มี marketplace install-record persistence และ config metadata
migration ระหว่าง `plugins update` แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจ warn
สำหรับ local build metadata stamp files ที่ shipped ไปแล้ว แพ็กเกจหลังจากนั้น
ต้องเป็นไปตาม package contracts สมัยใหม่; ช่องว่างเดียวกันเหล่านั้นทำให้ release
validation ล้มเหลว

ใช้ Package Acceptance profiles ที่กว้างขึ้นเมื่อคำถามของรีลีสเกี่ยวกับ
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

- `smoke`: lanes สำหรับการติดตั้งแพ็กเกจ/channel/agent แบบเร็ว, gateway network และ config
  reload
- `package`: สัญญา install/update/plugin package โดยไม่มี live ClawHub; นี่คือค่า default ของ release-check
- `product`: `package` บวก MCP channels, cron/subagent cleanup, OpenAI web
  search และ OpenWebUI
- `full`: Docker release-path chunks พร้อม OpenWebUI
- `custom`: รายการ `docker_lanes` ที่แน่นอนสำหรับ rerun แบบเจาะจง

สำหรับหลักฐาน Telegram ของ package candidate ให้เปิดใช้ `telegram_mode=mock-openai` หรือ
`telegram_mode=live-frontier` บน Package Acceptance เวิร์กโฟลว์จะส่ง tarball
`package-under-test` ที่ resolve แล้วเข้าสู่เลน Telegram ส่วนเวิร์กโฟลว์ Telegram แบบสแตนด์อโลน
ยังคงรับสเปก npm ที่เผยแพร่แล้วสำหรับการตรวจหลังเผยแพร่

## ระบบอัตโนมัติสำหรับการเผยแพร่รีลีส

`OpenClaw Release Publish` คือ entrypoint การเผยแพร่แบบเปลี่ยนแปลงสถานะตามปกติ โดยจะ
ประสานงานเวิร์กโฟลว์ trusted-publisher ตามลำดับที่รีลีสต้องใช้:

1. Checkout แท็กรีลีสและ resolve commit SHA ของแท็กนั้น
2. ตรวจสอบว่าแท็กเข้าถึงได้จาก `main` หรือ `release/*`
3. รัน `pnpm plugins:sync:check`
4. Dispatch `Plugin NPM Release` ด้วย `publish_scope=all-publishable` และ
   `ref=<release-sha>`
5. Dispatch `Plugin ClawHub Release` ด้วย scope และ SHA เดียวกัน
6. Dispatch `OpenClaw NPM Release` ด้วยแท็กรีลีส, npm dist-tag และ
   `preflight_run_id` ที่บันทึกไว้

ตัวอย่างการเผยแพร่ Beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

ตัวอย่างการเผยแพร่ Alpha:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-alpha.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=alpha
```

การเผยแพร่ Stable ไปยัง beta dist-tag เริ่มต้น:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

การ promote Stable ไปยัง `latest` โดยตรงต้องระบุอย่างชัดเจน:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

ใช้เวิร์กโฟลว์ระดับล่าง `Plugin NPM Release` และ `Plugin ClawHub Release`
เฉพาะงานซ่อมเฉพาะจุดหรือเผยแพร่ซ้ำเท่านั้น สำหรับการซ่อม Plugin ที่เลือกไว้ ให้ส่ง
`plugin_publish_scope=selected` และ `plugins=@openclaw/name` ไปยัง
`OpenClaw Release Publish` หรือ dispatch เวิร์กโฟลว์ลูกโดยตรงเมื่อไม่ควรเผยแพร่
แพ็กเกจ OpenClaw

## อินพุตเวิร์กโฟลว์ NPM

`OpenClaw NPM Release` รับอินพุตที่ operator ควบคุมได้ดังนี้:

- `tag`: แท็กรีลีสที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1` หรือ
  `v2026.4.2-alpha.1` หรือ `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` อาจเป็น
  commit SHA แบบเต็ม 40 อักขระของ workflow-branch ปัจจุบันสำหรับ preflight เพื่อการตรวจสอบเท่านั้นได้ด้วย
- `preflight_only`: `true` สำหรับการตรวจสอบ/build/package เท่านั้น, `false` สำหรับเส้นทาง
  เผยแพร่จริง
- `preflight_run_id`: จำเป็นบนเส้นทางเผยแพร่จริง เพื่อให้เวิร์กโฟลว์ใช้ tarball
  ที่เตรียมไว้จาก preflight run ที่สำเร็จซ้ำ
- `npm_dist_tag`: แท็กเป้าหมายของ npm สำหรับเส้นทางเผยแพร่; ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Publish` รับอินพุตที่ operator ควบคุมได้ดังนี้:

- `tag`: แท็กรีลีสที่จำเป็น; ต้องมีอยู่แล้ว
- `preflight_run_id`: run id ของ preflight `OpenClaw NPM Release` ที่สำเร็จ;
  จำเป็นเมื่อ `publish_openclaw_npm=true`
- `npm_dist_tag`: แท็กเป้าหมายของ npm สำหรับแพ็กเกจ OpenClaw
- `plugin_publish_scope`: ค่าเริ่มต้นคือ `all-publishable`; ใช้ `selected` เฉพาะ
  งานซ่อมเฉพาะจุดเท่านั้น
- `plugins`: ชื่อแพ็กเกจ `@openclaw/*` คั่นด้วยจุลภาคเมื่อ
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: ค่าเริ่มต้นคือ `true`; ตั้งเป็น `false` เฉพาะเมื่อใช้
  เวิร์กโฟลว์เป็นตัวประสานงานการซ่อมเฉพาะ Plugin เท่านั้น

`OpenClaw Release Checks` รับอินพุตที่ operator ควบคุมได้ดังนี้:

- `ref`: branch, tag หรือ commit SHA แบบเต็มที่จะตรวจสอบ เช็คที่มี secret
  ต้องให้ commit ที่ resolve แล้วเข้าถึงได้จาก branch ของ OpenClaw หรือ
  release tag

กฎ:

- แท็ก Stable และแท็ก correction อาจเผยแพร่ไปยัง `beta` หรือ `latest` ได้
- แท็ก prerelease แบบ Alpha อาจเผยแพร่ได้เฉพาะไปยัง `alpha`
- แท็ก prerelease แบบ Beta อาจเผยแพร่ได้เฉพาะไปยัง `beta`
- สำหรับ `OpenClaw NPM Release` อนุญาตให้อินพุตเป็น commit SHA แบบเต็มได้เฉพาะเมื่อ
  `preflight_only=true`
- `OpenClaw Release Checks` และ `Full Release Validation` เป็นการตรวจสอบเท่านั้นเสมอ
- เส้นทางเผยแพร่จริงต้องใช้ `npm_dist_tag` เดียวกับที่ใช้ระหว่าง preflight;
  เวิร์กโฟลว์จะตรวจสอบ metadata นั้นก่อนดำเนินการเผยแพร่ต่อ

## ลำดับการรีลีส npm แบบ Stable

เมื่อสร้าง npm release แบบ Stable:

1. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนมีแท็ก คุณอาจใช้ commit SHA แบบเต็มของ workflow-branch ปัจจุบัน
     สำหรับ dry run แบบตรวจสอบเท่านั้นของเวิร์กโฟลว์ preflight
2. เลือก `npm_dist_tag=beta` สำหรับ flow ปกติแบบ beta-first หรือ `latest` เฉพาะ
   เมื่อคุณตั้งใจเผยแพร่ Stable โดยตรง
3. รัน `Full Release Validation` บน release branch, release tag หรือ commit SHA แบบเต็ม
   เมื่อคุณต้องการ CI ปกติพร้อมความครอบคลุมของ live prompt cache, Docker, QA Lab,
   Matrix และ Telegram จากเวิร์กโฟลว์ manual เดียว
4. หากคุณตั้งใจต้องการเฉพาะกราฟการทดสอบปกติแบบ deterministic ให้รันเวิร์กโฟลว์ manual
   `CI` บน release ref แทน
5. บันทึก `preflight_run_id` ที่สำเร็จ
6. รัน `OpenClaw Release Publish` ด้วย `tag` เดียวกัน, `npm_dist_tag` เดียวกัน
   และ `preflight_run_id` ที่บันทึกไว้; เวิร์กโฟลว์นี้เผยแพร่ Plugin ที่ externalized แล้วไปยัง npm
   และ ClawHub ก่อน promote แพ็กเกจ OpenClaw npm
7. หากรีลีสลงที่ `beta` ให้ใช้เวิร์กโฟลว์ส่วนตัว
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   เพื่อ promote เวอร์ชัน Stable นั้นจาก `beta` ไปยัง `latest`
8. หากรีลีสตั้งใจเผยแพร่โดยตรงไปยัง `latest` และ `beta`
   ควรตาม build Stable เดียวกันทันที ให้ใช้เวิร์กโฟลว์ส่วนตัวเดียวกันนั้น
   เพื่อชี้ dist-tag ทั้งสองไปยังเวอร์ชัน Stable หรือปล่อยให้ sync self-healing ตามกำหนดเวลา
   ย้าย `beta` ภายหลัง

การเปลี่ยนแปลง dist-tag อยู่ใน repo ส่วนตัวเพื่อความปลอดภัย เพราะยังต้องใช้
`NPM_TOKEN` ในขณะที่ repo สาธารณะคงการเผยแพร่แบบ OIDC-only ไว้

สิ่งนี้ทำให้ทั้งเส้นทางเผยแพร่โดยตรงและเส้นทาง promote แบบ beta-first
มีเอกสารและมองเห็นได้สำหรับ operator

หาก maintainer ต้อง fallback ไปใช้การยืนยันตัวตน npm แบบ local ให้รันคำสั่ง
1Password CLI (`op`) ใดๆ เฉพาะภายใน tmux session เฉพาะเท่านั้น อย่าเรียก `op`
โดยตรงจาก shell หลักของ agent; การเก็บไว้ใน tmux ทำให้ prompt,
alert และการจัดการ OTP สังเกตได้ และป้องกัน alert จาก host ซ้ำๆ

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

- [ช่องทางรีลีส](/th/install/development-channels)
