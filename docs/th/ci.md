---
read_when:
    - คุณต้องเข้าใจว่าเหตุใดงาน CI จึงทำงานหรือไม่ทำงาน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการรันหรือการรันซ้ำเพื่อตรวจสอบความถูกต้องของรีลีส
summary: กราฟงาน CI, เกตตามขอบเขต, งานครอบคลุมสำหรับรีลีส และคำสั่งในเครื่องที่เทียบเท่า
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-04-30T18:38:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: a24afc27606ac7f4e9ead89acdd319bffa23336610f8a6cd8b576ea1a5b233dd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI ทำงานทุกครั้งที่ส่งขึ้นไปยัง `main` และทุกคำขอดึงการเปลี่ยนแปลง งาน `preflight` จะจำแนกความแตกต่างและปิดเลนที่ใช้ทรัพยากรสูงเมื่อมีการเปลี่ยนเฉพาะพื้นที่ที่ไม่เกี่ยวข้อง การรัน `workflow_dispatch` ด้วยตนเองจะข้ามการกำหนดขอบเขตอัจฉริยะโดยเจตนา และกระจายงานเป็นกราฟเต็มสำหรับรุ่นที่เป็นตัวเลือกการเผยแพร่และการตรวจสอบความถูกต้องแบบกว้าง เลน Android ยังคงต้องเลือกเปิดผ่าน `include_android` ความครอบคลุม Plugin สำหรับการเผยแพร่เท่านั้นอยู่ในเวิร์กโฟลว์ [`Plugin Prerelease`](#plugin-prerelease) แยกต่างหาก และจะรันจาก [`Full Release Validation`](#full-release-validation) หรือการสั่งงานด้วยตนเองอย่างชัดเจนเท่านั้น

## ภาพรวม Pipeline

| งาน                              | วัตถุประสงค์                                                                                      | รันเมื่อ                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | ตรวจจับการเปลี่ยนแปลงเฉพาะเอกสาร ขอบเขตที่เปลี่ยน ส่วนขยายที่เปลี่ยน และสร้างรายการกำกับ CI      | เสมอเมื่อเป็นการส่งขึ้นและคำขอดึงการเปลี่ยนแปลงที่ไม่ใช่แบบร่าง |
| `security-scm-fast`              | ตรวจจับคีย์ส่วนตัวและตรวจสอบเวิร์กโฟลว์ผ่าน `zizmor`                                        | เสมอเมื่อเป็นการส่งขึ้นและคำขอดึงการเปลี่ยนแปลงที่ไม่ใช่แบบร่าง |
| `security-dependency-audit`      | ตรวจสอบไฟล์ล็อกของโปรดักชันโดยไม่ต้องพึ่งพาดีเพนเดนซี เทียบกับคำแนะนำด้านความปลอดภัยของ npm                             | เสมอเมื่อเป็นการส่งขึ้นและคำขอดึงการเปลี่ยนแปลงที่ไม่ใช่แบบร่าง |
| `security-fast`                  | ผลรวมที่จำเป็นสำหรับงานความปลอดภัยแบบเร็ว                                                | เสมอเมื่อเป็นการส่งขึ้นและคำขอดึงการเปลี่ยนแปลงที่ไม่ใช่แบบร่าง |
| `check-dependencies`             | รอบตรวจเฉพาะดีเพนเดนซีของ Knip สำหรับโปรดักชัน พร้อมตัวป้องกันรายการอนุญาตไฟล์ที่ไม่ได้ใช้                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-artifacts`                | สร้าง `dist/`, Control UI, ตรวจอาร์ติแฟกต์ที่สร้างแล้ว และอาร์ติแฟกต์ปลายน้ำที่ใช้ซ้ำได้          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-core`               | เลนตรวจความถูกต้องบน Linux แบบเร็ว เช่น การตรวจแบบรวม/สัญญา Plugin/โปรโตคอล                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-contracts-channels` | ตรวจสัญญาของช่องทางแบบแบ่งชาร์ด พร้อมผลตรวจรวมที่เสถียร                         | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-core-test`          | ชาร์ดทดสอบ Node หลัก โดยไม่รวมเลนช่องทาง แบบรวม สัญญา และส่วนขยาย             | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check`                          | เทียบเท่าเกตหลักในเครื่องแบบแบ่งชาร์ด: ชนิดโปรดักชัน, lint, ตัวป้องกัน, ชนิดทดสอบ และ smoke แบบเข้มงวด   | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check-additional`               | ชาร์ดสถาปัตยกรรม ขอบเขต ตัวป้องกันพื้นผิวส่วนขยาย ขอบเขตแพ็กเกจ และ gateway-watch | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-smoke`                    | การทดสอบ smoke ของ CLI ที่สร้างแล้ว และ smoke หน่วยความจำตอนเริ่มต้น                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks`                         | ตัวตรวจยืนยันสำหรับการทดสอบช่องทางของอาร์ติแฟกต์ที่สร้างแล้ว                                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-compat-node22`      | เลนสร้างและ smoke สำหรับความเข้ากันได้กับ Node 22                                                   | การสั่งงาน CI ด้วยตนเองสำหรับการเผยแพร่    |
| `check-docs`                     | การตรวจรูปแบบเอกสาร, lint และลิงก์เสีย                                                | เอกสารเปลี่ยน                       |
| `skills-python`                  | Ruff + pytest สำหรับ Skills ที่มี Python อยู่เบื้องหลัง                                                       | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Skills ภาษา Python      |
| `checks-windows`                 | การทดสอบเฉพาะ Windows สำหรับโปรเซส/พาธ พร้อมการถดถอยของตัวระบุการนำเข้า runtime ที่ใช้ร่วมกัน         | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows           |
| `macos-node`                     | เลนทดสอบ TypeScript บน macOS โดยใช้อาร์ติแฟกต์ที่สร้างแล้วร่วมกัน                                  | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `macos-swift`                    | Swift lint, การสร้าง และการทดสอบสำหรับแอป macOS                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `android`                        | การทดสอบหน่วย Android สำหรับทั้งสอง flavor พร้อมการสร้าง APK debug หนึ่งรายการ                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android           |
| `test-performance-agent`         | การปรับปรุงการทดสอบที่ช้าของ Codex รายวันหลังมีกิจกรรมที่เชื่อถือได้                                    | CI หลักสำเร็จหรือสั่งงานด้วยตนเอง |

## ลำดับการล้มเร็ว

1. `preflight` ตัดสินว่าเลนใดจะมีอยู่เลย ตรรกะ `docs-scope` และ `changed-scope` เป็นขั้นตอนภายในงานนี้ ไม่ใช่งานแยกต่างหาก
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` ล้มเหลวอย่างรวดเร็วโดยไม่ต้องรอเมทริกซ์งานอาร์ติแฟกต์และแพลตฟอร์มที่หนักกว่า
3. `build-artifacts` ทำงานซ้อนกับเลน Linux แบบเร็ว เพื่อให้ผู้บริโภคปลายน้ำเริ่มได้ทันทีที่บิลด์ที่ใช้ร่วมกันพร้อม
4. จากนั้นเลนแพลตฟอร์มและ runtime ที่หนักกว่าจะกระจายออกไป: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่เป็น `cancelled` เมื่อมีการส่งขึ้นใหม่ลงในคำขอดึงการเปลี่ยนแปลงเดียวกันหรือ ref `main` เดียวกัน ให้ถือว่านั่นเป็นสัญญาณรบกวนของ CI เว้นแต่ว่ารันล่าสุดสำหรับ ref เดียวกันก็ล้มเหลวด้วย การตรวจชาร์ดแบบรวมใช้ `!cancelled() && always()` เพื่อให้ยังรายงานความล้มเหลวของชาร์ดตามปกติ แต่ไม่เข้าคิวหลังจากเวิร์กโฟลว์ทั้งหมดถูกแทนที่ไปแล้ว คีย์ concurrency อัตโนมัติของ CI มีเวอร์ชัน (`CI-v7-*`) เพื่อไม่ให้ซอมบีฝั่ง GitHub ในกลุ่มคิวเก่าปิดกั้นรันหลักที่ใหม่กว่าอย่างไม่มีกำหนด การรันชุดเต็มด้วยตนเองใช้ `CI-manual-v1-*` และไม่ยกเลิกรันที่กำลังดำเนินอยู่

## ขอบเขตและการกำหนดเส้นทาง

ตรรกะขอบเขตอยู่ใน `scripts/ci-changed-scope.mjs` และครอบคลุมด้วยการทดสอบหน่วยใน `src/scripts/ci-changed-scope.test.ts` การสั่งงานด้วยตนเองจะข้ามการตรวจจับ changed-scope และทำให้รายการกำกับ preflight ทำงานเสมือนว่าทุกพื้นที่ที่มีขอบเขตเปลี่ยนแล้ว

- **การแก้ไขเวิร์กโฟลว์ CI** ตรวจสอบกราฟ CI ของ Node พร้อมการ lint เวิร์กโฟลว์ แต่ไม่บังคับให้มีการสร้าง native ของ Windows, Android หรือ macOS ด้วยตัวเอง เลนแพลตฟอร์มเหล่านั้นยังคงจำกัดขอบเขตไว้ที่การเปลี่ยนแปลงซอร์สของแพลตฟอร์ม
- **การแก้ไขเฉพาะการกำหนดเส้นทาง CI, การแก้ไข fixture ทดสอบ core ราคาถูกที่เลือกไว้ และการแก้ไขตัวช่วย/การกำหนดเส้นทางทดสอบสัญญา Plugin แบบแคบ** ใช้พาธรายการกำกับ Node-only แบบเร็ว: `preflight`, ความปลอดภัย และงาน `checks-fast-core` เดียว พาธนั้นข้ามอาร์ติแฟกต์การสร้าง, ความเข้ากันได้กับ Node 22, สัญญาช่องทาง, ชาร์ด core เต็ม, ชาร์ด Plugin แบบรวม และเมทริกซ์ตัวป้องกันเพิ่มเติม เมื่อการเปลี่ยนจำกัดอยู่เฉพาะพื้นผิวการกำหนดเส้นทางหรือตัวช่วยที่งานเร็วทดสอบโดยตรง
- **การตรวจ Node บน Windows** จำกัดขอบเขตไว้ที่ตัวห่อโปรเซส/พาธเฉพาะ Windows, ตัวช่วยตัวรัน npm/pnpm/UI, การกำหนดค่าตัวจัดการแพ็กเกจ และพื้นผิวเวิร์กโฟลว์ CI ที่เรียกใช้เลนนั้น การเปลี่ยนแหล่งที่มา Plugin, install-smoke และเฉพาะการทดสอบที่ไม่เกี่ยวข้องจะยังคงอยู่บนเลน Linux Node

ตระกูลการทดสอบ Node ที่ช้าที่สุดถูกแยกหรือถ่วงน้ำหนักให้สมดุลเพื่อให้งานแต่ละงานยังเล็กโดยไม่จอง runner เกินจำเป็น: สัญญาช่องทางรันเป็นสามชาร์ดแบบถ่วงน้ำหนัก, เลนหน่วย core ขนาดเล็กถูกจับคู่, auto-reply รันเป็นผู้ทำงานที่สมดุลสี่ตัว (โดยแยก subtree การตอบกลับเป็นชาร์ด agent-runner, dispatch และ commands/state-routing) และการกำหนดค่า Gateway/Plugin แบบ agentic ถูกกระจายไปยังงาน Node แบบ agentic ที่อิงเฉพาะซอร์สเดิมแทนการรออาร์ติแฟกต์ที่สร้างแล้ว การทดสอบเบราว์เซอร์, QA, สื่อ และ Plugin อื่น ๆ แบบกว้างใช้การกำหนดค่า Vitest เฉพาะของตน แทน catch-all Plugin ที่ใช้ร่วมกัน ชาร์ด include-pattern บันทึกรายการเวลาโดยใช้ชื่อชาร์ด CI เพื่อให้ `.artifacts/vitest-shard-timings.json` แยกการกำหนดค่าทั้งชุดออกจากชาร์ดที่ถูกกรองได้ `check-additional` เก็บงาน compile/canary ขอบเขตแพ็กเกจไว้ด้วยกัน และแยกสถาปัตยกรรม topology ของ runtime ออกจากความครอบคลุม gateway watch ชาร์ดตัวป้องกันขอบเขตรันตัวป้องกันอิสระขนาดเล็กพร้อมกันภายในงานเดียว Gateway watch, การทดสอบช่องทาง และชาร์ดขอบเขตสนับสนุนของ core รันพร้อมกันภายใน `build-artifacts` หลังจาก `dist/` และ `dist-runtime/` ถูกสร้างแล้ว

Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` แล้วจึงสร้าง APK debug ของ Play flavor third-party ไม่มี source set หรือ manifest แยกต่างหาก เลนการทดสอบหน่วยของมันยังคอมไพล์ flavor ด้วยแฟล็ก BuildConfig สำหรับ SMS/call-log ขณะหลีกเลี่ยงงานแพ็กเกจ APK debug ซ้ำในทุกการส่งขึ้นที่เกี่ยวข้องกับ Android

ชาร์ด `check-dependencies` รัน `pnpm deadcode:dependencies` (รอบตรวจเฉพาะดีเพนเดนซีของ Knip สำหรับโปรดักชัน ซึ่งตรึงกับ Knip เวอร์ชันล่าสุด โดยปิดอายุรุ่นขั้นต่ำของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบผลการค้นหาไฟล์ที่ไม่ได้ใช้ในโปรดักชันของ Knip กับ `scripts/deadcode-unused-files.allowlist.mjs` ตัวป้องกันไฟล์ที่ไม่ได้ใช้จะล้มเหลวเมื่อคำขอดึงการเปลี่ยนแปลงเพิ่มไฟล์ที่ไม่ได้ใช้ใหม่ซึ่งยังไม่ถูกทบทวน หรือเหลือรายการอนุญาตที่ล้าสมัยไว้ ขณะยังคงรักษาพื้นผิว Plugin แบบไดนามิก, ที่สร้างขึ้น, บิลด์, การทดสอบสด และสะพานแพ็กเกจที่ตั้งใจไว้ซึ่ง Knip ไม่สามารถ resolve แบบสถิตได้

## การสั่งงานด้วยตนเอง

การสั่งงาน CI ด้วยตนเองรันกราฟงานเดียวกับ CI ปกติ แต่บังคับเปิดทุกเลนที่มีขอบเขตซึ่งไม่ใช่ Android: ชาร์ด Linux Node, ชาร์ด Plugin แบบรวม, สัญญาช่องทาง, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, การตรวจเอกสาร, Python Skills, Windows, macOS และ Control UI i18n การสั่งงาน CI ด้วยตนเองแบบแยกเดี่ยวจะรัน Android เฉพาะเมื่อ `include_android=true`; ร่มการเผยแพร่เต็มจะเปิด Android โดยส่ง `include_android=true` การตรวจ static ของ Plugin prerelease, ชาร์ด `agentic-plugins` สำหรับการเผยแพร่เท่านั้น, การกวาด batch ส่วนขยายเต็ม และเลน Docker ของ Plugin prerelease ถูกแยกออกจาก CI ชุด Docker prerelease จะรันเฉพาะเมื่อ `Full Release Validation` สั่งงานเวิร์กโฟลว์ `Plugin Prerelease` แยกต่างหากพร้อมเปิดเกต release-validation

การรันด้วยตนเองใช้กลุ่ม concurrency ที่ไม่ซ้ำกัน เพื่อไม่ให้ชุดเต็มของ release-candidate ถูกยกเลิกโดยการส่งขึ้นหรือการรันคำขอดึงการเปลี่ยนแปลงอื่นบน ref เดียวกัน อินพุตทางเลือก `target_ref` ช่วยให้ผู้เรียกที่เชื่อถือได้รันกราฟนั้นกับ branch, tag หรือ SHA commit เต็ม โดยใช้ไฟล์เวิร์กโฟลว์จาก ref การสั่งงานที่เลือก

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| รันเนอร์                           | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, งานความปลอดภัยแบบเร็วและงานรวม (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจสอบโปรโตคอล/สัญญา/บันเดิลแบบเร็ว, การตรวจสอบสัญญาช่องทางแบบแบ่งชาร์ด, ชาร์ด `check` ยกเว้น lint, ชาร์ดและงานรวม `check-additional`, ตัวตรวจสอบงานรวมการทดสอบ Node, การตรวจสอบเอกสาร, Python Skills, workflow-sanity, labeler, auto-response; preflight ของ install-smoke ยังใช้ Ubuntu ที่โฮสต์โดย GitHub เพื่อให้เมทริกซ์ Blacksmith เข้าคิวได้เร็วขึ้น |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, ชาร์ด Plugin ที่มีน้ำหนักต่ำกว่า, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, และ `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, ชาร์ดการทดสอบ Linux Node, ชาร์ดการทดสอบ Plugin แบบบันเดิล, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (ไวต่อ CPU มากพอที่ 8 vCPU มีต้นทุนมากกว่าประโยชน์ที่ประหยัดได้); บิลด์ Docker ของ install-smoke (เวลารอคิว 32-vCPU มีต้นทุนมากกว่าประโยชน์ที่ประหยัดได้)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; fork จะ fallback ไปที่ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; fork จะ fallback ไปที่ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

## การตรวจสอบ Release แบบเต็ม

`Full Release Validation` คือ umbrella workflow แบบแมนนวลสำหรับ "รันทุกอย่างก่อน Release" โดยรับ branch, tag หรือ commit SHA แบบเต็ม แล้ว dispatch workflow `CI` แบบแมนนวลด้วยเป้าหมายนั้น, dispatch `Plugin Prerelease` สำหรับหลักฐาน Plugin/package/static/Docker เฉพาะ Release และ dispatch `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, ชุดทดสอบเส้นทาง Docker Release, live/E2E, OpenWebUI, ความเท่าเทียมของ QA Lab, Matrix และ Telegram lane นอกจากนี้ยังสามารถรัน workflow `NPM Telegram Beta E2E` หลัง publish ได้เมื่อระบุ package spec ที่ publish แล้ว

`release_profile` ควบคุมขอบเขต live/provider ที่ส่งเข้าไปยังการตรวจสอบ Release:

- `minimum` คงเฉพาะ lane สำคัญต่อ Release ของ OpenAI/core ที่เร็วที่สุด
- `stable` เพิ่มชุด provider/backend แบบ stable
- `full` รันเมทริกซ์ provider/media แบบ advisory ที่กว้าง

umbrella จะบันทึก id ของ child run ที่ dispatch แล้ว และงานสุดท้าย `Verify full validation` จะตรวจสอบข้อสรุปของ child run ปัจจุบันอีกครั้งและต่อท้ายตารางงานที่ช้าที่สุดของแต่ละ child run หาก workflow ลูกถูก rerun แล้วเปลี่ยนเป็นสีเขียว ให้ rerun เฉพาะงาน verifier ของ parent เพื่อรีเฟรชผลลัพธ์ umbrella และสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รับ `rerun_group` ใช้ `all` สำหรับ release candidate, `ci` สำหรับ child CI เต็มปกติเท่านั้น, `release-checks` สำหรับ child ของ Release ทุกตัว หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, หรือ `npm-telegram` บน umbrella วิธีนี้ทำให้การ rerun กล่อง Release ที่ล้มเหลวถูกจำกัดขอบเขตหลังแก้ไขแบบเฉพาะจุด

`OpenClaw Release Checks` ใช้ trusted workflow ref เพื่อ resolve ref ที่เลือกหนึ่งครั้งเป็น tarball `release-package-under-test` จากนั้นส่ง artifact นั้นไปยังทั้ง workflow Docker เส้นทาง Release แบบ live/E2E และชาร์ด package acceptance วิธีนี้ทำให้ byte ของ package สอดคล้องกันทั่วทั้งกล่อง Release และหลีกเลี่ยงการ pack candidate เดิมซ้ำในหลาย child job

## ชาร์ด Live และ E2E

child ของ Release live/E2E ยังคงครอบคลุม `pnpm test:live` แบบ native กว้าง แต่จะรันเป็นชาร์ดที่มีชื่อผ่าน `scripts/test-live-shard.mjs` แทนงานแบบ serial งานเดียว:

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

วิธีนี้คงการครอบคลุมไฟล์เดิมไว้ ขณะทำให้ความล้มเหลวของ live provider ที่ช้าง่ายต่อการ rerun และวินิจฉัยมากขึ้น ชื่อชาร์ดรวม `native-live-extensions-o-z`, `native-live-extensions-media`, และ `native-live-extensions-media-music` ยังคงใช้ได้สำหรับการ rerun แบบ one-shot ด้วยตนเอง

ชาร์ด media แบบ native live รันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งสร้างโดย workflow `Live Media Runner Image` image นั้นติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้า งาน media จึงตรวจสอบเฉพาะ binary ก่อน setup ให้คงชุดทดสอบ live ที่ใช้ Docker backend ไว้บน Blacksmith runner ปกติ เพราะ container job ไม่ใช่ที่ที่เหมาะสำหรับเปิดทดสอบ Docker ซ้อน

ชาร์ด live model/backend ที่ใช้ Docker backend ใช้ image แชร์แยกต่างหาก `ghcr.io/openclaw/openclaw-live-test:<sha>` ต่อ commit ที่เลือก workflow live Release จะ build และ push image นั้นหนึ่งครั้ง จากนั้นชาร์ด Docker live model, Gateway, CLI backend, ACP bind และ Codex harness จะรันด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` หากชาร์ดเหล่านั้น rebuild เป้าหมาย Docker ของ source เต็มแยกกันเอง แปลว่าการตั้งค่า Release run ผิดและจะเสียเวลาจริงไปกับการ build image ซ้ำ

## Package Acceptance

ใช้ `Package Acceptance` เมื่อคำถามคือ "package OpenClaw ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์ได้หรือไม่" สิ่งนี้แตกต่างจาก CI ปกติ: CI ปกติตรวจสอบ source tree ส่วน package acceptance ตรวจสอบ tarball เดียวผ่าน Docker E2E harness เดียวกับที่ผู้ใช้ใช้งานหลังติดตั้งหรืออัปเดต

### งาน

1. `resolve_package` checkout `workflow_ref`, resolve package candidate หนึ่งตัว, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, อัปโหลดทั้งสองเป็น artifact `package-under-test` และพิมพ์ source, workflow ref, package ref, version, SHA-256 และ profile ในสรุปขั้นตอนของ GitHub
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` workflow ที่ reuse ได้จะดาวน์โหลด artifact นั้น, ตรวจสอบ inventory ของ tarball, เตรียม image Docker แบบ package-digest เมื่อจำเป็น และรัน Docker lane ที่เลือกกับ package นั้นแทนการ pack checkout ของ workflow เมื่อ profile เลือก `docker_lanes` แบบ targeted หลายรายการ workflow ที่ reuse ได้จะเตรียม package และ image แชร์หนึ่งครั้ง จากนั้นกระจาย lane เหล่านั้นออกเป็นงาน Docker แบบ targeted ที่ขนานกันพร้อม artifact ที่ไม่ซ้ำกัน
3. `package_telegram` เรียก `NPM Telegram Beta E2E` แบบเลือกได้ โดยจะรันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้ง artifact `package-under-test` เดียวกันเมื่อ Package Acceptance resolve ได้หนึ่งรายการ; การ dispatch Telegram แบบ standalone ยังสามารถติดตั้ง npm spec ที่ publish แล้วได้
4. `summary` ทำให้ workflow ล้มเหลวหากการ resolve package, Docker acceptance หรือ lane Telegram แบบเลือกได้ล้มเหลว

### แหล่งที่มาของ Candidate

- `source=npm` รับเฉพาะ `openclaw@beta`, `openclaw@latest` หรือเวอร์ชัน OpenClaw release แบบระบุแน่นอน เช่น `openclaw@2026.4.27-beta.2` ใช้ตัวเลือกนี้สำหรับการยอมรับ beta/stable ที่เผยแพร่แล้ว
- `source=ref` แพ็ก branch, tag หรือ commit SHA แบบเต็มของ `package_ref` ที่เชื่อถือได้ ตัว resolver จะดึง branch/tag ของ OpenClaw, ตรวจสอบว่า commit ที่เลือกเข้าถึงได้จากประวัติ branch ของ repository หรือ release tag, ติดตั้ง deps ใน detached worktree และแพ็กด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` ดาวน์โหลด HTTPS `.tgz`; ต้องมี `package_sha256`
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งไฟล์จาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็นตัวเลือก แต่ควรระบุสำหรับ artifacts ที่แชร์ภายนอก

แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือ workflow/harness code ที่เชื่อถือได้ซึ่งรันการทดสอบ `package_ref` คือ source commit ที่จะถูกแพ็กเมื่อใช้ `source=ref` สิ่งนี้ทำให้ test harness ปัจจุบันตรวจสอบ source commits เก่าที่เชื่อถือได้โดยไม่ต้องรัน workflow logic เก่า

### โปรไฟล์ชุดทดสอบ

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` รวมกับ `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — release-path chunks ของ Docker แบบเต็มพร้อม OpenWebUI
- `custom` — `docker_lanes` แบบระบุแน่นอน; จำเป็นเมื่อ `suite_profile=custom`

โปรไฟล์ `package` ใช้การครอบคลุม Plugin แบบ offline เพื่อไม่ให้การตรวจสอบ published-package ถูกกั้นด้วยความพร้อมใช้งานของ ClawHub แบบ live lane ของ Telegram ที่เป็นตัวเลือกจะใช้ artifact `package-under-test` ซ้ำใน `NPM Telegram Beta E2E` โดยคงเส้นทาง spec ของ npm ที่เผยแพร่ไว้สำหรับการ dispatch แบบ standalone

Release checks เรียก Package Acceptance ด้วย `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` และ `telegram_mode=mock-openai` release-path Docker chunks ครอบคลุม lane ของ package/update/plugin ที่ทับซ้อนกัน; Package Acceptance เก็บหลักฐาน bundled-channel compat แบบ artifact-native, Plugin แบบ offline และ Telegram เทียบกับ package tarball เดียวกันที่ resolve แล้ว Cross-OS release checks ยังครอบคลุม onboarding, installer และพฤติกรรม platform เฉพาะ OS; การตรวจสอบ product ของ package/update ควรเริ่มจาก Package Acceptance lane ของ Windows packaged และ installer fresh ยังตรวจสอบด้วยว่า package ที่ติดตั้งแล้วสามารถ import browser-control override จาก raw absolute Windows path ได้ agent-turn smoke ของ OpenAI ข้าม OS จะใช้ค่าเริ่มต้นเป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อถูกตั้งค่า ไม่เช่นนั้นใช้ `openai/gpt-5.4-mini` เพื่อให้หลักฐาน install และ Gateway รวดเร็วและกำหนดผลได้

### ช่วงความเข้ากันได้แบบเก่า

Package Acceptance มีช่วงความเข้ากันได้แบบเก่าที่มีขอบเขตสำหรับ package ที่เผยแพร่ไปแล้ว package จนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้เส้นทางความเข้ากันได้:

- รายการ QA ส่วนตัวที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ถูกละไว้จาก tarball;
- `doctor-switch` อาจข้าม subcase การคงอยู่ของ `gateway install --wrapper` เมื่อ package ไม่เปิดเผย flag นั้น;
- `update-channel-switch` อาจตัด `pnpm.patchedDependencies` ที่ขาดหายไปออกจาก fake git fixture ที่ได้จาก tarball และอาจบันทึก `update.channel` ที่คงอยู่แต่ขาดหายไป;
- plugin smokes อาจอ่านตำแหน่ง install-record แบบเก่า หรือยอมรับการคงอยู่ของ marketplace install-record ที่ขาดหายไป;
- `plugin-update` อาจอนุญาตการ migration ของ config metadata ในขณะที่ยังบังคับให้ install record และพฤติกรรม no-reinstall คงเดิม

package `2026.4.26` ที่เผยแพร่แล้วอาจเตือนเกี่ยวกับไฟล์ stamp ของ local build metadata ที่ถูกส่งไปแล้วด้วย package รุ่นหลังจากนั้นต้องผ่าน contracts สมัยใหม่; เงื่อนไขเดียวกันจะ fail แทนที่จะ warn หรือ skip

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

เมื่อ debug การรัน package acceptance ที่ล้มเหลว ให้เริ่มที่สรุป `resolve_package` เพื่อยืนยัน package source, version และ SHA-256 จากนั้นตรวจสอบ child run `docker_acceptance` และ Docker artifacts ของมัน: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane logs, phase timings และคำสั่ง rerun ควร rerun โปรไฟล์ package ที่ล้มเหลวหรือ Docker lanes ที่ระบุแน่นอนแทนการ rerun release validation แบบเต็ม

## Install smoke

workflow `Install Smoke` แยกต่างหากใช้ scope script เดียวกันซ้ำผ่าน job `preflight` ของตัวเอง โดยแยกการครอบคลุม smoke เป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **เส้นทางเร็ว** รันสำหรับ pull requests ที่แตะ Docker/package surfaces, การเปลี่ยนแปลง package/manifest ของ bundled Plugin หรือ surfaces ของ core plugin/channel/gateway/Plugin SDK ที่ Docker smoke jobs ใช้ทดสอบ การเปลี่ยนแปลง bundled Plugin แบบ source-only, การแก้ไขเฉพาะ test และการแก้ไขเฉพาะ docs จะไม่จอง Docker workers เส้นทางเร็วจะ build root Dockerfile image หนึ่งครั้ง, ตรวจสอบ CLI, รัน agents delete shared-workspace CLI smoke, รัน container gateway-network e2e, ตรวจสอบ bundled extension build arg และรัน bounded bundled-plugin Docker profile ภายใต้ aggregate command timeout 240 วินาที (Docker run ของแต่ละ scenario ถูกจำกัดแยกกัน)
- **เส้นทางเต็ม** เก็บ QR package install และ installer Docker/update coverage ไว้สำหรับ nightly scheduled runs, manual dispatches, workflow-call release checks และ pull requests ที่แตะ installer/package/Docker surfaces จริงๆ ในโหมดเต็ม install-smoke จะเตรียมหรือใช้ GHCR root Dockerfile smoke image ของ target-SHA หนึ่งรายการซ้ำ จากนั้นรัน QR package install, root Dockerfile/gateway smokes, installer/update smokes และ fast bundled-plugin Docker E2E เป็น jobs แยกกัน เพื่อให้งาน installer ไม่ต้องรอหลัง root image smokes

การ push ไปยัง `main` (รวมถึง merge commits) ไม่บังคับใช้เส้นทางเต็ม; เมื่อ changed-scope logic ต้องการการครอบคลุมเต็มในการ push workflow จะคง fast Docker smoke และปล่อย full install smoke ให้ nightly หรือ release validation

Bun global install image-provider smoke ที่ช้าจะถูกกั้นแยกด้วย `run_bun_global_install_smoke` มันรันตาม nightly schedule และจาก release checks workflow และ manual `Install Smoke` dispatches สามารถเลือกใช้ได้ แต่ pull requests และการ push ไปยัง `main` จะไม่รัน QR และ installer Docker tests คง Dockerfiles ที่เน้น install ของตัวเองไว้

## Local Docker E2E

`pnpm test:docker:all` prebuild shared live-test image หนึ่งรายการ, แพ็ก OpenClaw หนึ่งครั้งเป็น npm tarball และ build shared `scripts/e2e/Dockerfile` images สองรายการ:

- bare Node/Git runner สำหรับ lane installer/update/plugin-dependency;
- functional image ที่ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lane ฟังก์ชันปกติ

คำนิยาม Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, planner logic อยู่ใน `scripts/lib/docker-e2e-plan.mjs` และ runner จะ execute เฉพาะ plan ที่เลือก scheduler เลือก image ต่อ lane ด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` จากนั้นรัน lanes ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### ค่าที่ปรับได้

| Variable                               | Default | Purpose                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | จำนวน slot ของ main-pool สำหรับ lane ปกติ                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | จำนวน slot ของ tail-pool ที่ไวต่อ provider                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | ขีดจำกัด lane live พร้อมกันเพื่อไม่ให้ providers throttle                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | ขีดจำกัด lane npm install พร้อมกัน                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | ขีดจำกัด lane multi-service พร้อมกัน                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | ระยะหน่วงระหว่างการเริ่ม lane เพื่อเลี่ยง Docker daemon create storms; ตั้งเป็น `0` หากไม่ต้องการหน่วง     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout สำรองต่อ lane (120 นาที); lane live/tail ที่เลือกใช้ขีดจำกัดที่เข้มกว่า           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` พิมพ์ scheduler plan โดยไม่รัน lanes                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | รายการ lane แบบระบุแน่นอนคั่นด้วย comma; ข้าม cleanup smoke เพื่อให้ agents reproduce lane ที่ล้มเหลวหนึ่งรายการได้ |

lane ที่หนักกว่าขีดจำกัดจริงของมันยังสามารถเริ่มจาก pool ว่างได้ แล้วจะรันเพียงลำพังจนกว่าจะคืน capacity preflights แบบ aggregate ในเครื่องจะ preflight Docker, ลบ container OpenClaw E2E ที่ค้างเก่า, แสดง active-lane status, คง lane timings ไว้สำหรับการเรียง longest-first และหยุด schedule pooled lanes ใหม่หลัง failure แรกตามค่าเริ่มต้น

### workflow live/E2E ที่ใช้ซ้ำได้

workflow live/E2E ที่ใช้ซ้ำได้ถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องใช้ package, image kind, live image, lane และ credential coverage ใด `scripts/docker-e2e.mjs` จากนั้นแปลง plan นั้นเป็น GitHub outputs และ summaries มันจะแพ็ก OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลด current-run package artifact หรือดาวน์โหลด package artifact จาก `package_artifact_run_id`; ตรวจสอบ tarball inventory; build และ push package-digest-tagged bare/functional GHCR Docker E2E images ผ่าน Docker layer cache ของ Blacksmith เมื่อ plan ต้องใช้ lane ที่ติดตั้ง package แล้ว; และใช้ input `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มาหรือ package-digest images ที่มีอยู่ซ้ำแทนการ rebuild การ pull Docker image จะ retry พร้อม timeout ต่อครั้งแบบมีขอบเขต 180 วินาที เพื่อให้ registry/cache stream ที่ค้าง retry ได้เร็วแทนที่จะกินเวลาส่วนใหญ่ของ CI critical path

### Release-path chunks

Release Docker coverage รัน jobs แบบ chunk ที่เล็กลงด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละ chunk pull เฉพาะ image kind ที่ต้องใช้และ execute หลาย lanes ผ่าน weighted scheduler เดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

ชิ้นส่วน Docker ของรีลีสปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` ถึง `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` และ `bundled-channels-contracts` ชิ้นส่วนรวม `bundled-channels` ยังคงพร้อมใช้งานสำหรับการรันซ้ำแบบครั้งเดียวด้วยตนเอง และ `plugins-runtime-core`, `plugins-runtime` และ `plugins-integrations` ยังคงเป็นนามแฝงแบบรวมของ Plugin/รันไทม์ นามแฝงเลน `install-e2e` ยังคงเป็นนามแฝงการรันซ้ำด้วยตนเองแบบรวมสำหรับเลนตัวติดตั้งผู้ให้บริการทั้งสองเลน ชิ้นส่วน `bundled-channels` รันเลน `bundled-channel-*` และ `bundled-channel-update-*` ที่ถูกแยก แทนเลน `bundled-channel-deps` แบบรวมทั้งหมดตามลำดับ

OpenWebUI จะถูกรวมเข้าไปใน `plugins-runtime-services` เมื่อมีคำขอครอบคลุมเส้นทางรีลีสเต็มรูปแบบ และจะคงชิ้นส่วน `openwebui` แบบแยกไว้เฉพาะสำหรับการ dispatch ที่เกี่ยวกับ OpenWebUI เท่านั้น เลนอัปเดตช่องทางที่บันเดิลไว้จะลองใหม่หนึ่งครั้งสำหรับความล้มเหลวชั่วคราวของเครือข่าย npm

แต่ละชิ้นส่วนอัปโหลด `.artifacts/docker-tests/` พร้อมล็อกของเลน เวลาในการรัน `summary.json`, `failures.json`, เวลาแต่ละเฟส, JSON แผนของตัวจัดตาราง, ตารางเลนที่ช้า และคำสั่งรันซ้ำแยกตามเลน อินพุต `docker_lanes` ของ workflow จะรันเลนที่เลือกกับอิมเมจที่เตรียมไว้แทนงานของชิ้นส่วน ซึ่งทำให้การดีบักเลนที่ล้มเหลวถูกจำกัดอยู่ในงาน Docker เป้าหมายเดียว และเตรียม ดาวน์โหลด หรือนำ artifact ของแพ็กเกจมาใช้ซ้ำสำหรับการรันนั้น หากเลนที่เลือกเป็นเลน Docker แบบ live งานเป้าหมายจะสร้างอิมเมจ live-test ในเครื่องสำหรับการรันซ้ำนั้น คำสั่งรันซ้ำ GitHub ที่สร้างขึ้นแยกตามเลนจะรวม `package_artifact_run_id`, `package_artifact_name` และอินพุตอิมเมจที่เตรียมไว้เมื่อมีค่าเหล่านั้น เพื่อให้เลนที่ล้มเหลวสามารถนำแพ็กเกจและอิมเมจเดิมจากการรันที่ล้มเหลวกลับมาใช้ได้

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

workflow live/E2E ตามกำหนดเวลาจะรันชุด Docker เส้นทางรีลีสเต็มรูปแบบทุกวัน

## Plugin Prerelease

`Plugin Prerelease` เป็นการครอบคลุมผลิตภัณฑ์/แพ็กเกจที่มีต้นทุนสูงกว่า จึงเป็น workflow แยกที่ถูก dispatch โดย `Full Release Validation` หรือโดยผู้ปฏิบัติงานที่ระบุชัดเจน pull request ปกติ การ push ไปยัง `main` และการ dispatch CI ด้วยตนเองแบบเดี่ยวจะปิดชุดนี้ไว้ ชุดนี้กระจายการทดสอบ Plugin ที่บันเดิลไว้ไปยัง worker ของส่วนขยายแปดตัว งาน shard ของส่วนขยายเหล่านั้นรันกลุ่มการกำหนดค่า Plugin ได้สูงสุดสองกลุ่มพร้อมกัน โดยใช้ Vitest worker หนึ่งตัวต่อกลุ่มและ Node heap ที่ใหญ่ขึ้น เพื่อให้ชุด Plugin ที่มีการ import หนักไม่สร้างงาน CI เพิ่ม

## QA Lab

QA Lab มีเลน CI เฉพาะอยู่นอก workflow หลักแบบกำหนดขอบเขตอัจฉริยะ

- workflow `Parity gate` รันเมื่อ PR มีการเปลี่ยนแปลงที่ตรงกันและเมื่อ dispatch ด้วยตนเอง โดยสร้างรันไทม์ QA ส่วนตัวและเปรียบเทียบแพ็ก agentic ของ GPT-5.5 จำลองกับ Opus 4.6
- workflow `QA-Lab - All Lanes` รันทุกคืนบน `main` และเมื่อ dispatch ด้วยตนเอง โดยกระจาย mock parity gate, เลน Matrix แบบ live และเลน Telegram กับ Discord แบบ live เป็นงานขนาน งาน live ใช้สภาพแวดล้อม `qa-live-shared` และ Telegram/Discord ใช้ lease ของ Convex

การตรวจสอบรีลีสรันเลนทรานสปอร์ต live ของ Matrix และ Telegram ด้วยผู้ให้บริการจำลองแบบกำหนดผลได้และโมเดลที่ผ่านคุณสมบัติ mock (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อแยกสัญญาของช่องทางออกจาก latency ของโมเดล live และการเริ่มต้น provider-plugin ตามปกติ Gateway ทรานสปอร์ต live ปิดใช้งานการค้นหาหน่วยความจำ เพราะ QA parity ครอบคลุมพฤติกรรมหน่วยความจำแยกต่างหาก ส่วนการเชื่อมต่อผู้ให้บริการครอบคลุมโดยชุด live model, native provider และ Docker provider ที่แยกกัน

Matrix ใช้ `--profile fast` สำหรับ gate ตามกำหนดเวลาและรีลีส โดยเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout รองรับ ค่าเริ่มต้นของ CLI และอินพุต workflow ด้วยตนเองยังคงเป็น `all`; การ dispatch ด้วยตนเองที่ `matrix_profile=all` จะแยก coverage เต็มของ Matrix เป็นงาน `transport`, `media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรันเลน QA Lab ที่สำคัญต่อรีลีสก่อนอนุมัติรีลีสด้วย โดย QA parity gate จะรันแพ็ก candidate และ baseline เป็นงานเลนขนาน จากนั้นดาวน์โหลด artifact ทั้งสองเข้าไปในงานรายงานขนาดเล็กเพื่อทำการเปรียบเทียบ parity ขั้นสุดท้าย

อย่าวางเส้นทางการ land PR ไว้หลัง `Parity gate` เว้นแต่การเปลี่ยนแปลงจะแตะรันไทม์ QA, parity ของ model-pack หรือ surface ที่ parity workflow เป็นเจ้าของจริงๆ สำหรับการแก้ไขช่องทาง การกำหนดค่า เอกสาร หรือ unit test ตามปกติ ให้ถือว่าเป็นสัญญาณเสริมและใช้หลักฐาน CI/check ตามขอบเขตแทน

## CodeQL

workflow `CodeQL` ตั้งใจให้เป็นตัวสแกนความปลอดภัยรอบแรกแบบแคบ ไม่ใช่การกวาดทั้ง repository การรันรายวัน การรันด้วยตนเอง และการรัน guard ของ pull request ที่ไม่ใช่ draft จะสแกนโค้ด workflow ของ Actions รวมถึง surface JavaScript/TypeScript ที่มีความเสี่ยงสูงสุด ด้วย query ความปลอดภัยความเชื่อมั่นสูงที่กรองให้เหลือ `security-severity` ระดับสูง/วิกฤต

guard ของ pull request ยังคงเบา: จะเริ่มเฉพาะการเปลี่ยนแปลงภายใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` หรือ `src` และรัน matrix ความปลอดภัยความเชื่อมั่นสูงชุดเดียวกับ workflow ตามกำหนดเวลา CodeQL สำหรับ Android และ macOS จะไม่อยู่ในค่าเริ่มต้นของ PR

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                         | Surface                                                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secret, sandbox, cron และ baseline ของ Gateway                                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการใช้งานช่องทาง core รวมถึงรันไทม์ Plugin ของช่องทาง, Gateway, Plugin SDK, secret และจุดแตะ audit                              |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, การ parse IP, network guard, web-fetch และ surface นโยบาย SSRF ของ Plugin SDK                                               |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP server, helper สำหรับการประมวลผล process, การส่งออกภายนอก และ gate การดำเนินการเครื่องมือของ agent                              |
| `/codeql-security-high/plugin-trust-boundary`     | การติดตั้ง Plugin, loader, manifest, registry, การจัดเตรียม runtime-dependency, source-loading และ surface ความเชื่อถือของสัญญาแพ็กเกจ Plugin SDK |

### Shard ความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — shard ความปลอดภัย Android ตามกำหนดเวลา สร้างแอป Android ด้วยตนเองสำหรับ CodeQL บน Blacksmith Linux runner ที่เล็กที่สุดที่ workflow sanity ยอมรับ อัปโหลดภายใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — shard ความปลอดภัย macOS รายสัปดาห์/ด้วยตนเอง สร้างแอป macOS ด้วยตนเองสำหรับ CodeQL บน Blacksmith macOS กรองผลลัพธ์ build ของ dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดภายใต้ `/codeql-critical-security/macos` คงไว้นอกค่าเริ่มต้นรายวัน เพราะ build ของ macOS ใช้เวลารันเป็นส่วนใหญ่แม้เมื่อสะอาด

### หมวดหมู่คุณภาพวิกฤต

`CodeQL Critical Quality` คือ shard ที่สอดคล้องกันซึ่งไม่ใช่ด้านความปลอดภัย รันเฉพาะ query คุณภาพ JavaScript/TypeScript ที่เป็น error-severity และไม่ใช่ security บน surface มูลค่าสูงแบบแคบบน Blacksmith Linux runner ขนาดเล็ก guard ของ pull request ตั้งใจให้เล็กกว่า profile ตามกำหนดเวลา: PR ที่ไม่ใช่ draft จะรันเฉพาะ shard ที่ตรงกัน ได้แก่ `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` สำหรับการเปลี่ยนแปลงโค้ดการดำเนินการคำสั่ง/โมเดล/เครื่องมือของ agent และการ dispatch reply, โค้ด schema/migration/IO ของ config, โค้ด auth/secrets/sandbox/security, รันไทม์ช่องทาง core และรันไทม์ Plugin ช่องทางที่บันเดิลไว้, เมธอดของโปรโตคอล/server ของ Gateway, กาวเชื่อมรันไทม์หน่วยความจำ/SDK, MCP/process/การส่งออกภายนอก, แค็ตตาล็อก runtime/model ของผู้ให้บริการ, คิว diagnostics/delivery ของ session, Plugin loader, สัญญา Plugin SDK/package-contract หรือรันไทม์ reply ของ Plugin SDK การเปลี่ยนแปลง config ของ CodeQL และ workflow คุณภาพจะรัน shard คุณภาพ PR ทั้งสิบสองรายการ

การ dispatch ด้วยตนเองรับค่า:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

profile แบบแคบเป็น hook สำหรับการสอน/วนซ้ำเพื่อรัน shard คุณภาพหนึ่งรายการแบบแยกเดี่ยว

| หมวดหมู่                                                | พื้นผิว                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ดขอบเขตความปลอดภัยของการตรวจสอบสิทธิ์ ความลับ แซนด์บ็อกซ์ Cron และ Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | สัญญาสคีมาการกำหนดค่า การย้ายข้อมูล การทำให้เป็นมาตรฐาน และ IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | สคีมาโปรโตคอล Gateway และสัญญาเมธอดของเซิร์ฟเวอร์                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญาการทำงานของช่องทางหลักและ Plugin ช่องทางที่รวมมา                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | การรันคำสั่ง การกระจายงานโมเดล/ผู้ให้บริการ การกระจายงานและคิวตอบกลับอัตโนมัติ และสัญญารันไทม์ของ control plane สำหรับ ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | เซิร์ฟเวอร์ MCP และบริดจ์เครื่องมือ ตัวช่วยกำกับดูแลกระบวนการ และสัญญาการส่งออก                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK โฮสต์หน่วยความจำ facade รันไทม์หน่วยความจำ alias ของ Plugin SDK หน่วยความจำ โค้ดเชื่อมการเปิดใช้งานรันไทม์หน่วยความจำ และคำสั่ง doctor ของหน่วยความจำ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | กลไกภายในของคิวตอบกลับ คิวส่งมอบเซสชัน ตัวช่วยผูก/ส่งมอบเซสชันขาออก พื้นผิว event/log bundle สำหรับวินิจฉัย และสัญญา CLI ของ doctor สำหรับเซสชัน |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | การกระจายงานตอบกลับขาเข้าของ Plugin SDK ตัวช่วย payload/การแบ่ง chunk/รันไทม์ของการตอบกลับ ตัวเลือกการตอบกลับของช่องทาง คิวส่งมอบ และตัวช่วยผูกเซสชัน/เธรด             |
| `/codeql-critical-quality/provider-runtime-boundary`    | การทำแคตตาล็อกโมเดลให้เป็นมาตรฐาน การตรวจสอบสิทธิ์และการค้นพบผู้ให้บริการ การลงทะเบียนรันไทม์ผู้ให้บริการ ค่าเริ่มต้น/แคตตาล็อกของผู้ให้บริการ และ registry สำหรับเว็บ/ค้นหา/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | การ bootstrap ของ UI ควบคุม การคงอยู่แบบ local โฟลว์ควบคุม Gateway และสัญญารันไทม์ของ control plane สำหรับงาน                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | สัญญารันไทม์ของ fetch/search เว็บหลัก, IO สื่อ, การทำความเข้าใจสื่อ, การสร้างภาพ และการสร้างสื่อ                                                    |
| `/codeql-critical-quality/plugin-boundary`              | สัญญา loader, registry, public-surface และ entrypoint ของ Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | ซอร์ส Plugin SDK ฝั่งแพ็กเกจที่เผยแพร่แล้วและตัวช่วยสัญญาแพ็กเกจ Plugin                                                                                      |

คุณภาพแยกจากความปลอดภัยเพื่อให้สามารถจัดตาราง วัดผล ปิดใช้งาน หรือขยาย findings ด้านคุณภาพได้โดยไม่บดบังสัญญาณความปลอดภัย การขยาย CodeQL สำหรับ Swift, Python และ Plugin ที่รวมมา ควรเพิ่มกลับมาเป็นงานติดตามแบบมีขอบเขตหรือแบ่ง shard แล้วเท่านั้น หลังจากโปรไฟล์แคบมีรันไทม์และสัญญาณที่เสถียรแล้ว

## เวิร์กโฟลว์การบำรุงรักษา

### Docs Agent

เวิร์กโฟลว์ `Docs Agent` เป็นเลนบำรุงรักษา Codex แบบขับเคลื่อนด้วยอีเวนต์สำหรับรักษาให้เอกสารที่มีอยู่สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง landed ไม่มีตารางเวลาล้วน ๆ: การรัน CI จากการ push ที่ไม่ใช่บอตบน `main` ซึ่งสำเร็จสามารถ trigger ได้ และ manual dispatch สามารถรันโดยตรงได้ การเรียกผ่าน workflow-run จะข้ามเมื่อ `main` เดินหน้าไปแล้ว หรือเมื่อมีการรัน Docs Agent แบบไม่ถูกข้ามรายการอื่นถูกสร้างขึ้นในชั่วโมงล่าสุด เมื่อรัน จะตรวจสอบช่วง commit ตั้งแต่ source SHA ของ Docs Agent แบบไม่ถูกข้ามรายการก่อนหน้าไปจนถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงหนึ่งครั้งสามารถครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมมาตั้งแต่รอบตรวจเอกสารครั้งล่าสุด

### Test Performance Agent

เวิร์กโฟลว์ `Test Performance Agent` เป็นเลนบำรุงรักษา Codex แบบขับเคลื่อนด้วยอีเวนต์สำหรับเทสต์ที่ช้า ไม่มีตารางเวลาล้วน ๆ: การรัน CI จากการ push ที่ไม่ใช่บอตบน `main` ซึ่งสำเร็จสามารถ trigger ได้ แต่จะข้ามหากมีการเรียก workflow-run รายการอื่นที่รันไปแล้วหรือกำลังรันอยู่ในวัน UTC เดียวกัน Manual dispatch จะข้าม gate กิจกรรมรายวันนั้น เลนนี้สร้างรายงานประสิทธิภาพ Vitest แบบจัดกลุ่มทั้งชุด อนุญาตให้ Codex ทำได้เฉพาะการแก้ไขประสิทธิภาพเทสต์ขนาดเล็กที่ยังคง coverage แทนการ refactor กว้าง ๆ จากนั้นรันรายงานทั้งชุดอีกครั้ง และปฏิเสธการเปลี่ยนแปลงที่ลดจำนวนเทสต์ baseline ที่ผ่าน หาก baseline มีเทสต์ที่ล้มเหลว Codex อาจแก้ได้เฉพาะ failure ที่ชัดเจน และรายงานทั้งชุดหลัง agent ต้องผ่านก่อนที่จะ commit อะไรก็ตาม เมื่อ `main` เดินหน้าก่อนที่ bot push จะ landed เลนนี้จะ rebase patch ที่ validate แล้ว รัน `pnpm check:changed` อีกครั้ง และลอง push ใหม่; patch เก่าที่ conflict จะถูกข้าม ใช้ GitHub-hosted Ubuntu เพื่อให้ Codex action คง posture ความปลอดภัยแบบ drop-sudo เดียวกับ docs agent ได้

### PR ซ้ำหลัง Merge

เวิร์กโฟลว์ `Duplicate PRs After Merge` เป็นเวิร์กโฟลว์ maintainer แบบ manual สำหรับล้างรายการซ้ำหลัง land ค่าเริ่มต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุไว้อย่างชัดเจนเมื่อ `apply=true` ก่อนแก้ไข GitHub จะยืนยันว่า PR ที่ landed ถูก merge แล้ว และแต่ละรายการซ้ำมี issue อ้างอิงร่วมกันหรือมี hunk ที่เปลี่ยนแปลงทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate การตรวจ local และการ route การเปลี่ยนแปลง

ตรรกะ changed-lane แบบ local อยู่ใน `scripts/changed-lanes.mjs` และถูกเรียกใช้โดย `scripts/check-changed.mjs` gate การตรวจ local นั้นเข้มงวดเรื่องขอบเขตสถาปัตยกรรมมากกว่าขอบเขตแพลตฟอร์ม CI แบบกว้าง:

- การเปลี่ยนแปลง production หลักรัน typecheck ของ core prod และ core test รวมถึง lint/guard ของ core;
- การเปลี่ยนแปลงเฉพาะเทสต์หลักรันเฉพาะ typecheck ของ core test รวมถึง lint ของ core;
- การเปลี่ยนแปลง production ของ extension รัน typecheck ของ extension prod และ extension test รวมถึง lint ของ extension;
- การเปลี่ยนแปลงเฉพาะเทสต์ของ extension รัน typecheck ของ extension test รวมถึง lint ของ extension;
- การเปลี่ยนแปลง Plugin SDK สาธารณะหรือ plugin-contract จะขยายไปยัง typecheck ของ extension เพราะ extension พึ่งพาสัญญาหลักเหล่านั้น (การกวาด Vitest สำหรับ extension ยังคงเป็นงานเทสต์ที่ต้องสั่งอย่างชัดเจน);
- การ bump เวอร์ชันที่เป็นเฉพาะ metadata release รันการตรวจเวอร์ชัน/คอนฟิก/root-dependency แบบเจาะจง;
- การเปลี่ยนแปลง root/config ที่ไม่ทราบชนิดจะ fail safe ไปยังทุกเลนตรวจ

การ route changed-test แบบ local อยู่ใน `scripts/test-projects.test-support.mjs` และตั้งใจให้ถูกกว่า `check:changed`: การแก้ไขเทสต์โดยตรงจะรันตัวเอง การแก้ไขซอร์สจะใช้ mapping ที่ชัดเจนก่อน จากนั้นจึงใช้เทสต์ sibling และ dependent จาก import-graph คอนฟิกการส่งมอบ group-room ที่ใช้ร่วมกันเป็นหนึ่งใน mapping ที่ชัดเจน: การเปลี่ยนแปลงคอนฟิก visible-reply ของกลุ่ม โหมดส่งมอบ source reply หรือ route ของ system prompt สำหรับ message-tool จะผ่านเทสต์การตอบกลับหลัก รวมถึง regression การส่งมอบของ Discord และ Slack เพื่อให้การเปลี่ยนค่าเริ่มต้นร่วมกันล้มเหลวก่อน push PR ครั้งแรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างถึงระดับ harness จนชุด mapped ราคาถูกไม่ใช่ proxy ที่น่าเชื่อถือ

## การ validate ด้วย Testbox

รัน Testbox จาก repo root และควรใช้กล่องที่ warm ใหม่สำหรับหลักฐานแบบกว้าง ก่อนใช้ gate ที่ช้าบนกล่องที่ถูก reuse, หมดอายุ หรือเพิ่งรายงาน sync ที่ใหญ่ผิดคาด ให้รัน `pnpm testbox:sanity` ภายในกล่องก่อน

sanity check จะ fail fast เมื่อไฟล์ root ที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short` แสดงการลบไฟล์ tracked อย่างน้อย 200 รายการ โดยปกติหมายความว่า state การ sync ระยะไกลไม่ใช่สำเนาที่น่าเชื่อถือของ PR; ให้หยุดกล่องนั้นและ warm กล่องใหม่แทนการ debug failure ของเทสต์ผลิตภัณฑ์ สำหรับ PR ที่ตั้งใจลบจำนวนมาก ให้ตั้ง `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับการรัน sanity นั้น

`pnpm testbox:run` ยังยุติการเรียก Blacksmith CLI แบบ local ที่ค้างอยู่ในเฟส sync เกินห้านาทีโดยไม่มี output หลัง sync ตั้ง `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` เพื่อปิด guard นั้น หรือใช้ค่ามิลลิวินาทีที่ใหญ่ขึ้นสำหรับ diff local ที่ใหญ่ผิดปกติ

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
