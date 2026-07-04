---
read_when:
    - คุณต้องเข้าใจว่าเหตุใดงาน CI จึงทำงานหรือไม่ทำงาน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการรันหรือรันซ้ำการตรวจสอบความถูกต้องของรีลีส
    - คุณกำลังเปลี่ยนการ dispatch ของ ClawSweeper หรือการส่งต่อกิจกรรม GitHub
summary: กราฟงาน CI, เกตขอบเขต, งานครอบคลุมรีลีส และคำสั่งเทียบเท่าในเครื่อง
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-07-04T18:24:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af8650cc7f194a7770c0f997d3c7a6a8f0307a9ce0a00525250e6a853ddecef1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI ทำงานในทุก push ไปยัง `main` และทุก pull request `push` ไปยัง `main` แบบ canonical จะผ่านหน้าต่างรับงานของ hosted-runner เป็นเวลา 90 วินาทีก่อน กลุ่ม concurrency `CI` ที่มีอยู่จะยกเลิก run ที่กำลังรอนั้นเมื่อมี commit ใหม่กว่าเข้ามา ดังนั้นการ merge ต่อเนื่องกันจะไม่ลงทะเบียน matrix ของ Blacksmith แบบเต็มทุกรายการ Pull request และ manual dispatch จะข้ามการรอ จากนั้น job `preflight` จะจัดประเภท diff และปิด lane ที่ใช้ทรัพยากรมากเมื่อมีเพียงพื้นที่ที่ไม่เกี่ยวข้องเปลี่ยนแปลง run แบบ manual `workflow_dispatch` ตั้งใจข้าม smart scoping และกระจาย full graph สำหรับ release candidate และการตรวจสอบความถูกต้องแบบกว้าง lane ของ Android ยังคงเป็นแบบ opt-in ผ่าน `include_android` ความครอบคลุมของ Plugin เฉพาะ release อยู่ใน workflow [`Plugin Prerelease`](#plugin-prerelease) แยกต่างหาก และจะทำงานจาก [`Full Release Validation`](#full-release-validation) หรือ manual dispatch ที่ระบุโดยตรงเท่านั้น

## ภาพรวม Pipeline

| Job                                | วัตถุประสงค์                                                                                                   | ทำงานเมื่อใด                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | ตรวจจับการเปลี่ยนแปลงเฉพาะ docs, scope ที่เปลี่ยน, extension ที่เปลี่ยน และสร้าง CI manifest                   | เสมอบน push และ PR ที่ไม่ใช่ draft                  |
| `runner-admission`                 | debounce 90 วินาทีบน hosted-runner สำหรับ push ไปยัง `main` แบบ canonical ก่อนลงทะเบียนงาน Blacksmith                | ทุก CI run; sleep เฉพาะบน push ไปยัง `main` แบบ canonical |
| `security-fast`                    | ตรวจจับ private key, audit workflow ที่เปลี่ยนผ่าน `zizmor` และ audit lockfile ของ production                 | เสมอบน push และ PR ที่ไม่ใช่ draft                  |
| `check-dependencies`               | pass เฉพาะ dependency ของ production Knip พร้อม guard allowlist สำหรับไฟล์ที่ไม่ได้ใช้                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `build-artifacts`                  | สร้าง `dist/`, Control UI, smoke check ของ built-CLI, check built-artifact ที่ฝังไว้ และ artifact ที่นำกลับมาใช้ได้ | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-fast-core`                 | lane ตรวจสอบความถูกต้องบน Linux ที่รวดเร็ว เช่น bundled, protocol, QA Smoke CI และ check การ routing ของ CI                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-fast-contracts-plugins-*`  | check contract ของ Plugin แบบ sharded สองชุด                                                                        | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-fast-contracts-channels-*` | check contract ของ channel แบบ sharded สองชุด                                                                       | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-node-core-*`               | shard ทดสอบ Core Node โดยไม่รวม channel, bundled, contract และ extension lane                          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `check-*`                          | เทียบเท่า main local gate แบบ sharded: prod types, lint, guards, test types และ strict smoke                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `check-additional-*`               | architecture, boundary/prompt drift แบบ sharded, extension guards, package boundary และ runtime topology     | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node                               |
| `checks-node-compat-node22`        | lane build และ smoke สำหรับความเข้ากันได้กับ Node 22                                                                | manual CI dispatch สำหรับ release                     |
| `check-docs`                       | ตรวจ format, lint และ broken link ของ docs                                                             | docs เปลี่ยน                                        |
| `skills-python`                    | Ruff + pytest สำหรับ Skills ที่มี Python รองรับ                                                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python-skill                       |
| `checks-windows`                   | การทดสอบ process/path เฉพาะ Windows พร้อม regression ของ shared runtime import specifier                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows                            |
| `macos-node`                       | lane ทดสอบ TypeScript บน macOS โดยใช้ built artifact ที่ใช้ร่วมกัน                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS                              |
| `macos-swift`                      | Swift lint, build และ test สำหรับแอป macOS                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS                              |
| `ios-build`                        | การสร้าง Xcode project พร้อม simulator build ของแอป iOS                                                 | แอป iOS, shared app kit หรือ Swabble เปลี่ยน         |
| `android`                          | unit test ของ Android สำหรับทั้งสอง flavor พร้อม build debug APK หนึ่งรายการ                                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android                            |
| `test-performance-agent`           | การปรับปรุง slow-test ของ Codex รายวันหลังมีกิจกรรมที่เชื่อถือได้                                                 | main CI สำเร็จหรือ manual dispatch                  |
| `openclaw-performance`             | รายงานประสิทธิภาพ runtime ของ Kova แบบรายวัน/ตามต้องการ พร้อม mock-provider, deep-profile และ lane live ของ GPT 5.5 | scheduled และ manual dispatch                       |

## ลำดับ Fail-fast

1. `runner-admission` รอเฉพาะ push ไปยัง `main` แบบ canonical; push ที่ใหม่กว่าจะยกเลิก run ก่อนการลงทะเบียน Blacksmith
2. `preflight` ตัดสินใจว่า lane ใดจะมีอยู่เลย logic `docs-scope` และ `changed-scope` เป็น step ภายใน job นี้ ไม่ใช่ job แยกต่างหาก
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` และ `skills-python` fail อย่างรวดเร็วโดยไม่ต้องรอ job matrix ของ artifact และ platform ที่หนักกว่า
4. `build-artifacts` ทำงานทับซ้อนกับ lane Linux ที่เร็ว เพื่อให้ consumer ปลายน้ำเริ่มได้ทันทีเมื่อ shared build พร้อม
5. lane ของ platform และ runtime ที่หนักกว่าจะกระจายออกหลังจากนั้น: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` และ `android`

GitHub อาจทำเครื่องหมาย job ที่ถูกแทนที่เป็น `cancelled` เมื่อมี push ใหม่กว่าลงบน PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่าเป็น noise ของ CI เว้นแต่ run ใหม่ล่าสุดสำหรับ ref เดียวกันก็ fail เช่นกัน job แบบ matrix ใช้ `fail-fast: false` และ `build-artifacts` รายงาน failure ของ embedded channel, core-support-boundary และ gateway-watch โดยตรงแทนการ queue job verifier ขนาดเล็ก key concurrency อัตโนมัติของ CI มีการกำหนดเวอร์ชัน (`CI-v7-*`) เพื่อให้ zombie ฝั่ง GitHub ในกลุ่ม queue เก่าไม่สามารถ block run ใหม่บน main ได้ไม่มีกำหนด run แบบ manual full-suite ใช้ `CI-manual-v1-*` และไม่ยกเลิก run ที่กำลังทำงานอยู่

ใช้ `pnpm ci:timings`, `pnpm ci:timings:recent` หรือ `node scripts/ci-run-timings.mjs <run-id>` เพื่อสรุป wall time, queue time, job ที่ช้าที่สุด, failure และ fanout barrier `pnpm-store-warmup` จาก GitHub Actions CI ยังอัปโหลด run summary เดียวกันเป็น artifact `ci-timings-summary` ด้วย สำหรับ timing ของ build ให้ตรวจ step `Build dist` ของ job `build-artifacts`: `pnpm build:ci-artifacts` พิมพ์ `[build-all] phase timings:` และรวม `ui:build`; job ยังอัปโหลด artifact `startup-memory` ด้วย

สำหรับ run ของ pull request job timing-summary ปลายทางจะเรียก helper จาก trusted base revision ก่อนส่ง `GH_TOKEN` ให้ `gh run view` วิธีนี้ทำให้ query ที่มี token อยู่นอก code ที่ branch ควบคุม ขณะที่ยังสรุป CI run ปัจจุบันของ pull request ได้

## บริบทและหลักฐานของ PR

PR จาก contributor ภายนอกจะเรียก gate สำหรับบริบทและหลักฐานของ PR จาก `.github/workflows/real-behavior-proof.yml` workflow จะ checkout trusted base commit และประเมินเฉพาะ body ของ PR; ไม่ execute code จาก branch ของ contributor

gate ใช้กับผู้เขียน PR ที่ไม่ใช่ owner, member, collaborator หรือ bot ของ repository gate จะผ่านเมื่อ body ของ PR มี section `What Problem This Solves` และ `Evidence` ที่ผู้เขียนระบุ Evidence อาจเป็น test แบบ focused, ผล CI, screenshot, recording, terminal output, live observation, log ที่ redact แล้ว หรือ artifact link body ให้เจตนาและการตรวจสอบที่มีประโยชน์; reviewer จะตรวจ code, test และ CI เพื่อประเมินความถูกต้อง

เมื่อ check fail ให้อัปเดต body ของ PR แทนการ push code commit เพิ่มอีก

## Scope และ routing

logic ของ scope อยู่ใน `scripts/ci-changed-scope.mjs` และครอบคลุมด้วย unit test ใน `src/scripts/ci-changed-scope.test.ts` manual dispatch ข้ามการตรวจจับ changed-scope และทำให้ preflight manifest ทำงานเหมือนทุกพื้นที่ที่มี scope เปลี่ยนแปลง

- **การแก้ไข CI workflow** ตรวจสอบ graph ของ Node CI พร้อม workflow linting แต่ไม่บังคับ Windows, iOS, Android หรือ native build ของ macOS ด้วยตัวเอง; lane ของ platform เหล่านั้นยังคงจำกัด scope ตามการเปลี่ยนแปลง source ของ platform
- **Workflow Sanity** เรียก `actionlint`, `zizmor` กับไฟล์ YAML ของ workflow ทั้งหมด, composite-action interpolation guard และ conflict-marker guard job `security-fast` ที่ scope ตาม PR ยังเรียก `zizmor` กับไฟล์ workflow ที่เปลี่ยน เพื่อให้ finding ด้านความปลอดภัยของ workflow fail ตั้งแต่ต้นใน graph หลักของ CI
- **Docs บน push ไปยัง `main`** ถูกตรวจโดย workflow `Docs` แบบ standalone ด้วย mirror docs ของ ClawHub เดียวกับที่ CI ใช้ ดังนั้น push แบบ code+docs ผสมกันจะไม่ queue shard `check-docs` ของ CI เพิ่มด้วย Pull request และ manual CI ยังคงเรียก `check-docs` จาก CI เมื่อ docs เปลี่ยน
- **TUI PTY** ทำงานใน shard Linux Node `checks-node-core-runtime-tui-pty` สำหรับการเปลี่ยนแปลง TUI shard เรียก `test/vitest/vitest.tui-pty.config.ts` พร้อม `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` จึงครอบคลุมทั้ง lane fixture `TuiBackend` แบบ deterministic และ smoke `tui --local` ที่ช้ากว่า ซึ่ง mock เฉพาะ endpoint model ภายนอก
- **การแก้ไขเฉพาะการ routing ของ CI, การแก้ไข fixture core-test ราคาถูกบางรายการ และการแก้ไข helper/test-routing ของ plugin contract แบบแคบ** ใช้ path manifest แบบ Node-only ที่เร็ว: `preflight`, security และ task `checks-fast-core` เพียงรายการเดียว path นั้นข้าม build artifacts, ความเข้ากันได้กับ Node 22, channel contracts, core shards แบบเต็ม, bundled-plugin shards และ matrix guard เพิ่มเติม เมื่อการเปลี่ยนแปลงจำกัดอยู่แค่ surface ของ routing หรือ helper ที่ task เร็ว exercise โดยตรง
- **Windows Node checks** จำกัด scope อยู่ที่ wrapper process/path เฉพาะ Windows, helper runner ของ npm/pnpm/UI, config ของ package manager และ surface ของ CI workflow ที่ execute lane นั้น; source, Plugin, install-smoke และการเปลี่ยนแปลงเฉพาะ test ที่ไม่เกี่ยวข้องจะอยู่บน lane Linux Node

กลุ่มการทดสอบ Node ที่ช้าที่สุดถูกแยกหรือปรับสมดุลเพื่อให้งานแต่ละงานยังคงมีขนาดเล็กโดยไม่จองรันเนอร์เกินจำเป็น: สัญญา Plugin และสัญญาช่องทางแต่ละรายการรันเป็นชาร์ดแบบถ่วงน้ำหนักที่รองรับด้วย Blacksmith สองชาร์ด พร้อมทางสำรองเป็นรันเนอร์ GitHub มาตรฐาน, เลน core unit fast/support รันแยกกัน, core runtime infra ถูกแยกระหว่าง state, process/config, shared และชาร์ดโดเมน cron สามชาร์ด, auto-reply รันเป็นเวิร์กเกอร์ที่ปรับสมดุลแล้ว (โดยแยกซับทรี reply เป็นชาร์ด agent-runner, dispatch และ commands/state-routing), และการกำหนดค่า agentic gateway/server ถูกแยกข้ามเลน chat/auth/model/http-plugin/runtime/startup แทนการรออาร์ติแฟกต์ที่ build แล้ว จากนั้น CI ปกติจะบรรจุเฉพาะชาร์ด include-pattern ของ infra ที่แยกตัวได้ลงในบันเดิลแบบกำหนดแน่นอนที่มีไฟล์ทดสอบไม่เกิน 64 ไฟล์ ลดเมทริกซ์ Node โดยไม่รวมชุด non-isolated command/cron, stateful agents-core หรือ gateway/server เข้าด้วยกัน; ชุดหนักแบบคงที่ยังคงใช้ 8 vCPU ขณะที่เลนแบบบันเดิลและเลนน้ำหนักต่ำกว่าใช้ 4 vCPU คำขอ pull request บน repository มาตรฐานใช้แผนรับงานแบบกะทัดรัดเพิ่มเติม: กลุ่มต่อ config เดียวกันรันใน subprocess ที่แยกตัวภายในแผน Linux Node ปัจจุบัน 34 งาน ดังนั้น PR เดียวจะไม่ลงทะเบียนเมทริกซ์ Node เต็มที่มีมากกว่า 70 งาน การ push ไปยัง `main`, manual dispatch และ release gate ยังคงใช้เมทริกซ์เต็ม การทดสอบเบราว์เซอร์, QA, สื่อ และ Plugin เบ็ดเตล็ดแบบกว้างใช้ config Vitest เฉพาะของตัวเองแทน catch-all Plugin ที่ใช้ร่วมกัน ชาร์ด include-pattern บันทึกรายการเวลาโดยใช้ชื่อชาร์ด CI เพื่อให้ `.artifacts/vitest-shard-timings.json` แยก config ทั้งชุดออกจากชาร์ดที่ถูกกรองได้ `check-additional-*` จัดให้งาน compile/canary ข้ามขอบเขต package อยู่ด้วยกัน และแยกสถาปัตยกรรม runtime topology ออกจาก coverage ของ gateway watch; รายการ boundary guard ถูกแบ่งเป็นหนึ่งชาร์ดที่หนักด้าน prompt และหนึ่งชาร์ดรวมสำหรับ guard stripe ที่เหลือ โดยแต่ละชาร์ดรัน guard อิสระที่เลือกไว้พร้อมกันและพิมพ์เวลาต่อ check การตรวจสอบ drift ของ prompt snapshot เส้นทาง happy-path ของ Codex ที่มีต้นทุนสูงรันเป็นงานเพิ่มเติมของตัวเองเฉพาะสำหรับ CI แบบ manual และสำหรับการเปลี่ยนแปลงที่กระทบ prompt เท่านั้น ดังนั้นการเปลี่ยนแปลง Node ปกติที่ไม่เกี่ยวข้องจะไม่ต้องรออยู่หลังการสร้าง prompt snapshot แบบ cold และชาร์ด boundary ยังคงสมดุล ขณะที่ prompt drift ยังถูกผูกกับ PR ที่เป็นสาเหตุ; flag เดียวกันข้ามการสร้าง prompt snapshot Vitest ภายในชาร์ด core support-boundary ของอาร์ติแฟกต์ที่ build แล้ว Gateway watch, การทดสอบช่องทาง และชาร์ด core support-boundary รันพร้อมกันภายใน `build-artifacts` หลังจาก `dist/` และ `dist-runtime/` ถูก build แล้ว

เมื่อถูกรับเข้าแล้ว CI Linux มาตรฐานอนุญาตงานทดสอบ Node พร้อมกันได้สูงสุด 24 งาน และ
12 งานสำหรับเลน fast/check ที่เล็กกว่า; Windows และ Android ยังคงอยู่ที่สองงานเพราะ
พูลรันเนอร์เหล่านั้นแคบกว่า

แผน PR แบบกะทัดรัดปล่อยงาน Node 18 งานสำหรับชุดปัจจุบัน: กลุ่ม whole-config
ถูกจัดเป็น batch ใน subprocess ที่แยกตัวพร้อม timeout ของ batch 120 นาที
ขณะที่กลุ่ม include-pattern ใช้งบงานแบบมีขอบเขตร่วมกัน

Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` แล้วจึง build APK debug ของ Play flavor third-party ไม่มี source set หรือ manifest แยกต่างหาก; เลน unit-test ของมันยังคง compile flavor พร้อม flag BuildConfig ของ SMS/call-log ขณะหลีกเลี่ยงงาน packaging APK debug ซ้ำในทุก push ที่เกี่ยวข้องกับ Android

ชาร์ด `check-dependencies` รัน `pnpm deadcode:dependencies` (การผ่าน Knip สำหรับ dependency เฉพาะ production ที่ตรึงกับ Knip เวอร์ชันล่าสุด โดยปิดใช้อายุ release ขั้นต่ำของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบผลการพบไฟล์ที่ไม่ได้ใช้ของ production จาก Knip กับ `scripts/deadcode-unused-files.allowlist.mjs` guard ของไฟล์ที่ไม่ได้ใช้จะล้มเหลวเมื่อ PR เพิ่มไฟล์ที่ไม่ได้ใช้ใหม่ซึ่งยังไม่ผ่านการตรวจทาน หรือทิ้งรายการ allowlist ที่ล้าสมัยไว้ ขณะยังคงรักษาพื้นผิว Plugin แบบ dynamic, generated, build, live-test และ package bridge ที่ตั้งใจไว้ซึ่ง Knip ไม่สามารถ resolve แบบ static ได้

## การส่งต่อกิจกรรม ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` เป็น bridge ฝั่งปลายทางจากกิจกรรม repository ของ OpenClaw เข้าสู่ ClawSweeper มันไม่ checkout หรือ execute โค้ด pull request ที่ไม่น่าเชื่อถือ เวิร์กโฟลว์สร้างโทเค็น GitHub App จาก `CLAWSWEEPER_APP_PRIVATE_KEY` แล้ว dispatch payload `repository_dispatch` แบบกะทัดรัดไปยัง `openclaw/clawsweeper`

เวิร์กโฟลว์มีสี่เลน:

- `clawsweeper_item` สำหรับคำขอตรวจทาน issue และ pull request แบบเจาะจง;
- `clawsweeper_comment` สำหรับคำสั่ง ClawSweeper อย่างชัดเจนในความคิดเห็นของ issue;
- `clawsweeper_commit_review` สำหรับคำขอตรวจทานระดับ commit บนการ push ไปยัง `main`;
- `github_activity` สำหรับกิจกรรม GitHub ทั่วไปที่ agent ClawSweeper อาจตรวจสอบ

เลน `github_activity` ส่งต่อเฉพาะ metadata ที่ปรับให้อยู่ในรูปแบบปกติ: ประเภทเหตุการณ์, action, actor, repository, หมายเลข item, URL, title, state และข้อความตัดตอนสั้นสำหรับความคิดเห็นหรือ review เมื่อมี โดยตั้งใจหลีกเลี่ยงการส่งต่อ webhook body ทั้งหมด เวิร์กโฟลว์ที่รับใน `openclaw/clawsweeper` คือ `.github/workflows/github-activity.yml` ซึ่งโพสต์เหตุการณ์ที่ปรับให้อยู่ในรูปแบบปกติไปยัง hook ของ OpenClaw Gateway สำหรับ agent ClawSweeper

กิจกรรมทั่วไปเป็นการสังเกต ไม่ใช่การส่งมอบโดยค่าเริ่มต้น agent ClawSweeper ได้รับเป้าหมาย Discord ใน prompt และควรโพสต์ไปยัง `#clawsweeper` เฉพาะเมื่อเหตุการณ์นั้นน่าประหลาดใจ, ดำเนินการต่อได้, มีความเสี่ยง หรือมีประโยชน์เชิงปฏิบัติการ การเปิด, แก้ไข, ความเคลื่อนไหวของ bot, เสียงรบกวน webhook ซ้ำ และทราฟฟิก review ปกติควรส่งผลเป็น `NO_REPLY`

ถือว่า title, comment, body, ข้อความ review, ชื่อ branch และข้อความ commit ของ GitHub เป็นข้อมูลที่ไม่น่าเชื่อถือตลอดเส้นทางนี้ สิ่งเหล่านี้เป็น input สำหรับการสรุปและ triage ไม่ใช่คำสั่งสำหรับเวิร์กโฟลว์หรือ runtime ของ agent

## Manual dispatch

Manual CI dispatch รันกราฟงานเดียวกับ CI ปกติ แต่บังคับเปิดเลนที่มี scope ทุกเลนที่ไม่ใช่ Android: ชาร์ด Linux Node, ชาร์ด bundled-plugin, ชาร์ดสัญญา Plugin และช่องทาง, ความเข้ากันได้กับ Node 22, `check-*`, `check-additional-*`, smoke check ของอาร์ติแฟกต์ที่ build แล้ว, check เอกสาร, Python skills, Windows, macOS, iOS build และ Control UI i18n Standalone manual CI dispatch รันเฉพาะ Android ด้วย `include_android=true`; umbrella ของ full release เปิดใช้ Android โดยส่ง `include_android=true` Static check ก่อน release ของ Plugin, ชาร์ด `agentic-plugins` เฉพาะ release, การ sweep batch ของ extension แบบเต็ม และเลน Docker ก่อน release ของ Plugin ถูกตัดออกจาก CI ชุด Docker ก่อน release จะรันเฉพาะเมื่อ `Full Release Validation` dispatch เวิร์กโฟลว์ `Plugin Prerelease` แยกต่างหากโดยเปิด gate release-validation

การรันแบบ manual ใช้ concurrency group ที่ไม่ซ้ำกัน เพื่อไม่ให้ชุดเต็มของ release-candidate ถูกยกเลิกโดยการ push หรือ PR run อื่นบน ref เดียวกัน input `target_ref` แบบไม่บังคับช่วยให้ caller ที่เชื่อถือได้รันกราฟนั้นกับ branch, tag หรือ commit SHA แบบเต็ม ขณะใช้ไฟล์เวิร์กโฟลว์จาก dispatch ref ที่เลือก

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

เส้นทาง extended-stable รายเดือนแบบ npm-only เป็นข้อยกเว้น: dispatch ทั้ง preflight `OpenClaw NPM
Release` และ `Full Release Validation` จาก branch
`extended-stable/YYYY.M.33` เดียวกันทุกประการ เก็บรักษา run ID ของทั้งสองไว้ และส่ง ID ทั้งสองให้กับ
การรัน publish npm โดยตรง ดู [การเผยแพร่ extended-stable รายเดือนแบบ npm-only](/th/reference/RELEASING#monthly-npm-only-extended-stable-publication) สำหรับ
คำสั่ง, ข้อกำหนด identity ที่แน่นอน, registry readback และขั้นตอน
ซ่อมแซม selector เส้นทางนี้ไม่ dispatch Plugin, macOS, Windows, GitHub
Release, private dist-tag หรือการเผยแพร่ platform อื่น

## รันเนอร์

| รันเนอร์                          | งาน                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Manual CI dispatch และ fallback ของ repository ที่ไม่ใช่มาตรฐาน, การ scan คุณภาพ CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, เวิร์กโฟลว์เอกสารนอก CI และ preflight install-smoke เพื่อให้เมทริกซ์ Blacksmith เข้าคิวได้เร็วขึ้น                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, ชาร์ด extension น้ำหนักต่ำกว่า, `checks-fast-core` ยกเว้น QA Smoke CI, ชาร์ดสัญญา Plugin/ช่องทาง, ชาร์ด Linux Node แบบบันเดิล/น้ำหนักต่ำกว่าส่วนใหญ่, `check-guards`, `check-prod-types`, `check-test-types`, ชาร์ด `check-additional-*` ที่เลือก และ `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | ชุด Linux Node หนักที่ยังคงไว้, ชาร์ด `check-additional-*` ที่หนักด้าน boundary/extension และ `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` ใน CI และ Testbox, `check-lint` (ไวต่อ CPU มากพอที่ 8 vCPU มีต้นทุนมากกว่าที่ประหยัดได้); build Docker ของ install-smoke (เวลาเข้าคิว 32-vCPU มีต้นทุนมากกว่าที่ประหยัดได้)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` บน `openclaw/openclaw`; fork fallback ไปที่ `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` และ `ios-build` บน `openclaw/openclaw`; fork fallback ไปที่ `macos-26`                                                                                                                                                                                                                     |

## งบการลงทะเบียนรันเนอร์

bucket การลงทะเบียนรันเนอร์ GitHub ปัจจุบันของ OpenClaw รายงานการลงทะเบียน
รันเนอร์ self-hosted 10,000 รายการต่อ 5 นาทีใน `ghx api rate_limit` ตรวจสอบ
`actions_runner_registration` อีกครั้งก่อนการปรับแต่งแต่ละครั้ง เพราะ GitHub อาจเปลี่ยน
bucket นี้ได้ ขีดจำกัดนี้ใช้ร่วมกันโดยการลงทะเบียนรันเนอร์ Blacksmith ทั้งหมดในองค์กร
`openclaw` ดังนั้นการเพิ่มการติดตั้ง Blacksmith อีกชุดไม่ได้เพิ่ม
bucket ใหม่

ถือว่า label ของ Blacksmith เป็นทรัพยากรที่ขาดแคลนสำหรับการควบคุม burst งานที่
มีหน้าที่เพียง route, notify, summarize, select shards หรือรัน CodeQL scan สั้น ๆ ควร
อยู่บนรันเนอร์ GitHub-hosted เว้นแต่จะมีความต้องการเฉพาะ Blacksmith
ที่วัดผลแล้ว เมทริกซ์ Blacksmith ใหม่, `max-parallel` ที่ใหญ่ขึ้น หรือเวิร์กโฟลว์
ความถี่สูงใด ๆ ต้องแสดงจำนวนการลงทะเบียนกรณีเลวร้ายที่สุด และรักษาเป้าหมายระดับ org
ให้ต่ำกว่าประมาณ 60% ของ bucket สด ด้วย bucket ปัจจุบันที่มีการลงทะเบียน 10,000 รายการ
นั่นหมายถึงเป้าหมายการดำเนินงานที่ 6,000 รายการ เหลือพื้นที่เผื่อสำหรับ
repository ที่ทำงานพร้อมกัน, การ retry และการซ้อนทับของ burst

CI ของ repository มาตรฐานคง Blacksmith เป็นเส้นทางรันเนอร์เริ่มต้นสำหรับการรัน push และ pull-request ปกติ `workflow_dispatch` และการรัน repository ที่ไม่ใช่มาตรฐานใช้รันเนอร์ GitHub-hosted แต่การรันมาตรฐานปกติในตอนนี้ยังไม่ได้ probe สุขภาพคิวของ Blacksmith หรือ fallback อัตโนมัติไปยัง label GitHub-hosted เมื่อ Blacksmith ไม่พร้อมใช้งาน

## รายการเทียบเท่าในเครื่อง

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

`OpenClaw Performance` คือเวิร์กโฟลว์ประสิทธิภาพของผลิตภัณฑ์/รันไทม์ โดยรันทุกวันบน `main` และสามารถสั่งทำงานด้วยตนเองได้:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

โดยปกติการสั่งทำงานด้วยตนเองจะ benchmark ref ของเวิร์กโฟลว์ ตั้งค่า `target_ref` เพื่อ benchmark แท็กรีลีสหรือ branch อื่นด้วย implementation เวิร์กโฟลว์ปัจจุบัน เส้นทางรายงานที่เผยแพร่และตัวชี้ล่าสุดจะอิงตาม ref ที่ทดสอบ และแต่ละ `index.md` จะบันทึก ref/SHA ที่ทดสอบ, ref/SHA ของเวิร์กโฟลว์, Kova ref, โปรไฟล์, โหมด auth ของ lane, โมเดล, จำนวนการทำซ้ำ และตัวกรอง scenario

เวิร์กโฟลว์ติดตั้ง OCM จากรีลีสที่ pin ไว้และ Kova จาก `openclaw/Kova` ที่อินพุต `kova_ref` ซึ่ง pin ไว้ จากนั้นรันสาม lane:

- `mock-provider`: scenario วินิจฉัยของ Kova กับรันไทม์ที่ build ในเครื่อง โดยใช้ auth ปลอมที่กำหนดแน่นอนและเข้ากันได้กับ OpenAI
- `mock-deep-profile`: การทำ profile CPU/heap/trace สำหรับจุดร้อนของ startup, gateway และ agent-turn
- `live-openai-candidate`: agent turn จริงของ OpenAI `openai/gpt-5.5` ซึ่งจะข้ามเมื่อไม่มี `OPENAI_API_KEY`

lane mock-provider ยังรัน probe จาก source ที่เป็น OpenClaw-native หลังจาก Kova pass: เวลา boot และหน่วยความจำของ gateway ในกรณี startup แบบ default, hook และ 50-plugin; RSS ของการ import Plugin ที่ bundle มา, loop hello ของ `channel-chat-baseline` แบบ mock-OpenAI ซ้ำ, คำสั่ง startup ของ CLI กับ gateway ที่ boot แล้ว และ probe ประสิทธิภาพ smoke ของ state SQLite เมื่อมีรายงาน source mock-provider ที่เผยแพร่ก่อนหน้าสำหรับ ref ที่ทดสอบ สรุป source จะเปรียบเทียบค่า RSS และ heap ปัจจุบันกับ baseline นั้น และทำเครื่องหมายการเพิ่มขึ้นของ RSS ขนาดใหญ่เป็น `watch` สรุป Markdown ของ source probe อยู่ที่ `source/index.md` ใน report bundle โดยมี JSON ดิบอยู่ข้างกัน

ทุก lane อัปโหลด artifact ของ GitHub เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว เวิร์กโฟลว์ยัง commit `report.json`, `report.md`, bundle, `index.md` และ artifact ของ source-probe เข้าไปใน `openclaw/clawgrit-reports` ใต้ `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` ตัวชี้ tested-ref ปัจจุบันจะถูกเขียนเป็น `openclaw-performance/<tested-ref>/latest-<lane>.json`

## การตรวจสอบความถูกต้องของรีลีสแบบเต็ม

`Full Release Validation` คือเวิร์กโฟลว์ umbrella แบบ manual สำหรับ "รันทุกอย่างก่อนรีลีส" โดยรับ branch, tag หรือ commit SHA แบบเต็ม สั่งทำงานเวิร์กโฟลว์ `CI` แบบ manual ด้วย target นั้น สั่งทำงาน `Plugin Prerelease` สำหรับหลักฐานเฉพาะรีลีสของ plugin/package/static/Docker และสั่งทำงาน `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, การตรวจ package ข้าม OS, การ render maturity scorecard จากหลักฐาน QA profile, QA Lab parity, Matrix และ Telegram lane โปรไฟล์ stable และ full จะรวม coverage แบบ live/E2E เต็มรูปแบบและ Docker release-path soak เสมอ ส่วนโปรไฟล์ beta สามารถเลือกเปิดใช้ด้วย `run_release_soak=true` ได้ Telegram E2E ของ package canonical รันภายใน Package Acceptance ดังนั้น candidate แบบเต็มจะไม่เริ่ม live poller ซ้ำ หลังเผยแพร่ ให้ส่ง `release_package_spec` เพื่อใช้ package npm ที่ส่งแล้วซ้ำในการตรวจ release, Package Acceptance, Docker, cross-OS และ Telegram โดยไม่ต้อง rebuild ใช้ `npm_telegram_package_spec` เฉพาะสำหรับการรัน Telegram ซ้ำแบบเจาะจงกับ published-package lane live package ของ Codex plugin ใช้สถานะที่เลือกเดียวกันโดยค่าเริ่มต้น: `release_package_spec=openclaw@<tag>` ที่เผยแพร่แล้วจะ derive `codex_plugin_spec=npm:@openclaw/codex@<tag>` ส่วนการรันด้วย SHA/artifact จะ pack `extensions/codex` จาก ref ที่เลือก ตั้งค่า `codex_plugin_spec` โดยตรงสำหรับ source ของ plugin แบบ custom เช่น spec `npm:`, `npm-pack:` หรือ `git:`

ดู [การตรวจสอบความถูกต้องของรีลีสแบบเต็ม](/th/reference/full-release-validation) สำหรับ
stage matrix, ชื่องานเวิร์กโฟลว์ที่แน่นอน, ความแตกต่างของโปรไฟล์, artifact และ
handle สำหรับการรันซ้ำแบบเจาะจง

`OpenClaw Release Publish` คือเวิร์กโฟลว์รีลีสแบบ manual ที่มีการแก้ไขสถานะ สั่งทำงานจาก
`release/YYYY.M.PATCH` หรือ `main` หลังจากมีแท็กรีลีสแล้วและหลังจาก
OpenClaw npm preflight สำเร็จแล้ว เวิร์กโฟลว์จะตรวจสอบ `pnpm plugins:sync:check`,
สั่งทำงาน `Plugin NPM Release` สำหรับ package ของ plugin ทั้งหมดที่เผยแพร่ได้, สั่งทำงาน
`Plugin ClawHub Release` สำหรับ release SHA เดียวกัน และจากนั้นเท่านั้นจึงสั่งทำงาน
`OpenClaw NPM Release` ด้วย `preflight_run_id` ที่บันทึกไว้ การ publish แบบ stable ยัง
ต้องมี `windows_node_tag` ที่ตรงกันแน่นอน; เวิร์กโฟลว์จะตรวจสอบ source release ของ Windows
และเปรียบเทียบ installer x64/ARM64 กับอินพุต
`windows_node_installer_digests` ที่ candidate อนุมัติแล้ว ก่อน publish child ใด ๆ จากนั้น promote
และตรวจสอบ digest ของ installer ที่ pin ไว้ชุดเดิมเหล่านั้น พร้อมทั้ง companion asset
และ checksum contract ที่ตรงกันแน่นอน ก่อนเผยแพร่ draft ของ GitHub release

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

สำหรับหลักฐาน commit ที่ pin ไว้บน branch ที่เคลื่อนไหวเร็ว ให้ใช้ helper แทน
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

ref สำหรับ GitHub workflow dispatch ต้องเป็น branch หรือ tag ไม่ใช่ commit SHA ดิบ
helper จะ push branch ชั่วคราว `release-ci/<sha>-...` ที่ target SHA,
สั่งทำงาน `Full Release Validation` จาก ref ที่ pin ไว้นั้น, ตรวจสอบว่า `headSha` ของ workflow child ทุกตัวตรงกับ target และลบ branch ชั่วคราวเมื่อการรันเสร็จสิ้น umbrella verifier จะ fail ด้วยหาก workflow child ใดรันที่ SHA
อื่น

`release_profile` ควบคุมความครอบคลุมของ live/provider ที่ส่งเข้า release checks เวิร์กโฟลว์ release แบบ manual มีค่าเริ่มต้นเป็น `stable`; ใช้ `full` เฉพาะเมื่อคุณ
ตั้งใจต้องการ provider/media matrix แบบ advisory ที่กว้าง โปรไฟล์ stable และ full
release checks จะรัน exhaustive live/E2E และ Docker release-path soak เสมอ;
โปรไฟล์ beta สามารถเลือกเปิดใช้ด้วย `run_release_soak=true`

- `minimum` เก็บ lane OpenAI/core ที่เร็วที่สุดและสำคัญต่อ release
- `stable` เพิ่มชุด provider/backend สำหรับ stable
- `full` รัน provider/media matrix แบบ advisory ที่กว้าง

umbrella จะบันทึก run id ของ child ที่สั่งทำงาน และงานสุดท้าย `Verify full validation` จะตรวจ conclusion ปัจจุบันของ child run ซ้ำ และผนวกตารางงานที่ช้าที่สุดสำหรับ child run แต่ละรายการ หาก workflow child ถูกรันซ้ำและกลายเป็น green ให้รันซ้ำเฉพาะงาน parent verifier เพื่อ refresh ผลลัพธ์ของ umbrella และสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รับ `rerun_group` ใช้ `all` สำหรับ release candidate, `ci` สำหรับ child full CI ปกติเท่านั้น, `plugin-prerelease` สำหรับ child plugin prerelease เท่านั้น, `release-checks` สำหรับ release child ทุกตัว หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` หรือ `npm-telegram` บน umbrella วิธีนี้ทำให้การรัน release box ที่ล้มเหลวซ้ำมีขอบเขตจำกัดหลังการแก้ไขแบบเจาะจง สำหรับ cross-OS lane ที่ล้มเหลวหนึ่งตัว ให้รวม `rerun_group=cross-os` กับ `cross_os_suite_filter` เช่น `windows/packaged-upgrade`; คำสั่ง cross-OS ที่ยาวจะ emit บรรทัด Heartbeat และสรุป packaged-upgrade จะรวมเวลาราย phase QA release-check lane เป็น advisory ยกเว้น gate coverage ของเครื่องมือ runtime มาตรฐาน ซึ่งจะ block เมื่อเครื่องมือ dynamic ของ OpenClaw ที่จำเป็น drift หรือหายไปจากสรุป tier มาตรฐาน

`OpenClaw Release Checks` ใช้ trusted workflow ref เพื่อ resolve ref ที่เลือกหนึ่งครั้งเป็น tarball `release-package-under-test` จากนั้นส่ง artifact นั้นไปยัง cross-OS checks และ Package Acceptance รวมถึง workflow Docker ของ live/E2E release-path เมื่อรัน soak coverage วิธีนี้ทำให้ byte ของ package สอดคล้องกันข้าม release box และหลีกเลี่ยงการ repack candidate เดียวกันใน child job หลายตัว สำหรับ lane live ของ Codex npm-plugin release checks จะส่ง spec ของ plugin ที่เผยแพร่แล้วและตรงกันซึ่ง derive จาก `release_package_spec`, ส่ง `codex_plugin_spec` ที่ operator ระบุ หรือปล่อยอินพุตว่างเพื่อให้สคริปต์ Docker pack Codex plugin ของ checkout ที่เลือก

การรัน `Full Release Validation` ซ้ำสำหรับ `ref=main` และ `rerun_group=all`
จะแทนที่ umbrella ที่เก่ากว่า parent monitor จะยกเลิก workflow child ใด ๆ ที่
สั่งทำงานไปแล้วเมื่อ parent ถูกยกเลิก ดังนั้น validation ของ main ที่ใหม่กว่า
จะไม่ต้องรออยู่หลัง release-check run เก่าสองชั่วโมง การ validation ของ release branch/tag
และกลุ่ม rerun แบบเจาะจงจะคง `cancel-in-progress: false`

## shard แบบ Live และ E2E

child live/E2E ของ release ยังคง coverage `pnpm test:live` แบบ native ที่กว้าง แต่จะรันเป็น shard ที่ตั้งชื่อผ่าน `scripts/test-live-shard.mjs` แทนที่จะเป็นงาน serial งานเดียว:

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
- shard media audio/video ที่แยกออก และ shard music ที่กรองตาม provider

วิธีนี้คง coverage ของไฟล์เดิมไว้ พร้อมทำให้ failure ของ live provider ที่ช้ารันซ้ำและวินิจฉัยได้ง่ายขึ้น ชื่อ shard aggregate `native-live-extensions-o-z`, `native-live-extensions-media` และ `native-live-extensions-media-music` ยังใช้ได้สำหรับการรันซ้ำแบบ manual one-shot

shard native live media รันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่ง build โดยเวิร์กโฟลว์ `Live Media Runner Image` image นั้นติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้า; งาน media เพียงตรวจสอบ binary ก่อน setup ให้คง suite live ที่พึ่ง Docker ไว้บน runner Blacksmith ปกติ — container job ไม่ใช่ที่เหมาะสำหรับเปิด nested Docker tests

Docker-backed live model/backend shards ใช้อิมเมจ `ghcr.io/openclaw/openclaw-live-test:<sha>` แบบแชร์แยกต่างหากต่อคอมมิตที่เลือกแต่ละรายการ เวิร์กโฟลว์รีลีสแบบสดจะสร้างและพุชอิมเมจนั้นหนึ่งครั้ง จากนั้น Docker live model, provider-sharded gateway, CLI backend, ACP bind และ Codex harness shards จะรันด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` Gateway Docker shards มีขีดจำกัด `timeout` ระดับสคริปต์อย่างชัดเจนที่ต่ำกว่า timeout ของงานเวิร์กโฟลว์ เพื่อให้คอนเทนเนอร์ที่ค้างหรือเส้นทาง cleanup ที่ค้างล้มเหลวอย่างรวดเร็ว แทนที่จะใช้ budget ทั้งหมดของ release-check หาก shards เหล่านั้นสร้าง Docker target ของซอร์สเต็มใหม่เองแยกกัน แสดงว่าการรันรีลีสตั้งค่าผิดและจะเสียเวลาจริงไปกับการ build อิมเมจซ้ำ

## การตรวจรับแพ็กเกจ

ใช้ `Package Acceptance` เมื่อคำถามคือ "แพ็กเกจ OpenClaw ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์หรือไม่" ซึ่งแตกต่างจาก CI ปกติ: CI ปกติตรวจสอบซอร์สทรี ส่วนการตรวจรับแพ็กเกจตรวจสอบ tarball เดียวผ่าน Docker E2E harness เดียวกับที่ผู้ใช้ใช้งานหลังติดตั้งหรืออัปเดต

### งาน

1. `resolve_package` checkout `workflow_ref`, resolve ผู้สมัครแพ็กเกจหนึ่งรายการ, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, อัปโหลดทั้งสองเป็น artifact `package-under-test` และพิมพ์ source, workflow ref, package ref, version, SHA-256 และ profile ในสรุปขั้นตอนของ GitHub
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` เวิร์กโฟลว์ที่ใช้ซ้ำจะดาวน์โหลด artifact นั้น ตรวจสอบ inventory ของ tarball เตรียม package-digest Docker images เมื่อจำเป็น และรัน Docker lanes ที่เลือกกับแพ็กเกจนั้นแทนการแพ็ก checkout ของเวิร์กโฟลว์ เมื่อ profile เลือก `docker_lanes` แบบเจาะจงหลายรายการ เวิร์กโฟลว์ที่ใช้ซ้ำจะเตรียมแพ็กเกจและอิมเมจแชร์หนึ่งครั้ง จากนั้นกระจาย lanes เหล่านั้นออกเป็นงาน Docker แบบเจาะจงที่รันขนานพร้อม artifacts ที่ไม่ซ้ำกัน
3. `package_telegram` อาจเรียก `NPM Telegram Beta E2E` ได้ โดยจะรันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้ง artifact `package-under-test` เดียวกันเมื่อการตรวจรับแพ็กเกจ resolve ได้หนึ่งรายการ; การ dispatch Telegram แบบสแตนด์อโลนยังสามารถติดตั้ง npm spec ที่เผยแพร่แล้วได้
4. `summary` ทำให้เวิร์กโฟลว์ล้มเหลวหาก package resolution, Docker acceptance หรือ Telegram lane ที่เป็นทางเลือกล้มเหลว

### แหล่งผู้สมัคร

- `source=npm` รับเฉพาะ `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรีลีส OpenClaw ที่ระบุชัดเจน เช่น `openclaw@2026.4.27-beta.2` ใช้สิ่งนี้สำหรับการตรวจรับ prerelease/stable ที่เผยแพร่แล้ว
- `source=ref` แพ็ก branch, tag หรือ full commit SHA ของ `package_ref` ที่เชื่อถือได้ resolver จะ fetch branch/tag ของ OpenClaw, ตรวจสอบว่าคอมมิตที่เลือก reachable จากประวัติ branch ของ repository หรือ release tag, ติดตั้ง deps ใน detached worktree และแพ็กด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` ดาวน์โหลด HTTPS `.tgz` สาธารณะ; ต้องมี `package_sha256` เส้นทางนี้ปฏิเสธข้อมูลรับรองใน URL, พอร์ต HTTPS ที่ไม่ใช่ค่าเริ่มต้น, hostname หรือ resolved IP แบบ private/internal/special-use และ redirect ที่อยู่นอกนโยบายความปลอดภัยสาธารณะเดียวกัน
- `source=trusted-url` ดาวน์โหลด HTTPS `.tgz` จากนโยบาย trusted-source ที่ระบุชื่อใน `.github/package-trusted-sources.json`; ต้องมี `package_sha256` และ `trusted_source_id` ใช้สิ่งนี้เฉพาะกับ enterprise mirrors หรือ private package repositories ที่ maintainer เป็นเจ้าของ ซึ่งต้องการ hosts, ports, path prefixes, redirect hosts หรือ private-network resolution ที่ตั้งค่าไว้ หากนโยบายประกาศ bearer auth เวิร์กโฟลว์จะใช้ secret คงที่ `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; ข้อมูลรับรองที่ฝังใน URL ยังถูกปฏิเสธอยู่
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งรายการจาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็นทางเลือก แต่ควรระบุสำหรับ artifacts ที่แชร์ภายนอก

แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือโค้ด workflow/harness ที่เชื่อถือได้ซึ่งรันการทดสอบ `package_ref` คือซอร์สคอมมิตที่จะถูกแพ็กเมื่อ `source=ref` สิ่งนี้ทำให้ harness ทดสอบปัจจุบันตรวจสอบซอร์สคอมมิตเก่าที่เชื่อถือได้โดยไม่ต้องรัน logic ของเวิร์กโฟลว์เก่า

### โปรไฟล์ชุดทดสอบ

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` บวก `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunks ของ Docker release-path เต็มพร้อม OpenWebUI
- `custom` — `docker_lanes` ที่ตรงกันทุกประการ; จำเป็นเมื่อ `suite_profile=custom`

profile `package` ใช้ coverage ของ Plugin แบบออฟไลน์ เพื่อให้การตรวจสอบแพ็กเกจที่เผยแพร่แล้วไม่ถูก gate ด้วยความพร้อมใช้งานสดของ ClawHub Telegram lane ที่เป็นทางเลือกนำ artifact `package-under-test` กลับมาใช้ใน `NPM Telegram Beta E2E` โดยเก็บเส้นทาง npm spec ที่เผยแพร่แล้วไว้สำหรับ dispatch แบบสแตนด์อโลน

สำหรับนโยบายเฉพาะด้านการทดสอบอัปเดตและ Plugin รวมถึงคำสั่งในเครื่อง,
Docker lanes, อินพุต Package Acceptance, ค่าเริ่มต้นของรีลีส และการ triage ความล้มเหลว,
ดู [การทดสอบอัปเดตและ Plugin](/th/help/testing-updates-plugins)

การตรวจสอบรีลีสเรียก Package Acceptance ด้วย `source=artifact`, artifact แพ็กเกจรีลีสที่เตรียมไว้, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` และ `telegram_mode=mock-openai` สิ่งนี้ทำให้การ migration แพ็กเกจ, การอัปเดต, การติดตั้ง Skills จาก ClawHub แบบสด, การ cleanup stale-plugin-dependency, การซ่อมการติดตั้ง configured-plugin, Plugin แบบออฟไลน์, plugin-update และหลักฐาน Telegram อยู่บน tarball แพ็กเกจที่ resolve แล้วชุดเดียวกัน ตั้งค่า `release_package_spec` บน Full Release Validation หรือ OpenClaw Release Checks หลังเผยแพร่ beta เพื่อรัน matrix เดียวกันกับแพ็กเกจ npm ที่ส่งมอบแล้วโดยไม่ต้อง rebuild; ตั้งค่า `package_acceptance_package_spec` เฉพาะเมื่อ Package Acceptance ต้องใช้แพ็กเกจคนละตัวกับส่วนที่เหลือของ release validation การตรวจสอบรีลีสข้าม OS ยังครอบคลุม onboarding, installer และพฤติกรรมแพลตฟอร์มที่เฉพาะต่อ OS; การตรวจสอบผลิตภัณฑ์ด้านแพ็กเกจ/อัปเดตควรเริ่มด้วย Package Acceptance Docker lane `published-upgrade-survivor` ตรวจสอบ baseline แพ็กเกจที่เผยแพร่แล้วหนึ่งรายการต่อการรันในเส้นทางรีลีสที่บล็อกอยู่ ใน Package Acceptance tarball `package-under-test` ที่ resolve แล้วจะเป็นผู้สมัครเสมอ และ `published_upgrade_survivor_baseline` เลือก fallback baseline ที่เผยแพร่แล้ว โดยค่าเริ่มต้นคือ `openclaw@latest`; คำสั่ง rerun ของ lane ที่ล้มเหลวจะรักษา baseline นั้นไว้ Full Release Validation ที่มี `run_release_soak=true` หรือ `release_profile=full` ตั้งค่า `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` และ `published_upgrade_survivor_scenarios=reported-issues` เพื่อขยายครอบคลุมสี่รีลีส npm stable ล่าสุด บวกรีลีส plugin-compatibility boundary ที่ pin ไว้และ fixtures รูปแบบ issue สำหรับ config ของ Feishu, ไฟล์ bootstrap/persona ที่ถูกรักษาไว้, การติดตั้ง OpenClaw Plugin ที่ตั้งค่าไว้, เส้นทาง log แบบ tilde และ stale legacy plugin dependency roots การเลือก published-upgrade survivor แบบหลาย baseline จะถูก shard ตาม baseline เป็นงาน Docker runner แบบเจาะจงแยกกัน เวิร์กโฟลว์ `Update Migration` แยกต่างหากใช้ Docker lane `update-migration` ด้วย `all-since-2026.4.23` และ `plugin-deps-cleanup` เมื่อคำถามคือการ cleanup การอัปเดตที่เผยแพร่แล้วอย่างละเอียด ไม่ใช่ breadth ของ Full Release CI ปกติ การรัน aggregate ในเครื่องสามารถส่ง package specs ที่ตรงกันทุกประการด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, คง lane เดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` เช่น `openclaw@2026.4.15` หรือตั้งค่า `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` สำหรับ scenario matrix lane ที่เผยแพร่แล้วตั้งค่า baseline ด้วย recipe คำสั่ง `openclaw config set` ที่ bake ไว้, บันทึกขั้นตอน recipe ใน `summary.json` และ probe `/healthz`, `/readyz` รวมถึงสถานะ RPC หลังเริ่ม Gateway lanes ใหม่ของ Windows packaged และ installer ยังตรวจสอบด้วยว่าแพ็กเกจที่ติดตั้งแล้วสามารถ import browser-control override จาก raw absolute Windows path ได้ smoke agent-turn ข้าม OS ของ OpenAI ใช้ค่าเริ่มต้นเป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อตั้งค่าไว้ มิฉะนั้นใช้ `openai/gpt-5.5` เพื่อให้หลักฐานการติดตั้งและ Gateway อยู่บนโมเดลทดสอบ GPT-5 ขณะหลีกเลี่ยงค่าเริ่มต้น GPT-4.x

### หน้าต่างความเข้ากันได้แบบ legacy

Package Acceptance มีหน้าต่าง legacy-compatibility ที่มีขอบเขตสำหรับแพ็กเกจที่เผยแพร่แล้ว แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้เส้นทาง compatibility ได้:

- รายการ QA private ที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ถูกละไว้จาก tarball;
- `doctor-switch` อาจข้าม subcase การ persistence ของ `gateway install --wrapper` เมื่อแพ็กเกจไม่ expose flag นั้น;
- `update-channel-switch` อาจ prune pnpm `patchedDependencies` ที่หายไปจาก fake git fixture ที่ derive จาก tarball และอาจ log `update.channel` ที่ persisted แล้วแต่หายไป;
- plugin smokes อาจอ่านตำแหน่ง install-record แบบ legacy หรือยอมรับ marketplace install-record persistence ที่หายไป;
- `plugin-update` อาจอนุญาต migration ของ config metadata ขณะยังคงต้องให้ install record และพฤติกรรม no-reinstall ไม่เปลี่ยนแปลง

แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ local build metadata stamp ที่ถูกส่งมอบไปแล้วด้วย แพ็กเกจที่ใหม่กว่าต้องผ่าน contract สมัยใหม่; เงื่อนไขเดียวกันจะล้มเหลวแทนที่จะเตือนหรือข้าม

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

เมื่อ debugging การรัน package acceptance ที่ล้มเหลว ให้เริ่มที่สรุป `resolve_package` เพื่อยืนยันแหล่งแพ็กเกจ, version และ SHA-256 จากนั้นตรวจสอบ child run ของ `docker_acceptance` และ Docker artifacts ของมัน: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase timings และคำสั่ง rerun ควร rerun profile แพ็กเกจที่ล้มเหลวหรือ Docker lanes ที่ตรงกันทุกประการ แทนการ rerun full release validation

## Smoke การติดตั้ง

เวิร์กโฟลว์ `Install Smoke` แยกต่างหากนำ scope script เดียวกันกลับมาใช้ผ่านงาน `preflight` ของตัวเอง โดยแบ่ง smoke coverage เป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **เส้นทางเร็ว** ทำงานสำหรับ pull request ที่แตะพื้นผิว Docker/package, การเปลี่ยนแปลง package/manifest ของ Plugin ที่รวมมา, หรือพื้นผิว core plugin/channel/gateway/Plugin SDK ที่งาน Docker smoke ใช้ทดสอบ การเปลี่ยนแปลง Plugin ที่รวมมาเฉพาะซอร์ส, การแก้ไขเฉพาะการทดสอบ, และการแก้ไขเฉพาะเอกสารจะไม่จอง Docker worker เส้นทางเร็วจะสร้างอิมเมจจาก Dockerfile รากหนึ่งครั้ง, ตรวจสอบ CLI, รัน CLI smoke สำหรับลบ agents shared-workspace, รัน container gateway-network e2e, ตรวจสอบ build arg ของส่วนขยายที่รวมมา, และรันโปรไฟล์ Docker ของ bundled-plugin แบบจำกัดภายใต้ timeout รวมของคำสั่ง 240 วินาที (Docker run ของแต่ละ scenario ถูกจำกัดแยกกัน)
- **เส้นทางเต็ม** เก็บ coverage ของการติดตั้ง QR package และ installer Docker/update ไว้สำหรับ scheduled run รายคืน, manual dispatch, workflow-call release checks, และ pull request ที่แตะพื้นผิว installer/package/Docker จริง ๆ ในโหมดเต็ม install-smoke จะเตรียมหรือนำอิมเมจ smoke ของ GHCR root Dockerfile สำหรับ target-SHA หนึ่งรายการกลับมาใช้ซ้ำ จากนั้นรัน QR package install, root Dockerfile/gateway smokes, installer/update smokes, และ Docker E2E แบบ fast bundled-plugin เป็นงานแยกกัน เพื่อให้งาน installer ไม่ต้องรอหลัง smoke ของอิมเมจราก

การ push ไปยัง `main` (รวมถึง merge commit) จะไม่บังคับใช้เส้นทางเต็ม เมื่อ logic ของ changed-scope ขอ coverage เต็มในการ push workflow จะคง fast Docker smoke ไว้และปล่อย full install smoke ให้ validation รายคืนหรือ release validation

smoke ของ Bun global install image-provider ที่ช้าถูก gate แยกด้วย `run_bun_global_install_smoke` มันทำงานตาม schedule รายคืนและจาก workflow ของ release checks และ manual `Install Smoke` dispatch สามารถเลือกเปิดใช้ได้ แต่ pull request และการ push ไปยัง `main` จะไม่ทำงานนี้ CI ของ PR ปกติยังคงรันเลน regression ของ fast Bun launcher สำหรับการเปลี่ยนแปลงที่เกี่ยวข้องกับ Node การทดสอบ QR และ installer Docker จะคง Dockerfile ที่เน้นการติดตั้งของตัวเองไว้

## Docker E2E ในเครื่อง

`pnpm test:docker:all` จะ prebuild อิมเมจ live-test ที่ใช้ร่วมกันหนึ่งรายการ, pack OpenClaw หนึ่งครั้งเป็น npm tarball, และสร้างอิมเมจ `scripts/e2e/Dockerfile` ที่ใช้ร่วมกันสองรายการ:

- runner Node/Git เปล่าสำหรับเลน installer/update/plugin-dependency;
- อิมเมจที่ใช้งานได้จริงซึ่งติดตั้ง tarball เดียวกันลงใน `/app` สำหรับเลน functionality ปกติ

นิยามเลน Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs`, และ runner จะรันเฉพาะ plan ที่เลือกไว้ scheduler เลือกอิมเมจต่อเลนด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` จากนั้นรันเลนด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### ค่าที่ปรับได้

| ตัวแปร                                  | ค่าเริ่มต้น | จุดประสงค์                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | จำนวน slot ของ main-pool สำหรับเลนปกติ                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | จำนวน slot ของ tail-pool ที่ไวต่อ provider                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | เพดานเลน live ที่ทำงานพร้อมกัน เพื่อไม่ให้ provider throttle                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | เพดานเลน npm install ที่ทำงานพร้อมกัน                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | เพดานเลน multi-service ที่ทำงานพร้อมกัน                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | ช่วงหน่วงระหว่างการเริ่มเลนเพื่อหลีกเลี่ยงพายุการสร้างของ Docker daemon; ตั้งเป็น `0` หากไม่ต้องการหน่วง     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout fallback ต่อเลน (120 นาที); เลน live/tail ที่เลือกไว้ใช้เพดานที่เข้มงวดกว่า           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` พิมพ์ plan ของ scheduler โดยไม่รันเลน                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | รายการเลนแบบตรงตัวคั่นด้วยจุลภาค; ข้าม cleanup smoke เพื่อให้ agent ทำซ้ำเลนที่ล้มเหลวหนึ่งเลนได้ |

เลนที่หนักกว่าเพดาน effective ของตัวเองยังสามารถเริ่มจาก pool ว่างได้ จากนั้นจะรันลำพังจนกว่าจะคืน capacity aggregate ในเครื่องจะ preflight Docker, ลบ container OpenClaw E2E เก่าที่ค้างอยู่, แสดงสถานะ active-lane, เก็บ timing ของเลนเพื่อเรียงจากนานสุดก่อน, และหยุด schedule เลน pooled ใหม่หลังพบ failure แรกโดยค่าเริ่มต้น

### Workflow live/E2E ที่นำกลับมาใช้ซ้ำได้

workflow live/E2E ที่นำกลับมาใช้ซ้ำได้จะถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องใช้ package, ชนิดอิมเมจ, live image, เลน, และ coverage ของ credential ใด `scripts/docker-e2e.mjs` จากนั้นแปลง plan นั้นเป็น GitHub outputs และ summaries มันจะ pack OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลด package artifact ของ run ปัจจุบัน, หรือดาวน์โหลด package artifact จาก `package_artifact_run_id`; ตรวจสอบ inventory ของ tarball; สร้างและ push อิมเมจ GHCR Docker E2E แบบ bare/functional ที่ tag ด้วย package digest ผ่าน Docker layer cache ของ Blacksmith เมื่อ plan ต้องใช้เลนที่ติดตั้ง package แล้ว; และนำ input `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรืออิมเมจ package-digest ที่มีอยู่กลับมาใช้ซ้ำแทนการสร้างใหม่ การ pull อิมเมจ Docker จะ retry ด้วย timeout ต่อ attempt แบบจำกัดที่ 180 วินาที เพื่อให้ registry/cache stream ที่ค้าง retry ได้เร็ว แทนที่จะกินเวลาส่วนใหญ่ของ critical path ใน CI

### ชิ้นส่วนของ release path

coverage ของ Release Docker รันงานแบบ chunk ที่เล็กลงด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละ chunk pull เฉพาะชนิดอิมเมจที่ต้องใช้และ execute หลายเลนผ่าน weighted scheduler เดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

chunk ของ Release Docker ปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, และ `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` `package-update-openai` รวมเลน package ของ Codex plugin แบบ live ซึ่งติดตั้ง package candidate ของ OpenClaw, ติดตั้ง Codex plugin จาก `codex_plugin_spec` หรือ tarball ref เดียวกันพร้อมการอนุมัติการติดตั้ง Codex CLI อย่างชัดเจน, รัน Codex CLI preflight, จากนั้นรัน OpenClaw agent หลาย turn ใน session เดียวกันกับ OpenAI `plugins-runtime-core`, `plugins-runtime`, และ `plugins-integrations` ยังคงเป็น alias รวมของ plugin/runtime alias ของเลน `install-e2e` ยังคงเป็น alias rerun แบบ manual รวมสำหรับเลน installer ของ provider ทั้งคู่

OpenWebUI ถูกพับเข้าไปใน `plugins-runtime-services` เมื่อ coverage แบบ full release-path ขอใช้งาน และคง chunk `openwebui` แบบ standalone ไว้เฉพาะ dispatch ที่เป็น OpenWebUI-only เลน bundled-channel update จะ retry หนึ่งครั้งสำหรับ failure ของเครือข่าย npm ที่เกิดชั่วคราว

แต่ละ chunk จะ upload `.artifacts/docker-tests/` พร้อม log ของเลน, timing, `summary.json`, `failures.json`, phase timing, scheduler plan JSON, ตาราง slow-lane, และคำสั่ง rerun ต่อเลน input `docker_lanes` ของ workflow จะรันเลนที่เลือกกับอิมเมจที่เตรียมไว้แทนงาน chunk ซึ่งทำให้การ debug เลนที่ล้มเหลวถูกจำกัดอยู่ในงาน Docker เป้าหมายหนึ่งงาน และเตรียม ดาวน์โหลด หรือนำ package artifact กลับมาใช้ซ้ำสำหรับ run นั้น หากเลนที่เลือกเป็น live Docker lane งานเป้าหมายจะสร้างอิมเมจ live-test ในเครื่องสำหรับการ rerun นั้น คำสั่ง GitHub rerun ต่อเลนที่สร้างขึ้นจะรวม `package_artifact_run_id`, `package_artifact_name`, และ input อิมเมจที่เตรียมไว้เมื่อมีค่าเหล่านั้น เพื่อให้เลนที่ล้มเหลวสามารถใช้งาน package และอิมเมจชุดเดิมจาก run ที่ล้มเหลวได้

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

workflow live/E2E ตาม schedule จะรันชุด Docker แบบ full release-path ทุกวัน

## Plugin Prerelease

`Plugin Prerelease` เป็น coverage ของ product/package ที่มีต้นทุนสูงกว่า จึงเป็น workflow แยกที่ dispatch โดย `Full Release Validation` หรือโดย operator อย่างชัดเจน pull request ปกติ, การ push ไปยัง `main`, และ standalone manual CI dispatch จะปิด suite นี้ไว้ มันกระจายการทดสอบ Plugin ที่รวมมาไปยัง extension worker แปดตัว งาน extension shard เหล่านั้นรันกลุ่ม config ของ Plugin ได้สูงสุดครั้งละสองกลุ่ม โดยมี Vitest worker หนึ่งตัวต่อกลุ่มและ Node heap ที่ใหญ่ขึ้น เพื่อให้ batch ของ Plugin ที่มี import หนักไม่สร้างงาน CI เพิ่ม path prerelease ของ Docker เฉพาะ release จะ batch เลน Docker เป้าหมายเป็นกลุ่มเล็ก ๆ เพื่อหลีกเลี่ยงการจอง runner หลายสิบตัวสำหรับงานที่ใช้เวลาหนึ่งถึงสามนาที workflow ยัง upload artifact `plugin-inspector-advisory` เพื่อให้ข้อมูลจาก `@openclaw/plugin-inspector`; finding ของ inspector เป็นข้อมูลสำหรับ triage และไม่เปลี่ยน gate ของ Plugin Prerelease ที่เป็นตัวบล็อก

## QA Lab

QA Lab มีเลน CI เฉพาะอยู่นอก workflow หลักที่ scoped แบบ smart Agentic parity ถูกซ้อนอยู่ภายใต้ harness ของ QA และ release แบบกว้าง ไม่ใช่ workflow PR แบบ standalone ใช้ `Full Release Validation` พร้อม `rerun_group=qa-parity` เมื่อ parity ควรไปพร้อมกับ validation run แบบกว้าง

- workflow `QA-Lab - All Lanes` รันทุกคืนบน `main` และบน manual dispatch; มัน fan out เลน mock parity, เลน live Matrix, และเลน live Telegram กับ Discord เป็นงานคู่ขนาน งาน live ใช้ environment `qa-live-shared` และ Telegram/Discord ใช้ Convex lease

Release checks รันเลน live transport ของ Matrix และ Telegram ด้วย deterministic mock provider และ model ที่ qualify ด้วย mock (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อแยก contract ของ channel ออกจาก latency ของ live model และ startup ปกติของ provider-plugin live transport gateway ปิด memory search เพราะ QA parity ครอบคลุมพฤติกรรม memory แยกต่างหาก ส่วนการเชื่อมต่อ provider ครอบคลุมโดย suite live model, native provider, และ Docker provider แยกต่างหาก

Matrix ใช้ `--profile fast` สำหรับ gate ตาม schedule และ release โดยเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout รองรับ ค่าเริ่มต้นของ CLI และ input ของ manual workflow ยังคงเป็น `all`; manual dispatch ที่ตั้ง `matrix_profile=all` จะ shard coverage ของ Matrix แบบเต็มเป็นงาน `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรันเลน QA Lab ที่สำคัญต่อ release ก่อนอนุมัติ release; gate QA parity ของมันรัน candidate และ baseline pack เป็นงานเลนแบบคู่ขนาน จากนั้นดาวน์โหลด artifact ทั้งสองเข้าไปในงาน report ขนาดเล็กเพื่อทำการเปรียบเทียบ parity ขั้นสุดท้าย

สำหรับ PR ปกติ ให้ใช้หลักฐาน CI/check ตาม scope แทนการถือว่า parity เป็นสถานะที่จำเป็น

## CodeQL

workflow `CodeQL` ตั้งใจให้เป็น security scanner รอบแรกแบบแคบ ไม่ใช่การ sweep repository เต็มรูปแบบ guard run รายวัน, manual, และ pull request ที่ไม่ใช่ draft จะ scan โค้ด Actions workflow รวมถึงพื้นผิว JavaScript/TypeScript ที่มีความเสี่ยงสูงสุดด้วย security query ความเชื่อมั่นสูงที่กรองเฉพาะ `security-severity` ระดับ high/critical

guard ของ pull request ยังคงเบา: มันเริ่มเฉพาะการเปลี่ยนแปลงภายใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, หรือ path runtime ของ Plugin ที่รวมมาและเป็นเจ้าของ process และมันรัน matrix security ความเชื่อมั่นสูงชุดเดียวกับ workflow ตาม schedule Android และ macOS CodeQL จะไม่อยู่ในค่าเริ่มต้นของ PR

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                          | พื้นผิว                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | การยืนยันตัวตน, ความลับ, แซนด์บ็อกซ์, cron และค่าพื้นฐาน Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการใช้งานการนำช่องทางหลักไปใช้ รวมถึงรันไทม์ Plugin ช่องทาง, Gateway, Plugin SDK, ความลับ และจุดสัมผัสการตรวจสอบ              |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF หลัก, การแยกวิเคราะห์ IP, ตัวป้องกันเครือข่าย, web-fetch และพื้นผิวนโยบาย SSRF ของ Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | เซิร์ฟเวอร์ MCP, ตัวช่วยการดำเนินการโปรเซส, การส่งออกขาออก และเกตการดำเนินการเครื่องมือของเอเจนต์                                           |
| `/codeql-security-high/process-exec-boundary`     | เชลล์ภายในเครื่อง, ตัวช่วย spawn โปรเซส, รันไทม์ Plugin แบบบันเดิลที่เป็นเจ้าของซับโปรเซส และกาวของสคริปต์เวิร์กโฟลว์                             |
| `/codeql-security-high/plugin-trust-boundary`     | การติดตั้ง Plugin, ตัวโหลด, manifest, registry, การติดตั้งด้วย package-manager, การโหลดซอร์ส และพื้นผิวความเชื่อถือของสัญญาแพ็กเกจ Plugin SDK |

### ชาร์ดความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — ชาร์ดความปลอดภัย Android แบบกำหนดเวลา สร้างแอป Android ด้วยตนเองสำหรับ CodeQL บน Blacksmith Linux runner ที่เล็กที่สุดซึ่งผ่านการตรวจสอบความสมเหตุสมผลของเวิร์กโฟลว์ อัปโหลดภายใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — ชาร์ดความปลอดภัย macOS รายสัปดาห์/แบบสั่งเอง สร้างแอป macOS ด้วยตนเองสำหรับ CodeQL บน Blacksmith macOS, กรองผลลัพธ์การบิลด์ dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดภายใต้ `/codeql-critical-security/macos` เก็บไว้นอกค่าเริ่มต้นรายวันเพราะการบิลด์ macOS ครองเวลารันไทม์แม้เมื่อสะอาดก็ตาม

### หมวดหมู่คุณภาพระดับวิกฤต

`CodeQL Critical Quality` คือชาร์ดที่ตรงกันในด้านที่ไม่ใช่ความปลอดภัย โดยรันเฉพาะคิวรีคุณภาพ JavaScript/TypeScript ที่ไม่ใช่ความปลอดภัยและมีระดับความรุนแรงเป็น error บนพื้นผิวแคบที่มีมูลค่าสูงบน GitHub-hosted Linux runners เพื่อให้การสแกนคุณภาพไม่ใช้โควตา runner-registration ของ Blacksmith การ์ด pull request ของมันจงใจให้เล็กกว่าโปรไฟล์แบบกำหนดเวลา: PR ที่ไม่ใช่ draft จะรันเฉพาะชาร์ด `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` ที่ตรงกัน สำหรับการเปลี่ยนแปลงโค้ดการดำเนินการคำสั่ง/โมเดล/เครื่องมือของเอเจนต์และการ dispatch คำตอบ, โค้ดสคีมา/การย้ายข้อมูล/IO ของ config, โค้ด auth/ความลับ/แซนด์บ็อกซ์/ความปลอดภัย, ช่องทางหลักและรันไทม์ Plugin ช่องทางแบบบันเดิล, โปรโตคอล Gateway/เมธอดเซิร์ฟเวอร์, กาวรันไทม์หน่วยความจำ/SDK, MCP/โปรเซส/การส่งออกขาออก, รันไทม์ provider/แคตตาล็อกโมเดล, การวินิจฉัยเซสชัน/คิวการส่ง, ตัวโหลด Plugin, สัญญา Plugin SDK/แพ็กเกจ หรือรันไทม์คำตอบของ Plugin SDK การเปลี่ยนแปลง config ของ CodeQL และเวิร์กโฟลว์คุณภาพจะรันชาร์ดคุณภาพ PR ทั้งสิบสองชาร์ด

การ dispatch แบบสั่งเองรับค่า:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

โปรไฟล์แคบเป็น hook สำหรับการสอน/การวนซ้ำ เพื่อรันชาร์ดคุณภาพหนึ่งชาร์ดแบบแยกเดี่ยว

| หมวดหมู่                                                | พื้นผิว                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ดขอบเขตความปลอดภัยของการยืนยันตัวตน, ความลับ, แซนด์บ็อกซ์, cron และ Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | สคีมา config, การย้ายข้อมูล, การทำให้เป็นมาตรฐาน และสัญญา IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | สคีมาโปรโตคอล Gateway และสัญญาเมธอดเซิร์ฟเวอร์                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญาการนำช่องทางหลักและ Plugin ช่องทางแบบบันเดิลไปใช้                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | การดำเนินการคำสั่ง, การ dispatch โมเดล/provider, การ dispatch และคิว auto-reply และสัญญารันไทม์ control-plane ของ ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | เซิร์ฟเวอร์ MCP และบริดจ์เครื่องมือ, ตัวช่วยกำกับดูแลโปรเซส และสัญญาการส่งออกขาออก                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK โฮสต์หน่วยความจำ, facade รันไทม์หน่วยความจำ, alias Plugin SDK ของหน่วยความจำ, กาวการเปิดใช้งานรันไทม์หน่วยความจำ และคำสั่ง doctor หน่วยความจำ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | ภายในคิวคำตอบ, คิวการส่งของเซสชัน, ตัวช่วยผูก/ส่งเซสชันขาออก, พื้นผิวบันเดิลเหตุการณ์/ล็อกวินิจฉัย และสัญญา CLI ของ doctor เซสชัน |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | การ dispatch คำตอบขาเข้าของ Plugin SDK, ตัวช่วย payload/chunking/runtime ของคำตอบ, ตัวเลือกคำตอบของช่องทาง, คิวการส่ง และตัวช่วยผูกเซสชัน/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | การทำแคตตาล็อกโมเดลให้เป็นมาตรฐาน, auth และ discovery ของ provider, การลงทะเบียนรันไทม์ provider, ค่าเริ่มต้น/แคตตาล็อก provider และ registry สำหรับ web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | การ bootstrap ของ Control UI, การคงอยู่ภายในเครื่อง, โฟลว์ควบคุม Gateway และสัญญารันไทม์ control-plane ของงาน                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | web fetch/search หลัก, media IO, การทำความเข้าใจสื่อ, การสร้างรูปภาพ และสัญญารันไทม์การสร้างสื่อ                                                    |
| `/codeql-critical-quality/plugin-boundary`              | สัญญาของตัวโหลด, registry, พื้นผิวสาธารณะ และ entrypoint ของ Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | ซอร์ส Plugin SDK ฝั่งแพ็กเกจที่เผยแพร่แล้ว และตัวช่วยสัญญาแพ็กเกจ Plugin                                                                                      |

คุณภาพแยกจากความปลอดภัยเพื่อให้ finding ด้านคุณภาพสามารถกำหนดเวลา, วัดผล, ปิดใช้งาน หรือขยายได้โดยไม่บดบังสัญญาณความปลอดภัย ควรเพิ่มการขยาย CodeQL สำหรับ Swift, Python และ Plugin แบบบันเดิลกลับเข้ามาเป็นงานติดตามผลแบบมีขอบเขตหรือแบบชาร์ดเท่านั้น หลังจากโปรไฟล์แคบมีรันไทม์และสัญญาณที่เสถียรแล้ว

## เวิร์กโฟลว์การบำรุงรักษา

### Docs Agent

เวิร์กโฟลว์ `Docs Agent` คือเลนบำรุงรักษา Codex ที่ขับเคลื่อนด้วยเหตุการณ์ สำหรับคงให้เอกสารที่มีอยู่สอดคล้องกับการเปลี่ยนแปลงที่เพิ่งลงสู่ระบบ ไม่มี schedule ล้วน: การรัน CI จาก push ที่สำเร็จและไม่ใช่บอตบน `main` สามารถกระตุ้นได้ และการ dispatch แบบสั่งเองสามารถรันได้โดยตรง การเรียกจาก workflow-run จะข้ามเมื่อ `main` เคลื่อนไปแล้ว หรือเมื่อมีการสร้างการรัน Docs Agent อื่นที่ไม่ถูกข้ามในชั่วโมงที่ผ่านมา เมื่อรัน มันจะตรวจทานช่วง commit จาก SHA แหล่งที่มาของ Docs Agent ที่ไม่ถูกข้ามครั้งก่อนถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงครั้งเดียวสามารถครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมตั้งแต่การตรวจเอกสารครั้งล่าสุด

### Test Performance Agent

เวิร์กโฟลว์ `Test Performance Agent` คือเลนบำรุงรักษา Codex ที่ขับเคลื่อนด้วยเหตุการณ์สำหรับเทสต์ที่ช้า ไม่มี schedule ล้วน: การรัน CI จาก push ที่สำเร็จและไม่ใช่บอตบน `main` สามารถกระตุ้นได้ แต่จะข้ามหากการเรียกจาก workflow-run อื่นรันแล้วหรือกำลังรันอยู่ในวัน UTC นั้น การ dispatch แบบสั่งเองจะข้ามเกต activity รายวันนี้ เลนนี้สร้างรายงานประสิทธิภาพ Vitest แบบจัดกลุ่มสำหรับทั้งชุด ให้ Codex ทำเฉพาะการแก้ไขประสิทธิภาพเทสต์ขนาดเล็กที่ยังรักษา coverage แทนการ refactor กว้าง จากนั้นรันรายงานทั้งชุดซ้ำและปฏิเสธการเปลี่ยนแปลงที่ลดจำนวน baseline เทสต์ที่ผ่าน รายงานแบบจัดกลุ่มบันทึก wall time ต่อ config และ RSS สูงสุดบน Linux และ macOS เพื่อให้การเปรียบเทียบก่อน/หลังแสดงเดลตาหน่วยความจำของเทสต์ควบคู่กับเดลตาระยะเวลา หาก baseline มีเทสต์ล้มเหลว Codex อาจแก้ได้เฉพาะความล้มเหลวที่ชัดเจน และรายงานทั้งชุดหลังเอเจนต์ต้องผ่านก่อนจะ commit อะไรก็ตาม เมื่อ `main` เดินหน้าก่อน bot push จะลง เลนนี้จะ rebase แพตช์ที่ตรวจสอบแล้ว, รัน `pnpm check:changed` ซ้ำ และลอง push อีกครั้ง; แพตช์เก่าที่ขัดแย้งจะถูกข้าม ใช้ GitHub-hosted Ubuntu เพื่อให้ action ของ Codex รักษาท่าทีความปลอดภัยแบบ drop-sudo เดียวกับ docs agent ได้

### PR ซ้ำหลัง Merge

เวิร์กโฟลว์ `Duplicate PRs After Merge` คือเวิร์กโฟลว์ maintainer แบบสั่งเองสำหรับการล้างรายการซ้ำหลังลงระบบ ค่าเริ่มต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุอย่างชัดเจนเมื่อ `apply=true` ก่อนแก้ไข GitHub มันตรวจสอบว่า PR ที่ลงระบบถูก merge แล้ว และ PR ซ้ำแต่ละรายการมี issue ที่อ้างอิงร่วมกันหรือมี hunk ที่เปลี่ยนแปลงทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## เกตตรวจสอบภายในเครื่องและการจัดเส้นทางการเปลี่ยนแปลง

ตรรกะ changed-lane ภายในเครื่องอยู่ใน `scripts/changed-lanes.mjs` และถูกดำเนินการโดย `scripts/check-changed.mjs` เกตตรวจสอบภายในเครื่องนั้นเข้มงวดกับขอบเขตสถาปัตยกรรมมากกว่าขอบเขตแพลตฟอร์ม CI แบบกว้าง:

- การเปลี่ยนแปลง production หลักจะรัน typecheck ของ core prod และ core test รวมถึง lint/guards ของ core;
- การเปลี่ยนแปลงเฉพาะเทสต์หลักจะรันเฉพาะ typecheck ของ core test รวมถึง lint ของ core;
- การเปลี่ยนแปลง production ของ extension จะรัน typecheck ของ extension prod และ extension test รวมถึง lint ของ extension;
- การเปลี่ยนแปลงเฉพาะเทสต์ของ extension จะรัน typecheck ของ extension test รวมถึง lint ของ extension;
- การเปลี่ยนแปลง Plugin SDK สาธารณะหรือ plugin-contract จะขยายไปยัง typecheck ของ extension เพราะ extension พึ่งพาสัญญาหลักเหล่านั้น (การ sweep extension ของ Vitest ยังคงเป็นงานเทสต์ที่ต้องระบุชัดเจน);
- การ bump เวอร์ชันแบบ metadata-only สำหรับ release จะรันการตรวจ version/config/root-dependency แบบเจาะจง;
- การเปลี่ยนแปลง root/config ที่ไม่รู้จักจะ fail safe ไปยังเลนตรวจสอบทั้งหมด

การจัดเส้นทาง changed-test ภายในเครื่องอยู่ใน `scripts/test-projects.test-support.mjs` และจงใจให้ถูกกว่า `check:changed`: การแก้ไขเทสต์โดยตรงจะรันตัวเอง, การแก้ไขซอร์สจะเลือก mapping ที่ชัดเจนก่อน แล้วจึงเป็นเทสต์พี่น้องและ dependent จาก import-graph config การส่งใน group-room ที่ใช้ร่วมกันเป็นหนึ่งใน mapping ที่ชัดเจน: การเปลี่ยนแปลง config คำตอบที่มองเห็นได้ในกลุ่ม, โหมดการส่งคำตอบจากซอร์ส หรือพรอมป์ระบบของ message-tool จะถูกจัดเส้นทางผ่านเทสต์คำตอบหลัก รวมถึง regression การส่งของ Discord และ Slack เพื่อให้การเปลี่ยนค่าเริ่มต้นที่ใช้ร่วมกันล้มเหลวก่อน push PR ครั้งแรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างทั้ง harness มากพอที่ชุด mapped ราคาถูกจะไม่น่าเชื่อถือเป็นตัวแทน

## การตรวจสอบ Testbox

Crabbox คือ wrapper สำหรับกล่องระยะไกลที่ repo เป็นเจ้าของ สำหรับพิสูจน์บน Linux ของผู้ดูแล ใช้จาก root ของ repo เมื่อการตรวจสอบกว้างเกินไปสำหรับลูปแก้ไขในเครื่อง เมื่อความสอดคล้องกับ CI สำคัญ หรือเมื่อหลักฐานต้องใช้ความลับ, Docker, เลนแพ็กเกจ, กล่องที่ใช้ซ้ำได้ หรือบันทึกระยะไกล backend ปกติของ OpenClaw คือ `blacksmith-testbox`; ความจุ AWS/Hetzner ที่เป็นเจ้าของเองเป็นทางสำรองสำหรับกรณี Blacksmith ล่ม ปัญหาโควตา หรือการทดสอบบนความจุที่เป็นเจ้าของอย่างชัดเจน

การรัน Blacksmith ที่หนุนด้วย Crabbox จะวอร์ม อ้างสิทธิ์ ซิงก์ รัน รายงาน และล้าง Testboxes แบบใช้ครั้งเดียว การตรวจสอบความถูกต้องของการซิงก์ที่มีมาในตัวจะล้มเหลวอย่างรวดเร็วเมื่อไฟล์ root ที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short` แสดงการลบไฟล์ที่ tracked อย่างน้อย 200 รายการ สำหรับ PR ที่ตั้งใจลบไฟล์จำนวนมาก ให้ตั้ง `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับคำสั่งระยะไกล

Crabbox ยังยุติการเรียก Blacksmith CLI ในเครื่องที่ค้างอยู่ในเฟสซิงก์นานเกินห้านาทีโดยไม่มีเอาต์พุตหลังซิงก์ ตั้ง `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` เพื่อปิด guard นั้น หรือใช้ค่ามิลลิวินาทีที่มากขึ้นสำหรับ diff ในเครื่องที่ใหญ่ผิดปกติ

ก่อนรันครั้งแรก ให้ตรวจสอบ wrapper จาก root ของ repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

wrapper ของ repo จะปฏิเสธไบนารี Crabbox ที่ล้าสมัยซึ่งไม่ได้ประกาศ `blacksmith-testbox` ระบุ provider อย่างชัดเจนแม้ว่า `.crabbox.yaml` จะมีค่าเริ่มต้น owned-cloud อยู่แล้ว ใน worktree ของ Codex หรือ checkout แบบ linked/sparse ให้หลีกเลี่ยงสคริปต์ `pnpm crabbox:run` ในเครื่อง เพราะ pnpm อาจปรับ dependency ให้ตรงกันก่อน Crabbox เริ่มทำงาน ให้เรียก node wrapper โดยตรงแทน:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

การรันที่หนุนด้วย Blacksmith ต้องใช้ Crabbox 0.22.0 หรือใหม่กว่า เพื่อให้ wrapper ได้พฤติกรรมซิงก์ คิว และล้างข้อมูล Testbox ปัจจุบัน เมื่อใช้ checkout ข้างเคียง ให้ build ไบนารีในเครื่องที่ถูก ignore ใหม่ก่อนงานจับเวลาหรือพิสูจน์:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

gate สำหรับการเปลี่ยนแปลง:

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

อ่านสรุป JSON สุดท้าย ฟิลด์ที่มีประโยชน์คือ `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` และ `totalMs` สำหรับการรัน Blacksmith Testbox แบบ delegated exit code ของ Crabbox wrapper และสรุป JSON คือผลลัพธ์ของคำสั่ง การรัน GitHub Actions ที่ลิงก์อยู่เป็นเจ้าของ hydration และ keepalive; มันอาจจบเป็น `cancelled` เมื่อ Testbox ถูกหยุดจากภายนอกหลังจากคำสั่ง SSH ส่งคืนไปแล้ว ให้ถือว่านั่นเป็น artifact ของการล้างข้อมูล/สถานะ เว้นแต่ wrapper `exitCode` จะไม่เป็นศูนย์ หรือเอาต์พุตคำสั่งแสดงว่าการทดสอบล้มเหลว การรัน Crabbox ที่หนุนด้วย Blacksmith แบบใช้ครั้งเดียวควรหยุด Testbox โดยอัตโนมัติ; หากการรันถูกขัดจังหวะหรือการล้างข้อมูลไม่ชัดเจน ให้ตรวจสอบกล่องสดและหยุดเฉพาะกล่องที่คุณสร้าง:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

ใช้การใช้ซ้ำเฉพาะเมื่อคุณตั้งใจต้องใช้หลายคำสั่งบนกล่อง hydrated เดียวกัน:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

หาก Crabbox เป็นชั้นที่เสีย แต่ Blacksmith เองยังทำงานได้ ให้ใช้ Blacksmith โดยตรงเฉพาะสำหรับการวินิจฉัย เช่น `list`, `status` และการล้างข้อมูล แก้เส้นทาง Crabbox ก่อนถือว่าการรัน Blacksmith โดยตรงเป็นหลักฐานของผู้ดูแล

หาก `blacksmith testbox list --all` และ `blacksmith testbox status` ทำงาน แต่ warmup ใหม่ค้างที่ `queued` โดยไม่มี IP หรือ URL ของ Actions run หลังผ่านไปสองสามนาที ให้ถือว่าเป็นแรงกดดันจาก provider, คิว, billing หรือขีดจำกัด org ของ Blacksmith หยุด id ที่อยู่ในคิวที่คุณสร้าง หลีกเลี่ยงการเริ่ม Testbox เพิ่ม และย้ายหลักฐานไปยังเส้นทางความจุ Crabbox ที่เป็นเจ้าของด้านล่าง ระหว่างที่มีคนตรวจสอบ dashboard, billing และขีดจำกัด org ของ Blacksmith

ยกระดับไปยังความจุ Crabbox ที่เป็นเจ้าของเฉพาะเมื่อ Blacksmith ล่ม ถูกจำกัดโควตา ขาดสภาพแวดล้อมที่ต้องใช้ หรือความจุที่เป็นเจ้าของคือเป้าหมายอย่างชัดเจน:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

ภายใต้แรงกดดันของ AWS ให้หลีกเลี่ยง `class=beast` เว้นแต่งานนั้นต้องใช้ CPU ระดับ 48xlarge จริงๆ คำขอ `beast` เริ่มที่ 192 vCPU และเป็นวิธีที่ง่ายที่สุดในการชนโควตา EC2 Spot หรือ On-Demand Standard ระดับภูมิภาค `.crabbox.yaml` ที่ repo เป็นเจ้าของมีค่าเริ่มต้นเป็น `standard`, หลายภูมิภาคความจุ และ `capacity.hints: true` เพื่อให้ lease AWS ที่ brokered พิมพ์ภูมิภาค/ตลาดที่เลือก แรงกดดันโควตา fallback ของ Spot และคำเตือนคลาสแรงกดดันสูง ใช้ `fast` สำหรับการตรวจสอบกว้างที่หนักขึ้น ใช้ `large` เฉพาะหลังจาก standard/fast ไม่พอ และใช้ `beast` เฉพาะสำหรับเลนที่ใช้ CPU หนักเป็นพิเศษ เช่น full-suite หรือ matrix Docker ของทุก Plugin, การตรวจสอบ release/blocker อย่างชัดเจน หรือการทำ performance profiling ที่ใช้ core จำนวนมาก อย่าใช้ `beast` สำหรับ `pnpm check:changed`, การทดสอบเฉพาะจุด, งานเอกสารเท่านั้น, lint/typecheck ทั่วไป, การ repro E2E ขนาดเล็ก หรือการ triage กรณี Blacksmith ล่ม ใช้ `--market on-demand` สำหรับการวินิจฉัยความจุ เพื่อไม่ให้ความผันผวนของตลาด Spot ปะปนกับสัญญาณ

`.crabbox.yaml` เป็นเจ้าของค่าเริ่มต้นของ provider, sync และ hydration ของ GitHub Actions สำหรับเลน owned-cloud โดย exclude `.git` ในเครื่อง เพื่อให้ checkout ของ Actions ที่ hydrated แล้วคง metadata Git ระยะไกลของตัวเอง แทนที่จะซิงก์ remote และ object store ในเครื่องของผู้ดูแล และ exclude artifact runtime/build ในเครื่องที่ไม่ควรถูกโอนย้าย `.github/workflows/crabbox-hydrate.yml` เป็นเจ้าของ checkout, การตั้งค่า Node/pnpm, การ fetch `origin/main` และการส่งต่อสภาพแวดล้อมที่ไม่ใช่ความลับสำหรับคำสั่ง owned-cloud `crabbox run --id <cbx_id>`

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
