---
read_when:
    - คุณต้องทำความเข้าใจว่าเหตุใดงาน CI จึงทำงานหรือไม่ได้ทำงาน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ไม่ผ่าน
    - คุณกำลังประสานงานการรันการตรวจสอบความถูกต้องของรีลีสหรือการรันซ้ำ
summary: กราฟงาน CI, เกตขอบเขต, umbrella สำหรับรีลีส, และคำสั่งเทียบเท่าในเครื่อง
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-04-30T09:41:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9c18f0801864ca1030aac9ea81117b011bd7936388984a1809ce3ae6e906e62
    source_path: ci.md
    workflow: 16
---

OpenClaw CI ทำงานทุกครั้งที่ push ไปยัง `main` และทุก pull request งาน `preflight` จัดประเภท diff และปิด lane ที่มีค่าใช้จ่ายสูงเมื่อมีการเปลี่ยนแปลงเฉพาะพื้นที่ที่ไม่เกี่ยวข้อง การรัน `workflow_dispatch` แบบแมนนวลตั้งใจข้ามการกำหนด scope อัจฉริยะ และกระจายงานเป็นกราฟเต็มสำหรับ release candidate และการตรวจสอบความถูกต้องวงกว้าง lane ของ Android ยังคงเป็นแบบ opt-in ผ่าน `include_android` ความครอบคลุมของ Plugin สำหรับ release เท่านั้นอยู่ใน workflow แยก [`Plugin ก่อนเผยแพร่จริง`](#plugin-prerelease) และจะรันจาก [`การตรวจสอบ Release ฉบับเต็ม`](#full-release-validation) หรือการ dispatch แบบแมนนวลอย่างชัดเจนเท่านั้น

## ภาพรวมไปป์ไลน์

| งาน                              | วัตถุประสงค์                                                                                      | เวลาที่รัน                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | ตรวจจับการเปลี่ยนแปลงเฉพาะ docs, scope ที่เปลี่ยน, extension ที่เปลี่ยน และสร้าง manifest ของ CI      | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-scm-fast`              | ตรวจจับ private key และ audit workflow ผ่าน `zizmor`                                        | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-dependency-audit`      | audit lockfile สำหรับ production แบบไม่พึ่ง dependency เทียบกับ advisory ของ npm                             | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-fast`                  | aggregate ที่จำเป็นสำหรับงาน security แบบเร็ว                                                | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `check-dependencies`             | รอบ production Knip สำหรับ dependency เท่านั้น พร้อม guard allowlist ของไฟล์ที่ไม่ได้ใช้                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-artifacts`                | build `dist/`, Control UI, ตรวจสอบ built-artifact และ artifact downstream ที่ใช้ซ้ำได้          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-core`               | lane ความถูกต้องของ Linux แบบเร็ว เช่น การตรวจสอบ bundled/plugin-contract/protocol                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-contracts-channels` | การตรวจสอบ channel contract แบบ shard พร้อมผลตรวจสอบ aggregate ที่เสถียร                         | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-core-test`          | shard ทดสอบ Core Node โดยไม่รวม lane ของ channel, bundled, contract และ extension             | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check`                          | gate หลักแบบ local ที่แบ่ง shard เทียบเท่า: prod types, lint, guards, test types และ strict smoke   | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check-additional`               | shard สำหรับ architecture, boundary, guard ของ extension-surface, package-boundary และ gateway-watch | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-smoke`                    | การทดสอบ smoke ของ CLI ที่ build แล้วและ startup-memory smoke                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks`                         | verifier สำหรับการทดสอบ channel ของ built-artifact                                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-compat-node22`      | lane build และ smoke สำหรับความเข้ากันได้กับ Node 22                                                   | การ dispatch CI แบบแมนนวลสำหรับ release    |
| `check-docs`                     | การตรวจรูปแบบ docs, lint และ broken-link                                                | Docs เปลี่ยน                       |
| `skills-python`                  | Ruff + pytest สำหรับ skills ที่มี Python รองรับ                                                       | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python-skill      |
| `checks-windows`                 | การทดสอบ process/path เฉพาะ Windows พร้อม regression ของ shared runtime import specifier         | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows           |
| `macos-node`                     | lane ทดสอบ TypeScript บน macOS โดยใช้ built artifact ร่วมกัน                                  | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `macos-swift`                    | Swift lint, build และ test สำหรับแอป macOS                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `android`                        | unit test ของ Android สำหรับทั้งสอง flavor พร้อม build debug APK หนึ่งรายการ                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android           |
| `test-performance-agent`         | การปรับ slow-test ของ Codex รายวันหลังจากกิจกรรมที่เชื่อถือได้                                    | CI บน main สำเร็จ หรือ dispatch แบบแมนนวล |

## ลำดับ fail-fast

1. `preflight` ตัดสินใจว่า lane ใดจะมีอยู่ตั้งแต่แรก ตรรกะ `docs-scope` และ `changed-scope` เป็น step ภายในงานนี้ ไม่ใช่งานแยกต่างหาก
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` ล้มเหลวอย่างรวดเร็วโดยไม่ต้องรอ artifact ที่หนักกว่าและงาน matrix ของ platform
3. `build-artifacts` ทำงานซ้อนทับกับ lane Linux แบบเร็ว เพื่อให้ consumer downstream เริ่มได้ทันทีเมื่อ shared build พร้อม
4. lane ของ platform และ runtime ที่หนักกว่าจะกระจายงานหลังจากนั้น: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่เป็น `cancelled` เมื่อมี push ใหม่กว่าเข้ามาบน PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่านั่นเป็นสัญญาณรบกวนของ CI เว้นแต่ว่าการรันล่าสุดสำหรับ ref เดียวกันก็ล้มเหลวด้วย การตรวจสอบ shard แบบ aggregate ใช้ `!cancelled() && always()` เพื่อให้ยังรายงานความล้มเหลวปกติของ shard แต่ไม่ queue หลังจาก workflow ทั้งหมดถูกแทนที่ไปแล้ว key concurrency อัตโนมัติของ CI มีการกำหนดเวอร์ชัน (`CI-v7-*`) เพื่อให้ zombie ฝั่ง GitHub ใน queue group เก่าไม่สามารถบล็อกการรัน main ที่ใหม่กว่าอย่างไม่มีกำหนด การรัน full-suite แบบแมนนวลใช้ `CI-manual-v1-*` และไม่ยกเลิกการรันที่กำลังดำเนินอยู่

## Scope และ routing

ตรรกะ scope อยู่ใน `scripts/ci-changed-scope.mjs` และครอบคลุมด้วย unit test ใน `src/scripts/ci-changed-scope.test.ts` การ dispatch แบบแมนนวลข้ามการตรวจจับ changed-scope และทำให้ manifest ของ preflight ทำงานเหมือนกับว่าพื้นที่ที่มี scope ทุกพื้นที่เปลี่ยนแปลง

- **การแก้ไข workflow ของ CI** ตรวจสอบกราฟ CI ของ Node พร้อม workflow linting แต่ไม่ได้บังคับให้ Windows, Android หรือ macOS native build ทำงานด้วยตัวเอง lane ของ platform เหล่านั้นยังคงถูก scope ตามการเปลี่ยนแปลง source ของ platform
- **การแก้ไขเฉพาะ routing ของ CI, การแก้ไข fixture core-test ราคาถูกที่เลือกไว้ และการแก้ไข helper/test-routing ของ plugin contract แบบแคบ** ใช้เส้นทาง manifest แบบเร็วเฉพาะ Node: `preflight`, security และงาน `checks-fast-core` เดียว เส้นทางนั้นข้าม build artifact, ความเข้ากันได้กับ Node 22, channel contract, shard core เต็มรูปแบบ, shard bundled-plugin และ matrix guard เพิ่มเติมเมื่อการเปลี่ยนแปลงจำกัดอยู่เฉพาะพื้นผิว routing หรือ helper ที่งานเร็วทดสอบโดยตรง
- **การตรวจสอบ Windows Node** ถูก scope ไปยัง wrapper process/path เฉพาะ Windows, helper runner ของ npm/pnpm/UI, config ของ package manager และพื้นผิว workflow ของ CI ที่รัน lane นั้น การเปลี่ยนแปลง source, plugin, install-smoke และ test-only ที่ไม่เกี่ยวข้องยังคงอยู่บน lane Linux Node

ตระกูลทดสอบ Node ที่ช้าที่สุดถูกแยกหรือ balance เพื่อให้งานแต่ละงานเล็กโดยไม่จอง runner เกินจำเป็น: channel contract รันเป็น shard แบบถ่วงน้ำหนักสามชุด, lane unit core ขนาดเล็กถูกจับคู่กัน, auto-reply รันเป็น worker ที่ balance สี่ตัว (โดยแยก subtree ของ reply เป็น shard agent-runner, dispatch และ commands/state-routing) และ config ของ agentic gateway/plugin ถูกกระจายไปตามงาน agentic Node แบบ source-only ที่มีอยู่ แทนที่จะรอ built artifact การทดสอบ browser, QA, media และ plugin เบ็ดเตล็ดแบบกว้างใช้ config Vitest เฉพาะของตนแทน shared plugin catch-all shard แบบ include-pattern บันทึกรายการ timing โดยใช้ชื่อ shard ของ CI เพื่อให้ `.artifacts/vitest-shard-timings.json` แยกความแตกต่างระหว่าง config ทั้งชุดกับ shard ที่ถูก filter ได้ `check-additional` เก็บงาน compile/canary ของ package-boundary ไว้ด้วยกัน และแยก architecture ของ runtime topology ออกจาก coverage ของ gateway watch shard ของ boundary guard รัน guard อิสระขนาดเล็กพร้อมกันภายในงานเดียว Gateway watch, การทดสอบ channel และ shard core support-boundary รันพร้อมกันภายใน `build-artifacts` หลังจาก `dist/` และ `dist-runtime/` ถูก build แล้ว

Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` แล้วจึง build Play debug APK flavor third-party ไม่มี source set หรือ manifest แยกต่างหาก lane unit-test ของมันยังคง compile flavor ด้วย flag BuildConfig ของ SMS/call-log ขณะหลีกเลี่ยงงาน packaging debug APK ซ้ำในทุก push ที่เกี่ยวข้องกับ Android

shard `check-dependencies` รัน `pnpm deadcode:dependencies` (รอบ production Knip สำหรับ dependency เท่านั้นที่ pin กับเวอร์ชัน Knip ล่าสุด โดยปิด minimum release age ของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบ findings ของไฟล์ production ที่ไม่ได้ใช้จาก Knip กับ `scripts/deadcode-unused-files.allowlist.mjs` guard ของไฟล์ที่ไม่ได้ใช้จะล้มเหลวเมื่อ PR เพิ่มไฟล์ที่ไม่ได้ใช้ใหม่โดยยังไม่ได้รับการตรวจทาน หรือเหลือรายการ allowlist ที่ล้าสมัยไว้ ขณะยังคงรักษาพื้นผิว dynamic plugin, generated, build, live-test และ package bridge ที่ตั้งใจไว้ซึ่ง Knip ไม่สามารถ resolve แบบ static ได้

## การ dispatch แบบแมนนวล

การ dispatch CI แบบแมนนวลรันกราฟงานเดียวกันกับ CI ปกติ แต่บังคับเปิด lane ที่มี scope ซึ่งไม่ใช่ Android ทุก lane: shard Linux Node, shard bundled-plugin, channel contract, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, การตรวจสอบ docs, Python skills, Windows, macOS และ Control UI i18n การ dispatch CI แบบแมนนวลเดี่ยวรัน Android เฉพาะเมื่อ `include_android=true` ส่วน umbrella ของ full release เปิด Android โดยส่ง `include_android=true` การตรวจ static ของ plugin prerelease, shard `agentic-plugins` สำหรับ release เท่านั้น, batch sweep ของ extension เต็มรูปแบบ และ lane Docker ของ plugin prerelease ถูกแยกออกจาก CI ชุด Docker prerelease จะรันเฉพาะเมื่อ `Full Release Validation` dispatch workflow `Plugin Prerelease` แยกต่างหากโดยเปิด gate release-validation

การรันแบบแมนนวลใช้ concurrency group ที่ไม่ซ้ำกัน เพื่อให้ full suite ของ release-candidate ไม่ถูกยกเลิกโดย push หรือ PR run อื่นบน ref เดียวกัน input `target_ref` แบบ optional ช่วยให้ caller ที่เชื่อถือได้รันกราฟนั้นกับ branch, tag หรือ commit SHA แบบเต็ม ขณะใช้ไฟล์ workflow จาก dispatch ref ที่เลือก

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| รันเนอร์                           | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, งานความปลอดภัยแบบเร็วและงานรวม (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจสอบ protocol/contract/bundled แบบเร็ว, การตรวจสอบ channel contract แบบแบ่งชาร์ด, ชาร์ด `check` ยกเว้น lint, ชาร์ดและงานรวม `check-additional`, ตัวตรวจสอบงานรวมทดสอบ Node, การตรวจสอบเอกสาร, Python skills, workflow-sanity, labeler, auto-response; preflight ของ install-smoke ยังใช้ Ubuntu ที่โฮสต์โดย GitHub เพื่อให้เมทริกซ์ Blacksmith เข้าคิวได้เร็วขึ้น |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, ชาร์ดส่วนขยายที่น้ำหนักต่ำกว่า, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, และ `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, ชาร์ดทดสอบ Linux Node, ชาร์ดทดสอบ Plugin ที่รวมมากับระบบ, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (ไวต่อ CPU มากพอที่ 8 vCPU ใช้ต้นทุนมากกว่าที่ประหยัดได้); บิลด์ Docker ของ install-smoke (เวลารอคิว 32-vCPU ใช้ต้นทุนมากกว่าที่ประหยัดได้)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; fork จะถอยกลับไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; fork จะถอยกลับไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

## การตรวจสอบรีลีสเต็มรูปแบบ

`Full Release Validation` คือ workflow ครอบคลุมแบบทำด้วยตนเองสำหรับ "รันทุกอย่างก่อนรีลีส" ซึ่งรับ branch, tag หรือ commit SHA แบบเต็ม, dispatch workflow `CI` แบบทำด้วยตนเองด้วยเป้าหมายนั้น, dispatch `Plugin Prerelease` สำหรับหลักฐาน plugin/package/static/Docker เฉพาะรีลีส และ dispatch `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, ชุดทดสอบ release-path ของ Docker, live/E2E, OpenWebUI, QA Lab parity, Matrix และเลน Telegram นอกจากนี้ยังสามารถรัน workflow หลังเผยแพร่ `NPM Telegram Beta E2E` เมื่อมีการระบุสเปกแพ็กเกจที่เผยแพร่แล้ว

`release_profile` ควบคุมขอบเขต live/provider ที่ส่งเข้า release checks:

- `minimum` เก็บเฉพาะเลน OpenAI/core ที่เร็วที่สุดและสำคัญต่อรีลีส
- `stable` เพิ่มชุด provider/backend ที่เสถียร
- `full` รันเมทริกซ์ provider/media แบบ advisory ที่กว้าง

umbrella จะบันทึก child run id ที่ dispatch แล้ว และงานสุดท้าย `Verify full validation` จะตรวจสอบ conclusion ปัจจุบันของ child run อีกครั้งและต่อท้ายตารางงานที่ช้าที่สุดสำหรับ child run แต่ละรายการ หาก workflow ลูกถูกรันใหม่และผ่านเป็นสีเขียว ให้รันใหม่เฉพาะงาน verifier ของ parent เพื่อรีเฟรชผลลัพธ์ umbrella และสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รับ `rerun_group` ใช้ `all` สำหรับ release candidate, `ci` สำหรับเฉพาะ child ของ CI เต็มแบบปกติ, `release-checks` สำหรับ child ของ release ทุกตัว หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` หรือ `npm-telegram` บน umbrella วิธีนี้ทำให้การรันซ้ำของกล่อง release ที่ล้มเหลวถูกจำกัดขอบเขตหลังการแก้ไขแบบเจาะจง

`OpenClaw Release Checks` ใช้ workflow ref ที่เชื่อถือได้เพื่อ resolve ref ที่เลือกหนึ่งครั้งเป็น tarball `release-package-under-test` จากนั้นส่ง artifact นั้นให้ทั้ง workflow Docker แบบ live/E2E release-path และชาร์ด package acceptance วิธีนี้ทำให้ bytes ของแพ็กเกจสอดคล้องกันในทุกกล่อง release และหลีกเลี่ยงการแพ็ก candidate เดิมซ้ำในหลาย child jobs

## ชาร์ด Live และ E2E

child ของ release live/E2E ยังคงครอบคลุม `pnpm test:live` แบบ native อย่างกว้าง แต่รันเป็นชาร์ดที่มีชื่อผ่าน `scripts/test-live-shard.mjs` แทน job แบบลำดับเดียว:

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

วิธีนี้คง coverage ของไฟล์เดิมไว้ พร้อมทำให้ความล้มเหลวของ live provider ที่ช้ารันซ้ำและวิเคราะห์ได้ง่ายขึ้น ชื่อชาร์ดรวม `native-live-extensions-o-z`, `native-live-extensions-media` และ `native-live-extensions-media-music` ยังคงใช้ได้สำหรับการรันซ้ำแบบ one-shot ด้วยตนเอง

ชาร์ด native live media รันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่ง build โดย workflow `Live Media Runner Image` image นี้ติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้า; งาน media ตรวจสอบเฉพาะ binaries ก่อน setup เท่านั้น เก็บชุดทดสอบ live ที่อิง Docker ไว้บนรันเนอร์ Blacksmith ปกติ เพราะ container jobs ไม่ใช่ที่ที่เหมาะสำหรับเปิดการทดสอบ Docker แบบซ้อน

ชาร์ด live model/backend ที่อิง Docker ใช้ image แชร์แยกต่างหาก `ghcr.io/openclaw/openclaw-live-test:<sha>` ต่อ commit ที่เลือก workflow release live จะ build และ push image นั้นหนึ่งครั้ง จากนั้นชาร์ด Docker live model, gateway, CLI backend, ACP bind และ Codex harness จะรันด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` หากชาร์ดเหล่านั้น rebuild เป้าหมาย Docker ของซอร์สเต็มอย่างเป็นอิสระ แปลว่าการรัน release ถูกกำหนดค่าผิดและจะเสีย wall clock ไปกับการ build image ซ้ำ

## การยอมรับแพ็กเกจ

ใช้ `Package Acceptance` เมื่อคำถามคือ "แพ็กเกจ OpenClaw ที่ติดตั้งได้นี้ทำงานในฐานะผลิตภัณฑ์หรือไม่" ซึ่งต่างจาก CI ปกติ: CI ปกติตรวจสอบ source tree ส่วน package acceptance ตรวจสอบ tarball เดียวผ่าน Docker E2E harness แบบเดียวกับที่ผู้ใช้ใช้งานหลังติดตั้งหรืออัปเดต

### งาน

1. `resolve_package` checkout `workflow_ref`, resolve candidate แพ็กเกจหนึ่งรายการ, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, อัปโหลดทั้งสองเป็น artifact `package-under-test` และพิมพ์ source, workflow ref, package ref, version, SHA-256 และ profile ในสรุปขั้นตอนของ GitHub
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` reusable workflow จะดาวน์โหลด artifact นั้น, ตรวจสอบ inventory ของ tarball, เตรียม package-digest Docker images เมื่อจำเป็น และรันเลน Docker ที่เลือกกับแพ็กเกจนั้นแทนการ pack workflow checkout เมื่อ profile เลือก `docker_lanes` แบบเจาะจงหลายรายการ reusable workflow จะเตรียมแพ็กเกจและ shared images หนึ่งครั้ง จากนั้นกระจายเลนเหล่านั้นออกเป็นงาน Docker แบบเจาะจงที่รันขนานพร้อม artifact ที่ไม่ซ้ำกัน
3. `package_telegram` เรียก `NPM Telegram Beta E2E` แบบไม่บังคับ โดยจะรันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้ง artifact `package-under-test` เดียวกันเมื่อ Package Acceptance resolve ได้หนึ่งรายการ; การ dispatch Telegram แบบ standalone ยังสามารถติดตั้งสเปก npm ที่เผยแพร่แล้วได้
4. `summary` ทำให้ workflow ล้มเหลวหาก package resolution, Docker acceptance หรือเลน Telegram แบบไม่บังคับล้มเหลว

### แหล่งที่มาของ candidate

- `source=npm` ยอมรับเฉพาะ `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรีลีส OpenClaw ที่ระบุแน่นอน เช่น `openclaw@2026.4.27-beta.2` ใช้ค่านี้สำหรับการยอมรับแพ็กเกจ beta/stable ที่เผยแพร่แล้ว
- `source=ref` แพ็ก branch, tag หรือ SHA ของ commit แบบเต็มจาก `package_ref` ที่เชื่อถือได้ ตัวแก้ค่า fetch branch/tag ของ OpenClaw, ตรวจสอบว่า commit ที่เลือกสามารถเข้าถึงได้จากประวัติ branch ของ repository หรือ release tag, ติดตั้ง deps ใน worktree แบบ detached แล้วแพ็กด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` ดาวน์โหลด HTTPS `.tgz`; ต้องระบุ `package_sha256`
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งไฟล์จาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็นตัวเลือก แต่ควรระบุสำหรับ artifact ที่แชร์ภายนอก

แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือโค้ด workflow/harness ที่เชื่อถือได้ซึ่งใช้รันการทดสอบ `package_ref` คือ commit ต้นทางที่จะถูกแพ็กเมื่อ `source=ref` วิธีนี้ทำให้ harness ทดสอบปัจจุบันตรวจสอบ commit ต้นทางเก่าที่เชื่อถือได้ โดยไม่ต้องรันลอจิก workflow เก่า

### โปรไฟล์ชุดทดสอบ

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` บวก `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — ชังก์เส้นทางรีลีส Docker แบบเต็มพร้อม OpenWebUI
- `custom` — `docker_lanes` แบบระบุแน่นอน; จำเป็นเมื่อ `suite_profile=custom`

โปรไฟล์ `package` ใช้ความครอบคลุม Plugin แบบออฟไลน์ เพื่อให้การตรวจสอบแพ็กเกจที่เผยแพร่แล้วไม่ถูกกั้นด้วยความพร้อมใช้งานของ ClawHub แบบสด เลน Telegram แบบตัวเลือกจะนำ artifact `package-under-test` กลับมาใช้ใน `NPM Telegram Beta E2E` โดยคงเส้นทางสเปก npm ที่เผยแพร่ไว้สำหรับการ dispatch แบบสแตนด์อโลน

การตรวจสอบรีลีสเรียก Package Acceptance ด้วย `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` และ `telegram_mode=mock-openai` ชังก์ Docker เส้นทางรีลีสครอบคลุมเลน package/update/plugin ที่ทับซ้อนกัน; Package Acceptance คงหลักฐาน compat ของช่องทางที่บันเดิลมาแบบใช้ artifact โดยตรง, Plugin ออฟไลน์ และ Telegram กับ tarball แพ็กเกจเดียวกันที่ resolve แล้ว การตรวจสอบรีลีสข้าม OS ยังคงครอบคลุมพฤติกรรม onboarding, installer และแพลตฟอร์มเฉพาะ OS; การตรวจสอบผลิตภัณฑ์ package/update ควรเริ่มจาก Package Acceptance เลนแพ็กเกจและ installer fresh ของ Windows ยังตรวจสอบด้วยว่าแพ็กเกจที่ติดตั้งแล้วสามารถ import browser-control override จากพาธ Windows แบบ absolute ดิบได้ smoke แบบ agent-turn ข้าม OS ของ OpenAI จะใช้ค่าเริ่มต้นเป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อกำหนดไว้ มิฉะนั้นใช้ `openai/gpt-5.4-mini` เพื่อให้หลักฐานการติดตั้งและ Gateway รวดเร็วและกำหนดผลซ้ำได้

### ช่วงความเข้ากันได้แบบ legacy

Package Acceptance มีช่วงความเข้ากันได้แบบ legacy ที่จำกัดไว้สำหรับแพ็กเกจที่เผยแพร่แล้ว แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้เส้นทางความเข้ากันได้:

- รายการ QA ส่วนตัวที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ถูกละไว้จาก tarball;
- `doctor-switch` อาจข้าม subcase การคงอยู่ของ `gateway install --wrapper` เมื่อแพ็กเกจไม่ได้เปิด flag นั้น;
- `update-channel-switch` อาจตัด `pnpm.patchedDependencies` ที่หายไปออกจาก fake git fixture ที่สร้างจาก tarball และอาจบันทึกว่า `update.channel` ที่คงอยู่หายไป;
- smoke ของ Plugin อาจอ่านตำแหน่ง install-record แบบ legacy หรือยอมรับการไม่มีการคงอยู่ของ marketplace install-record;
- `plugin-update` อาจอนุญาตการ migration metadata ของ config ขณะที่ยังต้องให้ install record และพฤติกรรม no-reinstall คงเดิม

แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนเรื่องไฟล์ตราประทับ metadata ของบิลด์ภายในเครื่องที่ถูกส่งออกไปแล้วได้เช่นกัน แพ็กเกจหลังจากนั้นต้องเป็นไปตามสัญญาสมัยใหม่; เงื่อนไขเดียวกันจะล้มเหลวแทนที่จะเตือนหรือข้าม

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

เมื่อ debug การรัน package acceptance ที่ล้มเหลว ให้เริ่มที่สรุป `resolve_package` เพื่อยืนยันแหล่งที่มา เวอร์ชัน และ SHA-256 ของแพ็กเกจ จากนั้นตรวจสอบ child run ของ `docker_acceptance` และ artifact Docker ของมัน: `.artifacts/docker-tests/**/summary.json`, `failures.json`, บันทึกของเลน, เวลาของแต่ละเฟส และคำสั่ง rerun ควร rerun โปรไฟล์แพ็กเกจที่ล้มเหลวหรือเลน Docker ที่ระบุแน่นอน แทนที่จะ rerun การตรวจสอบรีลีสแบบเต็ม

## Install smoke

workflow `Install Smoke` แยกต่างหากนำสคริปต์ scope เดียวกันกลับมาใช้ผ่าน job `preflight` ของตนเอง โดยแบ่งความครอบคลุม smoke เป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **Fast path** รันสำหรับ pull request ที่แตะพื้นผิว Docker/package, การเปลี่ยนแปลงแพ็กเกจ/manifest ของ Plugin ที่บันเดิลมา หรือพื้นผิว core plugin/channel/gateway/Plugin SDK ที่ job smoke ของ Docker ใช้ทดสอบ การเปลี่ยนแปลงเฉพาะซอร์สของ Plugin ที่บันเดิลมา, การแก้ไขเฉพาะการทดสอบ และการแก้ไขเฉพาะเอกสารจะไม่จอง Docker worker เส้นทาง fast สร้างอิมเมจ Dockerfile รากหนึ่งครั้ง, ตรวจสอบ CLI, รัน smoke ของ CLI agents delete shared-workspace, รัน container gateway-network e2e, ตรวจสอบ build arg ของส่วนขยายที่บันเดิลมา และรันโปรไฟล์ Docker ของ Plugin ที่บันเดิลมาแบบจำกัดภายใต้ timeout คำสั่งรวม 240 วินาที (Docker run ของแต่ละ scenario ถูกจำกัดแยกกัน)
- **Full path** คง QR package install และความครอบคลุม Docker/update ของ installer สำหรับการรันตามกำหนดทุกคืน, manual dispatch, workflow-call release checks และ pull request ที่แตะพื้นผิว installer/package/Docker จริง ๆ ในโหมด full นั้น install-smoke จะเตรียมหรือนำอิมเมจ smoke ของ GHCR root Dockerfile ตาม target-SHA หนึ่งอิมเมจกลับมาใช้ จากนั้นรัน QR package install, smoke ของ root Dockerfile/gateway, smoke ของ installer/update และ Docker E2E แบบ fast ของ Plugin ที่บันเดิลมาเป็น job แยกกัน เพื่อให้งาน installer ไม่ต้องรอหลัง smoke ของอิมเมจราก

push ไปยัง `main` (รวมถึง merge commit) จะไม่บังคับ full path; เมื่อ logic changed-scope ขอความครอบคลุมแบบ full บน push นั้น workflow จะคง Docker smoke แบบ fast และปล่อย full install smoke ให้เป็นหน้าที่ของการตรวจสอบรอบ nightly หรือ release

smoke ของ image-provider สำหรับ Bun global install แบบช้าถูกกั้นแยกต่างหากด้วย `run_bun_global_install_smoke` โดยรันตาม schedule ทุกคืนและจาก workflow release checks และ manual dispatch ของ `Install Smoke` สามารถเลือกใช้ได้ แต่ pull request และ push ไปยัง `main` จะไม่รัน การทดสอบ Docker ของ QR และ installer คง Dockerfile ที่เน้นการติดตั้งของตัวเองไว้

## Docker E2E ภายในเครื่อง

`pnpm test:docker:all` prebuild อิมเมจ live-test ที่แชร์ร่วมกันหนึ่งอิมเมจ, แพ็ก OpenClaw หนึ่งครั้งเป็น npm tarball และสร้างอิมเมจ `scripts/e2e/Dockerfile` ที่แชร์ร่วมกันสองอิมเมจ:

- runner แบบ bare Node/Git สำหรับเลน installer/update/plugin-dependency;
- อิมเมจ functional ที่ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับเลนฟังก์ชันปกติ

นิยามเลน Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs` และ runner จะรันเฉพาะ plan ที่เลือก scheduler เลือกอิมเมจต่อเลนด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` แล้วรันเลนด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### ค่าที่ปรับได้

| Variable                               | Default | Purpose                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | จำนวน slot ของ main-pool สำหรับเลนปกติ                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | จำนวน slot ของ tail-pool ที่ไวต่อ provider                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | เพดานเลน live พร้อมกัน เพื่อไม่ให้ provider throttle                                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | เพดานเลน npm install พร้อมกัน                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | เพดานเลน multi-service พร้อมกัน                                                               |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | ช่วงหน่วงระหว่างการเริ่มเลนเพื่อหลีกเลี่ยง create storm ของ Docker daemon; ตั้ง `0` เพื่อไม่หน่วง |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout สำรองต่อเลน (120 นาที); เลน live/tail ที่เลือกใช้เพดานที่เข้มกว่า                   |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` พิมพ์ plan ของ scheduler โดยไม่รันเลน                                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | รายการเลนที่ระบุแน่นอนคั่นด้วย comma; ข้าม cleanup smoke เพื่อให้ agent ทำซ้ำเลนที่ล้มเหลวหนึ่งเลนได้ |

เลนที่หนักกว่าเพดานที่มีผลของตัวเองยังสามารถเริ่มจาก pool ว่างได้ จากนั้นจะรันลำพังจนกว่าจะปล่อย capacity การรัน aggregate ภายในเครื่อง preflight Docker, ลบ container OpenClaw E2E ที่ค้างอยู่, แสดงสถานะเลนที่ active, คงเวลาของเลนไว้เพื่อการจัดลำดับ longest-first และโดยค่าเริ่มต้นจะหยุด schedule เลนใหม่ใน pool หลังเกิดความล้มเหลวครั้งแรก

### Workflow live/E2E ที่ใช้ซ้ำได้

workflow live/E2E ที่ใช้ซ้ำได้ถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องการความครอบคลุมของแพ็กเกจ ชนิดอิมเมจ อิมเมจ live เลน และ credential แบบใด จากนั้น `scripts/docker-e2e.mjs` แปลง plan นั้นเป็น output และสรุปของ GitHub โดยจะแพ็ก OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลด artifact แพ็กเกจของ run ปัจจุบัน หรือดาวน์โหลด artifact แพ็กเกจจาก `package_artifact_run_id`; ตรวจสอบ inventory ของ tarball; สร้างและ push อิมเมจ Docker E2E แบบ bare/functional ของ GHCR ที่ติด tag ตาม digest ของแพ็กเกจผ่าน Docker layer cache ของ Blacksmith เมื่อ plan ต้องการเลนที่ติดตั้งแพ็กเกจแล้ว; และนำ input `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรืออิมเมจตาม digest ของแพ็กเกจที่มีอยู่กลับมาใช้แทนการสร้างใหม่ การ pull อิมเมจ Docker จะ retry ด้วย timeout แบบจำกัดที่ 180 วินาทีต่อครั้ง เพื่อให้สตรีม registry/cache ที่ค้าง retry ได้เร็ว แทนที่จะใช้เวลาส่วนใหญ่ของ critical path ของ CI

### ชังก์เส้นทางรีลีส

ความครอบคลุม Docker ของรีลีสรัน job แบบแบ่งชังก์ที่เล็กลงด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละชังก์ pull เฉพาะชนิดอิมเมจที่ต้องใช้และรันหลายเลนผ่าน scheduler แบบถ่วงน้ำหนักเดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

ชังก์ Docker ของรีลีสปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` ถึง `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` และ `bundled-channels-contracts` ชังก์รวม `bundled-channels` ยังคงพร้อมใช้งานสำหรับการรันซ้ำแบบครั้งเดียวด้วยตนเอง และ `plugins-runtime-core`, `plugins-runtime` และ `plugins-integrations` ยังคงเป็นนามแฝงรวมของ plugin/runtime นามแฝงเลน `install-e2e` ยังคงเป็นนามแฝงการรันซ้ำด้วยตนเองแบบรวมสำหรับเลนตัวติดตั้งผู้ให้บริการทั้งสอง ชังก์ `bundled-channels` รันเลน `bundled-channel-*` และ `bundled-channel-update-*` แบบแยก แทนเลน `bundled-channel-deps` แบบอนุกรมทั้งหมดในที่เดียว

OpenWebUI จะถูกรวมเข้าใน `plugins-runtime-services` เมื่อการครอบคลุมเส้นทางรีลีสแบบเต็มร้องขอ และคงชังก์ `openwebui` แบบสแตนด์อโลนไว้เฉพาะสำหรับการ dispatch ที่มีเฉพาะ OpenWebUI เท่านั้น เลนอัปเดต bundled-channel จะลองใหม่หนึ่งครั้งสำหรับความล้มเหลวเครือข่าย npm ชั่วคราว

แต่ละชังก์อัปโหลด `.artifacts/docker-tests/` พร้อมล็อกเลน เวลา `summary.json`, `failures.json`, เวลาแต่ละเฟส, JSON แผน scheduler, ตารางเลนที่ช้า และคำสั่งรันซ้ำรายเลน อินพุต `docker_lanes` ของ workflow จะรันเลนที่เลือกกับอิมเมจที่เตรียมไว้แทนงานชังก์ ซึ่งทำให้การดีบักเลนที่ล้มเหลวจำกัดอยู่ในงาน Docker เป้าหมายเดียว และเตรียม ดาวน์โหลด หรือนำ package artifact กลับมาใช้ซ้ำสำหรับการรันนั้น หากเลนที่เลือกเป็นเลน Docker แบบสด งานเป้าหมายจะสร้างอิมเมจ live-test ในเครื่องสำหรับการรันซ้ำนั้น คำสั่งรันซ้ำ GitHub รายเลนที่สร้างขึ้นจะมี `package_artifact_run_id`, `package_artifact_name` และอินพุตอิมเมจที่เตรียมไว้เมื่อมีค่าเหล่านั้น เพื่อให้เลนที่ล้มเหลวสามารถนำแพ็กเกจและอิมเมจชุดเดิมจากการรันที่ล้มเหลวกลับมาใช้ซ้ำได้อย่างแม่นยำ

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

workflow live/E2E ตามกำหนดเวลาจะรันชุด Docker เส้นทางรีลีสแบบเต็มทุกวัน

## Plugin ก่อนเผยแพร่จริง

`Plugin Prerelease` เป็นการครอบคลุม product/package ที่มีค่าใช้จ่ายสูงกว่า จึงเป็น workflow แยกต่างหากที่ dispatch โดย `Full Release Validation` หรือโดยผู้ปฏิบัติงานที่ระบุอย่างชัดเจน Pull request ปกติ การ push ไปยัง `main` และการ dispatch CI ด้วยตนเองแบบสแตนด์อโลนจะปิดชุดนี้ไว้ ชุดนี้กระจายการทดสอบ Plugin ที่ bundled ข้าม extension worker แปดตัว งาน extension shard เหล่านั้นรันกลุ่มการกำหนดค่า Plugin ได้สูงสุดสองกลุ่มพร้อมกัน โดยมี Vitest worker หนึ่งตัวต่อกลุ่มและ Node heap ที่ใหญ่ขึ้น เพื่อให้ชุด Plugin ที่ import หนักไม่สร้างงาน CI เพิ่มเติม

## แล็บ QA

แล็บ QA มีเลน CI เฉพาะอยู่นอก workflow หลักที่กำหนด scope อย่างชาญฉลาด

- workflow `Parity gate` รันเมื่อมีการเปลี่ยนแปลง PR ที่ตรงกันและการ dispatch ด้วยตนเอง โดยจะสร้าง QA runtime ส่วนตัวและเปรียบเทียบแพ็ก agentic จำลอง GPT-5.5 และ Opus 4.6
- workflow `QA-Lab - All Lanes` รันทุกคืนบน `main` และเมื่อ dispatch ด้วยตนเอง โดยจะกระจาย mock parity gate, เลน Matrix แบบสด และเลน Telegram กับ Discord แบบสดเป็นงานขนาน งานสดใช้ environment `qa-live-shared` และ Telegram/Discord ใช้ Convex lease

การตรวจสอบรีลีสรันเลน transport แบบสดของ Matrix และ Telegram ด้วย deterministic mock provider และโมเดลที่มีคุณสมบัติ mock (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อให้สัญญาของช่องทางถูกแยกออกจาก latency ของโมเดลสดและการเริ่มต้น provider-plugin ปกติ Gateway transport แบบสดปิดใช้การค้นหา memory เพราะ QA parity ครอบคลุมพฤติกรรม memory แยกต่างหากแล้ว การเชื่อมต่อผู้ให้บริการครอบคลุมโดยชุด live model, native provider และ Docker provider แยกต่างหาก

Matrix ใช้ `--profile fast` สำหรับ gate ตามกำหนดเวลาและรีลีส โดยเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout รองรับเท่านั้น ค่าเริ่มต้นของ CLI และอินพุต workflow ด้วยตนเองยังคงเป็น `all` การ dispatch ด้วยตนเองที่ `matrix_profile=all` จะแบ่งการครอบคลุม Matrix แบบเต็มเป็นงาน `transport`, `media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรันเลนแล็บ QA ที่สำคัญต่อรีลีสก่อนการอนุมัติรีลีสด้วย parity gate ของ QA จะรันแพ็ก candidate และ baseline เป็นงานเลนคู่ขนาน จากนั้นดาวน์โหลด artifact ทั้งสองลงในงานรายงานขนาดเล็กสำหรับการเปรียบเทียบ parity ขั้นสุดท้าย

อย่าวางเส้นทางการ land PR ไว้หลัง `Parity gate` เว้นแต่ว่าการเปลี่ยนแปลงจะแตะ QA runtime, parity ของ model-pack หรือ surface ที่ workflow parity เป็นเจ้าของจริง ๆ สำหรับการแก้ไขช่องทาง การกำหนดค่า เอกสาร หรือ unit test ตามปกติ ให้ถือเป็นสัญญาณเสริมและทำตามหลักฐาน CI/check ตาม scope แทน

## CodeQL

workflow `CodeQL` ตั้งใจให้เป็นตัวสแกนความปลอดภัยรอบแรกที่มีขอบเขตแคบ ไม่ใช่การ sweep ทั้ง repository การรัน guard รายวัน ด้วยตนเอง และ pull request ที่ไม่ใช่ draft จะสแกนโค้ด workflow ของ Actions รวมถึง surface JavaScript/TypeScript ที่มีความเสี่ยงสูงสุด ด้วย query ความปลอดภัยความเชื่อมั่นสูงที่กรองเป็น `security-severity` ระดับสูง/วิกฤต

guard ของ pull request ยังคงเบา โดยจะเริ่มเฉพาะการเปลี่ยนแปลงใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` หรือ `src` และรัน matrix ความปลอดภัยความเชื่อมั่นสูงชุดเดียวกับ workflow ตามกำหนดเวลา ค่าเริ่มต้นของ PR ไม่รวม CodeQL สำหรับ Android และ macOS

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                          | Surface                                                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron และ baseline ของ Gateway                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการใช้งานช่องทางหลัก รวมถึง runtime ของ Plugin ช่องทาง, Gateway, Plugin SDK, secrets, จุดสัมผัส audit                 |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF หลัก, การแยกวิเคราะห์ IP, network guard, web-fetch และ surface นโยบาย SSRF ของ Plugin SDK                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | เซิร์ฟเวอร์ MCP, helper การประมวลผล process, outbound delivery และ gate การเรียกใช้เครื่องมือของ agent                                              |
| `/codeql-security-high/plugin-trust-boundary`     | การติดตั้ง Plugin, loader, manifest, registry, การ staging runtime-dependency, source-loading และ surface ความน่าเชื่อถือของสัญญาแพ็กเกจ Plugin SDK |

### ชาร์ดความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — ชาร์ดความปลอดภัย Android ตามกำหนดเวลา สร้างแอป Android ด้วยตนเองสำหรับ CodeQL บน Blacksmith Linux runner ที่เล็กที่สุดซึ่ง workflow sanity ยอมรับ อัปโหลดใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — ชาร์ดความปลอดภัย macOS รายสัปดาห์/ด้วยตนเอง สร้างแอป macOS ด้วยตนเองสำหรับ CodeQL บน Blacksmith macOS กรองผลลัพธ์การ build dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดใต้ `/codeql-critical-security/macos` เก็บไว้นอกค่าเริ่มต้นรายวันเพราะการ build macOS ครองเวลา runtime แม้เมื่อสะอาด

### หมวดหมู่คุณภาพวิกฤต

`CodeQL Critical Quality` คือชาร์ด non-security ที่สอดคล้องกัน โดยรันเฉพาะ query คุณภาพ JavaScript/TypeScript แบบ non-security ระดับ error-severity บน surface มูลค่าสูงที่มีขอบเขตแคบบน Blacksmith Linux runner ขนาดเล็กกว่า guard ของ pull request ตั้งใจให้เล็กกว่า profile ตามกำหนดเวลา: PR ที่ไม่ใช่ draft จะรันเฉพาะชาร์ด `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` ที่ตรงกัน สำหรับการเปลี่ยนแปลงโค้ดการเรียกใช้คำสั่ง/โมเดล/เครื่องมือของ agent และการ dispatch reply, โค้ด config schema/migration/IO, โค้ด auth/secrets/sandbox/security, ช่องทางหลักและ runtime ของ Plugin ช่องทางที่ bundled, protocol/server-method ของ Gateway, runtime memory/SDK glue, MCP/process/outbound delivery, runtime ของผู้ให้บริการ/catalog โมเดล, diagnostics ของ session/คิว delivery, Plugin loader, Plugin SDK/package-contract หรือ runtime reply ของ Plugin SDK การเปลี่ยนแปลง config ของ CodeQL และ workflow คุณภาพจะรันชาร์ดคุณภาพ PR ทั้งสิบสองชาร์ด

การ dispatch ด้วยตนเองยอมรับ:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

profile แบบแคบเป็น hook สำหรับการสอน/การวนซ้ำเพื่อรันชาร์ดคุณภาพหนึ่งชาร์ดแบบแยกเดี่ยว

| หมวดหมู่                                                | พื้นผิว                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ดขอบเขตความปลอดภัยของการยืนยันตัวตน, ข้อมูลลับ, sandbox, Cron และ Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | สัญญาของสคีมา config, การย้ายข้อมูล, การทำให้เป็นมาตรฐาน และ IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | สคีมาโปรโตคอล Gateway และสัญญาเมธอดของเซิร์ฟเวอร์                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญาการใช้งานช่องทางหลักและ Plugin ช่องทางที่รวมมา                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | สัญญารันไทม์ของการเรียกใช้คำสั่ง, การกระจายงานโมเดล/ผู้ให้บริการ, การกระจายและคิวการตอบกลับอัตโนมัติ และ control plane ของ ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | เซิร์ฟเวอร์ MCP และบริดจ์เครื่องมือ, ตัวช่วยกำกับดูแลโพรเซส และสัญญาการส่งออก                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK ของโฮสต์หน่วยความจำ, facade ของรันไทม์หน่วยความจำ, alias ของ Plugin SDK หน่วยความจำ, ส่วนเชื่อมการเปิดใช้งานรันไทม์หน่วยความจำ และคำสั่ง doctor ของหน่วยความจำ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | ภายในของคิวตอบกลับ, คิวการส่งของเซสชัน, ตัวช่วยผูก/ส่งเซสชันขาออก, พื้นผิวชุดเหตุการณ์/บันทึกวินิจฉัย และสัญญา CLI ของ doctor เซสชัน |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | การกระจายการตอบกลับขาเข้าของ Plugin SDK, payload การตอบกลับ/การแบ่ง chunk/ตัวช่วยรันไทม์, ตัวเลือกการตอบกลับของช่องทาง, คิวการส่ง และตัวช่วยผูกเซสชัน/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | การทำให้แคตตาล็อกโมเดลเป็นมาตรฐาน, การยืนยันตัวตนและการค้นพบผู้ให้บริการ, การลงทะเบียนรันไทม์ของผู้ให้บริการ, ค่าเริ่มต้น/แคตตาล็อกของผู้ให้บริการ และ registry ของเว็บ/การค้นหา/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | การ bootstrap ของ UI ควบคุม, persistence ภายในเครื่อง, โฟลว์ควบคุม Gateway และสัญญารันไทม์ของ control plane งาน                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | สัญญารันไทม์ของการ fetch/ค้นหาเว็บหลัก, IO สื่อ, การทำความเข้าใจสื่อ, การสร้างภาพ และการสร้างสื่อ                                                    |
| `/codeql-critical-quality/plugin-boundary`              | สัญญาของ loader, registry, พื้นผิวสาธารณะ และ entrypoint ของ Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | ซอร์ส Plugin SDK ฝั่งแพ็กเกจที่เผยแพร่แล้วและตัวช่วยสัญญาแพ็กเกจ Plugin                                                                                      |

คุณภาพแยกจากความปลอดภัยเพื่อให้สามารถจัดกำหนดการ วัดผล ปิดใช้งาน หรือขยายผลการตรวจพบด้านคุณภาพได้โดยไม่บดบังสัญญาณด้านความปลอดภัย ควรเพิ่มการขยาย CodeQL สำหรับ Swift, Python และ Plugin ที่รวมมา กลับเข้ามาเป็นงานติดตามผลแบบมีขอบเขตหรือแบ่ง shard หลังจากโปรไฟล์แบบแคบมีรันไทม์และสัญญาณที่เสถียรแล้วเท่านั้น

## เวิร์กโฟลว์การบำรุงรักษา

### Docs Agent

เวิร์กโฟลว์ `Docs Agent` เป็นเลนการบำรุงรักษา Codex แบบขับเคลื่อนด้วยเหตุการณ์สำหรับทำให้เอกสารที่มีอยู่สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง land แล้ว เวิร์กโฟลว์นี้ไม่มีตารางเวลาล้วน: การรัน CI จากการ push ที่ไม่ใช่บอตและสำเร็จบน `main` สามารถทริกเกอร์ได้ และการ dispatch ด้วยตนเองสามารถรันได้โดยตรง การเรียกจาก workflow-run จะข้ามเมื่อ `main` เดินหน้าไปแล้วหรือเมื่อมีการสร้างการรัน Docs Agent ที่ไม่ถูกข้ามอีกรายการภายในชั่วโมงที่ผ่านมา เมื่อรัน เวิร์กโฟลว์จะตรวจทานช่วง commit ตั้งแต่ SHA ต้นทาง Docs Agent ที่ไม่ถูกข้ามครั้งก่อนถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงหนึ่งครั้งสามารถครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมมาตั้งแต่การตรวจเอกสารครั้งล่าสุดได้

### Test Performance Agent

เวิร์กโฟลว์ `Test Performance Agent` เป็นเลนการบำรุงรักษา Codex แบบขับเคลื่อนด้วยเหตุการณ์สำหรับการทดสอบที่ช้า เวิร์กโฟลว์นี้ไม่มีตารางเวลาล้วน: การรัน CI จากการ push ที่ไม่ใช่บอตและสำเร็จบน `main` สามารถทริกเกอร์ได้ แต่จะข้ามหากการเรียก workflow-run อีกรายการหนึ่งรันไปแล้วหรือกำลังรันอยู่ในวัน UTC นั้น การ dispatch ด้วยตนเองจะข้าม gate กิจกรรมรายวันนั้น เลนนี้สร้างรายงานประสิทธิภาพ Vitest แบบ grouped ของทั้ง suite ให้ Codex ทำได้เฉพาะการแก้ไขประสิทธิภาพการทดสอบขนาดเล็กที่รักษา coverage ไว้แทนการ refactor กว้าง ๆ จากนั้นรันรายงานทั้ง suite อีกครั้งและปฏิเสธการเปลี่ยนแปลงที่ลดจำนวนการทดสอบ baseline ที่ผ่าน หาก baseline มีการทดสอบที่ล้มเหลว Codex อาจแก้ได้เฉพาะความล้มเหลวที่ชัดเจน และรายงานทั้ง suite หลัง agent ต้องผ่านก่อนจึงจะ commit อะไรได้ เมื่อ `main` เดินหน้าไปก่อนที่ bot push จะ land เลนนี้จะ rebase แพตช์ที่ตรวจสอบแล้ว รัน `pnpm check:changed` อีกครั้ง และลอง push ใหม่ แพตช์เก่าที่ขัดแย้งกันจะถูกข้าม เลนนี้ใช้ GitHub-hosted Ubuntu เพื่อให้ action ของ Codex รักษาท่าทีความปลอดภัยแบบ drop-sudo เดียวกับ docs agent ได้

### PR ซ้ำหลัง Merge

เวิร์กโฟลว์ `Duplicate PRs After Merge` เป็นเวิร์กโฟลว์ผู้ดูแลแบบ manual สำหรับล้าง PR ซ้ำหลัง land ค่าเริ่มต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุไว้อย่างชัดเจนเมื่อ `apply=true` ก่อนแก้ไข GitHub เวิร์กโฟลว์จะตรวจสอบว่า PR ที่ land ถูก merge แล้ว และ PR ซ้ำแต่ละรายการมี issue ที่อ้างอิงร่วมกันหรือมี hunk ที่เปลี่ยนแปลงทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate การตรวจภายในเครื่องและการกำหนดเส้นทางตามการเปลี่ยนแปลง

ตรรกะ changed-lane ภายในเครื่องอยู่ใน `scripts/changed-lanes.mjs` และถูกเรียกใช้โดย `scripts/check-changed.mjs` gate การตรวจภายในเครื่องนั้นเข้มงวดกับขอบเขตสถาปัตยกรรมมากกว่าขอบเขตแพลตฟอร์ม CI แบบกว้าง:

- การเปลี่ยนแปลง production หลักจะรัน typecheck ของ prod หลักและการทดสอบหลัก รวมถึง lint/guard หลัก;
- การเปลี่ยนแปลงเฉพาะการทดสอบหลักจะรันเฉพาะ typecheck ของการทดสอบหลัก รวมถึง lint หลัก;
- การเปลี่ยนแปลง production ของ extension จะรัน typecheck ของ prod extension และการทดสอบ extension รวมถึง lint extension;
- การเปลี่ยนแปลงเฉพาะการทดสอบ extension จะรัน typecheck ของการทดสอบ extension รวมถึง lint extension;
- การเปลี่ยนแปลง Plugin SDK สาธารณะหรือสัญญา Plugin จะขยายไปยัง typecheck ของ extension เพราะ extension พึ่งพาสัญญาหลักเหล่านั้น (การกวาดทดสอบ extension ด้วย Vitest ยังคงเป็นงานทดสอบที่ต้องสั่งชัดเจน);
- การ bump เวอร์ชันเฉพาะ metadata ของ release จะรันการตรวจเวอร์ชัน/config/root-dependency แบบเจาะจง;
- การเปลี่ยนแปลง root/config ที่ไม่รู้จักจะ fail safe ไปยังเลนตรวจทั้งหมด

การกำหนดเส้นทาง changed-test ภายในเครื่องอยู่ใน `scripts/test-projects.test-support.mjs` และตั้งใจให้ถูกกว่า `check:changed`: การแก้ไข test โดยตรงจะรันตัวเอง, การแก้ไขซอร์สจะเลือก mapping ที่ชัดเจนก่อน แล้วจึงเป็นการทดสอบ sibling และ dependent ตาม import graph Config การส่ง group-room ที่แชร์เป็นหนึ่งใน mapping ที่ชัดเจน: การเปลี่ยนแปลง config การตอบกลับที่มองเห็นได้ของกลุ่ม, โหมดการส่งการตอบกลับของซอร์ส หรือ system prompt ของ message-tool จะ route ผ่านการทดสอบการตอบกลับหลัก รวมถึง regression การส่งของ Discord และ Slack เพื่อให้การเปลี่ยนค่าเริ่มต้นที่แชร์ล้มเหลวก่อน push PR ครั้งแรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างระดับ harness จนชุด mapped ราคาถูกไม่ใช่ proxy ที่น่าเชื่อถือ

## การตรวจสอบด้วย Testbox

รัน Testbox จาก repo root และควรใช้ box ที่ warm ใหม่สำหรับหลักฐานแบบกว้าง ก่อนใช้ gate ที่ช้าบน box ที่ถูกใช้ซ้ำ หมดอายุ หรือเพิ่งรายงาน sync ที่ใหญ่ผิดคาด ให้รัน `pnpm testbox:sanity` ภายใน box ก่อน

การตรวจ sanity จะล้มเหลวอย่างรวดเร็วเมื่อไฟล์ root ที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short` แสดงการลบไฟล์ที่ติดตามแล้วอย่างน้อย 200 รายการ โดยปกติหมายความว่าสถานะ sync ระยะไกลไม่ใช่สำเนา PR ที่เชื่อถือได้ ให้หยุด box นั้นและ warm box ใหม่แทนการ debug ความล้มเหลวของการทดสอบผลิตภัณฑ์ สำหรับ PR ที่ตั้งใจลบไฟล์จำนวนมาก ให้ตั้ง `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับการรัน sanity นั้น

`pnpm testbox:run` ยังยุติการเรียก Blacksmith CLI ภายในเครื่องที่ค้างอยู่ในเฟส sync นานเกินห้านาทีโดยไม่มี output หลัง sync ตั้งค่า `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` เพื่อปิด guard นั้น หรือใช้ค่ามิลลิวินาทีที่ใหญ่ขึ้นสำหรับ diff ภายในเครื่องที่ใหญ่ผิดปกติ

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
