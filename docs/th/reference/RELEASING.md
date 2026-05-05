---
read_when:
    - กำลังค้นหานิยามช่องทางการเผยแพร่สาธารณะ
    - การเรียกใช้การตรวจสอบความถูกต้องของรุ่นหรือการยอมรับแพ็กเกจ
    - กำลังมองหาข้อมูลเรื่องการตั้งชื่อเวอร์ชันและรอบการเผยแพร่
summary: เลนการเผยแพร่, รายการตรวจสอบสำหรับผู้ปฏิบัติงาน, กล่องตรวจสอบความถูกต้อง, การตั้งชื่อเวอร์ชัน และรอบเวลา
title: นโยบายการเผยแพร่รุ่น
x-i18n:
    generated_at: "2026-05-05T01:49:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41886d3bb2f970e6a86944e5ff207b1b29b1b64b1f234d45f626fed19cf032b3
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw มีเลนการเผยแพร่สาธารณะสามเลน:

- เสถียร: รุ่นเผยแพร่ที่ติดแท็กซึ่งเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อมีการร้องขออย่างชัดเจน
- เบต้า: แท็กก่อนเผยแพร่ที่เผยแพร่ไปยัง npm `beta`
- พัฒนา: head ที่เคลื่อนไหวของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันรุ่นเผยแพร่เสถียร: `YYYY.M.D`
  - แท็ก Git: `vYYYY.M.D`
- เวอร์ชันรุ่นแก้ไขของรุ่นเสถียร: `YYYY.M.D-N`
  - แท็ก Git: `vYYYY.M.D-N`
- เวอร์ชันก่อนเผยแพร่เบต้า: `YYYY.M.D-beta.N`
  - แท็ก Git: `vYYYY.M.D-beta.N`
- อย่าเติมศูนย์นำหน้าให้เดือนหรือวัน
- `latest` หมายถึงรุ่นเผยแพร่ npm เสถียรที่ได้รับการโปรโมตในปัจจุบัน
- `beta` หมายถึงเป้าหมายการติดตั้งเบต้าปัจจุบัน
- รุ่นเผยแพร่เสถียรและรุ่นแก้ไขของรุ่นเสถียรเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น; ผู้ปฏิบัติการเผยแพร่สามารถกำหนดเป้าหมายเป็น `latest` อย่างชัดเจน หรือโปรโมตบิลด์เบต้าที่ผ่านการตรวจสอบแล้วในภายหลัง
- รุ่นเผยแพร่ OpenClaw เสถียรทุกชุดจัดส่งแพ็กเกจ npm และแอป macOS พร้อมกัน;
  โดยปกติรุ่นเบต้าจะตรวจสอบและเผยแพร่เส้นทาง npm/แพ็กเกจก่อน โดยสงวนการ
  บิลด์/ลงนาม/รับรองแอป Mac ไว้สำหรับรุ่นเสถียร เว้นแต่จะมีการร้องขออย่างชัดเจน

## รอบการเผยแพร่

- การเผยแพร่จะไปตามลำดับเบต้าก่อน
- รุ่นเสถียรจะตามมาหลังจากเบต้าล่าสุดผ่านการตรวจสอบแล้วเท่านั้น
- โดยปกติผู้ดูแลจะตัดรุ่นเผยแพร่จากสาขา `release/YYYY.M.D` ที่สร้าง
  จาก `main` ปัจจุบัน เพื่อให้การตรวจสอบและการแก้ไขของรุ่นเผยแพร่ไม่บล็อกการ
  พัฒนาใหม่บน `main`
- หากแท็กเบต้าถูก push หรือเผยแพร่แล้วและต้องมีการแก้ไข ผู้ดูแลจะตัด
  แท็ก `-beta.N` ถัดไปแทนการลบหรือสร้างแท็กเบต้าเดิมใหม่
- ขั้นตอนการเผยแพร่โดยละเอียด การอนุมัติ ข้อมูลรับรอง และบันทึกการกู้คืนเป็น
  ข้อมูลสำหรับผู้ดูแลเท่านั้น

## รายการตรวจสอบผู้ปฏิบัติการเผยแพร่

รายการตรวจสอบนี้คือรูปแบบสาธารณะของโฟลว์การเผยแพร่ ข้อมูลรับรองส่วนตัว,
การลงนาม, การรับรอง, การกู้คืน dist-tag, และรายละเอียดการย้อนกลับฉุกเฉินจะอยู่ใน
คู่มือปฏิบัติการเผยแพร่สำหรับผู้ดูแลเท่านั้น

1. เริ่มจาก `main` ปัจจุบัน: pull ล่าสุด ยืนยันว่าคอมมิตเป้าหมายถูก push แล้ว
   และยืนยันว่า CI ของ `main` ปัจจุบันเขียวเพียงพอสำหรับการสร้างสาขาจากจุดนั้น
2. เขียนส่วนบนสุดของ `CHANGELOG.md` ใหม่จากประวัติคอมมิตจริงด้วย
   `/changelog` ให้รายการเป็นมุมมองผู้ใช้ คอมมิต push แล้ว rebase/pull
   อีกครั้งก่อนสร้างสาขา
3. ตรวจทานบันทึกความเข้ากันได้ของรุ่นเผยแพร่ใน
   `src/plugins/compat/registry.ts` และ
   `src/commands/doctor/shared/deprecation-compat.ts` ลบความเข้ากันได้
   ที่หมดอายุแล้วเฉพาะเมื่อเส้นทางอัปเกรดยังคงครอบคลุมอยู่ หรือบันทึกเหตุผลว่า
   เหตุใดจึงตั้งใจเก็บไว้
4. สร้าง `release/YYYY.M.D` จาก `main` ปัจจุบัน; อย่าทำงานเผยแพร่ตามปกติ
   โดยตรงบน `main`
5. เพิ่มเวอร์ชันในทุกตำแหน่งที่จำเป็นสำหรับแท็กที่ต้องการ รัน
   `pnpm plugins:sync` เพื่อให้แพ็กเกจ Plugin ที่เผยแพร่ได้ใช้เวอร์ชันรุ่นเผยแพร่
   และเมทาดาทาความเข้ากันได้ร่วมกัน จากนั้นรัน preflight แบบกำหนดผลซ้ำได้ในเครื่อง:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, และ
   `pnpm release:check`
6. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true` ก่อนมีแท็ก
   อนุญาตให้ใช้ SHA ของสาขารุ่นเผยแพร่แบบเต็ม 40 อักขระสำหรับ preflight
   เพื่อการตรวจสอบเท่านั้น บันทึก `preflight_run_id` ที่สำเร็จ
7. เริ่มการทดสอบก่อนเผยแพร่ทั้งหมดด้วย `Full Release Validation` สำหรับ
   สาขารุ่นเผยแพร่ แท็ก หรือ SHA คอมมิตแบบเต็ม นี่คือจุดเข้าใช้งานด้วยตนเอง
   เพียงจุดเดียวสำหรับกล่องทดสอบรุ่นเผยแพร่ขนาดใหญ่ทั้งสี่: Vitest, Docker, ห้องปฏิบัติการ QA, และแพ็กเกจ
8. หากการตรวจสอบล้มเหลว ให้แก้ไขบนสาขารุ่นเผยแพร่และรันไฟล์ เลน งานเวิร์กโฟลว์
   โปรไฟล์แพ็กเกจ ผู้ให้บริการ หรือรายการอนุญาตโมเดลที่ล้มเหลวซึ่งเล็กที่สุด
   ที่พิสูจน์การแก้ไข รัน umbrella ทั้งหมดอีกครั้งเฉพาะเมื่อพื้นผิวที่เปลี่ยนทำให้
   หลักฐานเดิมล้าสมัย
9. สำหรับเบต้า ให้แท็ก `vYYYY.M.D-beta.N` แล้วรัน `OpenClaw Release Publish` จาก
   สาขา `release/YYYY.M.D` ที่ตรงกัน ระบบจะตรวจสอบ `pnpm plugins:sync:check`,
   เผยแพร่แพ็กเกจ Plugin ที่เผยแพร่ได้ทั้งหมดไปยัง npm ก่อน, เผยแพร่ชุดเดียวกัน
   ไปยัง ClawHub เป็นลำดับที่สองในรูป tarball แบบ ClawPack npm-pack, แล้วโปรโมต
   อาร์ติแฟกต์ preflight npm ของ OpenClaw ที่เตรียมไว้ด้วย dist-tag ที่ตรงกัน หลังจาก
   เผยแพร่ ให้รันการยอมรับแพ็กเกจหลังเผยแพร่กับแพ็กเกจ
   `openclaw@YYYY.M.D-beta.N` หรือ `openclaw@beta` ที่เผยแพร่แล้ว หากรุ่นก่อนเผยแพร่
   ที่ถูก push หรือเผยแพร่แล้วต้องมีการแก้ไข ให้ตัดหมายเลขรุ่นก่อนเผยแพร่ถัดไป
   ที่ตรงกัน; อย่าลบหรือเขียนทับรุ่นก่อนเผยแพร่เดิม
10. สำหรับรุ่นเสถียร ให้ดำเนินการต่อเฉพาะหลังจากเบต้าที่ผ่านการตรวจสอบแล้วหรือ release candidate มี
    หลักฐานการตรวจสอบที่จำเป็น การเผยแพร่ npm เสถียรก็ดำเนินผ่าน
    `OpenClaw Release Publish` เช่นกัน โดยใช้อาร์ติแฟกต์ preflight ที่สำเร็จผ่าน
    `preflight_run_id`; ความพร้อมของรุ่นเผยแพร่ macOS เสถียรยังต้องมี
    `.zip`, `.dmg`, `.dSYM.zip` ที่จัดแพ็กเกจแล้ว และ `appcast.xml` ที่อัปเดตบน `main`
11. หลังเผยแพร่ ให้รันตัวตรวจสอบหลังเผยแพร่ของ npm, E2E Telegram แบบ
    npm ที่เผยแพร่แล้วในโหมดสแตนด์อโลนซึ่งเป็นทางเลือกเมื่อคุณต้องการหลักฐานช่องทางหลังเผยแพร่,
    การโปรโมต dist-tag เมื่อจำเป็น, บันทึกรุ่นเผยแพร่/รุ่นก่อนเผยแพร่ของ GitHub จาก
    ส่วน `CHANGELOG.md` ที่ตรงกันอย่างครบถ้วน, และขั้นตอนการประกาศรุ่นเผยแพร่

## Preflight รุ่นเผยแพร่

- เรียกใช้ `pnpm check:test-types` ก่อนการตรวจสอบก่อนปล่อย เพื่อให้ TypeScript ของเทสต์ยังถูกครอบคลุมนอกเกต `pnpm check` ภายในเครื่องที่เร็วกว่า
- เรียกใช้ `pnpm check:architecture` ก่อนการตรวจสอบก่อนปล่อย เพื่อให้การตรวจสอบวงจร import และขอบเขตสถาปัตยกรรมที่กว้างขึ้นผ่านนอกเกตภายในเครื่องที่เร็วกว่า
- เรียกใช้ `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้มีอาร์ติแฟกต์ปล่อย `dist/*` ที่คาดไว้และบันเดิล Control UI สำหรับขั้นตอนตรวจสอบแพ็ก
- เรียกใช้ `pnpm plugins:sync` หลังจากปรับเวอร์ชันรากและก่อนติดแท็ก คำสั่งนี้อัปเดตเวอร์ชันแพ็กเกจ Plugin ที่เผยแพร่ได้, เมตาดาต้าความเข้ากันได้ของ OpenClaw peer/API, เมตาดาต้าบิลด์ และสตับบันทึกการเปลี่ยนแปลงของ Plugin ให้ตรงกับเวอร์ชันปล่อยของ core `pnpm plugins:sync:check` คือการ์ดปล่อยแบบไม่เปลี่ยนแปลงไฟล์; เวิร์กโฟลว์เผยแพร่จะล้มเหลวก่อนมีการเปลี่ยนแปลง registry ใดๆ หากลืมขั้นตอนนี้
- เรียกใช้เวิร์กโฟลว์แบบแมนนวล `Full Release Validation` ก่อนอนุมัติการปล่อย เพื่อเริ่มกล่องทดสอบก่อนปล่อยทั้งหมดจากจุดเริ่มต้นเดียว รองรับ branch, tag หรือ SHA commit เต็ม, dispatch `CI` แบบแมนนวล และ dispatch `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, การตรวจสอบแพ็กเกจข้าม OS, QA Lab parity, Matrix และเลน Telegram การรัน stable/default จะเก็บ live/E2E แบบละเอียดและ Docker release-path soak ไว้หลัง `run_release_soak=true`; `release_profile=full` จะบังคับเปิด soak เมื่อใช้ `release_profile=full` และ `rerun_group=all` จะรัน package Telegram E2E กับอาร์ติแฟกต์ `release-package-under-test` จาก release checks ด้วย ระบุ `npm_telegram_package_spec` หลังเผยแพร่เมื่อ Telegram E2E เดียวกันควรพิสูจน์แพ็กเกจ npm ที่เผยแพร่แล้วด้วย ระบุ `package_acceptance_package_spec` หลังเผยแพร่เมื่อ Package Acceptance ควรรันเมทริกซ์ package/update กับแพ็กเกจ npm ที่จัดส่งแล้วแทนอาร์ติแฟกต์ที่บิลด์จาก SHA ระบุ `evidence_package_spec` เมื่อรายงานหลักฐานส่วนตัวควรพิสูจน์ว่าการตรวจสอบตรงกับแพ็กเกจ npm ที่เผยแพร่แล้วโดยไม่บังคับ Telegram E2E ตัวอย่าง:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- เรียกใช้เวิร์กโฟลว์แบบแมนนวล `Package Acceptance` เมื่อต้องการหลักฐานจาก side-channel สำหรับตัวเลือกแพ็กเกจระหว่างที่งานปล่อยยังดำเนินต่อ ใช้ `source=npm` สำหรับ `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันปล่อยแบบเจาะจง; `source=ref` เพื่อแพ็ก branch/tag/SHA `package_ref` ที่เชื่อถือได้ด้วย harness `workflow_ref` ปัจจุบัน; `source=url` สำหรับ tarball HTTPS พร้อม SHA-256 ที่จำเป็น; หรือ `source=artifact` สำหรับ tarball ที่อัปโหลดโดย GitHub Actions run อื่น เวิร์กโฟลว์จะ resolve ตัวเลือกเป็น `package-under-test`, นำตัวจัดตาราง Docker E2E release มาใช้ซ้ำกับ tarball นั้น และสามารถรัน Telegram QA กับ tarball เดียวกันด้วย `telegram_mode=mock-openai` หรือ `telegram_mode=live-frontier` เมื่อเลน Docker ที่เลือกมี `published-upgrade-survivor` อาร์ติแฟกต์แพ็กเกจคือตัวเลือก และ `published_upgrade_survivor_baseline` จะเลือก baseline ที่เผยแพร่แล้ว
  ตัวอย่าง: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  โปรไฟล์ทั่วไป:
  - `smoke`: เลน install/channel/agent, เครือข่าย Gateway และโหลด config ใหม่
  - `package`: เลน package/update/plugin ที่อิงอาร์ติแฟกต์โดยตรง โดยไม่มี OpenWebUI หรือ ClawHub live
  - `product`: โปรไฟล์ package พร้อมช่อง MCP, การล้าง cron/subagent, OpenAI web search และ OpenWebUI
  - `full`: ชังก์ Docker release-path พร้อม OpenWebUI
  - `custom`: การเลือก `docker_lanes` แบบเจาะจงสำหรับการรันซ้ำเฉพาะจุด
- เรียกใช้เวิร์กโฟลว์แบบแมนนวล `CI` โดยตรงเมื่อคุณต้องการเฉพาะความครอบคลุม CI ปกติเต็มรูปแบบสำหรับ release candidate การ dispatch CI แบบแมนนวลจะข้าม changed scoping และบังคับเลน Linux Node shards, bundled-plugin shards, channel contracts, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, Android และ Control UI i18n
  ตัวอย่าง: `gh workflow run ci.yml --ref release/YYYY.M.D`
- เรียกใช้ `pnpm qa:otel:smoke` เมื่อตรวจสอบ telemetry สำหรับการปล่อย คำสั่งนี้ทดสอบ QA-lab ผ่านตัวรับ OTLP/HTTP ภายในเครื่อง และยืนยันชื่อ span ของ trace ที่ส่งออก, attributes ที่มีขอบเขต และการ redact เนื้อหา/ตัวระบุ โดยไม่ต้องใช้ Opik, Langfuse หรือตัวรวบรวมภายนอกอื่น
- เรียกใช้ `pnpm release:check` ก่อนการปล่อยที่ติดแท็กทุกครั้ง
- เรียกใช้ `OpenClaw Release Publish` สำหรับลำดับการเผยแพร่ที่เปลี่ยนแปลงสถานะหลังมี tag แล้ว Dispatch จาก `release/YYYY.M.D` (หรือ `main` เมื่อเผยแพร่ tag ที่เข้าถึงได้จาก main), ส่ง release tag และ `preflight_run_id` ของ OpenClaw npm ที่สำเร็จ และคงขอบเขตเผยแพร่ Plugin ค่าเริ่มต้น `all-publishable` ไว้ เว้นแต่ตั้งใจรันการซ่อมเฉพาะจุด เวิร์กโฟลว์จะ serialize การเผยแพร่ Plugin npm, การเผยแพร่ Plugin ClawHub และการเผยแพร่ OpenClaw npm เพื่อไม่ให้แพ็กเกจ core ถูกเผยแพร่ก่อน Plugin ที่ externalize แล้ว
- ตอนนี้ release checks รันในเวิร์กโฟลว์แบบแมนนวลแยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรันเลน QA Lab mock parity รวมถึงโปรไฟล์ Matrix live แบบเร็วและเลน Telegram QA ก่อนอนุมัติการปล่อย เลน live ใช้สภาพแวดล้อม `qa-live-shared`; Telegram ยังใช้ credential leases ของ Convex CI ด้วย เรียกใช้เวิร์กโฟลว์แบบแมนนวล `QA-Lab - All Lanes` ด้วย `matrix_profile=all` และ `matrix_shards=true` เมื่อต้องการ inventory ของ Matrix transport, media และ E2EE แบบเต็มในแบบขนาน
- การตรวจสอบ runtime สำหรับการติดตั้งและอัปเกรดข้าม OS เป็นส่วนหนึ่งของ `OpenClaw Release Checks` และ `Full Release Validation` สาธารณะ ซึ่งเรียกเวิร์กโฟลว์ที่ใช้ซ้ำได้ `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` โดยตรง
- การแยกนี้ตั้งใจทำไว้: รักษาเส้นทางปล่อย npm จริงให้สั้น กำหนดผลได้ และเน้นอาร์ติแฟกต์ ขณะที่การตรวจสอบ live ที่ช้ากว่าจะอยู่ในเลนของตัวเองเพื่อไม่ให้หน่วงหรือบล็อกการเผยแพร่
- release checks ที่มี secret ควรถูก dispatch ผ่าน `Full Release Validation` หรือจาก workflow ref ของ `main`/release เพื่อให้ logic ของเวิร์กโฟลว์และ secrets ยังคงถูกควบคุม
- `OpenClaw Release Checks` รองรับ branch, tag หรือ SHA commit เต็ม ตราบใดที่ commit ที่ resolve แล้วเข้าถึงได้จาก branch หรือ release tag ของ OpenClaw
- preflight แบบ validation-only ของ `OpenClaw NPM Release` ยังรองรับ SHA commit เต็ม 40 อักขระของ workflow-branch ปัจจุบันโดยไม่ต้องมี tag ที่ push แล้ว
- เส้นทาง SHA นั้นใช้สำหรับ validation-only และไม่สามารถโปรโมตเป็นการเผยแพร่จริงได้
- ในโหมด SHA เวิร์กโฟลว์จะสังเคราะห์ `v<package.json version>` เฉพาะสำหรับการตรวจสอบเมตาดาต้าแพ็กเกจเท่านั้น; การเผยแพร่จริงยังต้องมี release tag จริง
- ทั้งสองเวิร์กโฟลว์คงเส้นทางเผยแพร่และโปรโมตจริงไว้บน GitHub-hosted runners ขณะที่เส้นทางตรวจสอบแบบไม่เปลี่ยนแปลงสถานะสามารถใช้ Blacksmith Linux runners ที่ใหญ่กว่าได้
- เวิร์กโฟลว์นั้นรัน
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ทั้ง workflow secrets `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- npm release preflight ไม่รอเลน release checks แยกอีกต่อไป
- เรียกใช้ `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือ tag beta/correction ที่ตรงกัน) ก่อนอนุมัติ
- หลังเผยแพร่ npm ให้เรียกใช้
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (หรือเวอร์ชัน beta/correction ที่ตรงกัน) เพื่อตรวจสอบเส้นทางติดตั้ง registry ที่เผยแพร่แล้วใน temp prefix ใหม่
- หลังเผยแพร่ beta ให้รัน `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  เพื่อตรวจสอบการ onboarding ของแพ็กเกจที่ติดตั้งแล้ว, การตั้งค่า Telegram และ Telegram E2E จริงกับแพ็กเกจ npm ที่เผยแพร่แล้ว โดยใช้พูล credential Telegram แบบ lease ร่วมกัน การรันเฉพาะกิจในเครื่องของ maintainer อาจละเว้นตัวแปร Convex และส่ง credentials env `OPENCLAW_QA_TELEGRAM_*` ทั้งสามโดยตรงได้
- หากต้องการรัน post-publish beta smoke แบบเต็มจากเครื่อง maintainer ให้ใช้ `pnpm release:beta-smoke -- --beta betaN` ตัวช่วยจะรันการตรวจสอบ npm update/fresh-target ของ Parallels, dispatch `NPM Telegram Beta E2E`, poll workflow run ที่เจาะจง, ดาวน์โหลดอาร์ติแฟกต์ และพิมพ์รายงาน Telegram
- Maintainers สามารถรันการตรวจสอบหลังเผยแพร่เดียวกันจาก GitHub Actions ผ่านเวิร์กโฟลว์แบบแมนนวล `NPM Telegram Beta E2E` ได้ เวิร์กโฟลว์นี้ตั้งใจให้เป็น manual-only และไม่รันทุกครั้งที่ merge
- ระบบอัตโนมัติสำหรับการปล่อยของ maintainer ตอนนี้ใช้ preflight-then-promote:
  - การเผยแพร่ npm จริงต้องผ่าน npm `preflight_run_id` ที่สำเร็จ
  - การเผยแพร่ npm จริงต้องถูก dispatch จาก branch `main` หรือ `release/YYYY.M.D` เดียวกันกับ preflight run ที่สำเร็จ
  - การปล่อย npm แบบ stable มีค่าเริ่มต้นเป็น `beta`
  - การเผยแพร่ npm แบบ stable สามารถ target `latest` ได้อย่างชัดเจนผ่าน workflow input
  - การเปลี่ยนแปลง npm dist-tag ที่ใช้ token ตอนนี้อยู่ใน
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    เพื่อความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่ repo สาธารณะคงการเผยแพร่แบบ OIDC-only ไว้
  - `macOS Release` สาธารณะเป็น validation-only; เมื่อ tag อยู่เฉพาะบน release branch แต่เวิร์กโฟลว์ถูก dispatch จาก `main` ให้ตั้งค่า `public_release_branch=release/YYYY.M.D`
  - การเผยแพร่ mac ส่วนตัวจริงต้องผ่าน `preflight_run_id` และ `validate_run_id` ของ mac ส่วนตัวที่สำเร็จ
  - เส้นทางเผยแพร่จริงจะโปรโมตอาร์ติแฟกต์ที่เตรียมไว้แทนการบิลด์ซ้ำอีกครั้ง
- สำหรับ stable correction releases เช่น `YYYY.M.D-N` ตัวตรวจสอบหลังเผยแพร่จะตรวจสอบเส้นทางอัปเกรด temp-prefix เดียวกันจาก `YYYY.M.D` เป็น `YYYY.M.D-N` ด้วย เพื่อไม่ให้การแก้ไข release ปล่อยให้การติดตั้ง global รุ่นเก่าค้างอยู่บน payload stable พื้นฐานอย่างเงียบๆ
- npm release preflight จะ fail closed เว้นแต่ tarball จะมีทั้ง `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่าง เพื่อไม่ให้เราจัดส่งแดชบอร์ดเบราว์เซอร์ว่างอีก
- การตรวจสอบหลังเผยแพร่ยังตรวจว่า entrypoints ของ Plugin ที่เผยแพร่แล้วและเมตาดาต้าแพ็กเกจมีอยู่ใน layout ของ registry ที่ติดตั้งแล้ว release ที่จัดส่ง payload runtime ของ Plugin ขาดหายจะล้มเหลวในตัวตรวจสอบ postpublish และไม่สามารถโปรโมตเป็น `latest` ได้
- `pnpm test:install:smoke` ยังบังคับงบประมาณ `unpackedSize` ของ npm pack บน tarball ตัวเลือกสำหรับอัปเดตด้วย ดังนั้น installer e2e จะจับ pack bloat ที่ไม่ตั้งใจก่อนถึงเส้นทางเผยแพร่ release
- หากงานปล่อยแตะการวางแผน CI, manifests เวลาของ extension หรือเมทริกซ์เทสต์ของ extension ให้สร้างใหม่และตรวจทานเอาต์พุตเมทริกซ์ `plugin-prerelease-extension-shard` ที่ planner เป็นเจ้าของจาก `.github/workflows/plugin-prerelease.yml` ก่อนอนุมัติ เพื่อไม่ให้ release notes อธิบาย layout CI ที่ล้าสมัย
- ความพร้อมของ stable macOS release ยังรวมถึงพื้นผิว updater:
  - GitHub release ต้องลงเอยด้วย `.zip`, `.dmg` และ `.dSYM.zip` ที่แพ็กแล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปยัง stable zip ใหม่หลังเผยแพร่
  - แอปที่แพ็กแล้วต้องคง bundle id แบบไม่ใช่ debug, URL feed ของ Sparkle ที่ไม่ว่าง และ `CFBundleVersion` ที่เท่ากับหรือสูงกว่า canonical Sparkle build floor สำหรับเวอร์ชัน release นั้น

## กล่องทดสอบการปล่อย

`Full Release Validation` คือวิธีที่ operators ใช้เริ่มการทดสอบก่อนปล่อยทั้งหมดจากจุดเริ่มต้นเดียว สำหรับหลักฐาน pinned commit บน branch ที่เคลื่อนไหวเร็ว ให้ใช้ตัวช่วยเพื่อให้ workflow ลูกทุกตัวรันจาก branch ชั่วคราวที่ตรึงไว้กับ SHA เป้าหมาย:

```bash
pnpm ci:full-release --sha <full-sha>
```

ตัวช่วยจะ push `release-ci/<sha>-...`, dispatch `Full Release Validation` จาก branch นั้นพร้อม `ref=<sha>`, ยืนยันว่า `headSha` ของ workflow ลูกทุกตัวตรงกับเป้าหมาย แล้วลบ branch ชั่วคราว วิธีนี้หลีกเลี่ยงการพิสูจน์ child run ของ `main` ที่ใหม่กว่าโดยไม่ตั้งใจ

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

เวิร์กโฟลว์จะ resolve ref เป้าหมาย, dispatch `CI` แบบ manual พร้อม
`target_ref=<release-ref>`, dispatch `OpenClaw Release Checks`, เตรียม
artifact แม่ `release-package-under-test` สำหรับการตรวจสอบที่เกี่ยวกับแพ็กเกจ, และ
dispatch Telegram E2E แบบแพ็กเกจ standalone เมื่อ `release_profile=full` พร้อม
`rerun_group=all` หรือเมื่อมีการตั้งค่า `npm_telegram_package_spec` จากนั้น `OpenClaw Release
Checks` จะกระจายงานไปยัง install smoke, cross-OS release checks, coverage เส้นทาง release ของ live/E2E Docker
เมื่อเปิดใช้ soak, Package Acceptance พร้อม Telegram package QA, QA Lab parity, live Matrix, และ live Telegram การรันแบบเต็มจะยอมรับได้ก็ต่อเมื่อ
สรุป `Full Release Validation`
แสดงว่า `normal_ci` และ `release_checks` สำเร็จ ในโหมด full/all
child `npm_telegram` ต้องสำเร็จด้วย; นอก full/all จะถูกข้าม
เว้นแต่จะมีการระบุ `npm_telegram_package_spec` ที่เผยแพร่แล้ว สรุป
verifier สุดท้ายรวมตารางงานที่ช้าที่สุดสำหรับการรัน child แต่ละรายการ เพื่อให้ release
manager เห็น critical path ปัจจุบันได้โดยไม่ต้องดาวน์โหลด log
ดู [การตรวจสอบ release แบบเต็ม](/th/reference/full-release-validation) สำหรับ
matrix ของ stage ทั้งหมด, ชื่องานเวิร์กโฟลว์ที่แน่นอน, ความแตกต่างระหว่าง profile stable กับ full,
artifact, และ handle สำหรับ rerun แบบเจาะจง
เวิร์กโฟลว์ child ถูก dispatch จาก trusted ref ที่รัน `Full Release
Validation` โดยปกติคือ `--ref main` แม้ว่า `ref` เป้าหมายจะชี้ไปยัง
release branch หรือ tag ที่เก่ากว่า ไม่มี input แยกต่างหากสำหรับ Full Release Validation
workflow-ref; เลือก trusted harness โดยเลือก ref ของการรันเวิร์กโฟลว์
อย่าใช้ `--ref main -f ref=<sha>` สำหรับ proof ของ commit ที่แน่นอนบน `main` ที่เคลื่อนที่ได้;
commit SHA แบบ raw ไม่สามารถเป็น workflow dispatch refs ได้ ดังนั้นให้ใช้
`pnpm ci:full-release --sha <sha>` เพื่อสร้าง temporary branch ที่ pin ไว้

ใช้ `release_profile` เพื่อเลือกความกว้างของ live/provider:

- `minimum`: เส้นทาง OpenAI/core live และ Docker ที่จำเป็นต่อ release และเร็วที่สุด
- `stable`: minimum บวก coverage provider/backend ที่เสถียรสำหรับการอนุมัติ release
- `full`: stable บวก coverage provider/media เชิง advisory ที่กว้างขึ้น

ใช้ `run_release_soak=true` กับ `stable` เมื่อ lane ที่บล็อก release
เป็นสีเขียว และคุณต้องการ sweep live/E2E แบบครอบคลุม, เส้นทาง Docker release,
และ upgrade-survivor ทั้งหมดตั้งแต่ 2026.4.23 ก่อน promote `full` จะ imply
`run_release_soak=true`

`OpenClaw Release Checks` ใช้ trusted workflow ref เพื่อ resolve ref เป้าหมาย
ครั้งเดียวเป็น `release-package-under-test` และ reuse artifact นั้นใน cross-OS,
Package Acceptance, และ release-path Docker checks เมื่อ soak ทำงาน วิธีนี้ทำให้
กล่องที่เกี่ยวกับแพ็กเกจทั้งหมดใช้ bytes ชุดเดียวกันและหลีกเลี่ยงการ build แพ็กเกจซ้ำ
OpenAI install smoke แบบ cross-OS ใช้ `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อมีการตั้งค่า
ตัวแปร repo/org มิฉะนั้นจะใช้ `openai/gpt-5.4` เพราะ lane นี้กำลัง
พิสูจน์การติดตั้งแพ็กเกจ, onboarding, การ start Gateway, และ live agent turn หนึ่งครั้ง
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

อย่าใช้ umbrella แบบเต็มเป็นการ rerun ครั้งแรกหลังจาก fix แบบเจาะจง หากกล่องหนึ่ง
ล้มเหลว ให้ใช้เวิร์กโฟลว์ child ที่ล้มเหลว, งาน, Docker lane, package profile, model
provider, หรือ QA lane สำหรับ proof ถัดไป รัน umbrella แบบเต็มอีกครั้งก็ต่อเมื่อ
fix เปลี่ยน release orchestration ที่ใช้ร่วมกัน หรือทำให้หลักฐาน all-box ก่อนหน้า
ล้าสมัย verifier สุดท้ายของ umbrella จะตรวจซ้ำ workflow run
ids ของ child ที่บันทึกไว้ ดังนั้นหลังจาก rerun เวิร์กโฟลว์ child สำเร็จแล้ว ให้ rerun เฉพาะ
งานแม่ `Verify full validation` ที่ล้มเหลว

สำหรับการ recovery แบบจำกัดขอบเขต ให้ส่ง `rerun_group` ไปยัง umbrella `all` คือการรัน
release-candidate จริง, `ci` รันเฉพาะ child CI ปกติ, `plugin-prerelease`
รันเฉพาะ child Plugin สำหรับ release เท่านั้น, `release-checks` รันทุก release
box, และกลุ่ม release ที่แคบกว่าคือ `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, และ `npm-telegram`
การ rerun `npm-telegram` แบบเจาะจงต้องมี `npm_telegram_package_spec`; การรัน full/all
ด้วย `release_profile=full` ใช้ artifact แพ็กเกจของ release-checks การ rerun
cross-OS แบบเจาะจงสามารถเพิ่ม `cross_os_suite_filter=windows/packaged-upgrade` หรือ
filter OS/suite อื่นได้ ความล้มเหลวของ QA release-check เป็น advisory; ความล้มเหลวเฉพาะ QA
ไม่บล็อก release validation

### Vitest

กล่อง Vitest คือเวิร์กโฟลว์ child `CI` แบบ manual Manual CI ตั้งใจ
ข้าม changed scoping และบังคับกราฟการทดสอบปกติสำหรับ release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, ความเข้ากันได้กับ Node 22,
`check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android, และ Control UI i18n

ใช้กล่องนี้เพื่อตอบว่า "source tree ผ่าน full normal test suite หรือไม่?"
มันไม่เหมือนกับการตรวจสอบผลิตภัณฑ์ตามเส้นทาง release หลักฐานที่ต้องเก็บ:

- สรุป `Full Release Validation` ที่แสดง URL การรัน `CI` ที่ dispatch แล้ว
- การรัน `CI` เป็นสีเขียวบน SHA เป้าหมายที่แน่นอน
- ชื่อ shard ที่ล้มเหลวหรือช้าจากงาน CI เมื่อตรวจสอบ regression
- artifact timing ของ Vitest เช่น `.artifacts/vitest-shard-timings.json` เมื่อ
  การรันต้องการการวิเคราะห์ performance

รัน manual CI โดยตรงเฉพาะเมื่อ release ต้องการ CI ปกติที่ deterministic แต่
ไม่ต้องการ Docker, QA Lab, live, cross-OS, หรือ package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

กล่อง Docker อยู่ใน `OpenClaw Release Checks` ผ่าน
`openclaw-live-and-e2e-checks-reusable.yml` รวมถึงเวิร์กโฟลว์ `install-smoke`
ในโหมด release มันตรวจสอบ release candidate ผ่านสภาพแวดล้อม Docker
แบบแพ็กเกจ แทนที่จะเป็นแค่การทดสอบระดับ source

coverage Docker สำหรับ release รวมถึง:

- install smoke แบบเต็มโดยเปิดใช้ Bun global install smoke ที่ช้า
- การเตรียม/reuse smoke image ของ root Dockerfile ตาม SHA เป้าหมาย โดยมีงาน QR,
  root/gateway, และ installer/Bun smoke ที่รันเป็น install-smoke shard แยกกัน
- repository E2E lanes
- release-path Docker chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, และ `plugins-runtime-install-h`
- coverage OpenWebUI ภายใน chunk `plugins-runtime-services` เมื่อมีการร้องขอ
- lane ติดตั้ง/ถอนการติดตั้ง bundled Plugin แบบแยก
  `bundled-plugin-install-uninstall-0` ถึง
  `bundled-plugin-install-uninstall-23`
- provider suites แบบ live/E2E และ Docker live model coverage เมื่อ release checks
  รวม live suites

ใช้ artifact Docker ก่อน rerun scheduler ของ release-path จะอัปโหลด
`.artifacts/docker-tests/` พร้อม lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON, และคำสั่ง rerun สำหรับการ recovery แบบเจาะจง
ให้ใช้ `docker_lanes=<lane[,lane]>` บนเวิร์กโฟลว์ live/E2E แบบ reusable แทนการ
rerun release chunks ทั้งหมด คำสั่ง rerun ที่ generate แล้วจะรวม
`package_artifact_run_id` ก่อนหน้าและ prepared Docker image inputs เมื่อมี เพื่อให้
lane ที่ล้มเหลว reuse tarball และ GHCR images ชุดเดิมได้

### QA Lab

กล่อง QA Lab เป็นส่วนหนึ่งของ `OpenClaw Release Checks` เช่นกัน มันคือ gate สำหรับ
พฤติกรรมแบบ agentic และระดับ channel ของ release แยกจากกลไกแพ็กเกจ
ของ Vitest และ Docker

coverage QA Lab สำหรับ release รวมถึง:

- mock parity lane ที่เปรียบเทียบ OpenAI candidate lane กับ baseline Opus 4.6
  โดยใช้ agentic parity pack
- profile Matrix QA แบบ live ที่เร็วโดยใช้ environment `qa-live-shared`
- live Telegram QA lane โดยใช้ Convex CI credential leases
- `pnpm qa:otel:smoke` เมื่อ release telemetry ต้องการ proof แบบ local ที่ชัดเจน

ใช้กล่องนี้เพื่อตอบว่า "release ทำงานถูกต้องในสถานการณ์ QA และ
flow channel แบบ live หรือไม่?" เก็บ URL artifact สำหรับ parity, Matrix, และ Telegram
lanes เมื่ออนุมัติ release coverage Matrix แบบเต็มยังคงพร้อมใช้งานเป็น
การรัน QA-Lab แบบ manual sharded แทนที่จะเป็น lane ค่าเริ่มต้นที่ critical ต่อ release

### แพ็กเกจ

กล่อง Package คือ gate ของผลิตภัณฑ์ที่ติดตั้งได้ มันรองรับโดย
`Package Acceptance` และ resolver
`scripts/resolve-openclaw-package-candidate.mjs` resolver จะ normalize
candidate เป็น tarball `package-under-test` ที่ Docker E2E ใช้, ตรวจสอบ
inventory ของแพ็กเกจ, บันทึกเวอร์ชันแพ็กเกจและ SHA-256, และแยก
workflow harness ref ออกจาก package source ref

แหล่ง candidate ที่รองรับ:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, หรือเวอร์ชัน release ของ OpenClaw ที่แน่นอน
- `source=ref`: pack branch, tag, หรือ full commit SHA ของ `package_ref` ที่เชื่อถือได้
  ด้วย harness `workflow_ref` ที่เลือกไว้
- `source=url`: ดาวน์โหลด HTTPS `.tgz` พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: reuse `.tgz` ที่อัปโหลดโดยการรัน GitHub Actions อื่น

`OpenClaw Release Checks` รัน Package Acceptance ด้วย `source=artifact`,
artifact แพ็กเกจ release ที่เตรียมไว้, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`telegram_mode=mock-openai` Package Acceptance คงการ migration, update, cleanup
dependency ของ Plugin ที่ stale, fixture Plugin แบบ offline, update Plugin, และ Telegram
package QA ไว้กับ tarball ที่ resolve แล้วชุดเดียวกัน release checks ที่บล็อกใช้
baseline แพ็กเกจที่เผยแพร่ล่าสุดตามค่าเริ่มต้น; `run_release_soak=true` หรือ
`release_profile=full` จะขยายเป็น baseline npm-published ที่เสถียรทั้งหมดตั้งแต่
`2026.4.23` ถึง `latest` รวมถึง fixture ของ issue ที่รายงาน ใช้
Package Acceptance ด้วย `source=npm` สำหรับ candidate ที่ shipped แล้ว หรือ
`source=ref`/`source=artifact` สำหรับ tarball npm แบบ local ที่อ้างอิง SHA ก่อน
publish มันคือ replacement แบบ GitHub-native
สำหรับ coverage package/update ส่วนใหญ่ที่ก่อนหน้านี้ต้องใช้
Parallels Cross-OS release checks ยังคงสำคัญสำหรับ onboarding,
installer, และพฤติกรรม platform เฉพาะ OS แต่การตรวจสอบผลิตภัณฑ์ด้าน package/update ควร
เลือกใช้ Package Acceptance

checklist canonical สำหรับการตรวจสอบ update และ Plugin คือ
[การทดสอบ updates และ plugins](/th/help/testing-updates-plugins) ใช้มันเมื่อ
ตัดสินใจว่า lane แบบ local, Docker, Package Acceptance, หรือ release-check ใดพิสูจน์
การติดตั้ง/update Plugin, doctor cleanup, หรือการเปลี่ยนแปลง migration ของ published-package
การ migration update แบบ exhaustive จากทุกแพ็กเกจ stable `2026.4.23+` ที่เผยแพร่แล้ว
เป็นเวิร์กโฟลว์ `Update Migration` แบบ manual แยกต่างหาก ไม่ใช่ส่วนหนึ่งของ Full Release CI

ความผ่อนปรนของ package-acceptance แบบ legacy ถูกจำกัดเวลาโดยตั้งใจ แพ็กเกจถึง
`2026.4.25` อาจใช้ compatibility path สำหรับช่องว่าง metadata ที่เผยแพร่ไปยัง
npm แล้ว: รายการ private QA inventory ที่หายไปจาก tarball, ไม่มี
`gateway install --wrapper`, ไม่มี patch files ใน fixture git ที่ derived จาก tarball,
ไม่มี `update.channel` ที่ persisted, ตำแหน่ง install-record ของ Plugin แบบ legacy,
ไม่มี marketplace install-record persistence, และการ migration config metadata
ระหว่าง `plugins update` แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจ warn
สำหรับ local build metadata stamp files ที่ shipped ไปแล้ว แพ็กเกจหลังจากนั้น
ต้องเป็นไปตามสัญญาแพ็กเกจสมัยใหม่; ช่องว่างเดียวกันเหล่านั้นจะทำให้ release
validation ล้มเหลว

ใช้ profile Package Acceptance ที่กว้างขึ้นเมื่อคำถามของ release เกี่ยวกับ
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

- `smoke`: เลนการติดตั้งแพ็กเกจ/ช่องทาง/เอเจนต์, เครือข่าย Gateway และการโหลด
  การกำหนดค่าใหม่แบบรวดเร็ว
- `package`: สัญญาการติดตั้ง/อัปเดต/แพ็กเกจ Plugin โดยไม่มี ClawHub แบบสด; นี่คือค่าเริ่มต้นของ
  การตรวจสอบรีลีส
- `product`: `package` พร้อมช่องทาง MCP, การล้างข้อมูล cron/subagent, การค้นเว็บของ OpenAI
  และ OpenWebUI
- `full`: ส่วนย่อยเส้นทางรีลีส Docker พร้อม OpenWebUI
- `custom`: รายการ `docker_lanes` ที่แน่นอนสำหรับการรันซ้ำแบบเจาะจง

สำหรับหลักฐาน Telegram ของแพ็กเกจตัวเลือก ให้เปิดใช้ `telegram_mode=mock-openai` หรือ
`telegram_mode=live-frontier` ใน Package Acceptance เวิร์กโฟลว์จะส่งไฟล์ tarball
`package-under-test` ที่ resolve แล้วเข้าไปในเลน Telegram; เวิร์กโฟลว์ Telegram
แบบสแตนด์อโลนยังคงรับ spec npm ที่เผยแพร่แล้วสำหรับการตรวจสอบหลังเผยแพร่

## ระบบอัตโนมัติสำหรับเผยแพร่รีลีส

`OpenClaw Release Publish` คือจุดเข้าปกติสำหรับการเผยแพร่ที่มีการเปลี่ยนแปลงสถานะ โดยจะ
ประสานเวิร์กโฟลว์ trusted-publisher ตามลำดับที่รีลีสต้องใช้:

1. เช็กเอาต์แท็กรีลีสและ resolve commit SHA ของแท็กนั้น
2. ตรวจสอบว่าแท็กเข้าถึงได้จาก `main` หรือ `release/*`
3. รัน `pnpm plugins:sync:check`
4. Dispatch `Plugin NPM Release` ด้วย `publish_scope=all-publishable` และ
   `ref=<release-sha>`
5. Dispatch `Plugin ClawHub Release` ด้วย scope และ SHA เดียวกัน
6. Dispatch `OpenClaw NPM Release` พร้อมแท็กรีลีส, npm dist-tag และ
   `preflight_run_id` ที่บันทึกไว้

ตัวอย่างการเผยแพร่ beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

การเผยแพร่ stable ไปยัง dist-tag beta ค่าเริ่มต้น:

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
เฉพาะกับงานซ่อมแซมหรือเผยแพร่ซ้ำแบบเจาะจงเท่านั้น สำหรับการซ่อมแซม Plugin ที่เลือก ให้ส่ง
`plugin_publish_scope=selected` และ `plugins=@openclaw/name` ไปยัง
`OpenClaw Release Publish` หรือ dispatch เวิร์กโฟลว์ลูกโดยตรงเมื่อไม่ต้องเผยแพร่แพ็กเกจ
OpenClaw

## อินพุตของเวิร์กโฟลว์ NPM

`OpenClaw NPM Release` รับอินพุตที่ผู้ปฏิบัติงานควบคุมได้ดังนี้:

- `tag`: แท็กรีลีสที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1` หรือ
  `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` อาจเป็น commit SHA
  เต็ม 40 อักขระของกิ่งเวิร์กโฟลว์ปัจจุบันสำหรับ preflight แบบตรวจสอบเท่านั้นได้ด้วย
- `preflight_only`: `true` สำหรับการตรวจสอบ/บิลด์/แพ็กเกจเท่านั้น, `false` สำหรับ
  เส้นทางเผยแพร่จริง
- `preflight_run_id`: จำเป็นบนเส้นทางเผยแพร่จริง เพื่อให้เวิร์กโฟลว์นำ tarball
  ที่เตรียมไว้จากการรัน preflight ที่สำเร็จกลับมาใช้
- `npm_dist_tag`: แท็กเป้าหมายของ npm สำหรับเส้นทางเผยแพร่; ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Publish` รับอินพุตที่ผู้ปฏิบัติงานควบคุมได้ดังนี้:

- `tag`: แท็กรีลีสที่จำเป็น; ต้องมีอยู่แล้ว
- `preflight_run_id`: id การรัน preflight ของ `OpenClaw NPM Release` ที่สำเร็จ;
  จำเป็นเมื่อ `publish_openclaw_npm=true`
- `npm_dist_tag`: แท็กเป้าหมายของ npm สำหรับแพ็กเกจ OpenClaw
- `plugin_publish_scope`: ค่าเริ่มต้นคือ `all-publishable`; ใช้ `selected` เฉพาะ
  สำหรับงานซ่อมแซมแบบเจาะจง
- `plugins`: ชื่อแพ็กเกจ `@openclaw/*` คั่นด้วยจุลภาค เมื่อ
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: ค่าเริ่มต้นคือ `true`; ตั้งเป็น `false` เฉพาะเมื่อใช้
  เวิร์กโฟลว์เป็นตัวประสานงานซ่อมแซมเฉพาะ Plugin

`OpenClaw Release Checks` รับอินพุตที่ผู้ปฏิบัติงานควบคุมได้ดังนี้:

- `ref`: กิ่ง, แท็ก หรือ commit SHA เต็มที่จะตรวจสอบ การตรวจสอบที่มี secret
  ต้องให้ commit ที่ resolve แล้วเข้าถึงได้จากกิ่งหรือแท็กรีลีสของ OpenClaw
- `run_release_soak`: เลือกใช้การทดสอบแช่แบบครอบคลุมสำหรับ live/E2E, เส้นทางรีลีส Docker และ
  upgrade-survivor แบบ all-since บนการตรวจสอบรีลีส stable/ค่าเริ่มต้น ระบบจะบังคับเปิด
  โดย `release_profile=full`

กฎ:

- แท็ก stable และ correction อาจเผยแพร่ไปยัง `beta` หรือ `latest` ก็ได้
- แท็ก prerelease แบบ beta เผยแพร่ได้เฉพาะไปยัง `beta`
- สำหรับ `OpenClaw NPM Release` อนุญาตให้อินพุตเป็น commit SHA เต็มเฉพาะเมื่อ
  `preflight_only=true`
- `OpenClaw Release Checks` และ `Full Release Validation` เป็นแบบตรวจสอบเท่านั้นเสมอ
- เส้นทางเผยแพร่จริงต้องใช้ `npm_dist_tag` เดียวกับที่ใช้ระหว่าง preflight;
  เวิร์กโฟลว์จะตรวจสอบ metadata นั้นก่อนดำเนินการเผยแพร่ต่อ

## ลำดับรีลีส npm แบบ stable

เมื่อสร้างรีลีส npm แบบ stable:

1. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนมีแท็ก คุณอาจใช้ commit SHA เต็มของกิ่งเวิร์กโฟลว์ปัจจุบันเพื่อ dry run
     เวิร์กโฟลว์ preflight แบบตรวจสอบเท่านั้น
2. เลือก `npm_dist_tag=beta` สำหรับโฟลว์ปกติแบบ beta-first หรือ `latest` เฉพาะ
   เมื่อคุณตั้งใจเผยแพร่ stable โดยตรง
3. รัน `Full Release Validation` บนกิ่งรีลีส, แท็กรีลีส หรือ commit SHA เต็ม
   เมื่อคุณต้องการ CI ปกติพร้อมความครอบคลุมของ live prompt cache, Docker, QA Lab,
   Matrix และ Telegram จากเวิร์กโฟลว์แบบแมนนวลเดียว
4. หากคุณตั้งใจต้องการเฉพาะกราฟการทดสอบปกติที่กำหนดซ้ำได้ ให้รันเวิร์กโฟลว์
   `CI` แบบแมนนวลบน ref ของรีลีสแทน
5. บันทึก `preflight_run_id` ที่สำเร็จ
6. รัน `OpenClaw Release Publish` ด้วย `tag` เดียวกัน, `npm_dist_tag` เดียวกัน
   และ `preflight_run_id` ที่บันทึกไว้; ระบบจะเผยแพร่ Plugin ที่ externalized ไปยัง npm
   และ ClawHub ก่อนโปรโมตแพ็กเกจ npm ของ OpenClaw
7. หากรีลีสลงที่ `beta` ให้ใช้เวิร์กโฟลว์ส่วนตัว
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   เพื่อโปรโมตเวอร์ชัน stable นั้นจาก `beta` ไปยัง `latest`
8. หากรีลีสตั้งใจเผยแพร่โดยตรงไปยัง `latest` และ `beta` ควรชี้ตามบิลด์ stable เดียวกันทันที
   ให้ใช้เวิร์กโฟลว์ส่วนตัวเดียวกันเพื่อชี้ dist-tag ทั้งสองไปยังเวอร์ชัน stable หรือปล่อยให้
   การซิงก์ซ่อมแซมตัวเองตามกำหนดการย้าย `beta` ในภายหลัง

การเปลี่ยนแปลง dist-tag อยู่ใน repo ส่วนตัวเพื่อความปลอดภัย เพราะยังต้องใช้
`NPM_TOKEN` ขณะที่ repo สาธารณะคงการเผยแพร่แบบ OIDC-only ไว้

วิธีนี้ทำให้ทั้งเส้นทางเผยแพร่โดยตรงและเส้นทางโปรโมตแบบ beta-first ได้รับการบันทึกไว้ในเอกสารและมองเห็นได้สำหรับผู้ปฏิบัติงาน

หาก maintainer ต้อง fallback ไปใช้การยืนยันตัวตน npm แบบ local ให้รันคำสั่ง 1Password
CLI (`op`) ใด ๆ เฉพาะภายในเซสชัน tmux เฉพาะกิจเท่านั้น อย่าเรียก `op`
โดยตรงจากเชลล์เอเจนต์หลัก; การเก็บไว้ใน tmux ทำให้ prompt, การแจ้งเตือน และการจัดการ OTP
มองเห็นได้ และป้องกันการแจ้งเตือน host ซ้ำ

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
