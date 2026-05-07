---
read_when:
    - คุณต้องทำความเข้าใจว่าเหตุใดงาน CI จึงทำงานหรือไม่ทำงาน
    - คุณกำลังดีบักการตรวจสอบของ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการรันหรือการรันซ้ำการตรวจสอบความถูกต้องของรีลีส
    - คุณกำลังเปลี่ยนการส่งงานของ ClawSweeper หรือการส่งต่อกิจกรรม GitHub
summary: กราฟงาน CI, เกตตามขอบเขต, งานครอบคลุมสำหรับการเผยแพร่ และคำสั่งภายในเครื่องที่เทียบเท่า
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-05-07T01:50:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 284b83d7baf451a3e6bb557832f53513d7191f0b6d7c34fc4f7483a0851676cd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI ทำงานทุกครั้งที่มีการ push ไปยัง `main` และทุก pull request งาน `preflight` จะจำแนก diff และปิด lane ที่ใช้ทรัพยากรมากเมื่อมีการเปลี่ยนแปลงเฉพาะส่วนที่ไม่เกี่ยวข้อง การรันด้วย `workflow_dispatch` แบบ manual จะข้ามการกำหนดขอบเขตอัจฉริยะโดยตั้งใจ และกระจายงานเป็นกราฟทั้งหมดสำหรับ release candidate และการตรวจสอบแบบกว้าง lane ของ Android ยังคงเป็นแบบ opt-in ผ่าน `include_android` ความครอบคลุมของ Plugin เฉพาะ release อยู่ใน workflow [`Plugin Prerelease`](#plugin-prerelease) แยกต่างหาก และจะทำงานจาก [`Full Release Validation`](#full-release-validation) หรือการ dispatch แบบ manual อย่างชัดเจนเท่านั้น

## ภาพรวม Pipeline

| งาน                              | วัตถุประสงค์                                                                                                   | ทำงานเมื่อ                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | ตรวจจับการเปลี่ยนแปลงเฉพาะ docs, scope ที่เปลี่ยน, extension ที่เปลี่ยน และสร้าง manifest ของ CI                   | ทำงานเสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-scm-fast`              | ตรวจจับ private key และ audit workflow ผ่าน `zizmor`                                                     | ทำงานเสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-dependency-audit`      | audit lockfile production แบบไม่ต้องใช้ dependency เทียบกับ npm advisories                                          | ทำงานเสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-fast`                  | aggregate ที่จำเป็นสำหรับงาน security แบบเร็ว                                                             | ทำงานเสมอบน push และ PR ที่ไม่ใช่ draft |
| `check-dependencies`             | production Knip dependency-only pass พร้อม guard สำหรับ allowlist ของไฟล์ที่ไม่ได้ใช้                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-artifacts`                | build `dist/`, Control UI, ตรวจสอบ built-artifact และ artifact downstream ที่ใช้ซ้ำได้                       | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-core`               | lane ความถูกต้องแบบเร็วบน Linux เช่น bundled/plugin-contract/protocol checks                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-contracts-channels` | ตรวจสอบ channel contract แบบ sharded พร้อมผล aggregate check ที่เสถียร                                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-core-test`          | shard ทดสอบ Core Node โดยไม่รวม lane ของ channel, bundled, contract และ extension                          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check`                          | เทียบเท่า local gate หลักแบบ sharded: prod types, lint, guards, test types และ strict smoke                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check-additional`               | architecture, boundary/prompt drift แบบ sharded, extension guards, package boundary และ gateway watch        | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-smoke`                    | smoke test สำหรับ built-CLI และ startup-memory smoke                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks`                         | verifier สำหรับ built-artifact channel tests                                                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-compat-node22`      | lane build และ smoke สำหรับความเข้ากันได้กับ Node 22                                                                | manual CI dispatch สำหรับ release    |
| `check-docs`                     | การจัดรูปแบบ docs, lint และตรวจสอบ broken-link                                                             | docs เปลี่ยน                       |
| `skills-python`                  | Ruff + pytest สำหรับ skills ที่มี Python รองรับ                                                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python-skill      |
| `checks-windows`                 | การทดสอบ process/path เฉพาะ Windows พร้อมการถดถอยของ runtime import specifier ที่ใช้ร่วมกัน                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows           |
| `macos-node`                     | lane ทดสอบ TypeScript บน macOS โดยใช้ artifact ที่ build แล้วร่วมกัน                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `macos-swift`                    | Swift lint, build และ tests สำหรับแอป macOS                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `android`                        | unit test ของ Android สำหรับทั้งสอง flavor พร้อม build debug APK หนึ่งรายการ                                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android           |
| `test-performance-agent`         | การปรับแต่ง slow-test ของ Codex รายวันหลังจากกิจกรรมที่เชื่อถือได้                                                 | CI บน main สำเร็จหรือ manual dispatch |
| `openclaw-performance`           | รายงานประสิทธิภาพ runtime ของ Kova แบบรายวัน/ตามต้องการ พร้อม lane mock-provider, deep-profile และ GPT 5.4 live | scheduled และ manual dispatch      |

## ลำดับ fail-fast

1. `preflight` ตัดสินว่า lane ใดมีอยู่ตั้งแต่แรก logic `docs-scope` และ `changed-scope` เป็น step ภายในงานนี้ ไม่ใช่งานแยกต่างหาก
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` ล้มเหลวได้เร็วโดยไม่ต้องรอ artifact และ platform matrix jobs ที่หนักกว่า
3. `build-artifacts` ทำงานซ้อนกับ lane Linux แบบเร็ว เพื่อให้ consumer downstream เริ่มทำงานได้ทันทีที่ shared build พร้อม
4. จากนั้น lane platform และ runtime ที่หนักกว่าจะกระจายออกไป: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่เป็น `cancelled` เมื่อมี push ใหม่กว่าเข้ามาบน PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่าเป็น noise ของ CI เว้นแต่ run ล่าสุดของ ref เดียวกันยังล้มเหลวด้วย aggregate shard checks ใช้ `!cancelled() && always()` เพื่อให้ยังรายงานความล้มเหลวปกติของ shard แต่ไม่ queue หลังจาก workflow ทั้งหมดถูกแทนที่ไปแล้ว concurrency key อัตโนมัติของ CI มี version (`CI-v7-*`) เพื่อให้ zombie ฝั่ง GitHub ใน queue group เก่าไม่สามารถ block run ใหม่บน main ได้ไม่มีกำหนด manual full-suite runs ใช้ `CI-manual-v1-*` และไม่ cancel run ที่กำลังทำงานอยู่

งาน `ci-timings-summary` อัปโหลด artifact `ci-timings-summary` แบบกะทัดรัดสำหรับ run CI ที่ไม่ใช่ draft แต่ละรายการ โดยบันทึก wall time, queue time, งานที่ช้าที่สุด และงานที่ล้มเหลวสำหรับ run ปัจจุบัน เพื่อให้ CI health checks ไม่ต้อง scrape payload ของ Actions ทั้งหมดซ้ำๆ

## Scope และ routing

logic ของ scope อยู่ใน `scripts/ci-changed-scope.mjs` และครอบคลุมด้วย unit tests ใน `src/scripts/ci-changed-scope.test.ts` manual dispatch จะข้ามการตรวจจับ changed-scope และทำให้ preflight manifest ทำเหมือนว่าทุก scoped area มีการเปลี่ยนแปลง

- **การแก้ไข CI workflow** ตรวจสอบกราฟ Node CI พร้อม workflow linting แต่ไม่ได้บังคับให้ Windows, Android หรือ macOS native builds ทำงานด้วยตัวเอง lane platform เหล่านั้นยังคง scope ตามการเปลี่ยนแปลงของ platform source
- **การแก้ไขเฉพาะ CI routing, การแก้ไข fixture ของ core-test ราคาถูกบางรายการ และการแก้ไข helper/test-routing ของ plugin contract แบบแคบ** ใช้เส้นทาง manifest แบบ Node-only ที่เร็ว: `preflight`, security และ task `checks-fast-core` เดียว เส้นทางนั้นข้าม build artifacts, ความเข้ากันได้กับ Node 22, channel contracts, full core shards, bundled-plugin shards และ additional guard matrices เมื่อการเปลี่ยนแปลงจำกัดอยู่ที่พื้นผิว routing หรือ helper ที่ task เร็วทดสอบโดยตรง
- **Windows Node checks** ถูก scope ให้กับ process/path wrappers เฉพาะ Windows, helper runner ของ npm/pnpm/UI, config ของ package manager และพื้นผิว CI workflow ที่ execute lane นั้น การเปลี่ยนแปลง source, Plugin, install-smoke และ test-only ที่ไม่เกี่ยวข้องยังคงอยู่บน lane Linux Node

ตระกูล Node test ที่ช้าที่สุดถูกแยกหรือ balance เพื่อให้งานแต่ละงานยังเล็กโดยไม่จอง runner มากเกินไป: channel contracts ทำงานเป็นสาม weighted shards, lane core unit fast/support ทำงานแยกกัน, core runtime infra ถูกแยกระหว่าง state, process/config, Cron และ shared shards, auto-reply ทำงานเป็น balanced workers (โดยแยก subtree ของ reply เป็น shard agent-runner, dispatch และ commands/state-routing) และ config ของ agentic gateway/server ถูกแยกข้าม lane chat/auth/model/http-plugin/runtime/startup แทนการรอ built artifacts การทดสอบ browser, QA, media และ Plugin เบ็ดเตล็ดแบบกว้างใช้ config Vitest เฉพาะของตัวเองแทน shared plugin catch-all include-pattern shards บันทึกรายการ timing โดยใช้ชื่อ CI shard เพื่อให้ `.artifacts/vitest-shard-timings.json` แยกแยะ config ทั้งหมดจาก shard ที่ถูก filter ได้ `check-additional` รวมงาน package-boundary compile/canary ไว้ด้วยกัน และแยก runtime topology architecture ออกจาก gateway watch coverage รายการ boundary guard ถูก stripe ข้าม matrix shards สี่ชุด โดยแต่ละชุดรัน guard อิสระที่เลือกไว้พร้อมกันและพิมพ์ timing ต่อ check การตรวจสอบ Codex happy-path prompt snapshot drift ที่มีค่าใช้จ่ายสูงทำงานสำหรับ manual CI และการเปลี่ยนแปลงที่กระทบ prompt เท่านั้น ดังนั้นการเปลี่ยนแปลง Node ปกติที่ไม่เกี่ยวข้องจะไม่ต้องรอหลังการสร้าง cold prompt snapshot ในขณะที่ prompt drift ยังถูก pin กับ PR ที่ทำให้เกิดมัน flag เดียวกันนี้ข้ามการสร้าง prompt snapshot Vitest ภายใน built-artifact core support-boundary shard ด้วย Gateway watch, channel tests และ core support-boundary shard ทำงานพร้อมกันภายใน `build-artifacts` หลังจาก `dist/` และ `dist-runtime/` ถูก build แล้ว

Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` แล้วจึง build Play debug APK flavor ของ third-party ไม่มี source set หรือ manifest แยกต่างหาก lane unit-test ของมันยังคง compile flavor ด้วย flag BuildConfig ของ SMS/call-log ขณะหลีกเลี่ยงงาน packaging debug APK ซ้ำในทุก push ที่เกี่ยวข้องกับ Android

shard `check-dependencies` รัน `pnpm deadcode:dependencies` (production Knip dependency-only pass ที่ pin กับ Knip version ล่าสุด พร้อมปิดใช้งาน minimum release age ของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบผล unused-file ของ production จาก Knip กับ `scripts/deadcode-unused-files.allowlist.mjs` guard ของ unused-file จะล้มเหลวเมื่อ PR เพิ่มไฟล์ที่ไม่ได้ใช้ใหม่และยังไม่ได้ review หรือเหลือรายการ allowlist ที่ stale ไว้ ขณะยังรักษาพื้นผิว intentional dynamic plugin, generated, build, live-test และ package bridge ที่ Knip ไม่สามารถ resolve แบบ static ได้

## การ forward กิจกรรม ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` คือ bridge ฝั่ง target จากกิจกรรม repository ของ OpenClaw เข้าสู่ ClawSweeper มันไม่ checkout หรือ execute โค้ด pull request ที่ไม่น่าเชื่อถือ workflow สร้าง token ของ GitHub App จาก `CLAWSWEEPER_APP_PRIVATE_KEY` แล้ว dispatch payload `repository_dispatch` แบบกะทัดรัดไปยัง `openclaw/clawsweeper`

workflow มีสี่ lane:

- `clawsweeper_item` สำหรับ request review ของ issue และ pull request ที่เจาะจง;
- `clawsweeper_comment` สำหรับคำสั่ง ClawSweeper ที่ชัดเจนใน issue comments;
- `clawsweeper_commit_review` สำหรับ request review ระดับ commit บน push ไปยัง `main`;
- `github_activity` สำหรับกิจกรรม GitHub ทั่วไปที่ agent ของ ClawSweeper อาจตรวจสอบ

lane `github_activity` forward เฉพาะ metadata ที่ normalize แล้ว: event type, action, actor, repository, item number, URL, title, state และ excerpt สั้นๆ สำหรับ comments หรือ reviews เมื่อมีอยู่ โดยตั้งใจหลีกเลี่ยงการ forward body ของ webhook ทั้งหมด workflow ฝั่งรับใน `openclaw/clawsweeper` คือ `.github/workflows/github-activity.yml` ซึ่ง post event ที่ normalize แล้วไปยัง hook ของ OpenClaw Gateway สำหรับ agent ของ ClawSweeper

กิจกรรมทั่วไปคือการสังเกตการณ์ ไม่ใช่การส่งโดยค่าเริ่มต้น agent ของ ClawSweeper ได้รับ target ของ Discord ใน prompt และควร post ไปที่ `#clawsweeper` เฉพาะเมื่อ event นั้นน่าประหลาดใจ ดำเนินการได้ มีความเสี่ยง หรือมีประโยชน์เชิงปฏิบัติการ การเปิด แก้ไข bot churn, duplicate webhook noise และ traffic review ปกติควรได้ผลลัพธ์เป็น `NO_REPLY`

ปฏิบัติต่อชื่อเรื่อง ความคิดเห็น เนื้อหา ข้อความรีวิว ชื่อสาขา และข้อความคอมมิตของ GitHub เป็นข้อมูลที่ไม่น่าเชื่อถือทั่วทั้งเส้นทางนี้ ข้อมูลเหล่านี้เป็นอินพุตสำหรับการสรุปและการคัดแยก ไม่ใช่คำสั่งสำหรับเวิร์กโฟลว์หรือรันไทม์ของเอเจนต์

## การสั่งงานด้วยตนเอง

การสั่งงาน CI ด้วยตนเองจะรันกราฟงานเดียวกับ CI ปกติ แต่บังคับเปิดเลนที่มีขอบเขตไม่ใช่ Android ทั้งหมด: ชาร์ด Linux Node, ชาร์ด Plugin ที่บันเดิลมา, สัญญาช่องทาง, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, การทดสอบ build smoke, การตรวจเอกสาร, Python Skills, Windows, macOS และ Control UI i18n การสั่งงาน CI ด้วยตนเองแบบสแตนด์อโลนจะรันเฉพาะ Android ด้วย `include_android=true`; umbrella รุ่นเต็มเปิดใช้ Android โดยส่ง `include_android=true` การตรวจแบบสแตติกก่อนเผยแพร่ Plugin, ชาร์ดเฉพาะรุ่น `agentic-plugins`, การกวาดชุดส่วนขยายเต็มรูปแบบ และเลน Docker ก่อนเผยแพร่ Plugin จะถูกตัดออกจาก CI ชุดทดสอบ Docker ก่อนเผยแพร่จะรันเฉพาะเมื่อ `Full Release Validation` สั่งงานเวิร์กโฟลว์ `Plugin Prerelease` แยกต่างหากพร้อมเปิดใช้เกตการตรวจสอบรุ่น

การรันด้วยตนเองใช้กลุ่ม concurrency ที่ไม่ซ้ำกัน เพื่อไม่ให้ชุดเต็มของ release candidate ถูกยกเลิกโดยการ push หรือการรัน PR อื่นบน ref เดียวกัน อินพุตเสริม `target_ref` ช่วยให้ผู้เรียกที่เชื่อถือได้รันกราฟนั้นกับสาขา แท็ก หรือ commit SHA แบบเต็มได้ โดยใช้ไฟล์เวิร์กโฟลว์จาก ref การสั่งงานที่เลือก

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## รันเนอร์

| รันเนอร์                         | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, งานความปลอดภัยแบบเร็วและงานรวม (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจ protocol/contract/bundled แบบเร็ว, การตรวจสัญญาช่องทางแบบแบ่งชาร์ด, ชาร์ด `check` ยกเว้น lint, งานรวม `check-additional`, ตัวตรวจสอบงานรวมทดสอบ Node, การตรวจเอกสาร, Python Skills, workflow-sanity, labeler, auto-response; preflight ของ install-smoke ยังใช้ Ubuntu ที่โฮสต์โดย GitHub เพื่อให้เมทริกซ์ Blacksmith เข้าคิวได้เร็วขึ้น |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, ชาร์ดส่วนขยายที่น้ำหนักเบากว่า, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` และ `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, ชาร์ดทดสอบ Linux Node, ชาร์ดทดสอบ Plugin ที่บันเดิลมา, ชาร์ด `check-additional`, `android`                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (ไวต่อ CPU พอที่ 8 vCPU มีต้นทุนมากกว่าที่ประหยัดได้); build Docker ของ install-smoke (เวลารอคิว 32-vCPU มีต้นทุนมากกว่าที่ประหยัดได้)                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; fork จะ fallback ไปที่ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; fork จะ fallback ไปที่ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                  |

CI ของรีโพ Canonical ยังคงให้ Blacksmith เป็นเส้นทางรันเนอร์เริ่มต้น ระหว่าง `preflight`, `scripts/ci-runner-labels.mjs` ตรวจการรัน Actions ล่าสุดที่อยู่ในคิวและกำลังทำงานสำหรับงาน Blacksmith ที่เข้าคิว หาก label ของ Blacksmith รายใดรายหนึ่งมีงานเข้าคิวอยู่แล้ว งาน downstream ที่จะใช้ label นั้นตรงๆ จะ fallback ไปยังรันเนอร์ที่โฮสต์โดย GitHub ที่ตรงกัน (`ubuntu-24.04`, `windows-2025` หรือ `macos-latest`) เฉพาะสำหรับการรันนั้น ขนาด Blacksmith อื่นในตระกูล OS เดียวกันยังคงใช้ label หลักของตน หากการ probe API ล้มเหลว จะไม่มีการใช้ fallback

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

`OpenClaw Performance` คือเวิร์กโฟลว์ประสิทธิภาพของผลิตภัณฑ์/รันไทม์ เวิร์กโฟลว์นี้รันทุกวันบน `main` และสามารถสั่งงานด้วยตนเองได้:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

โดยปกติการสั่งงานด้วยตนเองจะ benchmark workflow ref ตั้งค่า `target_ref` เพื่อ benchmark แท็กรุ่นหรือสาขาอื่นด้วยการใช้งานเวิร์กโฟลว์ปัจจุบัน เส้นทางรายงานที่เผยแพร่และ pointer ล่าสุดจะถูก key ด้วย ref ที่ทดสอบ และแต่ละ `index.md` จะบันทึก ref/SHA ที่ทดสอบ, workflow ref/SHA, Kova ref, profile, โหมด lane auth, model, จำนวน repeat และตัวกรอง scenario

เวิร์กโฟลว์ติดตั้ง OCM จากรุ่นที่ pin ไว้ และ Kova จาก `openclaw/Kova` ที่อินพุต `kova_ref` ที่ pin ไว้ จากนั้นรันสามเลน:

- `mock-provider`: scenario การวินิจฉัยของ Kova กับรันไทม์ local-build พร้อม auth ปลอมแบบ OpenAI-compatible ที่กำหนดผลซ้ำได้
- `mock-deep-profile`: การทำโปรไฟล์ CPU/heap/trace สำหรับ startup, Gateway และ hotspot ของ agent-turn
- `live-gpt54`: agent turn ของ OpenAI `openai/gpt-5.4` จริง ข้ามเมื่อไม่มี `OPENAI_API_KEY`

เลน mock-provider ยังรัน source probe แบบ OpenClaw-native หลังจาก Kova pass: เวลา boot และหน่วยความจำของ Gateway ในกรณี startup แบบ default, hook และ 50-Plugin; loop hello ของ `channel-chat-baseline` แบบ mock-OpenAI ซ้ำๆ; และคำสั่ง startup ของ CLI กับ Gateway ที่ boot แล้ว สรุป Markdown ของ source probe อยู่ที่ `source/index.md` ในบันเดิลรายงาน พร้อม JSON ดิบอยู่ข้างกัน

ทุกเลนอัปโหลด artifact ของ GitHub เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว เวิร์กโฟลว์จะคอมมิต `report.json`, `report.md`, บันเดิล, `index.md` และ artifact ของ source-probe เข้าไปใน `openclaw/clawgrit-reports` ภายใต้ `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` ด้วย pointer ของ tested-ref ปัจจุบันจะถูกเขียนเป็น `openclaw-performance/<tested-ref>/latest-<lane>.json`

## การตรวจสอบรุ่นแบบเต็ม

`Full Release Validation` คือเวิร์กโฟลว์ umbrella แบบสั่งงานด้วยตนเองสำหรับ "รันทุกอย่างก่อนออกรุ่น" เวิร์กโฟลว์นี้รับสาขา แท็ก หรือ commit SHA แบบเต็ม สั่งงานเวิร์กโฟลว์ `CI` แบบ manual ด้วย target นั้น สั่งงาน `Plugin Prerelease` สำหรับหลักฐานเฉพาะรุ่นด้าน Plugin/package/static/Docker และสั่งงาน `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, การตรวจ package ข้าม OS, QA Lab parity, Matrix และเลน Telegram การรันแบบ stable/default จะเก็บความครอบคลุม live/E2E แบบ exhaustive และ Docker release-path ไว้หลัง `run_release_soak=true`; `release_profile=full` จะบังคับเปิดความครอบคลุม soak นั้น เพื่อให้การตรวจ advisory แบบกว้างยังคงกว้างอยู่ เมื่อใช้ `rerun_group=all` และ `release_profile=full` จะรัน `NPM Telegram Beta E2E` กับ artifact `release-package-under-test` จาก release checks ด้วย หลังเผยแพร่แล้ว ให้ส่ง `npm_telegram_package_spec` เพื่อรันเลน package ของ Telegram เดิมซ้ำกับ package npm ที่เผยแพร่แล้ว

ดู [การตรวจสอบรุ่นแบบเต็ม](/th/reference/full-release-validation) สำหรับ
เมทริกซ์ stage, ชื่องานเวิร์กโฟลว์ที่แน่นอน, ความแตกต่างของ profile, artifact และ
handle สำหรับ rerun แบบเจาะจง

`OpenClaw Release Publish` คือเวิร์กโฟลว์รุ่นแบบสั่งงานด้วยตนเองที่ทำการเปลี่ยนแปลง สั่งงานจาก `release/YYYY.M.D` หรือ `main` หลังจากมีแท็กรุ่นแล้วและหลังจาก
preflight ของ OpenClaw npm สำเร็จ เวิร์กโฟลว์นี้ตรวจสอบ `pnpm plugins:sync:check`,
สั่งงาน `Plugin NPM Release` สำหรับ package Plugin ทั้งหมดที่เผยแพร่ได้, สั่งงาน
`Plugin ClawHub Release` สำหรับ SHA รุ่นเดียวกัน แล้วจึงสั่งงาน
`OpenClaw NPM Release` ด้วย `preflight_run_id` ที่บันทึกไว้

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

สำหรับหลักฐาน commit ที่ pin ไว้บนสาขาที่เปลี่ยนแปลงเร็ว ให้ใช้ตัวช่วยแทน
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

refs สำหรับ GitHub workflow dispatch ต้องเป็นสาขาหรือแท็ก ไม่ใช่ commit SHA ดิบ ตัวช่วยจะ push สาขาชั่วคราว `release-ci/<sha>-...` ที่ SHA เป้าหมาย, dispatch `Full Release Validation` จาก ref ที่ pin ไว้นั้น, ตรวจสอบว่า workflow ลูกทุกตัวมี `headSha` ตรงกับเป้าหมาย, และลบสาขาชั่วคราวเมื่อ run เสร็จ ตัวตรวจสอบ umbrella จะล้มเหลวด้วยหากมี workflow ลูกตัวใดรันที่ SHA อื่น

`release_profile` ควบคุมขอบเขต live/provider ที่ส่งเข้าไปในการตรวจ release workflow release แบบ manual มีค่าเริ่มต้นเป็น `stable`; ใช้ `full` เฉพาะเมื่อคุณตั้งใจต้องการเมทริกซ์ผู้ให้บริการ/สื่อเชิง advisory แบบกว้างเท่านั้น `run_release_soak` ควบคุมว่าการตรวจ release แบบ stable/default จะรัน live/E2E แบบละเอียดและการ soak เส้นทาง release ของ Docker หรือไม่; `full` จะบังคับเปิด soak

- `minimum` คง lane ที่เร็วที่สุดและสำคัญต่อ release ของ OpenAI/core ไว้
- `stable` เพิ่มชุดผู้ให้บริการ/backend แบบ stable
- `full` รันเมทริกซ์ผู้ให้บริการ/สื่อเชิง advisory แบบกว้าง

umbrella จะบันทึก run id ของ child ที่ dispatch แล้ว และ job สุดท้าย `Verify full validation` จะตรวจผลสรุปของ child run ปัจจุบันซ้ำ แล้วผนวกตาราง job ที่ช้าที่สุดสำหรับ child run แต่ละตัว หาก child workflow ถูกรันซ้ำแล้วผ่าน ให้รันซ้ำเฉพาะ job ตัวตรวจสอบของ parent เพื่อรีเฟรชผล umbrella และสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รับ `rerun_group` ใช้ `all` สำหรับ release candidate, `ci` สำหรับเฉพาะ child ของ full CI ปกติ, `plugin-prerelease` สำหรับเฉพาะ child ของ plugin prerelease, `release-checks` สำหรับ child ของ release ทุกตัว, หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, หรือ `npm-telegram` บน umbrella วิธีนี้ทำให้การรันซ้ำของ release box ที่ล้มเหลวถูกจำกัดขอบเขตหลังการแก้ไขแบบเฉพาะจุด สำหรับ lane cross-OS ที่ล้มเหลวเพียงหนึ่งตัว ให้ใช้ `rerun_group=cross-os` ร่วมกับ `cross_os_suite_filter` เช่น `windows/packaged-upgrade`; คำสั่ง cross-OS ที่ใช้เวลานานจะปล่อยบรรทัด heartbeat และสรุป packaged-upgrade จะมีเวลาของแต่ละ phase lane QA release-check เป็น advisory ดังนั้นความล้มเหลวเฉพาะ QA จะเตือนแต่ไม่บล็อกตัวตรวจสอบ release-check

`OpenClaw Release Checks` ใช้ workflow ref ที่เชื่อถือได้เพื่อ resolve ref ที่เลือกเพียงครั้งเดียวเป็น tarball `release-package-under-test` แล้วส่ง artifact นั้นไปยังการตรวจ cross-OS และ Package Acceptance รวมถึง workflow Docker สำหรับเส้นทาง release live/E2E เมื่อมีการรัน soak coverage วิธีนี้ทำให้ bytes ของ package สอดคล้องกันในทุก release box และหลีกเลี่ยงการ pack candidate เดิมซ้ำใน job ลูกหลายตัว

การรัน `Full Release Validation` ซ้ำสำหรับ `ref=main` และ `rerun_group=all`
จะแทนที่ umbrella ที่เก่ากว่า parent monitor จะยกเลิก workflow ลูกที่ได้ dispatch ไปแล้วเมื่อ parent ถูกยกเลิก ดังนั้นการตรวจ main ที่ใหม่กว่าจะไม่ต้องรออยู่หลัง release-check เก่าสองชั่วโมง การตรวจ release branch/tag และกลุ่ม rerun แบบเฉพาะจุดยังคงใช้ `cancel-in-progress: false`

## ชาร์ด Live และ E2E

child ของ release live/E2E ยังคง coverage `pnpm test:live` แบบ native ที่กว้างไว้ แต่จะรันเป็นชาร์ดที่ตั้งชื่อผ่าน `scripts/test-live-shard.mjs` แทน job แบบ serial ตัวเดียว:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- job `native-live-src-gateway-profiles` ที่กรองตามผู้ให้บริการ
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- ชาร์ดสื่อ audio/video ที่แยกออก และชาร์ด music ที่กรองตามผู้ให้บริการ

วิธีนี้คง coverage ไฟล์เดิมไว้ พร้อมทำให้ความล้มเหลวของ live provider ที่ช้า rerun และวินิจฉัยได้ง่ายขึ้น ชื่อชาร์ดรวม `native-live-extensions-o-z`, `native-live-extensions-media`, และ `native-live-extensions-media-music` ยังคงใช้ได้สำหรับการ rerun manual แบบครั้งเดียว

ชาร์ด native live media รันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่ง build โดย workflow `Live Media Runner Image` image นั้นติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้า; job media เพียงตรวจสอบ binary ก่อน setup เท่านั้น ให้คงชุด live ที่ใช้ Docker บน Blacksmith runner ปกติ งานแบบ container ไม่เหมาะสำหรับการเปิด nested Docker tests

ชาร์ด live model/backend ที่ใช้ Docker ใช้ image ที่ใช้ร่วมกันแยกต่างหาก `ghcr.io/openclaw/openclaw-live-test:<sha>` ต่อ commit ที่เลือก workflow live release จะ build และ push image นั้นหนึ่งครั้ง จากนั้นชาร์ด Docker live model, gateway ที่แบ่งตาม provider, CLI backend, ACP bind, และ Codex harness จะรันด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ชาร์ด Gateway Docker มีขีดจำกัด `timeout` ระดับสคริปต์อย่างชัดเจนซึ่งต่ำกว่า timeout ของ workflow job เพื่อให้ container หรือเส้นทาง cleanup ที่ค้างล้มเหลวเร็ว แทนที่จะกินงบ release-check ทั้งหมด หากชาร์ดเหล่านั้น rebuild Docker target ของ source ทั้งหมดแยกกัน release run จะถูกตั้งค่าผิดและจะเสีย wall clock ไปกับการ build image ซ้ำ

## การยอมรับแพ็กเกจ

ใช้ `Package Acceptance` เมื่อคำถามคือ "แพ็กเกจ OpenClaw ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์หรือไม่" มันต่างจาก CI ปกติ: CI ปกติตรวจ source tree ขณะที่ package acceptance ตรวจ tarball เดียวผ่าน Docker E2E harness เดียวกับที่ผู้ใช้ใช้หลังติดตั้งหรืออัปเดต

### Jobs

1. `resolve_package` checkout `workflow_ref`, resolve package candidate หนึ่งตัว, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, upload ทั้งคู่เป็น artifact `package-under-test`, และพิมพ์ source, workflow ref, package ref, version, SHA-256, และ profile ใน GitHub step summary
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` workflow ที่ใช้ซ้ำจะดาวน์โหลด artifact นั้น, ตรวจ inventory ของ tarball, เตรียม image Docker แบบ package-digest เมื่อจำเป็น, และรัน lane Docker ที่เลือกกับ package นั้นแทนการ pack workflow checkout เมื่อ profile เลือก `docker_lanes` แบบ targeted หลายตัว workflow ที่ใช้ซ้ำจะเตรียม package และ shared image หนึ่งครั้ง แล้ว fan out lane เหล่านั้นเป็น job Docker targeted แบบขนานพร้อม artifact ที่ไม่ซ้ำกัน
3. `package_telegram` เรียก `NPM Telegram Beta E2E` แบบเลือกได้ มันรันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้ง artifact `package-under-test` เดียวกันเมื่อ Package Acceptance resolve ไว้แล้ว; Telegram dispatch แบบ standalone ยังติดตั้ง npm spec ที่เผยแพร่แล้วได้
4. `summary` ทำให้ workflow ล้มเหลวหากการ resolve package, Docker acceptance, หรือ lane Telegram แบบเลือกได้ล้มเหลว

### แหล่งที่มาของ Candidate

- `source=npm` รับเฉพาะ `openclaw@beta`, `openclaw@latest`, หรือเวอร์ชัน release ของ OpenClaw แบบ exact เช่น `openclaw@2026.4.27-beta.2` ใช้ตัวนี้สำหรับการยอมรับ prerelease/stable ที่เผยแพร่แล้ว
- `source=ref` pack สาขา, แท็ก, หรือ commit SHA แบบเต็มของ `package_ref` ที่เชื่อถือได้ resolver จะ fetch สาขา/แท็กของ OpenClaw, ตรวจสอบว่า commit ที่เลือกเข้าถึงได้จากประวัติสาขาของ repository หรือ release tag, ติดตั้ง deps ใน detached worktree, และ pack ด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` ดาวน์โหลด HTTPS `.tgz`; ต้องมี `package_sha256`
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งไฟล์จาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็นตัวเลือกแต่ควรระบุสำหรับ artifact ที่แชร์ภายนอก

แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือโค้ด workflow/harness ที่เชื่อถือได้ซึ่งรันการทดสอบ `package_ref` คือ source commit ที่จะถูก pack เมื่อ `source=ref` วิธีนี้ทำให้ test harness ปัจจุบันตรวจ source commit ที่เชื่อถือได้รุ่นเก่าได้โดยไม่ต้องรัน logic workflow เก่า

### Suite profiles

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` พร้อม `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk เส้นทาง release Docker แบบเต็มพร้อม OpenWebUI
- `custom` — `docker_lanes` แบบ exact; ต้องใช้เมื่อ `suite_profile=custom`

profile `package` ใช้ coverage Plugin แบบ offline เพื่อให้การตรวจ package ที่เผยแพร่แล้วไม่ถูก gate ด้วยความพร้อมใช้งานของ ClawHub แบบ live lane Telegram แบบเลือกได้ reuse artifact `package-under-test` ใน `NPM Telegram Beta E2E` โดยคงเส้นทาง npm spec ที่เผยแพร่แล้วไว้สำหรับ dispatch แบบ standalone

สำหรับนโยบายการทดสอบ update และ Plugin โดยเฉพาะ รวมถึงคำสั่ง local,
lane Docker, input ของ Package Acceptance, ค่าเริ่มต้นของ release, และการ triage ความล้มเหลว,
ดู [การทดสอบ updates และ plugins](/th/help/testing-updates-plugins)

Release checks เรียก Package Acceptance ด้วย `source=artifact`, artifact package release ที่เตรียมไว้, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, และ `telegram_mode=mock-openai` วิธีนี้คงหลักฐาน package migration, update, cleanup dependency ของ stale plugin, การซ่อมแซมการติดตั้ง configured-plugin, Plugin แบบ offline, plugin-update, และ Telegram บน tarball package ที่ resolve เดียวกัน ตั้งค่า `package_acceptance_package_spec` บน Full Release Validation หรือ OpenClaw Release Checks เพื่อรันเมทริกซ์เดียวกันกับ npm package ที่จัดส่งแล้วแทน artifact ที่ build จาก SHA การตรวจ release แบบ cross-OS ยังคงครอบคลุม onboarding, installer, และพฤติกรรม platform เฉพาะ OS; การตรวจ product ด้าน package/update ควรเริ่มจาก Package Acceptance lane Docker `published-upgrade-survivor` ตรวจ baseline package ที่เผยแพร่แล้วหนึ่งตัวต่อ run ในเส้นทาง release ที่บล็อก ใน Package Acceptance tarball `package-under-test` ที่ resolve แล้วเป็น candidate เสมอ และ `published_upgrade_survivor_baseline` เลือก baseline ที่เผยแพร่แล้วสำหรับ fallback โดยค่าเริ่มต้นเป็น `openclaw@latest`; คำสั่ง rerun ของ lane ที่ล้มเหลวจะรักษา baseline นั้นไว้ Full Release Validation ที่ใช้ `run_release_soak=true` หรือ `release_profile=full` ตั้งค่า `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` และ `published_upgrade_survivor_scenarios=reported-issues` เพื่อขยายครอบคลุม npm stable releases ล่าสุดสี่ตัว พร้อม release ขอบเขต plugin-compatibility ที่ pin ไว้ และ fixture ตามรูปแบบ issue สำหรับการ config Feishu, ไฟล์ bootstrap/persona ที่คงอยู่, การติดตั้ง OpenClaw Plugin ที่ตั้งค่าไว้, path log แบบ tilde, และ root dependency ของ legacy plugin ที่ stale การเลือก published-upgrade survivor แบบหลาย baseline จะถูกแบ่งชาร์ดตาม baseline เป็น job Docker runner แบบ targeted แยกกัน workflow `Update Migration` แยกต่างหากใช้ lane Docker `update-migration` พร้อม `all-since-2026.4.23` และ `plugin-deps-cleanup` เมื่อคำถามคือการ cleanup update ที่เผยแพร่แล้วแบบละเอียด ไม่ใช่ขอบเขต Full Release CI ปกติ การรันรวมแบบ local สามารถส่ง package spec แบบ exact ด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, คง lane เดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` เช่น `openclaw@2026.4.15`, หรือตั้งค่า `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` สำหรับเมทริกซ์ scenario lane ที่เผยแพร่แล้วจะ config baseline ด้วยสูตรคำสั่ง `openclaw config set` ที่ bake ไว้, บันทึกขั้นตอนสูตรใน `summary.json`, และ probe `/healthz`, `/readyz`, รวมถึงสถานะ RPC หลัง Gateway เริ่มทำงาน lane Windows packaged และ installer fresh ยังตรวจสอบด้วยว่า package ที่ติดตั้งแล้วสามารถ import browser-control override จาก path Windows absolute ดิบได้ smoke agent-turn แบบ OpenAI cross-OS มีค่าเริ่มต้นเป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อมีการตั้งค่า มิฉะนั้นใช้ `openai/gpt-5.4` เพื่อให้หลักฐาน install และ Gateway ยังคงใช้โมเดลทดสอบ GPT-5 พร้อมหลีกเลี่ยงค่าเริ่มต้น GPT-4.x

### หน้าต่างความเข้ากันได้ของ Legacy

Package Acceptance มีกรอบเวลาความเข้ากันได้กับระบบเดิมแบบจำกัดสำหรับแพ็กเกจที่เผยแพร่ไปแล้ว แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้เส้นทางความเข้ากันได้ได้:

- รายการ QA ส่วนตัวที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ถูกละเว้นจาก tarball;
- `doctor-switch` อาจข้ามกรณีย่อยการคงค่า `gateway install --wrapper` เมื่อแพ็กเกจไม่ได้เปิดเผยแฟล็กนั้น;
- `update-channel-switch` อาจตัด `pnpm.patchedDependencies` ที่หายไปออกจาก fixture git ปลอมที่ได้จาก tarball และอาจบันทึก `update.channel` ที่คงค่าไว้แต่หายไป;
- smoke ของ Plugin อาจอ่านตำแหน่ง install-record แบบเดิม หรือยอมรับการคงค่า install-record ของ marketplace ที่หายไป;
- `plugin-update` อาจอนุญาตให้ย้ายข้อมูลเมทาดาทาของ config ขณะที่ยังคงกำหนดให้ install record และพฤติกรรมไม่ติดตั้งซ้ำต้องไม่เปลี่ยนแปลง

แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ stamp เมทาดาทาของ build ภายในเครื่องที่ถูกจัดส่งไปแล้วได้ด้วย แพ็กเกจที่ใหม่กว่านั้นต้องเป็นไปตามสัญญาสมัยใหม่ เงื่อนไขเดียวกันจะล้มเหลวแทนที่จะเตือนหรือข้าม

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

เมื่อดีบักการรัน package acceptance ที่ล้มเหลว ให้เริ่มที่สรุป `resolve_package` เพื่อยืนยันแหล่งที่มาของแพ็กเกจ เวอร์ชัน และ SHA-256 จากนั้นตรวจสอบการรันลูก `docker_acceptance` และอาร์ติแฟกต์ Docker ของมัน: `.artifacts/docker-tests/**/summary.json`, `failures.json`, บันทึกของเลน, เวลาของแต่ละเฟส และคำสั่ง rerun ควรเลือก rerun โปรไฟล์แพ็กเกจที่ล้มเหลวหรือเลน Docker ที่ตรงกัน แทนการ rerun การตรวจสอบ release แบบเต็ม

## Install smoke

เวิร์กโฟลว์ `Install Smoke` แยกต่างหากนำสคริปต์ขอบเขตเดียวกันมาใช้ซ้ำผ่านงาน `preflight` ของตนเอง โดยแบ่งความครอบคลุมของ smoke เป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **เส้นทางเร็ว** ทำงานสำหรับ pull request ที่แตะพื้นผิว Docker/แพ็กเกจ, การเปลี่ยนแปลงแพ็กเกจ/manifest ของ Plugin ที่มาพร้อมชุด, หรือพื้นผิว Plugin/channel/Gateway/Plugin SDK ของแกนหลักที่งาน Docker smoke ตรวจสอบ การเปลี่ยนแปลง Plugin ที่มาพร้อมชุดเฉพาะซอร์ส การแก้ไขเฉพาะทดสอบ และการแก้ไขเฉพาะเอกสารจะไม่จอง Docker worker เส้นทางเร็วจะ build อิมเมจ Dockerfile รากหนึ่งครั้ง ตรวจสอบ CLI, รัน smoke ของ CLI agents delete shared-workspace, รัน gateway-network e2e ในคอนเทนเนอร์, ตรวจสอบ build arg ของ extension ที่มาพร้อมชุด และรันโปรไฟล์ Docker ของ bundled-plugin แบบจำกัดภายใต้ timeout คำสั่งรวม 240 วินาที (Docker run ของแต่ละสถานการณ์ถูกจำกัดแยกกัน)
- **เส้นทางเต็ม** เก็บความครอบคลุมการติดตั้งแพ็กเกจ QR และ Docker/update ของตัวติดตั้งไว้สำหรับการรันตามกำหนดรายคืน, การ dispatch ด้วยตนเอง, workflow-call release checks และ pull request ที่แตะพื้นผิวตัวติดตั้ง/แพ็กเกจ/Docker จริง ๆ ในโหมดเต็ม install-smoke จะเตรียมหรือนำอิมเมจ smoke ของ GHCR root Dockerfile สำหรับ target-SHA หนึ่งรายการมาใช้ซ้ำ จากนั้นรันการติดตั้งแพ็กเกจ QR, smoke ของ root Dockerfile/Gateway, smoke ของตัวติดตั้ง/update และ Docker E2E ของ bundled-plugin เส้นทางเร็วเป็นงานแยกกัน เพื่อให้งานตัวติดตั้งไม่ต้องรอหลัง smoke ของอิมเมจราก

การ push ไปยัง `main` (รวมถึง merge commit) ไม่บังคับใช้เส้นทางเต็ม เมื่อ logic ขอบเขตการเปลี่ยนแปลงจะร้องขอความครอบคลุมเต็มในการ push เวิร์กโฟลว์จะคง Docker smoke เส้นทางเร็วไว้ และปล่อย install smoke แบบเต็มให้เป็นของการตรวจสอบรายคืนหรือ release validation

smoke ของ image-provider สำหรับการติดตั้ง Bun แบบ global ที่ช้าจะถูกควบคุมแยกด้วย `run_bun_global_install_smoke` โดยจะทำงานตามกำหนดรายคืนและจากเวิร์กโฟลว์ release checks และการ dispatch `Install Smoke` ด้วยตนเองสามารถเลือกใช้ได้ แต่ pull request และการ push ไปยัง `main` จะไม่ทำงานนี้ การทดสอบ Docker ของ QR และตัวติดตั้งยังคงใช้ Dockerfile ที่เน้นการติดตั้งของตนเอง

## Docker E2E ภายในเครื่อง

`pnpm test:docker:all` จะ prebuild อิมเมจ live-test ที่ใช้ร่วมกันหนึ่งรายการ, pack OpenClaw หนึ่งครั้งเป็น npm tarball และ build อิมเมจ `scripts/e2e/Dockerfile` ที่ใช้ร่วมกันสองรายการ:

- runner Node/Git เปล่าสำหรับเลน installer/update/plugin-dependency;
- อิมเมจแบบใช้งานได้ที่ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับเลนฟังก์ชันปกติ

นิยามเลน Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs` และ runner จะรันเฉพาะแผนที่เลือกเท่านั้น scheduler เลือกอิมเมจต่อเลนด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` จากนั้นรันเลนด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### ค่าที่ปรับได้

| ตัวแปร                                 | ค่าเริ่มต้น | วัตถุประสงค์                                                                                   |
| -------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | จำนวนสล็อต main-pool สำหรับเลนปกติ                                                            |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | จำนวนสล็อต tail-pool ที่อ่อนไหวต่อ provider                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | เพดานเลน live พร้อมกัน เพื่อไม่ให้ provider throttle                                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10          | เพดานเลน npm install พร้อมกัน                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | เพดานเลน multi-service พร้อมกัน                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | หน่วงเวลาระหว่างการเริ่มเลนเพื่อหลีกเลี่ยง Docker daemon create storm; ตั้ง `0` เพื่อไม่หน่วง |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | timeout สำรองต่อเลน (120 นาที); เลน live/tail ที่เลือกใช้เพดานที่เข้มกว่า                    |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset       | `1` พิมพ์แผน scheduler โดยไม่รันเลน                                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset       | รายการเลนตรงตัวคั่นด้วยจุลภาค; ข้าม cleanup smoke เพื่อให้ agent ทำซ้ำเลนที่ล้มเหลวได้หนึ่งเลน |

เลนที่หนักกว่าเพดานที่มีผลยังสามารถเริ่มจาก pool ว่างได้ จากนั้นจะรันเดี่ยวจนกว่าจะปล่อย capacity aggregate preflight ภายในเครื่องจะตรวจสอบ Docker, ลบคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่, แสดงสถานะเลนที่ active, คงค่า timing ของเลนสำหรับการเรียง longest-first และโดยค่าเริ่มต้นจะหยุดกำหนดตารางเลน pooled ใหม่หลังจากความล้มเหลวครั้งแรก

### เวิร์กโฟลว์ live/E2E ที่นำกลับมาใช้ซ้ำได้

เวิร์กโฟลว์ live/E2E ที่นำกลับมาใช้ซ้ำได้จะถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องใช้แพ็กเกจ ชนิดอิมเมจ อิมเมจ live เลน และความครอบคลุม credential ใดบ้าง จากนั้น `scripts/docker-e2e.mjs` จะแปลงแผนนั้นเป็น GitHub outputs และสรุป โดยจะ pack OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลดอาร์ติแฟกต์แพ็กเกจของการรันปัจจุบัน, หรือดาวน์โหลดอาร์ติแฟกต์แพ็กเกจจาก `package_artifact_run_id`; ตรวจสอบ inventory ของ tarball; build และ push อิมเมจ GHCR Docker E2E แบบ bare/functional ที่ติดแท็กด้วย digest ของแพ็กเกจผ่านแคชเลเยอร์ Docker ของ Blacksmith เมื่อแผนต้องใช้เลนที่ติดตั้งแพ็กเกจ; และนำ input `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรืออิมเมจ package-digest ที่มีอยู่มาใช้ซ้ำแทนการ build ใหม่ การ pull อิมเมจ Docker จะ retry ด้วย timeout ต่อครั้งแบบจำกัด 180 วินาที เพื่อให้ stream ของ registry/cache ที่ค้าง retry ได้รวดเร็ว แทนที่จะกินเวลาส่วนใหญ่ของ critical path ของ CI

### ชังก์เส้นทาง release

ความครอบคลุม Docker ของ release รันเป็นงาน chunked ที่เล็กลงด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละชังก์ pull เฉพาะชนิดอิมเมจที่ต้องใช้และรันหลายเลนผ่าน weighted scheduler เดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

ชังก์ Docker ของ release ปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` และ `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` ส่วน `plugins-runtime-core`, `plugins-runtime` และ `plugins-integrations` ยังคงเป็น alias รวมของ Plugin/runtime alias เลน `install-e2e` ยังคงเป็น alias สำหรับ rerun ด้วยตนเองแบบรวมของเลนตัวติดตั้ง provider ทั้งสอง

OpenWebUI จะถูกรวมเข้าใน `plugins-runtime-services` เมื่อความครอบคลุม release-path แบบเต็มร้องขอ และจะคงชังก์ `openwebui` แบบสแตนด์อโลนไว้เฉพาะสำหรับ dispatch ที่เป็น OpenWebUI-only เท่านั้น เลนอัปเดต bundled-channel จะ retry หนึ่งครั้งสำหรับความล้มเหลวเครือข่าย npm ชั่วคราว

แต่ละชังก์อัปโหลด `.artifacts/docker-tests/` พร้อมบันทึกเลน, timings, `summary.json`, `failures.json`, phase timings, JSON แผน scheduler, ตาราง slow-lane และคำสั่ง rerun ต่อเลน input `docker_lanes` ของเวิร์กโฟลว์จะรันเลนที่เลือกกับอิมเมจที่เตรียมไว้แทนงานชังก์ ซึ่งทำให้การดีบักเลนที่ล้มเหลวถูกจำกัดอยู่ในงาน Docker เป้าหมายหนึ่งงาน และเตรียม ดาวน์โหลด หรือใช้อาร์ติแฟกต์แพ็กเกจซ้ำสำหรับการรันนั้น หากเลนที่เลือกเป็นเลน Docker แบบ live งานเป้าหมายจะ build อิมเมจ live-test ภายในเครื่องสำหรับการ rerun นั้น คำสั่ง rerun GitHub ที่สร้างต่อเลนจะรวม `package_artifact_run_id`, `package_artifact_name` และ input อิมเมจที่เตรียมไว้เมื่อมีค่าเหล่านั้นอยู่ เพื่อให้เลนที่ล้มเหลวสามารถใช้แพ็กเกจและอิมเมจที่ตรงกันจากการรันที่ล้มเหลวได้ซ้ำ

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

เวิร์กโฟลว์ live/E2E ตามกำหนดจะรันชุด Docker release-path แบบเต็มทุกวัน

## Plugin ก่อนเผยแพร่

`Plugin Prerelease` เป็นความครอบคลุม product/แพ็กเกจที่มีค่าใช้จ่ายสูงกว่า จึงเป็นเวิร์กโฟลว์แยกต่างหากที่ถูก dispatch โดย `Full Release Validation` หรือโดย operator ที่ชัดเจน pull request ปกติ, การ push ไปยัง `main` และการ dispatch CI ด้วยตนเองแบบสแตนด์อโลนจะไม่เปิดใช้ชุดนี้ โดยจะบาลานซ์การทดสอบ Plugin ที่มาพร้อมชุดข้าม worker extension แปดตัว งาน shard ของ extension เหล่านั้นรันกลุ่ม config ของ Plugin ได้สูงสุดครั้งละสองกลุ่มด้วย worker Vitest หนึ่งตัวต่อกลุ่มและ heap ของ Node ที่ใหญ่ขึ้น เพื่อให้ batch ของ Plugin ที่ import หนักไม่สร้างงาน CI เพิ่ม เส้นทาง prerelease Docker เฉพาะ release จะ batch เลน Docker เป้าหมายเป็นกลุ่มเล็ก ๆ เพื่อหลีกเลี่ยงการจอง runner หลายสิบตัวสำหรับงานหนึ่งถึงสามนาที

## QA Lab

QA Lab มีเลน CI เฉพาะอยู่นอกเวิร์กโฟลว์ smart-scoped หลัก agentic parity ถูกซ้อนอยู่ภายใต้ harness QA และ release แบบกว้าง ไม่ใช่เวิร์กโฟลว์ PR แบบสแตนด์อโลน ใช้ `Full Release Validation` พร้อม `rerun_group=qa-parity` เมื่อ parity ควรไปพร้อมกับการรัน validation แบบกว้าง

- เวิร์กโฟลว์ `QA-Lab - All Lanes` รันทุกคืนบน `main` และเมื่อ dispatch ด้วยตนเอง โดยกระจายเลน mock parity, เลน Matrix live และเลน Telegram และ Discord live เป็นงานขนาน งาน live ใช้ environment `qa-live-shared` และ Telegram/Discord ใช้ lease ของ Convex

การตรวจสอบรีลีสรันเลน Matrix และ Telegram live transport ด้วย deterministic mock provider และโมเดลที่กำหนดคุณสมบัติด้วย mock (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อให้สัญญาของช่องทางถูกแยกออกจากความหน่วงของโมเดลจริงและการเริ่มต้น provider-plugin ปกติ Gateway ของ live transport ปิดใช้การค้นหาหน่วยความจำ เพราะ QA parity ครอบคลุมพฤติกรรมหน่วยความจำแยกต่างหาก ส่วนการเชื่อมต่อของ provider ครอบคลุมโดยชุดทดสอบ live model, native provider และ Docker provider แยกต่างหาก

Matrix ใช้ `--profile fast` สำหรับเกตตามกำหนดเวลาและเกตรีลีส โดยเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout รองรับ ค่าเริ่มต้นของ CLI และอินพุต workflow แบบแมนนวลยังคงเป็น `all`; การ dispatch แบบแมนนวลด้วย `matrix_profile=all` จะแบ่งความครอบคลุม Matrix เต็มรูปแบบออกเป็นงาน `transport`, `media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรันเลน QA Lab ที่สำคัญต่อรีลีสก่อนการอนุมัติรีลีสด้วย; เกต QA parity ของมันรันแพ็ก candidate และ baseline เป็นงานเลนแบบขนาน จากนั้นดาวน์โหลด artifacts ทั้งสองลงในงานรายงานขนาดเล็กสำหรับการเปรียบเทียบ parity ขั้นสุดท้าย

สำหรับ PR ปกติ ให้ใช้หลักฐาน CI/การตรวจสอบตามขอบเขต แทนการถือว่า parity เป็นสถานะที่จำเป็น

## CodeQL

workflow `CodeQL` ตั้งใจให้เป็นสแกนเนอร์ความปลอดภัยรอบแรกที่มีขอบเขตแคบ ไม่ใช่การกวาดทั้ง repository แบบเต็ม รายวัน แบบแมนนวล และการรัน guard สำหรับ pull request ที่ไม่ใช่ draft จะสแกนโค้ด Actions workflow รวมถึงพื้นผิว JavaScript/TypeScript ที่มีความเสี่ยงสูงสุดด้วย security queries ที่มีความเชื่อมั่นสูง ซึ่งกรองเป็น `security-severity` ระดับสูง/วิกฤต

guard ของ pull request ยังคงเบา: จะเริ่มเฉพาะเมื่อมีการเปลี่ยนแปลงภายใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` หรือ `src` และรันเมทริกซ์ความปลอดภัยความเชื่อมั่นสูงเดียวกับ workflow ตามกำหนดเวลา CodeQL ของ Android และ macOS จะไม่อยู่ในค่าเริ่มต้นของ PR

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                          | พื้นผิว                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | การยืนยันตัวตน, ความลับ, sandbox, cron และ baseline ของ gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการใช้งานการติดตั้งช่องทางหลัก รวมถึง runtime ของ plugin ช่องทาง, gateway, Plugin SDK, ความลับ และจุดสัมผัสการ audit              |
| `/codeql-security-high/network-ssrf-boundary`     | พื้นผิว SSRF หลัก, การแยกวิเคราะห์ IP, network guard, web-fetch และนโยบาย SSRF ของ Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | เซิร์ฟเวอร์ MCP, helper การประมวลผล process, การส่งออก และเกตการรันเครื่องมือของ agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | พื้นผิวความเชื่อถือของการติดตั้ง Plugin, loader, manifest, registry, การติดตั้ง package-manager, source-loading และสัญญาแพ็กเกจ Plugin SDK |

### shard ความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — shard ความปลอดภัย Android ตามกำหนดเวลา สร้างแอป Android แบบแมนนวลสำหรับ CodeQL บน Blacksmith Linux runner ขนาดเล็กที่สุดที่ workflow sanity ยอมรับ อัปโหลดภายใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — shard ความปลอดภัย macOS รายสัปดาห์/แมนนวล สร้างแอป macOS แบบแมนนวลสำหรับ CodeQL บน Blacksmith macOS, กรองผลลัพธ์การ build dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดภายใต้ `/codeql-critical-security/macos` เก็บไว้นอกค่าเริ่มต้นรายวันเพราะการ build macOS ใช้เวลารันเป็นหลักแม้เมื่อสะอาด

### หมวดหมู่คุณภาพวิกฤต

`CodeQL Critical Quality` คือ shard ที่ตรงกันในฝั่งไม่ใช่ความปลอดภัย มันรันเฉพาะ quality queries ของ JavaScript/TypeScript ที่ไม่ใช่ความปลอดภัยและมี severity เป็น error เหนือพื้นผิวมูลค่าสูงที่มีขอบเขตแคบบน Blacksmith Linux runner ขนาดเล็กกว่า guard ของ pull request ตั้งใจให้เล็กกว่าโปรไฟล์ตามกำหนดเวลา: PR ที่ไม่ใช่ draft จะรันเฉพาะ shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` ที่ตรงกัน สำหรับการเปลี่ยนแปลงโค้ดการรันคำสั่ง/โมเดล/เครื่องมือของ agent และการ dispatch การตอบกลับ, โค้ด schema/migration/IO ของ config, โค้ด auth/secrets/sandbox/security, runtime ช่องทางหลักและ plugin ช่องทางที่ bundle มา, โปรโตคอล gateway/server-method, runtime หน่วยความจำ/SDK glue, MCP/process/outbound delivery, runtime ของ provider/แค็ตตาล็อกโมเดล, diagnostics ของ session/คิว delivery, plugin loader, สัญญา Plugin SDK/package-contract หรือ runtime การตอบกลับของ Plugin SDK การเปลี่ยนแปลง config ของ CodeQL และ workflow คุณภาพจะรัน shard คุณภาพ PR ทั้งสิบสองรายการ

การ dispatch แบบแมนนวลรับ:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

โปรไฟล์ที่แคบเป็น hook สำหรับการสอน/การวนซ้ำเพื่อรัน quality shard หนึ่งรายการแบบแยกเดี่ยว

| หมวดหมู่                                                | พื้นผิว                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ดขอบเขตความปลอดภัยของการยืนยันตัวตน, ความลับ, sandbox, cron และ gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | สัญญา config schema, migration, normalization และ IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schema โปรโตคอล Gateway และสัญญา server method                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญาการติดตั้งใช้งานช่องทางหลักและ plugin ช่องทางที่ bundle มา                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | การรันคำสั่ง, การ dispatch โมเดล/provider, การ dispatch และคิว auto-reply และสัญญา runtime ของ ACP control-plane                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | เซิร์ฟเวอร์ MCP และ bridge ของเครื่องมือ, helper การกำกับดูแล process และสัญญา outbound delivery                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | memory host SDK, facade ของ memory runtime, alias ของ memory Plugin SDK, glue การเปิดใช้งาน memory runtime และคำสั่ง memory doctor                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | internals ของ reply queue, คิว delivery ของ session, helper การ bind/delivery ของ outbound session, พื้นผิว diagnostic event/log bundle และสัญญา session doctor CLI |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | การ dispatch การตอบกลับขาเข้าของ Plugin SDK, helper ของ reply payload/chunking/runtime, ตัวเลือกการตอบกลับช่องทาง, คิว delivery และ helper การ bind session/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | การ normalize แค็ตตาล็อกโมเดล, auth และ discovery ของ provider, การลงทะเบียน provider runtime, ค่าเริ่มต้น/แค็ตตาล็อกของ provider และ registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | bootstrap ของ Control UI, local persistence, control flow ของ Gateway และสัญญา runtime ของ task control-plane                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | web fetch/search หลัก, media IO, media understanding, image-generation และสัญญา runtime ของ media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | สัญญา entrypoint ของ loader, registry, public-surface และ Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | ซอร์ส Plugin SDK ฝั่งแพ็กเกจที่เผยแพร่แล้ว และ helper สัญญาแพ็กเกจ plugin                                                                                      |

คุณภาพแยกจากความปลอดภัย เพื่อให้ findings ด้านคุณภาพสามารถถูกจัดตาราง วัดผล ปิดใช้ หรือขยายได้โดยไม่ทำให้สัญญาณความปลอดภัยคลุมเครือ การขยาย CodeQL สำหรับ Swift, Python และ bundled-plugin ควรถูกเพิ่มกลับมาเป็นงาน follow-up แบบมีขอบเขตหรือแบบ shard เฉพาะหลังจากโปรไฟล์ที่แคบมี runtime และสัญญาณที่เสถียรแล้วเท่านั้น

## workflow การบำรุงรักษา

### Docs Agent

workflow `Docs Agent` คือเลนการบำรุงรักษา Codex แบบ event-driven สำหรับทำให้เอกสารที่มีอยู่สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง land มันไม่มี schedule ล้วน: การรัน CI จาก push ที่ไม่ใช่บอทและสำเร็จบน `main` สามารถ trigger ได้ และการ dispatch แบบแมนนวลสามารถรันได้โดยตรง invocation แบบ workflow-run จะ skip เมื่อ `main` เคลื่อนไปแล้ว หรือเมื่อมีการรัน Docs Agent อื่นที่ไม่ถูก skip ถูกสร้างขึ้นในชั่วโมงที่ผ่านมา เมื่อรัน มันจะตรวจทานช่วง commit ตั้งแต่ SHA ต้นทางของ Docs Agent ที่ไม่ถูก skip ครั้งก่อนจนถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงครั้งเดียวจึงครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมมาตั้งแต่การตรวจเอกสารครั้งล่าสุดได้

### Test Performance Agent

workflow `Test Performance Agent` คือเลนการบำรุงรักษา Codex แบบ event-driven สำหรับการทดสอบที่ช้า มันไม่มี schedule ล้วน: การรัน CI จาก push ที่ไม่ใช่บอทและสำเร็จบน `main` สามารถ trigger ได้ แต่จะ skip หาก invocation แบบ workflow-run อื่นรันไปแล้วหรือกำลังรันอยู่ในวัน UTC นั้น การ dispatch แบบแมนนวลจะข้ามเกตกิจกรรมรายวันนั้น เลนนี้สร้างรายงานประสิทธิภาพ Vitest แบบ full-suite ที่จัดกลุ่มไว้ ให้ Codex ทำได้เฉพาะการแก้ประสิทธิภาพการทดสอบขนาดเล็กที่ยังคง coverage แทนการ refactor กว้าง จากนั้นรันรายงาน full-suite อีกครั้งและปฏิเสธการเปลี่ยนแปลงที่ลดจำนวนการทดสอบผ่าน baseline หาก baseline มีการทดสอบที่ล้มเหลว Codex อาจแก้ได้เฉพาะความล้มเหลวที่ชัดเจน และรายงาน full-suite หลัง agent ต้องผ่านก่อนที่จะ commit อะไร เมื่อ `main` เดินหน้าไปก่อนที่ bot push จะ land เลนจะ rebase patch ที่ validate แล้ว รัน `pnpm check:changed` อีกครั้ง และ retry การ push; patch stale ที่ conflict จะถูก skip มันใช้ GitHub-hosted Ubuntu เพื่อให้ action ของ Codex คง posture ความปลอดภัยแบบ drop-sudo เดียวกับ docs agent

### PR ซ้ำหลัง Merge

workflow `Duplicate PRs After Merge` คือ workflow สำหรับ maintainer แบบแมนนวลเพื่อ cleanup รายการซ้ำหลัง land ค่าเริ่มต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุอย่างชัดเจนเมื่อ `apply=true` ก่อน mutate GitHub มันตรวจสอบว่า PR ที่ land ถูก merge แล้ว และ duplicate แต่ละรายการมี issue ที่อ้างอิงร่วมกันหรือมี hunk ที่เปลี่ยนแปลงทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## เกตการตรวจสอบภายในเครื่องและการ route ตามการเปลี่ยนแปลง

ตรรกะ changed-lane ภายในเครื่องอยู่ใน `scripts/changed-lanes.mjs` และถูกดำเนินการโดย `scripts/check-changed.mjs` เกตการตรวจสอบภายในเครื่องนั้นเข้มงวดเรื่องขอบเขตสถาปัตยกรรมมากกว่าขอบเขตแพลตฟอร์ม CI แบบกว้าง:

- การเปลี่ยนแปลงโค้ดใช้งานจริงของแกนหลักจะรัน typecheck สำหรับ core prod และ core test รวมถึง lint/guards ของแกนหลัก;
- การเปลี่ยนแปลงเฉพาะการทดสอบของแกนหลักจะรันเฉพาะ typecheck สำหรับ core test รวมถึง lint ของแกนหลัก;
- การเปลี่ยนแปลงโค้ดใช้งานจริงของส่วนขยายจะรัน typecheck สำหรับ extension prod และ extension test รวมถึง lint ของส่วนขยาย;
- การเปลี่ยนแปลงเฉพาะการทดสอบของส่วนขยายจะรัน typecheck สำหรับ extension test รวมถึง lint ของส่วนขยาย;
- การเปลี่ยนแปลง Plugin SDK สาธารณะหรือสัญญาของ plugin จะขยายไปถึง typecheck ของส่วนขยาย เพราะส่วนขยายพึ่งพาสัญญาแกนหลักเหล่านั้น (การกวาดทดสอบส่วนขยายด้วย Vitest ยังคงเป็นงานทดสอบที่ต้องสั่งอย่างชัดเจน);
- การปรับรุ่นเฉพาะเมทาดาทาของรีลีสจะรันการตรวจเวอร์ชัน/config/root-dependency แบบเจาะจง;
- การเปลี่ยนแปลง root/config ที่ไม่ทราบแน่ชัดจะ fail safe ไปยังทุก check lane.

การกำหนดเส้นทางการทดสอบที่เปลี่ยนในเครื่องอยู่ใน `scripts/test-projects.test-support.mjs` และตั้งใจให้เบากว่า `check:changed`: การแก้ไขไฟล์ทดสอบโดยตรงจะรันตัวเอง, การแก้ไขซอร์สจะใช้การแมปที่ระบุชัดก่อน จากนั้นจึงใช้การทดสอบข้างเคียงและตัวที่พึ่งพาตามกราฟการนำเข้า การกำหนดค่าการส่งข้อความห้องกลุ่มที่ใช้ร่วมกันเป็นหนึ่งในการแมปที่ระบุชัด: การเปลี่ยนแปลง config การตอบกลับที่มองเห็นได้ในกลุ่ม, โหมดการส่งคำตอบจากซอร์ส, หรือพรอมป์ระบบของ message-tool จะถูกส่งผ่านการทดสอบคำตอบของแกนหลัก รวมถึงรีเกรสชันการส่งของ Discord และ Slack เพื่อให้การเปลี่ยนค่าเริ่มต้นที่ใช้ร่วมกันล้มเหลวก่อนการ push PR ครั้งแรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างถึงระดับ harness จนชุดที่แมปแบบเบาไม่ใช่ตัวแทนที่เชื่อถือได้

## การตรวจสอบด้วย Testbox

รัน Testbox จาก root ของ repo และควรใช้กล่องที่ warm ใหม่สำหรับหลักฐานแบบกว้าง ก่อนใช้ gate ที่ช้าบนกล่องที่ถูกนำกลับมาใช้ใหม่ หมดอายุ หรือเพิ่งรายงานการซิงก์ที่ใหญ่ผิดคาด ให้รัน `pnpm testbox:sanity` ภายในกล่องก่อน

การตรวจ sanity จะล้มเหลวอย่างรวดเร็วเมื่อไฟล์ root ที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short` แสดงการลบไฟล์ที่ติดตามแล้วอย่างน้อย 200 รายการ โดยปกติหมายความว่าสถานะการซิงก์ระยะไกลไม่ใช่สำเนาของ PR ที่เชื่อถือได้ ให้หยุดกล่องนั้นและ warm กล่องใหม่แทนการดีบักความล้มเหลวของการทดสอบผลิตภัณฑ์ สำหรับ PR ที่ตั้งใจลบไฟล์จำนวนมาก ให้ตั้ง `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับการรัน sanity นั้น

`pnpm testbox:run` จะยุติการเรียก Blacksmith CLI ในเครื่องที่ค้างอยู่ในเฟสซิงก์นานเกินห้านาทีโดยไม่มีเอาต์พุตหลังซิงก์ ตั้ง `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` เพื่อปิด guard นั้น หรือใช้ค่ามิลลิวินาทีที่มากขึ้นสำหรับ diff ในเครื่องที่ใหญ่ผิดปกติ

Crabbox เป็น wrapper กล่องระยะไกลของ repo สำหรับหลักฐาน Linux ของ maintainer ใช้เมื่อการตรวจสอบกว้างเกินไปสำหรับ local edit loop, เมื่อความสอดคล้องกับ CI สำคัญ, หรือเมื่อหลักฐานต้องใช้ secrets, Docker, package lanes, กล่องที่นำกลับมาใช้ซ้ำได้, หรือบันทึกระยะไกล backend ปกติของ OpenClaw คือ `blacksmith-testbox`; ความจุ AWS/Hetzner ที่เป็นเจ้าของเป็นทางสำรองสำหรับกรณี Blacksmith ล่ม, ปัญหาโควตา, หรือการทดสอบความจุที่เป็นเจ้าของอย่างชัดเจน

ก่อนรันครั้งแรก ให้ตรวจ wrapper จาก root ของ repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

wrapper ของ repo จะปฏิเสธไบนารี Crabbox ที่ล้าสมัยซึ่งไม่ประกาศ `blacksmith-testbox` ส่ง provider อย่างชัดเจนแม้ว่า `.crabbox.yaml` จะมีค่าเริ่มต้น owned-cloud อยู่แล้ว

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

การรันทดสอบซ้ำแบบเจาะจง:

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

อ่านสรุป JSON สุดท้าย ฟิลด์ที่มีประโยชน์คือ `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, และ `totalMs` การรัน Crabbox แบบครั้งเดียวที่หนุนด้วย Blacksmith ควรหยุด Testbox โดยอัตโนมัติ หากการรันถูกขัดจังหวะหรือการล้างข้อมูลไม่ชัดเจน ให้ตรวจกล่องที่ยังทำงานอยู่และหยุดเฉพาะกล่องที่คุณสร้าง:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

ใช้การนำกลับมาใช้ซ้ำเฉพาะเมื่อคุณตั้งใจต้องใช้หลายคำสั่งบนกล่องที่ hydrate แล้วกล่องเดียวกัน:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

หาก Crabbox เป็นชั้นที่เสีย แต่ Blacksmith เองทำงานได้ ให้ใช้ Blacksmith โดยตรงเป็นทางสำรองแบบแคบ:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

หาก `blacksmith testbox list --all` และ `blacksmith testbox status` ทำงาน แต่ warmup ใหม่ค้างอยู่ที่ `queued` โดยไม่มี IP หรือ URL การรัน Actions หลังจากผ่านไปสองสามนาที ให้ถือว่าเป็นแรงกดดันจาก provider, คิว, การเรียกเก็บเงิน, หรือขีดจำกัด org ของ Blacksmith หยุด id ที่ queued ซึ่งคุณสร้างไว้ หลีกเลี่ยงการเริ่ม Testbox เพิ่ม และย้ายหลักฐานไปยังเส้นทางความจุ Crabbox ที่เป็นเจ้าของด้านล่าง ระหว่างที่มีคนตรวจแดชบอร์ด Blacksmith, การเรียกเก็บเงิน, และขีดจำกัด org

ยกระดับไปยังความจุ Crabbox ที่เป็นเจ้าของเฉพาะเมื่อ Blacksmith ล่ม, ถูกจำกัดโควตา, ไม่มีสภาพแวดล้อมที่ต้องใช้, หรือความจุที่เป็นเจ้าของเป็นเป้าหมายอย่างชัดเจน:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

ภายใต้แรงกดดันของ AWS ให้หลีกเลี่ยง `class=beast` เว้นแต่งานต้องใช้ CPU ระดับ 48xlarge-class จริง ๆ คำขอ `beast` เริ่มที่ 192 vCPU และเป็นวิธีที่ง่ายที่สุดในการชนโควตา EC2 Spot หรือ On-Demand Standard ระดับภูมิภาค `.crabbox.yaml` ที่ repo เป็นเจ้าของตั้งค่าเริ่มต้นเป็น `standard`, หลายภูมิภาคความจุ และ `capacity.hints: true` เพื่อให้ lease ของ AWS ที่ broker แล้วพิมพ์ภูมิภาค/ตลาดที่เลือก, แรงกดดันโควตา, การ fallback ไปยัง Spot, และคำเตือน class ที่มีแรงกดดันสูง ใช้ `fast` สำหรับการตรวจแบบกว้างที่หนักขึ้น, ใช้ `large` เฉพาะหลังจาก standard/fast ไม่พอ และใช้ `beast` เฉพาะ lane ที่กิน CPU เป็นพิเศษ เช่น full-suite หรือเมทริกซ์ Docker ของทุก plugin, การตรวจสอบ release/blocker อย่างชัดเจน, หรือการทำโปรไฟล์ประสิทธิภาพที่ใช้คอร์สูง ห้ามใช้ `beast` สำหรับ `pnpm check:changed`, การทดสอบแบบเจาะจง, งานเฉพาะเอกสาร, lint/typecheck ทั่วไป, การจำลองซ้ำ E2E ขนาดเล็ก, หรือการ triage กรณี Blacksmith ล่ม ใช้ `--market on-demand` สำหรับการวิเคราะห์ความจุเพื่อไม่ให้ความผันผวนของตลาด Spot ปะปนกับสัญญาณ

`.crabbox.yaml` เป็นเจ้าของค่าเริ่มต้นของ provider, การซิงก์, และการ hydrate ด้วย GitHub Actions สำหรับ lane owned-cloud ไฟล์นี้ยกเว้น `.git` ในเครื่อง เพื่อให้ checkout ของ Actions ที่ hydrate แล้วรักษาเมทาดาทา Git ระยะไกลของตัวเอง แทนการซิงก์ remote และ object store ในเครื่องของ maintainer และยกเว้นอาร์ติแฟกต์ runtime/build ในเครื่องที่ไม่ควรถูกถ่ายโอน `.github/workflows/crabbox-hydrate.yml` เป็นเจ้าของ checkout, การตั้งค่า Node/pnpm, การ fetch `origin/main`, และการส่งต่อสภาพแวดล้อมที่ไม่ใช่ secret สำหรับคำสั่ง owned-cloud `crabbox run --id <cbx_id>`

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
