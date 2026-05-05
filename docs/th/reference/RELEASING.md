---
read_when:
    - กำลังค้นหานิยามของช่องทางเผยแพร่สาธารณะ
    - การเรียกใช้การตรวจสอบความถูกต้องของรีลีสหรือการยอมรับแพ็กเกจ
    - กำลังมองหารูปแบบการตั้งชื่อเวอร์ชันและรอบการออกรุ่น
summary: เลนการเผยแพร่ รายการตรวจสอบสำหรับผู้ปฏิบัติงาน กล่องตรวจสอบความถูกต้อง การตั้งชื่อเวอร์ชัน และรอบการออกเผยแพร่
title: นโยบายการเผยแพร่รุ่น
x-i18n:
    generated_at: "2026-05-05T06:19:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9980265c30c6a6571db5512749ec173cca79ac70494fd09968add793be9717a5
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw มีช่องทางเผยแพร่สาธารณะสามช่องทาง:

- เสถียร: รุ่นเผยแพร่ที่ติดแท็ก ซึ่งเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อมีการร้องขออย่างชัดเจน
- เบต้า: แท็กก่อนเผยแพร่ที่เผยแพร่ไปยัง npm `beta`
- พัฒนา: หัวล่าสุดที่เปลี่ยนแปลงอยู่ของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันรุ่นเผยแพร่เสถียร: `YYYY.M.D`
  - แท็ก Git: `vYYYY.M.D`
- เวอร์ชันรุ่นแก้ไขเสถียร: `YYYY.M.D-N`
  - แท็ก Git: `vYYYY.M.D-N`
- เวอร์ชันก่อนเผยแพร่เบต้า: `YYYY.M.D-beta.N`
  - แท็ก Git: `vYYYY.M.D-beta.N`
- อย่าเติมศูนย์นำหน้าเดือนหรือวัน
- `latest` หมายถึงรุ่นเผยแพร่ npm เสถียรที่เลื่อนสถานะอยู่ในปัจจุบัน
- `beta` หมายถึงเป้าหมายการติดตั้งเบต้าปัจจุบัน
- รุ่นเผยแพร่เสถียรและรุ่นแก้ไขเสถียรเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น ผู้ปฏิบัติการเผยแพร่สามารถกำหนดเป้าหมายเป็น `latest` ได้อย่างชัดเจน หรือเลื่อนสถานะบิลด์เบต้าที่ตรวจสอบแล้วในภายหลัง
- รุ่นเผยแพร่ OpenClaw เสถียรทุกตัวจะส่งมาพร้อมแพ็กเกจ npm และแอป macOS ด้วยกัน;
  รุ่นเบต้าปกติจะตรวจสอบและเผยแพร่เส้นทาง npm/แพ็กเกจก่อน โดยสงวนการบิลด์/เซ็น/โนทาไรซ์แอป
  Mac ไว้สำหรับรุ่นเสถียร เว้นแต่จะมีการร้องขออย่างชัดเจน

## จังหวะการเผยแพร่

- การเผยแพร่จะดำเนินไปแบบเบต้าก่อน
- รุ่นเสถียรจะตามมาหลังจากตรวจสอบเบต้าล่าสุดแล้วเท่านั้น
- ปกติผู้ดูแลจะตัดรุ่นจากสาขา `release/YYYY.M.D` ที่สร้าง
  จาก `main` ปัจจุบัน เพื่อให้การตรวจสอบและการแก้ไขรุ่นเผยแพร่ไม่บล็อกการพัฒนาใหม่
  บน `main`
- หากแท็กเบต้าถูกพุชหรือเผยแพร่แล้วและต้องแก้ไข ผู้ดูแลจะตัดแท็ก
  `-beta.N` ถัดไปแทนการลบหรือสร้างแท็กเบต้าเดิมใหม่
- ขั้นตอนการเผยแพร่โดยละเอียด การอนุมัติ ข้อมูลรับรอง และหมายเหตุการกู้คืน
  จำกัดเฉพาะผู้ดูแลเท่านั้น

## รายการตรวจสอบของผู้ปฏิบัติการเผยแพร่

รายการตรวจสอบนี้คือรูปแบบสาธารณะของโฟลว์การเผยแพร่ ข้อมูลรับรองส่วนตัว
การเซ็น การโนทาไรซ์ การกู้คืน dist-tag และรายละเอียดการย้อนกลับฉุกเฉินจะอยู่ใน
คู่มือการเผยแพร่สำหรับผู้ดูแลเท่านั้น

1. เริ่มจาก `main` ปัจจุบัน: ดึงข้อมูลล่าสุด ยืนยันว่าคอมมิตเป้าหมายถูกพุชแล้ว
   และยืนยันว่า CI ของ `main` ปัจจุบันเขียวพอที่จะสร้างสาขาจากจุดนั้น
2. เขียนส่วนบนสุดของ `CHANGELOG.md` ใหม่จากประวัติคอมมิตจริงด้วย
   `/changelog` ให้รายการเป็นเรื่องที่ผู้ใช้เห็นได้ คอมมิต พุช และ rebase/pull
   อีกครั้งก่อนสร้างสาขา
3. ตรวจสอบบันทึกความเข้ากันได้ของรุ่นเผยแพร่ใน
   `src/plugins/compat/registry.ts` และ
   `src/commands/doctor/shared/deprecation-compat.ts` ลบความเข้ากันได้ที่หมดอายุ
   เฉพาะเมื่อเส้นทางอัปเกรดยังครอบคลุมอยู่ หรือบันทึกเหตุผลว่าทำไมจึงตั้งใจคงไว้
4. สร้าง `release/YYYY.M.D` จาก `main` ปัจจุบัน อย่าทำงานเผยแพร่ปกติ
   โดยตรงบน `main`
5. เพิ่มเวอร์ชันในทุกตำแหน่งที่จำเป็นสำหรับแท็กที่ตั้งใจไว้ รัน
   `pnpm plugins:sync` เพื่อให้แพ็กเกจ Plugin ที่เผยแพร่ได้ใช้เวอร์ชันเผยแพร่
   และเมตาดาต้าความเข้ากันได้ร่วมกัน จากนั้นรัน preflight แบบกำหนดแน่นอนในเครื่อง:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` และ
   `pnpm release:check`
6. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true` ก่อนมีแท็ก
   อนุญาตให้ใช้ SHA แบบเต็ม 40 อักขระของสาขาเผยแพร่สำหรับ preflight
   แบบตรวจสอบเท่านั้น บันทึก `preflight_run_id` ที่สำเร็จ
7. เริ่มการทดสอบก่อนเผยแพร่ทั้งหมดด้วย `Full Release Validation` สำหรับ
   สาขาเผยแพร่ แท็ก หรือ SHA คอมมิตแบบเต็ม นี่คือจุดเข้าด้วยมือเพียงจุดเดียว
   สำหรับกล่องทดสอบรุ่นเผยแพร่ขนาดใหญ่สี่รายการ: Vitest, Docker, QA Lab และ Package
8. หากการตรวจสอบล้มเหลว ให้แก้บนสาขาเผยแพร่และรันไฟล์ เลน งานเวิร์กโฟลว์
   โปรไฟล์แพ็กเกจ ผู้ให้บริการ หรือรายการอนุญาตโมเดลที่ล้มเหลวที่เล็กที่สุดอีกครั้ง
   ซึ่งพิสูจน์การแก้ไขได้ รัน umbrella เต็มอีกครั้งเฉพาะเมื่อพื้นผิวที่เปลี่ยนทำให้
   หลักฐานเดิมล้าสมัย
9. สำหรับเบต้า ให้แท็ก `vYYYY.M.D-beta.N` จากนั้นรัน `OpenClaw Release Publish` จาก
   สาขา `release/YYYY.M.D` ที่ตรงกัน โดยจะตรวจสอบ `pnpm plugins:sync:check`
   เผยแพร่แพ็กเกจ Plugin ที่เผยแพร่ได้ทั้งหมดไปยัง npm ก่อน เผยแพร่ชุดเดียวกัน
   ไปยัง ClawHub เป็นลำดับที่สองในรูปแบบทาร์บอล ClawPack npm-pack จากนั้นเลื่อนสถานะ
   อาร์ติแฟกต์ preflight ของ OpenClaw npm ที่เตรียมไว้ด้วย dist-tag ที่ตรงกัน หลังเผยแพร่
   ให้รันการยอมรับแพ็กเกจหลังเผยแพร่กับแพ็กเกจ
   `openclaw@YYYY.M.D-beta.N` หรือ
   `openclaw@beta` ที่เผยแพร่แล้ว หาก prerelease ที่ถูกพุชหรือเผยแพร่แล้วต้องแก้ไข
   ให้ตัดหมายเลข prerelease ถัดไปที่ตรงกัน อย่าลบหรือเขียน prerelease เดิมใหม่
10. สำหรับรุ่นเสถียร ให้ดำเนินต่อเฉพาะหลังจากเบต้าหรือ release candidate ที่ตรวจสอบแล้วมี
    หลักฐานการตรวจสอบที่จำเป็น การเผยแพร่ npm เสถียรจะผ่าน
    `OpenClaw Release Publish` เช่นกัน โดยนำอาร์ติแฟกต์ preflight ที่สำเร็จกลับมาใช้ผ่าน
    `preflight_run_id`; ความพร้อมของรุ่นเผยแพร่ macOS เสถียรยังต้องมี
    `.zip`, `.dmg`, `.dSYM.zip` ที่แพ็กแล้ว และ `appcast.xml` ที่อัปเดตบน `main`
11. หลังเผยแพร่ ให้รันตัวตรวจสอบหลังเผยแพร่ของ npm, Telegram E2E จาก npm ที่เผยแพร่แบบสแตนด์อโลน
    ที่เป็นทางเลือกเมื่อคุณต้องการหลักฐานช่องทางหลังเผยแพร่,
    การเลื่อนสถานะ dist-tag เมื่อจำเป็น, โน้ต GitHub release/prerelease จากส่วน
    `CHANGELOG.md` ที่ตรงกันครบถ้วน และขั้นตอนการประกาศรุ่นเผยแพร่

## Preflight รุ่นเผยแพร่

- รัน `pnpm check:test-types` ก่อนการตรวจสอบก่อนเผยแพร่ release เพื่อให้ TypeScript ของชุดทดสอบยังคง
  ครอบคลุมอยู่นอก gate `pnpm check` แบบ local ที่เร็วกว่า
- รัน `pnpm check:architecture` ก่อนการตรวจสอบก่อนเผยแพร่ release เพื่อให้การตรวจสอบวงจรการ import
  และขอบเขตสถาปัตยกรรมที่กว้างขึ้นผ่านเป็นสีเขียวอยู่นอก gate แบบ local ที่เร็วกว่า
- รัน `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้ artifact สำหรับ release
  `dist/*` ที่คาดไว้และ bundle ของ Control UI มีอยู่สำหรับขั้นตอนการตรวจสอบ pack
- รัน `pnpm plugins:sync` หลังจาก bump เวอร์ชันที่ root และก่อน tag คำสั่งนี้
  อัปเดตเวอร์ชันแพ็กเกจ Plugin ที่ publish ได้, metadata ความเข้ากันได้ของ peer/API ของ OpenClaw,
  build metadata และ stub changelog ของ Plugin ให้ตรงกับเวอร์ชัน release ของ core
  `pnpm plugins:sync:check` คือ guard สำหรับ release แบบไม่แก้ไขไฟล์;
  workflow การ publish จะล้มเหลวก่อนมีการเปลี่ยนแปลง registry ใด ๆ หากลืมขั้นตอนนี้
- รัน workflow แบบ manual `Full Release Validation` ก่อนอนุมัติ release เพื่อ
  เริ่ม test box ก่อน release ทั้งหมดจาก entrypoint เดียว workflow นี้รับ branch,
  tag หรือ commit SHA แบบเต็ม, dispatch `CI` แบบ manual และ dispatch
  `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, การตรวจสอบแพ็กเกจข้าม OS,
  QA Lab parity, Matrix และ lane ของ Telegram การรันแบบ stable/default
  จะเก็บ live/E2E แบบละเอียดและ Docker release-path soak ไว้หลัง
  `run_release_soak=true`; `release_profile=full` จะบังคับเปิด soak เมื่อใช้
  `release_profile=full` และ `rerun_group=all` จะรัน package Telegram
  E2E กับ artifact `release-package-under-test` จาก release checks ด้วย
  ระบุ `npm_telegram_package_spec` หลัง publish เมื่อต้องการให้ Telegram E2E เดียวกัน
  พิสูจน์แพ็กเกจ npm ที่ publish แล้วด้วย ระบุ
  `package_acceptance_package_spec` หลัง publish เมื่อ Package Acceptance
  ควรรันเมทริกซ์ package/update กับแพ็กเกจ npm ที่ส่งออกแล้วแทน
  artifact ที่ build จาก SHA ระบุ
  `evidence_package_spec` เมื่อรายงานหลักฐานแบบ private ควรพิสูจน์ว่า
  การตรวจสอบตรงกับแพ็กเกจ npm ที่ publish แล้วโดยไม่บังคับ Telegram E2E
  ตัวอย่าง:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- รัน workflow แบบ manual `Package Acceptance` เมื่อต้องการหลักฐานช่องทางเสริม
  สำหรับ candidate ของแพ็กเกจระหว่างที่งาน release ยังดำเนินต่อ ใช้ `source=npm` สำหรับ
  `openclaw@beta`, `openclaw@latest` หรือเวอร์ชัน release ที่ระบุชัดเจน; ใช้ `source=ref`
  เพื่อ pack branch/tag/SHA ของ `package_ref` ที่เชื่อถือได้ด้วย harness
  `workflow_ref` ปัจจุบัน; ใช้ `source=url` สำหรับ tarball HTTPS ที่ต้องมี
  SHA-256; หรือใช้ `source=artifact` สำหรับ tarball ที่อัปโหลดโดย GitHub
  Actions run อื่น workflow จะ resolve candidate เป็น
  `package-under-test`, นำ scheduler ของ Docker E2E release มาใช้ซ้ำกับ
  tarball นั้น และสามารถรัน Telegram QA กับ tarball เดียวกันด้วย
  `telegram_mode=mock-openai` หรือ `telegram_mode=live-frontier` เมื่อ
  lane ของ Docker ที่เลือกมี `published-upgrade-survivor` artifact ของแพ็กเกจ
  จะเป็น candidate และ `published_upgrade_survivor_baseline` จะเลือก
  baseline ที่ publish แล้ว `update-restart-auth` ใช้แพ็กเกจ candidate เป็น
  ทั้ง CLI ที่ติดตั้งและ package-under-test เพื่อให้ทดสอบ path การ restart แบบ managed
  ของคำสั่ง update ของ candidate
  ตัวอย่าง: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  profile ทั่วไป:
  - `smoke`: lane สำหรับ install/channel/agent, gateway network และ config reload
  - `package`: lane package/update/restart/plugin ที่อิง artifact โดยตรง โดยไม่มี OpenWebUI หรือ ClawHub แบบ live
  - `product`: profile package พร้อมช่องทาง MCP, การล้าง cron/subagent,
    OpenAI web search และ OpenWebUI
  - `full`: ชุด Docker release-path พร้อม OpenWebUI
  - `custom`: การเลือก `docker_lanes` แบบเจาะจงสำหรับ rerun ที่โฟกัส
- รัน workflow แบบ manual `CI` โดยตรงเมื่อคุณต้องการเพียง coverage ของ CI ปกติแบบเต็ม
  สำหรับ release candidate การ dispatch CI แบบ manual จะข้าม changed
  scoping และบังคับ lane ของ Linux Node shards, bundled-plugin shards, channel
  contracts, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke,
  docs checks, Python skills, Windows, macOS, Android และ Control UI i18n
  ตัวอย่าง: `gh workflow run ci.yml --ref release/YYYY.M.D`
- รัน `pnpm qa:otel:smoke` เมื่อตรวจสอบ telemetry ของ release คำสั่งนี้ทดสอบ
  QA-lab ผ่านตัวรับ OTLP/HTTP แบบ local และตรวจสอบชื่อ trace
  span ที่ export แล้ว, attribute ที่มีขอบเขต และการ redact เนื้อหา/identifier โดยไม่ต้องใช้
  Opik, Langfuse หรือตัวรวบรวมภายนอกอื่น
- รัน `pnpm release:check` ก่อนทุก tagged release
- รัน `OpenClaw Release Publish` สำหรับลำดับการ publish ที่มีการเปลี่ยนแปลงหลังจาก
  tag มีอยู่แล้ว Dispatch จาก `release/YYYY.M.D` (หรือ `main` เมื่อ publish
  tag ที่ reachable จาก main), ส่ง release tag และ OpenClaw npm
  `preflight_run_id` ที่สำเร็จ และคงค่าเริ่มต้นของขอบเขต publish Plugin
  `all-publishable` เว้นแต่คุณตั้งใจรันการซ่อมแซมแบบเจาะจง workflow จะ serialize
  การ publish Plugin ไปยัง npm, การ publish Plugin ไปยัง ClawHub และการ publish OpenClaw
  ไปยัง npm เพื่อไม่ให้แพ็กเกจ core ถูก publish ก่อน Plugin ที่ externalized แล้ว
- Release checks ตอนนี้รันใน workflow แบบ manual แยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรัน lane QA Lab mock parity พร้อม profile Matrix แบบ live ที่รวดเร็ว
  และ lane Telegram QA ก่อนอนุมัติ release ด้วย lane แบบ live
  ใช้ environment `qa-live-shared`; Telegram ยังใช้ credential lease ของ Convex CI
  ด้วย รัน workflow แบบ manual `QA-Lab - All Lanes` ด้วย
  `matrix_profile=all` และ `matrix_shards=true` เมื่อต้องการ inventory ของ
  Matrix transport, media และ E2EE แบบเต็มในแบบขนาน
- การตรวจสอบ runtime สำหรับการติดตั้งและอัปเกรดข้าม OS เป็นส่วนหนึ่งของ
  `OpenClaw Release Checks` และ `Full Release Validation` แบบ public ซึ่งเรียก
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` โดยตรง
- การแยกนี้ตั้งใจทำไว้: รักษา path release npm จริงให้สั้น
  กำหนดได้แน่นอน และโฟกัสที่ artifact ขณะที่การตรวจสอบ live ที่ช้ากว่าอยู่ใน
  lane ของตัวเอง เพื่อไม่ให้ทำให้การ publish ค้างหรือถูกบล็อก
- Release checks ที่มี secret ควรถูก dispatch ผ่าน `Full Release
Validation` หรือจาก workflow ref ของ `main`/release เพื่อให้ logic ของ workflow และ
  secrets ยังคงถูกควบคุม
- `OpenClaw Release Checks` รับ branch, tag หรือ commit SHA แบบเต็ม ตราบใดที่
  commit ที่ resolve แล้ว reachable จาก branch หรือ release tag ของ OpenClaw
- preflight แบบ validation-only ของ `OpenClaw NPM Release` ยังรับ commit SHA แบบเต็ม
  40 อักขระของ workflow-branch ปัจจุบันโดยไม่ต้องมี pushed tag
- path แบบ SHA นั้นเป็นแบบ validation-only และไม่สามารถ promote เป็นการ publish จริงได้
- ในโหมด SHA workflow จะสร้าง `v<package.json version>` ขึ้นมาเฉพาะสำหรับ
  การตรวจสอบ package metadata; การ publish จริงยังต้องใช้ release tag จริง
- ทั้งสอง workflow รักษา path การ publish และ promotion จริงไว้บน runner ที่ GitHub-hosted
  ขณะที่ path การตรวจสอบที่ไม่แก้ไขไฟล์สามารถใช้ runner Linux ของ
  Blacksmith ที่ใหญ่กว่าได้
- workflow นั้นรัน
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ workflow secrets ทั้ง `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- npm release preflight ไม่รอ lane release checks แยกต่างหากอีกต่อไป
- รัน `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือ tag beta/correction ที่ตรงกัน) ก่อนอนุมัติ
- หลัง publish ไปยัง npm ให้รัน
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (หรือเวอร์ชัน beta/correction ที่ตรงกัน) เพื่อตรวจสอบ path การติดตั้งจาก registry
  ที่ publish แล้วใน temp prefix ใหม่
- หลัง publish beta ให้รัน `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  เพื่อตรวจสอบ onboarding ของ installed-package, การตั้งค่า Telegram และ Telegram E2E จริง
  กับแพ็กเกจ npm ที่ publish แล้วโดยใช้ pool credential Telegram แบบ leased ที่ใช้ร่วมกัน
  การรันครั้งเดียวแบบ local ของ maintainer อาจละ Convex vars และส่ง env credentials
  `OPENCLAW_QA_TELEGRAM_*` ทั้งสามรายการโดยตรงได้
- หากต้องการรัน post-publish beta smoke แบบเต็มจากเครื่องของ maintainer ให้ใช้ `pnpm release:beta-smoke -- --beta betaN` helper จะรันการตรวจสอบ npm update/fresh-target ของ Parallels, dispatch `NPM Telegram Beta E2E`, poll workflow run ที่ตรงกัน, ดาวน์โหลด artifact และพิมพ์รายงาน Telegram
- Maintainer สามารถรัน post-publish check เดียวกันจาก GitHub Actions ผ่าน
  workflow แบบ manual `NPM Telegram Beta E2E` ได้ workflow นี้ตั้งใจให้เป็น manual-only และ
  ไม่รันทุกครั้งที่ merge
- ระบบอัตโนมัติ release ของ maintainer ตอนนี้ใช้ preflight-then-promote:
  - การ publish npm จริงต้องผ่าน npm `preflight_run_id` ที่สำเร็จ
  - การ publish npm จริงต้องถูก dispatch จาก branch `main` หรือ
    `release/YYYY.M.D` เดียวกันกับ preflight run ที่สำเร็จ
  - stable npm releases ใช้ค่าเริ่มต้นเป็น `beta`
  - stable npm publish สามารถกำหนดเป้าหมายเป็น `latest` อย่างชัดเจนผ่าน workflow input
  - การเปลี่ยน npm dist-tag แบบใช้ token ตอนนี้อยู่ใน
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    เพื่อความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่
    repo public ใช้การ publish แบบ OIDC-only
  - public `macOS Release` เป็น validation-only; เมื่อ tag อยู่เฉพาะบน
    release branch แต่ workflow ถูก dispatch จาก `main` ให้ตั้งค่า
    `public_release_branch=release/YYYY.M.D`
  - การ publish mac แบบ private จริงต้องผ่าน private mac
    `preflight_run_id` และ `validate_run_id` ที่สำเร็จ
  - path การ publish จริง promote artifact ที่เตรียมไว้แล้วแทนที่จะ rebuild
    อีกครั้ง
- สำหรับ stable correction releases เช่น `YYYY.M.D-N` verifier หลัง publish
  ยังตรวจสอบ path การอัปเกรดแบบ temp-prefix เดียวกันจาก `YYYY.M.D` ไปเป็น `YYYY.M.D-N`
  เพื่อให้ release correction ไม่สามารถปล่อยให้ global install รุ่นเก่ายังคงอยู่บน
  payload stable base อย่างเงียบ ๆ
- npm release preflight จะ fail closed เว้นแต่ tarball จะมีทั้ง
  `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่าง
  เพื่อไม่ให้เราส่ง browser dashboard ที่ว่างเปล่าอีก
- การตรวจสอบหลัง publish ยังตรวจสอบว่า entrypoint ของ Plugin ที่ publish แล้วและ
  package metadata มีอยู่ใน layout ของ registry ที่ติดตั้งแล้ว release ที่
  ส่ง runtime payload ของ Plugin ขาดหายจะล้มเหลวใน postpublish verifier และ
  ไม่สามารถ promote เป็น `latest` ได้
- `pnpm test:install:smoke` ยังบังคับงบ `unpackedSize` ของ npm pack บน
  tarball update candidate ด้วย เพื่อให้ installer e2e จับ pack bloat โดยไม่ตั้งใจ
  ก่อน path การ publish release
- หากงาน release แตะ CI planning, timing manifests ของ Plugin หรือ
  เมทริกซ์ทดสอบของ Plugin ให้ regenerate และ review output เมทริกซ์
  `plugin-prerelease-extension-shard` ที่ planner เป็นเจ้าของจาก
  `.github/workflows/plugin-prerelease.yml` ก่อนอนุมัติ เพื่อให้ release notes
  ไม่อธิบาย layout ของ CI ที่ล้าสมัย
- ความพร้อมของ stable macOS release ยังรวมถึง surface ของ updater:
  - GitHub release ต้องจบลงด้วย `.zip`, `.dmg` และ `.dSYM.zip` ที่จัดแพ็กเกจแล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปยัง stable zip ใหม่หลัง publish
  - app ที่จัดแพ็กเกจแล้วต้องคง bundle id ที่ไม่ใช่ debug, URL ของ Sparkle feed
    ที่ไม่ว่าง และ `CFBundleVersion` ที่เท่ากับหรือสูงกว่า Sparkle build floor
    ตาม canonical สำหรับเวอร์ชัน release นั้น

## Release test boxes

`Full Release Validation` คือวิธีที่ operator ใช้เริ่มการทดสอบก่อน release ทั้งหมดจาก
entrypoint เดียว สำหรับหลักฐาน commit ที่ pin ไว้บน branch ที่เปลี่ยนเร็ว ให้ใช้
helper เพื่อให้ workflow ลูกทุกตัวรันจาก branch ชั่วคราวที่ยึดกับ SHA เป้าหมาย:

```bash
pnpm ci:full-release --sha <full-sha>
```

helper จะ push `release-ci/<sha>-...`, dispatch `Full Release Validation`
จาก branch นั้นด้วย `ref=<sha>`, ตรวจสอบว่า workflow ลูกทุกตัวมี `headSha`
ตรงกับเป้าหมาย แล้วลบ branch ชั่วคราว วิธีนี้หลีกเลี่ยงการพิสูจน์ child run ของ
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

เวิร์กโฟลว์จะแก้ค่า ref เป้าหมาย, dispatch `CI` แบบ manual ด้วย
`target_ref=<release-ref>`, dispatch `OpenClaw Release Checks`, เตรียม artifact
หลัก `release-package-under-test` สำหรับการตรวจที่เกี่ยวกับแพ็กเกจ และ
dispatch Telegram E2E ของแพ็กเกจแบบ standalone เมื่อ `release_profile=full`
พร้อม `rerun_group=all` หรือเมื่อมีการตั้งค่า `npm_telegram_package_spec`
จากนั้น `OpenClaw Release Checks` จะกระจายงานไปยัง install smoke, การตรวจ
release แบบข้าม OS, coverage เส้นทาง release ของ Docker แบบ live/E2E เมื่อเปิด
soak, Package Acceptance พร้อม QA แพ็กเกจ Telegram, parity ของ QA Lab, Matrix
แบบ live และ Telegram แบบ live การรันแบบเต็มจะยอมรับได้ก็ต่อเมื่อสรุป
`Full Release Validation`
แสดงว่า `normal_ci` และ `release_checks` สำเร็จ ในโหมด full/all child
`npm_telegram` ต้องสำเร็จด้วย นอก full/all จะถูกข้าม เว้นแต่จะให้
`npm_telegram_package_spec` ที่เผยแพร่แล้ว สรุป verifier สุดท้ายมีตารางงานที่
ช้าที่สุดสำหรับ child run แต่ละรายการ เพื่อให้ release manager เห็น critical
path ปัจจุบันโดยไม่ต้องดาวน์โหลด log
ดู [การตรวจสอบ release แบบเต็ม](/th/reference/full-release-validation) สำหรับ
เมทริกซ์ขั้นตอนทั้งหมด ชื่องานเวิร์กโฟลว์ที่แน่นอน ความแตกต่างระหว่างโปรไฟล์
stable กับ full, artifacts และ handle สำหรับ rerun แบบเจาะจง
child workflow จะถูก dispatch จาก ref ที่เชื่อถือได้ซึ่งรัน `Full Release
Validation` โดยปกติคือ `--ref main` แม้ว่า `ref` เป้าหมายจะชี้ไปยัง release
branch หรือ tag ที่เก่ากว่า ไม่มี input workflow-ref แยกต่างหากสำหรับ Full
Release Validation ให้เลือก harness ที่เชื่อถือได้โดยเลือก ref ของ workflow run
อย่าใช้ `--ref main -f ref=<sha>` สำหรับหลักฐาน commit ที่แน่นอนบน `main` ที่
เคลื่อนที่อยู่ SHA ของ commit แบบดิบไม่สามารถเป็น workflow dispatch ref ได้
ดังนั้นให้ใช้ `pnpm ci:full-release --sha <sha>` เพื่อสร้าง branch ชั่วคราวที่
ปักหมุดไว้

ใช้ `release_profile` เพื่อเลือกขอบเขต live/provider:

- `minimum`: เส้นทาง OpenAI/core live และ Docker ที่สำคัญต่อ release ซึ่งเร็วที่สุด
- `stable`: minimum บวก coverage ของ provider/backend แบบ stable สำหรับอนุมัติ release
- `full`: stable บวก coverage กว้างของ provider/media เชิง advisory

ใช้ `run_release_soak=true` กับ `stable` เมื่อ lane ที่บล็อก release เป็นสีเขียว
และคุณต้องการ live/E2E แบบละเอียด เส้นทาง release ของ Docker และ sweep แบบมี
ขอบเขตของ published upgrade-survivor ก่อนโปรโมต sweep นี้ครอบคลุมแพ็กเกจ
stable ล่าสุดสี่รายการ รวมถึง baseline ที่ปักหมุด `2026.4.23` และ `2026.5.2`
พร้อม coverage เก่ากว่า `2026.4.15` โดยลบ baseline ที่ซ้ำกันออก และ shard
baseline แต่ละรายการไปยังงาน Docker runner ของตัวเอง `full` หมายถึง
`run_release_soak=true`

`OpenClaw Release Checks` ใช้ workflow ref ที่เชื่อถือได้เพื่อแก้ค่า ref
เป้าหมายหนึ่งครั้งเป็น `release-package-under-test` และใช้ artifact นั้นซ้ำใน
การตรวจข้าม OS, Package Acceptance และ Docker เส้นทาง release เมื่อ soak ทำงาน
วิธีนี้ทำให้กล่องทั้งหมดที่เกี่ยวกับแพ็กเกจอยู่บน bytes ชุดเดียวกันและหลีกเลี่ยง
การ build แพ็กเกจซ้ำ install smoke ของ OpenAI แบบข้าม OS ใช้
`OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อมีการตั้งค่า variable ของ repo/org มิฉะนั้น
ใช้ `openai/gpt-5.4` เพราะ lane นี้พิสูจน์การติดตั้งแพ็กเกจ, onboarding,
การเริ่มต้น Gateway และหนึ่งรอบของ agent แบบ live แทนที่จะ benchmark model
ค่าเริ่มต้นที่ช้าที่สุด เมทริกซ์ provider แบบ live ที่กว้างกว่ายังคงเป็นที่สำหรับ
coverage เฉพาะ model

ใช้ variant เหล่านี้ตามขั้นตอนของ release:

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

อย่าใช้ umbrella แบบเต็มเป็นการ rerun ครั้งแรกหลังการแก้ไขแบบเจาะจง หากกล่องใด
กล่องหนึ่งล้มเหลว ให้ใช้ child workflow, งาน, Docker lane, package profile,
model provider หรือ QA lane ที่ล้มเหลวสำหรับหลักฐานครั้งถัดไป รัน umbrella แบบ
เต็มอีกครั้งเฉพาะเมื่อการแก้ไขเปลี่ยน orchestration ของ release ที่ใช้ร่วมกัน
หรือทำให้หลักฐาน all-box ก่อนหน้าเก่าเกินใช้ verifier สุดท้ายของ umbrella
จะตรวจซ้ำ workflow run id ของ child ที่บันทึกไว้ ดังนั้นหลังจาก child workflow
ถูก rerun สำเร็จแล้ว ให้ rerun เฉพาะงาน parent `Verify full validation` ที่ล้มเหลว

สำหรับการกู้คืนแบบมีขอบเขต ให้ส่ง `rerun_group` ไปยัง umbrella `all` คือการรัน
release-candidate จริง, `ci` รันเฉพาะ child ของ CI ปกติ, `plugin-prerelease`
รันเฉพาะ child ของ Plugin สำหรับ release เท่านั้น, `release-checks` รันกล่อง
release ทุกกล่อง และกลุ่ม release ที่แคบกว่าคือ `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` และ `npm-telegram`
การ rerun `npm-telegram` แบบเจาะจงต้องมี `npm_telegram_package_spec`; การรัน
full/all ด้วย `release_profile=full` ใช้ package artifact ของ release-checks
การ rerun ข้าม OS แบบเจาะจงสามารถเพิ่ม
`cross_os_suite_filter=windows/packaged-upgrade` หรือตัวกรอง OS/suite อื่นได้
ความล้มเหลวของ QA release-check เป็นเชิง advisory; ความล้มเหลวเฉพาะ QA ไม่บล็อก
การตรวจสอบ release

### Vitest

กล่อง Vitest คือ child workflow `CI` แบบ manual Manual CI ตั้งใจข้ามการกำหนด
scope ตามการเปลี่ยนแปลงและบังคับ test graph ปกติสำหรับ release candidate:
Linux Node shards, bundled-plugin shards, channel contracts, ความเข้ากันได้กับ
Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills,
Windows, macOS, Android และ Control UI i18n

ใช้กล่องนี้เพื่อตอบว่า "source tree ผ่านชุดทดสอบปกติแบบเต็มหรือไม่?"
มันไม่เหมือนกับการตรวจสอบผลิตภัณฑ์บนเส้นทาง release หลักฐานที่ต้องเก็บ:

- สรุป `Full Release Validation` ที่แสดง URL ของ `CI` run ที่ถูก dispatch
- `CI` run เป็นสีเขียวบน SHA เป้าหมายที่แน่นอน
- ชื่อ shard ที่ล้มเหลวหรือช้า จากงาน CI เมื่อสืบสวน regression
- artifact timing ของ Vitest เช่น `.artifacts/vitest-shard-timings.json` เมื่อ
  การรันต้องวิเคราะห์ประสิทธิภาพ

รัน manual CI โดยตรงเฉพาะเมื่อ release ต้องการ CI ปกติที่กำหนดผลได้ แต่ไม่ต้องการ
กล่อง Docker, QA Lab, live, ข้าม OS หรือ package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

กล่อง Docker อยู่ใน `OpenClaw Release Checks` ผ่าน
`openclaw-live-and-e2e-checks-reusable.yml` รวมถึงเวิร์กโฟลว์ `install-smoke`
ในโหมด release โดยตรวจ release candidate ผ่านสภาพแวดล้อม Docker แบบแพ็กเกจ
แทนที่จะตรวจเฉพาะระดับ source

coverage ของ Docker สำหรับ release รวมถึง:

- full install smoke พร้อมเปิดใช้ Bun global install smoke แบบช้า
- การเตรียม/ใช้ซ้ำ smoke image ของ root Dockerfile ตาม SHA เป้าหมาย โดยมีงาน QR,
  root/gateway และ installer/Bun smoke ทำงานเป็น shard install-smoke แยกกัน
- lane E2E ของ repository
- ชิ้นงาน Docker เส้นทาง release: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` และ `plugins-runtime-install-h`
- coverage ของ OpenWebUI ภายในชิ้น `plugins-runtime-services` เมื่อมีการร้องขอ
- lane ติดตั้ง/ถอนการติดตั้ง bundled plugin ที่แยกออกเป็น
  `bundled-plugin-install-uninstall-0` ถึง
  `bundled-plugin-install-uninstall-23`
- ชุด provider แบบ live/E2E และ coverage model แบบ Docker live เมื่อ release checks
  รวมชุด live

ใช้ artifact ของ Docker ก่อน rerun scheduler ของเส้นทาง release อัปโหลด
`.artifacts/docker-tests/` พร้อม log ของ lane, `summary.json`, `failures.json`,
timing ของ phase, JSON แผน scheduler และคำสั่ง rerun สำหรับการกู้คืนแบบเจาะจง
ให้ใช้ `docker_lanes=<lane[,lane]>` บนเวิร์กโฟลว์ live/E2E แบบ reusable แทนการ
rerun ทุกชิ้นของ release คำสั่ง rerun ที่สร้างขึ้นจะรวม
`package_artifact_run_id` ก่อนหน้าและ input ของ Docker image ที่เตรียมไว้เมื่อมี
เพื่อให้ lane ที่ล้มเหลวใช้ tarball และ GHCR image ชุดเดิมซ้ำได้

### QA Lab

กล่อง QA Lab เป็นส่วนหนึ่งของ `OpenClaw Release Checks` เช่นกัน เป็น gate ของ
พฤติกรรมแบบ agentic และระดับ channel สำหรับ release แยกจากกลไกแพ็กเกจของ Vitest
และ Docker

coverage ของ QA Lab สำหรับ release รวมถึง:

- lane mock parity ที่เปรียบเทียบ lane candidate ของ OpenAI กับ baseline Opus 4.6
  โดยใช้ agentic parity pack
- โปรไฟล์ Matrix QA แบบ live ที่เร็ว โดยใช้ environment `qa-live-shared`
- lane Telegram QA แบบ live โดยใช้ lease credential ของ Convex CI
- `pnpm qa:otel:smoke` เมื่อ telemetry ของ release ต้องมีหลักฐาน local แบบชัดเจน

ใช้กล่องนี้เพื่อตอบว่า "release ทำงานถูกต้องในสถานการณ์ QA และ flow ของ channel
แบบ live หรือไม่?" เก็บ URL artifact สำหรับ lane parity, Matrix และ Telegram
เมื่ออนุมัติ release coverage Matrix แบบเต็มยังคงมีให้ใช้เป็นการรัน QA-Lab
แบบ sharded ด้วย manual แทนที่จะเป็น lane ค่าเริ่มต้นที่สำคัญต่อ release

### แพ็กเกจ

กล่อง Package คือ gate ของผลิตภัณฑ์ที่ติดตั้งได้ โดยมี
`Package Acceptance` และ resolver
`scripts/resolve-openclaw-package-candidate.mjs` รองรับ resolver จะทำให้ candidate
เป็นมาตรฐานเป็น tarball `package-under-test` ที่ Docker E2E ใช้ ตรวจสอบ package
inventory บันทึกเวอร์ชันแพ็กเกจและ SHA-256 และแยก workflow harness ref ออกจาก
package source ref

แหล่ง candidate ที่รองรับ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` หรือเวอร์ชัน release ของ OpenClaw
  ที่แน่นอน
- `source=ref`: pack branch, tag หรือ SHA commit แบบเต็มของ `package_ref` ที่เชื่อถือได้
  ด้วย harness `workflow_ref` ที่เลือกไว้
- `source=url`: ดาวน์โหลด `.tgz` แบบ HTTPS พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: ใช้ `.tgz` ที่อัปโหลดโดย GitHub Actions run อื่นซ้ำ

`OpenClaw Release Checks` รัน Package Acceptance ด้วย `source=artifact`, package
artifact ของ release ที่เตรียมไว้, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` Package Acceptance คงการ migration, update,
การ restart หลัง update ของ auth ที่กำหนดค่าไว้, การล้าง dependency ของ Plugin
ที่ stale, fixture ของ Plugin แบบ offline, การอัปเดต Plugin และ QA แพ็กเกจ
Telegram ไว้กับ tarball ที่แก้ค่าแล้วชุดเดียวกัน release checks ที่บล็อกใช้
baseline เป็นแพ็กเกจเผยแพร่ล่าสุดตามค่าเริ่มต้น; `run_release_soak=true` หรือ
`release_profile=full` ขยายเป็น baseline ที่เผยแพร่บน npm แบบ stable ทุกตัวตั้งแต่
`2026.4.23` ถึง `latest` พร้อม fixture ของ issue ที่รายงาน ใช้
Package Acceptance ด้วย `source=npm` สำหรับ candidate ที่ ship แล้ว หรือ
`source=ref`/`source=artifact` สำหรับ tarball npm local ที่ผูกกับ SHA ก่อน
เผยแพร่ มันเป็นตัวแทนแบบ GitHub-native สำหรับ coverage package/update ส่วนใหญ่ที่
ก่อนหน้านี้ต้องใช้ Parallels การตรวจ release แบบข้าม OS ยังสำคัญสำหรับ onboarding,
installer และพฤติกรรมเฉพาะแพลตฟอร์ม แต่การตรวจสอบผลิตภัณฑ์ package/update ควร
ใช้ Package Acceptance เป็นหลัก

checklist มาตรฐานสำหรับการตรวจ update และ Plugin คือ
[การทดสอบ updates และ plugins](/th/help/testing-updates-plugins) ใช้มันเมื่อตัดสินใจ
ว่า lane แบบ local, Docker, Package Acceptance หรือ release-check ใดพิสูจน์การ
ติดตั้ง/อัปเดต Plugin, การล้างข้อมูลด้วย doctor หรือการเปลี่ยนแปลง migration ของ
แพ็กเกจที่เผยแพร่แล้ว การ migration ของ published update แบบละเอียดจากแพ็กเกจ
stable ทุกตัวตั้งแต่ `2026.4.23+` เป็นเวิร์กโฟลว์ manual `Update Migration`
แยกต่างหาก ไม่ใช่ส่วนหนึ่งของ Full Release CI.

การผ่อนปรนของ package-acceptance แบบเดิมถูกตั้งใจจำกัดเวลาไว้ แพ็กเกจจนถึง
`2026.4.25` อาจใช้เส้นทางความเข้ากันได้สำหรับช่องว่างของเมตาดาทาที่เผยแพร่ไปยัง
npm แล้ว: รายการ inventory QA ส่วนตัวที่หายไปจาก tarball, ไม่มี
`gateway install --wrapper`, ไฟล์แพตช์หายไปใน git fixture ที่ได้จาก tarball,
ไม่มี `update.channel` ที่คงอยู่, ตำแหน่งบันทึกการติดตั้ง Plugin แบบเดิม,
ไม่มีการคงอยู่ของบันทึกการติดตั้ง marketplace และการย้ายเมตาดาทาคอนฟิกระหว่าง
`plugins update` แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ stamp
เมตาดาทาบิลด์ในเครื่องที่เคยจัดส่งไปแล้ว แพ็กเกจหลังจากนั้นต้องเป็นไปตามสัญญา
แพ็กเกจสมัยใหม่ ช่องว่างเดียวกันเหล่านั้นจะทำให้การตรวจสอบความถูกต้องของ release
ล้มเหลว

ใช้โปรไฟล์ Package Acceptance ที่กว้างขึ้นเมื่อคำถามเกี่ยวกับ release เป็นเรื่อง
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

โปรไฟล์แพ็กเกจที่ใช้บ่อย:

- `smoke`: lane ด่วนสำหรับการติดตั้งแพ็กเกจ/ช่องทาง/เอเจนต์, เครือข่าย Gateway และการโหลดคอนฟิกใหม่
- `package`: สัญญาแพ็กเกจ install/update/restart/plugin โดยไม่มี
  ClawHub แบบ live; นี่คือค่าเริ่มต้นของ release-check
- `product`: `package` บวกช่องทาง MCP, การล้างข้อมูล cron/subagent, การค้นเว็บ OpenAI และ OpenWebUI
- `full`: ชังก์ release-path ของ Docker พร้อม OpenWebUI
- `custom`: รายการ `docker_lanes` แบบระบุแน่นอนสำหรับการรันซ้ำแบบเจาะจง

สำหรับหลักฐาน Telegram ของแพ็กเกจ candidate ให้เปิดใช้ `telegram_mode=mock-openai` หรือ
`telegram_mode=live-frontier` บน Package Acceptance workflow จะส่ง tarball
`package-under-test` ที่ resolve แล้วเข้าไปใน lane ของ Telegram; workflow Telegram
แบบ standalone ยังคงรับสเปก npm ที่เผยแพร่แล้วสำหรับการตรวจหลังเผยแพร่

## ระบบอัตโนมัติสำหรับเผยแพร่ release

`OpenClaw Release Publish` คือ entrypoint การเผยแพร่ที่มีการเปลี่ยนแปลงสถานะตามปกติ
มันประสาน workflow trusted-publisher ตามลำดับที่ release ต้องการ:

1. เช็กเอาต์แท็ก release และ resolve commit SHA ของแท็กนั้น
2. ตรวจสอบว่าแท็ก reachable จาก `main` หรือ `release/*`
3. รัน `pnpm plugins:sync:check`
4. Dispatch `Plugin NPM Release` ด้วย `publish_scope=all-publishable` และ
   `ref=<release-sha>`
5. Dispatch `Plugin ClawHub Release` ด้วย scope และ SHA เดียวกัน
6. Dispatch `OpenClaw NPM Release` ด้วยแท็ก release, npm dist-tag และ
   `preflight_run_id` ที่บันทึกไว้

ตัวอย่างการเผยแพร่ Beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

การเผยแพร่ Stable ไปยัง dist-tag beta เริ่มต้น:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

การโปรโมต Stable ไปยัง `latest` โดยตรงต้องระบุอย่างชัดเจน:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

ใช้ workflow ระดับล่าง `Plugin NPM Release` และ `Plugin ClawHub Release`
เฉพาะสำหรับงานซ่อมแซมหรือเผยแพร่ซ้ำแบบเจาะจงเท่านั้น สำหรับการซ่อม Plugin ที่เลือกไว้ ให้ส่ง
`plugin_publish_scope=selected` และ `plugins=@openclaw/name` ไปยัง
`OpenClaw Release Publish` หรือ dispatch workflow ลูกโดยตรงเมื่อห้ามเผยแพร่
แพ็กเกจ OpenClaw

## อินพุตของ workflow NPM

`OpenClaw NPM Release` รับอินพุตที่ผู้ปฏิบัติงานควบคุมได้ดังนี้:

- `tag`: แท็ก release ที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1` หรือ
  `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` ค่านี้อาจเป็น commit SHA
  แบบเต็ม 40 อักขระปัจจุบันของสาขา workflow สำหรับ preflight ที่ใช้ตรวจสอบอย่างเดียวได้ด้วย
- `preflight_only`: `true` สำหรับตรวจสอบ/บิลด์/แพ็กเกจเท่านั้น, `false` สำหรับเส้นทางเผยแพร่จริง
- `preflight_run_id`: จำเป็นบนเส้นทางเผยแพร่จริง เพื่อให้ workflow ใช้ tarball
  ที่เตรียมไว้จากการรัน preflight ที่สำเร็จซ้ำ
- `npm_dist_tag`: แท็กเป้าหมาย npm สำหรับเส้นทางเผยแพร่; ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Publish` รับอินพุตที่ผู้ปฏิบัติงานควบคุมได้ดังนี้:

- `tag`: แท็ก release ที่จำเป็น; ต้องมีอยู่แล้ว
- `preflight_run_id`: id การรัน preflight ของ `OpenClaw NPM Release` ที่สำเร็จ;
  จำเป็นเมื่อ `publish_openclaw_npm=true`
- `npm_dist_tag`: แท็กเป้าหมาย npm สำหรับแพ็กเกจ OpenClaw
- `plugin_publish_scope`: ค่าเริ่มต้นคือ `all-publishable`; ใช้ `selected` เฉพาะ
  สำหรับงานซ่อมแบบเจาะจง
- `plugins`: ชื่อแพ็กเกจ `@openclaw/*` คั่นด้วยจุลภาคเมื่อ
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: ค่าเริ่มต้นคือ `true`; ตั้งเป็น `false` เฉพาะเมื่อใช้
  workflow เป็นตัวประสานการซ่อมแบบ Plugin เท่านั้น

`OpenClaw Release Checks` รับอินพุตที่ผู้ปฏิบัติงานควบคุมได้ดังนี้:

- `ref`: สาขา แท็ก หรือ commit SHA แบบเต็มที่จะตรวจสอบ เช็กที่มี secret
  ต้องให้ commit ที่ resolve แล้ว reachable จากสาขา OpenClaw หรือแท็ก release
- `run_release_soak`: เลือกใช้การ soak แบบ exhaustive สำหรับ live/E2E, Docker release-path และ
  all-since upgrade-survivor บนเช็ก release stable/default ค่านี้ถูกบังคับเปิดโดย
  `release_profile=full`

กฎ:

- แท็ก Stable และ correction อาจเผยแพร่ไปยัง `beta` หรือ `latest` ก็ได้
- แท็ก prerelease Beta อาจเผยแพร่ไปยัง `beta` เท่านั้น
- สำหรับ `OpenClaw NPM Release` อนุญาตให้อินพุต commit SHA แบบเต็มเฉพาะเมื่อ
  `preflight_only=true`
- `OpenClaw Release Checks` และ `Full Release Validation` เป็นการตรวจสอบอย่างเดียวเสมอ
- เส้นทางเผยแพร่จริงต้องใช้ `npm_dist_tag` เดียวกับที่ใช้ระหว่าง preflight;
  workflow จะตรวจสอบเมตาดาทานั้นก่อนเผยแพร่ต่อ

## ลำดับการ release npm แบบ Stable

เมื่อทำ release npm แบบ Stable:

1. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนมีแท็ก คุณอาจใช้ commit SHA แบบเต็มปัจจุบันของสาขา workflow
     สำหรับ dry run ของ workflow preflight ที่ใช้ตรวจสอบอย่างเดียว
2. เลือก `npm_dist_tag=beta` สำหรับ flow beta-first ตามปกติ หรือ `latest` เฉพาะ
   เมื่อคุณตั้งใจเผยแพร่ Stable โดยตรง
3. รัน `Full Release Validation` บนสาขา release, แท็ก release หรือ commit SHA แบบเต็ม
   เมื่อคุณต้องการ CI ปกติพร้อมความครอบคลุม live prompt cache, Docker, QA Lab,
   Matrix และ Telegram จาก workflow แบบ manual เดียว
4. หากคุณตั้งใจต้องการเฉพาะกราฟทดสอบปกติที่ deterministic ให้รัน workflow
   `CI` แบบ manual บน ref ของ release แทน
5. บันทึก `preflight_run_id` ที่สำเร็จ
6. รัน `OpenClaw Release Publish` ด้วย `tag` เดียวกัน, `npm_dist_tag` เดียวกัน
   และ `preflight_run_id` ที่บันทึกไว้; มันจะเผยแพร่ Plugin ที่ externalized ไปยัง npm
   และ ClawHub ก่อนโปรโมตแพ็กเกจ OpenClaw npm
7. หาก release ไปอยู่บน `beta` ให้ใช้ workflow ส่วนตัว
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   เพื่อโปรโมตเวอร์ชัน Stable นั้นจาก `beta` เป็น `latest`
8. หาก release ตั้งใจเผยแพร่โดยตรงไปยัง `latest` และ `beta`
   ควรตามบิลด์ Stable เดียวกันทันที ให้ใช้ workflow ส่วนตัวเดียวกันนั้น
   เพื่อชี้ dist-tag ทั้งสองไปยังเวอร์ชัน Stable หรือปล่อยให้การ sync self-healing
   ตามกำหนดเวลาย้าย `beta` ในภายหลัง

การเปลี่ยน dist-tag อยู่ใน repo ส่วนตัวด้วยเหตุผลด้านความปลอดภัย เพราะยังต้องใช้
`NPM_TOKEN` ขณะที่ repo สาธารณะคงการเผยแพร่แบบ OIDC เท่านั้น

สิ่งนี้ทำให้ทั้งเส้นทางเผยแพร่โดยตรงและเส้นทางโปรโมตแบบ beta-first มีเอกสารกำกับและผู้ปฏิบัติงานมองเห็นได้

หาก maintainer ต้อง fallback ไปใช้การยืนยันตัวตน npm ในเครื่อง ให้รันคำสั่ง 1Password
CLI (`op`) ใด ๆ เฉพาะภายในเซสชัน tmux ที่แยกไว้เท่านั้น ห้ามเรียก `op`
โดยตรงจากเชลล์ agent หลัก; การเก็บไว้ภายใน tmux ทำให้ prompt,
การแจ้งเตือน และการจัดการ OTP สังเกตได้ และป้องกันการแจ้งเตือน host ซ้ำ

## แหล่งอ้างอิงสาธารณะ

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer ใช้เอกสาร release ส่วนตัวใน
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
สำหรับ runbook จริง

## ที่เกี่ยวข้อง

- [ช่องทาง release](/th/install/development-channels)
