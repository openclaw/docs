---
read_when:
    - การเรียกใช้ pnpm openclaw qa matrix ภายในเครื่อง
    - การเพิ่มหรือเลือกสถานการณ์ Matrix QA
    - การคัดแยกปัญหาความล้มเหลวของการตรวจสอบคุณภาพแบบเมทริกซ์ การหมดเวลา หรือการล้างข้อมูลที่ค้างอยู่
summary: 'เอกสารอ้างอิงสำหรับผู้ดูแลสำหรับเลน QA สด Matrix ที่ใช้ Docker รองรับ: CLI, โปรไฟล์, ตัวแปรสภาพแวดล้อม, สถานการณ์ และอาร์ติแฟกต์ผลลัพธ์'
title: การประกันคุณภาพ Matrix
x-i18n:
    generated_at: "2026-05-06T09:10:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c6d836492368c470468547950d3765a64187694852222a5a1f0ae4185569abe
    source_path: concepts/qa-matrix.md
    workflow: 16
---

เลน QA ของ Matrix รัน Plugin `@openclaw/matrix` ที่บันเดิลมากับโฮมเซิร์ฟเวอร์ Tuwunel แบบใช้แล้วทิ้งใน Docker พร้อมบัญชี driver, SUT และ observer ชั่วคราว รวมถึงห้องที่เตรียมข้อมูลไว้แล้ว นี่คือความครอบคลุมแบบสดที่ใช้ทรานสปอร์ตจริงสำหรับ Matrix

นี่เป็นเครื่องมือสำหรับผู้ดูแลเท่านั้น รีลีส OpenClaw แบบแพ็กเกจจะจงใจไม่รวม `qa-lab` ดังนั้น `openclaw qa` จึงใช้ได้จากซอร์สเช็กเอาต์เท่านั้น ซอร์สเช็กเอาต์จะโหลดรันเนอร์ที่บันเดิลมาโดยตรง - ไม่ต้องมีขั้นตอนติดตั้ง Plugin

สำหรับบริบทของเฟรมเวิร์ก QA ที่กว้างขึ้น โปรดดู [ภาพรวม QA](/th/concepts/qa-e2e-automation)

## เริ่มต้นอย่างรวดเร็ว

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

`pnpm openclaw qa matrix` แบบธรรมดาจะรัน `--profile all` และจะไม่หยุดเมื่อเจอความล้มเหลวแรก ใช้ `--profile fast --fail-fast` สำหรับเกตของรีลีส; แบ่งแค็ตตาล็อกด้วย `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` เมื่อรันอินเวนทอรีทั้งหมดแบบขนาน

## สิ่งที่เลนทำ

1. จัดเตรียมโฮมเซิร์ฟเวอร์ Tuwunel แบบใช้แล้วทิ้งใน Docker (อิมเมจเริ่มต้น `ghcr.io/matrix-construct/tuwunel:v1.5.1`, ชื่อเซิร์ฟเวอร์ `matrix-qa.test`, พอร์ต `28008`)
2. ลงทะเบียนผู้ใช้ชั่วคราวสามราย - `driver` (ส่งทราฟฟิกขาเข้า), `sut` (บัญชี Matrix ของ OpenClaw ที่อยู่ระหว่างการทดสอบ), `observer` (บันทึกทราฟฟิกจากบุคคลที่สาม)
3. เตรียมห้องที่สถานการณ์ที่เลือกต้องใช้ (main, threading, media, restart, secondary, allowlist, E2EE, verification DM ฯลฯ)
4. เริ่ม Gateway ลูกของ OpenClaw พร้อม Plugin Matrix จริงที่จำกัดขอบเขตไว้กับบัญชี SUT; `qa-channel` จะไม่ถูกโหลดในลูก
5. รันสถานการณ์ตามลำดับ โดยสังเกตเหตุการณ์ผ่านไคลเอนต์ Matrix ของ driver/observer
6. ปิดโฮมเซิร์ฟเวอร์ เขียนรายงานและอาร์ติแฟกต์สรุป แล้วจึงออก

## CLI

```text
pnpm openclaw qa matrix [options]
```

### แฟล็กทั่วไป

| แฟล็ก                 | ค่าเริ่มต้น                                  | คำอธิบาย                                                                                                                |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | โปรไฟล์สถานการณ์ ดู [โปรไฟล์](#profiles)                                                                               |
| `--fail-fast`         | ปิด                                           | หยุดหลังจากเช็กหรือสถานการณ์แรกล้มเหลว                                                                                |
| `--scenario <id>`     | -                                             | รันเฉพาะสถานการณ์นี้ ทำซ้ำได้ ดู [สถานการณ์](#scenarios)                                                              |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | ตำแหน่งเขียนรายงาน สรุป เหตุการณ์ที่สังเกตได้ และล็อกเอาต์พุต พาธสัมพัทธ์จะถูก resolve เทียบกับ `--repo-root` |
| `--repo-root <path>`  | `process.cwd()`                               | รากของรีโพซิทอรีเมื่อเรียกจากไดเรกทอรีทำงานที่เป็นกลาง                                                               |
| `--sut-account <id>`  | `sut`                                         | ID บัญชี Matrix ภายในคอนฟิก Gateway ของ QA                                                                             |

### แฟล็กผู้ให้บริการ

เลนใช้ทรานสปอร์ต Matrix จริง แต่สามารถกำหนดค่าผู้ให้บริการโมเดลได้:

| แฟล็ก                    | ค่าเริ่มต้น       | คำอธิบาย                                                                                                                                    |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` สำหรับการ dispatch แบบ mock ที่กำหนดผลได้ หรือ `live-frontier` สำหรับผู้ให้บริการ frontier แบบสด alias เดิม `live-openai` ยังใช้ได้ |
| `--model <ref>`          | ค่าเริ่มต้นของผู้ให้บริการ | ref หลัก `provider/model`                                                                                                                  |
| `--alt-model <ref>`      | ค่าเริ่มต้นของผู้ให้บริการ | ref สำรอง `provider/model` เมื่อสถานการณ์สลับระหว่างการรัน                                                                                |
| `--fast`                 | ปิด              | เปิดใช้งานโหมดเร็วของผู้ให้บริการในที่ที่รองรับ                                                                                           |

Matrix QA ไม่รับ `--credential-source` หรือ `--credential-role` เลนจะจัดเตรียมผู้ใช้แบบใช้แล้วทิ้งภายในเครื่อง จึงไม่มีพูลข้อมูลประจำตัวร่วมให้เช่าใช้

## โปรไฟล์

โปรไฟล์ที่เลือกจะกำหนดว่าสถานการณ์ใดจะรัน

| โปรไฟล์        | ใช้สำหรับ                                                                                                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (ค่าเริ่มต้น) | แค็ตตาล็อกทั้งหมด ช้าแต่ครอบคลุมครบถ้วน                                                                                                                                                                                             |
| `fast`          | ชุดย่อยสำหรับเกตของรีลีสที่ทดสอบสัญญาทรานสปอร์ตจริง: canary, mention gating, allowlist block, reply shape, restart resume, thread follow-up, thread isolation, reaction observation และการส่งมอบเมทาดาทาการอนุมัติ exec |
| `transport`     | สถานการณ์ระดับทรานสปอร์ตเกี่ยวกับ threading, DM, room, autojoin, mention/allowlist, approval และ reaction                                                                                                                            |
| `media`         | ความครอบคลุมไฟล์แนบรูปภาพ เสียง วิดีโอ PDF และ EPUB                                                                                                                                                                                |
| `e2ee-smoke`    | ความครอบคลุม E2EE ขั้นต่ำ - การตอบกลับที่เข้ารหัสพื้นฐาน, thread follow-up, bootstrap สำเร็จ                                                                                                                                      |
| `e2ee-deep`     | สถานการณ์ E2EE แบบครอบคลุมเกี่ยวกับการสูญเสีย state, backup, key และ recovery                                                                                                                                                       |
| `e2ee-cli`      | สถานการณ์ CLI ของ `openclaw matrix encryption setup` และ `verify *` ที่ขับผ่าน QA harness                                                                                                                                           |

การแมปที่แน่นอนอยู่ใน `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`

## สถานการณ์

รายการ ID สถานการณ์ทั้งหมดคือ union `MatrixQaScenarioId` ใน `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` หมวดหมู่ประกอบด้วย:

- threading - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- top-level / DM / room - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming และความคืบหน้าของเครื่องมือ - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reactions - `matrix-reaction-*`
- approvals - `matrix-approval-*` (เมทาดาทา exec/plugin, chunked fallback, deny reactions, threads และการ routing แบบ `target: "both"`)
- restart และ replay - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention gating, bot-to-bot และ allowlists - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (การตอบกลับพื้นฐาน, thread follow-up, bootstrap, วงจรชีวิต recovery key, ตัวแปร state-loss, พฤติกรรม server backup, device hygiene, การยืนยัน SAS / QR / DM, restart, การ redact อาร์ติแฟกต์)
- E2EE CLI - `matrix-e2ee-cli-*` (encryption setup, การตั้งค่าแบบ idempotent, bootstrap failure, วงจรชีวิต recovery-key, หลายบัญชี, gateway-reply round-trip, self-verification)

ส่ง `--scenario <id>` (ทำซ้ำได้) เพื่อรันชุดที่เลือกเอง; รวมกับ `--profile all` เพื่อไม่สนใจ profile gating

## ตัวแปรสภาพแวดล้อม

| ตัวแปร                                | ค่าเริ่มต้น                                   | ผลกระทบ                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 นาที)                        | ขอบเขตเวลาสูงสุดแบบเด็ดขาดสำหรับการรันทั้งหมด                                                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | ขอบเขตเวลาสำหรับการตอบกลับ canary เริ่มต้น CI สำหรับรีลีสจะเพิ่มค่านี้บนรันเนอร์ที่ใช้ร่วมกัน เพื่อไม่ให้เทิร์น Gateway แรกที่ช้าทำให้ล้มเหลวก่อนเริ่มครอบคลุมสถานการณ์ทดสอบ                                       |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | ช่วงเวลาเงียบสำหรับการยืนยันเชิงลบแบบไม่มีการตอบกลับ ถูกจำกัดไว้ที่ `≤` เวลาหมดอายุของการรัน                                                                                                                 |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | ขอบเขตเวลาสำหรับการรื้อถอน Docker พื้นผิวความล้มเหลวจะรวมคำสั่งกู้คืน `docker compose ... down --remove-orphans`                                                                           |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | แทนที่อิมเมจ homeserver เมื่อตรวจสอบกับ Tuwunel เวอร์ชันอื่น                                                                                                             |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | เปิด                                        | `0` ปิดบรรทัดความคืบหน้า `[matrix-qa] ...` บน stderr `1` บังคับให้เปิด                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | ปกปิดแล้ว                                  | `1` เก็บเนื้อหาข้อความและ `formatted_body` ใน `matrix-qa-observed-events.json` ค่าเริ่มต้นจะปกปิดเพื่อให้อาร์ติแฟกต์ CI ปลอดภัย                                                                    |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | ปิด                                       | `1` ข้าม `process.exit` แบบกำหนดแน่นอนหลังเขียนอาร์ติแฟกต์ ค่าเริ่มต้นบังคับให้ออก เพราะแฮนเดิลคริปโตเนทีฟของ matrix-js-sdk อาจทำให้ event loop ยังทำงานต่อหลังอาร์ติแฟกต์เสร็จสมบูรณ์ |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | ไม่ได้ตั้งค่า                                     | เมื่อตั้งค่าโดยตัวเรียกใช้งานภายนอก (เช่น `scripts/run-node.mjs`) Matrix QA จะใช้พาธบันทึกนั้นซ้ำแทนการเริ่ม tee ของตัวเอง                                                                   |

## อาร์ติแฟกต์ผลลัพธ์

เขียนไปยัง `--output-dir`:

- `matrix-qa-report.md` - รายงานโปรโตคอล Markdown (สิ่งที่ผ่าน ล้มเหลว ถูกข้าม และเหตุผล)
- `matrix-qa-summary.json` - สรุปแบบมีโครงสร้างที่เหมาะสำหรับการแยกวิเคราะห์ของ CI และแดชบอร์ด
- `matrix-qa-observed-events.json` - เหตุการณ์ Matrix ที่สังเกตได้จากไคลเอนต์ไดรเวอร์และไคลเอนต์ผู้สังเกตการณ์ เนื้อหาจะถูกปกปิด เว้นแต่ `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; เมตาดาต้าการอนุมัติจะถูกสรุปด้วยฟิลด์ที่ปลอดภัยที่เลือกไว้และตัวอย่างคำสั่งที่ตัดให้สั้นลง
- `matrix-qa-output.log` - stdout/stderr รวมจากการรัน หากตั้งค่า `OPENCLAW_RUN_NODE_OUTPUT_LOG` จะใช้บันทึกของตัวเรียกใช้งานภายนอกซ้ำแทน

ไดเรกทอรีผลลัพธ์เริ่มต้นคือ `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` เพื่อให้การรันต่อเนื่องไม่เขียนทับกัน

## เคล็ดลับการคัดแยก

- **การรันค้างใกล้จุดจบ:** แฮนเดิลคริปโตเนทีฟของ `matrix-js-sdk` อาจมีอายุนานกว่าฮาร์เนส ค่าเริ่มต้นจะบังคับ `process.exit` แบบสะอาดหลังเขียนอาร์ติแฟกต์; หากคุณยกเลิกการตั้งค่า `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` คาดได้ว่าโปรเซสจะค้างต่อ
- **ข้อผิดพลาดการล้างข้อมูล:** มองหาคำสั่งกู้คืนที่พิมพ์ออกมา (การเรียกใช้ `docker compose ... down --remove-orphans`) แล้วรันด้วยตนเองเพื่อปล่อยพอร์ต homeserver
- **ช่วงเวลาการยืนยันเชิงลบไม่เสถียรใน CI:** ลด `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (ค่าเริ่มต้น 8 วินาที) เมื่อ CI เร็ว; เพิ่มค่านี้บนรันเนอร์ที่ใช้ร่วมกันที่ช้า
- **ต้องการเนื้อหาที่ปกปิดแล้วสำหรับรายงานบั๊ก:** รันซ้ำด้วย `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` แล้วแนบ `matrix-qa-observed-events.json` ให้ถือว่าอาร์ติแฟกต์ที่ได้เป็นข้อมูลอ่อนไหว
- **Tuwunel เวอร์ชันอื่น:** ชี้ `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ไปยังเวอร์ชันที่กำลังทดสอบ เลนจะตรวจเฉพาะอิมเมจค่าเริ่มต้นที่ปักหมุดไว้เท่านั้น

## สัญญาการขนส่งแบบสด

Matrix เป็นหนึ่งในสามเลนการขนส่งแบบสด (Matrix, Telegram, Discord) ที่ใช้เช็กลิสต์สัญญาเดียวกันซึ่งกำหนดไว้ใน [ภาพรวม QA → การครอบคลุมการขนส่งแบบสด](/th/concepts/qa-e2e-automation#live-transport-coverage) `qa-channel` ยังคงเป็นชุดสังเคราะห์แบบกว้าง และตั้งใจให้ไม่เป็นส่วนหนึ่งของเมทริกซ์นั้น

## ที่เกี่ยวข้อง

- [ภาพรวม QA](/th/concepts/qa-e2e-automation) - สแต็ก QA โดยรวมและสัญญาการขนส่งแบบสด
- [QA Channel](/th/channels/qa-channel) - อะแดปเตอร์ช่องทางสังเคราะห์สำหรับสถานการณ์ที่อิงกับรีโป
- [การทดสอบ](/th/help/testing) - การรันการทดสอบและการเพิ่มความครอบคลุม QA
- [Matrix](/th/channels/matrix) - Plugin ช่องทางที่อยู่ระหว่างการทดสอบ
