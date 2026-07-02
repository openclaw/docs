---
read_when:
    - คุณต้องเข้าใจว่าเหตุใดงาน CI จึงทำงานหรือไม่ทำงาน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการรันหรือลองรันการตรวจสอบความถูกต้องของรีลีสซ้ำ
    - คุณกำลังเปลี่ยนการ dispatch ของ ClawSweeper หรือการส่งต่อกิจกรรม GitHub
summary: กราฟงาน CI, เกตขอบเขต, กลุ่มงานรวมสำหรับรีลีส และคำสั่งเทียบเท่าสำหรับใช้งานภายในเครื่อง
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-07-02T14:12:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc5ce77eadea695e98926326767dde4c8ea2d19c69a4c782d164e0f87201b227
    source_path: ci.md
    workflow: 16
---

OpenClaw CI ทำงานทุกครั้งที่ push ไปยัง `main` และทุก pull request การ push ไปยัง `main` ที่เป็น canonical
จะผ่านหน้าต่างรับงาน hosted-runner 90 วินาทีก่อน
กลุ่ม concurrency `CI` ที่มีอยู่จะยกเลิกรันที่กำลังรอนั้นเมื่อมี
commit ใหม่กว่าเข้ามา ดังนั้นการ merge ต่อเนื่องกันจะไม่ลงทะเบียนเมทริกซ์ Blacksmith
เต็มชุดทุกครั้ง Pull request และการ dispatch ด้วยตนเองจะข้ามการรอ งาน `preflight`
จะจัดประเภท diff จากนั้นปิด lane ที่มีค่าใช้จ่ายสูงเมื่อมีเฉพาะพื้นที่
ที่ไม่เกี่ยวข้องเปลี่ยนแปลง การรัน `workflow_dispatch` ด้วยตนเองจงใจข้าม smart
scoping และกระจายงานเป็นกราฟเต็มสำหรับ release candidate และการตรวจสอบแบบกว้าง
lane Android ยังคงเป็นแบบ opt-in ผ่าน `include_android` ความครอบคลุม Plugin เฉพาะ release
อยู่ใน workflow [`Plugin Prerelease`](#plugin-prerelease) แยกต่างหาก
และจะรันจาก [`Full Release Validation`](#full-release-validation)
หรือการ dispatch ด้วยตนเองอย่างชัดเจนเท่านั้น

## ภาพรวม Pipeline

| งาน                                | วัตถุประสงค์                                                                                                   | เวลาที่รัน                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | ตรวจจับการเปลี่ยนแปลงเฉพาะ docs, scope ที่เปลี่ยนแปลง, extension ที่เปลี่ยนแปลง และสร้าง CI manifest                   | เสมอใน push และ PR ที่ไม่ใช่ draft                  |
| `runner-admission`                 | debounce 90 วินาทีบน hosted-runner สำหรับ push ไปยัง `main` แบบ canonical ก่อนลงทะเบียนงาน Blacksmith                | ทุกการรัน CI; sleep เฉพาะ push ไปยัง `main` แบบ canonical |
| `security-fast`                    | ตรวจจับ private key, audit workflow ที่เปลี่ยนผ่าน `zizmor`, และ audit lockfile สำหรับ production                 | เสมอใน push และ PR ที่ไม่ใช่ draft                  |
| `check-dependencies`               | รอบตรวจ Knip เฉพาะ dependency สำหรับ production พร้อม guard allowlist ของไฟล์ที่ไม่ได้ใช้                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `build-artifacts`                  | build `dist/`, Control UI, smoke check CLI ที่ build แล้ว, check built-artifact แบบฝัง, และ artifact ที่ใช้ซ้ำได้ | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-fast-core`                 | lane ตรวจความถูกต้องบน Linux แบบเร็ว เช่น bundled, protocol, QA Smoke CI, และ check การ routing ของ CI                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-fast-contracts-plugins-*`  | check สัญญา Plugin แบบแบ่ง shard สองชุด                                                                        | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-fast-contracts-channels-*` | check สัญญา channel แบบแบ่ง shard สองชุด                                                                       | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-node-core-*`               | shard ทดสอบ Node core โดยไม่รวม lane channel, bundled, contract, และ extension                          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `check-*`                          | เทียบเท่า local gate หลักแบบแบ่ง shard: prod types, lint, guards, test types, และ strict smoke                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `check-additional-*`               | สถาปัตยกรรม, boundary/prompt drift แบบแบ่ง shard, extension guards, package boundary, และ runtime topology     | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-node-compat-node22`        | lane build และ smoke สำหรับความเข้ากันได้กับ Node 22                                                                | การ dispatch CI ด้วยตนเองสำหรับ release                     |
| `check-docs`                       | check การจัดรูปแบบ docs, lint, และลิงก์เสีย                                                             | docs เปลี่ยนแปลง                                        |
| `skills-python`                    | Ruff + pytest สำหรับ skills ที่รองรับด้วย Python                                                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python-skill                       |
| `checks-windows`                   | test เฉพาะ Windows สำหรับ process/path พร้อม regression ของ shared runtime import specifier                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows                            |
| `macos-node`                       | lane ทดสอบ TypeScript บน macOS โดยใช้ built artifact ที่ใช้ร่วมกัน                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS                              |
| `macos-swift`                      | Swift lint, build, และ test สำหรับแอป macOS                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS                              |
| `ios-build`                        | สร้างโปรเจกต์ Xcode พร้อม build แอป iOS simulator                                                 | แอป iOS, shared app kit, หรือ Swabble เปลี่ยนแปลง         |
| `android`                          | unit test Android สำหรับทั้งสอง flavor พร้อม build debug APK หนึ่งชุด                                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android                            |
| `test-performance-agent`           | การปรับ slow-test ของ Codex รายวันหลังมีกิจกรรมที่ trusted                                                 | CI หลักสำเร็จหรือ dispatch ด้วยตนเอง                  |
| `openclaw-performance`             | รายงานประสิทธิภาพ runtime ของ Kova แบบรายวัน/ตามต้องการ พร้อม lane mock-provider, deep-profile, และ GPT 5.5 live | ตามกำหนดเวลาและ dispatch ด้วยตนเอง                       |

## ลำดับ Fail-fast

1. `runner-admission` รอเฉพาะ push ไปยัง `main` แบบ canonical; push ใหม่กว่าจะยกเลิกรันก่อนการลงทะเบียน Blacksmith
2. `preflight` ตัดสินใจว่า lane ใดจะมีอยู่เลย logic `docs-scope` และ `changed-scope` เป็นขั้นตอนภายในงานนี้ ไม่ใช่งานแยกต่างหาก
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, และ `skills-python` ล้มเหลวได้อย่างรวดเร็วโดยไม่ต้องรอ artifact และงานเมทริกซ์ platform ที่หนักกว่า
4. `build-artifacts` ทำงานซ้อนกับ lane Linux แบบเร็ว เพื่อให้ consumer ปลายทางเริ่มได้ทันทีที่ shared build พร้อม
5. lane platform และ runtime ที่หนักกว่าจะกระจายงานหลังจากนั้น: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, และ `android`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่เป็น `cancelled` เมื่อมี push ใหม่กว่ามาที่ PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่านั่นเป็นสัญญาณรบกวนของ CI เว้นแต่รันใหม่ล่าสุดสำหรับ ref เดียวกันจะล้มเหลวด้วย งานเมทริกซ์ใช้ `fail-fast: false` และ `build-artifacts` รายงานความล้มเหลวของ embedded channel, core-support-boundary, และ gateway-watch โดยตรงแทนที่จะคิวงาน verifier ขนาดเล็ก คีย์ concurrency ของ CI อัตโนมัติถูก version ไว้ (`CI-v7-*`) เพื่อให้ zombie ฝั่ง GitHub ในกลุ่มคิวเก่าไม่สามารถบล็อกรัน main ใหม่กว่าได้ไม่มีกำหนด รัน full-suite ด้วยตนเองใช้ `CI-manual-v1-*` และไม่ยกเลิกรันที่กำลังดำเนินอยู่

ใช้ `pnpm ci:timings`, `pnpm ci:timings:recent`, หรือ `node scripts/ci-run-timings.mjs <run-id>` เพื่อสรุป wall time, queue time, งานที่ช้าที่สุด, ความล้มเหลว, และ barrier fanout `pnpm-store-warmup` จาก GitHub Actions CI ยังอัปโหลดสรุปรันเดียวกันเป็น artifact `ci-timings-summary` ด้วย สำหรับ timing ของ build ให้ตรวจขั้นตอน `Build dist` ของงาน `build-artifacts`: `pnpm build:ci-artifacts` พิมพ์ `[build-all] phase timings:` และรวม `ui:build`; งานยังอัปโหลด artifact `startup-memory` ด้วย

สำหรับรันของ pull request งาน timing-summary สุดท้ายจะรัน helper จาก revision ฐานที่ trusted ก่อนส่ง `GH_TOKEN` ให้ `gh run view` วิธีนี้เก็บ query ที่มี token ออกจากโค้ดที่ branch ควบคุม ขณะที่ยังสรุปรัน CI ปัจจุบันของ pull request ได้

## บริบท PR และหลักฐาน

PR จาก contributor ภายนอกจะรัน gate บริบท PR และหลักฐานจาก
`.github/workflows/real-behavior-proof.yml` workflow จะ checkout base commit ที่ trusted
และประเมินเฉพาะ body ของ PR; จะไม่ execute โค้ดจาก
branch ของ contributor

gate ใช้กับผู้เขียน PR ที่ไม่ใช่เจ้าของ repository, member,
collaborator, หรือ bot โดยจะผ่านเมื่อ body ของ PR มี section
`What Problem This Solves` และ `Evidence` ที่ผู้เขียนเขียนเอง หลักฐานอาจเป็น
test ที่เจาะจง, ผล CI, screenshot, recording, terminal output, การสังเกตแบบ live,
log ที่ redacted, หรือลิงก์ artifact body ให้เจตนาและการตรวจสอบที่มีประโยชน์;
reviewer จะตรวจโค้ด, test, และ CI เพื่อประเมินความถูกต้อง

เมื่อ check ล้มเหลว ให้อัปเดต body ของ PR แทนการ push code commit เพิ่ม

## Scope และ routing

logic ของ scope อยู่ใน `scripts/ci-changed-scope.mjs` และครอบคลุมด้วย unit test ใน `src/scripts/ci-changed-scope.test.ts` การ dispatch ด้วยตนเองจะข้ามการตรวจจับ changed-scope และทำให้ preflight manifest ทำเหมือนว่าทุกพื้นที่ที่มี scope เปลี่ยนแปลง

- **การแก้ไข CI workflow** ตรวจสอบกราฟ Node CI พร้อม workflow linting แต่ไม่บังคับ Windows, iOS, Android, หรือ native build ของ macOS ด้วยตัวเอง; lane platform เหล่านั้นยังคงถูกจำกัด scope ตามการเปลี่ยนแปลง source ของ platform
- **Workflow Sanity** รัน `actionlint`, `zizmor` กับไฟล์ YAML workflow ทั้งหมด, guard composite-action interpolation, และ guard conflict-marker งาน `security-fast` ที่ scoped ตาม PR ยังรัน `zizmor` กับไฟล์ workflow ที่เปลี่ยน เพื่อให้ finding ด้านความปลอดภัยของ workflow ล้มเหลวเร็วในกราฟ CI หลัก
- **Docs บน push ไปยัง `main`** ถูกตรวจโดย workflow `Docs` แบบ standalone ด้วย mirror docs ของ ClawHub เดียวกับที่ CI ใช้ ดังนั้น push แบบผสม code+docs จะไม่คิว shard `check-docs` ของ CI เพิ่ม Pull request และ CI ด้วยตนเองยังรัน `check-docs` จาก CI เมื่อ docs เปลี่ยน
- **TUI PTY** รันใน shard Linux Node `checks-node-core-runtime-tui-pty` สำหรับการเปลี่ยนแปลง TUI shard รัน `test/vitest/vitest.tui-pty.config.ts` พร้อม `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` จึงครอบคลุมทั้ง lane fixture `TuiBackend` แบบ deterministic และ smoke `tui --local` ที่ช้ากว่า ซึ่ง mock เฉพาะ endpoint model ภายนอก
- **การแก้ไขเฉพาะ routing ของ CI, การแก้ไข fixture core-test ราคาถูกบางรายการ, และการแก้ไข helper/test-routing ของสัญญา Plugin แบบแคบ** ใช้เส้นทาง manifest แบบ Node-only ที่เร็ว: `preflight`, security, และ task `checks-fast-core` เพียงรายการเดียว เส้นทางนั้นข้าม build artifact, ความเข้ากันได้กับ Node 22, สัญญา channel, shard core เต็ม, shard bundled-plugin, และเมทริกซ์ guard เพิ่มเติม เมื่อการเปลี่ยนแปลงจำกัดอยู่ที่พื้นผิว routing หรือ helper ที่ task แบบเร็ว exercise โดยตรง
- **Windows Node checks** ถูกจำกัด scope ไปที่ wrapper process/path เฉพาะ Windows, helper runner ของ npm/pnpm/UI, config package manager, และพื้นผิว CI workflow ที่ execute lane นั้น; source, Plugin, install-smoke, และการเปลี่ยนแปลงเฉพาะ test ที่ไม่เกี่ยวข้องยังอยู่บน lane Linux Node

กลุ่มการทดสอบ Node ที่ช้าที่สุดถูกแยกหรือถ่วงสมดุลเพื่อให้แต่ละงานยังมีขนาดเล็กโดยไม่จอง runner มากเกินไป: สัญญา Plugin และสัญญา channel แต่ละรายการรันเป็นชาร์ดแบบถ่วงน้ำหนักสองชาร์ดที่รองรับด้วย Blacksmith พร้อม fallback มาตรฐานไปยัง GitHub runner, เลน core unit fast/support รันแยกกัน, core runtime infra ถูกแยกระหว่าง state, process/config, shared และชาร์ดโดเมน cron สามชาร์ด, auto-reply รันเป็น worker แบบถ่วงสมดุล (โดยแยก subtree ของ reply เป็นชาร์ด agent-runner, dispatch และ commands/state-routing) และ config ของ agentic gateway/server ถูกแยกข้ามเลน chat/auth/model/http-plugin/runtime/startup แทนการรอ artifact ที่ build แล้ว จากนั้น CI ปกติจะจัดแพ็กเฉพาะชาร์ด include-pattern ของ infra ที่แยกโดดเดี่ยวให้เป็น bundle แบบกำหนดแน่นอนที่มีไฟล์ทดสอบไม่เกิน 64 ไฟล์ ลดเมทริกซ์ Node โดยไม่รวมชุด command/cron ที่ไม่แยกโดดเดี่ยว, agents-core ที่มีสถานะ หรือ gateway/server เข้าด้วยกัน; ชุดหนักที่กำหนดตายตัวยังคงอยู่บน 8 vCPU ขณะที่เลนแบบ bundle และน้ำหนักต่ำกว่าใช้ 4 vCPU Pull request บน repository หลักใช้แผน admission แบบกระชับเพิ่มเติม: กลุ่มต่อ config เดียวกันรันใน subprocess ที่แยกโดดเดี่ยวภายในแผน Linux Node 34 งานปัจจุบัน ดังนั้น PR เดียวจึงไม่ลงทะเบียนเมทริกซ์ Node เต็มที่มีงานมากกว่า 70 งาน การ push ไปยัง `main`, manual dispatch และ release gate ยังคงใช้เมทริกซ์เต็ม การทดสอบ browser, QA, media และ Plugin จิปาถะขนาดกว้างใช้ config Vitest เฉพาะของตัวเองแทน catch-all ของ Plugin ร่วม ชาร์ด include-pattern บันทึกรายการ timing โดยใช้ชื่อชาร์ด CI เพื่อให้ `.artifacts/vitest-shard-timings.json` แยกได้ระหว่าง config ทั้งชุดกับชาร์ดที่ถูกกรอง `check-additional-*` เก็บงาน compile/canary ตาม boundary ของ package ไว้ด้วยกัน และแยกสถาปัตยกรรม topology ของ runtime ออกจาก coverage ของ gateway watch; รายการ boundary guard ถูกแบ่งเป็นแถบเป็นชาร์ดที่หนักด้าน prompt หนึ่งชาร์ด และชาร์ดรวมอีกหนึ่งชาร์ดสำหรับแถบ guard ที่เหลือ โดยแต่ละชาร์ดรัน guard อิสระที่เลือกไว้พร้อมกันและพิมพ์ timing ต่อ check การตรวจ drift ของ prompt snapshot เส้นทางสำเร็จของ Codex ที่มีต้นทุนสูงรันเป็นงานเพิ่มเติมของตัวเองสำหรับ CI แบบ manual และเฉพาะการเปลี่ยนแปลงที่กระทบ prompt เท่านั้น ดังนั้นการเปลี่ยนแปลง Node ที่ไม่เกี่ยวข้องตามปกติจะไม่ต้องรออยู่หลังการสร้าง prompt snapshot แบบ cold และชาร์ด boundary ยังคงสมดุล ขณะที่ prompt drift ยังถูกผูกกับ PR ที่ทำให้เกิด drift นั้น; flag เดียวกันจะข้ามการสร้าง prompt snapshot ของ Vitest ภายในชาร์ด core support-boundary ที่ใช้ artifact ที่ build แล้ว Gateway watch, การทดสอบ channel และชาร์ด core support-boundary รันพร้อมกันภายใน `build-artifacts` หลังจาก `dist/` และ `dist-runtime/` ถูก build แล้ว

เมื่อผ่าน admission แล้ว CI ของ Linux บน repository หลักอนุญาตงานทดสอบ Node พร้อมกันได้สูงสุด 24 งาน และ 12 งานสำหรับเลน fast/check ที่เล็กกว่า; Windows และ Android ยังคงอยู่ที่สองเพราะ pool ของ runner เหล่านั้นแคบกว่า

แผน PR แบบกระชับปล่อยงาน Node 18 งานสำหรับชุดปัจจุบัน: กลุ่ม whole-config ถูก batch ใน subprocess ที่แยกโดดเดี่ยวพร้อม timeout ของ batch 120 นาที ขณะที่กลุ่ม include-pattern ใช้งบงานที่มีขอบเขตเดียวกัน

Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` แล้วจึง build APK debug ของ Play flavor third-party ไม่มี source set หรือ manifest แยกต่างหาก; เลน unit-test ของมันยังคง compile flavor ด้วย flag BuildConfig สำหรับ SMS/call-log ขณะที่หลีกเลี่ยงงาน package APK debug ซ้ำในทุก push ที่เกี่ยวข้องกับ Android

ชาร์ด `check-dependencies` รัน `pnpm deadcode:dependencies` (pass แบบ production ของ Knip ที่ตรวจเฉพาะ dependency ตรึงกับ Knip เวอร์ชันล่าสุด โดยปิดอายุ release ขั้นต่ำของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบ findings ของ Knip เรื่องไฟล์ที่ไม่ถูกใช้ใน production กับ `scripts/deadcode-unused-files.allowlist.mjs` guard ของไฟล์ที่ไม่ถูกใช้จะล้มเหลวเมื่อ PR เพิ่มไฟล์ที่ไม่ถูกใช้รายการใหม่ซึ่งยังไม่ผ่านการ review หรือปล่อยรายการ allowlist ที่ stale ไว้ ขณะที่ยังคงรักษา surface แบบ dynamic Plugin, generated, build, live-test และ package bridge ที่ตั้งใจไว้ซึ่ง Knip ไม่สามารถ resolve แบบ static ได้

## การส่งต่อกิจกรรมของ ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` คือ bridge ฝั่งเป้าหมายจากกิจกรรมของ repository OpenClaw เข้าไปยัง ClawSweeper มันไม่ checkout หรือ execute โค้ด pull request ที่ไม่น่าเชื่อถือ workflow สร้าง GitHub App token จาก `CLAWSWEEPER_APP_PRIVATE_KEY` แล้ว dispatch payload `repository_dispatch` แบบกระชับไปยัง `openclaw/clawsweeper`

workflow มีสี่เลน:

- `clawsweeper_item` สำหรับคำขอ review issue และ pull request แบบเจาะจง;
- `clawsweeper_comment` สำหรับคำสั่ง ClawSweeper ที่ระบุชัดเจนใน comment ของ issue;
- `clawsweeper_commit_review` สำหรับคำขอ review ระดับ commit บนการ push ไปยัง `main`;
- `github_activity` สำหรับกิจกรรม GitHub ทั่วไปที่ agent ของ ClawSweeper อาจตรวจสอบ

เลน `github_activity` ส่งต่อเฉพาะ metadata ที่ normalize แล้ว: ประเภท event, action, actor, repository, หมายเลข item, URL, title, state และ excerpt สั้นสำหรับ comment หรือ review เมื่อมี มันจงใจหลีกเลี่ยงการส่งต่อ body ของ Webhook ทั้งหมด workflow ฝั่งรับใน `openclaw/clawsweeper` คือ `.github/workflows/github-activity.yml` ซึ่งโพสต์ event ที่ normalize แล้วไปยัง hook ของ OpenClaw Gateway สำหรับ agent ของ ClawSweeper

กิจกรรมทั่วไปคือการสังเกต ไม่ใช่การส่งโดยปริยาย agent ของ ClawSweeper ได้รับเป้าหมาย Discord ใน prompt และควรโพสต์ไปที่ `#clawsweeper` เฉพาะเมื่อ event นั้นน่าประหลาดใจ ดำเนินการได้ มีความเสี่ยง หรือมีประโยชน์เชิงปฏิบัติการ การเปิด แก้ไข ความเคลื่อนไหวจาก bot สัญญาณรบกวน Webhook ซ้ำ และ traffic review ปกติควรให้ผลลัพธ์เป็น `NO_REPLY`

ปฏิบัติต่อ title, comment, body, ข้อความ review, ชื่อ branch และ commit message ของ GitHub เป็นข้อมูลที่ไม่น่าเชื่อถือตลอดเส้นทางนี้ สิ่งเหล่านี้เป็น input สำหรับการสรุปและ triage ไม่ใช่คำสั่งสำหรับ workflow หรือ runtime ของ agent

## Manual dispatch

Manual CI dispatch รัน graph งานเดียวกับ CI ปกติ แต่บังคับเปิดทุกเลน scoped ที่ไม่ใช่ Android: ชาร์ด Linux Node, ชาร์ด bundled-plugin, ชาร์ดสัญญา Plugin และ channel, ความเข้ากันได้กับ Node 22, `check-*`, `check-additional-*`, การตรวจ smoke ด้วย artifact ที่ build แล้ว, การตรวจ docs, Python skills, Windows, macOS, iOS build และ Control UI i18n Manual CI dispatch แบบ standalone รันเฉพาะ Android ด้วย `include_android=true`; release umbrella เต็มเปิด Android โดยส่ง `include_android=true` การตรวจ static สำหรับ Plugin prerelease, ชาร์ด `agentic-plugins` เฉพาะ release, sweep batch extension เต็ม และเลน Docker สำหรับ Plugin prerelease ถูกแยกออกจาก CI ชุด Docker prerelease จะรันเฉพาะเมื่อ `Full Release Validation` dispatch workflow `Plugin Prerelease` แยกต่างหากพร้อมเปิด gate release-validation

การรันแบบ manual ใช้ concurrency group ที่ไม่ซ้ำกัน เพื่อไม่ให้ชุดเต็มของ release-candidate ถูกยกเลิกโดยการ push หรือ PR run อื่นบน ref เดียวกัน input `target_ref` ที่เป็น optional ช่วยให้ caller ที่เชื่อถือได้รัน graph นั้นกับ branch, tag หรือ commit SHA เต็ม โดยใช้ไฟล์ workflow จาก dispatch ref ที่เลือกไว้

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                          | งาน                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Manual CI dispatch และ fallback ของ repository ที่ไม่ใช่ canonical, การสแกนคุณภาพ CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow docs นอก CI และ install-smoke preflight เพื่อให้เมทริกซ์ Blacksmith เข้าคิวได้เร็วขึ้น                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, ชาร์ด extension น้ำหนักต่ำกว่า, `checks-fast-core`, ชาร์ดสัญญา Plugin/channel, ชาร์ด Linux Node แบบ bundled/น้ำหนักต่ำกว่าส่วนใหญ่, `check-guards`, `check-prod-types`, `check-test-types`, ชาร์ด `check-additional-*` ที่เลือกไว้ และ `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | ชุด Linux Node หนักที่คงไว้, ชาร์ด `check-additional-*` ที่หนักด้าน boundary/extension และ `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (ไวต่อ CPU มากพอที่ 8 vCPU มีต้นทุนมากกว่าที่ประหยัดได้); Docker build ของ install-smoke (เวลาคิว 32-vCPU มีต้นทุนมากกว่าที่ประหยัดได้)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` บน `openclaw/openclaw`; fork fallback ไปที่ `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` และ `ios-build` บน `openclaw/openclaw`; fork fallback ไปที่ `macos-26`                                                                                                                                                                                                  |

## งบประมาณการลงทะเบียน runner

bucket การลงทะเบียน runner ของ GitHub ปัจจุบันของ OpenClaw รายงานการลงทะเบียน runner แบบ self-hosted 10,000 รายการต่อ 5 นาทีใน `ghx api rate_limit` ตรวจสอบ `actions_runner_registration` ซ้ำก่อนการปรับจูนแต่ละครั้ง เพราะ GitHub สามารถเปลี่ยน bucket นี้ได้ ขีดจำกัดนี้ใช้ร่วมกันโดยการลงทะเบียน runner ของ Blacksmith ทั้งหมดในองค์กร `openclaw` ดังนั้นการเพิ่มการติดตั้ง Blacksmith อีกหนึ่งรายการจะไม่เพิ่ม bucket ใหม่

ให้ถือ label ของ Blacksmith เป็นทรัพยากรที่ขาดแคลนสำหรับการควบคุม burst งานที่เพียง route, notify, summarize, select shard หรือรันการสแกน CodeQL สั้น ๆ ควรอยู่บน runner ที่โฮสต์โดย GitHub เว้นแต่จะมีความจำเป็นเฉพาะของ Blacksmith ที่วัดผลแล้ว เมทริกซ์ Blacksmith ใหม่ใด ๆ, `max-parallel` ที่ใหญ่ขึ้น หรือ workflow ความถี่สูง ต้องแสดงจำนวนการลงทะเบียนกรณีเลวร้ายที่สุด และรักษาเป้าหมายระดับองค์กรให้อยู่ต่ำกว่าประมาณ 60% ของ bucket สด ด้วย bucket ปัจจุบันที่ 10,000 การลงทะเบียน นั่นหมายถึงเป้าหมายการดำเนินงาน 6,000 การลงทะเบียน โดยเหลือ headroom สำหรับ repository ที่รันพร้อมกัน, retry และ burst ที่ทับซ้อนกัน

CI ของ repository หลักยังคงใช้ Blacksmith เป็นเส้นทาง runner เริ่มต้นสำหรับการรัน push และ pull-request ปกติ `workflow_dispatch` และการรัน repository ที่ไม่ใช่ canonical ใช้ runner ที่โฮสต์โดย GitHub แต่การรัน canonical ปกติในปัจจุบันยังไม่ได้ probe สุขภาพคิวของ Blacksmith หรือ fallback อัตโนมัติไปยัง label ที่โฮสต์โดย GitHub เมื่อ Blacksmith ไม่พร้อมใช้งาน

## สิ่งเทียบเท่าในเครื่อง

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## ประสิทธิภาพของ OpenClaw

`OpenClaw Performance` คือเวิร์กโฟลว์ประสิทธิภาพของผลิตภัณฑ์/รันไทม์ โดยรันทุกวันบน `main` และสามารถสั่งรันด้วยตนเองได้:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

การสั่งรันด้วยตนเองโดยปกติจะเบนช์มาร์ก workflow ref ตั้งค่า `target_ref` เพื่อเบนช์มาร์กแท็กรีลีสหรือสาขาอื่นด้วยการใช้งานเวิร์กโฟลว์ปัจจุบัน เส้นทางรายงานที่เผยแพร่และพอยน์เตอร์ล่าสุดจะอ้างอิงตาม ref ที่ทดสอบ และ `index.md` แต่ละไฟล์จะบันทึก ref/SHA ที่ทดสอบ, workflow ref/SHA, Kova ref, โปรไฟล์, โหมดการยืนยันตัวตนของเลน, โมเดล, จำนวนรอบซ้ำ และตัวกรองสถานการณ์

เวิร์กโฟลว์ติดตั้ง OCM จากรีลีสที่ปักหมุดไว้และ Kova จาก `openclaw/Kova` ที่อินพุต `kova_ref` ที่ปักหมุดไว้ จากนั้นรันสามเลน:

- `mock-provider`: สถานการณ์วินิจฉัยของ Kova เทียบกับรันไทม์ที่บิลด์ในเครื่องพร้อมการยืนยันตัวตนปลอมที่กำหนดผลได้แน่นอนและเข้ากันได้กับ OpenAI
- `mock-deep-profile`: การทำโปรไฟล์ CPU/heap/trace สำหรับจุดร้อนของการเริ่มต้น, Gateway และ agent turn
- `live-openai-candidate`: agent turn จริงของ OpenAI `openai/gpt-5.5` ซึ่งจะข้ามเมื่อไม่มี `OPENAI_API_KEY`

เลน mock-provider ยังรันโพรบซอร์สแบบเนทีฟของ OpenClaw หลังจากผ่าน Kova แล้ว ได้แก่ เวลาบูตและหน่วยความจำของ Gateway ในกรณีเริ่มต้นแบบค่าเริ่มต้น, hook และ 50-plugin; RSS การนำเข้า Plugin ที่บันเดิลไว้, ลูป hello ของ mock-OpenAI `channel-chat-baseline` ซ้ำ, คำสั่งเริ่มต้น CLI เทียบกับ Gateway ที่บูตแล้ว และโพรบประสิทธิภาพ smoke ของสถานะ SQLite เมื่อมีรายงานซอร์ส mock-provider ที่เผยแพร่ก่อนหน้าสำหรับ ref ที่ทดสอบ สรุปซอร์สจะเปรียบเทียบค่า RSS และ heap ปัจจุบันกับฐานนั้น และทำเครื่องหมายการเพิ่มขึ้นของ RSS จำนวนมากเป็น `watch` สรุป Markdown ของโพรบซอร์สอยู่ที่ `source/index.md` ในชุดรายงาน พร้อม JSON ดิบอยู่ข้างกัน

ทุกเลนอัปโหลดอาร์ติแฟกต์ GitHub เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว เวิร์กโฟลว์ยังคอมมิต `report.json`, `report.md`, ชุดไฟล์, `index.md` และอาร์ติแฟกต์โพรบซอร์สลงใน `openclaw/clawgrit-reports` ภายใต้ `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` พอยน์เตอร์ tested-ref ปัจจุบันจะถูกเขียนเป็น `openclaw-performance/<tested-ref>/latest-<lane>.json`

## การตรวจสอบรีลีสเต็มรูปแบบ

`Full Release Validation` คือเวิร์กโฟลว์ครอบคลุมแบบแมนนวลสำหรับ "รันทุกอย่างก่อนรีลีส" รับสาขา แท็ก หรือ SHA ของคอมมิตแบบเต็ม สั่งรันเวิร์กโฟลว์ `CI` แบบแมนนวลด้วยเป้าหมายนั้น สั่งรัน `Plugin Prerelease` สำหรับหลักฐานเฉพาะรีลีสของ plugin/package/static/Docker และสั่งรัน `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, การตรวจสอบแพ็กเกจข้าม OS, การเรนเดอร์ maturity scorecard จากหลักฐานโปรไฟล์ QA, QA Lab parity, Matrix และเลน Telegram โปรไฟล์ stable และ full จะรวมความครอบคลุม live/E2E แบบละเอียดและ Docker release-path soak เสมอ ส่วนโปรไฟล์ beta สามารถเลือกเปิดได้ด้วย `run_release_soak=true` Telegram E2E ของแพ็กเกจ canonical รันภายใน Package Acceptance ดังนั้นตัวเลือกรีลีสเต็มรูปแบบจะไม่เริ่มตัว poller แบบสดซ้ำ หลังจากเผยแพร่แล้ว ให้ส่ง `release_package_spec` เพื่อใช้แพ็กเกจ npm ที่จัดส่งแล้วซ้ำในการตรวจสอบรีลีส, Package Acceptance, Docker, ข้าม OS และ Telegram โดยไม่ต้องบิลด์ใหม่ ใช้ `npm_telegram_package_spec` เฉพาะสำหรับการรัน Telegram ซ้ำแบบเจาะจงกับแพ็กเกจที่เผยแพร่แล้ว เลนแพ็กเกจสดของ Plugin Codex ใช้สถานะที่เลือกเดียวกันเป็นค่าเริ่มต้น: `release_package_spec=openclaw@<tag>` ที่เผยแพร่แล้วจะได้ `codex_plugin_spec=npm:@openclaw/codex@<tag>` ส่วนการรันด้วย SHA/อาร์ติแฟกต์จะแพ็ก `extensions/codex` จาก ref ที่เลือก ตั้งค่า `codex_plugin_spec` โดยชัดเจนสำหรับแหล่ง Plugin แบบกำหนดเอง เช่นสเปก `npm:`, `npm-pack:` หรือ `git:`

ดู [การตรวจสอบรีลีสเต็มรูปแบบ](/th/reference/full-release-validation) สำหรับ
เมทริกซ์สเตจ, ชื่องานเวิร์กโฟลว์ที่แน่นอน, ความแตกต่างของโปรไฟล์, อาร์ติแฟกต์ และ
แฮนเดิลสำหรับรันซ้ำแบบเจาะจง

`OpenClaw Release Publish` คือเวิร์กโฟลว์รีลีสแบบแมนนวลที่เปลี่ยนแปลงสถานะ ให้สั่งรัน
จาก `release/YYYY.M.PATCH` หรือ `main` หลังจากมีแท็กรีลีสแล้วและหลังจาก
preflight ของ OpenClaw npm สำเร็จแล้ว โดยจะตรวจสอบ `pnpm plugins:sync:check`,
สั่งรัน `Plugin NPM Release` สำหรับแพ็กเกจ Plugin ทั้งหมดที่เผยแพร่ได้, สั่งรัน
`Plugin ClawHub Release` สำหรับ SHA รีลีสเดียวกัน และจากนั้นจึงสั่งรัน
`OpenClaw NPM Release` ด้วย `preflight_run_id` ที่บันทึกไว้ การเผยแพร่ stable ยัง
ต้องใช้ `windows_node_tag` ที่ตรงกันแบบแน่นอน; เวิร์กโฟลว์ตรวจสอบรีลีสซอร์ส Windows
และเปรียบเทียบตัวติดตั้ง x64/ARM64 กับอินพุต `windows_node_installer_digests`
ที่อนุมัติสำหรับ candidate ก่อน child สำหรับเผยแพร่ใด ๆ จากนั้นจึงโปรโมต
และตรวจสอบ digest ตัวติดตั้งที่ปักหมุดไว้ชุดเดียวกัน รวมถึง companion asset
และสัญญา checksum ที่แน่นอน ก่อนเผยแพร่ดราฟต์รีลีส GitHub

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

สำหรับหลักฐานคอมมิตที่ปักหมุดไว้บนสาขาที่เคลื่อนไหวเร็ว ให้ใช้ตัวช่วยแทน
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

refs สำหรับสั่งรันเวิร์กโฟลว์ GitHub ต้องเป็นสาขาหรือแท็ก ไม่ใช่ SHA คอมมิตดิบ
ตัวช่วยจะ push สาขาชั่วคราว `release-ci/<sha>-...` ที่ SHA เป้าหมาย,
สั่งรัน `Full Release Validation` จาก ref ที่ปักหมุดไว้นั้น, ตรวจสอบว่า
`headSha` ของ child workflow ทุกตัวตรงกับเป้าหมาย และลบสาขาชั่วคราวเมื่อ
การรันเสร็จสิ้น ตัวตรวจสอบ umbrella จะล้มเหลวด้วยหาก child workflow ใดรันที่
SHA อื่น

`release_profile` ควบคุมขอบเขต live/provider ที่ส่งต่อไปยัง release checks
เวิร์กโฟลว์รีลีสแบบแมนนวลมีค่าเริ่มต้นเป็น `stable`; ใช้ `full` เฉพาะเมื่อคุณ
ตั้งใจต้องการเมทริกซ์ provider/media แบบ advisory ที่กว้างเท่านั้น การตรวจสอบรีลีส
stable และ full จะรัน live/E2E แบบละเอียดและ Docker release-path soak เสมอ;
โปรไฟล์ beta สามารถเลือกเปิดได้ด้วย `run_release_soak=true`

- `minimum` คงเลน OpenAI/core ที่สำคัญต่อรีลีสและเร็วที่สุดไว้
- `stable` เพิ่มชุด provider/backend แบบ stable
- `full` รันเมทริกซ์ provider/media แบบ advisory ที่กว้าง

umbrella จะบันทึก run id ของ child ที่สั่งรัน และงานสุดท้าย `Verify full validation` จะตรวจสอบข้อสรุปของ child run ปัจจุบันซ้ำและผนวกตารางงานที่ช้าที่สุดสำหรับ child run แต่ละรายการ หาก child workflow ถูกรันซ้ำและเปลี่ยนเป็นสีเขียว ให้รันซ้ำเฉพาะงาน verifier ของ parent เพื่อรีเฟรชผล umbrella และสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รับ `rerun_group` ใช้ `all` สำหรับ release candidate, `ci` สำหรับ child CI เต็มรูปแบบปกติเท่านั้น, `plugin-prerelease` สำหรับ child prerelease ของ Plugin เท่านั้น, `release-checks` สำหรับ child release ทุกตัว หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` หรือ `npm-telegram` บน umbrella สิ่งนี้ทำให้การรันซ้ำของ release box ที่ล้มเหลวยังคงมีขอบเขตหลังการแก้แบบเจาะจง สำหรับเลนข้าม OS ที่ล้มเหลวหนึ่งเลน ให้รวม `rerun_group=cross-os` กับ `cross_os_suite_filter` เช่น `windows/packaged-upgrade`; คำสั่งข้าม OS ที่รันนานจะปล่อยบรรทัด Heartbeat และสรุป packaged-upgrade จะรวมเวลารายเฟส เลน QA release-check เป็น advisory ยกเว้นเกตความครอบคลุมเครื่องมือรันไทม์มาตรฐาน ซึ่งจะบล็อกเมื่อเครื่องมือ dynamic ของ OpenClaw ที่จำเป็นเลื่อนหรือหายไปจากสรุประดับมาตรฐาน

`OpenClaw Release Checks` ใช้ workflow ref ที่เชื่อถือได้เพื่อ resolve ref ที่เลือกหนึ่งครั้งเป็น tarball `release-package-under-test` จากนั้นส่งอาร์ติแฟกต์นั้นไปยังการตรวจสอบข้าม OS และ Package Acceptance รวมถึงเวิร์กโฟลว์ Docker สำหรับ live/E2E release-path เมื่อรันความครอบคลุม soak วิธีนี้ทำให้ไบต์ของแพ็กเกจสอดคล้องกันระหว่าง release boxes และหลีกเลี่ยงการแพ็ก candidate เดียวกันซ้ำใน child jobs หลายตัว สำหรับเลนสดของ Codex npm-plugin, release checks จะส่งสเปก Plugin ที่เผยแพร่แล้วซึ่งตรงกันและ derive จาก `release_package_spec`, ส่ง `codex_plugin_spec` ที่ผู้ปฏิบัติการระบุ, หรือปล่อยอินพุตว่างไว้เพื่อให้สคริปต์ Docker แพ็ก Plugin Codex ของ checkout ที่เลือก

การรัน `Full Release Validation` ซ้ำสำหรับ `ref=main` และ `rerun_group=all`
จะแทนที่ umbrella ที่เก่ากว่า มอนิเตอร์ของ parent จะยกเลิก child workflow ใด ๆ ที่
ได้สั่งรันไปแล้วเมื่อ parent ถูกยกเลิก ดังนั้นการตรวจสอบ main ที่ใหม่กว่าจะไม่ติดอยู่หลัง
การรัน release-check เก่าที่ใช้เวลาสองชั่วโมง การตรวจสอบสาขา/แท็กรีลีส
และกลุ่มรันซ้ำแบบเจาะจงจะคง `cancel-in-progress: false`

## ชาร์ด Live และ E2E

child live/E2E ของรีลีสยังคงความครอบคลุม `pnpm test:live` แบบเนทีฟที่กว้างไว้ แต่รันเป็นชาร์ดที่มีชื่อผ่าน `scripts/test-live-shard.mjs` แทนงานแบบ serial หนึ่งงาน:

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
- ชาร์ดสื่อ audio/video ที่แยกกัน และชาร์ด music ที่กรองตาม provider

สิ่งนี้คงความครอบคลุมไฟล์เดิมไว้ พร้อมทำให้ความล้มเหลวของ live provider ที่ช้าสามารถรันซ้ำและวินิจฉัยได้ง่ายขึ้น ชื่อชาร์ดแบบรวม `native-live-extensions-o-z`, `native-live-extensions-media` และ `native-live-extensions-media-music` ยังคงใช้ได้สำหรับการรันซ้ำแบบแมนนวลครั้งเดียว

ชาร์ดสื่อ native live รันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งบิลด์โดยเวิร์กโฟลว์ `Live Media Runner Image` อิมเมจนั้นติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้า; งานสื่อจะตรวจสอบเฉพาะไบนารีก่อนการตั้งค่าเท่านั้น ให้คงชุดทดสอบ live ที่ใช้ Docker บน Blacksmith runners ปกติ เพราะ container jobs ไม่ใช่ที่ที่เหมาะสำหรับเปิดการทดสอบ Docker ซ้อนกัน

Docker-backed live model/backend shards ใช้อิมเมจ `ghcr.io/openclaw/openclaw-live-test:<sha>` แบบใช้ร่วมกันแยกต่างหากต่อคอมมิตที่เลือกแต่ละรายการ เวิร์กโฟลว์รุ่นแบบ live จะ build และ push อิมเมจนั้นหนึ่งครั้ง จากนั้นชาร์ด Docker live model, provider-sharded gateway, CLI backend, ACP bind และ Codex harness จะรันด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ชาร์ด Gateway Docker มีขีดจำกัด `timeout` ระดับสคริปต์ที่ระบุชัดเจนและต่ำกว่า timeout ของงานเวิร์กโฟลว์ เพื่อให้คอนเทนเนอร์หรือเส้นทาง cleanup ที่ค้างล้มเหลวอย่างรวดเร็ว แทนที่จะใช้ budget ของ release-check ทั้งหมด หากชาร์ดเหล่านั้น rebuild เป้าหมาย Docker ของซอร์สทั้งหมดโดยอิสระ แปลว่า release run ถูกกำหนดค่าผิดและจะเสียเวลาจริงไปกับการ build อิมเมจซ้ำ

## การยอมรับแพ็กเกจ

ใช้ `Package Acceptance` เมื่อคำถามคือ "แพ็กเกจ OpenClaw ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์ได้หรือไม่" ซึ่งแตกต่างจาก CI ปกติ: CI ปกติตรวจสอบ source tree ส่วน package acceptance ตรวจสอบ tarball เดียวผ่าน Docker E2E harness เดียวกับที่ผู้ใช้ใช้งานหลังติดตั้งหรืออัปเดต

### งาน

1. `resolve_package` checkout `workflow_ref`, resolve package candidate หนึ่งรายการ, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, อัปโหลดทั้งสองรายการเป็น artifact `package-under-test`, และพิมพ์ source, workflow ref, package ref, version, SHA-256 และ profile ในสรุปขั้นตอนของ GitHub
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` เวิร์กโฟลว์ที่ใช้ซ้ำจะดาวน์โหลด artifact นั้น, ตรวจสอบ inventory ของ tarball, เตรียม Docker images แบบ package-digest เมื่อจำเป็น, และรัน Docker lanes ที่เลือกกับแพ็กเกจนั้นแทนการ pack workflow checkout เมื่อ profile เลือก `docker_lanes` แบบเจาะจงหลายรายการ เวิร์กโฟลว์ที่ใช้ซ้ำจะเตรียมแพ็กเกจและ shared images หนึ่งครั้ง แล้วกระจาย lanes เหล่านั้นออกเป็น targeted Docker jobs แบบขนานพร้อม artifacts ที่ไม่ซ้ำกัน
3. `package_telegram` เรียก `NPM Telegram Beta E2E` แบบเลือกได้ โดยจะรันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้ง artifact `package-under-test` เดียวกันเมื่อ Package Acceptance resolve รายการหนึ่งแล้ว; การ dispatch Telegram แบบ standalone ยังสามารถติดตั้ง published npm spec ได้
4. `summary` ทำให้เวิร์กโฟลว์ล้มเหลวหาก package resolution, Docker acceptance หรือ Telegram lane แบบเลือกได้ล้มเหลว

### แหล่งที่มาของตัวเลือก

- `source=npm` ยอมรับเฉพาะ `openclaw@beta`, `openclaw@latest` หรือ OpenClaw release version ที่ระบุแน่นอน เช่น `openclaw@2026.4.27-beta.2` ใช้รายการนี้สำหรับ published prerelease/stable acceptance
- `source=ref` pack branch, tag หรือ full commit SHA ของ `package_ref` ที่เชื่อถือได้ resolver จะ fetch OpenClaw branches/tags, ตรวจสอบว่าคอมมิตที่เลือกเข้าถึงได้จากประวัติ branch ของ repository หรือ release tag, ติดตั้ง deps ใน detached worktree และ pack ด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` ดาวน์โหลด `.tgz` แบบ HTTPS สาธารณะ; จำเป็นต้องมี `package_sha256` เส้นทางนี้ปฏิเสธ URL credentials, พอร์ต HTTPS ที่ไม่ใช่ค่า default, hostnames หรือ IPs ที่เป็น private/internal/special-use หรือที่ resolve ได้ และ redirects ที่อยู่นอก public safety policy เดียวกัน
- `source=trusted-url` ดาวน์โหลด `.tgz` แบบ HTTPS จาก named trusted-source policy ใน `.github/package-trusted-sources.json`; จำเป็นต้องมี `package_sha256` และ `trusted_source_id` ใช้รายการนี้เฉพาะสำหรับ enterprise mirrors หรือ private package repositories ที่ maintainer เป็นเจ้าของ ซึ่งต้องใช้ hosts, ports, path prefixes, redirect hosts หรือ private-network resolution ที่กำหนดค่าไว้ หาก policy ประกาศ bearer auth เวิร์กโฟลว์จะใช้ secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN` แบบคงที่; credentials ที่ฝังใน URL ยังคงถูกปฏิเสธ
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งรายการจาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็นตัวเลือกแต่ควรระบุสำหรับ artifacts ที่แชร์ภายนอก

แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือโค้ด workflow/harness ที่เชื่อถือได้ซึ่งรันการทดสอบ `package_ref` คือ source commit ที่จะถูก pack เมื่อ `source=ref` สิ่งนี้ทำให้ test harness ปัจจุบันตรวจสอบ source commits เก่าที่เชื่อถือได้โดยไม่ต้องรัน logic ของเวิร์กโฟลว์เก่า

### โปรไฟล์ชุดทดสอบ

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` รวมกับ `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — ชิ้นส่วน Docker release-path เต็มรูปแบบพร้อม OpenWebUI
- `custom` — `docker_lanes` ที่ตรงกันทุกประการ; จำเป็นเมื่อ `suite_profile=custom`

profile `package` ใช้ offline plugin coverage เพื่อให้การตรวจสอบ published-package ไม่ถูก gate ด้วยความพร้อมใช้งาน live ของ ClawHub Telegram lane แบบเลือกได้ใช้ artifact `package-under-test` ซ้ำใน `NPM Telegram Beta E2E` โดยเก็บเส้นทาง published npm spec ไว้สำหรับ standalone dispatches

สำหรับนโยบายการทดสอบ update และ Plugin เฉพาะ ซึ่งรวมถึงคำสั่ง local,
Docker lanes, อินพุต Package Acceptance, ค่า default ของ release และ failure triage,
ดู [การทดสอบ updates และ plugins](/th/help/testing-updates-plugins)

Release checks เรียก Package Acceptance ด้วย `source=artifact`, release package artifact ที่เตรียมไว้, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` และ `telegram_mode=mock-openai` สิ่งนี้ทำให้ package migration, update, การติดตั้ง live ClawHub skill, การ cleanup stale-plugin-dependency, การ repair configured-plugin install, offline plugin, plugin-update และหลักฐาน Telegram อยู่บน package tarball ที่ resolve แล้วรายการเดียวกัน ตั้งค่า `release_package_spec` บน Full Release Validation หรือ OpenClaw Release Checks หลังเผยแพร่ beta เพื่อรัน matrix เดียวกันกับแพ็กเกจ npm ที่ shipped โดยไม่ต้อง rebuild; ตั้งค่า `package_acceptance_package_spec` เฉพาะเมื่อ Package Acceptance ต้องใช้แพ็กเกจที่ต่างจากส่วนที่เหลือของ release validation เท่านั้น Cross-OS release checks ยังคงครอบคลุม onboarding, installer และ platform behavior ที่เฉพาะเจาะจงกับ OS; product validation สำหรับ package/update ควรเริ่มจาก Package Acceptance Docker lane `published-upgrade-survivor` ตรวจสอบ published package baseline หนึ่งรายการต่อ run ใน blocking release path ใน Package Acceptance, tarball `package-under-test` ที่ resolve แล้วเป็น candidate เสมอ และ `published_upgrade_survivor_baseline` เลือก fallback published baseline โดยมีค่า default เป็น `openclaw@latest`; คำสั่ง rerun สำหรับ lane ที่ล้มเหลวจะรักษา baseline นั้นไว้ Full Release Validation ที่มี `run_release_soak=true` หรือ `release_profile=full` ตั้งค่า `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` และ `published_upgrade_survivor_scenarios=reported-issues` เพื่อขยายครอบคลุม stable npm releases สี่รายการล่าสุด รวมถึง pinned plugin-compatibility boundary releases และ issue-shaped fixtures สำหรับ Feishu config, preserved bootstrap/persona files, configured OpenClaw plugin installs, tilde log paths และ stale legacy plugin dependency roots การเลือก multi-baseline published-upgrade survivor จะถูก shard ตาม baseline เป็น targeted Docker runner jobs แยกกัน เวิร์กโฟลว์ `Update Migration` แยกต่างหากใช้ Docker lane `update-migration` พร้อม `all-since-2026.4.23` และ `plugin-deps-cleanup` เมื่อคำถามคือการ cleanup published update อย่างละเอียดถี่ถ้วน ไม่ใช่ความกว้างของ Full Release CI ปกติ Local aggregate runs สามารถส่ง package specs ที่ตรงกันทุกประการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, เก็บ lane เดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` เช่น `openclaw@2026.4.15` หรือตั้งค่า `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` สำหรับ scenario matrix published lane กำหนดค่า baseline ด้วยสูตรคำสั่ง `openclaw config set` ที่ baked ไว้, บันทึก recipe steps ใน `summary.json` และ probe `/healthz`, `/readyz` รวมถึงสถานะ RPC หลัง Gateway start Windows packaged และ installer fresh lanes ยังตรวจสอบด้วยว่าแพ็กเกจที่ติดตั้งแล้วสามารถ import browser-control override จาก raw absolute Windows path ได้ OpenAI cross-OS agent-turn smoke ใช้ค่า default เป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อถูกตั้งค่าไว้ มิฉะนั้นใช้ `openai/gpt-5.5` เพื่อให้ install และ gateway proof อยู่บน GPT-5 test model พร้อมหลีกเลี่ยงค่า default ของ GPT-4.x

### ช่วงความเข้ากันได้กับ legacy

Package Acceptance มีช่วง legacy-compatibility ที่มีขอบเขตสำหรับแพ็กเกจที่เผยแพร่แล้ว แพ็กเกจถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้ compatibility path ได้:

- entries ของ private QA ที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ถูกละเว้นจาก tarball;
- `doctor-switch` อาจข้าม subcase ของ persistence `gateway install --wrapper` เมื่อแพ็กเกจไม่ expose flag นั้น;
- `update-channel-switch` อาจ prune pnpm `patchedDependencies` ที่หายไปจาก fake git fixture ที่ derived จาก tarball และอาจ log `update.channel` ที่ persist ไว้แล้วแต่หายไป;
- plugin smokes อาจอ่านตำแหน่ง legacy install-record หรือยอมรับการไม่มี marketplace install-record persistence;
- `plugin-update` อาจอนุญาต config metadata migration โดยยังคงกำหนดให้ install record และ no-reinstall behavior ไม่เปลี่ยนแปลง

แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ local build metadata stamp ที่ shipped ไปแล้วได้เช่นกัน แพ็กเกจหลังจากนั้นต้องผ่าน modern contracts; เงื่อนไขเดียวกันจะ fail แทนที่จะ warn หรือ skip

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
  -f package_ref=release/YYYY.M.PATCH \
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

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
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

เมื่อ debug package acceptance run ที่ล้มเหลว ให้เริ่มที่สรุป `resolve_package` เพื่อยืนยัน package source, version และ SHA-256 จากนั้นตรวจสอบ child run `docker_acceptance` และ Docker artifacts ของมัน: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase timings และ rerun commands ควร rerun failed package profile หรือ Docker lanes ที่ตรงกันทุกประการ แทนการ rerun full release validation

## Install smoke

เวิร์กโฟลว์ `Install Smoke` แยกต่างหากใช้ scope script เดียวกันซ้ำผ่านงาน `preflight` ของตัวเอง โดยแยก smoke coverage เป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **เส้นทางเร็ว** ทำงานสำหรับ pull request ที่แตะพื้นผิว Docker/package, การเปลี่ยนแปลง package/manifest ของ Plugin ที่รวมมา, หรือพื้นผิว Plugin/channel/gateway/Plugin SDK หลักที่งาน Docker smoke ทดสอบอยู่ การเปลี่ยนแปลง Plugin ที่รวมมาแบบ source-only, การแก้ไขเฉพาะ test, และการแก้ไขเฉพาะ docs จะไม่จอง Docker workers เส้นทางเร็วจะ build image จาก Dockerfile รากหนึ่งครั้ง, ตรวจ CLI, รัน agents delete shared-workspace CLI smoke, รัน container gateway-network e2e, ตรวจสอบ build arg ของ bundled extension, และรันโปรไฟล์ Docker ของ bundled-plugin แบบจำกัดภายใต้ command timeout รวม 240 วินาที (Docker run ของแต่ละ scenario ถูกจำกัดแยกกัน)
- **เส้นทางเต็ม** เก็บความครอบคลุม QR package install และ installer Docker/update ไว้สำหรับ nightly scheduled runs, manual dispatches, workflow-call release checks, และ pull request ที่แตะพื้นผิว installer/package/Docker จริง ๆ ในโหมดเต็ม install-smoke จะเตรียมหรือนำ image smoke ของ GHCR root Dockerfile ที่ target-SHA เดียวกลับมาใช้ใหม่ จากนั้นรัน QR package install, root Dockerfile/gateway smokes, installer/update smokes, และ fast bundled-plugin Docker E2E เป็นงานแยกกัน เพื่อให้งาน installer ไม่ต้องรอหลัง root image smokes

`main` pushes (รวมถึง merge commits) ไม่ได้บังคับเส้นทางเต็ม เมื่อ logic changed-scope จะขอความครอบคลุมเต็มบน push workflow จะคง fast Docker smoke ไว้ และปล่อย full install smoke ให้ nightly หรือ release validation

slow Bun global install image-provider smoke ถูก gate แยกด้วย `run_bun_global_install_smoke` มันรันบน nightly schedule และจาก release checks workflow และ manual `Install Smoke` dispatches สามารถเลือกเปิดใช้ได้ แต่ pull request และ `main` pushes จะไม่รัน CI ของ PR ปกติยังคงรัน fast Bun launcher regression lane สำหรับการเปลี่ยนแปลงที่เกี่ยวกับ Node QR และ installer Docker tests ยังคงใช้ Dockerfiles ที่เน้น install ของตัวเอง

## Local Docker E2E

`pnpm test:docker:all` จะ prebuild shared live-test image หนึ่งตัว, pack OpenClaw เป็น npm tarball หนึ่งครั้ง, และ build image `scripts/e2e/Dockerfile` ที่ใช้ร่วมกันสองตัว:

- runner Node/Git เปล่าสำหรับ lane installer/update/plugin-dependency;
- image ที่ใช้งานได้จริงซึ่งติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lane functionality ปกติ

นิยาม Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, logic planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`, และ runner จะ execute เฉพาะ plan ที่เลือกเท่านั้น scheduler เลือก image ต่อ lane ด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` จากนั้นรัน lane ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### ค่าที่ปรับได้

| ตัวแปร                                | ค่าเริ่มต้น | วัตถุประสงค์                                                                                  |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | จำนวน slot ของ main-pool สำหรับ lane ปกติ                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | จำนวน slot ของ tail-pool ที่ไวต่อ provider                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | เพดาน lane สดพร้อมกันเพื่อไม่ให้ provider throttle                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | เพดาน lane npm install พร้อมกัน                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | เพดาน lane multi-service พร้อมกัน                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | ระยะเหลื่อมระหว่างการเริ่ม lane เพื่อหลีกเลี่ยง Docker daemon create storms; ตั้งเป็น `0` หากไม่ต้องการ stagger     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | fallback timeout ต่อ lane (120 นาที); lane live/tail ที่เลือกใช้เพดานที่เข้มกว่า           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` พิมพ์ scheduler plan โดยไม่รัน lane                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | รายการ lane แบบตรงตัวคั่นด้วย comma; ข้าม cleanup smoke เพื่อให้ agent ทำซ้ำ lane ที่ล้มเหลวหนึ่ง lane ได้ |

lane ที่หนักกว่า cap ที่มีผลของมันยังสามารถเริ่มจาก pool ว่างได้ จากนั้นจะรันเดี่ยวจนกว่าจะปล่อย capacity local aggregate จะ preflight Docker, ลบ container OpenClaw E2E ที่ค้างอยู่, emit สถานะ active-lane, persist timings ของ lane สำหรับการจัดลำดับ longest-first, และหยุด schedule lane ใหม่ใน pool หลังความล้มเหลวแรกตามค่าเริ่มต้น

### Workflow live/E2E ที่นำกลับมาใช้ใหม่ได้

workflow live/E2E ที่นำกลับมาใช้ใหม่ได้จะถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องใช้ package, image kind, live image, lane, และ credential coverage ใด `scripts/docker-e2e.mjs` จะแปลง plan นั้นเป็น GitHub outputs และ summaries จากนั้นมันจะ pack OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลด package artifact ของ current-run, หรือดาวน์โหลด package artifact จาก `package_artifact_run_id`; validate tarball inventory; build และ push image GHCR Docker E2E แบบ bare/functional ที่ tag ด้วย package-digest ผ่าน Docker layer cache ของ Blacksmith เมื่อ plan ต้องใช้ lane ที่ติดตั้ง package; และใช้ input `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรือ image package-digest ที่มีอยู่แทนการ rebuild การ pull Docker image จะ retry พร้อม timeout ต่อ attempt แบบจำกัด 180 วินาที เพื่อให้ registry/cache stream ที่ค้าง retry ได้เร็ว แทนที่จะกินเวลาส่วนใหญ่ของ CI critical path

### Chunk ของ release-path

ความครอบคลุม Release Docker รันเป็นงาน chunk เล็กลงด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละ chunk pull เฉพาะ image kind ที่ต้องใช้ และ execute หลาย lane ผ่าน weighted scheduler เดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

chunk Release Docker ปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, และ `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` `package-update-openai` รวม live Codex plugin package lane ซึ่งติดตั้ง candidate OpenClaw package, ติดตั้ง Codex plugin จาก `codex_plugin_spec` หรือ tarball same-ref พร้อมการอนุมัติการติดตั้ง Codex CLI อย่างชัดเจน, รัน Codex CLI preflight, แล้วรัน OpenClaw agent turns หลายครั้งใน session เดียวกันกับ OpenAI `plugins-runtime-core`, `plugins-runtime`, และ `plugins-integrations` ยังคงเป็น alias รวมของ plugin/runtime alias ของ lane `install-e2e` ยังคงเป็น alias สำหรับ manual rerun แบบรวมของ provider installer lanes ทั้งคู่

OpenWebUI ถูกพับเข้าใน `plugins-runtime-services` เมื่อ full release-path coverage ขอ และคง chunk `openwebui` แบบ standalone ไว้เฉพาะสำหรับ dispatch ที่เป็น OpenWebUI-only lane update ของ bundled-channel จะ retry หนึ่งครั้งสำหรับความล้มเหลว transient ของเครือข่าย npm

แต่ละ chunk upload `.artifacts/docker-tests/` พร้อม lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, ตาราง slow-lane, และคำสั่ง rerun ต่อ lane input `docker_lanes` ของ workflow จะรัน lane ที่เลือกกับ image ที่เตรียมไว้แทน chunk jobs ซึ่งทำให้การ debug failed-lane ถูกจำกัดไว้ที่ Docker job เป้าหมายหนึ่งงาน และเตรียม, ดาวน์โหลด, หรือนำ package artifact กลับมาใช้ใหม่สำหรับ run นั้น หาก lane ที่เลือกเป็น live Docker lane งานเป้าหมายจะ build live-test image ในเครื่องสำหรับ rerun นั้น คำสั่ง rerun GitHub ต่อ lane ที่ generate จะรวม `package_artifact_run_id`, `package_artifact_name`, และ prepared image inputs เมื่อค่าเหล่านั้นมีอยู่ เพื่อให้ lane ที่ล้มเหลวนำ package และ image เดิมจาก run ที่ล้มเหลวกลับมาใช้ได้

```bash
pnpm test:docker:rerun <run-id>      # ดาวน์โหลด Docker artifacts และพิมพ์คำสั่ง rerun แบบ targeted รวม/ต่อ lane
pnpm test:docker:timings <summary>   # สรุป slow-lane และ phase critical-path
```

workflow live/E2E ตาม schedule จะรัน Docker suite แบบ full release-path ทุกวัน

## Plugin Prerelease

`Plugin Prerelease` เป็นความครอบคลุม product/package ที่มีต้นทุนสูงกว่า ดังนั้นจึงเป็น workflow แยกที่ถูก dispatch โดย `Full Release Validation` หรือ operator ที่ระบุชัดเจน pull request ปกติ, `main` pushes, และ standalone manual CI dispatches จะปิด suite นั้นไว้ มันกระจาย bundled plugin tests ข้าม extension workers แปดตัว งาน extension shard เหล่านั้นรันได้สูงสุดสอง plugin config groups พร้อมกัน โดยมี Vitest worker หนึ่งตัวต่อ group และ Node heap ที่ใหญ่ขึ้น เพื่อให้ชุด plugin ที่มี import หนักไม่สร้างงาน CI เพิ่ม เส้นทาง Docker prerelease แบบ release-only จะ batch lane Docker เป้าหมายเป็นกลุ่มเล็ก ๆ เพื่อหลีกเลี่ยงการจอง runner หลายสิบตัวสำหรับงานหนึ่งถึงสามนาที workflow ยัง upload artifact `plugin-inspector-advisory` เชิงข้อมูลจาก `@openclaw/plugin-inspector`; findings ของ inspector เป็น input สำหรับ triage และไม่เปลี่ยน gate Plugin Prerelease ที่ blocking

## QA Lab

QA Lab มี lane CI เฉพาะนอก workflow smart-scoped หลัก agentic parity ซ้อนอยู่ภายใต้ QA และ release harnesses กว้าง ๆ ไม่ใช่ workflow PR แบบ standalone ใช้ `Full Release Validation` พร้อม `rerun_group=qa-parity` เมื่อ parity ควรไปกับ validation run ขนาดกว้าง

- workflow `QA-Lab - All Lanes` รันทุกคืนบน `main` และบน manual dispatch; มัน fan out mock parity lane, live Matrix lane, และ live Telegram กับ Discord lanes เป็นงาน parallel jobs งาน live ใช้ environment `qa-live-shared` และ Telegram/Discord ใช้ Convex leases

Release checks รัน Matrix และ Telegram live transport lanes ด้วย deterministic mock provider และ mock-qualified models (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อแยก channel contract ออกจาก latency ของ live model และ startup ปกติของ provider-plugin live transport gateway ปิด memory search เพราะ QA parity ครอบคลุมพฤติกรรม memory แยกต่างหาก ส่วน provider connectivity ถูกครอบคลุมโดย live model, native provider, และ Docker provider suites แยกต่างหาก

Matrix ใช้ `--profile fast` สำหรับ scheduled และ release gates โดยเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout รองรับ ค่าเริ่มต้นของ CLI และ input ของ manual workflow ยังคงเป็น `all`; manual dispatch `matrix_profile=all` จะ shard ความครอบคลุม Matrix เต็มเป็นงาน `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรัน lane QA Lab ที่สำคัญต่อ release ก่อน release approval; gate QA parity ของมันรัน candidate และ baseline packs เป็นงาน lane แบบ parallel จากนั้นดาวน์โหลด artifact ทั้งคู่เข้าไปในงาน report ขนาดเล็กสำหรับการเปรียบเทียบ parity ขั้นสุดท้าย

สำหรับ PR ปกติ ให้ทำตามหลักฐาน CI/check ตาม scope แทนการถือว่า parity เป็นสถานะที่จำเป็น

## CodeQL

workflow `CodeQL` ตั้งใจให้เป็น security scanner รอบแรกที่แคบ ไม่ใช่การ sweep repository เต็มรูปแบบ การรัน guard รายวัน, manual, และ pull request ที่ไม่ใช่ draft จะ scan Actions workflow code รวมถึงพื้นผิว JavaScript/TypeScript ที่มีความเสี่ยงสูงสุด ด้วย security queries แบบ high-confidence ที่กรองเป็น `security-severity` สูง/วิกฤต

guard ของ pull request ยังคงเบา: มันเริ่มเฉพาะสำหรับการเปลี่ยนแปลงใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, หรือ process-owning bundled plugin runtime paths และรัน matrix security แบบ high-confidence เดียวกับ workflow ตาม schedule Android และ macOS CodeQL จะไม่อยู่ในค่าเริ่มต้นของ PR

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                          | พื้นผิว                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | การยืนยันตัวตน, ความลับ, แซนด์บ็อกซ์, Cron และเส้นฐาน Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการใช้งานการทำงานของช่องทางในแกนหลัก รวมถึงรันไทม์ Plugin ช่องทาง, Gateway, Plugin SDK, ความลับ และจุดสัมผัสการตรวจสอบ              |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF แกนหลัก, การแยกวิเคราะห์ IP, ตัวป้องกันเครือข่าย, web-fetch และพื้นผิวนโยบาย SSRF ของ Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | เซิร์ฟเวอร์ MCP, ตัวช่วยการดำเนินการโปรเซส, การส่งออกภายนอก และเกตการดำเนินการเครื่องมือของเอเจนต์                                           |
| `/codeql-security-high/process-exec-boundary`     | เชลล์ภายในเครื่อง, ตัวช่วยการสร้างโปรเซส, รันไทม์ Plugin ที่รวมมาและเป็นเจ้าของ subprocess และกาวสคริปต์เวิร์กโฟลว์                             |
| `/codeql-security-high/plugin-trust-boundary`     | การติดตั้ง Plugin, loader, manifest, registry, การติดตั้งผ่าน package-manager, การโหลดซอร์ส และพื้นผิวความเชื่อถือของสัญญาแพ็กเกจ Plugin SDK |

### ชาร์ดความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — ชาร์ดความปลอดภัย Android แบบตามกำหนดเวลา สร้างแอป Android ด้วยตนเองสำหรับ CodeQL บน Blacksmith Linux runner ที่เล็กที่สุดซึ่ง workflow sanity ยอมรับ อัปโหลดภายใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — ชาร์ดความปลอดภัย macOS แบบรายสัปดาห์/ด้วยตนเอง สร้างแอป macOS ด้วยตนเองสำหรับ CodeQL บน Blacksmith macOS กรองผลลัพธ์การ build ของ dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดภายใต้ `/codeql-critical-security/macos` เก็บไว้นอกค่าเริ่มต้นรายวันเพราะการ build macOS ครองเวลารันแม้ในกรณีที่สะอาด

### หมวดหมู่คุณภาพวิกฤต

`CodeQL Critical Quality` คือชาร์ดที่สอดคล้องกันในฝั่งที่ไม่ใช่ความปลอดภัย โดยรันเฉพาะ query คุณภาพ JavaScript/TypeScript ที่เป็น error-severity และไม่ใช่ความปลอดภัยบนพื้นผิวมูลค่าสูงแบบแคบบน GitHub-hosted Linux runners เพื่อให้การสแกนคุณภาพไม่ใช้ runner-registration budget ของ Blacksmith ตัวป้องกัน pull request ของมันตั้งใจให้เล็กกว่าโปรไฟล์ตามกำหนดเวลา: PR ที่ไม่ใช่ draft จะรันเฉพาะชาร์ด `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` ที่ตรงกันสำหรับการเปลี่ยนแปลงโค้ดการดำเนินการคำสั่ง/โมเดล/เครื่องมือของเอเจนต์และการส่งต่อการตอบกลับ, โค้ด schema/migration/IO ของ config, โค้ด auth/secrets/sandbox/security, รันไทม์ช่องทางแกนหลักและ Plugin ช่องทางที่รวมมา, โปรโตคอล Gateway/เมธอดเซิร์ฟเวอร์, กาว memory runtime/SDK, MCP/process/outbound delivery, แค็ตตาล็อก provider runtime/model, คิว session diagnostics/delivery, Plugin loader, สัญญา Plugin SDK/package-contract หรือรันไทม์การตอบกลับของ Plugin SDK การเปลี่ยนแปลง config ของ CodeQL และเวิร์กโฟลว์คุณภาพจะรันชาร์ดคุณภาพ PR ทั้งสิบสองรายการ

การ dispatch ด้วยตนเองรองรับ:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

โปรไฟล์แบบแคบคือจุดเชื่อมสำหรับการสอน/การวนซ้ำ เพื่อรันชาร์ดคุณภาพหนึ่งรายการแบบแยกเดี่ยว

| หมวดหมู่                                                | พื้นผิว                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ดขอบเขตความปลอดภัยของการยืนยันตัวตน, ความลับ, แซนด์บ็อกซ์, Cron และ Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | สัญญาของ schema, migration, normalization และ IO สำหรับ config                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schema โปรโตคอล Gateway และสัญญาเมธอดเซิร์ฟเวอร์                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญาการใช้งานช่องทางแกนหลักและ Plugin ช่องทางที่รวมมา                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | การดำเนินการคำสั่ง, การ dispatch โมเดล/provider, การ dispatch และคิว auto-reply และสัญญารันไทม์ control-plane ของ ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | เซิร์ฟเวอร์ MCP และบริดจ์เครื่องมือ, ตัวช่วยการกำกับดูแลโปรเซส และสัญญาการส่งออกภายนอก                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | memory host SDK, facade ของ memory runtime, alias ของ memory Plugin SDK, กาวการเปิดใช้งาน memory runtime และคำสั่ง memory doctor                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | ส่วนภายในของคิวตอบกลับ, คิวส่งมอบ session, ตัวช่วยผูก/ส่งมอบ outbound session, พื้นผิว diagnostic event/log bundle และสัญญา CLI ของ session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | การ dispatch การตอบกลับ inbound ของ Plugin SDK, ตัวช่วย payload/chunking/runtime ของการตอบกลับ, ตัวเลือกการตอบกลับของช่องทาง, คิวส่งมอบ และตัวช่วยผูก session/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | การ normalize แค็ตตาล็อกโมเดล, การยืนยันตัวตนและการค้นพบ provider, การลงทะเบียนรันไทม์ provider, ค่าเริ่มต้น/แค็ตตาล็อก provider และ registry ของ web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | การ bootstrap ของ Control UI, persistence ภายในเครื่อง, โฟลว์ควบคุม Gateway และสัญญารันไทม์ control-plane ของงาน                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | สัญญารันไทม์ของ core web fetch/search, media IO, media understanding, image-generation และ media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | สัญญาของ loader, registry, public-surface และ entrypoint ของ Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | ซอร์ส Plugin SDK ฝั่งแพ็กเกจที่เผยแพร่แล้ว และตัวช่วยสัญญาแพ็กเกจ Plugin                                                                                      |

คุณภาพแยกจากความปลอดภัยเพื่อให้ finding ด้านคุณภาพสามารถถูกกำหนดเวลา วัด ปิดใช้งาน หรือขยายได้โดยไม่บดบังสัญญาณความปลอดภัย การขยาย CodeQL สำหรับ Swift, Python และ Plugin ที่รวมมา ควรถูกเพิ่มกลับเป็นงานติดตามผลแบบกำหนดขอบเขตหรือแยกชาร์ดเท่านั้นหลังจากโปรไฟล์แบบแคบมีเวลารันและสัญญาณที่เสถียรแล้ว

## เวิร์กโฟลว์การบำรุงรักษา

### Docs Agent

เวิร์กโฟลว์ `Docs Agent` คือเลนบำรุงรักษา Codex แบบ event-driven สำหรับทำให้เอกสารที่มีอยู่สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง land ไม่มีตารางเวลาล้วน: การรัน CI จาก push ที่สำเร็จและไม่ใช่บอตบน `main` สามารถทริกเกอร์ได้ และการ dispatch ด้วยตนเองสามารถรันโดยตรงได้ การเรียกผ่าน workflow-run จะข้ามเมื่อ `main` เคลื่อนไปแล้ว หรือเมื่อมีการสร้างการรัน Docs Agent อื่นที่ไม่ถูกข้ามในชั่วโมงที่ผ่านมา เมื่อรัน ระบบจะตรวจช่วง commit ตั้งแต่ source SHA ของ Docs Agent ที่ไม่ถูกข้ามครั้งก่อนจนถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงหนึ่งครั้งสามารถครอบคลุมการเปลี่ยนแปลงบน main ทั้งหมดที่สะสมตั้งแต่การตรวจเอกสารครั้งล่าสุด

### Test Performance Agent

เวิร์กโฟลว์ `Test Performance Agent` คือเลนบำรุงรักษา Codex แบบ event-driven สำหรับเทสต์ที่ช้า ไม่มีตารางเวลาล้วน: การรัน CI จาก push ที่สำเร็จและไม่ใช่บอตบน `main` สามารถทริกเกอร์ได้ แต่จะข้ามหากมีการเรียกผ่าน workflow-run อื่นที่รันไปแล้วหรือกำลังรันอยู่ในวัน UTC นั้น การ dispatch ด้วยตนเองจะข้ามเกตกิจกรรมรายวันนี้ เลนนี้สร้างรายงานประสิทธิภาพ Vitest แบบจัดกลุ่มของชุดเต็ม ให้ Codex ทำได้เฉพาะการแก้ประสิทธิภาพเทสต์ขนาดเล็กที่รักษาความครอบคลุมไว้แทน refactor ขนาดใหญ่ จากนั้นรันรายงานชุดเต็มอีกครั้งและปฏิเสธการเปลี่ยนแปลงที่ลดจำนวนเทสต์ baseline ที่ผ่าน รายงานแบบจัดกลุ่มจะบันทึก wall time ต่อ config และ max RSS บน Linux และ macOS ดังนั้นการเปรียบเทียบก่อน/หลังจะแสดง delta ของหน่วยความจำเทสต์ควบคู่กับ delta ของระยะเวลา หาก baseline มีเทสต์ล้มเหลว Codex อาจแก้ได้เฉพาะความล้มเหลวที่ชัดเจน และรายงานชุดเต็มหลังเอเจนต์ต้องผ่านก่อนที่จะ commit อะไร เมื่อ `main` ขยับก่อนที่ bot push จะ land เลนนี้จะ rebase แพตช์ที่ผ่านการตรวจแล้ว รัน `pnpm check:changed` อีกครั้ง และลอง push ใหม่ แพตช์เก่าที่ขัดแย้งจะถูกข้าม ใช้ GitHub-hosted Ubuntu เพื่อให้ action ของ Codex คงท่าทางความปลอดภัย drop-sudo แบบเดียวกับ docs agent ได้

### PR ซ้ำหลัง merge

เวิร์กโฟลว์ `Duplicate PRs After Merge` คือเวิร์กโฟลว์ผู้ดูแลแบบ manual สำหรับทำความสะอาดรายการซ้ำหลัง land ค่าเริ่มต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุอย่างชัดเจนเมื่อ `apply=true` ก่อนแก้ไข GitHub จะตรวจสอบว่า PR ที่ land ถูก merge แล้ว และ PR ซ้ำแต่ละรายการมี issue ที่อ้างอิงร่วมกันหรือมี hunk ที่เปลี่ยนแปลงทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## เกตตรวจภายในเครื่องและการกำหนดเส้นทางตามการเปลี่ยนแปลง

ตรรกะ changed-lane ภายในเครื่องอยู่ใน `scripts/changed-lanes.mjs` และถูกดำเนินการโดย `scripts/check-changed.mjs` เกตตรวจภายในเครื่องนี้เข้มงวดกว่าเกี่ยวกับขอบเขตสถาปัตยกรรมเมื่อเทียบกับขอบเขตแพลตฟอร์ม CI แบบกว้าง:

- การเปลี่ยนแปลง production ของแกนหลักจะรัน typecheck ของ core prod และ core test รวมถึง core lint/guards;
- การเปลี่ยนแปลงเฉพาะเทสต์ของแกนหลักจะรันเฉพาะ typecheck ของ core test รวมถึง core lint;
- การเปลี่ยนแปลง production ของ extension จะรัน typecheck ของ extension prod และ extension test รวมถึง extension lint;
- การเปลี่ยนแปลงเฉพาะเทสต์ของ extension จะรัน typecheck ของ extension test รวมถึง extension lint;
- การเปลี่ยนแปลง Plugin SDK สาธารณะหรือ plugin-contract จะขยายไปยัง typecheck ของ extension เพราะ extension พึ่งพาสัญญาแกนหลักเหล่านั้น (การ sweep extension ของ Vitest ยังคงเป็นงานเทสต์ที่ต้องระบุอย่างชัดเจน);
- การ bump เวอร์ชันที่เป็น release metadata-only จะรันการตรวจเวอร์ชัน/config/root-dependency แบบเจาะจง;
- การเปลี่ยนแปลง root/config ที่ไม่รู้จักจะ fail safe ไปยังเลนตรวจทั้งหมด

การกำหนดเส้นทาง changed-test ภายในเครื่องอยู่ใน `scripts/test-projects.test-support.mjs` และตั้งใจให้ถูกกว่า `check:changed`: การแก้เทสต์โดยตรงจะรันตัวเอง การแก้ซอร์สจะเลือก mapping ที่ระบุชัดก่อน จากนั้นจึงเป็นเทสต์พี่น้องและ dependent ใน import-graph config การส่งมอบ group-room ที่ใช้ร่วมกันเป็นหนึ่งใน mapping ที่ระบุชัด: การเปลี่ยนแปลง config การตอบกลับที่มองเห็นได้ในกลุ่ม, โหมดการส่งมอบการตอบกลับจากซอร์ส หรือ system prompt ของ message-tool จะวิ่งผ่านเทสต์การตอบกลับแกนหลัก รวมถึง regression การส่งมอบของ Discord และ Slack เพื่อให้การเปลี่ยนค่าเริ่มต้นร่วมกันล้มเหลวก่อน push PR ครั้งแรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างระดับ harness จนชุด mapped ราคาถูกไม่ใช่ proxy ที่เชื่อถือได้

## การตรวจสอบ Testbox

Crabbox คือ wrapper สำหรับกล่องระยะไกลที่ repo เป็นเจ้าของสำหรับหลักฐาน Linux ของผู้ดูแล ใช้จาก root ของ repo เมื่อการตรวจสอบกว้างเกินไปสำหรับลูปแก้ไขในเครื่อง, เมื่อความเท่าเทียมกับ CI สำคัญ, หรือเมื่อหลักฐานต้องใช้ secrets, Docker, package lanes, กล่องที่นำกลับมาใช้ซ้ำได้, หรือบันทึกระยะไกล backend ปกติของ OpenClaw คือ
`blacksmith-testbox`; capacity บน AWS/Hetzner ที่เป็นเจ้าของเองเป็น fallback สำหรับเหตุ Blacksmith ล่ม, ปัญหา quota, หรือการทดสอบด้วย capacity ที่เป็นเจ้าของอย่างชัดเจน

การรันที่มี Crabbox-backed Blacksmith จะ warm, claim, sync, run, report และ clean up
Testboxes แบบ one-shot การตรวจสอบ sanity ของ sync ที่มีมาในตัวจะ fail fast เมื่อไฟล์ root ที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short`
แสดงการลบไฟล์ที่ติดตามแล้วอย่างน้อย 200 รายการ สำหรับ PR ที่ตั้งใจลบไฟล์จำนวนมาก ให้ตั้ง
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับคำสั่งระยะไกล

Crabbox ยังยุติการเรียกใช้ Blacksmith CLI ในเครื่องที่ค้างอยู่ใน
เฟส sync เกินห้านาทีโดยไม่มี output หลัง sync ตั้งค่า
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` เพื่อปิด guard นั้น หรือใช้ค่า
มิลลิวินาทีที่มากขึ้นสำหรับ diff ในเครื่องที่ใหญ่ผิดปกติ

ก่อนรันครั้งแรก ให้ตรวจสอบ wrapper จาก root ของ repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

wrapper ของ repo จะปฏิเสธ binary Crabbox ที่ล้าสมัยซึ่งไม่ประกาศ `blacksmith-testbox` ส่ง provider อย่างชัดเจนแม้ว่า `.crabbox.yaml` จะมีค่า default ของ owned-cloud อยู่แล้ว ใน Codex worktrees หรือ linked/sparse checkouts ให้หลีกเลี่ยงสคริปต์ `pnpm crabbox:run` ในเครื่อง เพราะ pnpm อาจ reconcile dependencies ก่อนที่ Crabbox จะเริ่มทำงาน; ให้เรียก node wrapper โดยตรงแทน:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

การรันที่มี Blacksmith-backed ต้องใช้ Crabbox 0.22.0 หรือใหม่กว่า เพื่อให้ wrapper ได้พฤติกรรม Testbox sync, queue และ cleanup ปัจจุบัน เมื่อใช้ sibling checkout ให้ build binary ในเครื่องที่ถูก ignore ใหม่ก่อนงานจับเวลาหรือหลักฐาน:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Changed gate:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm check:changed"
```

รันการทดสอบแบบเจาะจงซ้ำ:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

ชุดทดสอบเต็ม:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

อ่านสรุป JSON สุดท้าย fields ที่มีประโยชน์คือ `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` และ `totalMs` สำหรับการรัน
Blacksmith Testbox แบบ delegated, exit code ของ Crabbox wrapper และสรุป JSON คือ
ผลลัพธ์ของคำสั่ง การรัน GitHub Actions ที่ลิงก์อยู่เป็นเจ้าของ hydration และ keepalive; อาจจบด้วย `cancelled` เมื่อ Testbox ถูกหยุดจากภายนอกหลังจากคำสั่ง SSH return แล้ว ให้ถือว่านั่นเป็น artifact ของ cleanup/status เว้นแต่ว่า
`exitCode` ของ wrapper จะไม่เป็นศูนย์ หรือ output ของคำสั่งแสดงว่าการทดสอบล้มเหลว
การรัน Crabbox แบบ one-shot ที่มี Blacksmith-backed ควรหยุด Testbox โดยอัตโนมัติ;
หากการรันถูกขัดจังหวะหรือ cleanup ไม่ชัดเจน ให้ตรวจสอบกล่องที่ live อยู่และหยุดเฉพาะ
กล่องที่คุณสร้าง:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

ใช้ reuse เฉพาะเมื่อคุณตั้งใจต้องใช้หลายคำสั่งบนกล่อง hydrated เดียวกัน:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

หาก Crabbox เป็นชั้นที่เสียแต่ Blacksmith เองทำงานได้ ให้ใช้ Blacksmith โดยตรง
เฉพาะสำหรับ diagnostics เช่น `list`, `status` และ cleanup แก้ path ของ
Crabbox ก่อนถือว่าการรัน Blacksmith โดยตรงเป็นหลักฐานของผู้ดูแล

หาก `blacksmith testbox list --all` และ `blacksmith testbox status` ทำงานได้ แต่ warmups ใหม่ค้างอยู่ที่ `queued` โดยไม่มี IP หรือ URL การรัน Actions หลังผ่านไปสองสามนาที
ให้ถือว่าเป็นแรงกดดันจาก Blacksmith provider, queue, billing หรือ org-limit หยุด
queued ids ที่คุณสร้าง, หลีกเลี่ยงการเริ่ม Testboxes เพิ่ม และย้ายหลักฐานไปยัง
path capacity ของ Crabbox ที่เป็นเจ้าของด้านล่าง ขณะที่มีคนตรวจสอบ Blacksmith dashboard,
billing และ org limits

Escalate ไปยัง capacity ของ Crabbox ที่เป็นเจ้าของเฉพาะเมื่อ Blacksmith ล่ม, ถูกจำกัด quota, ขาด environment ที่จำเป็น, หรือเป้าหมายคือ capacity ที่เป็นเจ้าของอย่างชัดเจน:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

เมื่อ AWS มีแรงกดดัน ให้หลีกเลี่ยง `class=beast` เว้นแต่งานต้องการ CPU ระดับ 48xlarge จริง ๆ คำขอ `beast` เริ่มที่ 192 vCPUs และเป็นวิธีที่ง่ายที่สุดในการชน quota ระดับภูมิภาคของ EC2 Spot หรือ On-Demand Standard `.crabbox.yaml` ที่ repo เป็นเจ้าของมีค่า default เป็น `standard`, หลาย capacity regions และ `capacity.hints: true` เพื่อให้ AWS leases ที่ brokered พิมพ์ region/market ที่เลือก, แรงกดดันของ quota, Spot fallback และคำเตือนคลาสแรงกดดันสูง ใช้ `fast` สำหรับการตรวจสอบกว้างที่หนักกว่า, ใช้ `large` เฉพาะหลังจาก standard/fast ไม่พอ และใช้ `beast` เฉพาะสำหรับ lanes ที่ CPU-bound เป็นพิเศษ เช่น full-suite หรือ Docker matrices ของทุก Plugin, การตรวจสอบ release/blocker อย่างชัดเจน, หรือการทำ performance profiling แบบ high-core อย่าใช้ `beast` สำหรับ `pnpm check:changed`, การทดสอบแบบเจาะจง, งาน docs-only, lint/typecheck ปกติ, E2E repro ขนาดเล็ก, หรือการ triage เหตุ Blacksmith ล่ม ใช้ `--market on-demand` สำหรับการวินิจฉัย capacity เพื่อไม่ให้ความผันผวนของ Spot market ปนเข้ากับสัญญาณ

`.crabbox.yaml` เป็นเจ้าของค่า default ของ provider, sync และ GitHub Actions hydration สำหรับ owned-cloud lanes ไฟล์นี้ exclude `.git` ในเครื่อง เพื่อให้ checkout ของ Actions ที่ hydrated คง remote Git metadata ของตัวเองไว้ แทนที่จะ sync remotes และ object stores ในเครื่องของผู้ดูแล และ exclude runtime/build artifacts ในเครื่องที่ไม่ควรถูกถ่ายโอน `.github/workflows/crabbox-hydrate.yml` เป็นเจ้าของ checkout, การตั้งค่า Node/pnpm, การ fetch `origin/main` และการส่งต่อ environment ที่ไม่ใช่ secret สำหรับคำสั่ง owned-cloud `crabbox run --id <cbx_id>`

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
