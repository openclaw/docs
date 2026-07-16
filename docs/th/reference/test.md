---
read_when:
    - การเรียกใช้หรือแก้ไขการทดสอบ
summary: วิธีรันการทดสอบภายในเครื่อง (vitest) และกรณีที่ควรใช้โหมด force/coverage
title: การทดสอบ
x-i18n:
    generated_at: "2026-07-16T19:44:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 391185703e853bb523e1396eb22da4693d10d47b1644d3b2a51707d329f67dae
    source_path: reference/test.md
    workflow: 16
---

- ชุดเครื่องมือทดสอบฉบับเต็ม (ชุดการทดสอบ, แบบสด, Docker): [การทดสอบ](/th/help/testing)
- การตรวจสอบความถูกต้องของการอัปเดตและแพ็กเกจ Plugin: [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)

## ค่าเริ่มต้นของเอเจนต์

เซสชันของเอเจนต์จะเรียกใช้การทดสอบเฉพาะจุดหนึ่งหรือสองสามรายการและการตรวจสอบแบบสแตติกที่ใช้ทรัพยากรน้อยภายในเครื่อง เฉพาะ
สำหรับซอร์สที่เชื่อถือได้และเมื่อการติดตั้งการพึ่งพาที่มีอยู่พร้อมใช้งานเท่านั้น ห้าม
เรียกใช้เครื่องมือของรีโพซิทอรีที่ไม่น่าเชื่อถือภายในเครื่อง ชุดการทดสอบขนาดใหญ่กว่า เกตที่เปลี่ยนแปลงพร้อม
การกระจายงาน typecheck/lint, บิลด์, Docker, เลนแพ็กเกจ, E2E, หลักฐานแบบสด และ
การตรวจสอบข้ามแพลตฟอร์มจะทำงานจากระยะไกลผ่าน Crabbox สำหรับหลักฐานขนาดใหญ่จากผู้ดูแลที่เชื่อถือได้
จะใช้ Blacksmith Testbox เป็นค่าเริ่มต้น เวิร์กโฟลว์ Testbox ที่กำหนดค่าไว้
จะเติมข้อมูลประจำตัว ดังนั้นโค้ดจากผู้ร่วมพัฒนาหรือฟอร์กที่ไม่น่าเชื่อถือต้องใช้
CI ของฟอร์กที่ไม่มีข้อมูลลับหรือ AWS Crabbox โดยตรงที่ผ่านการทำให้ปลอดภัยแทน

อย่าอุ่นเครื่องล่วงหน้าสำหรับงานที่คาดว่าจะทำ ให้จัดหาแบ็กเอนด์เมื่อ
คำสั่งขนาดใหญ่คำสั่งแรกพร้อมใช้งาน นำรหัส `tbx_...` ที่ได้รับกลับมาใช้กับคำสั่งขนาดใหญ่
ในภายหลัง ซิงก์เช็กเอาต์ปัจจุบันในการเรียกใช้ทุกครั้ง และหยุดระบบก่อนส่งมอบ

หลังจากนำกลับมาใช้สำเร็จครั้งแรก ตัวห่อหุ้มจะบันทึกฐานของลีส
ข้อมูลการพึ่งพา และลายนิ้วมือเวิร์กโฟลว์ Testbox ไว้ใต้ `.crabbox/testbox-leases/`
การแก้ไขเฉพาะซอร์สยังคงใช้กล่องที่อุ่นเครื่องแล้วต่อไป หาก merge base, lockfile,
อินพุตของตัวจัดการแพ็กเกจ, ตัวห่อหุ้ม หรือเวิร์กโฟลว์ Testbox เปลี่ยนแปลง ระบบจะปิดอย่างปลอดภัยและกำหนดให้ใช้
ลีสใหม่ การเรียกใช้ทุกครั้งยังคงซิงก์เช็กเอาต์ปัจจุบัน
`OPENCLAW_TESTBOX_ALLOW_STALE=1` มีไว้สำหรับการวินิจฉัยโดยเจตนาเท่านั้น ไม่ใช่
หลักฐานสำหรับรีลีส

คำสั่งทดสอบภายในเครื่องด้านล่างมีไว้สำหรับเวิร์กโฟลว์ของมนุษย์และหลักฐานแบบจำกัดขอบเขตของเอเจนต์
หากผู้ให้บริการระยะไกลไม่พร้อมใช้งาน ต้องรายงานให้ทราบ ซึ่งไม่ใช่การอนุญาตให้
เรียกใช้เกตภายในเครื่องที่ครอบคลุมโดยไม่แจ้งให้ทราบ

สำหรับหลักฐานขนาดใหญ่จากซอร์สที่ไม่น่าเชื่อถือ ให้อุ่นเครื่องเมื่อจำเป็นด้วย `--provider aws` การเรียกใช้ทุกครั้งต้องตั้งค่า
`CRABBOX_ENV_ALLOW=CI`, ส่งผ่าน `--provider aws --no-hydrate` และใช้
`HOME` ระยะไกลชั่วคราวรายการใหม่ก่อนติดตั้งการพึ่งพาหรือเรียกใช้
การทดสอบ ใช้ลีสที่อุ่นเครื่องใหม่ซึ่งจัดสรรให้ซอร์สที่ไม่น่าเชื่อถือนั้นโดยเฉพาะ ห้ามนำ
ลีสที่เชื่อถือได้หรือเคยเติมข้อมูลประจำตัวแล้วกลับมาใช้ใหม่ เรียกใช้ไบนารี Crabbox
ที่ติดตั้งและเชื่อถือได้จากเช็กเอาต์ `main` ที่สะอาดและเชื่อถือได้ และดึงเฉพาะ PR ระยะไกลด้วย
`--fresh-pr`; ห้ามเรียกใช้ตัวห่อหุ้มหรือการกำหนดค่าของเช็กเอาต์ที่ไม่น่าเชื่อถือภายในเครื่อง
ยกเลิกการตั้งค่า `CRABBOX_AWS_INSTANCE_PROFILE` และปิดอย่างปลอดภัย เว้นแต่
`aws.instanceProfile` ที่แก้ค่าแล้วจะว่างเปล่า ก่อนติดตั้งหรือทดสอบใดๆ ให้ใช้เครื่องมือ
ที่เชื่อถือได้ซึ่งระบุพาธแบบสัมบูรณ์เพื่อบังคับให้ใช้โทเค็น IMDSv2 พิสูจน์ว่าเอนด์พอยต์ข้อมูลประจำตัว
IAM ส่งคืน 404 และตรวจสอบว่า `git rev-parse HEAD` ระยะไกลเท่ากับ
SHA แบบเต็มของหัว PR ที่ตรวจสอบแล้ว ผูกลีสเข้ากับ SHA นั้น และหยุด/อุ่นเครื่องใหม่เมื่อหัว
เปลี่ยนแปลง อัปโหลด `scripts/crabbox-untrusted-bootstrap.sh` ที่เชื่อถือได้จาก
`main` ที่สะอาดควบคู่กับ `--fresh-pr`; สคริปต์นี้จะติดตั้ง Node/pnpm เวอร์ชันที่ตรึงไว้ ตรวจสอบ SHA
และพินตัวจัดการแพ็กเกจ แยก `HOME` ติดตั้งการพึ่งพา แล้วเรียกใช้
การทดสอบที่ร้องขอ หากโบรกเกอร์พิสูจน์ไม่ได้ว่าไม่มีบทบาท หรือไม่มี PR ระยะไกล
ให้ใช้ CI ของฟอร์กที่ไม่มีข้อมูลลับ ห้ามใช้ `hydrate-github`, `--no-sync` หรือ
เวิร์กโฟลว์ Testbox ที่เติมข้อมูลประจำตัวแล้ว
ยกเลิกการแทนที่ `CRABBOX_TAILSCALE*` ทั้งหมด บังคับใช้ `--network public
--tailscale=false` ล้างแฟล็ก exit-node/LAN และกำหนดให้ `crabbox inspect`
รายงานเครือข่ายสาธารณะโดยไม่มีสถานะ Tailscale ก่อนอัปโหลดสคริปต์ใดๆ

## ลำดับงานประจำภายในเครื่อง

1. `pnpm test:changed` สำหรับหลักฐาน Vitest ตามขอบเขตที่เปลี่ยนแปลง
2. `pnpm test <path-or-filter>` สำหรับไฟล์ ไดเรกทอรี หรือเป้าหมายที่ระบุอย่างชัดเจนหนึ่งรายการ
3. `pnpm test` เฉพาะเมื่อตั้งใจต้องการชุดการทดสอบ Vitest ภายในเครื่องทั้งหมด

ในเวิร์กทรี Codex หรือเช็กเอาต์แบบลิงก์/สปาร์ส เอเจนต์จะหลีกเลี่ยงการเรียกใช้ภายในเครื่องโดยตรง
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run`:

- หลักฐานเฉพาะจุดแบบจำกัดขอบเขตเมื่อการพึ่งพาพร้อมใช้งาน:
  `node scripts/run-vitest.mjs <path-or-filter>`
- การตรวจสอบการเปลี่ยนแปลงแบบจัดประเภทก่อน: `node scripts/check-changed.mjs`; แผนที่มีเฉพาะเอกสาร
  ไม่มีการเปลี่ยนแปลง และเมทาดาทาขนาดเล็กจะทำงานภายในเครื่องเมื่อการพึ่งพาพร้อมใช้งาน
  ส่วนแผนขนาดใหญ่หรือแผนที่ขาดการพึ่งพาจะมอบหมายให้ Testbox
- หลักฐานแบบครอบคลุมโดยใช้ลีสที่เก็บไว้อย่างชัดเจน: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` เพื่อให้ pnpm ทำงานภายใน Testbox
- `exitCode` สุดท้ายของตัวห่อหุ้มและ JSON การจับเวลาคือผลลัพธ์ของคำสั่ง การเรียกใช้ Blacksmith GitHub Actions ที่มอบหมายอาจแสดง `cancelled` หลังคำสั่ง SSH สำเร็จ เนื่องจาก Testbox ถูกหยุดจากภายนอกแอ็กชัน keepalive ให้ตรวจสอบสรุปของตัวห่อหุ้มและเอาต์พุตคำสั่งก่อนถือว่าเป็นความล้มเหลว
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: เก็บการทำงานแบบอนุกรมของการตรวจสอบขนาดใหญ่ไว้ภายในเวิร์กทรีปัจจุบัน แทนไดเรกทอรี Git ส่วนกลาง สำหรับคำสั่งเช่น `pnpm check:changed` และ `pnpm test ...` แบบมีเป้าหมาย ใช้เฉพาะบนโฮสต์ภายในเครื่องที่มีความจุสูง เมื่อตั้งใจเรียกใช้การตรวจสอบอิสระข้ามเวิร์กทรีที่ลิงก์กัน

## คำสั่งหลัก

การเรียกใช้ตัวห่อหุ้มการทดสอบจะจบด้วยสรุป `[test] passed|failed|skipped ... in ...` แบบสั้น ส่วนบรรทัดระยะเวลาของ Vitest เองยังคงเป็นรายละเอียดต่อชาร์ด

| คำสั่ง                                           | การทำงาน                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | เป้าหมายไฟล์/ไดเรกทอรีที่ระบุอย่างชัดเจนจะถูกส่งผ่านเลน Vitest ตามขอบเขต การเรียกใช้ที่ไม่ระบุเป้าหมายเป็นหลักฐานของชุดการทดสอบทั้งหมด: กลุ่มชาร์ดคงที่จะขยายเป็นการกำหนดค่าระดับใบสำหรับการทำงานแบบขนานภายในเครื่อง โดยพิมพ์การกระจายชาร์ดที่คาดไว้ก่อนเริ่มต้น กลุ่มส่วนขยายจะขยายเป็นการกำหนดค่าชาร์ดต่อส่วนขยายเสมอ แทนกระบวนการรูทโปรเจกต์ขนาดใหญ่เพียงกระบวนการเดียว           |
| `pnpm test:changed`                               | การเรียกใช้การทดสอบที่เปลี่ยนแปลงแบบอัจฉริยะและใช้ทรัพยากรน้อย: เป้าหมายที่แม่นยำจากการแก้ไขการทดสอบโดยตรง ไฟล์ `*.test.ts` ข้างเคียง การแมปซอร์สที่ระบุชัดเจน และกราฟการนำเข้าภายในเครื่อง การเปลี่ยนแปลงแบบกว้าง/การกำหนดค่า/แพ็กเกจจะถูกข้าม เว้นแต่จะแมปไปยังการทดสอบที่แม่นยำ                                                                                                                               |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | การเรียกใช้การทดสอบที่เปลี่ยนแปลงแบบครอบคลุมอย่างชัดเจน ใช้เมื่อการแก้ไขฮาร์เนสการทดสอบ/การกำหนดค่า/แพ็กเกจควรถอยกลับไปใช้พฤติกรรมการทดสอบการเปลี่ยนแปลงที่ครอบคลุมกว่าของ Vitest                                                                                                                                                                                                                        |
| `pnpm test:force`                                 | ปลดพอร์ต Gateway ของ OpenClaw ที่กำหนดค่าไว้ (ค่าเริ่มต้น `18789`) จากนั้นเรียกใช้ชุดการทดสอบทั้งหมดด้วยพอร์ต Gateway ที่แยกออกมา เพื่อไม่ให้การทดสอบเซิร์ฟเวอร์ชนกับอินสแตนซ์ที่กำลังทำงาน                                                                                                                                                                                    |
| `pnpm test:coverage`                              | สร้างรายงานความครอบคลุม V8 เพื่อให้ข้อมูลสำหรับเลนยูนิตเริ่มต้น (`vitest.unit.config.ts`) โดยไม่มีการบังคับใช้เกณฑ์ความครอบคลุม                                                                                                                                                                                                                             |
| `pnpm test:coverage:changed`                      | ความครอบคลุมยูนิตเฉพาะไฟล์ที่เปลี่ยนแปลงตั้งแต่ `origin/main`                                                                                                                                                                                                                                                                                                       |
| `pnpm changed:lanes`                              | แสดงเลนทางสถาปัตยกรรมที่ถูกทริกเกอร์โดยดิฟฟ์เทียบกับ `origin/main`                                                                                                                                                                                                                                                                                      |
| `pnpm check:changed`                              | จัดประเภทเลนที่เปลี่ยนแปลงก่อนเลือกการทำงาน แผนที่มีเฉพาะเอกสาร ไม่มีการเปลี่ยนแปลง และเมทาดาทาขนาดเล็กจะทำงานภายในเครื่องเมื่อการพึ่งพาพร้อมใช้งาน ส่วนแผนที่มีการกระจายงาน typecheck/lint เลนขนาดใหญ่อื่นๆ หรือขาดการพึ่งพาภายในเครื่องจะมอบหมายให้ Crabbox/Testbox นอก CI ไม่เรียกใช้ Vitest; ใช้ `pnpm test:changed` หรือ `pnpm test <target>` สำหรับหลักฐานการทดสอบ |

## สถานะการทดสอบร่วมและตัวช่วยกระบวนการ

- `src/test-utils/openclaw-test-state.ts`: ใช้จาก Vitest เมื่อการทดสอบต้องการ `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, ฟิกซ์เจอร์การกำหนดค่า, เวิร์กสเปซ, ไดเรกทอรีเอเจนต์ หรือที่เก็บโปรไฟล์การยืนยันตัวตนที่แยกออกมา
- `pnpm test:env-mutations:report`: รายงานแบบไม่บล็อกเกี่ยวกับการทดสอบ/ฮาร์เนสที่แก้ไข `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` หรือคีย์สภาพแวดล้อมที่เกี่ยวข้องโดยตรง ใช้เพื่อค้นหารายการที่ควรย้ายไปใช้ตัวช่วยสถานะการทดสอบร่วม
- `test/helpers/openclaw-test-instance.ts`: การทดสอบ E2E ระดับกระบวนการที่ต้องการ Gateway ที่กำลังทำงาน สภาพแวดล้อม CLI การบันทึกล็อก และการล้างข้อมูลรวมไว้ในที่เดียว
- เลน E2E ของ Docker/Bash ที่ซอร์ส `scripts/lib/docker-e2e-image.sh` สามารถส่ง `docker_e2e_test_state_shell_b64 <label> <scenario>` เข้าไปในคอนเทนเนอร์และถอดรหัสด้วย `scripts/lib/openclaw-e2e-instance.sh`; สคริปต์แบบหลายโฮมสามารถส่ง `docker_e2e_test_state_function_b64` และเรียก `openclaw_test_state_create <label> <scenario>` ในแต่ละโฟลว์ได้ `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` จะเขียนไฟล์สภาพแวดล้อมของโฮสต์ที่สามารถซอร์สได้ (`--` ก่อน `create` ช่วยป้องกันไม่ให้รันไทม์ Node รุ่นใหม่กว่าตีความ `--env-file` เป็นแฟล็ก Node) เลนที่เปิดใช้ Gateway สามารถซอร์ส `scripts/lib/openclaw-e2e-instance.sh` สำหรับการแก้ตำแหน่ง entrypoint, การเริ่มต้น OpenAI จำลอง, การเปิดใช้เบื้องหน้า/เบื้องหลัง, โพรบความพร้อม, การส่งออกสภาพแวดล้อมสถานะ, การดัมป์ล็อก และการล้างกระบวนการ

## เลน Control UI, TUI และส่วนขยาย

- **E2E จำลองของ Control UI:** `pnpm test:ui:e2e` เรียกใช้เลน Vitest + Playwright ซึ่งเริ่ม Vite Control UI และควบคุมหน้า Chromium จริงผ่าน Gateway WebSocket จำลอง การทดสอบอยู่ใน `ui/src/**/*.e2e.test.ts`; ม็อก/ตัวควบคุมที่ใช้ร่วมกันอยู่ใน `ui/src/test-helpers/control-ui-e2e.ts` โดย `pnpm test:e2e` รวมเลนนี้ไว้ด้วย การรันโดยเอเจนต์จะใช้ Testbox/Crabbox เป็นค่าเริ่มต้น รวมถึงการพิสูจน์แบบเจาะจง; ใช้ `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` เฉพาะเมื่อกำหนดให้ใช้ทางเลือกสำรองแบบโลคัลอย่างชัดเจน
- **การทดสอบ TUI PTY:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` เรียกใช้เลน PTY แบ็กเอนด์ปลอมที่รวดเร็ว ส่วน `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` หรือ `pnpm tui:pty:test:watch --mode local` เรียกใช้การทดสอบควัน `tui --local` ที่ช้ากว่า ซึ่งจำลองเฉพาะเอนด์พอยต์โมเดลภายนอก ให้ตรวจสอบข้อความที่มองเห็นได้ซึ่งคงที่หรือการเรียกฟิกซ์เจอร์ ไม่ใช่สแนปช็อต ANSI ดิบ
- `pnpm test:extensions` และ `pnpm test extensions` เรียกใช้ชาร์ดส่วนขยาย/Plugin ทั้งหมด Plugin ช่องทางที่ใช้ทรัพยากรมาก, Plugin เบราว์เซอร์ และ OpenAI จะทำงานเป็นชาร์ดเฉพาะ ส่วนกลุ่ม Plugin อื่นยังคงทำงานแบบแบตช์ `pnpm test extensions/<id>` เรียกใช้เลน Plugin ที่รวมมากับระบบหนึ่งรายการ
- ไฟล์ต้นฉบับที่มีการทดสอบข้างเคียงจะจับคู่กับการทดสอบข้างเคียงนั้นก่อน แล้วจึงย้อนกลับไปใช้ glob ไดเรกทอรีที่กว้างขึ้น การแก้ไขตัวช่วยภายใต้ `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` และ `src/plugins/contracts` ใช้กราฟการนำเข้าแบบโลคัลเพื่อเรียกใช้การทดสอบที่นำเข้าตัวช่วยนั้น แทนการเรียกใช้ทุกชาร์ดแบบกว้างเมื่อเส้นทางการขึ้นต่อกันระบุได้อย่างแม่นยำ
- เป้าหมายไดเรกทอรีสัญญาจะแตกแขนงไปยังเลนสัญญาที่เกี่ยวข้อง: `pnpm test src/channels/plugins/contracts` เรียกใช้การกำหนดค่าสัญญาช่องทางทั้งสี่รายการ และ `pnpm test src/plugins/contracts` เรียกใช้การกำหนดค่าสัญญา Plugin เนื่องจากโปรเจกต์ทั่วไป `channels`/`plugins` ไม่รวม `contracts/**`
- `auto-reply` แยกเป็นการกำหนดค่าเฉพาะสามรายการ (`core`, `top-level`, `reply`) เพื่อไม่ให้ฮาร์เนสการตอบกลับกินทรัพยากรเหนือการทดสอบสถานะ/โทเค็น/ตัวช่วยระดับบนสุดที่เบากว่า
- ไฟล์ทดสอบ `plugin-sdk` และ `commands` ที่เลือกจะถูกกำหนดเส้นทางผ่านเลนแบบเบาเฉพาะ ซึ่งเก็บไว้เฉพาะ `test/setup.ts` โดยปล่อยกรณีที่ใช้รันไทม์มากไว้ในเลนเดิม
- การกำหนดค่า Vitest พื้นฐานมีค่าเริ่มต้นเป็น `pool: "threads"` และ `isolate: false` พร้อมเปิดใช้ตัวรันแบบไม่แยกที่ใช้ร่วมกันในทุกการกำหนดค่าของรีโป
- `pnpm test:channels` เรียกใช้ `vitest.channels.config.ts`

## Gateway และ E2E

- การผสานรวม Gateway เป็นแบบเลือกใช้: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` หรือ `pnpm test:gateway`
- `pnpm test:e2e`: ชุดรวม E2E ของรีโป = `pnpm test:e2e:gateway && pnpm test:ui:e2e`
- `pnpm test:e2e:gateway`: การทดสอบควัน Gateway แบบครบวงจร (การจับคู่ WS/HTTP/Node หลายอินสแตนซ์) ค่าเริ่มต้นคือ `threads` + `isolate: false` พร้อมเวิร์กเกอร์แบบปรับตัวใน `vitest.e2e.config.ts`; ปรับแต่งด้วย `OPENCLAW_E2E_WORKERS=<n>` และเปิดบันทึกแบบละเอียดด้วย `OPENCLAW_E2E_VERBOSE=1`
- `pnpm test:live`: การทดสอบผู้ให้บริการแบบสด (Claude/Minimax/DeepSeek/z.ai/ฯลฯ ซึ่งควบคุมด้วย `*.live.test.ts`) ต้องใช้คีย์ API และ `LIVE=1` (หรือ `OPENCLAW_LIVE_TEST=1`) เพื่อยกเลิกการข้าม; เปิดเอาต์พุตแบบละเอียดด้วย `OPENCLAW_LIVE_TEST_QUIET=0`

## ชุด Docker แบบเต็ม (`pnpm test:docker:all`)

สร้างอิมเมจการทดสอบสดที่ใช้ร่วมกัน แพ็ก OpenClaw หนึ่งครั้งเป็น tarball ของ npm สร้าง/นำอิมเมจตัวรัน Node/Git เปล่ากลับมาใช้ใหม่ พร้อมอิมเมจเชิงฟังก์ชันที่ติดตั้ง tarball นั้นลงใน `/app` จากนั้นเรียกใช้เลนการทดสอบควัน Docker ผ่านตัวจัดกำหนดการแบบถ่วงน้ำหนัก `scripts/package-openclaw-for-docker.mjs` เป็นตัวแพ็กแพ็กเกจเพียงตัวเดียวสำหรับโลคัล/CI และตรวจสอบ tarball รวมถึง `dist/postinstall-inventory.json` ก่อนที่ Docker จะนำไปใช้

- อิมเมจเปล่า (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): เลนตัวติดตั้ง/อัปเดต/การขึ้นต่อกันของ Plugin; เมานต์ tarball ที่สร้างไว้ล่วงหน้าแทนซอร์สของรีโปที่คัดลอกมา
- อิมเมจเชิงฟังก์ชัน (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): เลนฟังก์ชันการทำงานปกติของแอปที่สร้างแล้ว
- ข้อกำหนดเลน: `scripts/lib/docker-e2e-scenarios.mjs` ตัววางแผน: `scripts/lib/docker-e2e-plan.mjs` ตัวดำเนินการ: `scripts/test-docker-all.mjs`
- `node scripts/test-docker-all.mjs --plan-json` ส่งออกแผน CI ที่ตัวจัดกำหนดการเป็นเจ้าของ (เลน, ชนิดอิมเมจ, ความต้องการแพ็กเกจ/อิมเมจสด, สถานการณ์สถานะ, การตรวจสอบข้อมูลประจำตัว) โดยไม่สร้างหรือเรียกใช้ Docker

ตัวปรับการจัดกำหนดการ (ตัวแปรสภาพแวดล้อม โดยค่าเริ่มต้นอยู่ในวงเล็บ):

| ตัวแปรสภาพแวดล้อม                                                                                              | ค่าเริ่มต้น          | วัตถุประสงค์                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | สล็อตกระบวนการ                                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | พูลส่วนท้ายที่ไวต่อผู้ให้บริการ                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | ขีดจำกัดเลนผู้ให้บริการสดที่ใช้ทรัพยากรมาก                                                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | ขีดจำกัดเลนทรัพยากร npm                                                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | ขีดจำกัดเลนทรัพยากรบริการ                                                                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | ขีดจำกัดเลนที่ใช้ทรัพยากรมากต่อผู้ให้บริการ                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | ขีดจำกัดต่อผู้ให้บริการที่แคบกว่า                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | ค่าลบล้างสำหรับโฮสต์ขนาดใหญ่กว่า                                                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | ระยะหน่วงระหว่างการเริ่มเลน เพื่อหลีกเลี่ยงการสร้างพร้อมกันจำนวนมากในดีมอน Docker แบบโลคัล                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min) | ระยะหมดเวลาสำรองต่อเลน; เลนสด/ส่วนท้ายที่เลือกใช้ขีดจำกัดที่เข้มงวดกว่า                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | จำนวนครั้งที่ลองใหม่สำหรับความล้มเหลวชั่วคราวของผู้ให้บริการสด                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | off                 | พิมพ์แมนิเฟสต์เลนโดยไม่เรียกใช้ Docker                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | ช่วงเวลาการพิมพ์สถานะเลนที่กำลังทำงาน                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | on                  | นำ `.artifacts/docker-tests/lane-timings.json` กลับมาใช้ใหม่เพื่อเรียงลำดับจากงานที่ใช้เวลานานที่สุดก่อน; ตั้งเป็น `0` เพื่อปิดใช้                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` สำหรับเลนแบบกำหนดผลลัพธ์แน่นอน/โลคัลเท่านั้น, `only` สำหรับเลนผู้ให้บริการสดเท่านั้น ชื่อแทน: `pnpm test:docker:local:all`, `pnpm test:docker:live:all` โหมดสดเท่านั้นจะรวมเลนสดหลักและเลนสดส่วนท้ายเป็นพูลเดียวที่เรียงงานใช้เวลานานที่สุดก่อน เพื่อให้บักเก็ตผู้ให้บริการจัดงาน Claude/Codex/Gemini ไว้ด้วยกัน |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | ระยะหมดเวลาการตั้งค่า Docker สำหรับแบ็กเอนด์ CLI                                                                                                                                                                                                                                            |

รูปแบบตัวแปรสภาพแวดล้อมสำหรับขีดจำกัดทรัพยากรคือ `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (ชื่อทรัพยากรเป็นตัวพิมพ์ใหญ่ และอักขระที่ไม่ใช่ตัวอักษรหรือตัวเลขจะถูกรวมเป็น `_`)

พฤติกรรมอื่น ๆ: runner จะตรวจสอบ Docker ล่วงหน้าโดยค่าเริ่มต้น ล้างคอนเทนเนอร์ OpenClaw E2E ที่ค้างอยู่ แชร์แคชเครื่องมือ CLI ของผู้ให้บริการระหว่างเลนที่เข้ากันได้ และหยุดกำหนดเวลาเลนแบบพูลใหม่หลังเกิดความล้มเหลวครั้งแรก เว้นแต่จะตั้งค่า `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` หากเลนหนึ่งเกินขีดจำกัดน้ำหนัก/ทรัพยากรที่มีผลบนโฮสต์ที่มีระดับการทำงานแบบขนานต่ำ เลนนั้นยังคงเริ่มจากพูลว่างและทำงานเพียงลำพังได้จนกว่าจะคืนความจุ บันทึกต่อเลน, `summary.json`, `failures.json` และระยะเวลาของแต่ละเฟสจะถูกเขียนไว้ภายใต้ `.artifacts/docker-tests/<run-id>/`; ใช้ `pnpm test:docker:timings <summary.json>` เพื่อตรวจสอบเลนที่ช้า และใช้ `pnpm test:docker:rerun <run-id|summary.json|failures.json>` เพื่อพิมพ์คำสั่งรันซ้ำแบบเจาะจงที่ใช้ทรัพยากรต่ำ

### เลน Docker ที่สำคัญ

| คำสั่ง                                                                     | สิ่งที่ตรวจสอบ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | คอนเทนเนอร์ E2E จากซอร์สที่ใช้ Chromium พร้อม CDP แบบดิบและ Gateway ที่แยกออกจากกัน; สแนปช็อตบทบาท CDP ของ `browser doctor --deep` ประกอบด้วย URL ของลิงก์ องค์ประกอบที่คลิกได้ซึ่งเลื่อนเคอร์เซอร์ไปวางได้ การอ้างอิง iframe และเมทาดาทาของเฟรม                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:skill-install`                                            | ติดตั้ง tarball ที่แพ็กแล้วใน runner Docker เปล่าด้วย `skills.install.allowUploadedArchives: false` แก้ไข slug ของ skill ปัจจุบันจากการค้นหา ClawHub แบบสด ติดตั้งผ่าน `openclaw skills install` และตรวจสอบ `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` และ `skills info --json`                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | โพรบแบบสดที่เน้นแบ็กเอนด์ CLI; Gemini มีนามแฝง `:resume` และ `:mcp` ที่สอดคล้องกัน                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:openwebui`                                                | OpenClaw + Open WebUI ใน Docker: ลงชื่อเข้าใช้ ตรวจสอบ `/api/models` และเรียกใช้แชตจริงที่พร็อกซีผ่าน `/api/chat/completions` ต้องใช้คีย์โมเดลแบบสดที่ใช้งานได้และดึงอิมเมจภายนอก จึงไม่ได้คาดหมายว่าจะเสถียรบน CI เช่นเดียวกับชุดทดสอบ unit/e2e                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:mcp-channels`                                             | คอนเทนเนอร์ Gateway ที่เตรียมข้อมูลเริ่มต้นไว้ พร้อมคอนเทนเนอร์ไคลเอนต์ที่เรียกใช้ `openclaw mcp serve`: การค้นหาการสนทนาที่มีการกำหนดเส้นทาง การอ่านทรานสคริปต์ เมทาดาทาของไฟล์แนบ พฤติกรรมคิวเหตุการณ์แบบสด การกำหนดเส้นทางการส่งออก และการแจ้งเตือนช่องทาง + สิทธิ์แบบ Claude ผ่านบริดจ์ stdio จริง (การตรวจสอบยืนยันจะอ่านเฟรม MCP ของ stdio แบบดิบโดยตรง)                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:upgrade-survivor`                                         | ติดตั้ง tarball ที่แพ็กแล้วทับ fixture ผู้ใช้เดิมที่มีสถานะไม่สะอาด เรียกใช้การอัปเดตแพ็กเกจพร้อม doctor แบบไม่โต้ตอบโดยไม่มีคีย์ผู้ให้บริการ/ช่องทางแบบสด เริ่ม Gateway แบบ loopback และตรวจสอบว่า agents/การกำหนดค่าช่องทาง/รายการอนุญาต Plugin/ไฟล์ workspace/session/สถานะ dependency ของ Plugin แบบเก่าที่ค้างอยู่/การเริ่มต้น/สถานะ RPC ยังคงอยู่                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:published-upgrade-survivor`                               | ติดตั้ง `openclaw@latest` โดยค่าเริ่มต้น เตรียมไฟล์ผู้ใช้เดิมที่สมจริง กำหนดค่าผ่านสูตร `openclaw config set` ที่ฝังไว้ อัปเดตเป็น tarball ที่แพ็กแล้ว เรียกใช้ doctor แบบไม่โต้ตอบ เขียน `.artifacts/upgrade-survivor/summary.json` และตรวจสอบ `/healthz`, `/readyz` และสถานะ RPC เขียนทับด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` ขยายเมทริกซ์ด้วย `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` หรือเพิ่ม fixture ของสถานการณ์ด้วย `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (รวม `configured-plugin-installs` และ `stale-source-plugin-shadow`) Package Acceptance เปิดเผยรายการเหล่านี้เป็น `published_upgrade_survivor_baseline(s)` / `_scenarios` และแก้ไขเมตาโทเค็น เช่น `last-stable-4` หรือ `all-since-2026.4.23` |
| `pnpm test:docker:update-migration`                                         | ชุดทดสอบความอยู่รอดหลังการอัปเกรดจากเวอร์ชันที่เผยแพร่ในสถานการณ์ `plugin-deps-cleanup` ซึ่งเริ่มต้นที่ `openclaw@2026.4.23` โดยค่าเริ่มต้น เวิร์กโฟลว์ `Update Migration` ขยายการตรวจสอบนี้ด้วย `baselines=all-since-2026.4.23` เพื่อพิสูจน์การล้าง dependency ของ Plugin ที่กำหนดค่าไว้นอก Full Release CI                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:plugins`                                                  | การทดสอบควันของการติดตั้ง/อัปเดตสำหรับพาธภายในเครื่อง, `file:`, แพ็กเกจจากรีจิสทรี npm ที่มี dependency แบบ hoisted, refs ของ git ที่เคลื่อนที่ได้, fixture ของ ClawHub, การอัปเดตมาร์เก็ตเพลส และการเปิดใช้งาน/ตรวจสอบบันเดิล Claude                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## เกต PR ภายในเครื่อง

สำหรับการตรวจสอบก่อนผสาน/เกต PR ภายในเครื่อง ให้เรียกใช้:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

หาก `pnpm test` ล้มเหลวเป็นครั้งคราวบนโฮสต์ที่มีโหลดสูง ให้รันซ้ำหนึ่งครั้งก่อนถือว่าเป็นการถดถอย จากนั้นแยกตรวจสอบด้วย `pnpm test <path/to/test>` สำหรับโฮสต์ที่มีหน่วยความจำจำกัด:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## เครื่องมือวัดประสิทธิภาพการทดสอบ

- `pnpm test:perf:imports`: เปิดใช้การรายงานระยะเวลาการนำเข้า + รายละเอียดการนำเข้าของ Vitest ขณะที่ยังใช้การกำหนดเส้นทางเลนตามขอบเขตสำหรับเป้าหมายไฟล์/ไดเรกทอรีที่ระบุอย่างชัดเจน `pnpm test:perf:imports:changed` จำกัดขอบเขตการทำโปรไฟล์เดียวกันไว้เฉพาะไฟล์ที่เปลี่ยนแปลงนับตั้งแต่ `origin/main`
- `pnpm test:perf:changed:bench -- --ref <git-ref>` ทำเบนช์มาร์กพาธโหมด changed ที่ผ่านการกำหนดเส้นทางเทียบกับการรันโปรเจกต์รากแบบเนทีฟสำหรับ git diff ที่คอมมิตแล้วชุดเดียวกัน; `pnpm test:perf:changed:bench -- --worktree` ทำเบนช์มาร์กชุดการเปลี่ยนแปลงของ worktree ปัจจุบันโดยไม่ต้องคอมมิตก่อน
- `pnpm test:perf:profile:main` เขียนโปรไฟล์ CPU สำหรับเธรดหลักของ Vitest (`.artifacts/vitest-main-profile`); `pnpm test:perf:profile:runner` เขียนโปรไฟล์ CPU + heap สำหรับ runner ของ unit (`.artifacts/vitest-runner-profile`)
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: เรียกใช้การกำหนดค่า Vitest ปลายทางทุกชุดของชุดทดสอบเต็มแบบอนุกรม และเขียนข้อมูลระยะเวลาที่จัดกลุ่มพร้อมอาร์ติแฟกต์ JSON/บันทึกต่อการกำหนดค่า รายงานชุดทดสอบเต็มจะแยกไฟล์โดยค่าเริ่มต้น เพื่อไม่ให้กราฟโมดูลที่ยังคงอยู่และช่วงหยุดชั่วคราวของ GC จากไฟล์ก่อนหน้าถูกนับรวมกับการตรวจสอบยืนยันในภายหลัง; ส่ง `-- --no-isolate` เฉพาะเมื่อตั้งใจทำโปรไฟล์การสะสมของ worker ที่ใช้ร่วมกันเท่านั้น Test Performance Agent ใช้สิ่งนี้เป็นค่าฐานก่อนพยายามแก้ไขการทดสอบที่ช้า `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` เปรียบเทียบรายงานที่จัดกลุ่มหลังการเปลี่ยนแปลงที่มุ่งเน้นประสิทธิภาพ
- การรัน shard แบบเต็ม แบบส่วนขยาย และแบบรูปแบบ include จะอัปเดตข้อมูลเวลาในเครื่องที่ `.artifacts/vitest-shard-timings.json`; การรันทั้งการกำหนดค่าในภายหลังจะใช้ข้อมูลเวลาเหล่านั้นเพื่อปรับสมดุล shard ที่ช้าและเร็ว shard ของ CI แบบรูปแบบ include จะต่อท้ายชื่อ shard เข้ากับคีย์เวลา ซึ่งช่วยให้มองเห็นข้อมูลเวลาของ shard ที่กรองแล้วโดยไม่แทนที่ข้อมูลเวลาของทั้งการกำหนดค่า ตั้งค่า `OPENCLAW_TEST_PROJECTS_TIMINGS=0` เพื่อไม่สนใจอาร์ติแฟกต์ข้อมูลเวลาในเครื่อง

## เบนช์มาร์ก

<Accordion title="เวลาแฝงของโมเดล (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

env ที่เลือกใช้ได้: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY` พรอมต์เริ่มต้น: "ตอบกลับด้วยคำเดียว: ok ห้ามมีเครื่องหมายวรรคตอนหรือข้อความเพิ่มเติม"

</Accordion>

<Accordion title="การเริ่มต้น CLI (scripts/bench-cli-startup.ts)">

```bash
pnpm test:startup:bench
pnpm test:startup:bench:smoke
pnpm test:startup:bench:save
pnpm test:startup:bench:update
pnpm test:startup:bench:check
pnpm tsx scripts/bench-cli-startup.ts --runs 12
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3
pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all
```

พรีเซ็ต:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: รวมทั้งสองพรีเซ็ตเข้าด้วยกัน

ผลลัพธ์ประกอบด้วย `sampleCount`, ค่าเฉลี่ย, p50, p95, ค่าต่ำสุด/สูงสุด, การกระจายของรหัสออก/สัญญาณ และ RSS สูงสุดต่อคำสั่ง `--cpu-prof-dir` / `--heap-prof-dir` จะเขียนโปรไฟล์ V8 สำหรับการรันแต่ละครั้ง

ผลลัพธ์ที่บันทึกไว้: `pnpm test:startup:bench:smoke` เขียน `.artifacts/cli-startup-bench-smoke.json`; `pnpm test:startup:bench:save` เขียน `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`) ฟิกซ์เจอร์ที่เช็กอิน: `test/fixtures/cli-startup-bench.json` รีเฟรชด้วย `pnpm test:startup:bench:update` และเปรียบเทียบด้วย `pnpm test:startup:bench:check`

</Accordion>

<Accordion title="การเริ่มต้น Gateway (scripts/bench-gateway-startup.ts)">

โดยค่าเริ่มต้นจะใช้รายการ CLI ที่บิลด์แล้วที่ `dist/entry.js`; ให้รัน `pnpm build` ก่อน ส่ง `--entry scripts/run-node.mjs` เพื่อวัดผลตัวรันซอร์สแทน และเก็บผลลัพธ์เหล่านั้นแยกจากค่าฐานของรายการที่บิลด์แล้ว

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

รหัสกรณี: `default`, `skipChannels` (ข้ามการเริ่มต้นช่องทาง), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (Plugin แบบ manifest 50 รายการ), `fiftyStartupLazyPlugins` (Plugin แบบ manifest ที่โหลดแบบหน่วงเวลาเมื่อเริ่มต้น 50 รายการ)

ผลลัพธ์ประกอบด้วยเอาต์พุตแรกของกระบวนการ, `/healthz`, `/readyz`, เวลาของบันทึกการเริ่มรับฟัง HTTP, เวลาของบันทึกว่า Gateway พร้อมใช้งาน, เวลา CPU, อัตราส่วนคอร์ CPU, RSS สูงสุด, ฮีป, เมตริกการติดตามการเริ่มต้น, ความหน่วงของลูปเหตุการณ์ และเมตริกรายละเอียดตารางค้นหา Plugin สคริปต์จะตั้งค่า `OPENCLAW_GATEWAY_STARTUP_TRACE=1` ในสภาพแวดล้อมของ Gateway ลูก

`/healthz` คือสถานะการทำงานอยู่ (เซิร์ฟเวอร์ HTTP สามารถตอบสนองได้) `/readyz` คือความพร้อมใช้งานจริง (ไซด์คาร์ Plugin ที่เริ่มต้น ช่องทาง และงานหลังการแนบที่สำคัญต่อความพร้อมได้ดำเนินการเสร็จแล้ว) ฮุกการเริ่มต้นจะถูกส่งแบบอะซิงโครนัสและไม่รวมอยู่ในการรับประกันความพร้อม เวลาของบันทึกว่าพร้อมคือการประทับเวลาภายในของ Gateway ซึ่งมีประโยชน์สำหรับการระบุสาเหตุฝั่งกระบวนการ แต่ไม่สามารถใช้แทนโพรบ `/readyz` ภายนอกได้

ใช้เอาต์พุต JSON หรือ `--output` เมื่อเปรียบเทียบการเปลี่ยนแปลง ใช้ `--cpu-prof-dir` เฉพาะเมื่อเอาต์พุตการติดตามชี้ไปยังงานนำเข้า คอมไพล์ หรืองานที่ติดคอขวดที่ CPU ซึ่งการจับเวลาระยะแต่ละช่วงเพียงอย่างเดียวไม่สามารถอธิบายได้

</Accordion>

<Accordion title="การรีสตาร์ต Gateway (scripts/bench-gateway-restart.ts)">

เฉพาะ macOS และ Linux (ใช้ SIGUSR1 สำหรับการรีสตาร์ตภายในกระบวนการ และจะล้มเหลวทันทีบน Windows) ใช้ค่าเริ่มต้นเป็นรายการที่บิลด์แล้วและการแทนที่ด้วย `--entry scripts/run-node.mjs` เช่นเดียวกับการเริ่มต้น Gateway ข้างต้น

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

รหัสกรณี: `skipChannels`, `skipChannelsAcpxProbe` (เปิดโพรบการเริ่มต้น ACPX), `skipChannelsNoAcpxProbe` (ปิดโพรบ), `default`, `fiftyPlugins`

ผลลัพธ์ประกอบด้วย `/healthz` ถัดไป, `/readyz` ถัดไป, เวลาหยุดทำงาน, เวลาจนพร้อมหลังรีสตาร์ต, CPU, RSS, เมตริกการติดตามการเริ่มต้นสำหรับกระบวนการทดแทน และเมตริกการติดตามการรีสตาร์ตสำหรับการจัดการสัญญาณ การระบายงานที่กำลังทำงาน ระยะการปิด การเริ่มต้นครั้งถัดไป เวลาจนพร้อม และสแนปชอตหน่วยความจำ สคริปต์จะตั้งค่า `OPENCLAW_GATEWAY_STARTUP_TRACE=1` และ `OPENCLAW_GATEWAY_RESTART_TRACE=1`

ใช้เบนช์มาร์กนี้เมื่อการเปลี่ยนแปลงเกี่ยวข้องกับการส่งสัญญาณรีสตาร์ต ตัวจัดการการปิด การเริ่มต้นหลังรีสตาร์ต การปิดไซด์คาร์ การส่งมอบบริการ หรือความพร้อมหลังรีสตาร์ต เริ่มด้วย `skipChannels` เพื่อแยกกลไกของ Gateway ออกจากการเริ่มต้นช่องทาง ใช้ `default` หรือกรณีที่มี Plugin จำนวนมากเฉพาะหลังจากกรณีแบบจำกัดขอบเขตอธิบายเส้นทางรีสตาร์ตได้แล้ว เมตริกการติดตามเป็นเบาะแสสำหรับระบุสาเหตุ ไม่ใช่ข้อสรุป — ให้ประเมินการเปลี่ยนแปลงการรีสตาร์ตจากตัวอย่างหลายครั้ง ช่วงการทำงานของเจ้าของที่ตรงกัน พฤติกรรม `/healthz`/`/readyz` และสัญญาการรีสตาร์ตที่ผู้ใช้มองเห็น

</Accordion>

## E2E การเริ่มต้นใช้งาน (Docker)

ไม่บังคับ จำเป็นเฉพาะสำหรับการทดสอบเบื้องต้นของการเริ่มต้นใช้งานในคอนเทนเนอร์ โฟลว์การเริ่มต้นแบบเย็นทั้งหมดในคอนเทนเนอร์ Linux ที่สะอาด:

```bash
scripts/e2e/onboard-docker.sh
```

ขับเคลื่อนวิซาร์ดแบบโต้ตอบผ่าน pseudo-tty ตรวจสอบไฟล์การกำหนดค่า/เวิร์กสเปซ/เซสชัน จากนั้นเริ่ม Gateway และรัน `openclaw health`

## การทดสอบเบื้องต้นการนำเข้า QR (Docker)

ตรวจสอบให้แน่ใจว่าตัวช่วยรันไทม์ QR ที่ดูแลอยู่โหลดได้ภายใต้รันไทม์ Docker Node ที่รองรับ (Node 24 เป็นค่าเริ่มต้น และเข้ากันได้กับ Node 22):

```bash
pnpm test:docker:qr
```

## ที่เกี่ยวข้อง

- [การทดสอบ](/th/help/testing)
- [การทดสอบแบบสด](/th/help/testing-live)
- [การทดสอบการอัปเดตและ Plugin](/th/help/testing-updates-plugins)
