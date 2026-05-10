---
read_when:
    - กำลังค้นหาคำจำกัดความของช่องทางการเผยแพร่สาธารณะ
    - การเรียกใช้การตรวจสอบความถูกต้องของรีลีสหรือการยอมรับแพ็กเกจ
    - กำลังมองหารูปแบบการตั้งชื่อเวอร์ชันและรอบการออกรุ่น
summary: เลนการเผยแพร่ รายการตรวจสอบสำหรับผู้ปฏิบัติงาน กล่องตรวจสอบความถูกต้อง การตั้งชื่อเวอร์ชัน และรอบเวลา
title: นโยบายการเผยแพร่
x-i18n:
    generated_at: "2026-05-10T19:55:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ac11cfd0b5b1ebcc2fc010463c60e257a7e51802116b4b86d38d3a0da8a1dab
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw มีเลนการเผยแพร่สาธารณะสามเลน:

- stable: รุ่นเผยแพร่ที่มีแท็ก ซึ่งเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อมีการร้องขออย่างชัดเจน
- beta: แท็ก prerelease ที่เผยแพร่ไปยัง npm `beta`
- dev: หัวล่าสุดที่เปลี่ยนแปลงอยู่ของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันรุ่น stable: `YYYY.M.D`
  - แท็ก Git: `vYYYY.M.D`
- เวอร์ชันรุ่นแก้ไข stable: `YYYY.M.D-N`
  - แท็ก Git: `vYYYY.M.D-N`
- เวอร์ชัน beta prerelease: `YYYY.M.D-beta.N`
  - แท็ก Git: `vYYYY.M.D-beta.N`
- อย่าเติมศูนย์นำหน้าเดือนหรือวัน
- `latest` หมายถึงรุ่นเผยแพร่ stable ของ npm ที่ได้รับการโปรโมตในปัจจุบัน
- `beta` หมายถึงเป้าหมายการติดตั้ง beta ปัจจุบัน
- รุ่น stable และรุ่นแก้ไข stable เผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น; ผู้ดำเนินการเผยแพร่สามารถกำหนดเป้าหมายเป็น `latest` อย่างชัดเจน หรือโปรโมตบิลด์ beta ที่ตรวจสอบแล้วในภายหลัง
- ทุกการเผยแพร่ stable ของ OpenClaw จะส่งแพ็กเกจ npm และแอป macOS พร้อมกัน;
  โดยปกติรุ่น beta จะตรวจสอบและเผยแพร่เส้นทาง npm/แพ็กเกจก่อน โดยสงวน
  การบิลด์/ลงนาม/notarize แอป mac ไว้สำหรับ stable เว้นแต่จะมีการร้องขออย่างชัดเจน

## จังหวะการเผยแพร่

- การเผยแพร่จะเดินหน้าแบบ beta-first
- stable จะตามมาเฉพาะหลังจาก beta ล่าสุดได้รับการตรวจสอบแล้ว
- โดยปกติผู้ดูแลจะตัดรุ่นจากแบรนช์ `release/YYYY.M.D` ที่สร้างขึ้น
  จาก `main` ปัจจุบัน เพื่อให้การตรวจสอบและการแก้ไขสำหรับการเผยแพร่ไม่บล็อก
  การพัฒนาใหม่บน `main`
- หากแท็ก beta ถูก push หรือเผยแพร่แล้วและต้องการการแก้ไข ผู้ดูแลจะตัด
  แท็ก `-beta.N` ถัดไปแทนการลบหรือสร้างแท็ก beta เดิมใหม่
- ขั้นตอนการเผยแพร่โดยละเอียด การอนุมัติ ข้อมูลประจำตัว และบันทึกการกู้คืน
  เป็นข้อมูลสำหรับผู้ดูแลเท่านั้น

## เช็กลิสต์ผู้ดำเนินการเผยแพร่

เช็กลิสต์นี้คือรูปแบบสาธารณะของโฟลว์การเผยแพร่ ข้อมูลประจำตัวส่วนตัว,
การลงนาม, notarization, การกู้คืน dist-tag และรายละเอียดการ rollback ฉุกเฉินจะอยู่ใน
runbook การเผยแพร่สำหรับผู้ดูแลเท่านั้น

1. เริ่มจาก `main` ปัจจุบัน: pull ล่าสุด, ยืนยันว่า commit เป้าหมายถูก push แล้ว,
   และยืนยันว่า CI ของ `main` ปัจจุบันเขียวพอที่จะสร้างแบรนช์จากมันได้
2. เขียนส่วนบนสุดของ `CHANGELOG.md` ใหม่จากประวัติ commit จริงด้วย
   `/changelog`, รักษารายการให้เน้นผู้ใช้, commit, push และ rebase/pull
   อีกครั้งก่อนสร้างแบรนช์
3. ตรวจสอบระเบียนความเข้ากันได้ของรุ่นเผยแพร่ใน
   `src/plugins/compat/registry.ts` และ
   `src/commands/doctor/shared/deprecation-compat.ts` ลบความเข้ากันได้
   ที่หมดอายุเฉพาะเมื่อเส้นทางอัปเกรดยังคงครอบคลุมอยู่ หรือบันทึกเหตุผลว่าเหตุใดจึง
   ตั้งใจคงไว้
4. สร้าง `release/YYYY.M.D` จาก `main` ปัจจุบัน; อย่าทำงานเผยแพร่ตามปกติ
   โดยตรงบน `main`
5. เพิ่มเวอร์ชันในทุกตำแหน่งที่จำเป็นสำหรับแท็กที่ตั้งใจไว้ จากนั้นรัน
   `pnpm release:prep` คำสั่งนี้จะรีเฟรชเวอร์ชัน Plugin, รายการ Plugin, สคีมาคอนฟิก,
   เมตาดาต้าคอนฟิกของช่องทางที่ bundled, baseline เอกสารคอนฟิก, การ export ของ Plugin SDK,
   และ baseline API ของ Plugin SDK ตามลำดับที่ถูกต้อง Commit drift ที่สร้างขึ้นทั้งหมด
   ก่อนแท็ก จากนั้นรัน preflight แบบ deterministic ในเครื่อง:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, และ `pnpm release:check`
6. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true` ก่อนมีแท็ก
   SHA ของแบรนช์ release แบบเต็ม 40 ตัวอักษรสามารถใช้สำหรับ preflight
   เพื่อการตรวจสอบเท่านั้นได้ บันทึก `preflight_run_id` ที่สำเร็จไว้
7. เริ่มการทดสอบ pre-release ทั้งหมดด้วย `Full Release Validation` สำหรับ
   แบรนช์ release, แท็ก หรือ SHA commit แบบเต็ม นี่คือ entrypoint แบบแมนนวลเดียว
   สำหรับกล่องทดสอบการเผยแพร่ขนาดใหญ่สี่ชุด: Vitest, Docker, QA Lab และ Package
8. หากการตรวจสอบล้มเหลว ให้แก้ไขบนแบรนช์ release และรันซ้ำเฉพาะไฟล์, lane,
   workflow job, package profile, provider หรือ model allowlist ที่ล้มเหลวเล็กที่สุด
   ซึ่งพิสูจน์การแก้ไขได้ รัน umbrella แบบเต็มซ้ำเฉพาะเมื่อพื้นผิวที่เปลี่ยนทำให้
   หลักฐานเดิมล้าสมัย
9. สำหรับ beta ให้แท็ก `vYYYY.M.D-beta.N` จากนั้นรัน `OpenClaw Release Publish` จาก
   แบรนช์ `release/YYYY.M.D` ที่ตรงกัน คำสั่งนี้ตรวจสอบ `pnpm plugins:sync:check`,
   dispatch แพ็กเกจ Plugin ที่เผยแพร่ได้ทั้งหมดไปยัง npm และชุดเดียวกันไปยัง
   ClawHub แบบขนาน จากนั้นโปรโมต artifact preflight ของ OpenClaw npm ที่เตรียมไว้
   ด้วย dist-tag ที่ตรงกันทันทีเมื่อการเผยแพร่ Plugin ไปยัง npm สำเร็จ
   หลังจาก child ของการเผยแพร่ OpenClaw npm สำเร็จ จะสร้างหรืออัปเดต
   หน้า GitHub release/prerelease ที่ตรงกันจากส่วน `CHANGELOG.md` ที่ตรงกันทั้งหมด
   รุ่น stable ที่เผยแพร่ไปยัง npm `latest` จะกลายเป็น GitHub latest release;
   รุ่นบำรุงรักษา stable ที่คงไว้บน npm `beta` จะถูกสร้างด้วย GitHub `latest=false`.
   การเผยแพร่ ClawHub อาจยังทำงานอยู่ขณะที่ OpenClaw npm เผยแพร่ แต่ workflow
   การเผยแพร่จะพิมพ์ child run IDs ออกมาทันที โดยค่าเริ่มต้นจะไม่รอ ClawHub
   หลังจาก dispatch แล้ว ดังนั้นความพร้อมใช้งานของ OpenClaw npm จะไม่ถูกบล็อก
   โดยการอนุมัติ ClawHub หรือ registry ที่ช้ากว่า; ตั้งค่า
   `wait_for_clawhub=true` เมื่อ ClawHub ต้องบล็อกการเสร็จสิ้นของ workflow
   เส้นทาง ClawHub จะ retry ความล้มเหลวชั่วคราวของการติดตั้ง dependency ของ CLI,
   เผยแพร่ Plugin ที่ผ่าน preview แม้เมื่อ preview cell หนึ่งสะดุด และจบด้วย
   การตรวจสอบ registry สำหรับทุกเวอร์ชัน Plugin ที่คาดไว้ เพื่อให้การเผยแพร่บางส่วน
   ยังคงมองเห็นได้และ retry ได้ หลังเผยแพร่ ให้รัน
   package acceptance หลังเผยแพร่
   กับแพ็กเกจ `openclaw@YYYY.M.D-beta.N` หรือ
   `openclaw@beta` ที่เผยแพร่แล้ว หาก prerelease ที่ push หรือเผยแพร่แล้วต้องการการแก้ไข
   ให้ตัดหมายเลข prerelease ถัดไปที่ตรงกัน; อย่าลบหรือเขียน prerelease เดิมใหม่
10. สำหรับ stable ให้ดำเนินการต่อเฉพาะหลังจาก beta หรือ release candidate ที่ตรวจสอบแล้วมี
    หลักฐานการตรวจสอบที่จำเป็น การเผยแพร่ stable ไปยัง npm ยังผ่าน
    `OpenClaw Release Publish` โดยใช้ artifact preflight ที่สำเร็จซ้ำผ่าน
    `preflight_run_id`; ความพร้อมของรุ่น macOS แบบ stable ยังต้องมี
    `.zip`, `.dmg`, `.dSYM.zip` ที่จัดแพ็กเกจแล้ว และ `appcast.xml` ที่อัปเดตบน `main`
    workflow เผยแพร่ macOS ส่วนตัวจะเผยแพร่ appcast ที่ลงนามแล้วไปยัง
    `main` สาธารณะโดยอัตโนมัติหลังจาก release assets ผ่านการตรวจสอบ; หาก branch protection บล็อก
    การ push โดยตรง จะเปิดหรืออัปเดต PR สำหรับ appcast
11. หลังเผยแพร่ ให้รันตัวตรวจสอบหลังเผยแพร่ของ npm, E2E Telegram แบบ standalone
    published-npm ที่เป็นทางเลือกเมื่อคุณต้องการหลักฐานช่องทางหลังเผยแพร่,
    การโปรโมต dist-tag เมื่อจำเป็น, ตรวจสอบหน้า GitHub release ที่สร้างขึ้น,
    และรันขั้นตอนประกาศการเผยแพร่

## Release preflight

- รัน `pnpm check:test-types` ก่อนการตรวจสอบก่อนปล่อยเวอร์ชัน เพื่อให้ TypeScript ของการทดสอบยังคง
  ครอบคลุมอยู่นอก gate `pnpm check` แบบเร็วในเครื่อง
- รัน `pnpm check:architecture` ก่อนการตรวจสอบก่อนปล่อยเวอร์ชัน เพื่อให้การตรวจสอบวงจร
  การนำเข้าและขอบเขตสถาปัตยกรรมที่กว้างขึ้นผ่านอยู่นอก gate แบบเร็วในเครื่อง
- รัน `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้ artifact สำหรับปล่อยเวอร์ชัน
  `dist/*` ที่คาดไว้และบันเดิล Control UI มีอยู่สำหรับขั้นตอนตรวจสอบความถูกต้องของแพ็ก
- รัน `pnpm release:prep` หลังจากการ bump เวอร์ชันที่ root และก่อนการติดแท็ก คำสั่งนี้
  จะรันตัวสร้างสำหรับการปล่อยเวอร์ชันแบบกำหนดผลลัพธ์ได้ทุกตัวที่มักคลาดเคลื่อนหลังจาก
  การเปลี่ยนแปลงเวอร์ชัน/config/API: เวอร์ชัน Plugin, inventory ของ Plugin, สกีมา base config,
  metadata ของ config สำหรับ channel ที่บันเดิลมา, baseline ของเอกสาร config, การ export ของ plugin SDK,
  และ baseline API ของ plugin SDK `pnpm release:check` จะรัน guard เหล่านั้นซ้ำ
  ในโหมดตรวจสอบ และรายงานความล้มเหลวจาก drift ที่สร้างขึ้นทั้งหมดที่พบในรอบเดียว
  ก่อนรันการตรวจสอบการปล่อยแพ็กเกจ
- รัน workflow แบบ manual `Full Release Validation` ก่อนอนุมัติการปล่อยเวอร์ชัน เพื่อ
  เริ่มกล่องทดสอบก่อนปล่อยเวอร์ชันทั้งหมดจาก entrypoint เดียว รองรับ branch,
  tag, หรือ SHA ของ commit แบบเต็ม, dispatch `CI` แบบ manual, และ dispatch
  `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, การตรวจสอบแพ็กเกจข้าม OS,
  ความเท่าเทียมของ QA Lab, Matrix, และ lane ของ Telegram การรัน stable/default
  จะเก็บ exhaustive live/E2E และ Docker release-path soak ไว้หลัง
  `run_release_soak=true`; `release_profile=full` จะบังคับเปิด soak เมื่อใช้
  `release_profile=full` และ `rerun_group=all` จะรัน package Telegram
  E2E กับ artifact `release-package-under-test` จาก release checks ด้วย
  ระบุ `npm_telegram_package_spec` หลังเผยแพร่เมื่อ Telegram E2E เดียวกัน
  ควรพิสูจน์แพ็กเกจ npm ที่เผยแพร่แล้วด้วย ระบุ
  `package_acceptance_package_spec` หลังเผยแพร่เมื่อ Package Acceptance
  ควรรัน matrix แพ็กเกจ/อัปเดตกับแพ็กเกจ npm ที่ส่งออกแล้วแทน
  artifact ที่ build จาก SHA ระบุ
  `evidence_package_spec` เมื่อรายงานหลักฐานแบบ private ควรพิสูจน์ว่า
  การตรวจสอบตรงกับแพ็กเกจ npm ที่เผยแพร่แล้วโดยไม่บังคับ Telegram E2E
  ตัวอย่าง:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- รัน workflow แบบ manual `Package Acceptance` เมื่อต้องการหลักฐาน side-channel
  สำหรับ candidate ของแพ็กเกจในขณะที่งานปล่อยเวอร์ชันยังดำเนินต่อ ใช้ `source=npm` สำหรับ
  `openclaw@beta`, `openclaw@latest`, หรือเวอร์ชันปล่อยที่ระบุแน่นอน; `source=ref`
  เพื่อแพ็ก branch/tag/SHA ของ `package_ref` ที่เชื่อถือได้ด้วย harness
  `workflow_ref` ปัจจุบัน; `source=url` สำหรับ tarball HTTPS พร้อม
  SHA-256 ที่จำเป็น; หรือ `source=artifact` สำหรับ tarball ที่อัปโหลดโดย GitHub
  Actions run อื่น workflow จะแปลง candidate เป็น
  `package-under-test`, ใช้ Docker E2E release scheduler ซ้ำกับ
  tarball นั้น, และสามารถรัน Telegram QA กับ tarball เดียวกันด้วย
  `telegram_mode=mock-openai` หรือ `telegram_mode=live-frontier` เมื่อ
  Docker lane ที่เลือกมี `published-upgrade-survivor` artifact ของแพ็กเกจ
  จะเป็น candidate และ `published_upgrade_survivor_baseline` เลือก
  baseline ที่เผยแพร่แล้ว `update-restart-auth` ใช้แพ็กเกจ candidate เป็น
  ทั้ง CLI ที่ติดตั้งและ package-under-test จึงทดสอบเส้นทาง managed restart
  ของคำสั่งอัปเดตของ candidate
  ตัวอย่าง: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  โปรไฟล์ทั่วไป:
  - `smoke`: lane สำหรับ install/channel/agent, เครือข่าย Gateway, และการ reload config
  - `package`: lane แบบ package/update/restart/plugin ที่อิง artifact โดยตรง โดยไม่มี OpenWebUI หรือ ClawHub live
  - `product`: โปรไฟล์ package รวมกับ MCP channels, การ cleanup cron/subagent,
    OpenAI web search, และ OpenWebUI
  - `full`: ชุดย่อย Docker release-path พร้อม OpenWebUI
  - `custom`: การเลือก `docker_lanes` แบบระบุแน่นอนสำหรับการรันซ้ำแบบเจาะจง
- รัน workflow แบบ manual `CI` โดยตรงเมื่อคุณต้องการเพียง coverage ของ CI ปกติแบบเต็ม
  สำหรับ release candidate การ dispatch CI แบบ manual จะข้าม changed
  scoping และบังคับ lane Linux Node shards, bundled-plugin shards, channel
  contracts, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke,
  การตรวจสอบเอกสาร, Python skills, Windows, macOS, Android, และ Control UI i18n
  ตัวอย่าง: `gh workflow run ci.yml --ref release/YYYY.M.D`
- รัน `pnpm qa:otel:smoke` เมื่อตรวจสอบ release telemetry คำสั่งนี้ทดสอบ
  QA-lab ผ่านตัวรับ OTLP/HTTP ในเครื่อง และตรวจสอบชื่อ span ของ trace ที่ export,
  attribute ที่ถูกจำกัดขอบเขต, และการ redact เนื้อหา/identifier โดยไม่ต้องใช้
  Opik, Langfuse, หรือ collector ภายนอกอื่น
- รัน `pnpm release:check` ก่อนการปล่อยเวอร์ชันที่ติดแท็กทุกครั้ง
- รัน `OpenClaw Release Publish` สำหรับลำดับการ publish ที่เปลี่ยนแปลงสถานะหลังจาก
  มี tag แล้ว Dispatch จาก `release/YYYY.M.D` (หรือ `main` เมื่อเผยแพร่ tag
  ที่เข้าถึงได้จาก main), ส่ง release tag และ OpenClaw npm
  `preflight_run_id` ที่สำเร็จ, และคง scope การ publish Plugin เริ่มต้น
  `all-publishable` เว้นแต่คุณตั้งใจรันการซ่อมแบบเจาะจง workflow
  จะจัดลำดับ plugin npm publish, plugin ClawHub publish, และ OpenClaw
  npm publish เพื่อไม่ให้แพ็กเกจ core ถูกเผยแพร่ก่อน Plugin ที่ externalized
- ขณะนี้ release checks รันใน workflow แบบ manual แยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรัน lane QA Lab mock parity รวมถึงโปรไฟล์
  fast live Matrix และ lane Telegram QA ก่อนอนุมัติการปล่อยเวอร์ชัน lane แบบ live
  ใช้ environment `qa-live-shared`; Telegram ยังใช้ lease credential ของ Convex CI ด้วย
  รัน workflow แบบ manual `QA-Lab - All Lanes` ด้วย
  `matrix_profile=all` และ `matrix_shards=true` เมื่อต้องการ inventory ของ Matrix
  transport, media, และ E2EE แบบเต็มพร้อมกัน
- การตรวจสอบ runtime สำหรับการติดตั้งและการอัปเกรดข้าม OS เป็นส่วนหนึ่งของ
  `OpenClaw Release Checks` และ `Full Release Validation` แบบ public ซึ่งเรียก
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` โดยตรง
- การแยกนี้ตั้งใจทำ: รักษาเส้นทาง npm release จริงให้สั้น,
  กำหนดผลลัพธ์ได้, และเน้น artifact ขณะที่การตรวจสอบ live ที่ช้ากว่าอยู่ใน lane
  ของตัวเอง เพื่อไม่ให้หน่วงหรือบล็อกการ publish
- การตรวจสอบ release ที่มี secret ควร dispatch ผ่าน `Full Release
Validation` หรือจาก workflow ref `main`/release เพื่อให้ตรรกะของ workflow และ
  secret อยู่ภายใต้การควบคุม
- `OpenClaw Release Checks` รองรับ branch, tag, หรือ SHA ของ commit แบบเต็ม ตราบใด
  ที่ commit ที่ resolve ได้เข้าถึงได้จาก branch ของ OpenClaw หรือ release tag
- preflight แบบ validation-only ของ `OpenClaw NPM Release` ยังรองรับ SHA ของ commit
  branch workflow ปัจจุบันแบบเต็ม 40 อักขระ โดยไม่ต้องมี tag ที่ push แล้ว
- เส้นทาง SHA นั้นเป็น validation-only และไม่สามารถ promote เป็นการ publish จริงได้
- ในโหมด SHA workflow จะสร้าง `v<package.json version>` ขึ้นเฉพาะสำหรับการตรวจสอบ
  metadata ของแพ็กเกจเท่านั้น; การ publish จริงยังต้องใช้ release tag จริง
- ทั้งสอง workflow คงเส้นทาง publish และ promotion จริงไว้บน GitHub-hosted
  runners ขณะที่เส้นทาง validation ที่ไม่เปลี่ยนแปลงสถานะสามารถใช้
  Blacksmith Linux runners ที่ใหญ่กว่าได้
- workflow นั้นรัน
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ workflow secrets ทั้ง `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- npm release preflight ไม่รอ lane release checks แยกต่างหากอีกต่อไป
- รัน `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือ tag beta/correction ที่ตรงกัน) ก่อนอนุมัติ
- หลัง npm publish ให้รัน
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (หรือเวอร์ชัน beta/correction ที่ตรงกัน) เพื่อตรวจสอบเส้นทางติดตั้ง registry
  ที่เผยแพร่แล้วใน temp prefix ใหม่
- หลัง beta publish ให้รัน `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  เพื่อตรวจสอบ onboarding ของแพ็กเกจที่ติดตั้ง, การตั้งค่า Telegram, และ Telegram E2E จริง
  กับแพ็กเกจ npm ที่เผยแพร่แล้วโดยใช้พูล credential Telegram แบบ lease ร่วม
  การรันครั้งเดียวในเครื่องของ maintainer อาจละเว้น Convex vars และส่ง credential env
  `OPENCLAW_QA_TELEGRAM_*` ทั้งสามโดยตรงได้
- เพื่อรัน post-publish beta smoke แบบเต็มจากเครื่องของ maintainer ให้ใช้ `pnpm release:beta-smoke -- --beta betaN` helper จะรันการตรวจสอบ Parallels npm update/fresh-target, dispatch `NPM Telegram Beta E2E`, poll workflow run ที่ตรงกัน, ดาวน์โหลด artifact, และพิมพ์รายงาน Telegram
- maintainer สามารถรันการตรวจสอบ post-publish เดียวกันจาก GitHub Actions ผ่าน
  workflow แบบ manual `NPM Telegram Beta E2E` ได้ ตั้งใจให้เป็น manual-only และ
  ไม่รันทุกครั้งที่ merge
- ระบบอัตโนมัติสำหรับ release ของ maintainer ตอนนี้ใช้ preflight-then-promote:
  - การ publish npm จริงต้องผ่าน npm `preflight_run_id` ที่สำเร็จ
  - การ publish npm จริงต้อง dispatch จาก branch `main` หรือ
    `release/YYYY.M.D` เดียวกันกับ preflight run ที่สำเร็จ
  - stable npm releases ตั้งค่าเริ่มต้นเป็น `beta`
  - stable npm publish สามารถ target `latest` อย่างชัดเจนผ่าน workflow input
  - การเปลี่ยน npm dist-tag แบบ token-based ตอนนี้อยู่ใน
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    เพื่อความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่
    repo public คงการ publish แบบ OIDC-only
  - `macOS Release` แบบ public เป็น validation-only; เมื่อ tag มีอยู่เฉพาะบน
    release branch แต่ workflow ถูก dispatch จาก `main` ให้ตั้ง
    `public_release_branch=release/YYYY.M.D`
  - การ publish mac แบบ private จริงต้องผ่าน `preflight_run_id` และ `validate_run_id`
    ของ private mac ที่สำเร็จ
  - เส้นทาง publish จริงจะ promote artifact ที่เตรียมไว้แทนการ rebuild
    อีกครั้ง
- สำหรับ release correction แบบ stable เช่น `YYYY.M.D-N` ตัวตรวจสอบ post-publish
  ยังตรวจสอบเส้นทางอัปเกรดแบบ temp-prefix เดียวกันจาก `YYYY.M.D` เป็น `YYYY.M.D-N`
  เพื่อให้ release correction ไม่สามารถปล่อยให้การติดตั้ง global รุ่นเก่าค้างอยู่บน
  payload stable ฐานอย่างเงียบ ๆ ได้
- npm release preflight จะ fail closed เว้นแต่ tarball จะมีทั้ง
  `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่าง
  เพื่อไม่ให้เราส่ง browser dashboard ว่างออกไปอีก
- การตรวจสอบ post-publish ยังตรวจสอบว่า entrypoint ของ Plugin ที่เผยแพร่แล้วและ
  metadata ของแพ็กเกจมีอยู่ใน layout ของ registry ที่ติดตั้งแล้ว release ที่
  ส่ง payload runtime ของ Plugin ขาดหายจะทำให้ postpublish verifier ล้มเหลวและ
  ไม่สามารถ promote เป็น `latest` ได้
- `pnpm test:install:smoke` ยังบังคับใช้งบประมาณ `unpackedSize` ของ npm pack บน
  tarball อัปเดต candidate ด้วย ดังนั้น installer e2e จะจับ pack bloat ที่เกิดโดยไม่ตั้งใจ
  ก่อนเส้นทาง release publish
- หากงาน release แตะการวางแผน CI, manifest timing ของ extension, หรือ
  matrix การทดสอบ extension ให้สร้างใหม่และรีวิว output matrix
  `plugin-prerelease-extension-shard` ที่ planner เป็นเจ้าของจาก
  `.github/workflows/plugin-prerelease.yml` ก่อนอนุมัติ เพื่อให้ release notes
  ไม่อธิบาย layout CI ที่ล้าสมัย
- ความพร้อมของ stable macOS release ยังรวมถึง surface ของ updater:
  - GitHub release ต้องลงท้ายด้วย `.zip`, `.dmg`, และ `.dSYM.zip` ที่แพ็กไว้
  - `appcast.xml` บน `main` ต้องชี้ไปยัง stable zip ใหม่หลัง publish;
    workflow publish macOS แบบ private จะ commit โดยอัตโนมัติ หรือเปิด appcast
    PR เมื่อ direct push ถูกบล็อก
  - แอปที่แพ็กแล้วต้องคง bundle id ที่ไม่ใช่ debug, Sparkle feed
    URL ที่ไม่ว่าง, และ `CFBundleVersion` ที่เท่ากับหรือสูงกว่า canonical Sparkle build floor
    สำหรับเวอร์ชัน release นั้น

## กล่องทดสอบ Release

`Full Release Validation` คือวิธีที่ operator ใช้เริ่มการทดสอบก่อนปล่อยเวอร์ชันทั้งหมดจาก
entrypoint เดียว สำหรับหลักฐาน commit ที่ pin ไว้บน branch ที่เคลื่อนไหวเร็ว ให้ใช้
helper เพื่อให้ workflow ลูกทุกตัวรันจาก branch ชั่วคราวที่ตรึงไว้กับ SHA เป้าหมาย:

```bash
pnpm ci:full-release --sha <full-sha>
```

ตัวช่วยจะ push `release-ci/<sha>-...`, dispatch `Full Release Validation`
จาก branch นั้นด้วย `ref=<sha>`, ตรวจสอบว่า workflow ลูกทุกตัวมี `headSha`
ตรงกับเป้าหมาย แล้วลบ branch ชั่วคราว วิธีนี้หลีกเลี่ยงการพิสูจน์ child run
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
หลัก `release-package-under-test` สำหรับการตรวจสอบที่เกี่ยวข้องกับ package และ
dispatch package Telegram E2E แบบ standalone เมื่อ `release_profile=full` พร้อม
`rerun_group=all` หรือเมื่อมีการตั้งค่า `npm_telegram_package_spec` แล้ว `OpenClaw Release
Checks` จะกระจายไปยัง install smoke, cross-OS release checks, live/E2E Docker
release-path coverage เมื่อเปิดใช้ soak, Package Acceptance พร้อม Telegram
package QA, QA Lab parity, live Matrix และ live Telegram การรันแบบเต็มจะยอมรับได้ก็ต่อเมื่อ
summary ของ `Full Release Validation`
แสดงว่า `normal_ci` และ `release_checks` สำเร็จแล้วเท่านั้น ในโหมด full/all
child `npm_telegram` ต้องสำเร็จด้วย นอกเหนือจาก full/all จะถูกข้าม
เว้นแต่จะมีการระบุ `npm_telegram_package_spec` ที่เผยแพร่แล้ว summary ของ verifier
สุดท้ายมีตาราง job ที่ช้าที่สุดสำหรับ child run แต่ละตัว เพื่อให้ release manager
เห็น critical path ปัจจุบันโดยไม่ต้องดาวน์โหลด logs
ดู [การตรวจสอบ release แบบเต็ม](/th/reference/full-release-validation) สำหรับ
stage matrix ฉบับสมบูรณ์, ชื่อ workflow job ที่แน่นอน, ความแตกต่างระหว่าง profile
stable กับ full, artifacts และ handle สำหรับ rerun แบบเจาะจง
child workflows จะถูก dispatch จาก ref ที่เชื่อถือได้ซึ่งรัน `Full Release
Validation` โดยปกติคือ `--ref main` แม้เมื่อ target `ref` ชี้ไปยัง
release branch หรือ tag ที่เก่ากว่า ไม่มี input workflow-ref แยกต่างหากสำหรับ Full Release Validation
ให้เลือก harness ที่เชื่อถือได้ด้วยการเลือก workflow run ref
อย่าใช้ `--ref main -f ref=<sha>` สำหรับหลักฐาน commit ที่แน่นอนบน `main` ที่เคลื่อนที่ได้
เพราะ raw commit SHA ไม่สามารถเป็น workflow dispatch ref ได้ ดังนั้นให้ใช้
`pnpm ci:full-release --sha <sha>` เพื่อสร้าง branch ชั่วคราวแบบ pinned

ใช้ `release_profile` เพื่อเลือกขอบเขต live/provider:

- `minimum`: เส้นทาง OpenAI/core live และ Docker ที่จำเป็นต่อ release ที่เร็วที่สุด
- `stable`: minimum พร้อม coverage provider/backend แบบ stable สำหรับการอนุมัติ release
- `full`: stable พร้อม coverage provider/media เชิง advisory ที่กว้างขึ้น

ใช้ `run_release_soak=true` กับ `stable` เมื่อ lane ที่ block release เป็นสีเขียว
และคุณต้องการ live/E2E แบบละเอียด, Docker release-path และ
published upgrade-survivor sweep แบบจำกัดขอบเขตก่อน promotion sweep นั้นครอบคลุม
package stable ล่าสุดสี่ตัว พร้อม baseline แบบ pinned `2026.4.23` และ `2026.5.2`
รวมถึง coverage เก่ากว่า `2026.4.15` โดยลบ baseline ที่ซ้ำออก และ shard
baseline แต่ละตัวเป็น Docker runner job ของตัวเอง `full` จะ imply
`run_release_soak=true`

`OpenClaw Release Checks` ใช้ workflow ref ที่เชื่อถือได้เพื่อ resolve target
ref หนึ่งครั้งเป็น `release-package-under-test` และ reuse artifact นั้นใน cross-OS,
Package Acceptance และ release-path Docker checks เมื่อ soak รัน วิธีนี้ทำให้
box ที่เกี่ยวข้องกับ package ทั้งหมดใช้ bytes ชุดเดียวกันและหลีกเลี่ยงการ build package ซ้ำ
OpenAI install smoke แบบ cross-OS ใช้ `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อมีการตั้งค่า
repo/org variable มิฉะนั้นใช้ `openai/gpt-5.4` เพราะ lane นี้กำลังพิสูจน์
package install, onboarding, gateway startup และ live agent turn หนึ่งครั้ง
แทนที่จะ benchmark model default ที่ช้าที่สุด ส่วน live provider matrix ที่กว้างกว่า
ยังคงเป็นที่สำหรับ coverage เฉพาะ model

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

อย่าใช้ umbrella แบบเต็มเป็น rerun แรกหลังการแก้แบบเจาะจง หาก box หนึ่งล้มเหลว
ให้ใช้ workflow ลูก, job, Docker lane, package profile, model
provider หรือ QA lane ที่ล้มเหลวสำหรับหลักฐานถัดไป รัน umbrella แบบเต็มอีกครั้งเฉพาะเมื่อ
การแก้เปลี่ยน release orchestration ร่วมกัน หรือทำให้หลักฐาน all-box ก่อนหน้า
ล้าสมัย verifier สุดท้ายของ umbrella จะตรวจสอบ workflow run
ids ของ child ที่บันทึกไว้อีกครั้ง ดังนั้นหลังจาก rerun child workflow สำเร็จแล้ว ให้ rerun เฉพาะ
parent job `Verify full validation` ที่ล้มเหลว

สำหรับการกู้คืนแบบจำกัดขอบเขต ให้ส่ง `rerun_group` ไปยัง umbrella `all` คือการรัน
release-candidate จริง, `ci` รันเฉพาะ child ของ normal CI, `plugin-prerelease`
รันเฉพาะ child เฉพาะ release ของ Plugin, `release-checks` รัน release
box ทุกตัว และ release groups ที่แคบกว่าคือ `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` และ `npm-telegram`
rerun `npm-telegram` แบบเจาะจงต้องใช้ `npm_telegram_package_spec`; การรัน full/all
ด้วย `release_profile=full` จะใช้ artifact package ของ release-checks rerun
cross-OS แบบเจาะจงสามารถเพิ่ม `cross_os_suite_filter=windows/packaged-upgrade` หรือ
filter OS/suite อื่นได้ ความล้มเหลวของ QA release-check เป็น advisory; ความล้มเหลวเฉพาะ QA
จะไม่ block release validation

### Vitest

box Vitest คือ workflow ลูก `CI` แบบ manual Manual CI ตั้งใจ
ข้าม changed scoping และบังคับใช้กราฟทดสอบปกติสำหรับ release
candidate: Linux Node shards, bundled-Plugin shards, channel contracts, Node 22
compatibility, `check`, `check-additional`, build smoke, docs checks, Python
Skills, Windows, macOS, Android และ Control UI i18n

ใช้ box นี้เพื่อตอบว่า "source tree ผ่าน full normal test suite หรือไม่?"
มันไม่เหมือนกับการตรวจสอบ product แบบ release-path หลักฐานที่ควรเก็บ:

- summary `Full Release Validation` ที่แสดง URL ของ run `CI` ที่ dispatch
- run `CI` เป็นสีเขียวบน target SHA ที่แน่นอน
- ชื่อ shard ที่ล้มเหลวหรือช้า จาก CI jobs เมื่อสืบสวน regression
- artifact timing ของ Vitest เช่น `.artifacts/vitest-shard-timings.json` เมื่อ
  run ต้องการการวิเคราะห์ performance

รัน manual CI โดยตรงเฉพาะเมื่อ release ต้องการ normal CI ที่ deterministic แต่
ไม่ต้องการ box Docker, QA Lab, live, cross-OS หรือ package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

box Docker อยู่ใน `OpenClaw Release Checks` ผ่าน
`openclaw-live-and-e2e-checks-reusable.yml` รวมถึง workflow
`install-smoke` แบบ release-mode มันตรวจสอบ release candidate ผ่านสภาพแวดล้อม
Docker แบบ packaged แทนที่จะเป็นเพียงการทดสอบระดับ source

coverage Docker ของ release ประกอบด้วย:

- install smoke แบบเต็มโดยเปิดใช้ slow Bun global install smoke
- การเตรียม/reuse image smoke ของ root Dockerfile ตาม target SHA พร้อม QR,
  root/gateway และ installer/Bun smoke jobs ที่รันเป็น install-smoke
  shards แยกกัน
- repository E2E lanes
- release-path Docker chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` และ `plugins-runtime-install-h`
- coverage OpenWebUI ภายใน chunk `plugins-runtime-services` เมื่อร้องขอ
- lane ติดตั้ง/ถอนการติดตั้ง bundled Plugin แบบแยก
  `bundled-plugin-install-uninstall-0` ถึง
  `bundled-plugin-install-uninstall-23`
- ชุด provider live/E2E และ coverage model live ของ Docker เมื่อ release checks
  รวมชุด live

ใช้ Docker artifacts ก่อน rerun scheduler ของ release-path จะอัปโหลด
`.artifacts/docker-tests/` พร้อม lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON และคำสั่ง rerun สำหรับการกู้คืนแบบเจาะจง
ให้ใช้ `docker_lanes=<lane[,lane]>` บน workflow live/E2E ที่ reusable แทนการ
rerun release chunks ทั้งหมด คำสั่ง rerun ที่ generate จะรวม
`package_artifact_run_id` ก่อนหน้าและ input ของ Docker image ที่เตรียมไว้เมื่อมีอยู่ เพื่อให้
lane ที่ล้มเหลวสามารถ reuse tarball และ GHCR images ชุดเดิมได้

### QA Lab

box QA Lab ก็เป็นส่วนหนึ่งของ `OpenClaw Release Checks` เช่นกัน มันคือ gate
ของพฤติกรรม agentic และระดับ channel สำหรับ release แยกจาก Vitest และกลไก
package ของ Docker

coverage QA Lab ของ release ประกอบด้วย:

- lane mock parity ที่เปรียบเทียบ lane candidate ของ OpenAI กับ baseline Opus 4.6
  โดยใช้ agentic parity pack
- profile Matrix QA แบบ live เร็วโดยใช้ environment `qa-live-shared`
- lane Telegram QA แบบ live โดยใช้ credential leases ของ Convex CI
- `pnpm qa:otel:smoke` เมื่อ release telemetry ต้องการหลักฐาน local ที่ชัดเจน

ใช้ box นี้เพื่อตอบว่า "release ทำงานถูกต้องในสถานการณ์ QA และ
live channel flows หรือไม่?" เก็บ URL artifact สำหรับ lane parity, Matrix และ Telegram
เมื่ออนุมัติ release coverage Matrix แบบเต็มยังคงพร้อมใช้งานในฐานะ
QA-Lab run แบบ manual sharded แทนที่จะเป็น lane เริ่มต้นที่ critical ต่อ release

### Package

box Package คือ gate ของ product ที่ติดตั้งได้ มันรองรับโดย
`Package Acceptance` และ resolver
`scripts/resolve-openclaw-package-candidate.mjs` resolver จะ normalize
candidate เป็น tarball `package-under-test` ที่ Docker E2E ใช้, ตรวจสอบ
package inventory, บันทึก package version และ SHA-256 และแยก
workflow harness ref ออกจาก package source ref

แหล่งที่มา candidate ที่รองรับ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` หรือ OpenClaw release
  version ที่แน่นอน
- `source=ref`: pack branch, tag หรือ full commit SHA ของ `package_ref` ที่เชื่อถือได้
  ด้วย harness `workflow_ref` ที่เลือก
- `source=url`: ดาวน์โหลด `.tgz` แบบ HTTPS พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: reuse `.tgz` ที่อัปโหลดโดย GitHub Actions run อื่น

`OpenClaw Release Checks` รัน Package Acceptance ด้วย `source=artifact`,
artifact release package ที่เตรียมไว้, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` Package Acceptance จะคง migration, update,
configured-auth update restart, live ClawHub skill install, stale Plugin dependency cleanup, offline Plugin
fixtures, Plugin update และ Telegram package QA ไว้กับ tarball ที่ resolve แล้วชุดเดียวกัน
release checks ที่ block ใช้ baseline package ที่เผยแพร่ล่าสุดตามค่าเริ่มต้น;
`run_release_soak=true` หรือ
`release_profile=full` ขยายเป็น baseline ที่เผยแพร่บน npm แบบ stable ทุกตัวตั้งแต่
`2026.4.23` ถึง `latest` รวมถึง reported-issue fixtures ใช้
Package Acceptance ด้วย `source=npm` สำหรับ candidate ที่ shipped แล้ว หรือ
`source=ref`/`source=artifact` สำหรับ tarball npm แบบ local ที่มี SHA รองรับก่อน
publish มันคือสิ่งทดแทนแบบ GitHub-native
สำหรับ coverage package/update ส่วนใหญ่ที่ก่อนหน้านี้ต้องใช้
Parallels cross-OS release checks ยังคงสำคัญสำหรับ onboarding, installer
และพฤติกรรม platform เฉพาะ OS แต่การตรวจสอบ product ด้าน package/update ควร
เลือกใช้ Package Acceptance เป็นหลัก

เช็กลิสต์มาตรฐานสำหรับการอัปเดตและการตรวจสอบ Plugin คือ
[การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins) ใช้เช็กลิสต์นี้เมื่อ
ตัดสินใจว่าเลน local, Docker, Package Acceptance หรือ release-check ใดพิสูจน์การเปลี่ยนแปลง
การติดตั้ง/อัปเดต Plugin, การล้างข้อมูลด้วย doctor หรือการย้ายแพ็กเกจที่เผยแพร่แล้ว
การย้ายข้อมูลอัปเดตที่เผยแพร่แบบครบถ้วนจากทุกแพ็กเกจ stable `2026.4.23+` เป็น
เวิร์กโฟลว์ `Update Migration` แบบ manual แยกต่างหาก ไม่ใช่ส่วนหนึ่งของ Full Release CI

การผ่อนปรน package-acceptance แบบเดิมถูกจำกัดเวลาโดยตั้งใจ แพ็กเกจจนถึง
`2026.4.25` อาจใช้เส้นทางความเข้ากันได้สำหรับช่องว่างของ metadata ที่เผยแพร่ไปยัง npm แล้ว:
รายการ QA inventory แบบ private ที่ขาดหายจาก tarball, `gateway install --wrapper` ที่ขาดหาย,
ไฟล์ patch ที่ขาดหายใน fixture ของ git ที่ได้จาก tarball, `update.channel` ที่ไม่ได้ถูกคงไว้,
ตำแหน่ง install-record ของ Plugin แบบเดิม, การคงอยู่ของ install-record สำหรับ marketplace ที่ขาดหาย
และการย้ายข้อมูล config metadata ระหว่าง `plugins update` แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้ว
อาจเตือนสำหรับไฟล์ stamp ของ local build metadata ที่ถูกส่งออกไปแล้ว แพ็กเกจที่ใหม่กว่านั้น
ต้องผ่านสัญญาแพ็กเกจสมัยใหม่ ช่องว่างเดียวกันเหล่านั้นจะทำให้การตรวจสอบ release ล้มเหลว

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

โปรไฟล์แพ็กเกจที่ใช้บ่อย:

- `smoke`: เลนติดตั้งแพ็กเกจ/channel/agent, เครือข่าย Gateway และโหลด config ใหม่แบบรวดเร็ว
- `package`: สัญญา install/update/restart/plugin package รวมถึงหลักฐานการติดตั้ง skill ของ ClawHub แบบ live; นี่คือค่าเริ่มต้นของ release-check
- `product`: `package` รวมกับ MCP channels, การล้าง cron/subagent, OpenAI web
  search และ OpenWebUI
- `full`: ชุดงานย่อย release-path ของ Docker พร้อม OpenWebUI
- `custom`: รายการ `docker_lanes` แบบเจาะจงสำหรับ rerun ที่เน้นเฉพาะจุด

สำหรับหลักฐาน Telegram ของ package-candidate ให้เปิดใช้ `telegram_mode=mock-openai` หรือ
`telegram_mode=live-frontier` บน Package Acceptance เวิร์กโฟลว์จะส่ง tarball
`package-under-test` ที่ resolve แล้วเข้าไปในเลน Telegram; เวิร์กโฟลว์ Telegram แบบ standalone
ยังคงรับ spec npm ที่เผยแพร่แล้วสำหรับการตรวจหลังเผยแพร่

## การทำงานอัตโนมัติสำหรับการเผยแพร่ release

`OpenClaw Release Publish` คือ entrypoint การเผยแพร่แบบ mutating ตามปกติ โดยจะ
จัดลำดับเวิร์กโฟลว์ trusted-publisher ตามลำดับที่ release ต้องใช้:

1. Check out release tag และ resolve commit SHA ของ tag นั้น
2. ตรวจสอบว่า tag เข้าถึงได้จาก `main` หรือ `release/*`
3. รัน `pnpm plugins:sync:check`
4. Dispatch `Plugin NPM Release` ด้วย `publish_scope=all-publishable` และ
   `ref=<release-sha>`
5. Dispatch `Plugin ClawHub Release` ด้วย scope และ SHA เดียวกัน
6. Dispatch `OpenClaw NPM Release` ด้วย release tag, npm dist-tag และ
   `preflight_run_id` ที่บันทึกไว้

ตัวอย่างการเผยแพร่ Beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

การเผยแพร่ Stable ไปยัง beta dist-tag เริ่มต้น:

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

ใช้เวิร์กโฟลว์ระดับต่ำกว่า `Plugin NPM Release` และ `Plugin ClawHub Release`
เฉพาะสำหรับงานซ่อมหรือเผยแพร่ซ้ำที่เน้นเฉพาะจุดเท่านั้น สำหรับการซ่อม Plugin ที่เลือกไว้ ให้ส่ง
`plugin_publish_scope=selected` และ `plugins=@openclaw/name` ไปยัง
`OpenClaw Release Publish` หรือ dispatch เวิร์กโฟลว์ลูกโดยตรงเมื่อ
ต้องไม่เผยแพร่แพ็กเกจ OpenClaw

## อินพุตของเวิร์กโฟลว์ NPM

`OpenClaw NPM Release` รับอินพุตที่ operator ควบคุมได้เหล่านี้:

- `tag`: release tag ที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1` หรือ
  `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` อาจเป็น commit SHA แบบเต็ม 40 อักขระ
  ของ workflow-branch ปัจจุบันสำหรับ preflight เพื่อการตรวจสอบเท่านั้นได้ด้วย
- `preflight_only`: `true` สำหรับตรวจสอบ/build/package เท่านั้น, `false` สำหรับ
  เส้นทางเผยแพร่จริง
- `preflight_run_id`: จำเป็นบนเส้นทางเผยแพร่จริงเพื่อให้เวิร์กโฟลว์นำ tarball ที่เตรียมไว้
  จาก preflight run ที่สำเร็จกลับมาใช้
- `npm_dist_tag`: tag เป้าหมายของ npm สำหรับเส้นทางเผยแพร่; ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Publish` รับอินพุตที่ operator ควบคุมได้เหล่านี้:

- `tag`: release tag ที่จำเป็น; ต้องมีอยู่แล้ว
- `preflight_run_id`: run id ของ preflight `OpenClaw NPM Release` ที่สำเร็จ;
  จำเป็นเมื่อ `publish_openclaw_npm=true`
- `npm_dist_tag`: tag เป้าหมายของ npm สำหรับแพ็กเกจ OpenClaw
- `plugin_publish_scope`: ค่าเริ่มต้นคือ `all-publishable`; ใช้ `selected` เฉพาะ
  สำหรับงานซ่อมที่เน้นเฉพาะจุด
- `plugins`: ชื่อแพ็กเกจ `@openclaw/*` คั่นด้วยคอมมาเมื่อ
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: ค่าเริ่มต้นคือ `true`; ตั้งเป็น `false` เฉพาะเมื่อใช้
  เวิร์กโฟลว์เป็นตัว orchestrator สำหรับการซ่อมเฉพาะ Plugin

`OpenClaw Release Checks` รับอินพุตที่ operator ควบคุมได้เหล่านี้:

- `ref`: branch, tag หรือ commit SHA แบบเต็มที่จะตรวจสอบ การตรวจที่มี secret
  ต้องให้ commit ที่ resolve แล้วเข้าถึงได้จาก branch ของ OpenClaw หรือ
  release tag
- `run_release_soak`: เลือกใช้การ soak แบบ exhaustive สำหรับ live/E2E, Docker release-path และ
  all-since upgrade-survivor บนการตรวจ release แบบ stable/default ระบบจะบังคับเปิด
  โดย `release_profile=full`

กฎ:

- Stable และ correction tags อาจเผยแพร่ไปยัง `beta` หรือ `latest` ก็ได้
- Beta prerelease tags เผยแพร่ได้เฉพาะไปยัง `beta`
- สำหรับ `OpenClaw NPM Release` อนุญาตให้ใช้อินพุต commit SHA แบบเต็มเฉพาะเมื่อ
  `preflight_only=true`
- `OpenClaw Release Checks` และ `Full Release Validation` เป็นแบบตรวจสอบเท่านั้นเสมอ
- เส้นทางเผยแพร่จริงต้องใช้ `npm_dist_tag` เดียวกับที่ใช้ระหว่าง preflight;
  เวิร์กโฟลว์จะตรวจสอบ metadata นั้นก่อนเผยแพร่ต่อไป

## ลำดับการ release npm แบบ Stable

เมื่อตัด release npm แบบ stable:

1. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนมี tag คุณอาจใช้ commit SHA แบบเต็มของ workflow-branch ปัจจุบัน
     สำหรับ dry run ของ preflight workflow เพื่อการตรวจสอบเท่านั้น
2. เลือก `npm_dist_tag=beta` สำหรับ flow ปกติแบบ beta-first หรือ `latest` เฉพาะ
   เมื่อคุณตั้งใจต้องการเผยแพร่ stable โดยตรง
3. รัน `Full Release Validation` บน release branch, release tag หรือ commit SHA แบบเต็ม
   เมื่อคุณต้องการ CI ปกติรวมกับ live prompt cache, Docker, QA Lab,
   Matrix และ Telegram coverage จากเวิร์กโฟลว์ manual เดียว
4. หากคุณตั้งใจต้องการเฉพาะกราฟการทดสอบปกติแบบ deterministic ให้รันเวิร์กโฟลว์ manual `CI`
   บน release ref แทน
5. บันทึก `preflight_run_id` ที่สำเร็จ
6. รัน `OpenClaw Release Publish` ด้วย `tag` เดียวกัน, `npm_dist_tag` เดียวกัน
   และ `preflight_run_id` ที่บันทึกไว้; เวิร์กโฟลว์จะเผยแพร่ Plugin ที่ externalize แล้วไปยัง npm
   และ ClawHub ก่อนโปรโมตแพ็กเกจ npm ของ OpenClaw
7. หาก release ลงที่ `beta` ให้ใช้เวิร์กโฟลว์ private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   เพื่อโปรโมต stable version นั้นจาก `beta` ไปยัง `latest`
8. หาก release ตั้งใจเผยแพร่โดยตรงไปยัง `latest` และ `beta`
   ควรตาม build stable เดียวกันทันที ให้ใช้เวิร์กโฟลว์ private เดียวกันนั้น
   เพื่อชี้ dist-tag ทั้งคู่ไปยัง stable version หรือปล่อยให้การ sync แบบ self-healing ตามกำหนดเวลา
   ย้าย `beta` ในภายหลัง

การเปลี่ยน dist-tag อยู่ใน repo private ด้วยเหตุผลด้านความปลอดภัย เพราะยังคง
ต้องใช้ `NPM_TOKEN` ในขณะที่ repo สาธารณะคงการเผยแพร่แบบ OIDC-only ไว้

สิ่งนี้ทำให้ทั้งเส้นทางเผยแพร่โดยตรงและเส้นทางโปรโมตแบบ beta-first
ถูกบันทึกในเอกสารและมองเห็นได้สำหรับ operator

หาก maintainer ต้องถอยกลับไปใช้การยืนยันตัวตน npm แบบ local ให้รันคำสั่ง 1Password
CLI (`op`) ใด ๆ ภายใน tmux session ที่แยกไว้เท่านั้น อย่าเรียก `op`
โดยตรงจาก shell หลักของ agent; การเก็บไว้ภายใน tmux ทำให้ prompt,
alert และการจัดการ OTP มองเห็นได้ และป้องกัน alert จาก host ซ้ำ ๆ

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

Maintainers ใช้เอกสาร release แบบ private ใน
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
สำหรับ runbook จริง

## ที่เกี่ยวข้อง

- [ช่องทาง Release](/th/install/development-channels)
