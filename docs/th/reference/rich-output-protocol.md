---
read_when:
    - การเปลี่ยนแปลงการเรนเดอร์เอาต์พุตของผู้ช่วยใน Control UI
    - การดีบักคำสั่งการนำเสนอ `[embed ...]`, `MEDIA:`, reply หรือ audio
summary: โปรโตคอล shortcode สำหรับ rich output สำหรับ embeds, media, audio hints และ replies
title: โปรโตคอล rich output
x-i18n:
    generated_at: "2026-04-25T13:58:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 643d1594d05174abf984f06c76a675670968c42c7260e7b73821f346e3f683df
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

เอาต์พุตของผู้ช่วยสามารถมีคำสั่งสำหรับการส่งมอบ/การเรนเดอร์ได้ชุดเล็ก ๆ ดังนี้:

- `MEDIA:` สำหรับการส่งไฟล์แนบ
- `[[audio_as_voice]]` สำหรับคำใบ้การแสดงผลเสียง
- `[[reply_to_current]]` / `[[reply_to:<id>]]` สำหรับเมทาดาทาการตอบกลับ
- `[embed ...]` สำหรับการเรนเดอร์แบบ rich ใน Control UI

คำสั่งเหล่านี้แยกจากกัน `MEDIA:` และแท็ก reply/voice ยังคงเป็นเมทาดาทาสำหรับการส่งมอบ ส่วน `[embed ...]` เป็นเส้นทางการเรนเดอร์แบบ rich สำหรับเว็บเท่านั้น

เมื่อเปิดใช้งาน block streaming, `MEDIA:` จะยังคงเป็นเมทาดาทาสำหรับการส่งมอบเพียงครั้งเดียวต่อ
turn หาก URL ของ media เดียวกันถูกส่งมาในบล็อกที่สตรีม และถูกซ้ำอีกครั้งใน payload สุดท้าย
ของผู้ช่วย OpenClaw จะส่งไฟล์แนบเพียงครั้งเดียวและลบรายการที่ซ้ำออกจาก
payload สุดท้าย

## `[embed ...]`

`[embed ...]` คือไวยากรณ์ rich render ฝั่ง agent เพียงแบบเดียวสำหรับ Control UI

ตัวอย่างแบบ self-closing:

```text
[embed ref="cv_123" title="Status" /]
```

กฎ:

- `[view ...]` ไม่ถูกต้องอีกต่อไปสำหรับเอาต์พุตใหม่
- embed shortcodes จะแสดงผลเฉพาะบนพื้นผิวข้อความของผู้ช่วยเท่านั้น
- จะแสดงผลเฉพาะ embed ที่อ้างอิงด้วย URL เท่านั้น ให้ใช้ `ref="..."` หรือ `url="..."`
- shortcode embed แบบ inline HTML ในรูปแบบ block จะไม่ถูกเรนเดอร์
- เว็บ UI จะตัด shortcode ออกจากข้อความที่มองเห็น แล้วเรนเดอร์ embed แบบ inline
- `MEDIA:` ไม่ใช่ alias ของ embed และไม่ควรใช้สำหรับการเรนเดอร์ rich embed

## รูปร่างการเรนเดอร์ที่จัดเก็บไว้

บล็อกเนื้อหาของผู้ช่วยที่ถูก normalize/จัดเก็บจะเป็นรายการ `canvas` แบบมีโครงสร้าง:

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

บล็อก rich ที่ถูกจัดเก็บ/เรนเดอร์จะใช้รูปทรง `canvas` นี้โดยตรง `present_view` จะไม่ถูกรับรู้

## ที่เกี่ยวข้อง

- [RPC adapters](/th/reference/rpc)
- [Typebox](/th/concepts/typebox)
