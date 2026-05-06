---
read_when:
    - การใช้หรือแก้ไขเครื่องมือ exec
    - การดีบักพฤติกรรมของ stdin หรือ TTY
summary: การใช้งานเครื่องมือ Exec, โหมด stdin และการรองรับ TTY
title: เครื่องมือ Exec
x-i18n:
    generated_at: "2026-05-06T09:34:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9892f030f1eeb83ca0cebac462c469e5f9f000763e4c96d62d82b819f98c3084
    source_path: tools/exec.md
    workflow: 16
---

รันคำสั่งเชลล์ในเวิร์กสเปซ รองรับการรันแบบ foreground + background ผ่าน `process`
หากไม่อนุญาตให้ใช้ `process` `exec` จะรันแบบซิงโครนัสและละเว้น `yieldMs`/`background`
เซสชัน background มีขอบเขตต่อ agent; `process` จะเห็นเฉพาะเซสชันจาก agent เดียวกันเท่านั้น

## พารามิเตอร์

<ParamField path="command" type="string" required>
คำสั่งเชลล์ที่จะรัน
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
ไดเรกทอรีทำงานสำหรับคำสั่ง
</ParamField>

<ParamField path="env" type="object">
การ override สภาพแวดล้อมแบบคีย์/ค่าที่ merge ทับบนสภาพแวดล้อมที่สืบทอดมา
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
ย้ายคำสั่งไปเป็น background โดยอัตโนมัติหลังจากดีเลย์นี้ (ms)
</ParamField>

<ParamField path="background" type="boolean" default="false">
ย้ายคำสั่งไปเป็น background ทันทีแทนการรอ `yieldMs`
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Override การหมดเวลา exec ที่กำหนดค่าไว้สำหรับการเรียกนี้ ตั้ง `timeout: 0` เฉพาะเมื่อคำสั่งควรรันโดยไม่มีการหมดเวลาของกระบวนการ exec
</ParamField>

<ParamField path="pty" type="boolean" default="false">
รันใน pseudo-terminal เมื่อพร้อมใช้งาน ใช้สำหรับ CLI ที่ต้องใช้ TTY เท่านั้น, coding agents และ UI เทอร์มินัล
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
ตำแหน่งที่จะรัน `auto` resolve เป็น `sandbox` เมื่อ sandbox runtime ทำงานอยู่ และเป็น `gateway` ในกรณีอื่น
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
โหมดการบังคับใช้สำหรับการรัน `gateway` / `node`
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
พฤติกรรมพรอมป์ขออนุมัติสำหรับการรัน `gateway` / `node`
</ParamField>

<ParamField path="node" type="string">
id/name ของ Node เมื่อ `host=node`
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
ขอโหมด elevated — ออกจาก sandbox ไปยัง path โฮสต์ที่กำหนดค่าไว้ `security=full` จะถูกบังคับใช้เฉพาะเมื่อ elevated resolve เป็น `full`
</ParamField>

หมายเหตุ:

- `host` มีค่าเริ่มต้นเป็น `auto`: sandbox เมื่อ sandbox runtime ทำงานอยู่สำหรับเซสชัน มิฉะนั้นเป็น Gateway
- `host` รับได้เฉพาะ `auto`, `sandbox`, `gateway` หรือ `node` เท่านั้น ไม่ใช่ตัวเลือก hostname; ค่าที่มีลักษณะเหมือน hostname จะถูกปฏิเสธก่อนคำสั่งรัน
- `auto` คือกลยุทธ์ routing เริ่มต้น ไม่ใช่ wildcard อนุญาตให้ใช้ `host=node` รายการต่อครั้งจาก `auto`; อนุญาตให้ใช้ `host=gateway` รายการต่อครั้งเฉพาะเมื่อไม่มี sandbox runtime ทำงานอยู่
- เมื่อไม่มี config เพิ่มเติม `host=auto` ก็ยัง "ใช้งานได้ทันที": ไม่มี sandbox หมายถึง resolve เป็น `gateway`; sandbox ที่ทำงานอยู่หมายถึงยังอยู่ใน sandbox
- `elevated` ออกจาก sandbox ไปยัง path โฮสต์ที่กำหนดค่าไว้: โดยค่าเริ่มต้นคือ `gateway` หรือ `node` เมื่อ `tools.exec.host=node` (หรือค่าเริ่มต้นของเซสชันคือ `host=node`) ใช้งานได้เฉพาะเมื่อเปิดใช้สิทธิ์ elevated สำหรับเซสชัน/ผู้ให้บริการปัจจุบัน
- การอนุมัติ `gateway`/`node` ถูกควบคุมโดย `~/.openclaw/exec-approvals.json`
- `node` ต้องมี node ที่จับคู่แล้ว (แอป companion หรือ headless node host)
- หากมีหลาย node พร้อมใช้งาน ให้ตั้ง `exec.node` หรือ `tools.exec.node` เพื่อเลือกหนึ่งรายการ
- `exec host=node` เป็น path การรันเชลล์เดียวสำหรับ node; wrapper เดิม `nodes.run` ถูกลบแล้ว
- `timeout` ใช้กับการรัน foreground, background, `yieldMs`, Gateway, sandbox และ Node `system.run` หากละไว้ OpenClaw จะใช้ `tools.exec.timeoutSec`; `timeout: 0` แบบระบุชัดจะปิดการหมดเวลาของกระบวนการ exec สำหรับการเรียกนั้น
- บนโฮสต์ที่ไม่ใช่ Windows exec จะใช้ `SHELL` เมื่อมีการตั้งค่าไว้; หาก `SHELL` เป็น `fish` จะเลือกใช้ `bash` (หรือ `sh`)
  จาก `PATH` เพื่อหลีกเลี่ยงสคริปต์ที่ไม่เข้ากันกับ fish แล้วจึง fallback เป็น `SHELL` หากไม่มีทั้งสองรายการ
- บนโฮสต์ Windows exec จะเลือกการค้นหา PowerShell 7 (`pwsh`) ก่อน (Program Files, ProgramW6432 แล้วจึง PATH),
  แล้วจึง fallback เป็น Windows PowerShell 5.1
- การรันบนโฮสต์ (`gateway`/`node`) ปฏิเสธ `env.PATH` และ loader overrides (`LD_*`/`DYLD_*`) เพื่อ
  ป้องกันการ hijack ไบนารีหรือโค้ดที่ถูก inject
- OpenClaw ตั้ง `OPENCLAW_SHELL=exec` ในสภาพแวดล้อมของคำสั่งที่ spawn ขึ้นมา (รวมถึงการรัน PTY และ sandbox) เพื่อให้กฎ shell/profile ตรวจจับบริบทของ exec-tool ได้
- `openclaw channels login` ถูกบล็อกจาก `exec` เพราะเป็น flow การยืนยันตัวตน channel แบบ interactive; ให้รันในเทอร์มินัลบน Gateway host หรือใช้เครื่องมือ login แบบ channel-native จากแชตเมื่อมี
- สำคัญ: sandboxing **ปิดโดยค่าเริ่มต้น** หาก sandboxing ปิดอยู่ `host=auto` แบบ implicit
  จะ resolve เป็น `gateway` ส่วน `host=sandbox` แบบ explicit ยังจะ fail closed แทนการ
  รันอย่างเงียบ ๆ บน Gateway host ให้เปิดใช้ sandboxing หรือใช้ `host=gateway` พร้อมการอนุมัติ
- การตรวจ preflight ของสคริปต์ (สำหรับข้อผิดพลาดไวยากรณ์เชลล์ Python/Node ที่พบบ่อย) ตรวจเฉพาะไฟล์ภายใน
  ขอบเขต `workdir` ที่มีผล หาก path สคริปต์ resolve ออกนอก `workdir` preflight จะถูกข้ามสำหรับ
  ไฟล์นั้น
- สำหรับงานที่รันนานซึ่งเริ่มตอนนี้ ให้เริ่มครั้งเดียวและพึ่งการปลุกเมื่อเสร็จสิ้นโดยอัตโนมัติ
  เมื่อเปิดใช้งานอยู่และคำสั่งปล่อย output หรือ fail
  ใช้ `process` สำหรับ log, สถานะ, input หรือการแทรกแซง; อย่าจำลอง
  scheduling ด้วย sleep loops, timeout loops หรือการ polling ซ้ำ
- สำหรับงานที่ควรเกิดขึ้นภายหลังหรือตามกำหนดเวลา ให้ใช้ Cron แทนรูปแบบ sleep/delay ของ
  `exec`

## Config

- `tools.exec.notifyOnExit` (ค่าเริ่มต้น: true): เมื่อเป็น true เซสชัน exec ที่ถูก background จะ enqueue system event และขอ Heartbeat เมื่อออก
- `tools.exec.approvalRunningNoticeMs` (ค่าเริ่มต้น: 10000): emit notice "running" หนึ่งครั้งเมื่อ exec ที่ต้องผ่าน approval gate รันนานกว่านี้ (0 ปิดใช้งาน)
- `tools.exec.timeoutSec` (ค่าเริ่มต้น: 1800): การหมดเวลา exec เริ่มต้นต่อคำสั่งในหน่วยวินาที `timeout` แบบ per-call จะ override ค่านี้; `timeout: 0` แบบ per-call จะปิดการหมดเวลาของกระบวนการ exec
- `tools.exec.host` (ค่าเริ่มต้น: `auto`; resolve เป็น `sandbox` เมื่อ sandbox runtime ทำงานอยู่, เป็น `gateway` ในกรณีอื่น)
- `tools.exec.security` (ค่าเริ่มต้น: `deny` สำหรับ sandbox, `full` สำหรับ Gateway + Node เมื่อไม่ได้ตั้งค่า)
- `tools.exec.ask` (ค่าเริ่มต้น: `off`)
- exec บนโฮสต์แบบไม่ต้องอนุมัติเป็นค่าเริ่มต้นสำหรับ Gateway + Node หากคุณต้องการพฤติกรรม approvals/allowlist ให้เข้มงวดทั้ง `tools.exec.*` และ `~/.openclaw/exec-approvals.json` ของโฮสต์; ดู [การอนุมัติ Exec](/th/tools/exec-approvals#yolo-mode-no-approval)
- YOLO มาจากค่าเริ่มต้นของ host-policy (`security=full`, `ask=off`) ไม่ใช่จาก `host=auto` หากคุณต้องการบังคับ routing ไปยัง Gateway หรือ Node ให้ตั้ง `tools.exec.host` หรือใช้ `/exec host=...`
- ในโหมด `security=full` บวก `ask=off` host exec จะทำตาม policy ที่กำหนดค่าไว้โดยตรง; ไม่มีชั้น prefilter เพิ่มเติมแบบ heuristic สำหรับการ obfuscate คำสั่งหรือชั้นปฏิเสธ script-preflight
- `tools.exec.node` (ค่าเริ่มต้น: unset)
- `tools.exec.strictInlineEval` (ค่าเริ่มต้น: false): เมื่อเป็น true รูปแบบ inline interpreter eval เช่น `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` และ `osascript -e` ต้องขออนุมัติแบบ explicit เสมอ `allow-always` ยังสามารถ persist การเรียก interpreter/script ที่ปลอดภัยได้ แต่รูปแบบ inline-eval ยังจะ prompt ทุกครั้ง
- `tools.exec.pathPrepend`: รายการไดเรกทอรีที่จะ prepend ให้ `PATH` สำหรับการรัน exec (เฉพาะ Gateway + sandbox)
- `tools.exec.safeBins`: safe binaries แบบ stdin-only ที่สามารถรันได้โดยไม่ต้องมีรายการ allowlist แบบ explicit สำหรับรายละเอียดพฤติกรรม ดู [Safe bins](/th/tools/exec-approvals-advanced#safe-bins-stdin-only)
- `tools.exec.safeBinTrustedDirs`: ไดเรกทอรี explicit เพิ่มเติมที่ trust สำหรับการตรวจ path ของ `safeBins` รายการ `PATH` จะไม่ถูก trust อัตโนมัติ ค่าเริ่มต้นในตัวคือ `/bin` และ `/usr/bin`
- `tools.exec.safeBinProfiles`: policy argv ที่กำหนดเองแบบไม่บังคับต่อ safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`)

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

- `host=gateway`: merge `PATH` ของ login-shell ของคุณเข้ากับสภาพแวดล้อม exec การ override `env.PATH`
  จะถูกปฏิเสธสำหรับการรันบนโฮสต์ ตัว daemon เองยังคงรันด้วย `PATH` ขั้นต่ำ:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: รัน `sh -lc` (login shell) ภายในคอนเทนเนอร์ ดังนั้น `/etc/profile` อาจรีเซ็ต `PATH`
  OpenClaw prepend `env.PATH` หลังจาก profile sourcing ผ่าน env var ภายใน (ไม่มี shell interpolation);
  `tools.exec.pathPrepend` ใช้ที่นี่เช่นกัน
- `host=node`: เฉพาะ env overrides ที่ไม่ถูกบล็อกซึ่งคุณส่งมาเท่านั้นที่จะถูกส่งไปยัง node การ override `env.PATH`
  จะถูกปฏิเสธสำหรับการรันบนโฮสต์และถูกละเว้นโดย node hosts หากคุณต้องการรายการ PATH เพิ่มเติมบน node
  ให้กำหนดค่าสภาพแวดล้อมของบริการ node host (systemd/launchd) หรือติดตั้งเครื่องมือในตำแหน่งมาตรฐาน

การผูก node ต่อ agent (ใช้ดัชนีรายการ agent ใน config):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: แท็บ Nodes มีแผง "Exec node binding" ขนาดเล็กสำหรับการตั้งค่าเดียวกัน

## การ override เซสชัน (`/exec`)

ใช้ `/exec` เพื่อตั้งค่าเริ่มต้น **ต่อเซสชัน** สำหรับ `host`, `security`, `ask` และ `node`
ส่ง `/exec` โดยไม่มี argument เพื่อแสดงค่าปัจจุบัน

ตัวอย่าง:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## โมเดลการอนุญาต

`/exec` จะถูก honor เฉพาะสำหรับ **ผู้ส่งที่ได้รับอนุญาต** (allowlists/pairing ของ channel บวก `commands.useAccessGroups`)
โดยอัปเดต **สถานะเซสชันเท่านั้น** และไม่เขียน config หากต้องการปิด exec แบบถาวร ให้ deny ผ่าน tool
policy (`tools.deny: ["exec"]` หรือต่อ agent) การอนุมัติบนโฮสต์ยังคงมีผล เว้นแต่คุณตั้ง
`security=full` และ `ask=off` อย่าง explicit

## การอนุมัติ Exec (companion app / node host)

agent ที่อยู่ใน sandbox สามารถกำหนดให้ต้องมีการอนุมัติรายคำขอก่อนที่ `exec` จะรันบน Gateway หรือ node host
ดู [การอนุมัติ Exec](/th/tools/exec-approvals) สำหรับ policy, allowlist และ UI flow

เมื่อต้องมีการอนุมัติ เครื่องมือ exec จะส่งกลับทันทีด้วย
`status: "approval-pending"` และ approval id เมื่อได้รับอนุมัติ (หรือถูกปฏิเสธ / หมดเวลา)
Gateway จะ emit system events (`Exec finished` / `Exec denied`) หากคำสั่งยังคง
รันอยู่หลัง `tools.exec.approvalRunningNoticeMs` จะ emit notice `Exec running` หนึ่งครั้ง
บน channels ที่มี native approval cards/buttons agent ควรพึ่งพา
native UI นั้นก่อน และใส่คำสั่ง `/approve` แบบ manual เฉพาะเมื่อผลลัพธ์ของเครื่องมือ
บอกอย่าง explicit ว่า chat approvals ไม่พร้อมใช้งาน หรือ manual approval เป็น
path เดียวเท่านั้น

## Allowlist + safe bins

การบังคับใช้ allowlist แบบ manual จะจับคู่ glob ของ path ไบนารีที่ resolve แล้วและ glob
ชื่อคำสั่งเปล่า ชื่อเปล่าจะจับคู่เฉพาะคำสั่งที่เรียกผ่าน PATH ดังนั้น `rg` สามารถจับคู่
`/opt/homebrew/bin/rg` ได้เมื่อคำสั่งคือ `rg` แต่ไม่ใช่ `./rg` หรือ `/tmp/rg`
เมื่อ `security=allowlist` คำสั่งเชลล์จะถูก auto-allow เฉพาะเมื่อ pipeline
ทุก segment อยู่ใน allowlist หรือเป็น safe bin การ chaining (`;`, `&&`, `||`) และ redirections
จะถูกปฏิเสธในโหมด allowlist เว้นแต่ segment ระดับบนสุดทุก segment จะเป็นไปตาม
allowlist (รวมถึง safe bins) Redirections ยังไม่รองรับ
trust แบบ durable `allow-always` ไม่ bypass กฎนั้น: คำสั่งที่ chain ยังต้องให้ทุก
segment ระดับบนสุดตรงกัน

`autoAllowSkills` เป็น path อำนวยความสะดวกแยกต่างหากใน exec approvals ไม่เหมือนกับ
รายการ allowlist path แบบ manual สำหรับ trust แบบ explicit ที่เข้มงวด ให้ปิดใช้งาน `autoAllowSkills` ไว้

ใช้ control ทั้งสองสำหรับงานที่ต่างกัน:

- `tools.exec.safeBins`: stream filters ขนาดเล็กแบบ stdin-only
- `tools.exec.safeBinTrustedDirs`: ไดเรกทอรี trusted เพิ่มเติมแบบ explicit สำหรับ path executable ของ safe-bin
- `tools.exec.safeBinProfiles`: policy argv แบบ explicit สำหรับ custom safe bins
- allowlist: trust แบบ explicit สำหรับ path executable

อย่าใช้ `safeBins` เป็นรายการอนุญาตทั่วไป และอย่าเพิ่มไบนารีของ interpreter/runtime (เช่น `python3`, `node`, `ruby`, `bash`) หากคุณต้องใช้สิ่งเหล่านั้น ให้ใช้รายการอนุญาตแบบชัดเจนและเปิดใช้พรอมป์การอนุมัติไว้
`openclaw security audit` จะเตือนเมื่อรายการ `safeBins` ของ interpreter/runtime ไม่มีโปรไฟล์ที่ชัดเจน และ `openclaw doctor --fix` สามารถสร้างโครงรายการ `safeBinProfiles` แบบกำหนดเองที่ขาดอยู่ได้
`openclaw security audit` และ `openclaw doctor` จะเตือนด้วยเมื่อคุณเพิ่ม bin ที่มีพฤติกรรมกว้าง เช่น `jq` กลับเข้าไปใน `safeBins` อย่างชัดเจน
หากคุณอนุญาต interpreter อย่างชัดเจน ให้เปิดใช้ `tools.exec.strictInlineEval` เพื่อให้รูปแบบ inline code-eval ยังคงต้องขออนุมัติใหม่

สำหรับรายละเอียดนโยบายและตัวอย่างทั้งหมด โปรดดู [การอนุมัติ Exec](/th/tools/exec-approvals-advanced#safe-bins-stdin-only) และ [Safe bins เทียบกับรายการอนุญาต](/th/tools/exec-approvals-advanced#safe-bins-versus-allowlist)

## ตัวอย่าง

เบื้องหน้า:

```json
{ "tool": "exec", "command": "ls -la" }
```

พื้นหลัง + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

การ poll ใช้สำหรับสถานะตามคำขอ ไม่ใช่ลูปรอ หากเปิดใช้การปลุกเมื่อเสร็จสิ้นอัตโนมัติ
คำสั่งสามารถปลุกเซสชันเมื่อมีเอาต์พุตหรือทำงานล้มเหลว

ส่งคีย์ (รูปแบบ tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

ส่ง (ส่งเฉพาะ CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

วาง (มี bracketed เป็นค่าเริ่มต้น):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` เป็นเครื่องมือย่อยของ `exec` สำหรับการแก้ไขหลายไฟล์แบบมีโครงสร้าง
เปิดใช้เป็นค่าเริ่มต้นสำหรับโมเดล OpenAI และ OpenAI Codex ใช้ config เฉพาะ
เมื่อคุณต้องการปิดใช้หรือจำกัดให้ใช้กับโมเดลที่ระบุเท่านั้น:

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
- `deny: ["write"]` ไม่ได้ปฏิเสธ `apply_patch`; ให้ปฏิเสธ `apply_patch` อย่างชัดเจน หรือใช้ `deny: ["group:fs"]` เมื่อต้องการบล็อกการเขียนของ patch ด้วย
- Config อยู่ใต้ `tools.exec.applyPatch`
- `tools.exec.applyPatch.enabled` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เพื่อปิดใช้เครื่องมือนี้สำหรับโมเดล OpenAI
- `tools.exec.applyPatch.workspaceOnly` มีค่าเริ่มต้นเป็น `true` (จำกัดอยู่ใน workspace) ตั้งเป็น `false` เฉพาะเมื่อคุณตั้งใจให้ `apply_patch` เขียน/ลบนอกไดเรกทอรี workspace

## ที่เกี่ยวข้อง

- [การอนุมัติ Exec](/th/tools/exec-approvals) — เกตการอนุมัติสำหรับคำสั่ง shell
- [Sandboxing](/th/gateway/sandboxing) — การรันคำสั่งในสภาพแวดล้อมแบบ sandbox
- [กระบวนการพื้นหลัง](/th/gateway/background-process) — exec ที่ทำงานนานและเครื่องมือ process
- [ความปลอดภัย](/th/gateway/security) — นโยบายเครื่องมือและการเข้าถึงที่ยกระดับ
