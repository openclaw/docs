---
read_when:
    - คุณต้องเข้าใจว่าทำไมงาน CI จึงทำงานหรือไม่ทำงาน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการรันหรือการรันซ้ำเพื่อตรวจสอบความถูกต้องของรีลีส
    - คุณกำลังเปลี่ยนการจ่ายงานของ ClawSweeper หรือการส่งต่อกิจกรรมของ GitHub
summary: กราฟงาน CI, เกตขอบเขต, ร่มการปล่อยรุ่น และคำสั่งเทียบเท่าในเครื่อง
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-06-28T00:11:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e38a0777d15b06fe50a1800ecc901d00078d6e970d3bc9e221b664bfced8b5
    source_path: ci.md
    workflow: 16
---

OpenClaw CI ทำงานทุกครั้งที่ push ไปยัง `main` และทุก pull request การ push ไปยัง
`main` ที่เป็น canonical จะผ่านช่วงรับงานของ hosted-runner 90 วินาทีก่อน
กลุ่ม concurrency `CI` ที่มีอยู่จะยกเลิก run ที่กำลังรอนั้นเมื่อมี commit ใหม่กว่า
เข้ามา ดังนั้นการ merge ต่อเนื่องกันจะไม่ลงทะเบียน Blacksmith matrix แบบเต็มทุกครั้ง
Pull request และ manual dispatch จะข้ามการรอนี้ จากนั้น job `preflight`
จะจัดประเภท diff และปิด lane ที่มีค่าใช้จ่ายสูงเมื่อมีการเปลี่ยนเฉพาะพื้นที่ที่ไม่เกี่ยวข้อง
run แบบ manual `workflow_dispatch` จงใจข้าม smart scoping
และกระจายเป็นกราฟเต็มสำหรับ release candidate และการตรวจสอบแบบกว้าง
lane ของ Android ยังคงเป็นแบบ opt-in ผ่าน `include_android` ความครอบคลุมของ
Plugin เฉพาะ release อยู่ใน workflow [`Plugin Prerelease`](#plugin-prerelease)
แยกต่างหาก และจะทำงานจาก [`Full Release Validation`](#full-release-validation)
หรือ explicit manual dispatch เท่านั้น

## ภาพรวม Pipeline

| Job                                | วัตถุประสงค์                                                                                                   | ทำงานเมื่อ                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | ตรวจจับการเปลี่ยนแปลงเฉพาะ docs, scope ที่เปลี่ยน, extension ที่เปลี่ยน และสร้าง CI manifest                   | เสมอบน push และ PR ที่ไม่ใช่ draft                  |
| `runner-admission`                 | debounce 90 วินาทีบน hosted runner สำหรับ push ไปยัง `main` ที่เป็น canonical ก่อนลงทะเบียนงาน Blacksmith                | ทุก CI run; sleep เฉพาะ push ไปยัง `main` ที่เป็น canonical |
| `security-fast`                    | ตรวจจับ private key, ตรวจ workflow ที่เปลี่ยนผ่าน `zizmor` และตรวจ production lockfile                 | เสมอบน push และ PR ที่ไม่ใช่ draft                  |
| `check-dependencies`               | รอบตรวจเฉพาะ dependency ของ Knip สำหรับ production พร้อม guard ของ allowlist ไฟล์ที่ไม่ได้ใช้                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `build-artifacts`                  | build `dist/`, Control UI, smoke check ของ built-CLI, ตรวจ built artifact ที่ฝังไว้ และ artifact ที่ใช้ซ้ำได้ | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-fast-core`                 | lane ความถูกต้องบน Linux แบบเร็ว เช่น bundled, protocol, QA Smoke CI และการตรวจ CI routing                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-fast-contracts-plugins-*`  | การตรวจสัญญา Plugin แบบ sharded สองชุด                                                                        | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-fast-contracts-channels-*` | การตรวจสัญญา channel แบบ sharded สองชุด                                                                       | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-node-core-*`               | shard ทดสอบ Node core โดยยกเว้น lane ของ channel, bundled, contract และ extension                          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `check-*`                          | เทียบเท่า main local gate แบบ sharded: prod types, lint, guards, test types และ strict smoke                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `check-additional-*`               | สถาปัตยกรรม, boundary/prompt drift แบบ sharded, extension guards, package boundary และ runtime topology     | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-node-compat-node22`        | lane build และ smoke สำหรับความเข้ากันได้กับ Node 22                                                                | manual CI dispatch สำหรับ release                     |
| `check-docs`                       | ตรวจรูปแบบ docs, lint และลิงก์เสีย                                                             | docs เปลี่ยน                                        |
| `skills-python`                    | Ruff + pytest สำหรับ Skills ที่มี Python รองรับ                                                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python skill                       |
| `checks-windows`                   | การทดสอบ process/path เฉพาะ Windows พร้อม regression ของ runtime import specifier ที่ใช้ร่วมกัน                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows                            |
| `macos-node`                       | lane ทดสอบ TypeScript บน macOS โดยใช้ built artifact ที่ใช้ร่วมกัน                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS                              |
| `macos-swift`                      | Swift lint, build และ tests สำหรับแอป macOS                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS                              |
| `ios-build`                        | การสร้าง Xcode project พร้อม simulator build ของแอป iOS                                                 | แอป iOS, shared app kit หรือการเปลี่ยนแปลง Swabble         |
| `android`                          | unit test ของ Android สำหรับทั้งสอง flavor พร้อม debug APK build หนึ่งรายการ                                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android                            |
| `test-performance-agent`           | การปรับให้ test ช้าของ Codex เร็วขึ้นแบบรายวันหลังจากกิจกรรมที่เชื่อถือได้                                                 | main CI สำเร็จหรือ manual dispatch                  |
| `openclaw-performance`             | รายงาน performance runtime ของ Kova แบบรายวัน/ตามคำขอ พร้อม lane mock-provider, deep-profile และ GPT 5.5 live | scheduled และ manual dispatch                       |

## ลำดับ Fail-fast

1. `runner-admission` รอเฉพาะ push ไปยัง `main` ที่เป็น canonical; push ใหม่กว่าจะยกเลิก run ก่อนการลงทะเบียน Blacksmith
2. `preflight` ตัดสินว่า lane ใดมีอยู่ตั้งแต่แรก logic `docs-scope` และ `changed-scope` เป็น step ภายใน job นี้ ไม่ใช่ job แยกต่างหาก
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` และ `skills-python` fail อย่างรวดเร็วโดยไม่รอ job artifact และ platform matrix ที่หนักกว่า
4. `build-artifacts` ทำงานซ้อนกับ lane Linux แบบเร็ว เพื่อให้ downstream consumer เริ่มได้ทันทีที่ shared build พร้อม
5. lane platform และ runtime ที่หนักกว่าจะกระจายต่อจากนั้น: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` และ `android`

GitHub อาจทำเครื่องหมาย job ที่ถูกแทนที่ว่า `cancelled` เมื่อมี push ใหม่กว่าเข้ามาบน PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่านี่เป็นสัญญาณรบกวนของ CI เว้นแต่ run ใหม่ล่าสุดสำหรับ ref เดียวกันก็ล้มเหลวด้วย Matrix jobs ใช้ `fail-fast: false` และ `build-artifacts` รายงาน failure ของ embedded channel, core-support-boundary และ gateway-watch โดยตรง แทนการต่อคิว job verifier ขนาดเล็ก key concurrency อัตโนมัติของ CI มีการ version (`CI-v7-*`) เพื่อให้ zombie ฝั่ง GitHub ใน queue group เก่าไม่สามารถบล็อก main run รุ่นใหม่ได้ไม่สิ้นสุด run full-suite แบบ manual ใช้ `CI-manual-v1-*` และไม่ยกเลิก run ที่กำลังดำเนินอยู่

ใช้ `pnpm ci:timings`, `pnpm ci:timings:recent` หรือ `node scripts/ci-run-timings.mjs <run-id>` เพื่อสรุป wall time, queue time, job ที่ช้าที่สุด, failure และ fanout barrier `pnpm-store-warmup` จาก GitHub Actions CI ยังอัปโหลด run summary เดียวกันเป็น artifact `ci-timings-summary` ด้วย สำหรับเวลา build ให้ตรวจ step `Build dist` ของ job `build-artifacts`: `pnpm build:ci-artifacts` พิมพ์ `[build-all] phase timings:` และรวม `ui:build`; job ยังอัปโหลด artifact `startup-memory` ด้วย

สำหรับ pull request run job timing-summary ปลายทางจะเรียก helper จาก trusted base revision ก่อนส่ง `GH_TOKEN` ให้ `gh run view` วิธีนี้ทำให้ query ที่มี token ไม่อยู่ใน code ที่ branch ควบคุม ในขณะที่ยังสรุป CI run ปัจจุบันของ pull request ได้

## บริบท PR และหลักฐาน

PR จาก contributor ภายนอกทำงานผ่าน gate บริบท PR และหลักฐานจาก
`.github/workflows/real-behavior-proof.yml` workflow จะ checkout trusted
base commit และประเมินเฉพาะ body ของ PR; จะไม่รัน code จาก
branch ของ contributor

gate นี้ใช้กับผู้เขียน PR ที่ไม่ใช่ owner, member,
collaborator หรือ bot ของ repository จะผ่านเมื่อ body ของ PR มี section
`What Problem This Solves` และ `Evidence` ที่เขียนโดยผู้เขียน Evidence อาจเป็น
test ที่โฟกัส, ผล CI, screenshot, recording, terminal output, live observation,
redacted log หรือลิงก์ artifact body ให้เจตนาและการตรวจสอบที่มีประโยชน์;
reviewer จะตรวจ code, tests และ CI เพื่อประเมินความถูกต้อง

เมื่อ check ล้มเหลว ให้แก้ body ของ PR แทนการ push code commit อีกอัน

## Scope และ routing

logic ของ scope อยู่ใน `scripts/ci-changed-scope.mjs` และครอบคลุมด้วย unit test ใน `src/scripts/ci-changed-scope.test.ts` manual dispatch ข้ามการตรวจ changed-scope และทำให้ preflight manifest ทำงานเหมือนทุกพื้นที่ที่มี scope เปลี่ยนทั้งหมด

- **การแก้ไข CI workflow** ตรวจสอบกราฟ Node CI พร้อม workflow linting แต่ไม่ได้บังคับให้ build native ของ Windows, iOS, Android หรือ macOS ทำงานโดยตัวมันเอง; lane platform เหล่านั้นยังคง scope ตามการเปลี่ยนแปลง source ของ platform
- **Workflow Sanity** รัน `actionlint`, `zizmor` กับไฟล์ YAML ของ workflow ทั้งหมด, guard การ interpolation ของ composite-action และ guard ของ conflict-marker job `security-fast` ที่ scope ตาม PR ยังรัน `zizmor` กับไฟล์ workflow ที่เปลี่ยน เพื่อให้ finding ด้านความปลอดภัยของ workflow fail ได้เร็วในกราฟ CI หลัก
- **Docs บน push ไปยัง `main`** ถูกตรวจโดย workflow `Docs` แบบ standalone ด้วย mirror docs ของ ClawHub เดียวกับที่ CI ใช้ ดังนั้น push แบบผสม code+docs จะไม่ต่อคิว shard `check-docs` ของ CI เพิ่มอีก Pull request และ manual CI ยังรัน `check-docs` จาก CI เมื่อ docs เปลี่ยน
- **TUI PTY** ทำงานใน shard Linux Node `checks-node-core-runtime-tui-pty` สำหรับการเปลี่ยนแปลง TUI shard นี้รัน `test/vitest/vitest.tui-pty.config.ts` ด้วย `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` จึงครอบคลุมทั้ง lane fixture `TuiBackend` แบบ deterministic และ smoke `tui --local` ที่ช้ากว่า ซึ่ง mock เฉพาะ endpoint model ภายนอก
- **การแก้ไขเฉพาะ CI routing, การแก้ไข fixture ของ core-test ราคาถูกบางรายการ และการแก้ไข helper/test-routing ของ plugin contract แบบแคบ** ใช้ path manifest แบบ Node-only ที่เร็ว: `preflight`, security และ task `checks-fast-core` เพียงรายการเดียว path นั้นข้าม build artifact, ความเข้ากันได้กับ Node 22, channel contract, shard core แบบเต็ม, shard bundled-plugin และ matrix guard เพิ่มเติม เมื่อการเปลี่ยนแปลงจำกัดอยู่ที่ surface routing หรือ helper ที่ task แบบเร็ว exercise โดยตรง
- **Windows Node checks** scope ไปที่ wrapper process/path เฉพาะ Windows, helper runner ของ npm/pnpm/UI, config package manager และ surface ของ CI workflow ที่ execute lane นั้น; การเปลี่ยนแปลง source, Plugin, install-smoke และ test-only ที่ไม่เกี่ยวข้องจะยังอยู่บน lane Linux Node

ชุดการทดสอบ Node ที่ช้าที่สุดถูกแยกหรือปรับสมดุลเพื่อให้แต่ละงานยังเล็กโดยไม่จอง runner เกินจำเป็น: สัญญา plugin และสัญญา channel แต่ละชุดรันเป็น shard แบบถ่วงน้ำหนักสองชุดที่รองรับด้วย Blacksmith พร้อม fallback มาตรฐานของ GitHub runner, lane core unit fast/support รันแยกกัน, core runtime infra ถูกแบ่งระหว่าง state, process/config, shared และ shard โดเมน cron สามชุด, auto-reply รันเป็น worker ที่ปรับสมดุลแล้ว (โดยแยก subtree ของ reply เป็น shard agent-runner, dispatch และ commands/state-routing) และการตั้งค่า agentic gateway/server ถูกแยกข้าม lane chat/auth/model/http-plugin/runtime/startup แทนการรอ artifact ที่ build แล้ว จากนั้น CI ปกติจะแพ็กเฉพาะ shard รูปแบบ include ของ infra ที่แยกโดดเดี่ยวไว้เข้าเป็น bundle แบบกำหนดแน่นอนที่มีไฟล์ทดสอบไม่เกิน 64 ไฟล์ ซึ่งลดเมทริกซ์ Node โดยไม่รวมชุด command/cron ที่ไม่โดดเดี่ยว, agents-core ที่มี state หรือ gateway/server เข้าด้วยกัน; ชุดหนักแบบคงที่ยังใช้ 8 vCPU ขณะที่ lane แบบ bundle และน้ำหนักต่ำกว่าใช้ 4 vCPU Pull request บน repository canonical ใช้แผนรับเข้าแบบกะทัดรัดเพิ่มเติม: กลุ่มต่อ config เดิมรันใน subprocess ที่แยกโดดเดี่ยวภายในแผน Linux Node ปัจจุบัน 34 งาน ดังนั้น PR เดียวจึงไม่ลงทะเบียนเมทริกซ์ Node เต็มที่มีมากกว่า 70 งาน การ push ไปยัง `main`, manual dispatch และ release gate ยังคงใช้เมทริกซ์เต็ม การทดสอบ browser, QA, media และ plugin เบ็ดเตล็ดแบบกว้างใช้ config Vitest เฉพาะของตนแทน catch-all plugin ที่ใช้ร่วมกัน shard แบบ include-pattern บันทึกรายการ timing โดยใช้ชื่อ CI shard เพื่อให้ `.artifacts/vitest-shard-timings.json` แยกความแตกต่างระหว่าง config ทั้งชุดกับ shard ที่ถูกกรองได้ `check-additional-*` รวมงาน compile/canary ที่ผูกกับขอบเขต package ไว้ด้วยกันและแยกสถาปัตยกรรม topology ของ runtime ออกจากความครอบคลุม gateway watch; รายการ boundary guard ถูกแบ่งแถบเป็น shard ที่หนักด้าน prompt หนึ่งชุดและ shard รวมหนึ่งชุดสำหรับแถบ guard ที่เหลือ โดยแต่ละชุดรัน guard อิสระที่เลือกไว้พร้อมกันและพิมพ์ timing ต่อ check การตรวจ drift ของ prompt snapshot เส้นทางสำเร็จของ Codex ที่มีต้นทุนสูงรันเป็นงานเพิ่มเติมของตัวเองสำหรับ manual CI และเฉพาะการเปลี่ยนแปลงที่กระทบ prompt เท่านั้น ดังนั้นการเปลี่ยน Node ปกติที่ไม่เกี่ยวข้องจึงไม่ต้องรออยู่หลังการสร้าง prompt snapshot แบบเย็น และ boundary shard ยังสมดุลอยู่ในขณะที่ prompt drift ยังคงผูกกับ PR ที่ก่อให้เกิด drift นั้น; flag เดียวกันข้ามการสร้าง prompt snapshot Vitest ภายใน shard core support-boundary ของ artifact ที่ build แล้ว Gateway watch, การทดสอบ channel และ shard core support-boundary รันพร้อมกันภายใน `build-artifacts` หลังจาก `dist/` และ `dist-runtime/` build เสร็จแล้ว

เมื่อผ่านการรับเข้าแล้ว canonical Linux CI อนุญาตให้งานทดสอบ Node ทำงานพร้อมกันได้สูงสุด 24 งานและ
12 งานสำหรับ lane fast/check ที่เล็กกว่า; Windows และ Android คงไว้ที่สองเพราะ
pool runner เหล่านั้นแคบกว่า

แผน PR แบบกะทัดรัดปล่อยงาน Node 18 งานสำหรับชุดปัจจุบัน: กลุ่ม whole-config
ถูก batch ใน subprocess ที่แยกโดดเดี่ยวพร้อม timeout ของ batch 120 นาที
ขณะที่กลุ่ม include-pattern ใช้งบงานที่มีขอบเขตเดียวกันร่วมกัน

Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` แล้วจึง build Play debug APK flavor ของ third-party ไม่มี source set หรือ manifest แยกต่างหาก; lane unit-test ของมันยัง compile flavor ด้วย flag BuildConfig สำหรับ SMS/call-log ขณะเดียวกันก็หลีกเลี่ยงงาน packaging debug APK ซ้ำในทุก push ที่เกี่ยวข้องกับ Android

shard `check-dependencies` รัน `pnpm deadcode:dependencies` (pass เฉพาะ dependency ของ Knip สำหรับ production ที่ตรึงกับ Knip เวอร์ชันล่าสุด โดยปิดอายุ release ขั้นต่ำของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบ findings ไฟล์ที่ไม่ได้ใช้ของ Knip สำหรับ production กับ `scripts/deadcode-unused-files.allowlist.mjs` guard ไฟล์ที่ไม่ได้ใช้จะล้มเหลวเมื่อ PR เพิ่มไฟล์ที่ไม่ได้ใช้ใหม่ซึ่งยังไม่ได้รับการ review หรือทิ้งรายการ allowlist ที่ค้างไว้ ขณะเดียวกันก็รักษาพื้นผิว dynamic plugin, generated, build, live-test และ package bridge ที่ตั้งใจไว้ซึ่ง Knip resolve แบบ static ไม่ได้

## การส่งต่อกิจกรรม ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` คือ bridge ฝั่งเป้าหมายจากกิจกรรม repository ของ OpenClaw เข้าสู่ ClawSweeper มันไม่ checkout หรือ execute โค้ด pull request ที่ไม่น่าเชื่อถือ workflow สร้าง GitHub App token จาก `CLAWSWEEPER_APP_PRIVATE_KEY` แล้ว dispatch payload `repository_dispatch` แบบกะทัดรัดไปยัง `openclaw/clawsweeper`

workflow มีสี่ lane:

- `clawsweeper_item` สำหรับคำขอ review issue และ pull request ที่ระบุชัดเจน;
- `clawsweeper_comment` สำหรับคำสั่ง ClawSweeper ที่ระบุชัดเจนใน comment ของ issue;
- `clawsweeper_commit_review` สำหรับคำขอ review ระดับ commit บนการ push ไปยัง `main`;
- `github_activity` สำหรับกิจกรรม GitHub ทั่วไปที่ agent ClawSweeper อาจตรวจสอบ

lane `github_activity` ส่งต่อเฉพาะ metadata ที่ normalize แล้ว: event type, action, actor, repository, item number, URL, title, state และ excerpt สั้นสำหรับ comment หรือ review เมื่อมี โดยตั้งใจหลีกเลี่ยงการส่งต่อ body ของ webhook ทั้งหมด workflow ฝั่งรับใน `openclaw/clawsweeper` คือ `.github/workflows/github-activity.yml` ซึ่งโพสต์ event ที่ normalize แล้วไปยัง hook ของ OpenClaw Gateway สำหรับ agent ClawSweeper

กิจกรรมทั่วไปคือการสังเกต ไม่ใช่การส่งมอบโดยค่าเริ่มต้น agent ClawSweeper ได้รับเป้าหมาย Discord ใน prompt และควรโพสต์ไปที่ `#clawsweeper` เฉพาะเมื่อ event นั้นน่าประหลาดใจ ดำเนินการได้ มีความเสี่ยง หรือมีประโยชน์ด้านปฏิบัติการ การเปิด แก้ไข ความเคลื่อนไหวจาก bot เสียงรบกวน webhook ซ้ำ และทราฟฟิก review ปกติควรให้ผลเป็น `NO_REPLY`

ถือว่า title, comment, body, ข้อความ review, ชื่อ branch และ commit message ของ GitHub เป็นข้อมูลที่ไม่น่าเชื่อถือตลอดเส้นทางนี้ สิ่งเหล่านี้เป็น input สำหรับการสรุปและ triage ไม่ใช่คำสั่งสำหรับ workflow หรือ runtime ของ agent

## Manual dispatch

Manual CI dispatch รันกราฟงานเดียวกับ CI ปกติ แต่บังคับเปิดทุก lane ที่มี scope และไม่ใช่ Android: shard Linux Node, shard bundled-plugin, shard สัญญา plugin และ channel, ความเข้ากันได้กับ Node 22, `check-*`, `check-additional-*`, smoke check ของ artifact ที่ build แล้ว, docs checks, Python skills, Windows, macOS, iOS build และ Control UI i18n Manual CI dispatch แบบ standalone รัน Android เฉพาะเมื่อ `include_android=true`; release umbrella เต็มเปิดใช้ Android โดยส่ง `include_android=true` การตรวจ static ของ plugin prerelease, shard เฉพาะ release `agentic-plugins`, การ sweep batch extension เต็ม และ lane Docker ของ plugin prerelease ถูกแยกออกจาก CI ชุด Docker prerelease จะรันเฉพาะเมื่อ `Full Release Validation` dispatch workflow แยก `Plugin Prerelease` โดยเปิด gate release-validation

manual run ใช้ concurrency group ที่ไม่ซ้ำกัน เพื่อไม่ให้ชุดเต็มของ release-candidate ถูกยกเลิกโดย push หรือ PR run อื่นบน ref เดียวกัน input เสริม `target_ref` ให้ caller ที่เชื่อถือได้รันกราฟนั้นกับ branch, tag หรือ commit SHA แบบเต็ม ขณะใช้ไฟล์ workflow จาก dispatch ref ที่เลือก

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                          | งาน                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Manual CI dispatch และ fallback ของ repository ที่ไม่ใช่ canonical, การ scan คุณภาพ CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow docs นอก CI และ install-smoke preflight เพื่อให้เมทริกซ์ Blacksmith เข้า queue ได้เร็วขึ้น                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shard extension น้ำหนักต่ำกว่า, `checks-fast-core`, shard สัญญา plugin/channel, shard Linux Node แบบ bundled/น้ำหนักต่ำกว่าส่วนใหญ่, `check-guards`, `check-prod-types`, `check-test-types`, shard `check-additional-*` ที่เลือกไว้ และ `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | ชุด Linux Node หนักที่คงไว้, shard `check-additional-*` ที่หนักด้าน boundary/extension และ `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (ไวต่อ CPU พอที่ 8 vCPU มีต้นทุนมากกว่าที่ประหยัดได้); install-smoke Docker build (เวลา queue ของ 32-vCPU มีต้นทุนมากกว่าที่ประหยัดได้)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` บน `openclaw/openclaw`; fork fallback ไปที่ `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` และ `ios-build` บน `openclaw/openclaw`; fork fallback ไปที่ `macos-26`                                                                                                                                                                                                  |

## งบการลงทะเบียน runner

bucket การลงทะเบียน GitHub runner ปัจจุบันของ OpenClaw อนุญาตให้ลงทะเบียน self-hosted
runner ได้ 3,000 รายการต่อ 5 นาที ขีดจำกัดนี้ใช้ร่วมกันโดยการลงทะเบียน Blacksmith runner
ทั้งหมดในองค์กร `openclaw` ดังนั้นการเพิ่มการติดตั้ง Blacksmith อีกชุด
จึงไม่เพิ่ม bucket ใหม่

ถือว่า label ของ Blacksmith เป็นทรัพยากรที่ขาดแคลนสำหรับการควบคุม burst งานที่
มีหน้าที่เพียง route, notify, summarize, select shard หรือรัน scan CodeQL สั้น ๆ ควร
อยู่บน GitHub-hosted runner เว้นแต่จะมีความต้องการเฉพาะของ Blacksmith ที่วัดผลแล้ว
เมทริกซ์ Blacksmith ใหม่ใด ๆ, `max-parallel` ที่ใหญ่ขึ้น หรือ workflow ความถี่สูง
ต้องแสดงจำนวนการลงทะเบียนกรณีเลวร้ายที่สุดและรักษาเป้าหมายระดับองค์กร
ให้ต่ำกว่า 2,000 การลงทะเบียนต่อ 5 นาที โดยเหลือ headroom สำหรับ repository
ที่รันพร้อมกันและงานที่ retry

CI ของ canonical-repo คง Blacksmith เป็นเส้นทาง runner เริ่มต้นสำหรับการรัน push และ pull-request ปกติ `workflow_dispatch` และการรัน repository ที่ไม่ใช่ canonical ใช้ GitHub-hosted runner แต่การรัน canonical ปกติยังไม่ได้ probe สุขภาพ queue ของ Blacksmith หรือ fallback อัตโนมัติไปยัง label GitHub-hosted เมื่อ Blacksmith ไม่พร้อมใช้งาน

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

## ประสิทธิภาพ OpenClaw

`OpenClaw Performance` คือเวิร์กโฟลว์ประสิทธิภาพของผลิตภัณฑ์/รันไทม์ เวิร์กโฟลว์นี้ทำงานทุกวันบน `main` และสามารถสั่งรันด้วยตนเองได้:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

โดยปกติการสั่งรันด้วยตนเองจะเบนช์มาร์ก ref ของเวิร์กโฟลว์ ตั้งค่า `target_ref` เพื่อเบนช์มาร์กแท็กรุ่นเผยแพร่หรือสาขาอื่นด้วยอิมพลีเมนเทชันเวิร์กโฟลว์ปัจจุบัน พาธรายงานที่เผยแพร่และตัวชี้ล่าสุดจะอ้างอิงตาม ref ที่ถูกทดสอบ และ `index.md` แต่ละไฟล์จะบันทึก ref/SHA ที่ถูกทดสอบ, ref/SHA ของเวิร์กโฟลว์, ref ของ Kova, โปรไฟล์, โหมดการยืนยันตัวตนของเลน, โมเดล, จำนวนรอบซ้ำ และตัวกรองสถานการณ์

เวิร์กโฟลว์ติดตั้ง OCM จากรุ่นเผยแพร่ที่ปักหมุดไว้ และติดตั้ง Kova จาก `openclaw/Kova` ที่อินพุต `kova_ref` ที่ปักหมุดไว้ จากนั้นรันสามเลน:

- `mock-provider`: สถานการณ์วินิจฉัยของ Kova กับรันไทม์ที่สร้างในเครื่อง พร้อมการยืนยันตัวตนปลอมแบบกำหนดผลได้ที่เข้ากันได้กับ OpenAI
- `mock-deep-profile`: การทำโปรไฟล์ CPU/heap/trace สำหรับจุดร้อนของการเริ่มต้น, Gateway และ agent-turn
- `live-openai-candidate`: เทิร์น agent จริงของ OpenAI `openai/gpt-5.5` ซึ่งจะข้ามเมื่อไม่มี `OPENAI_API_KEY`

เลน mock-provider ยังรันโพรบซอร์สแบบเนทีฟของ OpenClaw หลังจาก Kova ผ่านแล้ว: เวลาบูต Gateway และหน่วยความจำในกรณีเริ่มต้นแบบค่าเริ่มต้น, hook และ 50-Plugin; RSS การนำเข้า Plugin ที่บันเดิลมา, ลูป hello ของ `channel-chat-baseline` แบบ mock-OpenAI ซ้ำ ๆ, คำสั่งเริ่มต้น CLI กับ Gateway ที่บูตแล้ว และโพรบประสิทธิภาพ smoke ของสถานะ SQLite เมื่อมีรายงานซอร์ส mock-provider ที่เผยแพร่ก่อนหน้าสำหรับ ref ที่ถูกทดสอบ สรุปซอร์สจะเปรียบเทียบค่า RSS และ heap ปัจจุบันกับ baseline นั้น และทำเครื่องหมายการเพิ่มขึ้นของ RSS ขนาดใหญ่ว่า `watch` สรุป Markdown ของโพรบซอร์สอยู่ที่ `source/index.md` ในชุดรายงาน โดยมี JSON ดิบอยู่ข้าง ๆ

ทุกเลนอัปโหลดอาร์ติแฟกต์ GitHub เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว เวิร์กโฟลว์ยัง commit `report.json`, `report.md`, ชุดบันเดิล, `index.md` และอาร์ติแฟกต์โพรบซอร์สเข้าไปใน `openclaw/clawgrit-reports` ภายใต้ `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` ตัวชี้ tested-ref ปัจจุบันจะถูกเขียนเป็น `openclaw-performance/<tested-ref>/latest-<lane>.json`

## การตรวจสอบความถูกต้องรุ่นเผยแพร่แบบเต็ม

`Full Release Validation` คือเวิร์กโฟลว์ครอบคลุมแบบสั่งรันด้วยตนเองสำหรับ “รันทุกอย่างก่อนเผยแพร่รุ่น” เวิร์กโฟลว์นี้รับสาขา แท็ก หรือ SHA commit แบบเต็ม, สั่งรันเวิร์กโฟลว์ `CI` แบบ manual ด้วยเป้าหมายนั้น, สั่งรัน `Plugin Prerelease` สำหรับหลักฐานเฉพาะรุ่นเผยแพร่ของ Plugin/แพ็กเกจ/static/Docker และสั่งรัน `OpenClaw Release Checks` สำหรับ install smoke, การยอมรับแพ็กเกจ, การตรวจแพ็กเกจข้าม OS, การเรนเดอร์ maturity scorecard จากหลักฐานโปรไฟล์ QA, QA Lab parity, Matrix และเลน Telegram โปรไฟล์ stable และ full จะรวมการครอบคลุม live/E2E แบบละเอียดและ Docker release-path soak เสมอ; โปรไฟล์ beta สามารถเลือกเปิดใช้ด้วย `run_release_soak=true` E2E ของ Telegram สำหรับแพ็กเกจ canonical จะรันภายใน Package Acceptance ดังนั้น candidate แบบเต็มจะไม่เริ่ม live poller ซ้ำ หลังเผยแพร่ ให้ส่ง `release_package_spec` เพื่อใช้แพ็กเกจ npm ที่เผยแพร่แล้วซ้ำตลอด release checks, Package Acceptance, Docker, cross-OS และ Telegram โดยไม่ต้องสร้างใหม่ ใช้ `npm_telegram_package_spec` เฉพาะสำหรับการรันซ้ำ Telegram แบบโฟกัสบนแพ็กเกจที่เผยแพร่แล้ว เลนแพ็กเกจ live ของ Plugin Codex ใช้สถานะที่เลือกเดียวกันเป็นค่าเริ่มต้น: `release_package_spec=openclaw@<tag>` ที่เผยแพร่แล้วจะได้ `codex_plugin_spec=npm:@openclaw/codex@<tag>` ส่วนการรันแบบ SHA/อาร์ติแฟกต์จะ pack `extensions/codex` จาก ref ที่เลือก ตั้งค่า `codex_plugin_spec` อย่างชัดเจนสำหรับซอร์ส Plugin แบบกำหนดเอง เช่น spec `npm:`, `npm-pack:` หรือ `git:`

ดู [การตรวจสอบความถูกต้องรุ่นเผยแพร่แบบเต็ม](/th/reference/full-release-validation) สำหรับ
เมทริกซ์ stage, ชื่องานเวิร์กโฟลว์ที่แน่นอน, ความแตกต่างของโปรไฟล์, อาร์ติแฟกต์ และ
ตัวจัดการการรันซ้ำแบบโฟกัส

`OpenClaw Release Publish` คือเวิร์กโฟลว์เผยแพร่รุ่นที่เปลี่ยนแปลงสถานะแบบ manual ให้สั่งรัน
จาก `release/YYYY.M.PATCH` หรือ `main` หลังจากมีแท็กรุ่นเผยแพร่แล้วและหลังจาก
preflight npm ของ OpenClaw สำเร็จ เวิร์กโฟลว์จะตรวจสอบ `pnpm plugins:sync:check`,
สั่งรัน `Plugin NPM Release` สำหรับแพ็กเกจ Plugin ทั้งหมดที่เผยแพร่ได้, สั่งรัน
`Plugin ClawHub Release` สำหรับ SHA รุ่นเผยแพร่เดียวกัน และจากนั้นเท่านั้นจึงสั่งรัน
`OpenClaw NPM Release` ด้วย `preflight_run_id` ที่บันทึกไว้ การเผยแพร่ stable ยัง
ต้องมี `windows_node_tag` ที่ตรงกันแบบเป๊ะ; เวิร์กโฟลว์จะตรวจสอบรุ่นเผยแพร่ซอร์ส Windows
และเปรียบเทียบตัวติดตั้ง x64/ARM64 กับอินพุต `windows_node_installer_digests`
ที่ candidate อนุมัติแล้วก่อน child สำหรับเผยแพร่ใด ๆ จากนั้นจึง promote
และตรวจสอบ digest ตัวติดตั้งที่ปักหมุดเดียวกัน รวมถึง companion asset ที่ตรงกันเป๊ะ
และสัญญา checksum ก่อนเผยแพร่ draft GitHub release

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

สำหรับหลักฐาน commit ที่ปักหมุดบนสาขาที่เคลื่อนไหวเร็ว ให้ใช้ helper แทน
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

ref สำหรับ dispatch เวิร์กโฟลว์ GitHub ต้องเป็นสาขาหรือแท็ก ไม่ใช่ SHA commit ดิบ
helper จะ push สาขาชั่วคราว `release-ci/<sha>-...` ที่ SHA เป้าหมาย,
สั่งรัน `Full Release Validation` จาก ref ที่ปักหมุดนั้น, ตรวจสอบว่า `headSha`
ของเวิร์กโฟลว์ child ทุกตัวตรงกับเป้าหมาย และลบสาขาชั่วคราวเมื่อการรันเสร็จสิ้น
ตัวตรวจสอบ umbrella จะล้มเหลวด้วยหากมีเวิร์กโฟลว์ child ใดรันที่ SHA อื่น

`release_profile` ควบคุมความกว้างของ live/provider ที่ส่งเข้าไปใน release checks
เวิร์กโฟลว์ release แบบ manual มีค่าเริ่มต้นเป็น `stable`; ใช้ `full` เฉพาะเมื่อคุณ
ตั้งใจต้องการเมทริกซ์ advisory provider/media ที่กว้าง โปรไฟล์ stable และ full
จะรัน live/E2E แบบละเอียดและ Docker release-path soak เสมอ;
โปรไฟล์ beta สามารถเลือกเปิดใช้ด้วย `run_release_soak=true`

- `minimum` คงเฉพาะเลน OpenAI/core ที่เร็วที่สุดและสำคัญต่อการเผยแพร่รุ่น
- `stable` เพิ่มชุด provider/backend แบบ stable
- `full` รันเมทริกซ์ advisory provider/media ที่กว้าง

umbrella จะบันทึก id การรัน child ที่ถูก dispatch และงานสุดท้าย `Verify full validation` จะตรวจข้อสรุปปัจจุบันของการรัน child อีกครั้งและแนบตารางงานที่ช้าที่สุดสำหรับการรัน child แต่ละตัว หากเวิร์กโฟลว์ child ถูกรันซ้ำและกลายเป็นสีเขียว ให้รันซ้ำเฉพาะงาน parent verifier เพื่อรีเฟรชผล umbrella และสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รับ `rerun_group` ใช้ `all` สำหรับ release candidate, `ci` สำหรับเฉพาะ child ของ full CI ปกติ, `plugin-prerelease` สำหรับเฉพาะ child prerelease ของ Plugin, `release-checks` สำหรับ child release ทุกตัว หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` หรือ `npm-telegram` บน umbrella วิธีนี้ช่วยจำกัดการรันซ้ำของกล่อง release ที่ล้มเหลวหลังการแก้ไขแบบโฟกัส สำหรับเลน cross-OS เดียวที่ล้มเหลว ให้รวม `rerun_group=cross-os` กับ `cross_os_suite_filter` เช่น `windows/packaged-upgrade`; คำสั่ง cross-OS ที่ใช้เวลานานจะ emit บรรทัด Heartbeat และสรุป packaged-upgrade จะรวมเวลาต่อเฟส เลน QA release-check เป็น advisory ยกเว้น gate ความครอบคลุมของเครื่องมือรันไทม์มาตรฐาน ซึ่งจะบล็อกเมื่อเครื่องมือ dynamic ของ OpenClaw ที่จำเป็น drift หรือหายไปจากสรุประดับมาตรฐาน

`OpenClaw Release Checks` ใช้ ref เวิร์กโฟลว์ที่ trusted เพื่อ resolve ref ที่เลือกครั้งเดียวเป็น tarball `release-package-under-test` จากนั้นส่งอาร์ติแฟกต์นั้นไปยังการตรวจ cross-OS และ Package Acceptance รวมถึงเวิร์กโฟลว์ Docker ของ live/E2E release-path เมื่อรัน soak coverage วิธีนี้ทำให้ bytes ของแพ็กเกจสอดคล้องกันตลอดกล่อง release และหลีกเลี่ยงการ repack candidate เดียวกันในงาน child หลายงาน สำหรับเลน live ของ npm-plugin Codex, release checks จะส่ง spec Plugin ที่เผยแพร่แล้วซึ่งตรงกันและ derive จาก `release_package_spec`, ส่ง `codex_plugin_spec` ที่ operator ระบุ หรือปล่อยอินพุตว่างไว้เพื่อให้สคริปต์ Docker pack Plugin Codex ของ checkout ที่เลือก

การรัน `Full Release Validation` ซ้ำสำหรับ `ref=main` และ `rerun_group=all`
จะแทนที่ umbrella ที่เก่ากว่า parent monitor จะยกเลิกเวิร์กโฟลว์ child ใด ๆ ที่
ได้ dispatch ไปแล้วเมื่อ parent ถูกยกเลิก ดังนั้นการตรวจสอบความถูกต้อง main ที่ใหม่กว่า
จะไม่ต้องรอหลัง release-check run เก่าที่ใช้เวลาสองชั่วโมง การตรวจสอบความถูกต้องของ
สาขา/แท็ก release และกลุ่ม rerun แบบโฟกัสจะคง `cancel-in-progress: false`

## Shard live และ E2E

child live/E2E ของ release คงความครอบคลุม `pnpm test:live` แบบเนทีฟที่กว้างไว้ แต่รันเป็น shard ที่มีชื่อผ่าน `scripts/test-live-shard.mjs` แทนงานแบบ serial งานเดียว:

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
- shard สื่อ audio/video ที่แยกออก และ shard music ที่กรองตาม provider

วิธีนี้คงความครอบคลุมไฟล์เดิมไว้ ขณะเดียวกันทำให้ความล้มเหลวของ live provider ที่ช้าสามารถรันซ้ำและวินิจฉัยได้ง่ายขึ้น ชื่อ shard แบบรวม `native-live-extensions-o-z`, `native-live-extensions-media` และ `native-live-extensions-media-music` ยังคงใช้ได้สำหรับการรันซ้ำแบบ manual ครั้งเดียว

shard สื่อ native live รันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งสร้างโดยเวิร์กโฟลว์ `Live Media Runner Image` อิมเมจนั้นติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้า; งานสื่อจะตรวจสอบเฉพาะ binary ก่อน setup เท่านั้น ให้คงชุดทดสอบ live ที่อิง Docker ไว้บน runner Blacksmith ปกติ เพราะงาน container ไม่ใช่ที่ที่เหมาะสำหรับเริ่มการทดสอบ Docker แบบซ้อนกัน

ชาร์ดโมเดล/แบ็กเอนด์แบบสดที่มี Docker รองรับใช้รูปภาพ `ghcr.io/openclaw/openclaw-live-test:<sha>` ที่ใช้ร่วมกันแยกต่างหากต่อคอมมิตที่เลือกแต่ละรายการ เวิร์กโฟลว์รีลีสแบบสดจะบิลด์และพุชรูปภาพนั้นหนึ่งครั้ง จากนั้นชาร์ดโมเดลสดของ Docker, Gateway ที่แบ่งตามผู้ให้บริการ, แบ็กเอนด์ CLI, การผูก ACP และ Codex harness จะรันด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ชาร์ด Gateway Docker มีขีดจำกัด `timeout` ระดับสคริปต์อย่างชัดเจนที่ต่ำกว่า timeout ของงานเวิร์กโฟลว์ เพื่อให้คอนเทนเนอร์หรือเส้นทาง cleanup ที่ค้างล้มเหลวอย่างรวดเร็วแทนที่จะใช้โควตาเวลา release-check ทั้งหมด หากชาร์ดเหล่านั้นบิลด์เป้าหมาย Docker ซอร์สเต็มแยกกันเอง การรันรีลีสจะถูกตั้งค่าผิดและจะเสียเวลาจริงไปกับการบิลด์รูปภาพซ้ำ

## การยอมรับแพ็กเกจ

ใช้ `Package Acceptance` เมื่อคำถามคือ “แพ็กเกจ OpenClaw ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์หรือไม่?” สิ่งนี้ต่างจาก CI ปกติ: CI ปกติตรวจสอบทรีซอร์ส ส่วนการยอมรับแพ็กเกจตรวจสอบ tarball เดียวผ่าน Docker E2E harness เดียวกับที่ผู้ใช้ใช้งานหลังติดตั้งหรืออัปเดต

### งาน

1. `resolve_package` checkout `workflow_ref`, resolve ผู้สมัครแพ็กเกจหนึ่งรายการ, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, อัปโหลดทั้งคู่เป็น artifact `package-under-test` และพิมพ์ซอร์ส, workflow ref, package ref, เวอร์ชัน, SHA-256 และโปรไฟล์ในสรุปขั้นตอนของ GitHub
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` เวิร์กโฟลว์ที่ใช้ซ้ำได้จะดาวน์โหลด artifact นั้น ตรวจสอบ inventory ของ tarball เตรียมรูปภาพ Docker แบบ package-digest เมื่อจำเป็น และรัน lane Docker ที่เลือกกับแพ็กเกจนั้นแทนการแพ็ก workflow checkout เมื่อโปรไฟล์เลือก `docker_lanes` แบบเจาะจงหลายรายการ เวิร์กโฟลว์ที่ใช้ซ้ำได้จะเตรียมแพ็กเกจและรูปภาพที่ใช้ร่วมกันหนึ่งครั้ง จากนั้นกระจาย lane เหล่านั้นออกเป็นงาน Docker แบบเจาะจงที่รันขนานกันพร้อม artifact ไม่ซ้ำกัน
3. `package_telegram` เรียก `NPM Telegram Beta E2E` แบบเลือกได้ โดยรันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้ง artifact `package-under-test` เดียวกันเมื่อ Package Acceptance resolve ได้หนึ่งรายการ; การ dispatch Telegram แบบ standalone ยังสามารถติดตั้งสเปก npm ที่เผยแพร่แล้วได้
4. `summary` ทำให้เวิร์กโฟลว์ล้มเหลวหากการ resolve แพ็กเกจ, การยอมรับ Docker หรือ lane Telegram แบบเลือกได้ล้มเหลว

### แหล่งที่มาของผู้สมัคร

- `source=npm` ยอมรับเฉพาะ `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรีลีส OpenClaw ที่ตรงแบบ exact เช่น `openclaw@2026.4.27-beta.2` ใช้สิ่งนี้สำหรับการยอมรับ prerelease/stable ที่เผยแพร่แล้ว
- `source=ref` แพ็ก branch, tag หรือ SHA คอมมิตเต็มของ `package_ref` ที่เชื่อถือได้ resolver จะ fetch branch/tag ของ OpenClaw, ตรวจสอบว่าคอมมิตที่เลือกเข้าถึงได้จากประวัติ branch ของ repository หรือ release tag, ติดตั้ง dependency ใน worktree ที่ detached และแพ็กด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` ดาวน์โหลด `.tgz` แบบ HTTPS สาธารณะ; ต้องระบุ `package_sha256` เส้นทางนี้ปฏิเสธ credential ใน URL, พอร์ต HTTPS ที่ไม่ใช่ค่าเริ่มต้น, hostname หรือ IP ที่ resolve แล้วแบบ private/internal/special-use และ redirect ที่อยู่นอกนโยบายความปลอดภัยสาธารณะเดียวกัน
- `source=trusted-url` ดาวน์โหลด `.tgz` แบบ HTTPS จากนโยบาย trusted-source ที่ตั้งชื่อไว้ใน `.github/package-trusted-sources.json`; ต้องระบุ `package_sha256` และ `trusted_source_id` ใช้สิ่งนี้เฉพาะสำหรับ mirror ระดับองค์กรหรือ repository แพ็กเกจส่วนตัวที่ maintainer เป็นเจ้าของ ซึ่งต้องใช้ host, port, path prefix, redirect host หรือการ resolve เครือข่ายส่วนตัวที่ตั้งค่าไว้ หากนโยบายประกาศ bearer auth เวิร์กโฟลว์จะใช้ secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN` แบบคงที่; credential ที่ฝังใน URL ยังถูกปฏิเสธอยู่
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งรายการจาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็นตัวเลือก แต่ควรระบุสำหรับ artifact ที่แชร์ภายนอก

แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือโค้ดเวิร์กโฟลว์/harness ที่เชื่อถือได้ซึ่งรันการทดสอบ `package_ref` คือคอมมิตซอร์สที่จะถูกแพ็กเมื่อ `source=ref` สิ่งนี้ทำให้ test harness ปัจจุบันตรวจสอบคอมมิตซอร์สเก่าที่เชื่อถือได้โดยไม่ต้องรันตรรกะเวิร์กโฟลว์เก่า

### โปรไฟล์ชุดทดสอบ

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` รวมกับ `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — ชิ้นส่วนเส้นทางรีลีส Docker เต็มพร้อม OpenWebUI
- `custom` — `docker_lanes` แบบ exact; จำเป็นเมื่อ `suite_profile=custom`

โปรไฟล์ `package` ใช้ coverage Plugin แบบ offline เพื่อให้การตรวจสอบแพ็กเกจที่เผยแพร่แล้วไม่ถูกกั้นโดยความพร้อมใช้งานของ ClawHub แบบสด lane Telegram แบบเลือกได้ใช้ artifact `package-under-test` ซ้ำใน `NPM Telegram Beta E2E` โดยคงเส้นทางสเปก npm ที่เผยแพร่แล้วไว้สำหรับการ dispatch แบบ standalone

สำหรับนโยบายการทดสอบอัปเดตและ Plugin โดยเฉพาะ รวมถึงคำสั่ง local,
lane Docker, input ของ Package Acceptance, ค่าเริ่มต้นของรีลีส และการ triage ความล้มเหลว,
ดู [การทดสอบอัปเดตและ Plugin](/th/help/testing-updates-plugins)

Release checks เรียก Package Acceptance ด้วย `source=artifact`, artifact แพ็กเกจรีลีสที่เตรียมไว้, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` และ `telegram_mode=mock-openai` สิ่งนี้ทำให้การย้ายข้อมูลแพ็กเกจ, การอัปเดต, การติดตั้ง Skills จาก ClawHub แบบสด, การ cleanup dependency ของ Plugin ที่ล้าสมัย, การซ่อมการติดตั้ง Plugin ที่ตั้งค่าไว้, Plugin แบบ offline, plugin-update และหลักฐาน Telegram อยู่บน tarball แพ็กเกจที่ resolve แล้วเดียวกัน ตั้งค่า `release_package_spec` บน Full Release Validation หรือ OpenClaw Release Checks หลังเผยแพร่ beta เพื่อรัน matrix เดียวกันกับแพ็กเกจ npm ที่ส่งมอบแล้วโดยไม่ต้องบิลด์ใหม่; ตั้งค่า `package_acceptance_package_spec` เฉพาะเมื่อ Package Acceptance ต้องใช้แพ็กเกจที่แตกต่างจากส่วนที่เหลือของการตรวจสอบรีลีส release checks แบบข้าม OS ยังคงครอบคลุม onboarding, installer และพฤติกรรมแพลตฟอร์มเฉพาะ OS; การตรวจสอบผลิตภัณฑ์ด้านแพ็กเกจ/อัปเดตควรเริ่มด้วย Package Acceptance lane Docker `published-upgrade-survivor` ตรวจสอบ baseline แพ็กเกจที่เผยแพร่แล้วหนึ่งรายการต่อการรันในเส้นทางรีลีสแบบ blocking ใน Package Acceptance, tarball `package-under-test` ที่ resolve แล้วเป็นผู้สมัครเสมอ และ `published_upgrade_survivor_baseline` เลือก fallback baseline ที่เผยแพร่แล้ว โดยค่าเริ่มต้นเป็น `openclaw@latest`; คำสั่ง rerun ของ lane ที่ล้มเหลวจะรักษา baseline นั้นไว้ Full Release Validation ที่มี `run_release_soak=true` หรือ `release_profile=full` ตั้งค่า `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` และ `published_upgrade_survivor_scenarios=reported-issues` เพื่อขยายครอบคลุมรีลีส npm stable ล่าสุดสี่รายการ รวมถึงรีลีสขอบเขตความเข้ากันได้ของ Plugin ที่ pin ไว้และ fixture ตามรูปแบบ issue สำหรับ config ของ Feishu, ไฟล์ bootstrap/persona ที่ถูกรักษาไว้, การติดตั้ง OpenClaw Plugin ที่ตั้งค่าไว้, path log แบบ tilde และ root dependency ของ Plugin legacy ที่ล้าสมัย การเลือก published-upgrade survivor แบบหลาย baseline จะถูก shard ตาม baseline เป็นงาน Docker runner แบบเจาะจงแยกกัน เวิร์กโฟลว์ `Update Migration` แยกต่างหากใช้ lane Docker `update-migration` พร้อม `all-since-2026.4.23` และ `plugin-deps-cleanup` เมื่อคำถามคือการ cleanup อัปเดตที่เผยแพร่แล้วแบบ exhaustive ไม่ใช่ breadth ของ Full Release CI ปกติ การรัน aggregate แบบ local สามารถส่งสเปกแพ็กเกจ exact ด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, คง lane เดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` เช่น `openclaw@2026.4.15` หรือตั้งค่า `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` สำหรับ scenario matrix lane ที่เผยแพร่แล้วตั้งค่า baseline ด้วยสูตรคำสั่ง `openclaw config set` ที่ bake ไว้ บันทึกขั้นตอนสูตรใน `summary.json` และ probe `/healthz`, `/readyz` รวมถึงสถานะ RPC หลัง Gateway เริ่มต้น lane Windows packaged และ installer fresh ยังตรวจสอบด้วยว่าแพ็กเกจที่ติดตั้งแล้วสามารถ import browser-control override จาก path Windows แบบ absolute ดิบได้ smoke agent-turn ข้าม OS ของ OpenAI มีค่าเริ่มต้นเป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อตั้งค่าไว้ มิฉะนั้นเป็น `openai/gpt-5.5` เพื่อให้หลักฐานการติดตั้งและ Gateway อยู่บนโมเดลทดสอบ GPT-5 พร้อมหลีกเลี่ยงค่าเริ่มต้น GPT-4.x

### หน้าต่างความเข้ากันได้ legacy

Package Acceptance มีหน้าต่าง legacy-compatibility ที่มีขอบเขตสำหรับแพ็กเกจที่เผยแพร่ไปแล้ว แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้เส้นทางความเข้ากันได้:

- รายการ QA ส่วนตัวที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ tarball ละไว้;
- `doctor-switch` อาจข้าม subcase การคงอยู่ของ `gateway install --wrapper` เมื่อแพ็กเกจไม่เปิดเผย flag นั้น;
- `update-channel-switch` อาจ prune pnpm `patchedDependencies` ที่หายไปจาก fixture git ปลอมที่มาจาก tarball และอาจ log `update.channel` ที่คงอยู่ซึ่งหายไป;
- การทดสอบ smoke ของ Plugin อาจอ่านตำแหน่ง install-record legacy หรือยอมรับการไม่มีความคงอยู่ของ install-record ใน marketplace;
- `plugin-update` อาจอนุญาตการย้ายข้อมูล metadata ของ config โดยยังต้องให้พฤติกรรม install record และ no-reinstall คงไม่เปลี่ยนแปลง

แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ metadata stamp ของ local build ที่เคยส่งมอบไปแล้วด้วย แพ็กเกจภายหลังต้องเป็นไปตามสัญญาสมัยใหม่; เงื่อนไขเดียวกันจะล้มเหลวแทนการเตือนหรือข้าม

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

เมื่อ debug การรัน package acceptance ที่ล้มเหลว ให้เริ่มที่สรุป `resolve_package` เพื่อยืนยันแหล่งที่มาแพ็กเกจ, เวอร์ชัน และ SHA-256 จากนั้นตรวจสอบ child run `docker_acceptance` และ artifact Docker ของมัน: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log ของ lane, timing ของ phase และคำสั่ง rerun ควร rerun โปรไฟล์แพ็กเกจที่ล้มเหลวหรือ lane Docker แบบ exact แทนการ rerun full release validation

## การทดสอบ smoke การติดตั้ง

เวิร์กโฟลว์ `Install Smoke` แยกต่างหากใช้สคริปต์ scope เดียวกันซ้ำผ่านงาน `preflight` ของตัวเอง โดยแยก coverage ของ smoke ออกเป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **Fast path** ทำงานสำหรับ pull request ที่แตะพื้นผิว Docker/package, การเปลี่ยนแปลง package/manifest ของ Plugin ที่ bundled, หรือพื้นผิว core plugin/channel/gateway/Plugin SDK ที่งาน Docker smoke ใช้ทดสอบ การเปลี่ยนแปลง Plugin ที่ bundled แบบ source-only, การแก้ไขเฉพาะ test, และการแก้ไขเฉพาะ docs จะไม่จอง Docker workers Fast path จะ build image จาก root Dockerfile หนึ่งครั้ง, ตรวจสอบ CLI, รัน agents delete shared-workspace CLI smoke, รัน container gateway-network e2e, ตรวจสอบ bundled extension build arg, และรัน bounded bundled-plugin Docker profile ภายใต้ timeout รวมของคำสั่ง 240 วินาที (Docker run ของแต่ละ scenario ถูกจำกัดแยกกัน)
- **Full path** เก็บ coverage สำหรับ QR package install และ installer Docker/update ไว้สำหรับ nightly scheduled runs, manual dispatches, workflow-call release checks, และ pull request ที่แตะพื้นผิว installer/package/Docker จริง ๆ ใน full mode, install-smoke จะเตรียมหรือใช้ target-SHA GHCR root Dockerfile smoke image เดิมซ้ำหนึ่ง image จากนั้นรัน QR package install, root Dockerfile/gateway smokes, installer/update smokes, และ fast bundled-plugin Docker E2E เป็นงานแยกกัน เพื่อให้งาน installer ไม่ต้องรออยู่หลัง root image smokes

`main` pushes (รวมถึง merge commits) จะไม่บังคับ full path; เมื่อ changed-scope logic ขอ coverage แบบ full บน push, workflow จะคง fast Docker smoke ไว้และปล่อย full install smoke ให้ nightly หรือ release validation

slow Bun global install image-provider smoke ถูก gate แยกด้วย `run_bun_global_install_smoke` งานนี้รันบน nightly schedule และจาก release checks workflow และ manual `Install Smoke` dispatches สามารถเลือกเข้าร่วมได้ แต่ pull requests และ `main` pushes จะไม่รัน CI ของ PR ปกติยังคงรัน fast Bun launcher regression lane สำหรับการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node ส่วน QR และ installer Docker tests ยังคงมี Dockerfile ที่เน้นการติดตั้งของตัวเอง

## Local Docker E2E

`pnpm test:docker:all` prebuild shared live-test image หนึ่ง image, pack OpenClaw หนึ่งครั้งเป็น npm tarball, และ build shared `scripts/e2e/Dockerfile` images สอง image:

- bare Node/Git runner สำหรับ installer/update/plugin-dependency lanes;
- functional image ที่ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ functionality lanes ปกติ

นิยาม Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, planner logic อยู่ใน `scripts/lib/docker-e2e-plan.mjs`, และ runner จะ execute เฉพาะ plan ที่เลือก scheduler เลือก image ต่อ lane ด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` จากนั้นรัน lanes ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### ค่าที่ปรับได้

| Variable                               | Default | Purpose                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | จำนวน slot ของ main-pool สำหรับ lanes ปกติ                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | จำนวน slot ของ tail-pool ที่ sensitive ต่อ provider                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | cap ของ live lane ที่รันพร้อมกันเพื่อไม่ให้ providers throttle                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | cap ของ npm install lane ที่รันพร้อมกัน                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | cap ของ multi-service lane ที่รันพร้อมกัน                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | ระยะหน่วงระหว่างการเริ่ม lanes เพื่อหลีกเลี่ยง Docker daemon create storms; ตั้งเป็น `0` เพื่อไม่หน่วง     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | fallback timeout ต่อ lane (120 นาที); live/tail lanes บางรายการที่เลือกใช้ cap ที่เข้มกว่า           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` พิมพ์ scheduler plan โดยไม่รัน lanes                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | รายการ lane แบบ exact คั่นด้วย comma; ข้าม cleanup smoke เพื่อให้ agents reproduce lane ที่ล้มเหลวหนึ่ง lane ได้ |

lane ที่หนักกว่า effective cap ของตัวเองยังสามารถเริ่มจาก pool ว่างได้ แล้วจะรันเพียงลำพังจนกว่าจะปล่อย capacity local aggregate จะ preflight Docker, ลบ OpenClaw E2E containers ที่ค้าง, แสดงสถานะ active-lane, persist lane timings สำหรับการเรียง longest-first, และโดย default จะหยุด schedule pooled lanes ใหม่หลังจาก failure แรก

### Reusable live/E2E workflow

reusable live/E2E workflow ถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องการ package, image kind, live image, lane, และ credential coverage ใด จากนั้น `scripts/docker-e2e.mjs` แปลง plan นั้นเป็น GitHub outputs และ summaries งานนี้จะ pack OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลด package artifact ของ current-run, หรือดาวน์โหลด package artifact จาก `package_artifact_run_id`; validate tarball inventory; build และ push bare/functional GHCR Docker E2E images ที่ tag ด้วย package digest ผ่าน Docker layer cache ของ Blacksmith เมื่อ plan ต้องการ package-installed lanes; และ reuse inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรือ package-digest images ที่มีอยู่แล้วแทนการ rebuild Docker image pulls จะ retry ด้วย timeout ต่อ attempt แบบ bounded 180 วินาที เพื่อให้ registry/cache stream ที่ค้าง retry ได้รวดเร็วแทนที่จะกินเวลาส่วนใหญ่ของ CI critical path

### Release-path chunks

Release Docker coverage รัน chunked jobs ที่เล็กลงด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละ chunk pull เฉพาะ image kind ที่ต้องใช้ และ execute หลาย lanes ผ่าน weighted scheduler เดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Docker chunks ของ release ปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, และ `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` `package-update-openai` รวม live Codex plugin package lane ซึ่งติดตั้ง candidate OpenClaw package, ติดตั้ง Codex plugin จาก `codex_plugin_spec` หรือ same-ref tarball พร้อมการอนุมัติการติดตั้ง Codex CLI อย่างชัดเจน, รัน Codex CLI preflight, แล้วรัน OpenClaw agent turns หลายครั้งใน session เดียวกันกับ OpenAI `plugins-runtime-core`, `plugins-runtime`, และ `plugins-integrations` ยังคงเป็น aggregate plugin/runtime aliases ส่วน alias ของ lane `install-e2e` ยังคงเป็น aggregate manual rerun alias สำหรับ provider installer lanes ทั้งสอง

OpenWebUI ถูกพับเข้าไปใน `plugins-runtime-services` เมื่อ full release-path coverage ร้องขอ และคง standalone `openwebui` chunk ไว้เฉพาะสำหรับ OpenWebUI-only dispatches bundled-channel update lanes จะ retry หนึ่งครั้งสำหรับ transient npm network failures

แต่ละ chunk upload `.artifacts/docker-tests/` พร้อม lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, slow-lane tables, และคำสั่ง rerun ต่อ lane input `docker_lanes` ของ workflow รัน lanes ที่เลือกกับ prepared images แทน chunk jobs ซึ่งทำให้การ debug failed-lane ถูกจำกัดอยู่ใน targeted Docker job หนึ่งงาน และเตรียม ดาวน์โหลด หรือ reuse package artifact สำหรับ run นั้น; หาก lane ที่เลือกเป็น live Docker lane, targeted job จะ build live-test image ในเครื่องสำหรับ rerun นั้น คำสั่ง GitHub rerun ต่อ lane ที่ generate จะรวม `package_artifact_run_id`, `package_artifact_name`, และ prepared image inputs เมื่อค่าเหล่านั้นมีอยู่ เพื่อให้ failed lane reuse package และ images เดิมจาก failed run ได้

```bash
pnpm test:docker:rerun <run-id>      # ดาวน์โหลด Docker artifacts และพิมพ์คำสั่ง targeted rerun แบบ combined/per-lane
pnpm test:docker:timings <summary>   # สรุป slow-lane และ phase critical-path
```

scheduled live/E2E workflow รัน full release-path Docker suite ทุกวัน

## Plugin Prerelease

`Plugin Prerelease` เป็น product/package coverage ที่มีค่าใช้จ่ายสูงกว่า จึงเป็น workflow แยกที่ dispatch โดย `Full Release Validation` หรือ operator ที่ระบุอย่างชัดเจน Normal pull requests, `main` pushes, และ standalone manual CI dispatches จะปิด suite นั้นไว้ งานนี้กระจาย bundled plugin tests ไปยัง extension workers แปดตัว; extension shard jobs เหล่านั้นรัน plugin config groups ได้สูงสุดสองกลุ่มพร้อมกัน โดยใช้ Vitest worker หนึ่งตัวต่อกลุ่มและ Node heap ที่ใหญ่ขึ้น เพื่อให้ import-heavy plugin batches ไม่สร้าง CI jobs เพิ่ม path Docker prerelease แบบ release-only จะ batch targeted Docker lanes เป็นกลุ่มเล็ก ๆ เพื่อหลีกเลี่ยงการจอง runners หลายสิบตัวสำหรับ jobs ที่ใช้เวลาหนึ่งถึงสามนาที workflow ยัง upload artifact เชิงข้อมูล `plugin-inspector-advisory` จาก `@openclaw/plugin-inspector`; inspector findings เป็น input สำหรับ triage และไม่เปลี่ยน blocking Plugin Prerelease gate

## QA Lab

QA Lab มี CI lanes เฉพาะนอก main smart-scoped workflow Agentic parity ถูกซ้อนอยู่ใต้ QA และ release harnesses แบบกว้าง ไม่ใช่ standalone PR workflow ใช้ `Full Release Validation` พร้อม `rerun_group=qa-parity` เมื่อ parity ควรไปพร้อมกับ broad validation run

- workflow `QA-Lab - All Lanes` รัน nightly บน `main` และบน manual dispatch; งานนี้ fan out mock parity lane, live Matrix lane, และ live Telegram กับ Discord lanes เป็น parallel jobs Live jobs ใช้ environment `qa-live-shared` และ Telegram/Discord ใช้ Convex leases

Release checks รัน Matrix และ Telegram live transport lanes ด้วย deterministic mock provider และ mock-qualified models (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อแยก channel contract ออกจาก live model latency และ provider-plugin startup ปกติ live transport gateway ปิด memory search เพราะ QA parity ครอบคลุมพฤติกรรม memory แยกต่างหาก; provider connectivity ถูกครอบคลุมโดย separate live model, native provider, และ Docker provider suites

Matrix ใช้ `--profile fast` สำหรับ scheduled และ release gates โดยเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout รองรับ default ของ CLI และ manual workflow input ยังคงเป็น `all`; manual `matrix_profile=all` dispatch จะ shard full Matrix coverage เป็น jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรัน release-critical QA Lab lanes ก่อน release approval; QA parity gate ของงานนี้รัน candidate และ baseline packs เป็น parallel lane jobs จากนั้นดาวน์โหลด artifacts ทั้งคู่ลงใน report job ขนาดเล็กสำหรับ final parity comparison

สำหรับ PRs ปกติ ให้ใช้ scoped CI/check evidence แทนการถือว่า parity เป็น required status

## CodeQL

workflow `CodeQL` ตั้งใจให้เป็น first-pass security scanner แบบแคบ ไม่ใช่การ sweep repository ทั้งหมด Daily, manual, และ non-draft pull request guard runs จะ scan Actions workflow code พร้อมพื้นผิว JavaScript/TypeScript ที่มีความเสี่ยงสูงสุด ด้วย high-confidence security queries ที่ filter เป็น `security-severity` ระดับ high/critical

pull request guard ยังคงเบา: เริ่มเฉพาะการเปลี่ยนแปลงภายใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, หรือ `src` และรัน high-confidence security matrix เดียวกับ scheduled workflow Android และ macOS CodeQL ไม่อยู่ใน PR defaults

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                          | พื้นผิว                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, Cron และ Gateway baseline                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการใช้งาน implementation ของช่องทางหลัก รวมถึง channel Plugin runtime, Gateway, Plugin SDK, secrets และจุดสัมผัส audit              |
| `/codeql-security-high/network-ssrf-boundary`     | พื้นผิวนโยบาย SSRF ของ core SSRF, การแยกวิเคราะห์ IP, network guard, web-fetch และ Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, ตัวช่วย process execution, outbound delivery และเกตการ tool-execution ของ agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | พื้นผิวความน่าเชื่อถือของการติดตั้ง Plugin, loader, manifest, registry, การติดตั้ง package-manager, source-loading และสัญญาแพ็กเกจ Plugin SDK |

### ชาร์ดความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — ชาร์ดความปลอดภัย Android แบบกำหนดเวลา สร้างแอป Android ด้วยตนเองสำหรับ CodeQL บน Blacksmith Linux runner ที่เล็กที่สุดที่ workflow sanity ยอมรับ อัปโหลดภายใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — ชาร์ดความปลอดภัย macOS แบบรายสัปดาห์/ด้วยตนเอง สร้างแอป macOS ด้วยตนเองสำหรับ CodeQL บน Blacksmith macOS กรองผลลัพธ์การสร้าง dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดภายใต้ `/codeql-critical-security/macos` เก็บไว้นอกค่าเริ่มต้นรายวันเพราะการสร้าง macOS ใช้เวลารันมากแม้เมื่อไม่มีปัญหา

### หมวดหมู่คุณภาพวิกฤต

`CodeQL Critical Quality` คือชาร์ดที่ตรงกันในฝั่งที่ไม่ใช่ความปลอดภัย โดยรันเฉพาะคิวรีคุณภาพ JavaScript/TypeScript ที่มีระดับความรุนแรงเป็น error และไม่ใช่ความปลอดภัย บนพื้นผิวที่แคบแต่มีมูลค่าสูงบน GitHub-hosted Linux runners เพื่อให้การสแกนคุณภาพไม่ใช้โควตา runner-registration ของ Blacksmith เกต pull request ของชาร์ดนี้ตั้งใจให้เล็กกว่าโปรไฟล์แบบกำหนดเวลา: PR ที่ไม่ใช่ draft จะรันเฉพาะชาร์ด `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` ที่ตรงกัน สำหรับการเปลี่ยนแปลงโค้ดการรันคำสั่ง/model/tool ของ agent และการส่ง reply, โค้ด config schema/migration/IO, โค้ด auth/secrets/sandbox/security, core channel และ bundled channel Plugin runtime, Gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract หรือ Plugin SDK reply runtime การเปลี่ยนแปลง CodeQL config และ quality workflow จะรันชาร์ดคุณภาพของ PR ทั้งสิบสองชาร์ด

Manual dispatch รับค่า:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

โปรไฟล์แบบแคบเป็น hook สำหรับการสอน/การทำซ้ำเพื่อรันชาร์ดคุณภาพหนึ่งชาร์ดแยกเดี่ยว

| หมวดหมู่                                                | พื้นผิว                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ดขอบเขตความปลอดภัยของ Auth, secrets, sandbox, Cron และ Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Config schema, migration, normalization และสัญญา IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | สคีมา Gateway protocol และสัญญา server method                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญาการใช้งาน implementation ของ core channel และ bundled channel Plugin                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | สัญญา runtime ของ command execution, model/provider dispatch, auto-reply dispatch และ queues และ ACP control-plane                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP servers และ tool bridges, ตัวช่วย process supervision และสัญญา outbound delivery                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, memory Plugin SDK aliases, memory runtime activation glue และคำสั่ง memory doctor                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internals ของ reply queue, session delivery queues, ตัวช่วย outbound session binding/delivery, พื้นผิว diagnostic event/log bundle และสัญญา CLI ของ session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply dispatch, reply payload/chunking/runtime helpers, channel reply options, delivery queues และตัวช่วย session/thread binding             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Model catalog normalization, provider auth และ discovery, provider runtime registration, provider defaults/catalogs และ web/search/fetch/embedding registries    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap, local persistence, Gateway control flows และสัญญา task control-plane runtime                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | สัญญา runtime ของ core web fetch/search, media IO, media understanding, image-generation และ media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | สัญญา loader, registry, public-surface และ entrypoint ของ Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | ซอร์ส Plugin SDK ฝั่งแพ็กเกจที่เผยแพร่แล้ว และตัวช่วยสัญญาแพ็กเกจ Plugin                                                                                      |

คุณภาพถูกแยกจากความปลอดภัยเพื่อให้ findings ด้านคุณภาพสามารถถูกกำหนดเวลา วัด ปิดใช้งาน หรือขยายได้โดยไม่บดบังสัญญาณด้านความปลอดภัย ควรเพิ่มการขยาย CodeQL สำหรับ Swift, Python และ bundled-plugin กลับมาเป็นงานติดตามผลแบบ scoped หรือ sharded เท่านั้นหลังจากโปรไฟล์แบบแคบมี runtime และสัญญาณที่เสถียรแล้ว

## เวิร์กโฟลว์การบำรุงรักษา

### Docs Agent

เวิร์กโฟลว์ `Docs Agent` เป็นเลนบำรุงรักษา Codex ที่ขับเคลื่อนด้วยเหตุการณ์สำหรับทำให้เอกสารที่มีอยู่สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง landed ไม่มีตารางเวลาล้วน ๆ: การรัน CI จาก push ที่สำเร็จบน `main` โดยไม่ใช่บอทสามารถ trigger ได้ และ manual dispatch สามารถรันได้โดยตรง การเรียกผ่าน workflow-run จะข้ามเมื่อ `main` เดินหน้าไปแล้ว หรือเมื่อมีการรัน Docs Agent อื่นที่ไม่ถูกข้ามถูกสร้างขึ้นในชั่วโมงที่ผ่านมา เมื่อรันแล้ว จะตรวจสอบช่วง commit ตั้งแต่ source SHA ของ Docs Agent ที่ไม่ถูกข้ามครั้งก่อนจนถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงหนึ่งครั้งจึงครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมตั้งแต่การตรวจเอกสารครั้งล่าสุดได้

### Test Performance Agent

เวิร์กโฟลว์ `Test Performance Agent` เป็นเลนบำรุงรักษา Codex ที่ขับเคลื่อนด้วยเหตุการณ์สำหรับเทสต์ที่ช้า ไม่มีตารางเวลาล้วน ๆ: การรัน CI จาก push ที่สำเร็จบน `main` โดยไม่ใช่บอทสามารถ trigger ได้ แต่จะข้ามถ้ามีการเรียกผ่าน workflow-run อื่นที่รันไปแล้วหรือกำลังรันอยู่ในวัน UTC เดียวกัน Manual dispatch จะข้ามเกตกิจกรรมรายวันนี้ เลนนี้สร้างรายงานประสิทธิภาพ Vitest แบบ grouped ของ full-suite ให้ Codex ทำได้เฉพาะการแก้ไขประสิทธิภาพเทสต์ขนาดเล็กที่ยังรักษา coverage แทนการ refactor กว้าง ๆ จากนั้นรันรายงาน full-suite ซ้ำและปฏิเสธการเปลี่ยนแปลงที่ลดจำนวน baseline test ที่ผ่าน รายงานแบบ grouped จะบันทึก wall time ต่อ config และ max RSS บน Linux และ macOS ดังนั้นการเปรียบเทียบก่อน/หลังจะแสดงเดลตาหน่วยความจำของเทสต์ควบคู่กับเดลตาระยะเวลา ถ้า baseline มีเทสต์ที่ล้มเหลว Codex อาจแก้ได้เฉพาะความล้มเหลวที่ชัดเจน และรายงาน full-suite หลัง agent ต้องผ่านก่อนจึงจะ commit อะไรได้ เมื่อ `main` เดินหน้าไปก่อนที่ bot push จะ land เลนนี้จะ rebase patch ที่ตรวจสอบแล้ว รัน `pnpm check:changed` ซ้ำ และลอง push อีกครั้ง patch ที่เก่าและขัดแย้งกันจะถูกข้าม เลนนี้ใช้ GitHub-hosted Ubuntu เพื่อให้ Codex action คง posture ความปลอดภัยแบบ drop-sudo เดียวกับ docs agent ได้

### PR ซ้ำหลัง Merge

เวิร์กโฟลว์ `Duplicate PRs After Merge` เป็นเวิร์กโฟลว์ maintainer แบบ manual สำหรับล้าง duplicate หลัง land ค่าเริ่มต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุไว้อย่างชัดเจนเมื่อ `apply=true` ก่อนแก้ไข GitHub จะตรวจสอบว่า PR ที่ land แล้วถูก merge แล้ว และ duplicate แต่ละรายการมี referenced issue ร่วมกันหรือมี hunks ที่เปลี่ยนแปลงทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## เกตการตรวจในเครื่องและการ route การเปลี่ยนแปลง

ตรรกะ changed-lane ในเครื่องอยู่ใน `scripts/changed-lanes.mjs` และถูกเรียกใช้โดย `scripts/check-changed.mjs` เกตการตรวจในเครื่องนี้เข้มงวดกับขอบเขตสถาปัตยกรรมมากกว่าขอบเขตแพลตฟอร์ม CI แบบกว้าง:

- การเปลี่ยนแปลง core production รัน core prod และ core test typecheck รวมถึง core lint/guards;
- การเปลี่ยนแปลงเฉพาะ core test รันเฉพาะ core test typecheck รวมถึง core lint;
- การเปลี่ยนแปลง extension production รัน extension prod และ extension test typecheck รวมถึง extension lint;
- การเปลี่ยนแปลงเฉพาะ extension test รัน extension test typecheck รวมถึง extension lint;
- การเปลี่ยนแปลง public Plugin SDK หรือ plugin-contract จะขยายไปยัง extension typecheck เพราะ extensions พึ่งพาสัญญา core เหล่านั้น (Vitest extension sweeps ยังเป็นงานเทสต์ที่ต้องระบุชัดเจน);
- การ bump เวอร์ชันแบบ release metadata-only รัน targeted version/config/root-dependency checks;
- การเปลี่ยนแปลง root/config ที่ไม่รู้จักจะ fail safe ไปยัง check lanes ทั้งหมด

การ route changed-test ในเครื่องอยู่ใน `scripts/test-projects.test-support.mjs` และตั้งใจให้ถูกกว่า `check:changed`: การแก้ไขเทสต์โดยตรงจะรันตัวเอง การแก้ไขซอร์สจะเลือก explicit mappings ก่อน จากนั้นจึงเป็น sibling tests และ import-graph dependents Shared group-room delivery config เป็นหนึ่งใน explicit mappings: การเปลี่ยนแปลง group visible-reply config, source reply delivery mode หรือ message-tool system prompt จะ route ผ่าน core reply tests รวมถึง Discord และ Slack delivery regressions เพื่อให้การเปลี่ยนค่าเริ่มต้นร่วมกันล้มเหลวก่อน PR push ครั้งแรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างระดับ harness จนชุด mapped ราคาถูกไม่ใช่ proxy ที่น่าเชื่อถือ

## การตรวจสอบด้วย Testbox

Crabbox คือ remote-box wrapper ที่ repo เป็นเจ้าของสำหรับ proof บน Linux ของ maintainer ใช้จาก repo root เมื่อการตรวจสอบกว้างเกินไปสำหรับ local edit loop, เมื่อความเท่าเทียมกับ CI สำคัญ หรือเมื่อ proof ต้องใช้ secrets, Docker, package lanes, boxes ที่นำกลับมาใช้ซ้ำได้ หรือ remote logs backend ปกติของ OpenClaw คือ `blacksmith-testbox`; capacity บน AWS/Hetzner ที่เป็นเจ้าของเป็น fallback สำหรับ Blacksmith outages, ปัญหา quota หรือการทดสอบ explicit owned-capacity

การรัน Blacksmith ที่รองรับด้วย Crabbox จะวอร์ม, claim, ซิงค์, รัน, รายงาน และล้างข้อมูล
Testboxes แบบใช้ครั้งเดียว การตรวจสอบความสมเหตุสมผลของการซิงค์ในตัวจะล้มเหลวอย่างรวดเร็วเมื่อไฟล์
รูทที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short`
แสดงการลบไฟล์ที่ติดตามแล้วอย่างน้อย 200 รายการ สำหรับ PR ที่ตั้งใจลบไฟล์จำนวนมาก ให้ตั้งค่า
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับคำสั่งระยะไกล

Crabbox ยังยุติการเรียก Blacksmith CLI ในเครื่องที่ค้างอยู่ใน
เฟสซิงค์นานเกินห้านาทีโดยไม่มีเอาต์พุตหลังซิงค์ ตั้งค่า
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` เพื่อปิดการ์ดนั้น หรือใช้ค่า
มิลลิวินาทีที่มากขึ้นสำหรับ diff ในเครื่องที่มีขนาดใหญ่มากเป็นพิเศษ

ก่อนรันครั้งแรก ให้ตรวจสอบ wrapper จากรูทของ repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

wrapper ของ repo จะปฏิเสธไบนารี Crabbox ที่เก่าและไม่ได้ประกาศ `blacksmith-testbox` ส่ง provider อย่างชัดเจนแม้ว่า `.crabbox.yaml` จะมีค่าเริ่มต้นของ owned-cloud อยู่แล้ว ใน worktree ของ Codex หรือ checkout แบบ linked/sparse ให้หลีกเลี่ยงสคริปต์ `pnpm crabbox:run` ในเครื่อง เพราะ pnpm อาจปรับ dependencies ให้ตรงกันก่อนที่ Crabbox จะเริ่มทำงาน ให้เรียก node wrapper โดยตรงแทน:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

การรันที่รองรับด้วย Blacksmith ต้องใช้ Crabbox 0.22.0 หรือใหม่กว่า เพื่อให้ wrapper ได้พฤติกรรมการซิงค์ คิว และการล้างข้อมูล Testbox ปัจจุบัน เมื่อใช้ checkout พี่น้อง ให้ build ไบนารีในเครื่องที่ถูก ignore ใหม่ก่อนทำงานจับเวลาหรือพิสูจน์:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

changed gate:

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

รันการทดสอบเฉพาะจุดซ้ำ:

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

อ่านสรุป JSON สุดท้าย ฟิลด์ที่มีประโยชน์คือ `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` และ `totalMs` สำหรับการรัน
Blacksmith Testbox แบบ delegated รหัสออกของ Crabbox wrapper และสรุป JSON คือ
ผลลัพธ์ของคำสั่ง การรัน GitHub Actions ที่ลิงก์อยู่เป็นเจ้าของ hydration และ keepalive ซึ่ง
อาจจบเป็น `cancelled` ได้เมื่อ Testbox ถูกหยุดจากภายนอกหลังจากคำสั่ง SSH
ส่งคืนแล้ว ให้ถือว่านั่นเป็นอาร์ติแฟกต์การล้างข้อมูล/สถานะ เว้นแต่
`exitCode` ของ wrapper จะไม่เป็นศูนย์ หรือเอาต์พุตคำสั่งแสดงว่าการทดสอบล้มเหลว
การรัน Crabbox ที่รองรับด้วย Blacksmith แบบใช้ครั้งเดียวควรหยุด Testbox โดยอัตโนมัติ
หากการรันถูกขัดจังหวะหรือการล้างข้อมูลไม่ชัดเจน ให้ตรวจสอบกล่องที่ live อยู่และหยุดเฉพาะ
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

หาก Crabbox เป็นชั้นที่เสีย แต่ Blacksmith เองยังทำงาน ให้ใช้
Blacksmith โดยตรงเฉพาะสำหรับการวินิจฉัย เช่น `list`, `status` และการล้างข้อมูล แก้ไข
เส้นทาง Crabbox ก่อนถือว่าการรัน Blacksmith โดยตรงเป็นหลักฐานของ maintainer

หาก `blacksmith testbox list --all` และ `blacksmith testbox status` ทำงาน แต่ warmup ใหม่
ค้างอยู่ที่ `queued` โดยไม่มี IP หรือ URL การรัน Actions หลังผ่านไปสองสามนาที
ให้ถือว่าเป็นแรงกดดันจาก provider, คิว, billing หรือขีดจำกัด org ของ Blacksmith หยุด
id ที่ queued ซึ่งคุณสร้างไว้ หลีกเลี่ยงการเริ่ม Testboxes เพิ่ม และย้ายหลักฐานไปยัง
เส้นทาง capacity ของ Crabbox ที่เป็นเจ้าของด้านล่าง ระหว่างที่มีคนตรวจสอบ dashboard,
billing และขีดจำกัด org ของ Blacksmith

ยกระดับไปยัง capacity ของ Crabbox ที่เป็นเจ้าของเฉพาะเมื่อ Blacksmith ล่ม, ถูกจำกัด quota, ไม่มีสภาพแวดล้อมที่จำเป็น หรือ capacity ที่เป็นเจ้าของคือเป้าหมายอย่างชัดเจน:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

ภายใต้แรงกดดันของ AWS ให้หลีกเลี่ยง `class=beast` เว้นแต่งานนั้นต้องการ CPU ระดับ 48xlarge จริงๆ คำขอ `beast` เริ่มต้นที่ 192 vCPU และเป็นวิธีที่ง่ายที่สุดในการชน quota ระดับภูมิภาคของ EC2 Spot หรือ On-Demand Standard ค่าเริ่มต้น `.crabbox.yaml` ที่ repo เป็นเจ้าของคือ `standard`, หลายภูมิภาค capacity และ `capacity.hints: true` เพื่อให้ lease ของ AWS ที่ brokered พิมพ์ region/market ที่เลือก, แรงกดดัน quota, fallback ของ Spot และคำเตือน class ที่มีแรงกดดันสูง ใช้ `fast` สำหรับการตรวจสอบกว้างที่หนักกว่า ใช้ `large` เฉพาะหลังจาก standard/fast ไม่พอ และใช้ `beast` เฉพาะสำหรับ lane ที่ผูกกับ CPU เป็นกรณีพิเศษ เช่น full-suite หรือเมทริกซ์ Docker ของทุก Plugin, การตรวจสอบ release/blocker ที่ชัดเจน หรือการทำ profiling ประสิทธิภาพแบบ high-core อย่าใช้ `beast` สำหรับ `pnpm check:changed`, การทดสอบเฉพาะจุด, งาน docs-only, lint/typecheck ทั่วไป, การ repro E2E ขนาดเล็ก หรือการ triage เหตุ Blacksmith ล่ม ใช้ `--market on-demand` สำหรับการวินิจฉัย capacity เพื่อไม่ให้ความผันผวนของตลาด Spot ปนเข้ากับสัญญาณ

`.crabbox.yaml` เป็นเจ้าของค่าเริ่มต้น provider, sync และ hydration ของ GitHub Actions สำหรับ lane owned-cloud โดยจะ exclude `.git` ในเครื่อง เพื่อให้ checkout ของ Actions ที่ hydrated เก็บ metadata Git ระยะไกลของตัวเองแทนการซิงค์ remote และ object store ในเครื่องของ maintainer และยัง exclude อาร์ติแฟกต์ runtime/build ในเครื่องที่ไม่ควรถูกถ่ายโอนเลย `.github/workflows/crabbox-hydrate.yml` เป็นเจ้าของ checkout, การตั้งค่า Node/pnpm, การ fetch `origin/main` และการส่งต่อสภาพแวดล้อมที่ไม่ใช่ secret สำหรับคำสั่ง owned-cloud `crabbox run --id <cbx_id>`

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
