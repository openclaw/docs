---
read_when:
    - การใช้หรือแก้ไขเครื่องมือ exec
    - การดีบักพฤติกรรมของ stdin หรือ TTY
summary: การใช้งานเครื่องมือ exec, โหมด stdin และการรองรับ TTY
title: เครื่องมือเรียกใช้คำสั่ง
x-i18n:
    generated_at: "2026-05-10T19:59:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 445b09c1c6cdc1998c1c2a6b1223fdef438011413d246c4de0de0436465b448f
    source_path: tools/exec.md
    workflow: 16
---

เรียกใช้คำสั่งเชลล์ในพื้นที่ทำงาน `exec` เป็นพื้นผิวเชลล์ที่เปลี่ยนแปลงสถานะได้: คำสั่งสามารถสร้าง แก้ไข หรือลบไฟล์ได้ทุกที่ที่โฮสต์ที่เลือกหรือระบบไฟล์ sandbox อนุญาต การปิดใช้งานเครื่องมือระบบไฟล์ของ OpenClaw เช่น `write`, `edit` หรือ `apply_patch` ไม่ได้ทำให้ `exec` เป็นแบบอ่านอย่างเดียว

รองรับการรันแบบ foreground + background ผ่าน `process` หากไม่อนุญาตให้ใช้ `process` `exec` จะรันแบบซิงโครนัสและละเว้น `yieldMs`/`background`
เซสชัน background ถูกจำกัดขอบเขตตาม agent แต่ละตัว `process` จะเห็นเฉพาะเซสชันจาก agent เดียวกันเท่านั้น

## พารามิเตอร์

<ParamField path="command" type="string" required>
คำสั่งเชลล์ที่จะรัน
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
ไดเรกทอรีทำงานสำหรับคำสั่ง
</ParamField>

<ParamField path="env" type="object">
การแทนที่สภาพแวดล้อมแบบคีย์/ค่าที่ผสานทับสภาพแวดล้อมที่สืบทอดมา
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
ส่งคำสั่งไปเป็น background โดยอัตโนมัติหลังจากดีเลย์นี้ (มิลลิวินาที)
</ParamField>

<ParamField path="background" type="boolean" default="false">
ส่งคำสั่งไปเป็น background ทันทีแทนการรอ `yieldMs`
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
แทนที่ timeout ของ exec ที่กำหนดค่าไว้สำหรับการเรียกนี้ ตั้ง `timeout: 0` เฉพาะเมื่อคำสั่งควรรันโดยไม่มี timeout ของกระบวนการ exec
</ParamField>

<ParamField path="pty" type="boolean" default="false">
รันใน pseudo-terminal เมื่อพร้อมใช้งาน ใช้สำหรับ CLI ที่ต้องใช้ TTY เท่านั้น, coding agents และ UI ในเทอร์มินัล
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
ตำแหน่งที่จะรัน `auto` จะ resolve เป็น `sandbox` เมื่อ sandbox runtime ทำงานอยู่ และเป็น `gateway` ในกรณีอื่น
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
โหมดการบังคับใช้สำหรับการรัน `gateway` / `node`
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
พฤติกรรมพรอมป์ขออนุมัติสำหรับการรัน `gateway` / `node`
</ParamField>

<ParamField path="node" type="string">
ไอดี/ชื่อของ Node เมื่อ `host=node`
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
ขอโหมด elevated — ออกจาก sandbox ไปยังเส้นทางโฮสต์ที่กำหนดค่าไว้ `security=full` จะถูกบังคับใช้เฉพาะเมื่อ elevated resolve เป็น `full`
</ParamField>

หมายเหตุ:

- `host` มีค่าเริ่มต้นเป็น `auto`: sandbox เมื่อ sandbox runtime ทำงานอยู่สำหรับเซสชัน มิฉะนั้นเป็น gateway
- `host` รับเฉพาะ `auto`, `sandbox`, `gateway` หรือ `node` เท่านั้น ไม่ใช่ตัวเลือก hostname; ค่าที่ดูเหมือน hostname จะถูกปฏิเสธก่อนคำสั่งรัน
- `auto` เป็นกลยุทธ์การกำหนดเส้นทางเริ่มต้น ไม่ใช่ wildcard อนุญาต `host=node` รายครั้งจาก `auto`; อนุญาต `host=gateway` รายครั้งเฉพาะเมื่อไม่มี sandbox runtime ทำงานอยู่
- หากไม่มีการกำหนดค่าเพิ่มเติม `host=auto` ยัง “ใช้งานได้ทันที”: ไม่มี sandbox หมายถึง resolve เป็น `gateway`; sandbox ที่ทำงานอยู่หมายถึงยังอยู่ใน sandbox
- `elevated` ออกจาก sandbox ไปยังเส้นทางโฮสต์ที่กำหนดค่าไว้: ค่าเริ่มต้นคือ `gateway` หรือ `node` เมื่อ `tools.exec.host=node` (หรือค่าเริ่มต้นของเซสชันคือ `host=node`) ใช้งานได้เฉพาะเมื่อเปิดใช้งานสิทธิ์ elevated สำหรับเซสชัน/ผู้ให้บริการปัจจุบัน
- การอนุมัติ `gateway`/`node` ถูกควบคุมโดย `~/.openclaw/exec-approvals.json`
- `node` ต้องมี Node ที่จับคู่ไว้ (แอปคู่หูหรือโฮสต์ Node แบบ headless)
- หากมี Node หลายตัว ให้ตั้ง `exec.node` หรือ `tools.exec.node` เพื่อเลือกหนึ่งตัว
- `exec host=node` เป็นเส้นทางการรันเชลล์เพียงเส้นทางเดียวสำหรับ Node; wrapper เดิม `nodes.run` ถูกลบออกแล้ว
- `timeout` ใช้กับการรัน foreground, background, `yieldMs`, gateway, sandbox และ `system.run` ของ Node หากละไว้ OpenClaw จะใช้ `tools.exec.timeoutSec`; `timeout: 0` แบบระบุชัดจะปิดใช้งาน timeout ของกระบวนการ exec สำหรับการเรียกนั้น
- บนโฮสต์ที่ไม่ใช่ Windows exec ใช้ `SHELL` เมื่อตั้งค่าไว้; หาก `SHELL` เป็น `fish` จะเลือกใช้ `bash` (หรือ `sh`)
  จาก `PATH` ก่อน เพื่อหลีกเลี่ยงสคริปต์ที่เข้ากันไม่ได้กับ fish แล้วจึง fallback ไปที่ `SHELL` หากไม่มีทั้งสองอย่าง
- บนโฮสต์ Windows exec จะค้นหาและเลือกใช้ PowerShell 7 (`pwsh`) ก่อน (Program Files, ProgramW6432 แล้วจึง PATH)
  จากนั้น fallback ไปที่ Windows PowerShell 5.1
- การรันบนโฮสต์ (`gateway`/`node`) ปฏิเสธ `env.PATH` และการแทนที่ loader (`LD_*`/`DYLD_*`) เพื่อ
  ป้องกันการ hijack ไบนารีหรือการฉีดโค้ด
- OpenClaw ตั้ง `OPENCLAW_SHELL=exec` ในสภาพแวดล้อมของคำสั่งที่ spawn (รวมถึงการรัน PTY และ sandbox) เพื่อให้กฎ shell/profile ตรวจจับบริบทของเครื่องมือ exec ได้
- `openclaw channels login` ถูกบล็อกจาก `exec` เพราะเป็น flow การยืนยันตัวตนช่องทางแบบโต้ตอบ; ให้รันในเทอร์มินัลบนโฮสต์ Gateway หรือใช้เครื่องมือล็อกอินเฉพาะของช่องทางจากแชตเมื่อมี
- สำคัญ: sandboxing **ปิดเป็นค่าเริ่มต้น** หากปิด sandboxing ไว้ `host=auto` โดยนัย
  จะ resolve เป็น `gateway` ส่วน `host=sandbox` แบบระบุชัดยังคงล้มเหลวแบบปิด แทนที่จะรันบนโฮสต์ Gateway อย่างเงียบ ๆ
  เปิดใช้งาน sandboxing หรือใช้ `host=gateway` พร้อมการอนุมัติ
- การตรวจสอบ preflight ของสคริปต์ (สำหรับข้อผิดพลาดไวยากรณ์เชลล์ Python/Node ที่พบบ่อย) จะตรวจเฉพาะไฟล์ภายใน
  ขอบเขต `workdir` ที่มีผล หากเส้นทางสคริปต์ resolve ออกนอก `workdir` preflight จะถูกข้ามสำหรับ
  ไฟล์นั้น
- สำหรับงานที่รันนานซึ่งเริ่มตอนนี้ ให้เริ่มครั้งเดียวและพึ่งพาการปลุกเมื่อเสร็จสิ้นโดยอัตโนมัติ
  เมื่อเปิดใช้งานและคำสั่งส่ง output หรือทำงานล้มเหลว
  ใช้ `process` สำหรับ log, สถานะ, input หรือการแทรกแซง; อย่าจำลอง
  scheduling ด้วยลูป sleep, ลูป timeout หรือการ polling ซ้ำ
- สำหรับงานที่ควรเกิดขึ้นภายหลังหรือตามกำหนดเวลา ให้ใช้ Cron แทนรูปแบบ sleep/delay ของ `exec`

## การกำหนดค่า

- `tools.exec.notifyOnExit` (ค่าเริ่มต้น: true): เมื่อเป็น true เซสชัน exec ที่อยู่ใน background จะ enqueue เหตุการณ์ระบบและขอ Heartbeat เมื่อออก
- `tools.exec.approvalRunningNoticeMs` (ค่าเริ่มต้น: 10000): ส่งประกาศ “กำลังรัน” เพียงครั้งเดียวเมื่อ exec ที่ต้องผ่านการอนุมัติรันนานกว่านี้ (0 ปิดใช้งาน)
- `tools.exec.timeoutSec` (ค่าเริ่มต้น: 1800): timeout เริ่มต้นต่อคำสั่ง exec เป็นวินาที `timeout` รายครั้งจะแทนที่ค่านี้; `timeout: 0` รายครั้งจะปิดใช้งาน timeout ของกระบวนการ exec
- `tools.exec.host` (ค่าเริ่มต้น: `auto`; resolve เป็น `sandbox` เมื่อ sandbox runtime ทำงานอยู่ และเป็น `gateway` ในกรณีอื่น)
- `tools.exec.security` (ค่าเริ่มต้น: `deny` สำหรับ sandbox, `full` สำหรับ gateway + node เมื่อไม่ได้ตั้งค่า)
- `tools.exec.ask` (ค่าเริ่มต้น: `off`)
- exec บนโฮสต์แบบไม่ต้องอนุมัติเป็นค่าเริ่มต้นสำหรับ gateway + node หากต้องการพฤติกรรมแบบอนุมัติ/allowlist ให้เข้มงวดทั้ง `tools.exec.*` และ `~/.openclaw/exec-approvals.json` ของโฮสต์; ดู [การอนุมัติ exec](/th/tools/exec-approvals#yolo-mode-no-approval)
- YOLO มาจากค่าเริ่มต้นของนโยบายโฮสต์ (`security=full`, `ask=off`) ไม่ใช่จาก `host=auto` หากต้องการบังคับการกำหนดเส้นทางไป gateway หรือ node ให้ตั้ง `tools.exec.host` หรือใช้ `/exec host=...`
- ในโหมด `security=full` พร้อม `ask=off` exec บนโฮสต์จะทำตามนโยบายที่กำหนดค่าไว้โดยตรง; ไม่มี heuristic prefilter เพิ่มเติมสำหรับคำสั่งที่ถูกทำให้อ่านยาก หรือชั้นการปฏิเสธแบบ script-preflight
- `tools.exec.node` (ค่าเริ่มต้น: ไม่ได้ตั้งค่า)
- `tools.exec.strictInlineEval` (ค่าเริ่มต้น: false): เมื่อเป็น true รูปแบบ eval ของ interpreter แบบ inline เช่น `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` และ `osascript -e` จะต้องขออนุมัติแบบระบุชัดเสมอ `allow-always` ยังสามารถคงสิทธิ์การเรียก interpreter/สคริปต์ที่ปลอดภัยได้ แต่รูปแบบ inline-eval ยังจะแสดงพรอมป์ทุกครั้ง
- `tools.exec.pathPrepend`: รายการไดเรกทอรีที่จะเติมนำหน้า `PATH` สำหรับการรัน exec (gateway + sandbox เท่านั้น)
- `tools.exec.safeBins`: ไบนารีปลอดภัยแบบ stdin-only ที่รันได้โดยไม่ต้องมีรายการ allowlist แบบระบุชัด สำหรับรายละเอียดพฤติกรรม ดู [ไบนารีที่ปลอดภัย](/th/tools/exec-approvals-advanced#safe-bins-stdin-only)
- `tools.exec.safeBinTrustedDirs`: ไดเรกทอรีเพิ่มเติมแบบระบุชัดที่เชื่อถือได้สำหรับการตรวจเส้นทาง `safeBins` รายการ `PATH` จะไม่ถูกเชื่อถือโดยอัตโนมัติ ค่าเริ่มต้นในตัวคือ `/bin` และ `/usr/bin`
- `tools.exec.safeBinProfiles`: นโยบาย argv แบบกำหนดเองที่เป็นทางเลือกต่อ safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`)

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

- `host=gateway`: ผสาน `PATH` ของ login-shell ของคุณเข้าไปในสภาพแวดล้อม exec การแทนที่ `env.PATH`
  ถูกปฏิเสธสำหรับการรันบนโฮสต์ ตัว daemon เองยังคงรันด้วย `PATH` ขั้นต่ำ:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: รัน `sh -lc` (login shell) ภายในคอนเทนเนอร์ ดังนั้น `/etc/profile` อาจรีเซ็ต `PATH`
  OpenClaw เติม `env.PATH` นำหน้าหลังจาก source profile ผ่าน env var ภายใน (ไม่มี shell interpolation);
  `tools.exec.pathPrepend` ใช้ที่นี่ด้วย
- `host=node`: เฉพาะการแทนที่ env ที่ไม่ถูกบล็อกที่คุณส่งเข้าไปเท่านั้นที่จะถูกส่งไปยัง Node การแทนที่ `env.PATH`
  ถูกปฏิเสธสำหรับการรันบนโฮสต์และถูกโฮสต์ Node ละเว้น หากต้องการรายการ PATH เพิ่มเติมบน Node
  ให้กำหนดค่าสภาพแวดล้อมของบริการโฮสต์ Node (systemd/launchd) หรือติดตั้งเครื่องมือในตำแหน่งมาตรฐาน

การ bind Node ต่อ agent (ใช้ดัชนีรายการ agent ใน config):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

UI ควบคุม: แท็บ Nodes มีแผง “การ bind Node สำหรับ Exec” ขนาดเล็กสำหรับการตั้งค่าเดียวกัน

## การแทนที่ของเซสชัน (`/exec`)

ใช้ `/exec` เพื่อตั้งค่าเริ่มต้น **ต่อเซสชัน** สำหรับ `host`, `security`, `ask` และ `node`
ส่ง `/exec` โดยไม่มีอาร์กิวเมนต์เพื่อแสดงค่าปัจจุบัน

ตัวอย่าง:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## โมเดลการอนุญาต

`/exec` จะถูกยอมรับเฉพาะสำหรับ **ผู้ส่งที่ได้รับอนุญาต** (allowlist/การจับคู่ของช่องทาง พร้อม `commands.useAccessGroups`)
คำสั่งนี้อัปเดต **สถานะเซสชันเท่านั้น** และไม่เขียน config หากต้องการปิดใช้งาน exec อย่างเด็ดขาด ให้ deny ผ่านนโยบายเครื่องมือ
(`tools.deny: ["exec"]` หรือต่อ agent) การอนุมัติบนโฮสต์ยังคงมีผล เว้นแต่คุณจะตั้ง
`security=full` และ `ask=off` อย่างชัดเจน

## การอนุมัติ Exec (แอปคู่หู / โฮสต์ Node)

agent ที่อยู่ใน sandbox สามารถกำหนดให้ต้องมีการอนุมัติต่อคำขอก่อนที่ `exec` จะรันบนโฮสต์ Gateway หรือ Node
ดู [การอนุมัติ Exec](/th/tools/exec-approvals) สำหรับนโยบาย, allowlist และ flow ของ UI

เมื่อต้องมีการอนุมัติ เครื่องมือ exec จะส่งคืนทันทีด้วย
`status: "approval-pending"` และไอดีการอนุมัติ เมื่ออนุมัติแล้ว (หรือถูกปฏิเสธ / หมดเวลา)
Gateway จะส่งเหตุการณ์ระบบ (`Exec finished` / `Exec denied`) หากคำสั่งยังคง
รันอยู่หลัง `tools.exec.approvalRunningNoticeMs` จะมีการส่งประกาศ `Exec running` เพียงครั้งเดียว
ในช่องทางที่มีการ์ด/ปุ่มอนุมัติแบบ native agent ควรพึ่งพา
UI native นั้นก่อน และรวมคำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์ของเครื่องมือ
ระบุชัดว่าไม่มีการอนุมัติผ่านแชต หรือการอนุมัติแบบ manual เป็น
เส้นทางเดียว

## Allowlist + ไบนารีที่ปลอดภัย

การบังคับใช้ allowlist แบบ manual จะจับคู่ glob ของเส้นทางไบนารีที่ resolve แล้วและ glob ของชื่อคำสั่งล้วน
ชื่อล้วนจับคู่เฉพาะคำสั่งที่เรียกผ่าน PATH ดังนั้น `rg` สามารถจับคู่
`/opt/homebrew/bin/rg` เมื่อคำสั่งคือ `rg` แต่ไม่จับคู่ `./rg` หรือ `/tmp/rg`
เมื่อ `security=allowlist` คำสั่งเชลล์จะถูกอนุญาตโดยอัตโนมัติเฉพาะเมื่อทุก segment ของ pipeline
อยู่ใน allowlist หรือเป็น safe bin การ chaining (`;`, `&&`, `||`) และ redirection
จะถูกปฏิเสธในโหมด allowlist เว้นแต่ทุก segment ระดับบนสุดจะเป็นไปตาม
allowlist (รวมถึง safe bins) redirection ยังไม่รองรับ
ความเชื่อถือแบบคงทน `allow-always` ไม่ข้ามกฎนั้น: คำสั่งที่ chained ยังต้องให้ทุก
segment ระดับบนสุดจับคู่ได้

`autoAllowSkills` เป็นเส้นทางอำนวยความสะดวกแยกต่างหากในการอนุมัติ exec ไม่เหมือนกับ
รายการ allowlist ของเส้นทางแบบ manual สำหรับความเชื่อถือแบบระบุชัดอย่างเข้มงวด ให้ปิดใช้งาน `autoAllowSkills`

ใช้ตัวควบคุมทั้งสองสำหรับงานที่ต่างกัน:

- `tools.exec.safeBins`: ตัวกรอง stream ขนาดเล็กแบบ stdin-only
- `tools.exec.safeBinTrustedDirs`: ไดเรกทอรีที่เชื่อถือเพิ่มเติมแบบระบุชัดสำหรับเส้นทางไฟล์ executable ของ safe-bin
- `tools.exec.safeBinProfiles`: นโยบาย argv แบบระบุชัดสำหรับ safe bins แบบกำหนดเอง
- allowlist: ความเชื่อถือแบบระบุชัดสำหรับเส้นทางไฟล์ executable

อย่าใช้ `safeBins` เป็นรายการอนุญาตทั่วไป และอย่าเพิ่มไบนารีของอินเทอร์พรีเตอร์/รันไทม์ (เช่น `python3`, `node`, `ruby`, `bash`) หากคุณจำเป็นต้องใช้สิ่งเหล่านี้ ให้ใช้รายการอนุญาตที่ระบุชัดเจนและเปิดใช้พร้อมต์ขออนุมัติไว้
`openclaw security audit` จะเตือนเมื่อรายการ `safeBins` ของอินเทอร์พรีเตอร์/รันไทม์ไม่มีโปรไฟล์ที่ระบุชัดเจน และ `openclaw doctor --fix` สามารถสร้างโครงรายการ `safeBinProfiles` แบบกำหนดเองที่ขาดหายไปได้
`openclaw security audit` และ `openclaw doctor` จะเตือนเช่นกันเมื่อคุณเพิ่มไบนารีที่มีพฤติกรรมกว้าง เช่น `jq` กลับเข้าไปใน `safeBins` อย่างชัดเจน
หากคุณอนุญาตอินเทอร์พรีเตอร์อย่างชัดเจน ให้เปิดใช้ `tools.exec.strictInlineEval` เพื่อให้รูปแบบการประเมินโค้ดแบบอินไลน์ยังคงต้องขออนุมัติใหม่

สำหรับรายละเอียดนโยบายและตัวอย่างทั้งหมด โปรดดู [การอนุมัติ exec](/th/tools/exec-approvals-advanced#safe-bins-stdin-only) และ [ไบนารีที่ปลอดภัยเทียบกับรายการอนุญาต](/th/tools/exec-approvals-advanced#safe-bins-versus-allowlist)

## ตัวอย่าง

โฟร์กราวด์:

```json
{ "tool": "exec", "command": "ls -la" }
```

เบื้องหลัง + โพล:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

การโพลใช้สำหรับสถานะตามต้องการ ไม่ใช่ลูปรอ หากเปิดใช้การปลุกเมื่อเสร็จสิ้นอัตโนมัติ
คำสั่งสามารถปลุกเซสชันได้เมื่อมีเอาต์พุตหรือเมื่อคำสั่งล้มเหลว

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

วาง (มี bracketed paste ตามค่าเริ่มต้น):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` เป็น subtool ของ `exec` สำหรับการแก้ไขหลายไฟล์แบบมีโครงสร้าง
เปิดใช้ตามค่าเริ่มต้นสำหรับโมเดล OpenAI และ OpenAI Codex ใช้การกำหนดค่าเฉพาะเมื่อ
คุณต้องการปิดใช้หรือจำกัดให้ใช้กับโมเดลบางรุ่นเท่านั้น:

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

- มีให้ใช้เฉพาะกับโมเดล OpenAI/OpenAI Codex เท่านั้น
- นโยบายเครื่องมือยังคงมีผล; `allow: ["write"]` อนุญาต `apply_patch` โดยนัย
- `deny: ["write"]` ไม่ได้ปฏิเสธ `apply_patch`; ให้ปฏิเสธ `apply_patch` อย่างชัดเจน หรือใช้ `deny: ["group:fs"]` เมื่อควรบล็อกการเขียนแพตช์ด้วย
- การกำหนดค่าอยู่ภายใต้ `tools.exec.applyPatch`
- `tools.exec.applyPatch.enabled` มีค่าเริ่มต้นเป็น `true`; ตั้งค่าเป็น `false` เพื่อปิดใช้เครื่องมือนี้สำหรับโมเดล OpenAI
- `tools.exec.applyPatch.workspaceOnly` มีค่าเริ่มต้นเป็น `true` (จำกัดอยู่ในเวิร์กสเปซ) ตั้งค่าเป็น `false` เฉพาะเมื่อคุณตั้งใจให้ `apply_patch` เขียน/ลบนอกไดเรกทอรีเวิร์กสเปซ

## ที่เกี่ยวข้อง

- [การอนุมัติ Exec](/th/tools/exec-approvals) — เกตการอนุมัติสำหรับคำสั่งเชลล์
- [Sandboxing](/th/gateway/sandboxing) — การรันคำสั่งในสภาพแวดล้อมแบบแซนด์บ็อกซ์
- [กระบวนการเบื้องหลัง](/th/gateway/background-process) — exec ที่รันเป็นเวลานานและเครื่องมือ process
- [ความปลอดภัย](/th/gateway/security) — นโยบายเครื่องมือและสิทธิ์เข้าถึงที่ยกระดับ
