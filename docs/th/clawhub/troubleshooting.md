---
read_when:
    - ClawHub CLI หรือคำสั่งรีจิสทรีของ OpenClaw ล้มเหลว
    - ไม่สามารถติดตั้ง เผยแพร่ หรืออัปเดตแพ็กเกจได้
summary: การแก้ไขปัญหาการลงชื่อเข้าใช้ การติดตั้ง การเผยแพร่ การอัปเดต และปัญหา API ของ ClawHub
x-i18n:
    generated_at: "2026-07-03T23:45:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# การแก้ไขปัญหา

## `clawhub login` เปิดเบราว์เซอร์แต่ไม่เสร็จสมบูรณ์

CLI เริ่มเซิร์ฟเวอร์ callback ภายในเครื่องแบบอายุสั้นระหว่างการเข้าสู่ระบบผ่านเบราว์เซอร์

- ตรวจสอบให้แน่ใจว่าเบราว์เซอร์ของคุณเข้าถึง `http://127.0.0.1:<port>/callback` ได้
- ตรวจสอบกฎไฟร์วอลล์ภายในเครื่อง, VPN และพร็อกซี หาก callback ไม่มาถึง
- ในสภาพแวดล้อมแบบ headless ให้สร้าง API token ในเว็บ UI ของ ClawHub แล้วเรียกใช้:

```bash
clawhub login --token clh_...
```

## `whoami` หรือ `publish` ส่งคืน `Unauthorized` (401)

- ลงชื่อเข้าใช้อีกครั้งด้วย `clawhub login`
- หากคุณใช้พาธ config แบบกำหนดเอง ให้ยืนยันว่า `CLAWHUB_CONFIG_PATH` ชี้ไปยัง
  ไฟล์ที่มี token ปัจจุบันของคุณ
- หากคุณใช้ API token ให้ยืนยันว่าไม่ได้ถูกเพิกถอนในเว็บ UI

## การค้นหาหรือการติดตั้งส่งคืน `Rate limit exceeded` (429)

อ่านข้อมูลการลองใหม่ในคำตอบ:

- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่
- `RateLimit-Limit`: ขีดจำกัดที่ใช้กับคำขอนี้
- `RateLimit-Remaining`: งบประมาณที่เหลืออยู่จริงของคุณเมื่อมี header นี้ ในกรณี `429` ค่านี้คือ `0`
- `RateLimit-Reset` หรือ `X-RateLimit-Reset`: เวลาที่จะรีเซ็ต

หากผู้ใช้หลายคนใช้ IP ขาออกร่วมกัน ขีดจำกัด IP แบบไม่ระบุตัวตนอาจถูกใช้ถึงขีดจำกัดได้แม้แต่ละ
คนจะส่งคำขอเพียงไม่กี่รายการ ลงชื่อเข้าใช้เมื่อทำได้และลองใหม่หลังจากระยะหน่วงที่
รายงานไว้

## การค้นหาหรือการติดตั้งล้มเหลวเมื่ออยู่หลังพร็อกซี

CLI เคารพตัวแปรพร็อกซีมาตรฐาน:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

ชื่อที่รองรับรวมถึง `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` และ
`http_proxy`

## skill ไม่ปรากฏในการค้นหา

- ตรวจสอบ slug ที่ตรงกันหรือหน้าเจ้าของหากคุณทราบ
- ยืนยันว่า release เป็นสาธารณะและไม่ได้ถูกระงับไว้โดยการสแกนหรือการกลั่นกรอง
- หากคุณเป็นเจ้าของ skill ให้ลงชื่อเข้าใช้และตรวจสอบ:

```bash
clawhub inspect @openclaw/demo
```

การวินิจฉัยที่เจ้าของมองเห็นได้อาจอธิบายสถานะการสแกน, upload-gate หรือการกลั่นกรอง

## การ publish ล้มเหลวเพราะไม่มี metadata ที่จำเป็น

สำหรับ Skills ให้ตรวจสอบ frontmatter ของ `SKILL.md` ควรประกาศตัวแปรสภาพแวดล้อมและ
เครื่องมือที่จำเป็น เพื่อให้ผู้ใช้และตัวสแกนเข้าใจแพ็กเกจได้

สำหรับ plugins ให้ตรวจสอบ metadata ความเข้ากันได้ใน `package.json` การ publish code-plugin
ต้องมีฟิลด์ความเข้ากันได้กับ OpenClaw เช่น `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion`

ดูตัวอย่าง payload การ publish ก่อน:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## การ publish ล้มเหลวด้วยข้อผิดพลาดเกี่ยวกับเจ้าของ GitHub หรือแหล่งที่มา

ClawHub ใช้ตัวตน GitHub และการระบุแหล่งที่มาเพื่อเชื่อมโยงแพ็กเกจกับ
ผู้เผยแพร่

- ตรวจสอบให้แน่ใจว่าคุณลงชื่อเข้าใช้ด้วยบัญชี GitHub ที่เป็นเจ้าของหรือสามารถ publish
  แพ็กเกจได้
- ตรวจสอบว่า URL แหล่งที่มาเป็นสาธารณะหรือ ClawHub เข้าถึงได้
- สำหรับแหล่งที่มา GitHub ให้ใช้ `owner/repo`, `owner/repo@ref` หรือ URL GitHub แบบเต็ม

## การ publish ล้มเหลวเพราะ namespace ถูกอ้างสิทธิ์หรือสงวนไว้แล้ว

หากการ publish ล้มเหลวเพราะ handle เจ้าของ, namespace ขององค์กร, scope แพ็กเกจ, skill
slug หรือชื่อแพ็กเกจถูกอ้างสิทธิ์หรือสงวนไว้แล้ว ให้ยืนยันก่อนว่าคุณกำลัง
publish ด้วยเจ้าของที่ตรงกับ namespace สำหรับแพ็กเกจ Plugin
ชื่อแบบมี scope เช่น `@example-org/example-plugin` ต้อง publish ในฐานะเจ้าของ
`example-org` ที่ตรงกัน

หากคุณเชื่อว่าองค์กร, โปรเจกต์ หรือแบรนด์ของคุณเป็นเจ้าของ namespace โดยชอบธรรม แต่
คุณไม่สามารถจัดการเจ้าของ ClawHub ปัจจุบันได้ ให้เปิด
[ปัญหาการอ้างสิทธิ์องค์กร / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
พร้อมหลักฐานสาธารณะที่ไม่ละเอียดอ่อน ดู
[การอ้างสิทธิ์องค์กรและ Namespace](/clawhub/namespace-claims) สำหรับคำแนะนำด้านหลักฐานและสิ่งที่
ควรเก็บออกจากปัญหาสาธารณะ

## `sync` แจ้งว่าไม่พบ Skills

`sync` มองหาโฟลเดอร์ที่มี `SKILL.md` หรือ `skill.md`

ชี้ไปยังรากที่คุณต้องการสแกน:

```bash
clawhub sync --root /path/to/skills
```

ดูตัวอย่างก่อนหากคุณไม่แน่ใจว่าอะไรจะถูก publish:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` ปฏิเสธเพราะมีการเปลี่ยนแปลงภายในเครื่อง

ไฟล์ภายในเครื่องไม่ตรงกับเวอร์ชันใดที่ ClawHub รู้จัก เลือกหนึ่งทาง:

- เก็บการแก้ไขภายในเครื่องไว้และข้ามการอัปเดต
- เขียนทับด้วยเวอร์ชันที่ publish แล้ว:

```bash
clawhub update @openclaw/demo --force
```

- Publish สำเนาที่คุณแก้ไขเป็น slug ใหม่หรือ fork

## การติดตั้ง Plugin ล้มเหลวใน OpenClaw

- ใช้แหล่งที่มา ClawHub แบบชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

- ตรวจสอบหน้ารายละเอียดแพ็กเกจสำหรับสถานะการสแกนและ metadata ความเข้ากันได้
- ยืนยันว่าเวอร์ชัน OpenClaw ของคุณเป็นไปตามช่วงความเข้ากันได้ที่แพ็กเกจ
  ประกาศไว้
- หากแพ็กเกจถูกซ่อน, ถูกระงับไว้ หรือถูกบล็อก อาจไม่สามารถติดตั้งได้จนกว่า
  เจ้าของจะแก้ไขปัญหา

## คำขอ Public API ล้มเหลว

- เคารพ header การลองใหม่ `429` และแคชคำตอบรายการ/การค้นหาสาธารณะ
- ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ที่เป็น canonical
- อย่า mirror เนื้อหาที่ถูกซ่อน, เป็นส่วนตัว, ถูกระงับไว้ หรือถูกบล็อกโดยการกลั่นกรองออกนอก
  พื้นผิว Public API

ดู [HTTP API](/clawhub/http-api) สำหรับรายละเอียด endpoint
