---
read_when:
    - การเรียกใช้การตรวจสอบความถูกต้องของรีลีสแบบเต็ม หรือเรียกใช้อีกครั้ง
    - เปรียบเทียบโปรไฟล์การตรวจสอบความถูกต้องของรีลีสแบบเสถียรและแบบเต็ม
    - การดีบักความล้มเหลวในขั้นตอนการตรวจสอบรีลีส
summary: ขั้นตอนการตรวจสอบความถูกต้องของรุ่นเผยแพร่แบบเต็ม, เวิร์กโฟลว์ย่อย, โปรไฟล์การเผยแพร่, แฮนเดิลสำหรับการรันซ้ำ, และหลักฐาน
title: การตรวจสอบความถูกต้องของรุ่นเผยแพร่แบบเต็ม
x-i18n:
    generated_at: "2026-05-01T10:20:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcbfafd744437c160c09a9c508a639781549193669b300e5249023f9f5dd4afe
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` คือเวิร์กโฟลว์ครอบคลุมสำหรับรีลีส เป็นจุดเริ่มต้นแบบแมนนวลเดียว
สำหรับหลักฐานก่อนรีลีส แต่งานส่วนใหญ่เกิดขึ้นในเวิร์กโฟลว์ลูกเพื่อให้กล่องที่ล้มเหลว
รันซ้ำได้โดยไม่ต้องเริ่มรีลีสทั้งหมดใหม่

รันจาก ref ของเวิร์กโฟลว์ที่เชื่อถือได้ โดยปกติคือ `main` และส่งสาขารีลีส,
แท็ก หรือ commit SHA แบบเต็มเป็น `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

เวิร์กโฟลว์ลูกใช้ ref ของเวิร์กโฟลว์ที่เชื่อถือได้สำหรับฮาร์เนส และใช้อินพุต
`ref` สำหรับตัวเลือกที่กำลังทดสอบ วิธีนี้ทำให้ตรรกะการตรวจสอบใหม่พร้อมใช้งาน
เมื่อตรวจสอบสาขารีลีสหรือแท็กที่เก่ากว่า

## สเตจระดับบนสุด

| สเตจ                 | รายละเอียด                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การแก้หาเป้าหมาย     | **งาน:** `Resolve target ref`<br />**เวิร์กโฟลว์ลูก:** ไม่มี<br />**พิสูจน์:** แก้หาสาขารีลีส แท็ก หรือ commit SHA แบบเต็ม และบันทึกอินพุตที่เลือกไว้<br />**รันซ้ำ:** รันเวิร์กโฟลว์ครอบคลุมซ้ำหากขั้นนี้ล้มเหลว                                                                                                                                                                              |
| Vitest และ CI ปกติ  | **งาน:** `Run normal full CI`<br />**เวิร์กโฟลว์ลูก:** `CI`<br />**พิสูจน์:** กราฟ CI เต็มแบบแมนนวลกับ ref เป้าหมาย รวมถึงเลน Linux Node, ชาร์ด Plugin ที่บันเดิลมา, สัญญา channel, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, การตรวจเอกสาร, Python skills, Windows, macOS, Control UI i18n และ Android ผ่านเวิร์กโฟลว์ครอบคลุม<br />**รันซ้ำ:** `rerun_group=ci` |
| Plugin ก่อนรีลีส     | **งาน:** `Run plugin prerelease validation`<br />**เวิร์กโฟลว์ลูก:** `Plugin Prerelease`<br />**พิสูจน์:** การตรวจ static เฉพาะรีลีสของ Plugin, ความครอบคลุม Plugin แบบ agentic, ชาร์ดแบตช์ส่วนขยายแบบเต็ม และเลน Docker สำหรับ Plugin ก่อนรีลีส<br />**รันซ้ำ:** `rerun_group=plugin-prerelease`                                                                                                       |
| การตรวจรีลีส        | **งาน:** `Run release/live/Docker/QA validation`<br />**เวิร์กโฟลว์ลูก:** `OpenClaw Release Checks`<br />**พิสูจน์:** install smoke, การตรวจแพ็กเกจข้าม OS, ชุด live/E2E, ชังก์เส้นทางรีลีส Docker, Package Acceptance, ความเท่าเทียม QA Lab, Matrix แบบ live และ Telegram แบบ live<br />**รันซ้ำ:** `rerun_group=release-checks` หรือ handle ของ release-checks ที่แคบกว่า                                |
| Telegram หลังเผยแพร่ | **งาน:** `Run post-publish Telegram E2E`<br />**เวิร์กโฟลว์ลูก:** `NPM Telegram Beta E2E`<br />**พิสูจน์:** หลักฐาน Telegram ของแพ็กเกจที่เผยแพร่แล้วแบบไม่บังคับ เมื่อมีการตั้งค่า `npm_telegram_package_spec`<br />**รันซ้ำ:** `rerun_group=npm-telegram`                                                                                                                                                     |
| ตัวตรวจสอบครอบคลุม     | **งาน:** `Verify full validation`<br />**เวิร์กโฟลว์ลูก:** ไม่มี<br />**พิสูจน์:** ตรวจข้อสรุปของการรันลูกที่บันทึกไว้อีกครั้ง และต่อท้ายตารางงานที่ช้าที่สุดจากเวิร์กโฟลว์ลูก<br />**รันซ้ำ:** รันซ้ำเฉพาะงานนี้หลังจากรันลูกที่ล้มเหลวซ้ำจนผ่าน                                                                                                                                   |

สำหรับ `ref=main` และ `rerun_group=all` เวิร์กโฟลว์ครอบคลุมที่ใหม่กว่าจะทับตัวที่เก่ากว่า
เมื่อ parent ถูกยกเลิก ตัว monitor จะยกเลิกเวิร์กโฟลว์ลูกใด ๆ ที่ส่งไปแล้ว
การรันตรวจสอบสาขารีลีสและแท็กจะไม่ยกเลิกกันเองโดยค่าเริ่มต้น

## สเตจการตรวจรีลีส

`OpenClaw Release Checks` เป็นเวิร์กโฟลว์ลูกที่ใหญ่ที่สุด โดยจะแก้หาเป้าหมาย
หนึ่งครั้งและเตรียม artifact `release-package-under-test` ที่ใช้ร่วมกัน เมื่อสเตจที่เกี่ยวกับแพ็กเกจ
หรือ Docker ต้องใช้

| สเตจ               | รายละเอียด                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| เป้าหมายรีลีส      | **งาน:** `Resolve target ref`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**ทดสอบ:** ref ที่เลือก, SHA ที่คาดไว้แบบไม่บังคับ, profile, rerun group และตัวกรองชุด live ที่โฟกัส<br />**รันซ้ำ:** `rerun_group=release-checks`                                                                                                                                                                           |
| Artifact แพ็กเกจ    | **งาน:** `Prepare release package artifact`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**ทดสอบ:** แพ็กหรือแก้หา tarball ตัวเลือกหนึ่งรายการ และอัปโหลด `release-package-under-test` สำหรับการตรวจ downstream ที่เกี่ยวกับแพ็กเกจ<br />**รันซ้ำ:** กลุ่มแพ็กเกจ, cross-OS หรือ live/E2E ที่ได้รับผลกระทบ                                                                                                           |
| Install smoke       | **งาน:** `Run install smoke`<br />**เวิร์กโฟลว์รองรับ:** `Install Smoke`<br />**ทดสอบ:** เส้นทางติดตั้งเต็มด้วยการใช้ image smoke ของ root Dockerfile ซ้ำ, การติดตั้งแพ็กเกจ QR, smoke ของ root และ Gateway Docker, การทดสอบ installer Docker, smoke ของ Bun global install image-provider และ Docker E2E แบบเร็วของ Plugin ที่บันเดิลมา<br />**รันซ้ำ:** `rerun_group=install-smoke`                                         |
| Cross-OS            | **งาน:** `cross_os_release_checks`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**ทดสอบ:** เลน fresh และ upgrade บน Linux, Windows และ macOS สำหรับ provider และ mode ที่เลือก โดยใช้ tarball ตัวเลือกพร้อมแพ็กเกจ baseline<br />**รันซ้ำ:** `rerun_group=cross-os`                                                                               |
| Repo และ live E2E   | **งาน:** `Run repo/live E2E validation`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**ทดสอบ:** E2E ของ repository, live cache, OpenAI websocket streaming, provider แบบ native live และชาร์ด Plugin, รวมถึงฮาร์เนส model/backend/gateway แบบ live ที่รองรับด้วย Docker ซึ่งเลือกตาม `release_profile`<br />**รันซ้ำ:** `rerun_group=live-e2e` พร้อม `live_suite_filter` แบบไม่บังคับ |
| เส้นทางรีลีส Docker | **งาน:** `Run Docker release-path validation`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**ทดสอบ:** ชังก์ Docker เส้นทางรีลีสกับ artifact แพ็กเกจที่ใช้ร่วมกัน<br />**รันซ้ำ:** `rerun_group=live-e2e`                                                                                                                                                      |
| Package Acceptance  | **งาน:** `Run package acceptance`<br />**เวิร์กโฟลว์รองรับ:** `Package Acceptance`<br />**ทดสอบ:** ความเข้ากันได้ของ dependency สำหรับ bundled-channel แบบ artifact-native, fixture แพ็กเกจ Plugin แบบ offline และการยอมรับแพ็กเกจ Telegram แบบ mock-OpenAI กับ tarball เดียวกัน<br />**รันซ้ำ:** `rerun_group=package`                                                                                       |
| ความเท่าเทียม QA           | **งาน:** `Run QA Lab parity lane` และ `Run QA Lab parity report`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**ทดสอบ:** แพ็กความเท่าเทียมแบบ agentic ของตัวเลือกและ baseline แล้วจึงรายงานความเท่าเทียม<br />**รันซ้ำ:** `rerun_group=qa-parity` หรือ `rerun_group=qa`                                                                                                                                       |
| Matrix แบบ live ของ QA      | **งาน:** `Run QA Lab live Matrix lane`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**ทดสอบ:** โปรไฟล์ QA ของ Matrix แบบ live ที่เร็วใน environment `qa-live-shared`<br />**รันซ้ำ:** `rerun_group=qa-live` หรือ `rerun_group=qa`                                                                                                                                                                        |
| Telegram แบบ live ของ QA    | **งาน:** `Run QA Lab live Telegram lane`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**ทดสอบ:** QA ของ Telegram แบบ live พร้อม lease credential ของ Convex CI<br />**รันซ้ำ:** `rerun_group=qa-live` หรือ `rerun_group=qa`                                                                                                                                                                                    |
| ตัวตรวจสอบรีลีส    | **งาน:** `Verify release checks`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**ทดสอบ:** งาน release-check ที่จำเป็นสำหรับ rerun group ที่เลือก<br />**รันซ้ำ:** รันซ้ำหลังจากงานลูกที่โฟกัสผ่านแล้ว                                                                                                                                                                                                 |

## ชังก์เส้นทางรีลีส Docker

สเตจเส้นทางรีลีส Docker จะรันชังก์เหล่านี้เมื่อ `live_suite_filter`
ว่าง:

| ชังก์                                                                                       | ความครอบคลุม                                                                |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                                                      | เลน smoke ของเส้นทางรีลีส Docker หลัก                                   |
| `package-update-openai`                                                                     | พฤติกรรมการติดตั้งและอัปเดตแพ็กเกจ OpenAI                             |
| `package-update-anthropic`                                                                  | พฤติกรรมการติดตั้งและอัปเดตแพ็กเกจ Anthropic                          |
| `package-update-core`                                                                       | พฤติกรรมของแพ็กเกจและการอัปเดตที่ไม่ผูกกับ provider                           |
| `plugins-runtime-plugins`                                                                   | เลน runtime ของ Plugin ที่ใช้งานพฤติกรรม Plugin                     |
| `plugins-runtime-services`                                                                  | เลน runtime ของ Plugin ที่มี service รองรับ รวมถึง OpenWebUI เมื่อมีการร้องขอ |
| `plugins-runtime-install-a` ถึง `plugins-runtime-install-h`                             | แบตช์ติดตั้ง/runtime ของ Plugin ที่แยกสำหรับการตรวจสอบรีลีสแบบขนาน   |
| `bundled-channels-core`                                                                     | พฤติกรรม Docker ของ channel ที่บันเดิลมา                                        |
| `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` | พฤติกรรมการอัปเดต channel ที่บันเดิลมา                                        |
| `bundled-channels-contracts`                                                                | การตรวจสัญญา channel ที่บันเดิลมาในเส้นทางรีลีส Docker             |

ใช้ `docker_lanes=<lane[,lane]>` แบบเจาะจงบนเวิร์กโฟลว์ live/E2E ที่ใช้ซ้ำได้เมื่อ
มี Docker lane ล้มเหลวเพียงหนึ่งรายการ อาร์ติแฟกต์รีลีสรวมคำสั่ง rerun
แยกตาม lane พร้อมอินพุตการใช้อาร์ติแฟกต์แพ็กเกจและอิมเมจซ้ำเมื่อมีให้ใช้งาน

## โปรไฟล์รีลีส

`release_profile` ควบคุมเฉพาะขอบเขต live/provider ภายใน release checks เท่านั้น
ไม่ได้ตัด CI แบบเต็มตามปกติ, Plugin Prerelease, install smoke, package
acceptance, QA Lab หรือส่วน release-path ของ Docker ออก

| โปรไฟล์   | การใช้งานที่ตั้งใจไว้                      | ความครอบคลุม live/provider ที่รวมอยู่                                                                                                                                               |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | smoke ที่เร็วที่สุดสำหรับส่วนสำคัญของรีลีส   | เส้นทาง live ของ OpenAI/core, โมเดล live ของ Docker สำหรับ OpenAI, Gateway core แบบเนทีฟ, โปรไฟล์ Gateway OpenAI แบบเนทีฟ, plugin OpenAI แบบเนทีฟ และ Gateway live ของ Docker สำหรับ OpenAI               |
| `stable`  | โปรไฟล์เริ่มต้นสำหรับอนุมัติรีลีส | `minimum` รวม Anthropic, Google, MiniMax, backend, ชุดทดสอบ live แบบเนทีฟ, backend CLI live ของ Docker, ACP bind ของ Docker, ชุดทดสอบ Codex ของ Docker และ smoke shard ของ OpenCode Go |
| `full`    | การตรวจครอบคลุมแบบ advisory ในวงกว้าง             | `stable` รวม provider advisory, live shards ของ plugin และ media live shards                                                                                                  |

## รายการเพิ่มเติมเฉพาะ full

ชุดเหล่านี้จะถูกข้ามโดย `stable` และรวมอยู่ใน `full`:

| พื้นที่                             | ความครอบคลุมเฉพาะ full                                                              |
| -------------------------------- | ------------------------------------------------------------------------------- |
| โมเดล live ของ Docker               | OpenCode Go, OpenRouter, xAI, Z.ai และ Fireworks                              |
| Gateway live ของ Docker              | shard advisory สำหรับ DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI และ Z.ai |
| โปรไฟล์ provider ของ Gateway แบบเนทีฟ | Fireworks, DeepSeek, model shards ของ OpenCode Go แบบเต็ม, OpenRouter, xAI และ Z.ai  |
| live shards ของ plugin แบบเนทีฟ        | Plugins A-K, L-N, O-Z อื่น ๆ, Moonshot และ xAI                                 |
| media live shards แบบเนทีฟ         | กลุ่ม Audio, Google music, MiniMax music และ video A-D                       |

`stable` รวม `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
ใช้ model shards ของ OpenCode Go ที่กว้างกว่าแทน

## การ rerun แบบเจาะจง

ใช้ `rerun_group` เพื่อหลีกเลี่ยงการรันกล่องรีลีสที่ไม่เกี่ยวข้องซ้ำ:

| Handle              | ขอบเขต                                             |
| ------------------- | ------------------------------------------------- |
| `all`               | ทุกขั้นตอนของ Full Release Validation               |
| `ci`                | child ของ CI แบบเต็มที่รันด้วยตนเองเท่านั้น                        |
| `plugin-prerelease` | child ของ Plugin Prerelease เท่านั้น                     |
| `release-checks`    | ทุกขั้นตอนของ OpenClaw Release Checks               |
| `install-smoke`     | Install Smoke ผ่าน release checks             |
| `cross-os`          | release checks ข้าม OS                          |
| `live-e2e`          | การตรวจสอบ E2E ของ repo/live และ release-path ของ Docker |
| `package`           | Package Acceptance                               |
| `qa`                | QA parity รวม QA live lanes                     |
| `qa-parity`         | QA parity lanes และรายงานเท่านั้น                  |
| `qa-live`           | QA live Matrix และ Telegram เท่านั้น                 |
| `npm-telegram`      | E2E ของ Telegram หลังเผยแพร่แบบไม่บังคับเท่านั้น          |

ใช้ `live_suite_filter` กับ `rerun_group=live-e2e` เมื่อมี live suite ล้มเหลวหนึ่งรายการ
id ตัวกรองที่ถูกต้องถูกกำหนดไว้ในเวิร์กโฟลว์ live/E2E ที่ใช้ซ้ำได้ รวมถึง
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` และ
`live-codex-harness-docker`

## หลักฐานที่ต้องเก็บไว้

เก็บสรุป `Full Release Validation` ไว้เป็นดัชนีระดับรีลีส สรุปนี้ลิงก์
id ของ child run และรวมตารางงานที่ช้าที่สุด สำหรับความล้มเหลว ให้ตรวจสอบเวิร์กโฟลว์
child ก่อน แล้วจึง rerun handle ที่เล็กที่สุดซึ่งตรงกันจากด้านบน

อาร์ติแฟกต์ที่มีประโยชน์:

- `release-package-under-test` จาก `OpenClaw Release Checks`
- อาร์ติแฟกต์ release-path ของ Docker ภายใต้ `.artifacts/docker-tests/`
- `package-under-test` ของ Package Acceptance และอาร์ติแฟกต์ acceptance ของ Docker
- อาร์ติแฟกต์ release-check ข้าม OS สำหรับแต่ละ OS และ suite
- อาร์ติแฟกต์ QA parity, Matrix และ Telegram

## ไฟล์เวิร์กโฟลว์

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
