---
read_when:
    - การเรียกใช้หรือเรียกใช้การตรวจสอบความถูกต้องของการเผยแพร่ฉบับเต็มอีกครั้ง
    - การเปรียบเทียบโปรไฟล์การตรวจสอบความถูกต้องของรีลีสแบบเสถียรและแบบเต็ม
    - การดีบักความล้มเหลวของขั้นตอนการตรวจสอบความถูกต้องของรีลีส
summary: ขั้นตอนการตรวจสอบรีลีสแบบเต็ม เวิร์กโฟลว์ลูก โปรไฟล์รีลีส แฮนเดิลการรันซ้ำ และหลักฐาน
title: การตรวจสอบรีลีสแบบเต็ม
x-i18n:
    generated_at: "2026-05-02T20:59:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce1e5a72227ca202335fe68b537491a0b68a0bb2af431aa56c41cf20989e88c
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` คือเวิร์กโฟลว์ครอบคลุมของการเผยแพร่ เป็นจุดเข้าแบบแมนนวลจุดเดียวสำหรับหลักฐานก่อนเผยแพร่ แต่การทำงานส่วนใหญ่เกิดขึ้นในเวิร์กโฟลว์ลูก เพื่อให้สามารถรันกล่องที่ล้มเหลวซ้ำได้โดยไม่ต้องเริ่มการเผยแพร่ทั้งหมดใหม่

รันจาก ref ของเวิร์กโฟลว์ที่เชื่อถือได้ ซึ่งปกติคือ `main` และส่งสาขาเผยแพร่ แท็ก หรือ SHA ของคอมมิตแบบเต็มเป็น `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

เวิร์กโฟลว์ลูกใช้ ref ของเวิร์กโฟลว์ที่เชื่อถือได้สำหรับฮาร์เนส และใช้ค่าอินพุต `ref` สำหรับแคนดิเดตที่อยู่ระหว่างทดสอบ วิธีนี้ทำให้ตรรกะตรวจสอบความถูกต้องใหม่พร้อมใช้งานเมื่อกำลังตรวจสอบความถูกต้องของสาขาหรือแท็กเผยแพร่ที่เก่ากว่า

โดยปกติ Package Acceptance จะสร้าง tarball ของแคนดิเดตจาก `ref` ที่ resolve แล้ว รวมถึงการรันด้วย SHA เต็มที่ dispatch ผ่าน `pnpm ci:full-release` หลังเผยแพร่ ให้ส่ง `package_acceptance_package_spec=openclaw@YYYY.M.D` (หรือ `openclaw@beta`/`openclaw@latest`) เพื่อรันเมทริกซ์แพ็กเกจ/อัปเดตเดียวกันกับแพ็กเกจ npm ที่จัดส่งแล้วแทน

## ขั้นตอนระดับบนสุด

| ขั้นตอน                | รายละเอียด                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การ resolve เป้าหมาย    | **งาน:** `Resolve target ref`<br />**เวิร์กโฟลว์ลูก:** ไม่มี<br />**พิสูจน์:** resolve สาขาเผยแพร่ แท็ก หรือ SHA ของคอมมิตแบบเต็ม และบันทึกอินพุตที่เลือกไว้<br />**รันซ้ำ:** รันเวิร์กโฟลว์ครอบคลุมซ้ำหากขั้นตอนนี้ล้มเหลว                                                                                                                                                                              |
| Vitest และ CI ปกติ | **งาน:** `Run normal full CI`<br />**เวิร์กโฟลว์ลูก:** `CI`<br />**พิสูจน์:** กราฟ CI เต็มแบบแมนนวลกับ ref เป้าหมาย รวมถึงเลน Linux Node, ชาร์ด Plugin ที่บันเดิลมา, สัญญาของช่องทาง, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, smoke ของบิลด์, การตรวจสอบเอกสาร, Skills ของ Python, Windows, macOS, Control UI i18n และ Android ผ่านเวิร์กโฟลว์ครอบคลุม<br />**รันซ้ำ:** `rerun_group=ci` |
| Plugin ก่อนเผยแพร่    | **งาน:** `Run plugin prerelease validation`<br />**เวิร์กโฟลว์ลูก:** `Plugin Prerelease`<br />**พิสูจน์:** การตรวจสอบสแตติกของ Plugin เฉพาะการเผยแพร่, ความครอบคลุม Plugin แบบ agentic, ชาร์ดแบตช์ส่วนขยายแบบเต็ม และเลน Docker ก่อนเผยแพร่ของ Plugin<br />**รันซ้ำ:** `rerun_group=plugin-prerelease`                                                                                                       |
| การตรวจสอบการเผยแพร่       | **งาน:** `Run release/live/Docker/QA validation`<br />**เวิร์กโฟลว์ลูก:** `OpenClaw Release Checks`<br />**พิสูจน์:** install smoke, การตรวจสอบแพ็กเกจข้าม OS, ชุดทดสอบ live/E2E, ชังก์เส้นทางการเผยแพร่ Docker, Package Acceptance, ความเท่าเทียมของ QA Lab, Matrix แบบ live และ Telegram แบบ live<br />**รันซ้ำ:** `rerun_group=release-checks` หรือแฮนเดิล release-checks ที่แคบกว่า                                |
| Package Telegram     | **งาน:** `Run package Telegram E2E`<br />**เวิร์กโฟลว์ลูก:** `NPM Telegram Beta E2E`<br />**พิสูจน์:** หลักฐานแพ็กเกจ Telegram ที่อ้างอิงอาร์ติแฟกต์สำหรับ `rerun_group=all` พร้อม `release_profile=full` หรือหลักฐาน Telegram ของแพ็กเกจที่เผยแพร่แล้วเมื่อกำหนด `npm_telegram_package_spec`<br />**รันซ้ำ:** `rerun_group=npm-telegram` พร้อม `npm_telegram_package_spec`                                     |
| ตัวตรวจสอบเวิร์กโฟลว์ครอบคลุม    | **งาน:** `Verify full validation`<br />**เวิร์กโฟลว์ลูก:** ไม่มี<br />**พิสูจน์:** ตรวจซ้ำผลสรุปของการรันเวิร์กโฟลว์ลูกที่บันทึกไว้ และต่อท้ายตารางงานที่ช้าที่สุดจากเวิร์กโฟลว์ลูก<br />**รันซ้ำ:** รันเฉพาะงานนี้ซ้ำหลังจากรันเวิร์กโฟลว์ลูกที่ล้มเหลวซ้ำจนผ่าน                                                                                                                                   |

สำหรับ `ref=main` และ `rerun_group=all` เวิร์กโฟลว์ครอบคลุมที่ใหม่กว่าจะ supersede เวิร์กโฟลว์เก่า เมื่อ parent ถูกยกเลิก monitor ของมันจะยกเลิกเวิร์กโฟลว์ลูกใด ๆ ที่ dispatch ไปแล้ว การรันตรวจสอบความถูกต้องของสาขาเผยแพร่และแท็กจะไม่ยกเลิกกันโดยค่าเริ่มต้น

## ขั้นตอนการตรวจสอบการเผยแพร่

`OpenClaw Release Checks` คือเวิร์กโฟลว์ลูกที่ใหญ่ที่สุด โดย resolve เป้าหมายครั้งเดียว และเตรียมอาร์ติแฟกต์ `release-package-under-test` ที่แชร์กันเมื่อขั้นตอนที่เกี่ยวข้องกับแพ็กเกจหรือ Docker ต้องใช้

| ขั้นตอน               | รายละเอียด                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| เป้าหมายการเผยแพร่      | **งาน:** `Resolve target ref`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**ทดสอบ:** ref ที่เลือก, SHA ที่คาดไว้ซึ่งเป็นตัวเลือก, โปรไฟล์, กลุ่มรันซ้ำ และตัวกรองชุดทดสอบ live แบบเจาะจง<br />**รันซ้ำ:** `rerun_group=release-checks`                                                                                                                                                                           |
| อาร์ติแฟกต์แพ็กเกจ    | **งาน:** `Prepare release package artifact`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**ทดสอบ:** แพ็กหรือ resolve tarball แคนดิเดตหนึ่งรายการ และอัปโหลด `release-package-under-test` สำหรับการตรวจสอบขั้นปลายที่เกี่ยวกับแพ็กเกจ<br />**รันซ้ำ:** กลุ่มแพ็กเกจ ข้าม OS หรือ live/E2E ที่ได้รับผลกระทบ                                                                                                           |
| Install smoke       | **งาน:** `Run install smoke`<br />**เวิร์กโฟลว์รองรับ:** `Install Smoke`<br />**ทดสอบ:** เส้นทางติดตั้งเต็มรูปแบบพร้อมการใช้ image smoke ของ Dockerfile รากซ้ำ, การติดตั้งแพ็กเกจ QR, smoke ของ Docker สำหรับรากและ Gateway, การทดสอบ Docker ของตัวติดตั้ง, smoke ของ image-provider สำหรับการติดตั้ง Bun global และ E2E การติดตั้ง/ถอนการติดตั้ง Plugin ที่บันเดิลมาแบบเร็ว<br />**รันซ้ำ:** `rerun_group=install-smoke`                              |
| ข้าม OS            | **งาน:** `cross_os_release_checks`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**ทดสอบ:** เลนติดตั้งใหม่และอัปเกรดบน Linux, Windows และ macOS สำหรับ provider และ mode ที่เลือก โดยใช้ tarball แคนดิเดตพร้อมแพ็กเกจ baseline<br />**รันซ้ำ:** `rerun_group=cross-os`                                                                               |
| Repo และ live E2E   | **งาน:** `Run repo/live E2E validation`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**ทดสอบ:** E2E ของ repository, แคช live, การสตรีม websocket ของ OpenAI, ชาร์ด provider และ Plugin แบบ native live และฮาร์เนส model/backend/gateway แบบ live ที่อิง Docker ซึ่งเลือกโดย `release_profile`<br />**รันซ้ำ:** `rerun_group=live-e2e` พร้อม `live_suite_filter` ได้ตามต้องการ |
| เส้นทางการเผยแพร่ Docker | **งาน:** `Run Docker release-path validation`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**ทดสอบ:** ชังก์ Docker เส้นทางการเผยแพร่กับอาร์ติแฟกต์แพ็กเกจที่แชร์กัน<br />**รันซ้ำ:** `rerun_group=live-e2e`                                                                                                                                                      |
| Package Acceptance  | **งาน:** `Run package acceptance`<br />**เวิร์กโฟลว์รองรับ:** `Package Acceptance`<br />**ทดสอบ:** fixture แพ็กเกจ Plugin แบบออฟไลน์, การอัปเดต Plugin, package acceptance ของ Telegram แบบ mock-OpenAI และการตรวจสอบ survivor ของการอัปเกรดที่เผยแพร่แล้วจาก npm stable release ทุกเวอร์ชันตั้งแต่ `2026.4.23` เป็นต้นไปกับ tarball เดียวกัน<br />**รันซ้ำ:** `rerun_group=package`                                         |
| ความเท่าเทียมของ QA           | **งาน:** `Run QA Lab parity lane` และ `Run QA Lab parity report`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**ทดสอบ:** parity pack แบบ agentic ของแคนดิเดตและ baseline จากนั้นจึงเป็นรายงานความเท่าเทียม<br />**รันซ้ำ:** `rerun_group=qa-parity` หรือ `rerun_group=qa`                                                                                                                                       |
| QA live Matrix      | **งาน:** `Run QA Lab live Matrix lane`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**ทดสอบ:** โปรไฟล์ QA ของ Matrix แบบ live ที่รวดเร็วใน environment `qa-live-shared`<br />**รันซ้ำ:** `rerun_group=qa-live` หรือ `rerun_group=qa`                                                                                                                                                                        |
| QA live Telegram    | **งาน:** `Run QA Lab live Telegram lane`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**ทดสอบ:** QA ของ Telegram แบบ live พร้อม lease ของ credential Convex CI<br />**รันซ้ำ:** `rerun_group=qa-live` หรือ `rerun_group=qa`                                                                                                                                                                                    |
| ตัวตรวจสอบการเผยแพร่    | **งาน:** `Verify release checks`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**ทดสอบ:** งาน release-check ที่จำเป็นสำหรับกลุ่มรันซ้ำที่เลือก<br />**รันซ้ำ:** รันซ้ำหลังจากงานลูกแบบเจาะจงผ่านแล้ว                                                                                                                                                                                                 |

## ชังก์เส้นทางการเผยแพร่ Docker

ขั้นตอนเส้นทางการเผยแพร่ Docker จะรันชังก์เหล่านี้เมื่อ `live_suite_filter` ว่าง:

| ชังก์                                                           | ความครอบคลุม                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | เลน smoke ของเส้นทางการเผยแพร่ Docker หลัก                                   |
| `package-update-openai`                                         | พฤติกรรมการติดตั้งและอัปเดตแพ็กเกจ OpenAI                             |
| `package-update-anthropic`                                      | พฤติกรรมการติดตั้งและอัปเดตแพ็กเกจ Anthropic                          |
| `package-update-core`                                           | พฤติกรรมแพ็กเกจและการอัปเดตที่ไม่ผูกกับ provider                           |
| `plugins-runtime-plugins`                                       | เลน runtime ของ Plugin ที่ exercise พฤติกรรม Plugin                     |
| `plugins-runtime-services`                                      | เลน runtime ของ Plugin ที่อิง service รวม OpenWebUI เมื่อร้องขอ |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | แบตช์การติดตั้ง/runtime ของ Plugin ที่แบ่งสำหรับการตรวจสอบการเผยแพร่แบบขนาน   |

ใช้ `docker_lanes=<lane[,lane]>` แบบเจาะจงบนเวิร์กโฟลว์ live/E2E ที่ reusable เมื่อมีเลน Docker เพียงเลนเดียวล้มเหลว อาร์ติแฟกต์การเผยแพร่มีคำสั่งรันซ้ำรายเลนพร้อมอินพุตอาร์ติแฟกต์แพ็กเกจและการใช้ image ซ้ำเมื่อพร้อมใช้งาน

## โปรไฟล์การเผยแพร่

`release_profile` ควบคุมขอบเขต live/provider ภายใน release checks เป็นหลัก
ไม่ได้ตัด full CI ปกติ, Plugin Prerelease, install smoke, package
acceptance, QA Lab หรือส่วน Docker release-path ออก `full` ยังทำให้
umbrella เรียกใช้ Telegram E2E ของแพ็กเกจกับอาร์ติแฟกต์แพ็กเกจรีลีสเมื่อ
`rerun_group=all` ดังนั้นตัวเลือกก่อนเผยแพร่แบบเต็มจะไม่ข้ามเลนแพ็กเกจ
Telegram นั้นอย่างเงียบๆ

| โปรไฟล์   | การใช้งานที่ตั้งใจ                      | ความครอบคลุม live/provider ที่รวมอยู่                                                                                                                                               |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | smoke ที่เร็วที่สุดสำหรับรีลีสที่สำคัญ   | เส้นทาง live ของ OpenAI/core, โมเดล live ของ Docker สำหรับ OpenAI, แกนหลัก Gateway แบบเนทีฟ, โปรไฟล์ Gateway OpenAI แบบเนทีฟ, Plugin OpenAI แบบเนทีฟ และ Gateway live ของ Docker สำหรับ OpenAI               |
| `stable`  | โปรไฟล์อนุมัติรีลีสเริ่มต้น | `minimum` บวก Anthropic, Google, MiniMax, backend, ชุดทดสอบ live แบบเนทีฟ, backend CLI live ของ Docker, Docker ACP bind, ชุดทดสอบ Codex ของ Docker และ shard smoke ของ OpenCode Go |
| `full`    | การกวาดตรวจ advisory แบบกว้าง             | `stable` บวกผู้ให้บริการ advisory, shard live ของ Plugin และ shard live ของสื่อ                                                                                                  |

## รายการเพิ่มเติมเฉพาะ full

ชุดเหล่านี้ถูกข้ามโดย `stable` และรวมอยู่ใน `full`:

| พื้นที่                             | ความครอบคลุมเฉพาะ full                                                              |
| -------------------------------- | ------------------------------------------------------------------------------- |
| โมเดล live ของ Docker               | OpenCode Go, OpenRouter, xAI, Z.ai และ Fireworks                              |
| Gateway live ของ Docker              | shard advisory สำหรับ DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI และ Z.ai |
| โปรไฟล์ผู้ให้บริการ Gateway แบบเนทีฟ | Fireworks, DeepSeek, shard โมเดล OpenCode Go แบบเต็ม, OpenRouter, xAI และ Z.ai  |
| shard live ของ Plugin แบบเนทีฟ        | Plugins A-K, L-N, O-Z อื่นๆ, Moonshot และ xAI                                 |
| shard live ของสื่อแบบเนทีฟ         | Audio, Google music, MiniMax music และกลุ่มวิดีโอ A-D                       |

`stable` รวม `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
ใช้ shard โมเดล OpenCode Go ที่กว้างกว่าแทน

## การเรียกซ้ำแบบเจาะจง

ใช้ `rerun_group` เพื่อหลีกเลี่ยงการรันกล่องรีลีสที่ไม่เกี่ยวข้องซ้ำ:

| แฮนเดิล              | ขอบเขต                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | ทุกขั้นตอนของ Full Release Validation                                   |
| `ci`                | เฉพาะ child full CI แบบ manual                                            |
| `plugin-prerelease` | เฉพาะ child Plugin Prerelease                                         |
| `release-checks`    | ทุกขั้นตอนของ OpenClaw Release Checks                                   |
| `install-smoke`     | Install Smoke ผ่าน release checks                                 |
| `cross-os`          | release checks แบบ Cross-OS                                              |
| `live-e2e`          | การตรวจสอบ repo/live E2E และ Docker release-path                     |
| `package`           | Package Acceptance                                                   |
| `qa`                | ความเท่าเทียม QA บวกเลน live ของ QA                                         |
| `qa-parity`         | เฉพาะเลนความเท่าเทียม QA และรายงาน                                      |
| `qa-live`           | เฉพาะ Matrix live ของ QA และ Telegram                                     |
| `npm-telegram`      | Telegram E2E ของแพ็กเกจที่เผยแพร่แล้ว; ต้องใช้ `npm_telegram_package_spec` |

ใช้ `live_suite_filter` กับ `rerun_group=live-e2e` เมื่อชุด live หนึ่งชุดล้มเหลว
id ตัวกรองที่ใช้ได้ถูกกำหนดไว้ในเวิร์กโฟลว์ live/E2E ที่นำกลับมาใช้ซ้ำได้ รวมถึง
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` และ
`live-codex-harness-docker`

## หลักฐานที่ควรเก็บไว้

เก็บสรุป `Full Release Validation` ไว้เป็นดัชนีระดับรีลีส โดยจะลิงก์
id ของ child run และรวมตารางงานที่ช้าที่สุดไว้ด้วย สำหรับความล้มเหลว ให้ตรวจสอบ
child workflow ก่อน จากนั้นเรียกซ้ำด้วยแฮนเดิลที่ตรงกันและเล็กที่สุดด้านบน

อาร์ติแฟกต์ที่มีประโยชน์:

- `release-package-under-test` จาก `OpenClaw Release Checks`
- อาร์ติแฟกต์ Docker release-path ภายใต้ `.artifacts/docker-tests/`
- `package-under-test` ของ Package Acceptance และอาร์ติแฟกต์การยอมรับของ Docker
- อาร์ติแฟกต์ release-check แบบ Cross-OS สำหรับแต่ละ OS และชุด
- อาร์ติแฟกต์ QA parity, Matrix และ Telegram

## ไฟล์เวิร์กโฟลว์

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
