---
read_when:
    - การใช้หรือการแก้ไขเครื่องมือ exec
    - การดีบักพฤติกรรม stdin หรือ TTY
summary: การใช้งานเครื่องมือ Exec, โหมด stdin และการรองรับ TTY
title: เครื่องมือ Exec
x-i18n:
    generated_at: "2026-06-27T18:27:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2831d9e66b25ce251f90e59a41b25234e22106d865466e61b878e3999e849dc
    source_path: tools/exec.md
    workflow: 16
---

เรียกใช้คำสั่งเชลล์ในเวิร์กสเปซ `exec` เป็นพื้นผิวเชลล์ที่เปลี่ยนแปลงสถานะได้: คำสั่งสามารถสร้าง แก้ไข หรือลบไฟล์ได้ทุกที่ที่โฮสต์หรือระบบไฟล์แซนด์บ็อกซ์ที่เลือกอนุญาต การปิดใช้งานเครื่องมือระบบไฟล์ของ OpenClaw เช่น `write`, `edit` หรือ `apply_patch` ไม่ได้ทำให้ `exec` เป็นแบบอ่านอย่างเดียว

รองรับการดำเนินการแบบ foreground + background ผ่าน `process` หากไม่อนุญาตให้ใช้ `process` `exec` จะรันแบบซิงโครนัสและละเว้น `yieldMs`/`background`
เซสชันพื้นหลังถูกกำหนดขอบเขตต่อเอเจนต์; `process` จะเห็นเฉพาะเซสชันจากเอเจนต์เดียวกัน

## พารามิเตอร์

<ParamField path="command" type="string" required>
คำสั่งเชลล์ที่จะเรียกใช้
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
ไดเรกทอรีทำงานสำหรับคำสั่ง
</ParamField>

<ParamField path="env" type="object">
การแทนที่สภาพแวดล้อมแบบคีย์/ค่าที่ผสานทับบนสภาพแวดล้อมที่สืบทอดมา
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
ย้ายคำสั่งไปเป็นพื้นหลังโดยอัตโนมัติหลังจากการหน่วงเวลานี้ (มิลลิวินาที)
</ParamField>

<ParamField path="background" type="boolean" default="false">
ย้ายคำสั่งไปเป็นพื้นหลังทันทีแทนการรอ `yieldMs`
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
แทนที่ timeout ของ exec ที่กำหนดค่าสำหรับการเรียกนี้ ตั้ง `timeout: 0` เฉพาะเมื่อคำสั่งควรรันโดยไม่มี timeout ของกระบวนการ exec
</ParamField>

<ParamField path="pty" type="boolean" default="false">
รันในเทอร์มินัลเทียมเมื่อพร้อมใช้งาน ใช้สำหรับ CLI ที่ต้องใช้ TTY เท่านั้น เอเจนต์เขียนโค้ด และ UI เทอร์มินัล
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
ตำแหน่งที่จะดำเนินการ `auto` จะ resolve เป็น `sandbox` เมื่อรันไทม์แซนด์บ็อกซ์ทำงานอยู่ และเป็น `gateway` ในกรณีอื่น
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
ถูกละเว้นสำหรับการเรียกเครื่องมือปกติ ความปลอดภัยของ `gateway` / `node` ถูกควบคุมโดย
`tools.exec.security` และไฟล์อนุมัติของโฮสต์; โหมดยกระดับสามารถ
บังคับ `security=full` ได้เฉพาะเมื่อผู้ปฏิบัติให้สิทธิ์ยกระดับอย่างชัดเจน
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
โหมดถามพื้นฐานมาจาก `tools.exec.ask` และการอนุมัติของโฮสต์
สำหรับการเรียกโมเดลที่มีต้นทางจากช่องทาง `ask` ต่อการเรียกจะถูกละเว้นเมื่อ
การถามของโฮสต์ที่มีผลเป็น `off`; มิฉะนั้นจะทำได้เพียงเพิ่มความเข้มงวดเป็นโหมดที่เข้มงวดกว่า
ผู้เรียกภายใน/API ที่เชื่อถือได้ซึ่งสร้างเครื่องมือ exec ด้วยค่า `ask` ที่ชัดเจนจะไม่เปลี่ยนแปลง
</ParamField>

<ParamField path="node" type="string">
รหัส/ชื่อ Node เมื่อ `host=node`
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
ร้องขอโหมดยกระดับ — ออกจากแซนด์บ็อกซ์ไปยังพาธโฮสต์ที่กำหนดค่าไว้ `security=full` จะถูกบังคับเฉพาะเมื่อ elevated resolve เป็น `full`
</ParamField>

หมายเหตุ:

- `host` มีค่าเริ่มต้นเป็น `auto`: ใช้แซนด์บ็อกซ์เมื่อรันไทม์แซนด์บ็อกซ์ทำงานอยู่สำหรับเซสชัน มิฉะนั้นใช้ gateway
- `host` รับเฉพาะ `auto`, `sandbox`, `gateway` หรือ `node` เท่านั้น ไม่ใช่ตัวเลือกชื่อโฮสต์; ค่าที่ดูเหมือนชื่อโฮสต์จะถูกปฏิเสธก่อนคำสั่งรัน
- `auto` เป็นกลยุทธ์การกำหนดเส้นทางเริ่มต้น ไม่ใช่ไวลด์การ์ด อนุญาต `host=node` ต่อการเรียกจาก `auto`; อนุญาต `host=gateway` ต่อการเรียกเฉพาะเมื่อไม่มีรันไทม์แซนด์บ็อกซ์ทำงานอยู่
- `tools.exec.mode` เป็นตัวปรับนโยบายที่ทำให้เป็นปกติแล้ว ค่าได้แก่ `deny`, `allowlist`, `ask`, `auto` และ `full` `auto` จะรันการจับคู่ allowlist/safe-bin แบบกำหนดผลแน่นอนโดยตรง และส่งทุกกรณีการอนุมัติ exec ที่เหลือผ่านผู้ตรวจสอบอัตโนมัติเนทีฟของ OpenClaw ก่อนถามมนุษย์ `ask` / `ask=always` ยังถามมนุษย์ทุกครั้ง
- เมื่อไม่มีคอนฟิกเพิ่มเติม `host=auto` ยังคง "ใช้งานได้เลย": ไม่มีแซนด์บ็อกซ์หมายถึง resolve เป็น `gateway`; มีแซนด์บ็อกซ์สดหมายถึงยังอยู่ในแซนด์บ็อกซ์
- `elevated` ออกจากแซนด์บ็อกซ์ไปยังพาธโฮสต์ที่กำหนดค่าไว้: ค่าเริ่มต้นคือ `gateway` หรือ `node` เมื่อ `tools.exec.host=node` (หรือค่าเริ่มต้นของเซสชันคือ `host=node`) ใช้ได้เฉพาะเมื่อเปิดใช้งานสิทธิ์ยกระดับสำหรับเซสชัน/ผู้ให้บริการปัจจุบัน
- การอนุมัติ `gateway`/`node` ถูกควบคุมโดยไฟล์อนุมัติของโฮสต์
- `node` ต้องมี node ที่จับคู่ไว้ (แอปคู่หูหรือโฮสต์ node แบบ headless)
- หากมีหลาย node ให้ตั้ง `exec.node` หรือ `tools.exec.node` เพื่อเลือกหนึ่งรายการ
- `exec host=node` เป็นพาธการดำเนินการเชลล์เพียงทางเดียวสำหรับ node; wrapper เดิม `nodes.run` ถูกลบแล้ว
- `timeout` ใช้กับการดำเนินการ foreground, background, `yieldMs`, gateway, sandbox และ node `system.run` หากละเว้น OpenClaw จะใช้ `tools.exec.timeoutSec`; `timeout: 0` ที่ระบุชัดเจนจะปิดใช้งาน timeout ของกระบวนการ exec สำหรับการเรียกนั้น
- บนโฮสต์ที่ไม่ใช่ Windows exec ใช้ `SHELL` เมื่อตั้งค่าไว้; หาก `SHELL` เป็น `fish` จะเลือกใช้ `bash` (หรือ `sh`)
  จาก `PATH` เพื่อหลีกเลี่ยงสคริปต์ที่ไม่เข้ากันกับ fish แล้วจึง fallback ไปที่ `SHELL` หากไม่มีทั้งสองอย่าง
- บนโฮสต์ Windows exec จะเลือกใช้การค้นพบ PowerShell 7 (`pwsh`) ก่อน (Program Files, ProgramW6432 แล้วจึง PATH)
  แล้วจึง fallback ไปที่ Windows PowerShell 5.1
- บนโฮสต์ gateway ที่ไม่ใช่ Windows คำสั่ง exec ของ bash และ zsh ใช้สแนปช็อตเริ่มต้น OpenClaw จะจับ alias/function ที่ source ได้
  และชุดสภาพแวดล้อมปลอดภัยขนาดเล็กจากไฟล์เริ่มต้นของเชลล์ไว้ใน
  `$OPENCLAW_STATE_DIR/cache/shell-snapshots/` แล้ว source สแนปช็อตนั้นก่อนคำสั่ง exec แต่ละครั้ง
  ตัวแปรที่ดูเหมือนเป็นความลับจะถูกยกเว้น; sandbox และ node exec ไม่ใช้สแนปช็อตนี้ ตั้งค่า
  `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` ในสภาพแวดล้อมกระบวนการ Gateway เพื่อปิดใช้งานพาธสแนปช็อตนี้
- การดำเนินการบนโฮสต์ (`gateway`/`node`) ปฏิเสธ `env.PATH` และการแทนที่ loader (`LD_*`/`DYLD_*`) เพื่อ
  ป้องกันการ hijack ไบนารีหรือโค้ดที่ถูกฉีดเข้าไป
- OpenClaw ตั้ง `OPENCLAW_SHELL=exec` ในสภาพแวดล้อมของคำสั่งที่ spawn (รวมถึงการดำเนินการ PTY และ sandbox) เพื่อให้กฎ shell/profile ตรวจจับบริบทของเครื่องมือ exec ได้
- สำหรับการรันที่มีต้นทางจากช่องทาง OpenClaw ยังเปิดเผย payload JSON ระบุตัวตนผู้ส่ง/แชตแบบแคบใน
  `OPENCLAW_CHANNEL_CONTEXT` เมื่อช่องทางให้ id เหล่านั้นมา
- `openclaw channels login` ถูกบล็อกจาก `exec` เพราะเป็นโฟลว์ยืนยันตัวตนช่องทางแบบโต้ตอบ; ให้รันในเทอร์มินัลบนโฮสต์ gateway หรือใช้เครื่องมือเข้าสู่ระบบเนทีฟของช่องทางจากแชตเมื่อมี
- สำคัญ: การทำแซนด์บ็อกซ์ **ปิดโดยค่าเริ่มต้น** หากปิดแซนด์บ็อกซ์ `host=auto` โดยนัย
  จะ resolve เป็น `gateway` ส่วน `host=sandbox` ที่ระบุชัดเจนยังคงล้มเหลวแบบปิดแทนที่จะ
  รันบนโฮสต์ gateway อย่างเงียบ ๆ เปิดใช้งานแซนด์บ็อกซ์หรือใช้ `host=gateway` พร้อมการอนุมัติ
- การตรวจสอบล่วงหน้าของสคริปต์ (สำหรับข้อผิดพลาดไวยากรณ์เชลล์ Python/Node ที่พบบ่อย) จะตรวจเฉพาะไฟล์ภายในขอบเขต
  `workdir` ที่มีผล หากพาธสคริปต์ resolve ออกนอก `workdir` การตรวจสอบล่วงหน้าจะถูกข้ามสำหรับ
  ไฟล์นั้น
- สำหรับงานที่ใช้เวลานานซึ่งเริ่มตอนนี้ ให้เริ่มหนึ่งครั้งและพึ่งพาการปลุกเมื่อเสร็จสิ้นโดยอัตโนมัติ
  เมื่อเปิดใช้งานและคำสั่งส่ง output หรือ fail
  ใช้ `process` สำหรับ logs, status, input หรือการแทรกแซง; อย่าจำลอง
  การจัดกำหนดการด้วยลูป sleep, ลูป timeout หรือการ polling ซ้ำ
- สำหรับงานที่ควรเกิดขึ้นภายหลังหรือตามกำหนดการ ให้ใช้ cron แทนรูปแบบ sleep/delay ของ
  `exec`

## คอนฟิก

- `tools.exec.notifyOnExit` (ค่าเริ่มต้น: true): เมื่อเป็น true เซสชัน exec ที่ถูกย้ายไปพื้นหลังจะเข้าคิวอีเวนต์ระบบและร้องขอ Heartbeat เมื่อออก
- `tools.exec.approvalRunningNoticeMs` (ค่าเริ่มต้น: 10000): ส่งประกาศ "กำลังรัน" หนึ่งครั้งเมื่อ exec ที่ต้องผ่านการอนุมัติรันนานกว่านี้ (0 ปิดใช้งาน)
- `tools.exec.timeoutSec` (ค่าเริ่มต้น: 1800): timeout exec เริ่มต้นต่อคำสั่งเป็นวินาที `timeout` ต่อการเรียกจะแทนที่ค่านี้; `timeout: 0` ต่อการเรียกจะปิดใช้งาน timeout ของกระบวนการ exec
- `tools.exec.host` (ค่าเริ่มต้น: `auto`; resolve เป็น `sandbox` เมื่อรันไทม์แซนด์บ็อกซ์ทำงานอยู่ มิฉะนั้นเป็น `gateway`)
- `tools.exec.security` (ค่าเริ่มต้น: `deny` สำหรับ sandbox, `full` สำหรับ gateway + node เมื่อไม่ได้ตั้งค่า)
- `tools.exec.ask` (ค่าเริ่มต้น: `off`)
- exec โฮสต์แบบไม่ต้องอนุมัติเป็นค่าเริ่มต้นสำหรับ gateway + node หากคุณต้องการพฤติกรรมการอนุมัติ/allowlist ให้เข้มงวดทั้ง `tools.exec.*` และไฟล์อนุมัติของโฮสต์; ดู [การอนุมัติ Exec](/th/tools/exec-approvals#yolo-mode-no-approval)
- YOLO มาจากค่าเริ่มต้นของนโยบายโฮสต์ (`security=full`, `ask=off`) ไม่ได้มาจาก `host=auto` หากคุณต้องการบังคับการกำหนดเส้นทาง gateway หรือ node ให้ตั้ง `tools.exec.host` หรือใช้ `/exec host=...`
- ในโหมด `security=full` บวก `ask=off` host exec จะทำตามนโยบายที่กำหนดค่าไว้โดยตรง; ไม่มีชั้นตัวกรองล่วงหน้า heuristic เพิ่มเติมสำหรับการพรางคำสั่งหรือชั้นปฏิเสธการตรวจสอบล่วงหน้าของสคริปต์
- `tools.exec.node` (ค่าเริ่มต้น: unset)
- `tools.exec.strictInlineEval` (ค่าเริ่มต้น: false): เมื่อเป็น true รูปแบบ eval ของ interpreter แบบ inline เช่น `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` และ `osascript -e` ต้องมีผู้ตรวจสอบหรือการอนุมัติที่ชัดเจน ใน `mode=auto` พาธการอนุมัติ exec ปกติอาจให้ผู้ตรวจสอบอัตโนมัติเนทีฟอนุญาตคำสั่งครั้งเดียวที่มีความเสี่ยงต่ำอย่างชัดเจนได้; การเรียก `system.run` บนโฮสต์ node โดยตรงยังต้องมีการอนุมัติที่ชัดเจน เพราะไม่สามารถส่งคำสั่งไปยังเส้นทางอนุมัติโดยมนุษย์ได้ หากผู้ตรวจสอบถาม คำขอจะไปยังมนุษย์ `allow-always` ยังสามารถคงการเรียก interpreter/script ที่ไม่เป็นอันตรายไว้ได้ แต่รูปแบบ inline-eval จะไม่กลายเป็นกฎอนุญาตถาวร
- `tools.exec.commandHighlighting` (ค่าเริ่มต้น: false): เมื่อเป็น true prompt การอนุมัติสามารถไฮไลต์ช่วงคำสั่งที่ parser หาได้ในข้อความคำสั่ง ตั้งเป็น `true` ทั่วไปหรือรายเอเจนต์เพื่อเปิดใช้งานการไฮไลต์ข้อความคำสั่งโดยไม่เปลี่ยนนโยบายการอนุมัติ exec
- `tools.exec.pathPrepend`: รายการไดเรกทอรีที่จะเติมนำหน้า `PATH` สำหรับการรัน exec (เฉพาะ gateway + sandbox)
- `tools.exec.safeBins`: ไบนารีปลอดภัยแบบ stdin-only ที่รันได้โดยไม่ต้องมีรายการ allowlist ที่ชัดเจน สำหรับรายละเอียดพฤติกรรม ดู [Safe bins](/th/tools/exec-approvals-advanced#safe-bins-stdin-only)
- `tools.exec.safeBinTrustedDirs`: ไดเรกทอรีเพิ่มเติมที่ระบุชัดเจนซึ่งเชื่อถือสำหรับการตรวจพาธ `safeBins` รายการ `PATH` จะไม่ถูกเชื่อถือโดยอัตโนมัติ ค่าเริ่มต้นในตัวคือ `/bin` และ `/usr/bin`
- `tools.exec.safeBinProfiles`: นโยบาย argv แบบกำหนดเองที่เลือกได้ต่อ safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`)

ตัวอย่าง:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### การจัดการ PATH

- `host=gateway`: ผสาน `PATH` ของ login-shell ของคุณเข้ากับสภาพแวดล้อม exec การแทนที่ `env.PATH`
  จะถูกปฏิเสธสำหรับการดำเนินการบนโฮสต์ ตัว daemon เองยังรันด้วย `PATH` ขั้นต่ำ:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
    - เพื่อป้องกันไม่ให้การกำหนดค่าเชลล์ของผู้ใช้ (เช่น `~/.zshenv` หรือ `/etc/zshenv`) แทนที่พาธลำดับความสำคัญระหว่างการเริ่มต้น รายการ `tools.exec.pathPrepend` จะถูกเติมนำหน้าอย่างปลอดภัยไปยัง `PATH` สุดท้ายภายในคำสั่งเชลล์ก่อนดำเนินการ
- `host=sandbox`: รัน `sh -lc` (login shell) ภายในคอนเทนเนอร์ ดังนั้น `/etc/profile` อาจรีเซ็ต `PATH`
  OpenClaw เติม `env.PATH` นำหน้าหลังจาก source โปรไฟล์ผ่าน env var ภายใน (ไม่มีการ interpolate ของเชลล์);
  `tools.exec.pathPrepend` ใช้ที่นี่ด้วย
- `host=node`: ส่งเฉพาะการแทนที่ env ที่ไม่ถูกบล็อกที่คุณส่งผ่านไปยัง node การแทนที่ `env.PATH`
  จะถูกปฏิเสธสำหรับการดำเนินการบนโฮสต์และถูกละเว้นโดยโฮสต์ node หากคุณต้องการรายการ PATH เพิ่มเติมบน node
  ให้กำหนดค่าสภาพแวดล้อมบริการโฮสต์ node (systemd/launchd) หรือติดตั้งเครื่องมือในตำแหน่งมาตรฐาน

การผูก node รายเอเจนต์ (ใช้ดัชนีรายการเอเจนต์ในคอนฟิก):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI: แท็บ Nodes มีแผง "การผูก node ของ Exec" ขนาดเล็กสำหรับการตั้งค่าเดียวกัน

## การแทนที่ของเซสชัน (`/exec`)

ใช้ `/exec` เพื่อตั้งค่าเริ่มต้น **ต่อเซสชัน** สำหรับ `host`, `security`, `ask` และ `node`
ส่ง `/exec` โดยไม่มีอาร์กิวเมนต์เพื่อแสดงค่าปัจจุบัน

ตัวอย่าง:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## โมเดลการอนุญาต

`/exec` จะมีผลเฉพาะกับ **ผู้ส่งที่ได้รับอนุญาต** (รายการอนุญาต/การจับคู่ของช่องทาง รวมกับ `commands.useAccessGroups`)
โดยอัปเดตเฉพาะ **สถานะเซสชันเท่านั้น** และไม่เขียน config ผู้ส่งจากช่องทางภายนอกที่ได้รับอนุญาตอาจ
ตั้งค่าเริ่มต้นของเซสชันเหล่านี้ได้ ไคลเอนต์ Gateway/webchat ภายในต้องมี `operator.admin` จึงจะบันทึกค่าเหล่านี้ได้
หากต้องการปิดใช้งาน exec แบบถาวร ให้ปฏิเสธผ่านนโยบายเครื่องมือ (`tools.deny: ["exec"]` หรือกำหนดต่อ agent) การอนุมัติจากโฮสต์
ยังคงมีผล เว้นแต่คุณจะตั้งค่า `security=full` และ `ask=off` อย่างชัดเจน

## การอนุมัติ exec (แอปคู่ขนาน / โฮสต์ Node)

agent ที่อยู่ใน sandbox อาจต้องขออนุมัติรายคำขอก่อนที่ `exec` จะรันบน Gateway หรือโฮสต์ Node
ดู [การอนุมัติ exec](/th/tools/exec-approvals) สำหรับนโยบาย รายการอนุญาต และโฟลว์ UI

เมื่อจำเป็นต้องมีการอนุมัติ เครื่องมือ exec จะส่งคืนทันทีพร้อม
`status: "approval-pending"` และ id การอนุมัติ เมื่อได้รับอนุมัติแล้ว (หรือถูกปฏิเสธ / หมดเวลา)
Gateway จะปล่อยเหตุการณ์ระบบความคืบหน้าและการเสร็จสิ้นของคำสั่งเฉพาะสำหรับการรันที่ได้รับอนุมัติเท่านั้น
(`Exec running` / `Exec finished`) การอนุมัติที่ถูกปฏิเสธหรือหมดเวลาถือเป็นสถานะสิ้นสุด และจะไม่
ปลุกเซสชัน agent ด้วยเหตุการณ์ระบบการปฏิเสธ
ในช่องทางที่มีการ์ด/ปุ่มอนุมัติแบบ native agent ควรพึ่งพา
UI native นั้นก่อน และรวมคำสั่ง `/approve` แบบแมนนวลเฉพาะเมื่อผลลัพธ์ของเครื่องมือ
ระบุอย่างชัดเจนว่าการอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบแมนนวลเป็น
เส้นทางเดียวเท่านั้น

## รายการอนุญาต + safe bins

การบังคับใช้รายการอนุญาตแบบแมนนวลจะจับคู่ glob ของพาธไบนารีที่ resolve แล้ว และ glob ของชื่อคำสั่งเปล่า
ชื่อเปล่าจะจับคู่เฉพาะคำสั่งที่เรียกผ่าน PATH ดังนั้น `rg` จึงสามารถจับคู่กับ
`/opt/homebrew/bin/rg` ได้เมื่อคำสั่งคือ `rg` แต่จะไม่จับคู่ `./rg` หรือ `/tmp/rg`
เมื่อ `security=allowlist` คำสั่ง shell จะได้รับอนุญาตอัตโนมัติเฉพาะเมื่อทุก segment ของ pipeline
อยู่ในรายการอนุญาตหรือเป็น safe bin การเชื่อมคำสั่ง (`;`, `&&`, `||`) และ redirection
จะถูกปฏิเสธในโหมดรายการอนุญาต เว้นแต่ทุก segment ระดับบนสุดจะผ่าน
รายการอนุญาต (รวมถึง safe bins) Redirection ยังคงไม่รองรับ
ความเชื่อถือแบบถาวร `allow-always` จะไม่ข้ามกฎนั้น: คำสั่งที่เชื่อมกันยังต้องให้ทุก
segment ระดับบนสุดจับคู่ได้

`autoAllowSkills` เป็นเส้นทางอำนวยความสะดวกแยกต่างหากในการอนุมัติ exec ไม่เหมือนกับ
รายการอนุญาตพาธแบบแมนนวล สำหรับความเชื่อถือแบบชัดเจนที่เข้มงวด ให้ปิดใช้งาน `autoAllowSkills` ไว้

ใช้ตัวควบคุมสองแบบนี้สำหรับงานที่ต่างกัน:

- `tools.exec.safeBins`: ตัวกรองสตรีมขนาดเล็กที่รับเฉพาะ stdin
- `tools.exec.safeBinTrustedDirs`: ไดเรกทอรีที่เชื่อถือเพิ่มเติมอย่างชัดเจนสำหรับพาธ executable ของ safe-bin
- `tools.exec.safeBinProfiles`: นโยบาย argv ที่ชัดเจนสำหรับ safe bins แบบกำหนดเอง
- รายการอนุญาต: ความเชื่อถือที่ชัดเจนสำหรับพาธ executable

อย่าถือว่า `safeBins` เป็นรายการอนุญาตทั่วไป และอย่าเพิ่มไบนารี interpreter/runtime (เช่น `python3`, `node`, `ruby`, `bash`) หากคุณต้องการสิ่งเหล่านั้น ให้ใช้รายการอนุญาตที่ชัดเจนและเปิด prompt การอนุมัติไว้
`openclaw security audit` จะเตือนเมื่อรายการ `safeBins` ของ interpreter/runtime ไม่มีโปรไฟล์ที่ชัดเจน และ `openclaw doctor --fix` สามารถ scaffold รายการ `safeBinProfiles` แบบกำหนดเองที่ขาดไปได้
`openclaw security audit` และ `openclaw doctor` จะเตือนเช่นกันเมื่อคุณเพิ่มไบนารีที่มีพฤติกรรมกว้าง เช่น `jq` กลับเข้าไปใน `safeBins` อย่างชัดเจน
หากคุณอนุญาต interpreter อย่างชัดเจน ให้เปิดใช้ `tools.exec.strictInlineEval` เพื่อให้รูปแบบ inline code-eval ยังคงต้องมีผู้ตรวจทานหรือการอนุมัติที่ชัดเจน

สำหรับรายละเอียดนโยบายและตัวอย่างแบบเต็ม ดู [การอนุมัติ exec](/th/tools/exec-approvals-advanced#safe-bins-stdin-only) และ [Safe bins เทียบกับรายการอนุญาต](/th/tools/exec-approvals-advanced#safe-bins-versus-allowlist)

## ตัวอย่าง

Foreground:

```json
{ "tool": "exec", "command": "ls -la" }
```

Background + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

การ polling ใช้สำหรับสถานะตามคำขอ ไม่ใช่ลูปการรอ หากเปิดใช้งานการปลุกเมื่อเสร็จสิ้นอัตโนมัติ
คำสั่งสามารถปลุกเซสชันเมื่อปล่อย output หรือทำงานล้มเหลวได้

ส่งคีย์ (สไตล์ tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Submit (ส่งเฉพาะ CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Paste (ครอบด้วย bracketed ตามค่าเริ่มต้น):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` เป็น subtool ของ `exec` สำหรับการแก้ไขหลายไฟล์แบบมีโครงสร้าง
เปิดใช้งานตามค่าเริ่มต้นสำหรับโมเดล OpenAI และ OpenAI Codex ใช้ config เฉพาะ
เมื่อคุณต้องการปิดใช้งานหรือจำกัดไว้เฉพาะโมเดลบางรุ่น:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

หมายเหตุ:

- พร้อมใช้งานเฉพาะสำหรับโมเดล OpenAI/OpenAI Codex
- นโยบายเครื่องมือยังคงมีผล; `allow: ["write"]` จะอนุญาต `apply_patch` โดยนัย
- `deny: ["write"]` ไม่ได้ปฏิเสธ `apply_patch`; ให้ปฏิเสธ `apply_patch` อย่างชัดเจน หรือใช้ `deny: ["group:fs"]` เมื่อการเขียน patch ควรถูกบล็อกด้วย
- Config อยู่ใต้ `tools.exec.applyPatch`
- `tools.exec.applyPatch.enabled` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เพื่อปิดใช้งานเครื่องมือนี้สำหรับโมเดล OpenAI
- `tools.exec.applyPatch.workspaceOnly` มีค่าเริ่มต้นเป็น `true` (จำกัดอยู่ใน workspace) ตั้งเป็น `false` เฉพาะเมื่อคุณตั้งใจให้ `apply_patch` เขียน/ลบนอกไดเรกทอรี workspace เท่านั้น

## ที่เกี่ยวข้อง

- [การอนุมัติ Exec](/th/tools/exec-approvals) — เกตการอนุมัติสำหรับคำสั่ง shell
- [Sandboxing](/th/gateway/sandboxing) — การรันคำสั่งในสภาพแวดล้อม sandbox
- [กระบวนการเบื้องหลัง](/th/gateway/background-process) — exec ที่รันนานและเครื่องมือ process
- [ความปลอดภัย](/th/gateway/security) — นโยบายเครื่องมือและสิทธิ์เข้าถึงระดับสูง
