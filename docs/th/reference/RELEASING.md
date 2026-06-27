---
read_when:
    - กำลังมองหาคำนิยามช่องทางเผยแพร่สาธารณะ
    - กำลังรันการตรวจสอบความถูกต้องของรีลีสหรือการยอมรับแพ็กเกจ
    - กำลังมองหาการตั้งชื่อเวอร์ชันและรอบการเผยแพร่
summary: ช่องทางการเผยแพร่ รายการตรวจสอบสำหรับผู้ปฏิบัติงาน กล่องการตรวจสอบความถูกต้อง การตั้งชื่อเวอร์ชัน และรอบการเผยแพร่
title: นโยบายการเผยแพร่
x-i18n:
    generated_at: "2026-06-27T18:18:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16873b02f09bd0f67ea16644630defc1b17b6f236572715df598a2253dba3b2d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw มีเลนเผยแพร่สาธารณะสามแบบ:

- stable: รีลีสที่ติดแท็กซึ่งเผยแพร่ไปยัง npm `beta` โดยค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อมีการร้องขออย่างชัดเจน
- beta: แท็ก prerelease ที่เผยแพร่ไปยัง npm `beta`
- dev: หัวที่เคลื่อนไหวของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันรีลีส Stable: `YYYY.M.PATCH`
  - แท็ก Git: `vYYYY.M.PATCH`
- เวอร์ชันรีลีสแก้ไข Stable: `YYYY.M.PATCH-N`
  - แท็ก Git: `vYYYY.M.PATCH-N`
- เวอร์ชัน prerelease Beta: `YYYY.M.PATCH-beta.N`
  - แท็ก Git: `vYYYY.M.PATCH-beta.N`
- ห้ามเติมศูนย์นำหน้าที่เดือนหรือแพตช์
- ตั้งแต่การอัปเดตกระบวนการรีลีสเดือนมิถุนายน 2026 องค์ประกอบที่สามคือ
  หมายเลข release-train รายเดือนแบบลำดับต่อเนื่อง ไม่ใช่วันตามปฏิทิน รีลีส Stable และ beta
  จะกำหนด train ปัจจุบัน แท็กเฉพาะ alpha จะไม่ใช้หรือ
  เลื่อนหมายเลขแพตช์ beta/stable แท็กและเวอร์ชัน npm ก่อนการอัปเดตจะคง
  ชื่อเดิมและยังคงใช้ได้ ระบบอัตโนมัติสำหรับรีลีสจะยังคง
  เปรียบเทียบตามปี เดือน แพตช์ ช่องทาง และหมายเลข prerelease หรือ correction
- บิลด์ Alpha/nightly ใช้ patch train ถัดไปที่ยังไม่รีลีส และเพิ่มเฉพาะ
  `alpha.N` สำหรับบิลด์ซ้ำ เมื่อแพตช์นั้นมี beta แล้ว บิลด์ alpha ใหม่
  จะย้ายไปยังแพตช์ถัดไป ให้ละเว้นแท็กเดิมที่เป็น alpha-only และมีหมายเลขแพตช์
  สูงกว่าเมื่อเลือก train สำหรับ beta หรือ stable
- เวอร์ชัน npm แก้ไขไม่ได้ หากแท็ก beta ถูกเผยแพร่ไปแล้ว ห้าม
  ลบ เผยแพร่ซ้ำ หรือนำกลับมาใช้ใหม่ ให้ตัดหมายเลข beta ถัดไปหรือแพตช์รายเดือน
  ถัดไปแทน เนื่องจาก `2026.6.5-beta.1` ถูกเผยแพร่ไปแล้วระหว่าง
  ช่วงเปลี่ยนผ่าน release train เดือนมิถุนายน 2026 ต้องใช้แพตช์ `5` หรือสูงกว่า ห้าม
  เผยแพร่ train stable หรือ beta ใหม่ของเดือนมิถุนายน 2026 เป็น `2026.6.2`, `2026.6.3` หรือ
  `2026.6.4`
- หลังจาก stable `2026.6.5` train beta ใหม่ถัดไปคือ `2026.6.6-beta.1` แม้ว่า
  จะมีแท็กอัตโนมัติแบบ alpha-only ที่มีหมายเลขแพตช์สูงกว่าอยู่แล้วก็ตาม
- `latest` หมายถึงรีลีส npm stable ปัจจุบันที่ถูกโปรโมตแล้ว
- `beta` หมายถึงเป้าหมายการติดตั้ง beta ปัจจุบัน
- รีลีส Stable และรีลีสแก้ไข stable จะเผยแพร่ไปยัง npm `beta` โดยค่าเริ่มต้น ผู้ดำเนินการรีลีสสามารถกำหนดเป้าหมายเป็น `latest` อย่างชัดเจน หรือโปรโมตบิลด์ beta ที่ผ่านการตรวจแล้วภายหลัง
- รีลีส OpenClaw stable ทุกครั้งจะส่งแพ็กเกจ npm, แอป macOS และตัวติดตั้ง
  Windows Hub ที่ลงนามแล้วพร้อมกัน ส่วนรีลีส beta โดยปกติจะตรวจสอบและเผยแพร่
  เส้นทาง npm/package ก่อน โดยสงวนการ build/sign/notarize/promote ของแอปเนทีฟ
  ไว้สำหรับ stable เว้นแต่จะมีการร้องขออย่างชัดเจน

## จังหวะการรีลีส

- รีลีสจะเดินแบบ beta-first
- Stable จะตามมาเฉพาะหลังจาก beta ล่าสุดผ่านการตรวจสอบแล้ว
- โดยปกติ maintainers จะตัดรีลีสจากบรานช์ `release/YYYY.M.PATCH` ที่สร้าง
  จาก `main` ปัจจุบัน เพื่อให้การตรวจสอบรีลีสและการแก้ไขไม่บล็อก
  การพัฒนาใหม่บน `main`
- หากแท็ก beta ถูก push หรือเผยแพร่แล้วและต้องการแก้ไข maintainers จะตัด
  แท็ก `-beta.N` ถัดไปแทนการลบหรือสร้างแท็ก beta เดิมใหม่
- ขั้นตอนรีลีสโดยละเอียด การอนุมัติ credentials และบันทึกการกู้คืนเป็น
  สำหรับ maintainer เท่านั้น

## เช็กลิสต์ผู้ดำเนินการรีลีส

เช็กลิสต์นี้คือรูปทรงสาธารณะของโฟลว์รีลีส รายละเอียด credentials ส่วนตัว
การลงนาม การ notarization การกู้คืน dist-tag และการ rollback ฉุกเฉินจะอยู่ใน
runbook รีลีสสำหรับ maintainer เท่านั้น

1. เริ่มจาก `main` ปัจจุบัน: pull ล่าสุด ยืนยันว่า commit เป้าหมายถูก push แล้ว
   และยืนยันว่า CI ของ `main` ปัจจุบันเขียวพอที่จะสร้างบรานช์จากมันได้
2. สร้างส่วนบนสุดของ `CHANGELOG.md` จาก PR ที่ merge แล้วและ commit ตรงทั้งหมด
   ตั้งแต่แท็กรีลีสล่าสุดที่เข้าถึงได้ ให้รายการเป็นแบบมองจากผู้ใช้
   ลบรายการซ้ำที่ทับซ้อนระหว่าง PR/commit ตรง commit การเขียนใหม่ push
   แล้ว rebase/pull อีกครั้งก่อนสร้างบรานช์
3. ตรวจสอบบันทึกความเข้ากันได้ของรีลีสใน
   `src/plugins/compat/registry.ts` และ
   `src/commands/doctor/shared/deprecation-compat.ts` ลบความเข้ากันได้
   ที่หมดอายุเฉพาะเมื่อเส้นทางอัปเกรดยังคงครอบคลุมอยู่ หรือบันทึกเหตุผลว่าทำไมจึง
   ตั้งใจคงไว้
4. สร้าง `release/YYYY.M.PATCH` จาก `main` ปัจจุบัน อย่าทำงานรีลีสปกติ
   โดยตรงบน `main`
5. เพิ่มเวอร์ชันในทุกตำแหน่งที่จำเป็นสำหรับแท็กที่ตั้งใจไว้ จากนั้นรัน
   `pnpm release:prep` คำสั่งนี้จะรีเฟรชเวอร์ชัน Plugin, inventory ของ Plugin, สคีมา config
   metadata config ของช่องทางที่ bundled, baseline เอกสาร config, exports ของ plugin SDK
   และ baseline API ของ plugin SDK ตามลำดับที่ถูกต้อง commit drift ที่สร้างขึ้น
   ก่อนติดแท็ก จากนั้นรัน preflight แบบ deterministic ในเครื่อง:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` และ `pnpm release:check`
6. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true` ก่อนมีแท็ก
   สามารถใช้ SHA แบบเต็ม 40 อักขระของ release-branch สำหรับ preflight เฉพาะการตรวจสอบได้
   preflight จะสร้างหลักฐาน dependency release สำหรับ
   กราฟ dependency ที่ check out อย่างแม่นยำ และจัดเก็บไว้ใน artifact preflight ของ npm
   บันทึก `preflight_run_id` ที่สำเร็จไว้
7. เริ่มการทดสอบก่อนรีลีสทั้งหมดด้วย `Full Release Validation` สำหรับ
   release branch, tag หรือ full commit SHA นี่คือ entrypoint แบบ manual จุดเดียว
   สำหรับกล่องทดสอบรีลีสขนาดใหญ่สี่ชุด: Vitest, Docker, QA Lab และ Package
8. หาก validation ล้มเหลว ให้แก้บน release branch แล้วรันซ้ำเฉพาะไฟล์
   lane, workflow job, package profile, provider หรือ model allowlist ที่ล้มเหลวน้อยที่สุด
   ซึ่งพิสูจน์การแก้ไข รัน umbrella แบบเต็มซ้ำเฉพาะเมื่อ surface ที่เปลี่ยนทำให้
   หลักฐานเดิมล้าสมัย
9. สำหรับ candidate beta ที่ติดแท็กแล้ว ให้รัน
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` จากบรานช์
   `release/YYYY.M.PATCH` ที่ตรงกัน สำหรับ stable ให้ส่ง Windows source
   release ที่จำเป็นด้วย:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`
   helper จะรันการตรวจ generated-release ในเครื่อง dispatch หรือ verify
   หลักฐาน full release validation และ npm preflight รันหลักฐาน fresh/update ของ Parallels
   กับ tarball ที่เตรียมไว้ตรงกันพร้อมหลักฐานแพ็กเกจ Telegram
   บันทึกแผน npm ของ Plugin และ ClawHub แล้วพิมพ์คำสั่ง
   `OpenClaw Release Publish` ที่แน่นอนเฉพาะหลังจาก evidence bundle เขียวแล้ว
   `OpenClaw Release Publish` จะ dispatch แพ็กเกจ Plugin ที่เลือกหรือ publishable ทั้งหมด
   ไปยัง npm และชุดเดียวกันไปยัง ClawHub แบบขนาน จากนั้นโปรโมต
   artifact preflight npm ของ OpenClaw ที่เตรียมไว้ด้วย dist-tag ที่ตรงกันทันทีที่
   การ publish npm ของ Plugin สำเร็จ
   หลังจาก child สำหรับ publish npm ของ OpenClaw สำเร็จ จะสร้างหรืออัปเดต
   หน้า GitHub release/prerelease ที่ตรงกันจากส่วน `CHANGELOG.md` ที่ตรงกันครบถ้วน
   รีลีส Stable ที่เผยแพร่ไปยัง npm `latest` จะกลายเป็น GitHub latest release
   รีลีส maintenance แบบ stable ที่คงไว้บน npm `beta` จะถูกสร้างด้วย
   GitHub `latest=false` workflow ยังอัปโหลดหลักฐาน dependency ของ preflight
   manifest ของ full-validation และหลักฐาน postpublish registry
   verification ไปยัง GitHub release เพื่อใช้ตอบสนอง incident หลังรีลีส
   publish workflow จะพิมพ์ child run ID ทันที auto-approve
   gates ของ release environment ที่ workflow token ได้รับอนุญาตให้ approve สรุป
   child jobs ที่ล้มเหลวพร้อม log tails ปิดงาน GitHub release และหลักฐาน dependency
   ทันทีที่การ publish npm ของ OpenClaw สำเร็จ รอ ClawHub เมื่อใดก็ตามที่
   กำลัง publish npm ของ OpenClaw จากนั้นรัน `pnpm release:verify-beta` และ
   อัปโหลดหลักฐาน postpublish สำหรับ GitHub release, npm package, แพ็กเกจ npm ของ Plugin ที่เลือก,
   แพ็กเกจ ClawHub ที่เลือก, child workflow run IDs และ
   NPM Telegram run ID แบบ optional เส้นทาง ClawHub จะ retry ความล้มเหลวชั่วคราวของ
   การติดตั้ง dependency ของ CLI, publish Plugin ที่ผ่าน preview แม้เมื่อ preview cell หนึ่ง
   flake และจบด้วย registry verification สำหรับทุกเวอร์ชัน Plugin ที่คาดไว้
   เพื่อให้ partial publishes ยังคงมองเห็นได้และ retry ได้ จากนั้นรัน post-publish
   package acceptance กับแพ็กเกจที่เผยแพร่แล้ว
   `openclaw@YYYY.M.PATCH-beta.N` หรือ
   `openclaw@beta` หาก prerelease ที่ push หรือเผยแพร่แล้วต้องการแก้ไข
   ให้ตัดหมายเลข prerelease ที่ตรงกันถัดไป ห้ามลบหรือเขียน prerelease เดิมใหม่
10. สำหรับ stable ให้ดำเนินการต่อเฉพาะหลังจาก beta หรือ release candidate ที่ผ่านการตรวจแล้วมี
    หลักฐาน validation ที่จำเป็น การ publish npm แบบ stable ก็ผ่าน
    `OpenClaw Release Publish` เช่นกัน โดยใช้ artifact preflight ที่สำเร็จผ่าน
    `preflight_run_id`; ความพร้อมของรีลีส macOS แบบ stable ยังต้องมี
    `.zip`, `.dmg`, `.dSYM.zip` ที่แพ็กแล้ว และ `appcast.xml` ที่อัปเดตบน `main`
    macOS publish workflow จะ publish appcast ที่ลงนามแล้วไปยัง `main` สาธารณะ
    โดยอัตโนมัติหลังจากตรวจสอบ release assets แล้ว หาก branch protection บล็อก
    การ push โดยตรง จะเปิดหรืออัปเดต appcast PR ความพร้อมของ Windows Hub แบบ stable
    ต้องมี assets `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe` และ
    `OpenClawCompanion-SHA256SUMS.txt` ที่ลงนามแล้วบน GitHub release ของ OpenClaw
    ส่งแท็ก release ของ `openclaw/openclaw-windows-node` ที่ลงนามแล้วอย่างแม่นยำเป็น
    `windows_node_tag` และ digest map ของ installer ที่ candidate-approved เป็น
    `windows_node_installer_digests`; `OpenClaw Release Publish` จะคง
    release draft, dispatch `Windows Node Release` และ verify assets ทั้งสาม
    ก่อน publication
11. หลัง publish ให้รัน npm post-publish verifier, E2E ของ Telegram ที่เผยแพร่บน npm แบบ standalone
    ที่เป็น optional เมื่อคุณต้องการหลักฐานช่องทางหลัง publish,
    โปรโมต dist-tag เมื่อจำเป็น, verify หน้า GitHub release ที่สร้างขึ้น,
    รันขั้นตอนประกาศรีลีส จากนั้นทำ [การปิดงาน `main` สำหรับ Stable](#stable-main-closeout)
    ให้เสร็จก่อนเรียกรีลีส stable ว่าเสร็จสมบูรณ์

## การปิดงาน `main` สำหรับ Stable

การเผยแพร่ Stable ยังไม่สมบูรณ์จนกว่า `main` จะมีสถานะรีลีสที่ shipped จริง

1. เริ่มจาก `main` ล่าสุดที่สะอาด ตรวจสอบ `release/YYYY.M.PATCH` เทียบกับมัน และ
   forward-port การแก้ไขจริงที่ยังไม่มีใน `main` อย่าผสานอะแดปเตอร์สำหรับความเข้ากันได้ การทดสอบ หรือการตรวจสอบความถูกต้องเฉพาะรีลีส
   เข้าไปใน `main` ที่ใหม่กว่าโดยไม่พิจารณา
2. ตั้งค่า `main` เป็นเวอร์ชัน stable ที่จัดส่งแล้ว ไม่ใช่ขบวนรีลีสถัดไปที่คาดการณ์ไว้ รัน
   `pnpm release:prep` หลังจากเปลี่ยนเวอร์ชันราก จากนั้นรัน
   `pnpm deps:shrinkwrap:generate`
3. ทำให้ส่วน `## YYYY.M.PATCH` ของ `CHANGELOG.md` บน `main` ตรงกับ
   แบรนช์รีลีสที่ติดแท็กทุกประการ รวมการอัปเดต stable `appcast.xml` เมื่อรีลีส mac
   ได้เผยแพร่ไว้
4. อย่าเพิ่ม `YYYY.M.PATCH+1`, เวอร์ชัน beta หรือส่วน changelog อนาคตที่ว่างเปล่า
   ลงใน `main` จนกว่าโอเปอเรเตอร์จะเริ่มขบวนรีลีสนั้นอย่างชัดเจน
5. รัน `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` และ
   `OPENCLAW_TESTBOX=1 pnpm check:changed` จากนั้น push แล้วตรวจสอบว่า `origin/main`
   มีเวอร์ชันและ changelog ที่จัดส่งแล้ว ก่อนเรียกรีลีส stable ว่าเสร็จสิ้น
6. รักษาตัวแปร repository `RELEASE_ROLLBACK_DRILL_ID` และ
   `RELEASE_ROLLBACK_DRILL_DATE` ให้เป็นปัจจุบันหลังการซ้อม rollback ส่วนตัวแต่ละครั้ง
   `OpenClaw Stable Main Closeout` เริ่มจากการ push ไปยัง `main` ที่มี
   เวอร์ชันที่จัดส่งแล้ว, changelog และ appcast หลังการเผยแพร่ stable มันอ่าน
   หลักฐานหลังเผยแพร่ที่เปลี่ยนแปลงไม่ได้ เพื่อผูกแท็กที่จัดส่งแล้วกับการรัน Full Release
   Validation และ Publish จากนั้นตรวจสอบสถานะ stable main, รีลีส,
   การ soak stable ที่บังคับ และหลักฐานประสิทธิภาพที่บล็อกอยู่ มันแนบ
   closeout manifest และ checksum ที่เปลี่ยนแปลงไม่ได้เข้ากับ GitHub release ทริกเกอร์
   push อัตโนมัติจะข้ามรีลีส legacy ที่เก่ากว่าหลักฐานหลังเผยแพร่ที่เปลี่ยนแปลงไม่ได้
   และจะไม่ถือว่าการข้ามนั้นเป็น closeout ที่เสร็จสมบูรณ์ closeout ที่สมบูรณ์
   ต้องมีทั้ง assets และ checksum ที่ตรงกัน manifest บางส่วนจะเล่นซ้ำ
   SHA ของ `main` และการซ้อม rollback ที่บันทึกไว้ เพื่อสร้างไบต์ที่เหมือนเดิม
   จากนั้นแนบ checksum ที่ขาดอยู่ คู่ที่ไม่ถูกต้อง หรือ checksum
   ที่ไม่มี manifest จะยังคงบล็อกอยู่ การรันที่ถูกทริกเกอร์โดย push โดยไม่มีตัวแปร
   repository สำหรับการซ้อม rollback จะข้ามโดยไม่ทำ closeout ให้เสร็จสมบูรณ์ ส่วนบันทึกการซ้อม
   ที่ขาดหายหรือเก่ากว่า 90 วันยังคงบล็อก closeout แบบแมนนวลที่มีหลักฐานรองรับ
   คำสั่งกู้คืนส่วนตัวยังคงอยู่ใน runbook สำหรับ maintainer เท่านั้น
   ใช้ manual dispatch เฉพาะเพื่อซ่อมแซมหรือเล่นซ้ำ stable closeout ที่มีหลักฐานรองรับ
   แท็กแก้ไข fallback แบบ legacy อาจใช้หลักฐาน base-package ซ้ำได้เฉพาะเมื่อ
   แท็กแก้ไข resolve ไปยัง source commit เดียวกันกับแท็ก stable ฐาน
   การแก้ไขที่มี source ต่างกันต้องเผยแพร่และตรวจสอบหลักฐาน package ของตัวเอง

## การตรวจสอบก่อนรีลีส

- รัน `pnpm check:test-types` ก่อน preflight รุ่นเผยแพร่ เพื่อให้ TypeScript ของเทสต์ยัง
  ถูกครอบคลุมนอกเกต `pnpm check` ภายในที่เร็วกว่า
- รัน `pnpm check:architecture` ก่อน preflight รุ่นเผยแพร่ เพื่อให้การตรวจสอบ import
  cycle และขอบเขตสถาปัตยกรรมที่กว้างขึ้นเป็นสีเขียวนอกเกตภายในที่เร็วกว่า
- รัน `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้มีอาร์ติแฟกต์
  รุ่นเผยแพร่ `dist/*` ที่คาดไว้และบันเดิล Control UI สำหรับขั้นตอนตรวจสอบความถูกต้อง
  ของแพ็ก
- รัน `pnpm release:prep` หลังจาก bump เวอร์ชันที่รูทและก่อนติดแท็ก โดยจะรันตัวสร้าง
  รุ่นเผยแพร่แบบกำหนดผลลัพธ์ได้ทุกตัวที่มัก drift หลังจากการเปลี่ยนแปลงเวอร์ชัน/config/API:
  เวอร์ชัน Plugin, inventory ของ Plugin, สคีมา config พื้นฐาน, metadata config ของช่องทาง
  ที่บันเดิลมา, baseline เอกสาร config, exports ของ plugin SDK และ baseline API ของ
  plugin SDK `pnpm release:check` จะรัน guard เหล่านั้นซ้ำในโหมดตรวจสอบและรายงาน
  ความล้มเหลวจาก generated drift ทุกจุดที่พบในรอบเดียวก่อนรันการตรวจสอบรุ่นเผยแพร่แพ็กเกจ
- การซิงก์เวอร์ชัน Plugin จะอัปเดตเวอร์ชันแพ็กเกจของ Plugin ทางการและ floor
  `openclaw.compat.pluginApi` ที่มีอยู่ให้เป็นเวอร์ชันรุ่นเผยแพร่ของ OpenClaw ตามค่าเริ่มต้น
  ให้ถือว่าฟิลด์นั้นเป็น floor ของ plugin SDK/runtime API ไม่ใช่แค่สำเนาของเวอร์ชันแพ็กเกจ:
  สำหรับรุ่นเผยแพร่เฉพาะ Plugin ที่ตั้งใจให้ยังเข้ากันได้กับโฮสต์ OpenClaw รุ่นเก่ากว่า
  ให้คง floor ไว้ที่ API โฮสต์เก่าสุดที่รองรับและบันทึกเหตุผลนั้นไว้ในหลักฐานรุ่นเผยแพร่ของ Plugin
- รัน workflow แบบแมนนวล `Full Release Validation` ก่อนอนุมัติรุ่นเผยแพร่เพื่อเริ่ม
  test box ก่อนเผยแพร่ทั้งหมดจาก entrypoint เดียว รองรับ branch, tag หรือ full commit SHA,
  dispatch `CI` แบบแมนนวล และ dispatch
  `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, การตรวจสอบแพ็กเกจ
  ข้าม OS, parity ของ QA Lab, Matrix และเลน Telegram การรัน stable และ full จะรวม
  live/E2E แบบครบถ้วนและ Docker release-path soak เสมอ;
  `run_release_soak=true` ถูกคงไว้สำหรับ beta soak ที่ระบุชัดเจน Package Acceptance ให้
  Telegram E2E ของแพ็กเกจที่เป็น canonical ระหว่างการตรวจสอบ candidate
  โดยหลีกเลี่ยง live poller ตัวที่สองซึ่งทำงานพร้อมกัน
  ใส่ `release_package_spec` หลังจากเผยแพร่ beta เพื่อใช้แพ็กเกจ npm ที่เผยแพร่แล้วซ้ำ
  ใน release checks, Package Acceptance และ package Telegram
  E2E โดยไม่ต้องสร้าง release tarball ใหม่ ใส่
  `npm_telegram_package_spec` เฉพาะเมื่อ Telegram ควรใช้แพ็กเกจที่เผยแพร่แล้วคนละตัว
  กับการตรวจสอบรุ่นเผยแพร่ส่วนที่เหลือ ใส่
  `package_acceptance_package_spec` เมื่อ Package Acceptance ควรใช้แพ็กเกจที่เผยแพร่แล้ว
  คนละตัวกับ release package spec ใส่
  `evidence_package_spec` เมื่อรายงานหลักฐานรุ่นเผยแพร่ควรพิสูจน์ว่าการตรวจสอบตรงกับ
  แพ็กเกจ npm ที่เผยแพร่แล้วโดยไม่บังคับให้รัน Telegram E2E
  ตัวอย่าง:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- รัน workflow แบบแมนนวล `Package Acceptance` เมื่อต้องการหลักฐาน side-channel
  สำหรับ package candidate ขณะที่งานรุ่นเผยแพร่ยังดำเนินต่อ ใช้ `source=npm` สำหรับ
  `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรุ่นเผยแพร่ที่แน่นอน; `source=ref`
  เพื่อแพ็ก branch/tag/SHA `package_ref` ที่เชื่อถือได้ด้วย harness
  `workflow_ref` ปัจจุบัน; `source=url` สำหรับ tarball HTTPS สาธารณะที่ต้องมี SHA-256
  และนโยบาย URL สาธารณะแบบเข้มงวด; `source=trusted-url` สำหรับนโยบาย trusted-source
  ที่มีชื่อโดยใช้ `trusted_source_id` และ SHA-256 ที่จำเป็น; หรือ
  `source=artifact` สำหรับ tarball ที่อัปโหลดโดยการรัน GitHub Actions อื่น
  workflow จะแก้ candidate เป็น
  `package-under-test`, ใช้ Docker E2E release scheduler ซ้ำกับ tarball นั้น
  และสามารถรัน Telegram QA กับ tarball เดียวกันด้วย
  `telegram_mode=mock-openai` หรือ `telegram_mode=live-frontier` เมื่อเลน
  Docker ที่เลือกมี `published-upgrade-survivor` อาร์ติแฟกต์แพ็กเกจคือ candidate และ
  `published_upgrade_survivor_baseline` จะเลือก baseline ที่เผยแพร่แล้ว
  `update-restart-auth` ใช้แพ็กเกจ candidate เป็นทั้ง CLI ที่ติดตั้งและ package-under-test
  เพื่อทดสอบเส้นทาง managed restart ของคำสั่งอัปเดต candidate
  ตัวอย่าง: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  โปรไฟล์ทั่วไป:
  - `smoke`: เลน install/channel/agent, gateway network และ config reload
  - `package`: เลน package/update/restart/plugin ที่อิงอาร์ติแฟกต์โดยตรง โดยไม่มี OpenWebUI หรือ ClawHub แบบสด
  - `product`: โปรไฟล์ package บวกกับช่องทาง MCP, การล้างข้อมูล cron/subagent,
    OpenAI web search และ OpenWebUI
  - `full`: ชิ้นส่วน Docker release-path พร้อม OpenWebUI
  - `custom`: การเลือก `docker_lanes` ที่แน่นอนสำหรับการรันซ้ำแบบเจาะจง
- รัน workflow แบบแมนนวล `CI` โดยตรงเมื่อคุณต้องการเฉพาะความครอบคลุม CI ปกติ
  แบบกำหนดผลลัพธ์ได้สำหรับ release candidate การ dispatch CI แบบแมนนวลจะข้าม
  changed scoping และบังคับ Linux Node shards, bundled-plugin shards, plugin และ
  channel contract shards, ความเข้ากันได้กับ Node 22, `check-*`, `check-additional-*`,
  built-artifact smoke checks, การตรวจสอบเอกสาร, Python skills, Windows, macOS และ
  เลน i18n ของ Control UI การรัน CI แบบแมนนวลเดี่ยวจะรัน Android เฉพาะเมื่อ dispatch
  ด้วย `include_android=true`; `Full Release Validation` จะส่ง input นั้นให้
  child CI ของมัน
  ตัวอย่างพร้อม Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- รัน `pnpm qa:otel:smoke` เมื่อตรวจสอบ telemetry ของรุ่นเผยแพร่ โดยจะทดสอบ
  QA-lab ผ่านตัวรับ OTLP/HTTP ภายในและตรวจยืนยัน trace, metric และ log
  export รวมถึง trace attributes ที่มีขอบเขตและการ redact เนื้อหา/identifier โดยไม่ต้องใช้
  Opik, Langfuse หรือ collector ภายนอกอื่น
- รัน `pnpm qa:otel:collector-smoke` เมื่อตรวจสอบความเข้ากันได้กับ collector
  โดยจะ route การ export OTLP ของ QA-lab ชุดเดียวกันผ่านคอนเทนเนอร์ Docker
  OpenTelemetry Collector จริงก่อน assertion ของตัวรับภายใน
- รัน `pnpm qa:prometheus:smoke` เมื่อตรวจสอบ Prometheus scraping ที่ป้องกันไว้
  โดยจะทดสอบ QA-lab, ปฏิเสธ scrape ที่ไม่ผ่านการยืนยันตัวตน และตรวจยืนยันว่า
  metric families ที่สำคัญต่อรุ่นเผยแพร่ไม่มี prompt content, raw identifiers,
  auth tokens และ local paths
- รัน `pnpm qa:observability:smoke` เมื่อคุณต้องการรันเลน smoke ของ
  OpenTelemetry และ Prometheus ใน source-checkout ต่อเนื่องกัน
- รัน `pnpm release:check` ก่อนทุก tagged release
- preflight ของ `OpenClaw NPM Release` จะสร้างหลักฐานรุ่นเผยแพร่ของ dependency ก่อน
  แพ็ก npm tarball เกตช่องโหว่ของ npm advisory เป็นตัวบล็อกรุ่นเผยแพร่ ความเสี่ยงของ
  transitive manifest, พื้นผิว dependency ownership/install และรายงานการเปลี่ยนแปลง
  dependency เป็นเพียงหลักฐานรุ่นเผยแพร่ รายงานการเปลี่ยนแปลง dependency จะเปรียบเทียบ
  release candidate กับ release tag ก่อนหน้าที่เข้าถึงได้
- preflight จะอัปโหลดหลักฐาน dependency เป็น
  `openclaw-release-dependency-evidence-<tag>` และฝังไว้ใต้
  `dependency-evidence/` ภายในอาร์ติแฟกต์ npm preflight ที่เตรียมไว้ด้วย เส้นทางเผยแพร่จริง
  จะใช้อาร์ติแฟกต์ preflight นั้นซ้ำ แล้วแนบหลักฐานเดียวกันกับ GitHub release เป็น
  `openclaw-<version>-dependency-evidence.zip`
- รัน `OpenClaw Release Publish` สำหรับลำดับการเผยแพร่ที่มีการเปลี่ยนแปลงหลังจากมี
  tag แล้ว Dispatch จาก `release/YYYY.M.PATCH` (หรือ `main` เมื่อเผยแพร่ tag ที่
  เข้าถึงได้จาก main), ส่ง release tag, `preflight_run_id` ของ OpenClaw npm ที่สำเร็จ
  และ `full_release_validation_run_id` ที่สำเร็จ และคงค่าเริ่มต้นของ plugin publish scope
  `all-publishable` ไว้ เว้นแต่ว่าคุณตั้งใจรันการซ่อมเฉพาะจุด workflow จะ serialize
  plugin npm publish, plugin ClawHub publish และ OpenClaw npm publish เพื่อไม่ให้
  แพ็กเกจ core ถูกเผยแพร่ก่อน Plugin ที่ externalized ของมัน
- `OpenClaw Release Publish` แบบ stable ต้องใช้ `windows_node_tag` ที่แน่นอนหลังจาก
  release `openclaw/openclaw-windows-node` แบบ non-prerelease ที่ตรงกันมีอยู่แล้ว
  และยังต้องใช้ map `windows_node_installer_digests` ที่ candidate-approved
  ก่อน dispatch child สำหรับ publish ใด ๆ จะตรวจยืนยันว่า source release ถูกเผยแพร่แล้ว,
  ไม่ใช่ prerelease, มีตัวติดตั้ง x64/ARM64 ที่จำเป็น และยังตรงกับ map ที่อนุมัตินั้น
  จากนั้นจะ dispatch `Windows Node Release` ขณะที่ release ของ OpenClaw ยังเป็น draft
  โดยส่งต่อ map digest ของตัวติดตั้งที่ pin ไว้โดยไม่เปลี่ยนแปลง child
  workflow จะดาวน์โหลดตัวติดตั้ง Windows Hub ที่ signed จาก tag ที่แน่นอนนั้น,
  เทียบกับ digest ที่ pin ไว้, ตรวจยืนยันว่า signature Authenticode ใช้ผู้ลงนาม
  OpenClaw Foundation ที่คาดไว้บน Windows runner, เขียน manifest SHA-256 และอัปโหลด
  ตัวติดตั้งพร้อม manifest ไปยัง GitHub release ของ OpenClaw ที่เป็น canonical
  จากนั้นดาวน์โหลด asset ที่ promoted แล้วซ้ำและตรวจยืนยันสมาชิก manifest และ hash
  parent จะตรวจยืนยัน contract ของ asset x64, ARM64 และ checksum ปัจจุบันก่อนเผยแพร่
  การกู้คืนโดยตรงจะปฏิเสธชื่อ asset `OpenClawCompanion-*` ที่ไม่คาดไว้ก่อนแทนที่
  asset ตาม contract ที่คาดไว้ด้วย byte จากแหล่งที่ pin ไว้ Dispatch
  `Windows Node Release` แบบแมนนวลเฉพาะเพื่อการกู้คืนเท่านั้น และต้องส่ง tag ที่แน่นอนเสมอ
  ห้ามส่ง `latest` พร้อม map JSON `expected_installer_digests` ที่ชัดเจนจาก source release
  ที่อนุมัติแล้ว ลิงก์ดาวน์โหลดของเว็บไซต์ควรชี้ไปยัง URL asset ของ OpenClaw release ที่แน่นอน
  สำหรับ stable release ปัจจุบัน หรือ
  `releases/latest/download/...` เฉพาะหลังจากตรวจยืนยันว่า redirect latest ของ GitHub
  ชี้ไปยัง release เดียวกันนั้น; อย่าลิงก์เฉพาะไปยังหน้า release ของ companion repo
- ตอนนี้การตรวจสอบรุ่นเผยแพร่รันใน workflow แบบแมนนวลแยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรันเลน mock parity ของ QA Lab พร้อมโปรไฟล์
  Matrix แบบสดที่เร็วและเลน Telegram QA ก่อนอนุมัติรุ่นเผยแพร่ เลนสดใช้ environment
  `qa-live-shared`; Telegram ยังใช้ lease credential ของ Convex CI ด้วย รัน workflow
  แบบแมนนวล `QA-Lab - All Lanes` ด้วย
  `matrix_profile=all` และ `matrix_shards=true` เมื่อคุณต้องการ inventory ของ
  transport, media และ E2EE ของ Matrix แบบเต็มในแบบขนาน
- การตรวจสอบ runtime ของการติดตั้งและอัปเกรดข้าม OS เป็นส่วนหนึ่งของ
  `OpenClaw Release Checks` และ `Full Release Validation` สาธารณะ ซึ่งเรียก
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` โดยตรง
- การแยกนี้เป็นสิ่งตั้งใจ: ทำให้เส้นทาง npm release จริงสั้น,
  กำหนดผลลัพธ์ได้ และเน้นอาร์ติแฟกต์ ขณะที่การตรวจสอบสดที่ช้ากว่าอยู่ในเลนของตัวเอง
  เพื่อไม่ให้หน่วงหรือบล็อกการเผยแพร่
- การตรวจสอบรุ่นเผยแพร่ที่มี secret ควร dispatch ผ่าน `Full Release
Validation` หรือจาก workflow ref ของ `main`/release เพื่อให้ตรรกะ workflow และ
  secrets ยังคงถูกควบคุม
- `OpenClaw Release Checks` รองรับ branch, tag หรือ full commit SHA ตราบใดที่
  commit ที่ resolve ได้เข้าถึงได้จาก branch ของ OpenClaw หรือ release tag
- preflight แบบ validation-only ของ `OpenClaw NPM Release` ยังรองรับ SHA ของ commit
  workflow-branch ปัจจุบันแบบเต็ม 40 อักขระโดยไม่ต้องใช้ tag ที่ push แล้ว
- เส้นทาง SHA นั้นเป็น validation-only และไม่สามารถ promote ไปเป็นการเผยแพร่จริงได้
- ในโหมด SHA workflow จะสังเคราะห์ `v<package.json version>` เฉพาะสำหรับการตรวจสอบ
  metadata ของแพ็กเกจเท่านั้น; การเผยแพร่จริงยังต้องใช้ release tag จริง
- workflow ทั้งสองเก็บเส้นทาง publish และ promotion จริงไว้บน runner ที่ GitHub-hosted
  ขณะที่เส้นทาง validation ที่ไม่เปลี่ยนแปลงอะไรสามารถใช้ runner Linux ของ
  Blacksmith ที่ใหญ่กว่าได้
- workflow นั้นรัน
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ทั้ง workflow secrets `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- preflight ของ npm release จะไม่รอเลน release checks แยกต่างหากอีกต่อไป
- ก่อนติดแท็ก release candidate ภายใน ให้รัน
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` helper นี้
  จะรัน guardrail รุ่นเผยแพร่แบบเร็ว, การตรวจสอบรุ่นเผยแพร่ plugin npm/ClawHub, build,
  UI build และ `release:openclaw:npm:check` ตามลำดับที่จับข้อผิดพลาดทั่วไปซึ่งบล็อก
  การอนุมัติก่อนที่ workflow เผยแพร่บน GitHub จะเริ่ม
- รัน `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือ tag beta/correction ที่ตรงกัน) ก่อนอนุมัติ
- หลังจาก npm publish ให้รัน
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (หรือเวอร์ชัน beta/correction ที่ตรงกัน) เพื่อตรวจสอบเส้นทางการติดตั้งจากรีจิสทรีที่เผยแพร่แล้ว
  ใน temp prefix ใหม่
- หลังเผยแพร่ beta ให้รัน `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  เพื่อตรวจสอบการเริ่มต้นใช้งานแพ็กเกจที่ติดตั้งแล้ว, การตั้งค่า Telegram, และ Telegram E2E จริง
  กับแพ็กเกจ npm ที่เผยแพร่แล้วโดยใช้พูลข้อมูลประจำตัว Telegram แบบเช่าร่วม
  ผู้ดูแลที่รันเฉพาะกิจในเครื่องอาจละเว้นตัวแปร Convex และส่งข้อมูลประจำตัว env ทั้งสาม
  `OPENCLAW_QA_TELEGRAM_*` โดยตรงได้
- หากต้องการรัน beta smoke หลังเผยแพร่แบบเต็มจากเครื่องของผู้ดูแล ให้ใช้ `pnpm release:beta-smoke -- --beta betaN` ตัวช่วยจะรันการตรวจสอบ Parallels npm update/fresh-target, dispatch `NPM Telegram Beta E2E`, poll workflow run ที่ตรงกัน, ดาวน์โหลด artifact, และพิมพ์รายงาน Telegram
- ผู้ดูแลสามารถรันการตรวจสอบหลังเผยแพร่แบบเดียวกันจาก GitHub Actions ผ่าน workflow
  `NPM Telegram Beta E2E` แบบ manual ได้ workflow นี้ตั้งใจให้เป็น manual-only และ
  ไม่รันทุกครั้งที่ merge
- ระบบอัตโนมัติสำหรับ release ของผู้ดูแลตอนนี้ใช้ preflight-then-promote:
  - การเผยแพร่ npm จริงต้องผ่าน npm `preflight_run_id` ที่สำเร็จ
  - การเผยแพร่ npm จริงต้องถูก dispatch จาก branch `main` หรือ
    `release/YYYY.M.PATCH` เดียวกันกับ preflight run ที่สำเร็จ
  - release npm แบบ stable มีค่าเริ่มต้นเป็น `beta`
  - การเผยแพร่ npm แบบ stable สามารถกำหนดเป้าหมายเป็น `latest` ได้อย่างชัดเจนผ่าน workflow input
  - การแก้ไข npm dist-tag แบบใช้ token ตอนนี้อยู่ใน
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` เพราะ
    `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่ source repo ยังคงใช้
    การเผยแพร่แบบ OIDC-only
  - `macOS Release` สาธารณะใช้สำหรับการตรวจสอบเท่านั้น; เมื่อ tag อยู่บน
    release branch เท่านั้นแต่ workflow ถูก dispatch จาก `main` ให้ตั้งค่า
    `public_release_branch=release/YYYY.M.PATCH`
  - การเผยแพร่ macOS จริงต้องผ่าน macOS `preflight_run_id` และ
    `validate_run_id` ที่สำเร็จ
  - เส้นทางเผยแพร่จริงจะ promote artifact ที่เตรียมไว้แทนการ rebuild
    อีกครั้ง
- สำหรับ correction release แบบ stable เช่น `YYYY.M.PATCH-N` ตัวตรวจสอบหลังเผยแพร่
  ยังตรวจสอบเส้นทาง upgrade ใน temp-prefix เดียวกันจาก `YYYY.M.PATCH` เป็น `YYYY.M.PATCH-N`
  เพื่อไม่ให้การ correction release ปล่อยให้การติดตั้ง global รุ่นเก่าค้างอยู่บน
  payload stable พื้นฐานอย่างเงียบ ๆ
- release preflight ของ npm จะ fail closed เว้นแต่ tarball จะมีทั้ง
  `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่างเปล่า
  เพื่อไม่ให้เราจัดส่ง browser dashboard ว่างอีกครั้ง
- การตรวจสอบหลังเผยแพร่ยังตรวจสอบว่า entrypoint ของ Plugin ที่เผยแพร่และ
  metadata ของแพ็กเกจมีอยู่ใน layout รีจิสทรีที่ติดตั้งแล้ว release ที่
  จัดส่ง payload runtime ของ Plugin ขาดหายจะทำให้ postpublish verifier ล้มเหลวและ
  ไม่สามารถ promote เป็น `latest` ได้
- `pnpm test:install:smoke` ยังบังคับใช้งบประมาณ `unpackedSize` ของ npm pack กับ
  candidate update tarball ดังนั้น installer e2e จะตรวจจับการ pack ที่บวมโดยไม่ตั้งใจ
  ก่อนเส้นทางเผยแพร่ release
- หากงาน release แตะการวางแผน CI, manifest เวลาของ extension, หรือ
  matrix ทดสอบ extension ให้สร้างใหม่และตรวจทานผลลัพธ์ matrix
  `plugin-prerelease-extension-shard` ที่ planner เป็นเจ้าของจาก
  `.github/workflows/plugin-prerelease.yml` ก่อนอนุมัติ เพื่อไม่ให้ release notes
  อธิบาย layout CI ที่ล้าสมัย
- ความพร้อมของ release macOS แบบ stable ยังรวมถึงพื้นผิวของ updater:
  - GitHub release ต้องลงท้ายด้วย `.zip`, `.dmg`, และ `.dSYM.zip` ที่แพ็กเกจแล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปยัง zip stable ใหม่หลังเผยแพร่; workflow
    เผยแพร่ macOS จะ commit ให้โดยอัตโนมัติ หรือเปิด PR appcast
    เมื่อ direct push ถูกบล็อก
  - แอปที่แพ็กเกจแล้วต้องคง bundle id ที่ไม่ใช่ debug, Sparkle feed
    URL ที่ไม่ว่างเปล่า, และ `CFBundleVersion` ที่เท่ากับหรือสูงกว่า build floor ของ Sparkle
    แบบ canonical สำหรับ release version นั้น

## กล่องทดสอบรีลีส

`Full Release Validation` คือวิธีที่ผู้ปฏิบัติงานใช้เริ่มการทดสอบก่อนรีลีสทั้งหมดจาก
จุดเข้าเดียว สำหรับหลักฐานคอมมิตที่ปักหมุดไว้บนบรานช์ที่เคลื่อนไหวเร็ว ให้ใช้
ตัวช่วยเพื่อให้ทุก child workflow รันจากบรานช์ชั่วคราวที่ตรึงไว้กับ SHA เป้าหมาย:

```bash
pnpm ci:full-release --sha <full-sha>
```

ตัวช่วยจะ push `release-ci/<sha>-...`, dispatch `Full Release Validation`
จากบรานช์นั้นด้วย `ref=<sha>`, ตรวจสอบว่า `headSha` ของทุก child workflow
ตรงกับเป้าหมาย แล้วลบบรานช์ชั่วคราว วิธีนี้ช่วยหลีกเลี่ยงการพิสูจน์ child run ของ
`main` ที่ใหม่กว่าโดยไม่ตั้งใจ

สำหรับการตรวจสอบ release branch หรือ tag ให้รันจาก workflow ref `main` ที่เชื่อถือได้
และส่ง release branch หรือ tag เป็น `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

workflow จะ resolve target ref, dispatch `CI` แบบ manual ด้วย
`target_ref=<release-ref>` แล้ว dispatch `OpenClaw Release Checks`
`OpenClaw Release Checks` จะกระจายงาน install smoke, release checks ข้าม OS,
coverage เส้นทางรีลีส live/E2E Docker เมื่อเปิดใช้ soak, Package Acceptance
พร้อม Telegram package E2E มาตรฐาน, QA Lab parity, live Matrix และ live
Telegram การรันแบบ full/all ยอมรับได้ก็ต่อเมื่อ summary ของ `Full Release Validation`
แสดงว่า `normal_ci`, `plugin_prerelease` และ `release_checks` สำเร็จ
เว้นแต่การรันซ้ำแบบเจาะจงตั้งใจข้าม child `Plugin
Prerelease` ที่แยกไว้ ใช้ child `npm-telegram` แบบ standalone เฉพาะสำหรับการรันซ้ำแบบเจาะจง
ของ published-package ด้วย `release_package_spec` หรือ
`npm_telegram_package_spec` เท่านั้น summary สุดท้ายของ
verifier มีตารางงานที่ช้าที่สุดสำหรับแต่ละ child run เพื่อให้ release
manager เห็น critical path ปัจจุบันโดยไม่ต้องดาวน์โหลด log
ดู [การตรวจสอบรีลีสเต็มรูปแบบ](/th/reference/full-release-validation) สำหรับ
stage matrix ทั้งหมด, ชื่อ job ของ workflow ที่แน่นอน, ความแตกต่างระหว่าง profile stable กับ full,
artifacts และ handle สำหรับ rerun แบบเจาะจง
Child workflows จะถูก dispatch จาก trusted ref ที่รัน `Full Release
Validation` โดยปกติคือ `--ref main` แม้เมื่อ target `ref` ชี้ไปยัง
release branch หรือ tag ที่เก่ากว่า ไม่มี input workflow-ref แยกสำหรับ Full Release Validation;
ให้เลือก harness ที่เชื่อถือได้โดยเลือก workflow run ref
อย่าใช้ `--ref main -f ref=<sha>` สำหรับหลักฐานคอมมิตที่แน่นอนบน `main` ที่กำลังเคลื่อนไหว;
raw commit SHA ไม่สามารถเป็น workflow dispatch ref ได้ ดังนั้นให้ใช้
`pnpm ci:full-release --sha <sha>` เพื่อสร้างบรานช์ชั่วคราวที่ปักหมุดไว้

ใช้ `release_profile` เพื่อเลือกขอบเขต live/provider:

- `minimum`: เส้นทาง live และ Docker ของ OpenAI/core ที่สำคัญต่อรีลีสและเร็วที่สุด
- `stable`: minimum บวก coverage ของ provider/backend แบบ stable สำหรับการอนุมัติรีลีส
- `full`: stable บวก coverage ของ provider/media เชิงแนะนำที่กว้างขึ้น

การตรวจสอบ stable และ full จะรัน live/E2E แบบ exhaustive, เส้นทางรีลีส Docker,
และ sweep published upgrade-survivor แบบจำกัดขอบเขตก่อน promotion เสมอ
ใช้ `run_release_soak=true` เพื่อขอ sweep เดียวกันสำหรับ beta sweep นั้นครอบคลุม
แพ็กเกจ stable ล่าสุดสี่รายการ บวก baseline ที่ปักหมุดไว้ `2026.4.23` และ `2026.5.2`
รวมถึง coverage เก่ากว่า `2026.4.15` โดยลบ baseline ที่ซ้ำกันออก และ
แยกแต่ละ baseline ไปยัง Docker runner job ของตัวเอง

`OpenClaw Release Checks` ใช้ trusted workflow ref เพื่อ resolve target
ref หนึ่งครั้งเป็น `release-package-under-test` และนำ artifact นั้นกลับมาใช้ใน cross-OS,
Package Acceptance และ release-path Docker checks เมื่อมีการรัน soak วิธีนี้ทำให้
กล่องที่แตะแพ็กเกจทั้งหมดใช้ bytes ชุดเดียวกันและหลีกเลี่ยงการ build แพ็กเกจซ้ำ
หลังจาก beta อยู่บน npm แล้ว ให้ตั้ง `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`
เพื่อให้ release checks ดาวน์โหลดแพ็กเกจที่เผยแพร่แล้วหนึ่งครั้ง, ดึง source
SHA ของ build จาก `dist/build-info.json` แล้วนำ artifact นั้นกลับมาใช้สำหรับ cross-OS,
Package Acceptance, release-path Docker และ package Telegram lanes
OpenAI install smoke ข้าม OS ใช้ `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อมีการตั้ง
repo/org variable มิฉะนั้นใช้ `openai/gpt-5.4` เพราะ lane นี้กำลังพิสูจน์
การติดตั้งแพ็กเกจ, onboarding, การเริ่มต้น gateway และ agent turn แบบ live หนึ่งครั้ง
แทนการ benchmark model เริ่มต้นที่ช้าที่สุด live provider
matrix ที่กว้างกว่ายังคงเป็นที่สำหรับ coverage เฉพาะ model

ใช้ variant เหล่านี้ตามระยะรีลีส:

```bash
# ตรวจสอบ release candidate branch ที่ยังไม่ได้เผยแพร่
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# ตรวจสอบคอมมิตที่ push แล้วแบบแน่นอน
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# หลังเผยแพร่ beta แล้ว เพิ่ม published-package Telegram E2E
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

อย่าใช้ umbrella เต็มรูปแบบเป็นการรันซ้ำครั้งแรกหลังการแก้แบบเจาะจง หากกล่องหนึ่ง
ล้มเหลว ให้ใช้ child workflow, job, Docker lane, package profile, model
provider หรือ QA lane ที่ล้มเหลวสำหรับหลักฐานถัดไป รัน umbrella เต็มรูปแบบอีกครั้งเฉพาะเมื่อ
การแก้เปลี่ยน release orchestration ที่ใช้ร่วมกัน หรือทำให้หลักฐาน all-box ก่อนหน้า
ล้าสมัย verifier สุดท้ายของ umbrella จะตรวจสอบ run
ids ของ child workflow ที่บันทึกไว้อีกครั้ง ดังนั้นหลังจาก child workflow รันซ้ำสำเร็จแล้ว ให้ rerun เฉพาะ
parent job `Verify full validation` ที่ล้มเหลว

สำหรับการกู้คืนแบบจำกัดขอบเขต ให้ส่ง `rerun_group` ไปยัง umbrella `all` คือการรัน
release-candidate จริง, `ci` รันเฉพาะ child CI ปกติ, `plugin-prerelease`
รันเฉพาะ child ของ plugin สำหรับรีลีสเท่านั้น, `release-checks` รันทุก release
box และ release groups ที่แคบกว่าคือ `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` และ `npm-telegram`
การ rerun `npm-telegram` แบบเจาะจงต้องมี `release_package_spec` หรือ
`npm_telegram_package_spec`; การรัน full/all ใช้ package Telegram
E2E มาตรฐานภายใน Package Acceptance การ rerun
cross-OS แบบเจาะจงสามารถเพิ่ม `cross_os_suite_filter=windows/packaged-upgrade` หรือ
ตัวกรอง OS/suite อื่นได้ ความล้มเหลวของ QA release-check จะบล็อกการตรวจสอบรีลีสปกติ
รวมถึง OpenClaw dynamic tool drift ที่จำเป็นใน tier มาตรฐาน
การรัน Tideclaw alpha อาจยังถือว่า release-check lanes ที่ไม่ใช่ package-safety เป็น
เชิงแนะนำได้ เมื่อ `live_suite_filter` ขอ gated QA live lane อย่างชัดเจน เช่น
Discord, WhatsApp หรือ Slack ต้องเปิดใช้ repo variable
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` ที่ตรงกัน มิฉะนั้น
input capture จะล้มเหลวแทนที่จะข้าม lane แบบเงียบ ๆ

### Vitest

กล่อง Vitest คือ child workflow `CI` แบบ manual Manual CI ตั้งใจ
ข้าม changed scoping และบังคับ test graph ปกติสำหรับ release
candidate: Linux Node shards, bundled-plugin shards, plugin and channel contract
shards, ความเข้ากันได้กับ Node 22, `check-*`, `check-additional-*`,
built-artifact smoke checks, docs checks, Python skills, Windows, macOS,
และ Control UI i18n Android จะรวมอยู่เมื่อ `Full Release Validation` รัน
กล่องนี้ เพราะ umbrella ส่ง `include_android=true`; standalone manual CI
ต้องใช้ `include_android=true` เพื่อให้มี coverage Android

ใช้กล่องนี้เพื่อตอบว่า "source tree ผ่านชุดทดสอบปกติเต็มรูปแบบหรือไม่?"
ไม่ใช่สิ่งเดียวกับการตรวจสอบผลิตภัณฑ์ตามเส้นทางรีลีส หลักฐานที่ควรเก็บ:

- summary ของ `Full Release Validation` ที่แสดง URL ของ run `CI` ที่ dispatch
- run `CI` เป็นสีเขียวบน target SHA ที่แน่นอน
- ชื่อ shard ที่ล้มเหลวหรือช้าใน CI jobs เมื่อตรวจสอบ regression
- artifacts เวลา Vitest เช่น `.artifacts/vitest-shard-timings.json` เมื่อ
  run ต้องการการวิเคราะห์ประสิทธิภาพ

รัน manual CI โดยตรงเฉพาะเมื่อรีลีสต้องการ normal CI ที่ deterministic แต่
ไม่ต้องการกล่อง Docker, QA Lab, live, cross-OS หรือ package ใช้คำสั่งแรก
สำหรับ direct CI ที่ไม่ใช่ Android เพิ่ม `include_android=true` เมื่อ direct
release-candidate CI ต้องครอบคลุม Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

กล่อง Docker อยู่ใน `OpenClaw Release Checks` ผ่าน
`openclaw-live-and-e2e-checks-reusable.yml` รวมถึง workflow
`install-smoke` โหมดรีลีส กล่องนี้ตรวจสอบ release candidate ผ่านสภาพแวดล้อม
Docker แบบ packaged แทนที่จะใช้เฉพาะการทดสอบระดับ source

coverage ของ Release Docker รวมถึง:

- install smoke เต็มรูปแบบพร้อมเปิดใช้ slow Bun global install smoke
- การเตรียม/นำ smoke image ของ root Dockerfile กลับมาใช้ตาม target SHA พร้อมงาน QR,
  root/gateway และ installer/Bun smoke ที่รันเป็น install-smoke
  shards แยกกัน
- repository E2E lanes
- release-path Docker chunks: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` และ `plugins-runtime-install-h`
- coverage ของ OpenWebUI ภายใน chunk `plugins-runtime-services` เมื่อร้องขอ
- lane ติดตั้ง/ถอนการติดตั้ง bundled plugin ที่แบ่งไว้
  `bundled-plugin-install-uninstall-0` ถึง
  `bundled-plugin-install-uninstall-23`
- ชุด provider live/E2E และ coverage Docker live model เมื่อ release checks
  รวม live suites

ใช้ Docker artifacts ก่อน rerun scheduler ของ release-path จะอัปโหลด
`.artifacts/docker-tests/` พร้อม lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON และคำสั่ง rerun สำหรับการกู้คืนแบบเจาะจง
ใช้ `docker_lanes=<lane[,lane]>` บน reusable live/E2E workflow แทนการ
rerun release chunks ทั้งหมด คำสั่ง rerun ที่สร้างขึ้นจะรวม
`package_artifact_run_id` ก่อนหน้าและ input Docker image ที่เตรียมไว้เมื่อมี เพื่อให้
lane ที่ล้มเหลวสามารถนำ tarball และ GHCR images เดิมกลับมาใช้ได้

### QA Lab

กล่อง QA Lab เป็นส่วนหนึ่งของ `OpenClaw Release Checks` เช่นกัน เป็น gate รีลีส
ด้านพฤติกรรม agentic และระดับ channel แยกจาก Vitest และกลไกแพ็กเกจ
Docker

coverage ของ Release QA Lab รวมถึง:

- mock parity lane ที่เปรียบเทียบ lane candidate ของ OpenAI กับ baseline Opus 4.6
  โดยใช้ agentic parity pack
- profile fast live Matrix QA ที่ใช้ environment `qa-live-shared`
- live Telegram QA lane ที่ใช้ Convex CI credential leases
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` หรือ
  `pnpm qa:observability:smoke` เมื่อ release telemetry ต้องการหลักฐาน local
  อย่างชัดเจน

ใช้กล่องนี้เพื่อตอบว่า "รีลีสทำงานถูกต้องใน QA scenarios และ
live channel flows หรือไม่?" เก็บ artifact URLs สำหรับ parity, Matrix และ Telegram
lanes เมื่ออนุมัติรีลีส coverage Matrix เต็มรูปแบบยังคงมีให้ใช้งานเป็น
manual sharded QA-Lab run แทนที่จะเป็น lane เริ่มต้นที่สำคัญต่อรีลีส

### Package

กล่อง Package คือ gate ของผลิตภัณฑ์ที่ติดตั้งได้ รองรับโดย
`Package Acceptance` และ resolver
`scripts/resolve-openclaw-package-candidate.mjs` resolver จะ normalize
candidate เป็น tarball `package-under-test` ที่ Docker E2E ใช้, ตรวจสอบ
package inventory, บันทึก package version และ SHA-256 และแยก
workflow harness ref ออกจาก package source ref

แหล่ง candidate ที่รองรับ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรีลีส OpenClaw ที่ระบุแน่นอน
- `source=ref`: แพ็ก branch, tag หรือ commit SHA เต็มของ `package_ref` ที่เชื่อถือได้
  พร้อม harness `workflow_ref` ที่เลือกไว้
- `source=url`: ดาวน์โหลด `.tgz` แบบ HTTPS สาธารณะพร้อม `package_sha256` ที่จำเป็น;
  ข้อมูลรับรองใน URL, พอร์ต HTTPS ที่ไม่ใช่ค่าเริ่มต้น, hostname หรือ address ที่ resolve แล้วแบบ private/internal/special-use
  และ redirect ที่ไม่ปลอดภัยจะถูกปฏิเสธ
- `source=trusted-url`: ดาวน์โหลด `.tgz` แบบ HTTPS พร้อม
  `package_sha256` และ `trusted_source_id` ที่จำเป็นจาก policy ที่มีชื่อใน
  `.github/package-trusted-sources.json`; ใช้ตัวเลือกนี้สำหรับ mirror ระดับ enterprise ที่ maintainer เป็นเจ้าของ
  หรือ repository แพ็กเกจส่วนตัว แทนการเพิ่ม bypass เครือข่ายส่วนตัวระดับ input ให้กับ `source=url`
- `source=artifact`: ใช้ `.tgz` ที่อัปโหลดโดย GitHub Actions run อื่นซ้ำ

`OpenClaw Release Checks` รัน Package Acceptance ด้วย `source=artifact`, artifact แพ็กเกจรีลีสที่เตรียมไว้, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` Package Acceptance จะคง QA สำหรับ migration, update,
การ restart หลัง update configured-auth, การติดตั้ง skill ClawHub แบบ live, การล้าง dependency ของ Plugin ที่ล้าสมัย, fixture Plugin แบบ offline, การ update Plugin และแพ็กเกจ Telegram ไว้กับ tarball ที่ resolve เดียวกัน การตรวจรีลีสแบบบล็อกใช้ baseline แพ็กเกจ published ล่าสุดตามค่าเริ่มต้น; โปรไฟล์ beta ที่มี `run_release_soak=true`, `release_profile=stable` หรือ
`release_profile=full` จะขยายเป็น baseline ที่ published บน npm แบบ stable ทุกตัวตั้งแต่
`2026.4.23` ถึง `latest` รวมถึง fixture ของ issue ที่รายงาน ใช้
Package Acceptance ด้วย `source=npm` สำหรับ candidate ที่ ship แล้ว,
`source=ref` สำหรับ tarball npm ภายในเครื่องที่มี SHA รองรับก่อน publish,
`source=trusted-url` สำหรับ mirror ระดับ enterprise/private ที่ maintainer เป็นเจ้าของ หรือ
`source=artifact` สำหรับ tarball ที่เตรียมไว้และอัปโหลดโดย GitHub Actions run อื่น
นี่คือสิ่งทดแทนแบบ GitHub-native
สำหรับ coverage ด้านแพ็กเกจ/update ส่วนใหญ่ที่ก่อนหน้านี้ต้องใช้
Parallels การตรวจรีลีสข้าม OS ยังคงสำคัญสำหรับ onboarding,
installer และพฤติกรรมเฉพาะแพลตฟอร์ม แต่การตรวจสอบผลิตภัณฑ์ด้านแพ็กเกจ/update ควร
เลือกใช้ Package Acceptance

รายการตรวจสอบหลักสำหรับการตรวจสอบ update และ Plugin คือ
[การทดสอบ update และ Plugin](/th/help/testing-updates-plugins) ใช้รายการนี้เมื่อ
ตัดสินใจว่า lane แบบ local, Docker, Package Acceptance หรือ release-check ใดพิสูจน์
การติดตั้ง/update Plugin, การล้าง doctor หรือการเปลี่ยนแปลง migration ของแพ็กเกจ published
การ migration update แบบ published อย่างละเอียดจากแพ็กเกจ stable `2026.4.23+` ทุกตัว
เป็น workflow `Update Migration` แบบ manual แยกต่างหาก ไม่ใช่ส่วนหนึ่งของ Full Release CI

ความผ่อนปรน package-acceptance แบบ legacy ถูกจำกัดเวลาไว้โดยตั้งใจ แพ็กเกจจนถึง
`2026.4.25` อาจใช้ path compatibility สำหรับช่องว่าง metadata ที่ published ไปยัง npm แล้ว:
รายการ inventory QA ส่วนตัวที่หายไปจาก tarball, ไม่มี
`gateway install --wrapper`, ไม่มีไฟล์ patch ใน fixture git ที่ได้จาก tarball,
ไม่มี `update.channel` ที่ persist แล้ว, ตำแหน่ง install-record ของ Plugin แบบ legacy,
ไม่มีการ persist marketplace install-record และ migration metadata config
ระหว่าง `plugins update` แพ็กเกจ published `2026.4.26` อาจ warn
สำหรับไฟล์ stamp metadata ของ build ภายในเครื่องที่ ship ไปแล้ว แพ็กเกจหลังจากนั้น
ต้องเป็นไปตาม contract แพ็กเกจสมัยใหม่; ช่องว่างเดียวกันเหล่านั้นจะทำให้การตรวจสอบรีลีสล้มเหลว

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

โปรไฟล์แพ็กเกจที่ใช้บ่อย:

- `smoke`: lane ติดตั้งแพ็กเกจ/channel/agent, เครือข่าย Gateway และ reload config แบบรวดเร็ว
- `package`: contract ของแพ็กเกจ install/update/restart/Plugin พร้อมหลักฐานการติดตั้ง skill ClawHub แบบ live; นี่คือค่าเริ่มต้นของ release-check
- `product`: `package` พร้อม channel MCP, การล้าง cron/subagent, การค้นเว็บ OpenAI และ OpenWebUI
- `full`: chunk ของ Docker release-path พร้อม OpenWebUI
- `custom`: รายการ `docker_lanes` ที่แน่นอนสำหรับการ rerun แบบเจาะจง

สำหรับหลักฐาน Telegram ของ package-candidate ให้เปิดใช้ `telegram_mode=mock-openai` หรือ
`telegram_mode=live-frontier` บน Package Acceptance workflow จะส่ง
tarball `package-under-test` ที่ resolve แล้วเข้าไปใน lane Telegram; workflow
Telegram แบบ standalone ยังคงรับ spec npm ที่ published แล้วสำหรับการตรวจหลัง publish

## ระบบอัตโนมัติสำหรับ publish รีลีส

`OpenClaw Release Publish` คือ entrypoint สำหรับ publish แบบ mutating ตามปกติ โดย
orchestrate workflow trusted-publisher ตามลำดับที่รีลีสต้องใช้:

1. Check out release tag และ resolve commit SHA ของมัน
2. ตรวจว่า tag เข้าถึงได้จาก `main` หรือ `release/*`
3. รัน `pnpm plugins:sync:check`
4. Dispatch `Plugin NPM Release` ด้วย `publish_scope=all-publishable` และ
   `ref=<release-sha>`
5. Dispatch `Plugin ClawHub Release` ด้วย scope และ SHA เดียวกัน
6. Dispatch `OpenClaw NPM Release` ด้วย release tag, npm dist-tag และ
   `preflight_run_id` ที่บันทึกไว้ หลังจากตรวจสอบ
   `full_release_validation_run_id` ที่บันทึกไว้
7. สำหรับรีลีส stable ให้สร้างหรือ update GitHub release เป็น draft, dispatch
   `Windows Node Release` ด้วย `windows_node_tag` ที่ระบุชัดเจนและ
   `windows_node_installer_digests` ที่ candidate-approved แล้ว และตรวจสอบ asset
   installer/checksum หลักก่อน publish draft

ตัวอย่างการ publish beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

การ publish stable ไปยัง beta dist-tag ตามค่าเริ่มต้น:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

การ promote stable ไปยัง `latest` โดยตรงต้องระบุอย่างชัดเจน:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

ใช้ workflow ระดับล่าง `Plugin NPM Release` และ `Plugin ClawHub Release`
เฉพาะงานซ่อมแซมหรือ republish แบบเจาะจงเท่านั้น `OpenClaw Release Publish` จะปฏิเสธ
`plugin_publish_scope=selected` เมื่อ `publish_openclaw_npm=true` เพื่อให้แพ็กเกจ core
ไม่สามารถ ship ได้หากไม่มี Plugin official ที่ publish ได้ครบทุกตัว รวมถึง
`@openclaw/diffs-language-pack` สำหรับการซ่อมแซม Plugin ที่เลือกไว้ ให้ตั้ง
`publish_openclaw_npm=false` พร้อม `plugin_publish_scope=selected` และ
`plugins=@openclaw/name` หรือ dispatch workflow ลูกโดยตรง

## input ของ workflow NPM

`OpenClaw NPM Release` รับ input ที่ operator ควบคุมเหล่านี้:

- `tag`: release tag ที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1` หรือ
  `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` ค่านี้อาจเป็น
  commit SHA เต็ม 40 อักขระปัจจุบันของ workflow-branch สำหรับ preflight แบบ validation-only ได้ด้วย
- `preflight_only`: `true` สำหรับ validation/build/package เท่านั้น, `false` สำหรับ
  path publish จริง
- `preflight_run_id`: จำเป็นบน path publish จริง เพื่อให้ workflow ใช้
  tarball ที่เตรียมไว้จาก preflight run ที่สำเร็จซ้ำ
- `npm_dist_tag`: tag เป้าหมายของ npm สำหรับ path publish; ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Publish` รับ input ที่ operator ควบคุมเหล่านี้:

- `tag`: release tag ที่จำเป็น; ต้องมีอยู่แล้ว
- `preflight_run_id`: run id ของ preflight `OpenClaw NPM Release` ที่สำเร็จ;
  จำเป็นเมื่อ `publish_openclaw_npm=true`
- `full_release_validation_run_id`: run id ของ `Full Release Validation` ที่สำเร็จ;
  จำเป็นเมื่อ `publish_openclaw_npm=true`
- `windows_node_tag`: release tag `openclaw/openclaw-windows-node` แบบ non-prerelease ที่แน่นอน;
  จำเป็นสำหรับการ publish OpenClaw แบบ stable
- `windows_node_installer_digests`: map JSON แบบ compact ที่ candidate-approved แล้วของ
  ชื่อ installer Windows ปัจจุบันไปยัง digest `sha256:` ที่ pin ไว้; จำเป็น
  สำหรับการ publish OpenClaw แบบ stable
- `npm_dist_tag`: tag เป้าหมายของ npm สำหรับแพ็กเกจ OpenClaw
- `plugin_publish_scope`: ค่าเริ่มต้นคือ `all-publishable`; ใช้ `selected` เฉพาะ
  สำหรับงานซ่อม Plugin-only แบบเจาะจงพร้อม `publish_openclaw_npm=false`
- `plugins`: ชื่อแพ็กเกจ `@openclaw/*` คั่นด้วย comma เมื่อ
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: ค่าเริ่มต้นคือ `true`; ตั้งเป็น `false` เฉพาะเมื่อใช้
  workflow เป็น orchestrator ซ่อมแซมแบบ Plugin-only
- `wait_for_clawhub`: ค่าเริ่มต้นคือ `false` เพื่อไม่ให้ availability ของ npm ถูกบล็อกโดย
  sidecar ClawHub; ตั้งเป็น `true` เฉพาะเมื่อการเสร็จของ workflow ต้องรวม
  การเสร็จของ ClawHub ด้วย

`OpenClaw Release Checks` รับ input ที่ operator ควบคุมเหล่านี้:

- `ref`: branch, tag หรือ commit SHA เต็มที่จะตรวจสอบ การตรวจที่มี secret
  ต้องให้ commit ที่ resolve แล้วเข้าถึงได้จาก branch หรือ
  release tag ของ OpenClaw
- `run_release_soak`: เลือกใช้ soak แบบ live/E2E อย่างละเอียด, Docker release-path และ
  all-since upgrade-survivor สำหรับการตรวจรีลีส beta ค่านี้ถูกบังคับเปิดโดย
  `release_profile=stable` และ `release_profile=full`

กฎ:

- tag แบบ stable และ correction อาจ publish ไปยัง `beta` หรือ `latest` ก็ได้
- tag prerelease แบบ beta publish ได้เฉพาะไปยัง `beta`
- สำหรับ `OpenClaw NPM Release` อนุญาต input เป็น commit SHA เต็มเฉพาะเมื่อ
  `preflight_only=true`
- `OpenClaw Release Checks` และ `Full Release Validation` เป็น
  validation-only เสมอ
- path publish จริงต้องใช้ `npm_dist_tag` เดียวกับที่ใช้ระหว่าง preflight;
  workflow จะตรวจ metadata นั้นก่อน publish ต่อ

## ลำดับการรีลีส npm แบบ stable

เมื่อทำการตัดรีลีส npm แบบ stable:

1. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนมีแท็ก คุณอาจใช้ SHA ของคอมมิตปัจจุบันเต็มรูปแบบจาก workflow branch
     สำหรับการ dry run แบบตรวจสอบเท่านั้นของ preflight workflow
2. เลือก `npm_dist_tag=beta` สำหรับ flow ปกติแบบ beta-first หรือ `latest` เท่านั้น
   เมื่อคุณตั้งใจต้องการเผยแพร่ stable โดยตรง
3. รัน `Full Release Validation` บน release branch, release tag หรือ
   commit SHA แบบเต็ม เมื่อคุณต้องการ CI ปกติพร้อมความครอบคลุมของ live prompt cache, Docker, QA Lab,
   Matrix และ Telegram จาก workflow แบบ manual เดียว
4. หากคุณตั้งใจต้องการเฉพาะกราฟการทดสอบปกติที่กำหนดได้แน่นอน ให้รัน
   workflow `CI` แบบ manual บน release ref แทน
5. เลือก release tag ของ `openclaw/openclaw-windows-node` ที่ไม่ใช่ prerelease อย่างเจาะจง
   ซึ่ง signed installer สำหรับ x64 และ ARM64 ควรถูกจัดส่ง บันทึกเป็น
   `windows_node_tag` และบันทึก digest map ที่ผ่านการตรวจสอบแล้วของ installer เหล่านั้นเป็น
   `windows_node_installer_digests` ตัวช่วย release-candidate จะบันทึกทั้งสองรายการ
   และรวมไว้ในคำสั่ง publish ที่สร้างขึ้น
6. บันทึก `preflight_run_id` และ `full_release_validation_run_id` ที่สำเร็จ
7. รัน `OpenClaw Release Publish` ด้วย `tag` เดิม, `npm_dist_tag` เดิม,
   `windows_node_tag` ที่เลือก, `windows_node_installer_digests` ที่บันทึกไว้,
   `preflight_run_id` ที่บันทึกไว้ และ `full_release_validation_run_id` ที่บันทึกไว้;
   workflow นี้จะเผยแพร่ plugins ที่ externalize แล้วไปยัง npm และ ClawHub ก่อนโปรโมต
   แพ็กเกจ OpenClaw npm
8. หาก release ลงบน `beta` ให้ใช้
   workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   เพื่อโปรโมตเวอร์ชัน stable นั้นจาก `beta` เป็น `latest`
9. หาก release ตั้งใจเผยแพร่โดยตรงไปยัง `latest` และ `beta`
   ควรตาม stable build เดียวกันทันที ให้ใช้ release
   workflow เดียวกันนั้นเพื่อชี้ dist-tags ทั้งคู่ไปยังเวอร์ชัน stable หรือปล่อยให้ scheduled
   self-healing sync ของ workflow นั้นย้าย `beta` ภายหลัง

การเปลี่ยนแปลง dist-tag อยู่ใน release ledger repo เพราะยังต้องใช้
`NPM_TOKEN` ขณะที่ source repo คงการ publish แบบ OIDC-only ไว้

สิ่งนี้ทำให้ทั้งเส้นทาง publish โดยตรงและเส้นทางโปรโมตแบบ beta-first
มีเอกสารกำกับและผู้ปฏิบัติงานมองเห็นได้

หาก maintainer ต้อง fallback ไปใช้การยืนยันตัวตน npm แบบ local ให้รันคำสั่ง
CLI (`op`) ของ 1Password ใดๆ ภายใน tmux session เฉพาะเท่านั้น อย่าเรียก `op`
โดยตรงจาก shell หลักของ agent; การเก็บไว้ใน tmux ทำให้ prompts,
alerts และการจัดการ OTP สังเกตเห็นได้ และป้องกัน host alerts ซ้ำๆ

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
