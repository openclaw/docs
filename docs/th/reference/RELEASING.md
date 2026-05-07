---
read_when:
    - กำลังค้นหานิยามช่องทางการเผยแพร่สาธารณะ
    - การรันการตรวจสอบความถูกต้องของรีลีสหรือการยอมรับแพ็กเกจ
    - กำลังมองหาการตั้งชื่อเวอร์ชันและรอบการออกเวอร์ชัน
    - การวางแผนสายรุ่นสนับสนุนรายเดือนหรือ LTS
summary: เลนการเผยแพร่ เช็กลิสต์ของผู้ปฏิบัติงาน กล่องตรวจสอบความถูกต้อง การตั้งชื่อเวอร์ชัน สายการสนับสนุนรายเดือนที่วางแผนไว้ และรอบการเผยแพร่
title: นโยบายการเผยแพร่รุ่น
x-i18n:
    generated_at: "2026-05-07T01:54:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbd86faf2aa3eeeb465203431c19c778719f291a2e2732fca1463bde89e42e80
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw มีช่องทางรีลีสสาธารณะสามช่องทาง:

- stable: รีลีสที่ติดแท็กซึ่งเผยแพร่ไปยัง npm `beta` โดยค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อมีการร้องขออย่างชัดเจน
- beta: แท็กก่อนรีลีสที่เผยแพร่ไปยัง npm `beta`
- dev: หัวล่าสุดที่เปลี่ยนแปลงอยู่ของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันรีลีสเสถียร: `YYYY.M.D`
  - แท็ก Git: `vYYYY.M.D`
- เวอร์ชันรีลีสแก้ไขเสถียรแบบเดิม: `YYYY.M.D-N`
  - แท็ก Git: `vYYYY.M.D-N`
- เวอร์ชันก่อนรีลีสเบต้า: `YYYY.M.D-beta.N`
  - แท็ก Git: `vYYYY.M.D-beta.N`
- อย่าเติมศูนย์นำหน้าเดือนหรือวัน
- `latest` หมายถึงรีลีส npm เสถียรที่ได้รับการโปรโมตอยู่ในปัจจุบัน
- `beta` หมายถึงเป้าหมายการติดตั้งเบต้าปัจจุบัน
- รีลีสเสถียรและรีลีสแก้ไขแบบเดิมเผยแพร่ไปยัง npm `beta` โดยค่าเริ่มต้น ผู้ดำเนินการรีลีสสามารถกำหนดเป้าหมายเป็น `latest` อย่างชัดเจน หรือโปรโมตบิลด์เบต้าที่ผ่านการตรวจสอบแล้วในภายหลัง
- รีลีสเสถียรทุกรีลีสของ OpenClaw จัดส่งแพ็กเกจ npm และแอป macOS พร้อมกัน;
  โดยปกติรีลีสเบต้าจะตรวจสอบและเผยแพร่เส้นทาง npm/แพ็กเกจก่อน โดยสงวนการบิลด์/เซ็น/รับรองแอป mac ไว้สำหรับรีลีสเสถียร เว้นแต่จะมีการร้องขออย่างชัดเจน

### การกำหนดเวอร์ชันสนับสนุนรายเดือนที่วางแผนไว้

OpenClaw ยังไม่มีช่องทาง LTS หรือช่องทางสนับสนุนรายเดือน ผู้ดูแลกำลัง
มุ่งไปสู่สายสนับสนุนรายเดือนที่เข้ากันได้กับ SemVer แต่ช่องทางอัปเดต
ที่จัดส่งอยู่ในวันนี้ยังคงเป็น `stable`, `beta` และ `dev`

รูปแบบเวอร์ชันที่วางแผนไว้คือ `YYYY.M.PATCH`:

- `YYYY` คือปี
- `M` คือสายรีลีสรายเดือน โดยไม่มีศูนย์นำหน้า
- `PATCH` เพิ่มขึ้นภายในสายรายเดือนนั้น และสามารถเพิ่มสูงเท่าที่จำเป็น

ตัวอย่างเช่น `2026.6.0`, `2026.6.1` และ `2026.6.2` ทั้งหมดจะอยู่ในสายเดือนมิถุนายน
2026 แท็กแจกจ่ายสนับสนุนรายเดือนในอนาคต เช่น `stable-2026-6` หรือ
`lts-2026-6` อาจชี้ไปยังสายนั้น ขณะที่ `latest` ยังคงเคลื่อนไปอย่างรวดเร็ว

โมเดลในอนาคตนี้แทนที่ความจำเป็นในการสร้างรีลีสแก้ไข `YYYY.M.D-N` ใหม่
เวอร์ชันแก้ไขแบบเดิมที่มีอยู่ยังคงถูกรับรู้ เพื่อให้แพ็กเกจเก่าและ
เส้นทางอัปเกรดยังคงทำงานได้

## รอบการรีลีส

- รีลีสจะเดินหน้าแบบเบต้าก่อน
- รีลีสเสถียรจะตามมาหลังจากตรวจสอบเบต้าล่าสุดแล้วเท่านั้น
- โดยปกติผู้ดูแลจะตัดรีลีสจากสาขา `release/YYYY.M.D` ที่สร้างจาก
  `main` ปัจจุบัน เพื่อให้การตรวจสอบรีลีสและการแก้ไขไม่บล็อกการพัฒนาใหม่
  บน `main`
- หากมีการพุชหรือเผยแพร่แท็กเบต้าแล้วและต้องแก้ไข ผู้ดูแลจะตัดแท็ก
  `-beta.N` ถัดไปแทนการลบหรือสร้างแท็กเบต้าเดิมใหม่
- ขั้นตอนรีลีสโดยละเอียด การอนุมัติ ข้อมูลรับรอง และบันทึกการกู้คืนเป็น
  สำหรับผู้ดูแลเท่านั้น

## รายการตรวจสอบของผู้ดำเนินการรีลีส

รายการตรวจสอบนี้คือรูปแบบสาธารณะของโฟลว์รีลีส ข้อมูลรับรองส่วนตัว
การเซ็น การรับรอง การกู้คืนแท็กแจกจ่าย และรายละเอียดการย้อนกลับฉุกเฉินจะอยู่ใน
คู่มือดำเนินการรีลีสสำหรับผู้ดูแลเท่านั้น

1. เริ่มจาก `main` ปัจจุบัน: ดึงรายการล่าสุด ยืนยันว่าคอมมิตเป้าหมายถูกพุชแล้ว
   และยืนยันว่า CI ของ `main` ปัจจุบันเขียวพอที่จะสร้างสาขาจากจุดนั้น
2. เขียนส่วนบนสุดของ `CHANGELOG.md` ใหม่จากประวัติคอมมิตจริงด้วย
   `/changelog` ให้รายการเป็นเนื้อหาสำหรับผู้ใช้ คอมมิต พุช และ rebase/pull
   อีกครั้งก่อนสร้างสาขา
3. ตรวจสอบระเบียนความเข้ากันได้ของรีลีสใน
   `src/plugins/compat/registry.ts` และ
   `src/commands/doctor/shared/deprecation-compat.ts` ลบความเข้ากันได้
   ที่หมดอายุเฉพาะเมื่อเส้นทางอัปเกรดยังคงครอบคลุมอยู่ หรือบันทึกเหตุผลว่า
   เหตุใดจึงตั้งใจคงไว้
4. สร้าง `release/YYYY.M.D` จาก `main` ปัจจุบัน; อย่าทำงานรีลีสปกติ
   โดยตรงบน `main`
5. เพิ่มเวอร์ชันในทุกตำแหน่งที่จำเป็นสำหรับแท็กที่ตั้งใจไว้ รัน
   `pnpm plugins:sync` เพื่อให้แพ็กเกจ Plugin ที่เผยแพร่ได้ใช้เวอร์ชันรีลีส
   และเมทาดาทาความเข้ากันได้ร่วมกัน จากนั้นรันการตรวจล่วงหน้าแบบกำหนดผลได้ในเครื่อง:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` และ
   `pnpm release:check`
6. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true` ก่อนมีแท็ก
   อนุญาตให้ใช้ SHA แบบเต็ม 40 อักขระของสาขารีลีสสำหรับการตรวจล่วงหน้าเพื่อการตรวจสอบเท่านั้น
   บันทึก `preflight_run_id` ที่สำเร็จ
7. เริ่มการทดสอบก่อนรีลีสทั้งหมดด้วย `Full Release Validation` สำหรับ
   สาขารีลีส แท็ก หรือ SHA คอมมิตแบบเต็ม นี่คือจุดเข้าแบบแมนนวลจุดเดียว
   สำหรับกล่องทดสอบรีลีสขนาดใหญ่สี่ชุด: Vitest, Docker, QA Lab และ Package
8. หากการตรวจสอบล้มเหลว ให้แก้บนสาขารีลีสและรันไฟล์ เลน งานเวิร์กโฟลว์
   โปรไฟล์แพ็กเกจ ผู้ให้บริการ หรือรายการอนุญาตโมเดลที่ล้มเหลวซ้ำในขอบเขตเล็กที่สุด
   ซึ่งพิสูจน์การแก้ไขได้ รันชุดครอบทั้งหมดซ้ำเฉพาะเมื่อพื้นผิวที่เปลี่ยนทำให้
   หลักฐานก่อนหน้าไม่สดใหม่แล้ว
9. สำหรับเบต้า ให้ติดแท็ก `vYYYY.M.D-beta.N` จากนั้นรัน `OpenClaw Release Publish` จาก
   สาขา `release/YYYY.M.D` ที่ตรงกัน ระบบจะตรวจสอบ `pnpm plugins:sync:check`,
   ส่งแพ็กเกจ Plugin ที่เผยแพร่ได้ทั้งหมดไปยัง npm และชุดเดียวกันไปยัง
   ClawHub แบบขนาน จากนั้นโปรโมตอาร์ติแฟกต์ตรวจล่วงหน้า npm ของ OpenClaw ที่เตรียมไว้
   ด้วยแท็กแจกจ่ายที่ตรงกันทันทีที่การเผยแพร่ Plugin ไปยัง npm สำเร็จ
   การเผยแพร่ไปยัง ClawHub อาจยังทำงานอยู่ขณะที่ npm ของ OpenClaw เผยแพร่ แต่
   เวิร์กโฟลว์เผยแพร่รีลีสจะไม่เสร็จจนกว่าเส้นทางเผยแพร่ Plugin ทั้งสองเส้นทางและ
   เส้นทางเผยแพร่ npm ของ OpenClaw จะเสร็จสมบูรณ์สำเร็จ หลังเผยแพร่ ให้รัน
   การยอมรับแพ็กเกจหลังเผยแพร่กับแพ็กเกจ
   `openclaw@YYYY.M.D-beta.N` หรือ
   `openclaw@beta` ที่เผยแพร่แล้ว หากก่อนรีลีสที่พุชหรือเผยแพร่แล้วต้องแก้ไข
   ให้ตัดหมายเลขก่อนรีลีสถัดไปที่ตรงกัน; อย่าลบหรือเขียนทับก่อนรีลีสเดิม
10. สำหรับรีลีสเสถียร ให้ดำเนินการต่อเฉพาะหลังจากเบต้าหรือผู้สมัครรีลีสที่ผ่านการตรวจแล้วมี
    หลักฐานการตรวจสอบที่จำเป็น การเผยแพร่ npm เสถียรยังผ่าน
    `OpenClaw Release Publish` โดยนำอาร์ติแฟกต์ตรวจล่วงหน้าที่สำเร็จกลับมาใช้ผ่าน
    `preflight_run_id`; ความพร้อมของรีลีส macOS เสถียรยังต้องมี
    `.zip`, `.dmg`, `.dSYM.zip` ที่แพ็กแล้ว และ `appcast.xml` ที่อัปเดตบน `main`
11. หลังเผยแพร่ ให้รันตัวตรวจสอบ npm หลังเผยแพร่, E2E Telegram จาก npm ที่เผยแพร่แล้ว
    แบบสแตนด์อโลนที่เป็นทางเลือกเมื่อคุณต้องการหลักฐานช่องทางหลังเผยแพร่,
    การโปรโมตแท็กแจกจ่ายเมื่อจำเป็น, บันทึกรีลีส/ก่อนรีลีสบน GitHub จาก
    ส่วน `CHANGELOG.md` ที่ตรงกันทั้งหมด และขั้นตอนประกาศรีลีส

## การตรวจล่วงหน้าของรีลีส

- เรียกใช้ `pnpm check:test-types` ก่อน release preflight เพื่อให้ TypeScript ของเทสต์ยังคง
  ถูกครอบคลุมนอก gate `pnpm check` แบบ local ที่เร็วกว่า
- เรียกใช้ `pnpm check:architecture` ก่อน release preflight เพื่อให้การตรวจสอบ import
  cycle และขอบเขตสถาปัตยกรรมที่กว้างกว่านั้นเป็นสีเขียวนอก gate แบบ local ที่เร็วกว่า
- เรียกใช้ `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้ release artifact
  `dist/*` ที่คาดไว้และ bundle ของ Control UI มีอยู่สำหรับขั้นตอนการตรวจสอบ pack
- เรียกใช้ `pnpm plugins:sync` หลังจาก bump เวอร์ชัน root และก่อน tagging โดยจะ
  อัปเดตเวอร์ชันแพ็กเกจ Plugin ที่เผยแพร่ได้, metadata ความเข้ากันได้ของ OpenClaw peer/API,
  build metadata และ stub changelog ของ Plugin ให้ตรงกับเวอร์ชัน release ของ core
  `pnpm plugins:sync:check` คือ release guard แบบไม่แก้ไขข้อมูล; publish workflow จะล้มเหลวก่อนมีการเปลี่ยนแปลง registry หากลืมขั้นตอนนี้
- เรียกใช้ workflow `Full Release Validation` แบบ manual ก่อนอนุมัติ release เพื่อ
  เริ่ม test box ก่อน release ทั้งหมดจาก entrypoint เดียว โดยรับ branch,
  tag หรือ commit SHA แบบเต็ม, dispatch `CI` แบบ manual และ dispatch
  `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, การตรวจสอบ package ข้าม OS,
  QA Lab parity, Matrix และ lane ของ Telegram การรัน stable/default จะเก็บ live/E2E แบบละเอียดและ Docker release-path soak ไว้หลัง
  `run_release_soak=true`; `release_profile=full` จะบังคับเปิด soak เมื่อใช้
  `release_profile=full` และ `rerun_group=all` จะรัน package Telegram
  E2E กับ artifact `release-package-under-test` จาก release checks ด้วย
  ระบุ `npm_telegram_package_spec` หลัง publish เมื่อ Telegram E2E เดียวกัน
  ควรพิสูจน์แพ็กเกจ npm ที่เผยแพร่แล้วด้วย ระบุ
  `package_acceptance_package_spec` หลัง publish เมื่อการยอมรับแพ็กเกจ
  ควรรัน matrix package/update กับแพ็กเกจ npm ที่จัดส่งแล้วแทน
  artifact ที่สร้างจาก SHA ระบุ
  `evidence_package_spec` เมื่อรายงานหลักฐานส่วนตัวควรพิสูจน์ว่าการตรวจสอบ
  ตรงกับแพ็กเกจ npm ที่เผยแพร่แล้วโดยไม่บังคับ Telegram E2E
  ตัวอย่าง:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- เรียกใช้ workflow `Package Acceptance` แบบ manual เมื่อคุณต้องการหลักฐาน side-channel
  สำหรับตัวเลือกแพ็กเกจขณะที่งาน release ดำเนินต่อ ใช้ `source=npm` สำหรับ
  `openclaw@beta`, `openclaw@latest` หรือเวอร์ชัน release แบบเจาะจง; `source=ref`
  เพื่อ pack branch/tag/SHA `package_ref` ที่เชื่อถือได้ด้วย harness
  `workflow_ref` ปัจจุบัน; `source=url` สำหรับ tarball HTTPS ที่ต้องมี
  SHA-256; หรือ `source=artifact` สำหรับ tarball ที่อัปโหลดโดย GitHub
  Actions run อื่น workflow จะแปลงตัวเลือกเป็น
  `package-under-test`, ใช้ scheduler ของ Docker E2E release ซ้ำกับ
  tarball นั้น และสามารถรัน Telegram QA กับ tarball เดียวกันด้วย
  `telegram_mode=mock-openai` หรือ `telegram_mode=live-frontier` เมื่อ
  lane ของ Docker ที่เลือกมี `published-upgrade-survivor` artifact ของ package
  จะเป็นตัวเลือก และ `published_upgrade_survivor_baseline` จะเลือก
  baseline ที่เผยแพร่แล้ว `update-restart-auth` ใช้แพ็กเกจตัวเลือกเป็น
  ทั้ง CLI ที่ติดตั้งและ package-under-test เพื่อให้ทดสอบเส้นทาง
  managed restart ของคำสั่ง update ของตัวเลือก
  ตัวอย่าง: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  โปรไฟล์ทั่วไป:
  - `smoke`: lane สำหรับ install/channel/agent, gateway network และ config reload
  - `package`: lane แบบ package/update/restart/plugin ที่ใช้ artifact โดยตรง โดยไม่มี OpenWebUI หรือ ClawHub แบบ live
  - `product`: โปรไฟล์ package รวมถึงช่องทาง MCP, การล้าง cron/subagent,
    การค้นหาเว็บ OpenAI และ OpenWebUI
  - `full`: ชิ้นส่วน Docker release-path พร้อม OpenWebUI
  - `custom`: การเลือก `docker_lanes` แบบเจาะจงสำหรับ rerun ที่เน้นเฉพาะจุด
- เรียกใช้ workflow `CI` แบบ manual โดยตรงเมื่อคุณต้องการเพียง coverage ของ CI ปกติเต็มรูปแบบ
  สำหรับ release candidate การ dispatch CI แบบ manual จะข้าม changed
  scoping และบังคับ lane ของ Linux Node shards, bundled-plugin shards, channel
  contracts, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke,
  docs checks, Python skills, Windows, macOS, Android และ Control UI i18n
  ตัวอย่าง: `gh workflow run ci.yml --ref release/YYYY.M.D`
- เรียกใช้ `pnpm qa:otel:smoke` เมื่อตรวจสอบ telemetry ของ release โดยจะทดสอบ
  QA-lab ผ่านตัวรับ OTLP/HTTP แบบ local และตรวจสอบชื่อ span ของ trace
  ที่ส่งออก, attribute ที่จำกัดขอบเขต และการ redaction ของ content/identifier โดยไม่ต้องใช้
  Opik, Langfuse หรือ collector ภายนอกอื่น
- เรียกใช้ `pnpm release:check` ก่อนทุก release ที่มี tag
- เรียกใช้ `OpenClaw Release Publish` สำหรับลำดับ publish ที่แก้ไขข้อมูลหลังจาก
  tag มีอยู่แล้ว Dispatch จาก `release/YYYY.M.D` (หรือ `main` เมื่อเผยแพร่ tag
  ที่เข้าถึงได้จาก main), ส่ง release tag และ OpenClaw npm
  `preflight_run_id` ที่สำเร็จ และคง scope publish ของ Plugin ค่าเริ่มต้น
  `all-publishable` เว้นแต่ตั้งใจรันการซ่อมเฉพาะจุด workflow จะ serialize การ publish Plugin npm, publish Plugin ClawHub และ publish OpenClaw
  npm เพื่อไม่ให้แพ็กเกจ core ถูกเผยแพร่ก่อน Plugin ที่ externalized แล้ว
- ตอนนี้ release checks รันใน workflow manual แยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรัน lane QA Lab mock parity พร้อมกับโปรไฟล์ live Matrix แบบเร็วและ lane Telegram QA ก่อนอนุมัติ release lane แบบ live
  ใช้ environment `qa-live-shared`; Telegram ยังใช้ credential lease ของ Convex CI ด้วย
  เรียกใช้ workflow `QA-Lab - All Lanes` แบบ manual ด้วย
  `matrix_profile=all` และ `matrix_shards=true` เมื่อคุณต้องการ inventory ของ Matrix
  transport, media และ E2EE แบบเต็มในแบบขนาน
- การตรวจสอบ runtime สำหรับการติดตั้งและ upgrade ข้าม OS เป็นส่วนหนึ่งของ
  `OpenClaw Release Checks` และ `Full Release Validation` แบบ public ซึ่งเรียก
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` โดยตรง
- การแยกนี้ตั้งใจทำไว้: ให้เส้นทาง release npm จริงสั้น
  deterministic และเน้น artifact ขณะที่การตรวจสอบ live ที่ช้ากว่าอยู่ใน lane ของตัวเอง
  เพื่อไม่ให้ทำให้ publish สะดุดหรือถูกบล็อก
- release checks ที่มี secret ควรถูก dispatch ผ่าน `Full Release
Validation` หรือจาก workflow ref `main`/release เพื่อให้ตรรกะ workflow และ
  secrets ยังถูกควบคุม
- `OpenClaw Release Checks` รับ branch, tag หรือ commit SHA แบบเต็ม ตราบใด
  ที่ commit ที่ resolve แล้วเข้าถึงได้จาก branch หรือ release tag ของ OpenClaw
- preflight แบบ validation-only ของ `OpenClaw NPM Release` ยังรับ commit SHA เต็ม 40 อักขระ
  ของ workflow-branch ปัจจุบันได้โดยไม่ต้องมี tag ที่ push แล้ว
- เส้นทาง SHA นั้นใช้สำหรับ validation เท่านั้นและไม่สามารถ promote เป็น publish จริงได้
- ในโหมด SHA workflow จะสังเคราะห์ `v<package.json version>` สำหรับ
  การตรวจ metadata ของ package เท่านั้น; publish จริงยังต้องใช้ release tag จริง
- ทั้งสอง workflow คงเส้นทาง publish และ promotion จริงไว้บน runner ที่ GitHub-hosted
  ขณะที่เส้นทาง validation ที่ไม่แก้ไขข้อมูลสามารถใช้ runner Blacksmith Linux
  ที่ใหญ่กว่าได้
- workflow นั้นรัน
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ workflow secrets ทั้ง `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- npm release preflight ไม่รอ lane release checks แยกต่างหากอีกต่อไป
- เรียกใช้ `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือ tag beta/correction ที่ตรงกัน) ก่อนอนุมัติ
- หลัง npm publish ให้เรียกใช้
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (หรือเวอร์ชัน beta/correction ที่ตรงกัน) เพื่อตรวจสอบเส้นทาง install จาก registry ที่เผยแพร่แล้ว
  ใน temp prefix ใหม่
- หลัง publish beta ให้เรียกใช้ `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  เพื่อตรวจสอบการ onboarding ของ installed-package, การตั้งค่า Telegram และ Telegram E2E จริง
  กับแพ็กเกจ npm ที่เผยแพร่แล้วโดยใช้ pool credential Telegram แบบ leased ที่ใช้ร่วมกัน
  งานครั้งเดียวของ maintainer บน local อาจละเว้นตัวแปร Convex และส่ง credential env
  `OPENCLAW_QA_TELEGRAM_*` ทั้งสามตัวโดยตรง
- หากต้องการรัน post-publish beta smoke แบบเต็มจากเครื่อง maintainer ให้ใช้ `pnpm release:beta-smoke -- --beta betaN` helper จะรัน Parallels npm update/fresh-target validation, dispatch `NPM Telegram Beta E2E`, poll workflow run ที่เจาะจง, ดาวน์โหลด artifact และพิมพ์รายงาน Telegram
- Maintainer สามารถรัน post-publish check เดียวกันจาก GitHub Actions ผ่าน
  workflow `NPM Telegram Beta E2E` แบบ manual ได้ โดยตั้งใจให้เป็น manual-only และ
  ไม่รันทุกครั้งที่ merge
- ตอนนี้ระบบอัตโนมัติ release ของ maintainer ใช้ preflight-then-promote:
  - การ publish npm จริงต้องผ่าน npm `preflight_run_id` ที่สำเร็จ
  - การ publish npm จริงต้องถูก dispatch จาก branch `main` หรือ
    `release/YYYY.M.D` เดียวกันกับ preflight run ที่สำเร็จ
  - release npm แบบ stable ตั้งค่าเริ่มต้นเป็น `beta`
  - การ publish npm แบบ stable สามารถ target `latest` อย่างชัดเจนผ่าน workflow input
  - ตอนนี้การเปลี่ยนแปลง npm dist-tag ที่ใช้ token อยู่ใน
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    เพื่อความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่
    repo public คงการ publish แบบ OIDC-only
  - `macOS Release` แบบ public เป็น validation-only; เมื่อ tag อยู่เฉพาะบน
    release branch แต่ workflow ถูก dispatch จาก `main` ให้ตั้ง
    `public_release_branch=release/YYYY.M.D`
  - การ publish mac ส่วนตัวจริงต้องผ่าน private mac
    `preflight_run_id` และ `validate_run_id` ที่สำเร็จ
  - เส้นทาง publish จริงจะ promote artifact ที่เตรียมไว้แทนการ build
    ซ้ำอีกครั้ง
- สำหรับ release แก้ไข stable แบบ legacy เช่น `YYYY.M.D-N` ตัวตรวจสอบหลัง publish
  จะตรวจเส้นทาง upgrade temp-prefix เดียวกันจาก `YYYY.M.D` เป็น `YYYY.M.D-N`
  ด้วย เพื่อให้ release แก้ไขไม่สามารถปล่อยให้ global install รุ่นเก่าอยู่บน
  payload stable ฐานอย่างเงียบ ๆ
- npm release preflight จะ fail closed เว้นแต่ tarball มีทั้ง
  `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่าง
  เพื่อไม่ให้เราจัดส่ง dashboard บน browser ที่ว่างเปล่าอีก
- การตรวจสอบหลัง publish ยังตรวจว่า entrypoint ของ Plugin ที่เผยแพร่แล้วและ
  metadata ของ package มีอยู่ใน layout ของ registry ที่ติดตั้งแล้ว release ที่
  จัดส่ง payload runtime ของ Plugin หายไปจะล้มเหลวใน postpublish verifier และ
  ไม่สามารถ promote เป็น `latest` ได้
- `pnpm test:install:smoke` ยังบังคับใช้ budget `unpackedSize` ของ npm pack กับ
  tarball update ตัวเลือก เพื่อให้ installer e2e จับ pack bloat โดยไม่ตั้งใจ
  ได้ก่อนเส้นทาง release publish
- หากงาน release แตะการวางแผน CI, timing manifest ของ extension หรือ
  matrix เทสต์ของ extension ให้ regenerate และ review output matrix
  `plugin-prerelease-extension-shard` ที่ planner เป็นเจ้าของจาก
  `.github/workflows/plugin-prerelease.yml` ก่อนอนุมัติ เพื่อให้ release notes
  ไม่อธิบาย layout CI ที่ล้าสมัย
- ความพร้อมของ release macOS แบบ stable ยังรวมถึงพื้นผิว updater:
  - GitHub release ต้องจบด้วย `.zip`, `.dmg` และ `.dSYM.zip` ที่ถูก package แล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปยัง stable zip ใหม่หลัง publish
  - app ที่ถูก package ต้องคง bundle id ที่ไม่ใช่ debug, URL feed ของ Sparkle
    ที่ไม่ว่าง และ `CFBundleVersion` ที่เท่ากับหรือสูงกว่า canonical Sparkle build floor
    สำหรับเวอร์ชัน release นั้น

## Release test boxes

`Full Release Validation` คือวิธีที่ operators เริ่มเทสต์ก่อน release ทั้งหมดจาก
entrypoint เดียว สำหรับหลักฐาน commit ที่ pin ไว้บน branch ที่เคลื่อนไหวเร็ว ให้ใช้
helper เพื่อให้ workflow ลูกทุกตัวรันจาก branch ชั่วคราวที่ตรึงไว้กับ target
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

helper จะ push `release-ci/<sha>-...`, dispatch `Full Release Validation`
จาก branch นั้นด้วย `ref=<sha>`, ตรวจสอบว่า workflow ลูกทุกตัวมี `headSha`
ตรงกับ target แล้วลบ branch ชั่วคราว วิธีนี้หลีกเลี่ยงการพิสูจน์
child run ของ `main` ที่ใหม่กว่าโดยไม่ตั้งใจ

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

เวิร์กโฟลว์จะแก้ค่า ref เป้าหมาย, เรียกใช้ `CI` แบบ manual ด้วย
`target_ref=<release-ref>`, เรียกใช้ `OpenClaw Release Checks`, เตรียมอาร์ติแฟกต์
หลัก `release-package-under-test` สำหรับการตรวจสอบที่เกี่ยวกับแพ็กเกจ และ
เรียกใช้ Telegram E2E สำหรับแพ็กเกจแบบสแตนด์อโลนเมื่อ `release_profile=full` พร้อม
`rerun_group=all` หรือเมื่อมีการตั้งค่า `npm_telegram_package_spec` จากนั้น `OpenClaw Release
Checks` จะกระจายไปยัง install smoke, การตรวจสอบรุ่นเผยแพร่ข้าม OS, ความครอบคลุมเส้นทาง
release ของ live/E2E Docker เมื่อเปิดใช้ soak, Package Acceptance พร้อม QA แพ็กเกจ Telegram,
QA Lab parity, Matrix แบบ live และ Telegram แบบ live การรันเต็มรูปแบบจะยอมรับได้ก็ต่อเมื่อ
สรุป `Full Release Validation`
แสดงว่า `normal_ci` และ `release_checks` สำเร็จ ในโหมด full/all
ลูก `npm_telegram` ต้องสำเร็จด้วย; นอกเหนือจาก full/all จะถูกข้าม
เว้นแต่จะระบุ `npm_telegram_package_spec` ที่เผยแพร่แล้ว สรุปตัวตรวจสอบขั้นสุดท้าย
มีตารางงานที่ช้าที่สุดสำหรับแต่ละ child run เพื่อให้ release manager
เห็น critical path ปัจจุบันโดยไม่ต้องดาวน์โหลดล็อก
ดู [การตรวจสอบรุ่นเผยแพร่แบบเต็ม](/th/reference/full-release-validation) สำหรับ
stage matrix ฉบับสมบูรณ์, ชื่องานเวิร์กโฟลว์ที่แน่นอน, ความแตกต่างระหว่างโปรไฟล์ stable กับ full,
อาร์ติแฟกต์ และ handle สำหรับรันซ้ำแบบเจาะจง
child workflows ถูกเรียกใช้จาก ref ที่เชื่อถือได้ซึ่งรัน `Full Release
Validation` โดยปกติคือ `--ref main` แม้ว่า `ref` เป้าหมายจะชี้ไปที่
release branch หรือ tag ที่เก่ากว่า ไม่มีอินพุต workflow-ref แยกต่างหากสำหรับ Full Release Validation;
เลือก harness ที่เชื่อถือได้โดยเลือก ref ของ workflow run
อย่าใช้ `--ref main -f ref=<sha>` สำหรับหลักฐาน commit ที่แน่นอนบน `main` ที่เคลื่อนไหวอยู่;
ไม่สามารถใช้ SHA ของ commit ดิบเป็น workflow dispatch refs ได้ ดังนั้นให้ใช้
`pnpm ci:full-release --sha <sha>` เพื่อสร้าง branch ชั่วคราวที่ pin ไว้

ใช้ `release_profile` เพื่อเลือกความกว้างของ live/provider:

- `minimum`: เส้นทาง live และ Docker ของ OpenAI/core ที่สำคัญต่อ release และเร็วที่สุด
- `stable`: minimum พร้อมความครอบคลุม provider/backend แบบ stable สำหรับการอนุมัติ release
- `full`: stable พร้อมความครอบคลุม provider/media แบบ advisory ที่กว้างขึ้น

ใช้ `run_release_soak=true` กับ `stable` เมื่อ lanes ที่บล็อก release
เป็นสีเขียวและคุณต้องการ sweep แบบ exhaustive ของ live/E2E, เส้นทาง release ของ Docker และ
upgrade-survivor ที่เผยแพร่แล้วแบบมีขอบเขตก่อน promotion sweep นั้นครอบคลุม
แพ็กเกจ stable สี่รายการล่าสุด รวมถึง baseline ที่ pin ไว้ `2026.4.23` และ `2026.5.2`
พร้อมความครอบคลุม `2026.4.15` ที่เก่ากว่า โดยลบ baseline ที่ซ้ำกันออกและ
แบ่งแต่ละ baseline เป็น Docker runner job ของตัวเอง `full` หมายถึง
`run_release_soak=true`

`OpenClaw Release Checks` ใช้ ref ของเวิร์กโฟลว์ที่เชื่อถือได้เพื่อแก้ค่า ref เป้าหมาย
หนึ่งครั้งเป็น `release-package-under-test` และใช้อาร์ติแฟกต์นั้นซ้ำใน cross-OS,
Package Acceptance และการตรวจสอบ Docker เส้นทาง release เมื่อ soak ทำงาน วิธีนี้ทำให้
กล่องทั้งหมดที่เกี่ยวกับแพ็กเกจใช้ bytes ชุดเดียวกันและหลีกเลี่ยงการ build แพ็กเกจซ้ำ
install smoke ของ OpenAI ข้าม OS ใช้ `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อ
ตั้งค่าตัวแปร repo/org แล้ว มิฉะนั้นใช้ `openai/gpt-5.4` เพราะ lane นี้
พิสูจน์การติดตั้งแพ็กเกจ, onboarding, การเริ่มต้น Gateway และ agent turn แบบ live หนึ่งครั้ง
ไม่ใช่การ benchmark โมเดล default ที่ช้าที่สุด matrix ของ live provider ที่กว้างกว่า
ยังคงเป็นที่สำหรับความครอบคลุมเฉพาะโมเดล

ใช้ variants เหล่านี้ตาม stage ของ release:

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

อย่าใช้ umbrella แบบเต็มเป็นการรันซ้ำครั้งแรกหลังจากแก้ไขแบบเจาะจง หากกล่องหนึ่ง
ล้มเหลว ให้ใช้ child workflow, job, Docker lane, package profile, model
provider หรือ QA lane ที่ล้มเหลวสำหรับหลักฐานรอบถัดไป รัน umbrella แบบเต็มอีกครั้งก็ต่อเมื่อ
การแก้ไขเปลี่ยน release orchestration ที่ใช้ร่วมกัน หรือทำให้หลักฐาน all-box ก่อนหน้า
ล้าสมัย ตัวตรวจสอบขั้นสุดท้ายของ umbrella จะตรวจซ้ำ workflow run ids ของ child ที่บันทึกไว้
ดังนั้นหลังจาก child workflow ถูกรันซ้ำสำเร็จแล้ว ให้รันซ้ำเฉพาะ parent job
`Verify full validation` ที่ล้มเหลว

สำหรับการ recovery แบบมีขอบเขต ให้ส่ง `rerun_group` ไปยัง umbrella `all` คือการรัน
release-candidate จริง, `ci` รันเฉพาะ child ของ CI ปกติ, `plugin-prerelease`
รันเฉพาะ child ของ plugin ที่มีเฉพาะ release, `release-checks` รันทุกกล่องของ release
และกลุ่ม release ที่แคบกว่าคือ `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` และ `npm-telegram`
การรันซ้ำ `npm-telegram` แบบเจาะจงต้องใช้ `npm_telegram_package_spec`; การรัน full/all
ด้วย `release_profile=full` ใช้อาร์ติแฟกต์แพ็กเกจของ release-checks การรันซ้ำ
cross-OS แบบเจาะจงสามารถเพิ่ม `cross_os_suite_filter=windows/packaged-upgrade` หรือ
ตัวกรอง OS/suite อื่นได้ ความล้มเหลวของ QA release-check เป็น advisory; ความล้มเหลวเฉพาะ QA
ไม่บล็อกการตรวจสอบ release

### Vitest

กล่อง Vitest คือ child workflow `CI` แบบ manual Manual CI ตั้งใจ
ข้าม changed scoping และบังคับกราฟทดสอบปกติสำหรับ release
candidate: Linux Node shards, bundled-plugin shards, channel contracts, ความเข้ากันได้กับ Node 22,
`check`, `check-additional`, build smoke, docs checks, Python
skills, Windows, macOS, Android และ Control UI i18n

ใช้กล่องนี้เพื่อตอบว่า "source tree ผ่านชุดทดสอบปกติแบบเต็มหรือไม่"
มันไม่เหมือนกับการตรวจสอบ product validation ตามเส้นทาง release หลักฐานที่ควรเก็บไว้:

- สรุป `Full Release Validation` ที่แสดง URL ของ run `CI` ที่ถูกเรียกใช้
- run `CI` เป็นสีเขียวบน target SHA ที่แน่นอน
- ชื่อ shard ที่ล้มเหลวหรือช้าจากงาน CI เมื่อตรวจสอบ regression
- อาร์ติแฟกต์ timing ของ Vitest เช่น `.artifacts/vitest-shard-timings.json` เมื่อ
  run ต้องการการวิเคราะห์ performance

รัน manual CI โดยตรงก็ต่อเมื่อ release ต้องใช้ CI ปกติที่ deterministic แต่
ไม่ต้องใช้กล่อง Docker, QA Lab, live, cross-OS หรือ package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

กล่อง Docker อยู่ใน `OpenClaw Release Checks` ผ่าน
`openclaw-live-and-e2e-checks-reusable.yml` รวมถึงเวิร์กโฟลว์
`install-smoke` แบบ release-mode มันตรวจสอบ release candidate ผ่านสภาพแวดล้อม
Docker แบบ packaged แทนที่จะเป็นเพียงการทดสอบระดับ source

ความครอบคลุม Docker ของ release รวมถึง:

- install smoke แบบเต็มพร้อมเปิดใช้ slow Bun global install smoke
- การเตรียม/ใช้งานซ้ำ root Dockerfile smoke image ตาม target SHA โดยมี QR,
  root/gateway และ installer/Bun smoke jobs ทำงานเป็น install-smoke
  shards แยกกัน
- repository E2E lanes
- release-path Docker chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` และ `plugins-runtime-install-h`
- ความครอบคลุม OpenWebUI ภายใน chunk `plugins-runtime-services` เมื่อร้องขอ
- lanes การ install/uninstall bundled plugin แบบแยก
  `bundled-plugin-install-uninstall-0` ถึง
  `bundled-plugin-install-uninstall-23`
- live/E2E provider suites และความครอบคลุม Docker live model เมื่อ release checks
  รวม live suites

ใช้อาร์ติแฟกต์ Docker ก่อนรันซ้ำ scheduler ของ release-path อัปโหลด
`.artifacts/docker-tests/` พร้อม lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON และคำสั่ง rerun สำหรับการ recovery แบบเจาะจง
ให้ใช้ `docker_lanes=<lane[,lane]>` บนเวิร์กโฟลว์ live/E2E แบบ reusable แทน
การรัน release chunks ทั้งหมดซ้ำ คำสั่ง rerun ที่สร้างขึ้นมี
`package_artifact_run_id` ก่อนหน้าและอินพุต Docker image ที่เตรียมไว้เมื่อมีอยู่ ดังนั้น
lane ที่ล้มเหลวสามารถใช้ tarball และ GHCR images ชุดเดิมซ้ำได้

### QA Lab

กล่อง QA Lab เป็นส่วนหนึ่งของ `OpenClaw Release Checks` เช่นกัน มันคือ release gate
สำหรับพฤติกรรมแบบ agentic และระดับ channel แยกจาก Vitest และกลไก
แพ็กเกจของ Docker

ความครอบคลุม QA Lab ของ release รวมถึง:

- mock parity lane ที่เปรียบเทียบ OpenAI candidate lane กับ baseline Opus 4.6
  โดยใช้ agentic parity pack
- โปรไฟล์ Matrix QA แบบ live ที่รวดเร็วโดยใช้ environment `qa-live-shared`
- live Telegram QA lane โดยใช้ Convex CI credential leases
- `pnpm qa:otel:smoke` เมื่อ release telemetry ต้องการหลักฐาน local ที่ชัดเจน

ใช้กล่องนี้เพื่อตอบว่า "release ทำงานถูกต้องใน QA scenarios และ
live channel flows หรือไม่" เก็บ URL ของอาร์ติแฟกต์สำหรับ parity, Matrix และ Telegram
lanes เมื่ออนุมัติ release ความครอบคลุม Matrix แบบเต็มยังคงพร้อมใช้งานเป็น
QA-Lab run แบบ manual sharded แทนที่จะเป็น lane เริ่มต้นที่สำคัญต่อ release

### แพ็กเกจ

กล่องแพ็กเกจคือ installable-product gate มันรองรับโดย
`Package Acceptance` และ resolver
`scripts/resolve-openclaw-package-candidate.mjs` resolver ทำให้
candidate เป็นมาตรฐานเป็น tarball `package-under-test` ที่ Docker E2E ใช้, ตรวจสอบ
package inventory, บันทึก package version และ SHA-256 และแยก ref ของ workflow harness
ออกจาก ref ของ package source

แหล่งที่มาของ candidate ที่รองรับ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` หรือ OpenClaw release
  version ที่แน่นอน
- `source=ref`: pack branch, tag หรือ full commit SHA ของ `package_ref` ที่เชื่อถือได้
  ด้วย harness `workflow_ref` ที่เลือก
- `source=url`: ดาวน์โหลด HTTPS `.tgz` พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: ใช้ `.tgz` ที่อัปโหลดโดย GitHub Actions run อื่นซ้ำ

`OpenClaw Release Checks` รัน Package Acceptance ด้วย `source=artifact`,
อาร์ติแฟกต์แพ็กเกจ release ที่เตรียมไว้, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` Package Acceptance เก็บการ migration, update,
restart หลัง update configured-auth, การ cleanup stale plugin dependency, fixtures plugin แบบ offline,
plugin update และ Telegram package QA เทียบกับ tarball ที่ resolve แล้วชุดเดียวกัน
release checks ที่บล็อกใช้ baseline แพ็กเกจ published latest เริ่มต้น;
`run_release_soak=true` หรือ
`release_profile=full` ขยายไปยัง baseline ที่ npm-published แบบ stable ทุกตัวตั้งแต่
`2026.4.23` ถึง `latest` รวมถึง fixtures ของ reported-issue ใช้
Package Acceptance ด้วย `source=npm` สำหรับ candidate ที่ ship แล้ว หรือ
`source=ref`/`source=artifact` สำหรับ tarball npm local ที่มี SHA รองรับก่อน
publish มันคือสิ่งทดแทนแบบ GitHub-native
สำหรับความครอบคลุม package/update ส่วนใหญ่ที่ก่อนหน้านี้ต้องใช้
Parallels การตรวจสอบ release ข้าม OS ยังสำคัญสำหรับ onboarding,
installer และพฤติกรรมเฉพาะ platform แต่การตรวจสอบ product validation ของ package/update ควร
เลือกใช้ Package Acceptance

checklist หลักสำหรับการตรวจสอบ update และ plugin คือ
[การทดสอบ updates และ plugins](/th/help/testing-updates-plugins) ใช้มันเมื่อ
ตัดสินใจว่า lane แบบ local, Docker, Package Acceptance หรือ release-check ใดพิสูจน์การ
install/update plugin, doctor cleanup หรือการเปลี่ยนแปลง migration ของ published-package
การ migration การ update ที่เผยแพร่แล้วแบบ exhaustive จากทุกแพ็กเกจ stable `2026.4.23+` คือ
เวิร์กโฟลว์ `Update Migration` แบบ manual แยกต่างหาก ไม่ใช่ส่วนหนึ่งของ Full Release CI

การผ่อนปรนการยอมรับแพ็กเกจแบบเดิมถูกจำกัดเวลาไว้อย่างตั้งใจ แพ็กเกจจนถึง
`2026.4.25` อาจใช้เส้นทางความเข้ากันได้สำหรับช่องว่างของเมทาดาทาที่เผยแพร่ไปยัง
npm แล้ว ได้แก่ รายการคลัง QA ส่วนตัวที่หายไปจาก tarball, ไม่มี
`gateway install --wrapper`, ไม่มีไฟล์แพตช์ใน git fixture ที่ได้จาก tarball,
ไม่มี `update.channel` ที่คงอยู่, ตำแหน่ง install-record ของ plugin แบบเดิม,
ไม่มีการคงอยู่ของ install-record จาก marketplace และการย้ายเมทาดาทาคอนฟิกระหว่าง
`plugins update` แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ตราประทับ
เมทาดาทาการบิลด์ในเครื่องที่ถูกส่งออกไปแล้ว แพ็กเกจหลังจากนั้นต้องเป็นไปตามสัญญาแพ็กเกจ
สมัยใหม่ ช่องว่างเดียวกันเหล่านั้นจะทำให้การตรวจสอบรีลีสล้มเหลว

ใช้โปรไฟล์ Package Acceptance ที่กว้างขึ้นเมื่อคำถามของรีลีสเกี่ยวกับ
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

- `smoke`: เลนติดตั้งแพ็กเกจ/ช่องทาง/agent, เครือข่าย gateway และโหลดคอนฟิกใหม่แบบเร็ว
- `package`: สัญญาแพ็กเกจสำหรับติดตั้ง/อัปเดต/รีสตาร์ต/plugin โดยไม่มี
  ClawHub แบบสด นี่คือค่าเริ่มต้นของการตรวจสอบรีลีส
- `product`: `package` รวมกับช่องทาง MCP, การล้าง cron/subagent, การค้นเว็บด้วย OpenAI
  และ OpenWebUI
- `full`: ส่วนย่อยของเส้นทางรีลีส Docker พร้อม OpenWebUI
- `custom`: รายการ `docker_lanes` ที่แน่นอนสำหรับการรันซ้ำแบบเจาะจง

สำหรับหลักฐาน Telegram ของแพ็กเกจตัวเลือก ให้เปิดใช้ `telegram_mode=mock-openai` หรือ
`telegram_mode=live-frontier` บน Package Acceptance เวิร์กโฟลว์จะส่ง tarball
`package-under-test` ที่แก้ค่าแล้วเข้าเลน Telegram ส่วนเวิร์กโฟลว์ Telegram แบบสแตนด์อโลน
ยังรับสเปก npm ที่เผยแพร่แล้วสำหรับการตรวจสอบหลังเผยแพร่

## ระบบอัตโนมัติสำหรับเผยแพร่รีลีส

`OpenClaw Release Publish` คือจุดเข้าหลักสำหรับการเผยแพร่แบบเปลี่ยนแปลงสถานะตามปกติ โดย
ประสานเวิร์กโฟลว์ trusted-publisher ตามลำดับที่รีลีสต้องการ:

1. เช็กเอาต์แท็กรีลีสและแก้ค่า commit SHA ของแท็ก
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

ใช้เวิร์กโฟลว์ระดับล่าง `Plugin NPM Release` และ `Plugin ClawHub Release`
เฉพาะสำหรับงานซ่อมแซมหรือเผยแพร่ซ้ำแบบเจาะจงเท่านั้น สำหรับการซ่อมแซม plugin ที่เลือก ให้ส่ง
`plugin_publish_scope=selected` และ `plugins=@openclaw/name` ไปยัง
`OpenClaw Release Publish` หรือ dispatch เวิร์กโฟลว์ลูกโดยตรงเมื่อไม่ควรเผยแพร่
แพ็กเกจ OpenClaw

## อินพุตเวิร์กโฟลว์ NPM

`OpenClaw NPM Release` รับอินพุตที่ผู้ปฏิบัติการควบคุมได้ดังนี้:

- `tag`: แท็กรีลีสที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1` หรือ
  `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` ยังอาจเป็น commit SHA
  แบบเต็ม 40 อักขระปัจจุบันของ workflow-branch สำหรับ preflight เฉพาะการตรวจสอบได้ด้วย
- `preflight_only`: `true` สำหรับตรวจสอบ/บิลด์/แพ็กเกจเท่านั้น, `false` สำหรับ
  เส้นทางเผยแพร่จริง
- `preflight_run_id`: จำเป็นในเส้นทางเผยแพร่จริง เพื่อให้เวิร์กโฟลว์ใช้ tarball
  ที่เตรียมไว้จากการรัน preflight ที่สำเร็จ
- `npm_dist_tag`: แท็กเป้าหมายของ npm สำหรับเส้นทางเผยแพร่ ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Publish` รับอินพุตที่ผู้ปฏิบัติการควบคุมได้ดังนี้:

- `tag`: แท็กรีลีสที่จำเป็น ต้องมีอยู่แล้ว
- `preflight_run_id`: id การรัน preflight ของ `OpenClaw NPM Release` ที่สำเร็จ;
  จำเป็นเมื่อ `publish_openclaw_npm=true`
- `npm_dist_tag`: แท็กเป้าหมายของ npm สำหรับแพ็กเกจ OpenClaw
- `plugin_publish_scope`: ค่าเริ่มต้นคือ `all-publishable`; ใช้ `selected` เฉพาะ
  สำหรับงานซ่อมแซมแบบเจาะจง
- `plugins`: ชื่อแพ็กเกจ `@openclaw/*` คั่นด้วยจุลภาคเมื่อ
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: ค่าเริ่มต้นคือ `true`; ตั้งเป็น `false` เฉพาะเมื่อใช้
  เวิร์กโฟลว์เป็นตัวประสานงานซ่อมแซมเฉพาะ plugin

`OpenClaw Release Checks` รับอินพุตที่ผู้ปฏิบัติการควบคุมได้ดังนี้:

- `ref`: branch, tag หรือ commit SHA แบบเต็มที่จะตรวจสอบ การตรวจสอบที่มี secret
  ต้องให้ commit ที่แก้ค่าแล้วเข้าถึงได้จาก branch หรือแท็กรีลีสของ OpenClaw
- `run_release_soak`: เลือกใช้การทดสอบ soak แบบครอบคลุมสำหรับ live/E2E, เส้นทางรีลีส Docker
  และ all-since upgrade-survivor บนการตรวจสอบรีลีส stable/default โดยจะถูกบังคับเปิดด้วย
  `release_profile=full`

กฎ:

- แท็ก Stable และแท็กแก้ไขอาจเผยแพร่ไปยัง `beta` หรือ `latest` ก็ได้
- แท็ก prerelease แบบ Beta อาจเผยแพร่ได้เฉพาะไปยัง `beta`
- สำหรับ `OpenClaw NPM Release` อินพุต commit SHA แบบเต็มอนุญาตเฉพาะเมื่อ
  `preflight_only=true`
- `OpenClaw Release Checks` และ `Full Release Validation` เป็นการตรวจสอบเท่านั้นเสมอ
- เส้นทางเผยแพร่จริงต้องใช้ `npm_dist_tag` เดียวกับที่ใช้ระหว่าง preflight;
  เวิร์กโฟลว์จะตรวจสอบว่าเมทาดาทานั้นยังคงต่อเนื่องก่อนเผยแพร่

## ลำดับรีลีส npm แบบ Stable

เมื่อออกรีลีส npm แบบ stable:

1. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนมีแท็ก คุณอาจใช้ commit SHA แบบเต็มปัจจุบันของ workflow-branch
     สำหรับการ dry run แบบตรวจสอบเท่านั้นของเวิร์กโฟลว์ preflight
2. เลือก `npm_dist_tag=beta` สำหรับโฟลว์ปกติที่เริ่มจาก beta ก่อน หรือ `latest` เฉพาะ
   เมื่อคุณตั้งใจเผยแพร่ stable โดยตรง
3. รัน `Full Release Validation` บน branch รีลีส, แท็กรีลีส หรือ commit SHA แบบเต็ม
   เมื่อคุณต้องการ CI ปกติรวมกับ live prompt cache, Docker, QA Lab,
   Matrix และความครอบคลุมของ Telegram จากเวิร์กโฟลว์แบบ manual เดียว
4. หากคุณตั้งใจต้องการเฉพาะกราฟทดสอบปกติแบบกำหนดแน่นอน ให้รันเวิร์กโฟลว์ manual `CI`
   บน ref รีลีสแทน
5. บันทึก `preflight_run_id` ที่สำเร็จ
6. รัน `OpenClaw Release Publish` ด้วย `tag` เดียวกัน, `npm_dist_tag` เดียวกัน
   และ `preflight_run_id` ที่บันทึกไว้ โดยจะเผยแพร่ plugins ที่ externalized ไปยัง npm
   และ ClawHub ก่อนโปรโมตแพ็กเกจ npm ของ OpenClaw
7. หากรีลีสลงที่ `beta` ให้ใช้เวิร์กโฟลว์ส่วนตัว
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   เพื่อโปรโมตเวอร์ชัน stable นั้นจาก `beta` ไปยัง `latest`
8. หากรีลีสตั้งใจเผยแพร่ตรงไปยัง `latest` และ `beta`
   ควรตามบิลด์ stable เดียวกันทันที ให้ใช้เวิร์กโฟลว์ส่วนตัวเดียวกันนั้น
   เพื่อชี้ dist-tags ทั้งสองไปยังเวอร์ชัน stable หรือปล่อยให้การซิงก์ self-healing
   ตามกำหนดเวลาย้าย `beta` ภายหลัง

การเปลี่ยนแปลง dist-tag อยู่ใน repo ส่วนตัวเพื่อความปลอดภัย เพราะยังต้องใช้
`NPM_TOKEN` ขณะที่ repo สาธารณะคงการเผยแพร่แบบ OIDC เท่านั้น

สิ่งนี้ทำให้ทั้งเส้นทางเผยแพร่โดยตรงและเส้นทางโปรโมตแบบ beta-first
มีเอกสารกำกับและผู้ปฏิบัติการมองเห็นได้

หาก maintainer ต้องถอยกลับไปใช้การยืนยันตัวตน npm ในเครื่อง ให้รันคำสั่ง 1Password
CLI (`op`) ใด ๆ ภายในเซสชัน tmux เฉพาะเท่านั้น อย่าเรียก `op`
โดยตรงจาก shell หลักของ agent การเก็บไว้ใน tmux ทำให้ prompt,
alert และการจัดการ OTP สังเกตได้ และป้องกัน alert จากโฮสต์ที่เกิดซ้ำ

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

maintainers ใช้เอกสารรีลีสส่วนตัวใน
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
สำหรับ runbook จริง

## ที่เกี่ยวข้อง

- [ช่องทางการเผยแพร่](/th/install/development-channels)
