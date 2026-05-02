---
read_when:
    - ต้องเข้าใจว่าเหตุใดงาน CI จึงทำงานหรือไม่ทำงาน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการรันตรวจสอบความถูกต้องของรีลีสหรือการรันซ้ำ
    - คุณกำลังเปลี่ยนการส่งงานของ ClawSweeper หรือการส่งต่อกิจกรรม GitHub
summary: กราฟงานการผสานรวมอย่างต่อเนื่อง เกตตามขอบเขต ชุดครอบการเผยแพร่ และคำสั่งภายในเครื่องที่เทียบเท่า
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-05-02T20:42:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39410c5ceb3598e9e1771f98fba79485b13967df372c7a3f55ef5a5350416435
    source_path: ci.md
    workflow: 16
---

OpenClaw CI ทำงานกับทุก push ไปยัง `main` และทุก pull request งาน `preflight` จะจัดประเภท diff และปิด lane ที่มีค่าใช้จ่ายสูงเมื่อมีการเปลี่ยนแปลงเฉพาะพื้นที่ที่ไม่เกี่ยวข้อง การรัน `workflow_dispatch` ด้วยตนเองจะข้ามการกำหนดขอบเขตอัจฉริยะโดยตั้งใจ และกระจายการทำงานไปยังกราฟเต็มสำหรับ release candidate และการตรวจสอบแบบกว้าง lane ของ Android ยังคงเป็นแบบ opt-in ผ่าน `include_android` การครอบคลุม Plugin เฉพาะ release อยู่ใน workflow [`Plugin Prerelease`](#plugin-prerelease) แยกต่างหาก และจะทำงานจาก [`Full Release Validation`](#full-release-validation) หรือการ dispatch ด้วยตนเองอย่างชัดเจนเท่านั้น

## ภาพรวม Pipeline

| งาน                              | วัตถุประสงค์                                                                                                   | เวลาที่ทำงาน                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | ตรวจจับการเปลี่ยนแปลงเฉพาะเอกสาร ขอบเขตที่เปลี่ยน extension ที่เปลี่ยน และสร้าง CI manifest                   | เสมอสำหรับ push และ PR ที่ไม่ใช่ draft |
| `security-scm-fast`              | การตรวจจับ private key และตรวจสอบ workflow ผ่าน `zizmor`                                                     | เสมอสำหรับ push และ PR ที่ไม่ใช่ draft |
| `security-dependency-audit`      | ตรวจสอบ production lockfile แบบไม่ต้องติดตั้ง dependency เทียบกับ npm advisories                                          | เสมอสำหรับ push และ PR ที่ไม่ใช่ draft |
| `security-fast`                  | aggregate ที่จำเป็นสำหรับงาน security แบบเร็ว                                                             | เสมอสำหรับ push และ PR ที่ไม่ใช่ draft |
| `check-dependencies`             | รอบตรวจ production Knip เฉพาะ dependency รวมถึง guard allowlist ของไฟล์ที่ไม่ได้ใช้                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-artifacts`                | สร้าง `dist/`, Control UI, ตรวจ built-artifact และ artifact ปลายน้ำที่ใช้ซ้ำได้                       | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-core`               | lane ความถูกต้องบน Linux แบบเร็ว เช่น การตรวจ bundled/plugin-contract/protocol                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-contracts-channels` | การตรวจ channel contract แบบ shard พร้อมผลตรวจ aggregate ที่เสถียร                                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-core-test`          | shard ทดสอบ Core Node โดยยกเว้น lane ของ channel, bundled, contract และ extension                          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check`                          | เทียบเท่า gate local หลักแบบ shard: prod types, lint, guards, test types และ strict smoke                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check-additional`               | shard สำหรับ architecture, boundary, extension-surface guards, package-boundary และ gateway-watch              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-smoke`                    | smoke test ของ CLI ที่ build แล้ว และ smoke ของ startup-memory                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks`                         | ตัวตรวจยืนยันสำหรับการทดสอบ channel ของ built-artifact                                                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-compat-node22`      | lane build และ smoke เพื่อความเข้ากันได้กับ Node 22                                                                | การ dispatch CI ด้วยตนเองสำหรับ release    |
| `check-docs`                     | ตรวจ formatting, lint และ broken-link ของเอกสาร                                                             | เอกสารมีการเปลี่ยนแปลง                       |
| `skills-python`                  | Ruff + pytest สำหรับ Skills ที่มี Python รองรับ                                                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python Skill      |
| `checks-windows`                 | การทดสอบ process/path เฉพาะ Windows รวมถึง regression ของ runtime import specifier ที่ใช้ร่วมกัน                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows           |
| `macos-node`                     | lane ทดสอบ TypeScript บน macOS โดยใช้ artifact ที่ build แล้วร่วมกัน                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `macos-swift`                    | Swift lint, build และ tests สำหรับแอป macOS                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `android`                        | unit test ของ Android สำหรับทั้งสอง flavor รวมถึงการ build debug APK หนึ่งรายการ                                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android           |
| `test-performance-agent`         | การปรับแต่ง slow-test ของ Codex รายวันหลังมีกิจกรรมที่เชื่อถือได้                                                 | CI บน main สำเร็จหรือ dispatch ด้วยตนเอง |
| `openclaw-performance`           | รายงานประสิทธิภาพ runtime ของ Kova แบบรายวัน/ตามสั่ง พร้อม lane mock-provider, deep-profile และ GPT 5.4 live | ตามกำหนดเวลาและ dispatch ด้วยตนเอง      |

## ลำดับ Fail-fast

1. `preflight` ตัดสินใจว่า lane ใดมีอยู่ตั้งแต่แรก ตรรกะ `docs-scope` และ `changed-scope` เป็นขั้นตอนภายในงานนี้ ไม่ใช่งานแยกต่างหาก
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` ล้มเหลวได้อย่างรวดเร็วโดยไม่ต้องรอ artifact และงาน matrix ของ platform ที่หนักกว่า
3. `build-artifacts` ทำงานทับซ้อนกับ lane Linux แบบเร็ว เพื่อให้ผู้บริโภคปลายน้ำเริ่มได้ทันทีที่ shared build พร้อม
4. lane platform และ runtime ที่หนักกว่าจะกระจายงานหลังจากนั้น: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่เป็น `cancelled` เมื่อมี push ใหม่ลงบน PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่าเป็นเสียงรบกวนของ CI เว้นแต่ run ล่าสุดสำหรับ ref เดียวกันยังล้มเหลวด้วย การตรวจ shard แบบ aggregate ใช้ `!cancelled() && always()` เพื่อให้ยังรายงาน shard failure ตามปกติ แต่ไม่เข้าคิวหลังจาก workflow ทั้งหมดถูกแทนที่ไปแล้ว key concurrency ของ CI อัตโนมัติมี version (`CI-v7-*`) เพื่อให้ zombie ฝั่ง GitHub ใน queue group เก่าไม่สามารถบล็อก run ใหม่บน main ได้อย่างไม่มีกำหนด run ชุดเต็มแบบ manual ใช้ `CI-manual-v1-*` และไม่ยกเลิก run ที่กำลังทำงานอยู่

## ขอบเขตและการกำหนดเส้นทาง

ตรรกะขอบเขตอยู่ใน `scripts/ci-changed-scope.mjs` และครอบคลุมด้วย unit test ใน `src/scripts/ci-changed-scope.test.ts` การ dispatch ด้วยตนเองจะข้ามการตรวจจับ changed-scope และทำให้ preflight manifest ทำงานเสมือนว่าพื้นที่ที่มีขอบเขตทุกส่วนเปลี่ยนแปลง

- **การแก้ไข CI workflow** ตรวจสอบกราฟ Node CI รวมถึง workflow linting แต่ไม่บังคับให้ Windows, Android หรือ macOS native build ทำงานด้วยตัวเอง lane ของ platform เหล่านั้นยังคงกำหนดขอบเขตตามการเปลี่ยนแปลงซอร์สของ platform
- **การแก้ไขเฉพาะ CI routing, การแก้ไข fixture ของ core-test ราคาถูกบางรายการ และการแก้ไข helper/test-routing ของ plugin contract แบบแคบ** ใช้เส้นทาง manifest แบบ Node-only ที่เร็ว: `preflight`, security และ task `checks-fast-core` เดียว เส้นทางนั้นจะข้าม build artifact, ความเข้ากันได้กับ Node 22, channel contract, shard core เต็ม, shard bundled-plugin และ matrix guard เพิ่มเติม เมื่อการเปลี่ยนแปลงจำกัดอยู่เฉพาะพื้นผิว routing หรือ helper ที่ task เร็วตรวจโดยตรง
- **การตรวจ Windows Node** ถูกกำหนดขอบเขตไปยัง wrapper process/path เฉพาะ Windows, helper runner ของ npm/pnpm/UI, config ของ package manager และพื้นผิว CI workflow ที่รัน lane นั้น การเปลี่ยนแปลงซอร์ส, Plugin, install-smoke และ test-only ที่ไม่เกี่ยวข้องยังคงอยู่บน lane Linux Node

ตระกูลการทดสอบ Node ที่ช้าที่สุดถูกแยกหรือถ่วงสมดุลเพื่อให้งานแต่ละงานยังเล็กโดยไม่จอง runner เกินจำเป็น: channel contract ทำงานเป็น shard ถ่วงน้ำหนักสามชุด, lane unit core ขนาดเล็กถูกจับคู่, auto-reply ทำงานเป็น worker ถ่วงสมดุลสี่ชุด (โดย subtree reply แยกเป็น shard agent-runner, dispatch และ commands/state-routing) และ config ของ agentic gateway/plugin ถูกกระจายไปตามงาน agentic Node แบบ source-only ที่มีอยู่ แทนที่จะรอ built artifact การทดสอบ browser, QA, media และ Plugin อื่น ๆ แบบกว้างใช้ config Vitest เฉพาะของตัวเองแทน catch-all Plugin ที่ใช้ร่วมกัน shard แบบ include-pattern บันทึกรายการ timing โดยใช้ชื่อ shard ของ CI เพื่อให้ `.artifacts/vitest-shard-timings.json` แยก whole config ออกจาก shard ที่ถูกกรองได้ `check-additional` เก็บงาน compile/canary ของ package-boundary ไว้ด้วยกัน และแยก architecture ของ runtime topology ออกจาก coverage ของ gateway watch ส่วน shard boundary guard จะรัน guard อิสระขนาดเล็กพร้อมกันภายในงานเดียว Gateway watch, การทดสอบ channel และ shard core support-boundary ทำงานพร้อมกันภายใน `build-artifacts` หลังจาก `dist/` และ `dist-runtime/` ถูก build แล้ว

Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` แล้วจึง build Play debug APK flavor third-party ไม่มี source set หรือ manifest แยกต่างหาก lane unit-test ของมันยังคง compile flavor ด้วย flag BuildConfig ของ SMS/call-log พร้อมหลีกเลี่ยงงาน packaging debug APK ซ้ำในทุก push ที่เกี่ยวข้องกับ Android

shard `check-dependencies` รัน `pnpm deadcode:dependencies` (รอบตรวจ production Knip เฉพาะ dependency ที่ pin ไปยัง Knip version ล่าสุด โดยปิด minimum release age ของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบผล unused-file ของ production จาก Knip กับ `scripts/deadcode-unused-files.allowlist.mjs` guard unused-file จะล้มเหลวเมื่อ PR เพิ่มไฟล์ที่ไม่ได้ใช้ใหม่ซึ่งยังไม่ได้ review หรือเหลือรายการ allowlist ที่ล้าสมัยไว้ ขณะยังคงรักษาพื้นผิว dynamic Plugin, generated, build, live-test และ package bridge ที่ตั้งใจไว้ซึ่ง Knip ไม่สามารถ resolve แบบ static ได้

## การส่งต่อกิจกรรม ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` เป็น bridge ฝั่งเป้าหมายจากกิจกรรม repository ของ OpenClaw ไปยัง ClawSweeper มันไม่ checkout หรือ execute โค้ด pull request ที่ไม่น่าเชื่อถือ workflow สร้าง GitHub App token จาก `CLAWSWEEPER_APP_PRIVATE_KEY` แล้ว dispatch payload `repository_dispatch` แบบกะทัดรัดไปยัง `openclaw/clawsweeper`

workflow มีสี่ lane:

- `clawsweeper_item` สำหรับคำขอ review issue และ pull request ที่เจาะจง;
- `clawsweeper_comment` สำหรับคำสั่ง ClawSweeper ที่ชัดเจนใน comment ของ issue;
- `clawsweeper_commit_review` สำหรับคำขอ review ระดับ commit บน push ไปยัง `main`;
- `github_activity` สำหรับกิจกรรม GitHub ทั่วไปที่ agent ClawSweeper อาจตรวจสอบ

lane `github_activity` ส่งต่อเฉพาะ metadata ที่ normalize แล้ว: event type, action, actor, repository, item number, URL, title, state และ excerpt สั้น ๆ สำหรับ comment หรือ review เมื่อมี โดยตั้งใจหลีกเลี่ยงการส่งต่อ webhook body ทั้งหมด workflow ฝั่งรับใน `openclaw/clawsweeper` คือ `.github/workflows/github-activity.yml` ซึ่งโพสต์ event ที่ normalize แล้วไปยัง hook ของ OpenClaw Gateway สำหรับ agent ClawSweeper

กิจกรรมทั่วไปคือการสังเกต ไม่ใช่การส่งมอบโดยปริยาย agent ClawSweeper ได้รับเป้าหมาย Discord ใน prompt และควรโพสต์ไปที่ `#clawsweeper` เฉพาะเมื่อ event นั้นน่าประหลาดใจ ดำเนินการได้ มีความเสี่ยง หรือมีประโยชน์เชิงปฏิบัติการ การเปิด การแก้ไข การเปลี่ยนแปลงจาก bot เสียงรบกวน webhook ซ้ำ และ traffic review ปกติควรให้ผลลัพธ์เป็น `NO_REPLY`

ถือว่า GitHub titles, comments, bodies, review text, branch names และ commit messages เป็นข้อมูลที่ไม่น่าเชื่อถือตลอดเส้นทางนี้ สิ่งเหล่านี้เป็น input สำหรับการสรุปและ triage ไม่ใช่คำสั่งสำหรับ workflow หรือ runtime ของ agent

## การ dispatch ด้วยตนเอง

การเรียกใช้ CI ด้วยตนเองจะรันกราฟงานเดียวกับ CI ปกติ แต่บังคับเปิดทุกเลนที่อยู่ในขอบเขตซึ่งไม่ใช่ Android: ชาร์ด Linux Node, ชาร์ด Plugin ที่บันเดิลมา, สัญญาช่องทาง, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, การตรวจสอบเอกสาร, Python Skills, Windows, macOS และ Control UI i18n การเรียกใช้ CI ด้วยตนเองแบบสแตนด์อโลนจะรันเฉพาะ Android ด้วย `include_android=true`; umbrella สำหรับรีลีสเต็มรูปแบบจะเปิด Android โดยส่ง `include_android=true` ชุดตรวจสอบแบบสแตติกสำหรับ Plugin ก่อนรีลีส, ชาร์ด `agentic-plugins` เฉพาะรีลีส, การ sweep แบทช์ extension แบบเต็ม และเลน Docker สำหรับ Plugin ก่อนรีลีสจะถูกตัดออกจาก CI ชุด Docker ก่อนรีลีสจะรันเฉพาะเมื่อ `Full Release Validation` เรียกใช้เวิร์กโฟลว์ `Plugin Prerelease` แยกต่างหากโดยเปิด gate สำหรับการตรวจสอบรีลีสเท่านั้น

การรันด้วยตนเองใช้ concurrency group ที่ไม่ซ้ำกัน เพื่อไม่ให้ชุดทดสอบเต็มของ release-candidate ถูกยกเลิกโดยการรันจาก push หรือ PR อื่นบน ref เดียวกัน อินพุต `target_ref` แบบไม่บังคับช่วยให้ผู้เรียกที่เชื่อถือได้รันกราฟนั้นกับ branch, tag หรือ commit SHA แบบเต็มได้ โดยใช้ไฟล์เวิร์กโฟลว์จาก dispatch ref ที่เลือก

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## รันเนอร์

| รันเนอร์                           | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, งานและ aggregate ด้านความปลอดภัยแบบเร็ว (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจสอบ protocol/contract/Plugin ที่บันเดิลมาแบบเร็ว, การตรวจสอบสัญญาช่องทางแบบแบ่งชาร์ด, ชาร์ด `check` ยกเว้น lint, ชาร์ดและ aggregate ของ `check-additional`, verifier aggregate สำหรับการทดสอบ Node, การตรวจสอบเอกสาร, Python Skills, workflow-sanity, labeler, auto-response; preflight ของ install-smoke ใช้ Ubuntu ที่โฮสต์โดย GitHub ด้วย เพื่อให้เมทริกซ์ Blacksmith เข้าคิวได้เร็วขึ้น |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, ชาร์ด extension น้ำหนักเบากว่า, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` และ `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, ชาร์ดการทดสอบ Linux Node, ชาร์ดการทดสอบ Plugin ที่บันเดิลมา, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (ไวต่อ CPU มากพอที่ 8 vCPU มีต้นทุนมากกว่าสิ่งที่ประหยัดได้); การ build Docker ของ install-smoke (เวลาเข้าคิว 32-vCPU มีต้นทุนมากกว่าสิ่งที่ประหยัดได้)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; fork จะ fallback ไปที่ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; fork จะ fallback ไปที่ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## คำสั่งเทียบเท่าภายในเครื่อง

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## ประสิทธิภาพของ OpenClaw

`OpenClaw Performance` คือเวิร์กโฟลว์ประสิทธิภาพของผลิตภัณฑ์/รันไทม์ โดยรันทุกวันบน `main` และสามารถเรียกใช้ด้วยตนเองได้:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

เวิร์กโฟลว์ติดตั้ง OCM จากรีลีสที่ pin ไว้ และ Kova จากอินพุต `kova_ref` ที่ pin ไว้ จากนั้นรันสามเลน:

- `mock-provider`: สถานการณ์ diagnostic ของ Kova กับรันไทม์ที่ build ภายในเครื่อง พร้อม auth ปลอมที่เข้ากันได้กับ OpenAI แบบ deterministic
- `mock-deep-profile`: การทำ profile CPU/heap/trace สำหรับ hotspot ของการเริ่มต้น, Gateway และ agent-turn
- `live-gpt54`: agent turn จริงของ OpenAI `openai/gpt-5.4` ซึ่งจะข้ามเมื่อไม่มี `OPENAI_API_KEY`

เลน mock-provider ยังรันโพรบซอร์สแบบเนทีฟของ OpenClaw หลังจากผ่าน Kova แล้ว: เวลา boot และหน่วยความจำของ Gateway ในกรณีเริ่มต้นแบบ default, hook และ 50-Plugin; loop hello ของ mock-OpenAI `channel-chat-baseline` ซ้ำ ๆ; และคำสั่งเริ่มต้น CLI กับ Gateway ที่ boot แล้ว สรุป Markdown ของโพรบซอร์สอยู่ที่ `source/index.md` ใน report bundle พร้อม JSON ดิบอยู่ข้างกัน

ทุกเลนอัปโหลด artifact ของ GitHub เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว เวิร์กโฟลว์จะ commit `report.json`, `report.md`, bundle, `index.md` และ artifact ของ source-probe เข้าไปใน `openclaw/clawgrit-reports` ภายใต้ `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/` ด้วย pointer ของ branch ปัจจุบันจะถูกเขียนเป็น `openclaw-performance/<ref>/latest-<lane>.json`

## การตรวจสอบรีลีสเต็มรูปแบบ

`Full Release Validation` คือเวิร์กโฟลว์ umbrella แบบ manual สำหรับ "รันทุกอย่างก่อนรีลีส" โดยรับ branch, tag หรือ commit SHA แบบเต็ม แล้วเรียกใช้เวิร์กโฟลว์ `CI` แบบ manual ด้วย target นั้น, เรียกใช้ `Plugin Prerelease` สำหรับ proof เฉพาะรีลีสของ Plugin/package/static/Docker และเรียกใช้ `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, ชุดทดสอบเส้นทางรีลีสของ Docker, live/E2E, OpenWebUI, QA Lab parity, Matrix และเลน Telegram เมื่อใช้ `rerun_group=all` และ `release_profile=full` จะรัน `NPM Telegram Beta E2E` กับ artifact `release-package-under-test` จาก release checks ด้วย หลังจากเผยแพร่แล้ว ให้ส่ง `npm_telegram_package_spec` เพื่อรันเลน package ของ Telegram เดิมซ้ำกับ package npm ที่เผยแพร่แล้ว

ดู [การตรวจสอบรีลีสเต็มรูปแบบ](/th/reference/full-release-validation) สำหรับ
เมทริกซ์ stage, ชื่องานเวิร์กโฟลว์ที่แน่นอน, ความแตกต่างของ profile, artifact และ
handle สำหรับ rerun แบบเจาะจง

`OpenClaw Release Publish` คือเวิร์กโฟลว์รีลีสแบบ manual ที่เปลี่ยนแปลงสถานะ เรียกใช้จาก `release/YYYY.M.D` หรือ `main` หลังจากมี release tag แล้ว และหลังจาก OpenClaw npm preflight สำเร็จแล้ว โดยจะตรวจสอบ `pnpm plugins:sync:check`, เรียกใช้ `Plugin NPM Release` สำหรับ package Plugin ที่เผยแพร่ได้ทั้งหมด, เรียกใช้ `Plugin ClawHub Release` สำหรับ SHA รีลีสเดียวกัน และหลังจากนั้นเท่านั้นจึงเรียกใช้ `OpenClaw NPM Release` พร้อม `preflight_run_id` ที่บันทึกไว้

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

สำหรับ proof ของ commit ที่ pin ไว้บน branch ที่เคลื่อนไหวเร็ว ให้ใช้ helper แทน
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

dispatch ref ของเวิร์กโฟลว์ GitHub ต้องเป็น branch หรือ tag ไม่ใช่ commit SHA ดิบ
helper จะ push branch ชั่วคราว `release-ci/<sha>-...` ที่ target SHA,
เรียกใช้ `Full Release Validation` จาก ref ที่ pin ไว้นั้น, ตรวจสอบว่า `headSha` ของทุกเวิร์กโฟลว์ลูก
ตรงกับ target และลบ branch ชั่วคราวเมื่อการรันเสร็จสิ้น umbrella verifier จะล้มเหลวด้วยหากเวิร์กโฟลว์ลูกใดรันที่
SHA อื่น

`release_profile` ควบคุมความกว้างของ live/provider ที่ส่งเข้า release checks เวิร์กโฟลว์รีลีสแบบ manual
มีค่าเริ่มต้นเป็น `stable`; ใช้ `full` เฉพาะเมื่อคุณ
ตั้งใจต้องการเมทริกซ์ advisory provider/media แบบกว้าง

- `minimum` คงไว้เฉพาะเลน OpenAI/core ที่วิกฤตต่อรีลีสและเร็วที่สุด
- `stable` เพิ่มชุด provider/backend ที่เสถียร
- `full` รันเมทริกซ์ advisory provider/media แบบกว้าง

umbrella จะบันทึก id ของการรันลูกที่เรียกใช้ และงาน `Verify full validation` สุดท้ายจะตรวจสอบ conclusion ปัจจุบันของการรันลูกอีกครั้ง และเพิ่มตารางงานที่ช้าที่สุดสำหรับการรันลูกแต่ละรายการ หากมีการ rerun เวิร์กโฟลว์ลูกแล้วกลายเป็นสีเขียว ให้ rerun เฉพาะงาน verifier ของ parent เพื่อรีเฟรชผลลัพธ์และสรุปเวลาของ umbrella

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รองรับ `rerun_group` ใช้ `all` สำหรับ release candidate, `ci` สำหรับเฉพาะ child CI เต็มรูปแบบปกติ, `plugin-prerelease` สำหรับเฉพาะ child prerelease ของ Plugin, `release-checks` สำหรับ child ของ release ทุกตัว หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` หรือ `npm-telegram` บน umbrella วิธีนี้ทำให้การ rerun กล่อง release ที่ล้มเหลวมีขอบเขตจำกัดหลังจากการแก้ไขแบบเจาะจง

`OpenClaw Release Checks` ใช้ workflow ref ที่เชื่อถือได้เพื่อ resolve ref ที่เลือกเพียงครั้งเดียวให้เป็น tarball `release-package-under-test` จากนั้นส่ง artifact นั้นไปยังทั้ง workflow Docker ของ release-path แบบ live/E2E และ package acceptance shard วิธีนี้ทำให้ไบต์ของ package สอดคล้องกันในกล่อง release ต่าง ๆ และหลีกเลี่ยงการ pack candidate เดียวกันซ้ำใน child jobs หลายตัว

การรัน `Full Release Validation` ซ้ำสำหรับ `ref=main` และ `rerun_group=all`
จะแทนที่ umbrella ที่เก่ากว่า parent monitor จะยกเลิก child workflow ใด ๆ
ที่ได้ dispatch ไปแล้วเมื่อ parent ถูกยกเลิก ดังนั้นการ validation ของ main ที่ใหม่กว่า
จะไม่ต้องรออยู่หลัง release-check run เก่าสองชั่วโมง การ validation ของ release branch/tag
และ focused rerun groups ยังคงใช้ `cancel-in-progress: false`

## Live และ E2E shards

release live/E2E child ยังคง coverage กว้างของ `pnpm test:live` แบบ native แต่รันเป็น shard ที่มีชื่อผ่าน `scripts/test-live-shard.mjs` แทน job แบบ serial เดียว:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- jobs `native-live-src-gateway-profiles` ที่กรองตาม provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shards media audio/video ที่แยกออก และ shards music ที่กรองตาม provider

วิธีนี้คง coverage ไฟล์เดิมไว้ ขณะเดียวกันทำให้ failure ของ live provider ที่ช้าง่ายต่อการ rerun และวินิจฉัยมากขึ้น ชื่อ shard แบบ aggregate อย่าง `native-live-extensions-o-z`, `native-live-extensions-media` และ `native-live-extensions-media-music` ยังคงใช้ได้สำหรับการ rerun แบบ manual one-shot

native live media shards รันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งสร้างโดย workflow `Live Media Runner Image` image นี้ติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้าแล้ว; media jobs เพียงตรวจสอบ binaries ก่อน setup เท่านั้น ให้เก็บชุดทดสอบ live ที่หนุนด้วย Docker ไว้บน Blacksmith runners ปกติ เพราะ container jobs ไม่เหมาะกับการเปิด nested Docker tests

shards live model/backend ที่หนุนด้วย Docker ใช้ image แชร์แยกต่างหาก `ghcr.io/openclaw/openclaw-live-test:<sha>` ต่อ commit ที่เลือกหนึ่งตัว workflow live release จะ build และ push image นั้นหนึ่งครั้ง จากนั้น shards Docker live model, Gateway ที่แยกตาม provider, CLI backend, ACP bind และ Codex harness จะรันด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` Gateway Docker shards มี `timeout` caps ระดับ script ที่ชัดเจนซึ่งต่ำกว่า workflow job timeout เพื่อให้ container หรือ cleanup path ที่ค้าง fail ได้เร็ว แทนที่จะกิน budget ของ release-check ทั้งหมด หาก shards เหล่านั้น rebuild full source Docker target แยกกันเอง release run นั้นตั้งค่าผิดและจะเสีย wall clock ไปกับ image builds ที่ซ้ำซ้อน

## การยอมรับ Package

ใช้ `Package Acceptance` เมื่อคำถามคือ "package OpenClaw ที่ติดตั้งได้นี้ทำงานเป็น product ได้หรือไม่?" สิ่งนี้แตกต่างจาก CI ปกติ: CI ปกติ validate source tree ส่วน package acceptance validate tarball เดียวผ่าน Docker E2E harness เดียวกับที่ผู้ใช้ใช้งานหลังติดตั้งหรืออัปเดต

### Jobs

1. `resolve_package` checkout `workflow_ref`, resolve package candidate หนึ่งตัว, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, อัปโหลดทั้งคู่เป็น artifact `package-under-test` และพิมพ์ source, workflow ref, package ref, version, SHA-256 และ profile ใน GitHub step summary
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` reusable workflow จะดาวน์โหลด artifact นั้น, validate inventory ของ tarball, เตรียม package-digest Docker images เมื่อจำเป็น และรัน Docker lanes ที่เลือกกับ package นั้นแทนการ pack workflow checkout เมื่อ profile เลือก `docker_lanes` แบบเจาะจงหลายตัว reusable workflow จะเตรียม package และ shared images หนึ่งครั้ง จากนั้นกระจาย lanes เหล่านั้นออกเป็น targeted Docker jobs แบบ parallel พร้อม artifacts ที่ไม่ซ้ำกัน
3. `package_telegram` เรียก `NPM Telegram Beta E2E` แบบ optional โดยจะรันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้ง artifact `package-under-test` เดียวกันเมื่อ Package Acceptance resolve ไว้แล้ว; การ dispatch Telegram แบบ standalone ยังสามารถติดตั้ง published npm spec ได้
4. `summary` ทำให้ workflow fail หาก package resolution, Docker acceptance หรือ optional Telegram lane ล้มเหลว

### แหล่งที่มาของ Candidate

- `source=npm` รับเฉพาะ `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` หรือ OpenClaw release version ที่เจาะจง เช่น `openclaw@2026.4.27-beta.2` ใช้สิ่งนี้สำหรับ acceptance ของ prerelease/stable ที่ publish แล้ว
- `source=ref` pack branch, tag หรือ full commit SHA ของ `package_ref` ที่เชื่อถือได้ resolver จะ fetch branches/tags ของ OpenClaw, ตรวจสอบว่า commit ที่เลือก reachable จากประวัติ branch ของ repository หรือ release tag, ติดตั้ง deps ใน detached worktree และ pack ด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` ดาวน์โหลด HTTPS `.tgz`; ต้องมี `package_sha256`
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งไฟล์จาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็น optional แต่ควรระบุสำหรับ artifacts ที่แชร์ภายนอก

แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือ workflow/harness code ที่เชื่อถือได้ซึ่งรัน test ส่วน `package_ref` คือ source commit ที่ถูก pack เมื่อ `source=ref` สิ่งนี้ทำให้ test harness ปัจจุบัน validate source commits ที่เชื่อถือได้รุ่นเก่าได้โดยไม่ต้องรัน workflow logic เก่า

### Suite profiles

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` รวมกับ `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunks Docker release-path เต็มรูปแบบพร้อม OpenWebUI
- `custom` — `docker_lanes` ที่เจาะจง; จำเป็นเมื่อ `suite_profile=custom`

profile `package` ใช้ coverage ของ Plugin แบบ offline เพื่อไม่ให้การ validation ของ published-package ถูก gate ด้วยความพร้อมใช้งานของ ClawHub แบบ live optional Telegram lane ใช้ artifact `package-under-test` ซ้ำใน `NPM Telegram Beta E2E` โดยเก็บเส้นทาง published npm spec ไว้สำหรับ standalone dispatches

สำหรับนโยบายเฉพาะด้าน update และการทดสอบ Plugin รวมถึง commands local,
Docker lanes, inputs ของ Package Acceptance, defaults ของ release และการ triage failure,
ดู [การทดสอบ updates และ plugins](/th/help/testing-updates-plugins)

Release checks เรียก Package Acceptance ด้วย `source=artifact`, artifact ของ release package ที่เตรียมไว้, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` และ `telegram_mode=mock-openai` วิธีนี้เก็บ proof ของ package migration, update, การล้าง stale-plugin-dependency, การซ่อม install ของ configured-plugin, offline Plugin, plugin-update และ Telegram ไว้บน package tarball เดียวกันที่ resolve แล้ว ตั้งค่า `package_acceptance_package_spec` บน Full Release Validation หรือ OpenClaw Release Checks เพื่อรัน matrix เดียวกันนั้นกับ shipped npm package แทน artifact ที่ build จาก SHA Cross-OS release checks ยังคงครอบคลุม onboarding, installer และพฤติกรรม platform ที่เฉพาะกับ OS; การ validation product ด้าน package/update ควรเริ่มจาก Package Acceptance Docker lane `published-upgrade-survivor` validate published package baseline หนึ่งตัวต่อ run ใน Package Acceptance tarball `package-under-test` ที่ resolve แล้วจะเป็น candidate เสมอ และ `published_upgrade_survivor_baseline` เลือก fallback published baseline โดย default เป็น `openclaw@latest`; failed-lane rerun commands จะ preserve baseline นั้น ตั้งค่า `published_upgrade_survivor_baselines=all-since-2026.4.23` เพื่อขยาย Full Release CI ให้ครอบคลุม stable npm release ทุกตัวตั้งแต่ `2026.4.23` ถึง `latest`; `release-history` ยังคงพร้อมสำหรับ manual wider sampling ด้วย pre-date anchor รุ่นเก่า ตั้งค่า `published_upgrade_survivor_scenarios=reported-issues` เพื่อขยาย baselines เดียวกันไปยัง fixtures ที่มีรูปแบบตาม issue สำหรับ Feishu config, preserved bootstrap/persona files, การ install Plugin ของ OpenClaw ที่ configured แล้ว, tilde log paths และ stale legacy plugin dependency roots workflow `Update Migration` ที่แยกต่างหากใช้ Docker lane `update-migration` พร้อม `all-since-2026.4.23` และ `plugin-deps-cleanup` เมื่อคำถามคือการล้าง update ของ published package แบบ exhaustive ไม่ใช่ breadth ปกติของ Full Release CI การรัน aggregate แบบ local สามารถส่ง exact package specs ด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, เก็บ lane เดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` เช่น `openclaw@2026.4.15` หรือตั้งค่า `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` สำหรับ scenario matrix published lane ตั้งค่า baseline ด้วย recipe command `openclaw config set` ที่ bake ไว้, บันทึกขั้นตอน recipe ใน `summary.json` และ probe `/healthz`, `/readyz` รวมถึง RPC status หลังเริ่ม Gateway lanes fresh ของ Windows packaged และ installer ยัง verify ด้วยว่า package ที่ติดตั้งแล้วสามารถ import browser-control override จาก raw absolute Windows path ได้ smoke ของ OpenAI cross-OS agent-turn default เป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อตั้งค่าไว้ มิฉะนั้นใช้ `openai/gpt-5.4` เพื่อให้ install และ Gateway proof อยู่บน test model GPT-5 พร้อมหลีกเลี่ยง defaults ของ GPT-4.x

### ช่วงความเข้ากันได้กับรุ่นเดิม

Package Acceptance มีช่วง legacy-compatibility ที่มีขอบเขตสำหรับ packages ที่ publish ไปแล้ว Packages จนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้ compatibility path ได้:

- รายการ QA private ที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ถูกละเว้นจาก tarball;
- `doctor-switch` อาจข้าม subcase persistence ของ `gateway install --wrapper` เมื่อ package ไม่ expose flag นั้น;
- `update-channel-switch` อาจ prune `pnpm.patchedDependencies` ที่หายไปจาก fake git fixture ที่มาจาก tarball และอาจ log `update.channel` ที่ persist ไว้หายไป;
- plugin smokes อาจอ่านตำแหน่ง install-record แบบ legacy หรือยอมรับ marketplace install-record persistence ที่หายไป;
- `plugin-update` อาจอนุญาตการ migration ของ config metadata ขณะยังคงกำหนดให้ install record และพฤติกรรม no-reinstall ต้องไม่เปลี่ยนแปลง

package `2026.4.26` ที่ publish แล้วอาจ warn สำหรับไฟล์ local build metadata stamp ที่ถูก ship ไปแล้วด้วย Packages หลังจากนั้นต้องผ่าน modern contracts; เงื่อนไขเดียวกันจะ fail แทนที่จะ warn หรือ skip

### ตัวอย่าง

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

เมื่อดีบักการรัน package acceptance ที่ล้มเหลว ให้เริ่มที่สรุป `resolve_package` เพื่อยืนยันแหล่งที่มาของแพ็กเกจ เวอร์ชัน และ SHA-256 จากนั้นตรวจสอบการรันลูก `docker_acceptance` และอาร์ติแฟกต์ Docker ของมัน: `.artifacts/docker-tests/**/summary.json`, `failures.json`, บันทึก lane, เวลาของ phase และคำสั่งรันซ้ำ ควรเลือกรัน profile แพ็กเกจที่ล้มเหลวหรือ Docker lane ที่ตรงกันซ้ำ แทนการรันการตรวจสอบ release แบบเต็มอีกครั้ง

## การทดสอบติดตั้งแบบ smoke

เวิร์กโฟลว์ `Install Smoke` ที่แยกออกมาใช้สคริปต์ขอบเขตเดียวกันซ้ำผ่าน job `preflight` ของตัวเอง โดยแยกความครอบคลุมแบบ smoke ออกเป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **เส้นทางเร็ว** รันสำหรับ pull request ที่แตะพื้นผิว Docker/แพ็กเกจ, การเปลี่ยนแปลงแพ็กเกจ/manifest ของ Plugin ที่บันเดิลมา หรือพื้นผิว core plugin/channel/gateway/Plugin SDK ที่ job Docker smoke ใช้ทดสอบ การเปลี่ยนแปลง Plugin ที่บันเดิลมาเฉพาะ source, การแก้ไขเฉพาะ test และการแก้ไขเฉพาะ docs จะไม่จอง Docker worker เส้นทางเร็วจะ build image จาก root Dockerfile หนึ่งครั้ง ตรวจสอบ CLI รัน smoke ของ CLI สำหรับลบ agents shared-workspace รัน container gateway-network e2e ตรวจสอบ build arg ของส่วนขยายที่บันเดิลมา และรัน bundled-plugin Docker profile แบบจำกัดภายใต้ timeout รวมของคำสั่ง 240 วินาที (Docker run ของแต่ละ scenario ถูกจำกัดแยกกัน)
- **เส้นทางเต็ม** เก็บความครอบคลุม QR package install และ installer Docker/update ไว้สำหรับการรันตามกำหนดการรายคืน, manual dispatch, release check แบบ workflow-call และ pull request ที่แตะพื้นผิว installer/package/Docker จริง ๆ ในโหมดเต็ม install-smoke จะเตรียมหรือนำ image smoke จาก root Dockerfile บน GHCR สำหรับ target SHA หนึ่งตัวมาใช้ซ้ำ แล้วรัน QR package install, root Dockerfile/gateway smokes, installer/update smokes และ fast bundled-plugin Docker E2E เป็น job แยกกัน เพื่อให้งาน installer ไม่ต้องรอหลัง smoke ของ root image

การ push ไปยัง `main` (รวมถึง merge commit) จะไม่บังคับเส้นทางเต็ม เมื่อ logic ขอบเขตการเปลี่ยนแปลงขอความครอบคลุมเต็มบน push เวิร์กโฟลว์จะคง fast Docker smoke ไว้และปล่อย full install smoke ให้การตรวจสอบรายคืนหรือ release validation

smoke ของ Bun global install image-provider ที่ช้าจะถูก gate แยกด้วย `run_bun_global_install_smoke` โดยรันบนกำหนดการรายคืนและจากเวิร์กโฟลว์ release checks และ manual dispatch ของ `Install Smoke` สามารถเลือกเปิดใช้ได้ แต่ pull request และการ push ไปยัง `main` จะไม่รัน การทดสอบ QR และ installer Docker ยังคงใช้ Dockerfile ที่เน้นการติดตั้งของตัวเอง

## Docker E2E ในเครื่อง

`pnpm test:docker:all` จะ prebuild image สำหรับ live-test ที่แชร์กันหนึ่งตัว pack OpenClaw เป็น npm tarball หนึ่งครั้ง และ build image `scripts/e2e/Dockerfile` ที่แชร์กันสองตัว:

- runner Node/Git เปล่าสำหรับ lane installer/update/plugin-dependency;
- image แบบ functional ที่ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lane การทำงานปกติ

นิยาม Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs` และ runner จะ execute เฉพาะ plan ที่เลือกไว้ scheduler เลือก image ต่อ lane ด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` จากนั้นรัน lane ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### ค่าที่ปรับแต่งได้

| ตัวแปร                                | ค่าเริ่มต้น | วัตถุประสงค์                                                                                   |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | จำนวน slot ของ main-pool สำหรับ lane ปกติ                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | จำนวน slot ของ tail-pool ที่ไวต่อ provider                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | เพดาน lane live ที่ทำงานพร้อมกัน เพื่อไม่ให้ provider throttle                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | เพดาน lane ติดตั้ง npm ที่ทำงานพร้อมกัน                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | เพดาน lane multi-service ที่ทำงานพร้อมกัน                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | เว้นช่วงระหว่างการเริ่ม lane เพื่อหลีกเลี่ยงพายุการ create ของ Docker daemon; ตั้ง `0` เพื่อไม่เว้นช่วง     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout fallback ต่อ lane (120 นาที); lane live/tail ที่เลือกไว้ใช้เพดานที่เข้มงวดกว่า           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` พิมพ์ plan ของ scheduler โดยไม่รัน lane                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | รายการ lane แบบ exact คั่นด้วย comma; ข้าม cleanup smoke เพื่อให้ agent ทำซ้ำ lane ที่ล้มเหลวหนึ่งรายการได้ |

lane ที่หนักกว่าเพดานที่มีผลของตัวเองยังสามารถเริ่มจาก pool ว่างได้ แล้วรันลำพังจนกว่าจะคืน capacity aggregate ในเครื่องจะ preflight Docker, ลบ container OpenClaw E2E ที่ค้างอยู่, emit สถานะ active-lane, persist เวลาของ lane เพื่อจัดลำดับ longest-first และหยุด schedule lane ใหม่ใน pool หลังความล้มเหลวแรกตามค่าเริ่มต้น

### เวิร์กโฟลว์ live/E2E ที่นำกลับมาใช้ซ้ำได้

เวิร์กโฟลว์ live/E2E ที่นำกลับมาใช้ซ้ำได้จะถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องใช้แพ็กเกจ ชนิด image, live image, lane และความครอบคลุม credential ใด จากนั้น `scripts/docker-e2e.mjs` จะแปลง plan นั้นเป็น output และ summary ของ GitHub มันจะ pack OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลดอาร์ติแฟกต์แพ็กเกจจากการรันปัจจุบัน หรือดาวน์โหลดอาร์ติแฟกต์แพ็กเกจจาก `package_artifact_run_id`; ตรวจสอบ inventory ของ tarball; build และ push image GHCR Docker E2E แบบ bare/functional ที่ติด tag ด้วย package digest ผ่าน Docker layer cache ของ Blacksmith เมื่อ plan ต้องใช้ lane ที่ติดตั้งแพ็กเกจแล้ว; และใช้ input `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรือ image ที่มี package digest อยู่แล้วซ้ำแทนการ build ใหม่ การ pull Docker image จะ retry ด้วย timeout ต่อครั้งแบบจำกัด 180 วินาที เพื่อให้ stream registry/cache ที่ค้าง retry ได้เร็ว แทนการกินเวลาส่วนใหญ่ของ critical path ใน CI

### chunk ของ release-path

ความครอบคลุม Docker สำหรับ release รันเป็น job แบบ chunk ที่เล็กกว่า โดยใช้ `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละ chunk pull เฉพาะชนิด image ที่ต้องใช้และ execute หลาย lane ผ่าน scheduler แบบถ่วงน้ำหนักเดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

chunk Docker สำหรับ release ปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` และ `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` ส่วน `plugins-runtime-core`, `plugins-runtime` และ `plugins-integrations` ยังคงเป็น alias รวมของ plugin/runtime alias ของ lane `install-e2e` ยังคงเป็น alias การรันซ้ำด้วยตนเองแบบรวมสำหรับ lane installer ของทั้งสอง provider

OpenWebUI จะถูกรวมไว้ใน `plugins-runtime-services` เมื่อความครอบคลุม release-path แบบเต็มร้องขอ และคง chunk `openwebui` แบบ standalone ไว้เฉพาะ dispatch ที่เป็น OpenWebUI-only เท่านั้น lane อัปเดต bundled-channel จะ retry หนึ่งครั้งสำหรับความล้มเหลวชั่วคราวของเครือข่าย npm

แต่ละ chunk อัปโหลด `.artifacts/docker-tests/` พร้อมบันทึก lane, timings, `summary.json`, `failures.json`, เวลาของ phase, scheduler plan JSON, ตาราง slow-lane และคำสั่งรันซ้ำต่อ lane input `docker_lanes` ของเวิร์กโฟลว์จะรัน lane ที่เลือกกับ image ที่เตรียมไว้แทน job แบบ chunk ซึ่งจำกัดการดีบัก lane ที่ล้มเหลวให้อยู่ใน Docker job เป้าหมายหนึ่งตัว และเตรียม ดาวน์โหลด หรือใช้ artifact แพ็กเกจซ้ำสำหรับการรันนั้น หาก lane ที่เลือกเป็น live Docker lane job เป้าหมายจะ build image live-test ในเครื่องสำหรับการรันซ้ำนั้น คำสั่งรันซ้ำ GitHub ต่อ lane ที่สร้างขึ้นจะรวม `package_artifact_run_id`, `package_artifact_name` และ input image ที่เตรียมไว้เมื่อค่าเหล่านั้นมีอยู่ เพื่อให้ lane ที่ล้มเหลวใช้แพ็กเกจและ image เดียวกันเป๊ะจากการรันที่ล้มเหลวได้

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

เวิร์กโฟลว์ live/E2E ตามกำหนดการรันชุด Docker release-path แบบเต็มทุกวัน

## Plugin Prerelease

`Plugin Prerelease` เป็นความครอบคลุม product/package ที่มีค่าใช้จ่ายสูงกว่า จึงเป็นเวิร์กโฟลว์แยกที่ dispatch โดย `Full Release Validation` หรือโดย operator ที่ระบุชัดเจน pull request ปกติ, การ push ไปยัง `main` และ manual CI dispatch แบบ standalone จะปิด suite นั้นไว้ มันกระจาย test ของ Plugin ที่บันเดิลมาไปยัง extension worker แปดตัว; job shard ของ extension เหล่านั้นจะรันกลุ่ม config ของ Plugin ได้สูงสุดครั้งละสองกลุ่ม โดยมี Vitest worker หนึ่งตัวต่อกลุ่มและ Node heap ที่ใหญ่ขึ้น เพื่อให้ batch ของ Plugin ที่ import หนักไม่สร้าง job CI เพิ่ม path prerelease Docker แบบ release-only จะ batch Docker lane เป้าหมายเป็นกลุ่มเล็ก ๆ เพื่อหลีกเลี่ยงการจอง runner หลายสิบตัวสำหรับ job หนึ่งถึงสามนาที

## QA Lab

QA Lab มี lane CI เฉพาะอยู่นอกเวิร์กโฟลว์ smart-scoped หลัก Agentic parity ถูกซ้อนอยู่ภายใต้ harness QA และ release แบบกว้าง ไม่ใช่เวิร์กโฟลว์ PR แบบ standalone ใช้ `Full Release Validation` พร้อม `rerun_group=qa-parity` เมื่อ parity ควรไปกับการรันการตรวจสอบแบบกว้าง

- เวิร์กโฟลว์ `QA-Lab - All Lanes` รันรายคืนบน `main` และบน manual dispatch; มันกระจาย lane mock parity, lane live Matrix และ lane live Telegram และ Discord เป็น job ขนานกัน job live ใช้ environment `qa-live-shared` และ Telegram/Discord ใช้ Convex lease

release checks รัน lane transport live ของ Matrix และ Telegram ด้วย mock provider แบบกำหนดแน่นอนและ model ที่ผ่านเกณฑ์ mock (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อแยกสัญญา channel ออกจาก latency ของ live model และการเริ่มต้น provider-plugin ปกติ live transport gateway ปิดใช้ memory search เพราะ QA parity ครอบคลุมพฤติกรรม memory แยกต่างหาก; connectivity ของ provider ถูกครอบคลุมโดย suite live model, native provider และ Docker provider ที่แยกออกมา

Matrix ใช้ `--profile fast` สำหรับ gate ตามกำหนดการและ release โดยเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout รองรับ ค่าเริ่มต้นของ CLI และ input ของเวิร์กโฟลว์ manual ยังคงเป็น `all`; manual dispatch ที่ใช้ `matrix_profile=all` จะ shard ความครอบคลุม Matrix แบบเต็มเป็น job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรัน lane QA Lab ที่สำคัญต่อ release ก่อนอนุมัติ release ด้วย; gate QA parity ของมันรัน pack candidate และ baseline เป็น job lane ขนานกัน จากนั้นดาวน์โหลด artifact ทั้งสองลงใน job report ขนาดเล็กสำหรับการเปรียบเทียบ parity สุดท้าย

สำหรับ PR ปกติ ให้ใช้หลักฐาน CI/check ตามขอบเขตแทนการถือว่า parity เป็นสถานะที่จำเป็น

## CodeQL

เวิร์กโฟลว์ `CodeQL` ตั้งใจให้เป็นตัวสแกนความปลอดภัยรอบแรกที่มีขอบเขตแคบ ไม่ใช่การกวาดตรวจทั้งรีโพซิทอรี การรันแบบรายวัน แบบแมนนวล และการรันตัวป้องกัน pull request ที่ไม่ใช่ draft จะสแกนโค้ดเวิร์กโฟลว์ Actions รวมถึงพื้นผิว JavaScript/TypeScript ที่มีความเสี่ยงสูงสุดด้วยคิวรีความปลอดภัยที่มีความมั่นใจสูง โดยกรองเฉพาะ `security-severity` ระดับสูง/วิกฤต

ตัวป้องกัน pull request จะยังคงเบา: จะเริ่มเฉพาะเมื่อมีการเปลี่ยนแปลงภายใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` หรือ `src` และจะรันเมทริกซ์ความปลอดภัยที่มีความมั่นใจสูงชุดเดียวกับเวิร์กโฟลว์ตามกำหนดเวลา CodeQL ของ Android และ macOS จะไม่อยู่ในค่าเริ่มต้นของ PR

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                         | พื้นผิว                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron และเส้นฐานของ gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการใช้งานแกนกลางของช่องทาง รวมถึงรันไทม์ Plugin ช่องทาง, gateway, Plugin SDK, secrets และจุดสัมผัส audit                    |
| `/codeql-security-high/network-ssrf-boundary`     | พื้นผิวนโยบาย SSRF ของแกนกลาง, การแยกวิเคราะห์ IP, network guard, web-fetch และ Plugin SDK                                         |
| `/codeql-security-high/mcp-process-tool-boundary` | เซิร์ฟเวอร์ MCP, ตัวช่วยการประมวลผล process, การส่งออกขาออก และประตูการรันเครื่องมือของ agent                                     |
| `/codeql-security-high/plugin-trust-boundary`     | พื้นผิวความเชื่อถือของการติดตั้ง Plugin, loader, manifest, registry, การติดตั้ง package-manager, การโหลดซอร์ส และสัญญาแพ็กเกจ Plugin SDK |

### ชาร์ดความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — ชาร์ดความปลอดภัย Android ตามกำหนดเวลา สร้างแอป Android แบบแมนนวลสำหรับ CodeQL บน Blacksmith Linux runner ที่เล็กที่สุดซึ่ง workflow sanity ยอมรับ อัปโหลดภายใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — ชาร์ดความปลอดภัย macOS แบบรายสัปดาห์/แมนนวล สร้างแอป macOS แบบแมนนวลสำหรับ CodeQL บน Blacksmith macOS กรองผลลัพธ์การ build ของ dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดภายใต้ `/codeql-critical-security/macos` เก็บไว้นอกค่าเริ่มต้นรายวันเพราะการ build macOS ใช้เวลารันมาก แม้เมื่อสะอาดก็ตาม

### หมวดหมู่ Critical Quality

`CodeQL Critical Quality` คือชาร์ดที่จับคู่กันในฝั่งที่ไม่ใช่ความปลอดภัย โดยรันเฉพาะคิวรีคุณภาพ JavaScript/TypeScript ที่ไม่ใช่ความปลอดภัยและมี severity ระดับ error บนพื้นผิวแคบที่มีมูลค่าสูง บน Blacksmith Linux runner ขนาดเล็กกว่า ตัวป้องกัน pull request ของมันจงใจให้เล็กกว่าโปรไฟล์ตามกำหนดเวลา: PR ที่ไม่ใช่ draft จะรันเฉพาะชาร์ด `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` ที่จับคู่กัน สำหรับการเปลี่ยนแปลงโค้ดการรันคำสั่ง/model/tool ของ agent และการส่ง reply, โค้ด config schema/migration/IO, โค้ด auth/secrets/sandbox/security, รันไทม์ช่องทางแกนกลางและ Plugin ช่องทางที่รวมมาด้วย, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract หรือรันไทม์ reply ของ Plugin SDK การเปลี่ยนแปลง config ของ CodeQL และเวิร์กโฟลว์คุณภาพจะรันชาร์ดคุณภาพ PR ทั้งสิบสองชาร์ด

Manual dispatch รับ:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

โปรไฟล์แคบเป็น hook สำหรับการสอน/การวนปรับ เพื่อรันชาร์ดคุณภาพหนึ่งชาร์ดแบบแยกเดี่ยว

| หมวดหมู่                                               | พื้นผิว                                                                                                                                                          |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ดขอบเขตความปลอดภัยของ Auth, secrets, sandbox, cron และ gateway                                                                                                |
| `/codeql-critical-quality/config-boundary`              | สัญญา config schema, migration, normalization และ IO                                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | สคีมา Gateway protocol และสัญญา server method                                                                                                                    |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญาการใช้งานช่องทางแกนกลางและ Plugin ช่องทางที่รวมมาด้วย                                                                                                      |
| `/codeql-critical-quality/agent-runtime-boundary`       | การรันคำสั่ง, การ dispatch model/provider, การ dispatch และคิว auto-reply และสัญญารันไทม์ control-plane ของ ACP                                                  |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | เซิร์ฟเวอร์ MCP และ tool bridges, ตัวช่วยการกำกับดูแล process และสัญญา outbound delivery                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, alias ของ memory Plugin SDK, glue สำหรับเปิดใช้งาน memory runtime และคำสั่ง memory doctor                              |
| `/codeql-critical-quality/session-diagnostics-boundary` | ภายใน reply queue, session delivery queues, ตัวช่วย binding/delivery ของ outbound session, พื้นผิว diagnostic event/log bundle และสัญญา CLI ของ session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | การ dispatch reply ขาเข้าของ Plugin SDK, ตัวช่วย reply payload/chunking/runtime, ตัวเลือก channel reply, delivery queues และตัวช่วย session/thread binding     |
| `/codeql-critical-quality/provider-runtime-boundary`    | การ normalize model catalog, provider auth และ discovery, การลงทะเบียน provider runtime, provider defaults/catalogs และ web/search/fetch/embedding registries    |
| `/codeql-critical-quality/ui-control-plane`             | การ bootstrap ของ Control UI, การคงอยู่แบบ local, control flow ของ gateway และสัญญารันไทม์ task control-plane                                                   |
| `/codeql-critical-quality/web-media-runtime-boundary`   | สัญญารันไทม์ของ core web fetch/search, media IO, media understanding, image-generation และ media-generation                                                      |
| `/codeql-critical-quality/plugin-boundary`              | สัญญา loader, registry, public-surface และ entrypoint ของ Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | ซอร์ส Plugin SDK ฝั่งแพ็กเกจที่เผยแพร่แล้ว และตัวช่วยสัญญาแพ็กเกจ Plugin                                                                                       |

Quality แยกจาก security เพื่อให้สามารถกำหนดเวลา วัดผล ปิดใช้งาน หรือขยาย findings ด้าน quality ได้โดยไม่บดบังสัญญาณด้าน security ควรเพิ่มการขยาย CodeQL สำหรับ Swift, Python และ Plugin ที่รวมมาด้วยกลับเข้ามาเป็นงานติดตามผลแบบกำหนดขอบเขตหรือแบ่งชาร์ดเท่านั้น หลังจากโปรไฟล์แคบมี runtime และสัญญาณที่เสถียรแล้ว

## เวิร์กโฟลว์บำรุงรักษา

### Docs Agent

เวิร์กโฟลว์ `Docs Agent` เป็นเลนบำรุงรักษา Codex แบบขับเคลื่อนด้วย event สำหรับทำให้เอกสารที่มีอยู่สอดคล้องกับการเปลี่ยนแปลงที่เพิ่งลงแล้ว ไม่มีตารางเวลาล้วน: การรัน CI จาก push ที่สำเร็จและไม่ใช่ bot บน `main` สามารถ trigger ได้ และ manual dispatch สามารถรันโดยตรงได้ การเรียกจาก workflow-run จะข้ามเมื่อ `main` เคลื่อนไปแล้ว หรือเมื่อมีการสร้างการรัน Docs Agent อื่นที่ไม่ถูกข้ามภายในชั่วโมงที่ผ่านมา เมื่อรัน ระบบจะตรวจสอบช่วง commit จาก source SHA ของ Docs Agent ที่ไม่ถูกข้ามครั้งก่อนถึง `main` ปัจจุบัน ดังนั้นการรันหนึ่งครั้งต่อชั่วโมงสามารถครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมมาตั้งแต่การตรวจเอกสารครั้งล่าสุด

### Test Performance Agent

เวิร์กโฟลว์ `Test Performance Agent` เป็นเลนบำรุงรักษา Codex แบบขับเคลื่อนด้วย event สำหรับการทดสอบที่ช้า ไม่มีตารางเวลาล้วน: การรัน CI จาก push ที่สำเร็จและไม่ใช่ bot บน `main` สามารถ trigger ได้ แต่จะข้ามถ้ามีการเรียก workflow-run อื่นที่รันไปแล้วหรือกำลังรันอยู่ในวัน UTC นั้น Manual dispatch จะข้ามประตู activity รายวันนี้ เลนนี้สร้างรายงานประสิทธิภาพ Vitest แบบจัดกลุ่มทั้งชุด ให้ Codex ทำได้เฉพาะการแก้ไขประสิทธิภาพการทดสอบขนาดเล็กที่ยังคง coverage ไว้ แทนการ refactor กว้าง ๆ จากนั้นรันรายงานทั้งชุดอีกครั้งและปฏิเสธการเปลี่ยนแปลงที่ลดจำนวนการทดสอบ baseline ที่ผ่าน หาก baseline มีการทดสอบล้มเหลว Codex อาจแก้ได้เฉพาะความล้มเหลวที่ชัดเจน และรายงานทั้งชุดหลัง agent ต้องผ่านก่อนจะ commit อะไรก็ตาม เมื่อ `main` เดินหน้าไปก่อนที่ bot push จะลง เลนนี้จะ rebase patch ที่ validate แล้ว รัน `pnpm check:changed` อีกครั้ง และ retry การ push; patch เก่าที่ conflict จะถูกข้าม ใช้ GitHub-hosted Ubuntu เพื่อให้ Codex action รักษาท่าทีความปลอดภัยแบบ drop-sudo เดียวกับ docs agent ได้

### PR ที่ซ้ำหลัง Merge

เวิร์กโฟลว์ `Duplicate PRs After Merge` เป็นเวิร์กโฟลว์ maintainer แบบแมนนวลสำหรับการล้างรายการซ้ำหลัง landing ค่าเริ่มต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุอย่างชัดเจนเมื่อ `apply=true` ก่อน mutating GitHub จะตรวจสอบว่า PR ที่ landed ถูก merge แล้ว และรายการซ้ำแต่ละรายการมี issue ที่อ้างอิงร่วมกัน หรือมี hunk ที่เปลี่ยนแปลงทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ประตูตรวจสอบ local และ changed routing

ตรรกะ changed-lane แบบ local อยู่ใน `scripts/changed-lanes.mjs` และถูกเรียกใช้โดย `scripts/check-changed.mjs` ประตูตรวจสอบ local นั้นเข้มงวดเรื่องขอบเขตสถาปัตยกรรมมากกว่าขอบเขตแพลตฟอร์ม CI แบบกว้าง:

- การเปลี่ยนแปลง production ของ core จะรัน typecheck ของ core prod และ core test รวมถึง core lint/guards;
- การเปลี่ยนแปลงเฉพาะ test ของ core จะรันเฉพาะ typecheck ของ core test รวมถึง core lint;
- การเปลี่ยนแปลง production ของ extension จะรัน typecheck ของ extension prod และ extension test รวมถึง extension lint;
- การเปลี่ยนแปลงเฉพาะ test ของ extension จะรัน typecheck ของ extension test รวมถึง extension lint;
- การเปลี่ยนแปลง Plugin SDK สาธารณะหรือ plugin-contract จะขยายไปยัง typecheck ของ extension เพราะ extensions พึ่งพาสัญญาแกนกลางเหล่านั้น (การกวาด Vitest extension ยังคงเป็นงานทดสอบที่ต้องเรียกอย่างชัดเจน);
- การ bump เวอร์ชันที่เป็น release metadata เท่านั้น จะรันการตรวจสอบ version/config/root-dependency แบบเจาะจง;
- การเปลี่ยนแปลง root/config ที่ไม่รู้จักจะ fail safe ไปยังทุก check lane

changed-test routing แบบ local อยู่ใน `scripts/test-projects.test-support.mjs` และจงใจให้ถูกกว่า `check:changed`: การแก้ไข test โดยตรงจะรันตัวเอง, การแก้ไขซอร์สจะเลือก mapping ที่ชัดเจนก่อน จากนั้นจึงใช้ sibling tests และ dependent จาก import-graph การกำหนดค่า shared group-room delivery เป็นหนึ่งใน mapping ที่ชัดเจน: การเปลี่ยนแปลง group visible-reply config, source reply delivery mode หรือ system prompt ของ message-tool จะ route ผ่าน core reply tests รวมถึง regressions การส่งของ Discord และ Slack เพื่อให้การเปลี่ยนค่า default ร่วมกันล้มเหลวก่อน PR push แรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างถึงระดับ harness-wide จนชุด mapped ราคาถูกไม่ใช่ proxy ที่เชื่อถือได้

## การ validate ด้วย Testbox

เรียกใช้ Testbox จากรากของรีโพ และให้เลือกใช้กล่องที่วอร์มใหม่สำหรับการพิสูจน์แบบกว้าง ก่อนใช้เวลาไปกับ gate ที่ช้าบนกล่องที่ถูกนำกลับมาใช้ซ้ำ หมดอายุ หรือเพิ่งรายงานการซิงก์ที่มีขนาดใหญ่ผิดคาด ให้เรียกใช้ `pnpm testbox:sanity` ภายในกล่องก่อน

การตรวจสอบ sanity จะล้มเหลวอย่างรวดเร็วเมื่อไฟล์รากที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short` แสดงการลบไฟล์ที่ติดตามไว้อย่างน้อย 200 รายการ โดยปกติหมายความว่าสถานะการซิงก์ระยะไกลไม่ใช่สำเนาของ PR ที่น่าเชื่อถือ ให้หยุดกล่องนั้นและวอร์มกล่องใหม่แทนการดีบักความล้มเหลวของการทดสอบผลิตภัณฑ์ สำหรับ PR ที่ตั้งใจลบไฟล์จำนวนมาก ให้ตั้งค่า `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับการตรวจสอบ sanity ครั้งนั้น

`pnpm testbox:run` ยังยุติการเรียกใช้ Blacksmith CLI ในเครื่องที่ค้างอยู่ในเฟสการซิงก์นานกว่าห้านาทีโดยไม่มีเอาต์พุตหลังซิงก์ ตั้งค่า `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` เพื่อปิดการ์ดนี้ หรือใช้ค่ามิลลิวินาทีที่มากขึ้นสำหรับ diff ในเครื่องที่มีขนาดใหญ่ผิดปกติ

Crabbox คือเส้นทางกล่องระยะไกลสำรองที่รีโพเป็นเจ้าของสำหรับการพิสูจน์บน Linux เมื่อ Blacksmith ไม่พร้อมใช้งาน หรือเมื่อควรใช้ความจุคลาวด์ที่เป็นเจ้าของเอง วอร์มกล่อง ไฮเดรตผ่านเวิร์กโฟลว์ของโปรเจกต์ แล้วเรียกใช้คำสั่งผ่าน Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` เป็นเจ้าของค่าเริ่มต้นของผู้ให้บริการ การซิงก์ และการไฮเดรต GitHub Actions โดยจะไม่รวม `.git` ในเครื่อง เพื่อให้ checkout ของ Actions ที่ถูกไฮเดรตคงข้อมูลเมตา Git ระยะไกลของตัวเองไว้ แทนการซิงก์ remotes และ object stores ในเครื่องของ maintainer และจะไม่รวมอาร์ติแฟกต์ runtime/build ในเครื่องที่ไม่ควรถูกถ่ายโอนโดยเด็ดขาด `.github/workflows/crabbox-hydrate.yml` เป็นเจ้าของ checkout, การตั้งค่า Node/pnpm, การดึง `origin/main`, และการส่งต่อ environment ที่ไม่ใช่ความลับ ซึ่งคำสั่ง `crabbox run --id <cbx_id>` ในภายหลังจะ source

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
