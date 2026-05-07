---
read_when:
    - คุณต้องเข้าใจว่าเหตุใดงาน CI จึงถูกเรียกใช้หรือไม่ถูกเรียกใช้
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการรันหรือการรันซ้ำสำหรับการตรวจสอบความถูกต้องของรีลีส
    - คุณกำลังเปลี่ยนการส่งงานของ ClawSweeper หรือการส่งต่อกิจกรรม GitHub
summary: กราฟงานการผสานรวมอย่างต่อเนื่อง ด่านตรวจตามขอบเขต ชุดครอบการปล่อยรุ่น และคำสั่งในเครื่องที่เทียบเท่า
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-05-07T13:13:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1258ddb510538a250c68626f98b7f32201a46abf36f92d29e945bb7149a841cc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI ทำงานทุกครั้งที่ push ไปยัง `main` และทุก pull request งาน `preflight` จะจำแนก diff และปิด lane ที่ใช้ทรัพยากรมากเมื่อมีการเปลี่ยนแปลงเฉพาะพื้นที่ที่ไม่เกี่ยวข้อง การรัน `workflow_dispatch` แบบแมนนวลตั้งใจข้ามการกำหนดขอบเขตอัจฉริยะและกระจายงานเป็นกราฟเต็มสำหรับ release candidate และการตรวจสอบแบบกว้าง lane ของ Android ยังคงเป็นแบบเลือกเปิดผ่าน `include_android` ความครอบคลุมของ Plugin เฉพาะ release อยู่ใน workflow [`Plugin ก่อนเผยแพร่`](#plugin-prerelease) แยกต่างหาก และจะทำงานเฉพาะจาก [`การตรวจสอบ Release แบบเต็ม`](#full-release-validation) หรือการสั่งรันแบบแมนนวลโดยชัดเจนเท่านั้น

## ภาพรวม Pipeline

| งาน                              | วัตถุประสงค์                                                                                                   | ทำงานเมื่อ                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | ตรวจจับการเปลี่ยนแปลงเฉพาะ docs, scope ที่เปลี่ยน, extension ที่เปลี่ยน และสร้าง manifest ของ CI                   | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-scm-fast`              | การตรวจจับ private key และการ audit workflow ผ่าน `zizmor`                                                     | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-dependency-audit`      | Audit lockfile ฝั่ง production แบบไม่ต้องใช้ dependency เทียบกับ npm advisories                                          | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-fast`                  | Aggregate ที่จำเป็นสำหรับงาน security แบบเร็ว                                                             | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `check-dependencies`             | รอบ production Knip เฉพาะ dependency รวมถึง guard สำหรับ allowlist ของไฟล์ที่ไม่ได้ใช้                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-artifacts`                | Build `dist/`, Control UI, การตรวจ built-artifact และ artifact downstream ที่ใช้ซ้ำได้                       | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-core`               | lane ตรวจความถูกต้องบน Linux แบบเร็ว เช่น การตรวจ bundled/plugin-contract/protocol                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-contracts-channels` | การตรวจ channel contract แบบ shard พร้อมผล aggregate check ที่เสถียร                                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-core-test`          | shard ทดสอบ Core Node โดยยกเว้น lane ของ channel, bundled, contract และ extension                          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check`                          | เทียบเท่า local gate หลักแบบ shard: prod types, lint, guards, test types และ strict smoke                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check-additional`               | Architecture, boundary/prompt drift แบบ shard, extension guards, package boundary และ gateway watch        | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-smoke`                    | การทดสอบ smoke ของ built-CLI และ smoke หน่วยความจำตอนเริ่มต้น                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks`                         | Verifier สำหรับการทดสอบ channel ของ built-artifact                                                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-compat-node22`      | lane build และ smoke สำหรับความเข้ากันได้กับ Node 22                                                                | CI dispatch แบบแมนนวลสำหรับ release    |
| `check-docs`                     | การจัดรูปแบบ docs, lint และการตรวจ broken link                                                             | Docs เปลี่ยน                       |
| `skills-python`                  | Ruff + pytest สำหรับ Skills ที่รองรับด้วย Python                                                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Skills ฝั่ง Python      |
| `checks-windows`                 | การทดสอบ process/path เฉพาะ Windows รวมถึง regression ของ shared runtime import specifier                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows           |
| `macos-node`                     | lane ทดสอบ TypeScript บน macOS โดยใช้ built artifacts ที่ใช้ร่วมกัน                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `macos-swift`                    | Swift lint, build และ tests สำหรับแอป macOS                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `android`                        | Unit tests ของ Android สำหรับทั้งสอง flavor พร้อม build debug APK หนึ่งรายการ                                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android           |
| `test-performance-agent`         | การปรับปรุง slow-test ของ Codex รายวันหลังจาก trusted activity                                                 | CI บน main สำเร็จหรือ manual dispatch |
| `openclaw-performance`           | รายงาน performance ของ runtime Kova แบบรายวัน/ตามสั่ง พร้อม lane mock-provider, deep-profile และ GPT 5.4 live | Scheduled และ manual dispatch      |

## ลำดับ Fail-fast

1. `preflight` ตัดสินว่า lane ใดมีอยู่ตั้งแต่แรก ตรรกะ `docs-scope` และ `changed-scope` เป็น step ภายในงานนี้ ไม่ใช่งานแยกต่างหาก
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` ล้มเหลวอย่างรวดเร็วโดยไม่ต้องรอ matrix งาน artifact และ platform ที่หนักกว่า
3. `build-artifacts` ทำงานซ้อนกับ lane Linux แบบเร็ว เพื่อให้ consumer downstream เริ่มได้ทันทีที่ shared build พร้อม
4. lane platform และ runtime ที่หนักกว่าจะกระจายงานหลังจากนั้น: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่เป็น `cancelled` เมื่อมี push ใหม่ลงบน PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่านั่นเป็น noise ของ CI เว้นแต่ว่าการรันล่าสุดสำหรับ ref เดียวกันก็ล้มเหลวด้วย การตรวจ aggregate shard ใช้ `!cancelled() && always()` เพื่อให้ยังรายงาน shard failure ตามปกติ แต่ไม่เข้าคิวหลังจาก workflow ทั้งหมดถูกแทนที่แล้ว concurrency key ของ CI อัตโนมัติมีเวอร์ชัน (`CI-v7-*`) เพื่อให้ zombie ฝั่ง GitHub ใน queue group เก่าไม่สามารถบล็อกการรัน main ใหม่ได้ไม่มีกำหนด การรัน full-suite แบบแมนนวลใช้ `CI-manual-v1-*` และไม่ยกเลิกการรันที่กำลังดำเนินอยู่

งาน `ci-timings-summary` อัปโหลด artifact `ci-timings-summary` แบบกะทัดรัดสำหรับ CI แต่ละครั้งที่ไม่ใช่ draft โดยบันทึก wall time, queue time, งานที่ช้าที่สุด และงานที่ล้มเหลวสำหรับการรันปัจจุบัน เพื่อให้การตรวจสุขภาพ CI ไม่ต้อง scrape payload ของ Actions แบบเต็มซ้ำ ๆ

## Scope และ routing

ตรรกะ scope อยู่ใน `scripts/ci-changed-scope.mjs` และครอบคลุมด้วย unit tests ใน `src/scripts/ci-changed-scope.test.ts` manual dispatch จะข้ามการตรวจจับ changed-scope และทำให้ manifest ของ preflight ทำงานเหมือนกับว่าทุกพื้นที่ที่มี scope เปลี่ยนแปลง

- **การแก้ไข CI workflow** ตรวจสอบกราฟ Node CI รวมถึง workflow linting แต่ไม่ได้บังคับ Windows, Android หรือ native build ของ macOS ด้วยตัวเอง; lane ของ platform เหล่านั้นยังคง scoped ตามการเปลี่ยนแปลง source ของ platform
- **การแก้ไขเฉพาะ CI routing, การแก้ไข fixture ของ core-test ราคาถูกบางรายการ และการแก้ไข helper/test-routing ของ plugin contract แบบแคบ** ใช้เส้นทาง manifest แบบ Node-only ที่เร็ว: `preflight`, security และ task `checks-fast-core` เดียว เส้นทางนั้นข้าม build artifacts, ความเข้ากันได้กับ Node 22, channel contracts, core shards แบบเต็ม, bundled-plugin shards และ guard matrices เพิ่มเติม เมื่อการเปลี่ยนแปลงจำกัดอยู่ที่พื้นผิว routing หรือ helper ที่ task เร็วทดสอบโดยตรง
- **การตรวจ Windows Node** scoped ตาม wrapper process/path เฉพาะ Windows, helper runner ของ npm/pnpm/UI, config ของ package manager และพื้นผิว CI workflow ที่เรียกใช้ lane นั้น; การเปลี่ยนแปลง source, plugin, install-smoke และ test-only ที่ไม่เกี่ยวข้องยังคงอยู่บน lane Linux Node

กลุ่มการทดสอบ Node ที่ช้าที่สุดถูกแยกหรือปรับสมดุลเพื่อให้งานแต่ละงานยังเล็กโดยไม่จอง runner เกินจำเป็น: channel contracts ทำงานเป็น shard แบบถ่วงน้ำหนักสามชุดที่รองรับด้วย Blacksmith พร้อม fallback runner มาตรฐานของ GitHub, lane core unit fast/support ทำงานแยกกัน, core runtime infra ถูกแบ่งระหว่าง shard state, process/config, cron และ shared, auto-reply ทำงานเป็น worker ที่ปรับสมดุลแล้ว (โดยแยก subtree reply เป็น shard agent-runner, dispatch และ commands/state-routing) และ config ของ agentic gateway/server ถูกแยกข้าม lane chat/auth/model/http-plugin/runtime/startup แทนที่จะรอ built artifacts การทดสอบ browser, QA, media และ plugin เบ็ดเตล็ดแบบกว้างใช้ config Vitest เฉพาะของตัวเองแทน shared plugin catch-all shard แบบ include-pattern บันทึก timing entry โดยใช้ชื่อ CI shard เพื่อให้ `.artifacts/vitest-shard-timings.json` แยกความแตกต่างระหว่าง config ทั้งชุดกับ shard ที่ถูกกรองได้ `check-additional` เก็บงาน compile/canary ของ package-boundary ไว้ด้วยกัน และแยก runtime topology architecture ออกจาก coverage ของ gateway watch; รายการ boundary guard ถูกแบ่งแถบข้าม matrix shard สี่ชุด แต่ละชุดรัน guard อิสระที่เลือกไว้พร้อมกันและพิมพ์ timing ต่อ check การตรวจ snapshot drift ของ prompt happy-path ของ Codex ที่มีต้นทุนสูงทำงานเป็นงาน additional แยกสำหรับ CI แบบแมนนวลและเฉพาะการเปลี่ยนแปลงที่กระทบ prompt เท่านั้น เพื่อให้การเปลี่ยนแปลง Node ปกติที่ไม่เกี่ยวข้องไม่ต้องรอการสร้าง cold prompt snapshot และ boundary shards ยังคงสมดุล ขณะที่ prompt drift ยังถูกตรึงกับ PR ที่ทำให้เกิดการเปลี่ยนแปลงนั้น; flag เดียวกันนี้ข้ามการสร้าง prompt snapshot Vitest ภายใน shard core support-boundary ของ built-artifact Gateway watch, channel tests และ shard core support-boundary ทำงานพร้อมกันภายใน `build-artifacts` หลังจาก `dist/` และ `dist-runtime/` ถูก build แล้ว

Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` แล้วจึง build Play debug APK flavor third-party ไม่มี source set หรือ manifest แยกต่างหาก; unit-test lane ของมันยังคง compile flavor พร้อม flag BuildConfig ของ SMS/call-log ขณะหลีกเลี่ยงงาน packaging debug APK ซ้ำในทุก push ที่เกี่ยวข้องกับ Android

shard `check-dependencies` รัน `pnpm deadcode:dependencies` (รอบ production Knip เฉพาะ dependency ที่ตรึงกับ Knip เวอร์ชันล่าสุด โดยปิด minimum release age ของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบผล unused-file ของ production จาก Knip กับ `scripts/deadcode-unused-files.allowlist.mjs` guard unused-file จะล้มเหลวเมื่อ PR เพิ่มไฟล์ที่ไม่ได้ใช้และยังไม่ได้ review ใหม่ หรือเหลือ entry allowlist ที่ stale ไว้ ขณะยังรักษาพื้นผิว dynamic plugin, generated, build, live-test และ package bridge ที่ตั้งใจไว้ซึ่ง Knip ไม่สามารถ resolve แบบ static ได้

## การส่งต่อกิจกรรม ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` เป็น bridge ฝั่ง target จากกิจกรรม repository ของ OpenClaw เข้าสู่ ClawSweeper มันไม่ checkout หรือ execute โค้ด pull request ที่ไม่น่าเชื่อถือ workflow จะสร้าง GitHub App token จาก `CLAWSWEEPER_APP_PRIVATE_KEY` แล้ว dispatch payload `repository_dispatch` แบบกะทัดรัดไปยัง `openclaw/clawsweeper`

workflow มีสี่ lane:

- `clawsweeper_item` สำหรับคำขอ review issue และ pull request แบบเจาะจง;
- `clawsweeper_comment` สำหรับคำสั่ง ClawSweeper ที่ชัดเจนใน issue comments;
- `clawsweeper_commit_review` สำหรับคำขอ review ระดับ commit บน push ไปยัง `main`;
- `github_activity` สำหรับกิจกรรม GitHub ทั่วไปที่ agent ClawSweeper อาจตรวจสอบ

lane `github_activity` ส่งต่อเฉพาะ metadata ที่ normalize แล้ว: event type, action, actor, repository, item number, URL, title, state และ excerpt สั้น ๆ สำหรับ comments หรือ reviews เมื่อมี มันตั้งใจหลีกเลี่ยงการส่งต่อ webhook body แบบเต็ม workflow ฝั่งรับใน `openclaw/clawsweeper` คือ `.github/workflows/github-activity.yml` ซึ่งโพสต์ event ที่ normalize แล้วไปยัง hook ของ OpenClaw Gateway สำหรับ agent ClawSweeper

กิจกรรมทั่วไปคือการสังเกต ไม่ใช่การส่งมอบโดยค่าเริ่มต้น agent ClawSweeper ได้รับ target ของ Discord ใน prompt และควรโพสต์ไปยัง `#clawsweeper` เฉพาะเมื่อ event นั้นน่าประหลาดใจ, ดำเนินการได้, มีความเสี่ยง หรือมีประโยชน์เชิงปฏิบัติการ การเปิด, แก้ไข, bot churn, noise จาก webhook ซ้ำ และ traffic review ปกติควรส่งผลเป็น `NO_REPLY`

ถือว่าชื่อเรื่อง ความคิดเห็น เนื้อหา ข้อความรีวิว ชื่อ branch และข้อความ commit ของ GitHub เป็นข้อมูลที่ไม่น่าเชื่อถือตลอดเส้นทางนี้ สิ่งเหล่านี้เป็นอินพุตสำหรับการสรุปและการคัดแยก ไม่ใช่คำสั่งสำหรับ workflow หรือ agent runtime

## การ dispatch แบบแมนนวล

การ dispatch CI แบบแมนนวลจะรันกราฟงานเดียวกับ CI ปกติ แต่บังคับเปิดทุก lane ที่ไม่อยู่ในขอบเขต Android: Linux Node shards, bundled-plugin shards, channel contracts, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, การตรวจสอบเอกสาร, Python skills, Windows, macOS และ Control UI i18n การ dispatch CI แบบแมนนวลเดี่ยวจะรัน Android เท่านั้นด้วย `include_android=true`; umbrella สำหรับ release เต็มรูปแบบจะเปิดใช้ Android โดยส่ง `include_android=true` การตรวจสอบ static ของ Plugin prerelease, shard `agentic-plugins` เฉพาะ release, การ sweep batch ส่วนขยายทั้งหมด และ lane Docker ของ Plugin prerelease จะถูกแยกออกจาก CI ชุด Docker prerelease จะรันก็ต่อเมื่อ `Full Release Validation` dispatch workflow `Plugin Prerelease` แยกต่างหากโดยเปิด gate release-validation

การรันแบบแมนนวลใช้ concurrency group ที่ไม่ซ้ำกันเพื่อให้ชุดเต็มของ release-candidate ไม่ถูกยกเลิกโดย push หรือ PR run อื่นบน ref เดียวกัน อินพุต `target_ref` แบบเลือกได้ทำให้ caller ที่เชื่อถือได้รันกราฟนั้นกับ branch, tag หรือ commit SHA แบบเต็มได้ ขณะใช้ไฟล์ workflow จาก dispatch ref ที่เลือก

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, งานและ aggregate ด้านความปลอดภัยแบบเร็ว (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจสอบ protocol/contract/bundled แบบเร็ว, การตรวจสอบ channel contract แบบ sharded, shard ของ `check` ยกเว้น lint, aggregate ของ `check-additional`, ตัวตรวจสอบ aggregate ของ Node test, การตรวจสอบเอกสาร, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight ยังใช้ Ubuntu ที่โฮสต์โดย GitHub เพื่อให้ Blacksmith matrix เข้าคิวได้เร็วขึ้น |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard ส่วนขยายที่น้ำหนักต่ำกว่า, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` และ `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard การทดสอบ Linux Node, shard การทดสอบ bundled plugin, shard ของ `check-additional`, `android`                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (ไวต่อ CPU มากพอที่ 8 vCPU มีต้นทุนมากกว่าสิ่งที่ประหยัดได้); build Docker ของ install-smoke (เวลาเข้าคิว 32-vCPU มีต้นทุนมากกว่าสิ่งที่ประหยัดได้)                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; fork จะ fallback ไปที่ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; fork จะ fallback ไปที่ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

CI ของ canonical-repo คงให้ Blacksmith เป็นเส้นทาง runner เริ่มต้น ระหว่าง `preflight`, `scripts/ci-runner-labels.mjs` จะตรวจสอบ Actions runs ล่าสุดที่อยู่ในคิวและกำลังดำเนินการสำหรับงาน Blacksmith ที่อยู่ในคิว หาก label Blacksmith เฉพาะใดมีงานอยู่ในคิวอยู่แล้ว งาน downstream ที่จะใช้ label ตรงนั้นจะ fallback ไปยัง runner ที่โฮสต์โดย GitHub ที่ตรงกัน (`ubuntu-24.04`, `windows-2025` หรือ `macos-latest`) สำหรับการรันนั้นเท่านั้น ขนาด Blacksmith อื่นในตระกูล OS เดียวกันยังคงอยู่บน label หลักของตัวเอง หาก API probe ล้มเหลว จะไม่ใช้ fallback

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

`OpenClaw Performance` คือ workflow ประสิทธิภาพของ product/runtime โดยรันทุกวันบน `main` และสามารถ dispatch แบบแมนนวลได้:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

โดยปกติการ dispatch แบบแมนนวลจะ benchmark workflow ref ตั้งค่า `target_ref` เพื่อ benchmark release tag หรือ branch อื่นด้วย implementation ของ workflow ปัจจุบัน เส้นทางรายงานที่เผยแพร่และ pointer ล่าสุดจะผูกกับ ref ที่ทดสอบ และ `index.md` แต่ละไฟล์จะบันทึก ref/SHA ที่ทดสอบ, workflow ref/SHA, Kova ref, profile, โหมด lane auth, model, จำนวน repeat และ scenario filters

workflow จะติดตั้ง OCM จาก release ที่ pin ไว้ และ Kova จาก `openclaw/Kova` ที่อินพุต `kova_ref` ที่ pin ไว้ จากนั้นรันสาม lane:

- `mock-provider`: scenario วินิจฉัยของ Kova กับ runtime ที่ build ในเครื่องพร้อม auth ปลอมที่เข้ากันได้กับ OpenAI แบบกำหนดผลได้
- `mock-deep-profile`: การทำ profiling CPU/heap/trace สำหรับ hotspot ของ startup, Gateway และ agent-turn
- `live-gpt54`: agent turn ของ OpenAI `openai/gpt-5.4` จริง ข้ามเมื่อไม่มี `OPENAI_API_KEY`

lane mock-provider ยังรัน source probe แบบ native ของ OpenClaw หลังจาก Kova pass: เวลา boot และหน่วยความจำของ Gateway ในกรณี startup ค่าเริ่มต้น, hook และ 50-Plugin; loop hello ของ mock-OpenAI `channel-chat-baseline` ซ้ำ; และคำสั่ง startup ของ CLI กับ Gateway ที่ boot แล้ว สรุป Markdown ของ source probe อยู่ที่ `source/index.md` ใน report bundle พร้อม raw JSON อยู่ข้างกัน

ทุก lane อัปโหลด artifact ของ GitHub เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว workflow จะ commit `report.json`, `report.md`, bundle, `index.md` และ artifact ของ source-probe เข้าไปใน `openclaw/clawgrit-reports` ภายใต้ `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` ด้วย pointer ของ tested-ref ปัจจุบันจะถูกเขียนเป็น `openclaw-performance/<tested-ref>/latest-<lane>.json`

## Full Release Validation

`Full Release Validation` คือ workflow umbrella แบบแมนนวลสำหรับ "รันทุกอย่างก่อน release" โดยรับ branch, tag หรือ commit SHA แบบเต็ม dispatch workflow `CI` แบบแมนนวลด้วย target นั้น, dispatch `Plugin Prerelease` สำหรับหลักฐาน Plugin/package/static/Docker เฉพาะ release และ dispatch `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, การตรวจสอบ package ข้าม OS, QA Lab parity, Matrix และ lane ของ Telegram การรัน stable/default จะเก็บ coverage live/E2E แบบ exhaustive และ Docker release-path ไว้หลัง `run_release_soak=true`; `release_profile=full` จะบังคับเปิด coverage soak นั้น เพื่อให้การตรวจสอบ advisory ที่กว้างยังคงกว้างอยู่ เมื่อใช้ `rerun_group=all` และ `release_profile=full` จะรัน `NPM Telegram Beta E2E` กับ artifact `release-package-under-test` จาก release checks ด้วย หลังเผยแพร่แล้ว ให้ส่ง `npm_telegram_package_spec` เพื่อรัน lane package ของ Telegram เดิมซ้ำกับ package npm ที่เผยแพร่แล้ว

ดู [การตรวจสอบ release แบบเต็ม](/th/reference/full-release-validation) สำหรับ
stage matrix, ชื่องาน workflow ที่แน่นอน, ความแตกต่างของ profile, artifact และ
handle สำหรับ rerun แบบเจาะจง

`OpenClaw Release Publish` คือ workflow release แบบแมนนวลที่เปลี่ยนแปลงสถานะ Dispatch จาก `release/YYYY.M.D` หรือ `main` หลังจาก release tag มีอยู่แล้วและหลังจาก
OpenClaw npm preflight สำเร็จแล้ว โดยจะตรวจสอบ `pnpm plugins:sync:check`,
dispatch `Plugin NPM Release` สำหรับ package Plugin ทั้งหมดที่ publish ได้, dispatch
`Plugin ClawHub Release` สำหรับ release SHA เดียวกัน และหลังจากนั้นเท่านั้นจึง dispatch
`OpenClaw NPM Release` ด้วย `preflight_run_id` ที่บันทึกไว้

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

สำหรับหลักฐาน commit ที่ปักหมุดบน branch ที่เปลี่ยนเร็ว ให้ใช้ helper แทน
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

ref สำหรับ dispatch workflow ของ GitHub ต้องเป็น branch หรือ tag ไม่ใช่ commit SHA ดิบ
helper จะ push branch ชั่วคราว `release-ci/<sha>-...` ที่ SHA เป้าหมาย,
dispatch `Full Release Validation` จาก ref ที่ปักหมุดนั้น, ตรวจสอบว่า
`headSha` ของ workflow ลูกทุกตัวตรงกับเป้าหมาย และลบ branch ชั่วคราวเมื่อ
run เสร็จ ตัวตรวจสอบ umbrella จะล้มเหลวด้วยถ้า workflow ลูกใดๆ run ที่
SHA อื่น

`release_profile` ควบคุมความครอบคลุม live/provider ที่ส่งเข้า release checks
workflow release แบบ manual มีค่าเริ่มต้นเป็น `stable`; ใช้ `full` เฉพาะเมื่อคุณ
ตั้งใจต้องการ matrix provider/media เชิง advisory ที่กว้าง `run_release_soak`
ควบคุมว่า release checks แบบ stable/default จะ run live/E2E แบบละเอียดและ
soak เส้นทาง Docker release แบบครบถ้วนหรือไม่; `full` จะบังคับเปิด soak

- `minimum` คง lane ที่เร็วที่สุดและสำคัญต่อ release ของ OpenAI/core
- `stable` เพิ่มชุด provider/backend แบบ stable
- `full` run matrix provider/media เชิง advisory ที่กว้าง

umbrella จะบันทึก run id ของ child ที่ dispatch แล้ว และ job สุดท้าย `Verify full validation` จะตรวจสอบข้อสรุปของ child run ปัจจุบันอีกครั้งและต่อท้ายตาราง job ที่ช้าที่สุดสำหรับ child run แต่ละตัว หาก child workflow ถูก rerun แล้วเขียว ให้ rerun เฉพาะ parent verifier job เพื่อ refresh ผลลัพธ์ umbrella และสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รองรับ `rerun_group` ใช้ `all` สำหรับ release candidate, `ci` สำหรับ child full CI ปกติเท่านั้น, `plugin-prerelease` สำหรับ child plugin prerelease เท่านั้น, `release-checks` สำหรับ child release ทุกตัว หรือ group ที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, หรือ `npm-telegram` บน umbrella วิธีนี้ทำให้การ rerun กล่อง release ที่ล้มเหลวถูกจำกัดขอบเขตหลังการแก้เฉพาะจุด สำหรับ lane cross-OS ที่ล้มเหลวเพียงหนึ่ง lane ให้รวม `rerun_group=cross-os` กับ `cross_os_suite_filter` เช่น `windows/packaged-upgrade`; คำสั่ง cross-OS ที่ใช้เวลานานจะปล่อยบรรทัด Heartbeat และสรุป packaged-upgrade จะรวม timing ราย phase lane QA release-check เป็น advisory ดังนั้นความล้มเหลวเฉพาะ QA จะเตือนแต่ไม่ block release-check verifier

`OpenClaw Release Checks` ใช้ workflow ref ที่เชื่อถือได้เพื่อ resolve ref ที่เลือกหนึ่งครั้งเป็น tarball `release-package-under-test` จากนั้นส่ง artifact นั้นไปยัง cross-OS checks และ Package Acceptance รวมถึง workflow Docker สำหรับเส้นทาง release แบบ live/E2E เมื่อมีการ run soak coverage วิธีนี้ทำให้ bytes ของ package สอดคล้องกันในกล่อง release ต่างๆ และหลีกเลี่ยงการ pack candidate เดียวกันซ้ำใน child job หลายตัว

run `Full Release Validation` ที่ซ้ำกันสำหรับ `ref=main` และ `rerun_group=all`
จะแทนที่ umbrella เก่ากว่า parent monitor จะ cancel child workflow ใดๆ ที่
dispatch ไปแล้วเมื่อ parent ถูก cancel ดังนั้น validation บน main ที่ใหม่กว่า
จะไม่ต้องรออยู่หลัง release-check run เก่าสองชั่วโมง validation ของ release
branch/tag และ rerun group แบบโฟกัสยังคงใช้ `cancel-in-progress: false`

## shard ของ Live และ E2E

child live/E2E ของ release ยังคงครอบคลุม `pnpm test:live` แบบ native กว้าง แต่จะ run เป็น shard ที่มีชื่อผ่าน `scripts/test-live-shard.mjs` แทน job แบบ serial เดียว:

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
- shard media audio/video ที่แยก และ shard music ที่กรองตาม provider

วิธีนี้คง coverage ของไฟล์เดิมไว้ พร้อมทำให้ความล้มเหลวของ live provider ที่ช้า rerun และวินิจฉัยได้ง่ายขึ้น ชื่อ shard แบบ aggregate `native-live-extensions-o-z`, `native-live-extensions-media`, และ `native-live-extensions-media-music` ยังคงใช้ได้สำหรับการ rerun แบบ manual one-shot

shard native live media run ใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่ง build โดย workflow `Live Media Runner Image` image นี้ติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้า; job media ตรวจสอบเฉพาะ binary ก่อน setup ให้คง suite live ที่ใช้ Docker-backed ไว้บน runner Blacksmith ปกติ เพราะ container job ไม่เหมาะกับการ launch nested Docker tests

shard live model/backend ที่ใช้ Docker-backed ใช้ image shared แยกต่างหาก `ghcr.io/openclaw/openclaw-live-test:<sha>` ต่อ commit ที่เลือก workflow live release จะ build และ push image นั้นครั้งเดียว จากนั้น shard Docker live model, Gateway ที่แบ่งตาม provider, CLI backend, ACP bind และ Codex harness จะ run พร้อม `OPENCLAW_SKIP_DOCKER_BUILD=1` shard Gateway Docker มีค่า `timeout` ระดับ script ชัดเจนที่ต่ำกว่า timeout ของ workflow job เพื่อให้ container หรือ path cleanup ที่ค้างล้มเหลวเร็ว แทนที่จะกินงบเวลา release-check ทั้งหมด หาก shard เหล่านั้น rebuild Docker target ของ source ทั้งหมดแยกกัน แสดงว่า release run ตั้งค่าผิดและจะเสียเวลาจริงไปกับการ build image ซ้ำ

## Package Acceptance

ใช้ `Package Acceptance` เมื่อคำถามคือ "package OpenClaw ที่ติดตั้งได้นี้ใช้งานเป็น product ได้หรือไม่?" มันต่างจาก CI ปกติ: CI ปกติตรวจสอบ source tree ขณะที่ package acceptance ตรวจสอบ tarball เดียวผ่าน Docker E2E harness เดียวกับที่ผู้ใช้ใช้งานหลังติดตั้งหรืออัปเดต

### Job

1. `resolve_package` checkout `workflow_ref`, resolve candidate package หนึ่งตัว, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, upload ทั้งคู่เป็น artifact `package-under-test`, และพิมพ์ source, workflow ref, package ref, version, SHA-256, และ profile ใน GitHub step summary
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` workflow ที่ reuse ได้จะ download artifact นั้น, validate inventory ของ tarball, เตรียม Docker image แบบ package-digest เมื่อจำเป็น และ run lane Docker ที่เลือกกับ package นั้นแทนการ pack workflow checkout เมื่อ profile เลือก `docker_lanes` แบบ targeted หลายตัว workflow ที่ reuse ได้จะเตรียม package และ shared image เพียงครั้งเดียว จากนั้น fan out lane เหล่านั้นเป็น targeted Docker job แบบ parallel พร้อม artifact ที่ไม่ซ้ำกัน
3. `package_telegram` เรียก `NPM Telegram Beta E2E` แบบ optional มันจะ run เมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้ง artifact `package-under-test` เดียวกันเมื่อ Package Acceptance resolve ไว้แล้ว; dispatch Telegram แบบ standalone ยังสามารถติดตั้ง published npm spec ได้
4. `summary` ทำให้ workflow ล้มเหลวหาก package resolution, Docker acceptance หรือ lane Telegram แบบ optional ล้มเหลว

### แหล่งที่มาของ candidate

- `source=npm` รับเฉพาะ `openclaw@beta`, `openclaw@latest` หรือ release version ของ OpenClaw แบบ exact เช่น `openclaw@2026.4.27-beta.2` ใช้สิ่งนี้สำหรับ acceptance ของ prerelease/stable ที่ publish แล้ว
- `source=ref` pack branch, tag หรือ commit SHA แบบเต็มของ `package_ref` ที่เชื่อถือได้ resolver จะ fetch branch/tag ของ OpenClaw, ตรวจสอบว่า commit ที่เลือก reachable จากประวัติ branch ของ repository หรือ release tag, ติดตั้ง deps ใน detached worktree และ pack ด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` download `.tgz` ผ่าน HTTPS; ต้องมี `package_sha256`
- `source=artifact` download `.tgz` หนึ่งไฟล์จาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็น optional แต่ควรระบุสำหรับ artifact ที่แชร์ภายนอก

แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือ workflow/harness code ที่เชื่อถือได้ซึ่ง run test `package_ref` คือ source commit ที่จะถูก pack เมื่อ `source=ref` วิธีนี้ทำให้ test harness ปัจจุบันตรวจสอบ source commit เก่าที่เชื่อถือได้โดยไม่ต้อง run workflow logic เก่า

### Suite profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` บวก `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — chunk เส้นทาง Docker release แบบเต็มพร้อม OpenWebUI
- `custom` — `docker_lanes` แบบ exact; จำเป็นเมื่อ `suite_profile=custom`

profile `package` ใช้ coverage ของ Plugin แบบ offline เพื่อให้ validation ของ package ที่ publish แล้วไม่ถูก gate ด้วย availability ของ ClawHub แบบ live lane Telegram แบบ optional reuse artifact `package-under-test` ใน `NPM Telegram Beta E2E` โดยยังคง path published npm spec สำหรับ dispatch แบบ standalone

สำหรับนโยบายการทดสอบ update และ Plugin โดยเฉพาะ รวมถึงคำสั่ง local,
lane Docker, input ของ Package Acceptance, ค่าเริ่มต้นของ release และการ triage ความล้มเหลว,
ดู [การทดสอบ update และ Plugin](/th/help/testing-updates-plugins)

release checks เรียก Package Acceptance ด้วย `source=artifact`, artifact package release ที่เตรียมไว้, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, และ `telegram_mode=mock-openai` วิธีนี้ทำให้หลักฐานการ migration package, update, cleanup dependency ของ Plugin ที่ stale, การซ่อมการติดตั้ง Plugin ที่ configure ไว้, Plugin แบบ offline, plugin-update และ Telegram อยู่บน tarball package ที่ resolve เดียวกัน ตั้งค่า `package_acceptance_package_spec` บน Full Release Validation หรือ OpenClaw Release Checks เพื่อ run matrix เดียวกันกับ package npm ที่ shipped แล้วแทน artifact ที่ build จาก SHA cross-OS release checks ยังคงครอบคลุม onboarding, installer และพฤติกรรม platform เฉพาะ OS; validation ของ product package/update ควรเริ่มจาก Package Acceptance lane Docker `published-upgrade-survivor` ตรวจสอบ baseline package ที่ publish แล้วหนึ่งตัวต่อ run ในเส้นทาง release ที่ blocking ใน Package Acceptance tarball `package-under-test` ที่ resolve แล้วจะเป็น candidate เสมอ และ `published_upgrade_survivor_baseline` เลือก fallback published baseline โดยมีค่าเริ่มต้นเป็น `openclaw@latest`; คำสั่ง rerun ของ lane ที่ล้มเหลวจะรักษา baseline นั้นไว้ Full Release Validation ที่มี `run_release_soak=true` หรือ `release_profile=full` ตั้งค่า `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` และ `published_upgrade_survivor_scenarios=reported-issues` เพื่อขยายไปยัง release npm stable ล่าสุดสี่ตัว รวมถึง release boundary ที่ปักหมุดสำหรับความเข้ากันได้ของ Plugin และ fixture รูปแบบ issue สำหรับ config Feishu, ไฟล์ bootstrap/persona ที่เก็บรักษาไว้, การติดตั้ง OpenClaw Plugin ที่ configure ไว้, path log แบบ tilde และ root dependency Plugin legacy ที่ stale การเลือก published-upgrade survivor หลาย baseline จะถูก shard ตาม baseline เป็น targeted Docker runner job แยกกัน workflow `Update Migration` แยกต่างหากใช้ lane Docker `update-migration` พร้อม `all-since-2026.4.23` และ `plugin-deps-cleanup` เมื่อคำถามคือ cleanup การ update ที่ publish แล้วแบบ exhaustive ไม่ใช่ breadth ของ Full Release CI ปกติ run aggregate แบบ local สามารถส่ง spec package แบบ exact ด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, คง lane เดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` เช่น `openclaw@2026.4.15` หรือ set `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` สำหรับ scenario matrix lane ที่ publish แล้ว configure baseline ด้วย recipe คำสั่ง `openclaw config set` แบบ baked, บันทึกขั้นตอน recipe ใน `summary.json`, และ probe `/healthz`, `/readyz` รวมถึงสถานะ RPC หลัง Gateway start lane Windows packaged และ installer fresh ยังตรวจสอบด้วยว่า package ที่ติดตั้งแล้วสามารถ import browser-control override จาก raw absolute Windows path ได้ smoke agent-turn แบบ cross-OS ของ OpenAI มีค่าเริ่มต้นเป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อ set ไว้ มิฉะนั้นเป็น `openai/gpt-5.4` ดังนั้นหลักฐาน install และ Gateway จะยังอยู่บน test model GPT-5 พร้อมหลีกเลี่ยงค่าเริ่มต้น GPT-4.x

### หน้าต่างความเข้ากันได้แบบ legacy

Package Acceptance มีช่วงเวลาความเข้ากันได้แบบเดิมที่มีขอบเขตสำหรับแพ็กเกจที่เผยแพร่ไปแล้ว แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้เส้นทางความเข้ากันได้ได้:

- รายการ QA ส่วนตัวที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ถูกละเว้นจาก tarball;
- `doctor-switch` อาจข้ามกรณีย่อยการคงอยู่ของ `gateway install --wrapper` เมื่อแพ็กเกจไม่เปิดเผยแฟล็กนั้น;
- `update-channel-switch` อาจตัด `pnpm.patchedDependencies` ที่หายไปออกจาก fake git fixture ที่ได้จาก tarball และอาจบันทึก `update.channel` ที่คงอยู่ไว้แต่หายไป;
- smoke ของ Plugin อาจอ่านตำแหน่ง install-record แบบเดิม หรือยอมรับการคงอยู่ของ marketplace install-record ที่หายไป;
- `plugin-update` อาจอนุญาตการย้ายข้อมูลเมตาของคอนฟิก โดยยังคงกำหนดให้ install record และพฤติกรรมไม่ติดตั้งซ้ำต้องไม่เปลี่ยนแปลง

แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ stamp เมตาดาต้าบิลด์ในเครื่องที่เคยถูกจัดส่งไปแล้วด้วย แพ็กเกจหลังจากนั้นต้องเป็นไปตามสัญญาสมัยใหม่ เงื่อนไขเดียวกันจะล้มเหลวแทนที่จะเตือนหรือข้าม

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

เมื่อดีบักการรัน package acceptance ที่ล้มเหลว ให้เริ่มที่สรุป `resolve_package` เพื่อยืนยันแหล่งที่มาของแพ็กเกจ เวอร์ชัน และ SHA-256 จากนั้นตรวจสอบ child run `docker_acceptance` และอาร์ติแฟกต์ Docker ของรันนั้น: `.artifacts/docker-tests/**/summary.json`, `failures.json`, บันทึกของเลน, เวลาแต่ละเฟส และคำสั่งรันซ้ำ ควรรันโปรไฟล์แพ็กเกจที่ล้มเหลวหรือเลน Docker ที่ตรงกันซ้ำ แทนการรัน full release validation ทั้งหมดซ้ำ

## การทดสอบ smoke การติดตั้ง

เวิร์กโฟลว์ `Install Smoke` แยกต่างหากใช้สคริปต์ขอบเขตเดียวกันซ้ำผ่านงาน `preflight` ของตัวเอง โดยแบ่งความครอบคลุมของ smoke เป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **เส้นทางเร็ว** รันสำหรับ pull request ที่แตะพื้นผิว Docker/แพ็กเกจ, การเปลี่ยนแปลงแพ็กเกจ/manifest ของ Plugin ที่รวมมา, หรือพื้นผิวหลักของ Plugin/channel/gateway/Plugin SDK ที่งาน Docker smoke ใช้งาน การเปลี่ยนแปลงเฉพาะซอร์สของ Plugin ที่รวมมา, การแก้ไขเฉพาะการทดสอบ และการแก้ไขเฉพาะเอกสารจะไม่จอง Docker worker เส้นทางเร็วจะสร้างอิมเมจ Dockerfile รากหนึ่งครั้ง ตรวจสอบ CLI รัน smoke ของ CLI สำหรับการลบ agents shared-workspace รัน e2e ของ container gateway-network ตรวจสอบ build arg ของ extension ที่รวมมา และรันโปรไฟล์ Docker ของ bundled-plugin แบบมีขอบเขตภายใต้ timeout คำสั่งรวม 240 วินาที โดยแต่ละสถานการณ์จำกัดเวลาการรัน Docker แยกกัน
- **เส้นทางเต็ม** เก็บความครอบคลุมการติดตั้งแพ็กเกจ QR และ Docker/update ของตัวติดตั้งไว้สำหรับการรันตามกำหนดเวลากลางคืน, การสั่งรันด้วยตนเอง, การตรวจ release แบบ workflow-call และ pull request ที่แตะพื้นผิว installer/package/Docker จริง ๆ ในโหมดเต็ม install-smoke จะเตรียมหรือใช้ซ้ำอิมเมจ GHCR root Dockerfile smoke ของ target-SHA หนึ่งอิมเมจ จากนั้นรันการติดตั้งแพ็กเกจ QR, smoke ของ root Dockerfile/gateway, smoke ของ installer/update และ Docker E2E ของ bundled-plugin แบบเร็วเป็นงานแยกกัน เพื่อให้งานตัวติดตั้งไม่ต้องรอหลัง smoke ของอิมเมจราก

การ push ไปยัง `main` รวมถึง merge commit ไม่บังคับใช้เส้นทางเต็ม เมื่อ logic changed-scope ขอความครอบคลุมเต็มในการ push เวิร์กโฟลว์จะคง Docker smoke แบบเร็วไว้ และปล่อย full install smoke ให้กับการรันกลางคืนหรือ release validation

smoke ของ image-provider สำหรับการติดตั้ง Bun แบบ global ที่ช้าถูก gate แยกด้วย `run_bun_global_install_smoke` โดยรันตามกำหนดเวลากลางคืนและจากเวิร์กโฟลว์ release checks และการสั่งรัน `Install Smoke` ด้วยตนเองสามารถเลือกเปิดใช้ได้ แต่ pull request และการ push ไปยัง `main` จะไม่รัน การทดสอบ Docker สำหรับ QR และ installer ยังคงมี Dockerfile ที่เน้นการติดตั้งของตัวเอง

## Docker E2E ในเครื่อง

`pnpm test:docker:all` สร้างอิมเมจ live-test ที่ใช้ร่วมกันล่วงหน้าหนึ่งอิมเมจ แพ็ก OpenClaw หนึ่งครั้งเป็น npm tarball และสร้างอิมเมจ `scripts/e2e/Dockerfile` ที่ใช้ร่วมกันสองแบบ:

- runner Node/Git เปล่าสำหรับเลน installer/update/plugin-dependency;
- อิมเมจฟังก์ชันที่ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับเลนฟังก์ชันปกติ

นิยามเลน Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs` และ runner จะรันเฉพาะแผนที่เลือกเท่านั้น scheduler เลือกอิมเมจต่อเลนด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` จากนั้นรันเลนด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### ค่าที่ปรับได้

| ตัวแปร                                 | ค่าเริ่มต้น | วัตถุประสงค์                                                                                  |
| -------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10          | จำนวนสล็อต main-pool สำหรับเลนปกติ                                                           |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10          | จำนวนสล็อต tail-pool ที่อ่อนไหวต่อ provider                                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9           | เพดานเลน live พร้อมกันเพื่อไม่ให้ provider throttle                                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10          | เพดานเลนติดตั้ง npm พร้อมกัน                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7           | เพดานเลนหลายบริการพร้อมกัน                                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000        | หน่วงระหว่างการเริ่มเลนเพื่อหลีกเลี่ยง create storm ของ Docker daemon; ตั้ง `0` หากไม่ต้องหน่วง |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000     | timeout สำรองต่อเลน (120 นาที); เลน live/tail ที่เลือกใช้เพดานที่เข้มกว่า                     |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | ไม่ได้ตั้งค่า | `1` พิมพ์แผน scheduler โดยไม่รันเลน                                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | ไม่ได้ตั้งค่า | รายการเลนตรงตัวคั่นด้วยจุลภาค; ข้าม cleanup smoke เพื่อให้ agents ทำซ้ำเลนที่ล้มเหลวหนึ่งเลนได้ |

เลนที่หนักกว่าเพดานที่มีผลยังคงเริ่มจาก pool ว่างได้ จากนั้นรันเดี่ยวจนกว่าจะปล่อย capacity aggregate preflight ในเครื่องจะตรวจ Docker, ลบคอนเทนเนอร์ OpenClaw E2E ที่ค้าง, ส่งสถานะเลนที่ใช้งานอยู่, คงเวลาเลนไว้สำหรับการเรียงลำดับแบบยาวที่สุดก่อน และตามค่าเริ่มต้นจะหยุดจัดตารางเลน pooled ใหม่หลังเกิดความล้มเหลวครั้งแรก

### เวิร์กโฟลว์ live/E2E ที่ใช้ซ้ำได้

เวิร์กโฟลว์ live/E2E ที่ใช้ซ้ำได้จะถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องใช้แพ็กเกจ ชนิดอิมเมจ อิมเมจ live เลน และความครอบคลุมของ credential ใด จากนั้น `scripts/docker-e2e.mjs` จะแปลงแผนนั้นเป็น GitHub outputs และสรุป โดยจะ pack OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลดอาร์ติแฟกต์แพ็กเกจของรันปัจจุบัน หรือดาวน์โหลดอาร์ติแฟกต์แพ็กเกจจาก `package_artifact_run_id`; ตรวจสอบ inventory ของ tarball; สร้างและ push อิมเมจ GHCR Docker E2E แบบ bare/functional ที่ติดแท็กด้วย package digest ผ่าน Docker layer cache ของ Blacksmith เมื่อแผนต้องใช้เลนที่ติดตั้งแพ็กเกจ; และใช้ input `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรืออิมเมจที่มี package digest อยู่แล้วแทนการสร้างใหม่ การ pull อิมเมจ Docker จะ retry พร้อม timeout ต่อครั้งแบบมีขอบเขต 180 วินาที เพื่อให้ registry/cache stream ที่ค้าง retry ได้เร็วแทนที่จะกินเวลาส่วนใหญ่ของ critical path ใน CI

### ชังก์ของเส้นทาง release

ความครอบคลุม Docker ของ release รันเป็นงานแบบชังก์เล็กลงด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละชังก์ pull เฉพาะชนิดอิมเมจที่ต้องใช้และรันหลายเลนผ่าน scheduler แบบ weighted เดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

ชังก์ Docker ของ release ปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` และ `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` ส่วน `plugins-runtime-core`, `plugins-runtime` และ `plugins-integrations` ยังคงเป็น alias รวมของ Plugin/runtime alias เลน `install-e2e` ยังคงเป็น alias รันซ้ำด้วยตนเองแบบรวมสำหรับเลน provider installer ทั้งสอง

OpenWebUI ถูกพับเข้าใน `plugins-runtime-services` เมื่อความครอบคลุม release-path แบบเต็มร้องขอ และคงชังก์ `openwebui` แบบ standalone ไว้เฉพาะสำหรับการสั่งรันที่มีเฉพาะ OpenWebUI เท่านั้น เลนอัปเดต bundled-channel จะ retry หนึ่งครั้งสำหรับความล้มเหลวเครือข่าย npm ชั่วคราว

แต่ละชังก์อัปโหลด `.artifacts/docker-tests/` พร้อมบันทึกเลน, timings, `summary.json`, `failures.json`, phase timings, JSON ของแผน scheduler, ตาราง slow-lane และคำสั่งรันซ้ำต่อเลน input `docker_lanes` ของเวิร์กโฟลว์จะรันเลนที่เลือกกับอิมเมจที่เตรียมไว้แทนงานชังก์ ซึ่งจำกัดการดีบักเลนที่ล้มเหลวไว้ที่งาน Docker เป้าหมายหนึ่งงาน และเตรียม ดาวน์โหลด หรือใช้ซ้ำอาร์ติแฟกต์แพ็กเกจสำหรับรันนั้น หากเลนที่เลือกเป็นเลน Docker แบบ live งานเป้าหมายจะสร้างอิมเมจ live-test ในเครื่องสำหรับการรันซ้ำนั้น คำสั่ง GitHub rerun ต่อเลนที่สร้างขึ้นจะรวม `package_artifact_run_id`, `package_artifact_name` และ input อิมเมจที่เตรียมไว้เมื่อมีค่าเหล่านั้น เพื่อให้เลนที่ล้มเหลวสามารถใช้แพ็กเกจและอิมเมจตรงชุดจากรันที่ล้มเหลวซ้ำได้

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

เวิร์กโฟลว์ live/E2E ตามกำหนดเวลาจะรันชุด Docker release-path แบบเต็มทุกวัน

## ก่อนเผยแพร่ Plugin

`Plugin Prerelease` เป็นความครอบคลุมระดับ product/package ที่มีค่าใช้จ่ายมากกว่า จึงเป็นเวิร์กโฟลว์แยกที่ถูกสั่งรันโดย `Full Release Validation` หรือโดยผู้ปฏิบัติงานอย่างชัดเจน pull request ปกติ, การ push ไปยัง `main` และการสั่งรัน CI แบบ standalone ด้วยตนเองจะปิดชุดทดสอบนี้ไว้ ชุดนี้กระจายการทดสอบ Plugin ที่รวมมาไปยัง worker extension แปดตัว งาน shard ของ extension เหล่านั้นรันกลุ่มคอนฟิก Plugin ได้ครั้งละสูงสุดสองกลุ่ม โดยใช้ Vitest worker หนึ่งตัวต่อกลุ่มและ Node heap ที่ใหญ่ขึ้น เพื่อให้ batch ของ Plugin ที่ import หนักไม่สร้างงาน CI เพิ่ม เส้นทาง Docker prerelease เฉพาะ release จะจัดกลุ่มเลน Docker เป้าหมายเป็นกลุ่มเล็กเพื่อหลีกเลี่ยงการจอง runner หลายสิบตัวสำหรับงานหนึ่งถึงสามนาที

## QA Lab

QA Lab มีเลน CI เฉพาะอยู่นอกเวิร์กโฟลว์หลักแบบ smart-scoped Agentic parity ถูกซ้อนอยู่ใต้ harness QA และ release แบบกว้าง ไม่ใช่เวิร์กโฟลว์ PR แบบ standalone ใช้ `Full Release Validation` พร้อม `rerun_group=qa-parity` เมื่อ parity ควรไปพร้อมกับการรัน validation แบบกว้าง

- เวิร์กโฟลว์ `QA-Lab - All Lanes` รันทุกคืนบน `main` และเมื่อสั่งรันด้วยตนเอง โดย fan out เลน mock parity, เลน live Matrix และเลน live Telegram กับ Discord เป็นงานแบบขนาน งาน live ใช้ environment `qa-live-shared` และ Telegram/Discord ใช้ Convex leases

การตรวจสอบรุ่นเผยแพร่จะรันเลนทรานสปอร์ตแบบสดของ Matrix และ Telegram ด้วยผู้ให้บริการจำลองแบบกำหนดผลลัพธ์ได้และโมเดลที่ระบุว่าเป็น mock (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อแยกสัญญาของช่องทางออกจากความหน่วงของโมเดลสดและการเริ่มต้น Plugin ผู้ให้บริการตามปกติ Gateway ทรานสปอร์ตสดจะปิดใช้งานการค้นหาหน่วยความจำ เพราะความเท่าเทียมของ QA ครอบคลุมพฤติกรรมหน่วยความจำแยกต่างหากแล้ว ส่วนการเชื่อมต่อผู้ให้บริการครอบคลุมโดยชุดทดสอบโมเดลสด ผู้ให้บริการเนทีฟ และผู้ให้บริการ Docker แยกต่างหาก

Matrix ใช้ `--profile fast` สำหรับเกตตามกำหนดเวลาและเกตรุ่นเผยแพร่ โดยเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout รองรับ ค่าเริ่มต้นของ CLI และอินพุตเวิร์กโฟลว์แบบแมนนวลยังคงเป็น `all`; การ dispatch แบบแมนนวลด้วย `matrix_profile=all` จะแบ่งชาร์ดความครอบคลุม Matrix เต็มรูปแบบเป็นงาน `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรันเลน QA Lab ที่สำคัญต่อการเผยแพร่ก่อนอนุมัติรุ่นเผยแพร่ด้วย; เกตความเท่าเทียม QA จะรันแพ็ก candidate และ baseline เป็นงานเลนแบบขนาน จากนั้นดาวน์โหลด artifact ทั้งสองลงในงานรายงานขนาดเล็กสำหรับการเปรียบเทียบความเท่าเทียมขั้นสุดท้าย

สำหรับ PR ปกติ ให้ใช้หลักฐาน CI/การตรวจสอบตามขอบเขตแทนการถือว่าความเท่าเทียมเป็นสถานะที่จำเป็น

## CodeQL

เวิร์กโฟลว์ `CodeQL` ตั้งใจให้เป็นตัวสแกนความปลอดภัยรอบแรกแบบขอบเขตแคบ ไม่ใช่การกวาดตรวจทั้งคลังโค้ด การรันแบบรายวัน แบบแมนนวล และ guard สำหรับ pull request ที่ไม่ใช่ draft จะสแกนโค้ดเวิร์กโฟลว์ Actions พร้อมพื้นผิว JavaScript/TypeScript ที่มีความเสี่ยงสูงที่สุด ด้วยคิวรีความปลอดภัยความเชื่อมั่นสูงที่กรองเฉพาะ `security-severity` ระดับสูง/วิกฤต

Guard สำหรับ pull request ยังคงเบา: จะเริ่มเฉพาะเมื่อมีการเปลี่ยนแปลงภายใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, หรือ `src` และจะรันเมทริกซ์ความปลอดภัยความเชื่อมั่นสูงชุดเดียวกับเวิร์กโฟลว์ตามกำหนดเวลา CodeQL ของ Android และ macOS ไม่รวมอยู่ในค่าเริ่มต้นของ PR

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                          | พื้นผิว                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron และ baseline ของ Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการใช้งานช่องทางหลัก รวมถึง runtime ของ Plugin ช่องทาง, Gateway, Plugin SDK, secrets และจุดสัมผัส audit              |
| `/codeql-security-high/network-ssrf-boundary`     | พื้นผิว core SSRF, การแยกวิเคราะห์ IP, network guard, web-fetch และนโยบาย SSRF ของ Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | เซิร์ฟเวอร์ MCP, helper สำหรับการดำเนินการ process, การส่งออกภายนอก และเกตการดำเนินการเครื่องมือของ agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | พื้นผิวความเชื่อถือของการติดตั้ง Plugin, loader, manifest, registry, การติดตั้ง package-manager, source-loading และสัญญาแพ็กเกจ Plugin SDK |

### ชาร์ดความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — ชาร์ดความปลอดภัย Android ตามกำหนดเวลา สร้างแอป Android แบบแมนนวลสำหรับ CodeQL บน runner Blacksmith Linux ที่เล็กที่สุดที่ workflow sanity ยอมรับ อัปโหลดภายใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — ชาร์ดความปลอดภัย macOS รายสัปดาห์/แบบแมนนวล สร้างแอป macOS แบบแมนนวลสำหรับ CodeQL บน Blacksmith macOS, กรองผลลัพธ์ build ของ dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดภายใต้ `/codeql-critical-security/macos` เก็บไว้นอกค่าเริ่มต้นรายวันเพราะ build ของ macOS ใช้เวลาหลักของ runtime แม้เมื่อไม่มีปัญหา

### หมวดหมู่คุณภาพวิกฤต

`CodeQL Critical Quality` คือชาร์ดที่ตรงกันในฝั่งที่ไม่ใช่ความปลอดภัย โดยรันเฉพาะคิวรีคุณภาพ JavaScript/TypeScript ที่มี `severity` เป็น error และไม่ใช่ด้านความปลอดภัยบนพื้นผิวมูลค่าสูงแบบขอบเขตแคบบน runner Blacksmith Linux ขนาดเล็กกว่า Guard สำหรับ pull request ของมันตั้งใจให้เล็กกว่าโปรไฟล์ตามกำหนดเวลา: PR ที่ไม่ใช่ draft จะรันเฉพาะชาร์ด `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, และ `plugin-sdk-reply-runtime` ที่ตรงกัน สำหรับการเปลี่ยนแปลงโค้ดดำเนินการคำสั่ง/โมเดล/เครื่องมือของ agent และการ dispatch การตอบกลับ, โค้ด schema/migration/IO ของ config, โค้ด auth/secrets/sandbox/security, runtime ของช่องทางหลักและ Plugin ช่องทางที่ bundled, protocol/server-method ของ Gateway, runtime หน่วยความจำ/กาว SDK, MCP/process/การส่งออกภายนอก, แค็ตตาล็อก runtime/model ของผู้ให้บริการ, diagnostics ของ session/คิวการส่ง, loader ของ Plugin, สัญญา Plugin SDK/package-contract หรือ runtime การตอบกลับของ Plugin SDK การเปลี่ยนแปลง config ของ CodeQL และเวิร์กโฟลว์คุณภาพจะรันชาร์ดคุณภาพ PR ทั้งสิบสองชาร์ด

การ dispatch แบบแมนนวลรับค่า:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

โปรไฟล์แบบแคบเป็น hook สำหรับสอน/วนรอบการพัฒนา เพื่อรันชาร์ดคุณภาพหนึ่งชาร์ดแบบแยกเดี่ยว

| หมวดหมู่                                                | พื้นผิว                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ด Auth, secrets, sandbox, cron และขอบเขตความปลอดภัยของ Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | สัญญาของ schema, migration, normalization และ IO ของ config                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schema ของ protocol Gateway และสัญญา method ของเซิร์ฟเวอร์                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญาการใช้งานช่องทางหลักและ Plugin ช่องทางที่ bundled                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | สัญญา runtime ของการดำเนินการคำสั่ง, การ dispatch โมเดล/ผู้ให้บริการ, การ dispatch และคิว auto-reply และ control-plane ของ ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | เซิร์ฟเวอร์ MCP และ tool bridge, helper สำหรับการควบคุม process และสัญญาการส่งออกภายนอก                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK โฮสต์หน่วยความจำ, facade ของ runtime หน่วยความจำ, alias Plugin SDK ของหน่วยความจำ, กาวการเปิดใช้งาน runtime หน่วยความจำ และคำสั่ง doctor ของหน่วยความจำ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | ส่วนภายในของคิวตอบกลับ, คิวการส่งของ session, helper สำหรับการ binding/การส่ง session ออกภายนอก, พื้นผิว bundle เหตุการณ์/บันทึก diagnostic และสัญญา CLI ของ session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | การ dispatch การตอบกลับขาเข้าของ Plugin SDK, helper สำหรับ payload/chunking/runtime ของการตอบกลับ, ตัวเลือกการตอบกลับของช่องทาง, คิวการส่ง และ helper สำหรับการ binding session/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | การ normalize แค็ตตาล็อกโมเดล, auth และ discovery ของผู้ให้บริการ, การลงทะเบียน runtime ของผู้ให้บริการ, ค่าเริ่มต้น/แค็ตตาล็อกของผู้ให้บริการ และ registry สำหรับ web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | การ bootstrap Control UI, persistence ภายในเครื่อง, flow การควบคุม Gateway และสัญญา runtime ของ control-plane ของงาน                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | สัญญา runtime ของ core web fetch/search, media IO, media understanding, image-generation และ media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | สัญญาของ Loader, registry, public-surface และ entrypoint ของ Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | ซอร์ส Plugin SDK ฝั่งแพ็กเกจที่เผยแพร่แล้วและ helper สำหรับสัญญาแพ็กเกจ Plugin                                                                                      |

คุณภาพแยกจากความปลอดภัย เพื่อให้สามารถจัดกำหนดเวลา วัดผล ปิดใช้งาน หรือขยายผลการค้นพบด้านคุณภาพได้โดยไม่บดบังสัญญาณความปลอดภัย การขยาย CodeQL สำหรับ Swift, Python และ bundled-plugin ควรเพิ่มกลับมาเป็นงาน follow-up แบบมีขอบเขตหรือแบ่งชาร์ดเท่านั้น หลังจากโปรไฟล์แบบแคบมี runtime และสัญญาณที่เสถียรแล้ว

## เวิร์กโฟลว์การบำรุงรักษา

### Docs Agent

เวิร์กโฟลว์ `Docs Agent` เป็นเลนบำรุงรักษา Codex ที่ขับเคลื่อนด้วยเหตุการณ์สำหรับทำให้เอกสารที่มีอยู่สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง land แล้ว มันไม่มี schedule ล้วน: การรัน CI ของ push ที่สำเร็จและไม่ใช่ bot บน `main` สามารถ trigger ได้ และการ dispatch แบบแมนนวลสามารถรันได้โดยตรง การเรียกจาก workflow-run จะข้ามเมื่อ `main` เคลื่อนไปแล้ว หรือเมื่อมีการรัน Docs Agent อื่นที่ไม่ถูกข้ามถูกสร้างขึ้นในชั่วโมงที่ผ่านมา เมื่อรัน มันจะตรวจทานช่วง commit จาก SHA ต้นทางของ Docs Agent ที่ไม่ถูกข้ามก่อนหน้าไปจนถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงหนึ่งครั้งสามารถครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมตั้งแต่รอบตรวจเอกสารครั้งล่าสุดได้

### Test Performance Agent

เวิร์กโฟลว์ `Test Performance Agent` เป็นเลนบำรุงรักษา Codex ที่ขับเคลื่อนด้วยเหตุการณ์สำหรับการทดสอบที่ช้า มันไม่มี schedule ล้วน: การรัน CI ของ push ที่สำเร็จและไม่ใช่ bot บน `main` สามารถ trigger ได้ แต่จะข้ามหากการเรียกจาก workflow-run อื่นเคยรันแล้วหรือกำลังรันอยู่ในวัน UTC นั้น การ dispatch แบบแมนนวลจะข้ามเกตกิจกรรมรายวันนั้น เลนนี้จะสร้างรายงานประสิทธิภาพ Vitest แบบจัดกลุ่มของทั้งชุด ให้ Codex ทำเฉพาะการแก้ไขประสิทธิภาพการทดสอบขนาดเล็กที่ยังรักษาความครอบคลุมไว้ แทนการ refactor กว้าง จากนั้นรันรายงานทั้งชุดซ้ำ และปฏิเสธการเปลี่ยนแปลงที่ลดจำนวน baseline ของการทดสอบที่ผ่าน หาก baseline มีการทดสอบที่ล้มเหลว Codex อาจแก้เฉพาะความล้มเหลวที่ชัดเจน และรายงานทั้งชุดหลัง agent ต้องผ่านก่อนจะ commit อะไร เมื่อ `main` เดินหน้าไปก่อนที่ bot push จะ land เลนนี้จะ rebase patch ที่ตรวจสอบแล้ว รัน `pnpm check:changed` ซ้ำ และลอง push ใหม่; patch ที่ล้าสมัยและมี conflict จะถูกข้าม มันใช้ GitHub-hosted Ubuntu เพื่อให้ action ของ Codex รักษาท่าทีความปลอดภัยแบบ drop-sudo เดียวกับ docs agent ได้

### PR ซ้ำหลัง Merge

เวิร์กโฟลว์ `Duplicate PRs After Merge` เป็นเวิร์กโฟลว์ maintainer แบบแมนนวลสำหรับการล้างรายการซ้ำหลัง land ค่าเริ่มต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุไว้อย่างชัดเจนเมื่อ `apply=true` ก่อนแก้ไข GitHub มันตรวจสอบว่า PR ที่ land แล้วถูก merge แล้ว และ PR ซ้ำแต่ละรายการมี issue ที่อ้างอิงร่วมกันหรือ hunk ที่เปลี่ยนแปลงทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## เกตตรวจสอบภายในเครื่องและการกำหนดเส้นทางการเปลี่ยนแปลง

ตรรกะ changed-lane ภายในเครื่องอยู่ใน `scripts/changed-lanes.mjs` และถูกดำเนินการโดย `scripts/check-changed.mjs` เกตตรวจสอบภายในเครื่องนั้นเข้มงวดกว่าเกี่ยวกับขอบเขตสถาปัตยกรรมเมื่อเทียบกับขอบเขตแพลตฟอร์ม CI แบบกว้าง:

- การเปลี่ยนแปลงในโค้ดโปรดักชันของคอร์จะรัน typecheck ของ core prod และ core test รวมถึง lint/guards ของคอร์;
- การเปลี่ยนแปลงเฉพาะการทดสอบของคอร์จะรันเฉพาะ typecheck ของ core test รวมถึง lint ของคอร์;
- การเปลี่ยนแปลงในโค้ดโปรดักชันของส่วนขยายจะรัน typecheck ของ extension prod และ extension test รวมถึง lint ของส่วนขยาย;
- การเปลี่ยนแปลงเฉพาะการทดสอบของส่วนขยายจะรัน typecheck ของ extension test รวมถึง lint ของส่วนขยาย;
- การเปลี่ยนแปลง public Plugin SDK หรือ plugin-contract จะขยายไปยัง typecheck ของส่วนขยาย เพราะส่วนขยายพึ่งพาสัญญาคอร์เหล่านั้น (การกวาดตรวจส่วนขยายด้วย Vitest ยังคงเป็นงานทดสอบแบบชัดเจน);
- การเพิ่มเลขเวอร์ชันที่เปลี่ยนเฉพาะเมตาดาตารีลีสจะรันการตรวจเวอร์ชัน/config/root-dependency แบบเจาะจง;
- การเปลี่ยนแปลง root/config ที่ไม่ทราบขอบเขตจะเลือกเส้นทางปลอดภัยโดยรันทุก check lane

การกำหนดเส้นทาง changed-test ในเครื่องอยู่ใน `scripts/test-projects.test-support.mjs` และตั้งใจให้ประหยัดกว่า `check:changed`: การแก้ไขไฟล์ทดสอบโดยตรงจะรันตัวเอง, การแก้ไขซอร์สจะเลือก mapping ที่ระบุไว้ก่อน แล้วจึงเลือกการทดสอบข้างเคียงและ dependents จาก import graph config การส่งข้อความ group-room แบบแชร์เป็นหนึ่งใน mapping ที่ระบุไว้: การเปลี่ยนแปลง config visible-reply ของกลุ่ม, โหมดการส่ง source reply, หรือ system prompt ของ message-tool จะถูกส่งผ่านการทดสอบ core reply รวมถึง regression ของการส่งผ่าน Discord และ Slack เพื่อให้การเปลี่ยนค่าเริ่มต้นแบบแชร์ล้มเหลวก่อนการ push PR ครั้งแรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างถึงระดับ harness จนชุด mapped ราคาถูกไม่น่าเชื่อถือพอจะใช้แทนได้

## การตรวจสอบด้วย Testbox

รัน Testbox จากรูทของรีโป และควรใช้กล่องใหม่ที่อุ่นไว้แล้วสำหรับหลักฐานแบบกว้าง ก่อนใช้เวลาไปกับ gate ที่ช้าบนกล่องที่ถูกใช้ซ้ำ หมดอายุ หรือเพิ่งรายงาน sync ที่ใหญ่ผิดคาด ให้รัน `pnpm testbox:sanity` ภายในกล่องก่อน

การตรวจ sanity จะล้มเหลวอย่างรวดเร็วเมื่อไฟล์รูทที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short` แสดงการลบไฟล์ที่ tracked อย่างน้อย 200 รายการ โดยปกติหมายความว่าสถานะ sync ระยะไกลไม่ใช่สำเนา PR ที่เชื่อถือได้ ให้หยุดกล่องนั้นและอุ่นกล่องใหม่แทนการดีบักความล้มเหลวของการทดสอบผลิตภัณฑ์ สำหรับ PR ที่ตั้งใจลบไฟล์จำนวนมาก ให้ตั้งค่า `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับการรัน sanity นั้น

`pnpm testbox:run` จะยุติการเรียกใช้ Blacksmith CLI ในเครื่องด้วย หากค้างอยู่ในเฟส sync นานเกินห้านาทีโดยไม่มีเอาต์พุตหลัง sync ตั้งค่า `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` เพื่อปิด guard นั้น หรือใช้ค่ามิลลิวินาทีที่มากขึ้นสำหรับ local diff ที่ใหญ่ผิดปกติ

Crabbox คือ wrapper กล่องระยะไกลของรีโปสำหรับหลักฐาน Linux ของ maintainer ใช้เมื่อการตรวจสอบกว้างเกินกว่าจะอยู่ใน local edit loop, เมื่อความสอดคล้องกับ CI สำคัญ, หรือเมื่อหลักฐานต้องใช้ secrets, Docker, package lanes, กล่องที่ใช้ซ้ำได้, หรือ log ระยะไกล backend ปกติของ OpenClaw คือ `blacksmith-testbox`; capacity AWS/Hetzner ที่เป็นเจ้าของเองเป็น fallback สำหรับกรณี Blacksmith ล่ม, ปัญหา quota, หรือการทดสอบที่ระบุชัดว่าต้องใช้ owned-capacity

ก่อนรันครั้งแรก ให้ตรวจ wrapper จากรูทของรีโป:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

wrapper ของรีโปจะปฏิเสธ Crabbox binary ที่เก่าและไม่ได้ประกาศ `blacksmith-testbox` ส่ง provider อย่างชัดเจนแม้ว่า `.crabbox.yaml` จะมีค่าเริ่มต้น owned-cloud อยู่แล้ว

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

ชุดเต็ม:

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

อ่านสรุป JSON สุดท้าย ฟิลด์ที่มีประโยชน์คือ `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` และ `totalMs` การรัน Crabbox แบบครั้งเดียวที่อาศัย Blacksmith ควรหยุด Testbox โดยอัตโนมัติ; หากการรันถูกขัดจังหวะหรือการ cleanup ไม่ชัดเจน ให้ตรวจกล่องที่ยังทำงานอยู่และหยุดเฉพาะกล่องที่คุณสร้าง:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

ใช้การ reuse เฉพาะเมื่อคุณตั้งใจต้องรันหลายคำสั่งบนกล่องที่ hydrate แล้วกล่องเดียวกัน:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

หาก Crabbox เป็นชั้นที่เสีย แต่ Blacksmith เองยังทำงาน ให้ใช้ Blacksmith โดยตรงเป็น fallback แบบแคบ:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

หาก `blacksmith testbox list --all` และ `blacksmith testbox status` ทำงาน แต่ warmup ใหม่ค้างอยู่ที่ `queued` โดยไม่มี IP หรือ URL ของ Actions run หลังผ่านไปสองสามนาที ให้ถือว่าเป็นแรงกดดันจาก provider, queue, billing, หรือ org-limit ของ Blacksmith หยุด queued id ที่คุณสร้าง หลีกเลี่ยงการเริ่ม Testbox เพิ่ม และย้ายหลักฐานไปยังเส้นทาง owned Crabbox capacity ด้านล่าง ระหว่างที่มีคนตรวจ dashboard, billing และ org limits ของ Blacksmith

ยกระดับไปใช้ owned Crabbox capacity เฉพาะเมื่อ Blacksmith ล่ม, ถูกจำกัด quota, ไม่มีสภาพแวดล้อมที่ต้องใช้, หรือ owned capacity คือเป้าหมายที่ระบุชัดเจน:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

เมื่อ AWS มีแรงกดดัน ให้หลีกเลี่ยง `class=beast` เว้นแต่งานนั้นต้องใช้ CPU ระดับ 48xlarge จริงๆ คำขอ `beast` เริ่มที่ 192 vCPU และเป็นวิธีที่ง่ายที่สุดในการชน quota ระดับภูมิภาคของ EC2 Spot หรือ On-Demand Standard ค่าเริ่มต้น `.crabbox.yaml` ที่รีโปเป็นเจ้าของตั้งเป็น `standard`, หลาย capacity regions และ `capacity.hints: true` เพื่อให้ lease ของ AWS ที่ผ่าน broker พิมพ์ region/market ที่เลือก, แรงกดดัน quota, fallback ของ Spot และคำเตือน class แรงกดดันสูง ใช้ `fast` สำหรับการตรวจแบบกว้างที่หนักขึ้น, ใช้ `large` เฉพาะหลังจาก standard/fast ไม่พอ, และใช้ `beast` เฉพาะ lane ที่ใช้ CPU หนักเป็นพิเศษ เช่น full-suite หรือ Docker matrix ของทุก Plugin, การตรวจสอบ release/blocker ที่ระบุชัด, หรือการทำ performance profiling ที่ใช้ core จำนวนมาก อย่าใช้ `beast` สำหรับ `pnpm check:changed`, การทดสอบแบบเจาะจง, งานเฉพาะ docs, lint/typecheck ปกติ, E2E repro ขนาดเล็ก, หรือการ triage กรณี Blacksmith ล่ม ใช้ `--market on-demand` สำหรับการวินิจฉัย capacity เพื่อไม่ให้ความผันผวนของตลาด Spot ปะปนกับสัญญาณ

`.crabbox.yaml` เป็นเจ้าของค่าเริ่มต้นของ provider, sync และ GitHub Actions hydration สำหรับ owned-cloud lanes โดย exclude `.git` ในเครื่อง เพื่อให้ Actions checkout ที่ hydrate แล้วเก็บ metadata ของ Git ระยะไกลของตัวเอง แทนการ sync remotes และ object stores จากเครื่อง maintainer และ exclude runtime/build artifacts ในเครื่องที่ไม่ควรถูกถ่ายโอนเลย `.github/workflows/crabbox-hydrate.yml` เป็นเจ้าของ checkout, การตั้งค่า Node/pnpm, การ fetch `origin/main` และการส่งต่อ environment ที่ไม่ใช่ secret สำหรับคำสั่ง owned-cloud `crabbox run --id <cbx_id>`

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
