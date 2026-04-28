---
read_when:
    - การกำหนดค่าการอนุมัติการรันคำสั่งหรือ allowlist
    - การใช้งาน UX การอนุมัติการรันคำสั่งในแอป macOS
    - การตรวจสอบพรอมป์ต์สำหรับออกจาก sandbox และผลกระทบของมัน
sidebarTitle: Exec approvals
summary: 'การอนุมัติ host exec: ปุ่มควบคุมนโยบาย allowlist และเวิร์กโฟลว์ YOLO/strict'
title: การอนุมัติการรันคำสั่ง host
x-i18n:
    generated_at: "2026-04-26T11:43:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 868cee97882f7298a092bdcb9ec8fd058a5d7cb8745fad2edd712fabfb512e52
    source_path: tools/exec-approvals.md
    workflow: 15
---

การอนุมัติการรันคำสั่ง host เป็น **ราวกันความปลอดภัยของแอปคู่หู / โฮสต์ Node** สำหรับการอนุญาตให้ agent ที่อยู่ใน sandbox รันคำสั่งบน host จริง (`gateway` หรือ `node`) โดยเป็นตัวล็อกความปลอดภัย: คำสั่งจะได้รับอนุญาตก็ต่อเมื่อทั้งนโยบาย + allowlist + (ถ้ามี) การอนุมัติจากผู้ใช้ เห็นพ้องกัน การอนุมัติการรันคำสั่งจะซ้อน **ทับอยู่เหนือ** นโยบาย tool และ elevated gating (ยกเว้นเมื่อ elevated ถูกตั้งเป็น `full` ซึ่งจะข้ามการอนุมัติ)

<Note>
นโยบายที่มีผลจริงจะเป็นค่าที่ **เข้มงวดกว่า** ระหว่าง `tools.exec.*` และค่าเริ่มต้นของ approvals; หากละฟิลด์ใดใน approvals ไป จะใช้ค่าจาก `tools.exec` แทน การรันคำสั่ง host ยังใช้สถานะ approvals ภายในเครื่องบนเครื่องนั้นด้วย — หาก `ask: "always"` แบบ host-local อยู่ใน `~/.openclaw/exec-approvals.json` ก็จะยังถามทุกครั้ง แม้ว่าค่าเริ่มต้นของเซสชันหรือ config จะขอ `ask: "on-miss"` ก็ตาม
</Note>

## การตรวจสอบนโยบายที่มีผลจริง

| คำสั่ง                                                           | สิ่งที่แสดง                                                                             |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | นโยบายที่ร้องขอ แหล่งที่มาของนโยบาย host และผลลัพธ์ที่มีผลจริง                         |
| `openclaw exec-policy show`                                      | มุมมองแบบรวมของเครื่องภายในเครื่อง                                                     |
| `openclaw exec-policy set` / `preset`                            | ซิงก์นโยบายภายในเครื่องที่ร้องขอเข้ากับไฟล์ approvals ของ host ภายในเครื่องในขั้นตอนเดียว |

เมื่อ scope ภายในเครื่องร้องขอ `host=node`, `exec-policy show` จะรายงาน scope นั้นว่าเป็นการจัดการโดย Node ระหว่างรันไทม์ แทนที่จะแสร้งว่าไฟล์ approvals ภายในเครื่องคือแหล่งข้อมูลจริง

หาก UI ของแอปคู่หู **ไม่พร้อมใช้งาน** คำขอใดก็ตามที่ปกติแล้วจะต้องถาม จะถูกตัดสินตาม **ask fallback** (ค่าปริยาย: `deny`)

<Tip>
ไคลเอนต์อนุมัติแบบแชตเนทีฟสามารถเติม affordance เฉพาะแชนเนลลงในข้อความอนุมัติที่รอดำเนินการได้ ตัวอย่างเช่น Matrix จะเติมทางลัดแบบ reaction (`✅` อนุญาตครั้งเดียว, `❌` ปฏิเสธ, `♾️` อนุญาตเสมอ) ขณะเดียวกันก็ยังคงมีคำสั่ง `/approve ...` อยู่ในข้อความเป็นทางเลือกสำรอง
</Tip>

## จุดที่ใช้บังคับ

การอนุมัติการรันคำสั่งจะถูกบังคับใช้ภายในเครื่องบน host ที่ใช้รันคำสั่ง:

- **Gateway host** → โปรเซส `openclaw` บนเครื่อง gateway
- **Node host** → node runner (แอปคู่หู macOS หรือ headless node host)

### โมเดลความไว้วางใจ

- ผู้เรียกที่ยืนยันตัวตนกับ Gateway แล้ว ถือเป็นผู้ปฏิบัติงานที่เชื่อถือได้สำหรับ Gateway นั้น
- Node ที่จับคู่แล้วจะขยายความสามารถของผู้ปฏิบัติงานที่เชื่อถือได้นั้นไปยัง Node host
- การอนุมัติการรันคำสั่งช่วยลดความเสี่ยงจากการรันโดยไม่ตั้งใจ แต่ **ไม่ใช่** ขอบเขตการยืนยันตัวตนรายผู้ใช้
- การรันบน Node host ที่ได้รับอนุมัติจะผูกกับบริบทการรันแบบ canonical: `cwd` แบบ canonical, `argv` ที่ตรงกันทุกประการ, การผูก env หากมี และ path ของ executable ที่ถูกตรึงไว้หากใช้ได้
- สำหรับ shell script และการเรียกไฟล์ interpreter/runtime โดยตรง OpenClaw จะพยายามผูกกับโอเปอแรนด์ไฟล์ภายในเครื่องที่เฉพาะเจาะจงหนึ่งรายการด้วย หากไฟล์ที่ผูกไว้นั้นเปลี่ยนหลังการอนุมัติแต่ก่อนการรัน การรันจะถูกปฏิเสธแทนที่จะรันเนื้อหาที่เปลี่ยนไปแล้ว
- การผูกไฟล์นี้ตั้งใจให้เป็นแบบพยายามให้ดีที่สุด ไม่ใช่โมเดลเชิงความหมายที่สมบูรณ์สำหรับทุกเส้นทางการโหลดของ interpreter/runtime หากโหมดอนุมัติไม่สามารถระบุไฟล์ภายในเครื่องที่เฉพาะเจาะจงหนึ่งไฟล์เพื่อผูกได้ มันจะปฏิเสธการสร้างการรันที่มีการอนุมัติรองรับ แทนที่จะแสร้งว่าครอบคลุมทั้งหมด

### การแยกส่วนบน macOS

- **บริการ Node host** จะส่งต่อ `system.run` ไปยัง **แอป macOS** ผ่าน local IPC
- **แอป macOS** เป็นผู้บังคับใช้งาน approvals และรันคำสั่งในบริบทของ UI

## การตั้งค่าและการจัดเก็บ

Approvals ถูกเก็บอยู่ในไฟล์ JSON ภายในเครื่องบน host ที่ใช้รันคำสั่ง:

```text
~/.openclaw/exec-approvals.json
```

สคีมาตัวอย่าง:

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

## ปุ่มควบคุมนโยบาย

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — บล็อกคำขอรันคำสั่งบน host ทั้งหมด
  - `allowlist` — อนุญาตเฉพาะคำสั่งที่อยู่ใน allowlist
  - `full` — อนุญาตทุกอย่าง (เทียบเท่ากับ elevated)

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — ไม่ถามเลย
  - `on-miss` — ถามเฉพาะเมื่อ allowlist ไม่ตรง
  - `always` — ถามทุกคำสั่ง ความไว้วางใจแบบถาวร `allow-always` **จะไม่** ระงับการถามเมื่อโหมด ask ที่มีผลจริงเป็น `always`

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  วิธีตัดสินเมื่อจำเป็นต้องถามแต่ไม่สามารถเข้าถึง UI ได้

- `deny` — บล็อก
- `allowlist` — อนุญาตเฉพาะเมื่อ allowlist ตรง
- `full` — อนุญาต

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  เมื่อเป็น `true`, OpenClaw จะถือว่ารูปแบบ inline code-eval เป็นแบบต้องอนุมัติเท่านั้น แม้ว่าไบนารี interpreter เองจะอยู่ใน allowlist ก็ตาม เป็นการป้องกันเชิงลึกสำหรับตัวโหลดของ interpreter ที่ไม่สามารถแมปกับโอเปอแรนด์ไฟล์คงที่เพียงไฟล์เดียวได้อย่างสะอาด
</ParamField>

ตัวอย่างที่ strict mode จะจับได้:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

ใน strict mode คำสั่งเหล่านี้ยังคงต้องได้รับการอนุมัติอย่างชัดเจน และ `allow-always` จะไม่คงรายการ allowlist ใหม่ให้โดยอัตโนมัติสำหรับคำสั่งเหล่านี้

## โหมด YOLO (ไม่ต้องอนุมัติ)

หากคุณต้องการให้การรันคำสั่ง host ทำงานโดยไม่มีพรอมป์ต์ขออนุมัติ คุณต้องเปิด **ทั้งสอง** ชั้นนโยบาย — ทั้งนโยบาย exec ที่ร้องขอใน config ของ OpenClaw (`tools.exec.*`) **และ** นโยบาย approvals แบบ host-local ใน `~/.openclaw/exec-approvals.json`

YOLO คือพฤติกรรม host ปริยาย เว้นแต่คุณจะทำให้มันเข้มงวดขึ้นอย่างชัดเจน:

| ชั้น                  | การตั้งค่า YOLO            |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` บน `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**ข้อแตกต่างสำคัญ:**

- `tools.exec.host=auto` ใช้เลือก **ตำแหน่ง** ที่จะรัน exec: ใน sandbox หากมี มิฉะนั้นใช้ gateway
- YOLO ใช้เลือก **วิธี** อนุมัติ host exec: `security=full` ร่วมกับ `ask=off`
- ในโหมด YOLO OpenClaw **จะไม่** เพิ่มชั้นอนุมัติแยกต่างหากสำหรับการอำพรางคำสั่งแบบฮิวริสติก หรือชั้นปฏิเสธ script-preflight ทับนโยบาย host exec ที่ตั้งค่าไว้
- `auto` ไม่ได้ทำให้การส่งผ่านไป gateway เป็นการ override ฟรีจากเซสชันที่อยู่ใน sandbox คำขอ `host=node` แบบต่อการเรียกหนึ่งครั้งอนุญาตได้จาก `auto`; ส่วน `host=gateway` จะอนุญาตจาก `auto` ได้ก็ต่อเมื่อไม่มี sandbox runtime ทำงานอยู่ สำหรับค่าเริ่มต้นที่เสถียรและไม่ใช่ auto ให้ตั้ง `tools.exec.host` หรือใช้ `/exec host=...` อย่างชัดเจน

</Warning>

ผู้ให้บริการแบบอิง CLI ที่เปิดเผยโหมดสิทธิ์แบบไม่โต้ตอบของตนเอง สามารถปฏิบัติตามนโยบายนี้ได้ Claude CLI จะเพิ่ม `--permission-mode bypassPermissions` เมื่อ exec policy ที่ OpenClaw ร้องขอเป็น YOLO คุณสามารถ override พฤติกรรมของแบ็กเอนด์นั้นได้ด้วยอาร์กิวเมนต์ของ Claude แบบชัดเจนภายใต้ `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` — ตัวอย่างเช่น `--permission-mode default`, `acceptEdits` หรือ `bypassPermissions`

หากคุณต้องการการตั้งค่าที่ระมัดระวังกว่านี้ ให้ปรับชั้นใดชั้นหนึ่งกลับไปเป็น `allowlist` / `on-miss` หรือ `deny`

### การตั้งค่า gateway-host แบบถาวรให้ "ไม่ถามเลย"

<Steps>
  <Step title="ตั้งค่านโยบาย config ที่ร้องขอ">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="ทำให้ตรงกับไฟล์ approvals ของ host">
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

ทางลัดภายในเครื่องนี้จะอัปเดตทั้ง:

- `tools.exec.host/security/ask` ภายในเครื่อง
- ค่าเริ่มต้นใน `~/.openclaw/exec-approvals.json` ภายในเครื่อง

ทางลัดนี้ตั้งใจให้ใช้ได้เฉพาะภายในเครื่องเท่านั้น หากต้องการเปลี่ยน approvals ของ gateway-host หรือ node-host จากระยะไกล ให้ใช้ `openclaw approvals set --gateway` หรือ `openclaw approvals set --node <id|name|ip>`

### Node host

สำหรับ Node host ให้ใช้ไฟล์ approvals แบบเดียวกันบน Node นั้นแทน:

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

- `openclaw exec-policy` จะไม่ซิงก์ approvals ของ Node
- `openclaw exec-policy set --host node` จะถูกปฏิเสธ
- approvals ของ Node exec จะถูกดึงมาจาก Node ระหว่างรันไทม์ ดังนั้นการอัปเดตที่มุ่งไปยัง Node ต้องใช้ `openclaw approvals --node ...`

</Note>

### ทางลัดเฉพาะเซสชัน

- `/exec security=full ask=off` จะเปลี่ยนเฉพาะเซสชันปัจจุบัน
- `/elevated full` คือทางลัดแบบ break-glass ที่จะข้าม exec approvals สำหรับเซสชันนั้นด้วย

หากไฟล์ approvals ของ host ยังคงเข้มงวดกว่า config นโยบายของ host ที่เข้มงวดกว่าจะยังคงเป็นฝ่ายชนะ

## Allowlist (ต่อ agent)

Allowlists เป็นแบบ **ต่อ agent** หากมีหลาย agent ให้สลับ agent ที่คุณกำลังแก้ไขในแอป macOS pattern เป็นการจับคู่แบบ glob

Pattern อาจเป็น glob ของ path ไบนารีที่ถูก resolve แล้ว หรือ glob ของชื่อคำสั่งแบบเปล่า ๆ ก็ได้ ชื่อเปล่าจะตรงเฉพาะคำสั่งที่ถูกเรียกผ่าน `PATH` ดังนั้น `rg` สามารถตรงกับ `/opt/homebrew/bin/rg` ได้เมื่อคำสั่งคือ `rg` แต่จะ **ไม่** ตรงกับ `./rg` หรือ `/tmp/rg` ใช้ path glob เมื่อต้องการไว้วางใจไบนารีตำแหน่งใดตำแหน่งหนึ่งโดยเฉพาะ

รายการ `agents.default` แบบเดิมจะถูกย้ายเป็น `agents.main` ตอนโหลด shell chain เช่น `echo ok && pwd` ก็ยังต้องให้ทุกเซกเมนต์ระดับบนสุดเป็นไปตามกฎของ allowlist

ตัวอย่าง:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

แต่ละรายการใน allowlist จะติดตามข้อมูลดังนี้:

| ฟิลด์              | ความหมาย                              |
| ------------------ | ------------------------------------- |
| `id`               | UUID แบบคงที่ที่ใช้เป็นอัตลักษณ์ใน UI |
| `lastUsedAt`       | เวลาที่ใช้ล่าสุด                       |
| `lastUsedCommand`  | คำสั่งล่าสุดที่ตรงกับ pattern         |
| `lastResolvedPath` | path ไบนารีล่าสุดที่ถูก resolve       |

## Auto-allow สำหรับ CLI ของ Skills

เมื่อเปิดใช้ **Auto-allow skill CLIs** executable ที่ถูกอ้างถึงโดย Skills ที่รู้จักจะถูกถือว่าอยู่ใน allowlist บน Node (macOS node หรือ headless node host) ฟังก์ชันนี้ใช้ `skills.bins` ผ่าน Gateway RPC เพื่อดึงรายการ bin ของ Skills ปิดฟังก์ชันนี้หากคุณต้องการ allowlist แบบเข้มงวดที่จัดการด้วยตนเอง

<Warning>
- นี่คือ **allowlist โดยปริยายเพื่อความสะดวก** ซึ่งแยกจากรายการ allowlist ของ path แบบกำหนดเอง
- มันมีไว้สำหรับสภาพแวดล้อมของผู้ปฏิบัติงานที่เชื่อถือได้ ซึ่ง Gateway และ Node อยู่ในขอบเขตความไว้วางใจเดียวกัน
- หากคุณต้องการความไว้วางใจแบบชัดเจนและเข้มงวด ให้คง `autoAllowSkills: false` และใช้เฉพาะรายการ allowlist ของ path แบบกำหนดเอง

</Warning>

## Safe bins และการส่งต่อคำขออนุมัติ

สำหรับ safe bins (เส้นทางลัดแบบ stdin-only), รายละเอียดการผูก interpreter และวิธีส่งต่อพรอมป์ต์อนุมัติไปยัง Slack/Discord/Telegram (หรือรันเป็น native approval client) ดูได้ที่
[การอนุมัติการรันคำสั่ง host — ขั้นสูง](/th/tools/exec-approvals-advanced)

## การแก้ไขใน Control UI

ใช้การ์ด **Control UI → Nodes → Exec approvals** เพื่อแก้ไขค่าเริ่มต้น override ต่อ agent และ allowlist เลือก scope (Defaults หรือ agent) ปรับนโยบาย เพิ่ม/ลบ allowlist pattern แล้วกด **Save** UI จะแสดงข้อมูลการใช้งานล่าสุดต่อ pattern เพื่อให้คุณจัดรายการให้เรียบร้อยได้

ตัวเลือกเป้าหมายใช้สำหรับเลือก **Gateway** (approvals ภายในเครื่อง) หรือ **Node**
Node ต้องประกาศ `system.execApprovals.get/set` (แอป macOS หรือ
headless node host) หาก Node ยังไม่ได้ประกาศ exec approvals ให้แก้ไข
`~/.openclaw/exec-approvals.json` ภายในเครื่องของ Node นั้นโดยตรง

CLI: `openclaw approvals` รองรับการแก้ไขทั้ง gateway หรือ node — ดู
[Approvals CLI](/th/cli/approvals)

## โฟลว์การอนุมัติ

เมื่อจำเป็นต้องมีพรอมป์ต์ gateway จะกระจาย
`exec.approval.requested` ไปยังไคลเอนต์ของผู้ปฏิบัติงาน Control UI และแอป macOS
จะตัดสินผ่าน `exec.approval.resolve` จากนั้น gateway จะส่งต่อคำขอที่ได้รับอนุมัติไปยัง node host

สำหรับ `host=node` คำขออนุมัติจะมี payload `systemRunPlan` แบบ canonical รวมอยู่ด้วย
gateway ใช้แผนนั้นเป็นบริบท authoritative
ของคำสั่ง/cwd/เซสชัน เมื่อส่งต่อคำขอ `system.run`
ที่ได้รับอนุมัติแล้ว

สิ่งนี้สำคัญสำหรับความหน่วงของการอนุมัติแบบ async:

- เส้นทาง node exec จะเตรียมแผน canonical หนึ่งครั้งไว้ล่วงหน้า
- ระเบียนการอนุมัติจะจัดเก็บแผนนั้นพร้อมข้อมูลเมตาการผูกของมัน
- เมื่อได้รับการอนุมัติแล้ว การเรียก `system.run` ที่ถูกส่งต่อในขั้นสุดท้ายจะนำแผนที่จัดเก็บไว้กลับมาใช้ แทนที่จะเชื่อการแก้ไขของผู้เรียกในภายหลัง
- หากผู้เรียกเปลี่ยน `command`, `rawCommand`, `cwd`, `agentId` หรือ `sessionKey` หลังจากสร้างคำขออนุมัติแล้ว gateway จะปฏิเสธการรันที่ถูกส่งต่อในฐานะ approval mismatch

## เหตุการณ์ของระบบ

วงจรชีวิตของ exec จะถูกแสดงเป็นข้อความของระบบ:

- `Exec running` (เฉพาะเมื่อคำสั่งใช้เวลานานเกินเกณฑ์การแจ้งว่ากำลังรัน)
- `Exec finished`
- `Exec denied`

ข้อความเหล่านี้จะถูกโพสต์เข้าไปยังเซสชันของ agent หลังจากที่ Node รายงานเหตุการณ์แล้ว
exec approvals บน Gateway host จะปล่อยเหตุการณ์วงจรชีวิตแบบเดียวกันเมื่อคำสั่งเสร็จสิ้น
(และอาจรวมถึงตอนกำลังรันหากเกินเกณฑ์)
exec ที่ถูกควบคุมด้วยการอนุมัติจะนำ approval id มาใช้ซ้ำเป็น `runId` ในข้อความเหล่านี้เพื่อให้เชื่อมโยงกันได้ง่าย

## พฤติกรรมเมื่อการอนุมัติถูกปฏิเสธ

เมื่อการอนุมัติ exec แบบ async ถูกปฏิเสธ OpenClaw จะป้องกันไม่ให้ agent
นำเอาต์พุตจากการรันก่อนหน้าของคำสั่งเดียวกันในเซสชันนั้นกลับมาใช้ซ้ำ
เหตุผลของการปฏิเสธจะถูกส่งต่อพร้อมคำแนะนำที่ชัดเจนว่าไม่มีเอาต์พุตของคำสั่งให้ใช้
ซึ่งจะหยุดไม่ให้ agent อ้างว่ามีเอาต์พุตใหม่ หรือรันคำสั่งที่ถูกปฏิเสธซ้ำพร้อมผลลัพธ์เก่าจากการรันที่เคยสำเร็จก่อนหน้านี้

## ผลกระทบ

- **`full`** มีอำนาจสูง; ควรใช้ allowlist เมื่อเป็นไปได้
- **`ask`** ช่วยให้คุณยังอยู่ในวงจรการตัดสินใจ ขณะเดียวกันก็ยังอนุมัติได้รวดเร็ว
- allowlist แบบต่อ agent ป้องกันไม่ให้การอนุมัติของ agent หนึ่งรั่วไปยัง agent อื่น
- approvals ใช้กับคำขอ host exec จาก **ผู้ส่งที่ได้รับอนุญาต** เท่านั้น ผู้ส่งที่ไม่ได้รับอนุญาตไม่สามารถออก `/exec` ได้
- `/exec security=full` เป็นทางลัดระดับเซสชันสำหรับผู้ปฏิบัติงานที่ได้รับอนุญาต และข้าม approvals โดยการออกแบบ หากต้องการบล็อก host exec อย่างเด็ดขาด ให้ตั้ง approvals security เป็น `deny` หรือปฏิเสธ tool `exec` ผ่าน tool policy

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การอนุมัติการรันคำสั่ง host — ขั้นสูง" href="/th/tools/exec-approvals-advanced" icon="gear">
    Safe bins การผูก interpreter และการส่งต่อคำขออนุมัติไปยังแชต
  </Card>
  <Card title="tool Exec" href="/th/tools/exec" icon="terminal">
    tool สำหรับรันคำสั่งเชลล์
  </Card>
  <Card title="โหมด Elevated" href="/th/tools/elevated" icon="shield-exclamation">
    เส้นทาง break-glass ที่ข้าม approvals ด้วย
  </Card>
  <Card title="Sandboxing" href="/th/gateway/sandboxing" icon="box">
    โหมด sandbox และการเข้าถึง workspace
  </Card>
  <Card title="ความปลอดภัย" href="/th/gateway/security" icon="lock">
    โมเดลความปลอดภัยและการทำ hardening
  </Card>
  <Card title="Sandbox เทียบกับ tool policy เทียบกับ elevated" href="/th/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    ควรใช้ตัวควบคุมแต่ละแบบเมื่อใด
  </Card>
  <Card title="Skills" href="/th/tools/skills" icon="sparkles">
    พฤติกรรม auto-allow ที่ขับเคลื่อนด้วย Skill
  </Card>
</CardGroup>
