---
read_when:
    - การตั้งค่าการสตรีมแบบเงียบของ Matrix สำหรับ Synapse หรือ Tuwunel ที่โฮสต์เอง
    - ผู้ใช้ต้องการรับการแจ้งเตือนเฉพาะสำหรับบล็อกที่เสร็จสิ้นแล้ว ไม่ใช่ทุกการแก้ไขตัวอย่าง
summary: กฎการพุชของ Matrix แบบรายผู้รับสำหรับการแก้ไขตัวอย่างที่สรุปแล้วแบบเงียบ
title: กฎการพุชของ Matrix สำหรับพรีวิวแบบเงียบ
x-i18n:
    generated_at: "2026-04-30T09:37:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2f037a50a85b350163c74cf6b9cce335ecaaa5cccc762124122ad6d0321a1fa
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

เมื่อ `channels.matrix.streaming` เป็น `"quiet"` OpenClaw จะแก้ไขอีเวนต์ตัวอย่างเดียวในตำแหน่งเดิม และทำเครื่องหมายการแก้ไขที่เสร็จสมบูรณ์ด้วยแฟล็กเนื้อหาแบบกำหนดเอง ไคลเอนต์ Matrix จะแจ้งเตือนเมื่อมีการแก้ไขสุดท้ายก็ต่อเมื่อกฎการพุชรายผู้ใช้ตรงกับแฟล็กนั้น หน้านี้มีไว้สำหรับผู้ดูแลระบบที่โฮสต์ Matrix เองและต้องการติดตั้งกฎนั้นให้กับแต่ละบัญชีผู้รับ

หากคุณต้องการเพียงพฤติกรรมการแจ้งเตือน Matrix มาตรฐาน ให้ใช้ `streaming: "partial"` หรือปิดการสตรีมไว้ ดู [การตั้งค่าช่องทาง Matrix](/th/channels/matrix#streaming-previews)

## ข้อกำหนดเบื้องต้น

- ผู้ใช้ผู้รับ = บุคคลที่ควรได้รับการแจ้งเตือน
- ผู้ใช้บอต = บัญชี Matrix ของ OpenClaw ที่ส่งคำตอบ
- ใช้ access token ของผู้ใช้ผู้รับสำหรับการเรียก API ด้านล่าง
- จับคู่ `sender` ในกฎการพุชกับ MXID แบบเต็มของผู้ใช้บอต
- บัญชีผู้รับต้องมี pushers ที่ทำงานได้อยู่แล้ว — กฎตัวอย่างแบบเงียบจะทำงานเฉพาะเมื่อการส่งพุช Matrix ปกติทำงานสมบูรณ์

## ขั้นตอน

<Steps>
  <Step title="กำหนดค่าตัวอย่างแบบเงียบ">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="รับ access token ของผู้รับ">
    ใช้โทเค็นเซสชันไคลเอนต์ที่มีอยู่ซ้ำหากทำได้ หากต้องการออกโทเค็นใหม่:

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

  <Step title="ตรวจสอบว่ามี pushers อยู่">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

หากไม่มี pushers ส่งกลับมา ให้แก้ไขการส่งพุช Matrix ปกติสำหรับบัญชีนี้ก่อนดำเนินการต่อ

  </Step>

  <Step title="ติดตั้งกฎการพุชแบบ override">
    OpenClaw ทำเครื่องหมายการแก้ไขตัวอย่างแบบข้อความล้วนที่เสร็จสมบูรณ์ด้วย `content["com.openclaw.finalized_preview"] = true` ติดตั้งกฎที่จับคู่เครื่องหมายนั้นพร้อมกับ MXID ของบอตในฐานะผู้ส่ง:

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

    แทนที่ก่อนเรียกใช้:

    - `https://matrix.example.org`: URL ฐานของ homeserver ของคุณ
    - `$USER_ACCESS_TOKEN`: access token ของผู้ใช้ผู้รับ
    - `openclaw-finalized-preview-botname`: ID กฎที่ไม่ซ้ำกันต่อบอตต่อผู้รับ (รูปแบบ: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID ของบอต OpenClaw ของคุณ ไม่ใช่ของผู้รับ

  </Step>

  <Step title="ตรวจสอบ">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

จากนั้นทดสอบคำตอบแบบสตรีม ในโหมดเงียบ ห้องจะแสดงตัวอย่างร่างแบบเงียบและแจ้งเตือนหนึ่งครั้งเมื่อบล็อกหรือเทิร์นเสร็จสิ้น

  </Step>
</Steps>

หากต้องการลบกฎในภายหลัง ให้ `DELETE` URL กฎเดียวกันด้วยโทเค็นของผู้รับ

## หมายเหตุสำหรับหลายบอต

กฎการพุชถูกกำหนดคีย์ด้วย `ruleId`: การเรียก `PUT` ซ้ำกับ ID เดิมจะอัปเดตกฎเดียว สำหรับบอต OpenClaw หลายตัวที่แจ้งเตือนผู้รับคนเดียวกัน ให้สร้างกฎหนึ่งรายการต่อบอตโดยใช้การจับคู่ผู้ส่งที่แตกต่างกัน

กฎ `override` ที่ผู้ใช้กำหนดใหม่จะถูกแทรกไว้ก่อนกฎระงับค่าเริ่มต้น ดังนั้นจึงไม่ต้องใช้พารามิเตอร์การจัดลำดับเพิ่มเติม กฎนี้มีผลเฉพาะกับการแก้ไขตัวอย่างแบบข้อความล้วนที่สามารถทำให้เสร็จสมบูรณ์ในตำแหน่งเดิมได้เท่านั้น ส่วน fallback สำหรับสื่อและ fallback สำหรับตัวอย่างที่ค้างเก่าใช้การส่ง Matrix ปกติ

## หมายเหตุสำหรับ homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    ไม่จำเป็นต้องเปลี่ยน `homeserver.yaml` เป็นพิเศษ หากการแจ้งเตือน Matrix ปกติไปถึงผู้ใช้นี้อยู่แล้ว โทเค็นผู้รับ + การเรียก `pushrules` ด้านบนคือขั้นตอนการตั้งค่าหลัก

    หากคุณเรียกใช้ Synapse หลัง reverse proxy หรือ workers ตรวจสอบให้แน่ใจว่า `/_matrix/client/.../pushrules/` ไปถึง Synapse อย่างถูกต้อง การส่งพุชจัดการโดยกระบวนการหลักหรือ `synapse.app.pusher` / workers ของ pusher ที่กำหนดค่าไว้ — ตรวจสอบให้แน่ใจว่าส่วนเหล่านั้นทำงานปกติ

    กฎนี้ใช้เงื่อนไขกฎการพุช `event_property_is` (MSC3758, push rule v1.10) ซึ่งถูกเพิ่มใน Synapse ในปี 2023 Synapse รุ่นเก่ากว่ายอมรับการเรียก `PUT pushrules/...` แต่จะไม่จับคู่เงื่อนไขอย่างเงียบ ๆ — อัปเกรด Synapse หากไม่มีการแจ้งเตือนมาถึงเมื่อมีการแก้ไขตัวอย่างที่เสร็จสมบูรณ์

  </Accordion>

  <Accordion title="Tuwunel">
    ใช้ขั้นตอนเดียวกับ Synapse; ไม่จำเป็นต้องมีการกำหนดค่าเฉพาะของ Tuwunel สำหรับเครื่องหมายตัวอย่างที่เสร็จสมบูรณ์

    หากการแจ้งเตือนหายไปขณะผู้ใช้ใช้งานบนอุปกรณ์อื่น ให้ตรวจสอบว่าเปิดใช้งาน `suppress_push_when_active` อยู่หรือไม่ Tuwunel เพิ่มตัวเลือกนี้ใน 1.4.2 (กันยายน 2025) และสามารถตั้งใจระงับการพุชไปยังอุปกรณ์อื่นขณะที่มีอุปกรณ์หนึ่งกำลังใช้งานอยู่

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [การตั้งค่าช่องทาง Matrix](/th/channels/matrix)
- [แนวคิดการสตรีม](/th/concepts/streaming)
