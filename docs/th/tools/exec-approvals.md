---
read_when:
    - การกำหนดค่าการอนุมัติการรันคำสั่งหรือรายการอนุญาต
    - การนำประสบการณ์ผู้ใช้สำหรับการอนุมัติ exec ไปใช้ในแอป macOS
    - การตรวจสอบพรอมป์หลบหนีแซนด์บ็อกซ์และผลกระทบที่เกี่ยวข้อง
sidebarTitle: Exec approvals
summary: 'การอนุมัติการเรียกใช้คำสั่งบนโฮสต์: ตัวควบคุมนโยบาย รายการที่อนุญาต และเวิร์กโฟลว์แบบ YOLO/เข้มงวด'
title: การอนุมัติการเรียกใช้คำสั่ง
x-i18n:
    generated_at: "2026-05-11T20:39:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2966a6f4633046941a9ef3267bad10f3a153956361b9f088fb3e29fcd3fcb99d
    source_path: tools/exec-approvals.md
    workflow: 16
---

การอนุมัติ exec เป็น **กลไกป้องกันของแอปคู่หู / โฮสต์ Node** สำหรับให้
เอเจนต์ที่อยู่ใน sandbox รันคำสั่งบนโฮสต์จริง (`gateway` หรือ `node`) ได้ เป็น
กลไกนิรภัย: คำสั่งจะได้รับอนุญาตเฉพาะเมื่อ policy + รายการอนุญาต +
(ถ้ามี) การอนุมัติจากผู้ใช้ เห็นตรงกันทั้งหมด การอนุมัติ exec จะซ้อน **อยู่เหนือ**
policy ของเครื่องมือและการกั้นแบบ elevated (ยกเว้น elevated ถูกตั้งเป็น `full` ซึ่ง
จะข้ามการอนุมัติ)

<Note>
policy ที่มีผลจริงคือค่าที่ **เข้มงวดกว่า** ระหว่าง `tools.exec.*` กับค่าเริ่มต้นของการอนุมัติ
หากละเว้นฟิลด์การอนุมัติไว้ จะใช้ค่าจาก `tools.exec` แทน
การ exec บนโฮสต์ยังใช้สถานะการอนุมัติภายในเครื่องนั้นด้วย - ค่า
`ask: "always"` แบบเฉพาะโฮสต์ใน `~/.openclaw/exec-approvals.json` จะยัง
แสดงพรอมป์ต่อไป แม้ค่าเริ่มต้นของเซสชันหรือคอนฟิกจะขอ `ask: "on-miss"` ก็ตาม
</Note>

## การตรวจสอบ policy ที่มีผลจริง

| คำสั่ง                                                          | สิ่งที่แสดง                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | policy ที่ร้องขอ แหล่งที่มาของ policy บนโฮสต์ และผลลัพธ์ที่มีผลจริง                       |
| `openclaw exec-policy show`                                      | มุมมองที่ผสานแล้วของเครื่องภายในเครื่อง                                                             |
| `openclaw exec-policy set` / `preset`                            | ซิงโครไนซ์ policy ที่ร้องขอภายในเครื่องกับไฟล์การอนุมัติของโฮสต์ภายในเครื่องในขั้นตอนเดียว |

เมื่อ scope ภายในเครื่องร้องขอ `host=node` คำสั่ง `exec-policy show` จะรายงาน
scope นั้นว่าอยู่ภายใต้การจัดการของ Node ขณะรันไทม์ แทนที่จะแสร้งว่าไฟล์
การอนุมัติภายในเครื่องเป็นแหล่งข้อมูลจริง

หาก UI ของแอปคู่หู **ไม่พร้อมใช้งาน** คำขอใด ๆ ที่ปกติจะแสดงพรอมป์
จะถูกตัดสินด้วย **fallback สำหรับการถาม** (ค่าเริ่มต้น: `deny`)

<Tip>
ไคลเอนต์อนุมัติแบบแชตเนทีฟสามารถใส่ตัวช่วยเฉพาะช่องทางไว้ในข้อความอนุมัติที่รอดำเนินการได้
ตัวอย่างเช่น Matrix ใส่ทางลัดด้วย reaction
(`✅` อนุญาตครั้งเดียว, `❌` ปฏิเสธ, `♾️` อนุญาตเสมอ) ในขณะที่ยังคงใส่
คำสั่ง `/approve ...` ไว้ในข้อความเป็น fallback
</Tip>

## ใช้ที่ใด

การอนุมัติ exec ถูกบังคับใช้ภายในเครื่องบนโฮสต์ที่ดำเนินการ:

- **โฮสต์ Gateway** → โปรเซส `openclaw` บนเครื่อง Gateway
- **โฮสต์ Node** → ตัวรัน Node (แอปคู่หู macOS หรือโฮสต์ Node แบบไม่มีส่วนหัว)

### โมเดลความเชื่อถือ

- ผู้เรียกที่ผ่านการยืนยันตัวตนกับ Gateway ถือเป็นผู้ดำเนินการที่เชื่อถือได้สำหรับ Gateway นั้น
- Node ที่จับคู่แล้วขยายความสามารถของผู้ดำเนินการที่เชื่อถือได้นั้นไปยังโฮสต์ Node
- การอนุมัติ exec ลดความเสี่ยงจากการดำเนินการโดยไม่ตั้งใจ แต่ **ไม่ใช่** ขอบเขตการยืนยันตัวตนต่อผู้ใช้หรือ policy แบบอ่านได้อย่างเดียวของระบบไฟล์
- เมื่อได้รับอนุมัติแล้ว คำสั่งสามารถแก้ไขไฟล์ได้ตามสิทธิ์ของโฮสต์หรือ sandbox filesystem ที่เลือก
- การรันบนโฮสต์ Node ที่ได้รับอนุมัติจะผูกบริบทการดำเนินการมาตรฐาน: cwd มาตรฐาน, argv ที่ตรงกัน, การผูก env เมื่อมี และพาธ executable ที่ pin ไว้เมื่อเกี่ยวข้อง
- สำหรับสคริปต์ shell และการเรียกไฟล์ interpreter/runtime โดยตรง OpenClaw ยังพยายามผูก operand ไฟล์ภายในเครื่องที่เป็นรูปธรรมหนึ่งไฟล์ด้วย หากไฟล์ที่ผูกไว้นั้นเปลี่ยนหลังการอนุมัติแต่ก่อนดำเนินการ การรันจะถูกปฏิเสธแทนที่จะดำเนินการกับเนื้อหาที่ drift ไป
- การผูกไฟล์ตั้งใจให้เป็นแบบ best-effort, **ไม่ใช่** โมเดลเชิงความหมายที่ครบถ้วนของเส้นทาง loader ของ interpreter/runtime ทุกแบบ หากโหมดการอนุมัติระบุไฟล์ภายในเครื่องที่เป็นรูปธรรมได้ไม่ตรงหนึ่งไฟล์สำหรับผูก ก็จะปฏิเสธการสร้างการรันที่มีการอนุมัติรองรับ แทนที่จะแสร้งว่าครอบคลุมครบถ้วน

### การแยกบน macOS

- **บริการโฮสต์ Node** ส่งต่อ `system.run` ไปยัง **แอป macOS** ผ่าน IPC ภายในเครื่อง
- **แอป macOS** บังคับใช้การอนุมัติและดำเนินการคำสั่งในบริบท UI

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

## ตัวปรับ policy

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - บล็อกคำขอ exec บนโฮสต์ทั้งหมด
  - `allowlist` - อนุญาตเฉพาะคำสั่งที่อยู่ในรายการอนุญาต
  - `full` - อนุญาตทุกอย่าง (เทียบเท่า elevated)

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - ไม่แสดงพรอมป์
  - `on-miss` - แสดงพรอมป์เฉพาะเมื่อรายการอนุญาตไม่ตรงกัน
  - `always` - แสดงพรอมป์ทุกคำสั่ง ความเชื่อถือถาวรแบบ `allow-always` **ไม่** ระงับพรอมป์เมื่อโหมด ask ที่มีผลจริงคือ `always`

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  การตัดสินเมื่อจำเป็นต้องแสดงพรอมป์แต่ไม่มี UI ที่เข้าถึงได้

- `deny` - บล็อก
- `allowlist` - อนุญาตเฉพาะเมื่อรายการอนุญาตตรงกัน
- `full` - อนุญาต

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  เมื่อเป็น `true` OpenClaw จะถือรูปแบบ inline code-eval ว่าต้องผ่านการอนุมัติเท่านั้น
  แม้ binary ของ interpreter เองจะอยู่ในรายการอนุญาตก็ตาม เป็น defense-in-depth
  สำหรับ loader ของ interpreter ที่ไม่สามารถ map กับ operand ไฟล์ที่เสถียรหนึ่งไฟล์ได้อย่างชัดเจน
</ParamField>

ตัวอย่างที่โหมดเข้มงวดตรวจจับได้:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

ในโหมดเข้มงวด คำสั่งเหล่านี้ยังต้องมีการอนุมัติอย่างชัดเจน และ
`allow-always` จะไม่บันทึกรายการอนุญาตใหม่ให้โดยอัตโนมัติ

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  ควบคุมเฉพาะการนำเสนอในพรอมป์การอนุมัติ exec เมื่อเปิดใช้
  OpenClaw อาจแนบช่วงคำสั่งที่ได้จาก parser เพื่อให้พรอมป์อนุมัติบน Web
  สามารถไฮไลต์โทเคนคำสั่งได้ ตั้งค่าเป็น `true` เพื่อเปิดใช้
  การไฮไลต์ข้อความคำสั่ง
</ParamField>

การตั้งค่านี้ **ไม่** เปลี่ยน `security`, `ask`, การจับคู่รายการอนุญาต,
พฤติกรรม strict inline-eval, การส่งต่อการอนุมัติ หรือการดำเนินการคำสั่ง
สามารถตั้งค่าแบบ global ภายใต้ `tools.exec.commandHighlighting` หรือแยกตาม
เอเจนต์ภายใต้ `agents.list[].tools.exec.commandHighlighting`

## โหมด YOLO (ไม่มีการอนุมัติ)

หากคุณต้องการให้ exec บนโฮสต์รันโดยไม่มีพรอมป์การอนุมัติ คุณต้องเปิด
policy **ทั้งสอง** ชั้น - policy exec ที่ร้องขอในคอนฟิก OpenClaw
(`tools.exec.*`) **และ** policy การอนุมัติแบบเฉพาะโฮสต์ใน
`~/.openclaw/exec-approvals.json`

YOLO เป็นพฤติกรรมโฮสต์เริ่มต้น เว้นแต่คุณจะทำให้เข้มงวดขึ้นอย่างชัดเจน:

| ชั้น                 | การตั้งค่า YOLO               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` บน `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| `Host `askFallback`    | `full`                     |

<Warning>
**ข้อแตกต่างสำคัญ:**

- `tools.exec.host=auto` เลือกว่า exec รัน **ที่ใด**: sandbox เมื่อพร้อมใช้งาน มิฉะนั้นเป็น Gateway
- YOLO เลือกว่า exec บนโฮสต์ได้รับการอนุมัติ **อย่างไร**: `security=full` รวมกับ `ask=off`
- ในโหมด YOLO OpenClaw **ไม่** เพิ่ม gate การอนุมัติการอำพรางคำสั่งด้วย heuristic หรือชั้นการปฏิเสธก่อนรันสคริปต์แยกต่างหากไว้เหนือ policy exec บนโฮสต์ที่กำหนดค่าไว้
- `auto` ไม่ทำให้การ route ไปยัง Gateway เป็น override ฟรีจากเซสชันที่อยู่ใน sandbox คำขอ `host=node` ต่อครั้งได้รับอนุญาตจาก `auto`; `host=gateway` ได้รับอนุญาตจาก `auto` เฉพาะเมื่อไม่มี runtime ของ sandbox ที่ทำงานอยู่ สำหรับค่าเริ่มต้นแบบไม่ใช่ auto ที่เสถียร ให้ตั้งค่า `tools.exec.host` หรือใช้ `/exec host=...` อย่างชัดเจน

</Warning>

provider ที่มี CLI รองรับและเปิดเผยโหมดสิทธิ์แบบ noninteractive ของตนเอง
สามารถทำตาม policy นี้ได้ Claude CLI จะเพิ่ม
`--permission-mode bypassPermissions` เมื่อ policy exec ที่ OpenClaw ร้องขอ
เป็น YOLO ให้ override พฤติกรรม backend นั้นด้วยอาร์กิวเมนต์ Claude ที่ชัดเจน
ภายใต้ `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
เช่น `--permission-mode default`, `acceptEdits` หรือ
`bypassPermissions`

หากคุณต้องการการตั้งค่าที่ระมัดระวังมากขึ้น ให้ปรับชั้นใดชั้นหนึ่งกลับเป็น
`allowlist` / `on-miss` หรือ `deny`

### การตั้งค่า "ไม่ต้องแสดงพรอมป์" แบบถาวรบนโฮสต์ Gateway

<Steps>
  <Step title="ตั้งค่า policy คอนฟิกที่ร้องขอ">__OC_I18N_900002__  </Step>
  <Step title="ปรับไฟล์การอนุมัติของโฮสต์ให้ตรงกัน">__OC_I18N_900003__  </Step>
</Steps>

### ทางลัดภายในเครื่อง
__OC_I18N_900004__
ทางลัดภายในเครื่องนั้นอัปเดตทั้งสองอย่าง:

- `tools.exec.host/security/ask` ภายในเครื่อง
- ค่าเริ่มต้นของ `~/.openclaw/exec-approvals.json` ภายในเครื่อง

ตั้งใจให้เป็นแบบเฉพาะภายในเครื่องเท่านั้น หากต้องการเปลี่ยนการอนุมัติของโฮสต์ Gateway หรือโฮสต์ Node
จากระยะไกล ให้ใช้ `openclaw approvals set --gateway` หรือ
`openclaw approvals set --node <id|name|ip>`

### โฮสต์ Node

สำหรับโฮสต์ Node ให้ใช้ไฟล์การอนุมัติเดียวกันบน Node นั้นแทน:
__OC_I18N_900005__
<Note>
**ข้อจำกัดเฉพาะภายในเครื่อง:**

- `openclaw exec-policy` ไม่ซิงโครไนซ์การอนุมัติของ Node
- `openclaw exec-policy set --host node` ถูกปฏิเสธ
- การอนุมัติ exec ของ Node ถูกดึงจาก Node ขณะรันไทม์ ดังนั้นการอัปเดตที่มุ่งไปยัง Node ต้องใช้ `openclaw approvals --node ...`

</Note>

### ทางลัดเฉพาะเซสชัน

- `/exec security=full ask=off` เปลี่ยนเฉพาะเซสชันปัจจุบัน
- `/elevated full` เป็นทางลัดแบบ break-glass ที่ข้ามการอนุมัติ exec สำหรับเซสชันนั้นด้วย

หากไฟล์การอนุมัติของโฮสต์ยังเข้มงวดกว่าคอนฟิก policy ของโฮสต์ที่เข้มงวดกว่า
ก็ยังเป็นฝ่ายชนะ

## รายการอนุญาต (ต่อเอเจนต์)

รายการอนุญาตเป็นแบบ **ต่อเอเจนต์** หากมีหลายเอเจนต์ ให้สลับเอเจนต์ที่
คุณกำลังแก้ไขในแอป macOS Patterns เป็นการจับคู่แบบ glob

Patterns อาจเป็น glob ของพาธ binary ที่ resolve แล้ว หรือ glob ของชื่อคำสั่งแบบเปล่า
ชื่อแบบเปล่าจะตรงเฉพาะคำสั่งที่ถูกเรียกผ่าน `PATH` ดังนั้น `rg` จึงตรงกับ
`/opt/homebrew/bin/rg` ได้เมื่อคำสั่งคือ `rg` แต่ **ไม่** ตรงกับ `./rg` หรือ
`/tmp/rg` ใช้ glob ของพาธเมื่อคุณต้องการเชื่อถือ location ของ binary ที่เฉพาะเจาะจงหนึ่งแห่ง

รายการ `agents.default` แบบ legacy จะถูก migrate เป็น `agents.main` เมื่อโหลด
เชนของ shell เช่น `echo ok && pwd` ยังต้องให้ทุก segment ระดับบนสุด
เป็นไปตามกฎรายการอนุญาต

ตัวอย่าง:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### การจำกัดอาร์กิวเมนต์ด้วย argPattern

เพิ่ม `argPattern` เมื่อรายการในรายการอนุญาตควรตรงกับ binary และ
รูปแบบอาร์กิวเมนต์ที่เฉพาะเจาะจง OpenClaw ประเมิน regular expression
กับอาร์กิวเมนต์คำสั่งที่ parse แล้ว โดยไม่รวมโทเคน executable
(`argv[0]`) สำหรับรายการที่เขียนเอง อาร์กิวเมนต์จะถูก join ด้วย
ช่องว่างเดียว ดังนั้นให้ anchor pattern เมื่อคุณต้องการการจับคู่ที่ตรงเป๊ะ
__OC_I18N_900006__
รายการนั้นอนุญาต `python3 safe.py`; `python3 other.py` เป็นการไม่ตรงกับรายการอนุญาต
หากมีรายการเฉพาะพาธสำหรับ binary เดียวกันอยู่ด้วย อาร์กิวเมนต์ที่ไม่ตรงกัน
ยังสามารถ fallback ไปยังรายการเฉพาะพาธนั้นได้ ละเว้นรายการเฉพาะพาธเมื่อเป้าหมายคือ
การจำกัด binary ให้ใช้ได้เฉพาะอาร์กิวเมนต์ที่ประกาศไว้เท่านั้น

รายการที่บันทึกโดยโฟลว์การอนุมัติสามารถใช้รูปแบบตัวคั่นภายในสำหรับการจับคู่ argv แบบตรงทั้งหมดได้ ควรใช้ UI หรือโฟลว์การอนุมัติเพื่อสร้างรายการเหล่านั้นใหม่แทนการแก้ไขค่าที่เข้ารหัสด้วยตนเอง หาก OpenClaw ไม่สามารถแยกวิเคราะห์ argv สำหรับส่วนคำสั่งได้ รายการที่มี `argPattern` จะไม่ตรงกัน

รายการ allowlist แต่ละรายการรองรับ:

| ฟิลด์              | ความหมาย                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | glob ของพาธไบนารีที่ resolve แล้ว หรือ glob ของชื่อคำสั่งแบบเปล่า           |
| `argPattern`       | regex ของ argv แบบไม่บังคับ; รายการที่ละไว้จะอิงเฉพาะพาธ            |
| `id`               | UUID คงที่ที่ใช้สำหรับตัวตนใน UI                              |
| `source`           | แหล่งที่มาของรายการ เช่น `allow-always`                          |
| `commandText`      | ข้อความคำสั่งที่บันทึกไว้เมื่อโฟลว์การอนุมัติสร้างรายการ |
| `lastUsedAt`       | timestamp ที่ใช้ล่าสุด                                           |
| `lastUsedCommand`  | คำสั่งล่าสุดที่ตรงกัน                                     |
| `lastResolvedPath` | พาธไบนารีล่าสุดที่ resolve ได้                                     |

## CLI ของ Skills ที่อนุญาตอัตโนมัติ

เมื่อเปิดใช้ **CLI ของ Skills ที่อนุญาตอัตโนมัติ** ไฟล์ปฏิบัติการที่อ้างอิงโดย Skills ที่รู้จักจะถือว่าอยู่ใน allowlist บน Node (Node macOS หรือโฮสต์ Node แบบ headless) สิ่งนี้ใช้ `skills.bins` ผ่าน Gateway RPC เพื่อดึงรายการ bin ของ Skills ปิดใช้งานสิ่งนี้หากคุณต้องการ allowlist แบบกำหนดเองที่เข้มงวด

<Warning>
- นี่คือ **allowlist เพื่อความสะดวกแบบนัย** ซึ่งแยกจากรายการ allowlist พาธที่กำหนดเอง
- มีไว้สำหรับสภาพแวดล้อมของผู้ปฏิบัติการที่เชื่อถือได้ ซึ่ง Gateway และ Node อยู่ในขอบเขตความเชื่อถือเดียวกัน
- หากคุณต้องการความเชื่อถือแบบระบุชัดอย่างเข้มงวด ให้คง `autoAllowSkills: false` ไว้และใช้เฉพาะรายการ allowlist พาธที่กำหนดเอง

</Warning>

## Bin ที่ปลอดภัยและการส่งต่อการอนุมัติ

สำหรับ bin ที่ปลอดภัย (fast-path ที่ใช้ stdin เท่านั้น), รายละเอียดการผูก interpreter และวิธีส่งต่อ prompt การอนุมัติไปยัง Slack/Discord/Telegram (หรือเรียกใช้เป็นไคลเอนต์การอนุมัติแบบ native) โปรดดู
[การอนุมัติ Exec - ขั้นสูง](/tools/exec-approvals-advanced)

## การแก้ไขใน Control UI

ใช้การ์ด **Control UI → Nodes → Exec approvals** เพื่อแก้ไขค่าเริ่มต้น การ override ราย agent และ allowlist เลือกขอบเขต (Defaults หรือ agent) ปรับนโยบาย เพิ่ม/ลบ pattern ของ allowlist แล้วกด **Save** UI จะแสดง metadata การใช้ล่าสุดต่อ pattern เพื่อให้คุณจัดรายการให้เรียบร้อยได้

ตัวเลือกเป้าหมายเลือก **Gateway** (การอนุมัติแบบ local) หรือ **Node** Node ต้องประกาศ `system.execApprovals.get/set` (แอป macOS หรือโฮสต์ Node แบบ headless) หาก Node ยังไม่ประกาศ exec approvals ให้แก้ไข `~/.openclaw/exec-approvals.json` ภายในของ Node นั้นโดยตรง

CLI: `openclaw approvals` รองรับการแก้ไข Gateway หรือ Node - ดู
[Approvals CLI](/cli/approvals)

## โฟลว์การอนุมัติ

เมื่อจำเป็นต้องมี prompt, Gateway จะกระจาย
`exec.approval.requested` ไปยังไคลเอนต์ผู้ปฏิบัติการ Control UI และแอป macOS resolve สิ่งนี้ผ่าน `exec.approval.resolve` จากนั้น Gateway จะส่งต่อคำขอที่ได้รับอนุมัติไปยังโฮสต์ Node

สำหรับ `host=node` คำขอการอนุมัติจะรวม payload `systemRunPlan` แบบ canonical Gateway ใช้ plan นั้นเป็นบริบทคำสั่ง/cwd/session ที่เชื่อถือได้เมื่อส่งต่อคำขอ `system.run` ที่ได้รับอนุมัติ

สิ่งนี้สำคัญต่อ latency ของการอนุมัติแบบ async:

- พาธ exec ของ Node เตรียม plan แบบ canonical หนึ่งรายการไว้ตั้งแต่ต้น
- ระเบียนการอนุมัติจัดเก็บ plan นั้นและ metadata การผูกของมัน
- เมื่ออนุมัติแล้ว การเรียก `system.run` ที่ส่งต่อครั้งสุดท้ายจะใช้ plan ที่เก็บไว้ซ้ำแทนการเชื่อถือการแก้ไขของผู้เรียกในภายหลัง
- หากผู้เรียกเปลี่ยน `command`, `rawCommand`, `cwd`, `agentId` หรือ `sessionKey` หลังจากสร้างคำขอการอนุมัติแล้ว Gateway จะปฏิเสธการเรียกที่ส่งต่อว่าเป็นการอนุมัติไม่ตรงกัน

## เหตุการณ์ระบบ

วงจรชีวิตของ Exec จะแสดงเป็นข้อความระบบ:

- `Exec running` (เฉพาะเมื่อคำสั่งเกิน threshold การแจ้งเตือนว่ากำลังทำงาน)
- `Exec finished`
- `Exec denied`

ข้อความเหล่านี้จะถูกโพสต์ไปยัง session ของ agent หลังจาก Node รายงานเหตุการณ์ การอนุมัติ exec ที่โฮสต์บน Gateway จะปล่อยเหตุการณ์วงจรชีวิตเดียวกันเมื่อคำสั่งเสร็จสิ้น (และถ้าต้องการ เมื่อทำงานนานกว่า threshold) exec ที่ผ่านด่านการอนุมัติจะใช้ id การอนุมัติซ้ำเป็น `runId` ในข้อความเหล่านี้เพื่อให้เชื่อมโยงกันได้ง่าย

## พฤติกรรมเมื่อการอนุมัติถูกปฏิเสธ

เมื่อการอนุมัติ exec แบบ async ถูกปฏิเสธ OpenClaw จะป้องกันไม่ให้ agent ใช้ output จากการรันก่อนหน้าของคำสั่งเดียวกันใน session นั้นซ้ำ เหตุผลการปฏิเสธจะถูกส่งไปพร้อมคำแนะนำที่ชัดเจนว่าไม่มี output ของคำสั่งให้ใช้ ซึ่งหยุด agent ไม่ให้กล่าวอ้างว่ามี output ใหม่หรือรันคำสั่งที่ถูกปฏิเสธซ้ำโดยใช้ผลลัพธ์เก่าจากการรันก่อนหน้าที่สำเร็จ

## ผลกระทบ

- **`full`** มีพลังมาก; ควรใช้ allowlist เมื่อเป็นไปได้
- **`ask`** ทำให้คุณยังอยู่ในวงจรตัดสินใจ ขณะเดียวกันก็ยังอนุมัติได้รวดเร็ว
- allowlist ราย agent ป้องกันไม่ให้การอนุมัติของ agent หนึ่งรั่วไปยัง agent อื่น
- การอนุมัติใช้กับคำขอ host exec จาก **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น ผู้ส่งที่ไม่ได้รับอนุญาตไม่สามารถออก `/exec` ได้
- `/exec security=full` เป็นความสะดวกในระดับ session สำหรับผู้ปฏิบัติการที่ได้รับอนุญาต และข้ามการอนุมัติโดยออกแบบไว้เช่นนั้น หากต้องการบล็อก host exec อย่างเด็ดขาด ให้ตั้งค่า security ของ approvals เป็น `deny` หรือปฏิเสธ tool `exec` ผ่านนโยบาย tool

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การอนุมัติ Exec - ขั้นสูง" href="/th/tools/exec-approvals-advanced" icon="gear">
    Bin ที่ปลอดภัย, การผูก interpreter และการส่งต่อการอนุมัติไปยังแชต
  </Card>
  <Card title="Tool Exec" href="/th/tools/exec" icon="terminal">
    Tool สำหรับเรียกใช้คำสั่ง shell
  </Card>
  <Card title="โหมด Elevated" href="/th/tools/elevated" icon="shield-exclamation">
    เส้นทาง break-glass ที่ข้ามการอนุมัติด้วย
  </Card>
  <Card title="Sandboxing" href="/th/gateway/sandboxing" icon="box">
    โหมด sandbox และการเข้าถึง workspace
  </Card>
  <Card title="ความปลอดภัย" href="/th/gateway/security" icon="lock">
    โมเดลความปลอดภัยและการเพิ่มความแข็งแกร่ง
  </Card>
  <Card title="Sandbox เทียบกับนโยบาย tool เทียบกับ elevated" href="/th/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    ควรใช้การควบคุมแต่ละแบบเมื่อใด
  </Card>
  <Card title="Skills" href="/th/tools/skills" icon="sparkles">
    ลักษณะการอนุญาตอัตโนมัติที่อิงกับ Skills
  </Card>
</CardGroup>
