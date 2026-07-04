---
read_when:
    - คุณต้องเข้าใจว่าทำไมงาน CI จึงทำงานหรือไม่ทำงาน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการรันหรือการรันซ้ำเพื่อตรวจสอบความถูกต้องของรีลีส
    - คุณกำลังเปลี่ยนการส่งงานของ ClawSweeper หรือการส่งต่อกิจกรรม GitHub
summary: กราฟงาน CI, เกตขอบเขต, ร่มครอบการเผยแพร่ และคำสั่งในเครื่องที่เทียบเท่า
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-07-04T06:55:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e97c378598fadcbaef12e5f9abd1d99261dd4594ce88ce4aa3293af0744fc5a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI ทำงานทุกครั้งที่ push ไปยัง `main` และทุก pull request การ push ไปยัง
`main` ตามมาตรฐานจะผ่านหน้าต่างรับงาน hosted-runner 90 วินาทีก่อน
กลุ่ม concurrency `CI` ที่มีอยู่จะยกเลิก run ที่กำลังรอนั้นเมื่อมี commit ใหม่กว่า
เข้ามา ดังนั้นการ merge ต่อเนื่องกันจะไม่ลงทะเบียนเมทริกซ์ Blacksmith แบบเต็มทุกครั้ง
Pull request และการ dispatch ด้วยตนเองจะข้ามการรอนี้ จากนั้นงาน `preflight`
จะจำแนก diff และปิด lane ที่มีค่าใช้จ่ายสูงเมื่อมีเพียงพื้นที่ที่ไม่เกี่ยวข้องเปลี่ยนไป
run แบบ `workflow_dispatch` ด้วยตนเองจงใจข้ามการกำหนด scope อัจฉริยะ
และกระจายงานเป็นกราฟเต็มสำหรับ release candidate และการตรวจสอบความถูกต้องวงกว้าง
lane ของ Android ยังคงเป็นแบบ opt-in ผ่าน `include_android` ความครอบคลุม Plugin เฉพาะ release
อยู่ในเวิร์กโฟลว์ [`Plugin ก่อนเผยแพร่`](#plugin-prerelease) แยกต่างหาก
และจะทำงานจาก [`การตรวจสอบความถูกต้องของ release แบบเต็ม`](#full-release-validation)
หรือการ dispatch ด้วยตนเองอย่างชัดเจนเท่านั้น

## ภาพรวม Pipeline

| งาน                                | วัตถุประสงค์                                                                                                   | เวลาที่ทำงาน                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | ตรวจจับการเปลี่ยนแปลงเฉพาะ docs, scope ที่เปลี่ยน, extension ที่เปลี่ยน และสร้าง manifest ของ CI                   | เสมอบน push และ PR ที่ไม่ใช่ draft                  |
| `runner-admission`                 | debounce 90 วินาทีบน hosted runner สำหรับการ push ไปยัง `main` ตามมาตรฐานก่อนลงทะเบียนงาน Blacksmith                | ทุก CI run; sleep เฉพาะบนการ push ไปยัง `main` ตามมาตรฐาน |
| `security-fast`                    | การตรวจจับ private key, การ audit workflow ที่เปลี่ยนผ่าน `zizmor` และการ audit lockfile สำหรับ production                 | เสมอบน push และ PR ที่ไม่ใช่ draft                  |
| `check-dependencies`               | pass เฉพาะ dependency ของ Knip สำหรับ production พร้อม guard สำหรับ allowlist ของไฟล์ที่ไม่ได้ใช้                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `build-artifacts`                  | build `dist/`, Control UI, smoke check ของ CLI ที่ build แล้ว, การตรวจ artifact ที่ build แล้วแบบฝัง, และ artifact ที่ใช้ซ้ำได้ | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-fast-core`                 | lane ตรวจความถูกต้องเร็วบน Linux เช่น bundled, protocol, QA Smoke CI และการตรวจ CI-routing                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-fast-contracts-plugins-*`  | การตรวจ contract ของ Plugin แบบ sharded สองชุด                                                                        | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-fast-contracts-channels-*` | การตรวจ contract ของ channel แบบ sharded สองชุด                                                                       | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-node-core-*`               | shard ทดสอบ core Node โดยไม่รวม channel, bundled, contract และ lane ของ extension                          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `check-*`                          | เทียบเท่า gate หลักแบบ local ที่ sharded: type ของ prod, lint, guard, type ของ test และ strict smoke                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `check-additional-*`               | สถาปัตยกรรม, boundary/prompt drift แบบ sharded, guard ของ extension, boundary ของ package และ topology ของ runtime     | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-node-compat-node22`        | lane build และ smoke สำหรับความเข้ากันได้กับ Node 22                                                                | การ dispatch CI ด้วยตนเองสำหรับ release                     |
| `check-docs`                       | การจัดรูปแบบ docs, lint และการตรวจ broken link                                                             | docs เปลี่ยน                                        |
| `skills-python`                    | Ruff + pytest สำหรับ Skills ที่มี Python หนุน                                                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python skill                       |
| `checks-windows`                   | การทดสอบ process/path เฉพาะ Windows พร้อม regression ของ import specifier ใน runtime ที่ใช้ร่วมกัน                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows                            |
| `macos-node`                       | lane ทดสอบ TypeScript บน macOS โดยใช้ artifact ที่ build แล้วร่วมกัน                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS                              |
| `macos-swift`                      | Swift lint, build และ test สำหรับแอป macOS                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS                              |
| `ios-build`                        | การสร้างโปรเจกต์ Xcode พร้อม simulator build ของแอป iOS                                                 | แอป iOS, shared app kit หรือ Swabble เปลี่ยน         |
| `android`                          | unit test ของ Android สำหรับทั้งสอง flavor พร้อม build debug APK หนึ่งชุด                                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android                            |
| `test-performance-agent`           | การปรับแต่ง slow-test ของ Codex รายวันหลังมีกิจกรรมที่เชื่อถือได้                                                 | CI บน main สำเร็จหรือ dispatch ด้วยตนเอง                  |
| `openclaw-performance`             | รายงานประสิทธิภาพ runtime ของ Kova แบบรายวัน/ตามต้องการ พร้อม lane mock-provider, deep-profile และ live GPT 5.5 | ตามกำหนดเวลาและ dispatch ด้วยตนเอง                       |

## ลำดับ Fail-fast

1. `runner-admission` รอเฉพาะการ push ไปยัง `main` ตามมาตรฐาน; push ใหม่กว่าจะยกเลิก run ก่อนการลงทะเบียน Blacksmith
2. `preflight` ตัดสินว่า lane ใดมีอยู่จริงบ้าง logic `docs-scope` และ `changed-scope` เป็น step ภายในงานนี้ ไม่ใช่งาน standalone
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` และ `skills-python` fail อย่างรวดเร็วโดยไม่รองาน artifact และเมทริกซ์ platform ที่หนักกว่า
4. `build-artifacts` ทำงานซ้อนกับ lane Linux ที่รวดเร็ว เพื่อให้ consumer ปลายน้ำเริ่มได้ทันทีที่ build ที่ใช้ร่วมกันพร้อม
5. lane ของ platform และ runtime ที่หนักกว่าจะกระจายต่อจากนั้น: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` และ `android`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่เป็น `cancelled` เมื่อ push ใหม่กว่ามาถึง PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่านั่นเป็น noise ของ CI เว้นแต่ run ล่าสุดสำหรับ ref เดียวกันก็ล้มเหลวด้วย งานเมทริกซ์ใช้ `fail-fast: false` และ `build-artifacts` รายงานความล้มเหลวของ embedded channel, core-support-boundary และ gateway-watch โดยตรงแทนการต่อคิวงาน verifier เล็ก ๆ key concurrency อัตโนมัติของ CI มีเวอร์ชัน (`CI-v7-*`) เพื่อให้ zombie ฝั่ง GitHub ในกลุ่มคิวเก่าไม่สามารถบล็อก main run ใหม่กว่าได้ไม่มีกำหนด run full-suite ด้วยตนเองใช้ `CI-manual-v1-*` และไม่ยกเลิก run ที่กำลังดำเนินอยู่

ใช้ `pnpm ci:timings`, `pnpm ci:timings:recent` หรือ `node scripts/ci-run-timings.mjs <run-id>` เพื่อสรุป wall time, queue time, งานที่ช้าที่สุด, ความล้มเหลว และ fanout barrier `pnpm-store-warmup` จาก GitHub Actions CI ยังอัปโหลดสรุป run เดียวกันเป็น artifact `ci-timings-summary` ด้วย สำหรับ timing ของ build ให้ตรวจ step `Build dist` ของงาน `build-artifacts`: `pnpm build:ci-artifacts` พิมพ์ `[build-all] phase timings:` และรวม `ui:build`; งานนี้ยังอัปโหลด artifact `startup-memory` ด้วย

สำหรับ run ของ pull request งาน timing-summary สุดท้ายจะรัน helper จาก base revision ที่เชื่อถือได้ก่อนส่ง `GH_TOKEN` ไปยัง `gh run view` วิธีนี้กัน query ที่มี token ออกจากโค้ดที่ branch ควบคุมได้ ขณะที่ยังสรุป CI run ปัจจุบันของ pull request ได้

## บริบทและหลักฐานของ PR

PR จาก contributor ภายนอกจะรัน gate สำหรับบริบทและหลักฐานของ PR จาก
`.github/workflows/real-behavior-proof.yml` เวิร์กโฟลว์จะ checkout base commit ที่เชื่อถือได้
และประเมินเฉพาะเนื้อหา PR; ไม่ execute โค้ดจาก branch ของ contributor

gate ใช้กับผู้เขียน PR ที่ไม่ใช่เจ้าของ repository, member,
collaborator หรือ bot จะผ่านเมื่อเนื้อหา PR มี section ที่ผู้เขียนเขียนเองคือ
`What Problem This Solves` และ `Evidence` หลักฐานอาจเป็น test ที่เจาะจง,
ผล CI, screenshot, recording, terminal output, การสังเกตแบบ live,
log ที่ redact แล้ว หรือ link artifact เนื้อหาให้เจตนาและการตรวจสอบความถูกต้องที่มีประโยชน์;
reviewer จะตรวจโค้ด, test และ CI เพื่อประเมินความถูกต้อง

เมื่อ check ล้มเหลว ให้อัปเดตเนื้อหา PR แทนการ push code commit อีกครั้ง

## Scope และ routing

logic ของ scope อยู่ใน `scripts/ci-changed-scope.mjs` และมี unit test ครอบคลุมใน `src/scripts/ci-changed-scope.test.ts` การ dispatch ด้วยตนเองจะข้ามการตรวจจับ changed-scope และทำให้ manifest ของ preflight ทำงานเสมือนว่าพื้นที่ที่มี scope ทุกแห่งเปลี่ยนไป

- **การแก้ไขเวิร์กโฟลว์ CI** ตรวจสอบกราฟ Node CI พร้อม workflow linting แต่ไม่บังคับให้ build native ของ Windows, iOS, Android หรือ macOS ทำงานด้วยตัวเอง; lane ของ platform เหล่านั้นยังคง scope ตามการเปลี่ยนแปลง source ของ platform
- **Workflow Sanity** รัน `actionlint`, `zizmor` กับไฟล์ YAML ของ workflow ทั้งหมด, guard การ interpolation ของ composite-action และ guard conflict-marker งาน `security-fast` ที่ scope ตาม PR ยังรัน `zizmor` กับไฟล์ workflow ที่เปลี่ยน เพื่อให้ finding ด้านความปลอดภัยของ workflow fail ตั้งแต่ต้นในกราฟ CI หลัก
- **Docs บนการ push ไปยัง `main`** ถูกตรวจโดยเวิร์กโฟลว์ `Docs` แบบ standalone ด้วย mirror ของ docs ClawHub เดียวกับที่ CI ใช้ ดังนั้นการ push ที่ผสม code+docs จะไม่ต่อคิว shard `check-docs` ของ CI เพิ่มอีก Pull request และ CI แบบ manual ยังคงรัน `check-docs` จาก CI เมื่อ docs เปลี่ยน
- **TUI PTY** ทำงานใน shard Linux Node `checks-node-core-runtime-tui-pty` สำหรับการเปลี่ยนแปลง TUI shard นี้รัน `test/vitest/vitest.tui-pty.config.ts` พร้อม `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` จึงครอบคลุมทั้ง lane fixture `TuiBackend` ที่ deterministic และ smoke `tui --local` ที่ช้ากว่าซึ่ง mock เฉพาะ endpoint ของ model ภายนอก
- **การแก้ไขเฉพาะ routing ของ CI, การแก้ไข fixture ของ core-test ราคาถูกบางรายการ และการแก้ไข helper/test-routing ของ plugin contract แบบแคบ** ใช้เส้นทาง manifest แบบ Node-only ที่เร็ว: `preflight`, security และ task `checks-fast-core` เพียง task เดียว เส้นทางนี้ข้าม build artifact, ความเข้ากันได้กับ Node 22, contract ของ channel, shard core แบบเต็ม, shard bundled-plugin และเมทริกซ์ guard เพิ่มเติมเมื่อการเปลี่ยนแปลงจำกัดอยู่ที่พื้นผิว routing หรือ helper ที่ task เร็วนั้น exercise โดยตรง
- **Windows Node checks** ถูก scope ไปยัง wrapper ของ process/path เฉพาะ Windows, helper ของ npm/pnpm/UI runner, config ของ package manager และพื้นผิวเวิร์กโฟลว์ CI ที่ execute lane นั้น; source, Plugin, install-smoke และการเปลี่ยนแปลงเฉพาะ test ที่ไม่เกี่ยวข้องจะอยู่บน lane Linux Node

กลุ่มการทดสอบ Node ที่ช้าที่สุดถูกแยกหรือปรับสมดุลเพื่อให้งานแต่ละงานยังคงเล็กโดยไม่จองรันเนอร์เกินจำเป็น: สัญญา Plugin และสัญญาช่องทางแต่ละรายการรันเป็นชาร์ดถ่วงน้ำหนักสองชุดที่รองรับด้วย Blacksmith พร้อมทางสำรองรันเนอร์ GitHub มาตรฐาน, เลน core unit fast/support รันแยกกัน, โครงสร้างพื้นฐาน core runtime ถูกแยกระหว่าง state, process/config, shared และชาร์ดโดเมน cron อีกสามชุด, auto-reply รันเป็นเวิร์กเกอร์ที่ปรับสมดุลแล้ว (โดยแยกซับทรี reply เป็นชาร์ด agent-runner, dispatch และ commands/state-routing) และคอนฟิก agentic gateway/server ถูกแยกข้ามเลน chat/auth/model/http-plugin/runtime/startup แทนการรออาร์ติแฟกต์ที่ build แล้ว CI ปกติจึงแพ็กเฉพาะชาร์ดรูปแบบ include ของโครงสร้างพื้นฐานแบบ isolated เป็นบันเดิลที่กำหนดได้แน่นอนไม่เกิน 64 ไฟล์ทดสอบ ลดเมทริกซ์ Node โดยไม่รวมชุด non-isolated command/cron, agents-core ที่มี state หรือ gateway/server เข้าด้วยกัน; ชุดทดสอบหนักแบบคงที่ยังคงใช้ 8 vCPU ส่วนเลนแบบบันเดิลและเลนน้ำหนักต่ำกว่าใช้ 4 vCPU Pull request บน repository หลักใช้แผนรับเข้างานแบบกระชับเพิ่มเติม: กลุ่มต่อคอนฟิกเดียวกันรันใน subprocess แบบ isolated ภายในแผน Linux Node ปัจจุบัน 34 งาน ดังนั้น PR เดี่ยวจะไม่ลงทะเบียนเมทริกซ์ Node เต็มที่มีมากกว่า 70 งาน การ push ไปยัง `main`, การ dispatch แบบ manual และ release gate ยังคงใช้เมทริกซ์เต็ม การทดสอบ browser, QA, media และ Plugin เบ็ดเตล็ดแบบกว้างใช้คอนฟิก Vitest เฉพาะของตนเองแทน catch-all Plugin ที่ใช้ร่วมกัน ชาร์ดรูปแบบ include บันทึกรายการเวลาโดยใช้ชื่อชาร์ด CI เพื่อให้ `.artifacts/vitest-shard-timings.json` แยกแยะคอนฟิกทั้งชุดออกจากชาร์ดที่ถูกกรองได้ `check-additional-*` เก็บงาน compile/canary ที่ผูกกับขอบเขต package ไว้ด้วยกันและแยกสถาปัตยกรรม topology ของ runtime ออกจากการครอบคลุม gateway watch; รายการ boundary guard ถูกกระจายเป็นชาร์ดหนึ่งที่หนักด้าน prompt และชาร์ดรวมหนึ่งสำหรับ guard stripe ที่เหลือ โดยแต่ละชาร์ดรัน guard อิสระที่เลือกไว้พร้อมกันและพิมพ์เวลาต่อเช็ก การเช็ก drift ของ prompt snapshot เส้นทางสำเร็จของ Codex ที่มีค่าใช้จ่ายสูงรันเป็นงานเพิ่มเติมของตัวเองเฉพาะสำหรับ CI แบบ manual และการเปลี่ยนแปลงที่กระทบ prompt เท่านั้น ดังนั้นการเปลี่ยนแปลง Node ปกติที่ไม่เกี่ยวข้องจึงไม่ต้องรอหลังการสร้าง prompt snapshot แบบ cold และชาร์ด boundary ยังคงสมดุล ขณะที่ prompt drift ยังถูกตรึงไว้กับ PR ที่เป็นสาเหตุ; flag เดียวกันข้ามการสร้าง prompt snapshot ด้วย Vitest ภายในชาร์ด core support-boundary ของอาร์ติแฟกต์ที่ build แล้ว Gateway watch, การทดสอบช่องทาง และชาร์ด core support-boundary รันพร้อมกันภายใน `build-artifacts` หลังจาก `dist/` และ `dist-runtime/` ถูก build แล้ว

เมื่อได้รับเข้าแล้ว CI บน Linux ของ repository หลักอนุญาตงานทดสอบ Node พร้อมกันได้สูงสุด 24 งาน และ
12 งานสำหรับเลน fast/check ที่เล็กกว่า; Windows และ Android คงไว้ที่สองเพราะ
พูลรันเนอร์เหล่านั้นแคบกว่า

แผน PR แบบกระชับปล่อยงาน Node 18 งานสำหรับชุดปัจจุบัน: กลุ่ม whole-config
ถูก batch ใน subprocess แบบ isolated พร้อม timeout ของ batch 120 นาที
ขณะที่กลุ่มรูปแบบ include ใช้งบงานที่มีขอบเขตเดียวกันร่วมกัน

Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` แล้วจึง build Play debug APK flavor ของ third-party ไม่มี source set หรือ manifest แยกต่างหาก; เลน unit-test ของมันยังคง compile flavor พร้อม flag BuildConfig สำหรับ SMS/call-log ขณะหลีกเลี่ยงงาน packaging debug APK ซ้ำในทุก push ที่เกี่ยวข้องกับ Android

ชาร์ด `check-dependencies` รัน `pnpm deadcode:dependencies` (pass เฉพาะ dependency ของ Knip สำหรับ production ที่ตรึงกับเวอร์ชัน Knip ล่าสุด โดยปิด minimum release age ของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบผล unused-file สำหรับ production ของ Knip กับ `scripts/deadcode-unused-files.allowlist.mjs` guard ของ unused-file จะล้มเหลวเมื่อ PR เพิ่มไฟล์ unused ใหม่ที่ยังไม่ผ่านการ review หรือทิ้งรายการ allowlist ที่เก่าไว้ ขณะยังคงพื้นผิว Plugin แบบ dynamic ที่ตั้งใจไว้, generated, build, live-test และ package bridge ที่ Knip ไม่สามารถ resolve แบบ static ได้

## การส่งต่อกิจกรรม ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` คือ bridge ฝั่งเป้าหมายจากกิจกรรมใน repository OpenClaw ไปยัง ClawSweeper มันไม่ checkout หรือ execute โค้ด pull request ที่ไม่น่าเชื่อถือ workflow สร้าง token ของ GitHub App จาก `CLAWSWEEPER_APP_PRIVATE_KEY` แล้ว dispatch payload `repository_dispatch` แบบกระชับไปยัง `openclaw/clawsweeper`

workflow มีสี่เลน:

- `clawsweeper_item` สำหรับคำขอ review issue และ pull request ที่ระบุแน่นอน;
- `clawsweeper_comment` สำหรับคำสั่ง ClawSweeper ที่ระบุชัดเจนในคอมเมนต์ issue;
- `clawsweeper_commit_review` สำหรับคำขอ review ระดับ commit บนการ push ไปยัง `main`;
- `github_activity` สำหรับกิจกรรม GitHub ทั่วไปที่ agent ClawSweeper อาจตรวจสอบ

เลน `github_activity` ส่งต่อเฉพาะ metadata ที่ normalize แล้ว: ประเภท event, action, actor, repository, หมายเลข item, URL, title, state และข้อความคัดย่อสั้นสำหรับคอมเมนต์หรือ review เมื่อมี โดยจงใจหลีกเลี่ยงการส่งต่อ webhook body ทั้งหมด workflow ฝั่งรับใน `openclaw/clawsweeper` คือ `.github/workflows/github-activity.yml` ซึ่งโพสต์ event ที่ normalize แล้วไปยัง hook ของ OpenClaw Gateway สำหรับ agent ClawSweeper

กิจกรรมทั่วไปคือการสังเกต ไม่ใช่การส่งโดยค่าเริ่มต้น agent ClawSweeper ได้รับเป้าหมาย Discord ใน prompt และควรโพสต์ไปยัง `#clawsweeper` เฉพาะเมื่อ event นั้นน่าประหลาดใจ ดำเนินการได้ มีความเสี่ยง หรือมีประโยชน์เชิงปฏิบัติการ การเปิด แก้ไข ความเคลื่อนไหวของ bot เสียงรบกวน webhook ซ้ำ และทราฟฟิก review ปกติควรให้ผลลัพธ์เป็น `NO_REPLY`

ปฏิบัติกับ title, comment, body, review text, branch name และ commit message ของ GitHub เป็นข้อมูลที่ไม่น่าเชื่อถือตลอดเส้นทางนี้ สิ่งเหล่านี้เป็น input สำหรับการสรุปและ triage ไม่ใช่คำสั่งสำหรับ workflow หรือ runtime ของ agent

## การ dispatch แบบ manual

การ dispatch CI แบบ manual รันกราฟงานเดียวกับ CI ปกติ แต่บังคับเปิดทุกเลนที่มี scope และไม่ใช่ Android: ชาร์ด Linux Node, ชาร์ด bundled-plugin, ชาร์ดสัญญา Plugin และช่องทาง, ความเข้ากันได้กับ Node 22, `check-*`, `check-additional-*`, smoke check ของอาร์ติแฟกต์ที่ build แล้ว, docs check, Python skills, Windows, macOS, iOS build และ Control UI i18n การ dispatch CI แบบ manual เดี่ยวรัน Android เท่านั้นด้วย `include_android=true`; umbrella ของ release เต็มเปิด Android โดยส่ง `include_android=true` static check ก่อน release ของ Plugin, ชาร์ด `agentic-plugins` เฉพาะ release, sweep batch ของ extension แบบเต็ม และเลน Docker ก่อน release ของ Plugin ถูกยกเว้นจาก CI ชุด Docker ก่อน release จะรันเฉพาะเมื่อ `Full Release Validation` dispatch workflow `Plugin Prerelease` แยกต่างหากโดยเปิด gate release-validation

การรันแบบ manual ใช้ concurrency group ที่ไม่ซ้ำกันเพื่อไม่ให้ชุดเต็มของ release candidate ถูกยกเลิกโดย push หรือ PR run อื่นบน ref เดียวกัน input `target_ref` แบบ optional ช่วยให้ caller ที่น่าเชื่อถือรันกราฟนั้นกับ branch, tag หรือ commit SHA แบบเต็มได้ ขณะใช้ไฟล์ workflow จาก dispatch ref ที่เลือก

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## รันเนอร์

| รันเนอร์                          | งาน                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | การ dispatch CI แบบ manual และ fallback ของ repository ที่ไม่ใช่หลัก, quality scan ของ CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, docs workflow นอก CI และ install-smoke preflight เพื่อให้เมทริกซ์ Blacksmith เข้าคิวได้เร็วขึ้น                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, ชาร์ด extension น้ำหนักต่ำกว่า, `checks-fast-core` ยกเว้น QA Smoke CI, ชาร์ดสัญญา Plugin/channel, ชาร์ด Linux Node แบบ bundled/น้ำหนักต่ำกว่าส่วนใหญ่, `check-guards`, `check-prod-types`, `check-test-types`, ชาร์ด `check-additional-*` ที่เลือกไว้ และ `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | ชุด Linux Node หนักที่ยังคงไว้, ชาร์ด `check-additional-*` ที่หนักด้าน boundary/extension และ `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` ใน CI และ Testbox, `check-lint` (ไวต่อ CPU มากพอที่ 8 vCPU มีต้นทุนมากกว่าที่ประหยัดได้); Docker build ของ install-smoke (เวลาคิว 32-vCPU มีต้นทุนมากกว่าที่ประหยัดได้)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` บน `openclaw/openclaw`; fork fallback ไปยัง `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` และ `ios-build` บน `openclaw/openclaw`; fork fallback ไปยัง `macos-26`                                                                                                                                                                                                                     |

## งบประมาณการลงทะเบียนรันเนอร์

bucket การลงทะเบียนรันเนอร์ GitHub ปัจจุบันของ OpenClaw รายงานการลงทะเบียนรันเนอร์
self-hosted 10,000 ครั้งต่อ 5 นาทีใน `ghx api rate_limit` ให้ตรวจสอบ
`actions_runner_registration` ซ้ำก่อนการปรับแต่งแต่ละรอบ เพราะ GitHub สามารถเปลี่ยน
bucket นี้ได้ ขีดจำกัดนี้ใช้ร่วมกันโดยการลงทะเบียนรันเนอร์ Blacksmith ทั้งหมดใน
องค์กร `openclaw` ดังนั้นการเพิ่มการติดตั้ง Blacksmith อีกชุดไม่ได้เพิ่ม
bucket ใหม่

ให้ถือว่า label ของ Blacksmith เป็นทรัพยากรขาดแคลนสำหรับการควบคุม burst งานที่
ทำเพียง route, notify, summarize, select shard หรือรัน CodeQL scan สั้น ๆ ควร
อยู่บนรันเนอร์ GitHub-hosted เว้นแต่มีความจำเป็นเฉพาะ Blacksmith ที่วัดผลแล้ว
เมทริกซ์ Blacksmith ใหม่ใด ๆ, `max-parallel` ที่ใหญ่ขึ้น หรือ
workflow ความถี่สูงต้องแสดงจำนวนการลงทะเบียนกรณีเลวร้ายที่สุดและรักษาเป้าหมาย
ระดับองค์กรให้ต่ำกว่าประมาณ 60% ของ bucket สด ด้วย bucket ปัจจุบันที่มีการลงทะเบียน
10,000 ครั้ง นั่นหมายถึงเป้าหมายปฏิบัติการ 6,000 การลงทะเบียน โดยเหลือ headroom สำหรับ
repository ที่รันพร้อมกัน, retry และ burst ที่ซ้อนทับกัน

CI ของ repository หลักคง Blacksmith เป็นเส้นทางรันเนอร์เริ่มต้นสำหรับการรัน push และ pull request ปกติ `workflow_dispatch` และการรัน repository ที่ไม่ใช่หลักใช้รันเนอร์ GitHub-hosted แต่การรันบน repository หลักตามปกติยังไม่ตรวจสอบสุขภาพคิว Blacksmith หรือ fallback อัตโนมัติไปยัง label GitHub-hosted เมื่อ Blacksmith ไม่พร้อมใช้งานในปัจจุบัน

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

`OpenClaw Performance` คือเวิร์กโฟลว์ประสิทธิภาพของผลิตภัณฑ์/รันไทม์ เวิร์กโฟลว์นี้ทำงานทุกวันบน `main` และสามารถสั่งทำงานด้วยตนเองได้:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

โดยปกติ การสั่งทำงานด้วยตนเองจะเบนช์มาร์ก ref ของเวิร์กโฟลว์ ตั้งค่า `target_ref` เพื่อเบนช์มาร์กแท็กรีลีสหรือสาขาอื่นด้วยการใช้งานเวิร์กโฟลว์ปัจจุบัน พาธรายงานที่เผยแพร่และตัวชี้ล่าสุดจะถูกกำหนดคีย์ตาม ref ที่ทดสอบ และ `index.md` แต่ละไฟล์จะบันทึก ref/SHA ที่ทดสอบ, ref/SHA ของเวิร์กโฟลว์, ref ของ Kova, โปรไฟล์, โหมดการอนุญาตของเลน, โมเดล, จำนวนรอบที่ทำซ้ำ และตัวกรองสถานการณ์

เวิร์กโฟลว์ติดตั้ง OCM จากรีลีสที่ปักหมุดไว้และ Kova จาก `openclaw/Kova` ที่อินพุต `kova_ref` ที่ปักหมุดไว้ จากนั้นรันสามเลน:

- `mock-provider`: สถานการณ์วินิจฉัยของ Kova กับรันไทม์ที่บิลด์ในเครื่องพร้อมการยืนยันตัวตนปลอมที่เข้ากันได้กับ OpenAI แบบกำหนดผลซ้ำได้
- `mock-deep-profile`: การทำโปรไฟล์ CPU/ฮีป/เทรซสำหรับจุดร้อนของการเริ่มต้นระบบ, Gateway และรอบการทำงานของเอเจนต์
- `live-openai-candidate`: รอบการทำงานของเอเจนต์ OpenAI จริง `openai/gpt-5.5` ซึ่งจะข้ามเมื่อไม่มี `OPENAI_API_KEY`

เลน mock-provider ยังรันโพรบซอร์สแบบเนทีฟของ OpenClaw หลังจากผ่าน Kova แล้ว ได้แก่ เวลาบูต Gateway และหน่วยความจำในกรณีเริ่มต้นระบบแบบค่าเริ่มต้น, hook และ 50 Plugin; RSS การอิมพอร์ต Plugin ที่รวมมา, ลูป hello ของ `channel-chat-baseline` แบบ mock-OpenAI ซ้ำ, คำสั่งเริ่มต้น CLI กับ Gateway ที่บูตแล้ว และโพรบประสิทธิภาพ smoke ของสถานะ SQLite เมื่อรายงานซอร์ส mock-provider ที่เผยแพร่ก่อนหน้าพร้อมใช้งานสำหรับ ref ที่ทดสอบ สรุปซอร์สจะเปรียบเทียบค่า RSS และฮีปปัจจุบันกับ baseline นั้น และทำเครื่องหมายการเพิ่มขึ้นของ RSS ขนาดใหญ่ว่า `watch` สรุป Markdown ของโพรบซอร์สอยู่ที่ `source/index.md` ในชุดรายงาน โดยมี JSON ดิบอยู่ข้างๆ

ทุกเลนอัปโหลดอาร์ติแฟกต์ GitHub เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว เวิร์กโฟลว์จะคอมมิต `report.json`, `report.md`, ชุดไฟล์, `index.md` และอาร์ติแฟกต์โพรบซอร์สเข้าไปใน `openclaw/clawgrit-reports` ภายใต้ `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` ด้วย ตัวชี้ tested-ref ปัจจุบันจะถูกเขียนเป็น `openclaw-performance/<tested-ref>/latest-<lane>.json`

## การตรวจสอบความถูกต้องของรีลีสเต็มรูปแบบ

`Full Release Validation` คือเวิร์กโฟลว์ครอบคลุมแบบสั่งด้วยตนเองสำหรับ “รันทุกอย่างก่อนรีลีส” เวิร์กโฟลว์นี้รับสาขา, แท็ก หรือ SHA คอมมิตเต็ม สั่งทำงานเวิร์กโฟลว์ `CI` แบบสั่งด้วยตนเองด้วยเป้าหมายนั้น, สั่งทำงาน `Plugin Prerelease` สำหรับหลักฐานเฉพาะรีลีสของ Plugin/แพ็กเกจ/สแตติก/Docker และสั่งทำงาน `OpenClaw Release Checks` สำหรับ smoke การติดตั้ง, การยอมรับแพ็กเกจ, การตรวจแพ็กเกจข้ามระบบปฏิบัติการ, การเรนเดอร์ maturity scorecard จากหลักฐานโปรไฟล์ QA, ความเท่าเทียมของ QA Lab, Matrix และเลน Telegram โปรไฟล์ stable และ full จะรวมความครอบคลุม live/E2E แบบละเอียดครบถ้วนและการ soak เส้นทางรีลีส Docker เสมอ ส่วนโปรไฟล์ beta สามารถเลือกเปิดได้ด้วย `run_release_soak=true` E2E ของ Telegram สำหรับแพ็กเกจ canonical จะรันอยู่ภายใน Package Acceptance ดังนั้นตัวเลือก full candidate จะไม่เริ่ม live poller ซ้ำ หลังเผยแพร่ ให้ส่ง `release_package_spec` เพื่อใช้แพ็กเกจ npm ที่ส่งมอบแล้วซ้ำใน release checks, Package Acceptance, Docker, ข้ามระบบปฏิบัติการ และ Telegram โดยไม่ต้องบิลด์ใหม่ ใช้ `npm_telegram_package_spec` เฉพาะสำหรับการรัน Telegram ซ้ำแบบเจาะจงแพ็กเกจที่เผยแพร่แล้ว เลนแพ็กเกจสดของ Codex Plugin ใช้สถานะที่เลือกเดียวกันเป็นค่าเริ่มต้น: `release_package_spec=openclaw@<tag>` ที่เผยแพร่แล้วจะอนุมาน `codex_plugin_spec=npm:@openclaw/codex@<tag>` ส่วนการรันแบบ SHA/อาร์ติแฟกต์จะแพ็ก `extensions/codex` จาก ref ที่เลือก ตั้งค่า `codex_plugin_spec` อย่างชัดเจนสำหรับซอร์ส Plugin แบบกำหนดเอง เช่นสเปก `npm:`, `npm-pack:` หรือ `git:`

ดู [การตรวจสอบความถูกต้องของรีลีสเต็มรูปแบบ](/th/reference/full-release-validation) สำหรับเมทริกซ์สเตจ ชื่องานเวิร์กโฟลว์ที่แน่นอน ความแตกต่างของโปรไฟล์ อาร์ติแฟกต์ และตัวระบุการรันซ้ำแบบเจาะจง

`OpenClaw Release Publish` คือเวิร์กโฟลว์รีลีสแบบสั่งด้วยตนเองที่มีการเปลี่ยนแปลงสถานะ สั่งทำงานจาก `release/YYYY.M.PATCH` หรือ `main` หลังจากแท็กรีลีสมีอยู่แล้วและหลังจาก OpenClaw npm preflight สำเร็จ เวิร์กโฟลว์จะตรวจสอบ `pnpm plugins:sync:check`, สั่งทำงาน `Plugin NPM Release` สำหรับแพ็กเกจ Plugin ทั้งหมดที่เผยแพร่ได้, สั่งทำงาน `Plugin ClawHub Release` สำหรับ SHA รีลีสเดียวกัน และจากนั้นจึงสั่งทำงาน `OpenClaw NPM Release` ด้วย `preflight_run_id` ที่บันทึกไว้ การเผยแพร่ stable ยังต้องใช้ `windows_node_tag` ที่ตรงกันแบบ exact; เวิร์กโฟลว์จะตรวจสอบรีลีสซอร์ส Windows และเปรียบเทียบตัวติดตั้ง x64/ARM64 กับอินพุต `windows_node_installer_digests` ที่ candidate อนุมัติแล้วก่อน child ใดๆ ของการเผยแพร่ จากนั้นจึงโปรโมตและตรวจสอบ digest ของตัวติดตั้งที่ปักหมุดชุดเดิม รวมถึงอาร์ติแฟกต์คู่และสัญญา checksum ที่แน่นอนก่อนเผยแพร่ฉบับร่าง GitHub release

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

สำหรับหลักฐานคอมมิตที่ปักหมุดบนสาขาที่เคลื่อนไหวเร็ว ให้ใช้ตัวช่วยแทน `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

ref สำหรับการสั่งทำงานเวิร์กโฟลว์ GitHub ต้องเป็นสาขาหรือแท็ก ไม่ใช่ SHA คอมมิตดิบ ตัวช่วยจะพุชสาขาชั่วคราว `release-ci/<sha>-...` ที่ SHA เป้าหมาย, สั่งทำงาน `Full Release Validation` จาก ref ที่ปักหมุดนั้น, ตรวจสอบว่า `headSha` ของเวิร์กโฟลว์ child ทุกตัวตรงกับเป้าหมาย และลบสาขาชั่วคราวเมื่อการรันเสร็จสมบูรณ์ ตัวตรวจสอบ umbrella จะล้มเหลวด้วยหากมีเวิร์กโฟลว์ child ใดรันที่ SHA อื่น

`release_profile` ควบคุมความกว้างของ live/provider ที่ส่งเข้าไปใน release checks เวิร์กโฟลว์รีลีสแบบสั่งด้วยตนเองมีค่าเริ่มต้นเป็น `stable`; ใช้ `full` เฉพาะเมื่อคุณตั้งใจต้องการเมทริกซ์ provider/media เชิงคำแนะนำที่กว้าง การตรวจ release checks แบบ stable และ full จะรัน live/E2E แบบละเอียดครบถ้วนและการ soak เส้นทางรีลีส Docker เสมอ ส่วนโปรไฟล์ beta สามารถเลือกเปิดได้ด้วย `run_release_soak=true`

- `minimum` เก็บเลน OpenAI/core ที่เร็วที่สุดและสำคัญต่อรีลีสไว้
- `stable` เพิ่มชุด provider/backend แบบ stable
- `full` รันเมทริกซ์ provider/media เชิงคำแนะนำที่กว้าง

umbrella จะบันทึก run id ของ child ที่สั่งทำงาน และงานสุดท้าย `Verify full validation` จะตรวจซ้ำผลสรุปการรัน child ปัจจุบันและต่อท้ายตารางงานที่ช้าที่สุดสำหรับการรัน child แต่ละตัว หากเวิร์กโฟลว์ child ถูกรันซ้ำและกลายเป็นสถานะผ่าน ให้รันซ้ำเฉพาะงานตรวจสอบของ parent เพื่อรีเฟรชผล umbrella และสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รับ `rerun_group` ใช้ `all` สำหรับ release candidate, `ci` สำหรับ child CI เต็มรูปแบบปกติเท่านั้น, `plugin-prerelease` สำหรับ child prerelease ของ Plugin เท่านั้น, `release-checks` สำหรับ child รีลีสทุกตัว หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` หรือ `npm-telegram` บน umbrella วิธีนี้ช่วยจำกัดการรันซ้ำของ release box ที่ล้มเหลวหลังการแก้ไขแบบเจาะจง สำหรับเลนข้ามระบบปฏิบัติการที่ล้มเหลวหนึ่งเลน ให้รวม `rerun_group=cross-os` กับ `cross_os_suite_filter` เช่น `windows/packaged-upgrade`; คำสั่งข้ามระบบปฏิบัติการที่ใช้เวลานานจะปล่อยบรรทัด Heartbeat และสรุป packaged-upgrade จะรวมเวลารายเฟส เลน QA release-check เป็นเชิงคำแนะนำ ยกเว้นเกตความครอบคลุมเครื่องมือรันไทม์มาตรฐาน ซึ่งจะบล็อกเมื่อเครื่องมือไดนามิกของ OpenClaw ที่จำเป็นคลาดเคลื่อนหรือหายไปจากสรุประดับมาตรฐาน

`OpenClaw Release Checks` ใช้ ref เวิร์กโฟลว์ที่เชื่อถือได้เพื่อ resolve ref ที่เลือกหนึ่งครั้งเป็น tarball `release-package-under-test` จากนั้นส่งอาร์ติแฟกต์นั้นไปยังการตรวจข้ามระบบปฏิบัติการและ Package Acceptance รวมถึงเวิร์กโฟลว์ Docker เส้นทางรีลีส live/E2E เมื่อรันความครอบคลุมแบบ soak วิธีนี้ทำให้ไบต์ของแพ็กเกจสอดคล้องกันทั่ว release boxes และหลีกเลี่ยงการแพ็ก candidate เดิมซ้ำในงาน child หลายงาน สำหรับเลนสด npm-plugin ของ Codex นั้น release checks จะส่งสเปก Plugin ที่เผยแพร่แล้วซึ่งตรงกันและอนุมานจาก `release_package_spec`, ส่ง `codex_plugin_spec` ที่ผู้ปฏิบัติการระบุ หรือปล่อยอินพุตว่างไว้เพื่อให้สคริปต์ Docker แพ็ก Codex Plugin ของ checkout ที่เลือก

การรัน `Full Release Validation` ซ้ำสำหรับ `ref=main` และ `rerun_group=all` จะแทนที่ umbrella ที่เก่ากว่า มอนิเตอร์ parent จะยกเลิกเวิร์กโฟลว์ child ใดๆ ที่เคยสั่งทำงานแล้วเมื่อ parent ถูกยกเลิก ดังนั้นการตรวจสอบ main ที่ใหม่กว่าจะไม่ค้างอยู่หลังการรัน release-check เก่าที่ใช้เวลาสองชั่วโมง การตรวจสอบสาขา/แท็กรีลีสและกลุ่มรันซ้ำแบบเจาะจงจะคง `cancel-in-progress: false`

## ชาร์ด Live และ E2E

child live/E2E ของรีลีสยังคงความครอบคลุม `pnpm test:live` แบบเนทีฟที่กว้าง แต่รันเป็นชาร์ดที่มีชื่อผ่าน `scripts/test-live-shard.mjs` แทนงาน serial เดียว:

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
- ชาร์ดสื่อเสียง/วิดีโอที่แยกออก และชาร์ดเพลงที่กรองตาม provider

วิธีนี้คงความครอบคลุมไฟล์เดิมไว้ ขณะทำให้ความล้มเหลวของ live provider ที่ช้าง่ายต่อการรันซ้ำและวินิจฉัย ชื่อชาร์ดรวม `native-live-extensions-o-z`, `native-live-extensions-media` และ `native-live-extensions-media-music` ยังคงใช้ได้สำหรับการรันซ้ำแบบครั้งเดียวด้วยตนเอง

ชาร์ดสื่อ native live รันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งบิลด์โดยเวิร์กโฟลว์ `Live Media Runner Image` อิมเมจนั้นติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้า งานสื่อจะตรวจสอบเฉพาะไบนารีก่อนตั้งค่าเท่านั้น ให้คงชุดทดสอบ live ที่รองรับด้วย Docker ไว้บน runner Blacksmith ปกติ เพราะงาน container ไม่ใช่ที่ที่เหมาะสำหรับเปิดการทดสอบ Docker ซ้อนกัน

Docker-backed live model/backend shards ใช้อิมเมจ `ghcr.io/openclaw/openclaw-live-test:<sha>` ที่แชร์แยกต่างหากต่อคอมมิตที่เลือกแต่ละรายการ เวิร์กโฟลว์รีลีสแบบ live จะสร้างและพุชอิมเมจนั้นหนึ่งครั้ง จากนั้น Docker live model, provider-sharded gateway, CLI backend, ACP bind และ Codex harness shards จะรันด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` Gateway Docker shards มีเพดาน `timeout` ระดับสคริปต์ที่ระบุชัดเจน ต่ำกว่า timeout ของงานเวิร์กโฟลว์ เพื่อให้คอนเทนเนอร์ที่ค้างหรือเส้นทาง cleanup ที่ค้างล้มเหลวเร็ว แทนที่จะใช้เวลาทั้งหมดของงบประมาณ release-check หาก shards เหล่านั้น rebuild เป้าหมาย Docker ของซอร์สเต็มรูปแบบแยกกัน รีลีสรันนั้นกำหนดค่าผิดและจะเสีย wall clock ไปกับการสร้างอิมเมจซ้ำ

## การยอมรับแพ็กเกจ

ใช้ `Package Acceptance` เมื่อคำถามคือ "แพ็กเกจ OpenClaw ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์หรือไม่?" สิ่งนี้ต่างจาก CI ปกติ: CI ปกติตรวจสอบความถูกต้องของ source tree ส่วน package acceptance ตรวจสอบ tarball เดียวผ่าน Docker E2E harness เดียวกับที่ผู้ใช้ใช้งานหลังติดตั้งหรืออัปเดต

### งาน

1. `resolve_package` checkout `workflow_ref`, resolve ผู้สมัครแพ็กเกจหนึ่งรายการ, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, อัปโหลดทั้งสองเป็น artifact `package-under-test` และพิมพ์ source, workflow ref, package ref, เวอร์ชัน, SHA-256 และโปรไฟล์ในสรุปขั้นตอนของ GitHub
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` เวิร์กโฟลว์ที่ใช้ซ้ำได้จะดาวน์โหลด artifact นั้น ตรวจสอบ inventory ของ tarball, เตรียมอิมเมจ Docker แบบ package-digest เมื่อจำเป็น และรัน Docker lanes ที่เลือกกับแพ็กเกจนั้นแทนการ pack workflow checkout เมื่อโปรไฟล์เลือก `docker_lanes` แบบเจาะจงหลายรายการ เวิร์กโฟลว์ที่ใช้ซ้ำได้จะเตรียมแพ็กเกจและอิมเมจที่แชร์หนึ่งครั้ง จากนั้นกระจาย lanes เหล่านั้นออกเป็นงาน Docker แบบเจาะจงที่รันขนานพร้อม artifacts ที่ไม่ซ้ำกัน
3. `package_telegram` เรียก `NPM Telegram Beta E2E` แบบไม่บังคับ โดยจะรันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้ง artifact `package-under-test` เดียวกันเมื่อ Package Acceptance resolve ได้หนึ่งรายการ; การ dispatch Telegram แบบสแตนด์อโลนยังคงติดตั้ง npm spec ที่เผยแพร่แล้วได้
4. `summary` ทำให้เวิร์กโฟลว์ล้มเหลวหาก package resolution, Docker acceptance หรือ Telegram lane แบบไม่บังคับล้มเหลว

### แหล่งที่มาของผู้สมัคร

- `source=npm` ยอมรับเฉพาะ `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรีลีส OpenClaw แบบแน่นอน เช่น `openclaw@2026.4.27-beta.2` ใช้ตัวเลือกนี้สำหรับการยอมรับ prerelease/stable ที่เผยแพร่แล้ว
- `source=ref` pack branch, tag หรือ commit SHA แบบเต็มของ `package_ref` ที่เชื่อถือได้ resolver จะ fetch branches/tags ของ OpenClaw, ตรวจสอบว่าคอมมิตที่เลือกเข้าถึงได้จากประวัติ branch ของ repository หรือ release tag, ติดตั้ง deps ใน worktree แบบ detached และ pack ด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` ดาวน์โหลด `.tgz` แบบ HTTPS สาธารณะ; ต้องระบุ `package_sha256` เส้นทางนี้ปฏิเสธ URL credentials, พอร์ต HTTPS ที่ไม่ใช่ค่าเริ่มต้น, hostnames หรือ IPs ที่ resolve แล้วที่เป็น private/internal/special-use และ redirect ที่อยู่นอกนโยบายความปลอดภัยสาธารณะเดียวกัน
- `source=trusted-url` ดาวน์โหลด `.tgz` แบบ HTTPS จากนโยบาย trusted-source ที่มีชื่อใน `.github/package-trusted-sources.json`; ต้องระบุ `package_sha256` และ `trusted_source_id` ใช้ตัวเลือกนี้เฉพาะกับ enterprise mirrors หรือ private package repositories ที่ maintainer เป็นเจ้าของ ซึ่งต้องใช้ hosts, ports, path prefixes, redirect hosts หรือ private-network resolution ที่กำหนดค่าไว้ หากนโยบายประกาศ bearer auth เวิร์กโฟลว์จะใช้ secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN` แบบตายตัว; credentials ที่ฝังใน URL ยังคงถูกปฏิเสธ
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งรายการจาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็นทางเลือก แต่ควรระบุสำหรับ artifacts ที่แชร์ภายนอก

แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือโค้ดเวิร์กโฟลว์/harness ที่เชื่อถือได้ซึ่งรันการทดสอบ `package_ref` คือคอมมิตซอร์สที่จะถูก pack เมื่อ `source=ref` สิ่งนี้ทำให้ test harness ปัจจุบันตรวจสอบคอมมิตซอร์สเก่าที่เชื่อถือได้โดยไม่รันตรรกะเวิร์กโฟลว์เก่า

### โปรไฟล์ชุดทดสอบ

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` บวก `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunks ของเส้นทางรีลีส Docker แบบเต็มพร้อม OpenWebUI
- `custom` — `docker_lanes` แบบแน่นอน; จำเป็นเมื่อ `suite_profile=custom`

โปรไฟล์ `package` ใช้ความครอบคลุม plugin แบบออฟไลน์ เพื่อให้การตรวจสอบแพ็กเกจที่เผยแพร่แล้วไม่ถูกกั้นด้วยความพร้อมใช้งานของ ClawHub แบบ live Telegram lane แบบไม่บังคับใช้ artifact `package-under-test` ซ้ำใน `NPM Telegram Beta E2E` โดยคงเส้นทาง npm spec ที่เผยแพร่แล้วไว้สำหรับการ dispatch แบบสแตนด์อโลน

สำหรับนโยบายเฉพาะด้านการทดสอบอัปเดตและ plugin รวมถึงคำสั่ง local,
Docker lanes, อินพุต Package Acceptance, ค่าเริ่มต้นของรีลีส และการ triage ความล้มเหลว,
ดู [การทดสอบการอัปเดตและ plugins](/th/help/testing-updates-plugins)

Release checks เรียก Package Acceptance ด้วย `source=artifact`, artifact แพ็กเกจรีลีสที่เตรียมไว้, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` และ `telegram_mode=mock-openai` สิ่งนี้ทำให้ package migration, update, การติดตั้ง live ClawHub skill, stale-plugin-dependency cleanup, configured-plugin install repair, offline plugin, plugin-update และหลักฐาน Telegram อยู่บน package tarball ที่ resolve เดียวกัน ตั้งค่า `release_package_spec` บน Full Release Validation หรือ OpenClaw Release Checks หลังเผยแพร่ beta เพื่อรัน matrix เดียวกันกับแพ็กเกจ npm ที่จัดส่งแล้วโดยไม่ rebuild; ตั้งค่า `package_acceptance_package_spec` เฉพาะเมื่อ Package Acceptance ต้องใช้แพ็กเกจที่ต่างจากส่วนที่เหลือของ release validation Cross-OS release checks ยังคงครอบคลุม onboarding, installer และพฤติกรรมแพลตฟอร์มเฉพาะ OS; การตรวจสอบผลิตภัณฑ์ package/update ควรเริ่มจาก Package Acceptance Docker lane `published-upgrade-survivor` ตรวจสอบ package baseline ที่เผยแพร่แล้วหนึ่งรายการต่อรันในเส้นทางรีลีสแบบ blocking ใน Package Acceptance tarball `package-under-test` ที่ resolve แล้วจะเป็นผู้สมัครเสมอ และ `published_upgrade_survivor_baseline` เลือก fallback published baseline โดยมีค่าเริ่มต้นเป็น `openclaw@latest`; คำสั่ง rerun ของ lane ที่ล้มเหลวจะรักษา baseline นั้นไว้ Full Release Validation ที่มี `run_release_soak=true` หรือ `release_profile=full` ตั้งค่า `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` และ `published_upgrade_survivor_scenarios=reported-issues` เพื่อขยายให้ครอบคลุม npm releases แบบ stable ล่าสุดสี่รายการ บวก releases ขอบเขต plugin-compatibility ที่ปักหมุดไว้ และ fixtures รูปแบบ issue สำหรับ config ของ Feishu, ไฟล์ bootstrap/persona ที่ถูกรักษาไว้, การติดตั้ง OpenClaw plugin ที่กำหนดค่าไว้, เส้นทาง log แบบ tilde และ roots ของ legacy plugin dependency ที่ค้างอยู่ การเลือก published-upgrade survivor แบบหลาย baseline จะถูก shard ตาม baseline เป็นงาน Docker runner แบบเจาะจงแยกกัน เวิร์กโฟลว์ `Update Migration` แยกต่างหากใช้ Docker lane `update-migration` กับ `all-since-2026.4.23` และ `plugin-deps-cleanup` เมื่อคำถามคือ cleanup การอัปเดตที่เผยแพร่แล้วแบบครอบคลุม ไม่ใช่ขอบเขต CI ของ Full Release ปกติ การรัน aggregate แบบ local สามารถส่ง package specs แบบแน่นอนได้ด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, คง lane เดียวไว้ด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` เช่น `openclaw@2026.4.15` หรือตั้งค่า `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` สำหรับ scenario matrix lane ที่เผยแพร่แล้วกำหนดค่า baseline ด้วย recipe คำสั่ง `openclaw config set` ที่ baked ไว้ บันทึกขั้นตอน recipe ใน `summary.json` และ probe `/healthz`, `/readyz` พร้อมสถานะ RPC หลัง Gateway เริ่มทำงาน lanes แบบ packaged และ installer fresh บน Windows ยังตรวจสอบด้วยว่าแพ็กเกจที่ติดตั้งแล้วสามารถ import browser-control override จาก raw absolute Windows path ได้ smoke ของ agent-turn แบบ cross-OS ของ OpenAI ใช้ค่าเริ่มต้นเป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อตั้งค่าไว้ มิฉะนั้นใช้ `openai/gpt-5.5` เพื่อให้หลักฐาน install และ gateway อยู่บนโมเดลทดสอบ GPT-5 พร้อมหลีกเลี่ยงค่าเริ่มต้น GPT-4.x

### หน้าต่างความเข้ากันได้แบบ legacy

Package Acceptance มีหน้าต่าง legacy-compatibility แบบมีขอบเขตสำหรับแพ็กเกจที่เผยแพร่แล้ว แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้เส้นทาง compatibility:

- รายการ QA ส่วนตัวที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ถูกละไว้จาก tarball;
- `doctor-switch` อาจข้าม subcase การคงอยู่ของ `gateway install --wrapper` เมื่อแพ็กเกจไม่ expose flag นั้น;
- `update-channel-switch` อาจ prune `patchedDependencies` ของ pnpm ที่หายไปจาก fixture git ปลอมที่ได้จาก tarball และอาจ log `update.channel` ที่คงอยู่ซึ่งหายไป;
- plugin smokes อาจอ่านตำแหน่ง install-record แบบ legacy หรือยอมรับการไม่มี marketplace install-record persistence;
- `plugin-update` อาจอนุญาตการย้าย config metadata ในขณะที่ยังคงต้องให้ install record และพฤติกรรม no-reinstall ไม่เปลี่ยนแปลง

แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ stamp ของ build metadata แบบ local ที่ถูกจัดส่งไปแล้วได้เช่นกัน แพ็กเกจที่ใหม่กว่าต้องเป็นไปตาม contracts สมัยใหม่; เงื่อนไขเดียวกันจะล้มเหลวแทนที่จะเตือนหรือข้าม

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

เมื่อ debug การรัน package acceptance ที่ล้มเหลว ให้เริ่มที่สรุป `resolve_package` เพื่อยืนยันแหล่งที่มาของแพ็กเกจ เวอร์ชัน และ SHA-256 จากนั้นตรวจสอบ child run `docker_acceptance` และ Docker artifacts ของมัน: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase timings และคำสั่ง rerun ควร rerun โปรไฟล์แพ็กเกจที่ล้มเหลวหรือ Docker lanes แบบแน่นอน แทนการ rerun full release validation

## Install smoke

เวิร์กโฟลว์ `Install Smoke` แยกต่างหากใช้สคริปต์ scope เดียวกันซ้ำผ่านงาน `preflight` ของตัวเอง โดยแบ่งความครอบคลุม smoke เป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **เส้นทางเร็ว** ทำงานสำหรับคำขอดึงรวมที่แตะพื้นผิว Docker/package, การเปลี่ยนแปลง package/manifest ของ Plugin ที่บันเดิลมา, หรือพื้นผิว core plugin/channel/gateway/Plugin SDK ที่งาน Docker smoke ครอบคลุม การเปลี่ยนแปลง Plugin ที่บันเดิลมาแบบซอร์สเท่านั้น, การแก้ไขเฉพาะการทดสอบ, และการแก้ไขเฉพาะเอกสารจะไม่จอง Docker workers เส้นทางเร็วจะสร้างอิมเมจ Dockerfile รากหนึ่งครั้ง, ตรวจสอบ CLI, รัน agents delete shared-workspace CLI smoke, รัน container gateway-network e2e, ตรวจสอบ build arg ของ extension ที่บันเดิลมา, และรันโปรไฟล์ Docker ของ bundled-plugin แบบจำกัดภายใต้ timeout รวมของคำสั่ง 240 วินาที (การรัน Docker ของแต่ละ scenario ถูกจำกัดเวลาแยกกัน)
- **เส้นทางเต็ม** เก็บความครอบคลุมการติดตั้ง QR package และ installer Docker/update ไว้สำหรับรอบ nightly ตามกำหนดเวลา, การสั่งรันด้วยตนเอง, release checks แบบ workflow-call, และคำขอดึงรวมที่แตะพื้นผิว installer/package/Docker จริง ๆ ในโหมดเต็ม install-smoke จะเตรียมหรือนำอิมเมจ GHCR root Dockerfile smoke ของ target-SHA หนึ่งอิมเมจกลับมาใช้ใหม่ จากนั้นรัน QR package install, root Dockerfile/gateway smokes, installer/update smokes, และ fast bundled-plugin Docker E2E เป็นงานแยกกัน เพื่อให้งาน installer ไม่ต้องรออยู่หลัง root image smokes

การ push ไปยัง `main` (รวมถึง merge commits) จะไม่บังคับใช้เส้นทางเต็ม; เมื่อ logic ของ changed-scope จะขอความครอบคลุมเต็มบน push, workflow จะคง fast Docker smoke ไว้และปล่อย full install smoke ให้ nightly หรือ release validation

image-provider smoke แบบ Bun global install ที่ช้า ถูก gate แยกด้วย `run_bun_global_install_smoke` โดยรันในตาราง nightly และจาก release checks workflow และการ dispatch `Install Smoke` ด้วยตนเองสามารถเลือกใช้ได้ แต่คำขอดึงรวมและการ push ไปยัง `main` จะไม่รัน Normal PR CI ยังรัน fast Bun launcher regression lane สำหรับการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node อยู่ QR และ installer Docker tests ยังคงใช้ Dockerfiles ที่เน้นการติดตั้งของตัวเอง

## Local Docker E2E

`pnpm test:docker:all` จะ prebuild อิมเมจ live-test ที่ใช้ร่วมกันหนึ่งอิมเมจ, pack OpenClaw หนึ่งครั้งเป็น npm tarball, และสร้างอิมเมจ `scripts/e2e/Dockerfile` ที่ใช้ร่วมกันสองอิมเมจ:

- bare Node/Git runner สำหรับ installer/update/plugin-dependency lanes;
- อิมเมจที่ใช้งานได้ซึ่งติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ functionality lanes ปกติ

คำจำกัดความของ Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`, และ runner จะรันเฉพาะแผนที่เลือกเท่านั้น scheduler เลือกอิมเมจต่อ lane ด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` จากนั้นรัน lanes ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### ค่าที่ปรับได้

| ตัวแปร                               | ค่าเริ่มต้น | วัตถุประสงค์                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | จำนวน slot ของ main-pool สำหรับ lanes ปกติ                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | จำนวน slot ของ tail-pool ที่อ่อนไหวต่อ provider                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | ขีดจำกัด live lane พร้อมกันเพื่อไม่ให้ providers throttle                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | ขีดจำกัด npm install lane พร้อมกัน                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | ขีดจำกัด multi-service lane พร้อมกัน                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | หน่วงเวลาระหว่างการเริ่ม lane เพื่อหลีกเลี่ยง Docker daemon create storms; ตั้งเป็น `0` เพื่อไม่หน่วง     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout สำรองต่อ lane (120 นาที); live/tail lanes ที่เลือกใช้ขีดจำกัดที่เข้มกว่า           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | ไม่ได้ตั้งค่า   | `1` พิมพ์แผน scheduler โดยไม่รัน lanes                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | ไม่ได้ตั้งค่า   | รายการ lane แบบตรงตัวคั่นด้วย comma; ข้าม cleanup smoke เพื่อให้ agents reproduce lane ที่ล้มเหลวหนึ่งรายการได้ |

lane ที่หนักกว่า cap ที่มีผลสามารถเริ่มจาก pool ว่างได้อยู่ แล้วรันเพียงลำพังจนกว่าจะปล่อย capacity local aggregate จะ preflight Docker, ลบคอนเทนเนอร์ OpenClaw E2E ที่ค้าง, แสดงสถานะ active-lane, บันทึกเวลา lane เพื่อจัดลำดับ longest-first, และโดยค่าเริ่มต้นจะหยุด schedule pooled lanes ใหม่หลังความล้มเหลวครั้งแรก

### Reusable live/E2E workflow

Reusable live/E2E workflow ถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องใช้ package, image kind, live image, lane, และ credential coverage ใด `scripts/docker-e2e.mjs` จะแปลงแผนนั้นเป็น GitHub outputs และ summaries จากนั้นจะ pack OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลด package artifact ของ current-run, หรือดาวน์โหลด package artifact จาก `package_artifact_run_id`; ตรวจสอบ inventory ของ tarball; build และ push อิมเมจ bare/functional GHCR Docker E2E ที่ tag ด้วย package digest ผ่าน Docker layer cache ของ Blacksmith เมื่อแผนต้องใช้ lanes ที่ติดตั้ง package; และนำ input `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรืออิมเมจ package-digest ที่มีอยู่กลับมาใช้ใหม่แทนการ rebuild การ pull อิมเมจ Docker จะ retry ด้วย timeout ต่อ attempt แบบจำกัด 180 วินาที เพื่อให้ registry/cache stream ที่ค้าง retry ได้เร็ว แทนที่จะกินเวลาส่วนใหญ่ของ CI critical path

### Release-path chunks

ความครอบคลุม Release Docker รันงานที่แบ่งเป็น chunks ขนาดเล็กด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละ chunk pull เฉพาะ image kind ที่ต้องใช้และ execute หลาย lanes ผ่าน weighted scheduler เดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Docker chunks ของ release ปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, และ `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` `package-update-openai` รวม live Codex plugin package lane ซึ่งติดตั้ง candidate OpenClaw package, ติดตั้ง Codex plugin จาก `codex_plugin_spec` หรือ tarball ของ ref เดียวกันพร้อมการอนุมัติการติดตั้ง Codex CLI อย่างชัดเจน, รัน Codex CLI preflight, จากนั้นรัน OpenClaw agent หลาย turns ใน session เดียวกันกับ OpenAI `plugins-runtime-core`, `plugins-runtime`, และ `plugins-integrations` ยังคงเป็น alias แบบ aggregate ของ plugin/runtime alias ของ lane `install-e2e` ยังคงเป็น alias สำหรับ manual rerun แบบ aggregate สำหรับ provider installer lanes ทั้งสอง

OpenWebUI ถูกพับเข้า `plugins-runtime-services` เมื่อ full release-path coverage ขอ และคง chunk `openwebui` แยกไว้เฉพาะสำหรับ dispatches แบบ OpenWebUI-only Bundled-channel update lanes จะ retry หนึ่งครั้งสำหรับความล้มเหลวของ npm network ชั่วคราว

แต่ละ chunk อัปโหลด `.artifacts/docker-tests/` พร้อม lane logs, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, ตาราง slow-lane, และคำสั่ง rerun ต่อ lane input `docker_lanes` ของ workflow จะรัน lanes ที่เลือกกับอิมเมจที่เตรียมไว้แทน chunk jobs ซึ่งทำให้การ debug failed-lane ถูกจำกัดอยู่ใน Docker job เป้าหมายหนึ่งงาน และเตรียม, ดาวน์โหลด, หรือนำ package artifact กลับมาใช้ใหม่สำหรับการรันนั้น; หาก lane ที่เลือกเป็น live Docker lane, targeted job จะ build live-test image ภายในเครื่องสำหรับ rerun นั้น คำสั่ง GitHub rerun ต่อ lane ที่สร้างขึ้นจะรวม `package_artifact_run_id`, `package_artifact_name`, และ input ของอิมเมจที่เตรียมไว้เมื่อมีค่าเหล่านั้นอยู่ เพื่อให้ lane ที่ล้มเหลวนำ package และอิมเมจเดิมจากการรันที่ล้มเหลวกลับมาใช้ใหม่ได้

```bash
pnpm test:docker:rerun <run-id>      # ดาวน์โหลด Docker artifacts และพิมพ์คำสั่ง targeted rerun แบบรวม/ต่อ lane
pnpm test:docker:timings <summary>   # summaries ของ slow-lane และ phase critical-path
```

Scheduled live/E2E workflow รัน full release-path Docker suite ทุกวัน

## Plugin Prerelease

`Plugin Prerelease` เป็นความครอบคลุม product/package ที่แพงกว่า จึงเป็น workflow แยกที่ dispatch โดย `Full Release Validation` หรือโดย operator ที่ชัดเจน Normal pull requests, การ push ไปยัง `main`, และ standalone manual CI dispatches จะปิด suite นั้นไว้ workflow นี้กระจายการทดสอบ Plugin ที่บันเดิลมาข้าม extension workers แปดตัว; extension shard jobs เหล่านั้นรันได้สูงสุดสอง plugin config groups พร้อมกัน โดยใช้ Vitest worker หนึ่งตัวต่อ group และ Node heap ที่ใหญ่ขึ้น เพื่อให้ plugin batches ที่ import หนักไม่สร้าง CI jobs เพิ่ม release-only Docker prerelease path จัดกลุ่ม targeted Docker lanes เป็นกลุ่มเล็กเพื่อหลีกเลี่ยงการจอง runners หลายสิบตัวสำหรับงานหนึ่งถึงสามนาที workflow ยังอัปโหลด artifact เชิงข้อมูล `plugin-inspector-advisory` จาก `@openclaw/plugin-inspector`; inspector findings เป็น input สำหรับ triage และไม่เปลี่ยน blocking Plugin Prerelease gate

## QA Lab

QA Lab มี CI lanes เฉพาะนอก main smart-scoped workflow Agentic parity ถูกซ้อนอยู่ภายใต้ QA และ release harnesses แบบกว้าง ไม่ใช่ standalone PR workflow ใช้ `Full Release Validation` พร้อม `rerun_group=qa-parity` เมื่อ parity ควรไปพร้อมกับ broad validation run

- workflow `QA-Lab - All Lanes` รันทุกคืนบน `main` และเมื่อ manual dispatch; โดย fan out mock parity lane, live Matrix lane, และ live Telegram และ Discord lanes เป็นงาน parallel Live jobs ใช้ environment `qa-live-shared` และ Telegram/Discord ใช้ Convex leases

Release checks รัน Matrix และ Telegram live transport lanes ด้วย deterministic mock provider และโมเดลที่ qualified ด้วย mock (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อแยก channel contract ออกจาก latency ของ live model และ startup ปกติของ provider-plugin live transport gateway ปิด memory search เพราะ QA parity ครอบคลุมพฤติกรรม memory แยกต่างหาก; provider connectivity ครอบคลุมโดยชุด live model, native provider, และ Docker provider แยกต่างหาก

Matrix ใช้ `--profile fast` สำหรับ scheduled และ release gates โดยเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout รองรับ ค่าเริ่มต้นของ CLI และ input ของ manual workflow ยังคงเป็น `all`; manual `matrix_profile=all` dispatch จะแบ่ง full Matrix coverage เป็น jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรัน QA Lab lanes ที่สำคัญต่อ release ก่อนอนุมัติ release; QA parity gate ของมันรัน candidate และ baseline packs เป็น parallel lane jobs จากนั้นดาวน์โหลด artifacts ทั้งสองเข้า report job ขนาดเล็กสำหรับการเปรียบเทียบ parity ขั้นสุดท้าย

สำหรับ PRs ปกติ ให้ตามหลักฐาน scoped CI/check แทนการถือว่า parity เป็นสถานะที่จำเป็น

## CodeQL

workflow `CodeQL` ตั้งใจให้เป็น security scanner รอบแรกแบบแคบ ไม่ใช่ sweep ทั้ง repository แบบเต็ม การรันรายวัน, manual, และ guard runs ของ pull request ที่ไม่ใช่ draft จะ scan โค้ด Actions workflow รวมถึงพื้นผิว JavaScript/TypeScript ที่มีความเสี่ยงสูงที่สุดด้วย security queries ความเชื่อมั่นสูงที่ filter เฉพาะ `security-severity` ระดับ high/critical

pull request guard ยังคงเบา: เริ่มเฉพาะสำหรับการเปลี่ยนแปลงภายใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, หรือ process-owning bundled plugin runtime paths และรัน high-confidence security matrix เดียวกับ scheduled workflow Android และ macOS CodeQL จะไม่อยู่ในค่าเริ่มต้นของ PR

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                          | พื้นผิว                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, Cron และ baseline ของ Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการใช้งาน implementation ของช่องทางหลัก รวมถึง runtime ของ channel Plugin, Gateway, Plugin SDK, secrets, จุดแตะ audit              |
| `/codeql-security-high/network-ssrf-boundary`     | พื้นผิวนโยบาย SSRF ของแกนหลัก, การแยกวิเคราะห์ IP, network guard, web-fetch และ Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | เซิร์ฟเวอร์ MCP, ตัวช่วยประมวลผลการเรียกใช้ process, outbound delivery และ gate การเรียกใช้เครื่องมือของ agent                                           |
| `/codeql-security-high/process-exec-boundary`     | เชลล์ภายในเครื่อง, ตัวช่วย spawn process, runtime ของ bundled plugin ที่เป็นเจ้าของ subprocess และ glue ของสคริปต์ workflow                             |
| `/codeql-security-high/plugin-trust-boundary`     | พื้นผิวความเชื่อถือของ Plugin install, loader, manifest, registry, การติดตั้ง package-manager, source-loading และสัญญาแพ็กเกจของ Plugin SDK |

### ชาร์ดความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — ชาร์ดความปลอดภัย Android ตามกำหนดเวลา สร้างแอป Android แบบแมนนวลสำหรับ CodeQL บน Blacksmith Linux runner ที่เล็กที่สุดซึ่ง workflow sanity ยอมรับ อัปโหลดใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — ชาร์ดความปลอดภัย macOS รายสัปดาห์/แบบแมนนวล สร้างแอป macOS แบบแมนนวลสำหรับ CodeQL บน Blacksmith macOS, กรองผลลัพธ์ build ของ dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดใต้ `/codeql-critical-security/macos` เก็บไว้นอกค่าเริ่มต้นรายวันเพราะ build ของ macOS ใช้เวลาหลักของ runtime แม้เมื่อสะอาด

### หมวดหมู่ Critical Quality

`CodeQL Critical Quality` คือชาร์ด non-security ที่เข้าคู่กัน โดยรันเฉพาะ query คุณภาพ JavaScript/TypeScript แบบ non-security ที่มี severity เป็น error เหนือพื้นผิวแคบ ๆ ที่มีมูลค่าสูงบน GitHub-hosted Linux runners เพื่อให้การสแกนคุณภาพไม่ใช้ runner-registration budget ของ Blacksmith guard สำหรับ pull request ของมันตั้งใจให้เล็กกว่า profile ตามกำหนดเวลา: PR ที่ไม่ใช่ draft จะรันเฉพาะชาร์ด `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` ที่ตรงกัน สำหรับการเปลี่ยนแปลงโค้ดการเรียกใช้คำสั่ง/model/tool ของ agent และ reply dispatch, schema/migration/IO ของ config, โค้ด auth/secrets/sandbox/security, ช่องทางหลักและ runtime ของ bundled channel plugin, protocol/server-method ของ Gateway, glue ของ memory runtime/SDK, MCP/process/outbound delivery, runtime/catalog ของ provider model, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract หรือ runtime การตอบกลับของ Plugin SDK การเปลี่ยนแปลง CodeQL config และ quality workflow จะรันชาร์ดคุณภาพ PR ทั้งสิบสองรายการ

Manual dispatch ยอมรับ:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

profile แบบแคบเป็น hook สำหรับการสอน/การวนซ้ำ เพื่อรันชาร์ดคุณภาพหนึ่งรายการแบบแยกเดี่ยว

| หมวดหมู่                                                | พื้นผิว                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ดขอบเขตความปลอดภัยของ Auth, secrets, sandbox, Cron และ Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | สัญญา schema, migration, normalization และ IO ของ config                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schema ของ protocol Gateway และสัญญา method ของเซิร์ฟเวอร์                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญาการใช้งาน implementation ของช่องทางหลักและ bundled channel plugin                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | สัญญา runtime ของการเรียกใช้คำสั่ง, model/provider dispatch, auto-reply dispatch และ queues, และ ACP control-plane                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | เซิร์ฟเวอร์ MCP และ tool bridges, ตัวช่วยกำกับดูแล process และสัญญา outbound delivery                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, facade ของ memory runtime, alias ของ memory Plugin SDK, glue การเปิดใช้งาน memory runtime และคำสั่ง memory doctor                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | รายละเอียดภายในของ reply queue, session delivery queues, ตัวช่วย outbound session binding/delivery, พื้นผิว diagnostic event/log bundle และสัญญา CLI ของ session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | inbound reply dispatch ของ Plugin SDK, ตัวช่วย reply payload/chunking/runtime, ตัวเลือกการตอบกลับของช่องทาง, delivery queues และตัวช่วย session/thread binding             |
| `/codeql-critical-quality/provider-runtime-boundary`    | การ normalize model catalog, auth และ discovery ของ provider, การลงทะเบียน runtime ของ provider, ค่าเริ่มต้น/catalog ของ provider และ registry ของ web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | bootstrap ของ Control UI, persistence ภายในเครื่อง, control flow ของ Gateway และสัญญา runtime ของ task control-plane                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | สัญญา runtime ของ core web fetch/search, media IO, media understanding, image-generation และ media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | สัญญา entrypoint ของ loader, registry, public-surface และ Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | ซอร์ส Plugin SDK ฝั่งแพ็กเกจที่เผยแพร่แล้ว และตัวช่วยสัญญาแพ็กเกจ plugin                                                                                      |

คุณภาพแยกจากความปลอดภัยเพื่อให้ findings ด้านคุณภาพสามารถกำหนดเวลา วัดผล ปิดใช้งาน หรือขยายได้โดยไม่บดบังสัญญาณความปลอดภัย การขยาย CodeQL สำหรับ Swift, Python และ bundled-plugin ควรถูกเพิ่มกลับมาเป็นงานติดตามผลแบบ scoped หรือ sharded หลังจาก profile แบบแคบมี runtime และสัญญาณที่เสถียรแล้วเท่านั้น

## workflow การบำรุงรักษา

### Docs Agent

workflow `Docs Agent` เป็นเลนบำรุงรักษา Codex แบบ event-driven สำหรับทำให้เอกสารที่มีอยู่สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง land ไม่มีตารางเวลาแบบล้วน: การรัน CI จาก push ที่สำเร็จบน `main` โดยไม่ใช่ bot สามารถ trigger ได้ และ manual dispatch สามารถรันได้โดยตรง การเรียกใช้แบบ workflow-run จะข้ามเมื่อ `main` เคลื่อนไปแล้ว หรือเมื่อมีการรัน Docs Agent อีกรายการที่ไม่ถูกข้ามถูกสร้างขึ้นในชั่วโมงล่าสุด เมื่อรัน มันจะตรวจทานช่วง commit จาก source SHA ของ Docs Agent ก่อนหน้าที่ไม่ถูกข้ามถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงหนึ่งครั้งสามารถครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมตั้งแต่การผ่านเอกสารครั้งล่าสุด

### Test Performance Agent

workflow `Test Performance Agent` เป็นเลนบำรุงรักษา Codex แบบ event-driven สำหรับการทดสอบที่ช้า ไม่มีตารางเวลาแบบล้วน: การรัน CI จาก push ที่สำเร็จบน `main` โดยไม่ใช่ bot สามารถ trigger ได้ แต่จะข้ามหากมีการเรียกใช้ workflow-run อื่นที่รันแล้วหรือกำลังรันในวัน UTC เดียวกัน Manual dispatch จะข้าม gate กิจกรรมรายวันนั้น เลนนี้สร้างรายงานประสิทธิภาพ Vitest แบบ grouped สำหรับ full-suite, ให้ Codex ทำเฉพาะการแก้ไขประสิทธิภาพการทดสอบขนาดเล็กที่ยังคง coverage แทนการ refactor กว้าง ๆ, จากนั้นรันรายงาน full-suite อีกครั้งและปฏิเสธการเปลี่ยนแปลงที่ลดจำนวนการทดสอบ baseline ที่ผ่าน รายงานแบบ grouped บันทึก wall time ต่อ config และ max RSS บน Linux และ macOS ดังนั้นการเปรียบเทียบก่อน/หลังจะแสดง delta ของหน่วยความจำการทดสอบควบคู่กับ delta ของระยะเวลา หาก baseline มีการทดสอบที่ล้มเหลว Codex อาจแก้ไขได้เฉพาะความล้มเหลวที่ชัดเจน และรายงาน full-suite หลัง agent ต้องผ่านก่อนจะ commit สิ่งใด เมื่อ `main` เดินหน้าไปก่อนที่ bot push จะ land เลนนี้จะ rebase patch ที่ validate แล้ว, รัน `pnpm check:changed` อีกครั้ง และ retry push; patch เก่าที่ขัดแย้งจะถูกข้าม ใช้ GitHub-hosted Ubuntu เพื่อให้ action ของ Codex คงท่าทางความปลอดภัยแบบ drop-sudo เดียวกับ docs agent ได้

### PR ซ้ำหลัง Merge

workflow `Duplicate PRs After Merge` เป็น workflow แบบแมนนวลสำหรับ maintainer เพื่อทำความสะอาด duplicate หลัง land ค่าเริ่มต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุไว้อย่างชัดเจนเมื่อ `apply=true` ก่อน mutate GitHub จะตรวจสอบว่า PR ที่ land แล้วถูก merge แล้ว และ duplicate แต่ละรายการมี issue ที่อ้างอิงร่วมกันหรือ hunk ที่เปลี่ยนแปลงซ้อนทับกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## gate การตรวจสอบภายในเครื่องและการ routing การเปลี่ยนแปลง

ตรรกะ changed-lane ภายในเครื่องอยู่ใน `scripts/changed-lanes.mjs` และถูกเรียกใช้โดย `scripts/check-changed.mjs` gate การตรวจสอบภายในเครื่องนั้นเข้มงวดเรื่องขอบเขตสถาปัตยกรรมมากกว่าขอบเขตแพลตฟอร์ม CI กว้าง ๆ:

- การเปลี่ยนแปลง production ของแกนหลักรัน typecheck ของ core prod และ core test รวมถึง core lint/guards;
- การเปลี่ยนแปลงเฉพาะ test ของแกนหลักรันเฉพาะ typecheck ของ core test รวมถึง core lint;
- การเปลี่ยนแปลง production ของ extension รัน typecheck ของ extension prod และ extension test รวมถึง extension lint;
- การเปลี่ยนแปลงเฉพาะ test ของ extension รัน typecheck ของ extension test รวมถึง extension lint;
- การเปลี่ยนแปลง Plugin SDK สาธารณะหรือ plugin-contract ขยายไปยัง typecheck ของ extension เพราะ extensions พึ่งพาสัญญา core เหล่านั้น (การ sweep extension ของ Vitest ยังเป็นงานทดสอบที่ต้องระบุชัด);
- การ bump เวอร์ชันแบบ release metadata-only รันการตรวจสอบ version/config/root-dependency แบบเจาะจง;
- การเปลี่ยนแปลง root/config ที่ไม่รู้จัก fail safe ไปยัง check lanes ทั้งหมด

การ routing changed-test ภายในเครื่องอยู่ใน `scripts/test-projects.test-support.mjs` และตั้งใจให้ถูกกว่า `check:changed`: การแก้ไข test โดยตรงจะรันตัวเอง, การแก้ไขซอร์สจะเลือก mappings ที่ระบุชัดก่อน แล้วจึงเป็น sibling tests และ import-graph dependents config การส่งแบบ shared group-room เป็นหนึ่งใน mappings ที่ระบุชัด: การเปลี่ยนแปลง config visible-reply ของกลุ่ม, source reply delivery mode หรือ system prompt ของ message-tool จะ route ผ่าน core reply tests รวมถึง regression ด้าน delivery ของ Discord และ Slack เพื่อให้การเปลี่ยนค่า default ร่วมล้มเหลวก่อน PR push ครั้งแรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างระดับ harness จนชุด mapped ราคาถูกไม่น่าเชื่อถือพอเป็น proxy

## การ validate ด้วย Testbox

Crabbox คือ wrapper สำหรับ remote-box ที่ repo เป็นเจ้าของ เพื่อใช้พิสูจน์บน Linux สำหรับ maintainer ใช้จาก repo root เมื่อการตรวจสอบกว้างเกินไปสำหรับ local edit loop, เมื่อต้องการความเทียบเท่ากับ CI, หรือเมื่อหลักฐานต้องใช้ secrets, Docker, package lanes, กล่องที่ใช้ซ้ำได้, หรือ remote logs backend ปกติของ OpenClaw คือ `blacksmith-testbox`; capacity บน AWS/Hetzner ที่เป็นเจ้าของเองเป็น fallback สำหรับเหตุขัดข้องของ Blacksmith, ปัญหาโควตา, หรือการทดสอบบน capacity ที่เป็นเจ้าของอย่างชัดเจน

การรันที่ใช้ Crabbox-backed Blacksmith จะ warm, claim, sync, run, report, และ clean up Testboxes แบบใช้ครั้งเดียว การตรวจ sanity ของ sync ในตัวจะ fail fast เมื่อไฟล์ root ที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short` แสดงการลบไฟล์ tracked อย่างน้อย 200 รายการ สำหรับ PR ที่ตั้งใจลบไฟล์จำนวนมาก ให้ตั้ง `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับคำสั่ง remote

Crabbox ยัง terminate การเรียก Blacksmith CLI แบบ local ที่ค้างอยู่ในช่วง sync นานกว่าห้านาทีโดยไม่มี output หลัง sync ตั้ง `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` เพื่อปิด guard นั้น หรือใช้ค่า millisecond ที่มากขึ้นสำหรับ local diffs ที่ใหญ่ผิดปกติ

ก่อนรันครั้งแรก ให้ตรวจ wrapper จาก repo root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

repo wrapper จะปฏิเสธ Crabbox binary ที่เก่าและไม่ได้ประกาศ `blacksmith-testbox` ส่ง provider อย่างชัดเจนแม้ว่า `.crabbox.yaml` จะมีค่า default ของ owned-cloud อยู่แล้ว ใน Codex worktrees หรือ linked/sparse checkouts ให้หลีกเลี่ยงสคริปต์ local `pnpm crabbox:run` เพราะ pnpm อาจ reconcile dependencies ก่อนที่ Crabbox จะเริ่มทำงาน; ให้เรียก node wrapper โดยตรงแทน:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

การรันที่ใช้ Blacksmith-backed ต้องใช้ Crabbox 0.22.0 หรือใหม่กว่า เพื่อให้ wrapper ได้ behavior ปัจจุบันของ Testbox sync, queue, และ cleanup เมื่อใช้ sibling checkout ให้ rebuild local binary ที่ถูก ignore ก่อนงานจับเวลาหรือ proof:

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

อ่านสรุป JSON สุดท้าย ฟิลด์ที่มีประโยชน์คือ `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, และ `totalMs` สำหรับการรัน delegated Blacksmith Testbox exit code ของ Crabbox wrapper และสรุป JSON คือผลลัพธ์ของคำสั่ง GitHub Actions run ที่ลิงก์ไว้เป็นเจ้าของ hydration และ keepalive; มันอาจจบเป็น `cancelled` เมื่อ Testbox ถูกหยุดจากภายนอกหลังจากคำสั่ง SSH return แล้ว ให้ถือว่านั่นเป็น artifact ของ cleanup/status เว้นแต่ว่า `exitCode` ของ wrapper ไม่เป็นศูนย์ หรือ output ของคำสั่งแสดงว่ามี test ล้มเหลว การรัน Crabbox แบบใช้ครั้งเดียวที่ใช้ Blacksmith-backed ควรหยุด Testbox โดยอัตโนมัติ; หากการรันถูกขัดจังหวะหรือ cleanup ไม่ชัดเจน ให้ตรวจกล่อง live และหยุดเฉพาะกล่องที่คุณสร้าง:

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

หาก Crabbox เป็น layer ที่เสีย แต่ Blacksmith เองยังทำงาน ให้ใช้ Blacksmith โดยตรงเฉพาะสำหรับ diagnostics เช่น `list`, `status`, และ cleanup แก้ path ของ Crabbox ก่อนถือว่าการรัน Blacksmith โดยตรงเป็น maintainer proof

หาก `blacksmith testbox list --all` และ `blacksmith testbox status` ทำงาน แต่ warmups ใหม่ค้างที่ `queued` โดยไม่มี IP หรือ Actions run URL หลังผ่านไปสองสามนาที ให้ถือว่าเป็นแรงกดดันจาก Blacksmith provider, queue, billing, หรือ org-limit หยุด queued ids ที่คุณสร้าง หลีกเลี่ยงการเริ่ม Testboxes เพิ่ม และย้าย proof ไปยัง path capacity ของ Crabbox ที่เป็นเจ้าของด้านล่าง ขณะที่มีคนตรวจ Blacksmith dashboard, billing, และ org limits

Escalate ไปยัง capacity ของ Crabbox ที่เป็นเจ้าของเฉพาะเมื่อ Blacksmith ล่ม, ถูกจำกัดโควตา, ไม่มี environment ที่ต้องการ, หรือ owned capacity เป็นเป้าหมายอย่างชัดเจน:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

ภายใต้แรงกดดันของ AWS ให้หลีกเลี่ยง `class=beast` เว้นแต่งานต้องการ CPU ระดับ 48xlarge-class จริง ๆ คำขอ `beast` เริ่มที่ 192 vCPUs และเป็นวิธีที่ง่ายที่สุดที่จะชนโควตา EC2 Spot หรือ On-Demand Standard ระดับภูมิภาค `.crabbox.yaml` ที่ repo เป็นเจ้าของมีค่า default เป็น `standard`, หลาย capacity regions, และ `capacity.hints: true` เพื่อให้ AWS leases ที่ broker แล้วพิมพ์ region/market ที่เลือก, แรงกดดันโควตา, Spot fallback, และคำเตือน class ที่มีแรงกดดันสูง ใช้ `fast` สำหรับการตรวจ broad ที่หนักกว่า, ใช้ `large` เฉพาะหลังจาก standard/fast ไม่เพียงพอ, และใช้ `beast` เฉพาะสำหรับ lanes ที่ CPU-bound เป็นพิเศษ เช่น full-suite หรือ all-plugin Docker matrices, การตรวจ release/blocker อย่างชัดเจน, หรือ high-core performance profiling ห้ามใช้ `beast` สำหรับ `pnpm check:changed`, focused tests, งาน docs-only, lint/typecheck ปกติ, E2E repro ขนาดเล็ก, หรือ triage เหตุขัดข้องของ Blacksmith ใช้ `--market on-demand` สำหรับการวินิจฉัย capacity เพื่อไม่ให้การแกว่งของ Spot market ปะปนในสัญญาณ

`.crabbox.yaml` เป็นเจ้าของค่า default ของ provider, sync, และ GitHub Actions hydration สำหรับ owned-cloud lanes มัน exclude `.git` local เพื่อให้ Actions checkout ที่ hydrated แล้วเก็บ metadata Git remote ของตัวเองไว้แทนการ sync maintainer-local remotes และ object stores และ exclude artifacts ของ runtime/build local ที่ไม่ควรถูกถ่ายโอน `.github/workflows/crabbox-hydrate.yml` เป็นเจ้าของ checkout, การตั้งค่า Node/pnpm, การ fetch `origin/main`, และการส่งต่อ environment ที่ไม่ใช่ secret สำหรับคำสั่ง owned-cloud `crabbox run --id <cbx_id>`

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [channels สำหรับการพัฒนา](/th/install/development-channels)
