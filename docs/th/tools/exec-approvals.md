---
read_when:
    - การกำหนดค่าการอนุมัติการรันคำสั่งหรือรายการที่อนุญาต
    - การนำ UX การอนุมัติการรันคำสั่งไปใช้ในแอป macOS
    - การตรวจสอบพรอมป์ต์การออกจาก sandbox และผลกระทบของมัน
summary: การอนุมัติการรันคำสั่ง รายการที่อนุญาต และพรอมป์ต์การออกจาก sandbox
title: การอนุมัติการรันคำสั่ง
x-i18n:
    generated_at: "2026-04-25T14:00:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44bf7af57d322280f6d0089207041214b1233d0c9eca99656d51fc4aed88941b
    source_path: tools/exec-approvals.md
    workflow: 15
---

การอนุมัติการรันคำสั่งคือ **รั้วความปลอดภัยของ companion app / โฮสต์ node** สำหรับอนุญาตให้
agent ที่อยู่ใน sandbox รันคำสั่งบนโฮสต์จริง (`gateway` หรือ `node`) เป็นกลไกความปลอดภัย:
คำสั่งจะได้รับอนุญาตก็ต่อเมื่อนโยบาย + allowlist + (ทางเลือก) การอนุมัติจากผู้ใช้
เห็นพ้องกันทั้งหมด Exec approvals จะซ้อน **ทับ** นโยบายเครื่องมือและ elevated
gating (ยกเว้นเมื่อ elevated ถูกตั้งเป็น `full` ซึ่งจะข้าม approvals)

<Note>
นโยบายที่มีผลจริงจะเป็นค่าที่ **เข้มงวดกว่า** ระหว่างค่าเริ่มต้นของ `tools.exec.*` และ approvals;
หากละฟิลด์ใดของ approvals ไว้ จะใช้ค่าจาก `tools.exec` แทน การรันบนโฮสต์ยังใช้สถานะ approvals
ในเครื่องนั้นด้วย — ค่า `ask: "always"` แบบโฮสต์ภายในเครื่องใน `~/.openclaw/exec-approvals.json`
จะยังคงถามทุกครั้ง แม้ว่าค่าเริ่มต้นของ session หรือ config จะขอ `ask: "on-miss"` ก็ตาม
</Note>

## การตรวจสอบนโยบายที่มีผลจริง

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — แสดงนโยบายที่ร้องขอ, แหล่งที่มาของนโยบายโฮสต์ และผลลัพธ์ที่มีผลจริง
- `openclaw exec-policy show` — มุมมองแบบรวมของเครื่องภายในเครื่อง
- `openclaw exec-policy set|preset` — ซิงโครไนซ์นโยบายที่ร้องขอในเครื่องกับไฟล์ approvals ของโฮสต์ในเครื่องในขั้นตอนเดียว

เมื่อสโคปในเครื่องร้องขอ `host=node`, `exec-policy show` จะรายงานสโคปนั้น
ว่าอยู่ภายใต้การจัดการของ node ในรันไทม์ แทนการแสร้งว่าไฟล์ approvals ในเครื่องเป็น
แหล่งความจริง

หาก UI ของ companion app **ไม่พร้อมใช้งาน** คำขอใดก็ตามที่ปกติจะต้องแสดงพรอมป์ต์
จะถูกตัดสินด้วย **ask fallback** (ค่าเริ่มต้น: deny)

<Tip>
ไคลเอนต์การอนุมัติในแชตแบบ native สามารถวาง affordances เฉพาะช่องทางลงใน
ข้อความการอนุมัติที่รอดำเนินการได้ ตัวอย่างเช่น Matrix จะวาง shortcut ของ reaction (`✅`
อนุญาตครั้งเดียว, `❌` ปฏิเสธ, `♾️` อนุญาตตลอดไป) ขณะเดียวกันก็ยังคงปล่อยคำสั่ง
`/approve ...` ไว้ในข้อความเป็น fallback
</Tip>

## ใช้กับที่ใดบ้าง

Exec approvals ถูกบังคับใช้ภายในเครื่องบนโฮสต์ที่ทำการรัน:

- **โฮสต์ gateway** → process `openclaw` บนเครื่อง gateway
- **โฮสต์ node** → ตัวรัน node (companion app บน macOS หรือโฮสต์ node แบบ headless)

หมายเหตุเรื่อง trust model:

- ผู้เรียกที่ยืนยันตัวตนกับ Gateway ถือเป็นผู้ปฏิบัติงานที่เชื่อถือได้สำหรับ Gateway นั้น
- node ที่จับคู่แล้วจะขยายความสามารถของผู้ปฏิบัติงานที่เชื่อถือได้นั้นไปยังโฮสต์ node
- Exec approvals ช่วยลดความเสี่ยงจากการรันโดยไม่ตั้งใจ แต่ไม่ใช่ขอบเขตการยืนยันตัวตนแยกต่อผู้ใช้
- การรันบนโฮสต์ node ที่ได้รับอนุมัติจะผูกบริบทการรันแบบ canonical: cwd แบบ canonical, argv ที่ตรงกันทุกประการ, การผูก env
  เมื่อมี และพาธ executable ที่ตรึงไว้เมื่อเกี่ยวข้อง
- สำหรับ shell scripts และการเรียกไฟล์ interpreter/runtime โดยตรง OpenClaw ยังพยายามผูก
  operand ไฟล์ภายในเครื่องที่เป็นรูปธรรมเพียงหนึ่งรายการด้วย หากไฟล์ที่ผูกไว้นั้นเปลี่ยนแปลงหลังการอนุมัติแต่ก่อนการรัน
  การรันจะถูกปฏิเสธแทนที่จะไปรันเนื้อหาที่ลอยจากที่อนุมัติ
- การผูกไฟล์นี้ตั้งใจให้เป็นแบบ best-effort ไม่ใช่โมเดลเชิงความหมายที่สมบูรณ์ของทุก
  เส้นทางตัวโหลด interpreter/runtime หากโหมด approvals ไม่สามารถระบุไฟล์ภายในเครื่องที่เป็นรูปธรรมได้เพียงหนึ่งไฟล์อย่างชัดเจน
  ก็จะปฏิเสธการออกสิทธิ์รันที่อิงการอนุมัติ แทนการแกล้งว่าครอบคลุมทั้งหมด

การแยกส่วนบน macOS:

- **บริการโฮสต์ node** จะส่งต่อ `system.run` ไปยัง **แอป macOS** ผ่าน local IPC
- **แอป macOS** บังคับใช้ approvals + รันคำสั่งในบริบท UI

## การตั้งค่าและที่เก็บข้อมูล

Approvals อยู่ในไฟล์ JSON ภายในเครื่องบนโฮสต์ที่ทำการรัน:

`~/.openclaw/exec-approvals.json`

ตัวอย่างสคีมา:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## โหมด "YOLO" แบบไม่ต้องอนุมัติ

หากคุณต้องการให้ host exec รันโดยไม่มีพรอมป์ต์การอนุมัติ คุณต้องเปิด **ทั้งสอง** ชั้นนโยบาย:

- นโยบาย exec ที่ร้องขอใน config ของ OpenClaw (`tools.exec.*`)
- นโยบาย approvals ของโฮสต์ในเครื่องที่ `~/.openclaw/exec-approvals.json`

ตอนนี้นี่คือพฤติกรรมโฮสต์เริ่มต้น เว้นแต่คุณจะทำให้เข้มงวดขึ้นอย่างชัดเจน:

- `tools.exec.security`: `full` บน `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

ความแตกต่างสำคัญ:

- `tools.exec.host=auto` เลือกตำแหน่งที่ exec จะรัน: ใน sandbox ถ้ามี, มิฉะนั้นบน gateway
- YOLO เลือกวิธีที่ host exec จะได้รับการอนุมัติ: `security=full` บวก `ask=off`
- provider ที่ใช้ CLI และเปิดโหมดสิทธิ์แบบไม่โต้ตอบของตัวเองสามารถปฏิบัติตามนโยบายนี้ได้
  Claude CLI จะเพิ่ม `--permission-mode bypassPermissions` เมื่อ exec policy ที่ OpenClaw ร้องขอ
  เป็น YOLO แทนที่พฤติกรรม backend นั้นได้ด้วย args ของ Claude แบบ explicit ภายใต้
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs`, เช่น
  `--permission-mode default`, `acceptEdits` หรือ `bypassPermissions`
- ในโหมด YOLO OpenClaw จะไม่เพิ่ม approval gate สำหรับ command-obfuscation แบบ heuristic หรือชั้นปฏิเสธ script-preflight แยกต่างหากทับนโยบาย host exec ที่กำหนดไว้
- `auto` ไม่ได้ทำให้การกำหนดเส้นทางไป gateway เป็นทางลัด override ฟรีจาก session ที่อยู่ใน sandbox คำขอ `host=node` ต่อครั้งสามารถทำได้จาก `auto` และ `host=gateway` จะอนุญาตจาก `auto` เฉพาะเมื่อไม่มี sandbox runtime ทำงานอยู่ หากคุณต้องการค่าเริ่มต้นที่ไม่ใช่ auto แบบคงที่ ให้ตั้ง `tools.exec.host` หรือใช้ `/exec host=...` โดยตรง

หากคุณต้องการการตั้งค่าที่ระมัดระวังกว่านี้ ให้ปรับชั้นใดชั้นหนึ่งกลับเป็น `allowlist` / `on-miss`
หรือ `deny`

การตั้งค่า "ไม่ต้องถามเลย" แบบถาวรสำหรับโฮสต์ gateway:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

จากนั้นตั้งค่าไฟล์ approvals ของโฮสต์ให้ตรงกัน:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

shortcut ในเครื่องสำหรับนโยบายโฮสต์ gateway แบบเดียวกันบนเครื่องปัจจุบัน:

```bash
openclaw exec-policy preset yolo
```

shortcut ในเครื่องนี้จะอัปเดตทั้ง:

- `tools.exec.host/security/ask` ในเครื่อง
- ค่าเริ่มต้นใน `~/.openclaw/exec-approvals.json` ในเครื่อง

สิ่งนี้ตั้งใจให้ใช้ได้เฉพาะในเครื่องเท่านั้น หากคุณต้องการเปลี่ยน approvals ของโฮสต์ gateway หรือ node
จากระยะไกล ให้ใช้ `openclaw approvals set --gateway` หรือ
`openclaw approvals set --node <id|name|ip>` ต่อไป

สำหรับโฮสต์ node ให้ใช้ไฟล์ approvals แบบเดียวกันบน node นั้นแทน:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

ข้อจำกัดสำคัญที่ใช้ได้เฉพาะในเครื่อง:

- `openclaw exec-policy` ไม่ซิงโครไนซ์ approvals ของ node
- `openclaw exec-policy set --host node` จะถูกปฏิเสธ
- exec approvals ของ node จะถูกดึงจาก node ในรันไทม์ ดังนั้นการอัปเดตที่มุ่งไปยัง node ต้องใช้ `openclaw approvals --node ...`

shortcut แบบใช้ได้เฉพาะ session:

- `/exec security=full ask=off` เปลี่ยนเฉพาะ session ปัจจุบัน
- `/elevated full` เป็น shortcut แบบ break-glass ที่จะข้าม exec approvals สำหรับ session นั้นด้วย

หากไฟล์ approvals ของโฮสต์ยังคงเข้มงวดกว่า config นโยบายโฮสต์ที่เข้มงวดกว่าจะยังคงชนะ

## ปุ่มปรับนโยบาย

### Security (`exec.security`)

- **deny**: บล็อกคำขอ host exec ทั้งหมด
- **allowlist**: อนุญาตเฉพาะคำสั่งที่อยู่ใน allowlist
- **full**: อนุญาตทุกอย่าง (เทียบเท่ากับ elevated)

### Ask (`exec.ask`)

- **off**: ไม่ถามเลย
- **on-miss**: ถามเฉพาะเมื่อ allowlist ไม่ตรง
- **always**: ถามทุกคำสั่ง
- ความเชื่อถือแบบถาวร `allow-always` จะไม่ระงับพรอมป์ต์เมื่อโหมด ask ที่มีผลจริงเป็น `always`

### Ask fallback (`askFallback`)

หากจำเป็นต้องถามแต่ไม่สามารถเข้าถึง UI ได้ fallback จะเป็นตัวตัดสิน:

- **deny**: บล็อก
- **allowlist**: อนุญาตเฉพาะเมื่อ allowlist ตรง
- **full**: อนุญาต

### การเสริมความเข้มงวดสำหรับ inline interpreter eval (`tools.exec.strictInlineEval`)

เมื่อ `tools.exec.strictInlineEval=true`, OpenClaw จะถือว่ารูปแบบ inline code-eval ต้องได้รับการอนุมัติก่อนเสมอ แม้ตัวไบนารี interpreter เองจะอยู่ใน allowlist แล้วก็ตาม

ตัวอย่าง:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

นี่คือการป้องกันเชิงลึกสำหรับตัวโหลด interpreter ที่ไม่แมปได้สะอาดไปยัง file operand ที่คงที่เพียงหนึ่งรายการ ในโหมด strict:

- คำสั่งเหล่านี้ยังคงต้องได้รับการอนุมัติแบบ explicit
- `allow-always` จะไม่บันทึกรายการ allowlist ใหม่ให้โดยอัตโนมัติ

## Allowlist (ต่อ agent)

Allowlists เป็นแบบ **ต่อ agent** หากมีหลาย agent ให้สลับ agent ที่คุณกำลัง
แก้ไขในแอป macOS Pattern ใช้การจับคู่แบบ glob
Pattern สามารถเป็น glob ของพาธไบนารีที่ resolve แล้ว หรือ glob ของชื่อคำสั่งล้วน ๆ ก็ได้ ชื่อแบบล้วน
จะจับคู่เฉพาะคำสั่งที่ถูกเรียกผ่าน PATH ดังนั้น `rg` สามารถตรงกับ `/opt/homebrew/bin/rg`
เมื่อคำสั่งคือ `rg` แต่จะไม่ตรงกับ `./rg` หรือ `/tmp/rg` ใช้ path glob เมื่อคุณ
ต้องการเชื่อถือไบนารีตำแหน่งใดตำแหน่งหนึ่งโดยเฉพาะ
รายการ `agents.default` แบบ legacy จะถูกย้ายไปยัง `agents.main` ตอนโหลด
shell chain เช่น `echo ok && pwd` ยังคงต้องให้ทุก top-level segment ผ่านกฎ allowlist

ตัวอย่าง:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

แต่ละรายการใน allowlist จะติดตามข้อมูลดังนี้:

- **id** UUID แบบคงที่ที่ใช้เป็นตัวตนใน UI (ไม่บังคับ)
- **เวลาที่ใช้ล่าสุด**
- **คำสั่งที่ใช้ล่าสุด**
- **พาธที่ resolve ล่าสุด**

## อนุญาต Skills CLI อัตโนมัติ

เมื่อเปิด **Auto-allow skill CLIs** executable ที่อ้างอิงโดย Skills ที่รู้จัก
จะถูกถือว่าอยู่ใน allowlist บน node (node บน macOS หรือโฮสต์ node แบบ headless) โดยจะใช้
`skills.bins` ผ่าน Gateway RPC เพื่อดึงรายการ skill bin ปิดตัวเลือกนี้หากคุณต้องการ allowlists แบบ manual ที่เข้มงวด

หมายเหตุเรื่องความเชื่อถือที่สำคัญ:

- นี่คือ **allowlist เพื่อความสะดวกแบบ implicit** ซึ่งแยกจากรายการ allowlist พาธแบบ manual
- มีไว้สำหรับสภาพแวดล้อมของผู้ปฏิบัติงานที่เชื่อถือได้ ซึ่ง Gateway และ node อยู่ภายใน trust boundary เดียวกัน
- หากคุณต้องการความเชื่อถือแบบ explicit อย่างเข้มงวด ให้คง `autoAllowSkills: false` และใช้เฉพาะรายการ path allowlist แบบ manual

## Safe bins และการส่งต่อ approval

สำหรับ safe bins (fast-path แบบ stdin-only), รายละเอียดการผูก interpreter และวิธี
ส่งต่อพรอมป์ต์การอนุมัติไปยัง Slack/Discord/Telegram (หรือรันเป็น native
approval clients) ดูได้ที่ [Exec approvals — ขั้นสูง](/th/tools/exec-approvals-advanced)

<!-- moved to /tools/exec-approvals-advanced -->

## การแก้ไขใน Control UI

ใช้การ์ด **Control UI → Nodes → Exec approvals** เพื่อแก้ไขค่าเริ่มต้น, overrides
ต่อ agent และ allowlists เลือกสโคป (Defaults หรือ agent), ปรับนโยบาย,
เพิ่ม/ลบ allowlist patterns แล้วกด **Save** UI จะแสดงเมทาดาทา **ใช้ล่าสุด**
ต่อ pattern เพื่อช่วยให้คุณดูแลรายการให้เป็นระเบียบ

ตัวเลือกเป้าหมายให้เลือกได้ระหว่าง **Gateway** (approvals ในเครื่อง) หรือ **Node**
Node ต้องประกาศ `system.execApprovals.get/set` (แอป macOS หรือโฮสต์ node แบบ headless)
หาก node ยังไม่ประกาศ exec approvals ให้แก้ไฟล์ในเครื่องของมัน
`~/.openclaw/exec-approvals.json` โดยตรง

CLI: `openclaw approvals` รองรับการแก้ไข gateway หรือ node (ดู [Approvals CLI](/th/cli/approvals))

## โฟลว์การอนุมัติ

เมื่อจำเป็นต้องมีพรอมป์ต์ gateway จะกระจาย `exec.approval.requested` ไปยัง operator clients
Control UI และแอป macOS จะจัดการผ่าน `exec.approval.resolve` จากนั้น gateway จะส่งต่อ
คำขอที่ได้รับอนุมัติไปยังโฮสต์ node

สำหรับ `host=node` คำขออนุมัติจะรวม payload `systemRunPlan` แบบ canonical มาด้วย gateway ใช้
plan นั้นเป็นบริบทคำสั่ง/cwd/session ที่เป็น authoritative เมื่อส่งต่อคำขอ `system.run`
ที่ได้รับอนุมัติ

สิ่งนี้สำคัญต่อ latency ของการอนุมัติแบบ async:

- เส้นทาง node exec จะเตรียม canonical plan หนึ่งรายการไว้ล่วงหน้า
- ระเบียนการอนุมัติจะเก็บ plan นั้นและเมทาดาทาการผูกของมัน
- เมื่อได้รับการอนุมัติแล้ว การเรียก `system.run` ที่ถูกส่งต่อขั้นสุดท้ายจะนำ plan ที่เก็บไว้กลับมาใช้
  แทนที่จะเชื่อการแก้ไขของผู้เรียกในภายหลัง
- หากผู้เรียกเปลี่ยน `command`, `rawCommand`, `cwd`, `agentId` หรือ
  `sessionKey` หลังจากสร้างคำขออนุมัติแล้ว gateway จะปฏิเสธการรันที่ส่งต่อ
  ว่าเป็น approval mismatch

## เหตุการณ์ของระบบ

วงจรชีวิตของ exec จะถูกแสดงเป็นข้อความของระบบ:

- `Exec running` (เฉพาะเมื่อคำสั่งใช้เวลานานเกินเกณฑ์การแจ้งว่ากำลังรัน)
- `Exec finished`
- `Exec denied`

ข้อความเหล่านี้จะถูกโพสต์ไปยัง session ของ agent หลังจาก node รายงานเหตุการณ์นั้น
การอนุมัติ exec บนโฮสต์ gateway จะปล่อยเหตุการณ์วงจรชีวิตแบบเดียวกันเมื่อคำสั่งเสร็จสิ้น (และอาจปล่อยเมื่อรันนานเกินเกณฑ์ด้วย)
exec ที่ถูกควบคุมด้วย approval จะใช้ approval id ซ้ำเป็น `runId` ในข้อความเหล่านี้เพื่อให้เชื่อมโยงกันได้ง่าย

## พฤติกรรมเมื่อการอนุมัติถูกปฏิเสธ

เมื่อการอนุมัติ async exec ถูกปฏิเสธ OpenClaw จะป้องกันไม่ให้ agent นำเอาต์พุต
จากการรันก่อนหน้าของคำสั่งเดียวกันใน session มาใช้ซ้ำ เหตุผลของการปฏิเสธ
จะถูกส่งต่อพร้อมคำแนะนำอย่างชัดเจนว่าไม่มีเอาต์พุตของคำสั่งให้ใช้งาน ซึ่งจะหยุดไม่ให้
agent อ้างว่ามีเอาต์พุตใหม่ หรือเรียกคำสั่งที่ถูกปฏิเสธซ้ำพร้อม
ผลลัพธ์เก่าจากการรันที่เคยสำเร็จก่อนหน้า

## ผลกระทบ

- **full** มีอำนาจสูง; ควรใช้ allowlists เมื่อเป็นไปได้
- **ask** ช่วยให้คุณยังอยู่ในวงจรการตัดสินใจ ขณะเดียวกันก็ยังอนุมัติได้รวดเร็ว
- allowlists แบบต่อ agent ป้องกันไม่ให้การอนุมัติของ agent หนึ่งรั่วไปยัง agent อื่น
- approvals ใช้กับคำขอ host exec จาก **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น ผู้ส่งที่ไม่ได้รับอนุญาตไม่สามารถออก `/exec` ได้
- `/exec security=full` เป็นความสะดวกในระดับ session สำหรับผู้ปฏิบัติงานที่ได้รับอนุญาต และถูกออกแบบให้ข้าม approvals หากต้องการบล็อก host exec แบบเด็ดขาด ให้ตั้ง approvals security เป็น `deny` หรือปฏิเสธเครื่องมือ `exec` ผ่านนโยบายเครื่องมือ

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Exec approvals — ขั้นสูง" href="/th/tools/exec-approvals-advanced" icon="gear">
    Safe bins, การผูก interpreter และการส่งต่อ approval ไปยังแชต
  </Card>
  <Card title="เครื่องมือ Exec" href="/th/tools/exec" icon="terminal">
    เครื่องมือสำหรับรันคำสั่งเชลล์
  </Card>
  <Card title="โหมด Elevated" href="/th/tools/elevated" icon="shield-exclamation">
    เส้นทาง break-glass ที่ข้าม approvals ด้วย
  </Card>
  <Card title="Sandboxing" href="/th/gateway/sandboxing" icon="box">
    โหมด sandbox และการเข้าถึง workspace
  </Card>
  <Card title="Security" href="/th/gateway/security" icon="lock">
    โมเดลความปลอดภัยและการทำ hardening
  </Card>
  <Card title="Sandbox เทียบกับนโยบายเครื่องมือเทียบกับ elevated" href="/th/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    ควรใช้การควบคุมแต่ละแบบเมื่อใด
  </Card>
  <Card title="Skills" href="/th/tools/skills" icon="sparkles">
    พฤติกรรม auto-allow ที่ขับเคลื่อนด้วย Skill
  </Card>
</CardGroup>
