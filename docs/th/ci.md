---
read_when:
    - คุณต้องเข้าใจว่าเหตุใดงาน CI จึงทำงานหรือไม่ทำงาน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการรันหรือรันซ้ำเพื่อตรวจสอบความถูกต้องของรีลีส
    - คุณกำลังเปลี่ยนการ dispatch ของ ClawSweeper หรือการส่งต่อกิจกรรม GitHub
summary: กราฟงาน CI, เกตขอบเขต, งานครอบคลุมการเผยแพร่, และคำสั่งเทียบเท่าในเครื่อง
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-06-30T14:29:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 885202dd0f52b237e93a520999ac98ef3ad0fc1f8a03ccaceae9d38a2a4aca3b
    source_path: ci.md
    workflow: 16
---

OpenClaw CI ทำงานในทุกการ push ไปยัง `main` และทุก pull request การ push ไปยัง `main` แบบ canonical จะผ่านหน้าต่างรับงาน hosted-runner 90 วินาทีก่อน กลุ่ม concurrency `CI` ที่มีอยู่จะยกเลิก run ที่กำลังรอนั้นเมื่อมี commit ใหม่กว่าเข้ามา ดังนั้นการ merge ต่อเนื่องกันจะไม่ลงทะเบียน matrix ของ Blacksmith แบบเต็มทุกครั้ง Pull request และ manual dispatch จะข้ามการรอ งาน `preflight` จะจัดประเภท diff แล้วปิด lane ที่มีค่าใช้จ่ายสูงเมื่อมีเพียงพื้นที่ที่ไม่เกี่ยวข้องเปลี่ยนแปลง การ run แบบ manual `workflow_dispatch` จงใจข้าม smart scoping และกระจายงานเป็นกราฟเต็มสำหรับ release candidate และการตรวจสอบความถูกต้องแบบกว้าง lane ของ Android ยังคงเป็นแบบ opt-in ผ่าน `include_android` coverage ของ Plugin สำหรับ release เท่านั้นอยู่ใน workflow [`Plugin ก่อนเผยแพร่`](#plugin-prerelease) แยกต่างหาก และจะทำงานจาก [`การตรวจสอบความถูกต้องของ Release แบบเต็ม`](#full-release-validation) หรือ explicit manual dispatch เท่านั้น

## ภาพรวม Pipeline

| งาน                                | วัตถุประสงค์                                                                                                   | ทำงานเมื่อ                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | ตรวจจับการเปลี่ยนแปลงเฉพาะเอกสาร scope ที่เปลี่ยนแปลง extension ที่เปลี่ยนแปลง และสร้าง manifest ของ CI                   | เสมอบน push และ PR ที่ไม่ใช่ draft                  |
| `runner-admission`                 | debounce 90 วินาทีบน hosted runner สำหรับการ push ไปยัง `main` แบบ canonical ก่อนลงทะเบียนงาน Blacksmith                | ทุก CI run; sleep เฉพาะบนการ push ไปยัง `main` แบบ canonical |
| `security-fast`                    | การตรวจจับ private key, audit workflow ที่เปลี่ยนผ่าน `zizmor`, และ audit lockfile สำหรับ production                 | เสมอบน push และ PR ที่ไม่ใช่ draft                  |
| `check-dependencies`               | pass สำหรับ dependency-only ของ Knip ฝั่ง production พร้อม guard allowlist ของไฟล์ที่ไม่ได้ใช้                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `build-artifacts`                  | build `dist/`, Control UI, smoke check ของ built-CLI, check artifact ที่ build แล้วแบบฝังตัว, และ artifact ที่ใช้ซ้ำได้ | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-fast-core`                 | lane ความถูกต้องบน Linux แบบเร็ว เช่น bundled, protocol, QA Smoke CI, และ check การ routing ของ CI                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-fast-contracts-plugins-*`  | check สัญญาของ Plugin แบบแบ่ง shard สองชุด                                                                        | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-fast-contracts-channels-*` | check สัญญาของ channel แบบแบ่ง shard สองชุด                                                                       | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-node-core-*`               | shard ทดสอบ Node core โดยไม่รวม lane ของ channel, bundled, contract, และ extension                          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `check-*`                          | เทียบเท่า gate local หลักแบบแบ่ง shard: type ฝั่ง prod, lint, guard, test type, และ strict smoke                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `check-additional-*`               | สถาปัตยกรรม, boundary/prompt drift แบบแบ่ง shard, guard ของ extension, boundary ของ package, และ topology ของ runtime     | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-node-compat-node22`        | lane build และ smoke สำหรับความเข้ากันได้กับ Node 22                                                                | manual CI dispatch สำหรับ release                     |
| `check-docs`                       | การจัดรูปแบบเอกสาร, lint, และ check ลิงก์เสีย                                                             | เอกสารเปลี่ยนแปลง                                        |
| `skills-python`                    | Ruff + pytest สำหรับ Skills ที่มี Python หนุนหลัง                                                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python skill                       |
| `checks-windows`                   | การทดสอบ process/path เฉพาะ Windows พร้อม regression ของ runtime import specifier ที่ใช้ร่วมกัน                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows                            |
| `macos-node`                       | lane ทดสอบ TypeScript บน macOS โดยใช้ artifact ที่ build แล้วร่วมกัน                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS                              |
| `macos-swift`                      | Swift lint, build, และการทดสอบสำหรับแอป macOS                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS                              |
| `ios-build`                        | การสร้างโปรเจกต์ Xcode พร้อม build แอป iOS บน simulator                                                 | แอป iOS, app kit ที่ใช้ร่วมกัน, หรือการเปลี่ยนแปลงของ Swabble         |
| `android`                          | unit test ของ Android สำหรับทั้งสอง flavor พร้อม build debug APK หนึ่งชุด                                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android                            |
| `test-performance-agent`           | การปรับแต่ง slow-test ของ Codex รายวันหลังจากกิจกรรมที่เชื่อถือได้                                                 | main CI สำเร็จหรือ manual dispatch                  |
| `openclaw-performance`             | รายงาน performance ของ Kova runtime รายวัน/ตามคำขอ พร้อม lane mock-provider, deep-profile, และ GPT 5.5 live | ตาม schedule และ manual dispatch                       |

## ลำดับ Fail-fast

1. `runner-admission` รอเฉพาะการ push ไปยัง `main` แบบ canonical; push ที่ใหม่กว่าจะยกเลิก run ก่อนการลงทะเบียน Blacksmith
2. `preflight` ตัดสินใจว่า lane ใดจะมีอยู่บ้าง logic `docs-scope` และ `changed-scope` เป็น step ภายในงานนี้ ไม่ใช่งานแยกต่างหาก
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, และ `skills-python` fail อย่างรวดเร็วโดยไม่ต้องรอ matrix job ที่หนักกว่าด้าน artifact และ platform
4. `build-artifacts` ทำงานทับซ้อนกับ lane Linux แบบเร็ว เพื่อให้ consumer ปลายทางเริ่มได้ทันทีที่ build ที่ใช้ร่วมกันพร้อม
5. lane ที่หนักกว่าด้าน platform และ runtime จะ fan out หลังจากนั้น: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, และ `android`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่เป็น `cancelled` เมื่อมี push ใหม่กว่าเข้ามาบน PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่าเป็น noise ของ CI เว้นแต่ run ล่าสุดสำหรับ ref เดียวกันก็ fail ด้วย Matrix job ใช้ `fail-fast: false` และ `build-artifacts` รายงาน failure ของ embedded channel, core-support-boundary, และ gateway-watch โดยตรงแทนการ queue งาน verifier ขนาดเล็ก key concurrency อัตโนมัติของ CI มี version (`CI-v7-*`) เพื่อให้ zombie ฝั่ง GitHub ในกลุ่ม queue เก่าไม่สามารถ block run ใหม่กว่าบน main ได้ไม่มีกำหนด การ run full-suite แบบ manual ใช้ `CI-manual-v1-*` และไม่ยกเลิก run ที่กำลังดำเนินอยู่

ใช้ `pnpm ci:timings`, `pnpm ci:timings:recent`, หรือ `node scripts/ci-run-timings.mjs <run-id>` เพื่อสรุป wall time, queue time, งานที่ช้าที่สุด, failure, และ barrier fanout `pnpm-store-warmup` จาก GitHub Actions CI ยัง upload สรุป run เดียวกันเป็น artifact `ci-timings-summary` ด้วย สำหรับ timing ของ build ให้ดู step `Build dist` ของงาน `build-artifacts`: `pnpm build:ci-artifacts` พิมพ์ `[build-all] phase timings:` และรวม `ui:build`; งานนี้ยัง upload artifact `startup-memory` ด้วย

สำหรับ run ของ pull request งาน terminal timing-summary จะ run helper จาก revision ฐานที่เชื่อถือได้ก่อนส่ง `GH_TOKEN` ให้ `gh run view` สิ่งนี้กัน query ที่มี token ออกจาก code ที่ branch ควบคุม ขณะที่ยังสรุป CI run ปัจจุบันของ pull request ได้

## บริบทและหลักฐานของ PR

PR จาก contributor ภายนอกจะ run gate บริบทและหลักฐานของ PR จาก `.github/workflows/real-behavior-proof.yml` workflow จะ checkout commit ฐานที่เชื่อถือได้และประเมินเฉพาะ body ของ PR; จะไม่ execute code จาก branch ของ contributor

gate นี้ใช้กับผู้เขียน PR ที่ไม่ใช่เจ้าของ repository, member, collaborator, หรือ bot โดยจะผ่านเมื่อ body ของ PR มี section `What Problem This Solves` และ `Evidence` ที่เขียนโดยผู้เขียน Evidence อาจเป็นการทดสอบแบบเจาะจง, ผล CI, screenshot, recording, terminal output, live observation, log ที่ redacted, หรือลิงก์ artifact body ให้ intent และการตรวจสอบความถูกต้องที่มีประโยชน์; reviewer จะตรวจ code, tests, และ CI เพื่อประเมินความถูกต้อง

เมื่อ check fail ให้ update body ของ PR แทนการ push code commit อีกครั้ง

## Scope และการ routing

logic ของ scope อยู่ใน `scripts/ci-changed-scope.mjs` และมี unit test ครอบคลุมใน `src/scripts/ci-changed-scope.test.ts` Manual dispatch จะข้ามการตรวจจับ changed-scope และทำให้ preflight manifest ทำตัวเสมือนว่าทุกพื้นที่ที่มี scope เปลี่ยนแปลง

- **การแก้ไข CI workflow** ตรวจสอบ graph ของ Node CI พร้อม workflow linting แต่ไม่บังคับให้ build native ของ Windows, iOS, Android, หรือ macOS ด้วยตัวเอง; lane ของ platform เหล่านั้นยังคง scoped ตามการเปลี่ยนแปลง source ของ platform
- **Workflow Sanity** run `actionlint`, `zizmor` เหนือไฟล์ workflow YAML ทั้งหมด, guard การ interpolation ของ composite-action, และ guard conflict-marker งาน `security-fast` ที่ scoped ตาม PR ยัง run `zizmor` เหนือไฟล์ workflow ที่เปลี่ยน เพื่อให้ findings ด้านความปลอดภัยของ workflow fail ตั้งแต่ต้นใน graph หลักของ CI
- **เอกสารบนการ push ไปยัง `main`** ถูกตรวจโดย workflow `Docs` แบบ standalone ด้วย mirror เอกสาร ClawHub เดียวกับที่ CI ใช้ ดังนั้น push แบบ code+docs ผสมกันจะไม่ queue shard `check-docs` ของ CI เพิ่มอีก Pull request และ manual CI ยัง run `check-docs` จาก CI เมื่อเอกสารเปลี่ยนแปลง
- **TUI PTY** ทำงานใน shard Linux Node `checks-node-core-runtime-tui-pty` สำหรับการเปลี่ยนแปลง TUI shard นี้ run `test/vitest/vitest.tui-pty.config.ts` ด้วย `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` ดังนั้นจึงครอบคลุมทั้ง lane fixture `TuiBackend` ที่ deterministic และ smoke `tui --local` ที่ช้ากว่าซึ่ง mock เฉพาะ endpoint ของโมเดลภายนอก
- **การแก้ไขเฉพาะ CI routing, การแก้ไข fixture core-test ราคาถูกบางรายการ, และการแก้ไข helper/test-routing ของสัญญา Plugin แบบแคบ** ใช้ path manifest แบบ Node-only ที่เร็ว: `preflight`, security, และ task `checks-fast-core` เดียว path นั้นข้าม build artifact, ความเข้ากันได้กับ Node 22, สัญญา channel, shard core แบบเต็ม, shard bundled-plugin, และ matrix guard เพิ่มเติม เมื่อการเปลี่ยนแปลงจำกัดอยู่เฉพาะพื้นผิว routing หรือ helper ที่ task แบบเร็ว exercise โดยตรง
- **check ของ Windows Node** scoped กับ wrapper process/path เฉพาะ Windows, helper runner ของ npm/pnpm/UI, config ของ package manager, และพื้นผิว CI workflow ที่ execute lane นั้น; การเปลี่ยนแปลง source, Plugin, install-smoke, และ test-only ที่ไม่เกี่ยวข้องยังคงอยู่บน lane Linux Node

แฟมิลีการทดสอบ Node ที่ช้าที่สุดถูกแยกหรือถ่วงสมดุลเพื่อให้แต่ละงานมีขนาดเล็กโดยไม่จอง runner เกินจำเป็น: สัญญา Plugin และสัญญาช่องทางต่างรันเป็น shard แบบถ่วงน้ำหนักที่รองรับโดย Blacksmith สองชุดพร้อม fallback runner มาตรฐานของ GitHub, เลน core unit fast/support รันแยกกัน, โครงสร้างพื้นฐาน core runtime ถูกแยกระหว่าง state, process/config, shared และ shard โดเมน cron สามชุด, auto-reply รันเป็น worker แบบสมดุล (โดยแยกทรีย่อย reply เป็น shard agent-runner, dispatch และ commands/state-routing) และการตั้งค่า agentic gateway/server ถูกแยกตามเลน chat/auth/model/http-plugin/runtime/startup แทนการรอ artifact ที่ build แล้ว จากนั้น CI ปกติจะบรรจุเฉพาะ shard แบบ include-pattern ของโครงสร้างพื้นฐานที่แยกโดดเดี่ยวเข้าเป็นชุดแบบกำหนดแน่นอนที่มีไฟล์ทดสอบไม่เกิน 64 ไฟล์ ลดเมทริกซ์ Node โดยไม่รวมชุด non-isolated command/cron, stateful agents-core หรือ gateway/server เข้าด้วยกัน; ชุดทดสอบคงที่ที่หนักยังอยู่บน 8 vCPU ส่วนเลนที่ถูกบรรจุเป็นชุดและเลนน้ำหนักต่ำกว่าใช้ 4 vCPU Pull request บนรีโพซิทอรีหลักใช้แผนรับเข้าแบบกะทัดรัดเพิ่มเติม: กลุ่มต่อ config เดิมรันใน subprocess แบบแยกโดดเดี่ยวภายในแผน Linux Node ปัจจุบัน 34 งาน ดังนั้น PR เดียวจะไม่ลงทะเบียนเมทริกซ์ Node เต็มรูปแบบมากกว่า 70 งาน การ push ไปยัง `main`, manual dispatch และ release gate ยังคงใช้เมทริกซ์เต็ม ชุดทดสอบ browser, QA, media และ Plugin เบ็ดเตล็ดขนาดกว้างใช้ config Vitest เฉพาะของตนแทน catch-all Plugin ที่ใช้ร่วมกัน shard แบบ include-pattern บันทึกรายการเวลาโดยใช้ชื่อ shard ของ CI ดังนั้น `.artifacts/vitest-shard-timings.json` จึงแยกความแตกต่างระหว่าง config ทั้งชุดกับ shard ที่ถูกกรองได้ `check-additional-*` จัดงาน compile/canary ขอบเขต package ไว้ด้วยกัน และแยกสถาปัตยกรรม topology ของ runtime ออกจาก coverage การเฝ้าดู Gateway; รายการ boundary guard ถูกแบ่งเป็น shard ที่หนักด้าน prompt หนึ่งชุดและ shard รวมหนึ่งชุดสำหรับ guard stripe ที่เหลือ โดยแต่ละชุดรัน guard อิสระที่เลือกไว้พร้อมกันและพิมพ์เวลาแยกตามแต่ละ check การตรวจจับ drift ของ prompt snapshot เส้นทางปกติของ Codex ที่มีค่าใช้จ่ายสูงรันเป็นงานเพิ่มเติมของตัวเองสำหรับ CI แบบ manual และสำหรับการเปลี่ยนแปลงที่กระทบ prompt เท่านั้น ดังนั้นการเปลี่ยนแปลง Node ปกติที่ไม่เกี่ยวข้องจะไม่ต้องรอหลังการสร้าง prompt snapshot แบบ cold และ shard ขอบเขตยังคงสมดุล ขณะที่ prompt drift ยังคงถูกผูกกับ PR ที่ทำให้เกิด drift นั้น; flag เดียวกันข้ามการสร้าง prompt snapshot Vitest ภายใน shard core support-boundary ของ artifact ที่ build แล้ว Gateway watch, การทดสอบช่องทาง และ shard core support-boundary รันพร้อมกันภายใน `build-artifacts` หลังจาก `dist/` และ `dist-runtime/` ถูก build แล้ว

เมื่อรับเข้าแล้ว CI บน Linux ของรีโพซิทอรีหลักอนุญาตงานทดสอบ Node พร้อมกันได้สูงสุด 24 งาน และ
12 งานสำหรับเลน fast/check ที่เล็กกว่า; Windows และ Android ยังคงอยู่ที่สองเพราะ
พูล runner เหล่านั้นแคบกว่า

แผน PR แบบกะทัดรัดปล่อยงาน Node 18 งานสำหรับชุดปัจจุบัน: กลุ่ม whole-config
ถูก batch ใน subprocess แบบแยกโดดเดี่ยวพร้อม timeout ของ batch 120 นาที
ขณะที่กลุ่ม include-pattern ใช้งบงานที่จำกัดชุดเดียวกัน

CI ของ Android รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` แล้วจึง build APK แบบ Play debug flavor ของ third-party ไม่มี source set หรือ manifest แยกต่างหาก; เลน unit-test ของมันยังคง compile flavor พร้อม flag BuildConfig ของ SMS/call-log ขณะเดียวกันก็หลีกเลี่ยงงาน packaging APK แบบ debug ซ้ำในทุก push ที่เกี่ยวข้องกับ Android

shard `check-dependencies` รัน `pnpm deadcode:dependencies` (pass เฉพาะ dependency ของ Knip สำหรับ production ที่ตรึงกับเวอร์ชัน Knip ล่าสุด โดยปิดอายุ release ขั้นต่ำของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบผล unused-file สำหรับ production ของ Knip กับ `scripts/deadcode-unused-files.allowlist.mjs` guard unused-file จะล้มเหลวเมื่อ PR เพิ่มไฟล์ที่ไม่ได้ใช้งานใหม่ซึ่งยังไม่ได้ review หรือปล่อย entry ใน allowlist ที่ค้างอยู่ไว้ ขณะเดียวกันยังคงรักษาพื้นผิว dynamic Plugin, generated, build, live-test และ package bridge ที่ตั้งใจไว้ซึ่ง Knip ไม่สามารถ resolve แบบ statically ได้

## การส่งต่อกิจกรรมของ ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` คือสะพานฝั่งเป้าหมายจากกิจกรรมของรีโพซิทอรี OpenClaw ไปยัง ClawSweeper มันไม่ checkout หรือ execute โค้ด pull request ที่ไม่น่าเชื่อถือ workflow สร้าง token ของ GitHub App จาก `CLAWSWEEPER_APP_PRIVATE_KEY` แล้ว dispatch payload `repository_dispatch` แบบกะทัดรัดไปยัง `openclaw/clawsweeper`

workflow มีสี่เลน:

- `clawsweeper_item` สำหรับคำขอ review issue และ pull request แบบเจาะจง;
- `clawsweeper_comment` สำหรับคำสั่ง ClawSweeper แบบชัดเจนใน comment ของ issue;
- `clawsweeper_commit_review` สำหรับคำขอ review ระดับ commit บนการ push ไปยัง `main`;
- `github_activity` สำหรับกิจกรรม GitHub ทั่วไปที่ agent ของ ClawSweeper อาจตรวจสอบ

เลน `github_activity` ส่งต่อเฉพาะ metadata ที่ normalize แล้ว: event type, action, actor, repository, item number, URL, title, state และ excerpt สั้นสำหรับ comment หรือ review เมื่อมี โดยตั้งใจหลีกเลี่ยงการส่งต่อ body ของ Webhook แบบเต็ม workflow ฝั่งรับใน `openclaw/clawsweeper` คือ `.github/workflows/github-activity.yml` ซึ่ง post event ที่ normalize แล้วไปยัง hook ของ OpenClaw Gateway สำหรับ agent ของ ClawSweeper

กิจกรรมทั่วไปเป็นการสังเกต ไม่ใช่การส่งโดยค่าเริ่มต้น agent ของ ClawSweeper ได้รับเป้าหมาย Discord ใน prompt และควร post ไปที่ `#clawsweeper` เฉพาะเมื่อ event นั้นน่าประหลาดใจ, ดำเนินการได้, มีความเสี่ยง หรือมีประโยชน์เชิงปฏิบัติการ การเปิด, แก้ไข, bot churn, เสียงรบกวนจาก Webhook ซ้ำ และ traffic การ review ปกติควรให้ผลเป็น `NO_REPLY`

ให้ถือ title, comment, body, ข้อความ review, ชื่อ branch และข้อความ commit ของ GitHub เป็นข้อมูลที่ไม่น่าเชื่อถือตลอดเส้นทางนี้ สิ่งเหล่านี้เป็น input สำหรับการสรุปและ triage ไม่ใช่คำสั่งสำหรับ workflow หรือ runtime ของ agent

## Manual dispatches

Manual CI dispatch รัน job graph เดียวกับ CI ปกติ แต่บังคับเปิดเลน scoped ที่ไม่ใช่ Android ทั้งหมด: Linux Node shard, bundled-plugin shard, shard สัญญา Plugin และช่องทาง, ความเข้ากันได้ของ Node 22, `check-*`, `check-additional-*`, smoke check ของ artifact ที่ build แล้ว, docs check, Python skills, Windows, macOS, iOS build และ Control UI i18n Standalone manual CI dispatch รัน Android เท่านั้นด้วย `include_android=true`; release umbrella แบบเต็มเปิดใช้ Android โดยส่ง `include_android=true` Plugin prerelease static check, shard `agentic-plugins` เฉพาะ release, batch sweep ส่วนขยายแบบเต็ม และเลน Docker สำหรับ Plugin prerelease ถูกแยกออกจาก CI ชุด Docker prerelease รันเฉพาะเมื่อ `Full Release Validation` dispatch workflow `Plugin Prerelease` แยกต่างหากโดยเปิด gate release-validation

การรันแบบ manual ใช้ concurrency group ที่ไม่ซ้ำกัน เพื่อให้ชุดเต็มของ release-candidate ไม่ถูกยกเลิกโดยการ push หรือ PR อื่นบน ref เดียวกัน input `target_ref` ที่เป็น optional อนุญาตให้ caller ที่เชื่อถือได้รัน graph นั้นกับ branch, tag หรือ full commit SHA ขณะใช้ไฟล์ workflow จาก dispatch ref ที่เลือก

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                          | งาน                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Manual CI dispatch และ fallback ของรีโพซิทอรีที่ไม่ใช่ canonical, การสแกนคุณภาพ CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow docs นอก CI และ preflight install-smoke เพื่อให้เมทริกซ์ Blacksmith เข้าคิวได้เร็วขึ้น                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shard ส่วนขยายน้ำหนักต่ำกว่า, `checks-fast-core`, shard สัญญา Plugin/ช่องทาง, shard Linux Node ส่วนใหญ่ที่เป็น bundled/น้ำหนักต่ำกว่า, `check-guards`, `check-prod-types`, `check-test-types`, shard `check-additional-*` บางรายการ และ `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | ชุด Linux Node หนักที่คงไว้, shard `check-additional-*` ที่หนักด้าน boundary/extension และ `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (ไวต่อ CPU มากพอที่ 8 vCPU มีต้นทุนมากกว่าประโยชน์ที่ประหยัดได้); Docker build ของ install-smoke (เวลาเข้าคิว 32-vCPU มีต้นทุนมากกว่าประโยชน์ที่ประหยัดได้)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` บน `openclaw/openclaw`; fork fallback ไปที่ `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` และ `ios-build` บน `openclaw/openclaw`; fork fallback ไปที่ `macos-26`                                                                                                                                                                                                  |

## งบการลงทะเบียน Runner

bucket การลงทะเบียน GitHub runner ปัจจุบันของ OpenClaw รายงาน self-hosted
runner registrations 10,000 รายการต่อ 5 นาทีใน `ghx api rate_limit` ตรวจสอบ
`actions_runner_registration` ซ้ำก่อนการปรับจูนแต่ละครั้ง เพราะ GitHub อาจเปลี่ยน
bucket นี้ได้ limit นี้ถูกใช้ร่วมกันโดยการลงทะเบียน Blacksmith runner ทั้งหมดใน
องค์กร `openclaw` ดังนั้นการเพิ่มการติดตั้ง Blacksmith อีกชุดจะไม่เพิ่ม
bucket ใหม่

ให้ถือ label ของ Blacksmith เป็นทรัพยากรที่ขาดแคลนสำหรับการควบคุม burst งานที่
มีหน้าที่เพียง route, notify, summarize, เลือก shard หรือรันการสแกน CodeQL สั้น ๆ ควร
อยู่บน runner ที่ host โดย GitHub เว้นแต่จะมีความต้องการเฉพาะ Blacksmith ที่วัดได้
เมทริกซ์ Blacksmith ใหม่, `max-parallel` ที่ใหญ่ขึ้น หรือ workflow ความถี่สูงใด ๆ
ต้องแสดงจำนวนการลงทะเบียนกรณีเลวร้ายที่สุดและรักษาเป้าหมายระดับ org ให้อยู่ต่ำกว่า
ประมาณ 60% ของ bucket สด ด้วย bucket ปัจจุบัน 10,000 registrations
หมายถึงเป้าหมายการดำเนินงาน 6,000 registrations โดยเหลือพื้นที่สำหรับ
รีโพซิทอรีที่รันพร้อมกัน, retry และ burst overlap

CI ของรีโพซิทอรีหลักยังคงใช้ Blacksmith เป็นเส้นทาง runner ค่าเริ่มต้นสำหรับการรัน push และ pull-request ปกติ `workflow_dispatch` และการรันของรีโพซิทอรีที่ไม่ใช่ canonical ใช้ runner ที่ host โดย GitHub แต่การรัน canonical ปกติในปัจจุบันยังไม่ probe สุขภาพคิวของ Blacksmith หรือ fallback อัตโนมัติไปยัง label ที่ host โดย GitHub เมื่อ Blacksmith ใช้งานไม่ได้

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

`OpenClaw Performance` คือเวิร์กโฟลว์ประสิทธิภาพของผลิตภัณฑ์/รันไทม์ โดยทำงานทุกวันบน `main` และสามารถสั่งรันด้วยตนเองได้:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

การสั่งรันด้วยตนเองโดยปกติจะวัดประสิทธิภาพของ workflow ref ตั้งค่า `target_ref` เพื่อวัดประสิทธิภาพของแท็กรีลีสหรือแบรนช์อื่นด้วยการใช้งานเวิร์กโฟลว์ปัจจุบัน พาธรายงานที่เผยแพร่และตัวชี้ล่าสุดจะถูกผูกกับ ref ที่ทดสอบ และ `index.md` แต่ละไฟล์จะบันทึก ref/SHA ที่ทดสอบ, workflow ref/SHA, Kova ref, โปรไฟล์, โหมดการตรวจสอบสิทธิ์ของเลน, โมเดล, จำนวนครั้งที่ทำซ้ำ และตัวกรองสถานการณ์

เวิร์กโฟลว์ติดตั้ง OCM จากรีลีสที่ปักหมุดไว้ และ Kova จาก `openclaw/Kova` ที่อินพุต `kova_ref` ที่ปักหมุดไว้ จากนั้นรันสามเลน:

- `mock-provider`: สถานการณ์วินิจฉัยของ Kova กับรันไทม์ที่บิลด์ในเครื่อง พร้อมการตรวจสอบสิทธิ์ปลอมที่เข้ากันได้กับ OpenAI แบบกำหนดผลลัพธ์ได้
- `mock-deep-profile`: การทำโปรไฟล์ CPU/heap/trace สำหรับจุดร้อนของการเริ่มต้น, Gateway และเทิร์นของเอเจนต์
- `live-openai-candidate`: เทิร์นเอเจนต์ OpenAI `openai/gpt-5.5` จริง ซึ่งจะข้ามเมื่อไม่มี `OPENAI_API_KEY`

เลน mock-provider ยังรันโพรบซอร์สที่เป็นเนทีฟของ OpenClaw หลังจาก Kova pass: เวลาและหน่วยความจำในการบูต Gateway ในกรณีเริ่มต้นแบบค่าเริ่มต้น, hook และ 50 Plugin; RSS ของการนำเข้า Plugin ที่บันเดิลมา, ลูป hello ของ `channel-chat-baseline` แบบ mock-OpenAI ซ้ำ, คำสั่งเริ่มต้น CLI กับ Gateway ที่บูตแล้ว และโพรบประสิทธิภาพ smoke ของสถานะ SQLite เมื่อรายงานซอร์ส mock-provider ที่เผยแพร่ก่อนหน้ามีอยู่สำหรับ ref ที่ทดสอบ สรุปซอร์สจะเปรียบเทียบค่า RSS และ heap ปัจจุบันกับ baseline นั้น และทำเครื่องหมายการเพิ่มขึ้นของ RSS ขนาดใหญ่เป็น `watch` สรุป Markdown ของโพรบซอร์สอยู่ที่ `source/index.md` ในชุดรายงาน พร้อม JSON ดิบข้างกัน

ทุกเลนอัปโหลดอาร์ติแฟกต์ GitHub เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว เวิร์กโฟลว์จะคอมมิต `report.json`, `report.md`, ชุดบันเดิล, `index.md` และอาร์ติแฟกต์โพรบซอร์สเข้า `openclaw/clawgrit-reports` ภายใต้ `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` ด้วย ตัวชี้ tested-ref ปัจจุบันจะถูกเขียนเป็น `openclaw-performance/<tested-ref>/latest-<lane>.json`

## การตรวจสอบรีลีสเต็มรูปแบบ

`Full Release Validation` คือเวิร์กโฟลว์ครอบคลุมแบบสั่งรันด้วยตนเองสำหรับ "รันทุกอย่างก่อนรีลีส" เวิร์กโฟลว์นี้รับแบรนช์ แท็ก หรือ SHA คอมมิตเต็ม สั่งรันเวิร์กโฟลว์ `CI` แบบด้วยตนเองด้วยเป้าหมายนั้น สั่งรัน `Plugin Prerelease` สำหรับหลักฐาน Plugin/แพ็กเกจ/static/Docker เฉพาะรีลีส และสั่งรัน `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, การตรวจสอบแพ็กเกจข้าม OS, การเรนเดอร์ maturity scorecard จากหลักฐานโปรไฟล์ QA, QA Lab parity, Matrix และเลน Telegram โปรไฟล์ stable และ full จะรวมการครอบคลุม live/E2E แบบครบถ้วนและ Docker release-path soak เสมอ; โปรไฟล์ beta สามารถเลือกเปิดได้ด้วย `run_release_soak=true` Telegram E2E ของแพ็กเกจ canonical รันภายใน Package Acceptance ดังนั้น candidate เต็มรูปแบบจะไม่เริ่ม live poller ซ้ำ หลังเผยแพร่ ให้ส่ง `release_package_spec` เพื่อใช้แพ็กเกจ npm ที่จัดส่งแล้วซ้ำใน release checks, Package Acceptance, Docker, cross-OS และ Telegram โดยไม่ต้องบิลด์ใหม่ ใช้ `npm_telegram_package_spec` เฉพาะสำหรับการรัน Telegram ซ้ำแบบเจาะจงแพ็กเกจที่เผยแพร่แล้ว เลนแพ็กเกจ live ของ Plugin Codex ใช้สถานะที่เลือกเดียวกันโดยค่าเริ่มต้น: `release_package_spec=openclaw@<tag>` ที่เผยแพร่แล้วจะอนุมาน `codex_plugin_spec=npm:@openclaw/codex@<tag>` ส่วนการรัน SHA/อาร์ติแฟกต์จะแพ็ก `extensions/codex` จาก ref ที่เลือก ตั้งค่า `codex_plugin_spec` อย่างชัดเจนสำหรับซอร์ส Plugin แบบกำหนดเอง เช่นสเปก `npm:`, `npm-pack:` หรือ `git:`

ดู [การตรวจสอบรีลีสเต็มรูปแบบ](/th/reference/full-release-validation) สำหรับ
เมทริกซ์สเตจ ชื่องานเวิร์กโฟลว์ที่แน่นอน ความแตกต่างของโปรไฟล์ อาร์ติแฟกต์ และ
ตัวจัดการการรันซ้ำแบบเจาะจง

`OpenClaw Release Publish` คือเวิร์กโฟลว์รีลีสแบบแก้ไขสถานะที่สั่งรันด้วยตนเอง สั่งรันจาก `release/YYYY.M.PATCH` หรือ `main` หลังจากมีแท็กรีลีสแล้วและหลังจาก OpenClaw npm preflight สำเร็จ เวิร์กโฟลว์จะตรวจสอบ `pnpm plugins:sync:check`, สั่งรัน `Plugin NPM Release` สำหรับแพ็กเกจ Plugin ทั้งหมดที่เผยแพร่ได้, สั่งรัน `Plugin ClawHub Release` สำหรับ SHA รีลีสเดียวกัน และจากนั้นจึงสั่งรัน `OpenClaw NPM Release` ด้วย `preflight_run_id` ที่บันทึกไว้ การเผยแพร่ stable ยังต้องใช้ `windows_node_tag` ที่ตรงเป๊ะ; เวิร์กโฟลว์จะตรวจสอบรีลีสซอร์ส Windows และเปรียบเทียบตัวติดตั้ง x64/ARM64 กับอินพุต `windows_node_installer_digests` ที่ candidate อนุมัติ ก่อน child ใด ๆ ของการเผยแพร่ จากนั้นโปรโมตและตรวจสอบ digest ของตัวติดตั้งที่ปักหมุดชุดเดิม พร้อม companion asset ที่แน่นอนและสัญญา checksum ก่อนเผยแพร่ GitHub release draft

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

สำหรับหลักฐานคอมมิตที่ปักหมุดบนแบรนช์ที่เคลื่อนไหวเร็ว ให้ใช้ helper แทน
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

refs สำหรับสั่งรันเวิร์กโฟลว์ GitHub ต้องเป็นแบรนช์หรือแท็ก ไม่ใช่ commit SHA ดิบ helper จะ push แบรนช์ชั่วคราว `release-ci/<sha>-...` ที่ SHA เป้าหมาย สั่งรัน `Full Release Validation` จาก ref ที่ปักหมุดนั้น ตรวจสอบว่า `headSha` ของ child workflow ทุกตัวตรงกับเป้าหมาย และลบแบรนช์ชั่วคราวเมื่อการรันเสร็จ ตัวตรวจสอบ umbrella จะล้มเหลวด้วยหาก child workflow ใดรันที่ SHA อื่น

`release_profile` ควบคุมความครอบคลุม live/provider ที่ส่งเข้า release checks เวิร์กโฟลว์รีลีสแบบสั่งรันด้วยตนเองมีค่าเริ่มต้นเป็น `stable`; ใช้ `full` เฉพาะเมื่อคุณต้องการเมทริกซ์ provider/media แบบ advisory ที่กว้างโดยตั้งใจ การตรวจสอบรีลีส stable และ full จะรัน live/E2E แบบครบถ้วนและ Docker release-path soak เสมอ; โปรไฟล์ beta สามารถเลือกเปิดได้ด้วย `run_release_soak=true`

- `minimum` คงไว้เฉพาะเลน OpenAI/core ที่เร็วที่สุดและสำคัญต่อรีลีส
- `stable` เพิ่มชุด provider/backend สำหรับ stable
- `full` รันเมทริกซ์ provider/media แบบ advisory ที่กว้าง

umbrella บันทึก run id ของ child ที่สั่งรัน และงานสุดท้าย `Verify full validation` จะตรวจสอบผลสรุปของ child run ปัจจุบันซ้ำและเพิ่มตารางงานที่ช้าที่สุดสำหรับแต่ละ child run หาก child workflow ถูกรันซ้ำและผ่านเป็นสีเขียว ให้รันซ้ำเฉพาะงาน parent verifier เพื่อรีเฟรชผลลัพธ์ umbrella และสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รับ `rerun_group` ใช้ `all` สำหรับ release candidate, `ci` สำหรับ child CI เต็มรูปแบบตามปกติเท่านั้น, `plugin-prerelease` สำหรับ child plugin prerelease เท่านั้น, `release-checks` สำหรับ child รีลีสทุกตัว หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` หรือ `npm-telegram` บน umbrella วิธีนี้ทำให้การรันซ้ำของกล่องรีลีสที่ล้มเหลวถูกจำกัดขอบเขตหลังจากแก้ไขแบบเจาะจง สำหรับเลน cross-OS ที่ล้มเหลวหนึ่งเลน ให้รวม `rerun_group=cross-os` กับ `cross_os_suite_filter` เช่น `windows/packaged-upgrade`; คำสั่ง cross-OS ที่ยาวจะปล่อยบรรทัด Heartbeat และสรุป packaged-upgrade จะรวมเวลารายเฟส เลน QA release-check เป็น advisory ยกเว้นเกตมาตรฐานครอบคลุมเครื่องมือรันไทม์ ซึ่งจะบล็อกเมื่อเครื่องมือ dynamic ของ OpenClaw ที่จำเป็นเบี่ยงเบนหรือหายไปจากสรุป tier มาตรฐาน

`OpenClaw Release Checks` ใช้ workflow ref ที่เชื่อถือได้เพื่อ resolve ref ที่เลือกหนึ่งครั้งเป็น tarball `release-package-under-test` จากนั้นส่งอาร์ติแฟกต์นั้นไปยังการตรวจสอบ cross-OS และ Package Acceptance รวมถึงเวิร์กโฟลว์ Docker live/E2E release-path เมื่อรันการครอบคลุม soak วิธีนี้ทำให้ไบต์ของแพ็กเกจสอดคล้องกันทั่วกล่องรีลีสและหลีกเลี่ยงการแพ็ก candidate เดียวกันซ้ำใน child job หลายตัว สำหรับเลน live ของ Codex npm-plugin release checks จะส่งสเปก Plugin ที่เผยแพร่แล้วซึ่งตรงกันและอนุมานจาก `release_package_spec`, ส่ง `codex_plugin_spec` ที่ผู้ปฏิบัติงานระบุ หรือเว้นอินพุตว่างเพื่อให้สคริปต์ Docker แพ็ก Plugin Codex ของ checkout ที่เลือก

การรัน `Full Release Validation` ซ้ำสำหรับ `ref=main` และ `rerun_group=all`
จะแทนที่ umbrella ที่เก่ากว่า parent monitor จะยกเลิก child workflow ใด ๆ ที่
สั่งรันไปแล้วเมื่อ parent ถูกยกเลิก ดังนั้นการตรวจสอบ main ที่ใหม่กว่าจะไม่ติดอยู่หลัง
release-check run เก่าสองชั่วโมง การตรวจสอบแบรนช์/แท็กรีลีสและกลุ่ม rerun แบบเจาะจง
จะคง `cancel-in-progress: false`

## ชาร์ด Live และ E2E

child live/E2E ของรีลีสยังคงครอบคลุม `pnpm test:live` แบบเนทีฟอย่างกว้าง แต่รันเป็นชาร์ดที่ตั้งชื่อผ่าน `scripts/test-live-shard.mjs` แทนงาน serial เดียว:

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
- ชาร์ด media audio/video ที่แยก และชาร์ด music ที่กรองตาม provider

วิธีนี้คงการครอบคลุมไฟล์เดิมไว้ พร้อมทำให้ความล้มเหลวของ live provider ที่ช้ารันซ้ำและวินิจฉัยได้ง่ายขึ้น ชื่อชาร์ด aggregate `native-live-extensions-o-z`, `native-live-extensions-media` และ `native-live-extensions-media-music` ยังคงใช้ได้สำหรับการรันซ้ำแบบครั้งเดียวด้วยตนเอง

ชาร์ด native live media รันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งบิลด์โดยเวิร์กโฟลว์ `Live Media Runner Image` อิมเมจนั้นติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้า; งาน media เพียงตรวจสอบไบนารีก่อน setup เก็บชุดทดสอบ live ที่ใช้ Docker ไว้บน Blacksmith runner ปกติ งาน container ไม่ใช่ที่ที่เหมาะสำหรับเปิด nested Docker tests.

ชาร์ดโมเดล/แบ็กเอนด์แบบไลฟ์ที่มี Docker รองรับ ใช้อิมเมจ `ghcr.io/openclaw/openclaw-live-test:<sha>` แบบแชร์แยกต่างหากต่อคอมมิตที่เลือกแต่ละรายการ เวิร์กโฟลว์รีลีสแบบไลฟ์จะสร้างและพุชอิมเมจนั้นหนึ่งครั้ง จากนั้นชาร์ด Docker live model, provider-sharded gateway, CLI backend, ACP bind และ Codex harness จะทำงานด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ชาร์ด Gateway Docker มีเพดาน `timeout` ระดับสคริปต์ที่ระบุชัดเจน ซึ่งต่ำกว่า timeout ของงานในเวิร์กโฟลว์ เพื่อให้คอนเทนเนอร์ที่ค้างหรือเส้นทาง cleanup ที่ค้างล้มเหลวอย่างรวดเร็ว แทนที่จะใช้โควตาเวลาของ release-check ทั้งหมด หากชาร์ดเหล่านั้นสร้าง Docker target ของซอร์สเต็มขึ้นใหม่เองโดยอิสระ แสดงว่าการรันรีลีสถูกกำหนดค่าผิด และจะเสียเวลา wall clock ไปกับการสร้างอิมเมจซ้ำ

## การยอมรับแพ็กเกจ

ใช้ `Package Acceptance` เมื่อคำถามคือ "แพ็กเกจ OpenClaw ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์ได้หรือไม่" ซึ่งต่างจาก CI ปกติ: CI ปกติตรวจสอบซอร์สทรี ส่วนการยอมรับแพ็กเกจตรวจสอบ tarball เดียวผ่าน Docker E2E harness เดียวกับที่ผู้ใช้เรียกใช้หลังติดตั้งหรืออัปเดต

### งาน

1. `resolve_package` checkout `workflow_ref`, resolve ผู้สมัครแพ็กเกจหนึ่งรายการ, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, อัปโหลดทั้งสองเป็น artifact `package-under-test` และพิมพ์ source, workflow ref, package ref, version, SHA-256 และ profile ในสรุปขั้นตอนของ GitHub
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` เวิร์กโฟลว์ที่นำกลับมาใช้ซ้ำจะดาวน์โหลด artifact นั้น ตรวจสอบ inventory ของ tarball เตรียมอิมเมจ Docker แบบ package-digest เมื่อจำเป็น และรัน Docker lane ที่เลือกกับแพ็กเกจนั้นแทนการ pack checkout ของเวิร์กโฟลว์ เมื่อ profile เลือก `docker_lanes` แบบเจาะจงหลายรายการ เวิร์กโฟลว์ที่นำกลับมาใช้ซ้ำจะเตรียมแพ็กเกจและอิมเมจที่แชร์หนึ่งครั้ง จากนั้นกระจาย lane เหล่านั้นออกเป็นงาน Docker แบบเจาะจงที่รันขนานกันพร้อม artifact ที่ไม่ซ้ำกัน
3. `package_telegram` อาจเรียก `NPM Telegram Beta E2E` โดยจะรันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้ง artifact `package-under-test` เดียวกันเมื่อ Package Acceptance resolve ได้หนึ่งรายการ; การ dispatch Telegram แบบสแตนด์อโลนยังคงติดตั้ง npm spec ที่เผยแพร่แล้วได้
4. `summary` ทำให้เวิร์กโฟลว์ล้มเหลวหากการ resolve แพ็กเกจ, Docker acceptance หรือ Telegram lane ที่เป็นทางเลือก ล้มเหลว

### แหล่งที่มาของผู้สมัคร

- `source=npm` รับเฉพาะ `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรีลีส OpenClaw แบบ exact เช่น `openclaw@2026.4.27-beta.2` ใช้สิ่งนี้สำหรับการยอมรับ prerelease/stable ที่เผยแพร่แล้ว
- `source=ref` pack branch, tag หรือ full commit SHA ของ `package_ref` ที่เชื่อถือได้ resolver จะ fetch branch/tag ของ OpenClaw, ตรวจสอบว่าคอมมิตที่เลือกเข้าถึงได้จากประวัติ branch ของ repository หรือ release tag, ติดตั้ง deps ใน detached worktree และ pack ด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` ดาวน์โหลด `.tgz` แบบ HTTPS สาธารณะ; ต้องระบุ `package_sha256` เส้นทางนี้ปฏิเสธ credential ใน URL, พอร์ต HTTPS ที่ไม่ใช่ค่า default, hostname หรือ IP ที่ resolve แล้วที่เป็น private/internal/special-use และ redirect ที่อยู่นอกนโยบายความปลอดภัยสาธารณะเดียวกัน
- `source=trusted-url` ดาวน์โหลด `.tgz` แบบ HTTPS จากนโยบาย trusted-source ที่มีชื่อใน `.github/package-trusted-sources.json`; ต้องระบุ `package_sha256` และ `trusted_source_id` ใช้สิ่งนี้เฉพาะกับ enterprise mirror หรือ private package repository ที่ maintainer เป็นเจ้าของ ซึ่งต้องใช้ host, port, path prefix, redirect host หรือ private-network resolution ที่กำหนดค่าไว้ หากนโยบายประกาศ bearer auth เวิร์กโฟลว์จะใช้ secret คงที่ `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; credential ที่ฝังใน URL ยังคงถูกปฏิเสธ
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งไฟล์จาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็นทางเลือก แต่ควรระบุสำหรับ artifact ที่แชร์ภายนอก

แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือโค้ดเวิร์กโฟลว์/harness ที่เชื่อถือได้ซึ่งรันการทดสอบ `package_ref` คือคอมมิตซอร์สที่จะถูก pack เมื่อ `source=ref` สิ่งนี้ทำให้ test harness ปัจจุบันตรวจสอบคอมมิตซอร์สเก่าที่เชื่อถือได้โดยไม่ต้องรันลอจิกเวิร์กโฟลว์เก่า

### โปรไฟล์ชุดทดสอบ

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` บวก `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — ชังก์ release-path ของ Docker แบบเต็มพร้อม OpenWebUI
- `custom` — `docker_lanes` แบบ exact; จำเป็นเมื่อ `suite_profile=custom`

profile `package` ใช้ความครอบคลุม Plugin แบบออฟไลน์ เพื่อให้การตรวจสอบแพ็กเกจที่เผยแพร่แล้วไม่ถูกกั้นด้วยความพร้อมใช้งานของ ClawHub แบบไลฟ์ Telegram lane ที่เป็นทางเลือกนำ artifact `package-under-test` ไปใช้ซ้ำใน `NPM Telegram Beta E2E` โดยเก็บเส้นทาง npm spec ที่เผยแพร่แล้วไว้สำหรับการ dispatch แบบสแตนด์อโลน

สำหรับนโยบายเฉพาะด้านการทดสอบอัปเดตและ Plugin รวมถึงคำสั่ง local,
Docker lane, อินพุต Package Acceptance, ค่า default ของรีลีส และการ triage ความล้มเหลว,
ดู [การทดสอบอัปเดตและ Plugin](/th/help/testing-updates-plugins)

Release check เรียก Package Acceptance ด้วย `source=artifact`, artifact แพ็กเกจรีลีสที่เตรียมไว้, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` และ `telegram_mode=mock-openai` สิ่งนี้ทำให้ proof ของ package migration, update, การติดตั้ง skill จาก ClawHub แบบไลฟ์, stale-plugin-dependency cleanup, การซ่อมแซมการติดตั้ง configured-plugin, Plugin แบบออฟไลน์, plugin-update และ Telegram อยู่บน tarball แพ็กเกจที่ resolve แล้วรายการเดียวกัน ตั้งค่า `release_package_spec` บน Full Release Validation หรือ OpenClaw Release Checks หลังเผยแพร่ beta เพื่อรันเมทริกซ์เดียวกันกับแพ็กเกจ npm ที่ shipped แล้วโดยไม่ต้อง rebuild; ตั้งค่า `package_acceptance_package_spec` เฉพาะเมื่อ Package Acceptance ต้องใช้แพ็กเกจต่างจากส่วนที่เหลือของ release validation การตรวจสอบรีลีสข้าม OS ยังคงครอบคลุม onboarding, installer และพฤติกรรมแพลตฟอร์มเฉพาะ OS; การตรวจสอบผลิตภัณฑ์ด้าน package/update ควรเริ่มจาก Package Acceptance Docker lane `published-upgrade-survivor` ตรวจสอบ baseline แพ็กเกจที่เผยแพร่แล้วหนึ่งรายการต่อการรันในเส้นทางรีลีสแบบ blocking ใน Package Acceptance, tarball `package-under-test` ที่ resolve แล้วจะเป็น candidate เสมอ และ `published_upgrade_survivor_baseline` เลือก fallback published baseline โดยมีค่า default เป็น `openclaw@latest`; คำสั่ง rerun ของ lane ที่ล้มเหลวจะรักษา baseline นั้นไว้ Full Release Validation ที่มี `run_release_soak=true` หรือ `release_profile=full` ตั้งค่า `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` และ `published_upgrade_survivor_scenarios=reported-issues` เพื่อขยายครอบคลุม stable npm release ล่าสุดสี่รายการ บวก release ขอบเขต plugin-compatibility ที่ pin ไว้ และ fixture ตามรูปแบบ issue สำหรับ config ของ Feishu, ไฟล์ bootstrap/persona ที่คงไว้, การติดตั้ง Plugin OpenClaw ที่กำหนดค่าไว้, เส้นทาง log ที่มี tilde และ root ของ dependency Plugin แบบ legacy ที่ค้างอยู่ การเลือก published-upgrade survivor แบบหลาย baseline จะถูก shard ตาม baseline เป็นงาน targeted Docker runner แยกกัน เวิร์กโฟลว์ `Update Migration` แยกต่างหากใช้ Docker lane `update-migration` กับ `all-since-2026.4.23` และ `plugin-deps-cleanup` เมื่อคำถามคือการ cleanup อัปเดตที่เผยแพร่แล้วแบบ exhaustive ไม่ใช่ความกว้างของ Full Release CI ปกติ การรัน aggregate แบบ local สามารถส่ง package spec แบบ exact ด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, เก็บ lane เดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` เช่น `openclaw@2026.4.15` หรือตั้งค่า `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` สำหรับ scenario matrix lane ที่เผยแพร่แล้วกำหนดค่า baseline ด้วยสูตรคำสั่ง `openclaw config set` ที่ baked ไว้, บันทึกขั้นตอนสูตรใน `summary.json` และ probe `/healthz`, `/readyz` รวมถึงสถานะ RPC หลัง Gateway start lane สดของแพ็กเกจและ installer บน Windows ยังตรวจสอบด้วยว่าแพ็กเกจที่ติดตั้งแล้วสามารถ import browser-control override จาก raw absolute Windows path ได้ smoke ของ agent-turn ข้าม OS สำหรับ OpenAI มีค่า default เป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อกำหนดไว้ มิฉะนั้นเป็น `openai/gpt-5.5` เพื่อให้ proof การติดตั้งและ Gateway อยู่บนโมเดลทดสอบ GPT-5 โดยหลีกเลี่ยงค่า default ของ GPT-4.x

### หน้าต่างความเข้ากันได้แบบ legacy

Package Acceptance มีหน้าต่าง legacy-compatibility ที่มีขอบเขตสำหรับแพ็กเกจที่เผยแพร่ไปแล้ว แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้เส้นทางความเข้ากันได้:

- รายการ QA ส่วนตัวที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ถูกละไว้จาก tarball;
- `doctor-switch` อาจข้าม subcase การคงอยู่ของ `gateway install --wrapper` เมื่อแพ็กเกจไม่ได้ expose flag นั้น;
- `update-channel-switch` อาจ prune pnpm `patchedDependencies` ที่ขาดหายจาก fixture git ปลอมที่ได้จาก tarball และอาจ log `update.channel` ที่คงอยู่แล้วแต่ขาดหาย;
- smoke ของ Plugin อาจอ่านตำแหน่ง install-record แบบ legacy หรือยอมรับการขาดการคงอยู่ของ marketplace install-record;
- `plugin-update` อาจอนุญาตการ migration metadata ของ config ขณะที่ยังคงกำหนดให้ install record และพฤติกรรม no-reinstall ไม่เปลี่ยนแปลง

แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ stamp metadata ของ build local ที่ shipped ไปแล้วด้วย แพ็กเกจหลังจากนั้นต้องเป็นไปตาม contract สมัยใหม่; เงื่อนไขเดียวกันจะล้มเหลวแทนที่จะเตือนหรือข้าม

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

เมื่อ debug การรัน package acceptance ที่ล้มเหลว ให้เริ่มที่สรุป `resolve_package` เพื่อยืนยัน source, version และ SHA-256 ของแพ็กเกจ จากนั้นตรวจสอบ child run `docker_acceptance` และ Docker artifact ของมัน: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase timings และคำสั่ง rerun ควร rerun profile ของแพ็กเกจที่ล้มเหลวหรือ Docker lane แบบ exact แทนการ rerun full release validation

## Install smoke

เวิร์กโฟลว์ `Install Smoke` แยกต่างหากนำ scope script เดียวกันไปใช้ซ้ำผ่านงาน `preflight` ของตัวเอง โดยแยกความครอบคลุมของ smoke เป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **เส้นทางด่วน** ทำงานกับ pull request ที่แตะพื้นผิว Docker/package, การเปลี่ยนแปลง package/manifest ของ Plugin ที่บันเดิลมา, หรือพื้นผิว core plugin/channel/gateway/Plugin SDK ที่งาน Docker smoke ใช้ทดสอบ การเปลี่ยนแปลง Plugin ที่บันเดิลมาแบบ source-only, การแก้ไขเฉพาะการทดสอบ, และการแก้ไขเฉพาะเอกสารจะไม่จอง Docker worker เส้นทางด่วนจะ build อิมเมจ root Dockerfile หนึ่งครั้ง, ตรวจสอบ CLI, รัน agents delete shared-workspace CLI smoke, รัน container gateway-network e2e, ยืนยัน build arg ของ extension ที่บันเดิลมา, และรันโปรไฟล์ Docker ของ bundled-plugin แบบมีขอบเขตภายใต้ timeout รวมของคำสั่ง 240 วินาที (Docker run ของแต่ละ scenario ถูกจำกัดแยกกัน)
- **เส้นทางเต็ม** คงความครอบคลุม QR package install และ installer Docker/update ไว้สำหรับรอบ nightly scheduled, manual dispatch, workflow-call release checks, และ pull request ที่แตะพื้นผิว installer/package/Docker จริง ๆ ในโหมดเต็ม install-smoke จะเตรียมหรือนำอิมเมจ GHCR root Dockerfile smoke ของ target-SHA หนึ่งรายการกลับมาใช้ซ้ำ จากนั้นรัน QR package install, root Dockerfile/gateway smokes, installer/update smokes, และ fast bundled-plugin Docker E2E เป็นงานแยกกัน เพื่อให้งาน installer ไม่ต้องรอหลัง root image smokes

การ push ไปยัง `main` (รวมถึง merge commit) จะไม่บังคับใช้เส้นทางเต็ม เมื่อ logic ของ changed-scope ขอความครอบคลุมเต็มในการ push workflow จะคง fast Docker smoke ไว้ และปล่อย full install smoke ให้ nightly หรือ release validation

smoke ของ slow Bun global install image-provider ถูก gate แยกด้วย `run_bun_global_install_smoke` โดยจะรันใน nightly schedule และจาก release checks workflow และ manual `Install Smoke` dispatch สามารถเลือกเปิดใช้ได้ แต่ pull request และการ push ไปยัง `main` จะไม่รัน CI ของ PR ปกติยังคงรัน fast Bun launcher regression lane สำหรับการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node ส่วน QR และ installer Docker tests จะคง Dockerfile ที่เน้นการ install ของตัวเองไว้

## Docker E2E ในเครื่อง

`pnpm test:docker:all` prebuild อิมเมจ live-test ที่ใช้ร่วมกันหนึ่งรายการ, pack OpenClaw หนึ่งครั้งเป็น npm tarball, และ build อิมเมจ `scripts/e2e/Dockerfile` ที่ใช้ร่วมกันสองรายการ:

- runner Node/Git เปล่าสำหรับ lane installer/update/plugin-dependency;
- อิมเมจ functional ที่ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lane functionality ปกติ

นิยาม Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`, และ runner จะ execute เฉพาะแผนที่เลือกเท่านั้น scheduler เลือกอิมเมจต่อ lane ด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` จากนั้นรัน lane ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### ค่าที่ปรับได้

| ตัวแปร | ค่าเริ่มต้น | วัตถุประสงค์ |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | จำนวน slot ของ main-pool สำหรับ lane ปกติ |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | จำนวน slot ของ tail-pool ที่ไวต่อ provider |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | เพดาน lane สดพร้อมกันเพื่อไม่ให้ provider throttle |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | เพดาน lane npm install พร้อมกัน |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | เพดาน lane multi-service พร้อมกัน |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | หน่วงระหว่างการเริ่ม lane เพื่อหลีกเลี่ยงพายุการ create ของ Docker daemon; ตั้ง `0` เพื่อไม่หน่วง |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout fallback ต่อ lane (120 นาที); lane สด/tail ที่เลือกใช้เพดานที่เข้มกว่า |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` พิมพ์แผนของ scheduler โดยไม่รัน lane |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | รายการ lane แบบตรงตัวคั่นด้วยจุลภาค; ข้าม cleanup smoke เพื่อให้ agent ทำซ้ำ lane ที่ล้มเหลวหนึ่ง lane ได้ |

lane ที่หนักกว่าเพดานจริงของตัวเองยังสามารถเริ่มจาก pool ว่างได้ แล้วจะรันเดี่ยวจนกว่าจะปล่อย capacity aggregate preflight ในเครื่องจะตรวจ Docker, ลบ container OpenClaw E2E ที่ค้างอยู่, แสดงสถานะ active-lane, บันทึก timing ของ lane เพื่อจัดลำดับ longest-first, และโดยค่าเริ่มต้นจะหยุด schedule lane ใหม่ใน pool หลังจากความล้มเหลวครั้งแรก

### Workflow live/E2E ที่ใช้ซ้ำได้

workflow live/E2E ที่ใช้ซ้ำได้จะถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องการ package, ชนิดอิมเมจ, live image, lane, และความครอบคลุมของ credential แบบใด จากนั้น `scripts/docker-e2e.mjs` จะแปลงแผนนั้นเป็น GitHub outputs และ summaries โดยจะ pack OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลด package artifact ของ run ปัจจุบัน, หรือดาวน์โหลด package artifact จาก `package_artifact_run_id`; ตรวจสอบ inventory ของ tarball; build และ push อิมเมจ GHCR Docker E2E แบบ bare/functional ที่ tag ด้วย package-digest ผ่าน Docker layer cache ของ Blacksmith เมื่อแผนต้องการ lane ที่ติดตั้ง package แล้ว; และใช้อินพุต `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรืออิมเมจ package-digest ที่มีอยู่ แทนการ rebuild การ pull อิมเมจ Docker จะ retry ด้วย timeout ต่อครั้งแบบมีขอบเขต 180 วินาที เพื่อให้ stream registry/cache ที่ค้าง retry ได้เร็ว แทนที่จะกินเวลาส่วนใหญ่ของ critical path ของ CI

### Chunk ของเส้นทาง release

ความครอบคลุม Docker สำหรับ release รันเป็นงาน chunk ขนาดเล็กกว่าด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละ chunk pull เฉพาะชนิดอิมเมจที่ต้องใช้ และ execute หลาย lane ผ่าน weighted scheduler เดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

chunk Docker สำหรับ release ปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, และ `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` `package-update-openai` รวม lane package ของ Plugin Codex สด ซึ่งติดตั้ง candidate OpenClaw package, ติดตั้ง Codex Plugin จาก `codex_plugin_spec` หรือ tarball ของ ref เดียวกันพร้อมการอนุมัติการติดตั้ง Codex CLI อย่างชัดเจน, รัน Codex CLI preflight, จากนั้นรัน OpenClaw agent หลาย turn ใน session เดียวกันกับ OpenAI `plugins-runtime-core`, `plugins-runtime`, และ `plugins-integrations` ยังคงเป็น alias รวมของ plugin/runtime ส่วน alias lane `install-e2e` ยังคงเป็น alias rerun แบบ manual รวมสำหรับ provider installer lane ทั้งคู่

OpenWebUI ถูกรวมเข้าใน `plugins-runtime-services` เมื่อความครอบคลุม release-path แบบเต็มร้องขอ และคง chunk `openwebui` แบบ standalone ไว้เฉพาะสำหรับ dispatch แบบ OpenWebUI-only เท่านั้น lane อัปเดต bundled-channel จะ retry หนึ่งครั้งสำหรับความล้มเหลวเครือข่าย npm ชั่วคราว

แต่ละ chunk อัปโหลด `.artifacts/docker-tests/` พร้อม log ของ lane, timing, `summary.json`, `failures.json`, phase timing, JSON แผนของ scheduler, ตาราง slow-lane, และคำสั่ง rerun ต่อ lane อินพุต `docker_lanes` ของ workflow จะรัน lane ที่เลือกกับอิมเมจที่เตรียมไว้แทนงาน chunk ซึ่งทำให้การ debug lane ที่ล้มเหลวถูกจำกัดอยู่ในงาน Docker ที่เจาะจงหนึ่งงาน และเตรียม, ดาวน์โหลด, หรือนำ package artifact กลับมาใช้ซ้ำสำหรับ run นั้น หาก lane ที่เลือกเป็น live Docker lane งานที่เจาะจงจะ build live-test image ในเครื่องสำหรับ rerun นั้น คำสั่ง GitHub rerun ต่อ lane ที่สร้างขึ้นจะรวม `package_artifact_run_id`, `package_artifact_name`, และอินพุตอิมเมจที่เตรียมไว้เมื่อมีค่าเหล่านั้น เพื่อให้ lane ที่ล้มเหลวสามารถนำ package และอิมเมจเดิมจาก run ที่ล้มเหลวกลับมาใช้ซ้ำได้

```bash
pnpm test:docker:rerun <run-id>      # ดาวน์โหลด Docker artifacts และพิมพ์คำสั่ง rerun แบบ targeted ทั้งรวม/ต่อ lane
pnpm test:docker:timings <summary>   # สรุป slow-lane และ phase critical-path
```

workflow live/E2E ตามกำหนดการจะรันชุด Docker release-path แบบเต็มทุกวัน

## Plugin Prerelease

`Plugin Prerelease` เป็นความครอบคลุม product/package ที่มีค่าใช้จ่ายสูงกว่า จึงเป็น workflow แยกที่ dispatch โดย `Full Release Validation` หรือโดย operator อย่างชัดเจน pull request ปกติ, การ push ไปยัง `main`, และ manual CI dispatch แบบ standalone จะไม่เปิดชุดนี้ มันกระจายการทดสอบ Plugin ที่บันเดิลมาข้าม extension worker แปดตัว งาน extension shard เหล่านั้นรันได้สูงสุดสองกลุ่ม config ของ Plugin พร้อมกัน โดยใช้ Vitest worker หนึ่งตัวต่อกลุ่มและ Node heap ที่ใหญ่ขึ้น เพื่อให้ batch ของ Plugin ที่ import หนักไม่สร้างงาน CI เพิ่มเติม เส้นทาง Docker prerelease เฉพาะ release จะ batch lane Docker ที่เจาะจงเป็นกลุ่มเล็ก ๆ เพื่อหลีกเลี่ยงการจอง runner หลายสิบตัวสำหรับงานหนึ่งถึงสามนาที workflow ยังอัปโหลด artifact เชิงข้อมูล `plugin-inspector-advisory` จาก `@openclaw/plugin-inspector`; finding ของ inspector เป็นอินพุตสำหรับ triage และไม่เปลี่ยน gate `Plugin Prerelease` ที่บล็อกอยู่

## QA Lab

QA Lab มี lane CI เฉพาะนอก workflow หลักแบบ smart-scoped agentic parity ถูกซ้อนอยู่ใต้ QA และ release harness แบบกว้าง ไม่ใช่ workflow PR แบบ standalone ใช้ `Full Release Validation` พร้อม `rerun_group=qa-parity` เมื่อ parity ควรเดินร่วมกับ run validation แบบกว้าง

- workflow `QA-Lab - All Lanes` รันทุกคืนบน `main` และบน manual dispatch; มัน fan out lane mock parity, lane live Matrix, และ lane live Telegram และ Discord เป็นงานขนาน งาน live ใช้ environment `qa-live-shared` และ Telegram/Discord ใช้ Convex leases

release checks รัน Matrix และ lane live transport ของ Telegram ด้วย deterministic mock provider และ model ที่ผ่านคุณสมบัติ mock (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อแยก contract ของ channel ออกจาก latency ของ model สดและการ startup ปกติของ provider-plugin live transport gateway ปิดใช้งาน memory search เพราะ QA parity ครอบคลุมพฤติกรรม memory แยกต่างหาก การเชื่อมต่อ provider ครอบคลุมโดยชุด live model, native provider, และ Docker provider แยกต่างหาก

Matrix ใช้ `--profile fast` สำหรับ scheduled และ release gate โดยเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout รองรับ ค่าเริ่มต้นของ CLI และอินพุต workflow แบบ manual ยังคงเป็น `all`; manual dispatch `matrix_profile=all` จะ shard ความครอบคลุม Matrix แบบเต็มเป็นงาน `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรัน lane QA Lab ที่สำคัญต่อ release ก่อนอนุมัติ release; gate QA parity ของมันรัน candidate และ baseline packs เป็นงาน lane ขนานกัน จากนั้นดาวน์โหลด artifact ทั้งสองเข้าสู่งาน report ขนาดเล็กสำหรับการเปรียบเทียบ parity ขั้นสุดท้าย

สำหรับ PR ปกติ ให้ทำตามหลักฐาน CI/check ตาม scope แทนการถือว่า parity เป็นสถานะที่จำเป็น

## CodeQL

workflow `CodeQL` ตั้งใจให้เป็น security scanner รอบแรกที่แคบ ไม่ใช่การ sweep repository แบบเต็ม การรันรายวัน, manual, และ pull request guard ที่ไม่ใช่ draft จะสแกน code ของ Actions workflow รวมถึงพื้นผิว JavaScript/TypeScript ที่มีความเสี่ยงสูงสุด ด้วย query ด้าน security ความมั่นใจสูงที่กรองเฉพาะ `security-severity` ระดับ high/critical

pull request guard ยังคงเบา: มันเริ่มเฉพาะเมื่อมีการเปลี่ยนแปลงภายใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, หรือ `src` และรัน matrix security ความมั่นใจสูงเดียวกับ workflow ตามกำหนดการ Android และ macOS CodeQL จะไม่อยู่ในค่าเริ่มต้นของ PR

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                          | พื้นผิว                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, Cron และ baseline ของ Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการใช้งาน implementation ของช่องทางหลัก รวมถึง runtime ของ Plugin ช่องทาง, Gateway, Plugin SDK, secrets และจุดสัมผัส audit              |
| `/codeql-security-high/network-ssrf-boundary`     | พื้นผิวนโยบาย SSRF ของ core, การแยกวิเคราะห์ IP, network guard, web-fetch และ Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | เซิร์ฟเวอร์ MCP, helper สำหรับการรัน process, การส่งออกขาออก และ gate สำหรับการรัน tool ของ agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | พื้นผิวความเชื่อถือของการติดตั้ง Plugin, loader, manifest, registry, การติดตั้ง package-manager, source-loading และสัญญา package ของ Plugin SDK |

### shard ความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — shard ความปลอดภัย Android ตามกำหนดเวลา สร้างแอป Android ด้วยตนเองสำหรับ CodeQL บน runner Blacksmith Linux ที่เล็กที่สุดซึ่งผ่าน sanity ของ workflow อัปโหลดภายใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — shard ความปลอดภัย macOS แบบรายสัปดาห์/ด้วยตนเอง สร้างแอป macOS ด้วยตนเองสำหรับ CodeQL บน Blacksmith macOS, กรองผลลัพธ์ build ของ dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดภายใต้ `/codeql-critical-security/macos` แยกไว้นอกค่าเริ่มต้นรายวันเพราะ build ของ macOS ใช้ runtime มากที่สุดแม้เมื่อสะอาด

### หมวดหมู่ Critical Quality

`CodeQL Critical Quality` คือ shard ที่ไม่ใช่ความปลอดภัยซึ่งจับคู่กัน โดยรันเฉพาะ query คุณภาพ JavaScript/TypeScript ที่ไม่ใช่ความปลอดภัยและมีระดับความรุนแรงเป็น error บนพื้นผิวที่แคบและมีมูลค่าสูงบน runner Linux ที่โฮสต์โดย GitHub เพื่อให้การสแกนคุณภาพไม่ใช้ budget การลงทะเบียน runner ของ Blacksmith guard สำหรับ pull request ตั้งใจให้เล็กกว่า profile ตามกำหนดเวลา: PR ที่ไม่ใช่ draft จะรันเฉพาะ shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` ที่จับคู่กับโค้ดการรันคำสั่ง/model/tool ของ agent และการ dispatch reply, โค้ด schema/migration/IO ของ config, โค้ด auth/secrets/sandbox/security, runtime ช่องทางหลักและ Plugin ช่องทางที่ bundled, protocol/server-method ของ Gateway, runtime/SDK glue ของ memory, MCP/process/การส่งออกขาออก, runtime/catalog model ของ provider, diagnostics/คิว delivery ของ session, loader ของ Plugin, สัญญา Plugin SDK/package หรือการเปลี่ยนแปลง runtime reply ของ Plugin SDK การเปลี่ยนแปลง config ของ CodeQL และ workflow คุณภาพจะรัน shard คุณภาพของ PR ทั้งสิบสองรายการ

Manual dispatch รับ:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

profile แบบแคบเป็น hook สำหรับการสอน/iteration เพื่อรัน shard คุณภาพหนึ่งรายการแยกเดี่ยว

| หมวดหมู่                                                | พื้นผิว                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ดขอบเขตความปลอดภัยของ Auth, secrets, sandbox, Cron และ Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | สัญญา config schema, migration, normalization และ IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schema ของ protocol Gateway และสัญญา server method                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญาการใช้งาน implementation ของช่องทางหลักและ Plugin ช่องทางที่ bundled                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | การรันคำสั่ง, การ dispatch model/provider, การ dispatch และคิว auto-reply และสัญญา runtime ของ control-plane ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | เซิร์ฟเวอร์ MCP และ tool bridge, helper สำหรับการกำกับดูแล process และสัญญาการส่งออกขาออก                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK ของ memory host, facade ของ memory runtime, alias ของ memory Plugin SDK, glue สำหรับการเปิดใช้ memory runtime และคำสั่ง doctor ของ memory                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | ภายในของคิว reply, คิว delivery ของ session, helper สำหรับการ bind/delivery session ขาออก, พื้นผิว bundle event/log วินิจฉัย และสัญญา CLI doctor ของ session |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | การ dispatch reply ขาเข้าของ Plugin SDK, helper payload/chunking/runtime ของ reply, ตัวเลือก reply ของช่องทาง, คิว delivery และ helper การ bind session/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | การ normalize catalog model, auth และ discovery ของ provider, การลงทะเบียน runtime ของ provider, ค่าเริ่มต้น/catalog ของ provider และ registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | bootstrap ของ Control UI, persistence ภายในเครื่อง, flow ควบคุม Gateway และสัญญา runtime ของ task control-plane                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | web fetch/search หลัก, media IO, ความเข้าใจสื่อ, image-generation และสัญญา runtime ของ media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | สัญญา loader, registry, public-surface และ entrypoint ของ Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | source ของ Plugin SDK ฝั่ง package ที่เผยแพร่แล้ว และ helper สัญญา package ของ Plugin                                                                                      |

คุณภาพแยกจากความปลอดภัยเพื่อให้ finding ด้านคุณภาพสามารถถูกกำหนดเวลา, วัดผล, ปิดใช้งาน หรือขยายได้โดยไม่บดบังสัญญาณความปลอดภัย ควรเพิ่มการขยาย CodeQL สำหรับ Swift, Python และ Plugin ที่ bundled กลับมาเป็นงานติดตามผลแบบ scoped หรือ sharded หลังจาก profile แบบแคบมี runtime และสัญญาณที่เสถียรแล้วเท่านั้น

## workflow การบำรุงรักษา

### Docs Agent

workflow `Docs Agent` คือ lane การบำรุงรักษา Codex แบบขับเคลื่อนด้วย event สำหรับทำให้เอกสารที่มีอยู่สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง land ไม่มี schedule ล้วน: การรัน CI จาก push ที่สำเร็จบน `main` โดยไม่ใช่ bot สามารถ trigger ได้ และ manual dispatch สามารถรันได้โดยตรง การ invoke ผ่าน workflow-run จะข้ามเมื่อ `main` ขยับไปแล้ว หรือเมื่อมีการรัน Docs Agent อื่นที่ไม่ถูกข้ามถูกสร้างขึ้นในชั่วโมงที่ผ่านมา เมื่อรันแล้ว จะตรวจสอบช่วง commit ตั้งแต่ source SHA ของ Docs Agent ที่ไม่ถูกข้ามครั้งก่อนถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงหนึ่งครั้งสามารถครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมมาตั้งแต่การตรวจเอกสารครั้งล่าสุดได้

### Test Performance Agent

workflow `Test Performance Agent` คือ lane การบำรุงรักษา Codex แบบขับเคลื่อนด้วย event สำหรับ test ที่ช้า ไม่มี schedule ล้วน: การรัน CI จาก push ที่สำเร็จบน `main` โดยไม่ใช่ bot สามารถ trigger ได้ แต่จะข้ามถ้ามีการ invoke ผ่าน workflow-run อื่นที่รันแล้วหรือกำลังรันอยู่ในวัน UTC นั้น Manual dispatch จะข้าม gate กิจกรรมรายวันนี้ lane นี้สร้างรายงาน performance ของ Vitest แบบ grouped สำหรับ full-suite, ให้ Codex ทำเฉพาะการแก้ performance ของ test ขนาดเล็กที่รักษา coverage แทน refactor กว้าง ๆ จากนั้นรันรายงาน full-suite อีกครั้ง และปฏิเสธการเปลี่ยนแปลงที่ลดจำนวน test baseline ที่ผ่าน รายงาน grouped บันทึก wall time ต่อ config และ max RSS บน Linux และ macOS ดังนั้นการเปรียบเทียบก่อน/หลังจึงแสดง delta ของหน่วยความจำ test ควบคู่กับ delta ของระยะเวลา ถ้า baseline มี test ที่ล้มเหลว Codex อาจแก้เฉพาะ failure ที่ชัดเจน และรายงาน full-suite หลัง agent ต้องผ่านก่อน commit ใด ๆ เมื่อ `main` เดินหน้าก่อนที่ bot push จะ land lane จะ rebase patch ที่ validate แล้ว, รัน `pnpm check:changed` อีกครั้ง และลอง push ใหม่; patch เก่าที่ conflict จะถูกข้าม ใช้ Ubuntu ที่โฮสต์โดย GitHub เพื่อให้ action ของ Codex รักษาท่าทีความปลอดภัย drop-sudo เดียวกับ docs agent ได้

### PR ซ้ำหลัง merge

workflow `Duplicate PRs After Merge` คือ workflow maintainer แบบ manual สำหรับล้าง duplicate หลัง land ค่าเริ่มต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุไว้อย่างชัดเจนเมื่อ `apply=true` ก่อนแก้ไข GitHub จะตรวจสอบว่า PR ที่ land แล้วถูก merge แล้ว และ duplicate แต่ละรายการมี issue ที่อ้างอิงร่วมกันหรือมี hunk ที่เปลี่ยนทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## gate ตรวจสอบภายในเครื่องและการ route การเปลี่ยนแปลง

logic changed-lane ภายในเครื่องอยู่ใน `scripts/changed-lanes.mjs` และถูก execute โดย `scripts/check-changed.mjs` gate ตรวจสอบภายในเครื่องนั้นเข้มงวดกับขอบเขต architecture มากกว่า scope แพลตฟอร์ม CI แบบกว้าง:

- การเปลี่ยนแปลง production ของ core รัน typecheck ของ core prod และ core test รวมถึง lint/guard ของ core;
- การเปลี่ยนแปลงเฉพาะ test ของ core รันเฉพาะ typecheck ของ core test รวมถึง lint ของ core;
- การเปลี่ยนแปลง production ของ extension รัน typecheck ของ extension prod และ extension test รวมถึง lint ของ extension;
- การเปลี่ยนแปลงเฉพาะ test ของ extension รัน typecheck ของ extension test รวมถึง lint ของ extension;
- การเปลี่ยนแปลง public Plugin SDK หรือ plugin-contract ขยายไปยัง typecheck ของ extension เพราะ extension พึ่งพาสัญญา core เหล่านั้น (การ sweep extension ของ Vitest ยังเป็นงาน test ที่ต้องระบุชัด);
- การ bump version ที่เป็น release metadata-only รันการตรวจ version/config/root-dependency แบบ targeted;
- การเปลี่ยนแปลง root/config ที่ไม่รู้จัก fail safe ไปยัง lane ตรวจสอบทั้งหมด

การ route changed-test ภายในเครื่องอยู่ใน `scripts/test-projects.test-support.mjs` และตั้งใจให้ถูกกว่า `check:changed`: การแก้ test โดยตรงจะรันตัวเอง, การแก้ source จะเลือก mapping ที่ชัดเจนก่อน จากนั้นจึงเป็น test sibling และ dependent ใน import-graph config การส่ง group-room ร่วมเป็นหนึ่งใน mapping ที่ชัดเจน: การเปลี่ยนแปลง config visible-reply ของ group, โหมด source reply delivery หรือ system prompt ของ message-tool จะ route ผ่าน test reply ของ core รวมถึง regression การ delivery ของ Discord และ Slack เพื่อให้การเปลี่ยน default ร่วมล้มเหลวก่อน push PR ครั้งแรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างทั้ง harness จนชุด mapped ราคาถูกไม่น่าเชื่อถือพอเป็น proxy

## การ validate ด้วย Testbox

Crabbox คือ wrapper remote-box ที่ repo เป็นเจ้าของสำหรับ proof Linux ของ maintainer ใช้จาก repo root เมื่อ check กว้างเกินไปสำหรับ loop แก้ไขภายในเครื่อง, เมื่อความเทียบเท่า CI สำคัญ หรือเมื่อ proof ต้องใช้ secrets, Docker, lane package, กล่องที่ใช้ซ้ำได้ หรือ log ระยะไกล backend OpenClaw ปกติคือ `blacksmith-testbox`; capacity AWS/Hetzner ที่เป็นเจ้าของเป็น fallback สำหรับ outage ของ Blacksmith, ปัญหา quota หรือการทดสอบ capacity ที่เป็นเจ้าของอย่างชัดเจน

Crabbox ที่รองรับโดย Blacksmith จะอุ่นเครื่อง, claim, ซิงก์, รัน, รายงาน และล้างข้อมูล Testboxes แบบ one-shot การตรวจสอบความสมเหตุสมผลของการซิงก์ในตัวจะล้มเหลวอย่างรวดเร็วเมื่อไฟล์ root ที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short`
แสดงการลบไฟล์ที่ติดตามแล้วอย่างน้อย 200 รายการ สำหรับ PR ที่ตั้งใจลบไฟล์จำนวนมาก ให้ตั้งค่า
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับคำสั่งระยะไกล

Crabbox ยังยุติการเรียกใช้ Blacksmith CLI ในเครื่องที่ค้างอยู่ในเฟส
ซิงก์นานกว่าห้านาทีโดยไม่มีเอาต์พุตหลังซิงก์ ตั้งค่า
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` เพื่อปิด guard นั้น หรือใช้ค่า
มิลลิวินาทีที่มากขึ้นสำหรับ diff ในเครื่องที่ใหญ่ผิดปกติ

ก่อนรันครั้งแรก ให้ตรวจสอบ wrapper จาก repo root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Repo wrapper จะปฏิเสธ Crabbox binary ที่ล้าสมัยซึ่งไม่ประกาศ `blacksmith-testbox` ส่ง provider อย่างชัดเจนแม้ว่า `.crabbox.yaml` จะมีค่าเริ่มต้น owned-cloud อยู่แล้ว ใน Codex worktrees หรือ linked/sparse checkouts ให้หลีกเลี่ยงสคริปต์ `pnpm crabbox:run` ในเครื่อง เพราะ pnpm อาจกระทบยอด dependencies ก่อนที่ Crabbox จะเริ่มทำงาน ให้เรียกใช้ node wrapper โดยตรงแทน:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

การรันที่รองรับโดย Blacksmith ต้องใช้ Crabbox 0.22.0 หรือใหม่กว่า เพื่อให้ wrapper ได้พฤติกรรม Testbox sync, queue และ cleanup ปัจจุบัน เมื่อใช้ sibling checkout ให้ build binary ในเครื่องที่ถูก ignore ใหม่ก่อนทำงานจับเวลาหรือ proof:

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

การรัน focused test ซ้ำ:

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
ผลลัพธ์ของคำสั่ง การรัน GitHub Actions ที่ลิงก์อยู่เป็นเจ้าของ hydration และ keepalive;
อาจจบเป็น `cancelled` ได้เมื่อ Testbox ถูกหยุดจากภายนอกหลังคำสั่ง SSH
ส่งค่ากลับมาแล้ว ให้ถือว่านั่นเป็น artifact ของ cleanup/status เว้นแต่ว่า
`exitCode` ของ wrapper ไม่เป็นศูนย์ หรือเอาต์พุตคำสั่งแสดง test ที่ล้มเหลว
การรัน Crabbox แบบ one-shot ที่รองรับโดย Blacksmith ควรหยุด Testbox โดยอัตโนมัติ;
หากการรันถูกขัดจังหวะหรือ cleanup ไม่ชัดเจน ให้ตรวจสอบกล่องที่ live อยู่และหยุดเฉพาะ
กล่องที่คุณสร้าง:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

ใช้ reuse เฉพาะเมื่อคุณตั้งใจต้องการหลายคำสั่งบนกล่อง hydrated เดียวกัน:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

หาก Crabbox เป็นเลเยอร์ที่เสีย แต่ Blacksmith เองยังทำงาน ให้ใช้ Blacksmith
โดยตรงเฉพาะสำหรับการวินิจฉัย เช่น `list`, `status` และ cleanup แก้เส้นทาง
Crabbox ก่อนที่จะถือว่าการรัน Blacksmith โดยตรงเป็น maintainer proof

หาก `blacksmith testbox list --all` และ `blacksmith testbox status` ทำงาน แต่ warmups ใหม่
ค้างที่ `queued` โดยไม่มี IP หรือ URL ของ Actions run หลังผ่านไปสองสามนาที
ให้ถือว่าเป็นแรงกดดันจาก Blacksmith provider, queue, billing หรือขีดจำกัดของ org หยุด
queued ids ที่คุณสร้าง หลีกเลี่ยงการเริ่ม Testboxes เพิ่ม และย้าย proof ไปยัง
เส้นทาง capacity ของ Crabbox ที่เป็นเจ้าของด้านล่าง ระหว่างที่มีคนตรวจสอบ Blacksmith dashboard,
billing และขีดจำกัดของ org

Escalate ไปยัง capacity ของ Crabbox ที่เป็นเจ้าของเฉพาะเมื่อ Blacksmith ล่ม, ถูกจำกัด quota, ขาด environment ที่ต้องใช้ หรือ capacity ที่เป็นเจ้าของเป็นเป้าหมายอย่างชัดเจน:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

ภายใต้แรงกดดันของ AWS ให้หลีกเลี่ยง `class=beast` เว้นแต่งานนั้นต้องการ CPU ระดับ 48xlarge-class จริงๆ คำขอ `beast` เริ่มที่ 192 vCPUs และเป็นวิธีที่ง่ายที่สุดในการชน quota ระดับภูมิภาคของ EC2 Spot หรือ On-Demand Standard `.crabbox.yaml` ที่ repo เป็นเจ้าของมีค่าเริ่มต้นเป็น `standard`, capacity regions หลายรายการ และ `capacity.hints: true` ดังนั้น leases ของ AWS ที่ผ่าน broker จะพิมพ์ region/market ที่เลือก, แรงกดดัน quota, Spot fallback และคำเตือน class ที่มีแรงกดดันสูง ใช้ `fast` สำหรับการตรวจสอบกว้างที่หนักกว่า, ใช้ `large` เฉพาะหลังจาก standard/fast ไม่พอ และใช้ `beast` เฉพาะสำหรับ lane ที่ผูกกับ CPU อย่างยกเว้น เช่น full-suite หรือ Docker matrices ของทุก Plugin, การตรวจสอบ release/blocker อย่างชัดเจน หรือการทำ performance profiling แบบใช้ core สูง อย่าใช้ `beast` สำหรับ `pnpm check:changed`, focused tests, งาน docs-only, lint/typecheck ทั่วไป, E2E repro ขนาดเล็ก หรือการ triage Blacksmith outage ใช้ `--market on-demand` สำหรับการวินิจฉัย capacity เพื่อไม่ให้ความผันผวนของตลาด Spot ปนเข้ากับสัญญาณ

`.crabbox.yaml` เป็นเจ้าของค่าเริ่มต้นของ provider, sync และ GitHub Actions hydration สำหรับ lane owned-cloud โดย exclude `.git` ในเครื่อง เพื่อให้ Actions checkout ที่ hydrated รักษา metadata Git ระยะไกลของตัวเองแทนการซิงก์ remotes และ object stores ในเครื่องของ maintainer และ exclude runtime/build artifacts ในเครื่องที่ไม่ควรถูกถ่ายโอนเด็ดขาด `.github/workflows/crabbox-hydrate.yml` เป็นเจ้าของ checkout, การตั้งค่า Node/pnpm, การ fetch `origin/main` และการส่งต่อ environment ที่ไม่เป็นความลับสำหรับคำสั่ง owned-cloud `crabbox run --id <cbx_id>`

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
