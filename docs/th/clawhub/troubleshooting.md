---
read_when:
    - คำสั่ง ClawHub CLI หรือรีจิสทรี OpenClaw ล้มเหลว
    - ไม่สามารถติดตั้ง เผยแพร่ หรืออัปเดตแพ็กเกจได้
summary: การแก้ไขปัญหาการลงชื่อเข้าใช้ การติดตั้ง การเผยแพร่ การอัปเดต และปัญหา API ของ ClawHub.
x-i18n:
    generated_at: "2026-07-02T08:55:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# การแก้ไขปัญหา

## `clawhub login` เปิดเบราว์เซอร์แต่ไม่เสร็จสมบูรณ์

CLI จะเริ่มเซิร์ฟเวอร์ callback แบบ local อายุสั้นระหว่างการเข้าสู่ระบบผ่านเบราว์เซอร์

- ตรวจสอบให้แน่ใจว่าเบราว์เซอร์ของคุณเข้าถึง `http://127.0.0.1:<port>/callback` ได้
- ตรวจสอบกฎไฟร์วอลล์ภายในเครื่อง, VPN และพร็อกซี หาก callback ไม่มาถึง
- ในสภาพแวดล้อมแบบ headless ให้สร้าง API token ใน ClawHub web UI แล้วรัน:

```bash
clawhub login --token clh_...
```

## `whoami` หรือ `publish` ส่งคืน `Unauthorized` (401)

- เข้าสู่ระบบอีกครั้งด้วย `clawhub login`
- หากคุณใช้เส้นทาง config แบบกำหนดเอง ให้ยืนยันว่า `CLAWHUB_CONFIG_PATH` ชี้ไปยัง
  ไฟล์ที่มี token ปัจจุบันของคุณ
- หากคุณใช้ API token ให้ยืนยันว่าไม่ได้ถูกเพิกถอนใน web UI

## การค้นหาหรือการติดตั้งส่งคืน `Rate limit exceeded` (429)

อ่านข้อมูลการลองใหม่ใน response:

- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่
- `RateLimit-Limit`: ขีดจำกัดที่ใช้กับคำขอนี้
- `RateLimit-Remaining`: โควตาที่เหลืออยู่จริงของคุณเมื่อมี header นี้ ในกรณี `429` ค่านี้คือ `0`
- `RateLimit-Reset` หรือ `X-RateLimit-Reset`: เวลาที่จะรีเซ็ต

หากผู้ใช้หลายคนแชร์ egress IP เดียวกัน อาจถึงขีดจำกัด IP แบบไม่ระบุตัวตนได้ แม้ว่าแต่ละ
คนจะส่งคำขอเพียงไม่กี่ครั้งก็ตาม ให้เข้าสู่ระบบเมื่อทำได้และลองใหม่หลังจากเวลาเลื่อนที่
รายงานไว้

## การค้นหาหรือการติดตั้งล้มเหลวหลังพร็อกซี

CLI เคารพตัวแปรพร็อกซีมาตรฐาน:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

ชื่อที่รองรับรวมถึง `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` และ
`http_proxy`

## skill ไม่ปรากฏในการค้นหา

- ตรวจสอบ slug หรือหน้า owner ที่ถูกต้องหากคุณรู้
- ยืนยันว่า release เป็นสาธารณะและไม่ได้ถูกระงับโดยการสแกนหรือการกลั่นกรอง
- หากคุณเป็นเจ้าของ skill ให้เข้าสู่ระบบและตรวจสอบ:

```bash
clawhub inspect @openclaw/demo
```

diagnostics ที่ owner มองเห็นอาจอธิบายสถานะการสแกน, upload-gate หรือการกลั่นกรองได้

## การ publish ล้มเหลวเพราะ metadata ที่จำเป็นขาดหาย

สำหรับ Skills ให้ตรวจสอบ frontmatter ของ `SKILL.md` ควรประกาศ environment variables และ
tools ที่จำเป็นเพื่อให้ผู้ใช้และ scanner เข้าใจแพ็กเกจได้

สำหรับ plugins ให้ตรวจสอบ compatibility metadata ใน `package.json` การ publish code-plugin
ต้องมีฟิลด์ความเข้ากันได้ของ OpenClaw เช่น `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion`

ดูตัวอย่าง publish payload ก่อน:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## การ publish ล้มเหลวด้วยข้อผิดพลาดเกี่ยวกับ GitHub owner หรือ source

ClawHub ใช้ GitHub identity และการระบุแหล่งที่มาเพื่อเชื่อมแพ็กเกจกับ
ผู้เผยแพร่ของแพ็กเกจนั้น

- ตรวจสอบให้แน่ใจว่าคุณเข้าสู่ระบบด้วยบัญชี GitHub ที่เป็นเจ้าของหรือสามารถ publish
  แพ็กเกจได้
- ตรวจสอบว่า source URL เป็นสาธารณะหรือ ClawHub เข้าถึงได้
- สำหรับ GitHub sources ให้ใช้ `owner/repo`, `owner/repo@ref` หรือ GitHub URL แบบเต็ม

## การ publish ล้มเหลวเพราะ namespace ถูกอ้างสิทธิ์หรือสงวนไว้แล้ว

หากการ publish ล้มเหลวเพราะ owner handle, org namespace, package scope, skill
slug หรือ package name ถูกอ้างสิทธิ์หรือสงวนไว้แล้ว ให้ยืนยันก่อนว่าคุณกำลัง
publish ด้วย owner ที่ตรงกับ namespace สำหรับ plugin packages
ชื่อแบบ scoped เช่น `@example-org/example-plugin` ต้อง publish ในนาม owner
`example-org` ที่ตรงกัน

หากคุณเชื่อว่า org, project หรือ brand ของคุณเป็นเจ้าของ namespace โดยชอบธรรม แต่
คุณไม่สามารถจัดการ ClawHub owner ปัจจุบันได้ ให้เปิด
[issue การอ้างสิทธิ์ Org / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
พร้อมหลักฐานสาธารณะที่ไม่อ่อนไหว ดู
[การอ้างสิทธิ์ Org และ Namespace](/clawhub/namespace-claims) สำหรับแนวทางด้านหลักฐานและสิ่งที่
ควรหลีกเลี่ยงไม่ใส่ใน issue สาธารณะ

## `sync` แจ้งว่าไม่พบ skills

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

ไฟล์ภายในเครื่องไม่ตรงกับเวอร์ชันใด ๆ ที่ ClawHub รู้จัก เลือกหนึ่งทาง:

- เก็บการแก้ไขภายในเครื่องไว้และข้ามการ update
- เขียนทับด้วยเวอร์ชันที่ publish แล้ว:

```bash
clawhub update @openclaw/demo --force
```

- Publish สำเนาที่คุณแก้ไขเป็น slug ใหม่หรือ fork

## การติดตั้ง plugin ใน OpenClaw ล้มเหลว

- ใช้ ClawHub source แบบชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

- ตรวจสอบหน้ารายละเอียดแพ็กเกจสำหรับสถานะการสแกนและ compatibility metadata
- ยืนยันว่าเวอร์ชัน OpenClaw ของคุณเป็นไปตาม compatibility range ที่แพ็กเกจประกาศไว้
- หากแพ็กเกจถูกซ่อน, ถูกระงับ หรือถูกบล็อก อาจไม่สามารถติดตั้งได้จนกว่า
  owner จะแก้ไขปัญหา

## คำขอ Public API ล้มเหลว

- เคารพ header การลองใหม่ของ `429` และ cache response รายการ/การค้นหาสาธารณะ
- ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub canonical
- อย่า mirror เนื้อหาที่ซ่อน, เป็นส่วนตัว, ถูกระงับ หรือถูกบล็อกโดยการกลั่นกรอง นอกเหนือจาก
  public API surface

ดู [HTTP API](/clawhub/http-api) สำหรับรายละเอียด endpoint
