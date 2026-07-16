---
read_when:
    - การตั้งค่าการสตรีมแบบเงียบบน Matrix สำหรับ Synapse หรือ Tuwunel ที่โฮสต์เอง
    - ผู้ใช้ต้องการการแจ้งเตือนเฉพาะเมื่อบล็อกเสร็จสมบูรณ์เท่านั้น ไม่ใช่ทุกครั้งที่แก้ไขตัวอย่างก่อนเผยแพร่
summary: กฎการพุช Matrix แยกตามผู้รับสำหรับการแก้ไขตัวอย่างที่เสร็จสมบูรณ์แบบเงียบ ๆ
title: กฎการพุชของ Matrix สำหรับการแสดงตัวอย่างแบบเงียบ
x-i18n:
    generated_at: "2026-07-16T18:50:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1c58e7e796c3ae6d1ee25de229e4592ab8b4fb4d0d50a9cf868ab5ef35b1dab5
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

เมื่อ `channels.matrix.streaming.mode` เป็น `"quiet"` OpenClaw จะสตรีมการตอบกลับโดยแก้ไขเหตุการณ์พรีวิวรายการเดียวในตำแหน่งเดิม พรีวิวจะถูกส่งเป็นเหตุการณ์ `m.notice` ที่ไม่แจ้งเตือน และการแก้ไขขั้นสุดท้ายจะถูกทำเครื่องหมายด้วย `content["com.openclaw.finalized_preview"] = true` ไคลเอนต์ Matrix จะแจ้งเตือนเมื่อมีการแก้ไขขั้นสุดท้ายนั้นก็ต่อเมื่อกฎพุชต่อผู้ใช้ตรงกับเครื่องหมายดังกล่าว หน้านี้มีไว้สำหรับผู้ดูแลระบบที่โฮสต์ Matrix ด้วยตนเองและต้องการติดตั้งกฎนั้นสำหรับบัญชีผู้รับแต่ละบัญชี

`streaming.mode: "progress"` ทำให้ฉบับร่างเสร็จสมบูรณ์ผ่านเส้นทางเดียวกัน ดังนั้นกฎเดียวกันนี้จึงทำงานกับการแก้ไขขั้นสุดท้ายในโหมดความคืบหน้าด้วย

หากต้องการเฉพาะพฤติกรรมการแจ้งเตือนมาตรฐานของ Matrix ให้ใช้ `streaming.mode: "partial"` หรือปิดการสตรีมไว้ ดู[การตั้งค่าช่องทาง Matrix](/th/channels/matrix#streaming-previews)

## ข้อกำหนดเบื้องต้น

- ผู้รับ = บุคคลที่ควรได้รับการแจ้งเตือน
- ผู้ใช้บอต = บัญชี Matrix ของ OpenClaw ที่ส่งการตอบกลับ
- ใช้โทเค็นการเข้าถึงของผู้รับสำหรับการเรียก API ด้านล่าง
- จับคู่ `sender` ในกฎพุชกับ MXID แบบเต็มของผู้ใช้บอต
- บัญชีผู้รับต้องมีตัวพุชที่ใช้งานได้อยู่แล้ว กฎพรีวิวแบบเงียบจะทำงานได้ก็ต่อเมื่อการส่งพุชตามปกติของ Matrix อยู่ในสถานะปกติ

## ขั้นตอน

<Steps>
  <Step title="กำหนดค่าพรีวิวแบบเงียบ">

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "quiet" },
    },
  },
}
```

  </Step>

  <Step title="รับโทเค็นการเข้าถึงของผู้รับ">
    ใช้โทเค็นเซสชันไคลเอนต์ที่มีอยู่ซ้ำหากเป็นไปได้ หากต้องการสร้างโทเค็นใหม่:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="ตรวจสอบว่ามีตัวพุชอยู่">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

หากไม่มีตัวพุชส่งกลับมา ให้แก้ไขการส่งพุชตามปกติของ Matrix สำหรับบัญชีนี้ก่อนดำเนินการต่อ

  </Step>

  <Step title="ติดตั้งกฎพุชแบบแทนที่">
    ติดตั้งกฎที่จับคู่เครื่องหมายพรีวิวที่เสร็จสมบูรณ์ร่วมกับ MXID ของบอตในฐานะผู้ส่ง:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    แทนค่าต่อไปนี้ก่อนเรียกใช้:

    - `https://matrix.example.org`: URL ฐานของโฮมเซิร์ฟเวอร์
    - `$USER_ACCESS_TOKEN`: โทเค็นการเข้าถึงของผู้รับ
    - `openclaw-finalized-preview-botname`: ID กฎที่ไม่ซ้ำกันต่อบอตและต่อผู้รับ (รูปแบบ: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID ของบอต OpenClaw ไม่ใช่ของผู้รับ

  </Step>

  <Step title="ตรวจสอบ">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

จากนั้นทดสอบการตอบกลับแบบสตรีม ในโหมดเงียบ ห้องจะแสดงพรีวิวฉบับร่างแบบเงียบและแจ้งเตือนหนึ่งครั้งเมื่อบล็อกหรือรอบการทำงานเสร็จสิ้น

  </Step>
</Steps>

หากต้องการนำกฎออกในภายหลัง ให้ `DELETE` URL กฎเดิมด้วยโทเค็นของผู้รับ

## หมายเหตุเกี่ยวกับหลายบอต

กฎพุชใช้ `ruleId` เป็นคีย์: การเรียก `PUT` ซ้ำกับ ID เดิมจะอัปเดตกฎรายการเดียว สำหรับบอต OpenClaw หลายตัวที่แจ้งเตือนผู้รับรายเดียวกัน ให้สร้างหนึ่งกฎต่อบอตโดยใช้เงื่อนไขจับคู่ผู้ส่งที่แตกต่างกัน

กฎ `override` ที่ผู้ใช้กำหนดขึ้นใหม่จะถูกแทรกไว้ก่อนกฎระงับเริ่มต้นของเซิร์ฟเวอร์ จึงไม่จำเป็นต้องใช้พารามิเตอร์ลำดับเพิ่มเติม กฎนี้มีผลเฉพาะกับการแก้ไขพรีวิวแบบข้อความล้วนที่สามารถทำให้เสร็จสมบูรณ์ในตำแหน่งเดิมได้เท่านั้น ส่วนการตอบกลับที่มีสื่อ การย้อนกลับเมื่อพรีวิวเก่าเกินไป และข้อความสุดท้ายที่ทำให้การกล่าวถึงของ Matrix ทำงาน จะถูกส่งเป็นข้อความแจ้งเตือนตามปกติแทน

## หมายเหตุเกี่ยวกับโฮมเซิร์ฟเวอร์

<AccordionGroup>
  <Accordion title="Synapse">
    ไม่จำเป็นต้องเปลี่ยนแปลง `homeserver.yaml` เป็นพิเศษ หากการแจ้งเตือนตามปกติของ Matrix ส่งถึงผู้ใช้นี้อยู่แล้ว โทเค็นของผู้รับร่วมกับการเรียก `pushrules` ข้างต้นคือขั้นตอนการตั้งค่าหลัก

    หากใช้งาน Synapse หลังพร็อกซีย้อนกลับหรือเวิร์กเกอร์ ให้ตรวจสอบว่า `/_matrix/client/.../pushrules/` ไปถึง Synapse อย่างถูกต้อง การส่งพุชจะได้รับการจัดการโดยกระบวนการหลักหรือ `synapse.app.pusher` / เวิร์กเกอร์ตัวพุชที่กำหนดค่าไว้ โปรดตรวจสอบว่าส่วนเหล่านั้นทำงานเป็นปกติ

    กฎนี้ใช้เงื่อนไขกฎพุช `event_property_is` (MSC3758, กฎพุช v1.10) ซึ่งเพิ่มลงใน Synapse เมื่อปี 2023 Synapse รุ่นเก่าจะยอมรับการเรียก `PUT pushrules/...` แต่จะไม่จับคู่เงื่อนไขโดยไม่มีการแจ้งเตือนใด ๆ ให้อัปเกรด Synapse หากไม่มีการแจ้งเตือนเมื่อมีการแก้ไขพรีวิวขั้นสุดท้าย

  </Accordion>

  <Accordion title="Tuwunel">
    ใช้ขั้นตอนเดียวกับ Synapse โดยไม่ต้องกำหนดค่าเฉพาะสำหรับ Tuwunel เพื่อรองรับเครื่องหมายพรีวิวที่เสร็จสมบูรณ์

    หากการแจ้งเตือนหายไปขณะที่ผู้ใช้กำลังใช้งานอุปกรณ์อื่น ให้ตรวจสอบว่าเปิดใช้งาน `suppress_push_when_active` อยู่หรือไม่ Tuwunel เพิ่มตัวเลือกนี้ใน 1.4.2 (กันยายน 2025) และตัวเลือกนี้สามารถระงับการพุชไปยังอุปกรณ์อื่นโดยเจตนาขณะที่อุปกรณ์หนึ่งกำลังใช้งานอยู่

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [การตั้งค่าช่องทาง Matrix](/th/channels/matrix)
- [แนวคิดเกี่ยวกับการสตรีม](/th/concepts/streaming)
