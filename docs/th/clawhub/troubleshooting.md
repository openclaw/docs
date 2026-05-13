---
read_when:
    - ClawHub CLI หรือคำสั่งรีจิสทรีของ OpenClaw ล้มเหลว
    - ไม่สามารถติดตั้ง เผยแพร่ หรืออัปเดตแพ็กเกจได้
summary: การแก้ไขปัญหาเกี่ยวกับการลงชื่อเข้าใช้ ClawHub การติดตั้ง การเผยแพร่ การซิงค์ การอัปเดต และ API
x-i18n:
    generated_at: "2026-05-13T02:52:36Z"
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
- ในสภาพแวดล้อมแบบไม่มีหน้าจอ ให้สร้าง API token ในเว็บ UI ของ ClawHub แล้วรัน:

```bash
clawhub login --token clh_...
```

## `whoami` หรือ `publish` ส่งคืน `Unauthorized` (401)

- เข้าสู่ระบบอีกครั้งด้วย `clawhub login`
- หากคุณใช้พาธ config แบบกำหนดเอง ให้ยืนยันว่า `CLAWHUB_CONFIG_PATH` ชี้ไปยัง
  ไฟล์ที่มี token ปัจจุบันของคุณ
- หากคุณใช้ API token ให้ยืนยันว่าไม่ได้ถูกเพิกถอนในเว็บ UI

## การค้นหาหรือการติดตั้งส่งคืน `Rate limit exceeded` (429)

อ่านข้อมูลการลองใหม่ใน response:

- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่
- `RateLimit-Remaining` และ `RateLimit-Limit`: โควตาปัจจุบันของคุณ
- `RateLimit-Reset` หรือ `X-RateLimit-Reset`: เวลา reset

หากผู้ใช้หลายคนใช้ egress IP เดียวกันร่วมกัน ขีดจำกัด IP แบบไม่ระบุตัวตนอาจถูกใช้จนถึงขีดจำกัด แม้แต่ละ
คนจะส่ง request เพียงไม่กี่ครั้ง เข้าสู่ระบบเมื่อทำได้ แล้วลองใหม่หลังจาก
ระยะเวลาหน่วงที่รายงาน

## การค้นหาหรือการติดตั้งล้มเหลวหลัง proxy

CLI รองรับตัวแปร proxy มาตรฐาน:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

ชื่อที่รองรับรวมถึง `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` และ
`http_proxy`

## Skills ไม่ปรากฏในการค้นหา

- ตรวจสอบ slug ที่ถูกต้องหรือหน้า owner หากคุณรู้
- ยืนยันว่า release เป็นสาธารณะและไม่ได้ถูกระงับไว้โดยการสแกนหรือ moderation
- หากคุณเป็นเจ้าของ Skills ให้เข้าสู่ระบบแล้วตรวจสอบ:

```bash
clawhub inspect <skill-slug>
```

การวินิจฉัยที่ owner มองเห็นอาจอธิบายสถานะการสแกน, upload-gate หรือ moderation ได้

## การ publish ล้มเหลวเพราะไม่มี metadata ที่จำเป็น

สำหรับ Skills ให้ตรวจสอบ frontmatter ของ `SKILL.md` ควรประกาศ environment variables และ
tools ที่จำเป็น เพื่อให้ผู้ใช้และ scanner เข้าใจ package ได้

สำหรับ Plugin ให้ตรวจสอบ metadata ความเข้ากันได้ใน `package.json` การ publish code-plugin
ต้องมีฟิลด์ความเข้ากันได้ของ OpenClaw เช่น `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion`

ดูตัวอย่าง publish payload ก่อน:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## การ publish ล้มเหลวด้วยข้อผิดพลาด owner หรือ source ของ GitHub

ClawHub ใช้ตัวตน GitHub และการระบุแหล่งที่มาเพื่อเชื่อม package กับ
publisher ของ package นั้น

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

ไฟล์ภายในเครื่องไม่ตรงกับเวอร์ชันใดที่ ClawHub รู้จัก เลือกหนึ่งทาง:

- เก็บการแก้ไขภายในเครื่องไว้และข้าม update
- เขียนทับด้วยเวอร์ชันที่ publish แล้ว:

```bash
clawhub update <slug> --force
```

- Publish สำเนาที่คุณแก้ไขเป็น slug ใหม่หรือ fork

## การติดตั้ง Plugin ใน OpenClaw ล้มเหลว

- ใช้ source ของ ClawHub อย่างชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

- ตรวจสอบหน้ารายละเอียด package สำหรับสถานะการสแกนและ metadata ความเข้ากันได้
- ยืนยันว่าเวอร์ชัน OpenClaw ของคุณเป็นไปตามช่วงความเข้ากันได้ที่ package
  ประกาศไว้
- หาก package ถูกซ่อน ถูกระงับ หรือถูกบล็อก อาจติดตั้งไม่ได้จนกว่า
  owner จะแก้ไขปัญหา

## request ของ Public API ล้มเหลว

- เคารพ header สำหรับลองใหม่ของ `429` และ cache response ของรายการ/การค้นหาแบบสาธารณะ
- ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub canonical
- อย่าทำ mirror เนื้อหาที่ถูกซ่อน เป็นส่วนตัว ถูกระงับ หรือถูกบล็อกโดย moderation นอก
  พื้นผิว Public API

ดูรายละเอียด endpoint ที่ [HTTP API](/th/clawhub/http-api)
