---
read_when:
    - คำสั่ง ClawHub CLI หรือรีจิสทรีของ OpenClaw ล้มเหลว
    - ไม่สามารถติดตั้ง เผยแพร่ หรืออัปเดตแพ็กเกจได้
summary: การแก้ไขปัญหาการลงชื่อเข้าใช้ การติดตั้ง การเผยแพร่ การอัปเดต และปัญหา API ของ ClawHub.
x-i18n:
    generated_at: "2026-06-27T17:19:19Z"
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
- ตรวจสอบไฟร์วอลล์ภายในเครื่อง, VPN และกฎพร็อกซี หาก callback ไม่มาถึง
- ในสภาพแวดล้อมแบบ headless ให้สร้าง API token ในเว็บ UI ของ ClawHub แล้วรัน:

```bash
clawhub login --token clh_...
```

## `whoami` หรือ `publish` ส่งคืน `Unauthorized` (401)

- เข้าสู่ระบบอีกครั้งด้วย `clawhub login`
- หากคุณใช้พาธ config แบบกำหนดเอง ให้ยืนยันว่า `CLAWHUB_CONFIG_PATH` ชี้ไปยัง
  ไฟล์ที่มี token ปัจจุบันของคุณ
- หากคุณใช้ API token ให้ยืนยันว่าไม่ได้ถูกเพิกถอนในเว็บ UI

## การค้นหาหรือการติดตั้งส่งคืน `Rate limit exceeded` (429)

อ่านข้อมูลการลองใหม่ในคำตอบ:

- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่
- `RateLimit-Limit`: ขีดจำกัดที่ใช้กับคำขอนี้
- `RateLimit-Remaining`: โควต้าที่เหลืออยู่จริงของคุณเมื่อมี header นี้อยู่ บน `429` ค่านี้คือ `0`
- `RateLimit-Reset` หรือ `X-RateLimit-Reset`: เวลาการรีเซ็ต

หากผู้ใช้หลายคนใช้ IP ขาออกเดียวกันร่วมกัน ขีดจำกัด IP แบบไม่ระบุตัวตนอาจถูกใช้หมดได้ แม้แต่ละ
คนจะส่งคำขอเพียงไม่กี่ครั้งก็ตาม เข้าสู่ระบบเมื่อทำได้ แล้วลองใหม่หลังจาก
เวลาหน่วงที่รายงานไว้

## การค้นหาหรือการติดตั้งล้มเหลวหลังพร็อกซี

CLI เคารพตัวแปรพร็อกซีมาตรฐาน:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

ชื่อที่รองรับรวมถึง `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` และ
`http_proxy`

## Skills ไม่ปรากฏในการค้นหา

- ตรวจสอบ slug หรือหน้าเจ้าของที่แน่นอนหากคุณทราบ
- ยืนยันว่า release เป็นสาธารณะและไม่ได้ถูกระงับไว้โดยการสแกนหรือการกลั่นกรอง
- หากคุณเป็นเจ้าของ Skills ให้เข้าสู่ระบบและตรวจสอบ:

```bash
clawhub inspect @openclaw/demo
```

การวินิจฉัยที่เจ้าของมองเห็นได้อาจอธิบายสถานะการสแกน, upload-gate หรือการกลั่นกรอง

## การเผยแพร่ล้มเหลวเพราะ metadata ที่จำเป็นขาดหายไป

สำหรับ Skills ให้ตรวจสอบ frontmatter ของ `SKILL.md` ควรประกาศตัวแปรสภาพแวดล้อมและ
เครื่องมือที่จำเป็น เพื่อให้ผู้ใช้และตัวสแกนเข้าใจ package ได้

สำหรับ Plugin ให้ตรวจสอบ metadata ความเข้ากันได้ใน `package.json` การเผยแพร่ code-plugin
ต้องมีฟิลด์ความเข้ากันได้ของ OpenClaw เช่น `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion`

ดูตัวอย่าง payload การเผยแพร่ก่อน:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## การเผยแพร่ล้มเหลวด้วยข้อผิดพลาดเจ้าของ GitHub หรือแหล่งที่มา

ClawHub ใช้ข้อมูลระบุตัวตน GitHub และการระบุแหล่งที่มาเพื่อเชื่อม package กับ
ผู้เผยแพร่ของ package นั้น

- ตรวจสอบให้แน่ใจว่าคุณเข้าสู่ระบบด้วยบัญชี GitHub ที่เป็นเจ้าของหรือสามารถเผยแพร่
  package ได้
- ตรวจสอบว่า URL แหล่งที่มาเป็นสาธารณะหรือ ClawHub เข้าถึงได้
- สำหรับแหล่งที่มา GitHub ให้ใช้ `owner/repo`, `owner/repo@ref` หรือ URL GitHub แบบเต็ม

## การเผยแพร่ล้มเหลวเพราะ namespace ถูกอ้างสิทธิ์หรือถูกสงวนไว้

หากการเผยแพร่ล้มเหลวเพราะ owner handle, org namespace, package scope, slug ของ Skills
หรือชื่อ package ถูกอ้างสิทธิ์หรือถูกสงวนไว้แล้ว ก่อนอื่นให้ยืนยันว่าคุณกำลัง
เผยแพร่ด้วยเจ้าของที่ตรงกับ namespace สำหรับ package ของ Plugin
ชื่อแบบ scoped เช่น `@example-org/example-plugin` ต้องเผยแพร่ในฐานะเจ้าของ
`example-org` ที่ตรงกัน

หากคุณเชื่อว่า org, โปรเจกต์ หรือแบรนด์ของคุณเป็นเจ้าของ namespace ที่ถูกต้องโดยชอบธรรม แต่
คุณไม่สามารถจัดการเจ้าของ ClawHub ปัจจุบันได้ ให้เปิด
[ปัญหาการอ้างสิทธิ์ Org / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
พร้อมหลักฐานสาธารณะที่ไม่ละเอียดอ่อน ดู
[การอ้างสิทธิ์ Org และ Namespace](/th/clawhub/namespace-claims) สำหรับแนวทางหลักฐานและสิ่งที่
ควรเก็บไว้นอก issue สาธารณะ

## `sync` แจ้งว่าไม่พบ Skills

`sync` ค้นหาโฟลเดอร์ที่มี `SKILL.md` หรือ `skill.md`

ชี้ไปยัง root ที่คุณต้องการสแกน:

```bash
clawhub sync --root /path/to/skills
```

ดูตัวอย่างก่อนหากคุณไม่แน่ใจว่าอะไรจะถูกเผยแพร่:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` ปฏิเสธเพราะมีการเปลี่ยนแปลงภายในเครื่อง

ไฟล์ภายในเครื่องไม่ตรงกับเวอร์ชันใดๆ ที่ ClawHub รู้จัก เลือกหนึ่งอย่าง:

- เก็บการแก้ไขภายในเครื่องไว้และข้ามการอัปเดต
- เขียนทับด้วยเวอร์ชันที่เผยแพร่แล้ว:

```bash
clawhub update @openclaw/demo --force
```

- เผยแพร่สำเนาที่คุณแก้ไขเป็น slug ใหม่หรือ fork

## การติดตั้ง Plugin ล้มเหลวใน OpenClaw

- ใช้แหล่งที่มา ClawHub ที่ชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

- ตรวจสอบหน้ารายละเอียด package สำหรับสถานะการสแกนและ metadata ความเข้ากันได้
- ยืนยันว่าเวอร์ชัน OpenClaw ของคุณตรงตามช่วงความเข้ากันได้ที่ package ประกาศไว้
- หาก package ถูกซ่อน, ถูกระงับไว้ หรือถูกบล็อก อาจติดตั้งไม่ได้จนกว่า
  เจ้าของจะแก้ไขปัญหา

## คำขอ API สาธารณะล้มเหลว

- เคารพ header การลองใหม่ของ `429` และ cache คำตอบรายการ/การค้นหาสาธารณะ
- ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub มาตรฐาน
- อย่า mirror เนื้อหาที่ถูกซ่อน, เป็นส่วนตัว, ถูกระงับไว้ หรือถูกบล็อกโดยการกลั่นกรอง นอก
  พื้นผิว API สาธารณะ

ดู [HTTP API](/th/clawhub/http-api) สำหรับรายละเอียด endpoint
