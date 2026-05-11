---
read_when:
    - กำลังค้นหาคำนิยามช่องทางการเผยแพร่สาธารณะ
    - การเรียกใช้การตรวจสอบความถูกต้องของรีลีสหรือการยอมรับแพ็กเกจ
    - กำลังมองหารูปแบบการตั้งชื่อเวอร์ชันและรอบการเผยแพร่
summary: ช่องทางการเผยแพร่ เช็กลิสต์ของผู้ปฏิบัติงาน กล่องการตรวจสอบความถูกต้อง การตั้งชื่อเวอร์ชัน และรอบการเผยแพร่
title: นโยบายการเผยแพร่รุ่น
x-i18n:
    generated_at: "2026-05-11T20:37:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4f3aaa53534bb6d1af5e72900a48f52fc89ff8188af7b19ecf75543bfcb1ecb
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw มีเลนรุ่นเผยแพร่สาธารณะสามเลน:

- stable: รุ่นเผยแพร่ที่ติดแท็กซึ่งเผยแพร่ไปยัง npm `beta` โดยค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อร้องขออย่างชัดเจน
- beta: แท็กก่อนเผยแพร่จริงที่เผยแพร่ไปยัง npm `beta`
- dev: หัวล่าสุดที่เคลื่อนไหวของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันรุ่นเผยแพร่ stable: `YYYY.M.D`
  - แท็ก Git: `vYYYY.M.D`
- เวอร์ชันรุ่นแก้ไข stable: `YYYY.M.D-N`
  - แท็ก Git: `vYYYY.M.D-N`
- เวอร์ชันก่อนเผยแพร่จริงแบบ beta: `YYYY.M.D-beta.N`
  - แท็ก Git: `vYYYY.M.D-beta.N`
- อย่าเติมศูนย์นำหน้าเดือนหรือวัน
- `latest` หมายถึงรุ่นเผยแพร่ npm แบบ stable ที่ได้รับการโปรโมตในปัจจุบัน
- `beta` หมายถึงเป้าหมายการติดตั้ง beta ในปัจจุบัน
- รุ่นเผยแพร่ stable และรุ่นแก้ไข stable จะเผยแพร่ไปยัง npm `beta` โดยค่าเริ่มต้น; ผู้ปฏิบัติการเผยแพร่สามารถกำหนดเป้าหมายเป็น `latest` อย่างชัดเจน หรือโปรโมตบิลด์ beta ที่ตรวจสอบแล้วในภายหลัง
- รุ่นเผยแพร่ OpenClaw แบบ stable ทุกครั้งจะส่งแพ็กเกจ npm และแอป macOS พร้อมกัน;
  โดยปกติรุ่น beta จะตรวจสอบและเผยแพร่เส้นทาง npm/แพ็กเกจก่อน โดยสงวนการ build/sign/notarize
  แอป mac ไว้สำหรับ stable เว้นแต่จะถูกร้องขออย่างชัดเจน

## จังหวะการเผยแพร่

- การเผยแพร่จะไปแบบ beta ก่อน
- stable จะตามมาหลังจาก beta ล่าสุดผ่านการตรวจสอบแล้วเท่านั้น
- โดยปกติ maintainers จะตัดรุ่นจาก branch `release/YYYY.M.D` ที่สร้างจาก
  `main` ปัจจุบัน เพื่อให้การตรวจสอบรุ่นและการแก้ไขไม่บล็อกการพัฒนาใหม่
  บน `main`
- หากมีการ push หรือเผยแพร่แท็ก beta แล้วและต้องแก้ไข maintainers จะตัด
  แท็ก `-beta.N` ถัดไปแทนการลบหรือสร้างแท็ก beta เดิมใหม่
- ขั้นตอนการเผยแพร่โดยละเอียด การอนุมัติ credentials และบันทึกการกู้คืน
  จำกัดเฉพาะ maintainer เท่านั้น

## เช็กลิสต์ผู้ปฏิบัติการเผยแพร่

เช็กลิสต์นี้คือรูปแบบสาธารณะของโฟลว์การเผยแพร่ รายละเอียด credentials ส่วนตัว
การ signing, notarization, การกู้คืน dist-tag และ rollback ฉุกเฉินจะอยู่ใน
runbook การเผยแพร่ที่จำกัดเฉพาะ maintainer เท่านั้น

1. เริ่มจาก `main` ปัจจุบัน: pull ล่าสุด ยืนยันว่า commit เป้าหมายถูก push แล้ว
   และยืนยันว่า CI ของ `main` ปัจจุบันเขียวพอที่จะสร้าง branch จากจุดนั้นได้
2. เขียน section บนสุดของ `CHANGELOG.md` ใหม่จากประวัติ commit จริงด้วย
   `/changelog` ให้รายการเป็นแบบผู้ใช้เห็นได้ commit แล้ว push จากนั้น rebase/pull
   อีกครั้งก่อนสร้าง branch
3. ตรวจสอบบันทึกความเข้ากันได้ของรุ่นเผยแพร่ใน
   `src/plugins/compat/registry.ts` และ
   `src/commands/doctor/shared/deprecation-compat.ts` ลบความเข้ากันได้ที่หมดอายุ
   เฉพาะเมื่อเส้นทาง upgrade ยังครอบคลุมอยู่ หรือบันทึกเหตุผลว่าทำไมจึงตั้งใจคงไว้
4. สร้าง `release/YYYY.M.D` จาก `main` ปัจจุบัน; อย่าทำงานเผยแพร่ปกติ
   โดยตรงบน `main`
5. เพิ่มเวอร์ชันในทุกตำแหน่งที่จำเป็นสำหรับแท็กที่ตั้งใจไว้ จากนั้นรัน
   `pnpm release:prep` คำสั่งนี้จะรีเฟรชเวอร์ชัน Plugin, inventory ของ Plugin, schema
   ของ config, metadata config ของ channel ที่ bundle มา, baseline เอกสาร config, exports
   ของ Plugin SDK และ baseline API ของ Plugin SDK ตามลำดับที่ถูกต้อง commit drift
   ที่สร้างขึ้นก่อน tagging จากนั้นรัน preflight แบบ deterministic ในเครื่อง:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` และ `pnpm release:check`
6. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true` ก่อนมีแท็ก
   สามารถใช้ SHA ของ release branch แบบครบ 40 ตัวอักษรสำหรับ preflight เพื่อการตรวจสอบเท่านั้น
   บันทึก `preflight_run_id` ที่สำเร็จไว้
7. เริ่มการทดสอบก่อนเผยแพร่จริงทั้งหมดด้วย `Full Release Validation` สำหรับ
   release branch, tag หรือ commit SHA แบบเต็ม นี่คือ entrypoint แบบ manual เพียงจุดเดียว
   สำหรับกล่องทดสอบรุ่นใหญ่ทั้งสี่: Vitest, Docker, QA Lab และ Package
8. หากการตรวจสอบล้มเหลว ให้แก้บน release branch แล้วรันซ้ำเฉพาะไฟล์ lane, workflow job,
   package profile, provider หรือ allowlist ของ model ที่เล็กที่สุดซึ่งพิสูจน์การแก้ไขได้
   รัน umbrella เต็มซ้ำเฉพาะเมื่อพื้นผิวที่เปลี่ยนทำให้หลักฐานเดิมล้าสมัย
9. สำหรับ beta ให้แท็ก `vYYYY.M.D-beta.N` จากนั้นรัน `OpenClaw Release Publish` จาก
   branch `release/YYYY.M.D` ที่ตรงกัน คำสั่งนี้จะตรวจสอบ `pnpm plugins:sync:check`,
   dispatch แพ็กเกจ Plugin ทั้งหมดที่เผยแพร่ได้ไปยัง npm และชุดเดียวกันไปยัง
   ClawHub แบบขนาน จากนั้นโปรโมต artifact preflight ของ OpenClaw npm ที่เตรียมไว้ด้วย
   dist-tag ที่ตรงกันทันทีเมื่อการเผยแพร่ Plugin ไปยัง npm สำเร็จ
   หลังจาก child สำหรับเผยแพร่ OpenClaw npm สำเร็จ จะสร้างหรืออัปเดตหน้า GitHub release/prerelease
   ที่ตรงกันจาก section `CHANGELOG.md` ที่ตรงกันอย่างครบถ้วน รุ่น stable ที่เผยแพร่ไปยัง npm `latest`
   จะกลายเป็น GitHub latest release; รุ่น maintenance แบบ stable ที่คงไว้บน npm `beta`
   จะถูกสร้างด้วย GitHub `latest=false`
   การเผยแพร่ ClawHub อาจยังทำงานอยู่ขณะที่ OpenClaw npm เผยแพร่ แต่ workflow เผยแพร่รุ่น
   จะพิมพ์ ID ของ child run ทันที โดยค่าเริ่มต้นจะไม่รอ ClawHub หลัง dispatch แล้ว
   ดังนั้นความพร้อมใช้งานของ OpenClaw npm จะไม่ถูกบล็อกจากการอนุมัติ ClawHub หรือ registry work
   ที่ช้ากว่า; ตั้งค่า `wait_for_clawhub=true` เมื่อ ClawHub ต้องบล็อกการเสร็จสิ้นของ workflow
   เส้นทาง ClawHub จะ retry ความล้มเหลวชั่วคราวในการติดตั้ง dependency ของ CLI,
   เผยแพร่ Plugin ที่ผ่าน preview แม้ว่า preview cell หนึ่งจะ flaky และจบด้วย
   การตรวจสอบ registry สำหรับทุกเวอร์ชัน Plugin ที่คาดไว้ เพื่อให้การเผยแพร่บางส่วน
   ยังมองเห็นและ retry ได้ หลังเผยแพร่ ให้รัน
   package acceptance หลังเผยแพร่กับแพ็กเกจ `openclaw@YYYY.M.D-beta.N` หรือ
   `openclaw@beta` ที่เผยแพร่แล้ว หาก prerelease ที่ push หรือเผยแพร่แล้วต้องแก้ไข
   ให้ตัด prerelease number ถัดไปที่ตรงกัน; อย่าลบหรือเขียน prerelease เดิมใหม่
10. สำหรับ stable ให้ดำเนินการต่อเฉพาะหลังจาก beta หรือ release candidate ที่ตรวจสอบแล้วมี
    หลักฐานการตรวจสอบที่จำเป็น การเผยแพร่ stable npm ยังผ่าน
    `OpenClaw Release Publish` โดยนำ artifact preflight ที่สำเร็จกลับมาใช้ผ่าน
    `preflight_run_id`; ความพร้อมของรุ่นเผยแพร่ macOS แบบ stable ยังต้องมี
    `.zip`, `.dmg`, `.dSYM.zip` ที่แพ็กแล้ว และ `appcast.xml` ที่อัปเดตบน `main`
    ด้วย workflow เผยแพร่ macOS ส่วนตัวจะเผยแพร่ appcast ที่ signed แล้วไปยัง public
    `main` โดยอัตโนมัติหลังจากตรวจสอบ release assets แล้ว; หาก branch protection บล็อก
    การ push โดยตรง จะเปิดหรืออัปเดต appcast PR
11. หลังเผยแพร่ ให้รัน verifier หลังเผยแพร่ npm, E2E Telegram จาก published-npm แบบ standalone
    ที่เป็นทางเลือกเมื่อคุณต้องการหลักฐาน channel หลังเผยแพร่, โปรโมต dist-tag เมื่อจำเป็น,
    ตรวจสอบหน้า GitHub release ที่สร้างขึ้น และรันขั้นตอนประกาศรุ่นเผยแพร่

## Release preflight

- รัน `pnpm check:test-types` ก่อน preflight ของรีลีส เพื่อให้ TypeScript ของการทดสอบยังคง
  ถูกครอบคลุมนอก gate `pnpm check` แบบ local ที่เร็วกว่า
- รัน `pnpm check:architecture` ก่อน preflight ของรีลีส เพื่อให้การตรวจสอบ import
  cycle และขอบเขตสถาปัตยกรรมที่กว้างขึ้นผ่านเป็นสีเขียวนอก gate แบบ local ที่เร็วกว่า
- รัน `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้ artifact รีลีส
  `dist/*` ที่คาดไว้และบันเดิล Control UI มีอยู่สำหรับขั้นตอนตรวจสอบความถูกต้องของ pack
- รัน `pnpm release:prep` หลังจาก bump เวอร์ชัน root และก่อนติด tag คำสั่งนี้
  รันตัวสร้างรีลีสแบบกำหนดผลลัพธ์ได้ทุกตัวที่มัก drift หลังจากการเปลี่ยน
  เวอร์ชัน/config/API: เวอร์ชัน plugin, inventory ของ plugin, schema ของ base config,
  metadata ของ config ช่องทางที่ bundled, baseline ของเอกสาร config, export ของ plugin SDK
  และ baseline ของ plugin SDK API `pnpm release:check` จะรัน guard เหล่านั้นซ้ำ
  ในโหมดตรวจสอบและรายงานความล้มเหลวของ drift ที่สร้างขึ้นทั้งหมดที่พบในรอบเดียว
  ก่อนรันการตรวจสอบรีลีสของ package
- รัน workflow แบบ manual `Full Release Validation` ก่อนอนุมัติรีลีสเพื่อเริ่ม
  test box ก่อนรีลีสทั้งหมดจาก entrypoint เดียว รองรับ branch, tag หรือ full commit SHA,
  dispatch `CI` แบบ manual และ dispatch
  `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, การตรวจสอบ package ข้าม OS,
  ความเท่าเทียมของ QA Lab, Matrix และ lane ของ Telegram การรัน stable/default
  จะเก็บ live/E2E แบบครบถ้วนและ Docker release-path soak ไว้หลัง
  `run_release_soak=true`; `release_profile=full` จะบังคับเปิด soak เมื่อใช้
  `release_profile=full` และ `rerun_group=all` จะรัน package Telegram
  E2E กับ artifact `release-package-under-test` จาก release checks ด้วย
  ระบุ `release_package_spec` หลังเผยแพร่ beta เพื่อใช้ package npm ที่จัดส่งแล้วซ้ำ
  ใน release checks, Package Acceptance และ package Telegram
  E2E โดยไม่ต้อง build release tarball ใหม่ ระบุ
  `npm_telegram_package_spec` เฉพาะเมื่อ Telegram ควรใช้ package ที่เผยแพร่แล้ว
  ต่างจากส่วนอื่นของการตรวจสอบรีลีส ระบุ
  `package_acceptance_package_spec` เมื่อ Package Acceptance ควรใช้ package ที่เผยแพร่แล้ว
  ต่างจาก release package spec ระบุ
  `evidence_package_spec` เมื่อรายงาน evidence ส่วนตัวควรพิสูจน์ว่า
  การตรวจสอบตรงกับ package npm ที่เผยแพร่แล้วโดยไม่บังคับ Telegram E2E
  ตัวอย่าง:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- รัน workflow แบบ manual `Package Acceptance` เมื่อคุณต้องการ proof แบบ side-channel
  สำหรับแคนดิเดต package ระหว่างที่งานรีลีสดำเนินต่อ ใช้ `source=npm` สำหรับ
  `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรีลีสที่ระบุแน่นอน; ใช้ `source=ref`
  เพื่อ pack branch/tag/SHA `package_ref` ที่เชื่อถือได้ด้วย harness
  `workflow_ref` ปัจจุบัน; ใช้ `source=url` สำหรับ HTTPS tarball พร้อม
  SHA-256 ที่จำเป็น; หรือใช้ `source=artifact` สำหรับ tarball ที่อัปโหลดโดย
  GitHub Actions run อื่น workflow จะ resolve แคนดิเดตเป็น
  `package-under-test`, ใช้ Docker E2E release scheduler ซ้ำกับ
  tarball นั้น และสามารถรัน Telegram QA กับ tarball เดียวกันด้วย
  `telegram_mode=mock-openai` หรือ `telegram_mode=live-frontier` เมื่อ
  Docker lane ที่เลือกมี `published-upgrade-survivor` artifact ของ package
  คือแคนดิเดต และ `published_upgrade_survivor_baseline` เลือก
  baseline ที่เผยแพร่แล้ว `update-restart-auth` ใช้ package แคนดิเดตเป็น
  ทั้ง CLI ที่ติดตั้งและ package-under-test เพื่อทดสอบเส้นทาง managed restart
  ของคำสั่ง update ของแคนดิเดต
  ตัวอย่าง: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  โปรไฟล์ทั่วไป:
  - `smoke`: lane สำหรับ install/channel/agent, gateway network และ config reload
  - `package`: lane package/update/restart/plugin แบบใช้ artifact โดยตรง โดยไม่มี OpenWebUI หรือ ClawHub แบบ live
  - `product`: โปรไฟล์ package รวมกับช่องทาง MCP, การล้าง cron/subagent,
    OpenAI web search และ OpenWebUI
  - `full`: ชิ้นส่วน Docker release-path พร้อม OpenWebUI
  - `custom`: การเลือก `docker_lanes` ที่ระบุแน่นอนสำหรับ rerun แบบเจาะจง
- รัน workflow แบบ manual `CI` โดยตรงเมื่อคุณต้องการเพียง coverage ของ CI ปกติแบบเต็ม
  สำหรับแคนดิเดตรีลีส การ dispatch CI แบบ manual จะข้าม changed
  scoping และบังคับ lane สำหรับ Linux Node shards, bundled-plugin shards, channel
  contracts, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke,
  การตรวจสอบเอกสาร, Python skills, Windows, macOS, Android และ Control UI i18n
  ตัวอย่าง: `gh workflow run ci.yml --ref release/YYYY.M.D`
- รัน `pnpm qa:otel:smoke` เมื่อตรวจสอบ telemetry ของรีลีส คำสั่งนี้ทดสอบ
  QA-lab ผ่านตัวรับ OTLP/HTTP แบบ local และตรวจสอบชื่อ span ของ trace ที่ export,
  attribute ที่มีขอบเขต และการ redact เนื้อหา/ตัวระบุโดยไม่ต้องใช้
  Opik, Langfuse หรือตัวรวบรวมภายนอกอื่น
- รัน `pnpm release:check` ก่อนทุกรีลีสที่ติด tag
- รัน `OpenClaw Release Publish` สำหรับลำดับ publish ที่เปลี่ยนสถานะหลังจาก
  tag มีอยู่แล้ว Dispatch จาก `release/YYYY.M.D` (หรือ `main` เมื่อเผยแพร่
  tag ที่ reachable จาก main), ส่ง release tag และ `preflight_run_id` ของ OpenClaw npm
  ที่สำเร็จ และคงค่า default ของ plugin publish scope
  `all-publishable` ไว้ เว้นแต่คุณตั้งใจรันการซ่อมแบบเจาะจง workflow นี้
  serialize การ publish plugin npm, การ publish plugin ClawHub และการ publish OpenClaw
  npm เพื่อไม่ให้ package core ถูกเผยแพร่ก่อน plugin ภายนอกของมัน
- ขณะนี้ release checks รันใน workflow แบบ manual แยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรัน lane QA Lab mock parity รวมถึงโปรไฟล์
  live Matrix แบบเร็วและ lane Telegram QA ก่อนอนุมัติรีลีสด้วย lane แบบ live
  ใช้ environment `qa-live-shared`; Telegram ยังใช้ credential lease ของ Convex CI
  ด้วย รัน workflow แบบ manual `QA-Lab - All Lanes` พร้อม
  `matrix_profile=all` และ `matrix_shards=true` เมื่อคุณต้องการ inventory
  ของ Matrix transport, media และ E2EE แบบเต็มในแบบขนาน
- การตรวจสอบ runtime สำหรับการติดตั้งและอัปเกรดข้าม OS เป็นส่วนหนึ่งของ
  `OpenClaw Release Checks` และ `Full Release Validation` แบบ public ซึ่งเรียก
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` โดยตรง
- การแยกนี้ตั้งใจทำ: รักษาเส้นทางรีลีส npm จริงให้สั้น,
  deterministic และเน้น artifact ขณะที่การตรวจสอบ live ที่ช้ากว่าอยู่ใน lane
  ของตัวเอง เพื่อไม่ให้ทำให้ publish ชะงักหรือถูกบล็อก
- release checks ที่มี secret ควรถูก dispatch ผ่าน `Full Release
Validation` หรือจาก workflow ref ของ `main`/release เพื่อให้ logic ของ workflow และ
  secret ยังถูกควบคุม
- `OpenClaw Release Checks` รองรับ branch, tag หรือ full commit SHA ตราบใด
  ที่ commit ที่ resolve แล้ว reachable จาก branch หรือ release tag ของ OpenClaw
- preflight แบบ validation-only ของ `OpenClaw NPM Release` ยังรองรับ SHA ของ commit
  บน workflow branch ปัจจุบันที่มีความยาวเต็ม 40 ตัวอักษร โดยไม่ต้องมี tag ที่ push แล้ว
- เส้นทาง SHA นั้นเป็น validation-only และไม่สามารถ promote เป็นการ publish จริงได้
- ในโหมด SHA workflow จะ synthesize `v<package.json version>` เฉพาะสำหรับการตรวจสอบ
  metadata ของ package เท่านั้น; การ publish จริงยังต้องมี release tag จริง
- workflow ทั้งสองรักษาเส้นทาง publish และ promotion จริงไว้บน runner ที่โฮสต์โดย GitHub
  ขณะที่เส้นทางตรวจสอบแบบไม่เปลี่ยนสถานะสามารถใช้ runner Blacksmith Linux ที่ใหญ่กว่าได้
- workflow นั้นรัน
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ workflow secret ทั้ง `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- preflight ของ npm release ไม่รอ lane release checks แยกต่างหากอีกต่อไป
- รัน `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือ tag beta/correction ที่ตรงกัน) ก่อนอนุมัติ
- หลัง npm publish ให้รัน
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (หรือเวอร์ชัน beta/correction ที่ตรงกัน) เพื่อตรวจสอบเส้นทางติดตั้ง registry
  ที่เผยแพร่แล้วใน temp prefix ใหม่
- หลัง publish beta ให้รัน `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  เพื่อตรวจสอบ onboarding ของ installed-package, การตั้งค่า Telegram และ Telegram E2E จริง
  กับ package npm ที่เผยแพร่แล้วโดยใช้พูล credential Telegram แบบ leased ร่วมกัน
  งานเฉพาะกิจแบบ local ของ maintainer อาจละเว้นตัวแปร Convex และส่ง credential env
  `OPENCLAW_QA_TELEGRAM_*` ทั้งสามตัวโดยตรง
- หากต้องการรัน post-publish beta smoke แบบเต็มจากเครื่อง maintainer ให้ใช้ `pnpm release:beta-smoke -- --beta betaN` helper จะรันการตรวจสอบ npm update/fresh-target ของ Parallels, dispatch `NPM Telegram Beta E2E`, poll workflow run ที่ระบุแน่นอน, ดาวน์โหลด artifact และพิมพ์รายงาน Telegram
- Maintainer สามารถรันการตรวจสอบ post-publish เดียวกันจาก GitHub Actions ผ่าน
  workflow แบบ manual `NPM Telegram Beta E2E` ได้ workflow นี้ตั้งใจให้เป็น manual-only
  และไม่รันในทุก merge
- ตอนนี้ automation ของรีลีสสำหรับ maintainer ใช้ preflight-then-promote:
  - การ publish npm จริงต้องผ่าน npm `preflight_run_id` ที่สำเร็จ
  - การ publish npm จริงต้องถูก dispatch จาก branch `main` หรือ
    `release/YYYY.M.D` เดียวกันกับ preflight run ที่สำเร็จ
  - รีลีส npm แบบ stable มีค่า default เป็น `beta`
  - การ publish npm แบบ stable สามารถ target `latest` ได้อย่างชัดเจนผ่าน workflow input
  - การเปลี่ยน npm dist-tag แบบใช้ token ตอนนี้อยู่ใน
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    เพื่อความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่
    repo public ใช้การ publish แบบ OIDC-only
  - `macOS Release` แบบ public เป็น validation-only; เมื่อ tag อยู่เฉพาะบน
    release branch แต่ workflow ถูก dispatch จาก `main` ให้ตั้ง
    `public_release_branch=release/YYYY.M.D`
  - การ publish mac ส่วนตัวจริงต้องผ่าน private mac
    `preflight_run_id` และ `validate_run_id` ที่สำเร็จ
  - เส้นทาง publish จริงจะ promote artifact ที่เตรียมไว้แทนที่จะ rebuild
    อีกครั้ง
- สำหรับรีลีสแก้ไขแบบ stable เช่น `YYYY.M.D-N` ตัวตรวจสอบ post-publish
  จะตรวจสอบเส้นทางอัปเกรด temp-prefix เดียวกันจาก `YYYY.M.D` ไปเป็น `YYYY.M.D-N`
  ด้วย เพื่อให้การแก้ไขรีลีสไม่สามารถปล่อยให้ global install รุ่นเก่าค้างอยู่บน
  payload stable ฐานได้อย่างเงียบ ๆ
- preflight ของ npm release จะ fail closed เว้นแต่ tarball จะมีทั้ง
  `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่าง
  เพื่อไม่ให้เราส่ง dashboard ใน browser ที่ว่างเปล่าอีก
- การตรวจสอบ post-publish ยังตรวจว่า entrypoint ของ plugin ที่เผยแพร่แล้วและ
  metadata ของ package มีอยู่ใน layout registry ที่ติดตั้งแล้ว รีลีสที่ส่ง
  payload runtime ของ plugin ขาดหายจะทำให้ postpublish verifier ล้มเหลวและ
  ไม่สามารถ promote เป็น `latest` ได้
- `pnpm test:install:smoke` ยังบังคับใช้ budget `unpackedSize` ของ npm pack
  บน update tarball แคนดิเดตด้วย เพื่อให้ installer e2e จับ pack bloat
  ที่เกิดโดยไม่ตั้งใจก่อนเส้นทาง release publish
- หากงานรีลีสแตะการวางแผน CI, timing manifest ของ extension หรือ
  test matrix ของ extension ให้ regenerate และ review matrix output
  `plugin-prerelease-extension-shard` ที่ planner เป็นเจ้าของจาก
  `.github/workflows/plugin-prerelease.yml` ก่อนอนุมัติ เพื่อให้ release notes
  ไม่อธิบาย layout CI ที่ล้าสมัย
- ความพร้อมของรีลีส macOS แบบ stable ยังรวมถึงพื้นผิว updater:
  - GitHub release ต้องมี `.zip`, `.dmg` และ `.dSYM.zip` ที่ package แล้วในท้ายที่สุด
  - `appcast.xml` บน `main` ต้องชี้ไปยัง zip stable ใหม่หลัง publish;
    workflow publish macOS ส่วนตัวจะ commit ให้โดยอัตโนมัติ หรือเปิด appcast
    PR เมื่อการ push โดยตรงถูกบล็อก
  - app ที่ package แล้วต้องคง bundle id แบบ non-debug, Sparkle feed
    URL ที่ไม่ว่าง และ `CFBundleVersion` ที่เท่ากับหรือสูงกว่า canonical Sparkle build floor
    สำหรับเวอร์ชันรีลีสนั้น

## กล่องทดสอบรีลีส

`Full Release Validation` คือวิธีที่ operator ใช้เริ่มการทดสอบก่อนรีลีสทั้งหมดจาก
entrypoint เดียว สำหรับ proof ของ commit ที่ pin ไว้บน branch ที่เคลื่อนไหวเร็ว ให้ใช้
helper เพื่อให้ child workflow ทุกตัวรันจาก branch ชั่วคราวที่ fixed ไว้ที่ target
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

ตัวช่วยจะ push `release-ci/<sha>-...`, dispatch `Full Release Validation`
จาก branch นั้นด้วย `ref=<sha>`, ตรวจสอบว่า `headSha` ของ child workflow ทุกตัว
ตรงกับเป้าหมาย แล้วจึงลบ branch ชั่วคราว วิธีนี้ช่วยหลีกเลี่ยงการพิสูจน์ child run
ของ `main` ที่ใหม่กว่าโดยไม่ตั้งใจ

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

workflow จะ resolve target ref, dispatch `CI` แบบ manual ด้วย
`target_ref=<release-ref>`, dispatch `OpenClaw Release Checks`, เตรียม artifact
parent `release-package-under-test` สำหรับการตรวจสอบที่เกี่ยวกับ package และ
dispatch package Telegram E2E แบบ standalone เมื่อ `release_profile=full` พร้อม
`rerun_group=all` หรือเมื่อมีการตั้งค่า `release_package_spec` หรือ
`npm_telegram_package_spec` จากนั้น `OpenClaw Release
Checks` จะ fan out ไปยัง install smoke, release checks ข้าม OS, coverage เส้นทาง release ของ live/E2E Docker
เมื่อเปิด soak, Package Acceptance พร้อม Telegram
package QA, QA Lab parity, live Matrix และ live Telegram การรันแบบเต็มจะยอมรับได้ก็ต่อเมื่อ
summary ของ `Full Release Validation`
แสดงว่า `normal_ci` และ `release_checks` สำเร็จ ในโหมด full/all
child `npm_telegram` ต้องสำเร็จด้วย; นอก full/all จะถูกข้าม
เว้นแต่จะมีการระบุ `release_package_spec` หรือ `npm_telegram_package_spec` ที่เผยแพร่แล้ว
summary ของ verifier สุดท้ายมีตารางงานที่ช้าที่สุดสำหรับ child run แต่ละตัว
เพื่อให้ release manager เห็น critical path ปัจจุบันโดยไม่ต้องดาวน์โหลด log
ดู [การตรวจสอบ release แบบเต็ม](/th/reference/full-release-validation) สำหรับ
stage matrix ทั้งหมด, ชื่อ job ของ workflow ที่แน่นอน, ความแตกต่างระหว่าง profile stable กับ full,
artifacts และ handle สำหรับ rerun แบบเจาะจง
Child workflows จะถูก dispatch จาก ref ที่เชื่อถือได้ซึ่งรัน `Full Release
Validation` โดยปกติคือ `--ref main` แม้ว่า target `ref` จะชี้ไปยัง
release branch หรือ tag ที่เก่ากว่าก็ตาม ไม่มี input workflow-ref แยกต่างหากสำหรับ Full Release Validation;
ให้เลือก harness ที่เชื่อถือได้โดยเลือก workflow run ref
อย่าใช้ `--ref main -f ref=<sha>` สำหรับ proof ของ commit ที่แน่นอนบน `main` ที่เคลื่อนไหวอยู่;
raw commit SHA ไม่สามารถเป็น workflow dispatch ref ได้ ดังนั้นให้ใช้
`pnpm ci:full-release --sha <sha>` เพื่อสร้าง branch ชั่วคราวที่ pin ไว้

ใช้ `release_profile` เพื่อเลือกขอบเขต live/provider:

- `minimum`: เส้นทาง OpenAI/core live และ Docker ที่สำคัญต่อ release ซึ่งเร็วที่สุด
- `stable`: minimum บวก coverage provider/backend ที่เสถียรสำหรับการอนุมัติ release
- `full`: stable บวก coverage provider/media เชิง advisory ที่กว้างขึ้น

ใช้ `run_release_soak=true` กับ `stable` เมื่อ lane ที่บล็อก release
เป็นสีเขียว และต้องการ sweep live/E2E, เส้นทาง release ของ Docker และ
published upgrade-survivor แบบมีขอบเขตอย่างละเอียดก่อน promotion sweep นั้นครอบคลุม
package stable ล่าสุดสี่รายการ บวก baseline ที่ pin ไว้ `2026.4.23` และ `2026.5.2`
รวมถึง coverage รุ่นเก่า `2026.4.15` โดยลบ baseline ที่ซ้ำกันออกและ
แบ่งแต่ละ baseline เป็น Docker runner job ของตัวเอง `full` จะ imply
`run_release_soak=true`

`OpenClaw Release Checks` ใช้ workflow ref ที่เชื่อถือได้เพื่อ resolve target
ref ครั้งเดียวเป็น `release-package-under-test` และ reuse artifact นั้นใน cross-OS,
Package Acceptance และการตรวจสอบ Docker เส้นทาง release เมื่อ soak ทำงาน วิธีนี้ทำให้
box ทั้งหมดที่เกี่ยวกับ package ใช้ bytes เดียวกันและหลีกเลี่ยงการ build package ซ้ำ
หลังจาก beta อยู่บน npm แล้ว ให้ตั้งค่า `release_package_spec=openclaw@YYYY.M.D-beta.N`
เพื่อให้ release checks ดาวน์โหลด package ที่ shipped แล้วครั้งเดียว, extract source
SHA ของ build จาก `dist/build-info.json` และ reuse artifact นั้นสำหรับ cross-OS,
Package Acceptance, release-path Docker และ package Telegram lanes
OpenAI install smoke ข้าม OS ใช้ `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อมีการตั้งค่า
ตัวแปร repo/org ไม่เช่นนั้นจะใช้ `openai/gpt-5.4` เพราะ lane นี้
พิสูจน์การติดตั้ง package, onboarding, การเริ่ม Gateway และ live agent turn หนึ่งครั้ง
ไม่ใช่ benchmarking model default ที่ช้าที่สุด ส่วน live provider
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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

อย่าใช้ umbrella แบบเต็มเป็นการ rerun ครั้งแรกหลังจาก fix แบบเจาะจง หาก box หนึ่ง
ล้มเหลว ให้ใช้ child workflow, job, Docker lane, package profile, model
provider หรือ QA lane ที่ล้มเหลวสำหรับ proof ถัดไป รัน umbrella แบบเต็มอีกครั้งเฉพาะเมื่อ
fix เปลี่ยน release orchestration ที่ใช้ร่วมกัน หรือทำให้หลักฐาน all-box ก่อนหน้า
ล้าสมัย verifier สุดท้ายของ umbrella จะตรวจสอบ workflow run
ids ของ child ที่บันทึกไว้อีกครั้ง ดังนั้นหลังจาก child workflow ถูก rerun จนสำเร็จแล้ว ให้ rerun เฉพาะ
job parent `Verify full validation` ที่ล้มเหลว

สำหรับการ recovery แบบมีขอบเขต ให้ส่ง `rerun_group` ไปยัง umbrella `all` คือการรัน
release-candidate จริง, `ci` รันเฉพาะ child normal CI, `plugin-prerelease`
รันเฉพาะ child Plugin สำหรับ release เท่านั้น, `release-checks` รันทุก release
box และ release group ที่แคบกว่าคือ `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` และ `npm-telegram`
การ rerun `npm-telegram` แบบเจาะจงต้องมี `release_package_spec` หรือ
`npm_telegram_package_spec`; การรัน full/all ด้วย `release_profile=full` ใช้
release-checks package artifact การ rerun
cross-OS แบบเจาะจงสามารถเพิ่ม `cross_os_suite_filter=windows/packaged-upgrade` หรือ
filter OS/suite อื่นได้ ความล้มเหลวของ QA release-check เป็น advisory; ความล้มเหลวเฉพาะ QA
ไม่บล็อกการตรวจสอบ release

### Vitest

Vitest box คือ child workflow `CI` แบบ manual Manual CI ตั้งใจ
bypass changed scoping และบังคับใช้ graph การทดสอบปกติสำหรับ release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
Skills, Windows, macOS, Android และ Control UI i18n

ใช้ box นี้เพื่อตอบว่า "source tree ผ่านชุดทดสอบปกติแบบเต็มหรือไม่?"
มันไม่เหมือนกับการตรวจสอบผลิตภัณฑ์ตามเส้นทาง release หลักฐานที่ควรเก็บ:

- summary ของ `Full Release Validation` ที่แสดง URL ของ run `CI` ที่ dispatch
- run `CI` เป็นสีเขียวบน target SHA ที่แน่นอน
- ชื่อ shard ที่ล้มเหลวหรือช้าจาก CI jobs เมื่อสืบสวน regression
- artifacts เวลาของ Vitest เช่น `.artifacts/vitest-shard-timings.json` เมื่อ
  run ต้องการการวิเคราะห์ performance

รัน manual CI โดยตรงเฉพาะเมื่อ release ต้องการ normal CI แบบ deterministic แต่
ไม่ต้องการ Docker, QA Lab, live, cross-OS หรือ package boxes:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box อยู่ใน `OpenClaw Release Checks` ผ่าน
`openclaw-live-and-e2e-checks-reusable.yml` รวมถึง workflow `install-smoke`
ใน release-mode มันตรวจสอบ release candidate ผ่าน packaged
Docker environments แทนที่จะเป็นเพียงการทดสอบระดับ source

coverage Docker สำหรับ release ประกอบด้วย:

- install smoke แบบเต็มพร้อมเปิดใช้ slow Bun global install smoke
- การเตรียม/reuse root Dockerfile smoke image ตาม target SHA โดยมี QR,
  root/gateway และ installer/Bun smoke jobs ทำงานเป็น install-smoke
  shards แยกกัน
- repository E2E lanes
- chunks Docker เส้นทาง release: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` และ `plugins-runtime-install-h`
- coverage OpenWebUI ภายใน chunk `plugins-runtime-services` เมื่อมีการร้องขอ
- lanes ติดตั้ง/ถอนติดตั้ง Plugin ที่ bundled แบบแยก
  `bundled-plugin-install-uninstall-0` ถึง
  `bundled-plugin-install-uninstall-23`
- provider suites แบบ live/E2E และ coverage model live ของ Docker เมื่อ release checks
  รวม live suites

ใช้ Docker artifacts ก่อน rerun release-path scheduler จะ upload
`.artifacts/docker-tests/` พร้อม lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON และคำสั่ง rerun สำหรับ recovery แบบเจาะจง
ให้ใช้ `docker_lanes=<lane[,lane]>` บน reusable live/E2E workflow แทนการ
rerun release chunks ทั้งหมด คำสั่ง rerun ที่ generate จะรวม
`package_artifact_run_id` ก่อนหน้าและ input ของ Docker image ที่เตรียมไว้เมื่อมี
เพื่อให้ lane ที่ล้มเหลว reuse tarball และ GHCR images เดิมได้

### QA Lab

QA Lab box เป็นส่วนหนึ่งของ `OpenClaw Release Checks` เช่นกัน มันคือ release gate
ด้านพฤติกรรม agentic และระดับ channel แยกจาก Vitest และ Docker
package mechanics

coverage QA Lab สำหรับ release ประกอบด้วย:

- mock parity lane ที่เปรียบเทียบ OpenAI candidate lane กับ baseline Opus 4.6
  โดยใช้ agentic parity pack
- profile fast live Matrix QA ที่ใช้ environment `qa-live-shared`
- lane live Telegram QA ที่ใช้ lease credential Convex CI
- `pnpm qa:otel:smoke` เมื่อ telemetry ของ release ต้องการ proof local ที่ชัดเจน

ใช้ box นี้เพื่อตอบว่า "release ทำงานถูกต้องใน QA scenarios และ
live channel flows หรือไม่?" เก็บ artifact URLs สำหรับ lanes parity, Matrix และ Telegram
เมื่ออนุมัติ release coverage Matrix แบบเต็มยังคงมีให้ใช้เป็นการรัน QA-Lab แบบ sharded
ด้วย manual แทนที่จะเป็น lane release-critical เริ่มต้น

### Package

Package box คือ gate ของผลิตภัณฑ์ที่ติดตั้งได้ รองรับโดย
`Package Acceptance` และ resolver
`scripts/resolve-openclaw-package-candidate.mjs` resolver จะ normalize
candidate เป็น tarball `package-under-test` ที่ Docker E2E ใช้, ตรวจสอบ
package inventory, บันทึก package version และ SHA-256 และแยก
workflow harness ref ออกจาก package source ref

แหล่ง candidate ที่รองรับ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` หรือ version release ของ OpenClaw ที่แน่นอน
- `source=ref`: pack branch, tag หรือ full commit SHA ของ `package_ref` ที่เชื่อถือได้
  ด้วย harness `workflow_ref` ที่เลือก
- `source=url`: download HTTPS `.tgz` พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: reuse `.tgz` ที่ upload โดย GitHub Actions run อื่น

`OpenClaw Release Checks` รัน Package Acceptance ด้วย `source=artifact`,
artifact release package ที่เตรียมไว้, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` Package Acceptance ทำให้ migration, update,
การ restart update configured-auth, การติดตั้ง Skills จาก ClawHub แบบ live, การ cleanup dependency ของ Plugin ที่ stale, fixture Plugin offline,
การอัปเดต Plugin และ Telegram package QA ใช้กับ tarball ที่ resolve แล้วชุดเดียวกัน
release checks ที่บล็อกใช้ baseline package ที่ published ล่าสุดตามค่าเริ่มต้น;
`run_release_soak=true` หรือ
`release_profile=full` จะขยายไปยัง baseline stable ที่เผยแพร่บน npm ทุกตัวตั้งแต่
`2026.4.23` ถึง `latest` บวก fixtures ของ issue ที่มีรายงาน ใช้
Package Acceptance ด้วย `source=npm` สำหรับ candidate ที่ shipped แล้ว หรือ
`source=ref`/`source=artifact` สำหรับ tarball npm local ที่อิง SHA ก่อน
publish มันคือ replacement แบบ GitHub-native
สำหรับ coverage package/update ส่วนใหญ่ที่ก่อนหน้านี้ต้องใช้
Parallels release checks ข้าม OS ยังมีความสำคัญสำหรับ onboarding,
installer และพฤติกรรมเฉพาะ platform แต่การตรวจสอบผลิตภัณฑ์ด้าน package/update ควร
เลือกใช้ Package Acceptance

เช็กลิสต์มาตรฐานสำหรับการตรวจสอบความถูกต้องของการอัปเดตและ Plugin คือ
[การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins) ใช้รายการนี้เมื่อ
ตัดสินใจว่าเลน local, Docker, Package Acceptance หรือ release-check ใดพิสูจน์การ
ติดตั้ง/อัปเดต Plugin, การล้างข้อมูลด้วย doctor หรือการเปลี่ยนแปลงการย้ายแพ็กเกจที่เผยแพร่แล้วได้
การย้ายการอัปเดตที่เผยแพร่อย่างครบถ้วนจากทุกแพ็กเกจเสถียร `2026.4.23+` เป็น
เวิร์กโฟลว์ `Update Migration` แบบทำด้วยตนเองแยกต่างหาก ไม่ใช่ส่วนหนึ่งของ CI สำหรับการออกเวอร์ชันเต็ม

การผ่อนปรน package-acceptance แบบเดิมตั้งใจจำกัดเวลาไว้ แพ็กเกจจนถึง
`2026.4.25` อาจใช้เส้นทางความเข้ากันได้สำหรับช่องว่างของเมทาดาทาที่เผยแพร่ไปยัง
npm แล้ว ได้แก่ รายการ inventory QA ส่วนตัวที่หายไปจาก tarball, ไม่มี
`gateway install --wrapper`, ไม่มีไฟล์ patch ใน fixture ของ git ที่ได้จาก tarball,
ไม่มี `update.channel` ที่คงอยู่, ตำแหน่ง install-record ของ Plugin แบบเดิม,
ไม่มีการคงอยู่ของ install-record ของ marketplace และการย้ายเมทาดาทาของ config
ระหว่าง `plugins update` แพ็กเกจ `2026.4.26` ที่เผยแพร่อาจเตือนเรื่อง
ไฟล์ stamp เมทาดาทาของ local build ที่ส่งออกไปแล้ว แพ็กเกจหลังจากนั้นต้องเป็นไปตาม
สัญญาแพ็กเกจสมัยใหม่ ช่องว่างเดียวกันเหล่านั้นจะทำให้การตรวจสอบความถูกต้องของ release ล้มเหลว

ใช้โปรไฟล์ Package Acceptance ที่กว้างขึ้นเมื่อคำถามของ release เกี่ยวกับ
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

- `smoke`: เลนติดตั้งแพ็กเกจ/channel/agent, เครือข่าย Gateway และโหลด config
  ใหม่แบบรวดเร็ว
- `package`: สัญญา install/update/restart/plugin package รวมถึงหลักฐานการติดตั้ง
  skill จาก ClawHub แบบ live; นี่คือค่าเริ่มต้นของ release-check
- `product`: `package` พร้อม MCP channels, การล้าง cron/subagent, การค้นหาเว็บของ OpenAI
  และ OpenWebUI
- `full`: ชังก์ Docker release-path พร้อม OpenWebUI
- `custom`: รายการ `docker_lanes` ที่แน่นอนสำหรับการรันซ้ำแบบเจาะจง

สำหรับหลักฐาน Telegram ของ package-candidate ให้เปิดใช้ `telegram_mode=mock-openai` หรือ
`telegram_mode=live-frontier` บน Package Acceptance เวิร์กโฟลว์จะส่ง tarball
`package-under-test` ที่ resolve แล้วเข้าไปในเลน Telegram ส่วนเวิร์กโฟลว์ Telegram
แบบ standalone ยังยอมรับ spec npm ที่เผยแพร่แล้วสำหรับการตรวจสอบหลังเผยแพร่

## ระบบอัตโนมัติสำหรับเผยแพร่ release

`OpenClaw Release Publish` คือ entrypoint เผยแพร่แบบแก้ไขสถานะปกติ ซึ่ง
ประสานเวิร์กโฟลว์ trusted-publisher ตามลำดับที่ release ต้องใช้:

1. Check out แท็ก release และ resolve commit SHA ของแท็กนั้น
2. ตรวจสอบว่าแท็กเข้าถึงได้จาก `main` หรือ `release/*`
3. รัน `pnpm plugins:sync:check`
4. Dispatch `Plugin NPM Release` ด้วย `publish_scope=all-publishable` และ
   `ref=<release-sha>`
5. Dispatch `Plugin ClawHub Release` ด้วย scope และ SHA เดียวกัน
6. Dispatch `OpenClaw NPM Release` ด้วยแท็ก release, npm dist-tag และ
   `preflight_run_id` ที่บันทึกไว้

ตัวอย่างการเผยแพร่เบต้า:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

การเผยแพร่เสถียรไปยัง beta dist-tag เริ่มต้น:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

การโปรโมตเวอร์ชันเสถียรตรงไปยัง `latest` ต้องระบุอย่างชัดเจน:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

ใช้เวิร์กโฟลว์ระดับล่าง `Plugin NPM Release` และ `Plugin ClawHub Release`
เฉพาะสำหรับงานซ่อมแซมหรือเผยแพร่ซ้ำแบบเจาะจงเท่านั้น สำหรับการซ่อมแซม Plugin ที่เลือก ให้ส่ง
`plugin_publish_scope=selected` และ `plugins=@openclaw/name` ไปยัง
`OpenClaw Release Publish` หรือ dispatch เวิร์กโฟลว์ลูกโดยตรงเมื่อ
ต้องไม่เผยแพร่แพ็กเกจ OpenClaw

## อินพุตเวิร์กโฟลว์ NPM

`OpenClaw NPM Release` รับอินพุตที่ผู้ปฏิบัติงานควบคุมได้ดังนี้:

- `tag`: แท็ก release ที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1` หรือ
  `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` อาจเป็น commit SHA เต็ม
  40 อักขระปัจจุบันของ workflow-branch สำหรับ preflight แบบตรวจสอบความถูกต้องเท่านั้นได้ด้วย
- `preflight_only`: `true` สำหรับการตรวจสอบความถูกต้อง/build/package เท่านั้น, `false` สำหรับเส้นทาง
  เผยแพร่จริง
- `preflight_run_id`: จำเป็นบนเส้นทางเผยแพร่จริง เพื่อให้เวิร์กโฟลว์นำ
  tarball ที่เตรียมไว้จากการรัน preflight ที่สำเร็จกลับมาใช้
- `npm_dist_tag`: แท็กเป้าหมายของ npm สำหรับเส้นทางเผยแพร่; ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Publish` รับอินพุตที่ผู้ปฏิบัติงานควบคุมได้ดังนี้:

- `tag`: แท็ก release ที่จำเป็น; ต้องมีอยู่แล้ว
- `preflight_run_id`: id ของการรัน preflight `OpenClaw NPM Release` ที่สำเร็จ;
  จำเป็นเมื่อ `publish_openclaw_npm=true`
- `npm_dist_tag`: แท็กเป้าหมายของ npm สำหรับแพ็กเกจ OpenClaw
- `plugin_publish_scope`: ค่าเริ่มต้นคือ `all-publishable`; ใช้ `selected` เฉพาะ
  สำหรับงานซ่อมแซมแบบเจาะจง
- `plugins`: ชื่อแพ็กเกจ `@openclaw/*` คั่นด้วยจุลภาคเมื่อ
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: ค่าเริ่มต้นคือ `true`; ตั้งเป็น `false` เฉพาะเมื่อใช้
  เวิร์กโฟลว์เป็นตัวประสานงานซ่อมแซมเฉพาะ Plugin

`OpenClaw Release Checks` รับอินพุตที่ผู้ปฏิบัติงานควบคุมได้ดังนี้:

- `ref`: branch, tag หรือ commit SHA เต็มที่จะตรวจสอบความถูกต้อง การตรวจสอบที่มี secret
  ต้องให้ commit ที่ resolve แล้วเข้าถึงได้จาก branch ของ OpenClaw หรือ
  แท็ก release
- `run_release_soak`: เลือกรัน soak แบบ exhaustive live/E2E, Docker release-path และ
  all-since upgrade-survivor บน release checks แบบเสถียร/ค่าเริ่มต้น ระบบจะบังคับ
  เปิดโดย `release_profile=full`

กฎ:

- แท็กเสถียรและแท็กแก้ไขอาจเผยแพร่ไปยัง `beta` หรือ `latest` ก็ได้
- แท็ก prerelease แบบเบต้าเผยแพร่ได้เฉพาะไปยัง `beta`
- สำหรับ `OpenClaw NPM Release` อนุญาตให้ใช้อินพุต commit SHA เต็มได้เฉพาะเมื่อ
  `preflight_only=true`
- `OpenClaw Release Checks` และ `Full Release Validation` เป็นการตรวจสอบความถูกต้องเท่านั้นเสมอ
- เส้นทางเผยแพร่จริงต้องใช้ `npm_dist_tag` เดียวกับที่ใช้ระหว่าง preflight;
  เวิร์กโฟลว์จะตรวจสอบเมทาดาทานั้นก่อนดำเนินการเผยแพร่ต่อ

## ลำดับการออก npm เวอร์ชันเสถียร

เมื่อตัดเวอร์ชัน npm เสถียร:

1. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนมีแท็ก คุณอาจใช้ commit SHA เต็มปัจจุบันของ workflow-branch
     สำหรับ dry run ของเวิร์กโฟลว์ preflight แบบตรวจสอบความถูกต้องเท่านั้น
2. เลือก `npm_dist_tag=beta` สำหรับโฟลว์ปกติแบบ beta-first หรือ `latest` เฉพาะ
   เมื่อคุณตั้งใจเผยแพร่เวอร์ชันเสถียรโดยตรง
3. รัน `Full Release Validation` บน release branch, release tag หรือ commit SHA เต็ม
   เมื่อคุณต้องการ CI ปกติพร้อมความครอบคลุม live prompt cache, Docker, QA Lab,
   Matrix และ Telegram จากเวิร์กโฟลว์แบบทำด้วยตนเองเดียว
4. หากคุณตั้งใจต้องการเฉพาะกราฟทดสอบปกติแบบ deterministic ให้รัน
   เวิร์กโฟลว์ `CI` แบบทำด้วยตนเองบน release ref แทน
5. บันทึก `preflight_run_id` ที่สำเร็จ
6. รัน `OpenClaw Release Publish` ด้วย `tag` เดียวกัน, `npm_dist_tag` เดียวกัน
   และ `preflight_run_id` ที่บันทึกไว้; เวิร์กโฟลว์จะเผยแพร่ Plugin ที่แยกออกไปภายนอกไปยัง npm
   และ ClawHub ก่อนโปรโมตแพ็กเกจ npm ของ OpenClaw
7. หาก release ลงบน `beta` ให้ใช้เวิร์กโฟลว์ส่วนตัว
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   เพื่อโปรโมตเวอร์ชันเสถียรนั้นจาก `beta` ไปยัง `latest`
8. หาก release ตั้งใจเผยแพร่ตรงไปยัง `latest` และ `beta`
   ควรตาม build เสถียรเดียวกันทันที ให้ใช้เวิร์กโฟลว์ส่วนตัวเดียวกันนั้น
   เพื่อชี้ dist-tag ทั้งสองไปยังเวอร์ชันเสถียร หรือปล่อยให้ sync แบบ self-healing
   ตามกำหนดการย้าย `beta` ในภายหลัง

การแก้ไข dist-tag อยู่ใน repo ส่วนตัวด้วยเหตุผลด้านความปลอดภัย เพราะยังคง
ต้องใช้ `NPM_TOKEN` ขณะที่ repo สาธารณะคงการเผยแพร่แบบ OIDC-only ไว้

แนวทางนี้ทำให้ทั้งเส้นทางเผยแพร่โดยตรงและเส้นทางโปรโมตแบบ beta-first
มีเอกสารกำกับและมองเห็นได้สำหรับผู้ปฏิบัติงาน

หาก maintainer ต้อง fallback ไปใช้การยืนยันตัวตน npm แบบ local ให้รันคำสั่ง 1Password
CLI (`op`) เฉพาะภายใน tmux session เฉพาะเท่านั้น อย่าเรียก `op`
โดยตรงจาก shell หลักของ agent; การคงไว้ภายใน tmux ทำให้ prompts,
alerts และการจัดการ OTP สังเกตเห็นได้ และป้องกัน host alerts ซ้ำ

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

Maintainers ใช้เอกสาร release ส่วนตัวใน
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
สำหรับ runbook จริง

## ที่เกี่ยวข้อง

- [ช่องทาง release](/th/install/development-channels)
