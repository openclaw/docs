---
read_when:
    - การเรียกใช้หรือเรียกใช้การตรวจสอบความถูกต้องของรีลีสแบบเต็มซ้ำ
    - การเปรียบเทียบโปรไฟล์การตรวจสอบการเผยแพร่แบบเสถียรและแบบเต็ม
    - การดีบักความล้มเหลวของขั้นตอนการตรวจสอบความถูกต้องของรีลีส
summary: ขั้นตอนการตรวจสอบการเผยแพร่แบบเต็ม เวิร์กโฟลว์ย่อย โปรไฟล์การเผยแพร่ ตัวอ้างอิงการรันซ้ำ และหลักฐาน
title: การตรวจสอบความถูกต้องของการเผยแพร่แบบเต็ม
x-i18n:
    generated_at: "2026-05-02T10:28:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: feb4edec850fb97405575c869547b4851bc773507321690670553e6faafc8b0b
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` คือเวิร์กโฟลว์ครอบของการรีลีส เป็นจุดเข้าใช้งานแบบ manual เพียงจุดเดียวสำหรับหลักฐานก่อนรีลีส แต่งานส่วนใหญ่เกิดขึ้นในเวิร์กโฟลว์ลูกเพื่อให้กล่องที่ล้มเหลวสามารถรันซ้ำได้โดยไม่ต้องเริ่มการรีลีสทั้งหมดใหม่

รันจาก workflow ref ที่เชื่อถือได้ โดยปกติคือ `main` แล้วส่ง branch รีลีส, tag หรือ SHA ของ commit แบบเต็มเป็น `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

เวิร์กโฟลว์ลูกใช้ workflow ref ที่เชื่อถือได้สำหรับ harness และใช้ input
`ref` สำหรับ candidate ที่อยู่ระหว่างทดสอบ วิธีนี้ทำให้มี logic การตรวจสอบใหม่พร้อมใช้งาน
เมื่อกำลังตรวจสอบ branch หรือ tag ของรีลีสที่เก่ากว่า

## ขั้นตอนระดับบนสุด

| ขั้นตอน                | รายละเอียด                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การ resolve เป้าหมาย    | **งาน:** `Resolve target ref`<br />**เวิร์กโฟลว์ลูก:** ไม่มี<br />**พิสูจน์:** resolve branch รีลีส, tag หรือ SHA ของ commit แบบเต็ม และบันทึก input ที่เลือกไว้<br />**รันซ้ำ:** รัน umbrella ซ้ำหากขั้นตอนนี้ล้มเหลว                                                                                                                                                                              |
| Vitest และ CI ปกติ | **งาน:** `Run normal full CI`<br />**เวิร์กโฟลว์ลูก:** `CI`<br />**พิสูจน์:** กราฟ CI แบบเต็มที่สั่ง manual กับ target ref รวมถึง Linux Node lanes, bundled plugin shards, channel contracts, ความเข้ากันได้กับ Node 22, `check`, `check-additional`, build smoke, docs checks, Python skills, Windows, macOS, Control UI i18n และ Android ผ่าน umbrella<br />**รันซ้ำ:** `rerun_group=ci` |
| การตรวจสอบ prerelease ของ Plugin    | **งาน:** `Run plugin prerelease validation`<br />**เวิร์กโฟลว์ลูก:** `Plugin Prerelease`<br />**พิสูจน์:** static checks เฉพาะรีลีสของ Plugin, การครอบคลุม agentic plugin, full extension batch shards และ Docker lanes สำหรับ plugin prerelease<br />**รันซ้ำ:** `rerun_group=plugin-prerelease`                                                                                                       |
| การตรวจสอบรีลีส       | **งาน:** `Run release/live/Docker/QA validation`<br />**เวิร์กโฟลว์ลูก:** `OpenClaw Release Checks`<br />**พิสูจน์:** install smoke, cross-OS package checks, live/E2E suites, Docker release-path chunks, Package Acceptance, QA Lab parity, live Matrix และ live Telegram<br />**รันซ้ำ:** `rerun_group=release-checks` หรือ handle ของ release-checks ที่แคบกว่า                                |
| Package Telegram     | **งาน:** `Run package Telegram E2E`<br />**เวิร์กโฟลว์ลูก:** `NPM Telegram Beta E2E`<br />**พิสูจน์:** หลักฐานแพ็กเกจ Telegram ที่อิง artifact สำหรับ `rerun_group=all` พร้อม `release_profile=full` หรือหลักฐาน Telegram จากแพ็กเกจที่ publish แล้วเมื่อมีการตั้งค่า `npm_telegram_package_spec`<br />**รันซ้ำ:** `rerun_group=npm-telegram` พร้อม `npm_telegram_package_spec`                                     |
| ตัวตรวจสอบ umbrella    | **งาน:** `Verify full validation`<br />**เวิร์กโฟลว์ลูก:** ไม่มี<br />**พิสูจน์:** ตรวจสอบ conclusions ของ child run ที่บันทึกไว้อีกครั้ง และเพิ่มตารางงานที่ช้าที่สุดจากเวิร์กโฟลว์ลูก<br />**รันซ้ำ:** รันซ้ำเฉพาะงานนี้หลังจากรันเวิร์กโฟลว์ลูกที่ล้มเหลวซ้ำจนเขียว                                                                                                                                   |

สำหรับ `ref=main` และ `rerun_group=all` umbrella ที่ใหม่กว่าจะ supersede umbrella ที่เก่ากว่า
เมื่อ parent ถูกยกเลิก monitor ของ parent จะยกเลิก child workflow ใดก็ตามที่ได้ dispatch ไปแล้ว
การรันตรวจสอบ branch รีลีสและ tag จะไม่ยกเลิกกันเองโดยค่าเริ่มต้น

## ขั้นตอนการตรวจสอบรีลีส

`OpenClaw Release Checks` เป็นเวิร์กโฟลว์ลูกที่ใหญ่ที่สุด โดยจะ resolve เป้าหมายหนึ่งครั้ง
และเตรียม artifact `release-package-under-test` ที่ใช้ร่วมกันเมื่อขั้นตอนที่เกี่ยวกับแพ็กเกจ
หรือ Docker จำเป็นต้องใช้

| ขั้นตอน               | รายละเอียด                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| เป้าหมายรีลีส      | **งาน:** `Resolve target ref`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**ทดสอบ:** ref ที่เลือก, SHA ที่คาดไว้แบบ optional, profile, rerun group และตัวกรอง focused live suite<br />**รันซ้ำ:** `rerun_group=release-checks`                                                                                                                                                                           |
| Artifact แพ็กเกจ    | **งาน:** `Prepare release package artifact`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**ทดสอบ:** pack หรือ resolve candidate tarball หนึ่งรายการ และ upload `release-package-under-test` สำหรับ checks downstream ที่เกี่ยวกับแพ็กเกจ<br />**รันซ้ำ:** กลุ่มแพ็กเกจ, cross-OS หรือ live/E2E ที่ได้รับผลกระทบ                                                                                                           |
| Install smoke       | **งาน:** `Run install smoke`<br />**เวิร์กโฟลว์รองรับ:** `Install Smoke`<br />**ทดสอบ:** เส้นทาง install แบบเต็มพร้อมการใช้ root Dockerfile smoke image ซ้ำ, การ install แพ็กเกจ QR, root และ gateway Docker smokes, installer Docker tests, Bun global install image-provider smoke และ bundled-plugin install/uninstall E2E แบบเร็ว<br />**รันซ้ำ:** `rerun_group=install-smoke`                              |
| Cross-OS            | **งาน:** `cross_os_release_checks`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**ทดสอบ:** fresh lanes และ upgrade lanes บน Linux, Windows และ macOS สำหรับ provider และ mode ที่เลือก โดยใช้ candidate tarball พร้อม baseline package<br />**รันซ้ำ:** `rerun_group=cross-os`                                                                               |
| Repo และ live E2E   | **งาน:** `Run repo/live E2E validation`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**ทดสอบ:** repository E2E, live cache, OpenAI websocket streaming, native live provider และ plugin shards และ harnesses ของ live model/backend/gateway ที่อิง Docker ซึ่งเลือกโดย `release_profile`<br />**รันซ้ำ:** `rerun_group=live-e2e` พร้อม `live_suite_filter` แบบ optional |
| Docker release path | **งาน:** `Run Docker release-path validation`<br />**เวิร์กโฟลว์รองรับ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**ทดสอบ:** release-path Docker chunks กับ artifact แพ็กเกจที่ใช้ร่วมกัน<br />**รันซ้ำ:** `rerun_group=live-e2e`                                                                                                                                                      |
| Package Acceptance  | **งาน:** `Run package acceptance`<br />**เวิร์กโฟลว์รองรับ:** `Package Acceptance`<br />**ทดสอบ:** offline plugin package fixtures, การ update Plugin และ mock-OpenAI Telegram package acceptance กับ tarball เดียวกัน<br />**รันซ้ำ:** `rerun_group=package`                                                                                                                                  |
| QA parity           | **งาน:** `Run QA Lab parity lane` และ `Run QA Lab parity report`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**ทดสอบ:** candidate และ baseline agentic parity packs จากนั้น parity report<br />**รันซ้ำ:** `rerun_group=qa-parity` หรือ `rerun_group=qa`                                                                                                                                       |
| QA live Matrix      | **งาน:** `Run QA Lab live Matrix lane`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**ทดสอบ:** fast live Matrix QA profile ใน environment `qa-live-shared`<br />**รันซ้ำ:** `rerun_group=qa-live` หรือ `rerun_group=qa`                                                                                                                                                                        |
| QA live Telegram    | **งาน:** `Run QA Lab live Telegram lane`<br />**เวิร์กโฟลว์รองรับ:** งานโดยตรง<br />**ทดสอบ:** live Telegram QA พร้อม Convex CI credential leases<br />**รันซ้ำ:** `rerun_group=qa-live` หรือ `rerun_group=qa`                                                                                                                                                                                    |
| ตัวตรวจสอบรีลีส    | **งาน:** `Verify release checks`<br />**เวิร์กโฟลว์รองรับ:** ไม่มี<br />**ทดสอบ:** งาน release-check ที่จำเป็นสำหรับ rerun group ที่เลือก<br />**รันซ้ำ:** รันซ้ำหลังจาก focused child jobs ผ่าน                                                                                                                                                                                                 |

## Docker release-path chunks

ขั้นตอน Docker release-path จะรัน chunks เหล่านี้เมื่อ `live_suite_filter`
ว่าง:

| Chunk                                                           | การครอบคลุม                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Core Docker release-path smoke lanes.                                   |
| `package-update-openai`                                         | พฤติกรรมการ install และ update แพ็กเกจ OpenAI                             |
| `package-update-anthropic`                                      | พฤติกรรมการ install และ update แพ็กเกจ Anthropic                          |
| `package-update-core`                                           | พฤติกรรมของแพ็กเกจและการ update ที่เป็น provider-neutral                           |
| `plugins-runtime-plugins`                                       | Plugin runtime lanes ที่ exercise พฤติกรรมของ Plugin                     |
| `plugins-runtime-services`                                      | Service-backed plugin runtime lanes รวมถึง OpenWebUI เมื่อร้องขอ |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | ชุด install/runtime ของ Plugin ที่แบ่งสำหรับการตรวจสอบรีลีสแบบ parallel   |

ใช้ `docker_lanes=<lane[,lane]>` แบบ targeted บน reusable live/E2E workflow เมื่อ
Docker lane เพียง lane เดียวล้มเหลว artifacts ของรีลีสมีคำสั่งรันซ้ำต่อ lane
พร้อม input สำหรับ package artifact และการใช้ image ซ้ำเมื่อมีให้ใช้งาน

## โปรไฟล์รีลีส

`release_profile` ควบคุมขอบเขตของ live/provider ภายในการตรวจสอบรีลีสเป็นหลัก
ไม่ได้ลบ normal full CI, Plugin Prerelease, install smoke, package
acceptance, QA Lab หรือ Docker release-path chunks ออกไป `full` ยังทำให้
umbrella รัน package Telegram E2E กับ artifact แพ็กเกจรีลีสเมื่อ
`rerun_group=all` เพื่อให้ candidate แบบเต็มก่อน publish ไม่ข้าม
Telegram package lane นั้นไปอย่างเงียบ ๆ

| โปรไฟล์   | การใช้งานที่ตั้งใจไว้                      | ความครอบคลุมการทดสอบใช้งานจริง/ผู้ให้บริการที่รวมไว้                                                                                                                                               |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | การตรวจสอบขั้นต้นที่เร็วที่สุดสำหรับส่วนสำคัญของการปล่อยรุ่น   | เส้นทางใช้งานจริงของ OpenAI/core, โมเดลใช้งานจริงของ Docker สำหรับ OpenAI, แกน Gateway แบบเนทีฟ, โปรไฟล์ Gateway OpenAI แบบเนทีฟ, Plugin OpenAI แบบเนทีฟ และ Gateway OpenAI ใช้งานจริงบน Docker               |
| `stable`  | โปรไฟล์เริ่มต้นสำหรับอนุมัติการปล่อยรุ่น | `minimum` รวมกับ Anthropic, Google, MiniMax, backend, ชุดทดสอบใช้งานจริงแบบเนทีฟ, backend CLI ใช้งานจริงบน Docker, การผูก ACP บน Docker, ชุดทดสอบ Codex บน Docker และชาร์ด smoke ของ OpenCode Go |
| `full`    | การกวาดตรวจเชิงแนะนำแบบกว้าง             | `stable` รวมกับผู้ให้บริการเชิงแนะนำ, ชาร์ดใช้งานจริงของ Plugin และชาร์ดใช้งานจริงของสื่อ                                                                                                  |

## รายการเพิ่มเติมเฉพาะ full

ชุดทดสอบเหล่านี้ถูกข้ามโดย `stable` และถูกรวมไว้โดย `full`:

| พื้นที่                             | ความครอบคลุมเฉพาะ full                                                              |
| -------------------------------- | ------------------------------------------------------------------------------- |
| โมเดลใช้งานจริงของ Docker               | OpenCode Go, OpenRouter, xAI, Z.ai และ Fireworks                              |
| Gateway ใช้งานจริงบน Docker              | ชาร์ดเชิงแนะนำสำหรับ DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI และ Z.ai |
| โปรไฟล์ผู้ให้บริการ Gateway แบบเนทีฟ | Fireworks, DeepSeek, ชาร์ดโมเดล OpenCode Go แบบเต็ม, OpenRouter, xAI และ Z.ai  |
| ชาร์ดใช้งานจริงของ Plugin แบบเนทีฟ        | Plugins A-K, L-N, O-Z อื่น ๆ, Moonshot และ xAI                                 |
| ชาร์ดใช้งานจริงของสื่อแบบเนทีฟ         | เสียง, เพลง Google, เพลง MiniMax และกลุ่มวิดีโอ A-D                       |

`stable` รวม `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
ใช้ชาร์ดโมเดล OpenCode Go ที่กว้างกว่าแทน

## การรันซ้ำแบบเจาะจง

ใช้ `rerun_group` เพื่อหลีกเลี่ยงการทำซ้ำกล่องปล่อยรุ่นที่ไม่เกี่ยวข้อง:

| แฮนเดิล              | ขอบเขต                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | ทุกขั้นตอนของ Full Release Validation                                   |
| `ci`                | เฉพาะ CI ลูกแบบเต็มที่สั่งเอง                                            |
| `plugin-prerelease` | เฉพาะลูก Plugin Prerelease                                         |
| `release-checks`    | ทุกขั้นตอนของ OpenClaw Release Checks                                   |
| `install-smoke`     | Install Smoke จนถึงการตรวจสอบการปล่อยรุ่น                                 |
| `cross-os`          | การตรวจสอบการปล่อยรุ่นข้าม OS                                              |
| `live-e2e`          | การตรวจสอบ E2E ของ repo/ใช้งานจริง และเส้นทางการปล่อยรุ่น Docker                     |
| `package`           | Package Acceptance                                                   |
| `qa`                | ความเท่าเทียม QA รวมกับเลนใช้งานจริง QA                                         |
| `qa-parity`         | เฉพาะเลนและรายงานความเท่าเทียม QA                                      |
| `qa-live`           | เฉพาะ Matrix ใช้งานจริงของ QA และ Telegram                                     |
| `npm-telegram`      | E2E ของ Telegram สำหรับแพ็กเกจที่เผยแพร่แล้ว; ต้องใช้ `npm_telegram_package_spec` |

ใช้ `live_suite_filter` กับ `rerun_group=live-e2e` เมื่อชุดทดสอบใช้งานจริงหนึ่งชุดล้มเหลว
รหัสตัวกรองที่ถูกต้องถูกกำหนดในเวิร์กโฟลว์ใช้งานจริง/E2E ที่ใช้ซ้ำได้ รวมถึง
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` และ
`live-codex-harness-docker`

## หลักฐานที่ต้องเก็บ

เก็บสรุป `Full Release Validation` ไว้เป็นดัชนีระดับการปล่อยรุ่น สรุปนี้ลิงก์ไปยัง
รหัสการรันลูกและรวมตารางงานที่ช้าที่สุดไว้ด้วย เมื่อเกิดความล้มเหลว ให้ตรวจสอบ
เวิร์กโฟลว์ลูกก่อน แล้วจึงรันแฮนเดิลที่ตรงกันและเล็กที่สุดจากด้านบนซ้ำ

อาร์ติแฟกต์ที่มีประโยชน์:

- `release-package-under-test` จาก `OpenClaw Release Checks`
- อาร์ติแฟกต์เส้นทางการปล่อยรุ่น Docker ใต้ `.artifacts/docker-tests/`
- `package-under-test` ของ Package Acceptance และอาร์ติแฟกต์การยอมรับ Docker
- อาร์ติแฟกต์การตรวจสอบการปล่อยรุ่นข้าม OS สำหรับแต่ละ OS และชุดทดสอบ
- อาร์ติแฟกต์ความเท่าเทียม QA, Matrix และ Telegram

## ไฟล์เวิร์กโฟลว์

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
