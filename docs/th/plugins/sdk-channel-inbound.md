---
read_when:
    - คุณกำลังสร้างหรือปรับโครงสร้างเส้นทางการรับข้อความของ Plugin ช่องทางรับส่งข้อความ
    - คุณต้องใช้การสร้างบริบทขาเข้าร่วมกัน การบันทึกเซสชัน หรือการส่งคำตอบที่เตรียมไว้
    - คุณกำลังย้ายตัวช่วยการโต้ตอบของช่องทางแบบเก่าไปยัง API สำหรับข้อความขาเข้าและข้อความ
summary: 'ตัวช่วยเหตุการณ์ขาเข้าสำหรับ Plugin ช่องทาง: การสร้างบริบท การประสานงานตัวรันร่วมกัน ระเบียนเซสชัน และการส่งคำตอบที่เตรียมไว้'
title: API ขาเข้าของช่องทาง
x-i18n:
    generated_at: "2026-07-12T16:33:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

เส้นทางการรับของช่องทางเป็นไปตามโฟลว์เดียว:

```text
เหตุการณ์จากแพลตฟอร์ม -> ข้อเท็จจริง/บริบทขาเข้า -> การตอบกลับของเอเจนต์ -> การส่งข้อความ
```

ใช้ `openclaw/plugin-sdk/channel-inbound` สำหรับการปรับเหตุการณ์ขาเข้าให้เป็นมาตรฐาน
การจัดรูปแบบ รูท และการประสานงาน ใช้
`openclaw/plugin-sdk/channel-outbound` สำหรับการส่งแบบเนทีฟ ใบรับรอง การส่งมอบที่คงทน
และลักษณะการทำงานของตัวอย่างแบบสด

## ตัวช่วยหลัก

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: แปลงข้อเท็จจริงของช่องทางที่ปรับเป็นมาตรฐานแล้ว
  ไปเป็นบริบทของพรอมต์/เซสชัน ส่งข้อมูลเมตาของผู้ส่ง/แชตที่ช่องทางเป็นเจ้าของ
  ผ่าน `channelContext` ซึ่งฮุกของ Plugin จะเห็นเป็น `ctx.channelContext`
  ขยาย `PluginHookChannelSenderContext` หรือ `PluginHookChannelChatContext`
  จากพาธย่อยนี้สำหรับฟิลด์เฉพาะช่องทาง
- `runChannelInboundEvent(...)`: ดำเนินการนำเข้า จำแนก ตรวจสอบเบื้องต้น แก้ไข
  บันทึก กระจาย และปิดท้ายสำหรับเหตุการณ์ขาเข้าจากแพลตฟอร์มหนึ่งเหตุการณ์
- `dispatchChannelInboundReply(...)`: บันทึกและกระจายการตอบกลับขาเข้าที่ประกอบเสร็จแล้ว
  ด้วยอะแดปเตอร์การส่งมอบ

ช่องทางแบบรวมมาให้/เนทีฟที่ได้รับออบเจ็กต์รันไทม์ของ Plugin ซึ่งฉีดเข้ามาแล้ว
สามารถเรียกตัวช่วยเดียวกันภายใต้ `runtime.channel.inbound.*` แทนการนำเข้า
พาธย่อยนี้โดยตรง:

```ts
await runtime.channel.inbound.run({
  channel: "demo",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest: normalizePlatformEvent,
    resolveTurn: resolveInboundReply,
  },
});
```

ประกอบอินพุตของ `dispatchChannelInboundReply(...)` สำหรับตัวกระจายที่รองรับความเข้ากันได้
ซึ่งเก็บการส่งมอบของแพลตฟอร์มไว้ในอะแดปเตอร์การส่งมอบ พาธการส่งใหม่
ควรใช้อะแดปเตอร์ข้อความและตัวช่วยข้อความที่คงทนจาก
`channel-outbound` แทน

## การย้ายระบบ

นามแฝงรันไทม์ `runtime.channel.turn.*` ถูกนำออกแล้ว ให้ใช้:

- `runtime.channel.inbound.run(...)` สำหรับเหตุการณ์ขาเข้าดิบ
- `runtime.channel.inbound.dispatchReply(...)` สำหรับบริบทการตอบกลับที่ประกอบแล้ว
- `runtime.channel.inbound.buildContext(...)` สำหรับเพย์โหลดบริบทขาเข้า
- `runtime.channel.inbound.runPreparedReply(...)` ซึ่งเลิกแนะนำให้ใช้แล้ว ใช้เฉพาะกับ
  พาธการกระจายที่ช่องทางเป็นเจ้าของและเตรียมไว้แล้ว ซึ่งประกอบคลอเชอร์
  การกระจายของตนเองไว้เรียบร้อยแล้ว

โค้ด Plugin ใหม่ไม่ควรเพิ่ม API ช่องทางที่มีชื่อว่า `turn` ให้เก็บคำศัพท์เกี่ยวกับรอบของโมเดลหรือ
เอเจนต์ไว้ภายในโค้ดเอเจนต์/ผู้ให้บริการ ส่วน Plugin ช่องทางให้ใช้คำว่าขาเข้า
ข้อความ การส่งมอบ และการตอบกลับ
