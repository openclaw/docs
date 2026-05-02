---
read_when:
    - กำลังค้นหาคำจำกัดความของช่องทางเผยแพร่สาธารณะ
    - การเรียกใช้การตรวจสอบความถูกต้องของรีลีสหรือการยอมรับแพ็กเกจ
    - กำลังมองหารูปแบบการตั้งชื่อเวอร์ชันและรอบการเผยแพร่
summary: เลนการเผยแพร่ รายการตรวจสอบสำหรับผู้ปฏิบัติงาน กล่องตรวจสอบความถูกต้อง การตั้งชื่อเวอร์ชัน และรอบการเผยแพร่
title: นโยบายการเผยแพร่รุ่น
x-i18n:
    generated_at: "2026-05-02T10:28:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce52c9144de3c8b914954db64f6ca5b2196edbbdcc7385984235a39c208bb59e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw มีเลนการเผยแพร่สาธารณะสามเลน:

- เสถียร: รุ่นเผยแพร่ที่ติดแท็ก ซึ่งเผยแพร่ไปยัง npm `beta` โดยค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อมีการร้องขออย่างชัดเจน
- เบตา: แท็กรุ่นก่อนเผยแพร่ที่เผยแพร่ไปยัง npm `beta`
- พัฒนา: ส่วนหัวที่เคลื่อนไหวของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันรุ่นเผยแพร่เสถียร: `YYYY.M.D`
  - แท็ก Git: `vYYYY.M.D`
- เวอร์ชันรุ่นแก้ไขเสถียร: `YYYY.M.D-N`
  - แท็ก Git: `vYYYY.M.D-N`
- เวอร์ชันรุ่นก่อนเผยแพร่เบตา: `YYYY.M.D-beta.N`
  - แท็ก Git: `vYYYY.M.D-beta.N`
- อย่าเติมศูนย์นำหน้าเดือนหรือวัน
- `latest` หมายถึงรุ่นเผยแพร่ npm เสถียรที่ได้รับการโปรโมตในปัจจุบัน
- `beta` หมายถึงเป้าหมายการติดตั้งเบตาปัจจุบัน
- รุ่นเผยแพร่เสถียรและรุ่นแก้ไขเสถียรเผยแพร่ไปยัง npm `beta` โดยค่าเริ่มต้น; ผู้ดำเนินการเผยแพร่สามารถกำหนดเป้าหมายเป็น `latest` อย่างชัดเจน หรือโปรโมตบิลด์เบตาที่ตรวจสอบแล้วในภายหลังได้
- ทุกการเผยแพร่ OpenClaw แบบเสถียรจะจัดส่งแพ็กเกจ npm และแอป macOS พร้อมกัน;
  รุ่นเบตาโดยปกติจะตรวจสอบและเผยแพร่เส้นทาง npm/แพ็กเกจก่อน โดยสงวนการ build/sign/notarize
  ของแอป mac ไว้สำหรับรุ่นเสถียร เว้นแต่จะมีการร้องขออย่างชัดเจน

## รอบการเผยแพร่

- การเผยแพร่ดำเนินแบบเบตาก่อน
- รุ่นเสถียรจะตามมาหลังจากตรวจสอบเบตาล่าสุดแล้วเท่านั้น
- โดยปกติผู้ดูแลจะตัดรุ่นจากสาขา `release/YYYY.M.D` ที่สร้าง
  จาก `main` ปัจจุบัน เพื่อให้การตรวจสอบและการแก้ไขรุ่นเผยแพร่ไม่บล็อก
  การพัฒนาใหม่บน `main`
- หากแท็กเบตาถูก push หรือเผยแพร่แล้วและต้องแก้ไข ผู้ดูแลจะตัด
  แท็ก `-beta.N` ถัดไปแทนการลบหรือสร้างแท็กเบตาเดิมใหม่
- ขั้นตอนการเผยแพร่โดยละเอียด การอนุมัติ ข้อมูลประจำตัว และบันทึกการกู้คืน
  สำหรับผู้ดูแลเท่านั้น

## รายการตรวจสอบของผู้ดำเนินการเผยแพร่

รายการตรวจสอบนี้คือรูปแบบสาธารณะของโฟลว์การเผยแพร่ ข้อมูลประจำตัวส่วนตัว,
การลงนาม, การ notarization, การกู้คืน dist-tag และรายละเอียดการ rollback ฉุกเฉินจะอยู่ใน
runbook การเผยแพร่สำหรับผู้ดูแลเท่านั้น

1. เริ่มจาก `main` ปัจจุบัน: pull ล่าสุด ยืนยันว่าคอมมิตเป้าหมายถูก push แล้ว
   และยืนยันว่า CI ของ `main` ปัจจุบันเขียวพอที่จะสร้างสาขาจากได้
2. เขียนส่วนบนสุดของ `CHANGELOG.md` ใหม่จากประวัติคอมมิตจริงด้วย
   `/changelog` ให้รายการเป็นข้อมูลสำหรับผู้ใช้ commit รายการนั้น push รายการนั้น และ rebase/pull
   อีกครั้งก่อนสร้างสาขา
3. ตรวจสอบบันทึกความเข้ากันได้ของรุ่นเผยแพร่ใน
   `src/plugins/compat/registry.ts` และ
   `src/commands/doctor/shared/deprecation-compat.ts` ลบความเข้ากันได้
   ที่หมดอายุเฉพาะเมื่อเส้นทางอัปเกรดยังครอบคลุมอยู่ หรือบันทึกเหตุผลว่าทำไมจึง
   ตั้งใจคงไว้
4. สร้าง `release/YYYY.M.D` จาก `main` ปัจจุบัน; อย่าทำงานเผยแพร่ตามปกติ
   โดยตรงบน `main`
5. เพิ่มเวอร์ชันทุกตำแหน่งที่จำเป็นสำหรับแท็กที่ต้องการ รัน
   `pnpm plugins:sync` เพื่อให้แพ็กเกจ Plugin ที่เผยแพร่ได้ใช้เวอร์ชันรุ่นเผยแพร่
   และเมตาดาตาความเข้ากันได้ร่วมกัน จากนั้นรัน preflight แบบกำหนดแน่นอนในเครื่อง:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` และ
   `pnpm release:check`
6. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true` ก่อนมีแท็ก
   อนุญาตให้ใช้ SHA เต็ม 40 อักขระของสาขารุ่นเผยแพร่สำหรับ preflight
   เพื่อการตรวจสอบเท่านั้น บันทึก `preflight_run_id` ที่สำเร็จไว้
7. เริ่มการทดสอบก่อนเผยแพร่ทั้งหมดด้วย `Full Release Validation` สำหรับ
   สาขารุ่นเผยแพร่ แท็ก หรือ SHA คอมมิตแบบเต็ม นี่คือ entrypoint แบบแมนนวลหนึ่งเดียว
   สำหรับกล่องทดสอบรุ่นเผยแพร่ขนาดใหญ่สี่ชุด: Vitest, Docker, QA Lab และ Package
8. หากการตรวจสอบล้มเหลว ให้แก้บนสาขารุ่นเผยแพร่และรันซ้ำเฉพาะไฟล์,
   เลน, งาน workflow, โปรไฟล์แพ็กเกจ, provider หรือ allowlist ของโมเดลที่ล้มเหลวน้อยที่สุด
   ซึ่งพิสูจน์การแก้ไขได้ รันชุดใหญ่เต็มซ้ำเฉพาะเมื่อพื้นผิวที่เปลี่ยนทำให้
   หลักฐานก่อนหน้าเก่าเกินใช้
9. สำหรับเบตา ให้แท็ก `vYYYY.M.D-beta.N` จากนั้นรัน `OpenClaw Release Publish` จาก
   สาขา `release/YYYY.M.D` ที่ตรงกัน คำสั่งนี้จะตรวจสอบ `pnpm plugins:sync:check`,
   เผยแพร่แพ็กเกจ Plugin ที่เผยแพร่ได้ทั้งหมดไปยัง npm ก่อน เผยแพร่ชุดเดียวกัน
   ไปยัง ClawHub เป็นลำดับที่สอง แล้วโปรโมตอาร์ติแฟกต์ preflight ของ OpenClaw npm ที่เตรียมไว้
   ด้วย dist-tag `beta` หลังเผยแพร่ ให้รันการยอมรับแพ็กเกจหลังเผยแพร่
   กับแพ็กเกจ `openclaw@YYYY.M.D-beta.N` หรือ `openclaw@beta` ที่เผยแพร่แล้ว หากเบตาที่ถูก push หรือเผยแพร่แล้วต้องแก้ไข ให้ตัด `-beta.N` ถัดไป;
   อย่าลบหรือเขียนเบตาเดิมใหม่
10. สำหรับรุ่นเสถียร ให้ดำเนินต่อเฉพาะหลังจากเบตาที่ตรวจสอบแล้วหรือ release candidate มี
    หลักฐานการตรวจสอบที่จำเป็น การเผยแพร่ npm เสถียรก็ผ่าน
    `OpenClaw Release Publish` เช่นกัน โดยนำอาร์ติแฟกต์ preflight ที่สำเร็จมาใช้ซ้ำผ่าน
    `preflight_run_id`; ความพร้อมของรุ่นเผยแพร่ macOS เสถียรยังต้องมี
    `.zip`, `.dmg`, `.dSYM.zip` ที่แพ็กเกจแล้ว และ `appcast.xml` ที่อัปเดตบน `main`
11. หลังเผยแพร่ ให้รันตัวตรวจสอบหลังเผยแพร่ของ npm, Telegram E2E แบบ standalone
    จาก npm ที่เผยแพร่แล้วซึ่งเป็นทางเลือกเมื่อคุณต้องการหลักฐานช่องทางหลังเผยแพร่,
    การโปรโมต dist-tag เมื่อจำเป็น, บันทึก GitHub release/prerelease จากส่วน
    `CHANGELOG.md` ที่ตรงกันครบถ้วน และขั้นตอนประกาศรุ่นเผยแพร่

## Preflight ของรุ่นเผยแพร่

- เรียกใช้ `pnpm check:test-types` ก่อนการตรวจสอบก่อนปล่อยรุ่น เพื่อให้ TypeScript ของชุดทดสอบยังถูกครอบคลุมนอกเกต `pnpm check` ภายในเครื่องที่เร็วกว่า
- เรียกใช้ `pnpm check:architecture` ก่อนการตรวจสอบก่อนปล่อยรุ่น เพื่อให้การตรวจสอบวงจร import และขอบเขตสถาปัตยกรรมที่กว้างกว่าผ่านนอกเกตภายในเครื่องที่เร็วกว่า
- เรียกใช้ `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้อาร์ติแฟกต์รุ่นเผยแพร่ `dist/*` ที่คาดไว้และบันเดิล Control UI มีอยู่สำหรับขั้นตอนตรวจสอบแพ็ก
- เรียกใช้ `pnpm plugins:sync` หลังจากปรับรุ่นที่รากและก่อนติดแท็ก คำสั่งนี้จะอัปเดตรุ่นแพ็กเกจ Plugin ที่เผยแพร่ได้, เมทาดาทาความเข้ากันได้ของ peer/API ของ OpenClaw, เมทาดาทาบิลด์ และสตับบันทึกการเปลี่ยนแปลงของ Plugin ให้ตรงกับรุ่นเผยแพร่ของแกนหลัก `pnpm plugins:sync:check` คือการ์ดสำหรับรุ่นเผยแพร่ที่ไม่แก้ไขไฟล์; เวิร์กโฟลว์เผยแพร่จะล้มเหลวก่อนมีการแก้ไข registry ใด ๆ หากลืมขั้นตอนนี้
- เรียกใช้เวิร์กโฟลว์แบบแมนนวล `Full Release Validation` ก่อนอนุมัติรุ่นเผยแพร่ เพื่อเริ่มกล่องทดสอบก่อนปล่อยรุ่นทั้งหมดจากจุดเข้าเดียว เวิร์กโฟลว์นี้รับ branch, tag หรือ full commit SHA, dispatch `CI` แบบแมนนวล และ dispatch `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, ชุดทดสอบเส้นทางเผยแพร่ Docker, live/E2E, OpenWebUI, QA Lab parity, Matrix และเลน Telegram เมื่อใช้ `release_profile=full` และ `rerun_group=all` จะรัน package Telegram E2E กับอาร์ติแฟกต์ `release-package-under-test` จาก release checks ด้วย ระบุ `npm_telegram_package_spec` หลังเผยแพร่เมื่อ Telegram E2E เดียวกันควรพิสูจน์แพ็กเกจ npm ที่เผยแพร่แล้วด้วย ระบุ `evidence_package_spec` เมื่อรายงานหลักฐานส่วนตัวควรพิสูจน์ว่าการตรวจสอบตรงกับแพ็กเกจ npm ที่เผยแพร่แล้วโดยไม่บังคับ Telegram E2E
  ตัวอย่าง:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- เรียกใช้เวิร์กโฟลว์แบบแมนนวล `Package Acceptance` เมื่อคุณต้องการหลักฐานช่องทางข้างเคียงสำหรับผู้สมัครแพ็กเกจขณะที่งานปล่อยรุ่นยังดำเนินต่อ ใช้ `source=npm` สำหรับ `openclaw@beta`, `openclaw@latest` หรือรุ่นเผยแพร่แบบเจาะจง; ใช้ `source=ref` เพื่อแพ็ก branch/tag/SHA ของ `package_ref` ที่เชื่อถือได้ด้วย harness `workflow_ref` ปัจจุบัน; ใช้ `source=url` สำหรับ tarball HTTPS ที่ต้องมี SHA-256; หรือใช้ `source=artifact` สำหรับ tarball ที่อัปโหลดโดย GitHub Actions run อื่น เวิร์กโฟลว์จะแปลงผู้สมัครเป็น `package-under-test`, ใช้ตัวจัดตารางเผยแพร่ Docker E2E ซ้ำกับ tarball นั้น และสามารถรัน Telegram QA กับ tarball เดียวกันด้วย `telegram_mode=mock-openai` หรือ `telegram_mode=live-frontier` เมื่อเลน Docker ที่เลือกมี `published-upgrade-survivor` อาร์ติแฟกต์แพ็กเกจคือผู้สมัคร และ `published_upgrade_survivor_baseline` จะเลือก baseline ที่เผยแพร่แล้ว
  ตัวอย่าง: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  โปรไฟล์ทั่วไป:
  - `smoke`: เลนติดตั้ง/channel/agent, เครือข่าย Gateway และโหลด config ใหม่
  - `package`: เลนแพ็กเกจ/update/Plugin แบบอิงอาร์ติแฟกต์โดยไม่มี OpenWebUI หรือ ClawHub แบบ live
  - `product`: โปรไฟล์แพ็กเกจพร้อมช่องทาง MCP, การล้าง cron/subagent, การค้นหาเว็บ OpenAI และ OpenWebUI
  - `full`: ชิ้นส่วนเส้นทางเผยแพร่ Docker พร้อม OpenWebUI
  - `custom`: การเลือก `docker_lanes` แบบเจาะจงสำหรับ rerun ที่โฟกัส
- เรียกใช้เวิร์กโฟลว์แบบแมนนวล `CI` โดยตรงเมื่อคุณต้องการเพียงความครอบคลุม CI ปกติเต็มรูปแบบสำหรับผู้สมัครรุ่นเผยแพร่ การ dispatch CI แบบแมนนวลจะข้ามการกำหนดขอบเขตตามการเปลี่ยนแปลงและบังคับเลน Linux Node shards, bundled-plugin shards, สัญญา channel, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, การตรวจ docs, Python skills, Windows, macOS, Android และ Control UI i18n
  ตัวอย่าง: `gh workflow run ci.yml --ref release/YYYY.M.D`
- เรียกใช้ `pnpm qa:otel:smoke` เมื่อตรวจสอบ telemetry ของรุ่นเผยแพร่ คำสั่งนี้ทดสอบ QA-lab ผ่านตัวรับ OTLP/HTTP ภายในเครื่อง และตรวจสอบชื่อ span ของ trace ที่ส่งออก, แอตทริบิวต์ที่มีขอบเขต และการปกปิดเนื้อหา/ตัวระบุ โดยไม่ต้องใช้ Opik, Langfuse หรือตัวรวบรวมภายนอกอื่น
- เรียกใช้ `pnpm release:check` ก่อนทุกรุ่นเผยแพร่ที่ติดแท็ก
- เรียกใช้ `OpenClaw Release Publish` สำหรับลำดับเผยแพร่ที่แก้ไขสถานะหลังจาก tag มีอยู่แล้ว Dispatch จาก `release/YYYY.M.D` (หรือ `main` เมื่อเผยแพร่ tag ที่ main เข้าถึงได้), ส่ง tag รุ่นเผยแพร่และ `preflight_run_id` ของ OpenClaw npm ที่สำเร็จ และคงขอบเขตเผยแพร่ Plugin เริ่มต้น `all-publishable` ไว้ เว้นแต่คุณตั้งใจรันการซ่อมแบบโฟกัส เวิร์กโฟลว์จะเรียงลำดับการเผยแพร่ plugin npm, การเผยแพร่ plugin ClawHub และการเผยแพร่ OpenClaw npm เพื่อไม่ให้แพ็กเกจแกนหลักถูกเผยแพร่ก่อน Plugin ที่แยกออกภายนอก
- ตอนนี้ release checks รันในเวิร์กโฟลว์แบบแมนนวลแยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรันเกต QA Lab mock parity พร้อมโปรไฟล์ Matrix แบบ live ที่รวดเร็วและเลน Telegram QA ก่อนอนุมัติรุ่นเผยแพร่ เลน live ใช้ environment `qa-live-shared`; Telegram ยังใช้ credential leases ของ Convex CI ด้วย เรียกใช้เวิร์กโฟลว์แบบแมนนวล `QA-Lab - All Lanes` พร้อม `matrix_profile=all` และ `matrix_shards=true` เมื่อคุณต้องการ inventory ของ Matrix transport, media และ E2EE เต็มรูปแบบแบบขนาน
- การตรวจสอบรันไทม์การติดตั้งและการอัปเกรดข้าม OS เป็นส่วนหนึ่งของ `OpenClaw Release Checks` และ `Full Release Validation` แบบสาธารณะ ซึ่งเรียกเวิร์กโฟลว์ที่ใช้ซ้ำได้ `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` โดยตรง
- การแยกนี้เป็นความตั้งใจ: ให้เส้นทางเผยแพร่ npm จริงสั้น คาดเดาได้ และมุ่งเน้นอาร์ติแฟกต์ ขณะที่การตรวจ live ที่ช้ากว่าอยู่ในเลนของตัวเอง เพื่อไม่ให้หน่วงหรือบล็อกการเผยแพร่
- Release checks ที่มี secret ควรถูก dispatch ผ่าน `Full Release
Validation` หรือจาก workflow ref `main`/release เพื่อให้ตรรกะเวิร์กโฟลว์และ secret ยังถูกควบคุม
- `OpenClaw Release Checks` รับ branch, tag หรือ full commit SHA ตราบใดที่ commit ที่แปลงได้เข้าถึงได้จาก branch ของ OpenClaw หรือ release tag
- การตรวจสอบก่อนปล่อยแบบ validation-only ของ `OpenClaw NPM Release` ยังรับ SHA ของ commit บน workflow-branch ปัจจุบันแบบเต็ม 40 อักขระได้โดยไม่ต้องมี tag ที่ push แล้ว
- เส้นทาง SHA นั้นเป็น validation-only และไม่สามารถเลื่อนเป็นการเผยแพร่จริงได้
- ในโหมด SHA เวิร์กโฟลว์จะสังเคราะห์ `v<package.json version>` เฉพาะสำหรับการตรวจเมทาดาทาแพ็กเกจเท่านั้น; การเผยแพร่จริงยังต้องใช้ release tag จริง
- ทั้งสองเวิร์กโฟลว์คงเส้นทางเผยแพร่และโปรโมตจริงไว้บน runner ที่โฮสต์โดย GitHub ขณะที่เส้นทางตรวจสอบที่ไม่แก้ไขสถานะสามารถใช้ runner Blacksmith Linux ที่ใหญ่กว่าได้
- เวิร์กโฟลว์นั้นรัน
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ workflow secrets ทั้ง `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- การตรวจสอบก่อนปล่อย npm release ไม่รอเลน release checks ที่แยกออกมาอีกต่อไป
- เรียกใช้ `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือ tag beta/correction ที่ตรงกัน) ก่อนอนุมัติ
- หลังเผยแพร่ npm ให้เรียกใช้
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (หรือรุ่น beta/correction ที่ตรงกัน) เพื่อตรวจสอบเส้นทางติดตั้งจาก registry ที่เผยแพร่แล้วใน temp prefix ใหม่
- หลังเผยแพร่ beta ให้เรียกใช้ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  เพื่อตรวจสอบการ onboarding ของแพ็กเกจที่ติดตั้ง, การตั้งค่า Telegram และ Telegram E2E จริงกับแพ็กเกจ npm ที่เผยแพร่แล้วโดยใช้กลุ่ม credential Telegram ที่เช่าใช้ร่วมกัน การรันครั้งเดียวภายในเครื่องของ maintainer อาจละเว้นตัวแปร Convex และส่ง credential env ทั้งสาม `OPENCLAW_QA_TELEGRAM_*` โดยตรง
- Maintainer สามารถรันการตรวจหลังเผยแพร่เดียวกันจาก GitHub Actions ผ่านเวิร์กโฟลว์แบบแมนนวล `NPM Telegram Beta E2E` ได้ เวิร์กโฟลว์นี้ตั้งใจให้เป็นแบบแมนนวลเท่านั้นและไม่รันทุกครั้งที่ merge
- ระบบอัตโนมัติสำหรับรุ่นเผยแพร่ของ maintainer ตอนนี้ใช้รูปแบบ preflight-then-promote:
  - การเผยแพร่ npm จริงต้องผ่าน npm `preflight_run_id` ที่สำเร็จ
  - การเผยแพร่ npm จริงต้องถูก dispatch จาก branch `main` หรือ `release/YYYY.M.D` เดียวกันกับ preflight run ที่สำเร็จ
  - รุ่น npm แบบ stable ใช้ค่าเริ่มต้นเป็น `beta`
  - การเผยแพร่ npm แบบ stable สามารถระบุเป้าหมาย `latest` ได้อย่างชัดเจนผ่าน workflow input
  - การแก้ไข npm dist-tag แบบใช้ token ตอนนี้อยู่ใน
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    ด้วยเหตุผลด้านความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่ repo สาธารณะคงการเผยแพร่แบบ OIDC-only
  - `macOS Release` แบบสาธารณะเป็น validation-only; เมื่อ tag อยู่เฉพาะบน release branch แต่เวิร์กโฟลว์ถูก dispatch จาก `main` ให้ตั้งค่า `public_release_branch=release/YYYY.M.D`
  - การเผยแพร่ mac ส่วนตัวจริงต้องผ่าน `preflight_run_id` และ `validate_run_id` ของ mac ส่วนตัวที่สำเร็จ
  - เส้นทางเผยแพร่จริงโปรโมตอาร์ติแฟกต์ที่เตรียมไว้แทนการ rebuild อีกครั้ง
- สำหรับรุ่นแก้ไขแบบ stable เช่น `YYYY.M.D-N` ตัวตรวจสอบหลังเผยแพร่ยังตรวจเส้นทางอัปเกรด temp-prefix เดียวกันจาก `YYYY.M.D` เป็น `YYYY.M.D-N` เพื่อให้การแก้ไขรุ่นเผยแพร่ไม่สามารถปล่อยให้การติดตั้ง global รุ่นเก่าค้างอยู่บน payload stable ฐานได้อย่างเงียบ ๆ
- การตรวจสอบก่อนปล่อย npm release จะล้มเหลวแบบปิด เว้นแต่ tarball มีทั้ง `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่าง เพื่อไม่ให้เราส่ง dashboard เบราว์เซอร์ว่างเปล่าอีก
- การตรวจสอบหลังเผยแพร่ยังตรวจว่า entrypoint ของ Plugin ที่เผยแพร่แล้วและเมทาดาทาแพ็กเกจมีอยู่ใน layout ของ registry ที่ติดตั้งแล้ว รุ่นเผยแพร่ที่ส่ง payload รันไทม์ Plugin ขาดหายจะล้มเหลวในตัวตรวจสอบ postpublish และไม่สามารถโปรโมตเป็น `latest` ได้
- `pnpm test:install:smoke` ยังบังคับใช้งบ `unpackedSize` ของ npm pack กับ tarball อัปเดตผู้สมัครด้วย ดังนั้น installer e2e จะจับการบวมของแพ็กโดยไม่ได้ตั้งใจก่อนเส้นทางเผยแพร่รุ่น
- หากงานปล่อยรุ่นแตะการวางแผน CI, timing manifest ของส่วนขยาย หรือ test matrix ของส่วนขยาย ให้สร้างใหม่และทบทวน output matrix `plugin-prerelease-extension-shard` ที่ planner เป็นเจ้าของจาก `.github/workflows/plugin-prerelease.yml` ก่อนอนุมัติ เพื่อให้บันทึกรุ่นเผยแพร่ไม่อธิบาย layout CI ที่ล้าสมัย
- ความพร้อมของรุ่น macOS แบบ stable ยังรวมพื้นผิว updater:
  - GitHub release ต้องจบด้วย `.zip`, `.dmg` และ `.dSYM.zip` ที่แพ็กแล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปยัง zip stable ใหม่หลังเผยแพร่
  - แอปที่แพ็กแล้วต้องคง bundle id ที่ไม่ใช่ debug, URL feed ของ Sparkle ที่ไม่ว่าง และ `CFBundleVersion` ที่เท่ากับหรือสูงกว่าค่าพื้นขั้นต่ำของ build Sparkle ที่เป็น canonical สำหรับรุ่นเผยแพร่นั้น

## กล่องทดสอบรุ่นเผยแพร่

`Full Release Validation` คือวิธีที่ผู้ปฏิบัติงานใช้เริ่มชุดทดสอบก่อนปล่อยรุ่นทั้งหมดจากจุดเข้าเดียว สำหรับหลักฐาน commit ที่ปักหมุดบน branch ที่เคลื่อนเร็ว ให้ใช้ helper เพื่อให้ทุก child workflow รันจาก branch ชั่วคราวที่ตรึงไว้กับ SHA เป้าหมาย:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper จะ push `release-ci/<sha>-...`, dispatch `Full Release Validation` จาก branch นั้นด้วย `ref=<sha>`, ตรวจสอบว่า `headSha` ของทุก child workflow ตรงกับเป้าหมาย แล้วลบ branch ชั่วคราว วิธีนี้ช่วยเลี่ยงการพิสูจน์ child run ของ `main` ที่ใหม่กว่าโดยไม่ตั้งใจ

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

เวิร์กโฟลว์จะแก้ไข ref เป้าหมาย, dispatch `CI` แบบแมนนวลด้วย
`target_ref=<release-ref>`, dispatch `OpenClaw Release Checks`, และ dispatch
Telegram E2E ของแพ็กเกจแบบสแตนด์อโลนเมื่อ `release_profile=full` พร้อม
`rerun_group=all` หรือเมื่อมีการตั้งค่า `npm_telegram_package_spec` จากนั้น
`OpenClaw Release Checks` จะกระจายไปยัง install smoke, การตรวจสอบรีลีสข้าม OS,
ความครอบคลุมเส้นทางรีลีสแบบ live/E2E Docker, Package Acceptance พร้อม QA
แพ็กเกจ Telegram, ความเท่าเทียมของ QA Lab, Matrix แบบ live และ Telegram แบบ live
การรันแบบเต็มจะยอมรับได้ก็ต่อเมื่อสรุป
`Full Release Validation`
แสดงว่า `normal_ci` และ `release_checks` สำเร็จ ในโหมด full/all
child `npm_telegram` ต้องสำเร็จด้วยเช่นกัน; นอก full/all จะถูกข้าม
เว้นแต่จะมีการระบุ `npm_telegram_package_spec` ที่เผยแพร่แล้ว สรุปตัวตรวจสอบ
สุดท้ายมีตารางงานที่ช้าที่สุดสำหรับแต่ละ child run เพื่อให้ผู้จัดการรีลีสเห็น
critical path ปัจจุบันได้โดยไม่ต้องดาวน์โหลดล็อก
ดู [การตรวจสอบความถูกต้องของรีลีสแบบเต็ม](/th/reference/full-release-validation) สำหรับ
เมทริกซ์ขั้นตอนฉบับสมบูรณ์, ชื่องานเวิร์กโฟลว์ที่แน่นอน, ความแตกต่างระหว่างโปรไฟล์
stable กับ full, artifacts และ handle สำหรับ rerun แบบเจาะจง
child workflows จะถูก dispatch จาก ref ที่เชื่อถือได้ซึ่งรัน `Full Release
Validation` โดยปกติคือ `--ref main` แม้ว่า `ref` เป้าหมายจะชี้ไปยัง
branch หรือ tag รีลีสเก่าก็ตาม ไม่มี input workflow-ref แยกต่างหากสำหรับ
Full Release Validation; ให้เลือก harness ที่เชื่อถือได้โดยเลือก ref ของ workflow run
อย่าใช้ `--ref main -f ref=<sha>` สำหรับหลักฐาน commit ที่แน่นอนบน `main` ที่เคลื่อนที่อยู่;
raw commit SHA ไม่สามารถเป็น workflow dispatch refs ได้ ดังนั้นให้ใช้
`pnpm ci:full-release --sha <sha>` เพื่อสร้าง branch ชั่วคราวที่ถูก pin ไว้

ใช้ `release_profile` เพื่อเลือกความกว้างของ live/provider:

- `minimum`: เส้นทาง OpenAI/core live และ Docker ที่สำคัญต่อรีลีสเร็วที่สุด
- `stable`: minimum รวมกับความครอบคลุม provider/backend แบบ stable สำหรับการอนุมัติรีลีส
- `full`: stable รวมกับความครอบคลุม provider/media เชิง advisory แบบกว้าง

`OpenClaw Release Checks` ใช้ ref เวิร์กโฟลว์ที่เชื่อถือได้เพื่อแก้ไข ref เป้าหมาย
หนึ่งครั้งเป็น `release-package-under-test` และนำ artifact นั้นกลับมาใช้ทั้งในการตรวจสอบ
Docker เส้นทางรีลีสและ Package Acceptance วิธีนี้ทำให้กล่องทั้งหมดที่เผชิญกับแพ็กเกจ
ใช้ bytes เดียวกัน และหลีกเลี่ยงการ build แพ็กเกจซ้ำ
install smoke ของ OpenAI ข้าม OS ใช้ `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อมีการตั้งค่า
ตัวแปร repo/org ไม่เช่นนั้นใช้ `openai/gpt-5.5` เพราะ lane นี้กำลังพิสูจน์
การติดตั้งแพ็กเกจ, onboarding, การเริ่มต้น gateway และ agent turn แบบ live หนึ่งครั้ง
แทนที่จะ benchmark โมเดลค่าเริ่มต้นที่ช้าที่สุด เมทริกซ์ live provider ที่กว้างกว่า
ยังคงเป็นพื้นที่สำหรับความครอบคลุมเฉพาะโมเดล

ใช้ตัวแปรเหล่านี้ตามขั้นของรีลีส:

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

อย่าใช้ umbrella แบบเต็มเป็นการ rerun ครั้งแรกหลังการแก้ไขแบบเจาะจง หากกล่องหนึ่งล้มเหลว
ให้ใช้ child workflow, job, Docker lane, package profile, model provider หรือ QA lane
ที่ล้มเหลวสำหรับหลักฐานครั้งถัดไป รัน umbrella แบบเต็มอีกครั้งเฉพาะเมื่อ
การแก้ไขเปลี่ยน orchestration รีลีสร่วม หรือทำให้หลักฐาน all-box ก่อนหน้า
ล้าสมัย ตัวตรวจสอบสุดท้ายของ umbrella จะตรวจสอบ ids ของ child workflow run ที่บันทึกไว้ซ้ำ
ดังนั้นหลังจาก rerun child workflow สำเร็จแล้ว ให้ rerun เฉพาะงาน parent
`Verify full validation` ที่ล้มเหลว

สำหรับการกู้คืนแบบจำกัดขอบเขต ให้ส่ง `rerun_group` ไปยัง umbrella `all` คือการรัน
release-candidate จริง, `ci` รันเฉพาะ child CI ปกติ, `plugin-prerelease`
รันเฉพาะ child plugin สำหรับรีลีสเท่านั้น, `release-checks` รันทุกกล่องรีลีส
และกลุ่มรีลีสที่แคบกว่าคือ `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` และ `npm-telegram`
การ rerun `npm-telegram` แบบเจาะจงต้องมี `npm_telegram_package_spec`; การรัน full/all
ด้วย `release_profile=full` ใช้ artifact แพ็กเกจของ release-checks

### Vitest

กล่อง Vitest คือ child workflow `CI` แบบแมนนวล CI แบบแมนนวลจงใจ
ข้าม changed scoping และบังคับกราฟทดสอบปกติสำหรับ release candidate:
Linux Node shards, bundled-plugin shards, channel contracts, ความเข้ากันได้กับ Node 22,
`check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android และ Control UI i18n

ใช้กล่องนี้เพื่อตอบว่า "source tree ผ่านชุดทดสอบปกติแบบเต็มหรือไม่"
กล่องนี้ไม่เหมือนกับการตรวจสอบผลิตภัณฑ์เส้นทางรีลีส หลักฐานที่ควรเก็บ:

- สรุป `Full Release Validation` ที่แสดง URL ของ run `CI` ที่ถูก dispatch
- run `CI` เป็นสีเขียวบน SHA เป้าหมายที่แน่นอน
- ชื่อ shard ที่ล้มเหลวหรือช้าจากงาน CI เมื่อสืบสวน regression
- artifacts เวลาของ Vitest เช่น `.artifacts/vitest-shard-timings.json` เมื่อ
  run ต้องการการวิเคราะห์ประสิทธิภาพ

รัน CI แบบแมนนวลโดยตรงเฉพาะเมื่อรีลีสต้องการ CI ปกติที่ deterministic แต่
ไม่ต้องการกล่อง Docker, QA Lab, live, cross-OS หรือ package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

กล่อง Docker อยู่ใน `OpenClaw Release Checks` ผ่าน
`openclaw-live-and-e2e-checks-reusable.yml` รวมถึงเวิร์กโฟลว์ `install-smoke`
แบบ release-mode กล่องนี้ตรวจสอบ release candidate ผ่านสภาพแวดล้อม Docker
แบบ packaged แทนที่จะใช้เฉพาะการทดสอบระดับ source

ความครอบคลุม Docker ของรีลีสประกอบด้วย:

- install smoke แบบเต็มโดยเปิดใช้ smoke การติดตั้ง global ของ Bun ที่ช้า
- การเตรียม/นำอิมเมจ smoke Dockerfile ที่ root กลับมาใช้ตาม SHA เป้าหมาย โดยมีงาน QR,
  root/gateway และ installer/Bun smoke รันเป็น install-smoke shards แยกกัน
- lanes E2E ของ repository
- chunks Docker เส้นทางรีลีส: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` และ `plugins-runtime-install-h`
- ความครอบคลุม OpenWebUI ภายใน chunk `plugins-runtime-services` เมื่อถูกร้องขอ
- lanes การติดตั้ง/ถอนการติดตั้ง bundled plugin แบบแยก
  `bundled-plugin-install-uninstall-0` ถึง
  `bundled-plugin-install-uninstall-23`
- ชุด provider live/E2E และความครอบคลุมโมเดล live ของ Docker เมื่อ release checks
  รวมชุด live

ใช้ artifacts ของ Docker ก่อน rerun scheduler เส้นทางรีลีสอัปโหลด
`.artifacts/docker-tests/` พร้อมล็อกของ lane, `summary.json`, `failures.json`,
เวลาของ phase, JSON แผน scheduler และคำสั่ง rerun สำหรับการกู้คืนแบบเจาะจง
ให้ใช้ `docker_lanes=<lane[,lane]>` บนเวิร์กโฟลว์ live/E2E ที่ reusable แทน
การ rerun chunks รีลีสทั้งหมด คำสั่ง rerun ที่สร้างขึ้นมี
`package_artifact_run_id` ก่อนหน้าและ input อิมเมจ Docker ที่เตรียมไว้เมื่อมีให้ใช้ ดังนั้น
lane ที่ล้มเหลวสามารถใช้ tarball และอิมเมจ GHCR เดิมได้

### QA Lab

กล่อง QA Lab เป็นส่วนหนึ่งของ `OpenClaw Release Checks` เช่นกัน กล่องนี้เป็น gate รีลีส
ด้านพฤติกรรม agentic และระดับช่องทาง แยกจาก Vitest และกลไกแพ็กเกจ Docker

ความครอบคลุม QA Lab ของรีลีสประกอบด้วย:

- gate ความเท่าเทียม mock ที่เปรียบเทียบ lane candidate ของ OpenAI กับ baseline Opus 4.6
  โดยใช้ agentic parity pack
- โปรไฟล์ Matrix QA แบบ live ที่เร็วโดยใช้ environment `qa-live-shared`
- lane Telegram QA แบบ live โดยใช้ credential leases ของ Convex CI
- `pnpm qa:otel:smoke` เมื่อ telemetry ของรีลีสต้องการหลักฐาน local ที่ชัดเจน

ใช้กล่องนี้เพื่อตอบว่า "รีลีสทำงานถูกต้องในสถานการณ์ QA และ flow ช่องทาง live หรือไม่"
เก็บ URL artifacts สำหรับ lanes parity, Matrix และ Telegram เมื่ออนุมัติรีลีส
ความครอบคลุม Matrix แบบเต็มยังคงมีให้ใช้เป็นการรัน QA-Lab แบบ sharded ด้วยตนเอง
แทนที่จะเป็น lane ค่าเริ่มต้นที่สำคัญต่อรีลีส

### Package

กล่อง Package คือ gate ของผลิตภัณฑ์ที่ติดตั้งได้ กล่องนี้รองรับโดย
`Package Acceptance` และ resolver
`scripts/resolve-openclaw-package-candidate.mjs` resolver จะ normalize candidate
เป็น tarball `package-under-test` ที่ Docker E2E ใช้, ตรวจสอบ inventory ของแพ็กเกจ,
บันทึกเวอร์ชันแพ็กเกจและ SHA-256 และแยก ref ของ workflow harness ออกจาก ref
source ของแพ็กเกจ

แหล่ง candidate ที่รองรับ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรีลีส OpenClaw ที่แน่นอน
- `source=ref`: pack branch, tag หรือ commit SHA เต็มของ `package_ref` ที่เชื่อถือได้
  ด้วย harness `workflow_ref` ที่เลือก
- `source=url`: ดาวน์โหลด `.tgz` ผ่าน HTTPS พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: นำ `.tgz` ที่อัปโหลดโดย GitHub Actions run อื่นกลับมาใช้

`OpenClaw Release Checks` รัน Package Acceptance ด้วย `source=artifact`,
artifact แพ็กเกจรีลีสที่เตรียมไว้, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=release-history`,
`published_upgrade_survivor_scenarios=reported-issues` และ
`telegram_mode=mock-openai` Package Acceptance ทำให้ migration, update, การล้าง
dependency ของ plugin ที่ stale, fixtures plugin แบบ offline, การอัปเดต plugin และ Telegram
package QA ใช้ tarball ที่ resolve แล้วเดียวกัน กล่องนี้เป็นตัวแทน GitHub-native
สำหรับความครอบคลุม package/update ส่วนใหญ่ที่ก่อนหน้านี้ต้องใช้ Parallels
การตรวจสอบรีลีสข้าม OS ยังคงสำคัญสำหรับ onboarding, installer และพฤติกรรม platform
เฉพาะ OS แต่การตรวจสอบผลิตภัณฑ์ package/update ควรเลือกใช้ Package Acceptance

checklist มาตรฐานสำหรับการตรวจสอบ update และ plugin คือ
[การทดสอบ updates และ plugins](/th/help/testing-updates-plugins) ใช้รายการนี้เมื่อ
ตัดสินว่า lane local, Docker, Package Acceptance หรือ release-check ใดพิสูจน์
การติดตั้ง/อัปเดต plugin, doctor cleanup หรือการเปลี่ยนแปลง migration ของแพ็กเกจที่เผยแพร่แล้ว
การ migration update ที่เผยแพร่แล้วอย่างครอบคลุมจากทุกแพ็กเกจ stable `2026.4.23+`
เป็นเวิร์กโฟลว์ `Update Migration` แบบแมนนวลแยกต่างหาก ไม่ใช่ส่วนหนึ่งของ Full Release CI

ความผ่อนปรนของ package-acceptance รุ่นเก่าถูกจำกัดเวลาด้วยเจตนา แพ็กเกจจนถึง
`2026.4.25` อาจใช้เส้นทาง compatibility สำหรับช่องว่าง metadata ที่เผยแพร่ไปยัง npm แล้ว:
รายการ QA inventory แบบ private ที่หายไปจาก tarball, `gateway install --wrapper` ที่หายไป,
ไฟล์ patch ที่หายไปใน git fixture ที่ได้จาก tarball, `update.channel` ที่ persist หายไป,
ตำแหน่ง install-record ของ plugin รุ่นเก่า, persistence ของ marketplace install-record ที่หายไป
และการ migration metadata ของ config ระหว่าง `plugins update` แพ็กเกจ `2026.4.26`
ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ local build metadata stamp ที่เคย ship แล้ว
แพ็กเกจที่ใหม่กว่าต้องเป็นไปตามสัญญาแพ็กเกจสมัยใหม่; ช่องว่างเดียวกันเหล่านั้นจะทำให้
การตรวจสอบรีลีสล้มเหลว

ใช้โปรไฟล์ Package Acceptance ที่กว้างกว่าเมื่อคำถามของรีลีสเกี่ยวกับ
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

- `smoke`: lanes ติดตั้งแพ็กเกจ/channel/agent แบบเร็ว, gateway network และการ reload config
- `package`: สัญญา install/update/plugin package โดยไม่มี ClawHub แบบ live; นี่คือค่าเริ่มต้นของ release-check
- `product`: `package` รวมกับ MCP channels, cron/subagent cleanup, OpenAI web
  search และ OpenWebUI
- `full`: chunks เส้นทางรีลีส Docker พร้อม OpenWebUI
- `custom`: รายการ `docker_lanes` ที่แน่นอนสำหรับ rerun แบบเจาะจง

สำหรับหลักฐาน Telegram ของแพ็กเกจตัวเลือก ให้เปิดใช้ `telegram_mode=mock-openai` หรือ
`telegram_mode=live-frontier` บน Package Acceptance เวิร์กโฟลว์จะส่งทาร์บอล
`package-under-test` ที่ resolve แล้วเข้าไปในเลน Telegram ส่วนเวิร์กโฟลว์
Telegram แบบสแตนด์อโลนยังคงรับสเปก npm ที่เผยแพร่แล้วสำหรับการตรวจสอบหลังเผยแพร่

## ระบบอัตโนมัติสำหรับเผยแพร่รีลีส

`OpenClaw Release Publish` คือจุดเข้าหลักตามปกติสำหรับการเผยแพร่ที่มีการเปลี่ยนแปลงสถานะ โดยจะประสานงาน
เวิร์กโฟลว์ trusted-publisher ตามลำดับที่รีลีสต้องใช้:

1. เช็กเอาต์แท็กรีลีสและ resolve commit SHA ของแท็กนั้น
2. ตรวจสอบว่าแท็กเข้าถึงได้จาก `main` หรือ `release/*`
3. รัน `pnpm plugins:sync:check`
4. Dispatch `Plugin NPM Release` ด้วย `publish_scope=all-publishable` และ
   `ref=<release-sha>`
5. Dispatch `Plugin ClawHub Release` ด้วย scope และ SHA เดียวกัน
6. Dispatch `OpenClaw NPM Release` ด้วยแท็กรีลีส, npm dist-tag และ
   `preflight_run_id` ที่บันทึกไว้

ตัวอย่างการเผยแพร่เบตา:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

เผยแพร่ stable ไปยัง dist-tag เบตาเริ่มต้น:

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
เฉพาะสำหรับงานซ่อมแซมหรือเผยแพร่ซ้ำแบบเจาะจงเท่านั้น สำหรับการซ่อมแซม plugin ที่เลือก ให้ส่ง
`plugin_publish_scope=selected` และ `plugins=@openclaw/name` ไปยัง
`OpenClaw Release Publish` หรือ dispatch เวิร์กโฟลว์ลูกโดยตรงเมื่อ
ต้องไม่เผยแพร่แพ็กเกจ OpenClaw

## อินพุตของเวิร์กโฟลว์ NPM

`OpenClaw NPM Release` รับอินพุตที่ผู้ปฏิบัติงานควบคุมได้ดังนี้:

- `tag`: แท็กรีลีสที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1` หรือ
  `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` อาจเป็น commit SHA แบบเต็ม
  40 อักขระปัจจุบันของสาขาเวิร์กโฟลว์สำหรับ preflight เพื่อการตรวจสอบเท่านั้นได้ด้วย
- `preflight_only`: `true` สำหรับการตรวจสอบ/บิลด์/แพ็กเกจเท่านั้น, `false` สำหรับ
  เส้นทางเผยแพร่จริง
- `preflight_run_id`: จำเป็นบนเส้นทางเผยแพร่จริง เพื่อให้เวิร์กโฟลว์ใช้ทาร์บอล
  ที่เตรียมไว้จาก preflight run ที่สำเร็จซ้ำ
- `npm_dist_tag`: แท็กเป้าหมายของ npm สำหรับเส้นทางเผยแพร่; ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Publish` รับอินพุตที่ผู้ปฏิบัติงานควบคุมได้ดังนี้:

- `tag`: แท็กรีลีสที่จำเป็น; ต้องมีอยู่แล้ว
- `preflight_run_id`: run id ของ preflight `OpenClaw NPM Release` ที่สำเร็จ;
  จำเป็นเมื่อ `publish_openclaw_npm=true`
- `npm_dist_tag`: แท็กเป้าหมายของ npm สำหรับแพ็กเกจ OpenClaw
- `plugin_publish_scope`: ค่าเริ่มต้นคือ `all-publishable`; ใช้ `selected` เฉพาะ
  สำหรับงานซ่อมแซมแบบเจาะจง
- `plugins`: ชื่อแพ็กเกจ `@openclaw/*` คั่นด้วยจุลภาคเมื่อ
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: ค่าเริ่มต้นคือ `true`; ตั้งเป็น `false` เฉพาะเมื่อใช้
  เวิร์กโฟลว์เป็นตัวประสานงานซ่อมแซมเฉพาะ plugin

`OpenClaw Release Checks` รับอินพุตที่ผู้ปฏิบัติงานควบคุมได้ดังนี้:

- `ref`: สาขา แท็ก หรือ commit SHA แบบเต็มที่จะตรวจสอบ การตรวจสอบที่มี secret
  ต้องให้คอมมิตที่ resolve แล้วเข้าถึงได้จากสาขา OpenClaw หรือ
  แท็กรีลีส

กฎ:

- แท็ก stable และแท็กแก้ไขอาจเผยแพร่ไปยัง `beta` หรือ `latest` ก็ได้
- แท็ก prerelease เบตาเผยแพร่ได้เฉพาะไปยัง `beta`
- สำหรับ `OpenClaw NPM Release` อนุญาตให้อินพุตเป็น commit SHA แบบเต็มเฉพาะเมื่อ
  `preflight_only=true`
- `OpenClaw Release Checks` และ `Full Release Validation` เป็นการตรวจสอบเท่านั้นเสมอ
- เส้นทางเผยแพร่จริงต้องใช้ `npm_dist_tag` เดียวกับที่ใช้ระหว่าง preflight;
  เวิร์กโฟลว์จะตรวจสอบ metadata นั้นก่อนดำเนินการเผยแพร่ต่อ

## ลำดับการรีลีส npm stable

เมื่อตัดรีลีส npm แบบ stable:

1. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนมีแท็ก คุณอาจใช้ commit SHA แบบเต็มปัจจุบันของสาขาเวิร์กโฟลว์
     สำหรับ dry run ของเวิร์กโฟลว์ preflight เพื่อการตรวจสอบเท่านั้น
2. เลือก `npm_dist_tag=beta` สำหรับโฟลว์ปกติแบบ beta-first หรือ `latest` เฉพาะ
   เมื่อคุณตั้งใจให้เผยแพร่ stable โดยตรง
3. รัน `Full Release Validation` บนสาขารีลีส แท็กรีลีส หรือ commit SHA แบบเต็ม
   เมื่อคุณต้องการ CI ปกติพร้อมความครอบคลุมจากเวิร์กโฟลว์แบบแมนนวลเดียวสำหรับ live prompt cache,
   Docker, QA Lab, Matrix และ Telegram
4. หากคุณตั้งใจต้องการเฉพาะกราฟการทดสอบปกติแบบ deterministic ให้รันเวิร์กโฟลว์
   `CI` แบบแมนนวลบน release ref แทน
5. บันทึก `preflight_run_id` ที่สำเร็จ
6. รัน `OpenClaw Release Publish` ด้วย `tag` เดียวกัน, `npm_dist_tag` เดียวกัน
   และ `preflight_run_id` ที่บันทึกไว้; เวิร์กโฟลว์จะเผยแพร่ plugin ที่ externalize แล้วไปยัง npm
   และ ClawHub ก่อนโปรโมตแพ็กเกจ npm ของ OpenClaw
7. หากรีลีสลงบน `beta` ให้ใช้เวิร์กโฟลว์ส่วนตัว
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   เพื่อโปรโมต stable version นั้นจาก `beta` ไปยัง `latest`
8. หากรีลีสตั้งใจเผยแพร่ไปยัง `latest` โดยตรง และ `beta`
   ควรตามบิลด์ stable เดียวกันทันที ให้ใช้เวิร์กโฟลว์ส่วนตัวเดียวกัน
   เพื่อชี้ dist-tag ทั้งสองไปยัง stable version หรือปล่อยให้การซิงก์ self-healing ตามกำหนดเวลา
   ย้าย `beta` ภายหลัง

การเปลี่ยนแปลง dist-tag อยู่ใน repo ส่วนตัวเพื่อความปลอดภัย เพราะยังคง
ต้องใช้ `NPM_TOKEN` ขณะที่ repo สาธารณะเก็บการเผยแพร่แบบ OIDC-only ไว้

สิ่งนี้ทำให้ทั้งเส้นทางเผยแพร่โดยตรงและเส้นทางโปรโมตแบบ beta-first
มีเอกสารกำกับและมองเห็นได้สำหรับผู้ปฏิบัติงาน

หาก maintainer ต้อง fallback ไปใช้การยืนยันตัวตน npm แบบ local ให้รันคำสั่ง
1Password CLI (`op`) ใดๆ เฉพาะภายในเซสชัน tmux ที่จัดไว้โดยเฉพาะเท่านั้น อย่าเรียก `op`
โดยตรงจาก shell หลักของเอเจนต์; การเก็บไว้ภายใน tmux ทำให้ prompt,
การแจ้งเตือน และการจัดการ OTP สังเกตเห็นได้ และป้องกันการแจ้งเตือน host ซ้ำๆ

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
