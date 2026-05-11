---
read_when:
    - การใช้หรือแก้ไขเครื่องมือ exec
    - การดีบักพฤติกรรมของ stdin หรือ TTY
summary: การใช้งานเครื่องมือ Exec, โหมด stdin และการรองรับ TTY
title: เครื่องมือเรียกใช้คำสั่ง
x-i18n:
    generated_at: "2026-05-11T20:39:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43ed3dc70d1998f2f2a3eed70aaf20da61ba93d23b7fa7d378f22e8635c6ec68
    source_path: tools/exec.md
    workflow: 16
---

เรียกใช้คำสั่งเชลล์ในพื้นที่ทำงาน `exec` เป็นพื้นผิวเชลล์ที่เปลี่ยนแปลงได้: คำสั่งสามารถสร้าง แก้ไข หรือลบไฟล์ได้ทุกที่ที่โฮสต์หรือระบบไฟล์ sandbox ที่เลือกอนุญาต การปิดใช้งานเครื่องมือระบบไฟล์ของ OpenClaw เช่น `write`, `edit` หรือ `apply_patch` ไม่ได้ทำให้ `exec` เป็นแบบอ่านอย่างเดียว

รองรับการทำงานแบบ foreground + background ผ่าน `process` หากไม่อนุญาต `process` แล้ว `exec` จะทำงานแบบซิงโครนัสและละเว้น `yieldMs`/`background`
เซสชัน background ถูกจำกัดขอบเขตต่อ agent; `process` จะเห็นเฉพาะเซสชันจาก agent เดียวกันเท่านั้น

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
ส่งคำสั่งไป background โดยอัตโนมัติหลังจากหน่วงเวลานี้ (ms)
</ParamField>

<ParamField path="background" type="boolean" default="false">
ส่งคำสั่งไป background ทันทีแทนที่จะรอ `yieldMs`
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
แทนที่ timeout ของ exec ที่กำหนดค่าไว้สำหรับการเรียกนี้ ตั้ง `timeout: 0` เฉพาะเมื่อคำสั่งควรทำงานโดยไม่มี timeout ของกระบวนการ exec
</ParamField>

<ParamField path="pty" type="boolean" default="false">
เรียกใช้ใน pseudo-terminal เมื่อมีให้ใช้ ใช้สำหรับ CLI ที่ต้องใช้ TTY เท่านั้น, coding agents และ terminal UIs
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
ตำแหน่งที่จะดำเนินการ `auto` จะแปลงเป็น `sandbox` เมื่อมี runtime ของ sandbox ทำงานอยู่ และเป็น `gateway` ในกรณีอื่น
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
ถูกละเว้นสำหรับการเรียกเครื่องมือปกติ ความปลอดภัยของ `gateway` / `node` ถูกควบคุมโดย
`tools.exec.security` และ `~/.openclaw/exec-approvals.json`; โหมด elevated สามารถ
บังคับ `security=full` ได้เฉพาะเมื่อ operator ให้สิทธิ์ elevated อย่างชัดเจน
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
พฤติกรรมพรอมต์ขออนุมัติสำหรับการดำเนินการบน `gateway` / `node`
</ParamField>

<ParamField path="node" type="string">
รหัส/ชื่อ Node เมื่อ `host=node`
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
ร้องขอโหมด elevated — ออกจาก sandbox ไปยังพาธโฮสต์ที่กำหนดค่าไว้ `security=full` จะถูกบังคับเฉพาะเมื่อ elevated แปลงเป็น `full`
</ParamField>

หมายเหตุ:

- `host` มีค่าเริ่มต้นเป็น `auto`: ใช้ sandbox เมื่อ runtime ของ sandbox ทำงานอยู่สำหรับเซสชัน ไม่เช่นนั้นใช้ Gateway
- `host` ยอมรับเฉพาะ `auto`, `sandbox`, `gateway` หรือ `node` เท่านั้น ไม่ใช่ตัวเลือก hostname; ค่าที่มีลักษณะเหมือน hostname จะถูกปฏิเสธก่อนคำสั่งทำงาน
- `auto` เป็นกลยุทธ์การกำหนดเส้นทางเริ่มต้น ไม่ใช่ wildcard อนุญาตให้ใช้ `host=node` ต่อการเรียกจาก `auto`; อนุญาตให้ใช้ `host=gateway` ต่อการเรียกเฉพาะเมื่อไม่มี runtime ของ sandbox ทำงานอยู่
- หากไม่มีการกำหนดค่าเพิ่มเติม `host=auto` ยังคง "ใช้งานได้ทันที": ไม่มี sandbox หมายถึงจะแปลงเป็น `gateway`; sandbox ที่ทำงานอยู่หมายถึงจะคงอยู่ใน sandbox
- `elevated` ออกจาก sandbox ไปยังพาธโฮสต์ที่กำหนดค่าไว้: โดยค่าเริ่มต้นคือ `gateway` หรือ `node` เมื่อ `tools.exec.host=node` (หรือค่าเริ่มต้นของเซสชันคือ `host=node`) ใช้ได้เฉพาะเมื่อเปิดใช้งานการเข้าถึง elevated สำหรับเซสชัน/provider ปัจจุบัน
- การอนุมัติ `gateway`/`node` ถูกควบคุมโดย `~/.openclaw/exec-approvals.json`
- `node` ต้องมี Node ที่จับคู่ไว้ (companion app หรือ headless node host)
- หากมีหลาย Node ให้ตั้ง `exec.node` หรือ `tools.exec.node` เพื่อเลือกหนึ่งรายการ
- `exec host=node` เป็นเส้นทางการดำเนินการเชลล์เพียงเส้นทางเดียวสำหรับ Node; wrapper เดิม `nodes.run` ถูกลบออกแล้ว
- `timeout` ใช้กับการดำเนินการ foreground, background, `yieldMs`, Gateway, sandbox และ `system.run` ของ Node หากละไว้ OpenClaw จะใช้ `tools.exec.timeoutSec`; การระบุ `timeout: 0` จะปิดใช้งาน timeout ของกระบวนการ exec สำหรับการเรียกนั้น
- บนโฮสต์ที่ไม่ใช่ Windows, exec ใช้ `SHELL` เมื่อตั้งค่าไว้; หาก `SHELL` เป็น `fish` จะเลือกใช้ `bash` (หรือ `sh`)
  จาก `PATH` ก่อนเพื่อหลีกเลี่ยงสคริปต์ที่ไม่เข้ากันกับ fish แล้วจึง fallback ไปที่ `SHELL` หากไม่มีทั้งสองอย่าง
- บนโฮสต์ Windows, exec จะเลือกการค้นหา PowerShell 7 (`pwsh`) ก่อน (Program Files, ProgramW6432 แล้วจึง PATH),
  แล้ว fallback ไปที่ Windows PowerShell 5.1
- การดำเนินการบนโฮสต์ (`gateway`/`node`) ปฏิเสธ `env.PATH` และการแทนที่ loader (`LD_*`/`DYLD_*`) เพื่อ
  ป้องกันการ hijack ไบนารีหรือโค้ดที่ถูกฉีดเข้ามา
- OpenClaw ตั้ง `OPENCLAW_SHELL=exec` ในสภาพแวดล้อมของคำสั่งที่ spawn ขึ้นมา (รวมถึงการดำเนินการ PTY และ sandbox) เพื่อให้กฎ shell/profile ตรวจจับบริบทของเครื่องมือ exec ได้
- `openclaw channels login` ถูกบล็อกจาก `exec` เพราะเป็น flow ยืนยันตัวตนช่องทางแบบโต้ตอบ; ให้เรียกใช้ใน terminal บนโฮสต์ Gateway หรือใช้เครื่องมือ login แบบ native ของช่องทางจากแชตเมื่อมีให้ใช้
- สำคัญ: sandboxing **ปิดอยู่โดยค่าเริ่มต้น** หาก sandboxing ปิดอยู่ `host=auto` โดยนัย
  จะแปลงเป็น `gateway` การระบุ `host=sandbox` อย่างชัดเจนจะยังคงล้มเหลวแบบปิดแทนที่จะ
  ทำงานบนโฮสต์ Gateway อย่างเงียบ ๆ เปิดใช้งาน sandboxing หรือใช้ `host=gateway` พร้อมการอนุมัติ
- การตรวจสอบ preflight ของสคริปต์ (สำหรับข้อผิดพลาด syntax ของเชลล์ Python/Node ที่พบบ่อย) จะตรวจเฉพาะไฟล์ภายใน
  ขอบเขต `workdir` ที่มีผล หากพาธสคริปต์แปลงออกไปนอก `workdir` จะข้าม preflight สำหรับ
  ไฟล์นั้น
- สำหรับงานที่ใช้เวลานานซึ่งเริ่มตอนนี้ ให้เริ่มหนึ่งครั้งและพึ่งพาการปลุกเมื่อเสร็จสิ้นโดยอัตโนมัติ
  เมื่อเปิดใช้งานและคำสั่งส่งออก output หรือล้มเหลว
  ใช้ `process` สำหรับ log, สถานะ, input หรือการแทรกแซง; อย่าจำลอง
  การจัดตารางเวลาด้วย sleep loop, timeout loop หรือการ polling ซ้ำ
- สำหรับงานที่ควรเกิดขึ้นภายหลังหรือตามตารางเวลา ให้ใช้ Cron แทน
  รูปแบบ sleep/delay ของ `exec`

## การกำหนดค่า

- `tools.exec.notifyOnExit` (ค่าเริ่มต้น: true): เมื่อเป็น true เซสชัน exec ที่ถูกส่งไป background จะ enqueue system event และขอ Heartbeat เมื่อออก
- `tools.exec.approvalRunningNoticeMs` (ค่าเริ่มต้น: 10000): ส่ง notice "running" หนึ่งครั้งเมื่อ exec ที่ต้องผ่านการอนุมัติทำงานนานกว่านี้ (0 ปิดใช้งาน)
- `tools.exec.timeoutSec` (ค่าเริ่มต้น: 1800): timeout เริ่มต้นต่อคำสั่งของ exec เป็นวินาที `timeout` ต่อการเรียกจะแทนที่ค่านี้; `timeout: 0` ต่อการเรียกจะปิดใช้งาน timeout ของกระบวนการ exec
- `tools.exec.host` (ค่าเริ่มต้น: `auto`; แปลงเป็น `sandbox` เมื่อ runtime ของ sandbox ทำงานอยู่, เป็น `gateway` ในกรณีอื่น)
- `tools.exec.security` (ค่าเริ่มต้น: `deny` สำหรับ sandbox, `full` สำหรับ Gateway + Node เมื่อไม่ได้ตั้งค่า)
- `tools.exec.ask` (ค่าเริ่มต้น: `off`)
- exec บนโฮสต์แบบไม่ต้องอนุมัติเป็นค่าเริ่มต้นสำหรับ Gateway + Node หากคุณต้องการพฤติกรรม approvals/allowlist ให้เข้มงวดทั้ง `tools.exec.*` และ `~/.openclaw/exec-approvals.json` ของโฮสต์; ดู [การอนุมัติ Exec](/th/tools/exec-approvals#yolo-mode-no-approval)
- YOLO มาจากค่าเริ่มต้นของนโยบายโฮสต์ (`security=full`, `ask=off`) ไม่ใช่จาก `host=auto` หากคุณต้องการบังคับเส้นทาง Gateway หรือ Node ให้ตั้ง `tools.exec.host` หรือใช้ `/exec host=...`
- ในโหมด `security=full` พร้อม `ask=off` exec บนโฮสต์จะทำตามนโยบายที่กำหนดค่าไว้โดยตรง; ไม่มีชั้น prefilter เชิง heuristic สำหรับการอำพรางคำสั่งหรือชั้นปฏิเสธ script-preflight เพิ่มเติม
- `tools.exec.node` (ค่าเริ่มต้น: ไม่ได้ตั้งค่า)
- `tools.exec.strictInlineEval` (ค่าเริ่มต้น: false): เมื่อเป็น true รูปแบบ inline interpreter eval เช่น `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` และ `osascript -e` จะต้องขออนุมัติอย่างชัดเจนเสมอ `allow-always` ยังสามารถคงการเรียกใช้ interpreter/script ที่ปลอดภัยไว้ได้ แต่รูปแบบ inline-eval จะยังคงพรอมต์ทุกครั้ง
- `tools.exec.commandHighlighting` (ค่าเริ่มต้น: false): เมื่อเป็น true พรอมต์ขออนุมัติสามารถไฮไลต์ช่วงคำสั่งที่ parser ได้มาจากข้อความคำสั่ง ตั้งเป็น `true` แบบ global หรือต่อ agent เพื่อเปิดใช้งานการไฮไลต์ข้อความคำสั่งโดยไม่เปลี่ยนนโยบายการอนุมัติ exec
- `tools.exec.pathPrepend`: รายการไดเรกทอรีที่จะเติมไว้หน้า `PATH` สำหรับการเรียกใช้ exec (เฉพาะ Gateway + sandbox)
- `tools.exec.safeBins`: ไบนารีปลอดภัยที่ใช้ stdin เท่านั้นและสามารถทำงานได้โดยไม่ต้องมีรายการ allowlist อย่างชัดเจน สำหรับรายละเอียดพฤติกรรม ดู [ไบนารีปลอดภัย](/th/tools/exec-approvals-advanced#safe-bins-stdin-only)
- `tools.exec.safeBinTrustedDirs`: ไดเรกทอรีเพิ่มเติมที่เชื่อถืออย่างชัดเจนสำหรับการตรวจสอบพาธของ `safeBins` รายการ `PATH` จะไม่ถูกเชื่อถือโดยอัตโนมัติ ค่าเริ่มต้นในตัวคือ `/bin` และ `/usr/bin`
- `tools.exec.safeBinProfiles`: นโยบาย argv แบบกำหนดเองที่เป็นตัวเลือกต่อ safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`)

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

- `host=gateway`: ผสาน `PATH` ของ login-shell ของคุณเข้าในสภาพแวดล้อม exec การแทนที่ `env.PATH`
  ถูกปฏิเสธสำหรับการดำเนินการบนโฮสต์ daemon เองยังคงทำงานด้วย `PATH` ขั้นต่ำ:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: เรียกใช้ `sh -lc` (login shell) ภายใน container ดังนั้น `/etc/profile` อาจรีเซ็ต `PATH`
  OpenClaw เติม `env.PATH` ไว้หน้าหลังจาก source profile ผ่าน env var ภายใน (ไม่มี shell interpolation);
  `tools.exec.pathPrepend` ใช้ที่นี่ด้วย
- `host=node`: ส่งเฉพาะ env overrides ที่ไม่ถูกบล็อกซึ่งคุณส่งให้ไปยัง Node การแทนที่ `env.PATH`
  ถูกปฏิเสธสำหรับการดำเนินการบนโฮสต์และถูกละเว้นโดยโฮสต์ Node หากคุณต้องการรายการ PATH เพิ่มเติมบน Node
  ให้กำหนดค่าสภาพแวดล้อมของบริการโฮสต์ Node (systemd/launchd) หรือติดตั้งเครื่องมือในตำแหน่งมาตรฐาน

การผูก Node ต่อ agent (ใช้ดัชนีรายการ agent ใน config):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

UI ควบคุม: แท็บ Nodes มีแผง "การผูก Exec node" ขนาดเล็กสำหรับการตั้งค่าเดียวกัน

## การแทนที่เซสชัน (`/exec`)

ใช้ `/exec` เพื่อตั้งค่าเริ่มต้น **ต่อเซสชัน** สำหรับ `host`, `security`, `ask` และ `node`
ส่ง `/exec` โดยไม่มีอาร์กิวเมนต์เพื่อแสดงค่าปัจจุบัน

ตัวอย่าง:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## โมเดลการอนุญาต

`/exec` จะถูกใช้เฉพาะกับ **ผู้ส่งที่ได้รับอนุญาต** (allowlists/การจับคู่ของช่องทาง พร้อม `commands.useAccessGroups`)
คำสั่งนี้อัปเดต **สถานะเซสชันเท่านั้น** และไม่เขียน config หากต้องการปิดใช้งาน exec แบบเด็ดขาด ให้ deny ผ่านนโยบายเครื่องมือ
(`tools.deny: ["exec"]` หรือต่อ agent) การอนุมัติโฮสต์ยังคงมีผล เว้นแต่คุณจะตั้ง
`security=full` และ `ask=off` อย่างชัดเจน

## การอนุมัติ Exec (companion app / node host)

agent ที่อยู่ใน sandbox สามารถต้องการการอนุมัติต่อคำขอก่อนที่ `exec` จะทำงานบนโฮสต์ Gateway หรือ Node
ดู [การอนุมัติ Exec](/th/tools/exec-approvals) สำหรับนโยบาย, allowlist และ flow ของ UI

เมื่อจำเป็นต้องมีการอนุมัติ เครื่องมือ exec จะส่งคืนทันทีพร้อม
`status: "approval-pending"` และรหัสการอนุมัติ เมื่อได้รับอนุมัติแล้ว (หรือถูกปฏิเสธ / หมดเวลา)
Gateway จะส่ง system events (`Exec finished` / `Exec denied`) หากคำสั่งยังคง
ทำงานหลังจาก `tools.exec.approvalRunningNoticeMs` จะส่ง notice `Exec running` หนึ่งครั้ง
ในช่องทางที่มีการ์ด/ปุ่มอนุมัติแบบ native, agent ควรพึ่งพา
UI native นั้นก่อน และรวมคำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์ของเครื่องมือ
ระบุอย่างชัดเจนว่า chat approvals ไม่พร้อมใช้งาน หรือ manual approval เป็น
เส้นทางเดียวเท่านั้น

## Allowlist + ไบนารีปลอดภัย

การบังคับใช้ allowlist แบบ manual จะจับคู่ glob ของพาธไบนารีที่ resolve แล้วและ glob ของชื่อคำสั่งล้วน
ชื่อล้วนจะจับคู่เฉพาะคำสั่งที่เรียกผ่าน PATH ดังนั้น `rg` สามารถจับคู่
`/opt/homebrew/bin/rg` เมื่อคำสั่งคือ `rg` แต่ไม่ใช่ `./rg` หรือ `/tmp/rg`
เมื่อ `security=allowlist` คำสั่งเชลล์จะถูกอนุญาตอัตโนมัติเฉพาะเมื่อทุก segment ของ pipeline
อยู่ใน allowlist หรือเป็น safe bin การ chaining (`;`, `&&`, `||`) และ redirections
จะถูกปฏิเสธในโหมด allowlist เว้นแต่ว่าทุก segment ระดับบนสุดจะเป็นไปตาม
allowlist (รวมถึง safe bins) Redirections ยังไม่รองรับ
ความเชื่อถือแบบถาวร `allow-always` ไม่ได้ข้ามกฎนั้น: คำสั่งแบบ chained ยังคงต้องให้ทุก
segment ระดับบนสุดตรงกัน

`autoAllowSkills` เป็นเส้นทางอำนวยความสะดวกแยกต่างหากในการอนุมัติ exec ไม่ใช่สิ่งเดียวกับ
รายการ allowlist พาธแบบ manual สำหรับความเชื่อถืออย่างชัดเจนแบบเข้มงวด ให้ปิดใช้งาน `autoAllowSkills` ไว้

ใช้ตัวควบคุมสองอย่างนี้สำหรับงานที่ต่างกัน:

- `tools.exec.safeBins`: ตัวกรองสตรีมขนาดเล็กที่รับเฉพาะ stdin
- `tools.exec.safeBinTrustedDirs`: ไดเรกทอรีที่เชื่อถือเพิ่มเติมแบบระบุชัดเจนสำหรับพาธปฏิบัติการ safe-bin
- `tools.exec.safeBinProfiles`: นโยบาย argv แบบระบุชัดเจนสำหรับ safe bins แบบกำหนดเอง
- รายการอนุญาต: ความเชื่อถือแบบระบุชัดเจนสำหรับพาธปฏิบัติการ

อย่าถือว่า `safeBins` เป็นรายการอนุญาตทั่วไป และอย่าเพิ่มไบนารี interpreter/runtime (เช่น `python3`, `node`, `ruby`, `bash`) หากคุณต้องใช้สิ่งเหล่านั้น ให้ใช้รายการอนุญาตแบบระบุชัดเจนและเปิดใช้พรอมป์อนุมัติไว้
`openclaw security audit` จะเตือนเมื่อรายการ `safeBins` ของ interpreter/runtime ขาดโปรไฟล์ที่ระบุชัดเจน และ `openclaw doctor --fix` สามารถสร้างโครงรายการ `safeBinProfiles` แบบกำหนดเองที่ขาดหายได้
`openclaw security audit` และ `openclaw doctor` ยังเตือนเมื่อคุณเพิ่มไบนารีที่มีพฤติกรรมกว้าง เช่น `jq` กลับเข้าไปใน `safeBins` แบบระบุชัดเจน
หากคุณอนุญาต interpreter แบบระบุชัดเจน ให้เปิดใช้ `tools.exec.strictInlineEval` เพื่อให้รูปแบบ inline code-eval ยังคงต้องขออนุมัติใหม่

สำหรับรายละเอียดนโยบายและตัวอย่างทั้งหมด โปรดดู [การอนุมัติ Exec](/th/tools/exec-approvals-advanced#safe-bins-stdin-only) และ [safe bins เทียบกับรายการอนุญาต](/th/tools/exec-approvals-advanced#safe-bins-versus-allowlist)

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

การ polling ใช้สำหรับสถานะตามต้องการ ไม่ใช่ลูปรอ หากเปิดใช้การปลุกเมื่อเสร็จสิ้นโดยอัตโนมัติ
คำสั่งจะปลุกเซสชันได้เมื่อปล่อยเอาต์พุตหรือทำงานล้มเหลว

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

Paste (ใช้วงเล็บกำกับเป็นค่าเริ่มต้น):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` เป็น subtool ของ `exec` สำหรับการแก้ไขหลายไฟล์แบบมีโครงสร้าง
เครื่องมือนี้เปิดใช้เป็นค่าเริ่มต้นสำหรับโมเดล OpenAI และ OpenAI Codex ใช้ config เฉพาะ
เมื่อคุณต้องการปิดใช้หรือจำกัดให้ใช้กับโมเดลที่ระบุ:

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

- ใช้ได้เฉพาะกับโมเดล OpenAI/OpenAI Codex
- นโยบายเครื่องมือยังคงมีผล; `allow: ["write"]` อนุญาต `apply_patch` โดยปริยาย
- `deny: ["write"]` ไม่ได้ปฏิเสธ `apply_patch`; ให้ปฏิเสธ `apply_patch` แบบระบุชัดเจน หรือใช้ `deny: ["group:fs"]` เมื่อการเขียนแพตช์ควรถูกบล็อกด้วย
- Config อยู่ใต้ `tools.exec.applyPatch`
- `tools.exec.applyPatch.enabled` มีค่าเริ่มต้นเป็น `true`; ตั้งค่าเป็น `false` เพื่อปิดใช้เครื่องมือนี้สำหรับโมเดล OpenAI
- `tools.exec.applyPatch.workspaceOnly` มีค่าเริ่มต้นเป็น `true` (จำกัดอยู่ใน workspace) ตั้งค่าเป็น `false` เฉพาะเมื่อคุณตั้งใจให้ `apply_patch` เขียน/ลบนอกไดเรกทอรี workspace

## ที่เกี่ยวข้อง

- [การอนุมัติ Exec](/th/tools/exec-approvals) — เกตการอนุมัติสำหรับคำสั่งเชลล์
- [Sandboxing](/th/gateway/sandboxing) — การรันคำสั่งในสภาพแวดล้อมแบบ sandboxed
- [กระบวนการเบื้องหลัง](/th/gateway/background-process) — exec ที่ทำงานนานและเครื่องมือ process
- [ความปลอดภัย](/th/gateway/security) — นโยบายเครื่องมือและสิทธิ์การเข้าถึงระดับสูง
