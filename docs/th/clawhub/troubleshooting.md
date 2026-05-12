---
read_when:
    - คำสั่งของ ClawHub CLI หรือคำสั่งรีจิสทรีของ OpenClaw ล้มเหลว
    - ไม่สามารถติดตั้ง เผยแพร่ หรืออัปเดตแพ็กเกจได้
summary: การแก้ไขปัญหาเกี่ยวกับการลงชื่อเข้าใช้ การติดตั้ง การเผยแพร่ การซิงค์ การอัปเดต และ API ของ ClawHub
x-i18n:
    generated_at: "2026-05-12T15:43:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# การแก้ไขปัญหา

## `clawhub login` เปิดเบราว์เซอร์แต่ไม่เสร็จสมบูรณ์

CLI จะเริ่มเซิร์ฟเวอร์ callback ภายในเครื่องที่มีอายุสั้นระหว่างการเข้าสู่ระบบผ่านเบราว์เซอร์

- ตรวจสอบให้แน่ใจว่าเบราว์เซอร์ของคุณเข้าถึง `http://127.0.0.1:<port>/callback` ได้
- ตรวจสอบไฟร์วอลล์ภายในเครื่อง, VPN และกฎ proxy หาก callback ไม่มาถึง
- ในสภาพแวดล้อมแบบ headless ให้สร้าง API token ใน ClawHub web UI แล้วเรียกใช้:

```bash
clawhub login --token clh_...
```

## `whoami` หรือ `publish` ส่งคืน `Unauthorized` (401)

- เข้าสู่ระบบอีกครั้งด้วย `clawhub login`
- หากคุณใช้เส้นทาง config แบบกำหนดเอง ให้ยืนยันว่า `CLAWHUB_CONFIG_PATH` ชี้ไปยัง
  ไฟล์ที่มี token ปัจจุบันของคุณ
- หากคุณใช้ API token ให้ยืนยันว่า token นั้นไม่ได้ถูกเพิกถอนใน web UI

## การค้นหาหรือการติดตั้งส่งคืน `Rate limit exceeded` (429)

อ่านข้อมูลการลองใหม่ใน response:

- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่
- `RateLimit-Remaining` และ `RateLimit-Limit`: โควตาปัจจุบันของคุณ
- `RateLimit-Reset` หรือ `X-RateLimit-Reset`: เวลาที่จะ reset

หากผู้ใช้จำนวนมากใช้ IP ขาออกเดียวกันร่วมกัน ขีดจำกัด IP แบบไม่ระบุตัวตนอาจถูกใช้งานจนเต็มได้แม้แต่ละ
คนจะส่งคำขอเพียงไม่กี่รายการเท่านั้น เข้าสู่ระบบเมื่อทำได้และลองใหม่หลังจาก
ระยะเวลาหน่วงที่รายงาน

## การค้นหาหรือการติดตั้งล้มเหลวหลัง proxy

CLI เคารพตัวแปร proxy มาตรฐาน:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

ชื่อที่รองรับรวมถึง `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` และ
`http_proxy`

## Skills ไม่ปรากฏในการค้นหา

- ตรวจสอบ slug ที่แน่นอนหรือหน้าเจ้าของหากคุณทราบ
- ยืนยันว่า release เป็นสาธารณะและไม่ได้ถูกระงับโดยการสแกนหรือการกลั่นกรอง
- หากคุณเป็นเจ้าของ Skills ให้เข้าสู่ระบบและตรวจสอบ:

```bash
clawhub inspect <skill-slug>
```

ข้อมูลวินิจฉัยที่เจ้าของมองเห็นอาจอธิบายสถานะการสแกน, upload-gate หรือการกลั่นกรอง

## การ publish ล้มเหลวเพราะ metadata ที่จำเป็นขาดหาย

สำหรับ Skills ให้ตรวจสอบ frontmatter ของ `SKILL.md` ควรประกาศตัวแปรสภาพแวดล้อมและ
เครื่องมือที่จำเป็นเพื่อให้ผู้ใช้และตัวสแกนเข้าใจ package ได้

สำหรับ Plugin ให้ตรวจสอบ metadata ความเข้ากันได้ใน `package.json` การ publish แบบ code-plugin
ต้องมีฟิลด์ความเข้ากันได้ของ OpenClaw เช่น `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion`

ดูตัวอย่าง publish payload ก่อน:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## การ publish ล้มเหลวด้วยข้อผิดพลาดเจ้าของ GitHub หรือ source

ClawHub ใช้ตัวตน GitHub และการระบุที่มา source เพื่อเชื่อม package กับ
ผู้เผยแพร่

- ตรวจสอบให้แน่ใจว่าคุณเข้าสู่ระบบด้วยบัญชี GitHub ที่เป็นเจ้าของหรือสามารถ publish
  package ได้
- ตรวจสอบว่า source URL เป็นสาธารณะหรือ ClawHub เข้าถึงได้
- สำหรับ GitHub sources ให้ใช้ `owner/repo`, `owner/repo@ref` หรือ GitHub URL แบบเต็ม

## `sync` แจ้งว่าไม่พบ Skills

`sync` จะค้นหาโฟลเดอร์ที่มี `SKILL.md` หรือ `skill.md`

ชี้ไปยัง root ที่คุณต้องการสแกน:

```bash
clawhub sync --root /path/to/skills
```

ดูตัวอย่างก่อนหากคุณไม่แน่ใจว่าจะ publish อะไร:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` ปฏิเสธเพราะมีการเปลี่ยนแปลงภายในเครื่อง

ไฟล์ภายในเครื่องไม่ตรงกับเวอร์ชันใดๆ ที่ ClawHub รู้จัก เลือกอย่างใดอย่างหนึ่ง:

- เก็บการแก้ไขภายในเครื่องไว้และข้ามการ update
- เขียนทับด้วยเวอร์ชันที่ publish แล้ว:

```bash
clawhub update <slug> --force
```

- Publish สำเนาที่แก้ไขของคุณเป็น slug ใหม่หรือ fork

## การติดตั้ง Plugin ล้มเหลวใน OpenClaw

- ใช้ source ของ ClawHub อย่างชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

- ตรวจสอบหน้ารายละเอียด package สำหรับสถานะการสแกนและ metadata ความเข้ากันได้
- ยืนยันว่าเวอร์ชัน OpenClaw ของคุณตรงตามช่วงความเข้ากันได้ที่ package
  ประกาศไว้
- หาก package ถูกซ่อน, ถูกระงับ หรือถูกบล็อก อาจไม่สามารถติดตั้งได้จนกว่า
  เจ้าของจะแก้ไขปัญหา

## คำขอ Public API ล้มเหลว

- เคารพ header การลองใหม่ของ `429` และ cache response รายการ/การค้นหาแบบสาธารณะ
- ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ที่เป็น canonical
- อย่า mirror เนื้อหาที่ซ่อน, เป็นส่วนตัว, ถูกระงับ หรือถูกบล็อกด้วยการกลั่นกรองนอก
  พื้นผิว Public API

ดูรายละเอียด endpoint ได้ที่ [HTTP API](/th/clawhub/http-api)
