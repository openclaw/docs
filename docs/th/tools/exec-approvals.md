---
read_when:
    - การกำหนดค่าการอนุมัติ exec หรือรายการอนุญาต
    - การนำประสบการณ์ผู้ใช้สำหรับการอนุมัติ exec ไปใช้ในแอป macOS
    - การตรวจสอบพรอมต์สำหรับการหลุดออกจาก sandbox และผลกระทบของพรอมต์เหล่านั้น
sidebarTitle: Exec approvals
summary: 'การอนุมัติการดำเนินการบนโฮสต์: ตัวเลือกปรับนโยบาย รายการอนุญาต และเวิร์กโฟลว์แบบ YOLO/เข้มงวด'
title: การอนุมัติการรันคำสั่ง
x-i18n:
    generated_at: "2026-05-10T19:59:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b1a9649161440bca445e318654b9a48a54ae1dbbca42349ac94b13ecc9fbfbd
    source_path: tools/exec-approvals.md
    workflow: 16
---

การอนุมัติ Exec คือ **รั้วป้องกันของ companion app / node host** สำหรับอนุญาตให้เอเจนต์ใน sandbox รันคำสั่งบนโฮสต์จริง (`gateway` หรือ `node`) กลไกนิรภัย: อนุญาตคำสั่งได้ก็ต่อเมื่อ policy + allowlist + การอนุมัติจากผู้ใช้ (ไม่บังคับ) เห็นตรงกันทั้งหมด การอนุมัติ Exec จะซ้อน **อยู่เหนือ** tool policy และ elevated gating (ยกเว้นเมื่อตั้ง elevated เป็น `full` ซึ่งจะข้ามการอนุมัติ)

<Note>
policy ที่มีผลจริงคือค่าที่ **เข้มงวดกว่า** ระหว่าง `tools.exec.*` กับค่าเริ่มต้นของการอนุมัติ; หากละเว้นฟิลด์การอนุมัติไว้ จะใช้ค่า `tools.exec` แทน Host exec ยังใช้สถานะการอนุมัติแบบ local บนเครื่องนั้นด้วย - `ask: "always"` แบบ host-local ใน `~/.openclaw/exec-approvals.json` จะยังคงถามต่อไป แม้ค่าเริ่มต้นของเซสชันหรือ config จะร้องขอ `ask: "on-miss"` ก็ตาม
</Note>

## การตรวจสอบ policy ที่มีผลจริง

| คำสั่ง                                                          | สิ่งที่แสดง                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | policy ที่ร้องขอ, แหล่งที่มาของ host policy และผลลัพธ์ที่มีผลจริง                       |
| `openclaw exec-policy show`                                      | มุมมองที่รวมแล้วของเครื่อง local                                                             |
| `openclaw exec-policy set` / `preset`                            | ซิงโครไนซ์ policy ที่ร้องขอแบบ local กับไฟล์การอนุมัติของโฮสต์ local ในขั้นตอนเดียว |

เมื่อ scope แบบ local ร้องขอ `host=node`, `exec-policy show` จะรายงานว่า
scope นั้นถูกจัดการโดย node ขณะ runtime แทนที่จะแสร้งว่าไฟล์การอนุมัติแบบ local
เป็นแหล่งความจริง

หาก UI ของ companion app **ไม่พร้อมใช้งาน** คำขอใดก็ตามที่โดยปกติจะ
แสดง prompt จะถูกตัดสินด้วย **ask fallback** (ค่าเริ่มต้น: `deny`)

<Tip>
ไคลเอนต์อนุมัติแบบ native chat สามารถใส่ affordance เฉพาะช่องทางไว้ล่วงหน้าบน
ข้อความอนุมัติที่รอดำเนินการได้ ตัวอย่างเช่น Matrix ใส่ทางลัด reaction
(`✅` อนุญาตหนึ่งครั้ง, `❌` ปฏิเสธ, `♾️` อนุญาตเสมอ) ขณะที่ยังคงเหลือ
คำสั่ง `/approve ...` ในข้อความไว้เป็น fallback
</Tip>

## ใช้กับที่ใด

การอนุมัติ Exec จะถูกบังคับใช้แบบ local บน execution host:

- **Gateway host** → โปรเซส `openclaw` บนเครื่อง gateway
- **Node host** → node runner (macOS companion app หรือ headless node host)

### โมเดลความไว้วางใจ

- ผู้เรียกที่ผ่านการยืนยันตัวตนกับ Gateway ถือเป็น operator ที่เชื่อถือได้สำหรับ Gateway นั้น
- node ที่จับคู่แล้วขยายความสามารถของ operator ที่เชื่อถือได้นั้นไปยัง node host
- การอนุมัติ Exec ลดความเสี่ยงจากการรันโดยไม่ตั้งใจ แต่ **ไม่ใช่** ขอบเขตการยืนยันตัวตนรายผู้ใช้หรือ policy filesystem แบบอ่านอย่างเดียว
- เมื่ออนุมัติแล้ว คำสั่งสามารถเปลี่ยนไฟล์ได้ตามสิทธิ์ filesystem ของโฮสต์หรือ sandbox ที่เลือกไว้
- การรันบน node-host ที่ได้รับอนุมัติจะผูกบริบทการรันตาม canonical: cwd แบบ canonical, argv ที่ตรงเป๊ะ, env binding เมื่อมี และ path ของ executable ที่ pin ไว้เมื่อใช้ได้
- สำหรับสคริปต์ shell และการเรียกไฟล์ interpreter/runtime โดยตรง OpenClaw ยังพยายามผูก operand ไฟล์ local ที่เป็นรูปธรรมหนึ่งไฟล์ หากไฟล์ที่ผูกไว้นั้นเปลี่ยนหลังอนุมัติแต่ก่อนรัน การรันจะถูกปฏิเสธแทนที่จะรันเนื้อหาที่ drift ไปแล้ว
- การผูกไฟล์เป็นแบบ best-effort โดยตั้งใจ **ไม่ใช่** โมเดลเชิงความหมายที่ครบถ้วนของทุก path loader ของ interpreter/runtime หากโหมดอนุมัติไม่สามารถระบุไฟล์ local ที่เป็นรูปธรรมหนึ่งไฟล์อย่างแน่ชัดเพื่อผูกได้ ระบบจะปฏิเสธการออกสิทธิ์ให้รันแบบมี approval-backed แทนที่จะแสร้งว่าครอบคลุมครบถ้วน

### การแยกบน macOS

- **node host service** ส่งต่อ `system.run` ไปยัง **macOS app** ผ่าน local IPC
- **macOS app** บังคับใช้การอนุมัติและรันคำสั่งในบริบท UI

## การตั้งค่าและที่จัดเก็บ

การอนุมัติอยู่ในไฟล์ JSON แบบ local บน execution host:

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

## ปุ่มปรับ policy

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - บล็อกคำขอ host exec ทั้งหมด
  - `allowlist` - อนุญาตเฉพาะคำสั่งที่อยู่ใน allowlist
  - `full` - อนุญาตทุกอย่าง (เทียบเท่ากับ elevated)

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - ไม่แสดง prompt เลย
  - `on-miss` - แสดง prompt เฉพาะเมื่อ allowlist ไม่ match
  - `always` - แสดง prompt กับทุกคำสั่ง ความไว้วางใจถาวรแบบ `allow-always` จะ **ไม่** ระงับ prompt เมื่อโหมด ask ที่มีผลจริงคือ `always`

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  วิธีตัดสินเมื่อจำเป็นต้องแสดง prompt แต่ไม่มี UI ที่เข้าถึงได้

- `deny` - บล็อก
- `allowlist` - อนุญาตเฉพาะเมื่อ match กับ allowlist
- `full` - อนุญาต

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  เมื่อเป็น `true`, OpenClaw จะถือว่ารูปแบบ inline code-eval ต้องใช้งานผ่านการอนุมัติเท่านั้น
  แม้ตัว binary ของ interpreter เองจะอยู่ใน allowlist แล้วก็ตาม เป็น defense-in-depth
  สำหรับ loader ของ interpreter ที่ map เข้ากับ operand ไฟล์ที่เสถียรหนึ่งไฟล์ได้ไม่สะอาด
</ParamField>

ตัวอย่างที่ strict mode ตรวจจับได้:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

ใน strict mode คำสั่งเหล่านี้ยังต้องการการอนุมัติอย่างชัดเจน และ
`allow-always` จะไม่คงรายการ allowlist ใหม่สำหรับคำสั่งเหล่านี้
โดยอัตโนมัติ

## โหมด YOLO (ไม่มีการอนุมัติ)

หากต้องการให้ host exec รันโดยไม่มี prompt การอนุมัติ คุณต้องเปิด
policy **ทั้งสอง** ชั้น - policy exec ที่ร้องขอใน config ของ OpenClaw
(`tools.exec.*`) **และ** policy การอนุมัติแบบ host-local ใน
`~/.openclaw/exec-approvals.json`

YOLO คือพฤติกรรมเริ่มต้นของโฮสต์ เว้นแต่คุณจะปรับให้เข้มงวดขึ้นอย่างชัดเจน:

| ชั้น                 | การตั้งค่า YOLO               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` บน `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**ข้อแตกต่างสำคัญ:**

- `tools.exec.host=auto` เลือกว่าจะให้ exec รัน **ที่ใด**: sandbox เมื่อพร้อมใช้งาน มิฉะนั้นใช้ gateway
- YOLO เลือกว่า host exec ได้รับอนุมัติ **อย่างไร**: `security=full` รวมกับ `ask=off`
- ในโหมด YOLO, OpenClaw จะ **ไม่** เพิ่ม gate อนุมัติ command-obfuscation แบบ heuristic แยกต่างหาก หรือชั้นปฏิเสธ script-preflight เพิ่มเหนือ policy host exec ที่กำหนดค่าไว้
- `auto` ไม่ได้ทำให้การ route ไป gateway เป็น override ฟรีจากเซสชัน sandboxed คำขอรายครั้ง `host=node` ได้รับอนุญาตจาก `auto`; `host=gateway` ได้รับอนุญาตจาก `auto` เฉพาะเมื่อไม่มี sandbox runtime ที่ active อยู่ สำหรับค่าเริ่มต้นแบบ non-auto ที่เสถียร ให้ตั้ง `tools.exec.host` หรือใช้ `/exec host=...` อย่างชัดเจน

</Warning>

provider ที่ backed โดย CLI ซึ่งเปิดเผยโหมด permission แบบ noninteractive ของตัวเอง
สามารถทำตาม policy นี้ได้ Claude CLI เพิ่ม
`--permission-mode bypassPermissions` เมื่อ policy exec ที่ OpenClaw ร้องขอ
เป็น YOLO override พฤติกรรม backend นั้นด้วย args ของ Claude ที่ระบุชัดเจน
ใต้ `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
ตัวอย่างเช่น `--permission-mode default`, `acceptEdits` หรือ
`bypassPermissions`

หากต้องการการตั้งค่าที่ conservative กว่านี้ ให้ปรับชั้นใดชั้นหนึ่งกลับไปเป็น
`allowlist` / `on-miss` หรือ `deny`

### การตั้งค่า gateway-host แบบถาวรที่ "ไม่ต้อง prompt"

<Steps>
  <Step title="ตั้ง policy config ที่ร้องขอ">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="จับคู่ไฟล์การอนุมัติของโฮสต์">
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

### ทางลัด local

```bash
openclaw exec-policy preset yolo
```

ทางลัด local นี้อัปเดตทั้งสองอย่าง:

- `tools.exec.host/security/ask` แบบ local
- ค่าเริ่มต้นของ `~/.openclaw/exec-approvals.json` แบบ local

ตั้งใจให้เป็น local-only หากต้องการเปลี่ยนการอนุมัติของ gateway-host หรือ node-host
จากระยะไกล ให้ใช้ `openclaw approvals set --gateway` หรือ
`openclaw approvals set --node <id|name|ip>`

### Node host

สำหรับ node host ให้ใช้ไฟล์การอนุมัติเดียวกันบน node นั้นแทน:

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
**ข้อจำกัดแบบ local-only:**

- `openclaw exec-policy` ไม่ซิงโครไนซ์การอนุมัติของ node
- `openclaw exec-policy set --host node` ถูกปฏิเสธ
- การอนุมัติ node exec ถูกดึงจาก node ขณะ runtime ดังนั้นการอัปเดตที่ target ไปยัง node ต้องใช้ `openclaw approvals --node ...`

</Note>

### ทางลัดเฉพาะเซสชัน

- `/exec security=full ask=off` เปลี่ยนเฉพาะเซสชันปัจจุบัน
- `/elevated full` เป็นทางลัด break-glass ที่ข้ามการอนุมัติ exec สำหรับเซสชันนั้นด้วย

หากไฟล์การอนุมัติของโฮสต์ยังคงเข้มงวดกว่า config, host
policy ที่เข้มงวดกว่าจะยังเป็นฝ่ายชนะ

## Allowlist (ต่อเอเจนต์)

Allowlist เป็นแบบ **ต่อเอเจนต์** หากมีหลายเอเจนต์ ให้สลับว่าเอเจนต์ใด
ที่คุณกำลังแก้ไขใน macOS app Pattern คือการ match แบบ glob

Pattern อาจเป็น glob ของ binary path ที่ resolve แล้ว หรือ glob ของชื่อคำสั่งแบบ bare ก็ได้
ชื่อแบบ bare จะ match เฉพาะคำสั่งที่เรียกผ่าน `PATH` ดังนั้น `rg` จึง match
`/opt/homebrew/bin/rg` ได้เมื่อคำสั่งคือ `rg` แต่ **ไม่** match `./rg` หรือ
`/tmp/rg` ใช้ path glob เมื่อคุณต้องการเชื่อถือ binary location ที่เฉพาะเจาะจงหนึ่งแห่ง

รายการ `agents.default` แบบ legacy จะถูก migrate เป็น `agents.main` ตอน load
shell chain เช่น `echo ok && pwd` ยังต้องให้ segment ระดับบนสุดทุก segment
ผ่านกฎ allowlist

ตัวอย่าง:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### การจำกัด arguments ด้วย argPattern

เพิ่ม `argPattern` เมื่อรายการ allowlist ควร match กับ binary และ
รูปทรง argument ที่เฉพาะเจาะจง OpenClaw ประเมิน regular expression
กับ arguments ของคำสั่งที่ parse แล้ว โดยไม่รวม token executable
(`argv[0]`) สำหรับรายการที่เขียนด้วยมือ arguments จะถูก join ด้วย
ช่องว่างหนึ่งช่อง ดังนั้นให้ anchor pattern เมื่อต้องการ exact match

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

รายการนั้นอนุญาต `python3 safe.py`; `python3 other.py` คือ allowlist
miss หากมีรายการแบบ path-only สำหรับ binary เดียวกันอยู่ด้วย arguments
ที่ไม่ match ยังสามารถ fallback ไปยังรายการแบบ path-only นั้นได้
ละเว้นรายการแบบ path-only เมื่อเป้าหมายคือการจำกัด binary ไว้กับ arguments ที่ประกาศไว้

รายการที่บันทึกโดย flow การอนุมัติสามารถใช้รูปแบบตัวคั่นภายในสำหรับ
การ match argv แบบ exact ได้ แนะนำให้ใช้ UI หรือ approval flow เพื่อ regenerate รายการเหล่านั้น
แทนการแก้ไขค่าที่ encode ไว้ด้วยมือ หาก OpenClaw ไม่สามารถ
parse argv สำหรับ command segment ได้ รายการที่มี `argPattern` จะไม่ match

รายการ allowlist แต่ละรายการรองรับ:

| ฟิลด์              | ความหมาย                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | glob ของพาธไบนารีที่ resolve แล้ว หรือ glob ของชื่อคำสั่งแบบเปล่า |
| `argPattern`       | regex ของ argv ที่ไม่บังคับ; รายการที่ละไว้จะตรงตามพาธเท่านั้น |
| `id`               | UUID ที่เสถียรซึ่งใช้สำหรับตัวตนใน UI                              |
| `source`           | แหล่งที่มาของรายการ เช่น `allow-always`                          |
| `commandText`      | ข้อความคำสั่งที่จับไว้เมื่อโฟลว์การอนุมัติสร้างรายการนี้ |
| `lastUsedAt`       | timestamp การใช้งานล่าสุด                                           |
| `lastUsedCommand`  | คำสั่งล่าสุดที่ตรงกัน                                     |
| `lastResolvedPath` | พาธไบนารีล่าสุดที่ resolve ได้                                     |

## อนุญาต CLI ของ Skills โดยอัตโนมัติ

เมื่อเปิดใช้ **อนุญาต CLI ของ Skills โดยอัตโนมัติ** ไฟล์ปฏิบัติการที่อ้างอิงโดย
Skills ที่รู้จักจะถูกถือว่าอยู่ใน allowlist บน node (node ของ macOS หรือโฮสต์
node แบบ headless) วิธีนี้ใช้ `skills.bins` ผ่าน Gateway RPC เพื่อดึง
รายการ bin ของ skill ปิดใช้งานตัวเลือกนี้ถ้าคุณต้องการ allowlist แบบกำหนดเองอย่างเข้มงวด

<Warning>
- นี่คือ **allowlist เพื่อความสะดวกแบบ implicit** ซึ่งแยกจากรายการ allowlist ของพาธแบบกำหนดเอง
- ตั้งใจใช้สำหรับสภาพแวดล้อมของ operator ที่เชื่อถือได้ ซึ่ง Gateway และ node อยู่ใน trust boundary เดียวกัน
- หากคุณต้องการความเชื่อถือแบบ explicit อย่างเข้มงวด ให้คง `autoAllowSkills: false` ไว้และใช้เฉพาะรายการ allowlist ของพาธแบบกำหนดเอง

</Warning>

## Bin ที่ปลอดภัยและการส่งต่อการอนุมัติ

สำหรับ bin ที่ปลอดภัย (fast-path แบบ stdin-only), รายละเอียดการ binding ของ interpreter และ
วิธีส่งต่อ prompt การอนุมัติไปยัง Slack/Discord/Telegram (หรือเรียกใช้เป็น
client การอนุมัติแบบ native) ให้ดู
[การอนุมัติ Exec - ขั้นสูง](/th/tools/exec-approvals-advanced)

## การแก้ไข Control UI

ใช้การ์ด **Control UI → Nodes → การอนุมัติ Exec** เพื่อแก้ไขค่าเริ่มต้น,
override ต่อ agent และ allowlist เลือก scope (ค่าเริ่มต้นหรือ agent),
ปรับ policy, เพิ่ม/ลบ pattern ของ allowlist แล้วเลือก **บันทึก** UI
แสดง metadata การใช้งานล่าสุดต่อ pattern เพื่อให้คุณดูแลรายการให้เป็นระเบียบได้

ตัวเลือกเป้าหมายเลือก **Gateway** (การอนุมัติภายในเครื่อง) หรือ **Node**
Node ต้องประกาศ `system.execApprovals.get/set` (แอป macOS หรือ
โฮสต์ node แบบ headless) หาก node ยังไม่ประกาศ exec approvals
ให้แก้ไข `~/.openclaw/exec-approvals.json` ภายในเครื่องโดยตรง

CLI: `openclaw approvals` รองรับการแก้ไข gateway หรือ node - ดู
[CLI การอนุมัติ](/th/cli/approvals)

## โฟลว์การอนุมัติ

เมื่อจำเป็นต้องมี prompt gateway จะ broadcast
`exec.approval.requested` ไปยัง client ของ operator Control UI และแอป macOS
จะ resolve ผ่าน `exec.approval.resolve` จากนั้น gateway จะส่งต่อคำขอที่อนุมัติแล้วไปยัง
โฮสต์ node

สำหรับ `host=node` คำขออนุมัติจะมี payload `systemRunPlan`
แบบ canonical gateway ใช้ plan นั้นเป็นบริบท
command/cwd/session ที่ authoritative เมื่อส่งต่อคำขอ `system.run`
ที่ได้รับอนุมัติแล้ว

เรื่องนี้สำคัญต่อ latency ของการอนุมัติแบบ async:

- พาธ exec ของ node เตรียม plan แบบ canonical หนึ่งรายการไว้ล่วงหน้า
- บันทึกการอนุมัติจัดเก็บ plan นั้นและ metadata การ binding ของมัน
- เมื่ออนุมัติแล้ว การเรียก `system.run` ที่ส่งต่อขั้นสุดท้ายจะใช้ plan ที่จัดเก็บไว้แทนการเชื่อถือการแก้ไขของ caller ในภายหลัง
- หาก caller เปลี่ยน `command`, `rawCommand`, `cwd`, `agentId` หรือ `sessionKey` หลังจากสร้างคำขออนุมัติแล้ว gateway จะปฏิเสธ run ที่ส่งต่อว่าเป็น approval mismatch

## เหตุการณ์ระบบ

วงจรชีวิตของ Exec จะแสดงเป็นข้อความระบบ:

- `Exec running` (เฉพาะเมื่อคำสั่งเกิน threshold การแจ้งเตือนว่ากำลังรัน)
- `Exec finished`
- `Exec denied`

ข้อความเหล่านี้จะถูกโพสต์ไปยัง session ของ agent หลังจาก node รายงานเหตุการณ์
การอนุมัติ exec ที่โฮสต์โดย Gateway จะ emit เหตุการณ์วงจรชีวิตเดียวกันเมื่อ
คำสั่งเสร็จสิ้น (และอาจรวมถึงเมื่อรันนานกว่า threshold)
exec ที่ถูก gated ด้วยการอนุมัติจะใช้ id การอนุมัติซ้ำเป็น `runId` ใน
ข้อความเหล่านี้เพื่อให้เชื่อมโยงได้ง่าย

## พฤติกรรมเมื่อการอนุมัติถูกปฏิเสธ

เมื่อการอนุมัติ exec แบบ async ถูกปฏิเสธ OpenClaw จะป้องกันไม่ให้ agent
นำ output จากการรันก่อนหน้าของคำสั่งเดียวกันใน session กลับมาใช้
เหตุผลการปฏิเสธจะถูกส่งพร้อมคำแนะนำที่ชัดเจนว่าไม่มี command output
ซึ่งหยุด agent ไม่ให้กล่าวอ้างว่ามี output ใหม่หรือ
ทำซ้ำคำสั่งที่ถูกปฏิเสธด้วยผลลัพธ์เก่าจากการรันที่เคยสำเร็จก่อนหน้า

## ผลกระทบ

- **`full`** มีพลังมาก; ควรใช้ allowlist เมื่อเป็นไปได้
- **`ask`** ทำให้คุณยังอยู่ใน loop ขณะยังอนุมัติได้รวดเร็ว
- allowlist ต่อ agent ป้องกันไม่ให้การอนุมัติของ agent หนึ่งรั่วไปยัง agent อื่น
- การอนุมัติจะมีผลเฉพาะกับคำขอ host exec จาก **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น ผู้ส่งที่ไม่ได้รับอนุญาตไม่สามารถออก `/exec` ได้
- `/exec security=full` เป็นความสะดวกระดับ session สำหรับ operator ที่ได้รับอนุญาต และข้ามการอนุมัติโดยตั้งใจ หากต้องการบล็อก host exec อย่างเด็ดขาด ให้ตั้ง approvals security เป็น `deny` หรือปฏิเสธเครื่องมือ `exec` ผ่าน tool policy

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/th/tools/exec-approvals-advanced" icon="gear">
    Bin ที่ปลอดภัย, การ binding ของ interpreter และการส่งต่อการอนุมัติไปยังแชท
  </Card>
  <Card title="Exec tool" href="/th/tools/exec" icon="terminal">
    เครื่องมือเรียกใช้คำสั่ง shell
  </Card>
  <Card title="Elevated mode" href="/th/tools/elevated" icon="shield-exclamation">
    พาธ break-glass ที่ข้ามการอนุมัติด้วย
  </Card>
  <Card title="Sandboxing" href="/th/gateway/sandboxing" icon="box">
    โหมด sandbox และการเข้าถึง workspace
  </Card>
  <Card title="Security" href="/th/gateway/security" icon="lock">
    โมเดลความปลอดภัยและการ hardening
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/th/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    ควรใช้ control ใดในแต่ละกรณี
  </Card>
  <Card title="Skills" href="/th/tools/skills" icon="sparkles">
    พฤติกรรมอนุญาตอัตโนมัติที่รองรับด้วย Skill
  </Card>
</CardGroup>
