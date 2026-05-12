---
read_when:
    - คำสั่ง ClawHub CLI หรือคำสั่งรีจิสทรีของ OpenClaw ล้มเหลว
    - ไม่สามารถติดตั้ง เผยแพร่ หรืออัปเดตแพ็กเกจได้
summary: การแก้ไขปัญหาเกี่ยวกับการลงชื่อเข้าใช้ การติดตั้ง การเผยแพร่ การซิงค์ การอัปเดต และ API ของ ClawHub
x-i18n:
    generated_at: "2026-05-12T23:30:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# การแก้ปัญหา

## `clawhub login` เปิดเบราว์เซอร์แต่ไม่เสร็จสมบูรณ์

CLI จะเริ่มเซิร์ฟเวอร์ callback ภายในเครื่องที่มีอายุสั้นระหว่างการเข้าสู่ระบบผ่านเบราว์เซอร์

- ตรวจสอบให้แน่ใจว่าเบราว์เซอร์ของคุณเข้าถึง `http://127.0.0.1:<port>/callback` ได้
- ตรวจสอบกฎ firewall, VPN และ proxy ภายในเครื่อง หาก callback ไม่มาถึง
- ในสภาพแวดล้อม headless ให้สร้าง API token ใน ClawHub web UI แล้วรัน:

```bash
clawhub login --token clh_...
```

## `whoami` หรือ `publish` ส่งคืน `Unauthorized` (401)

- ลงชื่อเข้าใช้อีกครั้งด้วย `clawhub login`
- หากคุณใช้เส้นทาง config แบบกำหนดเอง ให้ยืนยันว่า `CLAWHUB_CONFIG_PATH` ชี้ไปยัง
  ไฟล์ที่มี token ปัจจุบันของคุณ
- หากคุณใช้ API token ให้ยืนยันว่า token นั้นไม่ได้ถูกเพิกถอนใน web UI

## การค้นหาหรือการติดตั้งส่งคืน `Rate limit exceeded` (429)

อ่านข้อมูลการลองใหม่ใน response:

- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่
- `RateLimit-Remaining` และ `RateLimit-Limit`: โควตาปัจจุบันของคุณ
- `RateLimit-Reset` หรือ `X-RateLimit-Reset`: เวลาที่จะรีเซ็ต

หากผู้ใช้หลายคนใช้ IP ขาออกเดียวกันร่วมกัน อาจถึงขีดจำกัด IP แบบไม่ระบุตัวตนได้ แม้แต่ละ
คนจะส่งคำขอเพียงไม่กี่ครั้งก็ตาม ลงชื่อเข้าใช้เมื่อทำได้ แล้วลองใหม่หลังจากระยะเวลาหน่วงที่
รายงานไว้

## การค้นหาหรือการติดตั้งล้มเหลวเมื่ออยู่หลัง proxy

CLI รองรับตัวแปร proxy มาตรฐาน:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

ชื่อที่รองรับรวมถึง `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` และ
`http_proxy`

## Skill ไม่ปรากฏในการค้นหา

- ตรวจสอบ slug หรือหน้าเจ้าของที่แน่นอนหากคุณรู้
- ยืนยันว่า release เป็นสาธารณะและไม่ได้ถูกระงับไว้โดยการสแกนหรือการกลั่นกรอง
- หากคุณเป็นเจ้าของ Skill ให้ลงชื่อเข้าใช้และตรวจสอบ:

```bash
clawhub inspect <skill-slug>
```

diagnostics ที่เจ้าของมองเห็นได้อาจอธิบายสถานะการสแกน upload-gate หรือการกลั่นกรอง

## Publish ล้มเหลวเพราะ metadata ที่จำเป็นหายไป

สำหรับ Skills ให้ตรวจสอบ frontmatter ของ `SKILL.md` ควรประกาศ environment variables และ
tools ที่จำเป็น เพื่อให้ผู้ใช้และ scanner เข้าใจ package ได้

สำหรับ plugins ให้ตรวจสอบ metadata ความเข้ากันได้ใน `package.json` การ publish code-plugin
ต้องมีฟิลด์ความเข้ากันได้ของ OpenClaw เช่น `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion`

ดูตัวอย่าง payload สำหรับ publish ก่อน:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publish ล้มเหลวด้วยข้อผิดพลาดเกี่ยวกับเจ้าของ GitHub หรือ source

ClawHub ใช้ตัวตน GitHub และการระบุแหล่งที่มาของ source เพื่อเชื่อมโยง packages กับ
ผู้ publish

- ตรวจสอบให้แน่ใจว่าคุณลงชื่อเข้าใช้ด้วยบัญชี GitHub ที่เป็นเจ้าของหรือสามารถ publish
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

ไฟล์ภายในเครื่องไม่ตรงกับเวอร์ชันใด ๆ ที่ ClawHub รู้จัก เลือกหนึ่งตัวเลือก:

- เก็บการแก้ไขภายในเครื่องไว้และข้ามการอัปเดต
- เขียนทับด้วยเวอร์ชันที่ publish แล้ว:

```bash
clawhub update <slug> --force
```

- Publish สำเนาที่คุณแก้ไขเป็น slug ใหม่หรือ fork

## การติดตั้ง Plugin ใน OpenClaw ล้มเหลว

- ใช้ ClawHub source แบบระบุชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

- ตรวจสอบหน้ารายละเอียด package สำหรับสถานะการสแกนและ metadata ความเข้ากันได้
- ยืนยันว่าเวอร์ชัน OpenClaw ของคุณเป็นไปตามช่วงความเข้ากันได้ที่ package ประกาศไว้
- หาก package ถูกซ่อน ถูกระงับ หรือถูกบล็อก อาจไม่สามารถติดตั้งได้จนกว่า
  เจ้าของจะแก้ไขปัญหา

## คำขอ Public API ล้มเหลว

- เคารพ header สำหรับการลองใหม่ของ `429` และ cache response ของรายการ/การค้นหาแบบสาธารณะ
- ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ที่เป็น canonical
- อย่าทำสำเนาเนื้อหาที่ถูกซ่อน เป็นส่วนตัว ถูกระงับ หรือถูกบล็อกโดยการกลั่นกรอง นอกเหนือจาก
  พื้นผิว Public API

ดูรายละเอียด endpoint ได้ที่ [HTTP API](/th/clawhub/http-api)
