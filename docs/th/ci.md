---
read_when:
    - คุณจำเป็นต้องเข้าใจว่าเหตุใดงาน CI จึงทำงานหรือไม่ทำงาน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการเรียกใช้หรือการเรียกใช้ซ้ำสำหรับการตรวจสอบความถูกต้องของรีลีส
    - คุณกำลังเปลี่ยนการ dispatch ของ ClawSweeper หรือการส่งต่อกิจกรรม GitHub
summary: กราฟงาน CI, เกตตามขอบเขต, ชุดครอบคลุมการเผยแพร่ และคำสั่งเทียบเท่าในเครื่อง
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-05-06T09:05:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 189f717fac369d6374102612308c73705f19eca9baca81b24f052dbd5357e15f
    source_path: ci.md
    workflow: 16
---

OpenClaw CI ทำงานกับทุก push ไปยัง `main` และทุก pull request งาน `preflight` จะจำแนก diff และปิด lane ที่มีค่าใช้จ่ายสูงเมื่อมีเฉพาะพื้นที่ที่ไม่เกี่ยวข้องเปลี่ยนแปลง การรัน `workflow_dispatch` แบบ manual จงใจข้ามการกำหนดขอบเขตแบบ smart และกระจายงานเป็นกราฟเต็มสำหรับ release candidate และการตรวจสอบความถูกต้องแบบกว้าง lane ของ Android ยังคงเป็นแบบ opt-in ผ่าน `include_android` ความครอบคลุม Plugin เฉพาะ release อยู่ใน workflow [`Plugin Prerelease`](#plugin-prerelease) แยกต่างหาก และทำงานจาก [`Full Release Validation`](#full-release-validation) หรือการ dispatch แบบ manual อย่างชัดเจนเท่านั้น

## ภาพรวม Pipeline

| งาน                              | วัตถุประสงค์                                                                                                   | เมื่อทำงาน                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | ตรวจจับการเปลี่ยนแปลงเฉพาะ docs, ขอบเขตที่เปลี่ยน, extensions ที่เปลี่ยน และสร้าง manifest ของ CI                   | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-scm-fast`              | การตรวจจับ private key และการ audit workflow ผ่าน `zizmor`                                                     | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-dependency-audit`      | Audit lockfile ฝั่ง production โดยไม่ใช้ dependency เทียบกับ advisory ของ npm                                          | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-fast`                  | Aggregate ที่จำเป็นสำหรับงาน security แบบเร็ว                                                             | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `check-dependencies`             | การผ่าน Knip เฉพาะ dependency ฝั่ง production พร้อม guard สำหรับ allowlist ของไฟล์ที่ไม่ได้ใช้                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-artifacts`                | สร้าง `dist/`, Control UI, การตรวจ built-artifact และ artifact ปลายน้ำที่ใช้ซ้ำได้                       | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-core`               | lane ตรวจความถูกต้องบน Linux แบบเร็ว เช่น การตรวจ bundled/plugin-contract/protocol                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-contracts-channels` | การตรวจ channel contract แบบ shard พร้อมผล aggregate check ที่เสถียร                                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-core-test`          | shard ทดสอบ Core Node โดยยกเว้น lane channel, bundled, contract และ extension                          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check`                          | เทียบเท่า main local gate แบบ shard: prod types, lint, guards, test types และ strict smoke                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check-additional`               | Architecture, boundary/prompt drift แบบ shard, extension guards, package boundary และ gateway watch        | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-smoke`                    | การทดสอบ smoke ของ Built-CLI และ smoke หน่วยความจำตอนเริ่มต้น                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks`                         | Verifier สำหรับการทดสอบ channel ของ built-artifact                                                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-compat-node22`      | lane build และ smoke สำหรับความเข้ากันได้กับ Node 22                                                                | การ dispatch CI แบบ manual สำหรับ release    |
| `check-docs`                     | การตรวจ formatting, lint และ broken-link ของ docs                                                             | docs เปลี่ยน                       |
| `skills-python`                  | Ruff + pytest สำหรับ skills ที่มี Python รองรับ                                                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python-skill      |
| `checks-windows`                 | การทดสอบเฉพาะ Windows สำหรับ process/path พร้อม regression ของ runtime import specifier ร่วม                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows           |
| `macos-node`                     | lane ทดสอบ TypeScript บน macOS โดยใช้ built artifacts ร่วม                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `macos-swift`                    | Swift lint, build และ tests สำหรับแอป macOS                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `android`                        | Unit tests ของ Android สำหรับทั้งสอง flavor พร้อม build debug APK หนึ่งรายการ                                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android           |
| `test-performance-agent`         | การปรับปรุง slow-test ของ Codex รายวันหลังจากกิจกรรมที่เชื่อถือได้                                                 | Main CI สำเร็จหรือ manual dispatch |
| `openclaw-performance`           | รายงาน performance ของ Kova runtime แบบรายวัน/on-demand พร้อม lane mock-provider, deep-profile และ GPT 5.4 live | Scheduled และ manual dispatch      |

## ลำดับ fail-fast

1. `preflight` ตัดสินว่า lane ใดมีอยู่ตั้งแต่แรก logic `docs-scope` และ `changed-scope` เป็น step ภายในงานนี้ ไม่ใช่งานเดี่ยว
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` fail อย่างรวดเร็วโดยไม่รอ artifact ที่หนักกว่าและงาน platform matrix
3. `build-artifacts` ทำงานทับซ้อนกับ lane Linux แบบเร็วเพื่อให้ผู้บริโภคปลายน้ำเริ่มได้ทันทีที่ shared build พร้อม
4. lane platform และ runtime ที่หนักกว่าจะกระจายงานหลังจากนั้น: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่เป็น `cancelled` เมื่อมี push ใหม่กว่าลงบน PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่านั่นเป็น noise ของ CI เว้นแต่ run ล่าสุดสำหรับ ref เดียวกันก็ fail ด้วย Aggregate shard checks ใช้ `!cancelled() && always()` เพื่อให้ยังรายงาน shard failure ปกติ แต่ไม่ queue หลังจาก workflow ทั้งหมดถูกแทนที่ไปแล้ว concurrency key อัตโนมัติของ CI มีเวอร์ชัน (`CI-v7-*`) เพื่อไม่ให้ zombie ฝั่ง GitHub ในกลุ่ม queue เก่าบล็อก run ใหม่บน main ได้ไม่สิ้นสุด การรัน full-suite แบบ manual ใช้ `CI-manual-v1-*` และไม่ cancel run ที่กำลังทำงานอยู่

## ขอบเขตและการ routing

logic ของ scope อยู่ใน `scripts/ci-changed-scope.mjs` และครอบคลุมด้วย unit tests ใน `src/scripts/ci-changed-scope.test.ts` Manual dispatch ข้ามการตรวจจับ changed-scope และทำให้ preflight manifest ทำตัวเหมือนทุกพื้นที่ที่มี scope เปลี่ยนแปลง

- **การแก้ไข CI workflow** ตรวจสอบกราฟ Node CI พร้อม workflow linting แต่ไม่บังคับ Windows, Android หรือ native build ของ macOS ด้วยตัวเอง lane platform เหล่านั้นยังคง scoped ตามการเปลี่ยนแปลง source ของ platform
- **การแก้ไขเฉพาะ CI routing, การแก้ไข fixture ของ core-test ราคาถูกบางส่วน และการแก้ไข helper/test-routing ของ plugin contract แบบแคบ** ใช้เส้นทาง manifest แบบ Node-only ที่เร็ว: `preflight`, security และ task `checks-fast-core` เพียงรายการเดียว เส้นทางนั้นข้าม build artifacts, ความเข้ากันได้กับ Node 22, channel contracts, core shards เต็ม, bundled-plugin shards และ additional guard matrices เมื่อการเปลี่ยนแปลงจำกัดอยู่ที่พื้นผิว routing หรือ helper ที่ task เร็วทดสอบโดยตรง
- **Windows Node checks** scoped ไปที่ wrapper เฉพาะ Windows สำหรับ process/path, helper ของ npm/pnpm/UI runner, config package manager และพื้นผิว CI workflow ที่เรียกใช้ lane นั้น; source, plugin, install-smoke และการเปลี่ยนแปลงเฉพาะ test ที่ไม่เกี่ยวข้องยังอยู่บน lane Linux Node

ตระกูลการทดสอบ Node ที่ช้าที่สุดถูก split หรือ balance เพื่อให้งานแต่ละรายการยังเล็กโดยไม่จอง runner เกินจำเป็น: channel contracts ทำงานเป็น shard ถ่วงน้ำหนักสามส่วน, lane core unit fast/support ทำงานแยกกัน, core runtime infra ถูกแบ่งระหว่าง shard state และ process/config, auto-reply ทำงานเป็น worker ที่ balance แล้ว (โดย split reply subtree เป็น shard agent-runner, dispatch และ commands/state-routing) และ config ของ agentic gateway/server ถูก split ข้าม lane chat/auth/model/http-plugin/runtime/startup แทนการรอ built artifacts การทดสอบ browser, QA, media และ plugin เบ็ดเตล็ดแบบกว้างใช้ config Vitest เฉพาะของตัวเองแทน plugin catch-all ร่วม Include-pattern shards บันทึก timing entries โดยใช้ชื่อ CI shard เพื่อให้ `.artifacts/vitest-shard-timings.json` แยก whole config ออกจาก filtered shard ได้ `check-additional` เก็บงาน compile/canary ของ package-boundary ไว้ด้วยกัน และแยก runtime topology architecture ออกจาก gateway watch coverage; รายการ boundary guard ถูกกระจายเป็นสี่ matrix shards โดยแต่ละ shard รัน guard อิสระที่เลือกพร้อมกันและพิมพ์ timing ต่อ check รวมถึง `pnpm prompt:snapshots:check` เพื่อให้ prompt drift ของ happy-path ใน Codex runtime ถูกผูกกับ PR ที่เป็นต้นเหตุ Gateway watch, channel tests และ core support-boundary shard ทำงานพร้อมกันภายใน `build-artifacts` หลังจาก `dist/` และ `dist-runtime/` ถูก build แล้ว

Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` แล้วจึง build Play debug APK flavor third-party ไม่มี source set หรือ manifest แยกต่างหาก; lane unit-test ของมันยังคง compile flavor พร้อม flag BuildConfig ของ SMS/call-log ขณะหลีกเลี่ยงงาน packaging debug APK ที่ซ้ำบนทุก push ที่เกี่ยวข้องกับ Android

shard `check-dependencies` รัน `pnpm deadcode:dependencies` (การผ่าน Knip เฉพาะ dependency ฝั่ง production ที่ pinned กับ Knip เวอร์ชันล่าสุด โดยปิด minimum release age ของ pnpm สำหรับการ install ผ่าน `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบ finding ไฟล์ production ที่ไม่ได้ใช้ของ Knip กับ `scripts/deadcode-unused-files.allowlist.mjs` guard ไฟล์ที่ไม่ได้ใช้จะ fail เมื่อ PR เพิ่มไฟล์ที่ไม่ได้ใช้ใหม่โดยยังไม่ได้ review หรือเหลือ entry ใน allowlist ที่ stale ขณะยังรักษาพื้นผิว dynamic plugin, generated, build, live-test และ package bridge ที่ตั้งใจไว้ซึ่ง Knip resolve แบบ statically ไม่ได้

## การส่งต่อกิจกรรม ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` เป็น bridge ฝั่ง target จากกิจกรรม repository ของ OpenClaw ไปยัง ClawSweeper มันไม่ checkout หรือ execute code ของ pull request ที่ไม่น่าเชื่อถือ workflow สร้าง token ของ GitHub App จาก `CLAWSWEEPER_APP_PRIVATE_KEY` จากนั้น dispatch payload `repository_dispatch` แบบกะทัดรัดไปยัง `openclaw/clawsweeper`

workflow มีสี่ lane:

- `clawsweeper_item` สำหรับคำขอ review issue และ pull request ที่เจาะจง;
- `clawsweeper_comment` สำหรับคำสั่ง ClawSweeper ที่ชัดเจนใน issue comments;
- `clawsweeper_commit_review` สำหรับคำขอ review ระดับ commit บน push ไปยัง `main`;
- `github_activity` สำหรับกิจกรรม GitHub ทั่วไปที่ agent ของ ClawSweeper อาจตรวจสอบ

lane `github_activity` ส่งต่อเฉพาะ metadata ที่ normalize แล้ว: event type, action, actor, repository, item number, URL, title, state และ excerpt สั้น ๆ สำหรับ comment หรือ review เมื่อมี โดยจงใจหลีกเลี่ยงการส่งต่อ webhook body แบบเต็ม workflow ฝั่งรับใน `openclaw/clawsweeper` คือ `.github/workflows/github-activity.yml` ซึ่ง post event ที่ normalize แล้วไปยัง hook ของ OpenClaw Gateway สำหรับ agent ของ ClawSweeper

กิจกรรมทั่วไปเป็นการสังเกตการณ์ ไม่ใช่การส่งมอบโดยค่าเริ่มต้น agent ของ ClawSweeper ได้รับ Discord target ใน prompt และควร post ไปยัง `#clawsweeper` เฉพาะเมื่อ event นั้นน่าประหลาดใจ, ดำเนินการได้, มีความเสี่ยง หรือมีประโยชน์เชิงปฏิบัติการ การเปิด การแก้ไข bot churn noise จาก webhook ซ้ำ และ traffic review ปกติควรให้ผลเป็น `NO_REPLY`

ถือว่า title, comment, body, review text, branch name และ commit message ของ GitHub เป็นข้อมูลที่ไม่น่าเชื่อถือตลอด path นี้ สิ่งเหล่านี้เป็น input สำหรับการสรุปและ triage ไม่ใช่คำสั่งสำหรับ workflow หรือ agent runtime

## การ dispatch แบบ manual

การ dispatch CI แบบแมนนวลจะรันกราฟงานเดียวกับ CI ปกติ แต่บังคับเปิดทุก lane ที่อยู่ใน scope ที่ไม่ใช่ Android: shard ของ Linux Node, shard ของ Plugin ที่ bundled, channel contracts, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, การตรวจสอบเอกสาร, Python skills, Windows, macOS และ Control UI i18n การ dispatch CI แบบแมนนวลแบบสแตนด์อโลนจะรันเฉพาะ Android ด้วย `include_android=true`; umbrella ของ release แบบเต็มจะเปิดใช้ Android โดยส่ง `include_android=true` การตรวจสอบ static สำหรับ Plugin prerelease, shard เฉพาะ release อย่าง `agentic-plugins`, การ sweep batch ของ extension แบบเต็ม และ lane Docker สำหรับ Plugin prerelease จะถูกยกเว้นจาก CI ชุด Docker prerelease จะรันเฉพาะเมื่อ `Full Release Validation` dispatch workflow `Plugin Prerelease` แยกต่างหากพร้อมเปิดใช้ gate การตรวจสอบ release validation

การรันแบบแมนนวลใช้ concurrency group ที่ไม่ซ้ำกัน เพื่อไม่ให้ชุดเต็มของ release-candidate ถูกยกเลิกโดยการรัน push หรือ PR อื่นบน ref เดียวกัน อินพุตเสริม `target_ref` ช่วยให้ผู้เรียกที่เชื่อถือได้รันกราฟนั้นกับ branch, tag หรือ commit SHA แบบเต็ม โดยใช้ไฟล์ workflow จาก dispatch ref ที่เลือก

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## รันเนอร์

| รันเนอร์                           | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, งานความปลอดภัยแบบเร็วและ aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจสอบ protocol/contract/bundled แบบเร็ว, การตรวจสอบ channel contract แบบ sharded, shard ของ `check` ยกเว้น lint, aggregate ของ `check-additional`, ตัวตรวจสอบ aggregate สำหรับการทดสอบ Node, การตรวจสอบเอกสาร, Python skills, workflow-sanity, labeler, auto-response; preflight ของ install-smoke ยังใช้ Ubuntu ที่โฮสต์โดย GitHub เพื่อให้ matrix ของ Blacksmith เข้าคิวได้เร็วขึ้น |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard ของ extension ที่เบากว่า, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` และ `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard การทดสอบ Linux Node, shard การทดสอบ Plugin ที่ bundled, shard ของ `check-additional`, `android`                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (ไวต่อ CPU มากพอที่ 8 vCPU มีต้นทุนมากกว่าที่ประหยัดได้); build Docker ของ install-smoke (เวลาเข้าคิว 32-vCPU มีต้นทุนมากกว่าที่ประหยัดได้)                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; fork จะ fallback ไปที่ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; fork จะ fallback ไปที่ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

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

## OpenClaw Performance

`OpenClaw Performance` คือ workflow ด้านประสิทธิภาพของผลิตภัณฑ์/runtime โดยรันทุกวันบน `main` และสามารถ dispatch แบบแมนนวลได้:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

โดยปกติ manual dispatch จะ benchmark workflow ref ตั้งค่า `target_ref` เพื่อ benchmark release tag หรือ branch อื่นด้วย implementation ของ workflow ปัจจุบัน path ของรายงานที่เผยแพร่และ pointer ล่าสุดจะ key ตาม ref ที่ทดสอบ และ `index.md` แต่ละไฟล์จะบันทึก ref/SHA ที่ทดสอบ, workflow ref/SHA, Kova ref, profile, โหมด auth ของ lane, model, จำนวน repeat และตัวกรอง scenario

workflow จะติดตั้ง OCM จาก release ที่ pin ไว้ และ Kova จาก `openclaw/Kova` ที่อินพุต `kova_ref` ที่ pin ไว้ จากนั้นรันสาม lane:

- `mock-provider`: scenario diagnostic ของ Kova กับ runtime ที่ build ในเครื่องโดยใช้ auth ปลอมที่เข้ากันได้กับ OpenAI แบบ deterministic
- `mock-deep-profile`: การทำ CPU/heap/trace profiling สำหรับ startup, gateway และ hotspot ของ agent-turn
- `live-gpt54`: agent turn จริงของ OpenAI `openai/gpt-5.4` ซึ่งจะข้ามเมื่อไม่มี `OPENAI_API_KEY`

lane mock-provider ยังรัน source probe แบบ native ของ OpenClaw หลังจาก Kova pass: timing และ memory ของการ boot gateway ในกรณี startup แบบ default, hook และ 50-Plugin; loop hello ของ mock-OpenAI `channel-chat-baseline` ซ้ำ ๆ; และคำสั่ง startup ของ CLI กับ gateway ที่ boot แล้ว สรุป Markdown ของ source probe อยู่ที่ `source/index.md` ใน bundle รายงาน พร้อม JSON ดิบข้างกัน

ทุก lane จะอัปโหลด artifact ของ GitHub เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว workflow ยัง commit `report.json`, `report.md`, bundle, `index.md` และ artifact ของ source-probe เข้าไปยัง `openclaw/clawgrit-reports` ภายใต้ `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` pointer ของ tested-ref ปัจจุบันจะถูกเขียนเป็น `openclaw-performance/<tested-ref>/latest-<lane>.json`

## Full Release Validation

`Full Release Validation` คือ workflow umbrella แบบแมนนวลสำหรับ "รันทุกอย่างก่อน release" โดยรับ branch, tag หรือ commit SHA แบบเต็ม, dispatch workflow `CI` แบบแมนนวลด้วย target นั้น, dispatch `Plugin Prerelease` สำหรับ proof เฉพาะ release ด้าน Plugin/package/static/Docker และ dispatch `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, การตรวจสอบ package ข้าม OS, QA Lab parity, Matrix และ lane ของ Telegram การรัน stable/default จะเก็บ live/E2E แบบ exhaustive และ coverage ของ Docker release-path ไว้หลัง `run_release_soak=true`; `release_profile=full` จะบังคับเปิด soak coverage นั้น เพื่อให้การตรวจสอบ advisory แบบกว้างยังคงกว้างอยู่ เมื่อใช้ `rerun_group=all` และ `release_profile=full` จะรัน `NPM Telegram Beta E2E` กับ artifact `release-package-under-test` จาก release checks ด้วย หลังเผยแพร่แล้ว ให้ส่ง `npm_telegram_package_spec` เพื่อ rerun lane package ของ Telegram เดียวกันกับ package npm ที่เผยแพร่แล้ว

ดู [การตรวจสอบ release แบบเต็ม](/th/reference/full-release-validation) สำหรับ
stage matrix, ชื่องาน workflow ที่แน่นอน, ความแตกต่างของ profile, artifact และ
handle สำหรับ rerun แบบเจาะจง

`OpenClaw Release Publish` คือ workflow release แบบแมนนวลที่เปลี่ยนแปลงสถานะได้ ให้ dispatch
จาก `release/YYYY.M.D` หรือ `main` หลังจากมี release tag แล้ว และหลังจาก
OpenClaw npm preflight สำเร็จแล้ว โดยจะตรวจสอบ `pnpm plugins:sync:check`,
dispatch `Plugin NPM Release` สำหรับ package Plugin ทั้งหมดที่ publish ได้, dispatch
`Plugin ClawHub Release` สำหรับ release SHA เดียวกัน และจากนั้นเท่านั้นจึง dispatch
`OpenClaw NPM Release` พร้อม `preflight_run_id` ที่บันทึกไว้

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

สำหรับ proof ของ commit ที่ pin ไว้บน branch ที่เคลื่อนไหวเร็ว ให้ใช้ helper แทน
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

dispatch ref ของ GitHub workflow ต้องเป็น branch หรือ tag ไม่ใช่ commit SHA ดิบ
helper จะ push branch ชั่วคราว `release-ci/<sha>-...` ที่ target SHA,
dispatch `Full Release Validation` จาก ref ที่ pin ไว้นั้น, ตรวจสอบว่า `headSha` ของ child
workflow ทุกตัวตรงกับ target และลบ branch ชั่วคราวเมื่อการรันเสร็จสมบูรณ์ ตัวตรวจสอบ umbrella จะล้มเหลวด้วยหาก child workflow ใดรันที่
SHA อื่น

`release_profile` ควบคุมขอบเขต live/provider ที่ส่งเข้าไปในการตรวจสอบรีลีส เวิร์กโฟลว์รีลีสแบบแมนนวลมีค่าเริ่มต้นเป็น `stable`; ใช้ `full` เฉพาะเมื่อคุณตั้งใจต้องการเมทริกซ์ provider/media แบบ advisory ที่กว้างเท่านั้น `run_release_soak` ควบคุมว่าการตรวจสอบรีลีส stable/default จะรันการ soak เส้นทางรีลีสแบบ live/E2E และ Docker ที่ครอบคลุมทั้งหมดหรือไม่; `full` จะบังคับเปิด soak

- `minimum` คงเลน OpenAI/core ที่สำคัญต่อรีลีสและเร็วที่สุดไว้
- `stable` เพิ่มชุด provider/backend สำหรับ stable
- `full` รันเมทริกซ์ provider/media แบบ advisory ที่กว้าง

umbrella จะบันทึก id ของ child run ที่ dispatch แล้ว และงาน `Verify full validation` สุดท้ายจะตรวจซ้ำข้อสรุปของ child run ปัจจุบันและผนวกตารางงานที่ช้าที่สุดสำหรับ child run แต่ละรายการ หาก child workflow ถูก rerun และเปลี่ยนเป็นเขียว ให้ rerun เฉพาะงาน parent verifier เพื่อรีเฟรชผลลัพธ์ umbrella และสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รับ `rerun_group` ใช้ `all` สำหรับ release candidate, `ci` สำหรับเฉพาะ normal full CI child, `plugin-prerelease` สำหรับเฉพาะ plugin prerelease child, `release-checks` สำหรับ release child ทุกตัว หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, หรือ `npm-telegram` บน umbrella วิธีนี้ทำให้การ rerun กล่องรีลีสที่ล้มเหลวถูกจำกัดขอบเขตหลังการแก้ไขแบบเจาะจง สำหรับเลน cross-OS ที่ล้มเหลวหนึ่งเลน ให้รวม `rerun_group=cross-os` กับ `cross_os_suite_filter` เช่น `windows/packaged-upgrade`; คำสั่ง cross-OS ที่ยาวจะปล่อยบรรทัด heartbeat และสรุป packaged-upgrade จะรวมเวลารายเฟส เลน QA release-check เป็น advisory ดังนั้นความล้มเหลวเฉพาะ QA จะเตือนแต่ไม่บล็อก release-check verifier

`OpenClaw Release Checks` ใช้ workflow ref ที่เชื่อถือได้เพื่อ resolve ref ที่เลือกเพียงครั้งเดียวเป็น tarball `release-package-under-test` จากนั้นส่ง artifact นั้นไปยังการตรวจสอบ cross-OS และ Package Acceptance รวมถึงเวิร์กโฟลว์ Docker เส้นทางรีลีส live/E2E เมื่อมีการรันความครอบคลุมแบบ soak วิธีนี้ทำให้ไบต์ของแพ็กเกจสอดคล้องกันในกล่องรีลีสต่าง ๆ และหลีกเลี่ยงการ repack candidate เดียวกันในหลาย child job

การรัน `Full Release Validation` ซ้ำสำหรับ `ref=main` และ `rerun_group=all`
จะแทนที่ umbrella ที่เก่ากว่า parent monitor จะยกเลิก child workflow ใด ๆ ที่
dispatch ไปแล้วเมื่อ parent ถูกยกเลิก ดังนั้นการตรวจสอบ main ที่ใหม่กว่าจะไม่ต้องรอหลัง release-check run เก่าที่ใช้เวลาสองชั่วโมง การตรวจสอบ release branch/tag
และกลุ่ม rerun แบบเจาะจงจะคง `cancel-in-progress: false`

## ชาร์ด Live และ E2E

child ของ release live/E2E ยังคงความครอบคลุม `pnpm test:live` แบบ native ที่กว้าง แต่รันเป็นชาร์ดที่มีชื่อผ่าน `scripts/test-live-shard.mjs` แทนที่จะเป็นงาน serial งานเดียว:

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

วิธีนี้คงความครอบคลุมไฟล์เดิมไว้ พร้อมทำให้ความล้มเหลวของ live provider ที่ช้า rerun และวินิจฉัยได้ง่ายขึ้น ชื่อชาร์ดแบบ aggregate `native-live-extensions-o-z`, `native-live-extensions-media`, และ `native-live-extensions-media-music` ยังคงใช้ได้สำหรับการ rerun แบบ manual one-shot

ชาร์ด native live media รันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งสร้างโดยเวิร์กโฟลว์ `Live Media Runner Image` อิมเมจนั้นติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้า; งาน media จะเพียงตรวจสอบไบนารีก่อน setup เท่านั้น คงชุดทดสอบ live ที่ใช้ Docker ไว้บน Blacksmith runner ปกติ เพราะ container job ไม่เหมาะสำหรับการเปิดการทดสอบ Docker ซ้อน

ชาร์ด live model/backend ที่ใช้ Docker ใช้อิมเมจ `ghcr.io/openclaw/openclaw-live-test:<sha>` แยกต่างหากต่อคอมมิตที่เลือก เวิร์กโฟลว์ live release สร้างและ push อิมเมจนั้นหนึ่งครั้ง จากนั้นชาร์ด Docker live model, gateway ที่แบ่งตาม provider, CLI backend, ACP bind, และ Codex harness จะรันด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ชาร์ด Gateway Docker มีเพดาน `timeout` ระดับสคริปต์ที่ชัดเจนต่ำกว่า timeout ของ workflow job เพื่อให้ container หรือเส้นทาง cleanup ที่ค้างล้มเหลวเร็ว แทนที่จะกินงบเวลา release-check ทั้งหมด หากชาร์ดเหล่านั้นสร้าง Docker target ของซอร์สเต็มใหม่เอง แสดงว่า release run ตั้งค่าผิดและจะเสีย wall clock ไปกับการสร้างอิมเมจซ้ำ

## การยอมรับแพ็กเกจ

ใช้ `Package Acceptance` เมื่อคำถามคือ "แพ็กเกจ OpenClaw ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์ได้หรือไม่" สิ่งนี้ต่างจาก CI ปกติ: CI ปกติตรวจสอบ source tree ขณะที่ package acceptance ตรวจสอบ tarball เดียวผ่าน Docker E2E harness เดียวกับที่ผู้ใช้ใช้งานหลังติดตั้งหรืออัปเดต

### งาน

1. `resolve_package` checkout `workflow_ref`, resolve package candidate หนึ่งรายการ, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, อัปโหลดทั้งคู่เป็น artifact `package-under-test`, และพิมพ์ source, workflow ref, package ref, version, SHA-256, และ profile ในสรุปขั้นตอนของ GitHub
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` เวิร์กโฟลว์ reusable จะดาวน์โหลด artifact นั้น, ตรวจสอบ inventory ของ tarball, เตรียมอิมเมจ Docker ที่อิง package-digest เมื่อจำเป็น, และรันเลน Docker ที่เลือกกับแพ็กเกจนั้นแทนการแพ็ก workflow checkout เมื่อ profile เลือก `docker_lanes` แบบเจาะจงหลายรายการ เวิร์กโฟลว์ reusable จะเตรียมแพ็กเกจและอิมเมจที่ใช้ร่วมกันหนึ่งครั้ง จากนั้นกระจายเลนเหล่านั้นออกเป็นงาน Docker แบบเจาะจงที่ขนานกันพร้อม artifact ที่ไม่ซ้ำกัน
3. `package_telegram` เรียก `NPM Telegram Beta E2E` แบบไม่บังคับ โดยจะรันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้ง artifact `package-under-test` เดียวกันเมื่อ Package Acceptance resolve ไว้แล้ว; การ dispatch Telegram แบบ standalone ยังสามารถติดตั้ง npm spec ที่เผยแพร่แล้วได้
4. `summary` ทำให้เวิร์กโฟลว์ล้มเหลวหากการ resolve แพ็กเกจ, Docker acceptance, หรือเลน Telegram แบบไม่บังคับล้มเหลว

### แหล่งที่มาของ candidate

- `source=npm` รับเฉพาะ `openclaw@beta`, `openclaw@latest`, หรือเวอร์ชันรีลีส OpenClaw ที่ระบุแน่นอน เช่น `openclaw@2026.4.27-beta.2` ใช้สิ่งนี้สำหรับ prerelease/stable acceptance ที่เผยแพร่แล้ว
- `source=ref` แพ็ก branch, tag, หรือ commit SHA แบบเต็มของ `package_ref` ที่เชื่อถือได้ resolver จะ fetch branch/tag ของ OpenClaw, ตรวจสอบว่าคอมมิตที่เลือก reachable จากประวัติ branch ของ repository หรือ release tag, ติดตั้ง deps ใน worktree แบบ detached, และแพ็กด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` ดาวน์โหลด HTTPS `.tgz`; ต้องมี `package_sha256`
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งรายการจาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็นทางเลือกแต่ควรระบุสำหรับ artifact ที่แชร์ภายนอก

แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือโค้ด workflow/harness ที่เชื่อถือได้ซึ่งรันการทดสอบ `package_ref` คือคอมมิตซอร์สที่จะถูกแพ็กเมื่อ `source=ref` วิธีนี้ทำให้ test harness ปัจจุบันตรวจสอบคอมมิตซอร์สเก่าที่เชื่อถือได้โดยไม่ต้องรัน logic ของ workflow เก่า

### โปรไฟล์ชุดทดสอบ

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` บวก `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk เส้นทางรีลีส Docker แบบเต็มพร้อม OpenWebUI
- `custom` — `docker_lanes` ที่ระบุแน่นอน; จำเป็นเมื่อ `suite_profile=custom`

profile `package` ใช้ความครอบคลุม Plugin แบบออฟไลน์ เพื่อให้การตรวจสอบแพ็กเกจที่เผยแพร่แล้วไม่ถูกกั้นด้วยความพร้อมใช้งานของ ClawHub แบบ live เลน Telegram แบบไม่บังคับใช้ artifact `package-under-test` ซ้ำใน `NPM Telegram Beta E2E` โดยคงเส้นทาง published npm spec ไว้สำหรับการ dispatch แบบ standalone

สำหรับนโยบายการทดสอบ update และ Plugin เฉพาะ รวมถึงคำสั่ง local,
เลน Docker, input ของ Package Acceptance, ค่าเริ่มต้นของรีลีส, และการ triage ความล้มเหลว,
ดู [การทดสอบ updates และ plugins](/th/help/testing-updates-plugins)

Release checks เรียก Package Acceptance ด้วย `source=artifact`, artifact แพ็กเกจรีลีสที่เตรียมไว้, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, และ `telegram_mode=mock-openai` วิธีนี้คงหลักฐานการ migration แพ็กเกจ, update, การ cleanup stale-plugin-dependency, การซ่อม install ของ configured-plugin, Plugin แบบออฟไลน์, plugin-update, และ Telegram ไว้บน package tarball ที่ resolve เดียวกัน ตั้งค่า `package_acceptance_package_spec` บน Full Release Validation หรือ OpenClaw Release Checks เพื่อรันเมทริกซ์เดียวกันนั้นกับแพ็กเกจ npm ที่เผยแพร่แล้วแทน artifact ที่สร้างจาก SHA การตรวจสอบรีลีส cross-OS ยังครอบคลุม onboarding, installer, และพฤติกรรม platform ที่จำเพาะต่อ OS; การตรวจสอบผลิตภัณฑ์ด้าน package/update ควรเริ่มที่ Package Acceptance เลน Docker `published-upgrade-survivor` ตรวจสอบ baseline แพ็กเกจที่เผยแพร่แล้วหนึ่งรายการต่อ run ในเส้นทางรีลีสที่บล็อก ใน Package Acceptance tarball `package-under-test` ที่ resolve แล้วจะเป็น candidate เสมอ และ `published_upgrade_survivor_baseline` เลือก baseline ที่เผยแพร่แล้วเพื่อ fallback โดยมีค่าเริ่มต้นเป็น `openclaw@latest`; คำสั่ง rerun ของเลนที่ล้มเหลวจะคง baseline นั้นไว้ Full Release Validation ที่มี `run_release_soak=true` หรือ `release_profile=full` ตั้งค่า `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` และ `published_upgrade_survivor_scenarios=reported-issues` เพื่อขยายครอบคลุมรีลีส npm stable ล่าสุดสี่รายการ บวกกับรีลีส boundary ด้าน plugin-compatibility ที่ pin ไว้ และ fixture ที่มีรูปทรงตาม issue สำหรับ config ของ Feishu, ไฟล์ bootstrap/persona ที่ถูกเก็บรักษา, การ install OpenClaw plugin ที่กำหนดค่าไว้, เส้นทาง log แบบ tilde, และ root ของ stale legacy plugin dependency การเลือก multi-baseline published-upgrade survivor จะถูกแบ่งชาร์ดตาม baseline เป็นงาน Docker runner แบบเจาะจงแยกกัน เวิร์กโฟลว์ `Update Migration` แยกต่างหากใช้เลน Docker `update-migration` กับ `all-since-2026.4.23` และ `plugin-deps-cleanup` เมื่อคำถามคือการ cleanup update ที่เผยแพร่แล้วแบบครอบคลุมทั้งหมด ไม่ใช่ขอบเขต CI ของ Full Release ปกติ การรัน aggregate แบบ local สามารถส่ง package spec ที่แน่นอนด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, คงเลนเดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` เช่น `openclaw@2026.4.15`, หรือตั้งค่า `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` สำหรับเมทริกซ์ scenario เลน published กำหนดค่า baseline ด้วยสูตรคำสั่ง `openclaw config set` ที่ bake ไว้, บันทึกขั้นตอนสูตรใน `summary.json`, และ probe `/healthz`, `/readyz`, รวมถึงสถานะ RPC หลัง Gateway start เลน Windows packaged และ installer fresh ยังตรวจสอบด้วยว่าแพ็กเกจที่ติดตั้งแล้วสามารถ import browser-control override จาก raw absolute Windows path ได้ smoke ของ OpenAI cross-OS agent-turn มีค่าเริ่มต้นเป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อถูกตั้งค่า มิฉะนั้นเป็น `openai/gpt-5.4` เพื่อให้หลักฐานการติดตั้งและ Gateway อยู่บนโมเดลทดสอบ GPT-5 พร้อมหลีกเลี่ยงค่าเริ่มต้น GPT-4.x

### หน้าต่างความเข้ากันได้แบบ legacy

Package Acceptance มีหน้าต่าง legacy-compatibility ที่จำกัดขอบเขตสำหรับแพ็กเกจที่เผยแพร่แล้ว แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้เส้นทาง compatibility ได้:

- รายการ QA private ที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ถูกละไว้จาก tarball;
- `doctor-switch` อาจข้าม subcase persistence ของ `gateway install --wrapper` เมื่อแพ็กเกจไม่ expose flag นั้น;
- `update-channel-switch` อาจ prune `pnpm.patchedDependencies` ที่หายไปจาก fake git fixture ที่ได้จาก tarball และอาจ log `update.channel` persisted ที่หายไป;
- smoke ของ Plugin อาจอ่านตำแหน่ง install-record แบบ legacy หรือยอมรับ persistence ของ marketplace install-record ที่หายไป;
- `plugin-update` อาจอนุญาตการ migration metadata ของ config ในขณะที่ยังคงกำหนดให้ install record และพฤติกรรม no-reinstall ไม่เปลี่ยนแปลง

แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ตราประทับเมทาดาทาของบิลด์ภายในเครื่องที่ถูกส่งออกไปแล้วด้วย แพ็กเกจรุ่นหลังต้องเป็นไปตามสัญญาสมัยใหม่ เงื่อนไขเดียวกันจะล้มเหลวแทนที่จะเตือนหรือข้าม

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

เมื่อดีบักรัน package acceptance ที่ล้มเหลว ให้เริ่มที่สรุป `resolve_package` เพื่อยืนยันแหล่งที่มาของแพ็กเกจ เวอร์ชัน และ SHA-256 จากนั้นตรวจสอบ child run `docker_acceptance` และอาร์ติแฟกต์ Docker ของมัน: `.artifacts/docker-tests/**/summary.json`, `failures.json`, ล็อกของเลน, เวลาของเฟส และคำสั่งรันซ้ำ ควรรันโปรไฟล์แพ็กเกจที่ล้มเหลวหรือเลน Docker ที่ตรงกันซ้ำ แทนที่จะรัน full release validation ซ้ำทั้งหมด

## Install smoke

เวิร์กโฟลว์ `Install Smoke` ที่แยกต่างหากใช้สคริปต์ขอบเขตเดียวกันซ้ำผ่านงาน `preflight` ของตัวเอง โดยแบ่งความครอบคลุม smoke เป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **Fast path** รันสำหรับ pull request ที่แตะพื้นผิว Docker/แพ็กเกจ, การเปลี่ยนแปลงแพ็กเกจ/แมนิเฟสต์ของ Plugin ที่บันเดิลมา หรือพื้นผิว core plugin/channel/gateway/Plugin SDK ที่งาน Docker smoke ใช้ทดสอบ การเปลี่ยนแปลงเฉพาะซอร์สของ Plugin ที่บันเดิลมา การแก้ไขเฉพาะเทสต์ และการแก้ไขเฉพาะเอกสารจะไม่จอง Docker workers fast path จะบิลด์อิมเมจ Dockerfile รากหนึ่งครั้ง ตรวจ CLI รัน agents delete shared-workspace CLI smoke รัน container gateway-network e2e ตรวจสอบ build arg ของส่วนขยายที่บันเดิลมา และรันโปรไฟล์ Docker ของ bundled-plugin แบบมีขอบเขตภายใต้ timeout คำสั่งรวม 240 วินาที (Docker run ของแต่ละสถานการณ์ถูกจำกัดแยกกัน)
- **Full path** เก็บความครอบคลุม QR package install และ installer Docker/update ไว้สำหรับรันตามกำหนดการรายคืน manual dispatches workflow-call release checks และ pull request ที่แตะพื้นผิว installer/package/Docker จริงๆ ในโหมดเต็ม install-smoke จะเตรียมหรือใช้ target-SHA GHCR root Dockerfile smoke image หนึ่งตัวซ้ำ จากนั้นรัน QR package install, root Dockerfile/gateway smokes, installer/update smokes และ fast bundled-plugin Docker E2E เป็นงานแยกกัน เพื่อให้งาน installer ไม่ต้องรอหลัง root image smokes

การ push ไปยัง `main` (รวมถึง merge commits) ไม่บังคับให้ใช้ full path เมื่อ logic ของ changed-scope จะร้องขอความครอบคลุมเต็มในการ push เวิร์กโฟลว์จะคง fast Docker smoke ไว้และปล่อย full install smoke ให้เป็นหน้าที่ของ nightly หรือ release validation

slow Bun global install image-provider smoke ถูก gate แยกต่างหากด้วย `run_bun_global_install_smoke` โดยรันตามตารางรายคืนและจาก release checks workflow และ manual `Install Smoke` dispatches สามารถเลือกเปิดใช้ได้ แต่ pull request และการ push ไปยัง `main` จะไม่รัน QR และ installer Docker tests เก็บ Dockerfile ที่เน้นการติดตั้งของตัวเองไว้

## Local Docker E2E

`pnpm test:docker:all` จะ prebuild อิมเมจ live-test ที่แชร์กันหนึ่งตัว แพ็ก OpenClaw หนึ่งครั้งเป็น npm tarball และบิลด์อิมเมจ `scripts/e2e/Dockerfile` ที่แชร์กันสองตัว:

- runner Node/Git แบบเปล่าสำหรับเลน installer/update/plugin-dependency;
- อิมเมจ functional ที่ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับเลนฟังก์ชันการทำงานปกติ

คำจำกัดความเลน Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs` และ runner จะรันเฉพาะแผนที่เลือกไว้ scheduler เลือกอิมเมจต่อเลนด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` จากนั้นรันเลนด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### ค่าที่ปรับได้

| ตัวแปร                                | ค่าเริ่มต้น | วัตถุประสงค์                                                                                  |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | จำนวนสล็อต main-pool สำหรับเลนปกติ                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | จำนวนสล็อต tail-pool ที่ไวต่อ provider                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | เพดานเลน live พร้อมกันเพื่อไม่ให้ providers throttle                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | เพดานเลน npm install พร้อมกัน                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | เพดานเลน multi-service พร้อมกัน                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | เว้นช่วงระหว่างการเริ่มเลนเพื่อหลีกเลี่ยง create storms ของ Docker daemon; ตั้งเป็น `0` เพื่อไม่เว้นช่วง     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout สำรองต่อเลน (120 นาที); เลน live/tail ที่เลือกไว้ใช้เพดานที่เข้มกว่า           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` พิมพ์แผนของ scheduler โดยไม่รันเลน                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | รายการเลนที่ตรงกันแบบคั่นด้วยจุลภาค; ข้าม cleanup smoke เพื่อให้ agents ทำซ้ำเลนที่ล้มเหลวหนึ่งเลนได้ |

เลนที่หนักกว่าเพดานมีผลของตัวเองยังสามารถเริ่มจาก pool ว่างได้ แล้วรันเดี่ยวจนกว่าจะปล่อย capacity aggregate ในเครื่องจะ preflight Docker, ลบคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่, แสดงสถานะ active-lane, บันทึกเวลาของเลนเพื่อจัดลำดับแบบ longest-first และหยุด schedule เลน pooled ใหม่หลังจาก failure แรกโดยค่าเริ่มต้น

### เวิร์กโฟลว์ live/E2E ที่ใช้ซ้ำได้

เวิร์กโฟลว์ live/E2E ที่ใช้ซ้ำได้จะถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องใช้แพ็กเกจ ชนิดอิมเมจ อิมเมจ live เลน และความครอบคลุม credential ใด `scripts/docker-e2e.mjs` จึงแปลงแผนนั้นเป็น GitHub outputs และสรุป โดยจะ either แพ็ก OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลด package artifact ของรันปัจจุบัน หรือดาวน์โหลด package artifact จาก `package_artifact_run_id`; ตรวจสอบ tarball inventory; บิลด์และ push อิมเมจ bare/functional GHCR Docker E2E ที่แท็กด้วย package-digest ผ่าน Docker layer cache ของ Blacksmith เมื่อแผนต้องใช้เลนที่ติดตั้งแพ็กเกจ; และใช้ input `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรืออิมเมจ package-digest ที่มีอยู่ซ้ำแทนการบิลด์ใหม่ การ pull อิมเมจ Docker จะ retry ด้วย timeout ต่อ attempt แบบมีขอบเขต 180 วินาที เพื่อให้ stream registry/cache ที่ค้าง retry ได้รวดเร็วแทนที่จะกิน critical path ของ CI ไปเกือบทั้งหมด

### ชังก์ของเส้นทาง release

ความครอบคลุม Docker สำหรับ release รันงานแบบ chunked ที่เล็กลงด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละ chunk pull เฉพาะชนิดอิมเมจที่ต้องใช้และรันหลายเลนผ่าน weighted scheduler เดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Docker chunks สำหรับ release ปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` และ `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` ส่วน `plugins-runtime-core`, `plugins-runtime` และ `plugins-integrations` ยังคงเป็น alias รวมของ plugin/runtime alias เลน `install-e2e` ยังคงเป็น alias rerun แบบ manual รวมสำหรับเลน provider installer ทั้งสอง

OpenWebUI ถูกรวมเข้าใน `plugins-runtime-services` เมื่อความครอบคลุม release-path เต็มร้องขอ และเก็บ chunk `openwebui` แบบ standalone ไว้เฉพาะสำหรับ dispatches ที่เป็น OpenWebUI-only เท่านั้น เลนอัปเดต bundled-channel retry หนึ่งครั้งสำหรับความล้มเหลวของเครือข่าย npm แบบชั่วคราว

แต่ละ chunk อัปโหลด `.artifacts/docker-tests/` พร้อมล็อกของเลน timing, `summary.json`, `failures.json`, timing ของเฟส, scheduler plan JSON, ตาราง slow-lane และคำสั่ง rerun ต่อเลน input `docker_lanes` ของเวิร์กโฟลว์รันเลนที่เลือกกับอิมเมจที่เตรียมไว้แทนงาน chunk ซึ่งทำให้การดีบัก failed-lane ถูกจำกัดอยู่ในงาน Docker เป้าหมายหนึ่งงาน และเตรียม ดาวน์โหลด หรือใช้อาร์ติแฟกต์แพ็กเกจสำหรับรันนั้นซ้ำ หากเลนที่เลือกเป็นเลน live Docker งานเป้าหมายจะบิลด์อิมเมจ live-test ภายในเครื่องสำหรับ rerun นั้น คำสั่ง GitHub rerun ต่อเลนที่สร้างขึ้นจะรวม `package_artifact_run_id`, `package_artifact_name` และ input อิมเมจที่เตรียมไว้เมื่อมีค่าเหล่านั้น เพื่อให้เลนที่ล้มเหลวใช้งานแพ็กเกจและอิมเมจชุดเดียวกับรันที่ล้มเหลวซ้ำได้

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

เวิร์กโฟลว์ live/E2E ตามกำหนดการรันชุด Docker release-path เต็มทุกวัน

## Plugin Prerelease

`Plugin Prerelease` เป็นความครอบคลุม product/package ที่มีค่าใช้จ่ายสูงกว่า จึงเป็นเวิร์กโฟลว์แยกต่างหากที่ถูก dispatch โดย `Full Release Validation` หรือโดย operator ที่ระบุอย่างชัดเจน pull request ปกติ การ push ไปยัง `main` และ standalone manual CI dispatches จะไม่เปิดชุดนี้ มันกระจายเทสต์ Plugin ที่บันเดิลมาข้าม extension workers แปดตัว งาน shard ของ extension เหล่านั้นรันกลุ่ม config ของ Plugin ได้สูงสุดครั้งละสองกลุ่ม โดยมี Vitest worker หนึ่งตัวต่อกลุ่มและ Node heap ที่ใหญ่ขึ้น เพื่อให้ batch ของ Plugin ที่มี import หนักไม่สร้างงาน CI เพิ่มเติม release-only Docker prerelease path จัดชุดเลน Docker เป้าหมายเป็นกลุ่มเล็กๆ เพื่อหลีกเลี่ยงการจอง runners หลายสิบตัวสำหรับงานหนึ่งถึงสามนาที

## QA Lab

QA Lab มีเลน CI เฉพาะแยกจากเวิร์กโฟลว์ smart-scoped หลัก Agentic parity ซ้อนอยู่ภายใต้ harness QA และ release แบบกว้าง ไม่ใช่เวิร์กโฟลว์ PR แบบ standalone ใช้ `Full Release Validation` พร้อม `rerun_group=qa-parity` เมื่อ parity ควรร่วมไปกับรัน validation แบบกว้าง

- เวิร์กโฟลว์ `QA-Lab - All Lanes` รันรายคืนบน `main` และบน manual dispatch; มันกระจายเลน mock parity, เลน live Matrix และเลน live Telegram และ Discord เป็นงานขนาน งาน live ใช้สภาพแวดล้อม `qa-live-shared` และ Telegram/Discord ใช้ Convex leases

Release checks รันเลน Matrix และ Telegram live transport ด้วย deterministic mock provider และโมเดลที่ qualified ด้วย mock (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อให้สัญญาของ channel แยกจาก latency ของ live model และการเริ่มต้น provider-plugin ปกติ live transport gateway ปิดใช้ memory search เพราะ QA parity ครอบคลุมพฤติกรรม memory แยกต่างหาก ความสามารถในการเชื่อมต่อ provider ถูกครอบคลุมโดยชุด live model, native provider และ Docker provider ที่แยกต่างหาก

Matrix ใช้ `--profile fast` สำหรับ scheduled และ release gates โดยเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout รองรับเท่านั้น ค่าเริ่มต้นของ CLI และ input ของ manual workflow ยังคงเป็น `all`; manual dispatch ที่ใช้ `matrix_profile=all` จะแบ่ง shard ความครอบคลุม Matrix เต็มเป็นงาน `transport`, `media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรันเลน QA Lab ที่ critical ต่อ release ก่อนอนุมัติ release; QA parity gate ของมันรัน candidate และ baseline packs เป็นงานเลนแบบขนาน จากนั้นดาวน์โหลดอาร์ติแฟกต์ทั้งสองเข้าไปในงานรายงานขนาดเล็กสำหรับการเปรียบเทียบ parity ขั้นสุดท้าย

สำหรับ PR ปกติ ให้ปฏิบัติตามหลักฐาน CI/check ตามขอบเขตแทนการถือว่า parity เป็นสถานะที่จำเป็น

## CodeQL

เวิร์กโฟลว์ `CodeQL` ตั้งใจให้เป็นเครื่องสแกนความปลอดภัยรอบแรกแบบแคบ ไม่ใช่การกวาดทั้งรีโพซิทอรีทั้งหมด การรันรายวัน แบบแมนนวล และการรัน guard สำหรับ pull request ที่ไม่ใช่ draft จะสแกนโค้ดเวิร์กโฟลว์ Actions รวมถึงพื้นผิว JavaScript/TypeScript ที่มีความเสี่ยงสูงสุดด้วยคิวรีความปลอดภัยที่มีความเชื่อมั่นสูง โดยกรองเหลือ `security-severity` ระดับสูง/วิกฤต

guard ของ pull request ยังคงเบา: จะเริ่มเฉพาะการเปลี่ยนแปลงภายใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` หรือ `src` และรันเมทริกซ์ความปลอดภัยที่มีความเชื่อมั่นสูงชุดเดียวกับเวิร์กโฟลว์ตามกำหนดการ ค่าเริ่มต้นของ PR จะไม่รวม Android และ macOS CodeQL

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                          | พื้นผิว                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron และ baseline ของ gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการใช้งาน implementation ของช่องทาง core รวมถึงรันไทม์ Plugin ของช่องทาง, gateway, Plugin SDK, secrets และจุดสัมผัส audit              |
| `/codeql-security-high/network-ssrf-boundary`     | พื้นผิว core SSRF, การแยกวิเคราะห์ IP, network guard, web-fetch และนโยบาย SSRF ของ Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | เซิร์ฟเวอร์ MCP, ตัวช่วยการดำเนินการ process, การส่งออก และ gate การดำเนินการ tool ของ agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | พื้นผิวความน่าเชื่อถือของการติดตั้ง Plugin, loader, manifest, registry, การติดตั้ง package-manager, source-loading และสัญญาแพ็กเกจ Plugin SDK |

### shard ความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — shard ความปลอดภัย Android ตามกำหนดการ สร้างแอป Android ด้วยตนเองสำหรับ CodeQL บน Blacksmith Linux runner ที่เล็กที่สุดซึ่ง workflow sanity ยอมรับ อัปโหลดภายใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — shard ความปลอดภัย macOS รายสัปดาห์/แบบแมนนวล สร้างแอป macOS ด้วยตนเองสำหรับ CodeQL บน Blacksmith macOS กรองผลลัพธ์ build ของ dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดภายใต้ `/codeql-critical-security/macos` เก็บไว้นอกค่าเริ่มต้นรายวันเพราะ build ของ macOS ใช้เวลารันมากแม้ไม่มีปัญหา

### หมวดหมู่คุณภาพวิกฤต

`CodeQL Critical Quality` คือ shard ฝั่งไม่ใช่ความปลอดภัยที่เข้าคู่กัน โดยรันเฉพาะคิวรีคุณภาพ JavaScript/TypeScript ที่ไม่ใช่ความปลอดภัยและมีระดับความรุนแรงเป็น error บนพื้นผิวมูลค่าสูงแบบแคบ บน Blacksmith Linux runner ขนาดเล็กกว่า guard ของ pull request ตั้งใจให้เล็กกว่าโปรไฟล์ตามกำหนดการ: PR ที่ไม่ใช่ draft จะรันเฉพาะ shard ที่ตรงกัน ได้แก่ `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` สำหรับการเปลี่ยนแปลงโค้ดการดำเนินการคำสั่ง/model/tool ของ agent และการ dispatch คำตอบ, โค้ด schema/migration/IO ของ config, โค้ด auth/secrets/sandbox/security, core channel และรันไทม์ Plugin ช่องทางที่ bundle มา, protocol/server-method ของ gateway, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract หรือรันไทม์คำตอบของ Plugin SDK การเปลี่ยนแปลง CodeQL config และเวิร์กโฟลว์คุณภาพจะรัน shard คุณภาพของ PR ทั้งสิบสองรายการ

manual dispatch ยอมรับ:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

โปรไฟล์แบบแคบเป็น hook สำหรับการสอน/ทำซ้ำ เพื่อรัน shard คุณภาพหนึ่งรายการแยกเดี่ยว

| หมวดหมู่                                                | พื้นผิว                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ดขอบเขตความปลอดภัยของ auth, secrets, sandbox, cron และ gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | สัญญาของ schema, migration, normalization และ IO ของ config                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schema ของ protocol ของ Gateway และสัญญา server method                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญา implementation ของ core channel และ Plugin ช่องทางที่ bundle มา                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | การดำเนินการคำสั่ง, การ dispatch model/provider, การ dispatch และ queue ของ auto-reply และสัญญา runtime ของ control-plane ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | เซิร์ฟเวอร์ MCP และ bridge ของ tool, ตัวช่วย supervision ของ process และสัญญาการส่งออก                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, facade ของ memory runtime, alias ของ memory Plugin SDK, glue การเปิดใช้งาน memory runtime และคำสั่ง memory doctor                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | internals ของ reply queue, delivery queue ของ session, ตัวช่วย binding/delivery ของ outbound session, พื้นผิว diagnostic event/log bundle และสัญญา CLI ของ session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | การ dispatch คำตอบขาเข้าของ Plugin SDK, payload/chunking/runtime helper ของคำตอบ, ตัวเลือกคำตอบของช่องทาง, delivery queue และตัวช่วย binding ของ session/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | การ normalize model catalog, auth และ discovery ของ provider, การลงทะเบียน provider runtime, defaults/catalogs ของ provider และ registry ของ web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | การ bootstrap ของ Control UI, persistence ภายในเครื่อง, flow การควบคุม Gateway และสัญญา runtime ของ task control-plane                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | สัญญา runtime ของ core web fetch/search, media IO, media understanding, image-generation และ media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | สัญญา entrypoint ของ loader, registry, public-surface และ Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | source ของ Plugin SDK ฝั่งแพ็กเกจที่เผยแพร่ และตัวช่วยสัญญาแพ็กเกจ Plugin                                                                                      |

แยกคุณภาพออกจากความปลอดภัยเพื่อให้สามารถกำหนดเวลา วัดผล ปิดใช้งาน หรือขยาย finding ด้านคุณภาพได้โดยไม่บดบังสัญญาณความปลอดภัย ควรเพิ่มการขยาย CodeQL สำหรับ Swift, Python และ bundled-plugin กลับมาเป็นงานต่อเนื่องแบบมีขอบเขตหรือแบ่ง shard หลังจากโปรไฟล์แบบแคบมี runtime และสัญญาณที่เสถียรแล้วเท่านั้น

## เวิร์กโฟลว์บำรุงรักษา

### Docs Agent

เวิร์กโฟลว์ `Docs Agent` เป็นเลนบำรุงรักษา Codex แบบขับเคลื่อนด้วยเหตุการณ์สำหรับรักษาเอกสารที่มีอยู่ให้สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง land แล้ว ไม่มี schedule ล้วน: การรัน CI ที่สำเร็จจาก push ที่ไม่ใช่ bot บน `main` สามารถ trigger ได้ และ manual dispatch สามารถรันโดยตรงได้ การเรียกผ่าน workflow-run จะข้ามเมื่อ `main` เดินหน้าไปแล้ว หรือเมื่อมีการรัน Docs Agent อื่นที่ไม่ถูกข้ามถูกสร้างขึ้นในหนึ่งชั่วโมงที่ผ่านมา เมื่อรัน จะตรวจสอบช่วง commit จาก source SHA ของ Docs Agent ที่ไม่ถูกข้ามครั้งก่อนหน้าถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงหนึ่งครั้งจึงครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมตั้งแต่รอบตรวจเอกสารครั้งล่าสุดได้

### Test Performance Agent

เวิร์กโฟลว์ `Test Performance Agent` เป็นเลนบำรุงรักษา Codex แบบขับเคลื่อนด้วยเหตุการณ์สำหรับ test ที่ช้า ไม่มี schedule ล้วน: การรัน CI ที่สำเร็จจาก push ที่ไม่ใช่ bot บน `main` สามารถ trigger ได้ แต่จะข้ามหากมีการเรียก workflow-run อื่นรันไปแล้วหรือกำลังรันอยู่ในวัน UTC นั้น manual dispatch จะข้าม gate กิจกรรมรายวันนี้ เลนนี้สร้างรายงานประสิทธิภาพ Vitest แบบ full-suite grouped ให้ Codex แก้ไขประสิทธิภาพ test เพียงเล็กน้อยโดยยังรักษา coverage แทนการ refactor กว้าง ๆ จากนั้นรันรายงาน full-suite ซ้ำและปฏิเสธการเปลี่ยนแปลงที่ลดจำนวน test baseline ที่ผ่าน หาก baseline มี test ที่ล้มเหลว Codex อาจแก้เฉพาะความล้มเหลวที่ชัดเจน และรายงาน full-suite หลัง agent ต้องผ่านก่อน commit ใด ๆ เมื่อ `main` เดินหน้าก่อน bot push จะ land เลนนี้จะ rebase patch ที่ตรวจสอบแล้ว รัน `pnpm check:changed` ซ้ำ และลอง push อีกครั้ง patch stale ที่ conflict จะถูกข้าม ใช้ GitHub-hosted Ubuntu เพื่อให้ Codex action คง posture ความปลอดภัยแบบ drop-sudo เดียวกับ docs agent ได้

### PR ซ้ำหลัง merge

เวิร์กโฟลว์ `Duplicate PRs After Merge` เป็นเวิร์กโฟลว์ maintainer แบบแมนนวลสำหรับการทำความสะอาด duplicate หลัง land ค่าเริ่มต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุอย่างชัดเจนเมื่อ `apply=true` ก่อนแก้ไข GitHub จะตรวจสอบว่า PR ที่ land แล้วถูก merge แล้ว และ duplicate แต่ละรายการมี issue ที่อ้างอิงร่วมกันหรือมี hunk ที่เปลี่ยนแปลงทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## gate การตรวจภายในเครื่องและการ route การเปลี่ยนแปลง

ตรรกะ changed-lane ภายในเครื่องอยู่ใน `scripts/changed-lanes.mjs` และถูกดำเนินการโดย `scripts/check-changed.mjs` gate การตรวจภายในเครื่องนั้นเข้มงวดเรื่องขอบเขตสถาปัตยกรรมมากกว่าขอบเขตแพลตฟอร์ม CI แบบกว้าง:

- การเปลี่ยนแปลง production ของ core รัน typecheck ของ core prod และ core test รวมถึง lint/guards ของ core;
- การเปลี่ยนแปลงเฉพาะ test ของ core รันเฉพาะ typecheck ของ core test รวมถึง lint ของ core;
- การเปลี่ยนแปลง production ของ extension รัน typecheck ของ extension prod และ extension test รวมถึง lint ของ extension;
- การเปลี่ยนแปลงเฉพาะ test ของ extension รัน typecheck ของ extension test รวมถึง lint ของ extension;
- การเปลี่ยนแปลง Plugin SDK สาธารณะหรือ plugin-contract จะขยายไปยัง typecheck ของ extension เพราะ extension พึ่งพาสัญญา core เหล่านั้น (การกวาด Vitest ของ extension ยังคงเป็นงาน test ที่ต้องสั่งอย่างชัดเจน);
- การ bump version ที่เป็น metadata-only ของ release รันการตรวจ version/config/root-dependency แบบเจาะจง;
- การเปลี่ยนแปลง root/config ที่ไม่รู้จักจะ fail safe ไปยัง check lane ทั้งหมด

การ route changed-test ภายในเครื่องอยู่ใน `scripts/test-projects.test-support.mjs` และตั้งใจให้ถูกกว่า `check:changed`: การแก้ไข test โดยตรงจะรันตัวเอง การแก้ไข source จะเลือก mapping ที่ชัดเจนก่อน จากนั้นจึงใช้ test ข้างเคียงและ dependent ใน import-graph config การส่งมอบ group-room ที่ใช้ร่วมกันเป็นหนึ่งใน mapping ที่ชัดเจน: การเปลี่ยนแปลง config visible-reply ของกลุ่ม, โหมดการส่งมอบ source reply หรือ prompt ระบบของ message-tool จะ route ผ่าน core reply tests รวมถึง regression การส่งมอบของ Discord และ Slack เพื่อให้การเปลี่ยนค่า default ที่ใช้ร่วมกันล้มเหลวก่อน push PR ครั้งแรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างระดับ harness จนชุด mapped ราคาถูกไม่ใช่ proxy ที่เชื่อถือได้เท่านั้น

## การตรวจสอบด้วย Testbox

รัน Testbox จากรูทของรีโป และควรใช้กล่องใหม่ที่อุ่นไว้แล้วสำหรับหลักฐานแบบกว้าง ก่อนใช้เกตที่ช้าบนกล่องที่ถูกนำกลับมาใช้ซ้ำ หมดอายุ หรือเพิ่งรายงานการซิงก์ที่มีขนาดใหญ่ผิดคาด ให้รัน `pnpm testbox:sanity` ภายในกล่องก่อน

การตรวจสอบ sanity จะล้มเหลวอย่างรวดเร็วเมื่อไฟล์รูทที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short` แสดงการลบไฟล์ที่ติดตามแล้วอย่างน้อย 200 รายการ โดยทั่วไปหมายความว่าสถานะการซิงก์ระยะไกลไม่ใช่สำเนา PR ที่เชื่อถือได้ ให้หยุดกล่องนั้นและอุ่นกล่องใหม่แทนการดีบักความล้มเหลวของการทดสอบผลิตภัณฑ์ สำหรับ PR ที่ตั้งใจลบไฟล์จำนวนมาก ให้ตั้งค่า `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับการรัน sanity นั้น

`pnpm testbox:run` ยังยุติการเรียกใช้ Blacksmith CLI ในเครื่องที่ค้างอยู่ในเฟสซิงก์นานกว่าห้านาทีโดยไม่มีเอาต์พุตหลังซิงก์ ตั้งค่า `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` เพื่อปิดใช้งานตัวป้องกันนี้ หรือใช้ค่ามิลลิวินาทีที่มากขึ้นสำหรับ diff ในเครื่องที่มีขนาดใหญ่ผิดปกติ

Crabbox คือ wrapper กล่องระยะไกลที่รีโปเป็นเจ้าของสำหรับหลักฐาน Linux ของผู้ดูแล ใช้เมื่อตัวตรวจสอบกว้างเกินไปสำหรับลูปแก้ไขในเครื่อง เมื่อความเทียบเท่า CI สำคัญ หรือเมื่อหลักฐานต้องใช้ secrets, Docker, package lanes, กล่องที่นำกลับมาใช้ซ้ำได้ หรือบันทึกระยะไกล backend ปกติของ OpenClaw คือ `blacksmith-testbox`; ความจุ AWS/Hetzner ที่เป็นเจ้าของเป็นทางเลือกสำรองเมื่อ Blacksmith ล่ม มีปัญหาโควตา หรือมีการทดสอบความจุที่เป็นเจ้าของอย่างชัดเจน

ก่อนรันครั้งแรก ให้ตรวจสอบ wrapper จากรูทของรีโป:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

wrapper ของรีโปจะปฏิเสธไบนารี Crabbox ที่ล้าสมัยซึ่งไม่ได้ประกาศ `blacksmith-testbox` ให้ส่ง provider อย่างชัดเจน แม้ว่า `.crabbox.yaml` จะมีค่าเริ่มต้นของ owned-cloud อยู่แล้ว

เกตสำหรับการเปลี่ยนแปลง:

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

รันการทดสอบแบบเจาะจงซ้ำ:

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

ชุดทดสอบทั้งหมด:

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

อ่านสรุป JSON สุดท้าย ฟิลด์ที่มีประโยชน์คือ `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` และ `totalMs` การรัน Crabbox แบบครั้งเดียวที่มี Blacksmith หนุนหลังควรหยุด Testbox โดยอัตโนมัติ หากการรันถูกขัดจังหวะหรือการล้างข้อมูลไม่ชัดเจน ให้ตรวจสอบกล่องที่ยังทำงานอยู่และหยุดเฉพาะกล่องที่คุณสร้าง:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

ใช้การนำกลับมาใช้ซ้ำเฉพาะเมื่อคุณตั้งใจต้องการหลายคำสั่งบนกล่องเดียวกันที่ hydrate แล้ว:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

หาก Crabbox เป็นชั้นที่เสีย แต่ Blacksmith เองยังทำงาน ให้ใช้ Blacksmith โดยตรงเป็นทางเลือกสำรองแบบจำกัดขอบเขต:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

ยกระดับไปใช้ความจุ Crabbox ที่เป็นเจ้าของเฉพาะเมื่อ Blacksmith ล่ม ถูกจำกัดโควตา ขาดสภาพแวดล้อมที่ต้องใช้ หรือความจุที่เป็นเจ้าของเป็นเป้าหมายอย่างชัดเจน:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` เป็นเจ้าของค่าเริ่มต้นของ provider, sync และการ hydrate ของ GitHub Actions สำหรับ lanes ของ owned-cloud ไฟล์นี้ยกเว้น `.git` ในเครื่องเพื่อให้ checkout ของ Actions ที่ hydrate แล้วเก็บ metadata Git ระยะไกลของตัวเองไว้ แทนที่จะซิงก์ remotes และ object stores ในเครื่องของผู้ดูแล และยกเว้น artifacts ของ runtime/build ในเครื่องที่ไม่ควรถูกถ่ายโอนโดยเด็ดขาด `.github/workflows/crabbox-hydrate.yml` เป็นเจ้าของ checkout, การตั้งค่า Node/pnpm, การ fetch `origin/main` และการส่งต่อสภาพแวดล้อมที่ไม่ใช่ secret สำหรับคำสั่ง owned-cloud `crabbox run --id <cbx_id>`

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
