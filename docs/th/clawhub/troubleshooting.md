---
read_when:
    - ClawHub CLI หรือคำสั่งรีจิสทรีของ OpenClaw ล้มเหลว
    - ไม่สามารถติดตั้ง เผยแพร่ หรืออัปเดตแพ็กเกจได้
summary: การแก้ไขปัญหาเกี่ยวกับการลงชื่อเข้าใช้ ClawHub, การติดตั้ง, การเผยแพร่, การซิงค์, การอัปเดต และ API
x-i18n:
    generated_at: "2026-05-12T12:50:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# การแก้ไขปัญหา

## `clawhub login` เปิดเบราว์เซอร์แต่ไม่เสร็จสมบูรณ์

CLI จะเริ่มเซิร์ฟเวอร์ callback ในเครื่องแบบอายุสั้นระหว่างการเข้าสู่ระบบผ่านเบราว์เซอร์

- ตรวจสอบให้แน่ใจว่าเบราว์เซอร์ของคุณเข้าถึง `http://127.0.0.1:<port>/callback` ได้
- ตรวจสอบไฟร์วอลล์ในเครื่อง, VPN และกฎพร็อกซี หาก callback ไม่มาถึง
- ในสภาพแวดล้อมแบบ headless ให้สร้าง API token ในเว็บ UI ของ ClawHub แล้วรัน:

```bash
clawhub login --token clh_...
```

## `whoami` หรือ `publish` ส่งคืน `Unauthorized` (401)

- ลงชื่อเข้าใช้อีกครั้งด้วย `clawhub login`
- หากคุณใช้พาธ config แบบกำหนดเอง ให้ยืนยันว่า `CLAWHUB_CONFIG_PATH` ชี้ไปยัง
  ไฟล์ที่มี token ปัจจุบันของคุณ
- หากคุณใช้ API token ให้ยืนยันว่า token นั้นไม่ได้ถูกเพิกถอนในเว็บ UI

## การค้นหาหรือการติดตั้งส่งคืน `Rate limit exceeded` (429)

อ่านข้อมูลการลองใหม่ใน response:

- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่
- `RateLimit-Remaining` และ `RateLimit-Limit`: โควตาปัจจุบันของคุณ
- `RateLimit-Reset` หรือ `X-RateLimit-Reset`: เวลาที่จะรีเซ็ต

หากผู้ใช้หลายคนใช้ egress IP เดียวกันร่วมกัน อาจชนขีดจำกัด IP แบบ anonymous ได้ แม้ว่าแต่ละ
คนจะส่ง request เพียงไม่กี่ครั้งเท่านั้น ลงชื่อเข้าใช้เมื่อทำได้ แล้วลองใหม่หลังจาก
ระยะเวลาหน่วงที่รายงาน

## การค้นหาหรือการติดตั้งล้มเหลวเมื่ออยู่หลังพร็อกซี

CLI รองรับตัวแปรพร็อกซีมาตรฐาน:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

ชื่อที่รองรับรวมถึง `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` และ
`http_proxy`

## Skill ไม่ปรากฏในการค้นหา

- ตรวจสอบ slug ที่แน่นอนหรือหน้าของเจ้าของ หากคุณทราบ
- ยืนยันว่า release เป็น public และไม่ได้ถูกระงับโดยการสแกนหรือการดูแลเนื้อหา
- หากคุณเป็นเจ้าของ Skill ให้ลงชื่อเข้าใช้แล้วตรวจสอบ:

```bash
clawhub inspect <skill-slug>
```

diagnostics ที่เจ้าของมองเห็นได้อาจอธิบายสถานะการสแกน, upload-gate หรือการดูแลเนื้อหา

## การ publish ล้มเหลวเพราะ metadata ที่จำเป็นขาดหาย

สำหรับ Skills ให้ตรวจสอบ frontmatter ของ `SKILL.md` ควรประกาศตัวแปรสภาพแวดล้อมและ
เครื่องมือที่จำเป็น เพื่อให้ผู้ใช้และตัวสแกนเข้าใจ package ได้

สำหรับ Plugin ให้ตรวจสอบ metadata ความเข้ากันได้ใน `package.json` การ publish code-plugin
ต้องมีฟิลด์ความเข้ากันได้ของ OpenClaw เช่น `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion`

ดูตัวอย่าง payload สำหรับ publish ก่อน:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## การ publish ล้มเหลวด้วยข้อผิดพลาดเกี่ยวกับเจ้าของ GitHub หรือ source

ClawHub ใช้ข้อมูลระบุตัวตนของ GitHub และการระบุที่มาของ source เพื่อเชื่อม package กับ
ผู้ publish

- ตรวจสอบให้แน่ใจว่าคุณลงชื่อเข้าใช้ด้วยบัญชี GitHub ที่เป็นเจ้าของหรือสามารถ publish
  package ได้
- ตรวจสอบว่า source URL เป็น public หรือ ClawHub เข้าถึงได้
- สำหรับ source จาก GitHub ให้ใช้ `owner/repo`, `owner/repo@ref` หรือ GitHub URL แบบเต็ม

## `sync` แจ้งว่าไม่พบ Skills

`sync` จะค้นหาโฟลเดอร์ที่มี `SKILL.md` หรือ `skill.md`

ชี้ไปยัง root ที่คุณต้องการสแกน:

```bash
clawhub sync --root /path/to/skills
```

ดูตัวอย่างก่อนหากคุณไม่แน่ใจว่าจะมีอะไรถูก publish:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` ปฏิเสธเพราะมีการเปลี่ยนแปลงในเครื่อง

ไฟล์ในเครื่องไม่ตรงกับเวอร์ชันใดที่ ClawHub รู้จัก เลือกหนึ่งตัวเลือก:

- เก็บการแก้ไขในเครื่องไว้และข้ามการ update
- เขียนทับด้วยเวอร์ชันที่ publish แล้ว:

```bash
clawhub update <slug> --force
```

- Publish สำเนาที่คุณแก้ไขเป็น slug ใหม่หรือ fork

## การติดตั้ง Plugin ล้มเหลวใน OpenClaw

- ใช้ source ของ ClawHub แบบชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

- ตรวจสอบหน้ารายละเอียด package สำหรับสถานะการสแกนและ metadata ความเข้ากันได้
- ยืนยันว่าเวอร์ชัน OpenClaw ของคุณตรงตามช่วงความเข้ากันได้ที่ package ประกาศไว้
- หาก package ถูกซ่อน, ถูกระงับ หรือถูกบล็อก อาจไม่สามารถติดตั้งได้จนกว่า
  เจ้าของจะแก้ไขปัญหา

## request ไปยัง Public API ล้มเหลว

- เคารพ header สำหรับการลองใหม่ของ `429` และ cache response ของรายการ/การค้นหาแบบ public
- ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ที่เป็น canonical
- อย่า mirror เนื้อหาที่ถูกซ่อน, เป็น private, ถูกระงับ หรือถูกบล็อกโดยการดูแลเนื้อหาภายนอก
  surface ของ Public API

ดูรายละเอียด endpoint ได้ที่ [HTTP API](/th/clawhub/http-api)
