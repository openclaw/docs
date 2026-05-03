---
read_when:
    - คุณต้องเข้าใจว่าเหตุใดงาน CI จึงถูกเรียกใช้หรือไม่ถูกเรียกใช้
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการรันหรือการรันซ้ำสำหรับการตรวจสอบความถูกต้องของรีลีส
    - คุณกำลังเปลี่ยนการ dispatch ของ ClawSweeper หรือการส่งต่อกิจกรรม GitHub
summary: กราฟงาน CI, เกตตามขอบเขต, ร่มการเผยแพร่, และคำสั่งภายในเครื่องที่เทียบเท่า
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-05-03T21:27:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: e07fc44aa844cb66ce529c570cbbbbf502a61bcbcbc3d9488557abb459ef7678
    source_path: ci.md
    workflow: 16
---

OpenClaw CI ทำงานในทุก push ไปยัง `main` และทุก pull request งาน `preflight` จะจำแนก diff และปิด lane ที่มีค่าใช้จ่ายสูงเมื่อมีเฉพาะพื้นที่ที่ไม่เกี่ยวข้องเปลี่ยนแปลง การรัน `workflow_dispatch` แบบแมนนวลตั้งใจข้ามการกำหนดขอบเขตอัจฉริยะและกระจายเป็นกราฟเต็มสำหรับ release candidate และการตรวจสอบแบบกว้าง lane ของ Android ยังคงเป็นแบบ opt-in ผ่าน `include_android` ความครอบคลุมของ Plugin สำหรับ release เท่านั้นอยู่ในเวิร์กโฟลว์ [`Plugin Prerelease`](#plugin-prerelease) แยกต่างหาก และจะรันจาก [`Full Release Validation`](#full-release-validation) หรือการ dispatch แบบแมนนวลที่ระบุชัดเจนเท่านั้น

## ภาพรวม Pipeline

| งาน                              | วัตถุประสงค์                                                                                                   | รันเมื่อ                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | ตรวจจับการเปลี่ยนแปลงเฉพาะเอกสาร ขอบเขตที่เปลี่ยนแปลง ส่วนขยายที่เปลี่ยนแปลง และสร้าง manifest ของ CI                   | เสมอเมื่อเป็น push และ PR ที่ไม่ใช่ draft |
| `security-scm-fast`              | ตรวจจับ private key และตรวจสอบเวิร์กโฟลว์ผ่าน `zizmor`                                                     | เสมอเมื่อเป็น push และ PR ที่ไม่ใช่ draft |
| `security-dependency-audit`      | ตรวจสอบ lockfile ฝั่ง production โดยไม่ติดตั้ง dependency เทียบกับคำแนะนำด้านความปลอดภัยของ npm                                          | เสมอเมื่อเป็น push และ PR ที่ไม่ใช่ draft |
| `security-fast`                  | aggregate ที่จำเป็นสำหรับงานความปลอดภัยแบบเร็ว                                                             | เสมอเมื่อเป็น push และ PR ที่ไม่ใช่ draft |
| `check-dependencies`             | รอบตรวจ dependency เฉพาะของ Production Knip พร้อมตัวป้องกัน allowlist ของไฟล์ที่ไม่ได้ใช้                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-artifacts`                | สร้าง `dist/`, Control UI, การตรวจ artifact ที่ build แล้ว และ artifact ปลายน้ำที่ใช้ซ้ำได้                       | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-core`               | lane ตรวจความถูกต้องบน Linux แบบเร็ว เช่น การตรวจ bundled/plugin-contract/protocol                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-contracts-channels` | การตรวจ contract ของ channel แบบแบ่ง shard พร้อมผลตรวจ aggregate ที่เสถียร                                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-core-test`          | shard ทดสอบ Core Node โดยไม่รวม lane ของ channel, bundled, contract และ extension                          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check`                          | เทียบเท่า gate หลักภายในแบบแบ่ง shard: type ของ prod, lint, guard, type ของ test และ strict smoke                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check-additional`               | architecture, drift ของ boundary/prompt แบบแบ่ง shard, guard ของ extension, package boundary และ gateway watch        | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-smoke`                    | การทดสอบ smoke ของ CLI ที่ build แล้ว และ smoke ของหน่วยความจำตอนเริ่มต้น                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks`                         | ตัวตรวจสอบสำหรับการทดสอบ channel ของ artifact ที่ build แล้ว                                                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-compat-node22`      | lane build และ smoke สำหรับความเข้ากันได้กับ Node 22                                                                | การ dispatch CI แบบแมนนวลสำหรับ release    |
| `check-docs`                     | การตรวจ format, lint และลิงก์เสียของเอกสาร                                                             | เอกสารเปลี่ยนแปลง                       |
| `skills-python`                  | Ruff + pytest สำหรับ Skills ที่มี Python รองรับ                                                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python-skill      |
| `checks-windows`                 | การทดสอบ process/path เฉพาะ Windows พร้อม regression ของ runtime import specifier ที่ใช้ร่วมกัน                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows           |
| `macos-node`                     | lane ทดสอบ TypeScript บน macOS โดยใช้ artifact ที่ build แล้วร่วมกัน                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `macos-swift`                    | Swift lint, build และ test สำหรับแอป macOS                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `android`                        | unit test ของ Android สำหรับทั้งสอง flavor พร้อมการ build debug APK หนึ่งรายการ                                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android           |
| `test-performance-agent`         | การปรับปรุงการทดสอบช้าของ Codex รายวันหลังจากกิจกรรมที่เชื่อถือได้                                                 | CI หลักสำเร็จหรือ dispatch แบบแมนนวล |
| `openclaw-performance`           | รายงานประสิทธิภาพ runtime ของ Kova แบบรายวัน/ตามคำขอ พร้อม lane mock-provider, deep-profile และ GPT 5.4 live | ตามกำหนดเวลาและ dispatch แบบแมนนวล      |

## ลำดับ Fail-fast

1. `preflight` ตัดสินใจว่า lane ใดมีอยู่ตั้งแต่ต้น ตรรกะ `docs-scope` และ `changed-scope` เป็นขั้นตอนภายในงานนี้ ไม่ใช่งานแยกต่างหาก
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` ล้มเหลวอย่างรวดเร็วโดยไม่ต้องรอ artifact และงาน matrix ของแพลตฟอร์มที่หนักกว่า
3. `build-artifacts` ทำงานทับซ้อนกับ lane Linux แบบเร็ว เพื่อให้ผู้ใช้ปลายน้ำเริ่มได้ทันทีที่ build ร่วมพร้อม
4. lane แพลตฟอร์มและ runtime ที่หนักกว่าจะกระจายงานหลังจากนั้น: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่เป็น `cancelled` เมื่อมี push ใหม่กว่าลงบน PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่านั่นเป็น noise ของ CI เว้นแต่การรันล่าสุดสำหรับ ref เดียวกันจะล้มเหลวด้วย การตรวจ aggregate shard ใช้ `!cancelled() && always()` เพื่อให้ยังรายงาน shard failure ปกติ แต่ไม่เข้าคิวหลังจากเวิร์กโฟลว์ทั้งหมดถูกแทนที่ไปแล้ว concurrency key ของ CI อัตโนมัติมีการ version (`CI-v7-*`) เพื่อให้ zombie ฝั่ง GitHub ในกลุ่มคิวเก่าไม่สามารถบล็อกการรัน main ใหม่ได้ไม่มีกำหนด การรันชุดเต็มแบบแมนนวลใช้ `CI-manual-v1-*` และไม่ยกเลิกการรันที่กำลังดำเนินอยู่

## ขอบเขตและการกำหนดเส้นทาง

ตรรกะขอบเขตอยู่ใน `scripts/ci-changed-scope.mjs` และครอบคลุมด้วย unit test ใน `src/scripts/ci-changed-scope.test.ts` การ dispatch แบบแมนนวลจะข้ามการตรวจจับ changed-scope และทำให้ manifest ของ preflight ทำงานเหมือนทุกพื้นที่ที่มีขอบเขตเปลี่ยนแปลง

- **การแก้ไขเวิร์กโฟลว์ CI** ตรวจสอบกราฟ Node CI พร้อม workflow linting แต่ไม่ได้บังคับ build native ของ Windows, Android หรือ macOS ด้วยตัวเอง lane แพลตฟอร์มเหล่านั้นยังคงจำกัดขอบเขตตามการเปลี่ยนแปลงซอร์สของแพลตฟอร์ม
- **การแก้ไขเฉพาะ routing ของ CI, การแก้ไข fixture ของ core-test ราคาถูกที่เลือกไว้ และการแก้ไข helper/test-routing ของ plugin contract แบบแคบ** ใช้เส้นทาง manifest แบบเร็วเฉพาะ Node: `preflight`, security และงาน `checks-fast-core` เพียงงานเดียว เส้นทางนั้นข้าม build artifact, ความเข้ากันได้กับ Node 22, channel contract, shard core เต็ม, shard bundled-plugin และ matrix guard เพิ่มเติม เมื่อการเปลี่ยนแปลงจำกัดอยู่ที่พื้นผิว routing หรือ helper ที่งานเร็วทดสอบโดยตรง
- **การตรวจ Windows Node** จำกัดขอบเขตอยู่ที่ wrapper ของ process/path เฉพาะ Windows, helper ของ npm/pnpm/UI runner, config ของ package manager และพื้นผิวเวิร์กโฟลว์ CI ที่เรียกใช้ lane นั้น การเปลี่ยนแปลง source, plugin, install-smoke และเฉพาะ test ที่ไม่เกี่ยวข้องยังคงอยู่บน lane Linux Node

กลุ่มทดสอบ Node ที่ช้าที่สุดถูกแยกหรือถ่วงน้ำหนักให้สมดุลเพื่อให้งานแต่ละงานยังเล็กโดยไม่จอง runner เกินจำเป็น: channel contract รันเป็น shard ถ่วงน้ำหนักสามชุด, lane core unit fast/support รันแยกกัน, infra runtime core ถูกแยกระหว่าง shard state และ process/config, auto-reply รันเป็น worker ที่สมดุล (โดยแยก subtree ของ reply เป็น shard agent-runner, dispatch และ commands/state-routing) และ config ของ agentic gateway/server ถูกแยกข้าม lane chat/auth/model/http-plugin/runtime/startup แทนที่จะรอ artifact ที่ build แล้ว การทดสอบ browser, QA, media และ Plugin อื่นๆ แบบกว้างใช้ config Vitest เฉพาะของตัวเองแทน plugin catch-all ร่วม Shard แบบ include-pattern บันทึกรายการเวลาโดยใช้ชื่อ shard ของ CI ดังนั้น `.artifacts/vitest-shard-timings.json` จึงแยกทั้ง config ออกจาก shard ที่ถูกกรองได้ `check-additional` เก็บงาน compile/canary ของ package-boundary ไว้ด้วยกัน และแยก architecture ของ runtime topology ออกจากความครอบคลุมของ gateway watch รายการ boundary guard ถูก stripe ข้าม matrix shard สี่ชุด โดยแต่ละชุดรัน guard อิสระที่เลือกไว้พร้อมกันและพิมพ์เวลาต่อการตรวจ รวมถึง `pnpm prompt:snapshots:check` เพื่อให้ prompt drift ของ happy path runtime Codex ถูกผูกกับ PR ที่ทำให้เกิดขึ้น Gateway watch, การทดสอบ channel และ shard core support-boundary รันพร้อมกันภายใน `build-artifacts` หลังจาก `dist/` และ `dist-runtime/` ถูก build แล้ว

Android CI รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` จากนั้น build Play debug APK flavor ของ third-party ไม่มี source set หรือ manifest แยกต่างหาก lane unit-test ของมันยังคง compile flavor ด้วย flag BuildConfig ของ SMS/call-log ขณะหลีกเลี่ยงงาน packaging debug APK ซ้ำในทุก push ที่เกี่ยวข้องกับ Android

Shard `check-dependencies` รัน `pnpm deadcode:dependencies` (รอบตรวจ dependency เฉพาะ production ของ Knip ที่ pin กับ Knip เวอร์ชันล่าสุด โดยปิดอายุ release ขั้นต่ำของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเทียบผลค้นหาไฟล์ production ที่ไม่ได้ใช้ของ Knip กับ `scripts/deadcode-unused-files.allowlist.mjs` guard ของไฟล์ที่ไม่ได้ใช้จะล้มเหลวเมื่อ PR เพิ่มไฟล์ที่ไม่ได้ใช้และยังไม่ได้ review ใหม่ หรือปล่อยรายการ allowlist ที่ stale ไว้ พร้อมยังรักษาพื้นผิว dynamic plugin, generated, build, live-test และ package bridge ที่ตั้งใจไว้ซึ่ง Knip ไม่สามารถ resolve แบบ static ได้

## การส่งต่อกิจกรรม ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` คือสะพานฝั่งปลายทางจากกิจกรรม repository ของ OpenClaw ไปยัง ClawSweeper มันไม่ checkout หรือ execute โค้ด pull request ที่ไม่น่าเชื่อถือ เวิร์กโฟลว์สร้าง GitHub App token จาก `CLAWSWEEPER_APP_PRIVATE_KEY` จากนั้น dispatch payload `repository_dispatch` ขนาดกะทัดรัดไปยัง `openclaw/clawsweeper`

เวิร์กโฟลว์มีสี่ lane:

- `clawsweeper_item` สำหรับคำขอ review issue และ pull request แบบเจาะจง;
- `clawsweeper_comment` สำหรับคำสั่ง ClawSweeper ที่ชัดเจนใน comment ของ issue;
- `clawsweeper_commit_review` สำหรับคำขอ review ระดับ commit บน push ไปยัง `main`;
- `github_activity` สำหรับกิจกรรม GitHub ทั่วไปที่ agent ของ ClawSweeper อาจตรวจดู

lane `github_activity` ส่งต่อเฉพาะ metadata ที่ normalize แล้ว: ประเภท event, action, actor, repository, หมายเลข item, URL, title, state และ excerpt สั้นๆ สำหรับ comment หรือ review เมื่อมี มันตั้งใจหลีกเลี่ยงการส่งต่อ body ของ webhook ทั้งหมด เวิร์กโฟลว์ฝั่งรับใน `openclaw/clawsweeper` คือ `.github/workflows/github-activity.yml` ซึ่งโพสต์ event ที่ normalize แล้วไปยังฮุก OpenClaw Gateway สำหรับ agent ของ ClawSweeper

กิจกรรมทั่วไปคือการสังเกต ไม่ใช่การส่งมอบโดยค่าเริ่มต้น agent ของ ClawSweeper ได้รับเป้าหมาย Discord ใน prompt และควรโพสต์ไปยัง `#clawsweeper` เฉพาะเมื่อ event นั้นน่าประหลาดใจ ดำเนินการได้ มีความเสี่ยง หรือมีประโยชน์ต่อการปฏิบัติการ การเปิด แก้ไข ความเคลื่อนไหวจาก bot, noise จาก webhook ซ้ำ และ traffic review ปกติควรได้ผลลัพธ์เป็น `NO_REPLY`

ถือว่า title, comment, body, ข้อความ review, ชื่อ branch และ commit message ของ GitHub เป็นข้อมูลที่ไม่น่าเชื่อถือตลอดเส้นทางนี้ สิ่งเหล่านี้เป็น input สำหรับการสรุปและ triage ไม่ใช่คำสั่งสำหรับเวิร์กโฟลว์หรือ runtime ของ agent

## การ dispatch แบบแมนนวล

การ dispatch CI แบบแมนนวลจะรันกราฟงานเดียวกับ CI ปกติ แต่บังคับเปิดทุก lane ที่มีขอบเขตแบบ non-Android: Linux Node shards, bundled-plugin shards, channel contracts, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, การตรวจสอบเอกสาร, Python skills, Windows, macOS และ Control UI i18n การ dispatch CI แบบแมนนวลแยกเดี่ยวจะรันเฉพาะ Android ด้วย `include_android=true`; umbrella ของการเผยแพร่เต็มรูปแบบจะเปิดใช้ Android โดยส่ง `include_android=true` การตรวจสอบแบบสแตติกก่อนเผยแพร่ของ Plugin, shard `agentic-plugins` ที่ใช้เฉพาะการเผยแพร่, การ sweep แบทช์ส่วนขยายเต็มรูปแบบ และ lane Docker ก่อนเผยแพร่ของ Plugin จะถูกยกเว้นจาก CI ชุดทดสอบ Docker ก่อนเผยแพร่จะรันเฉพาะเมื่อ `Full Release Validation` dispatch workflow `Plugin Prerelease` แยกต่างหากพร้อมเปิดใช้ gate การตรวจสอบความถูกต้องของการเผยแพร่

การรันแบบแมนนวลใช้กลุ่ม concurrency ที่ไม่ซ้ำกัน เพื่อไม่ให้ชุดเต็มของ release candidate ถูกยกเลิกโดยการรัน push หรือ PR อื่นบน ref เดียวกัน อินพุต `target_ref` ที่เป็นทางเลือกช่วยให้ caller ที่เชื่อถือได้รันกราฟนั้นกับ branch, tag หรือ SHA ของ commit แบบเต็ม โดยใช้ไฟล์ workflow จาก dispatch ref ที่เลือก

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## รันเนอร์

| รันเนอร์                         | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, งานความปลอดภัยแบบเร็วและ aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจสอบโปรโตคอล/สัญญา/bundled แบบเร็ว, การตรวจสอบ channel contract แบบ sharded, shard ของ `check` ยกเว้น lint, shard และ aggregate ของ `check-additional`, ตัวตรวจสอบ aggregate ของการทดสอบ Node, การตรวจสอบเอกสาร, Python skills, workflow-sanity, labeler, auto-response; preflight ของ install-smoke ยังใช้ Ubuntu ที่โฮสต์โดย GitHub เพื่อให้เมทริกซ์ Blacksmith เข้าคิวได้เร็วขึ้น |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shard ส่วนขยายที่น้ำหนักต่ำกว่า, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` และ `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard การทดสอบ Linux Node, shard การทดสอบ Plugin ที่ bundled, `android`                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (ไวต่อ CPU มากพอที่ 8 vCPU มีต้นทุนมากกว่าที่ประหยัดได้); build Docker ของ install-smoke (เวลาเข้าคิว 32-vCPU มีต้นทุนมากกว่าที่ประหยัดได้)                                                                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; fork จะ fallback ไปที่ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; fork จะ fallback ไปที่ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |

## สิ่งเทียบเท่าในเครื่อง

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

`OpenClaw Performance` คือ workflow ประสิทธิภาพของผลิตภัณฑ์/รันไทม์ โดยรันทุกวันบน `main` และสามารถ dispatch แบบแมนนวลได้:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

โดยปกติการ dispatch แบบแมนนวลจะ benchmark workflow ref ตั้งค่า `target_ref` เพื่อ benchmark release tag หรือ branch อื่นด้วย implementation ของ workflow ปัจจุบัน path ของรายงานที่เผยแพร่และ pointer ล่าสุดจะถูก key ตาม ref ที่ทดสอบ และ `index.md` แต่ละไฟล์จะบันทึก ref/SHA ที่ทดสอบ, workflow ref/SHA, Kova ref, profile, โหมด lane auth, model, จำนวน repeat และตัวกรอง scenario

workflow จะติดตั้ง OCM จาก release ที่ pin ไว้ และ Kova จาก `openclaw/Kova` ที่อินพุต `kova_ref` ซึ่ง pin ไว้ จากนั้นรันสาม lane:

- `mock-provider`: scenario การวินิจฉัยของ Kova กับรันไทม์ที่ build ในเครื่อง พร้อม auth ปลอมที่เข้ากันได้กับ OpenAI แบบ deterministic
- `mock-deep-profile`: การทำ profile CPU/heap/trace สำหรับ hotspot ของ startup, gateway และ agent-turn
- `live-gpt54`: agent turn จริงของ OpenAI `openai/gpt-5.4` ข้ามเมื่อไม่มี `OPENAI_API_KEY`

lane mock-provider ยังรัน source probe แบบ native ของ OpenClaw หลังจาก Kova pass: เวลา boot และหน่วยความจำของ gateway ในกรณี startup แบบ default, hook และ 50-Plugin; loop hello ซ้ำของ mock-OpenAI `channel-chat-baseline`; และคำสั่ง startup ของ CLI กับ gateway ที่ boot แล้ว สรุป Markdown ของ source probe อยู่ที่ `source/index.md` ในชุดรายงาน โดยมี JSON ดิบอยู่ข้างกัน

ทุก lane จะอัปโหลด artifact ของ GitHub เมื่อมีการกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` workflow จะ commit `report.json`, `report.md`, bundle, `index.md` และ artifact ของ source-probe ไปยัง `openclaw/clawgrit-reports` ใต้ `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` ด้วย pointer ของ tested-ref ปัจจุบันจะถูกเขียนเป็น `openclaw-performance/<tested-ref>/latest-<lane>.json`

## การตรวจสอบความถูกต้องของการเผยแพร่เต็มรูปแบบ

`Full Release Validation` คือ workflow umbrella แบบแมนนวลสำหรับ "รันทุกอย่างก่อนเผยแพร่" รับ branch, tag หรือ SHA ของ commit แบบเต็ม, dispatch workflow `CI` แบบแมนนวลพร้อม target นั้น, dispatch `Plugin Prerelease` สำหรับหลักฐาน plugin/package/static/Docker ที่ใช้เฉพาะการเผยแพร่ และ dispatch `OpenClaw Release Checks` สำหรับ install smoke, package acceptance, ชุดทดสอบ Docker release-path, live/E2E, OpenWebUI, QA Lab parity, Matrix และ lane Telegram เมื่อใช้ `rerun_group=all` และ `release_profile=full` จะรัน `NPM Telegram Beta E2E` กับ artifact `release-package-under-test` จาก release checks ด้วย หลังจากเผยแพร่แล้ว ให้ส่ง `npm_telegram_package_spec` เพื่อรัน lane package Telegram เดียวกันซ้ำกับ npm package ที่เผยแพร่แล้ว

ดู [การตรวจสอบความถูกต้องของการเผยแพร่เต็มรูปแบบ](/th/reference/full-release-validation) สำหรับ
เมทริกซ์ stage, ชื่องาน workflow ที่แน่นอน, ความแตกต่างของ profile, artifact และ
handle สำหรับ rerun แบบเจาะจง

`OpenClaw Release Publish` คือ workflow การเผยแพร่แบบแมนนวลที่ทำการเปลี่ยนแปลง Dispatch จาก `release/YYYY.M.D` หรือ `main` หลังจากมี release tag แล้ว และหลังจาก preflight ของ OpenClaw npm สำเร็จแล้ว โดยจะตรวจสอบ `pnpm plugins:sync:check`, dispatch `Plugin NPM Release` สำหรับ package Plugin ทั้งหมดที่เผยแพร่ได้, dispatch `Plugin ClawHub Release` สำหรับ SHA การเผยแพร่เดียวกัน และหลังจากนั้นเท่านั้นจึง dispatch `OpenClaw NPM Release` พร้อม `preflight_run_id` ที่บันทึกไว้

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

สำหรับหลักฐาน commit ที่ pin ไว้บน branch ที่เคลื่อนไหวเร็ว ให้ใช้ helper แทน
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

dispatch ref ของ GitHub workflow ต้องเป็น branch หรือ tag ไม่ใช่ SHA ของ commit ดิบ helper จะ push branch ชั่วคราว `release-ci/<sha>-...` ที่ target SHA, dispatch `Full Release Validation` จาก ref ที่ pin นั้น, ตรวจสอบว่า `headSha` ของ workflow ลูกทุกตัวตรงกับ target และลบ branch ชั่วคราวเมื่อการรันเสร็จสิ้น ตัวตรวจสอบ umbrella จะ fail ด้วยหาก workflow ลูกใดรันที่ SHA อื่น

`release_profile` ควบคุมขอบเขต live/provider ที่ส่งเข้าไปในการตรวจสอบรีลีส เวิร์กโฟลว์รีลีสแบบแมนนวลมีค่าเริ่มต้นเป็น `stable`; ใช้ `full` เฉพาะเมื่อคุณตั้งใจต้องการเมทริกซ์ provider/media สำหรับคำแนะนำแบบกว้างเท่านั้น

- `minimum` คงไว้เฉพาะเลน OpenAI/core ที่สำคัญต่อรีลีสและเร็วที่สุด
- `stable` เพิ่มชุด provider/backend แบบ stable
- `full` รันเมทริกซ์ provider/media สำหรับคำแนะนำแบบกว้าง

umbrella จะบันทึก child run ids ที่ dispatch แล้ว และงานสุดท้าย `Verify full validation` จะตรวจสอบผลสรุปของ child run ปัจจุบันอีกครั้งและเพิ่มตารางงานที่ช้าที่สุดสำหรับแต่ละ child run หากมีการรัน child workflow ซ้ำและเปลี่ยนเป็นเขียว ให้รันซ้ำเฉพาะงาน parent verifier เพื่อรีเฟรชผลลัพธ์ของ umbrella และสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รับ `rerun_group` ใช้ `all` สำหรับ release candidate, `ci` สำหรับเฉพาะ child CI แบบเต็มตามปกติ, `plugin-prerelease` สำหรับเฉพาะ child prerelease ของ Plugin, `release-checks` สำหรับ child รีลีสทุกตัว หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, หรือ `npm-telegram` บน umbrella วิธีนี้ทำให้การรันซ้ำของกล่องรีลีสที่ล้มเหลวถูกจำกัดขอบเขตหลังจากการแก้ไขแบบเจาะจง

`OpenClaw Release Checks` ใช้ workflow ref ที่เชื่อถือได้เพื่อ resolve ref ที่เลือกหนึ่งครั้งเป็น tarball `release-package-under-test` จากนั้นส่ง artifact นั้นไปยังทั้งเวิร์กโฟลว์ Docker เส้นทางรีลีส live/E2E และ package acceptance shard วิธีนี้ทำให้ไบต์ของแพ็กเกจสอดคล้องกันข้ามกล่องรีลีส และหลีกเลี่ยงการ repack candidate เดียวกันใน child jobs หลายตัว

การรัน `Full Release Validation` ซ้ำสำหรับ `ref=main` และ `rerun_group=all`
จะแทนที่ umbrella เก่า parent monitor จะยกเลิก child workflow ใด ๆ ที่
dispatch ไปแล้วเมื่อ parent ถูกยกเลิก ดังนั้นการตรวจสอบ main ที่ใหม่กว่า
จะไม่ต้องรออยู่หลัง release-check run เก่าสองชั่วโมง การตรวจสอบ release branch/tag
และกลุ่ม rerun แบบเจาะจงจะคง `cancel-in-progress: false`

## ชาร์ด Live และ E2E

child ของ release live/E2E ยังคงครอบคลุม `pnpm test:live` แบบ native กว้าง แต่รันเป็นชาร์ดที่มีชื่อผ่าน `scripts/test-live-shard.mjs` แทน job แบบ serial หนึ่งงาน:

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
- ชาร์ด media audio/video ที่แยกออก และชาร์ด music ที่กรองตาม provider

วิธีนี้คงการครอบคลุมไฟล์เดิมไว้ ในขณะเดียวกันก็ทำให้ความล้มเหลวของ provider live ที่ช้ารันซ้ำและวินิจฉัยได้ง่ายขึ้น ชื่อชาร์ดรวม `native-live-extensions-o-z`, `native-live-extensions-media`, และ `native-live-extensions-media-music` ยังคงใช้ได้สำหรับการรันซ้ำแบบ manual one-shot

ชาร์ด native live media รันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งสร้างโดยเวิร์กโฟลว์ `Live Media Runner Image` อิมเมจนั้นติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้าแล้ว; งาน media ตรวจสอบเฉพาะไบนารีก่อน setup เท่านั้น ให้คงชุดทดสอบ live ที่ใช้ Docker-backed ไว้บน Blacksmith runners ปกติ เพราะ container jobs ไม่ใช่ที่ที่เหมาะสำหรับเปิดการทดสอบ Docker ซ้อน

ชาร์ด live model/backend ที่ใช้ Docker-backed ใช้อิมเมจแชร์แยก `ghcr.io/openclaw/openclaw-live-test:<sha>` ต่อ commit ที่เลือกหนึ่งรายการ เวิร์กโฟลว์ live release จะ build และ push อิมเมจนั้นหนึ่งครั้ง จากนั้นชาร์ด Docker live model, Gateway ที่แบ่งตาม provider, CLI backend, ACP bind, และ Codex harness จะรันด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ชาร์ด Gateway Docker มีขีดจำกัด `timeout` ระดับสคริปต์ที่ชัดเจนซึ่งต่ำกว่า timeout ของ workflow job เพื่อให้ container หรือเส้นทาง cleanup ที่ค้างล้มเหลวได้เร็ว แทนที่จะกินงบเวลา release-check ทั้งหมด หากชาร์ดเหล่านั้น rebuild target Docker source เต็มเองแยกกัน แสดงว่า release run ตั้งค่าผิดและจะเสียเวลาจริงไปกับการ build อิมเมจซ้ำ

## การยอมรับแพ็กเกจ

ใช้ `Package Acceptance` เมื่อคำถามคือ "แพ็กเกจ OpenClaw ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์ได้หรือไม่" สิ่งนี้ต่างจาก CI ปกติ: CI ปกติตรวจสอบ source tree ขณะที่ package acceptance ตรวจสอบ tarball เดียวผ่าน Docker E2E harness เดียวกับที่ผู้ใช้ใช้งานหลัง install หรือ update

### งาน

1. `resolve_package` checkout `workflow_ref`, resolve package candidate หนึ่งรายการ, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, อัปโหลดทั้งคู่เป็น artifact `package-under-test`, และพิมพ์ source, workflow ref, package ref, version, SHA-256, และ profile ในสรุปขั้นตอนของ GitHub
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` เวิร์กโฟลว์ reusable จะดาวน์โหลด artifact นั้น, ตรวจสอบ inventory ของ tarball, เตรียม package-digest Docker images เมื่อจำเป็น, และรัน Docker lanes ที่เลือกกับแพ็กเกจนั้นแทนการ pack workflow checkout เมื่อ profile เลือก `docker_lanes` แบบเจาะจงหลายรายการ เวิร์กโฟลว์ reusable จะเตรียมแพ็กเกจและ shared images หนึ่งครั้ง จากนั้น fan out lanes เหล่านั้นเป็นงาน Docker แบบเจาะจงที่รันขนานกันพร้อม artifacts ที่ไม่ซ้ำกัน
3. `package_telegram` เรียก `NPM Telegram Beta E2E` ตามตัวเลือก โดยจะรันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้ง artifact `package-under-test` เดียวกันเมื่อ Package Acceptance resolve มาแล้ว; การ dispatch Telegram แบบ standalone ยังคงติดตั้ง npm spec ที่เผยแพร่แล้วได้
4. `summary` ทำให้เวิร์กโฟลว์ล้มเหลวหาก package resolution, Docker acceptance, หรือ Telegram lane ตามตัวเลือกล้มเหลว

### แหล่งที่มาของ Candidate

- `source=npm` รับเฉพาะ `openclaw@beta`, `openclaw@latest`, หรือเวอร์ชันรีลีส OpenClaw แบบ exact เช่น `openclaw@2026.4.27-beta.2` ใช้สิ่งนี้สำหรับ acceptance ของ prerelease/stable ที่เผยแพร่แล้ว
- `source=ref` pack branch, tag, หรือ full commit SHA ของ `package_ref` ที่เชื่อถือได้ resolver จะ fetch branch/tag ของ OpenClaw, ตรวจสอบว่า commit ที่เลือก reachable จากประวัติ branch ของ repository หรือ release tag, ติดตั้ง deps ใน detached worktree, และ pack ด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` ดาวน์โหลด `.tgz` แบบ HTTPS; ต้องมี `package_sha256`
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งไฟล์จาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็นตัวเลือก แต่ควรระบุสำหรับ artifacts ที่แชร์ภายนอก

แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือโค้ด workflow/harness ที่เชื่อถือได้ซึ่งรันการทดสอบ `package_ref` คือ source commit ที่จะถูก pack เมื่อ `source=ref` วิธีนี้ทำให้ test harness ปัจจุบันตรวจสอบ source commits เก่าที่เชื่อถือได้โดยไม่ต้องรัน workflow logic เก่า

### Suite profiles

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` รวมกับ `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — ชิ้นส่วน Docker เส้นทางรีลีสเต็มพร้อม OpenWebUI
- `custom` — `docker_lanes` แบบ exact; จำเป็นเมื่อ `suite_profile=custom`

profile `package` ใช้การครอบคลุม Plugin แบบ offline เพื่อให้การตรวจสอบแพ็กเกจที่เผยแพร่แล้วไม่ถูกกั้นด้วยความพร้อมใช้งาน live ของ ClawHub lane Telegram ตามตัวเลือกใช้ artifact `package-under-test` ซ้ำใน `NPM Telegram Beta E2E` โดยคงเส้นทาง npm spec ที่เผยแพร่แล้วไว้สำหรับ standalone dispatches

สำหรับนโยบายเฉพาะด้านการทดสอบ update และ Plugin รวมถึงคำสั่ง local,
Docker lanes, input ของ Package Acceptance, ค่าเริ่มต้นของรีลีส, และการวิเคราะห์ความล้มเหลว,
ดู [การทดสอบ updates และ plugins](/th/help/testing-updates-plugins)

Release checks เรียก Package Acceptance ด้วย `source=artifact`, artifact แพ็กเกจรีลีสที่เตรียมไว้, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues`, และ `telegram_mode=mock-openai` วิธีนี้ทำให้หลักฐาน package migration, update, การ cleanup dependency ของ stale-plugin, การ repair การติดตั้ง configured-plugin, Plugin แบบ offline, plugin-update, และ Telegram อยู่บน tarball แพ็กเกจที่ resolve เดียวกัน ตั้งค่า `package_acceptance_package_spec` บน Full Release Validation หรือ OpenClaw Release Checks เพื่อรันเมทริกซ์เดียวกันกับแพ็กเกจ npm ที่ส่งมอบแล้วแทน artifact ที่ build จาก SHA การตรวจสอบรีลีส Cross-OS ยังคงครอบคลุม onboarding, installer, และพฤติกรรมแพลตฟอร์มที่เฉพาะกับ OS; การตรวจสอบผลิตภัณฑ์ด้าน package/update ควรเริ่มจาก Package Acceptance lane Docker `published-upgrade-survivor` ตรวจสอบ baseline แพ็กเกจที่เผยแพร่แล้วหนึ่งรายการต่อการรัน ใน Package Acceptance tarball `package-under-test` ที่ resolve แล้วจะเป็น candidate เสมอ และ `published_upgrade_survivor_baseline` เลือก fallback baseline ที่เผยแพร่แล้ว โดยมีค่าเริ่มต้นเป็น `openclaw@latest`; คำสั่ง rerun ของ lane ที่ล้มเหลวจะรักษา baseline นั้นไว้ ตั้งค่า `published_upgrade_survivor_baselines=all-since-2026.4.23` เพื่อขยาย Full Release CI ครอบคลุมทุก stable npm release ตั้งแต่ `2026.4.23` ถึง `latest`; `release-history` ยังคงใช้ได้สำหรับการสุ่มตัวอย่างแบบ manual ที่กว้างขึ้นพร้อม anchor ก่อนวันที่เก่ากว่า ตั้งค่า `published_upgrade_survivor_scenarios=reported-issues` เพื่อขยาย baseline เดียวกันข้าม fixtures ที่มีรูปแบบคล้าย issue สำหรับ config ของ Feishu, ไฟล์ bootstrap/persona ที่ preserve ไว้, การติดตั้ง OpenClaw Plugin ที่ configure ไว้, tilde log paths, และ root dependency ของ legacy Plugin ที่ stale เวิร์กโฟลว์ `Update Migration` แยกต่างหากใช้ Docker lane `update-migration` พร้อม `all-since-2026.4.23` และ `plugin-deps-cleanup` เมื่อคำถามคือการ cleanup update ที่เผยแพร่แล้วแบบละเอียดครบถ้วน ไม่ใช่ขอบเขต Full Release CI ปกติ การรันรวมแบบ local สามารถส่ง package specs แบบ exact ด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, คง lane เดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` เช่น `openclaw@2026.4.15`, หรือตั้งค่า `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` สำหรับเมทริกซ์ scenario lane ที่เผยแพร่แล้ว configure baseline ด้วยสูตรคำสั่ง `openclaw config set` ที่ฝังไว้, บันทึกขั้นตอนสูตรใน `summary.json`, และ probe `/healthz`, `/readyz`, รวมถึงสถานะ RPC หลัง Gateway start lane Windows packaged และ installer fresh ยังตรวจสอบด้วยว่าแพ็กเกจที่ติดตั้งแล้วสามารถ import browser-control override จาก raw absolute Windows path ได้ smoke agent-turn แบบ cross-OS ของ OpenAI มีค่าเริ่มต้นเป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อตั้งค่าไว้ มิฉะนั้นเป็น `openai/gpt-5.4` ดังนั้นหลักฐาน install และ Gateway จะยังอยู่บนโมเดลทดสอบ GPT-5 พร้อมหลีกเลี่ยงค่าเริ่มต้น GPT-4.x

### หน้าต่างความเข้ากันได้ของ Legacy

Package Acceptance มีหน้าต่างความเข้ากันได้กับ legacy แบบมีขอบเขตสำหรับแพ็กเกจที่เผยแพร่แล้ว แพ็กเกจถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้เส้นทาง compatibility ได้:

- รายการ QA ส่วนตัวที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ tarball ละไว้;
- `doctor-switch` อาจข้าม subcase persistence ของ `gateway install --wrapper` เมื่อแพ็กเกจไม่ expose flag นั้น;
- `update-channel-switch` อาจ prune `pnpm.patchedDependencies` ที่หายไปจาก fake git fixture ที่ได้จาก tarball และอาจ log `update.channel` ที่ persist แล้วแต่หายไป;
- smoke ของ Plugin อาจอ่านตำแหน่ง install-record แบบ legacy หรือยอมรับ marketplace install-record persistence ที่หายไป;
- `plugin-update` อาจอนุญาตการ migrate metadata ของ config ขณะที่ยังต้องการให้ install record และพฤติกรรม no-reinstall คงเดิม

แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนสำหรับไฟล์ stamp ของ local build metadata ที่ถูกส่งไปแล้วด้วย แพ็กเกจที่ใหม่กว่านั้นต้องเป็นไปตามสัญญาสมัยใหม่; เงื่อนไขเดียวกันจะล้มเหลวแทนที่จะเตือนหรือข้าม

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

เมื่อดีบักการรัน package acceptance ที่ล้มเหลว ให้เริ่มที่สรุป `resolve_package` เพื่อยืนยันแหล่งที่มาของแพ็กเกจ เวอร์ชัน และ SHA-256 จากนั้นตรวจสอบ child run ของ `docker_acceptance` และ Docker artifacts ของมัน: `.artifacts/docker-tests/**/summary.json`, `failures.json`, บันทึก lane, phase timings และคำสั่ง rerun ควร rerun โปรไฟล์แพ็กเกจที่ล้มเหลวหรือ Docker lanes ที่ตรงกัน แทนการ rerun full release validation

## Install smoke

เวิร์กโฟลว์ `Install Smoke` แยกต่างหากใช้ scope script เดียวกันซ้ำผ่าน job `preflight` ของตัวเอง โดยแบ่ง smoke coverage ออกเป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **Fast path** ทำงานสำหรับ pull requests ที่แตะพื้นผิว Docker/แพ็กเกจ การเปลี่ยนแปลงแพ็กเกจ/manifest ของ Plugin ที่รวมมา หรือพื้นผิว core plugin/channel/gateway/Plugin SDK ที่งาน Docker smoke ใช้ทดสอบ การเปลี่ยนแปลง Plugin ที่รวมมาแบบ source-only การแก้ไขเฉพาะ test และการแก้ไขเฉพาะ docs จะไม่จอง Docker workers Fast path จะบิลด์อิมเมจ root Dockerfile หนึ่งครั้ง ตรวจสอบ CLI รัน smoke ของ agents delete shared-workspace CLI รัน container gateway-network e2e ตรวจสอบ build arg ของส่วนขยายที่รวมมา และรันโปรไฟล์ Docker ของ Plugin ที่รวมมาแบบมีขอบเขตภายใต้ command timeout รวม 240 วินาที (การรัน Docker ของแต่ละสถานการณ์ถูกจำกัดแยกกัน)
- **Full path** เก็บ QR package install และ installer Docker/update coverage ไว้สำหรับการรันตามกำหนดทุกคืน manual dispatches, workflow-call release checks และ pull requests ที่แตะพื้นผิว installer/package/Docker จริงๆ ใน full mode นั้น install-smoke จะเตรียมหรือใช้ซ้ำอิมเมจ target-SHA GHCR root Dockerfile smoke หนึ่งอิมเมจ จากนั้นรัน QR package install, root Dockerfile/gateway smokes, installer/update smokes และ Docker E2E ของ Plugin ที่รวมมาแบบ fast เป็นงานแยกกัน เพื่อให้งาน installer ไม่ต้องรอหลัง root image smokes

การ push ไปยัง `main` (รวมถึง merge commits) ไม่ได้บังคับใช้ full path; เมื่อ logic ของ changed-scope จะร้องขอ coverage แบบ full บนการ push เวิร์กโฟลว์จะคง fast Docker smoke ไว้และปล่อย full install smoke ให้ nightly หรือ release validation

smoke ของ Bun global install image-provider ที่ช้านั้นถูก gate แยกต่างหากด้วย `run_bun_global_install_smoke` โดยรันตามกำหนด nightly และจากเวิร์กโฟลว์ release checks และ manual `Install Smoke` dispatches สามารถเลือกเปิดใช้ได้ แต่ pull requests และการ push ไปยัง `main` จะไม่รัน QR และ installer Docker tests ยังคงมี Dockerfiles ที่เน้น install ของตัวเอง

## Local Docker E2E

`pnpm test:docker:all` จะ prebuild อิมเมจ live-test ที่ใช้ร่วมกันหนึ่งอิมเมจ แพ็ก OpenClaw หนึ่งครั้งเป็น npm tarball และบิลด์อิมเมจ `scripts/e2e/Dockerfile` ที่ใช้ร่วมกันสองอิมเมจ:

- bare Node/Git runner สำหรับ lanes installer/update/plugin-dependency;
- อิมเมจเชิงฟังก์ชันที่ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ lanes ฟังก์ชันปกติ

คำจำกัดความของ Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, logic ของ planner อยู่ใน `scripts/lib/docker-e2e-plan.mjs` และ runner จะ execute เฉพาะ plan ที่เลือก scheduler เลือกอิมเมจต่อ lane ด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` จากนั้นรัน lanes ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### ค่าที่ปรับได้

| ตัวแปร | ค่าเริ่มต้น | วัตถุประสงค์ |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | จำนวน slot ของ main-pool สำหรับ lanes ปกติ |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | จำนวน slot ของ tail-pool ที่ไวต่อ provider |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | เพดาน live lane พร้อมกันเพื่อไม่ให้ providers throttle |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | เพดาน lane ติดตั้ง npm พร้อมกัน |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | เพดาน multi-service lane พร้อมกัน |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | ระยะหน่วงระหว่างการเริ่ม lane เพื่อหลีกเลี่ยง Docker daemon create storms; ตั้ง `0` เพื่อไม่หน่วง |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | fallback timeout ต่อ lane (120 นาที); live/tail lanes บางรายการใช้เพดานที่เข้มกว่า |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` พิมพ์ scheduler plan โดยไม่รัน lanes |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | รายการ lane ที่ตรงกันทุกตัวคั่นด้วย comma; ข้าม cleanup smoke เพื่อให้ agents ทำซ้ำ lane ที่ล้มเหลวหนึ่งรายการได้ |

lane ที่หนักกว่า effective cap ของตัวเองยังสามารถเริ่มจาก pool ที่ว่างได้ จากนั้นจะรันเพียงลำพังจนกว่าจะปล่อย capacity local aggregate จะ preflight Docker ลบคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่ แสดงสถานะ active-lane บันทึก lane timings เพื่อจัดลำดับ longest-first และหยุด scheduling lanes แบบ pooled ใหม่หลังความล้มเหลวแรกตามค่าเริ่มต้น

### เวิร์กโฟลว์ live/E2E ที่ใช้ซ้ำได้

เวิร์กโฟลว์ live/E2E ที่ใช้ซ้ำได้จะถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องใช้ coverage ของแพ็กเกจ ชนิดอิมเมจ live image, lane และ credentials ใด `scripts/docker-e2e.mjs` จากนั้นจะแปลง plan นั้นเป็น GitHub outputs และ summaries โดยจะ either แพ็ก OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลด package artifact ของ current-run หรือดาวน์โหลด package artifact จาก `package_artifact_run_id`; ตรวจสอบ inventory ของ tarball; บิลด์และ push อิมเมจ bare/functional GHCR Docker E2E ที่ tag ด้วย package-digest ผ่าน Docker layer cache ของ Blacksmith เมื่อ plan ต้องใช้ lanes ที่ติดตั้งแพ็กเกจแล้ว; และใช้ inputs `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรืออิมเมจ package-digest ที่มีอยู่ซ้ำแทนการ rebuild การ pull อิมเมจ Docker จะ retry ด้วย timeout ต่อ attempt แบบมีขอบเขต 180 วินาที เพื่อให้ registry/cache stream ที่ค้าง retry ได้เร็วแทนที่จะใช้เวลาส่วนใหญ่ของ CI critical path

### ชิ้นส่วน release-path

Docker coverage ของ release จะรัน jobs แบบแบ่งเป็น chunk ที่เล็กลงด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละ chunk pull เฉพาะชนิดอิมเมจที่ต้องใช้และ execute หลาย lanes ผ่าน scheduler แบบ weighted เดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Docker chunks ของ release ปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` และ `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` ส่วน `plugins-runtime-core`, `plugins-runtime` และ `plugins-integrations` ยังคงเป็น aliases รวมของ plugin/runtime alias ของ lane `install-e2e` ยังคงเป็น alias rerun แบบ manual รวมสำหรับ provider installer lanes ทั้งสอง

OpenWebUI ถูกพับเข้าไปใน `plugins-runtime-services` เมื่อ full release-path coverage ร้องขอ และเก็บ chunk `openwebui` แบบ standalone ไว้เฉพาะ dispatches ที่เป็น OpenWebUI-only เท่านั้น bundled-channel update lanes จะ retry หนึ่งครั้งสำหรับความล้มเหลวชั่วคราวของเครือข่าย npm

แต่ละ chunk จะอัปโหลด `.artifacts/docker-tests/` พร้อมบันทึก lane, timings, `summary.json`, `failures.json`, phase timings, scheduler plan JSON, ตาราง slow-lane และคำสั่ง rerun ต่อ lane input `docker_lanes` ของเวิร์กโฟลว์จะรัน lanes ที่เลือกกับอิมเมจที่เตรียมไว้แทน chunk jobs ซึ่งจำกัดการดีบัก failed-lane ให้อยู่ใน Docker job เป้าหมายหนึ่งรายการ และเตรียม ดาวน์โหลด หรือใช้ package artifact ซ้ำสำหรับการรันนั้น; หาก lane ที่เลือกเป็น live Docker lane งานเป้าหมายจะบิลด์ live-test image ในเครื่องสำหรับ rerun นั้น คำสั่ง GitHub rerun ต่อ lane ที่สร้างขึ้นจะรวม `package_artifact_run_id`, `package_artifact_name` และ prepared image inputs เมื่อมีค่าเหล่านั้น เพื่อให้ lane ที่ล้มเหลวสามารถใช้แพ็กเกจและอิมเมจเดียวกันจากการรันที่ล้มเหลวซ้ำได้

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

เวิร์กโฟลว์ live/E2E ตามกำหนดเวลาจะรัน Docker suite แบบ full release-path ทุกวัน

## Plugin Prerelease

`Plugin Prerelease` เป็น coverage ระดับ product/package ที่มีค่าใช้จ่ายสูงกว่า จึงเป็นเวิร์กโฟลว์แยกที่ถูก dispatch โดย `Full Release Validation` หรือโดย operator อย่างชัดเจน pull requests ปกติ การ push ไปยัง `main` และ standalone manual CI dispatches จะปิด suite นี้ไว้ โดยจะกระจาย tests ของ Plugin ที่รวมมาข้าม extension workers แปดตัว; งาน extension shard เหล่านั้นรัน plugin config groups ได้สูงสุดสองกลุ่มพร้อมกัน โดยใช้ Vitest worker หนึ่งตัวต่อกลุ่มและ Node heap ที่ใหญ่ขึ้น เพื่อให้ plugin batches ที่ import-heavy ไม่สร้าง CI jobs เพิ่ม เส้นทาง Docker prerelease เฉพาะ release จะ batch Docker lanes เป้าหมายเป็นกลุ่มเล็กๆ เพื่อหลีกเลี่ยงการจอง runners หลายสิบตัวสำหรับ jobs ความยาวหนึ่งถึงสามนาที

## QA Lab

QA Lab มี CI lanes เฉพาะนอกเวิร์กโฟลว์ smart-scoped หลัก Agentic parity ถูกซ้อนอยู่ภายใต้ QA และ release harnesses แบบกว้าง ไม่ใช่เวิร์กโฟลว์ PR แบบ standalone ใช้ `Full Release Validation` พร้อม `rerun_group=qa-parity` เมื่อ parity ควรไปพร้อมกับการรัน validation แบบกว้าง

- เวิร์กโฟลว์ `QA-Lab - All Lanes` รันทุกคืนบน `main` และบน manual dispatch; โดย fan out mock parity lane, live Matrix lane และ live Telegram กับ Discord lanes เป็น jobs ขนานกัน Live jobs ใช้ environment `qa-live-shared` และ Telegram/Discord ใช้ Convex leases

Release checks รัน Matrix และ Telegram live transport lanes ด้วย deterministic mock provider และโมเดลแบบ mock-qualified (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อแยก channel contract ออกจาก live model latency และการ startup ปกติของ provider-plugin live transport gateway ปิด memory search เพราะ QA parity ครอบคลุมพฤติกรรม memory แยกต่างหาก; provider connectivity ถูกครอบคลุมโดย live model, native provider และ Docker provider suites แยกต่างหาก

Matrix ใช้ `--profile fast` สำหรับ scheduled และ release gates และเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout รองรับ ค่าเริ่มต้นของ CLI และ manual workflow input ยังคงเป็น `all`; manual `matrix_profile=all` dispatch จะแบ่ง full Matrix coverage เป็น shard เสมอใน jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli`

`OpenClaw Release Checks` ยังรัน QA Lab lanes ที่สำคัญต่อ release ก่อนอนุมัติ release; QA parity gate ของมันรัน candidate และ baseline packs เป็น parallel lane jobs จากนั้นดาวน์โหลด artifacts ทั้งสองลงใน report job ขนาดเล็กสำหรับการเปรียบเทียบ parity ขั้นสุดท้าย

สำหรับ PRs ปกติ ให้ยึดตามหลักฐาน CI/check ที่ scoped แทนการถือว่า parity เป็นสถานะที่จำเป็น

## CodeQL

เวิร์กโฟลว์ `CodeQL` ตั้งใจให้เป็นตัวสแกนความปลอดภัยรอบแรกแบบแคบ ไม่ใช่การกวาดตรวจทั้ง repository แบบเต็ม รายวัน แบบสั่งเอง และ guard run ของ pull request ที่ไม่ใช่ draft จะสแกนโค้ดเวิร์กโฟลว์ Actions พร้อมพื้นผิว JavaScript/TypeScript ที่มีความเสี่ยงสูงสุด โดยใช้ security query ความเชื่อมั่นสูงที่กรองไว้ที่ `security-severity` ระดับสูง/วิกฤต

guard ของ pull request ยังคงเบา: จะเริ่มเฉพาะเมื่อมีการเปลี่ยนแปลงภายใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` หรือ `src` และจะรันเมทริกซ์ความปลอดภัยความเชื่อมั่นสูงชุดเดียวกับเวิร์กโฟลว์ตามกำหนด Android และ macOS CodeQL จะไม่อยู่ในค่าเริ่มต้นของ PR

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                          | พื้นผิว                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | การยืนยันตัวตน, secret, แซนด์บ็อกซ์, Cron และ baseline ของ Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการใช้งานของ implementation ช่องทางหลัก รวมถึง runtime ของช่องทาง Plugin, Gateway, Plugin SDK, secret และจุดสัมผัสด้าน audit              |
| `/codeql-security-high/network-ssrf-boundary`     | พื้นผิวนโยบาย SSRF ของ core SSRF, การแยกวิเคราะห์ IP, network guard, web-fetch และ Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | เซิร์ฟเวอร์ MCP, helper การรัน process, การส่งออกขาออก และ gate การรันเครื่องมือของ agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | พื้นผิวความไว้วางใจของการติดตั้ง Plugin, loader, manifest, registry, การติดตั้ง package-manager, การโหลด source และสัญญา package ของ Plugin SDK |

### shard ความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — shard ความปลอดภัย Android ตามกำหนดเวลา สร้างแอป Android ด้วยตนเองสำหรับ CodeQL บน Blacksmith Linux runner ที่เล็กที่สุดที่ workflow sanity ยอมรับ อัปโหลดภายใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — shard ความปลอดภัย macOS รายสัปดาห์/สั่งเอง สร้างแอป macOS ด้วยตนเองสำหรับ CodeQL บน Blacksmith macOS กรองผลลัพธ์การ build ของ dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดภายใต้ `/codeql-critical-security/macos` คงไว้นอกค่าเริ่มต้นรายวันเพราะการ build macOS ครอง runtime แม้จะสะอาดก็ตาม

### หมวดหมู่ Critical Quality

`CodeQL Critical Quality` คือ shard ฝั่ง non-security ที่คู่กัน มันรันเฉพาะ query คุณภาพ JavaScript/TypeScript แบบ non-security ระดับ error-severity บนพื้นผิวมูลค่าสูงแบบแคบบน Blacksmith Linux runner ขนาดเล็กกว่า guard ของ pull request ตั้งใจให้เล็กกว่าโปรไฟล์ตามกำหนด: PR ที่ไม่ใช่ draft จะรันเฉพาะ shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` ที่ตรงกัน สำหรับการเปลี่ยนแปลงโค้ดการรันคำสั่ง/model/tool ของ agent และการ dispatch การตอบกลับ, โค้ด schema/migration/IO ของ config, โค้ด auth/secrets/sandbox/security, runtime ของช่องทางหลักและช่องทาง Plugin ที่ bundled, protocol/server-method ของ Gateway, runtime ของ memory/ส่วนเชื่อม SDK, MCP/process/การส่งออกขาออก, runtime ของ provider/catalog model, diagnostics ของ session/คิวการส่ง, loader ของ Plugin, Plugin SDK/สัญญา package หรือ runtime การตอบกลับของ Plugin SDK การเปลี่ยนแปลง config ของ CodeQL และเวิร์กโฟลว์คุณภาพจะรัน shard คุณภาพ PR ทั้งสิบสองรายการ

manual dispatch รับค่า:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

โปรไฟล์แบบแคบเป็น hook สำหรับการสอน/การวนปรับ เพื่อรัน shard คุณภาพหนึ่งรายการแบบแยกเดี่ยว

| หมวดหมู่                                                | พื้นผิว                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ดขอบเขตความปลอดภัยของการยืนยันตัวตน, secret, แซนด์บ็อกซ์, Cron และ Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | สัญญาของ schema, migration, normalization และ IO ของ config                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schema ของ protocol Gateway และสัญญา method ของเซิร์ฟเวอร์                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญา implementation ของช่องทางหลักและช่องทาง Plugin ที่ bundled                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | สัญญา runtime ของการรันคำสั่ง, การ dispatch model/provider, การ dispatch และคิว auto-reply และ control plane ของ ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | เซิร์ฟเวอร์ MCP และ bridge ของเครื่องมือ, helper การกำกับดูแล process และสัญญาการส่งออกขาออก                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | memory host SDK, facade ของ memory runtime, alias ของ memory Plugin SDK, ส่วนเชื่อมการเปิดใช้งาน memory runtime และคำสั่ง doctor ของ memory                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | ภายในคิวตอบกลับ, คิวการส่ง session, helper การผูก/ส่ง session ขาออก, พื้นผิวชุด event/log เพื่อ diagnostics และสัญญา CLI ของ session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | การ dispatch การตอบกลับขาเข้าของ Plugin SDK, payload การตอบกลับ/helper การแบ่ง chunk/runtime, ตัวเลือกการตอบกลับของช่องทาง, คิวการส่ง และ helper การผูก session/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | การ normalize catalog model, การยืนยันตัวตนและ discovery ของ provider, การลงทะเบียน runtime ของ provider, ค่าเริ่มต้น/catalog ของ provider และ registry สำหรับ web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | การ bootstrap Control UI, persistence แบบ local, control flow ของ Gateway และสัญญา runtime ของ control plane งาน                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | สัญญา runtime ของ core web fetch/search, media IO, ความเข้าใจสื่อ, image-generation และ media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | สัญญาของ loader, registry, public-surface และ entrypoint ของ Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | source ของ Plugin SDK ฝั่ง package ที่เผยแพร่ และ helper สัญญา package ของ plugin                                                                                      |

คุณภาพแยกออกจากความปลอดภัย เพื่อให้ finding ด้านคุณภาพสามารถจัดกำหนดเวลา วัดผล ปิดใช้งาน หรือขยายได้โดยไม่บดบังสัญญาณด้านความปลอดภัย ควรเพิ่มการขยาย CodeQL สำหรับ Swift, Python และ bundled-plugin กลับมาเป็นงานติดตามผลแบบจำกัดขอบเขตหรือแบ่ง shard เท่านั้นหลังจากโปรไฟล์แบบแคบมี runtime และสัญญาณที่เสถียรแล้ว

## เวิร์กโฟลว์การบำรุงรักษา

### Docs Agent

เวิร์กโฟลว์ `Docs Agent` เป็น lane การบำรุงรักษา Codex แบบขับเคลื่อนด้วย event สำหรับทำให้เอกสารที่มีอยู่สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง land มันไม่มี schedule ล้วน: การรัน CI ของ push ที่สำเร็จจาก non-bot บน `main` สามารถ trigger มันได้ และ manual dispatch สามารถรันได้โดยตรง การเรียกผ่าน workflow-run จะข้ามเมื่อ `main` เดินหน้าไปแล้ว หรือเมื่อมีการสร้างการรัน Docs Agent ที่ไม่ถูกข้ามรายการอื่นในชั่วโมงที่ผ่านมา เมื่อรัน มันจะตรวจทานช่วง commit ตั้งแต่ source SHA ของ Docs Agent ที่ไม่ถูกข้ามรายการก่อนหน้าไปจนถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงหนึ่งครั้งสามารถครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมตั้งแต่การตรวจเอกสารครั้งล่าสุด

### Test Performance Agent

เวิร์กโฟลว์ `Test Performance Agent` เป็น lane การบำรุงรักษา Codex แบบขับเคลื่อนด้วย event สำหรับ test ที่ช้า มันไม่มี schedule ล้วน: การรัน CI ของ push ที่สำเร็จจาก non-bot บน `main` สามารถ trigger มันได้ แต่จะข้ามหาก invocation ผ่าน workflow-run อื่นรันไปแล้วหรือกำลังรันอยู่ในวัน UTC นั้น manual dispatch จะข้าม gate กิจกรรมรายวันนั้น lane จะสร้างรายงานประสิทธิภาพ Vitest แบบ full-suite ที่จัดกลุ่ม ให้ Codex ทำเฉพาะการแก้ประสิทธิภาพ test ขนาดเล็กที่รักษา coverage แทน refactor กว้าง จากนั้นรันรายงาน full-suite อีกครั้งและปฏิเสธการเปลี่ยนแปลงที่ลดจำนวน baseline test ที่ผ่าน หาก baseline มี test ล้มเหลว Codex อาจแก้เฉพาะ failure ที่ชัดเจน และรายงาน full-suite หลัง agent ต้องผ่านก่อนที่จะ commit สิ่งใด เมื่อ `main` เดินหน้าก่อน bot push จะ land lane จะ rebase patch ที่ตรวจสอบแล้ว รัน `pnpm check:changed` อีกครั้ง และลอง push ซ้ำ patch เก่าที่ขัดแย้งจะถูกข้าม มันใช้ GitHub-hosted Ubuntu เพื่อให้ Codex action รักษาท่าทีความปลอดภัยแบบ drop-sudo เดียวกับ docs agent ได้

### Duplicate PRs After Merge

เวิร์กโฟลว์ `Duplicate PRs After Merge` เป็นเวิร์กโฟลว์ maintainer แบบ manual สำหรับการล้าง duplicate หลัง land ค่าเริ่มต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุอย่างชัดเจนเมื่อ `apply=true` ก่อนแก้ไข GitHub มันตรวจสอบว่า PR ที่ land แล้วถูก merge แล้ว และ duplicate แต่ละรายการมี either issue ที่อ้างอิงร่วมกันหรือ hunk ที่เปลี่ยนแปลงทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## gate การตรวจ local และการ route การเปลี่ยนแปลง

ตรรกะ changed-lane แบบ local อยู่ใน `scripts/changed-lanes.mjs` และถูก execute โดย `scripts/check-changed.mjs` gate การตรวจ local นั้นเข้มงวดกับขอบเขตสถาปัตยกรรมมากกว่า scope ของแพลตฟอร์ม CI แบบกว้าง:

- การเปลี่ยนแปลง production ของ core จะรัน typecheck ของ core prod และ core test รวมถึง lint/guard ของ core;
- การเปลี่ยนแปลงเฉพาะ test ของ core จะรันเฉพาะ typecheck ของ core test รวมถึง lint ของ core;
- การเปลี่ยนแปลง production ของ extension จะรัน typecheck ของ extension prod และ extension test รวมถึง lint ของ extension;
- การเปลี่ยนแปลงเฉพาะ test ของ extension จะรัน typecheck ของ extension test รวมถึง lint ของ extension;
- การเปลี่ยนแปลง public Plugin SDK หรือสัญญา plugin จะขยายไปยัง typecheck ของ extension เพราะ extension พึ่งพาสัญญา core เหล่านั้น (การกวาด Vitest ของ extension ยังคงเป็นงาน test ที่ explicit);
- การ bump เวอร์ชันแบบ release metadata-only จะรันการตรวจ version/config/root-dependency แบบเจาะจง;
- การเปลี่ยนแปลง root/config ที่ไม่รู้จักจะ fail safe ไปยัง check lane ทั้งหมด

routing ของ changed-test แบบ local อยู่ใน `scripts/test-projects.test-support.mjs` และตั้งใจให้ถูกกว่า `check:changed`: การแก้ test โดยตรงจะรันตัวเอง การแก้ source จะเลือก mapping ที่ explicit ก่อน จากนั้นจึงใช้ test ข้างเคียงและ dependent จาก import-graph config การส่ง group-room ร่วมเป็นหนึ่งใน mapping ที่ explicit: การเปลี่ยนแปลง config visible-reply ของ group, โหมดการส่ง reply ของ source หรือ prompt ระบบของ message-tool จะ route ผ่าน core reply tests รวมถึง regression การส่งของ Discord และ Slack เพื่อให้การเปลี่ยน default ร่วม fail ก่อน PR push ครั้งแรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างระดับ harness จนชุด mapped ราคาถูกไม่ใช่ proxy ที่น่าเชื่อถือ

## การตรวจสอบด้วย Testbox

เรียกใช้ Testbox จากรากของที่เก็บโค้ด และควรใช้กล่องที่วอร์มใหม่สำหรับการตรวจสอบวงกว้าง ก่อนใช้เกตที่ช้าบนกล่องที่ถูกนำกลับมาใช้ใหม่ หมดอายุ หรือเพิ่งรายงานการซิงก์ที่ใหญ่ผิดคาด ให้เรียกใช้ `pnpm testbox:sanity` ภายในกล่องก่อน

การตรวจสอบ sanity จะล้มเหลวอย่างรวดเร็วเมื่อไฟล์รากที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short` แสดงการลบไฟล์ที่ติดตามแล้วอย่างน้อย 200 รายการ โดยปกติหมายความว่าสถานะการซิงก์ระยะไกลไม่ใช่สำเนา PR ที่เชื่อถือได้ ให้หยุดกล่องนั้นและวอร์มกล่องใหม่แทนการดีบักความล้มเหลวของการทดสอบผลิตภัณฑ์ สำหรับ PR ที่ตั้งใจลบไฟล์จำนวนมาก ให้ตั้งค่า `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับการรัน sanity นั้น

`pnpm testbox:run` ยังยุติการเรียกใช้ Blacksmith CLI ในเครื่องที่ค้างอยู่ในเฟสซิงก์นานกว่าห้านาทีโดยไม่มีเอาต์พุตหลังซิงก์ ตั้งค่า `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` เพื่อปิดใช้งานตัวป้องกันนั้น หรือใช้ค่ามิลลิวินาทีที่มากขึ้นสำหรับ diff ในเครื่องที่ใหญ่ผิดปกติ

Crabbox คือเส้นทางกล่องระยะไกลลำดับที่สองที่ repo เป็นเจ้าของสำหรับการตรวจสอบบน Linux เมื่อ Blacksmith ไม่พร้อมใช้งาน หรือเมื่อควรใช้ความจุคลาวด์ที่เป็นเจ้าของเองมากกว่า ให้วอร์มกล่อง ไฮเดรตผ่านเวิร์กโฟลว์ของโปรเจ็กต์ แล้วเรียกใช้คำสั่งผ่าน Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` เป็นเจ้าของค่าเริ่มต้นของ provider, sync และการไฮเดรต GitHub Actions โดยจะไม่รวม `.git` ในเครื่อง เพื่อให้ checkout ของ Actions ที่ถูกไฮเดรตเก็บเมทาดาทา Git ระยะไกลของตัวเองไว้ แทนการซิงก์ remote และ object store ในเครื่องของ maintainer และจะไม่รวม artifact ของ runtime/build ในเครื่องที่ไม่ควรถูกถ่ายโอนเลย `.github/workflows/crabbox-hydrate.yml` เป็นเจ้าของ checkout, การตั้งค่า Node/pnpm, การ fetch `origin/main` และการส่งต่อสภาพแวดล้อมที่ไม่ใช่ความลับซึ่งคำสั่ง `crabbox run --id <cbx_id>` ภายหลังจะ source

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
