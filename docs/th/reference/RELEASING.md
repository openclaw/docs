---
read_when:
    - กำลังค้นหาคำจำกัดความของช่องทางเผยแพร่สาธารณะ
    - การเรียกใช้การตรวจสอบความถูกต้องของรีลีสหรือการยอมรับแพ็กเกจ
    - กำลังมองหารูปแบบการตั้งชื่อเวอร์ชันและรอบการออกเวอร์ชัน
summary: เลนการเผยแพร่ รายการตรวจสอบสำหรับผู้ปฏิบัติงาน กล่องตรวจสอบความถูกต้อง การตั้งชื่อเวอร์ชัน และรอบกำหนดการ
title: นโยบายการเผยแพร่
x-i18n:
    generated_at: "2026-05-01T10:20:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfe579099a9580e2d0400cd0b24f26d3fa3ee917899423604ebc13aa2519b4ee
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw มีช่องทางรีลีสสาธารณะสามช่องทาง:

- เสถียร: รีลีสที่ติดแท็กซึ่งเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อมีการร้องขออย่างชัดเจน
- เบต้า: แท็กก่อนรีลีสที่เผยแพร่ไปยัง npm `beta`
- การพัฒนา: ส่วนหัวที่เปลี่ยนแปลงตลอดเวลาของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันรีลีสเสถียร: `YYYY.M.D`
  - แท็ก Git: `vYYYY.M.D`
- เวอร์ชันรีลีสแก้ไขเสถียร: `YYYY.M.D-N`
  - แท็ก Git: `vYYYY.M.D-N`
- เวอร์ชันก่อนรีลีสเบต้า: `YYYY.M.D-beta.N`
  - แท็ก Git: `vYYYY.M.D-beta.N`
- อย่าเติมศูนย์นำหน้าเดือนหรือวัน
- `latest` หมายถึงรีลีส npm เสถียรที่ได้รับการโปรโมตในปัจจุบัน
- `beta` หมายถึงเป้าหมายการติดตั้งเบต้าปัจจุบัน
- รีลีสเสถียรและรีลีสแก้ไขเสถียรเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น; ผู้ดำเนินการรีลีสสามารถกำหนดเป้าหมายเป็น `latest` อย่างชัดเจน หรือโปรโมตบิลด์เบต้าที่ผ่านการตรวจสอบแล้วในภายหลัง
- ทุกรีลีสเสถียรของ OpenClaw จัดส่งแพ็กเกจ npm และแอป macOS พร้อมกัน;
  โดยปกติรีลีสเบต้าจะตรวจสอบและเผยแพร่เส้นทาง npm/แพ็กเกจก่อน โดยสงวน
  การบิลด์/ลงนาม/รับรองแอป Mac ไว้สำหรับรีลีสเสถียร เว้นแต่จะมีการร้องขออย่างชัดเจน

## จังหวะการรีลีส

- รีลีสจะดำเนินแบบเบต้าก่อน
- รีลีสเสถียรจะตามมาหลังจากตรวจสอบเบต้าล่าสุดแล้วเท่านั้น
- โดยปกติผู้ดูแลจะตัดรีลีสจากแบรนช์ `release/YYYY.M.D` ที่สร้าง
  จาก `main` ปัจจุบัน เพื่อให้การตรวจสอบรีลีสและการแก้ไขไม่ปิดกั้นการพัฒนา
  ใหม่บน `main`
- หากแท็กเบต้าถูก push หรือเผยแพร่แล้วและต้องแก้ไข ผู้ดูแลจะตัด
  แท็ก `-beta.N` ถัดไปแทนการลบหรือสร้างแท็กเบต้าเดิมใหม่
- ขั้นตอนรีลีสโดยละเอียด การอนุมัติ ข้อมูลรับรอง และบันทึกการกู้คืน
  สำหรับผู้ดูแลเท่านั้น

## รายการตรวจสอบของผู้ดำเนินการรีลีส

รายการตรวจสอบนี้คือรูปแบบสาธารณะของโฟลว์รีลีส ข้อมูลรับรองส่วนตัว
การลงนาม การรับรอง การกู้คืน dist-tag และรายละเอียดการย้อนกลับฉุกเฉินจะอยู่ใน
คู่มือปฏิบัติการรีลีสสำหรับผู้ดูแลเท่านั้น

1. เริ่มจาก `main` ปัจจุบัน: pull ล่าสุด ยืนยันว่า commit เป้าหมายถูก push แล้ว
   และยืนยันว่า CI ของ `main` ปัจจุบันเขียวพอที่จะสร้างแบรนช์จากจุดนั้น
2. เขียนส่วนบนสุดของ `CHANGELOG.md` ใหม่จากประวัติ commit จริงด้วย
   `/changelog` ให้รายการเป็นมุมมองผู้ใช้ commit รายการนั้น push แล้ว rebase/pull
   อีกครั้งก่อนสร้างแบรนช์
3. ตรวจสอบระเบียนความเข้ากันได้ของรีลีสใน
   `src/plugins/compat/registry.ts` และ
   `src/commands/doctor/shared/deprecation-compat.ts` ลบความเข้ากันได้ที่หมดอายุ
   เฉพาะเมื่อเส้นทางอัปเกรดยังครอบคลุมอยู่ หรือบันทึกเหตุผลว่าทำไมจึงตั้งใจ
   คงไว้
4. สร้าง `release/YYYY.M.D` จาก `main` ปัจจุบัน; อย่าทำงานรีลีสตามปกติ
   โดยตรงบน `main`
5. เพิ่มเวอร์ชันทุกตำแหน่งที่จำเป็นสำหรับแท็กที่ตั้งใจไว้ จากนั้นเรียกใช้
   preflight แบบกำหนดผลซ้ำได้ในเครื่อง:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` และ `pnpm release:check`
6. เรียกใช้ `OpenClaw NPM Release` พร้อม `preflight_only=true` ก่อนมีแท็ก
   สามารถใช้ SHA ของแบรนช์รีลีสแบบเต็ม 40 อักขระสำหรับ preflight เพื่อการตรวจสอบเท่านั้น
   บันทึก `preflight_run_id` ที่สำเร็จไว้
7. เริ่มการทดสอบก่อนรีลีสทั้งหมดด้วย `Full Release Validation` สำหรับ
   แบรนช์รีลีส แท็ก หรือ SHA ของ commit แบบเต็ม นี่คือจุดเข้าแบบแมนนวลเดียว
   สำหรับกล่องทดสอบรีลีสขนาดใหญ่ทั้งสี่: Vitest, Docker, QA Lab และ Package
8. หากการตรวจสอบล้มเหลว ให้แก้บนแบรนช์รีลีสและเรียกใช้ไฟล์ เลน งาน workflow
   โปรไฟล์แพ็กเกจ ผู้ให้บริการ หรือ allowlist ของโมเดลที่ล้มเหลวที่เล็กที่สุด
   ซึ่งพิสูจน์การแก้ไขได้ เรียกใช้ชุดครอบคลุมเต็มรูปแบบอีกครั้งเฉพาะเมื่อพื้นผิวที่เปลี่ยน
   ทำให้หลักฐานก่อนหน้าไม่สดใหม่แล้ว
9. สำหรับเบต้า ให้แท็ก `vYYYY.M.D-beta.N` เผยแพร่ด้วย npm dist-tag `beta` แล้วเรียกใช้
   การยอมรับแพ็กเกจหลังเผยแพร่กับแพ็กเกจ `openclaw@YYYY.M.D-beta.N`
   หรือ `openclaw@beta` ที่เผยแพร่แล้ว หากเบต้าที่ push หรือเผยแพร่แล้วต้องแก้ไข ให้ตัด
   `-beta.N` ถัดไป; อย่าลบหรือเขียนเบต้าเดิมใหม่
10. สำหรับเสถียร ให้ดำเนินต่อเฉพาะหลังจากเบต้าที่ผ่านการตรวจสอบแล้วหรือ release candidate มี
    หลักฐานการตรวจสอบที่จำเป็น การเผยแพร่ npm แบบเสถียรจะใช้ artifact
    preflight ที่สำเร็จซ้ำผ่าน `preflight_run_id`; ความพร้อมของรีลีส macOS แบบเสถียร
    ยังต้องมี `.zip`, `.dmg`, `.dSYM.zip` ที่แพ็กแล้ว และ
    `appcast.xml` ที่อัปเดตบน `main`
11. หลังเผยแพร่ ให้เรียกใช้ตัวตรวจสอบ npm หลังเผยแพร่, E2E ของ Telegram
    แบบ published-npm แยกต่างหากที่เป็นทางเลือกเมื่อคุณต้องการหลักฐานช่องทางหลังเผยแพร่,
    การโปรโมต dist-tag เมื่อจำเป็น, หมายเหตุ GitHub release/prerelease จากส่วน
    `CHANGELOG.md` ที่ตรงกันครบถ้วน และขั้นตอนประกาศรีลีส

## Preflight ของรีลีส

- เรียกใช้ `pnpm check:test-types` ก่อน preflight การปล่อยรุ่น เพื่อให้ TypeScript ของการทดสอบยังคง
  ครอบคลุมนอกเหนือจาก gate `pnpm check` ในเครื่องที่เร็วกว่า
- เรียกใช้ `pnpm check:architecture` ก่อน preflight การปล่อยรุ่น เพื่อให้การตรวจสอบวงจรการ import
  และขอบเขตสถาปัตยกรรมที่กว้างขึ้นผ่านเป็นสีเขียวนอกเหนือจาก gate ในเครื่องที่เร็วกว่า
- เรียกใช้ `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้ artifact การปล่อยรุ่น
  `dist/*` ที่คาดไว้และ bundle ของ Control UI มีอยู่สำหรับขั้นตอนตรวจสอบ pack
- เรียกใช้ workflow แบบ manual `Full Release Validation` ก่อนอนุมัติการปล่อยรุ่น เพื่อ
  เริ่มกล่องทดสอบก่อนปล่อยรุ่นทั้งหมดจาก entrypoint เดียว รองรับ branch,
  tag หรือ commit SHA แบบเต็ม, dispatch `CI` แบบ manual และ dispatch
  `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, ชุดทดสอบเส้นทางการปล่อย Docker,
  live/E2E, OpenWebUI, parity ของ QA Lab, Matrix และเลน Telegram
  ระบุ `npm_telegram_package_spec` เฉพาะหลังจาก package ถูกเผยแพร่แล้ว
  และต้องการให้ post-publish Telegram E2E ทำงานด้วย ระบุ
  `evidence_package_spec` เมื่อรายงานหลักฐาน private ควรพิสูจน์ว่าการตรวจสอบ
  ตรงกับ package npm ที่เผยแพร่แล้วโดยไม่บังคับให้รัน Telegram E2E
  ตัวอย่าง:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- เรียกใช้ workflow แบบ manual `Package Acceptance` เมื่อคุณต้องการหลักฐาน side-channel
  สำหรับ package candidate ระหว่างที่งานปล่อยรุ่นยังดำเนินต่อ ใช้ `source=npm` สำหรับ
  `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันปล่อยรุ่นที่เจาะจง; ใช้ `source=ref`
  เพื่อ pack branch/tag/SHA `package_ref` ที่เชื่อถือได้ด้วย harness
  `workflow_ref` ปัจจุบัน; ใช้ `source=url` สำหรับ tarball HTTPS พร้อม
  SHA-256 ที่จำเป็น; หรือใช้ `source=artifact` สำหรับ tarball ที่อัปโหลดโดยการรัน
  GitHub Actions อื่น workflow จะแก้ candidate เป็น
  `package-under-test`, ใช้ตัวจัดตาราง Docker E2E release ซ้ำกับ
  tarball นั้น และสามารถรัน Telegram QA กับ tarball เดียวกันด้วย
  `telegram_mode=mock-openai` หรือ `telegram_mode=live-frontier` เมื่อ
  เลน Docker ที่เลือกมี `published-upgrade-survivor` artifact ของ package
  จะเป็น candidate และ `published_upgrade_survivor_baseline` จะเลือก
  baseline ที่เผยแพร่แล้ว
  ตัวอย่าง: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  โปรไฟล์ทั่วไป:
  - `smoke`: เลนติดตั้ง/channel/agent, เครือข่าย Gateway และการโหลด config ซ้ำ
  - `package`: เลน package/update/plugin ที่อิง artifact โดยไม่มี OpenWebUI หรือ ClawHub แบบ live
  - `product`: โปรไฟล์ package พร้อมช่องทาง MCP, การล้าง cron/subagent,
    การค้นหาเว็บ OpenAI และ OpenWebUI
  - `full`: ชิ้นส่วนเส้นทางการปล่อย Docker พร้อม OpenWebUI
  - `custom`: การเลือก `docker_lanes` แบบเจาะจงสำหรับการรันซ้ำที่เน้นเฉพาะจุด
- เรียกใช้ workflow แบบ manual `CI` โดยตรงเมื่อคุณต้องการเพียงความครอบคลุมของ CI ปกติแบบเต็ม
  สำหรับ release candidate การ dispatch CI แบบ manual จะข้าม changed
  scoping และบังคับเลน Linux Node shards, bundled-plugin shards, สัญญา channel,
  ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke,
  การตรวจ docs, Python skills, Windows, macOS, Android และ Control UI i18n
  ตัวอย่าง: `gh workflow run ci.yml --ref release/YYYY.M.D`
- เรียกใช้ `pnpm qa:otel:smoke` เมื่อตรวจสอบ telemetry ของการปล่อยรุ่น คำสั่งนี้จะทดสอบ
  QA-lab ผ่านตัวรับ OTLP/HTTP ในเครื่อง และตรวจสอบชื่อ trace span ที่ export,
  attribute ที่มีขอบเขต และการ redact เนื้อหา/identifier โดยไม่ต้องใช้
  Opik, Langfuse หรือตัวรวบรวมภายนอกอื่น
- เรียกใช้ `pnpm release:check` ก่อนการปล่อยรุ่นที่ติด tag ทุกครั้ง
- ตอนนี้การตรวจการปล่อยรุ่นรันใน workflow แบบ manual แยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรัน gate parity แบบ mock ของ QA Lab รวมถึงโปรไฟล์ Matrix แบบ live ที่เร็ว
  และเลน Telegram QA ก่อนอนุมัติการปล่อยรุ่นด้วย เลน live
  ใช้ environment `qa-live-shared`; Telegram ยังใช้ credential lease ของ Convex CI
  ด้วย เรียกใช้ workflow แบบ manual `QA-Lab - All Lanes` พร้อม
  `matrix_profile=all` และ `matrix_shards=true` เมื่อคุณต้องการ inventory การขนส่ง Matrix,
  media และ E2EE แบบเต็มพร้อมกัน
- การตรวจสอบ runtime ของการติดตั้งและอัปเกรดข้าม OS เป็นส่วนหนึ่งของ
  `OpenClaw Release Checks` และ `Full Release Validation` แบบ public ซึ่งเรียก
  workflow ที่ใช้ซ้ำได้
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` โดยตรง
- การแยกนี้เป็นความตั้งใจ: รักษาเส้นทางการปล่อย npm จริงให้สั้น,
  กำหนดผลได้แน่นอน และเน้น artifact ขณะที่การตรวจ live ที่ช้ากว่าอยู่ใน
  เลนของตัวเอง เพื่อไม่ให้หน่วงหรือบล็อกการ publish
- การตรวจการปล่อยรุ่นที่มี secret ควร dispatch ผ่าน `Full Release
Validation` หรือจาก workflow ref ของ `main`/release เพื่อให้ตรรกะ workflow และ
  secrets ยังถูกควบคุม
- `OpenClaw Release Checks` รองรับ branch, tag หรือ commit SHA แบบเต็ม ตราบใด
  ที่ commit ที่ resolve ได้สามารถเข้าถึงจาก branch ของ OpenClaw หรือ release tag
- preflight แบบ validation-only ของ `OpenClaw NPM Release` ยังรองรับ commit SHA แบบเต็ม 40 อักขระปัจจุบัน
  ของ workflow branch โดยไม่ต้องมี tag ที่ push แล้ว
- เส้นทาง SHA นั้นเป็น validation-only และไม่สามารถโปรโมตเป็นการ publish จริงได้
- ในโหมด SHA workflow จะสังเคราะห์ `v<package.json version>` เฉพาะสำหรับ
  การตรวจ metadata ของ package; การ publish จริงยังต้องใช้ release tag จริง
- ทั้งสอง workflow คงเส้นทาง publish และ promotion จริงไว้บน runner ที่ GitHub host
  ขณะที่เส้นทาง validation ที่ไม่เปลี่ยนแปลงสถานะสามารถใช้ runner Linux Blacksmith ที่ใหญ่กว่าได้
- workflow นั้นเรียกใช้
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ workflow secrets ทั้ง `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- preflight การปล่อย npm จะไม่รอเลนตรวจการปล่อยรุ่นที่แยกต่างหากอีกต่อไป
- เรียกใช้ `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือ tag beta/correction ที่ตรงกัน) ก่อนอนุมัติ
- หลังจาก publish npm ให้เรียกใช้
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (หรือเวอร์ชัน beta/correction ที่ตรงกัน) เพื่อตรวจสอบเส้นทางการติดตั้ง registry ที่เผยแพร่แล้ว
  ใน temp prefix ใหม่
- หลังจาก publish beta ให้เรียกใช้ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  เพื่อตรวจสอบ onboarding ของ installed-package, การตั้งค่า Telegram และ Telegram E2E จริง
  กับ package npm ที่เผยแพร่แล้วโดยใช้ pool credential Telegram แบบเช่าร่วม
  maintainer ที่รันครั้งเดียวในเครื่องอาจละ Convex vars และส่ง credential env
  `OPENCLAW_QA_TELEGRAM_*` ทั้งสามค่าโดยตรง
- Maintainer สามารถรันการตรวจ post-publish เดียวกันจาก GitHub Actions ผ่าน
  workflow แบบ manual `NPM Telegram Beta E2E` ได้ ตั้งใจให้เป็น manual-only และ
  ไม่รันทุก merge
- ระบบอัตโนมัติการปล่อยรุ่นสำหรับ maintainer ตอนนี้ใช้ preflight-then-promote:
  - การ publish npm จริงต้องผ่าน npm `preflight_run_id` ที่สำเร็จ
  - การ publish npm จริงต้องถูก dispatch จาก branch `main` หรือ
    `release/YYYY.M.D` เดียวกับ preflight run ที่สำเร็จ
  - การปล่อย npm แบบ stable มีค่าเริ่มต้นเป็น `beta`
  - การ publish npm แบบ stable สามารถ target `latest` อย่างชัดเจนผ่าน input ของ workflow
  - การเปลี่ยน npm dist-tag แบบใช้ token ตอนนี้อยู่ใน
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    เพื่อความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่
    repo public ยังคง publish แบบ OIDC-only
  - `macOS Release` แบบ public เป็น validation-only; เมื่อ tag อยู่เฉพาะบน
    release branch แต่ workflow ถูก dispatch จาก `main` ให้ตั้ง
    `public_release_branch=release/YYYY.M.D`
  - การ publish private mac จริงต้องผ่าน private mac
    `preflight_run_id` และ `validate_run_id` ที่สำเร็จ
  - เส้นทาง publish จริงจะโปรโมต artifact ที่เตรียมไว้แทนการ rebuild
    อีกครั้ง
- สำหรับการปล่อย correction แบบ stable เช่น `YYYY.M.D-N` ตัวตรวจ post-publish
  จะตรวจเส้นทางอัปเกรด temp-prefix เดียวกันจาก `YYYY.M.D` เป็น `YYYY.M.D-N`
  ด้วย เพื่อให้ correction การปล่อยรุ่นไม่ปล่อยให้การติดตั้ง global เก่าค้างอยู่บน
  payload stable ฐานโดยไม่ถูกตรวจพบ
- preflight การปล่อย npm จะ fail closed เว้นแต่ tarball จะมีทั้ง
  `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่าง
  เพื่อไม่ให้เราส่ง browser dashboard ที่ว่างเปล่าอีกครั้ง
- การตรวจ post-publish ยังตรวจด้วยว่าการติดตั้ง registry ที่เผยแพร่แล้ว
  มี runtime deps ของ bundled plugin ที่ไม่ว่างภายใต้ layout `dist/*`
  ที่ root การปล่อยรุ่นที่มาพร้อม payload dependency ของ bundled plugin
  ที่ขาดหายหรือว่างเปล่าจะทำให้ตัวตรวจ postpublish ล้มเหลวและไม่สามารถโปรโมต
  เป็น `latest` ได้
- `pnpm test:install:smoke` ยังบังคับ budget `unpackedSize` ของ npm pack บน
  tarball candidate update ด้วย เพื่อให้ installer e2e จับ pack bloat โดยไม่ได้ตั้งใจ
  ก่อนเส้นทาง publish การปล่อยรุ่น
- หากงานปล่อยรุ่นแตะการวางแผน CI, manifest timing ของ Plugin หรือ
  matrix การทดสอบ Plugin ให้ regenerate และ review output matrix
  `plugin-prerelease-extension-shard` ที่ planner เป็นเจ้าของจาก
  `.github/workflows/plugin-prerelease.yml` ก่อนอนุมัติ เพื่อให้ release notes
  ไม่อธิบาย layout CI ที่ล้าสมัย
- ความพร้อมของการปล่อย macOS แบบ stable ยังรวมถึงพื้นผิว updater:
  - GitHub release ต้องลงเอยด้วย `.zip`, `.dmg` และ `.dSYM.zip` ที่ package แล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปยัง zip stable ใหม่หลัง publish
  - แอปที่ package แล้วต้องคง bundle id ที่ไม่ใช่ debug, URL feed ของ Sparkle ที่ไม่ว่าง
    และ `CFBundleVersion` ที่เท่ากับหรือสูงกว่า build floor ของ Sparkle ตาม canonical
    สำหรับเวอร์ชันการปล่อยรุ่นนั้น

## กล่องทดสอบการปล่อยรุ่น

`Full Release Validation` คือวิธีที่ operator ใช้เริ่มการทดสอบก่อนปล่อยรุ่นทั้งหมดจาก
entrypoint เดียว ให้รันจาก workflow ref `main` ที่เชื่อถือได้และส่ง release
branch, tag หรือ commit SHA แบบเต็มเป็น `ref`:

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
`target_ref=<release-ref>`, dispatch `OpenClaw Release Checks` และ
อาจ dispatch post-publish Telegram E2E แบบ standalone เมื่อ
ตั้งค่า `npm_telegram_package_spec` ไว้ จากนั้น `OpenClaw Release Checks` จะกระจายไปยัง
install smoke, การตรวจ release ข้าม OS, ความครอบคลุม live/E2E Docker release-path,
Package Acceptance พร้อม Telegram package QA, parity ของ QA Lab, Matrix แบบ live และ
Telegram แบบ live การรันแบบเต็มจะยอมรับได้ก็ต่อเมื่อ summary ของ `Full Release Validation`
แสดง `normal_ci` และ `release_checks` ว่าสำเร็จ และ child `npm_telegram`
แบบ optional สำเร็จหรือถูกข้ามโดยตั้งใจ summary ของ verifier ขั้นสุดท้าย
มีตาราง job ที่ช้าที่สุดสำหรับแต่ละ child run เพื่อให้ release
manager เห็น critical path ปัจจุบันโดยไม่ต้องดาวน์โหลด logs
ดู [การตรวจสอบการปล่อยรุ่นแบบเต็ม](/th/reference/full-release-validation) สำหรับ
stage matrix ฉบับสมบูรณ์, ชื่อ job ของ workflow ที่เจาะจง, ความแตกต่างของโปรไฟล์ stable กับ full,
artifacts และ handle สำหรับการรันซ้ำที่เน้นเฉพาะจุด
child workflow จะถูก dispatch จาก ref ที่เชื่อถือได้ซึ่งรัน `Full Release
Validation` โดยปกติคือ `--ref main` แม้เมื่อ target `ref` ชี้ไปยัง
release branch หรือ tag ที่เก่ากว่า ไม่มี input workflow-ref แยกต่างหากสำหรับ Full Release Validation;
เลือก harness ที่เชื่อถือได้โดยเลือก workflow run ref

ใช้ `release_profile` เพื่อเลือกขอบเขต live/provider:

- `minimum`: เส้นทาง OpenAI/core live และ Docker ที่สำคัญต่อการปล่อยรุ่นและเร็วที่สุด
- `stable`: minimum พร้อมความครอบคลุม provider/backend แบบ stable สำหรับอนุมัติการปล่อยรุ่น
- `full`: stable พร้อมความครอบคลุม provider/media แบบ advisory ที่กว้างขึ้น

`OpenClaw Release Checks` ใช้ workflow ref ที่เชื่อถือได้เพื่อ resolve ref เป้าหมายครั้งเดียวเป็น `release-package-under-test` และใช้ artifact นั้นซ้ำทั้งใน release-path Docker checks และ Package Acceptance วิธีนี้ทำให้กล่องทั้งหมดที่เกี่ยวกับแพ็กเกจใช้ไบต์ชุดเดียวกัน และหลีกเลี่ยงการ build แพ็กเกจซ้ำ The cross-OS OpenAI install smoke uses `OPENCLAW_CROSS_OS_OPENAI_MODEL` when the repo/org variable is set, otherwise `openai/gpt-5.4-mini`, because this lane is proving package install, onboarding, gateway startup, and one live agent turn rather than benchmarking the slowest default model. The broader live provider matrix remains the place for model-specific coverage.

ใช้ตัวแปรเหล่านี้ตามระยะของ release:

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

อย่าใช้ umbrella เต็มรูปแบบเป็นการ rerun ครั้งแรกหลังการแก้ไขแบบเจาะจง หากกล่องหนึ่งล้มเหลว ให้ใช้ workflow ลูก, job, Docker lane, package profile, model provider หรือ QA lane ที่ล้มเหลวสำหรับหลักฐานครั้งถัดไป เรียกใช้ umbrella เต็มรูปแบบอีกครั้งเฉพาะเมื่อการแก้ไขเปลี่ยน release orchestration ที่ใช้ร่วมกัน หรือทำให้หลักฐาน all-box ก่อนหน้าล้าสมัย ตัว verifier สุดท้ายของ umbrella จะตรวจซ้ำ run ids ของ workflow ลูกที่บันทึกไว้ ดังนั้นหลังจาก rerun workflow ลูกสำเร็จแล้ว ให้ rerun เฉพาะ parent job `Verify full validation` ที่ล้มเหลว

สำหรับการกู้คืนแบบจำกัดขอบเขต ให้ส่ง `rerun_group` ไปยัง umbrella `all` คือการรัน release-candidate จริง, `ci` รันเฉพาะ CI child ปกติ, `plugin-prerelease` รันเฉพาะ plugin child สำหรับ release เท่านั้น, `release-checks` รันทุก release box และกลุ่ม release ที่แคบกว่าคือ `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` และ `npm-telegram` เมื่อมีการระบุ lane Telegram package แบบ standalone

### Vitest

กล่อง Vitest คือ workflow ลูก `CI` แบบ manual Manual CI ตั้งใจข้าม changed scoping และบังคับใช้กราฟทดสอบปกติสำหรับ release candidate: Linux Node shards, bundled-plugin shards, channel contracts, Node 22 compatibility, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, Android และ Control UI i18n

ใช้กล่องนี้เพื่อตอบว่า "source tree ผ่านชุดทดสอบปกติเต็มรูปแบบหรือไม่?" กล่องนี้ไม่เหมือนกับ release-path product validation หลักฐานที่ควรเก็บไว้:

- สรุป `Full Release Validation` ที่แสดง URL ของ run `CI` ที่ถูก dispatch
- run `CI` เป็นสีเขียวบน target SHA ที่แน่นอน
- ชื่อ shard ที่ล้มเหลวหรือช้า จาก CI jobs เมื่อกำลังตรวจสอบ regressions
- artifact เวลาของ Vitest เช่น `.artifacts/vitest-shard-timings.json` เมื่อ run ต้องการการวิเคราะห์ประสิทธิภาพ

เรียกใช้ manual CI โดยตรงเฉพาะเมื่อ release ต้องการ normal CI แบบกำหนดผลซ้ำได้ แต่ไม่ต้องใช้ Docker, QA Lab, live, cross-OS หรือ package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

กล่อง Docker อยู่ใน `OpenClaw Release Checks` ผ่าน `openclaw-live-and-e2e-checks-reusable.yml` รวมถึง workflow `install-smoke` ใน release-mode กล่องนี้ตรวจสอบ release candidate ผ่านสภาพแวดล้อม Docker แบบแพ็กเกจ แทนที่จะเป็นเฉพาะการทดสอบระดับ source

ขอบเขต Docker สำหรับ release รวมถึง:

- install smoke เต็มรูปแบบ โดยเปิดใช้ slow Bun global install smoke
- การเตรียม/ใช้ซ้ำ root Dockerfile smoke image ตาม target SHA โดยมี QR, root/gateway และ installer/Bun smoke jobs รันเป็น install-smoke shards แยกกัน
- repository E2E lanes
- release-path Docker chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, `plugins-runtime-install-h`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-discord`, `bundled-channels-update-b` และ
  `bundled-channels-contracts`
- ขอบเขต OpenWebUI ภายใน chunk `plugins-runtime-services` เมื่อร้องขอ
- แยก lanes ของ bundled-channel dependency ข้าม channel-smoke, update-target และ setup/runtime contract chunks แทน job bundled-channel ขนาดใหญ่หนึ่ง job
- แยก bundled plugin install/uninstall lanes
  `bundled-plugin-install-uninstall-0` ถึง
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites และ Docker live model coverage เมื่อ release checks รวม live suites

ใช้ Docker artifacts ก่อน rerun ตัว release-path scheduler จะอัปโหลด `.artifacts/docker-tests/` พร้อม lane logs, `summary.json`, `failures.json`, phase timings, scheduler plan JSON และคำสั่ง rerun สำหรับการกู้คืนแบบเจาะจง ให้ใช้ `docker_lanes=<lane[,lane]>` บน workflow live/E2E แบบ reusable แทนการ rerun release chunks ทั้งหมด คำสั่ง rerun ที่สร้างขึ้นจะรวม `package_artifact_run_id` ก่อนหน้า และ prepared Docker image inputs เมื่อมี เพื่อให้ lane ที่ล้มเหลวใช้ tarball และ GHCR images ชุดเดิมซ้ำได้

### QA Lab

กล่อง QA Lab เป็นส่วนหนึ่งของ `OpenClaw Release Checks` เช่นกัน กล่องนี้เป็น agentic behavior และ channel-level release gate แยกจากกลไกแพ็กเกจของ Vitest และ Docker

ขอบเขต QA Lab สำหรับ release รวมถึง:

- mock parity gate ที่เปรียบเทียบ candidate lane ของ OpenAI กับ baseline Opus 4.6 โดยใช้ agentic parity pack
- fast live Matrix QA profile โดยใช้ environment `qa-live-shared`
- live Telegram QA lane โดยใช้ Convex CI credential leases
- `pnpm qa:otel:smoke` เมื่อ release telemetry ต้องการหลักฐาน local ที่ชัดเจน

ใช้กล่องนี้เพื่อตอบว่า "release ทำงานถูกต้องใน QA scenarios และ live channel flows หรือไม่?" เก็บ artifact URLs สำหรับ parity, Matrix และ Telegram lanes เมื่ออนุมัติ release ขอบเขต Matrix เต็มรูปแบบยังพร้อมใช้งานเป็น manual sharded QA-Lab run แทนที่จะเป็น lane สำคัญต่อ release ตามค่าเริ่มต้น

### แพ็กเกจ

กล่อง Package คือ installable-product gate รองรับโดย `Package Acceptance` และ resolver `scripts/resolve-openclaw-package-candidate.mjs` ตัว resolver ทำให้ candidate กลายเป็น tarball `package-under-test` ที่ Docker E2E ใช้, ตรวจสอบ package inventory, บันทึก package version และ SHA-256 และแยก workflow harness ref ออกจาก package source ref

แหล่ง candidate ที่รองรับ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` หรือ release version ของ OpenClaw ที่แน่นอน
- `source=ref`: pack branch, tag หรือ full commit SHA ของ `package_ref` ที่เชื่อถือได้ พร้อม harness `workflow_ref` ที่เลือกไว้
- `source=url`: ดาวน์โหลด HTTPS `.tgz` พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: ใช้ `.tgz` ที่อัปโหลดโดย GitHub Actions run อื่นซ้ำ

`OpenClaw Release Checks` รัน Package Acceptance ด้วย `source=ref`, `package_ref=<release-ref>`, `suite_profile=custom`, `docker_lanes=bundled-channel-deps-compat plugins-offline` และ `telegram_mode=mock-openai` release-path Docker chunks ครอบคลุม install, update และ plugin-update lanes ที่ทับซ้อนกัน Package Acceptance จะคง artifact-native bundled-channel compat, offline plugin fixtures และ Telegram package QA ไว้กับ tarball ที่ resolve แล้วชุดเดียวกัน นี่คือสิ่งแทนที่แบบ GitHub-native สำหรับ coverage ของ package/update ส่วนใหญ่ที่ก่อนหน้านี้ต้องใช้ Parallels Cross-OS release checks ยังสำคัญสำหรับ onboarding, installer และ platform behavior เฉพาะ OS แต่ package/update product validation ควรเลือกใช้ Package Acceptance

ความผ่อนปรนของ package-acceptance แบบ legacy ถูกจำกัดเวลาโดยตั้งใจ แพ็กเกจจนถึง `2026.4.25` อาจใช้ compatibility path สำหรับ metadata gaps ที่เผยแพร่ไปยัง npm แล้ว: private QA inventory entries ที่ไม่มีใน tarball, `gateway install --wrapper` ที่ขาดหาย, patch files ที่ขาดหายใน git fixture ที่มาจาก tarball, `update.channel` ที่ไม่ได้ persist, legacy plugin install-record locations, marketplace install-record persistence ที่ขาดหาย และ config metadata migration ระหว่าง `plugins update` แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ local build metadata stamp ที่ shipped ไปแล้ว แพ็กเกจหลังจากนั้นต้องเป็นไปตาม modern package contracts; gaps เดียวกันนั้นจะทำให้ release validation ล้มเหลว

ใช้ Package Acceptance profiles ที่กว้างขึ้นเมื่อคำถามของ release เกี่ยวกับแพ็กเกจที่ติดตั้งได้จริง:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

package profiles ที่ใช้บ่อย:

- `smoke`: package install/channel/agent, gateway network และ config reload lanes แบบเร็ว
- `package`: install/update/plugin package contracts โดยไม่มี live ClawHub; นี่คือค่าเริ่มต้นของ release-check
- `product`: `package` รวมกับ MCP channels, cron/subagent cleanup, OpenAI web search และ OpenWebUI
- `full`: Docker release-path chunks พร้อม OpenWebUI
- `custom`: รายการ `docker_lanes` ที่แน่นอนสำหรับ focused reruns

สำหรับ package-candidate Telegram proof ให้เปิดใช้ `telegram_mode=mock-openai` หรือ `telegram_mode=live-frontier` บน Package Acceptance workflow จะส่ง tarball `package-under-test` ที่ resolve แล้วเข้าสู่ Telegram lane; workflow Telegram แบบ standalone ยังคงรับ published npm spec สำหรับ post-publish checks

## อินพุตของ NPM workflow

`OpenClaw NPM Release` รับอินพุตที่ operator ควบคุมได้เหล่านี้:

- `tag`: release tag ที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1` หรือ
  `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` ค่านี้อาจเป็น full 40-character workflow-branch commit SHA ปัจจุบันสำหรับ preflight แบบ validation-only ได้ด้วย
- `preflight_only`: `true` สำหรับ validation/build/package เท่านั้น, `false` สำหรับเส้นทาง publish จริง
- `preflight_run_id`: จำเป็นบนเส้นทาง publish จริง เพื่อให้ workflow ใช้ tarball ที่เตรียมไว้จาก preflight run ที่สำเร็จแล้วซ้ำ
- `npm_dist_tag`: npm target tag สำหรับเส้นทาง publish; ค่าเริ่มต้นเป็น `beta`

`OpenClaw Release Checks` รับอินพุตที่ operator ควบคุมได้เหล่านี้:

- `ref`: branch, tag หรือ full commit SHA ที่จะตรวจสอบ Checks ที่มี secrets ต้องการให้ commit ที่ resolve แล้ว reachable จาก branch หรือ release tag ของ OpenClaw

กฎ:

- Stable และ correction tags อาจ publish ไปที่ `beta` หรือ `latest` ก็ได้
- Beta prerelease tags อาจ publish ได้เฉพาะไปที่ `beta`
- สำหรับ `OpenClaw NPM Release` อนุญาตให้ใช้ input เป็น full commit SHA เฉพาะเมื่อ `preflight_only=true`
- `OpenClaw Release Checks` และ `Full Release Validation` เป็น validation-only เสมอ
- เส้นทาง publish จริงต้องใช้ `npm_dist_tag` เดียวกับที่ใช้ระหว่าง preflight; workflow จะตรวจสอบ metadata นั้นก่อน publish ต่อไป

## ลำดับ stable npm release

เมื่อตัด stable npm release:

1. เรียกใช้ `OpenClaw NPM Release` พร้อม `preflight_only=true`
   - ก่อนที่จะมีแท็ก คุณอาจใช้ SHA ของคอมมิตปัจจุบันเต็มรูปแบบบนสาขาเวิร์กโฟลว์
     เพื่อทำ dry run สำหรับตรวจสอบเท่านั้นของเวิร์กโฟลว์ preflight
2. เลือก `npm_dist_tag=beta` สำหรับโฟลว์ปกติแบบ beta-first หรือเลือก `latest` เฉพาะ
   เมื่อคุณตั้งใจต้องการเผยแพร่ stable โดยตรง
3. เรียกใช้ `Full Release Validation` บนสาขารีลีส แท็กรีลีส หรือ SHA ของคอมมิตแบบเต็ม
   เมื่อคุณต้องการ CI ปกติพร้อมความครอบคลุมจากเวิร์กโฟลว์แบบแมนนวลเดียวสำหรับ live prompt cache, Docker, QA Lab,
   Matrix และ Telegram
4. หากคุณตั้งใจต้องการเฉพาะกราฟการทดสอบปกติที่ deterministic ให้เรียกใช้
   เวิร์กโฟลว์ `CI` แบบแมนนวลบน release ref แทน
5. บันทึก `preflight_run_id` ที่สำเร็จ
6. เรียกใช้ `OpenClaw NPM Release` อีกครั้งพร้อม `preflight_only=false`, `tag`
   เดิม, `npm_dist_tag` เดิม และ `preflight_run_id` ที่บันทึกไว้
7. หากรีลีสลงที่ `beta` ให้ใช้เวิร์กโฟลว์ส่วนตัว
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   เพื่อเลื่อนระดับเวอร์ชัน stable นั้นจาก `beta` เป็น `latest`
8. หากรีลีสถูกเผยแพร่โดยตรงไปยัง `latest` โดยตั้งใจ และ `beta`
   ควรตาม stable build เดียวกันทันที ให้ใช้เวิร์กโฟลว์ส่วนตัวเดียวกันนั้น
   เพื่อชี้ dist-tag ทั้งสองไปที่เวอร์ชัน stable หรือปล่อยให้การซิงก์แบบ self-healing
   ตามกำหนดเวลาของเวิร์กโฟลว์ย้าย `beta` ในภายหลัง

การเปลี่ยนแปลง dist-tag อยู่ในรีโปส่วนตัวเพื่อความปลอดภัย เพราะยังคง
ต้องใช้ `NPM_TOKEN` ขณะที่รีโปสาธารณะคงการเผยแพร่แบบ OIDC-only ไว้

สิ่งนี้ทำให้ทั้งพาธการเผยแพร่โดยตรงและพาธการเลื่อนระดับแบบ beta-first
ได้รับการบันทึกไว้ในเอกสารและมองเห็นได้สำหรับผู้ปฏิบัติงาน

หาก maintainer จำเป็นต้อง fallback ไปใช้การยืนยันตัวตน npm ในเครื่อง ให้เรียกใช้คำสั่ง
CLI (`op`) ของ 1Password ใดๆ เฉพาะภายในเซสชัน tmux เฉพาะกิจเท่านั้น ห้ามเรียก `op`
โดยตรงจากเชลล์หลักของ agent; การเก็บไว้ภายใน tmux ทำให้ prompts,
alerts และการจัดการ OTP สังเกตได้ และป้องกันการแจ้งเตือนโฮสต์ซ้ำ

## ข้อมูลอ้างอิงสาธารณะ

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
