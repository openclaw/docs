---
read_when:
    - คำสั่ง ClawHub CLI หรือ OpenClaw registry ล้มเหลว
    - ไม่สามารถติดตั้ง เผยแพร่ หรืออัปเดตแพ็กเกจได้
summary: การแก้ไขปัญหาการลงชื่อเข้าใช้ การติดตั้ง การเผยแพร่ การอัปเดต และปัญหา API ของ ClawHub
x-i18n:
    generated_at: "2026-06-28T20:43:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# การแก้ไขปัญหา

## `clawhub login` เปิดเบราว์เซอร์แต่ไม่เสร็จสมบูรณ์

CLI จะเริ่มเซิร์ฟเวอร์ callback ภายในเครื่องที่มีอายุสั้นระหว่างการเข้าสู่ระบบผ่านเบราว์เซอร์

- ตรวจสอบให้แน่ใจว่าเบราว์เซอร์ของคุณเข้าถึง `http://127.0.0.1:<port>/callback` ได้
- ตรวจสอบไฟร์วอลล์ภายในเครื่อง, VPN และกฎ proxy หาก callback ไม่มาถึง
- ในสภาพแวดล้อมแบบ headless ให้สร้าง API token ใน UI เว็บของ ClawHub แล้วรัน:

```bash
clawhub login --token clh_...
```

## `whoami` หรือ `publish` คืนค่า `Unauthorized` (401)

- เข้าสู่ระบบอีกครั้งด้วย `clawhub login`
- หากคุณใช้พาธ config แบบกำหนดเอง ให้ยืนยันว่า `CLAWHUB_CONFIG_PATH` ชี้ไปยัง
  ไฟล์ที่มี token ปัจจุบันของคุณ
- หากคุณใช้ API token ให้ยืนยันว่าไม่ได้ถูกเพิกถอนใน UI เว็บ

## การค้นหาหรือติดตั้งคืนค่า `Rate limit exceeded` (429)

อ่านข้อมูลการลองใหม่ใน response:

- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่
- `RateLimit-Limit`: ขีดจำกัดที่ใช้กับ request นี้
- `RateLimit-Remaining`: โควตาที่เหลืออยู่จริงของคุณเมื่อมี header นี้อยู่ สำหรับ `429` ค่านี้คือ `0`
- `RateLimit-Reset` หรือ `X-RateLimit-Reset`: เวลาการรีเซ็ต

หากผู้ใช้หลายคนใช้ egress IP เดียวกันร่วมกัน ขีดจำกัด IP แบบ anonymous อาจถูกใช้จนเต็มได้แม้แต่ละ
คนส่ง request เพียงไม่กี่ครั้ง เข้าสู่ระบบเมื่อทำได้ แล้วลองใหม่หลังจาก
ระยะเวลาหน่วงที่รายงานไว้

## การค้นหาหรือติดตั้งล้มเหลวหลัง proxy

CLI เคารพตัวแปร proxy มาตรฐาน:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

ชื่อที่รองรับรวมถึง `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` และ
`http_proxy`

## สกิลไม่ปรากฏในการค้นหา

- ตรวจสอบ slug หรือหน้าเจ้าของที่ตรงกัน หากคุณทราบ
- ยืนยันว่า release เป็น public และไม่ได้ถูกค้างไว้โดยการสแกนหรือการกลั่นกรอง
- หากคุณเป็นเจ้าของสกิล ให้เข้าสู่ระบบและตรวจสอบ:

```bash
clawhub inspect @openclaw/demo
```

diagnostics ที่เจ้าของมองเห็นอาจอธิบายสถานะการสแกน, upload-gate หรือการกลั่นกรองได้

## การเผยแพร่ล้มเหลวเพราะไม่มี metadata ที่จำเป็น

สำหรับสกิล ให้ตรวจสอบ frontmatter ของ `SKILL.md` ควรประกาศตัวแปรสภาพแวดล้อมและ
tools ที่จำเป็นเพื่อให้ผู้ใช้และ scanner เข้าใจ package ได้

สำหรับ plugins ให้ตรวจสอบ metadata ความเข้ากันได้ใน `package.json` การเผยแพร่ code-plugin
ต้องมีฟิลด์ความเข้ากันได้ของ OpenClaw เช่น `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion`

ดูตัวอย่าง publish payload ก่อน:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## การเผยแพร่ล้มเหลวด้วยข้อผิดพลาดเจ้าของ GitHub หรือ source

ClawHub ใช้ตัวตน GitHub และการระบุแหล่งที่มาของ source เพื่อเชื่อม package กับ
ผู้เผยแพร่

- ตรวจสอบให้แน่ใจว่าคุณเข้าสู่ระบบด้วยบัญชี GitHub ที่เป็นเจ้าของหรือสามารถเผยแพร่
  package ได้
- ตรวจสอบว่า source URL เป็น public หรือ ClawHub เข้าถึงได้
- สำหรับ source จาก GitHub ให้ใช้ `owner/repo`, `owner/repo@ref` หรือ GitHub URL แบบเต็ม

## การเผยแพร่ล้มเหลวเพราะ namespace ถูกอ้างสิทธิ์หรือสงวนไว้แล้ว

หากการเผยแพร่ล้มเหลวเพราะ owner handle, org namespace, package scope, slug ของสกิล
หรือชื่อ package ถูกอ้างสิทธิ์หรือสงวนไว้แล้ว ก่อนอื่นให้ยืนยันว่าคุณกำลัง
เผยแพร่ด้วยเจ้าของที่ตรงกับ namespace สำหรับ package ของ Plugin
ชื่อแบบ scoped เช่น `@example-org/example-plugin` ต้องเผยแพร่ในฐานะเจ้าของ
`example-org` ที่ตรงกัน

หากคุณเชื่อว่าองค์กร, โปรเจกต์ หรือแบรนด์ของคุณเป็นเจ้าของ namespace ที่ถูกต้องตามสิทธิ์ แต่
คุณไม่สามารถจัดการเจ้าของ ClawHub ปัจจุบันได้ ให้เปิด
[issue การอ้างสิทธิ์องค์กร / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
พร้อมหลักฐานสาธารณะที่ไม่ละเอียดอ่อน ดู
[การอ้างสิทธิ์องค์กรและ Namespace](/th/clawhub/namespace-claims) สำหรับแนวทางด้านหลักฐานและสิ่งที่
ควรหลีกเลี่ยงไม่ใส่ใน issue สาธารณะ

## `sync` บอกว่าไม่พบสกิล

`sync` จะค้นหาโฟลเดอร์ที่มี `SKILL.md` หรือ `skill.md`

ชี้ไปยัง root ที่คุณต้องการสแกน:

```bash
clawhub sync --root /path/to/skills
```

ดูตัวอย่างก่อนหากคุณไม่แน่ใจว่าจะเผยแพร่อะไร:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` ปฏิเสธเพราะมีการเปลี่ยนแปลงภายในเครื่อง

ไฟล์ภายในเครื่องไม่ตรงกับเวอร์ชันใด ๆ ที่ ClawHub รู้จัก เลือกอย่างใดอย่างหนึ่ง:

- เก็บการแก้ไขภายในเครื่องไว้และข้ามการอัปเดต
- เขียนทับด้วยเวอร์ชันที่เผยแพร่แล้ว:

```bash
clawhub update @openclaw/demo --force
```

- เผยแพร่สำเนาที่คุณแก้ไขเป็น slug ใหม่หรือ fork

## การติดตั้ง Plugin ล้มเหลวใน OpenClaw

- ใช้ source ของ ClawHub ที่ระบุชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

- ตรวจสอบหน้ารายละเอียด package สำหรับสถานะการสแกนและ metadata ความเข้ากันได้
- ยืนยันว่าเวอร์ชัน OpenClaw ของคุณเป็นไปตามช่วงความเข้ากันได้ที่ package
  ประกาศไว้
- หาก package ถูกซ่อน, ถูกค้างไว้ หรือถูกบล็อก อาจติดตั้งไม่ได้จนกว่า
  เจ้าของจะแก้ไขปัญหา

## request ของ Public API ล้มเหลว

- เคารพ header การลองใหม่ของ `429` และ cache response รายการ/ค้นหาแบบ public
- ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ที่เป็น canonical
- อย่า mirror เนื้อหาที่ซ่อน, private, ถูกค้างไว้ หรือถูกบล็อกโดยการกลั่นกรองออกนอก
  surface ของ Public API

ดู [HTTP API](/th/clawhub/http-api) สำหรับรายละเอียด endpoint
