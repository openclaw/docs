---
read_when:
    - กำลังค้นหาคำจำกัดความของช่องทางเผยแพร่สาธารณะ
    - การรันการตรวจสอบความถูกต้องของรีลีสหรือการยอมรับแพ็กเกจ
    - กำลังมองหารูปแบบการตั้งชื่อเวอร์ชันและรอบการเผยแพร่
summary: เลนการรีลีส, รายการตรวจสอบของผู้ปฏิบัติการ, กล่องการตรวจสอบความถูกต้อง, การตั้งชื่อเวอร์ชัน และรอบการดำเนินงาน
title: นโยบายการเผยแพร่รุ่น
x-i18n:
    generated_at: "2026-05-12T08:46:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01fed02c15c4d1950c055f25117fd236942a8858f843022597fe5f56ba2eb724
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw มีช่องทางรีลีสสาธารณะสามช่องทาง:

- stable: รีลีสที่ติดแท็กซึ่งเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อมีการร้องขออย่างชัดเจน
- beta: แท็กก่อนรีลีสที่เผยแพร่ไปยัง npm `beta`
- dev: หัวล่าสุดที่เปลี่ยนแปลงอยู่ของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันรีลีส stable: `YYYY.M.D`
  - แท็ก Git: `vYYYY.M.D`
- เวอร์ชันรีลีสแก้ไข stable: `YYYY.M.D-N`
  - แท็ก Git: `vYYYY.M.D-N`
- เวอร์ชันก่อนรีลีส beta: `YYYY.M.D-beta.N`
  - แท็ก Git: `vYYYY.M.D-beta.N`
- อย่าเติมศูนย์นำหน้าเดือนหรือวัน
- `latest` หมายถึงรีลีส npm stable ปัจจุบันที่ได้รับการโปรโมตแล้ว
- `beta` หมายถึงเป้าหมายการติดตั้ง beta ปัจจุบัน
- รีลีส stable และรีลีสแก้ไข stable จะเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น; ผู้ดำเนินการรีลีสสามารถระบุเป้าหมายเป็น `latest` อย่างชัดเจน หรือโปรโมตบิลด์ beta ที่ผ่านการตรวจสอบแล้วในภายหลัง
- รีลีส OpenClaw stable ทุกรีลีสจะส่งแพ็กเกจ npm และแอป macOS พร้อมกัน;
  รีลีส beta โดยปกติจะตรวจสอบและเผยแพร่เส้นทาง npm/package ก่อน โดยสงวน
  การ build/sign/notarize แอป mac ไว้สำหรับ stable เว้นแต่จะมีการร้องขออย่างชัดเจน

## รอบการรีลีส

- รีลีสจะดำเนินไปแบบ beta ก่อน
- stable จะตามมาหลังจาก beta ล่าสุดผ่านการตรวจสอบแล้วเท่านั้น
- โดยปกติผู้ดูแลจะตัดรีลีสจากสาขา `release/YYYY.M.D` ที่สร้างจาก
  `main` ปัจจุบัน เพื่อให้การตรวจสอบรีลีสและการแก้ไขไม่ขัดขวางการพัฒนาใหม่
  บน `main`
- หากแท็ก beta ถูก push หรือเผยแพร่แล้วและต้องมีการแก้ไข ผู้ดูแลจะตัดแท็ก
  `-beta.N` ถัดไปแทนการลบหรือสร้างแท็ก beta เดิมใหม่
- ขั้นตอนรีลีสโดยละเอียด การอนุมัติ ข้อมูลรับรอง และบันทึกการกู้คืน
  เป็นข้อมูลสำหรับผู้ดูแลเท่านั้น

## เช็กลิสต์ผู้ดำเนินการรีลีส

เช็กลิสต์นี้คือรูปแบบสาธารณะของโฟลว์รีลีส ข้อมูลรับรองส่วนตัว
การลงนาม การ notarization การกู้คืน dist-tag และรายละเอียด rollback ฉุกเฉินจะอยู่ใน
runbook รีลีสสำหรับผู้ดูแลเท่านั้น

1. เริ่มจาก `main` ปัจจุบัน: pull ล่าสุด ยืนยันว่า commit เป้าหมายถูก push แล้ว
   และยืนยันว่า CI ของ `main` ปัจจุบันเขียวพอที่จะสร้างสาขาจากจุดนั้น
2. เขียนส่วนบนสุดของ `CHANGELOG.md` ใหม่จากประวัติ commit จริงด้วย
   `/changelog` รักษารายการให้เป็นมุมมองผู้ใช้ commit รายการนั้น push รายการนั้น และ rebase/pull
   อีกครั้งก่อนสร้างสาขา
3. ตรวจทานระเบียนความเข้ากันได้ของรีลีสใน
   `src/plugins/compat/registry.ts` และ
   `src/commands/doctor/shared/deprecation-compat.ts` ลบความเข้ากันได้
   ที่หมดอายุแล้วเฉพาะเมื่อเส้นทางอัปเกรดยังคงครอบคลุมอยู่ หรือบันทึกเหตุผลว่าทำไมจึงตั้งใจ
   คงไว้
4. สร้าง `release/YYYY.M.D` จาก `main` ปัจจุบัน; อย่าทำงานรีลีสปกติ
   โดยตรงบน `main`
5. เพิ่มเวอร์ชันในทุกตำแหน่งที่จำเป็นสำหรับแท็กที่ตั้งใจไว้ แล้วรัน
   `pnpm release:prep` คำสั่งนี้จะรีเฟรชเวอร์ชัน Plugin, inventory ของ Plugin, สคีมา config,
   metadata ของ config ช่องทางที่ bundle มา, baseline เอกสาร config, export ของ plugin SDK
   และ baseline API ของ plugin SDK ตามลำดับที่ถูกต้อง commit drift ที่สร้างขึ้นก่อนติดแท็ก จากนั้นรัน preflight แบบ deterministic ในเครื่อง:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, และ `pnpm release:check`
6. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true` ก่อนมีแท็ก
   อนุญาตให้ใช้ SHA ของสาขารีลีสแบบเต็ม 40 อักขระสำหรับ preflight
   เพื่อการตรวจสอบเท่านั้น บันทึก `preflight_run_id` ที่สำเร็จไว้
7. เริ่มการทดสอบก่อนรีลีสทั้งหมดด้วย `Full Release Validation` สำหรับ
   สาขารีลีส แท็ก หรือ SHA ของ commit แบบเต็ม นี่คือ entrypoint แบบ manual เพียงจุดเดียว
   สำหรับกล่องทดสอบรีลีสขนาดใหญ่สี่ชุด: Vitest, Docker, QA Lab และ Package
8. หากการตรวจสอบล้มเหลว ให้แก้บนสาขารีลีสและรันใหม่เฉพาะไฟล์, lane, งาน workflow, package profile, provider หรือ allowlist ของโมเดลที่เล็กที่สุดซึ่งพิสูจน์การแก้ไขได้ รัน umbrella ทั้งหมดใหม่เฉพาะเมื่อพื้นผิวที่เปลี่ยนแปลงทำให้หลักฐานเดิมล้าสมัย
9. สำหรับ beta ให้ติดแท็ก `vYYYY.M.D-beta.N` จากนั้นรัน `OpenClaw Release Publish` จาก
   สาขา `release/YYYY.M.D` ที่ตรงกัน คำสั่งนี้ตรวจสอบ `pnpm plugins:sync:check`,
   dispatch แพ็กเกจ Plugin ทั้งหมดที่เผยแพร่ได้ไปยัง npm และชุดเดียวกันไปยัง
   ClawHub แบบขนาน จากนั้นโปรโมต artifact preflight ของ OpenClaw npm ที่เตรียมไว้
   ด้วย dist-tag ที่ตรงกันทันทีเมื่อการเผยแพร่ Plugin npm สำเร็จ
   หลังจาก child ของการเผยแพร่ OpenClaw npm สำเร็จ คำสั่งนี้จะสร้างหรืออัปเดต
   หน้า GitHub release/prerelease ที่ตรงกันจากส่วน `CHANGELOG.md`
   ที่ตรงกันครบถ้วน รีลีส stable ที่เผยแพร่ไปยัง npm `latest` จะกลายเป็น
   GitHub latest release; รีลีสบำรุงรักษา stable ที่คงไว้บน npm `beta` จะถูกสร้าง
   ด้วย GitHub `latest=false`
   การเผยแพร่ ClawHub อาจยังทำงานอยู่ขณะที่ OpenClaw npm เผยแพร่ แต่ workflow
   release publish จะพิมพ์ child run IDs ทันที ตามค่าเริ่มต้น workflow นี้
   จะไม่รอ ClawHub หลังจาก dispatch แล้ว ดังนั้นความพร้อมใช้งานของ OpenClaw npm
   จะไม่ถูกบล็อกโดยการอนุมัติของ ClawHub หรือการทำงานกับ registry ที่ช้ากว่า; ตั้งค่า
   `wait_for_clawhub=true` เมื่อ ClawHub ต้องบล็อกการจบ workflow เส้นทาง
   ClawHub จะ retry ความล้มเหลวชั่วคราวของการติดตั้ง dependency ของ CLI, เผยแพร่
   Plugin ที่ผ่าน preview แม้เมื่อ preview cell หนึ่งเกิดปัญหาไม่เสถียร และจบด้วย
   การตรวจสอบ registry สำหรับเวอร์ชัน Plugin ที่คาดไว้ทุกตัวเพื่อให้การเผยแพร่บางส่วน
   ยังคงมองเห็นได้และ retry ได้ หลังเผยแพร่ ให้รัน
   `pnpm release:verify-beta -- YYYY.M.D-beta.N --openclaw-npm-run <run-id> --plugin-npm-run <run-id> --plugin-clawhub-run <run-id>`
   เพื่อตรวจสอบ GitHub prerelease, dist-tags ของ npm `beta`, integrity ของ npm,
   เส้นทางติดตั้งที่เผยแพร่แล้ว, เวอร์ชันที่ตรงกันของ ClawHub, artifacts ของ ClawHub และ
   ผลลัพธ์ของ child workflow จากคำสั่งเดียว เพิ่ม `--rerun-failed-clawhub` เมื่อ
   sidecar ของ ClawHub ล้มเหลวเฉพาะในงานที่ retry ได้และควรถูกรันใหม่ในที่เดิม
   จากนั้นรัน package acceptance หลังเผยแพร่กับแพ็กเกจ
   `openclaw@YYYY.M.D-beta.N` หรือ
   `openclaw@beta` ที่เผยแพร่แล้ว หาก prerelease ที่ถูก push หรือเผยแพร่แล้วต้องมีการแก้ไข
   ให้ตัดหมายเลข prerelease ที่ตรงกันถัดไป; อย่าลบหรือเขียน prerelease เดิมใหม่
10. สำหรับ stable ให้ดำเนินต่อเฉพาะหลังจาก beta หรือ release candidate ที่ตรวจสอบแล้วมี
    หลักฐานการตรวจสอบตามที่กำหนด การเผยแพร่ stable npm ก็ผ่าน
    `OpenClaw Release Publish` เช่นกัน โดยใช้ artifact preflight ที่สำเร็จแล้วผ่าน
    `preflight_run_id`; ความพร้อมของรีลีส macOS stable ยังต้องมี
    `.zip`, `.dmg`, `.dSYM.zip` ที่แพ็กแล้ว และ `appcast.xml` ที่อัปเดตบน `main`
    workflow เผยแพร่ macOS ส่วนตัวจะเผยแพร่ appcast ที่ลงนามแล้วไปยัง
    `main` สาธารณะโดยอัตโนมัติหลังจาก assets รีลีสผ่านการตรวจสอบ; หาก branch protection บล็อก
    การ push โดยตรง workflow จะเปิดหรืออัปเดต PR ของ appcast
11. หลังเผยแพร่ ให้รันตัวตรวจสอบหลังเผยแพร่ของ npm, E2E ของ Telegram แบบ standalone
    published-npm ที่เป็นทางเลือกเมื่อคุณต้องการหลักฐานช่องทางหลังเผยแพร่,
    การโปรโมต dist-tag เมื่อจำเป็น, ตรวจสอบหน้า GitHub release ที่สร้างขึ้น,
    และรันขั้นตอนประกาศรีลีส

## Release preflight

- รัน `pnpm check:test-types` ก่อน release preflight เพื่อให้ TypeScript ของการทดสอบยังถูก
  ครอบคลุมอยู่นอก gate `pnpm check` ในเครื่องที่เร็วกว่า
- รัน `pnpm check:architecture` ก่อน release preflight เพื่อให้การตรวจสอบวงจร import
  และขอบเขตสถาปัตยกรรมที่กว้างกว่านั้นเป็นสีเขียวอยู่นอก gate ในเครื่องที่เร็วกว่า
- รัน `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้ artifact รีลีส
  `dist/*` ที่คาดไว้และบันเดิล Control UI มีอยู่สำหรับขั้นตอนตรวจสอบความถูกต้องของแพ็ก
- รัน `pnpm release:prep` หลังจาก bump เวอร์ชัน root และก่อนติดแท็ก ซึ่งจะรัน
  generator รีลีสแบบ deterministic ทุกตัวที่มัก drift หลังจากการเปลี่ยนเวอร์ชัน/config/API:
  เวอร์ชัน plugin, inventory ของ plugin, schema config พื้นฐาน, metadata config ของช่องทางที่บันเดิล,
  baseline เอกสาร config, export ของ plugin SDK และ baseline API ของ plugin SDK
  `pnpm release:check` จะรัน guard เหล่านั้นซ้ำในโหมดตรวจสอบ และรายงานความล้มเหลวจาก
  generated drift ทั้งหมดที่พบในรอบเดียว ก่อนรันการตรวจสอบรีลีสแพ็กเกจ
- รัน workflow แบบ manual `Full Release Validation` ก่อนการอนุมัติรีลีสเพื่อเริ่ม test box
  ก่อนรีลีสทั้งหมดจาก entrypoint เดียว รับ branch, tag หรือ SHA commit เต็ม,
  dispatch `CI` แบบ manual และ dispatch `OpenClaw Release Checks` สำหรับ install smoke,
  package acceptance, การตรวจสอบแพ็กเกจข้าม OS, QA Lab parity, Matrix และ Telegram lanes
  การรัน stable/default จะเก็บ live/E2E แบบครบถ้วนและ Docker release-path soak ไว้หลัง
  `run_release_soak=true`; `release_profile=full` จะบังคับเปิด soak เมื่อใช้
  `release_profile=full` และ `rerun_group=all` จะรัน package Telegram E2E กับ artifact
  `release-package-under-test` จาก release checks ด้วย ระบุ `release_package_spec`
  หลังจากเผยแพร่ beta เพื่อใช้แพ็กเกจ npm ที่เผยแพร่แล้วซ้ำใน release checks,
  Package Acceptance และ package Telegram E2E โดยไม่ต้องสร้าง release tarball ใหม่ ระบุ
  `npm_telegram_package_spec` เฉพาะเมื่อ Telegram ควรใช้แพ็กเกจที่เผยแพร่คนละตัวกับส่วนที่เหลือ
  ของการตรวจสอบรีลีส ระบุ `package_acceptance_package_spec` เมื่อ Package Acceptance ควรใช้
  แพ็กเกจที่เผยแพร่คนละตัวกับ release package spec ระบุ `evidence_package_spec`
  เมื่อรายงานหลักฐานส่วนตัวควรพิสูจน์ว่าการตรวจสอบตรงกับแพ็กเกจ npm ที่เผยแพร่แล้ว
  โดยไม่บังคับ Telegram E2E
  ตัวอย่าง:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- รัน workflow แบบ manual `Package Acceptance` เมื่อคุณต้องการหลักฐาน side-channel
  สำหรับ package candidate ขณะที่งานรีลีสดำเนินต่อ ใช้ `source=npm` สำหรับ
  `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรีลีสแบบเจาะจง; ใช้ `source=ref`
  เพื่อแพ็ก branch/tag/SHA `package_ref` ที่เชื่อถือได้ด้วย harness `workflow_ref`
  ปัจจุบัน; ใช้ `source=url` สำหรับ HTTPS tarball พร้อม SHA-256 ที่จำเป็น; หรือ
  `source=artifact` สำหรับ tarball ที่อัปโหลดโดย GitHub Actions run อื่น workflow
  จะแก้ candidate เป็น `package-under-test`, ใช้ Docker E2E release scheduler ซ้ำกับ
  tarball นั้น และสามารถรัน Telegram QA กับ tarball เดียวกันด้วย
  `telegram_mode=mock-openai` หรือ `telegram_mode=live-frontier` เมื่อ Docker lanes
  ที่เลือกมี `published-upgrade-survivor` artifact แพ็กเกจคือ candidate และ
  `published_upgrade_survivor_baseline` จะเลือก baseline ที่เผยแพร่แล้ว
  `update-restart-auth` ใช้แพ็กเกจ candidate เป็นทั้ง CLI ที่ติดตั้งและ package-under-test
  เพื่อทดสอบเส้นทาง managed restart ของคำสั่ง update ของ candidate
  ตัวอย่าง: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  โปรไฟล์ทั่วไป:
  - `smoke`: lane สำหรับ install/channel/agent, เครือข่าย Gateway และ reload config
  - `package`: lane package/update/restart/plugin แบบ artifact-native ที่ไม่มี OpenWebUI หรือ ClawHub แบบ live
  - `product`: โปรไฟล์ package พร้อมช่องทาง MCP, การล้าง cron/subagent,
    การค้นหาเว็บ OpenAI และ OpenWebUI
  - `full`: ชิ้นส่วน Docker release-path พร้อม OpenWebUI
  - `custom`: การเลือก `docker_lanes` แบบเจาะจงสำหรับการ rerun ที่โฟกัส
- รัน workflow แบบ manual `CI` โดยตรงเมื่อคุณต้องการเฉพาะ coverage CI ปกติแบบเต็ม
  สำหรับ release candidate การ dispatch CI แบบ manual จะข้าม changed scoping
  และบังคับ Linux Node shards, bundled-plugin shards, channel contracts,
  ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke,
  การตรวจสอบ docs, Python skills, Windows, macOS, Android และ Control UI i18n
  lanes
  ตัวอย่าง: `gh workflow run ci.yml --ref release/YYYY.M.D`
- รัน `pnpm qa:otel:smoke` เมื่อตรวจสอบ telemetry ของรีลีส โดยจะทดสอบ
  QA-lab ผ่าน receiver OTLP/HTTP ในเครื่อง และตรวจสอบชื่อ span ของ trace ที่ export,
  attribute ที่มีขอบเขต และการ redact content/identifier โดยไม่ต้องใช้ Opik, Langfuse
  หรือ collector ภายนอกอื่น
- รัน `pnpm release:check` ก่อนทุกรีลีสที่ติดแท็ก
- รัน `OpenClaw Release Publish` สำหรับลำดับการเผยแพร่ที่เปลี่ยนสถานะหลังจากมีแท็กแล้ว
  Dispatch จาก `release/YYYY.M.D` (หรือ `main` เมื่อเผยแพร่แท็กที่ main เข้าถึงได้),
  ส่ง release tag และ `preflight_run_id` ของ OpenClaw npm ที่สำเร็จ และคง scope การเผยแพร่
  plugin ค่าเริ่มต้น `all-publishable` ไว้ เว้นแต่คุณตั้งใจรันการซ่อมแบบโฟกัส workflow
  จะ serialize การเผยแพร่ plugin npm, การเผยแพร่ plugin ClawHub และการเผยแพร่ OpenClaw
  npm เพื่อไม่ให้ core package ถูกเผยแพร่ก่อน plugin ที่ externalized
- Release checks ตอนนี้รันใน workflow แบบ manual แยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรัน QA Lab mock parity lane พร้อมโปรไฟล์ Matrix แบบ live
  ที่รวดเร็วและ Telegram QA lane ก่อนการอนุมัติรีลีส lane แบบ live ใช้ environment
  `qa-live-shared`; Telegram ยังใช้ Convex CI credential leases ด้วย รัน workflow
  แบบ manual `QA-Lab - All Lanes` พร้อม `matrix_profile=all` และ `matrix_shards=true`
  เมื่อคุณต้องการ inventory transport, media และ E2EE ของ Matrix แบบเต็มขนานกัน
- การตรวจสอบ runtime การติดตั้งและ upgrade ข้าม OS เป็นส่วนหนึ่งของ
  `OpenClaw Release Checks` และ `Full Release Validation` แบบ public ซึ่งเรียก reusable
  workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` โดยตรง
- การแยกนี้ตั้งใจทำไว้: รักษาเส้นทางรีลีส npm จริงให้สั้น deterministic และเน้น artifact
  ขณะที่การตรวจสอบ live ที่ช้ากว่าอยู่ใน lane ของตัวเอง เพื่อไม่ให้หน่วงหรือบล็อกการเผยแพร่
- Release checks ที่มีความลับควรถูก dispatch ผ่าน `Full Release
Validation` หรือจาก workflow ref `main`/release เพื่อให้ logic ของ workflow และ
  secret อยู่ภายใต้การควบคุม
- `OpenClaw Release Checks` รับ branch, tag หรือ SHA commit เต็ม ตราบใดที่ commit
  ที่ resolve ได้เข้าถึงได้จาก branch หรือ release tag ของ OpenClaw
- preflight แบบ validation-only ของ `OpenClaw NPM Release` ยังรับ SHA commit ของ
  workflow-branch ปัจจุบันแบบเต็ม 40 อักขระได้โดยไม่ต้องมีแท็กที่ push แล้ว
- เส้นทาง SHA นั้นเป็น validation-only และไม่สามารถ promote เป็นการเผยแพร่จริงได้
- ในโหมด SHA workflow จะสังเคราะห์ `v<package.json version>` เฉพาะสำหรับการตรวจสอบ
  metadata ของแพ็กเกจเท่านั้น; การเผยแพร่จริงยังต้องใช้ release tag จริง
- ทั้งสอง workflow คงเส้นทางเผยแพร่และ promotion จริงไว้บน runner ที่ GitHub-hosted
  ขณะที่เส้นทางตรวจสอบที่ไม่เปลี่ยนสถานะสามารถใช้ runner Linux ของ Blacksmith ที่ใหญ่กว่าได้
- workflow นั้นรัน
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ทั้ง workflow secrets `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- npm release preflight ไม่รอ lane release checks แยกต่างหากอีกต่อไป
- ก่อนติดแท็ก release candidate ในเครื่อง ให้รัน
  `RELEASE_TAG=vYYYY.M.D-beta.N pnpm release:fast-pretag-check` helper จะรัน
  guardrail รีลีสแบบเร็ว, การตรวจสอบรีลีส plugin npm/ClawHub, build,
  UI build และ `release:openclaw:npm:check` ตามลำดับที่จับข้อผิดพลาดทั่วไป
  ซึ่งบล็อกการอนุมัติได้ก่อน workflow เผยแพร่ของ GitHub เริ่มทำงาน
- รัน `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือแท็ก beta/correction ที่ตรงกัน) ก่อนการอนุมัติ
- หลังเผยแพร่ npm ให้รัน
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (หรือเวอร์ชัน beta/correction ที่ตรงกัน) เพื่อตรวจสอบเส้นทางติดตั้ง registry
  ที่เผยแพร่แล้วใน temp prefix ใหม่
- หลังเผยแพร่ beta ให้รัน `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  เพื่อตรวจสอบ onboarding ของแพ็กเกจที่ติดตั้ง, การตั้งค่า Telegram และ Telegram E2E
  จริงกับแพ็กเกจ npm ที่เผยแพร่แล้ว โดยใช้ credential pool ของ Telegram แบบ leased
  ที่ใช้ร่วมกัน การรันครั้งเดียวในเครื่องของ maintainer อาจละ Convex vars และส่ง env credentials
  `OPENCLAW_QA_TELEGRAM_*` ทั้งสามตัวโดยตรง
- หากต้องการรัน post-publish beta smoke แบบเต็มจากเครื่อง maintainer ให้ใช้ `pnpm release:beta-smoke -- --beta betaN`
  helper จะรันการตรวจสอบ Parallels npm update/fresh-target, dispatch `NPM Telegram Beta E2E`,
  poll workflow run ที่เจาะจง, ดาวน์โหลด artifact และพิมพ์รายงาน Telegram
- Maintainer สามารถรัน post-publish check เดียวกันจาก GitHub Actions ผ่าน workflow
  แบบ manual `NPM Telegram Beta E2E` ได้ โดยตั้งใจให้เป็น manual-only และไม่รันทุก merge
- automation รีลีสของ maintainer ตอนนี้ใช้ preflight-then-promote:
  - การเผยแพร่ npm จริงต้องผ่าน `preflight_run_id` ของ npm ที่สำเร็จ
  - การเผยแพร่ npm จริงต้องถูก dispatch จาก branch `main` หรือ
    `release/YYYY.M.D` เดียวกันกับ preflight run ที่สำเร็จ
  - รีลีส npm แบบ stable ตั้งค่าเริ่มต้นเป็น `beta`
  - การเผยแพร่ npm แบบ stable สามารถ target `latest` ได้อย่างชัดเจนผ่าน workflow input
  - การเปลี่ยน npm dist-tag แบบใช้ token ตอนนี้อยู่ใน
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    เพื่อความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่ repo public
    คงการเผยแพร่แบบ OIDC-only ไว้
  - `macOS Release` แบบ public เป็น validation-only; เมื่อแท็กอยู่เฉพาะบน
    release branch แต่ workflow ถูก dispatch จาก `main` ให้ตั้ง
    `public_release_branch=release/YYYY.M.D`
  - การเผยแพร่ mac แบบ private จริงต้องผ่าน `preflight_run_id` และ `validate_run_id`
    ของ private mac ที่สำเร็จ
  - เส้นทางเผยแพร่จริงจะ promote artifact ที่เตรียมไว้แทนการ build ใหม่อีกครั้ง
- สำหรับรีลีส correction แบบ stable เช่น `YYYY.M.D-N` verifier หลังเผยแพร่
  ยังตรวจสอบเส้นทาง upgrade temp-prefix เดียวกันจาก `YYYY.M.D` ไปเป็น `YYYY.M.D-N`
  เพื่อไม่ให้ release correction ปล่อยให้การติดตั้ง global เก่าค้างอยู่บน payload
  stable พื้นฐานโดยไม่มีสัญญาณ
- npm release preflight จะ fail closed เว้นแต่ tarball จะมีทั้ง
  `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่าง
  เพื่อไม่ให้เราส่ง dashboard บนเบราว์เซอร์ที่ว่างเปล่าอีก
- การตรวจสอบหลังเผยแพร่ยังตรวจสอบว่า entrypoint ของ plugin ที่เผยแพร่และ
  metadata ของแพ็กเกจมีอยู่ใน layout registry ที่ติดตั้งแล้ว รีลีสที่ส่ง payload runtime
  ของ plugin หายไปจะ fail postpublish verifier และไม่สามารถ promote เป็น `latest` ได้
- `pnpm test:install:smoke` ยังบังคับใช้งบประมาณ `unpackedSize` ของ npm pack บน
  tarball update candidate ด้วย เพื่อให้ installer e2e จับ pack bloat ที่ไม่ได้ตั้งใจ
  ก่อนเส้นทาง release publish
- หากงานรีลีสแตะ CI planning, manifest timing ของ extension หรือ matrix การทดสอบ
  extension ให้ regenerate และ review matrix outputs `plugin-prerelease-extension-shard`
  ที่ planner เป็นเจ้าของจาก `.github/workflows/plugin-prerelease.yml` ก่อนการอนุมัติ
  เพื่อไม่ให้ release notes อธิบาย layout CI ที่เก่า
- ความพร้อมของรีลีส macOS แบบ stable ยังรวม surface ของ updater ด้วย:
  - GitHub release ต้องลงท้ายด้วย `.zip`, `.dmg` และ `.dSYM.zip` ที่แพ็กแล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปยัง zip stable ใหม่หลังเผยแพร่;
    workflow เผยแพร่ macOS แบบ private จะ commit ให้โดยอัตโนมัติ หรือเปิด appcast
    PR เมื่อ direct push ถูกบล็อก
  - แอปที่แพ็กแล้วต้องคง bundle id ที่ไม่ใช่ debug, Sparkle feed
    URL ที่ไม่ว่าง และ `CFBundleVersion` ที่เท่ากับหรือสูงกว่า canonical Sparkle build floor
    สำหรับเวอร์ชันรีลีสนั้น

## กล่องทดสอบรีลีส

`Full Release Validation` คือวิธีที่ผู้ปฏิบัติงานใช้เริ่มการทดสอบก่อนรีลีสทั้งหมดจาก
จุดเข้าเดียว สำหรับหลักฐานคอมมิตที่ปักหมุดบนแบรนช์ที่เคลื่อนไหวเร็ว ให้ใช้
ตัวช่วยเพื่อให้เวิร์กโฟลว์ลูกทุกตัวรันจากแบรนช์ชั่วคราวที่ตรึงไว้กับ SHA เป้าหมาย:

```bash
pnpm ci:full-release --sha <full-sha>
```

ตัวช่วยจะพุช `release-ci/<sha>-...`, เรียกใช้ `Full Release Validation`
จากแบรนช์นั้นด้วย `ref=<sha>`, ตรวจสอบว่า `headSha` ของเวิร์กโฟลว์ลูกทุกตัว
ตรงกับเป้าหมาย แล้วลบแบรนช์ชั่วคราว วิธีนี้ช่วยหลีกเลี่ยงการพิสูจน์รันลูกของ
`main` ที่ใหม่กว่าโดยไม่ตั้งใจ

สำหรับการตรวจสอบแบรนช์หรือแท็กรีลีส ให้รันจาก ref เวิร์กโฟลว์ `main` ที่เชื่อถือได้
และส่งแบรนช์หรือแท็กรีลีสเป็น `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

เวิร์กโฟลว์จะแก้ ref เป้าหมาย, เรียกใช้ `CI` แบบแมนนวลด้วย
`target_ref=<release-ref>`, เรียกใช้ `OpenClaw Release Checks`, เตรียม
อาร์ติแฟกต์แม่ `release-package-under-test` สำหรับการตรวจสอบฝั่งแพ็กเกจ และ
เรียกใช้แพ็กเกจ Telegram E2E แบบสแตนด์อโลนเมื่อ `release_profile=full` พร้อม
`rerun_group=all` หรือเมื่อมีการตั้งค่า `release_package_spec` หรือ
`npm_telegram_package_spec` จากนั้น `OpenClaw Release Checks` จะกระจายไปยัง
install smoke, การตรวจสอบรีลีสข้ามระบบปฏิบัติการ, ความครอบคลุม live/E2E Docker
ตามเส้นทางรีลีสเมื่อเปิดใช้ soak, Package Acceptance พร้อม Telegram package QA,
ความเท่าเทียมของ QA Lab, live Matrix และ live Telegram รันแบบเต็มจะยอมรับได้
ก็ต่อเมื่อสรุป `Full Release Validation` แสดงว่า `normal_ci` และ
`release_checks` สำเร็จ ในโหมด full/all ลูก `npm_telegram` ต้องสำเร็จด้วย;
นอกเหนือจาก full/all จะถูกข้าม เว้นแต่มีการให้ `release_package_spec` หรือ
`npm_telegram_package_spec` ที่เผยแพร่แล้ว สรุปตัวตรวจสอบสุดท้ายมีตารางงานที่ช้าที่สุด
สำหรับรันลูกแต่ละตัว เพื่อให้ผู้จัดการรีลีสเห็นเส้นทางวิกฤตปัจจุบันโดยไม่ต้องดาวน์โหลดล็อก
ดู [การตรวจสอบรีลีสเต็มรูปแบบ](/th/reference/full-release-validation) สำหรับ
เมทริกซ์สเตจครบถ้วน ชื่องานเวิร์กโฟลว์ที่แน่นอน ความแตกต่างระหว่างโปรไฟล์ stable
กับ full อาร์ติแฟกต์ และแฮนเดิลสำหรับรันซ้ำแบบเจาะจง
เวิร์กโฟลว์ลูกจะถูกเรียกใช้จาก ref ที่เชื่อถือได้ซึ่งรัน `Full Release
Validation` โดยปกติคือ `--ref main` แม้ว่า `ref` เป้าหมายจะชี้ไปยังแบรนช์หรือแท็กรีลีส
ที่เก่ากว่า ไม่มีอินพุต workflow-ref แยกต่างหากสำหรับ Full Release Validation;
ให้เลือก harness ที่เชื่อถือได้โดยเลือก ref ของเวิร์กโฟลว์รัน
อย่าใช้ `--ref main -f ref=<sha>` สำหรับหลักฐานคอมมิตที่แน่นอนบน `main` ที่เคลื่อนไหวอยู่;
SHA คอมมิตดิบไม่สามารถเป็น workflow dispatch ref ได้ ดังนั้นให้ใช้
`pnpm ci:full-release --sha <sha>` เพื่อสร้างแบรนช์ชั่วคราวที่ปักหมุดไว้

ใช้ `release_profile` เพื่อเลือกขอบเขต live/provider:

- `minimum`: เส้นทาง OpenAI/core live และ Docker ที่สำคัญต่อรีลีสและเร็วที่สุด
- `stable`: minimum พร้อมความครอบคลุม provider/backend ที่เสถียรสำหรับการอนุมัติรีลีส
- `full`: stable พร้อมความครอบคลุม provider/media เชิงคำแนะนำที่กว้างขึ้น

ใช้ `run_release_soak=true` กับ `stable` เมื่อเลนที่บล็อกรีลีสเป็นสีเขียว
และคุณต้องการ live/E2E แบบละเอียด, เส้นทางรีลีส Docker และ
การกวาดตรวจ upgrade-survivor ที่เผยแพร่แล้วแบบมีขอบเขต ก่อนโปรโมต การกวาดนี้ครอบคลุม
แพ็กเกจ stable ล่าสุดสี่รายการ พร้อม baseline ที่ปักหมุด `2026.4.23` และ `2026.5.2`
รวมถึงความครอบคลุม `2026.4.15` ที่เก่ากว่า โดยลบ baseline ที่ซ้ำกันออกและ
แยกแต่ละ baseline เป็นงาน Docker runner ของตัวเอง `full` หมายถึง
`run_release_soak=true`

`OpenClaw Release Checks` ใช้ ref เวิร์กโฟลว์ที่เชื่อถือได้เพื่อแก้ ref เป้าหมาย
ครั้งเดียวเป็น `release-package-under-test` และใช้อาร์ติแฟกต์นั้นซ้ำใน
การตรวจสอบข้ามระบบปฏิบัติการ, Package Acceptance และ release-path Docker เมื่อ soak ทำงาน
วิธีนี้ทำให้กล่องฝั่งแพ็กเกจทั้งหมดอยู่บนไบต์ชุดเดียวกัน และหลีกเลี่ยงการสร้างแพ็กเกจซ้ำ
หลังจาก beta อยู่บน npm แล้ว ให้ตั้งค่า `release_package_spec=openclaw@YYYY.M.D-beta.N`
เพื่อให้ release checks ดาวน์โหลดแพ็กเกจที่จัดส่งแล้วครั้งเดียว ดึง SHA ของแหล่งบิลด์จาก
`dist/build-info.json` และใช้อาร์ติแฟกต์นั้นซ้ำสำหรับเลนข้ามระบบปฏิบัติการ,
Package Acceptance, release-path Docker และ package Telegram
OpenAI install smoke ข้ามระบบปฏิบัติการใช้ `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อมีการตั้งค่า
ตัวแปร repo/org มิฉะนั้นจะใช้ `openai/gpt-5.4` เพราะเลนนี้กำลังพิสูจน์
การติดตั้งแพ็กเกจ onboarding การเริ่ม Gateway และ agent turn แบบ live หนึ่งครั้ง
แทนที่จะ benchmark โมเดลค่าเริ่มต้นที่ช้าที่สุด เมทริกซ์ live provider ที่กว้างกว่า
ยังคงเป็นที่สำหรับความครอบคลุมเฉพาะโมเดล

ใช้ตัวแปรเหล่านี้ตามสเตจรีลีส:

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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

อย่าใช้ umbrella แบบเต็มเป็นการรันซ้ำครั้งแรกหลังจากแก้ไขแบบเจาะจง หากกล่องหนึ่งล้มเหลว
ให้ใช้เวิร์กโฟลว์ลูก งาน เลน Docker โปรไฟล์แพ็กเกจ provider โมเดล หรือเลน QA
ที่ล้มเหลวสำหรับหลักฐานถัดไป รัน umbrella แบบเต็มอีกครั้งเฉพาะเมื่อการแก้ไขเปลี่ยน
การประสานงานรีลีสร่วมกัน หรือทำให้หลักฐานทุกกล่องก่อนหน้าล้าสมัย ตัวตรวจสอบสุดท้ายของ
umbrella จะตรวจสอบ id รันเวิร์กโฟลว์ลูกที่บันทึกไว้อีกครั้ง ดังนั้นหลังจากเวิร์กโฟลว์ลูก
ถูกรันซ้ำสำเร็จแล้ว ให้รันซ้ำเฉพาะงานแม่ `Verify full validation` ที่ล้มเหลว

สำหรับการกู้คืนแบบมีขอบเขต ให้ส่ง `rerun_group` ไปยัง umbrella `all` คือรันจริงของ
release-candidate, `ci` รันเฉพาะลูก CI ปกติ, `plugin-prerelease`
รันเฉพาะลูก Plugin เฉพาะรีลีส, `release-checks` รันกล่องรีลีสทุกตัว และกลุ่มรีลีสที่แคบกว่า
คือ `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`,
`qa-live` และ `npm-telegram`
การรันซ้ำ `npm-telegram` แบบเจาะจงต้องใช้ `release_package_spec` หรือ
`npm_telegram_package_spec`; รัน full/all พร้อม `release_profile=full` ใช้
อาร์ติแฟกต์แพ็กเกจ release-checks การรันซ้ำข้ามระบบปฏิบัติการแบบเจาะจง
สามารถเพิ่ม `cross_os_suite_filter=windows/packaged-upgrade` หรือ
ตัวกรอง OS/suite อื่นได้ ความล้มเหลวของ release-checks ฝั่ง QA เป็นเชิงคำแนะนำ;
ความล้มเหลวเฉพาะ QA ไม่บล็อกการตรวจสอบรีลีส

### Vitest

กล่อง Vitest คือเวิร์กโฟลว์ลูก `CI` แบบแมนนวล Manual CI ตั้งใจ
ข้ามการกำหนดขอบเขตตามการเปลี่ยนแปลง และบังคับกราฟทดสอบปกติสำหรับ
release candidate: Linux Node shards, bundled-plugin shards, channel contracts, ความเข้ากันได้กับ Node 22,
`check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android และ Control UI i18n

ใช้กล่องนี้เพื่อตอบว่า "ซอร์สทรีผ่านชุดทดสอบปกติเต็มรูปแบบหรือไม่?"
กล่องนี้ไม่เหมือนกับการตรวจสอบผลิตภัณฑ์ตามเส้นทางรีลีส หลักฐานที่ควรเก็บ:

- สรุป `Full Release Validation` ที่แสดง URL รัน `CI` ที่ถูกเรียกใช้
- รัน `CI` เป็นสีเขียวบน SHA เป้าหมายที่แน่นอน
- ชื่อ shard ที่ล้มเหลวหรือช้า จากงาน CI เมื่อสืบสวน regression
- อาร์ติแฟกต์ timing ของ Vitest เช่น `.artifacts/vitest-shard-timings.json` เมื่อ
  รันต้องการการวิเคราะห์ประสิทธิภาพ

รัน manual CI โดยตรงเฉพาะเมื่อรีลีสต้องการ CI ปกติแบบกำหนดได้แน่นอน แต่ไม่ต้องการ
กล่อง Docker, QA Lab, live, ข้ามระบบปฏิบัติการ หรือแพ็กเกจ:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

กล่อง Docker อยู่ใน `OpenClaw Release Checks` ผ่าน
`openclaw-live-and-e2e-checks-reusable.yml` พร้อมเวิร์กโฟลว์ `install-smoke`
โหมดรีลีส กล่องนี้ตรวจสอบ release candidate ผ่านสภาพแวดล้อม Docker แบบแพ็กเกจ
แทนที่จะใช้เฉพาะการทดสอบระดับซอร์ส

ความครอบคลุม Docker สำหรับรีลีสประกอบด้วย:

- install smoke เต็มรูปแบบที่เปิดใช้ slow Bun global install smoke
- การเตรียม/ใช้ซ้ำอิมเมจ root Dockerfile smoke ตาม SHA เป้าหมาย โดยมีงาน QR,
  root/gateway และ installer/Bun smoke รันเป็น install-smoke shard แยกกัน
- เลน repository E2E
- ชังก์ release-path Docker: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` และ `plugins-runtime-install-h`
- ความครอบคลุม OpenWebUI ภายในชังก์ `plugins-runtime-services` เมื่อมีการร้องขอ
- เลนติดตั้ง/ถอนการติดตั้ง bundled Plugin ที่แยกไว้
  `bundled-plugin-install-uninstall-0` ถึง
  `bundled-plugin-install-uninstall-23`
- ชุด provider live/E2E และความครอบคลุมโมเดล live ของ Docker เมื่อ release checks
  รวมชุด live

ใช้อาร์ติแฟกต์ Docker ก่อนรันซ้ำ ตัวกำหนดตาราง release-path จะอัปโหลด
`.artifacts/docker-tests/` พร้อมล็อกเลน, `summary.json`, `failures.json`,
phase timings, JSON แผน scheduler และคำสั่งรันซ้ำ สำหรับการกู้คืนแบบเจาะจง
ให้ใช้ `docker_lanes=<lane[,lane]>` บนเวิร์กโฟลว์ live/E2E แบบ reusable แทนการรัน
ชังก์รีลีสทั้งหมดซ้ำ คำสั่งรันซ้ำที่สร้างขึ้นมี `package_artifact_run_id`
ก่อนหน้าและอินพุตอิมเมจ Docker ที่เตรียมไว้เมื่อมีให้ใช้ ดังนั้นเลนที่ล้มเหลว
สามารถใช้ tarball และอิมเมจ GHCR ชุดเดิมซ้ำได้

### QA Lab

กล่อง QA Lab เป็นส่วนหนึ่งของ `OpenClaw Release Checks` เช่นกัน กล่องนี้เป็นเกต
พฤติกรรมเชิง agentic และระดับช่องทางสำหรับรีลีส แยกจากกลไกแพ็กเกจของ Vitest และ Docker

ความครอบคลุม QA Lab สำหรับรีลีสประกอบด้วย:

- เลน mock parity ที่เปรียบเทียบเลน candidate ของ OpenAI กับ baseline Opus 4.6
  โดยใช้ agentic parity pack
- โปรไฟล์ fast live Matrix QA ที่ใช้สภาพแวดล้อม `qa-live-shared`
- เลน live Telegram QA ที่ใช้การเช่าข้อมูลรับรอง Convex CI
- `pnpm qa:otel:smoke` เมื่อ telemetry ของรีลีสต้องการหลักฐาน local ที่ชัดเจน

ใช้กล่องนี้เพื่อตอบว่า "รีลีสทำงานถูกต้องในสถานการณ์ QA และโฟลว์ช่องทาง live หรือไม่?"
เก็บ URL อาร์ติแฟกต์สำหรับเลน parity, Matrix และ Telegram เมื่ออนุมัติรีลีส
ความครอบคลุม Matrix เต็มรูปแบบยังคงมีให้ใช้งานเป็นรัน QA-Lab แบบ sharded แมนนวล
แทนที่จะเป็นเลนค่าเริ่มต้นที่สำคัญต่อรีลีส

### แพ็กเกจ

กล่องแพ็กเกจคือเกตของผลิตภัณฑ์ที่ติดตั้งได้ กล่องนี้รองรับโดย
`Package Acceptance` และ resolver
`scripts/resolve-openclaw-package-candidate.mjs` resolver จะ normalize
candidate ให้เป็น tarball `package-under-test` ที่ Docker E2E ใช้ ตรวจสอบ
inventory ของแพ็กเกจ บันทึกเวอร์ชันแพ็กเกจและ SHA-256 และแยก ref ของ workflow harness
ออกจาก ref ของซอร์สแพ็กเกจ

แหล่ง candidate ที่รองรับ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรีลีส OpenClaw ที่แน่นอน
- `source=ref`: pack แบรนช์ แท็ก หรือ SHA คอมมิตเต็มของ `package_ref` ที่เชื่อถือได้
  ด้วย harness `workflow_ref` ที่เลือก
- `source=url`: ดาวน์โหลด HTTPS `.tgz` พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: ใช้ `.tgz` ที่อัปโหลดโดยรัน GitHub Actions อื่นซ้ำ

`OpenClaw Release Checks` เรียกใช้การยอมรับแพ็กเกจด้วย `source=artifact`, อาร์ติแฟกต์แพ็กเกจรีลีสที่เตรียมไว้, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`, `telegram_mode=mock-openai` การยอมรับแพ็กเกจจะเก็บการย้ายข้อมูล, การอัปเดต, การรีสตาร์ตหลังอัปเดตพร้อมการยืนยันตัวตนที่กำหนดค่าไว้, การติดตั้ง Skills จาก ClawHub แบบสด, การล้างการพึ่งพาของ Plugin ที่ล้าสมัย, ฟิกซ์เจอร์ Plugin แบบออฟไลน์, การอัปเดต Plugin และ QA แพ็กเกจ Telegram เทียบกับ tarball ที่ resolve แล้วเดียวกัน การตรวจรีลีสที่บล็อกการเผยแพร่จะใช้ baseline แพ็กเกจที่เผยแพร่ล่าสุดตามค่าเริ่มต้น; `run_release_soak=true` หรือ `release_profile=full` จะขยายเป็น baseline ที่เผยแพร่บน npm แบบเสถียรทุกตัวตั้งแต่ `2026.4.23` ถึง `latest` พร้อมฟิกซ์เจอร์ของปัญหาที่รายงาน ใช้การยอมรับแพ็กเกจกับ `source=npm` สำหรับตัวเลือกที่เผยแพร่ไปแล้ว หรือ `source=ref`/`source=artifact` สำหรับ tarball npm ภายในเครื่องที่อ้างอิงด้วย SHA ก่อนเผยแพร่ นี่คือทางเลือกแบบเนทีฟของ GitHub สำหรับความครอบคลุมส่วนใหญ่ของแพ็กเกจ/การอัปเดตที่ก่อนหน้านี้ต้องใช้ Parallels การตรวจรีลีสข้าม OS ยังมีความสำคัญสำหรับ onboarding, ตัวติดตั้ง และพฤติกรรมเฉพาะแพลตฟอร์ม แต่การตรวจสอบผลิตภัณฑ์ด้านแพ็กเกจ/การอัปเดตควรเลือกใช้การยอมรับแพ็กเกจ

เช็กลิสต์มาตรฐานสำหรับการตรวจสอบการอัปเดตและ Plugin คือ
[การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins) ใช้เช็กลิสต์นี้เมื่อตัดสินใจว่าเลนแบบ local, Docker, การยอมรับแพ็กเกจ หรือการตรวจรีลีสใดพิสูจน์การติดตั้ง/อัปเดต Plugin, การล้างข้อมูลด้วย doctor หรือการเปลี่ยนแปลงการย้ายข้อมูลแพ็กเกจที่เผยแพร่แล้ว การย้ายข้อมูลการอัปเดตที่เผยแพร่แล้วแบบครบถ้วนจากแพ็กเกจเสถียรทุกตัวตั้งแต่ `2026.4.23+` เป็นเวิร์กโฟลว์ `Update Migration` แบบแมนนวลแยกต่างหาก ไม่ใช่ส่วนหนึ่งของ Full Release CI

การผ่อนปรนเดิมของ package-acceptance ถูกจำกัดเวลาไว้โดยตั้งใจ แพ็กเกจจนถึง `2026.4.25` อาจใช้เส้นทางความเข้ากันได้สำหรับช่องว่างของเมทาดาทาที่เผยแพร่ไปยัง npm แล้ว: รายการอินเวนทอรี QA แบบส่วนตัวที่หายไปจาก tarball, ไม่มี `gateway install --wrapper`, ไม่มีไฟล์แพตช์ในฟิกซ์เจอร์ git ที่ได้จาก tarball, ไม่มี `update.channel` ที่คงอยู่, ตำแหน่งบันทึกการติดตั้ง Plugin แบบเดิม, ไม่มีการคงอยู่ของบันทึกการติดตั้งจาก marketplace และการย้ายข้อมูลเมทาดาทาคอนฟิกระหว่าง `plugins update` แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจแจ้งเตือนสำหรับไฟล์ตราประทับเมทาดาทาของบิลด์ภายในเครื่องที่เผยแพร่ไปแล้ว แพ็กเกจหลังจากนั้นต้องเป็นไปตามสัญญาแพ็กเกจสมัยใหม่ ช่องว่างเดียวกันเหล่านั้นจะทำให้การตรวจสอบรีลีสล้มเหลว

ใช้โปรไฟล์การยอมรับแพ็กเกจที่กว้างขึ้นเมื่อคำถามด้านรีลีสเกี่ยวกับแพ็กเกจที่ติดตั้งได้จริง:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

โปรไฟล์แพ็กเกจที่พบบ่อย:

- `smoke`: เลนติดตั้งแพ็กเกจ/ช่องทาง/เอเจนต์, เครือข่าย Gateway และโหลดคอนฟิกใหม่แบบรวดเร็ว
- `package`: สัญญาแพ็กเกจสำหรับการติดตั้ง/อัปเดต/รีสตาร์ต/Plugin พร้อมหลักฐานการติดตั้ง Skills จาก ClawHub แบบสด; นี่คือค่าเริ่มต้นของการตรวจรีลีส
- `product`: `package` พร้อมช่องทาง MCP, การล้าง cron/subagent, การค้นหาเว็บ OpenAI และ OpenWebUI
- `full`: ชังก์เส้นทางรีลีส Docker พร้อม OpenWebUI
- `custom`: รายการ `docker_lanes` ที่แน่นอนสำหรับการเรียกซ้ำแบบเจาะจง

สำหรับหลักฐาน Telegram ของตัวเลือกแพ็กเกจ ให้เปิดใช้ `telegram_mode=mock-openai` หรือ `telegram_mode=live-frontier` บนการยอมรับแพ็กเกจ เวิร์กโฟลว์จะส่ง tarball `package-under-test` ที่ resolve แล้วเข้าเลน Telegram; เวิร์กโฟลว์ Telegram แบบสแตนด์อโลนยังคงรับสเปก npm ที่เผยแพร่แล้วสำหรับการตรวจหลังเผยแพร่

## ระบบอัตโนมัติสำหรับการเผยแพร่รีลีส

`OpenClaw Release Publish` เป็น entrypoint การเผยแพร่แบบเปลี่ยนแปลงสถานะตามปกติ เวิร์กโฟลว์นี้จะประสานเวิร์กโฟลว์ trusted-publisher ตามลำดับที่รีลีสต้องการ:

1. เช็กเอาต์แท็กรีลีสและ resolve commit SHA ของแท็กนั้น
2. ตรวจสอบว่าแท็กเข้าถึงได้จาก `main` หรือ `release/*`
3. เรียกใช้ `pnpm plugins:sync:check`
4. Dispatch `Plugin NPM Release` ด้วย `publish_scope=all-publishable` และ `ref=<release-sha>`
5. Dispatch `Plugin ClawHub Release` ด้วย scope และ SHA เดียวกัน
6. Dispatch `OpenClaw NPM Release` ด้วยแท็กรีลีส, npm dist-tag และ `preflight_run_id` ที่บันทึกไว้

ตัวอย่างการเผยแพร่ Beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

การเผยแพร่เสถียรไปยัง beta dist-tag ค่าเริ่มต้น:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

การเลื่อนสถานะเสถียรโดยตรงไปยัง `latest` ต้องระบุชัดเจน:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

ใช้เวิร์กโฟลว์ระดับต่ำกว่า `Plugin NPM Release` และ `Plugin ClawHub Release` เฉพาะสำหรับงานซ่อมแซมหรือเผยแพร่ซ้ำแบบเจาะจงเท่านั้น สำหรับการซ่อมแซม Plugin ที่เลือก ให้ส่ง `plugin_publish_scope=selected` และ `plugins=@openclaw/name` ไปยัง `OpenClaw Release Publish` หรือ dispatch เวิร์กโฟลว์ลูกโดยตรงเมื่อไม่ควรเผยแพร่แพ็กเกจ OpenClaw

## อินพุตเวิร์กโฟลว์ NPM

`OpenClaw NPM Release` รับอินพุตที่ควบคุมโดยผู้ปฏิบัติงานเหล่านี้:

- `tag`: แท็กรีลีสที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1` หรือ `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` อาจเป็น commit SHA แบบเต็ม 40 อักขระปัจจุบันของสาขาเวิร์กโฟลว์สำหรับ preflight แบบตรวจสอบเท่านั้นได้ด้วย
- `preflight_only`: `true` สำหรับตรวจสอบ/บิลด์/แพ็กเกจเท่านั้น, `false` สำหรับเส้นทางเผยแพร่จริง
- `preflight_run_id`: จำเป็นบนเส้นทางเผยแพร่จริง เพื่อให้เวิร์กโฟลว์ใช้ tarball ที่เตรียมไว้จากการเรียกใช้ preflight ที่สำเร็จซ้ำ
- `npm_dist_tag`: แท็กเป้าหมาย npm สำหรับเส้นทางเผยแพร่; ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Publish` รับอินพุตที่ควบคุมโดยผู้ปฏิบัติงานเหล่านี้:

- `tag`: แท็กรีลีสที่จำเป็น; ต้องมีอยู่แล้ว
- `preflight_run_id`: run id ของ preflight `OpenClaw NPM Release` ที่สำเร็จ; จำเป็นเมื่อ `publish_openclaw_npm=true`
- `npm_dist_tag`: แท็กเป้าหมาย npm สำหรับแพ็กเกจ OpenClaw
- `plugin_publish_scope`: ค่าเริ่มต้นคือ `all-publishable`; ใช้ `selected` เฉพาะสำหรับงานซ่อมแซมแบบเจาะจง
- `plugins`: ชื่อแพ็กเกจ `@openclaw/*` คั่นด้วยจุลภาคเมื่อ `plugin_publish_scope=selected`
- `publish_openclaw_npm`: ค่าเริ่มต้นคือ `true`; ตั้งเป็น `false` เฉพาะเมื่อใช้เวิร์กโฟลว์เป็นตัวประสานการซ่อมแซมเฉพาะ Plugin
- `wait_for_clawhub`: ค่าเริ่มต้นคือ `false` เพื่อไม่ให้ความพร้อมใช้งานของ npm ถูกบล็อกโดย sidecar ของ ClawHub; ตั้งเป็น `true` เฉพาะเมื่อการเสร็จสิ้นของเวิร์กโฟลว์ต้องรวมการเสร็จสิ้นของ ClawHub ด้วย

`OpenClaw Release Checks` รับอินพุตที่ควบคุมโดยผู้ปฏิบัติงานเหล่านี้:

- `ref`: สาขา, แท็ก หรือ commit SHA แบบเต็มที่จะตรวจสอบ การตรวจที่มี secret ต้องให้คอมมิตที่ resolve แล้วเข้าถึงได้จากสาขา OpenClaw หรือแท็กรีลีส
- `run_release_soak`: เลือกเข้าร่วม soak แบบครบถ้วนสำหรับ live/E2E, เส้นทางรีลีส Docker และ upgrade-survivor ตั้งแต่ต้นจนปัจจุบันทั้งหมดในการตรวจรีลีสเสถียร/ค่าเริ่มต้น จะถูกบังคับเปิดโดย `release_profile=full`

กฎ:

- แท็กเสถียรและแท็กแก้ไขอาจเผยแพร่ไปยัง `beta` หรือ `latest` ก็ได้
- แท็ก prerelease แบบ Beta เผยแพร่ได้เฉพาะไปยัง `beta`
- สำหรับ `OpenClaw NPM Release` อนุญาตให้ใช้อินพุต commit SHA แบบเต็มเฉพาะเมื่อ `preflight_only=true`
- `OpenClaw Release Checks` และ `Full Release Validation` เป็นการตรวจสอบเท่านั้นเสมอ
- เส้นทางเผยแพร่จริงต้องใช้ `npm_dist_tag` เดียวกับที่ใช้ระหว่าง preflight; เวิร์กโฟลว์จะตรวจสอบเมทาดาทานั้นก่อนเผยแพร่ต่อ

## ลำดับรีลีส npm เสถียร

เมื่อเตรียมรีลีส npm แบบเสถียร:

1. เรียกใช้ `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนมีแท็ก คุณอาจใช้ commit SHA แบบเต็มปัจจุบันของสาขาเวิร์กโฟลว์สำหรับการ dry run แบบตรวจสอบเท่านั้นของเวิร์กโฟลว์ preflight
2. เลือก `npm_dist_tag=beta` สำหรับโฟลว์ปกติแบบ beta-first หรือ `latest` เฉพาะเมื่อคุณตั้งใจให้เผยแพร่เสถียรโดยตรง
3. เรียกใช้ `Full Release Validation` บนสาขารีลีส, แท็กรีลีส หรือ commit SHA แบบเต็ม เมื่อคุณต้องการ CI ปกติพร้อมความครอบคลุมของ prompt cache แบบสด, Docker, QA Lab, Matrix และ Telegram จากเวิร์กโฟลว์แมนนวลเดียว
4. หากคุณตั้งใจต้องการเฉพาะกราฟการทดสอบปกติแบบกำหนดแน่นอน ให้เรียกใช้เวิร์กโฟลว์ `CI` แบบแมนนวลบน release ref แทน
5. บันทึก `preflight_run_id` ที่สำเร็จ
6. เรียกใช้ `OpenClaw Release Publish` ด้วย `tag` เดียวกัน, `npm_dist_tag` เดียวกัน และ `preflight_run_id` ที่บันทึกไว้; เวิร์กโฟลว์จะเผยแพร่ Plugin ที่แยกออกไปยัง npm และ ClawHub ก่อนเลื่อนสถานะแพ็กเกจ npm ของ OpenClaw
7. หากรีลีสลงที่ `beta` ให้ใช้เวิร์กโฟลว์ส่วนตัว `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` เพื่อเลื่อนสถานะเวอร์ชันเสถียรนั้นจาก `beta` ไปยัง `latest`
8. หากรีลีสตั้งใจเผยแพร่โดยตรงไปยัง `latest` และ `beta` ควรตามบิลด์เสถียรเดียวกันทันที ให้ใช้เวิร์กโฟลว์ส่วนตัวเดียวกันนั้นเพื่อชี้ dist-tag ทั้งสองไปยังเวอร์ชันเสถียร หรือให้การซิงก์ self-healing ตามกำหนดการของเวิร์กโฟลว์ย้าย `beta` ภายหลัง

การเปลี่ยนแปลง dist-tag อยู่ใน repo ส่วนตัวเพื่อความปลอดภัย เพราะยังต้องใช้ `NPM_TOKEN` ขณะที่ repo สาธารณะคงการเผยแพร่แบบ OIDC-only ไว้

แนวทางนี้ทำให้ทั้งเส้นทางเผยแพร่โดยตรงและเส้นทางเลื่อนสถานะแบบ beta-first ถูกบันทึกเป็นเอกสารและผู้ปฏิบัติงานมองเห็นได้

หากผู้ดูแลต้อง fallback ไปใช้การยืนยันตัวตน npm ภายในเครื่อง ให้เรียกใช้คำสั่ง 1Password CLI (`op`) ใด ๆ เฉพาะภายในเซสชัน tmux เฉพาะกิจเท่านั้น อย่าเรียก `op` โดยตรงจากเชลล์เอเจนต์หลัก การเก็บไว้ใน tmux ทำให้พรอมป์, การแจ้งเตือน และการจัดการ OTP สังเกตได้ และป้องกันการแจ้งเตือนซ้ำจากโฮสต์

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
