---
read_when:
    - การเรียกใช้ pnpm openclaw qa matrix ภายในเครื่อง
    - การเพิ่มหรือเลือกสถานการณ์การทดสอบคุณภาพของ Matrix
    - การคัดแยกปัญหาความล้มเหลวของ Matrix QA, การหมดเวลา หรือการล้างข้อมูลที่ค้างอยู่
summary: 'เอกสารอ้างอิงสำหรับผู้ดูแลสำหรับเลน QA สดของ Matrix ที่รองรับด้วย Docker: CLI, โปรไฟล์, ตัวแปรสภาพแวดล้อม, สถานการณ์ และอาร์ติแฟกต์เอาต์พุต'
title: QA แบบเมทริกซ์
x-i18n:
    generated_at: "2026-04-30T09:48:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab862474e2abe45a1dcd66f025e3a3dd52a3417b0c1f42a26cd7944dd4053f5
    source_path: concepts/qa-matrix.md
    workflow: 16
---

เลน QA ของ Matrix รัน Plugin `@openclaw/matrix` ที่บันเดิลมา เทียบกับโฮมเซิร์ฟเวอร์ Tuwunel แบบใช้แล้วทิ้งใน Docker พร้อมบัญชีชั่วคราวสำหรับ driver, SUT และ observer รวมถึงห้องที่ตั้งค่าล่วงหน้าไว้ เลนนี้คือความครอบคลุมแบบสดที่ใช้ทรานสปอร์ตจริงสำหรับ Matrix

นี่เป็นเครื่องมือสำหรับผู้ดูแลเท่านั้น รุ่นเผยแพร่ของ OpenClaw ที่แพ็กเกจแล้วจงใจไม่รวม `qa-lab` ดังนั้น `openclaw qa` จึงใช้งานได้จากซอร์สเช็กเอาต์เท่านั้น ซอร์สเช็กเอาต์โหลดรันเนอร์ที่บันเดิลมาโดยตรง — ไม่จำเป็นต้องมีขั้นตอนติดตั้ง Plugin

สำหรับบริบทที่กว้างขึ้นของเฟรมเวิร์ก QA โปรดดู [ภาพรวม QA](/th/concepts/qa-e2e-automation)

## เริ่มต้นอย่างรวดเร็ว

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

`pnpm openclaw qa matrix` แบบปกติจะรัน `--profile all` และไม่หยุดเมื่อเกิดความล้มเหลวครั้งแรก ใช้ `--profile fast --fail-fast` สำหรับเกตการเผยแพร่ แบ่งแค็ตตาล็อกด้วย `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` เมื่อรันรายการทั้งหมดแบบขนาน

## สิ่งที่เลนทำ

1. จัดเตรียมโฮมเซิร์ฟเวอร์ Tuwunel แบบใช้แล้วทิ้งใน Docker (อิมเมจเริ่มต้น `ghcr.io/matrix-construct/tuwunel:v1.5.1`, ชื่อเซิร์ฟเวอร์ `matrix-qa.test`, พอร์ต `28008`)
2. ลงทะเบียนผู้ใช้ชั่วคราวสามราย — `driver` (ส่งทราฟฟิกขาเข้า), `sut` (บัญชี Matrix ของ OpenClaw ที่อยู่ระหว่างทดสอบ), `observer` (จับทราฟฟิกของบุคคลที่สาม)
3. ตั้งค่าห้องที่จำเป็นสำหรับสถานการณ์ที่เลือกไว้ล่วงหน้า (main, threading, media, restart, secondary, allowlist, E2EE, verification DM ฯลฯ)
4. เริ่ม Gateway ลูกของ OpenClaw พร้อม Plugin Matrix จริงที่จำกัดขอบเขตไว้กับบัญชี SUT; `qa-channel` จะไม่ถูกโหลดในลูก
5. รันสถานการณ์ตามลำดับ โดยสังเกตเหตุการณ์ผ่านไคลเอนต์ Matrix ของ driver/observer
6. รื้อถอนโฮมเซิร์ฟเวอร์ เขียนรายงานและอาร์ติแฟกต์สรุป จากนั้นออก

## CLI

```text
pnpm openclaw qa matrix [options]
```

### แฟล็กทั่วไป

| แฟล็ก                  | ค่าเริ่มต้น                                       | คำอธิบาย                                                                                                            |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | โปรไฟล์สถานการณ์ ดู [โปรไฟล์](#profiles)                                                                           |
| `--fail-fast`         | ปิด                                           | หยุดหลังจากการตรวจสอบหรือสถานการณ์แรกที่ล้มเหลว                                                                         |
| `--scenario <id>`     | —                                             | รันเฉพาะสถานการณ์นี้ ทำซ้ำได้ ดู [สถานการณ์](#scenarios)                                                       |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | ตำแหน่งที่เขียนรายงาน สรุป เหตุการณ์ที่สังเกตได้ และบันทึกเอาต์พุต พาธสัมพัทธ์จะอิงกับ `--repo-root` |
| `--repo-root <path>`  | `process.cwd()`                               | รากของรีโพซิทอรีเมื่อเรียกใช้จากไดเรกทอรีทำงานที่เป็นกลาง                                                        |
| `--sut-account <id>`  | `sut`                                         | รหัสบัญชี Matrix ภายในคอนฟิก Gateway ของ QA                                                                        |

### แฟล็กผู้ให้บริการ

เลนนี้ใช้ทรานสปอร์ต Matrix จริง แต่สามารถกำหนดค่าผู้ให้บริการโมเดลได้:

| แฟล็ก                     | ค่าเริ่มต้น          | คำอธิบาย                                                                                                                               |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` สำหรับการส่งแบบม็อกที่กำหนดผลได้ หรือ `live-frontier` สำหรับผู้ให้บริการ frontier แบบสด นามแฝงเดิม `live-openai` ยังใช้งานได้ |
| `--model <ref>`          | ค่าเริ่มต้นของผู้ให้บริการ | ref หลักแบบ `provider/model`                                                                                                             |
| `--alt-model <ref>`      | ค่าเริ่มต้นของผู้ให้บริการ | ref สำรองแบบ `provider/model` เมื่อสถานการณ์สลับโมเดลระหว่างรัน                                                                            |
| `--fast`                 | ปิด              | เปิดใช้โหมดเร็วของผู้ให้บริการเมื่อรองรับ                                                                                                |

Matrix QA ไม่รับ `--credential-source` หรือ `--credential-role` เลนนี้จัดเตรียมผู้ใช้แบบใช้แล้วทิ้งภายในเครื่อง จึงไม่มีพูลข้อมูลประจำตัวร่วมให้เช่าใช้

## โปรไฟล์

โปรไฟล์ที่เลือกจะกำหนดว่าสถานการณ์ใดถูกเรียกใช้

| โปรไฟล์         | ใช้สำหรับ                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (ค่าเริ่มต้น) | แค็ตตาล็อกเต็ม ช้าแต่ครอบคลุม                                                                                                                                                                                                   |
| `fast`          | ชุดย่อยสำหรับเกตการเผยแพร่ที่ทดสอบสัญญาทรานสปอร์ตจริง: canary, การกั้นด้วย mention, การบล็อก allowlist, รูปแบบการตอบกลับ, การกลับมาทำงานหลังรีสตาร์ต, การติดตามผลในเธรด, การแยกเธรด, การสังเกต reaction และการส่งเมตาดาต้าการอนุมัติ exec |
| `transport`     | สถานการณ์ระดับทรานสปอร์ตสำหรับ threading, DM, ห้อง, autojoin, mention/allowlist, การอนุมัติ และ reaction                                                                                                                                  |
| `media`         | ความครอบคลุมไฟล์แนบรูปภาพ เสียง วิดีโอ PDF และ EPUB                                                                                                                                                                                  |
| `e2ee-smoke`    | ความครอบคลุม E2EE ขั้นต่ำ — การตอบกลับแบบเข้ารหัสพื้นฐาน, การติดตามผลในเธรด, การ bootstrap สำเร็จ                                                                                                                                                  |
| `e2ee-deep`     | สถานการณ์ E2EE แบบครอบคลุมเกี่ยวกับการสูญเสียสถานะ การสำรองข้อมูล คีย์ และการกู้คืน                                                                                                                                                                     |
| `e2ee-cli`      | สถานการณ์ CLI สำหรับ `openclaw matrix encryption setup` และ `verify *` ที่ขับเคลื่อนผ่าน QA harness                                                                                                                                       |

การแมปที่แน่นอนอยู่ใน `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`

## สถานการณ์

รายการรหัสสถานการณ์ทั้งหมดคือยูเนียน `MatrixQaScenarioId` ใน `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` หมวดหมู่ประกอบด้วย:

- threading — `matrix-thread-*`, `matrix-subagent-thread-spawn`
- ระดับบนสุด / DM / ห้อง — `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- การสตรีมและความคืบหน้าของเครื่องมือ — `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- สื่อ — `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- การกำหนดเส้นทาง — `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reactions — `matrix-reaction-*`
- การอนุมัติ — `matrix-approval-*` (เมตาดาต้า exec/Plugin, fallback แบบแบ่งชิ้น, reactions สำหรับปฏิเสธ, เธรด และการกำหนดเส้นทาง `target: "both"`)
- การรีสตาร์ตและการเล่นซ้ำ — `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- การกั้นด้วย mention, bot-to-bot และ allowlists — `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE — `matrix-e2ee-*` (การตอบกลับพื้นฐาน, การติดตามผลในเธรด, bootstrap, วงจรชีวิตของ recovery key, รูปแบบการสูญเสียสถานะ, พฤติกรรมการสำรองข้อมูลบนเซิร์ฟเวอร์, สุขอนามัยของอุปกรณ์, การยืนยัน SAS / QR / DM, การรีสตาร์ต, การปกปิดอาร์ติแฟกต์)
- E2EE CLI — `matrix-e2ee-cli-*` (การตั้งค่าการเข้ารหัส, การตั้งค่าแบบ idempotent, ความล้มเหลวของ bootstrap, วงจรชีวิตของ recovery-key, หลายบัญชี, การไปกลับของ gateway-reply, การยืนยันตนเอง)

ส่ง `--scenario <id>` (ทำซ้ำได้) เพื่อรันชุดที่เลือกเอง รวมกับ `--profile all` เพื่อไม่สนใจการกั้นด้วยโปรไฟล์

## ตัวแปรสภาพแวดล้อม

| ตัวแปร                                | ค่าเริ่มต้น                                   | ผล                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 นาที)                        | ขอบเขตเวลาสูงสุดแบบตายตัวสำหรับการรันทั้งหมด                                                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | ขอบเขตเวลาสำหรับการตอบกลับ canary เริ่มต้น Release CI จะเพิ่มค่านี้บนรันเนอร์ที่ใช้ร่วมกัน เพื่อไม่ให้รอบแรกของ gateway ที่ช้าล้มเหลวก่อนที่ความครอบคลุมของสถานการณ์จะเริ่มต้น                                       |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | ช่วงเวลานิ่งสำหรับการยืนยันเชิงลบว่าไม่มีการตอบกลับ ถูกจำกัดไม่ให้เกิน `≤` timeout ของการรัน                                                                                                                 |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | ขอบเขตเวลาสำหรับการรื้อถอน Docker พื้นผิวความล้มเหลวจะรวมคำสั่งกู้คืน `docker compose ... down --remove-orphans`                                                                           |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | แทนที่อิมเมจ homeserver เมื่อตรวจสอบกับ Tuwunel เวอร์ชันอื่น                                                                                                             |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | เปิด                                        | `0` ปิดบรรทัดความคืบหน้า `[matrix-qa] ...` บน stderr `1` บังคับให้เปิด                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | ถูกปกปิด                                  | `1` เก็บเนื้อหาข้อความและ `formatted_body` ไว้ใน `matrix-qa-observed-events.json` ค่าเริ่มต้นจะปกปิดเพื่อให้อาร์ทิแฟกต์ CI ปลอดภัย                                                                    |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | ปิด                                       | `1` ข้าม `process.exit` แบบกำหนดแน่นอนหลังเขียนอาร์ทิแฟกต์ ค่าเริ่มต้นจะบังคับออก เพราะ handle crypto แบบ native ของ matrix-js-sdk อาจทำให้ event loop ยังทำงานอยู่หลังอาร์ทิแฟกต์เสร็จสิ้น |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | ไม่ได้ตั้งค่า                                     | เมื่อตั้งค่าโดยตัวเรียกใช้งานภายนอก (เช่น `scripts/run-node.mjs`) Matrix QA จะใช้พาธ log นั้นซ้ำ แทนที่จะเริ่ม tee ของตัวเอง                                                                   |

## อาร์ทิแฟกต์ผลลัพธ์

เขียนไปยัง `--output-dir`:

- `matrix-qa-report.md` — รายงานโปรโตคอล Markdown (สิ่งที่ผ่าน ล้มเหลว ถูกข้าม และเหตุผล)
- `matrix-qa-summary.json` — สรุปแบบมีโครงสร้างที่เหมาะสำหรับการแยกวิเคราะห์ของ CI และแดชบอร์ด
- `matrix-qa-observed-events.json` — เหตุการณ์ Matrix ที่สังเกตได้จากไคลเอนต์ driver และ observer เนื้อหาจะถูกปกปิด เว้นแต่ตั้งค่า `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; เมตาดาต้าการอนุมัติจะถูกสรุปด้วยฟิลด์ปลอดภัยที่เลือกไว้ และตัวอย่างคำสั่งแบบตัดทอน
- `matrix-qa-output.log` — stdout/stderr รวมจากการรัน หากตั้งค่า `OPENCLAW_RUN_NODE_OUTPUT_LOG` จะใช้ log ของตัวเรียกใช้งานภายนอกแทน

ไดเรกทอรีผลลัพธ์เริ่มต้นคือ `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` เพื่อให้การรันต่อเนื่องไม่เขียนทับกัน

## เคล็ดลับการคัดแยก

- **การรันค้างใกล้ตอนจบ:** handle crypto แบบ native ของ `matrix-js-sdk` อาจมีอายุยืนกว่า harness ค่าเริ่มต้นจะบังคับ `process.exit` อย่างสะอาดหลังเขียนอาร์ทิแฟกต์ หากคุณยกเลิกการตั้งค่า `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` ให้คาดว่ากระบวนการจะค้างอยู่ต่อ
- **ข้อผิดพลาดการล้างข้อมูล:** มองหาคำสั่งกู้คืนที่พิมพ์ออกมา (การเรียกใช้ `docker compose ... down --remove-orphans`) แล้วรันด้วยตนเองเพื่อปล่อยพอร์ต homeserver
- **ช่วงเวลายืนยันเชิงลบไม่เสถียรใน CI:** ลด `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (ค่าเริ่มต้น 8 วินาที) เมื่อ CI เร็ว; เพิ่มค่านี้บนรันเนอร์ที่ใช้ร่วมกันซึ่งช้า
- **ต้องการเนื้อหาที่ปกปิดแล้วสำหรับรายงานบั๊ก:** รันซ้ำด้วย `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` และแนบ `matrix-qa-observed-events.json` ปฏิบัติต่ออาร์ทิแฟกต์ที่ได้ว่าเป็นข้อมูลละเอียดอ่อน
- **Tuwunel เวอร์ชันอื่น:** ชี้ `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` ไปยังเวอร์ชันที่กำลังทดสอบ เลนจะตรวจสอบเฉพาะอิมเมจค่าเริ่มต้นที่ปักหมุดไว้เท่านั้น

## สัญญา transport แบบสด

Matrix เป็นหนึ่งในสามเลน transport แบบสด (Matrix, Telegram, Discord) ที่ใช้เช็กลิสต์สัญญาเดียวกันซึ่งกำหนดไว้ใน [ภาพรวม QA → ความครอบคลุม transport แบบสด](/th/concepts/qa-e2e-automation#live-transport-coverage) `qa-channel` ยังคงเป็นชุดสังเคราะห์ขนาดกว้าง และตั้งใจไม่ให้เป็นส่วนหนึ่งของเมทริกซ์นั้น

## ที่เกี่ยวข้อง

- [ภาพรวม QA](/th/concepts/qa-e2e-automation) — สแต็ก QA โดยรวมและสัญญา transport แบบสด
- [QA Channel](/th/channels/qa-channel) — อะแดปเตอร์ช่องสัญญาณสังเคราะห์สำหรับสถานการณ์ที่รองรับโดย repo
- [การทดสอบ](/th/help/testing) — การรันการทดสอบและการเพิ่มความครอบคลุม QA
- [Matrix](/th/channels/matrix) — Plugin ช่องสัญญาณที่อยู่ระหว่างการทดสอบ
