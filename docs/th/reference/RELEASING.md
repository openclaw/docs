---
read_when:
    - กำลังมองหาคำจำกัดความของช่องทางการเผยแพร่สาธารณะ
    - กำลังมองหาการตั้งชื่อเวอร์ชันและรอบการเผยแพร่
summary: ช่องทางการเผยแพร่สาธารณะ การตั้งชื่อเวอร์ชัน และรอบการเผยแพร่
title: นโยบายการเผยแพร่
x-i18n:
    generated_at: "2026-04-26T11:40:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ac0ca7d9c6a6ce011e8adda54e1e49beab30456c0dc2bffaec6acec41094df
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw มีช่องทางการเผยแพร่สาธารณะ 3 แบบ:

- stable: รีลีสที่ติดแท็กซึ่งเผยแพร่ไปยัง npm `beta` เป็นค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อมีการระบุอย่างชัดเจน
- beta: แท็ก prerelease ที่เผยแพร่ไปยัง npm `beta`
- dev: หัวล่าสุดที่เคลื่อนไหวอยู่ของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันรีลีส stable: `YYYY.M.D`
  - Git tag: `vYYYY.M.D`
- เวอร์ชันรีลีสแก้ไข stable: `YYYY.M.D-N`
  - Git tag: `vYYYY.M.D-N`
- เวอร์ชัน beta prerelease: `YYYY.M.D-beta.N`
  - Git tag: `vYYYY.M.D-beta.N`
- ห้ามเติมศูนย์นำหน้าที่เดือนหรือวัน
- `latest` หมายถึงรีลีส stable บน npm ที่ถูกเลื่อนสถานะขึ้นเป็นปัจจุบัน
- `beta` หมายถึงเป้าหมายการติดตั้ง beta ปัจจุบัน
- รีลีส stable และรีลีสแก้ไข stable จะเผยแพร่ไปยัง npm `beta` เป็นค่าเริ่มต้น; ผู้ปฏิบัติการรีลีสสามารถกำหนดเป้าหมายเป็น `latest` อย่างชัดเจน หรือเลื่อนสถานะบิลด์ beta ที่ผ่านการตรวจสอบแล้วในภายหลัง
- ทุกรีลีส stable ของ OpenClaw จะจัดส่งแพ็กเกจ npm และแอป macOS พร้อมกัน;
  โดยปกติรีลีส beta จะตรวจสอบและเผยแพร่เส้นทาง npm/package ก่อน โดย
  การ build/sign/notarize แอป mac จะสงวนไว้สำหรับ stable เว้นแต่จะมีการร้องขออย่างชัดเจน

## รอบการเผยแพร่

- รีลีสจะไปแบบ beta-first
- stable จะตามมาหลังจาก beta ล่าสุดผ่านการตรวจสอบแล้วเท่านั้น
- โดยปกติผู้ดูแลจะตัดรีลีสจาก branch `release/YYYY.M.D` ที่สร้าง
  จาก `main` ปัจจุบัน เพื่อให้การตรวจสอบรีลีสและการแก้ไขไม่ไปขวางการพัฒนาใหม่
  บน `main`
- หากมีการ push หรือ publish แท็ก beta ไปแล้วและต้องแก้ไข ผู้ดูแลจะตัด
  แท็ก `-beta.N` ถัดไปแทนการลบหรือสร้างแท็ก beta เดิมใหม่
- ขั้นตอนรีลีสโดยละเอียด การอนุมัติ ข้อมูลรับรอง และหมายเหตุการกู้คืน
  มีไว้สำหรับผู้ดูแลเท่านั้น

## การตรวจสอบก่อนรีลีส

- รัน `pnpm check:test-types` ก่อนการตรวจสอบก่อนรีลีส เพื่อให้ TypeScript ของเทสต์
  ยังคงถูกครอบคลุมนอกเหนือจากเกต `pnpm check` ในเครื่องที่เร็วกว่า
- รัน `pnpm check:architecture` ก่อนการตรวจสอบก่อนรีลีส เพื่อให้การตรวจสอบวงจร import
  และขอบเขตสถาปัตยกรรมในภาพกว้างผ่านนอกเหนือจากเกตในเครื่องที่เร็วกว่า
- รัน `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้มี
  อาร์ติแฟกต์รีลีส `dist/*` และบันเดิล Control UI ตามที่คาดหวังสำหรับขั้นตอน
  ตรวจสอบความถูกต้องของ pack
- รัน `pnpm qa:otel:smoke` เมื่อกำลังตรวจสอบ telemetry ของรีลีส มันจะทดสอบ
  QA-lab ผ่านตัวรับ OTLP/HTTP ภายในเครื่องและตรวจสอบชื่อ trace span ที่ส่งออก
  แอตทริบิวต์แบบมีขอบเขต และการปกปิดข้อมูล/ตัวระบุ โดยไม่ต้องใช้
  Opik, Langfuse หรือ collector ภายนอกอื่น
- รัน `pnpm release:check` ก่อนทุกรีลีสที่ติดแท็ก
- ตอนนี้การตรวจสอบรีลีสรันใน workflow แบบ manual แยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรันเกต parity แบบ mock ของ QA Lab พร้อม lane QA
  แบบสดของ Matrix และ Telegram ก่อนอนุมัติรีลีส โดย lane แบบสดใช้
  environment `qa-live-shared`; Telegram ยังใช้การเช่าข้อมูลรับรอง Convex CI ด้วย
- การตรวจสอบรันไทม์การติดตั้งและอัปเกรดข้าม OS จะถูก dispatch จาก
  workflow ผู้เรียกแบบ private
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  ซึ่งเรียกใช้ reusable workflow แบบ public
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- การแยกนี้ตั้งใจทำไว้: ให้เส้นทางรีลีส npm จริงสั้น
  กำหนดแน่นอน และมุ่งที่อาร์ติแฟกต์ ขณะที่การตรวจสอบสดที่ช้ากว่ายังคงอยู่ใน
  lane ของตัวเอง เพื่อไม่ให้ทำให้การ publish ช้าหรือถูกบล็อก
- การตรวจสอบรีลีสต้องถูก dispatch จาก workflow ref ของ `main` หรือจาก
  workflow ref ของ `release/YYYY.M.D` เพื่อให้ตรรกะ workflow และ secrets ยังอยู่ในการควบคุม
- workflow นั้นรับได้ทั้ง release tag ที่มีอยู่แล้ว หรือ commit SHA 40 ตัวอักษรเต็ม
  ของ workflow branch ปัจจุบัน
- ในโหมด commit-SHA จะยอมรับเฉพาะ HEAD ปัจจุบันของ workflow branch เท่านั้น; ใช้
  release tag สำหรับ commit รีลีสที่เก่ากว่า
- preflight แบบ validation-only ของ `OpenClaw NPM Release` ก็ยอมรับ
  commit SHA 40 ตัวอักษรเต็มของ workflow branch ปัจจุบันโดยไม่ต้องมีแท็กที่ถูก push แล้ว
- เส้นทาง SHA นี้มีไว้เพื่อการตรวจสอบเท่านั้นและไม่สามารถเลื่อนสถานะเป็นการ publish จริงได้
- ในโหมด SHA workflow จะสังเคราะห์ `v<package.json version>` เฉพาะสำหรับ
  การตรวจสอบ metadata ของ package; การ publish จริงยังคงต้องใช้ release tag จริง
- ทั้งสอง workflow คงเส้นทาง publish และ promotion จริงไว้บน
  GitHub-hosted runners ขณะที่เส้นทางตรวจสอบแบบไม่เปลี่ยนแปลงข้อมูลสามารถใช้
  Blacksmith Linux runners ที่ใหญ่กว่าได้
- workflow นั้นรัน
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ workflow secrets ทั้ง `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- preflight ของ npm release จะไม่รอ lane การตรวจสอบรีลีสแยกอีกต่อไป
- รัน `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือแท็ก beta/แก้ไขที่ตรงกัน) ก่อนการอนุมัติ
- หลังจาก publish ไปยัง npm แล้ว ให้รัน
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (หรือเวอร์ชัน beta/แก้ไขที่ตรงกัน) เพื่อตรวจสอบเส้นทางติดตั้งจาก registry
  ที่เผยแพร่แล้วใน temp prefix ใหม่
- หลังจาก publish beta แล้ว ให้รัน `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  เพื่อตรวจสอบ onboarding ของแพ็กเกจที่ติดตั้งแล้ว การตั้งค่า Telegram และ Telegram E2E จริง
  กับแพ็กเกจ npm ที่เผยแพร่แล้ว โดยใช้พูลข้อมูลรับรอง Telegram แบบเช่าร่วมกัน
  การทดสอบเฉพาะกิจในเครื่องของผู้ดูแลอาจละเว้นตัวแปร Convex และส่งข้อมูลรับรอง env
  `OPENCLAW_QA_TELEGRAM_*` ทั้งสามตัวโดยตรงแทน
- ผู้ดูแลสามารถรันการตรวจสอบหลังเผยแพร่แบบเดียวกันจาก GitHub Actions ได้ผ่าน
  workflow แบบ manual `NPM Telegram Beta E2E` ซึ่งตั้งใจให้เป็น manual-only และ
  จะไม่รันทุกครั้งที่มีการ merge
- ตอนนี้ระบบอัตโนมัติรีลีสของผู้ดูแลใช้รูปแบบ preflight-then-promote:
  - การ publish npm จริงต้องผ่าน `preflight_run_id` ของ npm ที่สำเร็จ
  - การ publish npm จริงต้องถูก dispatch จาก branch `main` หรือ
    `release/YYYY.M.D` เดียวกับที่ใช้รัน preflight ที่สำเร็จ
  - รีลีส npm แบบ stable จะใช้ `beta` เป็นค่าเริ่มต้น
  - การ publish npm แบบ stable สามารถกำหนดเป้าหมาย `latest` ได้อย่างชัดเจนผ่าน workflow input
  - การเปลี่ยน npm dist-tag แบบใช้ token ตอนนี้อยู่ใน
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    ด้วยเหตุผลด้านความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่
    repo สาธารณะคงการ publish แบบ OIDC-only
  - `macOS Release` แบบ public มีไว้เพื่อตรวจสอบเท่านั้น
  - เส้นทาง publish mac แบบ private จริงต้องผ่าน private mac
    `preflight_run_id` และ `validate_run_id` ที่สำเร็จ
  - เส้นทาง publish จริงจะเลื่อนสถานะอาร์ติแฟกต์ที่เตรียมไว้ แทนการ build ใหม่อีกครั้ง
- สำหรับรีลีสแก้ไข stable เช่น `YYYY.M.D-N` ตัวตรวจสอบหลังเผยแพร่
  ยังตรวจสอบเส้นทางอัปเกรด temp-prefix เดียวกันจาก `YYYY.M.D` ไปเป็น `YYYY.M.D-N`
  ด้วย เพื่อไม่ให้รีลีสแก้ไขทิ้งให้การติดตั้งแบบ global ที่เก่ากว่า
  ยังชี้ไปที่ payload stable ฐานโดยไม่รู้ตัว
- preflight ของ npm release จะล้มเหลวแบบปิดเสมอ เว้นแต่ tarball จะมีทั้ง
  `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่าง
  เพื่อไม่ให้เราจัดส่งแดชบอร์ดเบราว์เซอร์ว่างเปล่าอีก
- การตรวจสอบหลังเผยแพร่ยังตรวจสอบด้วยว่าการติดตั้งจาก registry ที่เผยแพร่แล้ว
  มี bundled plugin runtime deps ที่ไม่ว่างอยู่ภายใต้ layout ราก `dist/*`
  รีลีสที่จัดส่งโดยมี payload dependency ของ bundled plugin
  หายไปหรือว่างเปล่าจะไม่ผ่านตัวตรวจสอบ postpublish และไม่สามารถเลื่อนสถานะ
  ไปเป็น `latest` ได้
- `pnpm test:install:smoke` ยังบังคับใช้งบ `unpackedSize` ของ npm pack กับ
  tarball อัปเดตตัวเลือกด้วย เพื่อให้ installer e2e จับ pack ที่พองเกินโดยไม่ตั้งใจ
  ได้ก่อนเข้าสู่เส้นทาง publish ของรีลีส
- หากงานรีลีสแตะการวางแผน CI, manifest เวลาของ extension หรือ matrix ทดสอบของ extension
  ให้ regenerate และตรวจทานผลลัพธ์ matrix ของ workflow `checks-node-extensions`
  ที่ planner เป็นเจ้าของจาก `.github/workflows/ci.yml`
  ก่อนอนุมัติ เพื่อไม่ให้บันทึกประจำรุ่นอธิบาย layout CI ที่ล้าสมัย
- ความพร้อมของรีลีส macOS แบบ stable ยังรวมถึงพื้นผิว updater:
  - GitHub release ต้องลงท้ายด้วย `.zip`, `.dmg` และ `.dSYM.zip` ที่ถูกแพ็กแล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปยัง zip stable ใหม่หลังการ publish
  - แอปที่ถูกแพ็กต้องคง bundle id ที่ไม่ใช่ debug, URL ของ Sparkle feed ที่ไม่ว่าง
    และ `CFBundleVersion` ที่มากกว่าหรือเท่ากับค่า build floor ของ Sparkle แบบ canonical
    สำหรับเวอร์ชันรีลีสนั้น

## อินพุตของ NPM workflow

`OpenClaw NPM Release` รับอินพุตที่ผู้ปฏิบัติการควบคุมได้ดังนี้:

- `tag`: release tag ที่ต้องระบุ เช่น `v2026.4.2`, `v2026.4.2-1` หรือ
  `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` ก็อาจเป็น commit SHA เต็ม 40 ตัวอักษร
  ของ workflow branch ปัจจุบันสำหรับ preflight แบบ validation-only ได้
- `preflight_only`: `true` สำหรับ validation/build/package เท่านั้น, `false` สำหรับ
  เส้นทาง publish จริง
- `preflight_run_id`: ต้องระบุบนเส้นทาง publish จริง เพื่อให้ workflow ใช้ tarball
  ที่เตรียมจาก preflight run ที่สำเร็จซ้ำ
- `npm_dist_tag`: npm target tag สำหรับเส้นทาง publish; ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Checks` รับอินพุตที่ผู้ปฏิบัติการควบคุมได้ดังนี้:

- `ref`: release tag ที่มีอยู่แล้ว หรือ commit SHA 40 ตัวอักษรเต็มของ `main`
  ปัจจุบันที่จะตรวจสอบเมื่อ dispatch จาก `main`; หากมาจาก release branch ให้ใช้
  release tag ที่มีอยู่แล้ว หรือ commit SHA 40 ตัวอักษรเต็มของ release branch ปัจจุบัน

กฎ:

- แท็ก stable และแท็กแก้ไขสามารถ publish ไปยัง `beta` หรือ `latest` ก็ได้
- แท็ก beta prerelease สามารถ publish ไปยัง `beta` ได้เท่านั้น
- สำหรับ `OpenClaw NPM Release` อินพุตเป็น commit SHA เต็มอนุญาตได้เฉพาะเมื่อ
  `preflight_only=true`
- `OpenClaw Release Checks` มีไว้เพื่อตรวจสอบเท่านั้นเสมอ และยอมรับ
  commit SHA ของ workflow branch ปัจจุบันได้ด้วย
- โหมด commit-SHA ของ release checks ยังต้องเป็น HEAD ปัจจุบันของ workflow branch ด้วย
- เส้นทาง publish จริงต้องใช้ `npm_dist_tag` เดียวกับที่ใช้ระหว่าง preflight;
  workflow จะตรวจสอบ metadata นั้นก่อนที่การ publish จะดำเนินต่อ

## ลำดับรีลีส npm แบบ stable

เมื่อตัดรีลีส npm แบบ stable:

1. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนที่จะมีแท็ก คุณอาจใช้ commit SHA เต็มของ workflow branch ปัจจุบัน
     เพื่อทำ dry run แบบ validation-only ของ workflow preflight
2. เลือก `npm_dist_tag=beta` สำหรับโฟลว์ beta-first ตามปกติ หรือ `latest` เฉพาะ
   เมื่อคุณตั้งใจจะ publish stable โดยตรง
3. รัน `OpenClaw Release Checks` แยกต่างหากด้วยแท็กเดียวกัน หรือ
   commit SHA เต็มของ workflow branch ปัจจุบันเดียวกัน เมื่อคุณต้องการ coverage ของ
   prompt cache แบบสด, parity ของ QA Lab, Matrix และ Telegram
   - การแยกนี้ทำไว้โดยตั้งใจ เพื่อให้ coverage แบบสดยังใช้งานได้โดยไม่ต้อง
     ผูกการตรวจสอบที่ใช้เวลานานหรือไม่นิ่งกลับเข้ากับ workflow publish
4. บันทึก `preflight_run_id` ที่สำเร็จไว้
5. รัน `OpenClaw NPM Release` อีกครั้งด้วย `preflight_only=false`, `tag`
   เดิม, `npm_dist_tag` เดิม และ `preflight_run_id` ที่บันทึกไว้
6. หากรีลีสลงที่ `beta` ให้ใช้ workflow แบบ private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   เพื่อเลื่อนสถานะเวอร์ชัน stable นั้นจาก `beta` ไปเป็น `latest`
7. หากรีลีสถูก publish โดยตรงไปยัง `latest` โดยตั้งใจ และต้องการให้ `beta`
   ตามบิลด์ stable เดียวกันทันที ให้ใช้ workflow แบบ private เดิมนั้น
   เพื่อชี้ dist-tag ทั้งสองไปยังเวอร์ชัน stable หรือปล่อยให้ scheduled
   self-healing sync ของมันย้าย `beta` ในภายหลัง

การเปลี่ยน dist-tag อยู่ใน repo แบบ private ด้วยเหตุผลด้านความปลอดภัย เพราะยัง
ต้องใช้ `NPM_TOKEN` ขณะที่ repo สาธารณะคงการ publish แบบ OIDC-only

สิ่งนี้ทำให้ทั้งเส้นทาง publish โดยตรงและเส้นทางเลื่อนสถานะแบบ beta-first
มีเอกสารและมองเห็นได้สำหรับผู้ปฏิบัติการ

หากผู้ดูแลจำเป็นต้อง fallback ไปใช้การยืนยันตัวตน npm แบบ local ให้รันคำสั่ง
1Password CLI (`op`) ใด ๆ ภายใน tmux session เฉพาะเท่านั้น อย่าเรียก `op`
โดยตรงจากเชลล์หลักของเอเจนต์; การเก็บไว้ภายใน tmux ทำให้ prompt,
การแจ้งเตือน และการจัดการ OTP มองเห็นได้ และป้องกันการแจ้งเตือนบนโฮสต์ซ้ำ ๆ

## ข้อมูลอ้างอิงสาธารณะ

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

ผู้ดูแลใช้เอกสารรีลีสแบบ private ใน
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
เป็นคู่มือปฏิบัติจริง

## ที่เกี่ยวข้อง

- [ช่องทางการเผยแพร่](/th/install/development-channels)
