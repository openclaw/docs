---
read_when:
    - การใช้หรือปรับเปลี่ยนเครื่องมือ exec
    - การดีบักลักษณะการทำงานของ stdin หรือ TTY
summary: การใช้งานเครื่องมือ Exec, โหมด stdin และการรองรับ TTY
title: เครื่องมือ Exec
x-i18n:
    generated_at: "2026-04-30T10:19:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7949cfde9f141202a3bc36c2be72ecdf6d43305b5f16fb02835a69bcaa46067b
    source_path: tools/exec.md
    workflow: 16
---

เรียกใช้คำสั่งเชลล์ในเวิร์กสเปซ รองรับการทำงานแบบเบื้องหน้าและเบื้องหลังผ่าน `process`
หากไม่อนุญาตให้ใช้ `process` `exec` จะทำงานแบบซิงโครนัสและไม่สนใจ `yieldMs`/`background`
เซสชันเบื้องหลังถูกกำหนดขอบเขตต่อเอเจนต์ `process` จะเห็นเฉพาะเซสชันจากเอเจนต์เดียวกันเท่านั้น

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
ย้ายคำสั่งไปทำงานเบื้องหลังโดยอัตโนมัติหลังจากหน่วงเวลานี้ (มิลลิวินาที)
</ParamField>

<ParamField path="background" type="boolean" default="false">
ย้ายคำสั่งไปทำงานเบื้องหลังทันทีแทนการรอ `yieldMs`
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
แทนที่ค่า timeout ของ exec ที่กำหนดไว้สำหรับการเรียกครั้งนี้ ตั้ง `timeout: 0` เฉพาะเมื่อคำสั่งควรรันโดยไม่มี timeout ของกระบวนการ exec
</ParamField>

<ParamField path="pty" type="boolean" default="false">
เรียกใช้ใน pseudo-terminal เมื่อพร้อมใช้งาน ใช้สำหรับ CLI ที่ต้องใช้ TTY เท่านั้น, เอเจนต์เขียนโค้ด, และ UI เทอร์มินัล
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
ตำแหน่งที่จะเรียกใช้ `auto` จะแปลงเป็น `sandbox` เมื่อรันไทม์ sandbox ทำงานอยู่ และเป็น `gateway` ในกรณีอื่น
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
โหมดการบังคับใช้งานสำหรับการทำงานแบบ `gateway` / `node`
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
พฤติกรรมพรอมป์อนุมัติสำหรับการทำงานแบบ `gateway` / `node`
</ParamField>

<ParamField path="node" type="string">
รหัส/ชื่อ Node เมื่อ `host=node`
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
ขอโหมด elevated — ออกจาก sandbox ไปยังพาธโฮสต์ที่กำหนดไว้ `security=full` จะถูกบังคับใช้เฉพาะเมื่อ elevated แปลงเป็น `full`
</ParamField>

หมายเหตุ:

- `host` มีค่าเริ่มต้นเป็น `auto`: sandbox เมื่อรันไทม์ sandbox ทำงานอยู่สำหรับเซสชัน มิฉะนั้นจะเป็น gateway
- `host` รับได้เฉพาะ `auto`, `sandbox`, `gateway`, หรือ `node` เท่านั้น ไม่ใช่ตัวเลือกชื่อโฮสต์ ค่าที่ดูเหมือนชื่อโฮสต์จะถูกปฏิเสธก่อนคำสั่งทำงาน
- `auto` คือกลยุทธ์การกำหนดเส้นทางเริ่มต้น ไม่ใช่ไวลด์การ์ด อนุญาต `host=node` ต่อการเรียกจาก `auto`; อนุญาต `host=gateway` ต่อการเรียกเฉพาะเมื่อไม่มีรันไทม์ sandbox ทำงานอยู่
- หากไม่มีการตั้งค่าเพิ่มเติม `host=auto` ยัง "ใช้งานได้ทันที": ไม่มี sandbox หมายความว่าจะถูกแปลงเป็น `gateway`; sandbox ที่ทำงานอยู่หมายความว่าจะยังคงอยู่ใน sandbox
- `elevated` ออกจาก sandbox ไปยังพาธโฮสต์ที่กำหนดไว้: ค่าเริ่มต้นคือ `gateway` หรือ `node` เมื่อ `tools.exec.host=node` (หรือค่าเริ่มต้นของเซสชันคือ `host=node`) ใช้ได้เฉพาะเมื่อเปิดใช้งานสิทธิ์ elevated สำหรับเซสชัน/ผู้ให้บริการปัจจุบัน
- การอนุมัติ `gateway`/`node` ถูกควบคุมโดย `~/.openclaw/exec-approvals.json`
- `node` ต้องมี Node ที่จับคู่แล้ว (แอป companion หรือโฮสต์ Node แบบ headless)
- หากมี Node หลายตัว ให้ตั้งค่า `exec.node` หรือ `tools.exec.node` เพื่อเลือกหนึ่งตัว
- `exec host=node` เป็นเส้นทางเรียกใช้เชลล์เพียงเส้นทางเดียวสำหรับ Node; wrapper เดิม `nodes.run` ถูกลบแล้ว
- `timeout` ใช้กับการทำงานเบื้องหน้า, เบื้องหลัง, `yieldMs`, gateway, sandbox, และการทำงาน `system.run` ของ Node หากละไว้ OpenClaw จะใช้ `tools.exec.timeoutSec`; `timeout: 0` แบบระบุชัดจะปิดใช้ timeout ของกระบวนการ exec สำหรับการเรียกนั้น
- บนโฮสต์ที่ไม่ใช่ Windows, exec ใช้ `SHELL` เมื่อตั้งค่าไว้; หาก `SHELL` เป็น `fish` จะเลือกใช้ `bash` (หรือ `sh`)
  จาก `PATH` ก่อนเพื่อหลีกเลี่ยงสคริปต์ที่ไม่เข้ากันกับ fish จากนั้นจึง fallback กลับไปใช้ `SHELL` หากไม่มีทั้งสองอย่าง
- บนโฮสต์ Windows, exec จะเลือกการค้นพบ PowerShell 7 (`pwsh`) ก่อน (Program Files, ProgramW6432, แล้วจึง PATH),
  จากนั้น fallback ไปใช้ Windows PowerShell 5.1
- การทำงานบนโฮสต์ (`gateway`/`node`) ปฏิเสธ `env.PATH` และการแทนที่ loader (`LD_*`/`DYLD_*`) เพื่อ
  ป้องกันการ hijack ไบนารีหรือการฉีดโค้ด
- OpenClaw ตั้งค่า `OPENCLAW_SHELL=exec` ในสภาพแวดล้อมของคำสั่งที่ spawn ขึ้นมา (รวมถึงการทำงานแบบ PTY และ sandbox) เพื่อให้กฎ shell/profile ตรวจพบบริบทเครื่องมือ exec ได้
- `openclaw channels login` ถูกบล็อกจาก `exec` เพราะเป็นโฟลว์ยืนยันตัวตนช่องทางแบบโต้ตอบ ให้รันในเทอร์มินัลบนโฮสต์ gateway หรือใช้เครื่องมือล็อกอินเฉพาะช่องทางจากแชตเมื่อมีให้ใช้
- สำคัญ: sandboxing **ปิดตามค่าเริ่มต้น** หาก sandboxing ปิดอยู่ `host=auto` แบบนัย
  จะแปลงเป็น `gateway` `host=sandbox` แบบระบุชัดจะยังคงล้มเหลวแบบปิดแทนที่จะ
  รันบนโฮสต์ gateway อย่างเงียบ ๆ เปิดใช้ sandboxing หรือใช้ `host=gateway` พร้อมการอนุมัติ
- การตรวจ preflight ของสคริปต์ (สำหรับข้อผิดพลาดไวยากรณ์เชลล์ Python/Node ที่พบบ่อย) ตรวจเฉพาะไฟล์ภายใน
  ขอบเขต `workdir` ที่มีผลเท่านั้น หากพาธสคริปต์แปลงไปอยู่นอก `workdir` จะข้าม preflight สำหรับ
  ไฟล์นั้น
- สำหรับงานที่รันนานซึ่งเริ่มตอนนี้ ให้เริ่มเพียงครั้งเดียวและพึ่งพาการปลุกเมื่อเสร็จสิ้นโดยอัตโนมัติ
  เมื่อเปิดใช้งานและคำสั่งปล่อยเอาต์พุตหรือทำงานล้มเหลว
  ใช้ `process` สำหรับบันทึก, สถานะ, อินพุต, หรือการแทรกแซง; อย่าจำลอง
  การจัดกำหนดการด้วยลูป sleep, ลูป timeout, หรือการ polling ซ้ำ
- สำหรับงานที่ควรเกิดขึ้นภายหลังหรือตามกำหนดเวลา ให้ใช้ cron แทนรูปแบบ sleep/delay ของ
  `exec`

## การตั้งค่า

- `tools.exec.notifyOnExit` (ค่าเริ่มต้น: true): เมื่อเป็น true เซสชัน exec ที่ถูกย้ายไปเบื้องหลังจะเข้าคิวเหตุการณ์ระบบและขอ Heartbeat เมื่อออก
- `tools.exec.approvalRunningNoticeMs` (ค่าเริ่มต้น: 10000): ส่งประกาศ “running” หนึ่งครั้งเมื่อ exec ที่ต้องผ่านการอนุมัติรันนานกว่านี้ (0 เพื่อปิดใช้)
- `tools.exec.timeoutSec` (ค่าเริ่มต้น: 1800): timeout เริ่มต้นต่อคำสั่ง exec เป็นวินาที `timeout` ต่อการเรียกจะแทนที่ค่านี้; `timeout: 0` ต่อการเรียกจะปิดใช้ timeout ของกระบวนการ exec
- `tools.exec.host` (ค่าเริ่มต้น: `auto`; แปลงเป็น `sandbox` เมื่อรันไทม์ sandbox ทำงานอยู่, เป็น `gateway` ในกรณีอื่น)
- `tools.exec.security` (ค่าเริ่มต้น: `deny` สำหรับ sandbox, `full` สำหรับ gateway + node เมื่อไม่ได้ตั้งค่า)
- `tools.exec.ask` (ค่าเริ่มต้น: `off`)
- host exec แบบไม่ต้องอนุมัติคือค่าเริ่มต้นสำหรับ gateway + node หากต้องการพฤติกรรมการอนุมัติ/allowlist ให้เข้มงวดทั้ง `tools.exec.*` และ `~/.openclaw/exec-approvals.json` ของโฮสต์; ดู [การอนุมัติ Exec](/th/tools/exec-approvals#no-approval-yolo-mode)
- YOLO มาจากค่าเริ่มต้นของนโยบายโฮสต์ (`security=full`, `ask=off`) ไม่ได้มาจาก `host=auto` หากต้องการบังคับการกำหนดเส้นทาง gateway หรือ node ให้ตั้งค่า `tools.exec.host` หรือใช้ `/exec host=...`
- ในโหมด `security=full` ร่วมกับ `ask=off` host exec จะทำตามนโยบายที่กำหนดไว้โดยตรง ไม่มีชั้น prefilter เพิ่มเติมสำหรับฮิวริสติกการอำพรางคำสั่งหรือการปฏิเสธ script-preflight
- `tools.exec.node` (ค่าเริ่มต้น: ไม่ได้ตั้งค่า)
- `tools.exec.strictInlineEval` (ค่าเริ่มต้น: false): เมื่อเป็น true รูปแบบ eval ของตัวแปลภาษาแบบ inline เช่น `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, และ `osascript -e` ต้องได้รับการอนุมัติแบบชัดเจนเสมอ `allow-always` ยังสามารถคงการเรียกตัวแปลภาษา/สคริปต์ที่ไม่เป็นอันตรายไว้ได้ แต่รูปแบบ inline-eval ยังจะแจ้งให้อนุมัติทุกครั้ง
- `tools.exec.pathPrepend`: รายการไดเรกทอรีที่จะเติมนำหน้า `PATH` สำหรับการรัน exec (เฉพาะ gateway + sandbox)
- `tools.exec.safeBins`: ไบนารีปลอดภัยแบบ stdin-only ที่รันได้โดยไม่ต้องมีรายการ allowlist แบบชัดเจน สำหรับรายละเอียดพฤติกรรม ดู [Safe bins](/th/tools/exec-approvals-advanced#safe-bins-stdin-only)
- `tools.exec.safeBinTrustedDirs`: ไดเรกทอรีแบบชัดเจนเพิ่มเติมที่เชื่อถือสำหรับการตรวจพาธ `safeBins` รายการ `PATH` จะไม่ถูกเชื่อถือโดยอัตโนมัติ ค่าเริ่มต้นในตัวคือ `/bin` และ `/usr/bin`
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

- `host=gateway`: ผสาน `PATH` ของ login-shell ของคุณเข้าในสภาพแวดล้อม exec การแทนที่ `env.PATH` จะ
  ถูกปฏิเสธสำหรับการทำงานบนโฮสต์ ตัว daemon เองยังคงรันด้วย `PATH` ขั้นต่ำ:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: รัน `sh -lc` (login shell) ภายในคอนเทนเนอร์ ดังนั้น `/etc/profile` อาจรีเซ็ต `PATH`
  OpenClaw เติม `env.PATH` นำหน้าหลังจาก source profile ผ่านตัวแปร env ภายใน (ไม่มี shell interpolation);
  `tools.exec.pathPrepend` ใช้ที่นี่ด้วย
- `host=node`: เฉพาะการแทนที่ env ที่ไม่ถูกบล็อกซึ่งคุณส่งผ่านเท่านั้นที่จะถูกส่งไปยัง Node การแทนที่ `env.PATH` จะ
  ถูกปฏิเสธสำหรับการทำงานบนโฮสต์และถูกละเว้นโดยโฮสต์ Node หากต้องการรายการ PATH เพิ่มเติมบน Node
  ให้กำหนดค่าสภาพแวดล้อมบริการโฮสต์ Node (systemd/launchd) หรือติดตั้งเครื่องมือในตำแหน่งมาตรฐาน

การผูก Node ต่อเอเจนต์ (ใช้ดัชนีรายการเอเจนต์ในการตั้งค่า):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: แท็บ Nodes มีแผง “Exec node binding” ขนาดเล็กสำหรับการตั้งค่าเดียวกัน

## การแทนที่เซสชัน (`/exec`)

ใช้ `/exec` เพื่อตั้งค่าเริ่มต้น **ต่อเซสชัน** สำหรับ `host`, `security`, `ask`, และ `node`
ส่ง `/exec` โดยไม่มีอาร์กิวเมนต์เพื่อแสดงค่าปัจจุบัน

ตัวอย่าง:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## โมเดลการอนุญาต

`/exec` จะมีผลเฉพาะสำหรับ **ผู้ส่งที่ได้รับอนุญาต** (allowlist/การจับคู่ช่องทาง รวมถึง `commands.useAccessGroups`)
โดยอัปเดต **สถานะเซสชันเท่านั้น** และไม่เขียนการตั้งค่า หากต้องการปิดใช้ exec แบบเด็ดขาด ให้ปฏิเสธผ่านนโยบายเครื่องมือ
(`tools.deny: ["exec"]` หรือแบบต่อเอเจนต์) การอนุมัติโฮสต์ยังคงมีผล เว้นแต่คุณจะตั้งค่า
`security=full` และ `ask=off` อย่างชัดเจน

## การอนุมัติ Exec (แอป companion / โฮสต์ Node)

เอเจนต์ใน sandbox สามารถกำหนดให้ต้องได้รับการอนุมัติต่อคำขอก่อนที่ `exec` จะรันบนโฮสต์ gateway หรือ Node
ดู [การอนุมัติ Exec](/th/tools/exec-approvals) สำหรับนโยบาย, allowlist, และโฟลว์ UI

เมื่อจำเป็นต้องมีการอนุมัติ เครื่องมือ exec จะส่งคืนทันทีพร้อม
`status: "approval-pending"` และรหัสการอนุมัติ เมื่ออนุมัติแล้ว (หรือปฏิเสธ / หมดเวลา),
Gateway จะส่งเหตุการณ์ระบบ (`Exec finished` / `Exec denied`) หากคำสั่งยังคง
ทำงานอยู่หลัง `tools.exec.approvalRunningNoticeMs` จะส่งประกาศ `Exec running` หนึ่งครั้ง
บนช่องทางที่มีการ์ด/ปุ่มอนุมัติแบบ native เอเจนต์ควรพึ่งพา
UI native นั้นก่อน และใส่คำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์ของเครื่องมือ
ระบุอย่างชัดเจนว่าการอนุมัติผ่านแชตไม่พร้อมใช้งาน หรือการอนุมัติแบบ manual เป็น
เส้นทางเดียวเท่านั้น

## Allowlist + safe bins

การบังคับใช้ allowlist แบบ manual จับคู่กับ glob ของพาธไบนารีที่ resolve แล้วและ glob ของชื่อคำสั่งเปล่า
ชื่อเปล่าจะจับคู่เฉพาะคำสั่งที่เรียกผ่าน PATH ดังนั้น `rg` จึงจับคู่กับ
`/opt/homebrew/bin/rg` ได้เมื่อคำสั่งคือ `rg` แต่ไม่ใช่ `./rg` หรือ `/tmp/rg`
เมื่อ `security=allowlist` คำสั่งเชลล์จะได้รับอนุญาตโดยอัตโนมัติเฉพาะเมื่อทุก segment ของ pipeline
อยู่ใน allowlist หรือเป็น safe bin การ chain (`;`, `&&`, `||`) และ redirection
จะถูกปฏิเสธในโหมด allowlist เว้นแต่ทุก segment ระดับบนสุดจะเป็นไปตาม
allowlist (รวมถึง safe bins) redirection ยังไม่รองรับ
ความเชื่อถือ `allow-always` แบบคงทนไม่ข้ามกฎนั้น: คำสั่งที่ chain แล้วยังคงต้องให้ทุก
segment ระดับบนสุดจับคู่ได้

`autoAllowSkills` เป็นเส้นทางอำนวยความสะดวกแยกต่างหากในการอนุมัติ exec ไม่เหมือนกับ
รายการ allowlist พาธแบบ manual สำหรับความเชื่อถือแบบชัดเจนและเข้มงวด ให้ปิดใช้ `autoAllowSkills`

ใช้ตัวควบคุมสองรายการนี้สำหรับงานที่ต่างกัน:

- `tools.exec.safeBins`: ตัวกรองสตรีมขนาดเล็กแบบ stdin-only
- `tools.exec.safeBinTrustedDirs`: ไดเรกทอรีเพิ่มเติมแบบชัดเจนที่เชื่อถือสำหรับพาธไฟล์ปฏิบัติการ safe-bin
- `tools.exec.safeBinProfiles`: นโยบาย argv แบบชัดเจนสำหรับ safe bins แบบกำหนดเอง
- allowlist: ความเชื่อถือแบบชัดเจนสำหรับพาธไฟล์ปฏิบัติการ

อย่าถือว่า `safeBins` เป็นรายการอนุญาตทั่วไป และอย่าเพิ่มไบนารีของอินเทอร์พรีเตอร์/รันไทม์ (เช่น `python3`, `node`, `ruby`, `bash`) หากคุณต้องใช้สิ่งเหล่านี้ ให้ใช้รายการอนุญาตแบบเจาะจงและเปิดใช้งานพรอมต์ขออนุมัติไว้
`openclaw security audit` จะเตือนเมื่อรายการ `safeBins` ของอินเทอร์พรีเตอร์/รันไทม์ขาดโปรไฟล์ที่ระบุชัดเจน และ `openclaw doctor --fix` สามารถสร้างโครงรายการ `safeBinProfiles` แบบกำหนดเองที่ขาดหายไปได้
`openclaw security audit` และ `openclaw doctor` จะเตือนด้วยเมื่อคุณเพิ่มไบนารีที่มีพฤติกรรมกว้าง เช่น `jq` กลับเข้าไปใน `safeBins` อย่างชัดเจน
หากคุณอนุญาตอินเทอร์พรีเตอร์อย่างชัดเจน ให้เปิดใช้ `tools.exec.strictInlineEval` เพื่อให้รูปแบบการประเมินโค้ดแบบอินไลน์ยังคงต้องได้รับการอนุมัติใหม่

ดูรายละเอียดนโยบายฉบับเต็มและตัวอย่างได้ที่ [การอนุมัติ Exec](/th/tools/exec-approvals-advanced#safe-bins-stdin-only) และ [Safe bins เทียบกับรายการอนุญาต](/th/tools/exec-approvals-advanced#safe-bins-versus-allowlist)

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

การโพลมีไว้สำหรับสถานะตามคำขอ ไม่ใช่ลูปการรอ หากเปิดใช้งานการปลุกเมื่อเสร็จสิ้นโดยอัตโนมัติ
คำสั่งสามารถปลุกเซสชันได้เมื่อมีเอาต์พุตออกมาหรือล้มเหลว

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

Paste (มีวงเล็บครอบโดยค่าเริ่มต้น):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` เป็นเครื่องมือย่อยของ `exec` สำหรับการแก้ไขหลายไฟล์แบบมีโครงสร้าง
เปิดใช้งานโดยค่าเริ่มต้นสำหรับโมเดล OpenAI และ OpenAI Codex ใช้การกำหนดค่าเฉพาะ
เมื่อคุณต้องการปิดใช้งานหรือจำกัดให้ใช้กับโมเดลที่ระบุเท่านั้น:

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
- นโยบายเครื่องมือยังคงมีผล; `allow: ["write"]` จะอนุญาต `apply_patch` โดยนัย
- การกำหนดค่าอยู่ภายใต้ `tools.exec.applyPatch`
- `tools.exec.applyPatch.enabled` มีค่าเริ่มต้นเป็น `true`; ตั้งค่าเป็น `false` เพื่อปิดใช้งานเครื่องมือนี้สำหรับโมเดล OpenAI
- `tools.exec.applyPatch.workspaceOnly` มีค่าเริ่มต้นเป็น `true` (จำกัดอยู่ใน workspace) ตั้งค่าเป็น `false` เฉพาะเมื่อคุณตั้งใจให้ `apply_patch` เขียน/ลบภายนอกไดเรกทอรี workspace

## ที่เกี่ยวข้อง

- [การอนุมัติ Exec](/th/tools/exec-approvals) — เกตการอนุมัติสำหรับคำสั่งเชลล์
- [Sandboxing](/th/gateway/sandboxing) — การรันคำสั่งในสภาพแวดล้อมแบบ sandbox
- [กระบวนการเบื้องหลัง](/th/gateway/background-process) — exec ที่รันยาวนานและเครื่องมือ process
- [ความปลอดภัย](/th/gateway/security) — นโยบายเครื่องมือและการเข้าถึงแบบยกระดับ
