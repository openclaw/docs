---
read_when:
    - คุณจำเป็นต้องเข้าใจว่าเหตุใดงาน CI จึงทำงานหรือไม่ทำงาน
    - คุณกำลังดีบักการตรวจสอบ GitHub Actions ที่ล้มเหลว
    - คุณกำลังประสานงานการรันหรือการรันซ้ำการตรวจสอบความถูกต้องของรีลีส
    - คุณกำลังเปลี่ยนการส่งงานของ ClawSweeper หรือการส่งต่อกิจกรรมของ GitHub
summary: กราฟงาน CI, เกตตามขอบเขต, ชุดครอบการเผยแพร่ และคำสั่งภายในเครื่องที่เทียบเท่า
title: ไปป์ไลน์ CI
x-i18n:
    generated_at: "2026-05-04T07:03:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72959d0feaf1339f01c9da263153fd89cc4727da6f928933819931991222714d
    source_path: ci.md
    workflow: 16
---

CI ของ OpenClaw ทำงานบนทุกการ push ไปยัง `main` และทุกคำขอดึง งาน `preflight` จัดประเภท diff และปิดเลนที่มีค่าใช้จ่ายสูงเมื่อมีเฉพาะพื้นที่ที่ไม่เกี่ยวข้องเปลี่ยนแปลง การรัน `workflow_dispatch` แบบแมนนวลตั้งใจข้ามการกำหนดขอบเขตแบบอัจฉริยะและกระจายไปยังกราฟเต็มสำหรับตัวเลือกรุ่นเผยแพร่และการตรวจสอบแบบกว้าง เลน Android ยังคงเป็นแบบเลือกเปิดผ่าน `include_android` ความครอบคลุม Plugin เฉพาะรุ่นเผยแพร่อยู่ในเวิร์กโฟลว์ [`Plugin Prerelease`](#plugin-prerelease) แยกต่างหาก และทำงานจาก [`Full Release Validation`](#full-release-validation) หรือการสั่งรันแบบแมนนวลอย่างชัดเจนเท่านั้น

## ภาพรวม Pipeline

| งาน                              | วัตถุประสงค์                                                                                                   | ทำงานเมื่อ                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | ตรวจจับการเปลี่ยนแปลงเฉพาะเอกสาร ขอบเขตที่เปลี่ยนแปลง ส่วนขยายที่เปลี่ยนแปลง และสร้างแมนิเฟสต์ CI                   | เสมอบน push และ PR ที่ไม่ใช่ฉบับร่าง |
| `security-scm-fast`              | การตรวจจับคีย์ส่วนตัวและการตรวจสอบเวิร์กโฟลว์ผ่าน `zizmor`                                                     | เสมอบน push และ PR ที่ไม่ใช่ฉบับร่าง |
| `security-dependency-audit`      | การตรวจสอบ lockfile สำหรับโปรดักชันแบบไม่มี dependency เทียบกับคำแนะนำด้านความปลอดภัยของ npm                                          | เสมอบน push และ PR ที่ไม่ใช่ฉบับร่าง |
| `security-fast`                  | ผลรวมที่บังคับใช้สำหรับงานความปลอดภัยแบบเร็ว                                                             | เสมอบน push และ PR ที่ไม่ใช่ฉบับร่าง |
| `check-dependencies`             | การผ่านเฉพาะ dependency ของ Knip สำหรับโปรดักชัน พร้อมตัวป้องกัน allowlist ของไฟล์ที่ไม่ได้ใช้                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-artifacts`                | สร้าง `dist/`, Control UI, การตรวจสอบอาร์ติแฟกต์ที่ build แล้ว และอาร์ติแฟกต์ปลายทางที่ใช้ซ้ำได้                       | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-core`               | เลนความถูกต้องของ Linux แบบเร็ว เช่น การตรวจสอบ bundled/plugin-contract/protocol                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-fast-contracts-channels` | การตรวจสอบสัญญา channel แบบแบ่งชาร์ด พร้อมผลตรวจสอบรวมที่เสถียร                                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-core-test`          | ชาร์ดทดสอบ Node ส่วน core ยกเว้นเลน channel, bundled, contract และ extension                          | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check`                          | เทียบเท่า gate หลักในเครื่องแบบแบ่งชาร์ด: ประเภทโปรดักชัน, lint, guards, ประเภทการทดสอบ และ smoke แบบเข้มงวด                | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `check-additional`               | สถาปัตยกรรม, boundary/prompt drift แบบแบ่งชาร์ด, guard ของ extension, boundary ของ package และ gateway watch        | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `build-smoke`                    | การทดสอบ smoke ของ CLI ที่ build แล้ว และ smoke หน่วยความจำตอนเริ่มทำงาน                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks`                         | ตัวตรวจยืนยันสำหรับการทดสอบ channel ของอาร์ติแฟกต์ที่ build แล้ว                                                                 | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Node              |
| `checks-node-compat-node22`      | เลน build และ smoke สำหรับความเข้ากันได้กับ Node 22                                                                | การสั่งรัน CI แบบแมนนวลสำหรับรุ่นเผยแพร่    |
| `check-docs`                     | การจัดรูปแบบเอกสาร, lint และการตรวจสอบลิงก์เสีย                                                             | เอกสารเปลี่ยนแปลง                       |
| `skills-python`                  | Ruff + pytest สำหรับ Skills ที่มี Python รองรับ                                                                    | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Python-skill      |
| `checks-windows`                 | การทดสอบ process/path เฉพาะ Windows พร้อม regression ของตัวระบุ import รันไทม์ร่วม                      | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Windows           |
| `macos-node`                     | เลนทดสอบ TypeScript บน macOS โดยใช้อาร์ติแฟกต์ที่ build แล้วร่วมกัน                                               | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `macos-swift`                    | Swift lint, build และทดสอบสำหรับแอป macOS                                                            | การเปลี่ยนแปลงที่เกี่ยวข้องกับ macOS             |
| `android`                        | การทดสอบหน่วย Android สำหรับทั้งสอง flavor พร้อมการ build debug APK หนึ่งรายการ                                              | การเปลี่ยนแปลงที่เกี่ยวข้องกับ Android           |
| `test-performance-agent`         | การเพิ่มประสิทธิภาพการทดสอบช้ารายวันของ Codex หลังจากกิจกรรมที่เชื่อถือได้                                                 | CI หลักสำเร็จหรือสั่งรันแบบแมนนวล |
| `openclaw-performance`           | รายงานประสิทธิภาพรันไทม์ Kova รายวัน/ตามต้องการ พร้อมเลน mock-provider, deep-profile และ GPT 5.4 แบบ live | ตามกำหนดเวลาและสั่งรันแบบแมนนวล      |

## ลำดับ Fail-fast

1. `preflight` ตัดสินใจว่าเลนใดมีอยู่ตั้งแต่แรก ตรรกะ `docs-scope` และ `changed-scope` เป็นขั้นตอนภายในงานนี้ ไม่ใช่งานแยกต่างหาก
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` และ `skills-python` ล้มเหลวได้อย่างรวดเร็วโดยไม่ต้องรอ matrix ของอาร์ติแฟกต์และแพลตฟอร์มที่หนักกว่า
3. `build-artifacts` ทำงานทับซ้อนกับเลน Linux แบบเร็ว เพื่อให้ผู้ใช้ปลายทางเริ่มได้ทันทีที่ build ร่วมพร้อมใช้งาน
4. เลนแพลตฟอร์มและรันไทม์ที่หนักกว่าจะกระจายออกหลังจากนั้น: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` และ `android`

GitHub อาจทำเครื่องหมายงานที่ถูกแทนที่เป็น `cancelled` เมื่อมี push ใหม่กว่าเข้ามาบน PR เดียวกันหรือ ref `main` เดียวกัน ให้ถือว่าสิ่งนั้นเป็นสัญญาณรบกวนของ CI เว้นแต่ว่าการรันล่าสุดสำหรับ ref เดียวกันก็ล้มเหลวด้วย การตรวจสอบชาร์ดแบบรวมใช้ `!cancelled() && always()` เพื่อให้ยังรายงานความล้มเหลวปกติของชาร์ด แต่ไม่เข้าคิวหลังจากทั้งเวิร์กโฟลว์ถูกแทนที่แล้ว คีย์ concurrency อัตโนมัติของ CI มีเวอร์ชัน (`CI-v7-*`) เพื่อไม่ให้ซอมบี้ฝั่ง GitHub ในกลุ่มคิวเก่าบล็อกการรัน main ที่ใหม่กว่าอย่างไม่มีกำหนด การรันชุดเต็มแบบแมนนวลใช้ `CI-manual-v1-*` และไม่ยกเลิกการรันที่กำลังดำเนินอยู่

## ขอบเขตและการกำหนดเส้นทาง

ตรรกะขอบเขตอยู่ใน `scripts/ci-changed-scope.mjs` และครอบคลุมด้วยการทดสอบหน่วยใน `src/scripts/ci-changed-scope.test.ts` การสั่งรันแบบแมนนวลข้ามการตรวจจับ changed-scope และทำให้แมนิเฟสต์ preflight ทำตัวเหมือนทุกพื้นที่ที่มีขอบเขตเปลี่ยนแปลง

- **การแก้ไขเวิร์กโฟลว์ CI** ตรวจสอบกราฟ CI ของ Node พร้อม workflow linting แต่ไม่บังคับ build แบบ native ของ Windows, Android หรือ macOS ด้วยตัวเอง เลนแพลตฟอร์มเหล่านั้นยังคงถูกกำหนดขอบเขตตามการเปลี่ยนแปลงซอร์สของแพลตฟอร์ม
- **การแก้ไขเฉพาะการกำหนดเส้นทาง CI, การแก้ไข fixture ของ core-test ราคาถูกบางส่วน และการแก้ไข helper/test-routing ของ plugin contract แบบแคบ** ใช้เส้นทางแมนิเฟสต์ Node-only แบบเร็ว: `preflight`, security และงาน `checks-fast-core` เดี่ยว เส้นทางนั้นข้ามอาร์ติแฟกต์ build, ความเข้ากันได้กับ Node 22, channel contracts, ชาร์ด core เต็ม, ชาร์ด bundled-plugin และ matrix guard เพิ่มเติม เมื่อการเปลี่ยนแปลงจำกัดอยู่ที่พื้นผิว routing หรือ helper ที่งานเร็วทดสอบโดยตรง
- **การตรวจสอบ Node บน Windows** ถูกกำหนดขอบเขตไว้ที่ wrapper ของ process/path เฉพาะ Windows, helper ของ npm/pnpm/UI runner, การกำหนดค่า package manager และพื้นผิวเวิร์กโฟลว์ CI ที่เรียกใช้เลนนั้น การเปลี่ยนแปลงซอร์ส, plugin, install-smoke และเฉพาะการทดสอบที่ไม่เกี่ยวข้องจะยังอยู่บนเลน Linux Node

ครอบครัวการทดสอบ Node ที่ช้าที่สุดถูกแบ่งหรือถ่วงสมดุลเพื่อให้งานแต่ละงานยังเล็กโดยไม่จอง runner มากเกินไป: channel contracts รันเป็นชาร์ดถ่วงน้ำหนักสามชาร์ด, เลน core unit fast/support รันแยกกัน, โครงสร้างพื้นฐานรันไทม์ core ถูกแบ่งระหว่างชาร์ด state และ process/config, auto-reply รันเป็น worker ที่สมดุล (โดย subtree ของ reply แบ่งเป็นชาร์ด agent-runner, dispatch และ commands/state-routing) และการกำหนดค่า gateway/server แบบ agentic ถูกแบ่งข้ามเลน chat/auth/model/http-plugin/runtime/startup แทนการรออาร์ติแฟกต์ที่ build แล้ว การทดสอบ browser, QA, media และ plugin เบ็ดเตล็ดแบบกว้างใช้การกำหนดค่า Vitest เฉพาะของตนแทน catch-all plugin ร่วม ชาร์ด include-pattern บันทึกรายการเวลาโดยใช้ชื่อชาร์ด CI เพื่อให้ `.artifacts/vitest-shard-timings.json` แยก config ทั้งชุดออกจากชาร์ดที่ถูกกรองได้ `check-additional` เก็บงาน compile/canary ของ package-boundary ไว้ด้วยกัน และแยกสถาปัตยกรรม runtime topology ออกจากความครอบคลุมของ gateway watch รายการ boundary guard ถูกกระจายเป็นแถบข้าม matrix สี่ชาร์ด โดยแต่ละชาร์ดรัน guard อิสระที่เลือกไว้พร้อมกัน และพิมพ์เวลาต่อการตรวจสอบ รวมถึง `pnpm prompt:snapshots:check` เพื่อให้ prompt drift ของ happy-path ในรันไทม์ Codex ถูกตรึงไว้กับ PR ที่ก่อให้เกิดมัน Gateway watch, การทดสอบ channel และชาร์ด core support-boundary รันพร้อมกันภายใน `build-artifacts` หลังจาก `dist/` และ `dist-runtime/` ถูก build แล้ว

CI ของ Android รันทั้ง `testPlayDebugUnitTest` และ `testThirdPartyDebugUnitTest` แล้วจึง build Play debug APK flavor ของบุคคลที่สามไม่มี source set หรือ manifest แยกต่างหาก เลน unit-test ของมันยังคง compile flavor พร้อมแฟล็ก SMS/call-log ของ BuildConfig ขณะหลีกเลี่ยงงาน packaging debug APK ซ้ำในทุก push ที่เกี่ยวข้องกับ Android

ชาร์ด `check-dependencies` รัน `pnpm deadcode:dependencies` (การผ่านเฉพาะ dependency ของ Knip สำหรับโปรดักชันที่ตรึงกับเวอร์ชัน Knip ล่าสุด โดยปิดใช้อายุรุ่นเผยแพร่ขั้นต่ำของ pnpm สำหรับการติดตั้ง `dlx`) และ `pnpm deadcode:unused-files` ซึ่งเปรียบเทียบการพบไฟล์ที่ไม่ได้ใช้ของ Knip ในโปรดักชันกับ `scripts/deadcode-unused-files.allowlist.mjs` ตัวป้องกันไฟล์ที่ไม่ได้ใช้จะล้มเหลวเมื่อ PR เพิ่มไฟล์ที่ไม่ได้ใช้ซึ่งยังไม่ผ่านการตรวจสอบใหม่ หรือทิ้งรายการ allowlist ที่ล้าสมัยไว้ ขณะยังคงรักษาพื้นผิว dynamic plugin, generated, build, live-test และ package bridge ที่ตั้งใจไว้ซึ่ง Knip ไม่สามารถ resolve แบบ static ได้

## การส่งต่อกิจกรรม ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` เป็น bridge ฝั่งเป้าหมายจากกิจกรรม repository ของ OpenClaw ไปยัง ClawSweeper มันไม่ checkout หรือดำเนินการโค้ดคำขอดึงที่ไม่น่าเชื่อถือ เวิร์กโฟลว์สร้าง token ของ GitHub App จาก `CLAWSWEEPER_APP_PRIVATE_KEY` แล้ว dispatch payload `repository_dispatch` แบบกะทัดรัดไปยัง `openclaw/clawsweeper`

เวิร์กโฟลว์มีสี่เลน:

- `clawsweeper_item` สำหรับคำขอตรวจ review issue และ pull request แบบเจาะจง
- `clawsweeper_comment` สำหรับคำสั่ง ClawSweeper อย่างชัดเจนในคอมเมนต์ issue
- `clawsweeper_commit_review` สำหรับคำขอตรวจ review ระดับ commit บน push ไปยัง `main`
- `github_activity` สำหรับกิจกรรม GitHub ทั่วไปที่ agent ClawSweeper อาจตรวจสอบ

เลน `github_activity` ส่งต่อเฉพาะ metadata ที่ normalize แล้ว: ประเภท event, action, actor, repository, หมายเลข item, URL, title, state และ excerpt สั้นสำหรับคอมเมนต์หรือ review เมื่อมีอยู่ มันตั้งใจหลีกเลี่ยงการส่งต่อ webhook body ทั้งหมด เวิร์กโฟลว์ที่รับใน `openclaw/clawsweeper` คือ `.github/workflows/github-activity.yml` ซึ่งโพสต์ event ที่ normalize แล้วไปยัง hook ของ OpenClaw Gateway สำหรับ agent ClawSweeper

กิจกรรมทั่วไปคือการสังเกต ไม่ใช่การส่งมอบโดยค่าเริ่มต้น agent ClawSweeper ได้รับเป้าหมาย Discord ใน prompt และควรโพสต์ไปยัง `#clawsweeper` เฉพาะเมื่อ event นั้นน่าประหลาดใจ ดำเนินการได้ มีความเสี่ยง หรือมีประโยชน์ต่อการดำเนินงาน การเปิด การแก้ไข ความเปลี่ยนแปลงจาก bot สัญญาณรบกวน webhook ซ้ำ และทราฟฟิก review ปกติควรให้ผลเป็น `NO_REPLY`

ให้ถือว่า title, คอมเมนต์, body, ข้อความ review, ชื่อ branch และข้อความ commit ของ GitHub เป็นข้อมูลที่ไม่น่าเชื่อถือตลอดเส้นทางนี้ สิ่งเหล่านี้เป็นอินพุตสำหรับการสรุปและ triage ไม่ใช่คำสั่งสำหรับเวิร์กโฟลว์หรือรันไทม์ agent

## การสั่งรันแบบแมนนวล

การสั่งเรียกใช้ CI ด้วยตนเองจะรันกราฟงานเดียวกับ CI ปกติ แต่บังคับเปิดทุกเลนที่มีขอบเขตไม่ใช่ Android: ชาร์ด Node บน Linux, ชาร์ด Plugin ที่รวมมาในชุด, สัญญาช่องทาง, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, การตรวจสอบ smoke ของบิลด์, การตรวจสอบเอกสาร, Skills ของ Python, Windows, macOS, และ i18n ของ Control UI การสั่งเรียกใช้ CI ด้วยตนเองแบบแยกเดี่ยวจะรันเฉพาะ Android ด้วย `include_android=true`; เวิร์กโฟลว์ครอบคลุมรีลีสแบบเต็มเปิดใช้ Android โดยส่ง `include_android=true` การตรวจสอบแบบ static ก่อนรีลีสของ Plugin, ชาร์ด `agentic-plugins` ที่ใช้เฉพาะรีลีส, การกวาดแบบชุดของส่วนขยายทั้งหมด, และเลน Docker ก่อนรีลีสของ Plugin จะถูกแยกออกจาก CI ชุด Docker ก่อนรีลีสจะรันเฉพาะเมื่อ `Full Release Validation` สั่งเรียกใช้เวิร์กโฟลว์ `Plugin Prerelease` ที่แยกต่างหากพร้อมเปิดใช้เกตการตรวจสอบรีลีส

การรันด้วยตนเองใช้กลุ่มการทำงานพร้อมกันที่ไม่ซ้ำกัน เพื่อไม่ให้ชุดเต็มสำหรับ release candidate ถูกยกเลิกโดยการรัน push หรือ PR อื่นบนตัวอ้างอิงเดียวกัน อินพุต `target_ref` ที่เป็นตัวเลือกเสริมช่วยให้ผู้เรียกใช้ที่เชื่อถือได้รันกราฟนั้นกับสาขา แท็ก หรือ SHA ของคอมมิตแบบเต็ม โดยใช้ไฟล์เวิร์กโฟลว์จากตัวอ้างอิงที่เลือกสำหรับการสั่งเรียกใช้

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## รันเนอร์

| รันเนอร์                           | งาน                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, งานความปลอดภัยแบบเร็วและงานรวมผล (`security-scm-fast`, `security-dependency-audit`, `security-fast`), การตรวจสอบโปรโตคอล/สัญญา/แบบรวมชุดแบบเร็ว, การตรวจสอบสัญญาช่องทางแบบแยกชาร์ด, ชาร์ด `check` ยกเว้น lint, ชาร์ดและงานรวมผล `check-additional`, ตัวตรวจสอบงานรวมผลของการทดสอบ Node, การตรวจสอบเอกสาร, Skills ของ Python, workflow-sanity, labeler, auto-response; preflight ของ install-smoke ยังใช้ Ubuntu ที่ GitHub โฮสต์เพื่อให้เมทริกซ์ Blacksmith เข้าคิวได้เร็วขึ้น |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, ชาร์ดส่วนขยายที่น้ำหนักเบากว่า, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, และ `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, ชาร์ดทดสอบ Node บน Linux, ชาร์ดทดสอบ Plugin ที่รวมมาในชุด, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (ไวต่อ CPU มากพอที่ 8 vCPU มีต้นทุนมากกว่าที่ประหยัดได้); บิลด์ Docker ของ install-smoke (เวลาคิว 32-vCPU มีต้นทุนมากกว่าที่ประหยัดได้)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` บน `openclaw/openclaw`; คลังที่แยกสำเนาจะย้อนกลับไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` บน `openclaw/openclaw`; คลังที่แยกสำเนาจะย้อนกลับไปใช้ `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`OpenClaw Performance` คือเวิร์กโฟลว์ประสิทธิภาพของผลิตภัณฑ์/รันไทม์ โดยรันทุกวันบน `main` และสามารถสั่งเรียกใช้ด้วยตนเองได้:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

การสั่งเรียกใช้ด้วยตนเองตามปกติจะวัดประสิทธิภาพของตัวอ้างอิงเวิร์กโฟลว์ ตั้งค่า `target_ref` เพื่อวัดประสิทธิภาพแท็กรีลีสหรือสาขาอื่นด้วยการใช้งานเวิร์กโฟลว์ปัจจุบัน พาธรายงานที่เผยแพร่และตัวชี้ล่าสุดใช้ตัวอ้างอิงที่ทดสอบเป็นคีย์ และ `index.md` แต่ละไฟล์จะบันทึกตัวอ้างอิง/SHA ที่ทดสอบ, ตัวอ้างอิง/SHA ของเวิร์กโฟลว์, ตัวอ้างอิง Kova, โปรไฟล์, โหมดการยืนยันตัวตนของเลน, โมเดล, จำนวนการทำซ้ำ, และตัวกรองสถานการณ์

เวิร์กโฟลว์ติดตั้ง OCM จากรีลีสที่ปักหมุดไว้ และ Kova จาก `openclaw/Kova` ที่อินพุต `kova_ref` ที่ปักหมุดไว้ จากนั้นรันสามเลน:

- `mock-provider`: สถานการณ์วินิจฉัยของ Kova กับรันไทม์ที่สร้างในเครื่อง โดยใช้การยืนยันตัวตน OpenAI-compatible แบบปลอมที่กำหนดผลแน่นอน
- `mock-deep-profile`: การทำโปรไฟล์ CPU/heap/trace สำหรับจุดที่ใช้ทรัพยากรสูงของการเริ่มต้น, Gateway, และเทิร์นของเอเจนต์
- `live-gpt54`: เทิร์นของเอเจนต์ OpenAI จริงด้วย `openai/gpt-5.4` ซึ่งจะถูกข้ามเมื่อ `OPENAI_API_KEY` ไม่มีให้ใช้

เลน mock-provider ยังรันการตรวจสอบซอร์สที่เป็นเนทีฟของ OpenClaw หลังจากรอบ Kova: เวลาเริ่มทำงานและหน่วยความจำของ Gateway ในกรณีเริ่มต้นแบบค่าเริ่มต้น, ฮุก, และ 50 Plugin; ลูป hello ของ OpenAI จำลอง `channel-chat-baseline` ซ้ำ ๆ; และคำสั่งเริ่มต้น CLI กับ Gateway ที่เริ่มทำงานแล้ว สรุป Markdown ของการตรวจสอบซอร์สอยู่ที่ `source/index.md` ในบันเดิลรายงาน พร้อม JSON ดิบที่อยู่ข้างกัน

ทุกเลนอัปโหลดอาร์ติแฟกต์ GitHub เมื่อกำหนดค่า `CLAWGRIT_REPORTS_TOKEN` แล้ว เวิร์กโฟลว์ยังคอมมิต `report.json`, `report.md`, บันเดิล, `index.md`, และอาร์ติแฟกต์จากการตรวจสอบซอร์สเข้าไปใน `openclaw/clawgrit-reports` ใต้ `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/` ตัวชี้ตัวอ้างอิงที่ทดสอบล่าสุดจะถูกเขียนเป็น `openclaw-performance/<tested-ref>/latest-<lane>.json`

## การตรวจสอบรีลีสแบบเต็ม

`Full Release Validation` คือเวิร์กโฟลว์ครอบคลุมแบบ manual สำหรับ “รันทุกอย่างก่อนรีลีส” เวิร์กโฟลว์นี้รับสาขา แท็ก หรือ SHA ของคอมมิตแบบเต็ม, สั่งเรียกใช้เวิร์กโฟลว์ manual `CI` ด้วยเป้าหมายนั้น, สั่งเรียกใช้ `Plugin Prerelease` สำหรับหลักฐานเฉพาะรีลีสของ Plugin/แพ็กเกจ/static/Docker, และสั่งเรียกใช้ `OpenClaw Release Checks` สำหรับ smoke การติดตั้ง, การยอมรับแพ็กเกจ, ชุดเส้นทางรีลีสของ Docker, live/E2E, OpenWebUI, ความเท่าเทียมของ QA Lab, Matrix, และเลน Telegram เมื่อใช้ `rerun_group=all` และ `release_profile=full` เวิร์กโฟลว์นี้ยังรัน `NPM Telegram Beta E2E` กับอาร์ติแฟกต์ `release-package-under-test` จากการตรวจสอบรีลีสด้วย หลังเผยแพร่ ให้ส่ง `npm_telegram_package_spec` เพื่อรันเลนแพ็กเกจ Telegram เดิมซ้ำกับแพ็กเกจ npm ที่เผยแพร่แล้ว

ดู [การตรวจสอบรีลีสแบบเต็ม](/th/reference/full-release-validation) สำหรับ
เมทริกซ์ขั้นตอน, ชื่องานเวิร์กโฟลว์ที่แน่นอน, ความแตกต่างของโปรไฟล์, อาร์ติแฟกต์, และ
ตัวระบุสำหรับรันซ้ำแบบเจาะจง

`OpenClaw Release Publish` คือเวิร์กโฟลว์รีลีสแบบ manual ที่เปลี่ยนแปลงสถานะ สั่งเรียกใช้จาก `release/YYYY.M.D` หรือ `main` หลังจากแท็กรีลีสมีอยู่แล้ว และหลังจาก preflight ของ OpenClaw npm สำเร็จแล้ว เวิร์กโฟลว์นี้ตรวจสอบ `pnpm plugins:sync:check`, สั่งเรียกใช้ `Plugin NPM Release` สำหรับแพ็กเกจ Plugin ทั้งหมดที่เผยแพร่ได้, สั่งเรียกใช้ `Plugin ClawHub Release` สำหรับ SHA รีลีสเดียวกัน, แล้วจึงสั่งเรียกใช้ `OpenClaw NPM Release` พร้อม `preflight_run_id` ที่บันทึกไว้

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

ตัวอ้างอิงสำหรับสั่งเรียกใช้เวิร์กโฟลว์ GitHub ต้องเป็นสาขาหรือแท็ก ไม่ใช่ SHA ของคอมมิตดิบ ตัวช่วยจะ push สาขาชั่วคราว `release-ci/<sha>-...` ที่ SHA เป้าหมาย, สั่งเรียกใช้ `Full Release Validation` จากตัวอ้างอิงที่ปักหมุดไว้นั้น, ตรวจสอบว่า `headSha` ของเวิร์กโฟลว์ลูกทุกตัวตรงกับเป้าหมาย, และลบสาขาชั่วคราวเมื่อการรันเสร็จสมบูรณ์ ตัวตรวจสอบเวิร์กโฟลว์ครอบคลุมจะล้มเหลวด้วยหากเวิร์กโฟลว์ลูกใดรันที่ SHA อื่น

`release_profile` ควบคุมขอบเขต live/provider ที่ส่งเข้าไปในการตรวจสอบรุ่นเผยแพร่ เวิร์กโฟลว์รุ่นเผยแพร่แบบแมนนวลมีค่าเริ่มต้นเป็น `stable`; ใช้ `full` เฉพาะเมื่อคุณตั้งใจต้องการเมทริกซ์ผู้ให้บริการ/สื่อเชิงคำแนะนำที่กว้างเท่านั้น

- `minimum` คงไว้เฉพาะเลน OpenAI/core ที่สำคัญต่อรุ่นเผยแพร่และเร็วที่สุด
- `stable` เพิ่มชุดผู้ให้บริการ/แบ็กเอนด์ที่เสถียร
- `full` รันเมทริกซ์ผู้ให้บริการ/สื่อเชิงคำแนะนำที่กว้าง

งานครอบหลักจะบันทึก id ของการรันงานลูกที่ถูก dispatch และงานสุดท้าย `Verify full validation` จะตรวจสอบข้อสรุปปัจจุบันของการรันงานลูกอีกครั้ง และผนวกตารางงานที่ช้าที่สุดสำหรับการรันงานลูกแต่ละรายการ หากเวิร์กโฟลว์ลูกถูกรันใหม่แล้วเป็นสีเขียว ให้รันใหม่เฉพาะงานตัวตรวจสอบของงานหลักเพื่อรีเฟรชผลลัพธ์ของงานครอบหลักและสรุปเวลา

สำหรับการกู้คืน ทั้ง `Full Release Validation` และ `OpenClaw Release Checks` รับ `rerun_group` ใช้ `all` สำหรับผู้สมัครรุ่นเผยแพร่, `ci` สำหรับงานลูก CI เต็มรูปแบบปกติเท่านั้น, `plugin-prerelease` สำหรับงานลูกก่อนเผยแพร่ของ Plugin เท่านั้น, `release-checks` สำหรับงานลูกของรุ่นเผยแพร่ทุกงาน หรือกลุ่มที่แคบกว่า: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` หรือ `npm-telegram` บนงานครอบหลัก วิธีนี้ทำให้การรันซ้ำของกล่องรุ่นเผยแพร่ที่ล้มเหลวมีขอบเขตจำกัดหลังจากการแก้ไขแบบเจาะจง

`OpenClaw Release Checks` ใช้ ref เวิร์กโฟลว์ที่เชื่อถือได้เพื่อ resolve ref ที่เลือกครั้งเดียวเป็น tarball `release-package-under-test` แล้วส่ง artifact นั้นต่อให้ทั้งเวิร์กโฟลว์ Docker เส้นทางรุ่นเผยแพร่ live/E2E และชาร์ด package acceptance วิธีนี้ทำให้ไบต์ของแพ็กเกจสอดคล้องกันในกล่องรุ่นเผยแพร่ต่างๆ และหลีกเลี่ยงการแพ็กผู้สมัครเดิมซ้ำในงานลูกหลายงาน

การรัน `Full Release Validation` ซ้ำสำหรับ `ref=main` และ `rerun_group=all`
จะแทนที่งานครอบหลักที่เก่ากว่า ตัวติดตามของงานหลักจะยกเลิกเวิร์กโฟลว์ลูกใดๆ ที่
ได้ dispatch ไปแล้วเมื่อถูกยกเลิกงานหลัก ดังนั้นการตรวจสอบ main ที่ใหม่กว่า
จะไม่ต้องค้างอยู่หลังการรัน release-check ที่ล้าสมัยนานสองชั่วโมง การตรวจสอบ branch/tag
ของรุ่นเผยแพร่และกลุ่มรันซ้ำแบบเจาะจงจะคง `cancel-in-progress: false` ไว้

## ชาร์ด Live และ E2E

งานลูก release live/E2E ยังคงมีความครอบคลุม native `pnpm test:live` ที่กว้าง แต่รันเป็นชาร์ดที่มีชื่อผ่าน `scripts/test-live-shard.mjs` แทนที่จะเป็นงานแบบอนุกรมงานเดียว:

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
- ชาร์ดสื่อเสียง/วิดีโอที่แยกกัน และชาร์ดเพลงที่กรองตามผู้ให้บริการ

วิธีนี้ยังคงความครอบคลุมไฟล์เดิมไว้ พร้อมทำให้ความล้มเหลวของผู้ให้บริการ live ที่ช้าง่ายต่อการรันซ้ำและวินิจฉัย ชื่อชาร์ดรวม `native-live-extensions-o-z`, `native-live-extensions-media` และ `native-live-extensions-media-music` ยังคงใช้ได้สำหรับการรันซ้ำแบบแมนนวลครั้งเดียว

ชาร์ด native live media รันใน `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ซึ่งสร้างโดยเวิร์กโฟลว์ `Live Media Runner Image` อิมเมจนั้นติดตั้ง `ffmpeg` และ `ffprobe` ไว้ล่วงหน้า งานสื่อจะตรวจสอบเฉพาะไบนารีก่อนตั้งค่าเท่านั้น ให้คงชุดทดสอบ live ที่ใช้ Docker ไว้บน runner Blacksmith ปกติ งานแบบ container ไม่ใช่ที่เหมาะสำหรับเริ่มการทดสอบ Docker ซ้อน

ชาร์ดโมเดล/แบ็กเอนด์ live ที่ใช้ Docker ใช้อิมเมจที่ใช้ร่วมกันแยกต่างหาก `ghcr.io/openclaw/openclaw-live-test:<sha>` ต่อ commit ที่เลือกหนึ่งรายการ เวิร์กโฟลว์ release live จะสร้างและ push อิมเมจนั้นครั้งเดียว จากนั้นชาร์ดโมเดล Docker live, Gateway ที่แบ่งตามผู้ให้บริการ, แบ็กเอนด์ CLI, ACP bind และ harness ของ Codex จะรันด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` ชาร์ด Gateway Docker มีขีดจำกัด `timeout` ระดับสคริปต์ที่ชัดเจนต่ำกว่า timeout ของงานเวิร์กโฟลว์ เพื่อให้ container ที่ค้างหรือเส้นทาง cleanup ล้มเหลวเร็ว แทนที่จะใช้เวลางบ release-check ทั้งหมด หากชาร์ดเหล่านั้นสร้างเป้าหมาย Docker ซอร์สเต็มใหม่เองอย่างอิสระ แสดงว่าการรันรุ่นเผยแพร่ถูกตั้งค่าผิดและจะสิ้นเปลืองเวลานาฬิกาจริงกับการสร้างอิมเมจซ้ำ

## Package Acceptance

ใช้ `Package Acceptance` เมื่อคำถามคือ "แพ็กเกจ OpenClaw ที่ติดตั้งได้นี้ทำงานเป็นผลิตภัณฑ์ได้หรือไม่" สิ่งนี้แตกต่างจาก CI ปกติ: CI ปกติตรวจสอบ source tree ส่วน package acceptance ตรวจสอบ tarball เดียวผ่าน harness Docker E2E เดียวกับที่ผู้ใช้ใช้งานหลังติดตั้งหรืออัปเดต

### งาน

1. `resolve_package` checkout `workflow_ref`, resolve ผู้สมัครแพ็กเกจหนึ่งรายการ, เขียน `.artifacts/docker-e2e-package/openclaw-current.tgz`, เขียน `.artifacts/docker-e2e-package/package-candidate.json`, อัปโหลดทั้งสองอย่างเป็น artifact `package-under-test` และพิมพ์ source, workflow ref, package ref, เวอร์ชัน, SHA-256 และโปรไฟล์ในสรุปขั้นตอนของ GitHub
2. `docker_acceptance` เรียก `openclaw-live-and-e2e-checks-reusable.yml` ด้วย `ref=workflow_ref` และ `package_artifact_name=package-under-test` เวิร์กโฟลว์ที่ใช้ซ้ำจะดาวน์โหลด artifact นั้น ตรวจสอบ inventory ของ tarball เตรียมอิมเมจ Docker ที่อิง digest ของแพ็กเกจเมื่อจำเป็น และรันเลน Docker ที่เลือกกับแพ็กเกจนั้นแทนการแพ็ก workflow checkout เมื่อโปรไฟล์เลือก `docker_lanes` แบบเจาะจงหลายเลน เวิร์กโฟลว์ที่ใช้ซ้ำจะเตรียมแพ็กเกจและอิมเมจที่ใช้ร่วมกันครั้งเดียว แล้วกระจายเลนเหล่านั้นออกเป็นงาน Docker แบบเจาะจงที่รันขนานพร้อม artifact ที่ไม่ซ้ำกัน
3. `package_telegram` เลือกเรียก `NPM Telegram Beta E2E` งานนี้รันเมื่อ `telegram_mode` ไม่ใช่ `none` และติดตั้ง artifact `package-under-test` เดียวกันเมื่อ Package Acceptance resolve แล้ว ส่วนการ dispatch Telegram แบบ standalone ยังสามารถติดตั้งสเปก npm ที่เผยแพร่แล้วได้
4. `summary` ทำให้เวิร์กโฟลว์ล้มเหลวหากการ resolve แพ็กเกจ, Docker acceptance หรือเลน Telegram แบบไม่บังคับล้มเหลว

### แหล่งที่มาของผู้สมัคร

- `source=npm` รับเฉพาะ `openclaw@beta`, `openclaw@latest` หรือเวอร์ชันรุ่นเผยแพร่ OpenClaw ที่เจาะจง เช่น `openclaw@2026.4.27-beta.2` ใช้สิ่งนี้สำหรับ acceptance ของ prerelease/stable ที่เผยแพร่แล้ว
- `source=ref` แพ็ก branch, tag หรือ commit SHA เต็มของ `package_ref` ที่เชื่อถือได้ ตัว resolver จะ fetch branch/tag ของ OpenClaw, ตรวจสอบว่า commit ที่เลือกเข้าถึงได้จากประวัติ branch ของ repository หรือ tag รุ่นเผยแพร่, ติดตั้ง deps ใน worktree แบบ detached และแพ็กด้วย `scripts/package-openclaw-for-docker.mjs`
- `source=url` ดาวน์โหลด HTTPS `.tgz`; ต้องมี `package_sha256`
- `source=artifact` ดาวน์โหลด `.tgz` หนึ่งไฟล์จาก `artifact_run_id` และ `artifact_name`; `package_sha256` เป็นค่าทางเลือกแต่ควรระบุสำหรับ artifact ที่แชร์ภายนอก

แยก `workflow_ref` และ `package_ref` ออกจากกัน `workflow_ref` คือโค้ดเวิร์กโฟลว์/harness ที่เชื่อถือได้ซึ่งรันการทดสอบ `package_ref` คือ source commit ที่ถูกแพ็กเมื่อ `source=ref` วิธีนี้ทำให้ harness ทดสอบปัจจุบันตรวจสอบ source commit เก่าที่เชื่อถือได้โดยไม่ต้องรันตรรกะเวิร์กโฟลว์เก่า

### โปรไฟล์ชุดทดสอบ

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` พร้อม `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — ชังก์เส้นทางรุ่นเผยแพร่ Docker เต็มรูปแบบพร้อม OpenWebUI
- `custom` — `docker_lanes` แบบตรงตัว; จำเป็นเมื่อ `suite_profile=custom`

โปรไฟล์ `package` ใช้ความครอบคลุม Plugin แบบออฟไลน์ เพื่อให้การตรวจสอบแพ็กเกจที่เผยแพร่แล้วไม่ขึ้นกับความพร้อมใช้งานของ ClawHub แบบ live เลน Telegram แบบไม่บังคับจะใช้ artifact `package-under-test` ซ้ำใน `NPM Telegram Beta E2E` โดยยังคงเส้นทางสเปก npm ที่เผยแพร่ไว้สำหรับการ dispatch แบบ standalone

สำหรับนโยบายทดสอบการอัปเดตและ Plugin โดยเฉพาะ รวมถึงคำสั่งในเครื่อง
เลน Docker, อินพุต Package Acceptance, ค่าเริ่มต้นของรุ่นเผยแพร่ และการคัดแยกความล้มเหลว
ดู [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)

การตรวจสอบรุ่นเผยแพร่เรียก Package Acceptance ด้วย `source=artifact`, artifact แพ็กเกจรุ่นเผยแพร่ที่เตรียมไว้, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` และ `telegram_mode=mock-openai` วิธีนี้ทำให้หลักฐานการย้ายแพ็กเกจ, การอัปเดต, การ cleanup dependency ของ Plugin ที่ล้าสมัย, การซ่อมการติดตั้ง Plugin ที่ตั้งค่าไว้, Plugin แบบออฟไลน์, การอัปเดต Plugin และ Telegram อยู่บน tarball แพ็กเกจที่ resolve แล้วตัวเดียวกัน ตั้งค่า `package_acceptance_package_spec` บน Full Release Validation หรือ OpenClaw Release Checks เพื่อรันเมทริกซ์เดียวกันนั้นกับแพ็กเกจ npm ที่ส่งมอบแล้วแทน artifact ที่สร้างจาก SHA การตรวจสอบรุ่นเผยแพร่ข้าม OS ยังคงครอบคลุม onboarding, installer และพฤติกรรมแพลตฟอร์มเฉพาะ OS การตรวจสอบผลิตภัณฑ์ด้านแพ็กเกจ/การอัปเดตควรเริ่มด้วย Package Acceptance เลน Docker `published-upgrade-survivor` ตรวจสอบ baseline แพ็กเกจที่เผยแพร่แล้วหนึ่งรายการต่อการรัน ใน Package Acceptance tarball `package-under-test` ที่ resolve แล้วจะเป็นผู้สมัครเสมอ และ `published_upgrade_survivor_baseline` จะเลือก baseline ที่เผยแพร่แล้วสำหรับ fallback โดยมีค่าเริ่มต้นเป็น `openclaw@latest`; คำสั่งรันซ้ำของเลนที่ล้มเหลวจะคง baseline นั้นไว้ ตั้งค่า `published_upgrade_survivor_baselines=all-since-2026.4.23` เพื่อขยาย Full Release CI ให้ครอบคลุมรุ่นเผยแพร่ npm ที่เสถียรทุกรุ่นตั้งแต่ `2026.4.23` จนถึง `latest`; `release-history` ยังคงพร้อมใช้งานสำหรับการสุ่มตัวอย่างที่กว้างกว่าด้วยตนเองโดยใช้ anchor ก่อนวันที่เก่า ตั้งค่า `published_upgrade_survivor_scenarios=reported-issues` เพื่อขยาย baseline เดียวกันให้ครอบคลุม fixture รูปแบบ issue สำหรับ config ของ Feishu, ไฟล์ bootstrap/persona ที่ถูกเก็บรักษา, การติดตั้ง OpenClaw Plugin ที่ตั้งค่าไว้, path log แบบ tilde และราก dependency ของ Plugin legacy ที่ล้าสมัย เวิร์กโฟลว์ `Update Migration` แยกต่างหากใช้เลน Docker `update-migration` พร้อม `all-since-2026.4.23` และ `plugin-deps-cleanup` เมื่อคำถามคือการ cleanup การอัปเดตที่เผยแพร่แล้วแบบครบถ้วน ไม่ใช่ขอบเขต Full Release CI ปกติ การรันรวมในเครื่องสามารถส่งสเปกแพ็กเกจแบบตรงตัวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, คงเลนเดียวด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` เช่น `openclaw@2026.4.15` หรือตั้งค่า `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` สำหรับเมทริกซ์สถานการณ์ เลนที่เผยแพร่แล้วจะตั้งค่า baseline ด้วยสูตรคำสั่ง `openclaw config set` ที่ฝังไว้ บันทึกขั้นตอนสูตรใน `summary.json` และ probe `/healthz`, `/readyz` พร้อมสถานะ RPC หลังเริ่ม Gateway เลนแพ็กเกจ Windows และเลน fresh installer ยังตรวจสอบด้วยว่าแพ็กเกจที่ติดตั้งแล้วสามารถ import override ของ browser-control จาก path Windows แบบ absolute ดิบได้ smoke ของ OpenAI cross-OS agent-turn มีค่าเริ่มต้นเป็น `OPENCLAW_CROSS_OS_OPENAI_MODEL` เมื่อมีการตั้งค่า มิฉะนั้นเป็น `openai/gpt-5.4` เพื่อให้หลักฐานการติดตั้งและ Gateway อยู่บนโมเดลทดสอบ GPT-5 พร้อมหลีกเลี่ยงค่าเริ่มต้น GPT-4.x

### หน้าต่างความเข้ากันได้แบบ Legacy

Package Acceptance มีหน้าต่างความเข้ากันได้แบบ legacy ที่มีขอบเขตสำหรับแพ็กเกจที่เผยแพร่แล้ว แพ็กเกจจนถึง `2026.4.25` รวมถึง `2026.4.25-beta.*` อาจใช้เส้นทางความเข้ากันได้:

- รายการ QA ส่วนตัวที่รู้จักใน `dist/postinstall-inventory.json` อาจชี้ไปยังไฟล์ที่ tarball ละไว้;
- `doctor-switch` อาจข้ามกรณีย่อย persistence ของ `gateway install --wrapper` เมื่อแพ็กเกจไม่ได้เปิดเผย flag นั้น;
- `update-channel-switch` อาจ prune `pnpm.patchedDependencies` ที่ขาดหายจาก fixture git ปลอมที่ได้จาก tarball และอาจ log `update.channel` ที่ persist ไว้แล้วแต่หายไป;
- smoke ของ Plugin อาจอ่านตำแหน่ง install-record แบบ legacy หรือยอมรับ persistence ของ marketplace install-record ที่ขาดหาย;
- `plugin-update` อาจอนุญาตการย้าย metadata ของ config ขณะยังคงกำหนดให้ install record และพฤติกรรมไม่ติดตั้งซ้ำต้องไม่เปลี่ยนแปลง

แพ็กเกจ `2026.4.26` ที่เผยแพร่แล้วอาจเตือนเกี่ยวกับไฟล์ stamp metadata ของบิลด์ในเครื่องที่ถูกส่งไปแล้วด้วย แพ็กเกจที่ใหม่กว่านี้ต้องเป็นไปตามสัญญาสมัยใหม่ เงื่อนไขเดียวกันจะล้มเหลวแทนที่จะเตือนหรือข้าม

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

เมื่อดีบักการรัน package acceptance ที่ล้มเหลว ให้เริ่มจากสรุป `resolve_package` เพื่อยืนยันแหล่งที่มาของแพ็กเกจ เวอร์ชัน และ SHA-256 จากนั้นตรวจสอบการรันย่อย `docker_acceptance` และอาร์ติแฟกต์ Docker ของการรันนั้น: `.artifacts/docker-tests/**/summary.json`, `failures.json`, บันทึก lane, เวลาของแต่ละเฟส และคำสั่ง rerun ควร rerun โปรไฟล์แพ็กเกจที่ล้มเหลวหรือ Docker lane ที่ตรงกัน แทนการ rerun release validation แบบเต็ม

## Install smoke

Workflow `Install Smoke` ที่แยกต่างหากใช้สคริปต์ scope เดียวกันซ้ำผ่าน job `preflight` ของตัวเอง โดยแบ่งความครอบคลุมของ smoke เป็น `run_fast_install_smoke` และ `run_full_install_smoke`

- **Fast path** ทำงานสำหรับ pull request ที่แตะพื้นผิว Docker/package, การเปลี่ยนแปลงแพ็กเกจ/manifest ของ Plugin ที่บันเดิลมา หรือพื้นผิว Plugin/channel/gateway/Plugin SDK แกนกลางที่ Docker smoke jobs ทดสอบ การเปลี่ยนแปลง Plugin ที่บันเดิลมาเฉพาะซอร์ส การแก้ไขเฉพาะเทสต์ และการแก้ไขเฉพาะเอกสารจะไม่จอง Docker workers Fast path จะ build อิมเมจ Dockerfile รากหนึ่งครั้ง ตรวจสอบ CLI รัน agents delete shared-workspace CLI smoke รัน container gateway-network e2e ตรวจสอบ build arg ของส่วนขยายที่บันเดิลมา และรันโปรไฟล์ Docker ของ bundled-plugin แบบจำกัด ภายใต้ timeout คำสั่งรวม 240 วินาที (Docker run ของแต่ละ scenario ถูกจำกัดแยกกัน)
- **Full path** เก็บการติดตั้ง QR package และความครอบคลุม Docker/update ของ installer สำหรับการรันตามกำหนดการทุกคืน, manual dispatch, workflow-call release checks และ pull request ที่แตะพื้นผิว installer/package/Docker จริงๆ ในโหมดเต็ม install-smoke จะเตรียมหรือใช้อิมเมจ smoke ของ GHCR root Dockerfile target-SHA หนึ่งอิมเมจซ้ำ จากนั้นรัน QR package install, root Dockerfile/gateway smokes, installer/update smokes และ fast bundled-plugin Docker E2E เป็น jobs แยกกัน เพื่อให้งาน installer ไม่ต้องรออยู่หลัง root image smokes

การ push ไปยัง `main` (รวมถึง merge commits) จะไม่บังคับใช้ full path เมื่อ logic changed-scope ขอ full coverage บน push workflow จะคง fast Docker smoke ไว้ และปล่อย full install smoke ให้ nightly หรือ release validation

slow Bun global install image-provider smoke ถูก gate แยกด้วย `run_bun_global_install_smoke` โดยรันตามตาราง nightly และจาก workflow release checks และ manual `Install Smoke` dispatch สามารถเลือกเปิดใช้ได้ แต่ pull request และ push ไปยัง `main` จะไม่รัน QR และ installer Docker tests ยังคงใช้ Dockerfiles ที่เน้นการติดตั้งของตัวเอง

## Local Docker E2E

`pnpm test:docker:all` prebuild อิมเมจ live-test ที่ใช้ร่วมกันหนึ่งอิมเมจ แพ็ก OpenClaw หนึ่งครั้งเป็น npm tarball และ build อิมเมจ `scripts/e2e/Dockerfile` ที่ใช้ร่วมกันสองอิมเมจ:

- runner Node/Git เปล่าสำหรับ installer/update/plugin-dependency lanes;
- อิมเมจ functional ที่ติดตั้ง tarball เดียวกันลงใน `/app` สำหรับ functionality lanes ปกติ

นิยาม Docker lane อยู่ใน `scripts/lib/docker-e2e-scenarios.mjs`, planner logic อยู่ใน `scripts/lib/docker-e2e-plan.mjs` และ runner จะ execute เฉพาะ plan ที่เลือกเท่านั้น scheduler เลือกอิมเมจต่อ lane ด้วย `OPENCLAW_DOCKER_E2E_BARE_IMAGE` และ `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` จากนั้นรัน lanes ด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1`

### Tunables

| Variable                               | Default | Purpose                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | จำนวน slot ของ main-pool สำหรับ lanes ปกติ                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | จำนวน slot ของ tail-pool ที่อ่อนไหวต่อ provider                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | เพดาน live lane พร้อมกัน เพื่อไม่ให้ providers throttle                                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | เพดาน lane การติดตั้ง npm พร้อมกัน                                                            |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | เพดาน multi-service lane พร้อมกัน                                                             |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | หน่วงระหว่างการเริ่ม lane เพื่อหลีกเลี่ยง Docker daemon create storms; ตั้ง `0` เพื่อไม่หน่วง |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | timeout สำรองต่อ lane (120 นาที); live/tail lanes ที่เลือกใช้เพดานที่เข้มกว่า                 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` พิมพ์ scheduler plan โดยไม่รัน lanes                                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | รายการ lane แบบ exact คั่นด้วย comma; ข้าม cleanup smoke เพื่อให้ agents ทำซ้ำ lane ที่ล้มเหลวหนึ่ง lane ได้ |

lane ที่หนักกว่าเพดาน effective ของตัวเองยังสามารถเริ่มจาก pool ว่างได้ แล้วจะรันเพียงลำพังจนกว่าจะคืน capacity aggregate preflight ในเครื่องจะตรวจสอบ Docker, ลบคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่, แสดงสถานะ active-lane, บันทึกเวลาของ lane เพื่อจัดลำดับ longest-first และตามค่าเริ่มต้นจะหยุด schedule pooled lanes ใหม่หลังพบ failure แรก

### Workflow live/E2E ที่นำกลับมาใช้ซ้ำได้

Workflow live/E2E ที่นำกลับมาใช้ซ้ำได้จะถาม `scripts/test-docker-all.mjs --plan-json` ว่าต้องใช้แพ็กเกจ ชนิดอิมเมจ live image, lane และ credential coverage ใด จากนั้น `scripts/docker-e2e.mjs` จะแปลง plan นั้นเป็น GitHub outputs และ summaries โดยจะ pack OpenClaw ผ่าน `scripts/package-openclaw-for-docker.mjs`, ดาวน์โหลด package artifact ของ current-run หรือดาวน์โหลด package artifact จาก `package_artifact_run_id`; ตรวจสอบ inventory ของ tarball; build และ push อิมเมจ GHCR Docker E2E แบบ bare/functional ที่ tag ด้วย package digest ผ่าน Docker layer cache ของ Blacksmith เมื่อ plan ต้องใช้ lanes ที่ติดตั้งแพ็กเกจแล้ว; และใช้อินพุต `docker_e2e_bare_image`/`docker_e2e_functional_image` ที่ให้มา หรืออิมเมจ package-digest ที่มีอยู่แทนการ rebuild การ pull อิมเมจ Docker จะ retry ด้วย timeout ต่อ attempt แบบจำกัด 180 วินาที เพื่อให้ registry/cache stream ที่ค้าง retry ได้เร็ว แทนที่จะกินเวลาส่วนใหญ่ของ critical path ของ CI

### Release-path chunks

ความครอบคลุม Release Docker รัน jobs แบบ chunk ขนาดเล็กกว่าด้วย `OPENCLAW_SKIP_DOCKER_BUILD=1` เพื่อให้แต่ละ chunk pull เฉพาะชนิดอิมเมจที่ต้องใช้ และ execute หลาย lanes ผ่าน weighted scheduler เดียวกัน:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

release Docker chunks ปัจจุบันคือ `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` และ `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` ส่วน `plugins-runtime-core`, `plugins-runtime` และ `plugins-integrations` ยังคงเป็น alias รวมของ plugin/runtime alias lane `install-e2e` ยังคงเป็น alias rerun แบบ manual รวมสำหรับ provider installer lanes ทั้งสอง

OpenWebUI ถูกพับเข้าไปใน `plugins-runtime-services` เมื่อ full release-path coverage ขอ และคง chunk `openwebui` แบบ standalone ไว้เฉพาะสำหรับ dispatch ที่เป็น OpenWebUI-only lanes อัปเดต bundled-channel จะ retry หนึ่งครั้งสำหรับความล้มเหลวชั่วคราวของเครือข่าย npm

แต่ละ chunk จะอัปโหลด `.artifacts/docker-tests/` พร้อม lane logs, timings, `summary.json`, `failures.json`, เวลาของแต่ละเฟส, scheduler plan JSON, ตาราง slow-lane และคำสั่ง rerun ต่อ lane อินพุต `docker_lanes` ของ workflow จะรัน lanes ที่เลือกกับอิมเมจที่เตรียมไว้แทน chunk jobs ซึ่งทำให้การดีบัก failed-lane ถูกจำกัดอยู่ใน Docker job เป้าหมายหนึ่ง job และเตรียม ดาวน์โหลด หรือใช้ package artifact ซ้ำสำหรับการรันนั้น หาก lane ที่เลือกเป็น live Docker lane job เป้าหมายจะ build อิมเมจ live-test ในเครื่องสำหรับ rerun นั้น คำสั่ง GitHub rerun ต่อ lane ที่สร้างขึ้นจะรวม `package_artifact_run_id`, `package_artifact_name` และอินพุตอิมเมจที่เตรียมไว้เมื่อมีค่าเหล่านั้น เพื่อให้ lane ที่ล้มเหลวสามารถใช้แพ็กเกจและอิมเมจ exact จากการรันที่ล้มเหลวซ้ำได้

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

workflow live/E2E ตามกำหนดการจะรันชุด Docker release-path แบบเต็มทุกวัน

## Plugin Prerelease

`Plugin Prerelease` เป็นความครอบคลุม product/package ที่มีต้นทุนสูงกว่า จึงเป็น workflow แยกที่ dispatch โดย `Full Release Validation` หรือโดย operator โดยชัดเจน pull request ปกติ, push ไปยัง `main` และ manual CI dispatch แบบ standalone จะปิด suite นั้นไว้ โดยจะบาลานซ์เทสต์ Plugin ที่บันเดิลมาใน extension workers แปดตัว; jobs shard ของส่วนขยายเหล่านั้นรันกลุ่ม config ของ Plugin ได้สูงสุดครั้งละสองกลุ่ม โดยใช้ Vitest worker หนึ่งตัวต่อกลุ่มและ Node heap ที่ใหญ่ขึ้น เพื่อให้ batch ของ Plugin ที่ import-heavy ไม่สร้าง CI jobs เพิ่มเติม path Docker prerelease สำหรับ release-only จะ batch Docker lanes เป้าหมายเป็นกลุ่มเล็ก เพื่อหลีกเลี่ยงการจอง runners จำนวนมากสำหรับ jobs ที่ใช้เวลาหนึ่งถึงสามนาที

## QA Lab

QA Lab มี CI lanes เฉพาะอยู่นอก workflow smart-scoped หลัก Agentic parity ถูกซ้อนอยู่ใต้ QA และ release harnesses แบบกว้าง ไม่ใช่ workflow PR แบบ standalone ใช้ `Full Release Validation` พร้อม `rerun_group=qa-parity` เมื่อควรให้ parity ไปกับการรัน validation แบบกว้าง

- Workflow `QA-Lab - All Lanes` รันทุกคืนบน `main` และเมื่อ manual dispatch; โดยกระจาย mock parity lane, live Matrix lane และ live Telegram กับ Discord lanes เป็น jobs ขนานกัน Live jobs ใช้ environment `qa-live-shared` และ Telegram/Discord ใช้ Convex leases

Release checks รัน Matrix และ Telegram live transport lanes ด้วย mock provider ที่กำหนดผลได้และ mock-qualified models (`mock-openai/gpt-5.5` และ `mock-openai/gpt-5.5-alt`) เพื่อแยก channel contract ออกจาก latency ของ live model และการเริ่มต้น provider-plugin ปกติ live transport gateway ปิด memory search เพราะ QA parity ครอบคลุมพฤติกรรม memory แยกต่างหาก; provider connectivity ถูกครอบคลุมโดยชุด live model, native provider และ Docker provider ที่แยกกัน

Matrix ใช้ `--profile fast` สำหรับ scheduled และ release gates โดยเพิ่ม `--fail-fast` เฉพาะเมื่อ CLI ที่ checkout รองรับ ค่าเริ่มต้นของ CLI และอินพุต manual workflow ยังคงเป็น `all`; manual `matrix_profile=all` dispatch จะแบ่ง full Matrix coverage เป็น jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` และ `e2ee-cli` เสมอ

`OpenClaw Release Checks` ยังรัน release-critical QA Lab lanes ก่อน release approval ด้วย; QA parity gate ของมันรัน candidate และ baseline packs เป็น lane jobs ขนานกัน จากนั้นดาวน์โหลด artifacts ทั้งสองเข้าไปใน report job ขนาดเล็กสำหรับการเปรียบเทียบ parity ขั้นสุดท้าย

สำหรับ PR ปกติ ให้ตามหลักฐาน CI/check แบบ scoped แทนการถือว่า parity เป็นสถานะที่จำเป็น

## CodeQL

เวิร์กโฟลว์ `CodeQL` เป็นสแกนเนอร์ความปลอดภัยรอบแรกที่ตั้งใจให้มีขอบเขตแคบ ไม่ใช่การกวาดตรวจทั้งรีโพสิทอรีแบบเต็ม รายวัน แบบแมนนวล และการรัน guard สำหรับ pull request ที่ไม่ใช่ draft จะสแกนโค้ดเวิร์กโฟลว์ Actions รวมถึงพื้นผิว JavaScript/TypeScript ที่มีความเสี่ยงสูงที่สุด โดยใช้คิวรีความปลอดภัยความเชื่อมั่นสูงที่กรองไว้สำหรับ `security-severity` ระดับสูง/วิกฤต

pull request guard ยังคงเบา: จะเริ่มเฉพาะการเปลี่ยนแปลงภายใต้ `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` หรือ `src` และรันเมทริกซ์ความปลอดภัยความเชื่อมั่นสูงชุดเดียวกับเวิร์กโฟลว์ตามกำหนดเวลา Android และ macOS CodeQL จะไม่อยู่ในค่าเริ่มต้นของ PR

### หมวดหมู่ความปลอดภัย

| หมวดหมู่                                         | พื้นผิว                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, ความลับ, sandbox, cron และ Gateway baseline                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | สัญญาการทำงานของ core channel รวมถึง channel Plugin runtime, Gateway, Plugin SDK, ความลับ, จุดสัมผัส audit              |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, การแยกวิเคราะห์ IP, network guard, web-fetch และพื้นผิวนโยบาย SSRF ของ Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | เซิร์ฟเวอร์ MCP, helper สำหรับการประมวลผลการรัน process, การส่งออกขาออก และ gate การรันเครื่องมือของ agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | การติดตั้ง Plugin, loader, manifest, registry, การติดตั้ง package-manager, source-loading และพื้นผิวความเชื่อถือของสัญญา package ของ Plugin SDK |

### shard ความปลอดภัยเฉพาะแพลตฟอร์ม

- `CodeQL Android Critical Security` — shard ความปลอดภัย Android ตามกำหนดเวลา สร้างแอป Android แบบแมนนวลสำหรับ CodeQL บน Blacksmith Linux runner ที่เล็กที่สุดที่ workflow sanity ยอมรับ อัปโหลดภายใต้ `/codeql-critical-security/android`
- `CodeQL macOS Critical Security` — shard ความปลอดภัย macOS แบบรายสัปดาห์/แมนนวล สร้างแอป macOS แบบแมนนวลสำหรับ CodeQL บน Blacksmith macOS กรองผลการสร้าง dependency ออกจาก SARIF ที่อัปโหลด และอัปโหลดภายใต้ `/codeql-critical-security/macos` เก็บไว้นอกค่าเริ่มต้นรายวันเพราะการสร้าง macOS ใช้ runtime มากที่สุดแม้เมื่อสะอาด

### หมวดหมู่คุณภาพวิกฤต

`CodeQL Critical Quality` คือ shard ที่จับคู่กันซึ่งไม่ใช่ความปลอดภัย รันเฉพาะคิวรีคุณภาพ JavaScript/TypeScript ที่ไม่ใช่ความปลอดภัยและมี error-severity บนพื้นผิวมูลค่าสูงที่มีขอบเขตแคบ บน Blacksmith Linux runner ขนาดเล็กกว่า pull request guard ของมันตั้งใจให้เล็กกว่า profile ตามกำหนดเวลา: PR ที่ไม่ใช่ draft จะรันเฉพาะ shard ที่จับคู่กัน ได้แก่ `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` และ `plugin-sdk-reply-runtime` สำหรับการเปลี่ยนแปลงโค้ดการรันคำสั่ง/model/tool ของ agent และการ dispatch reply, โค้ด config schema/migration/IO, โค้ด auth/secrets/sandbox/security, core channel และ bundled channel Plugin runtime, Gateway protocol/server-method, memory runtime/SDK glue, MCP/process/outbound delivery, provider runtime/model catalog, session diagnostics/delivery queues, Plugin loader, Plugin SDK/package-contract หรือ Plugin SDK reply runtime การเปลี่ยนแปลง CodeQL config และ quality workflow จะรัน PR quality shard ทั้งสิบสองรายการ

manual dispatch รับค่า:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

profile แบบแคบเป็น hook สำหรับสอน/วนปรับปรุงเพื่อรัน quality shard หนึ่งรายการแยกเดี่ยว

| หมวดหมู่                                               | พื้นผิว                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | โค้ดขอบเขตความปลอดภัยของ Auth, ความลับ, sandbox, cron และ Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | สัญญา config schema, migration, normalization และ IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | schema ของ Gateway protocol และสัญญา server method                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | สัญญาการทำงานของ core channel และ bundled channel Plugin                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | การรันคำสั่ง, การ dispatch model/provider, การ dispatch และ queue ของ auto-reply และสัญญา runtime ของ ACP control-plane                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | เซิร์ฟเวอร์ MCP และสะพานเชื่อม tool, helper สำหรับกำกับดูแล process และสัญญาการส่งออกขาออก                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | memory host SDK, memory runtime facade, alias ของ memory Plugin SDK, glue สำหรับเปิดใช้งาน memory runtime และคำสั่ง memory doctor                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | ส่วนภายในของ reply queue, queue การส่ง session, helper การ bind/ส่ง outbound session, พื้นผิว diagnostic event/log bundle และสัญญา CLI ของ session doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | การ dispatch inbound reply ของ Plugin SDK, helper สำหรับ reply payload/chunking/runtime, ตัวเลือก channel reply, delivery queue และ helper การ bind session/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | การ normalize model catalog, provider auth และ discovery, การลงทะเบียน provider runtime, provider defaults/catalogs และ registry ของ web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | การ bootstrap ของ Control UI, persistence ภายในเครื่อง, flow การควบคุม Gateway และสัญญา runtime ของ task control-plane                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | core web fetch/search, media IO, media understanding, image-generation และสัญญา runtime ของ media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | สัญญา loader, registry, public-surface และ entrypoint ของ Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | source ของ Plugin SDK ฝั่ง package ที่เผยแพร่แล้ว และ helper สัญญา package ของ Plugin                                                                                      |

คุณภาพแยกจากความปลอดภัยเพื่อให้ findings ด้านคุณภาพสามารถถูกกำหนดเวลา วัดผล ปิดใช้งาน หรือขยายได้โดยไม่บดบังสัญญาณความปลอดภัย ควรเพิ่มการขยาย CodeQL สำหรับ Swift, Python และ bundled-plugin กลับเข้ามาเป็นงานติดตามที่มีขอบเขตหรือแบ่ง shard แล้วเท่านั้น หลังจาก profile แบบแคบมี runtime และสัญญาณที่เสถียร

## เวิร์กโฟลว์บำรุงรักษา

### Docs Agent

เวิร์กโฟลว์ `Docs Agent` เป็นเลนบำรุงรักษา Codex แบบขับเคลื่อนด้วยเหตุการณ์สำหรับรักษาเอกสารที่มีอยู่ให้สอดคล้องกับการเปลี่ยนแปลงที่เพิ่ง land ไม่มี schedule ล้วน: การรัน CI จาก push ที่สำเร็จและไม่ใช่ bot บน `main` สามารถ trigger ได้ และ manual dispatch สามารถรันได้โดยตรง การเรียกจาก workflow-run จะข้ามเมื่อ `main` ขยับต่อไปแล้ว หรือเมื่อมีการสร้างการรัน Docs Agent ที่ไม่ถูกข้ามรายการอื่นในชั่วโมงที่ผ่านมา เมื่อรัน จะตรวจสอบช่วง commit ตั้งแต่ source SHA ของ Docs Agent ที่ไม่ถูกข้ามรายการก่อนหน้าไปจนถึง `main` ปัจจุบัน ดังนั้นการรันรายชั่วโมงหนึ่งครั้งจึงครอบคลุมการเปลี่ยนแปลงทั้งหมดบน main ที่สะสมตั้งแต่รอบเอกสารครั้งล่าสุดได้

### Test Performance Agent

เวิร์กโฟลว์ `Test Performance Agent` เป็นเลนบำรุงรักษา Codex แบบขับเคลื่อนด้วยเหตุการณ์สำหรับ test ที่ช้า ไม่มี schedule ล้วน: การรัน CI จาก push ที่สำเร็จและไม่ใช่ bot บน `main` สามารถ trigger ได้ แต่จะข้ามหากการเรียกจาก workflow-run รายการอื่นได้รันแล้วหรือกำลังรันอยู่ในวัน UTC นั้น Manual dispatch จะข้าม gate กิจกรรมรายวันนั้น เลนนี้สร้างรายงานประสิทธิภาพ Vitest แบบ grouped สำหรับทั้งชุด อนุญาตให้ Codex ทำเฉพาะการแก้ประสิทธิภาพ test ขนาดเล็กที่ยังคง coverage ไว้ แทนที่จะทำ refactor กว้าง จากนั้นรันรายงานทั้งชุดอีกครั้งและปฏิเสธการเปลี่ยนแปลงที่ลดจำนวน test baseline ที่ผ่าน หาก baseline มี test ที่ล้มเหลว Codex อาจแก้เฉพาะความล้มเหลวที่ชัดเจน และรายงานทั้งชุดหลัง agent ต้องผ่านก่อนที่จะ commit อะไรก็ตาม เมื่อ `main` เดินหน้าก่อน bot push จะ land เลนนี้จะ rebase patch ที่ตรวจสอบแล้ว รัน `pnpm check:changed` อีกครั้ง และลอง push ใหม่; patch เก่าที่ขัดแย้งกันจะถูกข้าม ใช้ GitHub-hosted Ubuntu เพื่อให้ Codex action คง posture ความปลอดภัยแบบ drop-sudo เดียวกับ docs agent ได้

### Duplicate PRs After Merge

เวิร์กโฟลว์ `Duplicate PRs After Merge` เป็นเวิร์กโฟลว์แมนนวลสำหรับ maintainer เพื่อทำความสะอาดรายการซ้ำหลัง land ค่าเริ่มต้นเป็น dry-run และจะปิดเฉพาะ PR ที่ระบุไว้อย่างชัดเจนเมื่อ `apply=true` ก่อนเปลี่ยนแปลง GitHub จะตรวจสอบว่า PR ที่ land ถูก merge แล้ว และแต่ละรายการซ้ำมี issue ที่อ้างอิงร่วมกันหรือมี hunk ที่เปลี่ยนแปลงทับซ้อนกัน

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## gate การตรวจสอบภายในเครื่องและการ route การเปลี่ยนแปลง

ตรรกะ changed-lane ภายในเครื่องอยู่ใน `scripts/changed-lanes.mjs` และถูกเรียกใช้โดย `scripts/check-changed.mjs` gate การตรวจสอบภายในเครื่องนั้นเข้มงวดเรื่องขอบเขตสถาปัตยกรรมมากกว่าขอบเขตแพลตฟอร์ม CI แบบกว้าง:

- การเปลี่ยนแปลง core production รัน typecheck ของ core prod และ core test พร้อม core lint/guards;
- การเปลี่ยนแปลงเฉพาะ core test รันเฉพาะ typecheck ของ core test พร้อม core lint;
- การเปลี่ยนแปลง extension production รัน typecheck ของ extension prod และ extension test พร้อม extension lint;
- การเปลี่ยนแปลงเฉพาะ extension test รัน typecheck ของ extension test พร้อม extension lint;
- การเปลี่ยนแปลง public Plugin SDK หรือ plugin-contract ขยายไปยัง extension typecheck เพราะ extension พึ่งพาสัญญา core เหล่านั้น (การกวาด Vitest extension ยังคงเป็นงาน test ที่ต้องระบุชัดเจน);
- การ bump version ที่เป็น release metadata เท่านั้น รันการตรวจสอบ version/config/root-dependency แบบ targeted;
- การเปลี่ยนแปลง root/config ที่ไม่ทราบประเภทจะ fail safe ไปยังทุก check lane

การ route changed-test ภายในเครื่องอยู่ใน `scripts/test-projects.test-support.mjs` และตั้งใจให้ถูกกว่า `check:changed`: การแก้ test โดยตรงรันตัวเอง, การแก้ source จะใช้ mapping ชัดเจนก่อน แล้วจึง sibling tests และ dependents จาก import-graph config การส่ง group-room ที่แชร์เป็นหนึ่งใน mapping ที่ชัดเจน: การเปลี่ยนแปลงต่อ config visible-reply ของ group, source reply delivery mode หรือ system prompt ของ message-tool จะ route ผ่าน core reply tests พร้อม regression การส่ง Discord และ Slack เพื่อให้การเปลี่ยนค่าเริ่มต้นที่แชร์ล้มเหลวก่อน PR push แรก ใช้ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` เฉพาะเมื่อการเปลี่ยนแปลงกว้างระดับ harness จนชุด mapped ราคาถูกไม่ใช่ proxy ที่น่าเชื่อถือ

## การตรวจสอบ Testbox

เรียกใช้ Testbox จากรากของรีโพ และควรใช้กล่องใหม่ที่วอร์มไว้แล้วสำหรับหลักฐานวงกว้าง ก่อนใช้ gate ที่ช้ากับกล่องที่ถูกนำกลับมาใช้ซ้ำ หมดอายุ หรือเพิ่งรายงานการซิงก์ที่ใหญ่ผิดคาด ให้เรียกใช้ `pnpm testbox:sanity` ภายในกล่องก่อน

การตรวจสอบ sanity จะล้มเหลวอย่างรวดเร็วเมื่อไฟล์รากที่จำเป็น เช่น `pnpm-lock.yaml` หายไป หรือเมื่อ `git status --short` แสดงการลบไฟล์ที่ติดตามไว้อย่างน้อย 200 รายการ โดยปกติหมายความว่าสถานะการซิงก์ระยะไกลไม่ใช่สำเนาของ PR ที่เชื่อถือได้ ให้หยุดกล่องนั้นและวอร์มกล่องใหม่แทนการดีบักความล้มเหลวของการทดสอบผลิตภัณฑ์ สำหรับ PR ที่ตั้งใจลบไฟล์จำนวนมาก ให้ตั้งค่า `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` สำหรับการเรียก sanity ครั้งนั้น

`pnpm testbox:run` ยังยุติการเรียกใช้ Blacksmith CLI ในเครื่องที่ค้างอยู่ในช่วงซิงก์นานกว่าห้านาทีโดยไม่มีเอาต์พุตหลังซิงก์ ตั้งค่า `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` เพื่อปิด guard นั้น หรือใช้ค่ามิลลิวินาทีที่มากขึ้นสำหรับ diff ในเครื่องที่ใหญ่ผิดปกติ

Crabbox คือ wrapper กล่องระยะไกลที่รีโพเป็นเจ้าของสำหรับหลักฐาน Linux ของผู้ดูแล ใช้เมื่อ check กว้างเกินไปสำหรับ local edit loop, เมื่อความสอดคล้องกับ CI สำคัญ, หรือเมื่อหลักฐานต้องใช้ secrets, Docker, package lanes, กล่องที่นำกลับมาใช้ซ้ำได้, หรือบันทึกระยะไกล แบ็กเอนด์ OpenClaw ปกติคือ `blacksmith-testbox`; ความจุ AWS/Hetzner ที่เป็นเจ้าของเป็นทางสำรองเมื่อ Blacksmith ขัดข้อง มีปัญหาโควตา หรือมีการทดสอบความจุที่เป็นเจ้าของอย่างชัดเจน

ก่อนเรียกใช้ครั้งแรก ให้ตรวจ wrapper จากรากของรีโพ:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

wrapper ของรีโพจะปฏิเสธไบนารี Crabbox ที่เก่าและไม่ได้ประกาศ `blacksmith-testbox` ให้ส่ง provider อย่างชัดเจนแม้ว่า `.crabbox.yaml` จะมีค่าเริ่มต้น owned-cloud อยู่แล้ว

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

อ่านสรุป JSON สุดท้าย ฟิลด์ที่มีประโยชน์คือ `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, และ `totalMs` การเรียกใช้ Crabbox แบบครั้งเดียวที่หนุนด้วย Blacksmith ควรหยุด Testbox โดยอัตโนมัติ หากการเรียกใช้ถูกขัดจังหวะหรือการล้างข้อมูลไม่ชัดเจน ให้ตรวจกล่องที่ยังทำงานอยู่และหยุดเฉพาะกล่องที่คุณสร้าง:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

ใช้การนำกลับมาใช้ซ้ำเฉพาะเมื่อคุณตั้งใจต้องใช้หลายคำสั่งบนกล่องเดียวกันที่ hydrate แล้ว:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

หาก Crabbox เป็นชั้นที่เสียแต่ Blacksmith เองยังทำงาน ให้ใช้ Blacksmith โดยตรงเป็นทางสำรองแบบจำกัดขอบเขต:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

ยกระดับไปใช้ความจุ Crabbox ที่เป็นเจ้าของเฉพาะเมื่อ Blacksmith ล่ม ถูกจำกัดโควตา ไม่มีสภาพแวดล้อมที่ต้องใช้ หรือความจุที่เป็นเจ้าของคือเป้าหมายอย่างชัดเจน:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` เป็นเจ้าของค่าเริ่มต้นของ provider, sync, และการ hydrate ของ GitHub Actions สำหรับ owned-cloud lanes ไฟล์นี้ยกเว้น `.git` ในเครื่องเพื่อให้ checkout ของ Actions ที่ hydrate แล้วเก็บ metadata Git ระยะไกลของตัวเอง แทนการซิงก์ remotes และ object stores ในเครื่องของผู้ดูแล และยกเว้น artifact runtime/build ในเครื่องที่ไม่ควรถูกถ่ายโอนโดยเด็ดขาด `.github/workflows/crabbox-hydrate.yml` เป็นเจ้าของ checkout, การตั้งค่า Node/pnpm, การ fetch `origin/main`, และการส่งต่อสภาพแวดล้อมที่ไม่ใช่ secret สำหรับคำสั่ง owned-cloud `crabbox run --id <cbx_id>`

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [ช่องทางการพัฒนา](/th/install/development-channels)
