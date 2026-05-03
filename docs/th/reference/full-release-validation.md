---
read_when:
    - การเรียกใช้หรือเรียกใช้การตรวจสอบรีลีสแบบเต็มอีกครั้ง
    - การเปรียบเทียบโปรไฟล์การตรวจสอบความถูกต้องของรีลีสแบบเสถียรและแบบเต็ม
    - การดีบักความล้มเหลวในขั้นตอนการตรวจสอบความถูกต้องของรีลีส
summary: ขั้นตอนการตรวจสอบรีลีสแบบเต็ม เวิร์กโฟลว์ย่อย โปรไฟล์รีลีส แฮนเดิลการรันซ้ำ และหลักฐาน
title: การตรวจสอบความถูกต้องของรีลีสแบบเต็ม
x-i18n:
    generated_at: "2026-05-03T21:36:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 038901ad751c00b35f69d7ec5caf74e577dcf2350d7658037c3ecc9ff5fab6d7
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` คือร่มการเผยแพร่ เป็นจุดเข้าใช้งานแบบแมนนวลเพียงจุดเดียวสำหรับหลักฐานก่อนเผยแพร่ แต่งานส่วนใหญ่เกิดขึ้นในเวิร์กโฟลว์ลูก เพื่อให้กล่องที่ล้มเหลวสามารถรันซ้ำได้โดยไม่ต้องเริ่มการเผยแพร่ทั้งหมดใหม่

รันจาก ref ของเวิร์กโฟลว์ที่เชื่อถือได้ โดยปกติคือ `main` และส่งสาขาเผยแพร่ แท็ก หรือ SHA ของคอมมิตแบบเต็มเป็น `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

เวิร์กโฟลว์ลูกใช้ ref ของเวิร์กโฟลว์ที่เชื่อถือได้สำหรับชุดทดสอบ และใช้ `ref` ขาเข้าสำหรับแคนดิเดตที่อยู่ระหว่างทดสอบ วิธีนี้ทำให้ตรรกะการตรวจสอบใหม่พร้อมใช้งานเมื่อกำลังตรวจสอบสาขาเผยแพร่หรือแท็กที่เก่ากว่า

โดยปกติ Package Acceptance จะสร้าง tarball ของแคนดิเดตจาก `ref` ที่แก้ค่าแล้ว รวมถึงการรัน SHA แบบเต็มที่ dispatch ด้วย `pnpm ci:full-release` หลังเผยแพร่ ให้ส่ง `package_acceptance_package_spec=openclaw@YYYY.M.D` (หรือ `openclaw@beta`/`openclaw@latest`) เพื่อรันเมทริกซ์แพ็กเกจ/อัปเดตเดียวกันกับแพ็กเกจ npm ที่เผยแพร่แล้วแทน

## ขั้นตอนระดับบน

| ขั้นตอน                | รายละเอียด                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การแก้ค่าเป้าหมาย    | **งาน:** `Resolve target ref`<br />**เวิร์กโฟลว์ลูก:** ไม่มี<br />**พิสูจน์:** แก้ค่าสาขาเผยแพร่ แท็ก หรือ SHA ของคอมมิตแบบเต็ม และบันทึกอินพุตที่เลือกไว้<br />**รันซ้ำ:** รันร่มซ้ำหากขั้นตอนนี้ล้มเหลว                                                                                                                                                                              |
| Vitest และ CI ปกติ | **งาน:** `Run normal full CI`<br />**เวิร์กโฟลว์ลูก:** `CI`<br />**พิสูจน์:** กราฟ CI เต็มแบบแมนนวลเทียบกับ ref เป้าหมาย รวมถึงเลน Linux Node, ชาร์ด Plugin ที่บันเดิลมา, สัญญาของช่องทาง, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, smoke การบิลด์, การตรวจเอกสาร, Python skills, Windows, macOS, Control UI i18n และ Android ผ่านร่ม<br />**รันซ้ำ:** `rerun_group=ci` |
| Plugin ก่อนเผยแพร่    | **งาน:** `Run plugin prerelease validation`<br />**เวิร์กโฟลว์ลูก:** `Plugin Prerelease`<br />**พิสูจน์:** การตรวจแบบสแตติกสำหรับ Plugin เฉพาะการเผยแพร่, ความครอบคลุม Plugin แบบ agentic, ชาร์ดชุดส่วนขยายเต็ม และเลน Docker สำหรับ Plugin ก่อนเผยแพร่<br />**รันซ้ำ:** `rerun_group=plugin-prerelease`                                                                                                       |
| การตรวจการเผยแพร่       | **งาน:** `Run release/live/Docker/QA validation`<br />**เวิร์กโฟลว์ลูก:** `OpenClaw Release Checks`<br />**พิสูจน์:** install smoke, การตรวจแพ็กเกจข้าม OS, ชุด live/E2E, ส่วนย่อยเส้นทางเผยแพร่ Docker, Package Acceptance, QA Lab parity, Matrix แบบ live และ Telegram แบบ live<br />**รันซ้ำ:** `rerun_group=release-checks` หรือ handle ของ release-checks ที่แคบกว่า                                |
| อาร์ติแฟกต์แพ็กเกจ     | **งาน:** `Prepare release package artifact`<br />**เวิร์กโฟลว์ลูก:** ไม่มี<br />**พิสูจน์:** สร้าง tarball หลัก `release-package-under-test` เร็วพอสำหรับการตรวจที่เกี่ยวกับแพ็กเกจซึ่งไม่ต้องรอ `OpenClaw Release Checks`<br />**รันซ้ำ:** รันร่มซ้ำ หรือระบุ `npm_telegram_package_spec` สำหรับ `rerun_group=npm-telegram`                                   |
| แพ็กเกจ Telegram     | **งาน:** `Run package Telegram E2E`<br />**เวิร์กโฟลว์ลูก:** `NPM Telegram Beta E2E`<br />**พิสูจน์:** หลักฐานแพ็กเกจ Telegram ที่รองรับด้วยอาร์ติแฟกต์หลักสำหรับ `rerun_group=all` พร้อม `release_profile=full` หรือหลักฐาน Telegram ของแพ็กเกจที่เผยแพร่แล้วเมื่อมีการตั้งค่า `npm_telegram_package_spec`<br />**รันซ้ำ:** `rerun_group=npm-telegram` พร้อม `npm_telegram_package_spec`                              |
| ตัวตรวจสอบร่ม    | **งาน:** `Verify full validation`<br />**เวิร์กโฟลว์ลูก:** ไม่มี<br />**พิสูจน์:** ตรวจสอบผลสรุปของการรันลูกที่บันทึกไว้อีกครั้ง และผนวกตารางงานที่ช้าที่สุดจากเวิร์กโฟลว์ลูก<br />**รันซ้ำ:** รันซ้ำเฉพาะงานนี้หลังรันลูกที่ล้มเหลวซ้ำจนผ่าน                                                                                                                                   |

สำหรับ `ref=main` และ `rerun_group=all` ร่มที่ใหม่กว่าจะ supersede ร่มที่เก่ากว่า เมื่อ parent ถูกยกเลิก monitor ของมันจะยกเลิกเวิร์กโฟลว์ลูกใดๆ ที่ dispatch ไปแล้ว การรันตรวจสอบสาขาเผยแพร่และแท็กจะไม่ยกเลิกกันเองตามค่าเริ่มต้น

## ขั้นตอนการตรวจการเผยแพร่

`OpenClaw Release Checks` เป็นเวิร์กโฟลว์ลูกที่ใหญ่ที่สุด มันแก้ค่าเป้าหมายหนึ่งครั้งและเตรียมอาร์ติแฟกต์ `release-package-under-test` ที่ใช้ร่วมกัน เมื่อขั้นตอนที่เกี่ยวกับแพ็กเกจหรือ Docker ต้องใช้

| ขั้นตอน               | รายละเอียด                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| เป้าหมายการเผยแพร่      | **งาน:** `Resolve target ref`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**ทดสอบ:** ref ที่เลือก, SHA ที่คาดหวังซึ่งเป็นทางเลือก, โปรไฟล์, กลุ่มรันซ้ำ และตัวกรองชุด live แบบเจาะจง<br />**รันซ้ำ:** `rerun_group=release-checks`                                                                                                                                                                           |
| อาร์ติแฟกต์แพ็กเกจ    | **งาน:** `Prepare release package artifact`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**ทดสอบ:** แพ็กหรือแก้ค่า tarball แคนดิเดตหนึ่งรายการ และอัปโหลด `release-package-under-test` สำหรับการตรวจ downstream ที่เกี่ยวกับแพ็กเกจ<br />**รันซ้ำ:** กลุ่มแพ็กเกจ ข้าม OS หรือ live/E2E ที่ได้รับผลกระทบ                                                                                                           |
| Install smoke       | **งาน:** `Run install smoke`<br />**เวิร์กโฟลว์รองรับ:** `Install Smoke`<br />**ทดสอบ:** เส้นทางติดตั้งเต็มพร้อมการใช้ smoke image ของ Dockerfile รากซ้ำ, การติดตั้งแพ็กเกจ QR, smoke ของ Docker สำหรับรากและ Gateway, การทดสอบ Docker ของตัวติดตั้ง, smoke image-provider ของการติดตั้งแบบ global ด้วย Bun และ E2E การติดตั้ง/ถอนการติดตั้ง Plugin ที่บันเดิลมาแบบเร็ว<br />**รันซ้ำ:** `rerun_group=install-smoke`                              |
| ข้าม OS            | **งาน:** `cross_os_release_checks`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**ทดสอบ:** เลนสดใหม่และเลนอัปเกรดบน Linux, Windows และ macOS สำหรับผู้ให้บริการและโหมดที่เลือก โดยใช้ tarball แคนดิเดตรวมกับแพ็กเกจ baseline<br />**รันซ้ำ:** `rerun_group=cross-os`                                                                               |
| Repo และ live E2E   | **งาน:** `Run repo/live E2E validation`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**ทดสอบ:** repository E2E, แคช live, การสตรีม websocket ของ OpenAI, ผู้ให้บริการ live แบบ native และชาร์ด Plugin รวมถึงชุดทดสอบ model/backend/gateway แบบ live ที่รองรับด้วย Docker ซึ่งเลือกโดย `release_profile`<br />**รันซ้ำ:** `rerun_group=live-e2e` พร้อม `live_suite_filter` ได้ตามต้องการ |
| เส้นทางเผยแพร่ Docker | **งาน:** `Run Docker release-path validation`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**ทดสอบ:** ส่วนย่อย Docker ของเส้นทางเผยแพร่เทียบกับอาร์ติแฟกต์แพ็กเกจที่ใช้ร่วมกัน<br />**รันซ้ำ:** `rerun_group=live-e2e`                                                                                                                                                      |
| Package Acceptance  | **งาน:** `Run package acceptance`<br />**เวิร์กโฟลว์รองรับ:** `Package Acceptance`<br />**ทดสอบ:** fixture แพ็กเกจ Plugin แบบออฟไลน์, การอัปเดต Plugin, package acceptance ของ Telegram แบบ mock-OpenAI และการตรวจ survivor ของการอัปเกรดจากแพ็กเกจที่เผยแพร่แล้วทุก stable npm release ตั้งแต่ `2026.4.23` เป็นต้นไปเทียบกับ tarball เดียวกัน<br />**รันซ้ำ:** `rerun_group=package`                                         |
| QA parity           | **งาน:** `Run QA Lab parity lane` และ `Run QA Lab parity report`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**ทดสอบ:** ชุด agentic parity ของแคนดิเดตและ baseline แล้วจึงสร้างรายงาน parity<br />**รันซ้ำ:** `rerun_group=qa-parity` หรือ `rerun_group=qa`                                                                                                                                       |
| QA live Matrix      | **งาน:** `Run QA Lab live Matrix lane`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**ทดสอบ:** โปรไฟล์ QA Matrix แบบ live ที่รวดเร็วในสภาพแวดล้อม `qa-live-shared`<br />**รันซ้ำ:** `rerun_group=qa-live` หรือ `rerun_group=qa`                                                                                                                                                                        |
| QA live Telegram    | **งาน:** `Run QA Lab live Telegram lane`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**ทดสอบ:** QA Telegram แบบ live ด้วย lease ข้อมูลรับรอง Convex CI<br />**รันซ้ำ:** `rerun_group=qa-live` หรือ `rerun_group=qa`                                                                                                                                                                                    |
| ตัวตรวจสอบการเผยแพร่    | **งาน:** `Verify release checks`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**ทดสอบ:** งาน release-check ที่จำเป็นสำหรับกลุ่มรันซ้ำที่เลือก<br />**รันซ้ำ:** รันซ้ำหลังงานลูกแบบเจาะจงผ่านแล้ว                                                                                                                                                                                                 |

## ส่วนย่อยเส้นทางเผยแพร่ Docker

ขั้นตอนเส้นทางเผยแพร่ Docker จะรันส่วนย่อยเหล่านี้เมื่อ `live_suite_filter` ว่าง:

| ส่วนย่อย                                                           | ความครอบคลุม                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | เลน smoke เส้นทางเผยแพร่ Docker ของ Core                                   |
| `package-update-openai`                                         | พฤติกรรมการติดตั้งและอัปเดตแพ็กเกจ OpenAI                             |
| `package-update-anthropic`                                      | พฤติกรรมการติดตั้งและอัปเดตแพ็กเกจ Anthropic                          |
| `package-update-core`                                           | พฤติกรรมแพ็กเกจและการอัปเดตที่เป็นกลางต่อผู้ให้บริการ                           |
| `plugins-runtime-plugins`                                       | เลน runtime ของ Plugin ที่ exercise พฤติกรรมของ Plugin                     |
| `plugins-runtime-services`                                      | เลน runtime ของ Plugin ที่รองรับด้วยบริการ รวมถึง OpenWebUI เมื่อมีการร้องขอ |
| `plugins-runtime-install-a` ถึง `plugins-runtime-install-h` | ชุดการติดตั้ง/runtime ของ Plugin ที่แยกเพื่อการตรวจสอบการเผยแพร่แบบขนาน   |

ใช้ `docker_lanes=<lane[,lane]>` แบบเจาะจงในเวิร์กโฟลว์ live/E2E ที่นำกลับมาใช้ซ้ำได้ เมื่อ
มี Docker lane เพียงรายการเดียวที่ล้มเหลว artifacts ของ release จะรวมคำสั่ง rerun
แยกตาม lane พร้อมอินพุตสำหรับนำ package artifact และ image กลับมาใช้ซ้ำเมื่อมีให้ใช้

## โปรไฟล์ Release

`release_profile` ส่วนใหญ่ควบคุมขอบเขต live/provider ภายใน release checks
ไม่ได้ตัด CI แบบเต็มตามปกติ, Plugin Prerelease, install smoke, package
acceptance, QA Lab หรือชิ้นส่วน Docker release-path ออก `full` ยังทำให้
umbrella run รัน package Telegram E2E กับ artifact ของ parent release package เมื่อ
`rerun_group=all` เพื่อให้ตัวเลือกก่อนเผยแพร่แบบเต็มไม่ข้าม Telegram package lane
นั้นไปแบบเงียบ ๆ

| โปรไฟล์ | การใช้งานที่ตั้งใจ | ความครอบคลุม live/provider ที่รวมไว้ |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | smoke ที่สำคัญต่อ release ซึ่งเร็วที่สุด | เส้นทาง live ของ OpenAI/core, โมเดล Docker live สำหรับ OpenAI, native gateway core, โปรไฟล์ native OpenAI gateway, native OpenAI plugin และ Docker live gateway OpenAI |
| `stable`  | โปรไฟล์อนุมัติ release ค่าเริ่มต้น | `minimum` รวมกับ Anthropic smoke, Google, MiniMax, backend, native live test harness, Docker live CLI backend, Docker ACP bind, Docker Codex harness และ OpenCode Go smoke shard |
| `full`    | การกวาดตรวจ advisory แบบกว้าง | `stable` รวมกับ advisory providers, plugin live shards และ media live shards |

## ส่วนเพิ่มเติมเฉพาะ full

ชุดทดสอบเหล่านี้จะถูกข้ามโดย `stable` และรวมโดย `full`:

| พื้นที่ | ความครอบคลุมเฉพาะ full |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| โมเดล Docker live | OpenCode Go, OpenRouter, xAI, Z.ai และ Fireworks |
| Docker live gateway | แบ่ง advisory providers เป็น shards DeepSeek/Fireworks, OpenCode Go/OpenRouter และ xAI/Z.ai |
| โปรไฟล์ native gateway provider | shards Anthropic Opus และ Sonnet/Haiku แบบเต็ม, Fireworks, DeepSeek, shards โมเดล OpenCode Go แบบเต็ม, OpenRouter, xAI และ Z.ai |
| Native plugin live shards | Plugins A-K, L-N, O-Z อื่น ๆ, Moonshot และ xAI |
| Native media live shards | Audio, Google music, MiniMax music และกลุ่มวิดีโอ A-D |

`stable` รวม `native-live-src-gateway-profiles-anthropic-smoke` และ
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` ใช้ shards โมเดล
Anthropic และ OpenCode Go ที่กว้างกว่าแทน การ rerun แบบเจาะจงยังสามารถใช้ handle รวม
`native-live-src-gateway-profiles-anthropic` หรือ
`native-live-src-gateway-profiles-opencode-go` ได้

## การ rerun แบบเจาะจง

ใช้ `rerun_group` เพื่อหลีกเลี่ยงการทำ release boxes ที่ไม่เกี่ยวข้องซ้ำ:

| Handle              | ขอบเขต |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | ทุกขั้นตอน Full Release Validation |
| `ci`                | เฉพาะ child ของ CI แบบเต็มที่รันเอง |
| `plugin-prerelease` | เฉพาะ child ของ Plugin Prerelease |
| `release-checks`    | ทุกขั้นตอน OpenClaw Release Checks |
| `install-smoke`     | Install Smoke ผ่าน release checks |
| `cross-os`          | release checks ข้าม OS |
| `live-e2e`          | การตรวจสอบ Repo/live E2E และ Docker release-path |
| `package`           | Package Acceptance |
| `qa`                | QA parity รวมกับ QA live lanes |
| `qa-parity`         | เฉพาะ QA parity lanes และรายงาน |
| `qa-live`           | เฉพาะ QA live Matrix และ Telegram |
| `npm-telegram`      | Telegram E2E ของ published-package; ต้องใช้ `npm_telegram_package_spec` |

ใช้ `live_suite_filter` ร่วมกับ `rerun_group=live-e2e` เมื่อมี live suite หนึ่งรายการล้มเหลว
filter ids ที่ถูกต้องถูกกำหนดไว้ในเวิร์กโฟลว์ live/E2E ที่นำกลับมาใช้ซ้ำได้ รวมถึง
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` และ
`live-codex-harness-docker`

handle `live-gateway-advisory-docker` เป็น handle สำหรับ rerun แบบรวมของ
provider shards ทั้งสาม ดังนั้นยังคง fan out ไปยังงาน advisory Docker gateway ทั้งหมด

## หลักฐานที่ควรเก็บ

เก็บ summary ของ `Full Release Validation` ไว้เป็นดัชนีระดับ release โดยจะลิงก์
child run ids และรวมตารางงานที่ช้าที่สุด สำหรับความล้มเหลว ให้ตรวจสอบ child
workflow ก่อน แล้วจึง rerun handle ที่เล็กที่สุดซึ่งตรงกันด้านบน

artifacts ที่มีประโยชน์:

- `release-package-under-test` จาก parent ของ Full Release Validation และ `OpenClaw Release Checks`
- artifacts ของ Docker release-path ใต้ `.artifacts/docker-tests/`
- Package Acceptance `package-under-test` และ artifacts ของ Docker acceptance
- artifacts ของ Cross-OS release-check สำหรับแต่ละ OS และ suite
- artifacts ของ QA parity, Matrix และ Telegram

## ไฟล์เวิร์กโฟลว์

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
