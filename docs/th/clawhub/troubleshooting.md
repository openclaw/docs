---
read_when:
    - คำสั่ง ClawHub CLI หรือคำสั่งรีจิสทรีของ OpenClaw ล้มเหลว
    - แพ็กเกจไม่สามารถติดตั้ง เผยแพร่ หรืออัปเดตได้
summary: การแก้ไขปัญหาการลงชื่อเข้าใช้ การติดตั้ง การเผยแพร่ การซิงค์ การอัปเดต และปัญหา API ของ ClawHub
x-i18n:
    generated_at: "2026-05-12T00:58:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# การแก้ไขปัญหา

## `clawhub login` เปิดเบราว์เซอร์แต่ไม่เสร็จสมบูรณ์

CLI จะเริ่มเซิร์ฟเวอร์ callback ภายในเครื่องที่มีอายุสั้นระหว่างการเข้าสู่ระบบผ่านเบราว์เซอร์

- ตรวจสอบว่าเบราว์เซอร์ของคุณเข้าถึง `http://127.0.0.1:<port>/callback` ได้
- ตรวจสอบไฟร์วอลล์ภายในเครื่อง, VPN และกฎ proxy หาก callback ไม่มาถึง
- ในสภาพแวดล้อมแบบไม่มีหน้าจอ ให้สร้างโทเค็น API ในเว็บ UI ของ ClawHub แล้วรัน:

```bash
clawhub login --token clh_...
```

## `whoami` หรือ `publish` คืนค่า `Unauthorized` (401)

- เข้าสู่ระบบอีกครั้งด้วย `clawhub login`
- หากคุณใช้เส้นทาง config แบบกำหนดเอง ให้ยืนยันว่า `CLAWHUB_CONFIG_PATH` ชี้ไปยัง
  ไฟล์ที่มีโทเค็นปัจจุบันของคุณ
- หากคุณใช้โทเค็น API ให้ยืนยันว่าโทเค็นนั้นไม่ได้ถูกเพิกถอนในเว็บ UI

## การค้นหาหรือการติดตั้งคืนค่า `Rate limit exceeded` (429)

อ่านข้อมูลการลองใหม่ใน response:

- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่
- `RateLimit-Remaining` และ `RateLimit-Limit`: โควตาปัจจุบันของคุณ
- `RateLimit-Reset` หรือ `X-RateLimit-Reset`: เวลาที่จะรีเซ็ต

หากผู้ใช้หลายคนใช้ IP ขาออกเดียวกันร่วมกัน ขีดจำกัด IP แบบ anonymous อาจถูกใช้งานจนถึงขีดจำกัดแม้แต่ละ
คนจะส่ง request เพียงไม่กี่ครั้ง เข้าสู่ระบบเมื่อทำได้ และลองใหม่หลังจากเวลาหน่วงที่รายงานไว้

## การค้นหาหรือการติดตั้งล้มเหลวเมื่ออยู่หลัง proxy

CLI รองรับตัวแปร proxy มาตรฐาน:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

ชื่อที่รองรับรวมถึง `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` และ
`http_proxy`

## Skill ไม่ปรากฏในการค้นหา

- ตรวจสอบ slug ที่ถูกต้องหรือหน้า owner หากคุณทราบ
- ยืนยันว่า release เป็นสาธารณะและไม่ได้ถูกระงับโดยการสแกนหรือ moderation
- หากคุณเป็นเจ้าของ Skill ให้เข้าสู่ระบบแล้วตรวจสอบ:

```bash
clawhub inspect <skill-slug>
```

diagnostics ที่ owner มองเห็นได้อาจอธิบายสถานะการสแกน, upload-gate หรือ moderation

## การ publish ล้มเหลวเพราะขาด metadata ที่จำเป็น

สำหรับ Skills ให้ตรวจสอบ frontmatter ของ `SKILL.md` ควรประกาศ environment variables และ
tools ที่จำเป็นเพื่อให้ผู้ใช้และ scanner เข้าใจ package ได้

สำหรับ plugins ให้ตรวจสอบ metadata ความเข้ากันได้ใน `package.json` การ publish code-plugin
ต้องมีฟิลด์ความเข้ากันได้ของ OpenClaw เช่น `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion`

ดูตัวอย่าง payload สำหรับ publish ก่อน:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## การ publish ล้มเหลวด้วยข้อผิดพลาด GitHub owner หรือ source

ClawHub ใช้ตัวตน GitHub และการระบุที่มาของ source เพื่อเชื่อม package กับ
publisher ของ package นั้น

- ตรวจสอบว่าคุณเข้าสู่ระบบด้วยบัญชี GitHub ที่เป็นเจ้าของหรือสามารถ publish
  package ได้
- ตรวจสอบว่า source URL เป็นสาธารณะหรือ ClawHub เข้าถึงได้
- สำหรับ source บน GitHub ให้ใช้ `owner/repo`, `owner/repo@ref` หรือ GitHub URL แบบเต็ม

## `sync` แจ้งว่าไม่พบ Skills

`sync` จะค้นหาโฟลเดอร์ที่มี `SKILL.md` หรือ `skill.md`

ชี้ไปยัง root ที่คุณต้องการสแกน:

```bash
clawhub sync --root /path/to/skills
```

ดูตัวอย่างก่อนหากคุณไม่แน่ใจว่าอะไรจะถูก publish:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` ปฏิเสธเพราะมีการเปลี่ยนแปลงภายในเครื่อง

ไฟล์ภายในเครื่องไม่ตรงกับเวอร์ชันใดที่ ClawHub รู้จัก เลือกหนึ่งทางเลือก:

- เก็บการแก้ไขภายในเครื่องไว้และข้ามการ update
- เขียนทับด้วยเวอร์ชันที่ publish แล้ว:

```bash
clawhub update <slug> --force
```

- publish สำเนาที่คุณแก้ไขเป็น slug ใหม่หรือ fork

## การติดตั้ง Plugin ล้มเหลวใน OpenClaw

- ใช้ source จาก ClawHub อย่างชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

- ตรวจสอบหน้ารายละเอียด package สำหรับสถานะการสแกนและ metadata ความเข้ากันได้
- ยืนยันว่าเวอร์ชัน OpenClaw ของคุณตรงตามช่วงความเข้ากันได้ที่ package
  ประกาศไว้
- หาก package ถูกซ่อน ถูกระงับ หรือถูกบล็อก อาจไม่สามารถติดตั้งได้จนกว่า
  owner จะแก้ไขปัญหา

## request ไปยัง API สาธารณะล้มเหลว

- เคารพ header สำหรับลองใหม่ของ `429` และ cache response ของรายการ/การค้นหาสาธารณะ
- ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ตาม canonical
- อย่า mirror เนื้อหาที่ถูกซ่อน เป็นส่วนตัว ถูกระงับ หรือถูกบล็อกโดย moderation นอก
  public API surface

ดู [HTTP API](/th/clawhub/http-api) สำหรับรายละเอียด endpoint
