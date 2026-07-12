---
read_when:
    - การตั้งค่าการสตรีมแบบเงียบของ Matrix สำหรับ Synapse หรือ Tuwunel ที่โฮสต์เอง
    - ผู้ใช้ต้องการการแจ้งเตือนเฉพาะเมื่อบล็อกเสร็จสมบูรณ์เท่านั้น ไม่ใช่ทุกครั้งที่แก้ไขตัวอย่างก่อนเผยแพร่
summary: กฎการพุช Matrix แยกตามผู้รับ สำหรับการแก้ไขตัวอย่างที่เสร็จสมบูรณ์แบบเงียบ ๆ
title: กฎการพุช Matrix สำหรับการแสดงตัวอย่างแบบเงียบ
x-i18n:
    generated_at: "2026-07-12T15:53:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f2260b4cc68f82cbe1aef86b8963b6b40e93f089b31991964fc9282b2c121fb
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

เมื่อ `channels.matrix.streaming` เป็น `"quiet"` OpenClaw จะสตรีมคำตอบโดยแก้ไขเหตุการณ์ตัวอย่างรายการเดียว ณ ตำแหน่งเดิม ตัวอย่างจะถูกส่งเป็นเหตุการณ์ `m.notice` ที่ไม่แจ้งเตือน และการแก้ไขฉบับสมบูรณ์จะถูกทำเครื่องหมายด้วย `content["com.openclaw.finalized_preview"] = true` ไคลเอนต์ Matrix จะแจ้งเตือนเมื่อมีการแก้ไขครั้งสุดท้ายนั้น เฉพาะเมื่อกฎพุชรายผู้ใช้ตรงกับเครื่องหมายดังกล่าว หน้านี้มีไว้สำหรับผู้ดูแลระบบที่โฮสต์ Matrix ด้วยตนเองและต้องการติดตั้งกฎนั้นให้กับบัญชีผู้รับแต่ละบัญชี

`streaming: "progress"` ทำให้ฉบับร่างเสร็จสมบูรณ์ผ่านเส้นทางเดียวกัน ดังนั้นกฎเดียวกันนี้จึงทำงานกับการแก้ไขฉบับสมบูรณ์ในโหมดความคืบหน้าด้วย

หากต้องการเฉพาะพฤติกรรมการแจ้งเตือนมาตรฐานของ Matrix ให้ใช้ `streaming: "partial"` หรือปิดการสตรีมไว้ ดู [การตั้งค่าช่องทาง Matrix](/th/channels/matrix#streaming-previews)

## ข้อกำหนดเบื้องต้น

- ผู้ใช้ผู้รับ = บุคคลที่ควรได้รับการแจ้งเตือน
- ผู้ใช้บอต = บัญชี Matrix ของ OpenClaw ที่ส่งคำตอบ
- ใช้โทเค็นการเข้าถึงของผู้ใช้ผู้รับสำหรับการเรียก API ด้านล่าง
- จับคู่ `sender` ในกฎพุชกับ MXID แบบเต็มของผู้ใช้บอต
- บัญชีผู้รับต้องมีตัวส่งการแจ้งเตือนที่ใช้งานได้อยู่แล้ว กฎตัวอย่างแบบเงียบจะทำงานเฉพาะเมื่อการส่งพุชตามปกติของ Matrix ทำงานเป็นปกติ

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

  <Step title="รับโทเค็นการเข้าถึงของผู้รับ">
    ใช้โทเค็นเซสชันของไคลเอนต์ที่มีอยู่ซ้ำหากเป็นไปได้ หากต้องการออกโทเค็นใหม่:

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

  <Step title="ตรวจสอบว่ามีตัวส่งการแจ้งเตือน">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

หากไม่มีตัวส่งการแจ้งเตือนส่งกลับมา ให้แก้ไขการส่งพุชตามปกติของ Matrix สำหรับบัญชีนี้ก่อนดำเนินการต่อ

  </Step>

  <Step title="ติดตั้งกฎพุชแบบแทนที่">
    ติดตั้งกฎที่จับคู่เครื่องหมายตัวอย่างฉบับสมบูรณ์ร่วมกับ MXID ของบอตในฐานะผู้ส่ง:

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

    - `https://matrix.example.org`: URL ฐานของโฮมเซิร์ฟเวอร์ของคุณ
    - `$USER_ACCESS_TOKEN`: โทเค็นการเข้าถึงของผู้ใช้ผู้รับ
    - `openclaw-finalized-preview-botname`: ID กฎที่ไม่ซ้ำกันสำหรับบอตแต่ละตัวต่อผู้รับแต่ละราย (รูปแบบ: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID บอต OpenClaw ของคุณ ไม่ใช่ของผู้รับ

  </Step>

  <Step title="ตรวจสอบ">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

จากนั้นทดสอบคำตอบแบบสตรีม ในโหมดเงียบ ห้องจะแสดงตัวอย่างฉบับร่างแบบเงียบและแจ้งเตือนหนึ่งครั้งเมื่อบล็อกหรือรอบการตอบเสร็จสิ้น

  </Step>
</Steps>

หากต้องการนำกฎออกในภายหลัง ให้ใช้ `DELETE` กับ URL กฎเดียวกันโดยใช้โทเค็นของผู้รับ

## หมายเหตุสำหรับหลายบอต

กฎพุชใช้ `ruleId` เป็นคีย์ การเรียก `PUT` ซ้ำกับ ID เดิมจะอัปเดตกฎเดียว สำหรับบอต OpenClaw หลายตัวที่แจ้งเตือนผู้รับรายเดียวกัน ให้สร้างกฎหนึ่งกฎต่อบอตหนึ่งตัวโดยจับคู่ผู้ส่งที่แตกต่างกัน

กฎ `override` ที่ผู้ใช้กำหนดขึ้นใหม่จะถูกแทรกไว้ก่อนกฎระงับเริ่มต้นของเซิร์ฟเวอร์ จึงไม่จำเป็นต้องมีพารามิเตอร์การจัดลำดับเพิ่มเติม กฎนี้มีผลเฉพาะกับการแก้ไขตัวอย่างที่เป็นข้อความล้วนและสามารถทำให้เสร็จสมบูรณ์ ณ ตำแหน่งเดิมได้ ส่วนคำตอบแบบสื่อ การย้อนกลับเมื่อตัวอย่างล้าสมัย และข้อความสุดท้ายที่จะเปิดใช้งานการกล่าวถึงของ Matrix จะถูกส่งเป็นข้อความแจ้งเตือนตามปกติแทน

## หมายเหตุสำหรับโฮมเซิร์ฟเวอร์

<AccordionGroup>
  <Accordion title="Synapse">
    ไม่จำเป็นต้องเปลี่ยนแปลง `homeserver.yaml` เป็นพิเศษ หากการแจ้งเตือนตามปกติของ Matrix ส่งถึงผู้ใช้นี้อยู่แล้ว ขั้นตอนการตั้งค่าหลักคือโทเค็นของผู้รับและการเรียก `pushrules` ข้างต้น

    หากคุณเรียกใช้ Synapse หลังพร็อกซีย้อนกลับหรือเวิร์กเกอร์ โปรดตรวจสอบให้แน่ใจว่า `/_matrix/client/.../pushrules/` เข้าถึง Synapse ได้อย่างถูกต้อง การส่งพุชจะได้รับการจัดการโดยโปรเซสหลักหรือ `synapse.app.pusher` / เวิร์กเกอร์ตัวส่งการแจ้งเตือนที่กำหนดค่าไว้ โปรดตรวจสอบให้แน่ใจว่าส่วนเหล่านั้นทำงานเป็นปกติ

    กฎนี้ใช้เงื่อนไขกฎพุช `event_property_is` (MSC3758, กฎพุช v1.10) ซึ่งเพิ่มเข้ามาใน Synapse เมื่อปี 2023 Synapse รุ่นเก่าจะยอมรับการเรียก `PUT pushrules/...` แต่จะไม่จับคู่เงื่อนไขโดยไม่มีการแจ้งเตือน โปรดอัปเกรด Synapse หากไม่มีการแจ้งเตือนเมื่อมีการแก้ไขตัวอย่างฉบับสมบูรณ์

  </Accordion>

  <Accordion title="Tuwunel">
    ใช้ขั้นตอนเดียวกับ Synapse โดยไม่จำเป็นต้องกำหนดค่าเฉพาะสำหรับ Tuwunel เพื่อใช้เครื่องหมายตัวอย่างฉบับสมบูรณ์

    หากการแจ้งเตือนหายไปขณะที่ผู้ใช้กำลังใช้งานอุปกรณ์อื่น ให้ตรวจสอบว่าเปิดใช้งาน `suppress_push_when_active` อยู่หรือไม่ Tuwunel เพิ่มตัวเลือกนี้ในรุ่น 1.4.2 (กันยายน 2025) และตัวเลือกนี้สามารถระงับการพุชไปยังอุปกรณ์อื่นโดยตั้งใจขณะที่อุปกรณ์หนึ่งกำลังใช้งานอยู่

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

- [การตั้งค่าช่องทาง Matrix](/th/channels/matrix)
- [แนวคิดเกี่ยวกับการสตรีม](/th/concepts/streaming)
