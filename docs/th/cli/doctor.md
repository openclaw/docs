---
read_when:
    - คุณมีปัญหาการเชื่อมต่อ/การยืนยันตัวตน และต้องการการแก้ไขแบบมีคำแนะนำ
    - คุณอัปเดตแล้วและต้องการตรวจสอบความถูกต้องเบื้องต้น
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw doctor` (การตรวจสอบสุขภาพ + การซ่อมแซมแบบมีคำแนะนำ)
title: Doctor
x-i18n:
    generated_at: "2026-06-27T17:20:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf7c07cd39053fce7efa81d968ef0f2666f6f5331581e72d2684843519c63b43
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

การตรวจสุขภาพ + การแก้ไขด่วนสำหรับ Gateway และช่องทางต่างๆ

ที่เกี่ยวข้อง:

- การแก้ไขปัญหา: [การแก้ไขปัญหา](/th/gateway/troubleshooting)
- การตรวจสอบความปลอดภัย: [ความปลอดภัย](/th/gateway/security)

## เหตุผลที่ควรใช้

`openclaw doctor` คือพื้นผิวตรวจสุขภาพของ OpenClaw ใช้เมื่อ Gateway,
ช่องทาง, Plugin, Skills, การกำหนดเส้นทางโมเดล, สถานะภายในเครื่อง หรือการย้ายข้อมูลการกำหนดค่า
ไม่ทำงานตามที่คาดไว้ และคุณต้องการคำสั่งเดียวที่อธิบายได้ว่า
เกิดอะไรผิดพลาด

Doctor มีสามโหมดการทำงาน:

| โหมดการทำงาน | คำสั่ง                   | พฤติกรรม                                                                        |
| ------- | ------------------------ | ------------------------------------------------------------------------------- |
| ตรวจสอบ | `openclaw doctor`        | การตรวจสอบที่เน้นมนุษย์และพรอมป์นำทาง                                       |
| ซ่อมแซม  | `openclaw doctor --fix`  | ใช้การซ่อมแซมที่รองรับ โดยใช้พรอมป์ ยกเว้นเมื่อการซ่อมแซมแบบไม่โต้ตอบปลอดภัย |
| Lint    | `openclaw doctor --lint` | ผลการค้นพบแบบมีโครงสร้างและอ่านอย่างเดียวสำหรับ CI, preflight และเกตการรีวิว              |

ควรใช้ `--lint` เมื่อระบบอัตโนมัติต้องการผลลัพธ์ที่เสถียร ควรใช้ `--fix` เมื่อ
ผู้ปฏิบัติงานที่เป็นมนุษย์ตั้งใจให้ doctor แก้ไขการกำหนดค่าหรือสถานะ

## ตัวอย่าง

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
```

สำหรับสิทธิ์เฉพาะช่องทาง ให้ใช้โพรบของช่องทางแทน `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

โพรบความสามารถ Discord แบบกำหนดเป้าหมายจะรายงานสิทธิ์ช่องทางที่มีผลจริงของบอต; โพรบสถานะจะตรวจสอบช่องทาง Discord ที่กำหนดค่าไว้และเป้าหมายการเข้าร่วมเสียงอัตโนมัติ

## ตัวเลือก

- `--no-workspace-suggestions`: ปิดใช้งานคำแนะนำหน่วยความจำ/การค้นหาในเวิร์กสเปซ
- `--yes`: ยอมรับค่าเริ่มต้นโดยไม่ต้องถาม
- `--repair`: ใช้การซ่อมแซมที่แนะนำซึ่งไม่ใช่บริการโดยไม่ต้องถาม; การติดตั้งและการเขียนบริการ Gateway ใหม่ยังต้องมีการยืนยันแบบโต้ตอบหรือคำสั่ง Gateway ที่ระบุชัดเจน
- `--fix`: นามแฝงของ `--repair`
- `--force`: ใช้การซ่อมแซมเชิงรุก รวมถึงการเขียนทับการกำหนดค่าบริการแบบกำหนดเองเมื่อจำเป็น
- `--non-interactive`: ทำงานโดยไม่มีพรอมป์; เฉพาะการย้ายข้อมูลที่ปลอดภัยและการซ่อมแซมที่ไม่ใช่บริการเท่านั้น
- `--generate-gateway-token`: สร้างและกำหนดค่าโทเค็น Gateway
- `--allow-exec`: อนุญาตให้ doctor เรียกใช้ SecretRefs แบบ exec ที่กำหนดค่าไว้ขณะตรวจสอบความลับ
- `--deep`: สแกนบริการระบบเพื่อหาการติดตั้ง Gateway เพิ่มเติม และรายงานการส่งต่อการรีสตาร์ทของตัวควบคุม Gateway ล่าสุด
- `--lint`: เรียกใช้การตรวจสุขภาพที่ปรับให้ทันสมัยในโหมดอ่านอย่างเดียว และปล่อยผลการวินิจฉัย
- `--post-upgrade`: เรียกใช้โพรบความเข้ากันได้ของ Plugin หลังอัปเกรด; ปล่อยผลการค้นพบไปยัง stdout; ออกด้วยรหัส 1 หากมีผลการค้นหาระดับ error อยู่
- `--json`: เมื่อใช้กับ `--lint` ให้ปล่อยผลการค้นหา JSON แทนเอาต์พุตสำหรับมนุษย์; เมื่อใช้กับ `--post-upgrade` ให้ปล่อยซอง JSON ที่เครื่องอ่านได้ (`{ probesRun, findings }`)
- `--severity-min <level>`: เมื่อใช้กับ `--lint` ให้ตัดผลการค้นหาที่ต่ำกว่า `info`, `warning` หรือ `error`
- `--all`: เมื่อใช้กับ `--lint` ให้เรียกใช้การตรวจสอบที่ลงทะเบียนทั้งหมด รวมถึงการตรวจสอบแบบ opt-in ที่ถูกยกเว้นจากชุดระบบอัตโนมัติเริ่มต้น
- `--skip <id>`: เมื่อใช้กับ `--lint` ให้ข้ามรหัสการตรวจสอบ; ทำซ้ำเพื่อข้ามมากกว่าหนึ่งรายการ
- `--only <id>`: เมื่อใช้กับ `--lint` ให้เรียกใช้เฉพาะรหัสการตรวจสอบ; ทำซ้ำเพื่อเรียกใช้ชุดที่เลือกขนาดเล็ก

## โหมด Lint

`openclaw doctor --lint` คือโหมดการทำงานแบบระบบอัตโนมัติอ่านอย่างเดียวสำหรับการตรวจสอบของ doctor
โหมดนี้ใช้เส้นทางการตรวจสุขภาพแบบมีโครงสร้าง ไม่แสดงพรอมป์ และไม่ซ่อมแซม
หรือเขียนการกำหนดค่า/สถานะใหม่ ใช้ใน CI, สคริปต์ preflight และเวิร์กโฟลว์การรีวิว
เมื่อคุณต้องการผลการค้นหาที่เครื่องอ่านได้แทนพรอมป์การซ่อมแซมแบบนำทาง
ตัวเลือกเอาต์พุต Lint เช่น `--json`, `--severity-min`, `--all`, `--only` และ `--skip`
จะยอมรับเมื่อใช้กับ `--lint` เท่านั้น

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
```

เอาต์พุตสำหรับมนุษย์จะกระชับ:

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

เอาต์พุต JSON คือพื้นผิวสคริปต์สำหรับการรัน lint:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode is unset; gateway start will be blocked.",
      "path": "gateway.mode",
      "fixHint": "Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`."
    }
  ]
}
```

พฤติกรรมการออก:

- `0`: ไม่มีผลการค้นหาที่ระดับเท่ากับหรือสูงกว่าเกณฑ์ความรุนแรงที่เลือก
- `1`: มีผลการค้นหาอย่างน้อยหนึ่งรายการที่ตรงตามเกณฑ์ที่เลือก
- `2`: คำสั่ง/รันไทม์ล้มเหลวก่อนที่จะสร้างผลการค้นหา lint ได้

`--severity-min` ควบคุมทั้งผลการค้นหาที่มองเห็นได้และเกณฑ์การออก ตัวอย่างเช่น
`openclaw doctor --lint --severity-min error` สามารถไม่พิมพ์ผลการค้นหาใดๆ และ
ออกด้วย `0` ได้ แม้ว่าจะมีผลการค้นหา `info` หรือ `warning` ที่มีความรุนแรงต่ำกว่าอยู่

`--all` ควบคุมว่าการตรวจสอบใดถูกเลือกก่อนการกรองตามความรุนแรง การรัน lint
เริ่มต้นคือเกตระบบอัตโนมัติที่เสถียร และยกเว้นการตรวจสอบที่
ตั้งใจให้เป็นแบบ opt-in เพราะเป็นการตรวจเชิงลึก เก่าแก่ หรือมีแนวโน้มมากกว่าในการ
เผยเศษตกค้างเดิมที่ซ่อมแซมได้ ใช้ `--all` เมื่อคุณต้องการรายการ lint
ครบถ้วนโดยไม่ต้องระบุรหัสการตรวจสอบแต่ละรายการ `--only <id>` ยังคงเป็น
ตัวเลือกที่แม่นยำที่สุด และสามารถเรียกใช้การตรวจสอบที่ลงทะเบียนใดๆ ตามรหัสได้

## การตรวจสุขภาพแบบมีโครงสร้าง

การตรวจสอบ doctor สมัยใหม่ใช้สัญญาแบบมีโครงสร้างขนาดเล็ก:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` ขับเคลื่อน `doctor --lint` `repair()` เป็นตัวเลือก และจะถูกพิจารณา
โดย `doctor --fix` / `doctor --repair` เท่านั้น การตรวจสอบที่ยังไม่ได้ย้ายไปยัง
รูปแบบนี้จะยังคงใช้โฟลว์การร่วมสนับสนุน doctor แบบเดิม

การแยกนี้ตั้งใจไว้: `detect()` เป็นเจ้าของการวินิจฉัย ขณะที่ `repair()` เป็นเจ้าของ
การรายงานสิ่งที่เปลี่ยนหรือจะเปลี่ยน บริบทการซ่อมแซมสามารถพกคำขอ
`dryRun`/`diff` และผลการซ่อมแซมสามารถคืน `diffs` แบบมีโครงสร้างสำหรับ
การแก้ไข config/file รวมถึง `effects` สำหรับบริการ กระบวนการ แพ็กเกจ สถานะ หรือ
ผลข้างเคียงอื่นๆ ได้ สิ่งนี้ทำให้การตรวจสอบที่แปลงแล้วเติบโตไปสู่ `doctor --fix --dry-run`
และการรายงาน diff ได้โดยไม่ต้องย้ายการวางแผนการเปลี่ยนแปลงเข้าไปใน `detect()`

`repair()` รายงานว่าได้พยายามซ่อมแซมตามที่ร้องขอหรือไม่ด้วย `status:
"repaired" | "skipped" | "failed"` หากละสถานะไว้จะหมายถึง `repaired` ดังนั้น
การตรวจซ่อมแซมแบบง่ายต้องคืนเฉพาะการเปลี่ยนแปลงเท่านั้น เมื่อการซ่อมแซมคืน `skipped` หรือ
`failed` doctor จะรายงานเหตุผลและจะไม่รันการตรวจสอบความถูกต้องสำหรับการตรวจสอบนั้น

หลังจากการซ่อมแซมแบบมีโครงสร้างสำเร็จ doctor จะรัน `detect()` ซ้ำโดยใช้
ผลการค้นหาที่ซ่อมแล้วเป็นขอบเขต การตรวจสอบสามารถใช้ผลการค้นหาที่เลือก เส้นทาง หรือค่า `ocPath`
เพื่อการตรวจสอบความถูกต้องแบบเจาะจง หากผลการค้นหายังคงอยู่ doctor จะรายงาน
คำเตือนการซ่อมแซมแทนที่จะถือว่าการเปลี่ยนแปลงเสร็จสมบูรณ์แบบเงียบๆ

ผลการค้นหาประกอบด้วย:

| ฟิลด์             | วัตถุประสงค์                                                |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | รหัสเสถียรสำหรับตัวกรอง skip/only และ allowlist ของ CI     |
| `severity`        | `info`, `warning` หรือ `error`                         |
| `message`         | คำอธิบายปัญหาที่มนุษย์อ่านได้                      |
| `path`            | เส้นทาง config, file หรือเส้นทางเชิงตรรกะเมื่อมี          |
| `line` / `column` | ตำแหน่งซอร์สเมื่อมี                        |
| `ocPath`          | ที่อยู่ `oc://` ที่แม่นยำเมื่อการตรวจสอบสามารถชี้ไปยังรายการหนึ่งได้ |
| `fixHint`         | การดำเนินการของผู้ปฏิบัติงานหรือสรุปการซ่อมแซมที่แนะนำ           |

การตรวจสอบ core doctor ที่ปรับให้ทันสมัยจะยังเชื่อมอยู่กับการร่วมสนับสนุน doctor ตามลำดับ
ที่เป็นเจ้าของพฤติกรรม `doctor` / `doctor --fix` สำหรับมนุษย์ รีจิสทรีสุขภาพแบบมีโครงสร้างที่ใช้ร่วมกัน
คือจุดขยาย: การตรวจสอบที่มาพร้อมชุดและที่มี Plugin หนุนหลังจะรัน
หลังการตรวจสอบ core doctor เมื่อแพ็กเกจเจ้าของลงทะเบียนรายการเหล่านั้นในเส้นทางคำสั่งที่ใช้งานอยู่แล้ว
ซับพาธ `openclaw/plugin-sdk/health` เปิดเผย
สัญญาเดียวกันสำหรับผู้บริโภคส่วนขยายเหล่านั้น

## การเลือกการตรวจสอบ

ใช้ `--only` และ `--skip` เมื่อเวิร์กโฟลว์ต้องการเกตแบบเจาะจง:

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` และ `--skip` รับรหัสการตรวจสอบเต็มรูปแบบและทำซ้ำได้ หากรหัส `--only`
ไม่ได้ลงทะเบียนไว้ จะไม่มีการรันการตรวจสอบสำหรับรหัสนั้น; ใช้ฟิลด์ `checksRun`
และ `checksSkipped` ของคำสั่งเพื่อตรวจสอบว่าเกตแบบเจาะจงกำลังเลือกการตรวจสอบที่คุณ
คาดหวัง

## โหมดหลังอัปเกรด

`openclaw doctor --post-upgrade` รันโพรบความเข้ากันได้ของ Plugin ที่ตั้งใจให้
ต่อเข้าหลังการบิลด์หรือการอัปเกรด ผลการค้นหาจะถูกปล่อยไปยัง stdout; คำสั่ง
ออกด้วยรหัส 1 หากผลการค้นหาใดมี `level: "error"` เพิ่ม `--json` เพื่อรับ
ซองที่เครื่องอ่านได้ (`{ probesRun, findings }`) ซึ่งเหมาะสำหรับ CI,
Skills `fork-upgrade` ของชุมชน และเครื่องมือ smoke หลังอัปเกรดอื่นๆ หาก
ดัชนี Plugin ที่ติดตั้งขาดหายหรือผิดรูปแบบ โหมด JSON ยังคงปล่อย
ซองนั้นพร้อมผลการค้นหาข้อผิดพลาด `plugin.index_unavailable`

หมายเหตุ:

- ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) การตรวจสอบ doctor แบบอ่านอย่างเดียวยังทำงานได้ แต่ `doctor --fix`, `doctor --repair`, `doctor --yes` และ `doctor --generate-gateway-token` ถูกปิดใช้งานเพราะ `openclaw.json` เปลี่ยนแปลงไม่ได้ ให้แก้ไขซอร์ส Nix สำหรับการติดตั้งนี้แทน; สำหรับ nix-openclaw ให้ใช้ [เริ่มต้นอย่างรวดเร็ว](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first
- พรอมต์แบบโต้ตอบ (เช่น การแก้ไข keychain/OAuth) จะทำงานเมื่อ stdin เป็น TTY และ **ไม่ได้** ตั้งค่า `--non-interactive` เท่านั้น การรันแบบไม่มีหน้าจอ (cron, Telegram, ไม่มีเทอร์มินัล) จะข้ามพรอมต์
- ประสิทธิภาพ: การรัน `doctor` แบบไม่โต้ตอบจะข้ามการโหลด Plugin ล่วงหน้า เพื่อให้การตรวจสุขภาพแบบไม่มีหน้าจอยังคงรวดเร็ว เซสชัน doctor แบบโต้ตอบยังโหลดพื้นผิว Plugin ที่จำเป็นสำหรับโฟลว์ตรวจสุขภาพและซ่อมแซมแบบเดิม
- `--lint` เข้มงวดกว่า `--non-interactive`: เป็นแบบอ่านอย่างเดียวเสมอ ไม่ถามพรอมต์ และไม่ใช้การย้ายข้อมูลที่ปลอดภัย เรียกใช้ `doctor --fix` หรือ `doctor --repair` เมื่อต้องการให้ doctor ทำการเปลี่ยนแปลง
- โดยค่าเริ่มต้น doctor จะไม่เรียกใช้ SecretRefs แบบ `exec` ขณะตรวจสอบ secrets ใช้ `openclaw doctor --allow-exec` หรือ `openclaw doctor --lint --allow-exec` เฉพาะเมื่อคุณตั้งใจให้ doctor เรียกใช้ตัวแก้ Secret ที่กำหนดค่าไว้เหล่านั้น
- `--fix` (นามแฝงของ `--repair`) เขียนไฟล์สำรองไปที่ `~/.openclaw/openclaw.json.bak` และลบคีย์ config ที่ไม่รู้จัก พร้อมแสดงรายการการลบแต่ละรายการ
- การตรวจสุขภาพที่ปรับให้ทันสมัยสามารถเปิดเส้นทาง `repair()` สำหรับ `doctor --fix`; การตรวจที่ไม่ได้เปิดเส้นทางดังกล่าวจะดำเนินต่อผ่านโฟลว์ซ่อมแซม doctor ที่มีอยู่
- `doctor --fix --non-interactive` รายงานนิยามบริการ Gateway ที่ขาดหายหรือเก่า แต่จะไม่ติดตั้งหรือเขียนใหม่ภายนอกโหมดซ่อมแซมการอัปเดต เรียกใช้ `openclaw gateway install` สำหรับบริการที่ขาดหาย หรือ `openclaw gateway install --force` เมื่อคุณตั้งใจแทนที่ launcher
- ตอนนี้การตรวจความสมบูรณ์ของ state ตรวจพบไฟล์ transcript กำพร้าในไดเรกทอรี sessions แล้ว การเก็บถาวรไฟล์เหล่านั้นเป็น `.deleted.<timestamp>` ต้องมีการยืนยันแบบโต้ตอบ; `--fix`, `--yes` และการรันแบบไม่มีหน้าจอจะปล่อยไฟล์ไว้ที่เดิม
- doctor ยังสแกน `~/.openclaw/cron/jobs.json` (หรือ `cron.store`) เพื่อหารูปแบบงาน Cron เดิม และเขียนใหม่ก่อนนำเข้าแถว canonical ไปยัง SQLite
- doctor รายงานงาน Cron ที่มีการ override `payload.model` อย่างชัดเจน รวมถึงจำนวน namespace ของ provider และความไม่ตรงกันกับ `agents.defaults.model` เพื่อให้งานตามกำหนดเวลาที่ไม่สืบทอดโมเดลเริ่มต้นมองเห็นได้ระหว่างการตรวจสอบ auth หรือ billing
- บน Linux doctor เตือนเมื่อ crontab ของผู้ใช้ยังเรียกใช้ `~/.openclaw/bin/ensure-whatsapp.sh` แบบเดิม; สคริปต์นั้นไม่ได้รับการดูแลแล้วและอาจบันทึกเหตุขัดข้องของ WhatsApp Gateway ที่เป็น false เมื่อ cron ไม่มีสภาพแวดล้อม systemd user-bus
- เมื่อเปิดใช้ WhatsApp doctor จะตรวจหา event loop ของ Gateway ที่เสื่อมสภาพพร้อมกับไคลเอนต์ `openclaw-tui` ในเครื่องที่ยังทำงานอยู่ `doctor --fix` จะหยุดเฉพาะไคลเอนต์ TUI ในเครื่องที่ตรวจยืนยันแล้ว เพื่อไม่ให้การตอบกลับของ WhatsApp ถูกคิวไว้หลัง loop รีเฟรช TUI ที่ค้างอยู่
- doctor เขียน model refs เดิมแบบ `openai-codex/*` ใหม่เป็น refs canonical แบบ `openai/*` ครอบคลุมโมเดลหลัก, fallbacks, โมเดลสร้างภาพ/วิดีโอ, overrides สำหรับ heartbeat/subagent/compaction, hooks, overrides โมเดลของ channel และ route pins ของเซสชันที่เก่า `--fix` ยังย้ายโปรไฟล์ auth เดิมแบบ `openai-codex:*` และรายการ `auth.order.openai-codex` ไปเป็น `openai:*`, ย้ายเจตนา Codex ไปยังรายการ `agentRuntime.id: "codex"` ที่ผูกกับ provider/model, ลบ pins ของ runtime ทั้ง agent/เซสชันที่เก่า และคง refs ของ agent OpenAI ที่ซ่อมแล้วไว้บน routing auth ของ Codex แทน auth คีย์ API ของ OpenAI โดยตรง
- doctor ล้าง state การ staging dependency ของ Plugin เดิมที่สร้างโดย OpenClaw เวอร์ชันเก่า และลิงก์แพ็กเกจ host `openclaw` ใหม่สำหรับ Plugin npm ที่จัดการซึ่งประกาศเป็น peer dependency นอกจากนี้ยังซ่อม Plugin ที่ดาวน์โหลดได้ซึ่งขาดหายและถูกอ้างอิงโดย config เช่น `plugins.entries`, channels ที่กำหนดค่าไว้, การตั้งค่า provider/search ที่กำหนดค่าไว้ หรือ runtimes ของ agent ที่กำหนดค่าไว้ ระหว่างการอัปเดตแพ็กเกจ doctor จะข้ามการซ่อม Plugin ของ package-manager จนกว่าการสลับแพ็กเกจจะเสร็จสิ้น; เรียกใช้ `openclaw doctor --fix` อีกครั้งหลังจากนั้นหาก Plugin ที่กำหนดค่าไว้ยังต้องกู้คืน หากการดาวน์โหลดล้มเหลว doctor จะรายงานข้อผิดพลาดการติดตั้งและเก็บรายการ Plugin ที่กำหนดค่าไว้สำหรับความพยายามซ่อมครั้งถัดไป
- doctor ซ่อม config ของ Plugin ที่เก่าโดยลบ ids ของ Plugin ที่ขาดหายจาก `plugins.allow`/`plugins.deny`/`plugins.entries` พร้อม config ของ channel ที่ค้างอยู่, targets ของ Heartbeat และ overrides โมเดลของ channel ที่ตรงกัน เมื่อการค้นหา Plugin มีสุขภาพดี
- doctor กักกัน config ของ Plugin ที่ไม่ถูกต้องโดยปิดใช้งานรายการ `plugins.entries.<id>` ที่ได้รับผลกระทบ และลบ payload `config` ที่ไม่ถูกต้อง การเริ่มต้น Gateway ข้ามเฉพาะ Plugin ที่เสียอยู่แล้ว เพื่อให้ Plugin และ channels อื่นยังทำงานต่อได้
- ตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ supervisor อื่นเป็นเจ้าของ lifecycle ของ Gateway doctor ยังคงรายงานสุขภาพ Gateway/บริการ และใช้การซ่อมแซมที่ไม่ใช่บริการ แต่จะข้ามการติดตั้ง/เริ่ม/รีสตาร์ต/bootstrap บริการ และการล้างบริการเดิม
- บน Linux doctor จะละเว้น systemd units เพิ่มเติมที่คล้าย Gateway แต่ไม่ active และจะไม่เขียน metadata ของคำสั่ง/entrypoint ใหม่สำหรับบริการ Gateway ของ systemd ที่กำลังทำงานระหว่างการซ่อมแซม หยุดบริการก่อน หรือใช้ `openclaw gateway install --force` เมื่อคุณตั้งใจแทนที่ launcher ที่ active
- doctor ย้าย config Talk แบบแบนเดิม (`talk.voiceId`, `talk.modelId` และรายการที่เกี่ยวข้อง) ไปเป็น `talk.provider` + `talk.providers.<provider>` โดยอัตโนมัติ
- การรัน `doctor --fix` ซ้ำจะไม่รายงาน/ใช้การทำให้ Talk เป็นมาตรฐานอีกต่อไป เมื่อความแตกต่างมีเพียงลำดับคีย์ของ object
- doctor รวมการตรวจความพร้อม memory-search และสามารถแนะนำ `openclaw configure --section model` เมื่อขาด credentials สำหรับ embedding
- doctor เตือนเมื่อไม่มีการกำหนดค่าเจ้าของคำสั่ง เจ้าของคำสั่งคือบัญชีผู้ปฏิบัติการที่เป็นมนุษย์ซึ่งได้รับอนุญาตให้รันคำสั่งสำหรับเจ้าของเท่านั้นและอนุมัติการดำเนินการที่อันตราย การจับคู่ DM เพียงแค่อนุญาตให้บางคนคุยกับบอตได้; หากคุณอนุมัติผู้ส่งก่อนมี bootstrap เจ้าของคนแรก ให้ตั้งค่า `commands.ownerAllowFrom` อย่างชัดเจน
- doctor รายงานหมายเหตุข้อมูลเมื่อมีการกำหนดค่า agents ในโหมด Codex และมี assets ของ Codex CLI ส่วนบุคคลอยู่ใน Codex home ของผู้ปฏิบัติการ การเปิด app-server ของ Codex ในเครื่องใช้ homes แยกต่อ agent ดังนั้นให้ติดตั้ง Codex Plugin ก่อนหากจำเป็น จากนั้นใช้ `openclaw migrate plan codex` เพื่อทำบัญชี assets ที่ควรเลื่อนสถานะอย่างตั้งใจ
- doctor ลบ `plugins.entries.codex.config.codexDynamicToolsProfile` ที่เลิกใช้แล้ว; app-server ของ Codex จะคงเครื่องมือ workspace แบบ Codex-native เป็น native เสมอ
- doctor เตือนเมื่อ Skills ที่อนุญาตสำหรับ agent เริ่มต้นไม่พร้อมใช้งานในสภาพแวดล้อม runtime ปัจจุบัน เพราะขาด bins, env vars, config หรือข้อกำหนดของ OS `doctor --fix` สามารถปิดใช้งาน Skills ที่ไม่พร้อมเหล่านั้นด้วย `skills.entries.<skill>.enabled=false`; ให้ติดตั้ง/กำหนดค่าข้อกำหนดที่ขาดแทนเมื่อคุณต้องการให้ skill ยัง active
- หากเปิดใช้โหมด sandbox แต่ Docker ไม่พร้อมใช้งาน doctor จะรายงานคำเตือนที่มีสัญญาณชัดเจนพร้อมวิธีแก้ไข (`install Docker` หรือ `openclaw config set agents.defaults.sandbox.mode off`)
- หากมีไฟล์ registry หรือไดเรกทอรี shard ของ sandbox เดิม (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` หรือ `~/.openclaw/sandbox/browsers/`) doctor จะรายงานรายการเหล่านั้น; `openclaw doctor --fix` จะย้ายรายการที่ถูกต้องเข้า SQLite และกักกันไฟล์เดิมที่ไม่ถูกต้อง
- หาก `gateway.auth.token`/`gateway.auth.password` ถูกจัดการด้วย SecretRef และไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานคำเตือนแบบอ่านอย่างเดียว และจะไม่เขียน credentials fallback แบบ plaintext สำหรับ SecretRefs ที่มี exec หนุนหลัง doctor จะข้ามการเรียกใช้เว้นแต่มี `--allow-exec`
- หากการตรวจ SecretRef ของ channel ล้มเหลวในเส้นทาง fix doctor จะดำเนินต่อและรายงานคำเตือนแทนการออกก่อนเวลา
- หลังจากการย้ายไดเรกทอรี state doctor จะเตือนเมื่อบัญชี Telegram หรือ Discord เริ่มต้นที่เปิดใช้พึ่งพา env fallback และ `TELEGRAM_BOT_TOKEN` หรือ `DISCORD_BOT_TOKEN` ไม่พร้อมใช้งานสำหรับโปรเซส doctor
- การ resolve อัตโนมัติของ username ใน Telegram `allowFrom` (`doctor --fix`) ต้องมี token ของ Telegram ที่ resolve ได้ในเส้นทางคำสั่งปัจจุบัน หากการตรวจ token ไม่พร้อมใช้งาน doctor จะรายงานคำเตือนและข้ามการ resolve อัตโนมัติสำหรับรอบนั้น

## macOS: การ override env ของ `launchctl`

หากคุณเคยรัน `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (หรือ `...PASSWORD`) มาก่อน ค่านั้นจะ override ไฟล์ config ของคุณ และอาจทำให้เกิดข้อผิดพลาด "unauthorized" ต่อเนื่อง

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Gateway doctor](/th/gateway/doctor)
