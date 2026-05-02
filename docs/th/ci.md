---
read_when:
    - คุณต้องเข้าใจว่าเหตุใดงาน CI จึงรันหรือไม่รัน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการรันหรือรันซ้ำสำหรับการตรวจสอบความถูกต้องของรีลีส
    - คุณกำลังเปลี่ยนการส่งงานของ ClawSweeper หรือการส่งต่อกิจกรรม GitHub
summary: กราฟงาน CI, เกตตามขอบเขต, กลุ่มครอบคลุมการรีลีส และคำสั่งในเครื่องที่เทียบเท่า
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-05-02T23:39:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321fe0a061044f75b8e1d03b4d3e76d4f8dd2dae0ebc58831887fc20af953cf1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI ทำงานทุกครั้งที่ push ไปยัง `main` และทุก pull request งาน `preflight` จะจำแนก diff และปิด lane ที่ใช้ทรัพยากรมากเมื่อมีเฉพาะส่วนที่ไม่เกี่ยวข้องเปลี่ยนแปลง การรันแบบ manual `workflow_dispatch` ตั้งใจข้าม smart scoping และกระจายงานไปทั้งกราฟเต็มสำหรับ release candidate และการตรวจสอบแบบกว้าง lane ของ Android ยังคงเป็นแบบ opt-in ผ่าน `include_android` การครอบคลุม Plugin เฉพาะ release อยู่ใน workflow [`Plugin ก่อนเผยแพร่`](#plugin-prerelease) แยกต่างหาก และจะรันจาก [`การตรวจสอบ Release แบบเต็ม`](#full-release-validation) หรือ explicit manual dispatch เท่านั้น

## ภาพรวม Pipeline

| งาน                              | วัตถุประสงค์                                                                                                             | เมื่อรัน                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | ตรวจจับการเปลี่ยนแปลงเฉพาะเอกสาร, scope ที่เปลี่ยน, extension ที่เปลี่ยน และสร้าง manifest ของ CI                             | เสมอสำหรับ push และ PR ที่ไม่ใช่ draft |
| `security-scm-fast`              | ตรวจจับ private key และตรวจสอบ workflow ผ่าน `zizmor`                                                               | เสมอสำหรับ push และ PR ที่ไม่ใช่ draft |
| `security-dependency-audit`      | ตรวจสอบ lockfile ของ production แบบไม่ต้องใช้ dependency เทียบกับคำแนะนำด้านความปลอดภัยของ npm                                                    | เสมอสำหรับ push และ PR ที่ไม่ใช่ draft |
| `security-fast`                  | aggregate ที่จำเป็นสำหรับงาน security แบบเร็ว                                                                       | เสมอสำหรับ push และ PR ที่ไม่ใช่ draft |
| `check-dependencies`             | pass เฉพาะ dependency ของ production ด้วย Knip พร้อม guard สำหรับ allowlist ของไฟล์ที่ไม่ได้ใช้                                           | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-artifacts`                | build `dist/`, Control UI, ตรวจสอบ built-artifact และ artifact downstream ที่ใช้ซ้ำได้                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-core`               | lane ความถูกต้องบน Linux แบบเร็ว เช่น bundled/plugin-contract/protocol checks                                        | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-contracts-channels` | ตรวจสอบ channel contract แบบ shard พร้อมผล aggregate check ที่เสถียร                                                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-core-test`          | shard ทดสอบ core Node โดยไม่รวม lane ของ channel, bundled, contract และ extension                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check`                          | เทียบเท่า gate หลักในเครื่องแบบ shard: prod types, lint, guards, test types และ strict smoke                          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check-additional`               | shard สำหรับ architecture, boundary, prompt snapshot drift, guard ของ extension surface, package-boundary และ gateway-watch | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-smoke`                    | smoke test สำหรับ built-CLI และ startup-memory smoke                                                                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks`                         | verifier สำหรับการทดสอบ channel ของ built-artifact                                                                           | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-compat-node22`      | build และ smoke lane สำหรับความเข้ากันได้กับ Node 22                                                                          | manual CI dispatch สำหรับ release    |
| `check-docs`                     | ตรวจสอบ formatting, lint และ broken-link ของเอกสาร                                                                       | เอกสารเปลี่ยน                       |
| `skills-python`                  | Ruff + pytest สำหรับ Skills ที่รองรับด้วย Python                                                                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python skill      |
| `checks-windows`                 | การทดสอบ process/path เฉพาะ Windows พร้อม regression ของ runtime import specifier ที่ใช้ร่วมกัน                                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows           |
| `macos-node`                     | lane ทดสอบ TypeScript บน macOS โดยใช้ built artifact ที่ใช้ร่วมกัน                                                         | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `macos-swift`                    | Swift lint, build และ tests สำหรับแอป macOS                                                                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `android`                        | unit test ของ Android สำหรับทั้งสอง flavor พร้อม build debug APK หนึ่งรายการ                                                        | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android           |
| `test-performance-agent`         | การปรับแต่ง slow-test รายวันของ Codex หลังจากกิจกรรมที่เชื่อถือได้                                                           | Main CI สำเร็จหรือ manual dispatch |
| `openclaw-performance`           | รายงานประสิทธิภาพ runtime ของ Kova แบบรายวัน/ตามต้องการ พร้อม lane mock-provider, deep-profile และ GPT 5.4 live           | Scheduled และ manual dispatch      |

## ลำดับ Fail-fast

1. `preflight` ตัดสินใจว่า lane ใดมีอยู่ตั้งแต่แรก ตรรกะ `docs-scope` และ `changed-scope` เป็นขั้นตอนภายในงานนี้ ไม่ใช่งาน standalone
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` fail อย่างรวดเร็วโดยไม่ต้องรอ artifact และ platform matrix jobs ที่หนักกว่า
3. `build-artifacts` ทำงานซ้อนกับ lane Linux แบบเร็ว เพื่อให้ downstream consumer เริ่มได้ทันทีที่ shared build พร้อม
4. lane ของ platform และ runtime ที่หนักกว่าจะกระจายต่อหลังจากนั้น: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่เป็น `cancelled` เมื่อมี push ใหม่ลงใน PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่าเป็น noise ของ CI เว้นแต่ run ล่าสุดของ ref เดียวกันก็ fail ด้วย aggregate shard checks ใช้ `!cancelled() && always()` เพื่อให้ยังรายงาน shard failure ปกติ แต่ไม่ queue หลังจากทั้ง workflow ถูกแทนที่ไปแล้ว concurrency key อัตโนมัติของ CI มี version (`CI-v7-*`) เพื่อให้ zombie ฝั่ง GitHub ในกลุ่ม queue เก่าไม่สามารถ block main run ใหม่ได้อย่างไม่มีกำหนด manual full-suite runs ใช้ `CI-manual-v1-*` และไม่ cancel run ที่กำลังดำเนินอยู่

## Scope และ routing

ตรรกะ scope อยู่ใน `scripts/ci-changed-scope.mjs` และครอบคลุมด้วย unit test ใน `src/scripts/ci-changed-scope.test.ts` manual dispatch ข้ามการตรวจจับ changed-scope และทำให้ preflight manifest ทำตัวเหมือนทุก scoped area มีการเปลี่ยนแปลง

- **การแก้ไข CI workflow** ตรวจสอบกราฟ Node CI พร้อม workflow linting แต่ไม่ได้บังคับให้ Windows, Android หรือ macOS native builds รันด้วยตัวเอง lane ของ platform เหล่านั้นยังถูก scope ไว้กับการเปลี่ยนแปลง source ของ platform
- **การแก้ไขเฉพาะ CI routing, การแก้ไข core-test fixture ราคาถูกบางรายการ และการแก้ไข helper/test-routing ของ plugin contract แบบแคบ** ใช้เส้นทาง manifest แบบ Node-only ที่เร็ว: `preflight`, security และ task `checks-fast-core` เดียว เส้นทางนั้นข้าม build artifacts, ความเข้ากันได้กับ Node 22, channel contracts, full core shards, bundled-plugin shards และ additional guard matrices เมื่อการเปลี่ยนแปลงจำกัดอยู่ที่พื้นผิว routing หรือ helper ที่ task แบบเร็วทดสอบโดยตรง
- **Windows Node checks** ถูก scope ไว้กับ process/path wrappers เฉพาะ Windows, ตัวช่วย npm/pnpm/UI runner, package manager config และพื้นผิว CI workflow ที่รัน lane นั้น การเปลี่ยนแปลง source, Plugin, install-smoke และ test-only ที่ไม่เกี่ยวข้องจะอยู่บน lane Linux Node ต่อไป

กลุ่มการทดสอบ Node ที่ช้าที่สุดถูกแยกหรือถ่วงน้ำหนักเพื่อให้แต่ละงานยังเล็กโดยไม่จอง runner เกินจำเป็น: channel contracts รันเป็นสาม weighted shards, lane core unit ขนาดเล็กถูกจับคู่, auto-reply รันเป็น worker ที่สมดุลสี่ตัว (โดยแยก subtree ของ reply เป็น shard agent-runner, dispatch และ commands/state-routing) และ config ของ agentic gateway/plugin ถูกกระจายไปยังงาน agentic Node แบบ source-only ที่มีอยู่แทนการรอ built artifacts การทดสอบ browser, QA, media และ Plugin เบ็ดเตล็ดแบบกว้างใช้ config Vitest เฉพาะของตัวเองแทน plugin catch-all ที่ใช้ร่วมกัน Include-pattern shards บันทึกรายการ timing โดยใช้ชื่อ CI shard เพื่อให้ `.artifacts/vitest-shard-timings.json` แยกทั้ง config ออกจาก shard ที่ถูก filter ได้ `check-additional` รวมงาน compile/canary ของ package-boundary ไว้ด้วยกัน และแยก runtime topology architecture ออกจาก gateway watch coverage; shard boundary guard รัน guard อิสระขนาดเล็กพร้อมกันภายในงานเดียว รวมถึง `pnpm prompt:snapshots:check` เพื่อ pin prompt drift ของ happy-path ใน runtime ของ Codex ไว้กับ PR ที่ทำให้เกิด drift นั้น Gateway watch, channel tests และ shard core support-boundary รันพร้อมกันภายใน `build-artifacts` หลังจาก build `dist/` และ `dist-runtime/` แล้ว

Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` จากนั้น build Play debug APK flavor third-party ไม่มี source set หรือ manifest แยกต่างหาก lane unit-test ของมันยัง compile flavor พร้อม flag BuildConfig ของ SMS/call-log ในขณะที่หลีกเลี่ยงงาน packaging debug APK ซ้ำในทุก push ที่เกี่ยวข้องกับ Android

shard `check-dependencies` รัน `pnpm deadcode:dependencies` (pass เฉพาะ dependency ของ production ด้วย Knip ที่ pin กับ Knip version ล่าสุด โดยปิด minimum release age ของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบผล unused-file ของ production จาก Knip กับ `scripts/deadcode-unused-files.allowlist.mjs` guard unused-file จะ fail เมื่อ PR เพิ่มไฟล์ที่ไม่ได้ใช้ซึ่งยังไม่ถูก review ใหม่ หรือเหลือ allowlist entry ที่ stale ในขณะที่ยังคงรักษาพื้นผิว dynamic plugin, generated, build, live-test และ package bridge ที่ Knip ไม่สามารถ resolve แบบ static ได้อย่างตั้งใจ

## การส่งต่อกิจกรรม ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` เป็น bridge ฝั่งเป้าหมายจากกิจกรรมใน repository OpenClaw ไปยัง ClawSweeper มันไม่ checkout หรือ execute โค้ด pull request ที่ไม่น่าเชื่อถือ workflow สร้าง token ของ GitHub App จาก `CLAWSWEEPER_APP_PRIVATE_KEY` จากนั้น dispatch payload `repository_dispatch` แบบกระชับไปยัง `openclaw/clawsweeper`

workflow มีสี่ lane:

- `clawsweeper_item` สำหรับคำขอ review issue และ pull request ที่เจาะจง;
- `clawsweeper_comment` สำหรับคำสั่ง ClawSweeper ที่ระบุชัดใน issue comments;
- `clawsweeper_commit_review` สำหรับคำขอ review ระดับ commit บน push ไปยัง `main`;
- `github_activity` สำหรับกิจกรรม GitHub ทั่วไปที่ agent ClawSweeper อาจตรวจสอบ

lane `github_activity` ส่งต่อเฉพาะ metadata ที่ normalize แล้ว: event type, action, actor, repository, item number, URL, title, state และ excerpt สั้นสำหรับ comments หรือ reviews เมื่อมีอยู่ มันตั้งใจหลีกเลี่ยงการส่งต่อ webhook body ทั้งหมด workflow ฝั่งรับใน `openclaw/clawsweeper` คือ `.github/workflows/github-activity.yml` ซึ่ง post event ที่ normalize แล้วไปยัง hook ของ OpenClaw Gateway สำหรับ agent ClawSweeper

กิจกรรมทั่วไปคือการสังเกต ไม่ใช่การส่งโดย default agent ClawSweeper ได้รับเป้าหมาย Discord ใน prompt และควร post ไปยัง `#clawsweeper` เฉพาะเมื่อ event นั้นน่าประหลาดใจ, ดำเนินการได้, มีความเสี่ยง หรือมีประโยชน์เชิงปฏิบัติการ การเปิด, การแก้ไข, bot churn, duplicate webhook noise และ review traffic ปกติควรได้ผลลัพธ์เป็น `NO_REPLY`

ให้ถือว่า title, comment, body, review text, branch name และ commit message ของ GitHub เป็นข้อมูลที่ไม่น่าเชื่อถือทั่วทั้งเส้นทางนี้ สิ่งเหล่านี้เป็น input สำหรับการสรุปและ triage ไม่ใช่คำสั่งสำหรับ workflow หรือ runtime ของ agent

## Manual dispatches

การ dispatch CI ด้วยตนเองจะรันกราฟงานเดียวกับ CI ปกติ แต่บังคับเปิดทุกเลนที่อยู่ในขอบเขตที่ไม่ใช่ Android: ชาร์ด Linux Node, ชาร์ด bundled-plugin, สัญญาแชนเนล, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, การตรวจเอกสาร, Python skills, Windows, macOS และ Control UI i18n การ dispatch CI ด้วยตนเองแบบสแตนด์อโลนจะรันเฉพาะ Android ด้วย `include_android=true`; umbrella สำหรับการเผยแพร่เต็มรูปแบบจะเปิดใช้ Android โดยส่ง `include_android=true` การตรวจแบบสแตติกสำหรับ Plugin prerelease, ชาร์ด `agentic-plugins` เฉพาะการเผยแพร่, การ sweep ชุดส่วนขยายเต็มรูปแบบ และเลน Docker สำหรับ Plugin prerelease จะถูกแยกออกจาก CI ชุด Docker prerelease จะรันเฉพาะเมื่อ `Full Release Validation` dispatch เวิร์กโฟลว์ `Plugin Prerelease` แยกต่างหากพร้อมเปิดใช้เกต release-validation

การรันด้วยตนเองใช้กลุ่ม concurrency ที่ไม่ซ้ำกัน เพื่อไม่ให้ชุดเต็มของ release-candidate ถูกยกเลิกโดยการรันจาก push หรือ PR อื่นบน ref เดียวกัน อินพุต `target_ref` แบบไม่บังคับช่วยให้ผู้เรียกที่เชื่อถือได้รันกราฟนั้นกับ branch, tag หรือ full commit SHA ได้ โดยใช้ไฟล์เวิร์กโฟลว์จาก dispatch ref ที่เลือก

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, งานความปลอดภัยแบบเร็วและตัวรวมผล (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจ protocol/contract/bundled แบบเร็ว, การตรวจสัญญาแชนเนลแบบแบ่งชาร์ด, ชาร์ด `check` ยกเว้น lint, ชาร์ดและตัวรวมผล `check-additional`, ตัวตรวจยืนยันผลรวมการทดสอบ Node, การตรวจเอกสาร, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight ยังใช้ Ubuntu ที่ GitHub โฮสต์ด้วย เพื่อให้เมทริกซ์ Blacksmith เข้าคิวได้เร็วขึ้น |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, ชาร์ดส่วนขยายที่มีน้ำหนักเบากว่า, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` และ `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, ชาร์ดการทดสอบ Linux Node, ชาร์ดการทดสอบ bundled Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (ไวต่อ CPU มากพอที่ 8 vCPU มีต้นทุนมากกว่าที่ช่วยประหยัดได้); บิลด์ Docker ของ install-smoke (เวลาคิว 32-vCPU มีต้นทุนมากกว่าที่ช่วยประหยัดได้)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; fork จะ fallback ไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; fork จะ fallback ไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## คำสั่งเทียบเท่าภายในเครื่อง

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

`OpenClaw Performance` คือเวิร์กโฟลว์ประสิทธิภาพของผลิตภัณฑ์/รันไทม์ เวิร์กโฟลว์นี้รันทุกวันบน `main` และสามารถ dispatch ด้วยตนเองได้:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

เวิร์กโฟลว์จะติดตั้ง OCM จากรุ่นที่ pin ไว้ และ Kova จากอินพุต `kova_ref` ที่ pin ไว้ จากนั้นรันสามเลน:

- `mock-provider`: สถานการณ์วินิจฉัยของ Kova กับรันไทม์บิลด์ในเครื่องที่ใช้การยืนยันตัวตนปลอมแบบ deterministic ที่เข้ากันได้กับ OpenAI
- `mock-deep-profile`: การทำโปรไฟล์ CPU/heap/trace สำหรับ hotspot ของ startup, Gateway และ agent-turn
- `live-gpt54`: agent turn ของ OpenAI `openai/gpt-5.4` จริง โดยข้ามเมื่อไม่มี `OPENAI_API_KEY`

เลน mock-provider ยังรัน source probe แบบ OpenClaw-native หลังจากผ่าน Kova: เวลา boot ของ Gateway และหน่วยความจำในกรณี startup แบบ default, hook และ 50-Plugin; ลูป hello ของ mock-OpenAI `channel-chat-baseline` ซ้ำๆ; และคำสั่งเริ่มต้น CLI กับ Gateway ที่ boot แล้ว สรุป Markdown ของ source probe อยู่ที่ `source/index.md` ในชุดรายงาน พร้อม JSON ดิบอยู่ข้างๆ

ทุกเลนอัปโหลด artifact ของ GitHub เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว เวิร์กโฟลว์ยัง commit `report.json`, `report.md`, bundle, `index.md` และ artifact ของ source-probe เข้าไปใน `openclaw/clawgrit-reports` ใต้ `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/` พอยน์เตอร์ของ branch ปัจจุบันจะถูกเขียนเป็น `openclaw-performance/<ref>/latest-<lane>.json`

## การตรวจสอบความถูกต้องเต็มรูปแบบก่อนเผยแพร่

`Full Release Validation` คือเวิร์กโฟลว์ umbrella แบบ manual สำหรับ "รันทุกอย่างก่อนเผยแพร่" โดยรับ branch, tag หรือ full commit SHA, dispatch เวิร์กโฟลว์ `CI` แบบ manual ด้วยเป้าหมายนั้น, dispatch `Plugin Prerelease` สำหรับหลักฐาน Plugin/package/static/Docker เฉพาะการเผยแพร่ และ dispatch `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, ชุด release-path ของ Docker, live/E2E, OpenWebUI, QA Lab parity, Matrix และเลน Telegram เมื่อใช้ `rerun_group=all` และ `release_profile=full` จะรัน `NPM Telegram Beta E2E` กับ artifact `release-package-under-test` จาก release checks ด้วย หลังเผยแพร่แล้ว ให้ส่ง `npm_telegram_package_spec` เพื่อรันเลน package ของ Telegram เดิมอีกครั้งกับแพ็กเกจ npm ที่เผยแพร่แล้ว

ดู [การตรวจสอบความถูกต้องเต็มรูปแบบก่อนเผยแพร่](/th/reference/full-release-validation) สำหรับ
เมทริกซ์ของแต่ละขั้น, ชื่องานเวิร์กโฟลว์ที่แน่นอน, ความแตกต่างของโปรไฟล์, artifact และ
ตัวจัดการการรันซ้ำแบบเจาะจง

`OpenClaw Release Publish` คือเวิร์กโฟลว์เผยแพร่แบบ manual ที่มีการเปลี่ยนแปลงสถานะ Dispatch จาก `release/YYYY.M.D` หรือ `main` หลังจากมี tag การเผยแพร่แล้ว และหลังจาก OpenClaw npm preflight สำเร็จแล้ว เวิร์กโฟลว์นี้ตรวจยืนยัน `pnpm plugins:sync:check`, dispatch `Plugin NPM Release` สำหรับแพ็กเกจ Plugin ทั้งหมดที่เผยแพร่ได้, dispatch `Plugin ClawHub Release` สำหรับ release SHA เดียวกัน และจากนั้นเท่านั้นจึง dispatch `OpenClaw NPM Release` ด้วย `preflight_run_id` ที่บันทึกไว้

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

dispatch ref ของ GitHub workflow ต้องเป็น branch หรือ tag ไม่ใช่ commit SHA ดิบ helper จะ push branch ชั่วคราว `release-ci/<sha>-...` ที่ target SHA, dispatch `Full Release Validation` จาก ref ที่ pin นั้น, ตรวจยืนยันว่า `headSha` ของทุก child workflow ตรงกับ target และลบ branch ชั่วคราวเมื่อการรันเสร็จ ตัวตรวจยืนยัน umbrella จะ fail ด้วยหากมี child workflow ใดรันที่ SHA ต่างออกไป

`release_profile` ควบคุมขอบเขต live/provider ที่ส่งเข้าไปยัง release checks เวิร์กโฟลว์ release แบบ manual มีค่าเริ่มต้นเป็น `stable`; ใช้ `full` เฉพาะเมื่อคุณตั้งใจต้องการเมทริกซ์ provider/media เชิงคำแนะนำที่กว้าง

- `minimum` เก็บเลน OpenAI/core ที่สำคัญต่อการเผยแพร่และเร็วที่สุดไว้
- `stable` เพิ่มชุด provider/backend ที่เสถียร
- `full` รันเมทริกซ์ provider/media เชิงคำแนะนำที่กว้าง

umbrella จะบันทึก run id ของ child ที่ dispatch แล้ว และงานสุดท้าย `Verify full validation` จะตรวจซ้ำ conclusion ปัจจุบันของ child run และต่อท้ายตารางงานที่ช้าที่สุดสำหรับ child run แต่ละรายการ หาก child workflow ถูกรันซ้ำและเปลี่ยนเป็นเขียว ให้รันซ้ำเฉพาะงานตัวตรวจยืนยันของ parent เพื่อรีเฟรชผลลัพธ์ umbrella และสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รองรับ `rerun_group` ใช้ `all` สำหรับ release candidate, `ci` สำหรับงานลูก CI เต็มรูปแบบปกติเท่านั้น, `plugin-prerelease` สำหรับงานลูกก่อนเผยแพร่ของ Plugin เท่านั้น, `release-checks` สำหรับงานลูก release ทุกงาน หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` หรือ `npm-telegram` บน umbrella วิธีนี้ทำให้การรันซ้ำของกล่อง release ที่ล้มเหลวถูกจำกัดขอบเขตหลังแก้ไขแบบเจาะจง

`OpenClaw Release Checks` ใช้ workflow ref ที่เชื่อถือได้เพื่อ resolve ref ที่เลือกหนึ่งครั้งให้เป็น tarball `release-package-under-test` จากนั้นส่ง artifact นั้นให้ทั้ง workflow Docker เส้นทาง release แบบ live/E2E และ shard การยอมรับแพ็กเกจ วิธีนี้ทำให้ bytes ของแพ็กเกจคงที่ในทุกกล่อง release และหลีกเลี่ยงการ pack candidate เดิมซ้ำในหลายงานลูก

การรัน `Full Release Validation` ซ้ำสำหรับ `ref=main` และ `rerun_group=all`
จะแทนที่ umbrella รุ่นเก่า parent monitor จะยกเลิก workflow ลูกใด ๆ ที่
dispatch ไปแล้วเมื่อ parent ถูกยกเลิก ดังนั้นการตรวจสอบ main ที่ใหม่กว่าจะไม่ต้องรออยู่หลังการรัน release-check สองชั่วโมงที่ค้างเก่า การตรวจสอบ branch/tag ของ release
และกลุ่ม rerun แบบเจาะจงจะคง `cancel-in-progress: false`

## Shard แบบ Live และ E2E

งานลูก live/E2E ของ release ยังคงครอบคลุม `pnpm test:live` แบบ native กว้าง ๆ แต่จะรันเป็น shard ที่มีชื่อผ่าน `scripts/test-live-shard.mjs` แทนงาน serial งานเดียว:

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

วิธีนี้คงความครอบคลุมไฟล์เดิมไว้ ขณะเดียวกันทำให้ความล้มเหลวของ live provider ที่ช้ารันซ้ำและวินิจฉัยได้ง่ายขึ้น ชื่อ shard รวม `native-live-extensions-o-z`, `native-live-extensions-media` และ `native-live-extensions-media-music` ยังใช้ได้สำหรับการรันซ้ำแบบครั้งเดียวด้วยตนเอง

Shard native live media รันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งสร้างโดย workflow `Live Media Runner Image` อิมเมจนั้นติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้า งาน media จึงเพียงตรวจสอบ binaries ก่อน setup เท่านั้น ให้ suite live ที่พึ่ง Docker อยู่บน runner Blacksmith ปกติ เพราะงาน container ไม่เหมาะสำหรับการเปิดใช้การทดสอบ Docker ซ้อน

Shard live model/backend ที่พึ่ง Docker ใช้อิมเมจ shared แยกต่างหาก `ghcr.io/openclaw/openclaw-live-test:<sha>` ต่อ commit ที่เลือก workflow live release จะ build และ push อิมเมจนั้นหนึ่งครั้ง จากนั้น shard Docker live model, Gateway ที่แยกตาม provider, CLI backend, ACP bind และ Codex harness จะรันด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` Shard Gateway Docker มีการกำหนด cap `timeout` ระดับสคริปต์อย่างชัดเจนให้ต่ำกว่า timeout ของงาน workflow เพื่อให้ container หรือ cleanup path ที่ค้างล้มเหลวเร็ว แทนที่จะใช้ budget release-check ทั้งหมด หาก shard เหล่านั้น rebuild Docker target ของ source เต็มรูปแบบเองโดยอิสระ แปลว่า release run ตั้งค่าผิดและจะเสียเวลา wall clock ไปกับการ build อิมเมจซ้ำ

## การยอมรับแพ็กเกจ

ใช้ `Package Acceptance` เมื่อคำถามคือ “แพ็กเกจ OpenClaw ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์ได้หรือไม่” สิ่งนี้ต่างจาก CI ปกติ: CI ปกติตรวจสอบ source tree ส่วนการยอมรับแพ็กเกจตรวจสอบ tarball เดียวผ่าน Docker E2E harness เดียวกับที่ผู้ใช้ใช้งานหลังติดตั้งหรืออัปเดต

### งาน

1. `resolve_package` checkout `workflow_ref`, resolve candidate แพ็กเกจหนึ่งรายการ, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, อัปโหลดทั้งคู่เป็น artifact `package-under-test` และพิมพ์ source, workflow ref, package ref, version, SHA-256 และ profile ใน GitHub step summary
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` workflow ที่ใช้ซ้ำจะดาวน์โหลด artifact นั้น ตรวจสอบ inventory ของ tarball เตรียมอิมเมจ Docker package-digest เมื่อจำเป็น และรัน lane Docker ที่เลือกกับแพ็กเกจนั้นแทนการ pack checkout ของ workflow เมื่อ profile เลือก `docker_lanes` แบบเจาะจงหลายรายการ workflow ที่ใช้ซ้ำจะเตรียมแพ็กเกจและอิมเมจ shared หนึ่งครั้ง จากนั้นกระจาย lane เหล่านั้นเป็นงาน Docker แบบเจาะจงที่รันขนานพร้อม artifact ที่ไม่ซ้ำกัน
3. `package_telegram` เรียก `NPM Telegram Beta E2E` แบบไม่บังคับ จะรันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้ง artifact `package-under-test` เดียวกันเมื่อ Package Acceptance resolve ไว้แล้ว การ dispatch Telegram แบบ standalone ยังติดตั้ง published npm spec ได้
4. `summary` ทำให้ workflow ล้มเหลวหากการ resolve แพ็กเกจ, Docker acceptance หรือ lane Telegram แบบไม่บังคับล้มเหลว

### แหล่งที่มาของ Candidate

- `source=npm` รับเฉพาะ `openclaw@beta`, `openclaw@latest` หรือ version release ของ OpenClaw แบบ exact เช่น `openclaw@2026.4.27-beta.2` ใช้สิ่งนี้สำหรับการยอมรับ prerelease/stable ที่เผยแพร่แล้ว
- `source=ref` pack branch, tag หรือ commit SHA เต็มของ `package_ref` ที่เชื่อถือได้ resolver จะ fetch branch/tag ของ OpenClaw, ตรวจสอบว่า commit ที่เลือกเข้าถึงได้จากประวัติ branch ของ repository หรือ release tag, ติดตั้ง deps ใน detached worktree และ pack ด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` ดาวน์โหลด `.tgz` ผ่าน HTTPS; ต้องมี `package_sha256`
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งไฟล์จาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็น optional แต่ควรระบุสำหรับ artifact ที่แชร์ภายนอก

แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือโค้ด workflow/harness ที่เชื่อถือได้ซึ่งรันการทดสอบ `package_ref` คือ source commit ที่จะถูก pack เมื่อ `source=ref` วิธีนี้ทำให้ test harness ปัจจุบันตรวจสอบ source commit เก่าที่เชื่อถือได้โดยไม่ต้องรัน logic workflow เก่า

### โปรไฟล์ Suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` บวก `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk เส้นทาง Docker release เต็มรูปแบบพร้อม OpenWebUI
- `custom` — `docker_lanes` แบบ exact; จำเป็นเมื่อ `suite_profile=custom`

Profile `package` ใช้ความครอบคลุม Plugin แบบ offline เพื่อให้การตรวจสอบ published-package ไม่ถูก gate ด้วยความพร้อมใช้งาน live ของ ClawHub lane Telegram แบบ optional จะใช้ artifact `package-under-test` ซ้ำใน `NPM Telegram Beta E2E` โดยคง path published npm spec ไว้สำหรับ dispatch แบบ standalone

สำหรับนโยบายเฉพาะด้านการทดสอบ update และ Plugin รวมถึงคำสั่ง local,
lane Docker, input ของ Package Acceptance, ค่า default ของ release และการ triage ความล้มเหลว,
ดู [การทดสอบ update และ Plugin](/th/help/testing-updates-plugins)

Release checks เรียก Package Acceptance ด้วย `source=artifact`, artifact แพ็กเกจ release ที่เตรียมไว้, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` และ `telegram_mode=mock-openai` วิธีนี้คง proof ของ package migration, update, cleanup dependency ของ Plugin เก่าที่ค้าง, การซ่อม install ของ Plugin ที่ตั้งค่าไว้, Plugin offline, plugin-update และ Telegram ไว้บน tarball แพ็กเกจที่ resolve เดียวกัน ตั้งค่า `package_acceptance_package_spec` บน Full Release Validation หรือ OpenClaw Release Checks เพื่อรัน matrix เดียวกันนั้นกับแพ็กเกจ npm ที่ shipped แล้วแทน artifact ที่ build จาก SHA Cross-OS release checks ยังคงครอบคลุม onboarding, installer และพฤติกรรม platform เฉพาะ OS; การตรวจสอบผลิตภัณฑ์ด้าน package/update ควรเริ่มจาก Package Acceptance lane Docker `published-upgrade-survivor` ตรวจสอบ baseline แพ็กเกจที่เผยแพร่แล้วหนึ่งรายการต่อการรัน ใน Package Acceptance tarball `package-under-test` ที่ resolve แล้วจะเป็น candidate เสมอ และ `published_upgrade_survivor_baseline` จะเลือก fallback published baseline โดย default เป็น `openclaw@latest`; คำสั่ง rerun ของ lane ที่ล้มเหลวจะรักษา baseline นั้นไว้ ตั้งค่า `published_upgrade_survivor_baselines=all-since-2026.4.23` เพื่อขยาย Full Release CI ให้ครอบคลุม release npm stable ทุกตัวตั้งแต่ `2026.4.23` ถึง `latest`; `release-history` ยังคงพร้อมใช้งานสำหรับการสุ่มตัวอย่างที่กว้างกว่าด้วยตนเองโดยใช้ anchor ก่อนวันที่แบบเก่า ตั้งค่า `published_upgrade_survivor_scenarios=reported-issues` เพื่อขยาย baseline เดียวกันให้ครอบคลุม fixture รูปแบบ issue สำหรับ config Feishu, ไฟล์ bootstrap/persona ที่เก็บรักษาไว้, การติดตั้ง OpenClaw Plugin ที่ตั้งค่าไว้, path log แบบ tilde และ root dependency ของ legacy Plugin ที่ค้าง Workflow `Update Migration` แยกต่างหากใช้ lane Docker `update-migration` พร้อม `all-since-2026.4.23` และ `plugin-deps-cleanup` เมื่อคำถามคือการ cleanup update ที่เผยแพร่แล้วอย่างครบถ้วน ไม่ใช่ขอบเขต Full Release CI ปกติ การรัน aggregate แบบ local สามารถส่ง spec แพ็กเกจ exact ด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, คง lane เดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` เช่น `openclaw@2026.4.15` หรือตั้งค่า `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` สำหรับ scenario matrix ได้ lane ที่เผยแพร่แล้วตั้งค่า baseline ด้วย recipe คำสั่ง `openclaw config set` ที่ baked ไว้ บันทึกขั้นตอน recipe ใน `summary.json` และ probe `/healthz`, `/readyz` รวมถึงสถานะ RPC หลัง Gateway start lane fresh ของ Windows packaged และ installer ยังตรวจสอบด้วยว่าแพ็กเกจที่ติดตั้งแล้วสามารถ import browser-control override จาก raw absolute Windows path ได้ smoke agent-turn แบบ OpenAI cross-OS ใช้ค่า default เป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อมีการตั้งค่าไว้ มิฉะนั้นใช้ `openai/gpt-5.4` เพื่อให้ proof ด้าน install และ Gateway อยู่บนโมเดลทดสอบ GPT-5 ขณะหลีกเลี่ยง default แบบ GPT-4.x

### หน้าต่างความเข้ากันได้แบบ Legacy

Package Acceptance มีหน้าต่างความเข้ากันได้แบบ legacy ที่จำกัดขอบเขตสำหรับแพ็กเกจที่เผยแพร่แล้ว แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้ compatibility path ได้:

- รายการ QA ส่วนตัวที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ถูกละไว้จาก tarball;
- `doctor-switch` อาจข้าม subcase การคงอยู่ของ `gateway install --wrapper` เมื่อแพ็กเกจไม่เปิดเผย flag นั้น;
- `update-channel-switch` อาจ prune `pnpm.patchedDependencies` ที่หายไปจาก fake git fixture ที่ได้จาก tarball และอาจ log ว่า `update.channel` ที่ persist ไว้หายไป;
- smoke ของ Plugin อาจอ่านตำแหน่ง install-record แบบ legacy หรือยอมรับการ persist install-record ของ marketplace ที่หายไป;
- `plugin-update` อาจอนุญาต migration ของ config metadata ขณะยังคงกำหนดให้ install record และพฤติกรรม no-reinstall ไม่เปลี่ยนแปลง

แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจ warn สำหรับไฟล์ stamp metadata build แบบ local ที่ shipped ไปแล้วได้เช่นกัน แพ็กเกจหลังจากนั้นต้องเป็นไปตาม contract สมัยใหม่ เงื่อนไขเดียวกันจะ fail แทนการ warn หรือ skip

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

เมื่อดีบักการรัน package acceptance ที่ล้มเหลว ให้เริ่มที่สรุป `resolve_package` เพื่อยืนยันแหล่งที่มาของแพ็กเกจ เวอร์ชัน และ SHA-256 จากนั้นตรวจสอบการรันลูก `docker_acceptance` และอาร์ติแฟกต์ Docker ของมัน: `.artifacts/docker-tests/**/summary.json`, `failures.json`, บันทึก lane, เวลาของ phase และคำสั่งรันซ้ำ ควรรันโปรไฟล์แพ็กเกจที่ล้มเหลวหรือ Docker lane ที่ตรงกันซ้ำ แทนที่จะรันการตรวจสอบ release ทั้งหมดซ้ำ

## ตรวจสอบการติดตั้งแบบ smoke

เวิร์กโฟลว์ `Install Smoke` ที่แยกต่างหากจะใช้สคริปต์ขอบเขตเดียวกันซ้ำผ่านงาน `preflight` ของตัวเอง โดยแยกความครอบคลุมของ smoke เป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **เส้นทางเร็ว** จะรันสำหรับ pull request ที่แตะพื้นผิว Docker/แพ็กเกจ การเปลี่ยนแปลงแพ็กเกจ/manifest ของ Plugin ที่บันเดิลมา หรือพื้นผิว core plugin/channel/gateway/Plugin SDK ที่งาน Docker smoke ครอบคลุม การเปลี่ยนแปลงเฉพาะซอร์สของ Plugin ที่บันเดิลมา การแก้ไขเฉพาะเทสต์ และการแก้ไขเฉพาะเอกสารจะไม่จอง Docker worker เส้นทางเร็วจะสร้างอิมเมจ Dockerfile รากหนึ่งครั้ง ตรวจ CLI รัน smoke ของ CLI สำหรับ agents delete shared-workspace รัน container gateway-network e2e ตรวจสอบ build arg ของ extension ที่บันเดิลมา และรันโปรไฟล์ Docker ของ bundled-plugin แบบมีขอบเขตภายใต้ timeout รวมของคำสั่ง 240 วินาที (Docker run ของแต่ละสถานการณ์ถูกจำกัดแยกกัน)
- **เส้นทางเต็ม** จะเก็บความครอบคลุมการติดตั้งแพ็กเกจ QR และ installer Docker/update ไว้สำหรับการรันตามกำหนดรายคืน การสั่งรันด้วยตนเอง การตรวจ release แบบ workflow-call และ pull request ที่แตะพื้นผิว installer/package/Docker จริง ๆ ในโหมดเต็ม install-smoke จะเตรียมหรือใช้ซ้ำอิมเมจ smoke GHCR root Dockerfile ของ target-SHA หนึ่งอิมเมจ จากนั้นรันการติดตั้งแพ็กเกจ QR, smoke ของ root Dockerfile/Gateway, smoke ของ installer/update และ Docker E2E แบบเร็วของ bundled-plugin เป็นงานแยกกัน เพื่อให้งาน installer ไม่ต้องรอหลัง smoke ของอิมเมจราก

การ push ไปยัง `main` (รวมถึง merge commit) จะไม่บังคับเส้นทางเต็ม เมื่อ logic ขอบเขตการเปลี่ยนแปลงร้องขอความครอบคลุมเต็มบน push เวิร์กโฟลว์จะคง Docker smoke แบบเร็วไว้ และปล่อย install smoke แบบเต็มให้การรันรายคืนหรือการตรวจสอบ release

smoke ของผู้ให้บริการอิมเมจสำหรับการติดตั้ง Bun global ที่ช้านั้นถูก gate แยกต่างหากด้วย `run_bun_global_install_smoke` โดยรันตามตารางรายคืนและจากเวิร์กโฟลว์ release checks และการสั่งรัน `Install Smoke` ด้วยตนเองสามารถเลือกเข้าร่วมได้ แต่ pull request และการ push ไปยัง `main` จะไม่รัน เทสต์ Docker ของ QR และ installer ยังคงใช้ Dockerfile ที่เน้นการติดตั้งของตัวเอง

## Docker E2E ภายในเครื่อง

`pnpm test:docker:all` จะ prebuild อิมเมจ live-test ที่ใช้ร่วมกันหนึ่งอิมเมจ แพ็ก OpenClaw หนึ่งครั้งเป็น npm tarball และสร้างอิมเมจ `scripts/e2e/Dockerfile` ที่ใช้ร่วมกันสองอิมเมจ:

- runner Node/Git เปล่าสำหรับ lane installer/update/plugin-dependency;
- อิมเมจฟังก์ชันที่ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lane ฟังก์ชันปกติ

คำจำกัดความของ Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs` และ runner จะรันเฉพาะแผนที่เลือกเท่านั้น scheduler เลือกอิมเมจต่อ lane ด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` จากนั้นรัน lane ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### ค่าที่ปรับได้

| ตัวแปร                                | ค่าเริ่มต้น | วัตถุประสงค์                                                                                  |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | จำนวนสล็อต main-pool สำหรับ lane ปกติ                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | จำนวนสล็อต tail-pool ที่ไวต่อ provider                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | ขีดจำกัด lane live พร้อมกันเพื่อไม่ให้ provider throttle                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | ขีดจำกัด lane ติดตั้ง npm พร้อมกัน                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | ขีดจำกัด lane หลาย service พร้อมกัน                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | หน่วงระหว่างการเริ่ม lane เพื่อเลี่ยง create storm ของ Docker daemon; ตั้ง `0` เพื่อไม่หน่วง |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout สำรองต่อ lane (120 นาที); lane live/tail ที่เลือกใช้ขีดจำกัดที่เข้มงวดกว่า           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` พิมพ์แผน scheduler โดยไม่รัน lane                                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | รายการ lane ที่ตรงแบบคั่นด้วยจุลภาค; ข้าม cleanup smoke เพื่อให้ agent ทำซ้ำ lane ที่ล้มเหลวได้ |

lane ที่หนักกว่าขีดจำกัดที่มีผลยังสามารถเริ่มจาก pool ว่างได้ จากนั้นจะรันเพียงลำพังจนกว่าจะปล่อย capacity preflight รวมภายในเครื่องจะตรวจ Docker ลบคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่ แสดงสถานะ lane ที่ active บันทึกเวลาของ lane เพื่อจัดลำดับ longest-first และโดยค่าเริ่มต้นจะหยุดจัดตาราง lane ใหม่ใน pool หลังความล้มเหลวแรก

### เวิร์กโฟลว์ live/E2E ที่ใช้ซ้ำได้

เวิร์กโฟลว์ live/E2E ที่ใช้ซ้ำได้จะถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องการแพ็กเกจ ชนิดอิมเมจ อิมเมจ live, lane และความครอบคลุมของ credential แบบใด จากนั้น `scripts/docker-e2e.mjs` จะแปลงแผนนั้นเป็น GitHub outputs และ summaries โดยจะแพ็ก OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลดอาร์ติแฟกต์แพ็กเกจของการรันปัจจุบัน หรือดาวน์โหลดอาร์ติแฟกต์แพ็กเกจจาก `package_artifact_run_id`; ตรวจ inventory ของ tarball; สร้างและ push อิมเมจ GHCR Docker E2E แบบ bare/functional ที่ติดแท็กด้วย digest ของแพ็กเกจผ่าน Docker layer cache ของ Blacksmith เมื่อแผนต้องการ lane ที่ติดตั้งแพ็กเกจแล้ว; และใช้อินพุต `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรืออิมเมจ digest ของแพ็กเกจที่มีอยู่แทนการสร้างใหม่ การ pull อิมเมจ Docker จะ retry ด้วย timeout ต่อ attempt แบบมีขอบเขต 180 วินาที เพื่อให้สตรีม registry/cache ที่ค้าง retry ได้เร็ว แทนที่จะกินเวลาส่วนใหญ่ของ critical path ใน CI

### ชังก์ของเส้นทาง release

ความครอบคลุม Docker ของ release จะรันงานแบบแบ่งชังก์ที่เล็กลงด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละชังก์ pull เฉพาะชนิดอิมเมจที่ต้องใช้ และรันหลาย lane ผ่าน weighted scheduler เดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

ชังก์ Docker ของ release ปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` และ `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` ส่วน `plugins-runtime-core`, `plugins-runtime` และ `plugins-integrations` ยังคงเป็น alias รวมของ plugin/runtime ส่วน alias lane `install-e2e` ยังคงเป็น alias การรันซ้ำด้วยตนเองแบบรวมสำหรับ lane installer ของ provider ทั้งสอง

OpenWebUI ถูกรวมเข้าใน `plugins-runtime-services` เมื่อความครอบคลุม release-path แบบเต็มร้องขอ และคงชังก์ `openwebui` แบบ standalone ไว้เฉพาะการสั่งรันที่เป็น OpenWebUI-only เท่านั้น lane อัปเดต bundled-channel จะ retry หนึ่งครั้งสำหรับความล้มเหลวเครือข่าย npm ชั่วคราว

แต่ละชังก์อัปโหลด `.artifacts/docker-tests/` พร้อมบันทึก lane, timings, `summary.json`, `failures.json`, เวลาของ phase, scheduler plan JSON, ตาราง slow-lane และคำสั่งรันซ้ำต่อ lane อินพุต `docker_lanes` ของเวิร์กโฟลว์จะรัน lane ที่เลือกกับอิมเมจที่เตรียมไว้แทนงานชังก์ ซึ่งทำให้การดีบัก lane ที่ล้มเหลวจำกัดอยู่ที่งาน Docker เป้าหมายเดียว และเตรียม ดาวน์โหลด หรือใช้ซ้ำอาร์ติแฟกต์แพ็กเกจสำหรับการรันนั้น หาก lane ที่เลือกเป็น live Docker lane งานเป้าหมายจะสร้างอิมเมจ live-test ในเครื่องสำหรับการรันซ้ำนั้น คำสั่ง GitHub rerun ต่อ lane ที่สร้างขึ้นจะรวม `package_artifact_run_id`, `package_artifact_name` และอินพุตอิมเมจที่เตรียมไว้เมื่อมีค่าเหล่านั้น เพื่อให้ lane ที่ล้มเหลวสามารถใช้แพ็กเกจและอิมเมจตรงชุดเดิมจากการรันที่ล้มเหลวได้

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

เวิร์กโฟลว์ live/E2E ตามกำหนดจะรันชุด Docker release-path แบบเต็มทุกวัน

## Plugin Prerelease

`Plugin Prerelease` เป็นความครอบคลุม product/package ที่มีค่าใช้จ่ายสูงกว่า จึงเป็นเวิร์กโฟลว์แยกต่างหากที่ถูกสั่งรันโดย `Full Release Validation` หรือโดย operator อย่างชัดเจน pull request ปกติ การ push ไปยัง `main` และการสั่งรัน CI ด้วยตนเองแบบ standalone จะปิดชุดนี้ไว้ มันถ่วงดุลเทสต์ Plugin ที่บันเดิลมาทั่วทั้ง extension worker แปดตัว งาน shard ของ extension เหล่านั้นรันกลุ่ม config ของ plugin ได้ครั้งละสูงสุดสองกลุ่ม โดยใช้ Vitest worker หนึ่งตัวต่อกลุ่มและ Node heap ที่ใหญ่ขึ้น เพื่อให้ batch ของ Plugin ที่ import หนักไม่สร้างงาน CI เพิ่ม เส้นทาง Docker prerelease เฉพาะ release จะ batch Docker lane เป้าหมายเป็นกลุ่มเล็ก ๆ เพื่อเลี่ยงการจอง runner หลายสิบตัวสำหรับงานที่ใช้เวลาหนึ่งถึงสามนาที

## QA Lab

QA Lab มี CI lane เฉพาะอยู่นอกเวิร์กโฟลว์ smart-scoped หลัก Agentic parity ซ้อนอยู่ใต้ QA แบบกว้างและ harness ของ release ไม่ใช่เวิร์กโฟลว์ PR แบบ standalone ใช้ `Full Release Validation` พร้อม `rerun_group=qa-parity` เมื่อ parity ควรรันร่วมกับการรัน validation แบบกว้าง

- เวิร์กโฟลว์ `QA-Lab - All Lanes` รันทุกคืนบน `main` และเมื่อสั่งรันด้วยตนเอง โดยกระจาย lane mock parity, lane live Matrix และ lane live Telegram และ Discord เป็นงานขนาน งาน live ใช้ environment `qa-live-shared` และ Telegram/Discord ใช้ lease ของ Convex

Release checks จะรัน lane transport live ของ Matrix และ Telegram ด้วย mock provider แบบกำหนดซ้ำได้และโมเดลที่ผ่านเกณฑ์ mock (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อแยก contract ของ channel ออกจาก latency ของโมเดล live และการเริ่มต้น provider-plugin ปกติ live transport gateway ปิด memory search เพราะ QA parity ครอบคลุมพฤติกรรม memory แยกต่างหาก ส่วนการเชื่อมต่อ provider ถูกครอบคลุมโดยชุด live model, native provider และ Docker provider ที่แยกต่างหาก

Matrix ใช้ `--profile fast` สำหรับ gate ตามกำหนดและ release โดยเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout รองรับเท่านั้น ค่าเริ่มต้นของ CLI และอินพุตเวิร์กโฟลว์ด้วยตนเองยังคงเป็น `all`; การสั่งรันด้วยตนเอง `matrix_profile=all` จะแบ่ง coverage Matrix แบบเต็มเป็นงาน `transport`, `media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรัน lane QA Lab ที่สำคัญต่อ release ก่อนการอนุมัติ release; gate QA parity ของมันรัน candidate และ baseline packs เป็นงาน lane แบบขนาน จากนั้นดาวน์โหลดอาร์ติแฟกต์ทั้งสองลงในงานรายงานขนาดเล็กสำหรับการเปรียบเทียบ parity ขั้นสุดท้าย

สำหรับ PR ปกติ ให้ใช้หลักฐาน CI/check ตามขอบเขตแทนการถือว่า parity เป็นสถานะที่จำเป็น

## CodeQL

เวิร์กโฟลว์ `CodeQL` ตั้งใจให้เป็นตัวสแกนความปลอดภัยรอบแรกแบบแคบ ไม่ใช่การสแกนทั้ง repository แบบเต็ม รายการ guard ที่รันรายวัน แบบ manual และสำหรับ pull request ที่ไม่ใช่ draft จะสแกนโค้ด Actions workflow รวมถึงพื้นผิว JavaScript/TypeScript ที่มีความเสี่ยงสูงที่สุด ด้วยคิวรีความปลอดภัยที่มีความมั่นใจสูงซึ่งกรองเฉพาะ `security-severity` ระดับสูง/วิกฤต

guard ของ pull request ยังคงเบา: จะเริ่มเฉพาะเมื่อมีการเปลี่ยนแปลงใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` หรือ `src` และรันเมทริกซ์ความปลอดภัยแบบความมั่นใจสูงชุดเดียวกับเวิร์กโฟลว์ตามกำหนดเวลา CodeQL ของ Android และ macOS จะไม่อยู่ในค่าเริ่มต้นของ PR

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                          | พื้นผิว                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron และ baseline ของ gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการใช้งานของ core channel implementation รวมถึง runtime ของ channel plugin, gateway, Plugin SDK, secrets และ audit touchpoints              |
| `/codeql-security-high/network-ssrf-boundary`     | พื้นผิวนโยบาย SSRF ของ core SSRF, การแยกวิเคราะห์ IP, network guard, web-fetch และ Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | เซิร์ฟเวอร์ MCP, ตัวช่วย process execution, outbound delivery และ agent tool-execution gates                                           |
| `/codeql-security-high/plugin-trust-boundary`     | พื้นผิวความไว้วางใจของ Plugin install, loader, manifest, registry, package-manager install, source-loading และ package contract ของ Plugin SDK |

### ชาร์ดความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — ชาร์ดความปลอดภัยของ Android ตามกำหนดเวลา สร้างแอป Android แบบ manual สำหรับ CodeQL บน Blacksmith Linux runner ที่เล็กที่สุดซึ่ง workflow sanity ยอมรับ อัปโหลดใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — ชาร์ดความปลอดภัยของ macOS แบบรายสัปดาห์/manual สร้างแอป macOS แบบ manual สำหรับ CodeQL บน Blacksmith macOS กรองผลลัพธ์ build ของ dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดใต้ `/codeql-critical-security/macos` เก็บไว้นอกค่าเริ่มต้นรายวันเพราะ build ของ macOS ครอง runtime แม้เมื่อไม่มีปัญหา

### หมวดหมู่ Critical Quality

`CodeQL Critical Quality` คือชาร์ดที่เข้าคู่กันซึ่งไม่ใช่ด้านความปลอดภัย โดยรันเฉพาะคิวรีคุณภาพ JavaScript/TypeScript แบบ error-severity ที่ไม่ใช่ด้านความปลอดภัย บนพื้นผิวมูลค่าสูงแบบแคบบน Blacksmith Linux runner ขนาดเล็กกว่า guard ของ pull request ตั้งใจให้เล็กกว่าโปรไฟล์ตามกำหนดเวลา: PR ที่ไม่ใช่ draft จะรันเฉพาะชาร์ด `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` ที่ตรงกัน สำหรับการเปลี่ยนแปลงโค้ดการเรียกใช้คำสั่ง/model/tool ของ agent และ reply dispatch, โค้ด config schema/migration/IO, โค้ด auth/secrets/sandbox/security, core channel และ runtime ของ bundled channel plugin, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract หรือ reply runtime ของ Plugin SDK การเปลี่ยนแปลง config ของ CodeQL และ workflow ด้านคุณภาพจะรันชาร์ดคุณภาพของ PR ทั้งสิบสองรายการ

manual dispatch รับค่า:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

โปรไฟล์แบบแคบเป็น hook สำหรับการสอน/การวนปรับปรุง เพื่อรันชาร์ดคุณภาพหนึ่งรายการแบบแยกเดี่ยว

| หมวดหมู่                                                | พื้นผิว                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ดขอบเขตความปลอดภัยของ Auth, secrets, sandbox, cron และ gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Config schema, migration, normalization และสัญญา IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | สคีมา Gateway protocol และสัญญา server method                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญา implementation ของ core channel และ bundled channel plugin                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | การเรียกใช้คำสั่ง, การ dispatch ไปยัง model/provider, auto-reply dispatch และ queues และสัญญา ACP control-plane runtime                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | เซิร์ฟเวอร์ MCP และ tool bridges, ตัวช่วย process supervision และสัญญา outbound delivery                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, นามแฝง memory Plugin SDK, glue สำหรับเปิดใช้งาน memory runtime และคำสั่ง memory doctor                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | ส่วนภายในของ reply queue, session delivery queues, ตัวช่วย outbound session binding/delivery, พื้นผิว diagnostic event/log bundle และสัญญา CLI ของ session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | inbound reply dispatch ของ Plugin SDK, ตัวช่วย reply payload/chunking/runtime, ตัวเลือก channel reply, delivery queues และตัวช่วย session/thread binding             |
| `/codeql-critical-quality/provider-runtime-boundary`    | การ normalize model catalog, provider auth และ discovery, การลงทะเบียน provider runtime, provider defaults/catalogs และ registry ของ web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | การ bootstrap Control UI, local persistence, control flows ของ gateway และสัญญา runtime ของ task control-plane                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | สัญญา runtime ของ core web fetch/search, media IO, media understanding, image-generation และ media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | สัญญา Loader, registry, public-surface และ entrypoint ของ Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | ซอร์ส Plugin SDK ฝั่ง package ที่เผยแพร่แล้ว และตัวช่วยสัญญา plugin package                                                                                      |

คุณภาพแยกจากความปลอดภัยเพื่อให้สามารถกำหนดเวลา วัดผล ปิดใช้งาน หรือขยายผลการตรวจพบด้านคุณภาพได้โดยไม่บดบังสัญญาณด้านความปลอดภัย ควรเพิ่มการขยาย CodeQL สำหรับ Swift, Python และ bundled-plugin กลับมาเป็นงานติดตามผลแบบ scoped หรือ sharded หลังจากโปรไฟล์แบบแคบมี runtime และสัญญาณที่เสถียรแล้วเท่านั้น

## เวิร์กโฟลว์บำรุงรักษา

### Docs Agent

เวิร์กโฟลว์ `Docs Agent` เป็น lane บำรุงรักษา Codex แบบขับเคลื่อนด้วย event สำหรับทำให้เอกสารที่มีอยู่สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง land เข้ามา ไม่มี schedule ล้วน: การรัน CI จาก push ที่สำเร็จและไม่ใช่ bot บน `main` สามารถ trigger ได้ และ manual dispatch สามารถรันโดยตรงได้ การเรียกผ่าน workflow-run จะข้ามเมื่อ `main` ขยับไปแล้ว หรือเมื่อมีการสร้าง Docs Agent run อื่นที่ไม่ถูกข้ามในชั่วโมงที่ผ่านมา เมื่อรัน จะตรวจทานช่วง commit ตั้งแต่ source SHA ของ Docs Agent ครั้งก่อนที่ไม่ถูกข้ามจนถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงหนึ่งครั้งจึงครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมตั้งแต่การตรวจเอกสารครั้งล่าสุดได้

### Test Performance Agent

เวิร์กโฟลว์ `Test Performance Agent` เป็น lane บำรุงรักษา Codex แบบขับเคลื่อนด้วย event สำหรับ test ที่ช้า ไม่มี schedule ล้วน: การรัน CI จาก push ที่สำเร็จและไม่ใช่ bot บน `main` สามารถ trigger ได้ แต่จะข้ามถ้ามีการเรียกผ่าน workflow-run อื่นที่รันไปแล้วหรือกำลังรันอยู่ในวัน UTC นั้น Manual dispatch จะข้าม daily activity gate นั้น lane นี้สร้างรายงานประสิทธิภาพ Vitest แบบ full-suite grouped ให้ Codex ทำได้เฉพาะการแก้ไขประสิทธิภาพ test ขนาดเล็กที่ยังคง coverage ไว้ แทน refactor แบบกว้าง จากนั้นรันรายงาน full-suite อีกครั้งและปฏิเสธการเปลี่ยนแปลงที่ลดจำนวน test baseline ที่ผ่าน หาก baseline มี test ที่ล้มเหลว Codex อาจแก้ได้เฉพาะความล้มเหลวที่ชัดเจน และรายงาน full-suite หลัง agent ต้องผ่านก่อนที่จะ commit อะไรก็ตาม เมื่อ `main` เดินหน้าไปก่อนที่ bot push จะ land lane จะ rebase patch ที่ตรวจสอบแล้ว รัน `pnpm check:changed` อีกครั้ง และลอง push ซ้ำ patch เก่าที่ขัดแย้งจะถูกข้าม ใช้ GitHub-hosted Ubuntu เพื่อให้ action ของ Codex รักษา drop-sudo safety posture เดียวกับ docs agent ได้

### Duplicate PRs After Merge

เวิร์กโฟลว์ `Duplicate PRs After Merge` เป็นเวิร์กโฟลว์ manual สำหรับ maintainer เพื่อทำความสะอาด duplicate หลัง land โดยค่าเริ่มต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุไว้อย่างชัดเจนเมื่อ `apply=true` ก่อนแก้ไข GitHub จะตรวจสอบว่า PR ที่ land แล้วถูก merge แล้ว และ duplicate แต่ละรายการมี issue ที่อ้างอิงร่วมกันหรือมี hunks ที่เปลี่ยนแปลงทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## local check gates และ changed routing

ตรรกะ local changed-lane อยู่ใน `scripts/changed-lanes.mjs` และถูกเรียกใช้โดย `scripts/check-changed.mjs` check gate ในเครื่องนั้นเข้มงวดกับขอบเขตสถาปัตยกรรมมากกว่าขอบเขตแพลตฟอร์ม CI แบบกว้าง:

- การเปลี่ยนแปลง core production จะรัน typecheck ของ core prod และ core test รวมถึง core lint/guards;
- การเปลี่ยนแปลงเฉพาะ core test จะรันเฉพาะ typecheck ของ core test รวมถึง core lint;
- การเปลี่ยนแปลง extension production จะรัน typecheck ของ extension prod และ extension test รวมถึง extension lint;
- การเปลี่ยนแปลงเฉพาะ extension test จะรัน typecheck ของ extension test รวมถึง extension lint;
- การเปลี่ยนแปลง Plugin SDK สาธารณะหรือ plugin-contract จะขยายไปยัง extension typecheck เพราะ extensions พึ่งพาสัญญา core เหล่านั้น (การกวาด Vitest extension ยังคงเป็นงาน test ที่ explicit);
- การ bump เวอร์ชันเฉพาะ release metadata-only จะรันการตรวจ version/config/root-dependency แบบ targeted;
- การเปลี่ยนแปลง root/config ที่ไม่รู้จักจะ fail safe ไปยัง check lanes ทั้งหมด

local changed-test routing อยู่ใน `scripts/test-projects.test-support.mjs` และตั้งใจให้ถูกกว่า `check:changed`: การแก้ test โดยตรงจะรันตัวเอง การแก้ source จะเลือก explicit mappings ก่อน จากนั้นจึง sibling tests และ import-graph dependents config การส่งมอบ shared group-room เป็นหนึ่งใน explicit mappings: การเปลี่ยนแปลง group visible-reply config, source reply delivery mode หรือ system prompt ของ message-tool จะ route ผ่าน core reply tests รวมถึง regression ด้าน delivery ของ Discord และ Slack เพื่อให้การเปลี่ยนค่า default ร่วมล้มเหลวก่อน push PR ครั้งแรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างระดับ harness จนชุด mapped ราคาถูกไม่ใช่ proxy ที่น่าเชื่อถือ

## การตรวจสอบด้วย Testbox

เรียกใช้ Testbox จากรากของ repo และควรใช้บ็อกซ์ใหม่ที่วอร์มไว้สำหรับการพิสูจน์แบบกว้าง ก่อนใช้ gate ที่ช้ากับบ็อกซ์ที่ถูกนำมาใช้ซ้ำ หมดอายุ หรือเพิ่งรายงานการซิงก์ที่ใหญ่ผิดคาด ให้เรียกใช้ `pnpm testbox:sanity` ภายในบ็อกซ์ก่อน

การตรวจสอบ sanity จะล้มเหลวอย่างรวดเร็วเมื่อไฟล์รากที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short` แสดงการลบไฟล์ที่ติดตามแล้วอย่างน้อย 200 รายการ โดยปกติหมายความว่าสถานะการซิงก์ระยะไกลไม่ใช่สำเนา PR ที่เชื่อถือได้ ให้หยุดบ็อกซ์นั้นและวอร์มบ็อกซ์ใหม่แทนการดีบักความล้มเหลวของการทดสอบผลิตภัณฑ์ สำหรับ PR ที่ตั้งใจลบไฟล์จำนวนมาก ให้ตั้งค่า `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับการรัน sanity นั้น

`pnpm testbox:run` จะยุติการเรียกใช้ Blacksmith CLI ในเครื่องที่ค้างอยู่ในระยะซิงก์นานกว่าห้านาทีโดยไม่มีเอาต์พุตหลังซิงก์ด้วย ตั้งค่า `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` เพื่อปิดใช้งาน guard นี้ หรือใช้ค่ามิลลิวินาทีที่มากขึ้นสำหรับ diff ในเครื่องที่ใหญ่ผิดปกติ

Crabbox เป็นเส้นทาง remote-box ที่สองที่ repo เป็นเจ้าของสำหรับการพิสูจน์บน Linux เมื่อ Blacksmith ไม่พร้อมใช้งาน หรือเมื่อควรใช้ความจุคลาวด์ที่เป็นเจ้าของ วอร์มบ็อกซ์หนึ่งตัว เติมข้อมูลผ่าน workflow ของโปรเจกต์ แล้วเรียกใช้คำสั่งผ่าน Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` เป็นเจ้าของค่าเริ่มต้นของ provider, sync และการเติมข้อมูล GitHub Actions โดยจะยกเว้น `.git` ในเครื่อง เพื่อให้ checkout ของ Actions ที่เติมข้อมูลแล้วคง metadata ของ Git ระยะไกลของตัวเองไว้ แทนที่จะซิงก์ remote และ object store ในเครื่องของ maintainer และจะยกเว้น artifact runtime/build ในเครื่องที่ไม่ควรถูกถ่ายโอนโดยเด็ดขาด `.github/workflows/crabbox-hydrate.yml` เป็นเจ้าของ checkout, การตั้งค่า Node/pnpm, การ fetch `origin/main` และการส่งต่อ environment ที่ไม่ใช่ secret ซึ่งคำสั่ง `crabbox run --id <cbx_id>` ในภายหลังจะ source

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
