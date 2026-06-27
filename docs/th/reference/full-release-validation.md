---
read_when:
    - การเรียกใช้หรือเรียกใช้การตรวจสอบความถูกต้องของรุ่นเต็มอีกครั้ง
    - การเปรียบเทียบโปรไฟล์การตรวจสอบความถูกต้องของรุ่น stable และรุ่นเต็ม
    - การดีบักความล้มเหลวของขั้นตอนการตรวจสอบความถูกต้องของรีลีส
summary: ขั้นตอนการตรวจสอบความถูกต้องของ Full Release, เวิร์กโฟลว์ลูก, โปรไฟล์รีลีส, ตัวจัดการการรันซ้ำ และหลักฐาน
title: การตรวจสอบความถูกต้องของรีลีสเต็มรูปแบบ
x-i18n:
    generated_at: "2026-06-27T18:19:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 791930254e3cac7da101d809cfc9b56773225159574d3727189f67cf85bd3fce
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` คือร่มใหญ่ของการปล่อยรุ่น เป็น entrypoint แบบแมนนวลเพียงจุดเดียว
สำหรับหลักฐานก่อนปล่อยรุ่น แต่งานส่วนใหญ่เกิดขึ้นในเวิร์กโฟลว์ลูก เพื่อให้กล่องที่ล้มเหลว
สามารถรันซ้ำได้โดยไม่ต้องเริ่มการปล่อยรุ่นทั้งหมดใหม่

รันจาก ref ของเวิร์กโฟลว์ที่เชื่อถือได้ โดยปกติคือ `main` และส่ง branch,
tag, หรือ full commit SHA ของรุ่นที่จะปล่อยเป็น `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

เวิร์กโฟลว์ลูกใช้ ref ของเวิร์กโฟลว์ที่เชื่อถือได้สำหรับ harness และใช้ input
`ref` สำหรับ candidate ที่กำลังทดสอบ วิธีนี้ทำให้ตรรกะการตรวจสอบใหม่พร้อมใช้งาน
เมื่อกำลังตรวจสอบ branch หรือ tag ของรุ่นเก่า

`release_profile=stable` และ `release_profile=full` จะรัน live/Docker soak
แบบละเอียดครบถ้วนเสมอ ส่ง `run_release_soak=true` เพื่อรวม soak lanes เดียวกัน
กับโปรไฟล์ beta การเผยแพร่ stable จะปฏิเสธ validation manifest ที่ไม่มี soak นี้
และไม่มีหลักฐาน product-performance ที่เป็นตัวบล็อก

Package Acceptance โดยปกติจะสร้าง tarball ของ candidate จาก `ref` ที่ resolve แล้ว
รวมถึงรันแบบ full-SHA ที่ dispatch ด้วย `pnpm ci:full-release` หลังจากเผยแพร่ beta แล้ว
ให้ส่ง `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` เพื่อใช้แพ็กเกจ npm ที่ส่งมอบแล้ว
ซ้ำใน release checks, Package Acceptance, cross-OS, release-path Docker และ package Telegram
ใช้ `package_acceptance_package_spec` เฉพาะเมื่อ Package Acceptance ควรพิสูจน์แพ็กเกจอื่นโดยเจตนา
lane ของแพ็กเกจ live สำหรับ Plugin Codex จะตามสถานะเดียวกัน: ค่า
`release_package_spec` ที่เผยแพร่แล้วจะ derive `codex_plugin_spec=npm:@openclaw/codex@<version>`;
รันแบบ SHA/artifact จะ pack `extensions/codex` จาก ref ที่เลือก; และผู้ปฏิบัติงาน
สามารถตั้ง `codex_plugin_spec` โดยตรงสำหรับแหล่ง Plugin แบบ `npm:`, `npm-pack:`, หรือ `git:`
lane จะให้การอนุมัติการติดตั้ง Codex CLI แบบชัดเจนที่ Plugin นั้นต้องใช้
จากนั้นรัน Codex CLI preflight และเทิร์นของ agent OpenAI ในเซสชันเดียวกัน

## สเตจระดับบนสุด

| สเตจ                | รายละเอียด                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| การ resolve เป้าหมาย    | **Job:** `Resolve target ref`<br />**เวิร์กโฟลว์ลูก:** ไม่มี<br />**พิสูจน์:** resolve release branch, tag, หรือ full commit SHA และบันทึก input ที่เลือกไว้<br />**รันซ้ำ:** รัน umbrella ซ้ำหากขั้นตอนนี้ล้มเหลว                                                                                                                                                                                                                                             |
| Vitest และ CI ปกติ | **Job:** `Run normal full CI`<br />**เวิร์กโฟลว์ลูก:** `CI`<br />**พิสูจน์:** กราฟ full CI แบบแมนนวลกับ target ref รวมถึง Linux Node lanes, bundled plugin shards, plugin and channel contract shards, ความเข้ากันได้กับ Node 22, `check-*`, `check-additional-*`, smoke checks ของ built-artifact, checks เอกสาร, Python skills, Windows, macOS, Control UI i18n และ Android ผ่าน umbrella<br />**รันซ้ำ:** `rerun_group=ci`                           |
| Plugin prerelease    | **Job:** `Run plugin prerelease validation`<br />**เวิร์กโฟลว์ลูก:** `Plugin Prerelease`<br />**พิสูจน์:** release-only plugin static checks, agentic plugin coverage, full extension batch shards, plugin prerelease Docker lanes และ artifact `plugin-inspector-advisory` แบบไม่บล็อกสำหรับ triage ความเข้ากันได้<br />**รันซ้ำ:** `rerun_group=plugin-prerelease`                                                                                        |
| Release checks       | **Job:** `Run release/live/Docker/QA validation`<br />**เวิร์กโฟลว์ลูก:** `OpenClaw Release Checks`<br />**พิสูจน์:** install smoke, cross-OS package checks, Package Acceptance, QA Lab parity, live Matrix และ live Telegram โปรไฟล์ stable และ full ยังรัน live/E2E suites แบบละเอียดครบถ้วนและ Docker release-path chunks ด้วย; beta สามารถเลือกเปิดใช้ด้วย `run_release_soak=true`<br />**รันซ้ำ:** `rerun_group=release-checks` หรือ handle release-checks ที่แคบกว่า |
| Package Telegram     | **Job:** `Run package Telegram E2E`<br />**เวิร์กโฟลว์ลูก:** `NPM Telegram Beta E2E`<br />**พิสูจน์:** Telegram E2E แบบโฟกัสสำหรับแพ็กเกจที่เผยแพร่แล้วเมื่อมีการตั้ง `release_package_spec` หรือ `npm_telegram_package_spec` การตรวจสอบ candidate แบบเต็มใช้ Package Acceptance Telegram E2E ตาม canonical แทน<br />**รันซ้ำ:** `rerun_group=npm-telegram` พร้อม `release_package_spec` หรือ `npm_telegram_package_spec`                                               |
| ตัวตรวจสอบ umbrella    | **Job:** `Verify full validation`<br />**เวิร์กโฟลว์ลูก:** ไม่มี<br />**พิสูจน์:** ตรวจซ้ำผลสรุปของรันเวิร์กโฟลว์ลูกที่บันทึกไว้ และผนวกตาราง job ที่ช้าที่สุดจากเวิร์กโฟลว์ลูก<br />**รันซ้ำ:** รันเฉพาะ job นี้ซ้ำหลังจากรันเวิร์กโฟลว์ลูกที่ล้มเหลวให้เขียวแล้ว                                                                                                                                                                                                  |

สำหรับ `ref=main` และ `rerun_group=all` umbrella ที่ใหม่กว่าจะ supersede อันเก่า
เมื่อ parent ถูกยกเลิก monitor ของมันจะยกเลิกเวิร์กโฟลว์ลูกใด ๆ ที่ dispatch ไปแล้ว
รันการตรวจสอบ release branch และ tag จะไม่ยกเลิกกันเองโดยค่าเริ่มต้น

## สเตจ Release checks

`OpenClaw Release Checks` เป็นเวิร์กโฟลว์ลูกที่ใหญ่ที่สุด โดย resolve เป้าหมาย
หนึ่งครั้งและเตรียม artifact `release-package-under-test` ที่แชร์ร่วมกันเมื่อสเตจ
ที่เกี่ยวกับแพ็กเกจหรือ Docker ต้องใช้

| ขั้นตอน               | รายละเอียด                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| เป้าหมายรีลีส      | **งาน:** `Resolve target ref`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**การทดสอบ:** ref ที่เลือก, SHA ที่คาดไว้ซึ่งเป็นทางเลือก, โปรไฟล์, กลุ่มการรันซ้ำ, และตัวกรองชุดทดสอบสดแบบเจาะจง<br />**รันซ้ำ:** `rerun_group=release-checks`                                                                                                                                                                                                                                                                              |
| อาร์ติแฟกต์แพ็กเกจ    | **งาน:** `Prepare release package artifact`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**การทดสอบ:** แพ็กหรือ resolve tarball ผู้สมัครหนึ่งรายการ แล้วอัปโหลด `release-package-under-test` สำหรับการตรวจสอบปลายน้ำที่เกี่ยวกับแพ็กเกจ<br />**รันซ้ำ:** กลุ่มแพ็กเกจ, ข้ามระบบปฏิบัติการ, หรือ live/E2E ที่ได้รับผลกระทบ                                                                                                                                                                                                              |
| ควันทดสอบการติดตั้ง       | **งาน:** `Run install smoke`<br />**เวิร์กโฟลว์รองรับ:** `Install Smoke`<br />**การทดสอบ:** เส้นทางการติดตั้งเต็มรูปแบบพร้อมการนำอิมเมจควันทดสอบ Dockerfile รากกลับมาใช้, การติดตั้งแพ็กเกจ QR, ควันทดสอบ Docker ของรากและ Gateway, การทดสอบ Docker ของตัวติดตั้ง, ควันทดสอบ Bun global install image-provider, และ E2E การติดตั้ง/ถอนการติดตั้ง bundled-Plugin แบบเร็ว<br />**รันซ้ำ:** `rerun_group=install-smoke`                                                                                                                                 |
| ข้ามระบบปฏิบัติการ            | **งาน:** `cross_os_release_checks`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**การทดสอบ:** เลนแบบสดใหม่และอัปเกรดบน Linux, Windows, และ macOS สำหรับผู้ให้บริการและโหมดที่เลือก โดยใช้ tarball ผู้สมัครร่วมกับแพ็กเกจ baseline<br />**รันซ้ำ:** `rerun_group=cross-os`                                                                                                                                                                                  |
| E2E ของ repo และแบบสด   | **งาน:** `Run repo/live E2E validation`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**การทดสอบ:** E2E ของ repository, แคชสด, การสตรีม websocket ของ OpenAI, ชาร์ดผู้ให้บริการและ Plugin แบบ native live, และ harness ของโมเดล/backend/gateway แบบสดที่รองรับด้วย Docker ซึ่งเลือกโดย `release_profile`<br />**รัน:** `run_release_soak=true`, `release_profile=full`, หรือ `rerun_group=live-e2e` แบบเจาะจง<br />**รันซ้ำ:** `rerun_group=live-e2e`, พร้อม `live_suite_filter` ได้ตามต้องการ |
| เส้นทางรีลีส Docker | **งาน:** `Run Docker release-path validation`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**การทดสอบ:** ชังก์ Docker ของเส้นทางรีลีสเทียบกับอาร์ติแฟกต์แพ็กเกจที่ใช้ร่วมกัน<br />**รัน:** `run_release_soak=true`, `release_profile=full`, หรือ `rerun_group=live-e2e` แบบเจาะจง<br />**รันซ้ำ:** `rerun_group=live-e2e`                                                                                                                                                      |
| การยอมรับแพ็กเกจ  | **งาน:** `Run package acceptance`<br />**เวิร์กโฟลว์รองรับ:** `Package Acceptance`<br />**การทดสอบ:** fixture แพ็กเกจ Plugin แบบออฟไลน์, การอัปเดต Plugin, E2E แพ็กเกจ mock-OpenAI Telegram แบบ canonical, และการตรวจสอบการอยู่รอดของ published-upgrade เทียบกับ tarball เดียวกัน การตรวจสอบรีลีสแบบบล็อกใช้ baseline เผยแพร่ล่าสุดตามค่าเริ่มต้น; การตรวจสอบแบบ soak ขยายเป็นทุกรีลีส npm แบบ stable ตั้งแต่ `2026.4.23` เป็นต้นไป รวมถึง fixture ของปัญหาที่รายงาน<br />**รันซ้ำ:** `rerun_group=package`                   |
| ความเท่าเทียม QA           | **งาน:** `Run QA Lab parity lane` และ `Run QA Lab parity report`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**การทดสอบ:** แพ็ก parity แบบ agentic ของผู้สมัครและ baseline แล้วตามด้วยรายงาน parity<br />**รันซ้ำ:** `rerun_group=qa-parity` หรือ `rerun_group=qa`                                                                                                                                                                                                                                          |
| Matrix แบบสดของ QA      | **งาน:** `Run QA Lab live Matrix lane`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**การทดสอบ:** โปรไฟล์ QA Matrix แบบสดและเร็วในสภาพแวดล้อม `qa-live-shared`<br />**รันซ้ำ:** `rerun_group=qa-live` หรือ `rerun_group=qa`                                                                                                                                                                                                                                                                           |
| Telegram แบบสดของ QA    | **งาน:** `Run QA Lab live Telegram lane`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**การทดสอบ:** QA Telegram แบบสดด้วยการเช่าข้อมูลรับรอง Convex CI<br />**รันซ้ำ:** `rerun_group=qa-live` หรือ `rerun_group=qa`                                                                                                                                                                                                                                                                                       |
| ตัวตรวจสอบรีลีส    | **งาน:** `Verify release checks`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**การทดสอบ:** งาน release-check ที่จำเป็นสำหรับกลุ่มการรันซ้ำที่เลือก<br />**รันซ้ำ:** รันซ้ำหลังจากงานลูกแบบเจาะจงผ่าน                                                                                                                                                                                                                                                                                                    |

## ชังก์เส้นทางรีลีส Docker

ขั้นตอนเส้นทางรีลีส Docker จะรันชังก์เหล่านี้เมื่อ `live_suite_filter`
ว่างเปล่า:

| ชังก์                                                           | ความครอบคลุม                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | เลนควันทดสอบเส้นทางรีลีส Docker หลัก                                                                                      |
| `package-update-openai`                                         | พฤติกรรมการติดตั้ง/อัปเดตแพ็กเกจ OpenAI, การติดตั้ง Codex ตามต้องการ, เทิร์นสดของ Codex Plugin, และการเรียกเครื่องมือ Chat Completions |
| `package-update-anthropic`                                      | พฤติกรรมการติดตั้งและอัปเดตแพ็กเกจ Anthropic                                                                             |
| `package-update-core`                                           | พฤติกรรมแพ็กเกจและการอัปเดตที่ไม่ผูกกับผู้ให้บริการ                                                                              |
| `plugins-runtime-plugins`                                       | เลน runtime ของ Plugin ที่ทดสอบพฤติกรรม Plugin                                                                        |
| `plugins-runtime-services`                                      | เลน runtime ของ Plugin ที่รองรับด้วยบริการและแบบสด; รวม OpenWebUI เมื่อมีการร้องขอ                                           |
| `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` | ชุดการติดตั้ง/runtime ของ Plugin ที่แบ่งเพื่อการตรวจสอบรีลีสแบบขนาน                                                      |

ใช้ `docker_lanes=<lane[,lane]>` แบบเจาะจงบนเวิร์กโฟลว์ live/E2E ที่ใช้ซ้ำได้เมื่อ
มีเลน Docker เพียงเลนเดียวที่ล้มเหลว อาร์ติแฟกต์รีลีสมีคำสั่งรันซ้ำแยกตามเลน
พร้อมอินพุตสำหรับอาร์ติแฟกต์แพ็กเกจและการนำอิมเมจกลับมาใช้เมื่อมีให้ใช้งาน

## โปรไฟล์รีลีส

`release_profile` ควบคุมขอบเขต live/provider ภายในการตรวจสอบรีลีสเป็นหลัก
ไม่ได้ลบ CI เต็มรูปแบบปกติ, ก่อนรีลีส Plugin, ควันทดสอบการติดตั้ง, การยอมรับ
แพ็กเกจ, หรือ QA Lab โปรไฟล์ stable และ full จะรัน repo/live
E2E แบบละเอียดครบถ้วนและความครอบคลุม soak ของเส้นทางรีลีส Docker เสมอ โปรไฟล์ beta สามารถเลือกเข้าร่วมได้ด้วย
`run_release_soak=true` การยอมรับแพ็กเกจให้ E2E Telegram ของแพ็กเกจแบบ canonical
สำหรับผู้สมัครแบบเต็มทุกรายการ ดังนั้น umbrella จึงไม่ทำซ้ำ live poller นั้น

| โปรไฟล์   | การใช้งานที่ตั้งใจ                      | ความครอบคลุม live/provider ที่รวมอยู่                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | ควันทดสอบที่สำคัญต่อรีลีสและเร็วที่สุด   | เส้นทาง live ของ OpenAI/core, โมเดล live ของ Docker สำหรับ OpenAI, gateway หลักแบบ native, โปรไฟล์ gateway OpenAI แบบ native, Plugin OpenAI แบบ native, และ gateway OpenAI แบบ live ของ Docker                     |
| `stable`  | โปรไฟล์อนุมัติรีลีสเริ่มต้น | `minimum` รวมถึงควันทดสอบ Anthropic, Google, MiniMax, backend, harness การทดสอบ native live, backend CLI แบบ live ของ Docker, bind ACP ของ Docker, harness Codex ของ Docker, และชาร์ดควันทดสอบ OpenCode Go |
| `full`    | การกวาดตรวจ advisory แบบกว้าง             | `stable` รวมถึงผู้ให้บริการ advisory, ชาร์ด live ของ Plugin, และชาร์ด live ของสื่อ                                                                                                        |

## ส่วนเพิ่มเติมสำหรับ full เท่านั้น

ชุดทดสอบเหล่านี้ถูกข้ามโดย `stable` และรวมอยู่ใน `full`:

| พื้นที่                             | ความครอบคลุมเฉพาะ full                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| โมเดล live ของ Docker               | OpenCode Go, OpenRouter, xAI, Z.ai, และ Fireworks                                                                          |
| gateway live ของ Docker              | ผู้ให้บริการ advisory ที่แบ่งเป็นชาร์ด DeepSeek/Fireworks, OpenCode Go/OpenRouter, และ xAI/Z.ai                              |
| โปรไฟล์ผู้ให้บริการ gateway แบบ native | ชาร์ด Anthropic Opus และ Sonnet/Haiku แบบเต็ม, Fireworks, DeepSeek, ชาร์ดโมเดล OpenCode Go แบบเต็ม, OpenRouter, xAI, และ Z.ai |
| ชาร์ด live ของ Plugin แบบ native        | Plugins A-K, L-N, O-Z อื่นๆ, Moonshot, และ xAI                                                                             |
| ชาร์ด live ของสื่อแบบ native         | กลุ่มเสียง, เพลง Google, เพลง MiniMax, และวิดีโอ A-D                                                                   |

`stable` รวม `native-live-src-gateway-profiles-anthropic-smoke` และ
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` ใช้ชาร์ดโมเดล
Anthropic และ OpenCode Go ที่กว้างกว่าแทน การรันซ้ำแบบเจาะจงยังสามารถใช้
handle รวม `native-live-src-gateway-profiles-anthropic` หรือ
`native-live-src-gateway-profiles-opencode-go` ได้

## การรันซ้ำแบบเจาะจง

ใช้ `rerun_group` เพื่อหลีกเลี่ยงการรันกล่องรีลีสที่ไม่เกี่ยวข้องซ้ำ:

| แฮนเดิล            | ขอบเขต                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | ทุกขั้นตอนของ Full Release Validation                                                            |
| `ci`                | เฉพาะลูก Manual full CI เท่านั้น                                                                  |
| `plugin-prerelease` | เฉพาะลูก Plugin Prerelease เท่านั้น                                                              |
| `release-checks`    | ทุกขั้นตอนของ OpenClaw Release Checks                                                            |
| `install-smoke`     | Install Smoke ผ่าน release checks                                                                 |
| `cross-os`          | การตรวจสอบรีลีสข้ามระบบปฏิบัติการ                                                                |
| `live-e2e`          | การตรวจสอบ Repo/live E2E และเส้นทางรีลีส Docker                                                   |
| `package`           | Package Acceptance                                                                                |
| `qa`                | QA parity รวมถึงเลน QA live                                                                       |
| `qa-parity`         | เฉพาะเลนและรายงาน QA parity                                                                      |
| `qa-live`           | QA live Matrix/Telegram รวมถึงเลน Discord, WhatsApp และ Slack ที่มีเกต เมื่อเปิดใช้งาน           |
| `npm-telegram`      | E2E ของ Telegram สำหรับแพ็กเกจที่เผยแพร่แล้ว ต้องมี `release_package_spec` หรือ `npm_telegram_package_spec` |

ใช้ `live_suite_filter` ร่วมกับ `rerun_group=live-e2e` เมื่อชุด live หนึ่งชุดล้มเหลว
รหัสตัวกรองที่ใช้ได้ถูกกำหนดไว้ในเวิร์กโฟลว์ live/E2E ที่นำกลับมาใช้ซ้ำได้ ซึ่งรวมถึง
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` และ
`live-codex-harness-docker`

แฮนเดิล `live-gateway-advisory-docker` เป็นแฮนเดิลรันซ้ำแบบรวมสำหรับชาร์ดผู้ให้บริการสามรายการของมัน
ดังนั้นยังคงกระจายงานไปยังงาน advisory Docker gateway ทั้งหมด

ใช้ `cross_os_suite_filter` ร่วมกับ `rerun_group=cross-os` เมื่อเลนข้ามระบบปฏิบัติการหนึ่งเลน
ล้มเหลว ตัวกรองรับรหัส OS, รหัสชุดทดสอบ หรือคู่ OS/ชุดทดสอบ เช่น
`windows/packaged-upgrade`, `windows` หรือ `packaged-fresh` สรุป Cross-OS
มีเวลาต่อเฟสสำหรับเลน packaged upgrade และคำสั่งที่รันนาน
จะพิมพ์บรรทัด Heartbeat เพื่อให้เห็นการอัปเดต Windows ที่ค้างอยู่ก่อน
งานหมดเวลา

ความล้มเหลวของ QA release-check จะบล็อกการตรวจสอบรีลีสปกติ การ drift ของ dynamic tool ของ OpenClaw
ที่จำเป็นในเทียร์มาตรฐานจะบล็อกตัวตรวจสอบ release-check เช่นกัน
การรัน Tideclaw alpha อาจยังถือว่าเลน release-check ที่ไม่ใช่ package-safety เป็น
advisory ได้ เมื่อ `live_suite_filter` ร้องขอเลน QA live ที่มีเกตอย่างชัดเจน เช่น
Discord, WhatsApp หรือ Slack ตัวแปร repo
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` ที่ตรงกันต้องเปิดใช้งาน มิฉะนั้น
การจับอินพุตจะล้มเหลวแทนที่จะข้ามเลนนั้นอย่างเงียบ ๆ รัน `rerun_group=qa`,
`qa-parity` หรือ `qa-live` ซ้ำเมื่อคุณต้องการหลักฐาน QA ใหม่

## หลักฐานที่ควรเก็บ

เก็บสรุป `Full Release Validation` ไว้เป็นดัชนีระดับรีลีส สรุปนี้ลิงก์
รหัสการรันลูกและมีตารางงานที่ช้าที่สุด สำหรับความล้มเหลว ให้ตรวจสอบเวิร์กโฟลว์ลูก
ก่อน แล้วจึงรันแฮนเดิลที่ตรงกันและเล็กที่สุดด้านบนซ้ำ

อาร์ติแฟกต์ที่มีประโยชน์:

- `release-package-under-test` จาก `OpenClaw Release Checks`
- อาร์ติแฟกต์เส้นทางรีลีส Docker ภายใต้ `.artifacts/docker-tests/`
- `package-under-test` ของ Package Acceptance และอาร์ติแฟกต์การยอมรับ Docker
- อาร์ติแฟกต์ release-check ข้ามระบบปฏิบัติการสำหรับแต่ละ OS และชุดทดสอบ
- อาร์ติแฟกต์ QA parity, Matrix และ Telegram

## ไฟล์เวิร์กโฟลว์

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
