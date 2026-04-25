---
read_when:
    - การใช้งานหรือการแก้ไขเครื่องมือ exec
    - การดีบักพฤติกรรมของ stdin หรือ TTY
summary: การใช้งานเครื่องมือ exec, โหมด stdin และการรองรับ TTY
title: เครื่องมือ exec
x-i18n:
    generated_at: "2026-04-25T14:00:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 358f9155120382fa2b03b22e22408bdb9e51715f80c8b1701a1ff7fd05850188
    source_path: tools/exec.md
    workflow: 15
---

รันคำสั่ง shell ใน workspace รองรับทั้งการทำงานแบบ foreground และ background ผ่าน `process`
หากไม่อนุญาต `process` thì `exec` จะรันแบบ synchronous และไม่สนใจ `yieldMs`/`background`
session แบบ background ถูกจำกัดขอบเขตตาม agent; `process` จะเห็นเฉพาะ session จาก agent เดียวกันเท่านั้น

## พารามิเตอร์

<ParamField path="command" type="string" required>
คำสั่ง shell ที่จะรัน
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
ไดเรกทอรีทำงานสำหรับคำสั่ง
</ParamField>

<ParamField path="env" type="object">
การ override environment แบบ key/value ซึ่งจะถูกรวมทับบน inherited environment
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
ย้ายคำสั่งไปทำงานแบบ background อัตโนมัติหลังจากหน่วงเวลานี้ (ms)
</ParamField>

<ParamField path="background" type="boolean" default="false">
ให้คำสั่งทำงานแบบ background ทันทีแทนที่จะรอ `yieldMs`
</ParamField>

<ParamField path="timeout" type="number" default="1800">
ยุติคำสั่งหลังจากครบจำนวนวินาทีนี้
</ParamField>

<ParamField path="pty" type="boolean" default="false">
รันใน pseudo-terminal เมื่อมีให้ใช้ ใช้สำหรับ CLI ที่ต้องใช้ TTY เท่านั้น coding agents และ TUI
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
ตำแหน่งที่จะรัน `auto` จะ resolve เป็น `sandbox` เมื่อมี sandbox runtime ที่ active และเป็น `gateway` ในกรณีอื่น
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
โหมดการบังคับใช้นโยบายสำหรับการรันแบบ `gateway` / `node`
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
พฤติกรรมการขออนุมัติสำหรับการรันแบบ `gateway` / `node`
</ParamField>

<ParamField path="node" type="string">
Node id/name เมื่อ `host=node`
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
ขอโหมด elevated — ออกจาก sandbox ไปยังเส้นทาง host ที่กำหนดไว้ `security=full` จะถูกบังคับใช้เฉพาะเมื่อ elevated resolve เป็น `full`
</ParamField>

หมายเหตุ:

- `host` มีค่าเริ่มต้นเป็น `auto`: เป็น sandbox เมื่อมี sandbox runtime ที่ active สำหรับ session มิฉะนั้นเป็น gateway
- `auto` คือกลยุทธ์การกำหนดเส้นทางเริ่มต้น ไม่ใช่ wildcard สามารถใช้ `host=node` ต่อการเรียกจาก `auto` ได้; ส่วน `host=gateway` ต่อการเรียกจะอนุญาตเฉพาะเมื่อไม่มี sandbox runtime ที่ active
- หากไม่มี config เพิ่มเติม `host=auto` ก็ยัง “ใช้งานได้เลย”: ถ้าไม่มี sandbox จะ resolve เป็น `gateway`; ถ้ามี sandbox ที่กำลังทำงานอยู่ก็จะอยู่ใน sandbox
- `elevated` จะออกจาก sandbox ไปยังเส้นทาง host ที่กำหนดไว้: โดยค่าเริ่มต้นคือ `gateway` หรือเป็น `node` เมื่อ `tools.exec.host=node` (หรือค่าเริ่มต้นของ session เป็น `host=node`) ใช้ได้เฉพาะเมื่อเปิดใช้งาน elevated access สำหรับ session/provider ปัจจุบัน
- การอนุมัติสำหรับ `gateway`/`node` ถูกควบคุมโดย `~/.openclaw/exec-approvals.json`
- `node` ต้องมี Node ที่จับคู่ไว้ (companion app หรือโฮสต์ Node แบบ headless)
- หากมีหลาย Node ให้ตั้ง `exec.node` หรือ `tools.exec.node` เพื่อเลือกหนึ่งตัว
- `exec host=node` คือเส้นทางเดียวสำหรับการรัน shell บน Node; wrapper แบบเดิม `nodes.run` ถูกนำออกแล้ว
- บนโฮสต์ที่ไม่ใช่ Windows, exec จะใช้ `SHELL` เมื่อมีการตั้งค่าไว้; หาก `SHELL` เป็น `fish` จะเลือก `bash` (หรือ `sh`)
  จาก `PATH` ก่อนเพื่อหลีกเลี่ยงสคริปต์ที่ไม่เข้ากันกับ fish แล้วจึง fallback ไปใช้ `SHELL` หากไม่พบทั้งคู่
- บนโฮสต์ Windows, exec จะเลือกค้นหา PowerShell 7 (`pwsh`) ก่อน (Program Files, ProgramW6432 แล้วจึง PATH)
  จากนั้นจึง fallback ไปยัง Windows PowerShell 5.1
- การรันบน host (`gateway`/`node`) จะปฏิเสธ `env.PATH` และการ override ตัวโหลด (`LD_*`/`DYLD_*`) เพื่อ
  ป้องกันการ hijack ไบนารีหรือการฉีดโค้ด
- OpenClaw จะตั้ง `OPENCLAW_SHELL=exec` ใน environment ของคำสั่งที่ถูก spawn (รวมถึง PTY และการรันใน sandbox) เพื่อให้กฎของ shell/profile สามารถตรวจจับบริบทของเครื่องมือ exec ได้
- สำคัญ: sandboxing **ปิดอยู่โดยค่าเริ่มต้น** หาก sandboxing ปิดอยู่ `host=auto`
  แบบ implicit จะ resolve เป็น `gateway` ส่วน `host=sandbox` แบบ explicit จะยัง fail closed แทนที่จะรันบนโฮสต์ gateway แบบเงียบ ๆ
  ให้เปิด sandboxing หรือใช้ `host=gateway` พร้อม approvals
- การตรวจสอบ preflight ของสคริปต์ (สำหรับข้อผิดพลาด syntax ของ shell ที่พบบ่อยใน Python/Node) จะตรวจเฉพาะไฟล์ภายใน
  ขอบเขต `workdir` ที่มีผลจริงเท่านั้น หาก path ของสคริปต์ resolve ออกนอก `workdir` การตรวจ preflight จะถูกข้าม
  สำหรับไฟล์นั้น
- สำหรับงานที่ใช้เวลานานและเริ่มตอนนี้ ให้เริ่มมันครั้งเดียวและพึ่งการปลุกเมื่อเสร็จอัตโนมัติ
  เมื่อเปิดใช้งานอยู่และคำสั่งมีเอาต์พุตหรือล้มเหลว
  ใช้ `process` สำหรับ logs, สถานะ, อินพุต หรือการแทรกแซง; อย่าจำลอง
  การตั้งเวลาด้วย sleep loops, timeout loops หรือ repeated polling
- สำหรับงานที่ควรเกิดขึ้นภายหลังหรือตามกำหนดเวลา ให้ใช้ Cron แทน
  รูปแบบ sleep/delay ของ `exec`

## Config

- `tools.exec.notifyOnExit` (ค่าเริ่มต้น: true): เมื่อเป็น true session exec ที่ทำงานแบบ background จะเพิ่ม system event เข้าคิวและร้องขอ Heartbeat เมื่อออก
- `tools.exec.approvalRunningNoticeMs` (ค่าเริ่มต้น: 10000): ส่ง notice “running” หนึ่งครั้งเมื่อ exec ที่ต้องอนุมัติทำงานนานเกินเวลานี้ (0 คือปิด)
- `tools.exec.host` (ค่าเริ่มต้น: `auto`; จะ resolve เป็น `sandbox` เมื่อมี sandbox runtime ที่ active มิฉะนั้นเป็น `gateway`)
- `tools.exec.security` (ค่าเริ่มต้น: `deny` สำหรับ sandbox, `full` สำหรับ gateway + node เมื่อไม่ได้ตั้งค่า)
- `tools.exec.ask` (ค่าเริ่มต้น: `off`)
- host exec แบบไม่ต้องอนุมัติเป็นค่าเริ่มต้นสำหรับ gateway + node หากคุณต้องการพฤติกรรม approvals/allowlist ให้เข้มงวดทั้ง `tools.exec.*` และนโยบาย host ที่ `~/.openclaw/exec-approvals.json`; ดู [Exec approvals](/th/tools/exec-approvals#no-approval-yolo-mode)
- YOLO มาจากค่าเริ่มต้นของนโยบาย host (`security=full`, `ask=off`) ไม่ได้มาจาก `host=auto` หากคุณต้องการบังคับเส้นทางไป gateway หรือ node ให้ตั้ง `tools.exec.host` หรือใช้ `/exec host=...`
- ในโหมด `security=full` ร่วมกับ `ask=off`, host exec จะทำตามนโยบายที่กำหนดไว้โดยตรง; ไม่มีชั้น prefilter เพิ่มเติมสำหรับการอำพรางคำสั่งหรือชั้นปฏิเสธ script-preflight เพิ่มเติม
- `tools.exec.node` (ค่าเริ่มต้น: ไม่ได้ตั้งค่า)
- `tools.exec.strictInlineEval` (ค่าเริ่มต้น: false): เมื่อเป็น true รูปแบบ eval inline ของ interpreter เช่น `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` และ `osascript -e` จะต้องได้รับการอนุมัติแบบ explicit เสมอ `allow-always` ยังสามารถบันทึกความเชื่อถือสำหรับการเรียก interpreter/script ที่ไม่เป็นอันตรายได้ แต่รูปแบบ inline-eval จะยังถามทุกครั้ง
- `tools.exec.pathPrepend`: รายการไดเรกทอรีที่จะเติมไว้หน้าสุดของ `PATH` สำหรับการรัน exec (เฉพาะ gateway + sandbox)
- `tools.exec.safeBins`: ไบนารีที่ปลอดภัยแบบ stdin-only ซึ่งสามารถรันได้โดยไม่ต้องมีรายการ allowlist แบบ explicit สำหรับรายละเอียดพฤติกรรม ดู [Safe bins](/th/tools/exec-approvals-advanced#safe-bins-stdin-only)
- `tools.exec.safeBinTrustedDirs`: ไดเรกทอรีเพิ่มเติมแบบ explicit ที่เชื่อถือได้สำหรับการตรวจสอบ path ของ executable ใน `safeBins` รายการใน `PATH` จะไม่ถูกเชื่อถือโดยอัตโนมัติ ค่าเริ่มต้นที่มีมาให้คือ `/bin` และ `/usr/bin`
- `tools.exec.safeBinProfiles`: นโยบาย argv แบบกำหนดเองต่อ safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`)

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

- `host=gateway`: รวม `PATH` ของ login shell ของคุณเข้ากับ environment ของ exec การ override `env.PATH`
  จะถูกปฏิเสธสำหรับการรันบน host อย่างไรก็ตาม daemon เองยังรันด้วย `PATH` แบบขั้นต่ำ:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: รัน `sh -lc` (login shell) ภายใน container ดังนั้น `/etc/profile` อาจรีเซ็ต `PATH`
  OpenClaw จะเติม `env.PATH` ไว้ด้านหน้าหลังจาก source profile ผ่าน internal env var (ไม่มี shell interpolation);
  `tools.exec.pathPrepend` ก็มีผลที่นี่ด้วย
- `host=node`: จะส่งเฉพาะ env override ที่คุณส่งมาและไม่ถูกบล็อกไปยัง Node การ override `env.PATH`
  จะถูกปฏิเสธสำหรับการรันบน host และถูกละเลยโดยโฮสต์ Node หากคุณต้องการเพิ่ม PATH entries บน Node
  ให้กำหนด environment ของบริการโฮสต์ Node (systemd/launchd) หรือติดตั้งเครื่องมือไว้ในตำแหน่งมาตรฐาน

การผูก Node ต่อ agent (ใช้ดัชนีในรายการ agent ของ config):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: แท็บ Nodes มีแผง “Exec node binding” ขนาดเล็กสำหรับการตั้งค่าเดียวกันนี้

## การ override ระดับ session (`/exec`)

ใช้ `/exec` เพื่อตั้งค่าเริ่มต้น **ต่อ session** สำหรับ `host`, `security`, `ask` และ `node`
ส่ง `/exec` โดยไม่มีอาร์กิวเมนต์เพื่อแสดงค่าปัจจุบัน

ตัวอย่าง:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## โมเดลการอนุญาต

`/exec` จะมีผลเฉพาะกับ **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น (channel allowlists/pairing ร่วมกับ `commands.useAccessGroups`)
โดยจะอัปเดต **เฉพาะสถานะของ session** และจะไม่เขียน config หากต้องการปิดใช้งาน exec แบบถาวร ให้ปฏิเสธผ่าน
นโยบายเครื่องมือ (`tools.deny: ["exec"]` หรือกำหนดต่อ agent) การอนุมัติบน host จะยังคงมีผล เว้นแต่คุณจะตั้ง `security=full` และ `ask=off` อย่างชัดเจน

## Exec approvals (companion app / โฮสต์ Node)

Agents ที่อยู่ใน sandbox สามารถกำหนดให้ต้องได้รับการอนุมัติต่อคำขอก่อนที่ `exec` จะรันบน gateway หรือโฮสต์ Node
ดู [Exec approvals](/th/tools/exec-approvals) สำหรับนโยบาย, allowlist และ flow ใน UI

เมื่อจำเป็นต้องได้รับการอนุมัติ เครื่องมือ exec จะตอบกลับทันทีพร้อม
`status: "approval-pending"` และ approval id เมื่อได้รับการอนุมัติแล้ว (หรือถูกปฏิเสธ / หมดเวลา)
Gateway จะส่ง system events (`Exec finished` / `Exec denied`) หากคำสั่งยังคง
ทำงานอยู่หลัง `tools.exec.approvalRunningNoticeMs` จะมี notice `Exec running` ถูกส่งเพียงครั้งเดียว
บน channel ที่มี cards/buttons สำหรับอนุมัติแบบเนทีฟ agent ควรพึ่งพา
UI แบบเนทีฟนั้นก่อน และควรใส่คำสั่ง `/approve` แบบ manual ก็ต่อเมื่อผลลัพธ์จากเครื่องมือ
ระบุชัดเจนว่า chat approvals ใช้งานไม่ได้หรือการอนุมัติแบบ manual เป็น
เส้นทางเดียวเท่านั้น

## Allowlist + safe bins

การบังคับใช้ allowlist แบบ manual จะจับคู่กับ glob ของ path ไบนารีที่ resolve แล้วและ glob ของชื่อคำสั่งเปล่า
ชื่อเปล่าจะจับคู่เฉพาะคำสั่งที่ถูกเรียกผ่าน PATH เท่านั้น ดังนั้น `rg` จึงสามารถจับคู่
`/opt/homebrew/bin/rg` ได้เมื่อคำสั่งคือ `rg` แต่ไม่ใช่ `./rg` หรือ `/tmp/rg`
เมื่อ `security=allowlist` คำสั่ง shell จะได้รับการอนุญาตอัตโนมัติเฉพาะเมื่อทุก pipeline
segment อยู่ใน allowlist หรือเป็น safe bin การเชื่อมคำสั่ง (`;`, `&&`, `||`) และการ redirect
จะถูกปฏิเสธในโหมด allowlist เว้นแต่ทุก top-level segment จะผ่าน
allowlist (รวมถึง safe bins) การ redirect ยังคงไม่รองรับ
ความเชื่อถือแบบ durable `allow-always` ก็ไม่ข้ามกฎนี้: คำสั่งที่เชื่อมกันยังคงต้องให้ทุก
top-level segment ตรงตามเงื่อนไข

`autoAllowSkills` เป็นเส้นทางอำนวยความสะดวกแยกต่างหากใน exec approvals มันไม่เหมือนกับ
รายการ allowlist แบบ manual สำหรับ path หากต้องการความเชื่อถือแบบ explicit ที่เข้มงวด ให้ปิด `autoAllowSkills`

ใช้การควบคุมสองอย่างนี้สำหรับงานที่ต่างกัน:

- `tools.exec.safeBins`: stream filters ขนาดเล็กแบบ stdin-only
- `tools.exec.safeBinTrustedDirs`: ไดเรกทอรีเพิ่มเติมแบบ explicit ที่เชื่อถือได้สำหรับ path ของ executable ใน safe bin
- `tools.exec.safeBinProfiles`: นโยบาย argv แบบ explicit สำหรับ safe bin แบบกำหนดเอง
- allowlist: ความเชื่อถือแบบ explicit สำหรับ path ของ executable

อย่าถือว่า `safeBins` เป็น allowlist ทั่วไป และอย่าเพิ่มไบนารีประเภท interpreter/runtime (เช่น `python3`, `node`, `ruby`, `bash`) หากคุณต้องการสิ่งเหล่านั้น ให้ใช้รายการ allowlist แบบ explicit และเปิดการถามอนุมัติไว้
`openclaw security audit` จะเตือนเมื่อรายการ `safeBins` ของ interpreter/runtime ไม่มี `safeBinProfiles` แบบ explicit และ `openclaw doctor --fix` สามารถ scaffold รายการ `safeBinProfiles` แบบกำหนดเองที่ขาดหายไปได้
`openclaw security audit` และ `openclaw doctor` จะเตือนด้วยเมื่อคุณเพิ่มไบนารีที่มีพฤติกรรมกว้างอย่าง `jq` กลับเข้าไปใน `safeBins` แบบ explicit
หากคุณ allowlist interpreter แบบ explicit ให้เปิด `tools.exec.strictInlineEval` เพื่อให้รูปแบบ eval โค้ดแบบ inline ยังต้องขออนุมัติใหม่ทุกครั้ง

สำหรับรายละเอียดนโยบายทั้งหมดและตัวอย่าง ดู [Exec approvals](/th/tools/exec-approvals-advanced#safe-bins-stdin-only) และ [Safe bins versus allowlist](/th/tools/exec-approvals-advanced#safe-bins-versus-allowlist)

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

การ polling ใช้สำหรับตรวจสอบสถานะตามต้องการ ไม่ใช่ลูปรอคอย หากเปิดใช้
การปลุกเมื่อเสร็จอัตโนมัติ คำสั่งจะสามารถปลุก session ได้เมื่อมีเอาต์พุตหรือล้มเหลว

ส่งคีย์ (สไตล์ tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

ส่งคำสั่ง (ส่ง CR เท่านั้น):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

วางข้อความ (ครอบด้วย bracketed โดยค่าเริ่มต้น):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` เป็นเครื่องมือย่อยของ `exec` สำหรับการแก้ไขหลายไฟล์แบบมีโครงสร้าง
โดยเปิดใช้งานเป็นค่าเริ่มต้นสำหรับโมเดล OpenAI และ OpenAI Codex ใช้ config เฉพาะ
เมื่อคุณต้องการปิดใช้งานหรือจำกัดให้ใช้กับบางโมเดลเท่านั้น:

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

- ใช้งานได้เฉพาะกับโมเดล OpenAI/OpenAI Codex
- นโยบายเครื่องมือยังคงมีผล; `allow: ["write"]` จะอนุญาต `apply_patch` โดยนัย
- config อยู่ภายใต้ `tools.exec.applyPatch`
- `tools.exec.applyPatch.enabled` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เพื่อปิดใช้งานเครื่องมือนี้สำหรับโมเดล OpenAI
- `tools.exec.applyPatch.workspaceOnly` มีค่าเริ่มต้นเป็น `true` (จำกัดอยู่ภายใน workspace) ให้ตั้งเป็น `false` เฉพาะเมื่อคุณตั้งใจให้ `apply_patch` เขียน/ลบนอกไดเรกทอรี workspace

## ที่เกี่ยวข้อง

- [Exec Approvals](/th/tools/exec-approvals) — เกตการอนุมัติสำหรับคำสั่ง shell
- [Sandboxing](/th/gateway/sandboxing) — การรันคำสั่งในสภาพแวดล้อมแบบ sandbox
- [Background Process](/th/gateway/background-process) — `exec` แบบทำงานนานและเครื่องมือ process
- [Security](/th/gateway/security) — นโยบายเครื่องมือและการเข้าถึงแบบ elevated
