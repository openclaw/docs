---
read_when:
    - การกำหนดค่าการอนุมัติ exec หรือรายการอนุญาต
    - การนำ UX การอนุมัติ exec ไปใช้ในแอป macOS
    - การตรวจสอบพรอมป์สำหรับการหลบเลี่ยงแซนด์บ็อกซ์และผลกระทบของพรอมป์เหล่านั้น
sidebarTitle: Exec approvals
summary: 'การอนุมัติการดำเนินการบนโฮสต์: ตัวปรับนโยบาย รายการที่อนุญาต และเวิร์กโฟลว์ YOLO/เข้มงวด'
title: การอนุมัติการเรียกใช้คำสั่ง
x-i18n:
    generated_at: "2026-04-30T10:19:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71c16d0e547c4dd42a351d37e37e97b681a062cd496d5e0cba923b54c8f5b0e9
    source_path: tools/exec-approvals.md
    workflow: 16
---

การอนุมัติ Exec คือ **กลไกป้องกันของแอปคู่หู / โฮสต์ node** สำหรับให้
เอเจนต์ที่อยู่ใน sandbox รันคำสั่งบนโฮสต์จริง (`gateway` หรือ `node`) ได้ เป็น
กลไกนิรภัยแบบ interlock: คำสั่งจะได้รับอนุญาตก็ต่อเมื่อ policy + allowlist +
การอนุมัติจากผู้ใช้ (ถ้ามี) เห็นตรงกันทั้งหมด การอนุมัติ Exec จะซ้อน **อยู่เหนือ**
policy ของเครื่องมือและ elevated gating (ยกเว้นเมื่อ elevated ถูกตั้งเป็น `full` ซึ่ง
จะข้ามการอนุมัติ)

<Note>
policy ที่มีผลจริงคือค่าที่ **เข้มงวดกว่า** ระหว่าง `tools.exec.*` กับค่าเริ่มต้นของ approvals
ถ้าละเว้นฟิลด์ approvals ไว้ จะใช้ค่า `tools.exec` แทน Host exec ยังใช้สถานะ approvals ภายในเครื่องนั้นด้วย — ค่า
`ask: "always"` แบบ host-local ใน `~/.openclaw/exec-approvals.json` จะยังคง
ถามต่อไป แม้ค่าเริ่มต้นของ session หรือ config จะขอ `ask: "on-miss"` ก็ตาม
</Note>

## การตรวจสอบ policy ที่มีผลจริง

| คำสั่ง                                                           | สิ่งที่แสดง                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | policy ที่ร้องขอ, แหล่งที่มาของ policy ฝั่งโฮสต์ และผลลัพธ์ที่มีผลจริง               |
| `openclaw exec-policy show`                                      | มุมมองที่ผสานแล้วของเครื่องภายในเครื่อง                                               |
| `openclaw exec-policy set` / `preset`                            | ซิงโครไนซ์ policy ที่ร้องขอภายในเครื่องกับไฟล์ approvals ของโฮสต์ภายในเครื่องในขั้นตอนเดียว |

เมื่อ scope ภายในเครื่องร้องขอ `host=node`, `exec-policy show` จะรายงานว่า
scope นั้นถูกจัดการโดย node ณ runtime แทนที่จะทำเหมือนไฟล์ approvals ภายในเครื่อง
เป็นแหล่งข้อมูลจริง

ถ้า UI ของแอปคู่หู **ไม่พร้อมใช้งาน** คำขอใด ๆ ที่โดยปกติจะต้องถามผู้ใช้
จะถูกตัดสินด้วย **ask fallback** (ค่าเริ่มต้น: `deny`)

<Tip>
ไคลเอนต์อนุมัติของแชตแบบ native สามารถเติม affordance เฉพาะ channel ลงใน
ข้อความอนุมัติที่รอดำเนินการได้ ตัวอย่างเช่น Matrix เติมทางลัดด้วย reaction
(`✅` อนุญาตครั้งเดียว, `❌` ปฏิเสธ, `♾️` อนุญาตเสมอ) ขณะที่ยังคงใส่คำสั่ง
`/approve ...` ไว้ในข้อความเป็น fallback
</Tip>

## ใช้ที่ใด

การอนุมัติ Exec ถูกบังคับใช้ภายในเครื่องบนโฮสต์ที่ทำการประมวลผล:

- **โฮสต์ Gateway** → โปรเซส `openclaw` บนเครื่อง Gateway
- **โฮสต์ Node** → ตัวรัน node (แอปคู่หูบน macOS หรือโฮสต์ node แบบ headless)

### โมเดลความเชื่อถือ

- ผู้เรียกที่ผ่านการตรวจสอบสิทธิ์โดย Gateway ถือเป็นผู้ปฏิบัติการที่เชื่อถือได้สำหรับ Gateway นั้น
- node ที่จับคู่แล้วขยายความสามารถผู้ปฏิบัติการที่เชื่อถือได้นั้นไปยังโฮสต์ node
- การอนุมัติ Exec ลดความเสี่ยงจากการสั่งรันโดยไม่ตั้งใจ แต่ **ไม่ใช่** ขอบเขตการยืนยันตัวตนรายผู้ใช้
- การรันบนโฮสต์ node ที่ได้รับอนุมัติจะผูก context การประมวลผลแบบ canonical: cwd แบบ canonical, argv ที่แน่นอน, การผูก env เมื่อมี และ path ของ executable ที่ถูก pin เมื่อใช้ได้
- สำหรับ shell scripts และการเรียกไฟล์ interpreter/runtime โดยตรง OpenClaw ยังพยายามผูก operand ไฟล์ภายในเครื่องที่เป็นรูปธรรมหนึ่งไฟล์ หากไฟล์ที่ผูกไว้นั้นเปลี่ยนหลังอนุมัติแต่ก่อนประมวลผล การรันจะถูกปฏิเสธแทนที่จะประมวลผลเนื้อหาที่เปลี่ยนไป
- การผูกไฟล์เป็นแบบ best-effort โดยเจตนา **ไม่ใช่** โมเดล semantic ที่ครอบคลุมครบถ้วนสำหรับทุก path ของตัวโหลด interpreter/runtime หากโหมดอนุมัติไม่สามารถระบุไฟล์ภายในเครื่องที่เป็นรูปธรรมได้แน่นอนหนึ่งไฟล์เพื่อผูก ก็จะปฏิเสธการสร้างการรันที่มี approval หนุนหลัง แทนที่จะทำเหมือนว่าครอบคลุมครบถ้วน

### การแยกส่วนบน macOS

- **บริการโฮสต์ node** ส่งต่อ `system.run` ไปยัง **แอป macOS** ผ่าน local IPC
- **แอป macOS** บังคับใช้ approvals และประมวลผลคำสั่งใน context ของ UI

## การตั้งค่าและพื้นที่จัดเก็บ

Approvals อยู่ในไฟล์ JSON ภายในเครื่องบนโฮสต์ที่ประมวลผล:

```text
~/.openclaw/exec-approvals.json
```

ตัวอย่าง schema:

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
          "source": "allow-always",
          "commandText": "rg -n TODO",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## ตัวปรับ policy

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — บล็อกคำขอ host exec ทั้งหมด
  - `allowlist` — อนุญาตเฉพาะคำสั่งที่อยู่ใน allowlist
  - `full` — อนุญาตทุกอย่าง (เทียบเท่า elevated)

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — ไม่ถามเลย
  - `on-miss` — ถามเฉพาะเมื่อ allowlist ไม่ตรงกัน
  - `always` — ถามทุกคำสั่ง ความเชื่อถือแบบถาวร `allow-always` จะ **ไม่** ระงับการถามเมื่อโหมด ask ที่มีผลจริงคือ `always`

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  วิธีตัดสินเมื่อจำเป็นต้องถาม แต่เข้าถึง UI ไม่ได้

- `deny` — บล็อก
- `allowlist` — อนุญาตเฉพาะเมื่อ allowlist ตรงกัน
- `full` — อนุญาต

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  เมื่อเป็น `true`, OpenClaw จะถือว่ารูปแบบ inline code-eval ต้องผ่าน approval เท่านั้น
  แม้ตัว binary ของ interpreter เองจะอยู่ใน allowlist ก็ตาม เป็น defense-in-depth
  สำหรับตัวโหลด interpreter ที่ไม่สามารถ map กับ operand ไฟล์ที่เสถียรหนึ่งไฟล์ได้อย่างชัดเจน
</ParamField>

ตัวอย่างที่โหมด strict ตรวจจับได้:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

ในโหมด strict คำสั่งเหล่านี้ยังต้องได้รับการอนุมัติอย่างชัดเจน และ
`allow-always` จะไม่คงรายการ allowlist ใหม่สำหรับคำสั่งเหล่านี้
โดยอัตโนมัติ

## โหมด YOLO (ไม่ต้องอนุมัติ)

หากต้องการให้ host exec รันโดยไม่มี prompt อนุมัติ คุณต้องเปิด
policy **ทั้งสอง** ชั้น — policy exec ที่ร้องขอใน config ของ OpenClaw
(`tools.exec.*`) **และ** policy approvals แบบ host-local ใน
`~/.openclaw/exec-approvals.json`

YOLO คือพฤติกรรมเริ่มต้นของโฮสต์ เว้นแต่คุณจะทำให้เข้มงวดขึ้นอย่างชัดเจน:

| ชั้น                  | การตั้งค่า YOLO           |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` บน `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**ข้อแตกต่างสำคัญ:**

- `tools.exec.host=auto` เลือก **ตำแหน่ง** ที่ exec จะรัน: sandbox เมื่อพร้อมใช้งาน มิฉะนั้นเป็น Gateway
- YOLO เลือก **วิธี** อนุมัติ host exec: `security=full` บวก `ask=off`
- ในโหมด YOLO, OpenClaw จะ **ไม่** เพิ่ม gate อนุมัติคำสั่งที่ใช้ heuristic ตรวจจับการ obfuscation หรือชั้น script-preflight rejection แยกต่างหากไว้เหนือ policy host exec ที่กำหนดไว้
- `auto` ไม่ได้ทำให้การ route ไป Gateway เป็น override ฟรีจาก session ที่อยู่ใน sandbox คำขอรายครั้ง `host=node` ได้รับอนุญาตจาก `auto`; `host=gateway` ได้รับอนุญาตจาก `auto` เฉพาะเมื่อไม่มี sandbox runtime ทำงานอยู่ สำหรับค่าเริ่มต้นที่เสถียรและไม่ใช่ auto ให้ตั้ง `tools.exec.host` หรือใช้ `/exec host=...` อย่างชัดเจน

</Warning>

ผู้ให้บริการที่หนุนด้วย CLI ซึ่งเปิดเผยโหมด permission แบบ noninteractive ของตนเอง
สามารถทำตาม policy นี้ได้ Claude CLI เพิ่ม
`--permission-mode bypassPermissions` เมื่อ policy exec ที่ OpenClaw ร้องขอ
เป็น YOLO override พฤติกรรม backend นั้นด้วยอาร์กิวเมนต์ Claude ที่ชัดเจน
ภายใต้ `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` —
เช่น `--permission-mode default`, `acceptEdits` หรือ
`bypassPermissions`

หากต้องการตั้งค่าแบบอนุรักษ์นิยมมากขึ้น ให้ปรับชั้นใดชั้นหนึ่งกลับไปเป็น
`allowlist` / `on-miss` หรือ `deny`

### การตั้งค่า Gateway-host แบบถาวร "ไม่ต้องถามเลย"

<Steps>
  <Step title="ตั้งค่า policy config ที่ร้องขอ">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="ทำให้ไฟล์ approvals ของโฮสต์ตรงกัน">
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
  </Step>
</Steps>

### ทางลัดภายในเครื่อง

```bash
openclaw exec-policy preset yolo
```

ทางลัดภายในเครื่องนี้อัปเดตทั้งสองอย่าง:

- `tools.exec.host/security/ask` ภายในเครื่อง
- ค่าเริ่มต้น `~/.openclaw/exec-approvals.json` ภายในเครื่อง

ตั้งใจให้ใช้เฉพาะภายในเครื่องเท่านั้น หากต้องการเปลี่ยน approvals ของ Gateway-host หรือ Node-host
จากระยะไกล ให้ใช้ `openclaw approvals set --gateway` หรือ
`openclaw approvals set --node <id|name|ip>`

### โฮสต์ Node

สำหรับโฮสต์ Node ให้ใช้ไฟล์ approvals เดียวกันบน node นั้นแทน:

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

<Note>
**ข้อจำกัดเฉพาะภายในเครื่อง:**

- `openclaw exec-policy` ไม่ซิงโครไนซ์ approvals ของ node
- `openclaw exec-policy set --host node` ถูกปฏิเสธ
- การอนุมัติ exec ของ Node ถูกดึงจาก node ณ runtime ดังนั้นการอัปเดตที่เล็งไปยัง node ต้องใช้ `openclaw approvals --node ...`

</Note>

### ทางลัดเฉพาะ session

- `/exec security=full ask=off` เปลี่ยนเฉพาะ session ปัจจุบัน
- `/elevated full` เป็นทางลัด break-glass ที่ข้ามการอนุมัติ exec สำหรับ session นั้นด้วย

ถ้าไฟล์ approvals ของโฮสต์ยังเข้มงวดกว่า config, policy ของโฮสต์ที่เข้มงวดกว่า
ยังคงชนะ

## Allowlist (รายเอเจนต์)

Allowlist เป็นแบบ **รายเอเจนต์** หากมีหลายเอเจนต์ ให้สลับว่าเอเจนต์ใด
ที่คุณกำลังแก้ไขในแอป macOS Patterns เป็นการจับคู่แบบ glob

Patterns อาจเป็น glob ของ path binary ที่ resolve แล้ว หรือ glob ของชื่อคำสั่งล้วน
ชื่อแบบล้วนจะจับคู่เฉพาะคำสั่งที่เรียกผ่าน `PATH` ดังนั้น `rg` จึงจับคู่กับ
`/opt/homebrew/bin/rg` ได้เมื่อคำสั่งคือ `rg` แต่ **ไม่** จับคู่กับ `./rg` หรือ
`/tmp/rg` ใช้ path glob เมื่อคุณต้องการเชื่อถือ location ของ binary เฉพาะหนึ่งตำแหน่ง

รายการ `agents.default` แบบเดิมจะถูก migrate เป็น `agents.main` ตอนโหลด
shell chains เช่น `echo ok && pwd` ยังต้องให้ทุก segment ระดับบนสุด
ผ่านกฎ allowlist

ตัวอย่าง:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

รายการ allowlist แต่ละรายการติดตาม:

| ฟิลด์              | ความหมาย                         |
| ------------------ | -------------------------------- |
| `id`               | UUID เสถียรที่ใช้สำหรับ identity ของ UI |
| `lastUsedAt`       | timestamp ที่ใช้ล่าสุด           |
| `lastUsedCommand`  | คำสั่งล่าสุดที่ตรงกัน            |
| `lastResolvedPath` | path binary ล่าสุดที่ resolve ได้ |

## อนุญาต CLI ของ skill โดยอัตโนมัติ

เมื่อเปิดใช้ **อนุญาต CLI ของ skill โดยอัตโนมัติ** executable ที่อ้างอิงโดย
skills ที่รู้จักจะถูกถือว่าอยู่ใน allowlist บน node (node macOS หรือโฮสต์
node แบบ headless) การทำงานนี้ใช้ `skills.bins` ผ่าน Gateway RPC เพื่อดึง
รายการ bin ของ skill ปิดใช้งานสิ่งนี้หากคุณต้องการ allowlist แบบ manual ที่เข้มงวด

<Warning>
- นี่คือ **allowlist เพื่อความสะดวกแบบ implicit** แยกจากรายการ allowlist path แบบ manual
- ตั้งใจใช้สำหรับสภาพแวดล้อมผู้ปฏิบัติการที่เชื่อถือได้ ซึ่ง Gateway และ node อยู่ในขอบเขตความเชื่อถือเดียวกัน
- หากคุณต้องการความเชื่อถือแบบชัดเจนที่เข้มงวด ให้คง `autoAllowSkills: false` และใช้เฉพาะรายการ allowlist path แบบ manual

</Warning>

## safe bins และการส่งต่อ approval

สำหรับ safe bins (fast-path แบบ stdin-only), รายละเอียดการผูก interpreter และ
วิธีส่งต่อ prompt อนุมัติไปยัง Slack/Discord/Telegram (หรือรันเป็น
ไคลเอนต์ approval แบบ native) โปรดดู
[การอนุมัติ Exec — ขั้นสูง](/th/tools/exec-approvals-advanced)

## การแก้ไขใน Control UI

ใช้การ์ด **Control UI → Nodes → Exec approvals** เพื่อแก้ไขค่าเริ่มต้น,
override รายเอเจนต์ และ allowlist เลือก scope (Defaults หรือเอเจนต์),
ปรับ policy, เพิ่ม/ลบ pattern ของ allowlist แล้วกด **Save** UI
จะแสดง metadata การใช้ล่าสุดต่อ pattern เพื่อให้คุณจัดรายการให้เรียบร้อยได้

ตัวเลือกเป้าหมายจะเลือก **Gateway** (การอนุมัติภายในเครื่อง) หรือ **Node**
Node ต้องประกาศ `system.execApprovals.get/set` (แอป macOS หรือ
โฮสต์ Node แบบไม่มี UI) หาก Node ยังไม่ได้ประกาศการอนุมัติ exec
ให้แก้ไข `~/.openclaw/exec-approvals.json` ภายในเครื่องของ Node นั้นโดยตรง

CLI: `openclaw approvals` รองรับการแก้ไข Gateway หรือ Node — ดู
[CLI การอนุมัติ](/th/cli/approvals)

## โฟลว์การอนุมัติ

เมื่อจำเป็นต้องมีพรอมป์ Gateway จะกระจาย
`exec.approval.requested` ไปยังไคลเอนต์ของผู้ปฏิบัติงาน Control UI และแอป macOS
จะจัดการผ่าน `exec.approval.resolve` จากนั้น Gateway จะส่งต่อคำขอที่ได้รับอนุมัติ
ไปยังโฮสต์ Node

สำหรับ `host=node` คำขออนุมัติจะมี payload `systemRunPlan`
แบบ canonical Gateway ใช้แผนนั้นเป็นบริบทคำสั่ง/cwd/session
ที่เชื่อถือได้เมื่อส่งต่อคำขอ `system.run` ที่ได้รับอนุมัติ

สิ่งนี้สำคัญต่อเวลาแฝงของการอนุมัติแบบ async:

- เส้นทาง exec ของ Node เตรียมแผน canonical หนึ่งชุดไว้ล่วงหน้า
- เรคคอร์ดการอนุมัติจัดเก็บแผนนั้นและเมทาดาทาการผูกของแผนนั้น
- เมื่อได้รับอนุมัติแล้ว การเรียก `system.run` ครั้งสุดท้ายที่ถูกส่งต่อจะใช้แผนที่จัดเก็บไว้ซ้ำ แทนที่จะเชื่อถือการแก้ไขภายหลังจากผู้เรียก
- หากผู้เรียกเปลี่ยน `command`, `rawCommand`, `cwd`, `agentId` หรือ `sessionKey` หลังจากสร้างคำขออนุมัติแล้ว Gateway จะปฏิเสธการรันที่ถูกส่งต่อว่าเป็นการอนุมัติที่ไม่ตรงกัน

## เหตุการณ์ของระบบ

วงจรชีวิตของ exec จะแสดงเป็นข้อความระบบ:

- `Exec running` (เฉพาะเมื่อคำสั่งใช้เวลานานเกินเกณฑ์การแจ้งว่ากำลังรัน)
- `Exec finished`
- `Exec denied`

ข้อความเหล่านี้จะถูกโพสต์ไปยัง session ของ agent หลังจาก Node รายงานเหตุการณ์
การอนุมัติ exec ที่โฮสต์โดย Gateway จะส่งเหตุการณ์วงจรชีวิตแบบเดียวกันเมื่อ
คำสั่งเสร็จสิ้น (และอาจส่งเมื่อรันนานกว่าเกณฑ์ด้วย) exec ที่ถูกควบคุมด้วยการอนุมัติ
จะใช้ id การอนุมัติซ้ำเป็น `runId` ในข้อความเหล่านี้เพื่อให้เชื่อมโยงกันได้ง่าย

## พฤติกรรมเมื่อการอนุมัติถูกปฏิเสธ

เมื่อการอนุมัติ exec แบบ async ถูกปฏิเสธ OpenClaw จะป้องกันไม่ให้ agent
นำเอาเอาต์พุตจากการรันก่อนหน้าของคำสั่งเดียวกันใน session มาใช้ซ้ำ
เหตุผลการปฏิเสธจะถูกส่งไปพร้อมคำแนะนำที่ชัดเจนว่าไม่มีเอาต์พุตของคำสั่งให้ใช้
ซึ่งหยุดไม่ให้ agent อ้างว่ามีเอาต์พุตใหม่ หรือรันคำสั่งที่ถูกปฏิเสธซ้ำ
โดยใช้ผลลัพธ์เก่าจากการรันก่อนหน้าที่สำเร็จ

## ผลกระทบ

- **`full`** มีอำนาจสูง ควรใช้ allowlist เมื่อเป็นไปได้
- **`ask`** ช่วยให้คุณยังอยู่ในวงจรการตัดสินใจ ขณะเดียวกันก็ยังอนุมัติได้รวดเร็ว
- allowlist ต่อ agent ป้องกันไม่ให้การอนุมัติของ agent หนึ่งรั่วไหลไปยัง agent อื่น
- การอนุมัติใช้กับคำขอ host exec จาก **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น ผู้ส่งที่ไม่ได้รับอนุญาตไม่สามารถสั่ง `/exec` ได้
- `/exec security=full` เป็นความสะดวกในระดับ session สำหรับผู้ปฏิบัติงานที่ได้รับอนุญาต และข้ามการอนุมัติโดยออกแบบไว้เช่นนั้น หากต้องการบล็อก host exec อย่างเด็ดขาด ให้ตั้งค่าความปลอดภัยของการอนุมัติเป็น `deny` หรือปฏิเสธเครื่องมือ `exec` ผ่านนโยบายเครื่องมือ

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การอนุมัติ exec — ขั้นสูง" href="/th/tools/exec-approvals-advanced" icon="gear">
    bin ที่ปลอดภัย การผูก interpreter และการส่งต่อการอนุมัติไปยังแชต
  </Card>
  <Card title="เครื่องมือ exec" href="/th/tools/exec" icon="terminal">
    เครื่องมือสำหรับรันคำสั่ง shell
  </Card>
  <Card title="โหมดยกระดับ" href="/th/tools/elevated" icon="shield-exclamation">
    เส้นทางฉุกเฉินที่ข้ามการอนุมัติด้วยเช่นกัน
  </Card>
  <Card title="Sandboxing" href="/th/gateway/sandboxing" icon="box">
    โหมด sandbox และการเข้าถึง workspace
  </Card>
  <Card title="ความปลอดภัย" href="/th/gateway/security" icon="lock">
    โมเดลความปลอดภัยและการเสริมความแข็งแกร่ง
  </Card>
  <Card title="sandbox เทียบกับนโยบายเครื่องมือ เทียบกับโหมดยกระดับ" href="/th/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    เมื่อใดควรเลือกใช้การควบคุมแต่ละแบบ
  </Card>
  <Card title="Skills" href="/th/tools/skills" icon="sparkles">
    พฤติกรรมการอนุญาตอัตโนมัติที่รองรับด้วย Skills
  </Card>
</CardGroup>
