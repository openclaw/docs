---
read_when:
    - กำลังค้นหาข้อกำหนดช่องทางการเผยแพร่สาธารณะ
    - การเรียกใช้การตรวจสอบความถูกต้องของรุ่นเผยแพร่หรือการยอมรับแพ็กเกจ
    - กำลังค้นหารูปแบบการตั้งชื่อเวอร์ชันและรอบการเผยแพร่
summary: ช่องทางการเผยแพร่ รายการตรวจสอบสำหรับผู้ปฏิบัติงาน กล่องตรวจสอบความถูกต้อง การตั้งชื่อเวอร์ชัน และรอบการดำเนินงาน
title: นโยบายการเผยแพร่
x-i18n:
    generated_at: "2026-04-30T10:14:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54dc9ad7918ac95ec535a0404bbcbc04461a2b977151db0c2039b91e7e69c15c
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw มีช่องทางการเผยแพร่สาธารณะสามช่องทาง:

- stable: รุ่นเผยแพร่ที่ติดแท็กซึ่งเผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น หรือไปยัง npm `latest` เมื่อมีการร้องขออย่างชัดเจน
- beta: แท็กก่อนเผยแพร่ที่เผยแพร่ไปยัง npm `beta`
- dev: หัวปัจจุบันที่เคลื่อนไปของ `main`

## การตั้งชื่อเวอร์ชัน

- เวอร์ชันรุ่นเผยแพร่ stable: `YYYY.M.D`
  - แท็ก Git: `vYYYY.M.D`
- เวอร์ชันรุ่นแก้ไข stable: `YYYY.M.D-N`
  - แท็ก Git: `vYYYY.M.D-N`
- เวอร์ชันก่อนเผยแพร่ beta: `YYYY.M.D-beta.N`
  - แท็ก Git: `vYYYY.M.D-beta.N`
- อย่าเติมศูนย์นำหน้าเดือนหรือวัน
- `latest` หมายถึงรุ่นเผยแพร่ npm stable ที่โปรโมตอยู่ในปัจจุบัน
- `beta` หมายถึงเป้าหมายการติดตั้ง beta ปัจจุบัน
- รุ่นเผยแพร่ stable และรุ่นแก้ไข stable เผยแพร่ไปยัง npm `beta` ตามค่าเริ่มต้น; ผู้ดำเนินการเผยแพร่สามารถกำหนดเป้าหมายเป็น `latest` อย่างชัดเจน หรือโปรโมตบิลด์ beta ที่ตรวจสอบแล้วภายหลัง
- รุ่นเผยแพร่ stable ของ OpenClaw ทุกครั้งจะจัดส่งแพ็กเกจ npm และแอป macOS พร้อมกัน;
  รุ่นเผยแพร่ beta โดยปกติจะตรวจสอบและเผยแพร่เส้นทาง npm/แพ็กเกจก่อน โดยสงวน
  การบิลด์/ลงนาม/รับรองแอป Mac ไว้สำหรับ stable เว้นแต่มีการร้องขออย่างชัดเจน

## รอบการเผยแพร่

- การเผยแพร่จะเดินหน้าแบบ beta ก่อน
- stable จะตามมาหลังจาก beta ล่าสุดได้รับการตรวจสอบแล้วเท่านั้น
- โดยปกติผู้ดูแลจะตัดรุ่นจากสาขา `release/YYYY.M.D` ที่สร้าง
  จาก `main` ปัจจุบัน เพื่อให้การตรวจสอบและการแก้ไขรุ่นเผยแพร่ไม่บล็อกการพัฒนา
  ใหม่บน `main`
- หากแท็ก beta ถูกพุชหรือเผยแพร่แล้วและต้องแก้ไข ผู้ดูแลจะตัด
  แท็ก `-beta.N` ถัดไปแทนการลบหรือสร้างแท็ก beta เดิมใหม่
- ขั้นตอนการเผยแพร่โดยละเอียด การอนุมัติ ข้อมูลประจำตัว และบันทึกการกู้คืน
  สงวนไว้สำหรับผู้ดูแลเท่านั้น

## รายการตรวจสอบสำหรับผู้ดำเนินการเผยแพร่

รายการตรวจสอบนี้เป็นรูปแบบสาธารณะของโฟลว์การเผยแพร่ ข้อมูลประจำตัวส่วนตัว,
การลงนาม, การรับรอง, การกู้คืน dist-tag และรายละเอียดการย้อนกลับฉุกเฉินจะอยู่ใน
คู่มือดำเนินการเผยแพร่สำหรับผู้ดูแลเท่านั้น

1. เริ่มจาก `main` ปัจจุบัน: ดึงล่าสุด, ยืนยันว่า commit เป้าหมายถูกพุชแล้ว,
   และยืนยันว่า CI ของ `main` ปัจจุบันเขียวเพียงพอสำหรับการสร้างสาขาจากจุดนั้น
2. เขียนส่วนบนสุดของ `CHANGELOG.md` ใหม่จากประวัติ commit จริงด้วย
   `/changelog`, รักษารายการให้เป็นเนื้อหาที่ผู้ใช้เห็น, commit, พุช, แล้ว rebase/ดึง
   อีกครั้งก่อนสร้างสาขา
3. ตรวจทานระเบียนความเข้ากันได้ของรุ่นเผยแพร่ใน
   `src/plugins/compat/registry.ts` และ
   `src/commands/doctor/shared/deprecation-compat.ts` ลบความเข้ากันได้
   ที่หมดอายุเฉพาะเมื่อเส้นทางอัปเกรดยังคงครอบคลุมอยู่ หรือบันทึกเหตุผลว่าทำไมจึง
   ตั้งใจคงไว้
4. สร้าง `release/YYYY.M.D` จาก `main` ปัจจุบัน; อย่าทำงานเผยแพร่ปกติ
   โดยตรงบน `main`
5. เพิ่มเวอร์ชันในทุกตำแหน่งที่จำเป็นสำหรับแท็กที่ต้องการ จากนั้นรันการตรวจสอบล่วงหน้าแบบกำหนดผลซ้ำได้ในเครื่อง:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, และ `pnpm release:check`
6. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true` ก่อนมีแท็ก
   อนุญาตให้ใช้ SHA ของสาขา release แบบเต็ม 40 อักขระสำหรับการตรวจสอบล่วงหน้า
   เพื่อการตรวจสอบเท่านั้น บันทึก `preflight_run_id` ที่สำเร็จไว้
7. เริ่มการทดสอบก่อนเผยแพร่ทั้งหมดด้วยการตรวจสอบความถูกต้องของรุ่นเผยแพร่แบบเต็มสำหรับ
   สาขา release, แท็ก หรือ SHA ของ commit แบบเต็ม นี่คือจุดเข้าแบบแมนนวลเดียว
   สำหรับกล่องทดสอบรุ่นเผยแพร่ขนาดใหญ่สี่ชุด: Vitest, Docker, QA Lab และ Package
8. หากการตรวจสอบล้มเหลว ให้แก้ไขบนสาขา release และรันไฟล์, ช่องทาง, งาน workflow,
   โปรไฟล์แพ็กเกจ, provider หรือรายการอนุญาตของโมเดลที่เล็กที่สุดที่ล้มเหลวซ้ำ
   เพื่อพิสูจน์การแก้ไข รันชุดครอบใหญ่เต็มรูปแบบซ้ำเฉพาะเมื่อพื้นผิวที่เปลี่ยนทำให้
   หลักฐานเดิมล้าสมัย
9. สำหรับ beta ให้แท็ก `vYYYY.M.D-beta.N`, เผยแพร่ด้วย npm dist-tag `beta`, จากนั้นรัน
   การยอมรับแพ็กเกจหลังเผยแพร่กับแพ็กเกจ `openclaw@YYYY.M.D-beta.N`
   หรือ `openclaw@beta` ที่เผยแพร่แล้ว หาก beta ที่ถูกพุชหรือเผยแพร่แล้วต้องแก้ไข ให้ตัด
   `-beta.N` ถัดไป; อย่าลบหรือเขียน beta เดิมใหม่
10. สำหรับ stable ให้ดำเนินการต่อเฉพาะหลังจาก beta หรือ release candidate ที่ตรวจสอบแล้วมี
    หลักฐานการตรวจสอบที่จำเป็น การเผยแพร่ npm stable จะใช้ artifact การตรวจสอบล่วงหน้าที่สำเร็จ
    ซ้ำผ่าน `preflight_run_id`; ความพร้อมของการเผยแพร่ macOS stable
    ยังต้องมี `.zip`, `.dmg`, `.dSYM.zip` ที่แพ็กแล้ว และ
    `appcast.xml` ที่อัปเดตบน `main`
11. หลังเผยแพร่ ให้รันตัวตรวจสอบ npm หลังเผยแพร่, E2E Telegram แบบ npm ที่เผยแพร่แล้วแบบสแตนด์อโลน
    ซึ่งเป็นทางเลือกเมื่อคุณต้องการหลักฐานช่องทางหลังเผยแพร่,
    การโปรโมต dist-tag เมื่อจำเป็น, บันทึกรุ่นเผยแพร่/รุ่นก่อนเผยแพร่บน GitHub จากส่วน
    `CHANGELOG.md` ที่ตรงกันครบถ้วน, และขั้นตอนการประกาศรุ่นเผยแพร่

## การตรวจสอบก่อนเผยแพร่

- รัน `pnpm check:test-types` ก่อน release preflight เพื่อให้ test TypeScript ยังคง
  ครอบคลุมนอก gate `pnpm check` ในเครื่องที่เร็วกว่า
- รัน `pnpm check:architecture` ก่อน release preflight เพื่อให้การตรวจสอบ import
  cycle และ architecture boundary ที่กว้างขึ้นเป็นสีเขียวนอก gate ในเครื่องที่เร็วกว่า
- รัน `pnpm build && pnpm ui:build` ก่อน `pnpm release:check` เพื่อให้ release
  artifacts `dist/*` ที่คาดไว้และ bundle ของ Control UI มีอยู่สำหรับขั้นตอน
  การตรวจสอบ pack
- รัน workflow แบบ manual `Full Release Validation` ก่อนการอนุมัติ release เพื่อ
  เริ่ม test boxes ก่อน release ทั้งหมดจาก entrypoint เดียว โดยรับ branch,
  tag หรือ full commit SHA, dispatch `CI` แบบ manual และ dispatch
  `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, ชุดทดสอบ
  Docker release-path, live/E2E, OpenWebUI, QA Lab parity, Matrix และ Telegram
  lanes ระบุ `npm_telegram_package_spec` เฉพาะหลังจาก package ถูก publish แล้ว
  และต้องการให้ post-publish Telegram E2E รันด้วย ระบุ
  `evidence_package_spec` เมื่อ private evidence report ควรพิสูจน์ว่า
  การตรวจสอบตรงกับ package npm ที่ publish แล้วโดยไม่บังคับ Telegram E2E
  ตัวอย่าง:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- รัน workflow แบบ manual `Package Acceptance` เมื่อคุณต้องการหลักฐาน side-channel
  สำหรับ package candidate ขณะที่งาน release ยังดำเนินต่อ ใช้ `source=npm` สำหรับ
  `openclaw@beta`, `openclaw@latest` หรือ release version แบบ exact; `source=ref`
  เพื่อ pack branch/tag/SHA `package_ref` ที่เชื่อถือได้ด้วย harness
  `workflow_ref` ปัจจุบัน; `source=url` สำหรับ HTTPS tarball พร้อม SHA-256
  ที่จำเป็น; หรือ `source=artifact` สำหรับ tarball ที่อัปโหลดโดย GitHub
  Actions run อื่น workflow จะ resolve candidate เป็น `package-under-test`,
  ใช้ Docker E2E release scheduler ซ้ำกับ tarball นั้น และสามารถรัน Telegram QA
  กับ tarball เดียวกันด้วย `telegram_mode=mock-openai` หรือ
  `telegram_mode=live-frontier`
  ตัวอย่าง: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  โปรไฟล์ทั่วไป:
  - `smoke`: lanes สำหรับติดตั้ง/channel/agent, gateway network และ config reload
  - `package`: lanes สำหรับ package/update/Plugin ที่อิง artifact โดยไม่มี OpenWebUI หรือ ClawHub แบบ live
  - `product`: โปรไฟล์ package พร้อมช่องทาง MCP, การล้าง cron/subagent,
    OpenAI web search และ OpenWebUI
  - `full`: chunks ของ Docker release-path พร้อม OpenWebUI
  - `custom`: การเลือก `docker_lanes` แบบ exact สำหรับ rerun ที่เจาะจง
- รัน workflow แบบ manual `CI` โดยตรงเมื่อคุณต้องการเพียง coverage ของ CI ปกติเต็มรูปแบบ
  สำหรับ release candidate การ dispatch CI แบบ manual จะ bypass changed
  scoping และบังคับ Linux Node shards, shards ของ Plugin ที่รวมมาในชุด,
  channel contracts, ความเข้ากันได้กับ Node 22, `check`, `check-additional`,
  build smoke, docs checks, Python skills, Windows, macOS, Android และ Control UI i18n
  lanes
  ตัวอย่าง: `gh workflow run ci.yml --ref release/YYYY.M.D`
- รัน `pnpm qa:otel:smoke` เมื่อตรวจสอบ release telemetry โดยจะทดสอบ
  QA-lab ผ่านตัวรับ OTLP/HTTP ในเครื่อง และตรวจสอบชื่อ trace span ที่ export,
  attributes ที่มีขอบเขต และการ redact content/identifier โดยไม่ต้องใช้
  Opik, Langfuse หรือ collector ภายนอกอื่น
- รัน `pnpm release:check` ก่อนทุก tagged release
- ตอนนี้ release checks รันใน workflow แบบ manual แยกต่างหาก:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` ยังรัน QA Lab mock parity gate พร้อมโปรไฟล์ Matrix
  แบบ live ที่เร็ว และ Telegram QA lane ก่อนการอนุมัติ release ด้วย lanes แบบ live
  ใช้ environment `qa-live-shared`; Telegram ยังใช้ leases ของ credential Convex CI
  ด้วย รัน workflow แบบ manual `QA-Lab - All Lanes` ด้วย
  `matrix_profile=all` และ `matrix_shards=true` เมื่อคุณต้องการ inventory ของ Matrix
  transport, media และ E2EE แบบเต็มในแบบขนาน
- การตรวจสอบ runtime ของการติดตั้งและการอัปเกรดข้าม OS เป็นส่วนหนึ่งของ
  `OpenClaw Release Checks` และ `Full Release Validation` สาธารณะ ซึ่งเรียก
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` โดยตรง
- การแยกนี้ตั้งใจไว้: ให้เส้นทาง npm release จริงสั้น กำหนดได้แน่นอน และเน้น artifact
  ขณะที่ checks แบบ live ที่ช้ากว่ายังคงอยู่ใน lane ของตัวเอง เพื่อไม่ให้ทำให้ publish
  ช้าหรือถูกบล็อก
- release checks ที่มี secret ควรถูก dispatch ผ่าน `Full Release
Validation` หรือจาก workflow ref `main`/release เพื่อให้ workflow logic และ
  secrets ยังคงถูกควบคุม
- `OpenClaw Release Checks` รับ branch, tag หรือ full commit SHA ตราบใดที่
  commit ที่ resolve ได้สามารถเข้าถึงได้จาก branch หรือ release tag ของ OpenClaw
- validation-only preflight ของ `OpenClaw NPM Release` ยังรับ full workflow-branch
  commit SHA ปัจจุบันแบบ 40 อักขระได้โดยไม่ต้องมี pushed tag
- เส้นทาง SHA นั้นเป็น validation-only และไม่สามารถ promote เป็น publish จริงได้
- ในโหมด SHA workflow จะสังเคราะห์ `v<package.json version>` เฉพาะสำหรับ
  การตรวจ metadata ของ package เท่านั้น; publish จริงยังต้องใช้ release tag จริง
- ทั้งสอง workflows ให้เส้นทาง publish และ promotion จริงอยู่บน GitHub-hosted
  runners ขณะที่เส้นทาง validation ที่ไม่เปลี่ยนแปลงสิ่งใดสามารถใช้ Blacksmith
  Linux runners ที่ใหญ่กว่าได้
- workflow นั้นรัน
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  โดยใช้ workflow secrets ทั้ง `OPENAI_API_KEY` และ `ANTHROPIC_API_KEY`
- npm release preflight ไม่รอ release checks lane แยกอีกต่อไป
- รัน `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (หรือ tag beta/correction ที่ตรงกัน) ก่อนการอนุมัติ
- หลังจาก npm publish ให้รัน
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (หรือ version beta/correction ที่ตรงกัน) เพื่อตรวจสอบเส้นทางติดตั้งจาก registry
  ที่ publish แล้วใน temp prefix ใหม่
- หลังจาก beta publish ให้รัน `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  เพื่อตรวจสอบ onboarding ของ installed-package, การตั้งค่า Telegram และ Telegram E2E
  จริงกับ package npm ที่ publish แล้วโดยใช้ pool ของ Telegram credential แบบ leased
  ที่ใช้ร่วมกัน maintainer ที่รันครั้งเดียวในเครื่องอาจละเว้น Convex vars และส่ง
  env credentials `OPENCLAW_QA_TELEGRAM_*` ทั้งสามรายการโดยตรงได้
- Maintainers สามารถรัน post-publish check เดียวกันจาก GitHub Actions ผ่าน
  workflow แบบ manual `NPM Telegram Beta E2E` ได้ ซึ่งตั้งใจให้เป็น manual-only
  และไม่รันในทุก merge
- ตอนนี้ release automation ของ maintainer ใช้ preflight-then-promote:
  - npm publish จริงต้องผ่าน npm `preflight_run_id` ที่สำเร็จ
  - npm publish จริงต้องถูก dispatch จาก branch `main` หรือ
    `release/YYYY.M.D` เดียวกันกับ preflight run ที่สำเร็จ
  - stable npm releases มีค่าเริ่มต้นเป็น `beta`
  - stable npm publish สามารถ target `latest` อย่างชัดเจนผ่าน workflow input
  - การเปลี่ยนแปลง npm dist-tag แบบ token-based ตอนนี้อยู่ใน
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    เพื่อความปลอดภัย เพราะ `npm dist-tag add` ยังต้องใช้ `NPM_TOKEN` ขณะที่
    public repo คง publish แบบ OIDC-only ไว้
  - `macOS Release` สาธารณะเป็น validation-only
  - mac publish ส่วนตัวจริงต้องผ่าน private mac `preflight_run_id` และ
    `validate_run_id` ที่สำเร็จ
  - เส้นทาง publish จริงจะ promote artifacts ที่เตรียมไว้แทนที่จะ build ใหม่อีกครั้ง
- สำหรับ stable correction releases เช่น `YYYY.M.D-N` ตัวตรวจสอบ post-publish
  ยังตรวจสอบเส้นทางอัปเกรด temp-prefix เดียวกันจาก `YYYY.M.D` ไปเป็น `YYYY.M.D-N`
  เพื่อให้ release corrections ไม่สามารถปล่อยให้ global installs เก่ายังคงอยู่บน
  base stable payload แบบเงียบ ๆ ได้
- npm release preflight จะ fail closed เว้นแต่ tarball จะมีทั้ง
  `dist/control-ui/index.html` และ payload `dist/control-ui/assets/` ที่ไม่ว่าง
  เพื่อไม่ให้เราส่ง browser dashboard ว่างอีก
- การตรวจสอบ post-publish ยังตรวจสอบว่า registry install ที่ publish แล้ว
  มี runtime deps ของ Plugin ที่รวมมาในชุดซึ่งไม่ว่างภายใต้ layout ราก `dist/*`
  release ที่ส่งพร้อม payload dependency ของ Plugin ที่รวมมาในชุดซึ่งหายไปหรือว่าง
  จะทำให้ postpublish verifier ล้มเหลวและไม่สามารถ promote เป็น `latest` ได้
- `pnpm test:install:smoke` ยังบังคับงบประมาณ `unpackedSize` ของ npm pack บน
  candidate update tarball ดังนั้น installer e2e จะจับ pack bloat ที่ไม่ตั้งใจ
  ได้ก่อนเส้นทาง release publish
- หากงาน release แตะ CI planning, manifests timing ของส่วนขยาย หรือ
  test matrices ของส่วนขยาย ให้ regenerate และ review matrix outputs
  `plugin-prerelease-extension-shard` ที่ planner เป็นเจ้าของจาก
  `.github/workflows/plugin-prerelease.yml` ก่อนการอนุมัติ เพื่อให้ release notes
  ไม่อธิบาย layout CI ที่ล้าสมัย
- ความพร้อมของ stable macOS release ยังรวม updater surfaces:
  - GitHub release ต้องจบด้วย `.zip`, `.dmg` และ `.dSYM.zip` ที่ package แล้ว
  - `appcast.xml` บน `main` ต้องชี้ไปยัง stable zip ใหม่หลัง publish
  - app ที่ package แล้วต้องคง bundle id แบบ non-debug, URL ของ Sparkle feed
    ที่ไม่ว่าง และ `CFBundleVersion` ที่เท่ากับหรือสูงกว่า canonical Sparkle build floor
    สำหรับ release version นั้น

## Release test boxes

`Full Release Validation` คือวิธีที่ operators ใช้เริ่ม tests ก่อน release ทั้งหมดจาก
entrypoint เดียว รันจาก workflow ref `main` ที่เชื่อถือได้ และส่ง release
branch, tag หรือ full commit SHA เป็น `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

workflow จะ resolve target ref, dispatch `CI` แบบ manual ด้วย
`target_ref=<release-ref>`, dispatch `OpenClaw Release Checks` และ
optionally dispatch post-publish Telegram E2E แบบ standalone เมื่อ
ตั้งค่า `npm_telegram_package_spec` จากนั้น `OpenClaw Release Checks` จะกระจายออกไปยัง
install smoke, cross-OS release checks, coverage ของ Docker release-path แบบ live/E2E,
Package Acceptance พร้อม Telegram package QA, QA Lab parity, Matrix แบบ live และ
Telegram แบบ live การรันแบบเต็มจะยอมรับได้เฉพาะเมื่อ summary ของ `Full Release Validation`
แสดง `normal_ci` และ `release_checks` ว่าสำเร็จ และ child `npm_telegram` ที่เป็น optional
สำเร็จหรือถูกข้ามโดยตั้งใจ final verifier summary มีตาราง slowest-job สำหรับแต่ละ child run
เพื่อให้ release manager เห็น critical path ปัจจุบันโดยไม่ต้องดาวน์โหลด logs
Child workflows ถูก dispatch จาก trusted ref ที่รัน `Full Release
Validation` โดยปกติคือ `--ref main` แม้เมื่อ target `ref` ชี้ไปยัง release branch
หรือ tag ที่เก่ากว่า ไม่มี workflow-ref input แยกสำหรับ Full Release Validation;
เลือก trusted harness โดยเลือก workflow run ref

ใช้ `release_profile` เพื่อเลือกความกว้างของ live/provider:

- `minimum`: OpenAI/core live และ Docker path ที่สำคัญต่อ release ซึ่งเร็วที่สุด
- `stable`: minimum พร้อม coverage ของ stable provider/backend สำหรับการอนุมัติ release
- `full`: stable พร้อม coverage ของ advisory provider/media ที่กว้างขึ้น

`OpenClaw Release Checks` ใช้ trusted workflow ref เพื่อ resolve target
ref หนึ่งครั้งเป็น `release-package-under-test` และ reuse artifact นั้นในทั้ง
release-path Docker checks และ Package Acceptance ซึ่งทำให้ boxes ที่หันหน้าเข้าหา
package ทั้งหมดอยู่บน bytes เดียวกันและหลีกเลี่ยง package builds ซ้ำ
cross-OS OpenAI install smoke ใช้ `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อ
repo/org variable ถูกตั้งค่า ไม่เช่นนั้นใช้ `openai/gpt-5.4-mini` เพราะ lane นี้
พิสูจน์ package install, onboarding, Gateway startup และ live agent turn หนึ่งครั้ง
ไม่ใช่การ benchmark model ค่าเริ่มต้นที่ช้าที่สุด matrix ของ live provider ที่กว้างกว่า
ยังคงเป็นที่สำหรับ coverage เฉพาะ model

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

อย่าใช้ umbrella แบบเต็มเป็นการรันซ้ำครั้งแรกหลังจากแก้แบบเฉพาะจุด หากกล่องหนึ่งล้มเหลว ให้ใช้ workflow ย่อย, job, Docker lane, package profile, model provider หรือ QA lane ที่ล้มเหลวเป็นหลักฐานถัดไป รัน umbrella แบบเต็มอีกครั้งเฉพาะเมื่อการแก้ไขเปลี่ยน release orchestration ที่ใช้ร่วมกัน หรือทำให้หลักฐาน all-box ก่อนหน้าไม่สดใหม่แล้วเท่านั้น ตัวตรวจสอบสุดท้ายของ umbrella จะตรวจสอบ run ids ของ child workflow ที่บันทึกไว้อีกครั้ง ดังนั้นหลังจากรัน child workflow สำเร็จแล้ว ให้รันซ้ำเฉพาะ parent job `Verify full validation` ที่ล้มเหลวเท่านั้น

สำหรับการกู้คืนแบบมีขอบเขต ให้ส่ง `rerun_group` ไปยัง umbrella `all` คือการรัน release-candidate จริง, `ci` รันเฉพาะ child CI ปกติ, `plugin-prerelease` รันเฉพาะ child ของ Plugin สำหรับ release เท่านั้น, `release-checks` รัน release box ทุกกล่อง และกลุ่ม release ที่แคบกว่าคือ `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` และ `npm-telegram` เมื่อมีการระบุ standalone package Telegram lane

### Vitest

กล่อง Vitest คือ child workflow `CI` แบบ manual โดย manual CI ตั้งใจข้าม changed scoping และบังคับใช้กราฟการทดสอบปกติสำหรับ release candidate ได้แก่ Linux Node shards, bundled-Plugin shards, channel contracts, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, Android และ Control UI i18n

ใช้กล่องนี้เพื่อตอบว่า "source tree ผ่านชุดทดสอบปกติแบบเต็มหรือไม่" กล่องนี้ไม่เหมือนกับการตรวจสอบผลิตภัณฑ์ตามเส้นทาง release หลักฐานที่ควรเก็บไว้:

- สรุป `Full Release Validation` ที่แสดง URL ของ run `CI` ที่ถูก dispatch
- run `CI` เป็นสีเขียวบน target SHA ที่ตรงกัน
- ชื่อ shard ที่ล้มเหลวหรือช้าใน CI jobs เมื่อตรวจสอบ regression
- artifact เวลา Vitest เช่น `.artifacts/vitest-shard-timings.json` เมื่อ run ต้องการการวิเคราะห์ประสิทธิภาพ

รัน manual CI โดยตรงเฉพาะเมื่อ release ต้องการ normal CI แบบกำหนดผลได้ แต่ไม่ต้องการกล่อง Docker, QA Lab, live, cross-OS หรือ package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

กล่อง Docker อยู่ใน `OpenClaw Release Checks` ผ่าน `openclaw-live-and-e2e-checks-reusable.yml` รวมถึง workflow `install-smoke` แบบ release-mode กล่องนี้ตรวจสอบ release candidate ผ่านสภาพแวดล้อม Docker แบบ packaged แทนการทดสอบระดับ source เท่านั้น

ความครอบคลุม Docker สำหรับ release รวมถึง:

- full install smoke โดยเปิดใช้ slow Bun global install smoke
- การเตรียม/ใช้ซ้ำ root Dockerfile smoke image ตาม target SHA พร้อมงาน QR, root/Gateway และ installer/Bun smoke ที่รันเป็น install-smoke shards แยกกัน
- repository E2E lanes
- release-path Docker chunks: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` และ `bundled-channels-contracts`
- ความครอบคลุม OpenWebUI ภายใน chunk `plugins-runtime-services` เมื่อมีการร้องขอ
- แยก bundled-channel dependency lanes ไปตาม channel-smoke, update-target และ setup/runtime contract chunks แทนงาน bundled-channel ขนาดใหญ่เพียงงานเดียว
- แยก bundled Plugin install/uninstall lanes `bundled-plugin-install-uninstall-0` ถึง `bundled-plugin-install-uninstall-23`
- ชุดทดสอบ live/E2E provider และความครอบคลุม Docker live model เมื่อ release checks รวม live suites

ใช้ Docker artifacts ก่อนรันซ้ำ release-path scheduler อัปโหลด `.artifacts/docker-tests/` พร้อม lane logs, `summary.json`, `failures.json`, phase timings, scheduler plan JSON และคำสั่ง rerun สำหรับการกู้คืนแบบเฉพาะจุด ให้ใช้ `docker_lanes=<lane[,lane]>` บน reusable live/E2E workflow แทนการรัน release chunks ทั้งหมดซ้ำ คำสั่ง rerun ที่สร้างขึ้นจะรวม `package_artifact_run_id` ก่อนหน้าและ input ของ Docker image ที่เตรียมไว้เมื่อมีอยู่ เพื่อให้ lane ที่ล้มเหลวใช้ tarball และ GHCR images เดิมซ้ำได้

### QA Lab

กล่อง QA Lab เป็นส่วนหนึ่งของ `OpenClaw Release Checks` ด้วยเช่นกัน เป็น gate สำหรับพฤติกรรม agentic และระดับช่องทางของ release แยกจากกลไก package ของ Vitest และ Docker

ความครอบคลุม QA Lab สำหรับ release รวมถึง:

- mock parity gate ที่เปรียบเทียบ lane ของ OpenAI candidate กับ baseline Opus 4.6 โดยใช้ agentic parity pack
- โปรไฟล์ live Matrix QA แบบเร็วโดยใช้ environment `qa-live-shared`
- live Telegram QA lane โดยใช้ Convex CI credential leases
- `pnpm qa:otel:smoke` เมื่อ release telemetry ต้องการหลักฐาน local ชัดเจน

ใช้กล่องนี้เพื่อตอบว่า "release ทำงานถูกต้องในสถานการณ์ QA และ live channel flows หรือไม่" เก็บ artifact URLs สำหรับ parity, Matrix และ Telegram lanes ไว้เมื่ออนุมัติ release ความครอบคลุม Matrix แบบเต็มยังคงมีให้เป็นการรัน QA-Lab แบบ manual sharded แทน lane ที่สำคัญต่อ release ตามค่าเริ่มต้น

### Package

กล่อง Package คือ gate สำหรับผลิตภัณฑ์ที่ติดตั้งได้ รองรับโดย `Package Acceptance` และ resolver `scripts/resolve-openclaw-package-candidate.mjs` resolver จะทำให้ candidate อยู่ในรูปมาตรฐานเป็น tarball `package-under-test` ที่ Docker E2E ใช้, ตรวจสอบ package inventory, บันทึก package version และ SHA-256 และแยก workflow harness ref ออกจาก package source ref

แหล่ง candidate ที่รองรับ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` หรือเวอร์ชัน release ของ OpenClaw ที่ระบุชัดเจน
- `source=ref`: pack branch, tag หรือ full commit SHA ของ `package_ref` ที่เชื่อถือได้พร้อม harness `workflow_ref` ที่เลือก
- `source=url`: ดาวน์โหลด HTTPS `.tgz` พร้อม `package_sha256` ที่จำเป็น
- `source=artifact`: ใช้ `.tgz` ที่อัปโหลดโดย GitHub Actions run อื่นซ้ำ

`OpenClaw Release Checks` รัน Package Acceptance ด้วย `source=ref`, `package_ref=<release-ref>`, `suite_profile=custom`, `docker_lanes=bundled-channel-deps-compat plugins-offline` และ `telegram_mode=mock-openai` release-path Docker chunks ครอบคลุม install, update และ plugin-update lanes ที่ทับซ้อนกัน ส่วน Package Acceptance คง bundled-channel compat แบบ artifact-native, offline Plugin fixtures และ Telegram package QA กับ tarball ที่ resolve แล้วเดียวกันไว้ นี่คือสิ่งทดแทนแบบ GitHub-native สำหรับความครอบคลุม package/update ส่วนใหญ่ที่ก่อนหน้านี้ต้องใช้ Parallels Cross-OS release checks ยังคงสำคัญสำหรับ onboarding, installer และพฤติกรรม platform ที่เฉพาะเจาะจงตาม OS แต่การตรวจสอบผลิตภัณฑ์ package/update ควรเลือกใช้ Package Acceptance

ความผ่อนปรนของ package-acceptance เดิมถูกจำกัดเวลาโดยตั้งใจ Packages จนถึง `2026.4.25` อาจใช้ compatibility path สำหรับช่องว่าง metadata ที่เผยแพร่ไปยัง npm แล้ว ได้แก่ private QA inventory entries ที่หายไปจาก tarball, `gateway install --wrapper` ที่หายไป, patch files ที่หายไปใน git fixture ที่ได้จาก tarball, `update.channel` ที่ไม่ได้ persist, ตำแหน่ง install-record ของ Plugin แบบ legacy, install-record persistence ของ marketplace ที่หายไป และ config metadata migration ระหว่าง `plugins update` package `2026.4.26` ที่เผยแพร่แล้วอาจเตือนเรื่อง local build metadata stamp files ที่ถูกส่งไปแล้ว Packages หลังจากนั้นต้องผ่าน package contracts สมัยใหม่ ช่องว่างเดียวกันเหล่านั้นจะทำให้ release validation ล้มเหลว

ใช้โปรไฟล์ Package Acceptance ที่กว้างขึ้นเมื่อคำถามของ release เกี่ยวกับ package ที่ติดตั้งได้จริง:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

โปรไฟล์ package ที่ใช้บ่อย:

- `smoke`: package install/channel/agent แบบเร็ว, gateway network และ config reload lanes
- `package`: สัญญา install/update/Plugin package โดยไม่มี live ClawHub; นี่คือค่าเริ่มต้นของ release-check
- `product`: `package` พร้อม MCP channels, Cron/subagent cleanup, OpenAI web search และ OpenWebUI
- `full`: Docker release-path chunks พร้อม OpenWebUI
- `custom`: รายการ `docker_lanes` ที่ระบุชัดเจนสำหรับ focused reruns

สำหรับหลักฐาน package-candidate Telegram ให้เปิดใช้ `telegram_mode=mock-openai` หรือ `telegram_mode=live-frontier` บน Package Acceptance workflow จะส่ง tarball `package-under-test` ที่ resolve แล้วเข้าไปใน Telegram lane; standalone Telegram workflow ยังรับ published npm spec สำหรับ post-publish checks

## input ของ NPM workflow

`OpenClaw NPM Release` รับ input ที่ operator ควบคุมได้ดังนี้:

- `tag`: release tag ที่จำเป็น เช่น `v2026.4.2`, `v2026.4.2-1` หรือ `v2026.4.2-beta.1`; เมื่อ `preflight_only=true` อาจเป็น full 40-character workflow-branch commit SHA ปัจจุบันสำหรับ validation-only preflight ได้ด้วย
- `preflight_only`: `true` สำหรับ validation/build/package เท่านั้น, `false` สำหรับเส้นทาง publish จริง
- `preflight_run_id`: จำเป็นบนเส้นทาง publish จริง เพื่อให้ workflow ใช้ tarball ที่เตรียมไว้จาก preflight run ที่สำเร็จซ้ำ
- `npm_dist_tag`: tag เป้าหมายของ npm สำหรับเส้นทาง publish; ค่าเริ่มต้นคือ `beta`

`OpenClaw Release Checks` รับ input ที่ operator ควบคุมได้ดังนี้:

- `ref`: branch, tag หรือ full commit SHA ที่จะตรวจสอบ checks ที่มี secret ต้องการให้ commit ที่ resolve แล้วเข้าถึงได้จาก branch หรือ release tag ของ OpenClaw

กฎ:

- stable tags และ correction tags อาจเผยแพร่ไปยัง `beta` หรือ `latest` ก็ได้
- Beta prerelease tags อาจเผยแพร่ได้เฉพาะไปยัง `beta`
- สำหรับ `OpenClaw NPM Release` อนุญาตให้ใช้ input full commit SHA เฉพาะเมื่อ `preflight_only=true` เท่านั้น
- `OpenClaw Release Checks` และ `Full Release Validation` เป็น validation-only เสมอ
- เส้นทาง publish จริงต้องใช้ `npm_dist_tag` เดียวกับที่ใช้ระหว่าง preflight; workflow จะตรวจสอบว่า metadata ก่อน publish ยังสอดคล้องต่อไป

## ลำดับ stable npm release

เมื่อสร้าง stable npm release:

1. รัน `OpenClaw NPM Release` ด้วย `preflight_only=true`
   - ก่อนมี tag คุณอาจใช้ full workflow-branch commit SHA ปัจจุบันสำหรับการ dry run แบบ validation-only ของ preflight workflow
2. เลือก `npm_dist_tag=beta` สำหรับ flow ปกติแบบ beta-first หรือ `latest` เฉพาะเมื่อคุณตั้งใจเผยแพร่ stable โดยตรง
3. รัน `Full Release Validation` บน release branch, release tag หรือ full commit SHA เมื่อคุณต้องการ normal CI พร้อม live prompt cache, Docker, QA Lab, Matrix และ Telegram coverage จาก manual workflow เดียว
4. หากคุณตั้งใจต้องการเฉพาะกราฟการทดสอบปกติแบบกำหนดผลได้ ให้รัน workflow `CI` แบบ manual บน release ref แทน
5. บันทึก `preflight_run_id` ที่สำเร็จ
6. รัน `OpenClaw NPM Release` อีกครั้งด้วย `preflight_only=false`, `tag` เดิม, `npm_dist_tag` เดิม และ `preflight_run_id` ที่บันทึกไว้
7. หาก release ลงบน `beta` ให้ใช้ workflow ส่วนตัว `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` เพื่อ promote เวอร์ชัน stable นั้นจาก `beta` ไปยัง `latest`
8. หาก release ตั้งใจเผยแพร่โดยตรงไปยัง `latest` และ `beta` ควรตาม stable build เดียวกันทันที ให้ใช้ workflow ส่วนตัวเดียวกันนั้นเพื่อชี้ dist-tags ทั้งคู่ไปยังเวอร์ชัน stable หรือปล่อยให้ scheduled self-healing sync ย้าย `beta` ในภายหลัง

การเปลี่ยน dist-tag อยู่ใน repo ส่วนตัวด้วยเหตุผลด้านความปลอดภัย เพราะยังต้องใช้ `NPM_TOKEN` ในขณะที่ repo สาธารณะใช้การ publish แบบ OIDC-only

สิ่งนี้ทำให้ทั้งเส้นทาง publish โดยตรงและเส้นทาง promotion แบบ beta-first มีเอกสารกำกับและมองเห็นได้สำหรับ operator

หากผู้ดูแลจำเป็นต้องย้อนกลับไปใช้การยืนยันตัวตน npm ภายในเครื่อง ให้รันคำสั่ง 1Password
CLI (`op`) ใดๆ เฉพาะภายในเซสชัน tmux ที่แยกไว้เท่านั้น อย่าเรียก `op`
โดยตรงจากเชลล์ agent หลัก การเก็บไว้ภายใน tmux ทำให้มองเห็นพรอมป์
การแจ้งเตือน และการจัดการ OTP ได้ และป้องกันการแจ้งเตือนจากโฮสต์ซ้ำๆ

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

ผู้ดูแลใช้เอกสารการเผยแพร่ส่วนตัวใน
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
สำหรับคู่มือปฏิบัติการจริง

## ที่เกี่ยวข้อง

- [ช่องทางการเผยแพร่](/th/install/development-channels)
