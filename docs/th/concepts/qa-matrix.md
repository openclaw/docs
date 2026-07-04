---
read_when:
    - กำลังรัน pnpm openclaw qa matrix ภายในเครื่อง
    - การเพิ่มหรือเลือกสถานการณ์ QA ของ Matrix
    - การคัดแยกปัญหาความล้มเหลวของ QA สำหรับ Matrix, การหมดเวลา หรือการล้างข้อมูลที่ค้างอยู่
summary: 'ข้อมูลอ้างอิงสำหรับผู้ดูแลสำหรับเลน QA แบบ live ของ Matrix ที่รองรับด้วย Docker: CLI, โปรไฟล์, env vars, สถานการณ์จำลอง และอาร์ติแฟกต์ผลลัพธ์'
title: Matrix QA
x-i18n:
    generated_at: "2026-07-04T20:46:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4f7fd98b5e7fef7a30c8820c5a1fc48c199e4d09db34255e8b2287a047b339f
    source_path: concepts/qa-matrix.md
    workflow: 16
---

เลน Matrix QA รัน Plugin `@openclaw/matrix` ที่รวมมา กับ Tuwunel homeserver แบบใช้แล้วทิ้งใน Docker โดยมีบัญชี driver, SUT และ observer ชั่วคราว รวมถึงห้องที่เตรียมข้อมูลไว้ เลนนี้คือการครอบคลุมแบบ live transport-real สำหรับ Matrix

นี่เป็นเครื่องมือสำหรับผู้ดูแลเท่านั้น OpenClaw รุ่นแพ็กเกจจงใจไม่รวม `qa-lab` ดังนั้น `openclaw qa` จึงใช้ได้จาก source checkout เท่านั้น Source checkout จะโหลด runner ที่รวมมาโดยตรง - ไม่ต้องมีขั้นตอนติดตั้ง Plugin

สำหรับบริบทของเฟรมเวิร์ก QA ที่กว้างขึ้น ดู [ภาพรวม QA](/th/concepts/qa-e2e-automation)

## เริ่มต้นอย่างรวดเร็ว

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

`pnpm openclaw qa matrix` แบบธรรมดาจะรัน `--profile all` และจะไม่หยุดเมื่อเกิดความล้มเหลวครั้งแรก ใช้ `--profile fast --fail-fast` สำหรับเกตการปล่อยรุ่น; แบ่ง shard แค็ตตาล็อกด้วย `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` เมื่อรัน inventory เต็มแบบขนาน

## สิ่งที่เลนนี้ทำ

1. Provision Tuwunel homeserver แบบใช้แล้วทิ้งใน Docker (อิมเมจเริ่มต้น `ghcr.io/matrix-construct/tuwunel:v1.5.1`, ชื่อเซิร์ฟเวอร์ `matrix-qa.test`, พอร์ต `28008`) ไว้หลังตัวบันทึก request/response แบบมีขอบเขตและ redact
2. ลงทะเบียนผู้ใช้ชั่วคราวสามราย - `driver` (ส่งทราฟฟิกขาเข้า), `sut` (บัญชี OpenClaw Matrix ที่อยู่ระหว่างทดสอบ), `observer` (จับทราฟฟิกของบุคคลที่สาม)
3. เตรียมห้องที่สถานการณ์ที่เลือกต้องใช้ (main, threading, media, restart, secondary, allowlist, E2EE, verification DM และอื่น ๆ)
4. รันโพรบโปรโตคอล `matrix-qa-v1` ที่เป็นกลางต่อ substrate กับขอบเขต Tuwunel ที่บันทึกไว้ Unit test พิสูจน์สัญญาของโพรบด้วย fixture โปรโตคอล Matrix; โฮสต์ adapter สำหรับ QA transport ตามมาตรฐานใน [#99707](https://github.com/openclaw/openclaw/pull/99707) เป็นเจ้าของการต่อสาย target Crabline จริง
5. เริ่ม Gateway ลูกของ OpenClaw พร้อม Plugin Matrix จริงที่จำกัดขอบเขตไว้กับบัญชี SUT; `qa-channel` จะไม่ถูกโหลดในลูก
6. รันสถานการณ์ตามลำดับ โดยสังเกตอีเวนต์ผ่านไคลเอนต์ Matrix ของ driver/observer และอนุมานความคาดหวังด้าน route/state จากทราฟฟิกที่บันทึกไว้
7. ปิด homeserver, เขียนรายงานและ artifact หลักฐาน แล้วจึงออก

## CLI

```text
pnpm openclaw qa matrix [options]
```

### แฟล็กทั่วไป

| แฟล็ก                  | ค่าเริ่มต้น                                       | คำอธิบาย                                                                                                                                   |
| --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | โปรไฟล์สถานการณ์ ดู [โปรไฟล์](#profiles)                                                                                                  |
| `--fail-fast`         | ปิด                                           | หยุดหลังจากเช็กหรือสถานการณ์แรกที่ล้มเหลว                                                                                                |
| `--scenario <id>`     | -                                             | รันเฉพาะสถานการณ์นี้ ทำซ้ำได้ ดู [สถานการณ์](#scenarios)                                                                              |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | ตำแหน่งที่เขียนรายงาน สรุป inventory ของ route/state อีเวนต์ที่สังเกตได้ และ output log พาธสัมพัทธ์จะ resolve เทียบกับ `--repo-root` |
| `--repo-root <path>`  | `process.cwd()`                               | รูทของ repository เมื่อเรียกใช้จากไดเรกทอรีทำงานที่เป็นกลาง                                                                               |
| `--sut-account <id>`  | `sut`                                         | id บัญชี Matrix ภายใน config ของ QA gateway                                                                                               |

### แฟล็ก Provider

เลนนี้ใช้ transport Matrix จริง แต่ provider ของโมเดลกำหนดค่าได้:

| แฟล็ก                     | ค่าเริ่มต้น          | คำอธิบาย                                                                                                                               |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` สำหรับ dispatch mock แบบกำหนดผลได้ หรือ `live-frontier` สำหรับ provider frontier แบบ live alias เดิม `live-openai` ยังใช้งานได้ |
| `--model <ref>`          | ค่าเริ่มต้นของ provider | ref `provider/model` หลัก                                                                                                             |
| `--alt-model <ref>`      | ค่าเริ่มต้นของ provider | ref `provider/model` สำรองที่สถานการณ์ใช้เมื่อสลับกลางรัน                                                                            |
| `--fast`                 | ปิด              | เปิดใช้โหมดเร็วของ provider เมื่อรองรับ                                                                                                |

Matrix QA ไม่รับ `--credential-source` หรือ `--credential-role` เลนนี้ provision ผู้ใช้แบบใช้แล้วทิ้งภายในเครื่อง; ไม่มี credential pool ที่ใช้ร่วมกันให้ lease

## โปรไฟล์

โปรไฟล์ที่เลือกจะกำหนดว่าสถานการณ์ใดถูกรัน

| โปรไฟล์         | ใช้สำหรับ                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (ค่าเริ่มต้น) | แค็ตตาล็อกเต็ม ช้าแต่ครอบคลุม                                                                                                                                                                                                   |
| `fast`          | ชุดย่อยสำหรับเกตการปล่อยรุ่นที่ออกกำลังสัญญา transport แบบ live: canary, mention gating, allowlist block, reply shape, restart resume, thread follow-up, thread isolation, reaction observation และการส่ง metadata อนุมัติ exec |
| `transport`     | สถานการณ์ระดับ transport สำหรับ threading, DM, room, autojoin, mention/allowlist, approval และ reaction                                                                                                                                  |
| `media`         | การครอบคลุม attachment แบบรูปภาพ เสียง วิดีโอ PDF และ EPUB                                                                                                                                                                                  |
| `e2ee-smoke`    | การครอบคลุม E2EE ขั้นต่ำ - encrypted reply พื้นฐาน, thread follow-up, bootstrap success                                                                                                                                                  |
| `e2ee-deep`     | สถานการณ์ E2EE แบบครอบคลุมสำหรับ state-loss, backup, key และ recovery                                                                                                                                                                     |
| `e2ee-cli`      | สถานการณ์ CLI ของ `openclaw matrix encryption setup` และ `verify *` ที่ขับผ่าน QA harness                                                                                                                                       |

การแมปที่แน่นอนอยู่ใน `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`

## สถานการณ์

รายการ id สถานการณ์เต็มคือ union `MatrixQaScenarioId` ใน `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` หมวดหมู่ประกอบด้วย:

- threading - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- top-level / DM / room - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming และความคืบหน้าของเครื่องมือ - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reactions - `matrix-reaction-*`
- approvals - `matrix-approval-*` (metadata ของ exec/plugin, fallback แบบแบ่ง chunk, deny reactions, threads และการ routing แบบ `target: "both"`)
- restart และ replay - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention gating, bot-to-bot และ allowlists - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (reply พื้นฐาน, thread follow-up, bootstrap, lifecycle ของ recovery key, ตัวแปร state-loss, พฤติกรรม server backup, device hygiene, การยืนยัน SAS / QR / DM, restart, artifact redaction)
- E2EE CLI - `matrix-e2ee-cli-*` (encryption setup, setup แบบ idempotent, bootstrap failure, lifecycle ของ recovery-key, multi-account, gateway-reply round-trip, self-verification)

ส่ง `--scenario <id>` (ทำซ้ำได้) เพื่อรันชุดที่เลือกเอง; ใช้ร่วมกับ `--profile all` เพื่อข้าม profile gating

## ตัวแปรสภาพแวดล้อม

| ตัวแปร                                  | ค่าเริ่มต้น                                | ผล                                                                                                                                                                                                  |
| --------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 นาที)                       | ขีดจำกัดสูงสุดแบบเด็ดขาดของการรันทั้งหมด                                                                                                                                                           |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | ขีดจำกัดสำหรับการตอบกลับ canary เริ่มต้น CI รุ่นเผยแพร่จะเพิ่มค่านี้บนรันเนอร์ที่ใช้ร่วมกัน เพื่อไม่ให้ Gateway turn แรกที่ช้าทำให้ล้มเหลวก่อนเริ่มความครอบคลุมของสถานการณ์                      |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | ช่วงเวลาเงียบสำหรับการยืนยันเชิงลบว่าไม่มีการตอบกลับ จำกัดไม่ให้เกิน `≤` timeout ของการรัน                                                                                                         |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | ขีดจำกัดสำหรับการ teardown ของ Docker พื้นผิวข้อผิดพลาดจะรวมคำสั่งกู้คืน `docker compose ... down --remove-orphans`                                                                                |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | แทนที่อิมเมจ homeserver เมื่อตรวจสอบกับ Tuwunel เวอร์ชันอื่น                                                                                                                                        |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | เปิด                                      | `0` ปิดบรรทัดความคืบหน้า `[matrix-qa] ...` บน stderr `1` บังคับให้เปิด                                                                                                                              |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | ปกปิดข้อมูล                               | `1` เก็บเนื้อหาข้อความและ `formatted_body` ไว้ใน `matrix-qa-observed-events.json` ค่าเริ่มต้นจะปกปิดข้อมูลเพื่อให้ artifacts ของ CI ปลอดภัย                                                       |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | ปิด                                       | `1` ข้าม `process.exit` แบบกำหนดผลลัพธ์แน่นอนหลังเขียน artifact ค่าเริ่มต้นจะบังคับออก เพราะ native crypto handles ของ matrix-js-sdk อาจทำให้ event loop ยังทำงานต่อหลัง artifact เสร็จสมบูรณ์ |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | ไม่ได้ตั้งค่า                             | เมื่อตั้งค่าโดย launcher ภายนอก (เช่น `scripts/run-node.mjs`) Matrix QA จะใช้พาธ log นั้นซ้ำแทนการเริ่ม tee ของตัวเอง                                                                              |

## Artifacts เอาต์พุต

เขียนไปยัง `--output-dir`:

- `matrix-qa-report.md` - รายงานโปรโตคอล Markdown (อะไรผ่าน ล้มเหลว ถูกข้าม และเพราะอะไร)
- `matrix-qa-summary.json` - สรุปแบบมีโครงสร้างที่เหมาะสำหรับการแยกวิเคราะห์ใน CI และแดชบอร์ด
- `matrix-qa-route-state-manifest.json` - อินเวนทอรี `matrix-qa-v1` แบบไดนามิกที่ใช้ id ของสถานการณ์เป็นคีย์ บันทึกรูปร่าง route/body ที่ปกปิดข้อมูล ลำดับคำขอ retry ที่สังเกตพบ ข้อผิดพลาด ความต่อเนื่องของ sync-token และกลุ่มสถานะ device/key/media/backup ที่สังเกตพบระหว่างการรันนั้น นี่คือหลักฐานที่นำไปดำเนินการได้ ไม่ใช่ baseline ที่ check-in
- `matrix-qa-observed-events.json` - เหตุการณ์ Matrix ที่สังเกตพบจากไคลเอนต์ driver และ observer เนื้อหาจะถูกปกปิดข้อมูลเว้นแต่ตั้งค่า `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; metadata การอนุมัติจะถูกสรุปด้วยฟิลด์ที่ปลอดภัยบางรายการและพรีวิวคำสั่งที่ถูกตัดให้สั้นลง
- `matrix-qa-output.log` - stdout/stderr รวมจากการรัน หากตั้งค่า `OPENCLAW_RUN_NODE_OUTPUT_LOG` จะใช้ log ของ launcher ภายนอกซ้ำแทน

ไดเรกทอรีเอาต์พุตเริ่มต้นคือ `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` เพื่อให้การรันต่อเนื่องไม่เขียนทับกัน

## เคล็ดลับการคัดแยกปัญหา

- **การรันค้างใกล้จบ:** native crypto handles ของ `matrix-js-sdk` อาจมีอายุยาวกว่า harness ค่าเริ่มต้นจะบังคับ `process.exit` อย่างสะอาดหลังเขียน artifact; หากคุณยกเลิกการตั้งค่า `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` ให้คาดว่ากระบวนการจะยังค้างอยู่
- **ข้อผิดพลาดการ cleanup:** มองหาคำสั่งกู้คืนที่พิมพ์ออกมา (การเรียกใช้ `docker compose ... down --remove-orphans`) แล้วรันด้วยตนเองเพื่อปล่อยพอร์ตของ homeserver
- **ช่วงเวลา negative-assertion ไม่เสถียรใน CI:** ลด `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (ค่าเริ่มต้น 8 วินาที) เมื่อ CI เร็ว; เพิ่มค่านี้บนรันเนอร์ที่ใช้ร่วมกันซึ่งช้า
- **ต้องการเนื้อหาที่ปกปิดข้อมูลสำหรับรายงานบั๊ก:** รันซ้ำด้วย `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` แล้วแนบ `matrix-qa-observed-events.json` ให้ถือว่า artifact ที่ได้เป็นข้อมูลอ่อนไหว
- **Tuwunel เวอร์ชันอื่น:** ชี้ `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ไปยังเวอร์ชันที่กำลังทดสอบ lane จะตรวจสอบเฉพาะอิมเมจค่าเริ่มต้นที่ pin ไว้เท่านั้น

## สัญญา live transport

Matrix เป็นหนึ่งในสาม live transport lanes (Matrix, Telegram, Discord) ที่ใช้ checklist สัญญาเดียวกันซึ่งกำหนดไว้ใน [ภาพรวม QA → ความครอบคลุม live transport](/th/concepts/qa-e2e-automation#live-transport-coverage) `qa-channel` ยังคงเป็นชุดทดสอบสังเคราะห์แบบกว้าง และตั้งใจไม่รวมอยู่ใน matrix นั้น

## ที่เกี่ยวข้อง

- [ภาพรวม QA](/th/concepts/qa-e2e-automation) - สแต็ก QA โดยรวมและสัญญา live transport
- [QA Channel](/th/channels/qa-channel) - อะแดปเตอร์ช่องสังเคราะห์สำหรับสถานการณ์ที่อ้างอิง repo
- [การทดสอบ](/th/help/testing) - การรันการทดสอบและการเพิ่มความครอบคลุม QA
- [Matrix](/th/channels/matrix) - Plugin ของช่องที่อยู่ระหว่างการทดสอบ
