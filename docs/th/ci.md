---
read_when:
    - คุณต้องเข้าใจว่าเหตุใดงาน CI จึงทำงานหรือไม่ทำงาน
    - คุณกำลังแก้ไขข้อบกพร่องของการตรวจสอบ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการรันหรือการรันซ้ำเพื่อตรวจสอบความถูกต้องของรีลีส
summary: กราฟงาน CI, เกตตามขอบเขต, ชุดงานครอบคลุมการเผยแพร่ และคำสั่งภายในเครื่องที่เทียบเท่า
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-05-01T10:13:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 679913539743f9495fffa010489ec95e05ce875751afa8a93bf8bf7045d6d9de
    source_path: ci.md
    workflow: 16
---

OpenClaw CI ทำงานทุกครั้งที่ push ไปยัง `main` และทุก pull request งาน `preflight` จะจัดประเภท diff และปิดเลนที่ใช้ทรัพยากรมากเมื่อมีการเปลี่ยนเฉพาะพื้นที่ที่ไม่เกี่ยวข้อง การรัน `workflow_dispatch` แบบแมนนวลตั้งใจข้ามการกำหนดขอบเขตอัจฉริยะและกระจายไปยังกราฟเต็มสำหรับ release candidate และการตรวจสอบแบบกว้าง เลน Android ยังคงเป็นแบบเลือกใช้ผ่าน `include_android` ความครอบคลุมของ Plugin สำหรับรีลีสเท่านั้นอยู่ในเวิร์กโฟลว์ [`Plugin Prerelease`](#plugin-prerelease) แยกต่างหาก และทำงานเฉพาะจาก [`Full Release Validation`](#full-release-validation) หรือการ dispatch แบบแมนนวลโดยชัดเจนเท่านั้น

## ภาพรวม Pipeline

| งาน                              | วัตถุประสงค์                                                                                      | ทำงานเมื่อใด                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | ตรวจจับการเปลี่ยนแปลงเฉพาะเอกสาร, scope ที่เปลี่ยน, extension ที่เปลี่ยน และสร้าง CI manifest      | ทุกครั้งบน push และ PR ที่ไม่ใช่ฉบับร่าง |
| `security-scm-fast`              | ตรวจจับคีย์ส่วนตัวและตรวจสอบเวิร์กโฟลว์ผ่าน `zizmor`                                        | ทุกครั้งบน push และ PR ที่ไม่ใช่ฉบับร่าง |
| `security-dependency-audit`      | ตรวจสอบ production lockfile แบบไม่ใช้ dependency เทียบกับประกาศเตือนของ npm                             | ทุกครั้งบน push และ PR ที่ไม่ใช่ฉบับร่าง |
| `security-fast`                  | ผลรวมที่จำเป็นสำหรับงานความปลอดภัยแบบเร็ว                                                | ทุกครั้งบน push และ PR ที่ไม่ใช่ฉบับร่าง |
| `check-dependencies`             | รอบตรวจ dependency สำหรับโปรดักชันเท่านั้นด้วย Knip พร้อม guard สำหรับ allowlist ของไฟล์ที่ไม่ได้ใช้                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-artifacts`                | สร้าง `dist/`, Control UI, ตรวจ artifact ที่สร้างแล้ว และ artifact ปลายน้ำที่ใช้ซ้ำได้          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-core`               | เลนตรวจความถูกต้องบน Linux แบบเร็ว เช่น การตรวจ bundled/plugin-contract/protocol                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-contracts-channels` | ตรวจ contract ของ channel แบบแบ่ง shard พร้อมผลตรวจรวมที่เสถียร                         | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-core-test`          | shard ทดสอบ Core Node โดยยกเว้นเลน channel, bundled, contract และ extension             | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check`                          | เทียบเท่า gate หลักในเครื่องแบบแบ่ง shard: type โปรดักชัน, lint, guard, type ของ test และ smoke แบบเข้มงวด   | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check-additional`               | shard สำหรับ architecture, boundary, guard พื้นผิว extension, package-boundary และ gateway-watch | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-smoke`                    | การทดสอบ smoke ของ CLI ที่ build แล้ว และ smoke หน่วยความจำขณะเริ่มต้น                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks`                         | ตัวตรวจสอบสำหรับการทดสอบ channel ด้วย artifact ที่ build แล้ว                                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-compat-node22`      | เลน build และ smoke สำหรับความเข้ากันได้กับ Node 22                                                   | dispatch CI แบบแมนนวลสำหรับรีลีส    |
| `check-docs`                     | ตรวจรูปแบบเอกสาร, lint และลิงก์เสีย                                                | เอกสารมีการเปลี่ยนแปลง                       |
| `skills-python`                  | Ruff + pytest สำหรับ Skills ที่มี Python รองรับ                                                       | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python skill      |
| `checks-windows`                 | การทดสอบ process/path เฉพาะ Windows พร้อมการถดถอยของ runtime import specifier ที่ใช้ร่วมกัน         | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows           |
| `macos-node`                     | เลนทดสอบ TypeScript บน macOS โดยใช้ artifact ที่ build แล้วร่วมกัน                                  | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `macos-swift`                    | Swift lint, build และ test สำหรับแอป macOS                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `android`                        | การทดสอบหน่วย Android สำหรับทั้งสอง flavor พร้อม build APK debug หนึ่งรายการ                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android           |
| `test-performance-agent`         | การปรับแต่ง test ที่ช้าด้วย Codex รายวันหลังมีกิจกรรมที่เชื่อถือได้                                    | CI หลักสำเร็จหรือ dispatch แบบแมนนวล |

## ลำดับ fail-fast

1. `preflight` ตัดสินว่าเลนใดมีอยู่จริงบ้าง ตรรกะ `docs-scope` และ `changed-scope` เป็นขั้นตอนภายในงานนี้ ไม่ใช่งานแยกต่างหาก
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` จะล้มเหลวอย่างรวดเร็วโดยไม่ต้องรองาน artifact และเมทริกซ์แพลตฟอร์มที่หนักกว่า
3. `build-artifacts` ทำงานทับซ้อนกับเลน Linux แบบเร็วเพื่อให้ผู้ใช้ปลายน้ำเริ่มได้ทันทีเมื่อ build ที่ใช้ร่วมกันพร้อม
4. จากนั้นเลนแพลตฟอร์มและ runtime ที่หนักกว่าจะกระจายออกไป: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่เป็น `cancelled` เมื่อมี push ใหม่กว่าเข้ามาบน PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่าเป็นเสียงรบกวนจาก CI เว้นแต่ว่าการรันล่าสุดสำหรับ ref เดียวกันก็ยังล้มเหลวด้วย การตรวจ shard แบบรวมใช้ `!cancelled() && always()` เพื่อให้ยังรายงานความล้มเหลวของ shard ตามปกติ แต่ไม่เข้าคิวหลังจากเวิร์กโฟลว์ทั้งหมดถูกแทนที่ไปแล้ว คีย์ concurrency ของ CI อัตโนมัติมีเวอร์ชัน (`CI-v7-*`) เพื่อไม่ให้ zombie ฝั่ง GitHub ในกลุ่มคิวเก่าบล็อกการรัน main ใหม่ไปเรื่อยๆ การรัน full-suite แบบแมนนวลใช้ `CI-manual-v1-*` และไม่ยกเลิกการรันที่กำลังดำเนินอยู่

## Scope และ routing

ตรรกะ scope อยู่ใน `scripts/ci-changed-scope.mjs` และมี unit test ครอบคลุมใน `src/scripts/ci-changed-scope.test.ts` การ dispatch แบบแมนนวลข้ามการตรวจจับ changed-scope และทำให้ preflight manifest ทำงานเสมือนว่าทุกพื้นที่ที่มี scope เปลี่ยนไป

- **การแก้ไขเวิร์กโฟลว์ CI** ตรวจสอบกราฟ Node CI พร้อม workflow linting แต่ไม่ได้บังคับให้ Windows, Android หรือ native build ของ macOS ทำงานด้วยตัวเอง เลนแพลตฟอร์มเหล่านั้นยังคงกำหนด scope ตามการเปลี่ยนแปลงซอร์สของแพลตฟอร์ม
- **การแก้ไขเฉพาะ routing ของ CI, การแก้ไข fixture ของ core-test ราคาถูกบางรายการ และการแก้ไข helper/test-routing ของ plugin contract แบบแคบ** ใช้เส้นทาง manifest แบบเร็วที่เป็น Node เท่านั้น: `preflight`, security และงาน `checks-fast-core` เดียว เส้นทางนั้นข้าม build artifact, ความเข้ากันได้กับ Node 22, channel contracts, core shard เต็ม, shard ของ bundled-plugin และเมทริกซ์ guard เพิ่มเติม เมื่อการเปลี่ยนแปลงจำกัดอยู่ที่พื้นผิว routing หรือ helper ที่งานเร็วทดสอบโดยตรง
- **การตรวจ Node บน Windows** ถูกจำกัด scope ไปที่ wrapper ของ process/path เฉพาะ Windows, helper ของ npm/pnpm/UI runner, config ของ package manager และพื้นผิวเวิร์กโฟลว์ CI ที่เรียกใช้เลนนั้น การเปลี่ยนแปลงซอร์ส, plugin, install-smoke และเฉพาะ test ที่ไม่เกี่ยวข้องยังคงอยู่บนเลน Linux Node

ตระกูลทดสอบ Node ที่ช้าที่สุดถูกแยกหรือถ่วงสมดุลเพื่อให้งานแต่ละงานยังเล็กโดยไม่จอง runner เกินจำเป็น: channel contracts ทำงานเป็น shard ถ่วงน้ำหนักสามส่วน, เลน unit core ขนาดเล็กถูกจับคู่, auto-reply ทำงานเป็น worker ที่สมดุลสี่ตัว (โดย subtree ของ reply แยกเป็น shard ของ agent-runner, dispatch และ commands/state-routing) และ config ของ agentic gateway/plugin ถูกกระจายไปยังงาน agentic Node แบบ source-only ที่มีอยู่ แทนที่จะรอ artifact ที่ build แล้ว การทดสอบ browser, QA, media และ plugin เบ็ดเตล็ดแบบกว้างใช้ config Vitest เฉพาะของตนแทน catch-all plugin ที่ใช้ร่วมกัน shard แบบ include-pattern บันทึกรายการเวลาโดยใช้ชื่อ shard ของ CI เพื่อให้ `.artifacts/vitest-shard-timings.json` แยกแยะทั้ง config ทั้งชุดออกจาก shard ที่ถูกกรองได้ `check-additional` เก็บงาน compile/canary ของ package-boundary ไว้ด้วยกัน และแยก architecture ของ runtime topology ออกจาก coverage ของ gateway watch ส่วน shard ของ boundary guard รัน guard อิสระขนาดเล็กพร้อมกันภายในงานเดียว Gateway watch, การทดสอบ channel และ shard core support-boundary ทำงานพร้อมกันภายใน `build-artifacts` หลังจาก `dist/` และ `dist-runtime/` build เสร็จแล้ว

Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` แล้วจึง build Play debug APK flavor ของ third-party ไม่มี source set หรือ manifest แยกต่างหาก เลน unit-test ของมันยังคง compile flavor พร้อม flag BuildConfig ของ SMS/call-log ขณะหลีกเลี่ยงงาน packaging debug APK ซ้ำในทุก push ที่เกี่ยวข้องกับ Android

shard `check-dependencies` รัน `pnpm deadcode:dependencies` (รอบตรวจ dependency สำหรับโปรดักชันเท่านั้นด้วย Knip ที่ pin ไว้กับเวอร์ชัน Knip ล่าสุด โดยปิด minimum release age ของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบผลการค้นหาไฟล์โปรดักชันที่ไม่ได้ใช้ของ Knip กับ `scripts/deadcode-unused-files.allowlist.mjs` guard สำหรับไฟล์ที่ไม่ได้ใช้จะล้มเหลวเมื่อ PR เพิ่มไฟล์ที่ไม่ได้ใช้ใหม่ซึ่งยังไม่ได้ตรวจทาน หรือเหลือรายการ allowlist ที่ล้าสมัยไว้ ขณะยังรักษาพื้นผิว dynamic plugin, generated, build, live-test และ package bridge ที่ตั้งใจไว้ ซึ่ง Knip ไม่สามารถ resolve แบบ static ได้

## การ dispatch แบบแมนนวล

การ dispatch CI แบบแมนนวลรันกราฟงานเดียวกับ CI ปกติ แต่บังคับให้เลน scoped ที่ไม่ใช่ Android ทุกเลนเปิด: shard Linux Node, shard bundled-plugin, channel contracts, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, การตรวจ docs, Python skills, Windows, macOS และ Control UI i18n การ dispatch CI แบบแมนนวลเดี่ยวๆ จะรัน Android เฉพาะเมื่อ `include_android=true` เท่านั้น umbrella ของ full release เปิด Android โดยส่ง `include_android=true` การตรวจ static ของ plugin prerelease, shard `agentic-plugins` สำหรับรีลีสเท่านั้น, การกวาด batch extension เต็ม และเลน Docker ของ plugin prerelease ถูกแยกออกจาก CI ชุด Docker prerelease ทำงานเฉพาะเมื่อ `Full Release Validation` dispatch เวิร์กโฟลว์ `Plugin Prerelease` แยกต่างหากโดยเปิด gate release-validation

การรันแบบแมนนวลใช้กลุ่ม concurrency เฉพาะ เพื่อไม่ให้ full suite ของ release candidate ถูกยกเลิกโดย push หรือ PR run อื่นบน ref เดียวกัน input `target_ref` แบบไม่บังคับช่วยให้ผู้เรียกที่เชื่อถือได้รันกราฟนั้นกับ branch, tag หรือ commit SHA เต็ม โดยใช้ไฟล์เวิร์กโฟลว์จาก dispatch ref ที่เลือก

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## รันเนอร์

| Runner                           | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, งานและการรวมผลด้านความปลอดภัยแบบเร็ว (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจโปรโตคอล/สัญญา/รายการที่รวมมาแบบเร็ว, การตรวจสัญญาช่องทางแบบแบ่งชาร์ด, ชาร์ด `check` ยกเว้น lint, ชาร์ดและการรวมผล `check-additional`, ตัวตรวจยืนยันการรวมผลการทดสอบ Node, การตรวจเอกสาร, Skills ของ Python, workflow-sanity, labeler, auto-response; preflight ของ install-smoke ยังใช้ Ubuntu ที่โฮสต์โดย GitHub เพื่อให้เมทริกซ์ Blacksmith เข้าคิวได้เร็วขึ้น |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, ชาร์ดส่วนขยายที่น้ำหนักต่ำกว่า, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` และ `check-test-types`                                                                                                                                                                                                                                                                                                      |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, ชาร์ดการทดสอบ Linux Node, ชาร์ดการทดสอบ Plugin ที่รวมมา, `android`                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (ไวต่อ CPU มากพอที่ 8 vCPU มีต้นทุนมากกว่าที่ประหยัดได้); บิลด์ Docker ของ install-smoke (เวลารอคิว 32-vCPU มีต้นทุนมากกว่าที่ประหยัดได้)                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; fork จะ fallback ไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; fork จะ fallback ไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                           |

## คำสั่งเทียบเท่าในเครื่อง

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
```

## การตรวจสอบความถูกต้องของรุ่นเผยแพร่แบบเต็ม

`Full Release Validation` คือเวิร์กโฟลว์ครอบคลุมแบบแมนนวลสำหรับ "รันทุกอย่างก่อนเผยแพร่" โดยรับ branch, tag หรือ commit SHA แบบเต็ม, dispatch เวิร์กโฟลว์ `CI` แบบแมนนวลด้วยเป้าหมายนั้น, dispatch `Plugin Prerelease` สำหรับหลักฐานเฉพาะการเผยแพร่ของ Plugin/package/static/Docker และ dispatch `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, ชุดทดสอบ Docker release-path, live/E2E, OpenWebUI, QA Lab parity, Matrix และเลน Telegram นอกจากนี้ยังสามารถรันเวิร์กโฟลว์ `NPM Telegram Beta E2E` หลังเผยแพร่ได้เมื่อระบุสเปกแพ็กเกจที่เผยแพร่แล้ว

ดู [การตรวจสอบความถูกต้องของรุ่นเผยแพร่แบบเต็ม](/th/reference/full-release-validation) สำหรับ
เมทริกซ์ของสเตจ, ชื่องานเวิร์กโฟลว์ที่แน่นอน, ความแตกต่างของโปรไฟล์, artifacts และ
ตัวจัดการสำหรับ rerun แบบเจาะจง

`release_profile` ควบคุมขอบเขต live/provider ที่ส่งต่อไปยัง release checks
เวิร์กโฟลว์เผยแพร่แบบแมนนวลมีค่าเริ่มต้นเป็น `stable`; ใช้ `full` เฉพาะเมื่อคุณ
ตั้งใจต้องการเมทริกซ์ provider/media เชิงคำแนะนำที่ครอบคลุมกว้าง

- `minimum` คงไว้เฉพาะเลน OpenAI/core ที่เร็วที่สุดและสำคัญต่อการเผยแพร่
- `stable` เพิ่มชุด provider/backend ที่เสถียร
- `full` รันเมทริกซ์ provider/media เชิงคำแนะนำที่ครอบคลุมกว้าง

เวิร์กโฟลว์ครอบคลุมจะบันทึก id ของ child run ที่ dispatch แล้ว และงาน `Verify full validation` สุดท้ายจะตรวจสอบข้อสรุปปัจจุบันของ child run อีกครั้งและเพิ่มตารางงานที่ช้าที่สุดสำหรับ child run แต่ละรายการ หาก child workflow ถูกรันซ้ำและผ่าน ให้รันซ้ำเฉพาะงาน verifier ของ parent เพื่อรีเฟรชผลลัพธ์ของเวิร์กโฟลว์ครอบคลุมและสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รับ `rerun_group` ใช้ `all` สำหรับ release candidate, `ci` สำหรับ child ของ CI เต็มปกติเท่านั้น, `plugin-prerelease` สำหรับ child ของ plugin prerelease เท่านั้น, `release-checks` สำหรับ child ของการเผยแพร่ทุกตัว หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` หรือ `npm-telegram` บนเวิร์กโฟลว์ครอบคลุม วิธีนี้ทำให้การ rerun กล่องเผยแพร่ที่ล้มเหลวยังคงจำกัดขอบเขตหลังการแก้ไขแบบเจาะจง

`OpenClaw Release Checks` ใช้ workflow ref ที่เชื่อถือได้เพื่อ resolve ref ที่เลือกหนึ่งครั้งเป็น tarball `release-package-under-test` จากนั้นส่ง artifact นั้นไปยังทั้งเวิร์กโฟลว์ Docker สำหรับ live/E2E release-path และชาร์ด package acceptance วิธีนี้ทำให้ bytes ของแพ็กเกจสอดคล้องกันในกล่องเผยแพร่ทั้งหมดและหลีกเลี่ยงการแพ็ก candidate เดียวกันซ้ำใน child job หลายงาน

การรัน `Full Release Validation` ซ้ำสำหรับ `ref=main` และ `rerun_group=all`
จะแทนที่เวิร์กโฟลว์ครอบคลุมที่เก่ากว่า ตัวมอนิเตอร์ parent จะยกเลิก child workflow ใดก็ตามที่
dispatch ไปแล้วเมื่อ parent ถูกยกเลิก ดังนั้นการตรวจสอบความถูกต้องของ main ที่ใหม่กว่า
จะไม่ติดอยู่หลัง release-check run เก่าสองชั่วโมง การตรวจสอบ branch/tag ของรุ่นเผยแพร่
และกลุ่ม rerun แบบเจาะจงจะคง `cancel-in-progress: false`

## ชาร์ด Live และ E2E

child ของ release live/E2E ยังคงครอบคลุม `pnpm test:live` แบบ native อย่างกว้าง แต่รันเป็นชาร์ดที่มีชื่อผ่าน `scripts/test-live-shard.mjs` แทนการเป็นงาน serial เดียว:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- งาน `native-live-src-gateway-profiles` ที่กรองตาม provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- ชาร์ด media audio/video ที่แยกออก และชาร์ด music ที่กรองตาม provider

วิธีนี้คงการครอบคลุมไฟล์เดิมไว้ พร้อมทำให้ความล้มเหลวของ live provider ที่ช้ารันซ้ำและวินิจฉัยได้ง่ายขึ้น ชื่อชาร์ดรวม `native-live-extensions-o-z`, `native-live-extensions-media` และ `native-live-extensions-media-music` ยังคงใช้ได้สำหรับ rerun แบบครั้งเดียวด้วยตนเอง

ชาร์ด native live media รันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งสร้างโดยเวิร์กโฟลว์ `Live Media Runner Image` อิมเมจนั้นติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้า งาน media จึงตรวจยืนยันเฉพาะ binary ก่อน setup ให้คงชุดทดสอบ live ที่หนุนด้วย Docker ไว้บน runner Blacksmith ปกติ เพราะงาน container ไม่ใช่ที่ที่เหมาะสำหรับเปิดการทดสอบ Docker แบบซ้อน

ชาร์ด live model/backend ที่หนุนด้วย Docker ใช้อิมเมจ `ghcr.io/openclaw/openclaw-live-test:<sha>` แบบ shared แยกต่างหากต่อ commit ที่เลือก เวิร์กโฟลว์ live release จะ build และ push อิมเมจนั้นหนึ่งครั้ง จากนั้นชาร์ด Docker live model, gateway ที่แบ่งชาร์ดตาม provider, CLI backend, ACP bind และ Codex harness จะรันด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ชาร์ด Gateway Docker มีขีดจำกัด `timeout` ระดับสคริปต์ที่ระบุชัดเจนต่ำกว่า timeout ของงานเวิร์กโฟลว์ เพื่อให้ container หรือเส้นทาง cleanup ที่ค้างล้มเหลวเร็วแทนที่จะใช้ budget ของ release-check ทั้งหมด หากชาร์ดเหล่านั้น build Docker target ของซอร์สเต็มเองแยกกัน การรัน release นั้นถูกกำหนดค่าผิดและจะเสีย wall clock ไปกับการ build อิมเมจซ้ำ

## Package Acceptance

ใช้ `Package Acceptance` เมื่อคำถามคือ "แพ็กเกจ OpenClaw ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์ได้หรือไม่" ซึ่งแตกต่างจาก CI ปกติ: CI ปกติตรวจสอบ source tree ขณะที่ package acceptance ตรวจสอบ tarball เดียวผ่าน Docker E2E harness เดียวกับที่ผู้ใช้ใช้งานหลังติดตั้งหรืออัปเดต

### งาน

1. `resolve_package` เช็กเอาต์ `workflow_ref`, resolve แคนดิเดตแพ็กเกจหนึ่งรายการ, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, อัปโหลดทั้งสองเป็น artifact `package-under-test` และพิมพ์แหล่งที่มา, workflow ref, package ref, เวอร์ชัน, SHA-256 และโปรไฟล์ในสรุปขั้นตอนของ GitHub.
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test`. เวิร์กโฟลว์ที่ใช้ซ้ำได้จะดาวน์โหลด artifact นั้น, ตรวจสอบ inventory ของ tarball, เตรียมอิมเมจ Docker แบบ package-digest เมื่อจำเป็น และรัน Docker lanes ที่เลือกกับแพ็กเกจนั้นแทนการแพ็ก workflow checkout. เมื่อโปรไฟล์เลือก `docker_lanes` แบบกำหนดเป้าหมายหลายรายการ เวิร์กโฟลว์ที่ใช้ซ้ำได้จะเตรียมแพ็กเกจและอิมเมจที่ใช้ร่วมกันหนึ่งครั้ง จากนั้นกระจาย lanes เหล่านั้นออกเป็นงาน Docker แบบกำหนดเป้าหมายที่รันขนานกันพร้อม artifact ที่ไม่ซ้ำกัน.
3. `package_telegram` เรียก `NPM Telegram Beta E2E` แบบเลือกได้. งานนี้รันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้ง artifact `package-under-test` เดียวกันเมื่อ Package Acceptance resolve ได้หนึ่งรายการ; การ dispatch Telegram แบบสแตนด์อโลนยังคงติดตั้งสเปก npm ที่เผยแพร่แล้วได้.
4. `summary` ทำให้เวิร์กโฟลว์ล้มเหลวหากการ resolve แพ็กเกจ, Docker acceptance หรือ Telegram lane แบบเลือกได้ล้มเหลว.

### แหล่งที่มาของแคนดิเดต

- `source=npm` รับเฉพาะ `openclaw@beta`, `openclaw@latest` หรือเวอร์ชัน release ของ OpenClaw ที่ระบุแน่นอน เช่น `openclaw@2026.4.27-beta.2`. ใช้ตัวเลือกนี้สำหรับ acceptance ของ beta/stable ที่เผยแพร่แล้ว.
- `source=ref` แพ็ก branch, tag หรือ commit SHA แบบเต็มของ `package_ref` ที่เชื่อถือได้. resolver จะ fetch branch/tag ของ OpenClaw, ตรวจสอบว่า commit ที่เลือกเข้าถึงได้จากประวัติ branch ของ repository หรือ release tag, ติดตั้ง deps ใน worktree แบบ detached และแพ็กด้วย `scripts/package-openclaw-for-docker.mjs`.
- `source=url` ดาวน์โหลด HTTPS `.tgz`; ต้องระบุ `package_sha256`.
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งไฟล์จาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็นตัวเลือก แต่ควรระบุสำหรับ artifact ที่แชร์ภายนอก.

แยก `workflow_ref` และ `package_ref` ออกจากกัน. `workflow_ref` คือโค้ด workflow/harness ที่เชื่อถือได้ซึ่งรันการทดสอบ. `package_ref` คือ source commit ที่จะถูกแพ็กเมื่อ `source=ref`. สิ่งนี้ช่วยให้ test harness ปัจจุบันตรวจสอบ source commit เก่าที่เชื่อถือได้โดยไม่ต้องรันตรรกะเวิร์กโฟลว์เก่า.

### โปรไฟล์ชุดทดสอบ

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` บวก `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — ชุดย่อย release-path ของ Docker แบบเต็มพร้อม OpenWebUI
- `custom` — `docker_lanes` ที่ระบุแน่นอน; จำเป็นเมื่อ `suite_profile=custom`

โปรไฟล์ `package` ใช้ความครอบคลุม Plugin แบบออฟไลน์ เพื่อให้การตรวจสอบแพ็กเกจที่เผยแพร่แล้วไม่ถูกผูกกับความพร้อมใช้งานสดของ ClawHub. Telegram lane แบบเลือกได้ใช้ artifact `package-under-test` ซ้ำใน `NPM Telegram Beta E2E` โดยยังคง path สเปก npm ที่เผยแพร่แล้วไว้สำหรับ dispatch แบบสแตนด์อโลน.

Release checks เรียก Package Acceptance ด้วย `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` และ `telegram_mode=mock-openai`. ชุดย่อย release-path ของ Docker ครอบคลุม lanes แพ็กเกจ/update/Plugin ที่ทับซ้อนกัน; Package Acceptance เก็บหลักฐาน compat ของ bundled-channel แบบอิง artifact โดยตรง, Plugin ออฟไลน์ และ Telegram กับ package tarball ที่ resolve เดียวกัน. Cross-OS release checks ยังคงครอบคลุมพฤติกรรม onboarding, installer และ platform เฉพาะ OS; การตรวจสอบ product ด้าน package/update ควรเริ่มด้วย Package Acceptance. Docker lane `published-upgrade-survivor` ตรวจสอบ baseline ของแพ็กเกจที่เผยแพร่แล้วหนึ่งรายการต่อการรัน. ใน Package Acceptance, tarball `package-under-test` ที่ resolve แล้วจะเป็น candidate เสมอ และ `published_upgrade_survivor_baseline` เลือก baseline ที่เผยแพร่แล้วสำหรับ fallback โดยค่าเริ่มต้นคือ `openclaw@latest`; คำสั่ง rerun ของ lane ที่ล้มเหลวจะเก็บ baseline นั้นไว้. ตั้งค่า `published_upgrade_survivor_baselines=release-history` เพื่อขยาย lane ข้ามเมทริกซ์ประวัติที่ dedupe แล้ว: หก stable releases ล่าสุด, `2026.4.23` และ stable release ล่าสุดก่อน `2026-03-15`. ตั้งค่า `published_upgrade_survivor_scenarios=reported-issues` เพื่อขยาย baseline เดียวกันข้าม fixture ที่มีรูปตาม issue สำหรับ config/runtime-deps ของ Feishu, ไฟล์ bootstrap/persona ที่ถูกเก็บรักษาไว้, path log แบบ tilde และ root ของ runtime-deps แบบมีเวอร์ชันที่ค้างอยู่. การรัน aggregate ในเครื่องสามารถส่งสเปกแพ็กเกจที่ระบุแน่นอนด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, เก็บ lane เดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` เช่น `openclaw@2026.4.15` หรือตั้งค่า `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` สำหรับเมทริกซ์ scenario. lane ที่เผยแพร่แล้วกำหนดค่า baseline ด้วย recipe คำสั่ง `openclaw config set` ที่ฝังไว้, บันทึกขั้นตอน recipe ใน `summary.json` และ probe `/healthz`, `/readyz` รวมถึงสถานะ RPC หลัง Gateway เริ่มทำงาน. lanes fresh ของแพ็กเกจและ installer บน Windows ยังตรวจสอบด้วยว่าแพ็กเกจที่ติดตั้งแล้วสามารถ import browser-control override จาก raw absolute Windows path ได้. smoke ของ agent-turn แบบ cross-OS ของ OpenAI ใช้ค่าเริ่มต้นเป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อถูกตั้งค่า มิฉะนั้นใช้ `openai/gpt-5.4-mini` เพื่อให้หลักฐาน install และ gateway รวดเร็วและกำหนดผลได้.

### ช่วงความเข้ากันได้แบบเดิม

Package Acceptance มีช่วง legacy-compatibility ที่มีขอบเขตสำหรับแพ็กเกจที่เผยแพร่ไปแล้ว. แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้ path ความเข้ากันได้:

- รายการ QA ส่วนตัวที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ถูกละเว้นจาก tarball;
- `doctor-switch` อาจข้าม subcase การคงค่า `gateway install --wrapper` เมื่อแพ็กเกจไม่เปิดเผย flag นั้น;
- `update-channel-switch` อาจ prune `pnpm.patchedDependencies` ที่หายไปจาก fake git fixture ที่ได้จาก tarball และอาจ log `update.channel` ที่ persist ไว้แล้วแต่หายไป;
- plugin smokes อาจอ่านตำแหน่ง install-record แบบ legacy หรือยอมรับการ persist install-record ของ marketplace ที่หายไป;
- `plugin-update` อาจอนุญาตการ migration metadata ของ config ขณะที่ยังคงต้องให้ install record และพฤติกรรม no-reinstall ไม่เปลี่ยนแปลง.

แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ stamp metadata ของ local build ที่ถูกส่งไปแล้วได้ด้วย. แพ็กเกจหลังจากนั้นต้องเป็นไปตามสัญญาสมัยใหม่; เงื่อนไขเดียวกันจะ fail แทนที่จะ warn หรือ skip.

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

เมื่อ debug การรัน package acceptance ที่ล้มเหลว ให้เริ่มที่สรุปของ `resolve_package` เพื่อยืนยันแหล่งที่มาของแพ็กเกจ, เวอร์ชัน และ SHA-256. จากนั้นตรวจสอบ child run ของ `docker_acceptance` และ Docker artifacts ของมัน: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs ของ lane, เวลาของ phase และคำสั่ง rerun. ควร rerun โปรไฟล์แพ็กเกจที่ล้มเหลวหรือ Docker lanes ที่ระบุแน่นอน แทนการ rerun การตรวจสอบ release แบบเต็ม.

## Install smoke

เวิร์กโฟลว์ `Install Smoke` แยกต่างหากใช้ scope script เดียวกันซ้ำผ่านงาน `preflight` ของตัวเอง. เวิร์กโฟลว์นี้แยกความครอบคลุม smoke เป็น `run_fast_install_smoke` และ `run_full_install_smoke`.

- **Fast path** รันสำหรับ pull requests ที่แตะพื้นผิว Docker/package, การเปลี่ยนแปลงแพ็กเกจ/manifest ของ bundled Plugin หรือพื้นผิว core plugin/channel/gateway/Plugin SDK ที่งาน Docker smoke ใช้ทดสอบ. การเปลี่ยนแปลง bundled Plugin เฉพาะ source, การแก้ไขเฉพาะ test และการแก้ไขเฉพาะ docs จะไม่จอง Docker workers. Fast path สร้างอิมเมจ Dockerfile รากหนึ่งครั้ง, ตรวจสอบ CLI, รัน CLI smoke สำหรับ agents delete shared-workspace, รัน container gateway-network e2e, ตรวจสอบ build arg ของ bundled extension และรันโปรไฟล์ Docker ของ bundled-plugin แบบจำกัดภายใต้ command timeout รวม 240 วินาที (Docker run ของแต่ละ scenario ถูกจำกัดแยกกัน).
- **Full path** เก็บความครอบคลุม QR package install และ installer Docker/update สำหรับการรันตามกำหนดการทุกคืน, manual dispatches, workflow-call release checks และ pull requests ที่แตะพื้นผิว installer/package/Docker จริงๆ. ในโหมด full, install-smoke จะเตรียมหรือใช้ซ้ำอิมเมจ smoke GHCR root Dockerfile ของ target-SHA หนึ่งรายการ จากนั้นรัน QR package install, root Dockerfile/gateway smokes, installer/update smokes และ Docker E2E ของ bundled-plugin แบบ fast เป็นงานแยกกัน เพื่อให้งาน installer ไม่ต้องรอหลัง root image smokes.

push ไปยัง `main` (รวมถึง merge commits) จะไม่บังคับ full path; เมื่อตรรกะ changed-scope ขอความครอบคลุมแบบ full บน push เวิร์กโฟลว์จะเก็บ Docker smoke แบบ fast ไว้และปล่อย full install smoke ให้การตรวจสอบทุกคืนหรือ release validation.

slow Bun global install image-provider smoke ถูก gate แยกด้วย `run_bun_global_install_smoke`. งานนี้รันตามกำหนดการทุกคืนและจากเวิร์กโฟลว์ release checks และ manual `Install Smoke` dispatches สามารถเลือกเปิดใช้ได้ แต่ pull requests และ push ไปยัง `main` จะไม่รัน. การทดสอบ QR และ installer Docker เก็บ Dockerfiles ที่เน้น install ของตัวเองไว้.

## Local Docker E2E

`pnpm test:docker:all` prebuild อิมเมจ live-test ที่ใช้ร่วมกันหนึ่งรายการ, แพ็ก OpenClaw หนึ่งครั้งเป็น npm tarball และสร้างอิมเมจ `scripts/e2e/Dockerfile` ที่ใช้ร่วมกันสองรายการ:

- runner แบบ Node/Git เปล่าสำหรับ lanes installer/update/plugin-dependency;
- อิมเมจ functional ที่ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lanes ฟังก์ชันปกติ.

นิยาม Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, ตรรกะ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs` และ runner จะ execute เฉพาะแผนที่เลือก. scheduler เลือกอิมเมจต่อ lane ด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` จากนั้นรัน lanes ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### ค่าที่ปรับแต่งได้

| ตัวแปร                                | ค่าเริ่มต้น | วัตถุประสงค์                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | จำนวนสล็อตของพูลหลักสำหรับเลนปกติ                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | จำนวนสล็อตของพูลท้ายที่อ่อนไหวต่อผู้ให้บริการ                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | ขีดจำกัดเลนสดที่ทำงานพร้อมกันเพื่อไม่ให้ผู้ให้บริการลดความเร็ว                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | ขีดจำกัดเลนติดตั้ง npm ที่ทำงานพร้อมกัน                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | ขีดจำกัดเลนหลายบริการที่ทำงานพร้อมกัน                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | การหน่วงระหว่างการเริ่มเลนเพื่อหลีกเลี่ยงการสร้างงานถาโถมใส่ Docker daemon; ตั้งเป็น `0` เพื่อไม่หน่วง     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | เวลาหมดเวลาสำรองต่อเลน (120 นาที); เลนสด/ท้ายบางเลนที่เลือกใช้ขีดจำกัดที่เข้มงวดกว่า           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` พิมพ์แผนตัวจัดตารางโดยไม่เรียกใช้เลน                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | รายการเลนที่ตรงกันแบบคั่นด้วยจุลภาค; ข้ามสโมกทดสอบการล้างข้อมูลเพื่อให้เอเจนต์ทำซ้ำเลนที่ล้มเหลวเลนเดียวได้ |

เลนที่หนักกว่าขีดจำกัดที่มีผลอยู่ยังสามารถเริ่มจากพูลว่างได้ แล้วจะทำงานเพียงลำพังจนกว่าจะคืนความจุ การรวมภายในเครื่องจะตรวจสอบ Docker ก่อนเริ่ม ลบคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่ แสดงสถานะเลนที่กำลังทำงาน บันทึกเวลาของเลนเพื่อจัดลำดับจากนานที่สุดก่อน และโดยค่าเริ่มต้นจะหยุดจัดตารางเลนแบบพูลใหม่หลังจากเกิดความล้มเหลวครั้งแรก

### เวิร์กโฟลว์สด/E2E ที่ใช้ซ้ำได้

เวิร์กโฟลว์สด/E2E ที่ใช้ซ้ำได้จะถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องใช้แพ็กเกจ ชนิดอิมเมจ อิมเมจสด เลน และความครอบคลุมของข้อมูลรับรองใดบ้าง จากนั้น `scripts/docker-e2e.mjs` จะแปลงแผนนั้นเป็นเอาต์พุตและสรุปของ GitHub โดยจะ either แพ็ก OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลดอาร์ติแฟกต์แพ็กเกจจากรันปัจจุบัน หรือดาวน์โหลดอาร์ติแฟกต์แพ็กเกจจาก `package_artifact_run_id`; ตรวจสอบ inventory ของ tarball; สร้างและพุชอิมเมจ GHCR Docker E2E แบบ bare/functional ที่แท็กด้วย digest ของแพ็กเกจผ่านแคชเลเยอร์ Docker ของ Blacksmith เมื่อแผนต้องใช้เลนที่ติดตั้งจากแพ็กเกจ; และใช้อินพุต `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรืออิมเมจที่มีอยู่ซึ่งผูกกับ digest ของแพ็กเกจแทนการสร้างใหม่ การ pull อิมเมจ Docker จะลองซ้ำโดยมีเวลาหมดเวลาต่อครั้งแบบจำกัดที่ 180 วินาที เพื่อให้สตรีม registry/cache ที่ค้างลองใหม่ได้รวดเร็วแทนที่จะกินเวลาส่วนใหญ่ของเส้นทางวิกฤตใน CI

### ชังก์เส้นทางรีลีส

ความครอบคลุม Docker สำหรับรีลีสจะรันงานที่แบ่งเป็นชังก์ขนาดเล็กลงด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละชังก์ pull เฉพาะชนิดอิมเมจที่ต้องใช้ และเรียกใช้หลายเลนผ่านตัวจัดตารางแบบถ่วงน้ำหนักเดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

ชังก์ Docker สำหรับรีลีสปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` ถึง `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` และ `bundled-channels-contracts` ชังก์รวม `bundled-channels` ยังคงพร้อมใช้สำหรับการรันซ้ำแบบครั้งเดียวด้วยตนเอง และ `plugins-runtime-core`, `plugins-runtime` และ `plugins-integrations` ยังคงเป็นนามแฝงรวมสำหรับ Plugin/runtime นามแฝงเลน `install-e2e` ยังคงเป็นนามแฝงรวมสำหรับการรันซ้ำด้วยตนเองสำหรับเลนตัวติดตั้งผู้ให้บริการทั้งสอง ชังก์ `bundled-channels` จะรันเลน `bundled-channel-*` และ `bundled-channel-update-*` ที่แยกออกมา แทนเลน `bundled-channel-deps` แบบรวมทั้งหมดตามลำดับ

OpenWebUI จะถูกรวมเข้าใน `plugins-runtime-services` เมื่อความครอบคลุม release-path แบบเต็มร้องขอ และยังคงมีชังก์ `openwebui` แบบเดี่ยวเฉพาะสำหรับการ dispatch ที่เกี่ยวกับ OpenWebUI เท่านั้น เลนอัปเดต bundled-channel จะลองซ้ำหนึ่งครั้งสำหรับความล้มเหลวเครือข่าย npm ชั่วคราว

แต่ละชังก์อัปโหลด `.artifacts/docker-tests/` พร้อมล็อกเลน เวลา `summary.json`, `failures.json`, เวลาแต่ละเฟส JSON แผนตัวจัดตาราง ตารางเลนช้า และคำสั่งรันซ้ำต่อเลน อินพุต `docker_lanes` ของเวิร์กโฟลว์จะรันเลนที่เลือกกับอิมเมจที่เตรียมไว้แทนงานชังก์ ซึ่งทำให้การดีบักเลนที่ล้มเหลวจำกัดอยู่ในงาน Docker เป้าหมายเดียว และเตรียม ดาวน์โหลด หรือใช้อาร์ติแฟกต์แพ็กเกจซ้ำสำหรับรันนั้น; หากเลนที่เลือกเป็นเลน Docker แบบสด งานเป้าหมายจะสร้างอิมเมจ live-test ภายในเครื่องสำหรับการรันซ้ำนั้น คำสั่งรันซ้ำ GitHub ที่สร้างต่อเลนจะรวม `package_artifact_run_id`, `package_artifact_name` และอินพุตอิมเมจที่เตรียมไว้เมื่อมีค่าเหล่านั้น เพื่อให้เลนที่ล้มเหลวสามารถใช้แพ็กเกจและอิมเมจชุดเดียวกับรันที่ล้มเหลวได้

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

เวิร์กโฟลว์สด/E2E ตามกำหนดเวลาจะรันชุด Docker release-path แบบเต็มทุกวัน

## Plugin ก่อนรีลีส

`Plugin Prerelease` เป็นความครอบคลุมผลิตภัณฑ์/แพ็กเกจที่มีค่าใช้จ่ายสูงกว่า จึงเป็นเวิร์กโฟลว์แยกต่างหากที่ถูก dispatch โดย `Full Release Validation` หรือโดยผู้ปฏิบัติงานที่ระบุชัดเจน pull request ปกติ การ push ไปยัง `main` และการ dispatch CI ด้วยตนเองแบบเดี่ยวจะไม่เปิดชุดนี้ ชุดนี้กระจายการทดสอบ Plugin ที่รวมมาให้สมดุลใน worker ส่วนขยายแปดตัว; งาน shard ส่วนขยายเหล่านั้นจะรันกลุ่มคอนฟิก Plugin ได้สูงสุดครั้งละสองกลุ่ม โดยมี worker Vitest หนึ่งตัวต่อกลุ่มและ heap ของ Node ที่ใหญ่ขึ้น เพื่อให้แบตช์ Plugin ที่ import หนักไม่สร้างงาน CI เพิ่ม เส้นทาง Docker prerelease สำหรับรีลีสเท่านั้นจะจัดกลุ่มเลน Docker เป้าหมายเป็นกลุ่มเล็กเพื่อหลีกเลี่ยงการจอง runner หลายสิบตัวสำหรับงานที่ใช้เวลาหนึ่งถึงสามนาที

## QA Lab

QA Lab มีเลน CI เฉพาะนอกเวิร์กโฟลว์หลักที่กำหนดขอบเขตอย่างชาญฉลาด

- เวิร์กโฟลว์ `Parity gate` จะรันเมื่อ PR มีการเปลี่ยนแปลงที่ตรงกันและเมื่อ dispatch ด้วยตนเอง; โดยจะสร้าง runtime QA ส่วนตัวและเปรียบเทียบแพ็ก agentic จำลอง GPT-5.5 และ Opus 4.6
- เวิร์กโฟลว์ `QA-Lab - All Lanes` จะรันทุกคืนบน `main` และเมื่อ dispatch ด้วยตนเอง; โดยจะแยกงาน parity gate จำลอง เลน Matrix สด และเลน Telegram และ Discord สดออกเป็นงานขนาน งานสดใช้สภาพแวดล้อม `qa-live-shared` และ Telegram/Discord ใช้ lease ของ Convex

การตรวจสอบรีลีสจะรันเลนขนส่งสดของ Matrix และ Telegram ด้วยผู้ให้บริการจำลองแบบกำหนดได้และโมเดลที่ผ่าน mock (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อแยกสัญญา channel ออกจาก latency ของโมเดลสดและการเริ่มต้นปกติของ provider-plugin Gateway ขนส่งสดจะปิดการค้นหาหน่วยความจำเพราะ QA parity ครอบคลุมพฤติกรรมหน่วยความจำแยกต่างหาก; การเชื่อมต่อผู้ให้บริการถูกครอบคลุมโดยชุดโมเดลสด ผู้ให้บริการ native และผู้ให้บริการ Docker แยกต่างหาก

Matrix ใช้ `--profile fast` สำหรับเกตตามกำหนดเวลาและเกตรีลีส โดยเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout รองรับ ค่าเริ่มต้นของ CLI และอินพุตเวิร์กโฟลว์ด้วยตนเองยังคงเป็น `all`; การ dispatch ด้วยตนเองที่ `matrix_profile=all` จะแบ่งความครอบคลุม Matrix แบบเต็มเป็นงาน `transport`, `media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรันเลน QA Lab ที่สำคัญต่อรีลีสก่อนอนุมัติรีลีสด้วย; เกต QA parity ของเวิร์กโฟลว์นี้รันแพ็ก candidate และ baseline เป็นงานเลนขนาน จากนั้นดาวน์โหลดอาร์ติแฟกต์ทั้งสองไปยังงานรายงานขนาดเล็กเพื่อเปรียบเทียบ parity ขั้นสุดท้าย

อย่าวางเส้นทางการ land PR ไว้หลัง `Parity gate` เว้นแต่ว่าการเปลี่ยนแปลงจะแตะ runtime QA, parity ของ model-pack หรือพื้นผิวที่เวิร์กโฟลว์ parity เป็นเจ้าของจริง ๆ สำหรับการแก้ channel, config, เอกสาร หรือ unit-test ปกติ ให้ถือเป็นสัญญาณเสริมและใช้หลักฐาน CI/check ตามขอบเขตแทน

## CodeQL

เวิร์กโฟลว์ `CodeQL` ตั้งใจให้เป็นสแกนเนอร์ความปลอดภัยขั้นแรกแบบแคบ ไม่ใช่การกวาดทั้งรีโพซิทอรี การรันรายวัน รันด้วยตนเอง และรัน guard ของ pull request ที่ไม่ใช่ draft จะสแกนโค้ดเวิร์กโฟลว์ Actions รวมถึงพื้นผิว JavaScript/TypeScript ที่มีความเสี่ยงสูงสุด ด้วย query ความปลอดภัยความเชื่อมั่นสูงที่กรองเฉพาะ `security-severity` ระดับ high/critical

guard ของ pull request ยังเบาอยู่: จะเริ่มเฉพาะเมื่อมีการเปลี่ยนแปลงใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` หรือ `src` และจะรันเมทริกซ์ความปลอดภัยความเชื่อมั่นสูงแบบเดียวกับเวิร์กโฟลว์ตามกำหนดเวลา Android และ macOS CodeQL ไม่อยู่ในค่าเริ่มต้นของ PR

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                          | พื้นผิว                                                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, Cron และ baseline ของ Gateway                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการใช้งาน channel หลัก พร้อม runtime ของ channel Plugin, Gateway, Plugin SDK, secrets และจุดสัมผัส audit                 |
| `/codeql-security-high/network-ssrf-boundary`     | พื้นผิว SSRF หลัก, การ parse IP, network guard, web-fetch และนโยบาย SSRF ของ Plugin SDK                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | เซิร์ฟเวอร์ MCP, helper การเรียกใช้ process, การส่งออกขาออก และเกตการเรียกใช้เครื่องมือของเอเจนต์                                              |
| `/codeql-security-high/plugin-trust-boundary`     | พื้นผิว trust ของการติดตั้ง Plugin, loader, manifest, registry, การ staging runtime-dependency, การโหลด source และสัญญาแพ็กเกจ Plugin SDK |

### Shard ความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — shard ความปลอดภัย Android ตามกำหนดเวลา สร้างแอป Android ด้วยตนเองสำหรับ CodeQL บน runner Blacksmith Linux ที่เล็กที่สุดที่ workflow sanity ยอมรับ อัปโหลดใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — shard ความปลอดภัย macOS รายสัปดาห์/ด้วยตนเอง สร้างแอป macOS ด้วยตนเองสำหรับ CodeQL บน Blacksmith macOS, กรองผลลัพธ์ build ของ dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดใต้ `/codeql-critical-security/macos` เก็บไว้นอกค่าเริ่มต้นรายวันเพราะ build ของ macOS ครอบงำ runtime แม้เมื่อ clean

### หมวดหมู่คุณภาพสำคัญ

`CodeQL Critical Quality` คือ shard ที่ตรงกันสำหรับกรณีไม่ใช่ความปลอดภัย โดยรันเฉพาะ query คุณภาพ JavaScript/TypeScript ที่ไม่ใช่ความปลอดภัยและมี severity เป็น error บนพื้นผิวมูลค่าสูงแบบแคบบน runner Blacksmith Linux ที่เล็กกว่า guard ของ pull request ตั้งใจให้เล็กกว่าโปรไฟล์ตามกำหนดเวลา: PR ที่ไม่ใช่ draft จะรันเฉพาะ shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` ที่ตรงกัน สำหรับโค้ดการเรียกใช้คำสั่ง/โมเดล/เครื่องมือของเอเจนต์และการ dispatch การตอบกลับ, โค้ด schema/migration/IO ของ config, โค้ด auth/secrets/sandbox/security, runtime ของ channel หลักและ bundled channel Plugin, protocol/server-method ของ Gateway, runtime หน่วยความจำ/ส่วนเชื่อม SDK, MCP/process/การส่งออกขาออก, runtime ผู้ให้บริการ/catalog โมเดล, diagnostics ของ session/คิวส่งมอบ, loader ของ Plugin, สัญญา Plugin SDK/package หรือการเปลี่ยนแปลง runtime การตอบกลับของ Plugin SDK การเปลี่ยนแปลงคอนฟิก CodeQL และเวิร์กโฟลว์คุณภาพจะรัน shard คุณภาพ PR ทั้งสิบสองรายการ

การ dispatch ด้วยตนเองยอมรับ:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

โปรไฟล์แบบแคบเป็น hook สำหรับการสอน/การทำซ้ำ เพื่อเรียกใช้ชาร์ดคุณภาพหนึ่งรายการแบบแยกเดี่ยว

| หมวดหมู่                                                | พื้นผิว                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ดขอบเขตความปลอดภัยของการยืนยันตัวตน, ความลับ, sandbox, Cron และ Gateway                                                                                     |
| `/codeql-critical-quality/config-boundary`              | สคีมา config, การย้ายข้อมูล, การทำให้เป็นมาตรฐาน และสัญญา IO                                                                                                      |
| `/codeql-critical-quality/gateway-runtime-boundary`     | สคีมาโปรโตคอล Gateway และสัญญาเมธอดของเซิร์ฟเวอร์                                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญาการใช้งานของช่องทางแกนหลักและ Plugin ช่องทางที่รวมมาให้                                                                                                     |
| `/codeql-critical-quality/agent-runtime-boundary`       | การรันคำสั่ง, การกระจายงาน model/provider, การกระจายงานและคิว auto-reply และสัญญา runtime ของ control-plane ACP                                                  |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | เซิร์ฟเวอร์ MCP และสะพานเชื่อมเครื่องมือ, ตัวช่วยกำกับดูแลโปรเซส และสัญญาการส่งออก                                                                               |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, facade ของ memory runtime, alias ของ memory Plugin SDK, กาวเชื่อมการเปิดใช้งาน memory runtime และคำสั่ง doctor ของ memory                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | ภายในคิวตอบกลับ, คิวส่งมอบ session, ตัวช่วยผูก/ส่งมอบ outbound session, พื้นผิวบันเดิลเหตุการณ์/บันทึกวินิจฉัย และสัญญา session doctor CLI                       |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | การกระจายงานตอบกลับขาเข้าของ Plugin SDK, ตัวช่วย payload/chunking/runtime ของการตอบกลับ, ตัวเลือกการตอบกลับของช่องทาง, คิวส่งมอบ และตัวช่วยผูก session/thread    |
| `/codeql-critical-quality/provider-runtime-boundary`    | การทำให้แคตตาล็อกโมเดลเป็นมาตรฐาน, การยืนยันตัวตนและการค้นพบ provider, การลงทะเบียน provider runtime, ค่าเริ่มต้น/แคตตาล็อกของ provider และ registry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | การบูตสแตรป Control UI, การคงอยู่ภายในเครื่อง, flow ควบคุม Gateway และสัญญา runtime ของ control-plane สำหรับงาน                                                   |
| `/codeql-critical-quality/web-media-runtime-boundary`   | สัญญา runtime ของ web fetch/search แกนหลัก, media IO, การทำความเข้าใจ media, image-generation และ media-generation                                               |
| `/codeql-critical-quality/plugin-boundary`              | สัญญา entrypoint ของ loader, registry, public-surface และ Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | ซอร์ส Plugin SDK ฝั่งแพ็กเกจที่เผยแพร่แล้วและตัวช่วยสัญญาแพ็กเกจ plugin                                                                                         |

คุณภาพแยกออกจากความปลอดภัย เพื่อให้การค้นพบด้านคุณภาพสามารถจัดกำหนดการ วัดผล ปิดใช้งาน หรือขยายได้โดยไม่บดบังสัญญาณด้านความปลอดภัย ควรเพิ่มการขยาย CodeQL สำหรับ Swift, Python และ bundled-plugin กลับเข้ามาเป็นงานต่อเนื่องแบบ scoped หรือ sharded หลังจากโปรไฟล์แบบแคบมี runtime และสัญญาณที่เสถียรแล้วเท่านั้น

## เวิร์กโฟลว์การบำรุงรักษา

### เอเจนต์เอกสาร

เวิร์กโฟลว์ `Docs Agent` เป็นเลนการบำรุงรักษา Codex แบบขับเคลื่อนด้วยเหตุการณ์สำหรับรักษาเอกสารที่มีอยู่ให้สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง land แล้ว เวิร์กโฟลว์นี้ไม่มี schedule ล้วน ๆ: การรัน CI จากการ push โดยผู้ที่ไม่ใช่บอตบน `main` ที่สำเร็จสามารถทริกเกอร์ได้ และ manual dispatch สามารถรันได้โดยตรง การเรียกจาก workflow-run จะข้ามเมื่อ `main` เดินหน้าไปแล้ว หรือเมื่อมีการรัน Docs Agent อื่นที่ไม่ถูกข้ามถูกสร้างขึ้นในชั่วโมงที่ผ่านมา เมื่อรัน เวิร์กโฟลว์จะตรวจทานช่วง commit ตั้งแต่ SHA ต้นทางของ Docs Agent ที่ไม่ถูกข้ามครั้งก่อนถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงหนึ่งครั้งสามารถครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมตั้งแต่รอบเอกสารครั้งล่าสุด

### เอเจนต์ประสิทธิภาพการทดสอบ

เวิร์กโฟลว์ `Test Performance Agent` เป็นเลนการบำรุงรักษา Codex แบบขับเคลื่อนด้วยเหตุการณ์สำหรับการทดสอบที่ช้า เวิร์กโฟลว์นี้ไม่มี schedule ล้วน ๆ: การรัน CI จากการ push โดยผู้ที่ไม่ใช่บอตบน `main` ที่สำเร็จสามารถทริกเกอร์ได้ แต่จะข้ามถ้ามีการเรียก workflow-run อื่นที่รันแล้วหรือกำลังรันในวัน UTC เดียวกัน Manual dispatch จะข้ามเกตกิจกรรมรายวันนั้น เลนนี้สร้างรายงานประสิทธิภาพ Vitest แบบจัดกลุ่มทั้งชุด ให้ Codex ทำเฉพาะการแก้ไขประสิทธิภาพการทดสอบขนาดเล็กที่คง coverage ไว้แทนการ refactor กว้าง ๆ จากนั้นรันรายงานทั้งชุดอีกครั้งและปฏิเสธการเปลี่ยนแปลงที่ลดจำนวน baseline test ที่ผ่าน หาก baseline มีการทดสอบที่ล้มเหลว Codex อาจแก้ได้เฉพาะความล้มเหลวที่ชัดเจน และรายงานทั้งชุดหลังเอเจนต์ต้องผ่านก่อนที่จะ commit อะไรก็ตาม เมื่อ `main` เดินหน้าก่อนที่การ push ของบอตจะ land เลนนี้จะ rebase patch ที่ผ่านการตรวจสอบแล้ว รัน `pnpm check:changed` อีกครั้ง และลอง push ใหม่; patch เก่าที่ขัดแย้งกันจะถูกข้าม เลนนี้ใช้ Ubuntu ที่โฮสต์โดย GitHub เพื่อให้ action ของ Codex รักษาท่าทีความปลอดภัยแบบ drop-sudo เหมือนกับเอเจนต์เอกสารได้

### PR ซ้ำหลัง Merge

เวิร์กโฟลว์ `Duplicate PRs After Merge` เป็นเวิร์กโฟลว์ผู้ดูแลแบบ manual สำหรับล้างรายการซ้ำหลัง land ค่าเริ่มต้นคือ dry-run และจะปิดเฉพาะ PR ที่ระบุไว้อย่างชัดเจนเมื่อ `apply=true` ก่อนแก้ไข GitHub เวิร์กโฟลว์จะตรวจสอบว่า PR ที่ land แล้วถูก merge แล้ว และ PR ซ้ำแต่ละรายการมี issue อ้างอิงร่วมกันหรือมี hunk ที่เปลี่ยนแปลงทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## เกตการตรวจสอบในเครื่องและการกำหนดเส้นทางการเปลี่ยนแปลง

ตรรกะ changed-lane ในเครื่องอยู่ใน `scripts/changed-lanes.mjs` และถูกเรียกใช้โดย `scripts/check-changed.mjs` เกตการตรวจสอบในเครื่องนั้นเข้มงวดกับขอบเขตสถาปัตยกรรมมากกว่าขอบเขตแพลตฟอร์ม CI แบบกว้าง:

- การเปลี่ยนแปลง production แกนหลักจะรัน typecheck ของ core prod และ core test รวมถึง lint/guard ของ core;
- การเปลี่ยนแปลงเฉพาะ test ของ core จะรันเฉพาะ typecheck ของ core test รวมถึง lint ของ core;
- การเปลี่ยนแปลง production ของ extension จะรัน typecheck ของ extension prod และ extension test รวมถึง lint ของ extension;
- การเปลี่ยนแปลงเฉพาะ test ของ extension จะรัน typecheck ของ extension test รวมถึง lint ของ extension;
- การเปลี่ยนแปลง public Plugin SDK หรือสัญญา plugin จะขยายไปยัง typecheck ของ extension เพราะ extension พึ่งพาสัญญา core เหล่านั้น (การ sweep extension ด้วย Vitest ยังคงเป็นงานทดสอบที่ต้องระบุชัดเจน);
- การ bump เวอร์ชันเฉพาะ metadata ของ release จะรันการตรวจสอบเวอร์ชัน/config/root-dependency แบบเจาะจง;
- การเปลี่ยนแปลง root/config ที่ไม่รู้จักจะ fail safe ไปยังทุกเลนตรวจสอบ

การกำหนดเส้นทาง changed-test ในเครื่องอยู่ใน `scripts/test-projects.test-support.mjs` และตั้งใจให้ถูกกว่า `check:changed`: การแก้ test โดยตรงจะรันตัวเอง, การแก้ซอร์สจะเลือก mapping ที่ชัดเจนก่อน จากนั้นจึงเป็น test พี่น้องและ dependency จาก import-graph config การส่งมอบ group-room แบบแชร์เป็นหนึ่งใน mapping ที่ชัดเจน: การเปลี่ยนแปลง config visible-reply ของกลุ่ม, โหมดส่งมอบ source reply หรือ system prompt ของ message-tool จะผ่าน test การตอบกลับของ core รวมถึง regression การส่งมอบของ Discord และ Slack เพื่อให้การเปลี่ยนค่าเริ่มต้นร่วมล้มเหลวก่อนการ push PR ครั้งแรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างในระดับ harness จนชุด mapped ราคาถูกไม่น่าเชื่อถือพอจะเป็นตัวแทน

## การตรวจสอบด้วย Testbox

รัน Testbox จาก root ของ repo และควรใช้ box ที่ warm ใหม่สำหรับหลักฐานแบบกว้าง ก่อนใช้เวลาไปกับเกตช้าบน box ที่ถูกใช้ซ้ำ หมดอายุ หรือเพิ่งรายงานการ sync ที่ใหญ่ผิดคาด ให้รัน `pnpm testbox:sanity` ภายใน box ก่อน

การตรวจ sanity จะล้มเหลวเร็วเมื่อไฟล์ root ที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short` แสดงการลบ tracked อย่างน้อย 200 รายการ โดยปกตินั่นหมายถึงสถานะ sync ระยะไกลไม่ใช่สำเนา PR ที่น่าเชื่อถือ ให้หยุด box นั้นและ warm box ใหม่แทนการ debug ความล้มเหลวของ product test สำหรับ PR ที่ตั้งใจลบจำนวนมาก ให้ตั้งค่า `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับการรัน sanity นั้น

`pnpm testbox:run` ยังจะยุติการเรียก Blacksmith CLI ในเครื่องที่ค้างอยู่ในเฟส sync นานกว่าห้านาทีโดยไม่มี output หลัง sync ตั้งค่า `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` เพื่อปิด guard นั้น หรือใช้ค่า millisecond ที่มากขึ้นสำหรับ diff ในเครื่องที่ใหญ่ผิดปกติ

Crabbox เป็นเส้นทาง remote-box ที่ repo เป็นเจ้าของเส้นทางที่สองสำหรับหลักฐานบน Linux เมื่อ Blacksmith ใช้ไม่ได้ หรือเมื่อต้องการใช้ capacity บนคลาวด์ที่เป็นเจ้าของ Warm box, hydrate ผ่านเวิร์กโฟลว์ของโปรเจกต์ แล้วรันคำสั่งผ่าน Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` เป็นเจ้าของค่าเริ่มต้นของ provider, sync และการ hydrate ผ่าน GitHub Actions โดย exclude `.git` ในเครื่องเพื่อให้ checkout ของ Actions ที่ hydrate แล้วรักษา metadata Git ระยะไกลของตัวเอง แทนที่จะ sync remote และ object store ในเครื่องของผู้ดูแล และ exclude artifact ของ runtime/build ในเครื่องที่ไม่ควรถูกถ่ายโอน `.github/workflows/crabbox-hydrate.yml` เป็นเจ้าของ checkout, การตั้งค่า Node/pnpm, การ fetch `origin/main` และการส่งต่อ environment ที่ไม่ใช่ secret ซึ่งคำสั่ง `crabbox run --id <cbx_id>` ภายหลังจะ source

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
