---
read_when:
    - การเรียกใช้การตรวจสอบความถูกต้องของการเผยแพร่ฉบับเต็มหรือเรียกใช้ซ้ำ
    - การเปรียบเทียบโปรไฟล์การตรวจสอบความถูกต้องของรีลีสแบบเสถียรและแบบเต็ม
    - การดีบักความล้มเหลวในขั้นตอนการตรวจสอบความถูกต้องของรีลีส
summary: ขั้นตอนการตรวจสอบความถูกต้องของรุ่นเผยแพร่เต็มรูปแบบ, เวิร์กโฟลว์ลูก, โปรไฟล์รุ่นเผยแพร่, ตัวอ้างอิงสำหรับรันซ้ำ, และหลักฐาน
title: การตรวจสอบการเผยแพร่เต็มรูปแบบ
x-i18n:
    generated_at: "2026-05-05T01:49:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cf696761f516fc7f8e9606a2a06fab61a644731330eb484a388f276767a9e0d
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` คือเวิร์กโฟลว์ครอบคลุมสำหรับรีลีส เป็นจุดเข้าใช้งานแบบแมนนวลจุดเดียวสำหรับหลักฐานก่อนรีลีส แต่งานส่วนใหญ่เกิดขึ้นในเวิร์กโฟลว์ลูก เพื่อให้สามารถรันกล่องที่ล้มเหลวซ้ำได้โดยไม่ต้องเริ่มรีลีสทั้งหมดใหม่

รันจาก ref ของเวิร์กโฟลว์ที่เชื่อถือได้ โดยปกติคือ `main` และส่ง release branch, tag หรือ commit SHA เต็มเป็น `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

เวิร์กโฟลว์ลูกใช้ ref ของเวิร์กโฟลว์ที่เชื่อถือได้สำหรับ harness และใช้ input `ref` สำหรับตัวเลือกที่กำลังทดสอบ วิธีนี้ทำให้ตรรกะการตรวจสอบความถูกต้องใหม่พร้อมใช้งานเมื่อกำลังตรวจสอบ release branch หรือ tag ที่เก่ากว่า

โดยค่าเริ่มต้น `release_profile=stable` จะรันเลนที่บล็อกรีลีสและข้าม live/Docker soak แบบครอบคลุม ส่ง `run_release_soak=true` เพื่อรวมเลน soak ในการรัน stable `release_profile=full` จะเปิดใช้เลน soak เสมอ เพื่อให้โปรไฟล์คำแนะนำแบบกว้างไม่ลดความครอบคลุมอย่างเงียบ ๆ

Package Acceptance โดยปกติจะสร้าง tarball ของตัวเลือกจาก `ref` ที่ resolve แล้ว รวมถึงการรันด้วย SHA เต็มที่ dispatch ด้วย `pnpm ci:full-release` หลัง publish ให้ส่ง `package_acceptance_package_spec=openclaw@YYYY.M.D` (หรือ `openclaw@beta`/`openclaw@latest`) เพื่อรันเมทริกซ์ package/update เดียวกันกับแพ็กเกจ npm ที่จัดส่งแล้วแทน

## สเตจระดับบนสุด

| สเตจ                | รายละเอียด                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การ resolve เป้าหมาย    | **งาน:** `Resolve target ref`<br />**เวิร์กโฟลว์ลูก:** ไม่มี<br />**พิสูจน์:** resolve release branch, tag หรือ commit SHA เต็ม และบันทึก input ที่เลือกไว้<br />**รันซ้ำ:** รัน umbrella ซ้ำหากขั้นตอนนี้ล้มเหลว                                                                                                                                                                                                                               |
| Vitest และ CI ปกติ | **งาน:** `Run normal full CI`<br />**เวิร์กโฟลว์ลูก:** `CI`<br />**พิสูจน์:** กราฟ CI แบบเต็มที่รันแมนนวลกับ ref เป้าหมาย รวมถึงเลน Linux Node, shard ของ Plugin ที่ bundled มา, สัญญาของ channel, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, การตรวจสอบ docs, Python skills, Windows, macOS, Control UI i18n และ Android ผ่าน umbrella<br />**รันซ้ำ:** `rerun_group=ci`                                                  |
| Plugin prerelease    | **งาน:** `Run plugin prerelease validation`<br />**เวิร์กโฟลว์ลูก:** `Plugin Prerelease`<br />**พิสูจน์:** การตรวจสอบแบบ static สำหรับ Plugin เฉพาะรีลีส, ความครอบคลุมของ Plugin แบบ agentic, shard ของ extension batch แบบเต็ม และเลน Docker สำหรับ Plugin prerelease<br />**รันซ้ำ:** `rerun_group=plugin-prerelease`                                                                                                                                                        |
| การตรวจสอบรีลีส       | **งาน:** `Run release/live/Docker/QA validation`<br />**เวิร์กโฟลว์ลูก:** `OpenClaw Release Checks`<br />**พิสูจน์:** install smoke, การตรวจสอบแพ็กเกจข้าม OS, Package Acceptance, QA Lab parity, live Matrix และ live Telegram เมื่อใช้ `run_release_soak=true` หรือ `release_profile=full` จะรันชุด live/E2E แบบครอบคลุมและ chunk ของเส้นทางรีลีส Docker ด้วย<br />**รันซ้ำ:** `rerun_group=release-checks` หรือ handle ของ release-checks ที่แคบกว่า |
| package artifact     | **งาน:** `Prepare release package artifact`<br />**เวิร์กโฟลว์ลูก:** ไม่มี<br />**พิสูจน์:** สร้าง tarball `release-package-under-test` ของ parent ให้เร็วพอสำหรับการตรวจสอบด้าน package ที่ไม่จำเป็นต้องรอ `OpenClaw Release Checks`<br />**รันซ้ำ:** รัน umbrella ซ้ำหรือระบุ `npm_telegram_package_spec` สำหรับ `rerun_group=npm-telegram`                                                                                    |
| Package Telegram     | **งาน:** `Run package Telegram E2E`<br />**เวิร์กโฟลว์ลูก:** `NPM Telegram Beta E2E`<br />**พิสูจน์:** หลักฐานแพ็กเกจ Telegram ที่อิง artifact ของ parent สำหรับ `rerun_group=all` พร้อม `release_profile=full` หรือหลักฐาน Telegram ของแพ็กเกจที่ publish แล้วเมื่อกำหนด `npm_telegram_package_spec`<br />**รันซ้ำ:** `rerun_group=npm-telegram` พร้อม `npm_telegram_package_spec`                                                                               |
| ตัวตรวจสอบ umbrella    | **งาน:** `Verify full validation`<br />**เวิร์กโฟลว์ลูก:** ไม่มี<br />**พิสูจน์:** ตรวจสอบ conclusion ของ child run ที่บันทึกไว้อีกครั้ง และเพิ่มตารางงานที่ช้าที่สุดจากเวิร์กโฟลว์ลูก<br />**รันซ้ำ:** รันเฉพาะงานนี้ซ้ำหลังจากรัน child ที่ล้มเหลวซ้ำจนเป็นสีเขียว                                                                                                                                                                                    |

สำหรับ `ref=main` และ `rerun_group=all` umbrella ที่ใหม่กว่าจะ supersede ตัวที่เก่ากว่า เมื่อ parent ถูกยกเลิก monitor ของมันจะยกเลิกเวิร์กโฟลว์ลูกที่ dispatch ไปแล้ว การรันตรวจสอบความถูกต้องของ release branch และ tag จะไม่ยกเลิกกันโดยค่าเริ่มต้น

## สเตจการตรวจสอบรีลีส

`OpenClaw Release Checks` เป็นเวิร์กโฟลว์ลูกที่ใหญ่ที่สุด โดยจะ resolve เป้าหมายหนึ่งครั้งและเตรียม artifact `release-package-under-test` ที่ใช้ร่วมกันเมื่อสเตจที่เกี่ยวกับ package หรือ Docker ต้องการใช้งาน

| สเตจ               | รายละเอียด                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| เป้าหมายรีลีส      | **งาน:** `Resolve target ref`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**การทดสอบ:** ref ที่เลือก, SHA ที่คาดหวังแบบไม่บังคับ, โปรไฟล์, กลุ่มรันซ้ำ และตัวกรองชุดทดสอบสดแบบเจาะจง<br />**รันซ้ำ:** `rerun_group=release-checks`                                                                                                                                                                                                                                                                              |
| อาร์ติแฟกต์แพ็กเกจ    | **งาน:** `Prepare release package artifact`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**การทดสอบ:** แพ็กหรือ resolve tarball ตัวเลือกหนึ่งรายการ แล้วอัปโหลด `release-package-under-test` สำหรับการตรวจสอบปลายทางที่เกี่ยวกับแพ็กเกจ<br />**รันซ้ำ:** กลุ่มแพ็กเกจ, ข้าม OS หรือ live/E2E ที่ได้รับผลกระทบ                                                                                                                                                                                                              |
| การตรวจสอบติดตั้งแบบสั้น       | **งาน:** `Run install smoke`<br />**เวิร์กโฟลว์รองรับ:** `Install Smoke`<br />**การทดสอบ:** เส้นทางติดตั้งเต็มรูปแบบพร้อมการนำอิมเมจ smoke จาก Dockerfile รากกลับมาใช้, การติดตั้งแพ็กเกจ QR, Docker smokes ของรากและ Gateway, การทดสอบ Docker ของตัวติดตั้ง, smoke ของ image-provider สำหรับการติดตั้ง Bun global และ E2E การติดตั้ง/ถอนการติดตั้ง Plugin ที่บันเดิลอย่างรวดเร็ว<br />**รันซ้ำ:** `rerun_group=install-smoke`                                                                                                                                 |
| ข้าม OS            | **งาน:** `cross_os_release_checks`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**การทดสอบ:** เลนติดตั้งใหม่และอัปเกรดบน Linux, Windows และ macOS สำหรับผู้ให้บริการและโหมดที่เลือก โดยใช้ tarball ตัวเลือกพร้อมแพ็กเกจ baseline<br />**รันซ้ำ:** `rerun_group=cross-os`                                                                                                                                                                                  |
| Repo และ E2E สด   | **งาน:** `Run repo/live E2E validation`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**การทดสอบ:** E2E ของที่เก็บ, แคชสด, การสตรีม websocket ของ OpenAI, ชาร์ดผู้ให้บริการสดแบบ native และ Plugin และ harness ของโมเดล/backend/gateway สดที่รองรับด้วย Docker ซึ่งเลือกโดย `release_profile`<br />**รันเมื่อ:** `run_release_soak=true`, `release_profile=full` หรือ `rerun_group=live-e2e` แบบเจาะจง<br />**รันซ้ำ:** `rerun_group=live-e2e` พร้อม `live_suite_filter` ได้ |
| เส้นทางรีลีส Docker | **งาน:** `Run Docker release-path validation`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**การทดสอบ:** ชังก์ Docker ของเส้นทางรีลีสเทียบกับอาร์ติแฟกต์แพ็กเกจที่ใช้ร่วมกัน<br />**รันเมื่อ:** `run_release_soak=true`, `release_profile=full` หรือ `rerun_group=live-e2e` แบบเจาะจง<br />**รันซ้ำ:** `rerun_group=live-e2e`                                                                                                                                                      |
| การยอมรับแพ็กเกจ  | **งาน:** `Run package acceptance`<br />**เวิร์กโฟลว์รองรับ:** `Package Acceptance`<br />**การทดสอบ:** ฟิกซ์เจอร์แพ็กเกจ Plugin แบบออฟไลน์, การอัปเดต Plugin, การยอมรับแพ็กเกจ Telegram แบบ mock-OpenAI และการตรวจสอบการอัปเกรดจากเวอร์ชันเผยแพร่ที่ยังคงอยู่เทียบกับ tarball เดียวกัน การตรวจสอบรีลีสที่บล็อกจะใช้ baseline เวอร์ชันเผยแพร่ล่าสุดตามค่าเริ่มต้น การตรวจสอบ soak ขยายให้ครอบคลุมทุกรีลีส npm เสถียรตั้งแต่ `2026.4.23` เป็นต้นไป พร้อมฟิกซ์เจอร์ประเด็นที่รายงาน<br />**รันซ้ำ:** `rerun_group=package`                          |
| QA parity           | **งาน:** `Run QA Lab parity lane` และ `Run QA Lab parity report`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**การทดสอบ:** แพ็ก agentic parity ของตัวเลือกและ baseline แล้วตามด้วยรายงาน parity<br />**รันซ้ำ:** `rerun_group=qa-parity` หรือ `rerun_group=qa`                                                                                                                                                                                                                                          |
| QA live Matrix      | **งาน:** `Run QA Lab live Matrix lane`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**การทดสอบ:** โปรไฟล์ QA Matrix สดแบบรวดเร็วในสภาพแวดล้อม `qa-live-shared`<br />**รันซ้ำ:** `rerun_group=qa-live` หรือ `rerun_group=qa`                                                                                                                                                                                                                                                                           |
| QA live Telegram    | **งาน:** `Run QA Lab live Telegram lane`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**การทดสอบ:** QA Telegram สดพร้อม lease ข้อมูลประจำตัว Convex CI<br />**รันซ้ำ:** `rerun_group=qa-live` หรือ `rerun_group=qa`                                                                                                                                                                                                                                                                                       |
| ตัวตรวจสอบรีลีส    | **งาน:** `Verify release checks`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**การทดสอบ:** งานตรวจสอบรีลีสที่จำเป็นสำหรับกลุ่มรันซ้ำที่เลือก<br />**รันซ้ำ:** รันซ้ำหลังจากงานลูกแบบเจาะจงผ่านแล้ว                                                                                                                                                                                                                                                                                                    |

## ชังก์ของเส้นทางรีลีส Docker

สเตจเส้นทางรีลีส Docker จะรันชังก์เหล่านี้เมื่อ `live_suite_filter`
ว่าง:

| ชังก์                                                           | ความครอบคลุม                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | เลน smoke ของเส้นทางรีลีส Docker หลัก                                   |
| `package-update-openai`                                         | พฤติกรรมการติดตั้งและอัปเดตแพ็กเกจ OpenAI                             |
| `package-update-anthropic`                                      | พฤติกรรมการติดตั้งและอัปเดตแพ็กเกจ Anthropic                          |
| `package-update-core`                                           | พฤติกรรมแพ็กเกจและการอัปเดตที่ไม่ผูกกับผู้ให้บริการ                           |
| `plugins-runtime-plugins`                                       | เลนรันไทม์ Plugin ที่ทดสอบพฤติกรรมของ Plugin                     |
| `plugins-runtime-services`                                      | เลนรันไทม์ Plugin ที่รองรับด้วยบริการ รวม OpenWebUI เมื่อมีการร้องขอ |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | ชุดการติดตั้ง/รันไทม์ Plugin ที่แบ่งเพื่อการตรวจสอบรีลีสแบบขนาน   |

ใช้ `docker_lanes=<lane[,lane]>` แบบเจาะจงบนเวิร์กโฟลว์ live/E2E ที่นำกลับมาใช้ได้เมื่อ
มีเพียงเลน Docker เดียวที่ล้มเหลว อาร์ติแฟกต์รีลีสมีคำสั่งรันซ้ำต่อเลน
พร้อมอินพุตอาร์ติแฟกต์แพ็กเกจและการนำอิมเมจกลับมาใช้เมื่อมีให้ใช้

## โปรไฟล์รีลีส

`release_profile` ส่วนใหญ่ควบคุมขอบเขต live/provider ภายในการตรวจสอบรีลีส
ไม่ได้ลบ CI เต็มรูปแบบตามปกติ, Plugin Prerelease, install smoke, package
acceptance หรือ QA Lab สำหรับ `stable` นั้น E2E ของ repo/live แบบครอบคลุมและชังก์
เส้นทางรีลีส Docker เป็นความครอบคลุมแบบ soak และจะรันเมื่อ `run_release_soak=true`
`full` บังคับเปิดความครอบคลุมแบบ soak และยังทำให้ umbrella รัน E2E Telegram ของแพ็กเกจ
เทียบกับอาร์ติแฟกต์แพ็กเกจรีลีสพาเรนต์เมื่อ `rerun_group=all` ดังนั้นตัวเลือกก่อนเผยแพร่แบบเต็ม
จะไม่ข้ามเลนแพ็กเกจ Telegram นั้นไปอย่างเงียบ ๆ

| โปรไฟล์   | การใช้งานที่ตั้งใจ                      | ความครอบคลุม live/provider ที่รวมอยู่                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | smoke ที่สำคัญต่อรีลีสและเร็วที่สุด   | เส้นทางสด OpenAI/core, โมเดลสด Docker สำหรับ OpenAI, core ของ native gateway, โปรไฟล์ native OpenAI gateway, Plugin native OpenAI และ Docker live gateway OpenAI                     |
| `stable`  | โปรไฟล์อนุมัติรีลีสเริ่มต้น | `minimum` พร้อม Anthropic smoke, Google, MiniMax, backend, harness การทดสอบสดแบบ native, backend CLI สดบน Docker, การ bind ACP บน Docker, harness Codex บน Docker และชาร์ด smoke ของ OpenCode Go |
| `full`    | การ sweep advisory แบบกว้าง             | `stable` พร้อมผู้ให้บริการ advisory, ชาร์ด Plugin สด และชาร์ดสื่อสด                                                                                                        |

## รายการเพิ่มเติมเฉพาะ full

ชุดเหล่านี้จะถูกข้ามโดย `stable` และรวมอยู่ใน `full`:

| พื้นที่                             | ความครอบคลุมเฉพาะ full                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| โมเดลสด Docker               | OpenCode Go, OpenRouter, xAI, Z.ai และ Fireworks                                                                          |
| Docker live gateway              | ผู้ให้บริการ advisory แยกเป็นชาร์ด DeepSeek/Fireworks, OpenCode Go/OpenRouter และ xAI/Z.ai                              |
| โปรไฟล์ผู้ให้บริการ native gateway | ชาร์ด Anthropic Opus และ Sonnet/Haiku แบบเต็ม, Fireworks, DeepSeek, ชาร์ดโมเดล OpenCode Go แบบเต็ม, OpenRouter, xAI และ Z.ai |
| ชาร์ด Plugin สดแบบ native        | Plugins A-K, L-N, O-Z อื่น ๆ, Moonshot และ xAI                                                                             |
| ชาร์ดสื่อสดแบบ native         | เสียง, เพลง Google, เพลง MiniMax และกลุ่มวิดีโอ A-D                                                                   |

`stable` รวม `native-live-src-gateway-profiles-anthropic-smoke` และ
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` ใช้ชาร์ดโมเดล
Anthropic และ OpenCode Go ที่กว้างกว่าแทน การรันซ้ำแบบเจาะจงยังสามารถใช้
handle รวม `native-live-src-gateway-profiles-anthropic` หรือ
`native-live-src-gateway-profiles-opencode-go` ได้

## การรันซ้ำแบบเจาะจง

ใช้ `rerun_group` เพื่อหลีกเลี่ยงการทำซ้ำกล่องรีลีสที่ไม่เกี่ยวข้อง:

| แฮนเดิล              | ขอบเขต                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | ทุกสเตจของการตรวจสอบรีลีสเต็มรูปแบบ                                   |
| `ci`                | เฉพาะงานลูก CI แบบเต็มที่รันด้วยตนเอง                                 |
| `plugin-prerelease` | เฉพาะงานลูกก่อนรีลีสของ Plugin                                        |
| `release-checks`    | ทุกสเตจของการตรวจสอบรีลีส OpenClaw                                    |
| `install-smoke`     | Install Smoke ผ่านการตรวจสอบรีลีส                                     |
| `cross-os`          | การตรวจสอบรีลีสข้าม OS                                                |
| `live-e2e`          | การตรวจสอบ Repo/live E2E และเส้นทางรีลีส Docker                       |
| `package`           | การยอมรับแพ็กเกจ                                                       |
| `qa`                | QA parity พร้อมเลน QA แบบ live                                        |
| `qa-parity`         | เฉพาะเลน QA parity และรายงาน                                          |
| `qa-live`           | เฉพาะ Matrix และ Telegram ของ QA แบบ live                             |
| `npm-telegram`      | Telegram E2E สำหรับแพ็กเกจที่เผยแพร่แล้ว ต้องใช้ `npm_telegram_package_spec` |

ใช้ `live_suite_filter` กับ `rerun_group=live-e2e` เมื่อชุดทดสอบ live หนึ่งชุดล้มเหลว
รหัสตัวกรองที่ใช้ได้ถูกกำหนดไว้ในเวิร์กโฟลว์ live/E2E ที่ใช้ซ้ำได้ รวมถึง
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, และ
`live-codex-harness-docker`

แฮนเดิล `live-gateway-advisory-docker` เป็นแฮนเดิลรันซ้ำแบบรวมสำหรับชาร์ดผู้ให้บริการสามรายการ
ดังนั้นจึงยังคงกระจายงานไปยังงาน advisory Docker gateway ทั้งหมด

ใช้ `cross_os_suite_filter` กับ `rerun_group=cross-os` เมื่อเลนข้าม OS หนึ่งเลนล้มเหลว
ตัวกรองรับรหัส OS, รหัสชุดทดสอบ หรือคู่ OS/ชุดทดสอบ เช่น
`windows/packaged-upgrade`, `windows`, หรือ `packaged-fresh` สรุปข้าม OS
มีเวลาต่อเฟสสำหรับเลน packaged upgrade และคำสั่งที่รันนาน
จะพิมพ์บรรทัด Heartbeat เพื่อให้เห็นการอัปเดต Windows ที่ค้างอยู่ก่อนที่
งานจะหมดเวลา

เลน QA ของการตรวจสอบรีลีสเป็นเชิงให้คำแนะนำ ความล้มเหลวเฉพาะ QA จะถูกรายงานเป็นคำเตือน
และไม่บล็อกตัวตรวจสอบการตรวจสอบรีลีส ให้รันซ้ำด้วย `rerun_group=qa`,
`qa-parity`, หรือ `qa-live` เมื่อคุณต้องการหลักฐาน QA ใหม่

## หลักฐานที่ควรเก็บ

เก็บสรุป `Full Release Validation` ไว้เป็นดัชนีระดับรีลีส สรุปนี้ลิงก์ไปยัง
รหัสงานลูกและมีตารางงานที่ช้าที่สุด สำหรับความล้มเหลว ให้ตรวจสอบเวิร์กโฟลว์ลูก
ก่อน จากนั้นรันซ้ำด้วยแฮนเดิลที่เล็กที่สุดที่ตรงกับรายการด้านบน

อาร์ติแฟกต์ที่มีประโยชน์:

- `release-package-under-test` จากพาเรนต์ Full Release Validation และ `OpenClaw Release Checks`
- อาร์ติแฟกต์เส้นทางรีลีส Docker ภายใต้ `.artifacts/docker-tests/`
- `package-under-test` ของ Package Acceptance และอาร์ติแฟกต์การยอมรับ Docker
- อาร์ติแฟกต์การตรวจสอบรีลีสข้าม OS สำหรับแต่ละ OS และชุดทดสอบ
- อาร์ติแฟกต์ QA parity, Matrix, และ Telegram

## ไฟล์เวิร์กโฟลว์

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
