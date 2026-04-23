---
read_when:
    - การเปลี่ยนการเรนเดอร์เอาต์พุตของ assistant ใน Control UI
    - การดีบักคำสั่งกำหนดการแสดงผล `[embed ...]`, `MEDIA:`, reply หรือ audio
summary: โปรโตคอล shortcode สำหรับ rich output สำหรับ embeds, media, audio hints และการตอบกลับ
title: โปรโตคอล Rich Output
x-i18n:
    generated_at: "2026-04-23T10:23:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 566338ac0571c6ab9062c6bad0bc4f71fe65249a3fcd9d8e575affcd93db11e7
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

# โปรโตคอล Rich Output

เอาต์พุตของ assistant สามารถมีคำสั่งกำหนดการส่งมอบ/การเรนเดอร์ได้ชุดเล็ก ๆ ดังนี้:

- `MEDIA:` สำหรับการส่ง attachments
- `[[audio_as_voice]]` สำหรับคำใบ้การแสดงผลเสียง
- `[[reply_to_current]]` / `[[reply_to:<id>]]` สำหรับ metadata ของการตอบกลับ
- `[embed ...]` สำหรับการเรนเดอร์แบบ rich ใน Control UI

คำสั่งเหล่านี้แยกจากกัน `MEDIA:` และแท็ก reply/voice ยังคงเป็น metadata ของการส่งมอบ; `[embed ...]` คือเส้นทางการเรนเดอร์แบบ rich ที่ใช้บนเว็บเท่านั้น

## `[embed ...]`

`[embed ...]` คือไวยากรณ์การเรนเดอร์แบบ rich ฝั่ง agent เพียงแบบเดียวสำหรับ Control UI

ตัวอย่างแบบ self-closing:

```text
[embed ref="cv_123" title="Status" /]
```

กฎ:

- `[view ...]` ใช้ไม่ได้อีกต่อไปสำหรับเอาต์พุตใหม่
- embed shortcodes จะแสดงผลเฉพาะในพื้นผิวข้อความของ assistant
- ระบบเรนเดอร์เฉพาะ embeds ที่อิง URL ใช้ `ref="..."` หรือ `url="..."`
- block-form inline HTML embed shortcodes จะไม่ถูกเรนเดอร์
- เว็บ UI จะลบ shortcode ออกจากข้อความที่มองเห็นได้ และเรนเดอร์ embed แบบ inline
- `MEDIA:` ไม่ใช่ชื่ออื่นของ embed และไม่ควรใช้สำหรับการเรนเดอร์ rich embed

## รูปร่างการเรนเดอร์ที่จัดเก็บไว้

บล็อกเนื้อหา assistant แบบ normalized/ที่จัดเก็บไว้คือรายการ `canvas` ที่มีโครงสร้าง:

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

บล็อกแบบ rich ที่ถูกจัดเก็บ/เรนเดอร์จะใช้โครงสร้าง `canvas` นี้โดยตรง ระบบไม่รู้จัก `present_view`
