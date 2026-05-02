---
read_when:
    - การใช้หรือแก้ไขเครื่องมือ exec
    - การดีบักพฤติกรรมของ stdin หรือ TTY
summary: การใช้งานเครื่องมือ Exec, โหมด stdin และการรองรับ TTY
title: เครื่องมือดำเนินการคำสั่ง
x-i18n:
    generated_at: "2026-05-02T22:23:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67d2847f70142b326f527a79ffddab1015b897e8ec4d7ce4557430e57fe0956a
    source_path: tools/exec.md
    workflow: 16
---

เรียกใช้คำสั่งเชลล์ในเวิร์กสเปซ รองรับการทำงานแบบ foreground + background ผ่าน `process`
หากไม่อนุญาตให้ใช้ `process` `exec` จะทำงานแบบซิงโครนัสและจะละเว้น `yieldMs`/`background`
เซสชัน background จะถูกจำกัดขอบเขตต่อเอเจนต์; `process` จะเห็นเฉพาะเซสชันจากเอเจนต์เดียวกันเท่านั้น

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
ส่งคำสั่งไปทำงานแบบ background อัตโนมัติหลังจากหน่วงเวลานี้ (ms)
</ParamField>

<ParamField path="background" type="boolean" default="false">
ส่งคำสั่งไปทำงานแบบ background ทันทีแทนการรอ `yieldMs`
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
แทนที่ timeout ของ exec ที่กำหนดค่าไว้สำหรับการเรียกนี้ ตั้ง `timeout: 0` เฉพาะเมื่อคำสั่งควรทำงานโดยไม่มี timeout ของกระบวนการ exec
</ParamField>

<ParamField path="pty" type="boolean" default="false">
เรียกใช้ใน pseudo-terminal เมื่อพร้อมใช้งาน ใช้สำหรับ CLI ที่ต้องใช้ TTY เท่านั้น, เอเจนต์เขียนโค้ด และ UI เทอร์มินัล
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
ตำแหน่งที่จะเรียกใช้ `auto` จะแก้เป็น `sandbox` เมื่อมี sandbox runtime ทำงานอยู่ และเป็น `gateway` ในกรณีอื่น
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
โหมดการบังคับใช้งานสำหรับการทำงานแบบ `gateway` / `node`
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
พฤติกรรมพรอมป์ขออนุมัติสำหรับการทำงานแบบ `gateway` / `node`
</ParamField>

<ParamField path="node" type="string">
ID/ชื่อ Node เมื่อ `host=node`
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
ร้องขอโหมด elevated — ออกจาก sandbox ไปยังพาธโฮสต์ที่กำหนดค่าไว้ `security=full` จะถูกบังคับใช้เฉพาะเมื่อ elevated แก้เป็น `full`
</ParamField>

หมายเหตุ:

- `host` มีค่าเริ่มต้นเป็น `auto`: sandbox เมื่อมี sandbox runtime ทำงานอยู่สำหรับเซสชัน มิฉะนั้นเป็น gateway
- `host` รับได้เฉพาะ `auto`, `sandbox`, `gateway` หรือ `node` เท่านั้น ไม่ใช่ตัวเลือก hostname; ค่าที่ดูเหมือน hostname จะถูกปฏิเสธก่อนคำสั่งเริ่มทำงาน
- `auto` คือกลยุทธ์การกำหนดเส้นทางเริ่มต้น ไม่ใช่ wildcard อนุญาตให้ใช้ `host=node` ต่อการเรียกจาก `auto`; อนุญาตให้ใช้ `host=gateway` ต่อการเรียกเฉพาะเมื่อไม่มี sandbox runtime ทำงานอยู่
- หากไม่มีการกำหนดค่าเพิ่มเติม `host=auto` ยัง "ใช้งานได้ทันที": หากไม่มี sandbox จะแก้เป็น `gateway`; หากมี sandbox ที่ทำงานอยู่จะคงอยู่ใน sandbox
- `elevated` ออกจาก sandbox ไปยังพาธโฮสต์ที่กำหนดค่าไว้: ค่าเริ่มต้นคือ `gateway` หรือ `node` เมื่อ `tools.exec.host=node` (หรือค่าเริ่มต้นของเซสชันคือ `host=node`) ใช้ได้เฉพาะเมื่อมีการเปิดใช้สิทธิ์ elevated สำหรับเซสชัน/ผู้ให้บริการปัจจุบัน
- การอนุมัติ `gateway`/`node` ถูกควบคุมโดย `~/.openclaw/exec-approvals.json`
- `node` ต้องมี node ที่จับคู่ไว้ (แอป companion หรือ headless node host)
- หากมีหลาย node ให้ตั้ง `exec.node` หรือ `tools.exec.node` เพื่อเลือกหนึ่งรายการ
- `exec host=node` คือเส้นทางการเรียกใช้เชลล์เพียงเส้นทางเดียวสำหรับ node; wrapper เดิม `nodes.run` ถูกลบออกแล้ว
- `timeout` ใช้กับ foreground, background, `yieldMs`, gateway, sandbox และการทำงาน `system.run` ของ node หากละไว้ OpenClaw จะใช้ `tools.exec.timeoutSec`; `timeout: 0` ที่ระบุอย่างชัดเจนจะปิดใช้งาน timeout ของกระบวนการ exec สำหรับการเรียกนั้น
- บนโฮสต์ที่ไม่ใช่ Windows exec จะใช้ `SHELL` เมื่อมีการตั้งค่าไว้; หาก `SHELL` เป็น `fish` จะเลือกใช้ `bash` (หรือ `sh`)
  จาก `PATH` ก่อนเพื่อหลีกเลี่ยงสคริปต์ที่เข้ากันไม่ได้กับ fish แล้วจึง fallback ไปที่ `SHELL` หากไม่มีทั้งสองรายการ
- บนโฮสต์ Windows exec จะเลือกค้นหา PowerShell 7 (`pwsh`) ก่อน (Program Files, ProgramW6432 แล้วจึง PATH),
  จากนั้น fallback ไปที่ Windows PowerShell 5.1
- การทำงานบนโฮสต์ (`gateway`/`node`) จะปฏิเสธ `env.PATH` และการแทนที่ loader (`LD_*`/`DYLD_*`) เพื่อ
  ป้องกันการ hijack ไบนารีหรือโค้ดที่ถูกฉีดเข้ามา
- OpenClaw ตั้ง `OPENCLAW_SHELL=exec` ในสภาพแวดล้อมของคำสั่งที่ spawn ขึ้นมา (รวมถึงการทำงานแบบ PTY และ sandbox) เพื่อให้กฎของ shell/profile ตรวจพบบริบทของเครื่องมือ exec
- `openclaw channels login` ถูกบล็อกจาก `exec` เพราะเป็นโฟลว์ยืนยันตัวตนของช่องทางแบบโต้ตอบ; ให้เรียกใช้ในเทอร์มินัลบนโฮสต์ Gateway หรือใช้เครื่องมือเข้าสู่ระบบแบบเนทีฟของช่องทางจากแชตเมื่อมีให้ใช้
- สำคัญ: sandboxing **ปิดโดยค่าเริ่มต้น** หาก sandboxing ปิดอยู่ `host=auto` โดยนัย
  จะแก้เป็น `gateway` ส่วน `host=sandbox` ที่ระบุชัดเจนจะยังคง fail closed แทนที่จะ
  ทำงานบนโฮสต์ Gateway อย่างเงียบ ๆ เปิดใช้ sandboxing หรือใช้ `host=gateway` พร้อมการอนุมัติ
- การตรวจสอบ preflight ของสคริปต์ (สำหรับข้อผิดพลาดไวยากรณ์เชลล์ Python/Node ที่พบบ่อย) จะตรวจเฉพาะไฟล์ภายใน
  ขอบเขต `workdir` ที่มีผลเท่านั้น หากพาธสคริปต์แก้ไปอยู่นอก `workdir` preflight จะถูกข้ามสำหรับ
  ไฟล์นั้น
- สำหรับงานที่ใช้เวลานานและเริ่มตอนนี้ ให้เริ่มครั้งเดียวและพึ่งพาการปลุกเมื่อเสร็จสิ้นโดยอัตโนมัติ
  เมื่อเปิดใช้งานและคำสั่งปล่อย output หรือทำงานล้มเหลว
  ใช้ `process` สำหรับ log, สถานะ, input หรือการแทรกแซง; อย่าจำลอง
  การตั้งเวลาด้วยลูป sleep, ลูป timeout หรือการ polling ซ้ำ ๆ
- สำหรับงานที่ควรเกิดขึ้นภายหลังหรือตามกำหนดเวลา ให้ใช้ cron แทนรูปแบบ sleep/delay ของ
  `exec`

## การกำหนดค่า

- `tools.exec.notifyOnExit` (ค่าเริ่มต้น: true): เมื่อเป็น true เซสชัน exec ที่ถูกส่งไป background จะเพิ่ม system event เข้าคิวและร้องขอ Heartbeat เมื่อออก
- `tools.exec.approvalRunningNoticeMs` (ค่าเริ่มต้น: 10000): ส่งประกาศ “running” ครั้งเดียวเมื่อ exec ที่ถูกกั้นด้วยการอนุมัติทำงานนานกว่านี้ (0 คือปิดใช้งาน)
- `tools.exec.timeoutSec` (ค่าเริ่มต้น: 1800): timeout เริ่มต้นของ exec ต่อคำสั่งเป็นวินาที `timeout` ต่อการเรียกจะแทนที่ค่านี้; `timeout: 0` ต่อการเรียกจะปิดใช้งาน timeout ของกระบวนการ exec
- `tools.exec.host` (ค่าเริ่มต้น: `auto`; แก้เป็น `sandbox` เมื่อ sandbox runtime ทำงานอยู่ และเป็น `gateway` ในกรณีอื่น)
- `tools.exec.security` (ค่าเริ่มต้น: `deny` สำหรับ sandbox, `full` สำหรับ gateway + node เมื่อไม่ได้ตั้งค่า)
- `tools.exec.ask` (ค่าเริ่มต้น: `off`)
- exec บนโฮสต์โดยไม่ต้องอนุมัติเป็นค่าเริ่มต้นสำหรับ gateway + node หากต้องการพฤติกรรมแบบ approvals/allowlist ให้ปรับทั้ง `tools.exec.*` และ `~/.openclaw/exec-approvals.json` ของโฮสต์ให้เข้มงวดขึ้น; ดู [การอนุมัติ Exec](/th/tools/exec-approvals#yolo-mode-no-approval)
- YOLO มาจากค่าเริ่มต้นของนโยบายโฮสต์ (`security=full`, `ask=off`) ไม่ได้มาจาก `host=auto` หากต้องการบังคับการกำหนดเส้นทางไป gateway หรือ node ให้ตั้ง `tools.exec.host` หรือใช้ `/exec host=...`
- ในโหมด `security=full` พร้อม `ask=off` host exec จะทำตามนโยบายที่กำหนดค่าไว้โดยตรง; ไม่มีชั้น prefilter แบบ heuristic สำหรับคำสั่งที่ถูก obfuscate หรือชั้นปฏิเสธ script-preflight เพิ่มเติม
- `tools.exec.node` (ค่าเริ่มต้น: ไม่ได้ตั้งค่า)
- `tools.exec.strictInlineEval` (ค่าเริ่มต้น: false): เมื่อเป็น true รูปแบบ inline interpreter eval เช่น `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` และ `osascript -e` จะต้องมีการอนุมัติที่ชัดเจนเสมอ `allow-always` ยังสามารถบันทึกการเรียก interpreter/script ที่ปลอดภัยไว้ถาวรได้ แต่รูปแบบ inline-eval จะยังคงพรอมป์ทุกครั้ง
- `tools.exec.pathPrepend`: รายการไดเรกทอรีที่จะเติมไว้หน้าค่า `PATH` สำหรับการเรียก exec (เฉพาะ gateway + sandbox)
- `tools.exec.safeBins`: ไบนารีปลอดภัยแบบ stdin-only ที่ทำงานได้โดยไม่ต้องมีรายการ allowlist ที่ชัดเจน สำหรับรายละเอียดพฤติกรรม ดู [Safe bins](/th/tools/exec-approvals-advanced#safe-bins-stdin-only)
- `tools.exec.safeBinTrustedDirs`: ไดเรกทอรีเพิ่มเติมที่เชื่อถืออย่างชัดเจนสำหรับการตรวจพาธ `safeBins` รายการ `PATH` จะไม่ถูกเชื่อถือโดยอัตโนมัติ ค่าเริ่มต้นในตัวคือ `/bin` และ `/usr/bin`
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

- `host=gateway`: ผสาน `PATH` ของ login-shell ของคุณเข้าไปในสภาพแวดล้อม exec การแทนที่ `env.PATH` จะ
  ถูกปฏิเสธสำหรับการทำงานบนโฮสต์ daemon เองยังคงทำงานด้วย `PATH` ขั้นต่ำ:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: เรียกใช้ `sh -lc` (login shell) ภายในคอนเทนเนอร์ ดังนั้น `/etc/profile` อาจรีเซ็ต `PATH`
  OpenClaw เติม `env.PATH` ไว้ข้างหน้าหลังจาก sourcing profile ผ่าน env var ภายใน (ไม่มี shell interpolation);
  `tools.exec.pathPrepend` ใช้ที่นี่ด้วย
- `host=node`: จะส่งเฉพาะการแทนที่ env ที่คุณส่งมาและไม่ถูกบล็อกไปยัง node การแทนที่ `env.PATH` จะ
  ถูกปฏิเสธสำหรับการทำงานบนโฮสต์และถูกละเว้นโดย node host หากคุณต้องการรายการ PATH เพิ่มเติมบน node
  ให้กำหนดค่าสภาพแวดล้อมของบริการ node host (systemd/launchd) หรือติดตั้งเครื่องมือในตำแหน่งมาตรฐาน

การผูก node ต่อเอเจนต์ (ใช้ดัชนีรายการเอเจนต์ใน config):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: แท็บ Nodes มีแผง “Exec node binding” ขนาดเล็กสำหรับการตั้งค่าเดียวกัน

## การแทนที่ของเซสชัน (`/exec`)

ใช้ `/exec` เพื่อตั้งค่าเริ่มต้น **ต่อเซสชัน** สำหรับ `host`, `security`, `ask` และ `node`
ส่ง `/exec` โดยไม่มีอาร์กิวเมนต์เพื่อแสดงค่าปัจจุบัน

ตัวอย่าง:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## โมเดลการอนุญาต

`/exec` จะถูกยอมรับเฉพาะสำหรับ **ผู้ส่งที่ได้รับอนุญาต** (allowlists/การจับคู่ของช่องทาง พร้อม `commands.useAccessGroups`)
โดยจะอัปเดต **สถานะของเซสชันเท่านั้น** และไม่เขียน config หากต้องการปิด exec อย่างเด็ดขาด ให้ deny ผ่านนโยบายเครื่องมือ
(`tools.deny: ["exec"]` หรือรายเอเจนต์) การอนุมัติของโฮสต์ยังคงมีผล เว้นแต่คุณจะตั้ง
`security=full` และ `ask=off` อย่างชัดเจน

## การอนุมัติ Exec (แอป companion / node host)

เอเจนต์ที่อยู่ใน sandbox สามารถกำหนดให้ต้องมีการอนุมัติต่อคำขอก่อนที่ `exec` จะทำงานบนโฮสต์ gateway หรือ node
ดู [การอนุมัติ Exec](/th/tools/exec-approvals) สำหรับนโยบาย, allowlist และโฟลว์ UI

เมื่อจำเป็นต้องมีการอนุมัติ เครื่องมือ exec จะส่งคืนทันทีพร้อม
`status: "approval-pending"` และ approval id เมื่อได้รับอนุมัติแล้ว (หรือถูกปฏิเสธ / หมดเวลา)
Gateway จะส่ง system events (`Exec finished` / `Exec denied`) หากคำสั่งยังคง
ทำงานหลังจาก `tools.exec.approvalRunningNoticeMs` จะมีการส่งประกาศ `Exec running` หนึ่งครั้ง
บนช่องทางที่มีการ์ด/ปุ่มอนุมัติแบบเนทีฟ เอเจนต์ควรพึ่งพา
UI เนทีฟนั้นก่อน และใส่คำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์ของเครื่องมือ
ระบุอย่างชัดเจนว่าไม่สามารถใช้การอนุมัติผ่านแชตได้ หรือการอนุมัติแบบ manual เป็น
เส้นทางเดียวเท่านั้น

## Allowlist + safe bins

การบังคับใช้ allowlist แบบ manual จะจับคู่ glob ของพาธไบนารีที่ resolve แล้วและ glob ของชื่อคำสั่งล้วน
ชื่อล้วนจะจับคู่เฉพาะคำสั่งที่เรียกผ่าน PATH ดังนั้น `rg` สามารถจับคู่กับ
`/opt/homebrew/bin/rg` เมื่อคำสั่งคือ `rg` แต่ไม่ใช่ `./rg` หรือ `/tmp/rg`
เมื่อ `security=allowlist` คำสั่งเชลล์จะถูกอนุญาตอัตโนมัติเฉพาะเมื่อทุก segment ของ pipeline
อยู่ใน allowlist หรือเป็น safe bin การ chaining (`;`, `&&`, `||`) และ redirections
จะถูกปฏิเสธในโหมด allowlist เว้นแต่ว่าทุก segment ระดับบนสุดเป็นไปตาม
allowlist (รวมถึง safe bins) redirections ยังคงไม่รองรับ
ความเชื่อถือ `allow-always` แบบถาวรไม่ข้ามกฎนั้น: คำสั่งที่ chain ยังต้องให้ทุก
segment ระดับบนสุดจับคู่ได้

`autoAllowSkills` เป็นเส้นทางอำนวยความสะดวกแยกต่างหากในการอนุมัติ exec ไม่เหมือนกับ
รายการ allowlist ของพาธแบบ manual สำหรับความเชื่อถือที่ชัดเจนอย่างเข้มงวด ให้ปิดใช้ `autoAllowSkills`

ใช้ตัวควบคุมสองอย่างสำหรับงานที่ต่างกัน:

- `tools.exec.safeBins`: ตัวกรองสตรีมขนาดเล็กแบบ stdin-only
- `tools.exec.safeBinTrustedDirs`: ไดเรกทอรีที่เชื่อถือเพิ่มเติมอย่างชัดเจนสำหรับพาธ executable ของ safe-bin
- `tools.exec.safeBinProfiles`: นโยบาย argv ที่ชัดเจนสำหรับ safe bins แบบกำหนดเอง
- allowlist: ความเชื่อถือที่ชัดเจนสำหรับพาธ executable

อย่าถือว่า `safeBins` เป็นรายการอนุญาตทั่วไป และอย่าเพิ่มไบนารีของอินเทอร์พรีเตอร์/รันไทม์ (เช่น `python3`, `node`, `ruby`, `bash`) หากคุณต้องใช้สิ่งเหล่านั้น ให้ใช้รายการอนุญาตแบบระบุชัดเจนและเปิดใช้พรอมป์อนุมัติไว้
`openclaw security audit` จะเตือนเมื่อรายการ `safeBins` ของอินเทอร์พรีเตอร์/รันไทม์ขาดโปรไฟล์ที่ระบุชัดเจน และ `openclaw doctor --fix` สามารถสร้างโครงร่างรายการ `safeBinProfiles` แบบกำหนดเองที่ขาดหายได้
`openclaw security audit` และ `openclaw doctor` จะเตือนด้วยเมื่อคุณเพิ่มไบนารีที่มีพฤติกรรมกว้าง เช่น `jq` กลับเข้าไปใน `safeBins` อย่างชัดเจน
หากคุณอนุญาตอินเทอร์พรีเตอร์อย่างชัดเจน ให้เปิดใช้ `tools.exec.strictInlineEval` เพื่อให้รูปแบบ eval โค้ดแบบอินไลน์ยังคงต้องได้รับการอนุมัติใหม่

สำหรับรายละเอียดนโยบายฉบับเต็มและตัวอย่าง โปรดดู [การอนุมัติ Exec](/th/tools/exec-approvals-advanced#safe-bins-stdin-only) และ [Safe bins เทียบกับรายการอนุญาต](/th/tools/exec-approvals-advanced#safe-bins-versus-allowlist)

## ตัวอย่าง

โฟร์กราวด์:

```json
{ "tool": "exec", "command": "ls -la" }
```

แบ็กกราวด์ + โพล:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

การโพลใช้สำหรับดูสถานะตามต้องการ ไม่ใช่ลูปรอ หากเปิดใช้การปลุกเมื่อเสร็จสิ้นโดยอัตโนมัติ
คำสั่งสามารถปลุกเซสชันเมื่อมีเอาต์พุตหรือเมื่อคำสั่งล้มเหลว

ส่งคีย์ (สไตล์ tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

ส่งคำสั่ง (ส่งเฉพาะ CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

วาง (ใช้ bracketed เป็นค่าเริ่มต้น):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` เป็นเครื่องมือย่อยของ `exec` สำหรับการแก้ไขหลายไฟล์แบบมีโครงสร้าง
เปิดใช้งานเป็นค่าเริ่มต้นสำหรับโมเดล OpenAI และ OpenAI Codex ใช้การกำหนดค่าเฉพาะ
เมื่อคุณต้องการปิดใช้งานหรือจำกัดให้ใช้กับโมเดลเฉพาะ:

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
- นโยบายเครื่องมือยังคงมีผลอยู่; `allow: ["write"]` จะอนุญาต `apply_patch` โดยปริยาย
- การกำหนดค่าอยู่ภายใต้ `tools.exec.applyPatch`
- `tools.exec.applyPatch.enabled` มีค่าเริ่มต้นเป็น `true`; ตั้งค่าเป็น `false` เพื่อปิดใช้งานเครื่องมือนี้สำหรับโมเดล OpenAI
- `tools.exec.applyPatch.workspaceOnly` มีค่าเริ่มต้นเป็น `true` (จำกัดอยู่ในเวิร์กสเปซ) ตั้งค่าเป็น `false` เฉพาะเมื่อคุณตั้งใจให้ `apply_patch` เขียน/ลบภายนอกไดเรกทอรีเวิร์กสเปซเท่านั้น

## ที่เกี่ยวข้อง

- [การอนุมัติ Exec](/th/tools/exec-approvals) — เกตการอนุมัติสำหรับคำสั่งเชลล์
- [การทำ Sandbox](/th/gateway/sandboxing) — การรันคำสั่งในสภาพแวดล้อมแบบ sandbox
- [กระบวนการเบื้องหลัง](/th/gateway/background-process) — exec ที่รันเป็นเวลานานและเครื่องมือ process
- [ความปลอดภัย](/th/gateway/security) — นโยบายเครื่องมือและสิทธิ์เข้าถึงแบบยกระดับ
