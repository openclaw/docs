---
read_when:
    - คำสั่ง ClawHub CLI หรือคำสั่งรีจิสทรี OpenClaw ล้มเหลว
    - ไม่สามารถติดตั้ง เผยแพร่ หรืออัปเดตแพ็กเกจได้
summary: การแก้ปัญหาการลงชื่อเข้าใช้ การติดตั้ง การเผยแพร่ การอัปเดต และปัญหา API ของ ClawHub
x-i18n:
    generated_at: "2026-07-04T20:46:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# การแก้ไขปัญหา

## `clawhub login` เปิดเบราว์เซอร์แต่ไม่เสร็จสิ้น

CLI จะเริ่มเซิร์ฟเวอร์ callback ภายในเครื่องแบบอายุสั้นระหว่างการเข้าสู่ระบบผ่านเบราว์เซอร์

- ตรวจสอบให้แน่ใจว่าเบราว์เซอร์ของคุณเข้าถึง `http://127.0.0.1:<port>/callback` ได้
- ตรวจสอบไฟร์วอลล์ภายในเครื่อง, VPN และกฎ proxy หาก callback ไม่มาถึงเลย
- ในสภาพแวดล้อมแบบ headless ให้สร้าง API token ใน ClawHub web UI แล้วเรียกใช้:

```bash
clawhub login --token clh_...
```

## `whoami` หรือ `publish` ส่งคืน `Unauthorized` (401)

- ลงชื่อเข้าใช้อีกครั้งด้วย `clawhub login`
- หากคุณใช้เส้นทาง config แบบกำหนดเอง ให้ยืนยันว่า `CLAWHUB_CONFIG_PATH` ชี้ไปยัง
  ไฟล์ที่มี token ปัจจุบันของคุณ
- หากคุณใช้ API token ให้ยืนยันว่าไม่ได้ถูกเพิกถอนใน web UI

## การค้นหาหรือติดตั้งส่งคืน `Rate limit exceeded` (429)

อ่านข้อมูลการลองใหม่ใน response:

- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่
- `RateLimit-Limit`: ขีดจำกัดที่ใช้กับ request นี้
- `RateLimit-Remaining`: โควตาที่เหลืออยู่ของคุณอย่างแน่นอนเมื่อมี header นี้อยู่ บน `429` ค่านี้คือ `0`
- `RateLimit-Reset` หรือ `X-RateLimit-Reset`: เวลาที่จะรีเซ็ต

หากผู้ใช้จำนวนมากใช้ egress IP เดียวกันร่วมกัน อาจชนขีดจำกัด IP แบบไม่ระบุตัวตนได้แม้แต่ละ
คนจะส่ง request เพียงไม่กี่ครั้ง ลงชื่อเข้าใช้เมื่อทำได้และลองใหม่หลังจาก
เวลาหน่วงที่รายงานไว้

## การค้นหาหรือติดตั้งล้มเหลวเมื่ออยู่หลัง proxy

CLI เคารพตัวแปร proxy มาตรฐาน:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

ชื่อที่รองรับรวมถึง `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` และ
`http_proxy`

## skill ไม่ปรากฏในการค้นหา

- ตรวจสอบ slug ที่แน่นอนหรือหน้า owner หากคุณทราบ
- ยืนยันว่า release เป็นสาธารณะและไม่ได้ถูกระงับโดยการสแกนหรือ moderation
- หากคุณเป็นเจ้าของ skill ให้ลงชื่อเข้าใช้แล้วตรวจสอบ:

```bash
clawhub inspect @openclaw/demo
```

diagnostics ที่ owner มองเห็นอาจอธิบายสถานะการสแกน, upload-gate หรือ moderation ได้

## Publish ล้มเหลวเพราะ metadata ที่จำเป็นขาดหาย

สำหรับ skills ให้ตรวจสอบ frontmatter ของ `SKILL.md` ควรประกาศ environment variables และ
tools ที่จำเป็นเพื่อให้ผู้ใช้และ scanners เข้าใจ package ได้

สำหรับ plugins ให้ตรวจสอบ compatibility metadata ใน `package.json` การ publish code-plugin
ต้องมีฟิลด์ความเข้ากันได้กับ OpenClaw เช่น `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion`

ดูตัวอย่าง publish payload ก่อน:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Publish ล้มเหลวด้วยข้อผิดพลาด GitHub owner หรือ source

ClawHub ใช้ GitHub identity และ source attribution เพื่อเชื่อม packages กับ
publishers ของพวกเขา

- ตรวจสอบให้แน่ใจว่าคุณลงชื่อเข้าใช้ด้วยบัญชี GitHub ที่เป็นเจ้าของหรือสามารถ publish
  package ได้
- ตรวจสอบว่า source URL เป็นสาธารณะหรือ ClawHub เข้าถึงได้
- สำหรับ GitHub sources ให้ใช้ `owner/repo`, `owner/repo@ref` หรือ GitHub URL แบบเต็ม

## Publish ล้มเหลวเพราะ namespace ถูกอ้างสิทธิ์หรือสงวนไว้แล้ว

หาก publish ล้มเหลวเพราะ owner handle, org namespace, package scope, skill
slug หรือ package name ถูกอ้างสิทธิ์หรือสงวนไว้แล้ว ก่อนอื่นให้ยืนยันว่าคุณกำลัง
publish ด้วย owner ที่ตรงกับ namespace สำหรับ Plugin packages
ชื่อแบบ scoped เช่น `@example-org/example-plugin` ต้อง publish ในฐานะ
owner `example-org` ที่ตรงกัน

หากคุณเชื่อว่า org, project หรือ brand ของคุณเป็นเจ้าของ namespace ที่ถูกต้องแต่
คุณไม่สามารถจัดการ owner ปัจจุบันใน ClawHub ได้ ให้เปิด
[ปัญหาการอ้างสิทธิ์ Org / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
พร้อมหลักฐานสาธารณะที่ไม่ละเอียดอ่อน ดู
[การอ้างสิทธิ์ Org และ Namespace](/clawhub/namespace-claims) สำหรับคำแนะนำด้านหลักฐานและสิ่งที่
ควรหลีกเลี่ยงไม่ใส่ใน issue สาธารณะ

## `sync` แจ้งว่าไม่พบ skills

`sync` มองหาโฟลเดอร์ที่มี `SKILL.md` หรือ `skill.md`

ชี้ไปยัง roots ที่คุณต้องการสแกน:

```bash
clawhub sync --root /path/to/skills
```

ดูตัวอย่างก่อนหากคุณไม่แน่ใจว่าจะ publish อะไร:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` ปฏิเสธเพราะมีการเปลี่ยนแปลงภายในเครื่อง

ไฟล์ภายในเครื่องไม่ตรงกับเวอร์ชันใดๆ ที่ ClawHub รู้จัก เลือกอย่างใดอย่างหนึ่ง:

- เก็บการแก้ไขภายในเครื่องไว้และข้ามการ update
- เขียนทับด้วยเวอร์ชันที่ publish แล้ว:

```bash
clawhub update @openclaw/demo --force
```

- Publish สำเนาที่คุณแก้ไขเป็น slug หรือ fork ใหม่

## การติดตั้ง Plugin ใน OpenClaw ล้มเหลว

- ใช้ ClawHub source ที่ชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

- ตรวจสอบหน้ารายละเอียด package สำหรับสถานะการสแกนและ compatibility metadata
- ยืนยันว่าเวอร์ชัน OpenClaw ของคุณตรงตามช่วงความเข้ากันได้ที่ package
  ประกาศไว้
- หาก package ถูกซ่อน, ถูกระงับ หรือถูกบล็อก อาจยังติดตั้งไม่ได้จนกว่า
  owner จะแก้ไขปัญหา

## Public API requests ล้มเหลว

- เคารพ retry headers ของ `429` และ cache response รายการ/การค้นหาแบบสาธารณะ
- ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub แบบ canonical
- อย่า mirror เนื้อหาที่ถูกซ่อน, private, ถูกระงับ หรือถูกบล็อกโดย moderation นอก
  public API surface

ดู [HTTP API](/clawhub/http-api) สำหรับรายละเอียด endpoint
