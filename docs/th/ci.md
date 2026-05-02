---
read_when:
    - คุณต้องเข้าใจว่าเหตุใดงาน CI จึงทำงานหรือไม่ทำงาน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการรันหรือการรันซ้ำเพื่อตรวจสอบความถูกต้องของรีลีส
    - คุณกำลังเปลี่ยนการ dispatch ของ ClawSweeper หรือการส่งต่อกิจกรรม GitHub
summary: กราฟงาน CI, เกตตามขอบเขต, งานครอบการเผยแพร่ และคำสั่งในเครื่องที่เทียบเท่า
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-05-02T10:09:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39af4afcb3e7c847c44a9d47513ac4b99c62d13fb139ece0bee979f24687ea38
    source_path: ci.md
    workflow: 16
---

OpenClaw CI ทำงานในทุกการ push ไปยัง `main` และทุก pull request งาน `preflight` จะจัดประเภท diff และปิด lane ที่มีค่าใช้จ่ายสูงเมื่อมีการเปลี่ยนเฉพาะพื้นที่ที่ไม่เกี่ยวข้อง การรันแบบ manual `workflow_dispatch` ตั้งใจข้าม smart scoping และกระจายไปยังกราฟเต็มสำหรับ release candidate และการตรวจสอบความถูกต้องแบบกว้าง lane ของ Android ยังคงเป็นแบบ opt-in ผ่าน `include_android` ความครอบคลุมของ Plugin เฉพาะ release อยู่ใน workflow [`Plugin Prerelease`](#plugin-prerelease) แยกต่างหาก และรันจาก [`Full Release Validation`](#full-release-validation) หรือการ dispatch แบบ manual ที่ระบุชัดเจนเท่านั้น

## ภาพรวม pipeline

| งาน                              | วัตถุประสงค์                                                                                      | เมื่อใดที่รัน                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | ตรวจจับการเปลี่ยนแปลงเฉพาะ docs, scope ที่เปลี่ยน, extension ที่เปลี่ยน และสร้าง CI manifest      | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-scm-fast`              | ตรวจจับ private key และตรวจ audit workflow ผ่าน `zizmor`                                        | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-dependency-audit`      | audit production lockfile แบบไม่ต้องใช้ dependency เทียบกับ advisory ของ npm                             | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-fast`                  | aggregate ที่จำเป็นสำหรับงาน security แบบเร็ว                                                | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `check-dependencies`             | pass เฉพาะ dependency ของ production Knip รวมถึง guard สำหรับ allowlist ของไฟล์ที่ไม่ได้ใช้                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-artifacts`                | build `dist/`, Control UI, การตรวจ built-artifact และ artifact ปลายน้ำที่ใช้ซ้ำได้          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-core`               | lane ตรวจความถูกต้องบน Linux แบบเร็ว เช่น การตรวจ bundled/plugin-contract/protocol                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-contracts-channels` | ตรวจ channel contract แบบ sharded พร้อมผลตรวจ aggregate ที่เสถียร                         | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-core-test`          | shard การทดสอบ Core Node โดยไม่รวม channel, bundled, contract และ extension lane             | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check`                          | สิ่งเทียบเท่า main local gate แบบ sharded: prod types, lint, guards, test types และ strict smoke   | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check-additional`               | shard สำหรับ architecture, boundary, extension-surface guards, package-boundary และ gateway-watch | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-smoke`                    | การทดสอบ smoke สำหรับ built-CLI และ smoke สำหรับ startup-memory                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks`                         | verifier สำหรับการทดสอบ channel ของ built-artifact                                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-compat-node22`      | lane build และ smoke สำหรับความเข้ากันได้กับ Node 22                                                   | manual CI dispatch สำหรับ release    |
| `check-docs`                     | การตรวจ formatting, lint และ broken-link ของ docs                                                | docs มีการเปลี่ยนแปลง                       |
| `skills-python`                  | Ruff + pytest สำหรับ skills ที่ใช้ Python อยู่เบื้องหลัง                                                       | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python-skill      |
| `checks-windows`                 | การทดสอบ process/path เฉพาะ Windows รวมถึง regression ของ shared runtime import specifier         | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows           |
| `macos-node`                     | lane การทดสอบ TypeScript บน macOS โดยใช้ built artifacts ที่แชร์กัน                                  | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `macos-swift`                    | Swift lint, build และการทดสอบสำหรับแอป macOS                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `android`                        | การทดสอบ unit ของ Android สำหรับทั้งสอง flavor รวมถึงการ build debug APK หนึ่งรายการ                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android           |
| `test-performance-agent`         | การปรับแต่งการทดสอบช้ารายวันด้วย Codex หลังจากกิจกรรมที่เชื่อถือได้                                    | CI บน main สำเร็จหรือ manual dispatch |

## ลำดับ fail-fast

1. `preflight` ตัดสินว่า lane ใดมีอยู่จริงบ้าง logic `docs-scope` และ `changed-scope` เป็น step ภายในงานนี้ ไม่ใช่งานแยกต่างหาก
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` fail ได้อย่างรวดเร็วโดยไม่ต้องรอ artifact และงาน matrix ของ platform ที่หนักกว่า
3. `build-artifacts` ทำงานซ้อนกับ lane Linux แบบเร็ว เพื่อให้ผู้บริโภคปลายน้ำเริ่มได้ทันทีที่ shared build พร้อม
4. lane ของ platform และ runtime ที่หนักกว่าจะกระจายต่อจากนั้น: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่เป็น `cancelled` เมื่อมี push ใหม่กว่าลงบน PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่านั่นเป็น noise ของ CI เว้นแต่ run ใหม่ล่าสุดสำหรับ ref เดียวกันก็ล้มเหลวด้วย การตรวจ aggregate shard ใช้ `!cancelled() && always()` เพื่อให้ยังรายงาน shard failure ตามปกติ แต่ไม่ queue หลังจาก workflow ทั้งหมดถูกแทนที่ไปแล้ว key concurrency อัตโนมัติของ CI มี version (`CI-v7-*`) ดังนั้น zombie ฝั่ง GitHub ใน queue group เก่าจะไม่สามารถ block run ใหม่กว่าบน main ได้อย่างไม่มีกำหนด run full-suite แบบ manual ใช้ `CI-manual-v1-*` และไม่ยกเลิก run ที่กำลังดำเนินอยู่

## Scope และ routing

logic ของ scope อยู่ใน `scripts/ci-changed-scope.mjs` และครอบคลุมด้วย unit test ใน `src/scripts/ci-changed-scope.test.ts` การ dispatch แบบ manual จะข้ามการตรวจ changed-scope และทำให้ preflight manifest ทำงานราวกับว่าทุกพื้นที่ที่มี scope เปลี่ยนแปลง

- **การแก้ไข CI workflow** ตรวจสอบกราฟ Node CI รวมถึง workflow linting แต่ไม่ได้บังคับให้ Windows, Android หรือ native build ของ macOS ทำงานด้วยตัวเอง; lane ของ platform เหล่านั้นยังคง scoped ตามการเปลี่ยนแปลงของ source เฉพาะ platform
- **การแก้ไขเฉพาะ CI routing, การแก้ไข fixture ของ core-test ราคาถูกบางส่วน และการแก้ไข helper/test-routing ของ plugin contract แบบแคบ** ใช้ path manifest แบบ Node-only ที่เร็ว: `preflight`, security และ task `checks-fast-core` หนึ่งรายการ path นั้นข้าม build artifacts, ความเข้ากันได้กับ Node 22, channel contracts, full core shards, bundled-plugin shards และ matrix guard เพิ่มเติม เมื่อการเปลี่ยนจำกัดอยู่ที่พื้นผิว routing หรือ helper ที่ task แบบเร็วทดสอบโดยตรง
- **การตรวจ Windows Node** scoped ไปที่ wrapper สำหรับ process/path เฉพาะ Windows, helper ของ npm/pnpm/UI runner, config ของ package manager และพื้นผิว CI workflow ที่รัน lane นั้น; การเปลี่ยนแปลง source, plugin, install-smoke และ test-only ที่ไม่เกี่ยวข้องจะอยู่บน lane Linux Node ต่อไป

ตระกูลการทดสอบ Node ที่ช้าที่สุดถูกแยกหรือปรับสมดุลเพื่อให้แต่ละงานยังเล็กโดยไม่จอง runner เกินจำเป็น: channel contracts รันเป็น shard แบบถ่วงน้ำหนักสามส่วน, lane unit ขนาดเล็กของ core ถูกจับคู่กัน, auto-reply รันเป็น worker ที่สมดุลสี่ตัว (โดยแยก subtree ของ reply เป็น shard agent-runner, dispatch และ commands/state-routing) และ config ของ agentic gateway/plugin ถูกกระจายไปยังงาน agentic Node แบบ source-only ที่มีอยู่ แทนที่จะรอ built artifacts การทดสอบ plugin แบบกว้างสำหรับ browser, QA, media และ miscellaneous ใช้ config Vitest เฉพาะของตัวเองแทน plugin catch-all ที่แชร์กัน shard แบบ include-pattern บันทึกรายการ timing โดยใช้ชื่อ CI shard เพื่อให้ `.artifacts/vitest-shard-timings.json` แยก whole config ออกจาก filtered shard ได้ `check-additional` เก็บงาน compile/canary ของ package-boundary ไว้ด้วยกัน และแยก runtime topology architecture ออกจากความครอบคลุมของ gateway watch; shard boundary guard รัน guard อิสระขนาดเล็กแบบพร้อมกันภายในงานเดียว Gateway watch, การทดสอบ channel และ shard core support-boundary รันพร้อมกันภายใน `build-artifacts` หลังจาก build `dist/` และ `dist-runtime/` เรียบร้อยแล้ว

Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` แล้วจึง build Play debug APK flavor ของ third-party ไม่มี source set หรือ manifest แยกต่างหาก; lane unit-test ของมันยัง compile flavor ด้วย flag BuildConfig สำหรับ SMS/call-log ขณะเดียวกันก็หลีกเลี่ยงงาน packaging debug APK ซ้ำในทุก push ที่เกี่ยวข้องกับ Android

shard `check-dependencies` รัน `pnpm deadcode:dependencies` (pass เฉพาะ dependency ของ production Knip ที่ pin ไปยัง Knip version ล่าสุด โดยปิด minimum release age ของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบผลค้นหาไฟล์ production ที่ไม่ได้ใช้ของ Knip กับ `scripts/deadcode-unused-files.allowlist.mjs` guard ไฟล์ที่ไม่ได้ใช้จะ fail เมื่อ PR เพิ่มไฟล์ที่ไม่ได้ใช้ใหม่โดยยังไม่ถูก review หรือเหลือ entry เก่าค้างใน allowlist ขณะเดียวกันยังรักษาพื้นผิว dynamic plugin, generated, build, live-test และ package bridge ที่ตั้งใจไว้ซึ่ง Knip resolve แบบ static ไม่ได้

## การ forward กิจกรรมของ ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` เป็น bridge ฝั่งเป้าหมายจากกิจกรรม repository ของ OpenClaw ไปยัง ClawSweeper มันไม่ check out หรือ execute code ของ pull request ที่ไม่น่าเชื่อถือ workflow สร้าง GitHub App token จาก `CLAWSWEEPER_APP_PRIVATE_KEY` แล้ว dispatch payload `repository_dispatch` แบบกะทัดรัดไปยัง `openclaw/clawsweeper`

workflow มีสี่ lane:

- `clawsweeper_item` สำหรับคำขอ review issue และ pull request แบบเจาะจง;
- `clawsweeper_comment` สำหรับคำสั่ง ClawSweeper ที่ระบุชัดเจนใน comment ของ issue;
- `clawsweeper_commit_review` สำหรับคำขอ review ระดับ commit บน push ไปยัง `main`;
- `github_activity` สำหรับกิจกรรมทั่วไปของ GitHub ที่เอเจนต์ ClawSweeper อาจตรวจสอบ

lane `github_activity` forward เฉพาะ metadata ที่ normalize แล้ว: event type, action, actor, repository, item number, URL, title, state และ excerpt สั้นสำหรับ comment หรือ review เมื่อมี มันตั้งใจหลีกเลี่ยงการ forward body ของ webhook ทั้งหมด workflow ฝั่งรับใน `openclaw/clawsweeper` คือ `.github/workflows/github-activity.yml` ซึ่ง post event ที่ normalize แล้วไปยัง hook ของ OpenClaw Gateway สำหรับเอเจนต์ ClawSweeper

กิจกรรมทั่วไปคือการสังเกต ไม่ใช่การส่งต่อโดยค่าเริ่มต้น เอเจนต์ ClawSweeper ได้รับเป้าหมาย Discord ใน prompt และควร post ไปยัง `#clawsweeper` เฉพาะเมื่อ event นั้นน่าประหลาดใจ, ดำเนินการได้, มีความเสี่ยง หรือมีประโยชน์เชิงปฏิบัติการ การเปิด, การแก้ไข, bot churn, duplicate webhook noise และ traffic review ตามปกติควรให้ผลเป็น `NO_REPLY`

ให้ถือ title, comment, body, review text, branch name และ commit message ของ GitHub เป็นข้อมูลที่ไม่น่าเชื่อถือตลอด path นี้ สิ่งเหล่านี้เป็น input สำหรับการสรุปและ triage ไม่ใช่คำสั่งสำหรับ workflow หรือ runtime ของเอเจนต์

## Manual dispatches

manual CI dispatch รันกราฟงานเดียวกับ CI ปกติ แต่บังคับเปิดทุก lane ที่มี scope และไม่ใช่ Android: shard Linux Node, bundled-plugin shards, channel contracts, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS และ Control UI i18n manual CI dispatch แบบ standalone จะรัน Android เฉพาะเมื่อ `include_android=true`; umbrella ของ full release เปิด Android โดยส่ง `include_android=true` การตรวจ static ของ plugin prerelease, shard `agentic-plugins` เฉพาะ release, sweep แบบ full extension batch และ lane Docker ของ plugin prerelease ถูกแยกออกจาก CI suite Docker prerelease รันเฉพาะเมื่อ `Full Release Validation` dispatch workflow `Plugin Prerelease` แยกต่างหากพร้อมเปิด release-validation gate

manual run ใช้ concurrency group ที่ไม่ซ้ำกัน เพื่อให้ full suite ของ release-candidate ไม่ถูกยกเลิกโดย push หรือ PR run อื่นบน ref เดียวกัน input `target_ref` แบบ optional ช่วยให้ caller ที่เชื่อถือได้รันกราฟนั้นกับ branch, tag หรือ commit SHA แบบเต็ม โดยใช้ workflow file จาก dispatch ref ที่เลือก

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## รันเนอร์

| รันเนอร์                           | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, งานความปลอดภัยแบบเร็วและงานรวม (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจสอบโปรโตคอล/สัญญา/แบบบันเดิลที่รวดเร็ว, การตรวจสอบสัญญาช่องทางแบบแบ่งชาร์ด, ชาร์ด `check` ยกเว้น lint, ชาร์ดและงานรวม `check-additional`, ตัวตรวจสอบงานรวมทดสอบ Node, การตรวจสอบเอกสาร, Python skills, workflow-sanity, labeler, auto-response; preflight ของ install-smoke ยังใช้ Ubuntu ที่โฮสต์โดย GitHub ด้วย เพื่อให้เมทริกซ์ Blacksmith เข้าคิวได้เร็วขึ้น |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, ชาร์ด Plugin ที่มีน้ำหนักเบากว่า, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, และ `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, ชาร์ดทดสอบ Linux Node, ชาร์ดทดสอบ Plugin แบบบันเดิล, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (ไวต่อ CPU มากพอที่ 8 vCPU มีต้นทุนมากกว่าที่ช่วยประหยัดได้); บิลด์ Docker ของ install-smoke (เวลาเข้าคิว 32-vCPU มีต้นทุนมากกว่าที่ช่วยประหยัดได้)                                                                                                                                                                                                                                                                                                                     |
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

## การตรวจสอบรีลีสแบบเต็ม

`Full Release Validation` คือเวิร์กโฟลว์ร่มแบบแมนนวลสำหรับ "รันทุกอย่างก่อนรีลีส" โดยรับ branch, tag หรือ SHA คอมมิตเต็ม ส่งเวิร์กโฟลว์ `CI` แบบแมนนวลพร้อมเป้าหมายนั้น ส่ง `Plugin Prerelease` สำหรับหลักฐานเฉพาะรีลีสของ Plugin/package/static/Docker และส่ง `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, ชุดทดสอบเส้นทางรีลีส Docker, live/E2E, OpenWebUI, ความเท่าเทียมของ QA Lab, Matrix และเลน Telegram เมื่อใช้ `rerun_group=all` และ `release_profile=full` จะรัน `NPM Telegram Beta E2E` กับอาร์ติแฟกต์ `release-package-under-test` จาก release checks ด้วย หลังเผยแพร่แล้ว ให้ส่ง `npm_telegram_package_spec` เพื่อรันเลนแพ็กเกจ Telegram เดิมซ้ำกับแพ็กเกจ npm ที่เผยแพร่แล้ว

ดู [การตรวจสอบรีลีสแบบเต็ม](/th/reference/full-release-validation) สำหรับ
เมทริกซ์สเตจ, ชื่องานเวิร์กโฟลว์ที่แน่นอน, ความแตกต่างของโปรไฟล์, อาร์ติแฟกต์ และ
ตัวจัดการการรันซ้ำแบบเจาะจง

`OpenClaw Release Publish` คือเวิร์กโฟลว์รีลีสแบบแมนนวลที่เปลี่ยนแปลงสถานะ ส่งเวิร์กโฟลว์นี้จาก `release/YYYY.M.D` หรือ `main` หลังมีแท็กรีลีสแล้ว และหลังจาก preflight ของ OpenClaw npm สำเร็จแล้ว โดยตรวจสอบ `pnpm plugins:sync:check`, ส่ง `Plugin NPM Release` สำหรับแพ็กเกจ Plugin ที่เผยแพร่ได้ทั้งหมด, ส่ง `Plugin ClawHub Release` สำหรับ SHA รีลีสเดียวกัน และหลังจากนั้นเท่านั้นจึงส่ง `OpenClaw NPM Release` พร้อม `preflight_run_id` ที่บันทึกไว้

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

สำหรับหลักฐานคอมมิตแบบปักหมุดบน branch ที่เคลื่อนไหวเร็ว ให้ใช้ตัวช่วยแทน
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

refs สำหรับ dispatch เวิร์กโฟลว์ GitHub ต้องเป็น branch หรือ tag ไม่ใช่ SHA คอมมิตดิบ
ตัวช่วยจะ push branch ชั่วคราว `release-ci/<sha>-...` ที่ SHA เป้าหมาย,
ส่ง `Full Release Validation` จาก ref ที่ปักหมุดนั้น, ตรวจสอบว่า `headSha` ของเวิร์กโฟลว์ลูกทุกตัวตรงกับเป้าหมาย และลบ branch ชั่วคราวเมื่อ
การรันเสร็จสิ้น ตัวตรวจสอบร่มจะล้มเหลวด้วยหากมีเวิร์กโฟลว์ลูกใดรันที่
SHA อื่น

`release_profile` ควบคุมความครอบคลุม live/provider ที่ส่งเข้า release checks เวิร์กโฟลว์รีลีสแบบแมนนวลมีค่าเริ่มต้นเป็น `stable`; ใช้ `full` เฉพาะเมื่อคุณ
ตั้งใจต้องการเมทริกซ์ผู้ให้บริการ/สื่อเชิง advisory ที่กว้าง

- `minimum` คงไว้เฉพาะเลน OpenAI/core ที่เร็วที่สุดและจำเป็นต่อรีลีส
- `stable` เพิ่มชุดผู้ให้บริการ/backend แบบ stable
- `full` รันเมทริกซ์ผู้ให้บริการ/สื่อเชิง advisory ที่กว้าง

เวิร์กโฟลว์ร่มจะบันทึก id ของการรันลูกที่ถูกส่ง และงานสุดท้าย `Verify full validation` จะตรวจสอบข้อสรุปปัจจุบันของการรันลูกอีกครั้ง และต่อท้ายตารางงานที่ช้าที่สุดสำหรับการรันลูกแต่ละรายการ หากเวิร์กโฟลว์ลูกถูกรันซ้ำและเปลี่ยนเป็นสีเขียว ให้รันซ้ำเฉพาะงานตรวจสอบของ parent เพื่อรีเฟรชผลลัพธ์ร่มและสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รับ `rerun_group` ใช้ `all` สำหรับ release candidate, `ci` สำหรับเฉพาะ child CI แบบเต็มปกติ, `plugin-prerelease` สำหรับเฉพาะ child ของ plugin prerelease, `release-checks` สำหรับ child รีลีสทั้งหมด หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` หรือ `npm-telegram` บนร่ม วิธีนี้ช่วยให้การรันซ้ำของกล่องรีลีสที่ล้มเหลวมีขอบเขตจำกัดหลังการแก้ไขแบบเจาะจง

`OpenClaw Release Checks` ใช้ ref เวิร์กโฟลว์ที่เชื่อถือได้เพื่อ resolve ref ที่เลือกเพียงครั้งเดียวเป็น tarball `release-package-under-test` จากนั้นส่งอาร์ติแฟกต์นั้นไปทั้งเวิร์กโฟลว์ Docker สำหรับเส้นทางรีลีส live/E2E และชาร์ด package acceptance วิธีนี้ทำให้ bytes ของแพ็กเกจสอดคล้องกันระหว่างกล่องรีลีส และหลีกเลี่ยงการแพ็ก candidate เดียวกันซ้ำในงานลูกหลายรายการ

การรัน `Full Release Validation` ซ้ำสำหรับ `ref=main` และ `rerun_group=all`
จะแทนที่ร่มที่เก่ากว่า ตัวเฝ้าดู parent จะยกเลิกเวิร์กโฟลว์ลูกใดๆ ที่
ส่งไปแล้วเมื่อ parent ถูกยกเลิก ดังนั้นการตรวจสอบ main ที่ใหม่กว่า
จะไม่ค้างอยู่หลังการรัน release-check ที่ล้าสมัยสองชั่วโมง การตรวจสอบ
branch/tag รีลีสและกลุ่มรันซ้ำแบบเจาะจงจะคง `cancel-in-progress: false`

## ชาร์ด Live และ E2E

child live/E2E ของรีลีสยังคงครอบคลุม `pnpm test:live` แบบ native กว้าง แต่รันเป็นชาร์ดที่มีชื่อผ่าน `scripts/test-live-shard.mjs` แทนที่จะเป็นงาน serial งานเดียว:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- งาน `native-live-src-gateway-profiles` ที่กรองตามผู้ให้บริการ
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- ชาร์ดสื่อ audio/video ที่แยก และชาร์ด music ที่กรองตามผู้ให้บริการ

วิธีนี้คงความครอบคลุมไฟล์เดิมไว้ พร้อมทำให้ความล้มเหลวของผู้ให้บริการ live ที่ช้ารันซ้ำและวินิจฉัยได้ง่ายขึ้น ชื่อชาร์ดรวม `native-live-extensions-o-z`, `native-live-extensions-media` และ `native-live-extensions-media-music` ยังคงใช้ได้สำหรับการรันซ้ำแบบ one-shot ด้วยตนเอง

ชาร์ดสื่อ native live รันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งสร้างโดยเวิร์กโฟลว์ `Live Media Runner Image` อิมเมจนั้นติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้าแล้ว; งานสื่อจะตรวจสอบเฉพาะไบนารีก่อน setup เท่านั้น ให้คงชุดทดสอบ live ที่ใช้ Docker ไว้บนรันเนอร์ Blacksmith ปกติ เพราะงานแบบ container ไม่ใช่ที่ที่เหมาะสำหรับเปิดการทดสอบ Docker ซ้อนภายใน

ชาร์ดโมเดล/แบ็กเอนด์แบบ live ที่มี Docker รองรับใช้ภาพ `ghcr.io/openclaw/openclaw-live-test:<sha>` แบบใช้ร่วมกันแยกต่างหากต่อคอมมิตที่เลือกแต่ละรายการ เวิร์กโฟลว์รีลีสแบบ live จะสร้างและพุชภาพนั้นหนึ่งครั้ง จากนั้นชาร์ดโมเดล live ของ Docker, Gateway ที่แยกชาร์ดตามผู้ให้บริการ, แบ็กเอนด์ CLI, การ bind ของ ACP และชาร์ดฮาร์เนส Codex จะรันด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ชาร์ด Gateway Docker มีเพดาน `timeout` ระดับสคริปต์ที่ชัดเจนต่ำกว่า timeout ของงานเวิร์กโฟลว์ เพื่อให้คอนเทนเนอร์หรือเส้นทาง cleanup ที่ค้างล้มเหลวอย่างรวดเร็วแทนที่จะใช้โควต้า release-check ทั้งหมด หากชาร์ดเหล่านั้นสร้างเป้าหมาย Docker ซอร์สเต็มใหม่อย่างอิสระ แสดงว่าการรันรีลีสถูกกำหนดค่าผิดและจะเสียเวลาตามนาฬิกาไปกับการสร้างภาพซ้ำ

## การตรวจรับแพ็กเกจ

ใช้ `Package Acceptance` เมื่อคำถามคือ “แพ็กเกจ OpenClaw ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์ได้หรือไม่” ซึ่งแตกต่างจาก CI ปกติ: CI ปกติตรวจสอบซอร์สทรี ขณะที่การตรวจรับแพ็กเกจตรวจสอบ tarball เดียวผ่านฮาร์เนส Docker E2E เดียวกับที่ผู้ใช้ใช้งานหลังติดตั้งหรืออัปเดต

### งาน

1. `resolve_package` checkout `workflow_ref`, resolve ตัวเลือกแพ็กเกจหนึ่งรายการ, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, อัปโหลดทั้งคู่เป็น artifact `package-under-test` และพิมพ์ซอร์ส, workflow ref, package ref, เวอร์ชัน, SHA-256 และ profile ในสรุปขั้นตอนของ GitHub
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` เวิร์กโฟลว์ reusable จะดาวน์โหลด artifact นั้น ตรวจสอบ inventory ของ tarball เตรียมภาพ Docker แบบ package-digest เมื่อจำเป็น และรัน Docker lane ที่เลือกกับแพ็กเกจนั้นแทนการ pack workflow checkout เมื่อ profile เลือก `docker_lanes` แบบ targeted หลายรายการ เวิร์กโฟลว์ reusable จะเตรียมแพ็กเกจและภาพที่ใช้ร่วมกันหนึ่งครั้ง แล้ว fan out lane เหล่านั้นเป็นงาน Docker แบบ targeted ที่รันขนานกันพร้อม artifact ที่ไม่ซ้ำกัน
3. `package_telegram` เรียก `NPM Telegram Beta E2E` แบบไม่บังคับ โดยจะรันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้ง artifact `package-under-test` เดียวกันเมื่อการตรวจรับแพ็กเกจ resolve ได้แล้ว; การ dispatch Telegram แบบ standalone ยังสามารถติดตั้ง npm spec ที่เผยแพร่แล้วได้
4. `summary` ทำให้เวิร์กโฟลว์ล้มเหลวหากการ resolve แพ็กเกจ, การตรวจรับ Docker หรือ Telegram lane แบบไม่บังคับล้มเหลว

### แหล่งที่มาของตัวเลือก

- `source=npm` ยอมรับเฉพาะ `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรีลีส OpenClaw แบบระบุแน่นอน เช่น `openclaw@2026.4.27-beta.2` ใช้ตัวเลือกนี้สำหรับการตรวจรับ beta/stable ที่เผยแพร่แล้ว
- `source=ref` pack branch, tag หรือ SHA คอมมิตเต็มของ `package_ref` ที่เชื่อถือได้ resolver จะ fetch branch/tag ของ OpenClaw, ตรวจสอบว่าคอมมิตที่เลือก reachable จากประวัติ branch ของ repository หรือ release tag, ติดตั้ง deps ใน worktree แบบ detached และ pack ด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` ดาวน์โหลด HTTPS `.tgz`; จำเป็นต้องมี `package_sha256`
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งรายการจาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็นตัวเลือก แต่ควรระบุสำหรับ artifact ที่แชร์ภายนอก

แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือโค้ดเวิร์กโฟลว์/ฮาร์เนสที่เชื่อถือได้ซึ่งรันการทดสอบ `package_ref` คือซอร์สคอมมิตที่ถูก pack เมื่อ `source=ref` วิธีนี้ทำให้ฮาร์เนสทดสอบปัจจุบันตรวจสอบซอร์สคอมมิตเก่าที่เชื่อถือได้โดยไม่ต้องรัน logic เวิร์กโฟลว์เก่า

### Profile ของชุดทดสอบ

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` บวก `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — ชังก์ release-path ของ Docker แบบเต็มพร้อม OpenWebUI
- `custom` — `docker_lanes` ที่แน่นอน; จำเป็นเมื่อ `suite_profile=custom`

Profile `package` ใช้ coverage Plugin แบบ offline เพื่อให้การตรวจสอบแพ็กเกจที่เผยแพร่แล้วไม่ถูกกั้นด้วยความพร้อมใช้งาน live ของ ClawHub Telegram lane แบบไม่บังคับใช้ artifact `package-under-test` ซ้ำใน `NPM Telegram Beta E2E` โดยคงเส้นทาง npm spec ที่เผยแพร่แล้วไว้สำหรับการ dispatch แบบ standalone

สำหรับนโยบายเฉพาะของการทดสอบอัปเดตและ Plugin รวมถึงคำสั่ง local, Docker lane, input ของการตรวจรับแพ็กเกจ, ค่าเริ่มต้นของรีลีส และการ triage ความล้มเหลว ดู [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)

การตรวจสอบรีลีสเรียกการตรวจรับแพ็กเกจด้วย `source=artifact`, artifact แพ็กเกจรีลีสที่เตรียมไว้, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` และ `telegram_mode=mock-openai` วิธีนี้ทำให้การพิสูจน์การ migrate แพ็กเกจ, การอัปเดต, การ cleanup dependency ของ Plugin เก่าที่ค้าง, Plugin แบบ offline, plugin-update และ Telegram อยู่บน tarball แพ็กเกจที่ resolve เดียวกัน การตรวจสอบรีลีสแบบข้าม OS ยังครอบคลุม onboarding, installer และพฤติกรรมแพลตฟอร์มเฉพาะ OS; การตรวจสอบผลิตภัณฑ์ด้านแพ็กเกจ/อัปเดตควรเริ่มจากการตรวจรับแพ็กเกจ Docker lane `published-upgrade-survivor` ตรวจสอบ baseline แพ็กเกจที่เผยแพร่แล้วหนึ่งรายการต่อการรัน ในการตรวจรับแพ็กเกจ tarball `package-under-test` ที่ resolve แล้วจะเป็นตัวเลือกเสมอ และ `published_upgrade_survivor_baseline` เลือก fallback baseline ที่เผยแพร่แล้ว โดยมีค่าเริ่มต้นเป็น `openclaw@latest`; คำสั่ง rerun ของ lane ที่ล้มเหลวจะคง baseline นั้นไว้ ตั้งค่า `published_upgrade_survivor_baselines=release-history` เพื่อขยาย lane ข้ามเมทริกซ์ประวัติที่ dedupe แล้ว: รีลีส stable ล่าสุดหกรายการ, `2026.4.23` และรีลีส stable ล่าสุดก่อน `2026-03-15` ตั้งค่า `published_upgrade_survivor_scenarios=reported-issues` เพื่อขยาย baseline เดียวกันข้าม fixture ที่มีรูปแบบตาม issue สำหรับ config Feishu, ไฟล์ bootstrap/persona ที่เก็บรักษาไว้, เส้นทาง log แบบ tilde และ root dependency ของ Plugin legacy ที่ค้าง เวิร์กโฟลว์ `Update Migration` แยกต่างหากใช้ Docker lane `update-migration` กับ `all-since-2026.4.23` และ `plugin-deps-cleanup` เมื่อคำถามคือการ cleanup อัปเดตที่เผยแพร่แล้วแบบ exhaustive ไม่ใช่ความกว้างของ CI รีลีสเต็มตามปกติ การรัน aggregate แบบ local สามารถส่ง package spec ที่แน่นอนด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, คง lane เดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` เช่น `openclaw@2026.4.15` หรือตั้งค่า `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` สำหรับเมทริกซ์ scenario ได้ lane ที่เผยแพร่แล้วกำหนดค่า baseline ด้วย recipe คำสั่ง `openclaw config set` ที่ bake ไว้ บันทึกขั้นตอน recipe ใน `summary.json` และ probe `/healthz`, `/readyz` รวมถึงสถานะ RPC หลังเริ่ม Gateway lane Windows packaged และ installer fresh ยังตรวจสอบด้วยว่าแพ็กเกจที่ติดตั้งแล้วสามารถ import การ override browser-control จากเส้นทาง Windows แบบ absolute ดิบได้ smoke agent-turn แบบข้าม OS ของ OpenAI ใช้ค่าเริ่มต้นเป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อมีการตั้งค่า ไม่เช่นนั้นใช้ `openai/gpt-5.5` เพื่อให้การพิสูจน์การติดตั้งและ Gateway อยู่บนโมเดลทดสอบ GPT-5 ที่ต้องการ

### ช่วงความเข้ากันได้ของ legacy

การตรวจรับแพ็กเกจมีช่วงความเข้ากันได้กับ legacy แบบมีขอบเขตสำหรับแพ็กเกจที่เผยแพร่ไปแล้ว แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้เส้นทางความเข้ากันได้:

- รายการ QA ส่วนตัวที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ถูกตัดออกจาก tarball;
- `doctor-switch` อาจข้ามกรณีย่อย persistence ของ `gateway install --wrapper` เมื่อแพ็กเกจไม่ได้ expose flag นั้น;
- `update-channel-switch` อาจ prune `pnpm.patchedDependencies` ที่หายไปจาก fake git fixture ที่ได้จาก tarball และอาจ log `update.channel` ที่ persist ไว้หายไป;
- smoke ของ Plugin อาจอ่านตำแหน่ง install-record แบบ legacy หรือยอมรับ persistence ของ install-record marketplace ที่หายไป;
- `plugin-update` อาจอนุญาต migration metadata ของ config ในขณะที่ยังต้องให้ install record และพฤติกรรม no-reinstall ไม่เปลี่ยนแปลง

แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ stamp metadata ของ local build ที่ถูกส่งไปแล้วได้ด้วย แพ็กเกจภายหลังต้องเป็นไปตามสัญญาสมัยใหม่; เงื่อนไขเดียวกันจะล้มเหลวแทนที่จะเตือนหรือข้าม

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

เมื่อ debug การรันการตรวจรับแพ็กเกจที่ล้มเหลว ให้เริ่มที่สรุป `resolve_package` เพื่อยืนยันแหล่งที่มาของแพ็กเกจ, เวอร์ชัน และ SHA-256 จากนั้นตรวจสอบ child run `docker_acceptance` และ artifact Docker ของมัน: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log ของ lane, phase timing และคำสั่ง rerun ควร rerun profile แพ็กเกจที่ล้มเหลวหรือ Docker lane ที่แน่นอนแทนการ rerun การตรวจสอบรีลีสเต็ม

## Smoke การติดตั้ง

เวิร์กโฟลว์ `Install Smoke` แยกต่างหากใช้ scope script เดียวกันซ้ำผ่านงาน `preflight` ของตัวเอง โดยแยก coverage smoke เป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **เส้นทางเร็ว** รันสำหรับ pull request ที่แตะพื้นผิว Docker/package, การเปลี่ยนแปลงแพ็กเกจ/manifest ของ bundled Plugin หรือพื้นผิว core plugin/channel/gateway/Plugin SDK ที่งาน Docker smoke ใช้งาน การเปลี่ยนแปลง bundled Plugin เฉพาะซอร์ส, การแก้ไขเฉพาะทดสอบ และการแก้ไขเฉพาะเอกสารไม่จอง Docker worker เส้นทางเร็วสร้างภาพ root Dockerfile หนึ่งครั้ง ตรวจสอบ CLI, รัน smoke CLI ลบ agents delete shared-workspace, รัน container gateway-network e2e, ตรวจสอบ build arg ของ bundled extension และรัน profile Docker ของ bundled-plugin แบบมีขอบเขตภายใต้ timeout คำสั่ง aggregate 240 วินาที (Docker run ของแต่ละ scenario มีเพดานแยกต่างหาก)
- **เส้นทางเต็ม** คงการติดตั้งแพ็กเกจ QR และ coverage Docker/update ของ installer สำหรับการรันตามกำหนดการรายคืน, manual dispatch, release check แบบ workflow-call และ pull request ที่แตะพื้นผิว installer/package/Docker จริง ๆ ในโหมดเต็ม install-smoke จะเตรียมหรือใช้ภาพ smoke root Dockerfile ของ GHCR สำหรับ target-SHA หนึ่งภาพซ้ำ จากนั้นรันการติดตั้งแพ็กเกจ QR, smoke root Dockerfile/gateway, smoke installer/update และ Docker E2E ของ bundled-plugin แบบเร็วเป็นงานแยกกัน เพื่อให้งาน installer ไม่ต้องรอหลัง smoke ของ root image

การ push ไปยัง `main` (รวมถึง merge commit) ไม่บังคับใช้เส้นทางเต็ม; เมื่อตรรกะ changed-scope จะขอ coverage เต็มในการ push เวิร์กโฟลว์จะคง Docker smoke แบบเร็วไว้ และปล่อย smoke การติดตั้งแบบเต็มให้การตรวจสอบรายคืนหรือรีลีส

Smoke image-provider ของการติดตั้ง Bun global แบบช้าถูก gate แยกด้วย `run_bun_global_install_smoke` โดยรันในกำหนดการรายคืนและจากเวิร์กโฟลว์ release checks และ manual dispatch ของ `Install Smoke` สามารถเลือกเข้าใช้งานได้ แต่ pull request และการ push ไปยัง `main` ไม่รัน การทดสอบ Docker ของ QR และ installer คง Dockerfile ที่เน้นการติดตั้งของตัวเองไว้

## Docker E2E แบบ local

`pnpm test:docker:all` prebuild ภาพ live-test ที่ใช้ร่วมกันหนึ่งภาพ, pack OpenClaw หนึ่งครั้งเป็น npm tarball และสร้างภาพ `scripts/e2e/Dockerfile` ที่ใช้ร่วมกันสองภาพ:

- runner Node/Git เปล่าสำหรับ lane installer/update/plugin-dependency;
- ภาพ functional ที่ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lane ฟังก์ชันการทำงานปกติ

คำจำกัดความของ Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, ตรรกะของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs` และ runner จะดำเนินการเฉพาะแผนที่เลือกไว้เท่านั้น scheduler เลือก image ต่อ lane ด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` จากนั้นรัน lane ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### ค่าที่ปรับแต่งได้

| ตัวแปร                                | ค่าเริ่มต้น | วัตถุประสงค์                                                                                 |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | จำนวน slot ของ main-pool สำหรับ lane ปกติ                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | จำนวน slot ของ tail-pool ที่อ่อนไหวต่อ provider                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | เพดาน lane แบบ live ที่ทำงานพร้อมกัน เพื่อไม่ให้ provider throttle                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | เพดาน lane ติดตั้ง npm ที่ทำงานพร้อมกัน                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | เพดาน lane แบบ multi-service ที่ทำงานพร้อมกัน                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | หน่วงเวลาระหว่างการเริ่ม lane เพื่อหลีกเลี่ยงการสร้างงานจำนวนมากใน Docker daemon; ตั้งเป็น `0` หากไม่ต้องการหน่วง |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout สำรองต่อ lane (120 นาที); lane แบบ live/tail ที่เลือกไว้ใช้เพดานที่เข้มงวดกว่า       |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | ไม่ได้ตั้งค่า | `1` พิมพ์แผนของ scheduler โดยไม่รัน lane                                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | ไม่ได้ตั้งค่า | รายการ lane แบบตรงตัวคั่นด้วย comma; ข้าม cleanup smoke เพื่อให้ agent ทำซ้ำ lane ที่ล้มเหลวหนึ่งรายการได้ |

lane ที่หนักกว่าเพดานที่มีผลของตัวเองยังสามารถเริ่มจาก pool ว่างได้ จากนั้นจะรันเพียงลำพังจนกว่าจะคืนความจุ aggregate ในเครื่องจะทำ preflight Docker, ลบ container OpenClaw E2E ที่ค้างอยู่, ส่งออกสถานะ lane ที่กำลังทำงาน, เก็บ timing ของ lane เพื่อจัดลำดับ longest-first และตามค่าเริ่มต้นจะหยุด schedule lane ใหม่ใน pooled lanes หลังจากเกิดความล้มเหลวครั้งแรก

### Workflow live/E2E ที่ใช้ซ้ำได้

workflow live/E2E ที่ใช้ซ้ำได้จะถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องใช้ package, ชนิด image, live image, lane และความครอบคลุมของ credential ใดบ้าง จากนั้น `scripts/docker-e2e.mjs` จะแปลงแผนนั้นเป็น GitHub outputs และ summaries โดยจะ pack OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลด package artifact ของ run ปัจจุบัน หรือดาวน์โหลด package artifact จาก `package_artifact_run_id`; ตรวจสอบ tarball inventory; build และ push image GHCR Docker E2E แบบ bare/functional ที่ติด tag ด้วย package digest ผ่าน Docker layer cache ของ Blacksmith เมื่อแผนต้องการ lane ที่ติดตั้งจาก package; และใช้ input `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรือ image ตาม package digest ที่มีอยู่แทนการ rebuild การ pull Docker image จะ retry พร้อม timeout ต่อครั้งแบบจำกัดที่ 180 วินาที เพื่อให้ stream จาก registry/cache ที่ค้าง retry ได้เร็วแทนที่จะใช้เวลาส่วนใหญ่ของ critical path ใน CI

### ชุดย่อยของ release path

ความครอบคลุม Docker สำหรับ release จะรัน job แบบ chunk ที่เล็กลงด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละ chunk pull เฉพาะชนิด image ที่ต้องใช้และดำเนินการหลาย lane ผ่าน weighted scheduler เดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

chunk Docker สำหรับ release ปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` และ `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` ส่วน `plugins-runtime-core`, `plugins-runtime` และ `plugins-integrations` ยังคงเป็น alias รวมของ Plugin/runtime alias ของ lane `install-e2e` ยังคงเป็น alias rerun แบบ manual รวมสำหรับ lane installer ของ provider ทั้งสองรายการ

OpenWebUI จะถูกรวมเข้าไปใน `plugins-runtime-services` เมื่อความครอบคลุม release-path แบบเต็มร้องขอ และจะเก็บ chunk `openwebui` แบบ standalone ไว้เฉพาะ dispatch ที่เป็น OpenWebUI-only เท่านั้น lane อัปเดต bundled-channel จะ retry หนึ่งครั้งสำหรับความล้มเหลวของเครือข่าย npm แบบชั่วคราว

แต่ละ chunk จะอัปโหลด `.artifacts/docker-tests/` พร้อม log ของ lane, timing, `summary.json`, `failures.json`, timing ของ phase, JSON แผนของ scheduler, ตาราง slow-lane และคำสั่ง rerun ต่อ lane input `docker_lanes` ของ workflow จะรัน lane ที่เลือกกับ image ที่เตรียมไว้แทน chunk jobs ซึ่งทำให้การ debug lane ที่ล้มเหลวจำกัดอยู่ใน Docker job เป้าหมายหนึ่งรายการ และเตรียม ดาวน์โหลด หรือใช้ package artifact ซ้ำสำหรับ run นั้น; หาก lane ที่เลือกเป็น live Docker lane job เป้าหมายจะ build live-test image ในเครื่องสำหรับ rerun นั้น คำสั่ง rerun ต่อ lane ของ GitHub ที่สร้างขึ้นจะรวม `package_artifact_run_id`, `package_artifact_name` และ input image ที่เตรียมไว้เมื่อมีค่าเหล่านั้นอยู่ เพื่อให้ lane ที่ล้มเหลวสามารถใช้ package และ image ชุดเดียวกันจาก run ที่ล้มเหลวซ้ำได้

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

workflow live/E2E ตาม schedule จะรันชุด Docker release-path แบบเต็มทุกวัน

## Plugin Prerelease

`Plugin Prerelease` เป็นความครอบคลุม product/package ที่มีค่าใช้จ่ายสูงกว่า จึงเป็น workflow แยกต่างหากที่ถูก dispatch โดย `Full Release Validation` หรือโดย operator ที่ระบุอย่างชัดเจน pull request ปกติ, การ push ไปที่ `main` และ manual CI dispatch แบบ standalone จะไม่เปิดใช้ชุดนี้ workflow นี้กระจาย test ของ bundled Plugin ข้าม worker ของ extension แปดตัว; job shard ของ extension เหล่านั้นรันกลุ่ม config ของ Plugin ได้พร้อมกันสูงสุดสองกลุ่ม โดยใช้ Vitest worker หนึ่งตัวต่อกลุ่มและ Node heap ที่ใหญ่ขึ้น เพื่อให้ batch ของ Plugin ที่ import หนักไม่สร้าง CI job เพิ่ม path prerelease Docker เฉพาะ release จะ batch lane Docker เป้าหมายเป็นกลุ่มเล็ก ๆ เพื่อหลีกเลี่ยงการจอง runner หลายสิบตัวสำหรับ job ที่ใช้เวลาหนึ่งถึงสามนาที

## QA Lab

QA Lab มี lane CI เฉพาะอยู่นอก workflow หลักที่ scope อย่างชาญฉลาด

- workflow `Parity gate` จะรันเมื่อมีการเปลี่ยนแปลง PR ที่ตรงกันและจาก manual dispatch; workflow นี้ build QA runtime ส่วนตัวและเปรียบเทียบ pack แบบ agentic ของ mock GPT-5.5 และ Opus 4.6
- workflow `QA-Lab - All Lanes` จะรันทุกคืนบน `main` และจาก manual dispatch; workflow นี้ fan out mock parity gate, live Matrix lane และ live Telegram กับ Discord lanes เป็น parallel jobs job แบบ live ใช้ environment `qa-live-shared` และ Telegram/Discord ใช้ Convex leases

release checks รัน Matrix และ Telegram live transport lanes ด้วย deterministic mock provider และ model ที่ผ่าน mock (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อแยก contract ของ channel ออกจาก latency ของ live model และการเริ่มต้น provider-Plugin ตามปกติ live transport Gateway ปิด memory search เพราะ QA parity ครอบคลุมพฤติกรรม memory แยกต่างหาก; การเชื่อมต่อ provider ถูกครอบคลุมโดยชุด live model, native provider และ Docker provider แยกต่างหาก

Matrix ใช้ `--profile fast` สำหรับ gate ตาม schedule และ release โดยเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout มารองรับ ค่าเริ่มต้นของ CLI และ input ของ manual workflow ยังคงเป็น `all`; dispatch แบบ manual ที่มี `matrix_profile=all` จะ shard ความครอบคลุม Matrix แบบเต็มเป็น job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรัน lane QA Lab ที่สำคัญต่อ release ก่อนอนุมัติ release ด้วย; QA parity gate ของ workflow นี้รัน pack candidate และ baseline เป็น parallel lane jobs จากนั้นดาวน์โหลด artifact ทั้งสองเข้าไปใน report job ขนาดเล็กสำหรับการเปรียบเทียบ parity ขั้นสุดท้าย

อย่านำ path การ land PR ไปอยู่หลัง `Parity gate` เว้นแต่ว่าการเปลี่ยนแปลงนั้นแตะ QA runtime, model-pack parity หรือ surface ที่ parity workflow เป็นเจ้าของจริง ๆ สำหรับการแก้ไข channel, config, docs หรือ unit-test ตามปกติ ให้ถือว่าเป็นสัญญาณเสริมและทำตามหลักฐาน CI/check ตาม scope แทน

## CodeQL

workflow `CodeQL` ตั้งใจให้เป็น scanner ความปลอดภัยรอบแรกที่มีขอบเขตแคบ ไม่ใช่ sweep ทั้ง repository การรันแบบรายวัน manual และ guard ของ pull request ที่ไม่ใช่ draft จะ scan โค้ด Actions workflow รวมถึง surface JavaScript/TypeScript ที่มีความเสี่ยงสูงสุด ด้วย query ความปลอดภัยที่มีความมั่นใจสูงและกรองเป็น `security-severity` ระดับ high/critical

guard ของ pull request ยังคงเบา: จะเริ่มเฉพาะเมื่อมีการเปลี่ยนแปลงภายใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` หรือ `src` และรัน matrix ความปลอดภัยแบบ high-confidence เดียวกับ workflow ตาม schedule Android และ macOS CodeQL จะไม่อยู่ในค่าเริ่มต้นของ PR

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                          | Surface                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron และ gateway baseline                                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | contract การ implement channel หลัก รวมถึง channel Plugin runtime, Gateway, Plugin SDK, secrets และ audit touchpoints              |
| `/codeql-security-high/network-ssrf-boundary`     | surface ของ SSRF หลัก, การ parse IP, network guard, web-fetch และนโยบาย SSRF ของ Plugin SDK                                        |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, helper การ execute process, outbound delivery และ gate การ execute tool ของ agent                                      |
| `/codeql-security-high/plugin-trust-boundary`     | surface ความเชื่อถือของการติดตั้ง Plugin, loader, manifest, registry, การติดตั้ง package-manager, source-loading และ contract package ของ Plugin SDK |

### shard ความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — shard ความปลอดภัย Android ตาม schedule build Android app แบบ manual สำหรับ CodeQL บน Blacksmith Linux runner ที่เล็กที่สุดซึ่ง workflow sanity ยอมรับ อัปโหลดภายใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — shard ความปลอดภัย macOS รายสัปดาห์/manual build macOS app แบบ manual สำหรับ CodeQL บน Blacksmith macOS, กรองผล build ของ dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดภายใต้ `/codeql-critical-security/macos` เก็บไว้นอกค่าเริ่มต้นรายวันเพราะ macOS build ใช้เวลา runtime มากแม้เมื่อสะอาด

### หมวดหมู่ Critical Quality

`CodeQL Critical Quality` คือ shard ที่ตรงกันในด้านที่ไม่ใช่ความปลอดภัย โดยรันเฉพาะ query คุณภาพ JavaScript/TypeScript ที่ไม่ใช่ความปลอดภัยระดับ error-severity บน surface แคบที่มีมูลค่าสูงบน Blacksmith Linux runner ขนาดเล็กกว่า guard ของ pull request ตั้งใจให้เล็กกว่า profile ตาม schedule: PR ที่ไม่ใช่ draft จะรันเฉพาะ shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` ที่ตรงกัน สำหรับการเปลี่ยนแปลงโค้ดการ execute command/model/tool ของ agent และ reply dispatch, โค้ด config schema/migration/IO, โค้ด auth/secrets/sandbox/security, runtime ของ core channel และ bundled channel Plugin, protocol/server-method ของ Gateway, runtime memory/SDK glue, MCP/process/outbound delivery, runtime provider/model catalog, session diagnostics/delivery queues, Plugin loader, contract Plugin SDK/package หรือ reply runtime ของ Plugin SDK การเปลี่ยนแปลง config ของ CodeQL และ workflow คุณภาพจะรัน shard คุณภาพของ PR ทั้งสิบสองรายการ

manual dispatch รับ:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

โปรไฟล์แบบแคบเป็นฮุกสำหรับการสอน/การวนปรับปรุงเพื่อรันชาร์ดคุณภาพหนึ่งรายการแบบแยกเดี่ยว

| หมวดหมู่                                                | พื้นผิว                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ดขอบเขตความปลอดภัยของการยืนยันตัวตน ความลับ แซนด์บ็อกซ์ Cron และ Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | สัญญาของสคีมา config การย้ายข้อมูล การทำให้เป็นมาตรฐาน และ IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | สคีมาโปรโตคอล Gateway และสัญญาเมธอดของเซิร์ฟเวอร์                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญาการนำไปใช้ของช่องหลักและ Plugin ช่องที่บันเดิลมา                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | สัญญารันไทม์ของการประมวลผลคำสั่ง การ dispatch โมเดล/ผู้ให้บริการ การ dispatch และคิวตอบกลับอัตโนมัติ และ control plane ของ ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | สัญญาของเซิร์ฟเวอร์ MCP และบริดจ์เครื่องมือ ตัวช่วยกำกับดูแลกระบวนการ และการส่งออก                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, facade รันไทม์หน่วยความจำ alias ของ memory Plugin SDK, glue สำหรับเปิดใช้งานรันไทม์หน่วยความจำ และคำสั่ง doctor ของหน่วยความจำ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | กลไกภายในของคิวตอบกลับ คิวส่งมอบเซสชัน ตัวช่วยผูก/ส่งมอบเซสชันขาออก พื้นผิวชุด event/log วินิจฉัย และสัญญา CLI ของ session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | การ dispatch คำตอบขาเข้าของ Plugin SDK, ตัวช่วย payload/chunking/runtime ของคำตอบ ตัวเลือกคำตอบของช่อง คิวส่งมอบ และตัวช่วยผูกเซสชัน/เธรด             |
| `/codeql-critical-quality/provider-runtime-boundary`    | การทำแค็ตตาล็อกโมเดลให้เป็นมาตรฐาน การยืนยันตัวตนและการค้นพบผู้ให้บริการ การลงทะเบียนรันไทม์ผู้ให้บริการ ค่าเริ่มต้น/แค็ตตาล็อกของผู้ให้บริการ และรีจิสทรี web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | การบูต Control UI การคงข้อมูลในเครื่อง flow ควบคุม Gateway และสัญญารันไทม์ของ control plane งาน                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | สัญญารันไทม์ของ web fetch/search หลัก, media IO, การทำความเข้าใจสื่อ, image-generation และ media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | สัญญาของ loader, registry, public-surface และ entrypoint ของ Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | ซอร์ส Plugin SDK ฝั่งแพ็กเกจที่เผยแพร่แล้ว และตัวช่วยสัญญาแพ็กเกจ Plugin                                                                                      |

คุณภาพยังคงแยกจากความปลอดภัย เพื่อให้สามารถจัดกำหนดการ วัดผล ปิดใช้งาน หรือขยายรายการตรวจพบด้านคุณภาพได้โดยไม่บดบังสัญญาณด้านความปลอดภัย ควรเพิ่มการขยาย CodeQL สำหรับ Swift, Python และ bundled-plugin กลับเข้ามาเป็นงานติดตามผลแบบกำหนดขอบเขตหรือแบ่งชาร์ดเท่านั้น หลังจากโปรไฟล์แบบแคบมีรันไทม์และสัญญาณที่เสถียรแล้ว

## เวิร์กโฟลว์การบำรุงรักษา

### Docs Agent

เวิร์กโฟลว์ `Docs Agent` เป็น lane บำรุงรักษา Codex แบบขับเคลื่อนด้วย event สำหรับทำให้เอกสารที่มีอยู่สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง land แล้ว ไม่มีตารางเวลาล้วน: การรัน CI จาก push ที่สำเร็จและไม่ใช่บอตบน `main` สามารถ trigger ได้ และการ dispatch ด้วยตนเองสามารถรันได้โดยตรง การเรียกผ่าน workflow-run จะข้ามเมื่อ `main` เคลื่อนไปแล้ว หรือเมื่อมีการสร้าง Docs Agent run อื่นที่ไม่ถูกข้ามภายในชั่วโมงที่ผ่านมา เมื่อรันแล้ว จะตรวจทานช่วง commit ตั้งแต่ source SHA ของ Docs Agent ที่ไม่ถูกข้ามครั้งก่อนหน้าไปจนถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงหนึ่งครั้งจึงครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมมาตั้งแต่รอบเอกสารครั้งล่าสุดได้

### Test Performance Agent

เวิร์กโฟลว์ `Test Performance Agent` เป็น lane บำรุงรักษา Codex แบบขับเคลื่อนด้วย event สำหรับเทสต์ที่ช้า ไม่มีตารางเวลาล้วน: การรัน CI จาก push ที่สำเร็จและไม่ใช่บอตบน `main` สามารถ trigger ได้ แต่จะข้ามถ้ามีการเรียกผ่าน workflow-run อื่นที่รันไปแล้วหรือกำลังรันอยู่ในวัน UTC นั้น การ dispatch ด้วยตนเองจะข้าม gate กิจกรรมรายวันนี้ lane นี้สร้างรายงานประสิทธิภาพ Vitest แบบจัดกลุ่มทั้งชุด ให้ Codex แก้ประสิทธิภาพเทสต์ได้เฉพาะการแก้เล็กที่ยังคง coverage แทนการ refactor กว้าง จากนั้นรันรายงานทั้งชุดอีกครั้งและปฏิเสธการเปลี่ยนแปลงที่ลดจำนวนเทสต์ baseline ที่ผ่าน ถ้า baseline มีเทสต์ที่ล้มเหลว Codex อาจแก้ได้เฉพาะความล้มเหลวที่ชัดเจน และรายงานทั้งชุดหลัง agent ต้องผ่านก่อน commit ใดๆ เมื่อ `main` เดินหน้าก่อนที่ bot push จะ land, lane จะ rebase แพตช์ที่ผ่านการตรวจสอบแล้ว รัน `pnpm check:changed` อีกครั้ง และลอง push ซ้ำ ส่วนแพตช์เก่าที่ conflict จะถูกข้าม ใช้ Ubuntu ที่โฮสต์โดย GitHub เพื่อให้ Codex action คงท่าทีความปลอดภัยแบบ drop-sudo เดียวกับ docs agent ได้

### PR ซ้ำหลัง Merge

เวิร์กโฟลว์ `Duplicate PRs After Merge` เป็นเวิร์กโฟลว์ผู้ดูแลแบบ manual สำหรับทำความสะอาดรายการซ้ำหลัง land ค่าเริ่มต้นเป็นโหมดทดลองรัน และจะปิดเฉพาะ PR ที่ระบุชัดเจนเมื่อ `apply=true` ก่อนแก้ไข GitHub จะตรวจยืนยันว่า PR ที่ land แล้วถูก merge แล้ว และ PR ซ้ำแต่ละรายการมี issue อ้างอิงร่วมกันหรือมี hunk ที่เปลี่ยนแปลงทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate ตรวจสอบในเครื่องและการกำหนดเส้นทางตามการเปลี่ยนแปลง

ลอจิก changed-lane ในเครื่องอยู่ใน `scripts/changed-lanes.mjs` และถูกเรียกใช้โดย `scripts/check-changed.mjs` gate ตรวจสอบในเครื่องนั้นเข้มงวดเรื่องขอบเขตสถาปัตยกรรมมากกว่าขอบเขตแพลตฟอร์ม CI แบบกว้าง:

- การเปลี่ยนแปลง production หลักจะรัน typecheck ของ core prod และ core test พร้อม core lint/guards;
- การเปลี่ยนแปลงเฉพาะเทสต์หลักจะรันเฉพาะ typecheck ของ core test พร้อม core lint;
- การเปลี่ยนแปลง production ของส่วนขยายจะรัน typecheck ของ extension prod และ extension test พร้อม extension lint;
- การเปลี่ยนแปลงเฉพาะเทสต์ของส่วนขยายจะรัน typecheck ของ extension test พร้อม extension lint;
- การเปลี่ยนแปลง Plugin SDK สาธารณะหรือสัญญา plugin จะขยายไปยัง typecheck ของส่วนขยาย เพราะส่วนขยายพึ่งพาสัญญาหลักเหล่านั้น (การ sweep ส่วนขยายด้วย Vitest ยังคงเป็นงานทดสอบที่ต้องระบุชัดเจน);
- การ bump เวอร์ชันเฉพาะ metadata ของ release จะรันการตรวจ version/config/root-dependency แบบกำหนดเป้าหมาย;
- การเปลี่ยนแปลง root/config ที่ไม่รู้จักจะ fail safe ไปยัง check lane ทั้งหมด

การกำหนดเส้นทาง changed-test ในเครื่องอยู่ใน `scripts/test-projects.test-support.mjs` และตั้งใจให้ถูกกว่า `check:changed`: การแก้เทสต์โดยตรงจะรันตัวเอง การแก้ซอร์สจะให้ความสำคัญกับ mapping ที่ชัดเจน จากนั้นจึงเป็นเทสต์ sibling และ dependent ใน import graph config การส่งมอบ group-room ที่ใช้ร่วมกันเป็นหนึ่งใน mapping ที่ชัดเจน: การเปลี่ยนแปลง config visible-reply ของกลุ่ม โหมดส่งมอบ source reply หรือพรอมป์ระบบของ message-tool จะถูก route ผ่านเทสต์ core reply รวมถึง regression การส่งมอบของ Discord และ Slack เพื่อให้การเปลี่ยนค่าเริ่มต้นที่ใช้ร่วมกันล้มเหลวก่อน push PR ครั้งแรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างถึงระดับ harness จนชุด mapped ราคาถูกไม่ใช่ proxy ที่น่าเชื่อถือ

## การตรวจสอบด้วย Testbox

รัน Testbox จาก root ของ repo และควรใช้กล่อง warmed ใหม่สำหรับหลักฐานแบบกว้าง ก่อนใช้ gate ที่ช้ากับกล่องที่ถูกใช้ซ้ำ หมดอายุ หรือเพิ่งรายงาน sync ที่ใหญ่ผิดคาด ให้รัน `pnpm testbox:sanity` ภายในกล่องก่อน

การตรวจ sanity จะ fail fast เมื่อไฟล์ root ที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short` แสดงการลบไฟล์ tracked อย่างน้อย 200 รายการ โดยปกติหมายความว่าสถานะ sync ระยะไกลไม่ใช่สำเนา PR ที่เชื่อถือได้ ให้หยุดกล่องนั้นและ warm กล่องใหม่แทนการ debug ความล้มเหลวของเทสต์ผลิตภัณฑ์ สำหรับ PR ที่ตั้งใจลบจำนวนมาก ให้ตั้ง `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับการรัน sanity นั้น

`pnpm testbox:run` ยังจะยุติการเรียก Blacksmith CLI ในเครื่องที่ค้างอยู่ในเฟส sync เกินห้านาทีโดยไม่มีเอาต์พุตหลัง sync ตั้ง `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` เพื่อปิด guard นั้น หรือใช้ค่ามิลลิวินาทีที่ใหญ่ขึ้นสำหรับ diff ในเครื่องที่ใหญ่ผิดปกติ

Crabbox เป็นเส้นทาง remote-box ที่สองซึ่ง repo เป็นเจ้าของสำหรับหลักฐาน Linux เมื่อ Blacksmith ไม่พร้อมใช้งาน หรือเมื่อควรใช้ capacity บน cloud ที่เป็นของโครงการมากกว่า Warm กล่อง hydrate ผ่าน project workflow จากนั้นรันคำสั่งผ่าน Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` เป็นเจ้าของค่าเริ่มต้นของ provider, sync และการ hydrate ผ่าน GitHub Actions โดย exclude `.git` ในเครื่อง เพื่อให้ checkout ของ Actions ที่ hydrate แล้วคง metadata Git ระยะไกลของตัวเองแทนการ sync remote และ object store ในเครื่องของผู้ดูแล และ exclude artifact รันไทม์/บิลด์ในเครื่องที่ไม่ควรถูกถ่ายโอน `.github/workflows/crabbox-hydrate.yml` เป็นเจ้าของ checkout, การตั้งค่า Node/pnpm, การ fetch `origin/main` และการส่งต่อ environment ที่ไม่ใช่ secret ซึ่งคำสั่ง `crabbox run --id <cbx_id>` ในภายหลังจะ source

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
