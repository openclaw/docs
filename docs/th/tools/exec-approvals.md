---
read_when:
    - การกำหนดค่าการอนุมัติ exec หรือรายการอนุญาต
    - การนำ UX การอนุมัติ exec ไปใช้ในแอป macOS
    - การตรวจสอบพรอมป์หลบหนีออกจากแซนด์บ็อกซ์และผลกระทบของพรอมป์เหล่านั้น
sidebarTitle: Exec approvals
summary: 'การอนุมัติการเรียกใช้คำสั่งบนโฮสต์: ตัวปรับนโยบาย รายการที่อนุญาต และเวิร์กโฟลว์แบบ YOLO/เข้มงวด'
title: การอนุมัติการเรียกใช้คำสั่ง
x-i18n:
    generated_at: "2026-05-06T09:34:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: c404fbc80624e31603cfc3f9ca6318534d53e0277af107600c726f97e11b223b
    source_path: tools/exec-approvals.md
    workflow: 16
---

การอนุมัติ exec คือ **แนวป้องกันของแอปคู่ / โฮสต์ Node** สำหรับอนุญาตให้
เอเจนต์ที่อยู่ในแซนด์บ็อกซ์เรียกใช้คำสั่งบนโฮสต์จริง (`gateway` หรือ `node`) กลไก
นิรภัยแบบ interlock: คำสั่งจะได้รับอนุญาตเฉพาะเมื่อ policy + allowlist +
การอนุมัติจากผู้ใช้ (ไม่บังคับ) เห็นพ้องกันทั้งหมด การอนุมัติ exec ซ้อนอยู่ **บน**
นโยบายเครื่องมือและ elevated gating (ยกเว้นเมื่อตั้ง elevated เป็น `full` ซึ่งจะ
ข้ามการอนุมัติ)

<Note>
นโยบายที่มีผลคือค่าที่ **เข้มงวดกว่า** ระหว่าง `tools.exec.*` กับค่าเริ่มต้นของการอนุมัติ
ถ้าละเว้นฟิลด์การอนุมัติ ค่า `tools.exec` จะถูกใช้แทน การ exec บนโฮสต์ยังใช้สถานะการอนุมัติภายในเครื่องนั้นด้วย - ค่า
`ask: "always"` เฉพาะโฮสต์ใน `~/.openclaw/exec-approvals.json` จะยังคง
แจ้งถามต่อไป แม้ว่าค่าเริ่มต้นของเซสชันหรือคอนฟิกจะขอ `ask: "on-miss"` ก็ตาม
</Note>

## ตรวจสอบนโยบายที่มีผล

| คำสั่ง                                                           | สิ่งที่แสดง                                                                           |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | นโยบายที่ร้องขอ แหล่งที่มาของนโยบายโฮสต์ และผลลัพธ์ที่มีผล                         |
| `openclaw exec-policy show`                                      | มุมมองที่ผสานแล้วของเครื่องในเครื่อง                                                 |
| `openclaw exec-policy set` / `preset`                            | ซิงโครไนซ์นโยบายที่ร้องขอในเครื่องกับไฟล์การอนุมัติของโฮสต์ในเครื่องในขั้นตอนเดียว |

เมื่อ scope ในเครื่องร้องขอ `host=node` คำสั่ง `exec-policy show` จะรายงานว่า
scope นั้นถูกจัดการโดย Node ณ runtime แทนที่จะทำเหมือนไฟล์การอนุมัติในเครื่อง
เป็นแหล่งความจริง

ถ้าอินเทอร์เฟซผู้ใช้ของแอปคู่ **ไม่พร้อมใช้งาน** คำขอใด ๆ ที่ปกติจะ
แจ้งถามจะถูกตัดสินด้วย **ask fallback** (ค่าเริ่มต้น: `deny`)

<Tip>
ไคลเอนต์อนุมัติแชตแบบ native สามารถเติม affordance เฉพาะช่องทางในข้อความการอนุมัติที่รอดำเนินการได้
ตัวอย่างเช่น Matrix เติมทางลัดด้วย reaction
(`✅` อนุญาตครั้งเดียว, `❌` ปฏิเสธ, `♾️` อนุญาตเสมอ) ขณะยังคงมีคำสั่ง
`/approve ...` ในข้อความเป็น fallback
</Tip>

## ใช้ที่ใด

การอนุมัติ exec ถูกบังคับใช้ภายในเครื่องบนโฮสต์ที่ดำเนินการ:

- **โฮสต์ Gateway** → โปรเซส `openclaw` บนเครื่อง Gateway
- **โฮสต์ Node** → ตัวรัน Node (แอปคู่บน macOS หรือโฮสต์ Node แบบ headless)

### โมเดลความเชื่อถือ

- ผู้เรียกที่ผ่านการยืนยันโดย Gateway เป็นผู้ปฏิบัติการที่เชื่อถือได้สำหรับ Gateway นั้น
- Node ที่จับคู่แล้วขยายความสามารถของผู้ปฏิบัติการที่เชื่อถือได้นั้นไปยังโฮสต์ Node
- การอนุมัติ exec ลดความเสี่ยงจากการดำเนินการโดยไม่ตั้งใจ แต่ **ไม่ใช่** ขอบเขตการยืนยันตัวตนแบบรายผู้ใช้
- การรันบนโฮสต์ Node ที่อนุมัติแล้วจะผูก context การดำเนินการตาม canonical: cwd ตาม canonical, argv ที่แน่นอน, การผูก env เมื่อมี และ path ของ executable ที่ปักหมุดไว้เมื่อใช้ได้
- สำหรับ shell script และการเรียกไฟล์ interpreter/runtime โดยตรง OpenClaw ยังพยายามผูก operand ของไฟล์ภายในเครื่องที่เป็นรูปธรรมหนึ่งรายการด้วย หากไฟล์ที่ผูกไว้นั้นเปลี่ยนหลังการอนุมัติแต่ก่อนการดำเนินการ การรันจะถูกปฏิเสธแทนที่จะดำเนินการกับเนื้อหาที่ drift ไปแล้ว
- การผูกไฟล์ตั้งใจให้เป็นแบบ best-effort **ไม่ใช่** โมเดลเชิงความหมายที่ครบถ้วนของทุก path การโหลดของ interpreter/runtime หากโหมดการอนุมัติไม่สามารถระบุไฟล์ภายในเครื่องที่เป็นรูปธรรมได้อย่างแน่นอนหนึ่งไฟล์เพื่อผูก ก็จะปฏิเสธการออกการรันที่รองรับด้วยการอนุมัติ แทนที่จะทำเหมือนครอบคลุมครบถ้วน

### การแยกบน macOS

- **บริการโฮสต์ Node** ส่งต่อ `system.run` ไปยัง **แอป macOS** ผ่าน IPC ภายในเครื่อง
- **แอป macOS** บังคับใช้การอนุมัติและดำเนินการคำสั่งใน context ของอินเทอร์เฟซผู้ใช้

## การตั้งค่าและที่จัดเก็บ

การอนุมัติอยู่ในไฟล์ JSON ภายในเครื่องบนโฮสต์ที่ดำเนินการ:

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

## ตัวปรับนโยบาย

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - บล็อกคำขอ exec บนโฮสต์ทั้งหมด
  - `allowlist` - อนุญาตเฉพาะคำสั่งที่อยู่ใน allowlist
  - `full` - อนุญาตทุกอย่าง (เทียบเท่า elevated)

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - ไม่แจ้งถาม
  - `on-miss` - แจ้งถามเฉพาะเมื่อ allowlist ไม่ตรงกัน
  - `always` - แจ้งถามทุกคำสั่ง ความเชื่อถือถาวรแบบ `allow-always` จะ **ไม่** ระงับการแจ้งถามเมื่อโหมด ask ที่มีผลคือ `always`

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  วิธีตัดสินเมื่อจำเป็นต้องแจ้งถามแต่ไม่สามารถเข้าถึงอินเทอร์เฟซผู้ใช้ได้

- `deny` - บล็อก
- `allowlist` - อนุญาตเฉพาะเมื่อ allowlist ตรงกัน
- `full` - อนุญาต

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  เมื่อเป็น `true` OpenClaw จะถือว่ารูปแบบ code-eval แบบ inline ต้องอนุมัติเท่านั้น
  แม้ว่า binary ของ interpreter เองจะอยู่ใน allowlist แล้วก็ตาม เป็น defense-in-depth
  สำหรับ loader ของ interpreter ที่ไม่สามารถ map กับ operand ของไฟล์ที่เสถียรหนึ่งไฟล์
  ได้อย่างชัดเจน
</ParamField>

ตัวอย่างที่โหมด strict จับได้:

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

## โหมด YOLO (ไม่มีการอนุมัติ)

ถ้าคุณต้องการให้ exec บนโฮสต์รันโดยไม่มี prompt การอนุมัติ คุณต้องเปิด
นโยบาย **ทั้งสอง** ชั้น - นโยบาย exec ที่ร้องขอในคอนฟิก OpenClaw
(`tools.exec.*`) **และ** นโยบายการอนุมัติเฉพาะโฮสต์ใน
`~/.openclaw/exec-approvals.json`

YOLO เป็นพฤติกรรมเริ่มต้นของโฮสต์ เว้นแต่คุณจะทำให้เข้มงวดขึ้นอย่างชัดเจน:

| ชั้น                  | การตั้งค่า YOLO           |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` บน `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**ข้อแตกต่างสำคัญ:**

- `tools.exec.host=auto` เลือกว่า exec จะรัน **ที่ใด**: แซนด์บ็อกซ์เมื่อพร้อมใช้งาน ไม่เช่นนั้นคือ Gateway
- YOLO เลือกว่า exec บนโฮสต์จะถูกอนุมัติ **อย่างไร**: `security=full` พร้อม `ask=off`
- ในโหมด YOLO OpenClaw จะ **ไม่** เพิ่ม gate การอนุมัติคำสั่งที่สับสนด้วย heuristic หรือชั้นการปฏิเสธ preflight ของ script แยกต่างหากบน policy exec ของโฮสต์ที่คอนฟิกไว้
- `auto` ไม่ได้ทำให้การ route ไป Gateway เป็นการ override ฟรีจากเซสชันที่อยู่ในแซนด์บ็อกซ์ คำขอรายครั้ง `host=node` อนุญาตจาก `auto`; `host=gateway` อนุญาตจาก `auto` เฉพาะเมื่อไม่มี sandbox runtime ทำงานอยู่ สำหรับค่าเริ่มต้นที่เสถียรและไม่ใช่ auto ให้ตั้ง `tools.exec.host` หรือใช้ `/exec host=...` อย่างชัดเจน

</Warning>

ผู้ให้บริการที่รองรับโดย CLI ซึ่งเปิดเผยโหมดสิทธิ์แบบ noninteractive ของตัวเอง
สามารถปฏิบัติตามนโยบายนี้ได้ Claude CLI เพิ่ม
`--permission-mode bypassPermissions` เมื่อนโยบาย exec ที่ OpenClaw ร้องขอ
เป็น YOLO override พฤติกรรม backend นั้นด้วย args ของ Claude อย่างชัดเจน
ภายใต้ `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
เช่น `--permission-mode default`, `acceptEdits`, หรือ
`bypassPermissions`

ถ้าคุณต้องการการตั้งค่าที่ระมัดระวังกว่า ให้ปรับชั้นใดชั้นหนึ่งกลับเป็น
`allowlist` / `on-miss` หรือ `deny`

### การตั้งค่า "ไม่ต้องแจ้งถามอีก" แบบถาวรสำหรับโฮสต์ Gateway

<Steps>
  <Step title="ตั้งนโยบายคอนฟิกที่ร้องขอ">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="ทำให้ไฟล์การอนุมัติของโฮสต์ตรงกัน">
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

ทางลัดภายในเครื่องนั้นอัปเดตทั้งสองอย่าง:

- `tools.exec.host/security/ask` ภายในเครื่อง
- ค่าเริ่มต้นของ `~/.openclaw/exec-approvals.json` ภายในเครื่อง

ตั้งใจให้ใช้เฉพาะภายในเครื่องเท่านั้น หากต้องการเปลี่ยนการอนุมัติของโฮสต์ Gateway หรือโฮสต์ Node
จากระยะไกล ให้ใช้ `openclaw approvals set --gateway` หรือ
`openclaw approvals set --node <id|name|ip>`

### โฮสต์ Node

สำหรับโฮสต์ Node ให้ใช้ไฟล์การอนุมัติเดียวกันบน Node นั้นแทน:

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

- `openclaw exec-policy` ไม่ซิงโครไนซ์การอนุมัติของ Node
- `openclaw exec-policy set --host node` ถูกปฏิเสธ
- การอนุมัติ exec ของ Node ถูกดึงจาก Node ณ runtime ดังนั้นการอัปเดตที่เจาะจง Node ต้องใช้ `openclaw approvals --node ...`

</Note>

### ทางลัดเฉพาะเซสชัน

- `/exec security=full ask=off` เปลี่ยนเฉพาะเซสชันปัจจุบัน
- `/elevated full` เป็นทางลัดแบบ break-glass ที่ยังข้ามการอนุมัติ exec สำหรับเซสชันนั้นด้วย

ถ้าไฟล์การอนุมัติของโฮสต์ยังเข้มงวดกว่าคอนฟิก นโยบายของโฮสต์ที่เข้มงวดกว่า
ยังคงชนะ

## Allowlist (ต่อเอเจนต์)

Allowlist เป็นแบบ **ต่อเอเจนต์** หากมีหลายเอเจนต์ ให้สลับเอเจนต์ที่คุณ
กำลังแก้ไขในแอป macOS pattern เป็นการจับคู่แบบ glob

Pattern อาจเป็น glob ของ path binary ที่ resolve แล้ว หรือ glob ของชื่อคำสั่งล้วน
ชื่อแบบล้วนจับคู่เฉพาะคำสั่งที่เรียกผ่าน `PATH` ดังนั้น `rg` สามารถจับคู่
`/opt/homebrew/bin/rg` เมื่อคำสั่งคือ `rg` แต่ **ไม่ใช่** `./rg` หรือ
`/tmp/rg` ใช้ path glob เมื่อคุณต้องการเชื่อถือ location ของ binary
ที่เฉพาะเจาะจงหนึ่งแห่ง

รายการ legacy `agents.default` จะถูก migrate เป็น `agents.main` ตอนโหลด
shell chain เช่น `echo ok && pwd` ยังต้องให้ทุก segment ระดับบนสุด
ผ่านกฎ allowlist

ตัวอย่าง:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### จำกัด arguments ด้วย argPattern

เพิ่ม `argPattern` เมื่อรายการ allowlist ควรจับคู่ binary และรูปทรงของ argument
ที่เฉพาะเจาะจง OpenClaw ประเมิน regular expression กับ argument ของคำสั่งที่ parse แล้ว
โดยไม่รวม token executable (`argv[0]`) สำหรับรายการที่เขียนด้วยมือ argument จะถูก join ด้วย
ช่องว่างเดียว ดังนั้นให้ anchor pattern เมื่อต้องการการจับคู่ที่แน่นอน

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

รายการนั้นอนุญาต `python3 safe.py`; `python3 other.py` เป็น allowlist
miss หากมีรายการแบบ path-only สำหรับ binary เดียวกันอยู่ด้วย argument ที่ไม่ตรงกัน
ยังสามารถ fallback ไปยังรายการ path-only นั้นได้ ให้ละเว้นรายการ path-only
เมื่อเป้าหมายคือจำกัด binary ให้ใช้เฉพาะ argument ที่ประกาศไว้

รายการที่บันทึกโดย flow การอนุมัติสามารถใช้รูปแบบตัวคั่นภายในสำหรับ
การจับคู่ argv ที่แน่นอน แนะนำให้ใช้ flow ของอินเทอร์เฟซผู้ใช้หรือ flow การอนุมัติเพื่อสร้างรายการเหล่านั้นใหม่
แทนการแก้ไขค่าที่เข้ารหัสด้วยมือ หาก OpenClaw ไม่สามารถ parse argv สำหรับ segment คำสั่งได้
รายการที่มี `argPattern` จะไม่จับคู่

แต่ละรายการ allowlist รองรับ:

| ฟิลด์              | ความหมาย                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | glob ของพาธไบนารีที่ resolve แล้ว หรือ glob ของชื่อคำสั่งแบบล้วน           |
| `argPattern`       | regex ของ argv แบบไม่บังคับ; รายการที่ละไว้จะตรวจเฉพาะพาธ            |
| `id`               | UUID ที่เสถียรสำหรับตัวตนใน UI                              |
| `source`           | แหล่งที่มาของรายการ เช่น `allow-always`                          |
| `commandText`      | ข้อความคำสั่งที่บันทึกเมื่อโฟลว์การอนุมัติสร้างรายการ |
| `lastUsedAt`       | เวลาประทับที่ใช้ล่าสุด                                           |
| `lastUsedCommand`  | คำสั่งล่าสุดที่ตรงกัน                                     |
| `lastResolvedPath` | พาธไบนารีล่าสุดที่ resolve แล้ว                                     |

## CLI ของ Skills ที่อนุญาตอัตโนมัติ

เมื่อเปิดใช้ **อนุญาต CLI ของ Skills อัตโนมัติ** ไฟล์ปฏิบัติการที่อ้างอิงโดย
Skills ที่รู้จักจะถือว่าอยู่ในรายการอนุญาตบน Node (Node ของ macOS หรือโฮสต์
Node แบบไม่มีหน้าจอ) การทำงานนี้ใช้ `skills.bins` ผ่าน Gateway RPC เพื่อดึง
รายการ bin ของ Skills ปิดใช้ตัวเลือกนี้หากคุณต้องการรายการอนุญาตแบบกำหนดเองอย่างเข้มงวด

<Warning>
- นี่คือ **รายการอนุญาตเพื่อความสะดวกโดยนัย** ซึ่งแยกจากรายการอนุญาตพาธแบบกำหนดเอง
- มีไว้สำหรับสภาพแวดล้อมผู้ปฏิบัติงานที่เชื่อถือได้ ซึ่ง Gateway และ Node อยู่ในขอบเขตความเชื่อถือเดียวกัน
- หากคุณต้องการความเชื่อถือแบบระบุชัดอย่างเข้มงวด ให้คง `autoAllowSkills: false` ไว้และใช้เฉพาะรายการอนุญาตพาธแบบกำหนดเองเท่านั้น

</Warning>

## bin ที่ปลอดภัยและการส่งต่อการอนุมัติ

สำหรับ bin ที่ปลอดภัย (เส้นทางเร็วแบบ stdin-only), รายละเอียดการผูก interpreter และ
วิธีส่งต่อพรอมต์การอนุมัติไปยัง Slack/Discord/Telegram (หรือเรียกใช้เป็น
ไคลเอนต์การอนุมัติแบบ native) โปรดดู
[การอนุมัติ Exec - ขั้นสูง](/th/tools/exec-approvals-advanced)

## การแก้ไขใน Control UI

ใช้การ์ด **Control UI → Nodes → Exec approvals** เพื่อแก้ไขค่าเริ่มต้น,
การ override ราย agent และรายการอนุญาต เลือกขอบเขต (Defaults หรือ agent),
ปรับนโยบาย เพิ่ม/ลบรูปแบบรายการอนุญาต แล้วกด **Save** UI
จะแสดง metadata การใช้ล่าสุดต่อรูปแบบ เพื่อให้คุณดูแลรายการให้เป็นระเบียบได้

ตัวเลือกเป้าหมายจะเลือก **Gateway** (การอนุมัติแบบ local) หรือ **Node**
Node ต้องประกาศ `system.execApprovals.get/set` (แอป macOS หรือ
โฮสต์ Node แบบไม่มีหน้าจอ) หาก Node ยังไม่ประกาศ exec approvals
ให้แก้ไข `~/.openclaw/exec-approvals.json` ภายในเครื่องของ Node นั้นโดยตรง

CLI: `openclaw approvals` รองรับการแก้ไข Gateway หรือ Node - ดู
[CLI การอนุมัติ](/th/cli/approvals)

## โฟลว์การอนุมัติ

เมื่อจำเป็นต้องมีพรอมต์ Gateway จะ broadcast
`exec.approval.requested` ไปยังไคลเอนต์ผู้ปฏิบัติงาน Control UI และแอป macOS
จะ resolve ผ่าน `exec.approval.resolve` จากนั้น Gateway จะส่งต่อคำขอที่
อนุมัติแล้วไปยังโฮสต์ Node

สำหรับ `host=node` คำขออนุมัติจะมี payload `systemRunPlan`
แบบ canonical Gateway ใช้แผนนั้นเป็นบริบทคำสั่ง/cwd/session ที่เชื่อถือได้
เมื่อส่งต่อคำขอ `system.run` ที่อนุมัติแล้ว

สิ่งนี้สำคัญต่อ latency ของการอนุมัติแบบ async:

- พาธ exec ของ Node เตรียมแผน canonical หนึ่งชุดไว้ล่วงหน้า
- ระเบียนการอนุมัติจะเก็บแผนนั้นและ metadata การผูกของแผน
- เมื่ออนุมัติแล้ว การเรียก `system.run` สุดท้ายที่ถูกส่งต่อจะใช้แผนที่เก็บไว้ซ้ำ แทนการเชื่อถือการแก้ไขภายหลังจากผู้เรียก
- หากผู้เรียกเปลี่ยน `command`, `rawCommand`, `cwd`, `agentId` หรือ `sessionKey` หลังจากสร้างคำขออนุมัติแล้ว Gateway จะปฏิเสธการ run ที่ส่งต่อว่าเป็นการอนุมัติที่ไม่ตรงกัน

## เหตุการณ์ระบบ

วงจรชีวิต Exec จะแสดงเป็นข้อความระบบ:

- `Exec running` (เฉพาะเมื่อคำสั่งเกินเกณฑ์การแจ้งเตือนว่ากำลังรัน)
- `Exec finished`
- `Exec denied`

ข้อความเหล่านี้จะถูกโพสต์ไปยัง session ของ agent หลังจาก Node รายงานเหตุการณ์
การอนุมัติ exec ที่โฮสต์โดย Gateway จะปล่อยเหตุการณ์วงจรชีวิตเดียวกันเมื่อ
คำสั่งเสร็จสิ้น (และอาจรวมถึงเมื่อรันนานกว่าเกณฑ์) exec ที่ถูก gate ด้วย
การอนุมัติจะใช้ id การอนุมัติซ้ำเป็น `runId` ในข้อความเหล่านี้เพื่อให้เชื่อมโยงกันได้ง่าย

## พฤติกรรมเมื่อปฏิเสธการอนุมัติ

เมื่อการอนุมัติ exec แบบ async ถูกปฏิเสธ OpenClaw จะป้องกันไม่ให้ agent
นำ output จากการ run ก่อนหน้าของคำสั่งเดียวกันใน session มาใช้ซ้ำ
เหตุผลการปฏิเสธจะถูกส่งไปพร้อมคำแนะนำที่ชัดเจนว่าไม่มี output ของคำสั่ง
ซึ่งหยุดไม่ให้ agent อ้างว่ามี output ใหม่ หรือทำซ้ำคำสั่งที่ถูกปฏิเสธด้วยผลลัพธ์เก่าจาก
การ run ก่อนหน้าที่สำเร็จ

## ผลที่ตามมา

- **`full`** มีอำนาจสูง; ควรใช้รายการอนุญาตเมื่อเป็นไปได้
- **`ask`** ทำให้คุณยังอยู่ในลูป ขณะยังอนุญาตให้อนุมัติได้รวดเร็ว
- รายการอนุญาตราย agent ป้องกันไม่ให้การอนุมัติของ agent หนึ่งรั่วไปยังตัวอื่น
- การอนุมัติใช้กับคำขอ exec ฝั่งโฮสต์จาก **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น ผู้ส่งที่ไม่ได้รับอนุญาตไม่สามารถออก `/exec` ได้
- `/exec security=full` เป็นความสะดวกระดับ session สำหรับผู้ปฏิบัติงานที่ได้รับอนุญาต และข้ามการอนุมัติโดยตั้งใจ หากต้องการบล็อก exec ฝั่งโฮสต์อย่างเด็ดขาด ให้ตั้งความปลอดภัยการอนุมัติเป็น `deny` หรือปฏิเสธเครื่องมือ `exec` ผ่านนโยบายเครื่องมือ

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/th/tools/exec-approvals-advanced" icon="gear">
    bin ที่ปลอดภัย, การผูก interpreter และการส่งต่อการอนุมัติไปยังแชต
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
    โมเดลความปลอดภัยและการเสริมความแข็งแกร่ง
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/th/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    เมื่อใดควรเลือกใช้การควบคุมแต่ละแบบ
  </Card>
  <Card title="Skills" href="/th/tools/skills" icon="sparkles">
    พฤติกรรมอนุญาตอัตโนมัติที่รองรับโดย Skills
  </Card>
</CardGroup>
