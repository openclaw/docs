---
read_when:
    - คำสั่ง ClawHub CLI หรือคำสั่งรีจิสทรีของ OpenClaw ล้มเหลว
    - ไม่สามารถติดตั้ง เผยแพร่ หรืออัปเดตแพ็กเกจได้
summary: การแก้ไขปัญหาการลงชื่อเข้าใช้ ติดตั้ง เผยแพร่ อัปเดต และปัญหา API ของ ClawHub
x-i18n:
    generated_at: "2026-06-28T00:12:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# การแก้ไขปัญหา

## `clawhub login` เปิดเบราว์เซอร์แต่ไม่เสร็จสมบูรณ์

CLI จะเริ่มเซิร์ฟเวอร์ callback แบบโลคัลที่มีอายุสั้นระหว่างการเข้าสู่ระบบผ่านเบราว์เซอร์

- ตรวจสอบว่าเบราว์เซอร์ของคุณเข้าถึง `http://127.0.0.1:<port>/callback` ได้
- ตรวจสอบกฎไฟร์วอลล์โลคัล, VPN และพร็อกซี หาก callback ไม่มาถึง
- ในสภาพแวดล้อมแบบไม่มีหน้าจอ ให้สร้าง API token ใน ClawHub web UI แล้วรัน:

```bash
clawhub login --token clh_...
```

## `whoami` หรือ `publish` ส่งคืน `Unauthorized` (401)

- เข้าสู่ระบบอีกครั้งด้วย `clawhub login`
- หากคุณใช้พาธ config แบบกำหนดเอง ให้ยืนยันว่า `CLAWHUB_CONFIG_PATH` ชี้ไปยัง
  ไฟล์ที่มี token ปัจจุบันของคุณ
- หากคุณใช้ API token ให้ยืนยันว่า token นั้นไม่ได้ถูกเพิกถอนใน web UI

## การค้นหาหรือติดตั้งส่งคืน `Rate limit exceeded` (429)

อ่านข้อมูลการลองใหม่ใน response:

- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่
- `RateLimit-Limit`: ขีดจำกัดที่ใช้กับคำขอนี้
- `RateLimit-Remaining`: งบประมาณที่เหลืออยู่จริงของคุณเมื่อมี header นี้อยู่ บน `429` ค่านี้คือ `0`
- `RateLimit-Reset` หรือ `X-RateLimit-Reset`: เวลารีเซ็ต

หากผู้ใช้หลายคนใช้ egress IP เดียวกันร่วมกัน อาจชนขีดจำกัด IP แบบไม่ระบุตัวตนได้ แม้แต่ละ
คนจะส่งคำขอเพียงไม่กี่ครั้งเท่านั้น เข้าสู่ระบบเมื่อทำได้ แล้วลองใหม่หลังจาก
เวลาหน่วงที่รายงาน

## การค้นหาหรือติดตั้งล้มเหลวเมื่ออยู่หลังพร็อกซี

CLI เคารพตัวแปรพร็อกซีมาตรฐาน:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

ชื่อที่รองรับรวมถึง `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` และ
`http_proxy`

## skill ไม่ปรากฏในการค้นหา

- ตรวจสอบ slug ที่แน่นอนหรือหน้าเจ้าของ หากคุณทราบ
- ยืนยันว่า release เป็นสาธารณะและไม่ได้ถูกระงับโดยการสแกนหรือการกลั่นกรอง
- หากคุณเป็นเจ้าของ skill ให้เข้าสู่ระบบแล้วตรวจสอบ:

```bash
clawhub inspect @openclaw/demo
```

การวินิจฉัยที่เจ้าของมองเห็นอาจอธิบายสถานะการสแกน, upload-gate หรือการกลั่นกรอง

## การเผยแพร่ล้มเหลวเพราะ metadata ที่จำเป็นขาดหายไป

สำหรับ skills ให้ตรวจสอบ frontmatter ของ `SKILL.md` ควรประกาศ environment variables และ
tools ที่จำเป็น เพื่อให้ผู้ใช้และตัวสแกนเข้าใจ package ได้

สำหรับ plugins ให้ตรวจสอบ metadata ความเข้ากันได้ใน `package.json` การเผยแพร่ code-plugin
ต้องมีฟิลด์ความเข้ากันได้ของ OpenClaw เช่น `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion`

ดูตัวอย่าง publish payload ก่อน:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## การเผยแพร่ล้มเหลวด้วยข้อผิดพลาดเจ้าของ GitHub หรือแหล่งที่มา

ClawHub ใช้ตัวตน GitHub และการระบุแหล่งที่มาเพื่อเชื่อม package กับ
ผู้เผยแพร่ของ package นั้น

- ตรวจสอบว่าคุณเข้าสู่ระบบด้วยบัญชี GitHub ที่เป็นเจ้าของหรือสามารถเผยแพร่
  package ได้
- ตรวจสอบว่า URL แหล่งที่มาเป็นสาธารณะหรือ ClawHub เข้าถึงได้
- สำหรับแหล่งที่มาบน GitHub ให้ใช้ `owner/repo`, `owner/repo@ref` หรือ URL GitHub แบบเต็ม

## การเผยแพร่ล้มเหลวเพราะ namespace ถูกอ้างสิทธิ์หรือสงวนไว้แล้ว

หากการเผยแพร่ล้มเหลวเพราะ owner handle, org namespace, package scope, skill
slug หรือชื่อ package ถูกอ้างสิทธิ์หรือสงวนไว้แล้ว ให้ยืนยันก่อนว่าคุณกำลัง
เผยแพร่ด้วยเจ้าของที่ตรงกับ namespace สำหรับ plugin packages
ชื่อแบบมี scope เช่น `@example-org/example-plugin` ต้องเผยแพร่ในฐานะเจ้าของ
`example-org` ที่ตรงกัน

หากคุณเชื่อว่า org, project หรือ brand ของคุณเป็นเจ้าของ namespace โดยชอบธรรม แต่
คุณไม่สามารถจัดการเจ้าของ ClawHub ปัจจุบันได้ ให้เปิด
[issue การอ้างสิทธิ์ Org / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
พร้อมหลักฐานสาธารณะที่ไม่ใช่ข้อมูลอ่อนไหว ดู
[การอ้างสิทธิ์ Org และ Namespace](/th/clawhub/namespace-claims) สำหรับแนวทางหลักฐานและสิ่งที่
ควรหลีกเลี่ยงใน issues สาธารณะ

## `sync` แจ้งว่าไม่พบ skills

`sync` มองหาโฟลเดอร์ที่มี `SKILL.md` หรือ `skill.md`

ชี้ไปยัง root ที่คุณต้องการสแกน:

```bash
clawhub sync --root /path/to/skills
```

ดูตัวอย่างก่อนหากคุณไม่แน่ใจว่าจะเผยแพร่อะไร:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` ปฏิเสธเพราะมีการเปลี่ยนแปลงโลคัล

ไฟล์โลคัลไม่ตรงกับเวอร์ชันใดๆ ที่ ClawHub รู้จัก เลือกอย่างใดอย่างหนึ่ง:

- เก็บการแก้ไขโลคัลไว้และข้ามการอัปเดต
- เขียนทับด้วยเวอร์ชันที่เผยแพร่แล้ว:

```bash
clawhub update @openclaw/demo --force
```

- เผยแพร่สำเนาที่คุณแก้ไขเป็น slug ใหม่หรือ fork

## การติดตั้ง plugin ล้มเหลวใน OpenClaw

- ใช้แหล่งที่มา ClawHub แบบชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

- ตรวจสอบหน้ารายละเอียด package สำหรับสถานะการสแกนและ metadata ความเข้ากันได้
- ยืนยันว่าเวอร์ชัน OpenClaw ของคุณเป็นไปตามช่วงความเข้ากันได้ที่ package
  ประกาศไว้
- หาก package ถูกซ่อน ถูกระงับ หรือถูกบล็อก อาจติดตั้งไม่ได้จนกว่า
  เจ้าของจะแก้ไขปัญหา

## คำขอ Public API ล้มเหลว

- เคารพ retry headers ของ `429` และ cache response ของรายการ/การค้นหาสาธารณะ
- ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ที่เป็น canonical
- อย่า mirror เนื้อหาที่ถูกซ่อน เป็นส่วนตัว ถูกระงับ หรือถูกบล็อกโดยการกลั่นกรองภายนอก
  พื้นผิว Public API

ดู [HTTP API](/th/clawhub/http-api) สำหรับรายละเอียด endpoint
