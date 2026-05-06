---
read_when:
    - กำลังค้นหานิยามช่องทางการเผยแพร่สาธารณะ
    - การเรียกใช้การตรวจสอบความถูกต้องของรีลีสหรือการยอมรับแพ็กเกจ
    - กำลังมองหาการตั้งชื่อเวอร์ชันและรอบการออกเวอร์ชัน
summary: ช่องทางการเผยแพร่ เช็กลิสต์สำหรับผู้ปฏิบัติการ กล่องตรวจสอบความถูกต้อง การตั้งชื่อเวอร์ชัน และรอบเวลา
title: นโยบายการเผยแพร่รุ่น
x-i18n:
    generated_at: "2026-05-06T10:30:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw มีเลนการเผยแพร่สาธารณะสามเลน:

- stable: รีลีสที่ติดแท็กซึ่งเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อร้องขออย่างชัดเจน
- beta: แท็กก่อนรีลีสที่เผยแพร่ไปยัง npm `beta`
- dev: เฮดที่เปลี่ยนแปลงตลอดเวลาของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันรีลีส stable: `YYYY.M.D`
  - แท็ก Git: `vYYYY.M.D`
- เวอร์ชันรีลีสแก้ไขของ stable: `YYYY.M.D-N`
  - แท็ก Git: `vYYYY.M.D-N`
- เวอร์ชันก่อนรีลีส beta: `YYYY.M.D-beta.N`
  - แท็ก Git: `vYYYY.M.D-beta.N`
- อย่าเติมศูนย์นำหน้าเดือนหรือวัน
- `latest` หมายถึงรีลีส npm stable ปัจจุบันที่ได้รับการเลื่อนสถานะแล้ว
- `beta` หมายถึงเป้าหมายการติดตั้ง beta ปัจจุบัน
- รีลีส stable และรีลีสแก้ไขของ stable จะเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น ผู้ปฏิบัติการรีลีสสามารถกำหนดเป้าหมาย `latest` ได้อย่างชัดเจน หรือเลื่อนสถานะบิลด์ beta ที่ผ่านการตรวจสอบแล้วในภายหลัง
- รีลีส OpenClaw stable ทุกรีลีสจัดส่งแพ็กเกจ npm และแอป macOS พร้อมกัน;
  รีลีส beta โดยปกติจะตรวจสอบและเผยแพร่เส้นทาง npm/แพ็กเกจก่อน โดยสงวนการบิลด์/ลงนาม/รับรองแอป mac สำหรับ stable เว้นแต่จะมีการร้องขออย่างชัดเจน

## จังหวะการเผยแพร่

- รีลีสจะดำเนินไปแบบ beta-first
- stable จะตามมาหลังจาก beta ล่าสุดผ่านการตรวจสอบแล้วเท่านั้น
- โดยปกติผู้ดูแลจะตัดรีลีสจากแบรนช์ `release/YYYY.M.D` ที่สร้าง
  จาก `main` ปัจจุบัน เพื่อให้การตรวจสอบและการแก้ไขรีลีสไม่บล็อกการพัฒนาใหม่
  บน `main`
- หากแท็ก beta ถูกพุชหรือเผยแพร่แล้วและต้องการการแก้ไข ผู้ดูแลจะตัด
  แท็ก `-beta.N` ถัดไปแทนการลบหรือสร้างแท็ก beta เดิมใหม่
- ขั้นตอนรีลีสโดยละเอียด การอนุมัติ ข้อมูลรับรอง และบันทึกการกู้คืน
  จำกัดเฉพาะผู้ดูแลเท่านั้น

## เช็กลิสต์ผู้ปฏิบัติการรีลีส

เช็กลิสต์นี้คือรูปแบบสาธารณะของโฟลว์รีลีส ข้อมูลรับรองส่วนตัว,
การลงนาม, การรับรอง, การกู้คืน dist-tag และรายละเอียดการย้อนกลับฉุกเฉินจะอยู่ใน
รันบุ๊กรีลีสสำหรับผู้ดูแลเท่านั้น

1. เริ่มจาก `main` ปัจจุบัน: ดึงล่าสุด ยืนยันว่าคอมมิตเป้าหมายถูกพุชแล้ว
   และยืนยันว่า CI ของ `main` ปัจจุบันเขียวพอที่จะสร้างแบรนช์จากจุดนั้น
2. เขียนส่วนบนสุดของ `CHANGELOG.md` ใหม่จากประวัติคอมมิตจริงด้วย
   `/changelog` ให้รายการเป็นเนื้อหาสำหรับผู้ใช้ คอมมิต พุช และ rebase/pull
   อีกครั้งก่อนสร้างแบรนช์
3. ตรวจทานระเบียนความเข้ากันได้ของรีลีสใน
   `src/plugins/compat/registry.ts` และ
   `src/commands/doctor/shared/deprecation-compat.ts` นำความเข้ากันได้ที่หมดอายุออก
   เฉพาะเมื่อเส้นทางการอัปเกรดยังคงครอบคลุมอยู่ หรือบันทึกเหตุผลว่าทำไมจึง
   ตั้งใจคงไว้
4. สร้าง `release/YYYY.M.D` จาก `main` ปัจจุบัน; อย่าทำงานรีลีสตามปกติ
   โดยตรงบน `main`
5. เพิ่มเวอร์ชันในทุกตำแหน่งที่จำเป็นสำหรับแท็กที่ตั้งใจไว้ รัน
   `pnpm plugins:sync` เพื่อให้แพ็กเกจ Plugin ที่เผยแพร่ได้ใช้เวอร์ชันรีลีส
   และเมตาดาต้าความเข้ากันได้ร่วมกัน จากนั้นรันพรีไฟลต์แบบกำหนดซ้ำได้ในเครื่อง:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` และ
   `pnpm release:check`
6. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true` ก่อนที่จะมีแท็ก
   สามารถใช้ SHA เต็ม 40 อักขระของแบรนช์รีลีสสำหรับพรีไฟลต์เพื่อการตรวจสอบเท่านั้นได้
   บันทึก `preflight_run_id` ที่สำเร็จไว้
7. เริ่มการทดสอบก่อนรีลีสทั้งหมดด้วย `Full Release Validation` สำหรับ
   แบรนช์รีลีส แท็ก หรือ SHA คอมมิตเต็ม นี่คือจุดเข้าด้วยตนเองเพียงจุดเดียว
   สำหรับกล่องทดสอบรีลีสขนาดใหญ่สี่กล่อง: Vitest, Docker, QA Lab และ Package
8. หากการตรวจสอบล้มเหลว ให้แก้บนแบรนช์รีลีสและรันไฟล์ เลน งาน workflow
   โปรไฟล์แพ็กเกจ ผู้ให้บริการ หรือ allowlist ของโมเดลที่ล้มเหลวที่เล็กที่สุด
   ซึ่งพิสูจน์การแก้ไขได้ รัน umbrella แบบเต็มอีกครั้งเฉพาะเมื่อพื้นผิวที่เปลี่ยน
   ทำให้หลักฐานเดิมล้าสมัย
9. สำหรับ beta ให้แท็ก `vYYYY.M.D-beta.N` จากนั้นรัน `OpenClaw Release Publish` จาก
   แบรนช์ `release/YYYY.M.D` ที่ตรงกัน ระบบจะตรวจสอบ `pnpm plugins:sync:check`,
   dispatch แพ็กเกจ Plugin ที่เผยแพร่ได้ทั้งหมดไปยัง npm และชุดเดียวกันไปยัง
   ClawHub แบบขนาน จากนั้นเลื่อนสถานะอาร์ติแฟกต์พรีไฟลต์ npm ของ OpenClaw ที่เตรียมไว้
   ด้วย dist-tag ที่ตรงกันทันทีที่การเผยแพร่ Plugin npm สำเร็จ
   การเผยแพร่ ClawHub อาจยังทำงานอยู่ระหว่างที่ OpenClaw npm เผยแพร่ แต่
   workflow เผยแพร่รีลีสจะไม่เสร็จจนกว่าเส้นทางการเผยแพร่ Plugin ทั้งสองเส้นทางและ
   เส้นทางการเผยแพร่ OpenClaw npm จะเสร็จสมบูรณ์สำเร็จ หลังเผยแพร่ ให้รัน
   การยอมรับแพ็กเกจหลังเผยแพร่
   กับแพ็กเกจ `openclaw@YYYY.M.D-beta.N` หรือ
   `openclaw@beta` ที่เผยแพร่แล้ว หาก prerelease ที่ถูกพุชหรือเผยแพร่แล้วต้องการการแก้ไข
   ให้ตัดหมายเลข prerelease ถัดไปที่ตรงกัน; อย่าลบหรือเขียน prerelease เดิมใหม่
10. สำหรับ stable ให้ดำเนินต่อเฉพาะหลังจาก beta หรือ release candidate ที่ผ่านการตรวจสอบแล้วมี
    หลักฐานการตรวจสอบที่จำเป็น การเผยแพร่ npm stable ก็ผ่าน
    `OpenClaw Release Publish` เช่นกัน โดยใช้อาร์ติแฟกต์พรีไฟลต์ที่สำเร็จผ่าน
    `preflight_run_id`; ความพร้อมของรีลีส macOS stable ยังต้องมี
    `.zip`, `.dmg`, `.dSYM.zip` ที่แพ็กเกจแล้ว และ `appcast.xml` ที่อัปเดตบน `main`
11. หลังเผยแพร่ ให้รันตัวตรวจสอบ npm หลังเผยแพร่, E2E ของ Telegram แบบ standalone
    จาก published-npm ที่เป็นทางเลือกเมื่อคุณต้องการหลักฐานช่องทางหลังเผยแพร่,
    การเลื่อนสถานะ dist-tag เมื่อจำเป็น, บันทึก GitHub release/prerelease จาก
    ส่วน `CHANGELOG.md` ที่ตรงกันครบถ้วน และขั้นตอนประกาศรีลีส

## พรีไฟลต์รีลีส

- เรียกใช้ `pnpm check:test-types` ก่อน preflight ของรีลีส เพื่อให้ TypeScript ของการทดสอบยังคงถูกครอบคลุมนอก gate `pnpm check` ภายในเครื่องที่เร็วกว่า
- เรียกใช้ `pnpm check:architecture` ก่อน preflight ของรีลีส เพื่อให้การตรวจสอบ import cycle และขอบเขตสถาปัตยกรรมที่กว้างกว่าผ่านเป็นสีเขียวนอก gate ภายในเครื่องที่เร็วกว่า
- เรียกใช้ `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้ artifact รีลีส `dist/*` ที่คาดไว้และ bundle ของ Control UI มีอยู่สำหรับขั้นตอนตรวจสอบ pack
- เรียกใช้ `pnpm plugins:sync` หลังการ bump เวอร์ชัน root และก่อนติดแท็ก ขั้นตอนนี้อัปเดตเวอร์ชันแพ็กเกจ Plugin ที่ publish ได้, metadata ความเข้ากันได้ของ OpenClaw peer/API, build metadata และ stub changelog ของ Plugin ให้ตรงกับเวอร์ชันรีลีสของ core `pnpm plugins:sync:check` คือ release guard แบบไม่แก้ไขไฟล์; workflow publish จะล้มเหลวก่อนมีการเปลี่ยนแปลง registry ใด ๆ หากลืมขั้นตอนนี้
- เรียกใช้ workflow แบบ manual `Full Release Validation` ก่อนอนุมัติรีลีส เพื่อเริ่มกล่องทดสอบก่อนรีลีสทั้งหมดจาก entrypoint เดียว รองรับ branch, tag หรือ commit SHA แบบเต็ม, dispatch `CI` แบบ manual และ dispatch `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, การตรวจสอบแพ็กเกจข้าม OS, QA Lab parity, Matrix และ lane ของ Telegram การรัน stable/default จะเก็บ live/E2E แบบละเอียดและ Docker release-path soak ไว้หลัง `run_release_soak=true`; `release_profile=full` จะบังคับเปิด soak เมื่อใช้ `release_profile=full` และ `rerun_group=all` จะรัน package Telegram E2E กับ artifact `release-package-under-test` จาก release checks ด้วย ระบุ `npm_telegram_package_spec` หลัง publish เมื่อ Telegram E2E เดียวกันควรพิสูจน์แพ็กเกจ npm ที่ publish แล้วด้วย ระบุ `package_acceptance_package_spec` หลัง publish เมื่อ Package Acceptance ควรรัน matrix package/update กับแพ็กเกจ npm ที่ส่งมอบแล้วแทน artifact ที่ build จาก SHA ระบุ `evidence_package_spec` เมื่อรายงาน evidence ส่วนตัวควรพิสูจน์ว่า validation ตรงกับแพ็กเกจ npm ที่ publish แล้วโดยไม่บังคับ Telegram E2E ตัวอย่าง:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- เรียกใช้ workflow แบบ manual `Package Acceptance` เมื่อต้องการหลักฐาน side-channel สำหรับ candidate ของแพ็กเกจระหว่างที่งานรีลีสดำเนินต่อ ใช้ `source=npm` สำหรับ `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรีลีสแบบเจาะจง; ใช้ `source=ref` เพื่อ pack branch/tag/SHA ของ `package_ref` ที่เชื่อถือได้ด้วย harness `workflow_ref` ปัจจุบัน; ใช้ `source=url` สำหรับ tarball HTTPS ที่ต้องมี SHA-256; หรือใช้ `source=artifact` สำหรับ tarball ที่อัปโหลดโดย GitHub Actions run อื่น workflow จะ resolve candidate เป็น `package-under-test`, ใช้ Docker E2E release scheduler ซ้ำกับ tarball นั้น และสามารถรัน Telegram QA กับ tarball เดียวกันด้วย `telegram_mode=mock-openai` หรือ `telegram_mode=live-frontier` เมื่อ lane Docker ที่เลือกมี `published-upgrade-survivor` artifact ของแพ็กเกจจะเป็น candidate และ `published_upgrade_survivor_baseline` จะเลือก baseline ที่ publish แล้ว `update-restart-auth` ใช้แพ็กเกจ candidate เป็นทั้ง CLI ที่ติดตั้งและ package-under-test เพื่อให้ทดสอบ path managed restart ของคำสั่ง update ของ candidate
  ตัวอย่าง: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  โปรไฟล์ที่พบบ่อย:
  - `smoke`: lane install/channel/agent, gateway network และ config reload
  - `package`: lane package/update/restart/plugin ที่เป็น artifact-native โดยไม่มี OpenWebUI หรือ ClawHub แบบ live
  - `product`: โปรไฟล์ package รวมกับช่องทาง MCP, การ cleanup cron/subagent, OpenAI web search และ OpenWebUI
  - `full`: chunk ของ Docker release-path พร้อม OpenWebUI
  - `custom`: การเลือก `docker_lanes` แบบเจาะจงสำหรับการ rerun ที่โฟกัส
- เรียกใช้ workflow แบบ manual `CI` โดยตรงเมื่อคุณต้องการแค่ความครอบคลุม CI ปกติแบบเต็มสำหรับ release candidate การ dispatch CI แบบ manual จะข้าม changed scoping และบังคับ lane ของ Linux Node shards, bundled-plugin shards, channel contracts, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, Android และ Control UI i18n
  ตัวอย่าง: `gh workflow run ci.yml --ref release/YYYY.M.D`
- เรียกใช้ `pnpm qa:otel:smoke` เมื่อตรวจสอบ telemetry ของรีลีส ขั้นตอนนี้ทดสอบ QA-lab ผ่าน OTLP/HTTP receiver ภายในเครื่อง และตรวจสอบชื่อ trace span ที่ export, attributes ที่จำกัดขอบเขตไว้ และการ redact เนื้อหา/identifier โดยไม่ต้องใช้ Opik, Langfuse หรือ collector ภายนอกอื่น
- เรียกใช้ `pnpm release:check` ก่อนทุกรีลีสที่ติดแท็ก
- เรียกใช้ `OpenClaw Release Publish` สำหรับลำดับ publish ที่มีการเปลี่ยนแปลง หลังจาก tag มีอยู่แล้ว Dispatch จาก `release/YYYY.M.D` (หรือ `main` เมื่อต้อง publish tag ที่เข้าถึงได้จาก main), ส่ง release tag และ `preflight_run_id` ของ OpenClaw npm ที่สำเร็จ และคง scope publish ของ Plugin ค่าเริ่มต้น `all-publishable` ไว้ เว้นแต่คุณตั้งใจรันการซ่อมแซมแบบโฟกัส workflow จะ serialize การ publish Plugin ไปยัง npm, การ publish Plugin ไปยัง ClawHub และการ publish OpenClaw ไปยัง npm เพื่อไม่ให้แพ็กเกจ core ถูก publish ก่อน Plugin ที่ externalized
- ตอนนี้ release checks รันใน workflow แบบ manual แยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรัน lane QA Lab mock parity รวมถึงโปรไฟล์ Matrix live แบบเร็วและ lane Telegram QA ก่อนอนุมัติรีลีสด้วย lane live ใช้ environment `qa-live-shared`; Telegram ยังใช้ credential leases ของ Convex CI ด้วย เรียกใช้ workflow แบบ manual `QA-Lab - All Lanes` พร้อม `matrix_profile=all` และ `matrix_shards=true` เมื่อคุณต้องการ inventory ของ Matrix transport, media และ E2EE แบบเต็มใน parallel
- การตรวจสอบ runtime ของการติดตั้งและอัปเกรดข้าม OS เป็นส่วนหนึ่งของ `OpenClaw Release Checks` และ `Full Release Validation` แบบ public ซึ่งเรียก workflow reusable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` โดยตรง
- การแยกนี้ตั้งใจทำไว้: ให้ path รีลีส npm จริงสั้น กำหนดผลได้ และโฟกัสที่ artifact ขณะที่การตรวจสอบ live ที่ช้ากว่าอยู่ใน lane ของตัวเอง เพื่อไม่ให้หน่วงหรือบล็อกการ publish
- release checks ที่มี secrets ควรถูก dispatch ผ่าน `Full Release Validation` หรือจาก workflow ref `main`/release เพื่อให้ workflow logic และ secrets ยังคงถูกควบคุม
- `OpenClaw Release Checks` รองรับ branch, tag หรือ commit SHA แบบเต็ม ตราบเท่าที่ commit ที่ resolve ได้เข้าถึงได้จาก branch ของ OpenClaw หรือ release tag
- preflight แบบ validation-only ของ `OpenClaw NPM Release` ยังรองรับ commit SHA แบบเต็ม 40 อักขระของ workflow branch ปัจจุบันโดยไม่ต้องมี tag ที่ push แล้ว
- path แบบ SHA นั้นเป็น validation-only และไม่สามารถ promote เป็น publish จริงได้
- ในโหมด SHA workflow จะ synthesize `v<package.json version>` เฉพาะสำหรับการตรวจสอบ package metadata; การ publish จริงยังต้องใช้ release tag จริง
- workflow ทั้งสองยังคงให้ path publish และ promotion จริงอยู่บน runner ที่ GitHub-hosted ขณะที่ path validation แบบไม่แก้ไขไฟล์สามารถใช้ runner Blacksmith Linux ที่ใหญ่กว่าได้
- workflow นั้นรัน
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ workflow secrets ทั้ง `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- preflight รีลีส npm ไม่รอ lane release checks แยกต่างหากอีกต่อไป
- เรียกใช้ `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือ tag beta/correction ที่ตรงกัน) ก่อนอนุมัติ
- หลัง publish npm ให้เรียกใช้
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (หรือเวอร์ชัน beta/correction ที่ตรงกัน) เพื่อตรวจสอบ path การติดตั้งจาก registry ที่ publish แล้วใน temp prefix ใหม่
- หลัง publish beta ให้เรียกใช้ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  เพื่อตรวจสอบ onboarding ของ installed-package, การตั้งค่า Telegram และ Telegram E2E จริงกับแพ็กเกจ npm ที่ publish แล้ว โดยใช้พูล credential Telegram แบบ leased ร่วมกัน การรันครั้งเดียวของ maintainer ในเครื่องอาจละ Convex vars และส่ง credentials env `OPENCLAW_QA_TELEGRAM_*` ทั้งสามรายการโดยตรง
- หากต้องการรัน post-publish beta smoke แบบเต็มจากเครื่อง maintainer ให้ใช้ `pnpm release:beta-smoke -- --beta betaN` helper จะรันการตรวจสอบ Parallels npm update/fresh-target, dispatch `NPM Telegram Beta E2E`, poll workflow run ที่เจาะจง, ดาวน์โหลด artifact และพิมพ์รายงาน Telegram
- Maintainer สามารถรันการตรวจสอบ post-publish เดียวกันจาก GitHub Actions ผ่าน workflow แบบ manual `NPM Telegram Beta E2E` ได้ ตั้งใจให้เป็น manual-only และไม่รันทุกครั้งที่ merge
- ตอนนี้ release automation ของ maintainer ใช้ preflight-then-promote:
  - การ publish npm จริงต้องผ่าน `preflight_run_id` ของ npm ที่สำเร็จ
  - การ publish npm จริงต้องถูก dispatch จาก branch `main` หรือ `release/YYYY.M.D` เดียวกันกับ preflight run ที่สำเร็จ
  - รีลีส npm แบบ stable มีค่าเริ่มต้นเป็น `beta`
  - การ publish npm แบบ stable สามารถ target `latest` ได้อย่างชัดเจนผ่าน workflow input
  - ตอนนี้การเปลี่ยนแปลง npm dist-tag แบบ token-based อยู่ใน `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` เพื่อความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่ repo public คงการ publish แบบ OIDC-only
  - `macOS Release` แบบ public เป็น validation-only; เมื่อ tag อยู่เฉพาะบน release branch แต่ workflow ถูก dispatch จาก `main` ให้ตั้งค่า `public_release_branch=release/YYYY.M.D`
  - การ publish mac แบบ private จริงต้องผ่าน `preflight_run_id` และ `validate_run_id` ของ private mac ที่สำเร็จ
  - path publish จริงจะ promote artifact ที่เตรียมไว้แทนการ rebuild อีกครั้ง
- สำหรับรีลีส correction แบบ stable เช่น `YYYY.M.D-N` verifier หลัง publish จะตรวจสอบ path upgrade temp-prefix เดียวกันจาก `YYYY.M.D` เป็น `YYYY.M.D-N` ด้วย เพื่อให้ release correction ไม่สามารถปล่อยให้ global install รุ่นเก่ายังคงอยู่บน payload stable ฐานได้แบบเงียบ ๆ
- preflight รีลีส npm จะ fail closed เว้นแต่ tarball จะมีทั้ง `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่างเปล่า เพื่อไม่ให้เราส่ง browser dashboard ที่ว่างเปล่าอีกครั้ง
- การตรวจสอบหลัง publish ยังตรวจสอบด้วยว่า entrypoint ของ Plugin ที่ publish แล้วและ package metadata อยู่ใน layout ของ registry ที่ติดตั้งแล้ว รีลีสที่ส่ง payload runtime ของ Plugin หายไปจะทำให้ postpublish verifier ล้มเหลวและไม่สามารถ promote เป็น `latest` ได้
- `pnpm test:install:smoke` ยังบังคับงบประมาณ `unpackedSize` ของ npm pack บน tarball update candidate ด้วย เพื่อให้ installer e2e จับ pack bloat โดยไม่ตั้งใจก่อน path publish ของรีลีส
- หากงานรีลีสแตะ CI planning, manifest timing ของ Plugin หรือ matrix การทดสอบของ Plugin ให้ regenerate และ review output matrix `plugin-prerelease-extension-shard` ที่ planner เป็นเจ้าของจาก `.github/workflows/plugin-prerelease.yml` ก่อนอนุมัติ เพื่อให้ release notes ไม่อธิบาย layout CI ที่ล้าสมัย
- ความพร้อมของรีลีส macOS แบบ stable ยังรวมถึง surfaces ของ updater:
  - GitHub release ต้องลงเอยด้วย `.zip`, `.dmg` และ `.dSYM.zip` ที่แพ็กเกจแล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปยัง stable zip ใหม่หลัง publish
  - แอปที่แพ็กเกจแล้วต้องคง bundle id แบบ non-debug, URL feed ของ Sparkle ที่ไม่ว่างเปล่า และ `CFBundleVersion` ที่เท่ากับหรือสูงกว่า Sparkle build floor มาตรฐานสำหรับเวอร์ชันรีลีสนั้น

## กล่องทดสอบรีลีส

`Full Release Validation` คือวิธีที่ operator ใช้เริ่มการทดสอบก่อนรีลีสทั้งหมดจาก entrypoint เดียว สำหรับหลักฐาน commit แบบ pin บน branch ที่เคลื่อนไหวเร็ว ให้ใช้ helper เพื่อให้ workflow ลูกทุกตัวรันจาก branch ชั่วคราวที่ยึดกับ SHA เป้าหมาย:

```bash
pnpm ci:full-release --sha <full-sha>
```

helper จะ push `release-ci/<sha>-...`, dispatch `Full Release Validation` จาก branch นั้นพร้อม `ref=<sha>`, ตรวจสอบว่า `headSha` ของ workflow ลูกทุกตัวตรงกับเป้าหมาย แล้วลบ branch ชั่วคราว วิธีนี้หลีกเลี่ยงการพิสูจน์ child run ของ `main` ที่ใหม่กว่าโดยไม่ตั้งใจ

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

เวิร์กโฟลว์จะ resolve ref เป้าหมาย, dispatch `CI` แบบ manual ด้วย
`target_ref=<release-ref>`, dispatch `OpenClaw Release Checks`, เตรียม artifact
แม่ `release-package-under-test` สำหรับการตรวจสอบฝั่งแพ็กเกจ และ dispatch
Telegram E2E แบบแพ็กเกจ standalone เมื่อ `release_profile=full` พร้อม
`rerun_group=all` หรือเมื่อกำหนด `npm_telegram_package_spec` ไว้ จากนั้น
`OpenClaw Release Checks` จะกระจายไปยัง install smoke, การตรวจสอบ release
ข้าม OS, coverage ของ release-path แบบ live/E2E Docker เมื่อเปิด soak,
Package Acceptance พร้อม QA แพ็กเกจ Telegram, QA Lab parity, live Matrix และ
live Telegram การรันแบบเต็มจะยอมรับได้ต่อเมื่อ summary ของ
`Full Release Validation`
แสดงว่า `normal_ci` และ `release_checks` สำเร็จแล้ว ในโหมด full/all child
`npm_telegram` ต้องสำเร็จด้วยเช่นกัน; นอกเหนือจาก full/all จะถูกข้าม
เว้นแต่ว่ามีการระบุ `npm_telegram_package_spec` ที่เผยแพร่แล้ว summary ตัว
verifier สุดท้ายมีตารางงานที่ช้าที่สุดสำหรับแต่ละ child run เพื่อให้ release
manager เห็น critical path ปัจจุบันได้โดยไม่ต้องดาวน์โหลด log
ดู [การตรวจสอบ release แบบเต็ม](/th/reference/full-release-validation) สำหรับ
stage matrix แบบครบถ้วน, ชื่องาน workflow ที่แน่นอน, ความแตกต่างระหว่าง
profile stable กับ full, artifacts และ handle สำหรับ rerun แบบเฉพาะจุด
Child workflow จะถูก dispatch จาก ref ที่เชื่อถือได้ซึ่งรัน
`Full Release Validation` โดยปกติคือ `--ref main` แม้ว่า `ref` เป้าหมายจะชี้ไปที่
release branch หรือ tag ที่เก่ากว่า ไม่มี input สำหรับ workflow-ref แยกต่างหาก
ของ Full Release Validation; เลือก harness ที่เชื่อถือได้โดยเลือก ref ของ
workflow run
อย่าใช้ `--ref main -f ref=<sha>` สำหรับหลักฐาน commit ที่แน่นอนบน `main`
ที่เคลื่อนไหวอยู่; raw commit SHA ไม่สามารถเป็น workflow dispatch ref ได้
ดังนั้นให้ใช้ `pnpm ci:full-release --sha <sha>` เพื่อสร้าง branch ชั่วคราวที่ pin ไว้

ใช้ `release_profile` เพื่อเลือกความกว้างของ live/provider:

- `minimum`: เส้นทาง OpenAI/core live และ Docker ที่สำคัญต่อ release เร็วที่สุด
- `stable`: minimum พร้อม coverage ของ provider/backend ที่เสถียรสำหรับการอนุมัติ release
- `full`: stable พร้อม coverage กว้างสำหรับ advisory provider/media

ใช้ `run_release_soak=true` กับ `stable` เมื่อ lane ที่ block release เป็นสีเขียว
และคุณต้องการ sweep แบบ exhaustive ของ live/E2E, release-path ของ Docker และ
published upgrade-survivor ที่มีขอบเขตก่อน promote sweep นั้นครอบคลุม
แพ็กเกจ stable ล่าสุดสี่รายการ รวมถึง baseline ที่ pin ไว้ `2026.4.23` และ
`2026.5.2` รวมถึง coverage `2026.4.15` ที่เก่ากว่า โดยลบ baseline ที่ซ้ำกันออก
และ shard แต่ละ baseline ลงในงาน Docker runner ของตัวเอง `full` หมายถึง
`run_release_soak=true`

`OpenClaw Release Checks` ใช้ ref workflow ที่เชื่อถือได้เพื่อ resolve ref
เป้าหมายหนึ่งครั้งเป็น `release-package-under-test` และใช้ artifact นั้นซ้ำใน
การตรวจสอบข้าม OS, Package Acceptance และ Docker แบบ release-path เมื่อ soak
รัน วิธีนี้ทำให้ box ฝั่งแพ็กเกจทั้งหมดอยู่บน bytes เดียวกันและหลีกเลี่ยงการ build
แพ็กเกจซ้ำ install smoke ของ OpenAI ข้าม OS ใช้
`OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อมีการตั้งค่าตัวแปรระดับ repo/org มิฉะนั้นใช้
`openai/gpt-5.4` เพราะ lane นี้กำลังพิสูจน์การติดตั้งแพ็กเกจ, onboarding,
การเริ่มต้น Gateway และ agent turn แบบ live หนึ่งครั้ง แทนที่จะ benchmark
model เริ่มต้นที่ช้าที่สุด matrix ของ live provider ที่กว้างกว่ายังคงเป็นที่สำหรับ
coverage เฉพาะ model

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

อย่าใช้ umbrella แบบเต็มเป็นการ rerun ครั้งแรกหลังจากการแก้ไขเฉพาะจุด หาก box
หนึ่งล้มเหลว ให้ใช้ child workflow, job, Docker lane, package profile,
model provider หรือ QA lane ที่ล้มเหลวเป็นหลักฐานถัดไป รัน umbrella แบบเต็มอีกครั้ง
เฉพาะเมื่อการแก้ไขเปลี่ยน release orchestration ที่ใช้ร่วมกันหรือทำให้หลักฐาน
all-box ก่อนหน้านี้ไม่สดใหม่แล้ว verifier สุดท้ายของ umbrella จะตรวจสอบ
id ของ child workflow run ที่บันทึกไว้อีกครั้ง ดังนั้นหลังจาก child workflow
ถูกรันซ้ำจนสำเร็จแล้ว ให้ rerun เฉพาะ parent job `Verify full validation`
ที่ล้มเหลว

สำหรับการกู้คืนแบบมีขอบเขต ให้ส่ง `rerun_group` ไปยัง umbrella `all` คือการรัน
release-candidate จริง, `ci` รันเฉพาะ child ของ normal CI, `plugin-prerelease`
รันเฉพาะ child ของ plugin เฉพาะ release, `release-checks` รันทุก release box
และกลุ่ม release ที่แคบกว่าคือ `install-smoke`, `cross-os`, `live-e2e`,
`package`, `qa`, `qa-parity`, `qa-live` และ `npm-telegram`
การ rerun `npm-telegram` แบบเฉพาะจุดต้องมี `npm_telegram_package_spec`; การรัน
full/all ด้วย `release_profile=full` ใช้ artifact แพ็กเกจจาก release-checks
การ rerun ข้าม OS แบบเฉพาะจุดสามารถเพิ่ม
`cross_os_suite_filter=windows/packaged-upgrade` หรือ filter OS/suite อื่นได้
ความล้มเหลวของ QA release-check เป็น advisory; ความล้มเหลวเฉพาะ QA ไม่ block
release validation

### Vitest

box ของ Vitest คือ child workflow `CI` แบบ manual Manual CI ตั้งใจ bypass
changed scoping และบังคับ test graph ปกติสำหรับ release candidate: Linux Node
shards, bundled-plugin shards, channel contracts, ความเข้ากันได้กับ Node 22,
`check`, `check-additional`, build smoke, docs checks, Python skills, Windows,
macOS, Android และ Control UI i18n

ใช้ box นี้เพื่อตอบว่า "source tree ผ่าน test suite ปกติแบบเต็มหรือไม่"
มันไม่เหมือนกับ release-path product validation หลักฐานที่ควรเก็บไว้:

- summary ของ `Full Release Validation` ที่แสดง URL ของ `CI` run ที่ dispatch
- `CI` run เป็นสีเขียวบน SHA เป้าหมายที่แน่นอน
- ชื่อ shard ที่ล้มเหลวหรือช้าจากงาน CI เมื่อตรวจสอบ regression
- artifact timing ของ Vitest เช่น `.artifacts/vitest-shard-timings.json` เมื่อ
  การรันต้องการการวิเคราะห์ performance

รัน manual CI โดยตรงเฉพาะเมื่อ release ต้องการ normal CI ที่ deterministic แต่
ไม่ต้องการ Docker, QA Lab, live, ข้าม OS หรือ package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

box ของ Docker อยู่ใน `OpenClaw Release Checks` ผ่าน
`openclaw-live-and-e2e-checks-reusable.yml` รวมถึง workflow `install-smoke`
ในโหมด release มันตรวจสอบ release candidate ผ่าน environment Docker แบบ packaged
แทนที่จะเป็นเพียง test ระดับ source

coverage ของ release Docker ประกอบด้วย:

- install smoke แบบเต็มพร้อมเปิดใช้งาน Bun global install smoke ที่ช้า
- การเตรียม/ใช้ซ้ำ image smoke ของ root Dockerfile ตาม SHA เป้าหมาย โดยมีงาน QR,
  root/gateway และ installer/Bun smoke รันเป็น shard ของ install-smoke แยกกัน
- lane E2E ของ repository
- chunk Docker แบบ release-path: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` และ `plugins-runtime-install-h`
- coverage ของ OpenWebUI ภายใน chunk `plugins-runtime-services` เมื่อร้องขอ
- lane install/uninstall ของ bundled plugin ที่แยกเป็น
  `bundled-plugin-install-uninstall-0` ถึง
  `bundled-plugin-install-uninstall-23`
- provider suites แบบ live/E2E และ coverage ของ Docker live model เมื่อ release checks
  รวม live suites

ใช้ artifact ของ Docker ก่อน rerun scheduler แบบ release-path จะอัปโหลด
`.artifacts/docker-tests/` พร้อม log ของ lane, `summary.json`, `failures.json`,
phase timings, JSON ของ scheduler plan และคำสั่ง rerun สำหรับการกู้คืนแบบเฉพาะจุด
ให้ใช้ `docker_lanes=<lane[,lane]>` บน workflow live/E2E แบบ reusable แทนการ
rerun release chunk ทั้งหมด คำสั่ง rerun ที่สร้างขึ้นจะรวม
`package_artifact_run_id` ก่อนหน้าและ input ของ Docker image ที่เตรียมไว้เมื่อมี
ดังนั้น lane ที่ล้มเหลวสามารถใช้ tarball และ image GHCR เดิมซ้ำได้

### QA Lab

box ของ QA Lab เป็นส่วนหนึ่งของ `OpenClaw Release Checks` ด้วย เป็น release gate
สำหรับพฤติกรรม agentic และระดับ channel แยกจาก Vitest และ mechanics ของแพ็กเกจ
Docker

coverage ของ release QA Lab ประกอบด้วย:

- lane mock parity ที่เปรียบเทียบ lane candidate ของ OpenAI กับ baseline Opus 4.6
  โดยใช้ agentic parity pack
- profile QA ของ live Matrix ที่เร็วโดยใช้ environment `qa-live-shared`
- lane QA ของ live Telegram โดยใช้ credential lease ของ Convex CI
- `pnpm qa:otel:smoke` เมื่อ release telemetry ต้องการหลักฐาน local ที่ชัดเจน

ใช้ box นี้เพื่อตอบว่า "release ทำงานถูกต้องใน scenario QA และ flow channel
แบบ live หรือไม่" เก็บ URL artifact สำหรับ lane parity, Matrix และ Telegram
เมื่ออนุมัติ release coverage ของ Matrix แบบเต็มยังคงมีให้ใช้งานเป็นการรัน
QA-Lab แบบ sharded manual แทนที่จะเป็น lane สำคัญต่อ release โดยค่าเริ่มต้น

### แพ็กเกจ

box ของแพ็กเกจคือ gate ของผลิตภัณฑ์ที่ติดตั้งได้ รองรับโดย
`Package Acceptance` และ resolver
`scripts/resolve-openclaw-package-candidate.mjs` resolver จะ normalize candidate
เป็น tarball `package-under-test` ที่ Docker E2E ใช้, validate inventory ของแพ็กเกจ,
บันทึกเวอร์ชันแพ็กเกจและ SHA-256 และแยก ref ของ workflow harness ออกจาก ref
ของ source แพ็กเกจ

source ของ candidate ที่รองรับ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` หรือเวอร์ชัน release ของ OpenClaw
  ที่แน่นอน
- `source=ref`: pack branch, tag หรือ full commit SHA ของ `package_ref` ที่เชื่อถือได้
  ด้วย harness `workflow_ref` ที่เลือกไว้
- `source=url`: ดาวน์โหลด `.tgz` แบบ HTTPS พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: ใช้ `.tgz` ที่อัปโหลดโดย GitHub Actions run อื่นซ้ำ

`OpenClaw Release Checks` รัน Package Acceptance ด้วย `source=artifact`,
artifact แพ็กเกจ release ที่เตรียมไว้, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` Package Acceptance จะเก็บ migration, update,
configured-auth update restart, การล้าง stale plugin dependency, offline plugin
fixtures, plugin update และ QA แพ็กเกจ Telegram ไว้กับ tarball ที่ resolve เดียวกัน
release checks แบบ blocking ใช้ baseline แพ็กเกจ published ล่าสุดตามค่าเริ่มต้น;
`run_release_soak=true` หรือ
`release_profile=full` ขยายเป็น baseline ที่เผยแพร่บน npm แบบ stable ทุกตัวตั้งแต่
`2026.4.23` ถึง `latest` รวมถึง fixture ของ issue ที่รายงาน ใช้
Package Acceptance ด้วย `source=npm` สำหรับ candidate ที่ shipped แล้ว หรือ
`source=ref`/`source=artifact` สำหรับ tarball npm local ที่มี SHA รองรับก่อน
publish มันคือการแทนที่แบบ GitHub-native
สำหรับ coverage ส่วนใหญ่ของ package/update ที่ก่อนหน้านี้ต้องใช้ Parallels
การตรวจสอบ release ข้าม OS ยังคงสำคัญสำหรับ onboarding, installer และพฤติกรรม
platform เฉพาะ OS แต่ product validation ของ package/update ควรเลือกใช้
Package Acceptance

checklist canonical สำหรับการตรวจสอบ update และ plugin คือ
[การทดสอบ updates และ plugins](/th/help/testing-updates-plugins) ใช้ checklist นี้เมื่อ
ตัดสินใจว่า lane local, Docker, Package Acceptance หรือ release-check ใดพิสูจน์
การติดตั้ง/update plugin, การล้างด้วย doctor หรือการเปลี่ยน migration ของ
published-package ได้ การ migration แบบ published update exhaustive จากแพ็กเกจ
stable `2026.4.23+` ทุกตัวเป็น workflow `Update Migration` แบบ manual แยกต่างหาก
ไม่ใช่ส่วนหนึ่งของ Full Release CI

ความผ่อนปรนแบบเดิมสำหรับ package-acceptance ถูกจำกัดเวลาไว้โดยตั้งใจ แพ็กเกจจนถึง
`2026.4.25` อาจใช้เส้นทางความเข้ากันได้สำหรับช่องว่างของเมทาดาทาที่เผยแพร่ไปยัง
npm แล้ว: รายการ QA inventory แบบส่วนตัวที่ขาดหายจาก tarball, ไม่มี
`gateway install --wrapper`, ไม่มีไฟล์แพตช์ใน git fixture ที่ได้จาก tarball, ไม่มี
`update.channel` ที่คงอยู่, ตำแหน่ง install-record ของ plugin แบบเดิม,
ไม่มีการคงอยู่ของ marketplace install-record และการย้ายข้อมูลเมทาดาทาคอนฟิก
ระหว่าง `plugins update` แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนเรื่อง
ไฟล์ตราประทับเมทาดาทาของ local build ที่ถูกจัดส่งไปแล้ว แพ็กเกจหลังจากนั้น
ต้องเป็นไปตามสัญญาแพ็กเกจสมัยใหม่ ช่องว่างเดียวกันเหล่านั้นจะทำให้การตรวจสอบ
รุ่นล้มเหลว

ใช้โปรไฟล์ Package Acceptance ที่กว้างขึ้นเมื่อคำถามเรื่องรุ่นเกี่ยวกับแพ็กเกจ
ที่ติดตั้งได้จริง:

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

- `smoke`: เลนติดตั้งแพ็กเกจ/channel/agent อย่างรวดเร็ว, เครือข่าย Gateway และ
  การโหลดคอนฟิกใหม่
- `package`: สัญญา install/update/restart/plugin package โดยไม่ใช้ ClawHub แบบสด;
  นี่คือค่าเริ่มต้นของ release-check
- `product`: `package` รวมกับช่องทาง MCP, การล้าง cron/subagent, การค้นเว็บ OpenAI
  และ OpenWebUI
- `full`: ชิ้นส่วนเส้นทางรุ่นของ Docker พร้อม OpenWebUI
- `custom`: รายการ `docker_lanes` ที่แน่นอนสำหรับการรันซ้ำแบบเจาะจง

สำหรับหลักฐาน Telegram ของ package-candidate ให้เปิดใช้ `telegram_mode=mock-openai` หรือ
`telegram_mode=live-frontier` บน Package Acceptance workflow จะส่ง tarball
`package-under-test` ที่ resolve แล้วเข้าไปในเลน Telegram; workflow Telegram
แบบสแตนด์อโลนยังคงรับสเปก npm ที่เผยแพร่แล้วสำหรับการตรวจหลังเผยแพร่

## ระบบอัตโนมัติสำหรับเผยแพร่รุ่น

`OpenClaw Release Publish` คือ entrypoint เผยแพร่แบบเปลี่ยนแปลงสถานะปกติ โดยจะ
ประสาน workflow trusted-publisher ตามลำดับที่รุ่นต้องใช้:

1. Check out แท็กรุ่นและ resolve commit SHA ของแท็กนั้น
2. ตรวจสอบว่าแท็ก reachable จาก `main` หรือ `release/*`
3. รัน `pnpm plugins:sync:check`
4. Dispatch `Plugin NPM Release` ด้วย `publish_scope=all-publishable` และ
   `ref=<release-sha>`
5. Dispatch `Plugin ClawHub Release` ด้วย scope และ SHA เดียวกัน
6. Dispatch `OpenClaw NPM Release` ด้วยแท็กรุ่น, npm dist-tag และ
   `preflight_run_id` ที่บันทึกไว้

ตัวอย่างการเผยแพร่ Beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

การเผยแพร่ Stable ไปยัง beta dist-tag ค่าเริ่มต้น:

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
เฉพาะสำหรับงานซ่อมหรือเผยแพร่ซ้ำแบบเจาะจงเท่านั้น สำหรับการซ่อม Plugin ที่เลือกไว้ ให้ส่ง
`plugin_publish_scope=selected` และ `plugins=@openclaw/name` ไปยัง
`OpenClaw Release Publish` หรือ dispatch workflow ลูกโดยตรงเมื่อไม่ควรเผยแพร่
แพ็กเกจ OpenClaw

## อินพุต workflow ของ NPM

`OpenClaw NPM Release` รับอินพุตที่ผู้ปฏิบัติการควบคุมได้เหล่านี้:

- `tag`: แท็กรุ่นที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1` หรือ
  `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` อาจเป็น commit SHA แบบเต็ม
  40 อักขระของ workflow-branch ปัจจุบันสำหรับ preflight แบบตรวจสอบเท่านั้นได้ด้วย
- `preflight_only`: `true` สำหรับการตรวจสอบ/build/package เท่านั้น, `false` สำหรับ
  เส้นทางเผยแพร่จริง
- `preflight_run_id`: จำเป็นบนเส้นทางเผยแพร่จริง เพื่อให้ workflow ใช้ tarball
  ที่เตรียมไว้จาก preflight run ที่สำเร็จซ้ำ
- `npm_dist_tag`: แท็กเป้าหมายของ npm สำหรับเส้นทางเผยแพร่; ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Publish` รับอินพุตที่ผู้ปฏิบัติการควบคุมได้เหล่านี้:

- `tag`: แท็กรุ่นที่จำเป็น; ต้องมีอยู่แล้ว
- `preflight_run_id`: run id ของ preflight `OpenClaw NPM Release` ที่สำเร็จ;
  จำเป็นเมื่อ `publish_openclaw_npm=true`
- `npm_dist_tag`: แท็กเป้าหมายของ npm สำหรับแพ็กเกจ OpenClaw
- `plugin_publish_scope`: ค่าเริ่มต้นคือ `all-publishable`; ใช้ `selected` เฉพาะ
  สำหรับงานซ่อมแบบเจาะจง
- `plugins`: ชื่อแพ็กเกจ `@openclaw/*` คั่นด้วยจุลภาค เมื่อ
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: ค่าเริ่มต้นคือ `true`; ตั้งเป็น `false` เฉพาะเมื่อใช้
  workflow เป็นตัวประสานงานซ่อมเฉพาะ Plugin

`OpenClaw Release Checks` รับอินพุตที่ผู้ปฏิบัติการควบคุมได้เหล่านี้:

- `ref`: branch, tag หรือ commit SHA แบบเต็มที่จะตรวจสอบ เช็กที่มี secret
  ต้องให้ commit ที่ resolve แล้ว reachable จาก branch ของ OpenClaw หรือ
  แท็กรุ่น
- `run_release_soak`: เลือกเข้าร่วม live/E2E แบบครบถ้วน, เส้นทางรุ่นของ Docker และ
  การ soak upgrade-survivor ทั้งหมดตั้งแต่ต้นบนเช็ก stable/default release โดยจะถูกบังคับ
  เปิดโดย `release_profile=full`

กฎ:

- แท็ก Stable และ correction อาจเผยแพร่ไปยัง `beta` หรือ `latest` ก็ได้
- แท็ก prerelease แบบ Beta อาจเผยแพร่ได้เฉพาะไปยัง `beta`
- สำหรับ `OpenClaw NPM Release` อนุญาตให้ใช้อินพุต commit SHA แบบเต็มเฉพาะเมื่อ
  `preflight_only=true`
- `OpenClaw Release Checks` และ `Full Release Validation` เป็นแบบตรวจสอบเท่านั้นเสมอ
- เส้นทางเผยแพร่จริงต้องใช้ `npm_dist_tag` เดียวกับที่ใช้ระหว่าง preflight;
  workflow จะตรวจสอบว่าเมทาดาทานั้นยังคงตรงกันก่อนดำเนินการเผยแพร่ต่อ

## ลำดับการเผยแพร่ npm แบบ Stable

เมื่อตัดรุ่น npm แบบ Stable:

1. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนมีแท็ก คุณอาจใช้ commit SHA แบบเต็มของ workflow-branch ปัจจุบันสำหรับ
     การ dry run แบบตรวจสอบเท่านั้นของ preflight workflow
2. เลือก `npm_dist_tag=beta` สำหรับโฟลว์ beta-first ปกติ หรือ `latest` เฉพาะเมื่อ
   คุณตั้งใจเผยแพร่ stable โดยตรง
3. รัน `Full Release Validation` บน branch รุ่น, แท็กรุ่น หรือ commit SHA แบบเต็ม
   เมื่อคุณต้องการ CI ปกติ รวมกับ live prompt cache, Docker, QA Lab,
   Matrix และความครอบคลุมของ Telegram จาก workflow แบบ manual เดียว
4. หากคุณตั้งใจต้องการเพียงกราฟทดสอบปกติที่กำหนดได้แน่นอน ให้รัน workflow
   `CI` แบบ manual บน release ref แทน
5. บันทึก `preflight_run_id` ที่สำเร็จ
6. รัน `OpenClaw Release Publish` ด้วย `tag` เดียวกัน, `npm_dist_tag` เดียวกัน
   และ `preflight_run_id` ที่บันทึกไว้; workflow จะเผยแพร่ Plugin ที่แยกออกสู่ภายนอกไปยัง npm
   และ ClawHub ก่อนโปรโมตแพ็กเกจ npm ของ OpenClaw
7. หากรุ่นลงที่ `beta` ให้ใช้ workflow ส่วนตัว
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   เพื่อโปรโมตเวอร์ชัน stable นั้นจาก `beta` ไปยัง `latest`
8. หากรุ่นเผยแพร่โดยตรงไปยัง `latest` โดยตั้งใจ และ `beta`
   ควรตาม build stable เดียวกันทันที ให้ใช้ workflow ส่วนตัวเดียวกันนั้น
   เพื่อชี้ dist-tags ทั้งสองไปยังเวอร์ชัน stable หรือปล่อยให้ sync self-healing
   ตามกำหนดเวลาของมันย้าย `beta` ในภายหลัง

การเปลี่ยนแปลง dist-tag อยู่ใน repo ส่วนตัวเพื่อความปลอดภัย เพราะยังต้องใช้
`NPM_TOKEN` ในขณะที่ repo สาธารณะใช้การเผยแพร่แบบ OIDC-only

สิ่งนี้ทำให้ทั้งเส้นทางเผยแพร่โดยตรงและเส้นทางโปรโมตแบบ beta-first ถูกบันทึกไว้
และมองเห็นได้สำหรับผู้ปฏิบัติการ

หาก maintainer ต้อง fallback ไปใช้การยืนยันตัวตน npm แบบ local ให้รันคำสั่ง
1Password CLI (`op`) ใด ๆ เฉพาะในเซสชัน tmux เฉพาะกิจเท่านั้น อย่าเรียก `op`
โดยตรงจาก shell หลักของ agent; การเก็บไว้ใน tmux ทำให้ prompt, alert และ
การจัดการ OTP สังเกตได้ และป้องกัน alert จาก host ซ้ำ ๆ

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

Maintainer ใช้เอกสารรุ่นส่วนตัวใน
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
สำหรับ runbook จริง

## ที่เกี่ยวข้อง

- [ช่องทางรุ่น](/th/install/development-channels)
