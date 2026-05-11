---
read_when:
    - คุณต้องเข้าใจว่าเหตุใดงาน CI จึงทำงานหรือไม่ทำงาน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการรันหรือรันซ้ำเพื่อยืนยันความถูกต้องของรุ่นเผยแพร่
    - คุณกำลังเปลี่ยนการส่งงานของ ClawSweeper หรือการส่งต่อกิจกรรม GitHub
summary: กราฟงาน CI, เกตควบคุมขอบเขต, งานครอบรีลีส และคำสั่งในเครื่องที่เทียบเท่า
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-05-11T20:22:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: b377be491770211595b12833b9bb18e5757839ef761539d5caa8eda6f63d75dc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI ทำงานกับทุก push ไปยัง `main` และทุก pull request งาน `preflight` จะจัดประเภท diff และปิด lane ที่มีค่าใช้จ่ายสูงเมื่อมีการเปลี่ยนแปลงเฉพาะส่วนที่ไม่เกี่ยวข้อง การรัน `workflow_dispatch` แบบแมนนวลจงใจข้ามการกำหนดขอบเขตอัจฉริยะและกระจายกราฟทั้งหมดสำหรับ release candidate และการตรวจสอบวงกว้าง lane ของ Android ยังเป็นแบบเลือกเปิดผ่าน `include_android` ความครอบคลุมของ Plugin สำหรับ release เท่านั้นอยู่ใน workflow แยก [`Plugin ก่อนเผยแพร่`](#plugin-prerelease) และจะทำงานจาก [`การตรวจสอบ Release เต็มรูปแบบ`](#full-release-validation) หรือการ dispatch แบบแมนนวลที่ระบุชัดเจนเท่านั้น

## ภาพรวม Pipeline

| งาน                              | วัตถุประสงค์                                                                                                   | เมื่อทำงาน                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | ตรวจจับการเปลี่ยนแปลงเฉพาะ docs, scope ที่เปลี่ยน, extension ที่เปลี่ยน และสร้าง manifest ของ CI                   | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-scm-fast`              | การตรวจจับ private key และการ audit workflow ผ่าน `zizmor`                                                     | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-dependency-audit`      | การ audit lockfile ฝั่ง production ที่ไม่ต้องใช้ dependency เทียบกับ advisory ของ npm                                          | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-fast`                  | aggregate ที่จำเป็นสำหรับงาน security แบบเร็ว                                                             | เสมอบน push และ PR ที่ไม่ใช่ draft |
| `check-dependencies`             | รอบตรวจ Knip เฉพาะ dependency ฝั่ง production พร้อม guard สำหรับ allowlist ของไฟล์ที่ไม่ได้ใช้                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-artifacts`                | build `dist/`, Control UI, การตรวจ built artifact และ artifact ปลายทางที่ใช้ซ้ำได้                       | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-core`               | lane ความถูกต้องบน Linux แบบเร็ว เช่น การตรวจ bundled/plugin-contract/protocol                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-contracts-channels` | การตรวจ channel contract แบบ sharded พร้อมผลตรวจ aggregate ที่เสถียร                                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-core-test`          | shard ทดสอบ core Node โดยยกเว้น lane ของ channel, bundled, contract และ extension                          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check`                          | เทียบเท่า gate หลักแบบ local ที่ sharded: prod types, lint, guards, test types และ strict smoke                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check-additional`               | สถาปัตยกรรม, boundary/prompt drift แบบ sharded, extension guards, package boundary และ gateway watch        | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-smoke`                    | smoke test ของ CLI ที่ build แล้วและ startup-memory smoke                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks`                         | ตัวตรวจสอบสำหรับการทดสอบ channel ของ built artifact                                                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-compat-node22`      | lane build และ smoke สำหรับความเข้ากันได้กับ Node 22                                                                | การ dispatch CI แบบแมนนวลสำหรับ release    |
| `check-docs`                     | การจัดรูปแบบ docs, lint และการตรวจลิงก์เสีย                                                             | docs เปลี่ยน                       |
| `skills-python`                  | Ruff + pytest สำหรับ Skills ที่มี Python รองรับ                                                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python-skill      |
| `checks-windows`                 | การทดสอบ process/path เฉพาะ Windows พร้อม regression ของ runtime import specifier ร่วม                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows           |
| `macos-node`                     | lane ทดสอบ TypeScript บน macOS โดยใช้ built artifact ร่วม                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `macos-swift`                    | Swift lint, build และ tests สำหรับแอป macOS                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `android`                        | unit test ของ Android สำหรับทั้งสอง flavor พร้อม build debug APK หนึ่งรายการ                                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android           |
| `test-performance-agent`         | การปรับปรุง slow-test ของ Codex รายวันหลังจากมีกิจกรรมที่เชื่อถือได้                                                 | CI บน main สำเร็จหรือ dispatch แบบแมนนวล |
| `openclaw-performance`           | รายงาน performance ของ Kova runtime แบบรายวัน/ตามคำขอ พร้อม lane mock-provider, deep-profile และ GPT 5.4 live | dispatch ตามกำหนดเวลาและแบบแมนนวล      |

## ลำดับ fail-fast

1. `preflight` ตัดสินใจว่า lane ใดมีอยู่จริงบ้าง ตรรกะ `docs-scope` และ `changed-scope` เป็น step ภายในงานนี้ ไม่ใช่งานแยกต่างหาก
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` fail อย่างรวดเร็วโดยไม่รอ artifact และงาน platform matrix ที่หนักกว่า
3. `build-artifacts` ทำงานทับซ้อนกับ lane Linux แบบเร็ว เพื่อให้ผู้บริโภคปลายทางเริ่มได้ทันทีที่ shared build พร้อม
4. lane ของ platform และ runtime ที่หนักกว่าจะกระจายออกหลังจากนั้น: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่เป็น `cancelled` เมื่อมี push ใหม่กว่าลงบน PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่านั่นเป็น noise ของ CI เว้นแต่ run ล่าสุดสำหรับ ref เดียวกันก็ยังล้มเหลวด้วย การตรวจ aggregate shard ใช้ `!cancelled() && always()` จึงยังรายงานความล้มเหลวของ shard ตามปกติ แต่จะไม่เข้าคิวหลังจาก workflow ทั้งหมดถูกแทนที่ไปแล้ว คีย์ concurrency อัตโนมัติของ CI มีเวอร์ชัน (`CI-v7-*`) เพื่อให้ zombie ฝั่ง GitHub ใน queue group เก่าไม่สามารถบล็อก run ใหม่ของ main ได้อย่างไม่มีกำหนด run full-suite แบบแมนนวลใช้ `CI-manual-v1-*` และไม่ยกเลิก run ที่กำลังดำเนินอยู่

งาน `ci-timings-summary` อัปโหลด artifact `ci-timings-summary` แบบกะทัดรัดสำหรับ CI run แต่ละรายการที่ไม่ใช่ draft โดยบันทึก wall time, queue time, งานที่ช้าที่สุด และงานที่ล้มเหลวสำหรับ run ปัจจุบัน เพื่อให้การตรวจสุขภาพ CI ไม่ต้อง scrape payload ของ Actions ทั้งหมดซ้ำ ๆ

## Scope และ routing

ตรรกะ scope อยู่ใน `scripts/ci-changed-scope.mjs` และครอบคลุมด้วย unit test ใน `src/scripts/ci-changed-scope.test.ts` การ dispatch แบบแมนนวลจะข้ามการตรวจจับ changed-scope และทำให้ manifest ของ preflight ทำงานเหมือนกับว่าทุกพื้นที่ที่มี scope เปลี่ยนแปลง

- **การแก้ไข workflow ของ CI** ตรวจสอบกราฟ CI ของ Node พร้อม workflow linting แต่ไม่ได้บังคับให้ build native ของ Windows, Android หรือ macOS ด้วยตัวมันเอง lane ของ platform เหล่านั้นยังคงถูกจำกัด scope ตามการเปลี่ยนแปลง source ของ platform
- **การแก้ไขเฉพาะ routing ของ CI, การแก้ไข fixture ของ core-test ราคาถูกที่เลือกไว้ และการแก้ไข helper/test-routing ของ plugin contract แบบแคบ** ใช้เส้นทาง manifest แบบ Node-only ที่เร็ว: `preflight`, security และงาน `checks-fast-core` หนึ่งงาน เส้นทางนั้นข้าม build artifacts, ความเข้ากันได้กับ Node 22, channel contracts, core shard เต็มรูปแบบ, bundled-plugin shards และ guard matrix เพิ่มเติม เมื่อการเปลี่ยนแปลงจำกัดอยู่ที่พื้นผิว routing หรือ helper ที่งานเร็วตรวจโดยตรง
- **การตรวจ Node บน Windows** ถูกจำกัด scope ไปยัง wrapper ของ process/path เฉพาะ Windows, helper runner ของ npm/pnpm/UI, config ของ package manager และพื้นผิว workflow ของ CI ที่ execute lane นั้น การเปลี่ยนแปลง source, Plugin, install-smoke และ test-only ที่ไม่เกี่ยวข้องยังอยู่บน lane Linux Node

กลุ่มทดสอบ Node ที่ช้าที่สุดถูกแยกหรือถ่วงสมดุลเพื่อให้งานแต่ละงานเล็กโดยไม่จอง runner มากเกินไป: channel contracts ทำงานเป็น shard แบบถ่วงน้ำหนักสาม shard ที่มี Blacksmith รองรับ พร้อม fallback เป็น runner มาตรฐานของ GitHub, lane core unit fast/support ทำงานแยกกัน, core runtime infra ถูกแยกระหว่าง state, process/config, cron และ shared shards, auto-reply ทำงานเป็น worker ที่สมดุล (พร้อมแยก subtree ของ reply เป็น shard agent-runner, dispatch และ commands/state-routing) และ config ของ agentic gateway/server ถูกแยกข้าม lane chat/auth/model/http-plugin/runtime/startup แทนที่จะรอ built artifacts การทดสอบ browser, QA, media และ Plugin miscellaneous แบบกว้างใช้ config Vitest เฉพาะของตนเองแทน catch-all ของ Plugin ที่ใช้ร่วมกัน shard แบบ include-pattern บันทึก timing entry โดยใช้ชื่อ shard ของ CI เพื่อให้ `.artifacts/vitest-shard-timings.json` แยก config ทั้งชุดออกจาก shard ที่ถูกกรองได้ `check-additional` รวมงาน compile/canary ของ package-boundary ไว้ด้วยกัน และแยกสถาปัตยกรรม runtime topology ออกจากความครอบคลุมของ gateway watch รายการ boundary guard ถูกสลับกระจายข้าม matrix shard สี่รายการ โดยแต่ละรายการรัน guard อิสระที่เลือกไว้พร้อมกันและพิมพ์ timing ต่อการตรวจแต่ละรายการ การตรวจ drift ของ prompt snapshot สำหรับ happy-path ของ Codex ที่มีค่าใช้จ่ายสูงทำงานเป็นงาน additional ของตนเองสำหรับ CI แบบแมนนวลและเฉพาะการเปลี่ยนแปลงที่กระทบ prompt เท่านั้น ดังนั้นการเปลี่ยนแปลง Node ปกติที่ไม่เกี่ยวข้องจึงไม่ต้องรอการสร้าง prompt snapshot แบบ cold และ boundary shard ยังคงสมดุล ขณะที่ prompt drift ยังถูกผูกกับ PR ที่เป็นต้นเหตุ flag เดียวกันนี้ข้ามการสร้าง prompt snapshot ของ Vitest ภายใน shard core support-boundary ของ built-artifact ด้วย Gateway watch, การทดสอบ channel และ shard core support-boundary ทำงานพร้อมกันภายใน `build-artifacts` หลังจาก `dist/` และ `dist-runtime/` ถูก build แล้ว

Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` แล้วจึง build Play debug APK flavor third-party ไม่มี source set หรือ manifest แยกต่างหาก lane unit-test ของมันยัง compile flavor ด้วย flag BuildConfig ของ SMS/call-log ในขณะเดียวกันก็หลีกเลี่ยงงาน packaging debug APK ซ้ำในทุก push ที่เกี่ยวข้องกับ Android

shard `check-dependencies` รัน `pnpm deadcode:dependencies` (รอบตรวจ Knip เฉพาะ dependency ฝั่ง production ที่ pin ไว้กับเวอร์ชันล่าสุดของ Knip โดยปิด minimum release age ของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบผลการพบไฟล์ที่ไม่ได้ใช้ใน production ของ Knip กับ `scripts/deadcode-unused-files.allowlist.mjs` guard ของไฟล์ที่ไม่ได้ใช้จะ fail เมื่อ PR เพิ่มไฟล์ที่ไม่ได้ใช้ใหม่ซึ่งยังไม่ผ่านการ review หรือปล่อย entry ใน allowlist ที่ล้าสมัยไว้ ขณะเดียวกันยังคงรักษาพื้นผิวของ Plugin แบบ dynamic, generated, build, live-test และ package bridge ที่ตั้งใจไว้ซึ่ง Knip ไม่สามารถ resolve แบบ static ได้

## การส่งต่อกิจกรรม ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` คือ bridge ฝั่ง target จากกิจกรรมใน repository OpenClaw ไปยัง ClawSweeper มันไม่ checkout หรือ execute โค้ด pull request ที่ไม่น่าเชื่อถือ workflow สร้าง GitHub App token จาก `CLAWSWEEPER_APP_PRIVATE_KEY` จากนั้น dispatch payload `repository_dispatch` แบบกะทัดรัดไปยัง `openclaw/clawsweeper`

workflow มีสี่ lane:

- `clawsweeper_item` สำหรับคำขอ review issue และ pull request ที่ระบุแน่นอน;
- `clawsweeper_comment` สำหรับคำสั่ง ClawSweeper ที่ระบุชัดเจนใน comment ของ issue;
- `clawsweeper_commit_review` สำหรับคำขอ review ระดับ commit บน push ไปยัง `main`;
- `github_activity` สำหรับกิจกรรม GitHub ทั่วไปที่ agent ของ ClawSweeper อาจตรวจสอบ

lane `github_activity` ส่งต่อเฉพาะ metadata ที่ normalize แล้ว: ประเภท event, action, actor, repository, หมายเลข item, URL, title, state และ excerpt สั้น ๆ สำหรับ comment หรือ review เมื่อมี โดยจงใจหลีกเลี่ยงการส่งต่อ webhook body แบบเต็ม workflow ที่รับใน `openclaw/clawsweeper` คือ `.github/workflows/github-activity.yml` ซึ่ง post event ที่ normalize แล้วไปยัง hook ของ OpenClaw Gateway สำหรับ agent ของ ClawSweeper

กิจกรรมทั่วไปเป็นการสังเกต ไม่ใช่การส่งมอบโดยค่าเริ่มต้น agent ของ ClawSweeper ได้รับ target ของ Discord ใน prompt และควร post ไปยัง `#clawsweeper` เฉพาะเมื่อ event นั้นน่าประหลาดใจ ดำเนินการได้ มีความเสี่ยง หรือมีประโยชน์เชิงปฏิบัติการ การเปิด การแก้ไข ความเคลื่อนไหวของ bot, noise จาก Webhook ซ้ำ และ traffic review ปกติ ควรได้ผลลัพธ์เป็น `NO_REPLY`

ถือว่าชื่อ GitHub, ความคิดเห็น, เนื้อหา, ข้อความรีวิว, ชื่อ branch และข้อความ commit เป็นข้อมูลที่ไม่น่าเชื่อถือตลอด path นี้ ข้อมูลเหล่านี้เป็นอินพุตสำหรับการสรุปและการคัดแยก ไม่ใช่คำสั่งสำหรับ workflow หรือ agent runtime

## การ dispatch ด้วยตนเอง

การ dispatch CI ด้วยตนเองจะรันกราฟงานเดียวกับ CI ปกติ แต่บังคับเปิดทุก lane ที่กำหนดขอบเขตแบบ non-Android: shard ของ Linux Node, shard ของ bundled-plugin, channel contract, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, การตรวจ docs, Python skills, Windows, macOS และ Control UI i18n การ dispatch CI ด้วยตนเองแบบ standalone จะรันเฉพาะ Android ด้วย `include_android=true`; umbrella สำหรับ full release จะเปิดใช้ Android โดยส่ง `include_android=true` การตรวจแบบ static สำหรับ Plugin prerelease, shard `agentic-plugins` ที่มีเฉพาะ release, การ sweep extension batch แบบเต็ม และ lane Docker สำหรับ Plugin prerelease จะถูกแยกออกจาก CI ชุด Docker prerelease จะรันเฉพาะเมื่อ `Full Release Validation` dispatch workflow `Plugin Prerelease` แยกต่างหากโดยเปิดใช้ gate release-validation

การรันด้วยตนเองใช้ concurrency group ที่ไม่ซ้ำกัน เพื่อไม่ให้ชุดทดสอบเต็มของ release-candidate ถูกยกเลิกโดยการรันจาก push หรือ PR อื่นบน ref เดียวกัน อินพุต `target_ref` ที่เป็นตัวเลือกช่วยให้ผู้เรียกที่เชื่อถือได้รันกราฟนั้นกับ branch, tag หรือ commit SHA แบบเต็มได้ ขณะใช้ไฟล์ workflow จาก dispatch ref ที่เลือก

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, งาน security แบบเร็วและ aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจ protocol/contract/bundled แบบเร็ว, การตรวจ channel contract แบบ sharded, shard ของ `check` ยกเว้น lint, aggregate ของ `check-additional`, verifier aggregate สำหรับการทดสอบ Node, การตรวจ docs, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight ก็ใช้ GitHub-hosted Ubuntu เช่นกันเพื่อให้ matrix ของ Blacksmith เข้าคิวได้เร็วขึ้น |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard extension ที่น้ำหนักต่ำกว่า, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` และ `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, shard การทดสอบ Linux Node, shard การทดสอบ bundled Plugin, shard ของ `check-additional`, `android`                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (อ่อนไหวต่อ CPU มากพอที่ 8 vCPU ใช้ต้นทุนมากกว่าที่ประหยัดได้); install-smoke Docker build (เวลาเข้าคิวของ 32-vCPU ใช้ต้นทุนมากกว่าที่ประหยัดได้)                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; fork จะ fallback ไปที่ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; fork จะ fallback ไปที่ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

CI ของ repo canonical ยังคงใช้ Blacksmith เป็น path runner เริ่มต้น ระหว่าง `preflight`, `scripts/ci-runner-labels.mjs` จะตรวจการรัน Actions ล่าสุดที่ queued และ in-progress เพื่อหางาน Blacksmith ที่ queued หาก label Blacksmith เฉพาะมีงาน queued อยู่แล้ว งาน downstream ที่จะใช้ label นั้นตรงๆ จะ fallback ไปยัง runner GitHub-hosted ที่ตรงกัน (`ubuntu-24.04`, `windows-2025` หรือ `macos-latest`) เฉพาะสำหรับการรันนั้น ขนาด Blacksmith อื่นในตระกูล OS เดียวกันจะยังคงใช้ label หลักของตน หากการ probe API ล้มเหลว จะไม่มีการใช้ fallback

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

## ประสิทธิภาพ OpenClaw

`OpenClaw Performance` คือ workflow ด้านประสิทธิภาพของผลิตภัณฑ์/runtime ซึ่งรันทุกวันบน `main` และสามารถ dispatch ด้วยตนเองได้:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

โดยปกติการ dispatch ด้วยตนเองจะ benchmark workflow ref ตั้งค่า `target_ref` เพื่อ benchmark release tag หรือ branch อื่นด้วย implementation ของ workflow ปัจจุบัน path ของรายงานที่เผยแพร่และ pointer ล่าสุดจะ keyed ตาม ref ที่ทดสอบ และ `index.md` แต่ละไฟล์จะบันทึก ref/SHA ที่ทดสอบ, workflow ref/SHA, Kova ref, profile, โหมด lane auth, model, จำนวน repeat และ scenario filter

workflow จะติดตั้ง OCM จาก release ที่ pin ไว้ และ Kova จาก `openclaw/Kova` ที่อินพุต `kova_ref` ที่ pin ไว้ จากนั้นรันสาม lane:

- `mock-provider`: scenario diagnostic ของ Kova กับ runtime ที่ build ในเครื่องพร้อม auth ปลอมแบบ OpenAI-compatible ที่กำหนดได้แน่นอน
- `mock-deep-profile`: การ profile CPU/heap/trace สำหรับ startup, gateway และ hotspot ของ agent-turn
- `live-gpt54`: agent turn จริงของ OpenAI `openai/gpt-5.4` โดยข้ามเมื่อไม่มี `OPENAI_API_KEY`

lane mock-provider ยังรัน source probe แบบ OpenClaw-native หลังจาก Kova pass ด้วย: เวลา boot และหน่วยความจำของ gateway ในกรณี startup แบบ default, hook และ 50-plugin; loop hello ของ mock-OpenAI `channel-chat-baseline` ซ้ำๆ; และคำสั่ง startup ของ CLI กับ gateway ที่ boot แล้ว สรุป Markdown ของ source probe อยู่ที่ `source/index.md` ในชุดรายงาน โดยมี JSON ดิบอยู่ข้างๆ

ทุก lane จะอัปโหลด GitHub artifact เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว workflow จะ commit `report.json`, `report.md`, bundle, `index.md` และ artifact ของ source-probe ไปยัง `openclaw/clawgrit-reports` ภายใต้ `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` ด้วย pointer ของ tested-ref ปัจจุบันจะถูกเขียนเป็น `openclaw-performance/<tested-ref>/latest-<lane>.json`

## Full Release Validation

`Full Release Validation` คือ workflow umbrella แบบ manual สำหรับ "รันทุกอย่างก่อน release" รับ branch, tag หรือ commit SHA แบบเต็ม, dispatch workflow `CI` แบบ manual ด้วย target นั้น, dispatch `Plugin Prerelease` สำหรับ proof เฉพาะ release ของ Plugin/package/static/Docker และ dispatch `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, การตรวจ package ข้าม OS, ความเท่าเทียมของ QA Lab, Matrix และ lane Telegram การรัน stable/default จะเก็บ coverage ของ live/E2E แบบ exhaustive และ Docker release-path ไว้หลัง `run_release_soak=true`; `release_profile=full` จะบังคับเปิด coverage soak นั้น เพื่อให้การ validation advisory แบบกว้างยังคงกว้างอยู่ เมื่อใช้ `rerun_group=all` และ `release_profile=full` จะรัน `NPM Telegram Beta E2E` กับ artifact `release-package-under-test` จาก release checks ด้วย หลังเผยแพร่แล้ว ให้ส่ง `release_package_spec` เพื่อใช้ package npm ที่ shipped ซ้ำใน release checks, Package Acceptance, Docker, cross-OS และ Telegram โดยไม่ต้อง rebuild ใช้ `npm_telegram_package_spec` เฉพาะเมื่อ Telegram ต้องพิสูจน์ package อื่น

ดู [Full release validation](/th/reference/full-release-validation) สำหรับ
matrix ของ stage, ชื่องาน workflow ที่แน่นอน, ความแตกต่างของ profile, artifact และ
handle สำหรับ rerun แบบเจาะจง

`OpenClaw Release Publish` คือ workflow release แบบ manual ที่มีการเปลี่ยนแปลงสถานะ Dispatch จาก `release/YYYY.M.D` หรือ `main` หลังจาก release tag มีอยู่แล้วและหลังจาก preflight npm ของ OpenClaw สำเร็จแล้ว โดยจะตรวจสอบ `pnpm plugins:sync:check`, dispatch `Plugin NPM Release` สำหรับ package Plugin ทั้งหมดที่ publish ได้, dispatch `Plugin ClawHub Release` สำหรับ release SHA เดียวกัน และหลังจากนั้นเท่านั้นจึง dispatch `OpenClaw NPM Release` ด้วย `preflight_run_id` ที่บันทึกไว้

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

สำหรับหลักฐานคอมมิตที่ปักหมุดไว้บนสาขาที่เปลี่ยนเร็ว ให้ใช้ตัวช่วยแทน
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

refs สำหรับการสั่งรัน GitHub workflow ต้องเป็นสาขาหรือแท็ก ไม่ใช่ SHA ของคอมมิตแบบดิบ
ตัวช่วยจะพุชสาขาชั่วคราว `release-ci/<sha>-...` ที่ SHA เป้าหมาย,
สั่งรัน `Full Release Validation` จาก ref ที่ปักหมุดนั้น, ตรวจสอบว่า
`headSha` ของ workflow ลูกทุกตัวตรงกับเป้าหมาย, และลบสาขาชั่วคราวเมื่อ
การรันเสร็จสิ้น ตัวตรวจสอบแบบครอบคลุมจะล้มเหลวด้วยหาก workflow ลูกใดรันที่
SHA อื่น

`release_profile` ควบคุมขอบเขต live/provider ที่ส่งเข้าไปยังการตรวจสอบ release
workflow release แบบสั่งเองมีค่าเริ่มต้นเป็น `stable`; ใช้ `full` เฉพาะเมื่อคุณ
ตั้งใจต้องการเมทริกซ์ provider/media แบบ advisory ที่กว้างเท่านั้น `run_release_soak`
ควบคุมว่าการตรวจสอบ release แบบ stable/default จะรัน soak ของ live/E2E แบบละเอียดและ
เส้นทาง release ผ่าน Docker หรือไม่; `full` จะบังคับเปิด soak

- `minimum` คงไว้เฉพาะเลน OpenAI/core ที่สำคัญต่อ release และเร็วที่สุด
- `stable` เพิ่มชุด provider/backend แบบ stable
- `full` รันเมทริกซ์ provider/media แบบ advisory ที่กว้าง

umbrella จะบันทึก run ids ของ child ที่ถูกสั่งรัน และงาน `Verify full validation` สุดท้ายจะตรวจสอบข้อสรุปปัจจุบันของ child run อีกครั้ง พร้อมเพิ่มตารางงานที่ช้าที่สุดสำหรับ child run แต่ละรายการ หาก workflow ลูกถูก rerun แล้วผ่าน ให้ rerun เฉพาะงาน parent verifier เพื่อรีเฟรชผลลัพธ์ umbrella และสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รับ `rerun_group` ใช้ `all` สำหรับ release candidate, `ci` สำหรับ child ของ full CI ปกติเท่านั้น, `plugin-prerelease` สำหรับ child ของ plugin prerelease เท่านั้น, `release-checks` สำหรับ release child ทุกตัว, หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, หรือ `npm-telegram` บน umbrella วิธีนี้ทำให้การ rerun กล่อง release ที่ล้มเหลวถูกจำกัดขอบเขตหลังแก้ไขแบบเจาะจง สำหรับเลน cross-OS ที่ล้มเหลวหนึ่งเลน ให้รวม `rerun_group=cross-os` กับ `cross_os_suite_filter` เช่น `windows/packaged-upgrade`; คำสั่ง cross-OS ที่ใช้เวลานานจะส่งบรรทัด heartbeat และสรุป packaged-upgrade จะรวมเวลาของแต่ละเฟส เลน QA release-check เป็น advisory ดังนั้นความล้มเหลวเฉพาะ QA จะเตือนแต่ไม่บล็อกตัวตรวจสอบ release-check

`OpenClaw Release Checks` ใช้ workflow ref ที่เชื่อถือได้เพื่อ resolve ref ที่เลือกหนึ่งครั้งเป็น tarball `release-package-under-test` จากนั้นส่ง artifact นั้นไปยังการตรวจสอบ cross-OS และ Package Acceptance รวมถึง workflow Docker เส้นทาง release แบบ live/E2E เมื่อรันความครอบคลุมแบบ soak วิธีนี้ทำให้ไบต์ของแพ็กเกจสอดคล้องกันทุกกล่อง release และหลีกเลี่ยงการแพ็ก candidate เดิมซ้ำในหลาย child job

การรัน `Full Release Validation` ซ้ำสำหรับ `ref=main` และ `rerun_group=all`
จะแทนที่ umbrella ที่เก่ากว่า parent monitor จะยกเลิก child workflow ใดก็ตามที่
ได้สั่งรันไปแล้วเมื่อ parent ถูกยกเลิก ดังนั้นการตรวจสอบ main ที่ใหม่กว่าจะไม่ต้องรอ
อยู่หลัง release-check run เก่าที่ใช้เวลาสองชั่วโมง การตรวจสอบสาขา/แท็ก release
และกลุ่ม rerun แบบเจาะจงจะคง `cancel-in-progress: false`

## ชาร์ด Live และ E2E

child ของ release live/E2E ยังคงความครอบคลุม `pnpm test:live` แบบ native ที่กว้าง แต่รันเป็นชาร์ดที่มีชื่อตาม `scripts/test-live-shard.mjs` แทนงานแบบ serial งานเดียว:

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
- ชาร์ดเสียง/วิดีโอของ media ที่แยกออก และชาร์ดเพลงที่กรองตาม provider

วิธีนี้คงความครอบคลุมไฟล์เดิมไว้ พร้อมทำให้ความล้มเหลวของ live provider ที่ช้าสามารถ rerun และวินิจฉัยได้ง่ายขึ้น ชื่อชาร์ดรวม `native-live-extensions-o-z`, `native-live-extensions-media`, และ `native-live-extensions-media-music` ยังคงใช้ได้สำหรับการ rerun แบบครั้งเดียวด้วยตนเอง

ชาร์ด native live media รันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งสร้างโดย workflow `Live Media Runner Image` image นั้นติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้า; งาน media เพียงตรวจสอบไบนารีก่อน setup เท่านั้น ให้คงชุดทดสอบ live ที่พึ่ง Docker ไว้บน runner Blacksmith ปกติ เพราะ container job ไม่เหมาะสำหรับการเปิดทดสอบ Docker ซ้อน

ชาร์ด live model/backend ที่พึ่ง Docker ใช้ image ร่วมแยกต่างหาก `ghcr.io/openclaw/openclaw-live-test:<sha>` ต่อคอมมิตที่เลือกหนึ่งรายการ workflow release แบบ live จะ build และ push image นั้นครั้งเดียว จากนั้นชาร์ด Docker live model, gateway ที่แบ่งตาม provider, CLI backend, ACP bind, และ Codex harness จะรันด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ชาร์ด Gateway Docker มีเพดาน `timeout` ระดับสคริปต์ที่ชัดเจนและต่ำกว่า timeout ของ workflow job เพื่อให้ container หรือเส้นทาง cleanup ที่ค้างล้มเหลวเร็ว แทนที่จะใช้ budget ของ release-check ทั้งหมด หากชาร์ดเหล่านั้น build เป้าหมาย Docker ของ source เต็มแยกกัน การรัน release นั้นถูกตั้งค่าผิดและจะเสียเวลา wall clock ไปกับการ build image ซ้ำ

## Package Acceptance

ใช้ `Package Acceptance` เมื่อคำถามคือ "แพ็กเกจ OpenClaw ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์หรือไม่" สิ่งนี้ต่างจาก CI ปกติ: CI ปกติตรวจสอบ source tree ส่วน package acceptance ตรวจสอบ tarball เดียวผ่าน Docker E2E harness เดียวกับที่ผู้ใช้ใช้งานหลังติดตั้งหรืออัปเดต

### งาน

1. `resolve_package` checkout `workflow_ref`, resolve package candidate หนึ่งรายการ, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, อัปโหลดทั้งสองเป็น artifact `package-under-test`, และพิมพ์ source, workflow ref, package ref, version, SHA-256, และ profile ในสรุป step ของ GitHub
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` reusable workflow จะดาวน์โหลด artifact นั้น, ตรวจสอบ inventory ของ tarball, เตรียม image Docker แบบ package-digest เมื่อจำเป็น, และรันเลน Docker ที่เลือกกับแพ็กเกจนั้นแทนการแพ็ก workflow checkout เมื่อ profile เลือก `docker_lanes` เป้าหมายหลายรายการ reusable workflow จะเตรียมแพ็กเกจและ image ร่วมครั้งเดียว จากนั้นกระจายเลนเหล่านั้นเป็นงาน Docker เป้าหมายแบบ parallel พร้อม artifact ที่ไม่ซ้ำกัน
3. `package_telegram` เรียก `NPM Telegram Beta E2E` แบบเลือกได้ โดยจะรันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้ง artifact `package-under-test` เดียวกันเมื่อ Package Acceptance resolve ได้หนึ่งรายการ; การ dispatch Telegram แบบ standalone ยังสามารถติดตั้ง npm spec ที่เผยแพร่แล้วได้
4. `summary` ทำให้ workflow ล้มเหลวหากการ resolve package, Docker acceptance, หรือเลน Telegram แบบเลือกได้ล้มเหลว

### แหล่งที่มาของ Candidate

- `source=npm` รับเฉพาะ `openclaw@beta`, `openclaw@latest`, หรือเวอร์ชัน release ของ OpenClaw แบบ exact เช่น `openclaw@2026.4.27-beta.2` ใช้รายการนี้สำหรับ acceptance ของ prerelease/stable ที่เผยแพร่แล้ว
- `source=ref` แพ็กสาขา แท็ก หรือ SHA คอมมิตเต็มของ `package_ref` ที่เชื่อถือได้ resolver จะ fetch สาขา/แท็กของ OpenClaw, ตรวจสอบว่าคอมมิตที่เลือกเข้าถึงได้จากประวัติสาขาของ repository หรือ release tag, ติดตั้ง deps ใน worktree แบบ detached, และแพ็กด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` ดาวน์โหลด `.tgz` ผ่าน HTTPS; ต้องระบุ `package_sha256`
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งรายการจาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็น optional แต่ควรระบุสำหรับ artifact ที่แชร์ภายนอก

ให้แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือโค้ด workflow/harness ที่เชื่อถือได้ซึ่งรันการทดสอบ `package_ref` คือ source commit ที่จะถูกแพ็กเมื่อ `source=ref` วิธีนี้ทำให้ test harness ปัจจุบันตรวจสอบ source commit เก่าที่เชื่อถือได้โดยไม่ต้องรัน logic workflow เก่า

### Suite profiles

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` รวมกับ `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — ชังก์เส้นทาง release ของ Docker เต็มพร้อม OpenWebUI
- `custom` — `docker_lanes` แบบ exact; ต้องระบุเมื่อ `suite_profile=custom`

profile `package` ใช้ความครอบคลุม Plugin แบบ offline เพื่อให้การตรวจสอบแพ็กเกจที่เผยแพร่แล้วไม่ถูก gating ด้วยความพร้อมใช้งานของ ClawHub แบบ live เลน Telegram แบบเลือกได้จะใช้ artifact `package-under-test` ซ้ำใน `NPM Telegram Beta E2E` โดยคงเส้นทาง npm spec ที่เผยแพร่แล้วไว้สำหรับการ dispatch แบบ standalone

สำหรับนโยบายเฉพาะของการทดสอบ update และ Plugin รวมถึงคำสั่ง local,
เลน Docker, input ของ Package Acceptance, ค่าเริ่มต้นของ release, และการคัดแยกความล้มเหลว,
ดู [การทดสอบ update และ Plugin](/th/help/testing-updates-plugins).

การตรวจสอบรีลีสเรียกการยอมรับแพ็กเกจด้วย `source=artifact`, อาร์ติแฟกต์แพ็กเกจรีลีสที่เตรียมไว้, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` และ `telegram_mode=mock-openai` วิธีนี้ทำให้การย้ายข้อมูลแพ็กเกจ, การอัปเดต, การติดตั้ง Skills สดจาก ClawHub, การล้าง stale-plugin-dependency, การซ่อมแซมการติดตั้ง Plugin ที่กำหนดค่าไว้, Plugin แบบออฟไลน์, plugin-update และการพิสูจน์ Telegram อยู่บนแพ็กเกจ tarball ที่ resolve แล้วเดียวกัน ตั้งค่า `release_package_spec` บนการตรวจสอบรีลีสเต็มรูปแบบหรือการตรวจสอบรีลีส OpenClaw หลังเผยแพร่เบต้า เพื่อรันเมทริกซ์เดียวกันกับแพ็กเกจ npm ที่ส่งออกไปแล้วโดยไม่ต้อง build ใหม่; ตั้งค่า `package_acceptance_package_spec` เฉพาะเมื่อการยอมรับแพ็กเกจต้องใช้แพ็กเกจที่ต่างจากส่วนที่เหลือของการตรวจสอบรีลีส การตรวจสอบรีลีสข้าม OS ยังคงครอบคลุม onboarding, installer และพฤติกรรมแพลตฟอร์มเฉพาะ OS; การตรวจสอบผลิตภัณฑ์ด้านแพ็กเกจ/อัปเดตควรเริ่มจากการยอมรับแพ็กเกจ Docker lane `published-upgrade-survivor` ตรวจสอบ baseline แพ็กเกจที่เผยแพร่แล้วหนึ่งรายการต่อการรันในเส้นทางรีลีสแบบบล็อก ในการยอมรับแพ็กเกจ tarball `package-under-test` ที่ resolve แล้วจะเป็น candidate เสมอ และ `published_upgrade_survivor_baseline` จะเลือก baseline ที่เผยแพร่แล้วสำหรับ fallback โดยมีค่าเริ่มต้นเป็น `openclaw@latest`; คำสั่งรันซ้ำของ lane ที่ล้มเหลวจะคง baseline นั้นไว้ การตรวจสอบรีลีสเต็มรูปแบบที่มี `run_release_soak=true` หรือ `release_profile=full` จะตั้งค่า `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` และ `published_upgrade_survivor_scenarios=reported-issues` เพื่อขยายการตรวจสอบครอบคลุมรีลีส npm เสถียรสี่เวอร์ชันล่าสุด รวมถึงรีลีสขอบเขตความเข้ากันได้ของ Plugin ที่ปักหมุดไว้ และ fixture ที่มีรูปแบบตาม issue สำหรับ config ของ Feishu, ไฟล์ bootstrap/persona ที่ถูกเก็บไว้, การติดตั้ง Plugin OpenClaw ที่กำหนดค่าไว้, path log แบบ tilde และ root dependency ของ Plugin แบบ legacy ที่ stale การเลือก published-upgrade survivor แบบหลาย baseline จะถูกแบ่ง shard ตาม baseline เป็นงาน Docker runner เป้าหมายแยกกัน workflow `Update Migration` แยกต่างหากใช้ Docker lane `update-migration` กับ `all-since-2026.4.23` และ `plugin-deps-cleanup` เมื่อคำถามคือการล้างข้อมูลอัปเดตที่เผยแพร่แล้วแบบครบถ้วน ไม่ใช่ความกว้างของ CI รีลีสเต็มรูปแบบตามปกติ การรัน aggregate ในเครื่องสามารถส่ง package spec ที่เจาะจงด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, คง lane เดียวไว้ด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` เช่น `openclaw@2026.4.15` หรือตั้งค่า `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` สำหรับเมทริกซ์ scenario ได้ lane ที่เผยแพร่แล้วจะกำหนด baseline ด้วยสูตรคำสั่ง `openclaw config set` ที่ bake ไว้ บันทึกขั้นตอนสูตรใน `summary.json` และ probe `/healthz`, `/readyz` รวมถึงสถานะ RPC หลัง Gateway เริ่มทำงาน lane แบบแพ็กเกจและ installer fresh บน Windows ยังตรวจสอบด้วยว่าแพ็กเกจที่ติดตั้งแล้วสามารถ import browser-control override จาก path Windows แบบ absolute ดิบได้ smoke ของ agent-turn ข้าม OS สำหรับ OpenAI มีค่าเริ่มต้นเป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อตั้งค่าไว้ มิฉะนั้นใช้ `openai/gpt-5.4` เพื่อให้การติดตั้งและการพิสูจน์ Gateway อยู่บนโมเดลทดสอบ GPT-5 พร้อมหลีกเลี่ยงค่าเริ่มต้น GPT-4.x

### หน้าต่างความเข้ากันได้แบบ legacy

การยอมรับแพ็กเกจมีหน้าต่างความเข้ากันได้แบบ legacy ที่มีขอบเขตสำหรับแพ็กเกจที่เผยแพร่ไปแล้ว แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้เส้นทางความเข้ากันได้:

- รายการ QA ส่วนตัวที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ถูกละไว้จาก tarball;
- `doctor-switch` อาจข้าม subcase การคงอยู่ของ `gateway install --wrapper` เมื่อแพ็กเกจไม่ได้เปิดเผย flag นั้น;
- `update-channel-switch` อาจ prune `patchedDependencies` ของ pnpm ที่หายไปจาก fixture git ปลอมที่ได้จาก tarball และอาจ log `update.channel` ที่ persisted ไว้แต่หายไป;
- smoke ของ Plugin อาจอ่านตำแหน่ง install-record แบบ legacy หรือยอมรับการไม่มีการคงอยู่ของ marketplace install-record;
- `plugin-update` อาจอนุญาตให้ย้ายข้อมูล metadata ของ config ขณะที่ยังต้องให้ install record และพฤติกรรม no-reinstall คงเดิม

แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ stamp metadata ของ build ในเครื่องที่ถูกส่งออกไปแล้วได้เช่นกัน แพ็กเกจที่ใหม่กว่าต้องเป็นไปตาม contract สมัยใหม่; เงื่อนไขเดียวกันจะล้มเหลวแทนที่จะเตือนหรือข้าม

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

เมื่อ debug การรันการยอมรับแพ็กเกจที่ล้มเหลว ให้เริ่มที่สรุป `resolve_package` เพื่อยืนยันแหล่งที่มาของแพ็กเกจ เวอร์ชัน และ SHA-256 จากนั้นตรวจสอบ child run `docker_acceptance` และอาร์ติแฟกต์ Docker ของมัน: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log ของ lane, เวลาของ phase และคำสั่งรันซ้ำ ควรรัน profile แพ็กเกจที่ล้มเหลวหรือ Docker lane ที่เจาะจงซ้ำ มากกว่ารันการตรวจสอบรีลีสเต็มรูปแบบซ้ำ

## Smoke การติดตั้ง

workflow `Install Smoke` แยกต่างหากนำ scope script เดียวกันกลับมาใช้ผ่าน job `preflight` ของตัวเอง โดยแบ่ง coverage ของ smoke เป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **เส้นทางเร็ว** รันสำหรับ pull request ที่แตะพื้นผิว Docker/แพ็กเกจ, การเปลี่ยนแปลงแพ็กเกจ/manifest ของ Plugin ที่ bundled หรือพื้นผิว Plugin/channel/gateway/Plugin SDK ของ core ที่งาน Docker smoke ครอบคลุม การเปลี่ยนแปลง Plugin ที่ bundled เฉพาะ source, การแก้ไขเฉพาะ test และการแก้ไขเฉพาะ docs จะไม่จอง worker ของ Docker เส้นทางเร็ว build อิมเมจ Dockerfile รากหนึ่งครั้ง, ตรวจสอบ CLI, รัน smoke ของ CLI สำหรับ agents delete shared-workspace, รัน gateway-network e2e ใน container, ตรวจสอบ build arg ของส่วนขยายที่ bundled และรัน profile Docker ของ bundled-plugin แบบมีขอบเขตภายใต้ timeout คำสั่ง aggregate 240 วินาที (Docker run ของแต่ละ scenario ถูกจำกัดแยกกัน)
- **เส้นทางเต็ม** เก็บ QR package install และ coverage ของ installer Docker/update ไว้สำหรับการรันตามกำหนดรายคืน, การ dispatch ด้วยมือ, การตรวจสอบรีลีสแบบ workflow-call และ pull request ที่แตะพื้นผิว installer/package/Docker จริง ๆ ในโหมดเต็ม install-smoke จะเตรียมหรือนำอิมเมจ smoke ของ GHCR root Dockerfile สำหรับ target-SHA หนึ่งรายการกลับมาใช้ จากนั้นรัน QR package install, smoke ของ root Dockerfile/gateway, smoke ของ installer/update และ Docker E2E ของ bundled-plugin แบบเร็วเป็น job แยกกัน เพื่อให้งาน installer ไม่ต้องรออยู่หลัง smoke ของ root image

push ไปยัง `main` (รวมถึง merge commit) จะไม่บังคับเส้นทางเต็ม; เมื่อ logic changed-scope ขอ coverage เต็มบน push, workflow จะคง Docker smoke แบบเร็วไว้ และปล่อย install smoke แบบเต็มให้กับ nightly หรือการตรวจสอบรีลีส

smoke image-provider ของการติดตั้ง Bun global ที่ช้าถูก gate แยกต่างหากด้วย `run_bun_global_install_smoke` มันรันใน schedule รายคืนและจาก workflow ตรวจสอบรีลีส และการ dispatch `Install Smoke` ด้วยมือสามารถ opt in ได้ แต่ pull request และ push ไปยัง `main` จะไม่รัน การทดสอบ QR และ installer Docker จะคง Dockerfile ที่เน้นการติดตั้งของตัวเองไว้

## Docker E2E ในเครื่อง

`pnpm test:docker:all` prebuild อิมเมจ live-test ที่ใช้ร่วมกันหนึ่งรายการ, pack OpenClaw หนึ่งครั้งเป็น npm tarball และ build อิมเมจ `scripts/e2e/Dockerfile` ที่ใช้ร่วมกันสองรายการ:

- runner Node/Git แบบ bare สำหรับ lane installer/update/plugin-dependency;
- อิมเมจ functional ที่ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lane functional ปกติ

นิยาม Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, logic planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs` และ runner จะ execute เฉพาะ plan ที่เลือกเท่านั้น scheduler เลือกอิมเมจต่อ lane ด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` จากนั้นรัน lane ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### ค่าที่ปรับได้

| Variable                               | Default | Purpose                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | จำนวน slot ของ main-pool สำหรับ lane ปกติ                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | จำนวน slot ของ tail-pool ที่ไวต่อ provider                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | เพดาน lane สดพร้อมกันเพื่อไม่ให้ provider throttle                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | เพดาน lane ติดตั้ง npm พร้อมกัน                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | เพดาน lane multi-service พร้อมกัน                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | หน่วงระหว่างการเริ่ม lane เพื่อหลีกเลี่ยง create storm ของ Docker daemon; ตั้ง `0` เพื่อไม่หน่วง     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout fallback ต่อ lane (120 นาที); lane live/tail บางรายการใช้เพดานที่เข้มกว่า           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` พิมพ์ plan ของ scheduler โดยไม่รัน lane                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | รายการ lane ที่เจาะจงคั่นด้วยจุลภาค; ข้าม smoke การ cleanup เพื่อให้ agent ทำซ้ำ lane ที่ล้มเหลวหนึ่งรายการได้ |

lane ที่หนักกว่าเพดาน effective ของมันยังสามารถเริ่มจาก pool ว่างได้ แล้วรันเพียงลำพังจนกว่าจะปล่อย capacity การรัน aggregate ในเครื่องจะ preflight Docker, ลบ container OpenClaw E2E ที่ stale, ส่งสถานะ active-lane, persist เวลาของ lane สำหรับการเรียงแบบ longest-first และหยุด schedule lane ใหม่ใน pooled lanes หลังความล้มเหลวครั้งแรกโดยค่าเริ่มต้น

### workflow live/E2E ที่ใช้ซ้ำได้

workflow live/E2E ที่ใช้ซ้ำได้ถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องใช้ package, ชนิดอิมเมจ, อิมเมจ live, lane และ coverage ของ credential ใด จากนั้น `scripts/docker-e2e.mjs` แปลง plan นั้นเป็น output และสรุปของ GitHub มันจะ pack OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลดอาร์ติแฟกต์แพ็กเกจของการรันปัจจุบัน หรือดาวน์โหลดอาร์ติแฟกต์แพ็กเกจจาก `package_artifact_run_id`; ตรวจสอบ inventory ของ tarball; build และ push อิมเมจ Docker E2E แบบ bare/functional ของ GHCR ที่ tag ด้วย digest ของแพ็กเกจผ่าน cache ของเลเยอร์ Docker ของ Blacksmith เมื่อ plan ต้องใช้ lane ที่ติดตั้งแพ็กเกจแล้ว; และนำ input `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรืออิมเมจ digest ของแพ็กเกจที่มีอยู่กลับมาใช้แทนการ rebuild การ pull อิมเมจ Docker จะ retry ด้วย timeout ที่มีขอบเขต 180 วินาทีต่อ attempt เพื่อให้ stream ของ registry/cache ที่ค้าง retry ได้เร็ว แทนที่จะกินเวลาส่วนใหญ่ของ critical path ใน CI

### Chunk ของเส้นทางรีลีส

coverage Docker ของรีลีสรันเป็น job แบบ chunk ขนาดเล็กด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละ chunk pull เฉพาะชนิดอิมเมจที่ต้องใช้ และ execute หลาย lane ผ่าน scheduler แบบถ่วงน้ำหนักเดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

ส่วน Docker ของรีลีสปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` และ `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` ส่วน `plugins-runtime-core`, `plugins-runtime` และ `plugins-integrations` ยังคงเป็นนามแฝงแบบรวมสำหรับ Plugin/รันไทม์ นามแฝงเลน `install-e2e` ยังคงเป็นนามแฝงสำหรับรันซ้ำด้วยตนเองแบบรวมของทั้งสองเลนตัวติดตั้งผู้ให้บริการ

OpenWebUI จะถูกรวมเข้าใน `plugins-runtime-services` เมื่อการครอบคลุมเส้นทางรีลีสเต็มรูปแบบร้องขอ และจะคงส่วน `openwebui` แบบแยกเดี่ยวไว้เฉพาะสำหรับการ dispatch เฉพาะ OpenWebUI เท่านั้น เลนอัปเดตช่องทางที่บันเดิลมาจะลองใหม่หนึ่งครั้งสำหรับความล้มเหลวชั่วคราวของเครือข่าย npm

แต่ละส่วนจะอัปโหลด `.artifacts/docker-tests/` พร้อมบันทึกของเลน เวลา, `summary.json`, `failures.json`, เวลาเฟส, JSON แผนตัวจัดกำหนดการ, ตารางเลนช้า และคำสั่งรันซ้ำรายเลน อินพุต `docker_lanes` ของ workflow จะรันเลนที่เลือกกับอิมเมจที่เตรียมไว้แทนงานของส่วน ซึ่งทำให้การดีบักเลนที่ล้มเหลวถูกจำกัดอยู่ในงาน Docker เป้าหมายเดียว และเตรียม ดาวน์โหลด หรือนำอาร์ติแฟกต์แพ็กเกจกลับมาใช้สำหรับการรันนั้น หากเลนที่เลือกเป็นเลน Docker แบบ live งานเป้าหมายจะสร้างอิมเมจ live-test ในเครื่องสำหรับการรันซ้ำนั้น คำสั่งรันซ้ำ GitHub รายเลนที่สร้างขึ้นจะรวม `package_artifact_run_id`, `package_artifact_name` และอินพุตอิมเมจที่เตรียมไว้เมื่อมีค่าเหล่านั้นอยู่ เพื่อให้เลนที่ล้มเหลวสามารถนำแพ็กเกจและอิมเมจชุดเดิมจากการรันที่ล้มเหลวกลับมาใช้ได้

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

workflow live/E2E แบบกำหนดเวลาไว้จะรันชุด Docker เส้นทางรีลีสเต็มรูปแบบทุกวัน

## Plugin รุ่นก่อนเผยแพร่

`Plugin Prerelease` เป็นการครอบคลุมผลิตภัณฑ์/แพ็กเกจที่มีค่าใช้จ่ายสูงกว่า จึงเป็น workflow แยกต่างหากที่ dispatch โดย `Full Release Validation` หรือโดยผู้ปฏิบัติงานที่ระบุอย่างชัดเจน Pull request ปกติ การ push ไปยัง `main` และการ dispatch CI แบบสแตนด์อโลนด้วยตนเองจะปิดชุดนั้นไว้ มันกระจายการทดสอบ Plugin ที่บันเดิลมาไปยัง worker ส่วนขยายแปดตัว งาน shard ของส่วนขยายเหล่านั้นจะรันกลุ่ม config ของ Plugin ได้สูงสุดครั้งละสองกลุ่ม โดยมี worker Vitest หนึ่งตัวต่อกลุ่มและ heap ของ Node ที่ใหญ่ขึ้น เพื่อให้แบตช์ Plugin ที่มีการ import หนักไม่สร้างงาน CI เพิ่ม เส้นทาง Docker รุ่นก่อนเผยแพร่เฉพาะรีลีสจะจัดกลุ่มเลน Docker เป้าหมายเป็นกลุ่มเล็กๆ เพื่อหลีกเลี่ยงการจอง runner หลายสิบตัวสำหรับงานที่ใช้เวลาหนึ่งถึงสามนาที workflow ยังอัปโหลดอาร์ติแฟกต์ `plugin-inspector-advisory` เพื่อให้ข้อมูลจาก `@openclaw/plugin-inspector`; ผลการตรวจของ inspector เป็นอินพุตสำหรับการคัดแยกและไม่เปลี่ยน gate ของ Plugin Prerelease ที่เป็นตัวบล็อก

## ห้องปฏิบัติการ QA

ห้องปฏิบัติการ QA มีเลน CI เฉพาะแยกจาก workflow หลักแบบกำหนดขอบเขตอัจฉริยะ ความเท่าเทียมแบบ agentic ถูกซ้อนอยู่ภายใต้ชุดทดสอบ QA แบบกว้างและ harness รีลีส ไม่ใช่ workflow PR แบบสแตนด์อโลน ใช้ `Full Release Validation` พร้อม `rerun_group=qa-parity` เมื่อความเท่าเทียมควรไปพร้อมกับการรันการตรวจสอบแบบกว้าง

- workflow `QA-Lab - All Lanes` รันทุกคืนบน `main` และเมื่อ dispatch ด้วยตนเอง โดยแตกงานออกเป็นเลนความเท่าเทียมแบบ mock, เลน Matrix แบบ live และเลน Telegram กับ Discord แบบ live ในฐานะงานคู่ขนาน งาน live ใช้ environment `qa-live-shared` และ Telegram/Discord ใช้ lease ของ Convex

การตรวจรีลีสรันเลนขนส่งแบบ live ของ Matrix และ Telegram ด้วยผู้ให้บริการ mock แบบกำหนดได้แน่นอนและโมเดลที่ผ่านคุณสมบัติ mock (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อแยกสัญญาของช่องทางออกจาก latency ของโมเดล live และการเริ่มต้นปกติของ provider-plugin Gateway การขนส่งแบบ live จะปิดการค้นหาหน่วยความจำ เพราะความเท่าเทียม QA ครอบคลุมพฤติกรรมหน่วยความจำแยกต่างหากแล้ว ส่วนการเชื่อมต่อผู้ให้บริการครอบคลุมโดยชุดแยกต่างหากสำหรับโมเดล live, ผู้ให้บริการ native และผู้ให้บริการ Docker

Matrix ใช้ `--profile fast` สำหรับ gate แบบกำหนดเวลาและ gate รีลีส โดยเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout มารองรับเท่านั้น ค่าเริ่มต้นของ CLI และอินพุต workflow ด้วยตนเองยังคงเป็น `all`; การ dispatch ด้วยตนเองที่ `matrix_profile=all` จะแบ่งการครอบคลุม Matrix เต็มรูปแบบเป็นงาน `transport`, `media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรันเลนห้องปฏิบัติการ QA ที่สำคัญต่อรีลีสก่อนอนุมัติรีลีสด้วย gate ความเท่าเทียม QA จะรันแพ็ก candidate และ baseline เป็นงานเลนคู่ขนาน จากนั้นดาวน์โหลดอาร์ติแฟกต์ทั้งสองเข้าไปในงานรายงานขนาดเล็กเพื่อเปรียบเทียบความเท่าเทียมขั้นสุดท้าย

สำหรับ PR ปกติ ให้ใช้หลักฐาน CI/การตรวจที่กำหนดขอบเขตแล้ว แทนการถือว่าความเท่าเทียมเป็นสถานะที่จำเป็น

## CodeQL

workflow `CodeQL` ตั้งใจให้เป็นสแกนเนอร์ความปลอดภัยรอบแรกแบบแคบ ไม่ใช่การกวาดทั้งรีโพซิทอรี การรันแบบรายวัน ด้วยตนเอง และ guard สำหรับ pull request ที่ไม่ใช่ draft จะสแกนโค้ด workflow ของ Actions รวมถึงพื้นผิว JavaScript/TypeScript ที่มีความเสี่ยงสูงสุดด้วย query ความปลอดภัยที่มีความมั่นใจสูง ซึ่งกรองเฉพาะ `security-severity` ระดับสูง/วิกฤต

guard ของ pull request ยังคงเบา: มันเริ่มต้นเฉพาะเมื่อมีการเปลี่ยนแปลงใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` หรือ `src` และรันเมทริกซ์ความปลอดภัยที่มีความมั่นใจสูงชุดเดียวกับ workflow แบบกำหนดเวลา ค่าเริ่มต้นของ PR จะไม่รวม CodeQL สำหรับ Android และ macOS

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                          | พื้นผิว                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, ข้อมูลลับ, แซนด์บ็อกซ์, Cron และ baseline ของ Gateway                                                                         |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการใช้งานช่องทางของ core รวมถึงรันไทม์ Plugin ของช่องทาง, Gateway, Plugin SDK, ข้อมูลลับ และจุดสัมผัสด้าน audit              |
| `/codeql-security-high/network-ssrf-boundary`     | พื้นผิวนโยบาย SSRF ของ core, การแยกวิเคราะห์ IP, network guard, web-fetch และ Plugin SDK                                           |
| `/codeql-security-high/mcp-process-tool-boundary` | เซิร์ฟเวอร์ MCP, helper การประมวลผล process, การส่งออกขาออก และ gate การรันเครื่องมือของ agent                                    |
| `/codeql-security-high/plugin-trust-boundary`     | พื้นผิวความเชื่อถือของการติดตั้ง Plugin, loader, manifest, registry, การติดตั้งผ่าน package-manager, source-loading และสัญญาแพ็กเกจ Plugin SDK |

### shard ความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — shard ความปลอดภัย Android แบบกำหนดเวลา สร้างแอป Android ด้วยตนเองสำหรับ CodeQL บน runner Blacksmith Linux ที่เล็กที่สุดซึ่ง workflow sanity ยอมรับได้ อัปโหลดใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — shard ความปลอดภัย macOS แบบรายสัปดาห์/ด้วยตนเอง สร้างแอป macOS ด้วยตนเองสำหรับ CodeQL บน Blacksmith macOS กรองผลการ build dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดใต้ `/codeql-critical-security/macos` คงไว้นอกค่าเริ่มต้นรายวันเพราะการ build macOS ครองเวลารันแม้เมื่อสะอาด

### หมวดหมู่คุณภาพวิกฤต

`CodeQL Critical Quality` คือ shard ฝั่ง non-security ที่คู่กัน มันรันเฉพาะ query คุณภาพ JavaScript/TypeScript แบบ non-security ระดับ error-severity บนพื้นผิวแคบที่มีมูลค่าสูงบน runner Blacksmith Linux ที่เล็กกว่า guard ของ pull request ตั้งใจให้เล็กกว่าโปรไฟล์แบบกำหนดเวลา: PR ที่ไม่ใช่ draft จะรันเฉพาะ shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` ที่ตรงกับการเปลี่ยนแปลงในโค้ดการรันคำสั่ง/โมเดล/เครื่องมือของ agent และการ dispatch การตอบกลับ, โค้ด config schema/migration/IO, โค้ด auth/ข้อมูลลับ/แซนด์บ็อกซ์/ความปลอดภัย, ช่องทาง core และรันไทม์ Plugin ของช่องทางที่บันเดิลมา, protocol/server-method ของ Gateway, รันไทม์หน่วยความจำ/SDK glue, MCP/process/การส่งออกขาออก, รันไทม์ผู้ให้บริการ/แคตตาล็อกโมเดล, session diagnostics/คิวการส่ง, loader ของ Plugin, สัญญา Plugin SDK/แพ็กเกจ หรือรันไทม์การตอบกลับของ Plugin SDK การเปลี่ยนแปลง config ของ CodeQL และ workflow คุณภาพจะรัน shard คุณภาพของ PR ทั้งสิบสองรายการ

การ dispatch ด้วยตนเองยอมรับ:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

โปรไฟล์แบบแคบเป็น hook สำหรับการสอน/การทำซ้ำเพื่อรัน shard คุณภาพหนึ่งรายการแบบแยกเดี่ยว

| หมวดหมู่                                                | พื้นผิว                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ดขอบเขตความปลอดภัยของการยืนยันตัวตน ความลับ sandbox, cron และ gateway                                                                                         |
| `/codeql-critical-quality/config-boundary`              | สัญญาของสคีมา config, การย้ายข้อมูล, การทำ normalization และ IO                                                                                                  |
| `/codeql-critical-quality/gateway-runtime-boundary`     | สคีมาโปรโตคอล Gateway และสัญญาเมธอดของเซิร์ฟเวอร์                                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญาการใช้งานช่องทางหลักและ Plugin ช่องทางที่รวมมาให้                                                                                                           |
| `/codeql-critical-quality/agent-runtime-boundary`       | สัญญารันไทม์ของการเรียกใช้คำสั่ง, การ dispatch โมเดล/ผู้ให้บริการ, การ dispatch และคิว auto-reply, และ control-plane ของ ACP                                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | เซิร์ฟเวอร์ MCP และบริดจ์เครื่องมือ, ตัวช่วยกำกับดูแล process, และสัญญาการส่งออก                                                                                |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK โฮสต์ memory, facade รันไทม์ memory, alias ของ Plugin SDK สำหรับ memory, glue สำหรับเปิดใช้งานรันไทม์ memory, และคำสั่ง doctor สำหรับ memory                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | ส่วนภายในของคิวตอบกลับ, คิวส่งมอบเซสชัน, ตัวช่วยผูก/ส่งมอบเซสชันขาออก, พื้นผิว event/log bundle สำหรับวินิจฉัย, และสัญญา CLI ของ session doctor              |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | การ dispatch การตอบกลับขาเข้าของ Plugin SDK, ตัวช่วย payload/chunking/runtime สำหรับการตอบกลับ, ตัวเลือกการตอบกลับของช่องทาง, คิวส่งมอบ, และตัวช่วยผูก session/thread |
| `/codeql-critical-quality/provider-runtime-boundary`    | การทำ normalization ของแคตตาล็อกโมเดล, การยืนยันตัวตนและการค้นพบผู้ให้บริการ, การลงทะเบียนรันไทม์ผู้ให้บริการ, ค่าเริ่มต้น/แคตตาล็อกของผู้ให้บริการ, และ registry ของ web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | การ bootstrap ของ UI ควบคุม, persistence ในเครื่อง, flow การควบคุม Gateway, และสัญญารันไทม์ของ task control-plane                                                |
| `/codeql-critical-quality/web-media-runtime-boundary`   | สัญญารันไทม์ของ core web fetch/search, media IO, การทำความเข้าใจสื่อ, การสร้างภาพ, และการสร้างสื่อ                                                              |
| `/codeql-critical-quality/plugin-boundary`              | สัญญาของ loader, registry, public-surface, และ entrypoint ของ Plugin SDK                                                                                         |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | ซอร์ส Plugin SDK ฝั่งแพ็กเกจที่เผยแพร่แล้ว และตัวช่วยสัญญาแพ็กเกจ Plugin                                                                                         |

คุณภาพยังแยกจากความปลอดภัย เพื่อให้สามารถจัดตาราง วัดผล ปิดใช้งาน หรือขยาย finding ด้านคุณภาพได้โดยไม่บดบังสัญญาณความปลอดภัย การขยาย CodeQL สำหรับ Swift, Python และ bundled-plugin ควรถูกเพิ่มกลับมาเป็นงานตามผลแบบจำกัด scope หรือแยก shard เท่านั้น หลังจากโปรไฟล์แบบแคบมีรันไทม์และสัญญาณที่เสถียรแล้ว

## เวิร์กโฟลว์การบำรุงรักษา

### Docs Agent

เวิร์กโฟลว์ `Docs Agent` เป็นเลนบำรุงรักษาของ Codex ที่ขับเคลื่อนด้วย event สำหรับคงให้เอกสารที่มีอยู่สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง land แล้ว ไม่มี schedule ล้วน: การรัน CI จาก push ที่สำเร็จและไม่ใช่บ็อตบน `main` สามารถ trigger ได้ และ manual dispatch สามารถรันได้โดยตรง การเรียกใช้จาก workflow-run จะข้ามเมื่อ `main` เดินหน้าไปแล้ว หรือเมื่อมีการสร้างการรัน Docs Agent แบบไม่ถูกข้ามอีกรายการภายในชั่วโมงที่ผ่านมา เมื่อรัน จะตรวจทานช่วง commit ตั้งแต่ source SHA ของ Docs Agent แบบไม่ถูกข้ามก่อนหน้าไปจนถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงหนึ่งครั้งจึงครอบคลุมการเปลี่ยนแปลงบน main ทั้งหมดที่สะสมตั้งแต่รอบตรวจเอกสารครั้งล่าสุดได้

### Test Performance Agent

เวิร์กโฟลว์ `Test Performance Agent` เป็นเลนบำรุงรักษาของ Codex ที่ขับเคลื่อนด้วย event สำหรับ test ที่ช้า ไม่มี schedule ล้วน: การรัน CI จาก push ที่สำเร็จและไม่ใช่บ็อตบน `main` สามารถ trigger ได้ แต่จะข้ามหากมีการเรียกใช้จาก workflow-run อีกรายการที่รันไปแล้วหรือกำลังรันอยู่ในวัน UTC เดียวกัน Manual dispatch จะข้าม daily activity gate นั้น เลนนี้สร้างรายงานประสิทธิภาพ Vitest แบบ full-suite grouped ให้ Codex ทำเฉพาะการแก้ไขประสิทธิภาพ test ขนาดเล็กที่รักษา coverage ไว้ แทนการ refactor กว้าง แล้วรันรายงาน full-suite อีกครั้งและปฏิเสธการเปลี่ยนแปลงที่ลดจำนวน test baseline ที่ผ่าน หาก baseline มี test ที่ล้มเหลว Codex อาจแก้เฉพาะ failure ที่ชัดเจน และรายงาน full-suite หลัง agent ต้องผ่านก่อนจึงจะ commit อะไรได้ เมื่อ `main` เดินหน้าก่อน bot push จะ land เลนนี้จะ rebase patch ที่ validate แล้ว รัน `pnpm check:changed` อีกครั้ง และลอง push ใหม่; patch ที่ stale และ conflict จะถูกข้าม ใช้ GitHub-hosted Ubuntu เพื่อให้ Codex action คง posture ความปลอดภัยแบบ drop-sudo เดียวกับ docs agent ได้

### PR ซ้ำหลัง Merge

เวิร์กโฟลว์ `Duplicate PRs After Merge` เป็นเวิร์กโฟลว์ maintainer แบบ manual สำหรับทำความสะอาด duplicate หลัง land โดยค่าเริ่มต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุอย่างชัดเจนเมื่อ `apply=true` ก่อน mutate GitHub จะตรวจสอบว่า PR ที่ land แล้วถูก merge แล้ว และ duplicate แต่ละรายการมี issue ที่อ้างอิงร่วมกันหรือมี hunk ที่เปลี่ยนทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Local check gates และ changed routing

ตรรกะ local changed-lane อยู่ใน `scripts/changed-lanes.mjs` และถูก execute โดย `scripts/check-changed.mjs` local check gate นั้นเข้มงวดกว่า scope ของแพลตฟอร์ม CI แบบกว้างในเรื่องขอบเขตสถาปัตยกรรม:

- การเปลี่ยนแปลง production ของ core รัน typecheck ของ core prod และ core test รวมถึง lint/guards ของ core;
- การเปลี่ยนแปลงเฉพาะ test ของ core รันเฉพาะ typecheck ของ core test รวมถึง lint ของ core;
- การเปลี่ยนแปลง production ของ extension รัน typecheck ของ extension prod และ extension test รวมถึง lint ของ extension;
- การเปลี่ยนแปลงเฉพาะ test ของ extension รัน typecheck ของ extension test รวมถึง lint ของ extension;
- การเปลี่ยนแปลง public Plugin SDK หรือ plugin-contract ขยายไปยัง typecheck ของ extension เพราะ extensions พึ่งพาสัญญา core เหล่านั้น (การ sweep extension ของ Vitest ยังเป็นงาน test ที่ต้องระบุชัดเจน);
- การ bump เวอร์ชันแบบ release metadata-only รันการตรวจ version/config/root-dependency แบบ targeted;
- การเปลี่ยนแปลง root/config ที่ไม่รู้จัก fail safe ไปยัง check lane ทั้งหมด

local changed-test routing อยู่ใน `scripts/test-projects.test-support.mjs` และตั้งใจให้ถูกกว่า `check:changed`: การแก้ไข test โดยตรงรันตัวเอง, การแก้ไข source จะเลือก mapping ที่ระบุชัดเจนก่อน แล้วจึงเป็น sibling tests และ dependent จาก import-graph config การส่งมอบ shared group-room เป็นหนึ่งใน mapping ที่ระบุชัดเจน: การเปลี่ยนแปลง config visible-reply ของกลุ่ม, source reply delivery mode, หรือ system prompt ของ message-tool จะ route ผ่าน core reply tests รวมถึง regression การส่งมอบของ Discord และ Slack เพื่อให้การเปลี่ยนค่าเริ่มต้นร่วมกันล้มเหลวก่อน push PR ครั้งแรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างระดับ harness จนชุด mapped ราคาถูกไม่น่าเชื่อถือพอเป็น proxy

## การ validate ด้วย Testbox

Crabbox คือ wrapper remote-box ที่ repo เป็นเจ้าของสำหรับ proof บน Linux ของ maintainer ใช้จาก repo root เมื่อ check กว้างเกินไปสำหรับ local edit loop, เมื่อความเทียบเท่า CI สำคัญ, หรือเมื่อ proof ต้องใช้ secrets, Docker, package lanes, กล่องที่นำกลับมาใช้ซ้ำได้, หรือ remote logs backend ปกติของ OpenClaw คือ `blacksmith-testbox`; capacity ของ AWS/Hetzner ที่เป็นเจ้าของเป็น fallback สำหรับเหตุ Blacksmith outage, quota issue, หรือการทดสอบ owned-capacity ที่ระบุชัดเจน

การรัน Blacksmith ที่หนุนโดย Crabbox จะ warm, claim, sync, run, report และ clean up Testbox แบบ one-shot sanity check ของ sync ที่มีมาให้จะ fail fast เมื่อไฟล์ root ที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short` แสดง tracked deletions อย่างน้อย 200 รายการ สำหรับ PR ที่ตั้งใจลบไฟล์จำนวนมาก ให้ตั้ง `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับ remote command

Crabbox ยัง terminate การเรียกใช้ Blacksmith CLI ในเครื่องที่ค้างอยู่ในเฟส sync นานเกินห้านาทีโดยไม่มี output หลัง sync ตั้ง `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` เพื่อปิด guard นั้น หรือใช้ค่ามิลลิวินาทีที่มากขึ้นสำหรับ local diff ที่ใหญ่ผิดปกติ

ก่อนรันครั้งแรก ให้ตรวจ wrapper จาก repo root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

repo wrapper จะปฏิเสธ binary Crabbox ที่ stale ซึ่งไม่ได้ advertise `blacksmith-testbox` ส่ง provider อย่างชัดเจนแม้ว่า `.crabbox.yaml` จะมีค่าเริ่มต้น owned-cloud อยู่แล้ว

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

รัน test แบบ focused ซ้ำ:

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

Full suite:

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

อ่านสรุป JSON สุดท้าย ฟิลด์ที่มีประโยชน์คือ `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, และ `totalMs` การรัน Crabbox แบบ one-shot ที่หนุนโดย Blacksmith ควรหยุด Testbox โดยอัตโนมัติ; หากการรันถูก interrupt หรือ cleanup ไม่ชัดเจน ให้ inspect กล่องที่ live และหยุดเฉพาะกล่องที่คุณสร้าง:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

ใช้ reuse เฉพาะเมื่อคุณตั้งใจต้องใช้หลายคำสั่งบนกล่อง hydrated เดียวกัน:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

หาก Crabbox เป็นเลเยอร์ที่เสีย แต่ Blacksmith เองยังทำงาน ให้ใช้ Blacksmith โดยตรงเฉพาะสำหรับ diagnostics เช่น `list`, `status` และ cleanup แก้ path ของ Crabbox ก่อนถือว่าการรัน Blacksmith โดยตรงเป็น maintainer proof

หาก `blacksmith testbox list --all` และ `blacksmith testbox status` ทำงาน แต่ warmup ใหม่ค้างที่ `queued` โดยไม่มี IP หรือ URL ของ Actions run หลังผ่านไปสองสามนาที ให้ถือว่าเป็นแรงกดดันจาก provider, queue, billing หรือ org-limit ของ Blacksmith หยุด queued ids ที่คุณสร้าง หลีกเลี่ยงการเริ่ม Testbox เพิ่ม และย้าย proof ไปยัง path capacity ของ Crabbox ที่เป็นเจ้าของด้านล่าง ขณะที่มีคนตรวจ dashboard, billing และ org limits ของ Blacksmith

Escalate ไปยัง capacity ของ Crabbox ที่เป็นเจ้าของเฉพาะเมื่อ Blacksmith ล่ม, ถูกจำกัด quota, ขาด environment ที่จำเป็น, หรือ owned capacity เป็นเป้าหมายอย่างชัดเจน:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

เมื่อ AWS มีแรงกดดันด้านความจุ ให้หลีกเลี่ยง `class=beast` เว้นแต่งานนั้นต้องใช้ CPU ระดับคลาส 48xlarge จริง ๆ คำขอ `beast` เริ่มที่ 192 vCPU และเป็นวิธีที่ง่ายที่สุดในการชนโควตา EC2 Spot หรือ On-Demand Standard ระดับภูมิภาค ค่าเริ่มต้น `.crabbox.yaml` ที่รีโปเป็นเจ้าของคือ `standard`, ภูมิภาคความจุหลายแห่ง และ `capacity.hints: true` เพื่อให้ lease ของ AWS ที่ผ่าน broker พิมพ์ภูมิภาค/ตลาดที่เลือก แรงกดดันของโควตา การถอยกลับไปใช้ Spot และคำเตือนคลาสที่มีแรงกดดันสูง ใช้ `fast` สำหรับการตรวจสอบกว้าง ๆ ที่หนักกว่า ใช้ `large` เฉพาะหลังจาก standard/fast ยังไม่พอ และใช้ `beast` เฉพาะเลนที่ใช้ CPU สูงเป็นกรณีพิเศษ เช่น เมทริกซ์ Docker แบบเต็มชุดหรือทุก Plugin การตรวจสอบ release/blocker อย่างชัดเจน หรือการทำโปรไฟล์ประสิทธิภาพแบบหลายคอร์ ห้ามใช้ `beast` สำหรับ `pnpm check:changed`, การทดสอบแบบเจาะจง, งานเฉพาะเอกสาร, lint/typecheck ทั่วไป, การ repro E2E ขนาดเล็ก หรือการ triage เหตุขัดข้องของ Blacksmith ใช้ `--market on-demand` สำหรับการวินิจฉัยความจุ เพื่อไม่ให้ความผันผวนของตลาด Spot ปะปนกับสัญญาณ

`.crabbox.yaml` เป็นเจ้าของค่าเริ่มต้นของ provider, sync และ hydration ของ GitHub Actions สำหรับเลน owned-cloud ไฟล์นี้ไม่รวม `.git` ในเครื่อง เพื่อให้ checkout ของ Actions ที่ถูก hydrate เก็บเมทาดาทา Git ระยะไกลของตัวเองไว้ แทนที่จะซิงก์รีโมตและ object store ในเครื่องของ maintainer และไม่รวมอาร์ติแฟกต์ runtime/build ในเครื่องที่ไม่ควรถูกถ่ายโอนเด็ดขาด `.github/workflows/crabbox-hydrate.yml` เป็นเจ้าของ checkout, การตั้งค่า Node/pnpm, การ fetch `origin/main` และการส่งต่อสภาพแวดล้อมที่ไม่ใช่ความลับสำหรับคำสั่ง `crabbox run --id <cbx_id>` ของ owned-cloud

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
