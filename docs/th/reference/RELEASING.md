---
read_when:
    - กำลังค้นหาข้อกำหนดของช่องทางเผยแพร่สาธารณะ
    - การรันการตรวจสอบความถูกต้องของรุ่นเผยแพร่หรือการตรวจรับแพ็กเกจ
    - กำลังมองหารูปแบบการตั้งชื่อเวอร์ชันและรอบการออกรุ่น
summary: เลนการเผยแพร่ รายการตรวจสอบสำหรับผู้ปฏิบัติการ กล่องการตรวจสอบความถูกต้อง การตั้งชื่อเวอร์ชัน และรอบการเผยแพร่
title: นโยบายการเผยแพร่
x-i18n:
    generated_at: "2026-07-04T18:28:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00772c1a2ad62eb7138b1eda581786390835add0a96996114cac2fd77edb367
    source_path: reference/RELEASING.md
    workflow: 16
---

ปัจจุบัน OpenClaw เปิดเผยช่องทางอัปเดตที่ผู้ใช้เห็นได้สามช่องทาง:

- stable: ช่องทางรีลีสที่โปรโมตแล้วซึ่งมีอยู่เดิม โดยยังคง resolve ผ่าน
  npm `latest` จนกว่า milestone CLI/channel แยกต่างหากจะพร้อมใช้งาน
- beta: แท็ก prerelease ที่เผยแพร่ไปยัง npm `beta`
- dev: head ที่เปลี่ยนแปลงตลอดเวลาของ `main`

แยกจากกัน ผู้ดำเนินการรีลีสสามารถเผยแพร่แพ็กเกจหลักของเดือนที่เสร็จสิ้นล่าสุด
ไปยัง npm `extended-stable` โดยเริ่มที่แพตช์ `33` ได้ ไลน์ final ปกติของเดือนปัจจุบัน
ยังคงอยู่บน npm `latest`; การแยกการเผยแพร่ฝั่งผู้ดำเนินการนี้ไม่ได้เปลี่ยน
การ resolve ช่องทางอัปเดตของ CLI ด้วยตัวเอง

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันรีลีส extended-stable รายเดือนของ npm: `YYYY.M.PATCH` โดยมี `PATCH >= 33`
  - แท็ก Git: `vYYYY.M.PATCH`
- เวอร์ชันรีลีส final รายวัน/ปกติ: `YYYY.M.PATCH` โดยมี `PATCH < 33`
  - แท็ก Git: `vYYYY.M.PATCH`
- เวอร์ชันรีลีสแก้ไข fallback ปกติ: `YYYY.M.PATCH-N`
  - แท็ก Git: `vYYYY.M.PATCH-N`
- เวอร์ชัน prerelease beta: `YYYY.M.PATCH-beta.N`
  - แท็ก Git: `vYYYY.M.PATCH-beta.N`
- อย่าเติมศูนย์นำหน้าเดือนหรือแพตช์
- ตั้งแต่การอัปเดตกระบวนการรีลีสเดือนมิถุนายน 2026 เป็นต้นไป คอมโพเนนต์ที่สามคือ
  หมายเลข release-train รายเดือนแบบลำดับ ไม่ใช่วันตามปฏิทิน รีลีส stable และ beta
  เป็นตัวกำหนด train ปัจจุบัน; แท็ก alpha-only จะไม่ใช้หรือ
  ขยับหมายเลขแพตช์ beta/stable แท็กและเวอร์ชัน npm ก่อนการอัปเดตจะคง
  ชื่อเดิมและยังใช้ได้; ระบบอัตโนมัติของรีลีสยังคง
  เปรียบเทียบตามปี เดือน แพตช์ ช่องทาง และหมายเลข prerelease หรือ correction
- บิลด์ alpha/nightly ใช้ patch train ถัดไปที่ยังไม่รีลีส และเพิ่มเฉพาะ
  `alpha.N` สำหรับบิลด์ซ้ำ เมื่อแพตช์นั้นมี beta แล้ว บิลด์ alpha ใหม่
  จะย้ายไปยังแพตช์ถัดไป ให้ละเว้นแท็ก legacy alpha-only ที่มีหมายเลขแพตช์
  สูงกว่าเมื่อเลือก train beta หรือ stable
- เวอร์ชัน npm เปลี่ยนแปลงไม่ได้ หากแท็ก beta ถูกเผยแพร่ไปแล้ว อย่า
  ลบ เผยแพร่ซ้ำ หรือใช้ซ้ำ; ให้ตัดหมายเลข beta ถัดไปหรือแพตช์รายเดือนถัดไปแทน
  เนื่องจาก `2026.6.5-beta.1` ถูกเผยแพร่แล้วระหว่างการเปลี่ยนผ่าน
  release train เดือนมิถุนายน 2026 ต้องใช้แพตช์ `5` หรือสูงกว่า อย่า
  เผยแพร่ train stable หรือ beta ใหม่ของเดือนมิถุนายน 2026 เป็น `2026.6.2`, `2026.6.3` หรือ
  `2026.6.4`
- หลังจาก final ปกติ `2026.6.5` train beta ใหม่ถัดไปคือ
  `2026.6.6-beta.1` แม้ว่า
  จะมีแท็กอัตโนมัติ alpha-only ที่มีหมายเลขแพตช์สูงกว่าอยู่แล้วก็ตาม
- `latest` ยังคงตามไลน์ npm ปกติ/รายวันปัจจุบัน
- `beta` หมายถึงเป้าหมายการติดตั้ง beta ปัจจุบัน
- `extended-stable` หมายถึงแพ็กเกจ npm ของเดือนย้อนหลังที่รองรับ โดยเริ่มที่แพตช์
  `33`; แพตช์ `34` และหลังจากนั้นเป็นรีลีสบำรุงรักษาบนไลน์รายเดือนนั้น
- เส้นทาง extended-stable รายเดือนเฉพาะจะเผยแพร่เฉพาะแพ็กเกจหลักของ npm เท่านั้น โดย
  ไม่เผยแพร่ plugins, อาร์ติแฟกต์ macOS หรือ Windows, GitHub Release,
  dist-tags ของ private-repository, Docker images, อาร์ติแฟกต์มือถือ หรือ
  ไฟล์ดาวน์โหลดเว็บไซต์

## จังหวะการรีลีส

- รีลีสจะดำเนินแบบ beta-first
- Stable จะตามมาหลังจาก beta ล่าสุดผ่านการตรวจสอบแล้วเท่านั้น
- โดยปกติ maintainers จะตัดรีลีสจากสาขา `release/YYYY.M.PATCH` ที่สร้าง
  จาก `main` ปัจจุบัน เพื่อให้การตรวจสอบรีลีสและการแก้ไขไม่บล็อก
  การพัฒนาใหม่บน `main`
- หากแท็ก beta ถูก push หรือเผยแพร่แล้วและต้องการการแก้ไข maintainers จะตัด
  แท็ก `-beta.N` ถัดไปแทนการลบหรือสร้างแท็ก beta เดิมใหม่
- ขั้นตอนรีลีสโดยละเอียด การอนุมัติ credential และบันทึกการกู้คืนเป็น
  เฉพาะ maintainer เท่านั้น

## การเผยแพร่ extended-stable รายเดือนเฉพาะ npm

นี่เป็นข้อยกเว้นเฉพาะสำหรับขั้นตอนรีลีสปกติด้านล่าง สำหรับ
เดือนที่เสร็จสิ้นแล้ว `YYYY.M` ให้สร้าง `extended-stable/YYYY.M.33`; เผยแพร่ `vYYYY.M.33` และ
แพตช์บำรุงรักษาหลังจากนั้นจากสาขาเดียวกันนั้น แท็กรีลีส ปลายสาขา
checkout เวอร์ชันแพ็กเกจ npm preflight และรัน Full Release Validation ต้อง
ระบุ commit เดียวกันทั้งหมด `main` ที่ได้รับการป้องกันต้องมีเวอร์ชัน final ของเดือนปฏิทินที่
ใหม่กว่าอย่างเคร่งครัดซึ่งต่ำกว่าแพตช์ `33` อยู่แล้ว; แพตช์บำรุงรักษายังคง
มีสิทธิ์หลังจาก `main` เดินหน้าไปมากกว่าหนึ่งเดือน

รัน npm preflight และ Full Release Validation จากสาขา extended-stable ที่ตรงกันพอดี
จากนั้นบันทึก run ID ทั้งสองรายการ:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable` คือโปรไฟล์ความลึกในการตรวจสอบที่มีอยู่เดิม; โปรไฟล์นี้
แยกจาก dist-tag npm `extended-stable` และตั้งใจให้ไม่เปลี่ยนแปลง

หลังจากทั้งสองรันสำเร็จและสภาพแวดล้อมรีลีส npm พร้อมแล้ว ให้ promote
tarball preflight ที่ตรงกันพอดี แพตช์ `P` ต้องเป็น `33` หรือมากกว่า:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

สำหรับ fork หรือการซ้อมที่ไม่ใช่ production ซึ่งตั้งใจว่าไม่สามารถทำตาม
นโยบายเดือน `.33` หรือ protected-`main` ได้ ให้เพิ่ม
`-f bypass_extended_stable_guard=true` ใน dispatch ทั้ง npm preflight และ publish ค่า
เริ่มต้นคือ `false` bypass นี้ยอมรับเฉพาะเมื่อใช้กับ `npm_dist_tag=extended-stable` และ
จะถูกบันทึกในสรุป workflow โดยจะไม่ bypass workflow ref แบบ canonical
`extended-stable/YYYY.M.33`, ความเท่ากันของ branch-tip/tag/checkout, ไวยากรณ์ final-tag,
ความเท่ากันของเวอร์ชัน package/tag, ตัวตนของรันและ manifest ที่อ้างอิง,
provenance ของ tarball, การอนุมัติ environment, registry readback หรือหลักฐาน
การซ่อม selector

workflow publish จะตรวจสอบตัวตนของรันที่อ้างอิง digest ของ
tarball ที่เตรียมไว้ และ selector ของ npm registry ทั้งสองรายการ ให้ยืนยัน
ผลลัพธ์แยกต่างหากหลังจาก workflow สำเร็จ:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

ทั้งสองคำสั่งต้องคืนค่า `YYYY.M.P` หาก publish สำเร็จแต่ selector
readback ล้มเหลว อย่าเผยแพร่เวอร์ชันแพ็กเกจที่เปลี่ยนแปลงไม่ได้ซ้ำ ใช้คำสั่งซ่อมเดียว
`npm dist-tag add openclaw@YYYY.M.P extended-stable` ที่พิมพ์ไว้ใน
สรุป always-run ของ workflow ที่ล้มเหลว จากนั้นทำ readback แยกทั้งสองรายการซ้ำ
การ rollback ไปยัง selector ก่อนหน้าเป็นการตัดสินใจของผู้ดำเนินการแยกต่างหาก ไม่ใช่
เส้นทางซ่อม readback

checklist ปกติด้านล่างยังคงเป็นเจ้าของ beta, `latest`, GitHub Release,
plugins, macOS, Windows และการเผยแพร่แพลตฟอร์มอื่น ๆ อย่ารันขั้นตอนเหล่านั้น
สำหรับเส้นทาง extended-stable เฉพาะ npm นี้

## checklist ผู้ดำเนินการรีลีสปกติ

checklist นี้คือรูปแบบสาธารณะของ release flow credential ส่วนตัว
การ signing, notarization, การกู้คืน dist-tag และรายละเอียด rollback ฉุกเฉินจะอยู่ใน
runbook รีลีสเฉพาะ maintainer เท่านั้น

1. เริ่มจาก `main` ปัจจุบัน: ดึงรายการล่าสุด ยืนยันว่าคอมมิตเป้าหมายถูกพุชแล้ว
   และยืนยันว่า CI ของ `main` ปัจจุบันเขียวเพียงพอสำหรับการแตกแขนงจากจุดนั้น
2. สร้างส่วนบนสุดของ `CHANGELOG.md` จาก PR ที่ถูกรวมแล้วและคอมมิตโดยตรงทั้งหมด
   นับตั้งแต่แท็กรีลีสล่าสุดที่เข้าถึงได้ คงรายการให้เป็นมุมมองผู้ใช้
   รวมรายการ PR/คอมมิตโดยตรงที่ซ้ำซ้อนกันใหม่ คอมมิตการเขียนใหม่ พุช
   และรีเบส/ดึงอีกครั้งก่อนแตกแขนง
3. ตรวจทานระเบียนความเข้ากันได้ของรีลีสใน
   `src/plugins/compat/registry.ts` และ
   `src/commands/doctor/shared/deprecation-compat.ts` ลบความเข้ากันได้
   ที่หมดอายุแล้วเฉพาะเมื่อเส้นทางอัปเกรดยังคงครอบคลุมอยู่ หรือบันทึกเหตุผลว่า
   เหตุใดจึงตั้งใจคงไว้
4. สร้าง `release/YYYY.M.PATCH` จาก `main` ปัจจุบัน; อย่าทำงานรีลีสปกติ
   โดยตรงบน `main`
5. เพิ่มเวอร์ชันในทุกตำแหน่งที่จำเป็นสำหรับแท็กที่ต้องการ จากนั้นรัน
   `pnpm release:prep` คำสั่งนี้รีเฟรชเวอร์ชัน Plugin, อินเวนทอรี Plugin, สคีมาคอนฟิก,
   เมตาดาต้าคอนฟิกช่องทางที่บันเดิล, baseline เอกสารคอนฟิก, การส่งออก Plugin SDK
   และ baseline API ของ Plugin SDK ตามลำดับที่ถูกต้อง คอมมิต drift ที่ถูกสร้างขึ้น
   ก่อนติดแท็ก จากนั้นรัน preflight แบบ deterministic ในเครื่อง:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, และ `pnpm release:check`
6. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true` ก่อนมีแท็ก
   อนุญาตให้ใช้ SHA ของแขนงรีลีสแบบครบ 40 อักขระสำหรับ preflight เพื่อการตรวจสอบเท่านั้น
   preflight จะสร้างหลักฐานรีลีสของ dependency สำหรับกราฟ dependency ที่ checkout
   ออกมาแบบตรงตัว และเก็บไว้ในอาร์ติแฟกต์ npm preflight บันทึก `preflight_run_id`
   ที่สำเร็จไว้
7. เริ่มการทดสอบก่อนรีลีสทั้งหมดด้วย `Full Release Validation` สำหรับแขนงรีลีส,
   แท็ก, หรือ SHA คอมมิตแบบเต็ม นี่คือ entrypoint แบบ manual เพียงจุดเดียว
   สำหรับกล่องทดสอบรีลีสขนาดใหญ่ทั้งสี่: Vitest, Docker, QA Lab, และ Package
8. หากการตรวจสอบล้มเหลว ให้แก้บนแขนงรีลีสและรันไฟล์, lane, งาน workflow,
   โปรไฟล์แพ็กเกจ, provider, หรือ allowlist ของโมเดลที่ล้มเหลวซ้ำด้วยขอบเขตเล็กที่สุด
   ที่พิสูจน์การแก้ไขได้ รัน umbrella แบบเต็มซ้ำเฉพาะเมื่อพื้นผิวที่เปลี่ยนทำให้
   หลักฐานก่อนหน้าไม่สดแล้ว
9. สำหรับตัวเลือกเบต้าที่ติดแท็กแล้ว ให้รัน
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` จากแขนง
   `release/YYYY.M.PATCH` ที่ตรงกัน สำหรับ stable ให้ส่ง source release ของ Windows
   ที่จำเป็นด้วย:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   helper จะรันการตรวจ generated-release ในเครื่อง, dispatch หรือตรวจสอบ
   หลักฐาน full release validation และ npm preflight, รันหลักฐาน Parallels
   แบบ fresh/update กับ tarball ที่เตรียมไว้อย่างตรงตัวพร้อมหลักฐานแพ็กเกจ Telegram,
   บันทึกแผน npm ของ Plugin และ ClawHub, และพิมพ์คำสั่ง
   `OpenClaw Release Publish` ที่แน่นอนเฉพาะหลังจากชุดหลักฐานเขียวแล้ว
   `OpenClaw Release Publish` จะ dispatch แพ็กเกจ Plugin ที่เลือกหรือที่ publish ได้ทั้งหมด
   ไปยัง npm และชุดเดียวกันไปยัง ClawHub แบบขนาน จากนั้นโปรโมตอาร์ติแฟกต์
   OpenClaw npm preflight ที่เตรียมไว้ด้วย dist-tag ที่ตรงกันทันทีเมื่อการ publish
   npm ของ Plugin สำเร็จ
   หลังจาก child ของการ publish OpenClaw npm สำเร็จ ระบบจะสร้างหรืออัปเดตหน้า
   GitHub release/prerelease ที่ตรงกันจากส่วน `CHANGELOG.md` ที่ตรงกันแบบครบถ้วน
   รีลีส stable ที่ publish ไปยัง npm `latest` จะกลายเป็นรีลีสล่าสุดของ GitHub;
   รีลีส maintenance แบบ stable ที่คงไว้บน npm `beta` จะถูกสร้างด้วย GitHub
   `latest=false` workflow ยังอัปโหลดหลักฐาน dependency ของ preflight,
   manifest ของ full-validation, และหลักฐานการตรวจสอบ registry หลัง publish
   ไปยัง GitHub release เพื่อใช้ตอบสนอง incident หลังรีลีส workflow publish
   จะพิมพ์ ID ของ child run ทันที, อนุมัติ gate ของสภาพแวดล้อมรีลีสที่ workflow token
   ได้รับอนุญาตให้อนุมัติโดยอัตโนมัติ, สรุป child job ที่ล้มเหลวพร้อม log tail,
   ปิดงาน GitHub release และหลักฐาน dependency ทันทีเมื่อการ publish OpenClaw npm
   สำเร็จ, รอ ClawHub ทุกครั้งที่กำลัง publish OpenClaw npm, จากนั้นรัน
   `pnpm release:verify-beta` และอัปโหลดหลักฐานหลัง publish สำหรับ GitHub release,
   แพ็กเกจ npm, แพ็กเกจ npm ของ Plugin ที่เลือก, แพ็กเกจ ClawHub ที่เลือก,
   ID ของ child workflow run, และ ID ของ NPM Telegram run ที่เป็นตัวเลือก
   เส้นทาง ClawHub จะ retry ความล้มเหลวชั่วคราวของการติดตั้ง dependency ของ CLI,
   publish Plugin ที่ผ่าน preview แม้ preview cell หนึ่งจะ flake, และจบด้วย
   การตรวจสอบ registry สำหรับทุกเวอร์ชัน Plugin ที่คาดไว้ เพื่อให้การ publish
   บางส่วนยังมองเห็นและ retry ได้ จากนั้นรันการยอมรับแพ็กเกจหลัง publish
   กับแพ็กเกจที่ publish แล้ว
   `openclaw@YYYY.M.PATCH-beta.N` หรือ
   `openclaw@beta` หาก prerelease ที่ถูกพุชหรือ publish ต้องการการแก้ไข
   ให้ตัด prerelease หมายเลขถัดไปที่ตรงกัน; อย่าลบหรือเขียน prerelease เก่าใหม่
10. สำหรับ stable ให้ดำเนินต่อเฉพาะหลังจากเบต้าหรือ release candidate ที่ผ่านการตรวจแล้ว
    มีหลักฐานการตรวจสอบที่จำเป็น การ publish npm แบบ stable ต้องผ่าน
    `OpenClaw Release Publish` เช่นกัน โดยนำอาร์ติแฟกต์ preflight ที่สำเร็จมาใช้ซ้ำผ่าน
    `preflight_run_id`; ความพร้อมของรีลีส macOS แบบ stable ยังต้องมีแพ็กเกจ
    `.zip`, `.dmg`, `.dSYM.zip`, และ `appcast.xml` ที่อัปเดตแล้วบน `main`
    workflow publish ของ macOS จะ publish appcast ที่ลงนามแล้วไปยัง `main`
    สาธารณะโดยอัตโนมัติหลังจากตรวจสอบ release assets; หาก branch protection
    บล็อกการพุชโดยตรง ระบบจะเปิดหรืออัปเดต PR สำหรับ appcast ความพร้อมของ
    Windows Hub แบบ stable ต้องมี asset `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe`, และ
    `OpenClawCompanion-SHA256SUMS.txt` ที่ลงนามแล้วบน GitHub release ของ OpenClaw
    ส่งแท็กรีลีส `openclaw/openclaw-windows-node` ที่ลงนามอย่างตรงตัวเป็น
    `windows_node_tag` และแผนที่ digest ของ installer ที่ผ่านการอนุมัติ candidate
    เป็น `windows_node_installer_digests`; `OpenClaw Release Publish` จะคง draft
    ของรีลีส, dispatch `Windows Node Release`, และตรวจสอบ asset ทั้งสามก่อนเผยแพร่
11. หลัง publish ให้รันตัวตรวจหลัง publish ของ npm, E2E Telegram ของ published-npm
    แบบ standalone ที่เป็นตัวเลือกเมื่อคุณต้องการหลักฐานช่องทางหลัง publish,
    โปรโมต dist-tag เมื่อจำเป็น, ตรวจสอบหน้า GitHub release ที่สร้างขึ้น,
    รันขั้นตอนประกาศรีลีส, จากนั้นทำ [การปิดงาน main แบบ stable](#stable-main-closeout)
    ให้เสร็จก่อนเรียกรีลีส stable ว่าเสร็จสิ้น

## การปิดงาน main แบบ stable

การเผยแพร่ stable ยังไม่สมบูรณ์จนกว่า `main` จะมีสถานะรีลีสที่ถูก ship จริง

1. เริ่มจาก `main` ล่าสุดแบบสด ตรวจสอบ `release/YYYY.M.PATCH` เทียบกับมันและ
   forward-port การแก้ไขจริงที่ไม่มีอยู่ใน `main` อย่า merge compatibility,
   test, หรือ validation adapter ที่มีเฉพาะรีลีสเข้าไปใน `main` ที่ใหม่กว่าแบบไม่ไตร่ตรอง
2. ตั้ง `main` เป็นเวอร์ชัน stable ที่ถูก ship แล้ว ไม่ใช่ train ถัดไปเชิงคาดการณ์ รัน
   `pnpm release:prep` หลังการเปลี่ยนเวอร์ชัน root จากนั้นรัน
   `pnpm deps:shrinkwrap:generate`
3. ทำให้ส่วน `## YYYY.M.PATCH` ของ `CHANGELOG.md` บน `main` ตรงกับ
   แขนงรีลีสที่ติดแท็กอย่างสมบูรณ์ รวมการอัปเดต `appcast.xml` แบบ stable
   เมื่อรีลีส mac publish ไฟล์ดังกล่าว
4. อย่าเพิ่ม `YYYY.M.PATCH+1`, เวอร์ชันเบต้า, หรือส่วน changelog อนาคตที่ว่างเปล่า
   ไปยัง `main` จนกว่า operator จะเริ่ม release train นั้นอย่างชัดเจน
5. รัน `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check`, และ
   `OPENCLAW_TESTBOX=1 pnpm check:changed` พุช จากนั้นตรวจสอบว่า `origin/main`
   มีเวอร์ชันและ changelog ที่ถูก ship ก่อนเรียกรีลีส stable ว่าเสร็จ
6. ทำให้ตัวแปร repository `RELEASE_ROLLBACK_DRILL_ID` และ
   `RELEASE_ROLLBACK_DRILL_DATE` เป็นปัจจุบันหลัง private rollback drill แต่ละครั้ง
   `OpenClaw Stable Main Closeout` จะเริ่มจากการพุช `main` ที่มีเวอร์ชัน,
   changelog, และ appcast ที่ถูก ship หลังการเผยแพร่ stable มันอ่านหลักฐาน
   หลัง publish แบบ immutable เพื่อผูกแท็กที่ถูก ship กับ Full Release Validation
   และ Publish run ของแท็กนั้น จากนั้นตรวจสอบสถานะ main แบบ stable, รีลีส,
   stable soak ที่บังคับ, และหลักฐานประสิทธิภาพที่บล็อก มันแนบ closeout manifest
   แบบ immutable และ checksum ไปยัง GitHub release ทริกเกอร์พุชอัตโนมัติจะข้าม
   รีลีส legacy ที่เก่ากว่าหลักฐานหลัง publish แบบ immutable; มันจะไม่ถือว่าการข้ามนั้น
   เป็น closeout ที่เสร็จสมบูรณ์ closeout ที่สมบูรณ์ต้องมีทั้ง asset และ checksum
   ที่ตรงกัน manifest บางส่วนจะ replay SHA ของ `main` และ rollback drill ที่บันทึกไว้
   เพื่อสร้าง byte ที่เหมือนกันอีกครั้ง จากนั้นแนบ checksum ที่หายไป; คู่ที่ไม่ถูกต้อง,
   หรือ checksum ที่ไม่มี manifest, จะยังคงบล็อกอยู่ run ที่ถูกทริกเกอร์ด้วยการพุช
   ซึ่งไม่มีตัวแปร repository ของ rollback drill จะข้ามโดยไม่ทำ closeout ให้เสร็จ;
   ระเบียน drill ที่หายไปหรือเก่ากว่า 90 วันยังคงบล็อก closeout แบบ manual
   ที่มีหลักฐานรองรับ คำสั่งกู้คืนแบบ private ยังคงอยู่ใน runbook สำหรับ maintainer เท่านั้น
   ใช้ manual dispatch เฉพาะเพื่อซ่อมหรือ replay closeout แบบ stable ที่มีหลักฐานรองรับ
   แท็ก correction fallback แบบ legacy อาจนำหลักฐาน base-package มาใช้ซ้ำได้เฉพาะเมื่อ
   แท็ก correction resolve ไปยัง source commit เดียวกับแท็ก stable พื้นฐาน
   correction ที่มี source ต่างกันต้อง publish และตรวจสอบหลักฐานแพ็กเกจของตัวเอง

## preflight ของรีลีส

- เรียกใช้ `pnpm check:test-types` ก่อน preflight การเผยแพร่ เพื่อให้ TypeScript สำหรับการทดสอบยังคง
  ถูกครอบคลุมนอกเหนือจาก gate `pnpm check` ภายในเครื่องที่เร็วกว่า
- เรียกใช้ `pnpm check:architecture` ก่อน preflight การเผยแพร่ เพื่อให้การตรวจสอบ import
  cycle และขอบเขตสถาปัตยกรรมที่กว้างขึ้นผ่านเป็นสีเขียวนอกเหนือจาก gate ภายในเครื่องที่เร็วกว่า
- เรียกใช้ `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้ artifact การเผยแพร่
  `dist/*` ที่คาดไว้และ bundle ของ Control UI มีอยู่สำหรับขั้นตอนตรวจสอบความถูกต้องของ pack
- เรียกใช้ `pnpm release:prep` หลังจาก bump เวอร์ชันรากและก่อน tagging คำสั่งนี้
  เรียกใช้ตัวสร้างการเผยแพร่แบบกำหนดได้ซ้ำทุกตัวที่มัก drift หลังจากการเปลี่ยนแปลง
  เวอร์ชัน/config/API: เวอร์ชัน Plugin, inventory ของ Plugin, schema config พื้นฐาน,
  metadata config ของ bundled channel, baseline เอกสาร config, export ของ Plugin SDK
  และ baseline API ของ Plugin SDK `pnpm release:check` เรียก guard เหล่านั้นซ้ำ
  ในโหมดตรวจสอบ และรายงานความล้มเหลวจาก generated drift ทุกอย่างที่พบในรอบเดียว
  ก่อนเรียกใช้การตรวจสอบการเผยแพร่ package
- การซิงก์เวอร์ชัน Plugin อัปเดตเวอร์ชัน package ของ Plugin ทางการ และ floor
  `openclaw.compat.pluginApi` ที่มีอยู่ให้เป็นเวอร์ชันเผยแพร่ OpenClaw โดย
  default ให้ถือว่าฟิลด์นั้นเป็น floor ของ API สำหรับ Plugin SDK/runtime ไม่ใช่แค่สำเนา
  ของเวอร์ชัน package: สำหรับการเผยแพร่เฉพาะ Plugin ที่ตั้งใจให้ยังคงเข้ากันได้
  กับ host OpenClaw รุ่นเก่ากว่า ให้คง floor ไว้ที่ API ของ host ที่เก่าที่สุดที่รองรับ
  และบันทึกเหตุผลนั้นในหลักฐานการเผยแพร่ Plugin
- เรียกใช้ workflow `Full Release Validation` แบบ manual ก่อนอนุมัติการเผยแพร่ เพื่อ
  kick off test box ก่อนเผยแพร่ทั้งหมดจาก entrypoint เดียว รองรับ branch,
  tag หรือ commit SHA แบบเต็ม, dispatch `CI` แบบ manual และ dispatch
  `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, การตรวจสอบ package
  ข้าม OS, QA Lab parity, Matrix และ lane ของ Telegram การรัน stable และ full
  จะรวม live/E2E แบบละเอียดและ Docker release-path soak เสมอ;
  `run_release_soak=true` ยังคงมีไว้สำหรับ beta soak แบบชัดเจน Package
  Acceptance ให้ Telegram E2E ของ package ที่เป็น canonical ระหว่างการตรวจสอบ candidate
  โดยเลี่ยง live poller ตัวที่สองที่ทำงานพร้อมกัน
  ระบุ `release_package_spec` หลังจากเผยแพร่ beta เพื่อใช้ npm package ที่ส่งมอบแล้วซ้ำ
  ใน release checks, Package Acceptance และ package Telegram E2E โดยไม่ต้อง rebuild release tarball
  ระบุ `npm_telegram_package_spec` เฉพาะเมื่อ Telegram ควรใช้ package ที่เผยแพร่แล้ว
  คนละตัวกับส่วนที่เหลือของการตรวจสอบการเผยแพร่ ระบุ
  `package_acceptance_package_spec` เมื่อ Package Acceptance ควรใช้ package ที่เผยแพร่แล้ว
  คนละตัวกับ release package spec ระบุ
  `evidence_package_spec` เมื่อรายงานหลักฐานการเผยแพร่ควรพิสูจน์ว่าการตรวจสอบ
  ตรงกับ npm package ที่เผยแพร่แล้วโดยไม่บังคับ Telegram E2E
  ตัวอย่าง:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- เรียกใช้ workflow `Package Acceptance` แบบ manual เมื่อคุณต้องการหลักฐาน side-channel
  สำหรับ candidate ของ package ขณะที่งานเผยแพร่ยังดำเนินต่อ ใช้ `source=npm` สำหรับ
  `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันเผยแพร่แบบระบุชัด; `source=ref`
  เพื่อ pack branch/tag/SHA `package_ref` ที่เชื่อถือได้ด้วย harness
  `workflow_ref` ปัจจุบัน; `source=url` สำหรับ tarball HTTPS สาธารณะที่ต้องมี
  SHA-256 และนโยบาย URL สาธารณะที่เข้มงวด; `source=trusted-url` สำหรับนโยบาย
  trusted-source ที่มีชื่อโดยใช้ `trusted_source_id` และ SHA-256 ที่จำเป็น; หรือ
  `source=artifact` สำหรับ tarball ที่อัปโหลดโดย GitHub Actions run อื่น
  workflow จะแปลง candidate เป็น
  `package-under-test`, ใช้ตัวจัดตาราง Docker E2E release ซ้ำกับ tarball นั้น
  และสามารถเรียกใช้ Telegram QA กับ tarball เดียวกันด้วย
  `telegram_mode=mock-openai` หรือ `telegram_mode=live-frontier` เมื่อ
  lane ของ Docker ที่เลือกมี `published-upgrade-survivor`, artifact ของ package
  คือ candidate และ `published_upgrade_survivor_baseline` เลือก baseline ที่เผยแพร่แล้ว
  `update-restart-auth` ใช้ package candidate เป็นทั้ง CLI ที่ติดตั้งและ
  package-under-test เพื่อให้ทดสอบ path การ restart ที่จัดการโดยคำสั่ง update ของ candidate
  ตัวอย่าง: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  profile ทั่วไป:
  - `smoke`: lane สำหรับ install/channel/agent, gateway network และ config reload
  - `package`: lane แบบ artifact-native สำหรับ package/update/restart/plugin โดยไม่มี OpenWebUI หรือ ClawHub แบบ live
  - `product`: profile package พร้อม MCP channels, การ cleanup cron/subagent,
    web search ของ OpenAI และ OpenWebUI
  - `full`: chunk ของ Docker release-path พร้อม OpenWebUI
  - `custom`: การเลือก `docker_lanes` แบบระบุชัดสำหรับการ rerun ที่โฟกัส
- เรียกใช้ workflow `CI` แบบ manual โดยตรงเมื่อคุณต้องการเฉพาะ coverage ของ CI ปกติ
  แบบกำหนดได้ซ้ำสำหรับ release candidate การ dispatch CI แบบ manual
  จะข้าม changed scoping และบังคับ shard Linux Node, shard bundled-plugin, shard contract ของ Plugin และ
  channel, ความเข้ากันได้กับ Node 22, `check-*`, `check-additional-*`,
  การตรวจสอบ smoke ของ built-artifact, การตรวจสอบ docs, Python skills, Windows, macOS และ
  lane Control UI i18n การรัน CI แบบ manual เดี่ยวจะรัน Android เฉพาะเมื่อ dispatch
  ด้วย `include_android=true`; `Full Release Validation` ส่ง input นั้นให้
  child CI ของตัวเอง
  ตัวอย่างพร้อม Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- เรียกใช้ `pnpm qa:otel:smoke` เมื่อตรวจสอบ telemetry สำหรับการเผยแพร่ คำสั่งนี้ทดสอบ
  QA-lab ผ่านตัวรับ OTLP/HTTP ภายในเครื่อง และตรวจสอบการ export trace, metric และ log
  พร้อม attribute ของ trace ที่จำกัดขอบเขต และการ redact content/identifier โดยไม่
  ต้องใช้ Opik, Langfuse หรือตัวรวบรวมภายนอกอื่น
- เรียกใช้ `pnpm qa:otel:collector-smoke` เมื่อตรวจสอบความเข้ากันได้กับ collector
  คำสั่งนี้ route การ export OTLP ของ QA-lab เดียวกันผ่าน container Docker ของ OpenTelemetry Collector
  จริง ก่อน assertion ของตัวรับภายในเครื่อง
- เรียกใช้ `pnpm qa:prometheus:smoke` เมื่อตรวจสอบ protected Prometheus scraping
  คำสั่งนี้ทดสอบ QA-lab, ปฏิเสธ scrape ที่ไม่ได้ authenticated และตรวจสอบว่า
  metric family ที่สำคัญต่อการเผยแพร่ยังคงไม่มี prompt content, identifier ดิบ,
  auth token และ path ภายในเครื่อง
- เรียกใช้ `pnpm qa:observability:smoke` เมื่อคุณต้องการ lane smoke ของ
  OpenTelemetry และ Prometheus สำหรับ source-checkout ต่อเนื่องกัน
- เรียกใช้ `pnpm release:check` ก่อนทุก tagged release
- preflight ของ `OpenClaw NPM Release` สร้างหลักฐานการเผยแพร่ dependency ก่อน
  pack npm tarball gate ช่องโหว่ npm advisory เป็นตัวบล็อกการเผยแพร่
  ส่วน transitive manifest risk, dependency ownership/install
  surface และรายงานการเปลี่ยนแปลง dependency เป็นเพียงหลักฐานการเผยแพร่ รายงาน
  การเปลี่ยนแปลง dependency เปรียบเทียบ release candidate กับ release tag ก่อนหน้า
  ที่ reachable
- preflight อัปโหลดหลักฐาน dependency เป็น
  `openclaw-release-dependency-evidence-<tag>` และยังฝังไว้ใต้
  `dependency-evidence/` ภายใน artifact npm preflight ที่เตรียมไว้ path เผยแพร่จริง
  จะใช้ artifact preflight นั้นซ้ำ จากนั้นแนบหลักฐานเดียวกัน
  ไปยัง GitHub release เป็น `openclaw-<version>-dependency-evidence.zip`
- เรียกใช้ `OpenClaw Release Publish` สำหรับลำดับ publish ที่เปลี่ยนแปลงสถานะหลังจาก
  tag มีอยู่แล้ว Dispatch จาก `release/YYYY.M.PATCH` (หรือ `main` เมื่อเผยแพร่ tag
  ที่ reachable จาก main), ส่ง release tag, `preflight_run_id` ของ OpenClaw npm
  ที่สำเร็จ และ `full_release_validation_run_id` ที่สำเร็จ และคงขอบเขตการ publish Plugin แบบ default
  `all-publishable` ไว้ เว้นแต่คุณตั้งใจรันการ repair แบบโฟกัส workflow จะ serialize
  การ publish Plugin npm, การ publish Plugin ClawHub และการ publish OpenClaw npm
  เพื่อให้ core package ไม่ถูกเผยแพร่ก่อน Plugin ภายนอกของมัน
- `OpenClaw Release Publish` แบบ stable ต้องมี `windows_node_tag` ที่ระบุชัด หลังจาก
  release `openclaw/openclaw-windows-node` แบบ non-prerelease ที่ตรงกันมีอยู่แล้ว
  นอกจากนี้ยังต้องมี map `windows_node_installer_digests` ที่ candidate-approved
  ก่อน dispatch child ของการ publish ใดๆ จะตรวจสอบว่า source release นั้น
  เผยแพร่แล้ว, ไม่ใช่ prerelease, มี installer x64/ARM64 ที่จำเป็น และ
  ยังคงตรงกับ map ที่อนุมัติแล้วนั้น จากนั้นจึง dispatch `Windows Node Release`
  ขณะที่ release ของ OpenClaw ยังเป็น draft โดยส่ง map digest ของ installer ที่ปักหมุดไว้
  โดยไม่เปลี่ยนแปลง workflow child
  ดาวน์โหลด installer Windows Hub ที่ signed แล้วจาก tag ที่ระบุนั้น,
  เทียบกับ digest ที่ปักหมุดไว้, ตรวจสอบว่า signature Authenticode
  ใช้ signer OpenClaw Foundation ที่คาดไว้บน runner Windows,
  เขียน manifest SHA-256 และอัปโหลด installer พร้อม manifest ไปยัง
  GitHub release ของ OpenClaw ที่เป็น canonical จากนั้นดาวน์โหลด asset ที่ promoted แล้วซ้ำ และ
  ตรวจสอบ membership และ hash ของ manifest parent ตรวจสอบ contract asset x64,
  ARM64 และ checksum ปัจจุบันก่อน publication การ recovery โดยตรง
  ปฏิเสธชื่อ asset `OpenClawCompanion-*` ที่ไม่คาดไว้ก่อนแทนที่
  contract asset ที่คาดไว้ด้วย byte ของ source ที่ปักหมุดไว้ Dispatch
  `Windows Node Release` แบบ manual เฉพาะสำหรับ recovery และส่ง tag แบบระบุชัดเสมอ ห้ามใช้
  `latest` พร้อมกับ map JSON `expected_installer_digests` ที่ชัดเจนจาก
  source release ที่อนุมัติแล้ว ลิงก์ดาวน์โหลดบนเว็บไซต์ควรชี้ไปยัง URL asset ของ release OpenClaw
  แบบระบุชัดสำหรับ stable release ปัจจุบัน หรือ
  `releases/latest/download/...` เฉพาะหลังจากตรวจสอบว่า latest redirect ของ GitHub
  ชี้ไปที่ release เดียวกันนั้นแล้ว; อย่าลิงก์ไปเฉพาะหน้า release ของ companion repo
- ตอนนี้การตรวจสอบการเผยแพร่รันใน workflow manual แยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรัน lane QA Lab mock parity พร้อมกับ profile Matrix แบบ live ที่เร็ว
  และ lane Telegram QA ก่อนอนุมัติการเผยแพร่ lane live
  ใช้ environment `qa-live-shared`; Telegram ยังใช้ credential lease ของ Convex CI
  เรียกใช้ workflow `QA-Lab - All Lanes` แบบ manual ด้วย
  `matrix_profile=all` และ `matrix_shards=true` เมื่อคุณต้องการ inventory ของ transport,
  media และ E2EE ของ Matrix แบบเต็มใน parallel
- การตรวจสอบ install และ upgrade runtime ข้าม OS เป็นส่วนหนึ่งของ
  `OpenClaw Release Checks` และ `Full Release Validation` สาธารณะ ซึ่งเรียก
  workflow reusable
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` โดยตรง
- การแยกนี้เป็นความตั้งใจ: รักษา path การเผยแพร่ npm จริงให้สั้น
  กำหนดได้ซ้ำ และโฟกัส artifact ขณะที่การตรวจสอบ live ที่ช้ากว่าอยู่ใน lane ของตัวเอง
  เพื่อไม่ให้ stall หรือ block การ publish
- การตรวจสอบการเผยแพร่ที่มี secret ควร dispatch ผ่าน `Full Release
Validation` หรือจาก workflow ref ของ `main`/release เพื่อให้ logic ของ workflow และ
  secret ยังถูกควบคุม
- `OpenClaw Release Checks` รับ branch, tag หรือ commit SHA แบบเต็ม ตราบใดที่
  commit ที่ resolve แล้ว reachable จาก branch หรือ release tag ของ OpenClaw
- preflight แบบ validation-only ของ `OpenClaw NPM Release` ยังรับ commit SHA แบบเต็ม
  40 อักขระของ workflow-branch ปัจจุบันได้ โดยไม่ต้องใช้ tag ที่ push แล้ว
- path SHA นั้นเป็น validation-only และไม่สามารถ promote เป็น publish จริงได้
- ในโหมด SHA workflow จะ synthesize `v<package.json version>` เฉพาะสำหรับ
  การตรวจสอบ metadata ของ package; การ publish จริงยังต้องมี release tag จริง
- workflow ทั้งสองคง path การ publish และ promotion จริงไว้บน runner ที่ GitHub-hosted
  ขณะที่ path validation ที่ไม่เปลี่ยนแปลงสถานะสามารถใช้ runner Linux Blacksmith ที่ใหญ่กว่าได้
- workflow นั้นรัน
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ workflow secret ทั้ง `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- preflight การเผยแพร่ npm ไม่รอ lane release checks แยกอีกต่อไป
- ก่อน tagging release candidate ภายในเครื่อง ให้รัน
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` helper นี้
  รัน guardrail การเผยแพร่แบบเร็ว, การตรวจสอบ release ของ Plugin npm/ClawHub, build,
  UI build และ `release:openclaw:npm:check` ตามลำดับที่จับ
  ข้อผิดพลาดทั่วไปที่บล็อกการอนุมัติก่อน workflow publish ของ GitHub จะเริ่ม
- เรียกใช้ `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือ tag beta/correction ที่ตรงกัน) ก่อนอนุมัติ
- หลังจาก publish npm แล้ว ให้รัน
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (หรือเวอร์ชัน beta/correction ที่ตรงกัน) เพื่อตรวจสอบเส้นทางการติดตั้งจากรีจิสทรีที่เผยแพร่แล้ว
  ใน temp prefix ใหม่
- หลังจากเผยแพร่ beta ให้รัน `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  เพื่อตรวจสอบการเริ่มใช้งานแพ็กเกจที่ติดตั้งแล้ว การตั้งค่า Telegram และ Telegram E2E จริง
  กับแพ็กเกจ npm ที่เผยแพร่แล้ว โดยใช้พูลข้อมูลรับรอง Telegram แบบเช่าที่แชร์ร่วมกัน
  การรันเฉพาะกิจของผู้ดูแลในเครื่องอาจละเว้นตัวแปร Convex และส่งข้อมูลรับรอง env
  `OPENCLAW_QA_TELEGRAM_*` ทั้งสามรายการโดยตรงได้
- หากต้องการรัน smoke beta หลังเผยแพร่แบบเต็มจากเครื่องของผู้ดูแล ให้ใช้ `pnpm release:beta-smoke -- --beta betaN` ตัวช่วยจะรันการตรวจสอบ Parallels npm update/fresh-target, dispatch `NPM Telegram Beta E2E`, poll workflow run ที่ตรงกัน, ดาวน์โหลด artifact และพิมพ์รายงาน Telegram
- ผู้ดูแลสามารถรันการตรวจสอบหลังเผยแพร่แบบเดียวกันจาก GitHub Actions ผ่าน workflow
  `NPM Telegram Beta E2E` แบบ manual ได้ Workflow นี้ตั้งใจให้รันแบบ manual เท่านั้นและ
  ไม่ได้รันทุกครั้งที่ merge
- ตอนนี้ระบบอัตโนมัติสำหรับ release ของผู้ดูแลใช้ preflight-then-promote:
  - การเผยแพร่ npm จริงต้องผ่าน npm `preflight_run_id` ที่สำเร็จ
  - การเผยแพร่ npm จริงต้องถูก dispatch จาก branch `main` หรือ
    `release/YYYY.M.PATCH` เดียวกันกับ preflight run ที่สำเร็จ
  - release npm แบบ stable มีค่าเริ่มต้นเป็น `beta`
  - การเผยแพร่ npm แบบ stable สามารถ target `latest` ได้อย่างชัดเจนผ่าน workflow input
  - การเปลี่ยนแปลง npm dist-tag ที่ใช้ token ตอนนี้อยู่ใน
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` เพราะ
    `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่ repo ต้นทางยังคงเผยแพร่แบบ
    OIDC-only
  - `macOS Release` สาธารณะใช้สำหรับการตรวจสอบเท่านั้น; เมื่อ tag อยู่เฉพาะบน
    release branch แต่ workflow ถูก dispatch จาก `main` ให้ตั้งค่า
    `public_release_branch=release/YYYY.M.PATCH`
  - การเผยแพร่ macOS จริงต้องผ่าน macOS `preflight_run_id` และ
    `validate_run_id` ที่สำเร็จ
  - เส้นทางการเผยแพร่จริงจะ promote artifact ที่เตรียมไว้ แทนที่จะ build ใหม่อีกครั้ง
- สำหรับ release แก้ไขแบบ stable เช่น `YYYY.M.PATCH-N` ตัวตรวจสอบหลังเผยแพร่
  จะตรวจสอบเส้นทาง upgrade แบบ temp-prefix เดียวกันจาก `YYYY.M.PATCH` ไปยัง `YYYY.M.PATCH-N`
  ด้วย เพื่อไม่ให้ release แก้ไขปล่อยให้การติดตั้ง global รุ่นเก่าค้างอยู่บน payload
  stable ฐานโดยไม่ส่งสัญญาณ
- npm release preflight จะ fail แบบปิด เว้นแต่ tarball จะมีทั้ง
  `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่าง
  เพื่อไม่ให้เราส่ง dashboard เบราว์เซอร์ว่างอีกครั้ง
- การตรวจสอบหลังเผยแพร่ยังตรวจสอบด้วยว่า entrypoint ของ Plugin ที่เผยแพร่แล้วและ
  metadata ของแพ็กเกจมีอยู่ใน layout ของรีจิสทรีที่ติดตั้งแล้ว Release ที่ส่ง payload runtime
  ของ Plugin ขาดหายจะ fail ตัวตรวจสอบ postpublish และไม่สามารถ promote เป็น `latest` ได้
- `pnpm test:install:smoke` ยังบังคับใช้งบประมาณ `unpackedSize` ของ npm pack บน
  tarball update ตัวเลือกด้วย เพื่อให้ installer e2e จับ pack bloat โดยไม่ได้ตั้งใจ
  ก่อนเส้นทางเผยแพร่ release
- หากงาน release แตะการวางแผน CI, manifest เวลา extension หรือ
  matrix การทดสอบ extension ให้สร้างใหม่และตรวจทาน output matrix
  `plugin-prerelease-extension-shard` ที่ planner เป็นเจ้าของจาก
  `.github/workflows/plugin-prerelease.yml` ก่อนอนุมัติ เพื่อไม่ให้ release notes
  อธิบาย layout CI ที่ล้าสมัย
- ความพร้อมของ release macOS แบบ stable ยังรวมถึงพื้นผิว updater:
  - GitHub release ต้องลงท้ายด้วย `.zip`, `.dmg` และ `.dSYM.zip` ที่แพ็กเกจแล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปยัง zip stable ใหม่หลังเผยแพร่; workflow
    เผยแพร่ macOS จะ commit ให้โดยอัตโนมัติ หรือเปิด PR appcast
    เมื่อ direct push ถูกบล็อก
  - แอปที่แพ็กเกจแล้วต้องคง bundle id แบบ non-debug, URL feed Sparkle ที่ไม่ว่าง
    และ `CFBundleVersion` ที่เท่ากับหรือสูงกว่า build floor ของ Sparkle ตาม canonical
    สำหรับเวอร์ชัน release นั้น

## กล่องทดสอบการเผยแพร่

`Full Release Validation` คือวิธีที่ผู้ปฏิบัติงานเริ่มการทดสอบก่อนเผยแพร่ทั้งหมดจาก
จุดเข้าใช้งานเดียว สำหรับหลักฐานคอมมิตที่ปักหมุดไว้บนแบรนช์ที่เคลื่อนไหวเร็ว ให้ใช้
ตัวช่วยเพื่อให้ทุกเวิร์กโฟลว์ลูกทำงานจากแบรนช์ชั่วคราวที่ตรึงไว้กับ SHA เป้าหมาย:

```bash
pnpm ci:full-release --sha <full-sha>
```

ตัวช่วยจะ push `release-ci/<sha>-...`, dispatch `Full Release Validation`
จากแบรนช์นั้นด้วย `ref=<sha>`, ตรวจสอบว่า `headSha` ของทุกเวิร์กโฟลว์ลูก
ตรงกับเป้าหมาย แล้วลบแบรนช์ชั่วคราว วิธีนี้หลีกเลี่ยงการพิสูจน์ child run ของ
`main` ที่ใหม่กว่าโดยไม่ตั้งใจ

สำหรับการตรวจสอบแบรนช์หรือแท็กเผยแพร่ ให้รันจาก ref เวิร์กโฟลว์ `main` ที่เชื่อถือได้
และส่งแบรนช์หรือแท็กเผยแพร่เป็น `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

เวิร์กโฟลว์จะแก้ target ref, dispatch `CI` แบบ manual ด้วย
`target_ref=<release-ref>` แล้ว dispatch `OpenClaw Release Checks`
`OpenClaw Release Checks` จะแตกงานออกเป็น install smoke, การตรวจสอบเผยแพร่ข้าม OS,
ความครอบคลุมเส้นทางเผยแพร่ Docker แบบ live/E2E เมื่อเปิดใช้ soak, Package Acceptance
พร้อม E2E แพ็กเกจ Telegram ตาม canonical, QA Lab parity, live Matrix และ live
Telegram การรัน full/all จะยอมรับได้ก็ต่อเมื่อสรุป `Full Release Validation`
แสดง `normal_ci`, `plugin_prerelease` และ `release_checks` ว่าสำเร็จ
เว้นแต่การรันซ้ำแบบมุ่งเน้นจะตั้งใจข้ามลูก `Plugin Prerelease` ที่แยกต่างหาก
ใช้ลูก `npm-telegram` แบบ standalone เฉพาะสำหรับการรันซ้ำแพ็กเกจที่เผยแพร่แล้วแบบมุ่งเน้น
ด้วย `release_package_spec` หรือ `npm_telegram_package_spec` เท่านั้น
สรุปตัวตรวจสอบสุดท้ายมีตารางงานที่ช้าที่สุดของแต่ละ child run เพื่อให้ release manager
เห็น critical path ปัจจุบันโดยไม่ต้องดาวน์โหลด logs
ดู [การตรวจสอบการเผยแพร่เต็มรูปแบบ](/th/reference/full-release-validation) สำหรับ
เมทริกซ์ stage ฉบับสมบูรณ์ ชื่องานเวิร์กโฟลว์ที่แน่นอน ความแตกต่างระหว่างโปรไฟล์ stable
กับ full, artifacts และ handle สำหรับการรันซ้ำแบบมุ่งเน้น
เวิร์กโฟลว์ลูกถูก dispatch จาก ref ที่เชื่อถือได้ซึ่งรัน `Full Release Validation`
โดยปกติคือ `--ref main` แม้ target `ref` จะชี้ไปยังแบรนช์หรือแท็กเผยแพร่ที่เก่ากว่า
ไม่มีอินพุต workflow-ref แยกต่างหากสำหรับ Full Release Validation ให้เลือก harness
ที่เชื่อถือได้ด้วยการเลือก ref ของ workflow run
อย่าใช้ `--ref main -f ref=<sha>` สำหรับหลักฐานคอมมิตที่แน่นอนบน `main` ที่เคลื่อนไหวอยู่
เพราะ raw commit SHA ไม่สามารถเป็น workflow dispatch ref ได้ ดังนั้นให้ใช้
`pnpm ci:full-release --sha <sha>` เพื่อสร้างแบรนช์ชั่วคราวที่ปักหมุดไว้

ใช้ `release_profile` เพื่อเลือกความกว้างของ live/provider:

- `minimum`: เส้นทาง live และ Docker สำหรับ OpenAI/core ที่สำคัญต่อการเผยแพร่และเร็วที่สุด
- `stable`: minimum รวมกับความครอบคลุม provider/backend ที่เสถียรสำหรับการอนุมัติการเผยแพร่
- `full`: stable รวมกับความครอบคลุม provider/media เชิงแนะนำที่กว้างขึ้น

การตรวจสอบ stable และ full จะรัน exhaustive live/E2E, เส้นทางเผยแพร่ Docker
และการกวาด upgrade-survivor สำหรับแพ็กเกจที่เผยแพร่แล้วแบบมีขอบเขตก่อนโปรโมตเสมอ
ใช้ `run_release_soak=true` เพื่อขอให้รันการกวาดเดียวกันนั้นสำหรับ beta การกวาดนี้ครอบคลุม
แพ็กเกจ stable ล่าสุดสี่รายการ รวมถึง baseline ที่ปักหมุดไว้ `2026.4.23` และ `2026.5.2`
รวมถึงความครอบคลุม `2026.4.15` ที่เก่ากว่า โดยลบ baseline ที่ซ้ำออกและแบ่ง shard
แต่ละ baseline ไปยังงาน Docker runner ของตัวเอง

`OpenClaw Release Checks` ใช้ ref เวิร์กโฟลว์ที่เชื่อถือได้เพื่อแก้ target
ref หนึ่งครั้งเป็น `release-package-under-test` และนำ artifact นั้นกลับมาใช้ใน cross-OS,
Package Acceptance และการตรวจสอบ Docker เส้นทางเผยแพร่เมื่อรัน soak วิธีนี้ทำให้
กล่องที่เกี่ยวข้องกับแพ็กเกจทั้งหมดใช้ bytes ชุดเดียวกันและหลีกเลี่ยงการ build แพ็กเกจซ้ำ
หลังจาก beta อยู่บน npm แล้ว ให้ตั้ง `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`
เพื่อให้ release checks ดาวน์โหลดแพ็กเกจที่เผยแพร่แล้วหนึ่งครั้ง แยก SHA ของ build source
จาก `dist/build-info.json` แล้วนำ artifact นั้นกลับมาใช้ใน cross-OS,
Package Acceptance, release-path Docker และ lane แพ็กเกจ Telegram
OpenAI install smoke แบบ cross-OS ใช้ `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อ
ตั้งค่าตัวแปร repo/org ไว้ มิฉะนั้นใช้ `openai/gpt-5.4` เพราะ lane นี้กำลังพิสูจน์
การติดตั้งแพ็กเกจ onboarding การเริ่ม Gateway และ live agent turn หนึ่งครั้ง
ไม่ใช่การ benchmark model ค่าเริ่มต้นที่ช้าที่สุด live provider matrix ที่กว้างกว่า
ยังคงเป็นที่สำหรับความครอบคลุมเฉพาะ model

ใช้ variant เหล่านี้ตาม stage การเผยแพร่:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
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
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

อย่าใช้ umbrella แบบเต็มเป็นการรันซ้ำครั้งแรกหลังการแก้แบบมุ่งเน้น หากกล่องหนึ่งล้มเหลว
ให้ใช้เวิร์กโฟลว์ลูก งาน Docker lane โปรไฟล์แพ็กเกจ model provider หรือ QA lane
ที่ล้มเหลวสำหรับหลักฐานครั้งถัดไป รัน umbrella แบบเต็มอีกครั้งเฉพาะเมื่อการแก้เปลี่ยน
orchestration การเผยแพร่ที่ใช้ร่วมกัน หรือทำให้หลักฐาน all-box ก่อนหน้าเก่าไปแล้ว
ตัวตรวจสอบสุดท้ายของ umbrella จะตรวจสอบ ids ของ child workflow run ที่บันทึกไว้อีกครั้ง
ดังนั้นหลังจากรันเวิร์กโฟลว์ลูกซ้ำจนสำเร็จ ให้รันซ้ำเฉพาะ parent job
`Verify full validation` ที่ล้มเหลว

สำหรับการกู้คืนแบบมีขอบเขต ให้ส่ง `rerun_group` ไปยัง umbrella `all` คือการรัน
release-candidate จริง, `ci` รันเฉพาะลูก CI ปกติ, `plugin-prerelease`
รันเฉพาะลูก Plugin สำหรับการเผยแพร่เท่านั้น, `release-checks` รันทุกกล่องเผยแพร่
และกลุ่มเผยแพร่ที่แคบกว่าคือ `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` และ `npm-telegram`
การรันซ้ำ `npm-telegram` แบบมุ่งเน้นต้องมี `release_package_spec` หรือ
`npm_telegram_package_spec`; การรัน full/all ใช้ E2E แพ็กเกจ Telegram ตาม canonical
ภายใน Package Acceptance การรันซ้ำ cross-OS แบบมุ่งเน้นสามารถเพิ่ม
`cross_os_suite_filter=windows/packaged-upgrade` หรือตัวกรอง OS/suite อื่นได้
ความล้มเหลวของ QA release-check จะบล็อกการตรวจสอบการเผยแพร่ปกติ รวมถึง
OpenClaw dynamic tool drift ที่จำเป็นใน tier มาตรฐาน การรัน Tideclaw alpha
ยังอาจถือว่า lane release-check ที่ไม่ใช่ package-safety เป็นเชิงแนะนำได้
เมื่อ `live_suite_filter` ขอ lane QA live ที่ gated อย่างชัดเจน เช่น Discord,
WhatsApp หรือ Slack ต้องเปิดใช้ตัวแปร repo `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`
ที่ตรงกัน มิฉะนั้น input capture จะล้มเหลวแทนที่จะข้าม lane อย่างเงียบ ๆ

### Vitest

กล่อง Vitest คือเวิร์กโฟลว์ลูก `CI` แบบ manual Manual CI ตั้งใจข้าม changed scoping
และบังคับใช้กราฟทดสอบปกติสำหรับ release candidate: Linux Node shards,
bundled-plugin shards, plugin และ channel contract shards, ความเข้ากันได้กับ Node 22,
`check-*`, `check-additional-*`, การตรวจสอบ smoke ของ built-artifact, การตรวจสอบ docs,
Python skills, Windows, macOS และ Control UI i18n Android จะรวมอยู่เมื่อ
`Full Release Validation` รันกล่องนี้ เพราะ umbrella ส่ง `include_android=true`;
CI แบบ manual standalone ต้องมี `include_android=true` สำหรับความครอบคลุม Android

ใช้กล่องนี้เพื่อตอบว่า "source tree ผ่านชุดทดสอบปกติเต็มรูปแบบหรือไม่?"
กล่องนี้ไม่เหมือนกับการตรวจสอบผลิตภัณฑ์บนเส้นทางเผยแพร่ หลักฐานที่ควรเก็บ:

- สรุป `Full Release Validation` ที่แสดง URL ของ run `CI` ที่ dispatch
- run `CI` เป็นสีเขียวบน SHA เป้าหมายที่แน่นอน
- ชื่อ shard ที่ล้มเหลวหรือช้าจากงาน CI เมื่อสืบสวน regression
- artifacts เวลาของ Vitest เช่น `.artifacts/vitest-shard-timings.json` เมื่อ
  run ต้องการการวิเคราะห์ประสิทธิภาพ

รัน CI แบบ manual โดยตรงเฉพาะเมื่อการเผยแพร่ต้องการ CI ปกติที่ deterministic แต่
ไม่ต้องการกล่อง Docker, QA Lab, live, cross-OS หรือ package ใช้คำสั่งแรก
สำหรับ CI โดยตรงที่ไม่ใช่ Android เพิ่ม `include_android=true` เมื่อ CI
release-candidate โดยตรงต้องครอบคลุม Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

กล่อง Docker อยู่ใน `OpenClaw Release Checks` ผ่าน
`openclaw-live-and-e2e-checks-reusable.yml` รวมถึงเวิร์กโฟลว์ `install-smoke`
โหมดเผยแพร่ กล่องนี้ตรวจสอบ release candidate ผ่านสภาพแวดล้อม Docker แบบ packaged
แทนที่จะเป็นเฉพาะการทดสอบระดับซอร์สเท่านั้น

ความครอบคลุม Docker สำหรับการเผยแพร่รวมถึง:

- install smoke แบบเต็มโดยเปิดใช้ Bun global install smoke ที่ช้า
- การเตรียม/นำ root Dockerfile smoke image กลับมาใช้ตาม target SHA โดยมีงาน smoke
  สำหรับ QR, root/gateway และ installer/Bun รันเป็น install-smoke shards แยกกัน
- lane E2E ของ repository
- ชุดย่อย Docker เส้นทางเผยแพร่: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` และ `plugins-runtime-install-h`
- ความครอบคลุม OpenWebUI ภายในชุดย่อย `plugins-runtime-services` เมื่อร้องขอ
- lane ติดตั้ง/ถอนการติดตั้ง bundled plugin แบบแยก
  `bundled-plugin-install-uninstall-0` ถึง
  `bundled-plugin-install-uninstall-23`
- provider suites แบบ live/E2E และความครอบคลุม Docker live model เมื่อ release checks
  รวม live suites

ใช้ artifacts ของ Docker ก่อนรันซ้ำ scheduler เส้นทางเผยแพร่จะอัปโหลด
`.artifacts/docker-tests/` พร้อม lane logs, `summary.json`, `failures.json`,
phase timings, scheduler plan JSON และคำสั่ง rerun สำหรับการกู้คืนแบบมุ่งเน้น
ให้ใช้ `docker_lanes=<lane[,lane]>` บนเวิร์กโฟลว์ live/E2E แบบ reusable แทนการรัน
ชุดย่อยการเผยแพร่ทั้งหมดซ้ำ คำสั่ง rerun ที่สร้างขึ้นจะรวม
`package_artifact_run_id` ก่อนหน้าและ input สำหรับ Docker image ที่เตรียมไว้เมื่อมี
เพื่อให้ lane ที่ล้มเหลวสามารถนำ tarball และ GHCR images เดิมกลับมาใช้ได้

### QA Lab

กล่อง QA Lab เป็นส่วนหนึ่งของ `OpenClaw Release Checks` เช่นกัน เป็น gate การเผยแพร่
ด้านพฤติกรรมเชิง agentic และระดับ channel แยกจาก mechanics ของแพ็กเกจใน Vitest และ Docker

ความครอบคลุม QA Lab สำหรับการเผยแพร่รวมถึง:

- lane mock parity ที่เปรียบเทียบ lane candidate ของ OpenAI กับ baseline Opus 4.6
  โดยใช้ agentic parity pack
- โปรไฟล์ QA live Matrix แบบเร็วโดยใช้ environment `qa-live-shared`
- lane QA live Telegram โดยใช้ Convex CI credential leases
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` หรือ
  `pnpm qa:observability:smoke` เมื่อ telemetry การเผยแพร่ต้องการหลักฐาน local
  ที่ชัดเจน

ใช้กล่องนี้เพื่อตอบว่า "การเผยแพร่ทำงานถูกต้องใน QA scenarios และ live channel flows
หรือไม่?" เก็บ URL artifacts สำหรับ lane parity, Matrix และ Telegram เมื่ออนุมัติ
การเผยแพร่ ความครอบคลุม Matrix แบบเต็มยังคงมีให้ใช้เป็นการรัน QA-Lab แบบ sharded
ด้วย manual แทนที่จะเป็น lane ที่สำคัญต่อการเผยแพร่ตามค่าเริ่มต้น

### Package

กล่อง Package คือ gate ของผลิตภัณฑ์ที่ติดตั้งได้ รองรับโดย
`Package Acceptance` และ resolver
`scripts/resolve-openclaw-package-candidate.mjs` resolver จะ normalize candidate
ให้เป็น tarball `package-under-test` ที่ Docker E2E ใช้ ตรวจสอบ inventory ของแพ็กเกจ
บันทึกเวอร์ชันแพ็กเกจและ SHA-256 และแยก ref ของ workflow harness ออกจาก ref
ของ package source

แหล่ง candidate ที่รองรับ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรีลีส OpenClaw ที่ระบุแน่นอน
- `source=ref`: แพ็ก branch, tag หรือ commit SHA แบบเต็มของ `package_ref` ที่เชื่อถือได้
  พร้อม harness `workflow_ref` ที่เลือก
- `source=url`: ดาวน์โหลด `.tgz` สาธารณะผ่าน HTTPS พร้อม `package_sha256` ที่จำเป็น;
  ข้อมูลรับรองใน URL, พอร์ต HTTPS ที่ไม่ใช่ค่าเริ่มต้น, ชื่อโฮสต์หรือที่อยู่ที่ resolve แล้วแบบส่วนตัว/ภายใน/ใช้งานพิเศษ
  และ redirect ที่ไม่ปลอดภัยจะถูกปฏิเสธ
- `source=trusted-url`: ดาวน์โหลด `.tgz` ผ่าน HTTPS พร้อม
  `package_sha256` และ `trusted_source_id` ที่จำเป็นจากนโยบายที่ระบุชื่อใน
  `.github/package-trusted-sources.json`; ใช้สิ่งนี้สำหรับ mirror ระดับองค์กรหรือที่เก็บแพ็กเกจส่วนตัว
  ที่ maintainer เป็นเจ้าของ แทนการเพิ่ม bypass เครือข่ายส่วนตัวระดับ input ให้กับ `source=url`
- `source=artifact`: ใช้ `.tgz` ที่อัปโหลดโดย GitHub Actions run อื่นซ้ำ

`OpenClaw Release Checks` เรียกใช้การยอมรับแพ็กเกจด้วย `source=artifact`, artifact แพ็กเกจรีลีส
ที่เตรียมไว้, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai` การยอมรับแพ็กเกจจะรักษา QA ของ migration, update,
การ restart อัปเดต auth ที่ตั้งค่าไว้, การติดตั้ง ClawHub skill แบบ live, การล้าง dependency ของ Plugin ที่ค้างเก่า, fixture Plugin แบบ offline,
การอัปเดต Plugin และแพ็กเกจ Telegram ให้ทดสอบกับ tarball ที่ resolve เดียวกัน การตรวจรีลีสที่บล็อกจะใช้ baseline แพ็กเกจที่เผยแพร่ล่าสุด
ตามค่าเริ่มต้น; โปรไฟล์ beta ที่มี `run_release_soak=true`, `release_profile=stable` หรือ
`release_profile=full` จะขยายไปยัง baseline ที่เผยแพร่บน npm แบบ stable ทุกตัวตั้งแต่
`2026.4.23` ถึง `latest` รวมถึง fixture ของปัญหาที่ถูกรายงาน ใช้
การยอมรับแพ็กเกจด้วย `source=npm` สำหรับ candidate ที่เผยแพร่แล้ว,
`source=ref` สำหรับ tarball npm ในเครื่องที่มี SHA รองรับก่อน publish,
`source=trusted-url` สำหรับ mirror ระดับองค์กร/ส่วนตัวที่ maintainer เป็นเจ้าของ หรือ
`source=artifact` สำหรับ tarball ที่เตรียมไว้ซึ่งอัปโหลดโดย GitHub Actions run อื่น
สิ่งนี้เป็นตัวแทนแบบเนทีฟของ GitHub
สำหรับ coverage ด้านแพ็กเกจ/update ส่วนใหญ่ที่ก่อนหน้านี้ต้องใช้
Parallels การตรวจรีลีสข้าม OS ยังสำคัญสำหรับพฤติกรรม onboarding,
installer และแพลตฟอร์มเฉพาะ OS แต่การตรวจสอบผลิตภัณฑ์ด้านแพ็กเกจ/update ควร
เลือกใช้การยอมรับแพ็กเกจ

เช็กลิสต์มาตรฐานสำหรับการตรวจสอบ update และ Plugin คือ
[การทดสอบ update และ Plugin](/th/help/testing-updates-plugins) ใช้สิ่งนี้เมื่อ
ตัดสินใจว่า lane แบบ local, Docker, การยอมรับแพ็กเกจ หรือ release-check ใดพิสูจน์
การติดตั้ง/อัปเดต Plugin, การล้างข้อมูลโดย doctor หรือการเปลี่ยนแปลง migration ของ published-package
การ migration แบบ update ที่เผยแพร่ทั้งหมดจากแพ็กเกจ stable `2026.4.23+` ทุกตัว
เป็น workflow `Update Migration` แบบ manual แยกต่างหาก ไม่ใช่ส่วนหนึ่งของ Full Release CI

ความผ่อนปรนของ package-acceptance แบบ legacy ถูกจำกัดเวลาโดยตั้งใจ แพ็กเกจจนถึง
`2026.4.25` อาจใช้ path compatibility สำหรับช่องว่าง metadata ที่เผยแพร่ไปยัง
npm แล้ว: รายการ inventory QA ส่วนตัวที่ขาดจาก tarball, ไม่มี
`gateway install --wrapper`, ไม่มีไฟล์ patch ใน git fixture ที่มาจาก tarball,
ไม่มี `update.channel` ที่ persist ไว้, ตำแหน่ง install-record ของ Plugin แบบ legacy,
ไม่มีการ persist install-record ของ marketplace และการ migration metadata ของ config
ระหว่าง `plugins update` แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือน
สำหรับไฟล์ stamp metadata ของ local build ที่เคยถูกส่งออกไปแล้ว แพ็กเกจถัดจากนั้น
ต้องตรงตามสัญญาแพ็กเกจสมัยใหม่; ช่องว่างเดียวกันเหล่านั้นจะทำให้การตรวจสอบรีลีสล้มเหลว

ใช้โปรไฟล์การยอมรับแพ็กเกจที่กว้างขึ้นเมื่อคำถามของรีลีสเกี่ยวกับ
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

- `smoke`: lane การติดตั้งแพ็กเกจ/channel/agent, เครือข่าย Gateway และการ reload config
  อย่างรวดเร็ว
- `package`: สัญญาแพ็กเกจด้าน install/update/restart/Plugin พร้อมหลักฐานการติดตั้ง
  ClawHub skill แบบ live; นี่คือค่าเริ่มต้นของ release-check
- `product`: `package` รวมกับช่องทาง MCP, การล้าง cron/subagent, การค้นหาเว็บ OpenAI
  และ OpenWebUI
- `full`: chunk ของ Docker release-path พร้อม OpenWebUI
- `custom`: รายการ `docker_lanes` ที่แน่นอนสำหรับการ rerun แบบเจาะจง

สำหรับหลักฐาน Telegram ของ package-candidate ให้เปิดใช้ `telegram_mode=mock-openai` หรือ
`telegram_mode=live-frontier` ในการยอมรับแพ็กเกจ workflow จะส่ง tarball
`package-under-test` ที่ resolve แล้วเข้าไปใน lane Telegram; workflow Telegram แบบ standalone
ยังยอมรับ spec npm ที่เผยแพร่แล้วสำหรับการตรวจหลัง publish

## ระบบอัตโนมัติสำหรับ publish รีลีสปกติ

สำหรับ beta, `latest`, Plugin, GitHub Release และการเผยแพร่แพลตฟอร์ม
`OpenClaw Release Publish` คือ entrypoint แบบแก้ไขสถานะตามปกติ เส้นทาง extended-stable แบบ npm-only รายเดือน
`.33+` ไม่ได้ใช้ orchestrator นี้ workflow ปกติ
orchestrate workflow trusted-publisher ตามลำดับที่รีลีสต้องใช้:

1. Check out tag รีลีสและ resolve commit SHA ของ tag นั้น
2. ตรวจสอบว่า tag เข้าถึงได้จาก `main` หรือ `release/*`
3. เรียกใช้ `pnpm plugins:sync:check`
4. Dispatch `Plugin NPM Release` ด้วย `publish_scope=all-publishable` และ
   `ref=<release-sha>`
5. Dispatch `Plugin ClawHub Release` ด้วย scope และ SHA เดียวกัน
6. Dispatch `OpenClaw NPM Release` ด้วย tag รีลีส, npm dist-tag และ
   `preflight_run_id` ที่บันทึกไว้ หลังตรวจสอบ
   `full_release_validation_run_id` ที่บันทึกไว้
7. สำหรับรีลีส stable ให้สร้างหรืออัปเดต GitHub release เป็น draft, dispatch
   `Windows Node Release` ด้วย `windows_node_tag` ที่ระบุชัดเจนและ
   `windows_node_installer_digests` ที่ candidate อนุมัติแล้ว และตรวจสอบ asset installer/checksum
   มาตรฐานก่อนเผยแพร่ draft

ตัวอย่างการ publish beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

การ publish stable ไปยัง beta dist-tag ค่าเริ่มต้น:

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

การ promote stable ไปยัง `latest` โดยตรงต้องระบุชัดเจน:

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
เฉพาะสำหรับงานซ่อมหรือ republish แบบเจาะจง `OpenClaw Release Publish` ปฏิเสธ
`plugin_publish_scope=selected` เมื่อ `publish_openclaw_npm=true` เพื่อให้แพ็กเกจ core
ไม่สามารถส่งออกโดยไม่มี Plugin ทางการทุกตัวที่ publish ได้ รวมถึง
`@openclaw/diffs-language-pack` สำหรับการซ่อม Plugin ที่เลือกไว้ ให้ตั้ง
`publish_openclaw_npm=false` พร้อม `plugin_publish_scope=selected` และ
`plugins=@openclaw/name` หรือ dispatch workflow ลูกโดยตรง

## input ของ workflow NPM

`OpenClaw NPM Release` ยอมรับ input ที่ operator ควบคุมได้เหล่านี้:

- `tag`: tag รีลีสที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1` หรือ
  `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` อาจเป็น commit SHA แบบเต็ม 40 อักขระ
  ปัจจุบันของ workflow-branch สำหรับ preflight เพื่อการตรวจสอบเท่านั้นได้ด้วย
- `preflight_only`: `true` สำหรับ validate/build/package เท่านั้น, `false` สำหรับ
  path publish จริง
- `preflight_run_id`: จำเป็นบน path publish จริง เพื่อให้ workflow ใช้
  tarball ที่เตรียมไว้จาก preflight run ที่สำเร็จซ้ำ
- `full_release_validation_run_id`: จำเป็นสำหรับการเผยแพร่ monthly extended-stable และ regular
  non-beta จริง เพื่อให้ workflow ยืนยันตัวตนของ validation run ที่แน่นอน
- `npm_dist_tag`: tag เป้าหมายของ npm สำหรับ path publish; ยอมรับ `alpha`, `beta`,
  `latest` หรือ `extended-stable` และมีค่าเริ่มต้นเป็น `beta` patch สุดท้าย `33` ขึ้นไปต้อง
  ใช้ `extended-stable`; โดยค่าเริ่มต้น `extended-stable` จะปฏิเสธ patch ก่อนหน้า และจะปฏิเสธ
  tag ที่ไม่ใช่ final เสมอ
- `bypass_extended_stable_guard`: boolean สำหรับการทดสอบเท่านั้น ค่าเริ่มต้น `false`; เมื่อใช้
  `npm_dist_tag=extended-stable` จะ bypass eligibility ของ monthly extended-stable ขณะยังคงรักษา
  identity ของรีลีส, artifact, approval และ readback check

`OpenClaw Release Publish` ยอมรับ input ที่ operator ควบคุมได้เหล่านี้:

- `tag`: tag รีลีสที่จำเป็น; ต้องมีอยู่แล้ว
- `preflight_run_id`: run id ของ preflight `OpenClaw NPM Release` ที่สำเร็จ;
  จำเป็นเมื่อ `publish_openclaw_npm=true`
- `full_release_validation_run_id`: run id ของ `Full Release Validation` ที่สำเร็จ;
  จำเป็นเมื่อ `publish_openclaw_npm=true`
- `windows_node_tag`: tag รีลีส `openclaw/openclaw-windows-node` แบบ non-prerelease
  ที่แน่นอน; จำเป็นสำหรับการ publish OpenClaw stable
- `windows_node_installer_digests`: map JSON แบบกะทัดรัดที่ candidate อนุมัติแล้วของ
  ชื่อ installer Windows ปัจจุบันไปยัง digest `sha256:` ที่ pin ไว้; จำเป็น
  สำหรับการ publish OpenClaw stable
- `npm_dist_tag`: tag เป้าหมายของ npm สำหรับแพ็กเกจ OpenClaw
- `plugin_publish_scope`: ค่าเริ่มต้นคือ `all-publishable`; ใช้ `selected` เฉพาะ
  สำหรับงานซ่อมแบบ plugin-only ที่เจาะจงพร้อม `publish_openclaw_npm=false`
- `plugins`: ชื่อแพ็กเกจ `@openclaw/*` คั่นด้วย comma เมื่อ
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: ค่าเริ่มต้นคือ `true`; ตั้งเป็น `false` เฉพาะเมื่อใช้
  workflow เป็น orchestrator ซ่อมแบบ plugin-only
- `wait_for_clawhub`: ค่าเริ่มต้นคือ `false` เพื่อให้ความพร้อมใช้งานของ npm ไม่ถูกบล็อกโดย
  sidecar ของ ClawHub; ตั้งเป็น `true` เฉพาะเมื่อการเสร็จสิ้นของ workflow ต้องรวม
  การเสร็จสิ้นของ ClawHub

`OpenClaw Release Checks` ยอมรับ input ที่ operator ควบคุมได้เหล่านี้:

- `ref`: branch, tag หรือ commit SHA แบบเต็มที่จะตรวจสอบ การตรวจที่มี secret
  ต้องให้ commit ที่ resolve แล้วเข้าถึงได้จาก branch หรือ
  tag รีลีสของ OpenClaw
- `run_release_soak`: เลือกใช้ live/E2E แบบ exhaustive, Docker release-path และ
  soak all-since upgrade-survivor สำหรับการตรวจรีลีส beta สิ่งนี้ถูกบังคับเปิดโดย
  `release_profile=stable` และ `release_profile=full`

กฎ:

- เวอร์ชัน final และ correction ปกติที่ต่ำกว่า patch `33` อาจ publish ไปยัง
  `beta` หรือ `latest` ได้ เวอร์ชัน final ที่ patch `33` หรือสูงกว่าต้อง publish ไปยัง
  `extended-stable` และเวอร์ชันที่มี suffix แบบ correction ที่ขอบเขตนั้นจะถูกปฏิเสธ
- tag beta prerelease อาจ publish ได้เฉพาะไปยัง `beta`
- สำหรับ `OpenClaw NPM Release` อนุญาตให้ใช้ input commit SHA แบบเต็มเฉพาะเมื่อ
  `preflight_only=true`
- `OpenClaw Release Checks` และ `Full Release Validation` เป็น
  validation-only เสมอ
- path publish จริงต้องใช้ `npm_dist_tag` เดียวกับที่ใช้ระหว่าง preflight;
  workflow จะตรวจสอบว่า metadata นั้นยังคงต่อเนื่องก่อน publish

## ลำดับรีลีส beta/latest stable ปกติ

ลำดับ legacy นี้มีไว้สำหรับรีลีสแบบ orchestrated ปกติที่เป็นเจ้าของ
Plugin, GitHub Release, Windows และงานแพลตฟอร์มอื่นด้วย ไม่ใช่
path extended-stable แบบ npm-only รายเดือน `.33+` ที่บันทึกไว้ด้านบนของหน้านี้

เมื่อ cut รีลีส stable แบบ orchestrated ปกติ:

1. เรียกใช้ `OpenClaw NPM Release` พร้อม `preflight_only=true`
   - ก่อนมีแท็ก คุณอาจใช้ SHA ของคอมมิตปัจจุบันเต็มรูปแบบจาก workflow branch
     สำหรับการ dry run แบบตรวจสอบเท่านั้นของ preflight workflow
2. เลือก `npm_dist_tag=beta` สำหรับโฟลว์ beta-first ปกติ หรือ `latest` เฉพาะ
   เมื่อคุณตั้งใจต้องการเผยแพร่ stable โดยตรง
3. เรียกใช้ `Full Release Validation` บน release branch, release tag หรือ
   commit SHA แบบเต็ม เมื่อคุณต้องการ CI ปกติพร้อมความครอบคลุมของ live prompt cache, Docker, QA Lab,
   Matrix และ Telegram จาก manual workflow เดียว
4. หากคุณตั้งใจต้องการเฉพาะกราฟการทดสอบปกติที่กำหนดแน่นอน ให้เรียกใช้
   manual `CI` workflow บน release ref แทน
5. เลือก release tag แบบ non-prerelease ที่ตรงของ `openclaw/openclaw-windows-node`
   ซึ่ง installer x64 และ ARM64 ที่ลงนามแล้วควรถูกเผยแพร่ บันทึกเป็น
   `windows_node_tag` และบันทึกแผนที่ digest ที่ตรวจสอบแล้วของ installer เหล่านั้นเป็น
   `windows_node_installer_digests` ตัวช่วย release-candidate จะบันทึกทั้งสองค่า
   และรวมไว้ในคำสั่ง publish ที่สร้างขึ้น
6. บันทึก `preflight_run_id` และ `full_release_validation_run_id` ที่สำเร็จ
7. เรียกใช้ `OpenClaw Release Publish` ด้วย `tag` เดิม, `npm_dist_tag` เดิม,
   `windows_node_tag` ที่เลือก, `windows_node_installer_digests` ที่บันทึกไว้,
   `preflight_run_id` ที่บันทึกไว้ และ `full_release_validation_run_id` ที่บันทึกไว้;
   workflow นี้จะเผยแพร่ Plugin ที่แยกออกมาภายนอกไปยัง npm และ ClawHub ก่อนเลื่อนสถานะ
   แพ็กเกจ npm ของ OpenClaw
8. หาก release ถูกลงที่ `beta` ให้ใช้
   workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   เพื่อเลื่อนเวอร์ชัน stable นั้นจาก `beta` เป็น `latest`
9. หาก release ตั้งใจเผยแพร่โดยตรงไปยัง `latest` และ `beta`
   ควรตาม build stable เดียวกันทันที ให้ใช้ release workflow เดียวกันนั้น
   เพื่อชี้ dist-tag ทั้งสองไปยังเวอร์ชัน stable หรือปล่อยให้การซิงก์ self-healing
   ตามกำหนดเวลาของ workflow ย้าย `beta` ในภายหลัง

การเปลี่ยน dist-tag อยู่ใน repo บัญชีแยกประเภทของ release เพราะยังต้องใช้
`NPM_TOKEN` ขณะที่ repo ต้นทางยังคงใช้การ publish แบบ OIDC-only

วิธีนี้ทำให้ทั้งเส้นทาง publish โดยตรงและเส้นทางโปรโมตแบบ beta-first
ถูกบันทึกไว้ในเอกสารและผู้ปฏิบัติงานมองเห็นได้

หาก maintainer ต้องย้อนกลับไปใช้การยืนยันตัวตน npm ภายในเครื่อง ให้เรียกใช้คำสั่ง
1Password CLI (`op`) ใด ๆ เฉพาะภายในเซสชัน tmux ที่แยกไว้เท่านั้น อย่าเรียก `op`
โดยตรงจาก shell หลักของ agent; การเก็บไว้ใน tmux ทำให้ prompts,
alerts และการจัดการ OTP สังเกตได้ และป้องกันการแจ้งเตือน host ซ้ำ

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

Maintainer ใช้เอกสาร release ส่วนตัวใน
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
สำหรับ runbook จริง

## ที่เกี่ยวข้อง

- [ช่องทาง release](/th/install/development-channels)
