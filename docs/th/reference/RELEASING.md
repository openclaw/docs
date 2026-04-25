---
read_when:
    - กำลังมองหาคำจำกัดความของช่องทางการเผยแพร่สาธารณะ
    - กำลังมองหาการตั้งชื่อเวอร์ชันและรอบการออกเวอร์ชัน
summary: ช่องทางการเผยแพร่สาธารณะ การตั้งชื่อเวอร์ชัน และรอบการออกเวอร์ชัน
title: นโยบายการเผยแพร่ പുറത്തിറങ്ങി
x-i18n:
    generated_at: "2026-04-25T13:58:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc20f30345cbc6c0897e63c9f6a554f9c25be0b52df3efc7d2bbd8827891984a
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw มีช่องทางการเผยแพร่สาธารณะ 3 ช่องทาง:

- stable: รีลีสที่ติดแท็กซึ่งเผยแพร่ไปยัง npm `beta` โดยค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อมีการร้องขออย่างชัดเจน
- beta: แท็ก prerelease ที่เผยแพร่ไปยัง npm `beta`
- dev: ส่วนหัวที่เคลื่อนไหวของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชัน stable release: `YYYY.M.D`
  - Git tag: `vYYYY.M.D`
- เวอร์ชัน stable correction release: `YYYY.M.D-N`
  - Git tag: `vYYYY.M.D-N`
- เวอร์ชัน beta prerelease: `YYYY.M.D-beta.N`
  - Git tag: `vYYYY.M.D-beta.N`
- ห้ามเติมเลขศูนย์นำหน้าเดือนหรือวัน
- `latest` หมายถึงรีลีส stable ปัจจุบันบน npm ที่ถูกโปรโมตแล้ว
- `beta` หมายถึงเป้าหมายการติดตั้ง beta ปัจจุบัน
- รีลีส stable และ stable correction จะเผยแพร่ไปยัง npm `beta` โดยค่าเริ่มต้น; ผู้ปฏิบัติงานรีลีสสามารถกำหนดเป้าหมายเป็น `latest` อย่างชัดเจน หรือโปรโมตบิลด์ beta ที่ผ่านการตรวจสอบแล้วในภายหลัง
- ทุกรีลีส stable ของ OpenClaw จะส่งแพ็กเกจ npm และแอป macOS พร้อมกัน;
  โดยปกติรีลีส beta จะตรวจสอบและเผยแพร่เส้นทาง npm/package ก่อน ส่วนการ build/sign/notarize แอป mac จะสงวนไว้สำหรับ stable เว้นแต่จะมีการร้องขออย่างชัดเจน

## รอบการออกเวอร์ชัน

- รีลีสจะเริ่มจาก beta ก่อน
- stable จะตามมาเมื่อ beta ล่าสุดผ่านการตรวจสอบแล้วเท่านั้น
- โดยปกติผู้ดูแลจะตัดรีลีสจากสาขา `release/YYYY.M.D` ที่สร้าง
  จาก `main` ปัจจุบัน เพื่อให้การตรวจสอบและการแก้ไขรีลีสไม่ขัดขวางการพัฒนาใหม่บน `main`
- หากมีการ push หรือ publish แท็ก beta แล้วและต้องการแก้ไข ผู้ดูแลจะตัด
  แท็ก `-beta.N` ถัดไปแทนการลบหรือสร้างแท็ก beta เดิมใหม่
- ขั้นตอนรีลีสแบบละเอียด การอนุมัติ ข้อมูลรับรอง และหมายเหตุการกู้คืน
  เป็นข้อมูลสำหรับผู้ดูแลเท่านั้น

## การตรวจสอบล่วงหน้าก่อนรีลีส

- รัน `pnpm check:test-types` ก่อนการตรวจสอบล่วงหน้าก่อนรีลีส เพื่อให้ TypeScript ฝั่งทดสอบยังคงถูกครอบคลุมนอกเหนือจาก gate `pnpm check` ในเครื่องที่เร็วกว่า
- รัน `pnpm check:architecture` ก่อนการตรวจสอบล่วงหน้าก่อนรีลีส เพื่อให้การตรวจสอบ import cycle และขอบเขตสถาปัตยกรรมที่กว้างขึ้นเป็นสีเขียวนอกเหนือจาก local gate ที่เร็วกว่า
- รัน `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้มีอาร์ติแฟกต์รีลีส `dist/*` และ bundle ของ Control UI ตามที่คาดไว้สำหรับขั้นตอนตรวจสอบ pack
- รัน `pnpm release:check` ก่อนทุก tagged release
- ตอนนี้การตรวจสอบรีลีสรันใน workflow แบบ manual แยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรัน QA Lab mock parity gate พร้อม live
  Matrix และ Telegram QA lanes ก่อนอนุมัติรีลีส โดย live lanes ใช้
  environment `qa-live-shared`; Telegram ยังใช้ Convex CI credential leases
- การตรวจสอบรันไทม์การติดตั้งและอัปเกรดข้ามระบบปฏิบัติการถูก dispatch จาก
  private caller workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  ซึ่งเรียกใช้ reusable public workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- การแยกนี้เป็นไปโดยตั้งใจ: เพื่อให้เส้นทาง npm release จริงสั้น
  เป็น deterministic และเน้นที่อาร์ติแฟกต์ ขณะที่ live checks ที่ช้ากว่ายังอยู่ใน
  lane ของตนเองเพื่อไม่ให้ทำให้การ publish ชะงักหรือถูกบล็อก
- release checks ต้องถูก dispatch จาก workflow ref ของ `main` หรือจาก
  workflow ref ของ `release/YYYY.M.D` เพื่อให้ตรรกะและ secrets ของ workflow ยังคงอยู่ภายใต้การควบคุม
- workflow นั้นยอมรับได้ทั้ง existing release tag หรือ full 40-character workflow-branch commit SHA ปัจจุบัน
- ในโหมด commit-SHA จะยอมรับเฉพาะ HEAD ปัจจุบันของ workflow branch; ใช้
  release tag สำหรับ release commits ที่เก่ากว่า
- การตรวจสอบล่วงหน้าแบบ validation-only ของ `OpenClaw NPM Release` ก็ยอมรับ
  full 40-character workflow-branch commit SHA ปัจจุบันได้เช่นกันโดยไม่ต้องมีแท็กที่ถูก push
- เส้นทาง SHA นั้นใช้สำหรับ validation เท่านั้น และไม่สามารถโปรโมตไปเป็นการ publish จริงได้
- ในโหมด SHA workflow จะสังเคราะห์ `v<package.json version>` เฉพาะสำหรับการตรวจสอบ metadata ของแพ็กเกจ; การ publish จริงยังต้องใช้ release tag จริง
- ทั้งสอง workflow ยังคงให้เส้นทาง publish และ promotion จริงอยู่บน GitHub-hosted
  runners ขณะที่เส้นทาง validation แบบไม่เปลี่ยนแปลงข้อมูลสามารถใช้
  Blacksmith Linux runners ที่ใหญ่กว่าได้
- workflow นั้นรัน
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ workflow secrets ทั้ง `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- การตรวจสอบล่วงหน้าของ npm release จะไม่รอ release checks lane แยกอีกต่อไป
- รัน `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือแท็ก beta/correction ที่ตรงกัน) ก่อนการอนุมัติ
- หลังจาก publish npm แล้ว ให้รัน
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (หรือเวอร์ชัน beta/correction ที่ตรงกัน) เพื่อตรวจสอบเส้นทางการติดตั้งจาก registry ที่เผยแพร่แล้วใน temp prefix ใหม่
- หลังจาก publish beta แล้ว ให้รัน `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  เพื่อตรวจสอบ onboarding ของ installed-package, การตั้งค่า Telegram และ Telegram E2E จริง
  กับแพ็กเกจ npm ที่เผยแพร่แล้ว โดยใช้ shared leased Telegram credential
  pool การรันเฉพาะกิจในเครื่องของผู้ดูแลอาจไม่ต้องใส่ Convex vars และส่ง env credentials ทั้งสามตัว
  `OPENCLAW_QA_TELEGRAM_*` โดยตรงแทน
- ผู้ดูแลสามารถรันการตรวจสอบหลังเผยแพร่แบบเดียวกันจาก GitHub Actions ผ่าน
  workflow แบบ manual `NPM Telegram Beta E2E` ได้ โดยตั้งใจให้เป็น manual-only และไม่รันในทุก merge
- ตอนนี้ระบบอัตโนมัติรีลีสของผู้ดูแลใช้รูปแบบ preflight-then-promote:
  - การ publish npm จริงต้องผ่าน npm `preflight_run_id` ที่สำเร็จ
  - การ publish npm จริงต้องถูก dispatch จากสาขา `main` หรือ
    `release/YYYY.M.D` เดียวกันกับ successful preflight run
  - npm releases แบบ stable ใช้ค่าเริ่มต้นเป็น `beta`
  - stable npm publish สามารถกำหนดเป้าหมาย `latest` อย่างชัดเจนผ่าน workflow input
  - การแก้ไข npm dist-tag แบบใช้ token ตอนนี้อยู่ใน
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    เพื่อความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่
    public repo ยังคงใช้ OIDC-only publish
  - public `macOS Release` ใช้สำหรับ validation เท่านั้น
  - private mac publish จริงต้องผ่าน private mac
    `preflight_run_id` และ `validate_run_id` ที่สำเร็จ
  - เส้นทาง publish จริงจะโปรโมตอาร์ติแฟกต์ที่เตรียมไว้แล้วแทนการ build
    ใหม่อีกครั้ง
- สำหรับ stable correction releases เช่น `YYYY.M.D-N` ตัวตรวจสอบหลังเผยแพร่
  จะตรวจสอบเส้นทางอัปเกรด temp-prefix เดียวกันจาก `YYYY.M.D` ไป `YYYY.M.D-N` ด้วย
  เพื่อให้ release corrections ไม่ทิ้งการติดตั้ง global เก่าไว้บน payload stable พื้นฐานโดยไม่มีการแจ้งเตือน
- การตรวจสอบล่วงหน้าของ npm release จะล้มเหลวแบบ fail closed เว้นแต่ tarball จะมีทั้ง
  `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่าง
  เพื่อไม่ให้เราส่ง browser dashboard ที่ว่างเปล่าอีก
- การตรวจสอบหลังเผยแพร่ยังตรวจสอบด้วยว่าการติดตั้งจาก registry ที่เผยแพร่แล้ว
  มี bundled plugin runtime deps ที่ไม่ว่างภายใต้ layout ราก `dist/*`
  รีลีสที่มี payload dependency ของ bundled plugin หายไปหรือว่างเปล่าจะไม่ผ่านตัวตรวจสอบหลังเผยแพร่ และไม่สามารถโปรโมต
  ไปยัง `latest` ได้
- `pnpm test:install:smoke` ยังบังคับใช้งบประมาณ `unpackedSize` ของ npm pack บน
  candidate update tarball ด้วย ดังนั้น installer e2e จะจับ pack bloat ที่เกิดขึ้นโดยไม่ตั้งใจได้ก่อนเส้นทาง publish ของรีลีส
- หากงานรีลีสแตะต้อง CI planning, extension timing manifests หรือ
  extension test matrices ให้ regenerate และตรวจสอบ
  workflow matrix outputs `checks-node-extensions` ที่ planner เป็นเจ้าของจาก `.github/workflows/ci.yml`
  ก่อนการอนุมัติ เพื่อไม่ให้ release notes อธิบาย layout CI ที่ล้าสมัย
- ความพร้อมของ stable macOS release ยังรวมถึง updater surfaces:
  - GitHub release ต้องลงท้ายด้วย `.zip`, `.dmg` และ `.dSYM.zip` ที่แพ็กแล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปยัง stable zip ใหม่หลังการ publish
  - แอปที่แพ็กแล้วต้องคง bundle id ที่ไม่ใช่ debug, Sparkle feed
    URL ที่ไม่ว่าง และ `CFBundleVersion` ที่มากกว่าหรือเท่ากับ canonical Sparkle build floor
    สำหรับเวอร์ชันรีลีสนั้น

## อินพุตของ NPM workflow

`OpenClaw NPM Release` ยอมรับอินพุตที่ผู้ปฏิบัติงานควบคุมได้ดังนี้:

- `tag`: release tag ที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1` หรือ
  `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` ก็อาจเป็น current
  full 40-character workflow-branch commit SHA สำหรับ validation-only preflight ได้
- `preflight_only`: `true` สำหรับ validation/build/package เท่านั้น, `false` สำหรับ
  เส้นทาง publish จริง
- `preflight_run_id`: จำเป็นในเส้นทาง publish จริง เพื่อให้ workflow นำ tarball ที่เตรียมไว้กลับมาใช้จาก preflight run ที่สำเร็จ
- `npm_dist_tag`: npm target tag สำหรับเส้นทาง publish; ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Checks` ยอมรับอินพุตที่ผู้ปฏิบัติงานควบคุมได้ดังนี้:

- `ref`: existing release tag หรือ full 40-character `main` commit
  SHA ปัจจุบันที่จะตรวจสอบเมื่อ dispatch จาก `main`; หากมาจาก release branch ให้ใช้ existing release tag หรือ full 40-character release-branch commit
  SHA ปัจจุบัน

กฎ:

- แท็ก stable และ correction สามารถ publish ไปยัง `beta` หรือ `latest` ก็ได้
- แท็ก beta prerelease สามารถ publish ไปยัง `beta` ได้เท่านั้น
- สำหรับ `OpenClaw NPM Release` อินพุต full commit SHA อนุญาตได้เฉพาะเมื่อ
  `preflight_only=true`
- `OpenClaw Release Checks` ใช้สำหรับ validation เท่านั้นเสมอ และยังยอมรับ
  current workflow-branch commit SHA ได้ด้วย
- release checks ในโหมด commit-SHA ยังต้องใช้ current workflow-branch HEAD ด้วย
- เส้นทาง publish จริงต้องใช้ `npm_dist_tag` เดียวกันกับที่ใช้ระหว่าง preflight;
  workflow จะตรวจสอบ metadata นั้นก่อนดำเนินการ publish ต่อ

## ลำดับ stable npm release

เมื่อตัด stable npm release:

1. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนที่จะมีแท็ก คุณอาจใช้ full workflow-branch commit
     SHA ปัจจุบันสำหรับ dry run แบบ validation-only ของ preflight workflow ได้
2. เลือก `npm_dist_tag=beta` สำหรับ flow แบบ beta-first ปกติ หรือ `latest` เฉพาะ
   เมื่อคุณตั้งใจต้องการ direct stable publish
3. รัน `OpenClaw Release Checks` แยกต่างหากด้วยแท็กเดียวกันหรือ
   full current workflow-branch commit SHA เมื่อคุณต้องการ live prompt cache,
   QA Lab parity, Matrix และ Telegram coverage
   - แยกแบบนี้โดยตั้งใจเพื่อให้ live coverage ยังใช้งานได้โดยไม่กลับไปผูก checks ที่ใช้เวลานานหรือไม่เสถียรเข้ากับ publish workflow
4. บันทึก `preflight_run_id` ที่สำเร็จ
5. รัน `OpenClaw NPM Release` อีกครั้งด้วย `preflight_only=false`, `tag` เดิม,
   `npm_dist_tag` เดิม และ `preflight_run_id` ที่บันทึกไว้
6. หากรีลีสลงที่ `beta` ให้ใช้ private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow เพื่อโปรโมตเวอร์ชัน stable นั้นจาก `beta` ไปยัง `latest`
7. หากรีลีสถูก publish ตรงไปยัง `latest` โดยตั้งใจ และ `beta`
   ควรตาม stable build เดียวกันทันที ให้ใช้ private workflow เดิมนั้น
   เพื่อชี้ dist-tags ทั้งสองไปยังเวอร์ชัน stable หรือปล่อยให้ scheduled
   self-healing sync ของมันย้าย `beta` ภายหลัง

การแก้ไข dist-tag อยู่ใน private repo เพื่อความปลอดภัย เพราะยัง
ต้องใช้ `NPM_TOKEN` ขณะที่ public repo ยังคงใช้ OIDC-only publish

สิ่งนี้ทำให้ทั้งเส้นทาง direct publish และเส้นทาง promotion แบบ beta-first
มีเอกสารกำกับและมองเห็นได้สำหรับผู้ปฏิบัติงาน

หากผู้ดูแลจำเป็นต้อง fallback ไปใช้การยืนยันตัวตน npm ในเครื่อง ให้รันคำสั่ง 1Password
CLI (`op`) ใด ๆ ภายใน tmux session ที่แยกเฉพาะเท่านั้น อย่าเรียก `op`
โดยตรงจาก main agent shell; การเก็บไว้ภายใน tmux ช่วยให้มองเห็น prompts,
alerts และการจัดการ OTP ได้ และป้องกันการแจ้งเตือนบนโฮสต์ซ้ำ ๆ

## เอกสารอ้างอิงสาธารณะ

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

ผู้ดูแลใช้เอกสารรีลีสแบบ private ใน
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
เป็น runbook สำหรับการปฏิบัติงานจริง

## ที่เกี่ยวข้อง

- [ช่องทางการเผยแพร่](/th/install/development-channels)
