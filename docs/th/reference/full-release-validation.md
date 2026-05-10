---
read_when:
    - การรันหรือรันซ้ำการตรวจสอบความถูกต้องของการเผยแพร่แบบเต็ม
    - การเปรียบเทียบโปรไฟล์การตรวจสอบความถูกต้องของรุ่นเผยแพร่แบบเสถียรและแบบเต็ม
    - การดีบักความล้มเหลวในขั้นตอนการตรวจสอบความถูกต้องของรีลีส
summary: ขั้นตอนของการตรวจสอบความถูกต้องของรีลีสแบบเต็ม, เวิร์กโฟลว์ย่อย, โปรไฟล์รีลีส, แฮนเดิลสำหรับรันซ้ำ และหลักฐาน
title: การตรวจสอบรีลีสแบบเต็มรูปแบบ
x-i18n:
    generated_at: "2026-05-10T19:55:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a479b2d79ae2710c501d583ad14f913a32382bba8dfd7ec9d25124357743e20
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` คือร่มการตรวจสอบรีลีส เป็นจุดเริ่มต้นแบบแมนนวลเพียงจุดเดียว
สำหรับหลักฐานก่อนรีลีส แต่งานส่วนใหญ่เกิดขึ้นในเวิร์กโฟลว์ลูก เพื่อให้กล่องที่ล้มเหลว
สามารถรันซ้ำได้โดยไม่ต้องเริ่มการรีลีสทั้งหมดใหม่

รันจาก ref ของเวิร์กโฟลว์ที่เชื่อถือได้ โดยปกติคือ `main` และส่งสาขารีลีส,
แท็ก หรือ SHA คอมมิตเต็มเป็น `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

เวิร์กโฟลว์ลูกใช้ ref ของเวิร์กโฟลว์ที่เชื่อถือได้สำหรับฮาร์เนส และใช้
`ref` ที่รับเข้าเป็นอินพุตสำหรับแคนดิเดตที่อยู่ระหว่างทดสอบ วิธีนี้ทำให้ตรรกะการตรวจสอบใหม่
พร้อมใช้งานเมื่อกำลังตรวจสอบสาขารีลีสหรือแท็กที่เก่ากว่า

โดยค่าเริ่มต้น `release_profile=stable` จะรันเลนที่บล็อกการออกรีลีสและข้าม
การแช่ทดสอบแบบสด/Docker ที่ครอบคลุมทั้งหมด ส่ง `run_release_soak=true` เพื่อรวม
เลนแช่ทดสอบในการรัน stable `release_profile=full` จะเปิดใช้เลนแช่ทดสอบเสมอ เพื่อให้
โปรไฟล์คำแนะนำแบบกว้างไม่สูญเสียความครอบคลุมโดยเงียบ

โดยปกติ Package Acceptance จะสร้าง tarball ของแคนดิเดตจาก
`ref` ที่ resolve แล้ว รวมถึงการรันด้วย SHA เต็มที่ dispatch ด้วย `pnpm ci:full-release` หลังจาก
เผยแพร่แล้ว ให้ส่ง `package_acceptance_package_spec=openclaw@YYYY.M.D` (หรือ
`openclaw@beta`/`openclaw@latest`) เพื่อรันเมทริกซ์แพ็กเกจ/อัปเดตเดียวกันกับ
แพ็กเกจ npm ที่จัดส่งแล้วแทน

## สเตจระดับบนสุด

| สเตจ                | รายละเอียด                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การ resolve เป้าหมาย    | **งาน:** `Resolve target ref`<br />**เวิร์กโฟลว์ลูก:** ไม่มี<br />**พิสูจน์:** resolve สาขารีลีส, แท็ก หรือ SHA คอมมิตเต็ม และบันทึกอินพุตที่เลือกไว้<br />**รันซ้ำ:** รันร่มซ้ำหากส่วนนี้ล้มเหลว                                                                                                                                                                                                                               |
| Vitest และ CI ปกติ | **งาน:** `Run normal full CI`<br />**เวิร์กโฟลว์ลูก:** `CI`<br />**พิสูจน์:** กราฟ CI เต็มแบบแมนนวลเทียบกับ ref เป้าหมาย รวมถึงเลน Linux Node, ชาร์ด Plugin ที่บันเดิลมา, สัญญาช่องทาง, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, smoke build, การตรวจเอกสาร, Python skills, Windows, macOS, i18n ของ Control UI และ Android ผ่านร่ม<br />**รันซ้ำ:** `rerun_group=ci`                                                  |
| ก่อนรีลีส Plugin    | **งาน:** `Run plugin prerelease validation`<br />**เวิร์กโฟลว์ลูก:** `Plugin Prerelease`<br />**พิสูจน์:** การตรวจแบบสแตติกสำหรับ Plugin เฉพาะรีลีส, ความครอบคลุม Plugin แบบ agentic, ชาร์ดแบตช์ส่วนขยายเต็ม และเลน Docker ก่อนรีลีสของ Plugin<br />**รันซ้ำ:** `rerun_group=plugin-prerelease`                                                                                                                                                        |
| การตรวจรีลีส       | **งาน:** `Run release/live/Docker/QA validation`<br />**เวิร์กโฟลว์ลูก:** `OpenClaw Release Checks`<br />**พิสูจน์:** smoke install, การตรวจแพ็กเกจข้าม OS, Package Acceptance, ความเท่าเทียมของ QA Lab, Matrix แบบสด และ Telegram แบบสด เมื่อใช้ `run_release_soak=true` หรือ `release_profile=full` จะรันชุดทดสอบแบบสด/E2E ที่ครอบคลุมทั้งหมด และชังก์เส้นทางรีลีสของ Docker ด้วย<br />**รันซ้ำ:** `rerun_group=release-checks` หรือ handle ของ release-checks ที่แคบกว่า |
| อาร์ติแฟกต์แพ็กเกจ     | **งาน:** `Prepare release package artifact`<br />**เวิร์กโฟลว์ลูก:** ไม่มี<br />**พิสูจน์:** สร้าง tarball หลัก `release-package-under-test` ได้เร็วพอสำหรับการตรวจที่เกี่ยวกับแพ็กเกจซึ่งไม่จำเป็นต้องรอ `OpenClaw Release Checks`<br />**รันซ้ำ:** รันร่มซ้ำหรือระบุ `npm_telegram_package_spec` สำหรับ `rerun_group=npm-telegram`                                                                                    |
| แพ็กเกจ Telegram     | **งาน:** `Run package Telegram E2E`<br />**เวิร์กโฟลว์ลูก:** `NPM Telegram Beta E2E`<br />**พิสูจน์:** หลักฐานแพ็กเกจ Telegram ที่อิงอาร์ติแฟกต์หลักสำหรับ `rerun_group=all` พร้อม `release_profile=full` หรือหลักฐาน Telegram ของแพ็กเกจที่เผยแพร่แล้วเมื่อมีการตั้งค่า `npm_telegram_package_spec`<br />**รันซ้ำ:** `rerun_group=npm-telegram` พร้อม `npm_telegram_package_spec`                                                                               |
| ตัวตรวจสอบร่ม    | **งาน:** `Verify full validation`<br />**เวิร์กโฟลว์ลูก:** ไม่มี<br />**พิสูจน์:** ตรวจข้อสรุปของการรันเวิร์กโฟลว์ลูกที่บันทึกไว้อีกครั้ง และผนวกตารางงานที่ช้าที่สุดจากเวิร์กโฟลว์ลูก<br />**รันซ้ำ:** รันเฉพาะงานนี้ซ้ำหลังจากรันเวิร์กโฟลว์ลูกที่ล้มเหลวจนเป็นสีเขียว                                                                                                                                                                                    |

สำหรับ `ref=main` และ `rerun_group=all` ร่มที่ใหม่กว่าจะเข้ามาแทนที่ร่มที่เก่ากว่า
เมื่อ parent ถูกยกเลิก monitor ของมันจะยกเลิกเวิร์กโฟลว์ลูกใด ๆ ที่ dispatch ไปแล้ว
โดยค่าเริ่มต้น การรันตรวจสอบสาขารีลีสและแท็กจะไม่ยกเลิกกันเอง

## สเตจการตรวจรีลีส

`OpenClaw Release Checks` คือเวิร์กโฟลว์ลูกที่ใหญ่ที่สุด มัน resolve เป้าหมาย
หนึ่งครั้ง และเตรียมอาร์ติแฟกต์ `release-package-under-test` ที่ใช้ร่วมกันเมื่อสเตจที่เกี่ยวกับแพ็กเกจ
หรือ Docker ต้องใช้มัน

| ขั้นตอน               | รายละเอียด                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| เป้าหมายการปล่อย      | **งาน:** `Resolve target ref`<br />**เวิร์กโฟลว์ที่รองรับ:** ไม่มี<br />**การทดสอบ:** ref ที่เลือก, SHA ที่คาดไว้แบบไม่บังคับ, โปรไฟล์, กลุ่มการรันซ้ำ และตัวกรองชุดทดสอบ live แบบเจาะจง<br />**รันซ้ำ:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                              |
| อาร์ติแฟกต์แพ็กเกจ    | **งาน:** `Prepare release package artifact`<br />**เวิร์กโฟลว์ที่รองรับ:** ไม่มี<br />**การทดสอบ:** แพ็กหรือแก้ค่า tarball ตัวเลือกหนึ่งรายการ และอัปโหลด `release-package-under-test` สำหรับการตรวจสอบด้านแพ็กเกจขั้นถัดไป<br />**รันซ้ำ:** แพ็กเกจ, cross-OS หรือกลุ่ม live/E2E ที่ได้รับผลกระทบ                                                                                                                                                                                                              |
| Install smoke       | **งาน:** `Run install smoke`<br />**เวิร์กโฟลว์ที่รองรับ:** `Install Smoke`<br />**การทดสอบ:** เส้นทางการติดตั้งเต็มรูปแบบพร้อมการใช้ภาพ smoke ของ Dockerfile รากซ้ำ, การติดตั้งแพ็กเกจ QR, smoke ของ Docker ระดับรากและ Gateway, การทดสอบ Docker ของตัวติดตั้ง, smoke ตัวให้บริการภาพสำหรับการติดตั้ง Bun แบบ global และ E2E การติดตั้ง/ถอนการติดตั้ง Plugin ที่ bundled แบบเร็ว<br />**รันซ้ำ:** `rerun_group=install-smoke`.                                                                                                                                 |
| Cross-OS            | **งาน:** `cross_os_release_checks`<br />**เวิร์กโฟลว์ที่รองรับ:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**การทดสอบ:** เลน fresh และ upgrade บน Linux, Windows และ macOS สำหรับผู้ให้บริการและโหมดที่เลือก โดยใช้ tarball ตัวเลือกพร้อมแพ็กเกจ baseline<br />**รันซ้ำ:** `rerun_group=cross-os`.                                                                                                                                                                                  |
| Repo และ live E2E   | **งาน:** `Run repo/live E2E validation`<br />**เวิร์กโฟลว์ที่รองรับ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**การทดสอบ:** E2E ของ repository, แคช live, OpenAI websocket streaming, shard ผู้ให้บริการ live แบบ native และ Plugin และ harness live ของ model/backend/gateway ที่รองรับด้วย Docker ซึ่งเลือกโดย `release_profile`<br />**การรัน:** `run_release_soak=true`, `release_profile=full` หรือ `rerun_group=live-e2e` แบบเจาะจง<br />**รันซ้ำ:** `rerun_group=live-e2e` พร้อม `live_suite_filter` แบบไม่บังคับ |
| เส้นทางการปล่อย Docker | **งาน:** `Run Docker release-path validation`<br />**เวิร์กโฟลว์ที่รองรับ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**การทดสอบ:** ชิ้นส่วน Docker สำหรับ release-path เทียบกับอาร์ติแฟกต์แพ็กเกจที่ใช้ร่วมกัน<br />**การรัน:** `run_release_soak=true`, `release_profile=full` หรือ `rerun_group=live-e2e` แบบเจาะจง<br />**รันซ้ำ:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **งาน:** `Run package acceptance`<br />**เวิร์กโฟลว์ที่รองรับ:** `Package Acceptance`<br />**การทดสอบ:** fixture แพ็กเกจ Plugin แบบออฟไลน์, การอัปเดต Plugin, package acceptance ของ mock-OpenAI Telegram และการตรวจสอบ published-upgrade survivor เทียบกับ tarball เดียวกัน การตรวจสอบการปล่อยแบบบล็อกใช้ baseline ล่าสุดที่เผยแพร่เป็นค่าเริ่มต้น การตรวจสอบ soak ขยายไปยัง npm release แบบ stable ทุกรายการตั้งแต่ `2026.4.23` เป็นต้นไป พร้อม fixture ของปัญหาที่รายงาน<br />**รันซ้ำ:** `rerun_group=package`.                          |
| QA parity           | **งาน:** `Run QA Lab parity lane` และ `Run QA Lab parity report`<br />**เวิร์กโฟลว์ที่รองรับ:** งานโดยตรง<br />**การทดสอบ:** แพ็ก agentic parity ของตัวเลือกและ baseline จากนั้นเป็นรายงาน parity<br />**รันซ้ำ:** `rerun_group=qa-parity` หรือ `rerun_group=qa`.                                                                                                                                                                                                                                          |
| QA live Matrix      | **งาน:** `Run QA Lab live Matrix lane`<br />**เวิร์กโฟลว์ที่รองรับ:** งานโดยตรง<br />**การทดสอบ:** โปรไฟล์ QA live Matrix แบบเร็วในสภาพแวดล้อม `qa-live-shared`<br />**รันซ้ำ:** `rerun_group=qa-live` หรือ `rerun_group=qa`.                                                                                                                                                                                                                                                                           |
| QA live Telegram    | **งาน:** `Run QA Lab live Telegram lane`<br />**เวิร์กโฟลว์ที่รองรับ:** งานโดยตรง<br />**การทดสอบ:** QA live Telegram พร้อมการเช่าข้อมูลรับรอง Convex CI<br />**รันซ้ำ:** `rerun_group=qa-live` หรือ `rerun_group=qa`.                                                                                                                                                                                                                                                                                       |
| ตัวตรวจสอบการปล่อย    | **งาน:** `Verify release checks`<br />**เวิร์กโฟลว์ที่รองรับ:** ไม่มี<br />**การทดสอบ:** งาน release-check ที่จำเป็นสำหรับกลุ่มการรันซ้ำที่เลือก<br />**รันซ้ำ:** รันซ้ำหลังจากงานลูกแบบเจาะจงผ่านแล้ว                                                                                                                                                                                                                                                                                                    |

## ชิ้นส่วน release-path ของ Docker

ขั้นตอน release-path ของ Docker จะรันชิ้นส่วนเหล่านี้เมื่อ `live_suite_filter`
ว่าง:

| ชิ้นส่วน                                                           | ความครอบคลุม                                                                         |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `core`                                                          | เลน smoke release-path ของ Core Docker                                            |
| `package-update-openai`                                         | พฤติกรรมการติดตั้ง/อัปเดตแพ็กเกจ OpenAI รวมถึงการติดตั้ง Codex แบบ on-demand       |
| `package-update-anthropic`                                      | พฤติกรรมการติดตั้งและอัปเดตแพ็กเกจ Anthropic                                   |
| `package-update-core`                                           | พฤติกรรมของแพ็กเกจและการอัปเดตที่ไม่ขึ้นกับผู้ให้บริการ                                    |
| `plugins-runtime-plugins`                                       | เลน runtime ของ Plugin ที่ทดสอบพฤติกรรม Plugin                              |
| `plugins-runtime-services`                                      | เลน runtime ของ Plugin ที่มี service-backed และ live รวม OpenWebUI เมื่อร้องขอ |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | ชุดการติดตั้ง/runtime ของ Plugin ที่แบ่งสำหรับการตรวจสอบการปล่อยแบบขนาน            |

ใช้ `docker_lanes=<lane[,lane]>` แบบกำหนดเป้าหมายบนเวิร์กโฟลว์ live/E2E แบบ reusable เมื่อ
มีเลน Docker เพียงเลนเดียวที่ล้มเหลว อาร์ติแฟกต์การปล่อยมีคำสั่งรันซ้ำรายเลน
พร้อมอินพุตอาร์ติแฟกต์แพ็กเกจและการใช้ภาพซ้ำเมื่อพร้อมใช้งาน

## โปรไฟล์การปล่อย

`release_profile` ควบคุมความกว้างของ live/provider ภายในการตรวจสอบการปล่อยเป็นหลัก
มันไม่ได้เอา full CI ปกติ, Plugin Prerelease, install smoke, package
acceptance หรือ QA Lab ออก สำหรับ `stable` นั้น E2E แบบ repo/live ที่ครอบคลุมและชิ้นส่วน
release-path ของ Docker เป็นความครอบคลุมแบบ soak และจะรันเมื่อ `run_release_soak=true`
`full` บังคับเปิดความครอบคลุมแบบ soak และยังทำให้การรัน umbrella รัน package Telegram
E2E เทียบกับอาร์ติแฟกต์แพ็กเกจการปล่อยของ parent เมื่อ `rerun_group=all` ดังนั้นตัวเลือก
ก่อนเผยแพร่แบบเต็มจะไม่ข้ามเลนแพ็กเกจ Telegram นั้นอย่างเงียบ ๆ

| โปรไฟล์   | การใช้งานที่ตั้งใจ                      | ความครอบคลุม live/provider ที่รวมอยู่                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | smoke ที่สำคัญต่อการปล่อยและเร็วที่สุด   | เส้นทาง live ของ OpenAI/core, โมเดล live ของ Docker สำหรับ OpenAI, core ของ gateway แบบ native, โปรไฟล์ gateway OpenAI แบบ native, Plugin OpenAI แบบ native และ gateway live Docker OpenAI                     |
| `stable`  | โปรไฟล์อนุมัติการปล่อยเริ่มต้น | `minimum` พร้อม Anthropic smoke, Google, MiniMax, backend, harness ทดสอบ live แบบ native, backend CLI live ของ Docker, Docker ACP bind, Docker Codex harness และ shard smoke ของ OpenCode Go |
| `full`    | การ sweep เชิงคำแนะนำแบบกว้าง             | `stable` พร้อมผู้ให้บริการเชิงคำแนะนำ, shard live ของ Plugin และ shard live ของ media                                                                                                        |

## ส่วนเพิ่มเฉพาะ full

ชุดเหล่านี้จะถูกข้ามโดย `stable` และรวมอยู่ใน `full`:

| พื้นที่                             | ความครอบคลุมเฉพาะ full                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| โมเดล live ของ Docker               | OpenCode Go, OpenRouter, xAI, Z.ai และ Fireworks                                                                          |
| gateway live ของ Docker              | ผู้ให้บริการเชิงคำแนะนำที่แบ่งเป็น shard DeepSeek/Fireworks, OpenCode Go/OpenRouter และ xAI/Z.ai                              |
| โปรไฟล์ผู้ให้บริการ gateway แบบ native | shard Anthropic Opus และ Sonnet/Haiku แบบเต็ม, Fireworks, DeepSeek, shard โมเดล OpenCode Go แบบเต็ม, OpenRouter, xAI และ Z.ai |
| shard live ของ Plugin แบบ native        | Plugins A-K, L-N, O-Z อื่น ๆ, Moonshot และ xAI                                                                             |
| shard live ของ media แบบ native         | Audio, Google music, MiniMax music และกลุ่ม video A-D                                                                   |

`stable` รวม `native-live-src-gateway-profiles-anthropic-smoke` และ
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` ใช้ shard โมเดล
Anthropic และ OpenCode Go ที่กว้างกว่าแทน การรันซ้ำแบบเจาะจงยังสามารถใช้ handle แบบรวม
`native-live-src-gateway-profiles-anthropic` หรือ
`native-live-src-gateway-profiles-opencode-go` ได้

## การรันซ้ำแบบเจาะจง

ใช้ `rerun_group` เพื่อหลีกเลี่ยงการทำซ้ำกล่องการปล่อยที่ไม่เกี่ยวข้อง:

| แฮนเดิล              | ขอบเขต                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | ทุกสเตจของการตรวจสอบรีลีสเต็มรูปแบบ                                   |
| `ci`                | เฉพาะงานลูก CI เต็มรูปแบบแบบแมนนวล                                            |
| `plugin-prerelease` | เฉพาะงานลูกก่อนรีลีสของ Plugin                                         |
| `release-checks`    | ทุกสเตจของการตรวจสอบรีลีส OpenClaw                                   |
| `install-smoke`     | Install Smoke ผ่านการตรวจสอบรีลีส                                 |
| `cross-os`          | การตรวจสอบรีลีสข้ามระบบปฏิบัติการ                                              |
| `live-e2e`          | การตรวจสอบ Repo/live E2E และเส้นทางรีลีส Docker                     |
| `package`           | การยอมรับแพ็กเกจ                                                   |
| `qa`                | ความเท่าเทียมของ QA รวมถึงเลน QA แบบ live                                         |
| `qa-parity`         | เฉพาะเลนความเท่าเทียมของ QA และรายงาน                                      |
| `qa-live`           | เฉพาะ Matrix และ Telegram แบบ live ของ QA                                     |
| `npm-telegram`      | Telegram E2E ของแพ็กเกจที่เผยแพร่แล้ว; ต้องมี `npm_telegram_package_spec` |

ใช้ `live_suite_filter` กับ `rerun_group=live-e2e` เมื่อชุดทดสอบ live หนึ่งชุดล้มเหลว
รหัสตัวกรองที่ใช้ได้ถูกกำหนดไว้ในเวิร์กโฟลว์ live/E2E ที่นำกลับมาใช้ซ้ำได้ รวมถึง
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, และ
`live-codex-harness-docker`

แฮนเดิล `live-gateway-advisory-docker` เป็นแฮนเดิลรันซ้ำแบบรวมสำหรับ
ชาร์ดผู้ให้บริการสามรายการ ดังนั้นจึงยังคงกระจายออกไปยังงาน advisory Docker gateway ทั้งหมด

ใช้ `cross_os_suite_filter` กับ `rerun_group=cross-os` เมื่อเลนข้ามระบบปฏิบัติการหนึ่งเลน
ล้มเหลว ตัวกรองรับรหัส OS, รหัสชุดทดสอบ, หรือคู่ OS/ชุดทดสอบ เช่น
`windows/packaged-upgrade`, `windows`, หรือ `packaged-fresh` สรุปข้ามระบบปฏิบัติการ
มีเวลาต่อเฟสสำหรับเลนอัปเกรดแบบแพ็กเกจ และคำสั่งที่รันนาน
จะพิมพ์บรรทัด Heartbeat เพื่อให้มองเห็นการอัปเดต Windows ที่ค้างอยู่ก่อนที่
งานจะหมดเวลา

เลนตรวจสอบรีลีสของ QA เป็นคำแนะนำ ความล้มเหลวเฉพาะ QA จะถูกรายงานเป็นคำเตือน
และไม่บล็อกตัวตรวจสอบการตรวจสอบรีลีส; รันซ้ำ `rerun_group=qa`,
`qa-parity`, หรือ `qa-live` เมื่อคุณต้องการหลักฐาน QA ใหม่

## หลักฐานที่ต้องเก็บ

เก็บสรุป `Full Release Validation` ไว้เป็นดัชนีระดับรีลีส สรุปนี้ลิงก์
รหัสรันของงานลูกและมีตารางงานที่ช้าที่สุด สำหรับความล้มเหลว ให้ตรวจสอบ
เวิร์กโฟลว์ลูกก่อน จากนั้นรันซ้ำแฮนเดิลที่ตรงกันและเล็กที่สุดด้านบน

อาร์ติแฟกต์ที่มีประโยชน์:

- `release-package-under-test` จากพาเรนต์ Full Release Validation และ `OpenClaw Release Checks`
- อาร์ติแฟกต์เส้นทางรีลีส Docker ภายใต้ `.artifacts/docker-tests/`
- Package Acceptance `package-under-test` และอาร์ติแฟกต์การยอมรับ Docker
- อาร์ติแฟกต์การตรวจสอบรีลีสข้ามระบบปฏิบัติการสำหรับแต่ละ OS และชุดทดสอบ
- อาร์ติแฟกต์ความเท่าเทียมของ QA, Matrix, และ Telegram

## ไฟล์เวิร์กโฟลว์

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
