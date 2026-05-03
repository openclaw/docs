---
read_when:
    - การใช้หรือแก้ไขเครื่องมือ exec
    - การดีบักพฤติกรรมของ stdin หรือ TTY
summary: การใช้งานเครื่องมือ Exec โหมด stdin และการรองรับ TTY
title: เครื่องมือดำเนินการคำสั่ง
x-i18n:
    generated_at: "2026-05-03T21:38:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: dbc8dda08abfd4d7b2e2cd5c7319a7eddf1575156bbfbc52df841908589c8c81
    source_path: tools/exec.md
    workflow: 16
---

เรียกใช้คำสั่ง shell ใน workspace รองรับการดำเนินการแบบ foreground + background ผ่าน `process`
หากไม่อนุญาตให้ใช้ `process` `exec` จะทำงานแบบซิงโครนัสและไม่สนใจ `yieldMs`/`background`
เซสชันเบื้องหลังถูกจำกัดขอบเขตต่อเอเจนต์; `process` จะเห็นเฉพาะเซสชันจากเอเจนต์เดียวกันเท่านั้น

## พารามิเตอร์

<ParamField path="command" type="string" required>
คำสั่ง shell ที่จะเรียกใช้
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
ไดเรกทอรีทำงานสำหรับคำสั่ง
</ParamField>

<ParamField path="env" type="object">
การแทนที่สภาพแวดล้อมแบบคีย์/ค่าที่ผสานทับบนสภาพแวดล้อมที่สืบทอดมา
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
ย้ายคำสั่งไปทำงานเบื้องหลังโดยอัตโนมัติหลังจากหน่วงเวลานี้ (มิลลิวินาที)
</ParamField>

<ParamField path="background" type="boolean" default="false">
ย้ายคำสั่งไปทำงานเบื้องหลังทันทีแทนการรอ `yieldMs`
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
แทนที่ค่า timeout ของ exec ที่กำหนดค่าไว้สำหรับการเรียกนี้ ตั้งค่า `timeout: 0` เฉพาะเมื่อคำสั่งควรรันโดยไม่มี timeout ของกระบวนการ exec
</ParamField>

<ParamField path="pty" type="boolean" default="false">
รันใน pseudo-terminal เมื่อใช้ได้ ใช้สำหรับ CLI ที่ต้องใช้ TTY เท่านั้น, เอเจนต์เขียนโค้ด, และ UI เทอร์มินัล
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
ตำแหน่งที่จะดำเนินการ `auto` จะ resolve เป็น `sandbox` เมื่อ sandbox runtime ทำงานอยู่ และเป็น `gateway` ในกรณีอื่น
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
โหมดการบังคับใช้งานสำหรับการดำเนินการ `gateway` / `node`
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
พฤติกรรม prompt ขออนุมัติสำหรับการดำเนินการ `gateway` / `node`
</ParamField>

<ParamField path="node" type="string">
รหัส/ชื่อ Node เมื่อ `host=node`
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
ขอโหมด elevated — ออกจาก sandbox ไปยังพาธของโฮสต์ที่กำหนดค่าไว้ `security=full` จะถูกบังคับใช้เฉพาะเมื่อ elevated resolve เป็น `full`
</ParamField>

หมายเหตุ:

- `host` มีค่าเริ่มต้นเป็น `auto`: sandbox เมื่อ sandbox runtime ทำงานอยู่สำหรับเซสชัน มิฉะนั้นเป็น Gateway
- `host` รับเฉพาะ `auto`, `sandbox`, `gateway`, หรือ `node` เท่านั้น ไม่ใช่ตัวเลือก hostname; ค่าที่ดูเหมือน hostname จะถูกปฏิเสธก่อนคำสั่งทำงาน
- `auto` เป็นกลยุทธ์ routing เริ่มต้น ไม่ใช่ wildcard อนุญาตให้ใช้ `host=node` แบบต่อการเรียกจาก `auto`; อนุญาตให้ใช้ `host=gateway` แบบต่อการเรียกเฉพาะเมื่อไม่มี sandbox runtime ทำงานอยู่
- หากไม่มีการตั้งค่าเพิ่มเติม `host=auto` ยังคง "ใช้ได้ทันที": ถ้าไม่มี sandbox จะ resolve เป็น `gateway`; ถ้ามี sandbox ที่ทำงานอยู่จะอยู่ใน sandbox ต่อไป
- `elevated` ออกจาก sandbox ไปยังพาธของโฮสต์ที่กำหนดค่าไว้: โดยค่าเริ่มต้นคือ `gateway` หรือ `node` เมื่อ `tools.exec.host=node` (หรือค่าเริ่มต้นของเซสชันคือ `host=node`) ใช้ได้เฉพาะเมื่อเปิดใช้การเข้าถึงแบบ elevated สำหรับเซสชัน/ผู้ให้บริการปัจจุบัน
- การอนุมัติ `gateway`/`node` ถูกควบคุมโดย `~/.openclaw/exec-approvals.json`
- `node` ต้องมี Node ที่จับคู่ไว้ (แอป companion หรือโฮสต์ Node แบบ headless)
- หากมีหลาย Node ให้ตั้งค่า `exec.node` หรือ `tools.exec.node` เพื่อเลือกหนึ่งรายการ
- `exec host=node` เป็นเส้นทางดำเนินการ shell เดียวสำหรับ Node; wrapper เดิม `nodes.run` ถูกนำออกแล้ว
- `timeout` ใช้กับการดำเนินการ foreground, background, `yieldMs`, Gateway, sandbox, และ `system.run` ของ Node หากละไว้ OpenClaw จะใช้ `tools.exec.timeoutSec`; การระบุ `timeout: 0` จะปิดใช้งาน timeout ของกระบวนการ exec สำหรับการเรียกนั้น
- บนโฮสต์ที่ไม่ใช่ Windows exec จะใช้ `SHELL` เมื่อตั้งค่าไว้; หาก `SHELL` เป็น `fish` จะเลือกใช้ `bash` (หรือ `sh`)
  จาก `PATH` ก่อนเพื่อหลีกเลี่ยงสคริปต์ที่เข้ากันไม่ได้กับ fish แล้วจึง fallback ไปที่ `SHELL` หากไม่มีทั้งสองอย่าง
- บนโฮสต์ Windows exec จะเลือกค้นหา PowerShell 7 (`pwsh`) ก่อน (Program Files, ProgramW6432, แล้วจึง PATH)
  จากนั้น fallback ไปที่ Windows PowerShell 5.1
- การดำเนินการบนโฮสต์ (`gateway`/`node`) จะปฏิเสธ `env.PATH` และการแทนที่ loader (`LD_*`/`DYLD_*`) เพื่อ
  ป้องกันการ hijack ไบนารีหรือโค้ดที่ถูก inject
- OpenClaw ตั้งค่า `OPENCLAW_SHELL=exec` ในสภาพแวดล้อมของคำสั่งที่ spawn (รวมถึงการดำเนินการ PTY และ sandbox) เพื่อให้กฎ shell/profile ตรวจจับบริบทของเครื่องมือ exec ได้
- `openclaw channels login` ถูกบล็อกจาก `exec` เพราะเป็น flow ยืนยันตัวตน channel แบบโต้ตอบ; ให้รันในเทอร์มินัลบนโฮสต์ Gateway หรือใช้เครื่องมือเข้าสู่ระบบแบบ native ของ channel จากแชตเมื่อมี
- สำคัญ: sandboxing **ปิดโดยค่าเริ่มต้น** หาก sandboxing ปิดอยู่ `host=auto` แบบ implicit
  จะ resolve เป็น `gateway` การระบุ `host=sandbox` โดยตรงยังคง fail closed แทนที่จะไปรันบนโฮสต์ Gateway แบบเงียบ ๆ
  เปิดใช้ sandboxing หรือใช้ `host=gateway` พร้อมการอนุมัติ
- การตรวจ preflight ของสคริปต์ (สำหรับข้อผิดพลาด shell syntax ของ Python/Node ที่พบบ่อย) จะตรวจเฉพาะไฟล์ภายใน
  ขอบเขต `workdir` ที่มีผลเท่านั้น หากพาธสคริปต์ resolve ออกนอก `workdir` จะข้าม preflight สำหรับ
  ไฟล์นั้น
- สำหรับงานที่รันนานและเริ่มตอนนี้ ให้เริ่มงานหนึ่งครั้งและพึ่งพาการปลุกเมื่อเสร็จอัตโนมัติ
  เมื่อเปิดใช้งานและคำสั่งมี output หรือ fail
  ใช้ `process` สำหรับ log, สถานะ, input, หรือการแทรกแซง; อย่าจำลอง
  scheduling ด้วย loop sleep, loop timeout, หรือการ polling ซ้ำ ๆ
- สำหรับงานที่ควรเกิดขึ้นภายหลังหรือตามกำหนดเวลา ให้ใช้ cron แทนรูปแบบ sleep/delay ของ `exec`

## การกำหนดค่า

- `tools.exec.notifyOnExit` (ค่าเริ่มต้น: true): เมื่อเป็น true เซสชัน exec ที่ถูกย้ายไปเบื้องหลังจะ enqueue system event และขอ Heartbeat เมื่อออก
- `tools.exec.approvalRunningNoticeMs` (ค่าเริ่มต้น: 10000): ส่งประกาศ “running” หนึ่งครั้งเมื่อ exec ที่ถูกกั้นด้วยการอนุมัติรันนานกว่านี้ (0 เพื่อปิดใช้งาน)
- `tools.exec.timeoutSec` (ค่าเริ่มต้น: 1800): timeout เริ่มต้นต่อคำสั่งของ exec เป็นวินาที `timeout` แบบต่อการเรียกจะแทนที่ค่านี้; `timeout: 0` แบบต่อการเรียกจะปิดใช้งาน timeout ของกระบวนการ exec
- `tools.exec.host` (ค่าเริ่มต้น: `auto`; resolve เป็น `sandbox` เมื่อ sandbox runtime ทำงานอยู่, เป็น `gateway` ในกรณีอื่น)
- `tools.exec.security` (ค่าเริ่มต้น: `deny` สำหรับ sandbox, `full` สำหรับ Gateway + Node เมื่อไม่ได้ตั้งค่า)
- `tools.exec.ask` (ค่าเริ่มต้น: `off`)
- การดำเนินการ exec บนโฮสต์แบบไม่ต้องอนุมัติเป็นค่าเริ่มต้นสำหรับ Gateway + Node หากต้องการพฤติกรรมแบบอนุมัติ/รายการอนุญาต ให้ปรับให้เข้มทั้ง `tools.exec.*` และ `~/.openclaw/exec-approvals.json` ของโฮสต์; ดู [การอนุมัติ Exec](/th/tools/exec-approvals#yolo-mode-no-approval)
- YOLO มาจากค่าเริ่มต้นของนโยบายโฮสต์ (`security=full`, `ask=off`) ไม่ได้มาจาก `host=auto` หากต้องการบังคับ routing ไปยัง Gateway หรือ Node ให้ตั้งค่า `tools.exec.host` หรือใช้ `/exec host=...`
- ในโหมด `security=full` พร้อม `ask=off` exec บนโฮสต์จะทำตามนโยบายที่กำหนดค่าไว้โดยตรง; ไม่มีชั้น prefilter เชิง heuristic สำหรับการอำพรางคำสั่งหรือชั้นปฏิเสธ script-preflight เพิ่มเติม
- `tools.exec.node` (ค่าเริ่มต้น: ไม่ได้ตั้งค่า)
- `tools.exec.strictInlineEval` (ค่าเริ่มต้น: false): เมื่อเป็น true รูปแบบ eval ของ interpreter แบบ inline เช่น `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, และ `osascript -e` จะต้องขออนุมัติแบบชัดเจนเสมอ `allow-always` ยังสามารถจดจำการเรียก interpreter/script ที่ปลอดภัยได้ แต่รูปแบบ inline-eval จะยังคง prompt ทุกครั้ง
- `tools.exec.pathPrepend`: รายการไดเรกทอรีที่จะเติมนำหน้า `PATH` สำหรับการรัน exec (เฉพาะ Gateway + sandbox)
- `tools.exec.safeBins`: ไบนารีปลอดภัยแบบ stdin-only ที่รันได้โดยไม่ต้องมีรายการ allowlist แบบชัดเจน สำหรับรายละเอียดพฤติกรรม ดู [ไบนารีปลอดภัย](/th/tools/exec-approvals-advanced#safe-bins-stdin-only)
- `tools.exec.safeBinTrustedDirs`: ไดเรกทอรี explicit เพิ่มเติมที่เชื่อถือสำหรับการตรวจพาธ `safeBins` รายการ `PATH` จะไม่ถูกเชื่อถืออัตโนมัติ ค่าเริ่มต้นในตัวคือ `/bin` และ `/usr/bin`
- `tools.exec.safeBinProfiles`: นโยบาย argv แบบกำหนดเองที่ไม่บังคับต่อไบนารีปลอดภัย (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`)

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

- `host=gateway`: ผสาน `PATH` ของ login-shell เข้ากับสภาพแวดล้อม exec การแทนที่ `env.PATH`
  จะถูกปฏิเสธสำหรับการดำเนินการบนโฮสต์ daemon เองยังคงรันด้วย `PATH` ขั้นต่ำ:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: รัน `sh -lc` (login shell) ภายใน container ดังนั้น `/etc/profile` อาจ reset `PATH`
  OpenClaw เติมนำหน้า `env.PATH` หลังจาก source profile ผ่าน env var ภายใน (ไม่มี shell interpolation);
  `tools.exec.pathPrepend` ใช้ที่นี่ด้วย
- `host=node`: ส่งเฉพาะการแทนที่ env ที่ไม่ถูกบล็อกซึ่งคุณส่งมาไปยัง Node การแทนที่ `env.PATH`
  จะถูกปฏิเสธสำหรับการดำเนินการบนโฮสต์และถูกละเลยโดยโฮสต์ Node หากต้องการรายการ PATH เพิ่มเติมบน Node
  ให้กำหนดค่าสภาพแวดล้อมของบริการโฮสต์ Node (systemd/launchd) หรือติดตั้งเครื่องมือในตำแหน่งมาตรฐาน

การผูก Node ต่อเอเจนต์ (ใช้ดัชนีรายการเอเจนต์ใน config):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

UI ควบคุม: แท็บ Nodes มีแผง “การผูก Exec node” ขนาดเล็กสำหรับการตั้งค่าเดียวกัน

## การแทนที่ของเซสชัน (`/exec`)

ใช้ `/exec` เพื่อตั้งค่าเริ่มต้น **ต่อเซสชัน** สำหรับ `host`, `security`, `ask`, และ `node`
ส่ง `/exec` โดยไม่มีอาร์กิวเมนต์เพื่อแสดงค่าปัจจุบัน

ตัวอย่าง:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## โมเดลการอนุญาต

`/exec` จะถูกยอมรับเฉพาะสำหรับ **ผู้ส่งที่ได้รับอนุญาต** (allowlist/การจับคู่ของ channel ร่วมกับ `commands.useAccessGroups`)
เครื่องมือนี้อัปเดต **สถานะเซสชันเท่านั้น** และไม่เขียน config หากต้องการปิดใช้งาน exec แบบถาวร ให้ deny ผ่านนโยบายเครื่องมือ
(`tools.deny: ["exec"]` หรือแบบต่อเอเจนต์) การอนุมัติโฮสต์ยังคงมีผล เว้นแต่คุณตั้งค่า
`security=full` และ `ask=off` อย่างชัดเจน

## การอนุมัติ Exec (แอป companion / โฮสต์ Node)

เอเจนต์ใน sandbox สามารถต้องการการอนุมัติต่อคำขอก่อนที่ `exec` จะรันบนโฮสต์ Gateway หรือ Node
ดู [การอนุมัติ Exec](/th/tools/exec-approvals) สำหรับนโยบาย, allowlist, และ flow ของ UI

เมื่อต้องมีการอนุมัติ เครื่องมือ exec จะส่งคืนทันทีพร้อม
`status: "approval-pending"` และรหัสอนุมัติ เมื่ออนุมัติแล้ว (หรือถูกปฏิเสธ / หมดเวลา)
Gateway จะปล่อย system event (`Exec finished` / `Exec denied`) หากคำสั่งยังคง
รันอยู่หลัง `tools.exec.approvalRunningNoticeMs` จะส่งประกาศ `Exec running` หนึ่งครั้ง
บน channel ที่มีการ์ด/ปุ่มอนุมัติแบบ native เอเจนต์ควรพึ่งพา
UI native นั้นก่อน และใส่คำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์ของเครื่องมือ
บอกอย่างชัดเจนว่าการอนุมัติผ่านแชตใช้ไม่ได้ หรือการอนุมัติแบบ manual เป็นเส้นทางเดียว

## รายการอนุญาต + ไบนารีปลอดภัย

การบังคับใช้รายการอนุญาตแบบ manual จะ match กับ glob ของพาธไบนารีที่ resolve แล้วและ glob ของชื่อคำสั่งเปล่า
ชื่อเปล่าจะ match เฉพาะคำสั่งที่เรียกผ่าน PATH ดังนั้น `rg` จึงสามารถ match กับ
`/opt/homebrew/bin/rg` เมื่อคำสั่งคือ `rg` แต่ไม่ใช่ `./rg` หรือ `/tmp/rg`
เมื่อ `security=allowlist` คำสั่ง shell จะถูกอนุญาตอัตโนมัติเฉพาะเมื่อทุก segment ของ pipeline
อยู่ใน allowlist หรือเป็นไบนารีปลอดภัย การ chaining (`;`, `&&`, `||`) และ redirection
จะถูกปฏิเสธในโหมด allowlist เว้นแต่ว่าทุก segment ระดับบนสุดเป็นไปตาม
allowlist (รวมถึงไบนารีปลอดภัย) ยังไม่รองรับ redirection
ความเชื่อถือแบบคงทน `allow-always` ไม่ข้ามกฎนั้น: คำสั่งที่ chain แล้วยังคงต้องให้ทุก
segment ระดับบนสุด match

`autoAllowSkills` เป็นเส้นทางอำนวยความสะดวกแยกต่างหากใน exec approvals ไม่ใช่สิ่งเดียวกับ
รายการ allowlist ของพาธแบบ manual สำหรับความเชื่อถือ explicit ที่เข้มงวด ให้ปิดใช้ `autoAllowSkills`

ใช้ตัวควบคุมสองแบบสำหรับงานที่ต่างกัน:

- `tools.exec.safeBins`: ตัวกรองสตรีมขนาดเล็กแบบ stdin-only
- `tools.exec.safeBinTrustedDirs`: ไดเรกทอรีที่เชื่อถือเพิ่มเติมแบบ explicit สำหรับพาธ executable ของไบนารีปลอดภัย
- `tools.exec.safeBinProfiles`: นโยบาย argv แบบ explicit สำหรับไบนารีปลอดภัยแบบกำหนดเอง
- allowlist: ความเชื่อถือแบบ explicit สำหรับพาธ executable

อย่าถือว่า `safeBins` เป็นรายการที่อนุญาตทั่วไป และอย่าเพิ่มไบนารีของอินเทอร์พรีเตอร์/รันไทม์ (เช่น `python3`, `node`, `ruby`, `bash`) หากคุณต้องการสิ่งเหล่านั้น ให้ใช้รายการที่อนุญาตแบบชัดเจน และเปิดใช้งานพรอมป์อนุมัติไว้ต่อไป
`openclaw security audit` จะแจ้งเตือนเมื่อรายการ `safeBins` ของอินเทอร์พรีเตอร์/รันไทม์ไม่มีโปรไฟล์ที่ระบุชัดเจน และ `openclaw doctor --fix` สามารถสร้างโครงรายการ `safeBinProfiles` แบบกำหนดเองที่ขาดหายไปได้
`openclaw security audit` และ `openclaw doctor` จะแจ้งเตือนเช่นกันเมื่อคุณเพิ่มไบนารีที่มีพฤติกรรมกว้าง เช่น `jq` กลับเข้าไปใน `safeBins` อย่างชัดเจน
หากคุณอนุญาตอินเทอร์พรีเตอร์อย่างชัดเจน ให้เปิดใช้ `tools.exec.strictInlineEval` เพื่อให้รูปแบบการประเมินโค้ดแบบอินไลน์ยังคงต้องได้รับการอนุมัติใหม่

สำหรับรายละเอียดและตัวอย่างนโยบายฉบับเต็ม โปรดดู [การอนุมัติ Exec](/th/tools/exec-approvals-advanced#safe-bins-stdin-only) และ [ไบนารีที่ปลอดภัยเทียบกับรายการที่อนุญาต](/th/tools/exec-approvals-advanced#safe-bins-versus-allowlist)

## ตัวอย่าง

เบื้องหน้า:

```json
{ "tool": "exec", "command": "ls -la" }
```

เบื้องหลัง + โพล:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

การโพลมีไว้สำหรับสถานะแบบตามต้องการ ไม่ใช่ลูปรอ หากเปิดใช้งานการปลุกเมื่อเสร็จสิ้นอัตโนมัติ คำสั่งสามารถปลุกเซสชันได้เมื่อมีเอาต์พุตหรือเมื่อทำงานล้มเหลว

ส่งคีย์ (สไตล์ tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

ส่ง (ส่งเฉพาะ CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

วาง (มีวงเล็บกำกับตามค่าเริ่มต้น):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` เป็นเครื่องมือย่อยของ `exec` สำหรับการแก้ไขหลายไฟล์แบบมีโครงสร้าง
เปิดใช้งานตามค่าเริ่มต้นสำหรับโมเดล OpenAI และ OpenAI Codex ใช้การกำหนดค่าเฉพาะเมื่อคุณต้องการปิดใช้งานหรือจำกัดให้ใช้กับโมเดลบางรายการเท่านั้น:

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

- ใช้ได้เฉพาะกับโมเดล OpenAI/OpenAI Codex เท่านั้น
- นโยบายเครื่องมือยังคงมีผล; `allow: ["write"]` อนุญาต `apply_patch` โดยนัย
- `deny: ["write"]` ไม่ได้ปฏิเสธ `apply_patch`; ให้ปฏิเสธ `apply_patch` อย่างชัดเจน หรือใช้ `deny: ["group:fs"]` เมื่อการเขียนแพตช์ควรถูกบล็อกด้วย
- การกำหนดค่าอยู่ใต้ `tools.exec.applyPatch`
- `tools.exec.applyPatch.enabled` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เพื่อปิดใช้งานเครื่องมือสำหรับโมเดล OpenAI
- `tools.exec.applyPatch.workspaceOnly` มีค่าเริ่มต้นเป็น `true` (จำกัดอยู่ในเวิร์กสเปซ) ตั้งเป็น `false` เฉพาะเมื่อคุณตั้งใจให้ `apply_patch` เขียน/ลบภายนอกไดเรกทอรีเวิร์กสเปซเท่านั้น

## ที่เกี่ยวข้อง

- [การอนุมัติ Exec](/th/tools/exec-approvals) — เกตการอนุมัติสำหรับคำสั่งเชลล์
- [การทำ Sandbox](/th/gateway/sandboxing) — การเรียกใช้คำสั่งในสภาพแวดล้อมแบบแซนด์บ็อกซ์
- [กระบวนการเบื้องหลัง](/th/gateway/background-process) — exec และเครื่องมือ process ที่ทำงานเป็นเวลานาน
- [ความปลอดภัย](/th/gateway/security) — นโยบายเครื่องมือและสิทธิ์เข้าถึงที่ยกระดับ
