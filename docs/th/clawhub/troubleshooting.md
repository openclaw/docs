---
read_when:
    - คำสั่ง ClawHub CLI หรือรีจิสทรีของ OpenClaw ล้มเหลว
    - ไม่สามารถติดตั้ง เผยแพร่ หรืออัปเดตแพ็กเกจได้
summary: การแก้ไขปัญหาการลงชื่อเข้าใช้ การติดตั้ง การเผยแพร่ การอัปเดต และปัญหา API ของ ClawHub.
x-i18n:
    generated_at: "2026-07-04T06:56:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# การแก้ไขปัญหา

## `clawhub login` เปิดเบราว์เซอร์ แต่ไม่เสร็จสมบูรณ์

CLI จะเริ่มเซิร์ฟเวอร์ callback ภายในเครื่องแบบอายุสั้นระหว่างการเข้าสู่ระบบผ่านเบราว์เซอร์

- ตรวจสอบให้แน่ใจว่าเบราว์เซอร์ของคุณเข้าถึง `http://127.0.0.1:<port>/callback` ได้
- ตรวจสอบกฎของไฟร์วอลล์ภายในเครื่อง, VPN และพร็อกซี หาก callback ไม่มาถึง
- ในสภาพแวดล้อมแบบ headless ให้สร้าง API token ในเว็บ UI ของ ClawHub แล้วรัน:

```bash
clawhub login --token clh_...
```

## `whoami` หรือ `publish` ส่งคืน `Unauthorized` (401)

- ลงชื่อเข้าใช้อีกครั้งด้วย `clawhub login`
- หากคุณใช้พาธ config แบบกำหนดเอง ให้ยืนยันว่า `CLAWHUB_CONFIG_PATH` ชี้ไปยัง
  ไฟล์ที่มี token ปัจจุบันของคุณ
- หากคุณใช้ API token ให้ยืนยันว่าไม่ได้ถูกเพิกถอนในเว็บ UI

## การค้นหาหรือการติดตั้งส่งคืน `Rate limit exceeded` (429)

อ่านข้อมูลการลองใหม่ใน response:

- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่
- `RateLimit-Limit`: ขีดจำกัดที่ใช้กับ request นี้
- `RateLimit-Remaining`: โควตาที่เหลืออยู่จริงของคุณเมื่อมี header นี้อยู่ บน `429` ค่านี้คือ `0`
- `RateLimit-Reset` หรือ `X-RateLimit-Reset`: เวลาการรีเซ็ต

หากผู้ใช้หลายคนใช้ egress IP เดียวกันร่วมกัน อาจชนขีดจำกัด IP แบบไม่ระบุตัวตนได้ แม้แต่ละ
คนจะส่ง request เพียงไม่กี่ครั้งเท่านั้น ลงชื่อเข้าใช้เมื่อทำได้ แล้วลองใหม่หลังจาก
เวลาหน่วงที่รายงานไว้

## การค้นหาหรือการติดตั้งล้มเหลวหลังพร็อกซี

CLI เคารพตัวแปรพร็อกซีมาตรฐาน:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

ชื่อที่รองรับรวมถึง `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` และ
`http_proxy`

## Skill ไม่ปรากฏในการค้นหา

- ตรวจสอบ slug หรือหน้า owner ให้ตรงทุกตัวอักษร หากคุณทราบ
- ยืนยันว่า release เป็นสาธารณะและไม่ได้ถูกระงับโดยการสแกนหรือการกลั่นกรอง
- หากคุณเป็นเจ้าของ Skill ให้ลงชื่อเข้าใช้และตรวจสอบ:

```bash
clawhub inspect @openclaw/demo
```

การวินิจฉัยที่ owner มองเห็นได้อาจอธิบายสถานะการสแกน, upload-gate หรือการกลั่นกรอง

## การ publish ล้มเหลวเพราะขาด metadata ที่จำเป็น

สำหรับ Skills ให้ตรวจสอบ frontmatter ของ `SKILL.md` ควรประกาศตัวแปรสภาพแวดล้อมและ
เครื่องมือที่จำเป็น เพื่อให้ผู้ใช้และตัวสแกนเข้าใจแพ็กเกจได้

สำหรับ Plugin ให้ตรวจสอบ metadata ความเข้ากันได้ใน `package.json` การ publish แบบ code-plugin
ต้องมีฟิลด์ความเข้ากันได้กับ OpenClaw เช่น `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion`

ดูตัวอย่าง payload สำหรับ publish ก่อน:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## การ publish ล้มเหลวด้วยข้อผิดพลาด owner หรือ source ของ GitHub

ClawHub ใช้ตัวตน GitHub และการระบุที่มา source เพื่อเชื่อมโยงแพ็กเกจกับ
ผู้เผยแพร่

- ตรวจสอบให้แน่ใจว่าคุณลงชื่อเข้าใช้ด้วยบัญชี GitHub ที่เป็นเจ้าของหรือสามารถ publish
  แพ็กเกจได้
- ตรวจสอบว่า source URL เป็นสาธารณะหรือ ClawHub เข้าถึงได้
- สำหรับ source จาก GitHub ให้ใช้ `owner/repo`, `owner/repo@ref` หรือ URL GitHub แบบเต็ม

## การ publish ล้มเหลวเพราะ namespace ถูกอ้างสิทธิ์หรือสงวนไว้แล้ว

หากการ publish ล้มเหลวเพราะ handle ของ owner, namespace ของ org, scope ของแพ็กเกจ, slug ของ Skill
หรือชื่อแพ็กเกจถูกอ้างสิทธิ์หรือสงวนไว้แล้ว ก่อนอื่นให้ยืนยันว่าคุณกำลัง
publish ด้วย owner ที่ตรงกับ namespace สำหรับแพ็กเกจ Plugin
ชื่อแบบ scoped เช่น `@example-org/example-plugin` ต้อง publish ในฐานะ owner
`example-org` ที่ตรงกัน

หากคุณเชื่อว่า org, โปรเจกต์ หรือแบรนด์ของคุณเป็นเจ้าของ namespace โดยชอบธรรม แต่
คุณจัดการ owner ปัจจุบันของ ClawHub ไม่ได้ ให้เปิด
[issue สำหรับการอ้างสิทธิ์ Org / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
พร้อมหลักฐานสาธารณะที่ไม่ละเอียดอ่อน ดู
[การอ้างสิทธิ์ Org และ Namespace](/clawhub/namespace-claims) สำหรับแนวทางหลักฐานและสิ่งที่
ควรเว้นออกจาก issue สาธารณะ

## `sync` ระบุว่าไม่พบ Skills

`sync` จะค้นหาโฟลเดอร์ที่มี `SKILL.md` หรือ `skill.md`

ชี้ไปที่ root ที่คุณต้องการสแกน:

```bash
clawhub sync --root /path/to/skills
```

ดูตัวอย่างก่อนหากคุณไม่แน่ใจว่าจะ publish อะไร:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` ปฏิเสธเพราะมีการเปลี่ยนแปลงภายในเครื่อง

ไฟล์ภายในเครื่องไม่ตรงกับเวอร์ชันใด ๆ ที่ ClawHub รู้จัก เลือกหนึ่งตัวเลือก:

- เก็บการแก้ไขภายในเครื่องไว้และข้าม update
- เขียนทับด้วยเวอร์ชันที่ publish แล้ว:

```bash
clawhub update @openclaw/demo --force
```

- Publish สำเนาที่คุณแก้ไขเป็น slug หรือ fork ใหม่

## การติดตั้ง Plugin ล้มเหลวใน OpenClaw

- ใช้ source ของ ClawHub แบบชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

- ตรวจสอบหน้ารายละเอียดแพ็กเกจสำหรับสถานะการสแกนและ metadata ความเข้ากันได้
- ยืนยันว่าเวอร์ชัน OpenClaw ของคุณตรงตามช่วงความเข้ากันได้ที่แพ็กเกจประกาศไว้
- หากแพ็กเกจถูกซ่อน ถูกระงับ หรือถูกบล็อก อาจติดตั้งไม่ได้จนกว่า
  owner จะแก้ไขปัญหา

## Request ไปยัง API สาธารณะล้มเหลว

- เคารพ header การลองใหม่ของ `429` และ cache response ของรายการ/การค้นหาสาธารณะ
- ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub canonical
- อย่า mirror เนื้อหาที่ถูกซ่อน เป็นส่วนตัว ถูกระงับ หรือถูกบล็อกโดยการกลั่นกรอง นอกเหนือจาก
  พื้นผิว API สาธารณะ

ดูรายละเอียด endpoint ที่ [HTTP API](/clawhub/http-api)
