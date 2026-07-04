---
read_when:
    - คำสั่ง ClawHub CLI หรือคำสั่งรีจิสทรีของ OpenClaw ล้มเหลว
    - ไม่สามารถติดตั้ง เผยแพร่ หรืออัปเดตแพ็กเกจได้
summary: การแก้ไขปัญหาการลงชื่อเข้าใช้ การติดตั้ง การเผยแพร่ การอัปเดต และปัญหา API ของ ClawHub
x-i18n:
    generated_at: "2026-07-04T11:07:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# การแก้ไขปัญหา

## `clawhub login` เปิดเบราว์เซอร์แต่ไม่เสร็จสมบูรณ์

CLI จะเริ่มเซิร์ฟเวอร์ callback ภายในเครื่องแบบอายุสั้นระหว่างการเข้าสู่ระบบผ่านเบราว์เซอร์

- ตรวจสอบให้แน่ใจว่าเบราว์เซอร์ของคุณเข้าถึง `http://127.0.0.1:<port>/callback` ได้
- ตรวจสอบกฎไฟร์วอลล์ภายในเครื่อง, VPN และพร็อกซี หาก callback ไม่มาถึง
- ในสภาพแวดล้อมแบบไม่มีหน้าจอ ให้สร้างโทเค็น API ในเว็บ UI ของ ClawHub แล้วเรียกใช้:

```bash
clawhub login --token clh_...
```

## `whoami` หรือ `publish` ส่งคืน `Unauthorized` (401)

- ลงชื่อเข้าใช้อีกครั้งด้วย `clawhub login`
- หากคุณใช้พาธ config แบบกำหนดเอง ให้ยืนยันว่า `CLAWHUB_CONFIG_PATH` ชี้ไปยัง
  ไฟล์ที่มีโทเค็นปัจจุบันของคุณ
- หากคุณใช้โทเค็น API ให้ยืนยันว่าโทเค็นนั้นไม่ได้ถูกเพิกถอนในเว็บ UI

## การค้นหาหรือการติดตั้งส่งคืน `Rate limit exceeded` (429)

อ่านข้อมูลการลองใหม่ในคำตอบ:

- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่
- `RateLimit-Limit`: ขีดจำกัดที่ใช้กับคำขอนี้
- `RateLimit-Remaining`: งบประมาณที่เหลืออยู่จริงของคุณเมื่อมี header นี้อยู่ บน `429` ค่านี้คือ `0`
- `RateLimit-Reset` หรือ `X-RateLimit-Reset`: เวลาการรีเซ็ต

หากผู้ใช้หลายคนใช้ IP ขาออกเดียวกันร่วมกัน อาจชนขีดจำกัด IP แบบไม่ระบุตัวตนได้ แม้แต่ละ
คนจะส่งคำขอเพียงไม่กี่รายการเท่านั้น ลงชื่อเข้าใช้เมื่อทำได้ และลองใหม่หลังจากระยะหน่วง
ที่รายงานไว้

## การค้นหาหรือการติดตั้งล้มเหลวหลังพร็อกซี

CLI เคารพตัวแปรพร็อกซีมาตรฐาน:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

ชื่อที่รองรับรวมถึง `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` และ
`http_proxy`

## Skills ไม่ปรากฏในการค้นหา

- ตรวจสอบ slug ที่แน่นอนหรือหน้า owner หากคุณทราบ
- ยืนยันว่า release เป็นสาธารณะ และไม่ได้ถูกระงับโดยการสแกนหรือการกลั่นกรอง
- หากคุณเป็นเจ้าของ Skills นั้น ให้ลงชื่อเข้าใช้และตรวจสอบ:

```bash
clawhub inspect @openclaw/demo
```

การวินิจฉัยที่มองเห็นได้สำหรับ owner อาจอธิบายสถานะการสแกน, upload-gate หรือการกลั่นกรองได้

## การเผยแพร่ล้มเหลวเพราะไม่มี metadata ที่จำเป็น

สำหรับ Skills ให้ตรวจสอบ frontmatter ของ `SKILL.md` ควรประกาศตัวแปรสภาพแวดล้อมและ
เครื่องมือที่จำเป็น เพื่อให้ผู้ใช้และตัวสแกนเข้าใจแพ็กเกจได้

สำหรับ Plugin ให้ตรวจสอบ metadata ความเข้ากันได้ใน `package.json` การเผยแพร่ code-plugin
ต้องมีฟิลด์ความเข้ากันได้ของ OpenClaw เช่น `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion`

ดูตัวอย่าง payload สำหรับเผยแพร่ก่อน:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## การเผยแพร่ล้มเหลวด้วยข้อผิดพลาด owner หรือ source ของ GitHub

ClawHub ใช้ตัวตน GitHub และการระบุที่มาของ source เพื่อเชื่อมแพ็กเกจกับ
ผู้เผยแพร่ของแพ็กเกจนั้น

- ตรวจสอบให้แน่ใจว่าคุณลงชื่อเข้าใช้ด้วยบัญชี GitHub ที่เป็นเจ้าของหรือสามารถเผยแพร่
  แพ็กเกจได้
- ตรวจสอบว่า URL ของ source เป็นสาธารณะหรือ ClawHub เข้าถึงได้
- สำหรับ source ของ GitHub ให้ใช้ `owner/repo`, `owner/repo@ref` หรือ URL GitHub แบบเต็ม

## การเผยแพร่ล้มเหลวเพราะ namespace ถูกอ้างสิทธิ์หรือสงวนไว้

หากการเผยแพร่ล้มเหลวเพราะ owner handle, org namespace, package scope, slug ของ Skills
หรือชื่อแพ็กเกจถูกอ้างสิทธิ์หรือสงวนไว้แล้ว ก่อนอื่นให้ยืนยันว่าคุณกำลัง
เผยแพร่ด้วย owner ที่ตรงกับ namespace สำหรับแพ็กเกจ Plugin
ชื่อแบบ scoped เช่น `@example-org/example-plugin` ต้องเผยแพร่ในฐานะ owner
`example-org` ที่ตรงกัน

หากคุณเชื่อว่า org, โปรเจกต์ หรือแบรนด์ของคุณเป็นเจ้าของ namespace ที่ชอบธรรม แต่
คุณไม่สามารถจัดการ owner ปัจจุบันของ ClawHub ได้ ให้เปิด
[ประเด็นการอ้างสิทธิ์ Org / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
พร้อมหลักฐานสาธารณะที่ไม่ละเอียดอ่อน ดู
[การอ้างสิทธิ์ Org และ Namespace](/clawhub/namespace-claims) สำหรับแนวทางหลักฐานและสิ่งที่
ควรเก็บออกจาก issue สาธารณะ

## `sync` แจ้งว่าไม่พบ Skills

`sync` จะค้นหาโฟลเดอร์ที่มี `SKILL.md` หรือ `skill.md`

ชี้ไปยัง root ที่คุณต้องการสแกน:

```bash
clawhub sync --root /path/to/skills
```

ดูตัวอย่างก่อนหากคุณไม่แน่ใจว่าจะเผยแพร่อะไร:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` ปฏิเสธเพราะมีการเปลี่ยนแปลงในเครื่อง

ไฟล์ภายในเครื่องไม่ตรงกับเวอร์ชันใดที่ ClawHub รู้จัก เลือกหนึ่งทาง:

- เก็บการแก้ไขในเครื่องไว้และข้ามการอัปเดต
- เขียนทับด้วยเวอร์ชันที่เผยแพร่แล้ว:

```bash
clawhub update @openclaw/demo --force
```

- เผยแพร่สำเนาที่คุณแก้ไขเป็น slug ใหม่หรือ fork

## การติดตั้ง Plugin ล้มเหลวใน OpenClaw

- ใช้ source ของ ClawHub แบบระบุชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

- ตรวจสอบหน้ารายละเอียดแพ็กเกจสำหรับสถานะการสแกนและ metadata ความเข้ากันได้
- ยืนยันว่าเวอร์ชัน OpenClaw ของคุณเป็นไปตามช่วงความเข้ากันได้ที่แพ็กเกจประกาศไว้
- หากแพ็กเกจถูกซ่อน ถูกระงับ หรือถูกบล็อก อาจติดตั้งไม่ได้จนกว่า
  owner จะแก้ไขปัญหา

## คำขอ Public API ล้มเหลว

- เคารพ header การลองใหม่ของ `429` และแคชคำตอบรายการ/การค้นหาแบบสาธารณะ
- ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ที่เป็น canonical
- อย่า mirror เนื้อหาที่ถูกซ่อน เป็นส่วนตัว ถูกระงับ หรือถูกบล็อกโดยการกลั่นกรอง นอก
  พื้นผิว Public API

ดู [HTTP API](/clawhub/http-api) สำหรับรายละเอียด endpoint
