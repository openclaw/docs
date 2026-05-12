---
read_when:
    - คำสั่ง ClawHub CLI หรือคำสั่งรีจิสทรีของ OpenClaw ล้มเหลว
    - ไม่สามารถติดตั้ง เผยแพร่ หรืออัปเดตแพ็กเกจได้
summary: การแก้ปัญหาเกี่ยวกับการลงชื่อเข้าใช้ การติดตั้ง การเผยแพร่ การซิงค์ การอัปเดต และ API ของ ClawHub.
x-i18n:
    generated_at: "2026-05-12T04:10:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# การแก้ไขปัญหา

## `clawhub login` เปิดเบราว์เซอร์แต่ไม่เสร็จสมบูรณ์

CLI เริ่มเซิร์ฟเวอร์ callback ในเครื่องแบบอายุสั้นระหว่างการเข้าสู่ระบบผ่านเบราว์เซอร์

- ตรวจสอบให้แน่ใจว่าเบราว์เซอร์ของคุณเข้าถึง `http://127.0.0.1:<port>/callback` ได้
- ตรวจสอบไฟร์วอลล์ในเครื่อง, VPN และกฎ proxy หาก callback ไม่มาถึง
- ในสภาพแวดล้อมแบบ headless ให้สร้าง API token ในเว็บ UI ของ ClawHub แล้วเรียกใช้:

```bash
clawhub login --token clh_...
```

## `whoami` หรือ `publish` ส่งคืน `Unauthorized` (401)

- เข้าสู่ระบบอีกครั้งด้วย `clawhub login`
- หากคุณใช้เส้นทาง config แบบกำหนดเอง ให้ยืนยันว่า `CLAWHUB_CONFIG_PATH` ชี้ไปยัง
  ไฟล์ที่มี token ปัจจุบันของคุณ
- หากคุณใช้ API token ให้ยืนยันว่าไม่ได้ถูกเพิกถอนในเว็บ UI

## การค้นหาหรือการติดตั้งส่งคืน `Rate limit exceeded` (429)

อ่านข้อมูลการลองใหม่ใน response:

- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่
- `RateLimit-Remaining` และ `RateLimit-Limit`: โควตาปัจจุบันของคุณ
- `RateLimit-Reset` หรือ `X-RateLimit-Reset`: เวลาที่จะรีเซ็ต

หากผู้ใช้จำนวนมากใช้ IP ขาออกเดียวกันร่วมกัน อาจถึงขีดจำกัด IP แบบไม่ระบุตัวตนได้ แม้แต่ละ
คนจะส่งคำขอเพียงไม่กี่รายการเท่านั้น เข้าสู่ระบบเมื่อทำได้ แล้วลองใหม่หลังจากเวลาหน่วง
ที่รายงานไว้

## การค้นหาหรือการติดตั้งล้มเหลวเมื่ออยู่หลัง proxy

CLI เคารพตัวแปร proxy มาตรฐาน:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

ชื่อที่รองรับรวมถึง `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` และ
`http_proxy`

## Skills ไม่ปรากฏในการค้นหา

- ตรวจสอบ slug ที่ตรงกันหรือหน้า owner หากคุณทราบ
- ยืนยันว่า release เป็นสาธารณะและไม่ได้ถูกพักไว้โดยการสแกนหรือการกลั่นกรอง
- หากคุณเป็นเจ้าของ Skills ให้เข้าสู่ระบบและตรวจสอบ:

```bash
clawhub inspect <skill-slug>
```

การวินิจฉัยที่ owner มองเห็นได้อาจอธิบายสถานะการสแกน, upload-gate หรือการกลั่นกรอง

## การเผยแพร่ล้มเหลวเพราะ metadata ที่จำเป็นขาดหายไป

สำหรับ Skills ให้ตรวจสอบ frontmatter ของ `SKILL.md` ควรประกาศตัวแปรสภาพแวดล้อมและ
เครื่องมือที่จำเป็นเพื่อให้ผู้ใช้และ scanner เข้าใจ package ได้

สำหรับ plugins ให้ตรวจสอบ metadata ความเข้ากันได้ใน `package.json` การเผยแพร่ code-plugin
ต้องมีฟิลด์ความเข้ากันได้ของ OpenClaw เช่น `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion`

ดูตัวอย่าง payload การเผยแพร่ก่อน:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## การเผยแพร่ล้มเหลวด้วยข้อผิดพลาดเกี่ยวกับ GitHub owner หรือ source

ClawHub ใช้ตัวตน GitHub และการระบุแหล่งที่มาเพื่อเชื่อมโยง packages กับ
ผู้เผยแพร่ของพวกเขา

- ตรวจสอบให้แน่ใจว่าคุณเข้าสู่ระบบด้วยบัญชี GitHub ที่เป็นเจ้าของหรือสามารถเผยแพร่
  package ได้
- ตรวจสอบว่า source URL เป็นสาธารณะหรือ ClawHub เข้าถึงได้
- สำหรับ source ของ GitHub ให้ใช้ `owner/repo`, `owner/repo@ref` หรือ GitHub URL แบบเต็ม

## `sync` ระบุว่าไม่พบ Skills

`sync` มองหาโฟลเดอร์ที่มี `SKILL.md` หรือ `skill.md`

ชี้ไปยัง root ที่คุณต้องการสแกน:

```bash
clawhub sync --root /path/to/skills
```

ดูตัวอย่างก่อนหากคุณไม่แน่ใจว่าจะเผยแพร่อะไร:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` ปฏิเสธเพราะมีการเปลี่ยนแปลงในเครื่อง

ไฟล์ในเครื่องไม่ตรงกับเวอร์ชันใดที่ ClawHub รู้จัก เลือกหนึ่งทาง:

- เก็บการแก้ไขในเครื่องไว้และข้ามการอัปเดต
- เขียนทับด้วยเวอร์ชันที่เผยแพร่แล้ว:

```bash
clawhub update <slug> --force
```

- เผยแพร่สำเนาที่คุณแก้ไขเป็น slug ใหม่หรือ fork

## การติดตั้ง plugin ล้มเหลวใน OpenClaw

- ใช้ source ของ ClawHub อย่างชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

- ตรวจสอบหน้ารายละเอียด package สำหรับสถานะการสแกนและ metadata ความเข้ากันได้
- ยืนยันว่าเวอร์ชัน OpenClaw ของคุณตรงตามช่วงความเข้ากันได้ที่ package
  ประกาศไว้
- หาก package ถูกซ่อน ถูกพักไว้ หรือถูกบล็อก อาจติดตั้งไม่ได้จนกว่า
  owner จะแก้ไขปัญหา

## คำขอ Public API ล้มเหลว

- เคารพ header การลองใหม่ของ `429` และ cache response ของรายการ/การค้นหาแบบสาธารณะ
- ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ที่เป็น canonical
- อย่าทำสำเนาเนื้อหาที่ซ่อน เป็นส่วนตัว ถูกพักไว้ หรือถูกบล็อกโดยการกลั่นกรองนอก
  พื้นผิว Public API

ดู [HTTP API](/th/clawhub/http-api) สำหรับรายละเอียด endpoint
