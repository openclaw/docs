---
read_when:
    - คุณต้องเข้าใจว่าเหตุใดงาน CI จึงทำงานหรือไม่ทำงาน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการรันหรือการรันซ้ำเพื่อตรวจสอบความถูกต้องของรีลีส
    - คุณกำลังเปลี่ยนการ dispatch ของ ClawSweeper หรือการส่งต่อกิจกรรม GitHub
summary: กราฟงาน CI, เกตตามขอบเขต, ชุดครอบคลุมการเผยแพร่ และคำสั่งภายในเครื่องที่เทียบเท่า
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-05-10T19:26:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4317a3985fd34470c4b9fd981a2048af9c395bdc65fe99853286628d1ee47d3
    source_path: ci.md
    workflow: 16
---

OpenClaw CI ทำงานทุกครั้งที่ push ไปยัง `main` และทุก pull request งาน `preflight` จะจัดประเภท diff และปิด lane ที่มีค่าใช้จ่ายสูงเมื่อมีเพียงพื้นที่ที่ไม่เกี่ยวข้องเปลี่ยนแปลง การรันแบบ manual `workflow_dispatch` ตั้งใจข้าม smart scoping และกระจายไปยังกราฟเต็มสำหรับ release candidate และการตรวจสอบแบบกว้าง lane ของ Android ยังคงเป็นแบบ opt-in ผ่าน `include_android` ความครอบคลุมของ Plugin เฉพาะ release อยู่ใน workflow แยก [`Plugin Prerelease`](#plugin-prerelease) และจะรันจาก [`การตรวจสอบ Release แบบเต็ม`](#full-release-validation) หรือการ dispatch แบบ manual ที่ระบุชัดเท่านั้น

## ภาพรวม Pipeline

| งาน                              | วัตถุประสงค์                                                                                                   | ทำงานเมื่อใด                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | ตรวจจับการเปลี่ยนแปลงเฉพาะ docs, scope ที่เปลี่ยน, extension ที่เปลี่ยน และสร้าง manifest ของ CI                   | ทำงานเสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-scm-fast`              | ตรวจจับ private key และตรวจสอบ workflow ผ่าน `zizmor`                                                     | ทำงานเสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-dependency-audit`      | ตรวจสอบ production lockfile แบบไม่ต้องใช้ dependency เทียบกับ advisory ของ npm                                          | ทำงานเสมอบน push และ PR ที่ไม่ใช่ draft |
| `security-fast`                  | ผลรวมที่บังคับใช้สำหรับงาน security แบบเร็ว                                                             | ทำงานเสมอบน push และ PR ที่ไม่ใช่ draft |
| `check-dependencies`             | pass เฉพาะ production Knip dependency พร้อม guard สำหรับ allowlist ของไฟล์ที่ไม่ถูกใช้                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-artifacts`                | build `dist/`, Control UI, ตรวจ artifact ที่ build แล้ว และ artifact downstream ที่นำกลับมาใช้ซ้ำได้                       | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-core`               | lane ความถูกต้องบน Linux แบบเร็ว เช่น การตรวจ bundled/plugin-contract/protocol                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-contracts-channels` | ตรวจ channel contract แบบ shard พร้อมผลตรวจรวมที่เสถียร                                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-core-test`          | shard ของการทดสอบ core Node โดยไม่รวม lane ของ channel, bundled, contract และ extension                          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check`                          | เทียบเท่า gate หลักใน local แบบ shard: prod types, lint, guards, test types และ strict smoke                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check-additional`               | architecture, boundary/prompt drift แบบ shard, extension guards, package boundary และ gateway watch        | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-smoke`                    | smoke test ของ CLI ที่ build แล้ว และ smoke ของ startup-memory                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks`                         | verifier สำหรับการทดสอบ channel ของ artifact ที่ build แล้ว                                                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-compat-node22`      | lane build และ smoke สำหรับความเข้ากันได้กับ Node 22                                                                | dispatch CI แบบ manual สำหรับ release    |
| `check-docs`                     | ตรวจ formatting, lint และ broken-link ของ docs                                                             | docs เปลี่ยน                       |
| `skills-python`                  | Ruff + pytest สำหรับ Skills ที่มี Python รองรับ                                                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python-skill      |
| `checks-windows`                 | การทดสอบ process/path เฉพาะ Windows พร้อม regression ของ runtime import specifier ที่ใช้ร่วมกัน                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows           |
| `macos-node`                     | lane ทดสอบ TypeScript บน macOS โดยใช้ artifact ที่ build แล้วร่วมกัน                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `macos-swift`                    | Swift lint, build และทดสอบสำหรับแอป macOS                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `android`                        | unit test ของ Android สำหรับทั้งสอง flavor พร้อม build APK debug หนึ่งรายการ                                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android           |
| `test-performance-agent`         | การปรับแต่ง slow-test ของ Codex รายวันหลังจากกิจกรรมที่ trusted                                                 | CI บน main สำเร็จหรือ dispatch แบบ manual |
| `openclaw-performance`           | รายงานประสิทธิภาพ runtime ของ Kova แบบรายวัน/ตามต้องการ พร้อม lane mock-provider, deep-profile และ GPT 5.4 live | ตาม schedule และ dispatch แบบ manual      |

## ลำดับ Fail-fast

1. `preflight` ตัดสินว่า lane ใดมีอยู่บ้างตั้งแต่แรก logic `docs-scope` และ `changed-scope` เป็น step ภายในงานนี้ ไม่ใช่งานแยกเดี่ยว
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` fail ได้อย่างรวดเร็วโดยไม่ต้องรอ artifact ที่หนักกว่าและงาน matrix ของ platform
3. `build-artifacts` ทำงานทับซ้อนกับ lane Linux แบบเร็ว เพื่อให้ consumer downstream เริ่มได้ทันทีที่ shared build พร้อม
4. lane platform และ runtime ที่หนักกว่าจะกระจายออกหลังจากนั้น: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่ว่า `cancelled` เมื่อมี push ใหม่กว่าลงบน PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่าเป็น noise ของ CI เว้นแต่ run ล่าสุดสำหรับ ref เดียวกันก็ล้มเหลวด้วย check รวมของ shard ใช้ `!cancelled() && always()` เพื่อให้ยังรายงาน failure ปกติของ shard แต่ไม่ queue ต่อหลังจาก workflow ทั้งหมดถูกแทนที่ไปแล้ว key concurrency อัตโนมัติของ CI มีเวอร์ชัน (`CI-v7-*`) เพื่อไม่ให้ zombie ฝั่ง GitHub ใน queue group เก่าบล็อก run บน main ที่ใหม่กว่าไปเรื่อย ๆ run แบบ full-suite ด้วย manual ใช้ `CI-manual-v1-*` และไม่ cancel run ที่กำลังดำเนินอยู่

งาน `ci-timings-summary` อัปโหลด artifact ขนาดกะทัดรัดชื่อ `ci-timings-summary` สำหรับ CI run ที่ไม่ใช่ draft แต่ละรายการ โดยบันทึก wall time, queue time, งานที่ช้าที่สุด และงานที่ล้มเหลวสำหรับ run ปัจจุบัน เพื่อให้การตรวจสุขภาพ CI ไม่ต้อง scrape payload ทั้งหมดของ Actions ซ้ำ ๆ

## Scope และ routing

logic ของ scope อยู่ใน `scripts/ci-changed-scope.mjs` และมี unit test ครอบคลุมใน `src/scripts/ci-changed-scope.test.ts` manual dispatch จะข้ามการตรวจจับ changed-scope และทำให้ manifest ของ preflight ทำเหมือนทุกพื้นที่ที่มี scope เปลี่ยนแปลง

- **การแก้ไข workflow ของ CI** ตรวจสอบกราฟ CI ของ Node พร้อม workflow linting แต่ไม่บังคับ build native ของ Windows, Android หรือ macOS ด้วยตัวเอง lane ของ platform เหล่านั้นยังคง scoped ตามการเปลี่ยนแปลงของ source สำหรับ platform
- **การแก้ไขเฉพาะ routing ของ CI, การแก้ไข fixture core-test ราคาถูกบางรายการ และการแก้ไข helper/test-routing ของ plugin contract แบบแคบ** ใช้ path manifest แบบ Node-only ที่เร็ว: `preflight`, security และ task `checks-fast-core` เพียงรายการเดียว path นั้นข้าม build artifact, ความเข้ากันได้กับ Node 22, channel contracts, shard core แบบเต็ม, shard bundled-plugin และ matrix guard เพิ่มเติม เมื่อการเปลี่ยนแปลงจำกัดอยู่ที่พื้นผิว routing หรือ helper ที่ task แบบเร็วทดสอบโดยตรง
- **การตรวจ Node บน Windows** scoped ไปยัง wrapper process/path เฉพาะ Windows, helper runner ของ npm/pnpm/UI, config ของ package manager และพื้นผิว workflow ของ CI ที่ execute lane นั้น การเปลี่ยนแปลง source, plugin, install-smoke และ test-only ที่ไม่เกี่ยวข้องยังคงอยู่บน lane Linux Node

ตระกูลการทดสอบ Node ที่ช้าที่สุดถูกแยกหรือ balance เพื่อให้งานแต่ละรายการยังเล็กโดยไม่ reserve runner มากเกินไป: channel contracts รันเป็น shard แบบถ่วงน้ำหนักสามรายการที่มี Blacksmith รองรับ พร้อม fallback เป็น runner มาตรฐานของ GitHub, lane core unit fast/support แยกรันต่างหาก, core runtime infra แบ่งระหว่าง state, process/config, cron และ shard ที่ใช้ร่วมกัน, auto-reply รันเป็น worker ที่ balance แล้ว (โดยแยก subtree ของ reply เป็น shard agent-runner, dispatch และ commands/state-routing) และ config ของ agentic gateway/server แยกข้าม lane chat/auth/model/http-plugin/runtime/startup แทนการรอ artifact ที่ build แล้ว การทดสอบ browser, QA, media และ plugin อื่น ๆ แบบกว้างใช้ config Vitest เฉพาะของตัวเองแทน catch-all ของ plugin ที่ใช้ร่วมกัน shard แบบ include-pattern บันทึก timing entry โดยใช้ชื่อ shard ของ CI เพื่อให้ `.artifacts/vitest-shard-timings.json` แยกความแตกต่างระหว่าง config ทั้งชุดกับ shard ที่ถูกกรองได้ `check-additional` เก็บงาน compile/canary ของ package-boundary ไว้ด้วยกัน และแยก architecture ของ runtime topology ออกจาก coverage ของ gateway watch รายการ boundary guard ถูก stripe ข้าม matrix shard สี่รายการ โดยแต่ละรายการรัน guard อิสระที่เลือกไว้พร้อมกันและพิมพ์ timing ต่อ check การตรวจ drift ของ Codex happy-path prompt snapshot ที่มีค่าใช้จ่ายสูงรันเป็นงาน additional ของตัวเองสำหรับ manual CI และเฉพาะการเปลี่ยนแปลงที่กระทบ prompt เท่านั้น ดังนั้นการเปลี่ยนแปลง Node ที่ไม่เกี่ยวข้องตามปกติจะไม่ต้องรออยู่หลังการสร้าง prompt snapshot แบบ cold และ shard boundary ยัง balance อยู่ ขณะที่ prompt drift ยังคงถูก pin กับ PR ที่ทำให้เกิด drift นั้น flag เดียวกันข้ามการสร้าง prompt snapshot ของ Vitest ภายใน shard support-boundary ของ core ใน built-artifact ด้วย Gateway watch, การทดสอบ channel และ shard support-boundary ของ core รันพร้อมกันภายใน `build-artifacts` หลังจาก `dist/` และ `dist-runtime/` build เสร็จแล้ว

Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` แล้วจึง build Play debug APK flavor ของ third-party ไม่มี source set หรือ manifest แยก lane unit-test ของมันยังคง compile flavor พร้อม flag BuildConfig ของ SMS/call-log ในขณะหลีกเลี่ยงงาน packaging debug APK ที่ซ้ำกันในทุก push ที่เกี่ยวข้องกับ Android

shard `check-dependencies` รัน `pnpm deadcode:dependencies` (pass เฉพาะ production Knip dependency ที่ pin กับ Knip เวอร์ชันล่าสุด โดยปิดอายุ release ขั้นต่ำของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบ finding ของไฟล์ production ที่ไม่ได้ใช้จาก Knip กับ `scripts/deadcode-unused-files.allowlist.mjs` guard ของ unused-file จะ fail เมื่อ PR เพิ่มไฟล์ที่ไม่ได้ใช้ใหม่โดยยังไม่ผ่านการ review หรือทิ้ง entry ใน allowlist ที่ stale ไว้ ขณะยังคงรักษาพื้นผิว dynamic plugin, generated, build, live-test และ package bridge ที่ตั้งใจไว้ซึ่ง Knip resolve แบบ static ไม่ได้

## การส่งต่อกิจกรรม ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` เป็น bridge ฝั่ง target จากกิจกรรม repository ของ OpenClaw ไปยัง ClawSweeper โดยไม่ checkout หรือ execute code จาก pull request ที่ไม่ trusted workflow สร้าง token ของ GitHub App จาก `CLAWSWEEPER_APP_PRIVATE_KEY` แล้ว dispatch payload `repository_dispatch` ขนาดกะทัดรัดไปยัง `openclaw/clawsweeper`

workflow มีสี่ lane:

- `clawsweeper_item` สำหรับคำขอ review issue และ pull request แบบระบุชัด;
- `clawsweeper_comment` สำหรับคำสั่ง ClawSweeper ที่ระบุชัดใน comment ของ issue;
- `clawsweeper_commit_review` สำหรับคำขอ review ระดับ commit บน push ไปยัง `main`;
- `github_activity` สำหรับกิจกรรม GitHub ทั่วไปที่ agent ClawSweeper อาจตรวจสอบ

lane `github_activity` ส่งต่อเฉพาะ metadata ที่ normalize แล้ว: event type, action, actor, repository, item number, URL, title, state และ excerpt สั้น ๆ สำหรับ comment หรือ review เมื่อมี โดยตั้งใจหลีกเลี่ยงการส่งต่อ body ของ webhook ทั้งหมด workflow ฝั่งรับใน `openclaw/clawsweeper` คือ `.github/workflows/github-activity.yml` ซึ่ง post event ที่ normalize แล้วไปยัง hook ของ OpenClaw Gateway สำหรับ agent ClawSweeper

กิจกรรมทั่วไปเป็นการสังเกตการณ์ ไม่ใช่การส่งมอบโดย default agent ClawSweeper ได้รับ target Discord ใน prompt และควร post ไปยัง `#clawsweeper` เฉพาะเมื่อ event นั้นน่าประหลาดใจ, ดำเนินการได้, มีความเสี่ยง หรือมีประโยชน์เชิงปฏิบัติการ การเปิดทั่วไป, การแก้ไข, churn จาก bot, noise ของ webhook ที่ซ้ำกัน และ traffic review ปกติควรให้ผลเป็น `NO_REPLY`

ปฏิบัติต่อชื่อ GitHub, ความคิดเห็น, เนื้อหา, ข้อความรีวิว, ชื่อสาขา และข้อความคอมมิตเป็นข้อมูลที่ไม่น่าเชื่อถือตลอดเส้นทางนี้ ข้อมูลเหล่านี้เป็นอินพุตสำหรับการสรุปและการคัดแยก ไม่ใช่คำสั่งสำหรับเวิร์กโฟลว์หรือรันไทม์ของเอเจนต์

## การสั่งรันด้วยตนเอง

การสั่งรัน CI ด้วยตนเองจะรันกราฟงานเดียวกับ CI ปกติ แต่บังคับเปิดเลนที่อยู่ในขอบเขตที่ไม่ใช่ Android ทั้งหมด: ชาร์ด Linux Node, ชาร์ด Plugin ที่รวมมาให้, สัญญาช่องทาง, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, การตรวจเอกสาร, Python skills, Windows, macOS และ Control UI i18n การสั่งรัน CI แบบสแตนด์อโลนด้วยตนเองจะรัน Android เท่านั้นด้วย `include_android=true`; ชุดครอบการเผยแพร่เต็มรูปแบบจะเปิด Android โดยส่ง `include_android=true` การตรวจแบบสแตติกก่อนเผยแพร่ Plugin, ชาร์ดสำหรับการเผยแพร่เท่านั้น `agentic-plugins`, การกวาดชุดส่วนขยายทั้งหมด และเลน Docker ก่อนเผยแพร่ Plugin จะถูกยกเว้นจาก CI ชุดทดสอบ Docker ก่อนเผยแพร่จะรันเฉพาะเมื่อ `Full Release Validation` สั่งรันเวิร์กโฟลว์ `Plugin Prerelease` แยกต่างหากพร้อมเปิดเกตตรวจสอบการเผยแพร่

การรันด้วยตนเองใช้กลุ่ม concurrency ที่ไม่ซ้ำกัน เพื่อไม่ให้ชุดเต็มของ release-candidate ถูกยกเลิกโดยการ push หรือการรัน PR อื่นบน ref เดียวกัน อินพุตเสริม `target_ref` ทำให้ผู้เรียกที่เชื่อถือได้รันกราฟนั้นกับสาขา แท็ก หรือ SHA คอมมิตแบบเต็มได้ โดยใช้ไฟล์เวิร์กโฟลว์จาก ref ที่เลือกสำหรับการสั่งรัน

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## ตัวรัน

| ตัวรัน                           | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, งานความปลอดภัยแบบเร็วและงานรวม (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจโปรโตคอล/สัญญา/สิ่งที่รวมมาให้แบบเร็ว, การตรวจสัญญาช่องทางแบบแบ่งชาร์ด, ชาร์ด `check` ยกเว้น lint, งานรวม `check-additional`, ตัวตรวจยืนยันงานรวมการทดสอบ Node, การตรวจเอกสาร, Python skills, workflow-sanity, labeler, auto-response; preflight ของ install-smoke ก็ใช้ Ubuntu ที่โฮสต์โดย GitHub เพื่อให้เมทริกซ์ Blacksmith เข้าคิวได้เร็วขึ้น |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, ชาร์ดส่วนขยายที่น้ำหนักต่ำกว่า, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` และ `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, ชาร์ดทดสอบ Linux Node, ชาร์ดทดสอบ Plugin ที่รวมมาให้, ชาร์ด `check-additional`, `android`                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (ไวต่อ CPU มากพอที่ 8 vCPU มีต้นทุนสูงกว่าสิ่งที่ประหยัดได้); บิลด์ Docker ของ install-smoke (เวลาเข้าคิว 32-vCPU มีต้นทุนสูงกว่าสิ่งที่ประหยัดได้)                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; fork จะย้อนกลับไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; fork จะย้อนกลับไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

CI ของรีโพ canonical จะคง Blacksmith เป็นเส้นทางตัวรันเริ่มต้น ระหว่าง `preflight`, `scripts/ci-runner-labels.mjs` จะตรวจการรัน Actions ล่าสุดที่กำลังเข้าคิวและกำลังดำเนินการ เพื่อหางาน Blacksmith ที่เข้าคิวอยู่ หากป้ายกำกับ Blacksmith เฉพาะมีงานเข้าคิวอยู่แล้ว งานปลายน้ำที่จะใช้ป้ายกำกับนั้นพอดีจะย้อนกลับไปใช้ตัวรันที่โฮสต์โดย GitHub ที่ตรงกัน (`ubuntu-24.04`, `windows-2025` หรือ `macos-latest`) เฉพาะสำหรับการรันนั้นเท่านั้น ขนาด Blacksmith อื่นในตระกูล OS เดียวกันยังคงใช้ป้ายกำกับหลักของตน หากการ probe API ล้มเหลว จะไม่มีการ fallback ใดๆ

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

`OpenClaw Performance` คือเวิร์กโฟลว์ประสิทธิภาพของผลิตภัณฑ์/รันไทม์ โดยจะรันทุกวันบน `main` และสามารถสั่งรันด้วยตนเองได้:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

โดยปกติการสั่งรันด้วยตนเองจะทำ benchmark กับ ref ของเวิร์กโฟลว์ ตั้งค่า `target_ref` เพื่อทำ benchmark กับแท็กรีลีสหรือสาขาอื่นด้วยการติดตั้งใช้งานเวิร์กโฟลว์ปัจจุบัน พาธรายงานที่เผยแพร่และตัวชี้ล่าสุดจะผูกตาม ref ที่ทดสอบ และแต่ละ `index.md` จะบันทึก ref/SHA ที่ทดสอบ, ref/SHA ของเวิร์กโฟลว์, ref ของ Kova, โปรไฟล์, โหมดการยืนยันตัวตนของเลน, โมเดล, จำนวนครั้งที่ทำซ้ำ และตัวกรองสถานการณ์

เวิร์กโฟลว์จะติดตั้ง OCM จากรีลีสที่ปักหมุดไว้ และติดตั้ง Kova จาก `openclaw/Kova` ที่อินพุต `kova_ref` ซึ่งปักหมุดไว้ จากนั้นรันสามเลน:

- `mock-provider`: สถานการณ์ diagnostic ของ Kova กับรันไทม์ที่บิลด์ในเครื่อง พร้อมการยืนยันตัวตน OpenAI-compatible ปลอมแบบ deterministic
- `mock-deep-profile`: การทำโปรไฟล์ CPU/heap/trace สำหรับจุดร้อนของการเริ่มต้นระบบ, Gateway และรอบการทำงานของเอเจนต์
- `live-gpt54`: รอบการทำงานของเอเจนต์ OpenAI `openai/gpt-5.4` จริง ข้ามเมื่อ `OPENAI_API_KEY` ไม่พร้อมใช้งาน

เลน mock-provider ยังรัน source probe แบบเนทีฟของ OpenClaw หลังจากผ่าน Kova: เวลา boot และหน่วยความจำของ Gateway ในกรณีเริ่มต้นแบบ default, hook และ 50-plugin; ลูป hello ของ mock-OpenAI `channel-chat-baseline` แบบซ้ำ; และคำสั่งเริ่มต้น CLI กับ Gateway ที่ boot แล้ว สรุป Markdown ของ source probe อยู่ที่ `source/index.md` ในชุดรายงาน โดยมี JSON ดิบอยู่ข้างๆ

ทุกเลนอัปโหลด artifacts ของ GitHub เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว เวิร์กโฟลว์จะคอมมิต `report.json`, `report.md`, ชุด bundle, `index.md` และ artifacts ของ source-probe เข้าไปใน `openclaw/clawgrit-reports` ภายใต้ `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` ด้วย ตัวชี้ ref ที่ทดสอบล่าสุดจะถูกเขียนเป็น `openclaw-performance/<tested-ref>/latest-<lane>.json`

## การตรวจสอบรีลีสเต็มรูปแบบ

`Full Release Validation` คือเวิร์กโฟลว์ครอบแบบสั่งรันด้วยตนเองสำหรับ "รันทุกอย่างก่อนรีลีส" โดยรับสาขา แท็ก หรือ SHA คอมมิตแบบเต็ม, สั่งรันเวิร์กโฟลว์ `CI` ด้วยตนเองกับเป้าหมายนั้น, สั่งรัน `Plugin Prerelease` สำหรับหลักฐาน Plugin/แพ็กเกจ/สแตติก/Docker สำหรับรีลีสเท่านั้น และสั่งรัน `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, การตรวจแพ็กเกจข้าม OS, ความเท่าเทียมของ QA Lab, Matrix และเลน Telegram การรันแบบ stable/default จะเก็บความครอบคลุม live/E2E แบบละเอียดและ Docker release-path ไว้หลัง `run_release_soak=true`; `release_profile=full` จะบังคับเปิดความครอบคลุมแบบ soak นั้น เพื่อให้การตรวจสอบ advisory แบบกว้างยังคงกว้างอยู่ ด้วย `rerun_group=all` และ `release_profile=full` จะรัน `NPM Telegram Beta E2E` กับ artifact `release-package-under-test` จาก release checks ด้วย หลังเผยแพร่แล้ว ให้ส่ง `npm_telegram_package_spec` เพื่อรันเลนแพ็กเกจ Telegram เดิมซ้ำกับแพ็กเกจ npm ที่เผยแพร่แล้ว

ดู [การตรวจสอบรีลีสเต็มรูปแบบ](/th/reference/full-release-validation) สำหรับ
เมทริกซ์สเตจ ชื่องานเวิร์กโฟลว์ที่แน่นอน ความแตกต่างของโปรไฟล์ artifacts และ
ตัวจัดการ rerun แบบเจาะจง

`OpenClaw Release Publish` คือเวิร์กโฟลว์รีลีสแบบเปลี่ยนแปลงสถานะที่สั่งรันด้วยตนเอง สั่งรันจาก `release/YYYY.M.D` หรือ `main` หลังจากมีแท็กรีลีสแล้ว และหลังจาก preflight ของ OpenClaw npm สำเร็จแล้ว เวิร์กโฟลว์จะตรวจสอบ `pnpm plugins:sync:check`, สั่งรัน `Plugin NPM Release` สำหรับแพ็กเกจ Plugin ทั้งหมดที่เผยแพร่ได้, สั่งรัน `Plugin ClawHub Release` สำหรับ SHA รีลีสเดียวกัน และหลังจากนั้นเท่านั้นจึงสั่งรัน `OpenClaw NPM Release` พร้อม `preflight_run_id` ที่บันทึกไว้

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

สำหรับหลักฐานคอมมิตที่ปักหมุดไว้บนแบรนช์ที่เคลื่อนไหวเร็ว ให้ใช้ตัวช่วยแทน
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

ค่าอ้างอิงสำหรับ dispatch เวิร์กโฟลว์ของ GitHub ต้องเป็นแบรนช์หรือแท็ก ไม่ใช่ SHA ของคอมมิตดิบ ตัวช่วยจะพุชแบรนช์ชั่วคราว `release-ci/<sha>-...` ที่ SHA เป้าหมาย, dispatch `Full Release Validation` จาก ref ที่ปักหมุดนั้น, ตรวจสอบว่า `headSha` ของทุกเวิร์กโฟลว์ลูกตรงกับเป้าหมาย และลบแบรนช์ชั่วคราวเมื่อรันเสร็จ ตัวตรวจสอบแบบร่มยังล้มเหลวด้วยหากมีเวิร์กโฟลว์ลูกใดรันที่ SHA ต่างออกไป

`release_profile` ควบคุมความครอบคลุมของ live/provider ที่ส่งเข้าไปในการตรวจสอบรีลีส เวิร์กโฟลว์รีลีสแบบแมนนวลมีค่าเริ่มต้นเป็น `stable`; ใช้ `full` เฉพาะเมื่อคุณตั้งใจต้องการเมทริกซ์ provider/media เชิงแนะนำที่กว้าง `run_release_soak` ควบคุมว่าการตรวจสอบรีลีส stable/default จะรัน soak สำหรับ live/E2E และเส้นทางรีลีส Docker แบบละเอียดหรือไม่; `full` จะบังคับเปิด soak

- `minimum` คงไว้เฉพาะเลน OpenAI/core ที่เร็วที่สุดและสำคัญต่อรีลีส
- `stable` เพิ่มชุด provider/backend แบบ stable
- `full` รันเมทริกซ์ provider/media เชิงแนะนำแบบกว้าง

ร่มจะบันทึก id ของรันลูกที่ dispatch แล้ว และงานสุดท้าย `Verify full validation` จะตรวจสอบ conclusion ปัจจุบันของรันลูกอีกครั้งและแนบตารางงานที่ช้าที่สุดสำหรับแต่ละรันลูก หากเวิร์กโฟลว์ลูกถูกรันซ้ำแล้วเปลี่ยนเป็นเขียว ให้รันซ้ำเฉพาะงาน verifier ของพาเรนต์เพื่อรีเฟรชผลลัพธ์ร่มและสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รับ `rerun_group` ใช้ `all` สำหรับ release candidate, `ci` สำหรับเฉพาะลูก full CI ปกติ, `plugin-prerelease` สำหรับเฉพาะลูก plugin prerelease, `release-checks` สำหรับลูกรีลีสทุกตัว หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, หรือ `npm-telegram` บนร่ม วิธีนี้จำกัดการรันซ้ำของกล่องรีลีสที่ล้มเหลวหลังแก้เฉพาะจุด สำหรับเลน cross-OS ที่ล้มเหลวหนึ่งเลน ให้รวม `rerun_group=cross-os` กับ `cross_os_suite_filter` เช่น `windows/packaged-upgrade`; คำสั่ง cross-OS ที่ยาวจะปล่อยบรรทัด heartbeat และสรุป packaged-upgrade จะรวมเวลารายเฟส เลน QA release-check เป็นเชิงแนะนำ ดังนั้นความล้มเหลวเฉพาะ QA จะเตือนแต่ไม่บล็อก verifier ของ release-check

`OpenClaw Release Checks` ใช้ ref ของเวิร์กโฟลว์ที่เชื่อถือได้เพื่อ resolve ref ที่เลือกครั้งเดียวเป็น tarball `release-package-under-test` จากนั้นส่ง artifact นั้นไปยังการตรวจสอบ cross-OS และ Package Acceptance รวมถึงเวิร์กโฟลว์ Docker สำหรับเส้นทางรีลีส live/E2E เมื่อรันความครอบคลุมแบบ soak วิธีนี้ทำให้ไบต์ของแพ็กเกจคงที่ข้ามกล่องรีลีสและหลีกเลี่ยงการแพ็ก candidate เดิมซ้ำในงานลูกหลายงาน

รัน `Full Release Validation` ที่ซ้ำกันสำหรับ `ref=main` และ `rerun_group=all`
จะแทนที่ร่มที่เก่ากว่า ตัว monitor ของพาเรนต์จะยกเลิกเวิร์กโฟลว์ลูกใดก็ตามที่ dispatch ไปแล้วเมื่อพาเรนต์ถูกยกเลิก ดังนั้นการตรวจสอบ main ที่ใหม่กว่าจะไม่ต้องรอหลังรัน release-check เก่าสองชั่วโมง การตรวจสอบ release branch/tag และกลุ่ม rerun เฉพาะจุดจะคง `cancel-in-progress: false`

## ชาร์ด Live และ E2E

ลูก release live/E2E ยังคงความครอบคลุม `pnpm test:live` แบบ native ที่กว้าง แต่รันเป็นชาร์ดที่มีชื่อผ่าน `scripts/test-live-shard.mjs` แทนงาน serial งานเดียว:

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
- ชาร์ดสื่อ audio/video ที่แยกออก และชาร์ด music ที่กรองตาม provider

วิธีนี้คงความครอบคลุมไฟล์เดิมไว้ พร้อมทำให้ความล้มเหลวของ live provider ที่ช้ารันซ้ำและวิเคราะห์ได้ง่ายขึ้น ชื่อชาร์ดรวม `native-live-extensions-o-z`, `native-live-extensions-media`, และ `native-live-extensions-media-music` ยังใช้ได้สำหรับการรันซ้ำแบบ one-shot ด้วยตนเอง

ชาร์ด native live media รันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งสร้างโดยเวิร์กโฟลว์ `Live Media Runner Image` อิมเมจนั้นติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้า; งาน media ตรวจสอบเฉพาะ binary ก่อน setup ให้คงชุด live ที่พึ่ง Docker ไว้บน runner Blacksmith ปกติ — งาน container ไม่ใช่ที่ที่เหมาะสำหรับเปิดการทดสอบ Docker ซ้อน

ชาร์ด live model/backend ที่พึ่ง Docker ใช้อิมเมจ shared `ghcr.io/openclaw/openclaw-live-test:<sha>` แยกต่อคอมมิตที่เลือก เวิร์กโฟลว์ live release สร้างและพุชอิมเมจนั้นหนึ่งครั้ง จากนั้นชาร์ด Docker live model, gateway ที่แบ่งตาม provider, CLI backend, ACP bind และ Codex harness จะรันด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ชาร์ด Gateway Docker มีเพดาน `timeout` ระดับสคริปต์ที่ชัดเจนต่ำกว่า timeout ของงานเวิร์กโฟลว์ เพื่อให้ container ที่ค้างหรือเส้นทาง cleanup ล้มเหลวเร็วแทนที่จะกินงบ release-check ทั้งหมด หากชาร์ดเหล่านั้นสร้าง Docker target ของซอร์สเต็มใหม่เอง รันรีลีสนั้นถูกตั้งค่าผิดและจะเสียเวลา wall clock ไปกับการ build อิมเมจซ้ำ

## Package Acceptance

ใช้ `Package Acceptance` เมื่อคำถามคือ "แพ็กเกจ OpenClaw ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์ได้หรือไม่" สิ่งนี้ต่างจาก CI ปกติ: CI ปกติตรวจสอบซอร์สทรี ขณะที่ package acceptance ตรวจสอบ tarball เดี่ยวผ่าน Docker E2E harness เดียวกับที่ผู้ใช้ใช้งานหลังติดตั้งหรืออัปเดต

### งาน

1. `resolve_package` checkout `workflow_ref`, resolve candidate แพ็กเกจหนึ่งตัว, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, อัปโหลดทั้งสองเป็น artifact `package-under-test` และพิมพ์แหล่งที่มา, workflow ref, package ref, เวอร์ชัน, SHA-256 และ profile ในสรุป step ของ GitHub
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` เวิร์กโฟลว์ที่ใช้ซ้ำจะดาวน์โหลด artifact นั้น, ตรวจสอบ inventory ของ tarball, เตรียมอิมเมจ Docker แบบ package-digest เมื่อจำเป็น และรันเลน Docker ที่เลือกกับแพ็กเกจนั้นแทนการแพ็ก workflow checkout เมื่อ profile เลือก `docker_lanes` แบบเจาะจงหลายรายการ เวิร์กโฟลว์ที่ใช้ซ้ำจะเตรียมแพ็กเกจและอิมเมจ shared หนึ่งครั้ง จากนั้นกระจายเลนเหล่านั้นออกเป็นงาน Docker เจาะจงแบบขนานพร้อม artifact ที่ไม่ซ้ำกัน
3. `package_telegram` เรียก `NPM Telegram Beta E2E` แบบไม่บังคับ โดยจะรันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้ง artifact `package-under-test` เดียวกันเมื่อ Package Acceptance resolve ได้หนึ่งรายการ; dispatch Telegram แบบ standalone ยังติดตั้ง spec npm ที่เผยแพร่แล้วได้
4. `summary` ทำให้เวิร์กโฟลว์ล้มเหลวหากการ resolve แพ็กเกจ, Docker acceptance หรือเลน Telegram แบบไม่บังคับล้มเหลว

### แหล่ง candidate

- `source=npm` รับเฉพาะ `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรีลีส OpenClaw แบบเจาะจง เช่น `openclaw@2026.4.27-beta.2` ใช้ค่านี้สำหรับ acceptance ของ prerelease/stable ที่เผยแพร่แล้ว
- `source=ref` แพ็กแบรนช์, แท็ก หรือ SHA คอมมิตเต็มของ `package_ref` ที่เชื่อถือได้ resolver จะ fetch แบรนช์/แท็กของ OpenClaw, ตรวจสอบว่าคอมมิตที่เลือกเข้าถึงได้จากประวัติแบรนช์ของ repository หรือ release tag, ติดตั้ง deps ใน worktree แบบ detached และแพ็กด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` ดาวน์โหลด HTTPS `.tgz`; ต้องระบุ `package_sha256`
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งไฟล์จาก `artifact_run_id` และ `artifact_name`; `package_sha256` ไม่บังคับแต่ควรระบุสำหรับ artifact ที่แชร์ภายนอก

แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือโค้ด workflow/harness ที่เชื่อถือได้ซึ่งรันการทดสอบ `package_ref` คือคอมมิตต้นทางที่จะถูกแพ็กเมื่อ `source=ref` วิธีนี้ทำให้ test harness ปัจจุบันตรวจสอบคอมมิตซอร์สเก่าที่เชื่อถือได้โดยไม่ต้องรัน logic เวิร์กโฟลว์เก่า

### โปรไฟล์ชุดทดสอบ

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` รวมกับ `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — ชังก์เส้นทางรีลีส Docker เต็มพร้อม OpenWebUI
- `custom` — `docker_lanes` แบบเจาะจง; ต้องระบุเมื่อ `suite_profile=custom`

โปรไฟล์ `package` ใช้ความครอบคลุม Plugin แบบ offline เพื่อไม่ให้การตรวจสอบแพ็กเกจที่เผยแพร่แล้วถูกกั้นด้วยความพร้อมใช้งานของ ClawHub แบบ live เลน Telegram แบบไม่บังคับใช้ artifact `package-under-test` ซ้ำใน `NPM Telegram Beta E2E` โดยคงเส้นทาง spec npm ที่เผยแพร่แล้วไว้สำหรับ dispatch แบบ standalone

สำหรับนโยบายการทดสอบอัปเดตและ Plugin เฉพาะ รวมถึงคำสั่งภายในเครื่อง,
เลน Docker, input ของ Package Acceptance, ค่าเริ่มต้นของรีลีส และการคัดแยกความล้มเหลว,
ดู [การทดสอบอัปเดตและ Plugin](/th/help/testing-updates-plugins)

Release checks เรียก Package Acceptance ด้วย `source=artifact`, artifact แพ็กเกจรีลีสที่เตรียมไว้, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` และ `telegram_mode=mock-openai` วิธีนี้ทำให้หลักฐาน package migration, update, การติดตั้ง skill จาก ClawHub แบบ live, cleanup dependency ของ Plugin เก่า, การซ่อมการติดตั้ง Plugin ที่กำหนดค่าไว้, Plugin แบบ offline, plugin-update และ Telegram อยู่บน tarball แพ็กเกจที่ resolve เดียวกัน ตั้งค่า `package_acceptance_package_spec` บน Full Release Validation หรือ OpenClaw Release Checks เพื่อรันเมทริกซ์เดียวกันกับแพ็กเกจ npm ที่จัดส่งแล้วแทน artifact ที่สร้างจาก SHA การตรวจสอบรีลีส cross-OS ยังคงครอบคลุมพฤติกรรม onboarding, installer และ platform เฉพาะ OS; การตรวจสอบผลิตภัณฑ์ด้าน package/update ควรเริ่มด้วย Package Acceptance เลน Docker `published-upgrade-survivor` ตรวจสอบ baseline แพ็กเกจที่เผยแพร่แล้วหนึ่งรายการต่อรันในเส้นทางรีลีสที่บล็อก ใน Package Acceptance tarball `package-under-test` ที่ resolve แล้วจะเป็น candidate เสมอ และ `published_upgrade_survivor_baseline` เลือก baseline ที่เผยแพร่แล้วสำหรับ fallback โดยมีค่าเริ่มต้นเป็น `openclaw@latest`; คำสั่งรันซ้ำของเลนที่ล้มเหลวจะคง baseline นั้นไว้ Full Release Validation ที่มี `run_release_soak=true` หรือ `release_profile=full` จะตั้งค่า `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` และ `published_upgrade_survivor_scenarios=reported-issues` เพื่อขยายครอบคลุมรีลีส npm stable ล่าสุดสี่รายการ รวมถึงรีลีสขอบเขตความเข้ากันได้ของ Plugin ที่ปักหมุดไว้ และ fixture ตามรูปแบบ issue สำหรับ config ของ Feishu, ไฟล์ bootstrap/persona ที่เก็บรักษาไว้, การติดตั้ง Plugin OpenClaw ที่กำหนดค่าไว้, เส้นทาง log แบบ tilde และราก dependency ของ Plugin legacy ที่ค้าง การเลือก published-upgrade survivor แบบหลาย baseline จะถูกแบ่งชาร์ดตาม baseline เป็นงาน targeted Docker runner แยกกัน เวิร์กโฟลว์ `Update Migration` แยกต่างหากใช้เลน Docker `update-migration` พร้อม `all-since-2026.4.23` และ `plugin-deps-cleanup` เมื่อคำถามคือ cleanup การอัปเดตที่เผยแพร่แล้วแบบละเอียด ไม่ใช่ความกว้างของ Full Release CI ปกติ รัน aggregate ภายในเครื่องสามารถส่ง spec แพ็กเกจแบบเจาะจงด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, คงไว้เลนเดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` เช่น `openclaw@2026.4.15` หรือตั้งค่า `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` สำหรับเมทริกซ์ scenario เลนที่เผยแพร่แล้วกำหนดค่า baseline ด้วย recipe คำสั่ง `openclaw config set` ที่ฝังมา, บันทึกขั้นตอน recipe ใน `summary.json` และ probe `/healthz`, `/readyz` รวมถึงสถานะ RPC หลังเริ่ม Gateway เลน Windows packaged และ installer fresh ยังตรวจสอบด้วยว่าแพ็กเกจที่ติดตั้งแล้วสามารถ import browser-control override จากเส้นทาง Windows แบบ absolute ดิบได้ smoke สำหรับ agent-turn แบบ cross-OS ของ OpenAI มีค่าเริ่มต้นเป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อถูกตั้งค่า มิฉะนั้นเป็น `openai/gpt-5.4` เพื่อให้หลักฐาน install และ Gateway อยู่บนโมเดลทดสอบ GPT-5 พร้อมหลีกเลี่ยงค่าเริ่มต้น GPT-4.x

### หน้าต่างความเข้ากันได้แบบเดิม

การยอมรับแพ็กเกจมีหน้าต่างความเข้ากันได้แบบเดิมที่มีขอบเขตสำหรับแพ็กเกจที่เผยแพร่ไปแล้ว แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้เส้นทางความเข้ากันได้ได้:

- รายการ QA ส่วนตัวที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ถูกละเว้นจาก tarball;
- `doctor-switch` อาจข้ามกรณีย่อยการคงอยู่ของ `gateway install --wrapper` เมื่อแพ็กเกจไม่เปิดเผยแฟล็กนั้น;
- `update-channel-switch` อาจตัด `pnpm.patchedDependencies` ที่หายไปออกจาก fixture git ปลอมที่ได้จาก tarball และอาจบันทึก `update.channel` ที่คงอยู่แล้วแต่หายไป;
- smoke ของ Plugin อาจอ่านตำแหน่ง install-record แบบเดิม หรือยอมรับการคงอยู่ของ marketplace install-record ที่หายไป;
- `plugin-update` อาจอนุญาตการย้าย metadata ของ config ขณะที่ยังคงกำหนดให้ install record และพฤติกรรมไม่มีการติดตั้งซ้ำต้องไม่เปลี่ยนแปลง

แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ stamp metadata ของบิลด์ในเครื่องที่จัดส่งไปแล้วด้วย แพ็กเกจที่ใหม่กว่าต้องเป็นไปตามสัญญาสมัยใหม่ เงื่อนไขเดียวกันจะล้มเหลวแทนที่จะเตือนหรือข้าม

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

เมื่อดีบักการรันการยอมรับแพ็กเกจที่ล้มเหลว ให้เริ่มที่สรุป `resolve_package` เพื่อยืนยันแหล่งที่มาของแพ็กเกจ เวอร์ชัน และ SHA-256 จากนั้นตรวจสอบ child run ของ `docker_acceptance` และ artifact ของ Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, บันทึกของ lane, เวลาแต่ละ phase และคำสั่ง rerun ควร rerun โปรไฟล์แพ็กเกจที่ล้มเหลวหรือ lane ของ Docker ที่ตรงกัน แทนที่จะ rerun การตรวจสอบ release ทั้งหมด

## Install smoke

Workflow `Install Smoke` แยกต่างหากใช้สคริปต์ scope เดียวกันซ้ำผ่าน job `preflight` ของตัวเอง โดยแบ่งความครอบคลุม smoke ออกเป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **เส้นทางเร็ว** ทำงานสำหรับ pull request ที่แตะพื้นผิว Docker/แพ็กเกจ การเปลี่ยนแปลงแพ็กเกจ/manifest ของ Plugin ที่ bundled หรือพื้นผิว core Plugin/channel/Gateway/Plugin SDK ที่ job smoke ของ Docker ทดสอบ การเปลี่ยนแปลง Plugin ที่ bundled เฉพาะ source, การแก้ไขเฉพาะ test และการแก้ไขเฉพาะ docs จะไม่จอง worker ของ Docker เส้นทางเร็วจะ build image ของ root Dockerfile หนึ่งครั้ง ตรวจสอบ CLI รัน smoke ของ CLI สำหรับ agents delete shared-workspace รัน e2e gateway-network ใน container ตรวจสอบ build arg ของ bundled extension และรันโปรไฟล์ Docker ของ bundled-Plugin แบบมีขอบเขตภายใต้ timeout รวมของคำสั่ง 240 วินาที (Docker run ของแต่ละ scenario ถูกจำกัดแยกกัน)
- **เส้นทางเต็ม** เก็บการติดตั้งแพ็กเกจ QR และความครอบคลุม Docker/update ของ installer ไว้สำหรับการรันตามกำหนดการทุกคืน การ dispatch ด้วยตนเอง การตรวจ release แบบ workflow-call และ pull request ที่แตะพื้นผิว installer/package/Docker จริง ๆ ในโหมดเต็ม install-smoke จะเตรียมหรือใช้ image smoke ของ root Dockerfile จาก GHCR ตาม target-SHA หนึ่งรายการซ้ำ จากนั้นรันการติดตั้งแพ็กเกจ QR, smoke ของ root Dockerfile/Gateway, smoke ของ installer/update และ Docker E2E แบบเร็วของ bundled-Plugin เป็น job แยกกัน เพื่อให้งาน installer ไม่ต้องรออยู่หลัง smoke ของ root image

การ push ไปยัง `main` (รวมถึง merge commit) ไม่บังคับเส้นทางเต็ม เมื่อ logic ของ changed-scope ขอความครอบคลุมเต็มในการ push workflow จะคง smoke Docker แบบเร็วไว้ และปล่อย smoke การติดตั้งแบบเต็มให้การตรวจสอบ nightly หรือ release validation

smoke image-provider ของการติดตั้ง Bun global ที่ช้าถูก gate แยกด้วย `run_bun_global_install_smoke` โดยทำงานตามกำหนดการ nightly และจาก workflow ตรวจ release และการ dispatch `Install Smoke` ด้วยตนเองสามารถเลือกเข้าใช้งานได้ แต่ pull request และการ push ไปยัง `main` จะไม่รัน การทดสอบ Docker ของ QR และ installer เก็บ Dockerfile ที่เน้นการติดตั้งของตัวเองไว้

## Docker E2E ในเครื่อง

`pnpm test:docker:all` prebuild image live-test ที่ใช้ร่วมกันหนึ่งรายการ pack OpenClaw หนึ่งครั้งเป็น npm tarball และ build image `scripts/e2e/Dockerfile` ที่ใช้ร่วมกันสองรายการ:

- runner Node/Git เปล่าสำหรับ lane ของ installer/update/plugin-dependency;
- image ที่ใช้งานได้ซึ่งติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lane การทำงานปกติ

คำจำกัดความของ lane Docker อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs` และ runner จะ execute เฉพาะ plan ที่เลือก scheduler เลือก image ต่อ lane ด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` แล้วรัน lane ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### ค่าที่ปรับแต่งได้

| ตัวแปร                                  | ค่าเริ่มต้น | วัตถุประสงค์                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | จำนวน slot ของ main-pool สำหรับ lane ปกติ                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | จำนวน slot ของ tail-pool ที่อ่อนไหวต่อ provider                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | เพดาน lane live พร้อมกันเพื่อไม่ให้ provider throttle                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | เพดาน lane ติดตั้ง npm พร้อมกัน                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | เพดาน lane multi-service พร้อมกัน                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | ระยะหน่วงระหว่างการเริ่ม lane เพื่อหลีกเลี่ยงพายุการสร้างของ Docker daemon; ตั้งเป็น `0` เพื่อไม่หน่วง     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout สำรองต่อ lane (120 นาที); lane live/tail ที่เลือกใช้เพดานที่เข้มกว่า           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` พิมพ์ plan ของ scheduler โดยไม่รัน lane                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | รายการ lane แบบ exact คั่นด้วยคอมมา; ข้าม cleanup smoke เพื่อให้ agent ทำซ้ำ lane ที่ล้มเหลวหนึ่งรายการได้ |

lane ที่หนักกว่าเพดานจริงยังคงเริ่มจาก pool ว่างได้ จากนั้นรันเดี่ยวจนกว่าจะปล่อย capacity preflight รวมในเครื่องจะ preflight Docker, ลบ container E2E ของ OpenClaw ที่ค้างอยู่, แสดงสถานะ active-lane, คงเวลาแต่ละ lane เพื่อจัดลำดับแบบ longest-first และหยุด schedule lane ใหม่ใน pool หลังจากความล้มเหลวแรกตามค่าเริ่มต้น

### Workflow live/E2E ที่ใช้ซ้ำได้

Workflow live/E2E ที่ใช้ซ้ำได้ถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องใช้แพ็กเกจ ชนิด image, live image, lane และความครอบคลุม credential ใดบ้าง จากนั้น `scripts/docker-e2e.mjs` แปลง plan นั้นเป็น output และ summary ของ GitHub โดยจะ pack OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลด artifact แพ็กเกจของรันปัจจุบัน หรือดาวน์โหลด artifact แพ็กเกจจาก `package_artifact_run_id`; ตรวจสอบ inventory ของ tarball; build และ push image Docker E2E แบบ bare/functional จาก GHCR ที่ tag ตาม package-digest ผ่าน Docker layer cache ของ Blacksmith เมื่อ plan ต้องการ lane ที่ติดตั้งแพ็กเกจแล้ว; และใช้ input `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรือ image ที่มีอยู่แล้วตาม package-digest ซ้ำแทนการ build ใหม่ การ pull image ของ Docker จะ retry ด้วย timeout ต่อครั้งที่มีขอบเขต 180 วินาที เพื่อให้ stream registry/cache ที่ค้าง retry ได้รวดเร็วแทนที่จะกินเวลาส่วนใหญ่ของ critical path ใน CI

### ชุดย่อย release-path

ความครอบคลุม Docker ของ release รัน job แบบ chunk ขนาดเล็กด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละ chunk pull เฉพาะชนิด image ที่ต้องใช้ และ execute หลาย lane ผ่าน scheduler แบบถ่วงน้ำหนักเดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

chunk Docker สำหรับ release ปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` และ `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` ส่วน `plugins-runtime-core`, `plugins-runtime` และ `plugins-integrations` ยังคงเป็น alias รวมของ plugin/runtime alias ของ lane `install-e2e` ยังคงเป็น alias rerun ด้วยตนเองแบบรวมสำหรับ lane installer ของทั้งสอง provider

OpenWebUI ถูกรวมเข้าใน `plugins-runtime-services` เมื่อความครอบคลุม release-path แบบเต็มร้องขอ และเก็บ chunk `openwebui` แบบ standalone ไว้เฉพาะการ dispatch สำหรับ OpenWebUI เท่านั้น lane อัปเดตของ bundled-channel จะ retry หนึ่งครั้งสำหรับความล้มเหลวชั่วคราวของเครือข่าย npm

แต่ละ chunk อัปโหลด `.artifacts/docker-tests/` พร้อมบันทึก lane, timings, `summary.json`, `failures.json`, เวลาแต่ละ phase, JSON plan ของ scheduler, ตาราง lane ที่ช้า และคำสั่ง rerun ต่อ lane input `docker_lanes` ของ workflow จะรัน lane ที่เลือกกับ image ที่เตรียมไว้แทน job chunk ซึ่งทำให้การดีบัก lane ที่ล้มเหลวถูกจำกัดไว้ที่ job Docker เป้าหมายเดียว และเตรียม ดาวน์โหลด หรือใช้ artifact แพ็กเกจซ้ำสำหรับรันนั้น หาก lane ที่เลือกเป็น lane Docker แบบ live job เป้าหมายจะ build image live-test ในเครื่องสำหรับ rerun นั้น คำสั่ง rerun GitHub ที่สร้างต่อ lane จะรวม `package_artifact_run_id`, `package_artifact_name` และ input image ที่เตรียมไว้เมื่อมีค่าเหล่านั้นอยู่ เพื่อให้ lane ที่ล้มเหลวสามารถใช้แพ็กเกจและ image เดิมจากรันที่ล้มเหลวได้

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E ตามกำหนดการรันชุด Docker release-path แบบเต็มทุกวัน

## Plugin Prerelease

`Plugin Prerelease` เป็นความครอบคลุม product/package ที่มีค่าใช้จ่ายสูงกว่า จึงเป็น workflow แยกต่างหากที่ dispatch โดย `Full Release Validation` หรือ operator ที่ระบุชัดเจน Pull request ปกติ การ push ไปยัง `main` และการ dispatch CI ด้วยตนเองแบบ standalone จะปิด suite นั้นไว้ มันปรับสมดุลการทดสอบ Plugin ที่ bundled ข้าม worker extension แปดตัว; job shard ของ extension เหล่านั้นรันกลุ่ม config ของ Plugin ได้สูงสุดสองกลุ่มพร้อมกัน โดยใช้ Vitest worker หนึ่งตัวต่อกลุ่มและ heap ของ Node ที่ใหญ่ขึ้น เพื่อให้ batch ของ Plugin ที่มี import หนักไม่สร้าง job CI เพิ่มเติม เส้นทาง prerelease ของ Docker สำหรับ release เท่านั้นจะ batch lane Docker เป้าหมายเป็นกลุ่มเล็ก ๆ เพื่อหลีกเลี่ยงการจอง runner หลายสิบตัวสำหรับ job ที่ใช้เวลาหนึ่งถึงสามนาที

## QA Lab

QA Lab มี lane CI เฉพาะนอก workflow smart-scoped หลัก ความเท่าเทียมแบบ agentic ถูกซ้อนอยู่ใต้ harness QA และ release แบบกว้าง ไม่ใช่ workflow PR แบบ standalone ใช้ `Full Release Validation` พร้อม `rerun_group=qa-parity` เมื่อ parity ควรเดินไปกับการรันตรวจสอบแบบกว้าง

- Workflow `QA-Lab - All Lanes` รันทุกคืนบน `main` และเมื่อ dispatch ด้วยตนเอง; มัน fan out lane mock parity, lane Matrix แบบ live และ lane Telegram และ Discord แบบ live เป็น job ขนานกัน job live ใช้ environment `qa-live-shared` และ Telegram/Discord ใช้ lease ของ Convex

การตรวจสอบรีลีสรันเลน live transport ของ Matrix และ Telegram ด้วย deterministic mock provider และโมเดลที่ระบุว่าเป็น mock (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อแยกสัญญาของช่องออกจากเวลาแฝงของโมเดลจริงและการเริ่มต้น provider-plugin ตามปกติ Live transport gateway ปิดใช้งานการค้นหา memory เพราะ QA parity ครอบคลุมพฤติกรรม memory แยกต่างหาก ส่วนการเชื่อมต่อ provider ครอบคลุมโดยชุดทดสอบ live model, native provider และ Docker provider แยกต่างหาก

Matrix ใช้ `--profile fast` สำหรับเกตแบบกำหนดเวลาและเกตรีลีส โดยเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout รองรับ ค่าเริ่มต้นของ CLI และอินพุต workflow แบบ manual ยังคงเป็น `all`; การ dispatch แบบ manual ด้วย `matrix_profile=all` จะแบ่ง coverage ของ Matrix แบบเต็มเป็นงาน `transport`, `media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรันเลน QA Lab ที่สำคัญต่อรีลีสก่อนการอนุมัติรีลีสด้วย; เกต QA parity ของ workflow นี้รัน candidate pack และ baseline pack เป็นงานเลนแบบขนาน จากนั้นดาวน์โหลด artifact ทั้งสองเข้าไปยังงานรายงานขนาดเล็กเพื่อทำการเปรียบเทียบ parity ขั้นสุดท้าย

สำหรับ PR ปกติ ให้ยึดหลักฐาน CI/check ตามขอบเขตแทนการถือว่า parity เป็นสถานะที่จำเป็น

## CodeQL

workflow `CodeQL` ตั้งใจให้เป็นสแกนเนอร์ความปลอดภัยรอบแรกที่มีขอบเขตแคบ ไม่ใช่การกวาดตรวจทั้ง repository แบบเต็ม การรันรายวัน แบบ manual และ guard สำหรับ pull request ที่ไม่ใช่ draft จะสแกนโค้ด Actions workflow รวมถึงพื้นผิว JavaScript/TypeScript ที่มีความเสี่ยงสูงที่สุด ด้วย query ความปลอดภัยที่มีความเชื่อมั่นสูงซึ่งกรองเป็น `security-severity` ระดับ high/critical

guard สำหรับ pull request ยังคงเบา: จะเริ่มเฉพาะการเปลี่ยนแปลงภายใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` หรือ `src` และรัน security matrix ที่มีความเชื่อมั่นสูงชุดเดียวกับ workflow แบบกำหนดเวลา Android และ macOS CodeQL ไม่อยู่ในค่าเริ่มต้นของ PR

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                          | พื้นผิว                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron และ baseline ของ gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการใช้งาน channel หลัก รวมถึง runtime ของ channel plugin, gateway, Plugin SDK, secrets และจุดสัมผัส audit              |
| `/codeql-security-high/network-ssrf-boundary`     | พื้นผิว SSRF หลัก, การ parse IP, network guard, web-fetch และนโยบาย SSRF ของ Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, helper สำหรับการ execute process, outbound delivery และเกตการ execute tool ของ agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | พื้นผิว trust ของ Plugin install, loader, manifest, registry, การติดตั้ง package-manager, source-loading และสัญญา package ของ Plugin SDK |

### shard ความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — shard ความปลอดภัย Android แบบกำหนดเวลา สร้างแอป Android แบบ manual สำหรับ CodeQL บน Blacksmith Linux runner ที่เล็กที่สุดซึ่ง workflow sanity ยอมรับ อัปโหลดภายใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — shard ความปลอดภัย macOS แบบรายสัปดาห์/manual สร้างแอป macOS แบบ manual สำหรับ CodeQL บน Blacksmith macOS, กรองผลลัพธ์ build ของ dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดภายใต้ `/codeql-critical-security/macos` เก็บไว้นอกค่าเริ่มต้นรายวันเพราะ build ของ macOS กิน runtime มากแม้ในสถานะสะอาด

### หมวดหมู่ Critical Quality

`CodeQL Critical Quality` คือ shard ที่จับคู่กันซึ่งไม่ใช่ด้านความปลอดภัย โดยรันเฉพาะ query คุณภาพ JavaScript/TypeScript ที่มี error-severity และไม่ใช่ security บนพื้นผิวมูลค่าสูงที่มีขอบเขตแคบ บน Blacksmith Linux runner ขนาดเล็กกว่า guard สำหรับ pull request ของมันตั้งใจให้เล็กกว่า profile แบบกำหนดเวลา: PR ที่ไม่ใช่ draft จะรันเฉพาะ shard ที่ตรงกัน ได้แก่ `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` สำหรับการเปลี่ยนแปลงในโค้ดการ execute คำสั่ง/model/tool ของ agent และการ dispatch reply, โค้ด config schema/migration/IO, โค้ด auth/secrets/sandbox/security, channel หลักและ runtime ของ channel plugin ที่ bundled, gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, plugin loader, Plugin SDK/package-contract หรือ runtime การ reply ของ Plugin SDK การเปลี่ยนแปลง CodeQL config และ quality workflow จะรัน PR quality shard ทั้งสิบสองรายการ

manual dispatch รับค่า:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

profile แบบแคบเป็น hook สำหรับการสอน/iteration เพื่อรัน quality shard หนึ่งรายการแยกเดี่ยว

| หมวดหมู่                                                | พื้นผิว                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ดขอบเขตความปลอดภัยของ auth, secrets, sandbox, cron และ gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | สัญญาของ config schema, migration, normalization และ IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | สัญญาของ gateway protocol schema และ server method                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญาการใช้งาน channel หลักและ channel plugin ที่ bundled                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | สัญญา runtime ของการ execute คำสั่ง, การ dispatch model/provider, การ dispatch และ queue ของ auto-reply และ control-plane ของ ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP servers และ tool bridges, helper สำหรับการ supervise process และสัญญา outbound delivery                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, memory runtime facade, alias ของ memory Plugin SDK, glue สำหรับการ activate memory runtime และคำสั่ง memory doctor                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | internals ของ reply queue, session delivery queues, helper สำหรับ outbound session binding/delivery, พื้นผิว diagnostic event/log bundle และสัญญา CLI ของ session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | การ dispatch inbound reply ของ Plugin SDK, helper สำหรับ reply payload/chunking/runtime, ตัวเลือก channel reply, delivery queues และ helper สำหรับ session/thread binding             |
| `/codeql-critical-quality/provider-runtime-boundary`    | การ normalize model catalog, provider auth และ discovery, การลงทะเบียน provider runtime, provider defaults/catalogs และ registry ของ web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | bootstrap ของ control UI, local persistence, control flow ของ gateway และสัญญา runtime ของ task control-plane                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | สัญญา runtime ของ core web fetch/search, media IO, media understanding, image-generation และ media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | สัญญาของ loader, registry, public-surface และ entrypoint ของ Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | source ของ Plugin SDK ฝั่ง package ที่เผยแพร่ และ helper สำหรับสัญญา plugin package                                                                                      |

คุณภาพถูกแยกจากความปลอดภัยเพื่อให้ findings ด้านคุณภาพสามารถถูกกำหนดเวลา วัด ปิดใช้งาน หรือขยายได้โดยไม่บดบังสัญญาณด้านความปลอดภัย การขยาย CodeQL สำหรับ Swift, Python และ bundled-plugin ควรถูกเพิ่มกลับเข้ามาเป็นงานติดตามผลแบบ scoped หรือ sharded เท่านั้นหลังจาก profile แบบแคบมี runtime และสัญญาณที่เสถียรแล้ว

## workflow สำหรับการบำรุงรักษา

### Docs Agent

workflow `Docs Agent` เป็นเลนการบำรุงรักษา Codex แบบ event-driven สำหรับทำให้เอกสารที่มีอยู่สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง land แล้ว ไม่มี schedule ล้วน ๆ: การรัน CI จาก push ที่สำเร็จและไม่ใช่ bot บน `main` สามารถ trigger ได้ และ manual dispatch สามารถรันได้โดยตรง การเรียกผ่าน workflow-run จะ skip เมื่อ `main` เดินหน้าไปแล้ว หรือเมื่อมีการรัน Docs Agent แบบไม่ skip อีกรายการถูกสร้างขึ้นในชั่วโมงที่ผ่านมา เมื่อรัน มันจะตรวจสอบช่วง commit ตั้งแต่ source SHA ของ Docs Agent ที่ไม่ skip ครั้งก่อนจนถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงหนึ่งครั้งจึงครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมตั้งแต่ pass เอกสารครั้งล่าสุดได้

### Test Performance Agent

workflow `Test Performance Agent` เป็นเลนการบำรุงรักษา Codex แบบ event-driven สำหรับ test ที่ช้า ไม่มี schedule ล้วน ๆ: การรัน CI จาก push ที่สำเร็จและไม่ใช่ bot บน `main` สามารถ trigger ได้ แต่จะ skip หาก invocation จาก workflow-run อีกอันเคยรันแล้วหรือกำลังรันอยู่ในวัน UTC นั้น manual dispatch จะข้ามเกตกิจกรรมรายวันนี้ เลนนี้สร้างรายงาน performance ของ Vitest แบบ full-suite grouped, ให้ Codex ทำเฉพาะการแก้ไข performance ของ test ขนาดเล็กที่รักษา coverage ไว้แทนการ refactor กว้าง ๆ จากนั้นรันรายงาน full-suite ซ้ำ และปฏิเสธการเปลี่ยนแปลงที่ลดจำนวน test baseline ที่ผ่าน หาก baseline มี test ที่ล้มเหลว Codex อาจแก้เฉพาะความล้มเหลวที่ชัดเจน และรายงาน full-suite หลัง agent ต้องผ่านก่อนจึงจะ commit อะไรได้ เมื่อ `main` เดินหน้าก่อน bot push จะ land เลนนี้จะ rebase patch ที่ตรวจสอบแล้ว รัน `pnpm check:changed` ซ้ำ และ retry การ push; patch ที่ stale และขัดแย้งจะถูก skip ใช้ GitHub-hosted Ubuntu เพื่อให้ Codex action คง posture ความปลอดภัยแบบ drop-sudo เดียวกับ docs agent ได้

### Duplicate PRs After Merge

workflow `Duplicate PRs After Merge` เป็น workflow แบบ manual สำหรับ maintainer เพื่อ cleanup duplicate หลัง land ค่าเริ่มต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุอย่างชัดเจนเมื่อ `apply=true` ก่อนแก้ไข GitHub จะตรวจสอบว่า PR ที่ land แล้วถูก merge แล้ว และ duplicate แต่ละรายการมี issue ที่อ้างอิงร่วมกันหรือมี hunk ที่เปลี่ยนแปลงทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## เกตการตรวจสอบ local และการ route ตามการเปลี่ยนแปลง

ตรรกะ changed-lane แบบ local อยู่ใน `scripts/changed-lanes.mjs` และถูก execute โดย `scripts/check-changed.mjs` เกตการตรวจสอบ local นั้นเข้มงวดเรื่องขอบเขต architecture มากกว่า scope แพลตฟอร์ม CI แบบกว้าง:

- การเปลี่ยนแปลง production ของ core รัน typecheck สำหรับ core prod และ core test พร้อม core lint/guards;
- การเปลี่ยนแปลงเฉพาะการทดสอบของ core รันเฉพาะ typecheck สำหรับ core test พร้อม core lint;
- การเปลี่ยนแปลง production ของ extension รัน typecheck สำหรับ extension prod และ extension test พร้อม extension lint;
- การเปลี่ยนแปลงเฉพาะการทดสอบของ extension รัน typecheck สำหรับ extension test พร้อม extension lint;
- การเปลี่ยนแปลง Plugin SDK สาธารณะหรือ plugin-contract ขยายไปยัง typecheck ของ extension เพราะ extension ขึ้นกับสัญญา core เหล่านั้น (การกวาด extension ของ Vitest ยังคงเป็นงานทดสอบที่ต้องระบุชัด);
- การปรับเวอร์ชันที่เป็น release metadata-only รันการตรวจสอบ version/config/root-dependency แบบเจาะจง;
- การเปลี่ยนแปลง root/config ที่ไม่ทราบแน่ชัดจะ fail safe ไปยัง check lanes ทั้งหมด.

การกำหนดเส้นทาง changed-test ในเครื่องอยู่ใน `scripts/test-projects.test-support.mjs` และตั้งใจให้เบากว่า `check:changed`: การแก้ไข test โดยตรงจะรันตัวมันเอง, การแก้ไข source จะเลือก mapping ที่ระบุไว้ก่อน จากนั้นจึงเป็น sibling tests และ dependent จาก import-graph การตั้งค่าการส่ง group-room ที่ใช้ร่วมกันเป็นหนึ่งใน explicit mappings: การเปลี่ยนแปลง config visible-reply ของ group, source reply delivery mode, หรือ system prompt ของ message-tool จะถูกกำหนดเส้นทางผ่าน core reply tests พร้อม regression ของการส่ง Discord และ Slack เพื่อให้การเปลี่ยนค่า default ที่ใช้ร่วมกันล้มเหลวก่อน push PR ครั้งแรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างทั้ง harness จนชุดที่ map แบบประหยัดไม่ใช่ proxy ที่น่าเชื่อถือ

## การตรวจสอบด้วย Testbox

รัน Testbox จาก repo root และควรใช้กล่อง warmed ใหม่สำหรับ broad proof ก่อนใช้เวลาไปกับ slow gate บนกล่องที่ถูกใช้ซ้ำ หมดอายุ หรือเพิ่งรายงานการ sync ที่ใหญ่ผิดคาด ให้รัน `pnpm testbox:sanity` ภายในกล่องก่อน

sanity check จะล้มเหลวอย่างรวดเร็วเมื่อไฟล์ root ที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short` แสดง tracked deletions อย่างน้อย 200 รายการ โดยปกติหมายความว่าสถานะ remote sync ไม่ใช่สำเนาที่น่าเชื่อถือของ PR; ให้หยุดกล่องนั้นและ warm กล่องใหม่แทนการ debug product test failure สำหรับ PR ที่ตั้งใจลบจำนวนมาก ให้ตั้ง `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับ sanity run นั้น

`pnpm testbox:run` ยังยุติการเรียก Blacksmith CLI ในเครื่องที่ค้างอยู่ในช่วง sync นานกว่า 5 นาทีโดยไม่มี output หลัง sync ตั้ง `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` เพื่อปิด guard นั้น หรือใช้ค่ามิลลิวินาทีที่มากขึ้นสำหรับ local diffs ที่ใหญ่ผิดปกติ

Crabbox คือ remote-box wrapper ที่ repo เป็นเจ้าของสำหรับ proof บน Linux ของ maintainer ใช้มันเมื่อ check กว้างเกินไปสำหรับ local edit loop, เมื่อ CI parity สำคัญ, หรือเมื่อ proof ต้องใช้ secrets, Docker, package lanes, กล่องที่ใช้ซ้ำได้, หรือ remote logs backend ปกติของ OpenClaw คือ `blacksmith-testbox`; capacity ของ AWS/Hetzner ที่เป็นเจ้าของเป็น fallback สำหรับ Blacksmith outages, quota issues, หรือการทดสอบ owned-capacity ที่ระบุชัดเจน

ก่อนรันครั้งแรก ให้ตรวจ wrapper จาก repo root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

repo wrapper จะปฏิเสธ Crabbox binary ที่ล้าสมัยซึ่งไม่ได้ประกาศ `blacksmith-testbox` ให้ส่ง provider อย่างชัดเจนแม้ว่า `.crabbox.yaml` จะมี owned-cloud defaults อยู่แล้ว

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

รัน focused test ซ้ำ:

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

อ่านสรุป JSON สุดท้าย fields ที่มีประโยชน์คือ `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, และ `totalMs` การรัน Crabbox แบบ one-shot ที่ backed โดย Blacksmith ควรหยุด Testbox โดยอัตโนมัติ; หากการรันถูกขัดจังหวะหรือ cleanup ไม่ชัดเจน ให้ตรวจกล่อง live และหยุดเฉพาะกล่องที่คุณสร้าง:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

ใช้ reuse เฉพาะเมื่อคุณตั้งใจต้องการหลายคำสั่งบนกล่อง hydrated เดียวกัน:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

หาก Crabbox เป็น layer ที่เสียแต่ Blacksmith เองยังทำงาน ให้ใช้ Blacksmith โดยตรงเป็น fallback แบบแคบ:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

หาก `blacksmith testbox list --all` และ `blacksmith testbox status` ทำงาน แต่ warmups ใหม่ค้างอยู่ที่ `queued` โดยไม่มี IP หรือ Actions run URL หลังผ่านไปสองสามนาที ให้ถือว่าเป็นแรงกดดันจาก Blacksmith provider, queue, billing, หรือ org-limit หยุด queued ids ที่คุณสร้าง หลีกเลี่ยงการเริ่ม Testboxes เพิ่ม และย้าย proof ไปยังเส้นทาง capacity ของ Crabbox ที่เป็นเจ้าของด้านล่าง ระหว่างที่มีคนตรวจ Blacksmith dashboard, billing, และ org limits

ยกระดับไปยัง capacity ของ Crabbox ที่เป็นเจ้าของเฉพาะเมื่อ Blacksmith ล่ม, ถูกจำกัด quota, ไม่มี environment ที่ต้องใช้, หรือ owned capacity เป็นเป้าหมายอย่างชัดเจน:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

ภายใต้แรงกดดันของ AWS ให้หลีกเลี่ยง `class=beast` เว้นแต่งานต้องใช้ CPU ระดับ 48xlarge-class จริง ๆ คำขอ `beast` เริ่มที่ 192 vCPUs และเป็นวิธีที่ง่ายที่สุดในการชน regional EC2 Spot หรือ On-Demand Standard quota ค่า default ของ `.crabbox.yaml` ที่ repo เป็นเจ้าของคือ `standard`, capacity regions หลายแห่ง, และ `capacity.hints: true` เพื่อให้ brokered AWS leases พิมพ์ region/market ที่เลือก, แรงกดดันของ quota, Spot fallback, และคำเตือน high-pressure class ใช้ `fast` สำหรับ broad checks ที่หนักกว่า, ใช้ `large` เฉพาะหลังจาก standard/fast ไม่พอ, และใช้ `beast` เฉพาะ lanes ที่ผูกกับ CPU เป็นกรณีพิเศษ เช่น full-suite หรือ all-plugin Docker matrices, release/blocker validation ที่ระบุชัด, หรือ high-core performance profiling อย่าใช้ `beast` สำหรับ `pnpm check:changed`, focused tests, งาน docs-only, lint/typecheck ปกติ, E2E repro ขนาดเล็ก, หรือ Blacksmith outage triage ใช้ `--market on-demand` สำหรับ capacity diagnosis เพื่อไม่ให้ความผันผวนของ Spot market ปะปนกับ signal

`.crabbox.yaml` เป็นเจ้าของ defaults ของ provider, sync, และ GitHub Actions hydration สำหรับ owned-cloud lanes ไฟล์นี้ exclude `.git` ในเครื่อง เพื่อให้ hydrated Actions checkout เก็บ remote Git metadata ของตัวเองแทนการ sync remotes และ object stores ในเครื่องของ maintainer และ exclude runtime/build artifacts ในเครื่องที่ไม่ควรถูกถ่ายโอนเด็ดขาด `.github/workflows/crabbox-hydrate.yml` เป็นเจ้าของ checkout, การตั้งค่า Node/pnpm, การ fetch `origin/main`, และ non-secret environment handoff สำหรับคำสั่ง owned-cloud `crabbox run --id <cbx_id>`

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
