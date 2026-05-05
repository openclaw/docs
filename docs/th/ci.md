---
read_when:
    - คุณต้องเข้าใจว่าเหตุใดงาน CI จึงทำงานหรือไม่ทำงาน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการรันตรวจสอบความถูกต้องของรีลีสหรือการรันซ้ำ
    - คุณกำลังเปลี่ยนการส่งคำสั่งของ ClawSweeper หรือการส่งต่อกิจกรรมของ GitHub
summary: กราฟงาน CI, เกตตามขอบเขต, ชุดครอบงานเผยแพร่รุ่น, และคำสั่งเทียบเท่าภายในเครื่อง
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-05-05T01:44:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16771940889d1fa944a5bfafe1152a033d96625595a2d89ff2cedbd3022cee66
    source_path: ci.md
    workflow: 16
---

OpenClaw CI ทำงานกับทุกการ push ไปยัง `main` และทุก pull request งาน `preflight` จะจำแนก diff และปิด lane ที่มีค่าใช้จ่ายสูงเมื่อมีเพียงพื้นที่ที่ไม่เกี่ยวข้องเปลี่ยนแปลง การรัน `workflow_dispatch` แบบแมนนวลจะข้ามการกำหนดขอบเขตอัจฉริยะโดยตั้งใจ และกระจายงานเป็นกราฟเต็มสำหรับ release candidate และการตรวจสอบแบบกว้าง lane ของ Android ยังคงเป็นแบบ opt-in ผ่าน `include_android` ความครอบคลุม Plugin เฉพาะ release อยู่ใน workflow [`Plugin ก่อนเผยแพร่จริง`](#plugin-prerelease) ที่แยกต่างหาก และจะรันจาก [`การตรวจสอบ Release แบบเต็ม`](#full-release-validation) หรือการ dispatch แบบแมนนวลโดยชัดเจนเท่านั้น

## ภาพรวม Pipeline

| งาน                              | วัตถุประสงค์                                                                                                   | เวลาที่รัน                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | ตรวจจับการเปลี่ยนแปลงเฉพาะเอกสาร ขอบเขตที่เปลี่ยนแปลง extension ที่เปลี่ยนแปลง และสร้าง manifest ของ CI                   | เสมอในการ push และ PR ที่ไม่ใช่ draft |
| `security-scm-fast`              | ตรวจจับ private key และตรวจสอบ workflow ผ่าน `zizmor`                                                     | เสมอในการ push และ PR ที่ไม่ใช่ draft |
| `security-dependency-audit`      | ตรวจสอบ production lockfile แบบไม่ใช้ dependency เทียบกับ npm advisories                                          | เสมอในการ push และ PR ที่ไม่ใช่ draft |
| `security-fast`                  | Aggregate ที่จำเป็นสำหรับงานความปลอดภัยแบบเร็ว                                                             | เสมอในการ push และ PR ที่ไม่ใช่ draft |
| `check-dependencies`             | การผ่าน dependency-only ของ production Knip รวมถึง guard ของ unused-file allowlist                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-artifacts`                | สร้าง `dist/`, Control UI, ตรวจสอบ artifact ที่ build แล้ว และ artifact ปลายน้ำที่ใช้ซ้ำได้                       | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-core`               | lane ความถูกต้องบน Linux แบบเร็ว เช่น การตรวจสอบ bundled/plugin-contract/protocol                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-contracts-channels` | การตรวจสอบ channel contract แบบ shard พร้อมผลตรวจสอบ aggregate ที่เสถียร                                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-core-test`          | shard ทดสอบ Core Node โดยไม่รวม channel, bundled, contract และ extension lanes                          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check`                          | เทียบเท่า local gate หลักแบบ shard: prod types, lint, guards, test types และ strict smoke                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check-additional`               | Architecture, boundary/prompt drift แบบ shard, extension guards, package boundary และ gateway watch        | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-smoke`                    | การทดสอบ smoke ของ built-CLI และ smoke หน่วยความจำตอนเริ่มต้น                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks`                         | ตัวตรวจสอบสำหรับการทดสอบ channel ของ built-artifact                                                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-compat-node22`      | lane build และ smoke สำหรับความเข้ากันได้กับ Node 22                                                                | การ dispatch CI แบบแมนนวลสำหรับ release    |
| `check-docs`                     | ตรวจสอบการจัดรูปแบบเอกสาร lint และ broken-link                                                             | เอกสารเปลี่ยนแปลง                       |
| `skills-python`                  | Ruff + pytest สำหรับ skills ที่มี Python รองรับ                                                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python-skill      |
| `checks-windows`                 | การทดสอบ process/path เฉพาะ Windows รวมถึงการถดถอยของ runtime import specifier ร่วมกัน                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows           |
| `macos-node`                     | lane ทดสอบ TypeScript บน macOS โดยใช้ artifact ที่ build ร่วมกัน                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `macos-swift`                    | Swift lint, build และทดสอบสำหรับแอป macOS                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `android`                        | การทดสอบ unit ของ Android สำหรับทั้งสอง flavor รวมถึงการ build debug APK หนึ่งรายการ                                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android           |
| `test-performance-agent`         | การปรับแต่ง slow-test ด้วย Codex รายวันหลังมีกิจกรรมที่เชื่อถือได้                                                 | CI หลักสำเร็จหรือ dispatch แบบแมนนวล |
| `openclaw-performance`           | รายงานประสิทธิภาพ runtime ของ Kova รายวัน/ตามคำขอ พร้อม mock-provider, deep-profile และ lane live ของ GPT 5.4 | ตามกำหนดเวลาและ dispatch แบบแมนนวล      |

## ลำดับ Fail-fast

1. `preflight` ตัดสินใจว่า lane ใดจะมีอยู่ตั้งแต่แรก ตรรกะ `docs-scope` และ `changed-scope` เป็นขั้นตอนภายในงานนี้ ไม่ใช่งานแยกต่างหาก
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` ล้มเหลวได้เร็วโดยไม่ต้องรอ artifact ที่หนักกว่าและงาน matrix ของแพลตฟอร์ม
3. `build-artifacts` ซ้อนทับกับ lane Linux แบบเร็ว เพื่อให้ผู้ใช้ปลายน้ำเริ่มได้ทันทีที่ build ร่วมพร้อมใช้งาน
4. lane ของแพลตฟอร์มและ runtime ที่หนักกว่าจะกระจายออกหลังจากนั้น: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่เป็น `cancelled` เมื่อมี push ใหม่ลงใน PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่านั่นเป็นสัญญาณรบกวนของ CI เว้นแต่การรันล่าสุดสำหรับ ref เดียวกันจะล้มเหลวด้วย การตรวจสอบ shard แบบ aggregate ใช้ `!cancelled() && always()` เพื่อให้ยังรายงานความล้มเหลวของ shard ตามปกติ แต่ไม่เข้าคิวหลังจาก workflow ทั้งหมดถูกแทนที่ไปแล้ว คีย์ concurrency อัตโนมัติของ CI มีการกำหนดเวอร์ชัน (`CI-v7-*`) เพื่อให้ zombie ฝั่ง GitHub ในกลุ่มคิวเก่าไม่สามารถบล็อกการรัน main ใหม่ได้อย่างไม่มีกำหนด การรัน full-suite แบบแมนนวลใช้ `CI-manual-v1-*` และไม่ยกเลิกการรันที่กำลังดำเนินอยู่

## ขอบเขตและการกำหนดเส้นทาง

ตรรกะขอบเขตอยู่ใน `scripts/ci-changed-scope.mjs` และครอบคลุมด้วย unit test ใน `src/scripts/ci-changed-scope.test.ts` การ dispatch แบบแมนนวลจะข้ามการตรวจจับ changed-scope และทำให้ manifest ของ preflight ทำงานเหมือนทุกพื้นที่ที่มีขอบเขตเปลี่ยนแปลง

- **การแก้ไข workflow ของ CI** ตรวจสอบกราฟ CI ของ Node รวมถึง workflow linting แต่ไม่บังคับให้ build native ของ Windows, Android หรือ macOS ด้วยตัวมันเอง lane ของแพลตฟอร์มเหล่านั้นยังคงถูกจำกัดขอบเขตไว้กับการเปลี่ยนแปลง source ของแพลตฟอร์ม
- **การแก้ไขเฉพาะการกำหนดเส้นทางของ CI, การแก้ไข fixture core-test ราคาถูกที่เลือกไว้ และการแก้ไข helper/test-routing ของ plugin contract แบบแคบ** ใช้เส้นทาง manifest แบบ Node-only ที่รวดเร็ว: `preflight`, security และ task `checks-fast-core` เพียงรายการเดียว เส้นทางนั้นจะข้าม build artifacts, ความเข้ากันได้กับ Node 22, channel contracts, shard core แบบเต็ม, shard bundled-plugin และ matrix guard เพิ่มเติม เมื่อการเปลี่ยนแปลงจำกัดอยู่ที่พื้นผิวการกำหนดเส้นทางหรือ helper ที่ task แบบเร็วทดสอบโดยตรง
- **การตรวจสอบ Windows Node** ถูกจำกัดขอบเขตไว้ที่ process/path wrappers เฉพาะ Windows, helper ของ npm/pnpm/UI runner, config ของ package manager และพื้นผิว workflow ของ CI ที่รัน lane นั้น การเปลี่ยนแปลง source, plugin, install-smoke และ test-only ที่ไม่เกี่ยวข้องยังคงอยู่บน lane Linux Node

กลุ่มการทดสอบ Node ที่ช้าที่สุดถูกแยกหรือถ่วงสมดุลเพื่อให้งานแต่ละงานเล็กโดยไม่จอง runner มากเกินไป: channel contracts รันเป็น shard ถ่วงน้ำหนักสามส่วน, lane core unit fast/support รันแยกกัน, core runtime infra ถูกแบ่งระหว่าง shard state และ process/config, auto-reply รันเป็น worker ที่สมดุล (โดยแบ่ง subtree ของ reply เป็น shard agent-runner, dispatch และ commands/state-routing) และ config ของ agentic gateway/server ถูกแบ่งข้าม lane chat/auth/model/http-plugin/runtime/startup แทนการรอ artifact ที่ build แล้ว การทดสอบ browser, QA, media และ plugin เบ็ดเตล็ดแบบกว้างใช้ config Vitest เฉพาะของตัวเองแทน catch-all ของ plugin ร่วมกัน shard แบบ include-pattern จะบันทึกรายการ timing โดยใช้ชื่อ shard ของ CI เพื่อให้ `.artifacts/vitest-shard-timings.json` แยก config ทั้งชุดออกจาก shard ที่ถูก filter ได้ `check-additional` เก็บงาน compile/canary ของ package-boundary ไว้ด้วยกัน และแยก architecture ของ runtime topology ออกจากความครอบคลุมของ gateway watch รายการ boundary guard ถูกแบ่งเป็นแถบใน matrix สี่ shard โดยแต่ละ shard รัน guard อิสระที่เลือกไว้พร้อมกันและพิมพ์ timing ต่อการตรวจสอบ รวมถึง `pnpm prompt:snapshots:check` เพื่อให้ prompt drift ของเส้นทาง happy-path ของ Codex runtime ถูกตรึงกับ PR ที่ทำให้เกิด drift นั้น Gateway watch, channel tests และ shard core support-boundary รันพร้อมกันภายใน `build-artifacts` หลังจาก `dist/` และ `dist-runtime/` ถูก build แล้ว

Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` แล้วจึง build Play debug APK flavor ของ third-party ไม่มี source set หรือ manifest แยกต่างหาก lane unit-test ของมันยังคง compile flavor พร้อม flag BuildConfig ของ SMS/call-log ขณะหลีกเลี่ยงงาน package debug APK ซ้ำในการ push ทุกครั้งที่เกี่ยวข้องกับ Android

shard `check-dependencies` รัน `pnpm deadcode:dependencies` (การผ่าน dependency-only ของ production Knip ที่ตรึงไว้กับเวอร์ชัน Knip ล่าสุด โดยปิดอายุ release ขั้นต่ำของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบผลการค้นหา production unused-file ของ Knip กับ `scripts/deadcode-unused-files.allowlist.mjs` guard ของ unused-file จะล้มเหลวเมื่อ PR เพิ่มไฟล์ที่ไม่ได้ใช้งานใหม่ซึ่งยังไม่ได้รับการ review หรือปล่อยรายการ allowlist ที่ล้าสมัยไว้ ขณะยังคงรักษาพื้นผิว dynamic plugin, generated, build, live-test และ package bridge ที่ตั้งใจไว้ ซึ่ง Knip ไม่สามารถ resolve แบบ static ได้

## การส่งต่อกิจกรรม ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` เป็น bridge ฝั่งเป้าหมายจากกิจกรรม repository ของ OpenClaw ไปยัง ClawSweeper โดยไม่ checkout หรือ execute code ของ pull request ที่ไม่น่าเชื่อถือ workflow จะสร้าง GitHub App token จาก `CLAWSWEEPER_APP_PRIVATE_KEY` แล้ว dispatch payload `repository_dispatch` แบบกะทัดรัดไปยัง `openclaw/clawsweeper`

workflow มีสี่ lane:

- `clawsweeper_item` สำหรับคำขอ review issue และ pull request ที่แน่นอน;
- `clawsweeper_comment` สำหรับคำสั่ง ClawSweeper ที่ชัดเจนใน comment ของ issue;
- `clawsweeper_commit_review` สำหรับคำขอ review ระดับ commit ในการ push ไปยัง `main`;
- `github_activity` สำหรับกิจกรรม GitHub ทั่วไปที่ agent ของ ClawSweeper อาจตรวจสอบ

lane `github_activity` ส่งต่อเฉพาะ metadata ที่ normalize แล้ว: ประเภท event, action, actor, repository, หมายเลข item, URL, title, state และ excerpt สั้นสำหรับ comment หรือ review เมื่อมี โดยตั้งใจหลีกเลี่ยงการส่งต่อ webhook body ทั้งหมด workflow ที่รับใน `openclaw/clawsweeper` คือ `.github/workflows/github-activity.yml` ซึ่งโพสต์ event ที่ normalize แล้วไปยัง hook ของ OpenClaw Gateway สำหรับ agent ของ ClawSweeper

กิจกรรมทั่วไปเป็นการสังเกตการณ์ ไม่ใช่การส่งมอบโดยปริยาย agent ของ ClawSweeper ได้รับเป้าหมาย Discord ใน prompt และควรโพสต์ไปที่ `#clawsweeper` เฉพาะเมื่อ event นั้นน่าประหลาดใจ ดำเนินการได้ มีความเสี่ยง หรือมีประโยชน์เชิงปฏิบัติการ การเปิด การแก้ไข ความเคลื่อนไหวของ bot สัญญาณรบกวน webhook ซ้ำ และ traffic review ปกติควรได้ผลเป็น `NO_REPLY`

ให้ถือว่า title, comment, body, review text, branch name และ commit message ของ GitHub เป็นข้อมูลที่ไม่น่าเชื่อถือตลอดเส้นทางนี้ สิ่งเหล่านี้เป็น input สำหรับการสรุปและ triage ไม่ใช่คำสั่งสำหรับ workflow หรือ runtime ของ agent

## การ dispatch แบบแมนนวล

การ dispatch CI ด้วยตนเองจะรันกราฟงานเดียวกับ CI ปกติ แต่บังคับเปิด lane ที่มีขอบเขตแบบไม่ใช่ Android ทั้งหมด: ชาร์ด Linux Node, ชาร์ด bundled-plugin, สัญญา channel, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, การตรวจเอกสาร, Python skills, Windows, macOS และ Control UI i18n การ dispatch CI แบบสแตนด์อโลนด้วยตนเองจะรันเฉพาะ Android เมื่อใช้ `include_android=true`; umbrella สำหรับ release แบบเต็มจะเปิด Android โดยส่ง `include_android=true` การตรวจแบบสแตติกก่อน release ของ Plugin, ชาร์ด `agentic-plugins` เฉพาะ release, การ sweep ชุด extension แบบเต็ม และ lane Docker ก่อน release ของ Plugin จะไม่รวมอยู่ใน CI ชุด Docker ก่อน release จะรันเฉพาะเมื่อ `Full Release Validation` dispatch เวิร์กโฟลว์ `Plugin Prerelease` แยกต่างหากพร้อมเปิด gate การตรวจสอบ release

การรันด้วยตนเองใช้กลุ่ม concurrency ที่ไม่ซ้ำกัน เพื่อไม่ให้ชุดทดสอบเต็มของ release-candidate ถูกยกเลิกโดยการรัน push หรือ PR อื่นบน ref เดียวกัน อินพุต `target_ref` ที่เป็นตัวเลือกช่วยให้ผู้เรียกที่เชื่อถือได้รันกราฟนั้นกับ branch, tag หรือ commit SHA แบบเต็ม โดยใช้ไฟล์เวิร์กโฟลว์จาก dispatch ref ที่เลือกไว้

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## รันเนอร์

| รันเนอร์                           | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, งานความปลอดภัยแบบเร็วและ aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจ protocol/contract/bundled แบบเร็ว, การตรวจสัญญา channel แบบ sharded, ชาร์ด `check` ยกเว้น lint, ชาร์ดและ aggregate ของ `check-additional`, ตัวตรวจ aggregate ของการทดสอบ Node, การตรวจเอกสาร, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight ยังใช้ Ubuntu ที่โฮสต์โดย GitHub เพื่อให้เมทริกซ์ Blacksmith เข้าคิวได้เร็วขึ้น |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, ชาร์ด extension ที่น้ำหนักน้อยกว่า, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` และ `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, ชาร์ดการทดสอบ Linux Node, ชาร์ดการทดสอบ bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (ไวต่อ CPU มากพอที่ 8 vCPU มีต้นทุนมากกว่าประโยชน์ที่ประหยัดได้); build Docker ของ install-smoke (เวลาคิวของ 32-vCPU มีต้นทุนมากกว่าประโยชน์ที่ประหยัดได้)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; fork จะ fallback เป็น `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; fork จะ fallback เป็น `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`OpenClaw Performance` คือเวิร์กโฟลว์ประสิทธิภาพของผลิตภัณฑ์/รันไทม์ โดยรันทุกวันบน `main` และสามารถ dispatch ด้วยตนเองได้:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

โดยปกติการ dispatch ด้วยตนเองจะ benchmark workflow ref ตั้งค่า `target_ref` เพื่อ benchmark release tag หรือ branch อื่นด้วย implementation ของเวิร์กโฟลว์ปัจจุบัน พาธรายงานที่เผยแพร่และตัวชี้ latest จะผูกตาม ref ที่ทดสอบ และแต่ละ `index.md` จะบันทึก ref/SHA ที่ทดสอบ, workflow ref/SHA, Kova ref, profile, โหมด auth ของ lane, model, จำนวน repeat และตัวกรอง scenario

เวิร์กโฟลว์ติดตั้ง OCM จาก release ที่ pin ไว้และ Kova จาก `openclaw/Kova` ที่อินพุต `kova_ref` ซึ่ง pin ไว้ จากนั้นรันสาม lane:

- `mock-provider`: scenario วินิจฉัยของ Kova กับรันไทม์แบบ local-build ที่ใช้ auth ปลอมซึ่งเข้ากันได้กับ OpenAI และกำหนดผลได้
- `mock-deep-profile`: การ profile CPU/heap/trace สำหรับจุดร้อนของ startup, gateway และ agent-turn
- `live-gpt54`: agent turn จริงของ OpenAI `openai/gpt-5.4` ซึ่งจะข้ามเมื่อไม่มี `OPENAI_API_KEY`

lane mock-provider ยังรัน source probe แบบเนทีฟของ OpenClaw หลังจาก Kova pass: เวลา boot และหน่วยความจำของ gateway ในกรณี startup แบบ default, hook และ 50-plugin; loop hello ของ mock-OpenAI `channel-chat-baseline` แบบซ้ำ; และคำสั่ง startup ของ CLI กับ gateway ที่ boot แล้ว สรุป Markdown ของ source probe อยู่ที่ `source/index.md` ใน bundle รายงาน พร้อม raw JSON อยู่ข้างกัน

ทุก lane จะอัปโหลด artifact ไปยัง GitHub เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว เวิร์กโฟลว์ยัง commit `report.json`, `report.md`, bundle, `index.md` และ artifact ของ source-probe ไปยัง `openclaw/clawgrit-reports` ภายใต้ `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` ตัวชี้ tested-ref ปัจจุบันจะเขียนเป็น `openclaw-performance/<tested-ref>/latest-<lane>.json`

## การตรวจสอบ Release แบบเต็ม

`Full Release Validation` คือเวิร์กโฟลว์ umbrella แบบ manual สำหรับ "รันทุกอย่างก่อน release" รองรับ branch, tag หรือ commit SHA แบบเต็ม, dispatch เวิร์กโฟลว์ `CI` แบบ manual ด้วย target นั้น, dispatch `Plugin Prerelease` สำหรับ proof เฉพาะ release ของ plugin/package/static/Docker และ dispatch `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, การตรวจ package ข้าม OS, QA Lab parity, Matrix และ lane Telegram การรัน stable/default จะเก็บความครอบคลุม live/E2E แบบละเอียดและ Docker release-path ไว้หลัง `run_release_soak=true`; `release_profile=full` จะบังคับเปิดความครอบคลุมของ soak นั้น เพื่อให้การตรวจ advisory แบบกว้างยังคงกว้างอยู่ เมื่อใช้ `rerun_group=all` และ `release_profile=full` จะรัน `NPM Telegram Beta E2E` กับ artifact `release-package-under-test` จาก release checks ด้วย หลังเผยแพร่แล้ว ให้ส่ง `npm_telegram_package_spec` เพื่อรัน lane package ของ Telegram เดิมซ้ำกับ package npm ที่เผยแพร่แล้ว

ดู [การตรวจสอบ release แบบเต็ม](/th/reference/full-release-validation) สำหรับ
stage matrix, ชื่องานเวิร์กโฟลว์ที่แน่นอน, ความแตกต่างของ profile, artifact และ
handle สำหรับ rerun แบบเฉพาะจุด

`OpenClaw Release Publish` คือเวิร์กโฟลว์ release แบบ manual ที่เปลี่ยนแปลงสถานะ dispatch จาก `release/YYYY.M.D` หรือ `main` หลังจากมี release tag แล้วและหลังจาก OpenClaw npm preflight สำเร็จแล้ว โดยจะตรวจสอบ `pnpm plugins:sync:check`, dispatch `Plugin NPM Release` สำหรับ package plugin ทั้งหมดที่เผยแพร่ได้, dispatch `Plugin ClawHub Release` สำหรับ release SHA เดียวกัน และจากนั้นเท่านั้นจึง dispatch `OpenClaw NPM Release` ด้วย `preflight_run_id` ที่บันทึกไว้

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

สำหรับ proof ของ commit ที่ pin ไว้บน branch ที่เคลื่อนเร็ว ให้ใช้ helper แทน
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

workflow dispatch refs ของ GitHub ต้องเป็น branch หรือ tag ไม่ใช่ raw commit SHA
helper จะ push branch ชั่วคราว `release-ci/<sha>-...` ที่ target SHA,
dispatch `Full Release Validation` จาก pinned ref นั้น, ตรวจสอบว่า `headSha` ของ child
workflow ทุกตัวตรงกับ target และลบ branch ชั่วคราวเมื่อการรันเสร็จสิ้น umbrella verifier จะล้มเหลวด้วยหากมี child workflow ใดรันที่
SHA อื่น

`release_profile` ควบคุมขอบเขต live/provider ที่ส่งเข้าไปในการตรวจสอบ release workflow แบบ manual release มีค่าเริ่มต้นเป็น `stable`; ใช้ `full` เฉพาะเมื่อคุณตั้งใจต้องการเมทริกซ์ provider/media เชิงแนะนำที่กว้างเท่านั้น `run_release_soak` ควบคุมว่าการตรวจสอบ release แบบ stable/default จะรัน live/E2E แบบครบถ้วนและการ soak เส้นทาง Docker release หรือไม่; `full` จะบังคับเปิด soak

- `minimum` คง lane OpenAI/core ที่สำคัญต่อ release และเร็วที่สุดไว้
- `stable` เพิ่มชุด provider/backend แบบ stable
- `full` รันเมทริกซ์ provider/media เชิงแนะนำที่กว้าง

umbrella จะบันทึก child run id ที่ dispatch แล้ว และงานสุดท้าย `Verify full validation` จะตรวจสอบข้อสรุปของ child run ปัจจุบันซ้ำ และเพิ่มตารางงานที่ช้าที่สุดสำหรับแต่ละ child run หาก workflow ลูกถูกรันซ้ำแล้วกลายเป็นสีเขียว ให้รันซ้ำเฉพาะงาน verifier ของ parent เพื่อรีเฟรชผลลัพธ์ umbrella และสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รับ `rerun_group` ใช้ `all` สำหรับ release candidate, `ci` สำหรับเฉพาะ child CI เต็มตามปกติ, `plugin-prerelease` สำหรับเฉพาะ child Plugin prerelease, `release-checks` สำหรับทุก release child หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` หรือ `npm-telegram` บน umbrella วิธีนี้ทำให้การรันซ้ำของ release box ที่ล้มเหลวยังคงมีขอบเขตจำกัดหลังจากแก้ไขแบบเจาะจง สำหรับ lane cross-OS ที่ล้มเหลวหนึ่งรายการ ให้รวม `rerun_group=cross-os` กับ `cross_os_suite_filter` เช่น `windows/packaged-upgrade`; คำสั่ง cross-OS ที่ใช้เวลานานจะปล่อยบรรทัด Heartbeat และสรุป packaged-upgrade จะรวมเวลาของแต่ละ phase lane QA release-check เป็นเชิงแนะนำ ดังนั้นความล้มเหลวเฉพาะ QA จะแจ้งเตือนแต่ไม่บล็อก verifier ของ release-check

`OpenClaw Release Checks` ใช้ trusted workflow ref เพื่อ resolve ref ที่เลือกหนึ่งครั้งเป็น tarball `release-package-under-test` จากนั้นส่ง artifact นั้นไปยังการตรวจสอบ cross-OS และ Package Acceptance รวมถึง workflow Docker เส้นทาง live/E2E release-path เมื่อรันความครอบคลุม soak วิธีนี้ทำให้ byte ของ package สอดคล้องกันระหว่าง release box และหลีกเลี่ยงการ pack candidate เดิมซ้ำในหลาย child job

การรัน `Full Release Validation` ซ้ำสำหรับ `ref=main` และ `rerun_group=all`
จะ supersede umbrella เก่า parent monitor จะยกเลิก child workflow ใดก็ตามที่
มันได้ dispatch แล้วเมื่อ parent ถูกยกเลิก ดังนั้นการตรวจสอบ main ใหม่กว่า
จะไม่ต้องรออยู่หลัง release-check run เก่าสองชั่วโมง การตรวจสอบ release branch/tag
และกลุ่ม rerun แบบเจาะจงจะคง `cancel-in-progress: false`

## Live และ E2E shard

child live/E2E ของ release ยังคงมีความครอบคลุม native `pnpm test:live` ที่กว้าง แต่รันเป็น shard ที่ตั้งชื่อผ่าน `scripts/test-live-shard.mjs` แทนที่จะเป็นงาน serial งานเดียว:

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
- shard media audio/video ที่แยกออกมา และ shard music ที่กรองตาม provider

วิธีนี้คงความครอบคลุมของไฟล์เหมือนเดิม ขณะทำให้ความล้มเหลวของ live provider ที่ช้ารันซ้ำและวินิจฉัยได้ง่ายขึ้น ชื่อ shard แบบ aggregate `native-live-extensions-o-z`, `native-live-extensions-media` และ `native-live-extensions-media-music` ยังคงใช้ได้สำหรับการรันซ้ำแบบ manual one-shot

shard native live media รันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งสร้างโดย workflow `Live Media Runner Image` image นั้นติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้า; งาน media จะตรวจสอบเฉพาะ binary ก่อน setup คงชุด live ที่ backed by Docker ไว้บน Blacksmith runner ปกติ — container job ไม่เหมาะสำหรับการเปิด nested Docker tests

shard live model/backend ที่ backed by Docker ใช้ image แชร์แยกต่างหาก `ghcr.io/openclaw/openclaw-live-test:<sha>` ต่อ commit ที่เลือก workflow live release จะ build และ push image นั้นหนึ่งครั้ง จากนั้น shard Docker live model, gateway ที่แบ่งตาม provider, CLI backend, ACP bind และ Codex harness จะรันด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` shard Gateway Docker มี `timeout` cap ระดับ script อย่างชัดเจนต่ำกว่า timeout ของ workflow job เพื่อให้ container หรือเส้นทาง cleanup ที่ติดค้างล้มเหลวเร็ว แทนที่จะใช้ budget release-check ทั้งหมด หาก shard เหล่านั้น rebuild target Docker source เต็มแบบอิสระ แสดงว่า release run กำหนดค่าผิดและจะเสีย wall clock ไปกับการ build image ซ้ำ

## Package Acceptance

ใช้ `Package Acceptance` เมื่อคำถามคือ "package OpenClaw ที่ติดตั้งได้นี้ทำงานเป็น product ได้หรือไม่?" มันต่างจาก CI ปกติ: CI ปกติตรวจสอบ source tree ขณะที่ package acceptance ตรวจสอบ tarball เดียวผ่าน Docker E2E harness เดียวกับที่ผู้ใช้ใช้งานหลังติดตั้งหรืออัปเดต

### งาน

1. `resolve_package` checkout `workflow_ref`, resolve package candidate หนึ่งรายการ, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, อัปโหลดทั้งคู่เป็น artifact `package-under-test` และพิมพ์ source, workflow ref, package ref, version, SHA-256 และ profile ใน GitHub step summary
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` workflow reusable จะดาวน์โหลด artifact นั้น, ตรวจสอบ inventory ของ tarball, เตรียม image Docker แบบ package-digest เมื่อจำเป็น และรัน Docker lane ที่เลือกกับ package นั้นแทนการ pack workflow checkout เมื่อ profile เลือก `docker_lanes` แบบ targeted หลายรายการ workflow reusable จะเตรียม package และ image แชร์หนึ่งครั้ง จากนั้น fan out lane เหล่านั้นเป็นงาน Docker targeted แบบขนานพร้อม artifact ที่ไม่ซ้ำกัน
3. `package_telegram` เรียก `NPM Telegram Beta E2E` แบบไม่บังคับ มันรันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้ง artifact `package-under-test` เดียวกันเมื่อ Package Acceptance resolve ไว้แล้ว; การ dispatch Telegram แบบ standalone ยังสามารถติดตั้ง npm spec ที่ published แล้วได้
4. `summary` ทำให้ workflow ล้มเหลวหาก package resolution, Docker acceptance หรือ lane Telegram แบบ optional ล้มเหลว

### แหล่งที่มาของ candidate

- `source=npm` รับเฉพาะ `openclaw@beta`, `openclaw@latest` หรือ OpenClaw release version แบบ exact เช่น `openclaw@2026.4.27-beta.2` ใช้สิ่งนี้สำหรับ prerelease/stable acceptance ที่ published แล้ว
- `source=ref` pack branch, tag หรือ full commit SHA ของ `package_ref` ที่เชื่อถือได้ resolver จะ fetch branch/tag ของ OpenClaw, ตรวจสอบว่า commit ที่เลือก reachable จาก repository branch history หรือ release tag, ติดตั้ง deps ใน detached worktree และ pack ด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` ดาวน์โหลด HTTPS `.tgz`; ต้องระบุ `package_sha256`
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งรายการจาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็น optional แต่ควรระบุสำหรับ artifact ที่แชร์ภายนอก

แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือ workflow/harness code ที่เชื่อถือได้ซึ่งรันการทดสอบ `package_ref` คือ source commit ที่ถูก pack เมื่อ `source=ref` สิ่งนี้ทำให้ test harness ปัจจุบันตรวจสอบ source commit เก่าที่เชื่อถือได้โดยไม่ต้องรัน workflow logic เก่า

### Suite profiles

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` บวก `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk Docker release-path เต็มพร้อม OpenWebUI
- `custom` — `docker_lanes` แบบ exact; จำเป็นเมื่อ `suite_profile=custom`

profile `package` ใช้ความครอบคลุม Plugin แบบ offline เพื่อให้การตรวจสอบ package ที่ published แล้วไม่ถูก gate ด้วยความพร้อมใช้งาน live ของ ClawHub lane Telegram แบบ optional ใช้ artifact `package-under-test` ซ้ำใน `NPM Telegram Beta E2E` โดยคงเส้นทาง npm spec ที่ published แล้วไว้สำหรับ standalone dispatch

สำหรับนโยบายการทดสอบ update และ Plugin โดยเฉพาะ รวมถึงคำสั่ง local,
Docker lane, input ของ Package Acceptance, ค่าเริ่มต้นของ release และการ triage ความล้มเหลว,
ดู [การทดสอบ update และ Plugin](/th/help/testing-updates-plugins)

release checks เรียก Package Acceptance ด้วย `source=artifact`, artifact release package ที่เตรียมไว้, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` และ `telegram_mode=mock-openai` วิธีนี้ทำให้หลักฐาน package migration, update, cleanup dependency ของ stale-plugin, การซ่อมการติดตั้ง configured-plugin, offline Plugin, plugin-update และ Telegram อยู่บน package tarball ที่ resolve เดียวกัน ตั้งค่า `package_acceptance_package_spec` บน Full Release Validation หรือ OpenClaw Release Checks เพื่อรันเมทริกซ์เดียวกันนั้นกับ npm package ที่ shipped แล้วแทน artifact ที่สร้างจาก SHA release checks แบบ Cross-OS ยังคงครอบคลุม onboarding, installer และ platform behavior ที่จำเพาะต่อ OS; การตรวจสอบ product ด้าน package/update ควรเริ่มด้วย Package Acceptance Docker lane `published-upgrade-survivor` ตรวจสอบ baseline package ที่ published แล้วหนึ่งรายการต่อ run ในเส้นทาง release ที่บล็อก ใน Package Acceptance tarball `package-under-test` ที่ resolve แล้วจะเป็น candidate เสมอ และ `published_upgrade_survivor_baseline` เลือก fallback published baseline โดยมีค่าเริ่มต้นเป็น `openclaw@latest`; คำสั่ง rerun ของ lane ที่ล้มเหลวจะรักษา baseline นั้นไว้ Full Release Validation ที่มี `run_release_soak=true` หรือ `release_profile=full` ตั้งค่า `published_upgrade_survivor_baselines=all-since-2026.4.23` และ `published_upgrade_survivor_scenarios=reported-issues` เพื่อขยายครอบคลุมทุก stable npm release ตั้งแต่ `2026.4.23` ถึง `latest` และ fixture ที่มีรูปทรงตาม issue สำหรับ config Feishu, ไฟล์ bootstrap/persona ที่ถูก preserve, การติดตั้ง OpenClaw Plugin ที่ configured, path log แบบ tilde และ root dependency Plugin legacy ที่ stale workflow `Update Migration` แยกต่างหากใช้ Docker lane `update-migration` กับ `all-since-2026.4.23` และ `plugin-deps-cleanup` เมื่อคำถามคือการ cleanup update ที่ published แล้วแบบครบถ้วน ไม่ใช่ขอบเขต Full Release CI ปกติ การรัน aggregate local สามารถส่ง exact package spec ด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, คง lane เดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` เช่น `openclaw@2026.4.15` หรือตั้งค่า `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` สำหรับเมทริกซ์ scenario lane ที่ published แล้วกำหนดค่า baseline ด้วย recipe คำสั่ง `openclaw config set` แบบ baked, บันทึกขั้นตอน recipe ใน `summary.json` และ probe `/healthz`, `/readyz` รวมถึงสถานะ RPC หลัง Gateway start lane Windows packaged และ installer fresh ยังตรวจสอบด้วยว่า package ที่ติดตั้งแล้วสามารถ import browser-control override จาก raw absolute Windows path ได้ smoke agent-turn แบบ OpenAI cross-OS มีค่าเริ่มต้นเป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อมีการตั้งค่า มิฉะนั้นใช้ `openai/gpt-5.4` ดังนั้นหลักฐาน install และ Gateway จึงยังอยู่บน GPT-5 test model ขณะหลีกเลี่ยงค่าเริ่มต้น GPT-4.x

### หน้าต่างความเข้ากันได้แบบ Legacy

Package Acceptance มีหน้าต่าง legacy-compatibility ที่มีขอบเขตสำหรับ package ที่ published แล้ว package จนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้เส้นทาง compatibility:

- entry QA ส่วนตัวที่ทราบใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ tarball ละไว้;
- `doctor-switch` อาจข้าม subcase persistence ของ `gateway install --wrapper` เมื่อ package ไม่ expose flag นั้น;
- `update-channel-switch` อาจ prune `pnpm.patchedDependencies` ที่หายไปจาก fake git fixture ที่ derive จาก tarball และอาจ log `update.channel` ที่ persist แล้วแต่หายไป;
- smoke ของ Plugin อาจอ่านตำแหน่ง install-record แบบ legacy หรือยอมรับ marketplace install-record persistence ที่หายไป;
- `plugin-update` อาจอนุญาต config metadata migration ขณะที่ยังต้องให้ install record และ behavior แบบ no-reinstall คง unchanged

package `2026.4.26` ที่ published แล้วอาจ warn สำหรับไฟล์ stamp metadata ของ local build ที่ถูก shipped ไปแล้วด้วย package ภายหลังต้องผ่าน contract สมัยใหม่; เงื่อนไขเดียวกันจะ fail แทนที่จะ warn หรือ skip

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

เมื่อแก้ไขข้อบกพร่องของการรัน package acceptance ที่ล้มเหลว ให้เริ่มที่สรุป `resolve_package` เพื่อยืนยันแหล่งที่มาของแพ็กเกจ เวอร์ชัน และ SHA-256 จากนั้นตรวจสอบการรันลูก `docker_acceptance` และอาร์ติแฟกต์ Docker ของมัน: `.artifacts/docker-tests/**/summary.json`, `failures.json`, บันทึก lane, เวลาแต่ละเฟส และคำสั่งรันซ้ำ ควรรันโปรไฟล์แพ็กเกจที่ล้มเหลวหรือ Docker lane ที่ตรงเป๊ะซ้ำ แทนการรัน full release validation ใหม่ทั้งหมด

## Install smoke

เวิร์กโฟลว์ `Install Smoke` แยกต่างหากจะใช้สคริปต์กำหนดขอบเขตเดียวกันซ้ำผ่านงาน `preflight` ของตัวเอง โดยแบ่งความครอบคลุมของ smoke เป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **Fast path** รันสำหรับ pull request ที่แตะพื้นผิว Docker/แพ็กเกจ, การเปลี่ยนแปลงแพ็กเกจ/manifest ของ Plugin ที่บันเดิลมา หรือพื้นผิว core plugin/channel/gateway/Plugin SDK ที่งาน Docker smoke ทดสอบ การเปลี่ยนแปลง Plugin ที่บันเดิลมาเฉพาะซอร์ส, การแก้ไขเฉพาะเทสต์ และการแก้ไขเฉพาะเอกสารจะไม่จอง Docker worker fast path จะสร้างอิมเมจ root Dockerfile หนึ่งครั้ง ตรวจสอบ CLI รัน agents delete shared-workspace CLI smoke รัน container gateway-network e2e ตรวจสอบอาร์กิวเมนต์บิลด์ของ bundled extension และรันโปรไฟล์ Docker ของ bundled-plugin แบบจำกัดภายใต้ timeout รวมของคำสั่ง 240 วินาที (Docker run ของแต่ละ scenario ถูกจำกัดแยกกัน)
- **Full path** เก็บความครอบคลุม QR package install และ installer Docker/update ไว้สำหรับการรันตามกำหนดทุกคืน การสั่งรันด้วยตนเอง การตรวจ release แบบ workflow-call และ pull request ที่แตะพื้นผิว installer/package/Docker จริงๆ ในโหมด full นั้น install-smoke จะเตรียมหรือใช้ซ้ำอิมเมจ smoke ของ target-SHA GHCR root Dockerfile หนึ่งอิมเมจ จากนั้นรัน QR package install, root Dockerfile/gateway smokes, installer/update smokes และ fast bundled-plugin Docker E2E เป็นงานแยกกัน เพื่อให้งาน installer ไม่ต้องรออยู่หลัง smoke ของ root image

การ push ไปยัง `main` (รวมถึง merge commit) จะไม่บังคับ full path; เมื่อ logic changed-scope ขอความครอบคลุมเต็มในการ push เวิร์กโฟลว์จะคง fast Docker smoke ไว้ และปล่อย full install smoke ให้การตรวจทุกคืนหรือ release validation

slow Bun global install image-provider smoke ถูกกั้นแยกโดย `run_bun_global_install_smoke` มันรันตามกำหนดทุกคืนและจากเวิร์กโฟลว์ release checks และการสั่งรัน `Install Smoke` ด้วยตนเองสามารถเลือกเปิดใช้ได้ แต่ pull request และการ push ไปยัง `main` จะไม่รัน QR และเทสต์ installer Docker จะคง Dockerfile ที่เน้นการติดตั้งของตัวเองไว้

## Local Docker E2E

`pnpm test:docker:all` จะ prebuild อิมเมจ live-test ที่แชร์หนึ่งอิมเมจ, pack OpenClaw หนึ่งครั้งเป็น npm tarball และสร้างอิมเมจ `scripts/e2e/Dockerfile` ที่แชร์สองอิมเมจ:

- bare Node/Git runner สำหรับ installer/update/plugin-dependency lanes;
- อิมเมจ functional ที่ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lane ฟังก์ชันปกติ

นิยาม Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, logic planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs` และ runner จะดำเนินการเฉพาะ plan ที่เลือกเท่านั้น scheduler เลือกอิมเมจต่อ lane ด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` จากนั้นรัน lane ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### Tunables

| ตัวแปร                                | ค่าเริ่มต้น | วัตถุประสงค์                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | จำนวน slot ของ main-pool สำหรับ lane ปกติ                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | จำนวน slot ของ tail-pool ที่ไวต่อ provider                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | เพดาน live lane พร้อมกัน เพื่อไม่ให้ provider throttle                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | เพดาน lane ติดตั้ง npm พร้อมกัน                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | เพดาน multi-service lane พร้อมกัน                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | หน่วงเวลาระหว่างการเริ่ม lane เพื่อหลีกเลี่ยงพายุการสร้างของ Docker daemon; ตั้งเป็น `0` เพื่อไม่หน่วง     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout สำรองต่อ lane (120 นาที); live/tail lane ที่เลือกใช้เพดานที่แน่นกว่า           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` แสดง plan ของ scheduler โดยไม่รัน lane                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | รายการ lane ที่ตรงเป๊ะคั่นด้วยจุลภาค; ข้าม cleanup smoke เพื่อให้ agent ทำซ้ำ lane ที่ล้มเหลวหนึ่งรายการได้ |

lane ที่หนักกว่าเพดานจริงของมันยังสามารถเริ่มจาก pool ว่างได้ จากนั้นจะรันลำพังจนกว่าจะปล่อย capacity preflight รวมในเครื่องจะตรวจ Docker, ลบคอนเทนเนอร์ OpenClaw E2E ค้างเก่า, ส่งออกสถานะ active-lane, บันทึกเวลา lane ถาวรเพื่อเรียงลำดับ longest-first และโดยค่าเริ่มต้นจะหยุด schedule pooled lane ใหม่หลังความล้มเหลวแรก

### เวิร์กโฟลว์ live/E2E ที่ใช้ซ้ำได้

เวิร์กโฟลว์ live/E2E ที่ใช้ซ้ำได้จะถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องใช้แพ็กเกจ ชนิดอิมเมจ live image, lane และความครอบคลุม credential ใด `scripts/docker-e2e.mjs` จากนั้นจะแปลง plan นั้นเป็น GitHub outputs และ summaries มันจะ pack OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลดอาร์ติแฟกต์แพ็กเกจจาก current-run หรือดาวน์โหลดอาร์ติแฟกต์แพ็กเกจจาก `package_artifact_run_id`; ตรวจสอบ inventory ของ tarball; สร้างและ push อิมเมจ GHCR Docker E2E แบบ bare/functional ที่แท็กด้วย package-digest ผ่าน Docker layer cache ของ Blacksmith เมื่อ plan ต้องการ lane ที่ติดตั้งแพ็กเกจ; และใช้อินพุต `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรืออิมเมจ package-digest ที่มีอยู่ซ้ำแทนการสร้างใหม่ การ pull อิมเมจ Docker จะ retry ด้วย timeout ต่อ attempt แบบจำกัด 180 วินาที เพื่อให้ registry/cache stream ที่ค้าง retry ได้เร็ว แทนที่จะใช้เวลาส่วนใหญ่ของ critical path ใน CI

### ชุดย่อยของ release path

ความครอบคลุม Docker ของ release จะรันงานแบบแบ่ง chunk ที่เล็กลงด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละ chunk pull เฉพาะชนิดอิมเมจที่ต้องใช้และดำเนินการหลาย lane ผ่าน weighted scheduler เดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

chunk Docker ของ release ปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` และ `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` `plugins-runtime-core`, `plugins-runtime` และ `plugins-integrations` ยังคงเป็น alias รวมของ plugin/runtime alias ของ lane `install-e2e` ยังคงเป็น alias การรันซ้ำด้วยตนเองแบบรวมสำหรับ provider installer lane ทั้งสอง

OpenWebUI จะถูกรวมเข้าใน `plugins-runtime-services` เมื่อความครอบคลุม release-path เต็มร้องขอ และคง chunk `openwebui` แบบ standalone ไว้เฉพาะการสั่งรันที่เป็น OpenWebUI-only lane อัปเดต bundled-channel จะ retry หนึ่งครั้งสำหรับความล้มเหลวเครือข่าย npm ชั่วคราว

แต่ละ chunk อัปโหลด `.artifacts/docker-tests/` พร้อมบันทึก lane, timing, `summary.json`, `failures.json`, phase timing, scheduler plan JSON, ตาราง slow-lane และคำสั่งรันซ้ำต่อ lane อินพุต `docker_lanes` ของเวิร์กโฟลว์จะรัน lane ที่เลือกกับอิมเมจที่เตรียมไว้แทนงาน chunk ซึ่งทำให้การ debug lane ที่ล้มเหลวถูกจำกัดไว้ที่งาน Docker เป้าหมายหนึ่งงาน และเตรียม ดาวน์โหลด หรือใช้ซ้ำอาร์ติแฟกต์แพ็กเกจสำหรับการรันนั้น; หาก lane ที่เลือกเป็น live Docker lane งานเป้าหมายจะสร้าง live-test image ในเครื่องสำหรับการรันซ้ำนั้น คำสั่ง GitHub rerun ต่อ lane ที่สร้างขึ้นจะรวม `package_artifact_run_id`, `package_artifact_name` และอินพุตอิมเมจที่เตรียมไว้เมื่อมีค่าเหล่านั้น เพื่อให้ lane ที่ล้มเหลวสามารถใช้แพ็กเกจและอิมเมจที่ตรงเป๊ะจากการรันที่ล้มเหลวซ้ำได้

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

เวิร์กโฟลว์ live/E2E ตามกำหนดจะรันชุด Docker release-path เต็มทุกวัน

## Plugin Prerelease

`Plugin Prerelease` เป็นความครอบคลุม product/package ที่มีต้นทุนสูงกว่า จึงเป็นเวิร์กโฟลว์แยกที่ถูกสั่งรันโดย `Full Release Validation` หรือโดย operator ที่ระบุชัดเจน pull request ปกติ การ push ไปยัง `main` และการสั่งรัน CI ด้วยตนเองแบบ standalone จะปิดชุดนี้ไว้ มันกระจายเทสต์ Plugin ที่บันเดิลมาข้าม extension worker แปดตัว; งาน extension shard เหล่านั้นรันกลุ่ม config ของ Plugin ได้สูงสุดครั้งละสองกลุ่ม โดยใช้ Vitest worker หนึ่งตัวต่อกลุ่มและ Node heap ที่ใหญ่ขึ้น เพื่อให้ batch Plugin ที่ import หนักไม่สร้างงาน CI เพิ่มเติม path Docker prerelease ที่เป็น release-only จะ batch Docker lane เป้าหมายเป็นกลุ่มเล็กๆ เพื่อหลีกเลี่ยงการจอง runner หลายสิบตัวสำหรับงานหนึ่งถึงสามนาที

## QA Lab

QA Lab มี lane CI เฉพาะนอกเวิร์กโฟลว์ smart-scoped หลัก agentic parity ถูกซ้อนอยู่ภายใต้ harness QA และ release แบบกว้าง ไม่ใช่เวิร์กโฟลว์ PR แบบ standalone ใช้ `Full Release Validation` พร้อม `rerun_group=qa-parity` เมื่อ parity ควรไปพร้อมกับการรัน validation แบบกว้าง

- เวิร์กโฟลว์ `QA-Lab - All Lanes` รันทุกคืนบน `main` และเมื่อสั่งรันด้วยตนเอง; มัน fan out mock parity lane, live Matrix lane และ live Telegram กับ Discord lane เป็นงานขนาน งาน live ใช้ environment `qa-live-shared` และ Telegram/Discord ใช้ Convex leases

release checks รัน Matrix และ Telegram live transport lanes ด้วย deterministic mock provider และโมเดลที่ผ่าน mock (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อแยก contract ของ channel ออกจาก latency ของ live model และการเริ่มต้น provider-plugin ปกติ live transport gateway ปิด memory search เพราะ QA parity ครอบคลุมพฤติกรรม memory แยกต่างหาก; provider connectivity ถูกครอบคลุมโดยชุด live model, native provider และ Docker provider แยกต่างหาก

Matrix ใช้ `--profile fast` สำหรับ scheduled และ release gates และเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout รองรับ CLI default และอินพุต workflow แบบ manual ยังคงเป็น `all`; การสั่งรัน manual `matrix_profile=all` จะแบ่ง shard ความครอบคลุม Matrix เต็มเป็นงาน `transport`, `media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรัน lane QA Lab ที่สำคัญต่อ release ก่อนอนุมัติ release; QA parity gate ของมันรัน candidate และ baseline packs เป็นงาน lane ขนาน จากนั้นดาวน์โหลดอาร์ติแฟกต์ทั้งสองเข้าไปในงานรายงานขนาดเล็กสำหรับการเปรียบเทียบ parity ขั้นสุดท้าย

สำหรับ PR ปกติ ให้ยึดหลักฐาน CI/check ตามขอบเขต แทนการถือว่า parity เป็นสถานะที่ต้องมี

## CodeQL

เวิร์กโฟลว์ `CodeQL` ตั้งใจให้เป็นตัวสแกนความปลอดภัยรอบแรกที่มีขอบเขตแคบ ไม่ใช่การกวาดตรวจทั้งรีโพซิทอรี รอบการป้องกันแบบรายวัน แบบแมนนวล และสำหรับ pull request ที่ไม่ใช่ฉบับร่าง จะสแกนโค้ด Actions workflow รวมถึงพื้นผิว JavaScript/TypeScript ที่มีความเสี่ยงสูงสุดด้วย query ความปลอดภัยที่มีความเชื่อมั่นสูง ซึ่งกรองเฉพาะ `security-severity` ระดับสูง/วิกฤต

การป้องกัน pull request ยังคงเบา: เริ่มทำงานเฉพาะเมื่อมีการเปลี่ยนแปลงภายใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, หรือ `src` และรันเมทริกซ์ความปลอดภัยแบบความเชื่อมั่นสูงเดียวกับเวิร์กโฟลว์ตามกำหนดเวลา Android และ macOS CodeQL จะไม่อยู่ในค่าเริ่มต้นของ PR

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                          | พื้นผิว                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, ความลับ, sandbox, cron และ baseline ของ gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการใช้งาน core channel รวมถึง runtime ของ channel Plugin, gateway, Plugin SDK, ความลับ และจุดสัมผัส audit              |
| `/codeql-security-high/network-ssrf-boundary`     | พื้นผิว core SSRF, การแยกวิเคราะห์ IP, network guard, web-fetch และนโยบาย SSRF ของ Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, helper สำหรับการเรียกใช้ process, outbound delivery และ gate การเรียกใช้เครื่องมือของ agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | พื้นผิวความเชื่อถือของการติดตั้ง Plugin, loader, manifest, registry, การติดตั้ง package-manager, source-loading และสัญญา package ของ Plugin SDK |

### Shard ความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — shard ความปลอดภัย Android ตามกำหนดเวลา สร้างแอป Android แบบแมนนวลสำหรับ CodeQL บน Blacksmith Linux runner ที่เล็กที่สุดซึ่ง workflow sanity ยอมรับ อัปโหลดภายใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — shard ความปลอดภัย macOS รายสัปดาห์/แบบแมนนวล สร้างแอป macOS แบบแมนนวลสำหรับ CodeQL บน Blacksmith macOS กรองผลลัพธ์การสร้างของ dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดภายใต้ `/codeql-critical-security/macos` เก็บไว้นอกค่าเริ่มต้นรายวันเพราะการสร้าง macOS ครองเวลา runtime แม้เมื่อสะอาด

### หมวดหมู่คุณภาพวิกฤต

`CodeQL Critical Quality` คือ shard ที่ตรงกันสำหรับสิ่งที่ไม่ใช่ความปลอดภัย โดยรันเฉพาะ query คุณภาพ JavaScript/TypeScript ที่ไม่ใช่ความปลอดภัยและมี error-severity บนพื้นผิวสำคัญขอบเขตแคบใน Blacksmith Linux runner ขนาดเล็กกว่า การป้องกัน pull request ของมันตั้งใจให้เล็กกว่าโปรไฟล์ตามกำหนดเวลา: PR ที่ไม่ใช่ฉบับร่างจะรันเฉพาะ shard ที่ตรงกัน ได้แก่ `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` สำหรับการเปลี่ยนแปลงโค้ดการเรียกใช้คำสั่ง/model/เครื่องมือของ agent และการ dispatch reply, schema/migration/IO ของ config, auth/secrets/sandbox/security, core channel และ runtime ของ bundled channel Plugin, protocol/server-method ของ gateway, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract หรือ runtime ของ reply ใน Plugin SDK การเปลี่ยนแปลง CodeQL config และ workflow คุณภาพจะรัน shard คุณภาพของ PR ทั้งสิบสองรายการ

Manual dispatch รับค่า:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

โปรไฟล์ขอบเขตแคบเป็น hook สำหรับการสอน/การทำซ้ำ เพื่อรัน shard คุณภาพหนึ่งรายการแบบแยกเดี่ยว

| หมวดหมู่                                                | พื้นผิว                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, ความลับ, sandbox, cron และโค้ดขอบเขตความปลอดภัยของ gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | สัญญา config schema, migration, normalization และ IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Protocol schemas ของ Gateway และสัญญา server method                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญาการใช้งาน core channel และ bundled channel Plugin                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | การเรียกใช้คำสั่ง, การ dispatch model/provider, การ dispatch และ queue ของ auto-reply และสัญญา runtime ของ ACP control-plane                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP servers และ tool bridges, helper สำหรับการกำกับดูแล process และสัญญา outbound delivery                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facades, alias ของ memory Plugin SDK, glue การเปิดใช้งาน memory runtime และคำสั่ง memory doctor                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | ภายใน reply queue, session delivery queues, helper สำหรับ outbound session binding/delivery, พื้นผิว diagnostic event/log bundle และสัญญา CLI ของ session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | การ dispatch reply ขาเข้าของ Plugin SDK, helper สำหรับ reply payload/chunking/runtime, ตัวเลือก channel reply, delivery queues และ helper สำหรับ session/thread binding             |
| `/codeql-critical-quality/provider-runtime-boundary`    | การ normalize model catalog, provider auth และ discovery, การลงทะเบียน provider runtime, provider defaults/catalogs และ registry ของ web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Control UI bootstrap, local persistence, gateway control flows และสัญญา runtime ของ task control-plane                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core web fetch/search, media IO, media understanding, image-generation และสัญญา media-generation runtime                                                    |
| `/codeql-critical-quality/plugin-boundary`              | สัญญา loader, registry, public-surface และ entrypoint ของ Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | ซอร์ส Plugin SDK ฝั่ง package ที่เผยแพร่แล้ว และ helper สำหรับสัญญา Plugin package                                                                                      |

คุณภาพถูกแยกออกจากความปลอดภัย เพื่อให้ผลการค้นพบด้านคุณภาพสามารถตั้งเวลา วัดผล ปิดใช้งาน หรือขยายได้โดยไม่บดบังสัญญาณความปลอดภัย การขยาย CodeQL สำหรับ Swift, Python และ bundled-plugin ควรถูกเพิ่มกลับมาเป็นงานต่อเนื่องแบบมีขอบเขตหรือแบบ shard เท่านั้น หลังจากโปรไฟล์ขอบเขตแคบมี runtime และสัญญาณที่เสถียรแล้ว

## เวิร์กโฟลว์การบำรุงรักษา

### Docs Agent

เวิร์กโฟลว์ `Docs Agent` เป็น lane การบำรุงรักษา Codex แบบขับเคลื่อนด้วยเหตุการณ์ สำหรับทำให้เอกสารที่มีอยู่สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง land ไม่มี schedule ล้วน: การรัน CI จาก push ที่สำเร็จและไม่ใช่ bot บน `main` สามารถ trigger ได้ และ manual dispatch สามารถรันได้โดยตรง การเรียกผ่าน workflow-run จะข้ามเมื่อ `main` ขยับต่อไปแล้ว หรือเมื่อมีการรัน Docs Agent ที่ไม่ถูกข้ามรายการอื่นถูกสร้างในชั่วโมงที่ผ่านมา เมื่อรัน จะตรวจสอบช่วง commit ตั้งแต่ source SHA ของ Docs Agent ที่ไม่ถูกข้ามครั้งก่อนจนถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงหนึ่งครั้งจึงครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมตั้งแต่รอบเอกสารครั้งล่าสุดได้

### Test Performance Agent

เวิร์กโฟลว์ `Test Performance Agent` เป็น lane การบำรุงรักษา Codex แบบขับเคลื่อนด้วยเหตุการณ์สำหรับ test ที่ช้า ไม่มี schedule ล้วน: การรัน CI จาก push ที่สำเร็จและไม่ใช่ bot บน `main` สามารถ trigger ได้ แต่จะข้ามหากมีการเรียกแบบ workflow-run อื่นรันไปแล้วหรือกำลังรันอยู่ในวัน UTC นั้น Manual dispatch จะข้าม gate กิจกรรมรายวันนั้น lane นี้สร้างรายงานประสิทธิภาพ Vitest แบบ grouped ของ full-suite ให้ Codex ทำได้เฉพาะการแก้ประสิทธิภาพ test ขนาดเล็กที่ยังรักษา coverage แทนการ refactor กว้าง จากนั้นรันรายงาน full-suite อีกครั้งและปฏิเสธการเปลี่ยนแปลงที่ลดจำนวน test baseline ที่ผ่าน หาก baseline มี test ที่ล้มเหลว Codex อาจแก้ได้เฉพาะความล้มเหลวที่ชัดเจน และรายงาน full-suite หลัง agent ต้องผ่านก่อนจึงจะ commit อะไรได้ เมื่อ `main` เดินหน้าไปก่อนที่ bot push จะ land lane นี้จะ rebase patch ที่ validate แล้ว รัน `pnpm check:changed` อีกครั้ง และลอง push ซ้ำ; patch ที่ล้าสมัยและมี conflict จะถูกข้าม ใช้ GitHub-hosted Ubuntu เพื่อให้ Codex action รักษาท่าทีด้านความปลอดภัยแบบ drop-sudo เช่นเดียวกับ docs agent ได้

### Duplicate PRs After Merge

เวิร์กโฟลว์ `Duplicate PRs After Merge` เป็นเวิร์กโฟลว์ maintainer แบบแมนนวลสำหรับทำความสะอาด duplicate หลัง land ค่าเริ่มต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุไว้อย่างชัดเจนเมื่อ `apply=true` ก่อนเปลี่ยนแปลง GitHub จะตรวจสอบว่า PR ที่ land แล้วถูก merge แล้ว และ duplicate แต่ละรายการมี issue ที่อ้างอิงร่วมกันหรือมี hunk ที่เปลี่ยนแปลงทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Gate การตรวจสอบ local และการกำหนดเส้นทางของการเปลี่ยนแปลง

ตรรกะ changed-lane แบบ local อยู่ใน `scripts/changed-lanes.mjs` และถูกเรียกใช้โดย `scripts/check-changed.mjs` gate การตรวจสอบ local นั้นเข้มงวดเรื่องขอบเขต architecture มากกว่าขอบเขตแพลตฟอร์ม CI แบบกว้าง:

- การเปลี่ยนแปลง production ของ core จะรัน typecheck ของ core prod และ core test พร้อม core lint/guards;
- การเปลี่ยนแปลงเฉพาะ test ของ core จะรันเฉพาะ typecheck ของ core test พร้อม core lint;
- การเปลี่ยนแปลง production ของ extension จะรัน typecheck ของ extension prod และ extension test พร้อม extension lint;
- การเปลี่ยนแปลงเฉพาะ test ของ extension จะรัน typecheck ของ extension test พร้อม extension lint;
- การเปลี่ยนแปลง Plugin SDK สาธารณะหรือ plugin-contract จะขยายไปยัง typecheck ของ extension เพราะ extension พึ่งพาสัญญา core เหล่านั้น (การกวาด Vitest extension ยังคงเป็นงาน test ที่ต้องระบุชัดเจน);
- การ bump version ที่เป็น release metadata-only จะรันการตรวจสอบ version/config/root-dependency แบบเจาะจง;
- การเปลี่ยนแปลง root/config ที่ไม่รู้จักจะ fail safe ไปยัง check lane ทั้งหมด

การกำหนดเส้นทาง changed-test แบบ local อยู่ใน `scripts/test-projects.test-support.mjs` และตั้งใจให้ถูกกว่า `check:changed`: การแก้ test โดยตรงจะรันตัวเอง การแก้ source จะเลือก explicit mappings ก่อน จากนั้นจึงเลือก sibling tests และ dependent ใน import-graph config การส่งมอบ shared group-room เป็นหนึ่งใน explicit mappings: การเปลี่ยนแปลงต่อ group visible-reply config, source reply delivery mode หรือ message-tool system prompt จะ route ผ่าน core reply tests พร้อม regression การส่งมอบของ Discord และ Slack เพื่อให้การเปลี่ยนค่าเริ่มต้นร่วมล้มเหลวก่อน PR push ครั้งแรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างระดับ harness จนชุด mapped ราคาถูกไม่ใช่ proxy ที่น่าเชื่อถือ

## การตรวจสอบ Testbox

เรียกใช้ Testbox จากรากของ repo และควรใช้กล่องที่อุ่นเครื่องใหม่สำหรับหลักฐานแบบกว้าง ก่อนเสียเวลาให้เกตที่ช้าบนกล่องที่ถูกนำกลับมาใช้ซ้ำ หมดอายุ หรือเพิ่งรายงานการซิงก์ที่ใหญ่ผิดคาด ให้เรียกใช้ `pnpm testbox:sanity` ภายในกล่องก่อน

การตรวจสอบความสมบูรณ์จะล้มเหลวอย่างรวดเร็วเมื่อไฟล์รากที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short` แสดงการลบไฟล์ที่ติดตามแล้วอย่างน้อย 200 รายการ โดยปกติหมายความว่าสถานะการซิงก์ระยะไกลไม่ใช่สำเนาของ PR ที่เชื่อถือได้ ให้หยุดกล่องนั้นและอุ่นเครื่องกล่องใหม่แทนการดีบักความล้มเหลวของการทดสอบผลิตภัณฑ์ สำหรับ PR ที่ตั้งใจลบไฟล์จำนวนมาก ให้ตั้งค่า `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับการตรวจสอบความสมบูรณ์ครั้งนั้น

`pnpm testbox:run` ยังยุติการเรียกใช้ Blacksmith CLI ภายในเครื่องที่ค้างอยู่ในขั้นตอนซิงก์นานกว่าห้านาทีโดยไม่มีเอาต์พุตหลังซิงก์ ตั้งค่า `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` เพื่อปิดตัวป้องกันนี้ หรือใช้ค่ามิลลิวินาทีที่มากขึ้นสำหรับ diff ภายในเครื่องที่ใหญ่ผิดปกติ

Crabbox คือตัวห่อกล่องระยะไกลที่ repo เป็นเจ้าของสำหรับหลักฐาน Linux ของผู้ดูแล ใช้เมื่อตรวจสอบกว้างเกินไปสำหรับลูปแก้ไขภายในเครื่อง เมื่อความเทียบเท่า CI สำคัญ หรือเมื่อหลักฐานต้องใช้ความลับ Docker เลนแพ็กเกจ กล่องที่ใช้ซ้ำได้ หรือบันทึกระยะไกล แบ็กเอนด์ OpenClaw ปกติคือ `blacksmith-testbox`; ความจุ AWS/Hetzner ที่เป็นเจ้าของเป็นทางสำรองสำหรับเหตุ Blacksmith ขัดข้อง ปัญหาโควตา หรือการทดสอบความจุที่เป็นเจ้าของอย่างชัดเจน

ก่อนเรียกใช้ครั้งแรก ให้ตรวจสอบตัวห่อจากรากของ repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

ตัวห่อของ repo จะปฏิเสธไบนารี Crabbox ที่ล้าสมัยซึ่งไม่ได้ประกาศ `blacksmith-testbox` ให้ส่ง provider อย่างชัดเจน แม้ว่า `.crabbox.yaml` จะมีค่าเริ่มต้นคลาวด์ที่เป็นเจ้าของก็ตาม

เกตของการเปลี่ยนแปลง:

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

อ่านสรุป JSON สุดท้าย ฟิลด์ที่มีประโยชน์คือ `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` และ `totalMs` การเรียกใช้ Crabbox แบบครั้งเดียวที่มี Blacksmith รองรับควรหยุด Testbox โดยอัตโนมัติ หากการเรียกใช้ถูกขัดจังหวะหรือการล้างข้อมูลไม่ชัดเจน ให้ตรวจสอบกล่องที่ทำงานอยู่และหยุดเฉพาะกล่องที่คุณสร้าง:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

ใช้การนำกลับมาใช้ซ้ำเฉพาะเมื่อคุณตั้งใจต้องการหลายคำสั่งบนกล่องเดียวกันที่ hydrate แล้ว:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

หาก Crabbox เป็นชั้นที่เสีย แต่ Blacksmith เองยังทำงาน ให้ใช้ Blacksmith โดยตรงเป็นทางสำรองแบบแคบ:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

ยกระดับไปใช้ความจุ Crabbox ที่เป็นเจ้าของเฉพาะเมื่อ Blacksmith ล่ม ถูกจำกัดโควตา ไม่มีสภาพแวดล้อมที่จำเป็น หรือความจุที่เป็นเจ้าของเป็นเป้าหมายอย่างชัดเจน:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` เป็นเจ้าของค่าเริ่มต้นของ provider การซิงก์ และการ hydrate ของ GitHub Actions สำหรับเลนคลาวด์ที่เป็นเจ้าของ ไฟล์นี้ยกเว้น `.git` ภายในเครื่อง เพื่อให้ checkout ของ Actions ที่ hydrate แล้วคงข้อมูลเมตา Git ระยะไกลของตัวเองไว้ แทนการซิงก์รีโมตและ object store ภายในเครื่องของผู้ดูแล และยกเว้นอาร์ติแฟกต์ runtime/build ภายในเครื่องที่ไม่ควรถูกถ่ายโอนเลย `.github/workflows/crabbox-hydrate.yml` เป็นเจ้าของ checkout การตั้งค่า Node/pnpm การ fetch `origin/main` และการส่งต่อสภาพแวดล้อมที่ไม่ใช่ความลับสำหรับคำสั่ง `crabbox run --id <cbx_id>` ของคลาวด์ที่เป็นเจ้าของ

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
