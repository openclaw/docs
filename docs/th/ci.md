---
read_when:
    - คุณต้องทำความเข้าใจว่าเหตุใดงาน CI จึงทำงานหรือไม่ทำงาน
    - คุณกำลังแก้ไขข้อบกพร่องของการตรวจสอบ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการเรียกใช้หรือการเรียกใช้ซ้ำสำหรับการตรวจสอบความถูกต้องของรีลีส
    - คุณกำลังเปลี่ยนการส่งงานของ ClawSweeper หรือการส่งต่อกิจกรรม GitHub
summary: กราฟงาน CI, เกตตามขอบเขต, ชุดครอบการรีลีส และคำสั่งเทียบเท่าในเครื่อง
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-05-02T22:17:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8033b928b26adfa340200ea69fd63d339a6e65c21659b8119a68b23b8b16016
    source_path: ci.md
    workflow: 16
---

CI ของ OpenClaw ทำงานทุกครั้งที่ push ไปยัง `main` และทุก pull request งาน `preflight` จำแนก diff และปิดเลนที่ใช้ทรัพยากรมากเมื่อมีเฉพาะพื้นที่ที่ไม่เกี่ยวข้องเปลี่ยนแปลง การรัน `workflow_dispatch` แบบแมนนวลตั้งใจข้ามการกำหนดขอบเขตแบบอัจฉริยะ และกระจายไปยังกราฟทั้งหมดสำหรับ release candidate และการตรวจสอบแบบกว้าง เลน Android ยังคงเป็นแบบเลือกใช้ผ่าน `include_android` ความครอบคลุมของ Plugin เฉพาะ release อยู่ใน workflow [`Plugin Prerelease`](#plugin-prerelease) แยกต่างหาก และจะรันจาก [`Full Release Validation`](#full-release-validation) หรือการ dispatch แบบแมนนวลที่ระบุชัดเจนเท่านั้น

## ภาพรวม Pipeline

| งาน                              | วัตถุประสงค์                                                                                                             | รันเมื่อใด                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | ตรวจจับการเปลี่ยนแปลงที่เป็น docs-only, ขอบเขตที่เปลี่ยน, extensions ที่เปลี่ยน และสร้าง CI manifest                             | เสมอใน push และ PR ที่ไม่ใช่ draft |
| `security-scm-fast`              | ตรวจจับ private key และตรวจสอบ workflow ผ่าน `zizmor`                                                               | เสมอใน push และ PR ที่ไม่ใช่ draft |
| `security-dependency-audit`      | ตรวจสอบ lockfile ฝั่ง production ที่ไม่ต้องพึ่ง dependency เทียบกับ npm advisories                                                    | เสมอใน push และ PR ที่ไม่ใช่ draft |
| `security-fast`                  | aggregate ที่จำเป็นสำหรับงาน security แบบเร็ว                                                                       | เสมอใน push และ PR ที่ไม่ใช่ draft |
| `check-dependencies`             | รอบ production Knip เฉพาะ dependency พร้อม guard ของ unused-file allowlist                                           | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-artifacts`                | สร้าง `dist/`, Control UI, ตรวจสอบ built-artifact และ artifacts ที่ใช้ซ้ำได้ใน downstream                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-core`               | เลนตรวจความถูกต้องบน Linux แบบเร็ว เช่น bundled/plugin-contract/protocol checks                                        | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-contracts-channels` | ตรวจ channel contract แบบ sharded พร้อมผลตรวจ aggregate ที่เสถียร                                                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-core-test`          | shards การทดสอบ Node หลัก โดยยกเว้นเลน channel, bundled, contract และ extension                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check`                          | เทียบเท่า main local gate แบบ sharded: prod types, lint, guards, test types และ strict smoke                          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check-additional`               | Architecture, boundary, prompt snapshot drift, extension-surface guards, package-boundary และ gateway-watch shards | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-smoke`                    | การทดสอบ smoke ของ built-CLI และ startup-memory smoke                                                                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks`                         | Verifier สำหรับการทดสอบ channel ของ built-artifact                                                                           | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-compat-node22`      | เลน build และ smoke สำหรับความเข้ากันได้กับ Node 22                                                                          | การ dispatch CI แบบแมนนวลสำหรับ release    |
| `check-docs`                     | ตรวจ formatting, lint และ broken-link ของ docs                                                                       | Docs เปลี่ยน                       |
| `skills-python`                  | Ruff + pytest สำหรับ Skills ที่มี Python หนุนหลัง                                                                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python-skill      |
| `checks-windows`                 | การทดสอบ process/path เฉพาะ Windows พร้อม regression ของ shared runtime import specifier                                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows           |
| `macos-node`                     | เลนการทดสอบ TypeScript บน macOS โดยใช้ built artifacts ที่แชร์ร่วมกัน                                                         | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `macos-swift`                    | Swift lint, build และ tests สำหรับแอป macOS                                                                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `android`                        | unit tests ของ Android สำหรับทั้งสอง flavor พร้อม build debug APK หนึ่งรายการ                                                        | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android           |
| `test-performance-agent`         | การปรับแต่ง slow-test ของ Codex รายวันหลังมีกิจกรรมที่เชื่อถือได้                                                           | CI หลักสำเร็จหรือ dispatch แบบแมนนวล |
| `openclaw-performance`           | รายงานประสิทธิภาพ runtime ของ Kova แบบรายวัน/ตามต้องการ พร้อมเลน mock-provider, deep-profile และ GPT 5.4 live           | dispatch ตามกำหนดเวลาและแมนนวล      |

## ลำดับ fail-fast

1. `preflight` ตัดสินใจว่าเลนใดมีอยู่จริงบ้าง logic `docs-scope` และ `changed-scope` เป็นขั้นตอนภายในงานนี้ ไม่ใช่งานแยกต่างหาก
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` ล้มเหลวได้อย่างรวดเร็วโดยไม่ต้องรอ artifact ที่หนักกว่าและงาน platform matrix
3. `build-artifacts` ทำงานทับซ้อนกับเลน Linux แบบเร็ว เพื่อให้ downstream consumers เริ่มได้ทันทีเมื่อ shared build พร้อม
4. เลน platform และ runtime ที่หนักกว่าจะกระจายต่อหลังจากนั้น: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่เป็น `cancelled` เมื่อมี push ใหม่กว่าเข้ามาใน PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่านั่นเป็นสัญญาณรบกวนของ CI เว้นแต่ run ล่าสุดสำหรับ ref เดียวกันจะล้มเหลวด้วย aggregate shard checks ใช้ `!cancelled() && always()` เพื่อให้ยังรายงาน shard failures ตามปกติ แต่ไม่เข้าคิวหลังจาก workflow ทั้งหมดถูกแทนที่ไปแล้ว concurrency key อัตโนมัติของ CI มีเวอร์ชัน (`CI-v7-*`) เพื่อไม่ให้ zombie ฝั่ง GitHub ใน queue group เก่าบล็อกการรัน main ใหม่กว่าได้อย่างไม่มีกำหนด การรัน full-suite แบบแมนนวลใช้ `CI-manual-v1-*` และไม่ยกเลิก run ที่กำลังทำงานอยู่

## ขอบเขตและการ routing

logic ขอบเขตอยู่ใน `scripts/ci-changed-scope.mjs` และครอบคลุมด้วย unit tests ใน `src/scripts/ci-changed-scope.test.ts` Manual dispatch ข้ามการตรวจจับ changed-scope และทำให้ preflight manifest ทำงานเหมือนว่าทุกพื้นที่ที่มีขอบเขตเปลี่ยนไปแล้ว

- **การแก้ไข CI workflow** ตรวจสอบกราฟ Node CI พร้อม workflow linting แต่ไม่บังคับ Windows, Android หรือ macOS native builds ด้วยตัวเอง เลน platform เหล่านั้นยังคงถูกกำหนดขอบเขตไว้กับการเปลี่ยนแปลง source ของ platform
- **การแก้ไขเฉพาะ CI routing, การแก้ไข fixture ของ core-test ราคาถูกบางรายการ และการแก้ไข helper/test-routing ของ plugin contract แบบแคบ** ใช้เส้นทาง manifest แบบ Node-only ที่เร็ว: `preflight`, security และ task `checks-fast-core` เพียงรายการเดียว เส้นทางนั้นข้าม build artifacts, ความเข้ากันได้กับ Node 22, channel contracts, core shards แบบเต็ม, bundled-plugin shards และ guard matrices เพิ่มเติม เมื่อการเปลี่ยนแปลงจำกัดอยู่ที่พื้นผิว routing หรือ helper ที่ task แบบเร็วทดสอบโดยตรง
- **Windows Node checks** ถูกกำหนดขอบเขตไว้กับ process/path wrappers เฉพาะ Windows, helpers ของ npm/pnpm/UI runner, config ของ package manager และพื้นผิว CI workflow ที่รันเลนนั้น การเปลี่ยนแปลง source, Plugin, install-smoke และ test-only ที่ไม่เกี่ยวข้องจะยังอยู่บนเลน Linux Node

ชุดการทดสอบ Node ที่ช้าที่สุดถูกแบ่งหรือถ่วงสมดุลเพื่อให้งานแต่ละรายการยังเล็กโดยไม่จอง runner เกินจำเป็น: channel contracts รันเป็น weighted shards สามชุด, เลน core unit ขนาดเล็กถูกจับคู่, auto-reply รันเป็น workers ที่ถ่วงสมดุลสี่ตัว (โดยแยก subtree ของ reply เป็น shard agent-runner, dispatch และ commands/state-routing) และ agentic gateway/plugin configs ถูกกระจายไปยังงาน agentic Node แบบ source-only ที่มีอยู่แล้ว แทนที่จะรอ built artifacts การทดสอบ browser, QA, media และ Plugin เบ็ดเตล็ดแบบกว้างใช้ Vitest configs เฉพาะของตนเองแทน shared plugin catch-all Include-pattern shards บันทึก timing entries โดยใช้ชื่อ CI shard เพื่อให้ `.artifacts/vitest-shard-timings.json` แยกทั้ง config ออกจาก filtered shard ได้ `check-additional` รวมงาน compile/canary ของ package-boundary ไว้ด้วยกัน และแยก runtime topology architecture ออกจาก gateway watch coverage; boundary guard shard รัน guards อิสระขนาดเล็กของตัวเองพร้อมกันภายในงานเดียว รวมถึง `pnpm prompt:snapshots:check` เพื่อให้ prompt drift ของ Codex happy-path ถูกผูกกับ PR ที่ทำให้เกิดขึ้น Gateway watch, channel tests และ core support-boundary shard รันพร้อมกันภายใน `build-artifacts` หลังจากสร้าง `dist/` และ `dist-runtime/` แล้ว

Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` จากนั้นจึงสร้าง Play debug APK flavor third-party ไม่มี source set หรือ manifest แยกต่างหาก เลน unit-test ของมันยังคง compile flavor พร้อม flags BuildConfig ของ SMS/call-log โดยหลีกเลี่ยงงาน packaging debug APK ซ้ำในทุก push ที่เกี่ยวข้องกับ Android

shard `check-dependencies` รัน `pnpm deadcode:dependencies` (รอบ production Knip เฉพาะ dependency ที่ pin กับ Knip เวอร์ชันล่าสุด โดยปิดอายุ release ขั้นต่ำของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบ unused-file findings ฝั่ง production ของ Knip กับ `scripts/deadcode-unused-files.allowlist.mjs` guard ของ unused-file จะล้มเหลวเมื่อ PR เพิ่มไฟล์ unused ใหม่ที่ยังไม่ถูก review หรือทิ้ง allowlist entry ที่ stale ไว้ ขณะเดียวกันยังรักษาพื้นผิว dynamic Plugin, generated, build, live-test และ package bridge ที่ตั้งใจไว้ซึ่ง Knip ไม่สามารถ resolve แบบ static ได้

## การ forward กิจกรรมของ ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` เป็น bridge ฝั่งเป้าหมายจากกิจกรรมของ repository OpenClaw เข้าสู่ ClawSweeper มันไม่ checkout หรือ execute โค้ด pull request ที่ไม่น่าเชื่อถือ workflow สร้าง GitHub App token จาก `CLAWSWEEPER_APP_PRIVATE_KEY` แล้ว dispatch payloads `repository_dispatch` ขนาดกะทัดรัดไปยัง `openclaw/clawsweeper`

workflow มีสี่เลน:

- `clawsweeper_item` สำหรับคำขอ review issue และ pull request ที่เจาะจง;
- `clawsweeper_comment` สำหรับคำสั่ง ClawSweeper ที่ระบุชัดใน issue comments;
- `clawsweeper_commit_review` สำหรับคำขอ review ระดับ commit บน push ไปยัง `main`;
- `github_activity` สำหรับกิจกรรม GitHub ทั่วไปที่ agent ของ ClawSweeper อาจตรวจสอบ

เลน `github_activity` forward เฉพาะ metadata ที่ normalize แล้ว: event type, action, actor, repository, item number, URL, title, state และ excerpt สั้นสำหรับ comments หรือ reviews เมื่อมีอยู่ มันตั้งใจหลีกเลี่ยงการ forward webhook body แบบเต็ม workflow ฝั่งรับใน `openclaw/clawsweeper` คือ `.github/workflows/github-activity.yml` ซึ่งโพสต์ event ที่ normalize แล้วไปยัง hook ของ OpenClaw Gateway สำหรับ agent ของ ClawSweeper

กิจกรรมทั่วไปเป็นการสังเกต ไม่ใช่การส่งมอบโดยค่าเริ่มต้น agent ของ ClawSweeper ได้รับเป้าหมาย Discord ใน prompt และควรโพสต์ไปยัง `#clawsweeper` เฉพาะเมื่อ event นั้นน่าประหลาดใจ, ดำเนินการได้, มีความเสี่ยง หรือมีประโยชน์เชิงปฏิบัติการ การเปิด, การแก้ไข, ความเคลื่อนไหวของ bot, สัญญาณรบกวน webhook ซ้ำ และ traffic review ปกติควรได้ผลลัพธ์เป็น `NO_REPLY`

ถือว่า GitHub titles, comments, bodies, review text, branch names และ commit messages เป็นข้อมูลที่ไม่น่าเชื่อถือตลอดเส้นทางนี้ สิ่งเหล่านี้เป็น input สำหรับการสรุปและ triage ไม่ใช่คำสั่งสำหรับ workflow หรือ agent runtime

## Manual dispatches

การ dispatch CI ด้วยตนเองจะเรียกใช้กราฟงานเดียวกับ CI ปกติ แต่บังคับเปิดทุก lane ที่อยู่ในขอบเขตที่ไม่ใช่ Android: Linux Node shards, bundled-plugin shards, สัญญา channel, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, การตรวจสอบเอกสาร, Python skills, Windows, macOS และ Control UI i18n การ dispatch CI แบบสแตนด์อโลนด้วยตนเองจะรันเฉพาะ Android เมื่อใช้ `include_android=true`; umbrella สำหรับ release แบบเต็มจะเปิดใช้ Android โดยส่ง `include_android=true` การตรวจสอบ static สำหรับ Plugin prerelease, shard `agentic-plugins` ที่ใช้เฉพาะ release, การ sweep ชุด extension แบบเต็ม และ lane Docker สำหรับ plugin prerelease จะถูกแยกออกจาก CI ชุด Docker prerelease จะรันเฉพาะเมื่อ `Full Release Validation` dispatch workflow `Plugin Prerelease` แยกต่างหากพร้อมเปิด gate release-validation

การรันด้วยตนเองใช้ concurrency group ที่ไม่ซ้ำกัน เพื่อให้ชุดเต็มของ release-candidate ไม่ถูกยกเลิกโดย push หรือ PR run อื่นบน ref เดียวกัน input `target_ref` ที่เป็นตัวเลือกช่วยให้ผู้เรียกที่เชื่อถือได้รันกราฟนั้นกับ branch, tag หรือ commit SHA แบบเต็ม โดยใช้ไฟล์ workflow จาก dispatch ref ที่เลือกไว้

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## รันเนอร์

| รันเนอร์                           | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, งานความปลอดภัยแบบเร็วและ aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจสอบ protocol/contract/bundled แบบเร็ว, การตรวจสอบ channel contract แบบ shard, shard ของ `check` ยกเว้น lint, shard และ aggregate ของ `check-additional`, verifier aggregate สำหรับการทดสอบ Node, การตรวจสอบเอกสาร, Python skills, workflow-sanity, labeler, auto-response; preflight ของ install-smoke ก็ใช้ Ubuntu ที่ GitHub โฮสต์ด้วย เพื่อให้ matrix ของ Blacksmith เข้าคิวได้เร็วขึ้น |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard ของ extension ที่น้ำหนักต่ำกว่า, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` และ `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard การทดสอบ Linux Node, shard การทดสอบ bundled Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (ไวต่อ CPU มากพอที่ 8 vCPU มีต้นทุนมากกว่าสิ่งที่ประหยัดได้); build Docker ของ install-smoke (เวลารอคิว 32-vCPU มีต้นทุนมากกว่าสิ่งที่ประหยัดได้)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; fork จะ fallback ไปที่ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; fork จะ fallback ไปที่ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## ประสิทธิภาพของ OpenClaw

`OpenClaw Performance` คือ workflow ด้านประสิทธิภาพของผลิตภัณฑ์/runtime โดยจะรันทุกวันบน `main` และสามารถ dispatch ด้วยตนเองได้:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

workflow จะติดตั้ง OCM จาก release ที่ pin ไว้ และ Kova จาก input `kova_ref` ที่ pin ไว้ จากนั้นรันสาม lane:

- `mock-provider`: สถานการณ์ diagnostic ของ Kova กับ runtime ที่ build ในเครื่องโดยใช้ auth ปลอมที่กำหนดผลได้และเข้ากันได้กับ OpenAI
- `mock-deep-profile`: การทำโปรไฟล์ CPU/heap/trace สำหรับจุดร้อนของ startup, Gateway และ agent-turn
- `live-gpt54`: agent turn จริงของ OpenAI `openai/gpt-5.4` ซึ่งจะข้ามเมื่อไม่มี `OPENAI_API_KEY`

lane mock-provider ยังรัน source probe แบบ native ของ OpenClaw หลังจาก Kova pass ด้วย: เวลาบูต Gateway และหน่วยความจำในกรณี startup แบบ default, hook และ 50-plugin; loop hello ของ `channel-chat-baseline` แบบ mock-OpenAI ซ้ำๆ; และคำสั่ง startup ของ CLI กับ Gateway ที่บูตแล้ว สรุป Markdown ของ source probe อยู่ที่ `source/index.md` ใน report bundle โดยมี JSON ดิบอยู่ข้างกัน

ทุก lane จะอัปโหลด artifact ของ GitHub เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว workflow จะ commit `report.json`, `report.md`, bundle, `index.md` และ artifact ของ source-probe ไปยัง `openclaw/clawgrit-reports` ภายใต้ `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/` ด้วย pointer ของ branch ปัจจุบันจะถูกเขียนเป็น `openclaw-performance/<ref>/latest-<lane>.json`

## การตรวจสอบ release แบบเต็ม

`Full Release Validation` คือ workflow umbrella แบบ manual สำหรับ “รันทุกอย่างก่อน release” โดยรับ branch, tag หรือ commit SHA แบบเต็ม, dispatch workflow `CI` แบบ manual ด้วย target นั้น, dispatch `Plugin Prerelease` สำหรับหลักฐาน plugin/package/static/Docker ที่ใช้เฉพาะ release และ dispatch `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, ชุดทดสอบ release-path ของ Docker, live/E2E, OpenWebUI, QA Lab parity, Matrix และ lane ของ Telegram เมื่อใช้ `rerun_group=all` และ `release_profile=full` ก็จะรัน `NPM Telegram Beta E2E` กับ artifact `release-package-under-test` จาก release checks ด้วย หลัง publish แล้ว ให้ส่ง `npm_telegram_package_spec` เพื่อรัน lane package ของ Telegram เดิมซ้ำกับ package npm ที่เผยแพร่แล้ว

ดู [การตรวจสอบ release แบบเต็ม](/th/reference/full-release-validation) สำหรับ
matrix ของ stage, ชื่องาน workflow ที่แน่นอน, ความแตกต่างของ profile, artifact และ
handle สำหรับ rerun แบบเฉพาะจุด

`OpenClaw Release Publish` คือ workflow release แบบ manual ที่มีการแก้ไขสถานะ ให้ dispatch
จาก `release/YYYY.M.D` หรือ `main` หลังจากมี release tag แล้ว และหลังจาก
preflight npm ของ OpenClaw สำเร็จแล้ว โดยจะตรวจสอบ `pnpm plugins:sync:check`,
dispatch `Plugin NPM Release` สำหรับ package Plugin ทั้งหมดที่ publish ได้, dispatch
`Plugin ClawHub Release` สำหรับ release SHA เดียวกัน และหลังจากนั้นเท่านั้นจึง dispatch
`OpenClaw NPM Release` พร้อม `preflight_run_id` ที่บันทึกไว้

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

สำหรับหลักฐาน commit ที่ pin ไว้บน branch ที่เปลี่ยนเร็ว ให้ใช้ helper แทน
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

dispatch ref ของ workflow GitHub ต้องเป็น branch หรือ tag ไม่ใช่ commit SHA ดิบ
helper จะ push branch ชั่วคราว `release-ci/<sha>-...` ที่ target SHA,
dispatch `Full Release Validation` จาก ref ที่ pin นั้น, ตรวจสอบว่า
`headSha` ของ workflow ลูกทุกตัวตรงกับ target และลบ branch ชั่วคราวเมื่อ
run เสร็จสิ้น umbrella verifier จะล้มเหลวด้วยหากมี workflow ลูกตัวใดรันที่
SHA ต่างออกไป

`release_profile` ควบคุมขอบเขต live/provider ที่ส่งเข้าไปใน release checks โดย
workflow release แบบ manual จะใช้ค่าเริ่มต้นเป็น `stable`; ใช้ `full` เฉพาะเมื่อคุณ
ตั้งใจต้องการ matrix provider/media แบบ advisory ที่กว้าง

- `minimum` คง lane OpenAI/core ที่เร็วที่สุดและสำคัญต่อ release
- `stable` เพิ่มชุด provider/backend แบบ stable
- `full` รัน matrix provider/media แบบ advisory ที่กว้าง

umbrella จะบันทึก id ของ run ลูกที่ dispatch แล้ว และงานสุดท้าย `Verify full validation` จะตรวจสอบ conclusion ปัจจุบันของ run ลูกอีกครั้ง และผนวกตารางงานที่ช้าที่สุดสำหรับแต่ละ run ลูก หาก workflow ลูกถูก rerun แล้วกลายเป็นเขียว ให้ rerun เฉพาะงาน verifier ของ parent เพื่อรีเฟรชผลลัพธ์ของ umbrella และสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รองรับ `rerun_group` ใช้ `all` สำหรับตัวเลือกการออก release, `ci` สำหรับเฉพาะ child ของ full CI ปกติ, `plugin-prerelease` สำหรับเฉพาะ child ของ Plugin prerelease, `release-checks` สำหรับ child ของ release ทุกตัว หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` หรือ `npm-telegram` บน umbrella วิธีนี้ทำให้การรันซ้ำของ release box ที่ล้มเหลวยังคงมีขอบเขตหลังแก้ไขแบบเจาะจง

`OpenClaw Release Checks` ใช้ workflow ref ที่เชื่อถือได้เพื่อ resolve ref ที่เลือกหนึ่งครั้งเป็น tarball `release-package-under-test` จากนั้นส่ง artifact นั้นไปยังทั้ง workflow Docker สำหรับเส้นทาง release แบบ live/E2E และ shard การยอมรับแพ็กเกจ วิธีนี้ทำให้ byte ของแพ็กเกจสอดคล้องกันใน release box ต่าง ๆ และหลีกเลี่ยงการ pack ตัวเลือกเดิมซ้ำใน child job หลายรายการ

การรัน `Full Release Validation` ซ้ำสำหรับ `ref=main` และ `rerun_group=all`
จะแทนที่ umbrella ที่เก่ากว่า parent monitor จะยกเลิก child workflow ใด ๆ ที่
ได้ dispatch ไปแล้วเมื่อ parent ถูกยกเลิก ดังนั้นการตรวจสอบ main ที่ใหม่กว่า
จะไม่ค้างอยู่หลัง release-check run เก่าสองชั่วโมง การตรวจสอบ release branch/tag
และกลุ่ม rerun แบบเจาะจงยังคงใช้ `cancel-in-progress: false`

## shard แบบ Live และ E2E

child แบบ live/E2E ของ release ยังคงให้ความครอบคลุม `pnpm test:live` native แบบกว้าง แต่รันเป็น shard ที่มีชื่อผ่าน `scripts/test-live-shard.mjs` แทนที่จะเป็น job เดี่ยวแบบ serial:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- job `native-live-src-gateway-profiles` ที่กรองตาม provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shard media audio/video ที่แยกไว้ และ shard music ที่กรองตาม provider

วิธีนี้คงความครอบคลุมไฟล์เดิมไว้ พร้อมทำให้ความล้มเหลวของ live provider ที่ช้าสามารถรันซ้ำและวินิจฉัยได้ง่ายขึ้น ชื่อ shard แบบรวม `native-live-extensions-o-z`, `native-live-extensions-media` และ `native-live-extensions-media-music` ยังคงใช้ได้สำหรับการ rerun ด้วยตนเองแบบครั้งเดียว

shard native live media รันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งสร้างโดย workflow `Live Media Runner Image` image นั้นติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้าแล้ว; job media ตรวจสอบเฉพาะ binary ก่อน setup เท่านั้น ให้เก็บ suite live ที่รองรับด้วย Docker ไว้บน runner Blacksmith ปกติ — container job ไม่ใช่ที่ที่เหมาะสำหรับเปิด nested Docker tests

shard model/backend แบบ live ที่รองรับด้วย Docker ใช้ image ร่วมแยกต่างหาก `ghcr.io/openclaw/openclaw-live-test:<sha>` หนึ่งชุดต่อ commit ที่เลือก workflow live release จะ build และ push image นั้นครั้งเดียว จากนั้น shard Docker live model, Gateway ที่แบ่งตาม provider, CLI backend, ACP bind และ Codex harness จะรันด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` shard Docker ของ Gateway มีขีดจำกัด `timeout` ระดับสคริปต์อย่างชัดเจนที่ต่ำกว่า timeout ของ workflow job เพื่อให้ container ที่ค้างหรือเส้นทาง cleanup ที่ค้างล้มเหลวได้เร็ว แทนที่จะใช้ budget release-check ทั้งหมด หาก shard เหล่านั้น rebuild target Docker ของ source เต็มเองอย่างอิสระ แปลว่า release run ถูกกำหนดค่าผิดและจะเสีย wall clock ไปกับการ build image ซ้ำ

## การยอมรับแพ็กเกจ

ใช้ `Package Acceptance` เมื่อคำถามคือ "แพ็กเกจ OpenClaw ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์หรือไม่" สิ่งนี้ต่างจาก CI ปกติ: CI ปกติตรวจสอบ source tree ส่วนการยอมรับแพ็กเกจตรวจสอบ tarball เดี่ยวผ่าน Docker E2E harness เดียวกับที่ผู้ใช้ใช้งานหลัง install หรือ update

### งาน

1. `resolve_package` checkout `workflow_ref`, resolve package candidate หนึ่งรายการ, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, อัปโหลดทั้งคู่เป็น artifact `package-under-test` และพิมพ์ source, workflow ref, package ref, version, SHA-256 และ profile ในสรุปขั้นตอนของ GitHub
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` reusable workflow จะดาวน์โหลด artifact นั้น, ตรวจสอบ inventory ของ tarball, เตรียม image Docker แบบ package-digest เมื่อจำเป็น และรัน lane Docker ที่เลือกกับแพ็กเกจนั้นแทนการ pack workflow checkout เมื่อ profile เลือก `docker_lanes` แบบเจาะจงหลายรายการ reusable workflow จะเตรียมแพ็กเกจและ image ร่วมครั้งเดียว แล้ว fan out lane เหล่านั้นเป็น job Docker แบบเจาะจงที่รันขนานกันพร้อม artifact ที่ไม่ซ้ำกัน
3. `package_telegram` เรียก `NPM Telegram Beta E2E` แบบเลือกได้ โดยจะรันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้ง artifact `package-under-test` เดียวกันเมื่อการยอมรับแพ็กเกจ resolve ไว้แล้ว; การ dispatch Telegram แบบ standalone ยังสามารถติดตั้ง published npm spec ได้
4. `summary` ทำให้ workflow ล้มเหลวหากการ resolve แพ็กเกจ, Docker acceptance หรือ lane Telegram แบบเลือกได้ล้มเหลว

### แหล่งที่มาของ candidate

- `source=npm` ยอมรับเฉพาะ `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` หรือ OpenClaw release version แบบ exact เช่น `openclaw@2026.4.27-beta.2` ใช้สิ่งนี้สำหรับ prerelease/stable acceptance ที่เผยแพร่แล้ว
- `source=ref` pack branch, tag หรือ full commit SHA ของ `package_ref` ที่เชื่อถือได้ resolver จะ fetch branch/tag ของ OpenClaw, ตรวจสอบว่า commit ที่เลือกเข้าถึงได้จากประวัติ branch ของ repository หรือ release tag, ติดตั้ง deps ใน detached worktree แล้ว pack ด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` ดาวน์โหลด HTTPS `.tgz`; ต้องมี `package_sha256`
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งรายการจาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็น optional แต่ควรระบุสำหรับ artifact ที่แชร์ภายนอก

แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือ code workflow/harness ที่เชื่อถือได้ซึ่งรันการทดสอบ `package_ref` คือ source commit ที่จะถูก pack เมื่อ `source=ref` วิธีนี้ทำให้ test harness ปัจจุบันตรวจสอบ source commit เก่าที่เชื่อถือได้โดยไม่ต้องรัน logic workflow เก่า

### โปรไฟล์ suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` บวก `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk เส้นทาง Docker release แบบเต็มพร้อม OpenWebUI
- `custom` — `docker_lanes` แบบ exact; จำเป็นเมื่อ `suite_profile=custom`

profile `package` ใช้ความครอบคลุม Plugin แบบ offline เพื่อให้การตรวจสอบแพ็กเกจที่เผยแพร่แล้วไม่ถูก gate ด้วยความพร้อมใช้งานของ ClawHub แบบ live lane Telegram แบบ optional ใช้ artifact `package-under-test` ซ้ำใน `NPM Telegram Beta E2E` โดยคงเส้นทาง published npm spec ไว้สำหรับ dispatch แบบ standalone

สำหรับนโยบายการทดสอบ update และ Plugin โดยเฉพาะ รวมถึงคำสั่ง local,
lane Docker, input ของการยอมรับแพ็กเกจ, ค่า default ของ release และการ triage ความล้มเหลว,
ดู [การทดสอบ update และ Plugin](/th/help/testing-updates-plugins)

release checks เรียกการยอมรับแพ็กเกจด้วย `source=artifact`, artifact แพ็กเกจ release ที่เตรียมไว้, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` และ `telegram_mode=mock-openai` วิธีนี้ทำให้ proof สำหรับ package migration, update, cleanup dependency ของ Plugin เก่า, การซ่อม install ของ Plugin ที่กำหนดค่าไว้, offline Plugin, plugin-update และ Telegram อยู่บน package tarball ที่ resolve เดียวกัน ตั้งค่า `package_acceptance_package_spec` บน Full Release Validation หรือ OpenClaw Release Checks เพื่อรัน matrix เดียวกันนั้นกับแพ็กเกจ npm ที่จัดส่งแล้วแทน artifact ที่ build จาก SHA cross-OS release checks ยังคงครอบคลุม onboarding, installer และพฤติกรรม platform เฉพาะ OS; การตรวจสอบผลิตภัณฑ์ด้าน package/update ควรเริ่มจากการยอมรับแพ็กเกจ lane Docker `published-upgrade-survivor` ตรวจสอบ baseline แพ็กเกจที่เผยแพร่แล้วหนึ่งรายการต่อการรัน ในการยอมรับแพ็กเกจ tarball `package-under-test` ที่ resolve แล้วเป็น candidate เสมอ และ `published_upgrade_survivor_baseline` เลือก fallback published baseline โดยค่า default เป็น `openclaw@latest`; คำสั่ง rerun ของ lane ที่ล้มเหลวจะรักษา baseline นั้นไว้ ตั้งค่า `published_upgrade_survivor_baselines=all-since-2026.4.23` เพื่อขยาย Full Release CI ให้ครอบคลุม stable npm release ทุกตัวตั้งแต่ `2026.4.23` ถึง `latest`; `release-history` ยังคงมีให้ใช้สำหรับการสุ่มตัวอย่างที่กว้างขึ้นด้วยตนเองโดยใช้ anchor pre-date แบบเก่า ตั้งค่า `published_upgrade_survivor_scenarios=reported-issues` เพื่อขยาย baseline เดียวกันให้ครอบคลุม fixture ที่มีรูปแบบตาม issue สำหรับ config Feishu, ไฟล์ bootstrap/persona ที่รักษาไว้, การ install OpenClaw Plugin ที่กำหนดค่าไว้, เส้นทาง log แบบ tilde และ root dependency ของ legacy Plugin ที่เก่า workflow `Update Migration` แยกต่างหากใช้ lane Docker `update-migration` กับ `all-since-2026.4.23` และ `plugin-deps-cleanup` เมื่อคำถามคือการ cleanup update ที่เผยแพร่แล้วอย่างครอบคลุม ไม่ใช่ความกว้างของ Full Release CI ปกติ การรัน aggregate local สามารถส่ง package spec แบบ exact ด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, คง lane เดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` เช่น `openclaw@2026.4.15` หรือตั้งค่า `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` สำหรับ scenario matrix lane ที่เผยแพร่แล้วกำหนดค่า baseline ด้วย recipe คำสั่ง `openclaw config set` ที่ bake ไว้, บันทึกขั้นตอน recipe ใน `summary.json` และ probe `/healthz`, `/readyz` รวมถึงสถานะ RPC หลัง Gateway เริ่มต้น lane fresh ของแพ็กเกจและ installer บน Windows ยังตรวจสอบด้วยว่าแพ็กเกจที่ติดตั้งแล้วสามารถ import browser-control override จากเส้นทาง Windows absolute แบบ raw ได้ smoke agent-turn ข้าม OS ของ OpenAI ใช้ค่า default เป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อมีการตั้งค่า มิฉะนั้นใช้ `openai/gpt-5.4` เพื่อให้ proof ของ install และ Gateway ยังอยู่บนโมเดลทดสอบ GPT-5 พร้อมหลีกเลี่ยงค่า default ของ GPT-4.x

### ช่วงความเข้ากันได้กับ legacy

การยอมรับแพ็กเกจมีช่วงความเข้ากันได้กับ legacy แบบมีขอบเขตสำหรับแพ็กเกจที่เผยแพร่แล้ว แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้เส้นทาง compatibility:

- รายการ QA private ที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ถูกละไว้จาก tarball;
- `doctor-switch` อาจข้าม subcase การ persistence ของ `gateway install --wrapper` เมื่อแพ็กเกจไม่ expose flag นั้น;
- `update-channel-switch` อาจ prune `pnpm.patchedDependencies` ที่หายไปจาก fake git fixture ที่ได้จาก tarball และอาจ log `update.channel` ที่ persist ไว้แล้วแต่หายไป;
- smoke ของ Plugin อาจอ่านตำแหน่ง install-record แบบ legacy หรือยอมรับการ persistence ของ marketplace install-record ที่หายไป;
- `plugin-update` อาจอนุญาตการ migration ของ config metadata ในขณะที่ยังคงกำหนดให้ install record และพฤติกรรม no-reinstall ไม่เปลี่ยนแปลง

แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ stamp ของ local build metadata ที่จัดส่งไปแล้วด้วย แพ็กเกจที่ใหม่กว่าต้องเป็นไปตาม contract สมัยใหม่; เงื่อนไขเดียวกันจะ fail แทนที่จะ warn หรือ skip

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

เมื่อดีบักการรันการยอมรับแพ็กเกจที่ล้มเหลว ให้เริ่มที่สรุป `resolve_package` เพื่อยืนยันแหล่งที่มาของแพ็กเกจ เวอร์ชัน และ SHA-256 จากนั้นตรวจสอบการรันลูก `docker_acceptance` และอาร์ติแฟกต์ Docker ของมัน: `.artifacts/docker-tests/**/summary.json`, `failures.json`, ล็อกของเลน, เวลาของเฟส และคำสั่งรันซ้ำ ควรรันโปรไฟล์แพ็กเกจที่ล้มเหลวหรือเลน Docker ที่ตรงกันซ้ำ แทนที่จะรันการตรวจสอบความถูกต้องของรีลีสทั้งหมดซ้ำ

## การทดสอบ smoke การติดตั้ง

เวิร์กโฟลว์ `Install Smoke` แยกต่างหากใช้สคริปต์ขอบเขตเดียวกันซ้ำผ่านงาน `preflight` ของตัวเอง โดยแบ่งความครอบคลุมแบบ smoke เป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **เส้นทางเร็ว** ทำงานสำหรับ pull request ที่แตะพื้นผิว Docker/แพ็กเกจ การเปลี่ยนแปลงแพ็กเกจ/manifest ของ Plugin ที่บันเดิลมา หรือพื้นผิว Plugin/ช่องทาง/Gateway/Plugin SDK หลักที่งาน Docker smoke ทดสอบ การเปลี่ยนแปลง Plugin ที่บันเดิลมาเฉพาะซอร์ส การแก้ไขเฉพาะการทดสอบ และการแก้ไขเฉพาะเอกสารจะไม่จอง Docker worker เส้นทางเร็วจะสร้างอิมเมจ Dockerfile รากหนึ่งครั้ง ตรวจสอบ CLI รัน agents delete shared-workspace CLI smoke รัน container gateway-network e2e ตรวจสอบอาร์กิวเมนต์บิลด์ของส่วนขยายที่บันเดิลมา และรันโปรไฟล์ Docker ของ bundled-plugin แบบมีขอบเขตภายใต้เวลาหมดอายุคำสั่งรวม 240 วินาที (การรัน Docker ของแต่ละสถานการณ์ถูกจำกัดแยกกัน)
- **เส้นทางเต็ม** เก็บความครอบคลุมการติดตั้งแพ็กเกจ QR และ Docker/update ของตัวติดตั้งไว้สำหรับการรันตามกำหนดการรายคืน การสั่งรันด้วยตนเอง การตรวจสอบรีลีสแบบ workflow-call และ pull request ที่แตะพื้นผิวตัวติดตั้ง/แพ็กเกจ/Docker จริงๆ ในโหมดเต็ม install-smoke จะเตรียมหรือใช้อิมเมจ smoke ของ Dockerfile ราก GHCR ตาม target-SHA หนึ่งรายการซ้ำ จากนั้นรันการติดตั้งแพ็กเกจ QR, smoke ของ Dockerfile/Gateway ราก, smoke ของตัวติดตั้ง/update และ Docker E2E แบบเร็วของ bundled-plugin เป็นงานแยกกัน เพื่อให้งานตัวติดตั้งไม่ต้องรอหลัง smoke ของอิมเมจราก

การ push ไปยัง `main` (รวมถึง merge commit) ไม่บังคับใช้เส้นทางเต็ม เมื่อโลจิกขอบเขตการเปลี่ยนแปลงจะขอความครอบคลุมเต็มในการ push เวิร์กโฟลว์จะคง Docker smoke แบบเร็วไว้ และปล่อย install smoke แบบเต็มให้กับการตรวจสอบรายคืนหรือการตรวจสอบความถูกต้องของรีลีส

smoke ของ image-provider สำหรับการติดตั้ง Bun global ที่ช้านั้นถูกคุมแยกด้วย `run_bun_global_install_smoke` โดยทำงานตามกำหนดการรายคืนและจากเวิร์กโฟลว์ release checks และการสั่งรัน `Install Smoke` ด้วยตนเองสามารถเลือกใช้ได้ แต่ pull request และการ push ไปยัง `main` จะไม่ทำ การทดสอบ Docker ของ QR และตัวติดตั้งยังคงใช้ Dockerfile ที่เน้นการติดตั้งของตัวเอง

## Docker E2E แบบโลคัล

`pnpm test:docker:all` สร้างอิมเมจ live-test ที่ใช้ร่วมกันล่วงหน้าหนึ่งรายการ แพ็ก OpenClaw หนึ่งครั้งเป็น npm tarball และสร้างอิมเมจ `scripts/e2e/Dockerfile` ที่ใช้ร่วมกันสองรายการ:

- ตัวรัน Node/Git เปล่าสำหรับเลน installer/update/plugin-dependency;
- อิมเมจใช้งานจริงที่ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับเลนฟังก์ชันปกติ

นิยามเลน Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, โลจิกตัววางแผนอยู่ใน `scripts/lib/docker-e2e-plan.mjs` และตัวรันจะดำเนินการเฉพาะแผนที่เลือกเท่านั้น ตัวจัดตารางเลือกอิมเมจต่อเลนด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` จากนั้นรันเลนด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### ค่าที่ปรับได้

| ตัวแปร                                 | ค่าเริ่มต้น | วัตถุประสงค์                                                                                  |
| -------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | จำนวนสล็อตของพูลหลักสำหรับเลนปกติ                                                            |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | จำนวนสล็อตของพูลท้ายที่ไวต่อผู้ให้บริการ                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | เพดานเลน live พร้อมกันเพื่อไม่ให้ผู้ให้บริการจำกัดความเร็ว                                   |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10          | เพดานเลน npm install พร้อมกัน                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | เพดานเลนหลายบริการพร้อมกัน                                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | การหน่วงระหว่างการเริ่มเลนเพื่อหลีกเลี่ยงพายุการสร้างของ Docker daemon; ตั้ง `0` เพื่อไม่หน่วง |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | เวลาหมดอายุสำรองต่อเลน (120 นาที); เลน live/tail ที่เลือกใช้เพดานที่เข้มกว่า                |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset       | `1` พิมพ์แผนของตัวจัดตารางโดยไม่รันเลน                                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset       | รายการเลนที่ตรงกันคั่นด้วยจุลภาค; ข้าม cleanup smoke เพื่อให้เอเจนต์ทำซ้ำเลนที่ล้มเหลวหนึ่งเลนได้ |

เลนที่หนักกว่าเพดานที่มีผลของตัวเองยังสามารถเริ่มจากพูลว่างได้ จากนั้นจะรันลำพังจนกว่าจะปล่อยความจุ preflight รวมแบบโลคัลตรวจสอบ Docker, ลบคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่, แสดงสถานะเลนที่ทำงานอยู่, บันทึกเวลาของเลนเพื่อจัดลำดับยาวที่สุดก่อน และหยุดจัดตารางเลนใหม่ในพูลหลังความล้มเหลวแรกตามค่าเริ่มต้น

### เวิร์กโฟลว์ live/E2E ที่ใช้ซ้ำได้

เวิร์กโฟลว์ live/E2E ที่ใช้ซ้ำได้ถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องใช้ความครอบคลุมของแพ็กเกจ ชนิดอิมเมจ อิมเมจ live เลน และข้อมูลประจำตัวใด `scripts/docker-e2e.mjs` จะแปลงแผนนั้นเป็นเอาต์พุตและสรุปของ GitHub จากนั้นจะเลือกแพ็ก OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลดอาร์ติแฟกต์แพ็กเกจจากการรันปัจจุบัน หรือดาวน์โหลดอาร์ติแฟกต์แพ็กเกจจาก `package_artifact_run_id`; ตรวจสอบ inventory ของ tarball; สร้างและ push อิมเมจ GHCR Docker E2E แบบ bare/functional ที่ติดแท็กด้วย digest ของแพ็กเกจผ่านแคชเลเยอร์ Docker ของ Blacksmith เมื่อแผนต้องใช้เลนที่ติดตั้งแพ็กเกจแล้ว; และใช้อินพุต `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรืออิมเมจ package-digest ที่มีอยู่ แทนการสร้างใหม่ การดึงอิมเมจ Docker จะ retry ด้วยเวลาหมดอายุต่อความพยายามแบบมีขอบเขต 180 วินาที เพื่อให้สตรีม registry/cache ที่ค้าง retry ได้เร็ว แทนที่จะกินเวลาส่วนใหญ่ของเส้นทางวิกฤตใน CI

### ชังก์ของเส้นทางรีลีส

ความครอบคลุม Docker ของรีลีสรันงานแบบแบ่งชังก์ที่เล็กลงด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละชังก์ดึงเฉพาะชนิดอิมเมจที่ต้องใช้และดำเนินการหลายเลนผ่านตัวจัดตารางแบบถ่วงน้ำหนักเดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

ชังก์ Docker ของรีลีสปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` และ `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` ส่วน `plugins-runtime-core`, `plugins-runtime` และ `plugins-integrations` ยังคงเป็นนามแฝงรวมของ plugin/runtime นามแฝงเลน `install-e2e` ยังคงเป็นนามแฝงรันซ้ำด้วยตนเองแบบรวมสำหรับเลนตัวติดตั้งของผู้ให้บริการทั้งสอง

OpenWebUI ถูกรวมเข้าใน `plugins-runtime-services` เมื่อความครอบคลุม release-path แบบเต็มร้องขอ และคงชังก์ `openwebui` แบบเดี่ยวไว้เฉพาะการสั่งรันที่เป็น OpenWebUI-only เท่านั้น เลนอัปเดตของช่องทางที่บันเดิลมาจะ retry หนึ่งครั้งสำหรับความล้มเหลวเครือข่าย npm ชั่วคราว

แต่ละชังก์อัปโหลด `.artifacts/docker-tests/` พร้อมล็อกของเลน เวลา `summary.json`, `failures.json`, เวลาของเฟส, JSON แผนตัวจัดตาราง, ตารางเลนช้า และคำสั่งรันซ้ำต่อเลน อินพุต `docker_lanes` ของเวิร์กโฟลว์รันเลนที่เลือกกับอิมเมจที่เตรียมไว้แทนงานชังก์ ซึ่งทำให้การดีบักเลนที่ล้มเหลวถูกจำกัดไว้ที่งาน Docker เป้าหมายหนึ่งงาน และเตรียม ดาวน์โหลด หรือใช้อาร์ติแฟกต์แพ็กเกจซ้ำสำหรับการรันนั้น หากเลนที่เลือกเป็นเลน Docker แบบ live งานเป้าหมายจะสร้างอิมเมจ live-test แบบโลคัลสำหรับการรันซ้ำนั้น คำสั่งรันซ้ำ GitHub ต่อเลนที่สร้างขึ้นจะรวม `package_artifact_run_id`, `package_artifact_name` และอินพุตอิมเมจที่เตรียมไว้เมื่อมีค่าเหล่านั้น เพื่อให้เลนที่ล้มเหลวใช้งานแพ็กเกจและอิมเมจที่ตรงกันจากการรันที่ล้มเหลวซ้ำได้

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

เวิร์กโฟลว์ live/E2E ตามกำหนดการรันชุด Docker release-path เต็มทุกวัน

## Prerelease ของ Plugin

`Plugin Prerelease` เป็นความครอบคลุม product/package ที่มีต้นทุนสูงกว่า จึงเป็นเวิร์กโฟลว์แยกต่างหากที่สั่งรันโดย `Full Release Validation` หรือโดยผู้ปฏิบัติการอย่างชัดเจน pull request ปกติ การ push ไปยัง `main` และการสั่งรัน CI ด้วยตนเองแบบเดี่ยวจะปิดชุดทดสอบนั้นไว้ มันกระจายการทดสอบ Plugin ที่บันเดิลมาข้าม worker ส่วนขยายแปดตัว งาน shard ของส่วนขยายเหล่านั้นรันกลุ่ม config ของ Plugin ได้สูงสุดครั้งละสองกลุ่ม โดยมี Vitest worker หนึ่งตัวต่อกลุ่มและ Node heap ที่ใหญ่ขึ้น เพื่อให้แบตช์ Plugin ที่นำเข้าหนักไม่สร้างงาน CI เพิ่มเติม เส้นทาง prerelease ของ Docker เฉพาะรีลีสจะแบตช์เลน Docker เป้าหมายเป็นกลุ่มเล็กๆ เพื่อหลีกเลี่ยงการจอง runner หลายสิบตัวสำหรับงานหนึ่งถึงสามนาที

## QA Lab

QA Lab มีเลน CI เฉพาะภายนอกเวิร์กโฟลว์หลักที่กำหนดขอบเขตอย่างชาญฉลาด ความเท่าเทียมแบบ agentic ซ้อนอยู่ภายใต้ harness ของ QA และรีลีสแบบกว้าง ไม่ใช่เวิร์กโฟลว์ PR แบบเดี่ยว ใช้ `Full Release Validation` พร้อม `rerun_group=qa-parity` เมื่อควรให้ความเท่าเทียมติดไปกับการรันการตรวจสอบความถูกต้องแบบกว้าง

- เวิร์กโฟลว์ `QA-Lab - All Lanes` รันทุกคืนบน `main` และเมื่อสั่งรันด้วยตนเอง โดยแยกเลน mock parity, เลน Matrix แบบ live และเลน Telegram และ Discord แบบ live เป็นงานคู่ขนาน งาน live ใช้ environment `qa-live-shared` และ Telegram/Discord ใช้ lease ของ Convex

Release checks รันเลน transport แบบ live ของ Matrix และ Telegram ด้วยผู้ให้บริการ mock แบบกำหนดผลซ้ำได้และโมเดลที่ผ่านคุณสมบัติ mock (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อแยกสัญญาของช่องทางออกจากความหน่วงของโมเดล live และการเริ่มต้น provider-plugin ปกติ Gateway transport แบบ live ปิดการค้นหาหน่วยความจำ เพราะ QA parity ครอบคลุมพฤติกรรมหน่วยความจำแยกต่างหากแล้ว การเชื่อมต่อผู้ให้บริการถูกครอบคลุมโดยชุดทดสอบโมเดล live, ผู้ให้บริการ native และผู้ให้บริการ Docker แยกต่างหาก

Matrix ใช้ `--profile fast` สำหรับ gate ตามกำหนดการและรีลีส โดยเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout รองรับ ค่าเริ่มต้นของ CLI และอินพุตเวิร์กโฟลว์แบบ manual ยังคงเป็น `all`; การสั่งรัน manual `matrix_profile=all` จะแยกความครอบคลุม Matrix เต็มเป็นงาน `transport`, `media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรันเลน QA Lab ที่สำคัญต่อรีลีสก่อนการอนุมัติรีลีสด้วย; gate ของ QA parity จะรันแพ็ก candidate และ baseline เป็นงานเลนคู่ขนาน จากนั้นดาวน์โหลดอาร์ติแฟกต์ทั้งสองเข้าไปยังงานรายงานขนาดเล็กสำหรับการเปรียบเทียบ parity ขั้นสุดท้าย

สำหรับ PR ปกติ ให้ใช้หลักฐาน CI/check ตามขอบเขต แทนที่จะถือว่า parity เป็นสถานะที่จำเป็น

## CodeQL

เวิร์กโฟลว์ `CodeQL` ตั้งใจให้เป็นตัวสแกนความปลอดภัยรอบแรกแบบขอบเขตแคบ ไม่ใช่การกวาดทั้งรีโพซิทอรีแบบเต็มรูปแบบ การรันตัวป้องกันรายวัน แบบแมนนวล และสำหรับ pull request ที่ไม่ใช่ฉบับร่าง จะสแกนโค้ดเวิร์กโฟลว์ Actions รวมถึงพื้นผิว JavaScript/TypeScript ที่มีความเสี่ยงสูงสุด ด้วยคิวรีความปลอดภัยความเชื่อมั่นสูงที่กรองเฉพาะ `security-severity` ระดับสูง/วิกฤต

ตัวป้องกัน pull request คงไว้ให้เบา: เริ่มทำงานเฉพาะเมื่อมีการเปลี่ยนแปลงใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` หรือ `src` และรันเมทริกซ์ความปลอดภัยความเชื่อมั่นสูงชุดเดียวกับเวิร์กโฟลว์ตามกำหนดเวลา Android และ macOS CodeQL ไม่อยู่ในค่าเริ่มต้นของ PR

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                         | พื้นผิว                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron และ baseline ของ gateway                                                                              |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการทำงานของช่องทางหลัก รวมถึง runtime ของ channel plugin, gateway, Plugin SDK, secrets และจุดสัมผัส audit                  |
| `/codeql-security-high/network-ssrf-boundary`     | พื้นผิวนโยบาย SSRF ของ core, การแยกวิเคราะห์ IP, network guard, web-fetch และ Plugin SDK                                        |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, ตัวช่วยการประมวลผล process, การส่งออกภายนอก และด่านกั้นการรันเครื่องมือของ agent                                  |
| `/codeql-security-high/plugin-trust-boundary`     | พื้นผิวความเชื่อถือของการติดตั้ง Plugin, loader, manifest, registry, การติดตั้ง package-manager, source-loading และสัญญา package ของ Plugin SDK |

### ชาร์ดความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — ชาร์ดความปลอดภัย Android ตามกำหนดเวลา สร้างแอป Android แบบแมนนวลสำหรับ CodeQL บน Blacksmith Linux runner ที่เล็กที่สุดซึ่ง workflow sanity ยอมรับ อัปโหลดใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — ชาร์ดความปลอดภัย macOS รายสัปดาห์/แมนนวล สร้างแอป macOS แบบแมนนวลสำหรับ CodeQL บน Blacksmith macOS กรองผลลัพธ์ build ของ dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดใต้ `/codeql-critical-security/macos` เก็บไว้นอกค่าเริ่มต้นรายวันเพราะ build ของ macOS ครอง runtime แม้เมื่อสะอาด

### หมวดหมู่คุณภาพวิกฤต

`CodeQL Critical Quality` เป็นชาร์ดฝั่ง non-security ที่เข้าคู่กัน โดยรันเฉพาะคิวรีคุณภาพ JavaScript/TypeScript ที่ไม่ใช่ด้านความปลอดภัยและมี severity ระดับ error บนพื้นผิวมูลค่าสูงแบบขอบเขตแคบ บน Blacksmith Linux runner ที่เล็กกว่า ตัวป้องกัน pull request ของมันตั้งใจให้เล็กกว่าโปรไฟล์ตามกำหนดเวลา: PR ที่ไม่ใช่ฉบับร่างจะรันเฉพาะชาร์ด `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` ที่เกี่ยวข้องสำหรับการเปลี่ยนแปลงโค้ดการรันคำสั่ง/model/tool ของ agent และการ dispatch การตอบกลับ, โค้ด schema/migration/IO ของ config, โค้ด auth/secrets/sandbox/security, runtime ของช่องทางหลักและ channel plugin ที่ bundled, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, runtime ของ provider/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract หรือ runtime การตอบกลับของ Plugin SDK การเปลี่ยนแปลง CodeQL config และ quality workflow จะรันชาร์ดคุณภาพ PR ทั้งสิบสองรายการ

การ dispatch แบบแมนนวลยอมรับ:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

โปรไฟล์ขอบเขตแคบเป็น hook สำหรับการสอน/การทำซ้ำ เพื่อรันชาร์ดคุณภาพหนึ่งรายการแบบแยกเดี่ยว

| หมวดหมู่                                               | พื้นผิว                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ดขอบเขตความปลอดภัยของ auth, secrets, sandbox, cron และ gateway                                                                                              |
| `/codeql-critical-quality/config-boundary`              | สัญญาของ config schema, migration, normalization และ IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schema ของ Gateway protocol และสัญญา server method                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญาการทำงานของ core channel และ bundled channel plugin                                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | สัญญา runtime ของ command execution, model/provider dispatch, auto-reply dispatch และ queues และ ACP control-plane                                             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP servers และ tool bridges, ตัวช่วย process supervision และสัญญา outbound delivery                                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, aliases ของ memory Plugin SDK, glue สำหรับเปิดใช้งาน memory runtime และคำสั่ง memory doctor                          |
| `/codeql-critical-quality/session-diagnostics-boundary` | internals ของ reply queue, session delivery queues, ตัวช่วย outbound session binding/delivery, พื้นผิว diagnostic event/log bundle และสัญญา session doctor CLI |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin SDK inbound reply dispatch, payload/chunking/runtime helpers ของ reply, channel reply options, delivery queues และตัวช่วย session/thread binding        |
| `/codeql-critical-quality/provider-runtime-boundary`    | การ normalize model catalog, auth และ discovery ของ provider, การลงทะเบียน runtime ของ provider, defaults/catalogs ของ provider และ registries ของ web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | การ bootstrap ของ Control UI, local persistence, control flows ของ gateway และสัญญา runtime ของ task control-plane                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | core web fetch/search, media IO, media understanding, image-generation และสัญญา runtime ของ media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | สัญญาของ loader, registry, public-surface และ entrypoint ของ Plugin SDK                                                                                         |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | แหล่งที่มาของ Plugin SDK ฝั่ง package ที่เผยแพร่ และตัวช่วยสัญญา plugin package                                                                                |

คุณภาพแยกจากความปลอดภัยเพื่อให้ findings ด้านคุณภาพสามารถถูกกำหนดเวลา วัดผล ปิดใช้งาน หรือขยายได้โดยไม่บดบังสัญญาณด้านความปลอดภัย การขยาย CodeQL สำหรับ Swift, Python และ bundled-plugin ควรถูกเพิ่มกลับมาเป็นงานติดตามผลที่ scoped หรือ sharded เท่านั้นหลังจากโปรไฟล์ขอบเขตแคบมี runtime และสัญญาณที่เสถียรแล้ว

## เวิร์กโฟลว์บำรุงรักษา

### Docs Agent

เวิร์กโฟลว์ `Docs Agent` เป็น lane บำรุงรักษา Codex แบบขับเคลื่อนด้วยเหตุการณ์สำหรับคงเอกสารที่มีอยู่ให้สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง land ไม่มีตารางเวลาล้วน: การรัน CI จาก push ที่สำเร็จบน `main` ซึ่งไม่ใช่บอตสามารถ trigger ได้ และการ dispatch แบบแมนนวลสามารถรันได้โดยตรง การเรียกใช้จาก workflow-run จะข้ามเมื่อ `main` เคลื่อนไปแล้ว หรือเมื่อมีการสร้างการรัน Docs Agent ที่ไม่ถูกข้ามอีกรายการในชั่วโมงที่ผ่านมา เมื่อรัน จะตรวจสอบช่วง commit ตั้งแต่ source SHA ของ Docs Agent ที่ไม่ถูกข้ามครั้งก่อนจนถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงหนึ่งครั้งสามารถครอบคลุมการเปลี่ยนแปลงทั้งหมดใน main ที่สะสมตั้งแต่รอบตรวจเอกสารครั้งล่าสุด

### Test Performance Agent

เวิร์กโฟลว์ `Test Performance Agent` เป็น lane บำรุงรักษา Codex แบบขับเคลื่อนด้วยเหตุการณ์สำหรับ test ที่ช้า ไม่มีตารางเวลาล้วน: การรัน CI จาก push ที่สำเร็จบน `main` ซึ่งไม่ใช่บอตสามารถ trigger ได้ แต่จะข้ามถ้าการเรียกใช้ workflow-run อีกรายการได้รันแล้วหรือกำลังรันอยู่ในวัน UTC นั้น การ dispatch แบบแมนนวลข้ามด่านกิจกรรมรายวันนี้ lane นี้สร้างรายงานประสิทธิภาพ Vitest แบบ full-suite grouped ให้ Codex ทำเฉพาะการแก้ไขประสิทธิภาพ test ขนาดเล็กที่รักษา coverage แทน refactor ขนาดใหญ่ จากนั้นรันรายงาน full-suite อีกครั้งและปฏิเสธการเปลี่ยนแปลงที่ลดจำนวน baseline test ที่ผ่าน ถ้า baseline มี test ที่ล้มเหลว Codex อาจแก้เฉพาะความล้มเหลวที่ชัดเจน และรายงาน full-suite หลัง agent ต้องผ่านก่อนจึงจะ commit สิ่งใดได้ เมื่อ `main` เดินหน้าก่อน bot push ถูก land lane จะ rebase patch ที่ validate แล้ว รัน `pnpm check:changed` อีกครั้ง และ retry การ push; patch เก่าที่ conflict จะถูกข้าม ใช้ GitHub-hosted Ubuntu เพื่อให้ Codex action คง posture ความปลอดภัยแบบ drop-sudo เดียวกับ docs agent

### PR ซ้ำหลัง merge

เวิร์กโฟลว์ `Duplicate PRs After Merge` เป็นเวิร์กโฟลว์ maintainer แบบแมนนวลสำหรับล้างรายการซ้ำหลัง land ค่าเริ่มต้นเป็น dry-run และปิดเฉพาะ PR ที่ระบุชัดเจนเมื่อ `apply=true` ก่อนแก้ไข GitHub จะตรวจสอบว่า PR ที่ land ถูก merge แล้ว และ duplicate แต่ละรายการมี issue ที่อ้างอิงร่วมกันหรือมี hunks ที่เปลี่ยนแปลงทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ด่าน local check และการกำหนดเส้นทาง changed

ตรรกะ local changed-lane อยู่ใน `scripts/changed-lanes.mjs` และถูกเรียกใช้โดย `scripts/check-changed.mjs` ด่าน local check นั้นเข้มงวดกับขอบเขตสถาปัตยกรรมมากกว่าขอบเขตแพลตฟอร์ม CI แบบกว้าง:

- การเปลี่ยนแปลง production ของ core รัน typecheck ของ core prod และ core test รวมถึง core lint/guards;
- การเปลี่ยนแปลงเฉพาะ test ของ core รันเฉพาะ typecheck ของ core test รวมถึง core lint;
- การเปลี่ยนแปลง production ของ extension รัน typecheck ของ extension prod และ extension test รวมถึง extension lint;
- การเปลี่ยนแปลงเฉพาะ test ของ extension รัน typecheck ของ extension test รวมถึง extension lint;
- การเปลี่ยนแปลง public Plugin SDK หรือ plugin-contract ขยายไปยัง typecheck ของ extension เพราะ extensions พึ่งพาสัญญา core เหล่านั้น (การกวาด Vitest extension ยังคงเป็นงาน test ที่ต้องระบุชัดเจน);
- การ bump version ที่เป็น release metadata เท่านั้น รัน version/config/root-dependency checks แบบเจาะจง;
- การเปลี่ยนแปลง root/config ที่ไม่ทราบชนิด fail safe ไปยัง check lanes ทั้งหมด

การกำหนดเส้นทาง local changed-test อยู่ใน `scripts/test-projects.test-support.mjs` และตั้งใจให้ถูกกว่า `check:changed`: การแก้ไข test โดยตรงรันตัวเอง, การแก้ไข source ใช้ explicit mappings ก่อน จากนั้นใช้ sibling tests และ dependents จาก import-graph config การส่งกลุ่มแบบ shared group-room เป็นหนึ่งใน explicit mappings: การเปลี่ยนแปลง config visible-reply ของ group, source reply delivery mode หรือ system prompt ของ message-tool จะ route ผ่าน core reply tests รวมถึง regressions การส่งของ Discord และ Slack เพื่อให้การเปลี่ยน default ร่วมกันล้มเหลวก่อน PR push แรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างระดับ harness จนชุด mapped ราคาถูกไม่ใช่ proxy ที่น่าเชื่อถือ

## การตรวจสอบด้วย Testbox

เรียกใช้ Testbox จากรากของรีโพซิทอรี และควรใช้กล่องที่วอร์มใหม่สำหรับการพิสูจน์ขอบเขตกว้าง ก่อนใช้เกตที่ช้าบนกล่องที่ถูกนำกลับมาใช้ใหม่ หมดอายุ หรือเพิ่งรายงานการซิงก์ที่ใหญ่ผิดคาด ให้เรียกใช้ `pnpm testbox:sanity` ภายในกล่องก่อน

การตรวจสอบความสมบูรณ์จะล้มเหลวอย่างรวดเร็วเมื่อไฟล์รากที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short` แสดงการลบไฟล์ที่ติดตามแล้วอย่างน้อย 200 รายการ โดยปกติหมายความว่าสถานะการซิงก์ระยะไกลไม่ใช่สำเนาของ PR ที่เชื่อถือได้ ให้หยุดกล่องนั้นแล้ววอร์มกล่องใหม่แทนการดีบักความล้มเหลวของการทดสอบผลิตภัณฑ์ สำหรับ PR ที่ตั้งใจลบไฟล์จำนวนมาก ให้ตั้งค่า `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับการเรียกตรวจสอบความสมบูรณ์ครั้งนั้น

`pnpm testbox:run` จะยุติการเรียกใช้ Blacksmith CLI ในเครื่องที่ค้างอยู่ในช่วงซิงก์นานเกินห้านาทีโดยไม่มีเอาต์พุตหลังซิงก์ด้วย ตั้งค่า `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` เพื่อปิดการ์ดนี้ หรือใช้ค่ามิลลิวินาทีที่มากขึ้นสำหรับ diff ในเครื่องที่ใหญ่ผิดปกติ

Crabbox คือเส้นทางกล่องระยะไกลสำรองที่รีโพซิทอรีเป็นเจ้าของสำหรับการพิสูจน์บน Linux เมื่อ Blacksmith ไม่พร้อมใช้งาน หรือเมื่อควรใช้ความจุคลาวด์ที่เป็นเจ้าของ วอร์มกล่อง เติมข้อมูลผ่านเวิร์กโฟลว์ของโปรเจ็กต์ แล้วเรียกใช้คำสั่งผ่าน Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` เป็นเจ้าของค่าเริ่มต้นของผู้ให้บริการ การซิงก์ และการเติมข้อมูลของ GitHub Actions โดยจะยกเว้น `.git` ในเครื่อง เพื่อให้ checkout ของ Actions ที่เติมข้อมูลแล้วคงข้อมูลเมตา Git ระยะไกลของตัวเองไว้ แทนการซิงก์ remote และ object store ในเครื่องของผู้ดูแล และจะยกเว้นอาร์ติแฟกต์ runtime/build ในเครื่องที่ไม่ควรถูกถ่ายโอนเลย `.github/workflows/crabbox-hydrate.yml` เป็นเจ้าของ checkout, การตั้งค่า Node/pnpm, การ fetch `origin/main` และการส่งต่อสภาพแวดล้อมที่ไม่ใช่ความลับซึ่งคำสั่ง `crabbox run --id <cbx_id>` ภายหลังจะ source

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
