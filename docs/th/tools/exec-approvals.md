---
read_when:
    - การกำหนดค่าการอนุมัติ exec หรือรายการที่อนุญาต
    - การใช้งาน UX การอนุมัติ exec ในแอป macOS
    - กำลังทบทวนพรอมป์การหลบเลี่ยงแซนด์บ็อกซ์และผลกระทบของพรอมป์เหล่านั้น
sidebarTitle: Exec approvals
summary: 'การอนุมัติการรันคำสั่งบนโฮสต์: ตัวควบคุมนโยบาย รายการอนุญาต และเวิร์กโฟลว์ YOLO/strict'
title: การอนุมัติการเรียกใช้คำสั่ง
x-i18n:
    generated_at: "2026-06-27T18:27:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a4a5c9c56da458fdb25d5fe698df305af17188695d8befc1d4cfd8e8333e96
    source_path: tools/exec-approvals.md
    workflow: 16
---

การอนุมัติ exec คือ **แนวป้องกันของแอปคู่หู / โฮสต์ node** สำหรับให้
เอเจนต์ใน sandbox รันคำสั่งบนโฮสต์จริง (`gateway` หรือ `node`) เป็น
กลไกนิรภัย: อนุญาตคำสั่งได้ต่อเมื่อนโยบาย + allowlist +
การอนุมัติจากผู้ใช้ (ไม่บังคับ) เห็นตรงกันทั้งหมด การอนุมัติ exec ซ้อนอยู่ **เหนือ**
นโยบายเครื่องมือและเกตการยกระดับ (ยกเว้นเมื่อตั้ง elevated เป็น `full` ซึ่ง
จะข้ามการอนุมัติ)

สำหรับภาพรวมแบบเน้นโหมดของ `deny`, `allowlist`, `ask`, `auto`, `full`,
การแมป Codex Guardian และสิทธิ์ harness ของ ACPX โปรดดู
[โหมดสิทธิ์](/th/tools/permission-modes)

<Note>
นโยบายที่มีผลคือค่าที่ **เข้มงวดกว่า** ระหว่าง `tools.exec.*` และค่าเริ่มต้น
ของการอนุมัติ หากละเว้นฟิลด์การอนุมัติไว้ จะใช้ค่า `tools.exec`
Host exec ยังใช้สถานะการอนุมัติภายในเครื่องนั้นด้วย - ค่า
`ask: "always"` แบบ host-local ในไฟล์การอนุมัติของโฮสต์ที่ทำการรันจะยัง
ถามต่อไป แม้ค่าเริ่มต้นของเซสชันหรือ config จะขอ `ask: "on-miss"` ก็ตาม
</Note>

## การตรวจสอบนโยบายที่มีผล

| คำสั่ง                                                          | สิ่งที่แสดง                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | นโยบายที่ขอ แหล่งที่มานโยบายของโฮสต์ และผลลัพธ์ที่มีผล                       |
| `openclaw exec-policy show`                                      | มุมมองที่รวมแล้วของเครื่องภายใน                                                             |
| `openclaw exec-policy set` / `preset`                            | ซิงโครไนซ์นโยบายที่ขอในเครื่องกับไฟล์การอนุมัติของโฮสต์ภายในในขั้นตอนเดียว |

เมื่อ scope ภายในขอ `host=node` คำสั่ง `exec-policy show` จะรายงานว่า
scope นั้นถูกจัดการโดย node ขณะรัน แทนที่จะแสร้งว่าไฟล์การอนุมัติภายใน
คือแหล่งความจริง

หาก UI ของแอปคู่หู **ไม่พร้อมใช้งาน** คำขอใดก็ตามที่ปกติจะ
แสดง prompt จะถูกตัดสินด้วย **ask fallback** (ค่าเริ่มต้น: `deny`)

<Tip>
ไคลเอนต์อนุมัติในแชตแบบเนทีฟสามารถเติม affordance เฉพาะช่องทางลงใน
ข้อความอนุมัติที่รอดำเนินการได้ ตัวอย่างเช่น Matrix จะเติมทางลัดด้วยรีแอ็กชัน
(`✅` อนุญาตครั้งเดียว, `❌` ปฏิเสธ, `♾️` อนุญาตเสมอ) ขณะเดียวกันยังคงทิ้ง
คำสั่ง `/approve ...` ไว้ในข้อความเป็น fallback
</Tip>

## ใช้กับที่ใด

การอนุมัติ exec ถูกบังคับใช้ภายในเครื่องบนโฮสต์ที่ทำการรัน:

- **โฮสต์ Gateway** → โปรเซส `openclaw` บนเครื่อง gateway
- **โฮสต์ Node** → ตัวรัน node (แอปคู่หู macOS หรือโฮสต์ node แบบ headless)

### โมเดลความเชื่อถือ

- ผู้เรียกที่ผ่านการยืนยันตัวตนกับ Gateway ถือเป็นผู้ปฏิบัติการที่เชื่อถือได้สำหรับ Gateway นั้น
- node ที่จับคู่แล้วจะขยายความสามารถของผู้ปฏิบัติการที่เชื่อถือได้นั้นไปยังโฮสต์ node
- การอนุมัติ exec ลดความเสี่ยงจากการรันโดยไม่ตั้งใจ แต่ **ไม่ใช่** ขอบเขตการยืนยันตัวตนรายผู้ใช้หรือนโยบายระบบไฟล์แบบอ่านอย่างเดียว
- เมื่ออนุมัติแล้ว คำสั่งสามารถเปลี่ยนแปลงไฟล์ได้ตามสิทธิ์ระบบไฟล์ของโฮสต์หรือ sandbox ที่เลือก
- การรันบนโฮสต์ node ที่อนุมัติแล้วจะผูกบริบทการรันมาตรฐาน: cwd มาตรฐาน, argv ที่แน่นอน, การผูก env เมื่อมี และพาธ executable ที่ปักหมุดไว้เมื่อใช้ได้
- สำหรับสคริปต์ shell และการเรียกไฟล์ interpreter/runtime โดยตรง OpenClaw ยังพยายามผูก operand ไฟล์ภายในเครื่องที่เป็นรูปธรรมหนึ่งไฟล์ หากไฟล์ที่ผูกไว้นั้นเปลี่ยนหลังการอนุมัติแต่ก่อนรัน การรันจะถูกปฏิเสธแทนการรันเนื้อหาที่เปลี่ยนไป
- การผูกไฟล์เป็นแบบ best-effort โดยตั้งใจ **ไม่ใช่** โมเดลเชิงความหมายที่ครบถ้วนของทุกพาธ loader ของ interpreter/runtime หากโหมดอนุมัติไม่สามารถระบุไฟล์ภายในเครื่องที่เป็นรูปธรรมได้แน่นอนหนึ่งไฟล์เพื่อผูกไว้ ก็จะปฏิเสธการสร้างการรันที่อิงการอนุมัติ แทนที่จะแสร้งว่าครอบคลุมทั้งหมด

### การแยกใน macOS

- **บริการโฮสต์ node** ส่งต่อ `system.run` ไปยัง **แอป macOS** ผ่าน IPC ภายใน
- **แอป macOS** บังคับใช้การอนุมัติและรันคำสั่งในบริบท UI

## การตั้งค่าและที่จัดเก็บ

การอนุมัติอยู่ในไฟล์ JSON ภายในเครื่องบนโฮสต์ที่ทำการรัน เมื่อ
ตั้งค่า `OPENCLAW_STATE_DIR` ไฟล์จะอยู่ตามไดเรกทอรีสถานะนั้น
มิฉะนั้นจะใช้ไดเรกทอรีสถานะเริ่มต้นของ OpenClaw:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# otherwise
~/.openclaw/exec-approvals.json
```

socket การอนุมัติเริ่มต้นใช้ root เดียวกัน:
`$OPENCLAW_STATE_DIR/exec-approvals.sock` หรือ
`~/.openclaw/exec-approvals.sock` เมื่อไม่ได้ตั้งค่าตัวแปร

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

## ปุ่มปรับนโยบาย

### `tools.exec.mode`

`tools.exec.mode` คือพื้นผิวนโยบายที่ทำให้เป็นมาตรฐานแล้วที่แนะนำสำหรับ host exec
ค่าคือ:

- `deny` - บล็อก host exec
- `allowlist` - รันเฉพาะคำสั่งใน allowlist โดยไม่ถาม
- `ask` - ใช้นโยบาย allowlist และถามเมื่อไม่ตรงกัน
- `auto` - ใช้นโยบาย allowlist, รันรายการที่ตรงกันแบบกำหนดได้โดยตรง และส่งรายการที่พลาดการอนุมัติผ่านตัวรีวิวอัตโนมัติเนทีฟของ OpenClaw ก่อน fallback ไปยังเส้นทางอนุมัติจากมนุษย์
- `full` - รัน host exec โดยไม่มี prompt การอนุมัติ

`tools.exec.security` / `tools.exec.ask` แบบเก่ายังคงรองรับและยังมีผลเหนือกว่า
เมื่อตั้งไว้ใน scope เซสชันหรือเอเจนต์ที่แคบกว่า

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - บล็อกคำขอ host exec ทั้งหมด
  - `allowlist` - อนุญาตเฉพาะคำสั่งใน allowlist
  - `full` - อนุญาตทุกอย่าง (เทียบเท่า elevated)

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  นโยบาย ask ที่กำหนดค่าสำหรับ host exec ควบคุมพฤติกรรม prompt การอนุมัติพื้นฐาน
  จาก `tools.exec.ask` และค่าเริ่มต้นการอนุมัติของโฮสต์ พารามิเตอร์เครื่องมือ
  `ask` แบบรายครั้ง (ดู [เครื่องมือ Exec](/th/tools/exec#parameters))
  ทำได้เพียงเพิ่มความเข้มงวดให้ baseline นั้น และการเรียกโมเดลที่มาจากช่องทางจะละเว้น
  พารามิเตอร์นี้เมื่อ host ask ที่มีผลคือ `off`

- `off` - ไม่แสดง prompt
- `on-miss` - แสดง prompt เฉพาะเมื่อ allowlist ไม่ตรงกัน
- `always` - แสดง prompt ทุกคำสั่ง ความเชื่อถือถาวร `allow-always` **ไม่** ระงับ prompt เมื่อโหมด ask ที่มีผลคือ `always`

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  การตัดสินเมื่อจำเป็นต้องมี prompt แต่ไม่มี UI ที่ติดต่อได้ หากละเว้น
  ฟิลด์นี้ OpenClaw จะใช้ค่าเริ่มต้นเป็น `deny`

- `deny` - บล็อก
- `allowlist` - อนุญาตเฉพาะเมื่อ allowlist ตรงกัน
- `full` - อนุญาต

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  เมื่อเป็น `true` OpenClaw จะถือว่ารูปแบบ inline code-eval ต้องผ่านการอนุมัติเท่านั้น
  แม้ตัวไบนารี interpreter เองจะอยู่ใน allowlist ก็ตาม เป็นการป้องกันเชิงลึก
  สำหรับ loader ของ interpreter ที่แมปกับ operand ไฟล์ที่เสถียรหนึ่งไฟล์ได้ไม่ชัดเจน
</ParamField>

ตัวอย่างที่โหมด strict ตรวจจับ:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

ในโหมด strict คำสั่งเหล่านี้ยังต้องมีการอนุมัติชัดเจน และ
`allow-always` จะไม่คงรายการ allowlist ใหม่ให้คำสั่งเหล่านี้
โดยอัตโนมัติ

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  ควบคุมเฉพาะการนำเสนอใน prompt การอนุมัติ exec เมื่อเปิดใช้
  OpenClaw อาจแนบช่วงคำสั่งที่ได้จาก parser เพื่อให้ prompt การอนุมัติบนเว็บ
  ไฮไลต์ token ของคำสั่งได้ ตั้งเป็น `true` เพื่อเปิดใช้
  การไฮไลต์ข้อความคำสั่ง
</ParamField>

การตั้งค่านี้ **ไม่** เปลี่ยน `security`, `ask`, การจับคู่ allowlist,
พฤติกรรม strict inline-eval, การส่งต่อการอนุมัติ หรือการรันคำสั่ง
สามารถตั้งค่าแบบทั่วทั้งระบบภายใต้ `tools.exec.commandHighlighting` หรือราย
เอเจนต์ภายใต้ `agents.list[].tools.exec.commandHighlighting`

## โหมด YOLO (ไม่มีการอนุมัติ)

หากคุณต้องการให้ host exec รันโดยไม่มี prompt การอนุมัติ คุณต้องเปิด
ชั้นนโยบาย **ทั้งสอง** ชั้น - นโยบาย exec ที่ขอใน config ของ OpenClaw
(`tools.exec.*`) **และ** นโยบายการอนุมัติแบบ host-local ใน
ไฟล์การอนุมัติของโฮสต์ที่ทำการรัน

OpenClaw ตั้งค่าเริ่มต้นของ `askFallback` ที่ละเว้นไว้เป็น `deny` ตั้งค่า
`askFallback` ของโฮสต์เป็น `full` อย่างชัดเจนเมื่อ prompt การอนุมัติที่ไม่มี UI
ควร fallback เป็นอนุญาต

| ชั้น                 | การตั้งค่า YOLO               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` บน `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**ข้อแตกต่างสำคัญ:**

- `tools.exec.host=auto` เลือก **ที่ที่** exec จะรัน: sandbox เมื่อพร้อมใช้งาน มิฉะนั้นเป็น gateway
- YOLO เลือก **วิธี** อนุมัติ host exec: `security=full` บวก `ask=off`
- ในโหมด YOLO OpenClaw **ไม่** เพิ่มเกตการอนุมัติคำสั่งแบบ heuristic สำหรับการพรางคำสั่งหรือชั้นปฏิเสธ script-preflight แยกต่างหากเหนือกว่านโยบาย host exec ที่กำหนดไว้
- `auto` ไม่ได้ทำให้การกำหนดเส้นทาง gateway เป็น override ฟรีจากเซสชันที่อยู่ใน sandbox คำขอรายครั้ง `host=node` อนุญาตจาก `auto`; `host=gateway` จะอนุญาตจาก `auto` เฉพาะเมื่อไม่มี runtime sandbox ที่ใช้งานอยู่ สำหรับค่าเริ่มต้นแบบไม่ใช่ auto ที่เสถียร ให้ตั้ง `tools.exec.host` หรือใช้ `/exec host=...` อย่างชัดเจน

</Warning>

ผู้ให้บริการที่รองรับด้วย CLI ซึ่งเปิดเผยโหมดสิทธิ์ noninteractive ของตนเอง
สามารถทำตามนโยบายนี้ได้ Claude CLI จะเพิ่ม
`--permission-mode bypassPermissions` เมื่อนโยบาย exec ที่มีผลของ OpenClaw
เป็น YOLO สำหรับเซสชัน Claude live ที่ OpenClaw จัดการ นโยบาย exec
ที่มีผลของ OpenClaw เป็นตัวกำหนดเหนือกว่าโหมดสิทธิ์เนทีฟของ Claude:
YOLO จะทำให้การเปิด live เป็น `--permission-mode bypassPermissions` และ
นโยบาย exec ที่มีผลแบบจำกัดจะทำให้การเปิด live เป็น
`--permission-mode default` แม้ raw Claude backend args จะระบุโหมดอื่นก็ตาม

หากต้องการการตั้งค่าที่ระมัดระวังกว่า ให้ปรับนโยบาย exec ของ OpenClaw กลับเป็น
`allowlist` / `on-miss` หรือ `deny`

### การตั้งค่า gateway-host แบบถาวรที่ "ไม่ต้องถาม"

<Steps>
  <Step title="ตั้งค่านโยบาย config ที่ขอ">
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
- ค่าเริ่มต้นของไฟล์การอนุมัติภายในเครื่อง รวมถึง `askFallback: "full"`

ตั้งใจให้เป็นแบบภายในเครื่องเท่านั้น หากต้องการเปลี่ยนการอนุมัติ
gateway-host หรือ node-host จากระยะไกล ให้ใช้ `openclaw approvals set --gateway` หรือ
`openclaw approvals set --node <id|name|ip>`

### โฮสต์ Node

สำหรับโฮสต์ node ให้ใช้ไฟล์การอนุมัติเดียวกันบน node นั้นแทน:

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
**ข้อจำกัดแบบภายในเครื่องเท่านั้น:**

- `openclaw exec-policy` ไม่ซิงโครไนซ์การอนุมัติของ node
- `openclaw exec-policy set --host node` ถูกปฏิเสธ
- การอนุมัติ exec ของ node ถูกดึงจาก node ขณะรัน ดังนั้นการอัปเดตที่มุ่งไปยัง node ต้องใช้ `openclaw approvals --node ...`

</Note>

### ทางลัดเฉพาะเซสชัน

- `/exec security=full ask=off` เปลี่ยนเฉพาะเซสชันปัจจุบันเท่านั้น
- `/elevated full` เป็นทางลัดแบบ break-glass ที่ข้ามการอนุมัติ exec เฉพาะเมื่อ
  ทั้งนโยบายที่ร้องขอและไฟล์ approvals ของโฮสต์แปลงค่าได้เป็น
  `security: "full"` และ `ask: "off"` ไฟล์โฮสต์ที่เข้มงวดกว่า เช่น
  `ask: "always"` ยังคงแสดงพรอมป์

หากไฟล์ approvals ของโฮสต์ยังเข้มงวดกว่าคอนฟิก นโยบายโฮสต์ที่เข้มงวดกว่า
ยังคงมีผลเหนือกว่า

## รายการอนุญาต (ต่อเอเจนต์)

รายการอนุญาตเป็นแบบ **ต่อเอเจนต์** หากมีหลายเอเจนต์ ให้สลับเอเจนต์
ที่คุณกำลังแก้ไขในแอป macOS รูปแบบเป็นการจับคู่แบบ glob

รูปแบบสามารถเป็น glob ของพาธไบนารีที่แปลงค่าแล้ว หรือ glob ของชื่อคำสั่งล้วน
ชื่อล้วนจะจับคู่เฉพาะคำสั่งที่เรียกผ่าน `PATH` ดังนั้น `rg` จึงจับคู่กับ
`/opt/homebrew/bin/rg` ได้เมื่อคำสั่งคือ `rg` แต่ **ไม่** จับคู่กับ `./rg` หรือ
`/tmp/rg` ใช้ glob ของพาธเมื่อคุณต้องการเชื่อถือไบนารีในตำแหน่งเฉพาะหนึ่งแห่ง

รายการ `agents.default` เดิมจะถูกย้ายไปเป็น `agents.main` เมื่อโหลด
เชนเชลล์ เช่น `echo ok && pwd` ยังคงต้องให้ทุกเซกเมนต์ระดับบนสุด
ผ่านกฎรายการอนุญาต

ตัวอย่าง:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### การจำกัดอาร์กิวเมนต์ด้วย argPattern

เพิ่ม `argPattern` เมื่อรายการอนุญาตควรจับคู่กับไบนารีและ
รูปแบบอาร์กิวเมนต์เฉพาะ OpenClaw ประเมิน regular expression
กับอาร์กิวเมนต์คำสั่งที่แยกวิเคราะห์แล้ว โดยไม่รวมโทเค็น executable
(`argv[0]`) สำหรับรายการที่เขียนด้วยมือ อาร์กิวเมนต์จะถูกเชื่อมด้วย
เว้นวรรคเดียว ดังนั้นให้ยึด pattern ด้วย anchor เมื่อคุณต้องการการจับคู่แบบตรงทั้งหมด

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

รายการนั้นอนุญาต `python3 safe.py`; `python3 other.py` จะไม่ตรงกับรายการอนุญาต
หากมีรายการแบบพาธล้วนสำหรับไบนารีเดียวกันอยู่ด้วย อาร์กิวเมนต์ที่ไม่ตรงกัน
ยังสามารถ fallback ไปยังรายการแบบพาธล้วนนั้นได้ ละเว้นรายการแบบพาธล้วน
เมื่อเป้าหมายคือจำกัดไบนารีให้ใช้ได้เฉพาะกับอาร์กิวเมนต์ที่ประกาศไว้

รายการที่บันทึกโดยโฟลว์การอนุมัติสามารถใช้รูปแบบตัวคั่นภายในสำหรับ
การจับคู่ argv แบบตรงทั้งหมด ควรใช้ UI หรือโฟลว์การอนุมัติเพื่อสร้าง
รายการเหล่านั้นใหม่ แทนการแก้ไขค่าที่เข้ารหัสด้วยมือ หาก OpenClaw ไม่สามารถ
แยกวิเคราะห์ argv สำหรับเซกเมนต์คำสั่งได้ รายการที่มี `argPattern` จะไม่จับคู่

แต่ละรายการอนุญาตรองรับ:

| ฟิลด์              | ความหมาย                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | glob ของพาธไบนารีที่แปลงค่าแล้ว หรือ glob ของชื่อคำสั่งล้วน           |
| `argPattern`       | regex ของ argv แบบไม่บังคับ; รายการที่ละเว้นฟิลด์นี้จะเป็นแบบพาธล้วน            |
| `id`               | UUID ที่เสถียรซึ่งใช้เป็นตัวตนใน UI                              |
| `source`           | แหล่งที่มาของรายการ เช่น `allow-always`                          |
| `commandText`      | ข้อความคำสั่งที่บันทึกไว้เมื่อโฟลว์การอนุมัติสร้างรายการ |
| `lastUsedAt`       | เวลาประทับการใช้งานครั้งล่าสุด                                           |
| `lastUsedCommand`  | คำสั่งล่าสุดที่จับคู่                                     |
| `lastResolvedPath` | พาธไบนารีล่าสุดที่แปลงค่าได้                                     |

## อนุญาต CLI ของ Skills อัตโนมัติ

เมื่อเปิดใช้ **อนุญาต CLI ของ Skills อัตโนมัติ** executable ที่อ้างอิงโดย
Skills ที่รู้จักจะถูกถือว่าอยู่ในรายการอนุญาตบน Node (Node ของ macOS หรือโฮสต์
Node แบบ headless) การทำงานนี้ใช้ `skills.bins` ผ่าน Gateway RPC เพื่อดึง
รายการ bin ของ skill ปิดใช้งานตัวเลือกนี้หากคุณต้องการรายการอนุญาตแบบแมนนวลที่เข้มงวด

<Warning>
- นี่คือ **รายการอนุญาตโดยนัยเพื่อความสะดวก** ซึ่งแยกจากรายการอนุญาตพาธแบบแมนนวล
- มีไว้สำหรับสภาพแวดล้อมของผู้ปฏิบัติงานที่เชื่อถือได้ ซึ่ง Gateway และ Node อยู่ใน trust boundary เดียวกัน
- หากคุณต้องการความเชื่อถือแบบระบุชัดเจนอย่างเข้มงวด ให้คง `autoAllowSkills: false` และใช้เฉพาะรายการอนุญาตพาธแบบแมนนวล

</Warning>

## Safe bins และการส่งต่อการอนุมัติ

สำหรับ safe bins (fast-path แบบ stdin-only), รายละเอียดการผูก interpreter และ
วิธีส่งต่อพรอมป์การอนุมัติไปยัง Slack/Discord/Telegram (หรือเรียกใช้เป็น
ไคลเอนต์การอนุมัติแบบ native) โปรดดู
[การอนุมัติ exec - ขั้นสูง](/th/tools/exec-approvals-advanced)

## การแก้ไขใน Control UI

ใช้การ์ด **Control UI → Nodes → Exec approvals** เพื่อแก้ไขค่าเริ่มต้น,
การ override ต่อเอเจนต์ และรายการอนุญาต เลือกขอบเขต (ค่าเริ่มต้นหรือเอเจนต์),
ปรับนโยบาย, เพิ่ม/ลบรูปแบบรายการอนุญาต แล้วกด **Save** UI
แสดงเมทาดาทาการใช้งานครั้งล่าสุดต่อ pattern เพื่อให้คุณรักษารายการให้เป็นระเบียบได้

ตัวเลือกเป้าหมายเลือก **Gateway** (การอนุมัติภายในเครื่อง) หรือ **Node**
Node ต้องประกาศ `system.execApprovals.get/set` (แอป macOS หรือ
โฮสต์ Node แบบ headless) หาก Node ยังไม่ได้ประกาศ exec approvals
ให้แก้ไขไฟล์ approvals ภายในเครื่องของ Node โดยตรง

CLI: `openclaw approvals` รองรับการแก้ไข Gateway หรือ Node - ดู
[CLI การอนุมัติ](/th/cli/approvals)

## โฟลว์การอนุมัติ

เมื่อจำเป็นต้องมีพรอมป์ Gateway จะกระจาย
`exec.approval.requested` ไปยังไคลเอนต์ผู้ปฏิบัติงาน Control UI และแอป macOS
จะแก้ไขคำขอนั้นผ่าน `exec.approval.resolve` จากนั้น Gateway จะส่งต่อคำขอ
ที่อนุมัติแล้วไปยังโฮสต์ Node

สำหรับ `host=node` คำขออนุมัติจะมี payload `systemRunPlan` แบบ canonical
Gateway ใช้แผนนั้นเป็นบริบทคำสั่ง/cwd/เซสชันที่มีอำนาจตัดสิน
เมื่อส่งต่อคำขอ `system.run` ที่อนุมัติแล้ว

สิ่งนี้สำคัญต่อ latency ของการอนุมัติแบบ async:

- พาธ exec ของ Node เตรียมแผน canonical หนึ่งรายการไว้ล่วงหน้า
- ระเบียนการอนุมัติเก็บแผนนั้นและเมทาดาทาการผูกของแผน
- เมื่ออนุมัติแล้ว การเรียก `system.run` สุดท้ายที่ถูกส่งต่อจะใช้แผนที่เก็บไว้ซ้ำ แทนการเชื่อถือการแก้ไขภายหลังจากผู้เรียก
- หากผู้เรียกเปลี่ยน `command`, `rawCommand`, `cwd`, `agentId` หรือ `sessionKey` หลังจากสร้างคำขออนุมัติแล้ว Gateway จะปฏิเสธการรันที่ส่งต่อว่าเป็นการอนุมัติไม่ตรงกัน

## เหตุการณ์ระบบ

วงจรชีวิตของ exec จะแสดงเป็นข้อความระบบ:

- `Exec running` (เฉพาะเมื่อคำสั่งเกิน threshold การแจ้งว่ากำลังรัน)
- `Exec finished`

ข้อความเหล่านี้จะถูกโพสต์ไปยังเซสชันของเอเจนต์หลังจาก Node รายงานเหตุการณ์
การอนุมัติ exec ที่ถูกปฏิเสธถือเป็นสถานะสิ้นสุดสำหรับคำสั่งโฮสต์เอง: คำสั่ง
จะไม่ถูกรัน สำหรับการอนุมัติ async ของเอเจนต์หลักที่มีเซสชันต้นทาง
OpenClaw จะโพสต์การปฏิเสธกลับเข้าไปในเซสชันนั้นเป็น followup ภายใน เพื่อให้
เอเจนต์หยุดรอคำสั่ง async และหลีกเลี่ยงการซ่อมแซมผลลัพธ์ที่หายไป
หากไม่มีเซสชันหรือไม่สามารถกลับมาใช้เซสชันต่อได้ OpenClaw ยังคงสามารถ
รายงานการปฏิเสธแบบกระชับไปยังผู้ปฏิบัติงานหรือเส้นทางแชทโดยตรงได้ การปฏิเสธสำหรับ
เซสชัน subagent จะไม่ถูกโพสต์กลับเข้าไปใน subagent
การอนุมัติ exec ที่โฮสต์โดย Gateway จะปล่อยเหตุการณ์วงจรชีวิตเดียวกันเมื่อ
คำสั่งเสร็จสิ้น (และอาจปล่อยเมื่อรันนานกว่า threshold)
exec ที่ถูกควบคุมด้วยการอนุมัติจะใช้ id การอนุมัติซ้ำเป็น `runId` ใน
ข้อความเหล่านี้เพื่อให้เชื่อมโยงกันได้ง่าย

## พฤติกรรมเมื่อการอนุมัติถูกปฏิเสธ

เมื่อการอนุมัติ exec แบบ async ถูกปฏิเสธ OpenClaw จะถือว่าคำสั่งโฮสต์
สิ้นสุดแล้วและ fail-closed สำหรับเซสชันเอเจนต์หลัก การปฏิเสธจะถูกส่งเป็น
followup ภายในเซสชันที่บอกเอเจนต์ว่าคำสั่ง async ไม่ได้ถูกรัน
วิธีนี้รักษาความต่อเนื่องของ transcript โดยไม่เปิดเผยผลลัพธ์คำสั่งที่ล้าสมัย หาก
การส่งไปยังเซสชันไม่พร้อมใช้งาน OpenClaw จะ fallback ไปยังการปฏิเสธแบบกระชับสำหรับผู้ปฏิบัติงานหรือ
แชทโดยตรงเมื่อมีเส้นทางที่ปลอดภัย

## ผลที่ตามมา

- **`full`** มีอำนาจสูง; ควรใช้รายการอนุญาตเมื่อเป็นไปได้
- **`ask`** ทำให้คุณยังอยู่ในวงจรตัดสินใจ ขณะเดียวกันก็ยังอนุมัติได้รวดเร็ว
- รายการอนุญาตต่อเอเจนต์ช่วยป้องกันไม่ให้การอนุมัติของเอเจนต์หนึ่งรั่วไปยังอีกเอเจนต์
- การอนุมัติมีผลเฉพาะกับคำขอ host exec จาก **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น ผู้ส่งที่ไม่ได้รับอนุญาตไม่สามารถออกคำสั่ง `/exec`
- `/exec security=full` เป็นความสะดวกระดับเซสชันสำหรับผู้ปฏิบัติงานที่ได้รับอนุญาต และข้ามการอนุมัติโดยเจตนา หากต้องการบล็อก host exec อย่างเด็ดขาด ให้ตั้งค่า approvals security เป็น `deny` หรือปฏิเสธเครื่องมือ `exec` ผ่านนโยบายเครื่องมือ

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/th/tools/exec-approvals-advanced" icon="gear">
    Safe bins, การผูก interpreter และการส่งต่อการอนุมัติไปยังแชท
  </Card>
  <Card title="Exec tool" href="/th/tools/exec" icon="terminal">
    เครื่องมือเรียกใช้คำสั่งเชลล์
  </Card>
  <Card title="Elevated mode" href="/th/tools/elevated" icon="shield-exclamation">
    พาธแบบ break-glass ที่ข้ามการอนุมัติด้วย
  </Card>
  <Card title="Sandboxing" href="/th/gateway/sandboxing" icon="box">
    โหมด sandbox และการเข้าถึง workspace
  </Card>
  <Card title="Security" href="/th/gateway/security" icon="lock">
    โมเดลความปลอดภัยและการ hardening
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/th/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    ควรใช้การควบคุมแต่ละแบบเมื่อใด
  </Card>
  <Card title="Skills" href="/th/tools/skills" icon="sparkles">
    พฤติกรรมอนุญาตอัตโนมัติที่รองรับโดย Skills
  </Card>
</CardGroup>
