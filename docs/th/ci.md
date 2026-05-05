---
read_when:
    - คุณต้องเข้าใจว่าเหตุใดงาน CI จึงทำงานหรือไม่ทำงาน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการรันหรือการรันซ้ำเพื่อยืนยันความถูกต้องของรีลีส
    - คุณกำลังเปลี่ยนการส่งงานของ ClawSweeper หรือการส่งต่อกิจกรรมของ GitHub
summary: กราฟงาน CI, เกตตามขอบเขต, ชุดครอบการเผยแพร่รุ่น และคำสั่งภายในเครื่องที่เทียบเท่า
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-05-05T06:16:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 31fe6704e18f9efc519a1a73fc3aa8ae3909d6a27553874eb477e73979a94af2
    source_path: ci.md
    workflow: 16
---

OpenClaw CI ทำงานทุกครั้งที่ push ไปยัง `main` และทุก pull request งาน `preflight` จะจำแนก diff และปิด lane ที่มีค่าใช้จ่ายสูงเมื่อมีการเปลี่ยนเฉพาะพื้นที่ที่ไม่เกี่ยวข้อง การรัน `workflow_dispatch` แบบ manual ตั้งใจให้ข้ามการกำหนดขอบเขตแบบ smart และกระจายงานไปยังกราฟทั้งหมดสำหรับ release candidate และการตรวจสอบแบบกว้าง lane ของ Android ยังคงเป็นแบบ opt-in ผ่าน `include_android` การครอบคลุม Plugin สำหรับ release เท่านั้นอยู่ใน workflow [`Plugin Prerelease`](#plugin-prerelease) แยกต่างหาก และจะรันจาก [`Full Release Validation`](#full-release-validation) หรือการ dispatch แบบ manual ที่ระบุชัดเจนเท่านั้น

## ภาพรวม Pipeline

| งาน                              | วัตถุประสงค์                                                                                                   | เมื่อรัน                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | ตรวจจับการเปลี่ยนแปลงเฉพาะ docs, ขอบเขตที่เปลี่ยน, extension ที่เปลี่ยน และสร้าง manifest ของ CI                   | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-scm-fast`              | ตรวจจับ private key และตรวจสอบ workflow ผ่าน `zizmor`                                                     | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-dependency-audit`      | ตรวจสอบ production lockfile แบบไม่ต้องใช้ dependency เทียบกับ npm advisories                                          | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-fast`                  | aggregate ที่จำเป็นสำหรับงาน security แบบเร็ว                                                             | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `check-dependencies`             | production Knip pass เฉพาะ dependency พร้อมตัวป้องกัน allowlist ของไฟล์ที่ไม่ได้ใช้                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-artifacts`                | build `dist/`, Control UI, การตรวจสอบ built-artifact และ artifact downstream ที่ใช้ซ้ำได้                       | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-core`               | lane ความถูกต้องบน Linux แบบเร็ว เช่น การตรวจสอบ bundled/plugin-contract/protocol                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-contracts-channels` | ตรวจสอบ contract ของ channel แบบ shard พร้อมผล aggregate check ที่เสถียร                                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-core-test`          | shard การทดสอบ Core Node โดยไม่รวม channel, bundled, contract และ lane ของ extension                          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check`                          | เทียบเท่า main local gate แบบ shard: prod types, lint, guards, test types และ strict smoke                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check-additional`               | architecture, boundary/prompt drift แบบ shard, extension guards, package boundary และ gateway watch        | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-smoke`                    | การทดสอบ smoke ของ built-CLI และ smoke ของ startup-memory                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks`                         | verifier สำหรับการทดสอบ channel ของ built-artifact                                                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-compat-node22`      | lane build และ smoke สำหรับความเข้ากันได้กับ Node 22                                                                | manual CI dispatch สำหรับ releases    |
| `check-docs`                     | ตรวจสอบการจัดรูปแบบ docs, lint และลิงก์เสีย                                                             | docs เปลี่ยน                       |
| `skills-python`                  | Ruff + pytest สำหรับ Skills ที่ใช้ Python เป็นฐาน                                                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python-skill      |
| `checks-windows`                 | การทดสอบเฉพาะ Windows สำหรับ process/path พร้อม regression ของ runtime import specifier ที่ใช้ร่วมกัน                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows           |
| `macos-node`                     | lane การทดสอบ TypeScript บน macOS โดยใช้งาน built artifacts ร่วมกัน                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `macos-swift`                    | Swift lint, build และการทดสอบสำหรับแอป macOS                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `android`                        | การทดสอบ unit ของ Android สำหรับทั้งสอง flavor พร้อมการ build debug APK หนึ่งรายการ                                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android           |
| `test-performance-agent`         | การปรับปรุง slow-test รายวันด้วย Codex หลังมีกิจกรรมที่เชื่อถือได้                                                 | Main CI สำเร็จหรือ manual dispatch |
| `openclaw-performance`           | รายงานประสิทธิภาพ runtime ของ Kova แบบรายวัน/ตามสั่ง พร้อม lane mock-provider, deep-profile และ GPT 5.4 live | ตาม schedule และ manual dispatch      |

## ลำดับ Fail-fast

1. `preflight` ตัดสินว่า lane ใดมีอยู่บ้างตั้งแต่ต้น ตรรกะ `docs-scope` และ `changed-scope` เป็นขั้นตอนภายในงานนี้ ไม่ใช่งานแยกต่างหาก
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` ล้มเหลวได้เร็วโดยไม่ต้องรอ artifact และงาน matrix ของแพลตฟอร์มที่หนักกว่า
3. `build-artifacts` ทำงานทับซ้อนกับ lane Linux แบบเร็วเพื่อให้ downstream consumer เริ่มได้ทันทีที่ shared build พร้อม
4. lane แพลตฟอร์มและ runtime ที่หนักกว่าจะกระจายงานต่อจากนั้น: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่เป็น `cancelled` เมื่อมี push ใหม่กว่าลงบน PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่านี่เป็นสัญญาณรบกวนของ CI เว้นแต่ run ล่าสุดสำหรับ ref เดียวกันจะล้มเหลวด้วย aggregate shard checks ใช้ `!cancelled() && always()` เพื่อให้ยังรายงาน shard failure ปกติ แต่ไม่ queue หลังจาก workflow ทั้งหมดถูกแทนที่ไปแล้ว concurrency key อัตโนมัติของ CI มีเวอร์ชัน (`CI-v7-*`) เพื่อให้ zombie ฝั่ง GitHub ใน queue group เก่าไม่สามารถบล็อก run ของ main ที่ใหม่กว่าได้ไม่มีกำหนด การรัน full-suite แบบ manual ใช้ `CI-manual-v1-*` และไม่ยกเลิก run ที่กำลังดำเนินอยู่

## ขอบเขตและการ routing

ตรรกะขอบเขตอยู่ใน `scripts/ci-changed-scope.mjs` และครอบคลุมด้วย unit tests ใน `src/scripts/ci-changed-scope.test.ts` manual dispatch จะข้ามการตรวจจับ changed-scope และทำให้ preflight manifest ทำงานเหมือนทุกพื้นที่ที่กำหนดขอบเขตไว้มีการเปลี่ยนแปลง

- **การแก้ไข CI workflow** ตรวจสอบกราฟ Node CI พร้อม workflow linting แต่ไม่ได้บังคับให้ Windows, Android หรือ macOS native builds ทำงานเองโดยลำพัง lane ของแพลตฟอร์มเหล่านั้นยังคงถูกกำหนดขอบเขตตามการเปลี่ยนแปลง source ของแพลตฟอร์ม
- **การแก้ไขเฉพาะ CI routing, การแก้ไข fixture ของ core-test ราคาถูกบางรายการ และการแก้ไข helper/test-routing ของ plugin contract แบบแคบ** ใช้เส้นทาง manifest แบบ Node-only ที่เร็ว: `preflight`, security และ task `checks-fast-core` เพียงหนึ่งรายการ เส้นทางนั้นจะข้าม build artifacts, ความเข้ากันได้กับ Node 22, channel contracts, core shards เต็มรูปแบบ, bundled-plugin shards และ additional guard matrices เมื่อการเปลี่ยนแปลงจำกัดอยู่ที่ routing หรือ helper surfaces ที่ task แบบเร็วทดสอบโดยตรง
- **Windows Node checks** ถูกกำหนดขอบเขตไว้ที่ wrapper เฉพาะ Windows สำหรับ process/path, helper ของ npm/pnpm/UI runner, config ของ package manager และพื้นผิว CI workflow ที่รัน lane นั้น การเปลี่ยนแปลง source, Plugin, install-smoke และ test-only ที่ไม่เกี่ยวข้องจะยังอยู่บน lane Linux Node

กลุ่มการทดสอบ Node ที่ช้าที่สุดถูกแยกหรือถ่วงสมดุลเพื่อให้งานแต่ละงานเล็กโดยไม่จอง runner เกินจำเป็น: channel contracts รันเป็นสาม shard แบบถ่วงน้ำหนัก, lane core unit fast/support รันแยกกัน, core runtime infra ถูกแยกระหว่าง shard state และ process/config, auto-reply รันเป็น worker ที่สมดุล (โดยแยก subtree ของ reply เป็น shard agent-runner, dispatch และ commands/state-routing) และ config ของ agentic gateway/server ถูกแยกข้าม lane chat/auth/model/http-plugin/runtime/startup แทนที่จะรอ built artifacts การทดสอบ browser, QA, media และ Plugin เบ็ดเตล็ดแบบกว้างใช้ config Vitest เฉพาะของตนแทน shared plugin catch-all shard แบบ include-pattern บันทึกรายการ timing โดยใช้ชื่อ CI shard เพื่อให้ `.artifacts/vitest-shard-timings.json` แยกทั้ง config ออกจาก shard ที่ถูกกรองได้ `check-additional` เก็บงาน compile/canary ของ package-boundary ไว้ด้วยกัน และแยก runtime topology architecture ออกจาก coverage ของ gateway watch; รายการ boundary guard ถูกกระจายเป็นแถบข้าม matrix shard สี่รายการ โดยแต่ละ shard รัน guard อิสระที่เลือกไว้พร้อมกันและพิมพ์ timing ต่อ check รวมถึง `pnpm prompt:snapshots:check` เพื่อให้ prompt drift ของ happy path ใน Codex runtime ถูกตรึงกับ PR ที่ทำให้เกิดขึ้น Gateway watch, channel tests และ shard core support-boundary รันพร้อมกันภายใน `build-artifacts` หลังจาก `dist/` และ `dist-runtime/` ถูก build แล้ว

Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` จากนั้น build Play debug APK flavor ของ third-party ไม่มี source set หรือ manifest แยกต่างหาก lane unit-test ของมันยังคง compile flavor พร้อม flag BuildConfig ของ SMS/call-log ขณะเดียวกันก็หลีกเลี่ยงงาน packaging debug APK ซ้ำในทุก push ที่เกี่ยวข้องกับ Android

shard `check-dependencies` รัน `pnpm deadcode:dependencies` (production Knip pass เฉพาะ dependency ที่ปักไว้กับ Knip เวอร์ชันล่าสุด โดยปิดอายุ release ขั้นต่ำของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบผลการค้นหา production unused-file ของ Knip กับ `scripts/deadcode-unused-files.allowlist.mjs` guard ของ unused-file จะล้มเหลวเมื่อ PR เพิ่มไฟล์ที่ไม่ได้ใช้ใหม่โดยยังไม่ผ่านการ review หรือเหลือ allowlist entry ที่ stale ไว้ ขณะเดียวกันยังคงรักษา dynamic Plugin, generated, build, live-test และ package bridge surfaces ที่ตั้งใจไว้ซึ่ง Knip ไม่สามารถ resolve แบบ static ได้

## การส่งต่อกิจกรรม ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` เป็น bridge ฝั่ง target จากกิจกรรมใน repository OpenClaw ไปยัง ClawSweeper มันไม่ checkout หรือ execute code ของ pull request ที่ไม่น่าเชื่อถือ workflow สร้าง GitHub App token จาก `CLAWSWEEPER_APP_PRIVATE_KEY` แล้ว dispatch payload `repository_dispatch` แบบกระชับไปยัง `openclaw/clawsweeper`

workflow มีสี่ lane:

- `clawsweeper_item` สำหรับคำขอ review issue และ pull request ที่เจาะจง;
- `clawsweeper_comment` สำหรับคำสั่ง ClawSweeper ที่ระบุชัดเจนใน issue comments;
- `clawsweeper_commit_review` สำหรับคำขอ review ระดับ commit บน push ไปยัง `main`;
- `github_activity` สำหรับกิจกรรม GitHub ทั่วไปที่ agent ClawSweeper อาจตรวจสอบ

lane `github_activity` ส่งต่อเฉพาะ metadata ที่ normalized แล้ว: event type, action, actor, repository, item number, URL, title, state และ excerpt สั้นสำหรับ comments หรือ reviews เมื่อมีอยู่ มันตั้งใจหลีกเลี่ยงการส่งต่อ webhook body ทั้งหมด workflow ที่รับใน `openclaw/clawsweeper` คือ `.github/workflows/github-activity.yml` ซึ่งโพสต์ event ที่ normalized แล้วไปยัง OpenClaw Gateway hook สำหรับ agent ClawSweeper

กิจกรรมทั่วไปเป็นการสังเกต ไม่ใช่การส่งมอบโดยค่าเริ่มต้น agent ClawSweeper ได้รับ target ของ Discord ใน prompt และควรโพสต์ไปที่ `#clawsweeper` เฉพาะเมื่อ event นั้นน่าประหลาดใจ ดำเนินการได้ มีความเสี่ยง หรือมีประโยชน์เชิงปฏิบัติการ การเปิด แก้ไข ความเคลื่อนไหวของ bot สัญญาณรบกวนจาก webhook ซ้ำ และ traffic review ปกติควรให้ผลเป็น `NO_REPLY`

ให้ถือ title, comment, body, review text, branch name และ commit message ของ GitHub เป็นข้อมูลที่ไม่น่าเชื่อถือตลอดเส้นทางนี้ ข้อมูลเหล่านี้เป็น input สำหรับการสรุปและ triage ไม่ใช่คำสั่งสำหรับ workflow หรือ runtime ของ agent

## Manual dispatches

การ dispatch CI แบบ manual จะรันกราฟงานเดียวกับ CI ปกติ แต่บังคับเปิดทุก lane ที่อยู่ในขอบเขต non-Android: Linux Node shards, shards ของ Plugin ที่ bundled, สัญญาของช่องทาง, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, การตรวจสอบ docs, Python skills, Windows, macOS และ Control UI i18n การ dispatch CI แบบ manual แบบ standalone จะรันเฉพาะ Android ด้วย `include_android=true`; umbrella release แบบเต็มจะเปิดใช้ Android โดยส่ง `include_android=true` การตรวจสอบ static ของ Plugin prerelease, shard เฉพาะ release ชื่อ `agentic-plugins`, การ sweep ชุด extension แบบเต็ม และ Docker lanes ของ Plugin prerelease จะถูกยกเว้นจาก CI ชุด Docker prerelease จะรันเฉพาะเมื่อ `Full Release Validation` dispatch workflow `Plugin Prerelease` แยกต่างหากพร้อมเปิด gate release-validation

การรันแบบ manual ใช้ concurrency group ที่ไม่ซ้ำกัน เพื่อไม่ให้ชุด full suite ของ release-candidate ถูกยกเลิกโดยการรัน push หรือ PR อื่นบน ref เดียวกัน input เสริม `target_ref` ช่วยให้ caller ที่เชื่อถือได้รันกราฟนั้นกับ branch, tag หรือ commit SHA แบบเต็มได้ โดยใช้ไฟล์ workflow จาก dispatch ref ที่เลือก

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, งาน security แบบเร็วและ aggregates (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจสอบ protocol/contract/bundled แบบเร็ว, การตรวจสอบ channel contract แบบ sharded, shards ของ `check` ยกเว้น lint, shards และ aggregates ของ `check-additional`, ตัวตรวจสอบ aggregate ของการทดสอบ Node, การตรวจสอบ docs, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight ก็ใช้ GitHub-hosted Ubuntu ด้วย เพื่อให้ matrix ของ Blacksmith เข้าคิวได้เร็วขึ้น |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards ของ extension ที่น้ำหนักต่ำกว่า, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` และ `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards การทดสอบ Linux Node, shards การทดสอบ Plugin ที่ bundled, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (ไวต่อ CPU มากพอที่ 8 vCPU มีต้นทุนมากกว่าที่ช่วยประหยัดได้); Docker builds ของ install-smoke (เวลาเข้าคิว 32-vCPU มีต้นทุนมากกว่าที่ช่วยประหยัดได้)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; forks จะ fallback ไปที่ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; forks จะ fallback ไปที่ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## คำสั่งเทียบเท่าบน local

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
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## ประสิทธิภาพของ OpenClaw

`OpenClaw Performance` คือ workflow ด้านประสิทธิภาพของ product/runtime โดยรันทุกวันบน `main` และสามารถ dispatch แบบ manual ได้:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

โดยปกติการ dispatch แบบ manual จะ benchmark workflow ref ตั้งค่า `target_ref` เพื่อ benchmark release tag หรือ branch อื่นด้วย workflow implementation ปัจจุบัน path ของรายงานที่ publish และ pointer ล่าสุดจะ keyed ตาม ref ที่ทดสอบ และ `index.md` แต่ละไฟล์จะบันทึก ref/SHA ที่ทดสอบ, workflow ref/SHA, Kova ref, profile, โหมด auth ของ lane, model, จำนวน repeat และ scenario filters

workflow จะติดตั้ง OCM จาก release ที่ pinned และ Kova จาก `openclaw/Kova` ที่ input `kova_ref` ที่ pinned จากนั้นรันสาม lane:

- `mock-provider`: scenario diagnostic ของ Kova กับ runtime ที่ build บน local พร้อม auth ปลอมแบบ deterministic ที่เข้ากันได้กับ OpenAI
- `mock-deep-profile`: การทำ CPU/heap/trace profiling สำหรับ hotspot ของ startup, gateway และ agent-turn
- `live-gpt54`: agent turn จริงของ OpenAI `openai/gpt-5.4` ซึ่งจะข้ามเมื่อไม่มี `OPENAI_API_KEY`

lane mock-provider ยังรัน source probes แบบ native ของ OpenClaw หลังจาก Kova pass: timing และ memory ของการบูต Gateway ในกรณี startup แบบ default, hook และ 50-Plugin; loop hello ของ mock-OpenAI `channel-chat-baseline` ซ้ำๆ; และคำสั่ง startup ของ CLI กับ Gateway ที่บูตแล้ว สรุป Markdown ของ source probe อยู่ที่ `source/index.md` ใน report bundle พร้อม raw JSON ที่อยู่ข้างกัน

ทุก lane จะอัปโหลด GitHub artifacts เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว workflow จะ commit `report.json`, `report.md`, bundles, `index.md` และ artifacts ของ source-probe เข้าไปใน `openclaw/clawgrit-reports` ใต้ `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` ด้วย pointer ของ tested-ref ปัจจุบันจะถูกเขียนเป็น `openclaw-performance/<tested-ref>/latest-<lane>.json`

## การตรวจสอบ Release แบบเต็ม

`Full Release Validation` คือ workflow umbrella แบบ manual สำหรับ "รันทุกอย่างก่อน release" โดยรับ branch, tag หรือ commit SHA แบบเต็ม, dispatch workflow `CI` แบบ manual ด้วย target นั้น, dispatch `Plugin Prerelease` สำหรับ proof เฉพาะ release ของ Plugin/package/static/Docker และ dispatch `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, การตรวจสอบ package ข้าม OS, QA Lab parity, Matrix และ Telegram lanes การรัน stable/default จะเก็บ coverage ของ live/E2E และ Docker release-path แบบ exhaustive ไว้หลัง `run_release_soak=true`; `release_profile=full` จะบังคับเปิด soak coverage นั้นเพื่อให้การตรวจสอบ advisory แบบกว้างยังคงกว้าง เมื่อใช้ `rerun_group=all` และ `release_profile=full` จะรัน `NPM Telegram Beta E2E` กับ artifact `release-package-under-test` จาก release checks ด้วย หลัง publish แล้ว ให้ส่ง `npm_telegram_package_spec` เพื่อ rerun lane ของ package Telegram เดียวกันกับ package npm ที่ publish แล้ว

ดู [การตรวจสอบ release แบบเต็ม](/th/reference/full-release-validation) สำหรับ
stage matrix, ชื่อ workflow job ที่แน่นอน, ความแตกต่างของ profile, artifacts และ
handle สำหรับ focused rerun

`OpenClaw Release Publish` คือ workflow release แบบ manual ที่เปลี่ยนสถานะ Dispatch จาก
`release/YYYY.M.D` หรือ `main` หลังจาก release tag มีอยู่แล้ว และหลังจาก
OpenClaw npm preflight สำเร็จแล้ว โดยตรวจสอบ `pnpm plugins:sync:check`,
dispatch `Plugin NPM Release` สำหรับ package ของ Plugin ทั้งหมดที่ publish ได้, dispatch
`Plugin ClawHub Release` สำหรับ release SHA เดียวกัน และหลังจากนั้นเท่านั้นจึง dispatch
`OpenClaw NPM Release` ด้วย `preflight_run_id` ที่บันทึกไว้

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

สำหรับ proof ของ commit ที่ pinned บน branch ที่เคลื่อนไหวเร็ว ให้ใช้ helper แทน
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

dispatch refs ของ GitHub workflow ต้องเป็น branches หรือ tags ไม่ใช่ raw commit SHAs
helper จะ push branch ชั่วคราว `release-ci/<sha>-...` ที่ target SHA,
dispatch `Full Release Validation` จาก ref ที่ pinned นั้น, ตรวจสอบว่า `headSha` ของ workflow ลูกทุกตัวตรงกับ target,
และลบ branch ชั่วคราวเมื่อการรันเสร็จสิ้น ตัวตรวจสอบ umbrella จะ fail ด้วยหาก workflow ลูกใดรันที่
SHA อื่น

`release_profile` ควบคุมขอบเขต live/provider ที่ส่งเข้าไปยังการตรวจสอบรีลีส เวิร์กโฟลว์รีลีสแบบแมนนวลมีค่าเริ่มต้นเป็น `stable`; ใช้ `full` เฉพาะเมื่อคุณตั้งใจต้องการเมทริกซ์ผู้ให้บริการคำแนะนำ/สื่อแบบกว้างเท่านั้น `run_release_soak` ควบคุมว่าการตรวจสอบรีลีส stable/default จะรันการแช่ทดสอบเส้นทางรีลีส live/E2E และ Docker แบบครบถ้วนหรือไม่; `full` จะบังคับเปิดการแช่ทดสอบ

- `minimum` คงเลนสำคัญต่อรีลีสของ OpenAI/core ที่เร็วที่สุดไว้
- `stable` เพิ่มชุดผู้ให้บริการ/แบ็กเอนด์แบบเสถียร
- `full` รันเมทริกซ์ผู้ให้บริการคำแนะนำ/สื่อแบบกว้าง

ตัวครอบหลักจะบันทึก id ของการรันลูกที่ถูกส่งออกไป และงานสุดท้าย `Verify full validation` จะตรวจสอบผลสรุปการรันลูกปัจจุบันอีกครั้ง และต่อท้ายตารางงานที่ช้าที่สุดของแต่ละการรันลูก หากเวิร์กโฟลว์ลูกถูกรันซ้ำและเปลี่ยนเป็นเขียว ให้รันซ้ำเฉพาะงานตรวจสอบของพาเรนต์เพื่อรีเฟรชผลลัพธ์ของตัวครอบหลักและสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รองรับ `rerun_group` ใช้ `all` สำหรับผู้สมัครรีลีส, `ci` สำหรับลูก CI เต็มรูปแบบปกติเท่านั้น, `plugin-prerelease` สำหรับลูกก่อนรีลีสของ Plugin เท่านั้น, `release-checks` สำหรับลูกรีลีสทั้งหมด หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` หรือ `npm-telegram` บนตัวครอบหลัก วิธีนี้ทำให้การรันซ้ำของกล่องรีลีสที่ล้มเหลวยังคงถูกจำกัดขอบเขตหลังการแก้ไขเฉพาะจุด สำหรับเลน cross-OS ที่ล้มเหลวหนึ่งเลน ให้รวม `rerun_group=cross-os` กับ `cross_os_suite_filter` เช่น `windows/packaged-upgrade`; คำสั่ง cross-OS ที่ใช้เวลานานจะปล่อยบรรทัด Heartbeat และสรุป packaged-upgrade จะรวมเวลาต่อเฟส เลนตรวจสอบรีลีส QA เป็นคำแนะนำ ดังนั้นความล้มเหลวเฉพาะ QA จะเตือนแต่ไม่บล็อกตัวตรวจสอบ release-check

`OpenClaw Release Checks` ใช้ ref ของเวิร์กโฟลว์ที่เชื่อถือได้เพื่อ resolve ref ที่เลือกหนึ่งครั้งเป็น tarball `release-package-under-test` จากนั้นส่งอาร์ติแฟกต์นั้นไปยังการตรวจสอบ cross-OS และ Package Acceptance รวมถึงเวิร์กโฟลว์ Docker เส้นทางรีลีส live/E2E เมื่อรันความครอบคลุมแบบแช่ทดสอบ วิธีนี้ทำให้ไบต์ของแพ็กเกจสอดคล้องกันในทุกกล่องรีลีส และหลีกเลี่ยงการแพ็กผู้สมัครเดียวกันซ้ำในหลายงานลูก

การรัน `Full Release Validation` ซ้ำสำหรับ `ref=main` และ `rerun_group=all`
จะแทนที่ตัวครอบหลักที่เก่ากว่า ตัวมอนิเตอร์พาเรนต์จะยกเลิกเวิร์กโฟลว์ลูกใดๆ ที่ส่งออกไปแล้วเมื่อพาเรนต์ถูกยกเลิก ดังนั้นการตรวจสอบ main ที่ใหม่กว่าจะไม่ต้องรออยู่หลังการรัน release-check เก่าสองชั่วโมง การตรวจสอบ branch/tag ของรีลีสและกลุ่ม rerun เฉพาะจุดจะคง `cancel-in-progress: false` ไว้

## ชาร์ด Live และ E2E

ลูก release live/E2E ยังคงความครอบคลุม `pnpm test:live` แบบเนทีฟที่กว้างไว้ แต่รันเป็นชาร์ดที่มีชื่อผ่าน `scripts/test-live-shard.mjs` แทนงานแบบอนุกรมงานเดียว:

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
- ชาร์ดสื่อเสียง/วิดีโอที่แยกออก และชาร์ดเพลงที่กรองตามผู้ให้บริการ

วิธีนี้คงความครอบคลุมไฟล์เดิมไว้ พร้อมทำให้ความล้มเหลวของผู้ให้บริการ live ที่ช้ารันซ้ำและวินิจฉัยได้ง่ายขึ้น ชื่อชาร์ดรวม `native-live-extensions-o-z`, `native-live-extensions-media` และ `native-live-extensions-media-music` ยังคงใช้ได้สำหรับการรันซ้ำแบบครั้งเดียวด้วยตนเอง

ชาร์ดสื่อ live แบบเนทีฟรันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งสร้างโดยเวิร์กโฟลว์ `Live Media Runner Image` อิมเมจนั้นติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้า; งานสื่อจะตรวจสอบเฉพาะไบนารีก่อนตั้งค่า คงชุดทดสอบ live ที่พึ่งพา Docker ไว้บนรันเนอร์ Blacksmith ปกติ เพราะงานคอนเทนเนอร์ไม่ใช่ที่เหมาะสำหรับเริ่มการทดสอบ Docker ซ้อน

ชาร์ดโมเดล/แบ็กเอนด์ live ที่พึ่งพา Docker ใช้อิมเมจ `ghcr.io/openclaw/openclaw-live-test:<sha>` แบบแชร์แยกต่างหากต่อคอมมิตที่เลือก เวิร์กโฟลว์ live release จะสร้างและ push อิมเมจนั้นหนึ่งครั้ง จากนั้นชาร์ดโมเดล live ของ Docker, Gateway ที่แบ่งตามผู้ให้บริการ, แบ็กเอนด์ CLI, ACP bind และ harness ของ Codex จะรันด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ชาร์ด Gateway Docker มีขีดจำกัด `timeout` ระดับสคริปต์อย่างชัดเจนที่ต่ำกว่า timeout ของงานเวิร์กโฟลว์ เพื่อให้คอนเทนเนอร์หรือเส้นทาง cleanup ที่ค้างล้มเหลวอย่างรวดเร็ว แทนที่จะใช้ budget release-check ทั้งหมด หากชาร์ดเหล่านั้นสร้างเป้าหมาย Docker ของซอร์สเต็มรูปแบบขึ้นใหม่เอง การรันรีลีสถูกกำหนดค่าผิดและจะเสียเวลาจริงไปกับการสร้างอิมเมจซ้ำ

## Package Acceptance

ใช้ `Package Acceptance` เมื่อคำถามคือ "แพ็กเกจ OpenClaw ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์ได้หรือไม่" มันแตกต่างจาก CI ปกติ: CI ปกติตรวจสอบซอร์สทรี ขณะที่ package acceptance ตรวจสอบ tarball เดียวผ่าน Docker E2E harness เดียวกับที่ผู้ใช้ใช้งานหลังติดตั้งหรืออัปเดต

### งาน

1. `resolve_package` checkout `workflow_ref`, resolve ผู้สมัครแพ็กเกจหนึ่งรายการ, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, อัปโหลดทั้งสองเป็นอาร์ติแฟกต์ `package-under-test` และพิมพ์แหล่งที่มา, workflow ref, package ref, เวอร์ชัน, SHA-256 และโปรไฟล์ในสรุปขั้นตอนของ GitHub
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` เวิร์กโฟลว์ reusable จะดาวน์โหลดอาร์ติแฟกต์นั้น ตรวจสอบ inventory ของ tarball เตรียมอิมเมจ Docker แบบ package-digest เมื่อจำเป็น และรันเลน Docker ที่เลือกกับแพ็กเกจนั้นแทนการแพ็ก workflow checkout เมื่อโปรไฟล์เลือก `docker_lanes` แบบเจาะจงหลายรายการ เวิร์กโฟลว์ reusable จะเตรียมแพ็กเกจและอิมเมจแชร์หนึ่งครั้ง จากนั้นกระจายเลนเหล่านั้นออกเป็นงาน Docker แบบเจาะจงที่รันขนานกันพร้อมอาร์ติแฟกต์ที่ไม่ซ้ำกัน
3. `package_telegram` เรียก `NPM Telegram Beta E2E` แบบเลือกได้ โดยจะรันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้งอาร์ติแฟกต์ `package-under-test` เดียวกันเมื่อ Package Acceptance resolve ไว้แล้ว; การ dispatch Telegram แบบสแตนด์อโลนยังคงติดตั้งสเปก npm ที่เผยแพร่แล้วได้
4. `summary` ทำให้เวิร์กโฟลว์ล้มเหลวหากการ resolve แพ็กเกจ, Docker acceptance หรือเลน Telegram แบบเลือกได้ล้มเหลว

### แหล่งที่มาของผู้สมัคร

- `source=npm` รองรับเฉพาะ `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรีลีส OpenClaw ที่แน่นอน เช่น `openclaw@2026.4.27-beta.2` ใช้สิ่งนี้สำหรับ acceptance ของ prerelease/stable ที่เผยแพร่แล้ว
- `source=ref` แพ็ก branch, tag หรือ SHA คอมมิตเต็มของ `package_ref` ที่เชื่อถือได้ ตัว resolver fetch branch/tag ของ OpenClaw, ตรวจสอบว่าคอมมิตที่เลือก reachable จากประวัติ branch ของ repository หรือ release tag, ติดตั้ง deps ใน worktree แบบ detached และแพ็กด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` ดาวน์โหลด HTTPS `.tgz`; ต้องมี `package_sha256`
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งไฟล์จาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็นทางเลือกแต่ควรระบุสำหรับอาร์ติแฟกต์ที่แชร์ภายนอก

แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือโค้ดเวิร์กโฟลว์/harness ที่เชื่อถือได้ซึ่งรันการทดสอบ `package_ref` คือคอมมิตต้นทางที่ถูกแพ็กเมื่อ `source=ref` วิธีนี้ทำให้ harness ทดสอบปัจจุบันตรวจสอบคอมมิตต้นทางเก่าที่เชื่อถือได้โดยไม่ต้องรันตรรกะเวิร์กโฟลว์เก่า

### โปรไฟล์ชุดทดสอบ

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` รวมกับ `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — ชังก์เส้นทางรีลีส Docker เต็มรูปแบบพร้อม OpenWebUI
- `custom` — `docker_lanes` ที่แน่นอน; จำเป็นเมื่อ `suite_profile=custom`

โปรไฟล์ `package` ใช้ความครอบคลุม Plugin แบบออฟไลน์ เพื่อให้การตรวจสอบแพ็กเกจที่เผยแพร่แล้วไม่ถูกกั้นด้วยความพร้อมใช้งานของ ClawHub แบบ live เลน Telegram แบบเลือกได้ใช้อาร์ติแฟกต์ `package-under-test` ซ้ำใน `NPM Telegram Beta E2E` โดยคงเส้นทางสเปก npm ที่เผยแพร่แล้วไว้สำหรับ dispatch แบบสแตนด์อโลน

สำหรับนโยบายการทดสอบอัปเดตและ Plugin เฉพาะ รวมถึงคำสั่งโลคัล,
เลน Docker, อินพุต Package Acceptance, ค่าเริ่มต้นของรีลีส และการ triage ความล้มเหลว,
ดู [การทดสอบอัปเดตและ Plugin](/th/help/testing-updates-plugins)

Release checks เรียก Package Acceptance ด้วย `source=artifact`, อาร์ติแฟกต์แพ็กเกจรีลีสที่เตรียมไว้, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` และ `telegram_mode=mock-openai` วิธีนี้คงหลักฐาน package migration, update, cleanup การพึ่งพา Plugin ค้าง, การซ่อมติดตั้ง Plugin ที่กำหนดค่าไว้, Plugin ออฟไลน์, plugin-update และ Telegram ไว้บน tarball แพ็กเกจที่ resolve เดียวกัน ตั้งค่า `package_acceptance_package_spec` บน Full Release Validation หรือ OpenClaw Release Checks เพื่อรันเมทริกซ์เดียวกันกับแพ็กเกจ npm ที่จัดส่งแล้วแทนอาร์ติแฟกต์ที่สร้างจาก SHA การตรวจสอบรีลีส cross-OS ยังคงครอบคลุม onboarding, installer และพฤติกรรมแพลตฟอร์มที่เฉพาะต่อ OS; การตรวจสอบผลิตภัณฑ์ด้าน package/update ควรเริ่มจาก Package Acceptance เลน Docker `published-upgrade-survivor` ตรวจสอบ baseline ของแพ็กเกจที่เผยแพร่แล้วหนึ่งรายการต่อการรันในเส้นทางรีลีสที่บล็อก ใน Package Acceptance tarball `package-under-test` ที่ resolve แล้วจะเป็นผู้สมัครเสมอ และ `published_upgrade_survivor_baseline` เลือก baseline ที่เผยแพร่แล้วสำหรับ fallback โดยมีค่าเริ่มต้นเป็น `openclaw@latest`; คำสั่งรันซ้ำของเลนที่ล้มเหลวจะรักษา baseline นั้นไว้ Full Release Validation ที่มี `run_release_soak=true` หรือ `release_profile=full` ตั้งค่า `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` และ `published_upgrade_survivor_scenarios=reported-issues` เพื่อขยายข้ามรีลีส npm stable ล่าสุดสี่รายการ รวมถึงรีลีสขอบเขตความเข้ากันได้ของ Plugin ที่ pin ไว้ และ fixture รูปแบบ issue สำหรับ config ของ Feishu, ไฟล์ bootstrap/persona ที่คงไว้, การติดตั้ง OpenClaw Plugin ที่กำหนดค่าไว้, เส้นทาง log แบบ tilde และราก dependency ของ Plugin legacy ที่ค้าง การเลือก published-upgrade survivor หลาย baseline จะถูกแบ่งชาร์ดตาม baseline เป็นงานรันเนอร์ Docker แบบเจาะจงแยกกัน เวิร์กโฟลว์ `Update Migration` แยกต่างหากใช้เลน Docker `update-migration` พร้อม `all-since-2026.4.23` และ `plugin-deps-cleanup` เมื่อคำถามคือการ cleanup อัปเดตที่เผยแพร่แล้วแบบครบถ้วน ไม่ใช่ขอบเขต Full Release CI ปกติ การรันรวมแบบโลคัลสามารถส่งสเปกแพ็กเกจที่แน่นอนด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, คงเลนเดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` เช่น `openclaw@2026.4.15` หรือตั้งค่า `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` สำหรับเมทริกซ์ scenario เลนที่เผยแพร่แล้วกำหนดค่า baseline ด้วยสูตรคำสั่ง `openclaw config set` ที่ bake ไว้ บันทึกขั้นตอนสูตรใน `summary.json` และ probe `/healthz`, `/readyz` รวมถึงสถานะ RPC หลังเริ่ม Gateway เลน Windows packaged และ installer fresh ยังตรวจสอบด้วยว่าแพ็กเกจที่ติดตั้งแล้วสามารถ import browser-control override จากเส้นทาง Windows absolute ดิบได้ smoke agent-turn แบบ cross-OS ของ OpenAI มีค่าเริ่มต้นเป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อตั้งค่าไว้ มิฉะนั้นใช้ `openai/gpt-5.4` เพื่อให้หลักฐานการติดตั้งและ Gateway ยังคงอยู่บนโมเดลทดสอบ GPT-5 พร้อมหลีกเลี่ยงค่าเริ่มต้น GPT-4.x

### หน้าต่างความเข้ากันได้แบบ Legacy

Package Acceptance มีหน้าต่างความเข้ากันได้แบบ legacy ที่จำกัดขอบเขตสำหรับแพ็กเกจที่เผยแพร่แล้ว แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้เส้นทางความเข้ากันได้:

- รายการ QA ส่วนตัวที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ถูกละไว้จาก tarball;
- `doctor-switch` อาจข้าม subcase การ persistence ของ `gateway install --wrapper` เมื่อแพ็กเกจไม่เปิดเผย flag นั้น;
- `update-channel-switch` อาจ prune `pnpm.patchedDependencies` ที่ขาดหายจาก fixture git ปลอมที่ได้จาก tarball และอาจ log `update.channel` ที่ persist ไว้ซึ่งขาดหาย;
- smoke ของ Plugin อาจอ่านตำแหน่ง install-record แบบ legacy หรือยอมรับการ persistence ของ marketplace install-record ที่ขาดหาย;
- `plugin-update` อาจอนุญาตการ migration metadata ของ config ในขณะที่ยังคงกำหนดให้ install record และพฤติกรรม no-reinstall ต้องไม่เปลี่ยนแปลง

แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ stamp เมทาดาทาบิลด์ภายในเครื่องที่ถูกจัดส่งไปแล้วด้วย แพ็กเกจภายหลังต้องเป็นไปตามสัญญาสมัยใหม่ เงื่อนไขเดียวกันจะล้มเหลวแทนที่จะเตือนหรือข้าม

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

เมื่อดีบักการรัน package acceptance ที่ล้มเหลว ให้เริ่มที่สรุป `resolve_package` เพื่อยืนยันแหล่งที่มาของแพ็กเกจ เวอร์ชัน และ SHA-256 จากนั้นตรวจสอบการรันลูก `docker_acceptance` และอาร์ติแฟกต์ Docker ของมัน ได้แก่ `.artifacts/docker-tests/**/summary.json`, `failures.json`, บันทึก lane, เวลาของแต่ละเฟส และคำสั่งรันซ้ำ ควรรันซ้ำเฉพาะโปรไฟล์แพ็กเกจที่ล้มเหลวหรือ Docker lanes ที่ตรงจุด แทนการรัน full release validation ใหม่ทั้งหมด

## Install smoke

เวิร์กโฟลว์ `Install Smoke` แยกต่างหากใช้สคริปต์กำหนดขอบเขตเดียวกันซ้ำผ่านงาน `preflight` ของตัวเอง โดยแบ่ง coverage แบบ smoke ออกเป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **Fast path** รันสำหรับ pull request ที่แตะพื้นผิว Docker/แพ็กเกจ การเปลี่ยนแปลงแพ็กเกจ/manifest ของ Plugin ที่มาพร้อมชุด หรือพื้นผิว core plugin/channel/gateway/Plugin SDK ที่งาน Docker smoke ทดสอบ การเปลี่ยนแปลง Plugin ที่มาพร้อมชุดแบบ source-only การแก้ไขเฉพาะ test และการแก้ไขเฉพาะ docs จะไม่จอง Docker workers Fast path สร้างอิมเมจ Dockerfile รากหนึ่งครั้ง ตรวจสอบ CLI รัน smoke ของ CLI สำหรับ agents delete shared-workspace รัน container gateway-network e2e ตรวจสอบ build arg ของส่วนขยายที่มาพร้อมชุด และรันโปรไฟล์ Docker ของ bundled-plugin แบบจำกัดภายใต้เวลาหมดอายุคำสั่งรวม 240 วินาที (Docker run ของแต่ละ scenario ถูกจำกัดแยกกัน)
- **Full path** เก็บ coverage สำหรับการติดตั้งแพ็กเกจ QR และ Docker/update ของ installer ไว้สำหรับการรันตามกำหนดการกลางคืน การ dispatch ด้วยมือ workflow-call release checks และ pull request ที่แตะพื้นผิว installer/package/Docker จริง ๆ ในโหมด full install-smoke จะเตรียมหรือใช้อิมเมจ smoke ของ root Dockerfile ใน GHCR สำหรับ target-SHA เดียวซ้ำ จากนั้นรันการติดตั้งแพ็กเกจ QR, smokes ของ root Dockerfile/gateway, smokes ของ installer/update และ Docker E2E ของ bundled-plugin แบบ fast เป็นงานแยกกัน เพื่อให้งาน installer ไม่ต้องรอหลัง smokes ของ root image

การ push ไปยัง `main` (รวมถึง merge commit) จะไม่บังคับ full path เมื่อ logic ของ changed-scope ขอ coverage แบบ full บน push เวิร์กโฟลว์จะคง Docker smoke แบบ fast ไว้ และปล่อย full install smoke ให้กับการตรวจสอบกลางคืนหรือ release validation

smoke ของ Bun global install image-provider ที่ช้าถูกควบคุมแยกด้วย `run_bun_global_install_smoke` มันรันบนกำหนดการกลางคืนและจาก release checks workflow และการ dispatch `Install Smoke` ด้วยมือสามารถเลือกเปิดใช้ได้ แต่ pull request และ push ไปยัง `main` จะไม่รัน การทดสอบ Docker ของ QR และ installer ยังใช้ Dockerfiles ที่เน้นการติดตั้งของตัวเอง

## Local Docker E2E

`pnpm test:docker:all` prebuild อิมเมจ live-test ที่ใช้ร่วมกันหนึ่งชุด แพ็ก OpenClaw หนึ่งครั้งเป็น npm tarball และสร้างอิมเมจ `scripts/e2e/Dockerfile` ที่ใช้ร่วมกันสองชุด:

- runner Node/Git เปล่าสำหรับ lanes ของ installer/update/plugin-dependency;
- อิมเมจ functional ที่ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lanes ฟังก์ชันปกติ

คำนิยาม Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs` และ runner จะรันเฉพาะแผนที่เลือก scheduler เลือกอิมเมจต่อ lane ด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` จากนั้นรัน lanes ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### ค่าที่ปรับได้

| ตัวแปร                                | ค่าเริ่มต้น | วัตถุประสงค์                                                                                 |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | จำนวน slot ของ main-pool สำหรับ lanes ปกติ                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | จำนวน slot ของ tail-pool ที่ไวต่อ provider                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | เพดาน live lane พร้อมกันเพื่อไม่ให้ providers throttle                                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | เพดาน lane ติดตั้ง npm พร้อมกัน                                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | เพดาน lane แบบหลาย service พร้อมกัน                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | การหน่วงระหว่างการเริ่ม lane เพื่อหลีกเลี่ยงการสร้างงานจำนวนมากของ Docker daemon; ตั้งเป็น `0` เพื่อไม่หน่วง |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | เวลาหมดอายุ fallback ต่อ lane (120 นาที); lanes live/tail ที่เลือกใช้เพดานที่เข้มกว่า         |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` พิมพ์แผน scheduler โดยไม่รัน lanes                                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | รายการ lane แบบตรงตัวคั่นด้วยจุลภาค; ข้าม cleanup smoke เพื่อให้ agents ทำซ้ำ lane ที่ล้มเหลวหนึ่ง lane ได้ |

lane ที่หนักกว่าเพดานที่มีผลของตัวเองยังเริ่มจาก pool ว่างได้ จากนั้นจะรันเพียงลำพังจนกว่าจะปล่อย capacity aggregate ภายในเครื่องจะ preflight Docker ลบคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่ แสดงสถานะ active-lane บันทึกเวลาของ lane เพื่อจัดลำดับ longest-first และโดยค่าเริ่มต้นจะหยุด schedule lanes ใหม่ใน pool หลังความล้มเหลวแรก

### เวิร์กโฟลว์ live/E2E ที่ใช้ซ้ำได้

เวิร์กโฟลว์ live/E2E ที่ใช้ซ้ำได้ถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องใช้ coverage ของแพ็กเกจ ชนิดอิมเมจ อิมเมจ live, lane และ credentials ใด `scripts/docker-e2e.mjs` จากนั้นแปลงแผนนั้นเป็น outputs และ summaries ของ GitHub โดยจะ either แพ็ก OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลดอาร์ติแฟกต์แพ็กเกจจากการรันปัจจุบัน หรือดาวน์โหลดอาร์ติแฟกต์แพ็กเกจจาก `package_artifact_run_id`; ตรวจสอบ inventory ของ tarball; สร้างและ push อิมเมจ Docker E2E แบบ bare/functional ของ GHCR ที่ติดแท็กด้วย digest ของแพ็กเกจผ่าน Docker layer cache ของ Blacksmith เมื่อแผนต้องใช้ lanes ที่ติดตั้งแพ็กเกจ; และใช้อินพุต `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรืออิมเมจ package-digest ที่มีอยู่แทนการสร้างใหม่ การ pull อิมเมจ Docker จะ retry ด้วย timeout ต่อครั้งแบบจำกัด 180 วินาที เพื่อให้ stream registry/cache ที่ค้าง retry ได้เร็ว แทนที่จะกินเวลาส่วนใหญ่ของ critical path ใน CI

### ชังก์ของ release path

coverage ของ Release Docker รันเป็นงานย่อยขนาดเล็กลงด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละชังก์ pull เฉพาะชนิดอิมเมจที่ต้องใช้และรันหลาย lanes ผ่าน scheduler แบบ weighted เดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

ชังก์ Release Docker ปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` และ `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` ส่วน `plugins-runtime-core`, `plugins-runtime` และ `plugins-integrations` ยังคงเป็น alias รวมของ plugin/runtime alias ของ lane `install-e2e` ยังคงเป็น alias รวมสำหรับการรันซ้ำด้วยมือของ installer lanes ของทั้งสอง provider

OpenWebUI ถูกรวมเข้าใน `plugins-runtime-services` เมื่อ coverage แบบ full release-path ขอใช้งาน และคงชังก์ `openwebui` แบบ standalone ไว้เฉพาะสำหรับการ dispatch ที่เป็น OpenWebUI-only lanes อัปเดตของ bundled-channel retry หนึ่งครั้งสำหรับความล้มเหลวของเครือข่าย npm ชั่วคราว

แต่ละชังก์อัปโหลด `.artifacts/docker-tests/` พร้อมบันทึก lane, timings, `summary.json`, `failures.json`, เวลาของแต่ละเฟส, JSON แผน scheduler, ตาราง slow-lane และคำสั่งรันซ้ำต่อ lane อินพุต `docker_lanes` ของเวิร์กโฟลว์จะรัน lanes ที่เลือกกับอิมเมจที่เตรียมไว้แทนงานชังก์ ซึ่งทำให้การดีบัก lane ที่ล้มเหลวถูกจำกัดอยู่ที่งาน Docker ที่เจาะจงหนึ่งงาน และเตรียม ดาวน์โหลด หรือใช้อาร์ติแฟกต์แพ็กเกจซ้ำสำหรับการรันนั้น หาก lane ที่เลือกเป็น live Docker lane งานที่เจาะจงจะสร้างอิมเมจ live-test ภายในเครื่องสำหรับการรันซ้ำนั้น คำสั่ง GitHub rerun ที่สร้างต่อ lane จะรวม `package_artifact_run_id`, `package_artifact_name` และอินพุตอิมเมจที่เตรียมไว้เมื่อมีค่าเหล่านั้น เพื่อให้ lane ที่ล้มเหลวใช้งานแพ็กเกจและอิมเมจชุดเดิมจากการรันที่ล้มเหลวได้

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

เวิร์กโฟลว์ live/E2E ตามกำหนดการรันชุด Docker release-path แบบ full ทุกวัน

## Plugin Prerelease

`Plugin Prerelease` เป็น coverage ระดับ product/package ที่มีค่าใช้จ่ายสูงกว่า จึงเป็นเวิร์กโฟลว์แยกที่ dispatch โดย `Full Release Validation` หรือโดย operator อย่างชัดเจน Pull request ปกติ push ไปยัง `main` และการ dispatch CI ด้วยมือแบบ standalone จะปิดชุดนี้ไว้ มันกระจายการทดสอบ Plugin ที่มาพร้อมชุดข้าม worker ของ extension แปดตัว งาน extension shard เหล่านั้นรันกลุ่ม config ของ Plugin ได้สูงสุดครั้งละสองกลุ่ม โดยมี Vitest worker หนึ่งตัวต่อกลุ่มและ Node heap ที่ใหญ่ขึ้น เพื่อให้ batch ของ Plugin ที่ import หนักไม่สร้างงาน CI เพิ่มเติม path prerelease Docker เฉพาะ release จะ batch Docker lanes ที่เจาะจงเป็นกลุ่มเล็ก ๆ เพื่อหลีกเลี่ยงการจอง runners หลายสิบตัวสำหรับงานหนึ่งถึงสามนาที

## QA Lab

QA Lab มี CI lanes เฉพาะอยู่นอกเวิร์กโฟลว์ smart-scoped หลัก Agentic parity ซ้อนอยู่ใต้ harnesses ของ QA และ release แบบกว้าง ไม่ใช่เวิร์กโฟลว์ PR แบบ standalone ใช้ `Full Release Validation` กับ `rerun_group=qa-parity` เมื่อ parity ควรไปพร้อมกับการรัน validation แบบกว้าง

- เวิร์กโฟลว์ `QA-Lab - All Lanes` รันทุกคืนบน `main` และเมื่อ dispatch ด้วยมือ โดย fan out lane mock parity, lane live Matrix และ lanes live Telegram และ Discord เป็นงานขนานกัน งาน live ใช้ environment `qa-live-shared` และ Telegram/Discord ใช้ Convex leases

Release checks รัน lanes live transport ของ Matrix และ Telegram ด้วย deterministic mock provider และโมเดลที่ผ่านเกณฑ์ mock (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อแยกสัญญา channel ออกจาก latency ของโมเดล live และการเริ่มต้น provider-plugin ตามปกติ live transport gateway ปิดใช้งาน memory search เพราะ QA parity ครอบคลุมพฤติกรรม memory แยกต่างหาก connectivity ของ provider ครอบคลุมโดยชุด live model, native provider และ Docker provider แยกต่างหาก

Matrix ใช้ `--profile fast` สำหรับ gates ตามกำหนดการและ release โดยเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout รองรับ ค่าเริ่มต้นของ CLI และอินพุต workflow แบบ manual ยังคงเป็น `all`; การ dispatch ด้วยมือ `matrix_profile=all` จะแบ่ง coverage ของ Matrix แบบ full เป็นงาน `transport`, `media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรัน lanes ของ QA Lab ที่สำคัญต่อ release ก่อนอนุมัติ release ด้วย gate ของ QA parity จะรัน candidate และ baseline packs เป็นงาน lane ขนานกัน จากนั้นดาวน์โหลดอาร์ติแฟกต์ทั้งสองลงในงานรายงานขนาดเล็กสำหรับการเปรียบเทียบ parity ขั้นสุดท้าย

สำหรับ PR ปกติ ให้ทำตามหลักฐาน CI/check ตามขอบเขต แทนการถือว่า parity เป็นสถานะที่จำเป็น

## CodeQL

เวิร์กโฟลว์ `CodeQL` ตั้งใจให้เป็นสแกนเนอร์ความปลอดภัยรอบแรกแบบแคบ ไม่ใช่การสแกนทั้งรีโพสิทอรีแบบเต็ม งาน guard รายวัน งานแมนนวล และงาน pull request ที่ไม่ใช่ดราฟต์จะสแกนโค้ด Actions workflow รวมถึงพื้นผิว JavaScript/TypeScript ที่มีความเสี่ยงสูงสุดด้วยคิวรีความปลอดภัยความเชื่อมั่นสูงที่กรองเฉพาะ `security-severity` ระดับ high/critical

งาน guard สำหรับ pull request ยังคงเบา: เริ่มทำงานเฉพาะเมื่อมีการเปลี่ยนแปลงใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` หรือ `src` และรันเมทริกซ์ความปลอดภัยความเชื่อมั่นสูงชุดเดียวกับเวิร์กโฟลว์ตามกำหนดการ ค่าเริ่มต้นของ PR จะไม่รวม Android และ macOS CodeQL

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                          | พื้นผิว                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, Cron และ baseline ของ Gateway                                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการใช้งานการติดตั้งใช้งาน channel หลัก รวมถึง runtime ของ channel Plugin, Gateway, Plugin SDK, secrets และจุดสัมผัส audit     |
| `/codeql-security-high/network-ssrf-boundary`     | พื้นผิวนโยบาย SSRF ของ core, การแยกวิเคราะห์ IP, network guard, web-fetch และ Plugin SDK                                           |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, ตัวช่วยการรัน process, การส่งออกขาออก และ gate การรัน tool ของ agent                                                  |
| `/codeql-security-high/plugin-trust-boundary`     | พื้นผิว trust ของการติดตั้ง Plugin, loader, manifest, registry, package-manager install, source-loading และ package contract ของ Plugin SDK |

### Shard ความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — shard ความปลอดภัย Android ตามกำหนดการ สร้างแอป Android แบบแมนนวลสำหรับ CodeQL บน Blacksmith Linux runner ที่เล็กที่สุดซึ่ง workflow sanity ยอมรับ อัปโหลดใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — shard ความปลอดภัย macOS รายสัปดาห์/แมนนวล สร้างแอป macOS แบบแมนนวลสำหรับ CodeQL บน Blacksmith macOS, กรองผลลัพธ์การ build ของ dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดใต้ `/codeql-critical-security/macos` เก็บไว้นอกค่าเริ่มต้นรายวันเพราะการ build macOS ใช้ runtime เป็นหลักแม้เมื่อสะอาด

### หมวดหมู่คุณภาพวิกฤต

`CodeQL Critical Quality` คือ shard ที่คู่กันในฝั่งที่ไม่ใช่ความปลอดภัย โดยรันเฉพาะคิวรีคุณภาพ JavaScript/TypeScript ระดับ error-severity และไม่ใช่ security บนพื้นผิวแคบที่มีมูลค่าสูงบน Blacksmith Linux runner ขนาดเล็กกว่า งาน guard สำหรับ pull request ของมันตั้งใจให้เล็กกว่าโปรไฟล์ตามกำหนดการ: PR ที่ไม่ใช่ดราฟต์จะรันเฉพาะ shard ที่ตรงกับ `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` สำหรับการเปลี่ยนแปลงโค้ดการรันคำสั่ง/model/tool ของ agent และการ dispatch reply, schema/migration/IO ของ config, auth/secrets/sandbox/security, core channel และ runtime ของ bundled channel Plugin, protocol/server-method ของ Gateway, runtime/SDK glue ของ memory, MCP/process/outbound delivery, runtime/model catalog ของ provider, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract หรือ reply runtime ของ Plugin SDK การเปลี่ยนแปลง config ของ CodeQL และเวิร์กโฟลว์คุณภาพจะรัน shard คุณภาพของ PR ทั้งสิบสองรายการ

Manual dispatch รับค่า:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

โปรไฟล์แบบแคบเป็น hook สำหรับสอน/วนปรับปรุงเพื่อรัน shard คุณภาพหนึ่งรายการแยกต่างหาก

| หมวดหมู่                                                | พื้นผิว                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ดขอบเขตความปลอดภัยของ auth, secrets, sandbox, Cron และ Gateway                                                                                                |
| `/codeql-critical-quality/config-boundary`              | สัญญาของ schema, migration, normalization และ IO สำหรับ config                                                                                                    |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schema ของ Gateway protocol และสัญญา server method                                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญาการติดตั้งใช้งาน core channel และ bundled channel Plugin                                                                                                     |
| `/codeql-critical-quality/agent-runtime-boundary`       | สัญญา runtime ของการรันคำสั่ง, การ dispatch model/provider, การ dispatch และ queue ของ auto-reply และ ACP control-plane                                           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP servers และ tool bridges, ตัวช่วยการกำกับดูแล process และสัญญา outbound delivery                                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, alias ของ memory Plugin SDK, glue สำหรับเปิดใช้งาน memory runtime และคำสั่ง memory doctor                               |
| `/codeql-critical-quality/session-diagnostics-boundary` | internals ของ reply queue, session delivery queues, ตัวช่วย outbound session binding/delivery, พื้นผิว diagnostic event/log bundle และสัญญา CLI ของ session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | การ dispatch inbound reply ของ Plugin SDK, ตัวช่วย reply payload/chunking/runtime, ตัวเลือก channel reply, delivery queues และตัวช่วย session/thread binding       |
| `/codeql-critical-quality/provider-runtime-boundary`    | normalization ของ model catalog, auth และ discovery ของ provider, การลงทะเบียน provider runtime, provider defaults/catalogs และ registry ของ web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | bootstrap ของ Control UI, local persistence, control flow ของ Gateway และสัญญา runtime ของ task control-plane                                                     |
| `/codeql-critical-quality/web-media-runtime-boundary`   | สัญญา runtime ของ core web fetch/search, media IO, media understanding, image-generation และ media-generation                                                      |
| `/codeql-critical-quality/plugin-boundary`              | สัญญาของ loader, registry, public-surface และ entrypoint ของ Plugin SDK                                                                                           |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | ซอร์ส Plugin SDK ฝั่งแพ็กเกจที่เผยแพร่แล้ว และตัวช่วยสัญญาของแพ็กเกจ plugin                                                                                      |

คุณภาพถูกแยกออกจากความปลอดภัย เพื่อให้ finding ด้านคุณภาพสามารถกำหนดเวลา วัด ปิดใช้งาน หรือขยายได้โดยไม่บดบังสัญญาณด้านความปลอดภัย ควรเพิ่มการขยาย CodeQL สำหรับ Swift, Python และ bundled-plugin กลับเข้ามาเป็นงานติดตามผลแบบกำหนดขอบเขตหรือแบ่ง shard เท่านั้น หลังจากโปรไฟล์แคบมี runtime และสัญญาณที่เสถียรแล้ว

## เวิร์กโฟลว์การบำรุงรักษา

### Docs Agent

เวิร์กโฟลว์ `Docs Agent` เป็น lane การบำรุงรักษา Codex แบบขับเคลื่อนด้วยเหตุการณ์เพื่อให้เอกสารที่มีอยู่สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง land แล้ว ไม่มีตารางเวลาล้วน: การรัน CI จาก push ที่สำเร็จและไม่ใช่ bot บน `main` สามารถ trigger ได้ และ manual dispatch สามารถรันโดยตรงได้ การเรียกใช้จาก workflow-run จะข้ามเมื่อ `main` เดินหน้าต่อแล้ว หรือเมื่อมีการสร้างการรัน Docs Agent แบบไม่ข้ามอีกรายการในชั่วโมงล่าสุด เมื่อรัน มันจะรีวิวช่วง commit ตั้งแต่ SHA ต้นทางของ Docs Agent แบบไม่ข้ามครั้งก่อนจนถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงหนึ่งครั้งสามารถครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมตั้งแต่รอบเอกสารครั้งล่าสุด

### Test Performance Agent

เวิร์กโฟลว์ `Test Performance Agent` เป็น lane การบำรุงรักษา Codex แบบขับเคลื่อนด้วยเหตุการณ์สำหรับ test ที่ช้า ไม่มีตารางเวลาล้วน: การรัน CI จาก push ที่สำเร็จและไม่ใช่ bot บน `main` สามารถ trigger ได้ แต่จะข้ามหากมีการเรียกใช้ workflow-run อีกรายการที่รันไปแล้วหรือกำลังรันอยู่ในวัน UTC นั้น Manual dispatch จะข้าม gate กิจกรรมรายวันนี้ lane นี้สร้างรายงานประสิทธิภาพ Vitest แบบ full-suite grouped, ให้ Codex ทำเฉพาะการแก้ประสิทธิภาพ test ขนาดเล็กที่รักษา coverage ไว้แทนการ refactor กว้าง ๆ จากนั้นรันรายงาน full-suite อีกครั้งและปฏิเสธการเปลี่ยนแปลงที่ลดจำนวน test ผ่านใน baseline หาก baseline มี test ที่ล้มเหลว Codex อาจแก้ได้เฉพาะความล้มเหลวที่ชัดเจน และรายงาน full-suite หลัง agent ต้องผ่านก่อนที่จะ commit อะไร เมื่อ `main` เดินหน้าก่อนที่ bot push จะ land lane นี้จะ rebase patch ที่ตรวจสอบแล้ว, รัน `pnpm check:changed` อีกครั้ง และลอง push ใหม่ patch เก่าที่ conflict จะถูกข้าม ใช้ GitHub-hosted Ubuntu เพื่อให้ Codex action คง posture ความปลอดภัยแบบ drop-sudo เดียวกับ docs agent

### PR ซ้ำหลัง Merge

เวิร์กโฟลว์ `Duplicate PRs After Merge` เป็นเวิร์กโฟลว์ผู้ดูแลแบบแมนนวลสำหรับล้างรายการซ้ำหลัง land ค่าเริ่มต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุไว้ชัดเจนเมื่อ `apply=true` ก่อนแก้ไข GitHub จะตรวจสอบว่า PR ที่ land แล้วถูก merge แล้ว และ PR ซ้ำแต่ละรายการมี either issue ที่อ้างอิงร่วมกัน หรือ hunk ที่เปลี่ยนแปลงทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate ตรวจสอบ local และการ routing ของ changed

ตรรกะ changed-lane แบบ local อยู่ใน `scripts/changed-lanes.mjs` และถูกเรียกใช้โดย `scripts/check-changed.mjs` gate ตรวจสอบ local นั้นเข้มงวดกับขอบเขตสถาปัตยกรรมมากกว่าขอบเขตแพลตฟอร์ม CI แบบกว้าง:

- การเปลี่ยนแปลง production ของ core จะรัน typecheck ของ core prod และ core test รวมถึง lint/guards ของ core;
- การเปลี่ยนแปลงเฉพาะ test ของ core จะรันเฉพาะ typecheck ของ core test รวมถึง lint ของ core;
- การเปลี่ยนแปลง production ของ extension จะรัน typecheck ของ extension prod และ extension test รวมถึง lint ของ extension;
- การเปลี่ยนแปลงเฉพาะ test ของ extension จะรัน typecheck ของ extension test รวมถึง lint ของ extension;
- การเปลี่ยนแปลง Plugin SDK สาธารณะหรือ plugin-contract จะขยายไปยัง typecheck ของ extension เพราะ extensions พึ่งพาสัญญา core เหล่านั้น (การ sweep extension ด้วย Vitest ยังเป็นงาน test ที่ต้องทำอย่างชัดเจน);
- การ bump version ที่เป็น release metadata เท่านั้นจะรัน targeted version/config/root-dependency checks;
- การเปลี่ยนแปลง root/config ที่ไม่รู้จักจะ fail safe ไปยัง check lane ทั้งหมด

การ routing changed-test แบบ local อยู่ใน `scripts/test-projects.test-support.mjs` และตั้งใจให้ถูกกว่า `check:changed`: การแก้ไข test โดยตรงจะรันตัวเอง, การแก้ไขซอร์สจะเลือก explicit mappings ก่อน จากนั้นจึงเป็น sibling tests และ dependents จาก import graph การกำหนดค่า shared group-room delivery เป็นหนึ่งใน explicit mappings: การเปลี่ยนแปลง group visible-reply config, source reply delivery mode หรือ system prompt ของ message-tool จะ route ผ่าน core reply tests รวมถึง regression ด้าน delivery ของ Discord และ Slack เพื่อให้การเปลี่ยนค่า default ร่วมล้มเหลวก่อน push PR ครั้งแรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างทั่วทั้ง harness จนชุด mapped ราคาถูกไม่น่าเชื่อถือพอเป็น proxy

## การตรวจสอบด้วย Testbox

เรียกใช้ Testbox จากรากของรีโพ และควรใช้กล่องใหม่ที่อุ่นเครื่องแล้วสำหรับหลักฐานแบบกว้าง ก่อนใช้เกตที่ช้าบนกล่องที่ถูกนำกลับมาใช้ซ้ำ หมดอายุ หรือเพิ่งรายงานการซิงก์ที่ใหญ่ผิดคาด ให้เรียกใช้ `pnpm testbox:sanity` ภายในกล่องก่อน

การตรวจสอบความสมบูรณ์จะล้มเหลวอย่างรวดเร็วเมื่อไฟล์รากที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short` แสดงการลบไฟล์ที่ติดตามแล้วอย่างน้อย 200 รายการ โดยปกติแล้วหมายความว่าสถานะการซิงก์ระยะไกลไม่ใช่สำเนา PR ที่น่าเชื่อถือ ให้หยุดกล่องนั้นและอุ่นเครื่องกล่องใหม่แทนการดีบักความล้มเหลวของการทดสอบผลิตภัณฑ์ สำหรับ PR ที่ตั้งใจลบจำนวนมาก ให้ตั้งค่า `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับการตรวจสอบความสมบูรณ์รอบนั้น

`pnpm testbox:run` จะยุติการเรียกใช้ Blacksmith CLI ในเครื่องด้วย หากค้างอยู่ในเฟสซิงก์นานเกินห้านาทีโดยไม่มีเอาต์พุตหลังซิงก์ ตั้งค่า `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` เพื่อปิดการ์ดนั้น หรือใช้ค่ามิลลิวินาทีที่มากขึ้นสำหรับ diff ในเครื่องที่ใหญ่ผิดปกติ

Crabbox คือ wrapper กล่องระยะไกลที่รีโพเป็นเจ้าของสำหรับหลักฐาน Linux ของผู้ดูแล ใช้เมื่อการตรวจสอบกว้างเกินไปสำหรับลูปแก้ไขในเครื่อง เมื่อความเท่าเทียมกับ CI สำคัญ หรือเมื่อหลักฐานต้องใช้ความลับ, Docker, เลนแพ็กเกจ, กล่องที่นำกลับมาใช้ซ้ำได้ หรือบันทึกระยะไกล แบ็กเอนด์ OpenClaw ปกติคือ `blacksmith-testbox`; ความจุ AWS/Hetzner ที่เป็นเจ้าของเป็นตัวสำรองสำหรับกรณี Blacksmith ขัดข้อง ปัญหาโควตา หรือการทดสอบความจุที่เป็นเจ้าของโดยชัดเจน

ก่อนเรียกใช้ครั้งแรก ให้ตรวจสอบ wrapper จากรากของรีโพ:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

wrapper ของรีโพจะปฏิเสธไบนารี Crabbox ที่เก่าและไม่ประกาศ `blacksmith-testbox` ส่ง provider อย่างชัดเจนแม้ว่า `.crabbox.yaml` จะมีค่าเริ่มต้นของคลาวด์ที่เป็นเจ้าของอยู่แล้ว

เกตการเปลี่ยนแปลง:

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

เรียกใช้การทดสอบเฉพาะจุดซ้ำ:

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

อ่านสรุป JSON สุดท้าย ฟิลด์ที่มีประโยชน์คือ `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` และ `totalMs` การเรียกใช้ Crabbox แบบครั้งเดียวที่ใช้ Blacksmith เป็นแบ็กเอนด์ควรหยุด Testbox โดยอัตโนมัติ หากการเรียกใช้ถูกขัดจังหวะหรือการล้างข้อมูลไม่ชัดเจน ให้ตรวจสอบกล่องที่ยังทำงานอยู่และหยุดเฉพาะกล่องที่คุณสร้าง:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

ใช้การนำกลับมาใช้ซ้ำเฉพาะเมื่อคุณตั้งใจต้องใช้หลายคำสั่งบนกล่องเดียวกันที่ถูกเตรียมสภาพแวดล้อมไว้แล้ว:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

หาก Crabbox เป็นชั้นที่เสีย แต่ Blacksmith เองยังทำงาน ให้ใช้ Blacksmith โดยตรงเป็นตัวสำรองแบบแคบ:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

ยกระดับไปใช้ความจุ Crabbox ที่เป็นเจ้าของเฉพาะเมื่อ Blacksmith ล่ม ถูกจำกัดโควตา ไม่มีสภาพแวดล้อมที่จำเป็น หรือเป้าหมายคือความจุที่เป็นเจ้าของอย่างชัดเจน:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` เป็นเจ้าของค่าเริ่มต้นของ provider, การซิงก์ และการเตรียมสภาพแวดล้อมผ่าน GitHub Actions สำหรับเลนคลาวด์ที่เป็นเจ้าของ ไฟล์นี้ยกเว้น `.git` ในเครื่อง เพื่อให้สำเนาที่เช็กเอาต์โดย Actions ที่เตรียมสภาพแวดล้อมแล้วยังคงมี metadata Git ระยะไกลของตัวเอง แทนการซิงก์รีโมตและ object store ในเครื่องของผู้ดูแล และยกเว้น artifact รันไทม์/บิลด์ในเครื่องที่ไม่ควรถูกถ่ายโอน `.github/workflows/crabbox-hydrate.yml` เป็นเจ้าของการเช็กเอาต์ การตั้งค่า Node/pnpm การดึง `origin/main` และการส่งต่อสภาพแวดล้อมที่ไม่ใช่ความลับสำหรับคำสั่ง `crabbox run --id <cbx_id>` บนคลาวด์ที่เป็นเจ้าของ

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
