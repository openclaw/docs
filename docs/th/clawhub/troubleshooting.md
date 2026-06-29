---
read_when:
    - คำสั่ง ClawHub CLI หรือ OpenClaw registry ล้มเหลว
    - ไม่สามารถติดตั้ง เผยแพร่ หรืออัปเดตแพ็กเกจได้
summary: การแก้ไขปัญหาการลงชื่อเข้าใช้ การติดตั้ง การเผยแพร่ การอัปเดต และปัญหา API ของ ClawHub.
x-i18n:
    generated_at: "2026-06-28T22:33:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# การแก้ไขปัญหา

## `clawhub login` เปิดเบราว์เซอร์แต่ไม่เสร็จสิ้น

CLI จะเริ่มเซิร์ฟเวอร์ callback แบบ local อายุสั้นระหว่างการเข้าสู่ระบบผ่านเบราว์เซอร์

- ตรวจสอบให้แน่ใจว่าเบราว์เซอร์ของคุณเข้าถึง `http://127.0.0.1:<port>/callback` ได้
- ตรวจสอบไฟร์วอลล์ภายในเครื่อง, VPN และกฎของ proxy หาก callback ไม่มาถึง
- ในสภาพแวดล้อมแบบ headless ให้สร้าง API token ในเว็บ UI ของ ClawHub แล้วรัน:

```bash
clawhub login --token clh_...
```

## `whoami` หรือ `publish` ส่งคืน `Unauthorized` (401)

- เข้าสู่ระบบอีกครั้งด้วย `clawhub login`
- หากคุณใช้เส้นทาง config แบบกำหนดเอง ให้ยืนยันว่า `CLAWHUB_CONFIG_PATH` ชี้ไปยัง
  ไฟล์ที่มี token ปัจจุบันของคุณ
- หากคุณใช้ API token ให้ยืนยันว่าไม่ได้ถูกเพิกถอนในเว็บ UI

## การค้นหาหรือการติดตั้งส่งคืน `Rate limit exceeded` (429)

อ่านข้อมูลการลองใหม่ใน response:

- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่
- `RateLimit-Limit`: ขีดจำกัดที่ใช้กับ request นี้
- `RateLimit-Remaining`: งบประมาณที่เหลืออยู่จริงของคุณเมื่อมี header นี้อยู่ บน `429` ค่านี้คือ `0`
- `RateLimit-Reset` หรือ `X-RateLimit-Reset`: เวลาการรีเซ็ต

หากผู้ใช้หลายคนใช้ egress IP เดียวกันร่วมกัน ขีดจำกัด IP แบบไม่ระบุตัวตนอาจถูกใช้จนเต็มได้ แม้ว่าแต่ละคนจะส่ง request เพียงไม่กี่ครั้งก็ตาม เข้าสู่ระบบเมื่อทำได้ และลองใหม่หลังจากเวลาหน่วงที่รายงานไว้

## การค้นหาหรือการติดตั้งล้มเหลวหลัง proxy

CLI เคารพตัวแปร proxy มาตรฐาน:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

ชื่อที่รองรับรวมถึง `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` และ
`http_proxy`

## skill ไม่ปรากฏในการค้นหา

- ตรวจสอบ slug ที่ถูกต้องหรือหน้าเจ้าของ หากคุณทราบ
- ยืนยันว่า release เป็นสาธารณะ และไม่ถูกระงับโดยการสแกนหรือการกลั่นกรอง
- หากคุณเป็นเจ้าของ skill ให้เข้าสู่ระบบแล้วตรวจสอบ:

```bash
clawhub inspect @openclaw/demo
```

การวินิจฉัยที่เจ้าของมองเห็นได้อาจอธิบายสถานะการสแกน, upload-gate หรือการกลั่นกรอง

## การ publish ล้มเหลวเพราะ metadata ที่จำเป็นขาดหาย

สำหรับ Skills ให้ตรวจสอบ frontmatter ของ `SKILL.md` ควรประกาศตัวแปรสภาพแวดล้อมและ
เครื่องมือที่จำเป็น เพื่อให้ผู้ใช้และ scanner เข้าใจ package ได้

สำหรับ Plugin ให้ตรวจสอบ metadata ความเข้ากันได้ใน `package.json` การ publish code-plugin
ต้องมีฟิลด์ความเข้ากันได้ของ OpenClaw เช่น `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion`

ดูตัวอย่าง publish payload ก่อน:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## การ publish ล้มเหลวด้วยข้อผิดพลาดเจ้าของ GitHub หรือแหล่งที่มา

ClawHub ใช้ตัวตน GitHub และการระบุแหล่งที่มาเพื่อเชื่อมโยง package กับ
ผู้เผยแพร่

- ตรวจสอบให้แน่ใจว่าคุณเข้าสู่ระบบด้วยบัญชี GitHub ที่เป็นเจ้าของหรือสามารถ publish
  package ได้
- ตรวจสอบว่า URL แหล่งที่มาเป็นสาธารณะหรือ ClawHub เข้าถึงได้
- สำหรับแหล่งที่มาจาก GitHub ให้ใช้ `owner/repo`, `owner/repo@ref` หรือ URL GitHub แบบเต็ม

## การ publish ล้มเหลวเพราะ namespace ถูกอ้างสิทธิ์หรือสงวนไว้

หาก publish ล้มเหลวเพราะ handle เจ้าของ, namespace ของ org, scope ของ package, slug ของ skill
หรือชื่อ package ถูกอ้างสิทธิ์หรือสงวนไว้แล้ว ก่อนอื่นให้ยืนยันว่าคุณกำลัง
publish ด้วยเจ้าของที่ตรงกับ namespace สำหรับ package ของ Plugin
ชื่อที่มี scope เช่น `@example-org/example-plugin` ต้องถูก publish ในฐานะเจ้าของ
`example-org` ที่ตรงกัน

หากคุณเชื่อว่า org, โปรเจกต์ หรือแบรนด์ของคุณเป็นเจ้าของ namespace โดยชอบธรรม แต่
คุณไม่สามารถจัดการเจ้าของ ClawHub ปัจจุบันได้ ให้เปิด
[issue สำหรับ Org / Namespace Claim](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
พร้อมหลักฐานสาธารณะที่ไม่ละเอียดอ่อน ดู
[การอ้างสิทธิ์ Org และ Namespace](/th/clawhub/namespace-claims) สำหรับแนวทางด้านหลักฐานและสิ่งที่
ไม่ควรใส่ใน issue สาธารณะ

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

## `update` ปฏิเสธเพราะมีการเปลี่ยนแปลงในเครื่อง

ไฟล์ในเครื่องไม่ตรงกับเวอร์ชันใดที่ ClawHub รู้จัก เลือกหนึ่งทาง:

- เก็บการแก้ไขในเครื่องไว้และข้าม update
- เขียนทับด้วยเวอร์ชันที่ publish แล้ว:

```bash
clawhub update @openclaw/demo --force
```

- Publish สำเนาที่คุณแก้ไขเป็น slug ใหม่หรือ fork

## การติดตั้ง Plugin ล้มเหลวใน OpenClaw

- ใช้แหล่งที่มา ClawHub แบบระบุชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

- ตรวจสอบหน้ารายละเอียด package สำหรับสถานะการสแกนและ metadata ความเข้ากันได้
- ยืนยันว่าเวอร์ชัน OpenClaw ของคุณเป็นไปตามช่วงความเข้ากันได้ที่ package ประกาศไว้
- หาก package ถูกซ่อน, ถูกระงับ หรือถูกบล็อก อาจติดตั้งไม่ได้จนกว่า
  เจ้าของจะแก้ไขปัญหา

## request ของ API สาธารณะล้มเหลว

- เคารพ header การลองใหม่ของ `429` และ cache response ของรายการ/การค้นหาสาธารณะ
- ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ตาม canonical
- อย่า mirror เนื้อหาที่ถูกซ่อน, ส่วนตัว, ถูกระงับ หรือถูกบล็อกโดยการกลั่นกรองออกนอก
  พื้นผิว API สาธารณะ

ดู [HTTP API](/th/clawhub/http-api) สำหรับรายละเอียด endpoint
