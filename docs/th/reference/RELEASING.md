---
read_when:
    - กำลังมองหาคำจำกัดความของช่องทางการปล่อยรุ่นสาธารณะ
    - กำลังมองหาการตั้งชื่อเวอร์ชันและรอบการปล่อยรุ่น
summary: ช่องทางการปล่อยรุ่นสาธารณะ การตั้งชื่อเวอร์ชัน และรอบการปล่อยรุ่น
title: นโยบายการปล่อยรุ่น
x-i18n:
    generated_at: "2026-04-23T10:23:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: b31a9597d656ef33633e6aa1c1019287f7197bebff1e6b11d572e41c149c7cff
    source_path: reference/RELEASING.md
    workflow: 15
---

# นโยบายการปล่อยรุ่น

OpenClaw มี 3 เส้นทางการปล่อยรุ่นสู่สาธารณะ:

- stable: รุ่นที่ติดแท็กแล้วซึ่งเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อมีการร้องขออย่างชัดเจน
- beta: แท็ก prerelease ที่เผยแพร่ไปยัง npm `beta`
- dev: ส่วนหัวที่เคลื่อนไหวของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันการปล่อยรุ่น stable: `YYYY.M.D`
  - Git tag: `vYYYY.M.D`
- เวอร์ชันการปล่อยรุ่นแก้ไข stable: `YYYY.M.D-N`
  - Git tag: `vYYYY.M.D-N`
- เวอร์ชัน Beta prerelease: `YYYY.M.D-beta.N`
  - Git tag: `vYYYY.M.D-beta.N`
- อย่าเติมเลขศูนย์นำหน้าเดือนหรือวัน
- `latest` หมายถึงรุ่น stable ของ npm ปัจจุบันที่ได้รับการโปรโมตแล้ว
- `beta` หมายถึงเป้าหมายการติดตั้ง beta ปัจจุบัน
- รุ่น stable และรุ่นแก้ไข stable จะเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น; ผู้ปฏิบัติการปล่อยรุ่นสามารถกำหนดเป้าหมาย `latest` อย่างชัดเจนได้ หรือโปรโมตบิลด์ beta ที่ผ่านการตรวจสอบแล้วในภายหลัง
- ทุกการปล่อยรุ่น stable ของ OpenClaw จะจัดส่งแพ็กเกจ npm และแอป macOS ร่วมกัน;
  โดยปกติรุ่น beta จะตรวจสอบและเผยแพร่เส้นทาง npm/package ก่อน โดยการ
  build/sign/notarize แอป mac จะสงวนไว้สำหรับ stable เว้นแต่จะมีการร้องขออย่างชัดเจน

## รอบการปล่อยรุ่น

- การปล่อยรุ่นจะไปแบบ beta-first
- stable จะตามมาเฉพาะหลังจากตรวจสอบ beta ล่าสุดแล้ว
- โดยปกติผู้ดูแลจะตัดรุ่นจากสาขา `release/YYYY.M.D` ที่สร้าง
  จาก `main` ปัจจุบัน เพื่อให้การตรวจสอบและการแก้ไขสำหรับ release ไม่ไปขัดขวาง
  การพัฒนาใหม่บน `main`
- หากมีการ push หรือเผยแพร่ beta tag ไปแล้วและต้องการการแก้ไข ผู้ดูแลจะตัด
  แท็ก `-beta.N` ถัดไปแทนการลบหรือสร้าง beta tag เดิมใหม่
- ขั้นตอนการปล่อยรุ่นโดยละเอียด การอนุมัติ credentials และหมายเหตุการกู้คืน
  มีไว้สำหรับผู้ดูแลเท่านั้น

## การตรวจสอบก่อนปล่อยรุ่น

- รัน `pnpm check:test-types` ก่อน release preflight เพื่อให้ test TypeScript ยังคง
  ได้รับความครอบคลุมนอกเหนือจากเกต `pnpm check` ในเครื่องที่เร็วกว่า
- รัน `pnpm check:architecture` ก่อน release preflight เพื่อให้ import
  cycle และ architecture boundary checks ที่กว้างกว่ายังคงผ่านนอกเหนือจาก local gate ที่เร็วกว่า
- รัน `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้
  มี release artifacts `dist/*` ที่คาดไว้และ Control UI bundle สำหรับขั้นตอน
  ตรวจสอบ pack
- รัน `pnpm release:check` ก่อนทุก tagged release
- ตอนนี้ release checks จะรันใน workflow แบบ manual แยก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรัน QA Lab mock parity gate พร้อมทั้ง live
  Matrix และ Telegram QA lanes ก่อนการอนุมัติ release โดย live lanes ใช้
  environment `qa-live-shared`; Telegram ยังใช้ Convex CI credential leases ด้วย
- การตรวจสอบ runtime สำหรับการติดตั้งและอัปเกรดข้ามระบบปฏิบัติการจะถูก dispatch จาก
  private caller workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  ซึ่งเรียก reusable public workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- การแยกนี้เป็นไปโดยตั้งใจ: เพื่อให้เส้นทาง npm release จริงสั้น,
  กำหนดแน่นอน และโฟกัสที่ artifacts ขณะที่ live checks ที่ช้ากว่าจะอยู่ใน
  lane ของตัวเองเพื่อไม่ให้ทำให้การ publish ชะงักหรือติดขัด
- Release checks ต้องถูก dispatch จาก workflow ref ของ `main` หรือจาก
  workflow ref ของ `release/YYYY.M.D` เพื่อให้ตรรกะของ workflow และ secrets
  ยังคงถูกควบคุม
- workflow นั้นรับได้ทั้ง release tag ที่มีอยู่แล้ว หรือ commit SHA แบบเต็ม 40 ตัวอักษร
  ของ workflow branch ปัจจุบัน
- ในโหมด commit-SHA มันยอมรับเฉพาะ HEAD ปัจจุบันของ workflow branch เท่านั้น; ใช้
  release tag สำหรับ release commits ที่เก่ากว่า
- preflight แบบ validation-only ของ `OpenClaw NPM Release` ยังรับ commit SHA แบบเต็ม 40 ตัวอักษร
  ของ workflow branch ปัจจุบันได้โดยไม่ต้องมี pushed tag
- เส้นทาง SHA นั้นเป็นแบบ validation-only และไม่สามารถโปรโมตเป็นการ publish จริงได้
- ในโหมด SHA workflow จะสังเคราะห์ `v<package.json version>` เฉพาะสำหรับ
  การตรวจสอบ metadata ของแพ็กเกจ; การ publish จริงยังคงต้องใช้ release tag จริง
- ทั้งสอง workflows คงเส้นทาง publish และ promotion จริงไว้บน GitHub-hosted
  runners ขณะที่เส้นทาง validation ที่ไม่ก่อการเปลี่ยนแปลงสามารถใช้
  Blacksmith Linux runners ที่ใหญ่กว่าได้
- workflow นั้นจะรัน
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ทั้ง workflow secrets `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- npm release preflight ไม่รอ lane release checks แยกอีกต่อไป
- รัน `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือแท็ก beta/correction ที่ตรงกัน) ก่อนอนุมัติ
- หลังจาก npm publish แล้ว ให้รัน
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (หรือเวอร์ชัน beta/correction ที่ตรงกัน) เพื่อตรวจสอบเส้นทางติดตั้งจาก registry ที่เผยแพร่แล้ว
  ใน temp prefix ใหม่
- ตอนนี้ระบบอัตโนมัติสำหรับ maintainer release ใช้แบบ preflight-then-promote:
  - npm publish จริงต้องผ่าน npm `preflight_run_id` ที่สำเร็จ
  - npm publish จริงต้องถูก dispatch จากสาขา `main` หรือ
    `release/YYYY.M.D` เดียวกันกับ preflight run ที่สำเร็จ
  - npm releases แบบ stable ใช้ค่าเริ่มต้นเป็น `beta`
  - npm publish แบบ stable สามารถกำหนดเป้าหมาย `latest` ได้อย่างชัดเจนผ่าน workflow input
  - การเปลี่ยน npm dist-tag แบบใช้ token ตอนนี้อยู่ใน
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    ด้วยเหตุผลด้านความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่
    public repo คงการ publish แบบ OIDC-only
  - `macOS Release` สาธารณะเป็นแบบ validation-only
  - การ publish mac จริงแบบ private ต้องผ่าน private mac
    `preflight_run_id` และ `validate_run_id` ที่สำเร็จ
  - เส้นทาง publish จริงจะโปรโมต artifacts ที่เตรียมไว้แล้วแทนการ build
    ใหม่อีกครั้ง
- สำหรับรุ่นแก้ไข stable เช่น `YYYY.M.D-N`, post-publish verifier
  จะตรวจสอบเส้นทางอัปเกรด temp-prefix เดียวกันจาก `YYYY.M.D` ไปยัง `YYYY.M.D-N`
  ด้วย เพื่อให้ release corrections ไม่ทิ้งการติดตั้งแบบ global รุ่นเก่า
  ไว้บน payload stable ฐานโดยไม่ถูกสังเกต
- npm release preflight จะ fail closed เว้นแต่ tarball จะมีทั้ง
  `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่าง
  เพื่อไม่ให้เราจัดส่ง browser dashboard เปล่าอีกครั้ง
- การตรวจสอบหลังเผยแพร่ยังตรวจสอบด้วยว่า installation จาก registry ที่เผยแพร่แล้ว
  มี bundled plugin runtime deps ที่ไม่ว่างภายใต้เลย์เอาต์ root `dist/*`
  การปล่อยรุ่นที่มี payload ของ bundled plugin
  dependency ที่ขาดหายหรือว่างเปล่าจะทำให้ postpublish verifier ล้มเหลว และไม่สามารถโปรโมต
  ไปยัง `latest` ได้
- `pnpm test:install:smoke` ยังบังคับใช้งบ `unpackedSize` ของ npm pack กับ
  candidate update tarball ด้วย ดังนั้น installer e2e จะตรวจจับ pack bloat ที่เกิดขึ้นโดยไม่ตั้งใจ
  ก่อนถึงเส้นทาง release publish
- หากงาน release ไปแตะ CI planning, extension timing manifests หรือ
  extension test matrices ให้ regenerate และตรวจทานผลลัพธ์ workflow matrix
  `checks-node-extensions` ซึ่งเป็นของ planner จาก `.github/workflows/ci.yml`
  ก่อนอนุมัติ เพื่อไม่ให้ release notes อธิบายเลย์เอาต์ CI ที่ล้าสมัย
- ความพร้อมสำหรับ stable macOS release ยังรวมถึงพื้นผิว updater:
  - GitHub release ต้องมี `.zip`, `.dmg` และ `.dSYM.zip` ที่แพ็กเกจแล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปที่ stable zip ใหม่หลัง publish
  - แอปที่แพ็กเกจแล้วต้องคง bundle id ที่ไม่ใช่แบบดีบัก, Sparkle feed
    URL ที่ไม่ว่าง และ `CFBundleVersion` ที่เท่ากับหรือสูงกว่า canonical Sparkle build floor
    สำหรับเวอร์ชัน release นั้น

## อินพุตของ NPM workflow

`OpenClaw NPM Release` รับอินพุตที่ผู้ปฏิบัติการควบคุมได้ดังนี้:

- `tag`: release tag ที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1` หรือ
  `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` มันอาจเป็น commit SHA แบบเต็ม 40 ตัวอักษร
  ของ workflow branch ปัจจุบันสำหรับ validation-only preflight ได้ด้วย
- `preflight_only`: `true` สำหรับ validation/build/package เท่านั้น, `false` สำหรับ
  เส้นทาง publish จริง
- `preflight_run_id`: จำเป็นบนเส้นทาง publish จริง เพื่อให้ workflow นำ
  tarball ที่เตรียมไว้จาก preflight run ที่สำเร็จกลับมาใช้
- `npm_dist_tag`: npm target tag สำหรับเส้นทาง publish; ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Checks` รับอินพุตที่ผู้ปฏิบัติการควบคุมได้ดังนี้:

- `ref`: release tag ที่มีอยู่แล้ว หรือ `main` commit SHA แบบเต็ม 40 ตัวอักษรปัจจุบัน
  ที่จะใช้ตรวจสอบเมื่อ dispatch จาก `main`; หากมาจาก release branch ให้ใช้
  release tag ที่มีอยู่แล้ว หรือ release-branch commit SHA แบบเต็ม 40 ตัวอักษรปัจจุบัน

กฎ:

- แท็ก stable และ correction สามารถเผยแพร่ไปยัง `beta` หรือ `latest` ก็ได้
- แท็ก beta prerelease สามารถเผยแพร่ไปยัง `beta` เท่านั้น
- สำหรับ `OpenClaw NPM Release` อนุญาตให้ป้อน full commit SHA ได้เฉพาะเมื่อ
  `preflight_only=true`
- `OpenClaw Release Checks` เป็น validation-only เสมอ และยังรับ
  workflow-branch commit SHA ปัจจุบันได้ด้วย
- โหมด commit-SHA ของ release checks ยังต้องใช้ HEAD ปัจจุบันของ workflow branch ด้วย
- เส้นทาง publish จริงต้องใช้ `npm_dist_tag` เดียวกันกับที่ใช้ระหว่าง preflight;
  workflow จะตรวจสอบ metadata นั้นก่อนดำเนินการ publish ต่อ

## ลำดับการปล่อย stable npm

เมื่อตัด stable npm release:

1. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนที่จะมีแท็ก คุณอาจใช้ commit SHA แบบเต็มของ workflow branch ปัจจุบัน
     สำหรับ dry run แบบ validation-only ของ preflight workflow ได้
2. เลือก `npm_dist_tag=beta` สำหรับ flow beta-first ปกติ หรือ `latest` เฉพาะ
   เมื่อคุณตั้งใจจะ publish stable โดยตรง
3. รัน `OpenClaw Release Checks` แยกต่างหากด้วยแท็กเดียวกันหรือ
   full current workflow-branch commit SHA เดียวกัน เมื่อคุณต้องการความครอบคลุมของ live prompt cache,
   QA Lab parity, Matrix และ Telegram
   - การแยกนี้ตั้งใจทำไว้ เพื่อให้ live coverage ยังคงพร้อมใช้โดยไม่ต้อง
     ผูก checks ที่ใช้เวลานานหรือไม่เสถียรกลับเข้ากับ publish workflow
4. บันทึก `preflight_run_id` ที่สำเร็จ
5. รัน `OpenClaw NPM Release` อีกครั้งด้วย `preflight_only=false`, ใช้
   `tag` เดิม, `npm_dist_tag` เดิม และ `preflight_run_id` ที่บันทึกไว้
6. หาก release ไปลงที่ `beta` ให้ใช้ private
   workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   เพื่อโปรโมต stable version นั้นจาก `beta` ไปเป็น `latest`
7. หาก release ถูก publish ไปยัง `latest` โดยตรงโดยตั้งใจ และ `beta`
   ควรตาม stable build เดียวกันทันที ให้ใช้ private workflow เดียวกันนั้น
   เพื่อให้ทั้งสอง dist-tags ชี้ไปยัง stable version หรือปล่อยให้ scheduled
   self-healing sync ของมันย้าย `beta` ในภายหลัง

การเปลี่ยน dist-tag อยู่ใน private repo ด้วยเหตุผลด้านความปลอดภัย เพราะยังคง
ต้องใช้ `NPM_TOKEN` ขณะที่ public repo คงการ publish แบบ OIDC-only

สิ่งนี้ทำให้ทั้งเส้นทาง publish โดยตรงและเส้นทางโปรโมตแบบ beta-first
มีเอกสารประกอบและมองเห็นได้สำหรับผู้ปฏิบัติการ

## แหล่งอ้างอิงสาธารณะ

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

ผู้ดูแลจะใช้เอกสาร release แบบ private ใน
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
เป็น runbook จริงสำหรับการปฏิบัติงาน
