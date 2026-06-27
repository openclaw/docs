---
read_when:
    - คุณจำเป็นต้องเข้าใจว่าเหตุใดงาน CI จึงทำงานหรือไม่ทำงาน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการรันหรือรันซ้ำสำหรับการตรวจสอบความถูกต้องของรีลีส
    - คุณกำลังเปลี่ยนการส่งงานของ ClawSweeper หรือการส่งต่อกิจกรรม GitHub
summary: กราฟงาน CI, เกตขอบเขต, ร่มครอบการเผยแพร่ และคำสั่งเทียบเท่าในเครื่อง
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-06-27T17:15:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 630a787d9855000d49902445982c4d9b458604c2556214afa3f7e90a87804c71
    source_path: ci.md
    workflow: 16
---

OpenClaw CI ทำงานในทุกการ push ไปยัง `main` และทุก pull request การ push ไปยัง
`main` ที่เป็น canonical จะผ่านหน้าต่างรับงานของ hosted-runner 90 วินาทีก่อน
กลุ่ม concurrency `CI` ที่มีอยู่จะยกเลิก run ที่รออยู่นั้นเมื่อมี commit ใหม่กว่า
เข้ามา ดังนั้นการ merge ต่อเนื่องกันจะไม่ลงทะเบียนเมทริกซ์ Blacksmith แบบเต็ม
ทุกครั้ง Pull request และการ dispatch แบบ manual จะข้ามการรอ งาน `preflight`
จากนั้นจะจัดประเภท diff และปิด lane ที่มีค่าใช้จ่ายสูงเมื่อมีเพียงพื้นที่ที่ไม่เกี่ยวข้อง
เปลี่ยนแปลง การ run ด้วย `workflow_dispatch` แบบ manual จงใจข้าม smart
scoping และกระจายเป็นกราฟเต็มสำหรับ release candidate และการตรวจสอบแบบกว้าง
lane ของ Android ยังคงเป็นแบบ opt-in ผ่าน `include_android` ความครอบคลุม
Plugin เฉพาะ release อยู่ใน workflow แยก [`Plugin Prerelease`](#plugin-prerelease)
และทำงานจาก [`Full Release Validation`](#full-release-validation)
หรือการ dispatch แบบ manual ที่ระบุชัดเจนเท่านั้น

## ภาพรวม pipeline

| งาน                                | วัตถุประสงค์                                                                                                   | เวลาที่ทำงาน                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | ตรวจจับการเปลี่ยนแปลงเฉพาะ docs, scope ที่เปลี่ยน, extension ที่เปลี่ยน และสร้าง manifest ของ CI                   | เสมอเมื่อเป็น push และ PR ที่ไม่ใช่ draft                  |
| `runner-admission`                 | debounce 90 วินาทีบน hosted runner สำหรับการ push ไปยัง `main` แบบ canonical ก่อนลงทะเบียนงาน Blacksmith                | ทุก CI run; sleep เฉพาะการ push ไปยัง `main` แบบ canonical |
| `security-fast`                    | ตรวจจับ private key, audit workflow ที่เปลี่ยนผ่าน `zizmor`, และ audit production lockfile                 | เสมอเมื่อเป็น push และ PR ที่ไม่ใช่ draft                  |
| `check-dependencies`               | pass เฉพาะ dependency ของ production ด้วย Knip พร้อม guard allowlist สำหรับไฟล์ที่ไม่ได้ใช้                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `build-artifacts`                  | สร้าง `dist/`, Control UI, smoke check ของ built-CLI, check built-artifact ที่ฝังไว้ และ artifact ที่นำกลับมาใช้ได้ | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-fast-core`                 | lane ตรวจความถูกต้อง Linux แบบเร็ว เช่น bundled, protocol, QA Smoke CI และ check การ routing ของ CI                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-fast-contracts-plugins-*`  | check contract ของ Plugin แบบแบ่ง shard สองชุด                                                                        | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-fast-contracts-channels-*` | check contract ของ channel แบบแบ่ง shard สองชุด                                                                       | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-node-core-*`               | shard การทดสอบ core Node โดยไม่รวม channel, bundled, contract และ lane ของ extension                          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `check-*`                          | เทียบเท่า gate หลักแบบ local ที่แบ่ง shard: prod types, lint, guards, test types และ strict smoke                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `check-additional-*`               | สถาปัตยกรรม, boundary/prompt drift แบบแบ่ง shard, guard ของ extension, boundary ของ package และ runtime topology     | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-node-compat-node22`        | build และ smoke lane สำหรับความเข้ากันได้กับ Node 22                                                                | การ dispatch CI แบบ manual สำหรับ release                     |
| `check-docs`                       | การจัดรูปแบบ docs, lint และ check ลิงก์เสีย                                                             | docs เปลี่ยน                                        |
| `skills-python`                    | Ruff + pytest สำหรับ Skills ที่ใช้ Python รองรับ                                                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python skill                       |
| `checks-windows`                   | การทดสอบ process/path เฉพาะ Windows พร้อม regression ของ runtime import specifier ที่ใช้ร่วมกัน                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows                            |
| `macos-node`                       | lane ทดสอบ TypeScript บน macOS โดยใช้ built artifact ที่ใช้ร่วมกัน                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS                              |
| `macos-swift`                      | Swift lint, build และ test สำหรับแอป macOS                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS                              |
| `ios-build`                        | การสร้างโปรเจกต์ Xcode พร้อม build simulator ของแอป iOS                                                 | แอป iOS, shared app kit หรือ Swabble เปลี่ยน         |
| `android`                          | unit test ของ Android สำหรับทั้งสอง flavor พร้อม build debug APK หนึ่งชุด                                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android                            |
| `test-performance-agent`           | การปรับแต่ง slow-test ของ Codex รายวันหลังมีกิจกรรมที่เชื่อถือได้                                                 | CI หลักสำเร็จหรือ manual dispatch                  |
| `openclaw-performance`             | รายงานประสิทธิภาพ runtime ของ Kova แบบรายวัน/ตามต้องการ พร้อม lane mock-provider, deep-profile และ GPT 5.5 live | ตามกำหนดเวลาและ manual dispatch                       |

## ลำดับ fail-fast

1. `runner-admission` รอเฉพาะการ push ไปยัง `main` แบบ canonical; push ที่ใหม่กว่าจะยกเลิก run ก่อนการลงทะเบียน Blacksmith
2. `preflight` ตัดสินว่า lane ใดมีอยู่บ้างตั้งแต่แรก logic `docs-scope` และ `changed-scope` เป็น step ภายในงานนี้ ไม่ใช่งานแยก
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` และ `skills-python` fail อย่างรวดเร็วโดยไม่ต้องรองาน artifact และเมทริกซ์ platform ที่หนักกว่า
4. `build-artifacts` ทำงานทับซ้อนกับ lane Linux แบบเร็ว เพื่อให้ consumer downstream เริ่มได้ทันทีที่ shared build พร้อม
5. lane ของ platform และ runtime ที่หนักกว่าจะกระจายออกหลังจากนั้น: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` และ `android`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่เป็น `cancelled` เมื่อมี push ใหม่กว่าลงบน PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่านั่นเป็น noise ของ CI เว้นแต่ run ล่าสุดของ ref เดียวกันจะ fail ด้วย งานเมทริกซ์ใช้ `fail-fast: false` และ `build-artifacts` รายงานความล้มเหลวของ embedded channel, core-support-boundary และ gateway-watch โดยตรง แทนที่จะต่อคิวงาน verifier ขนาดเล็ก คีย์ concurrency อัตโนมัติของ CI มีการใส่เวอร์ชัน (`CI-v7-*`) เพื่อให้ zombie ฝั่ง GitHub ในกลุ่มคิวเก่าไม่สามารถบล็อก run หลักที่ใหม่กว่าอย่างไม่มีกำหนด run full-suite แบบ manual ใช้ `CI-manual-v1-*` และไม่ยกเลิก run ที่กำลังดำเนินอยู่

ใช้ `pnpm ci:timings`, `pnpm ci:timings:recent` หรือ `node scripts/ci-run-timings.mjs <run-id>` เพื่อสรุป wall time, queue time, งานที่ช้าที่สุด, ความล้มเหลว และ barrier fanout `pnpm-store-warmup` จาก GitHub Actions CI ยังอัปโหลด run summary เดียวกันเป็น artifact `ci-timings-summary` ด้วย สำหรับ timing ของ build ให้ตรวจ step `Build dist` ของงาน `build-artifacts`: `pnpm build:ci-artifacts` พิมพ์ `[build-all] phase timings:` และรวม `ui:build`; งานยังอัปโหลด artifact `startup-memory` ด้วย

สำหรับ run ของ pull request งาน timing-summary สุดท้ายจะเรียก helper จาก revision ฐานที่เชื่อถือได้ ก่อนส่ง `GH_TOKEN` ให้ `gh run view` วิธีนี้ทำให้ query ที่มี token อยู่พ้นจาก code ที่ branch ควบคุม ขณะยังสรุป CI run ปัจจุบันของ pull request ได้

## บริบท PR และหลักฐาน

PR จาก contributor ภายนอกจะ run gate บริบท PR และหลักฐานจาก
`.github/workflows/real-behavior-proof.yml` workflow จะ checkout commit ฐานที่เชื่อถือได้
และประเมินเฉพาะ body ของ PR; จะไม่ execute code จาก branch ของ contributor

gate ใช้กับผู้เขียน PR ที่ไม่ใช่เจ้าของ repository, member,
collaborator หรือ bot โดยจะผ่านเมื่อ body ของ PR มี section ที่เขียนเองคือ
`What Problem This Solves` และ `Evidence` หลักฐานอาจเป็น test ที่มีโฟกัส,
ผล CI, screenshot, recording, terminal output, การสังเกต live,
log ที่ redact แล้ว หรือ link artifact body ให้เจตนาและการตรวจสอบที่มีประโยชน์;
reviewer จะตรวจ code, test และ CI เพื่อประเมินความถูกต้อง

เมื่อ check fail ให้ update body ของ PR แทนการ push code commit อีกครั้ง

## Scope และ routing

logic ของ scope อยู่ใน `scripts/ci-changed-scope.mjs` และมี unit test ครอบคลุมใน `src/scripts/ci-changed-scope.test.ts` การ dispatch แบบ manual จะข้ามการตรวจจับ changed-scope และทำให้ preflight manifest ทำเหมือนทุกพื้นที่ที่มี scope เปลี่ยนแปลง

- **การแก้ไข workflow ของ CI** ตรวจสอบกราฟ CI ของ Node พร้อม workflow linting แต่ไม่ได้บังคับ Windows, iOS, Android หรือ native build ของ macOS ด้วยตัวเอง; lane ของ platform เหล่านั้นยังคง scoped ตามการเปลี่ยนแปลง source ของ platform
- **Workflow Sanity** run `actionlint`, `zizmor` กับไฟล์ YAML ของ workflow ทั้งหมด, guard การ interpolation ของ composite-action และ guard conflict-marker งาน `security-fast` ที่ scoped ตาม PR ยัง run `zizmor` กับไฟล์ workflow ที่เปลี่ยน เพื่อให้ finding ด้านความปลอดภัยของ workflow fail ตั้งแต่เนิ่นๆ ในกราฟ CI หลัก
- **Docs บนการ push ไปยัง `main`** ถูก check โดย workflow `Docs` แบบ standalone ด้วย mirror docs ของ ClawHub เดียวกับที่ CI ใช้ ดังนั้น push แบบผสม code+docs จะไม่ต่อคิว shard `check-docs` ของ CI อีกด้วย Pull request และ CI แบบ manual ยังคง run `check-docs` จาก CI เมื่อ docs เปลี่ยน
- **TUI PTY** run ใน shard Linux Node `checks-node-core-runtime-tui-pty` สำหรับการเปลี่ยนแปลง TUI shard จะ run `test/vitest/vitest.tui-pty.config.ts` พร้อม `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` ดังนั้นจึงครอบคลุมทั้ง lane fixture `TuiBackend` แบบ deterministic และ smoke `tui --local` ที่ช้ากว่าซึ่ง mock เฉพาะ endpoint ของ model ภายนอก
- **การแก้ไขเฉพาะ routing ของ CI, การแก้ไข fixture core-test ราคาถูกบางรายการ และการแก้ไข helper/test-routing ของ plugin contract ที่แคบ** ใช้ path manifest แบบ Node-only ที่รวดเร็ว: `preflight`, security และ task `checks-fast-core` เดียว path นี้ข้าม build artifact, ความเข้ากันได้กับ Node 22, channel contract, shard core เต็ม, shard bundled-plugin และเมทริกซ์ guard เพิ่มเติม เมื่อการเปลี่ยนแปลงจำกัดอยู่ที่ routing หรือผิว helper ที่ task เร็วทดสอบโดยตรง
- **Windows Node checks** scoped ตาม wrapper process/path เฉพาะ Windows, helper runner ของ npm/pnpm/UI, config ของ package manager และผิว workflow CI ที่ execute lane นั้น; source, Plugin, install-smoke และการเปลี่ยนแปลงเฉพาะ test ที่ไม่เกี่ยวข้องยังอยู่บน lane Linux Node

กลุ่มการทดสอบ Node ที่ช้าที่สุดถูกแยกหรือถ่วงสมดุลเพื่อให้งานแต่ละงานยังมีขนาดเล็กโดยไม่จอง runner เกินจำเป็น: สัญญา Plugin และสัญญาช่องทางแต่ละรายการรันเป็นชาร์ดถ่วงน้ำหนักสองชาร์ดที่หนุนด้วย Blacksmith พร้อม fallback runner มาตรฐานของ GitHub, เลน core unit fast/support รันแยกกัน, โครงสร้างพื้นฐาน runtime ของ core ถูกแยกระหว่าง state, process/config, shared และชาร์ดโดเมน cron สามชาร์ด, auto-reply รันเป็น worker ที่ถ่วงสมดุลแล้ว (โดยซับทรีการตอบกลับแยกเป็นชาร์ด agent-runner, dispatch และ commands/state-routing) และการตั้งค่า agentic gateway/server ถูกแยกข้ามเลน chat/auth/model/http-plugin/runtime/startup แทนที่จะรอบนอาร์ติแฟกต์ที่ build แล้ว จากนั้น CI ปกติจะแพ็กเฉพาะชาร์ด include-pattern ของโครงสร้างพื้นฐานที่แยกตัวแล้วเข้าเป็น bundle แบบกำหนดผลได้ที่มีไฟล์ทดสอบไม่เกิน 64 ไฟล์ ลด matrix ของ Node โดยไม่รวมชุด non-isolated command/cron, stateful agents-core หรือ gateway/server เข้าด้วยกัน; ชุด fixed หนักยังคงใช้ 8 vCPU ขณะที่เลนแบบ bundle และเลนน้ำหนักต่ำกว่าใช้ 4 vCPU Pull request บน repository หลักใช้แผนรับเข้าแบบกะทัดรัดเพิ่มเติม: กลุ่ม per-config เดียวกันรันใน subprocess ที่แยกตัวภายในแผน Linux Node 34 งานปัจจุบัน ดังนั้น PR เดียวจะไม่ลงทะเบียน matrix Node แบบเต็มที่มีมากกว่า 70 งาน การ push ไปยัง `main`, การ dispatch แบบ manual และ gate ของ release ยังคงใช้ matrix เต็ม การทดสอบ browser, QA, media และ Plugin เบ็ดเตล็ดขนาดกว้างใช้ config Vitest เฉพาะของตนแทน catch-all Plugin ที่ใช้ร่วมกัน ชาร์ด include-pattern บันทึกรายการ timing โดยใช้ชื่อชาร์ด CI เพื่อให้ `.artifacts/vitest-shard-timings.json` แยกแยะทั้ง config ทั้งชุดออกจากชาร์ดที่ถูกกรองได้ `check-additional-*` เก็บงาน compile/canary ข้าม boundary ของ package ไว้ด้วยกันและแยกสถาปัตยกรรม runtime topology ออกจาก coverage ของ gateway watch; รายการ boundary guard ถูกแบ่งเป็นชาร์ด prompt-heavy หนึ่งชาร์ดและชาร์ดรวมหนึ่งชาร์ดสำหรับ guard stripe ที่เหลือ โดยแต่ละชาร์ดรัน guard อิสระที่เลือกไว้พร้อมกันและพิมพ์ timing ต่อ check การตรวจ drift ของ prompt snapshot เส้นทางสำเร็จของ Codex ที่มีต้นทุนสูงรันเป็นงานเพิ่มเติมของตัวเองเฉพาะสำหรับ CI แบบ manual และการเปลี่ยนแปลงที่กระทบ prompt เท่านั้น ดังนั้นการเปลี่ยนแปลง Node ปกติที่ไม่เกี่ยวข้องจะไม่ต้องรอหลังการสร้าง prompt snapshot แบบ cold และชาร์ด boundary ยังสมดุลอยู่ ขณะที่ prompt drift ยังคงถูกผูกไว้กับ PR ที่เป็นสาเหตุ; flag เดียวกันข้ามการสร้าง prompt snapshot ของ Vitest ภายในชาร์ด core support-boundary ของ built-artifact Gateway watch, การทดสอบช่องทาง และชาร์ด core support-boundary รันพร้อมกันภายใน `build-artifacts` หลังจาก `dist/` และ `dist-runtime/` ถูก build แล้ว

เมื่อผ่านการรับเข้าแล้ว CI ของ Linux หลักอนุญาตงานทดสอบ Node พร้อมกันได้สูงสุด 24 งานและ
12 งานสำหรับเลน fast/check ที่เล็กกว่า; Windows และ Android ยังคงอยู่ที่สองเพราะ
pool ของ runner เหล่านั้นแคบกว่า

แผน PR แบบกะทัดรัดปล่อยงาน Node 18 งานสำหรับชุดปัจจุบัน: กลุ่ม whole-config
ถูก batch ใน subprocess ที่แยกตัวพร้อม timeout ของ batch 120 นาที
ขณะที่กลุ่ม include-pattern ใช้งบประมาณงานที่มีขอบเขตเดียวกัน

CI ของ Android รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` แล้วจึง build APK debug ของ Play flavor ของ third-party ไม่มี source set หรือ manifest แยกต่างหาก; เลน unit-test ของมันยัง compile flavor ด้วย flag BuildConfig สำหรับ SMS/call-log ขณะหลีกเลี่ยงงาน package APK debug ซ้ำในทุก push ที่เกี่ยวข้องกับ Android

ชาร์ด `check-dependencies` รัน `pnpm deadcode:dependencies` (รอบ production Knip แบบ dependency-only ที่ปักกับ Knip เวอร์ชันล่าสุด โดยปิดอายุ release ขั้นต่ำของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบผล unused-file ของ production จาก Knip กับ `scripts/deadcode-unused-files.allowlist.mjs` guard unused-file จะล้มเหลวเมื่อ PR เพิ่มไฟล์ unused ใหม่ที่ยังไม่ได้ review หรือทิ้งรายการ allowlist ที่ล้าสมัยไว้ ขณะยังคงรักษาพื้นผิว dynamic Plugin, generated, build, live-test และ package bridge ที่ตั้งใจไว้ซึ่ง Knip resolve แบบ static ไม่ได้

## การส่งต่อกิจกรรม ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` คือ bridge ฝั่งเป้าหมายจากกิจกรรม repository ของ OpenClaw ไปยัง ClawSweeper มันไม่ checkout หรือ execute โค้ด pull request ที่ไม่น่าเชื่อถือ workflow สร้าง token ของ GitHub App จาก `CLAWSWEEPER_APP_PRIVATE_KEY` แล้ว dispatch payload `repository_dispatch` แบบกะทัดรัดไปยัง `openclaw/clawsweeper`

workflow มีสี่เลน:

- `clawsweeper_item` สำหรับคำขอ review issue และ pull request แบบเจาะจง;
- `clawsweeper_comment` สำหรับคำสั่ง ClawSweeper แบบชัดเจนใน comment ของ issue;
- `clawsweeper_commit_review` สำหรับคำขอ review ระดับ commit บนการ push ไปยัง `main`;
- `github_activity` สำหรับกิจกรรม GitHub ทั่วไปที่ agent ClawSweeper อาจ inspect

เลน `github_activity` ส่งต่อเฉพาะ metadata ที่ normalize แล้ว: event type, action, actor, repository, item number, URL, title, state และ excerpt สั้นสำหรับ comment หรือ review เมื่อมี โดยตั้งใจหลีกเลี่ยงการส่งต่อ body ของ Webhook แบบเต็ม workflow ฝั่งรับใน `openclaw/clawsweeper` คือ `.github/workflows/github-activity.yml` ซึ่ง post event ที่ normalize แล้วไปยัง hook ของ OpenClaw Gateway สำหรับ agent ClawSweeper

กิจกรรมทั่วไปเป็นการสังเกต ไม่ใช่การส่งมอบโดย default agent ClawSweeper ได้รับ target Discord ใน prompt และควร post ไปยัง `#clawsweeper` เฉพาะเมื่อ event น่าประหลาดใจ ดำเนินการได้ มีความเสี่ยง หรือเป็นประโยชน์ต่อการดำเนินงาน การเปิด การแก้ไข ความเคลื่อนไหวของ bot เสียงรบกวนจาก Webhook ซ้ำ และ traffic review ปกติควรได้ผลลัพธ์เป็น `NO_REPLY`

ถือว่า title, comment, body, ข้อความ review, ชื่อ branch และข้อความ commit ของ GitHub เป็นข้อมูลที่ไม่น่าเชื่อถือตลอด path นี้ สิ่งเหล่านี้เป็น input สำหรับการสรุปและ triage ไม่ใช่คำสั่งสำหรับ workflow หรือ runtime ของ agent

## การ dispatch แบบ manual

การ dispatch CI แบบ manual รันกราฟงานเดียวกับ CI ปกติ แต่บังคับเปิดทุกเลน scoped ที่ไม่ใช่ Android: ชาร์ด Linux Node, ชาร์ด bundled-plugin, ชาร์ดสัญญา Plugin และช่องทาง, ความเข้ากันได้กับ Node 22, `check-*`, `check-additional-*`, smoke check ของ built-artifact, การตรวจ docs, Python skills, Windows, macOS, build iOS และ i18n ของ Control UI การ dispatch CI แบบ manual แบบ standalone จะรัน Android เท่านั้นด้วย `include_android=true`; umbrella ของ release เต็มเปิดใช้ Android โดยส่ง `include_android=true` การตรวจ static prerelease ของ Plugin, ชาร์ด `agentic-plugins` เฉพาะ release, sweep batch extension เต็ม และเลน Docker prerelease ของ Plugin ถูกแยกออกจาก CI ชุด prerelease ของ Docker รันเฉพาะเมื่อ `Full Release Validation` dispatch workflow `Plugin Prerelease` แยกต่างหากพร้อมเปิด gate release-validation

การรันแบบ manual ใช้ concurrency group ที่ไม่ซ้ำกัน ดังนั้นชุดเต็มของ release-candidate จะไม่ถูกยกเลิกโดยการ push หรือการรัน PR อื่นบน ref เดียวกัน input `target_ref` แบบ optional ช่วยให้ caller ที่เชื่อถือได้รันกราฟนั้นกับ branch, tag หรือ full commit SHA ได้ ขณะใช้ไฟล์ workflow จาก dispatch ref ที่เลือก

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                          | งาน                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | การ dispatch CI แบบ manual และ fallback ของ repository ที่ไม่ใช่ canonical, การสแกนคุณภาพ CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow docs นอก CI และ preflight install-smoke เพื่อให้ matrix Blacksmith เข้าคิวได้เร็วขึ้น                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, ชาร์ด extension น้ำหนักต่ำกว่า, `checks-fast-core`, ชาร์ดสัญญา Plugin/channel, ชาร์ด Linux Node แบบ bundled/น้ำหนักต่ำกว่าส่วนใหญ่, `check-guards`, `check-prod-types`, `check-test-types`, ชาร์ด `check-additional-*` ที่เลือกไว้ และ `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | ชุด Linux Node หนักที่คงไว้, ชาร์ด `check-additional-*` ที่หนักด้าน boundary/extension และ `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (ไวต่อ CPU มากพอที่ 8 vCPU มีต้นทุนมากกว่าที่ประหยัดได้); build Docker ของ install-smoke (เวลา queue ของ 32-vCPU มีต้นทุนมากกว่าที่ประหยัดได้)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` บน `openclaw/openclaw`; fork fallback ไปที่ `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` และ `ios-build` บน `openclaw/openclaw`; fork fallback ไปที่ `macos-26`                                                                                                                                                                                                  |

## งบประมาณการลงทะเบียน Runner

bucket การลงทะเบียน runner ของ GitHub ปัจจุบันของ OpenClaw อนุญาตการลงทะเบียน runner
แบบ self-hosted 3,000 รายการต่อ 5 นาที ขีดจำกัดนี้ใช้ร่วมกันโดยการลงทะเบียน runner
Blacksmith ทั้งหมดในองค์กร `openclaw` ดังนั้นการเพิ่มการติดตั้ง Blacksmith
อีกชุดจะไม่เพิ่ม bucket ใหม่

ถือว่า label ของ Blacksmith เป็นทรัพยากรขาดแคลนสำหรับการควบคุม burst งานที่
ทำแค่ route, notify, summarize, เลือกชาร์ด หรือรันการสแกน CodeQL สั้น ๆ ควร
อยู่บน runner ที่ GitHub host ยกเว้นมีความต้องการเฉพาะ Blacksmith ที่วัดผลแล้ว
matrix Blacksmith ใหม่ใด ๆ, `max-parallel` ที่ใหญ่ขึ้น หรือ workflow
ความถี่สูงต้องแสดงจำนวนการลงทะเบียนกรณีเลวร้ายที่สุดและรักษาเป้าหมายระดับองค์กร
ให้ต่ำกว่า 2,000 การลงทะเบียนต่อ 5 นาที โดยเหลือ headroom สำหรับ
repository ที่รันพร้อมกันและงานที่ retry

CI ของ canonical-repo คง Blacksmith เป็น path runner default สำหรับการรัน push และ pull-request ปกติ `workflow_dispatch` และการรัน repository ที่ไม่ใช่ canonical ใช้ runner ที่ GitHub host แต่การรัน canonical ปกติในปัจจุบันไม่ได้ probe สุขภาพ queue ของ Blacksmith หรือ fallback ไปยัง label ที่ GitHub host โดยอัตโนมัติเมื่อ Blacksmith ไม่พร้อมใช้งาน

## สิ่งเทียบเท่าใน local

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

`OpenClaw Performance` คือเวิร์กโฟลว์ประสิทธิภาพของผลิตภัณฑ์/รันไทม์ โดยทำงานทุกวันบน `main` และสามารถสั่งรันเองได้:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

การสั่งรันเองโดยปกติจะเบนช์มาร์ก ref ของเวิร์กโฟลว์ ตั้งค่า `target_ref` เพื่อเบนช์มาร์กแท็กรุ่นเผยแพร่หรือสาขาอื่นด้วยอิมพลีเมนเทชันเวิร์กโฟลว์ปัจจุบัน พาธรายงานที่เผยแพร่และตัวชี้ล่าสุดจะผูกกับ ref ที่ทดสอบ และ `index.md` แต่ละไฟล์จะบันทึก ref/SHA ที่ทดสอบ, ref/SHA ของเวิร์กโฟลว์, ref ของ Kova, โปรไฟล์, โหมดการยืนยันตัวตนของเลน, โมเดล, จำนวนรอบซ้ำ และตัวกรองสถานการณ์

เวิร์กโฟลว์ติดตั้ง OCM จากรุ่นเผยแพร่ที่ปักหมุดไว้ และติดตั้ง Kova จาก `openclaw/Kova` ที่อินพุต `kova_ref` ซึ่งปักหมุดไว้ จากนั้นรันสามเลน:

- `mock-provider`: สถานการณ์วินิจฉัยของ Kova เทียบกับรันไทม์ที่บิลด์ในเครื่อง พร้อมการยืนยันตัวตนปลอมที่เข้ากันได้กับ OpenAI แบบกำหนดผลซ้ำได้
- `mock-deep-profile`: การทำโปรไฟล์ CPU/ฮีป/เทรซสำหรับจุดร้อนของการเริ่มต้น, gateway และ agent-turn
- `live-openai-candidate`: agent turn จริงของ OpenAI `openai/gpt-5.5` ซึ่งจะข้ามเมื่อไม่มี `OPENAI_API_KEY`

เลน mock-provider ยังรันโพรบซอร์สแบบ OpenClaw-native หลังจาก Kova ผ่านแล้ว ได้แก่ เวลาและหน่วยความจำการบูต gateway ในกรณีเริ่มต้นแบบค่าเริ่มต้น, hook และ 50-plugin; RSS การนำเข้า Plugin ที่บันเดิลไว้, ลูป hello ของ mock-OpenAI `channel-chat-baseline` ซ้ำหลายครั้ง, คำสั่งเริ่มต้น CLI เทียบกับ gateway ที่บูตแล้ว และโพรบประสิทธิภาพ smoke ของสถานะ SQLite เมื่อรายงานซอร์ส mock-provider ที่เผยแพร่ก่อนหน้าพร้อมใช้งานสำหรับ ref ที่ทดสอบ สรุปซอร์สจะเปรียบเทียบค่า RSS และฮีปปัจจุบันกับ baseline นั้น และทำเครื่องหมายการเพิ่มขึ้นของ RSS ขนาดใหญ่ว่า `watch` สรุป Markdown ของโพรบซอร์สอยู่ที่ `source/index.md` ในชุดรายงาน โดยมี JSON ดิบอยู่ข้างกัน

ทุกเลนอัปโหลดอาร์ติแฟกต์ของ GitHub เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว เวิร์กโฟลว์จะคอมมิต `report.json`, `report.md`, บันเดิล, `index.md` และอาร์ติแฟกต์โพรบซอร์สเข้าไปใน `openclaw/clawgrit-reports` ภายใต้ `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` ด้วย ตัวชี้ tested-ref ปัจจุบันจะถูกเขียนเป็น `openclaw-performance/<tested-ref>/latest-<lane>.json`

## การตรวจสอบรุ่นเผยแพร่แบบเต็ม

`Full Release Validation` คือเวิร์กโฟลว์ครอบรวมแบบสั่งรันเองสำหรับ "รันทุกอย่างก่อนเผยแพร่รุ่น" โดยรับสาขา, แท็ก หรือ commit SHA แบบเต็ม สั่งรันเวิร์กโฟลว์ `CI` แบบแมนนวลด้วยเป้าหมายนั้น สั่งรัน `Plugin Prerelease` สำหรับหลักฐาน Plugin/แพ็กเกจ/สแตติก/Docker ที่ใช้เฉพาะรุ่นเผยแพร่ และสั่งรัน `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, การตรวจสอบแพ็กเกจข้าม OS, การเรนเดอร์ maturity scorecard จากหลักฐานโปรไฟล์ QA, QA Lab parity, Matrix และเลน Telegram โปรไฟล์ stable และ full จะรวมความครอบคลุม live/E2E แบบละเอียดและ Docker release-path soak เสมอ ส่วนโปรไฟล์ beta สามารถเลือกเปิดด้วย `run_release_soak=true` ได้ Telegram E2E สำหรับแพ็กเกจ canonical จะรันภายใน Package Acceptance ดังนั้น candidate แบบเต็มจะไม่เริ่ม live poller ซ้ำ หลังเผยแพร่แล้ว ให้ส่ง `release_package_spec` เพื่อใช้แพ็กเกจ npm ที่จัดส่งแล้วซ้ำในการตรวจสอบรุ่นเผยแพร่, Package Acceptance, Docker, ข้าม OS และ Telegram โดยไม่ต้องบิลด์ใหม่ ใช้ `npm_telegram_package_spec` เฉพาะสำหรับการรันซ้ำ Telegram แบบมุ่งเฉพาะแพ็กเกจที่เผยแพร่แล้ว เลนแพ็กเกจ live ของ Plugin Codex ใช้สถานะที่เลือกเดียวกันโดยค่าเริ่มต้น: `release_package_spec=openclaw@<tag>` ที่เผยแพร่แล้วจะได้ `codex_plugin_spec=npm:@openclaw/codex@<tag>` ส่วนการรันด้วย SHA/อาร์ติแฟกต์จะแพ็ก `extensions/codex` จาก ref ที่เลือก ตั้งค่า `codex_plugin_spec` อย่างชัดเจนสำหรับซอร์ส Plugin แบบกำหนดเอง เช่น spec แบบ `npm:`, `npm-pack:` หรือ `git:`

ดู [การตรวจสอบรุ่นเผยแพร่แบบเต็ม](/th/reference/full-release-validation) สำหรับ
เมทริกซ์สเตจ, ชื่องานเวิร์กโฟลว์ที่แน่นอน, ความแตกต่างของโปรไฟล์, อาร์ติแฟกต์ และ
handle สำหรับการรันซ้ำแบบมุ่งเฉพาะ

`OpenClaw Release Publish` คือเวิร์กโฟลว์เผยแพร่รุ่นแบบสั่งรันเองที่มีการเปลี่ยนแปลงสถานะ สั่งรันจาก
`release/YYYY.M.PATCH` หรือ `main` หลังจากมีแท็กรุ่นเผยแพร่แล้ว และหลังจาก
OpenClaw npm preflight สำเร็จแล้ว เวิร์กโฟลว์จะตรวจสอบ `pnpm plugins:sync:check`,
สั่งรัน `Plugin NPM Release` สำหรับแพ็กเกจ Plugin ทั้งหมดที่เผยแพร่ได้, สั่งรัน
`Plugin ClawHub Release` สำหรับ SHA รุ่นเผยแพร่เดียวกัน และจากนั้นจึงสั่งรัน
`OpenClaw NPM Release` ด้วย `preflight_run_id` ที่บันทึกไว้ การเผยแพร่ stable ยัง
ต้องใช้ `windows_node_tag` ที่ตรงแบบเป๊ะด้วย เวิร์กโฟลว์จะตรวจสอบซอร์สรุ่นเผยแพร่ของ Windows
และเปรียบเทียบตัวติดตั้ง x64/ARM64 กับอินพุต `windows_node_installer_digests`
ที่ candidate อนุมัติแล้วก่อน child การเผยแพร่ใดๆ จากนั้นโปรโมต
และตรวจสอบ digest ตัวติดตั้งที่ปักหมุดชุดเดียวกัน รวมถึง asset คู่และสัญญา checksum
ที่ตรงแบบเป๊ะ ก่อนเผยแพร่ draft รุ่นเผยแพร่ของ GitHub

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

สำหรับหลักฐานคอมมิตที่ปักหมุดไว้บนสาขาที่เคลื่อนไหวเร็ว ให้ใช้ helper แทน
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

ref สำหรับ dispatch เวิร์กโฟลว์ GitHub ต้องเป็นสาขาหรือแท็ก ไม่ใช่ commit SHA ดิบ
helper จะ push สาขาชั่วคราว `release-ci/<sha>-...` ที่ SHA เป้าหมาย,
สั่งรัน `Full Release Validation` จาก ref ที่ปักหมุดนั้น, ตรวจสอบว่า `headSha` ของ child
workflow ทุกตัวตรงกับเป้าหมาย และลบสาขาชั่วคราวเมื่อการรันเสร็จสิ้น
ตัวตรวจสอบ umbrella จะล้มเหลวด้วยหาก child workflow ใดรันที่ SHA
ต่างกัน

`release_profile` ควบคุมความกว้างของ live/provider ที่ส่งต่อเข้า release checks
เวิร์กโฟลว์รุ่นเผยแพร่แบบแมนนวลใช้ค่าเริ่มต้นเป็น `stable`; ใช้ `full` เฉพาะเมื่อคุณ
ตั้งใจต้องการเมทริกซ์ provider/media เชิง advisory ที่กว้าง โปรไฟล์ stable และ full
release checks จะรัน live/E2E แบบละเอียดและ Docker release-path soak เสมอ;
โปรไฟล์ beta สามารถเลือกเปิดด้วย `run_release_soak=true`

- `minimum` เก็บเลน OpenAI/core ที่เร็วที่สุดและสำคัญต่อรุ่นเผยแพร่
- `stable` เพิ่มชุด provider/backend แบบ stable
- `full` รันเมทริกซ์ provider/media เชิง advisory ที่กว้าง

umbrella จะบันทึก run id ของ child ที่สั่งรัน และงานสุดท้าย `Verify full validation` จะตรวจซ้ำข้อสรุปการรัน child ปัจจุบัน และผนวกตารางงานที่ช้าที่สุดสำหรับ child run แต่ละรายการ หาก child workflow ถูกรันซ้ำและเปลี่ยนเป็นสีเขียว ให้รันซ้ำเฉพาะงานตัวตรวจสอบ parent เพื่อรีเฟรชผลลัพธ์ umbrella และสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รองรับ `rerun_group` ใช้ `all` สำหรับ release candidate, `ci` สำหรับเฉพาะ child ของ full CI ปกติ, `plugin-prerelease` สำหรับเฉพาะ child ของ plugin prerelease, `release-checks` สำหรับ child รุ่นเผยแพร่ทุกตัว หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` หรือ `npm-telegram` บน umbrella วิธีนี้ช่วยจำกัดการรันซ้ำของ release box ที่ล้มเหลวหลังการแก้ไขแบบมุ่งเฉพาะ สำหรับเลนข้าม OS ที่ล้มเหลวหนึ่งรายการ ให้รวม `rerun_group=cross-os` กับ `cross_os_suite_filter` เช่น `windows/packaged-upgrade`; คำสั่งข้าม OS ที่ยาวจะส่งบรรทัด heartbeat และสรุป packaged-upgrade จะรวมเวลารายเฟส เลน QA release-check เป็น advisory ยกเว้น gate ความครอบคลุมเครื่องมือรันไทม์มาตรฐาน ซึ่งจะบล็อกเมื่อเครื่องมือ dynamic ของ OpenClaw ที่จำเป็นเกิด drift หรือหายไปจากสรุประดับมาตรฐาน

`OpenClaw Release Checks` ใช้ ref เวิร์กโฟลว์ที่เชื่อถือได้เพื่อ resolve ref ที่เลือกหนึ่งครั้งเป็น tarball `release-package-under-test` จากนั้นส่งอาร์ติแฟกต์นั้นไปยังการตรวจสอบข้าม OS และ Package Acceptance รวมถึงเวิร์กโฟลว์ Docker live/E2E release-path เมื่อรันความครอบคลุม soak สิ่งนี้ทำให้ไบต์ของแพ็กเกจสอดคล้องกันข้าม release boxes และหลีกเลี่ยงการแพ็ก candidate เดียวกันซ้ำในหลาย child jobs สำหรับเลน live ของ Codex npm-plugin release checks จะส่ง plugin spec ที่เผยแพร่แล้วและตรงกันซึ่งได้มาจาก `release_package_spec`, ส่ง `codex_plugin_spec` ที่ operator ระบุมา หรือปล่อยอินพุตว่างไว้เพื่อให้สคริปต์ Docker แพ็ก Plugin Codex ของ checkout ที่เลือก

การรัน `Full Release Validation` ซ้ำสำหรับ `ref=main` และ `rerun_group=all`
จะแทนที่ umbrella ที่เก่ากว่า ตัว monitor ของ parent จะยกเลิก child workflow ใดๆ ที่
สั่งรันไปแล้วเมื่อ parent ถูกยกเลิก ดังนั้นการตรวจสอบ main ที่ใหม่กว่า
จะไม่ค้างหลัง release-check run เก่าสองชั่วโมง การตรวจสอบสาขา/แท็ก
รุ่นเผยแพร่และกลุ่ม rerun แบบมุ่งเฉพาะยังคงใช้ `cancel-in-progress: false`

## ชาร์ด Live และ E2E

child ของ release live/E2E ยังคงความครอบคลุม `pnpm test:live` แบบ native ที่กว้าง แต่รันเป็นชาร์ดที่มีชื่อผ่าน `scripts/test-live-shard.mjs` แทนที่จะเป็นงาน serial เดียว:

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
- ชาร์ด media audio/video ที่แยกออกมา และชาร์ด music ที่กรองตาม provider

วิธีนี้คงความครอบคลุมไฟล์เดิมไว้ พร้อมทำให้ความล้มเหลวของ live provider ที่ช้ารันซ้ำและวินิจฉัยได้ง่ายขึ้น ชื่อชาร์ดแบบรวม `native-live-extensions-o-z`, `native-live-extensions-media` และ `native-live-extensions-media-music` ยังคงใช้ได้สำหรับการรันซ้ำแบบ one-shot ด้วยตนเอง

ชาร์ด native live media รันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งบิลด์โดยเวิร์กโฟลว์ `Live Media Runner Image` อิมเมจนั้นติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้า; งาน media จะตรวจสอบเฉพาะไบนารีก่อน setup ให้คงชุดทดสอบ live ที่ใช้ Docker ไว้บน runner Blacksmith ปกติ เพราะ container jobs ไม่ใช่ที่ที่เหมาะสำหรับเริ่มการทดสอบ Docker ซ้อนกัน

ชาร์ดโมเดล/แบ็กเอนด์แบบไลฟ์ที่รองรับด้วย Docker ใช้อิมเมจ `ghcr.io/openclaw/openclaw-live-test:<sha>` ที่ใช้ร่วมกันแยกต่างหากต่อคอมมิตที่เลือกแต่ละรายการ เวิร์กโฟลว์รีลีสแบบไลฟ์จะสร้างและพุชอิมเมจนั้นหนึ่งครั้ง จากนั้นชาร์ดโมเดล Docker แบบไลฟ์, Gateway ที่แบ่งตามผู้ให้บริการ, แบ็กเอนด์ CLI, การผูก ACP และฮาร์เนส Codex จะรันด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ชาร์ด Gateway Docker มีเพดาน `timeout` ระดับสคริปต์อย่างชัดเจนที่ต่ำกว่าเวลาหมดอายุของงานเวิร์กโฟลว์ เพื่อให้คอนเทนเนอร์หรือเส้นทางล้างข้อมูลที่ค้างล้มเหลวอย่างรวดเร็ว แทนที่จะใช้โควตาเวลาเช็กรีลีสทั้งหมด หากชาร์ดเหล่านั้นสร้างเป้าหมาย Docker ของซอร์สทั้งหมดใหม่เอง การรันรีลีสถูกกำหนดค่าผิดและจะเสียเวลาจริงไปกับการสร้างอิมเมจซ้ำ

## การยอมรับแพ็กเกจ

ใช้ `Package Acceptance` เมื่อคำถามคือ "แพ็กเกจ OpenClaw ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์หรือไม่" สิ่งนี้แตกต่างจาก CI ปกติ: CI ปกติตรวจสอบซอร์สทรี ส่วนการยอมรับแพ็กเกจตรวจสอบทาร์บอลเดียวผ่านฮาร์เนส Docker E2E เดียวกับที่ผู้ใช้ใช้งานหลังติดตั้งหรืออัปเดต

### งาน

1. `resolve_package` เช็กเอาต์ `workflow_ref`, ระบุผู้สมัครแพ็กเกจหนึ่งรายการ, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, อัปโหลดทั้งคู่เป็นอาร์ติแฟกต์ `package-under-test` และพิมพ์ซอร์ส, workflow ref, package ref, เวอร์ชัน, SHA-256 และโปรไฟล์ในสรุปขั้นตอนของ GitHub
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` เวิร์กโฟลว์ที่ใช้ซ้ำจะดาวน์โหลดอาร์ติแฟกต์นั้น ตรวจสอบรายการไฟล์ในทาร์บอล เตรียมอิมเมจ Docker แบบ package-digest เมื่อจำเป็น และรันเลน Docker ที่เลือกกับแพ็กเกจนั้นแทนการแพ็ก checkout ของเวิร์กโฟลว์ เมื่อโปรไฟล์เลือก `docker_lanes` เป้าหมายหลายรายการ เวิร์กโฟลว์ที่ใช้ซ้ำจะเตรียมแพ็กเกจและอิมเมจที่ใช้ร่วมกันหนึ่งครั้ง จากนั้นกระจายเลนเหล่านั้นออกเป็นงาน Docker เป้าหมายแบบขนานพร้อมอาร์ติแฟกต์ที่ไม่ซ้ำกัน
3. `package_telegram` เรียก `NPM Telegram Beta E2E` แบบเลือกได้ โดยรันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้งอาร์ติแฟกต์ `package-under-test` เดียวกันเมื่อ Package Acceptance ระบุแพ็กเกจได้แล้ว; การ dispatch Telegram แบบสแตนด์อโลนยังคงติดตั้งสเปก npm ที่เผยแพร่แล้วได้
4. `summary` ทำให้เวิร์กโฟลว์ล้มเหลวหากการระบุแพ็กเกจ, การยอมรับ Docker หรือเลน Telegram แบบเลือกได้ล้มเหลว

### แหล่งที่มาของผู้สมัคร

- `source=npm` ยอมรับเฉพาะ `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรีลีส OpenClaw ที่ระบุแน่นอน เช่น `openclaw@2026.4.27-beta.2` ใช้รายการนี้สำหรับการยอมรับ prerelease/stable ที่เผยแพร่แล้ว
- `source=ref` แพ็ก branch, tag หรือ full commit SHA ของ `package_ref` ที่เชื่อถือได้ ตัว resolver จะดึง branch/tag ของ OpenClaw, ตรวจสอบว่าคอมมิตที่เลือกเข้าถึงได้จากประวัติ branch ของ repository หรือ release tag, ติดตั้ง dependency ใน worktree แบบ detached และแพ็กด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` ดาวน์โหลด `.tgz` แบบ HTTPS สาธารณะ; ต้องระบุ `package_sha256` เส้นทางนี้ปฏิเสธข้อมูลรับรองใน URL, พอร์ต HTTPS ที่ไม่ใช่ค่าเริ่มต้น, hostname หรือ IP ที่ resolve แล้วซึ่งเป็น private/internal/special-use และ redirect ที่อยู่นอกนโยบายความปลอดภัยสาธารณะเดียวกัน
- `source=trusted-url` ดาวน์โหลด `.tgz` แบบ HTTPS จากนโยบาย trusted-source ที่ตั้งชื่อไว้ใน `.github/package-trusted-sources.json`; ต้องระบุ `package_sha256` และ `trusted_source_id` ใช้รายการนี้เฉพาะกับ mirror ระดับองค์กรหรือ repository แพ็กเกจส่วนตัวที่ maintainer เป็นเจ้าของซึ่งต้องใช้ host, port, path prefix, redirect host หรือการ resolve เครือข่ายส่วนตัวที่กำหนดค่าไว้ หากนโยบายประกาศ bearer auth เวิร์กโฟลว์จะใช้ secret คงที่ `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; ข้อมูลรับรองที่ฝังใน URL ยังคงถูกปฏิเสธ
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งรายการจาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็นแบบเลือกได้ แต่ควรระบุสำหรับอาร์ติแฟกต์ที่แชร์ภายนอก

แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือโค้ดเวิร์กโฟลว์/ฮาร์เนสที่เชื่อถือได้ซึ่งรันการทดสอบ `package_ref` คือซอร์สคอมมิตที่จะถูกแพ็กเมื่อ `source=ref` วิธีนี้ทำให้ฮาร์เนสทดสอบปัจจุบันตรวจสอบซอร์สคอมมิตเก่าที่เชื่อถือได้โดยไม่ต้องรันลอจิกเวิร์กโฟลว์เก่า

### โปรไฟล์ชุดทดสอบ

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` รวมกับ `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — ชังก์เส้นทางรีลีส Docker เต็มพร้อม OpenWebUI
- `custom` — `docker_lanes` ที่ระบุแน่นอน; จำเป็นเมื่อ `suite_profile=custom`

โปรไฟล์ `package` ใช้ความครอบคลุม Plugin แบบออฟไลน์ เพื่อไม่ให้การตรวจสอบแพ็กเกจที่เผยแพร่แล้วต้องขึ้นกับความพร้อมใช้งานของ ClawHub แบบไลฟ์ เลน Telegram แบบเลือกได้ใช้ซ้ำอาร์ติแฟกต์ `package-under-test` ใน `NPM Telegram Beta E2E` โดยคงเส้นทางสเปก npm ที่เผยแพร่แล้วไว้สำหรับ dispatch แบบสแตนด์อโลน

สำหรับนโยบายการทดสอบอัปเดตและ Plugin โดยเฉพาะ รวมถึงคำสั่งภายในเครื่อง,
เลน Docker, อินพุต Package Acceptance, ค่าเริ่มต้นของรีลีส และการคัดแยกความล้มเหลว,
ดู [การทดสอบอัปเดตและ Plugin](/th/help/testing-updates-plugins)

การตรวจสอบรีลีสเรียก Package Acceptance ด้วย `source=artifact`, อาร์ติแฟกต์แพ็กเกจรีลีสที่เตรียมไว้, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` และ `telegram_mode=mock-openai` วิธีนี้ทำให้การย้ายแพ็กเกจ, การอัปเดต, การติดตั้ง Skill ของ ClawHub แบบไลฟ์, การล้าง dependency ของ Plugin ที่ล้าสมัย, การซ่อมการติดตั้ง Plugin ที่กำหนดค่าไว้, Plugin แบบออฟไลน์, การอัปเดต Plugin และหลักฐาน Telegram อยู่บนทาร์บอลแพ็กเกจที่ resolve แล้วเดียวกัน ตั้งค่า `release_package_spec` บน Full Release Validation หรือ OpenClaw Release Checks หลังเผยแพร่เบต้าเพื่อรันเมทริกซ์เดียวกันกับแพ็กเกจ npm ที่ส่งมอบแล้วโดยไม่ต้องสร้างใหม่; ตั้งค่า `package_acceptance_package_spec` เฉพาะเมื่อ Package Acceptance ต้องใช้แพ็กเกจที่แตกต่างจากส่วนที่เหลือของการตรวจสอบรีลีส การตรวจสอบรีลีสข้าม OS ยังคงครอบคลุมพฤติกรรม onboarding, installer และแพลตฟอร์มเฉพาะ OS; การตรวจสอบผลิตภัณฑ์ด้านแพ็กเกจ/อัปเดตควรเริ่มจาก Package Acceptance เลน Docker `published-upgrade-survivor` ตรวจสอบ baseline แพ็กเกจที่เผยแพร่แล้วหนึ่งรายการต่อการรันในเส้นทางรีลีสที่บล็อกอยู่ ใน Package Acceptance ทาร์บอล `package-under-test` ที่ resolve แล้วจะเป็นผู้สมัครเสมอ และ `published_upgrade_survivor_baseline` เลือก baseline ที่เผยแพร่แล้วสำหรับ fallback โดยมีค่าเริ่มต้นเป็น `openclaw@latest`; คำสั่ง rerun ของเลนที่ล้มเหลวจะคง baseline นั้นไว้ Full Release Validation ที่มี `run_release_soak=true` หรือ `release_profile=full` ตั้งค่า `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` และ `published_upgrade_survivor_scenarios=reported-issues` เพื่อขยายข้ามรีลีส npm stable ล่าสุดสี่รายการ รวมถึงรีลีสขอบเขตความเข้ากันได้ของ Plugin ที่ pin ไว้ และ fixture ที่มีรูปทรงตาม issue สำหรับการกำหนดค่า Feishu, ไฟล์ bootstrap/persona ที่คงไว้, การติดตั้ง OpenClaw Plugin ที่กำหนดค่าไว้, พาธ log แบบ tilde และ root dependency ของ Plugin legacy ที่ล้าสมัย การเลือก published-upgrade survivor หลาย baseline จะถูกแบ่งชาร์ดตาม baseline เป็นงาน Docker runner เป้าหมายแยกกัน เวิร์กโฟลว์ `Update Migration` แยกต่างหากใช้เลน Docker `update-migration` พร้อม `all-since-2026.4.23` และ `plugin-deps-cleanup` เมื่อคำถามคือการล้างอัปเดตที่เผยแพร่แล้วแบบครบถ้วน ไม่ใช่ความกว้างของ Full Release CI ปกติ การรันแบบรวมในเครื่องสามารถส่งสเปกแพ็กเกจที่แน่นอนด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, คงเลนเดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` เช่น `openclaw@2026.4.15` หรือตั้งค่า `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` สำหรับเมทริกซ์ scenario เลนที่เผยแพร่แล้วกำหนดค่า baseline ด้วยสูตรคำสั่ง `openclaw config set` ที่อบไว้, บันทึกขั้นตอนสูตรใน `summary.json` และตรวจ `/healthz`, `/readyz` รวมถึงสถานะ RPC หลังเริ่ม Gateway เลน Windows packaged และ installer fresh ยังตรวจสอบด้วยว่าแพ็กเกจที่ติดตั้งแล้วสามารถ import การ override browser-control จากพาธ Windows แบบ raw absolute ได้ smoke แบบ agent-turn ข้าม OS ของ OpenAI ใช้ค่าเริ่มต้นเป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อตั้งค่าไว้ มิฉะนั้นใช้ `openai/gpt-5.5` เพื่อให้หลักฐานการติดตั้งและ Gateway อยู่บนโมเดลทดสอบ GPT-5 พร้อมหลีกเลี่ยงค่าเริ่มต้น GPT-4.x

### ช่วงความเข้ากันได้แบบ legacy

Package Acceptance มีช่วงความเข้ากันได้แบบ legacy ที่มีขอบเขตสำหรับแพ็กเกจที่เผยแพร่แล้ว แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้เส้นทางความเข้ากันได้:

- รายการ QA ส่วนตัวที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ถูกละไว้จากทาร์บอล;
- `doctor-switch` อาจข้าม subcase การคงอยู่ของ `gateway install --wrapper` เมื่อแพ็กเกจไม่เปิดเผย flag นั้น;
- `update-channel-switch` อาจตัด `patchedDependencies` ของ pnpm ที่หายไปออกจาก fake git fixture ที่ได้จากทาร์บอล และอาจ log ว่า `update.channel` ที่ persist ไว้หายไป;
- smoke ของ Plugin อาจอ่านตำแหน่ง install-record แบบ legacy หรือยอมรับการขาดการ persist install-record ของ marketplace;
- `plugin-update` อาจอนุญาตการย้ายข้อมูล metadata ของ config ขณะยังต้องให้ install record และพฤติกรรม no-reinstall คงเดิม

แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ stamp metadata ของ build ในเครื่องที่เคยถูกส่งมอบแล้วด้วย แพ็กเกจที่ใหม่กว่าต้องเป็นไปตามสัญญาสมัยใหม่; เงื่อนไขเดียวกันจะล้มเหลวแทนที่จะเตือนหรือข้าม

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

เมื่อดีบักการรัน package acceptance ที่ล้มเหลว ให้เริ่มที่สรุป `resolve_package` เพื่อยืนยันแหล่งที่มาของแพ็กเกจ, เวอร์ชัน และ SHA-256 จากนั้นตรวจ child run ของ `docker_acceptance` และอาร์ติแฟกต์ Docker ของมัน: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log ของเลน, เวลาแต่ละเฟส และคำสั่ง rerun ควร rerun โปรไฟล์แพ็กเกจที่ล้มเหลวหรือเลน Docker ที่แน่นอน แทนการ rerun full release validation

## smoke การติดตั้ง

เวิร์กโฟลว์ `Install Smoke` แยกต่างหากใช้สคริปต์ scope เดียวกันซ้ำผ่านงาน `preflight` ของตัวเอง โดยแยกความครอบคลุม smoke เป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **เส้นทางแบบเร็ว** จะทำงานสำหรับ pull request ที่แตะพื้นผิว Docker/package, การเปลี่ยนแปลง package/manifest ของ Plugin ที่รวมมา, หรือพื้นผิว Plugin/channel/gateway/Plugin SDK หลักที่งาน smoke ของ Docker ใช้ทดสอบ การเปลี่ยนแปลง Plugin ที่รวมมาแบบ source-only, การแก้ไขเฉพาะ test, และการแก้ไขเฉพาะ docs จะไม่จอง worker ของ Docker เส้นทางแบบเร็วจะ build image จาก root Dockerfile หนึ่งครั้ง, ตรวจ CLI, รัน smoke ของ CLI สำหรับ agents delete shared-workspace, รัน e2e ของ container gateway-network, ตรวจสอบ build arg ของ extension ที่รวมมา, และรันโปรไฟล์ Docker ของ bundled-plugin แบบจำกัดภายใต้ timeout รวมของคำสั่ง 240 วินาที (การรัน Docker ของแต่ละ scenario ถูกจำกัดแยกกัน)
- **เส้นทางเต็ม** เก็บความครอบคลุมการติดตั้ง package QR และ Docker/update ของ installer ไว้สำหรับ scheduled run รายคืน, manual dispatch, workflow-call release check, และ pull request ที่แตะพื้นผิว installer/package/Docker จริง ๆ ในโหมดเต็ม install-smoke จะเตรียมหรือนำ image smoke ของ GHCR root Dockerfile สำหรับ target-SHA หนึ่งรายการกลับมาใช้ใหม่ จากนั้นรันการติดตั้ง package QR, smoke ของ root Dockerfile/gateway, smoke ของ installer/update, และ Docker E2E แบบเร็วของ bundled-plugin เป็น job แยกกัน เพื่อให้งาน installer ไม่ต้องรอหลัง smoke ของ root image

การ push ไปยัง `main` (รวมถึง merge commit) จะไม่บังคับใช้เส้นทางเต็ม เมื่อ logic ขอบเขตการเปลี่ยนแปลงร้องขอความครอบคลุมเต็มบน push workflow จะคง smoke ของ Docker แบบเร็วไว้ และปล่อย smoke การติดตั้งแบบเต็มให้เป็นหน้าที่ของการตรวจสอบรายคืนหรือ release validation

smoke ของ Bun global install image-provider ที่ช้าจะถูก gate แยกด้วย `run_bun_global_install_smoke` โดยจะรันตามตารางรายคืนและจาก workflow release checks และ manual dispatch ของ `Install Smoke` สามารถเลือกเปิดใช้ได้ แต่ pull request และ push ไปยัง `main` จะไม่รัน CI ของ PR ปกติยังคงรัน lane regression ของ Bun launcher แบบเร็วสำหรับการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node ส่วน test Docker ของ QR และ installer จะคง Dockerfile ที่เน้นการติดตั้งของตัวเองไว้

## Docker E2E ภายในเครื่อง

`pnpm test:docker:all` จะ prebuild image live-test ที่ใช้ร่วมกันหนึ่งรายการ, pack OpenClaw หนึ่งครั้งเป็น npm tarball, และ build image `scripts/e2e/Dockerfile` ที่ใช้ร่วมกันสองรายการ:

- runner Node/Git แบบ bare สำหรับ lane installer/update/plugin-dependency;
- image แบบ functional ที่ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lane functionality ปกติ

definition ของ Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`, และ runner จะ execute เฉพาะ plan ที่เลือกไว้ scheduler จะเลือก image ต่อ lane ด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` จากนั้นรัน lane ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### ค่าที่ปรับได้

| ตัวแปร                                | ค่าเริ่มต้น | วัตถุประสงค์                                                                                  |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | จำนวน slot ของ main-pool สำหรับ lane ปกติ                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | จำนวน slot ของ tail-pool ที่อ่อนไหวต่อ provider                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | เพดาน lane live พร้อมกันเพื่อไม่ให้ provider throttle                                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | เพดาน lane ติดตั้ง npm พร้อมกัน                                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | เพดาน lane multi-service พร้อมกัน                                                             |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | เว้นช่วงระหว่างการเริ่ม lane เพื่อหลีกเลี่ยงการสร้างของ Docker daemon จำนวนมาก; ตั้งเป็น `0` เพื่อไม่เว้นช่วง |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout สำรองต่อ lane (120 นาที); lane live/tail ที่เลือกไว้ใช้เพดานที่เข้มงวดกว่า           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` พิมพ์ plan ของ scheduler โดยไม่รัน lane                                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | รายการ lane แบบตรงตัวคั่นด้วย comma; ข้าม smoke การ cleanup เพื่อให้ agent reproduce lane ที่ล้มเหลวหนึ่งรายการได้ |

lane ที่หนักกว่าเพดาน effective ของตัวเองยังสามารถเริ่มจาก pool ว่างได้ จากนั้นจะรันเพียงลำพังจนกว่าจะปล่อย capacity การ preflight รวมภายในเครื่องจะตรวจ Docker, ลบ container OpenClaw E2E ที่ค้างอยู่, แสดงสถานะ active-lane, persist timing ของ lane เพื่อจัดลำดับ longest-first, และหยุด schedule lane แบบ pooled ใหม่หลังความล้มเหลวแรกเป็นค่าเริ่มต้น

### Workflow live/E2E ที่ใช้ซ้ำได้

workflow live/E2E ที่ใช้ซ้ำได้จะถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องใช้ package, ชนิด image, live image, lane, และความครอบคลุม credential ใด `scripts/docker-e2e.mjs` จากนั้นแปลง plan นั้นเป็น output และ summary ของ GitHub โดยจะ pack OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลด artifact package ของ run ปัจจุบัน, หรือดาวน์โหลด artifact package จาก `package_artifact_run_id`; validate inventory ของ tarball; build และ push image GHCR Docker E2E แบบ bare/functional ที่ติด tag ตาม package digest ผ่าน Docker layer cache ของ Blacksmith เมื่อ plan ต้องใช้ lane ที่ติดตั้ง package แล้ว; และนำ input `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรือ image ที่มีอยู่ตาม package digest กลับมาใช้แทนการ rebuild การ pull image Docker จะ retry ด้วย timeout ต่อ attempt แบบจำกัด 180 วินาที เพื่อให้ stream ของ registry/cache ที่ค้าง retry ได้อย่างรวดเร็วแทนที่จะกินเวลาส่วนใหญ่ของ critical path ของ CI

### Chunk ของ release path

ความครอบคลุม Docker ของ release จะรัน job แบบ chunk ขนาดเล็กด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละ chunk pull เฉพาะชนิด image ที่ต้องใช้ และ execute หลาย lane ผ่าน scheduler แบบถ่วงน้ำหนักเดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

chunk Docker ของ release ปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, และ `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` `package-update-openai` รวม lane package ของ Codex plugin แบบ live ซึ่งติดตั้ง package OpenClaw candidate, ติดตั้ง Codex plugin จาก `codex_plugin_spec` หรือ tarball ref เดียวกันพร้อมการอนุมัติการติดตั้ง Codex CLI แบบชัดเจน, รัน preflight ของ Codex CLI, จากนั้นรันหลาย turn ของ agent OpenClaw ใน session เดียวกันกับ OpenAI `plugins-runtime-core`, `plugins-runtime`, และ `plugins-integrations` ยังคงเป็น alias รวมของ plugin/runtime alias ของ lane `install-e2e` ยังคงเป็น alias rerun แบบ manual รวมสำหรับ lane installer ของ provider ทั้งสอง

OpenWebUI จะถูกรวมเข้าใน `plugins-runtime-services` เมื่อความครอบคลุม release-path แบบเต็มร้องขอ และคง chunk `openwebui` แบบ standalone ไว้เฉพาะ dispatch ที่เป็น OpenWebUI-only lane update ของ bundled-channel จะ retry หนึ่งครั้งสำหรับความล้มเหลวชั่วคราวของเครือข่าย npm

แต่ละ chunk จะ upload `.artifacts/docker-tests/` พร้อม log ของ lane, timing, `summary.json`, `failures.json`, timing ของ phase, JSON ของ scheduler plan, ตาราง slow-lane, และคำสั่ง rerun ต่อ lane input `docker_lanes` ของ workflow จะรัน lane ที่เลือกกับ image ที่เตรียมไว้แทน chunk job ซึ่งทำให้การ debug lane ที่ล้มเหลวถูกจำกัดอยู่ที่ job Docker เป้าหมายหนึ่งรายการ และเตรียม, ดาวน์โหลด, หรือนำ artifact package กลับมาใช้ใหม่สำหรับ run นั้น หาก lane ที่เลือกเป็น lane Docker แบบ live job เป้าหมายจะ build live-test image ภายในเครื่องสำหรับ rerun นั้น คำสั่ง rerun ของ GitHub ที่ generate ต่อ lane จะรวม `package_artifact_run_id`, `package_artifact_name`, และ input image ที่เตรียมไว้เมื่อมีค่าเหล่านั้น เพื่อให้ lane ที่ล้มเหลวนำ package และ image เดิมจาก run ที่ล้มเหลวกลับมาใช้ได้

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

workflow live/E2E ตามตารางจะรันชุด Docker ของ release-path แบบเต็มทุกวัน

## Plugin Prerelease

`Plugin Prerelease` เป็นความครอบคลุม product/package ที่มีค่าใช้จ่ายสูงกว่า จึงเป็น workflow แยกที่ dispatch โดย `Full Release Validation` หรือโดย operator อย่างชัดเจน pull request ปกติ, push ไปยัง `main`, และ manual CI dispatch แบบ standalone จะปิด suite นั้นไว้ workflow นี้ balance test ของ Plugin ที่รวมมาใน worker extension แปดรายการ; job shard ของ extension เหล่านั้นจะรันได้สูงสุดสองกลุ่ม config ของ Plugin พร้อมกัน โดยมี Vitest worker หนึ่งรายการต่อกลุ่มและ Node heap ที่ใหญ่ขึ้น เพื่อให้ batch ของ Plugin ที่ import หนักไม่สร้าง job CI เพิ่ม เส้นทาง prerelease Docker แบบ release-only จะ batch lane Docker เป้าหมายเป็นกลุ่มเล็ก ๆ เพื่อหลีกเลี่ยงการจอง runner หลายสิบรายการสำหรับ job หนึ่งถึงสามนาที workflow ยัง upload artifact `plugin-inspector-advisory` เชิงข้อมูลจาก `@openclaw/plugin-inspector`; finding ของ inspector เป็น input สำหรับ triage และไม่เปลี่ยน gate ที่ block ของ Plugin Prerelease

## QA Lab

QA Lab มี lane CI เฉพาะภายนอก workflow smart-scoped หลัก agentic parity ซ้อนอยู่ภายใต้ QA และ release harness แบบกว้าง ไม่ใช่ workflow PR แบบ standalone ใช้ `Full Release Validation` กับ `rerun_group=qa-parity` เมื่อ parity ควรไปพร้อมกับ validation run แบบกว้าง

- workflow `QA-Lab - All Lanes` รันทุกคืนบน `main` และเมื่อ manual dispatch; workflow นี้กระจาย lane mock parity, lane live Matrix, และ lane live Telegram กับ Discord เป็น job ขนานกัน job live ใช้ environment `qa-live-shared` และ Telegram/Discord ใช้ Convex lease

release check จะรัน lane transport live ของ Matrix และ Telegram ด้วย deterministic mock provider และ model ที่ qualify ด้วย mock (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อแยก contract ของ channel ออกจาก latency ของ model live และการเริ่มต้น provider-plugin ปกติ Gateway ของ transport live จะปิด memory search เพราะ QA parity ครอบคลุม behavior ของ memory แยกต่างหาก ส่วน connectivity ของ provider ถูกครอบคลุมโดย suite live model, native provider, และ Docker provider แยกต่างหาก

Matrix ใช้ `--profile fast` สำหรับ gate ตามตารางและ release โดยเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout รองรับ ค่าเริ่มต้นของ CLI และ input workflow แบบ manual ยังคงเป็น `all`; manual dispatch ที่ตั้ง `matrix_profile=all` จะ shard ความครอบคลุม Matrix แบบเต็มเป็น job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรัน lane QA Lab ที่สำคัญต่อ release ก่อนการอนุมัติ release; gate QA parity ของมันจะรัน pack candidate และ baseline เป็น job lane ขนานกัน จากนั้นดาวน์โหลด artifact ทั้งสองเข้า job รายงานขนาดเล็กสำหรับการเปรียบเทียบ parity ขั้นสุดท้าย

สำหรับ PR ปกติ ให้ใช้หลักฐาน CI/check ตามขอบเขตแทนการถือว่า parity เป็นสถานะที่ต้องมี

## CodeQL

workflow `CodeQL` เป็น scanner ความปลอดภัยรอบแรกแบบแคบโดยตั้งใจ ไม่ใช่การ sweep repository ทั้งหมด run รายวัน, manual, และ guard run ของ pull request ที่ไม่ใช่ draft จะ scan โค้ด Actions workflow รวมถึงพื้นผิว JavaScript/TypeScript ที่มีความเสี่ยงสูงที่สุด ด้วย query ความปลอดภัยความมั่นใจสูงที่กรองเฉพาะ `security-severity` ระดับ high/critical

guard ของ pull request ยังคงเบา: จะเริ่มเฉพาะสำหรับการเปลี่ยนแปลงภายใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, หรือ `src` และรัน security matrix ความมั่นใจสูงเดียวกับ workflow ตามตาราง Android และ macOS CodeQL จะไม่อยู่ในค่าเริ่มต้นของ PR

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                          | พื้นผิว                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | บรรทัดฐานด้านการยืนยันตัวตน, ความลับ, sandbox, Cron และ Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการใช้งานของการปรับใช้ช่องทางในแกนหลัก รวมถึง runtime ของ Plugin ช่องทาง, Gateway, Plugin SDK, ความลับ และจุดแตะสำหรับการตรวจสอบ              |
| `/codeql-security-high/network-ssrf-boundary`     | พื้นผิวนโยบาย SSRF ของแกนหลัก, การแยกวิเคราะห์ IP, ตัวป้องกันเครือข่าย, web-fetch และ Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | เซิร์ฟเวอร์ MCP, ตัวช่วยการดำเนินการโปรเซส, การส่งออกขาออก และเกตการดำเนินการเครื่องมือของเอเจนต์                                           |
| `/codeql-security-high/plugin-trust-boundary`     | พื้นผิวความไว้วางใจของการติดตั้ง Plugin, loader, manifest, registry, การติดตั้งผ่านตัวจัดการแพ็กเกจ, การโหลดซอร์ส และสัญญาแพ็กเกจของ Plugin SDK |

### ชาร์ดความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — ชาร์ดความปลอดภัย Android ตามกำหนดเวลา สร้างแอป Android ด้วยตนเองสำหรับ CodeQL บน Blacksmith Linux runner ขนาดเล็กที่สุดที่ผ่านการตรวจสอบความสมเหตุสมผลของ workflow อัปโหลดภายใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — ชาร์ดความปลอดภัย macOS แบบรายสัปดาห์/ด้วยตนเอง สร้างแอป macOS ด้วยตนเองสำหรับ CodeQL บน Blacksmith macOS กรองผลลัพธ์การ build ของ dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดภายใต้ `/codeql-critical-security/macos` เก็บไว้นอกค่าเริ่มต้นรายวันเพราะการ build macOS ใช้เวลารันเป็นหลักแม้เมื่อสะอาด

### หมวดหมู่คุณภาพระดับวิกฤต

`CodeQL Critical Quality` คือชาร์ดที่สอดคล้องกันซึ่งไม่ใช่ด้านความปลอดภัย โดยรันเฉพาะ query คุณภาพ JavaScript/TypeScript ที่ไม่ใช่ด้านความปลอดภัยและมีระดับความรุนแรงเป็น error บนพื้นผิวแคบที่มีมูลค่าสูงบน GitHub-hosted Linux runners เพื่อให้การสแกนคุณภาพไม่ใช้ budget การลงทะเบียน runner ของ Blacksmith เกต pull request ของมันจงใจเล็กกว่าโปรไฟล์ตามกำหนดเวลา: PR ที่ไม่ใช่ draft จะรันเฉพาะชาร์ด `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` ที่สอดคล้องกัน สำหรับการเปลี่ยนแปลงโค้ดการดำเนินการคำสั่ง/โมเดล/เครื่องมือของเอเจนต์และการ dispatch การตอบกลับ, โค้ด config schema/migration/IO, โค้ดการยืนยันตัวตน/ความลับ/sandbox/ความปลอดภัย, ช่องทางแกนหลักและ runtime ของ Plugin ช่องทางที่ bundle มา, โปรโตคอล Gateway/เมธอดเซิร์ฟเวอร์, memory runtime/ส่วนเชื่อม SDK, MCP/โปรเซส/การส่งขาออก, runtime ของ provider/catalog โมเดล, การวินิจฉัย session/คิวการส่ง, Plugin loader, Plugin SDK/สัญญาแพ็กเกจ หรือ runtime การตอบกลับของ Plugin SDK การเปลี่ยนแปลง config ของ CodeQL และ workflow คุณภาพจะรันชาร์ดคุณภาพ PR ทั้งสิบสองรายการ

การ dispatch ด้วยตนเองรับค่า:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

โปรไฟล์แบบแคบเป็น hook สำหรับการสอน/การวนซ้ำ เพื่อรันชาร์ดคุณภาพหนึ่งรายการแบบแยกเดี่ยว

| หมวดหมู่                                                | พื้นผิว                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ดขอบเขตความปลอดภัยของการยืนยันตัวตน, ความลับ, sandbox, Cron และ Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | สัญญา config schema, migration, normalization และ IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schema โปรโตคอล Gateway และสัญญาเมธอดเซิร์ฟเวอร์                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญาการใช้งานของช่องทางแกนหลักและ Plugin ช่องทางที่ bundle มา                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | สัญญา runtime ของการดำเนินการคำสั่ง, การ dispatch โมเดล/provider, การ dispatch และคิว auto-reply และ ACP control-plane                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | เซิร์ฟเวอร์ MCP และ bridge ของเครื่องมือ, ตัวช่วยการกำกับดูแลโปรเซส และสัญญาการส่งขาออก                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | memory host SDK, facade ของ memory runtime, alias ของ memory Plugin SDK, ส่วนเชื่อมการเปิดใช้งาน memory runtime และคำสั่ง memory doctor                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | ภายในของคิวตอบกลับ, คิวส่ง session, ตัวช่วยการผูก/ส่ง session ขาออก, พื้นผิว diagnostic event/log bundle และสัญญา CLI ของ session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | การ dispatch การตอบกลับขาเข้าของ Plugin SDK, ตัวช่วย payload/chunking/runtime ของการตอบกลับ, ตัวเลือกการตอบกลับของช่องทาง, คิวการส่ง และตัวช่วยการผูก session/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | การ normalize catalog โมเดล, การยืนยันตัวตนและการค้นพบ provider, การลงทะเบียน runtime ของ provider, ค่าเริ่มต้น/catalog ของ provider และ registry สำหรับ web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | การ bootstrap ของ Control UI, persistence ภายในเครื่อง, control flow ของ Gateway และสัญญา runtime ของ task control-plane                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | สัญญา runtime ของ fetch/search เว็บแกนหลัก, media IO, ความเข้าใจสื่อ, การสร้างภาพ และการสร้างสื่อ                                                    |
| `/codeql-critical-quality/plugin-boundary`              | สัญญา loader, registry, public-surface และ entrypoint ของ Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | ซอร์ส Plugin SDK ฝั่งแพ็กเกจที่เผยแพร่แล้ว และตัวช่วยสัญญาแพ็กเกจของ Plugin                                                                                      |

คุณภาพแยกจากความปลอดภัยเพื่อให้ finding ด้านคุณภาพสามารถถูกกำหนดเวลา, วัดผล, ปิดใช้งาน หรือขยายได้โดยไม่บดบังสัญญาณด้านความปลอดภัย การขยาย CodeQL สำหรับ Swift, Python และ bundled-plugin ควรถูกเพิ่มกลับมาเป็นงานติดตามผลแบบ scoped หรือ sharded เท่านั้นหลังจากโปรไฟล์แบบแคบมี runtime และสัญญาณที่เสถียรแล้ว

## Workflow การบำรุงรักษา

### Docs Agent

workflow `Docs Agent` เป็น lane การบำรุงรักษา Codex แบบขับเคลื่อนด้วย event สำหรับทำให้เอกสารที่มีอยู่สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง land ไม่มี schedule ล้วน: การรัน CI จาก push ที่สำเร็จบน `main` โดยไม่ใช่บอตสามารถ trigger ได้ และ manual dispatch สามารถรันโดยตรงได้ การ invoke ผ่าน workflow-run จะข้ามเมื่อ `main` เดินหน้าไปแล้ว หรือเมื่อมีการรัน Docs Agent อื่นที่ไม่ถูกข้ามถูกสร้างขึ้นในชั่วโมงที่ผ่านมา เมื่อรัน มันจะ review ช่วง commit ตั้งแต่ source SHA ของ Docs Agent ครั้งก่อนที่ไม่ถูกข้ามจนถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงหนึ่งครั้งจึงสามารถครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมตั้งแต่รอบตรวจเอกสารล่าสุด

### Test Performance Agent

workflow `Test Performance Agent` เป็น lane การบำรุงรักษา Codex แบบขับเคลื่อนด้วย event สำหรับ test ที่ช้า ไม่มี schedule ล้วน: การรัน CI จาก push ที่สำเร็จบน `main` โดยไม่ใช่บอตสามารถ trigger ได้ แต่จะข้ามหากมีการ invoke ผ่าน workflow-run อื่นรันแล้วหรือกำลังรันอยู่ในวัน UTC นั้น Manual dispatch จะข้ามเกตกิจกรรมรายวันนี้ lane นี้สร้างรายงานประสิทธิภาพ Vitest แบบ grouped สำหรับ full-suite ให้ Codex ทำเฉพาะการแก้ไขประสิทธิภาพ test ขนาดเล็กที่ยังรักษา coverage แทน refactor กว้าง ๆ จากนั้นรันรายงาน full-suite ซ้ำ และปฏิเสธการเปลี่ยนแปลงที่ลดจำนวน test baseline ที่ผ่าน รายงานแบบ grouped บันทึก wall time และ max RSS ต่อ config บน Linux และ macOS ดังนั้นการเปรียบเทียบ before/after จะแสดง delta หน่วยความจำของ test เคียงข้าง delta ระยะเวลา หาก baseline มี test ที่ล้มเหลว Codex อาจแก้ได้เฉพาะความล้มเหลวที่ชัดเจน และรายงาน full-suite หลัง agent ต้องผ่านก่อนที่จะ commit สิ่งใด เมื่อ `main` เดินหน้าก่อนที่ bot push จะ land lane นี้จะ rebase patch ที่ validate แล้ว รัน `pnpm check:changed` ซ้ำ และ retry การ push; patch เก่าที่ conflict จะถูกข้าม มันใช้ GitHub-hosted Ubuntu เพื่อให้ Codex action รักษาท่าทีความปลอดภัยแบบ drop-sudo เดียวกับ docs agent ได้

### PR ซ้ำหลัง Merge

workflow `Duplicate PRs After Merge` เป็น workflow สำหรับ maintainer แบบ manual เพื่อ cleanup duplicate หลัง land ค่าเริ่มต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุชัดเจนเมื่อ `apply=true` ก่อนแก้ไข GitHub มันตรวจสอบว่า PR ที่ land แล้วถูก merge แล้ว และ duplicate แต่ละรายการมี issue ที่อ้างอิงร่วมกันหรือมี hunk ที่เปลี่ยนแปลงทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## เกตการตรวจสอบภายในเครื่องและการ routing การเปลี่ยนแปลง

ตรรกะ changed-lane ภายในเครื่องอยู่ใน `scripts/changed-lanes.mjs` และถูกดำเนินการโดย `scripts/check-changed.mjs` เกตการตรวจสอบภายในเครื่องนั้นเข้มงวดเรื่องขอบเขตสถาปัตยกรรมมากกว่าขอบเขตแพลตฟอร์ม CI แบบกว้าง:

- การเปลี่ยนแปลง production ของแกนหลักรัน typecheck ของ core prod และ core test รวมถึง core lint/guards;
- การเปลี่ยนแปลงเฉพาะ test ของแกนหลักรันเฉพาะ typecheck ของ core test รวมถึง core lint;
- การเปลี่ยนแปลง production ของ extension รัน typecheck ของ extension prod และ extension test รวมถึง extension lint;
- การเปลี่ยนแปลงเฉพาะ test ของ extension รัน typecheck ของ extension test รวมถึง extension lint;
- การเปลี่ยนแปลง Plugin SDK สาธารณะหรือสัญญา plugin ขยายไปยัง typecheck ของ extension เพราะ extension พึ่งพาสัญญาแกนหลักเหล่านั้น (การ sweep extension ของ Vitest ยังคงเป็นงาน test ที่ explicit);
- การ bump เวอร์ชันที่เป็น release metadata-only รันการตรวจสอบ version/config/root-dependency แบบ targeted;
- การเปลี่ยนแปลง root/config ที่ไม่รู้จัก fail safe ไปยัง check lane ทั้งหมด

การ routing changed-test ภายในเครื่องอยู่ใน `scripts/test-projects.test-support.mjs` และจงใจถูกกว่า `check:changed`: การแก้ test โดยตรงจะรันตัวเอง การแก้ซอร์สจะใช้ mapping ที่ explicit ก่อน แล้วจึงใช้ sibling tests และ dependents ใน import-graph config การส่ง group-room ร่วมเป็นหนึ่งใน mapping ที่ explicit: การเปลี่ยนแปลง config visible-reply ของ group, source reply delivery mode หรือ system prompt ของ message-tool จะ route ผ่าน core reply tests รวมถึง regression การส่งของ Discord และ Slack เพื่อให้การเปลี่ยนค่าเริ่มต้นร่วมล้มเหลวก่อนการ push PR ครั้งแรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างทั้ง harness จนชุด mapped ราคาถูกไม่น่าเชื่อถือพอเป็น proxy

## การ validate ด้วย Testbox

Crabbox คือ wrapper remote-box ที่ repo เป็นเจ้าของสำหรับ proof บน Linux ของ maintainer ใช้มันจาก repo root เมื่อการตรวจสอบกว้างเกินไปสำหรับลูปแก้ไขภายในเครื่อง, เมื่อความเท่าเทียมกับ CI สำคัญ, หรือเมื่อ proof ต้องการ secrets, Docker, package lanes, กล่องที่นำกลับมาใช้ซ้ำได้ หรือ remote logs backend ปกติของ OpenClaw คือ `blacksmith-testbox`; capacity บน AWS/Hetzner ที่เป็นเจ้าของเป็น fallback สำหรับ outage ของ Blacksmith, ปัญหา quota หรือการทดสอบ owned-capacity ที่ระบุชัดเจน

Crabbox ที่รองรับด้วย Blacksmith จะ warm, claim, sync, run, report และ clean up Testbox แบบ one-shot การตรวจสอบความสมเหตุสมผลของ sync ที่มีมาให้จะล้มเหลวอย่างรวดเร็วเมื่อไฟล์ root ที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short` แสดงการลบไฟล์ที่ติดตามอยู่ตั้งแต่ 200 รายการขึ้นไป สำหรับ PR ที่ตั้งใจลบไฟล์จำนวนมาก ให้ตั้งค่า `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับคำสั่งระยะไกล

Crabbox ยังจะยุติการเรียกใช้ Blacksmith CLI ภายในเครื่องที่ค้างอยู่ในเฟส sync นานเกินห้านาทีโดยไม่มีเอาต์พุตหลัง sync ตั้งค่า `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` เพื่อปิด guard นั้น หรือใช้ค่ามิลลิวินาทีที่มากขึ้นสำหรับ diff ภายในเครื่องที่ใหญ่ผิดปกติ

ก่อนรันครั้งแรก ให้ตรวจสอบ wrapper จาก root ของ repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper ของ repo จะปฏิเสธไบนารี Crabbox ที่เก่าเกินไปซึ่งไม่ได้ประกาศ `blacksmith-testbox` ส่ง provider อย่างชัดเจนแม้ว่า `.crabbox.yaml` จะมีค่าเริ่มต้นของ owned-cloud อยู่แล้ว ใน Codex worktrees หรือ linked/sparse checkouts ให้หลีกเลี่ยงสคริปต์ `pnpm crabbox:run` ภายในเครื่อง เพราะ pnpm อาจ reconcile dependencies ก่อนที่ Crabbox จะเริ่มทำงาน ให้เรียกใช้ node wrapper โดยตรงแทน:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

การรันที่รองรับด้วย Blacksmith ต้องใช้ Crabbox 0.22.0 หรือใหม่กว่า เพื่อให้ wrapper ได้รับพฤติกรรม Testbox sync, queue และ cleanup ปัจจุบัน เมื่อใช้ sibling checkout ให้ build ไบนารีภายในเครื่องที่ถูก ignore ใหม่ก่อนงานจับเวลาหรือ proof:

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

รัน focused test ซ้ำ:

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

Full suite:

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

อ่านสรุป JSON สุดท้าย ฟิลด์ที่มีประโยชน์คือ `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` และ `totalMs` การรัน Crabbox แบบ one-shot ที่รองรับด้วย Blacksmith ควรหยุด Testbox โดยอัตโนมัติ หากการรันถูกขัดจังหวะหรือการ cleanup ไม่ชัดเจน ให้ตรวจสอบ boxes ที่กำลังทำงานอยู่และหยุดเฉพาะ boxes ที่คุณสร้าง:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

ใช้ reuse เฉพาะเมื่อคุณตั้งใจต้องใช้หลายคำสั่งบน box เดียวกันที่ hydrate แล้ว:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

หาก Crabbox เป็นเลเยอร์ที่เสีย แต่ Blacksmith เองยังทำงาน ให้ใช้ Blacksmith โดยตรงเฉพาะสำหรับการวินิจฉัย เช่น `list`, `status` และ cleanup แก้เส้นทาง Crabbox ก่อนถือว่าการรัน Blacksmith โดยตรงเป็น proof ของ maintainer

หาก `blacksmith testbox list --all` และ `blacksmith testbox status` ทำงาน แต่ warmups ใหม่ค้างเป็น `queued` โดยไม่มี IP หรือ Actions run URL หลังจากผ่านไปสองสามนาที ให้ถือว่าเป็นแรงกดดันจาก provider, queue, billing หรือ org-limit ของ Blacksmith หยุด queued ids ที่คุณสร้าง หลีกเลี่ยงการเริ่ม Testboxes เพิ่ม และย้าย proof ไปยังเส้นทาง capacity ของ Crabbox ที่เป็นของเราเองด้านล่าง ขณะที่มีคนตรวจสอบ Blacksmith dashboard, billing และ org limits

Escalate ไปยัง capacity ของ Crabbox ที่เป็นของเราเองเฉพาะเมื่อ Blacksmith ล่ม ถูกจำกัดโควตา ขาด environment ที่จำเป็น หรือ capacity ที่เป็นของเราเองเป็นเป้าหมายอย่างชัดเจน:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

ภายใต้แรงกดดันของ AWS ให้หลีกเลี่ยง `class=beast` เว้นแต่งานนั้นต้องใช้ CPU ระดับ 48xlarge จริงๆ คำขอ `beast` เริ่มที่ 192 vCPUs และเป็นวิธีที่ง่ายที่สุดที่จะชนโควตา EC2 Spot หรือ On-Demand Standard ระดับภูมิภาค `.crabbox.yaml` ที่ repo เป็นเจ้าของมีค่าเริ่มต้นเป็น `standard`, หลาย capacity regions และ `capacity.hints: true` เพื่อให้ leases ของ AWS ที่ brokered แล้วพิมพ์ region/market ที่เลือก, แรงกดดันโควตา, Spot fallback และคำเตือน class ที่มีแรงกดดันสูง ใช้ `fast` สำหรับ broad checks ที่หนักกว่า, ใช้ `large` เฉพาะหลังจาก standard/fast ยังไม่พอ และใช้ `beast` เฉพาะสำหรับ lanes ที่ผูกกับ CPU เป็นพิเศษ เช่น full-suite หรือ all-plugin Docker matrices, การตรวจสอบ release/blocker ที่ระบุชัดเจน หรือการทำ performance profiling แบบ high-core อย่าใช้ `beast` สำหรับ `pnpm check:changed`, focused tests, งาน docs-only, lint/typecheck ทั่วไป, E2E repros ขนาดเล็ก หรือการ triage Blacksmith outage ใช้ `--market on-demand` สำหรับการวินิจฉัย capacity เพื่อไม่ให้ความผันผวนของตลาด Spot ปะปนกับสัญญาณ

`.crabbox.yaml` เป็นเจ้าของค่าเริ่มต้นของ provider, sync และ GitHub Actions hydration สำหรับ owned-cloud lanes โดยจะ exclude `.git` ภายในเครื่อง เพื่อให้ Actions checkout ที่ hydrate แล้วเก็บ metadata ของ Git ระยะไกลของตัวเอง แทนที่จะ sync remotes และ object stores ภายในเครื่องของ maintainer และจะ exclude artifacts ของ runtime/build ภายในเครื่องที่ไม่ควรถูกถ่ายโอนเด็ดขาด `.github/workflows/crabbox-hydrate.yml` เป็นเจ้าของ checkout, การตั้งค่า Node/pnpm, การ fetch `origin/main` และการส่งต่อ environment ที่ไม่ใช่ secret สำหรับคำสั่ง owned-cloud `crabbox run --id <cbx_id>`

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
