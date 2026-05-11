---
read_when:
    - การเรียกใช้หรือเรียกใช้อีกครั้งสำหรับการตรวจสอบความถูกต้องของการเผยแพร่แบบเต็ม
    - การเปรียบเทียบโปรไฟล์การตรวจสอบความถูกต้องของรุ่นเผยแพร่แบบเสถียรและแบบเต็ม
    - การดีบักความล้มเหลวในขั้นตอนการตรวจสอบความถูกต้องของรีลีส
summary: ขั้นตอนการตรวจสอบการเผยแพร่แบบเต็ม เวิร์กโฟลว์ย่อย โปรไฟล์การเผยแพร่ แฮนเดิลการรันซ้ำ และหลักฐาน
title: การตรวจสอบความถูกต้องของรีลีสแบบเต็ม
x-i18n:
    generated_at: "2026-05-11T20:37:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d83d15272e4f7cff82ef791c8dbeb6adc447626ada8ae221d074ee16b2cadd5
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` คือชุดครอบคลุมการรีลีส เป็นจุดเข้าด้วยตนเองเพียงจุดเดียวสำหรับหลักฐานก่อนรีลีส แต่งานส่วนใหญ่เกิดขึ้นในเวิร์กโฟลว์ลูก เพื่อให้กล่องที่ล้มเหลวสามารถรันซ้ำได้โดยไม่ต้องเริ่มการรีลีสทั้งหมดใหม่

รันจาก ref ของเวิร์กโฟลว์ที่เชื่อถือได้ โดยปกติคือ `main` และส่งสาขารีลีส แท็ก หรือ SHA คอมมิตแบบเต็มเป็น `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

เวิร์กโฟลว์ลูกใช้ ref ของเวิร์กโฟลว์ที่เชื่อถือได้สำหรับฮาร์เนส และใช้ `ref` อินพุตสำหรับตัวเลือกที่จะทดสอบ วิธีนี้ทำให้ตรรกะการตรวจสอบใหม่พร้อมใช้งานเมื่อกำลังตรวจสอบสาขารีลีสหรือแท็กที่เก่ากว่า

โดยค่าเริ่มต้น `release_profile=stable` จะรันเลนที่บล็อกการรีลีสและข้ามการทดสอบ soak แบบ live/Docker ที่ครอบคลุมทั้งหมด ส่ง `run_release_soak=true` เพื่อรวมเลน soak ในการรันแบบเสถียร `release_profile=full` จะเปิดใช้งานเลน soak เสมอ เพื่อให้โปรไฟล์คำแนะนำแบบกว้างไม่ลดความครอบคลุมลงโดยไม่แจ้งให้ทราบ

การยอมรับแพ็กเกจโดยปกติจะสร้าง tarball ของตัวเลือกจาก `ref` ที่แก้ไขแล้ว รวมถึงการรันด้วย SHA เต็มที่ส่งผ่าน `pnpm ci:full-release` หลังจากเผยแพร่เบต้าแล้ว ให้ส่ง `release_package_spec=openclaw@YYYY.M.D-beta.N` เพื่อนำแพ็กเกจ npm ที่ส่งมอบแล้วกลับมาใช้ซ้ำในการตรวจสอบรีลีส การยอมรับแพ็กเกจ ข้าม OS, Docker เส้นทางรีลีส และแพ็กเกจ Telegram ใช้ `package_acceptance_package_spec` เฉพาะเมื่อการยอมรับแพ็กเกจควรตั้งใจพิสูจน์แพ็กเกจอื่น

## ขั้นตอนระดับบนสุด

| ขั้นตอน                | รายละเอียด                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การแก้ไขเป้าหมาย    | **งาน:** `Resolve target ref`<br />**เวิร์กโฟลว์ลูก:** ไม่มี<br />**พิสูจน์:** แก้ไขสาขารีลีส แท็ก หรือ SHA คอมมิตแบบเต็ม และบันทึกอินพุตที่เลือกไว้<br />**รันซ้ำ:** รันชุดครอบคลุมซ้ำหากขั้นตอนนี้ล้มเหลว                                                                                                                                                                                                                               |
| Vitest และ CI ปกติ | **งาน:** `Run normal full CI`<br />**เวิร์กโฟลว์ลูก:** `CI`<br />**พิสูจน์:** กราฟ CI เต็มแบบแมนนวลกับ ref เป้าหมาย รวมถึงเลน Linux Node, ชาร์ด Plugin ที่รวมมาให้, สัญญาช่องทาง, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, smoke การบิลด์, การตรวจสอบเอกสาร, Skills ของ Python, Windows, macOS, i18n ของ Control UI และ Android ผ่านชุดครอบคลุม<br />**รันซ้ำ:** `rerun_group=ci`.                                                  |
| ก่อนรีลีสของ Plugin    | **งาน:** `Run plugin prerelease validation`<br />**เวิร์กโฟลว์ลูก:** `Plugin Prerelease`<br />**พิสูจน์:** การตรวจสอบสถิติก่อนรีลีสเฉพาะของ Plugin, ความครอบคลุม Plugin แบบ agentic, ชาร์ดชุด extension เต็ม, เลน Docker ก่อนรีลีสของ Plugin และอาร์ติแฟกต์ `plugin-inspector-advisory` แบบไม่บล็อกสำหรับการคัดแยกความเข้ากันได้<br />**รันซ้ำ:** `rerun_group=plugin-prerelease`.                                                                          |
| การตรวจสอบรีลีส       | **งาน:** `Run release/live/Docker/QA validation`<br />**เวิร์กโฟลว์ลูก:** `OpenClaw Release Checks`<br />**พิสูจน์:** smoke การติดตั้ง, การตรวจสอบแพ็กเกจข้าม OS, การยอมรับแพ็กเกจ, ความเท่าเทียมของ QA Lab, Matrix แบบ live และ Telegram แบบ live เมื่อใช้ `run_release_soak=true` หรือ `release_profile=full` จะรันชุด live/E2E ที่ครอบคลุมทั้งหมดและชังก์ Docker เส้นทางรีลีสด้วย<br />**รันซ้ำ:** `rerun_group=release-checks` หรือ handle ของ release-checks ที่แคบกว่า |
| อาร์ติแฟกต์แพ็กเกจ     | **งาน:** `Prepare release package artifact`<br />**เวิร์กโฟลว์ลูก:** ไม่มี<br />**พิสูจน์:** สร้าง tarball `release-package-under-test` ของพาเรนต์เร็วพอสำหรับการตรวจสอบที่หันหน้าไปทางแพ็กเกจซึ่งไม่จำเป็นต้องรอ `OpenClaw Release Checks`<br />**รันซ้ำ:** รันชุดครอบคลุมซ้ำ หรือระบุ `release_package_spec` สำหรับการรันซ้ำด้วยแพ็กเกจที่เผยแพร่แล้ว                                                                                           |
| แพ็กเกจ Telegram     | **งาน:** `Run package Telegram E2E`<br />**เวิร์กโฟลว์ลูก:** `NPM Telegram Beta E2E`<br />**พิสูจน์:** หลักฐานแพ็กเกจ Telegram ที่รองรับด้วยอาร์ติแฟกต์พาเรนต์สำหรับ `rerun_group=all` พร้อม `release_profile=full` หรือหลักฐาน Telegram ของแพ็กเกจที่เผยแพร่แล้วเมื่อมีการตั้งค่า `release_package_spec` หรือ `npm_telegram_package_spec`<br />**รันซ้ำ:** `rerun_group=npm-telegram` พร้อม `release_package_spec` หรือ `npm_telegram_package_spec`.                           |
| ตัวตรวจสอบชุดครอบคลุม    | **งาน:** `Verify full validation`<br />**เวิร์กโฟลว์ลูก:** ไม่มี<br />**พิสูจน์:** ตรวจสอบข้อสรุปของการรันลูกที่บันทึกไว้อีกครั้ง และผนวกตารางงานที่ช้าที่สุดจากเวิร์กโฟลว์ลูก<br />**รันซ้ำ:** รันเฉพาะงานนี้อีกครั้งหลังจากรันลูกที่ล้มเหลวซ้ำจนเป็นสีเขียว                                                                                                                                                                                    |

สำหรับ `ref=main` และ `rerun_group=all` ชุดครอบคลุมที่ใหม่กว่าจะมาแทนที่ชุดที่เก่ากว่า เมื่อพาเรนต์ถูกยกเลิก ตัวมอนิเตอร์ของพาเรนต์จะยกเลิกเวิร์กโฟลว์ลูกใด ๆ ที่ส่งไปแล้ว การรันการตรวจสอบสาขารีลีสและแท็กจะไม่ยกเลิกกันเองโดยค่าเริ่มต้น

## ขั้นตอนการตรวจสอบรีลีส

`OpenClaw Release Checks` เป็นเวิร์กโฟลว์ลูกที่ใหญ่ที่สุด โดยจะแก้ไขเป้าหมายครั้งเดียวและเตรียมอาร์ติแฟกต์ `release-package-under-test` ที่แชร์ เมื่อขั้นตอนที่หันหน้าไปทางแพ็กเกจหรือ Docker ต้องการใช้งาน

| ขั้นตอน               | รายละเอียด                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| เป้าหมายรีลีส      | **งาน:** `Resolve target ref`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**การทดสอบ:** ref ที่เลือก, SHA ที่คาดไว้แบบไม่บังคับ, โปรไฟล์, กลุ่มการเรียกใช้ซ้ำ และตัวกรองชุดทดสอบสดแบบเจาะจง<br />**เรียกใช้ซ้ำ:** `rerun_group=release-checks`                                                                                                                                                                                                                                                                              |
| อาร์ติแฟกต์แพ็กเกจ    | **งาน:** `Prepare release package artifact`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**การทดสอบ:** แพ็กหรือระบุ tarball ผู้สมัครหนึ่งรายการ และอัปโหลด `release-package-under-test` สำหรับการตรวจสอบปลายทางที่เกี่ยวกับแพ็กเกจ<br />**เรียกใช้ซ้ำ:** แพ็กเกจ, กลุ่มข้าม OS หรือกลุ่มสด/E2E ที่ได้รับผลกระทบ                                                                                                                                                                                                              |
| Install smoke       | **งาน:** `Run install smoke`<br />**เวิร์กโฟลว์รองรับ:** `Install Smoke`<br />**การทดสอบ:** เส้นทางติดตั้งเต็มรูปแบบพร้อมการใช้ภาพ smoke ของ Dockerfile รากซ้ำ, การติดตั้งแพ็กเกจ QR, smoke ของ Docker รากและ Gateway, การทดสอบ Docker ของตัวติดตั้ง, smoke ของ provider ภาพสำหรับการติดตั้ง Bun แบบ global และ E2E การติดตั้ง/ถอนการติดตั้ง Plugin ที่บันเดิลมาอย่างรวดเร็ว<br />**เรียกใช้ซ้ำ:** `rerun_group=install-smoke`                                                                                                                                 |
| ข้าม OS            | **งาน:** `cross_os_release_checks`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**การทดสอบ:** เลนติดตั้งใหม่และอัปเกรดบน Linux, Windows และ macOS สำหรับ provider และโหมดที่เลือก โดยใช้ tarball ผู้สมัครพร้อมแพ็กเกจ baseline<br />**เรียกใช้ซ้ำ:** `rerun_group=cross-os`                                                                                                                                                                                  |
| E2E ของ repo และแบบสด   | **งาน:** `Run repo/live E2E validation`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**การทดสอบ:** E2E ของ repository, แคชสด, การสตรีม websocket ของ OpenAI, ชาร์ด provider และ Plugin แบบสด native และ harness ของโมเดล/backend/Gateway แบบสดที่ใช้ Docker ซึ่งเลือกโดย `release_profile`<br />**เรียกใช้เมื่อ:** `run_release_soak=true`, `release_profile=full` หรือ `rerun_group=live-e2e` แบบเจาะจง<br />**เรียกใช้ซ้ำ:** `rerun_group=live-e2e` พร้อม `live_suite_filter` แบบไม่บังคับ |
| เส้นทางรีลีส Docker | **งาน:** `Run Docker release-path validation`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**การทดสอบ:** ชังก์ Docker ของเส้นทางรีลีสเทียบกับอาร์ติแฟกต์แพ็กเกจที่ใช้ร่วมกัน<br />**เรียกใช้เมื่อ:** `run_release_soak=true`, `release_profile=full` หรือ `rerun_group=live-e2e` แบบเจาะจง<br />**เรียกใช้ซ้ำ:** `rerun_group=live-e2e`                                                                                                                                                      |
| การยอมรับแพ็กเกจ  | **งาน:** `Run package acceptance`<br />**เวิร์กโฟลว์รองรับ:** `Package Acceptance`<br />**การทดสอบ:** fixture แพ็กเกจ Plugin แบบออฟไลน์, การอัปเดต Plugin, การยอมรับแพ็กเกจ Telegram แบบ mock-OpenAI และการตรวจสอบผู้รอดจากการอัปเกรดที่เผยแพร่แล้วเทียบกับ tarball เดียวกัน การตรวจสอบรีลีสแบบบล็อกใช้ baseline ที่เผยแพร่ล่าสุดตามค่าเริ่มต้น; การตรวจสอบ soak ขยายให้ครอบคลุมทุกรีลีส npm แบบ stable ตั้งแต่ `2026.4.23` เป็นต้นไป รวมถึง fixture ของปัญหาที่มีการรายงาน<br />**เรียกใช้ซ้ำ:** `rerun_group=package`                          |
| ความสอดคล้องของ QA           | **งาน:** `Run QA Lab parity lane` และ `Run QA Lab parity report`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**การทดสอบ:** แพ็กความสอดคล้องแบบ agentic ของผู้สมัครและ baseline แล้วตามด้วยรายงานความสอดคล้อง<br />**เรียกใช้ซ้ำ:** `rerun_group=qa-parity` หรือ `rerun_group=qa`                                                                                                                                                                                                                                          |
| Matrix สดของ QA      | **งาน:** `Run QA Lab live Matrix lane`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**การทดสอบ:** โปรไฟล์ QA Matrix แบบสดที่รวดเร็วในสภาพแวดล้อม `qa-live-shared`<br />**เรียกใช้ซ้ำ:** `rerun_group=qa-live` หรือ `rerun_group=qa`                                                                                                                                                                                                                                                                           |
| Telegram สดของ QA    | **งาน:** `Run QA Lab live Telegram lane`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**การทดสอบ:** QA Telegram แบบสดพร้อมการเช่าข้อมูลรับรอง Convex CI<br />**เรียกใช้ซ้ำ:** `rerun_group=qa-live` หรือ `rerun_group=qa`                                                                                                                                                                                                                                                                                       |
| ตัวตรวจสอบรีลีส    | **งาน:** `Verify release checks`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**การทดสอบ:** งานตรวจสอบรีลีสที่จำเป็นสำหรับกลุ่มการเรียกใช้ซ้ำที่เลือก<br />**เรียกใช้ซ้ำ:** เรียกใช้ซ้ำหลังจากงานลูกแบบเจาะจงผ่านแล้ว                                                                                                                                                                                                                                                                                                    |

## ชังก์เส้นทางรีลีส Docker

ขั้นตอนเส้นทางรีลีส Docker จะเรียกใช้ชังก์เหล่านี้เมื่อ `live_suite_filter`
ว่าง:

| ชังก์                                                           | ความครอบคลุม                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `core`                                                          | เลน smoke ของเส้นทางรีลีส Docker แกนหลัก                                                             |
| `package-update-openai`                                         | พฤติกรรมการติดตั้ง/อัปเดตแพ็กเกจ OpenAI, การติดตั้ง Codex แบบ on-demand และการเรียกเครื่องมือ Chat Completions |
| `package-update-anthropic`                                      | พฤติกรรมการติดตั้งและอัปเดตแพ็กเกจ Anthropic                                                    |
| `package-update-core`                                           | พฤติกรรมแพ็กเกจและการอัปเดตที่เป็นกลางต่อ provider                                                     |
| `plugins-runtime-plugins`                                       | เลน runtime ของ Plugin ที่ทดสอบพฤติกรรมของ Plugin                                               |
| `plugins-runtime-services`                                      | เลน runtime ของ Plugin ที่ใช้บริการรองรับและแบบสด; รวม OpenWebUI เมื่อมีการร้องขอ                  |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | แบทช์การติดตั้ง/runtime ของ Plugin ที่แบ่งสำหรับการตรวจสอบรีลีสแบบขนาน                             |

ใช้ `docker_lanes=<lane[,lane]>` แบบเจาะจงบนเวิร์กโฟลว์สด/E2E ที่ใช้ซ้ำได้เมื่อ
มีเลน Docker ล้มเหลวเพียงเลนเดียว อาร์ติแฟกต์รีลีสจะรวมคำสั่งเรียกใช้ซ้ำรายเลน
พร้อมอาร์ติแฟกต์แพ็กเกจและอินพุตการใช้ภาพซ้ำเมื่อมี

## โปรไฟล์รีลีส

`release_profile` ควบคุมความครอบคลุมแบบสด/provider ภายในการตรวจสอบรีลีสเป็นหลัก
มันไม่ลบ CI เต็มตามปกติ, Plugin Prerelease, install smoke, การยอมรับแพ็กเกจ
หรือ QA Lab สำหรับ `stable` นั้น E2E แบบ repo/สดอย่างละเอียดและชังก์
เส้นทางรีลีส Docker เป็นความครอบคลุมแบบ soak และจะทำงานเมื่อ `run_release_soak=true`
`full` บังคับเปิดความครอบคลุมแบบ soak และยังทำให้ umbrella เรียกใช้ E2E แพ็กเกจ Telegram
เทียบกับอาร์ติแฟกต์แพ็กเกจรีลีสหลักเมื่อ `rerun_group=all` เพื่อให้ผู้สมัคร
ก่อนเผยแพร่แบบ full ไม่ข้ามเลนแพ็กเกจ Telegram นั้นอย่างเงียบ ๆ

| โปรไฟล์   | การใช้งานที่ตั้งใจ                      | ความครอบคลุมแบบสด/provider ที่รวมไว้                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | smoke ที่สำคัญต่อรีลีสและเร็วที่สุด   | เส้นทางสด OpenAI/core, โมเดลสด Docker สำหรับ OpenAI, แกนหลักของ Gateway native, โปรไฟล์ Gateway OpenAI native, Plugin OpenAI native และ Gateway OpenAI สดของ Docker                     |
| `stable`  | โปรไฟล์อนุมัติรีลีสตามค่าเริ่มต้น | `minimum` รวมกับ Anthropic smoke, Google, MiniMax, backend, harness ทดสอบสด native, backend ของ CLI สดบน Docker, Docker ACP bind, harness Docker Codex และชาร์ด smoke ของ OpenCode Go |
| `full`    | การกวาดตรวจ advisory แบบกว้าง             | `stable` รวมกับ provider advisory, ชาร์ด Plugin แบบสด และชาร์ดสื่อแบบสด                                                                                                        |

## ส่วนเพิ่มเติมเฉพาะ full

ชุดทดสอบเหล่านี้ถูกข้ามโดย `stable` และรวมไว้โดย `full`:

| พื้นที่                             | ความครอบคลุมเฉพาะ full                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| โมเดลสด Docker               | OpenCode Go, OpenRouter, xAI, Z.ai และ Fireworks                                                                          |
| Gateway สด Docker              | provider advisory ที่แบ่งเป็นชาร์ด DeepSeek/Fireworks, OpenCode Go/OpenRouter และ xAI/Z.ai                              |
| โปรไฟล์ provider ของ Gateway native | ชาร์ด Anthropic Opus และ Sonnet/Haiku แบบ full, Fireworks, DeepSeek, ชาร์ดโมเดล OpenCode Go แบบ full, OpenRouter, xAI และ Z.ai |
| ชาร์ด Plugin สด native        | Plugins A-K, L-N, O-Z อื่น ๆ, Moonshot และ xAI                                                                             |
| ชาร์ดสื่อสด native         | กลุ่มเสียง, เพลง Google, เพลง MiniMax และวิดีโอ A-D                                                                   |

`stable` รวม `native-live-src-gateway-profiles-anthropic-smoke` และ
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` ใช้ชาร์ดโมเดล
Anthropic และ OpenCode Go ที่กว้างกว่าแทน การเรียกใช้ซ้ำแบบเจาะจงยังสามารถใช้
handle แบบรวม `native-live-src-gateway-profiles-anthropic` หรือ
`native-live-src-gateway-profiles-opencode-go` ได้

## การเรียกใช้ซ้ำแบบเจาะจง

ใช้ `rerun_group` เพื่อหลีกเลี่ยงการทำซ้ำกล่องรีลีสที่ไม่เกี่ยวข้อง:

| ตัวจัดการ              | ขอบเขต                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | ทุกขั้นตอนของการตรวจสอบความถูกต้องของรีลีสแบบเต็ม                                                             |
| `ci`                | เฉพาะงานย่อย CI เต็มรูปแบบที่เรียกใช้ด้วยตนเอง                                                                      |
| `plugin-prerelease` | เฉพาะงานย่อยก่อนรีลีสของ Plugin                                                                   |
| `release-checks`    | ทุกขั้นตอนของการตรวจสอบรีลีสของ OpenClaw                                                             |
| `install-smoke`     | การทดสอบ Smoke การติดตั้งผ่านการตรวจสอบรีลีส                                                           |
| `cross-os`          | การตรวจสอบรีลีสข้าม OS                                                                        |
| `live-e2e`          | การตรวจสอบความถูกต้องของ E2E แบบสดของ Repo และเส้นทางรีลีสของ Docker                                               |
| `package`           | การยอมรับแพ็กเกจ                                                                             |
| `qa`                | ความเท่าเทียมของ QA รวมถึงเลนสดของ QA                                                                   |
| `qa-parity`         | เฉพาะเลนและรายงานความเท่าเทียมของ QA                                                                |
| `qa-live`           | เฉพาะ Matrix และ Telegram แบบสดของ QA                                                               |
| `npm-telegram`      | Telegram E2E ของแพ็กเกจที่เผยแพร่แล้ว; ต้องใช้ `release_package_spec` หรือ `npm_telegram_package_spec` |

ใช้ `live_suite_filter` กับ `rerun_group=live-e2e` เมื่อชุดทดสอบแบบสดหนึ่งชุดล้มเหลว
รหัสตัวกรองที่ใช้ได้ถูกกำหนดไว้ในเวิร์กโฟลว์แบบสด/E2E ที่ใช้ซ้ำได้ รวมถึง
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` และ
`live-codex-harness-docker`

ตัวจัดการ `live-gateway-advisory-docker` เป็นตัวจัดการการเรียกซ้ำแบบรวมสำหรับ
ชาร์ดผู้ให้บริการสามรายการ ดังนั้นจึงยังคงกระจายไปยังงาน Gateway ของ Docker ด้านคำแนะนำทั้งหมด

ใช้ `cross_os_suite_filter` กับ `rerun_group=cross-os` เมื่อเลนข้าม OS หนึ่งเลน
ล้มเหลว ตัวกรองรับรหัส OS, รหัสชุดทดสอบ หรือคู่ OS/ชุดทดสอบ เช่น
`windows/packaged-upgrade`, `windows` หรือ `packaged-fresh` สรุปข้าม OS
มีเวลาต่อเฟสสำหรับเลนอัปเกรดแบบแพ็กเกจ และคำสั่งที่รันนาน
จะพิมพ์บรรทัด Heartbeat เพื่อให้มองเห็นการอัปเดต Windows ที่ค้างก่อน
งานหมดเวลา

เลนตรวจสอบรีลีสของ QA เป็นคำแนะนำเท่านั้น ความล้มเหลวเฉพาะ QA จะถูกรายงานเป็นคำเตือน
และไม่บล็อกตัวตรวจสอบการตรวจสอบรีลีส; เรียกใช้ `rerun_group=qa`,
`qa-parity` หรือ `qa-live` ซ้ำเมื่อคุณต้องการหลักฐาน QA ใหม่

## หลักฐานที่ต้องเก็บไว้

เก็บสรุป `Full Release Validation` เป็นดัชนีระดับรีลีส ซึ่งเชื่อมโยง
รหัสการรันของงานย่อยและมีตารางงานที่ช้าที่สุด สำหรับความล้มเหลว ให้ตรวจสอบ
เวิร์กโฟลว์ย่อยก่อน แล้วจึงเรียกใช้ตัวจัดการที่ตรงกันและเล็กที่สุดด้านบนซ้ำ

อาร์ติแฟกต์ที่มีประโยชน์:

- `release-package-under-test` จากพาเรนต์การตรวจสอบความถูกต้องของรีลีสแบบเต็มและ `OpenClaw Release Checks`
- อาร์ติแฟกต์เส้นทางรีลีสของ Docker ภายใต้ `.artifacts/docker-tests/`
- `package-under-test` ของการยอมรับแพ็กเกจและอาร์ติแฟกต์การยอมรับ Docker
- อาร์ติแฟกต์การตรวจสอบรีลีสข้าม OS สำหรับแต่ละ OS และชุดทดสอบ
- อาร์ติแฟกต์ความเท่าเทียมของ QA, Matrix และ Telegram

## ไฟล์เวิร์กโฟลว์

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
