---
read_when:
    - คำสั่ง ClawHub CLI หรือรีจิสทรี OpenClaw ล้มเหลว
    - ไม่สามารถติดตั้ง เผยแพร่ หรืออัปเดตแพ็กเกจได้
summary: การแก้ไขปัญหาการลงชื่อเข้าใช้ การติดตั้ง การเผยแพร่ การอัปเดต และปัญหา API ของ ClawHub
x-i18n:
    generated_at: "2026-06-28T05:08:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# การแก้ไขปัญหา

## `clawhub login` เปิดเบราว์เซอร์แต่ไม่เสร็จสิ้น

CLI เริ่มเซิร์ฟเวอร์ callback ภายในเครื่องแบบอายุสั้นระหว่างการเข้าสู่ระบบผ่านเบราว์เซอร์

- ตรวจสอบให้แน่ใจว่าเบราว์เซอร์ของคุณเข้าถึง `http://127.0.0.1:<port>/callback` ได้
- ตรวจสอบไฟร์วอลล์ภายในเครื่อง, VPN และกฎพร็อกซี หาก callback ไม่มาถึง
- ในสภาพแวดล้อมแบบ headless ให้สร้าง API token ใน ClawHub web UI แล้วรัน:

```bash
clawhub login --token clh_...
```

## `whoami` หรือ `publish` ส่งคืน `Unauthorized` (401)

- เข้าสู่ระบบอีกครั้งด้วย `clawhub login`
- หากคุณใช้เส้นทาง config แบบกำหนดเอง ให้ยืนยันว่า `CLAWHUB_CONFIG_PATH` ชี้ไปยัง
  ไฟล์ที่มี token ปัจจุบันของคุณ
- หากคุณใช้ API token ให้ยืนยันว่าไม่ได้ถูกเพิกถอนใน web UI

## การค้นหาหรือติดตั้งส่งคืน `Rate limit exceeded` (429)

อ่านข้อมูลการลองใหม่ในคำตอบ:

- `Retry-After`: จำนวนวินาทีที่ต้องรอก่อนลองใหม่
- `RateLimit-Limit`: ขีดจำกัดที่ใช้กับคำขอนี้
- `RateLimit-Remaining`: งบประมาณที่เหลืออยู่จริงของคุณเมื่อมี header นี้ สำหรับ `429` ค่านี้คือ `0`
- `RateLimit-Reset` หรือ `X-RateLimit-Reset`: เวลาการรีเซ็ต

หากผู้ใช้หลายคนใช้ egress IP เดียวกันร่วมกัน อาจชนขีดจำกัด IP แบบไม่ระบุตัวตนได้ แม้แต่ละ
คนจะส่งคำขอเพียงไม่กี่ครั้งก็ตาม เข้าสู่ระบบเมื่อเป็นไปได้ และลองใหม่หลังจาก
ระยะเวลาที่รายงานไว้

## การค้นหาหรือติดตั้งล้มเหลวหลังพร็อกซี

CLI เคารพตัวแปรพร็อกซีมาตรฐาน:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

ชื่อที่รองรับรวมถึง `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` และ
`http_proxy`

## skill ไม่ปรากฏในการค้นหา

- ตรวจสอบ slug ที่ถูกต้องหรือหน้าเจ้าของ หากคุณทราบ
- ยืนยันว่า release เป็นสาธารณะ และไม่ได้ถูกระงับโดยการสแกนหรือการดูแลเนื้อหา
- หากคุณเป็นเจ้าของ skill ให้เข้าสู่ระบบและตรวจสอบ:

```bash
clawhub inspect @openclaw/demo
```

ข้อมูลวินิจฉัยที่เจ้าของมองเห็นอาจอธิบายสถานะการสแกน, upload-gate หรือการดูแลเนื้อหา

## การเผยแพร่ล้มเหลวเพราะไม่มี metadata ที่จำเป็น

สำหรับ skills ให้ตรวจสอบ frontmatter ของ `SKILL.md` ควรประกาศ environment variables และ
เครื่องมือที่จำเป็น เพื่อให้ผู้ใช้และตัวสแกนเข้าใจแพ็กเกจได้

สำหรับ Plugin ให้ตรวจสอบ metadata ความเข้ากันได้ใน `package.json` การเผยแพร่ code-plugin
ต้องมีฟิลด์ความเข้ากันได้ของ OpenClaw เช่น `openclaw.compat.pluginApi` และ
`openclaw.build.openclawVersion`

ดูตัวอย่าง publish payload ก่อน:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## การเผยแพร่ล้มเหลวด้วยข้อผิดพลาดเกี่ยวกับเจ้าของ GitHub หรือแหล่งที่มา

ClawHub ใช้ตัวตน GitHub และการระบุแหล่งที่มาเพื่อเชื่อมแพ็กเกจกับ
ผู้เผยแพร่

- ตรวจสอบให้แน่ใจว่าคุณเข้าสู่ระบบด้วยบัญชี GitHub ที่เป็นเจ้าของหรือสามารถเผยแพร่
  แพ็กเกจได้
- ตรวจสอบว่า source URL เป็นสาธารณะหรือ ClawHub เข้าถึงได้
- สำหรับแหล่งที่มาจาก GitHub ให้ใช้ `owner/repo`, `owner/repo@ref` หรือ GitHub URL แบบเต็ม

## การเผยแพร่ล้มเหลวเพราะ namespace ถูกอ้างสิทธิ์หรือสงวนไว้แล้ว

หากการเผยแพร่ล้มเหลวเพราะ owner handle, org namespace, package scope, skill
slug หรือชื่อแพ็กเกจถูกอ้างสิทธิ์หรือสงวนไว้แล้ว ให้ยืนยันก่อนว่าคุณกำลัง
เผยแพร่ด้วยเจ้าของที่ตรงกับ namespace นั้น สำหรับแพ็กเกจ Plugin
ชื่อแบบมี scope เช่น `@example-org/example-plugin` ต้องเผยแพร่ในฐานะเจ้าของ
`example-org` ที่ตรงกัน

หากคุณเชื่อว่า org, project หรือแบรนด์ของคุณเป็นเจ้าของ namespace โดยชอบธรรม แต่
คุณจัดการเจ้าของ ClawHub ปัจจุบันไม่ได้ ให้เปิด
[ปัญหาการอ้างสิทธิ์ Org / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
พร้อมหลักฐานสาธารณะที่ไม่อ่อนไหว ดู
[การอ้างสิทธิ์ Org และ Namespace](/th/clawhub/namespace-claims) สำหรับแนวทางหลักฐานและสิ่งที่
ไม่ควรใส่ใน issue สาธารณะ

## `sync` แจ้งว่าไม่พบ skills

`sync` มองหาโฟลเดอร์ที่มี `SKILL.md` หรือ `skill.md`

ชี้ไปยังรากที่คุณต้องการสแกน:

```bash
clawhub sync --root /path/to/skills
```

ดูตัวอย่างก่อนหากคุณไม่แน่ใจว่าจะเผยแพร่อะไร:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` ปฏิเสธเพราะมีการเปลี่ยนแปลงภายในเครื่อง

ไฟล์ภายในเครื่องไม่ตรงกับเวอร์ชันใดที่ ClawHub รู้จัก เลือกหนึ่งทาง:

- เก็บการแก้ไขภายในเครื่องไว้และข้ามการอัปเดต
- เขียนทับด้วยเวอร์ชันที่เผยแพร่แล้ว:

```bash
clawhub update @openclaw/demo --force
```

- เผยแพร่สำเนาที่คุณแก้ไขเป็น slug ใหม่หรือ fork

## การติดตั้ง Plugin ล้มเหลวใน OpenClaw

- ใช้แหล่งที่มา ClawHub แบบระบุชัดเจน:

```bash
openclaw plugins install clawhub:<package>
```

- ตรวจสอบหน้ารายละเอียดแพ็กเกจสำหรับสถานะการสแกนและ metadata ความเข้ากันได้
- ยืนยันว่าเวอร์ชัน OpenClaw ของคุณตรงตามช่วงความเข้ากันได้ที่แพ็กเกจ
  ประกาศไว้
- หากแพ็กเกจถูกซ่อน, ถูกระงับ หรือถูกบล็อก อาจติดตั้งไม่ได้จนกว่า
  เจ้าของจะแก้ไขปัญหา

## คำขอ Public API ล้มเหลว

- เคารพ headers การลองใหม่ของ `429` และแคชคำตอบรายการ/การค้นหาสาธารณะ
- ลิงก์ผู้ใช้กลับไปยังรายการ ClawHub ที่เป็น canonical
- อย่าทำ mirror เนื้อหาที่ถูกซ่อน, เป็นส่วนตัว, ถูกระงับ หรือถูกบล็อกโดยการดูแลเนื้อหานอก
  พื้นผิว Public API

ดู [HTTP API](/th/clawhub/http-api) สำหรับรายละเอียด endpoint
